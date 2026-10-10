import AsyncStorage from '../services/secureAsyncStorage';
import {migrateRecordSafely, sealArrayFields, sealField} from '../services/legacyFieldMigration';
import {
  decryptFieldValue,
  encryptFieldValue,
  isEncryptedFieldPayload,
} from '../services/atRestFieldEncryption';

// Vitamin/supplement and medication reminders the user creates herself in
// "Notifications & rappels". The app only ever echoes back what she typed —
// no dosage math, no medical suggestion. Same conventions as
// pregnancyMedicalEventsStore.ts (plain async read/write, no in-memory
// cache).
//
// `name` is freely user-authored (a specific vitamin/supplement/medication
// name she typed herself, per this file's own header above — never a
// predefined constant from the app) and directly reveals medication/
// supplement use during pregnancy, so it is encrypted at rest. `kind` is a
// fixed 2-value enum and every other field is scheduling metadata; both
// stay plaintext.
export type HealthReminderKind = 'vitamin' | 'medication';

export type HealthReminder = {
  id: string;
  kind: HealthReminderKind;
  name: string;
  /** 'HH:mm', local time. */
  time: string;
  repeat: 'daily';
  /** Medication only — 'YYYY-MM-DD'. */
  startDate?: string;
  /** Medication only, optional — 'YYYY-MM-DD'. */
  endDate?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = '@hawa/pregnancy-health-reminders';

const ENCRYPTION_SERVICE = 'com.hawa.private.pregnancy-health-reminders.encryption-key';

async function encryptReminderForStorage(reminder: HealthReminder): Promise<Record<string, unknown>> {
  const output: Record<string, unknown> = {...reminder};
  if (typeof reminder.name === 'string' && reminder.name.length > 0) {
    output.name = await encryptFieldValue(ENCRYPTION_SERVICE, reminder.name);
  }
  return output;
}

async function decryptReminderFromStorage(raw: Record<string, unknown>): Promise<Record<string, unknown>> {
  const output: Record<string, unknown> = {...raw};
  if (isEncryptedFieldPayload(raw.name)) {
    try {
      output.name = await decryptFieldValue<string>(ENCRYPTION_SERVICE, raw.name);
    } catch {
      output.name = '';
    }
  }
  return output;
}

async function readReminders(): Promise<HealthReminder[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {return [];}
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {return [];}
    const decrypted = await Promise.all(
      parsed.map(entry => decryptReminderFromStorage(entry as Record<string, unknown>)),
    );
    return decrypted as HealthReminder[];
  } catch {
    return [];
  }
}

async function writeReminders(reminders: HealthReminder[]): Promise<void> {
  const serializable = await Promise.all(reminders.map(reminder => encryptReminderForStorage(reminder)));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

export async function getHealthReminders(): Promise<HealthReminder[]> {
  return readReminders();
}

/** Adds a new reminder or, when `reminder.id` matches an existing one, replaces it. */
export async function saveHealthReminder(reminder: HealthReminder): Promise<HealthReminder[]> {
  const reminders = await readReminders();
  const next = [...reminders.filter(item => item.id !== reminder.id), reminder];
  await writeReminders(next);
  return next;
}

export async function deleteHealthReminder(id: string): Promise<HealthReminder[]> {
  const reminders = await readReminders();
  const next = reminders.filter(item => item.id !== id);
  await writeReminders(next);
  return next;
}

/**
 * Idempotent, interruption-safe boot-time migration of every reminder's name saved as plain text before field-level
 * encryption existed. Works on the PERSISTED record only (never on the store's memoised in-memory state): see
 * services/legacyFieldMigration.ts. Unreadable/unavailable record -> nothing is written, the next launch retries.
 */
export async function migrateLegacyPlainPregnancyHealthReminders(): Promise<void> {
  await migrateRecordSafely(STORAGE_KEY, parsed =>
    sealArrayFields(parsed, ['name'], value => sealField(ENCRYPTION_SERVICE, value)),
  );
}
