import {syncConceptionReminders, CONCEPTION_REMINDER_NOTIFICATION_IDS} from '../conceptionReminderScheduling';
import {__resetNotificationServiceForTests} from '../../services/pregnancyNotifications';
import {
  getActiveObjective,
  getCyclePreferences,
  getCycleObservationStartedAt,
  getHasConfirmedCycleData,
  getRecordedPeriodHistory,
} from '../../state/onboardingPreferences';
import {getConceptionPreferences} from '../../state/conceptionPreferences';
import {deliverTrigger, displayedIds, fakeNotifeeState, resetFakeNotifee} from '../../testUtils/fakeNotifee';

// TTC CYCLE-DAY REMINDERS ON THE DAY THEY ARE DUE (audit finding F13, TTC part).
//
// upcomingDateForCycleDay() compares DATES, so on the day of the fertile window / ovulation / LH test it keeps
// answering "today" after the reminder's hour (08:00 / 08:00 / 09:00) has passed: the fire instant was then in the
// past, scheduling answered "past" and cleared the trigger, and the NEXT cycle's reminder stayed unarmed until some
// later sync. Real TTC scheduler + real notification service + a stateful fake notifee; the cycle/conception stores
// are mocked the way conceptionReminderScheduling.test.ts does. JavaScript timestamps only — not delivery on a phone.
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
  getHasConfirmedCycleData: jest.fn(),
  getRecordedPeriodHistory: jest.fn(),
  hydrateCyclePreferences: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../state/conceptionPreferences', () => ({
  getConceptionPreferences: jest.fn(),
}));

const IDS = CONCEPTION_REMINDER_NOTIFICATION_IDS;

const at = (month: number, day: number, hours = 0, minutes = 0, seconds = 0, ms = 0) =>
  new Date(2026, month - 1, day, hours, minutes, seconds, ms);

/** Declared regular 28-day cycle, last period started Tue 15 Sep 2026: ovulation day 15 = Tue 29 Sep, fertile start
 * day 10 = Thu 24 Sep, LH test day 13 = Sun 27 Sep. */
const regularFrom15Sep = () => ({
  lastPeriodStart: at(9, 15, 12),
  cycleDuration: 28,
  periodDuration: 5,
  regularity: 'yes' as const,
});

const timestampOf = (id: string): number | undefined => fakeNotifeeState.triggers.get(id)?.trigger.timestamp;

