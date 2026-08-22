import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Notification } from '@notifee/react-native';

import { navigationRef } from '../navigation/navigationRef';
import { isConceptionReminderNotification } from './conceptionReminderNotificationPersistence';
import type { ConceptionReminderKey } from '../state/conceptionPreferences';

// TTC equivalent of postpartumNifasNotificationNavigation.ts — same
// store-pending-intent-then-resolve-once-ready pattern. Nifas always
// resolves to the single ArticleReader+articleId destination; TTC has 5
// possible destinations, so the pending value is the reminder TYPE, resolved
// to a concrete route only once the navigator is actually ready.

const PENDING_KEY = '@hawa/conception-reminder-pending-type';

/** Persist only the pending intent. Navigation is performed after navigator ready. */
export async function storePendingConceptionReminderNotification(
  notification?: Notification,
): Promise<void> {
  if (!isConceptionReminderNotification(notification)) {
    return;
  }
  const reminderType = notification?.data?.conceptionReminderType;
  if (typeof reminderType === 'string') {
    await AsyncStorage.setItem(PENDING_KEY, reminderType);
  }
}

/** Temperature/LH open their own journal entry screen; the 3 cycle-relative
 * reminders land on the TTC Dashboard (fertile window/ovulation) — and so
 * does daily_journal, since "Journal quotidien" is a context-based bottom
 * sheet (useJournalSheet), not a stack route, so it can't be deep-linked
 * into from here without inventing a parallel mechanism. */
function navigateForReminderType(reminderType: ConceptionReminderKey): void {
  if (reminderType === 'temperature') {
    navigationRef.navigate('TemperatureEntry');
    return;
  }
  if (reminderType === 'lh_test') {
    navigationRef.navigate('LHTestEntry');
    return;
  }
  navigationRef.navigate('MainTabs', { screen: 'CycleHome' });
}

export async function openPendingConceptionReminderNotification(): Promise<void> {
  const reminderType = await AsyncStorage.getItem(PENDING_KEY);
  if (!reminderType || !navigationRef.isReady()) {
    return;
  }
  await AsyncStorage.removeItem(PENDING_KEY);
  navigateForReminderType(reminderType as ConceptionReminderKey);
}
