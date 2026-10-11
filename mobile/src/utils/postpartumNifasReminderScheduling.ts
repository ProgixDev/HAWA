import {
  cancelLocalNotifications,
  getPendingReminderIds,
  scheduleLocalNotification,
} from '../services/pregnancyNotifications';

import {
  NIFAS_EDUCATIONAL_ARTICLE_ID,
  NIFAS_REFERENCE_CONFIG_VERSION,
  NIFAS_REFERENCE_DAYS,
  NIFAS_WARNING_DAYS,
} from '../config/nifasReminderConfig';

import {
  getActiveObjective,
  getSpiritualMarkersEnabled,
  hydrateActiveObjective,
  hydrateSpiritualMarkersEnabled,
} from '../state/onboardingPreferences';

import {
  getAllPostpartumLochiaEntries,
  getPostpartumLochiaTracking,
  hydratePostpartumLochia,
} from '../state/postpartumLochiaStore';

import {
  hydratePostpartumPreferences,
} from '../state/postpartumPreferences';

import {
  getPostpartumNifasReminderState,
  hydratePostpartumNifasReminderState,
  setPostpartumNifasReminderState,
  type PostpartumNifasReminderState,
} from '../state/postpartumNifasReminderStore';

import {
  loadSecurityPreferences,
} from '../state/securityPreferences';

import {
  addInAppNotification,
} from '../state/inAppNotificationStore';

import {
  computePostpartumLochiaSummary,
} from './postpartumTrackingUtils';

import i18n from '../i18n';
import {areReminderSourcesUnavailable} from './reminderSourceAvailability';
import {createSerializer} from './serializedSync';

/* ============================================================
 * NOTIFICATION IDS
 * ============================================================ */

export const NIFAS_WARNING_NOTIFICATION_ID =
  'postpartum-nifas-warning';

export const NIFAS_REFERENCE_NOTIFICATION_ID =
  'postpartum-nifas-reference';

export const NIFAS_NOTIFICATION_IDS = [
  NIFAS_WARNING_NOTIFICATION_ID,
  NIFAS_REFERENCE_NOTIFICATION_ID,
] as const;

type ReminderType = 'warning' | 'reference';

/* ============================================================
 * DEVELOPMENT TEST MODE
 * ============================================================ */

/**
 * ⚠️ DEVELOPMENT TEST ONLY
 *
 * true:
 *   Nifas notifications are scheduled 2 minutes from now.
 *
 * false:
 *   Normal production J35 / J40 scheduling is used.
 *
 * __DEV__ guarantees this test behavior cannot run in a release build.
 */
const TEST_NIFAS_NOTIFICATIONS = __DEV__ && false;

/**
 * Test delay.
 *
 * 2 minutes = 120000 ms.
 */
const TEST_NOTIFICATION_DELAY_MS = 2 * 60 * 1000;

/* ============================================================
 * DATE HELPERS
 * ============================================================ */

/**
 * Production date calculation.
 *
 * Delivery day = Jour 1.
 *
 * Example:
 * deliveryDate = 2026-08-19
 * day = 40
 *
 * => J40 at 09:00 local time.
 */
const localThresholdDate = (
  deliveryDate: string,
  day: number,
): Date => {
  const [year, month, date] =
    deliveryDate.split('-').map(Number);

  return new Date(
    year,
    month - 1,
    date + day - 1,
    9,
    0,
    0,
    0,
  );
};

/**
 * Development-only notification time.
 *
 * Schedules the notification exactly 2 minutes
 * after syncPostpartumNifasReminders() runs.
 */
const developmentTestDate = (): Date => {
  return new Date(
    Date.now() + TEST_NOTIFICATION_DELAY_MS,
  );
};

/**
 * Returns either:
 *
 * DEV TEST:
 * now + 2 minutes
 *
 * PRODUCTION:
 * deliveryDate + configured day at 09:00
 */
const reminderFireDate = (
  deliveryDate: string,
  day: number,
): Date => {
  if (TEST_NIFAS_NOTIFICATIONS) {
    return developmentTestDate();
  }

  return localThresholdDate(
    deliveryDate,
    day,
  );
};

