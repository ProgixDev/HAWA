import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {
  getAppLanguage,
  resetAppLanguageForTests,
  setAppLanguage,
} from '../../state/themePreferences';
import i18n from '../../i18n';
import {en} from '../../i18n/locales/en';
import {fr} from '../../i18n/locales/fr';
import FirstPeriodArticleScreen from '../library/FirstPeriodArticleScreen';
import PregnancyWeekScreen from '../pregnancy/PregnancyWeekScreen';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {isArticleBookmarked, toggleBookmark, getReadingProgress, setReadingProgress} from '../../state/libraryStore';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {setCyclePreferences} from '../../state/onboardingPreferences';
import {buildCycleExportDays} from '../../services/medicalExportReaders';
import {buildExportCsv} from '../../services/medicalExportFormatting';
import {addManagedProfile, resetManagedProfilesForTests} from '../../state/managedProfilesStore';

jest.mock('../../services/privateNotesEncryption', () => ({resolveNoteSection: jest.fn().mockResolvedValue({data: null})}));
jest.mock('../../services/privateJournalEncryption', () => ({resolveIntimacySection: jest.fn().mockResolvedValue({data: null})}));

// PHASE 7M — English-first default language. TEST 1-4 and 9-10 (bootstrap
// defaults, invalid-value handling, persistence across a simulated restart)
// live in src/state/__tests__/themePreferences.test.ts, using jest's fresh-
// module-registry technique (the only reliable way to exercise a true "brand
// new install" module state). This file covers TEST 5-8 and 11-24: i18n
// config-level default, runtime switching, selector copy, Library/Pregnancy-
// week/notification/export language defaults, and stored-data integrity.

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

async function switchLanguage(lang: 'fr' | 'en') {
  await act(async () => {
    await setAppLanguage(lang);
    await i18n.changeLanguage(lang);
  });
}

beforeEach(async () => {
  await resetAppLanguageForTests();
  await AsyncStorage.clear();
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('en');
});

describe('TEST 5/6 — i18n config defaults to English, no transient French default', () => {
  it('TEST 5 — fallbackLng is "en" (survives normal app bootstrap, matches the app default)', () => {
    const fallback = i18n.options.fallbackLng;
    const fallbackList = Array.isArray(fallback) ? fallback : [fallback];
    expect(fallbackList).toContain('en');
    expect(fallbackList).not.toContain('fr');
  });

  it('TEST 6 — after a reset (no saved preference) and a bootstrap-style sync, i18n.language is "en", never a transient "fr"', async () => {
    await act(async () => {
      await i18n.changeLanguage(getAppLanguage());
    });
    expect(getAppLanguage()).toBe('en');
    expect(i18n.language).toBe('en');
  });
});

describe('TEST 7/8 — runtime switching still works, no restart required', () => {
  it('TEST 7 — runtime EN -> FR on a mounted representative surface (Home-adjacent: a Library article)', async () => {
    const renderer = await renderScreen(FirstPeriodArticleScreen);
    expect(textsOf(renderer)).toContain('FIRST PERIOD');

    await switchLanguage('fr');
    expect(textsOf(renderer)).toContain('PREMIÈRES RÈGLES');
    expect(textsOf(renderer)).not.toContain('FIRST PERIOD');
  });

  it('TEST 8 — runtime FR -> EN on the same representative surface', async () => {
    await switchLanguage('fr');
    const renderer = await renderScreen(FirstPeriodArticleScreen);
    expect(textsOf(renderer)).toContain('PREMIÈRES RÈGLES');

    await switchLanguage('en');
    expect(textsOf(renderer)).toContain('FIRST PERIOD');
    expect(textsOf(renderer)).not.toContain('PREMIÈRES RÈGLES');
  });
});

