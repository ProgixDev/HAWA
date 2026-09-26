import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import CalendarScreen from '../CalendarScreen';
import {addPeriodOccurrence, setCyclePreferences} from '../../state/onboardingPreferences';

// M9 residual - the selected-day card's "Début / Fin / Durée des règles" block
// must not present a PROJECTION as history for a past cycle with no recorded
// period. Today is pinned to 2026-09-26; the current cycle starts Sept 16
// (recorded), habitual 28-day cycle / 5-day period.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const UNRECORDED = 'Aucune règle enregistrée pour ce cycle';

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

// The cycle Timeline card below also has one "Début / Fin des règles" pair (it
// describes the CURRENT cycle), so the selected-day card is detected by count.
const count = (texts: string[], label: string) => texts.filter(text => text === label).length;

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root
    .findAll(node => (node.type as unknown) === 'Text')
    .map(node => (Array.isArray(node.props.children) ? node.props.children.join('') : String(node.props.children)));

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 8, 26, 10, 0, 0));
});
afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

// The period store is a module singleton: the tests below run in this order on
// purpose (B has only the current period recorded; A then backfills Sept 1).
describe('Calendar selected-day card - period block', () => {
  it('B. past cycle with NO recorded period: no projected Début / Fin / Durée, an honest line instead', async () => {
    setCyclePreferences({lastPeriodStart: new Date(2026, 8, 16), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    const renderer = await renderCalendar();
    await pressDay(renderer, 3);

    const texts = textsOf(renderer);
    expect(texts).toContain(UNRECORDED);
    expect(texts).toContain('Phase non estimée');
    expect(count(texts, 'Début des règles')).toBe(1); // Timeline only
    expect(count(texts, 'Fin des règles')).toBe(1);
    expect(count(texts, 'Durée des règles')).toBe(0);
  });

  it('A. past cycle WITH a really recorded period: its real Début / Fin / Durée are shown', async () => {
    addPeriodOccurrence(new Date(2026, 8, 1)); // historical backfill, Sept 1-5
    const renderer = await renderCalendar();
    await pressDay(renderer, 3);

    const texts = textsOf(renderer);
    expect(texts).not.toContain(UNRECORDED);
    expect(count(texts, 'Début des règles')).toBe(2); // selected-day card + Timeline
    expect(count(texts, 'Durée des règles')).toBe(1);
    expect(texts).toContain('5 jours');
    expect(texts).toContain('Phase menstruelle');
  });

  it('C. the current cycle is unchanged: recorded start/end/duration shown, no "nothing recorded" line', async () => {
    const renderer = await renderCalendar();
    await pressDay(renderer, 18); // Sept 18, inside the current cycle (started Sept 16)

    const texts = textsOf(renderer);
    expect(texts).not.toContain(UNRECORDED);
    expect(count(texts, 'Début des règles')).toBe(2);
    expect(count(texts, 'Fin des règles')).toBe(2);
    expect(count(texts, 'Durée des règles')).toBe(1);
  });

  it('D. a future prediction is unchanged: the projected block is still shown', async () => {
    const renderer = await renderCalendar();
    await pressDay(renderer, 28); // Sept 28: future, inside the current projected cycle

    const texts = textsOf(renderer);
    expect(texts).not.toContain(UNRECORDED);
    expect(count(texts, 'Début des règles')).toBe(2);
    expect(count(texts, 'Durée des règles')).toBe(1);
  });
});
