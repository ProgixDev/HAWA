import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  decryptFieldValue,
  encryptFieldValue,
  isEncryptedFieldPayload,
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
  return output;
}

async function decryptEntryFromStorage(raw: Record<string, unknown>): Promise<Record<string, unknown>> {
  const output: Record<string, unknown> = {...raw};
  if (isEncryptedFieldPayload(raw.notes)) {
    try {
      output.notes = await decryptFieldValue<string>(ENCRYPTION_SERVICE, raw.notes);
    } catch {
      delete output.notes;
    }
  }
  return output;
}

const persist = async () => {
  try {
    const serializable: Record<string, unknown> = {};
    for (const [date, entry] of Object.entries(entries)) {
      serializable[date] = await encryptEntryForStorage(entry);
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    // never throw out of a save action
  }
};

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
  entries = {
    ...entries,
    [date]: {...entries[date], date, [category]: value},
  };
  notifyListeners();
  await persist();
}

export const hydrateContraceptionJournal = (): Promise<EntriesByDate> => {
  if (hydrated) {
    return Promise.resolve({...entries});
  }
  if (!hydration) {
    hydration = AsyncStorage.getItem(STORAGE_KEY)
      .then(async raw => {
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
            entries = valid;
            notifyListeners();
          }
        }
        return {...entries};
      })
      .catch(() => {
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

/**
 * Idempotent boot-time migration: re-saves any entry whose `notes` is still
 * a plain string, encrypting it via the same at-rest scheme as every other
 * sensitive journal field. No-ops if no plaintext note is found (safe to
 * call on every app launch).
 */
export async function migrateLegacyPlainContraceptionNotes(): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {return;}
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') {return;}
  const hasLegacyPlainNote = Object.values(parsed as Record<string, unknown>).some(rawEntry => {
    if (!rawEntry || typeof rawEntry !== 'object') {return false;}
    return typeof (rawEntry as Record<string, unknown>).notes === 'string';
  });
  if (!hasLegacyPlainNote) {return;}
  await hydrateContraceptionJournal();
  await persist();
}
