import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import LocationScreen from '../LocationScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {mapProvider, MapProviderError} from '../../services/maps/mapProvider';
import {loadMapStyle} from '../../services/maps/mapStyle';
import {localizedNameExpression} from '../../services/maps/mapLanguage';
import type {MapPlace, MapRequestOptions} from '../../services/maps/types';
import {getSelectedLocation, resetSelectedLocationForTests, setSelectedLocation} from '../../state/onboardingPreferences';
import {resetAppLanguageForTests, setAppLanguage, type AwaAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';

// The location screen follows the ACTIVE AWA language everywhere the provider can: the map's label layers (the served style is English),
// the search results and reverse geocoding (the request language), and the names of the place already selected (the neutral London
// default, a location saved by an older version, a result picked before a language switch) — re-asked from the provider in the new
// language WITHOUT moving the selected coordinates, persisting anything, or downloading the style again.

jest.mock('../../services/countryDetection', () => ({
  detectCountryCode: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../services/maps/mapStyle', () => ({
  loadMapStyle: jest.fn(async () => ({
    version: 8,
    sources: {},
    // a trimmed copy of the served style: an English-first label layer, a "{name}" layer and one that is not a name
    layers: [
      {id: 'City labels', type: 'symbol', layout: {'text-field': '{name:en}'}},
      {id: 'Road labels', type: 'symbol', layout: {'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']]}},
      {id: 'Housenumber', type: 'symbol', layout: {'text-field': '{housenumber}'}},
    ],
  })),
}));

jest.mock('../../services/maps/mapProvider', () => ({
  ...jest.requireActual('../../services/maps/mapProvider'),
  mapProvider: {
    searchPlaces: jest.fn(async () => []),
    reverseGeocode: jest.fn(async () => null),
    localizePlace: jest.fn(async (place: unknown) => place),
  },
}));

const mockEaseToCalls: unknown[] = [];
const mockMapProps: {current?: {onRegionDidChange?: (event: unknown) => void}} = {};
jest.mock('@maplibre/maplibre-react-native', () => {
  const ReactActual = require('react');
  const {Text: RNText} = require('react-native');
  return {
    __esModule: true,
    Camera: ReactActual.forwardRef(({initialViewState}: {initialViewState?: {center?: [number, number]}}, ref: React.Ref<unknown>) => {
      ReactActual.useImperativeHandle(ref, () => ({easeTo: (options: unknown) => { mockEaseToCalls.push(options); }}));
      return <RNText testID="camera-center">{JSON.stringify(initialViewState?.center ?? null)}</RNText>;
    }),
    Map: (props: {children?: React.ReactNode; mapStyle?: {layers?: Array<{layout: Record<string, unknown>}>}; onRegionDidChange?: (event: unknown) => void}) => {
      mockMapProps.current = props;
      return (
        <>
          <RNText testID="map-labels">{JSON.stringify(props.mapStyle?.layers?.map(layer => layer.layout['text-field']) ?? null)}</RNText>
          {props.children}
        </>
      );
    },
    UserLocation: () => null,
  };
});

const mockLocalize = mapProvider.localizePlace as jest.Mock;
const mockSearch = mapProvider.searchPlaces as jest.Mock;
const mockLoadMapStyle = loadMapStyle as jest.Mock;

const Stack = createNativeStackNavigator();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const settle = async () => {
  for (let index = 0; index < 12; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

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
                  <LocationScreen navigation={navigation as never} route={{key: 'l', name: 'Location', params: mode === 'edit' ? {mode: 'edit'} : undefined} as never} />
                )}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return {renderer, navigation};
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));
const searchValue = (renderer: ReactTestRenderer.ReactTestRenderer): string => renderer.root.findAllByType('TextInput' as never)[0].props.value as string;
const cameraCenter = (renderer: ReactTestRenderer.ReactTestRenderer) => JSON.parse(renderer.root.findByProps({testID: 'camera-center'}).props.children as string);
const mapLabels = (renderer: ReactTestRenderer.ReactTestRenderer) => JSON.parse(renderer.root.findByProps({testID: 'map-labels'}).props.children as string);

async function useLanguage(language: AwaAppLanguage) {
  await act(async () => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
  });
  await settle();
}

