import {syncCycleReminders} from '../cycleReminderScheduling';
import {scheduleLocalNotification, cancelLocalNotification} from '../../services/pregnancyNotifications';
import {getActiveObjective, getCyclePreferences, getCycleObservationStartedAt, getPeriodHistory} from '../../state/onboardingPreferences';
import {getCycleReminderPreferences} from '../../state/cycleReminderPreferences';

// Explicit factories — pregnancyNotifications.ts imports the real Notifee
// native module at the top level, which isn't available in the Jest
// environment. An auto-mock (bare jest.mock(path)) still evaluates the real
// module once to infer its shape, so it must be replaced outright instead.
jest.mock('../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn(),
  cancelLocalNotification: jest.fn(),
}));
jest.mock('../../state/onboardingPreferences', () => ({
  getActiveObjective: jest.fn(),
  getCyclePreferences: jest.fn(),
  getCycleObservationStartedAt: jest.fn(),
  getPeriodHistory: jest.fn(),
}));
jest.mock('../../state/cycleReminderPreferences', () => ({
  getCycleReminderPreferences: jest.fn(),
}));

const mockScheduleLocalNotification = scheduleLocalNotification as jest.Mock;
const mockCancelLocalNotification = cancelLocalNotification as jest.Mock;
const mockGetActiveObjective = getActiveObjective as jest.Mock;
const mockGetCyclePreferences = getCyclePreferences as jest.Mock;
const mockGetCycleObservationStartedAt = getCycleObservationStartedAt as jest.Mock;
const mockGetPeriodHistory = getPeriodHistory as jest.Mock;
const mockGetCycleReminderPreferences = getCycleReminderPreferences as jest.Mock;

const DEFAULT_PREFS = {
  upcomingPeriodEnabled: false,
  upcomingPeriodDaysBefore: 2 as const,
  periodStartCheckEnabled: false,
  dailyJournalEnabled: false,
  dailyJournalTime: null,
  fertileWindowEnabled: false,
  ovulationEnabled: false,
};

// A regular (regularity: 'yes') cycle so computeCyclePredictionStatus always
// returns mode: 'exact' — the same real prediction source the Cycle
// Dashboard/Calendar use, never independently re-derived here.
function regularBasics(lastPeriodStart: string, cycleDuration = 28, periodDuration = 5) {
  return {
    lastPeriodStart: new Date(`${lastPeriodStart}T12:00:00`),
    cycleDuration,
    periodDuration,
    regularity: 'yes' as const,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockScheduleLocalNotification.mockResolvedValue(true);
  mockCancelLocalNotification.mockResolvedValue(undefined);
  mockGetActiveObjective.mockReturnValue('cycle');
  mockGetCycleObservationStartedAt.mockReturnValue(null);
  mockGetPeriodHistory.mockReturnValue([]);
  mockGetCycleReminderPreferences.mockReturnValue({...DEFAULT_PREFS});
});

