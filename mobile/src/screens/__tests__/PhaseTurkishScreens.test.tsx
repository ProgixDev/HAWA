import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, TextInput} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import AppearanceScreen from '../AppearanceScreen';
import ProfileScreen from '../ProfileScreen';
import LibraryScreen from '../LibraryScreen';
import CycleInformationScreen from '../CycleInformationScreen';
import PersonalInformationScreen from '../PersonalInformationScreen';
import MiscarriageDateScreen from '../MiscarriageDateScreen';
import PostpartumDeliveryDateScreen from '../PostpartumDeliveryDateScreen';
import {DeleteTrackedDataScreen} from '../BackupUtilityScreens';
import {DeleteAccountScreen} from '../DataPrivacyScreens';
import {TermsOfUseScreen, PrivacyPolicyScreen, TERMS, PRIVACY} from '../LegalDocumentScreen';
import HijriMonthGrid from '../../components/hijri/HijriMonthGrid';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {resetActiveProfileForTests} from '../../state/activeProfileStore';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {
  getAppLanguage,
  resetAppLanguageForTests,
  setAppLanguage,
  setSelectedThemeId,
  type AwaAppLanguage,
} from '../../state/themePreferences';
import {hijriMonthStart} from '../../utils/hijriCalendar';
import i18n from '../../i18n';

// Turkish (tr) — screen-level behavior on real mounted screens: the language selector (five options, Apply,
// persistence), the Profile card subtitle, calendar headers, the typed destructive confirmation (SİL), legal
// documents, and a sweep of screens across the objectives that must never show a raw translation key.

const Stack = createNativeStackNavigator();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 740}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const textOf = (node: ReactTestRenderer.ReactTestInstance): string =>
  [node.props.children].flat(Infinity).map(child => (typeof child === 'string' || typeof child === 'number' ? String(child) : '')).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] => renderer.root.findAllByType(Text).map(textOf);
const tr = (key: string, lng: AwaAppLanguage, options: Record<string, unknown> = {}) => i18n.t(key, {lng, ...options}) as string;
const LANGUAGES = ['en', 'fr', 'es', 'it', 'tr'] as const;

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function switchLanguage(language: AwaAppLanguage) {
  await act(async () => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
  });
  await settle();
}

async function renderScreen(Screen: React.ComponentType<never>, navigation: Record<string, unknown> = {}) {
  const Component = Screen as unknown as React.ComponentType<Record<string, unknown>>;
  const nav = {navigate: jest.fn(), goBack: jest.fn(), reset: jest.fn(), setOptions: jest.fn(), addListener: jest.fn(() => jest.fn()), ...navigation};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <Component navigation={nav} route={{key: 'test', name: 'test', params: {}}} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return {renderer, nav};
}

/** For screens that use navigation hooks (useFocusEffect): a real navigator around the screen. */
async function renderInStack(Screen: React.ComponentType<never>) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen component={Screen as never} name="Subject" />
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return {renderer};
}

beforeEach(async () => {
  await resetActiveProfileForTests();
  resetPremiumStateForTests();
  await AsyncStorage.clear();
  await setSelectedThemeId('awa-original');
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('en');
});

