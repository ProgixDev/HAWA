import {syncCycleReminders} from '../cycleReminderScheduling';
import {nextDailyFireDate} from '../pregnancyReminderScheduling';
import {__resetNotificationServiceForTests} from '../../services/pregnancyNotifications';
import {
  getActiveObjective,
  getCyclePreferences,
  getCycleObservationStartedAt,
  getRecordedPeriodHistory,
} from '../../state/onboardingPreferences';
import {getCycleReminderPreferences} from '../../state/cycleReminderPreferences';
import {deliverTrigger, displayedIds, fakeNotifeeState, resetFakeNotifee} from '../../testUtils/fakeNotifee';

// "Daily Journal" reminder: first occurrence today vs tomorrow, and the proof that its time is the PHONE's local
// time — never UTC, never a fixed zone such as London (the map's default location has nothing to do with it).
//
// Real Cycle scheduler + real notification service + a stateful fake notifee; the stores are mocked the same way
// cycleReminderScheduling.test.ts does. This proves the JavaScript's timestamps and decisions; it cannot prove that
// a physical Android phone delivers the notification.
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

const DAILY_JOURNAL_ID = 'cycle-daily-journal-reminder:owner';

// Sat 10 Oct 2026 at the given LOCAL time. Built with the local constructor on purpose: whatever timezone the
// machine running the tests is in, "20:26 local" is the same wall-clock moment for the code under test.
const at = (hours: number, minutes: number, seconds = 0, dayOffset = 0) =>
  new Date(2026, 9, 10 + dayOffset, hours, minutes, seconds, 0);

const PREFS = {
  upcomingPeriodEnabled: false,
  upcomingPeriodDaysBefore: 2 as const,
  periodStartCheckEnabled: false,
  dailyJournalEnabled: true,
  dailyJournalTime: '20:36',
  fertileWindowEnabled: false,
  ovulationEnabled: false,
};

beforeEach(() => {
  jest.useFakeTimers();
  resetFakeNotifee();
  __resetNotificationServiceForTests();
  (getActiveObjective as jest.Mock).mockReturnValue('cycle');
  (getCycleObservationStartedAt as jest.Mock).mockReturnValue(null);
  (getRecordedPeriodHistory as jest.Mock).mockReturnValue([]);
  (getCyclePreferences as jest.Mock).mockReturnValue({
    lastPeriodStart: new Date('2026-09-20T12:00:00'),
    cycleDuration: 28,
    periodDuration: 5,
    regularity: 'yes',
  });
  (getCycleReminderPreferences as jest.Mock).mockReturnValue({...PREFS});
});

afterEach(() => {
  jest.useRealTimers();
});

describe('nextDailyFireDate — the first occurrence of an "HH:mm" reminder', () => {
  it('is TODAY when the time is still ahead', () => {
    expect(nextDailyFireDate('20:36', at(20, 26))).toEqual(at(20, 36));
    expect(nextDailyFireDate('20:36', at(0, 0))).toEqual(at(20, 36));
    expect(nextDailyFireDate('20:36', at(20, 35, 59))).toEqual(at(20, 36));
  });

  it('is TOMORROW once the time has been reached or passed (strictly after "now")', () => {
    expect(nextDailyFireDate('20:36', at(20, 36))).toEqual(at(20, 36, 0, 1));
    expect(nextDailyFireDate('20:36', at(20, 40))).toEqual(at(20, 36, 0, 1));
    expect(nextDailyFireDate('20:36', at(23, 59))).toEqual(at(20, 36, 0, 1));
  });

  it('rolls over month and year boundaries', () => {
    expect(nextDailyFireDate('20:36', new Date(2026, 9, 31, 21, 0))).toEqual(new Date(2026, 10, 1, 20, 36));
    expect(nextDailyFireDate('06:00', new Date(2026, 11, 31, 7, 0))).toEqual(new Date(2027, 0, 1, 6, 0));
  });

  it('is the phone\'s LOCAL wall-clock time: 20:36 means 20:36 on the phone, whatever UTC offset it has', () => {
    const fire = nextDailyFireDate('20:36', at(20, 26));

    // Local components are exactly what was asked for...
    expect(fire.getHours()).toBe(20);
    expect(fire.getMinutes()).toBe(36);
    // ...and the instant is the local constructor's, not a UTC-based or fixed-zone computation.
    expect(fire.getTime()).toBe(new Date(2026, 9, 10, 20, 36, 0, 0).getTime());
  });
});

