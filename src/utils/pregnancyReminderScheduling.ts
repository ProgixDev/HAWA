import {cancelLocalNotification, scheduleLocalNotification} from '../services/pregnancyNotifications';
import {computePregnancyStatus} from './pregnancyTrackingUtils';
import {hydratePregnancyDating} from '../state/pregnancyPreferences';
import {
  hydratePregnancyNotificationSettings,
  type PregnancyNotificationSettings,
} from '../state/pregnancyNotificationSettingsStore';
import {getHealthReminders, type HealthReminder} from '../state/pregnancyHealthRemindersStore';
import {getCustomReminders, type CustomReminder} from '../state/pregnancyCustomRemindersStore';
import {getPregnancyMedicalEvents} from '../state/pregnancyMedicalEventsStore';
import {syncEventReminder} from './pregnancyEventReminders';

// Scheduling for every recurring/one-off Pregnancy Tracking reminder that
// ISN'T a per-appointment/exam reminder (those live in
// pregnancyEventReminders.ts). Each reminder kind gets a stable notification
// id derived from its domain id, so re-syncing is always a safe upsert.

const WEEKLY_UPDATE_ID = 'pregnancy-weekly-update';
const DAILY_JOURNAL_ID = 'pregnancy-daily-journal';

function healthReminderNotificationId(reminder: HealthReminder): string {
  return `pregnancy-health-${reminder.id}`;
}

function customReminderNotificationId(reminder: CustomReminder): string {
  return `pregnancy-custom-${reminder.id}`;
}

/** Exported so other objectives' reminder-scheduling modules (e.g.
 * conceptionReminderScheduling.ts) can reuse these instead of duplicating
 * the same HH:mm parsing / "roll to next occurrence" logic. */
export function parseHHmm(value: string): {hours: number; minutes: number} {
  const [hours, minutes] = value.split(':').map(Number);
  return {hours: hours || 0, minutes: minutes || 0};
}

/** Next occurrence of `time` today-or-later, local time. */
export function nextDailyFireDate(time: string, now = new Date()): Date {
  const {hours, minutes} = parseHHmm(time);
  const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
  if (candidate.getTime() <= now.getTime()) {candidate.setDate(candidate.getDate() + 1);}
  return candidate;
}

/** Next weekly gestational-week boundary at `time`, derived from the SAME computePregnancyStatus() every other pregnancy screen uses — never a separately reimplemented date formula. */
function nextWeeklyUpdateFireDate(gestationalDays: number, time: string, now = new Date()): Date {
  const {hours, minutes} = parseHHmm(time);
  const daysUntilBoundary = (7 - gestationalDays) % 7;
  const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
  candidate.setDate(candidate.getDate() + daysUntilBoundary);
  if (candidate.getTime() <= now.getTime()) {candidate.setDate(candidate.getDate() + 7);}
  return candidate;
}

async function syncWeeklyUpdateReminder(settings: PregnancyNotificationSettings): Promise<void> {
  if (!settings.weeklyUpdateEnabled) {
    await cancelLocalNotification(WEEKLY_UPDATE_ID);
    return;
  }

  const dating = await hydratePregnancyDating();
  const status = computePregnancyStatus(dating.method, dating.date ? new Date(dating.date) : null, new Date());

  if (!status.configured) {
    await cancelLocalNotification(WEEKLY_UPDATE_ID);
    return;
  }

  await scheduleLocalNotification({
    id: WEEKLY_UPDATE_ID,
    title: 'Nouvelle semaine de grossesse',
    body: 'Découvre les informations de ta nouvelle semaine.',
    fireDate: nextWeeklyUpdateFireDate(status.gestationalDays, '09:00'),
    repeatFrequency: 'weekly',
  });
}

async function syncDailyJournalReminder(settings: PregnancyNotificationSettings): Promise<void> {
  if (!settings.dailyJournalEnabled) {
    await cancelLocalNotification(DAILY_JOURNAL_ID);
    return;
  }

  await scheduleLocalNotification({
    id: DAILY_JOURNAL_ID,
    title: 'Journal quotidien',
    body: 'Prends un instant pour compléter ton suivi du jour.',
    fireDate: nextDailyFireDate(settings.dailyJournalTime),
    repeatFrequency: 'daily',
  });
}

function todayISO(): string {
  return new Date().toLocaleDateString('en-CA');
}

export async function syncHealthReminder(reminder: HealthReminder): Promise<void> {
  const id = healthReminderNotificationId(reminder);

  const today = todayISO();
  const expired = reminder.kind === 'medication' && Boolean(reminder.endDate) && reminder.endDate! < today;
  const notStarted = reminder.kind === 'medication' && Boolean(reminder.startDate) && reminder.startDate! > today;

  if (!reminder.enabled || expired) {
    await cancelLocalNotification(id);
    return;
  }

  const fireDate = notStarted ? (() => {
    const {hours, minutes} = parseHHmm(reminder.time);
    const [year, month, day] = reminder.startDate!.split('-').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  })() : nextDailyFireDate(reminder.time);

  await scheduleLocalNotification({
    id,
    title: reminder.kind === 'vitamin' ? 'Vitamines & compléments' : 'Médicament',
    body: reminder.name,
    fireDate,
    repeatFrequency: 'daily',
  });
}

export async function syncCustomReminder(reminder: CustomReminder): Promise<void> {
  const id = customReminderNotificationId(reminder);

  if (!reminder.enabled) {
    await cancelLocalNotification(id);
    return;
  }

  const {hours, minutes} = parseHHmm(reminder.time);
  const [year, month, day] = reminder.date.split('-').map(Number);
  const fireDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

  await scheduleLocalNotification({
    id,
    title: reminder.title,
    body: reminder.description?.trim() || 'Rappel personnalisé',
    fireDate,
    repeatFrequency: reminder.repeat === 'once' ? undefined : reminder.repeat,
  });
}

/** Cancels a health/custom reminder's notification (call on delete). */
export async function cancelHealthReminderNotification(reminder: HealthReminder): Promise<void> {
  await cancelLocalNotification(healthReminderNotificationId(reminder));
}

export async function cancelCustomReminderNotification(reminder: CustomReminder): Promise<void> {
  await cancelLocalNotification(customReminderNotificationId(reminder));
}

/** Re-derives and reschedules every Pregnancy Tracking notification from
 * persisted state. Called once at app startup (App.tsx) so reminders survive
 * a restart, and again whenever "Notifications & rappels" settings change. */
export async function resyncAllPregnancyNotifications(): Promise<void> {
  const settings = await hydratePregnancyNotificationSettings();

  await Promise.all([
    syncWeeklyUpdateReminder(settings),
    syncDailyJournalReminder(settings),
    (async () => {
      const events = await getPregnancyMedicalEvents();
      await Promise.all(events.map(event => syncEventReminder(event)));
    })(),
    (async () => {
      const reminders = await getHealthReminders();
      await Promise.all(reminders.map(reminder => syncHealthReminder(reminder)));
    })(),
    (async () => {
      const reminders = await getCustomReminders();
      await Promise.all(reminders.map(reminder => syncCustomReminder(reminder)));
    })(),
  ]);
}