describe('language selector — Türkçe among five options', () => {
  const rowLabels = () => LANGUAGES.map(lng => tr('appearance.languageRowTitle', lng));
  const applyLabels = () => LANGUAGES.map(lng => tr('common.apply', lng));
  const closeLabels = () => LANGUAGES.map(lng => tr('common.close', lng));
  const radios = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
    renderer.root.findAll(node => node.props.accessibilityLabel === label && node.props.accessibilityRole === 'radio');
  const open = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
    const row = renderer.root.findAll(node => rowLabels().includes(node.props.accessibilityLabel) && node.props.accessibilityRole === 'button')[0];
    await act(async () => {
      row.props.onPress();
    });
  };
  const apply = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
    await open(renderer);
    await act(async () => {
      radios(renderer, label)[0].props.onPress();
    });
    const button = renderer.root.findAll(node => applyLabels().includes(node.props.accessibilityLabel) && node.props.accessibilityRole === 'button')[0];
    await act(async () => {
      button.props.onPress();
    });
  };

  it('Türkçe is the fifth card: 🇹🇷 flag, native name, native-language subtitle, in every active language', async () => {
    for (const language of LANGUAGES) {
      await act(async () => {
        await i18n.changeLanguage(language);
      });
      const {renderer} = await renderScreen(AppearanceScreen as never);
      await open(renderer);
      const texts = textsOf(renderer);
      expect(texts).toContain('🇹🇷');
      expect(texts).toContain('Türkçe');
      expect(texts).toContain('AWA’yı Türkçe kullan');
      expect(radios(renderer, 'Türkçe')).not.toHaveLength(0);
    }
  });

  it('exactly five options are offered', async () => {
    const {renderer} = await renderScreen(AppearanceScreen as never);
    await open(renderer);
    const labels = new Set(renderer.root.findAll(node => node.props.accessibilityRole === 'radio').map(node => node.props.accessibilityLabel));
    expect(labels).toEqual(new Set(['English', 'Français', 'Español', 'Italiano', 'Türkçe']));
  });

  it('selecting Türkçe and pressing Apply switches the mounted screen to Turkish and persists it', async () => {
    const {renderer} = await renderScreen(AppearanceScreen as never);
    await apply(renderer, 'Türkçe');
    expect(getAppLanguage()).toBe('tr');
    expect(i18n.language).toBe('tr');
    expect(await AsyncStorage.getItem('@awa/appearance/language-v1')).toBe('tr');
    expect(textsOf(renderer)).toContain(tr('appearance.headerTitle', 'tr'));
    expect(textsOf(renderer)).not.toContain(tr('appearance.headerTitle', 'en'));
    expect(renderer.root.findAllByProps({children: 'Türkçe'}).length).toBeGreaterThan(0); // current-language row
  });

  it('dismissing the sheet without Apply keeps the current language', async () => {
    const {renderer} = await renderScreen(AppearanceScreen as never);
    await open(renderer);
    await act(async () => {
      radios(renderer, 'Türkçe')[0].props.onPress();
    });
    const backdrop = renderer.root.findAll(node => closeLabels().includes(node.props.accessibilityLabel))[0];
    await act(async () => {
      backdrop.props.onPress();
    });
    expect(getAppLanguage()).toBe('en');
  });

  it('EN -> TR -> FR -> TR -> IT: every step switches immediately, nothing stale', async () => {
    const {renderer} = await renderScreen(AppearanceScreen as never);
    const title = (lng: AwaAppLanguage) => tr('appearance.headerTitle', lng);
    await apply(renderer, 'Türkçe');
    expect(textsOf(renderer)).toContain(title('tr'));
    await apply(renderer, 'Français');
    expect(textsOf(renderer)).toContain(title('fr'));
    expect(textsOf(renderer)).not.toContain(title('tr'));
    await apply(renderer, 'Türkçe');
    expect(textsOf(renderer)).toContain(title('tr'));
    await apply(renderer, 'Italiano');
    expect(getAppLanguage()).toBe('it');
    expect(textsOf(renderer)).toContain(title('it'));
    expect(textsOf(renderer)).not.toContain(title('tr'));
  });

  it('the language is an app-level preference: switching the active profile does not change it', async () => {
    await switchLanguage('tr');
    await resetActiveProfileForTests();
    expect(getAppLanguage()).toBe('tr');
    expect(i18n.language).toBe('tr');
  });
});

describe('Profile: Appearance card subtitle', () => {
  it('reads exactly "Temalar, renkler, görünüm ve dil" in Turkish and stays localized in the other languages', async () => {
    await switchLanguage('tr');
    const {renderer} = await renderInStack(ProfileScreen as never);
    expect(textsOf(renderer)).toContain('Temalar, renkler, görünüm ve dil');
    for (const language of ['en', 'fr', 'es', 'it'] as const) {
      expect(tr('profile.appearanceSubtitle', language)).not.toBe('Temalar, renkler, görünüm ve dil');
    }
  });
});

describe('calendar headers (HijriMonthGrid) follow Turkish and switch at runtime', () => {
  const today = new Date(2026, 8, 15);
  const mount = () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={TEST_METRICS}>
          <AwaThemeProvider>
            <HijriMonthGrid direction={1} monthLabel="Ekim 2026" monthStart={hijriMonthStart(today)} onNext={jest.fn()} onPrevious={jest.fn()} onSelectDate={jest.fn()} onToday={jest.fn()} selectedDate={today} today={today} />
          </AwaThemeProvider>
        </SafeAreaProvider>,
      );
    });
    activeRenderers.push(renderer);
    return renderer;
  };

  it('Monday-first Pzt…Paz; no French/English/Spanish/Italian abbreviations', async () => {
    await switchLanguage('tr');
    const texts = textsOf(mount());
    expect(texts).toEqual(expect.arrayContaining(['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']));
    for (const foreign of ['Jeu', 'Thu', 'Jue', 'Gio']) {
      expect(texts).not.toContain(foreign);
    }
  });

  it('TR -> FR -> IT -> TR on the same mounted grid', async () => {
    await switchLanguage('tr');
    const renderer = mount();
    expect(textsOf(renderer)).toContain('Per');
    await switchLanguage('fr');
    expect(textsOf(renderer)).toContain('Jeu');
    await switchLanguage('it');
    expect(textsOf(renderer)).toContain('Gio');
    await switchLanguage('tr');
    expect(textsOf(renderer)).toContain('Per');
  });
});

