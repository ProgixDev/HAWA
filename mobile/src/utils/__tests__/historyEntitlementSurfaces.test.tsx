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
import CalendarScreen from '../../screens/CalendarScreen';
import ConceiveCalendarContent from '../../components/conceive/ConceiveCalendarContent';
import ContraceptionCalendarContent from '../../components/contraception/ContraceptionCalendarContent';
import IrregularCalendarContent from '../../components/irregular/IrregularCalendarContent';
import MenopauseCalendarContent from '../../components/menopause/MenopauseCalendarContent';
import MiscarriageCalendarContent from '../../components/miscarriage/MiscarriageCalendarContent';
import PostpartumCalendarContent from '../../components/postpartum/PostpartumCalendarContent';
import PregnancyCalendarContent from '../../components/pregnancy/PregnancyCalendarContent';

// M41 — the ACTUAL current history entitlement, surface by surface. The
// canonical rule is utils/historyAccess.ts: a Free user can browse the last
// 30 days (inclusive of today); going back further opens the Premium sheet
// instead of moving; Premium is unrestricted. Every objective calendar
// (Cycle, Conceive, Irregular/SOPK, Contraception, Menopause, Pregnancy,
// Postpartum, Loss) routes its "previous month" through
// isMonthWithinHistoryAccess. Clock pinned to 2026-09-25: the Free bound is
// 2026-08-27, so August (partly inside the window) is reachable and July is
// locked.

const Stack = createNativeStackNavigator();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const NOW = new Date(2026, 8, 25, 15, 0, 0);
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const SURFACES: {name: string; Component: React.ComponentType<never>}[] = [
  {name: 'Cycle (CalendarScreen)', Component: CalendarScreen as never},
  {name: 'Essayer de concevoir', Component: ConceiveCalendarContent},
  {name: 'SOPK / cycle irrégulier', Component: IrregularCalendarContent},
  {name: 'Contraception', Component: ContraceptionCalendarContent},
  {name: 'Ménopause', Component: MenopauseCalendarContent},
  {name: 'Perte / fausse couche', Component: MiscarriageCalendarContent},
  {name: 'Post-partum', Component: PostpartumCalendarContent},
  {name: 'Grossesse', Component: PregnancyCalendarContent},
];

async function flush() {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

async function renderCalendar(Component: React.ComponentType<never>) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen component={Component as never} name="Calendar" />
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

async function pressPreviousMonth(renderer: ReactTestRenderer.ReactTestRenderer) {
  const button = renderer.root
    .findAllByType(Pressable)
    .find(node => node.props.accessibilityLabel === 'Mois précédent');
  expect(button).toBeDefined();
  await act(async () => {
    button!.props.onPress();
  });
  await flush();
}

const monthTitles = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  textsOf(renderer)
    .map(text => text.trim().toLowerCase())
    .filter(text => /^(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre) \d{4}$/.test(text));

// The displayed month is the first month title on every surface (the Cycle
// screen additionally lists a "Historique des mois" strip further down).
const shownMonth = (renderer: ReactTestRenderer.ReactTestRenderer) => monthTitles(renderer)[0];

const premiumSheetOpen = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByProps({accessibilityLabel: 'Fermer AWA Premium'}).length > 0;

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

describe.each(SURFACES)('history entitlement — $name calendar', ({Component}) => {
  it('Free: the previous month inside the 30-day window (août 2026) is reachable, no paywall', async () => {
    const renderer = await renderCalendar(Component);
    expect(shownMonth(renderer)).toBe('septembre 2026');
    await pressPreviousMonth(renderer);
    expect(shownMonth(renderer)).toBe('août 2026');
    expect(premiumSheetOpen(renderer)).toBe(false);
  });

  it('Free: going back beyond the window (juillet 2026) opens the Premium sheet and stays on août', async () => {
    const renderer = await renderCalendar(Component);
    await pressPreviousMonth(renderer);
    await pressPreviousMonth(renderer);
    expect(premiumSheetOpen(renderer)).toBe(true);
    expect(shownMonth(renderer)).toBe('août 2026');
  });

  it('Premium: any past month is reachable, no paywall', async () => {
    act(() => {
      updatePremiumState({isPremium: true});
    });
    const renderer = await renderCalendar(Component);
    await pressPreviousMonth(renderer);
    await pressPreviousMonth(renderer);
    await pressPreviousMonth(renderer);
    expect(shownMonth(renderer)).toBe('juin 2026');
    expect(premiumSheetOpen(renderer)).toBe(false);
  });
});

describe('history entitlement — Cycle "Historique des mois" strip', () => {
  const chip = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
    renderer.root
      .findAllByType(Pressable)
      .find(node => node.findAllByType(Text).some(text => [text.props.children].flat(Infinity).join('').toLowerCase() === label));

  it('Free: a strip month outside the window opens the Premium sheet and does not navigate; one inside does navigate', async () => {
    const renderer = await renderCalendar(CalendarScreen as never);
    await act(async () => {
      chip(renderer, 'juillet 2026')!.props.onPress();
    });
    await flush();
    expect(premiumSheetOpen(renderer)).toBe(true);
    expect(shownMonth(renderer)).toBe('septembre 2026');
  });

  it('Free: the in-window strip month (août 2026) navigates without a paywall', async () => {
    const renderer = await renderCalendar(CalendarScreen as never);
    await act(async () => {
      chip(renderer, 'août 2026')!.props.onPress();
    });
    await flush();
    expect(premiumSheetOpen(renderer)).toBe(false);
    expect(shownMonth(renderer)).toBe('août 2026');
  });

  it('Premium: the same out-of-window strip month navigates', async () => {
    act(() => {
      updatePremiumState({isPremium: true});
    });
    const renderer = await renderCalendar(CalendarScreen as never);
    await act(async () => {
      chip(renderer, 'juillet 2026')!.props.onPress();
    });
    await flush();
    expect(premiumSheetOpen(renderer)).toBe(false);
    expect(shownMonth(renderer)).toBe('juillet 2026');
  });
});
