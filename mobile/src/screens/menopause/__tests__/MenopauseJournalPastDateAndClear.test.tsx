import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Text, TextInput, type AlertButton} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import MenopauseJournalEntryScreen from '../MenopauseJournalEntryScreen';
import MenopauseCalendarContent from '../../../components/menopause/MenopauseCalendarContent';
import {setMenopauseHormonalTreatmentStatus, setMenopauseTrackedSymptoms} from '../../../state/menopausePreferences';
import {getMenopauseJournalEntry, saveMenopauseJournalField} from '../../../state/menopauseJournalStore';

// M21 (past-day entry) and M25 (saved values can be cleared) for the Menopause journals.

jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
}));

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const journalParams: unknown[] = [];

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

type Category = 'symptoms' | 'mood' | 'sleep' | 'energy' | 'treatment';

async function renderJournal(category: Category, date?: string) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Home">{() => <Text>home</Text>}</Stack.Screen>
              <Stack.Screen initialParams={{category, date}} name="MenopauseJournalEntry">
                {() => <MenopauseJournalEntryScreen />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await act(async () => {
    (navRef as unknown as {navigate: (name: string, params?: unknown) => void}).navigate('MenopauseJournalEntry', {
      category,
      date,
    });
  });
  await settle();
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf);

const buttonWithLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = renderer.root.findAll(
    node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === label,
  );
  if (matches.length === 0) {throw new Error(`No button "${label}"`);}
  return matches[0];
};
const hasButton = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === label).length > 0;

const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  await act(async () => {
    await buttonWithLabel(renderer, label).props.onPress();
  });
  await settle();
};

const isChecked = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  buttonWithLabel(renderer, label).props.accessibilityState.checked === true;

const inputWithLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.find(node => node.type === TextInput && node.props.accessibilityLabel === label);
const typeInto = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string, value: string) => {
  await act(async () => {
    inputWithLabel(renderer, label).props.onChangeText(value);
  });
};

let alertSpy: jest.SpyInstance;
const confirmLastAlert = async (buttonText: string) => {
  const calls = alertSpy.mock.calls;
  const buttons = calls[calls.length - 1][2] as AlertButton[];
  const button = buttons.find(candidate => candidate.text === buttonText)!;
  await act(async () => {
    await button.onPress?.();
  });
  await settle();
};

beforeEach(() => {
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 25, 12, 0, 0)});
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  alertSpy.mockRestore();
  jest.useRealTimers();
  journalParams.length = 0;
});

describe('M21 — Menopause journals accept an explicit PAST day (route param `date`)', () => {
  it('saving with date=2026-09-20 writes ONLY that day; today is untouched', async () => {
    const renderer = await renderJournal('mood', '2026-09-20');
    expect(textsOf(renderer).some(text => text.includes('Suivi du 20 septembre 2026'))).toBe(true);
    await press(renderer, 'Bien');
    await press(renderer, 'Enregistrer l’humeur');

    expect(getMenopauseJournalEntry('2026-09-20')?.mood).toBe('good');
    expect(getMenopauseJournalEntry('2026-09-25')?.mood).toBeUndefined();
  });

  it('opening a past day hydrates THAT day\'s entry, and saving keeps its other fields', async () => {
    await saveMenopauseJournalField('2026-09-19', 'mood', 'sad');
    await saveMenopauseJournalField('2026-09-19', 'energyLevel', 'low');
    const renderer = await renderJournal('mood', '2026-09-19');
    expect(isChecked(renderer, 'Triste')).toBe(true);

    await press(renderer, 'Motivée');
    await press(renderer, 'Enregistrer l’humeur');
    const entry = getMenopauseJournalEntry('2026-09-19');
    expect(entry?.mood).toBe('motivated');
    expect(entry?.energyLevel).toBe('low');
  });

  it('a FUTURE date is rejected with a message and nothing is written', async () => {
    const renderer = await renderJournal('mood', '2026-09-30');
    await press(renderer, 'Bien');
    await press(renderer, 'Enregistrer l’humeur');
    expect(textsOf(renderer)).toContain('Tu ne peux pas enregistrer un suivi pour une date à venir.');
    expect(getMenopauseJournalEntry('2026-09-30')).toBeUndefined();
  });

  it('without a date the journal still saves to today (unchanged behaviour)', async () => {
    const renderer = await renderJournal('energy');
    await press(renderer, 'Élevée');
    await press(renderer, 'Enregistrer mon énergie');
    expect(getMenopauseJournalEntry('2026-09-25')?.energyLevel).toBe('high');
  });
});

