import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  decryptFieldValue,
  encryptFieldValue,
  isEncryptedFieldPayload,
} from '../services/atRestFieldEncryption';

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

// Encryption at rest — `medicalNotes` is this store's sensitive field;
// height/weight/bloodType/chronicConditions/treatments/allergies/healthGoal
// stay plaintext (structured tracking values used broadly for BMI/goal
// display, not narrative text). Encrypted ONLY at the AsyncStorage
// persistence boundary — `cachedProfile`/`getCachedGeneralHealth()` always
// hold the plain decrypted string, so no screen needs to change. Same
// AES-256-GCM mechanism as miscarriageJournalStore.ts, own Keychain service.
const ENCRYPTION_SERVICE = 'com.hawa.private.general-health.encryption-key';

async function decryptProfileFromStorage(raw: Record<string, unknown>): Promise<Record<string, unknown>> {
  const output = {...raw};
  const value = raw.medicalNotes;
  if (isEncryptedFieldPayload(value)) {
    try {
      output.medicalNotes = await decryptFieldValue<string>(ENCRYPTION_SERVICE, value);
    } catch {
      delete output.medicalNotes;
    }
  }
  // A plain string is legacy plaintext — already the correct shape.
  return output;
}

async function encryptProfileForStorage(profile: GeneralHealthProfile): Promise<Record<string, unknown>> {
  const output: Record<string, unknown> = {...profile};
  if (profile.medicalNotes) {
    output.medicalNotes = await encryptFieldValue(ENCRYPTION_SERVICE, profile.medicalNotes);
  } else {
    delete output.medicalNotes;
  }
  return output;
}

export async function loadGeneralHealth(): Promise<GeneralHealthProfile> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = await decryptProfileFromStorage(JSON.parse(raw));
      cachedProfile = {...DEFAULT_PROFILE, ...parsed};
    }
  } catch {}
  return getCachedGeneralHealth();
}

export async function updateGeneralHealth(
  patch: Partial<GeneralHealthProfile>,
): Promise<GeneralHealthProfile> {
  cachedProfile = {...cachedProfile, ...patch, updatedAt: todayKey()};
  try {
    const serializable = await encryptProfileForStorage(cachedProfile);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    // Never throw out of a save action — in-memory state is unaffected.
  }
  return getCachedGeneralHealth();
}

/** One-shot, idempotent, crash-safe migration for `medicalNotes` ever saved
 * before encryption-at-rest existed — called once at app boot (App.tsx).
 * Checks the RAW persisted JSON for a plaintext `medicalNotes` so an
 * already-migrated profile skips past without re-encrypting on every boot.
 * See migrateLegacyPlainMiscarriageNotes() in miscarriageJournalStore.ts for
 * the identical reasoning. */
export async function migrateLegacyPlainGeneralHealthNotes(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {return;}
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.medicalNotes !== 'string' || !parsed.medicalNotes) {return;}

    await loadGeneralHealth();
    await updateGeneralHealth({});
  } catch {
    // Never throw out of a boot-time migration — next launch retries.
  }
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
