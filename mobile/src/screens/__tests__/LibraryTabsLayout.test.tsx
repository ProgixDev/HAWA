import React from 'react';
import fs from 'fs';
import path from 'path';
import fontkit from '@pdf-lib/fontkit';
import {decodeFromBase64} from 'pdf-lib';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import LibraryScreen from '../LibraryScreen';
import {LIBRARY_TABS_CHROME, LIBRARY_TAB_MEASURE_BUFFER, libraryTabScrollOffset, planLibraryTabs} from '../libraryTabsLayout';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {setAppearanceMode, setAppLanguage, setSelectedThemeId, setTrueBlackEnabled, resetAppLanguageForTests, type AwaAppLanguage} from '../../state/themePreferences';
import {ensureShapingRuntime} from '../../services/medicalExportPdf';
import {NOTO_SANS_DEVANAGARI_BOLD_SUBSET_BASE64} from '../../services/pdfDevanagariFont';
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
import {ko} from '../../i18n/locales/ko';
import {bn} from '../../i18n/locales/bn';
import {ptPT, ptBRFull} from '../../testUtils/portugueseDictionaries';

// The category tabs of the Library (Tout · Médical · Religieux · À la une). They are a segmented control whose four equal segments
// used to be a fixed quarter of the strip each, so a label wider than its quarter ("Religieux") wrapped onto a second line. Now every
// tab has the same width, the larger of an equal share and the natural single-line width of the widest tab, and the strip scrolls
// horizontally when the tabs do not fit (libraryTabsLayout.ts). Labels are one line (numberOfLines 1, never shrunk).

jest.mock('../../state/libraryStore', () => ({
  loadLibraryState: jest.fn().mockResolvedValue({bookmarks: [], readingProgress: {}}),
  getCachedLibraryState: jest.fn().mockReturnValue({bookmarks: [], readingProgress: {}}),
  subscribeLibraryState: jest.fn().mockReturnValue(() => {}),
  toggleBookmark: jest.fn().mockReturnValue(true),
  isArticleBookmarked: jest.fn().mockReturnValue(false),
  saveScrollPosition: jest.fn(),
}));

jest.mock('../../state/onboardingPreferences', () => {
  const actual = jest.requireActual('../../state/onboardingPreferences');
  return {
    ...actual,
    getSelectedObjective: jest.fn().mockReturnValue('cycle'),
    getSpiritualMarkersEnabled: jest.fn().mockReturnValue(true),
    getActiveObjective: jest.fn().mockReturnValue('cycle'),
  };
});

const DICTIONARIES = {fr, en, es, it: itDictionary, tr, ru, de, zh, id, hi, sq, ja, ko, 'pt-PT': ptPT, 'pt-BR': ptBRFull, bn} as const;
const LANGUAGES = Object.keys(DICTIONARIES) as AwaAppLanguage[];
const TAB_KEYS = ['all', 'medical', 'religious', 'featured'] as const;
const labelsOf = (language: AwaAppLanguage): string[] =>
  TAB_KEYS.map(key => ((DICTIONARIES as Record<string, unknown>)[language] as {library: {screen: {tabs: Record<string, string>}}}).library.screen.tabs[key]);

/* ------------------------------------------------------------------ planner */

