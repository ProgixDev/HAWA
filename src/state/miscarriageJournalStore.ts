import AsyncStorage from '@react-native-async-storage/async-storage';

import type { MiscarriageTryingAgainStatus } from './miscarriagePreferences';

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

const persist = () =>
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries)).catch(() => {});

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
  entries = {
    ...entries,
    [date]: { ...entries[date], date, [category]: value },
  };
  notifyListeners();
  await persist();
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
        return { ...entries };
      })
      .catch(() => {
        hydrated = true;
        return { ...entries };
      });
  }
  return hydration;
};

export const subscribeMiscarriageJournal = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
