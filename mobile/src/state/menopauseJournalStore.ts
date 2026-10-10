import AsyncStorage, {isStructuredUnavailableError, readOwnedItems} from '../services/secureAsyncStorage';
import {migrateRecordSafely, sealField, sealMapFields} from '../services/legacyFieldMigration';
import {commitOptimistic} from '../services/saveFailure';

import type {MenopauseSymptom} from './menopausePreferences';
import type {MoodLevel} from '../types/journal';
import {
  decryptFieldValue,
  encryptFieldValue,
  isEncryptedFieldPayload,
} from '../services/atRestFieldEncryption';

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
   * recommendation. Encrypted at rest (AES-256-GCM, Keychain-backed key) —
   * see ENCRYPTION_SERVICE below; always plain in memory. */
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

// Only the two free-text fields below are sensitive; every other field is a
// structured selection (symptom enum, mood enum, numeric sleep hours, ...)
// and stays plaintext, matching the project's existing encryption scope.
const ENCRYPTION_SERVICE = 'com.hawa.private.menopause-journal.encryption-key';
const SENSITIVE_FIELDS = ['treatmentNote', 'notes'] as const;

async function encryptEntryForStorage(entry: MenopauseJournalEntry): Promise<Record<string, unknown>> {
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

async function decryptEntryFromStorage(raw: Record<string, unknown>): Promise<Record<string, unknown>> {
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
  }
  return output;
}

// A refused/failed write REJECTS (see services/saveFailure.ts) and the in-memory state goes back to what it was.
const persistEntries = async () => {
  const serializable: Record<string, unknown> = {};
  for (const [date, entry] of Object.entries(entries)) {
    serializable[date] = await encryptEntryForStorage(entry);
  }
  await AsyncStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(serializable));
};

const persistLabResults = () =>
  AsyncStorage.setItem(LAB_RESULTS_STORAGE_KEY, JSON.stringify(labResults));

const commitEntries = (previous: EntriesByDate): Promise<void> =>
  commitOptimistic(previous, () => entries, restored => {
    entries = restored;
    notifyListeners();
  }, persistEntries);

const commitLabResults = (previous: MenopauseLabResult[]): Promise<void> =>
  commitOptimistic(previous, () => labResults, restored => {
    labResults = restored;
    notifyListeners();
  }, persistLabResults);

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
  const previous = entries;
  entries = {...entries, [date]: {...entries[date], date, [category]: value}};
  notifyListeners();
  await commitEntries(previous);
}

type MenopauseEntryField = Exclude<keyof MenopauseJournalEntry, 'date'>;

/** The day-entry fields each journal category owns — the ONE mapping used to
 * clear a category. `labResults` owns none: lab results live in their own list
 * (see deleteMenopauseLabResult), never in the day entry. Every field is
 * optional in MenopauseJournalEntry, so "absent" is the canonical empty state. */
export const MENOPAUSE_CATEGORY_FIELDS: Record<MenopauseJournalCategory, readonly MenopauseEntryField[]> = {
  symptoms: ['symptoms', 'symptomIntensity'],
  mood: ['mood'],
  sleep: ['sleepDurationHours', 'sleepQuality'],
  energy: ['energyLevel'],
  treatment: ['treatmentStatus', 'treatmentNote'],
  labResults: [],
  notes: ['notes'],
};

/** Clears (removes) the given fields of ONE day's entry and leaves every other
 * field of that day untouched. A day left with no data at all is dropped so it
 * is not counted as a tracked day. No-op when nothing is stored for those
 * fields. */
export async function clearMenopauseJournalFields(
  date: string,
  fields: readonly MenopauseEntryField[],
): Promise<void> {
  const current = entries[date];
  if (!current || !fields.some(field => current[field] !== undefined)) {
    return;
  }
  const next: MenopauseJournalEntry = {...current};
  fields.forEach(field => {
    delete next[field];
  });
  const nextEntries = {...entries};
  if (Object.keys(next).every(key => key === 'date')) {
    delete nextEntries[date];
  } else {
    nextEntries[date] = next;
  }
  const previous = entries;
  entries = nextEntries;
  notifyListeners();
  await commitEntries(previous);
}