describe('planLibraryTabs', () => {
  it('is not planned until the strip has been measured (the tabs then share it with flex)', () => {
    expect(planLibraryTabs({containerWidth: 0, naturalWidths: [80, 80, 80, 80], count: 4})).toEqual({itemWidth: null, contentWidth: null, scrollable: false, innerWidth: 0});
    expect(planLibraryTabs({containerWidth: 320, naturalWidths: [], count: 0}).itemWidth).toBeNull();
  });

  it('keeps four equal shares of the strip when every label fits (the original segmented look)', () => {
    const plan = planLibraryTabs({containerWidth: 360, naturalWidths: [50, 70, 80, 75], count: 4});
    expect(plan.innerWidth).toBe(360 - LIBRARY_TABS_CHROME);
    expect(plan.itemWidth).toBe((360 - LIBRARY_TABS_CHROME) / 4);
    expect(plan.contentWidth).toBe(360 - LIBRARY_TABS_CHROME);
    expect(plan.scrollable).toBe(false);
  });

  it('widens every tab to the widest label (plus a safety margin) and scrolls when they no longer fit', () => {
    const plan = planLibraryTabs({containerWidth: 320, naturalWidths: [50, 70, 96.2, 75], count: 4});
    expect(plan.itemWidth).toBe(Math.ceil(96.2) + LIBRARY_TAB_MEASURE_BUFFER);
    expect(plan.contentWidth).toBe((plan.itemWidth as number) * 4);
    expect(plan.scrollable).toBe(true);
  });

  it('a label only just wider than its share widens the tabs without scrolling when the strip still has room', () => {
    const plan = planLibraryTabs({containerWidth: 360, naturalWidths: [60, 60, 90, 60], count: 4});
    expect(plan.itemWidth).toBe(92); // share is 88: the widest label (90 + margin) wins
    expect(plan.scrollable).toBe(true); // 4 x 92 = 368 > 352
  });

  it('ignores a missing / non-finite measurement', () => {
    const plan = planLibraryTabs({containerWidth: 360, naturalWidths: [NaN, undefined as never, 40], count: 4});
    expect(plan.itemWidth).toBe(88);
  });

  it('scroll offset keeps the active tab in view: centred when possible, clamped at both ends', () => {
    const base = {itemWidth: 100, innerWidth: 300, contentWidth: 400};
    expect([0, 1, 2, 3].map(index => libraryTabScrollOffset({...base, index}))).toEqual([0, 0, 100, 100]);
    expect(libraryTabScrollOffset({itemWidth: 100, innerWidth: 400, contentWidth: 400, index: 3})).toBe(0); // nothing to scroll
  });
});

/* ------------------------------------------------ real glyph widths, all languages */

const FONT_DIR = path.join(__dirname, '..', '..', '..', 'android', 'app', 'src', 'main', 'assets', 'fonts');
const interSemiBold = fontkit.create(fs.readFileSync(path.join(FONT_DIR, 'Inter-SemiBold.ttf')));
ensureShapingRuntime();
const notoBold = fontkit.create(decodeFromBase64(NOTO_SANS_DEVANAGARI_BOLD_SUBSET_BASE64));
const LABEL_SIZE = 12; // labelMedium
const TAB_CHROME = 4 + 14 + 4 + 4; // padding + icon + gap + padding (styles.tab)

/** Natural one-line width of a tab in dp at a font scale: Inter (Latin / Cyrillic / Turkish), Noto Devanagari for Hindi, one em per hanzi. */
const naturalTabWidth = (label: string, fontScale: number): number => {
  let em: number;
  if (/[ऀ-ॿ]/.test(label)) {
    em = notoBold.layout(label).positions.reduce((sum, position) => sum + position.xAdvance, 0) / notoBold.unitsPerEm;
  } else if (/[一-鿿]/.test(label)) {
    em = Array.from(label).length;
  } else {
    em = interSemiBold.layout(label).advanceWidth / interSemiBold.unitsPerEm;
  }
  return TAB_CHROME + em * LABEL_SIZE * fontScale;
};

