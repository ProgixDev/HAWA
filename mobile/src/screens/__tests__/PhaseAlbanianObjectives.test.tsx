import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../navigation/JournalSheetContext';
import {resetActiveProfileForTests} from '../../state/activeProfileStore';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {setActiveObjective, type ObjectiveId} from '../../state/onboardingPreferences';
import {resetAppLanguageForTests, setAppLanguage, type AwaAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {en} from '../../i18n/locales/en';
import {fr} from '../../i18n/locales/fr';
import {es} from '../../i18n/locales/es';
import {it as itDictionary} from '../../i18n/locales/it';
import {tr as trDictionary} from '../../i18n/locales/tr';
import {ru as ruDictionary} from '../../i18n/locales/ru';
import {de as deDictionary} from '../../i18n/locales/de';
import {id as idDictionary} from '../../i18n/locales/id';
import {hi as hiDictionary} from '../../i18n/locales/hi';
import {sq as sqDictionary} from '../../i18n/locales/sq';
import {zh as zhDictionary} from '../../i18n/locales/zh';

import HomeScreen from '../HomeScreen';
import ObjectiveAwareCalendarScreen from '../ObjectiveAwareCalendarScreen';
import ObjectiveAwareStatisticsScreen from '../ObjectiveAwareStatisticsScreen';
import {POSTPARTUM_JOURNAL_ITEMS} from '../../config/postpartumJournalConfig';
import {MISCARRIAGE_JOURNAL_ITEMS} from '../../config/miscarriageJournalConfig';
import {IRREGULAR_JOURNAL_ITEMS} from '../../config/irregularJournalConfig';
import {CONTRACEPTION_JOURNAL_ITEMS} from '../../config/contraceptionJournalConfig';
import {MENOPAUSE_JOURNAL_ITEMS} from '../../config/menopauseJournalConfig';
import {getConceptionJournalItems} from '../../config/conceptionJournalConfig';

// Albanian across all eight objectives: Home, Calendar, Statistics (real empty states: nothing is stored) and the
// journal category lists that feed both the dashboard "daily tracking" card and the "Journal quotidien" sheet.
// The leak check: no rendered string may be a verbatim fr/en/es/it/tr dictionary value that differs from the Albanian
// value of the same key — that is what a missed translation or a hard-coded foreign string looks like on screen.

jest.mock('../../services/countryDetection', () => ({
  detectCountryCode: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../services/maps/mapStyle', () => ({
  loadMapStyle: jest.fn(async () => ({version: 8, sources: {}, layers: []})),
}));

jest.mock('@maplibre/maplibre-react-native', () => ({
  __esModule: true,
  Camera: () => null,
  Map: ({children}: {children?: React.ReactNode}) => children ?? null,
  UserLocation: () => null,
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn().mockResolvedValue('c'),
    requestPermission: jest.fn().mockResolvedValue({authorizationStatus: 1}),
    createTriggerNotification: jest.fn().mockResolvedValue(undefined),
    cancelTriggerNotification: jest.fn().mockResolvedValue(undefined),
    cancelNotification: jest.fn().mockResolvedValue(undefined),
    getTriggerNotificationIds: jest.fn().mockResolvedValue([]),
  },
  AlarmType: {SET: 0, SET_AND_ALLOW_WHILE_IDLE: 1, SET_EXACT: 2, SET_EXACT_AND_ALLOW_WHILE_IDLE: 3, SET_ALARM_CLOCK: 4},
  AndroidImportance: {HIGH: 4},
  AndroidVisibility: {PRIVATE: 1},
  AuthorizationStatus: {NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1},
  RepeatFrequency: {NONE: -1, HOURLY: 0, DAILY: 1, WEEKLY: 2},
  TriggerType: {TIMESTAMP: 0, INTERVAL: 1},
}));

const Stack = createNativeStackNavigator();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

type Dictionary = Record<string, unknown>;
function leaves(obj: Dictionary, prefix = ''): Array<[string, string]> {
  return Object.entries(obj).flatMap(([key, value]) =>
    value !== null && typeof value === 'object' ? leaves(value as Dictionary, `${prefix}${key}.`) : [[`${prefix}${key}`, String(value)] as [string, string]],
  );
}

