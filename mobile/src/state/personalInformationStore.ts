import AsyncStorage from '@react-native-async-storage/async-storage';
import {setFirstName} from './onboardingPreferences';
import {
  decryptFieldValue,
  encryptFieldValue,
  isEncryptedFieldPayload,
} from '../services/atRestFieldEncryption';

export type CalendarPreference = 'gregorian' | 'hijri' | 'double';
export type TimeFormatPreference = '12h' | '24h';

export type PersonalInformation = {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  phone: string;
  country: string;
  language: string;
  preferredName: string;
  calendar: CalendarPreference;
  timeFormat: TimeFormatPreference;
  avatarUri?: string;
};

const STORAGE_KEY = '@hawa/personal-information/v1';

const DEFAULT_INFORMATION: PersonalInformation = {
  // firstName/preferredName intentionally start empty — a new user's real
  // choice (or explicit skip) from NameOnboardingScreen.tsx is the only
  // thing that should ever populate them. Never presented as a real value
  // until she actually provides one (see HomeHeader.tsx/ProfileScreen.tsx/
  // PersonalInformationScreen.tsx's empty-name fallback handling).
  firstName: '',
  lastName: 'Benali',
  birthDate: '1998-05-14',
  email: 'amina.benali@email.com',
  phone: '+213 6 12 34 56 78',
  country: 'Algérie',
  language: 'Français',
  preferredName: '',
  calendar: 'double',
  timeFormat: '24h',
};

let cachedInformation = {...DEFAULT_INFORMATION};

export function getCachedPersonalInformation(): PersonalInformation {
  return {...cachedInformation};
}

// Encryption at rest — lastName/birthDate/email/phone are this store's
// identifying PII fields; firstName/preferredName stay plaintext (shown
// prominently everywhere as a greeting — HomeHeader.tsx/ProfileScreen.tsx —
// and are lower-sensitivity on their own), as do
// country/language/calendar/timeFormat/avatarUri (non-identifying
// preferences). Encrypted ONLY at the AsyncStorage persistence boundary —
// `cachedInformation`/`getCachedPersonalInformation()` always hold plain
// decrypted strings, so no screen needs to change. Same AES-256-GCM
// mechanism as miscarriageJournalStore.ts, own Keychain service.
const ENCRYPTION_SERVICE = 'com.hawa.private.personal-information.encryption-key';
const SENSITIVE_FIELDS = ['lastName', 'birthDate', 'email', 'phone'] as const;

async function decryptInformationFromStorage(raw: Record<string, unknown>): Promise<Record<string, unknown>> {
  const output = {...raw};
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

async function encryptInformationForStorage(info: PersonalInformation): Promise<Record<string, unknown>> {
  const output: Record<string, unknown> = {...info};
  for (const field of SENSITIVE_FIELDS) {
    const value = info[field];
    if (typeof value === 'string' && value.length > 0) {
      output[field] = await encryptFieldValue(ENCRYPTION_SERVICE, value);
    } else {
      delete output[field];
    }
  }
  return output;
}

export async function loadPersonalInformation(): Promise<PersonalInformation> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = await decryptInformationFromStorage(JSON.parse(raw));
      cachedInformation = {...DEFAULT_INFORMATION, ...parsed};
    }
  } catch {}
  setFirstName(cachedInformation.preferredName || cachedInformation.firstName);
  return {...cachedInformation};
}

export async function updatePersonalInformation(
  patch: Partial<PersonalInformation>,
): Promise<PersonalInformation> {
  cachedInformation = {...cachedInformation, ...patch};
  setFirstName(cachedInformation.preferredName || cachedInformation.firstName);
  try {
    const serializable = await encryptInformationForStorage(cachedInformation);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    // Never throw out of a save action — in-memory state is unaffected.
  }
  return {...cachedInformation};
}

/** One-shot, idempotent, crash-safe migration for
 * lastName/birthDate/email/phone ever saved before encryption-at-rest
 * existed — called once at app boot (App.tsx). Checks the RAW persisted
 * JSON for any plaintext sensitive field so an already-migrated record skips
 * past without re-encrypting on every boot. See
 * migrateLegacyPlainMiscarriageNotes() in miscarriageJournalStore.ts for the
 * identical reasoning. */
export async function migrateLegacyPlainPersonalInformation(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {return;}
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const hasLegacyPlaintext = SENSITIVE_FIELDS.some(field => typeof parsed[field] === 'string' && parsed[field]);
    if (!hasLegacyPlaintext) {return;}

    await loadPersonalInformation();
    await updatePersonalInformation({});
  } catch {
    // Never throw out of a boot-time migration — next launch retries.
  }
}
