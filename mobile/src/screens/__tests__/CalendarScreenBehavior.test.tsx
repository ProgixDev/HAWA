import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import CalendarScreen from '../CalendarScreen';
import {setCyclePreferences} from '../../state/onboardingPreferences';

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 320, height: 640},
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

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root
    .findAll(node => (node.type as unknown) === 'Text')
    .map(node => (Array.isArray(node.props.children) ? node.props.children.join('') : String(node.props.children)));

const confirmedCycle = (regularity: 'yes' | 'no' | 'unknown') =>
  setCyclePreferences({
    lastPeriodStart: new Date(2026, 8, 1),
    periodDuration: 5,
    cycleDuration: 28,
    regularity,
  });

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('CalendarScreen — prediction cards agree with the Dashboard', () => {
  it('REGULAR cycle: precise dates', async () => {
    jest.setSystemTime(new Date(2026, 8, 3, 10, 0, 0));
    confirmedCycle('yes');
    const texts = textsOf(await renderCalendar());
    expect(texts).not.toContain('Non estimable');
    expect(texts).toContain('15 septembre');
    expect(texts).toContain('Durée habituelle');
  });

  it('IRREGULAR cycle: window everywhere, no single ovulation / fertile date, no invented phase', async () => {
    jest.setSystemTime(new Date(2026, 8, 3, 10, 0, 0));
    confirmedCycle('no');
    const texts = textsOf(await renderCalendar());
    expect(texts).toContain('26–32 jours');
    // Prediction card (fertile + ovulation) and timeline (fertile + ovulation).
    expect(texts.filter(text => text === 'Non estimable').length).toBeGreaterThanOrEqual(4);
    expect(texts).not.toContain('15 septembre');
    // Sept 3 is inside the recorded period (Sept 1–5): the phase is known…
    expect(texts).toContain('Phase menstruelle');
  });

  it('IRREGULAR cycle: a day outside any recorded period gets no invented phase', async () => {
    jest.setSystemTime(new Date(2026, 8, 20, 10, 0, 0));
    confirmedCycle('no');
    const texts = textsOf(await renderCalendar());
    expect(texts).toContain('Phase non estimée');
  });

  it('UNKNOWN regularity while observing: existing observation wording is preserved', async () => {
    jest.setSystemTime(new Date(2026, 8, 3, 10, 0, 0));
    confirmedCycle('unknown');
    const texts = textsOf(await renderCalendar());
    expect(texts.some(text => /^Mois \d sur 3$/.test(text))).toBe(true);
  });
});

describe('CalendarScreen — day rollover', () => {
  it('the default selected day moves to the new day when midnight passes (Sept 30 → Oct 1)', async () => {
    jest.setSystemTime(new Date(2026, 8, 30, 23, 59, 0));
    confirmedCycle('yes');
    const renderer = await renderCalendar();
    expect(textsOf(renderer)).toContain('30 septembre 2026');

    await act(async () => {
      jest.advanceTimersByTime(90_000);
    });

    const texts = textsOf(renderer);
    expect(texts).toContain('1 octobre 2026');
    expect(texts).not.toContain('30 septembre 2026');
  });
});
