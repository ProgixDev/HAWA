import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, Pressable} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import VaginalRingArticleScreen from '../VaginalRingArticleScreen';
import {resetAppLanguageForTests, setAppLanguage} from '../../../state/themePreferences';
import i18n from '../../../i18n';
import {fr} from '../../../i18n/locales/fr';
import {en} from '../../../i18n/locales/en';
import {getPrivacySecuritySettings, loadSecurityPreferences} from '../../../state/securityPreferences';

// PHASE 7J — TEST 21 (representative article-screen accessibility FR -> EN),
// TEST 22 (article body remains untouched/deferred), TEST 23 (AWA Together
// terminology regression), TEST 24 (a representative language switch never
// mutates persisted data — here, the security preferences store), plus the
// required structural audit over all 73 bespoke article screens' SOURCE
// files (not just the one rendered here), confirming the known raw
// accessibility literals no longer appear in any of them.

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

describe('TEST 21 — representative article-screen accessibility FR -> EN', () => {
  it('back/bookmark/share accessibility labels translate on VaginalRingArticleScreen', async () => {
    const frRenderer = await renderScreen(VaginalRingArticleScreen);
    expect(findByA11y(frRenderer, 'Retour')).toBeTruthy();
    expect(findByA11y(frRenderer, 'Ajouter aux favoris')).toBeTruthy();
    expect(findByA11y(frRenderer, 'Partager')).toBeTruthy();

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const enRenderer = await renderScreen(VaginalRingArticleScreen);
    expect(findByA11y(enRenderer, 'Back')).toBeTruthy();
    expect(findByA11y(enRenderer, 'Add to favorites')).toBeTruthy();
    expect(findByA11y(enRenderer, 'Share')).toBeTruthy();
    expect(findByA11y(enRenderer, 'Retour')).toBeUndefined();
  });
});

describe('TEST 22 — article body localization (updated by Phase 7L.2)', () => {
  it('the long-form body text now reads in English, since this article was translated in Phase 7L.2', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(VaginalRingArticleScreen);
    const texts = textsOf(renderer);
    // Phase 7J only translated chrome/accessibility and deliberately left
    // the body in French (see the original comment here, now stale).
    // Phase 7L.2 translated VaginalRingArticleScreen's full body — this
    // assertion was updated to match that, not a regression.
    expect(texts.some(text => /vaginal ring/i.test(text))).toBe(true);
    expect(texts.some(text => /anneau vaginal/i.test(text))).toBe(false);
  });
});

describe('TEST 23 — AWA à deux / AWA Together terminology regression', () => {
  it('en.ts never says "AWA à deux" and fr.ts never says "AWA Together"', () => {
    const enJson = JSON.stringify(en);
    const frJson = JSON.stringify(fr);
    expect(enJson).not.toContain('AWA à deux');
    expect(frJson).not.toContain('AWA Together');
    expect(enJson).toContain('AWA Together');
    expect(frJson).toContain('AWA à deux');
  });
});

describe('TEST 24 — a representative language switch never mutates persisted data', () => {
  it('security preferences stay byte-identical across a French -> English render', async () => {
    await loadSecurityPreferences();
    const before = getPrivacySecuritySettings();

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    await loadSecurityPreferences();

    expect(getPrivacySecuritySettings()).toEqual(before);
  });
});

describe('Structural audit — zero raw accessibility literals remain in any of the 73 bespoke article screens', () => {
  it('no file under src/screens/library/*ArticleScreen.tsx contains the known raw literals', () => {
    const dir = path.resolve(__dirname, '..');
    const files = fs.readdirSync(dir).filter(name => /ArticleScreen\.tsx$/.test(name));
    expect(files.length).toBeGreaterThanOrEqual(73);

    const offenders: string[] = [];
    const rawPatterns = [
      /accessibilityLabel="Retour"/,
      /accessibilityLabel="Partager"/,
      /accessibilityLabel="Favori"/,
      /accessibilityLabel="Ajouter aux favoris"/,
      /'Retirer des favoris'\s*:\s*'Ajouter aux favoris'/,
    ];

    for (const file of files) {
      const source = fs.readFileSync(path.join(dir, file), 'utf8');
      if (rawPatterns.some(pattern => pattern.test(source))) {
        offenders.push(file);
      }
      // Every file must now actually use translation, not just happen to
      // pass the raw-literal check.
      if (!/useTranslation/.test(source)) {
        offenders.push(`${file} (no useTranslation import)`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
