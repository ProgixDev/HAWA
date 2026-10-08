import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import StatisticsScreen from '../StatisticsScreen';
import ObjectiveAwareStatisticsScreen from '../ObjectiveAwareStatisticsScreen';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {recordConfirmedPeriodEnd, removeConfirmedPeriodOccurrence} from '../../state/confirmedPeriodHistoryStore';
import {addManagedProfile, resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {reloadActiveProfileData, resetActiveProfileForTests, setActiveProfileId} from '../../state/activeProfileStore';
import {setActiveObjective, reloadCycleStateFromStorage} from '../../state/onboardingPreferences';
import {resetAppLanguageForTests, setAppLanguage, setAppearanceMode} from '../../state/themePreferences';

// Phase 8 — the Cycle Statistics screen shows only the ACTIVE profile's real, confirmed data, never a
// default, a mock or another profile's numbers.

const Stack = createNativeStackNavigator();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const NOW = new Date(2026, 8, 25, 15, 0, 0);
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const flush = async () => {
  for (let index = 0; index < 12; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderScreen(element: React.ReactElement = <StatisticsScreen navigation={{} as never} route={{key: 'test', name: 'Statistics'} as never} />) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">{() => element}</Stack.Screen>
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
const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer): string[] => renderer.root.findAllByType(Text).map(textOf);

const at = (month: number, day: number) => new Date(2026, month, day, 12);
const mood = (level: 'good' | 'sad' | 'tired') => ({level, energy: 3, stress: 2, irritability: 1, motivation: 3});

/** Two confirmed periods, 23 days apart (not 28), the first lasting 4 days. */
const recordTwoPeriods = async () => {
  await recordConfirmedPeriodEnd(at(7, 28), at(7, 31));
  await recordConfirmedPeriodEnd(at(8, 20), at(8, 23));
};

const switchTo = async (profileId: string) => {
  await act(async () => {
    await setActiveProfileId(profileId);
  });
  await flush();
};

beforeEach(async () => {
  resetPremiumStateForTests();
  await AsyncStorage.clear();
  jest.useFakeTimers({advanceTimers: true, now: NOW});
  await resetAppLanguageForTests();
  await setAppearanceMode('light');
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  await reloadCycleStateFromStorage();
  reloadActiveProfileData();
  await flush();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

const addDaughter = (firstName: string) =>
  addManagedProfile({type: 'daughter', firstName, birthDate: '2013-01-01', hasHadFirstPeriod: false});

describe('Cycle Statistics — real data (Phase 8)', () => {
  it('no records: one honest empty state, no number, no chart, no mock value', async () => {
    const texts = allTexts(await renderScreen());
    expect(texts).toContain('No statistics yet');
    expect(texts).toContain('Your statistics will appear once you start recording your data.');
    // only the period selector ("1 month", "3 months"…) carries digits — no measurement is shown
    expect(texts.filter(text => /\d/.test(text) && !/^\d+ months?$/.test(text))).toEqual([]);
    expect(texts).not.toContain('Cycle regularity');
    expect(texts).not.toContain('Mood');
  });

  it('one confirmed period: no average cycle length, but its real duration', async () => {
    await recordConfirmedPeriodEnd(at(8, 10), at(8, 14));
    const texts = allTexts(await renderScreen());
    expect(texts).toContain('Not enough cycles recorded yet');
    expect(texts).toContain('Average period: 5 days');
    expect(texts).not.toContain('Shortest cycle: 5 days');
  });

  it('several confirmed periods: the average cycle length is the real gap, not 28', async () => {
    await recordTwoPeriods();
    const texts = allTexts(await renderScreen());
    expect(texts).toContain('23');
    expect(texts).not.toContain('28');
    expect(texts).toContain('Shortest cycle: 23 days');
    expect(texts).toContain('Longest cycle: 23 days');
    expect(texts).toContain('Average period: 4 days');
  });

  it('shows the real symptom frequencies and mood distribution', async () => {
    await saveJournalSection('2026-09-20', 'symptoms', {names: ['Crampes', 'Fatigue'], severity: 'mild'});
    await saveJournalSection('2026-09-21', 'symptoms', {names: ['Crampes'], severity: 'mild'});
    await saveJournalSection('2026-09-20', 'mood', mood('good'));
    await saveJournalSection('2026-09-21', 'mood', mood('good'));
    await saveJournalSection('2026-09-22', 'mood', mood('tired'));
    const texts = allTexts(await renderScreen());
    expect(texts).toContain('Cramps');
    expect(texts).toContain('Good');
    expect(texts).toContain('Tired');
    expect(texts).not.toContain('Sad');
    expect(texts.filter(text => text === '2 days').length).toBeGreaterThanOrEqual(2);
  });

  it('a profile with no data never shows another profile’s statistics, and switching back restores them', async () => {
    await recordTwoPeriods();
    await saveJournalSection('2026-09-20', 'mood', mood('good'));
    const leila = await addDaughter('Leila');

    const renderer = await renderScreen();
    expect(allTexts(renderer)).toContain('23');

    await switchTo(leila.id);
    const daughterTexts = allTexts(renderer);
    expect(daughterTexts).toContain('No statistics yet');
    expect(daughterTexts).not.toContain('23');
    expect(daughterTexts).not.toContain('Good');

    await switchTo('owner');
    const ownerTexts = allTexts(renderer);
    expect(ownerTexts).toContain('23');
    expect(ownerTexts).not.toContain('No statistics yet');
  });

  it('a daughter’s own data is shown for her and not for the owner', async () => {
    const leila = await addDaughter('Leila');
    await switchTo(leila.id);
    await recordConfirmedPeriodEnd(at(8, 1), at(8, 4));
    await recordConfirmedPeriodEnd(at(8, 22), at(8, 24));

    const renderer = await renderScreen();
    expect(allTexts(renderer)).toContain('21');

    await switchTo('owner');
    const ownerTexts = allTexts(renderer);
    expect(ownerTexts).not.toContain('21');
    expect(ownerTexts).toContain('No statistics yet');
  });

  it('rapid switching ends on the active profile’s data, never a stale one', async () => {
    await recordTwoPeriods();
    const leila = await addDaughter('Leila');
    const renderer = await renderScreen();

    await act(async () => {
      const first = setActiveProfileId(leila.id);
      const second = setActiveProfileId('owner');
      const third = setActiveProfileId(leila.id);
      const fourth = setActiveProfileId('owner');
      await Promise.all([first, second, third, fourth]);
    });
    await flush();

    const texts = allTexts(renderer);
    expect(texts).toContain('23');
    expect(texts).not.toContain('No statistics yet');
  });

  it('while the new profile’s data is still loading, nothing of the previous profile is visible', async () => {
    await recordTwoPeriods();
    const leila = await addDaughter('Leila');
    const renderer = await renderScreen();
    expect(allTexts(renderer)).toContain('23');

    // hold every read of the daughter's own storage so her data is genuinely still loading
    const getItem = AsyncStorage.getItem as jest.Mock;
    const original = getItem.getMockImplementation() as (key: string) => Promise<string | null>;
    let release: () => void = () => undefined;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    getItem.mockImplementation((key: string) => (key.includes(':profile:') ? gate.then(() => original(key)) : original(key)));
    try {
      await act(async () => {
        setActiveProfileId(leila.id).catch(() => undefined);
      });
      await flush();
      const duringLoad = allTexts(renderer);
      expect(duringLoad).not.toContain('23');
      expect(duringLoad).not.toContain('Average period: 4 days');
      expect(duringLoad).not.toContain('No statistics yet');
    } finally {
      release();
      getItem.mockImplementation(original);
    }
    await flush();
  });

  it('deleting a recorded period removes it from the statistics', async () => {
    await recordTwoPeriods();
    const renderer = await renderScreen();
    expect(allTexts(renderer)).toContain('23');

    await act(async () => {
      await removeConfirmedPeriodOccurrence(at(7, 28));
    });
    await flush();
    const texts = allTexts(renderer);
    expect(texts).not.toContain('23');
    expect(texts).toContain('Not enough cycles recorded yet');
  });

  it('a backup restore (profile data reloaded) shows the restored statistics', async () => {
    const renderer = await renderScreen();
    expect(allTexts(renderer)).toContain('No statistics yet');

    await act(async () => {
      await recordTwoPeriods();
    });
    // what a restore does: rewrite storage behind the stores' backs, then announce it
    await act(async () => {
      reloadActiveProfileData();
    });
    await flush();
    expect(allTexts(renderer)).toContain('23');
  });

  it.each([
    ['fr', 'Pas encore de statistiques', 'Vos statistiques apparaîtront lorsque vous commencerez à enregistrer vos données.'],
    ['es', 'Aún no hay estadísticas', 'Tus estadísticas aparecerán cuando empieces a registrar tus datos.'],
    ['it', 'Ancora nessuna statistica', 'Le tue statistiche appariranno quando inizierai a registrare i tuoi dati.'],
    ['en', 'No statistics yet', 'Your statistics will appear once you start recording your data.'],
  ] as const)('renders the empty state in %s', async (language, title, detail) => {
    await setAppLanguage(language);
    const texts = allTexts(await renderScreen());
    expect(texts).toContain(title);
    expect(texts).toContain(detail);
  });

  it('translates the new real-data cards in French', async () => {
    await setAppLanguage('fr');
    await recordTwoPeriods();
    await saveJournalSection('2026-09-20', 'mood', mood('good'));
    const texts = allTexts(await renderScreen());
    expect(texts).toContain('Régularité du cycle');
    expect(texts).toContain('Cycle le plus court : 23 jours');
    expect(texts).toContain('Règles en moyenne : 4 jours');
    expect(texts).toContain('Humeur');
  });

  it('renders in dark mode too', async () => {
    await setAppearanceMode('dark');
    await recordTwoPeriods();
    const texts = allTexts(await renderScreen());
    expect(texts).toContain('23');
    expect(texts).toContain('Cycle regularity');
  });

  it('other objectives do not get the cycle statistics', async () => {
    await recordTwoPeriods();
    await setActiveObjective('conceive');
    const texts = allTexts(
      await renderScreen(<ObjectiveAwareStatisticsScreen navigation={{} as never} route={{key: 'test', name: 'Statistics'} as never} />),
    );
    expect(texts).not.toContain('Cycle regularity');
    expect(texts).not.toContain('Average period: 4 days');
    await act(async () => {
      await setActiveObjective('cycle');
    });
  });
});
