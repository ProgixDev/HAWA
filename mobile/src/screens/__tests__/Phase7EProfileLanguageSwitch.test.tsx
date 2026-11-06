import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import PersonalInformationScreen from '../PersonalInformationScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {updatePersonalInformation} from '../../state/personalInformationStore';

// Phase 7E — PersonalInformationScreen must follow
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

// The stores no longer ship fabricated defaults (they start "not provided"),
// so the "real user values stay untouched across a language switch" tests
// seed an explicit synthetic profile instead of relying on a built-in one.
const seedSyntheticProfile = async () => {
  await updatePersonalInformation({
    lastName: 'Benali',
    email: 'amina.benali@email.com',
    country: 'Algérie',
  });
};

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
  it('French: section titles, labels and real user values render together', async () => {
    await seedSyntheticProfile();
    const renderer = renderDirect(<PersonalInformationScreen navigation={navigation} route={route} />);
    const texts = textsOf(renderer);
    expect(texts).toContain('Informations personnelles');
    expect(texts).toContain('Informations de base');
    expect(texts).toContain('Préférences personnelles');
    expect(texts).toContain('Pays');
    // Real stored values (seeded above) render untranslated.
    expect(texts).toContain('Benali');
    expect(texts).toContain('amina.benali@email.com');
    expect(texts).toContain('Algérie');
  });

  it('English: labels translate, stored real values stay in their original form, no French chrome leaks', async () => {
    await seedSyntheticProfile();
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
});
