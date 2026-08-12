import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  RepeatFrequency,
  TriggerType,
  type TimestampTrigger,
} from '@notifee/react-native';

// Central local-notification helper for the whole Pregnancy Tracking module.
// One Android notification channel, one scheduling entry point, one cancel
// entry point — every reminder kind (appointment/exam, weekly update, daily
// journal, vitamin, medication, custom) goes through this file so events and
// their notifications can never drift out of sync. Callers pass their own
// stable domain id (e.g. the appointment's id) as the notification id, which
// is what lets update = cancel-then-reschedule-by-id and delete = cancel-by-id
// work without a separate id-mapping table.

const CHANNEL_ID = 'pregnancy-reminders';
let channelReady: Promise<string> | null = null;

function ensureChannel(): Promise<string> {
  if (!channelReady) {
    channelReady = notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Grossesse — rappels',
      importance: AndroidImportance.HIGH,
    });
  }
  return channelReady;
}

/** Requests Android 13+ POST_NOTIFICATIONS permission. Safe to call repeatedly. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
}

export type ScheduleNotificationInput = {
  id: string;
  title: string;
  body: string;
  /** Fire date. If already in the past, scheduling is skipped (no-op). */
  fireDate: Date;
  repeatFrequency?: 'daily' | 'weekly';
};

const REPEAT_FREQUENCY: Record<'daily' | 'weekly', RepeatFrequency> = {
  daily: RepeatFrequency.DAILY,
  weekly: RepeatFrequency.WEEKLY,
};

/** Cancels any existing notification with this id, then schedules the new one (no-op past dates). Upsert semantics — safe to call on every create/update. */
export async function scheduleLocalNotification({id, title, body, fireDate, repeatFrequency}: ScheduleNotificationInput): Promise<void> {
  await cancelLocalNotification(id);

  if (fireDate.getTime() <= Date.now()) {return;}

  const granted = await ensureNotificationPermission();
  if (!granted) {return;}

  const channelId = await ensureChannel();

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: fireDate.getTime(),
    ...(repeatFrequency ? {repeatFrequency: REPEAT_FREQUENCY[repeatFrequency]} : {}),
  };

  await notifee.createTriggerNotification(
    {
      id,
      title,
      body,
      android: {
        channelId,
        smallIcon: 'ic_launcher',
        pressAction: {id: 'default'},
      },
    },
    trigger,
  );
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

export async function cancelLocalNotifications(ids: readonly string[]): Promise<void> {
  await Promise.all(ids.map(id => cancelLocalNotification(id)));
}
