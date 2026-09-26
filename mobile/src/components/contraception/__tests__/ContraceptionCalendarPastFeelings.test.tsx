import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import ContraceptionCalendarContent from '../ContraceptionCalendarContent';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {setContraceptionPreferences} from '../../../state/contraceptionPreferences';

// M21 (Contraception) - the Calendar offers "Effets ressentis" for a PAST
// selected day only (intake / ring-patch events / notes stay today-only).
jest.mock('../../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn(),
  cancelLocalNotification: jest.fn(),
}));

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const navigateSpy = jest.fn();

async function renderCalendar() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">{() => <ContraceptionCalendarContent />}</Stack.Screen>
                <Stack.Screen name="ContraceptionJournalEntry">
                  {({route}) => {
                    navigateSpy(route.params);
                    return null;
                  }}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  return renderer;
}

const shortcutNodes = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(
    node =>
      typeof node.props.onPress === 'function' && /effets ressentis de ce jour$/.test(node.props.accessibilityLabel ?? ''),
  );

const cell = (renderer: ReactTestRenderer.ReactTestRenderer, day: number) =>
  renderer.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      typeof node.props.accessibilityLabel === 'string' &&
      node.props.accessibilityLabel.split(/[ ,]/)[0] === String(day),
  )[0];

beforeEach(async () => {
  resetPremiumStateForTests();
  navigateSpy.mockClear();
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 26, 15, 0, 0)});
  await setContraceptionPreferences({method: 'pill', methodStartDate: '2026-09-01'});
});
afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('ContraceptionCalendarContent - past day "Effets ressentis" entry (M21)', () => {
  it('not offered for today or a future day; offered for a past day and opens the entry with that date', async () => {
    const renderer = await renderCalendar();
    expect(shortcutNodes(renderer)).toHaveLength(0);

    await act(async () => {
      cell(renderer, 27).props.onPress();
    });
    expect(shortcutNodes(renderer)).toHaveLength(0);

    await act(async () => {
      cell(renderer, 23).props.onPress();
    });
    const shortcuts = shortcutNodes(renderer);
    expect(shortcuts.length).toBeGreaterThan(0);

    await act(async () => {
      shortcuts[0].props.onPress();
    });
    expect(navigateSpy).toHaveBeenCalledWith(expect.objectContaining({category: 'feelings', date: '2026-09-23'}));
  });
});
