import AsyncStorage from '@react-native-async-storage/async-storage';

import {isCurrentlyMenstruating} from '../menstruationStatus';
import {syncCycleReminders} from '../cycleReminderScheduling';
import {scheduleLocalNotification} from '../../services/pregnancyNotifications';
import {getCyclePreferences, hydrateCyclePreferences, setCyclePreferences} from '../../state/onboardingPreferences';
import {setCycleReminderPreferences, resetCycleReminderPreferencesForTests} from '../../state/cycleReminderPreferences';
import {addManagedProfile, resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {OWNER_PROFILE_ID, resetActiveProfileForTests, setActiveProfileId} from '../../state/activeProfileStore';
import {seedManagedProfileCycleIfNeeded} from '../../state/managedProfileCycleSeed';
import i18n from '../../i18n';
import {setAppLanguage} from '../../state/themePreferences';

// The two consumers of the cycle that act on a managed daughter OUTSIDE her screens:
//  - isCurrentlyMenstruating: the purity / prayer state ("is she menstruating right now?"),
//  - syncCycleReminders: the notifications scheduled for her.
// Neither may be fed by the internal PLACEHOLDER cycle (period start = today - 5 days, 5-day
// period, 28-day cycle, regularity 'yes') — it is not hers.

jest.mock('../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn(),
  cancelLocalNotification: jest.fn(),
}));

const mockSchedule = scheduleLocalNotification as jest.Mock;
const at = (month: number, day: number, hour = 12) => new Date(2026, month - 1, day, hour, 0, 0);

const ALL_REMINDERS_ON = {
  upcomingPeriodEnabled: true,
  upcomingPeriodDaysBefore: 2 as const,
  periodStartCheckEnabled: true,
  dailyJournalEnabled: false,
  dailyJournalTime: null,
  fertileWindowEnabled: true,
  ovulationEnabled: true,
};
const DATE_BASED = /upcoming-period|period-start-check|fertile-window|ovulation/;
const scheduledDateReminders = () => mockSchedule.mock.calls.map(([arg]) => String(arg.id)).filter(id => DATE_BASED.test(id));

const addDaughter = (extra: Partial<Parameters<typeof addManagedProfile>[0]> = {}) =>
  addManagedProfile({type: 'daughter', firstName: 'Noor', birthDate: '2013-01-01', hasHadFirstPeriod: false, ...extra});

beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(at(9, 16));
  mockSchedule.mockReset();
  mockSchedule.mockResolvedValue(true);
  await AsyncStorage.clear();
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  resetCycleReminderPreferencesForTests();
  await hydrateCyclePreferences();
  // The mother's own cycle: confirmed, period start Sep 1, 28-day, regular.
  setCyclePreferences({lastPeriodStart: at(9, 1), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  jest.useRealTimers();
});

describe('purity / prayer — isCurrentlyMenstruating', () => {
  it('a daughter with NO recorded period is never menstruating, even when the placeholder period happens to cover today (2nd-5th of the month)', async () => {
    jest.setSystemTime(at(9, 3)); // the placeholder period start is clamped to the 1st: Sep 1-5 "covers" Sep 3
    const noor = await addDaughter();
    await setActiveProfileId(noor.id);
    await hydrateCyclePreferences();

    expect(isCurrentlyMenstruating(at(9, 3), getCyclePreferences(), null)).toBe(false);
  });

  it('…nor on any other day of the month', async () => {
    const noor = await addDaughter();
    await setActiveProfileId(noor.id);
    await hydrateCyclePreferences();

    [at(9, 16), at(10, 8), at(10, 9)].forEach(day => expect(isCurrentlyMenstruating(day, getCyclePreferences(), null)).toBe(false));
  });

  it('a declared-regular cycle whose lengths nobody provided is not projected: her recorded days count, a wrapped "next period" does not', async () => {
    const hana = await addDaughter({hasHadFirstPeriod: true, lastPeriodDate: '2026-09-10', periodLength: null, cycleLength: null, regularity: 'yes'});
    await setActiveProfileId(hana.id);
    await seedManagedProfileCycleIfNeeded(hana.id);

    expect(isCurrentlyMenstruating(at(9, 12), getCyclePreferences(), null)).toBe(true); // inside the recorded period
    expect(isCurrentlyMenstruating(at(10, 9), getCyclePreferences(), null)).toBe(false); // Sep 10 + 28 days, projected from the placeholder
  });

  it('lengths the mother PROVIDED stay trusted, exactly like the owner’s own regular cycle', async () => {
    const lina = await addDaughter({hasHadFirstPeriod: true, lastPeriodDate: '2026-09-10', periodLength: 5, cycleLength: 28, regularity: 'yes'});
    await setActiveProfileId(lina.id);
    await seedManagedProfileCycleIfNeeded(lina.id);
    expect(isCurrentlyMenstruating(at(10, 9), getCyclePreferences(), null)).toBe(true);

    await setActiveProfileId(OWNER_PROFILE_ID);
    await hydrateCyclePreferences();
    expect(isCurrentlyMenstruating(at(9, 30), getCyclePreferences(), null)).toBe(true); // the owner’s projected Sep 29-Oct 3
    expect(isCurrentlyMenstruating(at(9, 3), getCyclePreferences(), null)).toBe(true); // …and her recorded Sep 1-5
  });
});

describe('notifications — syncCycleReminders', () => {
  it('schedules no date-based reminder for a daughter with no recorded period', async () => {
    const noor = await addDaughter();
    await setActiveProfileId(noor.id);
    await hydrateCyclePreferences();
    await setCycleReminderPreferences({...ALL_REMINDERS_ON});

    await syncCycleReminders();
    expect(scheduledDateReminders()).toEqual([]);
  });

  it('schedules none for a declared-regular cycle whose lengths nobody provided (no reminder from the placeholder 28 days)', async () => {
    jest.setSystemTime(at(10, 1)); // her placeholder cycle would predict Oct 8
    const hana = await addDaughter({hasHadFirstPeriod: true, lastPeriodDate: '2026-09-10', periodLength: null, cycleLength: null, regularity: 'yes'});
    await setActiveProfileId(hana.id);
    await seedManagedProfileCycleIfNeeded(hana.id);
    await setCycleReminderPreferences({...ALL_REMINDERS_ON});

    await syncCycleReminders();
    expect(scheduledDateReminders()).toEqual([]);
  });

  it('still schedules them from lengths the mother PROVIDED — and for the owner', async () => {
    jest.setSystemTime(at(10, 1));
    const lina = await addDaughter({hasHadFirstPeriod: true, lastPeriodDate: '2026-09-10', periodLength: 5, cycleLength: 28, regularity: 'yes'});
    await setActiveProfileId(lina.id);
    await seedManagedProfileCycleIfNeeded(lina.id);
    await setCycleReminderPreferences({...ALL_REMINDERS_ON});
    await syncCycleReminders();
    expect(scheduledDateReminders().length).toBeGreaterThan(0);

    mockSchedule.mockClear();
    await setActiveProfileId(OWNER_PROFILE_ID);
    await hydrateCyclePreferences();
    await setCycleReminderPreferences({...ALL_REMINDERS_ON});
    await syncCycleReminders();
    expect(scheduledDateReminders().length).toBeGreaterThan(0);
  });
});