describe('M21 — Calendar launches the past-day journals', () => {
  it('a past selected day offers the categories with its date; today and the note/labs are not offered as past entries', async () => {
    await setMenopauseHormonalTreatmentStatus('track');
    const launched: unknown[] = [];
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={TEST_METRICS}>
          <AwaThemeProvider>
            <JournalSheetProvider>
              <NavigationContainer ref={navRef}>
                <Stack.Navigator screenOptions={{headerShown: false}}>
                  <Stack.Screen name="Calendar">{() => <MenopauseCalendarContent />}</Stack.Screen>
                  <Stack.Screen name="MenopauseJournalEntry">
                    {({route}) => {
                      launched.push(route.params);
                      return <Text>journal-stub</Text>;
                    }}
                  </Stack.Screen>
                </Stack.Navigator>
              </NavigationContainer>
            </JournalSheetProvider>
          </AwaThemeProvider>
        </SafeAreaProvider>,
      );
    });
    activeRenderers.push(renderer);
    await settle();

    // today selected by default: no past-day block
    expect(hasButton(renderer, 'Humeur : renseigner ce jour')).toBe(false);

    const day = renderer.root.find(
      node => typeof node.props.onPress === 'function' && /^18(,|$)/.test(String(node.props.accessibilityLabel)),
    );
    await act(async () => {
      day.props.onPress();
    });
    await settle();

    expect(hasButton(renderer, 'Humeur : renseigner ce jour')).toBe(true);
    expect(hasButton(renderer, 'Traitement hormonal : renseigner ce jour')).toBe(true);
    expect(hasButton(renderer, 'Notes du jour : renseigner ce jour')).toBe(false);
    expect(hasButton(renderer, 'Résultats d’analyses : renseigner ce jour')).toBe(false);

    await press(renderer, 'Humeur : renseigner ce jour');
    expect(launched).toContainEqual({category: 'mood', date: '2026-09-18'});
  });
});

