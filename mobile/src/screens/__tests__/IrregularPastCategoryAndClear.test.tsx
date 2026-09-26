import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, TextInput} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import IrregularJournalEntryScreen from '../IrregularJournalEntryScreen';
import {getAllIrregularJournalEntries, getIrregularJournalEntry} from '../../state/irregularJournalStore';
import {computeIrregularMonthlySummary} from '../../utils/irregularCalendarMath';

// M21 / M25 (SOPK) - every non-period SOPK category screen already honours the
// optional `date` route param (hydrate + save are keyed by the requested day,
// today's behaviour unchanged, future rejected). M25: the four "Aucune"
// categories can be reset to their canonical empty answer.
// Today is pinned to 2026-09-26. Module-singleton store: distinct dates.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const TODAY = '2026-09-26';

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};
const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');

async function renderEntry(category: string, date?: string) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Home">{() => <Text>home</Text>}</Stack.Screen>
              <Stack.Screen initialParams={{category, date}} name="IrregularJournalEntry">
                {() => <IrregularJournalEntryScreen />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await act(async () => {
    (navRef as unknown as {navigate: (name: string) => void}).navigate('IrregularJournalEntry');
  });
  await settle();
  return renderer;
}

const unmountAll = () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
};

const option = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.find(
    node =>
      typeof node.props.onPress === 'function' &&
      typeof node.props.accessibilityRole === 'string' &&
      node.findAllByType(Text).some(text => textOf(text) === label),
  );
const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  await act(async () => {
    option(renderer, label).props.onPress();
  });
};
const isChecked = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  option(renderer, label).props.accessibilityState?.checked === true;
const save = async (renderer: ReactTestRenderer.ReactTestRenderer, label = 'Enregistrer mon suivi') => {
  await act(async () => {
    await option(renderer, label).props.onPress();
  });
  await settle();
};
const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);
const noteInput = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(TextInput).find(input => input.props.placeholder === 'Ajouter une note…')!;

beforeEach(() => {
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 26, 15, 0, 0)});
});
afterEach(() => {
  unmountAll();
  jest.useRealTimers();
});

describe('SOPK category journals - past day (M21)', () => {
  it('acne: written to the requested past day only; wording is not "aujourd’hui"', async () => {
    const renderer = await renderEntry('acne', '2026-09-20');
    expect(allTexts(renderer)).toContain('État de ta peau ce jour-là');
    expect(allTexts(renderer).some(text => /aujourd’hui/.test(text))).toBe(false);

    await press(renderer, 'Légère');
    await save(renderer);

    expect(getIrregularJournalEntry('2026-09-20')?.acne).toBe('Légère');
    expect(getIrregularJournalEntry(TODAY)).toBeUndefined();
  });

  it('hairGrowth / pain / mood / weight / fatigue also write to the requested past day, not today', async () => {
    const cases: Array<[string, string, string, string]> = [
      ['hairGrowth', '2026-09-10', 'Modérée', 'Enregistrer mon suivi'],
      ['pain', '2026-09-11', 'Forte', 'Enregistrer mes douleurs'],
      ['mood', '2026-09-12', 'Bien', 'Enregistrer mon humeur'],
      ['fatigue', '2026-09-13', 'Légère', 'Enregistrer mon suivi'],
    ];
    for (const [category, date, answer, saveLabel] of cases) {
      const renderer = await renderEntry(category, date);
      await press(renderer, answer);
      await save(renderer, saveLabel);
      unmountAll();
      expect((getIrregularJournalEntry(date) as Record<string, unknown>)?.[category]).toBe(answer);
    }

    const weight = await renderEntry('weight', '2026-09-14');
    await act(async () => {
      weight.root.findByProps({accessibilityLabel: 'Poids du jour'}).props.onChangeText('64,2 kg');
    });
    await save(weight, 'Enregistrer mon poids');
    unmountAll();
    expect(getIrregularJournalEntry('2026-09-14')?.weight).toBe('64,2 kg');

    expect(getIrregularJournalEntry(TODAY)).toBeUndefined();
  });

  it('a past-day answer is restored when the day is reopened; today (no date) is unaffected', async () => {
    const reopened = await renderEntry('acne', '2026-09-20');
    expect(isChecked(reopened, 'Légère')).toBe(true);
    unmountAll();

    const todayScreen = await renderEntry('acne');
    expect(isChecked(todayScreen, 'Légère')).toBe(false);
    await press(todayScreen, 'Modérée');
    await save(todayScreen);
    expect(getIrregularJournalEntry(TODAY)?.acne).toBe('Modérée');
    expect(getIrregularJournalEntry('2026-09-20')?.acne).toBe('Légère');
  });

  it('a FUTURE date is rejected and nothing is written', async () => {
    const renderer = await renderEntry('acne', '2026-09-27');
    await press(renderer, 'Légère');
    await save(renderer);
    expect(allTexts(renderer)).toContain('Tu ne peux pas enregistrer un suivi pour une date à venir.');
    expect(getIrregularJournalEntry('2026-09-27')).toBeUndefined();
  });
});

