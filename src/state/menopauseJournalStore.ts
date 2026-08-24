import AsyncStorage from '@react-native-async-storage/async-storage';

import type {MenopauseSymptom} from './menopausePreferences';
import type {MoodLevel} from '../types/journal';

// Menopause's OWN daily tracking source — deliberately separate from
// dailyJournalStore.ts (Cycle), pregnancyJournalStore.ts, postpartumJournalStore.ts,
// miscarriageJournalStore.ts and contraceptionJournalStore.ts. ONE canonical
// store, consumed identically by MenopauseDashboard ("Suivi du jour"),
// MenopauseJournalEntryScreen, MenopauseCalendarContent and
// MenopauseStatisticsScreen — never a separate per-screen data shape. One
// entry per calendar day, keyed the same 'YYYY-MM-DD' convention every other
// journal-style store in this project uses. Tracking only: this file never
// interprets a symptom/mood/sleep/energy/treatment/lab value — it only
// stores what the user reported.
export type MenopauseIntensity = 'mild' | 'moderate' | 'severe';
export type MenopauseSleepQuality = 'good' | 'average' | 'poor';
export type MenopauseEnergyLevel = 'low' | 'medium' | 'high';
export type MenopauseTreatmentStatus = 'taken' | 'not_taken';
export type MenopauseLabType = 'fsh' | 'estradiol';

export type MenopauseJournalCategory =
  | 'symptoms'
  | 'mood'
  | 'sleep'
  | 'energy'
  | 'treatment'
  | 'labResults'
  | 'notes';

export type MenopauseJournalEntry = {
  date: string;
  symptoms?: MenopauseSymptom[];
  /** User-perceived intensity for the day's symptoms as a whole — never a
   * medical severity classification. */
  symptomIntensity?: MenopauseIntensity;
  /** Same value domain as the project's shared MoodLevel taxonomy
   * (src/types/journal.ts) — reused so this never becomes a second,
   * incompatible mood system. */
  mood?: MoodLevel;
  sleepDurationHours?: number;
  sleepQuality?: MenopauseSleepQuality;
  energyLevel?: MenopauseEnergyLevel;
  treatmentStatus?: MenopauseTreatmentStatus;
  /** Free-text tracking note only — never a dose, schedule or
   * recommendation. Plaintext, consistent with every other
   * objective-specific journal note field in this codebase today (see
   * TODO.md §1.19's encryption scope note) — not a new, worse gap. */
  treatmentNote?: string;
  notes?: string;
};

export type MenopauseLabResult = {
  id: string;
  type: MenopauseLabType;
  value: number;
  unit?: string;
  /** 'YYYY-MM-DD' — the date the result applies to, not necessarily today. */
  date: string;
  recordedAt: string;
};

const ENTRIES_STORAGE_KEY = '@hawa/menopause-journal/v1';
const LAB_RESULTS_STORAGE_KEY = '@hawa/menopause-lab-results/v1';

type EntriesByDate = Record<string, MenopauseJournalEntry>;

let entries: EntriesByDate = {};
let labResults: MenopauseLabResult[] = [];
const listeners = new Set<() => void>();
let hydration: Promise<void> | null = null;
let hydrated = false;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const isValidSymptom = (value: unknown): value is MenopauseSymptom =>
  value === 'hot_flashes' ||
  value === 'night_sweats' ||
  value === 'sleep_disturbances' ||
  value === 'fatigue' ||
  value === 'mood_changes' ||
  value === 'brain_fog';

const isValidIntensity = (value: unknown): value is MenopauseIntensity =>
  value === 'mild' || value === 'moderate' || value === 'severe';

const isValidMood = (value: unknown): value is MoodLevel =>
  value === 'veryGood' || value === 'good' || value === 'neutral' || value === 'stressed' ||
  value === 'irritable' || value === 'anxious' || value === 'sad' || value === 'tired' || value === 'motivated';

const isValidSleepQuality = (value: unknown): value is MenopauseSleepQuality =>
  value === 'good' || value === 'average' || value === 'poor';

const isValidEnergyLevel = (value: unknown): value is MenopauseEnergyLevel =>
  value === 'low' || value === 'medium' || value === 'high';

const isValidTreatmentStatus = (value: unknown): value is MenopauseTreatmentStatus =>
  value === 'taken' || value === 'not_taken';

const isValidEntry = (value: unknown): value is MenopauseJournalEntry => {
  if (!value || typeof value !== 'object') {return false;}
  const candidate = value as Partial<MenopauseJournalEntry>;
  if (typeof candidate.date !== 'string') {return false;}
  return (
    (candidate.symptoms === undefined || (Array.isArray(candidate.symptoms) && candidate.symptoms.every(isValidSymptom))) &&
    (candidate.symptomIntensity === undefined || isValidIntensity(candidate.symptomIntensity)) &&
    (candidate.mood === undefined || isValidMood(candidate.mood)) &&
    (candidate.sleepDurationHours === undefined || typeof candidate.sleepDurationHours === 'number') &&
    (candidate.sleepQuality === undefined || isValidSleepQuality(candidate.sleepQuality)) &&
    (candidate.energyLevel === undefined || isValidEnergyLevel(candidate.energyLevel)) &&
    (candidate.treatmentStatus === undefined || isValidTreatmentStatus(candidate.treatmentStatus)) &&
    (candidate.treatmentNote === undefined || typeof candidate.treatmentNote === 'string') &&
    (candidate.notes === undefined || typeof candidate.notes === 'string')
  );
};

