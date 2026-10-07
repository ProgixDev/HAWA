import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, Pressable} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {TermsOfUseScreen, PrivacyPolicyScreen, TERMS, PRIVACY} from '../LegalDocumentScreen';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';

// PHASE 7J.1 — TEST 5-7: LegalDocumentScreen.tsx. Discovered architecture:
// this is NOT an approved legal document — every section's own body text
// says the real content is still pending legal validation (a provisional
// placeholder, reachable only from AboutScreen's "Terms of Use"/"Privacy
// Policy" rows).
//
// TERMS & PRIVACY FR/EN/ES LOCALIZATION (supersedes the original Phase 7J.1
// decision below TEST 7): the placeholder body itself is now translated —
// faithfully, not newly drafted — into English and Spanish, so it follows
// the app language exactly like the chrome does, with no fallback to French
// for en/es. TEST 7 below was rewritten accordingly (its original
// "stays in French" expectation is now stale, superseded by this decision);
// TEST 8-12 are new.

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

describe('TEST 7 — legal body now follows the app language (EN), with no fallback to French', () => {
  it('TermsOfUseScreen renders the English placeholder body, not the French one', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(TermsOfUseScreen);
    const texts = textsOf(renderer);
    expect(texts).toContain('Purpose');
    expect(texts.some(text => text.includes('provisional structure of AWA’s terms of use'))).toBe(true);
    expect(texts).not.toContain('Objet');
    expect(texts.some(text => text.includes('structure provisoire des conditions d’utilisation'))).toBe(false);
  });

  it('PrivacyPolicyScreen renders the English placeholder body, not the French one', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(PrivacyPolicyScreen);
    const texts = textsOf(renderer);
    expect(texts).toContain('Data concerned');
    expect(texts).not.toContain('Données concernées');
  });
});

describe('TEST 8 — legal body renders in Spanish, with no fallback to French or English', () => {
  it('TermsOfUseScreen renders the Spanish placeholder body', async () => {
    await setAppLanguage('es');
    await i18n.changeLanguage('es');
    const renderer = await renderScreen(TermsOfUseScreen);
    const texts = textsOf(renderer);
    expect(texts).toContain('Objeto');
    expect(texts.some(text => text.includes('estructura provisional de las condiciones de uso'))).toBe(true);
    expect(texts).not.toContain('Objet');
    expect(texts).not.toContain('Purpose');
  });

  it('PrivacyPolicyScreen renders the Spanish placeholder body', async () => {
    await setAppLanguage('es');
    await i18n.changeLanguage('es');
    const renderer = await renderScreen(PrivacyPolicyScreen);
    const texts = textsOf(renderer);
    expect(texts).toContain('Datos tratados');
    expect(texts).not.toContain('Données concernées');
    expect(texts).not.toContain('Data concerned');
  });
});

describe('TEST 9 — structural parity: FR/EN/ES have the same number of sections, in the same order', () => {
  const LANGUAGES = ['fr', 'en', 'es'] as const;

  it('Terms: identical section count across fr/en/es, never silently losing a section in one language', () => {
    for (const language of LANGUAGES) {
      expect(TERMS[language]).toHaveLength(TERMS.fr.length);
    }
  });

  it('Privacy: identical section count across fr/en/es, never silently losing a section in one language', () => {
    for (const language of LANGUAGES) {
      expect(PRIVACY[language]).toHaveLength(PRIVACY.fr.length);
    }
  });

  it('Terms: every language has a non-empty title and body for each positional section (no blank/missing translation)', () => {
    for (const language of LANGUAGES) {
      TERMS[language].forEach(section => {
        expect(section.title.length).toBeGreaterThan(0);
        expect(section.body.length).toBeGreaterThan(0);
      });
    }
  });

  it('Privacy: every language has a non-empty title and body for each positional section (no blank/missing translation)', () => {
    for (const language of LANGUAGES) {
      PRIVACY[language].forEach(section => {
        expect(section.title.length).toBeGreaterThan(0);
        expect(section.body.length).toBeGreaterThan(0);
      });
    }
  });

  it('Terms and Privacy both keep their last section as the contact section, in every language (positional order preserved)', () => {
    expect(TERMS.fr[TERMS.fr.length - 1].title).toBe('Contact');
    expect(TERMS.en[TERMS.en.length - 1].title).toBe('Contact');
    expect(TERMS.es[TERMS.es.length - 1].title).toBe('Contacto');
    expect(PRIVACY.fr[PRIVACY.fr.length - 1].title).toBe('Contact confidentialité');
    expect(PRIVACY.en[PRIVACY.en.length - 1].title).toBe('Privacy contact');
    expect(PRIVACY.es[PRIVACY.es.length - 1].title).toBe('Contacto de privacidad');
  });
});

describe('TEST 10 — runtime switching FR -> EN -> ES -> FR updates the mounted legal body each time', () => {
  it('TermsOfUseScreen body text updates on every switch, on the same mounted instance', async () => {
    const renderer = await renderScreen(TermsOfUseScreen);
    expect(textsOf(renderer)).toContain('Objet');

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });
    await settle();
    let texts = textsOf(renderer);
    expect(texts).toContain('Purpose');
    expect(texts).not.toContain('Objet');

    await act(async () => {
      await setAppLanguage('es');
      await i18n.changeLanguage('es');
    });
    await settle();
    texts = textsOf(renderer);
    expect(texts).toContain('Objeto');
    expect(texts).not.toContain('Purpose');

    await act(async () => {
      await setAppLanguage('fr');
      await i18n.changeLanguage('fr');
    });
    await settle();
    texts = textsOf(renderer);
    expect(texts).toContain('Objet');
    expect(texts).not.toContain('Objeto');
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
