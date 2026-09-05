/**
 * @format
 */

// Must be imported before any code that uses crypto.getRandomValues (see
// src/services/privateJournalEncryption.ts) — react-native-get-random-values
// installs the polyfill as a side effect, so this import's position matters.
import 'react-native-get-random-values';

import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import { handlePostpartumNifasBackgroundNotification } from './src/services/postpartumNifasBackgroundNotificationHandler';
import { handleConceptionReminderBackgroundNotification } from './src/services/conceptionReminderBackgroundHandler';
import { handleGenericReminderBackgroundNotification } from './src/services/genericReminderBackgroundHandler';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.DELIVERED) {
    await handlePostpartumNifasBackgroundNotification(
      'delivered',
      detail.notification,
    );
    await handleConceptionReminderBackgroundNotification(
      'delivered',
      detail.notification,
    );
    await handleGenericReminderBackgroundNotification(
      'delivered',
      detail.notification,
    );
  }
  if (type === EventType.PRESS) {
    await handlePostpartumNifasBackgroundNotification(
      'press',
      detail.notification,
    );
    await handleConceptionReminderBackgroundNotification(
      'press',
      detail.notification,
    );
    await handleGenericReminderBackgroundNotification(
      'press',
      detail.notification,
    );
  }
});

AppRegistry.registerComponent(appName, () => App);

