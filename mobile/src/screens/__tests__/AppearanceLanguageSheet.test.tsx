import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AppearanceScreen from '../AppearanceScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {getAppLanguage, resetAppLanguageForTests, setAppLanguage, setSelectedThemeId} from '../../state/themePreferences';
import i18n from '../../i18n';

// The language sheet of Appearance offers exactly AWA's fifteen languages and nothing else: there is no "System" / "System
// default" option (the phone's language is read once, at the first launch, and stored — see themePreferences.ts). Choosing a
// language and pressing "Apply" saves it; dismissing the sheet changes nothing.

const KEY = '@awa/appearance/language-v1';
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 740}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const UI_LANGUAGES = ['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi', 'sq', 'ja', 'ko', 'pt-PT', 'pt-BR', 'bn'] as const;
// each card names itself in its own language, whatever language AWA is displayed in
const SELF_LABELS = ['Français', 'English', 'Español', 'Italiano', 'Türkçe', 'Русский', 'Deutsch', '简体中文', 'Bahasa Indonesia', 'हिन्दी', 'Shqip', '日本語', '한국어', 'Português (Portugal)', 'Português (Brasil)', 'বাংলা'];
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

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
const radioLabels = (renderer: ReactTestRenderer.ReactTestRenderer): string[] => {
  const labels = renderer.root
    .findAll(node => node.props.accessibilityRole === 'radio' && typeof node.props.onPress === 'function')
    .map(node => node.props.accessibilityLabel as string);
  return labels.filter((label, index) => labels.indexOf(label) === index); // the test renderer reports a host node more than once
};
// Everything the language list itself shows. Scoped to the sheet's radio group on purpose: the theme-mode selector keeps its own
// legitimate "System" option (Light / Dark / System), and in some languages (zh: 跟随系统) it is worded exactly like the removed
// language option, so a whole-screen text search would flag it wrongly.
const languageListTexts = (renderer: ReactTestRenderer.ReactTestRenderer): string[] => {
  const group = renderer.root.findAll(node => node.props.accessibilityRole === 'radiogroup')[0];
  return group.findAllByType(Text).map(textOf);
};
const radio = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.props.accessibilityRole === 'radio' && node.props.accessibilityLabel === label)[0];

async function openSheet(renderer: ReactTestRenderer.ReactTestRenderer) {
  const row = renderer.root.findAll(
    node => node.props.accessibilityLabel === i18n.t('appearance.languageRowTitle') && node.props.accessibilityRole === 'button',
  )[0];
  await act(async () => {
    row.props.onPress();
  });
}

async function apply(renderer: ReactTestRenderer.ReactTestRenderer) {
  const button = renderer.root.findAll(node => node.props.accessibilityLabel === i18n.t('common.apply') && node.props.accessibilityRole === 'button')[0];
  await act(async () => {
    button.props.onPress();
  });
  for (let index = 0; index < 5; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

beforeEach(async () => {
  resetPremiumStateForTests();
  await setSelectedThemeId('awa-original');
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('the language sheet offers the fifteen languages only', () => {
  it('lists exactly the sixteen language cards, each in its own language, with no "System" card', async () => {
    const renderer = await renderScreen();
    await openSheet(renderer);
    expect(radioLabels(renderer)).toEqual(SELF_LABELS);
  });

  it.each(UI_LANGUAGES)('%s: no "System" / "System default" / "Langue du système" option or description anywhere in the sheet', async language => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
    const renderer = await renderScreen();
    await openSheet(renderer);

    expect(radioLabels(renderer)).toEqual(SELF_LABELS); // sixteen cards, whichever language AWA is displayed in
    // the (still-translated) wording of the removed option never appears, in any language
    const removedWording = UI_LANGUAGES.flatMap(other => [
      i18n.getFixedT(other)('appearance.language.systemName'),
      i18n.getFixedT(other)('appearance.language.systemDescription'),
    ]);
    const shown = languageListTexts(renderer);
    expect(shown.length).toBeGreaterThan(0); // the scoping found the list
    removedWording.forEach(wording => expect([wording, shown.includes(wording)]).toEqual([wording, false]));
    expect(radioLabels(renderer).some(label => /system|système|sistema|sistem|систем|系统|सिस्टम/i.test(label))).toBe(false);
  });

  it('the language in force is the selected card, and the row names only that language (no "System default ·" prefix)', async () => {
    await setAppLanguage('es');
    await i18n.changeLanguage('es');
    const renderer = await renderScreen();
    expect(texts(renderer)).toContain(i18n.t('appearance.language.spanishName'));
    expect(texts(renderer).some(text => text.includes('·') && /default|défaut|predeterminado/i.test(text))).toBe(false);
    await openSheet(renderer);
    expect(radio(renderer, 'Español').props.accessibilityState).toEqual({checked: true});
    SELF_LABELS.filter(label => label !== 'Español').forEach(label => {
      expect([label, radio(renderer, label).props.accessibilityState]).toEqual([label, {checked: false}]);
    });
  });
});

describe('unrelated Appearance functionality is untouched', () => {
  it('the Light / Dark / System theme-mode selector keeps its own "System" option', async () => {
    const renderer = await renderScreen();
    expect(texts(renderer)).toContain(i18n.t('appearance.modeSystem'));
  });
});

describe('choosing a language', () => {
  it('Apply saves it as the app language, switches AWA at once and the row follows', async () => {
    const renderer = await renderScreen();
    await openSheet(renderer);
    await act(async () => {
      radio(renderer, 'Deutsch').props.onPress();
    });
    await apply(renderer);

    expect(getAppLanguage()).toBe('de');
    expect(await AsyncStorage.getItem(KEY)).toBe('de');
    expect(i18n.language).toBe('de');
    expect(texts(renderer)).toContain(i18n.t('appearance.language.germanName'));
  });

  it.each(UI_LANGUAGES)('%s can be chosen and is the one stored', async language => {
    const renderer = await renderScreen();
    await openSheet(renderer);
    const label = SELF_LABELS[UI_LANGUAGES.indexOf(language)];
    await act(async () => {
      radio(renderer, label).props.onPress();
    });
    await apply(renderer);
    expect(getAppLanguage()).toBe(language);
    expect(await AsyncStorage.getItem(KEY)).toBe(language);
  });

  it('dismissing the sheet without applying changes nothing', async () => {
    await setAppLanguage('it');
    await i18n.changeLanguage('it');
    const renderer = await renderScreen();
    await openSheet(renderer);
    await act(async () => {
      radio(renderer, 'Deutsch').props.onPress();
    });
    const backdrop = renderer.root.findAll(node => node.props.accessibilityLabel === i18n.t('common.close'))[0];
    await act(async () => {
      backdrop.props.onPress();
    });
    expect(getAppLanguage()).toBe('it');
    expect(await AsyncStorage.getItem(KEY)).toBe('it');
  });
});
