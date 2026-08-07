import AsyncStorage from '@react-native-async-storage/async-storage';
import type {DailyJournalEntry, JournalSection} from '../types/journal';

const STORAGE_KEY = '@hawa/daily-journal/v1';

const readEntries = async (): Promise<DailyJournalEntry[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {return [];}
  try {return JSON.parse(raw) as DailyJournalEntry[];} catch {return [];}
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
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
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

export async function deleteJournalSection(date: string, section: JournalSection): Promise<void> {
  const entries = await readEntries();
  const index = entries.findIndex(entry => entry.date === date);
  if (index < 0) {return;}
  const updated = {...entries[index]};
  delete updated[section];
  entries[index] = updated;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
