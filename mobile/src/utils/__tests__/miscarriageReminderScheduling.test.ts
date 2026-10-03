import {
  syncMiscarriageDailyTrackingReminder,
  MISCARRIAGE_DAILY_TRACKING_NOTIFICATION_KIND,
  miscarriageDailyTrackingNotificationTitle,
  miscarriageDailyTrackingNotificationBody,
} from '../miscarriageReminderScheduling';
import {scheduleLocalNotification, cancelLocalNotification} from '../../services/pregnancyNotifications';
import {getActiveObjective} from '../../state/onboardingPreferences';
import {getMiscarriagePreferences} from '../../state/miscarriagePreferences';
import i18n from '../../i18n';
import {setAppLanguage} from '../../state/themePreferences';

// PHASE 7M: computed fresh (not as a module-level const) — a module-level
// const would snapshot i18n.t's result at import time, before any test's
// beforeEach has pinned the language, baking in whatever the app's default
// language happens to be instead of the language actually active when each
// test runs.
const miscarriageDailyTrackingTitle = () => miscarriageDailyTrackingNotificationTitle(i18n.t);
const miscarriageDailyTrackingBody = () => miscarriageDailyTrackingNotificationBody(i18n.t);

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

beforeEach(async () => {
  jest.clearAllMocks();
  mockScheduleLocalNotification.mockResolvedValue(true);
  mockCancelLocalNotification.mockResolvedValue(undefined);
  mockGetActiveObjective.mockReturnValue('loss');
  mockGetMiscarriagePreferences.mockReturnValue({...DEFAULT_PREFS});
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's text assertions were written against the French default. Pinning
  // French explicitly here preserves every test's original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
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
    expect(call.title).toBe(miscarriageDailyTrackingTitle());
    expect(call.body).toBe('Si tu le souhaites, prends un moment pour noter comment tu te sens aujourd’hui.');
    expect(call.body).toBe(miscarriageDailyTrackingBody());
    expect(call.repeatFrequency).toBe('daily');
    expect(call.fireDate).toBeInstanceOf(Date);
    expect(call.data).toEqual({
      hawaNotificationKind: MISCARRIAGE_DAILY_TRACKING_NOTIFICATION_KIND,
      inAppTitle: miscarriageDailyTrackingTitle(),
      inAppMessage: miscarriageDailyTrackingBody(),
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

  // Phase 4 localization: re-running the SAME sync function after the app
  // language changes must rebuild the notification with the new language's
  // text at the exact same id/fire time (upsert semantics of
  // scheduleLocalNotification(), never a second notification).
  it('language change: re-syncing after switching to English reschedules the same id with English text, same fire time', async () => {
    mockGetMiscarriagePreferences.mockReturnValue({
      ...DEFAULT_PREFS,
      dailyTrackingReminderEnabled: true,
      dailyTrackingReminderTime: '19:00',
    });

    await syncMiscarriageDailyTrackingReminder();
    const frCall = mockScheduleLocalNotification.mock.calls[0][0];
    expect(frCall.title).toBe('Ton suivi du jour 🌿');

    await i18n.changeLanguage('en');
    try {
      jest.clearAllMocks();
      mockScheduleLocalNotification.mockResolvedValue(true);
      mockGetActiveObjective.mockReturnValue('loss');
      mockGetMiscarriagePreferences.mockReturnValue({
        ...DEFAULT_PREFS,
        dailyTrackingReminderEnabled: true,
        dailyTrackingReminderTime: '19:00',
      });

      await syncMiscarriageDailyTrackingReminder();

      expect(mockScheduleLocalNotification).toHaveBeenCalledTimes(1);
      const enCall = mockScheduleLocalNotification.mock.calls[0][0];
      expect(enCall.id).toBe(frCall.id);
      expect(enCall.fireDate.getHours()).toBe(frCall.fireDate.getHours());
      expect(enCall.fireDate.getMinutes()).toBe(frCall.fireDate.getMinutes());
      expect(enCall.repeatFrequency).toBe(frCall.repeatFrequency);
      expect(enCall.title).toBe('Your tracking for today 🌿');
      expect(enCall.title).not.toBe(frCall.title);
    } finally {
      await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
    }
  });
});