export const clearMenopauseJournalCategory = (date: string, category: MenopauseJournalCategory): Promise<void> =>
  clearMenopauseJournalFields(date, MENOPAUSE_CATEGORY_FIELDS[category]);

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
  const previous = labResults;
  labResults = [...labResults, entry];
  notifyListeners();
  await commitLabResults(previous);
}

export const getMenopauseLabResults = (type?: MenopauseLabType): MenopauseLabResult[] => {
  const all = [...labResults].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return type ? all.filter(result => result.type === type) : all;
};

export const getLatestMenopauseLabResult = (type: MenopauseLabType): MenopauseLabResult | undefined =>
  getMenopauseLabResults(type)[0];

/** Edits an existing result IN PLACE by id (same id and same `recordedAt` — it
 * is still the result that was entered then; only the reported value / unit /
 * sample date change). No other result is touched. Returns false when the id is
 * unknown. Never invents a storage model: same list, same key. */
export async function updateMenopauseLabResult(
  id: string,
  patch: {value: number; unit?: string; date: string},
): Promise<boolean> {
  if (!labResults.some(result => result.id === id)) {
    return false;
  }
  const previousLabResults = labResults;
  labResults = labResults.map(result =>
    result.id === id
      ? {
          id: result.id,
          type: result.type,
          recordedAt: result.recordedAt,
          value: patch.value,
          ...(patch.unit ? {unit: patch.unit} : {}),
          date: patch.date,
        }
      : result,
  );
  notifyListeners();
  await commitLabResults(previousLabResults);
  return true;
}

export const deleteMenopauseLabResult = async (id: string): Promise<void> => {
  const previous = labResults;
  labResults = labResults.filter(result => result.id !== id);
  notifyListeners();
  await commitLabResults(previous);
};

export const hydrateMenopauseJournal = (): Promise<void> => {
  if (hydrated) {
    return Promise.resolve();
  }
  if (!hydration) {
    hydration = readOwnedItems([ENTRIES_STORAGE_KEY, LAB_RESULTS_STORAGE_KEY], hydrateMenopauseJournal)
      .then(async ([rawEntries, rawLabResults]) => {
        hydrated = true;
        if (rawEntries) {
          const parsed: unknown = JSON.parse(rawEntries);
          if (parsed && typeof parsed === 'object') {
            const valid: EntriesByDate = {};
            for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
              if (!value || typeof value !== 'object') {continue;}
              const decrypted = await decryptEntryFromStorage(value as Record<string, unknown>);
              if (isValidEntry(decrypted)) {valid[key] = decrypted;}
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
      .catch(error => {
        if (isStructuredUnavailableError(error)) {
          // not latched: a later hydrate (or "Try again") re-reads the real records
          hydration = null;
          return;
        }
        hydrated = true;
      });
  }
  return hydration;
};

export const subscribeMenopauseJournal = (listener: () => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};

/**
 * Idempotent, interruption-safe boot-time migration of every day's treatmentNote/notes saved as plain text before field-level
 * encryption existed. Works on the PERSISTED record only (never on the store's memoised in-memory state): see
 * services/legacyFieldMigration.ts. Unreadable/unavailable record -> nothing is written, the next launch retries.
 */
export async function migrateLegacyPlainMenopauseNotes(): Promise<void> {
  // Only the entries record; labResults are never touched.
  const outcome = await migrateRecordSafely(ENTRIES_STORAGE_KEY, parsed =>
    sealMapFields(parsed, SENSITIVE_FIELDS, value => sealField(ENCRYPTION_SERVICE, value)),
  );
  // Same observable behaviour as before: a store whose record was just migrated is loaded (read-only) afterwards.
  if (outcome === 'migrated') {
    await hydrateMenopauseJournal();
  }
}
