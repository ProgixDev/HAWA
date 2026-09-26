import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Pressable} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import ContraceptionDashboard from '../ContraceptionDashboard';
import {resetPremiumStateForTests, updatePremiumState} from '../../../state/premiumStore';
import {setContraceptionPreferences} from '../../../state/contraceptionPreferences';
import {
  getAllContraceptionIntakeRecords,
  setContraceptionIntakeStatus,
} from '../../../state/contraceptionIntakeHistoryStore';

// M41 — Contraception "Voir tout l'historique" (intake history list) is the
// only history LIST surface that applies the Free window: Free sees the last
// 30 days (today included), Premium sees everything; the older records are
// never deleted, only not listed for a Free session.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const NOW = new Date(2026, 8, 25, 15, 0, 0);
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const key = (daysAgo: number) => new Date(2026, 8, 25 - daysAgo, 12).toLocaleDateString('en-CA');

async function flush() {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

async function renderDashboard() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">
                  {() => <ContraceptionDashboard navigation={{navigate: jest.fn()} as never} route={{key: 'test', name: 'CycleHome'}} />}
                </Stack.Screen>
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

const openFullHistory = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const button = renderer.root
    .findAllByType(Pressable)
    .find(node => node.props.accessibilityLabel === 'Voir tout l’historique');
  expect(button).toBeDefined();
  await act(async () => {
    button!.props.onPress();
  });
  await flush();
};

const historyRows = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root
    .findAllByType(Pressable)
    .filter(node => node.props.accessibilityHint === 'Ouvre les options de modification et de suppression');

const unlockHint = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByProps({accessibilityLabel: 'Débloquer tout l’historique avec Premium'}).length > 0;

beforeEach(async () => {
  resetPremiumStateForTests();
  jest.useFakeTimers({advanceTimers: true, now: NOW});
  await setContraceptionPreferences({method: 'pill', remindersEnabled: false});
  await setContraceptionIntakeStatus(key(0), 'taken', 'pill');
  await setContraceptionIntakeStatus(key(29), 'taken', 'pill'); // last day of the 30-day window
  await setContraceptionIntakeStatus(key(30), 'missed', 'pill'); // first day OUTSIDE the window
  await setContraceptionIntakeStatus(key(90), 'taken', 'pill');
});
afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('Contraception intake history list — history entitlement', () => {
  it('Free: lists only the last 30 days and shows the Premium unlock hint; older records stay stored', async () => {
    const renderer = await renderDashboard();
    await openFullHistory(renderer);
    expect(historyRows(renderer)).toHaveLength(2);
    expect(unlockHint(renderer)).toBe(true);
    // Historical data is never deleted to enforce a display limit.
    expect(Object.keys(getAllContraceptionIntakeRecords())).toHaveLength(4);
  });

  it('Premium: lists every record and shows no unlock hint', async () => {
    act(() => {
      updatePremiumState({isPremium: true});
    });
    const renderer = await renderDashboard();
    await openFullHistory(renderer);
    expect(historyRows(renderer)).toHaveLength(4);
    expect(unlockHint(renderer)).toBe(false);
  });

  it('losing Premium re-narrows the list live without deleting anything', async () => {
    act(() => {
      updatePremiumState({isPremium: true});
    });
    const renderer = await renderDashboard();
    await openFullHistory(renderer);
    expect(historyRows(renderer)).toHaveLength(4);
    await act(async () => {
      updatePremiumState({isPremium: false});
    });
    await flush();
    expect(historyRows(renderer)).toHaveLength(2);
    expect(Object.keys(getAllContraceptionIntakeRecords())).toHaveLength(4);
  });
});
