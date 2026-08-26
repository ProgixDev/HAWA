import {syncIrregularReminders, computeUnrecordedPeriodReminderDate} from '../irregularReminderScheduling';
import {scheduleLocalNotification, cancelLocalNotification} from '../../services/pregnancyNotifications';
import {getActiveObjective} from '../../state/onboardingPreferences';
import {getIrregularPreferences} from '../../state/irregularPreferences';
import {getConfirmedPeriodHistory} from '../../state/confirmedPeriodHistoryStore';

jest.mock('../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn(),
  cancelLocalNotification: jest.fn(),
}));
jest.mock('../../state/onboardingPreferences', () => ({
  getActiveObjective: jest.fn(),
}));
jest.mock('../../state/irregularPreferences', () => ({
  getIrregularPreferences: jest.fn(),
}));
jest.mock('../../state/confirmedPeriodHistoryStore', () => ({
  getConfirmedPeriodHistory: jest.fn(),
}));

const mockScheduleLocalNotification = scheduleLocalNotification as jest.Mock;
const mockCancelLocalNotification = cancelLocalNotification as jest.Mock;
const mockGetActiveObjective = getActiveObjective as jest.Mock;
const mockGetIrregularPreferences = getIrregularPreferences as jest.Mock;
const mockGetConfirmedPeriodHistory = getConfirmedPeriodHistory as jest.Mock;

const NOW = new Date(2026, 7, 26); // 26 August 2026

const DEFAULT_PREFS = {
  cyclePattern: null,
  lastPeriodDate: null,
  trackedItems: [],
  reminders: {
    dailyJournalEnabled: false,
    dailyJournalTime: null,
    unrecordedPeriodEnabled: false,
  },
};

const occurrence = (id: string, periodStart: string) => ({
  id,
  periodStart,
  periodEndDateTime: periodStart,
  capturedAt: periodStart,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockScheduleLocalNotification.mockResolvedValue(true);
  mockCancelLocalNotification.mockResolvedValue(undefined);
  mockGetActiveObjective.mockReturnValue('irregular');
  mockGetIrregularPreferences.mockReturnValue({...DEFAULT_PREFS, reminders: {...DEFAULT_PREFS.reminders}});
  mockGetConfirmedPeriodHistory.mockReturnValue([]);
});

describe('syncIrregularReminders — daily journal reminder', () => {
  it('schedules the daily reminder with the exact neutral wording, at the chosen time, recurring', async () => {
    mockGetIrregularPreferences.mockReturnValue({
      ...DEFAULT_PREFS,
      reminders: {dailyJournalEnabled: true, dailyJournalTime: '20:00', unrecordedPeriodEnabled: false},
    });

    await syncIrregularReminders(NOW);

    expect(mockScheduleLocalNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'irregular-daily-journal-reminder',
        title: 'Journal quotidien',
        body: 'Comment te sens-tu aujourd’hui ? Pense à mettre ton suivi à jour.',
        repeatFrequency: 'daily',
      }),
    );
  });

  it('cancels the daily reminder when disabled', async () => {
    mockGetIrregularPreferences.mockReturnValue({
      ...DEFAULT_PREFS,
      reminders: {dailyJournalEnabled: false, dailyJournalTime: '20:00', unrecordedPeriodEnabled: false},
    });

    await syncIrregularReminders(NOW);

    expect(mockCancelLocalNotification).toHaveBeenCalledWith('irregular-daily-journal-reminder');
    expect(mockScheduleLocalNotification).not.toHaveBeenCalledWith(
      expect.objectContaining({id: 'irregular-daily-journal-reminder'}),
    );
  });

  it('cancels every reminder when SOPK is not the active objective, even if enabled', async () => {
    mockGetActiveObjective.mockReturnValue('cycle');
    mockGetIrregularPreferences.mockReturnValue({
      ...DEFAULT_PREFS,
      reminders: {dailyJournalEnabled: true, dailyJournalTime: '20:00', unrecordedPeriodEnabled: true},
    });
    mockGetConfirmedPeriodHistory.mockReturnValue([
      occurrence('a', '2026-06-01T08:00:00'),
      occurrence('b', '2026-06-29T08:00:00'),
    ]);

    await syncIrregularReminders(NOW);

    expect(mockCancelLocalNotification).toHaveBeenCalledWith('irregular-daily-journal-reminder');
    expect(mockCancelLocalNotification).toHaveBeenCalledWith('irregular-unrecorded-period-reminder');
    expect(mockScheduleLocalNotification).not.toHaveBeenCalled();
  });
});

