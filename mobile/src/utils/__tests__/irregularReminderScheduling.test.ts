import {syncIrregularReminders, computeUnrecordedPeriodReminderDate} from '../irregularReminderScheduling';
import {scheduleLocalNotification, cancelLocalNotification} from '../../services/pregnancyNotifications';
import {getActiveObjective} from '../../state/onboardingPreferences';
import {getIrregularPreferences} from '../../state/irregularPreferences';
import {getConfirmedPeriodHistory} from '../../state/confirmedPeriodHistoryStore';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {saveIrregularJournalEntry} from '../../state/irregularJournalStore';
import {collectActualPeriodDayKeys} from '../irregularJournalSelectors';
import type {DailyJournalEntry} from '../../types/journal';
import type {IrregularJournalEntry} from '../../state/irregularJournalStore';

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
  it('returns null with insufficient real history — never a fabricated date', async () => {
    mockGetConfirmedPeriodHistory.mockReturnValue([]);
    expect(await computeUnrecordedPeriodReminderDate(NOW)).toBeNull();
  });

  it('returns null when the computed date already lies in the past relative to now', async () => {
    mockGetConfirmedPeriodHistory.mockReturnValue([
      occurrence('a', '2025-01-01T08:00:00'),
      occurrence('b', '2025-01-29T08:00:00'),
    ]);
    expect(await computeUnrecordedPeriodReminderDate(NOW)).toBeNull();
  });
});

// M22 — the unrecorded-period reminder is anchored on the LATEST REAL period
// start (journal / confirmed history / onboarding answer), not only on the last
// confirmed occurrence. Average cycle (28 d from the two confirmed periods) and
// the 7-day buffer are unchanged: reminder = latest start + 28 + 7 days, 09:00.
describe('computeUnrecordedPeriodReminderDate — latest REAL period start (M22)', () => {
  const confirmed = [occurrence('a', '2026-07-04T08:00:00'), occurrence('b', '2026-08-01T08:00:00')];

  const flowEntry = (date: string, intensity: string): DailyJournalEntry =>
    ({id: date, date, flow: {intensity}}) as unknown as DailyJournalEntry;
  const sopkEntry = (date: string, status: 'yes' | 'no' | 'spotting'): IrregularJournalEntry => ({
    date,
    details: {period: {status}},
  });

  const sourcesFor = (
    journalEntries: DailyJournalEntry[],
    irregularEntries: Record<string, IrregularJournalEntry> = {},
    extra: {declaredLastPeriodDate?: string | null} = {},
  ) => ({
    periodDayKeys: collectActualPeriodDayKeys(journalEntries, irregularEntries),
    confirmedHistory: confirmed,
    declaredLastPeriodDate: extra.declaredLastPeriodDate ?? null,
  });

  const CONFIRMED_ONLY = new Date(2026, 8, 5, 9, 0, 0, 0); // 2026-08-01 + 35 d
  const FROM_AUG_20 = new Date(2026, 8, 24, 9, 0, 0, 0); // 2026-08-20 + 35 d

  it('confirmed history only: anchored on the last confirmed start (unchanged)', async () => {
    expect(await computeUnrecordedPeriodReminderDate(NOW, sourcesFor([]))).toEqual(CONFIRMED_ONLY);
  });

  it('a newer REAL flow recorded in the journal moves the reminder later', async () => {
    const sources = sourcesFor([flowEntry('2026-08-20', 'moderate')]);
    expect(await computeUnrecordedPeriodReminderDate(NOW, sources)).toEqual(FROM_AUG_20);
  });

  it('a newer real period recorded ONLY in the SOPK entry (status "yes") counts too', async () => {
    const sources = sourcesFor([], {'2026-08-20': sopkEntry('2026-08-20', 'yes')});
    expect(await computeUnrecordedPeriodReminderDate(NOW, sources)).toEqual(FROM_AUG_20);
  });

  it('Spotting newer than the last confirmed period is NOT a period: reminder unchanged', async () => {
    const sources = sourcesFor([flowEntry('2026-08-15', 'none')], {'2026-08-15': sopkEntry('2026-08-15', 'spotting')});
    expect(await computeUnrecordedPeriodReminderDate(NOW, sources)).toEqual(CONFIRMED_ONLY);
  });

  it('"Non" newer than the last confirmed period is NOT a period: reminder unchanged', async () => {
    const sources = sourcesFor([flowEntry('2026-08-15', 'none')], {'2026-08-15': sopkEntry('2026-08-15', 'no')});
    expect(await computeUnrecordedPeriodReminderDate(NOW, sources)).toEqual(CONFIRMED_ONLY);
  });

  it('multiple journal periods: the LATEST real start wins; days of one period do not start a new one', async () => {
    const sources = sourcesFor([
      flowEntry('2026-08-20', 'moderate'),
      flowEntry('2026-08-21', 'heavy'),
      flowEntry('2026-09-18', 'light'),
      flowEntry('2026-09-19', 'moderate'),
      flowEntry('2026-09-25', 'none'), // spotting/none after the period never moves the start
    ]);
    // 2026-09-18 + 28 d + 7 d = 2026-10-23
    expect(await computeUnrecordedPeriodReminderDate(new Date(2026, 9, 20), sources)).toEqual(
      new Date(2026, 9, 23, 9, 0, 0, 0),
    );
  });

  it('a period day dated after today is ignored (not a real, occurred period)', async () => {
    const sources = sourcesFor([flowEntry('2026-09-01', 'moderate')]);
    expect(await computeUnrecordedPeriodReminderDate(NOW, sources)).toEqual(CONFIRMED_ONLY);
  });

  it('the onboarding "last period" answer is honoured when it is newer than the confirmed history', async () => {
    const sources = sourcesFor([], {}, {declaredLastPeriodDate: '2026-08-16'});
    expect(await computeUnrecordedPeriodReminderDate(NOW, sources)).toEqual(new Date(2026, 8, 20, 9, 0, 0, 0));
  });

  it('a recent real period whose next reminder date is still in the past yields no reminder', async () => {
    const sources = sourcesFor([flowEntry('2026-08-20', 'moderate')]);
    expect(await computeUnrecordedPeriodReminderDate(new Date(2026, 9, 1), sources)).toBeNull();
  });
});