// What the provider answers for the London default, per language (the real answers, see mapProviderLocalization.test.ts)
const LONDON_NAMES: Record<string, {city: string; country: string}> = {
  fr: {city: 'Grand Londres', country: 'Royaume-Uni'},
  sq: {city: 'Londra', country: 'Mbretëria e Bashkuar'},
  ja: {city: 'グレーター・ロンドン', country: 'イギリス'},
  de: {city: 'Greater London', country: 'Vereinigtes Königreich'},
};
const answerLikeTheProvider = () =>
  mockLocalize.mockImplementation(async (place: MapPlace, options: MapRequestOptions) => {
    const names = LONDON_NAMES[String(options.language)];
    return names ? {...place, ...names, displayName: `${names.city}, ${names.country}`, language: String(options.language)} : place;
  });

beforeEach(async () => {
  mockEaseToCalls.length = 0;
  mockLocalize.mockReset().mockImplementation(async (place: unknown) => place);
  mockSearch.mockReset().mockResolvedValue([]);
  mockLoadMapStyle.mockClear();
  await resetSelectedLocationForTests();
  await resetAppLanguageForTests();
  await useLanguage('fr');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('the neutral London default follows the app language', () => {
  it('French: the search field and the location card show the French names — not "London, United Kingdom" — and the map does not move', async () => {
    answerLikeTheProvider();
    const {renderer} = await renderLocationScreen();

    expect(searchValue(renderer)).toBe('Grand Londres, Royaume-Uni');
    expect(textsOf(renderer)).toContain('Grand Londres, Royaume-Uni');
    expect(textsOf(renderer)).not.toContain('London, United Kingdom');
    expect(mockLocalize).toHaveBeenCalledTimes(1);
    expect(mockLocalize.mock.calls[0][1]).toMatchObject({language: 'fr'});
    expect(mockLocalize.mock.calls[0][0]).toMatchObject({latitude: 51.5074, longitude: -0.1278});
    expect(cameraCenter(renderer)).toEqual([-0.1278, 51.5074]); // [longitude, latitude], unchanged
    expect(mockEaseToCalls).toEqual([]);
  });

  it.each(['sq', 'ja'] as const)('%s: the same default, named by the provider in that language', async language => {
    answerLikeTheProvider();
    await useLanguage(language);
    const {renderer} = await renderLocationScreen();
    const names = LONDON_NAMES[language];
    expect(searchValue(renderer)).toBe(`${names.city}, ${names.country}`);
    expect(textsOf(renderer)).not.toContain('London, United Kingdom');
    expect(cameraCenter(renderer)).toEqual([-0.1278, 51.5074]);
  });

  it('English: the English literals ARE the names — the provider is not asked', async () => {
    await useLanguage('en');
    const {renderer} = await renderLocationScreen();
    expect(searchValue(renderer)).toBe('London, United Kingdom');
    expect(mockLocalize).not.toHaveBeenCalled();
  });

  it('while the names are being re-asked the English literal is not shown in the search field or the card', async () => {
    let release!: (place: MapPlace) => void;
    mockLocalize.mockImplementation(() => new Promise<MapPlace>(resolve => { release = resolve; }));
    const {renderer} = await renderLocationScreen();
    expect(searchValue(renderer)).toBe('');
    expect(textsOf(renderer)).not.toContain('London, United Kingdom');
    await act(async () => {
      release({city: 'Grand Londres', country: 'Royaume-Uni', latitude: 51.5074, longitude: -0.1278, language: 'fr'});
    });
    await settle();
    expect(searchValue(renderer)).toBe('Grand Londres, Royaume-Uni');
  });
});

describe('switching language while keeping the same location', () => {
  it('fr -> ja: the names change, the coordinates / camera / marker do not, the style is not downloaded again, the labels follow', async () => {
    answerLikeTheProvider();
    const {renderer} = await renderLocationScreen();
    expect(searchValue(renderer)).toBe('Grand Londres, Royaume-Uni');
    const frenchLabels = mapLabels(renderer);
    expect(frenchLabels[0]).toEqual(localizedNameExpression('fr'));
    expect(frenchLabels[1]).toEqual(localizedNameExpression('fr'));
    expect(frenchLabels[2]).toBe('{housenumber}');

    await useLanguage('ja');

    expect(searchValue(renderer)).toBe('グレーター・ロンドン, イギリス');
    expect(textsOf(renderer)).toContain('グレーター・ロンドン, イギリス');
    const lastCall = mockLocalize.mock.calls[mockLocalize.mock.calls.length - 1];
    expect(lastCall[1]).toMatchObject({language: 'ja'});
    expect(lastCall[0]).toMatchObject({latitude: 51.5074, longitude: -0.1278, language: 'fr'}); // the SAME coordinates went in
    expect(cameraCenter(renderer)).toEqual([-0.1278, 51.5074]);
    expect(mockEaseToCalls).toEqual([]);
    expect(mockLoadMapStyle).toHaveBeenCalledTimes(1);
    expect(mapLabels(renderer)[0]).toEqual(localizedNameExpression('ja'));
    expect(mapLabels(renderer)[1]).toEqual(localizedNameExpression('ja'));

    await useLanguage('sq');
    expect(searchValue(renderer)).toBe('Londra, Mbretëria e Bashkuar');
    expect(mapLabels(renderer)[0]).toEqual(localizedNameExpression('sq'));
    expect(mockLoadMapStyle).toHaveBeenCalledTimes(1);

    await useLanguage('en');
    expect(mapLabels(renderer)[0]).toBe('{name:en}'); // the served style, untouched
  });

  it('a name she typed is not overwritten by a late answer', async () => {
    let release!: (place: MapPlace) => void;
    mockLocalize.mockImplementation(() => new Promise<MapPlace>(resolve => { release = resolve; }));
    const {renderer} = await renderLocationScreen();
    await act(async () => {
      renderer.root.findAllByType('TextInput' as never)[0].props.onChangeText('Lyon');
    });
    await act(async () => {
      release({city: 'Grand Londres', country: 'Royaume-Uni', latitude: 51.5074, longitude: -0.1278, language: 'fr'});
    });
    await settle();
    expect(searchValue(renderer)).toBe('Lyon');
  });
});

describe('search and reverse geocoding use the active language', () => {
  // the search is debounced by 450 ms: real (short) waits, not fake timers, which leak into the next tests of this renderer setup
  const afterDebounce = () => act(async () => {
    await new Promise<void>(resolve => setTimeout(resolve, 520));
  });

  it('a search is sent with the app language, and again with the new one after a switch', async () => {
    await useLanguage('sq');
    const {renderer} = await renderLocationScreen();
    await act(async () => {
      renderer.root.findAllByType('TextInput' as never)[0].props.onChangeText('Munich');
    });
    await afterDebounce();
    expect(mockSearch).toHaveBeenLastCalledWith('Munich', expect.objectContaining({language: 'sq'}));
    mockSearch.mockClear();
    await useLanguage('ja');
    await afterDebounce();
    expect(mockSearch).toHaveBeenLastCalledWith('Munich', expect.objectContaining({language: 'ja'}));
  });

  it('dragging the map reverse-geocodes the new centre in the active language, and again in the new language after a switch', async () => {
    const mockReverse = mapProvider.reverseGeocode as jest.Mock;
    mockReverse.mockReset().mockResolvedValue({id: 'place.1', city: 'Chinatown', country: 'Royaume-Uni', latitude: 51.5117, longitude: -0.1305, language: 'fr'});
    const {renderer} = await renderLocationScreen();
    const drag = async (center: [number, number]) => {
      await act(async () => {
        mockMapProps.current?.onRegionDidChange?.({nativeEvent: {userInteraction: true, center}});
      });
      await act(async () => {
        await new Promise<void>(resolve => setTimeout(resolve, 650));
      });
    };
    await drag([-0.1305, 51.5117]);
    expect(mockReverse).toHaveBeenLastCalledWith(51.5117, -0.1305, {language: 'fr'});
    expect(textsOf(renderer)).toContain('Chinatown, Royaume-Uni'); // an untranslated proper name next to a localized country: the provider's own data
    mockReverse.mockResolvedValue({id: 'place.1', city: 'Chinatown', country: 'イギリス', latitude: 51.5117, longitude: -0.1305, language: 'ja'});
    await useLanguage('ja');
    await drag([-0.1305, 51.5117]);
    expect(mockReverse).toHaveBeenLastCalledWith(51.5117, -0.1305, {language: 'ja'});
    expect(textsOf(renderer)).toContain('Chinatown, イギリス');
  });

  it('a search that is superseded is aborted (the request is cancelled, not left running)', async () => {
    const signals: AbortSignal[] = [];
    mockSearch.mockImplementation(async (_query: string, options: MapRequestOptions) => {
      signals.push(options.signal as AbortSignal);
      return new Promise(() => {});
    });
    const {renderer} = await renderLocationScreen();
    const input = () => renderer.root.findAllByType('TextInput' as never)[0];
    await act(async () => { input().props.onChangeText('Mun'); });
    await afterDebounce();
    expect(signals).toHaveLength(1);
    expect(signals[0].aborted).toBe(false);
    await act(async () => { input().props.onChangeText('Munich'); });
    expect(signals[0].aborted).toBe(true);
  });
});

describe('failures and cancellation never break the screen', () => {
  it.each([
    ['offline', new MapProviderError('NETWORK')],
    ['invalid key', new MapProviderError('INVALID_KEY', 401)],
    ['HTTP 500', new MapProviderError('HTTP', 500)],
    ['cancelled', new MapProviderError('CANCELLED')],
    ['unexpected', new Error('boom')],
  ])('%s while re-asking the names: the names she already sees stay, the spinner stops, no error is shown', async (_label, error) => {
    mockLocalize.mockRejectedValue(error);
    const {renderer} = await renderLocationScreen();
    expect(searchValue(renderer)).toBe('London, United Kingdom');
    expect(textsOf(renderer)).toContain('London, United Kingdom');
    expect(textsOf(renderer)).not.toContain('Recherche du lieu…');
    expect(cameraCenter(renderer)).toEqual([-0.1278, 51.5074]);
  });

  it('no near match (the provider returns the place as it was): nothing changes and there is no request loop', async () => {
    const {renderer} = await renderLocationScreen();
    expect(searchValue(renderer)).toBe('London, United Kingdom');
    expect(mockLocalize).toHaveBeenCalledTimes(1);
  });

  it('leaving the screen aborts the pending request', async () => {
    let signal: AbortSignal | undefined;
    mockLocalize.mockImplementation((_place: unknown, options: MapRequestOptions) => {
      signal = options.signal;
      return new Promise(() => {});
    });
    const {renderer} = await renderLocationScreen();
    expect(signal?.aborted).toBe(false);
    act(() => {
      renderer.unmount();
    });
    expect(signal?.aborted).toBe(true);
  });

  it('a language switch while a request is pending aborts it and asks again in the new language', async () => {
    const signals: AbortSignal[] = [];
    const languages: string[] = [];
    mockLocalize.mockImplementation((_place: unknown, options: MapRequestOptions) => {
      signals.push(options.signal as AbortSignal);
      languages.push(String(options.language));
      return new Promise(() => {});
    });
    await renderLocationScreen();
    await useLanguage('ja');
    expect(languages).toEqual(['fr', 'ja']);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });
});

describe('a saved location', () => {
  const saved = {city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris'};

  it('is re-named in the current language for display, but nothing is written until she confirms', async () => {
    await setSelectedLocation(saved);
    await useLanguage('ja');
    mockLocalize.mockImplementation(async (place: MapPlace, options: MapRequestOptions) => ({...place, city: 'パリ', country: 'フランス', language: String(options.language)}));

    const {renderer} = await renderLocationScreen('edit');

    expect(searchValue(renderer)).toBe('パリ, フランス');
    expect(getSelectedLocation()).toEqual(saved); // the persisted record is untouched by a language switch
    expect(cameraCenter(renderer)).toEqual([2.3522, 48.8566]);
  });

  it('confirming saves the names she sees, with the SAME coordinates and timezone, and remembers their language', async () => {
    await setSelectedLocation(saved);
    await useLanguage('ja');
    mockLocalize.mockImplementation(async (place: MapPlace, options: MapRequestOptions) => ({...place, city: 'パリ', country: 'フランス', language: String(options.language)}));
    const {renderer, navigation} = await renderLocationScreen('edit');

    const confirm = renderer.root.find(
      node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(text => [text.props.children].flat(Infinity).join('') === '保存'),
    );
    await act(async () => {
      await confirm.props.onPress();
    });
    await settle();

    expect(getSelectedLocation()).toMatchObject({city: 'パリ', country: 'フランス', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris', language: 'ja'});
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('a place whose names are already in the current language is not asked again', async () => {
    await setSelectedLocation({...saved, language: 'fr'});
    const {renderer} = await renderLocationScreen('edit');
    expect(mockLocalize).not.toHaveBeenCalled();
    expect(searchValue(renderer)).toBe('Paris, France');
  });
});
