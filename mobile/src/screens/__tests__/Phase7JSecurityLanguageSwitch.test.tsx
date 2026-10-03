import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import PrivacySecurityScreen from '../PrivacySecurityScreen';
import DiscreetLauncherScreen from '../DiscreetLauncherScreen';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';

// PHASE 7J — TEST 1/2: PrivacySecurityScreen and DiscreetLauncherScreen, both
// confirmed by Phase 7I to have ZERO i18n, now fully localized. Representative
// proof that a FR -> EN switch on the SAME mounted instance updates every
// visible string, with no remounting required.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const settle = async () => {
  for (let index = 0; index < 10; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderScreen(Component: React.ComponentType<any>) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen component={Component as never} name="Test" />
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

beforeEach(async () => {
  await resetAppLanguageForTests();
  await AsyncStorage.clear();
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('TEST 1 — PrivacySecurityScreen FR -> EN on the same mounted instance', () => {
  it('every visible string flips to English without remounting, no "Confidentialité & Sécurité" left behind', async () => {
    const renderer = await renderScreen(PrivacySecurityScreen);
    const frenchTexts = textsOf(renderer);
    expect(frenchTexts).toContain('Confidentialité & Sécurité');
    expect(frenchTexts).toContain('Code PIN');
    expect(frenchTexts).toContain('Apparence discrète');

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });
    await settle();

    const englishTexts = textsOf(renderer);
    expect(englishTexts).toContain('Privacy & Security');
    expect(englishTexts).toContain('PIN code');
    expect(englishTexts).toContain('Discreet appearance');
    expect(englishTexts).not.toContain('Confidentialité & Sécurité');
    expect(englishTexts).not.toContain('Code PIN');
  });
});

describe('TEST 2 — DiscreetLauncherScreen FR -> EN on the same mounted instance', () => {
  it('every visible string flips to English, no "Apparence discrète" left behind', async () => {
    const renderer = await renderScreen(DiscreetLauncherScreen);
    const frenchTexts = textsOf(renderer);
    expect(frenchTexts).toContain('Apparence discrète');
    expect(frenchTexts.some(text => text.includes('Ceci change uniquement'))).toBe(true);

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });
    await settle();

    const englishTexts = textsOf(renderer);
    expect(englishTexts).toContain('Discreet appearance');
    expect(englishTexts.some(text => text.includes('This only changes'))).toBe(true);
    expect(englishTexts).not.toContain('Apparence discrète');
  });
});
