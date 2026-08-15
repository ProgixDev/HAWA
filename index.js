/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import { handlePostpartumNifasBackgroundNotification } from './src/services/postpartumNifasBackgroundNotificationHandler';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.DELIVERED) {
    await handlePostpartumNifasBackgroundNotification(
      'delivered',
      detail.notification,
    );
  }
  if (type === EventType.PRESS) {
    await handlePostpartumNifasBackgroundNotification(
      'press',
      detail.notification,
    );
  }
});

AppRegistry.registerComponent(appName, () => App);

