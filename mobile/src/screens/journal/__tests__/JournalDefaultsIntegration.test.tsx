import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StyleSheet, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import JournalMoodScreen from '../JournalMoodScreen';
import JournalSymptomsScreen from '../JournalSymptomsScreen';
import CalendarScreen from '../../CalendarScreen';
import PartnerHomeScreen from '../../awaADeux/partner/PartnerHomeScreen';
import {getAllJournalEntries, getJournalEntry} from '../../../state/dailyJournalStore';
import {setActiveObjective, setCyclePreferences} from '../../../state/onboardingPreferences';
import {setSharingToggle} from '../../../state/awaADeuxSharingStore';
import {resetAppLanguageForTests, setAppLanguage} from '../../../state/themePreferences';
import {calculateMoodDistribution, calculateSymptomFrequency, countTrackedDays} from '../../../utils/cycleStatisticsMath';
import {buildCycleExportDays} from '../../../services/medicalExportReaders';
import i18n from '../../../i18n';

// PHASE 4 — what a day that was NOT filled in looks like downstream, and what a deliberate entry looks like there. The real mood and symptoms
// screens write; the real calendar (month dots + the selected-day card, SelectedDayCard), the statistics maths, the medical export reader and the
// AWA à deux partner home read the same store. Nothing is mocked except the cycle maths of the partner home (as in PartnerHomePhaseAndCards).
// "Today" is Thu 15 Oct 2026, 15:00 local; only `Date` is faked.

jest.mock('../../../utils/awaADeuxPartnerCycleInfo', () => {
  const actual = jest.requireActual('../../../utils/awaADeuxPartnerCycleInfo');
  return {...actual, computePartnerCycleInfo: jest.fn()};
});
import {computePartnerCycleInfo} from '../../../utils/awaADeuxPartnerCycleInfo';

const PartnerHome = PartnerHomeScreen as unknown as React.ComponentType;
const NOW = new Date(2026, 9, 15, 15, 0, 0);
const TODAY = NOW.toLocaleDateString('en-CA');
const MOOD_DOT = '#E0A93E';
const NOTES_DOT = '#2C8E93';

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const renderers: ReactTestRenderer.ReactTestRenderer[] = [];

const settle = async () => {
  for (let index = 0; index < 30; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function mount(element: React.JSX.Element) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
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
  renderers.push(renderer);
  await settle();
  return renderer;
}
const leave = (renderer: ReactTestRenderer.ReactTestRenderer) => {
  act(() => renderer.unmount());
  renderers.splice(renderers.indexOf(renderer), 1);
};

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] => renderer.root.findAllByType(Text).map(textOf);
const pressables = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAll(node => typeof node.props.onPress === 'function');
const byLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const match = pressables(renderer).find(node => node.props.accessibilityLabel === label);
  if (!match) {throw new Error(`No pressable labelled "${label}"`);}
  return match;
};
const mood = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const match = pressables(renderer).find(node => node.props.accessibilityRole === 'radio' && node.findAllByType(Text).some(child => textOf(child) === label));
  if (!match) {throw new Error(`No mood "${label}"`);}
  return match;
};
const press = async (node: ReactTestRenderer.ReactTestInstance) => {
  await act(async () => {
    await node.props.onPress();
  });
  await settle();
};
// coloured dots (month grid + legend): the legend has exactly one of each colour
const dots = (renderer: ReactTestRenderer.ReactTestRenderer, color: string) =>
  renderer.root.findAll(node => typeof node.type === 'string' && StyleSheet.flatten(node.props.style)?.backgroundColor === color).length;

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);
const NOT_PROVIDED = () => t('calendar.dayCard.notProvided');
const SYMPTOMS_NONE = () => t('calendar.dayCard.rows.symptomsNone');

const openCalendar = () => mount(<CalendarScreen navigation={{navigate: jest.fn()} as never} route={{key: 'k', name: 'Calendar'} as never} />);
const countOf = (texts: string[], value: string) => texts.filter(text => text === value).length;

