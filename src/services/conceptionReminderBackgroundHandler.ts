import type { Notification } from '@notifee/react-native';

import {
  isConceptionReminderNotification,
  persistConceptionReminderNotification,
} from './conceptionReminderNotificationPersistence';
import { storePendingConceptionReminderNotification } from './conceptionReminderNotificationNavigation';

// TTC equivalent of postpartumNifasBackgroundNotificationHandler.ts.

/** Safe for Notifee's headless/background runtime: persist only, never navigate. */
export async function handleConceptionReminderBackgroundNotification(
  type: 'delivered' | 'press',
  notification?: Notification,
): Promise<void> {
  if (!isConceptionReminderNotification(notification)) {
    return;
  }
  await persistConceptionReminderNotification(notification, type === 'press');
  if (type === 'press') {
    await storePendingConceptionReminderNotification(notification);
  }
}
