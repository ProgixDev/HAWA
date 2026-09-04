import type {Notification} from '@notifee/react-native';

import {getNotificationDataString} from './postpartumNifasNotificationPersistence';
import {CYCLE_REMINDER_NOTIFICATION_KIND} from '../utils/cycleReminderScheduling';
import {IRREGULAR_REMINDER_NOTIFICATION_KIND} from '../utils/irregularReminderScheduling';
import {CONTRACEPTION_REMINDER_NOTIFICATION_KIND} from '../utils/contraceptionReminderScheduling';
import {PREGNANCY_REMINDER_NOTIFICATION_KIND} from '../utils/pregnancyReminderScheduling';
import {POSTPARTUM_DAILY_TRACKING_NOTIFICATION_KIND} from '../utils/postpartumReminderScheduling';
import {MISCARRIAGE_DAILY_TRACKING_NOTIFICATION_KIND} from '../utils/miscarriageReminderScheduling';
import {
  MENOPAUSE_DAILY_TRACKING_NOTIFICATION_KIND,
  MENOPAUSE_TREATMENT_NOTIFICATION_KIND,
} from '../utils/menopauseReminderScheduling';
import {QADAA_POST_RAMADAN_NOTIFICATION_KIND} from '../utils/qadaaReminderScheduling';
import {
  addInAppNotification,
  markInAppNotificationAsRead,
} from '../state/inAppNotificationStore';

// Generic in-app-history persistence for every reminder system that doesn't
// need bespoke deep-link routing the way Nifas (-> ArticleReader) and TTC
// (-> Temperature/LHTest entry) do — see postpartumNifasNotificationPersistence.ts
// / conceptionReminderNotificationPersistence.ts for those two, both left
// untouched by this file. Every kind recognized here shares the exact same
// shape: read the REAL title/body from data.inAppTitle/inAppMessage — never
// notification.title/body, which may be the discreet-mode-redacted
// "AWA"/"Tu as un nouveau rappel AWA." placeholder (see
// pregnancyNotifications.ts) — compute a per-firing occurrence id, and route
// to an existing screen only. Kind constants are imported from each
// objective's own scheduling module (the single source of truth for that
// string), never redeclared here, so they can't drift out of sync.

const GENERIC_REMINDER_KINDS = new Set<string>([
  CYCLE_REMINDER_NOTIFICATION_KIND,
  IRREGULAR_REMINDER_NOTIFICATION_KIND,
  CONTRACEPTION_REMINDER_NOTIFICATION_KIND,
  PREGNANCY_REMINDER_NOTIFICATION_KIND,
  POSTPARTUM_DAILY_TRACKING_NOTIFICATION_KIND,
  MENOPAUSE_DAILY_TRACKING_NOTIFICATION_KIND,
  MENOPAUSE_TREATMENT_NOTIFICATION_KIND,
  QADAA_POST_RAMADAN_NOTIFICATION_KIND,
  MISCARRIAGE_DAILY_TRACKING_NOTIFICATION_KIND,
]);

export const isGenericReminderNotification = (
  notification?: Notification,
): boolean => {
  const kind = notification?.data?.hawaNotificationKind;
  return typeof kind === 'string' && GENERIC_REMINDER_KINDS.has(kind);
};

const todayLocalDateKey = (): string => new Date().toLocaleDateString('en-CA');

/** Every generic reminder's in-app dedup key: the real notifee id plus the
 * LOCAL calendar date of actual delivery — same rationale as TTC's
 * getConceptionReminderOccurrenceId (a static per-kind notifee id would
 * otherwise collapse every real firing of a recurring, or re-upserted-onto-a-
 * new-date, reminder into a single card). A caller-provided
 * data.inAppOccurrenceId (Qadaa already computes a precise one from its own
 * Ramadan-month-start + fire-timestamp) is used verbatim instead when
 * present. */
export function getGenericReminderOccurrenceId(notification: Notification): string {
  const provided = getNotificationDataString(notification, 'inAppOccurrenceId');
  return provided ?? `${notification.id}:${todayLocalDateKey()}`;
}

/** Existing-route-only navigation target for this kind, resolved once here so
 * InAppNotificationCenter.tsx doesn't need to know every reminder kind
 * string. 'objective-home' is the safe default (MainTabs -> CycleHome, the
 * same objective-aware Home screen TTC's own daily/cycle-relative reminders
 * already fall back to) for every kind that has no more specific existing
 * screen to deep-link into. */
function routeForKind(kind: string): string {
  if (kind === MENOPAUSE_TREATMENT_NOTIFICATION_KIND) {
    return 'menopause-treatment-reminder';
  }
  if (kind === QADAA_POST_RAMADAN_NOTIFICATION_KIND) {
    return 'qadaa-reminder';
  }
  if (kind === MISCARRIAGE_DAILY_TRACKING_NOTIFICATION_KIND) {
    return 'miscarriage-journal';
  }
  return 'objective-home';
}

/** Background-safe persistence: no navigation, UI, scheduler or Notifee calls. */
export async function persistGenericReminderNotification(
  notification?: Notification,
  read = false,
): Promise<void> {
  if (!notification?.id || !isGenericReminderNotification(notification)) {
    return;
  }
  const kind = getNotificationDataString(notification, 'hawaNotificationKind')!;
  const occurrenceId = getGenericReminderOccurrenceId(notification);

  await addInAppNotification({
    id: occurrenceId,
    type: kind,
    title: getNotificationDataString(notification, 'inAppTitle') ?? 'Rappel AWA',
    message:
      getNotificationDataString(notification, 'inAppMessage') ??
      'Un nouveau rappel est disponible.',
    receivedAt: new Date().toISOString(),
    read,
    route: routeForKind(kind),
  });
  if (read) {
    await markInAppNotificationAsRead(occurrenceId);
  }
}
