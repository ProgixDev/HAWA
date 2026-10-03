import AsyncStorage from '@react-native-async-storage/async-storage';

import {resolveInitialLocation} from '../locationInitialization';
import {detectCountryCode} from '../countryDetection';
import {
  getSelectedLocation,
  resetSelectedLocationForTests,
  setSelectedLocation,
} from '../../state/onboardingPreferences';

// LocationScreen.tsx's initialization hierarchy, post real-device audit:
// a saved location always wins; otherwise ALWAYS the neutral London
// default — IP-based country detection (countryDetection.ts) is
// deliberately NOT consulted for this initial suggestion (an international,
// English-first app can't silently guess a representative city — Paris,
// Algiers, Dubai… — from an IP address before she's done anything). GPS,
// search and tapping the map remain the only ways to move off London; see
// config/countryLocations.ts's header comment.
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
    mockDetectCountryCode.mockResolvedValue('GB'); // would never matter even if it were called

    const result = await resolveInitialLocation();

    expect(result).toEqual({city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522});
    expect(mockDetectCountryCode).not.toHaveBeenCalled();
  });

  it('TEST 9 — a saved location (New York) wins over the London default', async () => {
    await setSelectedLocation({city: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006});

    const result = await resolveInitialLocation();

    expect(result.city).toBe('New York');
    expect(result.country).toBe('United States');
    expect(mockDetectCountryCode).not.toHaveBeenCalled();
  });
});

describe('resolveInitialLocation — no saved location: always London, IP/country detection is never consulted', () => {
  it('TEST 2 — no saved location → London, United Kingdom, unconditionally', async () => {
    const result = await resolveInitialLocation();
    expect(result).toEqual({city: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278});
    expect(mockDetectCountryCode).not.toHaveBeenCalled();
  });

  it('TEST 5 — an IP result of Algeria does NOT change the initial suggestion away from London (detection is never called)', async () => {
    mockDetectCountryCode.mockResolvedValue('DZ');
    const result = await resolveInitialLocation();
    expect(result).toEqual({city: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278});
    expect(mockDetectCountryCode).not.toHaveBeenCalled();
  });

  it('a mocked detection result for any other country also has zero effect, since the function is never called', async () => {
    for (const code of ['FR', 'GB', 'US', 'ZZ', null]) {
      mockDetectCountryCode.mockResolvedValue(code);
      const result = await resolveInitialLocation();
      expect(result).toEqual({city: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278});
    }
    expect(mockDetectCountryCode).not.toHaveBeenCalled();
  });
});

describe('resolveInitialLocation — never claims Algiers as the unconditional global default', () => {
  it('the no-saved-location result never resolves to Algiers coordinates', async () => {
    const result = await resolveInitialLocation();
    expect(!(result.latitude === 36.7538 && result.longitude === 3.0588)).toBe(true);
  });
});

describe('resolveInitialLocation — TEST 10: an automatic suggestion is never silently persisted', () => {
  it('resolving (with no saved location) does not write @hawa/selected-location', async () => {
    await resolveInitialLocation();

    expect(await AsyncStorage.getItem('@hawa/selected-location')).toBeNull();
    expect(getSelectedLocation()).toBeNull();
  });
});
