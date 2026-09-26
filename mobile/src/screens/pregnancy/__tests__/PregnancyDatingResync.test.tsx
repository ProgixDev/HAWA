import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import InlineCalendarPickerModal from '../../../components/onboarding/InlineCalendarPickerModal';
import PregnancyDatingSetupScreen from '../PregnancyDatingSetupScreen';
import {getPregnancyDating, setPregnancyDating} from '../../../state/pregnancyPreferences';
import {syncPregnancyNotificationsForActiveObjective} from '../../../utils/pregnancyReminderScheduling';
import {addDays, startOfDay} from '../../../utils/cycleMath';

// M30 - saving a valid dating from the edit screen triggers the (objective-
// gated) Pregnancy notification resync, so the weekly reminder follows the
// NEW dating; an invalid dating saves nothing and resyncs nothing. The
// scheduling itself is covered by utils/__tests__/pregnancyRemindersLifecycle.
jest.mock('../../../utils/pregnancyReminderScheduling', () => ({
  syncPregnancyNotificationsForActiveObjective: jest.fn().mockResolvedValue(undefined),
}));

const mockSync = syncPregnancyNotificationsForActiveObjective as jest.Mock;

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderEditScreen() {
  const Screen = PregnancyDatingSetupScreen as unknown as React.ComponentType;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Home">{() => <Text>home</Text>}</Stack.Screen>
              <Stack.Screen component={Screen} initialParams={{mode: 'edit'}} name="PregnancyDatingSetup" />
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  await act(async () => {
    (navRef as unknown as {navigate: (route: string, params?: unknown) => void}).navigate('PregnancyDatingSetup', {mode: 'edit'});
  });
  await settle();
  return renderer;
}

const pickDate = async (renderer: ReactTestRenderer.ReactTestRenderer, date: Date) => {
  await act(async () => {
    renderer.root.findByType(InlineCalendarPickerModal).props.onSelect(date);
  });
};
const save = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const button = renderer.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      (node.props.accessibilityLabel === 'Enregistrer' ||
        node.findAllByType(Text).some(text => [text.props.children].flat(Infinity).join('') === 'Enregistrer')),
  )[0];
  await act(async () => {
    await button.props.onPress();
  });
  await settle();
};

beforeEach(async () => {
  mockSync.mockClear();
  await setPregnancyDating({method: 'lastPeriod', date: startOfDay(addDays(new Date(), -70)).toISOString()});
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('M30 - dating edit resyncs the Pregnancy notifications', () => {
  it('valid new dating: saved, then the objective-gated resync runs (after the save)', async () => {
    const renderer = await renderEditScreen();
    const newDate = startOfDay(addDays(new Date(), -100));
    await pickDate(renderer, newDate);
    await save(renderer);

    expect(new Date(getPregnancyDating().date!).toDateString()).toBe(newDate.toDateString());
    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  it('invalid dating (future last period): nothing saved, no resync', async () => {
    const renderer = await renderEditScreen();
    const before = getPregnancyDating();
    await pickDate(renderer, addDays(startOfDay(new Date()), 2));
    await save(renderer);

    expect(getPregnancyDating()).toEqual(before);
    expect(mockSync).not.toHaveBeenCalled();
  });
});