/* ============================================================
 * OCCURRENCE IDS
 * ============================================================ */

const occurrenceIdFor = (
  type: ReminderType,
  deliveryDate: string,
  fireDate: Date,
): string =>
  `postpartum-nifas-${type}:${deliveryDate}:${fireDate.getTime()}`;

/* ============================================================
 * CONTENT
 * ============================================================ */

// Wording reuses the same "repère/référence retenu(e) par AWA" vocabulary
// already validated in the Nifas educational article
// (NifasFiqhArticleScreen.tsx: "40 jours est une référence fréquemment
// retenue, sans être présentée comme une règle universelle par AWA" /
// callout "Repère souvent utilisé") — never presenting the 40-day figure as
// an absolute universal ruling, and never issuing an unconditional command
// where the app itself documents jurisprudential divergence.
//
// Phase 4 (i18n): translated via the notifications.postpartum.nifas.* keys,
// which — for French — hold the exact same strings this file always used
// (including reusing config/nifasReminderConfig.ts's NIFAS_REFERENCE_*_
// HEADLINE wording verbatim for `reachedTitle`), so French behavior is
// byte-identical. That config file's own exports (also read directly by
// PostpartumDashboard.tsx's Nifas banner/popup, and asserted on by
// PostpartumNifasConsistency.test.tsx) are deliberately left untouched —
// only THIS file's own notification/in-app-history copy is now
// language-aware, independent of that shared, still-French-only constant.
const internalContent = (
  type: ReminderType,
) =>
  type === 'warning'
    ? {
        title: i18n.t('notifications.postpartum.nifas.approachingTitle'),
        message: i18n.t('notifications.postpartum.nifas.approachingInAppMessage'),
      }
    : {
        title: i18n.t('notifications.postpartum.nifas.reachedTitle'),
        message: i18n.t('notifications.postpartum.nifas.reachedBody'),
      };

/**
 * Real title.
 *
 * scheduleLocalNotification() is responsible
 * for replacing this by the discreet AWA title
 * when notification preview privacy is enabled.
 *
 * The J40/reference notification gets its own stronger, specific title
 * (distinct from the generic in-app-history title in internalContent())
 * since this is the one the user actually sees announcing the religious
 * Nifas period has ended — the warning (J35) title is unchanged.
 */
const notificationTitle = (
  type: ReminderType,
): string =>
  type === 'reference'
    ? i18n.t('notifications.postpartum.nifas.reachedTitle')
    : internalContent(type).title;

/**
 * Real Android notification body.
 *
 * The J40/reference body deliberately matches the (equally reworded)
 * "selon ce repère" message from the Nifas completion popup on
 * PostpartumDashboard, just shortened for a notification — the popup
 * remains the detailed explanation.
 */
const notificationBody = (
  type: ReminderType,
): string =>
  type === 'reference'
    ? i18n.t('notifications.postpartum.nifas.reachedBody')
    : i18n.t('notifications.postpartum.nifas.approachingBody');

/* ============================================================
 * DEBUG LOG
 * ============================================================ */

const log = (
  ...args: unknown[]
): void => {
  if (__DEV__) {
    console.log(
      '[NIFAS]',
      ...args,
    );
  }
};

/* ============================================================
 * IN-APP RECONCILIATION
 * ============================================================ */

const saveDeliveredOccurrence = async (
  type: ReminderType,
  scheduled: boolean,
  fireAt: string | null,
  occurrenceId: string | null,
): Promise<void> => {
  // An in-app card says "this reached you". The schedule snapshot keeps the fire time and occurrence id even when
  // the notification was never handed to Android (notifications off at the time, or the day had already gone when
  // the delivery date was entered): recording a card for it would announce something that never happened.
  if (
    !scheduled ||
    !fireAt ||
    !occurrenceId
  ) {
    return;
  }

  const fireDate =
    new Date(fireAt);

  if (
    Number.isNaN(
      fireDate.getTime(),
    ) ||
    fireDate.getTime() >
      Date.now()
  ) {
    return;
  }

  const content =
    internalContent(type);

  log(
    'reconciliation',
    type,
    occurrenceId,
  );

  await addInAppNotification({
    id: occurrenceId,

    type:
      'postpartum-nifas',

    title:
      content.title,

    message:
      content.message,

    receivedAt:
      fireDate.toISOString(),

    read: false,

    route:
      'ArticleReader',

    data: {
      articleId:
        NIFAS_EDUCATIONAL_ARTICLE_ID,
    },
  });
};

