import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StyleSheet, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../navigation/JournalSheetContext';
import CalendarScreen from '../CalendarScreen';
import CycleHomeScreen from '../CycleHomeScreen';
import ProfileScreen from '../ProfileScreen';
import {DeleteTrackedDataScreen} from '../BackupUtilityScreens';
import {
  addPeriodOccurrence,
  correctPeriodOccurrence,
  getCyclePreferences,
  getHasConfirmedCycleDuration,
  hydrateCyclePreferences,
  setCyclePreferences,
  setSpiritualMarkersEnabled,
} from '../../state/onboardingPreferences';
import {addManagedProfile, getManagedProfiles, resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {OWNER_PROFILE_ID, resetActiveProfileForTests, setActiveProfileId} from '../../state/activeProfileStore';
import {recordManagedProfileFirstPeriod, seedManagedProfileCycleIfNeeded} from '../../state/managedProfileCycleSeed';
import {recordConfirmedPeriodEnd} from '../../state/confirmedPeriodHistoryStore';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {updatePersonalInformation} from '../../state/personalInformationStore';
import {profileScopedKey} from '../../state/profileScopedStorage';
import {setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';

// REGRESSION — a managed daughter who has NOT recorded a first period must see a plain
// calendar: no pink predicted-period days, no green fertile window, no purple ovulation
// day. Her cycle settings hold internal PLACEHOLDER values (period start = today - 5 days,
// 5-day period, 28-day cycle, regularity 'yes') that nobody entered; the month grid used to
// project them as if they were hers. The numbers in the titles map onto the bug report's
// scenario list.
//
// Time is pinned to Wed 16 Sep 2026 so every projected window falls inside the visible
// month. The mother's own cycle (period start Sep 1, 28-day, regular) is confirmed and is
// the "other profile" every daughter must never inherit.

const PINNED_NOW = new Date(2026, 8, 16, 12, 0, 0);
const sep = (day: number) => new Date(2026, 8, day, 12, 0, 0);
const range = (from: number, to: number) => Array.from({length: to - from + 1}, (_, index) => from + index);

const PERIOD_FILL = '#F7D7D6';
const FERTILE_FILL = '#DCEFE0';
const OVULATION_FILL = '#8B5CF6';
const PREDICTION_FILLS = [PERIOD_FILL, FERTILE_FILL, OVULATION_FILL];
const DOT = {period: '#DC7B82', fertile: '#3E8E56', ovulation: '#8B5CF6', mood: '#E0A93E', notes: '#2C8E93'};

const FR_FIRST_PERIOD_NOTE =
  'Les prévisions de cycle seront disponibles après l’enregistrement de ses premières règles, lorsque les données seront suffisantes.';

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const Stack = createNativeStackNavigator();
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const getItem = AsyncStorage.getItem as jest.Mock;
const originalGetItem = getItem.getMockImplementation() as (key: string) => Promise<string | null>;
const cycleKey = (profileId: string) => profileScopedKey('@hawa/cycle-preferences', profileId);

async function renderScreen(element: React.ReactElement) {
  const navigationRef = createNavigationContainerRef();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navigationRef}>
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
  await settle();
  return renderer;
}
const renderCalendar = () => renderScreen(<CalendarScreen navigation={{navigate: jest.fn()} as never} route={{key: 'c', name: 'Calendar'}} />);
const renderHome = () => renderScreen(<CycleHomeScreen navigation={{navigate: jest.fn()} as never} route={{key: 'h', name: 'CycleHome'}} />);
const renderProfile = () => renderScreen(<ProfileScreen navigation={{navigate: jest.fn()} as never} route={{key: 'p', name: 'Profile'}} />);
const renderDeleteScreen = () =>
  renderScreen(<DeleteTrackedDataScreen navigation={{goBack: jest.fn(), navigate: jest.fn()} as never} route={{key: 'd', name: 'DeleteTrackedData'} as never} />);

/** Lets every pending store read / async effect finish. */
const settle = async () => {
  await act(async () => {
    for (let index = 0; index < 30; index += 1) {
      await Promise.resolve();
    }
  });
};

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root
    .findAll(node => (node.type as unknown) === 'Text')
    .map(node => (Array.isArray(node.props.children) ? node.props.children.join('') : String(node.props.children)));

/** The value of a Profile StatCard (rendered as value, then label). */
const profileStatValue = (renderer: ReactTestRenderer.ReactTestRenderer, label: string): string | undefined => {
  const texts = textsOf(renderer);
  return texts[texts.indexOf(label) - 1];
};

const pressByLabel = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  await act(async () => {
    renderer.root.find(n => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function').props.onPress();
  });
  await settle();
};
const hasLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(n => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function').length > 0;
const pressByText = async (renderer: ReactTestRenderer.ReactTestRenderer, text: string) => {
  await act(async () => {
    renderer.root
      .find(n => typeof n.props.onPress === 'function' && n.findAllByType(Text).some(t => String(t.props.children).includes(text)))
      .props.onPress();
  });
  await settle();
};

// ---------------------------------------------------------------------------------------
// What the month grid ACTUALLY shows: the accessibility label (kind) AND the painted fill /
// dots of each day cell — the things a user sees.
// ---------------------------------------------------------------------------------------

type Cell = {day: number; kind: string; fill?: string; dots: string[]};

const readCells = (renderer: ReactTestRenderer.ReactTestRenderer): Cell[] => {
  const hosts = renderer.root.findAll(
    node =>
      typeof node.type === 'string' &&
      node.props.accessibilityRole === 'button' &&
      typeof node.props.accessibilityLabel === 'string' &&
      /^\d{1,2}, /.test(node.props.accessibilityLabel),
  );
  const byDay = new Map<number, Cell>();
  hosts.forEach(host => {
    const label = host.props.accessibilityLabel as string;
    const fill = (StyleSheet.flatten(host.props.style) as {backgroundColor?: string} | undefined)?.backgroundColor;
    const dots = host
      .findAll(node => (node.type as unknown) === 'View')
      .map(node => StyleSheet.flatten(node.props.style) as {width?: number; height?: number; backgroundColor?: string} | undefined)
      .filter(style => style?.width === 3.5 && style?.height === 3.5)
      .map(style => style?.backgroundColor as string);
    byDay.set(parseInt(label, 10), {day: parseInt(label, 10), kind: label.split(', ')[1], fill, dots});
  });
  return [...byDay.values()].sort((a, b) => a.day - b.day);
};

const kindLabel = (kind: 'period' | 'fertile' | 'ovulation' | 'normal') => i18n.t(`calendar.dayKind.${kind}`);
const daysOfKind = (renderer: ReactTestRenderer.ReactTestRenderer, kind: 'period' | 'fertile' | 'ovulation') =>
  readCells(renderer)
    .filter(cell => cell.kind === kindLabel(kind))
    .map(cell => cell.day);
const kindOfDay = (renderer: ReactTestRenderer.ReactTestRenderer, day: number) => readCells(renderer).find(cell => cell.day === day)?.kind;
const paintedPredictionDays = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  readCells(renderer)
    .filter(cell => cell.fill !== undefined && PREDICTION_FILLS.includes(cell.fill))
    .map(cell => cell.day);

/** A plain Gregorian month: nothing labelled, painted or dotted as a period / fertile day / ovulation. */
const expectPlainMonth = (renderer: ReactTestRenderer.ReactTestRenderer, daysInMonth = 30) => {
  const cells = readCells(renderer);
  expect(cells).toHaveLength(daysInMonth); // the calendar is still there, every day of it
  expect(daysOfKind(renderer, 'period')).toEqual([]);
  expect(daysOfKind(renderer, 'fertile')).toEqual([]);
  expect(daysOfKind(renderer, 'ovulation')).toEqual([]);
  expect(paintedPredictionDays(renderer)).toEqual([]);
  expect(cells.flatMap(cell => cell.dots).filter(dot => [DOT.period, DOT.fertile, DOT.ovulation].includes(dot))).toEqual([]);
};

const goToNextMonth = (renderer: ReactTestRenderer.ReactTestRenderer) => pressByLabel(renderer, i18n.t('calendar.nextMonth'));
const goToPreviousMonth = (renderer: ReactTestRenderer.ReactTestRenderer) => pressByLabel(renderer, i18n.t('calendar.previousMonth'));

// ---------------------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------------------

const addDaughter = (firstName: string, extra: Partial<Parameters<typeof addManagedProfile>[0]> = {}) =>
  addManagedProfile({type: 'daughter', firstName, birthDate: '2013-01-01', hasHadFirstPeriod: false, ...extra});

/** A daughter who recorded her first period on `start` — the real "Ses premières règles ont commencé" path. */
const addDaughterWithFirstPeriod = async (firstName: string, start: Date) => {
  const daughter = await addDaughter(firstName);
  await setActiveProfileId(daughter.id);
  await recordManagedProfileFirstPeriod(daughter.id, start);
  await setActiveProfileId(OWNER_PROFILE_ID);
  await hydrateCyclePreferences();
  return daughter;
};

/** Four period starts exactly 28 days apart (last one on Sep 13) → a regular cycle MEASURED from history. */
const recordRegularHistory = async (daughterId: string) => {
  await setActiveProfileId(daughterId);
  await recordManagedProfileFirstPeriod(daughterId, new Date(2026, 5, 21, 12));
  addPeriodOccurrence(new Date(2026, 6, 19, 12));
  addPeriodOccurrence(new Date(2026, 7, 16, 12));
  addPeriodOccurrence(new Date(2026, 8, 13, 12));
};

/** Starts a profile switch WITHOUT waiting for it: every listener has already run synchronously, the
 * async part (persisting the choice, reading the new profile's data) is left pending. */
const startSwitch = (profileId: string): void => {
  setActiveProfileId(profileId).catch(() => undefined);
};

/** `getItem` that holds every read of the given keys until released individually. */
const holdReads = (...keys: string[]) => {
  const releases = new Map<string, () => void>();
  getItem.mockImplementation((requested: string) => {
    if (!keys.includes(requested)) {
      return originalGetItem(requested);
    }
    const snapshot = originalGetItem(requested);
    return new Promise(resolve => {
      releases.set(requested, () => resolve(snapshot));
    });
  });
  return (key: string) => releases.get(key)?.();
};

beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_NOW);
  getItem.mockImplementation(originalGetItem);
  await AsyncStorage.clear();
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  await hydrateCyclePreferences();
  // The mother's own cycle: confirmed, period start Sep 1, 28-day, regular.
  setCyclePreferences({lastPeriodStart: sep(1), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  getItem.mockImplementation(originalGetItem);
  jest.useRealTimers();
});

// =======================================================================================
describe('(1) daughter with NO first period recorded', () => {
  it('paints no predicted period / fertile / ovulation day, stays navigable, and says why', async () => {
    const noor = await addDaughter('Noor');
    await setActiveProfileId(noor.id);
    const renderer = await renderCalendar();

    expectPlainMonth(renderer, 30);
    expect(textsOf(renderer)).toContain(FR_FIRST_PERIOD_NOTE);

    // Still a real, navigable calendar: October (31 days), then back to September.
    await goToNextMonth(renderer);
    expectPlainMonth(renderer, 31);
    await goToPreviousMonth(renderer);
    expectPlainMonth(renderer, 30);
  });

  it('offers no period editor seeded with the placeholder period — she records her first period instead', async () => {
    const noor = await addDaughter('Noor');
    await setActiveProfileId(noor.id);
    const renderer = await renderCalendar();

    // Nothing is recorded yet, so there is nothing to edit; "Modifier" would open an editor on the
    // placeholder period (today - 5 days, 5 days) and paint it as if it were hers.
    const editButtons = renderer.root.findAll(
      node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(text => text.props.children === i18n.t('calendar.dayCard.edit')),
    );
    expect(editButtons).toHaveLength(0);
    expect(hasLabel(renderer, 'Mes règles ont commencé ce jour')).toBe(true); // the sanctioned way in
    expect(textsOf(renderer)).not.toContain(i18n.t('calendar.editPeriodTitle'));
    expectPlainMonth(renderer, 30);
  });

  it('keeps the Home first-period call to action', async () => {
    const noor = await addDaughter('Noor');
    await setActiveProfileId(noor.id);
    const home = await renderHome();

    expect(textsOf(home)).toContain('Pas encore de règles enregistrées');
    expect(hasLabel(home, 'Ses premières règles ont commencé')).toBe(true);
    expect(hasLabel(home, 'Mes règles ont commencé')).toBe(false);
  });

  it('her Profile does not show a next period computed from the placeholder cycle either', async () => {
    const noor = await addDaughter('Noor');
    await setActiveProfileId(noor.id);
    const profile = await renderProfile();

    const nextPeriod = profileStatValue(profile, i18n.t('cycleHome.nextPeriodLabel'));
    expect(nextPeriod).toBe(i18n.t('cycleHome.notEstimable')); // not a date such as "9 octobre"
    expect(profileStatValue(profile, i18n.t('averageCycle.usualLabel'))).toBe(i18n.t('averageCycle.notProvided'));
  });

  it("the mother's Profile keeps her real next-period date", async () => {
    const profile = await renderProfile();

    const nextPeriod = profileStatValue(profile, i18n.t('cycleHome.nextPeriodLabel'));
    expect(nextPeriod).not.toBe(i18n.t('cycleHome.notEstimable'));
    expect(nextPeriod).toMatch(/\d/); // a formatted date: her Sep 1 cycle repeats on Sep 29
  });

  it.each(['en', 'es', 'it'] as const)('explains it in %s too', async language => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
    const noor = await addDaughter('Noor');
    await setActiveProfileId(noor.id);
    const renderer = await renderCalendar();

    const note = i18n.getFixedT(language)('calendar.predictionsPendingFirstPeriod');
    expect(note.length).toBeGreaterThan(20);
    expect(note).not.toBe(FR_FIRST_PERIOD_NOTE);
    expect(textsOf(renderer)).toContain(note);
    expectPlainMonth(renderer, 30);
  });
});