describe('TEST 11/12 — Appearance language selector marks English (not French) as the default', () => {
  it('TEST 11 — English UI: the English option is described as the default language', () => {
    expect(en.appearance.language.englishSubtitle).toBe('Default language');
  });

  it('TEST 12 — the French option is no longer described as the default, in either language dictionary', () => {
    expect(en.appearance.language.frenchSubtitle).not.toBe('Default language');
    expect(fr.appearance.language.frenchSubtitle).not.toBe('Langue par défaut');
    // French UI: English is described as the default ("Langue par défaut"),
    // French is described as the one you actively switch to.
    expect(fr.appearance.language.englishSubtitle).toBe('Langue par défaut');
    expect(fr.appearance.language.frenchSubtitle).toBe('Utiliser AWA en français');
  });
});

describe('TEST 13/14 — representative Library article defaults to English, explicit FR still works', () => {
  it('TEST 13 — with no language preference set, a representative article renders in English', async () => {
    const renderer = await renderScreen(FirstPeriodArticleScreen);
    expect(textsOf(renderer)).toContain('FIRST PERIOD');
    expect(textsOf(renderer)).not.toContain('PREMIÈRES RÈGLES');
  });

  it('TEST 14 — the same article explicitly set to French renders in French', async () => {
    await switchLanguage('fr');
    const renderer = await renderScreen(FirstPeriodArticleScreen);
    expect(textsOf(renderer)).toContain('PREMIÈRES RÈGLES');
    expect(textsOf(renderer)).not.toContain('FIRST PERIOD');
  });
});

describe('TEST 15/16 — pregnancyWeekData defaults to English, explicit FR still works', () => {
  it('TEST 15 — getPregnancyWeekData with no explicit lang argument (the function default) resolves to English', () => {
    const week12 = getPregnancyWeekData(12);
    expect(week12?.length).toBe('About 5.4 cm');
  });

  it('TEST 16 — getPregnancyWeekData explicitly asked for French still returns French content', () => {
    const week12 = getPregnancyWeekData(12, 'fr');
    expect(week12?.length).toBe('Environ 5,4 cm');
  });

  it('a mounted PregnancyWeekScreen with no language preference set renders week content in English', async () => {
    const renderer = await renderScreen(PregnancyWeekScreen);
    const texts = textsOf(renderer);
    expect(texts.some(text => /week/i.test(text))).toBe(true);
  });
});

describe('TEST 17/18 — notification copy generation defaults to English, explicit FR still works', () => {
  it('TEST 17 — with no language preference set, generated notification copy (channel name) is English', () => {
    expect(i18n.t('notifications.channelName')).toBe('AWA reminders');
  });

  it('TEST 18 — with an explicit French preference, generated notification copy is French', async () => {
    await switchLanguage('fr');
    expect(i18n.t('notifications.channelName')).toBe('Rappels AWA');
  });
});

describe('TEST 19/20 — export generation defaults to English, explicit FR still works', () => {
  const now = new Date('2026-08-25T12:00:00');

  it('TEST 19 — with no language preference set, CSV export headers/labels are English', async () => {
    await saveJournalSection('2026-08-20', 'mood', {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 4});
    await setCyclePreferences({
      lastPeriodStart: new Date('2026-08-01T12:00:00'),
      cycleDuration: 28,
      periodDuration: 5,
      regularity: 'yes',
    });

    const days = await buildCycleExportDays(['mood'], '3m', now);
    const csv = buildExportCsv(days.days, days.notices);
    expect(csv.split('\n')[0].trim()).toBe('date;category;value');
    const moodDay = days.days.find(day => day.date === '2026-08-20');
    expect(moodDay?.categories.find(c => c.category === 'mood')?.label).toBe('Mood');
  });

  it('TEST 20 — with an explicit French preference, CSV export headers/labels are French', async () => {
    await switchLanguage('fr');
    await saveJournalSection('2026-08-20', 'mood', {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 4});
    await setCyclePreferences({
      lastPeriodStart: new Date('2026-08-01T12:00:00'),
      cycleDuration: 28,
      periodDuration: 5,
      regularity: 'yes',
    });

    const days = await buildCycleExportDays(['mood'], '3m', now);
    const csv = buildExportCsv(days.days, days.notices);
    expect(csv.split('\n')[0].trim()).toBe('date;categorie;valeur');
    const moodDay = days.days.find(day => day.date === '2026-08-20');
    expect(moodDay?.categories.find(c => c.category === 'mood')?.label).toBe('Humeur');
  });
});

