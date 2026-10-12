import AsyncStorage, {isStructuredUnavailableError, readOwnedItem} from '../services/secureAsyncStorage';
import {migrateRecordSafely, sealField, sealMapFields} from '../services/legacyFieldMigration';
import {commitOptimistic} from '../services/saveFailure';
import {registerOwnerStore} from './ownerStoreRegistry';
import {
  carrySealedField,
  decryptFieldValue,
  dropCarriedSealedFields,
  encryptFieldValue,
  hasCarriedSealedFields,
  isEncryptedFieldPayload,
  restoreSealedFields,
  withCarriedSealedFields,
} from '../services/atRestFieldEncryption';

// Contraception's OWN daily-journal store — holds ONLY 'feelings' and
// 'notes', the two categories that have nowhere else to live. Deliberately
// does NOT duplicate 'intake' tracking: that Journal quotidien category
// reads/writes the existing contraceptionIntakeHistoryStore (one
// taken/late/missed record per day), never a second history store. One
// entry per calendar day, keyed the same 'YYYY-MM-DD' way every other
// journal-style store in this project uses (see miscarriageJournalStore.ts,
// the closest architectural reference).
export type ContraceptionJournalEntry = {
  date: string;
  feelings?: string[];
  notes?: string;
};

const STORAGE_KEY = '@hawa/contraception-journal/v1';

type EntriesByDate = Record<string, ContraceptionJournalEntry>;

let entries: EntriesByDate = {};
const listeners = new Set<() => void>();
let hydration: Promise<EntriesByDate> | null = null;
let hydrated = false;
// Bumped by every reset (ownerStoreRegistry): a read that started before it must not land in the fresh memory.
let readGeneration = 0;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const isValidEntry = (value: unknown): value is ContraceptionJournalEntry => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<ContraceptionJournalEntry>;
  if (typeof candidate.date !== 'string') {
    return false;
  }
  return (
    (candidate.feelings === undefined ||
      (Array.isArray(candidate.feelings) &&
        candidate.feelings.every(item => typeof item === 'string'))) &&
    (candidate.notes === undefined || typeof candidate.notes === 'string')
  );
};

// `feelings` is a structured multi-select tag list; `notes` is the only
// genuine free-text field in this store ("Notes du jour") and the only one
// encrypted at rest.
const ENCRYPTION_SERVICE = 'com.hawa.private.contraception-journal.encryption-key';

async function encryptEntryForStorage(entry: ContraceptionJournalEntry): Promise<Record<string, unknown>> {
  const output: Record<string, unknown> = {...entry};
  if (typeof entry.notes === 'string' && entry.notes.length > 0) {
    output.notes = await encryptFieldValue(ENCRYPTION_SERVICE, entry.notes);
  } else {
    delete output.notes;
  }
  // A note that could not be decrypted when this entry was read goes back as the sealed payload it was.
  return restoreSealedFields(output);
}

async function decryptEntryFromStorage(raw: Record<string, unknown>): Promise<Record<string, unknown>> {
  const output: Record<string, unknown> = {...raw};
  if (isEncryptedFieldPayload(raw.notes)) {
    try {
      output.notes = await decryptFieldValue<string>(ENCRYPTION_SERVICE, raw.notes);
    } catch {
      delete output.notes;
      carrySealedField(output, 'notes', raw.notes);
    }
  }
  return output;
}