describe('syncCycleReminders — upcoming period reminder', () => {
  it('A: schedules N days before the predicted date at the canonical 09:00 hour', async () => {
    // lastPeriodStart 2026-08-13 + 28 days => predicted 2026-09-10.
    mockGetCyclePreferences.mockReturnValue(regularBasics('2026-08-13'));
    mockGetCycleReminderPreferences.mockReturnValue({
      ...DEFAULT_PREFS,
      upcomingPeriodEnabled: true,
      upcomingPeriodDaysBefore: 2,
    });

    await syncCycleReminders();

    const call = mockScheduleLocalNotification.mock.calls.find(([arg]) => arg.id === 'cycle-upcoming-period-reminder');
    expect(call).toBeDefined();
    const fireDate: Date = call![0].fireDate;
    expect(fireDate.getFullYear()).toBe(2026);
    expect(fireDate.getMonth()).toBe(8); // September, 0-indexed
    expect(fireDate.getDate()).toBe(8);
    expect(fireDate.getHours()).toBe(9);
    expect(call![0].title).toBe('Tes règles sont prévues bientôt 🌸');
  });

  it('does not schedule when disabled', async () => {
    mockGetCyclePreferences.mockReturnValue(regularBasics('2026-08-13'));
    await syncCycleReminders();
    expect(mockScheduleLocalNotification.mock.calls.some(([arg]) => arg.id === 'cycle-upcoming-period-reminder')).toBe(false);
    expect(mockCancelLocalNotification).toHaveBeenCalledWith('cycle-upcoming-period-reminder');
  });

  it('does not invent a date when the cycle has no single predicted date (irregular)', async () => {
    mockGetCyclePreferences.mockReturnValue({
      lastPeriodStart: new Date('2026-08-13T12:00:00'),
      cycleDuration: 28,
      periodDuration: 5,
      regularity: 'no',
    });
    mockGetCycleReminderPreferences.mockReturnValue({...DEFAULT_PREFS, upcomingPeriodEnabled: true});

    await syncCycleReminders();

    expect(mockScheduleLocalNotification.mock.calls.some(([arg]) => arg.id === 'cycle-upcoming-period-reminder')).toBe(false);
    expect(mockCancelLocalNotification).toHaveBeenCalledWith('cycle-upcoming-period-reminder');
  });

  it('B: a prediction change reschedules to the new date (same id upserts)', async () => {
    mockGetCyclePreferences.mockReturnValue(regularBasics('2026-08-13')); // predicts 2026-09-10
    mockGetCycleReminderPreferences.mockReturnValue({...DEFAULT_PREFS, upcomingPeriodEnabled: true, upcomingPeriodDaysBefore: 2});
    await syncCycleReminders();
    const first = mockScheduleLocalNotification.mock.calls.find(([arg]) => arg.id === 'cycle-upcoming-period-reminder')![0].fireDate;
    expect(first.getDate()).toBe(8);

    jest.clearAllMocks();
    mockScheduleLocalNotification.mockResolvedValue(true);
    mockGetCyclePreferences.mockReturnValue(regularBasics('2026-08-15')); // predicts 2026-09-12
    mockGetCycleReminderPreferences.mockReturnValue({...DEFAULT_PREFS, upcomingPeriodEnabled: true, upcomingPeriodDaysBefore: 2});
    await syncCycleReminders();
    const second = mockScheduleLocalNotification.mock.calls.find(([arg]) => arg.id === 'cycle-upcoming-period-reminder')![0];
    expect(second.fireDate.getDate()).toBe(10);
    expect(second.id).toBe('cycle-upcoming-period-reminder');
  });
});

describe('syncCycleReminders — period start check', () => {
  it('C: reschedules to the new predicted date once the period is actually recorded (never a false "already started")', async () => {
    // Expected 2026-09-10; she records it ON that date, advancing lastPeriodStart —
    // the recomputed prediction now points to the NEXT cycle, not the resolved day.
    mockGetCyclePreferences.mockReturnValue(regularBasics('2026-08-13'));
    mockGetCycleReminderPreferences.mockReturnValue({...DEFAULT_PREFS, periodStartCheckEnabled: true});
    await syncCycleReminders();
    const before = mockScheduleLocalNotification.mock.calls.find(([arg]) => arg.id === 'cycle-period-start-check-reminder')![0];
    expect(before.fireDate.getDate()).toBe(10);

    jest.clearAllMocks();
    mockScheduleLocalNotification.mockResolvedValue(true);
    mockGetCyclePreferences.mockReturnValue(regularBasics('2026-09-10'));
    mockGetCycleReminderPreferences.mockReturnValue({...DEFAULT_PREFS, periodStartCheckEnabled: true});
    await syncCycleReminders();
    const after = mockScheduleLocalNotification.mock.calls.find(([arg]) => arg.id === 'cycle-period-start-check-reminder')![0];
    expect(after.fireDate.getDate()).not.toBe(10);
    expect(after.title).toBe('Tes règles ont peut-être commencé ?');
  });

  it('is never scheduled as a recurring notification', async () => {
    mockGetCyclePreferences.mockReturnValue(regularBasics('2026-08-13'));
    mockGetCycleReminderPreferences.mockReturnValue({...DEFAULT_PREFS, periodStartCheckEnabled: true});
    await syncCycleReminders();
    const call = mockScheduleLocalNotification.mock.calls.find(([arg]) => arg.id === 'cycle-period-start-check-reminder')![0];
    expect(call.repeatFrequency).toBeUndefined();
  });
});

