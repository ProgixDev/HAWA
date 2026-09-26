import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import MenopauseStatisticsScreen from '../MenopauseStatisticsScreen';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {
  setMenopauseHormonalTreatmentStatus,
  setMenopauseLabTracking,
  setMenopauseTrackedSymptoms,
} from '../../../state/menopausePreferences';
import {addMenopauseLabResult, saveMenopauseJournalField} from '../../../state/menopauseJournalStore';

// The Statistics screen stays mounted inside the tab navigator. It used to read
// the journal stores once (useMemo on the period only), so data recorded on
// another screen never showed up until a remount.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const nav = (name: string) =>
  (navRef as unknown as {navigate: (route: string) => void}).navigate(name);

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderStats() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Stats">{() => <MenopauseStatisticsScreen />}</Stack.Screen>
              <Stack.Screen name="Other">{() => <Text>other-tab</Text>}</Stack.Screen>
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

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

/** Overview tile / stat row: the value Text sits right before its label Text. */
const tile = (renderer: ReactTestRenderer.ReactTestRenderer, label: string): string | undefined => {
  const texts = textsOf(renderer);
  const index = texts.indexOf(label);
  return index > 0 ? texts[index - 1] : undefined;
};

/** "N jour(s)" next to a symptom label. */
const symptomDays = (renderer: ReactTestRenderer.ReactTestRenderer, label: string): string | undefined => {
  const texts = textsOf(renderer);
  const index = texts.indexOf(label);
  return index >= 0 ? texts[index + 1] : undefined;
};

beforeEach(async () => {
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 25, 11, 59, 0)});
  resetPremiumStateForTests();
  await setMenopauseTrackedSymptoms(['hot_flashes']);
  await setMenopauseHormonalTreatmentStatus('track');
  await setMenopauseLabTracking('fsh');
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

// Module-level stores persist for the whole file, so the scenarios build on
// each other, oldest state first.
describe('MenopauseStatisticsScreen — refreshes when new data is recorded', () => {
  it('H. initial numbers come from what is recorded', async () => {
    await saveMenopauseJournalField('2026-09-20', 'symptoms', ['hot_flashes']);
    await saveMenopauseJournalField('2026-09-20', 'sleepDurationHours', 6);
    await saveMenopauseJournalField('2026-09-20', 'treatmentStatus', 'taken');

    const renderer = await renderStats();
    expect(tile(renderer, 'Jours suivis')).toBe('1');
    expect(symptomDays(renderer, 'Bouffées de chaleur')).toBe('1 jour');
    expect(tile(renderer, 'Sommeil moyen')).toBe('6.0 h');
    expect(tile(renderer, 'Suivis traitement')).toBe('1');
  });

  it('H. while the screen stays mounted: a new symptom, sleep and treatment entry update the numbers', async () => {
    const renderer = await renderStats();
    expect(symptomDays(renderer, 'Bouffées de chaleur')).toBe('1 jour');

    await act(async () => {
      await saveMenopauseJournalField('2026-09-21', 'symptoms', ['hot_flashes']);
      await saveMenopauseJournalField('2026-09-21', 'sleepDurationHours', 8);
      await saveMenopauseJournalField('2026-09-21', 'treatmentStatus', 'not_taken');
    });
    await settle();

    expect(tile(renderer, 'Jours suivis')).toBe('2');
    expect(symptomDays(renderer, 'Bouffées de chaleur')).toBe('2 jours');
    expect(tile(renderer, 'Sommeil moyen')).toBe('7.0 h');
    expect(tile(renderer, 'Suivis traitement')).toBe('2');
  });

  it('H. mood and energy are refreshed too (not symptom-specific)', async () => {
    const renderer = await renderStats();
    expect(textsOf(renderer)).not.toContain('Énergie faible');

    await act(async () => {
      await saveMenopauseJournalField('2026-09-22', 'mood', 'good');
      await saveMenopauseJournalField('2026-09-22', 'energyLevel', 'high');
    });
    await settle();

    expect(tile(renderer, 'Jours suivis')).toBe('3');
    const texts = textsOf(renderer);
    // a mood row and an energy row now exist with a count of one day
    expect(texts.filter(text => text === '1 jour').length).toBeGreaterThanOrEqual(2);
  });

  it('H. RETURN TO THE SCREEN: data saved while another tab was focused is shown on focus, period selection kept', async () => {
    const renderer = await renderStats();
    await act(async () => {
      nav('Other');
    });
    await settle();
    expect(textsOf(renderer)).toContain('other-tab');

    // "the user goes to the journal and adds another hot-flash entry"
    await act(async () => {
      await saveMenopauseJournalField('2026-09-23', 'symptoms', ['hot_flashes']);
      await addMenopauseLabResult({type: 'fsh', value: 42, unit: 'UI/L', date: '2026-09-18'});
    });

    // native-stack: going back re-focuses the SAME mounted Stats screen
    await act(async () => {
      navRef.goBack();
    });
    await settle();

    expect(symptomDays(renderer, 'Bouffées de chaleur')).toBe('3 jours');
    expect(tile(renderer, 'Jours suivis')).toBe('4');
    expect(textsOf(renderer).some(text => text.includes('FSH — 1 résultat'))).toBe(true);
    // the free "1 mois" period is still the selected one
    expect(textsOf(renderer).some(text => text.includes('Résultats de 1 mois'))).toBe(true);
  });

  it('H. preferences edited elsewhere are picked up; turning treatment tracking off does NOT hide the recorded history (M27)', async () => {
    const renderer = await renderStats();
    expect(textsOf(renderer)).toContain('Traitement hormonal');

    await act(async () => {
      await setMenopauseHormonalTreatmentStatus('no');
    });
    await settle();

    // Two treatment days were genuinely recorded in the period: still represented.
    expect(textsOf(renderer)).toContain('Traitement hormonal');
    expect(tile(renderer, 'Suivis traitement')).toBe('2');

    await act(async () => {
      await setMenopauseHormonalTreatmentStatus('track');
    });
    await settle();
    // historical treatment entries are still counted once tracking is back on
    expect(tile(renderer, 'Suivis traitement')).toBe('2');
  });

  it('I. midnight (useToday) still moves the period window — independently of data changes', async () => {
    // Recorded on Aug 25 at noon: inside the 1-month window at 11:59 on Sept 25...
    await saveMenopauseJournalField('2026-08-25', 'symptoms', ['hot_flashes']);
    const renderer = await renderStats();
    expect(tile(renderer, 'Jours suivis')).toBe('5');

    // ...and outside it once the day has changed (the midnight timer fires).
    await act(async () => {
      jest.advanceTimersByTime(12 * 60 * 60 * 1000 + 60 * 1000);
    });
    await settle();
    expect(tile(renderer, 'Jours suivis')).toBe('4');
  });
});
