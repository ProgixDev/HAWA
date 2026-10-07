import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import PersonalInformationScreen from '../PersonalInformationScreen';
import GeneralHealthScreen from '../GeneralHealthScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';

// Phase 7E — PersonalInformationScreen and GeneralHealthScreen must follow
// the app language exactly like every other migrated screen, while every
// real user value (name/email/phone/country/birth date/height/weight/blood
// type/health goal) stays byte-identical across a language switch — only the
// surrounding chrome (labels, section titles, sheet copy) is translated.

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

const navigation = {goBack: jest.fn(), navigate: jest.fn()} as never;
const route = {key: 'k', name: 'test', params: undefined} as never;

beforeEach(async () => {
  await resetAppLanguageForTests();
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's "French:" tests were written against the old French default and
  // never set a language explicitly (every "English:" test already does).
  // Pinning French here preserves every test's original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('TEST — PersonalInformationScreen French/English copy', () => {
  it('French: section titles, labels and real user values render together', () => {
    const renderer = renderDirect(<PersonalInformationScreen navigation={navigation} route={route} />);
    const texts = textsOf(renderer);
    expect(texts).toContain('Informations personnelles');
    expect(texts).toContain('Informations de base');
    expect(texts).toContain('Préférences personnelles');
    expect(texts).toContain('Pays');
    // Real stored values (default seed data) render untranslated.
    expect(texts).toContain('Benali');
    expect(texts).toContain('amina.benali@email.com');
    expect(texts).toContain('Algérie');
  });

  it('English: labels translate, stored real values stay in their original form, no French chrome leaks', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(<PersonalInformationScreen navigation={navigation} route={route} />);
    const texts = textsOf(renderer);
    expect(texts).toContain('Personal information');
    expect(texts).toContain('Basic information');
    expect(texts).toContain('Personal preferences');
    expect(texts).not.toContain('Informations de base');
    // Real stored values are untouched by the language switch (no data migration).
    expect(texts).toContain('Benali');
    expect(texts).toContain('amina.benali@email.com');
    expect(texts).toContain('Algérie');
  });

  it('the "Langue" row reflects the current app language, not the stale stored profile.language field', async () => {
    const frRenderer = renderDirect(<PersonalInformationScreen navigation={navigation} route={route} />);
    expect(textsOf(frRenderer)).toContain('Français');

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const enRenderer = renderDirect(<PersonalInformationScreen navigation={navigation} route={route} />);
    expect(textsOf(enRenderer)).toContain('English');
    expect(textsOf(enRenderer)).not.toContain('Français');
  });
});

describe('TEST — GeneralHealthScreen French/English copy', () => {
  it('French: section titles and the default BMI classification render', () => {
    const renderer = renderDirect(<GeneralHealthScreen navigation={navigation} route={route} />);
    const texts = textsOf(renderer);
    expect(texts).toContain('Santé générale');
    expect(texts).toContain('Informations physiques');
    expect(texts).toContain('Informations médicales');
    // Default profile (165cm/60kg) classifies as a healthy BMI.
    expect(texts).toContain('Normal');
  });

  it('English: section titles and the BMI classification translate, height/weight/blood type values stay identical', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(<GeneralHealthScreen navigation={navigation} route={route} />);
    const texts = textsOf(renderer);
    expect(texts).toContain('General health');
    expect(texts).toContain('Physical information');
    expect(texts).toContain('Medical information');
    expect(texts).toContain('Normal'); // same English word, confirms the stable id round-trips
    expect(texts).not.toContain('Santé générale');
    // Real tracked values (default seed data) are untouched.
    expect(texts.some(text => text.includes('165'))).toBe(true);
    expect(texts.some(text => text.includes('60'))).toBe(true);
    expect(texts).toContain('O+');
  });

  it('the health goal (a stored French value with no separate technical id) stays in French in both languages', async () => {
    const frRenderer = renderDirect(<GeneralHealthScreen navigation={navigation} route={route} />);
    expect(textsOf(frRenderer)).toContain('Rester en forme et en bonne santé');

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const enRenderer = renderDirect(<GeneralHealthScreen navigation={navigation} route={route} />);
    expect(textsOf(enRenderer)).toContain('Rester en forme et en bonne santé');
  });
});

describe('TEST — a runtime FR→EN switch updates visible copy without a restart', () => {
  it('PersonalInformationScreen re-renders in English after changeLanguage, same mounted instance', async () => {
    const renderer = renderDirect(<PersonalInformationScreen navigation={navigation} route={route} />);
    expect(textsOf(renderer)).toContain('Informations de base');

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });

    expect(textsOf(renderer)).toContain('Basic information');
    expect(textsOf(renderer)).not.toContain('Informations de base');
  });

  it('GeneralHealthScreen re-renders in English after changeLanguage, same mounted instance', async () => {
    const renderer = renderDirect(<GeneralHealthScreen navigation={navigation} route={route} />);
    expect(textsOf(renderer)).toContain('Informations physiques');

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });

    expect(textsOf(renderer)).toContain('Physical information');
    expect(textsOf(renderer)).not.toContain('Informations physiques');
  });
});
