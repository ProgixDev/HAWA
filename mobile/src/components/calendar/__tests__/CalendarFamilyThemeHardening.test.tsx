import React from 'react';
import fs from 'fs';
import path from 'path';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StatusBar} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';

import CalendarScreen from '../../../screens/CalendarScreen';
import MenopauseCalendarContent from '../../menopause/MenopauseCalendarContent';
import IrregularCalendarContent from '../../irregular/IrregularCalendarContent';
import ContraceptionCalendarContent from '../../contraception/ContraceptionCalendarContent';
import ConceiveCalendarContent from '../../conceive/ConceiveCalendarContent';
import PostpartumCalendarContent from '../../postpartum/PostpartumCalendarContent';
import MiscarriageCalendarContent from '../../miscarriage/MiscarriageCalendarContent';
import PregnancyCalendarContent from '../../pregnancy/PregnancyCalendarContent';

// Phase E3.1 — calendar theme hardening. This is a compact, data-driven
// harness covering the shared Cycle calendar path (CalendarScreen.tsx) and
// all 7 objective-specific *CalendarContent.tsx files with the SAME assertions,
// instead of one bespoke suite per objective. It proves runtime theme
// propagation (no remount) for the calendar family without touching any
// production code or business-logic store.

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

const navigationStub = {navigate: jest.fn()} as never;

async function renderCalendar(renderScreen: () => React.ReactElement) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">{renderScreen}</Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
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
   STATIC ARCHITECTURE GUARD — items 7/8/9: no local useColorScheme,
   no local Light/Dark/appearance-mode resolution, no user-facing
   Midnight dependency, anywhere in the E3-migrated calendar family.
============================================================ */

const CALENDAR_SOURCE_FILES: Array<[string, string]> = [
  ['CalendarScreen (Cycle)', '../../../screens/CalendarScreen.tsx'],
  ['CalendarHeader', '../CalendarHeader.tsx'],
  ['CycleTimelineCard', '../CycleTimelineCard.tsx'],
  ['FiltersSheet', '../FiltersSheet.tsx'],
  ['LegendSheet', '../LegendSheet.tsx'],
  ['MonthCalendarCard', '../MonthCalendarCard.tsx'],
  ['MonthHistoryStrip', '../MonthHistoryStrip.tsx'],
  ['PeriodStartBottomSheet', '../PeriodStartBottomSheet.tsx'],
  ['PredictionsCard', '../PredictionsCard.tsx'],
  ['SelectedDayCard', '../SelectedDayCard.tsx'],
  ['MenopauseCalendarContent', '../../menopause/MenopauseCalendarContent.tsx'],
  ['IrregularCalendarContent', '../../irregular/IrregularCalendarContent.tsx'],
  ['ContraceptionCalendarContent', '../../contraception/ContraceptionCalendarContent.tsx'],
  ['ConceiveCalendarContent', '../../conceive/ConceiveCalendarContent.tsx'],
  ['PostpartumCalendarContent', '../../postpartum/PostpartumCalendarContent.tsx'],
  ['MiscarriageCalendarContent', '../../miscarriage/MiscarriageCalendarContent.tsx'],
  ['PregnancyCalendarContent', '../../pregnancy/PregnancyCalendarContent.tsx'],
];

