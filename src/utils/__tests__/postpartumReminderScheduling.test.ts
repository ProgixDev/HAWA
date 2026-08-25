import {
  syncPostpartumDailyTrackingReminder,
  POSTPARTUM_DAILY_TRACKING_NOTIFICATION_KIND,
} from '../postpartumReminderScheduling';
import {scheduleLocalNotification, cancelLocalNotification} from '../../services/pregnancyNotifications';
import {getActiveObjective} from '../../state/onboardingPreferences';
import {getPostpartumPreferences} from '../../state/postpartumPreferences';

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
jest.mock('../../state/postpartumPreferences', () => ({
  getPostpartumPreferences: jest.fn(),
}));

const mockScheduleLocalNotification = scheduleLocalNotification as jest.Mock;
const mockCancelLocalNotification = cancelLocalNotification as jest.Mock;
const mockGetActiveObjective = getActiveObjective as jest.Mock;
const mockGetPostpartumPreferences = getPostpartumPreferences as jest.Mock;

const DEFAULT_PREFS = {
  deliveryDate: '2026-08-01',
  startedAt: '2026-08-01T00:00:00.000Z',
  deliveryType: null,
  feedingType: null,
  firstPostpartumPeriodDate: null,
  dailyTrackingReminderEnabled: false,
  dailyTrackingReminderTime: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockScheduleLocalNotification.mockResolvedValue(true);
  mockCancelLocalNotification.mockResolvedValue(undefined);
  mockGetActiveObjective.mockReturnValue('postpartum');
  mockGetPostpartumPreferences.mockReturnValue({...DEFAULT_PREFS});
});

describe('syncPostpartumDailyTrackingReminder', () => {
  it('cancels and never schedules when the active objective is not postpartum', async () => {
    mockGetActiveObjective.mockReturnValue('cycle');
    mockGetPostpartumPreferences.mockReturnValue({
      ...DEFAULT_PREFS,
      dailyTrackingReminderEnabled: true,
      dailyTrackingReminderTime: '20:00',
    });

    await syncPostpartumDailyTrackingReminder();

    expect(mockScheduleLocalNotification).not.toHaveBeenCalled();
    expect(mockCancelLocalNotification).toHaveBeenCalledWith('postpartum-daily-tracking-reminder');
  });

  it('cancels when the reminder is disabled', async () => {
    mockGetPostpartumPreferences.mockReturnValue({
      ...DEFAULT_PREFS,
      dailyTrackingReminderEnabled: false,
      dailyTrackingReminderTime: '20:00',
    });

    await syncPostpartumDailyTrackingReminder();

    expect(mockScheduleLocalNotification).not.toHaveBeenCalled();
    expect(mockCancelLocalNotification).toHaveBeenCalledWith('postpartum-daily-tracking-reminder');
  });

  it('never schedules a fabricated default time when enabled but no time was chosen', async () => {
    mockGetPostpartumPreferences.mockReturnValue({
      ...DEFAULT_PREFS,
      dailyTrackingReminderEnabled: true,
      dailyTrackingReminderTime: null,
    });

    await syncPostpartumDailyTrackingReminder();

    expect(mockScheduleLocalNotification).not.toHaveBeenCalled();
    expect(mockCancelLocalNotification).toHaveBeenCalledWith('postpartum-daily-tracking-reminder');
  });

  it('schedules a recurring daily notification with neutral wording when active, enabled and timed', async () => {
    mockGetPostpartumPreferences.mockReturnValue({
      ...DEFAULT_PREFS,
      dailyTrackingReminderEnabled: true,
      dailyTrackingReminderTime: '20:00',
    });

    await syncPostpartumDailyTrackingReminder();

    expect(mockCancelLocalNotification).not.toHaveBeenCalled();
    expect(mockScheduleLocalNotification).toHaveBeenCalledTimes(1);
    const call = mockScheduleLocalNotification.mock.calls[0][0];
    expect(call.id).toBe('postpartum-daily-tracking-reminder');
    expect(call.title).toBe('Ton suivi du jour');
    expect(call.body).toBe('Prends un moment pour noter comment tu te sens aujourd’hui.');
    expect(call.repeatFrequency).toBe('daily');
    expect(call.fireDate).toBeInstanceOf(Date);
    expect(call.data).toEqual({hawaNotificationKind: POSTPARTUM_DAILY_TRACKING_NOTIFICATION_KIND});
  });
});