const isValidLabResult = (value: unknown): value is MenopauseLabResult => {
  if (!value || typeof value !== 'object') {return false;}
  const candidate = value as Partial<MenopauseLabResult>;
  return (
    typeof candidate.id === 'string' &&
    (candidate.type === 'fsh' || candidate.type === 'estradiol') &&
    typeof candidate.value === 'number' &&
    (candidate.unit === undefined || typeof candidate.unit === 'string') &&
    typeof candidate.date === 'string' &&
    typeof candidate.recordedAt === 'string'
  );
};

const persistEntries = () =>
  AsyncStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(entries)).catch(() => {});

const persistLabResults = () =>
  AsyncStorage.setItem(LAB_RESULTS_STORAGE_KEY, JSON.stringify(labResults)).catch(() => {});

export const getMenopauseJournalEntry = (date: string): MenopauseJournalEntry | undefined =>
  entries[date] ? {...entries[date]} : undefined;

export const getAllMenopauseJournalEntries = (): EntriesByDate => ({...entries});

/** THE single canonical way to record a Menopause daily-tracking answer —
 * used by MenopauseJournalEntryScreen (and nowhere else; do not duplicate
 * this call). Generic over the field so each category keeps its own real
 * type (string[] for symptoms, string elsewhere). */
export async function saveMenopauseJournalField<K extends Exclude<keyof MenopauseJournalEntry, 'date'>>(
  date: string,
  category: K,
  value: NonNullable<MenopauseJournalEntry[K]>,
): Promise<void> {
  entries = {...entries, [date]: {...entries[date], date, [category]: value}};
  notifyListeners();
  await persistEntries();
}

/** Whether a given day's entry has real data for a category — the ONE place
 * this is decided, so "Suivi du jour"/Calendar markers/Statistics can never
 * drift from what the journal actually persisted. */
export const isMenopauseCategoryCompleted = (
  entry: MenopauseJournalEntry | undefined,
  category: MenopauseJournalCategory,
): boolean => {
  switch (category) {
    case 'symptoms':
      return Boolean(entry?.symptoms?.length);
    case 'mood':
      return Boolean(entry?.mood);
    case 'sleep':
      return entry?.sleepDurationHours !== undefined || Boolean(entry?.sleepQuality);
    case 'energy':
      return Boolean(entry?.energyLevel);
    case 'treatment':
      return Boolean(entry?.treatmentStatus);
    case 'notes':
      return Boolean(entry?.notes?.trim());
    case 'labResults':
      return false; // labResults completion is derived from the separate lab-results list, not the day entry.
    default:
      return false;
  }
};

/** THE single canonical way to record a biological result (FSH/Estradiol) —
 * used by MenopauseJournalEntryScreen (and nowhere else; do not duplicate
 * this call). Tracking data only — never interpreted, never thresholded. */
export async function addMenopauseLabResult(result: Omit<MenopauseLabResult, 'id' | 'recordedAt'>): Promise<void> {
  const entry: MenopauseLabResult = {
    ...result,
    id: `${result.type}-${result.date}-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    recordedAt: new Date().toISOString(),
  };
  labResults = [...labResults, entry];
  notifyListeners();
  await persistLabResults();
}

export const getMenopauseLabResults = (type?: MenopauseLabType): MenopauseLabResult[] => {
  const all = [...labResults].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return type ? all.filter(result => result.type === type) : all;
};

export const getLatestMenopauseLabResult = (type: MenopauseLabType): MenopauseLabResult | undefined =>
  getMenopauseLabResults(type)[0];

export const deleteMenopauseLabResult = async (id: string): Promise<void> => {
  labResults = labResults.filter(result => result.id !== id);
  notifyListeners();
  await persistLabResults();
};

export const hydrateMenopauseJournal = (): Promise<void> => {
  if (hydrated) {
    return Promise.resolve();
  }
  if (!hydration) {
    hydration = Promise.all([
      AsyncStorage.getItem(ENTRIES_STORAGE_KEY),
      AsyncStorage.getItem(LAB_RESULTS_STORAGE_KEY),
    ])
      .then(([rawEntries, rawLabResults]) => {
        hydrated = true;
        if (rawEntries) {
          const parsed: unknown = JSON.parse(rawEntries);
          if (parsed && typeof parsed === 'object') {
            const valid: EntriesByDate = {};
            for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
              if (isValidEntry(value)) {valid[key] = value;}
            }
            entries = valid;
          }
        }
        if (rawLabResults) {
          const parsed: unknown = JSON.parse(rawLabResults);
          if (Array.isArray(parsed)) {
            labResults = parsed.filter(isValidLabResult);
          }
        }
        notifyListeners();
      })
      .catch(() => {
        hydrated = true;
      });
  }
  return hydration;
};

export const subscribeMenopauseJournal = (listener: () => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};
