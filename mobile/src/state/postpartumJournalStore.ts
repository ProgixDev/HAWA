import AsyncStorage from '@react-native-async-storage/async-storage';

// Postpartum's OWN daily tracking store — deliberately separate from
// dailyJournalStore.ts (Cycle/shared mood-sleep-hydration-activity-note
// entries, which also carry Cycle-specific fields like `flow`/
// `temperature`/`intimacy` that must never leak into Postpartum) and from
// pregnancyJournalStore.ts. One entry per calendar day, keyed the same
// 'YYYY-MM-DD' way every other journal-style store in this project uses.
//
// Categories are Postpartum-specific (Fatigue / Sommeil / Humeur / Douleurs
// / Récupération physique) — a DIFFERENT shape from Pregnancy's Journal
// quotidien (Symptômes / Poids / Humeur / Sommeil / Informations médicales
// personnelles) by design; the two objectives track different things and
// must never share a category list or a store.
export type PostpartumJournalCategory = 'fatigue' | 'sleep' | 'mood' | 'pain' | 'physicalRecovery';

export type PostpartumJournalEntry = {
  date: string;
  fatigue?: string;
  sleep?: string;
  /** Optional sleep duration in hours (supports half-hours) — a secondary
   * field alongside `sleep` (quality); completion for "sleep" is still
   * governed only by `sleep` itself. */
  sleepDuration?: number;
  mood?: string;
  /** Optional free-text note attached to the day's mood — a secondary
   * field; completion for the "mood" category is still governed only by
   * `mood` itself. */
  moodNote?: string;
  pain?: string;
  physicalRecovery?: string;
};

// Bumped to v3 — Fatigue/Douleurs/Récupération physique is a different,
// incompatible shape from the previous v2 (Symptômes/Poids/Informations
// médicales) schema; a fresh key avoids any stale-field ambiguity rather
// than silently carrying over data under fields that no longer exist.
const STORAGE_KEY = '@hawa/postpartum-journal/v3';

type EntriesByDate = Record<string, PostpartumJournalEntry>;

let entries: EntriesByDate = {};
const listeners = new Set<() => void>();
let hydration: Promise<EntriesByDate> | null = null;
let hydrated = false;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const isValidEntry = (value: unknown): value is PostpartumJournalEntry => {
  if (!value || typeof value !== 'object') {return false;}
  const candidate = value as Partial<PostpartumJournalEntry>;
  if (typeof candidate.date !== 'string') {return false;}
  return (
    (candidate.fatigue === undefined || typeof candidate.fatigue === 'string') &&
    (candidate.sleep === undefined || typeof candidate.sleep === 'string') &&
    (candidate.sleepDuration === undefined || typeof candidate.sleepDuration === 'number') &&
    (candidate.mood === undefined || typeof candidate.mood === 'string') &&
    (candidate.moodNote === undefined || typeof candidate.moodNote === 'string') &&
    (candidate.pain === undefined || typeof candidate.pain === 'string') &&
    (candidate.physicalRecovery === undefined || typeof candidate.physicalRecovery === 'string')
  );
};

const persist = () => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries)).catch(() => {});

export const getPostpartumJournalEntry = (date: string): PostpartumJournalEntry | undefined =>
  entries[date] ? {...entries[date]} : undefined;

/** Every entry, keyed by date — used by the Postpartum Calendar/Statistics
 * to derive counts/averages across a whole history without guessing dates
 * one by one. Mirrors dailyJournalStore's getAllJournalEntries. */
export const getAllPostpartumJournalEntries = (): EntriesByDate => ({...entries});

/** THE single canonical way to record a Postpartum daily-tracking answer —
 * used by PostpartumJournalEntryScreen (and nowhere else; do not duplicate
 * this call). Generic over the field so each category keeps its own real
 * type (number for sleepDuration, string elsewhere). */
export async function savePostpartumJournalField<K extends Exclude<keyof PostpartumJournalEntry, 'date'>>(
  date: string,
  category: K,
  value: NonNullable<PostpartumJournalEntry[K]>,
): Promise<void> {
  entries = {...entries, [date]: {...entries[date], date, [category]: value}};
  notifyListeners();
  await persist();
}

export const hydratePostpartumJournal = (): Promise<EntriesByDate> => {
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
            for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
              if (isValidEntry(value)) {valid[key] = value;}
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

export const subscribePostpartumJournal = (listener: () => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};
