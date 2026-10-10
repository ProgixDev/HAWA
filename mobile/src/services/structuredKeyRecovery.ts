import AsyncStorage from '@react-native-async-storage/async-storage';

import {reloadActiveProfileData} from '../state/activeProfileStore';
import {reloadCycleStateFromStorage} from '../state/onboardingPreferences';
import secureStorage, {
  forgetUnavailableStructuredKeys,
  getUnavailableStructuredKeys,
  retryDeferredOwnerHydrations,
} from './secureAsyncStorage';
import {KEY_ESTABLISHED_MARKER, STRUCTURED_KEY_SERVICE} from './structuredEncryption';
import {getOrCreateAesKey} from './secureAesKeyStore';
import {cancelAllLocalNotifications} from './pregnancyNotifications';

// What the user can do when protected records cannot be read. Every action here is something the USER chose on the
// recovery screen; none runs by itself, and none runs silently.
//
//   1. retry          — the cause may have been temporary (a locked Keystore): forget the failures and read again.
//   2. new key        — the old key is gone for good ('key-lost'). Creates a fresh key so NEW records can be written again.
//                       Records encrypted under the old key stay exactly as they are (still unreadable) until step 3 or a
//                       backup restore replaces them.
//   3. discard        — the user explicitly gives up on the unreadable records and removes them.
//
// Restoring a backup (portable or local) is the way to get the data BACK; it lives on the backup screens.

export type UnavailableSummary = {total: number; keyLost: number; authentication: number; other: number};

export function summarizeUnavailable(): UnavailableSummary {
  const items = getUnavailableStructuredKeys();
  const keyLost = items.filter(item => item.reason === 'key-lost' || item.reason === 'key-missing').length;
  const authentication = items.filter(item => item.reason === 'authentication-failed').length;
  return {total: items.length, keyLost, authentication, other: items.length - keyLost - authentication};
}

async function reloadStores(): Promise<void> {
  reloadActiveProfileData();
  await reloadCycleStateFromStorage().catch(() => undefined);
  // Owner-only stores (pregnancy, postpartum, loss, conception, contraception, SOPK, menopause...) memoise their first
  // read; the ones whose read failed re-read now, so the screens refresh without an app restart.
  await retryDeferredOwnerHydrations();
}

export async function retryStructuredAccess(): Promise<void> {
  forgetUnavailableStructuredKeys();
  await reloadStores();
}

/** Only meaningful after a key LOSS. Never touches an existing readable key, never touches any record. */
export async function createReplacementProtectionKey(): Promise<boolean> {
  if (!getUnavailableStructuredKeys().some(item => item.reason === 'key-lost')) {return false;}
  await AsyncStorage.removeItem(KEY_ESTABLISHED_MARKER);
  await getOrCreateAesKey(STRUCTURED_KEY_SERVICE, 'structured-health-data-key');
  await AsyncStorage.setItem(KEY_ESTABLISHED_MARKER, '1');
  await retryStructuredAccess();
  return true;
}

/** The user's explicit decision to erase records that can no longer be read. Returns how many were removed. */
export async function discardUnreadableRecords(): Promise<number> {
  const keys = getUnavailableStructuredKeys().map(item => item.key);
  if (keys.length === 0) {
    await retryStructuredAccess();
    return 0;
  }
  // Reminders are triggers in Android's own notification database, derived from the records. The ones derived from
  // the records being erased can no longer be told apart from the rest (their sources cannot be read, so which ids
  // they own is unknown): every reminder is cancelled FIRST — so none of them fires from data the user just
  // gave up — and rebuilt below from the records that are still readable. Confined to this action, which is the
  // only one here that erases records.
  await cancelAllLocalNotifications();
  try {
    for (const key of keys) {
      // Through the storage layer (not the raw store): it takes the key lock AND ends the write protection of a record
      // the user has explicitly given up on, so the stores can be written again.
      await secureStorage.removeItem(key);
    }
    await retryStructuredAccess();
  } finally {
    // Also when the erasure stops half-way: what was cancelled above has to come back for every domain that is
    // still readable. Never throws; an objective whose records are still unreadable is left alone by its own sync.
    // Loaded here, not at the top: reminderResync pulls in every objective's scheduler and store, which this module's
    // other importers (the recovery screen, "Try again") have no use for and must not start up as a side effect.
    const {resyncAllReminderNotifications} = require('./reminderResync') as typeof import('./reminderResync');
    await resyncAllReminderNotifications({force: true});
  }
  return keys.length;
}
