import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import ContraceptionJournalEntryScreen from '../ContraceptionJournalEntryScreen';
import {setContraceptionPreferences} from '../../../state/contraceptionPreferences';
import {getContraceptionJournalEntry, hydrateContraceptionJournal} from '../../../state/contraceptionJournalStore';
import {getContraceptionIntakeRecord} from '../../../state/contraceptionIntakeHistoryStore';

// M21 (Contraception) - "Effets ressentis" (general tracking data) accepts an
// explicit past day (from the Calendar selected day); today's behaviour is
// unchanged, a future day is rejected, and the intake journal / notes stay
// today-only (a `date` param is ignored for them). Today pinned to 2026-09-26.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 760},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const TODAY = '2026-09-26';

async function renderJournal(params: {category: string; date?: string}) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Home">{() => <Text>home</Text>}</Stack.Screen>
              <Stack.Screen initialParams={params} name="ContraceptionJournalEntry">
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

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const texts = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);
const chip = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.props.accessibilityLabel === label && node.props.accessibilityRole === 'checkbox')[0];
const pressSave = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
  await act(async () => {
    await renderer.root
      .find(node => node.props.accessibilityLabel === 'Enregistrer' && typeof node.props.onPress === 'function')
      .props.onPress();
  });
};

beforeEach(async () => {
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 26, 15, 0, 0)});
  await setContraceptionPreferences({method: 'pill'});
  await hydrateContraceptionJournal();
});
afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('Contraception - Effets ressentis on a past day', () => {
  it('saves to the requested past day only, shows that day (not "Aujourd’hui"), today untouched', async () => {
    const renderer = await renderJournal({category: 'feelings', date: '2026-09-20'});
    expect(texts(renderer).some(text => /20 septembre 2026/.test(text))).toBe(true);
    expect(texts(renderer).some(text => /^Aujourd’hui/.test(text))).toBe(false);
    expect(texts(renderer).some(text => /ressenti ce jour-là/.test(text))).toBe(true);

    await act(async () => {
      chip(renderer, 'Nausées').props.onPress();
    });
    await pressSave(renderer);

    expect(getContraceptionJournalEntry('2026-09-20')?.feelings).toEqual(['Nausées']);
    expect(getContraceptionJournalEntry(TODAY)).toBeUndefined();
  });

  it('reopening the past day restores it; clearing it (deselect + save) removes only that day', async () => {
    const reopened = await renderJournal({category: 'feelings', date: '2026-09-20'});
    expect(chip(reopened, 'Nausées').props.accessibilityState.checked).toBe(true);

    await act(async () => {
      chip(reopened, 'Nausées').props.onPress();
    });
    await pressSave(reopened);
    expect(getContraceptionJournalEntry('2026-09-20')?.feelings).toBeUndefined();
  });

  it('no date param: still today', async () => {
    const renderer = await renderJournal({category: 'feelings'});
    expect(texts(renderer).some(text => /^Aujourd’hui/.test(text))).toBe(true);
    await act(async () => {
      chip(renderer, 'Fatigue').props.onPress();
    });
    await pressSave(renderer);
    expect(getContraceptionJournalEntry(TODAY)?.feelings).toEqual(['Fatigue']);
  });

  it('a FUTURE date is rejected, nothing written', async () => {
    const renderer = await renderJournal({category: 'feelings', date: '2026-09-27'});
    await act(async () => {
      chip(renderer, 'Fatigue').props.onPress();
    });
    await pressSave(renderer);
    expect(texts(renderer)).toContain('Tu ne peux pas enregistrer un suivi pour une date à venir.');
    expect(getContraceptionJournalEntry('2026-09-27')).toBeUndefined();
  });

  it('the intake journal ignores a date param: it stays today-only and writes nothing to the past day', async () => {
    await setContraceptionPreferences({method: 'pill', pillScheduleType: 'continuous', hasTreatmentBreak: false});
    const renderer = await renderJournal({category: 'intake', date: '2026-09-20'});
    expect(texts(renderer).some(text => /^Aujourd’hui/.test(text))).toBe(true);
    expect(getContraceptionIntakeRecord('2026-09-20')).toBeUndefined();
  });
});