// A refused/failed write REJECTS (see services/saveFailure.ts) and the in-memory entries go back to what they were.
const persist = async () => {
  const serializable: Record<string, unknown> = {};
  for (const [date, entry] of Object.entries(entries)) {
    serializable[date] = await encryptEntryForStorage(entry);
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
};

const commit = (previous: EntriesByDate): Promise<void> =>
  commitOptimistic(previous, () => entries, restored => {
    entries = restored;
    notifyListeners();
  }, persist);

export const getContraceptionJournalEntry = (
  date: string,
): ContraceptionJournalEntry | undefined =>
  entries[date] ? {...entries[date]} : undefined;

/** THE single canonical way to record a Contraception daily-tracking
 * answer — used by ContraceptionJournalEntryScreen (and nowhere else; do
 * not duplicate this call). Generic over the field so each category keeps
 * its own real type (string[] for feelings, string for notes). */
export async function saveContraceptionJournalField<
  K extends Exclude<keyof ContraceptionJournalEntry, 'date'>,
>(
  date: string,
  category: K,
  value: NonNullable<ContraceptionJournalEntry[K]>,
): Promise<void> {
  const previous = entries;
  entries = {
    ...entries,
    [date]: withCarriedSealedFields(entries[date], {...entries[date], date, [category]: value}),
  };
  notifyListeners();
  await commit(previous);
}

/** THE single canonical way to REMOVE a Contraception daily-tracking answer
 * (correcting an accidental "Effets ressentis" / clearing a note) — the
 * counterpart of saveContraceptionJournalField, used by
 * ContraceptionJournalEntryScreen (and nowhere else). Removes just that
 * field; when the day is left with neither feelings nor a note the whole
 * entry is dropped, so nothing is left behind. The persisted copy is rebuilt
 * from the in-memory map by persist(), which never writes an absent note, so
 * the ENCRYPTED note value is removed from storage too. No-op when there is
 * nothing to remove. The existing at-rest encryption is unchanged. */
export async function clearContraceptionJournalField(
  date: string,
  category: Exclude<keyof ContraceptionJournalEntry, 'date'>,
): Promise<void> {
  const current = entries[date];
  if (!current || current[category] === undefined) {
    return;
  }

  // Deliberately clearing a field that was readable also releases any payload carried for it.
  const next: ContraceptionJournalEntry = dropCarriedSealedFields({...current}, [category]);
  delete next[category];

  const remaining = {...entries};
  // A note that could not be read is still content: the day is not dropped while its sealed payload is carried.
  if ((next.feelings?.length ?? 0) > 0 || Boolean(next.notes) || hasCarriedSealedFields(next, ['notes'])) {
    remaining[date] = next;
  } else {
    delete remaining[date];
  }
  const previous = entries;
  entries = remaining;

  notifyListeners();
  await commit(previous);
}

export const hydrateContraceptionJournal = (): Promise<EntriesByDate> => {
  if (hydrated) {
    return Promise.resolve({...entries});
  }
  if (!hydration) {
    const generation = readGeneration;
    hydration = readOwnedItem(STORAGE_KEY, hydrateContraceptionJournal)
      .then(async raw => {
        if (generation !== readGeneration) {return {...entries};} // reset while reading: stale
        hydrated = true;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            const valid: EntriesByDate = {};
            for (const [key, rawValue] of Object.entries(
              parsed as Record<string, unknown>,
            )) {
              if (!rawValue || typeof rawValue !== 'object') {continue;}
              const decrypted = await decryptEntryFromStorage(rawValue as Record<string, unknown>);
              if (isValidEntry(decrypted)) {
                valid[key] = decrypted;
              }
            }
            if (generation !== readGeneration) {return {...entries};}
            entries = valid;
            notifyListeners();
          }
        }
        return {...entries};
      })
      .catch(error => {
        if (generation !== readGeneration) {return {...entries};} // reset while reading: stale
        if (isStructuredUnavailableError(error)) {
          // not latched: a later hydrate (or "Try again") re-reads the real record
          hydration = null;
          return {...entries};
        }
        hydrated = true;
        return {...entries};
      });
  }
  return hydration;
};

export const subscribeContraceptionJournal = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// Owner-only record, not profile-scoped: dropped and re-read after a backup restore / data deletion, or reset in
// memory only after a full wipe (see ownerStoreRegistry.ts). Reload only reads (never writes, never recreates a key); the
// in-memory sealed-field carry is rebuilt by that read and dropped by the reset — it is never persisted.
const resetMemory = (): void => {
  readGeneration += 1;
  entries = {};
  hydration = null;
  hydrated = false;
  notifyListeners();
};
registerOwnerStore('contraception-journal', {
  reload: () => {
    resetMemory();
    return hydrateContraceptionJournal();
  },
  resetToDefaults: resetMemory,
});

/**
 * Idempotent, interruption-safe boot-time migration of every day's notes saved as plain text before field-level
 * encryption existed. Works on the PERSISTED record only (never on the store's memoised in-memory state): see
 * services/legacyFieldMigration.ts. Unreadable/unavailable record -> nothing is written, the next launch retries.
 */
export async function migrateLegacyPlainContraceptionNotes(): Promise<void> {
  const outcome = await migrateRecordSafely(STORAGE_KEY, parsed =>
    sealMapFields(parsed, ['notes'], value => sealField(ENCRYPTION_SERVICE, value)),
  );
  // Same observable behaviour as before: a store whose record was just migrated is loaded (read-only) afterwards.
  if (outcome === 'migrated') {
    await hydrateContraceptionJournal();
  }
}
