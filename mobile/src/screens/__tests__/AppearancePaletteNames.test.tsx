import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import AppearanceScreen from '../AppearanceScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {AWA_THEMES, DEFAULT_AWA_THEME_ID, getEnabledAwaThemes} from '../../config/awaThemes';
import {resetPremiumStateForTests, updatePremiumState} from '../../state/premiumStore';
import {
  getAppLanguage,
  getSelectedThemeId,
  resetAppLanguageForTests,
  setAppLanguage,
  setAppearanceMode,
  setSelectedThemeId,
  setTrueBlackEnabled,
  type AwaAppLanguage,
} from '../../state/themePreferences';
import i18n from '../../i18n';
import {en} from '../../i18n/locales/en';
import {fr} from '../../i18n/locales/fr';
import {es} from '../../i18n/locales/es';
import {it as itDictionary} from '../../i18n/locales/it';
import {tr} from '../../i18n/locales/tr';
import {ru} from '../../i18n/locales/ru';
import {de} from '../../i18n/locales/de';
import {zh} from '../../i18n/locales/zh';
import {id} from '../../i18n/locales/id';
import {hi} from '../../i18n/locales/hi';
import {sq} from '../../i18n/locales/sq';
import {ja} from '../../i18n/locales/ja';

// The palette names in Appearance (the cards and their accessibility labels) used to be read straight from the theme registry,
// which is English ("Lavender Night", "Rose Quartz"…), while the descriptions already came from the dictionaries. They now come from
// `appearanceThemeNames.<palette id>`: "AWA Original" (the brand name of the original palette) is the same in every language and the
// other names are translated. Palette ids, colours, images, Premium and persistence are untouched.

const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 740}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const LANGUAGES = ['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi', 'sq', 'ja'] as const;
const DICTIONARIES = {fr, en, es, it: itDictionary, tr, ru, de, zh, id, hi, sq, ja} as const;
const THEME_KEY = '@awa/appearance/theme-v1';
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const nameOf = (language: AwaAppLanguage, paletteId: string): string =>
  (DICTIONARIES[language] as unknown as {appearanceThemeNames: Record<string, string>}).appearanceThemeNames[paletteId];
const IDS = AWA_THEMES.map(theme => theme.id);
const SELECTABLE_IDS = getEnabledAwaThemes().map(theme => theme.id);

async function renderScreen() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <AppearanceScreen navigation={{goBack: jest.fn()} as never} route={{key: 'test', name: 'Appearance'} as never} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const texts = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);
// The palette cards are the pressables whose label holds a palette name of the language in force (the mode buttons Claro / Oscuro /
// Sistema carry a selected state too, but no palette name).
const cardNodes = (renderer: ReactTestRenderer.ReactTestRenderer): ReactTestRenderer.ReactTestInstance[] => {
  const language = getAppLanguage();
  const names = IDS.map(paletteId => nameOf(language, paletteId));
  return renderer.root.findAll(
    node =>
      node.props.accessibilityRole === 'button' &&
      typeof node.props.accessibilityLabel === 'string' &&
      node.props.accessibilityState !== undefined &&
      'selected' in node.props.accessibilityState &&
      names.some(name => (node.props.accessibilityLabel as string).includes(name)),
  );
};
const cardLabels = (renderer: ReactTestRenderer.ReactTestRenderer): string[] => {
  const labels = cardNodes(renderer).map(node => node.props.accessibilityLabel as string);
  return labels.filter((label, index) => labels.indexOf(label) === index); // a host node can be reported twice
};
const selectedCardLabel = (renderer: ReactTestRenderer.ReactTestRenderer): string | undefined =>
  cardNodes(renderer).find(node => node.props.accessibilityState.selected === true)?.props.accessibilityLabel;

async function switchLanguage(language: AwaAppLanguage) {
  await act(async () => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
  });
}