// =======================================================================================
describe('(2) daughter with no history but default cycle settings', () => {
  it('stored placeholder settings (5-day period, 28-day cycle, regular) and a placeholder history paint nothing', async () => {
    const noor = await addDaughter('Noor');
    // What her storage can hold without a single real period: fully populated settings, a
    // placeholder record dated "today - 5 days", and nothing confirmed.
    await AsyncStorage.setItem(
      cycleKey(noor.id),
      JSON.stringify({
        preferences: {lastPeriodStart: sep(11).toISOString(), periodDuration: 5, cycleDuration: 28, regularity: 'yes'},
        periodHistory: [{id: '2026-09-11', startDate: '2026-09-11', endDate: '2026-09-15'}],
        observationStartedAt: null,
        hasConfirmedCycleData: false,
        hasConfirmedCycleDuration: false,
      }),
    );
    await setActiveProfileId(noor.id);

    // Precondition: the settings really are populated — only the recorded history is empty.
    await hydrateCyclePreferences();
    expect(getCyclePreferences()).toMatchObject({periodDuration: 5, cycleDuration: 28, regularity: 'yes'});

    const renderer = await renderCalendar();
    expectPlainMonth(renderer, 30);
    expect(textsOf(renderer)).toContain(FR_FIRST_PERIOD_NOTE);
  });

  it("never lends her the mother's cycle", async () => {
    const noor = await addDaughter('Noor');
    await setActiveProfileId(noor.id);
    const renderer = await renderCalendar();

    // The mother's period start (Sep 1), her projected ovulation (Sep 15) and her next period (Sep 29).
    [2, 12, 15, 29].forEach(day => expect(kindOfDay(renderer, day)).toBe(kindLabel('normal')));
  });
});

