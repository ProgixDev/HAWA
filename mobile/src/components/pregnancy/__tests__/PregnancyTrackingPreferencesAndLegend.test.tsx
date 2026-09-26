import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, View} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import PregnancyDashboard from '../PregnancyDashboard';
import PregnancyCalendarContent from '../PregnancyCalendarContent';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {
  setPregnancyDating,
  setPregnancyTrackingPreferences,
  getPregnancyTrackingPreferences,
  type PregnancyTrackingPreference,
} from '../../../state/pregnancyPreferences';
import {deleteJournalSection, getJournalEntry, saveJournalSection} from '../../../state/dailyJournalStore';
import {
  getPregnancyJournalState,
  savePregnancySymptoms,
  savePregnancyWeight,
} from '../../../state/pregnancyJournalStore';
import {savePregnancyMedicalEvent} from '../../../state/pregnancyMedicalEventsStore';
import {addDays} from '../../../utils/cycleMath';

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const navigate = jest.fn();

async function renderScreen(element: React.JSX.Element) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">{() => element}</Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  for (let index = 0; index < 6; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  return renderer;
}

const renderDashboard = () =>
  renderScreen(<PregnancyDashboard navigation={{navigate} as never} route={{key: 'd', name: 'CycleHome'}} />);

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

const DAILY_LABELS = ['Symptômes', 'Poids', 'Humeur', 'Sommeil', 'Infos médicales'];
const dailyGrid = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  DAILY_LABELS.filter(label =>
    renderer.root.findAll(node => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function').length > 0,
  );

const todayKey = () => new Date().toLocaleDateString('en-CA');
const prefs = (...ids: PregnancyTrackingPreference[]) => new Set<PregnancyTrackingPreference>(ids);

beforeEach(async () => {
  resetPremiumStateForTests();
  navigate.mockClear();
  await setPregnancyDating({method: 'lastPeriod', date: addDays(new Date(), -70).toISOString()});
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('E — tracking preferences control the current Pregnancy tracking UI', () => {
  it('default (nothing changed by the user): every category is offered, as before', async () => {
    await setPregnancyTrackingPreferences(prefs('symptoms', 'mood', 'weight', 'sleep', 'hydration', 'activity', 'notes', 'medicalInfo', 'appointments'));
    const renderer = await renderDashboard();
    expect(dailyGrid(renderer)).toEqual(DAILY_LABELS);
    expect(textsOf(renderer)).toContain('0 / 5');
  });

  it('Symptoms + Weight + Sleep selected: only those three are offered and the counter follows', async () => {
    await setPregnancyTrackingPreferences(prefs('symptoms', 'weight', 'sleep'));
    const renderer = await renderDashboard();
    expect(dailyGrid(renderer)).toEqual(['Symptômes', 'Poids', 'Sommeil']);
    expect(textsOf(renderer)).toContain('0 / 3');
  });

  it('follows a preference edit while the Dashboard stays mounted', async () => {
    await setPregnancyTrackingPreferences(prefs('symptoms', 'weight', 'sleep'));
    const renderer = await renderDashboard();
    await act(async () => {
      await setPregnancyTrackingPreferences(prefs('mood'));
    });
    expect(dailyGrid(renderer)).toEqual(['Humeur']);
    expect(textsOf(renderer)).toContain('0 / 1');
  });

  it('a category that already holds an entry TODAY stays visible even if no longer tracked (recorded data is never hidden)', async () => {
    await saveJournalSection(todayKey(), 'mood', {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 3});
    await setPregnancyTrackingPreferences(prefs('symptoms', 'weight'));
    const renderer = await renderDashboard();
    expect(dailyGrid(renderer)).toEqual(['Symptômes', 'Poids', 'Humeur']);
    expect(textsOf(renderer)).toContain('1 / 3');
    await deleteJournalSection(todayKey(), 'mood'); // leave no state behind
  });

  it('nothing selected (only reachable through legacy data): a graceful empty state whose CTA opens the preferences in EDIT mode', async () => {
    await setPregnancyTrackingPreferences(prefs());
    const renderer = await renderDashboard();
    expect(dailyGrid(renderer)).toEqual([]); // never falls back to "all categories"
    expect(textsOf(renderer)).toContain('Choisir mes suivis');
    await act(async () => {
      renderer.root.find(node => node.props.accessibilityLabel === 'Choisir mes suivis').props.onPress();
    });
    expect(navigate).toHaveBeenCalledWith('PregnancyTrackingPreferences', {mode: 'edit'});
  });

  it('the journal sheet only offers the tracked categories (static guard on MainTabNavigator)', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../../navigation/MainTabNavigator.tsx'), 'utf8');
    expect(source).toMatch(/PREGNANCY_JOURNAL_ITEMS\.filter\(item => pregnancyTracking\.has\(item\.preferenceKey\)\)/);
    for (const key of ['symptoms', 'weight', 'mood', 'sleep', 'medicalInfo']) {
      expect(source).toContain(`preferenceKey: '${key}'`);
    }
  });
});

describe('F — historical data survives a preference change', () => {
  it('Mood recorded on a past day is still stored and readable after Mood is removed from the preferences', async () => {
    await setPregnancyTrackingPreferences(prefs('symptoms', 'weight', 'mood'));
    await saveJournalSection('2026-08-01', 'mood', {level: 'sad', energy: 2, stress: 4, irritability: 3, motivation: 1});
    await savePregnancyWeight({date: '2026-08-01', valueKg: 61.5, updatedAt: '2026-08-01T08:00:00.000Z'});
    await savePregnancySymptoms({date: '2026-08-01', symptoms: ['Nausées'], updatedAt: '2026-08-01T08:00:00.000Z'});

    await setPregnancyTrackingPreferences(prefs('symptoms', 'weight'));
    expect(getPregnancyTrackingPreferences().has('mood')).toBe(false);

    expect((await getJournalEntry('2026-08-01'))?.mood?.level).toBe('sad');
    const journal = await getPregnancyJournalState();
    expect(journal.weights.find(entry => entry.date === '2026-08-01')?.valueKg).toBe(61.5);
    expect(journal.symptoms.find(entry => entry.date === '2026-08-01')?.symptoms).toEqual(['Nausées']);
  });
});

describe('I — every Pregnancy Calendar legend item corresponds to a marker the calendar renders', () => {
  const COLORS = {appointment: '#6D4AE8', exam: '#A68BE8', note: '#2AA7A1'};

  const dotsWithColor = (renderer: ReactTestRenderer.ReactTestRenderer, color: string) =>
    renderer.root.findAllByType(View).filter(node => {
      const style = Object.assign({}, ...[node.props.style].flat(Infinity).filter(Boolean));
      return style.backgroundColor === color;
    }).length;

  it('legend = Rendez-vous / Examen / Suivi (+ Aujourd’hui) — no "Rappel", no "Note"', async () => {
    const renderer = await renderScreen(<PregnancyCalendarContent />);
    const texts = textsOf(renderer);
    expect(texts).toContain('Rendez-vous');
    expect(texts).toContain('Examen');
    expect(texts).toContain('Suivi');
    expect(texts).not.toContain('Note');
    expect(texts).not.toContain('Rappel');
  });

  it('each legend color is really drawn on a day cell when the matching data exists', async () => {
    const today = todayKey();
    await savePregnancyMedicalEvent({
      id: 'legend-appointment', type: 'appointment', date: today, title: 'Contrôle',
      createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
    });
    await savePregnancyMedicalEvent({
      id: 'legend-exam', type: 'exam', date: today, title: 'Échographie',
      createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
    });
    await savePregnancySymptoms({date: today, symptoms: ['Nausées'], updatedAt: new Date().toISOString()});

    const renderer = await renderScreen(<PregnancyCalendarContent />);
    for (const color of Object.values(COLORS)) {
      // one dot in the legend + at least one in a day cell
      expect(dotsWithColor(renderer, color)).toBeGreaterThanOrEqual(2);
    }
  });
});