/**
 * Reconciles only notifications whose
 * scheduled time has already passed.
 */
export async function reconcilePostpartumNifasInAppNotifications(): Promise<void> {
  await hydratePostpartumNifasReminderState();

  const state =
    getPostpartumNifasReminderState();

  await Promise.all([
    saveDeliveredOccurrence(
      'warning',
      state.warningScheduled,
      state.warningFireAt,
      state.warningOccurrenceId,
    ),

    saveDeliveredOccurrence(
      'reference',
      state.referenceScheduled,
      state.referenceFireAt,
      state.referenceOccurrenceId,
    ),
  ]);
}

/* ============================================================
 * CLEAR
 * ============================================================ */

/**
 * Cancels the J35/J40 notifications and clears the SCHEDULE snapshot only.
 *
 * It deliberately KEEPS `deliveryDate` and `completionAcknowledged`: the
 * "Compris" acknowledgement of the Nifas reference popup is keyed to its
 * delivery date (see postpartumNifasReminderStore.ts), not to whether
 * reminders are currently scheduled. This function runs for reasons unrelated
 * to that acknowledgement — switching to another objective, turning the
 * spiritual markers OFF, closing the lochia — and wiping it there made an
 * already-acknowledged informational popup/banner reappear on return. A
 * different delivery date still never inherits it (the match is on the date,
 * and syncPostpartumNifasReminders() resets the flag when the date changes).
 */
async function clearNifasReminders(): Promise<void> {
  await cancelLocalNotifications(
    NIFAS_NOTIFICATION_IDS,
  );

  // Read AFTER the awaited cancel so an acknowledgement recorded in the
  // meantime is never overwritten with a stale snapshot.
  const current =
    getPostpartumNifasReminderState();

  await setPostpartumNifasReminderState({
    deliveryDate:
      current.deliveryDate,

    configVersion:
      NIFAS_REFERENCE_CONFIG_VERSION,

    warningScheduled: false,

    referenceScheduled: false,

    completionAcknowledged:
      current.completionAcknowledged,

    warningFireAt: null,

    referenceFireAt: null,

    warningOccurrenceId: null,

    referenceOccurrenceId: null,
  });
}

/* ============================================================
 * IS THE SAVED SCHEDULE STILL TRUE?
 * ============================================================ */

/** The ids Android holds as pending triggers, or null when they cannot be read ("cannot confirm"). Never throws. */
const readPendingReminderIds = async (): Promise<ReadonlySet<string> | null> => {
  try {
    return await getPendingReminderIds();
  } catch {
    return null;
  }
};

/**
 * Whether the saved snapshot can be trusted as "what Android has": every reminder whose fire time is STILL AHEAD
 * must be both marked as scheduled (its last scheduling really reached Android) and present among Android's
 * pending triggers. Without this a first attempt that failed (notifications off, a transient native error) was
 * never retried, and triggers dropped by a phone update, a task killer or a reboot gap were never restored —
 * the snapshot kept saying "scheduled".
 *
 * A fire time that has already passed is NOT "missing": it fired (or can no longer be scheduled), and creating it
 * again would only be refused. A pending list that cannot be read is "cannot confirm", which re-schedules rather
 * than assumes. Re-scheduling is an upsert by id, so a doubt costs one native call, never a duplicate.
 */