// =======================================================================================
describe('(3) first period recorded, history insufficient', () => {
  it('recorded from the Calendar: only her recorded days are painted — nothing is projected', async () => {
    const noor = await addDaughter('Noor');
    await setActiveProfileId(noor.id);
    const renderer = await renderCalendar();

    await pressByLabel(renderer, 'Mes règles ont commencé ce jour');
    await pressByText(renderer, 'Oui, aujourd');

    expect(daysOfKind(renderer, 'period')).toEqual(range(16, 20)); // started today, the recorded 5 days
    expect(daysOfKind(renderer, 'fertile')).toEqual([]);
    expect(daysOfKind(renderer, 'ovulation')).toEqual([]);
    await goToNextMonth(renderer);
    expectPlainMonth(renderer, 31); // no projected next period either
  });

  it('one period in the past: the recorded days only, a "not enough data" message, honest prediction cards', async () => {
    const noor = await addDaughterWithFirstPeriod('Noor', sep(10));
    await setActiveProfileId(noor.id);
    const renderer = await renderCalendar();

    expect(daysOfKind(renderer, 'period')).toEqual(range(10, 14));
    expect(daysOfKind(renderer, 'fertile')).toEqual([]);
    expect(daysOfKind(renderer, 'ovulation')).toEqual([]);
    // Nothing of the mother's: her Sep 1-5 period, Sep 15 ovulation and Sep 29 next period.
    [2, 15, 29].forEach(day => expect(kindOfDay(renderer, day)).toBe(kindLabel('normal')));

    const texts = textsOf(renderer);
    expect(texts).toContain(i18n.t('calendar.predictionsPendingMoreData'));
    expect(texts).not.toContain(FR_FIRST_PERIOD_NOTE);
    expect(texts).toContain('Non estimable'); // fertile window + ovulation cards
    expect(texts).toContain('Mois 1 sur 3'); // next period: still observing
    expect(texts).not.toContain('28 jours');

    await goToNextMonth(renderer);
    expectPlainMonth(renderer, 31);
  });

  it('the selected-day card invents neither a period range nor a "variable cycle" claim', async () => {
    const noor = await addDaughterWithFirstPeriod('Noor', sep(10));
    await setActiveProfileId(noor.id);
    const renderer = await renderCalendar();

    // A day BEFORE her first recorded period: nothing was recorded there — no Début / Fin / Durée
    // projected backwards from the placeholder 28-day cycle.
    await pressByLabel(renderer, `5, ${kindLabel('normal')}`);
    let texts = textsOf(renderer);
    expect(texts).toContain(i18n.t('calendar.dayCard.periodUnrecorded'));
    expect(texts).not.toContain(i18n.t('calendar.dayCard.periodDurationLabel')); // the card's own Début / Fin / Durée block
    expect(texts).not.toContain(i18n.t('calendar.dayCard.phaseUnavailable.subtitle')); // "Cycle variable : pas de prévision précise"
    expect(texts).toContain(i18n.t('cycleHome.cycleObservation')); // the honest reason: still observing

    // A day INSIDE the recorded period: its real, recorded range.
    await pressByLabel(renderer, `12, ${kindLabel('period')}`);
    texts = textsOf(renderer);
    expect(texts).toContain(i18n.t('calendar.dayCard.periodDurationLabel'));
    expect(texts).not.toContain(i18n.t('calendar.dayCard.periodUnrecorded'));
  });

  it('even while she edits her period, the card derives no phase from the placeholder cycle', async () => {
    const noor = await addDaughterWithFirstPeriod('Noor', sep(10));
    await setActiveProfileId(noor.id);
    const renderer = await renderCalendar();

    await pressByText(renderer, i18n.t('calendar.dayCard.edit')); // the editor opens on her RECORDED period (Sep 10-14)
    expect(textsOf(renderer)).toContain(i18n.t('calendar.editPeriodTitle'));
    await pressByLabel(renderer, `20, ${kindLabel('normal')}`); // selects Sep 20 (adds it to the draft) …
    await pressByLabel(renderer, `20, ${kindLabel('normal')}`); // … and again (takes it out): selected, not in the draft

    // The selected-day card only (the Timeline below reuses words such as "Ovulation").
    const card = renderer.root.findAll(node => typeof node.props.onEditPeriod === 'function' && node.props.date instanceof Date)[0];
    const texts = card.findAll(node => (node.type as unknown) === 'Text').map(node => String(node.props.children));
    expect(texts).toContain(i18n.t('calendar.dayCard.phaseUnavailable.label')); // "Phase non estimée"
    ['menstruation', 'follicular', 'fertile', 'ovulation', 'luteal'].forEach(phase =>
      expect(texts).not.toContain(i18n.t(`calendar.dayCard.phase.${phase}.label`)),
    );
    expect(texts).toContain(i18n.t('calendar.dayCard.cycleDayBadge', {day: 11})); // a plain count since the draft's start, never wrapped
  });

  it.each([
    ['day 15 (the placeholder cycle would call it ovulation)', new Date(2026, 8, 2, 12), 15],
    ['day 12 (the placeholder cycle would call it the fertile window)', new Date(2026, 8, 5, 12), 12],
    ['day 24 (the placeholder cycle would call it luteal)', new Date(2026, 7, 24, 12), 24],
    ['day 3 (inside her recorded period)', new Date(2026, 8, 14, 12), 3],
  ] as const)('the Home hero is a neutral card — no ring, no phase, no fertility claim — %s', async (_name, start, day) => {
    const noor = await addDaughterWithFirstPeriod('Noor', start);
    await setActiveProfileId(noor.id);
    const home = await renderHome();
    const texts = textsOf(home);

    // HeroCycleCard (ring + phase + energy/mood chips) is not rendered at all.
    expect(home.root.findAll(node => typeof node.props.currentDay === 'number' && typeof node.props.phase === 'string')).toHaveLength(0);
    expect(texts).toContain(i18n.t('calendar.dayCard.cycleDayBadge', {day})); // only the plain day count
    expect(texts).toContain(i18n.t('calendar.predictionsPendingMoreData'));
    ['menstruation', 'follicular', 'fertile', 'ovulation', 'luteal'].forEach(phase => {
      expect(texts).not.toContain(i18n.t(`cycleHome.phase.${phase}.message`));
    });
    expect(hasLabel(home, 'Mes règles ont commencé')).toBe(day > 5); // the period CTA is untouched (hidden only while a recorded period is under way)
  });

  it('the Home hero keeps the real ring and phase once the cycle length is real (observed regular history)', async () => {
    const noor = await addDaughter('Noor');
    await recordRegularHistory(noor.id);
    const home = await renderHome();
    expect(home.root.findAll(node => typeof node.props.currentDay === 'number' && typeof node.props.phase === 'string').length).toBeGreaterThan(0);
  });

  it('one COMPLETED period (end confirmed): its recorded range only', async () => {
    const noor = await addDaughterWithFirstPeriod('Noor', sep(3));
    await setActiveProfileId(noor.id);
    await hydrateCyclePreferences();
    await correctPeriodOccurrence(sep(3), sep(3), sep(7));
    await recordConfirmedPeriodEnd(sep(3), sep(7));
    const renderer = await renderCalendar();

    expect(daysOfKind(renderer, 'period')).toEqual(range(3, 7));
    expect(daysOfKind(renderer, 'fertile')).toEqual([]);
    expect(daysOfKind(renderer, 'ovulation')).toEqual([]);
    expect(textsOf(renderer)).toContain(i18n.t('calendar.predictionsPendingMoreData'));
  });

  it('a declared-regular cycle whose lengths were never provided is NOT projected from the placeholder 28 days (Calendar and Home agree)', async () => {
    const hana = await addDaughter('Hana', {
      hasHadFirstPeriod: true,
      lastPeriodDate: '2026-09-10',
      periodLength: null,
      cycleLength: null,
      regularity: 'yes',
    });
    await setActiveProfileId(hana.id);
    await seedManagedProfileCycleIfNeeded(hana.id);
    // Precondition: the stored state IS the edge — regular, with durations nobody provided.
    expect(getCyclePreferences().regularity).toBe('yes');
    expect(getHasConfirmedCycleDuration()).toBe(false);

    const calendar = await renderCalendar();
    expect(daysOfKind(calendar, 'period')).toEqual(range(10, 14));
    expect(daysOfKind(calendar, 'fertile')).toEqual([]);
    expect(daysOfKind(calendar, 'ovulation')).toEqual([]);
    expect(textsOf(calendar)).toContain('Mois 1 sur 3');
    await goToNextMonth(calendar);
    expectPlainMonth(calendar, 31);

    const home = await renderHome();
    const homeTexts = textsOf(home);
    expect(homeTexts).toContain('Mois 1 sur 3');
    expect(homeTexts).toContain('Non estimable');
    expect(homeTexts.some(text => /^Dans \d+ jours?$/.test(text))).toBe(false); // no "next period in N days"

    const profile = await renderProfile();
    expect(profileStatValue(profile, i18n.t('cycleHome.nextPeriodLabel'))).toBe(i18n.t('profile.predictionsUnavailable')); // not a date computed from 28 days
  });
});

