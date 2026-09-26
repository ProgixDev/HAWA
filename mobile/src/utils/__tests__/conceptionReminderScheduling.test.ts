import {syncConceptionReminders, CONCEPTION_REMINDER_NOTIFICATION_IDS} from '../conceptionReminderScheduling';
import {scheduleLocalNotification, cancelLocalNotification} from '../../services/pregnancyNotifications';
import {
  getActiveObjective,
  getCyclePreferences,
  getCycleObservationStartedAt,
  getHasConfirmedCycleData,
  getRecordedPeriodHistory,
} from '../../state/onboardingPreferences';
import {getConceptionPreferences} from '../../state/conceptionPreferences';

// M10 — TTC cycle-day reminders (fertile window / estimated ovulation / LH
// test) use the SAME cycle length the TTC Dashboard uses for its phase: the
// OBSERVED average when computeCyclePredictionStatus is 'exact', the declared
// cycleDuration otherwise, and never fire before the cycle is confirmed.
jest.mock('../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn(),
  cancelLocalNotification: jest.fn(),
}));
jest.mock('../../state/onboardingPreferences', () => ({
  getActiveObjective: jest.fn(),
  getCyclePreferences: jest.fn(),
  getCycleObservationStartedAt: jest.fn(),
  getHasConfirmedCycleData: jest.fn(),
  getRecordedPeriodHistory: jest.fn(),
}));
jest.mock('../../state/conceptionPreferences', () => ({
  getConceptionPreferences: jest.fn(),
}));

const mockSchedule = scheduleLocalNotification as jest.Mock;
const mockCancel = cancelLocalNotification as jest.Mock;
const mockObjective = getActiveObjective as jest.Mock;
const mockBasics = getCyclePreferences as jest.Mock;
const mockObservationStart = getCycleObservationStartedAt as jest.Mock;
const mockConfirmed = getHasConfirmedCycleData as jest.Mock;
const mockHistory = getRecordedPeriodHistory as jest.Mock;
const mockConceptionPrefs = getConceptionPreferences as jest.Mock;

const IDS = CONCEPTION_REMINDER_NOTIFICATION_IDS;
const NOW = new Date(2026, 8, 26, 10, 0, 0);

const basics = (lastPeriodStart: string, regularity: 'yes' | 'no' | 'unknown', cycleDuration = 28) => ({
  lastPeriodStart: new Date(`${lastPeriodStart}T12:00:00`),
  cycleDuration,
  periodDuration: 5,
  regularity,
});
const scheduled = (id: string) => mockSchedule.mock.calls.map(([arg]) => arg).find(arg => arg.id === id);
const scheduledIds = () => mockSchedule.mock.calls.map(([arg]) => arg.id as string);
const cancelledIds = () => mockCancel.mock.calls.map(([id]) => id as string);
const stamp = (date: Date) => `${date.toLocaleDateString('en-CA')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({now: NOW});
  mockSchedule.mockResolvedValue(true);
  mockCancel.mockResolvedValue(undefined);
  mockObjective.mockReturnValue('conceive');
  mockConfirmed.mockReturnValue(true);
  mockObservationStart.mockReturnValue(null);
  mockHistory.mockReturnValue([]);
  mockConceptionPrefs.mockReturnValue({
    reminders: {temperature: false, daily_journal: false, fertile_window: true, estimated_ovulation: true, lh_test: true},
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('syncConceptionReminders — cycle-day reminders', () => {
  it('declared regular cycle: dates follow the declared 28-day cycle (ovulation day 15)', async () => {
    mockBasics.mockReturnValue(basics('2026-09-15', 'yes'));

    await syncConceptionReminders();

    expect(stamp(scheduled(IDS.estimated_ovulation).fireDate)).toBe('2026-09-29 08:00');
    expect(stamp(scheduled(IDS.lh_test).fireDate)).toBe('2026-09-27 09:00');
    // This cycle's fertile start (09-24) already passed -> next cycle's.
    expect(stamp(scheduled(IDS.fertile_window).fireDate)).toBe('2026-10-22 08:00');
  });

  it('observed regular-looking pattern (regularity unknown): uses the observed 30-day average, like the Dashboard phase', async () => {
    const starts = ['2026-06-18', '2026-07-18', '2026-08-17', '2026-09-16'];
    mockHistory.mockReturnValue(starts.map(startDate => ({id: startDate, startDate, endDate: startDate})));
    mockObservationStart.mockReturnValue(new Date('2026-06-18T12:00:00'));
    mockBasics.mockReturnValue(basics('2026-09-16', 'unknown', 28));

    await syncConceptionReminders();

    // Observed 30 => ovulation day 17 => 09-16 + 16 = 10-02 (declared 28 would give 09-30).
    expect(stamp(scheduled(IDS.estimated_ovulation).fireDate)).toBe('2026-10-02 08:00');
  });

  it('observing / window modes keep using the declared length (what the TTC screens display)', async () => {
    mockBasics.mockReturnValue(basics('2026-09-15', 'unknown'));
    await syncConceptionReminders();
    expect(stamp(scheduled(IDS.estimated_ovulation).fireDate)).toBe('2026-09-29 08:00');

    jest.clearAllMocks();
    mockSchedule.mockResolvedValue(true);
    mockBasics.mockReturnValue(basics('2026-09-15', 'no'));
    await syncConceptionReminders();
    expect(stamp(scheduled(IDS.estimated_ovulation).fireDate)).toBe('2026-09-29 08:00');
  });

  it('schedules nothing from unconfirmed fallback cycle data and cancels the three cycle-day reminders', async () => {
    mockConfirmed.mockReturnValue(false);
    mockBasics.mockReturnValue(basics('2026-09-15', 'yes'));

    await syncConceptionReminders();

    expect(scheduledIds()).toEqual([]);
    expect(cancelledIds()).toEqual(expect.arrayContaining([IDS.fertile_window, IDS.estimated_ovulation, IDS.lh_test]));
  });

  it('a disabled reminder is cancelled, not scheduled', async () => {
    mockBasics.mockReturnValue(basics('2026-09-15', 'yes'));
    mockConceptionPrefs.mockReturnValue({
      reminders: {temperature: false, daily_journal: false, fertile_window: false, estimated_ovulation: true, lh_test: false},
    });

    await syncConceptionReminders();

    expect(scheduledIds()).toEqual([IDS.estimated_ovulation]);
    expect(cancelledIds()).toEqual(expect.arrayContaining([IDS.fertile_window, IDS.lh_test]));
  });

  it('cancels every TTC reminder when Conceive is not the active objective', async () => {
    mockObjective.mockReturnValue('cycle');
    mockBasics.mockReturnValue(basics('2026-09-15', 'yes'));

    await syncConceptionReminders();

    expect(scheduledIds()).toEqual([]);
    expect(cancelledIds()).toEqual(expect.arrayContaining(Object.values(IDS)));
  });
});
