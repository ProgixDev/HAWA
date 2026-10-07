import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import SplashScreen from '../SplashScreen';
import WelcomeScreen from '../WelcomeScreen';
import NameOnboardingScreen from '../NameOnboardingScreen';
import SpiritualPreferencesScreen from '../SpiritualPreferencesScreen';
import SummaryScreen from '../SummaryScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import {
  resetSelectedLocationForTests,
  setActiveObjective,
  setCyclePreferences,
  setSelectedLocation,
  setSpiritualMarkersEnabled,
} from '../../state/onboardingPreferences';
import {getCachedPersonalInformation, updatePersonalInformation} from '../../state/personalInformationStore';
import i18n from '../../i18n';

// Phase 7B — the first-run chrome (Splash, Welcome, Name onboarding, Spiritual
// preferences, Summary) must follow the app language exactly like every other
// migrated screen, while user-entered data (the preferred name, the saved
// location) must never be translated and the onboarding navigation/branching
// logic must stay byte-for-byte unchanged by a language switch.

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

function renderDirect(element: React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>{element}</AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const Stack = createNativeStackNavigator();
async function renderSummary() {
  const navigation = {navigate: jest.fn(), goBack: jest.fn(), push: jest.fn()};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">
                {() => <SummaryScreen navigation={navigation as never} route={{key: 's', name: 'Summary'} as never} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  for (let index = 0; index < 5; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  return {renderer, navigation};
}

beforeEach(async () => {
  await resetAppLanguageForTests();
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's "French:" tests were written against the old French default and
  // never set a language explicitly (every "English:" test already does).
  // Pinning French here preserves every test's original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  await resetSelectedLocationForTests();
  await setActiveObjective('cycle');
  setSpiritualMarkersEnabled(false);
  setCyclePreferences({lastPeriodStart: new Date('2026-09-01T12:00:00'), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('TEST 1 — SplashScreen follows the app language', () => {
  it('shows the French slogan and logo label by default', () => {
    const renderer = renderDirect(<SplashScreen navigation={{replace: jest.fn()} as never} route={{} as never} />);
    expect(textsOf(renderer).join(' ')).toContain('L’application de cycle');
    expect(renderer.root.findByProps({accessibilityLabel: 'Logo AWA'})).toBeTruthy();
  });

  it('shows the English slogan and logo label once the app language is switched', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(<SplashScreen navigation={{replace: jest.fn()} as never} route={{} as never} />);
    expect(textsOf(renderer).join(' ')).toContain('The cycle app');
    expect(renderer.root.findByProps({accessibilityLabel: 'AWA logo'})).toBeTruthy();
  });
});

describe('TEST 2 — WelcomeScreen follows the app language and navigation is unaffected', () => {
  it('shows French chrome and "Commencer" starts the objective flow', () => {
    const navigation = {navigate: jest.fn()};
    const renderer = renderDirect(<WelcomeScreen navigation={navigation as never} route={{} as never} />);
    expect(textsOf(renderer)).toContain('Bienvenue');
    expect(textsOf(renderer)).toContain('J’ai déjà un compte');
    act(() => {
      renderer.root.findByProps({accessibilityLabel: 'Commencer'}).props.onPress();
    });
    expect(navigation.navigate).toHaveBeenCalledWith('Objective');
  });

  it('shows English chrome and "Get started" still starts the objective flow', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const navigation = {navigate: jest.fn()};
    const renderer = renderDirect(<WelcomeScreen navigation={navigation as never} route={{} as never} />);
    expect(textsOf(renderer)).toContain('Welcome');
    expect(textsOf(renderer)).toContain('I already have an account');
    expect(textsOf(renderer)).not.toContain('Bienvenue');
    act(() => {
      renderer.root.findByProps({accessibilityLabel: 'Get started'}).props.onPress();
    });
    expect(navigation.navigate).toHaveBeenCalledWith('Objective');
  });
});

describe('TEST 3 — NameOnboardingScreen never translates the user’s own name', () => {
  it('a typed French-looking name is preserved verbatim in the English preview', async () => {
    await updatePersonalInformation({preferredName: ''});
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const navigation = {navigate: jest.fn()};
    const renderer = renderDirect(<NameOnboardingScreen navigation={navigation as never} route={{} as never} />);

    const input = renderer.root.findByProps({accessibilityLabel: 'First name or nickname'});
    act(() => {
      input.props.onChangeText('Fatima');
    });

    expect(textsOf(renderer).some(text => text.includes('Fatima'))).toBe(true);
    expect(textsOf(renderer)).toContain('What should AWA\ncall you?');
    expect(getCachedPersonalInformation().preferredName).not.toBe('Fatima'); // not saved until "Next" is pressed
  });
});

describe('TEST 4 — SpiritualPreferencesScreen chrome and edit-mode save label follow the language', () => {
  it('French: edit mode shows "Enregistrer"', () => {
    const renderer = renderDirect(
      <SpiritualPreferencesScreen navigation={{navigate: jest.fn(), goBack: jest.fn()} as never} route={{params: {mode: 'edit'}} as never} />,
    );
    expect(textsOf(renderer)).toContain('Enregistrer');
  });

  it('English: onboarding mode shows "Next" (reusing common keys, not a duplicate translation)', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(
      <SpiritualPreferencesScreen navigation={{navigate: jest.fn(), goBack: jest.fn()} as never} route={{params: undefined} as never} />,
    );
    expect(textsOf(renderer)).toContain('Would you like to enable\nspiritual markers?');
    expect(textsOf(renderer)).toContain('Next');
  });
});

describe('TEST 5 — SummaryScreen follows the app language, never mutates or translates stored data', () => {
  it('French: shows the objective label via the shared objectives.* namespace and "Tout est prêt"', async () => {
    const {renderer} = await renderSummary();
    expect(textsOf(renderer)).toContain('Tout est prêt');
    expect(textsOf(renderer)).toContain('Suivre mon cycle');
  });

  it('English: shows translated chrome, and a saved city/country stays exactly as stored (never translated)', async () => {
    await setSelectedLocation({city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522});
    setSpiritualMarkersEnabled(true);
    await setAppLanguage('en');
    await i18n.changeLanguage('en');

    const {renderer} = await renderSummary();
    expect(textsOf(renderer)).toContain('All set');
    expect(textsOf(renderer)).toContain('Track my cycle');
    expect(textsOf(renderer)).toContain('Paris, France');
    expect(textsOf(renderer)).not.toContain('Tout est prêt');
  });

  it('a "missing" field still renders with the translated "Not provided" fallback after a language switch', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    setSpiritualMarkersEnabled(true); // location row shown, but never set -> feminine "Not provided" fallback
    const {renderer} = await renderSummary();
    expect(textsOf(renderer)).toContain('Not provided');
  });
});
