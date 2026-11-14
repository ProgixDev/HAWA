import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import JournalMoodScreen from '../JournalMoodScreen';
import {getAllJournalEntries, getJournalEntry, saveJournalSection} from '../../../state/dailyJournalStore';
import {setActiveObjective} from '../../../state/onboardingPreferences';
import {setAppLanguage} from '../../../state/themePreferences';
import {resetSaveFailureForTests} from '../../../services/saveFailure';
import {addDays, dateFormatLocale} from '../../../utils/cycleMath';
import i18n from '../../../i18n';

// PHASE 4 — mood journal (JournalMoodScreen). The real screen over the real daily-journal store (note encryption included); only a refused write
// is simulated. Already covered elsewhere and not repeated: the nine moods and their labels (MoodScreenEmojiCards), save → reopen → unchanged
// save, the defaults of an untouched day, the Pregnancy prefill (SharedCycleJournals), clearing an entry (CycleJournalsClearEntry), a write
// refused because the record is protected (RefusedWriteFeedback), the daughter's presentation and title (DaughterJournalPresentation, DaughterMoodTitle).
// Dates are deterministic: only `Date` is faked — "today" is Thu 15 Oct 2026, 15:00 local.

const NOW = new Date(2026, 9, 15, 15, 0, 0);
const dayKey = (date: Date) => date.toLocaleDateString('en-CA');
const TODAY = dayKey(NOW);
const YESTERDAY = dayKey(addDays(NOW, -1));
const DAILY_KEY = '@hawa/daily-journal/v1';

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const renderers: ReactTestRenderer.ReactTestRenderer[] = [];
const realSetItem = (AsyncStorage.setItem as jest.Mock).getMockImplementation();

const settle = async () => {
  for (let index = 0; index < 30; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

// Base → Middle → Journal: a `goBack()` is visible as the route the person lands on (two of them would reach Base).
async function mountMood() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator initialRouteName="Base" screenOptions={{headerShown: false}}>
                <Stack.Screen name="Base">{() => <Text>base</Text>}</Stack.Screen>
                <Stack.Screen name="Middle">{() => <Text>middle</Text>}</Stack.Screen>
                <Stack.Screen name="Journal">{() => <JournalMoodScreen />}</Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  renderers.push(renderer);
  await settle();
  await act(async () => {
    (navRef as unknown as {navigate: (name: string) => void}).navigate('Middle');
  });
  await act(async () => {
    (navRef as unknown as {navigate: (name: string) => void}).navigate('Journal');
  });
  await settle();
  return renderer;
}
const route = () => (navRef.getCurrentRoute() as {name: string} | undefined)?.name;

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] => renderer.root.findAllByType(Text).map(textOf);
const pressables = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAll(node => typeof node.props.onPress === 'function');
const byLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const match = pressables(renderer).find(node => node.props.accessibilityLabel === label);
  if (!match) {throw new Error(`No pressable labelled "${label}"`);}
  return match;
};
const mood = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const match = pressables(renderer).find(node => node.props.accessibilityRole === 'radio' && node.findAllByType(Text).some(child => textOf(child) === label));
  if (!match) {throw new Error(`No mood "${label}"`);}
  return match;
};
const press = async (node: ReactTestRenderer.ReactTestInstance) => {
  await act(async () => {
    await node.props.onPress();
  });
  await settle();
};
const isOn = (node: ReactTestRenderer.ReactTestInstance): boolean => node.props.accessibilityState?.checked === true || node.props.accessibilityState?.selected === true;
const note = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findByType(TextInput);
const typeNote = async (renderer: ReactTestRenderer.ReactTestRenderer, value: string) => {
  await act(async () => {
    note(renderer).props.onChangeText(value);
  });
};
const scales = (renderer: ReactTestRenderer.ReactTestRenderer): number[] =>
  renderer.root.findAll(node => typeof node.type === 'string' && node.props.accessibilityRole === 'adjustable').map(node => node.props.accessibilityValue.now as number);

