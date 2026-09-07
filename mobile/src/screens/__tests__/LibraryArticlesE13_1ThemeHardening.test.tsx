import React from 'react';
import fs from 'fs';
import path from 'path';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StatusBar} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';

import RegularIrregularCycleArticleScreen from '../library/RegularIrregularCycleArticleScreen';
import CyclePhasesArticleScreen from '../library/CyclePhasesArticleScreen';
import CycleVitalSignArticleScreen from '../library/CycleVitalSignArticleScreen';
import UnderstandMenstrualFlowArticleScreen from '../library/UnderstandMenstrualFlowArticleScreen';
import FlowMenstrualArticleScreen from '../library/FlowMenstrualArticleScreen';
import FlowColorsTexturesArticleScreen from '../library/FlowColorsTexturesArticleScreen';
import PmsArticleScreen from '../library/PmsArticleScreen';
import PeriodPainArticleScreen from '../library/PeriodPainArticleScreen';
import HydrationCycleArticleScreen from '../library/HydrationCycleArticleScreen';
import SleepHormonesArticleScreen from '../library/SleepHormonesArticleScreen';
import MoodHormonesArticleScreen from '../library/MoodHormonesArticleScreen';
import ExerciseCycleSupportArticleScreen from '../library/ExerciseCycleSupportArticleScreen';

// E13.1 — Library bespoke article screens, Batch 1 (Cycle Basics + Lifestyle,
// 12 files). Every file previously hardcoded its own local CREAM/INK/ROSE(or
// PURPLE/PINK/BROWN)/BORDER(+BODY/MUTED/GREEN) palette with zero useAwaTheme()
// and a fixed `barStyle="dark-content"`. Mirrors the established pattern from
// this session's other *ThemeHardening suites: (1) a static appearance-
// resolution guard across all 12 files, and (2) runtime Light/Dark/True-Black/
// Premium-palette propagation on a representative subset. The remaining 60
// bespoke articles (E13.2-E13.6) are untouched and out of scope.

jest.mock('../../state/libraryStore', () => ({
  loadLibraryState: jest.fn().mockResolvedValue({bookmarks: [], readingProgress: {}}),
  getCachedLibraryState: jest.fn().mockReturnValue({bookmarks: [], readingProgress: {}}),
  subscribeLibraryState: jest.fn().mockReturnValue(() => {}),
  toggleBookmark: jest.fn().mockReturnValue(true),
  isArticleBookmarked: jest.fn().mockReturnValue(false),
  saveScrollPosition: jest.fn(),
  getReadingSessionState: jest.fn().mockReturnValue({readingStatus: 'not_started', elapsedSeconds: 0}),
  setReadingProgress: jest.fn(),
  setReadingSessionMeta: jest.fn(),
}));

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

function firstBackgroundColor(renderer: ReactTestRenderer.ReactTestRenderer): unknown {
  const match = renderer.root.findAll(node => {
    if (!node.props || !node.props.style) {return false;}
    return typeof flattenStyle(node.props.style).backgroundColor !== 'undefined';
  })[0];
  return match ? flattenStyle(match.props.style).backgroundColor : undefined;
}

async function renderScreen(Screen: React.ComponentType<any>) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <Screen navigation={{goBack: jest.fn(), navigate: jest.fn()} as any} route={{params: {articleId: 'test'}} as any} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

