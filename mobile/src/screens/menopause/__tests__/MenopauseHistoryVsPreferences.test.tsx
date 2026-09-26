import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import MenopauseJournalEntryScreen from '../MenopauseJournalEntryScreen';
import MenopauseStatisticsScreen from '../MenopauseStatisticsScreen';
import MenopauseCalendarContent from '../../../components/menopause/MenopauseCalendarContent';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {
  setMenopauseHormonalTreatmentStatus,
  setMenopauseLabTracking,
  setMenopauseTrackedSymptoms,
  type MenopauseSymptom,
} from '../../../state/menopausePreferences';
import {addMenopauseLabResult, saveMenopauseJournalField} from '../../../state/menopauseJournalStore';

// M27 — changing the tracking PREFERENCES only steers what is offered for NEW
// tracking. What was genuinely recorded stays represented in the history views
// (Statistics, Calendar).

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

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderScreen(element: React.JSX.Element, journalCategory?: 'symptoms') {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                {journalCategory ? (
                  <>
                    <Stack.Screen name="Home">{() => <Text>home</Text>}</Stack.Screen>
                    <Stack.Screen initialParams={{category: journalCategory}} name="MenopauseJournalEntry">
                      {() => element}
                    </Stack.Screen>
                  </>
                ) : (
                  <Stack.Screen name="Test">{() => element}</Stack.Screen>
                )}
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  if (journalCategory) {
    await act(async () => {
      (navRef as unknown as {navigate: (name: string) => void}).navigate('MenopauseJournalEntry');
    });
  }
  await settle();
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf);

const symptomDays = (renderer: ReactTestRenderer.ReactTestRenderer, label: string): string | undefined => {
  const texts = textsOf(renderer);
  const index = texts.indexOf(label);
  return index >= 0 ? texts[index + 1] : undefined;
};

const pressDay = async (renderer: ReactTestRenderer.ReactTestRenderer, day: number) => {
  const cell = renderer.root.find(
    node =>
      typeof node.props.onPress === 'function' &&
      typeof node.props.accessibilityLabel === 'string' &&
      new RegExp(`^${day}(,|$)`).test(node.props.accessibilityLabel),
  );
  await act(async () => {
    cell.props.onPress();
  });
  await settle();
};

const SYMPTOM_LABELS: Record<MenopauseSymptom, string> = {
  hot_flashes: 'Bouffées de chaleur',
  night_sweats: 'Sueurs nocturnes',
  sleep_disturbances: 'Troubles du sommeil',
  fatigue: 'Fatigue',
  mood_changes: 'Variations d’humeur',
  brain_fog: 'Brouillard mental',
};
const offered = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  (Object.keys(SYMPTOM_LABELS) as MenopauseSymptom[]).filter(id => textsOf(renderer).includes(SYMPTOM_LABELS[id]));

beforeEach(async () => {
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 25, 12, 0, 0)});
  resetPremiumStateForTests();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('M27 — recorded history survives a change of tracking preferences', () => {
  beforeAll(async () => {
    // 1. the user tracks fatigue + hot flashes, treatment and FSH ...
    await setMenopauseTrackedSymptoms(['hot_flashes', 'fatigue']);
    await setMenopauseHormonalTreatmentStatus('track');
    await setMenopauseLabTracking('fsh');
    // 2. ... and records them
    await saveMenopauseJournalField('2026-09-20', 'symptoms', ['fatigue']);
    await saveMenopauseJournalField('2026-09-21', 'treatmentStatus', 'taken');
    await addMenopauseLabResult({type: 'fsh', value: 47, unit: 'UI/L', date: '2026-09-22'});
    // 3. ... then stops tracking all three.
    await setMenopauseTrackedSymptoms(['hot_flashes']);
    await setMenopauseHormonalTreatmentStatus('no');
    await setMenopauseLabTracking('none');
  });

  it('Statistics: the symptom that is no longer tracked is still counted from what was recorded', async () => {
    const renderer = await renderScreen(<MenopauseStatisticsScreen />);
    expect(symptomDays(renderer, 'Fatigue')).toBe('1 jour');
    expect(textsOf(renderer)).not.toContain('Pas encore assez de données');
  });

  it('Statistics: treatment and lab history stay represented although both trackings were switched off', async () => {
    const renderer = await renderScreen(<MenopauseStatisticsScreen />);
    const texts = textsOf(renderer);
    expect(texts).toContain('Traitement hormonal');
    expect(texts).toContain('Jours avec traitement pris');
    expect(texts).toContain('Historique des analyses');
    expect(texts).toContain('FSH — 1 résultat');
  });

  it('Calendar: the past day still shows its recorded symptom, treatment and lab result', async () => {
    const renderer = await renderScreen(<MenopauseCalendarContent />);
    // markers are present on the recorded days
    expect(renderer.root.findAll(node => node.props.accessibilityLabel === '20, suivi enregistré').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.accessibilityLabel === '21, suivi enregistré').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.accessibilityLabel === '22, suivi enregistré').length).toBeGreaterThan(0);

    await pressDay(renderer, 20);
    expect(textsOf(renderer)).toContain('1 enregistré');

    await pressDay(renderer, 21);
    expect(textsOf(renderer)).toContain('Pris aujourd’hui');

    await pressDay(renderer, 22);
    expect(textsOf(renderer).some(text => text.includes('FSH : 47 UI/L'))).toBe(true);
  });

  it('the NEW symptom form respects the disabled preference (only the still-tracked symptom is offered)', async () => {
    const renderer = await renderScreen(<MenopauseJournalEntryScreen />, 'symptoms');
    // fatigue is still recorded on 2026-09-20, but today's form only offers current preferences
    expect(offered(renderer)).toEqual(['hot_flashes']);
  });
});
