import AsyncStorage, {isStructuredUnavailableError, readOwnedItem} from '../services/secureAsyncStorage';
import {migrateRecordSafely, sealField, sealMapFields} from '../services/legacyFieldMigration';
import {commitOptimistic} from '../services/saveFailure';

import type { MiscarriageTryingAgainStatus } from './miscarriagePreferences';
import {
  decryptFieldValue,
  encryptFieldValue,
  isEncryptedFieldPayload,
} from '../services/atRestFieldEncryption';

// Miscarriage's OWN daily tracking store — deliberately separate from
// dailyJournalStore.ts (Cycle/shared mood-sleep-hydration-activity-note
// entries), pregnancyJournalStore.ts and postpartumJournalStore.ts. One
// entry per calendar day, keyed the same 'YYYY-MM-DD' way every other
// journal-style store in this project uses.
//
// Categories are exactly the 4 required by "Après une fausse couche":
// Saignements / Symptômes physiques / Notes personnelles / Reprise des
// essais — a DIFFERENT shape from every other objective's Journal
// quotidien by design; must never share a category list or a store.
export type MiscarriageJournalCategory =
  | 'bleeding'
  | 'physicalSymptoms'
  | 'personalNotes'
  | 'tryingAgain';

export type MiscarriageJournalEntry = {
  date: string;
  /** 'Absent' | 'Léger' | 'Modéré' | 'Important' */
  bleeding?: string;
  bleedingColor?: string;
  bleedingStartDate?: string;
  /** Optional free-text note (color/duration/evolution) attached to the
   * day's bleeding entry — completion for "bleeding" is still governed only
   * by `bleeding` itself. */
  bleedingNote?: string;
  physicalSymptoms?: string[];
  /** Optional free-text note attached to the day's symptoms — completion
   * for "physicalSymptoms" is still governed only by the array itself. */
  physicalSymptomsNote?: string;
  personalNotes?: string;
  /** Same value domain as miscarriagePreferences.tryingAgainStatus — saving
   * this here (see MiscarriageJournalEntryScreen) ALSO updates the
   * canonical preference so it stays the single current answer, while this
   * date-keyed copy lets "Suivi du jour" know whether TODAY specifically
   * was checked in on. Never auto-switches activeObjective (see
   * setMiscarriageTryingAgainStatus). */
  tryingAgain?: MiscarriageTryingAgainStatus;
};

const STORAGE_KEY = '@hawa/miscarriage-journal/v1';

type EntriesByDate = Record<string, MiscarriageJournalEntry>;

let entries: EntriesByDate = {};
const listeners = new Set<() => void>();
let hydration: Promise<EntriesByDate> | null = null;
let hydrated = false;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const isValidEntry = (value: unknown): value is MiscarriageJournalEntry => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<MiscarriageJournalEntry>;
  if (typeof candidate.date !== 'string') {
    return false;
  }
  return (
    (candidate.bleeding === undefined ||
      typeof candidate.bleeding === 'string') &&
    (candidate.bleedingColor === undefined ||
      typeof candidate.bleedingColor === 'string') &&
    (candidate.bleedingStartDate === undefined ||
      typeof candidate.bleedingStartDate === 'string') &&
    (candidate.bleedingNote === undefined ||
      typeof candidate.bleedingNote === 'string') &&
    (candidate.physicalSymptoms === undefined ||
      (Array.isArray(candidate.physicalSymptoms) &&
        candidate.physicalSymptoms.every(item => typeof item === 'string'))) &&
    (candidate.physicalSymptomsNote === undefined ||
      typeof candidate.physicalSymptomsNote === 'string') &&
    (candidate.personalNotes === undefined ||
      typeof candidate.personalNotes === 'string') &&
    (candidate.tryingAgain === undefined ||
      candidate.tryingAgain === 'not_now' ||
      candidate.tryingAgain === 'soon' ||
      candidate.tryingAgain === 'ready')
  );
};

// Encryption at rest — "Notes personnelles" (`personalNotes`) plus the two
// free-text annotations attached to bleeding/physicalSymptoms are the
// sensitive fields in this store; `bleeding`/`physicalSymptoms`/`tryingAgain`
// stay plaintext (structured tracking values, not narrative text). Encrypted
// ONLY at the AsyncStorage persistence boundary — the in-memory `entries`
// object and every function above (`getMiscarriageJournalEntry`,
// `getAllMiscarriageJournalEntries`) always deal in plain decrypted strings,
// so no screen needs to change. Same AES-256-GCM mechanism as
// privateNotesEncryption.ts, own Keychain service so a future rotation of
// one domain never affects another.
const ENCRYPTION_SERVICE = 'com.hawa.private.miscarriage-journal.encryption-key';
const SENSITIVE_FIELDS = ['personalNotes', 'bleedingNote', 'physicalSymptomsNote'] as const;

async function encryptEntryForStorage(entry: MiscarriageJournalEntry): Promise<Record<string, unknown>> {
  const output: Record<string, unknown> = {...entry};
  for (const field of SENSITIVE_FIELDS) {
    const value = entry[field];
    if (typeof value === 'string' && value.length > 0) {
      output[field] = await encryptFieldValue(ENCRYPTION_SERVICE, value);
    } else {
      delete output[field];
    }
  }
  return output;
}

