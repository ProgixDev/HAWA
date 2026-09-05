import AsyncStorage from '@react-native-async-storage/async-storage';

export type GeneralHealthProfile = {
  heightCm: number;
  weightKg: number;
  bloodType: string;
  chronicConditions: string[];
  treatments: string[];
  allergies: string[];
  medicalNotes: string;
  healthGoal: string;
  goalProgress: number;
  updatedAt: string;
};

const STORAGE_KEY = '@awa/general-health/v1';
const todayKey = () => new Date().toLocaleDateString('en-CA');

const DEFAULT_PROFILE: GeneralHealthProfile = {
  heightCm: 165,
  weightKg: 60,
  bloodType: 'O+',
  chronicConditions: [],
  treatments: [],
  allergies: [],
  medicalNotes: '',
  healthGoal: 'Rester en forme et en bonne santé',
  goalProgress: 60,
  updatedAt: todayKey(),
};

let cachedProfile = {...DEFAULT_PROFILE};

export function getCachedGeneralHealth(): GeneralHealthProfile {
  return {...cachedProfile, chronicConditions: [...cachedProfile.chronicConditions], treatments: [...cachedProfile.treatments], allergies: [...cachedProfile.allergies]};
}

export async function loadGeneralHealth(): Promise<GeneralHealthProfile> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {cachedProfile = {...DEFAULT_PROFILE, ...JSON.parse(raw)};}
  } catch {}
  return getCachedGeneralHealth();
}

export async function updateGeneralHealth(
  patch: Partial<GeneralHealthProfile>,
): Promise<GeneralHealthProfile> {
  cachedProfile = {...cachedProfile, ...patch, updatedAt: todayKey()};
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cachedProfile));
  return getCachedGeneralHealth();
}

export function calculateBmi(heightCm: number, weightKg: number): number | undefined {
  if (heightCm <= 0 || weightKg <= 0) {return undefined;}
  return weightKg / Math.pow(heightCm / 100, 2);
}

export function classifyBmi(bmi?: number): string {
  if (bmi === undefined) {return 'Données insuffisantes';}
  if (bmi < 18.5) {return 'Insuffisance pondérale';}
  if (bmi < 25) {return 'Normal';}
  if (bmi < 30) {return 'Surpoids';}
  return 'Obésité';
}
