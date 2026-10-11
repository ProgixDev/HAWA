import {syncCycleReminders} from '../cycleReminderScheduling';
import {__resetNotificationServiceForTests} from '../../services/pregnancyNotifications';
import {
  getActiveObjective,
  getCyclePreferences,
  getCycleObservationStartedAt,
  getRecordedPeriodHistory,
} from '../../state/onboardingPreferences';
import {getCycleReminderPreferences} from '../../state/cycleReminderPreferences';
import {deliverTrigger, displayedIds, fakeNotifeeState, resetFakeNotifee} from '../../testUtils/fakeNotifee';

// CYCLE REMINDERS ON THE DAY THEY ARE DUE (audit finding F13).
//
//   (a) the "have your periods started?" check is armed for the predicted day at 09:00. computeNextPeriod() answers
//       with the FOLLOWING cycle's date once the predicted day is today, so a sync run that day before 09:00 (app
//       start, any setting change) replaced today's armed check with one a whole cycle away;
//   (b) the fertile-window and ovulation reminders rolled forward by comparing DATES, so on their own day, after
//       their hour, the fire instant was in the past: scheduling answered "past" (and cleared the trigger) and the
//       next cycle was not armed until some later sync.
// Real Cycle scheduler + real notification service + a stateful fake notifee; the cycle stores are mocked the same
// way cycleReminderScheduling.test.ts does. It proves JavaScript timestamps and decisions only — not delivery on a
// phone. Synthetic data only.
jest.mock('@notifee/react-native', () => require('../../testUtils/fakeNotifee').notifeeModule);
jest.mock('../../state/securityPreferences', () => ({
  loadSecurityPreferences: jest.fn().mockResolvedValue(undefined),
  getPrivacySecuritySettings: jest.fn(() => ({
    discreetMode: false,
    discreetNotifications: false,
    hideNotificationPreview: false,
  })),
}));
jest.mock('../../state/onboardingPreferences', () => ({
  getActiveObjective: jest.fn(),
  // The sync waits for the active objective to have been READ before it gates on it.
  hydrateActiveObjective: jest.fn(() => Promise.resolve()),
  getCyclePreferences: jest.fn(),
  getCycleObservationStartedAt: jest.fn(),
  getHasConfirmedCycleData: jest.fn(() => true),
  getHasConfirmedCycleDuration: jest.fn(() => true),
  getRecordedPeriodHistory: jest.fn(),
  hydrateCyclePreferences: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../state/cycleReminderPreferences', () => ({
  getCycleReminderPreferences: jest.fn(),
  hydrateCycleReminderPreferences: jest.fn(() => Promise.resolve()),
}));

const CHECK_ID = 'cycle-period-start-check-reminder:owner';
const FERTILE_ID = 'cycle-fertile-window-reminder:owner';
const OVULATION_ID = 'cycle-ovulation-reminder:owner';

// All dates are built with the LOCAL constructor on purpose: whatever timezone runs the tests, "09:00" is 09:00.
const at = (month: number, day: number, hours = 0, minutes = 0, seconds = 0, ms = 0) =>
  new Date(2026, month - 1, day, hours, minutes, seconds, ms);

const OFF = {
  upcomingPeriodEnabled: false,
  upcomingPeriodDaysBefore: 2 as const,
  periodStartCheckEnabled: false,
  dailyJournalEnabled: false,
  dailyJournalTime: null,
  fertileWindowEnabled: false,
  ovulationEnabled: false,
};

/** A declared-regular 28-day cycle whose last recorded period started on 10 Sep 2026: predicted Thu 8 Oct 2026. */
const regular = (lastPeriodStart = at(9, 10, 12)) => ({
  lastPeriodStart,
  cycleDuration: 28,
  periodDuration: 5,
  regularity: 'yes' as const,
});

const timestampOf = (id: string): number | undefined => fakeNotifeeState.triggers.get(id)?.trigger.timestamp;

