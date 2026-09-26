import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import ConceiveDashboard from '../ConceiveDashboard';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {
  correctPeriodOccurrence,
  getCyclePreferences,
  setCyclePreferences,
} from '../../../state/onboardingPreferences';
import {recordConfirmedPeriodEnd} from '../../../state/confirmedPeriodHistoryStore';

// The Conceive Dashboard's CURRENT period reads the real recorded / confirmed
// range (same rule as the Cycle Dashboard): actual occurrence > habitual
// periodDuration, which stays the fallback. Each test lives on its own "today"
// (the period stores are module singletons, and a new latest start must come
// after the previous one).
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const habits = {periodDuration: 5, cycleDuration: 28, regularity: 'yes' as const};

const dayAt = (baseOffsetDays: number) => new Date(2026, 0, 1 + baseOffsetDays, 12);
const startedAgo = (today: Date, days: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - days, 12);

async function renderDashboard() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">
                  {() => <ConceiveDashboard navigation={{navigate: jest.fn()} as never} route={{key: 'd', name: 'CycleHome'}} />}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

const legend = (renderer: ReactTestRenderer.ReactTestRenderer) => textsOf(renderer).find(text => /^J1-\d+$/.test(text));
const isMenstruationHero = (renderer: ReactTestRenderer.ReactTestRenderer) => textsOf(renderer).includes('RÈGLES');

let scenario = 0;
const enterScenario = () => {
  scenario += 1;
  const today = dayAt(scenario * 60);
  jest.setSystemTime(today);
  return today;
};

beforeEach(() => {
  jest.useFakeTimers();
  resetPremiumStateForTests();
});
afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('ConceiveDashboard - current period length', () => {
  it('habitual duration only (no edited/confirmed range): fallback J1-5, menstruation through day 5', async () => {
    const today = enterScenario();
    setCyclePreferences({lastPeriodStart: startedAgo(today, 4), ...habits}); // cycle day 5
    const renderer = await renderDashboard();
    expect(legend(renderer)).toBe('J1-5');
    expect(isMenstruationHero(renderer)).toBe(true);
  });

  it('recorded actual range (7 days): legend J1-7 and still menstruation on day 7 (habit is 5)', async () => {
    const today = enterScenario();
    const start = startedAgo(today, 6); // cycle day 7
    setCyclePreferences({lastPeriodStart: start, ...habits});
    await correctPeriodOccurrence(start, start, today);
    expect(getCyclePreferences().periodDuration).toBe(5); // habit untouched

    const renderer = await renderDashboard();
    expect(legend(renderer)).toBe('J1-7');
    expect(isMenstruationHero(renderer)).toBe(true);
  });

  it('confirmed EARLY end (3 days): legend J1-3 and day 5 is no longer menstruation', async () => {
    const today = enterScenario();
    const start = startedAgo(today, 4); // cycle day 5
    setCyclePreferences({lastPeriodStart: start, ...habits});
    await recordConfirmedPeriodEnd(start, new Date(start.getFullYear(), start.getMonth(), start.getDate() + 2, 12));

    const renderer = await renderDashboard();
    expect(legend(renderer)).toBe('J1-3');
    expect(isMenstruationHero(renderer)).toBe(false);
  });

  it('confirmed LATER end (8 days): legend J1-8 and day 7 is still menstruation', async () => {
    const today = enterScenario();
    const start = startedAgo(today, 6); // cycle day 7
    setCyclePreferences({lastPeriodStart: start, ...habits});
    await recordConfirmedPeriodEnd(start, new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7, 12));

    const renderer = await renderDashboard();
    expect(legend(renderer)).toBe('J1-8');
    expect(isMenstruationHero(renderer)).toBe(true);
  });

  it('a HISTORICAL period keeps its own range and never changes the current period length', async () => {
    const today = enterScenario();
    const older = startedAgo(today, 40);
    const current = startedAgo(today, 2); // cycle day 3
    setCyclePreferences({lastPeriodStart: older, ...habits});
    await correctPeriodOccurrence(older, older, new Date(older.getFullYear(), older.getMonth(), older.getDate() + 8, 12)); // 9 days
    setCyclePreferences({lastPeriodStart: current, ...habits});

    const renderer = await renderDashboard();
    expect(legend(renderer)).toBe('J1-5'); // current period: habitual fallback, not the old 9-day period
  });

  it('irregular (window) cycle uses the same recorded length', async () => {
    const today = enterScenario();
    const start = startedAgo(today, 5); // cycle day 6
    setCyclePreferences({lastPeriodStart: start, periodDuration: 5, cycleDuration: 28, regularity: 'no'});
    await correctPeriodOccurrence(start, start, today);

    const renderer = await renderDashboard();
    expect(legend(renderer)).toBe('J1-6');
    expect(isMenstruationHero(renderer)).toBe(true);
  });
});
