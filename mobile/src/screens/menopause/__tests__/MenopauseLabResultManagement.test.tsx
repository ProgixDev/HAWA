import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Text, TextInput, type AlertButton} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import MenopauseJournalEntryScreen from '../MenopauseJournalEntryScreen';
import {setMenopauseLabTracking} from '../../../state/menopausePreferences';
import {addMenopauseLabResult, getMenopauseLabResults} from '../../../state/menopauseJournalStore';

// M26 — existing lab results can be opened, edited and deleted (with a
// confirmation) from the journal's "Résultats d'analyses" screen.

let mockPickerProps: {
  onValueChange: (event: unknown, date?: Date) => void;
  maximumDate?: Date;
  value: Date;
} | null = null;
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: (props: never) => {
    mockPickerProps = props;
    return null;
  },
}));

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

async function renderLabJournal() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Home">{() => <Text>home</Text>}</Stack.Screen>
              <Stack.Screen initialParams={{category: 'labResults'}} name="MenopauseJournalEntry">
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
    (navRef as unknown as {navigate: (name: string) => void}).navigate('MenopauseJournalEntry');
  });
  await settle();
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf);

const buttonWithLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = renderer.root.findAll(
    node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === label,
  );
  if (matches.length === 0) {throw new Error(`No button "${label}"`);}
  return matches[0];
};

const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  await act(async () => {
    await buttonWithLabel(renderer, label).props.onPress();
  });
  await settle();
};

const valueInput = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.find(node => node.props.accessibilityLabel === 'Valeur de l’analyse' && node.type === TextInput);

const typeValue = async (renderer: ReactTestRenderer.ReactTestRenderer, value: string) => {
  await act(async () => {
    valueInput(renderer).props.onChangeText(value);
  });
};

const pickDate = async (date: Date) => {
  await act(async () => {
    mockPickerProps?.onValueChange({}, date);
  });
};

let alertSpy: jest.SpyInstance;
const lastAlertButtons = (): AlertButton[] => {
  const calls = alertSpy.mock.calls;
  return calls[calls.length - 1][2] as AlertButton[];
};
const lastAlertTitle = (): string => {
  const calls = alertSpy.mock.calls;
  return calls[calls.length - 1][0] as string;
};

const findResult = (value: number) => getMenopauseLabResults('fsh').find(result => result.value === value)!;

beforeEach(async () => {
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 25, 12, 0, 0)});
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await setMenopauseLabTracking('fsh');
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  alertSpy.mockRestore();
  jest.useRealTimers();
  mockPickerProps = null;
});

