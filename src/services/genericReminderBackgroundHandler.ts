import type { Notification } from '@notifee/react-native';

import {
  isGenericReminderNotification,
  persistGenericReminderNotification,
} from './genericReminderNotificationPersistence';

/** Safe for Notifee's headless/background runtime: persist only, never
 * navigate — same contract as postpartumNifasBackgroundNotificationHandler.ts
 * / conceptionReminderBackgroundHandler.ts. Deliberately does not store a
 * pending-navigation intent the way those two do: this task's scope is
 * connecting existing reminders to the in-app notification history, and
 * tapping the resulting in-app card already navigates via
 * InAppNotificationCenter.tsx's openNotification(). */
export async function handleGenericReminderBackgroundNotification(
  type: 'delivered' | 'press',
  notification?: Notification,
): Promise<void> {
  if (!isGenericReminderNotification(notification)) {
    return;
  }
  await persistGenericReminderNotification(notification, type === 'press');
}
