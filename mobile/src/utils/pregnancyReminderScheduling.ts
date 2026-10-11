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
import {cancelEventReminder, syncEventReminder} from './pregnancyEventReminders';
import {getActiveObjective, hydrateActiveObjective} from '../state/onboardingPreferences';
import {areReminderSourcesUnavailable} from './reminderSourceAvailability';
import {createSerializer} from './serializedSync';
import {parseTimeOfDay} from './timeOfDay';
import i18n from '../i18n';

// Every Pregnancy sync below (the bulk resync, the objective gate, the cancel-everything sweep and the single
// reminder syncs) runs through ONE serializer: two overlapping runs used to be able to finish in the wrong order
// (an older run, working from older settings, re-creating a reminder the person had just switched off). Run N
// starts after run N-1 finished and reads the stored state at ITS start, so the last run always wins.
const runPregnancySync = createSerializer();

// Scheduling for every recurring/one-off Pregnancy Tracking reminder that
// ISN'T a per-appointment/exam reminder (those live in
// pregnancyEventReminders.ts). Each reminder kind gets a stable notification
// id derived from its domain id, so re-syncing is always a safe upsert.

const WEEKLY_UPDATE_ID = 'pregnancy-weekly-update';

/** Every stored record the Pregnancy notifications are derived from (owner-wide keys). */
export const PREGNANCY_REMINDER_SOURCE_BASES = [
  '@hawa/pregnancy-dating',
  '@hawa/pregnancy-notification-settings',
  '@hawa/pregnancy-medical-events',
  '@hawa/pregnancy-health-reminders',
  '@hawa/pregnancy-custom-reminders',
] as const;
const DAILY_JOURNAL_ID = 'pregnancy-daily-journal';

// Tag carried in the notification's `data` payload so
// genericReminderNotificationPersistence.ts can recognize and record every
// Pregnancy reminder (this file's weekly-update/daily-journal/health/custom,
// plus pregnancyEventReminders.ts's appointment/exam reminders) into the
// in-app notification history — never used to decide whether/how to
// schedule. Exported so pregnancyEventReminders.ts can reuse the same
// constant instead of redeclaring it.
export const PREGNANCY_REMINDER_NOTIFICATION_KIND = 'pregnancy-reminder';

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
  // A stored "24:30" (what an en-US build wrote for midnight) is 00:30 of the same day; anything unreadable
  // stays 00:00 as before.
  return parseTimeOfDay(value) ?? {hours: 0, minutes: 0};
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

  const title = i18n.t('notifications.pregnancy.weeklyUpdate.title');
  const body = i18n.t('notifications.pregnancy.weeklyUpdate.body');

  await scheduleLocalNotification({
    id: WEEKLY_UPDATE_ID,
    title,
    body,
    fireDate: nextWeeklyUpdateFireDate(status.gestationalDays, '09:00'),
    repeatFrequency: 'weekly',
    data: {
      hawaNotificationKind: PREGNANCY_REMINDER_NOTIFICATION_KIND,
      pregnancyReminderType: 'weekly-update',
      inAppTitle: title,
      inAppMessage: body,
    },
  });
}

async function syncDailyJournalReminder(settings: PregnancyNotificationSettings): Promise<void> {
  if (!settings.dailyJournalEnabled) {
    await cancelLocalNotification(DAILY_JOURNAL_ID);
    return;
  }

  const title = i18n.t('notifications.pregnancy.dailyJournal.title');
  const body = i18n.t('notifications.pregnancy.dailyJournal.body');

  await scheduleLocalNotification({
    id: DAILY_JOURNAL_ID,
    title,
    body,
    fireDate: nextDailyFireDate(settings.dailyJournalTime),
    repeatFrequency: 'daily',
    data: {
      hawaNotificationKind: PREGNANCY_REMINDER_NOTIFICATION_KIND,
      pregnancyReminderType: 'daily-journal',
      inAppTitle: title,
      inAppMessage: body,
    },
  });
}

function todayISO(): string {
  return new Date().toLocaleDateString('en-CA');
}

