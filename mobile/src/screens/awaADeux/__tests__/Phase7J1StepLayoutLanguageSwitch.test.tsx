import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, Pressable} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import AwaADeuxBenefitsScreen from '../AwaADeuxBenefitsScreen';
import AwaADeuxPartnerConnectedScreen from '../AwaADeuxPartnerConnectedScreen';
import {setAwaADeuxPartnerName, getAwaADeuxPartnerName} from '../../../state/awaADeuxPartnerStore';
import {resetAppLanguageForTests, setAppLanguage} from '../../../state/themePreferences';
import {fr} from '../../../i18n/locales/fr';
import {en} from '../../../i18n/locales/en';
import {es} from '../../../i18n/locales/es';
import i18n from '../../../i18n';

// PHASE 7J.1 — TEST 1-4: AwaADeuxStepLayout.tsx, confirmed by Phase 7J's own
// residual audit to hardcode `accessibilityLabel="Retour"` despite being a
// SHARED layout reused by every AWA à deux owner-flow screen (and, discovered
// during this phase's reachability trace, by the Managed-Profile daughter
// onboarding flow too). Fixed by reusing the existing `common.back` key —
// never a new duplicate.

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

const findByA11y = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.type === Pressable && node.props.accessibilityLabel === label)[0];

beforeEach(async () => {
  await resetAppLanguageForTests();
  await AsyncStorage.clear();
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's tests assert a French-first render before switching to English,
  // which was a safe assumption back when French was the default. Pinning
  // French explicitly here preserves every test's original intent (FR -> EN
  // switching mechanics) without depending on which language is the current
  // app-wide default.
  await setAppLanguage('fr');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('TEST 1 — AwaADeuxStepLayout back accessibility is French in FR', () => {
  it('shows accessibilityLabel="Retour" on AwaADeuxBenefitsScreen', async () => {
    const renderer = await renderScreen(AwaADeuxBenefitsScreen);
    expect(findByA11y(renderer, 'Retour')).toBeTruthy();
  });
});

describe('TEST 2 — the same mounted AwaADeuxStepLayout switches to English "Back"', () => {
  it('flips from "Retour" to "Back" on a live language change, no remount', async () => {
    const renderer = await renderScreen(AwaADeuxBenefitsScreen);
    expect(findByA11y(renderer, 'Retour')).toBeTruthy();

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });
    await settle();

    expect(findByA11y(renderer, 'Back')).toBeTruthy();
    expect(findByA11y(renderer, 'Retour')).toBeUndefined();
  });
});

describe('TEST 3 — AWA à deux / AWA Together terminology remains correct', () => {
  it('en.ts says "AWA Together" and fr.ts says "AWA à deux", never swapped', () => {
    const enJson = JSON.stringify(en);
    const frJson = JSON.stringify(fr);
    expect(enJson).toContain('AWA Together');
    expect(enJson).not.toContain('AWA à deux');
    expect(frJson).toContain('AWA à deux');
    expect(frJson).not.toContain('AWA Together');
  });

  // LOCALIZATION FIX — the Profile entry point (awaADeuxSectionTitle/
  // awaADeuxTitle) used to say "AWA EN PAREJA"/"AWA en pareja" while every
  // other occurrence inside the feature itself (pairing, invitation, FAQ,
  // partner screens — 24+ occurrences) said "AWA Pareja"/"AWA PAREJA". Now
  // consistently "AWA Pareja" everywhere, and never "AWA à deux"/"AWA
  // Together" (those stay FR/EN-only).
  it('es.ts consistently says "AWA Pareja" everywhere, never the old "AWA en pareja" variant or the FR/EN names', () => {
    const esJson = JSON.stringify(es);
    expect(esJson).toContain('AWA Pareja');
    expect(esJson).not.toContain('AWA en pareja');
    expect(esJson).not.toContain('AWA EN PAREJA');
    expect(esJson).not.toContain('AWA à deux');
    expect(esJson).not.toContain('AWA Together');
  });
});

describe('TEST 4 — dynamic partner/user data remains unchanged across a language switch', () => {
  it('the partner name on AwaADeuxPartnerConnectedScreen stays byte-identical in storage and on screen', async () => {
    await setAwaADeuxPartnerName('Khadija').saved;
    const renderer = await renderScreen(AwaADeuxPartnerConnectedScreen);
    expect(textsOf(renderer).some(text => text.includes('Khadija'))).toBe(true);

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });
    await settle();

    expect(textsOf(renderer).some(text => text.includes('Khadija'))).toBe(true);
    expect(getAwaADeuxPartnerName()).toBe('Khadija');
    expect(findByA11y(renderer, 'Back')).toBeTruthy();
  });
});

describe('Structural audit — zero raw "Retour" accessibility label remains in AwaADeuxStepLayout.tsx', () => {
  it('the source file no longer hardcodes the French literal', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.resolve(__dirname, '../AwaADeuxStepLayout.tsx'), 'utf8');
    expect(source).not.toMatch(/accessibilityLabel="Retour"/);
    expect(source).toMatch(/useTranslation/);
  });
});
