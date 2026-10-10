import {cancelLocalNotification, scheduleLocalNotification} from '../services/pregnancyNotifications';
import {nextDailyFireDate} from './pregnancyReminderScheduling';
import {getActiveObjective} from '../state/onboardingPreferences';
import {getMiscarriagePreferences} from '../state/miscarriagePreferences';
import {areReminderSourcesUnavailable} from './reminderSourceAvailability';
import i18n from '../i18n';

// Miscarriage's ONLY reminder — a single, optional, gentle "Suivi quotidien"
// nudge. Deliberately its own file/scheduler/notification ID, mirroring
// postpartumReminderScheduling.ts's/menopauseReminderScheduling.ts's own
// daily-tracking reminder exactly: reuses the same chokepoint
// (scheduleLocalNotification/cancelLocalNotification in
// pregnancyNotifications.ts) and the same HH:mm→Date helper
// (nextDailyFireDate). Never schedules without a real, user-chosen time, and
// never schedules while a different objective is active, so switching away
// from "Après une fausse couche" cleanly clears it.
//
// CRITICAL PRODUCT RULE: this file must NEVER compute or schedule a period-
// prediction, late-period, fertile-window, ovulation, or TTC-style reminder.
// The objective's whole purpose is a gentle space to track evolution after a
// loss WITHOUT resuming classic cycle/fertility tracking (see
// miscarriagePreferences.ts's own header comment and
// MiscarriageTryingAgainScreen.tsx) — this reminder only ever invites an
// optional daily check-in, nothing date-predictive.

const DAILY_TRACKING_REMINDER_ID = 'miscarriage-daily-tracking-reminder';

// Tag carried in the notification's `data` payload so
// genericReminderNotificationPersistence.ts can recognize and record this
// reminder into the in-app notification history — never used to decide
// whether/how to schedule.
export const MISCARRIAGE_DAILY_TRACKING_NOTIFICATION_KIND = 'miscarriage-daily-tracking-reminder';

// Exact, fixed wording required by spec — deliberately generic/discreet: no
// mention of miscarriage, periods, fertility or conception anywhere in the
// OS-visible text. The existing discreet-notification/privacy redaction in
// pregnancyNotifications.ts still applies automatically on top of this.
// Phase 4: functions (not static strings) — MiscarriageRemindersScreen.tsx
// (a component) calls these with its own `t` from useTranslation(); this
// file (not a component) calls them with the i18n singleton — both read the
// exact same keys, so the OS notification and the settings-screen preview
// can never drift apart, in either language.
export function miscarriageDailyTrackingNotificationTitle(t: (key: string) => string): string {
  return t('notifications.miscarriage.dailyTracking.title');
}
export function miscarriageDailyTrackingNotificationBody(t: (key: string) => string): string {
  return t('notifications.miscarriage.dailyTracking.body');
}

/** Re-derives and (re)schedules — or explicitly cancels — the Miscarriage
 * daily tracking reminder from real persisted preferences. Safe to call any
 * number of times (scheduleLocalNotification always cancels-then-reschedules
 * by id). Never schedules while a different objective is active, so
 * switching away from "Après une fausse couche" cleanly clears it. */
export async function syncMiscarriageDailyTrackingReminder(): Promise<void> {
  // Unreadable preferences are not "reminder off": the existing reminder is left untouched.
  if (areReminderSourcesUnavailable({ownerBases: ['@hawa/miscarriage-preferences/v1']})) {
    return;
  }
  const active = getActiveObjective() === 'loss';
  const preferences = getMiscarriagePreferences();

  if (
    !active ||
    !preferences.dailyTrackingReminderEnabled ||
    !preferences.dailyTrackingReminderTime
  ) {
    await cancelLocalNotification(DAILY_TRACKING_REMINDER_ID);
    return;
  }

  const title = miscarriageDailyTrackingNotificationTitle(i18n.t);
  const body = miscarriageDailyTrackingNotificationBody(i18n.t);

  await scheduleLocalNotification({
    id: DAILY_TRACKING_REMINDER_ID,
    title,
    body,
    fireDate: nextDailyFireDate(preferences.dailyTrackingReminderTime),
    repeatFrequency: 'daily',
    data: {
      hawaNotificationKind: MISCARRIAGE_DAILY_TRACKING_NOTIFICATION_KIND,
      inAppTitle: title,
      inAppMessage: body,
    },
  });
}