describe('Daily Journal reminder through the real Cycle scheduler', () => {
  it('saved BEFORE 20:36: the first occurrence is today at 20:36, a native DAILY AlarmManager trigger', async () => {
    jest.setSystemTime(at(20, 26));

    await syncCycleReminders();

    const record = fakeNotifeeState.triggers.get(DAILY_JOURNAL_ID);
    expect(record).toBeDefined();
    expect(record!.trigger.timestamp).toBe(at(20, 36).getTime());
    expect(record!.trigger.repeatFrequency).toBe(1); // DAILY
    expect(record!.trigger.alarmManager).toEqual({type: 1}); // SET_AND_ALLOW_WHILE_IDLE
  });

  it('saved AFTER 20:36: the first occurrence is tomorrow at 20:36 (so nothing arrives tonight)', async () => {
    jest.setSystemTime(at(20, 40));

    await syncCycleReminders();

    expect(fakeNotifeeState.triggers.get(DAILY_JOURNAL_ID)!.trigger.timestamp).toBe(at(20, 36, 0, 1).getTime());
  });

  it('the day it fires: delivered, then the startup sync re-arms TOMORROW without dismissing today\'s', async () => {
    jest.setSystemTime(at(20, 26));
    await syncCycleReminders();

    // 20:36 — Android fires it; seconds later the app's JS starts and re-syncs.
    jest.setSystemTime(at(20, 36, 5));
    deliverTrigger(DAILY_JOURNAL_ID);
    await syncCycleReminders();

    expect(displayedIds()).toEqual([DAILY_JOURNAL_ID]);
    expect(fakeNotifeeState.triggers.get(DAILY_JOURNAL_ID)!.trigger.timestamp).toBe(at(20, 36, 0, 1).getTime());
  });

  it('not scheduled when the owner\'s active objective is not Cycle (the reminder belongs to that objective)', async () => {
    (getActiveObjective as jest.Mock).mockReturnValue('pregnancy');
    jest.setSystemTime(at(20, 26));

    await syncCycleReminders();

    expect(fakeNotifeeState.triggers.has(DAILY_JOURNAL_ID)).toBe(false);
  });

  it('not scheduled while the switch is off or no time was chosen', async () => {
    jest.setSystemTime(at(20, 26));

    (getCycleReminderPreferences as jest.Mock).mockReturnValue({...PREFS, dailyJournalEnabled: false});
    await syncCycleReminders();
    expect(fakeNotifeeState.triggers.has(DAILY_JOURNAL_ID)).toBe(false);

    (getCycleReminderPreferences as jest.Mock).mockReturnValue({...PREFS, dailyJournalTime: null});
    await syncCycleReminders();
    expect(fakeNotifeeState.triggers.has(DAILY_JOURNAL_ID)).toBe(false);
  });

  it('with notifications off nothing is scheduled — and it is scheduled by the next sync once they are on', async () => {
    jest.setSystemTime(at(20, 26));
    fakeNotifeeState.authorizationStatus = 0;
    await syncCycleReminders();
    expect(fakeNotifeeState.triggers.has(DAILY_JOURNAL_ID)).toBe(false);

    fakeNotifeeState.authorizationStatus = 1;
    await syncCycleReminders();

    expect(fakeNotifeeState.triggers.get(DAILY_JOURNAL_ID)!.trigger.timestamp).toBe(at(20, 36).getTime());
  });
});