// foreign value -> true, only where the Albanian value of the same key is different (so shared brand names / numbers
// / words that are legitimately identical in Albanian never count)
const FOREIGN_VALUES: Set<string> = (() => {
  const albanian = new Map(leaves(sqDictionary as Dictionary));
  const albanianValues = new Set(albanian.values());
  const foreign = new Set<string>();
  for (const dictionary of [en, fr, es, itDictionary, trDictionary, ruDictionary, deDictionary, zhDictionary, idDictionary, hiDictionary]) {
    for (const [keyPath, value] of leaves(dictionary as Dictionary)) {
      const value2 = value.trim();
      if (value2.length < 6 || !/\s/.test(value2) || !/[A-Za-zÀ-ÿ]{3,}/.test(value2)) {continue;}
      if (albanian.get(keyPath) === value || albanianValues.has(value2)) {continue;}
      foreign.add(value2);
    }
  }
  return foreign;
})();

const ALBANIAN_ONLY: Set<string> = (() => {
  const english = new Map(leaves(en as Dictionary));
  return new Set(leaves(sqDictionary as Dictionary).filter(([keyPath, value]) => english.get(keyPath) !== value).map(([, value]) => value.trim()));
})();

const RAW_KEY = /^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9_]+){1,}$/;
const textOf = (node: ReactTestRenderer.ReactTestInstance): string =>
  [node.props.children].flat(Infinity).map(child => (typeof child === 'string' || typeof child === 'number' ? String(child) : '')).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf).map(text => text.trim()).filter(text => text.length > 0);

const settle = async () => {
  for (let index = 0; index < 12; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function mount(Screen: React.ComponentType<never>) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <JournalSheetProvider>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen component={Screen as never} name="Subject" />
              </Stack.Navigator>
            </JournalSheetProvider>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}

async function useLanguage(language: AwaAppLanguage) {
  await act(async () => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
  });
}

const OBJECTIVES: ObjectiveId[] = ['cycle', 'conceive', 'contraception', 'irregular', 'menopause', 'pregnancy', 'postpartum', 'loss'];
const SURFACES: Array<[string, React.ComponentType<never>]> = [
  ['Home', HomeScreen as never],
  ['Calendar', ObjectiveAwareCalendarScreen as never],
  ['Statistics', ObjectiveAwareStatisticsScreen as never],
];

beforeEach(async () => {
  await resetActiveProfileForTests();
  resetPremiumStateForTests();
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await useLanguage('sq');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('en');
});

describe('all eight objectives render Albanian on Home, Calendar and Statistics', () => {
  const cases = OBJECTIVES.flatMap(objective => SURFACES.map(([surface, Screen]) => [objective, surface, Screen] as const));

  it.each(cases)('%s / %s: Albanian text, no raw translation key, no foreign-language leftover', async (objective, _surface, Screen) => {
    await act(async () => {
      await setActiveObjective(objective);
    });
    const renderer = await mount(Screen);
    const texts = textsOf(renderer);

    expect(texts.length).toBeGreaterThan(3); // a real screen rendered, not an empty shell
    expect(texts.filter(text => RAW_KEY.test(text))).toEqual([]);
    expect(texts.filter(text => FOREIGN_VALUES.has(text))).toEqual([]);
    // the French chrome must never appear under Albanian
    expect(texts).not.toContain(fr.common.save);
    // and the screen really is Albanian: at least one rendered string is a Albanian dictionary value that differs from English
    expect(texts.some(text => ALBANIAN_ONLY.has(text))).toBe(true);
    expect(texts.some(text => /[А-Яа-яЁё]/.test(text))).toBe(false);
    expect(texts.some(text => /[ऀ-ॿ]/.test(text))).toBe(false); // no Devanagari
    expect(texts.some(text => /[ëç]/i.test(text))).toBe(true); // Albanian letters are on screen
    expect(texts.filter(text => text !== text.normalize('NFC'))).toEqual([]); // precomposed ë / ç
  });
});

