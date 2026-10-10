import notifee, {
  AlarmType,
  AndroidImportance,
  AndroidVisibility,
  AuthorizationStatus,
  RepeatFrequency,
  TriggerType,
  type TimestampTrigger,
} from '@notifee/react-native';

import {
  getPrivacySecuritySettings,
  loadSecurityPreferences,
} from '../state/securityPreferences';
import {getAppLanguage} from '../state/themePreferences';
import i18n from '../i18n';

// Central local-notification helper for the whole app (despite the module
// name, this now backs every reminder kind: Pregnancy appointment/exam,
// weekly update, daily journal, vitamin, medication, custom, and Postpartum
// Nifas). One Android notification channel, one scheduling entry point, one
// cancel entry point — every reminder kind goes through this file so events
// and their notifications can never drift out of sync. Callers pass their
// own stable domain id (e.g. the appointment's id) as the notification id,
// which is what lets update = cancel-then-reschedule-by-id and delete =
// cancel-by-id work without a separate id-mapping table.
//
// Privacy redaction lives HERE, not in each caller: this is the one place
// every notification passes through on its way to Android, so "Notifications
// discrètes" / "Masquer l'aperçu" (src/state/securityPreferences.ts) apply to
// every current and future reminder type without each caller having to
// remember to check it itself. "AWA" is the brand name — never translated.
const PRIVACY_GENERIC_TITLE = 'AWA';

const CHANNEL_ID = 'pregnancy-reminders';

/**
 * The Activity a tapped reminder opens.
 *
 * Deliberately NOT left to notifee's `'default'`: that resolves the launch
 * Activity through PackageManager#getLaunchIntentForPackage and then loads the
 * result with Class.forName. AWA's only MAIN/LAUNCHER entries are the two
 * `<activity-alias>` launcher identities (LauncherAwa / LauncherDiscreet, see
 * AndroidManifest.xml). An alias is a manifest entry, not a class, so
 * Class.forName throws, notifee logs "Failed to get launch activity" and a tap
 * delivers the PRESS event but never opens the app.
 *
 * `.MainActivity` is the real Activity both aliases target, so opening it is
 * the same screen, the same task and the same app data as opening either
 * launcher identity — the discreet launcher keeps working untouched (it only
 * toggles which alias is enabled). Keep this literally in sync with
 * AndroidManifest.xml / MainActivity.kt (a test checks it).
 */
export const NOTIFICATION_LAUNCH_ACTIVITY = 'com.hawa.MainActivity';

let channelReady: Promise<string> | null = null;
let channelLanguage: string | null = null;
let permissionRequest: Promise<boolean> | null = null;
// Last state the OS reported, only so a later refresh can tell "she just turned
// notifications on" from "nothing changed". Never used to DECIDE anything:
// every decision re-reads the OS (see getNotificationPermissionStatus).
let lastKnownPermission: NotificationPermissionStatus | null = null;

function ensureChannel(): Promise<string> {
  const language = getAppLanguage();
  // Re-upserts (never duplicates — notifee.createChannel() is keyed by the
  // same stable CHANNEL_ID) whenever the app language has changed since the
  // channel was last created, so its Android-visible name follows the
  // current language too. A plain re-render/resync with no language change
  // reuses the cached promise exactly as before.
  if (!channelReady || channelLanguage !== language) {
    channelLanguage = language;
    // Same CHANNEL_ID as always — notifee.createChannel() upserts by id, so
    // this renames the existing Android channel in place (both for fresh
    // installs and for users who already have the old "Grossesse — rappels"
    // channel) rather than creating a second one. Renamed because this one
    // channel now backs every reminder type (Pregnancy + Postpartum/Nifas),
    // not just Pregnancy.
    const creation = Promise.resolve(
      notifee.createChannel({
        id: CHANNEL_ID,
        name: i18n.t('notifications.channelName'),
        importance: AndroidImportance.HIGH,
      }),
    );
    channelReady = creation;
    // A rejected creation must not stay cached, or one transient failure would
    // make every later reminder in this process fail until the language changes.
    creation.catch(() => {
      if (channelReady === creation) {
        channelReady = null;
        channelLanguage = null;
      }
    });
  }
  return channelReady;
}