describe('every label stays on one line: all ten languages, small to large phones, up to the largest font scale', () => {
  const WIDTHS = [320, 360, 412];
  const SCALES = [1, 1.15, 1.3, 1.5, 2];

  it.each(LANGUAGES)('%s: the planned tab width is never narrower than the widest label', language => {
    const labels = labelsOf(language);
    for (const width of WIDTHS) {
      for (const scale of SCALES) {
        const naturals = labels.map(label => naturalTabWidth(label, scale));
        const plan = planLibraryTabs({containerWidth: width, naturalWidths: naturals, count: 4});
        const widest = Math.max(...naturals);
        expect([language, width, scale, (plan.itemWidth as number) >= widest]).toEqual([language, width, scale, true]);
        // all tabs the same width; it never drops below an equal share
        expect((plan.itemWidth as number) >= plan.innerWidth / 4).toBe(true);
        // scrolling exactly when the tabs together are wider than the strip
        expect([language, width, scale, plan.scrollable]).toEqual([language, width, scale, (plan.contentWidth as number) > plan.innerWidth + 0.5]);
      }
    }
  });

  it('French "Religieux" — the reported case — no longer wraps: at a larger font size the old quarter was too narrow, the new tab is not', () => {
    const [width, scale] = [360, 1.3];
    const naturals = labelsOf('fr').map(label => naturalTabWidth(label, scale));
    const oldShare = (width - LIBRARY_TABS_CHROME) / 4;
    expect(naturals[2]).toBeGreaterThan(oldShare); // "Religieux" did not fit its quarter
    const plan = planLibraryTabs({containerWidth: width, naturalWidths: naturals, count: 4});
    expect(plan.itemWidth as number).toBeGreaterThanOrEqual(naturals[2]);
    expect(plan.scrollable).toBe(true); // and the strip scrolls rather than cutting a label
  });

  it('at the default font scale on a 360 dp phone the four French tabs keep their equal quarters', () => {
    const naturals = labelsOf('fr').map(label => naturalTabWidth(label, 1));
    const plan = planLibraryTabs({containerWidth: 360, naturalWidths: naturals, count: 4});
    expect(plan.scrollable).toBe(false);
    expect(plan.itemWidth).toBe((360 - LIBRARY_TABS_CHROME) / 4);
  });
});

/* --------------------------------------------------------------- the screen */

const Stack = createNativeStackNavigator();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 740}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const navigate = jest.fn();

async function renderLibrary() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">{() => <LibraryScreen navigation={{navigate} as never} route={{} as never} />}</Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const tabNodes = (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const nodes = renderer.root.findAll(node => node.props.accessibilityRole === 'tab' && typeof node.props.onPress === 'function');
  return nodes.filter((node, index) => nodes.findIndex(other => other.props.accessibilityState === node.props.accessibilityState && other.props.onPress === node.props.onPress) === index);
};
const flat = (style: unknown): Record<string, unknown> => {
  const resolve = (value: unknown): Record<string, unknown> =>
    typeof value === 'function' ? resolve((value as (state: {pressed: boolean}) => unknown)({pressed: false})) : Array.isArray(value) ? Object.assign({}, ...value.map(resolve)) : ((value as Record<string, unknown>) ?? {});
  return resolve(style);
};
const stripNode = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAll(node => typeof node.props.onLayout === 'function' && flat(node.props.style).minHeight === 48 && flat(node.props.style).overflow === 'hidden')[0];
const measureRow = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => node.props.importantForAccessibility === 'no-hide-descendants' && flat(node.props.style).opacity === 0 && flat(node.props.style).position === 'absolute')[0];
const tabsScroll = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => node.props.horizontal === true && node.props.showsHorizontalScrollIndicator === false && node.props.scrollEnabled !== undefined)[0];

async function layoutStrip(renderer: ReactTestRenderer.ReactTestRenderer, stripWidth: number, naturalWidths: number[]) {
  await act(async () => {
    stripNode(renderer).props.onLayout({nativeEvent: {layout: {width: stripWidth, height: 48, x: 0, y: 0}}});
  });
  const items = measureRow(renderer).findAll(node => typeof node.props.onLayout === 'function' && node !== measureRow(renderer));
  const unique = items.filter((node, index) => items.findIndex(other => other.props.onLayout === node.props.onLayout) === index);
  expect(unique).toHaveLength(4);
  for (const [index, node] of unique.entries()) {
    await act(async () => {
      node.props.onLayout({nativeEvent: {layout: {width: naturalWidths[index], height: 32, x: 0, y: 0}}});
    });
  }
}