// =======================================================================================
describe('(4) sufficient confirmed history', () => {
  it('four periods 28 days apart: the MEASURED cycle is projected — fertile window and ovulation appear', async () => {
    const noor = await addDaughter('Noor');
    await recordRegularHistory(noor.id);
    const renderer = await renderCalendar();

    expect(daysOfKind(renderer, 'period')).toEqual(range(13, 17)); // the last recorded period
    expect(daysOfKind(renderer, 'fertile')).toEqual([...range(22, 26), 28]);
    expect(daysOfKind(renderer, 'ovulation')).toEqual([27]);
    expect(kindOfDay(renderer, 2)).toBe(kindLabel('normal')); // the mother's Sep 1 period is nowhere

    // The projection extends forward, and earlier months show only what was recorded.
    await goToPreviousMonth(renderer);
    expect(daysOfKind(renderer, 'period')).toEqual(range(16, 20));
    expect(daysOfKind(renderer, 'fertile')).toEqual([]);
    expect(daysOfKind(renderer, 'ovulation')).toEqual([]);
    expect(textsOf(renderer)).not.toContain(i18n.t('calendar.predictionsPendingMoreData'));
  });

  it('lengths the mother explicitly PROVIDED stay trusted (declared 28-day regular cycle from Sep 10)', async () => {
    const lina = await addDaughter('Lina', {
      hasHadFirstPeriod: true,
      lastPeriodDate: '2026-09-10',
      periodLength: 5,
      cycleLength: 28,
      regularity: 'yes',
    });
    await setActiveProfileId(lina.id);
    await seedManagedProfileCycleIfNeeded(lina.id);
    expect(getHasConfirmedCycleDuration()).toBe(true);
    const renderer = await renderCalendar();

    expect(daysOfKind(renderer, 'period')).toEqual(range(10, 14));
    expect(daysOfKind(renderer, 'fertile')).toEqual([...range(19, 23), 25]);
    expect(daysOfKind(renderer, 'ovulation')).toEqual([24]);
    expect(textsOf(renderer)).not.toContain(i18n.t('calendar.predictionsPendingMoreData'));
  });

  it('an irregular history keeps the existing recorded-periods-only behaviour', async () => {
    const noor = await addDaughter('Noor');
    await setActiveProfileId(noor.id);
    await recordManagedProfileFirstPeriod(noor.id, new Date(2026, 5, 1, 12));
    addPeriodOccurrence(new Date(2026, 6, 10, 12)); // gaps of 39, 24 and 36 days
    addPeriodOccurrence(new Date(2026, 7, 3, 12));
    addPeriodOccurrence(new Date(2026, 8, 8, 12));
    const renderer = await renderCalendar();

    expect(daysOfKind(renderer, 'period')).toEqual(range(8, 12));
    expect(daysOfKind(renderer, 'fertile')).toEqual([]);
    expect(daysOfKind(renderer, 'ovulation')).toEqual([]);
  });
});

