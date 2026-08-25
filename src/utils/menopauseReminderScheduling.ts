import {cancelLocalNotification, scheduleLocalNotification} from '../services/pregnancyNotifications';
import {nextDailyFireDate} from './pregnancyReminderScheduling';
import {getActiveObjective} from '../state/onboardingPreferences';
import {getMenopausePreferences} from '../state/menopausePreferences';

// Menopause's two optional reminders — reuses the exact same chokepoint
// (scheduleLocalNotification/cancelLocalNotification in
// pregnancyNotifications.ts) and the same HH:mm→Date helper
// (nextDailyFireDate) Contraception's own daily reminder already shares.
// Same shape/guard contract as contraceptionReminderScheduling.ts's
// syncContraceptionReminder(): never schedules without a real, user-chosen
// time, and never schedules while a different objective is active, so
// switching away from Menopause cleanly clears both.

const DAILY_TRACKING_REMINDER_ID = 'menopause-daily-tracking-reminder';
const TREATMENT_REMINDER_ID = 'menopause-treatment-reminder';

// Tags carried in the notification's `data` payload so
// menopauseReminderNotificationNavigation.ts can tell which of the two this
// is once tapped — never used to decide whether/how to schedule.
export const MENOPAUSE_DAILY_TRACKING_NOTIFICATION_KIND = 'menopause-daily-tracking-reminder';
export const MENOPAUSE_TREATMENT_NOTIFICATION_KIND = 'menopause-treatment-reminder';

async function syncDailyTrackingReminder(active: boolean): Promise<void> {
  const preferences = getMenopausePreferences();

  if (!active || !preferences.dailyTrackingReminderEnabled || !preferences.dailyTrackingReminderTime) {
    await cancelLocalNotification(DAILY_TRACKING_REMINDER_ID);
    return;
  }

  await scheduleLocalNotification({
    id: DAILY_TRACKING_REMINDER_ID,
    title: 'Ton suivi du jour',
    body: 'Prends un moment pour noter comment tu te sens aujourd’hui.',
    fireDate: nextDailyFireDate(preferences.dailyTrackingReminderTime),
    repeatFrequency: 'daily',
    data: {hawaNotificationKind: MENOPAUSE_DAILY_TRACKING_NOTIFICATION_KIND},
  });
}

async function syncTreatmentReminder(active: boolean): Promise<void> {
  const preferences = getMenopausePreferences();

  // Re-checked here (not just at onboarding time) so a later change away
  // from hormonal-treatment tracking silently stops this reminder instead
  // of continuing to fire for a treatment the user no longer tracks.
  const shouldSchedule =
    active &&
    preferences.hormonalTreatmentStatus === 'track' &&
    preferences.treatmentReminderEnabled &&
    Boolean(preferences.treatmentReminderTime);

  if (!shouldSchedule) {
    await cancelLocalNotification(TREATMENT_REMINDER_ID);
    return;
  }

  await scheduleLocalNotification({
    id: TREATMENT_REMINDER_ID,
    title: 'Petit rappel',
    body: 'Ton rappel personnel est prévu maintenant.',
    fireDate: nextDailyFireDate(preferences.treatmentReminderTime as string),
    repeatFrequency: 'daily',
    data: {hawaNotificationKind: MENOPAUSE_TREATMENT_NOTIFICATION_KIND},
  });
}

/** Re-derives and (re)schedules — or explicitly cancels — both Menopause
 * reminders from real persisted preferences. Safe to call any number of
 * times. Called once at app startup (App.tsx) so reminders survive a
 * restart, and again whenever the active objective or Menopause preferences
 * change. */
export async function syncMenopauseReminders(): Promise<void> {
  const active = getActiveObjective() === 'menopause';
  await Promise.all([syncDailyTrackingReminder(active), syncTreatmentReminder(active)]);
}
