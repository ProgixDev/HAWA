import AsyncStorage from '@react-native-async-storage/async-storage';

export type PregnancySymptomEntry = {date: string; symptoms: string[]; note?: string; updatedAt: string};
export type PregnancyWeightEntry = {date: string; valueKg: number; updatedAt: string};
export type PregnancyMedicalEntry = {date?: string; note: string; updatedAt: string};
export type PregnancyJournalState = {
  symptoms: PregnancySymptomEntry[];
  weights: PregnancyWeightEntry[];
  // Historical, one entry per reference date — same array-per-date pattern
  // as `symptoms`/`weights` above. `date` stays optional (a note doesn't
  // have to be pinned to one day), so undated entries are kept too, just
  // never matched by a Calendar day. Migrated once, non-destructively, from
  // the legacy single-record `medicalInformation` shape in readState()
  // below — no previously saved note is ever dropped by this change.
  medicalInformationHistory: PregnancyMedicalEntry[];
};

const STORAGE_KEY = '@hawa/pregnancy-journal/v1';
const EMPTY_STATE: PregnancyJournalState = {symptoms: [], weights: [], medicalInformationHistory: []};

type PersistedState = Partial<PregnancyJournalState> & {medicalInformation?: PregnancyMedicalEntry};

async function readState(): Promise<PregnancyJournalState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {return {...EMPTY_STATE};}
    const parsed = JSON.parse(raw) as PersistedState;
    const history = Array.isArray(parsed.medicalInformationHistory) ? parsed.medicalInformationHistory : [];
    const legacy = parsed.medicalInformation;
    const migratedHistory =
      legacy && !history.some(entry => entry.updatedAt === legacy.updatedAt)
        ? [...history, legacy]
        : history;
    return {
      symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
      weights: Array.isArray(parsed.weights) ? parsed.weights : [],
      medicalInformationHistory: migratedHistory,
    };
  } catch {
    return {...EMPTY_STATE};
  }
}

async function writeState(state: PregnancyJournalState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function savePregnancySymptoms(entry: PregnancySymptomEntry): Promise<void> {
  const state = await readState();
  state.symptoms = [...state.symptoms.filter(item => item.date !== entry.date), entry];
  await writeState(state);
}

export async function savePregnancyWeight(entry: PregnancyWeightEntry): Promise<void> {
  const state = await readState();
  state.weights = [...state.weights.filter(item => item.date !== entry.date), entry]
    .sort((a, b) => a.date.localeCompare(b.date));
  await writeState(state);
}

export async function savePregnancyMedicalInformation(entry: PregnancyMedicalEntry): Promise<void> {
  const state = await readState();
  // Upsert by date, same as symptoms/weights above: saving again for the
  // SAME reference date replaces that day's entry instead of duplicating
  // it. An entry with no date (the field is optional) has no natural key
  // to upsert against, so it is always appended as its own new record.
  const withoutSameDate = entry.date
    ? state.medicalInformationHistory.filter(item => item.date !== entry.date)
    : state.medicalInformationHistory;
  state.medicalInformationHistory = [...withoutSameDate, entry]
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
  await writeState(state);
}

export async function getPregnancyJournalState(): Promise<PregnancyJournalState> {
  return readState();
}
