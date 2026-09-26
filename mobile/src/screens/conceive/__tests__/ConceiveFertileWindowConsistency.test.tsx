import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import ConceiveStatisticsScreen from '../ConceiveStatisticsScreen';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {getCyclePreferences, setCyclePreferences} from '../../../state/onboardingPreferences';
import {resolveConceptionCycleBasics} from '../../../utils/conceptionStatisticsMath';
import {addDays, computeCyclePredictionStatus, formatShortDate, startOfDay, upcomingFertileWindow} from '../../../utils/cycleMath';

// M18 - every Conceive fertility surface (Dashboard timeline, Calendar
// painted days, Statistics fertile window, reminders) derives the fertile
// window from ONE effective cycle length: resolveConceptionCycleBasics().
// This file covers the helper and the Statistics surface in the only case
// where the surfaces used to disagree (regularity 'unknown' + regular-looking
// observed pattern: observed average 24 vs declared 28).
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const NOW = new Date(2026, 8, 25, 15, 0, 0);
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const daysFromNow = (offsetDays: number) => {
  const date = addDays(NOW, offsetDays);
  date.setHours(0, 0, 0, 0);
  return date;
};

async function flush() {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

async function renderScreen() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">{() => <ConceiveStatisticsScreen />}</Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await flush();
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf);

const declare = (overrides: Partial<ReturnType<typeof getCyclePreferences>>) =>
  setCyclePreferences({...getCyclePreferences(), ...overrides});

beforeEach(async () => {
  resetPremiumStateForTests();
  await AsyncStorage.clear();
  jest.useFakeTimers({advanceTimers: true, now: NOW});
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('resolveConceptionCycleBasics', () => {
  const declared = {lastPeriodStart: daysFromNow(-8), cycleDuration: 28, periodDuration: 5, regularity: 'unknown' as const};

  it("'exact' mode uses the prediction's averageCycleLength (observed average)", () => {
    const status = {mode: 'exact' as const, date: daysFromNow(10), averageCycleLength: 24};
    expect(resolveConceptionCycleBasics(declared, status).cycleDuration).toBe(24);
  });

  it("'window' and 'observing' modes keep the declared cycle length", () => {
    const window = {mode: 'window' as const, windowStart: daysFromNow(10), windowEnd: daysFromNow(16), isLate: false};
    const observing = {mode: 'observing' as const, monthsElapsed: 1, totalMonths: 3, complete: false};
    expect(resolveConceptionCycleBasics(declared, window).cycleDuration).toBe(28);
    expect(resolveConceptionCycleBasics(declared, observing).cycleDuration).toBe(28);
  });

  it('a regular declared cycle is unchanged (averageCycleLength echoes the declared length)', () => {
    const regular = {...declared, regularity: 'yes' as const};
    const status = computeCyclePredictionStatus(regular, 'yes', [], null, startOfDay(NOW));
    expect(resolveConceptionCycleBasics(regular, status).cycleDuration).toBe(28);
  });
});

describe('ConceiveStatisticsScreen - fertile window uses the effective cycle length', () => {
  it("regularity 'unknown' + regular-looking observed 24-day cycles: ovulation follows the observed average, not the declared 28", async () => {
    await act(async () => {
      // Four real period starts, 24 days apart -> three observed gaps of 24
      // (regular-looking). The declared cycleDuration stays 28.
      declare({lastPeriodStart: daysFromNow(-80), periodDuration: 5, cycleDuration: 28, regularity: 'unknown'});
      declare({lastPeriodStart: daysFromNow(-56)});
      declare({lastPeriodStart: daysFromNow(-32)});
      declare({lastPeriodStart: daysFromNow(-8)});
    });

    const today = startOfDay(NOW);
    const prefs = getCyclePreferences();
    const observed = upcomingFertileWindow({...prefs, cycleDuration: 24}, today).ovulation;
    const declaredWindow = upcomingFertileWindow({...prefs, cycleDuration: 28}, today).ovulation;
    // Guard: the two candidates really differ, so the assertion is meaningful.
    expect(formatShortDate(observed)).not.toBe(formatShortDate(declaredWindow));

    const renderer = await renderScreen();
    const texts = allTexts(renderer);
    expect(texts).toContain(formatShortDate(observed));
    expect(texts).not.toContain(formatShortDate(declaredWindow));
  });

  it('regular declared cycle: the fertile window still follows the declared length', async () => {
    await act(async () => {
      declare({lastPeriodStart: daysFromNow(-8), periodDuration: 5, cycleDuration: 30, regularity: 'yes'});
    });
    const today = startOfDay(NOW);
    const expected = upcomingFertileWindow({...getCyclePreferences(), cycleDuration: 30}, today).ovulation;
    const renderer = await renderScreen();
    expect(allTexts(renderer)).toContain(formatShortDate(expected));
  });
});
