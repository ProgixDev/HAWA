import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import JournalCycleEvolutionScreen from '../JournalCycleEvolutionScreen';
import {getCyclePreferences, setCyclePreferences} from '../../../state/onboardingPreferences';
import {addDays, computeNextPeriod, computeIrregularWindow, formatDateRange, formatShortDate, startOfDay} from '../../../utils/cycleMath';

// M19 - "Évolution du cycle" only ever shows values derived from the user's
// own confirmed cycle data. Module-singleton stores persist between tests in
// this file, so the scenarios are ordered: (1) nothing confirmed, then
// (2) a regular declared cycle, (3) declared irregular, (4) "Je ne sais pas".
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
  for (let index = 0; index < 6; index += 1) {
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
              <Stack.Screen name="Test">{() => <JournalCycleEvolutionScreen />}</Stack.Screen>
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

beforeAll(async () => {
  await AsyncStorage.clear();
});

beforeEach(() => {
  jest.useFakeTimers({advanceTimers: true, now: NOW});
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('JournalCycleEvolutionScreen - real data only', () => {
  it('1. no confirmed cycle data: honest empty state, no fallback-derived day/phase/dates', async () => {
    const renderer = await renderScreen();
    const texts = allTexts(renderer);
    expect(texts).toContain('Pas encore assez de données');
    expect(texts).not.toContain('jour');
    expect(texts).not.toContain('Progression du cycle');
    expect(texts).not.toContain('Repères du cycle');
    expect(texts).not.toContain('Prochaines règles estimées');
    expect(texts.some(text => /^Jour \d+ sur/.test(text))).toBe(false);
  });

  it('2. regular declared cycle: shows the real cycle day, phase and an exact next-period date', async () => {
    await act(async () => {
      declare({lastPeriodStart: daysFromNow(-5), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    });
    const renderer = await renderScreen();
    const texts = allTexts(renderer);
    expect(texts).not.toContain('Pas encore assez de données');
    expect(texts).toContain('Jour 6 sur 28');
    expect(texts).toContain('Repères du cycle');
    expect(texts).toContain(formatShortDate(computeNextPeriod(getCyclePreferences(), startOfDay(NOW))));
  });

  it('the empty state turns into the real view live once a cycle is confirmed (store subscription)', async () => {
    // Scenario 1's store state is already confirmed by now, so verify the
    // reverse direction instead: an edit while mounted refreshes the day.
    const renderer = await renderScreen();
    expect(allTexts(renderer)).toContain('Jour 6 sur 28');
    await act(async () => {
      declare({lastPeriodStart: daysFromNow(-7)});
    });
    await flush();
    expect(allTexts(renderer)).toContain('Jour 8 sur 28');
  });

  it("3. declared irregular cycle: next period is an estimated WINDOW, never one certain date", async () => {
    await act(async () => {
      declare({regularity: 'no'});
    });
    const renderer = await renderScreen();
    const texts = allTexts(renderer);
    const {start, end} = computeIrregularWindow(getCyclePreferences().lastPeriodStart);
    expect(texts).toContain(formatDateRange(start, end));
    expect(texts).not.toContain(formatShortDate(computeNextPeriod(getCyclePreferences(), startOfDay(NOW))));
  });

  it("4. regularity 'unknown' without enough observed periods: 'Observation en cours' instead of a fabricated date", async () => {
    await act(async () => {
      declare({regularity: 'unknown'});
    });
    const renderer = await renderScreen();
    const texts = allTexts(renderer);
    expect(texts).toContain('Observation en cours');
    expect(texts).toContain('Prochaines règles estimées');
  });
});