// =======================================================================================
describe('(5) mother and daughter with different histories', () => {
  it("each profile's calendar carries only its own periods", async () => {
    const noor = await addDaughterWithFirstPeriod('Noor', sep(10));

    // The mother: her recorded period, her projected fertile window / ovulation, her next period.
    const mother = await renderCalendar();
    expect(daysOfKind(mother, 'period')).toEqual([...range(1, 5), 29, 30]);
    expect(daysOfKind(mother, 'fertile')).toEqual([...range(10, 14), 16]);
    expect(daysOfKind(mother, 'ovulation')).toEqual([15]);
    expect(textsOf(mother)).not.toContain(FR_FIRST_PERIOD_NOTE);
    expect(textsOf(mother)).not.toContain(i18n.t('calendar.predictionsPendingMoreData'));

    await act(async () => {
      await setActiveProfileId(noor.id);
    });
    await settle();
    expect(daysOfKind(mother, 'period')).toEqual(range(10, 14)); // the same screen, now hers
    expect(daysOfKind(mother, 'fertile')).toEqual([]);
    expect(daysOfKind(mother, 'ovulation')).toEqual([]);
  });
});

// =======================================================================================
describe('(6) switching between two daughter profiles', () => {
  it('re-decorates the open calendar with the NEW daughter only — periods and journal dots', async () => {
    const noor = await addDaughterWithFirstPeriod('Noor', sep(10));
    const lina = await addDaughterWithFirstPeriod('Lina', sep(3));
    const hana = await addDaughter('Hana'); // nothing recorded

    await setActiveProfileId(noor.id);
    await saveJournalSection('2026-09-12', 'mood', {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 3});
    const renderer = await renderCalendar();
    expect(daysOfKind(renderer, 'period')).toEqual(range(10, 14));
    expect(readCells(renderer).find(cell => cell.day === 12)?.dots).toContain(DOT.mood);

    const switchTo = async (id: string) => {
      await act(async () => {
        await setActiveProfileId(id);
      });
      await settle();
    };

    await switchTo(lina.id);
    expect(daysOfKind(renderer, 'period')).toEqual(range(3, 7));
    expect(readCells(renderer).flatMap(cell => cell.dots)).not.toContain(DOT.mood); // Noor's mood entry stays hers
    expect(textsOf(renderer)).toContain(i18n.t('calendar.predictionsPendingMoreData'));

    await switchTo(hana.id);
    expectPlainMonth(renderer, 30);
    expect(textsOf(renderer)).toContain(FR_FIRST_PERIOD_NOTE);

    await switchTo(noor.id);
    expect(daysOfKind(renderer, 'period')).toEqual(range(10, 14));
    expect(readCells(renderer).find(cell => cell.day === 12)?.dots).toContain(DOT.mood);
  });
});