describe('syncCycleReminders — daily journal', () => {
  it('D: schedules daily at the chosen time, reschedules on time change, cancels when disabled', async () => {
    mockGetCyclePreferences.mockReturnValue(regularBasics('2026-08-13'));
    mockGetCycleReminderPreferences.mockReturnValue({...DEFAULT_PREFS, dailyJournalEnabled: true, dailyJournalTime: '20:00'});
    await syncCycleReminders();
    let call = mockScheduleLocalNotification.mock.calls.find(([arg]) => arg.id === 'cycle-daily-journal-reminder')![0];
    expect(call.repeatFrequency).toBe('daily');
    expect(call.fireDate.getHours()).toBe(20);

    jest.clearAllMocks();
    mockScheduleLocalNotification.mockResolvedValue(true);
    mockGetCycleReminderPreferences.mockReturnValue({...DEFAULT_PREFS, dailyJournalEnabled: true, dailyJournalTime: '21:30'});
    await syncCycleReminders();
    call = mockScheduleLocalNotification.mock.calls.find(([arg]) => arg.id === 'cycle-daily-journal-reminder')![0];
    expect(call.fireDate.getHours()).toBe(21);
    expect(call.fireDate.getMinutes()).toBe(30);

    jest.clearAllMocks();
    mockGetCycleReminderPreferences.mockReturnValue({...DEFAULT_PREFS, dailyJournalEnabled: false, dailyJournalTime: '21:30'});
    await syncCycleReminders();
    expect(mockCancelLocalNotification).toHaveBeenCalledWith('cycle-daily-journal-reminder');
    expect(mockScheduleLocalNotification.mock.calls.some(([arg]) => arg.id === 'cycle-daily-journal-reminder')).toBe(false);
  });
});

describe('syncCycleReminders — fertility', () => {
  it('E: schedules neither fertile-window nor ovulation when the category is off', async () => {
    mockGetCyclePreferences.mockReturnValue(regularBasics('2026-08-13'));
    await syncCycleReminders();
    expect(mockScheduleLocalNotification.mock.calls.some(([arg]) => arg.id === 'cycle-fertile-window-reminder')).toBe(false);
    expect(mockScheduleLocalNotification.mock.calls.some(([arg]) => arg.id === 'cycle-ovulation-reminder')).toBe(false);
  });

  it('F: fertile-window only', async () => {
    mockGetCyclePreferences.mockReturnValue(regularBasics('2026-08-13'));
    mockGetCycleReminderPreferences.mockReturnValue({...DEFAULT_PREFS, fertileWindowEnabled: true});
    await syncCycleReminders();
    expect(mockScheduleLocalNotification.mock.calls.some(([arg]) => arg.id === 'cycle-fertile-window-reminder')).toBe(true);
    expect(mockScheduleLocalNotification.mock.calls.some(([arg]) => arg.id === 'cycle-ovulation-reminder')).toBe(false);
    const call = mockScheduleLocalNotification.mock.calls.find(([arg]) => arg.id === 'cycle-fertile-window-reminder')![0];
    expect(call.title).toBe('Ta fenêtre fertile estimée approche');
  });

  it('G: ovulation only', async () => {
    mockGetCyclePreferences.mockReturnValue(regularBasics('2026-08-13'));
    mockGetCycleReminderPreferences.mockReturnValue({...DEFAULT_PREFS, ovulationEnabled: true});
    await syncCycleReminders();
    expect(mockScheduleLocalNotification.mock.calls.some(([arg]) => arg.id === 'cycle-ovulation-reminder')).toBe(true);
    expect(mockScheduleLocalNotification.mock.calls.some(([arg]) => arg.id === 'cycle-fertile-window-reminder')).toBe(false);
    const call = mockScheduleLocalNotification.mock.calls.find(([arg]) => arg.id === 'cycle-ovulation-reminder')![0];
    expect(call.title).toBe('Ovulation estimée 🌸');
  });
});

describe('syncCycleReminders — objective gating', () => {
  it('cancels every reminder when Cycle is not the active objective', async () => {
    mockGetActiveObjective.mockReturnValue('pregnancy');
    mockGetCyclePreferences.mockReturnValue(regularBasics('2026-08-13'));
    mockGetCycleReminderPreferences.mockReturnValue({
      upcomingPeriodEnabled: true,
      upcomingPeriodDaysBefore: 2,
      periodStartCheckEnabled: true,
      dailyJournalEnabled: true,
      dailyJournalTime: '20:00',
      fertileWindowEnabled: true,
      ovulationEnabled: true,
    });

    await syncCycleReminders();

    expect(mockScheduleLocalNotification).not.toHaveBeenCalled();
    expect(mockCancelLocalNotification).toHaveBeenCalledWith('cycle-upcoming-period-reminder');
    expect(mockCancelLocalNotification).toHaveBeenCalledWith('cycle-period-start-check-reminder');
    expect(mockCancelLocalNotification).toHaveBeenCalledWith('cycle-daily-journal-reminder');
    expect(mockCancelLocalNotification).toHaveBeenCalledWith('cycle-fertile-window-reminder');
    expect(mockCancelLocalNotification).toHaveBeenCalledWith('cycle-ovulation-reminder');
  });
});
