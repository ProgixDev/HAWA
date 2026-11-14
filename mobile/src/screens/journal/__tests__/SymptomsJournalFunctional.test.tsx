import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import JournalSymptomsScreen from '../JournalSymptomsScreen';
import {getAllJournalEntries, getJournalEntry, saveJournalSection} from '../../../state/dailyJournalStore';
import {setActiveObjective} from '../../../state/onboardingPreferences';
import {setAppLanguage} from '../../../state/themePreferences';
import {resetSaveFailureForTests} from '../../../services/saveFailure';
import i18n from '../../../i18n';

// PHASE 4 — symptoms journal (JournalSymptomsScreen). The real screen over the real daily-journal store (note encryption included); only a
// refused write is simulated. Already covered elsewhere and not repeated: save → reopen → unchanged save, unknown names and a saved "severe"
// surviving an unchanged save (SharedCycleJournals), clearing an entry (CycleJournalsClearEntry), the daughter's presentation, English text.
// Dates are deterministic: only `Date` is faked — "today" is Thu 15 Oct 2026, 15:00 local. This screen always edits TODAY (no day arrows).
// Nothing is pre-ticked any more: a symptom is recorded only because she ticked it, "No symptoms" is her explicit declaration (stored as an empty
// list), saving needs one of the two, and intensity / zone are stored only when she chose them.

const NOW = new Date(2026, 9, 15, 15, 0, 0);
const TODAY = NOW.toLocaleDateString('en-CA');
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

// Base → Middle → Journal: a `goBack()` is visible as the route the person lands on.
async function mountSymptoms() {
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
                <Stack.Screen name="Journal">{() => <JournalSymptomsScreen />}</Stack.Screen>
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
const maybeByLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => pressables(renderer).find(node => node.props.accessibilityLabel === label);
const byLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const match = maybeByLabel(renderer, label);
  if (!match) {throw new Error(`No pressable labelled "${label}"`);}
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

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);
const SAVE_HEADER = () => t('journalSymptoms.saveSymptoms');
const SAVE_BUTTON = () => t('journalSymptoms.saveMySymptoms');
const NONE = () => t('journalSymptoms.noSymptoms');
const count = (n: number) => t('journalSymptoms.selectedCount', {count: n});
const intensity = (key: 'mild' | 'moderate' | 'strong' | 'veryStrong') =>
  t('journalSymptoms.intensityAccessibility', {label: t(`journalSymptoms.intensity.${key}.label`), description: t(`journalSymptoms.intensity.${key}.description`)});
const ALL_SYMPTOMS = [
  'Douleurs menstruelles', 'Crampes', 'Maux de tête', 'Migraines', 'Fatigue', 'Ballonnements', 'Nausées', 'Seins sensibles', 'Acné',
  'Douleurs lombaires', 'Douleurs musculaires', 'Constipation', 'Diarrhée', 'Pertes', 'Autre',
];
const LOCATIONS = ['Bas ventre', 'Dos', 'Tête', 'Seins', 'Corps entier'];
const failWrites = () =>
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
    if (key.startsWith(DAILY_KEY)) {throw new Error('disk full');}
    return realSetItem?.(key, value);
  });
const restoreWrites = () => (AsyncStorage.setItem as jest.Mock).mockImplementation(realSetItem);
const SEED = {names: ['Crampes', 'Acné'], severity: 'mild' as const, painLocation: 'Dos', note: 'garde-moi'};

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

