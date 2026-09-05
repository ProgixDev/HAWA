import AsyncStorage from '@react-native-async-storage/async-storage';

export type InAppNotification = {
  /** Stable domain/Notifee id. This is also the AsyncStorage key suffix and
   * the de-duplication key. */
  id: string;
  type: string;
  title: string;
  message: string;
  receivedAt: string;
  read: boolean;
  route?: string;
  data?: Record<string, string>;
};

// Storage model: ONE AsyncStorage key per notification (keyed by its stable
// `id`), not a single JSON-array blob under one key. This is what makes
// "at most one entry per id, no lost writes" an actual structural
// guarantee instead of a best-effort one.
//
// Android's background/headless notification handler (index.js ->
// notifee.onBackgroundEvent) runs in a completely separate JS instance from
// the main app — its own engine, its own module scope, no shared memory,
// no way to coordinate a lock between the two. With a single blob key, two
// runtimes both doing read -> modify -> setItem() is a classic race: an
// add from one runtime can be silently overwritten by the other runtime's
// write landing after it, losing a notification entirely.
//
// With one key per notification id, two runtimes adding two DIFFERENT
// notifications write to two DIFFERENT keys and can never conflict. Two
// runtimes adding the SAME id write identical, deterministic content to
// the same key, so whichever write "wins" produces the same result —
// never a lost notification, never a duplicate. Reads enumerate the
// current key set, so the result is dedupe-by-construction: AsyncStorage
// cannot hold two values under one key, so duplicate ids simply cannot
// exist in what gets read back.
const ITEM_KEY_PREFIX = '@hawa/in-app-notifications/v2/item/';
const LEGACY_ARRAY_KEY = '@hawa/in-app-notifications/v1';
const MAX_NOTIFICATIONS = 80;

const keyFor = (id: string): string => `${ITEM_KEY_PREFIX}${id}`;

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

const isInAppNotification = (item: unknown): item is InAppNotification =>
  Boolean(item) &&
  typeof (item as InAppNotification).id === 'string' &&
  typeof (item as InAppNotification).type === 'string' &&
  typeof (item as InAppNotification).title === 'string' &&
  typeof (item as InAppNotification).message === 'string' &&
  typeof (item as InAppNotification).receivedAt === 'string' &&
  typeof (item as InAppNotification).read === 'boolean';

/** One-time migration from the old single-blob-array format. Safe from more
 * than one JS instance and safe to run more than once: writing the same
 * per-id key twice is idempotent. If the legacy blob already contained
 * duplicate-id entries (a symptom of the old race), multiSet collapses
 * each id down to a single key automatically — the corruption cannot
 * survive the migration. */
let migrated: Promise<void> | null = null;
const migrateLegacyArrayIfNeeded = (): Promise<void> => {
  if (!migrated) {
    migrated = (async () => {
      try {
        const raw = await AsyncStorage.getItem(LEGACY_ARRAY_KEY);
        if (!raw) {
          return;
        }
        const candidate = JSON.parse(raw) as unknown;
        const legacyItems = Array.isArray(candidate)
          ? candidate.filter(isInAppNotification)
          : [];
        if (legacyItems.length > 0) {
          // Object.fromEntries collapses any duplicate-id entries left over
          // from the old race down to their last occurrence — the exact
          // corruption this migration needs to clean up cannot survive it.
          await AsyncStorage.setMany(
            Object.fromEntries(
              legacyItems.map(item => [keyFor(item.id), JSON.stringify(item)]),
            ),
          );
        }
        await AsyncStorage.removeItem(LEGACY_ARRAY_KEY);
      } catch {
        // Best-effort: a failed migration just leaves the legacy key alone
        // (its old notifications are missed) — never crashes, never blocks
        // new notifications.
      }
    })();
  }
  return migrated;
};

/** Reads every persisted notification straight from AsyncStorage — the
 * single source of truth for both the badge count and the rendered list,
 * so the two can never derive from different snapshots. */
const readPersistedNotifications = async (): Promise<InAppNotification[]> => {
  await migrateLegacyArrayIfNeeded();
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter(key =>
      key.startsWith(ITEM_KEY_PREFIX),
    );
    if (keys.length === 0) {
      return [];
    }
    const entries = await AsyncStorage.getMany(keys);
    const items = Object.values(entries)
      .map(raw => {
        if (!raw) {
          return null;
        }
        try {
          const parsed = JSON.parse(raw) as unknown;
          return isInAppNotification(parsed) ? parsed : null;
        } catch {
          return null;
        }
      })
      .filter((item): item is InAppNotification => item !== null);
    items.sort(
      (a, b) =>
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
    );
    return items;
  } catch {
    return notifications;
  }
};

