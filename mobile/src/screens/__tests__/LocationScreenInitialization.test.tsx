import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, TextInput} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import Geolocation from '@react-native-community/geolocation';

import LocationScreen from '../LocationScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {mapProvider} from '../../services/maps/mapProvider';
import {detectCountryCode} from '../../services/countryDetection';
import {
  getSelectedLocation,
  resetSelectedLocationForTests,
  setSelectedLocation,
} from '../../state/onboardingPreferences';

// Component-level coverage for LocationScreen.tsx's international
// initialization (TEST 11-14 of the audited spec, plus the headline success
// criteria rendered end-to-end): saved location wins, country detection
// suggests a representative city, London is the neutral fallback, searching
// moves the map, confirming persists, the GPS button still works, and
// MapLibre's [longitude, latitude] coordinate order is never reversed.

jest.mock('../../services/countryDetection', () => ({
  detectCountryCode: jest.fn(),
}));

jest.mock('../../services/maps/mapStyle', () => ({
  loadMapStyle: jest.fn(async () => ({version: 8, sources: {}, layers: []})),
}));

jest.mock('../../services/maps/mapProvider', () => ({
  ...jest.requireActual('../../services/maps/mapProvider'),
  mapProvider: {
    searchPlaces: jest.fn(async () => []),
    reverseGeocode: jest.fn(async () => null),
  },
}));

// A richer local MapLibre mock (overrides jest.setup.js's simplified one for
// this file only) that actually renders the Camera's initialViewState.center
// so it can be asserted on, and records every imperative easeTo() pan — real
// MapLibre only ever applies initialViewState on first mount (subsequent
// moves happen exclusively via the camera ref's easeTo(), as LocationScreen.
// tsx already does), so a later move must be asserted via easeTo, not by
// re-reading initialViewState. jest.setup.js's own header comment on its
// simplified mock confirms per-file jest.mock() calls take full precedence.
const easeToCalls: Array<{center: [number, number]; zoom: number; duration: number}> = [];
jest.mock('@maplibre/maplibre-react-native', () => {
  const ReactActual = require('react');
  const {Text: RNText} = require('react-native');
  return {
    __esModule: true,
    Camera: ReactActual.forwardRef(({initialViewState}: {initialViewState?: {center?: [number, number]}}, ref: React.Ref<unknown>) => {
      ReactActual.useImperativeHandle(ref, () => ({
        easeTo: (options: {center: [number, number]; zoom: number; duration: number}) => {
          easeToCalls.push(options);
        },
      }));
      return <RNText testID="camera-center">{JSON.stringify(initialViewState?.center ?? null)}</RNText>;
    }),
    Map: ({children}: {children?: React.ReactNode}) => children ?? null,
    UserLocation: () => null,
  };
});

const mockDetectCountryCode = detectCountryCode as jest.Mock;
const mockSearchPlaces = mapProvider.searchPlaces as jest.Mock;
const mockGetCurrentPosition = Geolocation.getCurrentPosition as jest.Mock;
const mockRequestAuthorization = Geolocation.requestAuthorization as jest.Mock;