describe('syncIrregularReminders — unrecorded period reminder (neutral, no "late" framing)', () => {
  it('schedules with the exact neutral wording — never "retard"/"en retard"/"late"', async () => {
    mockGetIrregularPreferences.mockReturnValue({
      ...DEFAULT_PREFS,
      reminders: {dailyJournalEnabled: false, dailyJournalTime: null, unrecordedPeriodEnabled: true},
    });
    mockGetConfirmedPeriodHistory.mockReturnValue([
      occurrence('a', '2026-07-04T08:00:00'),
      occurrence('b', '2026-08-01T08:00:00'), // 28-day gap
    ]);

    await syncIrregularReminders(NOW);

    const call = mockScheduleLocalNotification.mock.calls.find(
      ([input]) => input.id === 'irregular-unrecorded-period-reminder',
    );
    expect(call).toBeDefined();
    const [input] = call as [{title: string; body: string; fireDate: Date}];
    expect(input.title).toBe('Règles non renseignées');
    expect(input.body).toBe(
      'Tu n’as pas encore renseigné de nouvelles règles. Pense à mettre ton suivi à jour si elles ont commencé.',
    );
    expect(input.title.toLowerCase()).not.toContain('retard');
    expect(input.body.toLowerCase()).not.toContain('retard');
    expect(input.title.toLowerCase()).not.toContain('late');
    expect(input.body.toLowerCase()).not.toContain('late');
    // 2026-08-01 + 28 days (average) + 7 days (buffer) = 2026-09-05.
    expect(input.fireDate).toEqual(new Date(2026, 8, 5, 9, 0, 0, 0));
  });

  it('cancels — never fabricates a reminder date — when fewer than 2 confirmed periods exist', async () => {
    mockGetIrregularPreferences.mockReturnValue({
      ...DEFAULT_PREFS,
      reminders: {dailyJournalEnabled: false, dailyJournalTime: null, unrecordedPeriodEnabled: true},
    });
    mockGetConfirmedPeriodHistory.mockReturnValue([occurrence('a', '2026-05-01T08:00:00')]);

    await syncIrregularReminders(NOW);

    expect(mockCancelLocalNotification).toHaveBeenCalledWith('irregular-unrecorded-period-reminder');
    expect(mockScheduleLocalNotification).not.toHaveBeenCalledWith(
      expect.objectContaining({id: 'irregular-unrecorded-period-reminder'}),
    );
  });

  it('cancels when disabled, regardless of real history', async () => {
    mockGetIrregularPreferences.mockReturnValue({
      ...DEFAULT_PREFS,
      reminders: {dailyJournalEnabled: false, dailyJournalTime: null, unrecordedPeriodEnabled: false},
    });
    mockGetConfirmedPeriodHistory.mockReturnValue([
      occurrence('a', '2026-05-01T08:00:00'),
      occurrence('b', '2026-05-29T08:00:00'),
    ]);

    await syncIrregularReminders(NOW);

    expect(mockCancelLocalNotification).toHaveBeenCalledWith('irregular-unrecorded-period-reminder');
  });
});

describe('computeUnrecordedPeriodReminderDate', () => {
  it('returns null with insufficient real history — never a fabricated date', () => {
    mockGetConfirmedPeriodHistory.mockReturnValue([]);
    expect(computeUnrecordedPeriodReminderDate(NOW)).toBeNull();
  });

  it('returns null when the computed date already lies in the past relative to now', () => {
    mockGetConfirmedPeriodHistory.mockReturnValue([
      occurrence('a', '2025-01-01T08:00:00'),
      occurrence('b', '2025-01-29T08:00:00'),
    ]);
    expect(computeUnrecordedPeriodReminderDate(NOW)).toBeNull();
  });
});
