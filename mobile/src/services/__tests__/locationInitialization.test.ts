import AsyncStorage from '@react-native-async-storage/async-storage';

import {resolveInitialLocation} from '../locationInitialization';
import {detectCountryCode} from '../countryDetection';
import {
  getSelectedLocation,
  resetSelectedLocationForTests,
  setSelectedLocation,
} from '../../state/onboardingPreferences';

// LocationScreen.tsx's initialization hierarchy: a saved location always
// wins; otherwise an approximate, IP-based country guess maps to a
// representative city; otherwise the neutral London default. See
// config/countryLocations.ts and countryDetection.ts for the two pieces this
// composes.
jest.mock('../countryDetection', () => ({
  detectCountryCode: jest.fn(),
}));

const mockDetectCountryCode = detectCountryCode as jest.Mock;

beforeEach(async () => {
  await resetSelectedLocationForTests();
  mockDetectCountryCode.mockReset();
});

describe('resolveInitialLocation — saved location has highest priority', () => {
  it('TEST 1 — a saved location (Paris) is returned as-is, and country detection is never even consulted', async () => {
    await setSelectedLocation({city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522});
    mockDetectCountryCode.mockResolvedValue('GB'); // would be London if it were ever consulted

    const result = await resolveInitialLocation();

    expect(result).toEqual({city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522});
    expect(mockDetectCountryCode).not.toHaveBeenCalled();
  });

  it('TEST 9 — a saved location (New York) wins even when detection would suggest a different country (France)', async () => {
    await setSelectedLocation({city: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006});
    mockDetectCountryCode.mockResolvedValue('FR');

    const result = await resolveInitialLocation();

    expect(result.city).toBe('New York');
    expect(result.country).toBe('United States');
    expect(mockDetectCountryCode).not.toHaveBeenCalled();
  });
});

describe('resolveInitialLocation — no saved location: country detection maps to a representative city', () => {
  it('TEST 2 — France detected → Paris', async () => {
    mockDetectCountryCode.mockResolvedValue('FR');
    const result = await resolveInitialLocation();
    expect(result).toEqual({city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522});
  });

  it('TEST 3 — United Kingdom detected → London', async () => {
    mockDetectCountryCode.mockResolvedValue('GB');
    const result = await resolveInitialLocation();
    expect(result).toEqual({city: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278});
  });

  it('TEST 4 — United States detected → a representative US city (New York)', async () => {
    mockDetectCountryCode.mockResolvedValue('US');
    const result = await resolveInitialLocation();
    expect(result.city).toBe('New York');
    expect(result.country).toBe('United States');
  });

  it('TEST 5 — Algeria detected → Algiers (Algeria remains a fully valid, supported location)', async () => {
    mockDetectCountryCode.mockResolvedValue('DZ');
    const result = await resolveInitialLocation();
    expect(result).toEqual({city: 'Algiers', country: 'Algeria', latitude: 36.7538, longitude: 3.0588});
  });

  it('TEST 6 — an unknown/unsupported detected country → London (never Algiers)', async () => {
    mockDetectCountryCode.mockResolvedValue('ZZ');
    const result = await resolveInitialLocation();
    expect(result).toEqual({city: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278});
  });

  it('TEST 7 — detection unavailable/failed (resolves null) → London', async () => {
    mockDetectCountryCode.mockResolvedValue(null);
    const result = await resolveInitialLocation();
    expect(result).toEqual({city: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278});
  });

  it('TEST 8 — detection timeout (countryDetection.ts already resolves null on its own timeout) → London', async () => {
    mockDetectCountryCode.mockResolvedValue(null);
    const result = await resolveInitialLocation();
    expect(result.city).toBe('London');
  });
});

describe('resolveInitialLocation — never claims Algiers as the unconditional global default', () => {
  it('France/UK/unknown/failure never resolve to Algiers coordinates', async () => {
    for (const code of ['FR', 'GB', 'ZZ', null]) {
      mockDetectCountryCode.mockResolvedValue(code);
      const result = await resolveInitialLocation();
      expect(!(result.latitude === 36.7538 && result.longitude === 3.0588)).toBe(true);
    }
  });
});

describe('resolveInitialLocation — TEST 10: an automatic suggestion is never silently persisted', () => {
  it('resolving (with no saved location) does not write @hawa/selected-location', async () => {
    mockDetectCountryCode.mockResolvedValue('FR');

    await resolveInitialLocation();

    expect(await AsyncStorage.getItem('@hawa/selected-location')).toBeNull();
    expect(getSelectedLocation()).toBeNull();
  });
});
