/**
 * ISO 3166-1 alpha-2 country code → one representative city, used ONLY to
 * seed LocationScreen.tsx's initial map suggestion when the user has no
 * saved location yet (see services/locationInitialization.ts).
 *
 * This is not a restriction list: city search (services/maps/mapProvider.ts)
 * stays global, and every one of these countries — and any country not
 * listed here — remains a fully valid location a user can search for, pick,
 * and save. This table only decides what the map opens on BEFORE she has
 * chosen anything.
 */
export type RepresentativeLocation = {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
};

// The neutral, final fallback: used when there is no saved location, country
// detection is unavailable/fails/times out, or the detected country isn't in
// the table below. Deliberately NOT Algiers — see LocationScreen.tsx's
// header comment for why a single-country default doesn't fit an
// international, English-first app.
export const LONDON_FALLBACK: RepresentativeLocation = {
  city: 'London',
  country: 'United Kingdom',
  latitude: 51.5074,
  longitude: -0.1278,
};

const REPRESENTATIVE_LOCATIONS: Record<string, RepresentativeLocation> = {
  FR: {city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522},
  GB: LONDON_FALLBACK,
  US: {city: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006},
  CA: {city: 'Toronto', country: 'Canada', latitude: 43.6532, longitude: -79.3832},
  DE: {city: 'Berlin', country: 'Germany', latitude: 52.52, longitude: 13.405},
  ES: {city: 'Madrid', country: 'Spain', latitude: 40.4168, longitude: -3.7038},
  IT: {city: 'Rome', country: 'Italy', latitude: 41.9028, longitude: 12.4964},
  BE: {city: 'Brussels', country: 'Belgium', latitude: 50.8503, longitude: 4.3517},
  NL: {city: 'Amsterdam', country: 'Netherlands', latitude: 52.3676, longitude: 4.9041},
  CH: {city: 'Zurich', country: 'Switzerland', latitude: 47.3769, longitude: 8.5417},
  PT: {city: 'Lisbon', country: 'Portugal', latitude: 38.7223, longitude: -9.1393},
  MA: {city: 'Casablanca', country: 'Morocco', latitude: 33.5731, longitude: -7.5898},
  // Algeria remains a fully valid, supported location — it is simply no
  // longer the unconditional default for every user (see LocationScreen.tsx).
  DZ: {city: 'Algiers', country: 'Algeria', latitude: 36.7538, longitude: 3.0588},
  TN: {city: 'Tunis', country: 'Tunisia', latitude: 36.8065, longitude: 10.1815},
  TR: {city: 'Istanbul', country: 'Turkey', latitude: 41.0082, longitude: 28.9784},
  AE: {city: 'Dubai', country: 'United Arab Emirates', latitude: 25.2048, longitude: 55.2708},
  SA: {city: 'Riyadh', country: 'Saudi Arabia', latitude: 24.7136, longitude: 46.6753},
};

/** Looks up the representative city for a detected ISO alpha-2 country code
 * (case-insensitive). Falls back to London for a missing, unknown, or
 * unsupported code — never throws. */
export function representativeLocationForCountryCode(
  countryCode: string | null | undefined,
): RepresentativeLocation {
  if (!countryCode) {
    return LONDON_FALLBACK;
  }
  return REPRESENTATIVE_LOCATIONS[countryCode.toUpperCase()] ?? LONDON_FALLBACK;
}
