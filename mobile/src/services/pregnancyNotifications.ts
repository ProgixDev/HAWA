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
// which is what lets update = reschedule-by-id and delete = cancel-by-id
// work without a separate id-mapping table.
//
// Privacy redaction lives HERE, not in each caller: this is the one place
// every notification passes through on its way to Android, so "Notifications
// discrètes" / "Masquer l'aperçu" (src/state/securityPreferences.ts) apply to
// every current and future reminder type without each caller having to
// remember to check it itself. "AWA" is the brand name — never translated.
const PRIVACY_GENERIC_TITLE = 'AWA';

const CHANNEL_ID = 'pregnancy-reminders';

/** Longest the privacy settings may take to load before a reminder is built with generic text instead. */
const PRIVACY_SETTINGS_TIMEOUT_MS = 3000;

/**
 * Separator for the extra pending triggers one reminder id can own (see scheduleReminderSeries and the DST split in
 * planRepeatingOccurrences): `<id>`, `<id>::1`, `<id>::2`... Cancelling `<id>` cancels all of them, and no other
 * reminder id contains it.
 */
export const REMINDER_SERIES_SEPARATOR = '::';

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
// Triggers created before the AlarmManager fix were WorkManager jobs; converted once per process (see below).
let legacyConversion: Promise<void> | null = null;

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
    // channel) rather than creating a second one.
    //
    // What a user has chosen for this channel in Android settings is theirs and
    // is never overridden: Android ignores sound/vibration changes for a channel
    // that already exists, and importance can only be lowered, never raised, after
    // creation — so asking for HIGH again cannot undo someone muting or lowering
    // it. `sound` / `vibration` therefore only take effect on a phone where the
    // channel is created for the first time; notifee's default (no `sound`) is a
    // SILENT channel, which is not what a reminder wants.
    const creation = Promise.resolve(
      notifee.createChannel({
        id: CHANNEL_ID,
        name: i18n.t('notifications.channelName'),
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
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

/**
 * Ids of every reminder trigger currently PENDING in Android (what will fire later), or null when the native layer
 * cannot be read. Schedulers that skip work when "nothing changed" use it to confirm the trigger they believe
 * exists really does, instead of trusting a saved snapshot of what they once scheduled.
 */
export async function getPendingReminderIds(): Promise<ReadonlySet<string> | null> {
  try {
    return new Set(await notifee.getTriggerNotificationIds());
  } catch {
    return null;
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

const REPEAT_STEP_DAYS: Record<'daily' | 'weekly', number> = {daily: 1, weekly: 7};
const MS_PER_DAY = 86_400_000;

/** One concrete trigger of a reminder: an instant, optionally repeating at a fixed interval natively. */
export type ScheduleOccurrence = {fireDate: Date; repeatFrequency?: 'daily' | 'weekly'};

/**
 * Turns "first fire at `first`, then every day/week at the same wall-clock time" into the triggers to hand Android.
 *
 * notifee repeats with a FIXED length (24 h / 7 d), not "same time tomorrow". Across a daylight-saving change
 * that fixed step lands an hour away from the wall-clock time the person chose, until the app next runs and
 * re-anchors it. So when the real next occurrence (same local time, next calendar day/week) is not exactly one
 * step after `first`, the first occurrence goes out on its own and the repeating trigger starts at the real next
 * occurrence — each fire is then at the right local time, with no dependence on the app having been opened.
 *
 * `calendarNext` is injectable only so tests can exercise a clock change on any machine's timezone.
 */
export function planRepeatingOccurrences(
  first: Date,
  repeat: 'daily' | 'weekly',
  calendarNext: Date = new Date(
    first.getFullYear(),
    first.getMonth(),
    first.getDate() + REPEAT_STEP_DAYS[repeat],
    first.getHours(),
    first.getMinutes(),
    first.getSeconds(),
    first.getMilliseconds(),
  ),
): ScheduleOccurrence[] {
  const fixedNext = first.getTime() + REPEAT_STEP_DAYS[repeat] * MS_PER_DAY;
  if (calendarNext.getTime() === fixedNext) {
    return [{fireDate: first, repeatFrequency: repeat}];
  }
  return [{fireDate: first}, {fireDate: calendarNext, repeatFrequency: repeat}];
}

// --- ordering ------------------------------------------------------------------------------------------------------
// Two operations on the SAME reminder id never overlap: they run in the order they were requested. Without this a
// sync that computed its answer from older state could finish after a newer cancel and put the reminder back.
const idQueues = new Map<string, Promise<unknown>>();

function runExclusive<T>(id: string, task: () => Promise<T>): Promise<T> {
  const previous = idQueues.get(id) ?? Promise.resolve();
  const run = previous.then(task, task);
  const settled = run.then(
    () => undefined,
    () => undefined,
  );
  idQueues.set(id, settled);
  settled.then(() => {
    if (idQueues.get(id) === settled) {
      idQueues.delete(id);
    }
  });
  return run;
}

const memberIdFor = (id: string, index: number): string => (index === 0 ? id : `${id}${REMINDER_SERIES_SEPARATOR}${index}`);

// --- triggers created before the AlarmManager fix ------------------------------------------------------------------
// They are WorkManager jobs. Creating a trigger now REPLACES the stored row for an id, but would leave such a job
// alive: it would later display the replacement at its old time. Convert each one once (before anything is
// scheduled or cancelled) to an AlarmManager trigger for the same instant, or drop it when its time has passed.
function convertLegacyTriggersOnce(): Promise<void> {
  if (!legacyConversion) {
    legacyConversion = (async () => {
      try {
        const entries = await notifee.getTriggerNotifications();
        for (const entry of entries) {
          const trigger = entry.trigger as TimestampTrigger | undefined;
          const notification = entry.notification;
          if (!notification?.id || !trigger || trigger.type !== TriggerType.TIMESTAMP || trigger.alarmManager) {
            continue;
          }
          await notifee.cancelTriggerNotification(notification.id);
          if (typeof trigger.timestamp === 'number' && trigger.timestamp > Date.now()) {
            await notifee.createTriggerNotification(notification, {
              ...trigger,
              alarmManager: {type: AlarmType.SET_AND_ALLOW_WHILE_IDLE},
            });
          }
        }
      } catch {
        // Not readable now: try again on the next call rather than assume there is nothing to convert.
        legacyConversion = null;
      }
    })();
  }
  return legacyConversion;
}

// --- cancel --------------------------------------------------------------------------------------------------------

export type CancelNotificationOptions = {
  /**
   * Also remove a copy of the notification that is ALREADY in the notification
   * shade. Only for an explicit user action on the reminder itself (deleting
   * it, deleting the profile it belongs to) — never for a synchronisation,
   * which would dismiss a reminder that was just delivered.
   */
  dismissDisplayed?: boolean;
};

async function cancelNow(id: string, options: CancelNotificationOptions): Promise<boolean> {
  let clean = true;
  try {
    await notifee.cancelTriggerNotification(id);
  } catch {
    clean = false;
  }

  // The extra pending triggers this id may own (series members / the DST split).
  const pending = await getPendingReminderIds();
  const members = pending ? Array.from(pending).filter(pendingId => pendingId.startsWith(`${id}${REMINDER_SERIES_SEPARATOR}`)) : [];
  if (members.length > 0) {
    try {
      await notifee.cancelTriggerNotifications(members);
    } catch {
      clean = false;
    }
  }

  if (options.dismissDisplayed) {
    try {
      await notifee.cancelDisplayedNotification(id);
    } catch {
      clean = false;
    }
    try {
      const displayed = await notifee.getDisplayedNotifications();
      const shown = displayed
        .map(item => item.id ?? item.notification?.id)
        .filter((shownId): shownId is string => typeof shownId === 'string' && shownId.startsWith(`${id}${REMINDER_SERIES_SEPARATOR}`));
      if (shown.length > 0) {
        await notifee.cancelDisplayedNotifications(shown);
      }
    } catch {
      // series copies in the shade could not be listed: the base copy was handled above
    }
  }
  return clean;
}

/**
 * Cancels the PENDING (scheduled) triggers of this id (and any extra triggers it owns). No-op if there is none —
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
  await convertLegacyTriggersOnce();
  return runExclusive(id, () => cancelNow(id, options));
}

export async function cancelLocalNotifications(
  ids: readonly string[],
  options: CancelNotificationOptions = {},
): Promise<void> {
  await Promise.all(ids.map(id => cancelLocalNotification(id, options)));
}

/**
 * Cancels EVERY reminder AWA has scheduled and removes every one already in the notification shade. For wiping the
 * whole app's data (delete account / erase everything), where nothing may be left to fire or to stay on a lock
 * screen after the records they came from are gone. Never throws; false means the native call failed.
 */
export async function cancelAllLocalNotifications(): Promise<boolean> {
  try {
    await notifee.cancelAllNotifications();
    return true;
  } catch {
    return false;
  }
}

// --- schedule ------------------------------------------------------------------------------------------------------

type SeriesContent = {id: string; title: string; body: string; data?: Record<string, string>};

/** The text a reminder is built with: redacted when privacy settings ask for it OR cannot be determined in time. */
async function resolveDisplayText(title: string, body: string): Promise<{title: string; body: string}> {
  // `discreetMode` (AWA's global "Mode discret / pudeur" toggle, PrivacySecurityScreen.tsx) is included with the
  // two notification-specific switches: a user who turned on the broader privacy mode should not have to also
  // find and enable "Notifications discrètes" just to keep sensitive reminder text off her lock screen. This is
  // the one place the decision is made — no objective-specific file re-implements it.
  //
  // The settings come from storage plus a Keychain check; that call used to be awaited without limit, so one
  // stuck native call silently blocked every reminder. If they cannot be read within a few seconds the reminder
  // is built with the GENERIC text: showing real content under unknown privacy settings is the worse failure
  // (the real content always still goes into `data`/the in-app notification center).
  let timer: ReturnType<typeof setTimeout> | undefined;
  const loaded = await Promise.race<boolean>([
    loadSecurityPreferences().then(
      () => true,
      () => false,
    ),
    new Promise<boolean>(resolve => {
      timer = setTimeout(() => resolve(false), PRIVACY_SETTINGS_TIMEOUT_MS);
    }),
  ]);
  if (timer !== undefined) {
    clearTimeout(timer);
  }

  const privacy = getPrivacySecuritySettings();
  const hidePreview =
    !loaded || privacy.discreetNotifications || privacy.hideNotificationPreview || privacy.discreetMode;
  return hidePreview
    ? {title: PRIVACY_GENERIC_TITLE, body: i18n.t('notifications.privacyGenericBody')}
    : {title, body};
}

/**
 * Creates the triggers for one reminder id. Each member REPLACES whatever is already pending under its own id
 * (notifee stores `INSERT OR REPLACE` by id and the alarm's PendingIntent is updated in place), so the reminder is
 * never "cancelled, then created": a process killed in between can no longer leave it without any trigger, and a
 * delete racing the insert can no longer swallow the new one. Members this id owned before and no longer needs
 * are cancelled afterwards.
 */
async function scheduleMembers(content: SeriesContent, occurrences: ScheduleOccurrence[]): Promise<ScheduleNotificationResult> {
  const {id} = content;
  const first = occurrences[0].fireDate;

  const granted = await ensureNotificationPermission();
  if (!granted) {
    await cancelNow(id, {});
    return {scheduled: false, reason: 'permission-denied', fireDate: first};
  }

  const channelId = await ensureChannel();
  try {
    if (await notifee.isChannelBlocked(channelId)) {
      await cancelNow(id, {});
      return {scheduled: false, reason: 'channel-blocked', fireDate: first};
    }
  } catch {
    // Unknown: carry on, createTriggerNotification reports a real failure.
  }

  const text = await resolveDisplayText(content.title, content.body);

  // The permission dialog, the channel and the preferences above are all
  // awaited: for a time only seconds away it can have passed meanwhile, and
  // notifee would then throw instead of scheduling.
  if (!occurrences.some(occurrence => occurrence.fireDate.getTime() > Date.now())) {
    await cancelNow(id, {});
    return {scheduled: false, reason: 'past', fireDate: first};
  }

  const created: string[] = [];
  for (let index = 0; index < occurrences.length; index += 1) {
    const occurrence = occurrences[index];
    // Not ahead of now — or not a date at all (NaN fails the comparison too): skipped, never handed to Android.
    if (!(occurrence.fireDate.getTime() > Date.now())) {
      continue;
    }
    const memberId = memberIdFor(id, index);
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: occurrence.fireDate.getTime(),
      ...(occurrence.repeatFrequency ? {repeatFrequency: REPEAT_FREQUENCY[occurrence.repeatFrequency]} : {}),
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
        id: memberId,
        title: text.title,
        body: text.body,
        data: content.data,
        android: {
          channelId,
          smallIcon: 'ic_launcher',
          pressAction: {id: 'default', launchActivity: NOTIFICATION_LAUNCH_ACTIVITY},
          visibility: AndroidVisibility.PRIVATE,
        },
      },
      trigger,
    );
    created.push(memberId);
  }

  // Anything this id owned before that the new plan no longer includes (a shorter series, the end of a DST split).
  const pending = await getPendingReminderIds();
  if (pending) {
    const stale = Array.from(pending).filter(
      pendingId => pendingId.startsWith(`${id}${REMINDER_SERIES_SEPARATOR}`) && !created.includes(pendingId),
    );
    if (stale.length > 0) {
      try {
        await notifee.cancelTriggerNotifications(stale);
      } catch {
        // A leftover extra trigger is replaced or removed by the next sync; the new reminder itself is in place.
      }
    }
  }

  return {scheduled: true, fireDate: first};
}

async function scheduleOccurrences(
  content: SeriesContent,
  occurrences: ScheduleOccurrence[],
): Promise<ScheduleNotificationResult> {
  await convertLegacyTriggersOnce();
  return runExclusive(content.id, async (): Promise<ScheduleNotificationResult> => {
    const first = occurrences[0]?.fireDate ?? new Date(NaN);
    if (occurrences.length === 0) {
      // An empty plan is "nothing ahead", not "not a date": whatever an older plan left pending must not fire.
      await cancelNow(content.id, {});
      return {scheduled: false, reason: 'past', fireDate: first};
    }
    if (!occurrences.some(occurrence => Number.isFinite(occurrence.fireDate.getTime()))) {
      // Not a date at all: leave whatever is already scheduled exactly as it is (a computation bug must not erase
      // a reminder that is fine).
      return {scheduled: false, reason: 'invalid-date', fireDate: first};
    }
    // Nothing in the plan is still ahead of us: nothing to create, and a trigger pending for the old time must
    // not fire for a reminder that has moved into the past.
    const future = occurrences.filter(occurrence => occurrence.fireDate.getTime() > Date.now());
    if (future.length === 0) {
      await cancelNow(content.id, {});
      return {scheduled: false, reason: 'past', fireDate: first};
    }
    try {
      return await scheduleMembers(content, occurrences);
    } catch (error) {
      // Creating failed: whatever was pending is untouched (nothing is cancelled before a replacement exists).
      return {scheduled: false, reason: 'error', fireDate: first, error};
    }
  });
}

/**
 * Schedules (or replaces) one reminder and says exactly what happened (upsert semantics — safe to call on every
 * create/update/sync).
 *
 * The pending trigger for this id is REPLACED in place; a notification with this id that has already been
 * delivered and is on screen is left alone. This function runs on every JS start — including the headless start
 * notifee performs seconds after a trigger fires — and used to dismiss the reminder it had just delivered.
 */
export async function scheduleLocalNotificationWithResult({
  id,
  title,
  body,
  fireDate,
  repeatFrequency,
  data,
}: ScheduleNotificationInput): Promise<ScheduleNotificationResult> {
  const occurrences = repeatFrequency && Number.isFinite(fireDate.getTime())
    ? planRepeatingOccurrences(fireDate, repeatFrequency)
    : [{fireDate}];
  return scheduleOccurrences({id, title, body, data}, occurrences);
}

export type ScheduleSeriesInput = {
  id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  /** One-shot instants, earliest first. Past ones are skipped. */
  occurrences: Date[];
};

/**
 * Schedules a reminder that fires on an explicit list of days (for example "every day except the pill break days")
 * as separate one-shot triggers: `<id>` for the first, `<id>::1`, `<id>::2`... for the rest. A repeating trigger
 * cannot skip days, so this is the way to express a pattern; re-run it (every JS start, foreground and delivery)
 * to keep the window ahead full. Cancelling `<id>` removes all of them.
 */
export async function scheduleReminderSeries(input: ScheduleSeriesInput): Promise<ScheduleNotificationResult> {
  const {occurrences, ...content} = input;
  const plan = occurrences.map(fireDate => ({fireDate}));
  return scheduleOccurrences(content, plan);
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

/** Test seam: forgets every module-level cache (channel promise, in-flight permission request, last OS state, queues). */
export function __resetNotificationServiceForTests(): void {
  channelReady = null;
  channelLanguage = null;
  permissionRequest = null;
  lastKnownPermission = null;
  legacyConversion = null;
  idQueues.clear();
}