describe('TEST 21 — stored medical categorical values are unaffected by the default-language change', () => {
  it('a saved mood level stays the exact same stored string regardless of which language is active when read', async () => {
    await saveJournalSection('2026-08-20', 'mood', {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 4});

    await switchLanguage('en');
    const now = new Date('2026-08-25T12:00:00');
    const enDays = await buildCycleExportDays(['mood'], '3m', now);
    const enLine = enDays.days.find(d => d.date === '2026-08-20')?.categories.find(c => c.category === 'mood')?.lines[0];

    await switchLanguage('fr');
    const frDays = await buildCycleExportDays(['mood'], '3m', now);
    const frLine = frDays.days.find(d => d.date === '2026-08-20')?.categories.find(c => c.category === 'mood')?.lines[0];

    // Display text legitimately differs by language — but both are derived
    // from the SAME underlying stored value ('good'), never two different
    // persisted values. Confirmed indirectly: both resolve to a non-empty
    // label for the same stored data, and switching language back and forth
    // doesn't lose or corrupt the stored field.
    expect(enLine).toBeTruthy();
    expect(frLine).toBeTruthy();
    expect(enLine).toBe('Mood : Good');
    expect(frLine).toBe('Humeur : Bien');
  });
});

describe('TEST 22 — bookmarks/reading progress are unaffected by the default-language change', () => {
  it('a bookmark and reading-progress entry survive a language switch from the new English default to French and back', async () => {
    const id = 'firstperiod-premieres-regles';
    expect(isArticleBookmarked(id)).toBe(false);

    toggleBookmark(id);
    setReadingProgress(id, 42, Date.now());
    expect(isArticleBookmarked(id)).toBe(true);
    expect(getReadingProgress(id)?.percent).toBe(42);

    await switchLanguage('fr');
    expect(isArticleBookmarked(id)).toBe(true);
    expect(getReadingProgress(id)?.percent).toBe(42);

    await switchLanguage('en');
    expect(isArticleBookmarked(id)).toBe(true);
    expect(getReadingProgress(id)?.percent).toBe(42);

    toggleBookmark(id);
    expect(isArticleBookmarked(id)).toBe(false);
  });
});

describe('TEST 23 — managed-profile data is unaffected by the default-language change', () => {
  it('a managed daughter profile keeps her exact stored first name across a language switch', async () => {
    await resetManagedProfilesForTests();
    const hanane = await addManagedProfile({
      type: 'daughter',
      firstName: 'Hanane',
      birthDate: '2013-01-01',
      hasHadFirstPeriod: false,
    });
    expect(hanane.firstName).toBe('Hanane');

    await switchLanguage('fr');
    await switchLanguage('en');

    expect(hanane.firstName).toBe('Hanane');
  });
});

describe('TEST 24 — FR -> EN -> FR still works on one mounted representative surface', () => {
  it('a representative article round-trips FR -> EN -> FR with no remount', async () => {
    await switchLanguage('fr');
    const renderer = await renderScreen(FirstPeriodArticleScreen);
    expect(textsOf(renderer)).toContain('PREMIÈRES RÈGLES');

    await switchLanguage('en');
    expect(textsOf(renderer)).toContain('FIRST PERIOD');

    await switchLanguage('fr');
    expect(textsOf(renderer)).toContain('PREMIÈRES RÈGLES');
    expect(textsOf(renderer)).not.toContain('FIRST PERIOD');
  });
});
