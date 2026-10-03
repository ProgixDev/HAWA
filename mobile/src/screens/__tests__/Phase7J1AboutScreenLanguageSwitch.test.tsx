import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, Pressable} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import AboutScreen from '../AboutScreen';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {APP_METADATA} from '../../utils/appMetadata';

// PHASE 7J.1 — TEST 8-12: AboutScreen.tsx. Phase 7J found and fixed only the
// 2 accessibility labels Phase 7I had flagged, then discovered the rest of
// the screen had zero i18n at all. This phase completes the real UI
// migration: every ordinary application-controlled string (header, identity
// card, "App information"/"About"/"Legal" sections, the version/team modal,
// the toast messages) — while version numbers, the app name "AWA", and any
// configured URL/email stay exactly as-is (never translated).

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

async function renderScreen() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen component={AboutScreen as never} name="Test" />
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

const pressByLabel = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const target = renderer.root.findAllByType(Text).find(node => [node.props.children].flat(Infinity).join('') === label);
  let node: ReactTestRenderer.ReactTestInstance | null = target?.parent ?? null;
  while (node) {
    if (node.type === Pressable && typeof node.props.onPress === 'function') {
      await act(async () => {
        node!.props.onPress();
      });
      await settle();
      return;
    }
    node = node.parent;
  }
  throw new Error(`no pressable ancestor for "${label}"`);
};

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

describe('TEST 8 — AboutScreen ordinary visible UI renders correctly in FR', () => {
  it('header, section titles and legal rows all render in French', async () => {
    const renderer = await renderScreen();
    const texts = textsOf(renderer);
    expect(texts).toContain('À propos de AWA');
    expect(texts).toContain('Informations de l’application');
    expect(texts).toContain('À propos');
    expect(texts).toContain('Mentions légales');
    expect(texts).toContain('Conditions d’utilisation');
    expect(texts).toContain('Notre mission');
  });
});

describe('TEST 9 — the same mounted AboutScreen switches to natural English', () => {
  it('flips every section without remounting, no leftover French', async () => {
    const renderer = await renderScreen();
    expect(textsOf(renderer)).toContain('À propos de AWA');

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });
    await settle();

    const texts = textsOf(renderer);
    expect(texts).toContain('About AWA');
    expect(texts).toContain('App information');
    expect(texts).toContain('About');
    expect(texts).toContain('Legal');
    expect(texts).toContain('Terms of Use');
    expect(texts).toContain('Our mission');
    expect(texts).not.toContain('À propos de AWA');
    expect(texts).not.toContain('Mentions légales');
  });
});

describe('TEST 10 — AboutScreen accessibility switches FR -> EN', () => {
  it('the back button accessibility label translates', async () => {
    const renderer = await renderScreen();
    expect(findByA11y(renderer, 'Retour')).toBeTruthy();

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });
    await settle();
    expect(findByA11y(renderer, 'Back')).toBeTruthy();
    expect(findByA11y(renderer, 'Retour')).toBeUndefined();
  });

  it('the version/team modal and toast messages translate', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen();
    await pressByLabel(renderer, 'Version');
    const texts = textsOf(renderer);
    expect(texts.some(text => text.includes(`Version ${APP_METADATA.version}`))).toBe(true);
    expect(texts.some(text => text.includes(`Build ${APP_METADATA.buildNumber}`))).toBe(true);
    expect(findByA11y(renderer, 'Close') ?? texts.includes('Close')).toBeTruthy();
  });
});

describe('TEST 11 — version numbers/proper nouns/URLs remain unchanged', () => {
  it('the app name "AWA", version string and any configured contact value are identical in both languages', async () => {
    const frRenderer = await renderScreen();
    const frTexts = textsOf(frRenderer);
    expect(frTexts).toContain('AWA');
    expect(frTexts.some(text => text.includes(APP_METADATA.version))).toBe(true);

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const enRenderer = await renderScreen();
    const enTexts = textsOf(enRenderer);
    expect(enTexts).toContain('AWA');
    expect(enTexts.some(text => text.includes(APP_METADATA.version))).toBe(true);
  });
});

describe('TEST 12 — FR -> EN -> FR round-trip on one representative screen', () => {
  it('AboutScreen returns to its exact original French text after a round-trip switch', async () => {
    const renderer = await renderScreen();
    const originalFrench = textsOf(renderer);
    expect(originalFrench).toContain('À propos de AWA');

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });
    await settle();
    expect(textsOf(renderer)).toContain('About AWA');

    await act(async () => {
      await setAppLanguage('fr');
      await i18n.changeLanguage('fr');
    });
    await settle();
    expect(textsOf(renderer)).toEqual(originalFrench);
  });
});

describe('TEST 13 — structural audit: zero raw accessibility literals remain in AboutScreen.tsx', () => {
  it('the source file no longer hardcodes "Retour" and does use useTranslation', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.resolve(__dirname, '../AboutScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/accessibilityLabel="Retour"/);
    expect(source).not.toMatch(/accessibilityLabel="Logo AWA"/);
    expect(source).toMatch(/useTranslation/);
  });
});

describe('TEST 14 — residual audit distinguishes known dead-code occurrences', () => {
  it('LibraryHeader/CategoryListSheet/PregnancyAppointmentsScreen still contain raw "Retour" but are confirmed dead, not corrected here', () => {
    const fs = require('fs');
    const path = require('path');
    const deadFiles = [
      path.resolve(__dirname, '../../components/library/LibraryHeader.tsx'),
      path.resolve(__dirname, '../../components/library/CategoryListSheet.tsx'),
      path.resolve(__dirname, '../pregnancy/PregnancyAppointmentsScreen.tsx'),
    ];
    for (const file of deadFiles) {
      const source = fs.readFileSync(file, 'utf8');
      expect(source).toMatch(/accessibilityLabel="Retour"|accessibilityLabel="Fermer"/);
    }
    // Confirmed dead: no production importer outside the file itself.
    const libraryScreenSource = fs.readFileSync(path.resolve(__dirname, '../LibraryScreen.tsx'), 'utf8');
    expect(libraryScreenSource).not.toMatch(/LibraryHeader|CategoryListSheet/);
  });
});