// =======================================================================================
describe('(7) switching between mother and daughter', () => {
  it("the mother's projections come back unchanged after a visit to a daughter with no first period", async () => {
    const noor = await addDaughter('Noor');
    const renderer = await renderCalendar();
    const before = readCells(renderer);
    expect(daysOfKind(renderer, 'ovulation')).toEqual([15]);

    await act(async () => {
      await setActiveProfileId(noor.id);
    });
    await settle();
    expectPlainMonth(renderer, 30);

    await act(async () => {
      await setActiveProfileId(OWNER_PROFILE_ID);
    });
    await settle();
    expect(readCells(renderer)).toEqual(before);
    expect(textsOf(renderer)).not.toContain(FR_FIRST_PERIOD_NOTE);
  });
});

// =======================================================================================
describe('(8) async hydration races', () => {
  it("the previous profile's periods, journal dots and open period editor are gone the moment the profile changes — before her own data has loaded", async () => {
    const noor = await addDaughterWithFirstPeriod('Noor', sep(10));
    const hana = await addDaughter('Hana');
    await setActiveProfileId(noor.id);
    await saveJournalSection('2026-09-12', 'mood', {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 3});
    const renderer = await renderCalendar();
    expect(daysOfKind(renderer, 'period')).toEqual(range(10, 14));
    expect(readCells(renderer).find(cell => cell.day === 12)?.dots).toContain(DOT.mood);
    await pressByText(renderer, i18n.t('calendar.dayCard.edit')); // Noor opens the period editor
    expect(textsOf(renderer)).toContain(i18n.t('calendar.editPeriodTitle'));

    act(() => {
      startSwitch(hana.id); // not awaited: no read has had a chance to land
    });
    expectPlainMonth(renderer, 30); // checked synchronously, in the same tick as the switch
    expect(readCells(renderer).flatMap(cell => cell.dots)).not.toContain(DOT.mood); // Noor's journal dots
    expect(textsOf(renderer)).not.toContain(i18n.t('calendar.editPeriodTitle')); // Noor's editor session
    expect(textsOf(renderer)).not.toContain(FR_FIRST_PERIOD_NOTE); // her data is not loaded yet: no claim about it either

    await settle();
    expectPlainMonth(renderer, 30);
    expect(textsOf(renderer)).toContain(FR_FIRST_PERIOD_NOTE);
  });

  it("stays clean while the new profile's read is slow, whatever re-renders in the meantime", async () => {
    const noor = await addDaughterWithFirstPeriod('Noor', sep(10));
    const hana = await addDaughter('Hana');
    await setActiveProfileId(noor.id);
    const renderer = await renderCalendar();
    const release = holdReads(cycleKey(hana.id));

    await act(async () => {
      startSwitch(hana.id);
    });
    await goToNextMonth(renderer);
    await goToPreviousMonth(renderer);
    expectPlainMonth(renderer, 30);

    release(cycleKey(hana.id));
    await settle();
    expectPlainMonth(renderer, 30);
    expect(textsOf(renderer)).toContain(FR_FIRST_PERIOD_NOTE);
  });

  it('a stale read finishing AFTER a newer switch cannot repaint the previous daughter periods', async () => {
    const noor = await addDaughterWithFirstPeriod('Noor', sep(10));
    const hana = await addDaughter('Hana');
    const renderer = await renderCalendar(); // the mother's calendar is open
    const release = holdReads(cycleKey(noor.id), cycleKey(hana.id));

    await act(async () => {
      startSwitch(noor.id); // Noor's read starts …
      startSwitch(hana.id); // … Hana's second; Hana ends up active
    });
    await settle();

    release(cycleKey(hana.id));
    await settle();
    expectPlainMonth(renderer, 30);

    release(cycleKey(noor.id)); // the stale read lands last
    await settle();
    expectPlainMonth(renderer, 30);
    expect(kindOfDay(renderer, 12)).toBe(kindLabel('normal')); // Noor's Sep 10-14 period is not on Hana's calendar
    expect(textsOf(renderer)).toContain(FR_FIRST_PERIOD_NOTE);
  });
});

