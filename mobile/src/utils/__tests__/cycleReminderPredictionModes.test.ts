import {syncCycleReminders} from '../cycleReminderScheduling';
import {computeCyclePredictionStatus, estimateFertilityDates, startOfDay} from '../cycleMath';
import {scheduleLocalNotification, cancelLocalNotification} from '../../services/pregnancyNotifications';
import {
  getActiveObjective,
  getCyclePreferences,
  getCycleObservationStartedAt,
  getRecordedPeriodHistory,
} from '../../state/onboardingPreferences';
import {getCycleReminderPreferences} from '../../state/cycleReminderPreferences';

// M10 — Cycle reminders follow the SAME prediction mode the Cycle Dashboard
// shows (computeCyclePredictionStatus + estimateFertilityDates):
//   exact     -> everything scheduled from the exact/estimated dates
//   window    -> no precise date exists: all four date reminders cancelled
//   observing -> fertile window/ovulation estimated (as the UI shows),
//                period reminders cancelled (no single next-period date)
// Independent of the (clock-sensitive) cycleReminderScheduling.test.ts: the
// clock is pinned here.
jest.mock('../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn(),
  cancelLocalNotification: jest.fn(),
}));
jest.mock('../../state/onboardingPreferences', () => ({
  getActiveObjective: jest.fn(),
  getCyclePreferences: jest.fn(),
  getCycleObservationStartedAt: jest.fn(),
  getRecordedPeriodHistory: jest.fn(),
}));
jest.mock('../../state/cycleReminderPreferences', () => ({
  getCycleReminderPreferences: jest.fn(),
}));

const mockSchedule = scheduleLocalNotification as jest.Mock;
const mockCancel = cancelLocalNotification as jest.Mock;
const mockObjective = getActiveObjective as jest.Mock;
const mockBasics = getCyclePreferences as jest.Mock;
const mockObservationStart = getCycleObservationStartedAt as jest.Mock;
const mockHistory = getRecordedPeriodHistory as jest.Mock;
const mockPrefs = getCycleReminderPreferences as jest.Mock;

const IDS = {
  upcoming: 'cycle-upcoming-period-reminder',
  check: 'cycle-period-start-check-reminder',
  fertile: 'cycle-fertile-window-reminder',
  ovulation: 'cycle-ovulation-reminder',
};
const ALL_ON = {
  upcomingPeriodEnabled: true,
  upcomingPeriodDaysBefore: 2 as const,
  periodStartCheckEnabled: true,
  dailyJournalEnabled: false,
  dailyJournalTime: null,
  fertileWindowEnabled: true,
  ovulationEnabled: true,
};
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
const ymd = (date: Date) => date.toLocaleDateString('en-CA');

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({now: NOW});
  mockSchedule.mockResolvedValue(true);
  mockCancel.mockResolvedValue(undefined);
  mockObjective.mockReturnValue('cycle');
  mockObservationStart.mockReturnValue(null);
  mockHistory.mockReturnValue([]);
  mockPrefs.mockReturnValue({...ALL_ON});
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Cycle reminders — EXACT mode (declared regular)', () => {
  it('schedules all four date reminders from the exact/estimated dates', async () => {
    // Cycle day 12 today: period predicted 2026-10-13, ovulation 2026-09-29,
    // this cycle's fertile start (09-24) already passed -> next cycle's.
    mockBasics.mockReturnValue(basics('2026-09-15', 'yes'));

    await syncCycleReminders();

    expect(scheduledIds().sort()).toEqual([IDS.check, IDS.fertile, IDS.ovulation, IDS.upcoming].sort());
    expect(ymd(scheduled(IDS.check).fireDate)).toBe('2026-10-13');
    expect(ymd(scheduled(IDS.upcoming).fireDate)).toBe('2026-10-11');
    expect(ymd(scheduled(IDS.ovulation).fireDate)).toBe('2026-09-29');
    expect(ymd(scheduled(IDS.fertile).fireDate)).toBe('2026-10-21'); // next start 10-22, one day of lead
  });

  it('the ovulation reminder date is the very date estimateFertilityDates (the UI) returns', async () => {
    const declared = basics('2026-09-15', 'yes');
    mockBasics.mockReturnValue(declared);
    const today = startOfDay(NOW);
    const status = computeCyclePredictionStatus(declared, 'yes', [], null, today);
    const estimate = estimateFertilityDates(declared, status, today)!;

    await syncCycleReminders();

    expect(ymd(scheduled(IDS.ovulation).fireDate)).toBe(ymd(estimate.ovulation));
  });
});

