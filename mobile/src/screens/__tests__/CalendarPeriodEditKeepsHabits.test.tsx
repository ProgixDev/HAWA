import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import CalendarScreen from '../CalendarScreen';
import {getPeriodEndDateTime, getCyclePreferences, getRecordedPeriodHistory, setCyclePreferences} from '../../state/onboardingPreferences';
import {getConfirmedPeriodHistory} from '../../state/confirmedPeriodHistoryStore';

// M8 (+M4/M7 through the Calendar's range editor): editing ONE actual period
// must not redefine the habitual periodDuration/cycleDuration, must replace
// (not duplicate) the edited occurrence, and the day card must show the range
// that was really recorded.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderCalendar() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">
                {() => <CalendarScreen navigation={{navigate: jest.fn()} as never} route={{key: 'test', name: 'Calendar'}} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const pressDay = async (renderer: ReactTestRenderer.ReactTestRenderer, dayOfMonth: number) => {
  const cell = renderer.root.findAll(
    node =>
      node.props.accessibilityRole === 'button' &&
      typeof node.props.accessibilityLabel === 'string' &&
      node.props.accessibilityLabel.startsWith(`${dayOfMonth}, `),
  )[0];
  await act(async () => {
    cell.props.onPress();
  });
};

const pressButtonWithText = async (renderer: ReactTestRenderer.ReactTestRenderer, text: string) => {
  await act(async () => {
    renderer.root
      .find(node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(t => t.props.children === text))
      .props.onPress();
  });
};

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root
    .findAll(node => (node.type as unknown) === 'Text')
    .map(node => (Array.isArray(node.props.children) ? node.props.children.join('') : String(node.props.children)));

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 8, 20, 10, 0, 0));
  setCyclePreferences({lastPeriodStart: new Date(2026, 7, 4), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
  setCyclePreferences({lastPeriodStart: new Date(2026, 8, 1), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('CalendarScreen — editing the current period range', () => {
  it('extends Sep 1–5 to Sep 1–7: recorded period is 7 days, habits stay 5 / 28, no duplicate, day card shows the recorded range', async () => {
    const renderer = await renderCalendar();
    await pressButtonWithText(renderer, 'Modifier');
    await pressDay(renderer, 6);
    await pressDay(renderer, 7);
    await pressButtonWithText(renderer, 'Enregistrer');

    expect(getRecordedPeriodHistory().map(record => `${record.startDate}..${record.endDate}`)).toEqual([
      '2026-08-04..2026-08-08',
      '2026-09-01..2026-09-07',
    ]);
    expect(getCyclePreferences()).toMatchObject({periodDuration: 5, cycleDuration: 28});
    expect(getCyclePreferences().lastPeriodStart.toLocaleDateString('en-CA')).toBe('2026-09-01');
    // A range fully in the past is confirmed for Qadaa, on the same occurrence.
    expect(getConfirmedPeriodHistory().map(item => item.id)).toEqual(['2026-09-01']);
    // ...and the purity/prayer end follows the SAME corrected end (no stale value).
    expect(getPeriodEndDateTime()?.toLocaleDateString('en-CA')).toBe('2026-09-07');

    // The day card (selected day = Sept 1) reads the recorded range, not the habit.
    const texts = textsOf(renderer);
    expect(texts).toContain('7 jours');
    expect(texts).not.toContain('5 jours');
  });

  // (The period store is a module singleton: this test starts from the range the
  // previous test saved, Sep 1–7 — re-declaring the same start never resets it.)
  it('moving the start (Sep 1–7 -> Sep 2–7) replaces the occurrence — the old start is gone', async () => {
    const renderer = await renderCalendar();
    await pressButtonWithText(renderer, 'Modifier');
    await pressDay(renderer, 1); // deselect Sep 1
    await pressButtonWithText(renderer, 'Enregistrer');

    expect(getRecordedPeriodHistory().map(record => `${record.startDate}..${record.endDate}`)).toEqual([
      '2026-08-04..2026-08-08',
      '2026-09-02..2026-09-07',
    ]);
    expect(getCyclePreferences().lastPeriodStart.toLocaleDateString('en-CA')).toBe('2026-09-02');
    expect(getCyclePreferences()).toMatchObject({periodDuration: 5, cycleDuration: 28});
    // The confirmed occurrence follows the corrected start (old one dropped).
    expect(getConfirmedPeriodHistory().map(item => item.id)).toEqual(['2026-09-02']);
  });
});
