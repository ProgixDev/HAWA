/**
 * MapTiler client configuration.
 *
 * This key is a public, mobile-client key (never put a server-side secret here).
 * Restrict it to the Android/iOS application identifiers in the MapTiler console.
 */
export const MAPTILER_PUBLIC_KEY = 'G1wJOAQza1xUlIMEFwcc';

export const MAP_STYLE_URL = MAPTILER_PUBLIC_KEY
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_PUBLIC_KEY}`
  : '';

export const MAPTILER_GEOCODING_URL =
  'https://api.maptiler.com/geocoding';

export const IS_MAPS_CONFIGURED = Boolean(MAPTILER_PUBLIC_KEY);

