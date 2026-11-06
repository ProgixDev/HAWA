import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {PermissionsAndroid, Platform, Text, TextInput} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import LocationScreen from '../LocationScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {mapProvider} from '../../services/maps/mapProvider';
import {getSelectedLocation, resetSelectedLocationForTests} from '../../state/onboardingPreferences';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';

// "Use my location" (the crosshair in the search field): permission, position, reverse geocoding, the search field, the selected-location
// card, and a clear message for a refusal / a disabled location service / a timeout.

jest.mock('../../services/countryDetection', () => ({detectCountryCode: jest.fn(async () => null)}));
jest.mock('../../services/maps/mapStyle', () => ({loadMapStyle: jest.fn(async () => ({version: 8, sources: {}, layers: []}))}));
jest.mock('../../services/maps/mapProvider', () => ({
  ...jest.requireActual('../../services/maps/mapProvider'),
  mapProvider: {
    searchPlaces: jest.fn(async () => []),
    reverseGeocode: jest.fn(),
    localizePlace: jest.fn(async (place: unknown) => place),
  },
}));
jest.mock('@react-native-community/geolocation', () => ({
  __esModule: true,
  default: {getCurrentPosition: jest.fn(), requestAuthorization: jest.fn(), setRNConfiguration: jest.fn()},
}));
jest.mock('@maplibre/maplibre-react-native', () => {
  const ReactActual = require('react');
  return {
    __esModule: true,
    Camera: ReactActual.forwardRef((_props: unknown, ref: React.Ref<unknown>) => {
      ReactActual.useImperativeHandle(ref, () => ({easeTo: () => {}}));
      return null;
    }),
    Map: (props: {children?: React.ReactNode}) => {
      (globalThis as {__mapProps?: unknown}).__mapProps = props;
      return props.children ?? null;
    },
    UserLocation: () => null,
  };
});

const mapProps = () => (globalThis as {__mapProps?: {onRegionDidChange?: (event: unknown) => void}}).__mapProps;
const geolocation = Geolocation as unknown as {getCurrentPosition: jest.Mock; requestAuthorization: jest.Mock};
const reverseGeocode = mapProvider.reverseGeocode as jest.Mock;

const Stack = createNativeStackNavigator();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const PARIS = {id: 'p1', city: 'Paris', country: 'France', latitude: 48.85, longitude: 2.35, language: 'fr'};

async function renderScreen() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">
                {() => <LocationScreen navigation={{navigate: jest.fn(), goBack: jest.fn()} as never} route={{key: 'l', name: 'Location'} as never} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await flush();
  return renderer;
}

async function flush() {
  for (let index = 0; index < 12; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));
const locateButton = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => node.props.accessibilityLabel === i18n.t('location.useMyLocation') && typeof node.props.onPress === 'function')[0];
const searchValue = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(TextInput)[0].props.value as string;

async function pressLocate(renderer: ReactTestRenderer.ReactTestRenderer) {
  await act(async () => {
    locateButton(renderer).props.onPress();
  });
  await flush();
}

const grantPermission = () => geolocation.requestAuthorization.mockImplementation((ok: () => void) => ok());
const position = () => geolocation.getCurrentPosition.mockImplementation((ok: (p: unknown) => void) => ok({coords: {latitude: 48.85, longitude: 2.35}}));
const failWith = (code: number) => geolocation.getCurrentPosition.mockImplementation((_ok: unknown, fail: (e: unknown) => void) => fail({code, message: 'x'}));

beforeEach(async () => {
  jest.clearAllMocks();
  await resetSelectedLocationForTests();
  await resetAppLanguageForTests();
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  reverseGeocode.mockResolvedValue(null);
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  Object.defineProperty(Platform, 'OS', {value: 'ios', configurable: true});
  await i18n.changeLanguage('fr');
});

