import React from 'react';
import fs from 'fs';
import path from 'path';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StatusBar} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';

import PregnancyWeeklyArticleScreen from '../library/PregnancyWeeklyArticleScreen';
import BabyDevelopmentArticleScreen from '../library/BabyDevelopmentArticleScreen';
import MedicalExamsArticleScreen from '../library/MedicalExamsArticleScreen';
import ChildbirthPrepArticleScreen from '../library/ChildbirthPrepArticleScreen';
import PregnancyExerciseArticleScreen from '../library/PregnancyExerciseArticleScreen';
import PerineumStrengtheningArticleScreen from '../library/PerineumStrengtheningArticleScreen';
import PostpartumRecoveryArticleScreen from '../library/PostpartumRecoveryArticleScreen';
import PostpartumPeriodReturnArticleScreen from '../library/PostpartumPeriodReturnArticleScreen';
import LochiaArticleScreen from '../library/LochiaArticleScreen';
import NifasMedicalArticleScreen from '../library/NifasMedicalArticleScreen';
import BreastfeedingArticleScreen from '../library/BreastfeedingArticleScreen';
import BabyBluesArticleScreen from '../library/BabyBluesArticleScreen';

// E13.5 — Library bespoke article screens, Batch 5 (Pregnancy + Postpartum,
// 12 files). Every file previously hardcoded its own local
// CREAM/INK/ROSE/BORDER(+BODY/MUTED/GREEN) palette with zero useAwaTheme()
// and a fixed `barStyle="dark-content"`. A deliberate audit of the lochia/
// bleeding-evolution content (LochiaArticleScreen, NifasMedicalArticleScreen,
// PostpartumPeriodReturnArticleScreen) confirmed those stages are
// differentiated entirely through TEXT LABELS and uniformly-accented icons,
// never through genuine color-coded swatches — matching the pattern already
// established across 48 prior sibling files. BabyBluesArticleScreen's real
// two-state distinction (baby blues vs. postpartum depression) maps cleanly
// onto the existing success/warning tokens with no loss of meaning. Every
// file in this batch is 100% migrated with zero remaining hex/rgba literals.

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
   STATIC GUARD — all 12 E13.5 target files.
============================================================ */

const TARGET_FILES: Array<[string, string]> = [
  ['PregnancyWeeklyArticleScreen', '../library/PregnancyWeeklyArticleScreen.tsx'],
  ['BabyDevelopmentArticleScreen', '../library/BabyDevelopmentArticleScreen.tsx'],
  ['MedicalExamsArticleScreen', '../library/MedicalExamsArticleScreen.tsx'],
  ['ChildbirthPrepArticleScreen', '../library/ChildbirthPrepArticleScreen.tsx'],
  ['PregnancyExerciseArticleScreen', '../library/PregnancyExerciseArticleScreen.tsx'],
  ['PerineumStrengtheningArticleScreen', '../library/PerineumStrengtheningArticleScreen.tsx'],
  ['PostpartumRecoveryArticleScreen', '../library/PostpartumRecoveryArticleScreen.tsx'],
  ['PostpartumPeriodReturnArticleScreen', '../library/PostpartumPeriodReturnArticleScreen.tsx'],
  ['LochiaArticleScreen', '../library/LochiaArticleScreen.tsx'],
  ['NifasMedicalArticleScreen', '../library/NifasMedicalArticleScreen.tsx'],
  ['BreastfeedingArticleScreen', '../library/BreastfeedingArticleScreen.tsx'],
  ['BabyBluesArticleScreen', '../library/BabyBluesArticleScreen.tsx'],
];

describe('E13.5 Library articles (Pregnancy + Postpartum) — static appearance-resolution guard', () => {
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

  it('all 12 files are fully migrated — zero remaining structural hex/rgba literals (lochia/bleeding-evolution content confirmed text-based, not color-swatch-based; BabyBlues confirmed mapped onto existing success/warning tokens)', () => {
    for (const [, relativePath] of TARGET_FILES) {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
      expect(source).not.toMatch(/rgba\(/);
    }
  });

  it('BabyBluesArticleScreen intentionally pairs success/warning tokens for its two-state comparison (documented, not a fixed hex exception)', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../library/BabyBluesArticleScreen.tsx'), 'utf8');
    expect(source).toMatch(/theme\.colors\.success/);
    expect(source).toMatch(/theme\.colors\.warning/);
  });
});

/* ============================================================
   RUNTIME — representative screens from both subgroups.
============================================================ */

const RUNTIME_SCREENS: Array<[string, React.ComponentType<any>]> = [
  ['PregnancyWeeklyArticleScreen', PregnancyWeeklyArticleScreen],
  ['MedicalExamsArticleScreen', MedicalExamsArticleScreen],
  ['LochiaArticleScreen', LochiaArticleScreen],
  ['NifasMedicalArticleScreen', NifasMedicalArticleScreen],
  ['BabyBluesArticleScreen', BabyBluesArticleScreen],
  ['BreastfeedingArticleScreen', BreastfeedingArticleScreen],
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
      await setSelectedThemeId('warm-sand');
    });

    expect(firstBackgroundColor(renderer)).not.toBe(before);
  });
});

describe('remaining E13.5 screens render without crashing under the theme provider', () => {
  const OTHER_SCREENS: Array<[string, React.ComponentType<any>]> = [
    ['BabyDevelopmentArticleScreen', BabyDevelopmentArticleScreen],
    ['ChildbirthPrepArticleScreen', ChildbirthPrepArticleScreen],
    ['PregnancyExerciseArticleScreen', PregnancyExerciseArticleScreen],
    ['PerineumStrengtheningArticleScreen', PerineumStrengtheningArticleScreen],
    ['PostpartumRecoveryArticleScreen', PostpartumRecoveryArticleScreen],
    ['PostpartumPeriodReturnArticleScreen', PostpartumPeriodReturnArticleScreen],
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