async function isScheduleIntact(
  state: PostpartumNifasReminderState,
): Promise<boolean> {
  const now = Date.now();

  const reminders = [
    {
      id: NIFAS_WARNING_NOTIFICATION_ID,
      scheduled: state.warningScheduled,
      fireAt: Date.parse(state.warningFireAt ?? ''),
    },
    {
      id: NIFAS_REFERENCE_NOTIFICATION_ID,
      scheduled: state.referenceScheduled,
      fireAt: Date.parse(state.referenceFireAt ?? ''),
    },
  ];

  // A fire time that is not a date means the record itself is damaged: rebuild it.
  if (reminders.some(reminder => Number.isNaN(reminder.fireAt))) {
    return false;
  }

  const ahead = reminders.filter(reminder => reminder.fireAt > now);

  // Everything has already gone by: nothing is expected to exist.
  if (ahead.length === 0) {
    return true;
  }

  // Known not to have reached Android: no need to ask it.
  if (ahead.some(reminder => !reminder.scheduled)) {
    return false;
  }

  const pending = await readPendingReminderIds();

  if (!pending) {
    return false;
  }

  return ahead.every(reminder => pending.has(reminder.id));
}

/* ============================================================
 * MAIN SYNC
 * ============================================================ */

/**
 * Central idempotent sync — one run. The exported entry points below are its only callers and queue runs so that
 * two of them never overlap.
 *
 * PRODUCTION:
 * - warning → J35 at 09:00
 * - reference → J40 at 09:00
 *
 * DEVELOPMENT TEST:
 * - notifications → ~2 minutes from now
 *
 * `force` re-derives and re-schedules both reminders even when the saved snapshot says nothing changed. A run without
 * it skips the work only when the snapshot still describes what Android holds (see isScheduleIntact).
 */