describe('LocationScreen — "use my location"', () => {
  it('reads the position, reverse-geocodes it, and fills the search field and the selected-location card', async () => {
    grantPermission();
    position();
    const renderer = await renderScreen();
    reverseGeocode.mockResolvedValue(PARIS);

    await pressLocate(renderer);

    expect(reverseGeocode).toHaveBeenCalledWith(48.85, 2.35, expect.anything());
    expect(searchValue(renderer)).toBe('Paris, France');
    const texts = textsOf(renderer);
    expect(texts).toContain('Localisation sélectionnée');
    expect(texts).toContain('Paris, France');
    expect(texts).toContain('Cette position sera utilisée pour calculer tes horaires de prière.');
  });

  it('a refusal shows a clear message and leaves manual search available', async () => {
    geolocation.requestAuthorization.mockImplementation((_ok: unknown, fail: () => void) => fail());
    const renderer = await renderScreen();

    await pressLocate(renderer);

    expect(textsOf(renderer)).toContain(i18n.t('location.gps.permissionDeniedError'));
    expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
    expect(renderer.root.findAllByType(TextInput)[0].props.editable).not.toBe(false);
  });

  it('a timeout, and a disabled location service, each get their own message', async () => {
    grantPermission();
    failWith(3);
    const renderer = await renderScreen();
    await pressLocate(renderer);
    expect(textsOf(renderer)).toContain('La localisation a pris trop de temps. Vérifie ton réseau ou ton GPS, puis réessaie.');

    failWith(2);
    await pressLocate(renderer);
    expect(textsOf(renderer)).toContain(i18n.t('location.gps.positionUnavailable'));
  });

  it('Android: granting only the approximate location is enough (Android 12+ "approximate" choice)', async () => {
    Object.defineProperty(Platform, 'OS', {value: 'android', configurable: true});
    jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false);
    jest.spyOn(PermissionsAndroid, 'requestMultiple').mockResolvedValue({
      'android.permission.ACCESS_FINE_LOCATION': 'denied',
      'android.permission.ACCESS_COARSE_LOCATION': 'granted',
    } as never);
    position();
    const renderer = await renderScreen();
    reverseGeocode.mockResolvedValue(PARIS);

    await pressLocate(renderer);

    expect(searchValue(renderer)).toBe('Paris, France');
  });

  it('the saved location uses the exact GPS fix, not the centre of the locality the provider returned', async () => {
    grantPermission();
    position();
    const renderer = await renderScreen();
    reverseGeocode.mockResolvedValue({...PARIS, latitude: 48.8, longitude: 2.3});

    await pressLocate(renderer);
    const next = renderer.root.findAll(node => node.props.label === i18n.t('location.next') && typeof node.props.onPress === 'function')[0];
    await act(async () => {
      await next.props.onPress();
    });

    expect(getSelectedLocation()).toEqual(expect.objectContaining({city: 'Paris', latitude: 48.85, longitude: 2.35}));
  });
});

describe('LocationScreen — one selection, kept in sync', () => {
  const type = async (renderer: ReactTestRenderer.ReactTestRenderer, value: string) => {
    await act(async () => {
      renderer.root.findAllByType(TextInput)[0].props.onChangeText(value);
    });
    await act(async () => {
      await new Promise<void>(resolve => setTimeout(resolve, 520));
    });
  };

  it('a picked search result is not replaced by the map reporting its own camera move as a user drag', async () => {
    const lyon = {id: 'l1', city: 'Lyon', country: 'France', latitude: 45.76, longitude: 4.84, language: 'fr'};
    (mapProvider.searchPlaces as jest.Mock).mockResolvedValue([lyon]);
    reverseGeocode.mockResolvedValue({id: 'x', city: 'Villeurbanne', country: 'France', latitude: 45.77, longitude: 4.88, language: 'fr'});
    const renderer = await renderScreen();

    await type(renderer, 'Lyon');
    const suggestion = renderer.root.findAll(node => typeof node.props.onPress === 'function' && node.findAll(n => Array.isArray(n.props.children) && n.props.children.join('') === 'Lyon, France').length > 0)[0];
    await act(async () => {
      suggestion.props.onPress();
    });
    // the end of the app's own camera move, flagged as a user interaction (seen on a real phone)
    await act(async () => {
      mapProps()?.onRegionDidChange?.({nativeEvent: {userInteraction: true, center: [4.84, 45.76]}});
    });
    await act(async () => {
      await new Promise<void>(resolve => setTimeout(resolve, 650));
    });

    expect(reverseGeocode).not.toHaveBeenCalled();
    expect(searchValue(renderer)).toBe('Lyon, France');
    expect(textsOf(renderer)).toContain('Lyon, France');
    expect(textsOf(renderer)).not.toContain('Villeurbanne, France');
  });
});
