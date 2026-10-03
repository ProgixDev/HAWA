import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, Pressable} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {TermsOfUseScreen, PrivacyPolicyScreen} from '../LegalDocumentScreen';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';

// PHASE 7J.1 — TEST 5-7: LegalDocumentScreen.tsx. Discovered architecture:
// this is NOT an approved legal document — every section's own body text
// says the real content is still pending legal validation (a provisional
// placeholder, reachable only from AboutScreen's "Terms of Use"/"Privacy
// Policy" rows). Per the explicit LEGAL CONTENT TRANSLATION GAP instruction,
// only the screen's own chrome (back button, title, provisional-notice
// banner) is localized; the placeholder section titles/bodies stay French,
// unchanged, since no approved English legal version exists in this repo.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
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

describe('TEST 5 — LegalDocumentScreen application chrome renders correctly in FR', () => {
  it('TermsOfUseScreen shows the French title, back label, and provisional notice', async () => {
    const renderer = await renderScreen(TermsOfUseScreen);
    expect(textsOf(renderer)).toContain('Conditions d’utilisation');
    expect(textsOf(renderer)).toContain('Contenu provisoire — validation juridique requise avant publication.');
    expect(findByA11y(renderer, 'Retour')).toBeTruthy();
  });

  it('PrivacyPolicyScreen shows the French title and provisional notice', async () => {
    const renderer = await renderScreen(PrivacyPolicyScreen);
    expect(textsOf(renderer)).toContain('Politique de confidentialité');
    expect(textsOf(renderer)).toContain('Contenu provisoire — validation juridique requise avant publication.');
  });
});

describe('TEST 6 — LegalDocumentScreen application chrome switches to EN', () => {
  it('TermsOfUseScreen flips to "Terms of Use" / "Back" / the English provisional notice', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(TermsOfUseScreen);
    const texts = textsOf(renderer);
    expect(texts).toContain('Terms of Use');
    expect(texts).toContain('Provisional content — legal review required before publication.');
    expect(findByA11y(renderer, 'Back')).toBeTruthy();
    expect(texts).not.toContain('Conditions d’utilisation');
  });

  it('PrivacyPolicyScreen flips to "Privacy Policy"', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(PrivacyPolicyScreen);
    expect(textsOf(renderer)).toContain('Privacy Policy');
  });
});

describe('TEST 7 — legal body handling matches the discovered architecture (no approved EN version exists)', () => {
  it('the placeholder section content stays in French in English UI — not translated, not invented', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(TermsOfUseScreen);
    const texts = textsOf(renderer);
    // The chrome is English, but the (explicitly provisional, not-yet-
    // validated) section body is deliberately left exactly as it is in the
    // repository today — a real LEGAL CONTENT TRANSLATION GAP, not a bug.
    expect(texts).toContain('Objet');
    expect(texts.some(text => text.includes('structure provisoire des conditions d’utilisation'))).toBe(true);
  });
});

describe('TEST 13 — structural audit: zero raw "Retour" remains in LegalDocumentScreen.tsx', () => {
  it('the source file no longer hardcodes the French back label', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.resolve(__dirname, '../LegalDocumentScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/accessibilityLabel="Retour"/);
    expect(source).toMatch(/useTranslation/);
  });
});
