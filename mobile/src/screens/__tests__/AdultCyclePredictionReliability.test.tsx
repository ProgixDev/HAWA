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
import {isCurrentlyMenstruating} from '../../utils/menstruationStatus';
import {syncCycleReminders} from '../../utils/cycleReminderScheduling';
import {scheduleLocalNotification, cancelLocalNotification} from '../../services/pregnancyNotifications';
import {addPeriodOccurrence, getCyclePreferences, hydrateCyclePreferences, setCyclePreferences} from '../../state/onboardingPreferences';
import {setCycleReminderPreferences, resetCycleReminderPreferencesForTests} from '../../state/cycleReminderPreferences';
import {addManagedProfile, resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {OWNER_PROFILE_ID, resetActiveProfileForTests, setActiveProfileId} from '../../state/activeProfileStore';
import {profileScopedKey} from '../../state/profileScopedStorage';
import {setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';

jest.mock('../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn(),
  cancelLocalNotification: jest.fn(),
}));

// PHASE 7 — the OWNER's cycle starts from the same internal placeholder as a daughter's
// (period start = today - 5 days, 5-day period, 28-day cycle, regularity 'yes'). It must never be
// shown, painted or scheduled as if it were hers: no recorded period => neutral; periods but no
// real cycle length => recorded days only; real length (provided or measured) => predictions.
// Time pinned to Wed 16 Sep 2026.

const PINNED_NOW = new Date(2026, 8, 16, 12, 0, 0);
const sep = (day: number) => new Date(2026, 8, day, 12, 0, 0);
const range = (from: number, to: number) => Array.from({length: to - from + 1}, (_, index) => from + index);

const PERIOD_FILL = '#F7D7D6';
const FERTILE_FILL = '#DCEFE0';
const OVULATION_FILL = '#8B5CF6';
const PREDICTION_FILLS = [PERIOD_FILL, FERTILE_FILL, OVULATION_FILL];
const DOT = {period: '#DC7B82', fertile: '#3E8E56', ovulation: '#8B5CF6', mood: '#E0A93E', notes: '#2C8E93'};


const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const Stack = createNativeStackNavigator();
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const getItem = AsyncStorage.getItem as jest.Mock;
const originalGetItem = getItem.getMockImplementation() as (key: string) => Promise<string | null>;

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

// ---------------------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------------------

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


const at = (month: number, day: number, hour = 12) => new Date(2026, month - 1, day, hour, 0, 0);
const mockSchedule = scheduleLocalNotification as jest.Mock;
const mockCancel = cancelLocalNotification as jest.Mock;
const ALL_REMINDERS_ON = {
  upcomingPeriodEnabled: true,
  upcomingPeriodDaysBefore: 2 as const,
  periodStartCheckEnabled: true,
  dailyJournalEnabled: false,
  dailyJournalTime: null,
  fertileWindowEnabled: true,
  ovulationEnabled: true,
};
const dateReminders = () => mockSchedule.mock.calls.map(([arg]) => String(arg.id)).filter(id => /upcoming-period|period-start-check|fertile-window|ovulation/.test(id));
const ownerCycleKey = profileScopedKey('@hawa/cycle-preferences', OWNER_PROFILE_ID);
const hasRing = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => typeof node.props.currentDay === 'number' && typeof node.props.phase === 'string').length > 0;

/** A brand-new owner: nothing stored, nothing recorded — only the internal placeholder in memory. */
const freshOwner = async () => {
  await AsyncStorage.clear();
  await resetActiveProfileForTests();
  await hydrateCyclePreferences();
};

beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_NOW);
  getItem.mockImplementation(originalGetItem);
  mockSchedule.mockReset();
  mockSchedule.mockResolvedValue(true);
  mockCancel.mockReset();
  mockCancel.mockResolvedValue(undefined);
  await resetManagedProfilesForTests();
  resetCycleReminderPreferencesForTests();
  await freshOwner();
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