beforeEach(async () => {
  navigate.mockClear();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  await resetAppLanguageForTests();
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('LibraryScreen category tabs', () => {
  it.each(LANGUAGES)('%s: four tabs, each label is a single line that is never shrunk, with its icon beside it', async language => {
    await act(async () => {
      await setAppLanguage(language);
      await i18n.changeLanguage(language);
    });
    const renderer = await renderLibrary();
    const tabs = tabNodes(renderer);
    expect(tabs).toHaveLength(4);
    const labels = labelsOf(language);
    tabs.forEach((tab, index) => {
      const text = tab.findAll(node => node.props.numberOfLines !== undefined && node.props.children === labels[index]);
      expect([language, labels[index], text.length > 0]).toEqual([language, labels[index], true]);
      expect(text.every(node => node.props.numberOfLines === 1)).toBe(true);
      expect(flat(tab.props.style).flexDirection).toBe('row'); // icon and label side by side...
      expect(flat(tab.props.style).alignItems).toBe('center'); // ...vertically centred
      expect(flat(tab.props.style).justifyContent).toBe('center');
    });
  });

  it('the measuring row is hidden from the screen and from accessibility, and holds the same four labels', async () => {
    const renderer = await renderLibrary();
    const row = measureRow(renderer);
    expect(row.props.accessibilityElementsHidden).toBe(true);
    expect(row.props.pointerEvents ?? flat(row.props.style).pointerEvents).toBe('none');
    expect(flat(row.props.style).opacity).toBe(0);
    expect(flat(row.props.style).position).toBe('absolute');
    expect(tabNodes(renderer).length).toBe(4); // the real, announced tabs are unchanged
  });

  it('when every label fits: four equal tabs sharing the strip, no scrolling', async () => {
    const renderer = await renderLibrary();
    await layoutStrip(renderer, 360, [60, 75, 80, 78]);
    const widths = tabNodes(renderer).map(tab => flat(tab.props.style).width);
    expect(widths).toEqual(Array(4).fill((360 - LIBRARY_TABS_CHROME) / 4));
    expect(tabsScroll(renderer).props.scrollEnabled).toBe(false);
  });

  it('when a label is wider than its quarter ("Religieux"): every tab grows to it and the strip scrolls', async () => {
    const renderer = await renderLibrary();
    await layoutStrip(renderer, 320, [58, 84, 96, 90]);
    const widths = tabNodes(renderer).map(tab => flat(tab.props.style).width as number);
    expect(new Set(widths).size).toBe(1); // equal
    expect(widths[0]).toBe(96 + LIBRARY_TAB_MEASURE_BUFFER); // >= widest natural width
    expect(widths[0] * 4).toBeGreaterThan(320 - LIBRARY_TABS_CHROME);
    expect(tabsScroll(renderer).props.scrollEnabled).toBe(true);
  });

  it('the sliding indicator follows the new tab width', async () => {
    const renderer = await renderLibrary();
    await layoutStrip(renderer, 320, [58, 84, 96, 90]);
    const indicator = renderer.root.findAll(node => node.props.pointerEvents === 'none' && flat(node.props.style).width === 98 && flat(node.props.style).position === 'absolute')[0];
    expect(indicator).toBeDefined();
  });

  it('choosing a tab still selects it (filtering and navigation are untouched)', async () => {
    const renderer = await renderLibrary();
    await layoutStrip(renderer, 320, [58, 84, 96, 90]);
    expect(tabNodes(renderer).map(tab => tab.props.accessibilityState.selected)).toEqual([true, false, false, false]);
    await act(async () => {
      tabNodes(renderer)[2].props.onPress();
    });
    expect(tabNodes(renderer).map(tab => tab.props.accessibilityState.selected)).toEqual([false, false, true, false]);
    await act(async () => {
      tabNodes(renderer)[1].props.onPress();
    });
    expect(tabNodes(renderer).map(tab => tab.props.accessibilityState.selected)).toEqual([false, true, false, false]);
    // "À la une" opens the featured screen, exactly as before
    await act(async () => {
      tabNodes(renderer)[3].props.onPress();
    });
    expect(navigate).toHaveBeenCalledWith('FeaturedArticles');
  });
});
