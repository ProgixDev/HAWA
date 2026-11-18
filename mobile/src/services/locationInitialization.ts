import {representativeLocationForCountryCode} from '../config/countryLocations';
import type {MapPlace} from './maps/types';
import {hydrateSelectedLocation} from '../state/onboardingPreferences';
import {readDeviceLocaleTags} from '../utils/deviceLanguage';

/** Where LocationScreen.tsx opens: the place already chosen (or `null` — nothing is selected) and the map view to start on. */
export type InitialLocation = {
  place: MapPlace | null;
  center: [number, number]; // [longitude, latitude]
  zoom: number;
};

// Nothing known about where she is: the whole world, no city. Zoomed so the map shows more than one continent.
const WORLD_VIEW = {center: [10, 25] as [number, number], zoom: 1.5};
// A country-level view for a region read from the phone's settings: a place to start looking from, never a selected place.
const REGION_ZOOM = 5;

/** The region of the first device locale tag that carries one ("fr-DZ" → "DZ", "zh-Hans-CN" → "CN"), or `null`. Never throws. */
export function regionFromLocaleTags(tags: readonly string[]): string | null {
  for (const tag of tags) {
    const parts = tag.split(/[-_]/).slice(1);
    const region = parts.find(part => /^[A-Za-z]{2}$/.test(part));
    if (region) {
      return region.toUpperCase();
    }
  }
  return null;
}

/**
 * Resolves what LocationScreen.tsx should show BEFORE the user has done anything — never a substitute for an explicit choice, and never
 * itself persisted (only the existing save-on-confirm flow in LocationScreen.tsx writes `@hawa/selected-location`).
 *
 *   1. A saved location — reopens exactly where she left it (e.g. "Edit location" from PrayerTimesScreen.tsx).
 *   2. No saved location — NOTHING is selected. The map only opens on the region of the phone's own settings (its locale, read locally:
 *      no network, no IP lookup, no permission), at country level; when the phone gives no usable region, or it is not one of the
 *      listed countries, on a neutral world view. GPS, search and tapping the map remain the ways to choose a place.
 */
export async function resolveInitialLocation(): Promise<InitialLocation> {
  const saved = await hydrateSelectedLocation();
  if (saved) {
    return {place: saved, center: [saved.longitude, saved.latitude], zoom: 11};
  }
  let region: string | null = null;
  try {
    region = regionFromLocaleTags(await readDeviceLocaleTags());
  } catch {
    // no readable locale: neutral world view
  }
  const known = representativeLocationForCountryCode(region);
  if (known) {
    return {place: null, center: [known.longitude, known.latitude], zoom: REGION_ZOOM};
  }
  return {place: null, ...WORLD_VIEW};
}