beforeEach(() => {
  jest.useFakeTimers();
  resetFakeNotifee();
  __resetNotificationServiceForTests();
  (getActiveObjective as jest.Mock).mockReturnValue('cycle');
  (getCycleObservationStartedAt as jest.Mock).mockReturnValue(null);
  (getRecordedPeriodHistory as jest.Mock).mockReturnValue([]);
  (getCyclePreferences as jest.Mock).mockReturnValue(regular());
  (getCycleReminderPreferences as jest.Mock).mockReturnValue({...OFF});
});

afterEach(() => {
  jest.useRealTimers();
});

describe('period-start check on the predicted day', () => {
  beforeEach(() => {
    (getCycleReminderPreferences as jest.Mock).mockReturnValue({...OFF, periodStartCheckEnabled: true});
  });

  it('the day before: armed for the predicted day at 09:00', async () => {
    jest.setSystemTime(at(10, 7, 10));
    await syncCycleReminders();
    expect(timestampOf(CHECK_ID)).toBe(at(10, 8, 9).getTime());
  });

  it('the predicted day BEFORE 09:00: today\'s check stays armed — it is not pushed a whole cycle away', async () => {
    jest.setSystemTime(at(10, 7, 10));
    await syncCycleReminders();

    jest.setSystemTime(at(10, 8, 8, 30)); // app start / any setting change on the predicted day
    await syncCycleReminders();

    expect(timestampOf(CHECK_ID)).toBe(at(10, 8, 9).getTime());
  });

  it('the predicted day with nothing armed yet (the app was not opened the day before): armed for today at 09:00', async () => {
    jest.setSystemTime(at(10, 8, 7, 15));
    await syncCycleReminders();
    expect(timestampOf(CHECK_ID)).toBe(at(10, 8, 9).getTime());
  });

  it('the last second before 09:00 is still "today"; at 09:00:00.000 it is the next cycle', async () => {
    jest.setSystemTime(at(10, 8, 8, 59, 59, 999));
    await syncCycleReminders();
    expect(timestampOf(CHECK_ID)).toBe(at(10, 8, 9).getTime());

    jest.setSystemTime(at(10, 8, 9, 0, 0, 0));
    await syncCycleReminders();
    expect(timestampOf(CHECK_ID)).toBe(at(11, 5, 9).getTime());
  });

  it('the predicted day AFTER the check was delivered: the next cycle is armed and the delivered one stays on screen', async () => {
    jest.setSystemTime(at(10, 8, 8, 30));
    await syncCycleReminders();

    jest.setSystemTime(at(10, 8, 9, 0, 5)); // Android fires it; seconds later the app's JS starts and re-syncs
    deliverTrigger(CHECK_ID);
    await syncCycleReminders();

    expect(displayedIds()).toEqual([CHECK_ID]);
    expect(timestampOf(CHECK_ID)).toBe(at(11, 5, 9).getTime());
  });

  it('the period was recorded on the predicted day before 09:00: nothing left to check today — the next cycle', async () => {
    jest.setSystemTime(at(10, 7, 10));
    await syncCycleReminders();
    expect(timestampOf(CHECK_ID)).toBe(at(10, 8, 9).getTime());

    jest.setSystemTime(at(10, 8, 8, 20));
    (getCyclePreferences as jest.Mock).mockReturnValue(regular(at(10, 8, 12))); // she confirmed that it started today
    await syncCycleReminders();

    expect(timestampOf(CHECK_ID)).toBe(at(11, 5, 9).getTime());
  });

  it('the day AFTER the predicted day, nothing recorded: the next cycle (never an "overdue" nag)', async () => {
    jest.setSystemTime(at(10, 9, 8));
    await syncCycleReminders();
    expect(timestampOf(CHECK_ID)).toBe(at(11, 5, 9).getTime());
  });

  it('a pattern observed from real history (regularity unknown, 30-day average) follows its OWN cycle length', async () => {
    const starts = ['2026-06-18', '2026-07-18', '2026-08-17', '2026-09-16'];
    (getRecordedPeriodHistory as jest.Mock).mockReturnValue(starts.map(startDate => ({id: startDate, startDate, endDate: startDate})));
    (getCycleObservationStartedAt as jest.Mock).mockReturnValue(at(6, 18, 12));
    (getCyclePreferences as jest.Mock).mockReturnValue({
      lastPeriodStart: at(9, 16, 12),
      cycleDuration: 28,
      periodDuration: 5,
      regularity: 'unknown',
    });

    jest.setSystemTime(at(10, 16, 8)); // predicted: 16 Sep + 30 days
    await syncCycleReminders();
    expect(timestampOf(CHECK_ID)).toBe(at(10, 16, 9).getTime());

    jest.setSystemTime(at(10, 16, 9, 30));
    await syncCycleReminders();
    expect(timestampOf(CHECK_ID)).toBe(at(11, 15, 9).getTime());
  });

  it('is never recurring: one trigger, no repeat', async () => {
    jest.setSystemTime(at(10, 8, 8));
    await syncCycleReminders();
    expect(fakeNotifeeState.triggers.get(CHECK_ID)?.trigger.repeatFrequency).toBeUndefined();
  });
});

