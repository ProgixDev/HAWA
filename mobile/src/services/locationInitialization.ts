import {LONDON_FALLBACK} from '../config/countryLocations';
import type {MapPlace} from './maps/types';
import {hydrateSelectedLocation} from '../state/onboardingPreferences';

/**
 * Resolves what LocationScreen.tsx should show BEFORE the user has done
 * anything — never a substitute for an explicit choice, and never itself
 * persisted (only the existing save-on-confirm flow in LocationScreen.tsx
 * writes `@hawa/selected-location`).
 *
 * Priority, highest first:
 *   1. A saved location — reopens exactly where she left it (e.g. "Edit
 *      location" from PrayerTimesScreen.tsx).
 *   2. No saved location — the neutral London default, always. IP-based
 *      country detection (countryDetection.ts) is deliberately NOT part of
 *      this initial suggestion: an international, English-first app can't
 *      silently guess a representative city (Paris, Algiers, Dubai…) from
 *      an IP address and present it as the starting point before she's
 *      done anything — see countryLocations.ts's header comment. GPS,
 *      search and tapping the map remain the only ways to move off London.
 */
export async function resolveInitialLocation(): Promise<MapPlace> {
  const saved = await hydrateSelectedLocation();
  if (saved) {
    return saved;
  }
  return {...LONDON_FALLBACK};
}
