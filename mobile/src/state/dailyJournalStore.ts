import AsyncStorage from '../services/secureAsyncStorage';
import {migrateRecordSafely, sealEntryFields, sealField} from '../services/legacyFieldMigration';
import type {DailyJournalEntry, JournalSection} from '../types/journal';
import {
  decryptFieldValue,
  encryptFieldValue,
  isEncryptedFieldPayload,
} from '../services/atRestFieldEncryption';
import {getActiveProfileId} from './activeProfileStore';
import {profileScopedKey} from './profileScopedStorage';

const STORAGE_KEY_BASE = '@hawa/daily-journal/v1';
// Profile-scoped (see profileScopedStorage.ts) — the mother's journal stays under
// the exact key above (no migration needed); every read/write below resolves the
// key FRESH from the CURRENT active profile, so this store needs no separate
// cache-invalidation-on-switch step (it never caches in memory — see readEntries()).
const currentStorageKey = () => profileScopedKey(STORAGE_KEY_BASE, getActiveProfileId());

// Only these 9 nested per-category free-text `note` fields are sensitive
// narrative content — every other DailyJournalEntry field (severity/level/
// intensity enums, numeric values, booleans, arrays of tags) is structured
// selection data and stays plaintext. Distinct from, and never touching,
// this same entry's separately-encrypted `encryptedNote` ("Notes
// personnelles", privateNotesEncryption.ts) and `encryptedIntimacy` ("Vie
// intime", privateJournalEncryption.ts) fields, which arrive at this store
// already encrypted by their own dedicated services. `hydration` has no
// `note` field and is intentionally excluded.
const NOTE_SECTIONS = [
  'symptoms',
  'mood',
  'flow',
  'temperature',
  'sleep',
  'activity',
  'weight',
  'cervicalMucus',
  'lhTest',
] as const;

const ENCRYPTION_SERVICE = 'com.hawa.private.daily-journal.encryption-key';

async function encryptEntryForStorage(entry: DailyJournalEntry): Promise<Record<string, unknown>> {
  const output: Record<string, unknown> = {...entry};
  for (const section of NOTE_SECTIONS) {
    const value = entry[section] as Record<string, unknown> | undefined;
    if (!value || typeof value !== 'object') {continue;}
    const sectionCopy: Record<string, unknown> = {...value};
    if (typeof sectionCopy.note === 'string' && sectionCopy.note.length > 0) {
      sectionCopy.note = await encryptFieldValue(ENCRYPTION_SERVICE, sectionCopy.note);
    } else {
      delete sectionCopy.note;
    }
    output[section] = sectionCopy;
  }
  return output;
}

async function decryptEntryFromStorage(raw: Record<string, unknown>): Promise<DailyJournalEntry> {
  const output: Record<string, unknown> = {...raw};
  for (const section of NOTE_SECTIONS) {
    const value = raw[section];
    if (!value || typeof value !== 'object') {continue;}
    const sectionCopy: Record<string, unknown> = {...(value as Record<string, unknown>)};
    const noteValue = sectionCopy.note;
    if (isEncryptedFieldPayload(noteValue)) {
      try {
        sectionCopy.note = await decryptFieldValue<string>(ENCRYPTION_SERVICE, noteValue);
      } catch {
        delete sectionCopy.note;
      }
    }
    output[section] = sectionCopy;
  }
  return output as DailyJournalEntry;
}

const readEntries = async (): Promise<DailyJournalEntry[]> => {
  const raw = await AsyncStorage.getItem(currentStorageKey());
  if (!raw) {return [];}
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>[];
    return await Promise.all(parsed.map(entry => decryptEntryFromStorage(entry)));
  } catch {return [];}
};

const writeEntries = async (entries: DailyJournalEntry[]): Promise<void> => {
  const serializable = await Promise.all(entries.map(entry => encryptEntryForStorage(entry)));
  await AsyncStorage.setItem(currentStorageKey(), JSON.stringify(serializable));
};

export async function saveJournalSection<K extends JournalSection>(
  date: string,
  section: K,
  value: NonNullable<DailyJournalEntry[K]>,
): Promise<void> {
  const entries = await readEntries();
  const index = entries.findIndex(entry => entry.date === date);
  const current: DailyJournalEntry = index >= 0
    ? entries[index]
    : {id: `${date}-${Date.now()}`, date};
  const updated = {...current, [section]: value};
  if (index >= 0) {entries[index] = updated;} else {entries.push(updated);}
  await writeEntries(entries);
}

export async function getJournalEntry(date: string): Promise<DailyJournalEntry | undefined> {
  const entries = await readEntries();
  return entries.find(entry => entry.date === date);
}

export async function getJournalEntriesForMonth(year: number, month: number): Promise<DailyJournalEntry[]> {
  const entries = await readEntries();
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return entries.filter(entry => entry.date.startsWith(prefix));
}

/** Every entry, regardless of month — used by screens that filter their own
 * date range client-side (e.g. Pregnancy Statistics' 7/30/all filter). */
export async function getAllJournalEntries(): Promise<DailyJournalEntry[]> {
  return readEntries();
}

export async function deleteJournalSection(date: string, section: JournalSection): Promise<void> {
  const entries = await readEntries();
  const index = entries.findIndex(entry => entry.date === date);
  if (index < 0) {return;}
  const updated = {...entries[index]};
  delete updated[section];
  entries[index] = updated;
  await writeEntries(entries);
}

/**
 * Idempotent, interruption-safe boot-time migration of every section's note saved as plain text before field-level
 * encryption existed. Works on the PERSISTED record only (never on the store's memoised in-memory state): see
 * services/legacyFieldMigration.ts. Unreadable/unavailable record -> nothing is written, the next launch retries.
 */
export async function migrateLegacyPlainDailyJournalNotes(): Promise<void> {
  await migrateRecordSafely(currentStorageKey(), async parsed => {
    if (!Array.isArray(parsed)) {return null;}
    let changed = false;
    const next: unknown[] = [];
    for (const rawEntry of parsed) {
      if (!rawEntry || typeof rawEntry !== 'object' || Array.isArray(rawEntry)) {
        next.push(rawEntry);
        continue;
      }
      const entry: Record<string, unknown> = {...(rawEntry as Record<string, unknown>)};
      for (const section of NOTE_SECTIONS) {
        const value = entry[section];
        if (!value || typeof value !== 'object' || Array.isArray(value)) {continue;}
        const sealed = await sealEntryFields(value as Record<string, unknown>, ['note'], note => sealField(ENCRYPTION_SERVICE, note), 'drop');
        if (sealed.changed) {
          entry[section] = sealed.value;
          changed = true;
        }
      }
      next.push(entry);
    }
    return changed ? next : null;
  });
}
