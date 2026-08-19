import notifee, {
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
// remember to check it itself.
const PRIVACY_GENERIC_TITLE = 'AWA';
const PRIVACY_GENERIC_BODY = 'Tu as un nouveau rappel AWA.';

const CHANNEL_ID = 'pregnancy-reminders';
let channelReady: Promise<string> | null = null;
let permissionRequest: Promise<boolean> | null = null;

function ensureChannel(): Promise<string> {
  if (!channelReady) {
    // Same CHANNEL_ID as always — notifee.createChannel() upserts by id, so
    // this renames the existing Android channel in place (both for fresh
    // installs and for users who already have the old "Grossesse — rappels"
    // channel) rather than creating a second one. Renamed because this one
    // channel now backs every reminder type (Pregnancy + Postpartum/Nifas),
    // not just Pregnancy.
    channelReady = notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Rappels AWA',
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
  await loadSecurityPreferences();
  const privacy = getPrivacySecuritySettings();
  const hidePreview =
    privacy.discreetNotifications || privacy.hideNotificationPreview;
  const displayTitle = hidePreview ? PRIVACY_GENERIC_TITLE : title;
  const displayBody = hidePreview ? PRIVACY_GENERIC_BODY : body;

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: fireDate.getTime(),
    ...(repeatFrequency
      ? { repeatFrequency: REPEAT_FREQUENCY[repeatFrequency] }
      : {}),
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