async function syncNifasRemindersNow(force: boolean): Promise<void> {
  await Promise.all([
    hydrateActiveObjective(),

    hydrateSpiritualMarkersEnabled(),

    hydratePostpartumLochia(),

    loadSecurityPreferences(),

    hydratePostpartumNifasReminderState(),
  ]);

  const preferences =
    await hydratePostpartumPreferences();

  // The Nifas dates come from the delivery date, the lochia "ended" date and the previous schedule. When any of those
  // records cannot be READ, "no delivery date" / "lochia still open" are defaults, not facts: scheduling from them
  // would invent a Nifas status and the "not eligible" branch below would cancel a correct J35/J40 reminder and wipe
  // its schedule record. Leave everything exactly as it is until the data is readable again.
  if (
    areReminderSourcesUnavailable({
      ownerBases: [
        '@hawa/postpartum-preferences/v1',
        '@hawa/postpartum-lochia/v1',
        '@hawa/postpartum-nifas-reminders/v1',
      ],
    })
  ) {
    return;
  }

  const summary =
    computePostpartumLochiaSummary(
      preferences.deliveryDate,

      getAllPostpartumLochiaEntries(),

      getPostpartumLochiaTracking(),
    );

  /* ========================================================
   * CHECK ELIGIBILITY
   * ======================================================== */

  if (
    getActiveObjective() !==
      'postpartum' ||
    !getSpiritualMarkersEnabled() ||
    !preferences.deliveryDate ||
    summary.status === 'ended'
  ) {
    await clearNifasReminders();

    return;
  }

  const previous =
    getPostpartumNifasReminderState();

  /* ========================================================
   * REUSE EXISTING SCHEDULE
   * ======================================================== */

  // The saved snapshot is for this delivery date and this configuration and holds a complete schedule record.
  // That alone is NOT enough to skip scheduling (see isScheduleIntact): it does not say the reminders ever
  // reached Android, nor that Android still has them.
  const snapshotMatches =
    !TEST_NIFAS_NOTIFICATIONS &&
    previous.deliveryDate ===
      preferences.deliveryDate &&
    previous.configVersion ===
      NIFAS_REFERENCE_CONFIG_VERSION &&
    Boolean(
      previous.warningFireAt,
    ) &&
    Boolean(
      previous.referenceFireAt,
    ) &&
    Boolean(
      previous.warningOccurrenceId,
    ) &&
    Boolean(
      previous.referenceOccurrenceId,
    );

  /**
   * IMPORTANT:
   *
   * In test mode we intentionally DO NOT reuse
   * an old schedule.
   *
   * This ensures changing the test code and
   * reloading the app generates a fresh notification
   * 2 minutes from now.
   */
  if (
    snapshotMatches &&
    !force &&
    (await isScheduleIntact(previous))
  ) {
    await reconcilePostpartumNifasInAppNotifications();

    return;
  }

  /* ========================================================
   * CANCEL OLD TEST / SCHEDULE
   * ======================================================== */

  if (TEST_NIFAS_NOTIFICATIONS) {
    log(
      'TEST MODE — cancelling old Nifas notifications',
    );

    await cancelLocalNotifications(
      NIFAS_NOTIFICATION_IDS,
    );
  }

  /* ========================================================
   * FIRE DATES
   * ======================================================== */

  let warningDate =
    reminderFireDate(
      preferences.deliveryDate,
      NIFAS_WARNING_DAYS,
    );

  let referenceDate =
    reminderFireDate(
      preferences.deliveryDate,
      NIFAS_REFERENCE_DAYS,
    );

  /**
   * Both notifications cannot have exactly the same
   * timestamp because some Android schedulers may
   * display them together unpredictably.
   *
   * In TEST MODE:
   *
   * warning:
   * now + 2 minutes
   *
   * reference:
   * now + 2 minutes + 5 seconds
   *
   * They should therefore both appear around
   * the two-minute mark.
   */
  if (TEST_NIFAS_NOTIFICATIONS) {
    warningDate =
      new Date(
        Date.now() +
          TEST_NOTIFICATION_DELAY_MS,
      );

    referenceDate =
      new Date(
        Date.now() +
          TEST_NOTIFICATION_DELAY_MS +
          5000,
      );

    log(
      '⚠️ TEST MODE ACTIVE',
    );

    log(
      'warning will fire at',
      warningDate.toLocaleString(),
    );

    log(
      'reference will fire at',
      referenceDate.toLocaleString(),
    );
  }

  /* ========================================================
   * OCCURRENCE IDS
   * ======================================================== */

  const warningOccurrenceId =
    occurrenceIdFor(
      'warning',
      preferences.deliveryDate,
      warningDate,
    );

  const referenceOccurrenceId =
    occurrenceIdFor(
      'reference',
      preferences.deliveryDate,
      referenceDate,
    );

  log(
    'scheduled warning',
    warningOccurrenceId,
  );

  log(
    'scheduled reference',
    referenceOccurrenceId,
  );

  /* ========================================================
   * NOTIFICATION DATA
   * ======================================================== */

  const baseData = {
    hawaNotificationKind:
      'postpartum-nifas',

    articleId:
      NIFAS_EDUCATIONAL_ARTICLE_ID,
  };

  /* ========================================================
   * SCHEDULE
   * ======================================================== */

  // Both are attempted and BOTH outcomes are recorded below, even when one of them fails natively: the snapshot must
  // say which reminder really reached Android, or a later sync would trust a schedule that does not exist.
  const attempts = await Promise.allSettled([
    scheduleLocalNotification({
      id:
        NIFAS_WARNING_NOTIFICATION_ID,

      title:
        notificationTitle(
          'warning',
        ),

      body:
        notificationBody(
          'warning',
        ),

      fireDate:
        warningDate,

      data: {
        ...baseData,

        nifasReminderType:
          'warning',

        inAppOccurrenceId:
          warningOccurrenceId,

        inAppTitle:
          internalContent(
            'warning',
          ).title,

        inAppMessage:
          internalContent(
            'warning',
          ).message,
      },
    }),

    scheduleLocalNotification({
      id:
        NIFAS_REFERENCE_NOTIFICATION_ID,

      title:
        notificationTitle(
          'reference',
        ),

      body:
        notificationBody(
          'reference',
        ),

      fireDate:
        referenceDate,

      data: {
        ...baseData,

        nifasReminderType:
          'reference',

        inAppOccurrenceId:
          referenceOccurrenceId,

        inAppTitle:
          internalContent(
            'reference',
          ).title,

        inAppMessage:
          internalContent(
            'reference',
          ).message,
      },
    }),
  ]);

  /* ========================================================
   * SAVE STATE
   * ======================================================== */

  // "Scheduled" means: this attempt handed the reminder to Android. A reminder whose time has already gone cannot
  // be handed over any more, but that does not undo an EARLIER successful scheduling of the very same occurrence —
  // it fired, or was missed while the app was closed, and its in-app card is still owed. Only the same occurrence
  // keeps the earlier answer; a first attempt that never succeeded stays "not scheduled" and never gets a card.
  const handedToAndroid = (
    attempt: PromiseSettledResult<boolean>,
  ): boolean =>
    attempt.status === 'fulfilled' &&
    attempt.value;

  const firedSinceScheduled = (
    wasScheduled: boolean,
    previousOccurrenceId: string | null,
    occurrenceId: string,
    fireDate: Date,
  ): boolean =>
    wasScheduled &&
    previousOccurrenceId === occurrenceId &&
    fireDate.getTime() <= Date.now();

  const warningScheduled =
    handedToAndroid(attempts[0]) ||
    firedSinceScheduled(
      previous.warningScheduled,
      previous.warningOccurrenceId,
      warningOccurrenceId,
      warningDate,
    );

  const referenceScheduled =
    handedToAndroid(attempts[1]) ||
    firedSinceScheduled(
      previous.referenceScheduled,
      previous.referenceOccurrenceId,
      referenceOccurrenceId,
      referenceDate,
    );

  await setPostpartumNifasReminderState({
    deliveryDate:
      preferences.deliveryDate,

    configVersion:
      NIFAS_REFERENCE_CONFIG_VERSION,

    warningScheduled,

    referenceScheduled,

    // Re-read at write time (not the `previous` snapshot taken before the
    // awaited scheduling calls) so an acknowledgement given meanwhile is kept.
    completionAcknowledged:
      getPostpartumNifasReminderState().deliveryDate ===
        preferences.deliveryDate &&
      getPostpartumNifasReminderState().completionAcknowledged,

    warningFireAt:
      warningDate.toISOString(),

    referenceFireAt:
      referenceDate.toISOString(),

    warningOccurrenceId,

    referenceOccurrenceId,
  });

  // A native failure still REJECTS, exactly as before: the caller learns that the run did not complete. The state
  // above already says which reminder did not reach Android, so the next sync repairs it.
  const failure = attempts.find(
    (attempt): attempt is PromiseRejectedResult =>
      attempt.status === 'rejected',
  );

  if (failure) {
    throw failure.reason;
  }

  /* ========================================================
   * DEBUG
   * ======================================================== */

  if (
    TEST_NIFAS_NOTIFICATIONS
  ) {
    log(
      '✅ TEST Nifas notifications scheduled',
    );

    log(
      'Warning:',
      warningDate.toLocaleTimeString(),
    );

    log(
      'Reference:',
      referenceDate.toLocaleTimeString(),
    );
  }
}

