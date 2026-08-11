import AsyncStorage from '@react-native-async-storage/async-storage';

export type PregnancySymptomEntry = {date: string; symptoms: string[]; note?: string; updatedAt: string};
export type PregnancyWeightEntry = {date: string; valueKg: number; updatedAt: string};
export type PregnancyMedicalEntry = {date?: string; note: string; updatedAt: string};
export type PregnancyJournalState = {
  symptoms: PregnancySymptomEntry[];
  weights: PregnancyWeightEntry[];
  medicalInformation?: PregnancyMedicalEntry;
};

const STORAGE_KEY = '@hawa/pregnancy-journal/v1';
const EMPTY_STATE: PregnancyJournalState = {symptoms: [], weights: []};

async function readState(): Promise<PregnancyJournalState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {return {...EMPTY_STATE};}
    const parsed = JSON.parse(raw) as Partial<PregnancyJournalState>;
    return {
      symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
      weights: Array.isArray(parsed.weights) ? parsed.weights : [],
      medicalInformation: parsed.medicalInformation,
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
  state.medicalInformation = entry;
  await writeState(state);
}

export async function getPregnancyJournalState(): Promise<PregnancyJournalState> {
  return readState();
}
