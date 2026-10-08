import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import LocationScreen from '../LocationScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {detectCountryCode} from '../../services/countryDetection';
import {
  getSelectedLocation,
  resetSelectedLocationForTests,
  setSelectedLocation,
} from '../../state/onboardingPreferences';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';

// Phase 7A — LocationScreen.tsx's UI chrome (TEST 1/2) must follow the app
// language exactly like every other migrated screen, while the location
// initialization architecture (saved location wins, otherwise always
// London — IP/country detection is never consulted) and any already-
// selected/saved location (TEST 12) must never be affected by a language
// switch — a language is a display preference, never a reason to mutate or
// re-derive location data.

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

jest.mock('@maplibre/maplibre-react-native', () => {
  const ReactActual = require('react');
  const {Text: RNText} = require('react-native');
  return {
    __esModule: true,
    Camera: ReactActual.forwardRef(({initialViewState}: {initialViewState?: {center?: [number, number]}}, ref: React.Ref<unknown>) => {
      ReactActual.useImperativeHandle(ref, () => ({easeTo: () => {}}));
      return <RNText testID="camera-center">{JSON.stringify(initialViewState?.center ?? null)}</RNText>;
    }),
    Map: ({children}: {children?: React.ReactNode}) => children ?? null,
    UserLocation: () => null,
  };
});

const mockDetectCountryCode = detectCountryCode as jest.Mock;

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

beforeEach(async () => {
  await resetSelectedLocationForTests();
  await resetAppLanguageForTests();
  // PHASE 7M: the app's default language is now English (not French) — TEST
  // 1 below asserts French chrome specifically (it's testing the mechanic,
  // not the default itself — TEST 2 already covers English). Pinning French
  // explicitly here preserves that original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  mockDetectCountryCode.mockReset().mockResolvedValue(null); // London, deterministic
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('TEST 1 — French LocationScreen', () => {
  it('shows French chrome by default', async () => {
    const {renderer} = await renderLocationScreen();
    const texts = textsOf(renderer);

    expect(texts).toContain('Où te trouves-tu ?');
    expect(texts).toContain('Active ta localisation pour des horaires de prière et des rappels précis.');
    expect(texts).toContain('Suivant');
    expect(renderer.root.findByProps({accessibilityLabel: 'Retour'})).toBeTruthy();
    expect(renderer.root.findByProps({placeholder: 'Rechercher une ville'})).toBeTruthy();
    expect(renderer.root.findByProps({accessibilityLabel: 'Utiliser ma position'})).toBeTruthy();
  });
});

describe('TEST 2 — English LocationScreen', () => {
  it('shows English chrome once the app language is switched, with no known hardcoded French chrome left', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');

    const {renderer} = await renderLocationScreen();
    const texts = textsOf(renderer);

    expect(texts).toContain('Where are you located?');
    expect(texts).toContain('Turn on your location for accurate prayer times and reminders.');
    expect(texts).toContain('Next');
    expect(renderer.root.findByProps({accessibilityLabel: 'Back'})).toBeTruthy();
    expect(renderer.root.findByProps({placeholder: 'Search for a city'})).toBeTruthy();
    expect(renderer.root.findByProps({accessibilityLabel: 'Use my location'})).toBeTruthy();

    // No known hardcoded French LocationScreen chrome remains.
    expect(texts).not.toContain('Où te trouves-tu ?');
    expect(texts).not.toContain('Suivant');
    expect(texts).not.toContain('Enregistrer');
  });

  it('the "Save" wording appears in edit mode in English', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    await setSelectedLocation({city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522});

    const {renderer} = await renderLocationScreen('edit');

    expect(textsOf(renderer)).toContain('Save');
    expect(textsOf(renderer)).not.toContain('Enregistrer');
  });
});

describe('TEST 12 — a language switch never mutates location data', () => {
  it('a saved location’s coordinates and persisted fields stay exactly the same across a French ↔ English switch', async () => {
    const paris = {city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris'};
    await setSelectedLocation(paris);
    const before = getSelectedLocation();

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    expect(getSelectedLocation()).toEqual(before);

    await setAppLanguage('fr');
    await i18n.changeLanguage('fr');
    expect(getSelectedLocation()).toEqual(before);
  });

  it('rendering the screen in English still displays the saved (untranslated) city/country data as-is', async () => {
    await setSelectedLocation({city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522});
    await setAppLanguage('en');
    await i18n.changeLanguage('en');

    const {renderer} = await renderLocationScreen('edit');

    // The saved place name is DATA, never translated — "Paris, France" stays
    // exactly as stored, even though the surrounding chrome is now English.
    expect(textsOf(renderer)).toContain('Paris, France');
  });
});

// LOCATION DEFAULT MUST ALWAYS BE LONDON — the app language is a UI
// preference, never evidence of geographic location (no FR→France/Algeria,
// no ES→Spain, no EN→United Kingdom inference). These guard the two halves
// of that rule explicitly for all three shipped languages, extending TEST 1/
// 2/12 above (which only exercised FR/EN) to also cover Spanish.
describe('No saved location → London, unconditionally, in every shipped language', () => {
  it.each(['en', 'fr', 'es', 'it'] as const)('AWA language = %s + no saved location → London, United Kingdom', async language => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);

    const {renderer} = await renderLocationScreen();

    expect(textsOf(renderer)).toContain('London, United Kingdom');
    expect(mockDetectCountryCode).not.toHaveBeenCalled();
  });
});

describe('A saved location (Annaba, Algeria) wins over London, in every shipped language', () => {
  const annaba = {city: 'Annaba', country: 'Algeria', latitude: 36.9, longitude: 7.7667};

  it.each(['en', 'fr', 'es', 'it'] as const)('AWA language = %s + saved Annaba → Annaba, Algeria (never reset to London)', async language => {
    await setSelectedLocation(annaba);
    await setAppLanguage(language);
    await i18n.changeLanguage(language);

    const {renderer} = await renderLocationScreen('edit');

    expect(textsOf(renderer)).toContain('Annaba, Algeria');
    expect(textsOf(renderer)).not.toContain('London, United Kingdom');
  });
});

describe('An invalid/corrupt app-language value never affects the location fallback', () => {
  it('a runtime-invalid language value still resolves no-saved-location to London', async () => {
    // Deliberately bypasses the AwaAppLanguage type to simulate a corrupted
    // runtime value (e.g. a future/unknown value from an old install) — the
    // location-resolution path has zero dependency on the language value at
    // all, so this must behave exactly like any other language.
    await setAppLanguage('xx-not-a-real-language' as never);

    const {renderer} = await renderLocationScreen();

    expect(textsOf(renderer)).toContain('London, United Kingdom');
    expect(mockDetectCountryCode).not.toHaveBeenCalled();
  });

  it('a runtime-invalid language value still lets a saved location win', async () => {
    await setSelectedLocation({city: 'Annaba', country: 'Algeria', latitude: 36.9, longitude: 7.7667});
    await setAppLanguage('xx-not-a-real-language' as never);

    const {renderer} = await renderLocationScreen('edit');

    expect(textsOf(renderer)).toContain('Annaba, Algeria');
  });
});
