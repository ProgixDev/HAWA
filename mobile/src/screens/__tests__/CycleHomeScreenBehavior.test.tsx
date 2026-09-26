import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../navigation/JournalSheetContext';
import CycleHomeScreen from '../CycleHomeScreen';
import {setCyclePreferences} from '../../state/onboardingPreferences';
import {getJournalEntry} from '../../state/dailyJournalStore';

jest.mock('../../state/dailyJournalStore', () => ({
  ...jest.requireActual('../../state/dailyJournalStore'),
  getJournalEntry: jest.fn(async () => undefined),
}));

const mockGetJournalEntry = getJournalEntry as jest.Mock;

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 320, height: 640},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderCycleHome() {
  const navigation = {navigate: jest.fn()};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">
                  {() => <CycleHomeScreen navigation={navigation as never} route={{key: 'test', name: 'CycleHome'}} />}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return {renderer, navigation};
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
  mockGetJournalEntry.mockClear();
  confirmedCycle('yes');
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('CycleHomeScreen — "today" refreshes without reopening the app', () => {
  it('23:59 → 00:00: the dashboard reads the NEW day\'s journal', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 23, 59, 0));
    await renderCycleHome();
    expect(mockGetJournalEntry).toHaveBeenCalledWith('2026-09-25');
    mockGetJournalEntry.mockClear();

    await act(async () => {
      jest.advanceTimersByTime(90_000);
    });

    expect(mockGetJournalEntry).toHaveBeenCalledWith('2026-09-26');
  });
});

describe('CycleHomeScreen — "Voir plus"', () => {
  it('opens the existing Calendar tab (no dead link)', async () => {
    jest.setSystemTime(new Date(2026, 8, 12, 10, 0, 0));
    const {renderer, navigation} = await renderCycleHome();

    const more = renderer.root.findAll(node => node.props.children === 'Voir plus')[0];
    expect(more).toBeTruthy();
    let pressable = more;
    while (pressable && typeof pressable.props.onPress !== 'function') {
      pressable = pressable.parent as ReactTestRenderer.ReactTestInstance;
    }
    act(() => pressable.props.onPress());

    expect(navigation.navigate).toHaveBeenCalledWith('Calendar');
  });
});

describe('CycleHomeScreen — predictions never contradict the window', () => {
  it('REGULAR cycle: precise fertile window and ovulation dates are shown', async () => {
    jest.setSystemTime(new Date(2026, 8, 3, 10, 0, 0));
    confirmedCycle('yes');
    const {renderer} = await renderCycleHome();
    const texts = textsOf(renderer);
    expect(texts).not.toContain('Non estimable');
    expect(texts).toContain('15 septembre'); // ovulation (cycle day 15 of a 28-day cycle)
    expect(texts).toContain('Durée habituelle');
    expect(texts).toContain('28 jours');
  });

  it('IRREGULAR cycle: the next period is a window, so no single ovulation / fertile date is shown', async () => {
    jest.setSystemTime(new Date(2026, 8, 3, 10, 0, 0));
    confirmedCycle('no');
    const {renderer} = await renderCycleHome();
    const texts = textsOf(renderer);
    expect(texts.filter(text => text === 'Non estimable')).toHaveLength(2);
    expect(texts).not.toContain('15 septembre');
    expect(texts).toContain('26–32 jours');
  });

  it('UNKNOWN regularity, still observing: existing observation wording is preserved', async () => {
    jest.setSystemTime(new Date(2026, 8, 3, 10, 0, 0));
    confirmedCycle('unknown');
    const {renderer} = await renderCycleHome();
    const texts = textsOf(renderer);
    expect(texts.some(text => /^Mois \d sur 3$/.test(text))).toBe(true);
    expect(texts).toContain('Estimation provisoire');
  });
});