describe('choosing symptoms', () => {
  it('offers the fifteen symptoms and "No symptoms" as check boxes; nothing is ticked on an untouched day', async () => {
    const renderer = await mountSymptoms();
    for (const name of [...ALL_SYMPTOMS, NONE()]) {
      const box = byLabel(renderer, name);
      expect(box.props.accessibilityRole).toBe('checkbox');
      expect(isOn(box)).toBe(false);
    }
    expect(textsOf(renderer)).toContain(count(0));
  });

  it('an untouched screen cannot be saved: both save controls are disabled and pressing them writes nothing', async () => {
    const renderer = await mountSymptoms();
    expect(byLabel(renderer, SAVE_HEADER()).props.disabled).toBe(true);
    expect(byLabel(renderer, SAVE_BUTTON()).props.disabled).toBe(true);
    const spy = jest.spyOn(AsyncStorage, 'setItem');
    spy.mockClear();
    await press(byLabel(renderer, SAVE_BUTTON()));
    await press(byLabel(renderer, SAVE_HEADER()));
    expect(spy.mock.calls.filter(call => String(call[0]).startsWith(DAILY_KEY))).toHaveLength(0);
    expect(await getJournalEntry(TODAY)).toBeUndefined();
    expect(textsOf(renderer)).not.toContain(t('journalSymptoms.savedToast'));
    spy.mockRestore();
  });

  it('opening the screen writes nothing, and choosing an intensity or a zone alone is not a declaration (still cannot be saved)', async () => {
    const renderer = await mountSymptoms();
    expect(await AsyncStorage.getItem(DAILY_KEY)).toBeNull();
    await press(byLabel(renderer, intensity('mild')));
    await press(byLabel(renderer, 'Dos'));
    expect(byLabel(renderer, SAVE_BUTTON()).props.disabled).toBe(true);
    await press(byLabel(renderer, SAVE_BUTTON()));
    expect(await getJournalEntry(TODAY)).toBeUndefined();
  });

  it('ticking a symptom enables saving; several can be ticked and unticked; the counter follows; the saved list keeps what is ticked, in the order it was ticked', async () => {
    const renderer = await mountSymptoms();
    await press(byLabel(renderer, 'Migraines'));
    expect(byLabel(renderer, SAVE_BUTTON()).props.disabled).toBe(false);
    await press(byLabel(renderer, 'Nausées'));
    await press(byLabel(renderer, 'Fatigue'));
    expect(textsOf(renderer)).toContain(count(3));
    await press(byLabel(renderer, 'Nausées')); // off
    expect(textsOf(renderer)).toContain(count(2));
    expect(isOn(byLabel(renderer, 'Nausées'))).toBe(false);
    await press(byLabel(renderer, SAVE_BUTTON()));
    expect((await getJournalEntry(TODAY))?.symptoms?.names).toEqual(['Migraines', 'Fatigue']);
  });

  it('every one of the fifteen symptoms can be saved on its own (including "Autre")', async () => {
    for (const name of ALL_SYMPTOMS) {
      await AsyncStorage.clear();
      const renderer = await mountSymptoms();
      await press(byLabel(renderer, name));
      await press(byLabel(renderer, SAVE_BUTTON()));
      expect([name, (await getJournalEntry(TODAY))?.symptoms?.names]).toEqual([name, [name]]);
      act(() => renderer.unmount());
      renderers.splice(0);
    }
  }, 60_000);

  it('unticking the only symptom takes the declaration away: saving is disabled again', async () => {
    const renderer = await mountSymptoms();
    await press(byLabel(renderer, 'Crampes'));
    await press(byLabel(renderer, 'Crampes'));
    expect(byLabel(renderer, SAVE_BUTTON()).props.disabled).toBe(true);
  });
});

describe('"No symptoms": her explicit declaration', () => {
  it('enables saving and is stored as an empty list with no intensity and no zone; reopening shows it ticked and nothing else', async () => {
    const renderer = await mountSymptoms();
    await press(byLabel(renderer, NONE()));
    expect(isOn(byLabel(renderer, NONE()))).toBe(true);
    expect(byLabel(renderer, SAVE_BUTTON()).props.disabled).toBe(false);
    await press(byLabel(renderer, SAVE_BUTTON()));
    expect((await getJournalEntry(TODAY))?.symptoms).toEqual({names: []});

    const reopened = await mountSymptoms();
    expect(isOn(byLabel(reopened, NONE()))).toBe(true);
    for (const name of ALL_SYMPTOMS) {
      expect(isOn(byLabel(reopened, name))).toBe(false);
    }
  });

  it('ticking it clears the symptoms, the intensity and the zone chosen before; ticking a symptom afterwards withdraws it', async () => {
    const renderer = await mountSymptoms();
    await press(byLabel(renderer, 'Migraines'));
    await press(byLabel(renderer, intensity('moderate')));
    await press(byLabel(renderer, 'Dos'));
    await press(byLabel(renderer, NONE()));
    expect(isOn(byLabel(renderer, 'Migraines'))).toBe(false);
    expect(isOn(byLabel(renderer, intensity('moderate')))).toBe(false);
    expect(isOn(byLabel(renderer, 'Dos'))).toBe(false);
    await press(byLabel(renderer, SAVE_BUTTON()));
    expect((await getJournalEntry(TODAY))?.symptoms).toEqual({names: []});

    const again = await mountSymptoms();
    await press(byLabel(again, 'Acné'));
    expect(isOn(byLabel(again, NONE()))).toBe(false);
    await press(byLabel(again, SAVE_BUTTON()));
    expect((await getJournalEntry(TODAY))?.symptoms?.names).toEqual(['Acné']);
  });

  it('ticking it twice withdraws the declaration (saving is disabled again)', async () => {
    const renderer = await mountSymptoms();
    await press(byLabel(renderer, NONE()));
    await press(byLabel(renderer, NONE()));
    expect(byLabel(renderer, SAVE_BUTTON()).props.disabled).toBe(true);
  });

  it('a day that was never declared stays absent, and is not the same as a declared "no symptoms"', async () => {
    expect(await getJournalEntry(TODAY)).toBeUndefined();
    const renderer = await mountSymptoms();
    await press(byLabel(renderer, NONE()));
    await press(byLabel(renderer, SAVE_BUTTON()));
    const entry = await getJournalEntry(TODAY);
    expect(entry?.symptoms).toBeDefined();
    expect(entry?.symptoms?.names).toEqual([]);
  });
});

