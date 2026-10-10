import AsyncStorage from '../services/secureAsyncStorage';
import {getActiveProfileId} from './activeProfileStore';
import {profileScopedKey} from './profileScopedStorage';
import {persistWithRollback} from '../services/saveFailure';

import {
  decryptFieldValue,
  encryptFieldValue,
  isEncryptedFieldPayload,
} from '../services/atRestFieldEncryption';

// "Not provided" representation per field (never a fabricated value):
//   heightCm / weightKg / goalProgress -> null
//   bloodType / healthGoal / medicalNotes / updatedAt -> '' (empty string)
//   chronicConditions / treatments / allergies -> []
export type GeneralHealthProfile = {
  heightCm: number | null;
  weightKg: number | null;
  bloodType: string;
  chronicConditions: string[];
  treatments: string[];
  allergies: string[];
  medicalNotes: string;
  healthGoal: string;
  goalProgress: number | null;
  updatedAt: string;
};

const STORAGE_KEY_BASE = '@awa/general-health/v1';
// Profile-scoped (profileScopedStorage.ts): the owner's record stays under the
// exact legacy key (no migration); a managed daughter profile gets her own
// suffixed key, so she never sees — or overwrites — the owner's measurements.
const currentStorageKey = () => profileScopedKey(STORAGE_KEY_BASE, getActiveProfileId());
const todayKey = () => new Date().toLocaleDateString('en-CA');

const DEFAULT_PROFILE: GeneralHealthProfile = {
  heightCm: null,
  weightKg: null,
  bloodType: '',
  chronicConditions: [],
  treatments: [],
  allergies: [],
  medicalNotes: '',
  healthGoal: '',
  goalProgress: null,
  updatedAt: '',
};

let cachedProfile: GeneralHealthProfile = {...DEFAULT_PROFILE};
let cachedProfileId: string = getActiveProfileId();

/** Drops the in-memory copy when the active profile changed since it was
 * filled, so another profile's values are never served. */
function ensureCacheMatchesActiveProfile(): void {
  const activeId = getActiveProfileId();
  if (cachedProfileId !== activeId) {
    cachedProfileId = activeId;
    cachedProfile = {...DEFAULT_PROFILE};
  }
}

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

/** Stored garbage (null, 0, NaN-ish, wrong types) is "not provided" — real
 * saved values pass through unchanged. */
function sanitizeProfile(merged: GeneralHealthProfile): GeneralHealthProfile {
  const stringList = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  return {
    ...merged,
    heightCm: isPositiveNumber(merged.heightCm) ? merged.heightCm : null,
    weightKg: isPositiveNumber(merged.weightKg) ? merged.weightKg : null,
    bloodType: typeof merged.bloodType === 'string' ? merged.bloodType : '',
    chronicConditions: stringList(merged.chronicConditions),
    treatments: stringList(merged.treatments),
    allergies: stringList(merged.allergies),
    medicalNotes: typeof merged.medicalNotes === 'string' ? merged.medicalNotes : '',
    healthGoal: typeof merged.healthGoal === 'string' ? merged.healthGoal : '',
    goalProgress:
      typeof merged.goalProgress === 'number' && Number.isFinite(merged.goalProgress)
        ? merged.goalProgress
        : null,
    updatedAt: typeof merged.updatedAt === 'string' ? merged.updatedAt : '',
  };
}

export function getCachedGeneralHealth(): GeneralHealthProfile {
  ensureCacheMatchesActiveProfile();
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
  // "Not provided" fields are persisted as absent keys, never as a fake value.
  for (const field of ['heightCm', 'weightKg', 'goalProgress'] as const) {
    if (profile[field] === null) {delete output[field];}
  }
  for (const field of ['bloodType', 'healthGoal', 'updatedAt'] as const) {
    if (!profile[field]) {delete output[field];}
  }
  return output;
}

export async function loadGeneralHealth(): Promise<GeneralHealthProfile> {
  ensureCacheMatchesActiveProfile();
  const requestedId = cachedProfileId;
  try {
    const raw = await AsyncStorage.getItem(currentStorageKey());
    // A read that finishes after a profile switch must not fill the new
    // profile's cache with the previous profile's data.
    if (raw && getActiveProfileId() === requestedId) {
      const parsed = await decryptProfileFromStorage(JSON.parse(raw));
      if (getActiveProfileId() === requestedId) {
        cachedProfile = sanitizeProfile({
          ...DEFAULT_PROFILE,
          ...(parsed as Partial<GeneralHealthProfile>),
        });
      }
    }
  } catch {}
  return getCachedGeneralHealth();
}

export async function updateGeneralHealth(
  patch: Partial<GeneralHealthProfile>,
): Promise<GeneralHealthProfile> {
  ensureCacheMatchesActiveProfile();
  // An empty patch (the boot-time notes migration) rewrites the record
  // without claiming a user edit, so `updatedAt` is only stamped on a real one.
  const isRealEdit = Object.keys(patch).length > 0;
  const previous = cachedProfile;
  const profileId = cachedProfileId;
  const optimistic = {...cachedProfile, ...patch, ...(isRealEdit ? {updatedAt: todayKey()} : {})};
  cachedProfile = optimistic;
  const storageKey = currentStorageKey();
  // A refused/failed save REJECTS (services/saveFailure.ts, the same contract as every store) and the cache goes back
  // to what storage holds, so a screen never keeps showing a measurement that was not persisted.
  await persistWithRollback(
    async () => {
      const serializable = await encryptProfileForStorage(optimistic);
      await AsyncStorage.setItem(storageKey, JSON.stringify(serializable));
    },
    () => {
      if (cachedProfile === optimistic && cachedProfileId === profileId) {cachedProfile = previous;}
    },
  );
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
    const raw = await AsyncStorage.getItem(currentStorageKey());
    if (!raw) {return;}
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.medicalNotes !== 'string' || !parsed.medicalNotes) {return;}

    await loadGeneralHealth();
    await updateGeneralHealth({});
  } catch {
    // Never throw out of a boot-time migration — next launch retries.
  }
}

export function calculateBmi(
  heightCm: number | null | undefined,
  weightKg: number | null | undefined,
): number | undefined {
  if (!isPositiveNumber(heightCm) || !isPositiveNumber(weightKg)) {return undefined;}
  return weightKg / Math.pow(heightCm / 100, 2);
}

export type BmiClass = 'insufficientData' | 'underweight' | 'normal' | 'overweight' | 'obese';

export function classifyBmi(bmi?: number): BmiClass {
  if (bmi === undefined) {return 'insufficientData';}
  if (bmi < 18.5) {return 'underweight';}
  if (bmi < 25) {return 'normal';}
  if (bmi < 30) {return 'overweight';}
  return 'obese';
}
