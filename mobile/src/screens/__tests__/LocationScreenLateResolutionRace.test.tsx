import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, TextInput} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import LocationScreen from '../LocationScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {mapProvider} from '../../services/maps/mapProvider';
import {resolveInitialLocation} from '../../services/locationInitialization';
import type {MapPlace} from '../../services/maps/types';

// LOCATION DEFAULT MUST ALWAYS BE LONDON — section "explicit GPS/user action
// is not later overwritten by London": resolveInitialLocation() (saved
// location, else London) can genuinely take a moment to settle (reading
// AsyncStorage). If the user searches/selects/GPS's to a different city
// WHILE that initial resolution is still pending, the late-arriving London
// (or saved-location) suggestion must never overwrite her explicit choice —
// this is exactly what LocationScreen.tsx's `userChangedLocation` ref
// guards against. This file controls that timing directly (a manually
// resolved Promise) rather than relying on the real store's resolution
// happening to be slower than the user's own actions in a test environment.

jest.mock('../../services/locationInitialization', () => ({
  resolveInitialLocation: jest.fn(),
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

const mockResolveInitialLocation = resolveInitialLocation as jest.Mock;
const mockSearchPlaces = mapProvider.searchPlaces as jest.Mock;

const Stack = createNativeStackNavigator();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderLocationScreen() {
  const navigation = {navigate: jest.fn(), goBack: jest.fn()};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">
                {() => <LocationScreen navigation={navigation as never} route={{key: 'l', name: 'Location', params: undefined} as never} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return {renderer, navigation};
}

const settle = async (ticks = 5) => {
  for (let index = 0; index < ticks; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

const searchInput = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findByType(TextInput);

beforeEach(() => {
  mockResolveInitialLocation.mockReset();
  mockSearchPlaces.mockReset().mockResolvedValue([]);
  easeToCalls.length = 0;
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('A late-resolving initial suggestion never overwrites an explicit user action made while it was still pending', () => {
  it('searching and selecting a city BEFORE the (slow) initial London suggestion resolves keeps the searched city, not London', async () => {
    let releaseInitialResolution!: (place: MapPlace) => void;
    mockResolveInitialLocation.mockImplementation(
      () => new Promise<MapPlace>(resolve => {releaseInitialResolution = resolve;}),
    );

    const newYork: MapPlace = {city: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006};
    mockSearchPlaces.mockResolvedValue([newYork]);

    const {renderer} = await renderLocationScreen();
    // The initial resolution is still pending — the map/location card show
    // the "resolving" state, never a half-applied London.
    expect(textsOf(renderer)).not.toContain('London, United Kingdom');

    await act(async () => {
      searchInput(renderer).props.onChangeText('New York');
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    });
    await settle();

    const suggestion = renderer.root.findAll(
      node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(text => [text.props.children].flat(Infinity).join('').includes('New York')),
    )[0];
    await act(async () => {
      suggestion.props.onPress();
    });
    expect(textsOf(renderer)).toContain('New York, United States');

    // ONLY NOW does the slow initial suggestion (London) finally resolve —
    // it must be silently dropped, never overwriting the explicit choice.
    await act(async () => {
      releaseInitialResolution({city: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278});
    });
    await settle();

    expect(textsOf(renderer)).toContain('New York, United States');
    expect(textsOf(renderer)).not.toContain('London, United Kingdom');
  });
});
