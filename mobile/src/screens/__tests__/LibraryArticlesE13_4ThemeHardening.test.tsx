import React from 'react';
import fs from 'fs';
import path from 'path';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StatusBar} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';

import PcosIntroArticleScreen from '../library/PcosIntroArticleScreen';
import PcosCycleFertilityArticleScreen from '../library/PcosCycleFertilityArticleScreen';
import PcosSkinHairArticleScreen from '../library/PcosSkinHairArticleScreen';
import PcosDiagnosisArticleScreen from '../library/PcosDiagnosisArticleScreen';
import PcosMetabolismArticleScreen from '../library/PcosMetabolismArticleScreen';
import PcosLifestyleManagementArticleScreen from '../library/PcosLifestyleManagementArticleScreen';
import PcosHormonalAcneArticleScreen from '../library/PcosHormonalAcneArticleScreen';
import MenopauseTransitionArticleScreen from '../library/MenopauseTransitionArticleScreen';
import HotFlashesArticleScreen from '../library/HotFlashesArticleScreen';
import BoneHealthArticleScreen from '../library/BoneHealthArticleScreen';
import MenopauseTreatmentsArticleScreen from '../library/MenopauseTreatmentsArticleScreen';
import MenopauseHormonesArticleScreen from '../library/MenopauseHormonesArticleScreen';

// E13.4 — Library bespoke article screens, Batch 4 (PCOS/SOPK + Menopause,
// 12 files). Every file previously hardcoded its own local
// CREAM/INK/ROSE/BORDER(+BODY/MUTED/GREEN) palette with zero useAwaTheme()
// and a fixed `barStyle="dark-content"`. A deliberate medical-color audit of
// all 12 files (cycle irregularity, androgens, insulin resistance, diagnosis
// criteria, hormone fluctuation, hot flashes, bone health, treatment options,
// and an explicit check for any perimenopause/menopause/postmenopause stage
// legend or FSH/estradiol chart) found NO genuine data/educational
// color-coding anywhere in this batch — every file is 100% migrated with
// zero remaining hex/rgba literals.

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
   STATIC GUARD — all 12 E13.4 target files.
============================================================ */

const TARGET_FILES: Array<[string, string]> = [
  ['PcosIntroArticleScreen', '../library/PcosIntroArticleScreen.tsx'],
  ['PcosCycleFertilityArticleScreen', '../library/PcosCycleFertilityArticleScreen.tsx'],
  ['PcosSkinHairArticleScreen', '../library/PcosSkinHairArticleScreen.tsx'],
  ['PcosDiagnosisArticleScreen', '../library/PcosDiagnosisArticleScreen.tsx'],
  ['PcosMetabolismArticleScreen', '../library/PcosMetabolismArticleScreen.tsx'],
  ['PcosLifestyleManagementArticleScreen', '../library/PcosLifestyleManagementArticleScreen.tsx'],
  ['PcosHormonalAcneArticleScreen', '../library/PcosHormonalAcneArticleScreen.tsx'],
  ['MenopauseTransitionArticleScreen', '../library/MenopauseTransitionArticleScreen.tsx'],
  ['HotFlashesArticleScreen', '../library/HotFlashesArticleScreen.tsx'],
  ['BoneHealthArticleScreen', '../library/BoneHealthArticleScreen.tsx'],
  ['MenopauseTreatmentsArticleScreen', '../library/MenopauseTreatmentsArticleScreen.tsx'],
  ['MenopauseHormonesArticleScreen', '../library/MenopauseHormonesArticleScreen.tsx'],
];

describe('E13.4 Library articles (PCOS/SOPK + Menopause) — static appearance-resolution guard', () => {
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

  it('all 12 files are fully migrated — zero remaining structural hex/rgba literals (no genuine PCOS/menopause medical-data colors, and no FSH/estradiol or stage legend, were found in this batch)', () => {
    for (const [, relativePath] of TARGET_FILES) {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
      expect(source).not.toMatch(/rgba\(/);
    }
  });
});

/* ============================================================
   RUNTIME — representative screens from both subgroups.
============================================================ */

const RUNTIME_SCREENS: Array<[string, React.ComponentType<any>]> = [
  ['PcosIntroArticleScreen', PcosIntroArticleScreen],
  ['PcosDiagnosisArticleScreen', PcosDiagnosisArticleScreen],
  ['MenopauseTransitionArticleScreen', MenopauseTransitionArticleScreen],
  ['MenopauseHormonesArticleScreen', MenopauseHormonesArticleScreen],
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
      await setSelectedThemeId('sage-serenity');
    });

    expect(firstBackgroundColor(renderer)).not.toBe(before);
  });
});

describe('remaining E13.4 screens render without crashing under the theme provider', () => {
  const OTHER_SCREENS: Array<[string, React.ComponentType<any>]> = [
    ['PcosCycleFertilityArticleScreen', PcosCycleFertilityArticleScreen],
    ['PcosSkinHairArticleScreen', PcosSkinHairArticleScreen],
    ['PcosMetabolismArticleScreen', PcosMetabolismArticleScreen],
    ['PcosLifestyleManagementArticleScreen', PcosLifestyleManagementArticleScreen],
    ['PcosHormonalAcneArticleScreen', PcosHormonalAcneArticleScreen],
    ['HotFlashesArticleScreen', HotFlashesArticleScreen],
    ['BoneHealthArticleScreen', BoneHealthArticleScreen],
    ['MenopauseTreatmentsArticleScreen', MenopauseTreatmentsArticleScreen],
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