beforeEach(() => {
  jest.useFakeTimers();
  resetFakeNotifee();
  __resetNotificationServiceForTests();
  (getActiveObjective as jest.Mock).mockReturnValue('conceive');
  (getHasConfirmedCycleData as jest.Mock).mockReturnValue(true);
  (getCycleObservationStartedAt as jest.Mock).mockReturnValue(null);
  (getRecordedPeriodHistory as jest.Mock).mockReturnValue([]);
  (getCyclePreferences as jest.Mock).mockReturnValue(regularFrom15Sep());
  (getConceptionPreferences as jest.Mock).mockReturnValue({
    reminders: {temperature: false, daily_journal: false, fertile_window: true, estimated_ovulation: true, lh_test: true},
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('syncConceptionReminders — the day of each cycle-day reminder', () => {
  it('before their day: all three are armed for this cycle', async () => {
    jest.setSystemTime(at(9, 20, 10));
    await syncConceptionReminders();

    expect(timestampOf(IDS.fertile_window)).toBe(at(9, 24, 8).getTime());
    expect(timestampOf(IDS.lh_test)).toBe(at(9, 27, 9).getTime());
    expect(timestampOf(IDS.estimated_ovulation)).toBe(at(9, 29, 8).getTime());
  });

  it('ovulation day: before 08:00 armed for today, from 08:00 on the NEXT cycle is armed at once', async () => {
    jest.setSystemTime(at(9, 29, 7, 30));
    await syncConceptionReminders();
    expect(timestampOf(IDS.estimated_ovulation)).toBe(at(9, 29, 8).getTime());

    jest.setSystemTime(at(9, 29, 8, 30));
    await syncConceptionReminders();
    expect(timestampOf(IDS.estimated_ovulation)).toBe(at(10, 27, 8).getTime()); // 29 Sep + 28 days
  });

  it('LH-test day: before 09:00 armed for today, after it the next cycle', async () => {
    jest.setSystemTime(at(9, 27, 8, 59, 59));
    await syncConceptionReminders();
    expect(timestampOf(IDS.lh_test)).toBe(at(9, 27, 9).getTime());

    jest.setSystemTime(at(9, 27, 9, 0, 1));
    await syncConceptionReminders();
    expect(timestampOf(IDS.lh_test)).toBe(at(10, 25, 9).getTime());
  });

  it('fertile-window day: before 08:00 armed for today, after it the next cycle', async () => {
    jest.setSystemTime(at(9, 24, 7, 59));
    await syncConceptionReminders();
    expect(timestampOf(IDS.fertile_window)).toBe(at(9, 24, 8).getTime());

    jest.setSystemTime(at(9, 24, 8, 1));
    await syncConceptionReminders();
    expect(timestampOf(IDS.fertile_window)).toBe(at(10, 22, 8).getTime());
  });

  it('exactly at the reminder instant it is no longer ahead: the next cycle', async () => {
    jest.setSystemTime(at(9, 29, 8, 0, 0, 0));
    await syncConceptionReminders();
    expect(timestampOf(IDS.estimated_ovulation)).toBe(at(10, 27, 8).getTime());
  });

  it('well after all three (the ovulation day, noon): every one points at the next cycle, none is missing', async () => {
    jest.setSystemTime(at(9, 29, 12));
    await syncConceptionReminders();

    expect(timestampOf(IDS.fertile_window)).toBe(at(10, 22, 8).getTime());
    expect(timestampOf(IDS.lh_test)).toBe(at(10, 25, 9).getTime());
    expect(timestampOf(IDS.estimated_ovulation)).toBe(at(10, 27, 8).getTime());
  });

  it('a delivered reminder stays on screen while the next cycle is armed under the same id', async () => {
    jest.setSystemTime(at(9, 29, 7, 30));
    await syncConceptionReminders();

    jest.setSystemTime(at(9, 29, 8, 0, 5)); // Android fires it; seconds later the app's JS starts and re-syncs
    deliverTrigger(IDS.estimated_ovulation);
    await syncConceptionReminders();

    expect(displayedIds()).toEqual([IDS.estimated_ovulation]);
    expect(timestampOf(IDS.estimated_ovulation)).toBe(at(10, 27, 8).getTime());
  });

  it('the dates themselves are the screens\' own: an observed 30-day pattern moves ovulation to day 17', async () => {
    const starts = ['2026-06-18', '2026-07-18', '2026-08-17', '2026-09-16'];
    (getRecordedPeriodHistory as jest.Mock).mockReturnValue(starts.map(startDate => ({id: startDate, startDate, endDate: startDate})));
    (getCycleObservationStartedAt as jest.Mock).mockReturnValue(at(6, 18, 12));
    (getCyclePreferences as jest.Mock).mockReturnValue({
      lastPeriodStart: at(9, 16, 12),
      cycleDuration: 28,
      periodDuration: 5,
      regularity: 'unknown',
    });

    jest.setSystemTime(at(10, 2, 7, 30)); // 16 Sep + 16 days
    await syncConceptionReminders();
    expect(timestampOf(IDS.estimated_ovulation)).toBe(at(10, 2, 8).getTime());

    jest.setSystemTime(at(10, 2, 8, 30));
    await syncConceptionReminders();
    expect(timestampOf(IDS.estimated_ovulation)).toBe(at(11, 1, 8).getTime()); // + the OBSERVED 30 days
  });
});
