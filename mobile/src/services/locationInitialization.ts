import {representativeLocationForCountryCode} from '../config/countryLocations';
import type {MapPlace} from './maps/types';
import {detectCountryCode} from './countryDetection';
import {hydrateSelectedLocation} from '../state/onboardingPreferences';

/**
 * Resolves what LocationScreen.tsx should show BEFORE the user has done
 * anything — never a substitute for an explicit choice, and never itself
 * persisted (only the existing save-on-confirm flow in LocationScreen.tsx
 * writes `@hawa/selected-location`).
 *
 * Priority, highest first:
 *   1. A saved location — reopens exactly where she left it (e.g. "Edit
 *      location" from PrayerTimesScreen.tsx). Country detection never runs,
 *      and never overrides this.
 *   2. No saved location — an approximate, IP-based country guess
 *      (countryDetection.ts) mapped to a representative city
 *      (config/countryLocations.ts).
 *   3. Detection unavailable, failed, timed out, or the country is unknown
 *      — the neutral London default. Never Algiers.
 */
export async function resolveInitialLocation(): Promise<MapPlace> {
  const saved = await hydrateSelectedLocation();
  if (saved) {
    return saved;
  }
  const countryCode = await detectCountryCode();
  const representative = representativeLocationForCountryCode(countryCode);
  return {...representative};
}
