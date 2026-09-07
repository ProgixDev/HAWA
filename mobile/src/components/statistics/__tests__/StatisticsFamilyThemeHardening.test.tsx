import React from 'react';
import fs from 'fs';
import path from 'path';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StatusBar, Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';

import StatisticsScreen from '../../../screens/StatisticsScreen';
import ContraceptionStatisticsScreen from '../../../screens/contraception/ContraceptionStatisticsScreen';
import IrregularStatisticsScreen from '../../../screens/irregular/IrregularStatisticsScreen';
import ConceiveStatisticsScreen from '../../../screens/conceive/ConceiveStatisticsScreen';
import PregnancyStatisticsScreen from '../../../screens/pregnancy/PregnancyStatisticsScreen';
import PostpartumStatisticsScreen from '../../../screens/postpartum/PostpartumStatisticsScreen';
import MiscarriageStatisticsScreen from '../../../screens/miscarriage/MiscarriageStatisticsScreen';
import MenopauseStatisticsScreen from '../../../screens/menopause/MenopauseStatisticsScreen';

// Phase E5 — Statistics theme hardening. Compact, data-driven harness
// (mirrors the Calendar/Journal family suites from E3.1/E4) covering all 8
// objective Statistics screens with the SAME assertions, plus source-level
// semantic-color-freeze checks using the REAL hex values verified present in
// each file before writing this suite (never hypothetical values).

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

function firstBackgroundColor(renderer: ReactTestRenderer.ReactTestRenderer): unknown {
  const match = renderer.root.findAll(node => {
    if (!node.props || !node.props.style) {return false;}
    return typeof flattenStyle(node.props.style).backgroundColor !== 'undefined';
  })[0];
  return match ? flattenStyle(match.props.style).backgroundColor : undefined;
}