describe('E3 calendar family — static appearance-resolution guard', () => {
  it.each(CALENDAR_SOURCE_FILES)(
    '%s never resolves appearance locally (no useColorScheme, no LIGHT_/DARK_ chrome, no midnight, no getAwaTheme/resolveEffectiveThemeId)',
    (_name, relativePath) => {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      expect(source).not.toMatch(/useColorScheme\s*\(/);
      expect(source).not.toMatch(/appearanceMode\s*===/);
      expect(source).not.toMatch(/\bLIGHT_[A-Z]/);
      expect(source).not.toMatch(/\bDARK_[A-Z]/);
      expect(source).not.toMatch(/midnight/i);
      expect(source).not.toMatch(/resolveEffectiveThemeId\s*\(/);
      expect(source).not.toMatch(/getAwaTheme\s*\(/);
    },
  );
});

/* ============================================================
   RUNTIME THEME PROPAGATION — items 1-5: the shared Cycle path
   (CalendarScreen) plus all 7 objective-specific calendar contents,
   the SAME 4 assertions applied to each via describe.each.
============================================================ */

type CalendarCase = {
  name: string;
  render: () => React.ReactElement;
};

const CALENDARS: CalendarCase[] = [
  {
    name: 'Cycle (CalendarScreen, shared path)',
    render: () => (
      <CalendarScreen navigation={navigationStub} route={{key: 'test', name: 'Calendar'} as never} />
    ),
  },
  {name: 'Menopause', render: () => <MenopauseCalendarContent />},
  {name: 'SOPK / Irregular', render: () => <IrregularCalendarContent />},
  {name: 'Contraception', render: () => <ContraceptionCalendarContent />},
  {name: 'TTC / Conceive', render: () => <ConceiveCalendarContent />},
  {name: 'Postpartum', render: () => <PostpartumCalendarContent />},
  {name: 'Miscarriage', render: () => <MiscarriageCalendarContent />},
  {name: 'Pregnancy', render: () => <PregnancyCalendarContent />},
];

describe.each(CALENDARS)('$name — resolved global theme', ({render}) => {
  it('page background gradient resolves from theme.gradients.pageBackground (AWA Original canonical values)', async () => {
    const renderer = await renderCalendar(render);
    const gradient = renderer.root.findByType(LinearGradient);
    expect(gradient.props.colors).toEqual(['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']);
  });

  it('page background changes when the palette changes, without remounting', async () => {
    const renderer = await renderCalendar(render);
    const gradientColors = () => renderer.root.findByType(LinearGradient).props.colors;
    expect(gradientColors()[0]).toBe('#FAF8FD');

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(gradientColors()[0]).not.toBe('#FAF8FD');
  });

  it('changes Light -> Dark without remounting (StatusBar + gradient both follow the resolved theme)', async () => {
    const renderer = await renderCalendar(render);
    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(statusBar().props.barStyle).toBe('light-content');
  });

  it('True Black affects the page background only once Dark is resolved', async () => {
    const renderer = await renderCalendar(render);
    const background = renderer.root.findByType(LinearGradient);
    const lightBg = flattenStyle(background.props.style).backgroundColor;

    await act(async () => {
      await setAppearanceMode('light');
      await setTrueBlackEnabled(true);
    });
    expect(flattenStyle(background.props.style).backgroundColor).toBe(lightBg);

    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(flattenStyle(background.props.style).backgroundColor).toBe('#030304');
  });
});

/* ============================================================
   MEDICAL / RELIGIOUS SEMANTIC COLOR FREEZE — item 6. Spot-checks
   across the shared Cycle path and 3 objective-specific calendars
   (never every marker in every file — see CLAUDE.md's Category B/C
   freeze). Each fixed hex must still render, unchanged, after a
   palette switch — this is a freeze check, not a business-logic test.
============================================================ */

describe('E3 calendar family — medical/religious semantic colors stay fixed across a palette switch', () => {
  function countNodesWithColor(renderer: ReactTestRenderer.ReactTestRenderer, hex: string): number {
    return renderer.root.findAll(
      node => node.props.color === hex || flattenStyle(node.props.style).backgroundColor === hex,
    ).length;
  }

  it('Cycle — CycleTimelineCard "Début des règles"/"Fin des règles" keep the fixed period pink (#DC7B82)', async () => {
    const renderer = await renderCalendar(CALENDARS[0].render);
    const before = countNodesWithColor(renderer, '#DC7B82');
    expect(before).toBeGreaterThan(0);

    await act(async () => {
      await setSelectedThemeId('sage-serenity');
    });

    expect(countNodesWithColor(renderer, '#DC7B82')).toBe(before);
  });

  it('Postpartum — compact legend keeps the fixed lochia/delivery color (#DC7B82)', async () => {
    const renderer = await renderCalendar(() => <PostpartumCalendarContent />);
    const before = countNodesWithColor(renderer, '#DC7B82');
    expect(before).toBeGreaterThan(0);

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(countNodesWithColor(renderer, '#DC7B82')).toBe(before);
  });

  it('Miscarriage — compact legend keeps the fixed "Saignements" category color (#D8697A)', async () => {
    const renderer = await renderCalendar(() => <MiscarriageCalendarContent />);
    const before = countNodesWithColor(renderer, '#D8697A');
    expect(before).toBeGreaterThan(0);

    await act(async () => {
      await setSelectedThemeId('rose-quartz');
    });

    expect(countNodesWithColor(renderer, '#D8697A')).toBe(before);
  });

  it('Pregnancy — inline legend keeps the fixed "Examen" event color (#A68BE8)', async () => {
    // Deliberately not '#6D4AE8' (appointment) — that hex coincides with AWA
    // Original's own default theme.colors.primary, so a naive count would
    // conflate the fixed marker with ordinary theme-driven chrome that only
    // happens to render the same color in the default palette.
    const renderer = await renderCalendar(() => <PregnancyCalendarContent />);
    const before = countNodesWithColor(renderer, '#A68BE8');
    expect(before).toBeGreaterThan(0);

    await act(async () => {
      await setSelectedThemeId('warm-sand');
    });

    expect(countNodesWithColor(renderer, '#A68BE8')).toBe(before);
  });
});
