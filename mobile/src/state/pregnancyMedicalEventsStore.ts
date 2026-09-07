import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  decryptFieldValue,
  encryptFieldValue,
  isEncryptedFieldPayload,
} from '../services/atRestFieldEncryption';

// Canonical, frontend-only store for real user-entered Pregnancy medical
// events (appointments and exams). Same conventions as
// pregnancyJournalStore.ts (plain async read/write, no in-memory cache —
// consumers refetch on focus). This is the ONE store every screen that
// shows "Prochain RDV"/"Prochain examen"/calendar markers/"À venir" must
// read from; do not create a second appointments/exams store.
export type PregnancyMedicalEventType = 'appointment' | 'exam';

/** Reminder lead time, relative to the event's own date/time. 'custom' fires
 * at `reminderTime` on the event's own date instead of an offset. */
export type PregnancyReminderOffset = '30min' | '1hour' | '2hours' | '1day' | 'custom';

export type PregnancyMedicalEvent = {
  id: string;
  type: PregnancyMedicalEventType;
  /** ISO date, 'YYYY-MM-DD' — same convention as pregnancyJournalStore. */
  date: string;
  time?: string;
  title: string;
  practitioner?: string;
  location?: string;
  notes?: string;
  /** Reminder preference for this event — synced to a real scheduled local
   * notification by src/utils/pregnancyEventReminders.ts whenever the event
   * is saved or deleted. */
  reminderEnabled?: boolean;
  reminderOffset?: PregnancyReminderOffset;
  /** 'HH:mm', local time — only meaningful when reminderOffset is 'custom'. */
  reminderTime?: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = '@hawa/pregnancy-medical-events';

// Encryption at rest — `notes` is this event's sensitive free-text field;
// type/date/time/title/practitioner/location/reminder settings stay
// plaintext (structured values needed for list/calendar display and the
// reminder-scheduling logic in pregnancyEventReminders.ts). Encrypted ONLY
// at the AsyncStorage persistence boundary — readEvents()'s callers always
// receive plain decrypted strings, so no screen needs to change. Same
// AES-256-GCM mechanism as miscarriageJournalStore.ts, own Keychain service.
const ENCRYPTION_SERVICE = 'com.hawa.private.pregnancy-medical-events.encryption-key';

async function decryptEventFromStorage(raw: Record<string, unknown>): Promise<PregnancyMedicalEvent> {
  const output = {...raw};
  const value = raw.notes;
  if (isEncryptedFieldPayload(value)) {
    try {
      output.notes = await decryptFieldValue<string>(ENCRYPTION_SERVICE, value);
    } catch {
      delete output.notes;
    }
  }
  return output as unknown as PregnancyMedicalEvent;
}

async function encryptEventForStorage(event: PregnancyMedicalEvent): Promise<Record<string, unknown>> {
  const output: Record<string, unknown> = {...event};
  if (event.notes) {
    output.notes = await encryptFieldValue(ENCRYPTION_SERVICE, event.notes);
  } else {
    delete output.notes;
  }
  return output;
}

async function readEvents(): Promise<PregnancyMedicalEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {return [];}
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {return [];}
    return await Promise.all(parsed.map(entry => decryptEventFromStorage(entry as Record<string, unknown>)));
  } catch {
    return [];
  }
}

async function writeEvents(events: PregnancyMedicalEvent[]): Promise<void> {
  const serializable = await Promise.all(events.map(encryptEventForStorage));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

/** One-shot, idempotent, crash-safe migration for every event's `notes`
 * ever saved before encryption-at-rest existed — called once at app boot
 * (App.tsx). Checks the RAW persisted JSON for any plaintext `notes` field
 * so an already-migrated store skips past without re-encrypting on every
 * boot. See migrateLegacyPlainMiscarriageNotes() in
 * miscarriageJournalStore.ts for the identical reasoning. */
export async function migrateLegacyPlainPregnancyMedicalEventNotes(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {return;}
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {return;}
    const hasLegacyPlaintext = parsed.some(entry => typeof (entry as {notes?: unknown}).notes === 'string' && (entry as {notes?: string}).notes);
    if (!hasLegacyPlaintext) {return;}

    const events = await readEvents();
    await writeEvents(events);
  } catch {
    // Never throw out of a boot-time migration — next launch retries.
  }
}

export async function getPregnancyMedicalEvents(): Promise<PregnancyMedicalEvent[]> {
  return readEvents();
}

/** Adds a new event or, when `event.id` matches an existing one, replaces it. */
export async function savePregnancyMedicalEvent(event: PregnancyMedicalEvent): Promise<PregnancyMedicalEvent[]> {
  const events = await readEvents();
  const next = [...events.filter(item => item.id !== event.id), event];
  await writeEvents(next);
  return next;
}

export async function deletePregnancyMedicalEvent(id: string): Promise<PregnancyMedicalEvent[]> {
  const events = await readEvents();
  const next = events.filter(item => item.id !== id);
  await writeEvents(next);
  return next;
}

function toISODate(date: Date): string {
  return date.toLocaleDateString('en-CA');
}

function compareEventsChronologically(a: PregnancyMedicalEvent, b: PregnancyMedicalEvent): number {
  if (a.date !== b.date) {return a.date.localeCompare(b.date);}
  return (a.time ?? '').localeCompare(b.time ?? '');
}

/** Pure selector — first future event of the given type, sorted ascending. Used identically by Dashboard/Calendar so they can never disagree. */
export function getNextUpcomingEvent(
  events: readonly PregnancyMedicalEvent[],
  type: PregnancyMedicalEventType,
  referenceDate: Date,
): PregnancyMedicalEvent | undefined {
  const todayISO = toISODate(referenceDate);
  return events
    .filter(event => event.type === type && event.date >= todayISO)
    .sort(compareEventsChronologically)[0];
}

/** Pure selector — every future event (appointment + exam), sorted ascending. */
export function getUpcomingEvents(
  events: readonly PregnancyMedicalEvent[],
  referenceDate: Date,
): PregnancyMedicalEvent[] {
  const todayISO = toISODate(referenceDate);
  return events.filter(event => event.date >= todayISO).sort(compareEventsChronologically);
}

/** Pure selector — every event on a given 'YYYY-MM-DD' date, sorted by time. */
export function getEventsForDate(
  events: readonly PregnancyMedicalEvent[],
  dateISO: string,
): PregnancyMedicalEvent[] {
  return events.filter(event => event.date === dateISO).sort(compareEventsChronologically);
}