/** Best-effort cap: deletes the oldest entries beyond MAX_NOTIFICATIONS.
 * Safe under concurrent runtimes — removeItem on an already-removed key is
 * a no-op, so two runtimes both pruning at once never corrupts anything. */
const pruneBeyondLimit = async (
  items: InAppNotification[],
): Promise<InAppNotification[]> => {
  if (items.length <= MAX_NOTIFICATIONS) {
    return items;
  }
  const kept = items.slice(0, MAX_NOTIFICATIONS);
  const excess = items.slice(MAX_NOTIFICATIONS);
  await AsyncStorage.removeMany(excess.map(item => keyFor(item.id))).catch(
    () => {},
  );
  return kept;
};

export const getInAppNotifications = (): InAppNotification[] => [
  ...notifications,
];

export const getUnreadInAppNotificationCount = (): number =>
  notifications.filter(notification => !notification.read).length;

export const hydrateInAppNotifications = (): Promise<InAppNotification[]> => {
  if (!hydration) {
    hydration = readPersistedNotifications().then(value => {
      notifications = value;
      emit();
      return getInAppNotifications();
    });
  }
  return hydration;
};

/**
 * Serializes calls WITHIN this one JS instance only — it does not and
 * cannot reach across to the separate headless/background instance. That's
 * fine: the actual cross-runtime guarantee comes from every notification id
 * owning its own AsyncStorage key (see the module-level comment above), not
 * from this queue. This queue only keeps this instance's own in-memory
 * cache and emitted updates consistent when it makes more than one store
 * call close together (e.g. the foreground DELIVERED handler and a
 * reconciliation pass both firing near-simultaneously in the main app).
 */
let writeQueue: Promise<void> = Promise.resolve();
const enqueue = (task: () => Promise<void>): Promise<void> => {
  const result = writeQueue.then(task, task);
  writeQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
};

/** Idempotent by `id` — see the module-level comment for why this holds
 * even across the main app and Android's separate headless JS instance. */
export const addInAppNotification = (
  notification: InAppNotification,
): Promise<void> =>
  enqueue(async () => {
    await migrateLegacyArrayIfNeeded();
    const existing = await AsyncStorage.getItem(keyFor(notification.id));
    if (existing) {
      log('duplicate skipped', notification.id);
      notifications = await readPersistedNotifications();
      emit();
      return;
    }
    log('saving in-app notification', notification.id);
    await AsyncStorage.setItem(
      keyFor(notification.id),
      JSON.stringify(notification),
    );
    notifications = await pruneBeyondLimit(await readPersistedNotifications());
    emit();
    log('saved successfully', notification.id);
  });

export const markInAppNotificationAsRead = (id: string): Promise<void> =>
  enqueue(async () => {
    const raw = await AsyncStorage.getItem(keyFor(id));
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!isInAppNotification(parsed) || parsed.read) {
        return;
      }
      await AsyncStorage.setItem(
        keyFor(id),
        JSON.stringify({ ...parsed, read: true }),
      );
      notifications = await readPersistedNotifications();
      emit();
    } catch {
      // malformed entry — leave it untouched rather than guessing
    }
  });

export const markAllInAppNotificationsAsRead = (): Promise<void> =>
  enqueue(async () => {
    const items = await readPersistedNotifications();
    const unread = items.filter(item => !item.read);
    if (unread.length === 0) {
      return;
    }
    await AsyncStorage.setMany(
      Object.fromEntries(
        unread.map(item => [
          keyFor(item.id),
          JSON.stringify({ ...item, read: true }),
        ]),
      ),
    );
    notifications = await readPersistedNotifications();
    emit();
  });

export const clearInAppNotification = (id: string): Promise<void> =>
  enqueue(async () => {
    await AsyncStorage.removeItem(keyFor(id));
    notifications = await readPersistedNotifications();
    emit();
  });

export const clearAllInAppNotifications = (): Promise<void> =>
  enqueue(async () => {
    const keys = (await AsyncStorage.getAllKeys()).filter(key =>
      key.startsWith(ITEM_KEY_PREFIX),
    );
    if (keys.length > 0) {
      await AsyncStorage.removeMany(keys);
    }
    notifications = [];
    emit();
  });

export const subscribeInAppNotifications = (
  listener: () => void,
): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
