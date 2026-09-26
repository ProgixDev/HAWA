import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import PostpartumDeliveryDateScreen from '../PostpartumDeliveryDateScreen';
import {
  confirmDelivery,
  getPostpartumPreferences,
  recordFirstPostpartumPeriod,
  setDeliveryType,
  setPostpartumPreferences,
} from '../../state/postpartumPreferences';
import {markPostpartumLochiaEnded, reopenPostpartumLochiaTracking, getPostpartumLochiaTracking} from '../../state/postpartumLochiaStore';

// M32/M34 - editing the delivery date is constrained by the CURRENT journey's
// first period / lochia end only; values left over from an EARLIER journey
// (dated before the current delivery) never reject a valid date, and are kept.
// Today is pinned to 2026-09-26.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const d = (year: number, month: number, day: number) => new Date(year, month - 1, day, 12);

const EMPTY = {
  deliveryDate: null,
  startedAt: null,
  deliveryType: null,
  feedingType: null,
  firstPostpartumPeriodDate: null,
  dailyTrackingReminderEnabled: false,
  dailyTrackingReminderTime: null,
};

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};
const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const visited: string[] = [];

async function renderScreen(mode: 'edit' | undefined) {
  visited.length = 0;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Home">{() => <Text>home</Text>}</Stack.Screen>
              <Stack.Screen initialParams={mode ? {mode} : undefined} name="PostpartumDeliveryDate" component={PostpartumDeliveryDateScreen as React.ComponentType} />
              <Stack.Screen name="PostpartumDeliveryType">
                {() => {
                  visited.push('PostpartumDeliveryType');
                  return <Text>type</Text>;
                }}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await act(async () => {
    (navRef as unknown as {navigate: (name: string, params?: unknown) => void}).navigate('PostpartumDeliveryDate', mode ? {mode} : undefined);
  });
  await settle();
  return renderer;
}

/** Presses the calendar cell of the given day of the visible month. */
const pickDay = async (renderer: ReactTestRenderer.ReactTestRenderer, day: number) => {
  const cell = renderer.root.findAll(
    node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(t => textOf(t) === String(day)),
  )[0];
  await act(async () => {
    cell.props.onPress();
  });
};
const pressSave = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const button = renderer.root.find(
    node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(t => textOf(t) === label),
  );
  await act(async () => {
    await button.props.onPress();
  });
  await settle();
};
const alerts = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => node.props.accessibilityRole === 'alert').map(textOf);
const currentRouteName = () => (navRef.getCurrentRoute() as {name: string} | undefined)?.name;

beforeEach(async () => {
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 26, 15, 0, 0)});
  await setPostpartumPreferences({...EMPTY});
  await reopenPostpartumLochiaTracking();
});
afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

/** An EARLIER journey (delivery Jan 10, first period Feb 20, lochia end Feb 5), then the current one (delivery Sept 10). */
const seedNewJourneyAfterOld = async () => {
  await confirmDelivery(d(2026, 1, 10));
  await setDeliveryType('vaginal');
  await recordFirstPostpartumPeriod(d(2026, 2, 20));
  await markPostpartumLochiaEnded('2026-02-05');
  await confirmDelivery(d(2026, 9, 10), {startsNewJourney: true});
};

describe('PostpartumDeliveryDate (edit) - previous journey values do not constrain', () => {
  it('1+2+3. a valid new delivery is accepted although a stale first period (Feb 20) and lochia end (Feb 5) exist', async () => {
    await seedNewJourneyAfterOld();
    const renderer = await renderScreen('edit');
    await pickDay(renderer, 12); // Sept 12, valid for the current journey
    await pressSave(renderer, 'Enregistrer');

    expect(alerts(renderer)).toEqual([]);
    expect(getPostpartumPreferences().deliveryDate).toBe('2026-09-12');
    expect(currentRouteName()).toBe('Home'); // went back
  });

  it('8. the earlier values are still stored after the edit', async () => {
    await seedNewJourneyAfterOld();
    const renderer = await renderScreen('edit');
    await pickDay(renderer, 12);
    await pressSave(renderer, 'Enregistrer');

    expect(getPostpartumLochiaTracking().endedDate).toBe('2026-02-05');
    // Stored, though not reported as this journey's.
    const raw = JSON.parse((await AsyncStorage.getItem('@hawa/postpartum-preferences/v1')) as string);
    expect(raw.firstPostpartumPeriodDate).toBe('2026-02-20');
    expect(raw.deliveryType).toBe('vaginal');
  });
});

describe('PostpartumDeliveryDate (edit) - the current journey keeps its chronological checks', () => {
  it('4. a first period of THIS journey (Sept 15) rejects a delivery date after it (Sept 18)', async () => {
    await seedNewJourneyAfterOld();
    await recordFirstPostpartumPeriod(d(2026, 9, 15));
    const renderer = await renderScreen('edit');
    await pickDay(renderer, 18);
    await pressSave(renderer, 'Enregistrer');

    expect(alerts(renderer).join(' ')).toMatch(/reprise des règles/);
    expect(getPostpartumPreferences().deliveryDate).toBe('2026-09-10');
  });

  it('5. a lochia end of THIS journey (Sept 14) rejects a delivery date after it (Sept 16)', async () => {
    await seedNewJourneyAfterOld();
    await markPostpartumLochiaEnded('2026-09-14');
    const renderer = await renderScreen('edit');
    await pickDay(renderer, 16);
    await pressSave(renderer, 'Enregistrer');

    expect(alerts(renderer).join(' ')).toMatch(/fin des lochies/);
    expect(getPostpartumPreferences().deliveryDate).toBe('2026-09-10');
  });

  it('a delivery date on/before the current first period is still accepted', async () => {
    await seedNewJourneyAfterOld();
    await recordFirstPostpartumPeriod(d(2026, 9, 15));
    const renderer = await renderScreen('edit');
    await pickDay(renderer, 8);
    await pressSave(renderer, 'Enregistrer');
    expect(getPostpartumPreferences().deliveryDate).toBe('2026-09-08');
  });
});

describe('PostpartumDeliveryDate - no previous history / onboarding', () => {
  it('6. first onboarding: a valid date is saved and the flow continues to the delivery type', async () => {
    const renderer = await renderScreen(undefined);
    await pressSave(renderer, 'Suivant');
    expect(alerts(renderer)).toEqual([]);
    expect(getPostpartumPreferences().deliveryDate).toBe('2026-09-26');
    expect(currentRouteName()).toBe('PostpartumDeliveryType');
  });

  it('onboarding with leftover values from an earlier journey and no current delivery is not blocked by them', async () => {
    // Earlier journey values exist while no delivery is stored.
    await setPostpartumPreferences({...EMPTY, firstPostpartumPeriodDate: '2026-02-20'});
    await markPostpartumLochiaEnded('2026-02-05');
    const renderer = await renderScreen(undefined);
    await pressSave(renderer, 'Suivant');
    expect(alerts(renderer)).toEqual([]);
    expect(getPostpartumPreferences().deliveryDate).toBe('2026-09-26');
  });
});
