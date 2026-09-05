import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Notification } from '@notifee/react-native';

import { NIFAS_EDUCATIONAL_ARTICLE_ID } from '../config/nifasReminderConfig';
import { navigationRef } from '../navigation/navigationRef';

const PENDING_ARTICLE_KEY = '@hawa/postpartum-nifas-pending-article';

const isNifasNotification = (notification?: Notification): boolean =>
  notification?.data?.hawaNotificationKind === 'postpartum-nifas';

/** Persist only the pending intent. Navigation is performed after navigator ready. */
export async function storePendingPostpartumNifasNotification(
  notification?: Notification,
): Promise<void> {
  if (!isNifasNotification(notification)) {
    return;
  }
  const articleId = notification?.data?.articleId;
  await AsyncStorage.setItem(
    PENDING_ARTICLE_KEY,
    typeof articleId === 'string' ? articleId : NIFAS_EDUCATIONAL_ARTICLE_ID,
  );
}

export async function openPendingPostpartumNifasNotification(): Promise<void> {
  const articleId = await AsyncStorage.getItem(PENDING_ARTICLE_KEY);
  if (!articleId || !navigationRef.isReady()) {
    return;
  }
  await AsyncStorage.removeItem(PENDING_ARTICLE_KEY);
  navigationRef.navigate('ArticleReader', { articleId });
}