// =======================================================================================
describe('(9) deleting / resetting her period history', () => {
  it('"delete tracking data" clears her recorded periods and every prediction from the open Calendar', async () => {
    const noor = await addDaughter('Noor');
    await recordRegularHistory(noor.id);
    const calendar = await renderCalendar();
    expect(daysOfKind(calendar, 'ovulation')).toEqual([27]);
    expect(daysOfKind(calendar, 'period')).toEqual(range(13, 17));

    const confirmWord = i18n.t('backupUtility.delete.confirmWord');
    const deleteScreen = await renderDeleteScreen();
    await act(async () => {
      deleteScreen.root.findAll(node => node.props.placeholder === confirmWord && typeof node.props.onChangeText === 'function')[0].props.onChangeText(confirmWord);
    });
    await pressByText(deleteScreen, i18n.t('backupUtility.delete.deleteButton'));

    expect(await AsyncStorage.getItem(cycleKey(noor.id))).toBeNull(); // really gone from storage …
    expectPlainMonth(calendar, 30); // … and from the screen: recorded days and projections alike
    expect(textsOf(calendar)).toContain(FR_FIRST_PERIOD_NOTE);
    expect(getManagedProfiles().find(item => item.id === noor.id)).toMatchObject({firstName: 'Noor', hasHadFirstPeriod: false, lastPeriodDate: null}); // identity kept, seed forgotten
    expect(await AsyncStorage.getItem('@hawa/cycle-preferences')).not.toBeNull(); // the mother's data is untouched
  });
});

