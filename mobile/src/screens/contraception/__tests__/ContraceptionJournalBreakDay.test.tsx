import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import ContraceptionJournalEntryScreen from '../ContraceptionJournalEntryScreen';
import {setContraceptionPreferences} from '../../../state/contraceptionPreferences';
import {
  deleteContraceptionIntakeRecord,
  getContraceptionIntakeRecord,
  hydrateContraceptionIntakeHistory,
  setContraceptionIntakeStatus,
} from '../../../state/contraceptionIntakeHistoryStore';
import {getContraceptionEventsForDate} from '../../../state/contraceptionEventStore';
import {addDays} from '../../../utils/cycleMath';

const INTAKE_KEY = '@hawa/contraception-intake-history/v1';

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 760},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const dateKey = (date: Date) => date.toLocaleDateString('en-CA');
const todayKey = () => dateKey(new Date());
const daysAgo = (count: number) => dateKey(addDays(new Date(), -count));

const CYCLIC_21_7 = {
  method: 'pill' as const,
  hasTreatmentBreak: true,
  pillScheduleType: 'cyclic' as const,
  activeDays: 21,
  breakDays: 7,
};

async function renderIntakeJournal() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Home">{() => <Text>home</Text>}</Stack.Screen>
              <Stack.Screen initialParams={{category: 'intake'}} name="ContraceptionJournalEntry">
                {() => <ContraceptionJournalEntryScreen />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await act(async () => {
    (navRef as unknown as {navigate: (name: string) => void}).navigate('ContraceptionJournalEntry');
  });
  for (let index = 0; index < 6; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  return renderer;
}

const texts = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

const hasText = (renderer: ReactTestRenderer.ReactTestRenderer, value: string) =>
  texts(renderer).some(text => text.includes(value));

const radios = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => node.props.accessibilityRole === 'radio' && typeof node.props.onPress === 'function');

// Distinct radio labels (the composite Pressable and its host View both match).
const radioLabels = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  Array.from(new Set(radios(renderer).map(node => String(node.props.accessibilityLabel))));

const radio = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  radios(renderer).filter(node => node.props.accessibilityLabel === label)[0];

const pressSave = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const button = renderer.root.find(
    node => node.props.accessibilityLabel === 'Enregistrer' && typeof node.props.onPress === 'function',
  );
  await act(async () => {
    await button.props.onPress();
  });
};

// Presses EVERY pressable that is on screen (radios, buttons, Save) — nothing
// reachable from the break-day screen may write an intake record.
const pressEverything = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const nodes = renderer.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      node.props.accessibilityLabel !== 'Retour' &&
      node.props.accessibilityLabel !== 'Enregistrer',
  );
  for (const node of nodes) {
    await act(async () => {
      await node.props.onPress();
    });
  }
};

beforeEach(async () => {
  await hydrateContraceptionIntakeHistory();
  await deleteContraceptionIntakeRecord(todayKey());
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await deleteContraceptionIntakeRecord(todayKey());
});

describe('Contraception journal (intake) — cyclic pill BREAK day', () => {
  it('offers no taken / late / missed action and shows the break-day info', async () => {
    await setContraceptionPreferences({...CYCLIC_21_7, methodStartDate: daysAgo(21)}); // pack day 22
    const renderer = await renderIntakeJournal();

    expect(radioLabels(renderer)).toEqual([]);
    expect(hasText(renderer, 'Aucune prise n’est attendue aujourd’hui')).toBe(true);
    expect(hasText(renderer, 'Effectuée')).toBe(false);
    expect(hasText(renderer, 'Oubliée')).toBe(false);
    expect(hasText(renderer, 'En retard')).toBe(false);
  });

  it('pressing every pressable (incl. Save) writes no intake record, in memory or in storage', async () => {
    await setContraceptionPreferences({...CYCLIC_21_7, methodStartDate: daysAgo(21)});
    const renderer = await renderIntakeJournal();

    await pressEverything(renderer);
    await pressSave(renderer);

    expect(getContraceptionIntakeRecord(todayKey())).toBeUndefined();
    const raw = await AsyncStorage.getItem(INTAKE_KEY);
    expect(raw ? JSON.parse(raw)[todayKey()] : undefined).toBeUndefined();
  });

  it('the LAST break day (pack day 28) is also read-only, no record written', async () => {
    await setContraceptionPreferences({...CYCLIC_21_7, methodStartDate: daysAgo(27)});
    const renderer = await renderIntakeJournal();
    expect(radioLabels(renderer)).toEqual([]);
    await pressSave(renderer);
    expect(getContraceptionIntakeRecord(todayKey())).toBeUndefined();
  });

  it('a status recorded earlier stays visible as a real record but cannot be changed from here', async () => {
    await setContraceptionPreferences({...CYCLIC_21_7, methodStartDate: daysAgo(22)}); // pack day 23
    await setContraceptionIntakeStatus(todayKey(), 'taken', 'pill');
    const renderer = await renderIntakeJournal();

    expect(radioLabels(renderer)).toEqual([]);
    expect(hasText(renderer, 'Un statut a déjà été enregistré pour aujourd’hui : Effectuée.')).toBe(true);

    await pressEverything(renderer);
    await pressSave(renderer);
    expect(getContraceptionIntakeRecord(todayKey())?.status).toBe('taken');
  });
});

describe('Contraception journal (intake) — unaffected cases', () => {
  it('ACTIVE pill day: taken / late / missed are offered and intake is saved', async () => {
    await setContraceptionPreferences({...CYCLIC_21_7, methodStartDate: daysAgo(4)}); // pack day 5
    const renderer = await renderIntakeJournal();

    expect(radioLabels(renderer)).toEqual(['Effectuée', 'En retard', 'Oubliée']);
    expect(hasText(renderer, 'Aucune prise n’est attendue aujourd’hui')).toBe(false);

    await act(async () => {
      radio(renderer, 'Effectuée').props.onPress();
    });
    await pressSave(renderer);
    expect(getContraceptionIntakeRecord(todayKey())?.status).toBe('taken');
  });

  it('CONTINUOUS pill (no break days): intake actions are offered', async () => {
    await setContraceptionPreferences({
      method: 'pill',
      hasTreatmentBreak: false,
      pillScheduleType: 'continuous',
      activeDays: null,
      breakDays: null,
      methodStartDate: daysAgo(40),
    });
    const renderer = await renderIntakeJournal();

    expect(radioLabels(renderer)).toEqual(['Effectuée', 'En retard', 'Oubliée']);
    await act(async () => {
      radio(renderer, 'Oubliée').props.onPress();
    });
    await pressSave(renderer);
    expect(getContraceptionIntakeRecord(todayKey())?.status).toBe('missed');
  });

  it('RING: event choices are offered (no break-day panel), unaffected', async () => {
    await setContraceptionPreferences({
      method: 'ring',
      hasTreatmentBreak: null,
      pillScheduleType: null,
      activeDays: null,
      breakDays: null,
      methodStartDate: daysAgo(21),
    });
    const renderer = await renderIntakeJournal();

    expect(radioLabels(renderer)).toContain('Anneau inséré');
    expect(hasText(renderer, 'Aucune prise n’est attendue aujourd’hui')).toBe(false);
    expect(getContraceptionEventsForDate(todayKey())).toEqual([]);
  });
});
