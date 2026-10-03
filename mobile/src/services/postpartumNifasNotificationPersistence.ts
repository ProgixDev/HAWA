import type { Notification } from '@notifee/react-native';

import {
  NIFAS_EDUCATIONAL_ARTICLE_ID,
  nifasReferenceApproachingHeadline,
  nifasReferenceReachedHeadline,
} from '../config/nifasReminderConfig';
import i18n from '../i18n';
import {
  addInAppNotification,
  markInAppNotificationAsRead,
} from '../state/inAppNotificationStore';

const NIFAS_NOTIFICATION_KIND = 'postpartum-nifas';

export const isPostpartumNifasNotification = (
  notification?: Notification,
): boolean =>
  notification?.data?.hawaNotificationKind === NIFAS_NOTIFICATION_KIND;

export const getNotificationDataString = (
  notification: Notification,
  key: string,
): string | undefined => {
  const value = notification.data?.[key];
  return typeof value === 'string' ? value : undefined;
};

/** Background-safe persistence: no navigation, UI, scheduler or Notifee calls. */
export async function persistPostpartumNifasNotification(
  notification?: Notification,
  read = false,
): Promise<void> {
  if (!notification?.id || !isPostpartumNifasNotification(notification)) {
    return;
  }
  const occurrenceId =
    getNotificationDataString(notification, 'inAppOccurrenceId') ??
    notification.id;
  const reminderType = getNotificationDataString(
    notification,
    'nifasReminderType',
  );
  const reached =
    reminderType === 'reference' ||
    notification.id === 'postpartum-nifas-reference';
  const articleId = getNotificationDataString(notification, 'articleId');

  await addInAppNotification({
    id: occurrenceId,
    type: NIFAS_NOTIFICATION_KIND,
    title:
      getNotificationDataString(notification, 'inAppTitle') ??
      (reached
        ? i18n.t('notifications.postpartum.nifas.fallbackReachedTitle')
        : i18n.t('notifications.postpartum.nifas.fallbackApproachingTitle')),
    message:
      getNotificationDataString(notification, 'inAppMessage') ??
      (reached
        ? `${nifasReferenceReachedHeadline()}.`
        : `${nifasReferenceApproachingHeadline()}.`),
    receivedAt: new Date().toISOString(),
    read,
    route: 'ArticleReader',
    data: {
      articleId:
        typeof articleId === 'string'
          ? articleId
          : NIFAS_EDUCATIONAL_ARTICLE_ID,
    },
  });
  if (read) {
    await markInAppNotificationAsRead(occurrenceId);
  }
}