function allDisplayedText(renderer: ReactTestRenderer.ReactTestRenderer): string[] {
  return renderer.root
    .findAllByType(Text)
    .map(node => (Array.isArray(node.props.children) ? node.props.children.join('') : String(node.props.children ?? '')));
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
   STATIC ARCHITECTURE GUARD — no local useColorScheme, no local
   Light/Dark/appearance-mode resolution, no user-facing Midnight
   dependency, no theme.id branching, anywhere in the E5-migrated
   Statistics family.
============================================================ */

const STATISTICS_SOURCE_FILES: Array<[string, string]> = [
  ['StatisticsScreen (Cycle)', '../../../screens/StatisticsScreen.tsx'],
  ['ContraceptionStatisticsScreen', '../../../screens/contraception/ContraceptionStatisticsScreen.tsx'],
  ['IrregularStatisticsScreen', '../../../screens/irregular/IrregularStatisticsScreen.tsx'],
  ['ConceiveStatisticsScreen', '../../../screens/conceive/ConceiveStatisticsScreen.tsx'],
  ['PregnancyStatisticsScreen', '../../../screens/pregnancy/PregnancyStatisticsScreen.tsx'],
  ['PostpartumStatisticsScreen', '../../../screens/postpartum/PostpartumStatisticsScreen.tsx'],
  ['MiscarriageStatisticsScreen', '../../../screens/miscarriage/MiscarriageStatisticsScreen.tsx'],
  ['MenopauseStatisticsScreen', '../../../screens/menopause/MenopauseStatisticsScreen.tsx'],
];

describe('E5 Statistics family — static appearance-resolution guard', () => {
  it.each(STATISTICS_SOURCE_FILES)(
    '%s never resolves appearance locally (no useColorScheme, no LIGHT_/DARK_ chrome, no midnight, no getAwaTheme/resolveEffectiveThemeId, no theme.id branching)',
    (_name, relativePath) => {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      expect(source).not.toMatch(/useColorScheme\s*\(/);
      expect(source).not.toMatch(/appearanceMode\s*===/);
      expect(source).not.toMatch(/\bLIGHT_[A-Z]/);
      expect(source).not.toMatch(/\bDARK_[A-Z]/);
      expect(source).not.toMatch(/midnight/i);
      expect(source).not.toMatch(/resolveEffectiveThemeId\s*\(/);
      expect(source).not.toMatch(/getAwaTheme\s*\(/);
      expect(source).not.toMatch(/if\s*\(\s*theme\.id\s*===/);
      expect(source).not.toMatch(/switch\s*\(\s*theme\.id\s*\)/);
      expect(source).toMatch(/useAwaTheme\s*\(/);
    },
  );

  it('StatisticsPeriodSelector.tsx (Phase C, shared, out of E5 scope) was not modified — still the same already-migrated implementation', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../StatisticsPeriodSelector.tsx'),
      'utf8',
    );
    expect(source).toMatch(/PHASE C/);
    expect(source).toMatch(/useAwaTheme\s*\(/);
  });
});

/* ============================================================
   RUNTIME THEME PROPAGATION — all 8 objective Statistics screens,
   the SAME assertions applied to each via describe.each.
============================================================ */

type StatisticsCase = {name: string; render: () => React.ReactElement};

const SCREENS: StatisticsCase[] = [
  {name: 'Cycle — StatisticsScreen', render: () => <StatisticsScreen navigation={{} as never} route={{key: 'test', name: 'Statistics'} as never} />},
  {name: 'Contraception — ContraceptionStatisticsScreen', render: () => <ContraceptionStatisticsScreen />},
  {name: 'SOPK/Irregular — IrregularStatisticsScreen', render: () => <IrregularStatisticsScreen />},
  {name: 'TTC/Conceive — ConceiveStatisticsScreen', render: () => <ConceiveStatisticsScreen />},
  {name: 'Pregnancy — PregnancyStatisticsScreen', render: () => <PregnancyStatisticsScreen />},
  {name: 'Postpartum — PostpartumStatisticsScreen', render: () => <PostpartumStatisticsScreen />},
  {name: 'Miscarriage — MiscarriageStatisticsScreen', render: () => <MiscarriageStatisticsScreen />},
  {name: 'Menopause — MenopauseStatisticsScreen', render: () => <MenopauseStatisticsScreen />},
];

describe.each(SCREENS)('$name — resolved global theme', ({render}) => {
  it('page background resolves from the global theme (True Black changes it only once Dark is resolved)', async () => {
    const renderer = await renderScreen(render);
    const before = firstBackgroundColor(renderer);
    expect(before).toBeDefined();

    await act(async () => {
      await setAppearanceMode('light');
      await setTrueBlackEnabled(true);
    });
    expect(firstBackgroundColor(renderer)).toBe(before);

    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(firstBackgroundColor(renderer)).not.toBe(before);
  });

  it('changes Light -> Dark without remounting (StatusBar follows the resolved theme)', async () => {
    const renderer = await renderScreen(render);
    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(statusBar().props.barStyle).toBe('light-content');
  });

  it('palette switch updates the page background without remounting', async () => {
    const renderer = await renderScreen(render);
    const before = firstBackgroundColor(renderer);

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(firstBackgroundColor(renderer)).not.toBe(before);
  });

  it('System mode follows the Provider-resolved device scheme', async () => {
    await setAppearanceMode('system');
    const renderer = await renderScreen(render);
    // Default mocked device scheme is 'light' in this test environment —
    // confirms the screen reads it via the Provider, not a local formula.
    expect(renderer.root.findByType(StatusBar).props.barStyle).toBe('dark-content');
  });

  it('every displayed piece of text is byte-identical before and after a full Dark + True Black + palette switch (no statistical value/label silently changes)', async () => {
    const renderer = await renderScreen(render);
    const before = allDisplayedText(renderer);

    await act(async () => {
      await setAppearanceMode('dark');
      await setTrueBlackEnabled(true);
      await setSelectedThemeId('rose-quartz');
    });

    expect(allDisplayedText(renderer)).toEqual(before);
  });
});

/* ============================================================
   SEMANTIC COLOR FREEZE — real hex values verified present in each
   migrated file BEFORE writing this test (per Step 59), not
   hypothetical values. Chart-series/medical-status colors must never
   become theme-derived.
============================================================ */

const FROZEN_COLOR_CHECKS: Array<[string, string, string, string]> = [
  ['Contraception — taken status', '../../../screens/contraception/ContraceptionStatisticsScreen.tsx', "SUCCESS = '#3E8E56'", "const SUCCESS = '#3E8E56';"],
  ['Contraception — late status', '../../../screens/contraception/ContraceptionStatisticsScreen.tsx', "WARNING = '#C77B2E'", "const WARNING = '#C77B2E';"],
  ['Contraception — missed status', '../../../screens/contraception/ContraceptionStatisticsScreen.tsx', "DANGER = '#D96176'", "const DANGER = '#D96176';"],
  ['Conceive — blue hue (ovulation/cycle length)', '../../../screens/conceive/ConceiveStatisticsScreen.tsx', "BLUE = '#4B8996'", "const BLUE = '#4B8996';"],
  ['Postpartum — chart fill', '../../../screens/postpartum/PostpartumStatisticsScreen.tsx', "CHART_FILL = '#8D6ED5'", "const CHART_FILL = '#8D6ED5';"],
  ['Postpartum — distribution fill', '../../../screens/postpartum/PostpartumStatisticsScreen.tsx', "DISTRIBUTION_FILL = '#9A7ADD'", "const DISTRIBUTION_FILL = '#9A7ADD';"],
  ['Miscarriage — fixed blue hue (no resolved-theme equivalent)', '../../../screens/miscarriage/MiscarriageStatisticsScreen.tsx', "BLUE = '#4B8996'", "const BLUE = '#4B8996';"],
  ['Menopause — FSH/sleep teal', '../../../screens/menopause/MenopauseStatisticsScreen.tsx', '#4D8791', '#4D8791'],
  ['Menopause — energy/estradiol amber', '../../../screens/menopause/MenopauseStatisticsScreen.tsx', '#B9823D', '#B9823D'],
];

describe('E5 Statistics family — frozen chart-series/status colors present verbatim after migration', () => {
  it.each(FROZEN_COLOR_CHECKS)('%s: %s is still present in source', (_name, relativePath, _label, needle) => {
    const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
    expect(source).toContain(needle);
  });

  it('Menopause entry screen still consumes menopauseJournalConfig category colors by reference (config untouched, never re-derived from theme)', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../screens/menopause/MenopauseStatisticsScreen.tsx'),
      'utf8',
    );
    expect(source).toMatch(/MENOPAUSE_(SYMPTOM_OPTIONS|MOOD_COLORS|ENERGY_ICONS|LAB_TYPE_ICONS)/);
  });
});

/* ============================================================
   PARTIAL-AUDIT REMEDIATION — targeted structural-chrome fixes for the 3
   Statistics screens the Dark Mode audit classified PARTIAL. These
   supersede 4 of the FROZEN_COLOR_CHECKS rows above (Conceive pink/green,
   Pregnancy's weight-trend loss color/badge) that locked in the exact
   defects being fixed here — Conceive's pink/green hues and Pregnancy's
   "weight decreased" indicator are now theme-derived; Conceive's blue and
   Miscarriage's blue hue remain legitimately frozen (Category E, no
   resolved-theme "tertiary/info" token exists).
============================================================ */

describe('Statistics PARTIAL-audit remediation — no longer hardcoded', () => {
  it('Conceive: pink/green accent hues are no longer fixed literals', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../screens/conceive/ConceiveStatisticsScreen.tsx'),
      'utf8',
    );
    expect(source).not.toContain("const PINK = '#CB5C82';");
    expect(source).not.toContain("const GREEN = '#5B9B72';");
    expect(source).not.toContain("const PINK_SOFT = '#FBEAF1';");
    expect(source).not.toContain("const GREEN_SOFT = '#EAF6EF';");
    expect(source).toMatch(/theme\.colors\.secondary/);
    expect(source).toMatch(/theme\.colors\.success/);
  });

  it('Conceive: advice-card white badge/glow now derive from theme.colors.surface', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../screens/conceive/ConceiveStatisticsScreen.tsx'),
      'utf8',
    );
    expect(source).not.toContain("'rgba(255,255,255,0.30)'");
    expect(source).not.toContain("'rgba(255,255,255,0.80)'");
    expect(source).toContain('withAlpha(theme.colors.surface, 0.30)');
    expect(source).toContain('withAlpha(theme.colors.surface, 0.80)');
  });

  it('Pregnancy: weight-trend "decreased" indicator is no longer a fixed literal', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../screens/pregnancy/PregnancyStatisticsScreen.tsx'),
      'utf8',
    );
    expect(source).not.toContain("'#A8505A'");
    expect(source).not.toContain("'#FBECEF'");
    expect(source).toMatch(/theme\.colors\.danger/);
  });

  it('Miscarriage: BLUE_SOFT is now a translucent overlay of the fixed BLUE hue, not a separate solid pastel', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../screens/miscarriage/MiscarriageStatisticsScreen.tsx'),
      'utf8',
    );
    expect(source).not.toContain("const BLUE_SOFT = '#EAF3F7';");
    expect(source).toContain('const BLUE_SOFT = withAlpha(BLUE, 0.16);');
    // BLUE's own hue is still intentionally frozen (Category E).
    expect(source).toContain("const BLUE = '#4B8996';");
  });
});