describe('typed destructive confirmation uses the localized word (SİL), never a hardcoded DELETE', () => {
  const typeInto = async (renderer: ReactTestRenderer.ReactTestRenderer, value: string) => {
    await act(async () => {
      renderer.root.findByType(TextInput).props.onChangeText(value);
    });
  };

  beforeEach(async () => {
    await switchLanguage('tr');
  });

  it('DeleteTrackedDataScreen: placeholder is SİL; the typed word is validated with Turkish casing rules', async () => {
    const {renderer} = await renderScreen(DeleteTrackedDataScreen as never);
    expect(renderer.root.findByType(TextInput).props.placeholder).toBe('SİL');
    const valid = tr('backupUtility.delete.validConfirmation', 'tr');
    for (const wrong of ['DELETE', 'SUPPRIMER', 'ELIMINAR', 'ELIMINA', 'SEL']) {
      await typeInto(renderer, wrong);
      expect(textsOf(renderer)).not.toContain(valid);
    }
    for (const right of ['SİL', 'sil', 'Sil']) {
      await typeInto(renderer, right);
      expect(textsOf(renderer)).toContain(valid);
    }
  });

  it('DeleteAccountScreen: wrong words show the Turkish error; SİL proceeds', async () => {
    const {renderer, nav} = await renderScreen(DeleteAccountScreen as never);
    const deleteButton = () => renderer.root.findAll(node => node.props.accessibilityLabel === tr('dataPrivacy.deleteAccount.deleteButtonAccessibility', 'tr'))[0];
    for (const wrong of ['DELETE', 'SUPPRIMER', 'ELIMINA']) {
      await typeInto(renderer, wrong);
      await act(async () => {
        await deleteButton().props.onPress();
      });
      expect(nav.reset).not.toHaveBeenCalled();
      expect(textsOf(renderer)).toContain(tr('dataPrivacy.deleteAccount.confirmError', 'tr'));
    }
    await typeInto(renderer, 'SİL');
    await act(async () => {
      await deleteButton().props.onPress();
    });
    expect(nav.reset).toHaveBeenCalledTimes(1);
  });
});

describe('legal documents', () => {
  it.each([
    ['Terms of Use', TermsOfUseScreen, TERMS, 'about.termsOfUse'],
    ['Privacy Policy', PrivacyPolicyScreen, PRIVACY, 'about.privacyPolicy'],
  ] as const)('%s: Turkish chrome and Turkish body, never French/Spanish/English text', async (_name, Screen, content, titleKey) => {
    await switchLanguage('tr');
    const {renderer} = await renderScreen(Screen as never);
    const texts = textsOf(renderer);
    expect(texts).toContain(tr(titleKey, 'tr'));
    expect(texts).toContain(tr('legalDocument.provisionalNotice', 'tr'));
    expect(texts).toContain(content.tr[0].title);
    expect(texts).toContain(content.tr[0].body);
    expect(texts).not.toContain(content.en[0].title);
    expect(texts).not.toContain(content.fr[0].title);
  });
});

describe('screen sweep across the objectives: Turkish text, no raw translation keys, no foreign leftovers', () => {
  const RAW_KEY = /^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9_]+){1,}$/;
  const NEEDS_NAVIGATOR = new Set<unknown>([ProfileScreen, LibraryScreen]);
  const render = (Screen: React.ComponentType<never>) => (NEEDS_NAVIGATOR.has(Screen) ? renderInStack(Screen) : renderScreen(Screen));
  const screens: Array<[string, React.ComponentType<never>]> = [
    ['Appearance', AppearanceScreen as never],
    ['Profile', ProfileScreen as never],
    ['Library', LibraryScreen as never],
    ['CycleInformation (cycle)', CycleInformationScreen as never],
    ['PersonalInformation', PersonalInformationScreen as never],
    ['MiscarriageDate (pregnancy loss)', MiscarriageDateScreen as never],
    ['PostpartumDeliveryDate (postpartum)', PostpartumDeliveryDateScreen as never],
    ['DeleteTrackedData (privacy)', DeleteTrackedDataScreen as never],
    ['DeleteAccount (privacy)', DeleteAccountScreen as never],
  ];

  it.each(screens)('%s renders in Turkish', async (_name, Screen) => {
    await switchLanguage('tr');
    const {renderer} = await render(Screen);
    const texts = textsOf(renderer).filter(text => text.trim().length > 0);
    expect(texts.length).toBeGreaterThan(0);
    expect(texts.filter(text => RAW_KEY.test(text.trim()))).toEqual([]);
    expect(texts.join(' ')).toMatch(/[A-Za-zÇĞİÖŞÜçğıöşü]/);
    // the French originals of the shared chrome must not leak into Turkish
    expect(texts).not.toContain(tr('common.save', 'fr'));
    expect(texts).not.toContain(tr('common.cancel', 'fr'));
  });

  it.each(LANGUAGES)('the same sweep still renders cleanly in %s (regression guard)', async language => {
    await switchLanguage(language);
    for (const [, Screen] of screens) {
      const {renderer} = await render(Screen);
      const texts = textsOf(renderer).filter(text => text.trim().length > 0);
      expect(texts.filter(text => RAW_KEY.test(text.trim()))).toEqual([]);
    }
  });
});
