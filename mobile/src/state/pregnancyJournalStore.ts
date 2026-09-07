import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  decryptFieldValue,
  encryptFieldValue,
  isEncryptedFieldPayload,
} from '../services/atRestFieldEncryption';

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

// Encryption at rest — `symptoms[].note` and `medicalInformationHistory[].note`
// are this store's sensitive free-text fields ("Informations médicales
// personnelles" is exactly the narrative content named in the audit);
// `symptoms[].symptoms`/`weights` stay plaintext (structured tracking
// values). Encrypted ONLY at the AsyncStorage persistence boundary —
// readState()'s callers always receive plain decrypted strings, so no
// screen needs to change. Same AES-256-GCM mechanism as
// miscarriageJournalStore.ts, own Keychain service.
const ENCRYPTION_SERVICE = 'com.hawa.private.pregnancy-journal.encryption-key';

async function decryptNoteField(value: unknown): Promise<string | undefined> {
  if (isEncryptedFieldPayload(value)) {
    try {
      return await decryptFieldValue<string>(ENCRYPTION_SERVICE, value);
    } catch {
      return undefined;
    }
  }
  return typeof value === 'string' ? value : undefined;
}

async function decryptStateFromStorage(parsed: PersistedState): Promise<PregnancyJournalState> {
  const rawSymptoms = Array.isArray(parsed.symptoms) ? parsed.symptoms : [];
  const symptoms = await Promise.all(
    rawSymptoms.map(async entry => ({...entry, note: await decryptNoteField((entry as {note?: unknown}).note)})),
  );

  const rawHistory = Array.isArray(parsed.medicalInformationHistory) ? parsed.medicalInformationHistory : [];
  const legacy = parsed.medicalInformation;
  const combinedRawHistory =
    legacy && !rawHistory.some(entry => entry.updatedAt === legacy.updatedAt)
      ? [...rawHistory, legacy]
      : rawHistory;
  const medicalInformationHistory = await Promise.all(
    combinedRawHistory.map(async entry => ({
      ...entry,
      note: (await decryptNoteField((entry as {note?: unknown}).note)) ?? '',
    })),
  );

  return {
    symptoms,
    weights: Array.isArray(parsed.weights) ? parsed.weights : [],
    medicalInformationHistory,
  };
}

async function encryptStateForStorage(state: PregnancyJournalState): Promise<Record<string, unknown>> {
  const symptoms = await Promise.all(
    state.symptoms.map(async entry => {
      const output: Record<string, unknown> = {...entry};
      if (entry.note) {
        output.note = await encryptFieldValue(ENCRYPTION_SERVICE, entry.note);
      } else {
        delete output.note;
      }
      return output;
    }),
  );
  const medicalInformationHistory = await Promise.all(
    state.medicalInformationHistory.map(async entry => ({
      ...entry,
      note: entry.note ? await encryptFieldValue(ENCRYPTION_SERVICE, entry.note) : entry.note,
    })),
  );
  return {symptoms, weights: state.weights, medicalInformationHistory};
}

async function readState(): Promise<PregnancyJournalState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {return {...EMPTY_STATE};}
    const parsed = JSON.parse(raw) as PersistedState;
    return await decryptStateFromStorage(parsed);
  } catch {
    return {...EMPTY_STATE};
  }
}

async function writeState(state: PregnancyJournalState): Promise<void> {
  const serializable = await encryptStateForStorage(state);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

/** One-shot, idempotent, crash-safe migration for every symptom/medical-info
 * note ever saved before encryption-at-rest existed — called once at app
 * boot (App.tsx). Checks the RAW persisted JSON for any plaintext `note`
 * field so an already-migrated store skips past without re-encrypting on
 * every boot. See migrateLegacyPlainMiscarriageNotes() in
 * miscarriageJournalStore.ts for the identical reasoning. */
export async function migrateLegacyPlainPregnancyNotes(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {return;}
    const parsed = JSON.parse(raw) as PersistedState;
    const arrays: Array<{note?: unknown}[]> = [
      Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
      Array.isArray(parsed.medicalInformationHistory) ? parsed.medicalInformationHistory : [],
    ];
    const hasLegacyPlaintext =
      arrays.some(list => list.some(entry => typeof entry.note === 'string' && entry.note)) ||
      typeof parsed.medicalInformation?.note === 'string';
    if (!hasLegacyPlaintext) {return;}

    const state = await readState();
    await writeState(state);
  } catch {
    // Never throw out of a boot-time migration — next launch retries.
  }
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
