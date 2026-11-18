import AsyncStorage from '@react-native-async-storage/async-storage';

import {regionFromLocaleTags, resolveInitialLocation} from '../locationInitialization';
import {detectCountryCode} from '../countryDetection';
import {readDeviceLocaleTags} from '../../utils/deviceLanguage';
import {representativeLocationForCountryCode} from '../../config/countryLocations';
import {
  getSelectedLocation,
  resetSelectedLocationForTests,
  setSelectedLocation,
} from '../../state/onboardingPreferences';

// LocationScreen.tsx's initialization hierarchy: a saved location always wins; otherwise NOTHING is selected (there is no default city).
// The map only opens on the region of the phone's own locale — read locally, never from the IP (countryDetection.ts is not consulted) —
// and on a neutral world view when the phone gives no usable region. A place is only ever chosen by GPS, search or the map.
jest.mock('../countryDetection', () => ({
  detectCountryCode: jest.fn(),
}));
jest.mock('../../utils/deviceLanguage', () => ({
  readDeviceLocaleTags: jest.fn(),
}));

const mockDetectCountryCode = detectCountryCode as jest.Mock;
const mockReadDeviceLocaleTags = readDeviceLocaleTags as jest.Mock;

const WORLD_VIEW = {center: [10, 25], zoom: 1.5};

beforeEach(async () => {
  await resetSelectedLocationForTests();
  mockDetectCountryCode.mockReset();
  mockReadDeviceLocaleTags.mockReset().mockResolvedValue([]);
});

describe('resolveInitialLocation — saved location has highest priority', () => {
  it('a saved location (Paris) is returned as the selected place, and neither IP detection nor the device locale decides anything', async () => {
    await setSelectedLocation({city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522});
    mockReadDeviceLocaleTags.mockResolvedValue(['en-GB']);

    const result = await resolveInitialLocation();

    expect(result.place).toEqual({city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522});
    expect(result.center).toEqual([2.3522, 48.8566]);
    expect(mockDetectCountryCode).not.toHaveBeenCalled();
  });

  it('a saved location (New York) wins over the phone region', async () => {
    await setSelectedLocation({city: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006});
    mockReadDeviceLocaleTags.mockResolvedValue(['fr-DZ']);

    const result = await resolveInitialLocation();

    expect(result.place?.city).toBe('New York');
    expect(result.place?.country).toBe('United States');
  });
});

describe('resolveInitialLocation — no saved location: nothing is selected', () => {
  it('no region on the phone → no place, neutral world view (never a city)', async () => {
    const result = await resolveInitialLocation();
    expect(result).toEqual({place: null, ...WORLD_VIEW});
    expect(mockDetectCountryCode).not.toHaveBeenCalled();
  });

  it('an unreadable device locale (it throws) → no place, neutral world view', async () => {
    mockReadDeviceLocaleTags.mockRejectedValue(new Error('no locale'));
    expect(await resolveInitialLocation()).toEqual({place: null, ...WORLD_VIEW});
  });

  it('a region that is not in the listed countries → world view, still no place', async () => {
    mockReadDeviceLocaleTags.mockResolvedValue(['en-ZZ']);
    expect(await resolveInitialLocation()).toEqual({place: null, ...WORLD_VIEW});
  });

  it('a phone region (fr-DZ) only chooses where the map OPENS (country level) — the place stays null', async () => {
    mockReadDeviceLocaleTags.mockResolvedValue(['fr-DZ']);
    const result = await resolveInitialLocation();
    const algeria = representativeLocationForCountryCode('DZ');
    expect(result.place).toBeNull();
    expect(result.center).toEqual([algeria?.longitude, algeria?.latitude]);
    expect(result.zoom).toBe(5);
  });

  it('London is only ever shown when the phone region really is the United Kingdom, and even then as a map view, never as a selection', async () => {
    mockReadDeviceLocaleTags.mockResolvedValue(['en-GB']);
    const uk = await resolveInitialLocation();
    expect(uk.place).toBeNull();
    expect(uk.center).toEqual([-0.1278, 51.5074]);

    mockReadDeviceLocaleTags.mockResolvedValue(['fr-FR']);
    const france = await resolveInitialLocation();
    expect(france.center).not.toEqual([-0.1278, 51.5074]);

    expect((await resolveInitialLocation()).center).not.toEqual([-0.1278, 51.5074]);
  });

  it('IP/country detection is never called, whatever it would answer', async () => {
    mockDetectCountryCode.mockResolvedValue('DZ');
    await resolveInitialLocation();
    expect(mockDetectCountryCode).not.toHaveBeenCalled();
  });
});

describe('regionFromLocaleTags', () => {
  it.each([
    [['fr-DZ'], 'DZ'],
    [['fr_dz'], 'DZ'],
    [['zh-Hans-CN'], 'CN'],
    [['en', 'ar-SA'], 'SA'], // the first tag WITH a region
    [['fr'], null],
    [[], null],
    [['zh-Hans'], null], // a script is not a region
  ])('%j → %s', (tags, expected) => {
    expect(regionFromLocaleTags(tags)).toBe(expected);
  });
});

describe('representativeLocationForCountryCode — no default city', () => {
  it('an unknown, empty or missing code has no location', () => {
    expect(representativeLocationForCountryCode('ZZ')).toBeNull();
    expect(representativeLocationForCountryCode('')).toBeNull();
    expect(representativeLocationForCountryCode(null)).toBeNull();
    expect(representativeLocationForCountryCode(undefined)).toBeNull();
  });
});

describe('resolveInitialLocation — an automatic suggestion is never silently persisted', () => {
  it('resolving (with no saved location, with a phone region) does not write @hawa/selected-location', async () => {
    mockReadDeviceLocaleTags.mockResolvedValue(['fr-DZ']);
    await resolveInitialLocation();

    expect(await AsyncStorage.getItem('@hawa/selected-location')).toBeNull();
    expect(getSelectedLocation()).toBeNull();
  });
});