// Module-level store persists across the file: every scenario uses its own values.
describe('M26 — manage existing Menopause lab results', () => {
  it('EDIT: opens an existing result, changes value/unit/sample date; same id and recordedAt; other results untouched', async () => {
    await addMenopauseLabResult({type: 'fsh', value: 30.1, unit: 'UI/L', date: '2026-09-01'});
    await addMenopauseLabResult({type: 'fsh', value: 31.1, date: '2026-09-02'});
    const before = findResult(30.1);
    const other = findResult(31.1);
    const countBefore = getMenopauseLabResults().length;

    const renderer = await renderLabJournal();
    await press(renderer, 'Modifier le résultat FSH du 1 septembre 2026');
    expect(allTexts(renderer)).toContain('Modification d’un résultat');
    expect(valueInput(renderer).props.value).toBe('30.1');
    expect(allTexts(renderer)).toContain('Enregistrer les modifications');

    await typeValue(renderer, '35,5');
    await press(renderer, 'Date du prélèvement : 1 septembre 2026. Modifier');
    await pickDate(new Date(2026, 7, 30, 12, 0, 0));
    await press(renderer, 'Enregistrer les modifications');

    const after = findResult(35.5);
    expect(after.id).toBe(before.id);
    expect(after.recordedAt).toBe(before.recordedAt);
    expect(after.date).toBe('2026-08-30');
    expect(after.unit).toBe('UI/L');
    expect(getMenopauseLabResults().length).toBe(countBefore);
    expect(getMenopauseLabResults('fsh').some(result => result.value === 30.1)).toBe(false);
    expect(findResult(31.1)).toEqual(other);
  });

  it('CANCEL edit: leaves the stored result untouched and resets the form', async () => {
    await addMenopauseLabResult({type: 'fsh', value: 40.2, date: '2026-09-03'});
    const before = {...findResult(40.2)};

    const renderer = await renderLabJournal();
    await press(renderer, 'Modifier le résultat FSH du 3 septembre 2026');
    await typeValue(renderer, '99');
    await press(renderer, 'Annuler la modification');

    expect(findResult(40.2)).toEqual(before);
    expect(getMenopauseLabResults('fsh').some(result => result.value === 99)).toBe(false);
    expect(valueInput(renderer).props.value).toBe('');
    expect(allTexts(renderer)).not.toContain('Modification d’un résultat');
  });

  it('DELETE: asks for confirmation; confirming deletes exactly that result', async () => {
    await addMenopauseLabResult({type: 'fsh', value: 50.3, date: '2026-09-04'});
    await addMenopauseLabResult({type: 'fsh', value: 51.3, date: '2026-09-05'});
    const target = findResult(50.3);
    const keep = findResult(51.3);
    const countBefore = getMenopauseLabResults().length;

    const renderer = await renderLabJournal();
    await press(renderer, 'Supprimer le résultat FSH du 4 septembre 2026');

    // nothing is deleted before the user confirms
    expect(lastAlertTitle()).toBe('Supprimer ce résultat ?');
    expect(getMenopauseLabResults().length).toBe(countBefore);
    const buttons = lastAlertButtons();
    expect(buttons.map(button => button.text)).toEqual(['Annuler', 'Supprimer']);
    expect(buttons[1].style).toBe('destructive');

    await act(async () => {
      await buttons[1].onPress?.();
    });
    await settle();

    expect(getMenopauseLabResults().some(result => result.id === target.id)).toBe(false);
    expect(getMenopauseLabResults().length).toBe(countBefore - 1);
    expect(findResult(51.3)).toEqual(keep);
    expect(allTexts(renderer).some(text => text.includes('50.3'))).toBe(false);
  });

  it('DELETE cancel: choosing "Annuler" deletes nothing', async () => {
    await addMenopauseLabResult({type: 'fsh', value: 60.4, date: '2026-09-06'});
    const countBefore = getMenopauseLabResults().length;

    const renderer = await renderLabJournal();
    await press(renderer, 'Supprimer le résultat FSH du 6 septembre 2026');
    const cancel = lastAlertButtons()[0];
    expect(cancel.text).toBe('Annuler');
    expect(cancel.style).toBe('cancel');
    await act(async () => {
      await cancel.onPress?.();
    });
    await settle();

    expect(getMenopauseLabResults().length).toBe(countBefore);
    expect(getMenopauseLabResults('fsh').some(result => result.value === 60.4)).toBe(true);
  });

  it('FUTURE sample date is rejected with a message (editing): the stored date is kept', async () => {
    await addMenopauseLabResult({type: 'fsh', value: 70.5, date: '2026-09-07'});

    const renderer = await renderLabJournal();
    await press(renderer, 'Modifier le résultat FSH du 7 septembre 2026');
    await press(renderer, 'Date du prélèvement : 7 septembre 2026. Modifier');
    await pickDate(new Date(2026, 8, 30, 12, 0, 0));

    expect(allTexts(renderer)).toContain('La date du prélèvement ne peut pas être dans le futur.');
    // the field still shows the previously chosen date
    expect(allTexts(renderer)).toContain('7 septembre 2026');

    await typeValue(renderer, '71,5');
    await press(renderer, 'Enregistrer les modifications');
    expect(findResult(71.5).date).toBe('2026-09-07');
  });

  it('FUTURE sample date is rejected with a message (new result too)', async () => {
    const renderer = await renderLabJournal();
    await press(renderer, 'Date du prélèvement : 25 septembre 2026. Modifier');
    await pickDate(new Date(2026, 9, 2, 12, 0, 0));
    expect(allTexts(renderer)).toContain('La date du prélèvement ne peut pas être dans le futur.');
    expect(allTexts(renderer)).toContain('Aujourd’hui');
  });
});
