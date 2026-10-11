import {startOfDay} from './cycleMath';
import {hijriMonthStart, isRamadan, nextHijriMonthStart} from './hijriCalendar';
import {computeQadaaFromHistory} from './qadaaLogic';
import {
  cancelLocalNotification,
  getPendingReminderIds,
  scheduleLocalNotification,
} from '../services/pregnancyNotifications';
import {getSpiritualMarkersEnabled} from '../state/onboardingPreferences';
import {
  getConfirmedPeriodHistory,
  hydrateConfirmedPeriodHistory,
  type ConfirmedPeriodOccurrence,
} from '../state/confirmedPeriodHistoryStore';
import {getQadaaLedger, hydrateQadaaLedger} from '../state/qadaaLedgerStore';
import {isOwnerActive} from '../state/activeProfileStore';
import {computeQadaaBalance} from './qadaaBalance';
import {
  DEFAULT_QADAA_REMINDER_NOTIFICATION_STATE,
  hydrateQadaaReminderNotificationState,
  setQadaaReminderNotificationState,
  type QadaaReminderNotificationState,
} from '../state/qadaaReminderNotificationStore';
import {areReminderSourcesUnavailable} from './reminderSourceAvailability';
import {loadOwnerProfileData} from './ownerReminderGate';
import {coalescedSync, createSerializer} from './serializedSync';
import i18n from '../i18n';

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

function notificationTitle(): string {
  return i18n.t('notifications.qadaa.title');
}
function notificationBody(): string {
  return i18n.t('notifications.qadaa.body');
}

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
 * same computeQadaaFromHistory() + qadaaLedgerStore (manual entries and
 * completions) combined by computeQadaaBalance(), not a second calculation. A module-level sync (called from App.tsx) has no
 * React hook context to reuse the hook itself; reading qadaaStore.ts's
 * cached value instead was considered but rejected, since that cache is
 * only as fresh as the last time some Qadaa screen happened to be opened —
 * a real scheduled notification needs the current canonical value even if
 * she hasn't opened Fasting/Qadaa at all this Ramadan.
 *
 * SYNCHRONOUS on purpose: the caller has just waited for the owner's records to be read (loadOwnerProfileData) and
 * must derive from them in that same tick — an await here would be a window in which another profile could become
 * active and its records be read under the owner's reminder.
 */
function computeCurrentRemainingQadaaDays(): number {
  const history = getConfirmedPeriodHistory();
  const ledger = getQadaaLedger();
  const result = computeQadaaFromHistory(history.map(toOccurrenceDates));
  return computeQadaaBalance(result.remainingDays, ledger.manualEntries, ledger.completions).remainingDays;
}

type ReminderPlan = {ramadanMonthStartKey: string; fireDate: Date; occurrenceId: string};

/**
 * Hands the reminder to the notification layer — which REPLACES the pending trigger of this id in place, so it is
 * never "cancelled, then created" and a process killed in between cannot leave it without a trigger — and records what
 * happened. A native failure is recorded as "not scheduled" before it is rethrown, so the snapshot never claims a
 * trigger that does not exist (callers still see the rejection, exactly as before).
 */
async function armReminder(plan: ReminderPlan): Promise<void> {
  const title = notificationTitle();
  const body = notificationBody();

  let scheduled = false;
  let failure: {error: unknown} | null = null;
  try {
    scheduled = await scheduleLocalNotification({
      id: QADAA_POST_RAMADAN_NOTIFICATION_ID,
      title,
      body,
      fireDate: plan.fireDate,
      data: {
        hawaNotificationKind: QADAA_POST_RAMADAN_NOTIFICATION_KIND,
        inAppOccurrenceId: plan.occurrenceId,
        inAppTitle: title,
        inAppMessage: body,
      },
    });
  } catch (error) {
    failure = {error};
  }

  await setQadaaReminderNotificationState({
    ramadanMonthStartKey: plan.ramadanMonthStartKey,
    fireAt: plan.fireDate.toISOString(),
    occurrenceId: plan.occurrenceId,
    scheduled,
  });
  if (failure) {
    throw failure.error;
  }
}

/**
 * Whether the saved snapshot can be BELIEVED, not merely read: it says the reminder was scheduled, AND the
 * notification layer still has that trigger pending — or its moment has legitimately passed (it was delivered, so
 * nothing is expected to be pending). An OEM task killer, an app update or a reboot gap can remove a trigger the
 * snapshot still counts as scheduled; an unreadable pending list is "cannot confirm" and is treated as missing, since
 * re-scheduling is an upsert by id and being wrong in that direction costs nothing.
 */
async function snapshotStillHolds(state: QadaaReminderNotificationState): Promise<boolean> {
  if (!state.scheduled) {
    return false;
  }
  const fireAt = state.fireAt ? new Date(state.fireAt).getTime() : NaN;
  if (Number.isFinite(fireAt) && fireAt <= Date.now()) {
    return true;
  }
  let pending: ReadonlySet<string> | null;
  try {
    pending = await getPendingReminderIds();
  } catch {
    pending = null; // not obtainable at all is "cannot confirm" too
  }
  return pending !== null && pending.has(QADAA_POST_RAMADAN_NOTIFICATION_ID);
}

/**
 * Outside Ramadan nothing new is evaluated, and a reminder armed DURING Ramadan (the one meant to arrive when it
 * ends) is intentionally left alone rather than cancelled just because the eligibility window closed. It must still
 * EXIST, though: while its moment is still ahead it is re-armed — same id, same instant, replaced in place and never
 * cancelled first — when a forced sync asks for fresh content (privacy text, language), when the notification layer
 * no longer holds it, or when the earlier attempt failed (notifications were off). That is also what keeps a language
 * change on the first day of Shawwal, before the reminder's hour, from wiping it.
 */