// =======================================================================================
describe('(10) Gregorian / Hijri / Dual display modes', () => {
  it.each(['gregorian', 'hijri', 'double'] as const)('%s mode: still a plain, complete calendar for a daughter with no first period', async mode => {
    setSpiritualMarkersEnabled(true);
    const noor = await addDaughter('Noor');
    await setActiveProfileId(noor.id);
    await updatePersonalInformation({calendar: mode});
    const renderer = await renderCalendar();

    expectPlainMonth(renderer, 30);
    // MonthCalendarCard is a memo() export, so it is found by the props the screen gives it.
    const monthCard = renderer.root.findAll(node => node.props.visibleMonth !== undefined && typeof node.props.resolveKind === 'function')[0];
    const grid = JSON.stringify(monthCard.findAll(node => (node.type as unknown) === 'Text').map(node => node.props.children));
    expect(/\b14[3-9]\d\b/.test(grid)).toBe(mode !== 'gregorian'); // the mode itself still works
    expect(textsOf(renderer)).toContain(FR_FIRST_PERIOD_NOTE);
  });

  it.each(['gregorian', 'hijri', 'double'] as const)('%s mode: a recorded period is painted, nothing else', async mode => {
    setSpiritualMarkersEnabled(true);
    const noor = await addDaughterWithFirstPeriod('Noor', sep(10));
    await setActiveProfileId(noor.id);
    await updatePersonalInformation({calendar: mode});
    const renderer = await renderCalendar();

    expect(daysOfKind(renderer, 'period')).toEqual(range(10, 14));
    expect(daysOfKind(renderer, 'fertile')).toEqual([]);
    expect(daysOfKind(renderer, 'ovulation')).toEqual([]);
  });
});

// =======================================================================================
describe('(11) real journal entries stay visible', () => {
  it('journal dots are kept for a daughter with no first period — and they never become period days', async () => {
    const noor = await addDaughter('Noor');
    await setActiveProfileId(noor.id);
    await saveJournalSection('2026-09-12', 'mood', {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 3});
    await saveJournalSection('2026-09-13', 'flow', {intensity: 'light'});
    await saveJournalSection('2026-09-14', 'hydration', {milliliters: 1500});
    const renderer = await renderCalendar();

    const cells = readCells(renderer);
    expect(cells.find(cell => cell.day === 12)?.dots).toContain(DOT.mood);
    expect(cells.find(cell => cell.day === 13)?.dots).toContain(DOT.period); // explicitly logged flow stays visible
    expect(cells.find(cell => cell.day === 14)?.dots).toContain(DOT.notes);
    // …but a logged flow is an entry, not a recorded period: nothing is labelled or painted as one.
    expect(daysOfKind(renderer, 'period')).toEqual([]);
    expect(paintedPredictionDays(renderer)).toEqual([]);
    expect(kindOfDay(renderer, 13)).toBe(kindLabel('normal'));
  });
});

// =======================================================================================
describe('(12) no fabricated period / fertility / ovulation marker anywhere on her calendar', () => {
  it('not in the previous, current or next month, nor in any card below the grid', async () => {
    const noor = await addDaughter('Noor');
    await setActiveProfileId(noor.id);
    const renderer = await renderCalendar();

    await goToPreviousMonth(renderer);
    expectPlainMonth(renderer, 31); // August
    await goToNextMonth(renderer);
    expectPlainMonth(renderer, 30); // September
    await goToNextMonth(renderer);
    expectPlainMonth(renderer, 31); // October

    const texts = textsOf(renderer);
    ['Fenêtre fertile (est.)', 'Ovulation (est.)', 'Prochaines règles (est.)', 'Durée habituelle'].forEach(label => expect(texts).not.toContain(label));
    expect(texts.some(text => /^Jour \d+ du cycle$/.test(text))).toBe(false);
    expect(texts.some(text => text.includes('Prochaines règles'))).toBe(false);
  });
});
