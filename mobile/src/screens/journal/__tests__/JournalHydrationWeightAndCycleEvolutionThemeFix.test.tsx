import React from 'react';
import fs from 'fs';
import path from 'path';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';

// Dark Mode audit PARTIAL remediation: these two screens previously had zero
// useAwaTheme() usage — their quick-add UI (Hydration) and phase/progress
// card content (Cycle Evolution) were entirely hardcoded. Fixed to read from
// the global theme; the Cycle Evolution screen's 3 per-marker category
// accents (fertile/ovulation/next-period) stay intentionally fixed, matching
// the same "differentiated per-item accent" convention used elsewhere.

jest.mock('../../../state/dailyJournalStore', () => {
  const actual = jest.requireActual('../../../state/dailyJournalStore');
  return {...actual, saveJournalSection: jest.fn().mockResolvedValue(undefined)};
});

import JournalHydrationWeightScreen from '../JournalHydrationWeightScreen';
import JournalCycleEvolutionScreen from '../JournalCycleEvolutionScreen';

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 740}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderScreen(Screen: React.ComponentType<any>) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">{props => <Screen {...props} />}</Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

function textColorsOf(renderer: ReactTestRenderer.ReactTestRenderer): unknown[] {
  return renderer.root
    .findAllByType(Text)
    .map(node => flattenStyle(node.props.style).color)
    .filter(color => typeof color !== 'undefined');
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

describe('JournalHydrationWeightScreen — static guard', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../JournalHydrationWeightScreen.tsx'), 'utf8');

  it('no longer hardcodes the old purple/lavender/muted literals', () => {
    expect(source).not.toContain("'#6949BE'");
    expect(source).not.toContain("'#EEE3FA'");
    expect(source).not.toContain("'#8F84AC'");
  });

  it('reads its structural chrome from the global theme', () => {
    expect(source).toMatch(/useAwaTheme/);
    expect(source).toMatch(/theme\.colors\.primary/);
    expect(source).toMatch(/theme\.colors\.primarySoft/);
    expect(source).toMatch(/theme\.colors\.textSecondary/);
  });
});

describe('JournalCycleEvolutionScreen — static guard', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../JournalCycleEvolutionScreen.tsx'), 'utf8');

  it('no longer hardcodes the old generic-chrome COLORS object', () => {
    expect(source).not.toMatch(/const COLORS = \{/);
    expect(source).not.toContain("deepPurple: '#35205E'");
  });

  it('reads its structural chrome from the global theme', () => {
    expect(source).toMatch(/useAwaTheme/);
    expect(source).toMatch(/theme\.colors\.accent/);
    expect(source).toMatch(/theme\.colors\.primary/);
    expect(source).toMatch(/theme\.colors\.textSecondary/);
    expect(source).toMatch(/theme\.colors\.surfaceSecondary/);
  });

  it('keeps the 3 per-marker category accents (fertile/ovulation/next-period) as intentional fixed literals', () => {
    expect(source).toMatch(/const MARKER_COLORS = \{/);
    expect(source).toContain("fertileIcon: '#5B8C70'");
    expect(source).toContain("periodIcon: '#B28D5F'");
  });
});

/* ============================================================
   DAY CIRCLE ("Phase actuelle") — DARK MODE READABILITY.
   The circle's inner surface (ringInner) was a fixed '#FFFFFF' while the
   day number/label on top (theme.colors.accent/textSecondary) are
   LIGHT-toned in every Dark variant (designed to sit on theme.colors.
   surface, a dark surface there) — pinning the surface to white broke that
   pairing (light-on-white). Fixed by using theme.colors.surface for the
   inner circle, the same token those text colors are already paired with
   everywhere else — byte-identical in Light (AWA's surface IS '#FFFFFF'
   there) and correctly dark in Dark/True Black.
============================================================ */

function relativeLuminance(hex: string): number {
  const normalized = hex.replace('#', '');
  const srgbToLin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const [r, g, b] = [0, 2, 4].map(i => srgbToLin(parseInt(normalized.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hexA: string, hexB: string): number {
  const [l1, l2] = [relativeLuminance(hexA), relativeLuminance(hexB)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

function flattenStyleTest(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

describe('JournalCycleEvolutionScreen — day circle readability (Light/Dark/True Black)', () => {
  it('static guard: the inner circle no longer hardcodes a fixed white background', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../JournalCycleEvolutionScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/ringInner:\s*\{[^}]*'#FFFFFF'/s);
    expect(source).toMatch(/ringInner:\s*\{[^}]*theme\.colors\.surface\b/s);
  });

  async function renderAndReadCircle() {
    const renderer = await renderScreen(JournalCycleEvolutionScreen);
    const jourLabel = renderer.root.findAll(node => node.props.children === 'jour')[0];
    const dayNumber = renderer.root.findAll(
      node => typeof node.props.children === 'number' || (typeof node.props.children === 'string' && /^\d+$/.test(node.props.children)),
    )[0];

    let ringInner: ReactTestRenderer.ReactTestInstance | null = jourLabel.parent;
    while (ringInner && typeof flattenStyleTest(ringInner.props.style).backgroundColor === 'undefined') {
      ringInner = ringInner.parent;
    }

    return {
      circleBackground: flattenStyleTest(ringInner!.props.style).backgroundColor as string,
      dayColor: flattenStyleTest(dayNumber.props.style).color as string,
      jourColor: flattenStyleTest(jourLabel.props.style).color as string,
    };
  }

  it('Light mode: day number and "jour" label are clearly readable against the circle', async () => {
    const {circleBackground, dayColor, jourColor} = await renderAndReadCircle();
    expect(contrastRatio(circleBackground, dayColor)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(circleBackground, jourColor)).toBeGreaterThanOrEqual(3);
  });

  it('Dark mode: day number and "jour" label are clearly readable against the circle (the reported bug)', async () => {
    await setAppearanceMode('dark');
    const {circleBackground, dayColor, jourColor} = await renderAndReadCircle();
    expect(contrastRatio(circleBackground, dayColor)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(circleBackground, jourColor)).toBeGreaterThanOrEqual(3);
    // The circle itself must not still read as a bright, disconnected white
    // surface once Dark is resolved.
    expect(relativeLuminance(circleBackground)).toBeLessThan(0.4);
  });

  it('True Black: day number and "jour" label remain clearly readable', async () => {
    await setAppearanceMode('dark');
    await setTrueBlackEnabled(true);
    const {circleBackground, dayColor, jourColor} = await renderAndReadCircle();
    expect(contrastRatio(circleBackground, dayColor)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(circleBackground, jourColor)).toBeGreaterThanOrEqual(3);
  });
});

describe.each([
  ['JournalHydrationWeightScreen', JournalHydrationWeightScreen],
  ['JournalCycleEvolutionScreen', JournalCycleEvolutionScreen],
] as Array<[string, React.ComponentType<any>]>)('%s — renders and follows the resolved theme', (_name, Screen) => {
  it('renders without throwing in Light', async () => {
    await expect(renderScreen(Screen)).resolves.toBeDefined();
  });

  it('at least one text color changes between Light and Dark, without remounting', async () => {
    const renderer = await renderScreen(Screen);
    const before = textColorsOf(renderer);
    expect(before.length).toBeGreaterThan(0);

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const after = textColorsOf(renderer);
    expect(after).not.toEqual(before);
  });

  it('palette switch (Ocean Calm) also changes at least one text color', async () => {
    const renderer = await renderScreen(Screen);
    const before = textColorsOf(renderer);

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(textColorsOf(renderer)).not.toEqual(before);
  });
});
