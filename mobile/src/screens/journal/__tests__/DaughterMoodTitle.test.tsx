import React from 'react';
import fs from 'fs';
import path from 'path';
import fontkit from '@pdf-lib/fontkit';
import {decodeFromBase64} from 'pdf-lib';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StyleSheet, Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import JournalMoodScreen from '../JournalMoodScreen';
import JournalSleepScreen from '../JournalSleepScreen';
import JournalActivityScreen from '../JournalActivityScreen';
import {DAUGHTER_TITLE_BASE_SIZE, DAUGHTER_TITLE_MIN_SIZE, planDaughterTitle} from '../daughterTitleFit';
import {ensureShapingRuntime} from '../../../services/medicalExportPdf';
import {NOTO_SANS_DEVANAGARI_REGULAR_SUBSET_BASE64} from '../../../services/pdfDevanagariFont';
import {setActiveObjective} from '../../../state/onboardingPreferences';
import {unlockIntimacy} from '../../../state/privateSectionAuthStore';
import {addManagedProfile, resetManagedProfilesForTests} from '../../../state/managedProfilesStore';
import {resetActiveProfileForTests, setActiveProfileId} from '../../../state/activeProfileStore';
import {setAppLanguage} from '../../../state/themePreferences';
import i18n from '../../../i18n';
import {fr} from '../../../i18n/locales/fr';
import {en} from '../../../i18n/locales/en';
import {es} from '../../../i18n/locales/es';
import {it as itDictionary} from '../../../i18n/locales/it';
import {tr} from '../../../i18n/locales/tr';
import {ru} from '../../../i18n/locales/ru';
import {de} from '../../../i18n/locales/de';
import {zh} from '../../../i18n/locales/zh';
import {id} from '../../../i18n/locales/id';
import {hi} from '../../../i18n/locales/hi';
import {sq} from '../../../i18n/locales/sq';
import {ja} from '../../../i18n/locales/ja';

// Daughter Mood screen: the title « Humeur de Maissa » was 24 sp and wrapped / was cut between the back and the save button.
// For a DAUGHTER profile only, on this screen only, it is now 20 sp and fitted to the header: one line when it fits; else one line
// at a smaller size down to a 16 sp floor; else two lines at 16 sp — never an ellipsis, never an unreadable size.

/* ------------------------------------------------------------------ planner */

const FONT_DIR = path.join(__dirname, '..', '..', '..', '..', 'android', 'app', 'src', 'main', 'assets', 'fonts');
const fraunces = fontkit.create(fs.readFileSync(path.join(FONT_DIR, 'Fraunces-Regular.ttf')));
ensureShapingRuntime();
const notoDevanagari = fontkit.create(decodeFromBase64(NOTO_SANS_DEVANAGARI_REGULAR_SUBSET_BASE64));

/** Real width of a title in dp at a size, shaped in the title face (Fraunces; Noto for Devanagari; one em per hanzi). */
const realWidth = (text: string, size: number): number => {
  const shaped = (value: string): number => {
    if (/[\u0900-\u097F]/.test(value)) {
      return notoDevanagari.layout(value).positions.reduce((sum, position) => sum + position.xAdvance, 0) / notoDevanagari.unitsPerEm;
    }
    return value ? fraunces.layout(value).advanceWidth / fraunces.unitsPerEm : 0;
  };
  // hanzi are one em wide (drawn by the system CJK font); the Latin first name inside a Chinese title is shaped in the title face
  const hanzi = Array.from(text).filter(char => /[\u4E00-\u9FFF\uFF00-\uFFEF\u3000-\u303F]/.test(char)).length;
  const rest = Array.from(text).filter(char => !/[\u4E00-\u9FFF\uFF00-\uFFEF\u3000-\u303F]/.test(char)).join('');
  return (hanzi + shaped(rest)) * size;
};

const DICTIONARIES = {fr, en, es, it: itDictionary, tr, ru, de, zh, id, hi, sq, ja} as const;
const LANGUAGES = Object.keys(DICTIONARIES) as Array<keyof typeof DICTIONARIES>;
const moodTitle = (language: keyof typeof DICTIONARIES, name: string) =>
  ((DICTIONARIES[language] as unknown as {daughterJournal: {titles: {mood: string}}}).daughterJournal.titles.mood as string).replace('{{name}}', name);

// Width the title really has: window - the bar's 2 x 14 padding - two 48 dp buttons - the header copy's 2 x 8 padding.
const available = (window: number) => window - 28 - 96 - 16;

