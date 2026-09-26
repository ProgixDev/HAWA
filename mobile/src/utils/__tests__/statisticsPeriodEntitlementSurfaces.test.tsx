import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Pressable, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../navigation/JournalSheetContext';
import {resetPremiumStateForTests, updatePremiumState} from '../../state/premiumStore';
import {isPeriodFree, STATISTICS_PERIODS} from '../cycleStatisticsMath';
import StatisticsScreen from '../../screens/StatisticsScreen';
import ConceiveStatisticsScreen from '../../screens/conceive/ConceiveStatisticsScreen';
import IrregularStatisticsScreen from '../../screens/irregular/IrregularStatisticsScreen';
import MenopauseStatisticsScreen from '../../screens/menopause/MenopauseStatisticsScreen';
import MiscarriageStatisticsScreen from '../../screens/miscarriage/MiscarriageStatisticsScreen';
import PostpartumStatisticsScreen from '../../screens/postpartum/PostpartumStatisticsScreen';
import PregnancyStatisticsScreen from '../../screens/pregnancy/PregnancyStatisticsScreen';
import ContraceptionStatisticsScreen from '../../screens/contraception/ContraceptionStatisticsScreen';
import {setContraceptionPreferences} from '../../state/contraceptionPreferences';

// M41 — the ACTUAL statistics-period entitlement, surface by surface: only
// "1 mois" is Free; "3 / 6 / 12 mois" are Premium (tapping a locked period
// opens the Premium sheet and does not switch). Matches the Premium sheet's
// "Analyse ton évolution sur 3, 6 et 12 mois" claim. Contraception's
// intake/event selector applies the same 1-month-Free rule through its own
// isIntakePeriodFree and is covered here for a pill and a ring user.

const Stack = createNativeStackNavigator();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const NOW = new Date(2026, 8, 25, 15, 0, 0);
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const SURFACES: {name: string; Component: React.ComponentType<never>; setup?: () => Promise<void>}[] = [
  {name: 'Cycle', Component: StatisticsScreen as never},
  {name: 'Essayer de concevoir', Component: ConceiveStatisticsScreen},
  {name: 'SOPK / cycle irrégulier', Component: IrregularStatisticsScreen},
  {name: 'Ménopause', Component: MenopauseStatisticsScreen},
  {name: 'Perte / fausse couche', Component: MiscarriageStatisticsScreen},
  {name: 'Post-partum', Component: PostpartumStatisticsScreen},
  {name: 'Grossesse', Component: PregnancyStatisticsScreen},
  // Contraception: the selector exists for a method chosen in onboarding —
  // pill (intake statistics) and ring (event statistics) both use it.
  {name: 'Contraception (pilule)', Component: ContraceptionStatisticsScreen, setup: () => setContraceptionPreferences({method: 'pill'})},
  {name: 'Contraception (anneau)', Component: ContraceptionStatisticsScreen, setup: () => setContraceptionPreferences({method: 'ring'})},
];

async function flush() {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

async function renderStatistics(Component: React.ComponentType<never>) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen component={Component as never} name="Statistics" />
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

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');

// Screens render the period chips with different accessibility props, so the
// chip is located by its visible label; "locked" is the lock icon (or the
// shared selector's "nécessite Premium" accessibility label).
const periodButton = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root
    .findAllByType(Pressable)
    .find(node => node.findAllByType(Text).some(text => textOf(text) === label));

const isLocked = (node: ReactTestRenderer.ReactTestInstance): boolean =>
  node.findAll(child => child.props.name === 'lock-outline').length > 0 ||
  /nécessite Premium/.test(String(node.props.accessibilityLabel ?? ''));

const premiumSheetOpen = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByProps({accessibilityLabel: 'Fermer AWA Premium'}).length > 0;

// Only some screens expose the selected state to accessibility; assert it
// where it exists.
const selectedState = (node: ReactTestRenderer.ReactTestInstance): boolean | undefined =>
  node.props.accessibilityState?.selected;

beforeEach(async () => {
  await AsyncStorage.clear();
  resetPremiumStateForTests();
  jest.useFakeTimers({advanceTimers: true, now: NOW});
});
afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('statistics period entitlement — shared rule', () => {
  it('only the 1-month period is Free', () => {
    expect(STATISTICS_PERIODS.filter(isPeriodFree)).toEqual(['1']);
  });
});

describe.each(SURFACES)('statistics period entitlement — $name', ({Component, setup}) => {
  beforeEach(async () => {
    await setup?.();
  });

  it('Free: 3 / 6 / 12 mois are shown locked and open the Premium sheet instead of switching', async () => {
    const renderer = await renderStatistics(Component);
    expect(periodButton(renderer, '1 mois')).toBeDefined();
    for (const label of ['3 mois', '6 mois', '12 mois']) {
      const button = periodButton(renderer, label);
      expect(button).toBeDefined();
      expect(isLocked(button!)).toBe(true);
    }
    await act(async () => {
      periodButton(renderer, '3 mois')!.props.onPress();
    });
    await flush();
    expect(premiumSheetOpen(renderer)).toBe(true);
    expect(periodButton(renderer, '1 mois')!.props.accessibilityState === undefined || selectedState(periodButton(renderer, '1 mois')!) === true).toBe(true);
    expect(selectedState(periodButton(renderer, '3 mois')!) ?? false).toBe(false);
  });

  it('Free: the 1-month period never triggers the paywall', async () => {
    const renderer = await renderStatistics(Component);
    await act(async () => {
      periodButton(renderer, '1 mois')!.props.onPress();
    });
    await flush();
    expect(premiumSheetOpen(renderer)).toBe(false);
  });

  it('Premium: 3 / 6 / 12 mois are unlocked and switch without a paywall', async () => {
    act(() => {
      updatePremiumState({isPremium: true});
    });
    const renderer = await renderStatistics(Component);
    for (const label of ['3 mois', '6 mois', '12 mois']) {
      expect(isLocked(periodButton(renderer, label)!)).toBe(false);
    }
    await act(async () => {
      periodButton(renderer, '12 mois')!.props.onPress();
    });
    await flush();
    expect(premiumSheetOpen(renderer)).toBe(false);
    expect(periodButton(renderer, '12 mois')!.props.accessibilityState === undefined || selectedState(periodButton(renderer, '12 mois')!) === true).toBe(true);
  });
});