describe('M25 — Menopause saved values can be cleared', () => {
  it('sleep: save -> reopen -> emptying the duration clears it (quality kept) -> reopen', async () => {
    let renderer = await renderJournal('sleep', '2026-09-10');
    await typeInto(renderer, 'Durée du sommeil en heures', '7');
    await press(renderer, 'Bonne');
    await press(renderer, 'Enregistrer mon sommeil');
    expect(getMenopauseJournalEntry('2026-09-10')).toMatchObject({sleepDurationHours: 7, sleepQuality: 'good'});

    act(() => {
      activeRenderers.splice(0).forEach(each => each.unmount());
    });
    renderer = await renderJournal('sleep', '2026-09-10');
    expect(inputWithLabel(renderer, 'Durée du sommeil en heures').props.value).toBe('7');

    await typeInto(renderer, 'Durée du sommeil en heures', '');
    await press(renderer, 'Enregistrer mon sommeil');
    const entry = getMenopauseJournalEntry('2026-09-10');
    expect(entry?.sleepDurationHours).toBeUndefined();
    expect(entry?.sleepQuality).toBe('good');

    act(() => {
      activeRenderers.splice(0).forEach(each => each.unmount());
    });
    renderer = await renderJournal('sleep', '2026-09-10');
    expect(inputWithLabel(renderer, 'Durée du sommeil en heures').props.value).toBe('');
  });

  it('mood: "Effacer ce suivi" asks for confirmation; cancel keeps it; confirm clears only mood and keeps other fields', async () => {
    await saveMenopauseJournalField('2026-09-11', 'mood', 'good');
    await saveMenopauseJournalField('2026-09-11', 'energyLevel', 'medium');

    let renderer = await renderJournal('mood', '2026-09-11');
    expect(isChecked(renderer, 'Bien')).toBe(true);
    await press(renderer, 'Effacer ce suivi');

    // cancel: nothing changes
    expect(alertSpy.mock.calls[alertSpy.mock.calls.length - 1][0]).toBe('Effacer ce suivi ?');
    await confirmLastAlert('Annuler');
    expect(getMenopauseJournalEntry('2026-09-11')?.mood).toBe('good');

    await press(renderer, 'Effacer ce suivi');
    await confirmLastAlert('Effacer');
    const entry = getMenopauseJournalEntry('2026-09-11');
    expect(entry?.mood).toBeUndefined();
    expect(entry?.energyLevel).toBe('medium');
    expect(isChecked(renderer, 'Bien')).toBe(false);
    // nothing left to clear for this category
    expect(hasButton(renderer, 'Effacer ce suivi')).toBe(false);

    act(() => {
      activeRenderers.splice(0).forEach(each => each.unmount());
    });
    renderer = await renderJournal('mood', '2026-09-11');
    expect(isChecked(renderer, 'Bien')).toBe(false);
  });

  it('a day left with no data at all is removed (not counted as a tracked day)', async () => {
    await saveMenopauseJournalField('2026-09-12', 'energyLevel', 'high');
    const renderer = await renderJournal('energy', '2026-09-12');
    await press(renderer, 'Effacer ce suivi');
    await confirmLastAlert('Effacer');
    expect(getMenopauseJournalEntry('2026-09-12')).toBeUndefined();
  });

  it('symptoms: deselecting the optional intensity persists the clear; symptoms are kept', async () => {
    await setMenopauseTrackedSymptoms(['hot_flashes']);
    await saveMenopauseJournalField('2026-09-13', 'symptoms', ['hot_flashes']);
    await saveMenopauseJournalField('2026-09-13', 'symptomIntensity', 'moderate');

    const renderer = await renderJournal('symptoms', '2026-09-13');
    expect(isChecked(renderer, 'Modéré')).toBe(true);
    await press(renderer, 'Modéré');
    await press(renderer, 'Enregistrer le suivi');

    const entry = getMenopauseJournalEntry('2026-09-13');
    expect(entry?.symptomIntensity).toBeUndefined();
    expect(entry?.symptoms).toEqual(['hot_flashes']);
  });

  it('treatment: emptying the note clears it while the status stays', async () => {
    await setMenopauseHormonalTreatmentStatus('track');
    await saveMenopauseJournalField('2026-09-14', 'treatmentStatus', 'taken');
    await saveMenopauseJournalField('2026-09-14', 'treatmentNote', 'Après le petit-déjeuner');

    let renderer = await renderJournal('treatment', '2026-09-14');
    expect(inputWithLabel(renderer, 'Notes sur le traitement').props.value).toBe('Après le petit-déjeuner');
    await typeInto(renderer, 'Notes sur le traitement', '');
    await press(renderer, 'Enregistrer le suivi');

    const entry = getMenopauseJournalEntry('2026-09-14');
    expect(entry?.treatmentNote).toBeUndefined();
    expect(entry?.treatmentStatus).toBe('taken');

    act(() => {
      activeRenderers.splice(0).forEach(each => each.unmount());
    });
    renderer = await renderJournal('treatment', '2026-09-14');
    expect(inputWithLabel(renderer, 'Notes sur le traitement').props.value).toBe('');
  });
});
