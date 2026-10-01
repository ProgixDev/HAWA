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
let channelReady: Promise<string> | null = null;
let channelLanguage: string | null = null;
let permissionRequest: Promise<boolean> | null = null;

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
    channelReady = notifee.createChannel({
      id: CHANNEL_ID,
      name: i18n.t('notifications.channelName'),
      importance: AndroidImportance.HIGH,
    });
  }
  return channelReady;
}

/** Requests Android 13+ POST_NOTIFICATIONS permission. Safe to call repeatedly. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!permissionRequest) {
    permissionRequest = notifee.requestPermission().then(
      settings =>
        settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED,
      () => false,
    );
  }
  return permissionRequest;
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

const REPEAT_FREQUENCY: Record<'daily' | 'weekly', RepeatFrequency> = {
  daily: RepeatFrequency.DAILY,
  weekly: RepeatFrequency.WEEKLY,
};

/** Cancels any existing notification with this id, then schedules the new one (no-op past dates). Upsert semantics — safe to call on every create/update. */
export async function scheduleLocalNotification({
  id,
  title,
  body,
  fireDate,
  repeatFrequency,
  data,
}: ScheduleNotificationInput): Promise<boolean> {
  await cancelLocalNotification(id);

  if (fireDate.getTime() <= Date.now()) {
    return false;
  }

  const granted = await ensureNotificationPermission();
  if (!granted) {
    return false;
  }

  const channelId = await ensureChannel();

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

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: fireDate.getTime(),
    ...(repeatFrequency
      ? { repeatFrequency: REPEAT_FREQUENCY[repeatFrequency] }
      : {}),
    // ROOT CAUSE of "no notifications arrive" on a real device: notifee v9
    // schedules a TimestampTrigger via Android's WorkManager by default
    // (see @notifee/react-native's own TimestampTrigger.alarmManager doc
    // comment) — WorkManager is explicitly best-effort and gets deferred or
    // dropped by Android's Doze/App-Standby battery optimizations once the
    // app is backgrounded/idle, which is exactly when a reminder needs to
    // fire. SET_AND_ALLOW_WHILE_IDLE routes through AlarmManager instead,
    // which is designed to survive Doze — and, unlike the *_EXACT alarm
    // types, needs no SCHEDULE_EXACT_ALARM/USE_EXACT_ALARM manifest
    // permission (none is declared, and this app has no "exact alarm"
    // product justification for the Play Store policy that permission
    // requires). A reminder firing within a short window of its target
    // time is perfectly acceptable for AWA's use case (period/journal/
    // fertility reminders, never a time-critical alarm).
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
        pressAction: { id: 'default' },
        visibility: AndroidVisibility.PRIVATE,
      },
    },
    trigger,
  );
  return true;
}

/** Cancels a scheduled/displayed notification by id. No-op if it doesn't exist — safe to call unconditionally on delete. */
export async function cancelLocalNotification(id: string): Promise<void> {
  try {
    await notifee.cancelTriggerNotification(id);
  } catch {
    // ignore — nothing was scheduled
  }
  try {
    await notifee.cancelNotification(id);
  } catch {
    // ignore — nothing was displayed
  }
}

export async function cancelLocalNotifications(
  ids: readonly string[],
): Promise<void> {
  await Promise.all(ids.map(id => cancelLocalNotification(id)));
}