async function syncHealthReminderNow(reminder: HealthReminder): Promise<void> {
  const id = healthReminderNotificationId(reminder);

  // The medicine/vitamin name is field-level encrypted and becomes the notification body. When it could not be
  // decrypted the store hands back an empty name: scheduling now would REPLACE a perfectly good trigger with one
  // that has a blank body. An unreadable reminder is left exactly as it is.
  if (reminder.enabled && !reminder.name.trim()) {return;}

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

  const title = reminder.kind === 'vitamin'
    ? i18n.t('notifications.pregnancy.vitaminTitle')
    : i18n.t('notifications.pregnancy.medicationTitle');

  await scheduleLocalNotification({
    id,
    title,
    body: reminder.name,
    fireDate,
    repeatFrequency: 'daily',
    data: {
      hawaNotificationKind: PREGNANCY_REMINDER_NOTIFICATION_KIND,
      pregnancyReminderType: 'health',
      inAppTitle: title,
      inAppMessage: reminder.name,
    },
  });
}

export function syncHealthReminder(reminder: HealthReminder): Promise<void> {
  return runPregnancySync(() => syncHealthReminderNow(reminder));
}

/** Next occurrence, at `start`'s time of day, on the same weekday as `start` (local time). */
export function nextWeeklyFireDate(start: Date, now = new Date()): Date {
  const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), start.getHours(), start.getMinutes(), 0, 0);
  candidate.setDate(candidate.getDate() + ((start.getDay() - candidate.getDay() + 7) % 7));
  if (candidate.getTime() <= now.getTime()) {candidate.setDate(candidate.getDate() + 7);}
  return candidate;
}

/** First fire date to hand to the scheduler for a custom reminder. The
 * scheduler skips any date in the past, so a repeating (daily/weekly)
 * reminder whose saved start date/time has passed is moved to its NEXT future
 * occurrence (same time; same weekday for weekly) — otherwise it would end up
 * with no notification at all. A start still in the future is kept as is; a
 * 'once' reminder always keeps its own date/time (past = simply not scheduled).
 * The saved reminder itself is never modified. */
export function customReminderFireDate(reminder: CustomReminder, now = new Date()): Date {
  const {hours, minutes} = parseHHmm(reminder.time);
  const [year, month, day] = reminder.date.split('-').map(Number);
  const start = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (reminder.repeat === 'once' || start.getTime() > now.getTime()) {return start;}
  return reminder.repeat === 'weekly' ? nextWeeklyFireDate(start, now) : nextDailyFireDate(reminder.time, now);
}

async function syncCustomReminderNow(reminder: CustomReminder): Promise<void> {
  const id = customReminderNotificationId(reminder);

  if (!reminder.enabled) {
    await cancelLocalNotification(id);
    return;
  }

  // Title/description are field-level encrypted and become the notification text. A title that could not be
  // decrypted comes back empty (a title is required when the reminder is created): scheduling would replace a
  // good trigger with a blank one. Leave an unreadable reminder exactly as it is.
  if (!reminder.title.trim()) {return;}

  const fireDate = customReminderFireDate(reminder);

  const body = reminder.description?.trim() || i18n.t('notifications.pregnancy.customReminderFallbackBody');

  await scheduleLocalNotification({
    id,
    title: reminder.title,
    body,
    fireDate,
    repeatFrequency: reminder.repeat === 'once' ? undefined : reminder.repeat,
    data: {
      hawaNotificationKind: PREGNANCY_REMINDER_NOTIFICATION_KIND,
      pregnancyReminderType: 'custom',
      inAppTitle: reminder.title,
      inAppMessage: body,
    },
  });
}

export function syncCustomReminder(reminder: CustomReminder): Promise<void> {
  return runPregnancySync(() => syncCustomReminderNow(reminder));
}

/** Cancels a health/custom reminder's notification (call on the user's own delete): the pending trigger AND
 * a copy of it that is already in the notification shade, because the reminder no longer exists. */
export function cancelHealthReminderNotification(reminder: HealthReminder): Promise<void> {
  return runPregnancySync(async () => {
    await cancelLocalNotification(healthReminderNotificationId(reminder), {dismissDisplayed: true});
  });
}

