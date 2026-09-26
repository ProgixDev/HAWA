import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import PregnancyDashboard from '../../../components/pregnancy/PregnancyDashboard';
import PregnancyCalendarContent from '../../../components/pregnancy/PregnancyCalendarContent';
import PregnancyStatisticsScreen from '../PregnancyStatisticsScreen';
import PregnancyWeekScreen from '../PregnancyWeekScreen';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {setPregnancyDating} from '../../../state/pregnancyPreferences';
import {addDays} from '../../../utils/cycleMath';
import {
  PREGNANCY_TOTAL_DAYS,
  computePregnancyStatus,
  formatPregnancyTrimester,
} from '../../../utils/pregnancyTrackingUtils';

// G/H — Dashboard, Statistics, Calendar and the Week screen must say the same
// thing about the same pregnancy: same remaining weeks, same trimester, same
// wording. (Statistics used to compute "40 − week" — one less than the
// Dashboard's floor(remainingDays / 7) — and the wording was "1e" vs "1er".)
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderScreen(element: React.JSX.Element) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">{() => element}</Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  for (let index = 0; index < 6; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  return renderer;
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

const dashboardRemaining = (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const line = textsOf(renderer).find(text => /^\d+ semaines/.test(text));
  const match = line?.match(/^(\d+) semaines(?: \+ (\d+) jours)?/);
  return match ? {weeks: Number(match[1]), days: Number(match[2] ?? 0)} : null;
};

const statsRemainingWeeks = (renderer: ReactTestRenderer.ReactTestRenderer): number | null => {
  const line = textsOf(renderer).find(text => /^\d+\s*sem\. restantes/.test(text));
  return line ? Number(line.match(/^(\d+)/)![1]) : null;
};

const valueAfter = (renderer: ReactTestRenderer.ReactTestRenderer, label: string): string | undefined => {
  const texts = textsOf(renderer);
  const index = texts.indexOf(label);
  return index >= 0 ? texts[index + 1] : undefined;
};

const setLmp = (elapsedDays: number) =>
  setPregnancyDating({method: 'lastPeriod', date: addDays(new Date(), -elapsedDays).toISOString()});

beforeEach(() => {
  resetPremiumStateForTests();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

// Boundaries: start, first full week, last day of trimester 1 / first of 2,
// last day of 2 / first of 3, near the term, the due date itself.
const ELAPSED_BOUNDARIES = [0, 7, 90, 91, 188, 189, 259, 279, PREGNANCY_TOTAL_DAYS];

describe('Dashboard, Statistics, Calendar and Week screen agree', () => {
  it.each(ELAPSED_BOUNDARIES)('elapsed %i days', async elapsed => {
    await setLmp(elapsed);
    const expected = computePregnancyStatus('lastPeriod', addDays(new Date(), -elapsed), new Date());

    const dashboard = await renderScreen(
      <PregnancyDashboard navigation={{navigate: jest.fn()} as never} route={{key: 'd', name: 'CycleHome'}} />,
    );
    expect(dashboardRemaining(dashboard)).toEqual({
      weeks: expected.remainingWeeks,
      days: expected.remainingDaysRemainder,
    });
    expect(textsOf(dashboard)).toContain(formatPregnancyTrimester(expected.trimester));

    const stats = await renderScreen(<PregnancyStatisticsScreen />);
    // G: the very same number of remaining weeks as the Dashboard
    expect(statsRemainingWeeks(stats)).toBe(expected.remainingWeeks);
    expect(statsRemainingWeeks(stats)).toBe(dashboardRemaining(dashboard)!.weeks);
    // H: the very same trimester wording
    expect(valueAfter(stats, 'Trimestre')).toBe(formatPregnancyTrimester(expected.trimester));

    const calendar = await renderScreen(<PregnancyCalendarContent />);
    expect(valueAfter(calendar, 'Trimestre')).toBe(formatPregnancyTrimester(expected.trimester));

    const week = await renderScreen(
      <PregnancyWeekScreen navigation={{navigate: jest.fn(), goBack: jest.fn()} as never} route={{key: 'w', name: 'PregnancyWeek'} as never} />,
    );
    expect(textsOf(week).some(text => text.includes(`· ${formatPregnancyTrimester(expected.trimester)}`))).toBe(true);
  });

  it('no screen ever shows the old "1e trimestre" wording', async () => {
    await setLmp(10);
    const dashboard = await renderScreen(
      <PregnancyDashboard navigation={{navigate: jest.fn()} as never} route={{key: 'd', name: 'CycleHome'}} />,
    );
    const stats = await renderScreen(<PregnancyStatisticsScreen />);
    for (const renderer of [dashboard, stats]) {
      expect(textsOf(renderer)).not.toContain('1e trimestre');
      expect(textsOf(renderer)).toContain('1er trimestre');
    }
  });
});
