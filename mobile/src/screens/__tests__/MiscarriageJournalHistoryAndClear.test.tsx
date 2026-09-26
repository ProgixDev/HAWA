import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import MiscarriageJournalEntryScreen from '../MiscarriageJournalEntryScreen';
import {getMiscarriagePreferences, setMiscarriagePreferences} from '../../state/miscarriagePreferences';
import {getMiscarriageJournalEntry, saveMiscarriageJournalField} from '../../state/miscarriageJournalStore';
import {lockIntimacy, unlockIntimacy} from '../../state/privateSectionAuthStore';

// M21 (historical entry through the `date` route param) + M25 (saved values
// can be cleared) for the Loss journal entry screen. Clock pinned to
// 2026-09-26; loss date 2026-09-10. The journal store is a module singleton
// that persists inside this file, so every test uses its own distinct days.

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

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf);

type Category = 'bleeding' | 'physicalSymptoms' | 'personalNotes' | 'tryingAgain';

async function openEntry(category: Category, date?: string) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen
                component={MiscarriageJournalEntryScreen as unknown as React.ComponentType}
                initialParams={date ? {category, date} : {category}}
                name="Entry"
              />
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}

const closeEntry = (renderer: ReactTestRenderer.ReactTestRenderer) => {
  act(() => {
    renderer.unmount();
  });
  activeRenderers.splice(activeRenderers.indexOf(renderer), 1);
};

const byLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = renderer.root.findAll(
    node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === label,
  );
  if (matches.length === 0) {throw new Error(`No control "${label}"`);}
  return matches[0];
};
const tap = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  await act(async () => {
    await byLabel(renderer, label).props.onPress();
  });
  await settle();
};
const isChecked = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  byLabel(renderer, label).props.accessibilityState?.checked === true;
const typeInto = async (renderer: ReactTestRenderer.ReactTestRenderer, index: number, value: string) => {
  await act(async () => {
    renderer.root.findAllByType(TextInput)[index].props.onChangeText(value);
  });
};
const inputValue = (renderer: ReactTestRenderer.ReactTestRenderer, index: number) =>
  renderer.root.findAllByType(TextInput)[index].props.value;

beforeAll(() => {
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 26, 12, 0, 0)});
});
afterAll(() => {
  jest.useRealTimers();
});

beforeEach(async () => {
  await setMiscarriagePreferences({
    ...getMiscarriagePreferences(),
    miscarriageDate: '2026-09-10',
  });
  unlockIntimacy();
});

