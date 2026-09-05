import {
  syncMiscarriageDailyTrackingReminder,
  MISCARRIAGE_DAILY_TRACKING_NOTIFICATION_KIND,
  MISCARRIAGE_DAILY_TRACKING_NOTIFICATION_TITLE,
  MISCARRIAGE_DAILY_TRACKING_NOTIFICATION_BODY,
} from '../miscarriageReminderScheduling';
import {scheduleLocalNotification, cancelLocalNotification} from '../../services/pregnancyNotifications';
import {getActiveObjective} from '../../state/onboardingPreferences';
import {getMiscarriagePreferences} from '../../state/miscarriagePreferences';

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
}));
jest.mock('../../state/miscarriagePreferences', () => ({
  getMiscarriagePreferences: jest.fn(),
}));

const mockScheduleLocalNotification = scheduleLocalNotification as jest.Mock;
const mockCancelLocalNotification = cancelLocalNotification as jest.Mock;
const mockGetActiveObjective = getActiveObjective as jest.Mock;
const mockGetMiscarriagePreferences = getMiscarriagePreferences as jest.Mock;

const DEFAULT_PREFS = {
  miscarriageDate: '2026-08-01',
  bleedingStatus: null,
  cycleReturnStatus: null,
  firstReturnedPeriodDate: null,
  tryingAgainStatus: null,
  dailyTrackingReminderEnabled: false,
  dailyTrackingReminderTime: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockScheduleLocalNotification.mockResolvedValue(true);
  mockCancelLocalNotification.mockResolvedValue(undefined);
  mockGetActiveObjective.mockReturnValue('loss');
  mockGetMiscarriagePreferences.mockReturnValue({...DEFAULT_PREFS});
});

describe('syncMiscarriageDailyTrackingReminder', () => {
  it('cancels and never schedules when the active objective is not loss', async () => {
    mockGetActiveObjective.mockReturnValue('cycle');
    mockGetMiscarriagePreferences.mockReturnValue({
      ...DEFAULT_PREFS,
      dailyTrackingReminderEnabled: true,
      dailyTrackingReminderTime: '19:00',
    });

    await syncMiscarriageDailyTrackingReminder();

    expect(mockScheduleLocalNotification).not.toHaveBeenCalled();
    expect(mockCancelLocalNotification).toHaveBeenCalledWith('miscarriage-daily-tracking-reminder');
  });

  it('cancels when the reminder is disabled (default/off convention)', async () => {
    mockGetMiscarriagePreferences.mockReturnValue({
      ...DEFAULT_PREFS,
      dailyTrackingReminderEnabled: false,
      dailyTrackingReminderTime: '19:00',
    });

    await syncMiscarriageDailyTrackingReminder();

    expect(mockScheduleLocalNotification).not.toHaveBeenCalled();
    expect(mockCancelLocalNotification).toHaveBeenCalledWith('miscarriage-daily-tracking-reminder');
  });

  it('never schedules a fabricated default time when enabled but no time was chosen', async () => {
    mockGetMiscarriagePreferences.mockReturnValue({
      ...DEFAULT_PREFS,
      dailyTrackingReminderEnabled: true,
      dailyTrackingReminderTime: null,
    });

    await syncMiscarriageDailyTrackingReminder();

    expect(mockScheduleLocalNotification).not.toHaveBeenCalled();
    expect(mockCancelLocalNotification).toHaveBeenCalledWith('miscarriage-daily-tracking-reminder');
  });

  it('schedules a recurring daily notification with the exact required wording when active, enabled and timed', async () => {
    mockGetMiscarriagePreferences.mockReturnValue({
      ...DEFAULT_PREFS,
      dailyTrackingReminderEnabled: true,
      dailyTrackingReminderTime: '19:00',
    });

    await syncMiscarriageDailyTrackingReminder();

    expect(mockCancelLocalNotification).not.toHaveBeenCalled();
    expect(mockScheduleLocalNotification).toHaveBeenCalledTimes(1);
    const call = mockScheduleLocalNotification.mock.calls[0][0];
    expect(call.id).toBe('miscarriage-daily-tracking-reminder');
    expect(call.title).toBe('Ton suivi du jour 🌿');
    expect(call.title).toBe(MISCARRIAGE_DAILY_TRACKING_NOTIFICATION_TITLE);
    expect(call.body).toBe('Si tu le souhaites, prends un moment pour noter comment tu te sens aujourd’hui.');
    expect(call.body).toBe(MISCARRIAGE_DAILY_TRACKING_NOTIFICATION_BODY);
    expect(call.repeatFrequency).toBe('daily');
    expect(call.fireDate).toBeInstanceOf(Date);
    expect(call.data).toEqual({
      hawaNotificationKind: MISCARRIAGE_DAILY_TRACKING_NOTIFICATION_KIND,
      inAppTitle: MISCARRIAGE_DAILY_TRACKING_NOTIFICATION_TITLE,
      inAppMessage: MISCARRIAGE_DAILY_TRACKING_NOTIFICATION_BODY,
    });
  });

  it('never mentions miscarriage, periods, fertility or conception in the OS-visible text', async () => {
    mockGetMiscarriagePreferences.mockReturnValue({
      ...DEFAULT_PREFS,
      dailyTrackingReminderEnabled: true,
      dailyTrackingReminderTime: '19:00',
    });

    await syncMiscarriageDailyTrackingReminder();

    const call = mockScheduleLocalNotification.mock.calls[0][0];
    const forbidden = /fausse couche|règles|période|fertil|ovulation|conception|retard/i;
    expect(call.title).not.toMatch(forbidden);
    expect(call.body).not.toMatch(forbidden);
  });
});
