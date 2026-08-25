import {cancelLocalNotification, scheduleLocalNotification} from '../services/pregnancyNotifications';
import {nextDailyFireDate} from './pregnancyReminderScheduling';
import {getActiveObjective} from '../state/onboardingPreferences';
import {getPostpartumPreferences} from '../state/postpartumPreferences';

// Post-partum's optional "Suivi quotidien" reminder — a separate, user-
// configurable, recurring health-tracking reminder. Deliberately its own
// file, own scheduler, own notification ID, completely independent from the
// automatic religious Nifas J35/J40 reminders (postpartumNifasReminderScheduling.ts,
// never touched here) — same clean-responsibilities split already used
// elsewhere (e.g. Menopause's dailyTrackingReminder vs. treatmentReminder are
// two independent toggles in the same file, but Nifas here is a fully
// separate PRODUCT concept — automatic date-based religious guidance, not a
// user-configurable health-tracking prompt — so it stays a separate file).
// Reuses the exact same chokepoint (scheduleLocalNotification/
// cancelLocalNotification in pregnancyNotifications.ts) and the same
// HH:mm→Date helper (nextDailyFireDate) Contraception/Menopause/Cycle already
// share. Never schedules without a real, user-chosen time, and never
// schedules while a different objective is active, so switching away from
// Post-partum cleanly clears it.

const DAILY_TRACKING_REMINDER_ID = 'postpartum-daily-tracking-reminder';

// Tag carried in the notification's `data` payload so a future navigation
// helper could tell this reminder apart from others if ever needed — never
// used to decide whether/how to schedule.
export const POSTPARTUM_DAILY_TRACKING_NOTIFICATION_KIND = 'postpartum-daily-tracking-reminder';

/** Re-derives and (re)schedules — or explicitly cancels — the Post-partum
 * daily tracking reminder from real persisted preferences. Safe to call any
 * number of times. Called once at app startup (App.tsx) so the reminder
 * survives a restart, and again whenever the active objective or Post-partum
 * preferences change. Never reads or writes postpartumNifasReminderStore.ts —
 * the two reminder systems are fully independent. */
export async function syncPostpartumDailyTrackingReminder(): Promise<void> {
  const active = getActiveObjective() === 'postpartum';
  const preferences = getPostpartumPreferences();

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
    data: {hawaNotificationKind: POSTPARTUM_DAILY_TRACKING_NOTIFICATION_KIND},
  });
}
