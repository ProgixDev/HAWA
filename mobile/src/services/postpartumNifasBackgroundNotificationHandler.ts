import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Notification } from '@notifee/react-native';

import {
  isPostpartumNifasNotification,
  persistPostpartumNifasNotification,
} from './postpartumNifasNotificationPersistence';

const PENDING_ARTICLE_KEY = '@hawa/postpartum-nifas-pending-article';
const DEFAULT_ARTICLE_ID = 'nifasfiqh-repere-fiqh';

/** Safe for Notifee's headless/background runtime: persist only, never navigate. */
export async function handlePostpartumNifasBackgroundNotification(
  type: 'delivered' | 'press',
  notification?: Notification,
): Promise<void> {
  if (!isPostpartumNifasNotification(notification)) {
    return;
  }
  await persistPostpartumNifasNotification(notification, type === 'press');
  if (type === 'press') {
    const articleId = notification?.data?.articleId;
    await AsyncStorage.setItem(
      PENDING_ARTICLE_KEY,
      typeof articleId === 'string' ? articleId : DEFAULT_ARTICLE_ID,
    );
  }
}