const SAVE = () => i18n.t('journalMood.saveMood');
const spoken = (date: Date) => new Intl.DateTimeFormat(dateFormatLocale(), {weekday: 'long', day: 'numeric', month: 'long'}).format(date);
const level = (label: string, value: number) => i18n.t('journalMood.levelOutOfFive', {label, level: value});
const LEVEL_LABELS = () => [i18n.t('cycleHome.energyChipLabel'), i18n.t('journalMood.stressLabel'), i18n.t('journalMood.irritabilityLabel'), i18n.t('journalMood.motivationLabel')];
const failWrites = () =>
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
    if (key.startsWith(DAILY_KEY)) {throw new Error('disk full');}
    return realSetItem?.(key, value);
  });
const restoreWrites = () => (AsyncStorage.setItem as jest.Mock).mockImplementation(realSetItem);
const SEED_MOOD = {level: 'sad' as const, energy: 2, stress: 5, irritability: 1, motivation: 1, note: 'Journée difficile'};

let alertSpy: jest.SpyInstance;

beforeEach(async () => {
  jest.useFakeTimers({advanceTimers: true, now: NOW});
  restoreWrites();
  resetSaveFailureForTests();
  await AsyncStorage.clear();
  await setActiveObjective('cycle');
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});

afterEach(() => {
  restoreWrites();
  alertSpy.mockRestore();
  act(() => {
    renderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('an untouched day is never saved (the displayed values are only proposals)', () => {
  const saveControls = (renderer: ReactTestRenderer.ReactTestRenderer) => pressables(renderer).filter(node => node.props.accessibilityLabel === SAVE());

  it('opening the screen writes nothing; both save controls are disabled; pressing them writes nothing and stays', async () => {
    const renderer = await mountMood();
    expect(await AsyncStorage.getItem(DAILY_KEY)).toBeNull();
    expect(isOn(mood(renderer, 'Très bien'))).toBe(true); // still proposed on screen
    expect(scales(renderer)).toEqual([4, 3, 2, 4]);
    const controls = saveControls(renderer);
    expect(controls.length).toBeGreaterThanOrEqual(2); // the tick in the header and the button at the bottom (and their inner pressables)
    expect(controls.every(control => control.props.disabled === true)).toBe(true);
    const spy = jest.spyOn(AsyncStorage, 'setItem');
    spy.mockClear();
    for (const control of controls) {
      await press(control);
    }
    expect(spy.mock.calls.filter(call => String(call[0]).startsWith(DAILY_KEY))).toHaveLength(0);
    expect(await getJournalEntry(TODAY)).toBeUndefined();
    expect(route()).toBe('Journal');
    spy.mockRestore();
  });

  it.each([
    ['choosing a mood', async (r: ReactTestRenderer.ReactTestRenderer) => press(mood(r, 'Triste'))],
    ['pressing the proposed mood on purpose', async (r: ReactTestRenderer.ReactTestRenderer) => press(mood(r, 'Très bien'))],
    ['moving the energy', async (r: ReactTestRenderer.ReactTestRenderer) => press(byLabel(r, level(LEVEL_LABELS()[0], 2)))],
    ['moving the stress', async (r: ReactTestRenderer.ReactTestRenderer) => press(byLabel(r, level(LEVEL_LABELS()[1], 1)))],
    ['moving the irritability', async (r: ReactTestRenderer.ReactTestRenderer) => press(byLabel(r, level(LEVEL_LABELS()[2], 4)))],
    ['moving the motivation', async (r: ReactTestRenderer.ReactTestRenderer) => press(byLabel(r, level(LEVEL_LABELS()[3], 5)))],
    ['typing a comment', async (r: ReactTestRenderer.ReactTestRenderer) => typeNote(r, 'x')],
  ])('%s enables saving, and the save then writes the entry', async (_name, interact) => {
    const renderer = await mountMood();
    await interact(renderer);
    expect(saveControls(renderer).every(control => control.props.disabled === false)).toBe(true);
    await press(byLabel(renderer, SAVE()));
    expect((await getJournalEntry(TODAY))?.mood).toBeDefined();
    expect(route()).toBe('Middle');
  });

  it('only what she chose differs from the proposal; the rest of the entry is the proposed values (saved because she acted)', async () => {
    const renderer = await mountMood();
    await press(byLabel(renderer, level(LEVEL_LABELS()[1], 5)));
    await press(byLabel(renderer, SAVE()));
    expect((await getJournalEntry(TODAY))?.mood).toEqual({level: 'veryGood', energy: 4, stress: 5, irritability: 2, motivation: 4});
  });

  it('changing day starts untouched again: saving is disabled until she acts on that day', async () => {
    const renderer = await mountMood();
    await press(mood(renderer, 'Triste'));
    expect(saveControls(renderer).every(control => control.props.disabled === false)).toBe(true);
    await press(byLabel(renderer, spoken(addDays(NOW, -1))));
    expect(saveControls(renderer).every(control => control.props.disabled === true)).toBe(true);
    await press(byLabel(renderer, SAVE()));
    expect(await getJournalEntry(YESTERDAY)).toBeUndefined();
    expect(await getJournalEntry(TODAY)).toBeUndefined();
  });

  it('a day that already has a saved mood can be saved again as it is', async () => {
    await saveJournalSection(TODAY, 'mood', SEED_MOOD);
    const renderer = await mountMood();
    expect(saveControls(renderer).every(control => control.props.disabled === false)).toBe(true);
    await press(byLabel(renderer, SAVE()));
    expect((await getJournalEntry(TODAY))?.mood).toEqual(SEED_MOOD);
  });
});

describe('changing an existing mood', () => {
  it('replaces the saved mood (one entry for the day, same id) and leaves every other section of the day untouched', async () => {
    await saveJournalSection(TODAY, 'mood', SEED_MOOD);
    await saveJournalSection(TODAY, 'symptoms', {names: ['Crampes'], severity: 'mild', painLocation: 'Dos', note: 'garde-moi'});
    await saveJournalSection(TODAY, 'sleep', {hours: 7, quality: 'good', feeling: 'rested', note: ''} as never);
    const before = await getJournalEntry(TODAY);

    const renderer = await mountMood();
    expect(isOn(mood(renderer, 'Triste'))).toBe(true);
    await press(mood(renderer, 'Anxieuse'));
    expect(isOn(mood(renderer, 'Anxieuse'))).toBe(true);
    expect(isOn(mood(renderer, 'Triste'))).toBe(false);
    await press(byLabel(renderer, level(LEVEL_LABELS()[0], 5)));
    await press(byLabel(renderer, SAVE()));

    const after = await getJournalEntry(TODAY);
    expect(after?.mood).toEqual({...SEED_MOOD, level: 'anxious', energy: 5});
    expect(after?.symptoms).toEqual(before?.symptoms);
    expect(after?.sleep).toEqual(before?.sleep);
    expect(after?.id).toBe(before?.id);
    expect((await getAllJournalEntries()).filter(entry => entry.date === TODAY)).toHaveLength(1);
    expect(route()).toBe('Middle');
  });

  it.each([
    ['the lowest value of every scale', [1, 1, 1, 1]],
    ['the highest value of every scale', [5, 5, 5, 5]],
    ['a different value on each scale', [2, 4, 1, 5]],
  ])('%s is saved for the right scale', async (_name, values) => {
    const renderer = await mountMood();
    for (const [index, label] of LEVEL_LABELS().entries()) {
      await press(byLabel(renderer, level(label, values[index])));
    }
    expect(scales(renderer)).toEqual(values);
    await press(byLabel(renderer, SAVE()));
    const saved = (await getJournalEntry(TODAY))?.mood;
    expect([saved?.energy, saved?.stress, saved?.irritability, saved?.motivation]).toEqual(values);
  });
});

describe('the comment', () => {
  it('is limited to 300 characters, counted on screen, and saved trimmed', async () => {
    const renderer = await mountMood();
    expect(note(renderer).props.maxLength).toBe(300);
    expect(textsOf(renderer)).toContain('0 / 300');
    await typeNote(renderer, '   Journée calme   ');
    expect(textsOf(renderer)).toContain('19 / 300');
    await press(byLabel(renderer, SAVE()));
    expect((await getJournalEntry(TODAY))?.mood?.note).toBe('Journée calme');
  });

  it('a comment of spaces only is saved as empty (and no encrypted blob is written for it)', async () => {
    const renderer = await mountMood();
    await typeNote(renderer, '      ');
    await press(byLabel(renderer, SAVE()));
    expect((await getJournalEntry(TODAY))?.mood?.note ?? '').toBe('');
    const raw = JSON.parse((await AsyncStorage.getItem(DAILY_KEY)) as string) as Array<{mood: Record<string, unknown>}>;
    expect(raw[0].mood.note).toBeUndefined();
  });

  it('a 300-character comment is kept whole and comes back intact after a restart of the store', async () => {
    const long = 'é'.repeat(300);
    const renderer = await mountMood();
    await typeNote(renderer, long);
    await press(byLabel(renderer, SAVE()));
    expect(JSON.stringify(await AsyncStorage.getItem(DAILY_KEY))).not.toContain('éééééééééé'); // sealed at rest

    const keychain = require('react-native-keychain');
    let reloaded: {mood?: {note?: string}} | undefined;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('react-native-keychain', () => keychain);
      jest.doMock('@react-native-async-storage/async-storage', () => AsyncStorage);
      const fresh = require('../../../state/dailyJournalStore');
      reloaded = await fresh.getJournalEntry(TODAY);
    });
    expect(reloaded?.mood?.note).toBe(long);
  });
});

describe('another day (the arrows next to the date)', () => {
  it('yesterday opens on its own saved mood, saving there changes yesterday only, and today is shown again afterwards', async () => {
    await saveJournalSection(TODAY, 'mood', {...SEED_MOOD, level: 'good', note: 'aujourd’hui'});
    await saveJournalSection(YESTERDAY, 'mood', {...SEED_MOOD, level: 'tired', note: 'hier'});
    const renderer = await mountMood();
    expect(isOn(mood(renderer, 'Bien'))).toBe(true);

    await press(byLabel(renderer, spoken(addDays(NOW, -1))));
    expect(isOn(mood(renderer, 'Fatiguée'))).toBe(true);
    expect(note(renderer).props.value).toBe('hier');
    await press(mood(renderer, 'Motivée'));
    await press(byLabel(renderer, SAVE()));
    expect((await getJournalEntry(YESTERDAY))?.mood?.level).toBe('motivated');
    expect((await getJournalEntry(TODAY))?.mood).toMatchObject({level: 'good', note: 'aujourd’hui'});
  });

  it('a day with nothing saved opens on the defaults, never on the previous day\'s values', async () => {
    await saveJournalSection(TODAY, 'mood', SEED_MOOD);
    const renderer = await mountMood();
    expect(isOn(mood(renderer, 'Triste'))).toBe(true);
    await press(byLabel(renderer, spoken(addDays(NOW, -1))));
    expect(isOn(mood(renderer, 'Très bien'))).toBe(true);
    expect(scales(renderer)).toEqual([4, 3, 2, 4]);
    expect(note(renderer).props.value).toBe('');
  });

  it('a past day with nothing saved gets a new entry for that day only', async () => {
    const renderer = await mountMood();
    await press(byLabel(renderer, spoken(addDays(NOW, -1))));
    await press(mood(renderer, 'Stressée'));
    await press(byLabel(renderer, SAVE()));
    expect((await getJournalEntry(YESTERDAY))?.mood?.level).toBe('stressed');
    expect(await getJournalEntry(TODAY)).toBeUndefined();
  });

  it('there is no way forward from today, and no way back beyond 30 days', async () => {
    const renderer = await mountMood();
    expect(byLabel(renderer, spoken(addDays(NOW, 1))).props.disabled).toBe(true);
    for (let step = 0; step < 30; step += 1) {
      await press(byLabel(renderer, spoken(addDays(NOW, -(step + 1)))));
    }
    expect(byLabel(renderer, spoken(addDays(NOW, -31))).props.disabled).toBe(true);
    await press(byLabel(renderer, spoken(addDays(NOW, -31))));
    await press(mood(renderer, 'Triste'));
    await press(byLabel(renderer, SAVE()));
    expect(await getJournalEntry(dayKey(addDays(NOW, -30)))).toBeDefined();
    expect(await getJournalEntry(dayKey(addDays(NOW, -31)))).toBeUndefined();
  });
});

describe('a failed write', () => {
  it('shows the mood alert once, stays on the screen with everything that was chosen, writes nothing, and a retry saves', async () => {
    const renderer = await mountMood();
    await press(mood(renderer, 'Irritable'));
    await typeNote(renderer, 'à garder');
    failWrites();
    await press(byLabel(renderer, SAVE()));
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toBe(i18n.t('journalMood.errorTitle'));
    expect(route()).toBe('Journal');
    expect(isOn(mood(renderer, 'Irritable'))).toBe(true);
    expect(note(renderer).props.value).toBe('à garder');
    expect(await getJournalEntry(TODAY)).toBeUndefined();

    restoreWrites();
    await press(byLabel(renderer, SAVE()));
    expect((await getJournalEntry(TODAY))?.mood).toMatchObject({level: 'irritable', note: 'à garder'});
    expect(route()).toBe('Middle');
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });

  it('a second tap 30 ms after the first, while the 80 ms write is still running, saves once and leaves the screen once', async () => {
    const renderer = await mountMood();
    await press(mood(renderer, 'Triste'));
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
      await new Promise<void>(resolve => setTimeout(resolve, 80));
      return realSetItem?.(key, value);
    });
    const spy = jest.spyOn(AsyncStorage, 'setItem');
    spy.mockClear();
    await act(async () => {
      byLabel(renderer, SAVE()).props.onPress();
      await new Promise<void>(resolve => setTimeout(resolve, 30));
    });
    await act(async () => {
      byLabel(renderer, SAVE()).props.onPress();
      await new Promise<void>(resolve => setTimeout(resolve, 600));
    });
    await settle();
    expect(spy.mock.calls.filter(call => String(call[0]).startsWith(DAILY_KEY))).toHaveLength(1);
    expect(route()).toBe('Middle'); // one goBack() only: two would have reached the screen below
    spy.mockRestore();
  });

  it('two presses in the very same tick (before any re-render) write once and leave the screen once', async () => {
    const renderer = await mountMood();
    await press(mood(renderer, 'Triste'));
    const spy = jest.spyOn(AsyncStorage, 'setItem');
    spy.mockClear();
    const target = byLabel(renderer, SAVE());
    await act(async () => {
      await Promise.all([target.props.onPress(), target.props.onPress()]);
    });
    await settle();
    expect(spy.mock.calls.filter(call => String(call[0]).startsWith(DAILY_KEY))).toHaveLength(1);
    expect(route()).toBe('Middle');
    spy.mockRestore();
  });

  it('after a failed save the guard is released: the retry (two presses at once again) saves once', async () => {
    const renderer = await mountMood();
    await press(mood(renderer, 'Irritable'));
    failWrites();
    await press(byLabel(renderer, SAVE()));
    expect(route()).toBe('Journal');
    restoreWrites();
    const spy = jest.spyOn(AsyncStorage, 'setItem');
    spy.mockClear();
    const target = byLabel(renderer, SAVE());
    await act(async () => {
      await Promise.all([target.props.onPress(), target.props.onPress()]);
    });
    await settle();
    expect(spy.mock.calls.filter(call => String(call[0]).startsWith(DAILY_KEY))).toHaveLength(1);
    expect((await getJournalEntry(TODAY))?.mood?.level).toBe('irritable');
    expect(route()).toBe('Middle');
    spy.mockRestore();
  });

  it('a failed change of an existing mood leaves the stored mood as it was', async () => {
    await saveJournalSection(TODAY, 'mood', SEED_MOOD);
    const renderer = await mountMood();
    await press(mood(renderer, 'Motivée'));
    failWrites();
    await press(byLabel(renderer, SAVE()));
    expect(alertSpy).toHaveBeenCalledTimes(1);
    restoreWrites();
    expect((await getJournalEntry(TODAY))?.mood).toEqual(SEED_MOOD);
  });
});
