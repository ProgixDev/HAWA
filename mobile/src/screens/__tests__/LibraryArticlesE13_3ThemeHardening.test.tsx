import React from 'react';
import fs from 'fs';
import path from 'path';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StatusBar} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';

import ConceptionStartArticleScreen from '../library/ConceptionStartArticleScreen';
import NidationArticleScreen from '../library/NidationArticleScreen';
import ConceptionLifestyleArticleScreen from '../library/ConceptionLifestyleArticleScreen';
import BirthControlPillsArticleScreen from '../library/BirthControlPillsArticleScreen';
import PatchArticleScreen from '../library/PatchArticleScreen';
import VaginalRingArticleScreen from '../library/VaginalRingArticleScreen';
import HormonalTreatmentsPanoramaArticleScreen from '../library/HormonalTreatmentsPanoramaArticleScreen';
import ChooseHormonalMethodArticleScreen from '../library/ChooseHormonalMethodArticleScreen';
import MissedPillsArticleScreen from '../library/MissedPillsArticleScreen';
import SideEffectsArticleScreen from '../library/SideEffectsArticleScreen';

// E13.3 — Library bespoke article screens, Batch 3 (Conception + Contraception,
// 10 files). Every file previously hardcoded its own local
// CREAM/INK/ROSE/BORDER(+BODY/MUTED/GREEN/SOFT_ROSE/SOFT_PINK) palette with
// zero useAwaTheme() and a fixed `barStyle="dark-content"`. A deliberate
// re-audit of the conception/contraception content (fertility timing, method
// comparisons, missed-dose flows, side-effect severity) found NO genuine
// data/educational color-coding — every one of the 10 files in this batch is
// 100% migrated with zero remaining hex/rgba literals.

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
   STATIC GUARD — all 10 E13.3 target files.
============================================================ */

const TARGET_FILES: Array<[string, string]> = [
  ['ConceptionStartArticleScreen', '../library/ConceptionStartArticleScreen.tsx'],
  ['NidationArticleScreen', '../library/NidationArticleScreen.tsx'],
  ['ConceptionLifestyleArticleScreen', '../library/ConceptionLifestyleArticleScreen.tsx'],
  ['BirthControlPillsArticleScreen', '../library/BirthControlPillsArticleScreen.tsx'],
  ['PatchArticleScreen', '../library/PatchArticleScreen.tsx'],
  ['VaginalRingArticleScreen', '../library/VaginalRingArticleScreen.tsx'],
  ['HormonalTreatmentsPanoramaArticleScreen', '../library/HormonalTreatmentsPanoramaArticleScreen.tsx'],
  ['ChooseHormonalMethodArticleScreen', '../library/ChooseHormonalMethodArticleScreen.tsx'],
  ['MissedPillsArticleScreen', '../library/MissedPillsArticleScreen.tsx'],
  ['SideEffectsArticleScreen', '../library/SideEffectsArticleScreen.tsx'],
];

describe('E13.3 Library articles (Conception + Contraception) — static appearance-resolution guard', () => {
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

  it('all 10 files are fully migrated — zero remaining structural hex/rgba literals (no genuine educational/data-semantic colors were found in this batch)', () => {
    for (const [, relativePath] of TARGET_FILES) {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
      expect(source).not.toMatch(/rgba\(/);
    }
  });

  it('HormonalTreatmentsPanoramaArticleScreen uses onPrimaryTextColor(theme) for its step-number text on a primary-filled circle, not a hardcoded white', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../library/HormonalTreatmentsPanoramaArticleScreen.tsx'), 'utf8');
    expect(source).toMatch(/onPrimaryTextColor\(theme\)/);
  });
});

/* ============================================================
   RUNTIME — representative screens from both subgroups.
============================================================ */

const RUNTIME_SCREENS: Array<[string, React.ComponentType<any>]> = [
  ['ConceptionStartArticleScreen', ConceptionStartArticleScreen],
  ['NidationArticleScreen', NidationArticleScreen],
  ['BirthControlPillsArticleScreen', BirthControlPillsArticleScreen],
  ['MissedPillsArticleScreen', MissedPillsArticleScreen],
  ['SideEffectsArticleScreen', SideEffectsArticleScreen],
  ['HormonalTreatmentsPanoramaArticleScreen', HormonalTreatmentsPanoramaArticleScreen],
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
      await setSelectedThemeId('lavender-night');
    });

    expect(firstBackgroundColor(renderer)).not.toBe(before);
  });
});

describe('remaining E13.3 screens render without crashing under the theme provider', () => {
  const OTHER_SCREENS: Array<[string, React.ComponentType<any>]> = [
    ['ConceptionLifestyleArticleScreen', ConceptionLifestyleArticleScreen],
    ['PatchArticleScreen', PatchArticleScreen],
    ['VaginalRingArticleScreen', VaginalRingArticleScreen],
    ['ChooseHormonalMethodArticleScreen', ChooseHormonalMethodArticleScreen],
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