beforeEach(async () => {
  resetPremiumStateForTests();
  await AsyncStorage.clear();
  await setSelectedThemeId(DEFAULT_AWA_THEME_ID);
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  await resetAppLanguageForTests();
  await switchLanguage('en');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('every palette has a valid name in every language', () => {
  it('the dictionaries name exactly the palettes of the registry (including the technical "midnight")', () => {
    expect(IDS.length).toBeGreaterThanOrEqual(7);
    for (const language of LANGUAGES) {
      const names = (DICTIONARIES[language] as unknown as {appearanceThemeNames: Record<string, string>}).appearanceThemeNames;
      expect([language, Object.keys(names).sort()]).toEqual([language, [...IDS].sort()]);
    }
  });

  it.each(LANGUAGES)('%s: every name is a non-empty, translated string (no raw key, no placeholder, no stray spaces)', language => {
    for (const paletteId of IDS) {
      const name = nameOf(language, paletteId);
      expect([language, paletteId, typeof name === 'string' && name.trim().length > 0]).toEqual([language, paletteId, true]);
      expect(name).toBe(name.trim());
      expect(name).not.toMatch(/\{\{|appearanceThemeNames|^[a-z]+(-[a-z]+)+$/);
      expect(i18n.t(`appearanceThemeNames.${paletteId}`, {lng: language})).toBe(name); // i18next resolves the same string
    }
  });

  it('"AWA Original" is the brand name of the original palette: identical in all ten languages', () => {
    for (const language of LANGUAGES) {
      expect([language, nameOf(language, 'awa-original')]).toEqual([language, 'AWA Original']);
    }
  });

  it.each(LANGUAGES.filter(language => language !== 'en'))('%s: the descriptive names are really translated, not the English registry names', language => {
    for (const theme of AWA_THEMES.filter(candidate => candidate.id !== 'awa-original')) {
      expect([language, theme.id, nameOf(language, theme.id) === theme.name]).toEqual([language, theme.id, false]);
    }
    // and each language gives its six palettes six different names
    const names = SELECTABLE_IDS.map(paletteId => nameOf(language, paletteId));
    expect(new Set(names).size).toBe(names.length);
  });

  it('English keeps the registry names exactly', () => {
    for (const theme of AWA_THEMES) {
      expect(nameOf('en', theme.id)).toBe(theme.name);
    }
  });

  it('the Hindi, Russian and Chinese names are written in their own script', () => {
    for (const paletteId of SELECTABLE_IDS.filter(candidate => candidate !== 'awa-original')) {
      expect(nameOf('hi', paletteId)).toMatch(/[ऀ-ॿ]/);
      expect(nameOf('ru', paletteId)).toMatch(/[Ѐ-ӿ]/);
      expect(nameOf('zh', paletteId)).toMatch(/[一-鿿]/);
    }
  });
});

describe('Appearance shows the localized names (cards and "View all", visible labels and accessibility labels)', () => {
  it.each(LANGUAGES)('%s: all six palette cards show the localized name and describe themselves with it', async language => {
    await switchLanguage(language);
    const renderer = await renderScreen();
    const shown = texts(renderer);
    const labels = cardLabels(renderer);
    expect(labels.length).toBe(SELECTABLE_IDS.length);
    SELECTABLE_IDS.forEach(paletteId => {
      const name = nameOf(language, paletteId);
      expect([language, paletteId, 'visible', shown.includes(name)]).toEqual([language, paletteId, 'visible', true]);
      expect([language, paletteId, 'accessibility', labels.filter(label => label.includes(name)).length]).toEqual([language, paletteId, 'accessibility', 1]);
      // the description next to it is the existing translated one
      expect(shown).toContain(i18n.t(`appearanceThemes.${paletteId}`, {lng: language}));
    });
    // the accessibility label is the dictionary's own sentence with the localized name
    const lavender = labels.find(label => label.includes(nameOf(language, 'lavender-night')));
    expect(lavender).toContain(i18n.t('appearance.themeAccessibility', {lng: language, name: nameOf(language, 'lavender-night')}));
  });

  it.each(LANGUAGES.filter(language => language !== 'en'))('%s: no English registry name is left on screen (only "AWA Original" is shared)', async language => {
    await switchLanguage(language);
    const renderer = await renderScreen();
    const everything = [...texts(renderer), ...cardLabels(renderer)].join('\n');
    for (const theme of AWA_THEMES.filter(candidate => candidate.id !== 'awa-original' && candidate.id !== 'midnight')) {
      expect([language, theme.name, everything.includes(theme.name)]).toEqual([language, theme.name, false]);
    }
  });

  it('"View all" scrolls the same carousel of the same six cards (nothing is added, removed or reordered)', async () => {
    await switchLanguage('es');
    const renderer = await renderScreen();
    const before = cardLabels(renderer);
    const seeAll = renderer.root.findAll(node => node.props.accessibilityLabel === i18n.t('appearance.seeAllPalettes'))[0];
    await act(async () => {
      seeAll.props.onPress();
    });
    const after = cardLabels(renderer);
    expect(after).toEqual(before);
    expect(after).toHaveLength(6);
  });
});

describe('switching language while Appearance is open', () => {
  it('every name follows the language at once, through all ten languages and back', async () => {
    const renderer = await renderScreen();
    const order = ['es', 'fr', 'hi', 'ru', 'zh', 'tr', 'de', 'it', 'id', 'en', 'hi'] as const;
    for (const language of order) {
      await switchLanguage(language);
      const shown = texts(renderer);
      const labels = cardLabels(renderer);
      for (const paletteId of SELECTABLE_IDS) {
        const name = nameOf(language, paletteId);
        expect([language, paletteId, shown.includes(name), labels.some(label => label.includes(name))]).toEqual([language, paletteId, true, true]);
      }
    }
  });

  it('the selected palette stays the same: free palette, Premium palette and the stored value', async () => {
    const renderer = await renderScreen();
    for (const language of ['es', 'hi', 'fr'] as const) {
      await switchLanguage(language);
      expect(getSelectedThemeId()).toBe('awa-original');
      expect(await AsyncStorage.getItem(THEME_KEY)).toBe('awa-original');
      expect(selectedCardLabel(renderer)).toContain(nameOf(language, 'awa-original'));
    }

    // a Premium palette chosen while Premium is active
    await act(async () => {
      updatePremiumState({isPremium: true, initialized: true});
      await setSelectedThemeId('rose-quartz');
    });
    for (const language of ['de', 'zh', 'ru', 'en'] as const) {
      await switchLanguage(language);
      expect([language, getSelectedThemeId()]).toEqual([language, 'rose-quartz']);
      expect(await AsyncStorage.getItem(THEME_KEY)).toBe('rose-quartz');
      expect(selectedCardLabel(renderer)).toContain(nameOf(language, 'rose-quartz'));
    }
    expect(getAppLanguage()).toBe('en');
  });

  it('a locked Premium card keeps its locked wording around the localized name', async () => {
    await switchLanguage('es');
    const renderer = await renderScreen();
    const lavender = cardLabels(renderer).find(label => label.includes(nameOf('es', 'lavender-night')));
    expect(lavender).toContain(i18n.t('appearance.premiumLocked', {lng: 'es'}));
    updatePremiumState({isPremium: true, initialized: true});
    await act(async () => {
      await Promise.resolve();
    });
    const unlocked = cardLabels(renderer).find(label => label.includes(nameOf('es', 'lavender-night')));
    expect(unlocked).not.toContain(i18n.t('appearance.premiumLocked', {lng: 'es'}));
    expect(unlocked).toContain(i18n.t('appearance.premium', {lng: 'es'}));
  });
});

describe('the registry is untouched', () => {
  it('palette ids, colours and Premium flags are exactly what they were', () => {
    expect(AWA_THEMES.map(theme => [theme.id, theme.name, theme.isPremium])).toEqual([
      ['awa-original', 'AWA Original', false],
      ['lavender-night', 'Lavender Night', true],
      ['rose-quartz', 'Rose Quartz', true],
      ['sage-serenity', 'Sage Serenity', true],
      ['ocean-calm', 'Ocean Calm', true],
      ['warm-sand', 'Warm Sand', true],
      ['midnight', 'Midnight', expect.any(Boolean)],
    ]);
    expect(DEFAULT_AWA_THEME_ID).toBe('awa-original');
    expect(AWA_THEMES.find(theme => theme.id === 'lavender-night')!.colors.primary).toBe('#B79CF2');
    expect(AWA_THEMES.find(theme => theme.id === 'awa-original')!.colors.surface).toBe('#FFFFFF');
  });
});