async function saveMood(label: string) {
  const screen = await mount(<JournalMoodScreen />);
  await press(mood(screen, label));
  await press(byLabel(screen, t('journalMood.saveMood')));
  leave(screen);
}
async function saveSymptoms(actions: (screen: ReactTestRenderer.ReactTestRenderer) => Promise<void>) {
  const screen = await mount(<JournalSymptomsScreen />);
  await actions(screen);
  await press(byLabel(screen, t('journalSymptoms.saveMySymptoms')));
  leave(screen);
}

beforeEach(async () => {
  jest.useFakeTimers({advanceTimers: true, now: NOW});
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  await setActiveObjective('cycle');
  await setCyclePreferences({lastPeriodStart: new Date(2026, 9, 5, 12, 0, 0), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
});

afterEach(() => {
  act(() => {
    renderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('a day that was not filled in', () => {
  it('opening both screens, trying to save, and leaving records nothing — in the store, the statistics, the export and the calendar', async () => {
    const baseline = await openCalendar();
    const baselineNotProvided = countOf(textsOf(baseline), NOT_PROVIDED());
    const baselineMoodDots = dots(baseline, MOOD_DOT);
    const baselineNoteDots = dots(baseline, NOTES_DOT);
    leave(baseline);

    const moodScreen = await mount(<JournalMoodScreen />);
    await press(byLabel(moodScreen, t('journalMood.saveMood')));
    const symptomsScreen = await mount(<JournalSymptomsScreen />);
    await press(byLabel(symptomsScreen, t('journalSymptoms.saveMySymptoms')));
    leave(moodScreen);
    leave(symptomsScreen);

    const entries = await getAllJournalEntries();
    expect(entries).toEqual([]);
    expect(calculateMoodDistribution(entries)).toEqual([]);
    expect(calculateSymptomFrequency(entries)).toEqual([]);
    expect(countTrackedDays(entries)).toBe(0);
    const exported = await buildCycleExportDays(['symptoms', 'mood'], 'all', NOW);
    expect(exported.days).toEqual([]);

    const calendar = await openCalendar();
    expect(countOf(textsOf(calendar), NOT_PROVIDED())).toBe(baselineNotProvided);
    expect(textsOf(calendar)).not.toContain(SYMPTOMS_NONE()); // "nothing declared" is not "no symptoms"
    expect(dots(calendar, MOOD_DOT)).toBe(baselineMoodDots);
    expect(dots(calendar, NOTES_DOT)).toBe(baselineNoteDots);
  });
});

describe('a deliberate entry', () => {
  it('shows up in the day card, the dots, the statistics and the export — with only what she chose', async () => {
    const empty = await openCalendar();
    const emptyNotProvided = countOf(textsOf(empty), NOT_PROVIDED());
    const emptyMoodDots = dots(empty, MOOD_DOT);
    const emptyNoteDots = dots(empty, NOTES_DOT);
    leave(empty);

    await saveMood('Triste');
    await saveSymptoms(async screen => {
      await press(byLabel(screen, 'Crampes'));
      await press(byLabel(screen, t('journalSymptoms.intensityAccessibility', {label: t('journalSymptoms.intensity.moderate.label'), description: t('journalSymptoms.intensity.moderate.description')})));
      await press(byLabel(screen, 'Dos'));
    });

    const entry = await getJournalEntry(TODAY);
    expect(entry?.mood?.level).toBe('sad');
    expect(entry?.symptoms).toEqual({names: ['Crampes'], severity: 'moderate', painLocation: 'Dos'});

    const entries = await getAllJournalEntries();
    expect(calculateMoodDistribution(entries)).toEqual([{level: 'sad', days: 1}]);
    expect(calculateSymptomFrequency(entries)).toEqual([{name: 'Crampes', days: 1}]);
    expect(countTrackedDays(entries)).toBe(1);

    const exported = await buildCycleExportDays(['symptoms', 'mood'], 'all', NOW);
    expect(exported.days).toHaveLength(1);
    const lines = exported.days[0].categories.flatMap(category => category.lines);
    expect(lines.some(line => line.includes('Crampes'))).toBe(true);
    expect(lines.some(line => line.includes(t('export.enums.severity.moderate')))).toBe(true);

    const calendar = await openCalendar();
    const texts = textsOf(calendar);
    expect(texts).toContain('Crampes');
    expect(texts).toContain('Triste');
    expect(countOf(texts, NOT_PROVIDED())).toBe(emptyNotProvided - 2);
    expect(dots(calendar, MOOD_DOT)).toBe(emptyMoodDots + 1);
    expect(dots(calendar, NOTES_DOT)).toBe(emptyNoteDots + 1);
  });

  it('"No symptoms" is shown as such (not as "not provided"), adds no symptoms dot, counts for no symptom, and exports no symptom line', async () => {
    const empty = await openCalendar();
    const emptyNotProvided = countOf(textsOf(empty), NOT_PROVIDED());
    const emptyNoteDots = dots(empty, NOTES_DOT);
    leave(empty);

    await saveSymptoms(async screen => {
      await press(byLabel(screen, t('journalSymptoms.noSymptoms')));
    });
    expect((await getJournalEntry(TODAY))?.symptoms).toEqual({names: []});

    const entries = await getAllJournalEntries();
    expect(calculateSymptomFrequency(entries)).toEqual([]);
    expect(countTrackedDays(entries)).toBe(1); // a declared day, honestly counted as one
    const exported = await buildCycleExportDays(['symptoms'], 'all', NOW);
    const symptomLines = exported.days.flatMap(day => day.categories.filter(category => category.category === 'symptoms').flatMap(category => category.lines));
    expect(symptomLines).toEqual([]);

    const calendar = await openCalendar();
    const texts = textsOf(calendar);
    expect(texts).toContain(SYMPTOMS_NONE());
    expect(countOf(texts, NOT_PROVIDED())).toBe(emptyNotProvided - 1); // only the symptoms row changed
    expect(dots(calendar, NOTES_DOT)).toBe(emptyNoteDots); // no "symptoms present" dot
  });
});

describe('AWA à deux: the partner home', () => {
  beforeEach(async () => {
    (computePartnerCycleInfo as jest.Mock).mockReturnValue({
      cycleDay: 11,
      cycleLength: 28,
      cycleProgress: 11 / 28,
      phase: 'follicular',
      nextPeriod: '02/11',
      nextPeriodDate: new Date(2026, 10, 2),
      fertileWindow: null,
      fertileWindowRange: null,
      ovulation: null,
      ovulationDate: null,
    });
    await setSharingToggle('cycleDay', true);
    await setSharingToggle('mood', true);
  });

  const moodChipShown = (renderer: ReactTestRenderer.ReactTestRenderer) => textsOf(renderer).includes(t('awaADeux.partnerSide.home.moodLabel'));

  it('an untouched mood screen shares nothing: no mood chip, even though the sharing switch is on', async () => {
    const moodScreen = await mount(<JournalMoodScreen />);
    await press(byLabel(moodScreen, t('journalMood.saveMood')));
    leave(moodScreen);
    expect(await getJournalEntry(TODAY)).toBeUndefined();
    const home = await mount(<PartnerHome />);
    expect(moodChipShown(home)).toBe(false);
  });

  it('a mood she chose and saved is shared (chip with its label); with the switch off it is not', async () => {
    await saveMood('Motivée');
    const shared = await mount(<PartnerHome />);
    expect(moodChipShown(shared)).toBe(true);
    expect(textsOf(shared)).toContain(t('cycleHome.mood.motivated'));
    leave(shared);

    await setSharingToggle('mood', false);
    const hidden = await mount(<PartnerHome />);
    expect(moodChipShown(hidden)).toBe(false);
  });

  it('symptoms are never part of what is shared with the partner, whatever was saved', async () => {
    await saveSymptoms(async screen => {
      await press(byLabel(screen, 'Migraines'));
    });
    const home = await mount(<PartnerHome />);
    expect(textsOf(home)).not.toContain('Migraines');
    expect(textsOf(home)).not.toContain(t('dailyJournal.symptoms'));
  });
});