/* ============================================================
 * ENTRY POINTS
 * ============================================================ */

// Every way into this file's native work goes through ONE queue. A synchronisation reads the saved snapshot, asks
// Android what it holds, schedules and saves the result: two of those interleaved (a privacy change forcing a
// rebuild while an objective change syncs, a cancel racing a sync) could save an older answer over a newer one or
// put back a reminder that was just switched off. Run N starts after run N-1 has finished and reads the state at
// ITS start, so the last request always wins.
const runNifasWork = createSerializer();

/**
 * Brings the J35/J40 reminders in line with the saved delivery date. Zero arguments on purpose: it is handed
 * straight to store subscribers and promise chains. It skips scheduling only while the saved schedule is still true
 * (see isScheduleIntact), so a reminder that never reached Android, or that Android lost, is scheduled again.
 */
export function syncPostpartumNifasReminders(): Promise<void> {
  return runNifasWork(() => syncNifasRemindersNow(false));
}

/**
 * Re-derives and re-schedules BOTH reminders even when the saved snapshot says nothing changed. For the moments
 * when what Android holds may no longer match it: a privacy setting changed (the text is redacted when the
 * reminder is built, so a trigger created before keeps the old text), the timezone changed, or the records were
 * replaced by a restore. Same eligibility rules and the same J35/J40 dates as syncPostpartumNifasReminders.
 */
export function forceSyncPostpartumNifasReminders(): Promise<void> {
  return runNifasWork(() => syncNifasRemindersNow(true));
}

/* ============================================================
 * CANCEL
 * ============================================================ */

export function cancelPostpartumNifasReminders(): Promise<void> {
  return runNifasWork(clearNifasReminders);
}