/** What Android currently says about notifications for this app. */
export type NotificationPermissionStatus = 'granted' | 'denied' | 'not-determined';

function toPermissionStatus(authorizationStatus: number): NotificationPermissionStatus {
  if (authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
    return 'granted';
  }
  if (authorizationStatus === AuthorizationStatus.NOT_DETERMINED) {
    return 'not-determined';
  }
  return 'denied';
}

/**
 * Reads the CURRENT Android notification state without ever showing a system
 * dialog (safe to call from a screen, on focus, or in the background).
 * 'not-determined' also covers "could not be read" — never treated as a denial.
 */
export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  try {
    const settings = await notifee.getNotificationSettings();
    return toPermissionStatus(settings.authorizationStatus);
  } catch {
    return 'not-determined';
  }
}

/**
 * Re-reads the OS state (no dialog) and reports whether notifications have just
 * become allowed since the last time the scheduler looked — the signal the app
 * uses, on returning to the foreground, to schedule the reminders that could not
 * be scheduled while notifications were off.
 */
export async function refreshNotificationPermission(): Promise<{
  status: NotificationPermissionStatus;
  becameGranted: boolean;
}> {
  const previous = lastKnownPermission;
  const status = await getNotificationPermissionStatus();
  lastKnownPermission = status;
  return {status, becameGranted: status === 'granted' && previous !== null && previous !== 'granted'};
}

async function requestPermissionOnce(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();
    const status = toPermissionStatus(settings.authorizationStatus);
    lastKnownPermission = status;
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Asks Android for notification permission (Android 13+ may show the system
 * dialog; on older versions this simply reports the state) and returns whether
 * reminders can be delivered right now.
 *
 * The answer is NEVER remembered: a denial used to be cached for the whole
 * process, so enabling notifications in Android settings and coming back left
 * every reminder unscheduled until the app was killed. Concurrent callers share
 * one in-flight request so only a single system dialog can ever be on screen.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (permissionRequest) {
    return permissionRequest;
  }
  const request = requestPermissionOnce();
  permissionRequest = request;
  try {
    return await request;
  } finally {
    if (permissionRequest === request) {
      permissionRequest = null;
    }
  }
}

/**
 * Whether a reminder scheduled now could actually reach the notification shade.
 * Never shows a system dialog, so screens can call it freely (on mount, on focus,
 * when returning from Android settings).
 *   'ready'             — notifications are on and the reminders channel is not blocked
 *   'notifications-off' — Android notifications are turned off for AWA
 *   'channel-blocked'   — the AWA reminders channel is blocked in Android settings
 *   'unknown'           — not asked yet (Android 13+) or the state could not be read: never shown as a problem
 */
export type ReminderDeliveryState = 'ready' | 'notifications-off' | 'channel-blocked' | 'unknown';

export async function getReminderDeliveryState(): Promise<ReminderDeliveryState> {
  const status = await getNotificationPermissionStatus();
  if (status === 'denied') {
    return 'notifications-off';
  }
  if (status === 'not-determined') {
    return 'unknown';
  }
  try {
    if (await notifee.isChannelBlocked(CHANNEL_ID)) {
      return 'channel-blocked';
    }
  } catch {
    // channel state unreadable: not a reason to alarm anyone
  }
  return 'ready';
}

/** Opens the Android notification settings for this app. Never throws. */
export async function openNotificationSettings(): Promise<void> {
  try {
    await notifee.openNotificationSettings();
  } catch {
    // nothing more can be done from here; the person can open Settings by hand
  }
}

export type ScheduleNotificationInput = {
  id: string;
  title: string;
  body: string;
  /** Fire date. If already in the past, scheduling is skipped (no-op). */
  fireDate: Date;
  repeatFrequency?: 'daily' | 'weekly';
  data?: Record<string, string>;
};

