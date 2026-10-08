import AsyncStorage from '../services/secureAsyncStorage';

import {getActiveProfileId, subscribeActiveProfileId} from './activeProfileStore';
import {profileScopedKey} from './profileScopedStorage';

// Canonical, persisted "remaining Ramadan fasting days owed" count — the
// single value consumed identically by FastingQadaaScreen, the Home
// SpiritualGuidanceCard summary, and the Hijri Calendar shortcut. The
// number itself is always derived from confirmed data by
// src/utils/qadaaLogic.ts (see useQadaaStatus); this store only caches the
// last computed result so a cold app restart can show it immediately
// instead of flashing "À jour" before the first recomputation resolves —
// the same anti-flicker role periodEndDateTime's cache plays elsewhere.
const QADAA_STORAGE_KEY_BASE = '@hawa/remaining-qadaa-days';
// Profile-scoped (see profileScopedStorage.ts) — same strategy as every other
// health store touched by this feature: the mother's key stays unsuffixed/unchanged.
const currentStorageKey = () => profileScopedKey(QADAA_STORAGE_KEY_BASE, getActiveProfileId());

let remainingQadaaDays: number | null = null;
const listeners = new Set<() => void>();
let hydration: Promise<number | null> | null = null;
let hydrated = false;
let hydratedForProfileId: string | null = null;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export const getRemainingQadaaDays = (): number | null => remainingQadaaDays;

export const setRemainingQadaaDays = async (value: number): Promise<void> => {
  remainingQadaaDays = value;
  notifyListeners();
  await AsyncStorage.setItem(currentStorageKey(), String(value));
};

export const hydrateRemainingQadaaDays = (): Promise<number | null> => {
  const profileId = getActiveProfileId();
  // Same reasoning as onboardingPreferences' hydrate* functions: once the
  // first real AsyncStorage read resolves, the in-memory value is
  // authoritative — re-returning the cached first-read promise on every
  // later call would clobber a just-recomputed value with the stale
  // snapshot from whenever the app first hydrated. That guard is now
  // per-profile: switching the active profile forces a fresh read.
  if (hydrated && hydratedForProfileId === profileId) {
    return Promise.resolve(remainingQadaaDays);
  }
  hydration = AsyncStorage.getItem(currentStorageKey())
    .then(raw => {
      hydrated = true;
      hydratedForProfileId = profileId;
      remainingQadaaDays = null;
      if (raw !== null) {
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) {
          remainingQadaaDays = parsed;
        }
      }
      notifyListeners();
      return remainingQadaaDays;
    })
    .catch(() => {
      hydrated = true;
      hydratedForProfileId = profileId;
      return remainingQadaaDays;
    });
  return hydration;
};

// Re-reads (and re-notifies) from the newly active profile's own key whenever the
// active profile changes.
subscribeActiveProfileId(() => {
  hydrated = false;
  hydrateRemainingQadaaDays().catch(() => undefined);
});

export const subscribeRemainingQadaaDays = (listener: () => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};