describe('planDaughterTitle — typography settings', () => {
  it('starts at 20 sp (down from headlineSmall\'s 24 sp), floors at 16 sp, keeps the 4:3 line height', () => {
    expect(DAUGHTER_TITLE_BASE_SIZE).toBe(20);
    expect(DAUGHTER_TITLE_MIN_SIZE).toBe(16);
    expect(planDaughterTitle({title: 'Humeur de Lina', availableWidth: 400})).toEqual({fontSize: 20, lineHeight: 27, numberOfLines: 1});
    expect(planDaughterTitle({title: 'Humeur de Maissa', availableWidth: 0})).toEqual({fontSize: 20, lineHeight: 27, numberOfLines: 1}); // not measured yet
  });

  it('a very long name takes two lines at the 16 sp floor (never smaller, never cut)', () => {
    const plan = planDaughterTitle({title: 'Humeur de Marie-Charlotte-Alexandrine', availableWidth: 200});
    expect(plan).toEqual({fontSize: 16, lineHeight: 21, numberOfLines: 2});
  });

  it('the system font scale is respected: a larger scale needs a smaller size or a second line', () => {
    const normal = planDaughterTitle({title: 'Humeur de Maissa', availableWidth: 220, fontScale: 1});
    const large = planDaughterTitle({title: 'Humeur de Maissa', availableWidth: 220, fontScale: 1.6});
    expect(large.fontSize <= normal.fontSize).toBe(true);
    expect(large.numberOfLines >= normal.numberOfLines).toBe(true);
    expect(large.numberOfLines === 2 || large.fontSize < normal.fontSize).toBe(true);
  });

  it('« Humeur de Maissa » fits on ONE line at 360 dp and 412 dp, at a readable size', () => {
    for (const window of [360, 412]) {
      const plan = planDaughterTitle({title: 'Humeur de Maissa', availableWidth: available(window), fontScale: 1});
      expect([window, plan.numberOfLines]).toEqual([window, 1]);
      expect(plan.fontSize).toBeGreaterThanOrEqual(DAUGHTER_TITLE_MIN_SIZE);
    }
  });

  it.each(LANGUAGES)('%s: one line means the REAL title (shaped in the title face) fits the header; the size is always 16–20 sp', language => {
    for (const name of ['Lina', 'Maissa', 'Maissa-Yasmine', 'Marie-Charlotte', 'Aminata', 'Anastasia', 'Nour El Houda']) {
      const title = moodTitle(language, name);
      for (const window of [320, 360, 412]) {
        for (const fontScale of [1, 1.3]) {
          const plan = planDaughterTitle({title, availableWidth: available(window), fontScale});
          expect(plan.fontSize).toBeGreaterThanOrEqual(DAUGHTER_TITLE_MIN_SIZE);
          expect(plan.fontSize).toBeLessThanOrEqual(DAUGHTER_TITLE_BASE_SIZE);
          if (plan.numberOfLines === 1) {
            expect([language, title, window, fontScale, realWidth(title, plan.fontSize) * fontScale <= available(window)]).toEqual([language, title, window, fontScale, true]);
          } else {
            expect(plan.fontSize).toBe(DAUGHTER_TITLE_MIN_SIZE); // only after the floor is reached
          }
        }
      }
    }
  });
});

/* --------------------------------------------------------------- the screen */

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
let testIndex = 0;