async function keepArmedReminder(previous: QadaaReminderNotificationState, force: boolean): Promise<void> {
  if (!previous.ramadanMonthStartKey || !previous.fireAt || !previous.occurrenceId) {
    return;
  }
  const fireDate = new Date(previous.fireAt);
  if (!Number.isFinite(fireDate.getTime()) || fireDate.getTime() <= Date.now()) {
    return;
  }
  if (!force && (await snapshotStillHolds(previous))) {
    return;
  }
  await armReminder({
    ramadanMonthStartKey: previous.ramadanMonthStartKey,
    fireDate,
    occurrenceId: previous.occurrenceId,
  });
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
async function runQadaaSync(force: boolean): Promise<void> {
  // This reminder has an OWNER-GLOBAL id but is derived from the ACTIVE profile's confirmed periods and Qadaa ledger.
  // While a managed (daughter) profile is active those records are hers — a daughter who owes nothing used to make
  // this CANCEL the owner's reminder — so this run neither schedules, cancels nor changes anything: the owner's
  // trigger stays exactly as it is until she is active again. Checked before ANY read.
  if (!isOwnerActive()) {
    return;
  }

  const previous = await hydrateQadaaReminderNotificationState();
  // The owed-days balance is derived from the confirmed periods AND the user's own ledger, which must be READ — for
  // the OWNER — before anything is derived: right after a switch memory holds the previous profile's / a neutral
  // state. Re-checked after the wait; if a managed profile became active meanwhile, nothing is touched.
  const loaded = await loadOwnerProfileData(() => Promise.all([hydrateConfirmedPeriodHistory(), hydrateQadaaLedger()]));
  if (!loaded?.isCurrent()) {
    return;
  }
  // When either record (or the reminder's own) cannot be read, "0 owed" / "nothing scheduled" would be invented: leave
  // it as it is.
  if (areReminderSourcesUnavailable({
    ownerBases: ['@hawa/qadaa-post-ramadan-reminder/v1', 'awa:qadaa:progress:v1'],
    profileBases: ['@hawa/confirmed-period-history', 'awa:qadaa:ledger:v1'],
    includeObjective: false,
  })) {
    return;
  }

  if (!getSpiritualMarkersEnabled()) {
    if (previous.scheduled || previous.fireAt) {
      await clearQadaaReminder();
    }
    return;
  }

  const today = startOfDay(new Date());
  if (!isRamadan(today)) {
    // Not in Ramadan: nothing new to evaluate. A schedule computed during THIS Ramadan (fire date still in the
    // future) is intentionally left in place — see function doc — but must still exist.
    await keepArmedReminder(previous, force);
    return;
  }

  // Derived synchronously from the owner's just-read records (no await since the checks above).
  const remainingQadaaDays = computeCurrentRemainingQadaaDays();
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

  // The saved snapshot short-circuits the work only when it describes THIS occurrence, the earlier attempt really
  // scheduled, and the notification layer still holds the trigger (or it has legitimately been delivered). A forced
  // sync never trusts it: the OS-side trigger may no longer match (privacy text, language, timezone, restore).
  const sameOccurrence =
    previous.ramadanMonthStartKey === ramadanMonthStartKey && previous.occurrenceId === occurrenceId;
  if (!force && sameOccurrence && (await snapshotStillHolds(previous))) {
    return;
  }

  await armReminder({ramadanMonthStartKey, fireDate, occurrenceId});
}

// Every Qadaa operation (the plain sync, the forced one and the cancel) goes through ONE queue: two overlapping runs
// could otherwise finish in the wrong order and leave the saved snapshot describing a trigger that is not the one
// pending. A burst of plain syncs (every ledger / period / Hijri-adjustment change requests one) shares ONE follow-up
// run that starts afterwards and therefore reads the newest state.
const runQadaaOperation = createSerializer();
const runCoalescedQadaaSync = coalescedSync(() => runQadaaOperation(() => runQadaaSync(false)));

/** Zero-argument on purpose — it is handed straight to store subscribers and to `.then()`. */
export function syncQadaaReminderNotification(): Promise<void> {
  return runCoalescedQadaaSync();
}

/**
 * Public wrapper — cancels the scheduled reminder and clears persisted state. A no-op while a managed (daughter)
 * profile is active, exactly like the syncs: the reminder is the OWNER's, and a cancel issued in the daughter's name
 * (the language-change flow used to do `cancel().then(sync)`) would wipe it while the gated sync that follows cannot
 * re-arm it. Checked when the operation RUNS, behind whatever is in flight, not when it was requested.
 */
export function cancelQadaaReminderNotification(): Promise<void> {
  return runQadaaOperation(async () => {
    if (!isOwnerActive()) {
      return;
    }
    await clearQadaaReminder();
  });
}

/**
 * Re-derives and re-schedules the Qadaa reminder even when the saved snapshot says nothing changed (the OS-side
 * trigger may no longer match: a privacy / language setting changed so already-scheduled text is stale, the timezone
 * changed, records were restored). The pending trigger is replaced IN PLACE with the freshly built one — never
 * cancelled first — so it cannot be left cancelled when it should exist, including on the first day of Shawwal before
 * the reminder's hour, when the in-Ramadan derivation no longer applies and the snapshot's own moment is re-armed.
 * Same eligibility rules as the plain sync (spiritual markers off, nothing owed, unreadable records, a managed
 * profile active): those still clear, or leave, the reminder exactly as the plain sync would.
 */
export function forceSyncQadaaReminderNotification(): Promise<void> {
  return runQadaaOperation(() => runQadaaSync(true));
}
