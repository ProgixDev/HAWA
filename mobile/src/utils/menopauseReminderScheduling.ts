import {cancelLocalNotification, scheduleLocalNotification} from '../services/pregnancyNotifications';
import {nextDailyFireDate} from './pregnancyReminderScheduling';
import {getActiveObjective, hydrateActiveObjective} from '../state/onboardingPreferences';
import {getMenopausePreferences} from '../state/menopausePreferences';
import {areReminderSourcesUnavailable} from './reminderSourceAvailability';
import {coalescedSync} from './serializedSync';
import i18n from '../i18n';

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

  const title = i18n.t('notifications.menopause.dailyTracking.title');
  const body = i18n.t('notifications.menopause.dailyTracking.body');

  await scheduleLocalNotification({
    id: DAILY_TRACKING_REMINDER_ID,
    title,
    body,
    fireDate: nextDailyFireDate(preferences.dailyTrackingReminderTime),
    repeatFrequency: 'daily',
    data: {
      hawaNotificationKind: MENOPAUSE_DAILY_TRACKING_NOTIFICATION_KIND,
      inAppTitle: title,
      inAppMessage: body,
    },
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

  const title = i18n.t('notifications.menopause.treatment.title');
  const body = i18n.t('notifications.menopause.treatment.body');

  await scheduleLocalNotification({
    id: TREATMENT_REMINDER_ID,
    title,
    body,
    fireDate: nextDailyFireDate(preferences.treatmentReminderTime as string),
    repeatFrequency: 'daily',
    data: {
      hawaNotificationKind: MENOPAUSE_TREATMENT_NOTIFICATION_KIND,
      inAppTitle: title,
      inAppMessage: body,
    },
  });
}

async function runMenopauseRemindersSync(): Promise<void> {
  // The objective gates this reminder, so it must have been READ first: before that memory holds the default
  // objective, and a run triggered by another store's hydration would cancel (or arm) reminders on its strength.
  await hydrateActiveObjective();
  // Unreadable preferences are not "reminders off": the existing reminders are left untouched.
  if (areReminderSourcesUnavailable({ownerBases: ['@hawa/menopause-preferences/v1']})) {
    return;
  }
  const active = getActiveObjective() === 'menopause';
  // Both are always run to completion before this run is over (a failure of one must not let a follow-up run start
  // while the other is still working); the first failure is then reported exactly as Promise.all would have.
  const outcomes = await Promise.allSettled([syncDailyTrackingReminder(active), syncTreatmentReminder(active)]);
  const failed = outcomes.find((outcome): outcome is PromiseRejectedResult => outcome.status === 'rejected');
  if (failed) {
    throw failed.reason;
  }
}

/** Re-derives and (re)schedules — or explicitly cancels — both Menopause
 * reminders from real persisted preferences. Safe to call any number of
 * times. Called once at app startup (App.tsx) so reminders survive a
 * restart, and again whenever the active objective or Menopause preferences
 * change. Calls made while a run is in progress share ONE follow-up run that
 * starts afterwards (and so reads the newest preferences): an older run can
 * never finish after a newer one and put back what was just switched off.
 * Takes no arguments — it is handed straight to store subscribers. */
export const syncMenopauseReminders = coalescedSync(runMenopauseRemindersSync);