const settle = async () => {
  for (let index = 0; index < 30; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderScreen(element: React.JSX.Element) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">{() => element}</Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const titleNode = (renderer: ReactTestRenderer.ReactTestRenderer, title: string) => renderer.root.findAllByType(Text).filter(node => textOf(node) === title)[0];
const style = (node: ReactTestRenderer.ReactTestInstance) => StyleSheet.flatten(node.props.style) as {fontSize?: number; lineHeight?: number; textAlign?: string; alignSelf?: string};

beforeEach(async () => {
  testIndex += 1;
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8 + Math.floor(testIndex / 28), 1 + (testIndex % 28), 15, 0, 0)});
  await setActiveObjective('cycle');
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  unlockIntimacy();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

const activateDaughter = async (firstName: string) => {
  const daughter = await addManagedProfile({type: 'daughter', firstName, birthDate: '2012-03-15', hasHadFirstPeriod: false});
  await setActiveProfileId(daughter.id);
  unlockIntimacy();
};

describe('Daughter Mood screen title', () => {
  it('« Humeur de Maissa »: complete, one line, 20 sp, centred, shrinkable to a 16 sp floor and never ellipsized', async () => {
    await activateDaughter('Maissa');
    const renderer = await renderScreen(<JournalMoodScreen />);
    const title = titleNode(renderer, 'Humeur de Maissa');
    expect(title).toBeDefined();
    expect(title.props.numberOfLines).toBe(1);
    expect(title.props.adjustsFontSizeToFit).toBe(true);
    expect(title.props.minimumFontScale).toBeCloseTo(16 / 20, 5); // an absolute 16 sp floor
    expect(style(title).fontSize).toBe(20);
    expect(style(title).lineHeight).toBe(27);
    expect(style(title).textAlign).toBe('center');
    expect(style(title).alignSelf).toBe('stretch'); // centred within the whole space between the buttons
    expect(title.props.ellipsizeMode).toBeUndefined();
  });

  it('keeps the back button, the save button and the date subtitle', async () => {
    await activateDaughter('Maissa');
    const renderer = await renderScreen(<JournalMoodScreen />);
    const labels = renderer.root.findAll(node => typeof node.props.onPress === 'function').map(node => node.props.accessibilityLabel);
    expect(labels).toContain('Retour');
    expect(labels).toContain("Enregistrer l'humeur");
    expect(renderer.root.findAllByType(Text).some(node => /\d{4}|\d{1,2}/.test(textOf(node)) && node.props.numberOfLines === 1 && node !== titleNode(renderer, 'Humeur de Maissa'))).toBe(true);
  });

  it('measuring the header re-plans the title: a narrow header with a long name goes to two lines at 16 sp, a wide one stays at 20 sp on one line', async () => {
    await activateDaughter('Marie-Charlotte-Alexandrine');
    const renderer = await renderScreen(<JournalMoodScreen />);
    const full = 'Humeur de Marie-Charlotte-Alexandrine';
    const header = renderer.root.findAll(node => typeof node.props.onLayout === 'function' && StyleSheet.flatten(node.props.style)?.alignItems === 'center' && StyleSheet.flatten(node.props.style)?.flex === 1)[0];
    expect(header).toBeDefined();
    await act(async () => {
      header.props.onLayout({nativeEvent: {layout: {width: 216, height: 60, x: 0, y: 0}}});
    });
    const narrow = titleNode(renderer, full);
    expect(narrow.props.numberOfLines).toBe(2);
    expect(style(narrow).fontSize).toBe(16);
    expect(narrow.props.adjustsFontSizeToFit).toBe(false);
    await act(async () => {
      header.props.onLayout({nativeEvent: {layout: {width: 3000, height: 60, x: 0, y: 0}}}); // Jest's window has fontScale 2
    });
    const wide = titleNode(renderer, full);
    expect(wide.props.numberOfLines).toBe(1);
    expect(style(wide).fontSize).toBe(20);
  });
});

describe('nothing else changes', () => {
  it('the mother\'s Mood title is exactly what it was: no size override, no line limit, no fitting', async () => {
    const renderer = await renderScreen(<JournalMoodScreen />);
    const title = titleNode(renderer, i18n.t('dailyJournalSheet.items.mood.title'));
    expect(title).toBeDefined();
    expect(title.props.adjustsFontSizeToFit).toBeUndefined();
    expect(title.props.minimumFontScale).toBeUndefined();
    expect(style(title).lineHeight).toBe(32);
  });

  it('the other daughter journal screens keep their own 24 sp titles (the adjustment is on the Mood screen only)', async () => {
    await activateDaughter('Maissa');
    for (const [element, title] of [
      [<JournalSleepScreen />, 'Sommeil de Maissa'],
      [<JournalActivityScreen />, 'Activité physique de Maissa'],
    ] as const) {
      const renderer = await renderScreen(element);
      const node = titleNode(renderer, title);
      expect([title, node !== undefined]).toEqual([title, true]);
      expect([title, node.props.adjustsFontSizeToFit]).toEqual([title, undefined]);
      expect([title, style(node).fontSize === 20]).toEqual([title, false]);
    }
  });

  it('the shared header typography is untouched: the source sets the fitted title in the Mood screen only', () => {
    const library = path.resolve(__dirname, '..');
    const users = fs.readdirSync(library).filter(file => /\.tsx?$/.test(file) && fs.readFileSync(path.join(library, file), 'utf8').includes('daughterTitleFit'));
    expect(users.sort()).toEqual(['JournalMoodScreen.tsx']);
  });
});
