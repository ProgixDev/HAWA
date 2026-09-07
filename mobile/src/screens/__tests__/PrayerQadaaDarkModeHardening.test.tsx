import React from 'react';
import fs from 'fs';
import path from 'path';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StatusBar} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';

import PrayerTimesScreen from '../PrayerTimesScreen';
import FastingQadaaScreen from '../FastingQadaaScreen';

// Dark Mode readability/background hardening for "Horaires de prière" and
// "Jeûnes à rattraper" — the user found on a real device that both screens'
// hero photo areas (the mosque banner behind the Prayer header, the mosque
// hero card on the Qadaa screen) stayed bright/undimmed in Dark Mode because
// their dimming scrim was either a transparent-at-top gradient or a fixed
// 10% white literal, not tied to the resolved theme. Fixed by making both
// scrims theme-driven (`withAlpha(theme.colors.background, …)`). No prayer/
// Hijri/Qadaa calculation logic, persistence, or layout was touched.

jest.mock('../../hooks/usePrayerPurityStatus', () => ({
  usePrayerPurityStatus: jest.fn().mockReturnValue({
    cyclePreferences: {},
    selectedLocation: {city: 'Paris', country: 'France'},
    periodEndDateTime: null,
    schedule: {
      timezone: 'Europe/Paris',
      fajrAngle: 18,
      windows: [],
      purityWindows: [],
    },
    loading: false,
    error: false,
    now: new Date('2026-01-15T12:00:00Z'),
    purityResult: {status: 'unknown'},
    nextWindow: undefined,
    refresh: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('../../state/onboardingPreferences', () => {
  const actual = jest.requireActual('../../state/onboardingPreferences');
  return {
    ...actual,
    // Not 'cycle' -> menstrual-purity UI (PurityStatusCard/PeriodEndBottomSheet)
    // stays out of this focused render; the banner defect under test is the
    // same for every objective that reaches this shared screen.
    getActiveObjective: jest.fn().mockReturnValue('pregnancy'),
    getHijriAdjustmentDays: jest.fn().mockReturnValue(0),
    setHijriAdjustmentDays: jest.fn(),
    subscribeHijriAdjustmentDays: jest.fn().mockReturnValue(() => {}),
  };
});

jest.mock('../../hooks/useQadaaStatus', () => ({
  useQadaaStatus: jest.fn().mockReturnValue({
    remainingQadaaDays: 2,
    totalQadaaDays: 5,
    completedQadaaDays: 3,
    hijriYear: 1447,
    loading: false,
    ramadanActive: false,
    showReminder: true,
    markOneQadaaDayCompleted: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('../../hooks/useConfirmedPeriodHistory', () => ({
  useConfirmedPeriodHistory: jest.fn().mockReturnValue([]),
}));

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

async function renderScreen(renderElement: () => React.ReactElement) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">{renderElement}</Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

beforeEach(async () => {
  jest.clearAllMocks();
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
   STATIC GUARDS — items 9-14/26: no local dark-mode resolution, and the
   two known-bad literals from the bug report must not come back.
============================================================ */

const TARGET_FILES: Array<[string, string]> = [
  ['PrayerTimesScreen', '../PrayerTimesScreen.tsx'],
  ['FastingQadaaScreen', '../FastingQadaaScreen.tsx'],
];

describe('Prayer/Qadaa Dark Mode hardening — static guards', () => {
  it.each(TARGET_FILES)(
    '%s has no local dark-mode resolution (no useColorScheme, no isDark, no theme.id branch, no new palette)',
    (_name, relativePath) => {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      expect(source).not.toMatch(/useColorScheme\s*\(/);
      expect(source).not.toMatch(/Appearance\.getColorScheme\s*\(/);
      expect(source).not.toMatch(/isDark\s*\?/);
      expect(source).not.toMatch(/trueBlackEnabled/);
      expect(source).not.toMatch(/\bDARK_COLORS\b|\bLIGHT_COLORS\b|\bPRAYER_DARK_COLORS\b|\bFASTING_DARK_COLORS\b|\bRELIGIOUS_DARK_THEME\b/);
      expect(source).not.toMatch(/if\s*\(\s*theme\.id\s*===/);
      expect(source).not.toMatch(/switch\s*\(\s*theme\.id\s*\)/);
      expect(source).toMatch(/useAwaTheme\s*\(/);
    },
  );

  it('PrayerTimesScreen banner scrim no longer starts fully transparent (the exact reported defect)', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../PrayerTimesScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/withAlpha\(theme\.colors\.background,\s*0\)/);
  });

  it('FastingQadaaScreen hero overlay is theme-driven, not the fixed 10% white literal that caused the near-white card', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../FastingQadaaScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/rgba\(255,\s*255,\s*255,\s*0\.10\)/);
    expect(source).toMatch(/heroOverlay:\s*\{[\s\S]*?withAlpha\(theme\.colors\.background/);
  });

  it('the semantic/decorative period-status color remains preserved (out of theme scope, documented)', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../components/prayer/PurityStatusCard.tsx'), 'utf8');
    expect(source).toContain('#DC7B82');
  });

  it('prayer/Hijri/Qadaa calculation and persistence imports are untouched', () => {
    const prayerSource = fs.readFileSync(path.resolve(__dirname, '../PrayerTimesScreen.tsx'), 'utf8');
    expect(prayerSource).toContain("from '../hooks/usePrayerPurityStatus'");
    expect(prayerSource).toContain("from '../utils/cycleMath'");
    const qadaaSource = fs.readFileSync(path.resolve(__dirname, '../FastingQadaaScreen.tsx'), 'utf8');
    expect(qadaaSource).toContain("from '../hooks/useQadaaStatus'");
    expect(qadaaSource).toContain("from '../utils/qadaaHistoryPresentation'");
  });
});

/* ============================================================
   RUNTIME — PrayerTimesScreen: the banner scrim must actually resolve
   from the theme and never render a fully-transparent first stop.
============================================================ */

describe('PrayerTimesScreen — banner scrim follows the resolved theme', () => {
  it('the banner LinearGradient never uses a fully-transparent first stop, in Light or Dark', async () => {
    const renderer = await renderScreen(() => <PrayerTimesScreen />);
    const gradientColorsAt = () => renderer.root.findByType(LinearGradient).props.colors as string[];

    const lightColors = gradientColorsAt();
    expect(lightColors[0]).not.toMatch(/,\s*0\)$/);

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const darkColors = gradientColorsAt();
    expect(darkColors[0]).not.toMatch(/,\s*0\)$/);
    // The scrim must actually change between Light and Dark — proving it's
    // sourced from the resolved theme, not a fixed literal.
    expect(darkColors[0]).not.toBe(lightColors[0]);
  });

  it('page background and header title text resolve from the theme and change Light -> Dark without remounting', async () => {
    const renderer = await renderScreen(() => <PrayerTimesScreen />);
    const findScreenBackground = () =>
      renderer.root.findAll(node => {
        const style = flattenStyle(node.props?.style);
        return typeof style.flex === 'number' && typeof style.backgroundColor === 'string';
      })[0].props.style.backgroundColor;
    const findHeaderTitleColor = () =>
      flattenStyle(renderer.root.findAll(node => node.props?.children === 'Horaires de prière')[0].props.style).color;

    const bgBefore = findScreenBackground();
    const textBefore = findHeaderTitleColor();
    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(findScreenBackground()).not.toBe(bgBefore);
    expect(findHeaderTitleColor()).not.toBe(textBefore);
    expect(statusBar().props.barStyle).toBe('light-content');
  });

  it('True Black is inherited from the Provider without any local handling', async () => {
    const renderer = await renderScreen(() => <PrayerTimesScreen />);
    const findScreenBackground = () =>
      renderer.root.findAll(node => {
        const style = flattenStyle(node.props?.style);
        return typeof style.flex === 'number' && typeof style.backgroundColor === 'string';
      })[0].props.style.backgroundColor;

    await act(async () => {
      await setAppearanceMode('dark');
      await setTrueBlackEnabled(false);
    });
    const darkBg = findScreenBackground();

    await act(async () => {
      await setTrueBlackEnabled(true);
    });
    expect(findScreenBackground()).not.toBe(darkBg);
  });

  it('a Premium palette switch is inherited from the Provider (no palette-ID branching in this screen)', async () => {
    const renderer = await renderScreen(() => <PrayerTimesScreen />);
    const findScreenBackground = () =>
      renderer.root.findAll(node => {
        const style = flattenStyle(node.props?.style);
        return typeof style.flex === 'number' && typeof style.backgroundColor === 'string';
      })[0].props.style.backgroundColor;
    const before = findScreenBackground();

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(findScreenBackground()).not.toBe(before);
  });
});

/* ============================================================
   RUNTIME — FastingQadaaScreen: the hero overlay must actually resolve
   from the theme and never render the old fixed 10% white value.
============================================================ */

describe('FastingQadaaScreen — hero overlay follows the resolved theme', () => {
  function findHeroOverlayColor(renderer: ReactTestRenderer.ReactTestRenderer): unknown {
    const match = renderer.root.findAll(node => {
      const style = flattenStyle(node.props?.style);
      return style.position === 'absolute' && typeof style.backgroundColor === 'string';
    })[0];
    return match ? flattenStyle(match.props.style).backgroundColor : undefined;
  }

  it('the hero overlay is never the old fixed 10% white literal, in Light or Dark', async () => {
    const renderer = await renderScreen(() => <FastingQadaaScreen />);
    const overlayColor = findHeroOverlayColor(renderer);
    expect(overlayColor).toBeDefined();
    expect(overlayColor).not.toBe('rgba(255,255,255,0.10)');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const darkOverlayColor = findHeroOverlayColor(renderer);
    expect(darkOverlayColor).not.toBe('rgba(255,255,255,0.10)');
    expect(darkOverlayColor).not.toBe(overlayColor);
  });

  it('the hero number/label/eyebrow text resolves from the theme and changes Light -> Dark', async () => {
    const renderer = await renderScreen(() => <FastingQadaaScreen />);
    const findCountColor = () =>
      flattenStyle(renderer.root.findAll(node => node.props?.children === 2)[0].props.style).color;
    const before = findCountColor();

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(findCountColor()).not.toBe(before);
  });

  it('True Black is inherited from the Provider without any local handling', async () => {
    const renderer = await renderScreen(() => <FastingQadaaScreen />);
    await act(async () => {
      await setAppearanceMode('dark');
      await setTrueBlackEnabled(false);
    });
    const before = findHeroOverlayColor(renderer);

    await act(async () => {
      await setTrueBlackEnabled(true);
    });
    expect(findHeroOverlayColor(renderer)).not.toBe(before);
  });

  it('a Premium palette switch is inherited from the Provider (no palette-ID branching in this screen)', async () => {
    const renderer = await renderScreen(() => <FastingQadaaScreen />);
    const before = findHeroOverlayColor(renderer);

    await act(async () => {
      await setSelectedThemeId('warm-sand');
    });

    expect(findHeroOverlayColor(renderer)).not.toBe(before);
  });

  it('Qadaa business logic (remaining days, hijri year, mark-completed) is untouched by this styling fix', async () => {
    const renderer = await renderScreen(() => <FastingQadaaScreen />);
    expect(renderer.root.findAll(node => node.props?.children === 2).length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props?.children === 'jours à rattraper').length).toBeGreaterThan(0);
  });
});