describe('intensity and zone', () => {
  it.each([
    ['mild', 'mild'],
    ['moderate', 'moderate'],
    ['strong', 'severe'],
    ['veryStrong', 'severe'],
  ] as const)('intensity "%s" is saved as "%s"', async (key, stored) => {
    const renderer = await mountSymptoms();
    await press(byLabel(renderer, 'Crampes'));
    expect(isOn(byLabel(renderer, intensity(key)))).toBe(false); // never pre-chosen
    await press(byLabel(renderer, intensity(key)));
    expect(isOn(byLabel(renderer, intensity(key)))).toBe(true);
    await press(byLabel(renderer, SAVE_BUTTON()));
    expect((await getJournalEntry(TODAY))?.symptoms?.severity).toBe(stored);
  });

  it('"Très forte" and "Forte" are both stored as severe: a stored severe reopens on "Forte" (the lower of the two)', async () => {
    const renderer = await mountSymptoms();
    await press(byLabel(renderer, 'Crampes'));
    await press(byLabel(renderer, intensity('veryStrong')));
    await press(byLabel(renderer, SAVE_BUTTON()));
    const reopened = await mountSymptoms();
    expect(isOn(byLabel(reopened, intensity('strong')))).toBe(true);
    expect(isOn(byLabel(reopened, intensity('veryStrong')))).toBe(false);
  });

  it.each(LOCATIONS)('the zone "%s" is saved and shown as chosen when the screen is reopened', async zone => {
    const renderer = await mountSymptoms();
    await press(byLabel(renderer, 'Crampes'));
    for (const any of LOCATIONS) {
      expect(isOn(byLabel(renderer, any))).toBe(false); // never pre-chosen, whatever picture is shown
    }
    await press(byLabel(renderer, zone));
    await press(byLabel(renderer, SAVE_BUTTON()));
    expect((await getJournalEntry(TODAY))?.symptoms?.painLocation).toBe(zone);
    const reopened = await mountSymptoms();
    expect(isOn(byLabel(reopened, zone))).toBe(true);
    for (const other of LOCATIONS.filter(item => item !== zone)) {
      expect(isOn(byLabel(reopened, other))).toBe(false);
    }
  });
});

describe('intensity and zone are stored only when she chose them', () => {
  it('symptoms ticked, nothing else chosen: the entry has no severity and no zone (not the proposed ones)', async () => {
    const renderer = await mountSymptoms();
    await press(byLabel(renderer, 'Crampes'));
    await press(byLabel(renderer, SAVE_BUTTON()));
    const symptoms = (await getJournalEntry(TODAY))?.symptoms;
    expect(symptoms).toEqual({names: ['Crampes']});
    expect(symptoms).not.toHaveProperty('severity');
    expect(symptoms).not.toHaveProperty('painLocation');
  });

  it('only the intensity chosen, or only the zone chosen: only that one is stored', async () => {
    const first = await mountSymptoms();
    await press(byLabel(first, 'Crampes'));
    await press(byLabel(first, intensity('mild')));
    await press(byLabel(first, SAVE_BUTTON()));
    expect((await getJournalEntry(TODAY))?.symptoms).toEqual({names: ['Crampes'], severity: 'mild'});

    await AsyncStorage.clear();
    act(() => first.unmount());
    renderers.splice(0);
    const second = await mountSymptoms();
    await press(byLabel(second, 'Crampes'));
    await press(byLabel(second, 'Tête'));
    await press(byLabel(second, SAVE_BUTTON()));
    expect((await getJournalEntry(TODAY))?.symptoms).toEqual({names: ['Crampes'], painLocation: 'Tête'});
  });

  it('a saved intensity and zone come back as chosen and are kept by an unchanged save', async () => {
    await saveJournalSection(TODAY, 'symptoms', SEED);
    const renderer = await mountSymptoms();
    expect(isOn(byLabel(renderer, intensity('mild')))).toBe(true);
    expect(isOn(byLabel(renderer, 'Dos'))).toBe(true);
    await press(byLabel(renderer, SAVE_BUTTON()));
    expect((await getJournalEntry(TODAY))?.symptoms).toEqual(SEED);
  });
});