/* ============================================================
   PERIOD-SELECTION INVARIANCE — Free 1-month default and Premium
   gating must survive a full theme switch without resetting. Uses two
   screens that genuinely render the shared StatisticsPeriodSelector
   (Postpartum, Miscarriage) since its accessibilityState={{selected}}
   marker is a stable, documented selector.
============================================================ */

const PERIOD_LABELS = ['1 mois', '3 mois', '6 mois', '12 mois'];

describe('E5 Statistics family — selected period survives a theme switch', () => {
  it.each([
    ['Postpartum', () => <PostpartumStatisticsScreen />],
    ['Miscarriage', () => <MiscarriageStatisticsScreen />],
  ] as Array<[string, () => React.ReactElement]>)('%s keeps the same period selected across Dark + palette switch', async (_name, render) => {
    const renderer = await renderScreen(render);
    // StatisticsPeriodSelector renders `style={[styles.filterText, active && styles.filterTextActive]}`
    // on each period label's Text — inactive periods get `false` as the
    // second style-array entry, the active one gets a real style object.
    const activeLabel = () => {
      const match = renderer.root
        .findAllByType(Text)
        .find(node => PERIOD_LABELS.includes(String(node.props.children)) && Array.isArray(node.props.style) && node.props.style[1] !== false);
      return match ? String(match.props.children) : undefined;
    };

    const before = activeLabel();
    expect(before).toBeDefined();

    await act(async () => {
      await setAppearanceMode('dark');
      await setSelectedThemeId('warm-sand');
    });

    expect(activeLabel()).toBe(before);
  });
});

