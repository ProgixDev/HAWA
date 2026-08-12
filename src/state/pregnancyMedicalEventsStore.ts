import AsyncStorage from '@react-native-async-storage/async-storage';

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

async function readEvents(): Promise<PregnancyMedicalEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {return [];}
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PregnancyMedicalEvent[]) : [];
  } catch {
    return [];
  }
}

async function writeEvents(events: PregnancyMedicalEvent[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
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