export function cancelCustomReminderNotification(reminder: CustomReminder): Promise<void> {
  return runPregnancySync(async () => {
    await cancelLocalNotification(customReminderNotificationId(reminder), {dismissDisplayed: true});
  });
}

/** Cancels every SCHEDULED Pregnancy notification instance — weekly update,
 * daily journal, appointment/exam reminders, vitamins/medications and custom
 * reminders — exactly the ids resyncAllPregnancyNotifications() schedules.
 * Only the scheduled notifications are cancelled: every saved setting, event
 * and reminder definition stays in its store, so switching back to Pregnancy
 * reschedules them from that saved state. Safe to call any number of times. */
async function cancelAllPregnancyNotificationsNow(): Promise<void> {
  await Promise.all([
    cancelLocalNotification(WEEKLY_UPDATE_ID),
    cancelLocalNotification(DAILY_JOURNAL_ID),
    (async () => {
      const events = await getPregnancyMedicalEvents();
      await Promise.all(events.map(event => cancelEventReminder(event.id)));
    })(),
    (async () => {
      const reminders = await getHealthReminders();
      await Promise.all(reminders.map(reminder => cancelLocalNotification(healthReminderNotificationId(reminder))));
    })(),
    (async () => {
      const reminders = await getCustomReminders();
      await Promise.all(reminders.map(reminder => cancelLocalNotification(customReminderNotificationId(reminder))));
    })(),
  ]);
}

export function cancelAllPregnancyNotifications(): Promise<void> {
  return runPregnancySync(cancelAllPregnancyNotificationsNow);
}

async function syncForActiveObjectiveNow(): Promise<void> {
  await hydrateActiveObjective();
  // An unreadable objective record falls back to the default objective: that is not "the user left Pregnancy", so
  // it must never cancel her pregnancy reminders (nor schedule another objective's).
  if (areReminderSourcesUnavailable({})) {return;}
  if (getActiveObjective() === 'pregnancy') {
    await resyncAllNow();
    return;
  }
  await cancelAllPregnancyNotificationsNow();
}

/** The objective lifecycle for Pregnancy notifications, like every other
 * objective's sync: they exist only while the active objective is
 * 'pregnancy' — scheduled (from the saved state) when it is, cancelled when it
 * is not (after delivery → Post-partum, or a switch to Loss / Cycle / …).
 * Called at startup, on every active-objective change and on foreground. */
export function syncPregnancyNotificationsForActiveObjective(): Promise<void> {
  return runPregnancySync(syncForActiveObjectiveNow);
}

/** Re-derives and reschedules every Pregnancy Tracking notification from
 * persisted state. Called once at app startup (App.tsx) so reminders survive
 * a restart, and again whenever "Notifications & rappels" settings change. */
export function resyncAllPregnancyNotifications(): Promise<void> {
  return runPregnancySync(resyncAllNow);
}

async function resyncAllNow(): Promise<void> {
  const settings = await hydratePregnancyNotificationSettings();
  // Every source is READ first, so that one that cannot be read is known before anything is derived: the stores
  // answer a failed read with defaults (weekly update ON, no dating, no events), and scheduling or cancelling from
  // those would invent or destroy reminders. Unreadable source => everything already scheduled stays as it is.
  const [, events, healthReminders, customReminders] = await Promise.all([
    hydratePregnancyDating(),
    getPregnancyMedicalEvents(),
    getHealthReminders(),
    getCustomReminders(),
  ]);
  if (areReminderSourcesUnavailable({ownerBases: PREGNANCY_REMINDER_SOURCE_BASES})) {return;}

  await Promise.all([
    syncWeeklyUpdateReminder(settings),
    syncDailyJournalReminder(settings),
    // The settings were read just above: handed down so each event does not re-read them. An event that fails
    // to schedule must not reject the whole resync (the others still have to be re-armed).
    Promise.all(events.map(event => syncEventReminder(event, settings).catch(() => undefined))),
    Promise.all(healthReminders.map(reminder => syncHealthReminderNow(reminder))),
    Promise.all(customReminders.map(reminder => syncCustomReminderNow(reminder))),
  ]);
}
