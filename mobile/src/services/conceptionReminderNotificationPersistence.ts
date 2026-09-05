import type { Notification } from '@notifee/react-native';

import { getNotificationDataString } from './postpartumNifasNotificationPersistence';
import { CONTENT } from '../utils/conceptionReminderScheduling';
import type { ConceptionReminderKey } from '../state/conceptionPreferences';
import {
  addInAppNotification,
  markInAppNotificationAsRead,
} from '../state/inAppNotificationStore';

// TTC ("Essayer de concevoir") equivalent of postpartumNifasNotificationPersistence.ts
// — same shape, same addInAppNotification() dedup guarantee, different
// domain. Kept as its own file (not merged into the Nifas one) so a change
// to either objective's notification handling can never regress the other.

const CONCEPTION_REMINDER_KIND = 'conception-reminder';

export const isConceptionReminderNotification = (
  notification?: Notification,
): boolean =>
  notification?.data?.hawaNotificationKind === CONCEPTION_REMINDER_KIND;

const todayLocalDateKey = (): string => new Date().toLocaleDateString('en-CA');

/** TTC reminders can recur (temperature/daily_journal fire daily; the
 * cycle-relative ones fire once per cycle) — unlike Nifas's one-time-ever
 * reminder, the schedule id alone isn't a valid in-app dedup key (it would
 * collapse every day's firing into a single card, ever). Appending the
 * LOCAL calendar date at the moment of actual delivery gives a fresh,
 * correctly-deduplicated occurrence id per real firing, computed the same
 * way regardless of which entry point (foreground/background/press)
 * observes it — so they all converge on the same AsyncStorage key. */
export function getConceptionReminderOccurrenceId(notification: Notification): string {
  return `${notification.id}:${todayLocalDateKey()}`;
}

/** Background-safe persistence: no navigation, UI, scheduler or Notifee calls. */
export async function persistConceptionReminderNotification(
  notification?: Notification,
  read = false,
): Promise<void> {
  if (!notification?.id || !isConceptionReminderNotification(notification)) {
    return;
  }
  const reminderType = getNotificationDataString(
    notification,
    'conceptionReminderType',
  ) as ConceptionReminderKey | undefined;
  const occurrenceId = getConceptionReminderOccurrenceId(notification);
  const content = reminderType ? CONTENT[reminderType] : undefined;

  await addInAppNotification({
    id: occurrenceId,
    type: CONCEPTION_REMINDER_KIND,
    title: content?.title ?? 'Rappel de suivi',
    message: content?.body ?? 'Un rappel de ton suivi TTC est disponible.',
    receivedAt: new Date().toISOString(),
    read,
    route: CONCEPTION_REMINDER_KIND,
    data: reminderType ? { conceptionReminderType: reminderType } : undefined,
  });
  if (read) {
    await markInAppNotificationAsRead(occurrenceId);
  }
}
