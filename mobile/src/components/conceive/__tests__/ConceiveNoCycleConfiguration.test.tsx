import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import ConceiveDashboard from '../ConceiveDashboard';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {getHasConfirmedCycleData} from '../../../state/onboardingPreferences';

// No cycle configuration at all: no period length is invented - the dashboard
// shows the "Configure ton cycle" state (no "J1-n" legend from a placeholder).
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

it('unconfirmed cycle data: "Configure ton cycle", no period legend', async () => {
  resetPremiumStateForTests();
  expect(getHasConfirmedCycleData()).toBe(false);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">
                  {() => <ConceiveDashboard navigation={{navigate: jest.fn()} as never} route={{key: 'd', name: 'CycleHome'}} />}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  const texts = renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));
  expect(texts).toContain('Configure ton cycle');
  expect(texts.some(text => /^J1-\d+$/.test(text))).toBe(false);
  act(() => renderer.unmount());
});