describe('fertile-window and ovulation reminders on their own day', () => {
  // 10 Sep + 14 days = ovulation Thu 24 Sep; fertile window 19–25 Sep, announced 1 day ahead (18 Sep) at 09:00.
  beforeEach(() => {
    (getCycleReminderPreferences as jest.Mock).mockReturnValue({...OFF, fertileWindowEnabled: true, ovulationEnabled: true});
  });

  it('before their day: armed for this cycle', async () => {
    jest.setSystemTime(at(9, 12, 10));
    await syncCycleReminders();
    expect(timestampOf(FERTILE_ID)).toBe(at(9, 18, 9).getTime());
    expect(timestampOf(OVULATION_ID)).toBe(at(9, 24, 9).getTime());
  });

  it('ovulation day BEFORE 09:00: armed for today; AFTER 09:00: the next cycle is armed at once', async () => {
    jest.setSystemTime(at(9, 24, 8, 30));
    await syncCycleReminders();
    expect(timestampOf(OVULATION_ID)).toBe(at(9, 24, 9).getTime());

    jest.setSystemTime(at(9, 24, 9, 30));
    await syncCycleReminders();
    expect(timestampOf(OVULATION_ID)).toBe(at(10, 22, 9).getTime()); // 24 Sep + 28 days
  });

  it('the day the fertile-window notice is due: before 09:00 armed for today, after it the next cycle (not "nothing")', async () => {
    jest.setSystemTime(at(9, 18, 8, 30));
    await syncCycleReminders();
    expect(timestampOf(FERTILE_ID)).toBe(at(9, 18, 9).getTime());

    jest.setSystemTime(at(9, 18, 9, 30));
    await syncCycleReminders();
    expect(timestampOf(FERTILE_ID)).toBe(at(10, 16, 9).getTime()); // window of 17 Oct, announced the day before
  });

  it('inside the window and the day after ovulation: both point at the next cycle', async () => {
    jest.setSystemTime(at(9, 19, 12)); // first fertile day
    await syncCycleReminders();
    expect(timestampOf(FERTILE_ID)).toBe(at(10, 16, 9).getTime());
    expect(timestampOf(OVULATION_ID)).toBe(at(9, 24, 9).getTime()); // still ahead

    jest.setSystemTime(at(9, 25, 12)); // last fertile day: ovulation was yesterday
    await syncCycleReminders();
    expect(timestampOf(OVULATION_ID)).toBe(at(10, 22, 9).getTime());
  });

  it('the delivered reminder stays on screen while the next cycle is armed under the same id', async () => {
    jest.setSystemTime(at(9, 24, 8, 30));
    await syncCycleReminders();

    jest.setSystemTime(at(9, 24, 9, 0, 5));
    deliverTrigger(OVULATION_ID);
    await syncCycleReminders();

    expect(displayedIds()).toEqual([OVULATION_ID]);
    expect(timestampOf(OVULATION_ID)).toBe(at(10, 22, 9).getTime());
  });

  it('a reminder on its own day is a real, future trigger — never a "past" one that clears the id', async () => {
    jest.setSystemTime(at(9, 24, 15));
    await syncCycleReminders();

    expect(fakeNotifeeState.triggers.has(OVULATION_ID)).toBe(true);
    expect(timestampOf(OVULATION_ID)).toBeGreaterThan(Date.now());
  });
});