describe('Cycle reminders — WINDOW mode (declared irregular)', () => {
  it('schedules NO precise fertile/ovulation reminder and cancels every date reminder', async () => {
    mockBasics.mockReturnValue(basics('2026-09-15', 'no'));

    await syncCycleReminders();

    expect(scheduledIds()).toEqual([]);
    expect(cancelledIds()).toEqual(expect.arrayContaining(Object.values(IDS)));
  });

  it('a mode change exact -> window cancels the fertile/ovulation notifications scheduled earlier', async () => {
    mockBasics.mockReturnValue(basics('2026-09-15', 'yes'));
    await syncCycleReminders();
    expect(scheduledIds()).toEqual(expect.arrayContaining([IDS.fertile, IDS.ovulation]));

    jest.clearAllMocks();
    mockSchedule.mockResolvedValue(true);
    mockCancel.mockResolvedValue(undefined);
    mockBasics.mockReturnValue(basics('2026-09-15', 'no'));
    await syncCycleReminders();

    expect(scheduledIds()).toEqual([]);
    expect(cancelledIds()).toEqual(expect.arrayContaining([IDS.fertile, IDS.ovulation, IDS.upcoming, IDS.check]));
  });

  it('an observed variable pattern (regularity unknown) is also window mode', async () => {
    // Gaps 20 / 40 / 25 days => range > 7 => "variable" => window.
    const starts = ['2026-05-01', '2026-05-21', '2026-06-30', '2026-07-25'];
    mockHistory.mockReturnValue(starts.map(startDate => ({id: startDate, startDate, endDate: startDate})));
    mockObservationStart.mockReturnValue(new Date('2026-05-01T12:00:00'));
    mockBasics.mockReturnValue(basics('2026-07-25', 'unknown'));

    await syncCycleReminders();

    expect(scheduledIds()).toEqual([]);
    expect(cancelledIds()).toEqual(expect.arrayContaining(Object.values(IDS)));
  });
});

describe('Cycle reminders — OBSERVING mode (regularity unknown, not enough history)', () => {
  it('keeps the estimated fertile window / ovulation the UI shows, cancels the period reminders', async () => {
    mockBasics.mockReturnValue(basics('2026-09-15', 'unknown'));

    await syncCycleReminders();

    expect(scheduledIds().sort()).toEqual([IDS.fertile, IDS.ovulation].sort());
    expect(ymd(scheduled(IDS.ovulation).fireDate)).toBe('2026-09-29');
    expect(cancelledIds()).toEqual(expect.arrayContaining([IDS.upcoming, IDS.check]));
  });
});

describe('Cycle reminders — observed regular-looking pattern uses the OBSERVED length', () => {
  it('schedules from the observed 30-day average, not the declared 28', async () => {
    const starts = ['2026-06-18', '2026-07-18', '2026-08-17', '2026-09-16'];
    mockHistory.mockReturnValue(starts.map(startDate => ({id: startDate, startDate, endDate: startDate})));
    mockObservationStart.mockReturnValue(new Date('2026-06-18T12:00:00'));
    mockBasics.mockReturnValue(basics('2026-09-16', 'unknown', 28));

    await syncCycleReminders();

    // Observed 30 days: ovulation day 17 => 2026-09-16 + 16 days = 2026-10-02
    // (28 declared would give 2026-09-30). Next period: 2026-10-16.
    expect(ymd(scheduled(IDS.ovulation).fireDate)).toBe('2026-10-02');
    expect(ymd(scheduled(IDS.check).fireDate)).toBe('2026-10-16');
  });
});

describe('Cycle reminders — toggles still respected', () => {
  it('a disabled category is cancelled even when the mode would allow it', async () => {
    mockBasics.mockReturnValue(basics('2026-09-15', 'yes'));
    mockPrefs.mockReturnValue({...ALL_ON, ovulationEnabled: false, fertileWindowEnabled: false});

    await syncCycleReminders();

    expect(scheduledIds().sort()).toEqual([IDS.check, IDS.upcoming].sort());
    expect(cancelledIds()).toEqual(expect.arrayContaining([IDS.fertile, IDS.ovulation]));
  });
});