/* ============================================================
   ACCESSIBILITY — Phase 3 remediation. Period filters previously had
   accessibilityRole="button" but no accessibilityLabel (accessible name
   fell back to the plain "3 mois" Text, with no indication a locked period
   requires Premium) and, in StatisticsScreen.tsx's own inline period
   selector specifically, no accessibilityState either. The shared
   StatisticsPeriodSelector.tsx component (used by Pregnancy/Postpartum/
   Miscarriage) already had accessibilityState; StatisticsScreen.tsx's own
   duplicate implementation did not.
============================================================ */

describe('E5 Statistics family — period filter accessibility (Phase 3 fix)', () => {
  it('Cycle — StatisticsScreen: a locked (Premium-only) period exposes a label naming it and its selected state', async () => {
    const renderer = await renderScreen(SCREENS[0].render);
    const lockedPressable = renderer.root
      .findAll(node => typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.includes('3 mois'))[0];

    expect(lockedPressable).toBeDefined();
    expect(lockedPressable.props.accessibilityLabel).toContain('Premium');
    expect(lockedPressable.props.accessibilityRole).toBe('button');
    expect(lockedPressable.props.accessibilityState).toEqual({selected: false});
  });

  it('Postpartum — shared StatisticsPeriodSelector: a locked period exposes a label naming it and requiring Premium', async () => {
    const renderer = await renderScreen(() => <PostpartumStatisticsScreen />);
    const lockedPressable = renderer.root
      .findAll(node => typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.includes('3 mois'))[0];

    expect(lockedPressable).toBeDefined();
    expect(lockedPressable.props.accessibilityLabel).toContain('Premium');
    expect(lockedPressable.props.accessibilityRole).toBe('button');
  });

  it('the free "1 mois" period never claims to require Premium in its label', async () => {
    const renderer = await renderScreen(SCREENS[0].render);
    const freePressable = renderer.root
      .findAll(node => node.props.accessibilityLabel === '1 mois')[0];
    expect(freePressable).toBeDefined();
  });
});

describe('Cycle — StatisticsScreen: chart sections expose a single accessible summary instead of scattering unlabeled fragments (Phase 3 fix)', () => {
  it('the cycle-duration hero card is grouped into one accessible summary naming the value', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../../screens/StatisticsScreen.tsx'), 'utf8');
    expect(source).toMatch(/accessible\s*\n\s*accessibilityLabel=\{`Durée moyenne des cycles/);
    expect(source).toMatch(/accessibilityRole="summary"/);
  });

  it('flow-distribution and symptom-frequency rows are each grouped into one accessible summary', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../../screens/StatisticsScreen.tsx'), 'utf8');
    expect(source).toMatch(/accessibilityLabel=\{`\$\{FLOW_LABELS\[item\.intensity\]\}/);
    expect(source).toMatch(/accessibilityLabel=\{`\$\{index \+ 1\}\. \$\{item\.name\}/);
  });
});