beforeEach(async () => {
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

/* ============================================================
   STATIC GUARD — all 12 E13.1 target files.
============================================================ */

const TARGET_FILES: Array<[string, string]> = [
  ['RegularIrregularCycleArticleScreen', '../library/RegularIrregularCycleArticleScreen.tsx'],
  ['CyclePhasesArticleScreen', '../library/CyclePhasesArticleScreen.tsx'],
  ['CycleVitalSignArticleScreen', '../library/CycleVitalSignArticleScreen.tsx'],
  ['UnderstandMenstrualFlowArticleScreen', '../library/UnderstandMenstrualFlowArticleScreen.tsx'],
  ['FlowMenstrualArticleScreen', '../library/FlowMenstrualArticleScreen.tsx'],
  ['FlowColorsTexturesArticleScreen', '../library/FlowColorsTexturesArticleScreen.tsx'],
  ['PmsArticleScreen', '../library/PmsArticleScreen.tsx'],
  ['PeriodPainArticleScreen', '../library/PeriodPainArticleScreen.tsx'],
  ['HydrationCycleArticleScreen', '../library/HydrationCycleArticleScreen.tsx'],
  ['SleepHormonesArticleScreen', '../library/SleepHormonesArticleScreen.tsx'],
  ['MoodHormonesArticleScreen', '../library/MoodHormonesArticleScreen.tsx'],
  ['ExerciseCycleSupportArticleScreen', '../library/ExerciseCycleSupportArticleScreen.tsx'],
];

describe('E13.1 Library articles (Cycle Basics + Lifestyle) — static appearance-resolution guard', () => {
  it.each(TARGET_FILES)(
    '%s never resolves appearance locally (no useColorScheme, no isDark branch, no theme.id branch, no legacy local palette)',
    (_name, relativePath) => {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      expect(source).not.toMatch(/useColorScheme\s*\(/);
      expect(source).not.toMatch(/Appearance\.getColorScheme\s*\(/);
      expect(source).not.toMatch(/\bisDark\b/);
      expect(source).not.toMatch(/if\s*\(\s*theme\.id\s*===/);
      expect(source).not.toMatch(/switch\s*\(\s*theme\.id\s*\)/);
      expect(source).not.toMatch(/\bconst\s+CREAM\s*=/);
      expect(source).not.toMatch(/\bconst\s+INK\s*=/);
      expect(source).not.toMatch(/\bconst\s+BORDER\s*=/);
      expect(source).not.toMatch(/barStyle="dark-content"/);
      expect(source).toMatch(/barStyle=\{theme\.statusBarStyle\}/);
      expect(source).toMatch(/useAwaTheme\s*\(/);
      expect(source).toMatch(/function createStyles\(theme: ResolvedAwaTheme\)/);
    },
  );

  it('FlowColorsTexturesArticleScreen keeps its documented real flow-color educational swatches (legitimate exception)', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../library/FlowColorsTexturesArticleScreen.tsx'), 'utf8');
    for (const hex of ['#C42031', '#7F2D31', '#9E7462', '#E66770', '#F47B2A']) {
      expect(source).toContain(hex);
    }
    expect(source).toMatch(/fixed: these hex values are real educational flow-color swatches/);
  });

  it('no other file in the batch retains a bare structural hex/rgba literal', () => {
    const exceptionFile = path.resolve(__dirname, '../library/FlowColorsTexturesArticleScreen.tsx');
    for (const [, relativePath] of TARGET_FILES) {
      const resolved = path.resolve(__dirname, relativePath);
      if (resolved === exceptionFile) {continue;}
      const source = fs.readFileSync(resolved, 'utf8');
      expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
      expect(source).not.toMatch(/rgba\(/);
    }
  });
});

/* ============================================================
   RUNTIME — representative screens: resolved-theme propagation.
============================================================ */

const RUNTIME_SCREENS: Array<[string, React.ComponentType<any>]> = [
  ['RegularIrregularCycleArticleScreen', RegularIrregularCycleArticleScreen],
  ['CyclePhasesArticleScreen', CyclePhasesArticleScreen],
  ['FlowColorsTexturesArticleScreen', FlowColorsTexturesArticleScreen],
  ['HydrationCycleArticleScreen', HydrationCycleArticleScreen],
];

describe.each(RUNTIME_SCREENS)('%s — resolved global theme', (_name, Screen) => {
  it('page background resolves from the global theme and changes Light -> Dark without remounting', async () => {
    const renderer = await renderScreen(Screen);
    const before = firstBackgroundColor(renderer);
    expect(before).toBeDefined();

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(firstBackgroundColor(renderer)).not.toBe(before);
  });

  it('StatusBar barStyle follows the resolved theme', async () => {
    const renderer = await renderScreen(Screen);
    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(statusBar().props.barStyle).toBe('light-content');
  });

  it('True Black is inherited from the Provider without any local handling', async () => {
    const renderer = await renderScreen(Screen);

    await act(async () => {
      await setAppearanceMode('dark');
      await setTrueBlackEnabled(false);
    });
    const before = firstBackgroundColor(renderer);

    await act(async () => {
      await setTrueBlackEnabled(true);
    });

    expect(firstBackgroundColor(renderer)).not.toBe(before);
  });

  it('a Premium palette switch changes the page background (no palette-ID branching in this screen)', async () => {
    const renderer = await renderScreen(Screen);
    const before = firstBackgroundColor(renderer);

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(firstBackgroundColor(renderer)).not.toBe(before);
  });
});

describe('remaining E13.1 screens render without crashing under the theme provider', () => {
  const OTHER_SCREENS: Array<[string, React.ComponentType<any>]> = [
    ['CycleVitalSignArticleScreen', CycleVitalSignArticleScreen],
    ['UnderstandMenstrualFlowArticleScreen', UnderstandMenstrualFlowArticleScreen],
    ['FlowMenstrualArticleScreen', FlowMenstrualArticleScreen],
    ['PmsArticleScreen', PmsArticleScreen],
    ['PeriodPainArticleScreen', PeriodPainArticleScreen],
    ['SleepHormonesArticleScreen', SleepHormonesArticleScreen],
    ['MoodHormonesArticleScreen', MoodHormonesArticleScreen],
    ['ExerciseCycleSupportArticleScreen', ExerciseCycleSupportArticleScreen],
  ];

  it.each(OTHER_SCREENS)('%s renders and its background changes Light -> Dark', async (_name, Screen) => {
    const renderer = await renderScreen(Screen);
    const before = firstBackgroundColor(renderer);
    expect(before).toBeDefined();

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(firstBackgroundColor(renderer)).not.toBe(before);
  });
});
