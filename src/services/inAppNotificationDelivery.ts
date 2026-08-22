import type { Notification } from '@notifee/react-native';

import {
  getNotificationDataString,
  isPostpartumNifasNotification,
  persistPostpartumNifasNotification,
} from './postpartumNifasNotificationPersistence';
import {
  getConceptionReminderOccurrenceId,
  isConceptionReminderNotification,
  persistConceptionReminderNotification,
} from './conceptionReminderNotificationPersistence';
import { markInAppNotificationAsRead } from '../state/inAppNotificationStore';

const log = (...args: unknown[]): void => {
  if (__DEV__) {
    console.log('[NIFAS]', ...args);
  }
};

/**
 * Lightweight delivery recorder. It deliberately does not import scheduling,
 * navigation or foreground listener registration.
 */
export async function recordDeliveredInAppNotification(
  notification?: Notification,
): Promise<void> {
  if (!notification?.id) {
    return;
  }
  if (isPostpartumNifasNotification(notification)) {
    const occurrenceId =
      getNotificationDataString(notification, 'inAppOccurrenceId') ??
      notification.id;
    log('delivered', notification.id, 'occurrenceId', occurrenceId);
    await persistPostpartumNifasNotification(notification);
    log('persistence attempted', occurrenceId);
  }
  if (isConceptionReminderNotification(notification)) {
    await persistConceptionReminderNotification(notification);
  }
}

export async function markDeliveredInAppNotificationRead(
  notification?: Notification,
): Promise<void> {
  await recordDeliveredInAppNotification(notification);
  if (!notification?.id) {
    return;
  }
  if (isPostpartumNifasNotification(notification)) {
    const occurrenceId =
      getNotificationDataString(notification, 'inAppOccurrenceId') ??
      notification.id;
    await markInAppNotificationAsRead(occurrenceId);
  }
  if (isConceptionReminderNotification(notification)) {
    await markInAppNotificationAsRead(
      getConceptionReminderOccurrenceId(notification),
    );
  }
}
