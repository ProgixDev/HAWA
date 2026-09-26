import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import CalendarScreen from '../CalendarScreen';
import {getCyclePreferences, getPeriodHistory, setCyclePreferences} from '../../state/onboardingPreferences';

// M15 — the Calendar's period-start CTA acts on the SELECTED date: never a
// future day, never silently "today", and the sheet names the date it writes.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const CTA_LABEL = 'Mes règles ont commencé ce jour';

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

const hasCta = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => node.props.accessibilityLabel === CTA_LABEL && typeof node.props.onPress === 'function').length > 0;

const pressCta = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
  await act(async () => {
    renderer.root.find(node => node.props.accessibilityLabel === CTA_LABEL && typeof node.props.onPress === 'function').props.onPress();
  });
};

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

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root
    .findAll(node => (node.type as unknown) === 'Text')
    .map(node => (Array.isArray(node.props.children) ? node.props.children.join('') : String(node.props.children)));

const pressButtonWithText = async (renderer: ReactTestRenderer.ReactTestRenderer, text: string) => {
  await act(async () => {
    renderer.root
      .find(node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(t => String(t.props.children).includes(text)))
      .props.onPress();
  });
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 8, 20, 10, 0, 0));
  // Period Sept 1–5: today (Sept 20) is not inside a recorded period.
  setCyclePreferences({lastPeriodStart: new Date(2026, 8, 1), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('CalendarScreen — the period-start CTA follows the selected date', () => {
  it('today (default selection): the CTA is offered and the sheet keeps "Oui, aujourd’hui"', async () => {
    const renderer = await renderCalendar();
    expect(hasCta(renderer)).toBe(true);

    await pressCta(renderer);
    expect(textsOf(renderer)).toContain('Oui, aujourd’hui');
  });

  it('a FUTURE date has no CTA that could record a real period start', async () => {
    const renderer = await renderCalendar();
    await pressDay(renderer, 25);
    expect(textsOf(renderer)).toContain('25 septembre 2026');
    expect(hasCta(renderer)).toBe(false);

    await pressDay(renderer, 20);
    expect(hasCta(renderer)).toBe(true);
  });

  it('a PAST date: the sheet names that date and the primary button records THAT date, not today', async () => {
    const renderer = await renderCalendar();
    await pressDay(renderer, 10);
    expect(hasCta(renderer)).toBe(true);

    await pressCta(renderer);
    const texts = textsOf(renderer);
    expect(texts).toContain('Oui, le 10 septembre');
    expect(texts).toContain('Tes règles ont commencé le 10 septembre ?');
    expect(texts).not.toContain('Oui, aujourd’hui');

    await pressButtonWithText(renderer, 'Oui, le 10 septembre');

    const recorded = getPeriodHistory().map(record => record.startDate);
    expect(recorded).toContain('2026-09-10');
    expect(recorded).not.toContain('2026-09-20');
    expect(getCyclePreferences().lastPeriodStart.toLocaleDateString('en-CA')).toBe('2026-09-10');
  });
});