/** Why a reminder could not be scheduled. */
export type ScheduleFailureReason =
  /** The computed fire date is not a real date. */
  | 'invalid-date'
  /** The fire time has already passed. */
  | 'past'
  /** Android notifications are turned off for the app. */
  | 'permission-denied'
  /** The reminders channel is blocked in Android settings. */
  | 'channel-blocked'
  /** A native call failed. */
  | 'error';

export type ScheduleNotificationResult =
  | {scheduled: true; fireDate: Date}
  | {scheduled: false; reason: ScheduleFailureReason; fireDate: Date; error?: unknown};

const REPEAT_FREQUENCY: Record<'daily' | 'weekly', RepeatFrequency> = {
  daily: RepeatFrequency.DAILY,
  weekly: RepeatFrequency.WEEKLY,
};

/**
 * Cancels any pending trigger with this id, then schedules the new one, and says
 * exactly what happened (upsert semantics — safe to call on every create/update).
 *
 * Only the PENDING trigger is replaced. A notification with this id that has
 * already been delivered and is on screen is left alone: this function also
 * runs on every JS start — including the headless start notifee performs
 * seconds after a trigger fires — and used to dismiss the reminder it had just
 * delivered (see cancelLocalNotification).
 */
export async function scheduleLocalNotificationWithResult({
  id,
  title,
  body,
  fireDate,
  repeatFrequency,
  data,
}: ScheduleNotificationInput): Promise<ScheduleNotificationResult> {
  const timestamp = fireDate.getTime();
  if (!Number.isFinite(timestamp)) {
    // Not a date at all: leave whatever is already scheduled exactly as it is.
    return {scheduled: false, reason: 'invalid-date', fireDate};
  }

  await cancelLocalNotification(id);

  if (timestamp <= Date.now()) {
    return {scheduled: false, reason: 'past', fireDate};
  }

  try {
    const granted = await ensureNotificationPermission();
    if (!granted) {
      return {scheduled: false, reason: 'permission-denied', fireDate};
    }

    const channelId = await ensureChannel();
    try {
      if (await notifee.isChannelBlocked(channelId)) {
        return {scheduled: false, reason: 'channel-blocked', fireDate};
      }
    } catch {
      // Unknown: carry on, createTriggerNotification reports a real failure.
    }

    // Redact the OS-visible title/body when the user has asked for a discreet
    // lock-screen preview — this makes the scheduled notification itself
    // generic, which is stronger than relying on Android's own PRIVATE/SECRET
    // visibility (that still depends on per-device/manufacturer lock-screen
    // settings the app doesn't control). The real content always still goes
    // into `data`/the in-app notification center by whichever caller passed
    // it, so nothing here affects what AWA shows once the user opens the app.
    //
    // `discreetMode` (AWA's global "Mode discret / pudeur" toggle,
    // PrivacySecurityScreen.tsx) is included here too: a user who has turned
    // on the app's broader privacy mode shouldn't have to separately discover
    // and enable "Notifications discrètes"/"Masquer l'aperçu" just to keep
    // sensitive reminder text off her lock screen. This is the one place the
    // decision is made — no objective-specific file re-implements this logic.
    await loadSecurityPreferences();
    const privacy = getPrivacySecuritySettings();
    const hidePreview =
      privacy.discreetNotifications || privacy.hideNotificationPreview || privacy.discreetMode;
    const displayTitle = hidePreview ? PRIVACY_GENERIC_TITLE : title;
    const displayBody = hidePreview ? i18n.t('notifications.privacyGenericBody') : body;

    // The permission dialog, the channel and the preferences above are all
    // awaited: for a time only seconds away it can have passed meanwhile, and
    // notifee would then throw instead of scheduling.
    if (timestamp <= Date.now()) {
      return {scheduled: false, reason: 'past', fireDate};
    }

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp,
      ...(repeatFrequency
        ? { repeatFrequency: REPEAT_FREQUENCY[repeatFrequency] }
        : {}),
      // notifee v9 schedules a TimestampTrigger via Android's WorkManager by
      // default (see @notifee/react-native's own TimestampTrigger.alarmManager
      // doc comment) — WorkManager is explicitly best-effort and gets deferred
      // or dropped by Android's Doze/App-Standby battery optimizations once the
      // app is backgrounded/idle, which is exactly when a reminder needs to
      // fire. SET_AND_ALLOW_WHILE_IDLE routes through AlarmManager instead,
      // which is designed to survive Doze — and, unlike the *_EXACT alarm
      // types, needs no SCHEDULE_EXACT_ALARM runtime grant. A reminder firing
      // within a short window of its target time is perfectly acceptable for
      // AWA's use case (period/journal/fertility reminders, never a
      // time-critical alarm).
      alarmManager: {type: AlarmType.SET_AND_ALLOW_WHILE_IDLE},
    };

    await notifee.createTriggerNotification(
      {
        id,
        title: displayTitle,
        body: displayBody,
        data,
        android: {
          channelId,
          smallIcon: 'ic_launcher',
          pressAction: {id: 'default', launchActivity: NOTIFICATION_LAUNCH_ACTIVITY},
          visibility: AndroidVisibility.PRIVATE,
        },
      },
      trigger,
    );
    return {scheduled: true, fireDate};
  } catch (error) {
    return {scheduled: false, reason: 'error', fireDate, error};
  }
}

