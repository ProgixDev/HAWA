import notifee from '@notifee/react-native';

import { recordDeliveredInAppNotification } from './inAppNotificationDelivery';
import { reconcilePostpartumNifasInAppNotifications } from '../utils/postpartumNifasReminderScheduling';

/** Foreground-only recovery for missed background delivery callbacks. */
export async function reconcileInAppNotifications(): Promise<void> {
  const displayed = await notifee.getDisplayedNotifications();
  await Promise.all(
    displayed.map(item => recordDeliveredInAppNotification(item.notification)),
  );
  await reconcilePostpartumNifasInAppNotifications();
}
