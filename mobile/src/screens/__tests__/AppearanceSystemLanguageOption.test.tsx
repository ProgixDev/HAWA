import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AppearanceScreen from '../AppearanceScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {
  getAppLanguage,
  getAppLanguagePreference,
  refreshSystemLanguage,
  resetAppLanguageForTests,
  setAppLanguage,
  setSelectedThemeId,
} from '../../state/themePreferences';
import i18n from '../../i18n';

// The "System default" option of the language sheet (Appearance -> Language), in the same sheet as the eight languages:
// it is offered first, is translated into every language, and applying it returns AWA to following the phone.

const mockDevice: {tags: unknown} = {tags: ['fr-FR']};
jest.mock('../../utils/deviceLanguage', () => ({
  readDeviceLocaleTags: jest.fn(async () => mockDevice.tags),
}));

const KEY = '@awa/appearance/language-v1';
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const LANGUAGES = ['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh'] as const;
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
const radios = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => node.props.accessibilityRole === 'radio' && typeof node.props.onPress === 'function');
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
  const button = renderer.root.findAll(
    node => node.props.accessibilityLabel === i18n.t('common.apply') && node.props.accessibilityRole === 'button',
  )[0];
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
  mockDevice.tags = ['fr-FR'];
  await i18n.changeLanguage('en');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('"System default" in the language sheet', () => {
  it.each(LANGUAGES)('%s: the option is translated into the language AWA is displayed in, and is offered before the languages', async language => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
    const renderer = await renderScreen();
    await openSheet(renderer);
    const name = i18n.t('appearance.language.systemName');
    const description = i18n.t('appearance.language.systemDescription');
    expect(name).not.toBe('appearance.language.systemName'); // a real translation, not a raw key
    expect(description).not.toBe('appearance.language.systemDescription');
    expect(texts(renderer)).toContain(name);
    expect(texts(renderer)).toContain(description);
    // system first, then the nine languages
    expect(radios(renderer).filter((node, index, all) => all.findIndex(other => other.props.accessibilityLabel === node.props.accessibilityLabel) === index)).toHaveLength(10);
    expect(radios(renderer)[0].props.accessibilityLabel).toBe(name);
  });

  it('the eight translations are all different from English except English itself (no copy-paste of the English text)', () => {
    const names = LANGUAGES.map(language => i18n.getFixedT(language)('appearance.language.systemName'));
    expect(new Set(names).size).toBe(8);
  });

  it('with nothing chosen it is the selected option, and the row names the mode and the language in force', async () => {
    const renderer = await renderScreen();
    await openSheet(renderer);
    expect(radio(renderer, 'System default').props.accessibilityState).toEqual({checked: true});
    expect(radio(renderer, 'English').props.accessibilityState).toEqual({checked: false});
    expect(texts(renderer)).toContain('System default · English');
  });

  it('choosing a language and applying it is a manual choice that is saved; the option is then not selected', async () => {
    const renderer = await renderScreen();
    await openSheet(renderer);
    await act(async () => {
      radio(renderer, 'Deutsch').props.onPress();
    });
    await apply(renderer);
    expect(getAppLanguage()).toBe('de');
    expect(getAppLanguagePreference()).toBe('de');
    expect(await AsyncStorage.getItem(KEY)).toBe('de');
    expect(i18n.language).toBe('de');
  });

  it('applying "System default" after a manual choice clears it, applies the phone language at once and follows it', async () => {
    await setAppLanguage('de');
    await i18n.changeLanguage('de');
    const renderer = await renderScreen();
    await openSheet(renderer);
    await act(async () => {
      radio(renderer, i18n.t('appearance.language.systemName')).props.onPress();
    });
    await apply(renderer);
    expect(getAppLanguagePreference()).toBe('system');
    expect(await AsyncStorage.getItem(KEY)).toBeNull();
    expect(getAppLanguage()).toBe('fr'); // the (mocked) phone language
    expect(i18n.language).toBe('fr');

    mockDevice.tags = ['es-ES'];
    await act(async () => {
      await refreshSystemLanguage();
    });
    expect(getAppLanguage()).toBe('es');
  });

  it('applying "System default" on an unsupported phone language gives English', async () => {
    mockDevice.tags = ['ar-DZ'];
    await setAppLanguage('es');
    await i18n.changeLanguage('es');
    const renderer = await renderScreen();
    await openSheet(renderer);
    await act(async () => {
      radio(renderer, i18n.t('appearance.language.systemName')).props.onPress();
    });
    await apply(renderer);
    expect(getAppLanguage()).toBe('en');
    expect(i18n.language).toBe('en');
  });

  it('dismissing the sheet without applying changes nothing', async () => {
    await setAppLanguage('it');
    await i18n.changeLanguage('it');
    const renderer = await renderScreen();
    await openSheet(renderer);
    await act(async () => {
      radio(renderer, i18n.t('appearance.language.systemName')).props.onPress();
    });
    const backdrop = renderer.root.findAll(node => node.props.accessibilityLabel === i18n.t('common.close'))[0];
    await act(async () => {
      backdrop.props.onPress();
    });
    expect(getAppLanguagePreference()).toBe('it');
    expect(await AsyncStorage.getItem(KEY)).toBe('it');
  });
});