describe('changing an existing entry', () => {
  it('replaces the saved symptoms (one entry for the day, same id) and leaves the mood and every other section untouched', async () => {
    await saveJournalSection(TODAY, 'symptoms', SEED);
    await saveJournalSection(TODAY, 'mood', {level: 'sad', energy: 2, stress: 5, irritability: 1, motivation: 1, note: 'Journée difficile'});
    await saveJournalSection(TODAY, 'sleep', {hours: 7, quality: 'good', feeling: 'rested', note: ''} as never);
    const before = await getJournalEntry(TODAY);

    const renderer = await mountSymptoms();
    expect(isOn(byLabel(renderer, 'Crampes'))).toBe(true);
    await press(byLabel(renderer, 'Crampes')); // off
    await press(byLabel(renderer, 'Pertes')); // on
    await press(byLabel(renderer, intensity('moderate')));
    await press(byLabel(renderer, 'Tête'));
    await typeNote(renderer, 'Autre note');
    await press(byLabel(renderer, SAVE_BUTTON()));

    const after = await getJournalEntry(TODAY);
    expect(after?.symptoms).toEqual({names: ['Acné', 'Pertes'], severity: 'moderate', painLocation: 'Tête', note: 'Autre note'});
    expect(after?.mood).toEqual(before?.mood);
    expect(after?.sleep).toEqual(before?.sleep);
    expect(after?.id).toBe(before?.id);
    expect((await getAllJournalEntries()).filter(entry => entry.date === TODAY)).toHaveLength(1);
  });

  it('both save controls (the tick in the header and the button at the bottom) save', async () => {
    const first = await mountSymptoms();
    await press(byLabel(first, 'Migraines'));
    await press(byLabel(first, SAVE_HEADER()));
    expect((await getJournalEntry(TODAY))?.symptoms?.names).toContain('Migraines');
    act(() => first.unmount());
    renderers.splice(0);
    const second = await mountSymptoms();
    await press(byLabel(second, 'Pertes'));
    await press(byLabel(second, SAVE_BUTTON()));
    expect((await getJournalEntry(TODAY))?.symptoms?.names).toContain('Pertes');
  });
});

describe('the comment', () => {
  it('is limited to 300 characters and saved trimmed; spaces only leave no note at rest', async () => {
    const renderer = await mountSymptoms();
    expect(note(renderer).props.maxLength).toBe(300);
    await press(byLabel(renderer, 'Crampes'));
    await typeNote(renderer, '  Pire le soir  ');
    await press(byLabel(renderer, SAVE_BUTTON()));
    expect((await getJournalEntry(TODAY))?.symptoms?.note).toBe('Pire le soir');

    const again = await mountSymptoms(); // reopens with 'Crampes' already ticked (a saved declaration)
    await typeNote(again, '     ');
    await press(byLabel(again, SAVE_BUTTON()));
    expect((await getJournalEntry(TODAY))?.symptoms?.note ?? '').toBe('');
    const raw = JSON.parse((await AsyncStorage.getItem(DAILY_KEY)) as string) as Array<{symptoms: Record<string, unknown>}>;
    expect(raw[0].symptoms.note).toBeUndefined();
  });

  it('the whole entry, with its note, comes back intact after a restart of the store; the note is sealed at rest', async () => {
    const renderer = await mountSymptoms();
    await press(byLabel(renderer, 'Migraines'));
    await press(byLabel(renderer, 'Dos'));
    await typeNote(renderer, 'Très douloureux ce matin');
    await press(byLabel(renderer, SAVE_BUTTON()));
    expect(JSON.stringify(await AsyncStorage.getItem(DAILY_KEY))).not.toContain('Très douloureux');

    const keychain = require('react-native-keychain');
    let reloaded: {symptoms?: Record<string, unknown>} | undefined;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('react-native-keychain', () => keychain);
      jest.doMock('@react-native-async-storage/async-storage', () => AsyncStorage);
      const fresh = require('../../../state/dailyJournalStore');
      reloaded = await fresh.getJournalEntry(TODAY);
    });
    expect(reloaded?.symptoms).toEqual({names: ['Migraines'], painLocation: 'Dos', note: 'Très douloureux ce matin'});
  });
});

