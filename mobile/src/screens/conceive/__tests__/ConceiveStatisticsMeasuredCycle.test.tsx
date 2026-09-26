import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Pressable, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import ConceiveStatisticsScreen from '../ConceiveStatisticsScreen';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {getCyclePreferences, setCyclePreferences} from '../../../state/onboardingPreferences';
import {addDays} from '../../../utils/cycleMath';

// M6 — separate file: the onboardingPreferences period history is a module
// singleton, so the measured-cycle scenarios need a fresh module registry.
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

async function openTab(renderer: ReactTestRenderer.ReactTestRenderer, label: string) {
  const pressable = renderer.root
    .findAllByType(Pressable)
    .find(node => node.findAllByType(Text).some(text => textOf(text) === label));
  expect(pressable).toBeDefined();
  await act(async () => {
    pressable!.props.onPress();
  });
  // Tab change = 120ms fade out, then setTab, then fade in.
  for (let index = 0; index < 4; index += 1) {
    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });
  }
}

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

describe('ConceiveStatisticsScreen — measured cycle length', () => {
  it('before any cycle data is confirmed nothing is presented as an average or a value', async () => {
    const renderer = await renderScreen();
    await openTab(renderer, 'Cycle');
    const texts = allTexts(renderer);
    expect(texts).toContain('Durée habituelle');
    expect(texts).toContain('Non renseignée');
    expect(texts).not.toContain('Durée moyenne du cycle');
  });

  it('recording periods refreshes the measured cycle lengths, and only then is it a "Durée moyenne"', async () => {
    await act(async () => {
      declare({lastPeriodStart: daysFromNow(-50), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    });
    const renderer = await renderScreen();
    await openTab(renderer, 'Cycle');
    expect(allTexts(renderer)).not.toContain('Durée moyenne du cycle');

    // Two more real period starts -> two measured cycles of 25 and 23 days,
    // both inside the free 1-month window: average 24.
    await act(async () => {
      declare({lastPeriodStart: daysFromNow(-25)});
      declare({lastPeriodStart: daysFromNow(-2)});
    });
    await flush();

    const texts = allTexts(renderer);
    expect(texts).toContain('Durée moyenne du cycle');
    expect(texts).toContain('24 j');
    expect(texts).toContain('Basée sur tes cycles enregistrés');
    expect(texts).toContain('23 / 25 j');
    expect(texts).not.toContain('Durée habituelle');
  });
});
