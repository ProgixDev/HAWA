import {startOfDay} from './cycleMath';
import {hijriMonthStart, isRamadan, nextHijriMonthStart} from './hijriCalendar';
import {computeQadaaFromHistory} from './qadaaLogic';
import {cancelLocalNotification, scheduleLocalNotification} from '../services/pregnancyNotifications';
import {getSpiritualMarkersEnabled} from '../state/onboardingPreferences';
import {
  hydrateConfirmedPeriodHistory,
  type ConfirmedPeriodOccurrence,
} from '../state/confirmedPeriodHistoryStore';
import {hydrateQadaaProgress} from '../state/qadaaProgressStore';
import {
  DEFAULT_QADAA_REMINDER_NOTIFICATION_STATE,
  hydrateQadaaReminderNotificationState,
  setQadaaReminderNotificationState,
} from '../state/qadaaReminderNotificationStore';

// Real LOCAL scheduled notification completing the post-Ramadan Qadaa
// reminder (src/utils/qadaaLogic.ts's shouldShowQadaaReminder()) so it can
// appear even when AWA is closed — the existing in-screen reactive card
// (FastingQadaaScreen.tsx) is untouched by this file. No backend, no
// server push: this reuses the exact same local-notification chokepoint
// (pregnancyNotifications.ts) already used by every other AWA reminder.
export const QADAA_POST_RAMADAN_NOTIFICATION_ID = 'qadaa-post-ramadan-reminder';

// Tag carried in the notification's `data` payload so
// genericReminderNotificationPersistence.ts can recognize and record this
// reminder into the in-app notification history — never used to decide
// whether/how to schedule.
export const QADAA_POST_RAMADAN_NOTIFICATION_KIND = 'qadaa-post-ramadan';

// Matches the fixed local fire-hour convention already established by
// postpartumNifasReminderScheduling.ts's own reminders.
const REMINDER_HOUR = 9;

const NOTIFICATION_TITLE = 'Jeûnes à rattraper';
const NOTIFICATION_BODY =
  'Il te reste des jours de jeûne à rattraper. Tu peux organiser ton suivi dans AWA.';

const dateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toOccurrenceDates = (occurrence: ConfirmedPeriodOccurrence) => ({
  periodStart: new Date(occurrence.periodStart),
  periodEndDateTime: new Date(occurrence.periodEndDateTime),
});

function reminderFireDate(ramadanMonthStart: Date): Date {
  const dayAfterRamadan = nextHijriMonthStart(ramadanMonthStart);
  const fireDate = startOfDay(dayAfterRamadan);
  fireDate.setHours(REMINDER_HOUR, 0, 0, 0);
  return fireDate;
}

function occurrenceIdFor(ramadanMonthStartKey: string, fireDate: Date): string {
  return `qadaa-post-ramadan:${ramadanMonthStartKey}:${fireDate.getTime()}`;
}

async function clearQadaaReminder(): Promise<void> {
  await cancelLocalNotification(QADAA_POST_RAMADAN_NOTIFICATION_ID);
  await setQadaaReminderNotificationState(DEFAULT_QADAA_REMINDER_NOTIFICATION_STATE);
}

/**
 * Recomputes remainingQadaaDays the exact same way useQadaaStatus.ts does —
 * same computeQadaaFromHistory() + qadaaProgressStore combination, not a
 * second calculation. A module-level sync (called from App.tsx) has no
 * React hook context to reuse the hook itself; reading qadaaStore.ts's
 * cached value instead was considered but rejected, since that cache is
 * only as fresh as the last time some Qadaa screen happened to be opened —
 * a real scheduled notification needs the current canonical value even if
 * she hasn't opened Fasting/Qadaa at all this Ramadan.
 */
async function computeCurrentRemainingQadaaDays(): Promise<number> {
  const [history, progress] = await Promise.all([
    hydrateConfirmedPeriodHistory(),
    hydrateQadaaProgress(),
  ]);
  const result = computeQadaaFromHistory(history.map(toOccurrenceDates));
  const completed = Math.min(result.remainingDays, progress.completedDays);
  return Math.max(0, result.remainingDays - completed);
}

/**
 * Keeps a single local scheduled notification in sync with the same
 * canonical Ramadan/Qadaa state the in-app reactive card already uses.
 *
 * Eligibility is only actively (re)computed while today is IN Ramadan: the
 * notification's whole purpose is to fire the moment Ramadan ends, so
 * `isRamadan(today)` becoming false is the intended arrival condition, not
 * an invalidation — a pending, already-correctly-computed schedule is left
 * alone once Ramadan ends rather than cancelled just because the
 * eligibility window closed (that would disagree with the in-app card about
 * when the reminder should exist). Disabling spiritual markers is checked
 * unconditionally, regardless of Ramadan status, so this notification is
 * never left scheduled after the user explicitly turns that preference off.
 * Nifas/Prayer/Pregnancy notifications are untouched — this only ever
 * cancels/schedules its own single, stable notification id.
 */
export async function syncQadaaReminderNotification(): Promise<void> {
  const previous = await hydrateQadaaReminderNotificationState();

  if (!getSpiritualMarkersEnabled()) {
    if (previous.scheduled || previous.fireAt) {
      await clearQadaaReminder();
    }
    return;
  }

  const today = startOfDay(new Date());
  if (!isRamadan(today)) {
    // Not in Ramadan: nothing new to evaluate. A schedule computed during
    // THIS Ramadan (fire date still in the future) is intentionally left
    // untouched — see function doc.
    return;
  }

  const remainingQadaaDays = await computeCurrentRemainingQadaaDays();
  if (remainingQadaaDays <= 0) {
    if (previous.scheduled || previous.fireAt) {
      await clearQadaaReminder();
    }
    return;
  }

  const ramadanMonthStart = hijriMonthStart(today);
  const ramadanMonthStartKey = dateKey(ramadanMonthStart);
  const fireDate = reminderFireDate(ramadanMonthStart);
  const occurrenceId = occurrenceIdFor(ramadanMonthStartKey, fireDate);

  const canReuseSchedule =
    previous.scheduled &&
    previous.ramadanMonthStartKey === ramadanMonthStartKey &&
    previous.occurrenceId === occurrenceId;
  if (canReuseSchedule) {
    return;
  }

  const scheduled = await scheduleLocalNotification({
    id: QADAA_POST_RAMADAN_NOTIFICATION_ID,
    title: NOTIFICATION_TITLE,
    body: NOTIFICATION_BODY,
    fireDate,
    data: {
      hawaNotificationKind: QADAA_POST_RAMADAN_NOTIFICATION_KIND,
      inAppOccurrenceId: occurrenceId,
      inAppTitle: NOTIFICATION_TITLE,
      inAppMessage: NOTIFICATION_BODY,
    },
  });

  await setQadaaReminderNotificationState({
    ramadanMonthStartKey,
    fireAt: fireDate.toISOString(),
    occurrenceId,
    scheduled,
  });
}

/** Public wrapper — cancels the scheduled reminder and clears persisted state. */
export async function cancelQadaaReminderNotification(): Promise<void> {
  await clearQadaaReminder();
}