describe('after saving', () => {
  it('a confirmation toast is shown and the screen is left about 2.5 s later; the toast can be closed without leaving', async () => {
    const renderer = await mountSymptoms();
    await press(byLabel(renderer, 'Crampes'));
    await press(byLabel(renderer, SAVE_BUTTON()));
    expect(textsOf(renderer)).toContain(t('journalSymptoms.savedToast'));
    expect(route()).toBe('Journal');
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(route()).toBe('Journal');
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    await settle();
    expect(route()).toBe('Middle');
  });

  it('closing the toast by hand keeps the person on the screen and the entry saved', async () => {
    const renderer = await mountSymptoms();
    await press(byLabel(renderer, 'Crampes'));
    await press(byLabel(renderer, SAVE_BUTTON()));
    await press(byLabel(renderer, t('common.close')));
    await act(async () => {
      jest.advanceTimersByTime(3500);
    });
    await settle();
    expect(textsOf(renderer)).not.toContain(t('journalSymptoms.savedToast'));
    expect(route()).toBe('Journal');
    expect((await getJournalEntry(TODAY))?.symptoms).toBeDefined();
  });
});

describe('a failed write', () => {
  it('shows the symptoms alert once, no toast, stays on the screen with everything that was chosen, stores nothing, and a retry saves', async () => {
    const renderer = await mountSymptoms();
    await press(byLabel(renderer, 'Migraines'));
    await press(byLabel(renderer, 'Tête'));
    await typeNote(renderer, 'à garder');
    failWrites();
    await press(byLabel(renderer, SAVE_BUTTON()));
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toBe(t('journalSymptoms.errorTitle'));
    expect(textsOf(renderer)).not.toContain(t('journalSymptoms.savedToast'));
    expect(route()).toBe('Journal');
    expect(isOn(byLabel(renderer, 'Migraines'))).toBe(true);
    expect(isOn(byLabel(renderer, 'Tête'))).toBe(true);
    expect(note(renderer).props.value).toBe('à garder');
    expect(await getJournalEntry(TODAY)).toBeUndefined();

    restoreWrites();
    await press(byLabel(renderer, SAVE_BUTTON()));
    expect((await getJournalEntry(TODAY))?.symptoms).toMatchObject({names: expect.arrayContaining(['Migraines']), painLocation: 'Tête', note: 'à garder'});
    expect(textsOf(renderer)).toContain(t('journalSymptoms.savedToast'));
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });

  it('a failed change of existing symptoms leaves the stored symptoms as they were', async () => {
    await saveJournalSection(TODAY, 'symptoms', SEED);
    const renderer = await mountSymptoms();
    await press(byLabel(renderer, 'Pertes'));
    failWrites();
    await press(byLabel(renderer, SAVE_BUTTON()));
    expect(alertSpy).toHaveBeenCalledTimes(1);
    restoreWrites();
    expect((await getJournalEntry(TODAY))?.symptoms).toEqual(SEED);
  });

  it('a second tap 30 ms after the first, while the 80 ms write is still running, writes once', async () => {
    const renderer = await mountSymptoms();
    await press(byLabel(renderer, 'Migraines'));
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
      await new Promise<void>(resolve => setTimeout(resolve, 80));
      return realSetItem?.(key, value);
    });
    const spy = jest.spyOn(AsyncStorage, 'setItem');
    spy.mockClear();
    await act(async () => {
      byLabel(renderer, SAVE_BUTTON()).props.onPress();
      await new Promise<void>(resolve => setTimeout(resolve, 30));
    });
    await act(async () => {
      byLabel(renderer, SAVE_BUTTON()).props.onPress();
      await new Promise<void>(resolve => setTimeout(resolve, 600));
    });
    await settle();
    expect(spy.mock.calls.filter(call => String(call[0]).startsWith(DAILY_KEY))).toHaveLength(1);
    spy.mockRestore();
  });
});
