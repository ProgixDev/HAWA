import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {AppState, Text, type AppStateStatus} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {usePrayerPurityStatus} from '../usePrayerPurityStatus';
import {fetchPrayerSchedule} from '../../services/prayerTimes';
import {setSelectedLocation} from '../../state/onboardingPreferences';

// The prayer schedule is for ONE calendar day. It used to be fetched once
// (for the day the screen mounted) and never again, so an app left open
// across midnight kept yesterday's windows.
jest.mock('../../services/prayerTimes', () => ({
  ...jest.requireActual('../../services/prayerTimes'),
  fetchPrayerSchedule: jest.fn(async () => undefined),
}));

const mockFetchPrayerSchedule = fetchPrayerSchedule as jest.Mock;
const Stack = createNativeStackNavigator();

let appStateListener: ((state: AppStateStatus) => void) | undefined;
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

function Probe(): React.JSX.Element {
  const status = usePrayerPurityStatus(true);
  return <Text>{status.selectedLocation?.city ?? 'no-location'}</Text>;
}

async function renderProbe() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name="Test">{() => <Probe />}</Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const flush = async () => {
  for (let index = 0; index < 10; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

beforeEach(async () => {
  jest.useFakeTimers();
  mockFetchPrayerSchedule.mockClear();
  appStateListener = undefined;
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((_type: string, listener: (state: AppStateStatus) => void) => {
    appStateListener = listener;
    return {remove: jest.fn()};
  }) as never);
  await setSelectedLocation({city: 'Alger', country: 'Algérie', timezone: 'Africa/Algiers', latitude: 36.75, longitude: 3.06});
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('prayer schedule follows the current day', () => {
  it('fetches the schedule on mount', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 12, 0, 0));
    await renderProbe();
    await flush();
    // (The stored location hydrates after mount and re-triggers the load — that
    // existing behavior is unrelated to the current day, so only "at least
    // once" is asserted.)
    expect(mockFetchPrayerSchedule.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('MIDNIGHT: the schedule is fetched again for the new day', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 23, 59, 0));
    await renderProbe();
    await flush();
    const callsBefore = mockFetchPrayerSchedule.mock.calls.length;
    expect(callsBefore).toBeGreaterThanOrEqual(1);

    await act(async () => {
      jest.advanceTimersByTime(90_000);
    });
    await flush();

    expect(mockFetchPrayerSchedule.mock.calls.length).toBe(callsBefore + 1);
  });

  it('FOREGROUND: returning the next day refetches', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 21, 0, 0));
    await renderProbe();
    await flush();
    const callsBefore = mockFetchPrayerSchedule.mock.calls.length;

    jest.setSystemTime(new Date(2026, 8, 26, 8, 0, 0));
    await act(async () => {
      appStateListener?.('active');
    });
    await flush();

    expect(mockFetchPrayerSchedule.mock.calls.length).toBe(callsBefore + 1);
  });

  it('SAME DAY: returning to the foreground does NOT refetch', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 12, 0, 0));
    await renderProbe();
    await flush();
    const callsBefore = mockFetchPrayerSchedule.mock.calls.length;

    await act(async () => {
      appStateListener?.('active');
    });
    await flush();

    expect(mockFetchPrayerSchedule.mock.calls.length).toBe(callsBefore);
  });
});
