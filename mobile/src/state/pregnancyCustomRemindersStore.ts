import AsyncStorage from '../services/secureAsyncStorage';
import {migrateRecordSafely, sealArrayFields, sealField} from '../services/legacyFieldMigration';
import {
  carrySealedField,
  decryptFieldValue,
  encryptFieldValue,
  isEncryptedFieldPayload,
  restoreSealedFields,
} from '../services/atRestFieldEncryption';

// User-created custom reminders ("Rappels personnalisés") in "Notifications
// & rappels". Same conventions as pregnancyMedicalEventsStore.ts (plain
// async read/write, no in-memory cache).
//
// `title`/`description` are freely user-authored text (e.g. "RDV
// gynécologue — dépistage trisomie", "Prise de sang diabète gestationnel")
// and can readily reveal pregnancy/medical information, so both are
// encrypted at rest — unlike a fixed reminder *type* or a predefined label,
// nothing constrains what a user types here. `date`/`time`/`repeat`/
// `enabled`/`createdAt`/`updatedAt` are structured scheduling data and stay
// plaintext.
export type CustomReminderRepeat = 'once' | 'daily' | 'weekly';

export type CustomReminder = {
  id: string;
  title: string;
  description?: string;
  /** 'YYYY-MM-DD'. */
  date: string;
  /** 'HH:mm', local time. */
  time: string;
  repeat: CustomReminderRepeat;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = '@hawa/pregnancy-custom-reminders';

const ENCRYPTION_SERVICE = 'com.hawa.private.pregnancy-custom-reminders.encryption-key';

async function encryptReminderForStorage(reminder: CustomReminder): Promise<Record<string, unknown>> {
  const output: Record<string, unknown> = {...reminder};
  if (typeof reminder.title === 'string' && reminder.title.length > 0) {
    output.title = await encryptFieldValue(ENCRYPTION_SERVICE, reminder.title);
  }
  if (typeof reminder.description === 'string' && reminder.description.length > 0) {
    output.description = await encryptFieldValue(ENCRYPTION_SERVICE, reminder.description);
  } else {
    delete output.description;
  }
  // A field that could not be decrypted when this record was read goes back as the sealed payload it was (see
  // restoreSealedFields) instead of the blank the reader had to answer with.
  return restoreSealedFields(output);
}

async function decryptReminderFromStorage(raw: Record<string, unknown>): Promise<Record<string, unknown>> {
  const output: Record<string, unknown> = {...raw};
  if (isEncryptedFieldPayload(raw.title)) {
    try {
      output.title = await decryptFieldValue<string>(ENCRYPTION_SERVICE, raw.title);
    } catch {
      output.title = '';
      carrySealedField(output, 'title', raw.title);
    }
  }
  if (isEncryptedFieldPayload(raw.description)) {
    try {
      output.description = await decryptFieldValue<string>(ENCRYPTION_SERVICE, raw.description);
    } catch {
      delete output.description;
      carrySealedField(output, 'description', raw.description);
    }
  }
  return output;
}

async function readReminders(): Promise<CustomReminder[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {return [];}
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {return [];}
    const decrypted = await Promise.all(
      parsed.map(entry => decryptReminderFromStorage(entry as Record<string, unknown>)),
    );
    return decrypted as CustomReminder[];
  } catch {
    return [];
  }
}

async function writeReminders(reminders: CustomReminder[]): Promise<void> {
  const serializable = await Promise.all(reminders.map(reminder => encryptReminderForStorage(reminder)));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

export async function getCustomReminders(): Promise<CustomReminder[]> {
  return readReminders();
}

/** Adds a new reminder or, when `reminder.id` matches an existing one, replaces it. */
export async function saveCustomReminder(reminder: CustomReminder): Promise<CustomReminder[]> {
  const reminders = await readReminders();
  const next = [...reminders.filter(item => item.id !== reminder.id), reminder];
  await writeReminders(next);
  return next;
}

export async function deleteCustomReminder(id: string): Promise<CustomReminder[]> {
  const reminders = await readReminders();
  const next = reminders.filter(item => item.id !== id);
  await writeReminders(next);
  return next;
}

/**
 * Idempotent, interruption-safe boot-time migration of every reminder's title/description saved as plain text before field-level
 * encryption existed. Works on the PERSISTED record only (never on the store's memoised in-memory state): see
 * services/legacyFieldMigration.ts. Unreadable/unavailable record -> nothing is written, the next launch retries.
 */
export async function migrateLegacyPlainPregnancyCustomReminders(): Promise<void> {
  await migrateRecordSafely(STORAGE_KEY, parsed =>
    sealArrayFields(parsed, ['title', 'description'], value => sealField(ENCRYPTION_SERVICE, value)),
  );
}
