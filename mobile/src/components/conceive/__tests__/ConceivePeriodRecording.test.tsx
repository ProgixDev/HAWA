import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import ConceiveDashboard from '../ConceiveDashboard';
import ConceiveCalendarContent from '../ConceiveCalendarContent';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {
  getCyclePreferences,
  getPeriodHistory,
  isDateWithinConfirmedPeriod,
  setCyclePreferences,
} from '../../../state/onboardingPreferences';

// H6 — the Conceive objective can record a period through the SAME shared
// period architecture as Cycle (PeriodStartBottomSheet → confirmPeriodStart →
// onboardingPreferences.periodHistory): no second history, earlier periods kept.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const dayKey = (date: Date) => date.toLocaleDateString('en-CA');
const daysAgo = (n: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};

async function renderScreen(element: React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">{() => element}</Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}
const renderDashboard = () =>
  renderScreen(<ConceiveDashboard navigation={{navigate: jest.fn()} as never} route={{key: 'd', name: 'CycleHome'}} />);

const pressByLabel = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  await act(async () => {
    renderer.root.find(n => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function').props.onPress();
  });
};
const hasLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(n => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function').length > 0;

beforeEach(() => {
  resetPremiumStateForTests();
  // A period recorded ~3 weeks ago (not active today): the CTA is offered.
  setCyclePreferences({
    ...getCyclePreferences(),
    lastPeriodStart: daysAgo(21),
    periodDuration: 5,
    cycleDuration: 28,
    regularity: 'yes',
  });
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

// (Runs first: the period store is a module singleton, and the Dashboard test
// below records a period for today.)
describe('Conceive Calendar — record a period for the selected day', () => {
  it('offers "Mes règles ont commencé" for today (not inside a confirmed period)', async () => {
    const renderer = await renderScreen(<ConceiveCalendarContent />);
    expect(hasLabel(renderer, 'Mes règles ont commencé ce jour')).toBe(true);
  });
});

describe('Conceive Dashboard — "Mes règles ont commencé"', () => {
  it('is offered when today is not inside a confirmed period, and records the start via the shared store', async () => {
    const previousStart = dayKey(daysAgo(21));
    const renderer = await renderDashboard();
    expect(hasLabel(renderer, 'Mes règles ont commencé')).toBe(true);

    await pressByLabel(renderer, 'Mes règles ont commencé');
    await act(async () => {
      renderer.root
        .find(n => typeof n.props.onPress === 'function' && n.findAllByType(Text).some(t => String(t.props.children).includes('Oui, aujourd')))
        .props.onPress();
    });

    expect(dayKey(getCyclePreferences().lastPeriodStart)).toBe(dayKey(new Date()));
    const history = getPeriodHistory();
    expect(history.some(record => record.startDate === dayKey(new Date()))).toBe(true);
    // Earlier history is preserved (same shared history, no rewrite).
    expect(history.some(record => record.startDate === previousStart)).toBe(true);
    // The Dashboard re-renders from the store: today is now a confirmed period
    // day, so the CTA is gone.
    expect(isDateWithinConfirmedPeriod(new Date())).toBe(true);
    expect(hasLabel(renderer, 'Mes règles ont commencé')).toBe(false);
  });

  it('is not offered while today is already inside a confirmed period', async () => {
    setCyclePreferences({...getCyclePreferences(), lastPeriodStart: daysAgo(1)});
    const renderer = await renderDashboard();
    expect(hasLabel(renderer, 'Mes règles ont commencé')).toBe(false);
  });
});