describe('adult with NO recorded period (placeholder settings only)', () => {
  it('Calendar: plain month, owner-voiced explanation, no cycle cards, no period editor', async () => {
    const calendar = await renderCalendar();
    expectPlainMonth(calendar, 30);
    expect(textsOf(calendar)).toContain(i18n.t('calendar.predictionsPendingFirstPeriodOwner'));
    expect(textsOf(calendar)).not.toContain(i18n.t('calendar.fertileWindowEstimated'));
    const edit = calendar.root.findAll(
      node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(text => text.props.children === i18n.t('calendar.dayCard.edit')),
    );
    expect(edit).toHaveLength(0);
    expect(hasLabel(calendar, 'Mes règles ont commencé ce jour')).toBe(true);
  });

  it('Home: neutral card, no ring, no overview tiles — and the "Mes règles ont commencé" button stays', async () => {
    const home = await renderHome();
    const texts = textsOf(home);
    expect(hasRing(home)).toBe(false);
    expect(texts).toContain(i18n.t('cycleHome.preFirstPeriod.title'));
    expect(texts).toContain(i18n.t('cycleHome.preFirstPeriod.subtitleOwner'));
    expect(texts).not.toContain(i18n.t('cycleHome.nextPeriodLabel'));
    expect(hasLabel(home, 'Mes règles ont commencé')).toBe(true);
  });

  it('Profile: no next-period date', async () => {
    const profile = await renderProfile();
    expect(profileStatValue(profile, i18n.t('cycleHome.nextPeriodLabel'))).toBe(i18n.t('cycleHome.notEstimable'));
  });

  it('purity status is never "menstruating", reminders are never scheduled', async () => {
    jest.setSystemTime(at(9, 3)); // the placeholder period would cover the 3rd
    await freshOwner();
    expect(isCurrentlyMenstruating(at(9, 3), getCyclePreferences(), null)).toBe(false);
    await setCycleReminderPreferences({...ALL_REMINDERS_ON});
    await syncCycleReminders();
    expect(dateReminders()).toEqual([]);
  });

  it.each(['en', 'es', 'it'] as const)('explains it in %s', async language => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
    const calendar = await renderCalendar();
    const note = i18n.getFixedT(language)('calendar.predictionsPendingFirstPeriodOwner');
    expect(note.length).toBeGreaterThan(20);
    expect(textsOf(calendar)).toContain(note);
    const home = await renderHome();
    expect(textsOf(home)).toContain(i18n.getFixedT(language)('cycleHome.preFirstPeriod.subtitleOwner'));
  });
});

describe('adult with one recorded period and no provided lengths', () => {
  beforeEach(() => {
    addPeriodOccurrence(sep(10));
  });

  it('Calendar: recorded days only, insufficient-data note', async () => {
    const calendar = await renderCalendar();
    expect(daysOfKind(calendar, 'period')).toEqual(range(10, 14));
    expect(daysOfKind(calendar, 'fertile')).toEqual([]);
    expect(daysOfKind(calendar, 'ovulation')).toEqual([]);
    expect(textsOf(calendar)).toContain(i18n.t('calendar.predictionsPendingMoreData'));
    expect(textsOf(calendar)).toContain(i18n.t('cycleHome.monthOfTotal', {month: 1, total: 3})); // next-period card: observing, not a date from 28 days
    await goToNextMonth(calendar);
    expectPlainMonth(calendar, 31);
  });

  it('Home: neutral day card instead of the 28-day ring; tiles say "not enough data", never "Cycle variable"', async () => {
    const home = await renderHome();
    const texts = textsOf(home);
    expect(hasRing(home)).toBe(false);
    expect(texts).toContain(i18n.t('calendar.dayCard.cycleDayBadge', {day: 7}));
    expect(texts).toContain(i18n.t('cycleHome.insufficientData'));
    expect(texts).not.toContain(i18n.t('cycleHome.variableCycle'));
  });

  it('Profile: predictions unavailable; purity only for her recorded days; no reminders', async () => {
    expect(profileStatValue(await renderProfile(), i18n.t('cycleHome.nextPeriodLabel'))).toBe(i18n.t('profile.predictionsUnavailable'));
    expect(isCurrentlyMenstruating(at(9, 12), getCyclePreferences(), null)).toBe(true);
    expect(isCurrentlyMenstruating(at(10, 9), getCyclePreferences(), null)).toBe(false); // Sep 10 + 28, from the placeholder
    jest.setSystemTime(at(10, 1));
    await setCycleReminderPreferences({...ALL_REMINDERS_ON});
    await syncCycleReminders();
    expect(dateReminders()).toEqual([]);
  });
});