afterEach(() => {
  lockIntimacy();
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('M21 — historical entry through the optional `date` param (Saignements / Symptômes)', () => {
  it('a past day: hydrates THAT day, saves only that day, today is untouched', async () => {
    await saveMiscarriageJournalField('2026-09-15', 'physicalSymptoms', ['Crampes']);
    const renderer = await openEntry('physicalSymptoms', '2026-09-15');

    expect(textsOf(renderer).some(text => text.includes('Journée du 15 septembre 2026'))).toBe(true);
    expect(isChecked(renderer, 'Crampes')).toBe(true);

    await tap(renderer, 'Fatigue');
    await tap(renderer, 'Enregistrer');

    expect(getMiscarriageJournalEntry('2026-09-15')?.physicalSymptoms).toEqual(['Crampes', 'Fatigue']);
    expect(getMiscarriageJournalEntry('2026-09-26')).toBeUndefined();
  });

  it('a past bleeding entry saves the intensity and its start day on that day', async () => {
    const renderer = await openEntry('bleeding', '2026-09-16');
    await tap(renderer, 'Léger');
    await tap(renderer, 'Enregistrer');

    expect(getMiscarriageJournalEntry('2026-09-16')).toMatchObject({bleeding: 'Léger', bleedingStartDate: '2026-09-16'});
    expect(getMiscarriageJournalEntry('2026-09-26')).toBeUndefined();
  });

  it('no date param: today behaviour unchanged (saves to today)', async () => {
    const renderer = await openEntry('bleeding');
    expect(textsOf(renderer).some(text => text.startsWith('Aujourd’hui'))).toBe(true);
    await tap(renderer, 'Modéré');
    await tap(renderer, 'Enregistrer');
    expect(getMiscarriageJournalEntry('2026-09-26')).toMatchObject({bleeding: 'Modéré'});
  });

  it('a FUTURE day is refused with a message and nothing is written', async () => {
    const renderer = await openEntry('bleeding', '2026-09-28');
    await tap(renderer, 'Léger');
    await tap(renderer, 'Enregistrer');
    expect(textsOf(renderer)).toContain('Tu ne peux pas enregistrer un suivi pour une date à venir.');
    expect(getMiscarriageJournalEntry('2026-09-28')).toBeUndefined();
  });

  it('a day BEFORE the loss date is refused (same chronology as the loss-date edit check)', async () => {
    const renderer = await openEntry('physicalSymptoms', '2026-09-05');
    await tap(renderer, 'Fatigue');
    await tap(renderer, 'Enregistrer');
    expect(textsOf(renderer).some(text => text.includes('antérieure à ta fausse couche'))).toBe(true);
    expect(getMiscarriageJournalEntry('2026-09-05')).toBeUndefined();
  });

  it('Notes personnelles stays today-only: a date param is refused, never silently written to another day', async () => {
    const renderer = await openEntry('personalNotes', '2026-09-17');
    await typeInto(renderer, 0, 'Une pensée');
    await tap(renderer, 'Enregistrer');
    expect(textsOf(renderer)).toContain('Cette rubrique ne peut être renseignée que pour aujourd’hui.');
    expect(getMiscarriageJournalEntry('2026-09-17')).toBeUndefined();
    expect(getMiscarriageJournalEntry('2026-09-26')?.personalNotes).toBeUndefined();
  });

  it('Reprise des essais stays today-only (it also rewrites the global status)', async () => {
    const before = getMiscarriagePreferences().tryingAgainStatus;
    const renderer = await openEntry('tryingAgain', '2026-09-17');
    await tap(renderer, 'Oui, je me sens prête');
    await tap(renderer, 'Enregistrer');
    expect(textsOf(renderer)).toContain('Cette rubrique ne peut être renseignée que pour aujourd’hui.');
    expect(getMiscarriageJournalEntry('2026-09-17')).toBeUndefined();
    expect(getMiscarriagePreferences().tryingAgainStatus).toBe(before);
  });
});

describe('M25 — a saved value can be cleared (save -> reopen -> clear -> reopen)', () => {
  it('Symptômes physiques: clearing every symptom and the note persists the empty state; other fields kept', async () => {
    const day = '2026-09-18';
    await saveMiscarriageJournalField(day, 'bleeding', 'Léger'); // unrelated field, same day

    let renderer = await openEntry('physicalSymptoms', day);
    // nothing saved yet + nothing selected: still refused
    await tap(renderer, 'Enregistrer');
    expect(textsOf(renderer)).toContain('Choisis au moins un symptôme avant d’enregistrer.');
    expect(getMiscarriageJournalEntry(day)?.physicalSymptoms).toBeUndefined();

    await tap(renderer, 'Fatigue');
    await tap(renderer, 'Crampes');
    await typeInto(renderer, 0, 'Détail du jour');
    await tap(renderer, 'Enregistrer');
    closeEntry(renderer);

    renderer = await openEntry('physicalSymptoms', day);
    expect(isChecked(renderer, 'Fatigue')).toBe(true);
    expect(inputValue(renderer, 0)).toBe('Détail du jour');

    await tap(renderer, 'Fatigue');
    await tap(renderer, 'Crampes');
    await typeInto(renderer, 0, '');
    await tap(renderer, 'Enregistrer');
    expect(textsOf(renderer)).not.toContain('Choisis au moins un symptôme avant d’enregistrer.');
    closeEntry(renderer);

    const stored = getMiscarriageJournalEntry(day);
    expect(stored?.physicalSymptoms).toEqual([]);
    expect(stored?.physicalSymptomsNote).toBe('');
    expect(stored?.bleeding).toBe('Léger');
    expect(await AsyncStorage.getItem('@hawa/miscarriage-journal/v1')).not.toContain('Détail du jour');

    renderer = await openEntry('physicalSymptoms', day);
    expect(isChecked(renderer, 'Fatigue')).toBe(false);
    expect(isChecked(renderer, 'Crampes')).toBe(false);
    expect(inputValue(renderer, 0)).toBe('');
  });

  it('Symptômes physiques: the note alone can be cleared while symptoms are kept', async () => {
    const day = '2026-09-19';
    await saveMiscarriageJournalField(day, 'physicalSymptoms', ['Nausées']);
    await saveMiscarriageJournalField(day, 'physicalSymptomsNote', 'à effacer');
    const renderer = await openEntry('physicalSymptoms', day);
    expect(inputValue(renderer, 0)).toBe('à effacer');
    await typeInto(renderer, 0, '');
    await tap(renderer, 'Enregistrer');
    expect(getMiscarriageJournalEntry(day)).toMatchObject({physicalSymptoms: ['Nausées'], physicalSymptomsNote: ''});
  });

  it('Notes personnelles: emptying a saved note and saving clears it (never persisted in clear at rest either)', async () => {
    let renderer = await openEntry('personalNotes');
    // nothing saved yet + empty: still refused
    await tap(renderer, 'Enregistrer');
    expect(textsOf(renderer)).toContain('Ajoute une note avant d’enregistrer.');

    await typeInto(renderer, 0, 'MARQUEUR_NOTE_25');
    await tap(renderer, 'Enregistrer');
    closeEntry(renderer);
    expect(getMiscarriageJournalEntry('2026-09-26')?.personalNotes).toBe('MARQUEUR_NOTE_25');

    renderer = await openEntry('personalNotes');
    expect(inputValue(renderer, 0)).toBe('MARQUEUR_NOTE_25');
    await typeInto(renderer, 0, '');
    await tap(renderer, 'Enregistrer');
    expect(textsOf(renderer)).not.toContain('Ajoute une note avant d’enregistrer.');
    closeEntry(renderer);

    expect(getMiscarriageJournalEntry('2026-09-26')?.personalNotes).toBe('');
    expect(await AsyncStorage.getItem('@hawa/miscarriage-journal/v1')).not.toContain('MARQUEUR_NOTE_25');

    renderer = await openEntry('personalNotes');
    expect(inputValue(renderer, 0)).toBe('');
  });

  it('Saignements: the free-text note can be cleared; the intensity stays (Absent is the existing "none" value)', async () => {
    const day = '2026-09-20';
    let renderer = await openEntry('bleeding', day);
    await tap(renderer, 'Modéré');
    await typeInto(renderer, 0, 'note flux');
    await tap(renderer, 'Enregistrer');
    closeEntry(renderer);

    renderer = await openEntry('bleeding', day);
    expect(inputValue(renderer, 0)).toBe('note flux');
    await typeInto(renderer, 0, '');
    await tap(renderer, 'Absent');
    await tap(renderer, 'Enregistrer');
    closeEntry(renderer);

    expect(getMiscarriageJournalEntry(day)).toMatchObject({bleeding: 'Absent', bleedingNote: ''});
    renderer = await openEntry('bleeding', day);
    expect(inputValue(renderer, 0)).toBe('');
  });
});
