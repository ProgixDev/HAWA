import AsyncStorage from '@react-native-async-storage/async-storage';

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

const persist = () =>
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries)).catch(() => {});

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
      .then(raw => {
        hydrated = true;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            const valid: EntriesByDate = {};
            for (const [key, value] of Object.entries(
              parsed as Record<string, unknown>,
            )) {
              if (isValidEntry(value)) {
                valid[key] = value;
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
