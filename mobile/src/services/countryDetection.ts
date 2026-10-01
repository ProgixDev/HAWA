import {IS_MAPS_CONFIGURED, MAPTILER_PUBLIC_KEY} from '../config/maps';

// Approximate, IP-based country detection for LocationScreen.tsx's initial
// map suggestion only (see services/locationInitialization.ts) — never a
// substitute for GPS (the explicit "use my current location" button) and
// never presented to the user as an exact location. A VPN/proxy can
// legitimately cause a different country to be detected; that is acceptable
// here, since this only decides where the map opens before anything is
// chosen or saved.
//
// Reuses MapTiler's IP Geolocation API (https://api.maptiler.com/geolocation/
// ip.json), bundled with the same account/public key already configured for
// maps and place search (config/maps.ts) — no new dependency, no new secret,
// no separate service to provision. The endpoint is called with the app's
// existing public key exactly like mapProvider.ts's geocoding calls.
const GEOLOCATION_URL = 'https://api.maptiler.com/geolocation/ip.json';
const DETECTION_TIMEOUT_MS = 5000;

type GeolocationResponse = {country_code?: unknown};

const isTwoLetterCode = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z]{2}$/.test(value);

/**
 * Resolves the caller's ISO 3166-1 alpha-2 country code from the network, or
 * `null` if detection isn't possible for any reason — offline, the service
 * is unavailable, the request times out, or the response is malformed.
 * Every failure is swallowed here; callers always get a usable answer
 * (`null`) and fall back to the neutral London default (see
 * config/countryLocations.ts), never a thrown error or a blocking dialog.
 */
export async function detectCountryCode(): Promise<string | null> {
  if (!IS_MAPS_CONFIGURED) {
    return null;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DETECTION_TIMEOUT_MS);
  try {
    const response = await fetch(
      `${GEOLOCATION_URL}?key=${encodeURIComponent(MAPTILER_PUBLIC_KEY)}`,
      {signal: controller.signal},
    );
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as GeolocationResponse;
    return isTwoLetterCode(payload.country_code) ? payload.country_code.toUpperCase() : null;
  } catch {
    // Network failure, offline device, abort/timeout, or invalid JSON — all
    // treated the same way: no signal, no error surfaced to the user.
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