/** Read-time resolution: accepts either an already-encrypted payload or a
 * legacy plaintext string for each sensitive field (entries saved before
 * this store adopted encryption-at-rest). A corrupted encrypted payload
 * resolves to the field being absent — never thrown, never crashes hydration
 * — matching resolveNoteSection()'s established corrupted-payload handling
 * in privateNotesEncryption.ts. Never logs field content. */
async function decryptEntryFromStorage(raw: Record<string, unknown>): Promise<MiscarriageJournalEntry> {
  const output: Record<string, unknown> = {...raw};
  for (const field of SENSITIVE_FIELDS) {
    const value = raw[field];
    if (isEncryptedFieldPayload(value)) {
      try {
        output[field] = await decryptFieldValue<string>(ENCRYPTION_SERVICE, value);
      } catch {
        delete output[field];
      }
    }
    // A plain string is legacy plaintext — already the correct in-memory
    // shape, left as-is; the next persist() call encrypts it.
  }
  return output as MiscarriageJournalEntry;
}

// A refused/failed write REJECTS (see services/saveFailure.ts) and the in-memory entries go back to what they were, so
// no screen keeps presenting an edit that was not persisted.
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

export const getMiscarriageJournalEntry = (
  date: string,
): MiscarriageJournalEntry | undefined =>
  entries[date] ? { ...entries[date] } : undefined;

/** Every entry, keyed by date — mirrors postpartumJournalStore's
 * getAllPostpartumJournalEntries, for future Calendar/Statistics use. */
export const getAllMiscarriageJournalEntries = (): EntriesByDate => ({
  ...entries,
});

/** THE single canonical way to record a Miscarriage daily-tracking answer —
 * used by MiscarriageJournalEntryScreen (and nowhere else; do not duplicate
 * this call). Generic over the field so each category keeps its own real
 * type (string[] for physicalSymptoms, string elsewhere). */
export async function saveMiscarriageJournalField<
  K extends Exclude<keyof MiscarriageJournalEntry, 'date'>,
>(
  date: string,
  category: K,
  value: NonNullable<MiscarriageJournalEntry[K]>,
): Promise<void> {
  const previous = entries;
  entries = {
    ...entries,
    [date]: { ...entries[date], date, [category]: value },
  };
  notifyListeners();
  await commit(previous);
}

/** Whether a given day's entry has real data for a category — the ONE place
 * this is decided, so the Dashboard's "Suivi du jour" completion count can
 * never drift from what the journal actually persisted. A plain `Boolean`
 * cast on the field isn't enough for `physicalSymptoms` (an array, whose
 * empty-array form is still truthy). */
export const isMiscarriageCategoryCompleted = (
  entry: MiscarriageJournalEntry | undefined,
  category: MiscarriageJournalCategory,
): boolean => {
  switch (category) {
    case 'bleeding':
      return Boolean(entry?.bleeding);
    case 'physicalSymptoms':
      return Boolean(entry?.physicalSymptoms?.length);
    case 'personalNotes':
      return Boolean(entry?.personalNotes?.trim());
    case 'tryingAgain':
      return Boolean(entry?.tryingAgain);
    default:
      return false;
  }
};

export const hydrateMiscarriageJournal = (): Promise<EntriesByDate> => {
  if (hydrated) {
    return Promise.resolve({ ...entries });
  }
  if (!hydration) {
    hydration = readOwnedItem(STORAGE_KEY, hydrateMiscarriageJournal)
      .then(async raw => {
        hydrated = true;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            const valid: EntriesByDate = {};
            for (const [key, value] of Object.entries(
              parsed as Record<string, unknown>,
            )) {
              if (!value || typeof value !== 'object') {continue;}
              const decrypted = await decryptEntryFromStorage(value as Record<string, unknown>);
              if (isValidEntry(decrypted)) {
                valid[key] = decrypted;
              }
            }
            entries = valid;
            notifyListeners();
          }
        }
        return { ...entries };
      })
      .catch(error => {
        if (isStructuredUnavailableError(error)) {
          // not latched: a later hydrate (or "Try again") re-reads the real record
          hydration = null;
          return { ...entries };
        }
        hydrated = true;
        return { ...entries };
      });
  }
  return hydration;
};

/**
 * Idempotent, interruption-safe boot-time migration of every day's personalNotes/bleedingNote/physicalSymptomsNote saved as plain text before field-level
 * encryption existed. Works on the PERSISTED record only (never on the store's memoised in-memory state): see
 * services/legacyFieldMigration.ts. Unreadable/unavailable record -> nothing is written, the next launch retries.
 */
export async function migrateLegacyPlainMiscarriageNotes(): Promise<void> {
  const outcome = await migrateRecordSafely(STORAGE_KEY, parsed =>
    sealMapFields(parsed, SENSITIVE_FIELDS, value => sealField(ENCRYPTION_SERVICE, value)),
  );
  // Same observable behaviour as before: a store whose record was just migrated is loaded (read-only) afterwards.
  if (outcome === 'migrated') {
    await hydrateMiscarriageJournal();
  }
}

export const subscribeMiscarriageJournal = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
