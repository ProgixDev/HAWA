import AsyncStorage from '@react-native-async-storage/async-storage';
import type {DailyJournalEntry, JournalSection} from '../types/journal';
import {
  decryptFieldValue,
  encryptFieldValue,
  isEncryptedFieldPayload,
} from '../services/atRestFieldEncryption';

const STORAGE_KEY = '@hawa/daily-journal/v1';

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
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {return [];}
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>[];
    return await Promise.all(parsed.map(entry => decryptEntryFromStorage(entry)));
  } catch {return [];}
};

const writeEntries = async (entries: DailyJournalEntry[]): Promise<void> => {
  const serializable = await Promise.all(entries.map(entry => encryptEntryForStorage(entry)));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
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
 * Idempotent boot-time migration: re-saves any entry whose per-category
 * `<section>.note` is still a plain string, encrypting it via the same
 * at-rest scheme as every other sensitive journal field. Handles mixed
 * states (one section's note already encrypted, another still plaintext,
 * another empty/missing) since re-saving decrypts-or-passes-through every
 * section independently before re-encrypting all of them. No-ops if no
 * plaintext note is found (safe to call on every app launch). Never
 * touches `encryptedNote`/`encryptedIntimacy`/`privatePhotos` — those are
 * migrated by their own dedicated services.
 */
export async function migrateLegacyPlainDailyJournalNotes(): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {return;}
  let parsed: unknown;
  try {parsed = JSON.parse(raw);} catch {return;}
  if (!Array.isArray(parsed)) {return;}
  const hasLegacyPlainNote = parsed.some(rawEntry => {
    if (!rawEntry || typeof rawEntry !== 'object') {return false;}
    return NOTE_SECTIONS.some(section => {
      const value = (rawEntry as Record<string, unknown>)[section];
      if (!value || typeof value !== 'object') {return false;}
      return typeof (value as Record<string, unknown>).note === 'string';
    });
  });
  if (!hasLegacyPlainNote) {return;}
  const entries = await readEntries();
  await writeEntries(entries);
}