const Stack = createNativeStackNavigator();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderLocationScreen(mode: 'onboarding' | 'edit' = 'onboarding') {
  const navigation = {navigate: jest.fn(), goBack: jest.fn()};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">
                {() => (
                  <LocationScreen
                    navigation={navigation as never}
                    route={{key: 'l', name: 'Location', params: mode === 'edit' ? {mode: 'edit'} : undefined} as never}
                  />
                )}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  for (let index = 0; index < 10; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  return {renderer, navigation};
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

const cameraCenter = (renderer: ReactTestRenderer.ReactTestRenderer): [number, number] | null =>
  JSON.parse(renderer.root.findByProps({testID: 'camera-center'}).props.children as string);

const searchInput = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findByType(TextInput);

beforeEach(async () => {
  await resetSelectedLocationForTests();
  mockDetectCountryCode.mockReset();
  mockSearchPlaces.mockReset().mockResolvedValue([]);
  mockGetCurrentPosition.mockReset();
  mockRequestAuthorization.mockReset();
  easeToCalls.length = 0;
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('LocationScreen — saved location vs. country detection', () => {
  it('a saved Paris opens directly on Paris', async () => {
    await setSelectedLocation({city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522});
    mockDetectCountryCode.mockResolvedValue('GB');

    const {renderer} = await renderLocationScreen('edit');

    expect(textsOf(renderer)).toContain('Paris, France');
    expect(cameraCenter(renderer)).toEqual([2.3522, 48.8566]);
    expect(mockDetectCountryCode).not.toHaveBeenCalled();
  });

  it('no saved location + France detected opens on Paris', async () => {
    mockDetectCountryCode.mockResolvedValue('FR');

    const {renderer} = await renderLocationScreen();

    expect(textsOf(renderer)).toContain('Paris, France');
    expect(cameraCenter(renderer)).toEqual([2.3522, 48.8566]);
  });

  it('no saved location + detection unavailable opens on London, not Algiers', async () => {
    mockDetectCountryCode.mockResolvedValue(null);

    const {renderer} = await renderLocationScreen();

    expect(textsOf(renderer)).toContain('London, United Kingdom');
    expect(cameraCenter(renderer)).toEqual([-0.1278, 51.5074]);
  });
});

describe('TEST 11/12 — searching and confirming another city', () => {
  it('selecting a search result moves the map and updates the location card; confirming persists it', async () => {
    mockDetectCountryCode.mockResolvedValue(null); // starts on London
    const newYork = {city: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006};
    mockSearchPlaces.mockResolvedValue([newYork]);

    const {renderer} = await renderLocationScreen();
    expect(textsOf(renderer)).toContain('London, United Kingdom');

    await act(async () => {
      searchInput(renderer).props.onChangeText('New York');
    });
    await act(async () => {
      jest.advanceTimersByTime?.(500);
      await new Promise(resolve => setTimeout(resolve, 500));
    });
    for (let index = 0; index < 5; index += 1) {
      await act(async () => {
        await Promise.resolve();
      });
    }

    const suggestion = renderer.root.findAll(
      node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(text => [text.props.children].flat(Infinity).join('').includes('New York')),
    )[0];
    await act(async () => {
      suggestion.props.onPress();
    });

    expect(textsOf(renderer)).toContain('New York, United States');
    // The map was already mounted on the initial (London) suggestion, so the
    // move to New York happens via the camera ref's easeTo() — exactly like
    // real MapLibre, initialViewState only ever applies on first mount.
    expect(easeToCalls.at(-1)?.center).toEqual([-74.006, 40.7128]);

    const confirmButton = renderer.root.findAll(
      node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(text => [text.props.children].flat(Infinity).join('') === 'Suivant'),
    )[0];
    await act(async () => {
      await confirmButton.props.onPress();
    });

    expect(getSelectedLocation()).toMatchObject({city: 'New York', country: 'United States'});
  });
});

describe('TEST 10 (component level) — the initial suggestion is not persisted merely by mounting', () => {
  it('opening the screen on a France-detected suggestion never writes @hawa/selected-location', async () => {
    mockDetectCountryCode.mockResolvedValue('FR');

    await renderLocationScreen();

    expect(getSelectedLocation()).toBeNull();
  });
});

describe('TEST 13 — the GPS button remains functional', () => {
  it('tapping "Utiliser ma position" still requests permission and centers on the device position', async () => {
    mockDetectCountryCode.mockResolvedValue(null);
    mockRequestAuthorization.mockImplementation((success: () => void) => success());
    mockGetCurrentPosition.mockImplementation((success: (position: {coords: {latitude: number; longitude: number}}) => void) => {
      success({coords: {latitude: 45.5019, longitude: -73.5674}}); // Montréal
    });
    (mapProvider.reverseGeocode as jest.Mock).mockResolvedValue({
      city: 'Montréal',
      country: 'Canada',
      latitude: 45.5019,
      longitude: -73.5674,
    });

    const {renderer} = await renderLocationScreen();

    const gpsButton = renderer.root.findByProps({accessibilityLabel: 'Utiliser ma position'});
    await act(async () => {
      await gpsButton.props.onPress();
    });
    for (let index = 0; index < 5; index += 1) {
      await act(async () => {
        await Promise.resolve();
      });
    }

    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);
    expect(textsOf(renderer)).toContain('Montréal, Canada');
  });
});

describe('TEST 14 — MapLibre coordinate order stays [longitude, latitude]', () => {
  it('the London fallback camera center is [longitude, latitude], never [latitude, longitude]', async () => {
    mockDetectCountryCode.mockResolvedValue(null);

    const {renderer} = await renderLocationScreen();

    const center = cameraCenter(renderer);
    // London: latitude 51.5074, longitude -0.1278 — a reversed order would
    // put the (positive) latitude first and the (negative) longitude second.
    expect(center).toEqual([-0.1278, 51.5074]);
    expect(center?.[0]).toBeLessThan(0);
    expect(center?.[1]).toBeGreaterThan(0);
  });
});
