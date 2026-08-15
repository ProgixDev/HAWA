import AsyncStorage from '@react-native-async-storage/async-storage';

export type InAppNotification = {
  /** Stable domain/Notifee id. This is also the de-duplication key. */
  id: string;
  type: string;
  title: string;
  message: string;
  receivedAt: string;
  read: boolean;
  route?: string;
  data?: Record<string, string>;
};

const STORAGE_KEY = '@hawa/in-app-notifications/v1';
const MAX_NOTIFICATIONS = 80;

let notifications: InAppNotification[] = [];
let hydration: Promise<InAppNotification[]> | null = null;
const listeners = new Set<() => void>();

const emit = (): void => {
  listeners.forEach(listener => listener());
};

const log = (...args: unknown[]): void => {
  if (__DEV__) {
    console.log('[NIFAS]', ...args);
  }
};

const persist = async (): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
};

export const getInAppNotifications = (): InAppNotification[] => [
  ...notifications,
];

export const getUnreadInAppNotificationCount = (): number =>
  notifications.filter(notification => !notification.read).length;

export const hydrateInAppNotifications = (): Promise<InAppNotification[]> => {
  if (!hydration) {
    hydration = AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          const candidate = JSON.parse(raw) as unknown;
          if (Array.isArray(candidate)) {
            notifications = candidate.filter(
              (item): item is InAppNotification =>
                Boolean(item) &&
                typeof item.id === 'string' &&
                typeof item.type === 'string' &&
                typeof item.title === 'string' &&
                typeof item.message === 'string' &&
                typeof item.receivedAt === 'string' &&
                typeof item.read === 'boolean',
            );
          }
        }
        emit();
        return getInAppNotifications();
      })
      .catch(() => getInAppNotifications());
  }
  return hydration;
};

/** Idempotent: repeating a Notifee delivery event cannot add a duplicate. */
export const addInAppNotification = async (
  notification: InAppNotification,
): Promise<void> => {
  await hydrateInAppNotifications();
  if (notifications.some(item => item.id === notification.id)) {
    log('duplicate skipped', notification.id);
    return;
  }
  log('saving in-app notification', notification.id);
  notifications = [notification, ...notifications].slice(0, MAX_NOTIFICATIONS);
  emit();
  await persist();
  log('saved successfully', notification.id);
};

export const markInAppNotificationAsRead = async (
  id: string,
): Promise<void> => {
  await hydrateInAppNotifications();
  let changed = false;
  notifications = notifications.map(notification => {
    if (notification.id !== id || notification.read) {
      return notification;
    }
    changed = true;
    return { ...notification, read: true };
  });
  if (changed) {
    emit();
    await persist();
  }
};

export const markAllInAppNotificationsAsRead = async (): Promise<void> => {
  await hydrateInAppNotifications();
  if (!notifications.some(notification => !notification.read)) {
    return;
  }
  notifications = notifications.map(notification => ({
    ...notification,
    read: true,
  }));
  emit();
  await persist();
};

export const clearInAppNotification = async (id: string): Promise<void> => {
  await hydrateInAppNotifications();
  const next = notifications.filter(notification => notification.id !== id);
  if (next.length === notifications.length) {
    return;
  }
  notifications = next;
  emit();
  await persist();
};

export const clearAllInAppNotifications = async (): Promise<void> => {
  await hydrateInAppNotifications();
  if (notifications.length === 0) {
    return;
  }
  notifications = [];
  emit();
  await persist();
};

export const subscribeInAppNotifications = (
  listener: () => void,
): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