describe('SOPK category journals - clearing a saved answer (M25)', () => {
  it('acne save -> reopen -> reset to "Aucune" -> reopen: canonical empty answer, no longer a symptom day', async () => {
    const first = await renderEntry('acne', '2026-09-05');
    await press(first, 'Modérée');
    await save(first);
    unmountAll();
    expect(getIrregularJournalEntry('2026-09-05')?.acne).toBe('Modérée');

    const second = await renderEntry('acne', '2026-09-05');
    expect(isChecked(second, 'Modérée')).toBe(true);
    await press(second, 'Aucune');
    await save(second);
    unmountAll();

    const third = await renderEntry('acne', '2026-09-05');
    expect(isChecked(third, 'Aucune')).toBe(true);
    expect(isChecked(third, 'Modérée')).toBe(false);
    expect(getIrregularJournalEntry('2026-09-05')?.acne).toBe('Aucune');
    expect(computeIrregularMonthlySummary(getAllIrregularJournalEntries(), [], 2026, 8).acneDays).toBe(2); // 09-20 and today's; 09-05 is now "Aucune"
  });

  it('the optional note can be cleared (emptied and saved) while the answer is kept', async () => {
    const first = await renderEntry('hairGrowth', '2026-09-06');
    await press(first, 'Légère');
    await act(async () => {
      noteInput(first).props.onChangeText('NOTE_TO_CLEAR');
    });
    await save(first);
    unmountAll();
    expect(getIrregularJournalEntry('2026-09-06')?.details?.hairGrowth?.note).toBe('NOTE_TO_CLEAR');

    const second = await renderEntry('hairGrowth', '2026-09-06');
    expect(noteInput(second).props.value).toBe('NOTE_TO_CLEAR');
    await act(async () => {
      noteInput(second).props.onChangeText('');
    });
    await save(second);
    unmountAll();

    const entry = getIrregularJournalEntry('2026-09-06');
    expect(entry?.hairGrowth).toBe('Légère');
    expect(entry?.details?.hairGrowth?.note).toBeUndefined();
  });

  it('weight has no empty state today: emptying the field is refused (documented gap, nothing is erased)', async () => {
    const first = await renderEntry('weight', '2026-09-07');
    await act(async () => {
      first.root.findByProps({accessibilityLabel: 'Poids du jour'}).props.onChangeText('70 kg');
    });
    await save(first, 'Enregistrer mon poids');
    unmountAll();

    const second = await renderEntry('weight', '2026-09-07');
    await act(async () => {
      second.root.findByProps({accessibilityLabel: 'Poids du jour'}).props.onChangeText('');
    });
    await save(second, 'Enregistrer mon poids');
    expect(allTexts(second)).toContain('Choisis une réponse avant d’enregistrer.');
    expect(getIrregularJournalEntry('2026-09-07')?.weight).toBe('70 kg');
  });
});
