import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Pressable, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import ConceiveCalendarContent from '../ConceiveCalendarContent';
import {getCyclePreferences, setCyclePreferences} from '../../../state/onboardingPreferences';
import {saveJournalSection} from '../../../state/dailyJournalStore';

// M21 - the Conceive Calendar's selected-day rows open the matching journal
// for THAT day (today or past). Rapports stays non-interactive (its private
// unlock flow does not carry a date). Recorded values stay visible there
// regardless of the "Indicateurs suivis" preference (history preserved, M17).
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const NOW = new Date(2026, 8, 25, 15, 0, 0);
const TODAY = '2026-09-25';
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function flush() {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');

function ProbeScreen({route}: {route: {name: string; params?: {date?: string}}}) {
  return <Text>{`ROUTE ${route.name} ${route.params?.date ?? 'none'}`}</Text>;
}

async function renderCalendar() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Calendar">{() => <ConceiveCalendarContent />}</Stack.Screen>
                <Stack.Screen component={ProbeScreen as never} name="TemperatureEntry" />
                <Stack.Screen component={ProbeScreen as never} name="CervicalMucusEntry" />
                <Stack.Screen component={ProbeScreen as never} name="LHTestEntry" />
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await flush();
  return renderer;
}

const rowByLabelPrefix = (renderer: ReactTestRenderer.ReactTestRenderer, prefix: string) =>
  renderer.root.findAllByType(Pressable).find(node => String(node.props.accessibilityLabel ?? '').startsWith(prefix));

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.useFakeTimers({advanceTimers: true, now: NOW});
  setCyclePreferences({
    ...getCyclePreferences(),
    lastPeriodStart: new Date(2026, 8, 20),
    periodDuration: 5,
    cycleDuration: 28,
    regularity: 'yes',
  });
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('ConceiveCalendarContent - selected day rows open the journal for that day', () => {
  it('Température / Glaire / Test LH rows are buttons that navigate with the selected day', async () => {
    await saveJournalSection(TODAY, 'temperature', {value: 36.7, unit: 'C'});
    const renderer = await renderCalendar();

    const temperatureRow = rowByLabelPrefix(renderer, 'Température');
    expect(temperatureRow).toBeDefined();
    // The recorded value is visible in the row.
    expect(temperatureRow!.props.accessibilityLabel).toContain('36.7°C');
    expect(rowByLabelPrefix(renderer, 'Glaire cervicale')).toBeDefined();
    expect(rowByLabelPrefix(renderer, 'Test LH')).toBeDefined();

    await act(async () => {
      temperatureRow!.props.onPress();
    });
    await flush();
    const texts = renderer.root.findAllByType(Text).map(textOf);
    expect(texts).toContain(`ROUTE TemperatureEntry ${TODAY}`);
  });

  it('Rapports is not an interactive row (its private unlock flow carries no date)', async () => {
    const renderer = await renderCalendar();
    expect(rowByLabelPrefix(renderer, 'Rapports')).toBeUndefined();
  });
});