describe('journal categories (one list feeds the dashboard card and the Journal quotidien sheet)', () => {
  const resolve = (items: Array<{title?: string; titleKey?: string; subtitle?: string; subtitleKey?: string; label?: string; labelKey?: string}>) =>
    items.flatMap(item => [item.title, item.titleKey, item.subtitle, item.subtitleKey, item.label, item.labelKey].filter(Boolean) as string[]);

  const lists: Array<[string, unknown[]]> = [
    ['postpartum', POSTPARTUM_JOURNAL_ITEMS as unknown[]],
    ['loss', MISCARRIAGE_JOURNAL_ITEMS as unknown[]],
    ['irregular', IRREGULAR_JOURNAL_ITEMS as unknown[]],
    ['contraception', CONTRACEPTION_JOURNAL_ITEMS as unknown[]],
    ['menopause', MENOPAUSE_JOURNAL_ITEMS as unknown[]],
  ];

  it.each(lists)('%s: every title/label key resolves to Albanian text, never a raw key or a foreign string', (_name, items) => {
    const keys = resolve(items as never);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      const resolved = i18n.t(key, {lng: 'sq'}) as string;
      expect(resolved).not.toBe(key.includes('.') ? key : '__never__');
      expect(RAW_KEY.test(resolved)).toBe(false);
      expect(FOREIGN_VALUES.has(resolved.trim())).toBe(false);
    }
  });

  it('conceive: the shared item list is localized', () => {
    // the config builds its labels with the i18n singleton (active language = Albanian in this file)
    const items = getConceptionJournalItems([]) as unknown as Array<Record<string, unknown>>;
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      for (const value of Object.values(item)) {
        if (typeof value === 'string' && /\s/.test(value)) {
          expect(RAW_KEY.test(value)).toBe(false);
          expect(FOREIGN_VALUES.has(value.trim())).toBe(false);
        }
      }
    }
  });
});

// Daughter Dashboard and Profile: the same screens as the mother's, rendered with a managed daughter profile active (her name in the text)
// and for the owner (Profile). No raw key, no foreign-language string, Albanian letters on screen.
import ProfileScreen from '../ProfileScreen';
import {addManagedProfile, resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {resetActiveProfileForTests as resetActiveProfileAgain, setActiveProfileId} from '../../state/activeProfileStore';

describe('Daughter Dashboard and Profile render Albanian', () => {
  it('the daughter\'s Home, Calendar and Statistics are Albanian, with her name and no leak', async () => {
    await resetManagedProfilesForTests();
    await resetActiveProfileAgain();
    const daughter = await addManagedProfile({type: 'daughter', firstName: 'Ëmbla', birthDate: '2012-03-15', hasHadFirstPeriod: false});
    await act(async () => {
      await setActiveProfileId(daughter.id);
      await setActiveObjective('cycle');
    });
    for (const Screen of [HomeScreen, ObjectiveAwareCalendarScreen, ObjectiveAwareStatisticsScreen] as Array<React.ComponentType<never>>) {
      const renderer = await mount(Screen as never);
      const texts = textsOf(renderer);
      expect(texts.length).toBeGreaterThan(3);
      expect(texts.filter(text => RAW_KEY.test(text))).toEqual([]);
      expect(texts.filter(text => FOREIGN_VALUES.has(text))).toEqual([]);
      expect(texts).not.toContain(fr.common.save);
      expect(texts.some(text => ALBANIAN_ONLY.has(text) || text.includes('Ëmbla'))).toBe(true);
      expect(texts.some(text => /[ऀ-ॿ]/.test(text) || /[А-Яа-яЁё]/.test(text))).toBe(false);
    }
  });

  it('the Profile screen is Albanian: no raw key, no foreign string, Albanian letters', async () => {
    await resetActiveProfileAgain();
    const renderer = await mount(ProfileScreen as never);
    const texts = textsOf(renderer);
    expect(texts.length).toBeGreaterThan(5);
    expect(texts.filter(text => RAW_KEY.test(text))).toEqual([]);
    expect(texts.filter(text => FOREIGN_VALUES.has(text))).toEqual([]);
    expect(texts.some(text => ALBANIAN_ONLY.has(text))).toBe(true);
    expect(texts.some(text => /[ëç]/i.test(text))).toBe(true);
  });
});
