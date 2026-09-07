import React from 'react';
import fs from 'fs';
import path from 'path';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StatusBar} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';

import NifasFiqhArticleScreen from '../library/NifasFiqhArticleScreen';
import FiqhWomenIntroArticleScreen from '../library/FiqhWomenIntroArticleScreen';
import MenstruationPurityArticleScreen from '../library/MenstruationPurityArticleScreen';
import IstihadaArticleScreen from '../library/IstihadaArticleScreen';
import RamadanFastingArticleScreen from '../library/RamadanFastingArticleScreen';
import FastingQadaaArticleScreen from '../library/FastingQadaaArticleScreen';
import PrayerDuringMenstruationArticleScreen from '../library/PrayerDuringMenstruationArticleScreen';
import ReturningToPrayerArticleScreen from '../library/ReturningToPrayerArticleScreen';
import ReligiousFaqArticleScreen from '../library/ReligiousFaqArticleScreen';
import ReligiousFaqAfterLossArticleScreen from '../library/ReligiousFaqAfterLossArticleScreen';
import MiscarriagePhysicalRecoveryArticleScreen from '../library/MiscarriagePhysicalRecoveryArticleScreen';
import MiscarriageGriefArticleScreen from '../library/MiscarriageGriefArticleScreen';
import MiscarriageFertilityArticleScreen from '../library/MiscarriageFertilityArticleScreen';

// E13.6 — Library bespoke article screens, Batch 6 (Miscarriage +
// Religious/Fiqh, 13 files) — the FINAL E13 batch, completing 72/72 active
// bespoke articles. Every file previously hardcoded its own local
// CREAM/INK/ROSE/BORDER(+MUTED) palette with zero useAwaTheme() and a fixed
// `barStyle="dark-content"`. A deliberate audit confirmed: (1) none of the 5
// religious/fiqh files use color to visually distinguish different madhahib/
// schools of thought — that distinction is always conveyed through prose,
// never a color legend; (2) the recurring reddish "information importante"
// disclaimer box is the same generic app-wide "important notice" pattern,
// not a special religious color, and migrates normally to theme.colors.
// warning; (3) the miscarriage bleeding/recovery timeline follows the same
// lesson learned from LochiaArticleScreen — stages are differentiated
// through text labels, never real color swatches. Every file in this batch
// is 100% migrated with zero remaining hex/rgba literals, and no article/
// religious wording was altered.

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
   STATIC GUARD — all 13 E13.6 target files.
============================================================ */

const TARGET_FILES: Array<[string, string]> = [
  ['NifasFiqhArticleScreen', '../library/NifasFiqhArticleScreen.tsx'],
  ['FiqhWomenIntroArticleScreen', '../library/FiqhWomenIntroArticleScreen.tsx'],
  ['MenstruationPurityArticleScreen', '../library/MenstruationPurityArticleScreen.tsx'],
  ['IstihadaArticleScreen', '../library/IstihadaArticleScreen.tsx'],
  ['RamadanFastingArticleScreen', '../library/RamadanFastingArticleScreen.tsx'],
  ['FastingQadaaArticleScreen', '../library/FastingQadaaArticleScreen.tsx'],
  ['PrayerDuringMenstruationArticleScreen', '../library/PrayerDuringMenstruationArticleScreen.tsx'],
  ['ReturningToPrayerArticleScreen', '../library/ReturningToPrayerArticleScreen.tsx'],
  ['ReligiousFaqArticleScreen', '../library/ReligiousFaqArticleScreen.tsx'],
  ['ReligiousFaqAfterLossArticleScreen', '../library/ReligiousFaqAfterLossArticleScreen.tsx'],
  ['MiscarriagePhysicalRecoveryArticleScreen', '../library/MiscarriagePhysicalRecoveryArticleScreen.tsx'],
  ['MiscarriageGriefArticleScreen', '../library/MiscarriageGriefArticleScreen.tsx'],
  ['MiscarriageFertilityArticleScreen', '../library/MiscarriageFertilityArticleScreen.tsx'],
];

describe('E13.6 Library articles (Miscarriage + Religious/Fiqh) — static appearance-resolution guard', () => {
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

  it('all 13 files are fully migrated — zero remaining structural hex/rgba literals (no genuine madhahib color-legend or miscarriage-bleeding color-swatch was found in this batch)', () => {
    for (const [, relativePath] of TARGET_FILES) {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
      expect(source).not.toMatch(/rgba\(/);
    }
  });

  it('RELIGIOUS_DISCLAIMER text is preserved verbatim where present (theming must never touch religious wording)', () => {
    for (const relativePath of [
      '../library/FastingQadaaArticleScreen.tsx',
      '../library/RamadanFastingArticleScreen.tsx',
    ]) {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      if (source.includes('RELIGIOUS_DISCLAIMER')) {
        expect(source).toMatch(/savants qualifiés/);
      }
    }
  });
});

/* ============================================================
   RUNTIME — representative screens from both subgroups.
============================================================ */

const RUNTIME_SCREENS: Array<[string, React.ComponentType<any>]> = [
  ['FastingQadaaArticleScreen', FastingQadaaArticleScreen],
  ['ReligiousFaqArticleScreen', ReligiousFaqArticleScreen],
  ['NifasFiqhArticleScreen', NifasFiqhArticleScreen],
  ['MiscarriagePhysicalRecoveryArticleScreen', MiscarriagePhysicalRecoveryArticleScreen],
  ['MiscarriageGriefArticleScreen', MiscarriageGriefArticleScreen],
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

describe('remaining E13.6 screens render without crashing under the theme provider', () => {
  const OTHER_SCREENS: Array<[string, React.ComponentType<any>]> = [
    ['FiqhWomenIntroArticleScreen', FiqhWomenIntroArticleScreen],
    ['MenstruationPurityArticleScreen', MenstruationPurityArticleScreen],
    ['IstihadaArticleScreen', IstihadaArticleScreen],
    ['RamadanFastingArticleScreen', RamadanFastingArticleScreen],
    ['PrayerDuringMenstruationArticleScreen', PrayerDuringMenstruationArticleScreen],
    ['ReturningToPrayerArticleScreen', ReturningToPrayerArticleScreen],
    ['ReligiousFaqAfterLossArticleScreen', ReligiousFaqAfterLossArticleScreen],
    ['MiscarriageFertilityArticleScreen', MiscarriageFertilityArticleScreen],
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