describe('adult with real data keeps every prediction', () => {
  it('explicitly provided lengths (28-day regular cycle from Sep 10)', async () => {
    setCyclePreferences({lastPeriodStart: sep(10), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    const calendar = await renderCalendar();
    expect(daysOfKind(calendar, 'period')).toEqual(range(10, 14));
    expect(daysOfKind(calendar, 'fertile')).toEqual([...range(19, 23), 25]);
    expect(daysOfKind(calendar, 'ovulation')).toEqual([24]);
    expect(hasRing(await renderHome())).toBe(true);
    expect(profileStatValue(await renderProfile(), i18n.t('cycleHome.nextPeriodLabel'))).toMatch(/\d/);
  });

  it('a cycle measured from four recorded periods', async () => {
    setCyclePreferences({lastPeriodStart: new Date(2026, 5, 21, 12), periodDuration: 5, cycleDuration: 28, regularity: 'unknown'});
    addPeriodOccurrence(new Date(2026, 6, 19, 12));
    addPeriodOccurrence(new Date(2026, 7, 16, 12));
    addPeriodOccurrence(new Date(2026, 8, 13, 12));
    const calendar = await renderCalendar();
    expect(daysOfKind(calendar, 'ovulation')).toEqual([27]);
  });

  it('an irregular history keeps recorded days only', async () => {
    setCyclePreferences({lastPeriodStart: sep(10), periodDuration: 5, cycleDuration: 28, regularity: 'no'});
    const calendar = await renderCalendar();
    expect(daysOfKind(calendar, 'period')).toEqual(range(10, 14));
    expect(daysOfKind(calendar, 'fertile')).toEqual([]);
    expect(daysOfKind(calendar, 'ovulation')).toEqual([]);
  });

  it('reminders are scheduled from real data, and cancelled once the data is gone', async () => {
    jest.setSystemTime(at(10, 1));
    setCyclePreferences({lastPeriodStart: sep(10), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    await setCycleReminderPreferences({...ALL_REMINDERS_ON});
    await syncCycleReminders();
    expect(dateReminders().length).toBeGreaterThan(0);

    mockSchedule.mockClear();
    mockCancel.mockClear();
    await AsyncStorage.removeItem(ownerCycleKey); // her cycle data disappears
    await resetActiveProfileForTests(); // every store re-reads
    await hydrateCyclePreferences();
    await syncCycleReminders();
    expect(dateReminders()).toEqual([]);
    expect(mockCancel).toHaveBeenCalledWith('cycle-upcoming-period-reminder:owner');
  });
});

describe('cold start — no placeholder flash while her data is being read', () => {
  it('Calendar and Home show nothing predicted until the stored cycle has been read, then the real one', async () => {
    setCyclePreferences({lastPeriodStart: sep(10), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    await settle(); // persisted
    const release = holdReads(ownerCycleKey);
    await resetActiveProfileForTests(); // fresh start: memory is the placeholder, the read is pending

    const calendar = await renderCalendar();
    const home = await renderHome();
    expectPlainMonth(calendar, 30);
    expect(textsOf(calendar)).not.toContain(i18n.t('calendar.predictionsPendingFirstPeriodOwner')); // no claim while loading
    expect(hasRing(home)).toBe(false);
    expect(textsOf(home)).not.toContain(i18n.t('cycleHome.preFirstPeriod.title'));

    release(ownerCycleKey);
    await settle();
    expect(daysOfKind(calendar, 'ovulation')).toEqual([24]);
    expect(hasRing(home)).toBe(true);
  });
});

describe('adult <-> daughter', () => {
  it("a daughter's neutral state and the adult's predictions never bleed into each other", async () => {
    setCyclePreferences({lastPeriodStart: sep(10), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    const noor = await addManagedProfile({type: 'daughter', firstName: 'Noor', birthDate: '2014-05-01', hasHadFirstPeriod: false});
    const calendar = await renderCalendar();
    expect(daysOfKind(calendar, 'ovulation')).toEqual([24]);

    await act(async () => {
      await setActiveProfileId(noor.id);
    });
    await settle();
    expectPlainMonth(calendar, 30);
    expect(textsOf(calendar)).toContain(i18n.t('calendar.predictionsPendingFirstPeriod')); // daughter voice

    await act(async () => {
      await setActiveProfileId(OWNER_PROFILE_ID);
    });
    await settle();
    expect(daysOfKind(calendar, 'ovulation')).toEqual([24]);
  });
});
