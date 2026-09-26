import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Pressable, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import JournalTemperatureScreen from '../JournalTemperatureScreen';
import JournalLHTestScreen from '../JournalLHTestScreen';
import JournalCervicalMucusScreen from '../JournalCervicalMucusScreen';
import {getJournalEntry, saveJournalSection} from '../../../state/dailyJournalStore';

// M21 (past-day entry via the optional `date` route param) and M25 (a saved
// Conceive observation can be cleared) for the three general fertility
// trackers. 'Rapports' (intimacy) is intentionally not covered: see
// ConceiveCalendarContent's DAY_ENTRY_ROUTES.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const NOW = new Date(2026, 8, 25, 15, 0, 0);
const TODAY = '2026-09-25';
const PAST = '2026-09-10';
const FUTURE = '2026-09-30';
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

type Case = {
  name: string;
  Screen: React.ComponentType;
  section: 'temperature' | 'lhTest' | 'cervicalMucus';
  value: never;
};

const CASES: Case[] = [
  {name: 'Température basale', Screen: JournalTemperatureScreen, section: 'temperature', value: {value: 36.6, unit: 'C', time: '07:00', method: 'Orale', note: ''} as never},
  {name: 'Test LH', Screen: JournalLHTestScreen, section: 'lhTest', value: {result: 'positive', time: '08:00', note: ''} as never},
  {name: 'Glaire cervicale', Screen: JournalCervicalMucusScreen, section: 'cervicalMucus', value: {type: 'eggWhite', note: ''} as never},
];

async function flush() {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

async function renderScreen(Screen: React.ComponentType, date?: string) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen initialParams={date ? {date} : undefined} name="Test">
                {() => <Screen />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await flush();
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf);
const pressableByLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAllByType(Pressable).find(node => node.props.accessibilityLabel === label);

async function press(renderer: ReactTestRenderer.ReactTestRenderer, label: string) {
  const button = pressableByLabel(renderer, label);
  expect(button).toBeDefined();
  await act(async () => {
    await button!.props.onPress();
  });
  await flush();
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.useFakeTimers({advanceTimers: true, now: NOW});
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe.each(CASES)('$name - M21 selected past day', ({Screen, section, value}) => {
  it('without a date param it stays a today journal (header + today entry)', async () => {
    await saveJournalSection(TODAY, section, value);
    const renderer = await renderScreen(Screen);
    expect(allTexts(renderer).some(text => text.startsWith('Aujourd’hui'))).toBe(true);
    // Saved value exists for today -> the clear action is offered.
    expect(pressableByLabel(renderer, 'Effacer cette saisie')).toBeDefined();
  });

  it("hydrates THAT day's entry, labels the day, and Save updates only that day", async () => {
    await saveJournalSection(PAST, section, value);
    const renderer = await renderScreen(Screen, PAST);

    const texts = allTexts(renderer);
    expect(texts.some(text => text.startsWith('Aujourd’hui'))).toBe(false);
    expect(texts.some(text => /10 septembre/i.test(text))).toBe(true);
    // The saved value only exists on the past day, so the clear action being
    // offered proves that day's entry was the one hydrated.
    expect(pressableByLabel(renderer, 'Effacer cette saisie')).toBeDefined();

    await press(renderer, 'Enregistrer');
    expect((await getJournalEntry(PAST))?.[section]).toBeDefined();
    expect(await getJournalEntry(TODAY)).toBeUndefined();
  });

  it('a past day with no entry saves a new entry for that day only', async () => {
    const renderer = await renderScreen(Screen, PAST);
    expect(pressableByLabel(renderer, 'Effacer cette saisie')).toBeUndefined();
    if (section === 'temperature') {
      // Temperature requires a real value; the other two have a default.
      const inputs = renderer.root.findAll(node => node.props.keyboardType === 'decimal-pad' || node.props.keyboardType === 'numeric');
      const input = inputs.find(node => typeof node.props.onChangeText === 'function');
      expect(input).toBeDefined();
      await act(async () => {
        input!.props.onChangeText('36,4');
      });
    }
    await press(renderer, 'Enregistrer');
    expect((await getJournalEntry(PAST))?.[section]).toBeDefined();
    expect(await getJournalEntry(TODAY)).toBeUndefined();
  });

  it('a future date is rejected with a message and nothing is written', async () => {
    const renderer = await renderScreen(Screen, FUTURE);
    await press(renderer, 'Enregistrer');
    expect(allTexts(renderer)).toContain('Tu ne peux pas enregistrer un suivi pour une date à venir.');
    expect(await getJournalEntry(FUTURE)).toBeUndefined();
    expect(await getJournalEntry(TODAY)).toBeUndefined();
  });
});

describe.each(CASES)('$name - M25 clear a saved value', ({Screen, section, value}) => {
  it('save -> reopen (value shown) -> clear -> reopen (cleared), other sections untouched', async () => {
    await saveJournalSection(PAST, section, value);
    await saveJournalSection(PAST, 'symptoms', {names: ['Crampes']});

    // reopen: saved value present, clear offered.
    const first = await renderScreen(Screen, PAST);
    expect(pressableByLabel(first, 'Effacer cette saisie')).toBeDefined();

    // clear: confirmation dialog, then the section is removed.
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const destructive = buttons?.find(button => button.style === 'destructive');
      destructive?.onPress?.();
    });
    await press(first, 'Effacer cette saisie');
    expect(alertSpy).toHaveBeenCalledTimes(1);
    await flush();

    const entry = await getJournalEntry(PAST);
    expect(entry?.[section]).toBeUndefined();
    expect(entry?.symptoms?.names).toEqual(['Crampes']);
    // The mounted screen already reflects the cleared state.
    expect(pressableByLabel(first, 'Effacer cette saisie')).toBeUndefined();

    // reopen: cleared state, no clear action.
    act(() => {
      activeRenderers.splice(0).forEach(renderer => renderer.unmount());
    });
    const second = await renderScreen(Screen, PAST);
    expect(pressableByLabel(second, 'Effacer cette saisie')).toBeUndefined();
  });

  it('cancelling the confirmation keeps the saved value', async () => {
    await saveJournalSection(PAST, section, value);
    const renderer = await renderScreen(Screen, PAST);
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await press(renderer, 'Effacer cette saisie');
    expect((await getJournalEntry(PAST))?.[section]).toBeDefined();
  });
});