// End to end through the real (non-reactive) stores the scheduler reads itself.
describe('syncIrregularReminders — reads the real journal stores (M22)', () => {
  const unrecordedCall = () =>
    mockScheduleLocalNotification.mock.calls.find(([input]) => input.id === 'irregular-unrecorded-period-reminder');

  beforeEach(() => {
    mockGetIrregularPreferences.mockReturnValue({
      ...DEFAULT_PREFS,
      reminders: {dailyJournalEnabled: false, dailyJournalTime: null, unrecordedPeriodEnabled: true},
    });
    mockGetConfirmedPeriodHistory.mockReturnValue([
      occurrence('a', '2026-07-04T08:00:00'),
      occurrence('b', '2026-08-01T08:00:00'),
    ]);
  });

  it('confirmed history only (nothing in the journal): 2026-09-05', async () => {
    await syncIrregularReminders(NOW);
    expect(unrecordedCall()?.[0].fireDate).toEqual(new Date(2026, 8, 5, 9, 0, 0, 0));
  });

  it('Spotting recorded in the SOPK journal does not move the reminder', async () => {
    await saveJournalSection('2026-08-18', 'flow', {intensity: 'none'});
    await saveIrregularJournalEntry('2026-08-18', 'period', 'Spotting', {status: 'spotting'});
    await syncIrregularReminders(NOW);
    expect(unrecordedCall()?.[0].fireDate).toEqual(new Date(2026, 8, 5, 9, 0, 0, 0));
  });

  it('"Non" recorded in the SOPK journal does not move the reminder', async () => {
    await saveJournalSection('2026-08-19', 'flow', {intensity: 'none'});
    await saveIrregularJournalEntry('2026-08-19', 'period', 'Non', {status: 'no'});
    await syncIrregularReminders(NOW);
    expect(unrecordedCall()?.[0].fireDate).toEqual(new Date(2026, 8, 5, 9, 0, 0, 0));
  });

  it('a real period recorded in the journal after the last confirmed one moves it to 2026-09-26', async () => {
    await saveJournalSection('2026-08-22', 'flow', {intensity: 'moderate'});
    await saveIrregularJournalEntry('2026-08-22', 'period', 'Oui', {status: 'yes'});
    await syncIrregularReminders(NOW);
    expect(unrecordedCall()?.[0].fireDate).toEqual(new Date(2026, 8, 26, 9, 0, 0, 0));
  });
});
