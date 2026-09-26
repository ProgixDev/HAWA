import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, TextInput} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import PregnancySymptomsScreen from '../pregnancy/PregnancySymptomsScreen';
import PregnancyWeightScreen from '../pregnancy/PregnancyWeightScreen';
import PostpartumJournalEntryScreen from '../PostpartumJournalEntryScreen';
import {getPregnancyJournalState, savePregnancySymptoms, savePregnancyWeight} from '../../state/pregnancyJournalStore';
import {
  getAllPostpartumJournalEntries,
  getPostpartumJournalEntry,
  hydratePostpartumJournal,
  savePostpartumJournalField,
} from '../../state/postpartumJournalStore';

// M25 - values that could be saved but never cleared: Pregnancy symptoms and
// weight, Postpartum daily answers (fatigue / mood + note / ...).
// save -> reopen -> clear -> reopen, other days and other categories preserved.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const todayKey = () => new Date().toLocaleDateString('en-CA');
const OTHER_DAY = '2026-01-15';

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderRoute(Component: React.ComponentType, params?: Record<string, unknown>) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen component={Component as never} initialParams={params} name="Journal" />
              <Stack.Screen name="MainTabs">{() => <Text>home</Text>}</Stack.Screen>
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

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);
const findButtons = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === label);
const hasButton = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => findButtons(renderer, label).length > 0;
const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = findButtons(renderer, label);
  if (matches.length === 0) {throw new Error(`No button "${label}"`);}
  await act(async () => {
    await matches[0].props.onPress();
  });
  await settle();
};
const unmountAll = () =>
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });

afterEach(() => {
  unmountAll();
});

describe('M25 - Pregnancy symptoms', () => {
  it('save -> reopen (restored) -> clear -> reopen (empty); other days untouched', async () => {
    await savePregnancySymptoms({date: OTHER_DAY, symptoms: ['Fatigue'], updatedAt: '2026-01-15T08:00:00.000Z'});

    const first = await renderRoute(PregnancySymptomsScreen);
    expect(hasButton(first, 'Effacer les symptômes du jour')).toBe(false); // nothing saved yet
    await press(first, 'Nausées');
    await press(first, 'Enregistrer mes symptômes');
    expect((await getPregnancyJournalState()).symptoms.find(entry => entry.date === todayKey())?.symptoms).toEqual(['Nausées']);
    unmountAll();

    const reopened = await renderRoute(PregnancySymptomsScreen);
    expect(hasButton(reopened, 'Effacer les symptômes du jour')).toBe(true);
    expect(textsOf(reopened)).toContain('1 sélectionné');
    await press(reopened, 'Effacer les symptômes du jour');
    const state = await getPregnancyJournalState();
    expect(state.symptoms.find(entry => entry.date === todayKey())).toBeUndefined();
    expect(state.symptoms.find(entry => entry.date === OTHER_DAY)?.symptoms).toEqual(['Fatigue']);
    unmountAll();

    const again = await renderRoute(PregnancySymptomsScreen);
    expect(textsOf(again)).toContain('0 sélectionné');
    expect(hasButton(again, 'Effacer les symptômes du jour')).toBe(false);
  });
});

describe('M25 - Pregnancy weight', () => {
  it('saved -> reopen -> clear -> reopen (no measurement); other days untouched', async () => {
    await savePregnancyWeight({date: OTHER_DAY, valueKg: 60, updatedAt: '2026-01-15T08:00:00.000Z'});
    await savePregnancyWeight({date: todayKey(), valueKg: 62.5, updatedAt: new Date().toISOString()});

    const reopened = await renderRoute(PregnancyWeightScreen);
    expect(textsOf(reopened)).toContain('Poids enregistré');
    await press(reopened, 'Effacer la mesure du jour');
    expect(textsOf(reopened)).toContain('Aucune mesure enregistrée');
    const weights = (await getPregnancyJournalState()).weights;
    expect(weights.find(entry => entry.date === todayKey())).toBeUndefined();
    expect(weights.find(entry => entry.date === OTHER_DAY)?.valueKg).toBe(60);
    unmountAll();

    const again = await renderRoute(PregnancyWeightScreen);
    expect(textsOf(again)).toContain('Aucune mesure enregistrée');
    expect(hasButton(again, 'Effacer la mesure du jour')).toBe(false);
  });
});

describe('M25 - Postpartum daily answers', () => {
  beforeEach(async () => {
    await hydratePostpartumJournal();
  });

  it('fatigue: save -> reopen -> clear -> reopen; the same day’s other categories and other days are kept', async () => {
    await savePostpartumJournalField(OTHER_DAY, 'fatigue', 'Forte');
    await savePostpartumJournalField(todayKey(), 'pain', 'Légère');

    const first = await renderRoute(PostpartumJournalEntryScreen as never, {category: 'fatigue'});
    expect(hasButton(first, 'Effacer ma réponse')).toBe(false);
    await press(first, 'Modérée');
    await press(first, 'Enregistrer');
    expect(getPostpartumJournalEntry(todayKey())).toMatchObject({fatigue: 'Modérée', pain: 'Légère'});
    unmountAll();

    const reopened = await renderRoute(PostpartumJournalEntryScreen as never, {category: 'fatigue'});
    expect(hasButton(reopened, 'Effacer ma réponse')).toBe(true);
    await press(reopened, 'Effacer ma réponse');
    expect(getPostpartumJournalEntry(todayKey())?.fatigue).toBeUndefined();
    expect(getPostpartumJournalEntry(todayKey())?.pain).toBe('Légère');
    expect(getPostpartumJournalEntry(OTHER_DAY)?.fatigue).toBe('Forte');
    unmountAll();

    const again = await renderRoute(PostpartumJournalEntryScreen as never, {category: 'fatigue'});
    expect(hasButton(again, 'Effacer ma réponse')).toBe(false);
  });

  it('mood: an emptied note field clears the saved note; clearing the answer removes mood AND note, and the emptied day disappears', async () => {
    const first = await renderRoute(PostpartumJournalEntryScreen as never, {category: 'mood'});
    await press(first, 'Bien');
    await act(async () => {
      first.root.findByType(TextInput).props.onChangeText('Une bonne journée');
    });
    await press(first, 'Enregistrer');
    expect(getPostpartumJournalEntry(todayKey())).toMatchObject({mood: 'Bien', moodNote: 'Une bonne journée'});
    unmountAll();

    // reopen, empty the note, save again -> the note is really cleared (was: kept)
    const second = await renderRoute(PostpartumJournalEntryScreen as never, {category: 'mood'});
    await act(async () => {
      second.root.findByType(TextInput).props.onChangeText('');
    });
    await press(second, 'Enregistrer');
    expect(getPostpartumJournalEntry(todayKey())?.mood).toBe('Bien');
    expect(getPostpartumJournalEntry(todayKey())?.moodNote).toBeUndefined();
    unmountAll();

    const third = await renderRoute(PostpartumJournalEntryScreen as never, {category: 'mood'});
    await press(third, 'Effacer ma réponse');
    expect(getPostpartumJournalEntry(todayKey())?.mood).toBeUndefined();
    // pain from the previous test is still there, so the day entry survives with it only
    expect(getPostpartumJournalEntry(todayKey())).toEqual({date: todayKey(), pain: 'Légère'});
    expect(Object.keys(getAllPostpartumJournalEntries())).toContain(OTHER_DAY);
  });
});
