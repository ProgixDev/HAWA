import AsyncStorage from '@react-native-async-storage/async-storage';

// Canonical, persisted "remaining Ramadan fasting days owed" count — the
// single value consumed identically by FastingQadaaScreen, the Home
// SpiritualGuidanceCard summary, and the Hijri Calendar shortcut. The
// number itself is always derived from confirmed data by
// src/utils/qadaaLogic.ts (see useQadaaStatus); this store only caches the
// last computed result so a cold app restart can show it immediately
// instead of flashing "À jour" before the first recomputation resolves —
// the same anti-flicker role periodEndDateTime's cache plays elsewhere.
const QADAA_STORAGE_KEY = '@hawa/remaining-qadaa-days';

let remainingQadaaDays: number | null = null;
const listeners = new Set<() => void>();
let hydration: Promise<number | null> | null = null;
let hydrated = false;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export const getRemainingQadaaDays = (): number | null => remainingQadaaDays;

export const setRemainingQadaaDays = async (value: number): Promise<void> => {
  remainingQadaaDays = value;
  notifyListeners();
  await AsyncStorage.setItem(QADAA_STORAGE_KEY, String(value));
};

export const hydrateRemainingQadaaDays = (): Promise<number | null> => {
  // Same reasoning as onboardingPreferences' hydrate* functions: once the
  // first real AsyncStorage read resolves, the in-memory value is
  // authoritative — re-returning the cached first-read promise on every
  // later call would clobber a just-recomputed value with the stale
  // snapshot from whenever the app first hydrated.
  if (hydrated) {
    return Promise.resolve(remainingQadaaDays);
  }
  if (!hydration) {
    hydration = AsyncStorage.getItem(QADAA_STORAGE_KEY)
      .then(raw => {
        hydrated = true;
        if (raw !== null) {
          const parsed = Number(raw);
          if (Number.isFinite(parsed)) {
            remainingQadaaDays = parsed;
            notifyListeners();
          }
        }
        return remainingQadaaDays;
      })
      .catch(() => {
        hydrated = true;
        return remainingQadaaDays;
      });
  }
  return hydration;
};

export const subscribeRemainingQadaaDays = (listener: () => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};
