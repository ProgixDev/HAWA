import notifee, { EventType } from '@notifee/react-native';

import {
  markDeliveredInAppNotificationRead,
  recordDeliveredInAppNotification,
} from './inAppNotificationDelivery';
import {
  openPendingPostpartumNifasNotification,
  storePendingPostpartumNifasNotification,
} from './postpartumNifasNotificationNavigation';

let registered = false;

/** Single owner for foreground delivery + press handling. */
export function registerNotificationForegroundHandlers(): void {
  if (registered) {
    return;
  }
  registered = true;
  notifee.onForegroundEvent(async ({ type, detail }) => {
    if (type === EventType.DELIVERED) {
      await recordDeliveredInAppNotification(detail.notification);
      return;
    }
    if (type === EventType.PRESS) {
      await markDeliveredInAppNotificationRead(detail.notification);
      await storePendingPostpartumNifasNotification(detail.notification);
      await openPendingPostpartumNifasNotification();
    }
  });
  notifee.getInitialNotification().then(async initial => {
    if (!initial) {
      return;
    }
    await markDeliveredInAppNotificationRead(initial.notification);
    await storePendingPostpartumNifasNotification(initial.notification);
  });
}
