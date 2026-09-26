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
import {saveJournalSection} from '../../../state/dailyJournalStore';
import {getCyclePreferences, setCyclePreferences} from '../../../state/onboardingPreferences';
import {addDays} from '../../../utils/cycleMath';

// M6 — Conceive statistics: (1) a changed cycle length refreshes the screen,
// (2) a CONFIGURED cycle length is never worded as a measured average,
// (3) every temperature shown uses ONE unit (no mixed °C / °F).
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const NOW = new Date(2026, 8, 25, 15, 0, 0);
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const keyFor = (offsetDays: number) => addDays(NOW, offsetDays).toLocaleDateString('en-CA');
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

describe('ConceiveStatisticsScreen — configured vs measured cycle length', () => {
  it('a configured (never measured) length is "Durée habituelle / Renseignée par toi", not a "moyenne"', async () => {
    declare({lastPeriodStart: daysFromNow(-10), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    const renderer = await renderScreen();
    await openTab(renderer, 'Cycle');

    const texts = allTexts(renderer);
    expect(texts).toContain('Durée habituelle');
    expect(texts).toContain('28 jours');
    expect(texts).toContain('Renseignée par toi');
    expect(texts).not.toContain('Durée moyenne du cycle');
    expect(texts).not.toContain('Durée moyenne');
  });

  it('changing the configured cycle length refreshes the open Statistics screen', async () => {
    declare({lastPeriodStart: daysFromNow(-10), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    const renderer = await renderScreen();
    await openTab(renderer, 'Cycle');
    expect(allTexts(renderer)).toContain('28 jours');

    await act(async () => {
      declare({cycleDuration: 31});
    });
    await flush();

    const texts = allTexts(renderer);
    expect(texts).toContain('31 jours');
    expect(texts).not.toContain('28 jours');
  });
});

describe('ConceiveStatisticsScreen — one temperature unit everywhere', () => {
  async function temperatureTexts() {
    const renderer = await renderScreen();
    await openTab(renderer, 'Température');
    return allTexts(renderer).filter(text => /°/.test(text));
  }

  beforeEach(() => {
    declare({lastPeriodStart: daysFromNow(-10), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
  });

  it('a °C user sees °C for latest, average, min/max and the trend note — never °F', async () => {
    await saveJournalSection(keyFor(-3), 'temperature', {value: 36.4, unit: 'C'});
    await saveJournalSection(keyFor(-2), 'temperature', {value: 36.8, unit: 'C'});
    await saveJournalSection(keyFor(-1), 'temperature', {value: 36.6, unit: 'C'});

    const shown = await temperatureTexts();
    expect(shown).toContain('36.6 °C');
    expect(shown).toContain('36.6 °C'); // average of 36.4/36.8/36.6
    expect(shown).toContain('36.4 °C / 36.8 °C');
    expect(shown.some(text => text.includes('°F'))).toBe(false);
    expect(shown.every(text => text.includes('°C'))).toBe(true);
  });

  it('a °F user sees °F for every value — never °C', async () => {
    await saveJournalSection(keyFor(-3), 'temperature', {value: 97.5, unit: 'F'});
    await saveJournalSection(keyFor(-2), 'temperature', {value: 98.2, unit: 'F'});
    await saveJournalSection(keyFor(-1), 'temperature', {value: 97.9, unit: 'F'});

    const shown = await temperatureTexts();
    expect(shown).toContain('97.9 °F');
    expect(shown).toContain('97.5 °F / 98.2 °F');
    expect(shown.some(text => text.includes('°C'))).toBe(false);
  });

  it('mixed history is converted to the latest reading unit at display time only', async () => {
    await saveJournalSection(keyFor(-3), 'temperature', {value: 36.5, unit: 'C'});
    await saveJournalSection(keyFor(-1), 'temperature', {value: 97.7, unit: 'F'});

    const shown = await temperatureTexts();
    // 36.5 °C = 97.7 °F -> everything expressed in °F.
    expect(shown).toContain('97.7 °F');
    expect(shown).toContain('97.7 °F / 97.7 °F');
    expect(shown.some(text => /\d\s?°C/.test(text))).toBe(false);
    expect(shown.some(text => text.includes('converti'))).toBe(true);

    // Stored data untouched.
    const raw = String(await AsyncStorage.getItem('@hawa/daily-journal/v1'));
    expect(raw).toContain('"value":36.5');
    expect(raw).toContain('"unit":"C"');
  });
});
