import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Notification} from '@notifee/react-native';

import {navigationRef} from '../navigation/navigationRef';
import {getNotificationDataString} from './postpartumNifasNotificationPersistence';
import {
  MENOPAUSE_DAILY_TRACKING_NOTIFICATION_KIND,
  MENOPAUSE_TREATMENT_NOTIFICATION_KIND,
} from '../utils/menopauseReminderScheduling';

// Menopause equivalent of conceptionReminderNotificationNavigation.ts — same
// store-pending-intent-then-resolve-once-ready pattern, scaled down to
// Menopause's 2 reminder kinds. Deliberately lighter than the TTC/Postpartum
// versions (no in-app-notification-center persistence/dedup): Contraception's
// own daily reminder — the closest single/dual-toggle sibling to this
// feature — has none either, so this stays proportionate to that precedent
// while still fulfilling the "tap opens the right place" requirement.

const PENDING_KEY = '@hawa/menopause-reminder-pending-kind';

const isMenopauseReminderNotification = (notification?: Notification): boolean => {
  const kind = notification?.data?.hawaNotificationKind;
  return kind === MENOPAUSE_DAILY_TRACKING_NOTIFICATION_KIND || kind === MENOPAUSE_TREATMENT_NOTIFICATION_KIND;
};

/** Persist only the pending intent. Navigation is performed after the
 * navigator is actually ready (see openPendingMenopauseReminderNotification). */
export async function storePendingMenopauseReminderNotification(notification?: Notification): Promise<void> {
  if (!isMenopauseReminderNotification(notification)) {
    return;
  }
  const kind = getNotificationDataString(notification!, 'hawaNotificationKind');
  if (kind) {
    await AsyncStorage.setItem(PENDING_KEY, kind);
  }
}

// The treatment reminder deep-links straight to its own journal entry
// screen (a real stack route, unlike TTC's bottom-sheet-only "Journal
// quotidien"); the daily-tracking reminder is general (not tied to one
// category), so it lands on the Home tab, which already renders the
// Menopause Dashboard whenever this reminder could have fired at all
// (syncMenopauseReminders() only schedules while activeObjective==='menopause').
function navigateForReminderKind(kind: string): void {
  if (kind === MENOPAUSE_TREATMENT_NOTIFICATION_KIND) {
    navigationRef.navigate('MenopauseJournalEntry', {category: 'treatment'});
    return;
  }
  navigationRef.navigate('MainTabs', {screen: 'CycleHome'});
}

export async function openPendingMenopauseReminderNotification(): Promise<void> {
  const kind = await AsyncStorage.getItem(PENDING_KEY);
  if (!kind || !navigationRef.isReady()) {
    return;
  }
  await AsyncStorage.removeItem(PENDING_KEY);
  navigateForReminderKind(kind);
}