/**
 * Boolean form of scheduleLocalNotificationWithResult() for the schedulers that
 * only need "was it scheduled". A native failure still REJECTS, exactly as
 * before (the Cycle scheduler relies on it to retry); every other outcome
 * (past date, notifications off) is `false`.
 */
export async function scheduleLocalNotification(input: ScheduleNotificationInput): Promise<boolean> {
  const result = await scheduleLocalNotificationWithResult(input);
  if (!result.scheduled && result.reason === 'error') {
    throw result.error ?? new Error('Scheduling the local notification failed.');
  }
  return result.scheduled;
}

export type CancelNotificationOptions = {
  /**
   * Also remove a copy of the notification that is ALREADY in the notification
   * shade. Only for an explicit user action on the reminder itself (deleting
   * it, deleting the profile it belongs to) — never for a synchronisation,
   * which would dismiss a reminder that was just delivered.
   */
  dismissDisplayed?: boolean;
};

/**
 * Cancels the PENDING (scheduled) trigger for this id. No-op if there is none —
 * safe to call unconditionally on delete.
 *
 * Previously this also called notifee.cancelNotification(), which removes
 * displayed notifications too. Every scheduler calls this on each (re)sync, and
 * a killed app is re-synced by notifee's own headless start seconds after a
 * reminder is delivered — so the delivered reminder was dismissed almost as soon
 * as it appeared. Dismissing what is on screen is now explicit
 * (`dismissDisplayed`).
 *
 * Never throws (existing callers rely on that), but REPORTS the outcome: `false`
 * means a native cancel call rejected, so the notification may still exist.
 * Callers that must be sure (profile deletion, reminder reconciliation) check
 * it; `undefined`/`true` both mean "cancelled or nothing there".
 */
export async function cancelLocalNotification(
  id: string,
  options: CancelNotificationOptions = {},
): Promise<boolean> {
  let clean = true;
  try {
    await notifee.cancelTriggerNotification(id);
  } catch {
    clean = false;
  }
  if (options.dismissDisplayed) {
    try {
      await notifee.cancelDisplayedNotification(id);
    } catch {
      clean = false;
    }
  }
  return clean;
}

export async function cancelLocalNotifications(
  ids: readonly string[],
  options: CancelNotificationOptions = {},
): Promise<void> {
  await Promise.all(ids.map(id => cancelLocalNotification(id, options)));
}

/** Test seam: forgets every module-level cache (channel promise, in-flight permission request, last OS state). */
export function __resetNotificationServiceForTests(): void {
  channelReady = null;
  channelLanguage = null;
  permissionRequest = null;
  lastKnownPermission = null;
}
