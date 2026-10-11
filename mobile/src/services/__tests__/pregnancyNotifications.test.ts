import notifee from '@notifee/react-native';

import {scheduleLocalNotification, cancelLocalNotification} from '../pregnancyNotifications';
import {getPrivacySecuritySettings, loadSecurityPreferences} from '../../state/securityPreferences';
import i18n from '../../i18n';
import {setAppLanguage} from '../../state/themePreferences';

// pregnancyNotifications.ts is AWA's single privacy-redaction chokepoint: every
// reminder system in the app (Cycle, TTC, Contraception, SOPK, Pregnancy,
// Postpartum, Nifas, Menopause, Qadaa, Miscarriage) schedules through
// scheduleLocalNotification(), and this is the only place "Notifications
// discrètes" / "Masquer l'aperçu des notifications" / "Mode discret" are
// applied. It had zero direct test coverage before this file — every other
// scheduler test mocks this module away rather than exercising its own
// redaction logic. These tests exercise the actual effective OS-visible
// payload (title/body sent to notifee.createTriggerNotification), not a
// snapshot, for each privacy setting individually and in combination.
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn().mockResolvedValue('pregnancy-reminders'),
    requestPermission: jest.fn().mockResolvedValue({authorizationStatus: 1}),
    createTriggerNotification: jest.fn().mockResolvedValue(undefined),
    cancelTriggerNotification: jest.fn().mockResolvedValue(undefined),
    cancelNotification: jest.fn().mockResolvedValue(undefined),
    cancelDisplayedNotification: jest.fn().mockResolvedValue(undefined),
  },
  AlarmType: {SET: 0, SET_AND_ALLOW_WHILE_IDLE: 1, SET_EXACT: 2, SET_EXACT_AND_ALLOW_WHILE_IDLE: 3, SET_ALARM_CLOCK: 4},
  AndroidImportance: {HIGH: 4},
  AndroidVisibility: {PRIVATE: 1},
  AuthorizationStatus: {NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1},
  RepeatFrequency: {NONE: -1, HOURLY: 0, DAILY: 1, WEEKLY: 2},
  TriggerType: {TIMESTAMP: 0, INTERVAL: 1},
}));

jest.mock('../../state/securityPreferences', () => ({
  loadSecurityPreferences: jest.fn().mockResolvedValue(undefined),
  getPrivacySecuritySettings: jest.fn(),
}));

const mockCreateTrigger = notifee.createTriggerNotification as jest.Mock;
const mockRequestPermission = notifee.requestPermission as jest.Mock;
const mockGetPrivacySettings = getPrivacySecuritySettings as jest.Mock;

const ALL_OFF = {
  discreetMode: false,
  discreetNotifications: false,
  hideNotificationPreview: false,
  intimacyProtection: true,
  privateContentProtection: true,
  anonymousMode: false,
};

const FUTURE_DATE = new Date(Date.now() + 60 * 60 * 1000);

function baseInput(overrides: Partial<Parameters<typeof scheduleLocalNotification>[0]> = {}) {
  return {
    id: 'test-reminder',
    title: 'Rendez-vous gynécologue',
    body: 'Ton rendez-vous est prévu dans 1 heure.',
    fireDate: FUTURE_DATE,
    data: {hawaNotificationKind: 'test-kind', inAppTitle: 'Rendez-vous gynécologue', inAppMessage: 'Ton rendez-vous est prévu dans 1 heure.'},
    ...overrides,
  };
}

function lastNotificationPayload() {
  return mockCreateTrigger.mock.calls[mockCreateTrigger.mock.calls.length - 1][0];
}

function lastTrigger() {
  return mockCreateTrigger.mock.calls[mockCreateTrigger.mock.calls.length - 1][1];
}

beforeEach(async () => {
  jest.clearAllMocks();
  mockRequestPermission.mockResolvedValue({authorizationStatus: 1});
  mockGetPrivacySettings.mockReturnValue({...ALL_OFF});
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's redaction fallback-text assertions were written against the
  // French default. Pinning French explicitly here preserves every test's
  // original intent without depending on the current app-wide default.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

describe('scheduleLocalNotification — privacy redaction', () => {
  it('normal: sends the real title/body when all 3 privacy settings are off', async () => {
    await scheduleLocalNotification(baseInput());

    const payload = lastNotificationPayload();
    expect(payload.title).toBe('Rendez-vous gynécologue');
    expect(payload.body).toBe('Ton rendez-vous est prévu dans 1 heure.');
  });

  it('redacts when discreetNotifications alone is on', async () => {
    mockGetPrivacySettings.mockReturnValue({...ALL_OFF, discreetNotifications: true});
    await scheduleLocalNotification(baseInput());

    const payload = lastNotificationPayload();
    expect(payload.title).toBe('AWA');
    expect(payload.body).toBe('Tu as un nouveau rappel AWA.');
  });

  it('redacts when hideNotificationPreview alone is on', async () => {
    mockGetPrivacySettings.mockReturnValue({...ALL_OFF, hideNotificationPreview: true});
    await scheduleLocalNotification(baseInput());

    const payload = lastNotificationPayload();
    expect(payload.title).toBe('AWA');
    expect(payload.body).toBe('Tu as un nouveau rappel AWA.');
  });

  it('redacts when discreetMode ("Mode discret / pudeur") alone is on', async () => {
    mockGetPrivacySettings.mockReturnValue({...ALL_OFF, discreetMode: true});
    await scheduleLocalNotification(baseInput());

    const payload = lastNotificationPayload();
    expect(payload.title).toBe('AWA');
    expect(payload.body).toBe('Tu as un nouveau rappel AWA.');
  });

  it('combination A: discreetNotifications + hideNotificationPreview on, discreetMode off — still redacts', async () => {
    mockGetPrivacySettings.mockReturnValue({
      ...ALL_OFF,
      discreetNotifications: true,
      hideNotificationPreview: true,
    });
    await scheduleLocalNotification(baseInput());

    const payload = lastNotificationPayload();
    expect(payload.title).toBe('AWA');
    expect(payload.body).toBe('Tu as un nouveau rappel AWA.');
  });

  it('combination B: discreetNotifications + discreetMode on, hideNotificationPreview off — still redacts', async () => {
    mockGetPrivacySettings.mockReturnValue({
      ...ALL_OFF,
      discreetNotifications: true,
      discreetMode: true,
    });
    await scheduleLocalNotification(baseInput());

    const payload = lastNotificationPayload();
    expect(payload.title).toBe('AWA');
    expect(payload.body).toBe('Tu as un nouveau rappel AWA.');
  });

  it('combination C: hideNotificationPreview + discreetMode on, discreetNotifications off — still redacts', async () => {
    mockGetPrivacySettings.mockReturnValue({
      ...ALL_OFF,
      hideNotificationPreview: true,
      discreetMode: true,
    });
    await scheduleLocalNotification(baseInput());

    const payload = lastNotificationPayload();
    expect(payload.title).toBe('AWA');
    expect(payload.body).toBe('Tu as un nouveau rappel AWA.');
  });

  it('combination D: all three privacy settings on — still redacts (no accidental restore of sensitive content)', async () => {
    mockGetPrivacySettings.mockReturnValue({
      ...ALL_OFF,
      discreetNotifications: true,
      hideNotificationPreview: true,
      discreetMode: true,
    });
    await scheduleLocalNotification(baseInput());

    const payload = lastNotificationPayload();
    expect(payload.title).toBe('AWA');
    expect(payload.body).toBe('Tu as un nouveau rappel AWA.');
  });

  it('never redacts the data payload — inAppTitle/inAppMessage always carry the real content for the in-app bell center', async () => {
    mockGetPrivacySettings.mockReturnValue({
      ...ALL_OFF,
      discreetNotifications: true,
      hideNotificationPreview: true,
      discreetMode: true,
    });
    const input = baseInput();
    await scheduleLocalNotification(input);

    const payload = lastNotificationPayload();
    expect(payload.data).toEqual(input.data);
    expect(payload.data.inAppTitle).toBe('Rendez-vous gynécologue');
    expect(payload.data.inAppMessage).toBe('Ton rendez-vous est prévu dans 1 heure.');
  });

  it('reads privacy settings fresh on every call — a setting flipped between two schedules changes the very next payload', async () => {
    await scheduleLocalNotification(baseInput({id: 'a'}));
    expect(lastNotificationPayload().title).toBe('Rendez-vous gynécologue');

    mockGetPrivacySettings.mockReturnValue({...ALL_OFF, discreetMode: true});
    await scheduleLocalNotification(baseInput({id: 'b'}));
    expect(lastNotificationPayload().title).toBe('AWA');

    mockGetPrivacySettings.mockReturnValue({...ALL_OFF});
    await scheduleLocalNotification(baseInput({id: 'c'}));
    expect(lastNotificationPayload().title).toBe('Rendez-vous gynécologue');
  });

  it('awaits loadSecurityPreferences before reading settings on every schedule', async () => {
    await scheduleLocalNotification(baseInput());
    expect(loadSecurityPreferences).toHaveBeenCalled();
  });

  it('replaces the pending trigger IN PLACE (upsert by id): no cancel-then-create window in which no trigger exists', async () => {
    (notifee.cancelTriggerNotification as jest.Mock).mockClear();
    await scheduleLocalNotification(baseInput());
    // notifee stores INSERT OR REPLACE by id and the alarm's PendingIntent is updated in place, so the create alone
    // replaces the old trigger. A cancel first would leave a gap (a kill or a lost insert = no reminder at all).
    expect(notifee.cancelTriggerNotification).not.toHaveBeenCalled();
    expect(mockCreateTrigger).toHaveBeenCalledTimes(1);
  });

  it('but a reminder that can no longer be scheduled (time passed) still cancels the trigger pending for its old time', async () => {
    (notifee.cancelTriggerNotification as jest.Mock).mockClear();
    await scheduleLocalNotification(baseInput({fireDate: new Date(Date.now() - 1000)}));
    expect(notifee.cancelTriggerNotification).toHaveBeenCalledWith('test-reminder');
  });

  it('never schedules for a fireDate already in the past', async () => {
    await scheduleLocalNotification(baseInput({fireDate: new Date(Date.now() - 1000)}));
    expect(mockCreateTrigger).not.toHaveBeenCalled();
  });

  it('schedules through AlarmManager (SET_AND_ALLOW_WHILE_IDLE), never notifee\'s WorkManager default — this is THE fix for reminders not arriving on a real, backgrounded/idle Android device', async () => {
    await scheduleLocalNotification(baseInput());
    const trigger = lastTrigger();
    expect(trigger.alarmManager).toBeDefined();
    expect(trigger.alarmManager.type).toBe(1); // AlarmType.SET_AND_ALLOW_WHILE_IDLE
  });

  it('the AlarmManager routing applies to a repeating (daily) reminder too', async () => {
    await scheduleLocalNotification(baseInput({repeatFrequency: 'daily'}));
    const trigger = lastTrigger();
    expect(trigger.alarmManager).toBeDefined();
    expect(trigger.alarmManager.type).toBe(1);
    expect(trigger.repeatFrequency).toBe(1); // RepeatFrequency.DAILY
  });

  it('never schedules when notification permission is denied', async () => {
    // ensureNotificationPermission() memoizes notifee.requestPermission() at
    // module scope for the life of the process, so the shared top-level
    // import (already exercised as "granted" by every test above) can't be
    // flipped to "denied" — this needs its own isolated module instance,
    // never requiring requestPermission() before this point.
    let resultPromise: Promise<boolean>;
    let freshNotifee: any;
    jest.isolateModules(() => {
      freshNotifee = require('@notifee/react-native').default;
      freshNotifee.requestPermission = jest.fn().mockResolvedValue({authorizationStatus: 0});
      require('../../state/securityPreferences').getPrivacySecuritySettings.mockReturnValue({...ALL_OFF});
      const fresh = require('../pregnancyNotifications');
      resultPromise = fresh.scheduleLocalNotification(baseInput({id: 'denied'}));
    });
    await resultPromise!;
    expect(freshNotifee!.createTriggerNotification).not.toHaveBeenCalled();
  });
});

describe('cancelLocalNotification', () => {
  it('cancels both trigger and displayed notifications by id, swallowing errors', async () => {
    (notifee.cancelTriggerNotification as jest.Mock).mockRejectedValueOnce(new Error('none scheduled'));
    (notifee.cancelNotification as jest.Mock).mockRejectedValueOnce(new Error('none displayed'));
    await expect(cancelLocalNotification('missing-id')).resolves.toBe(false);
  });

  it('cancels only the PENDING trigger by default — a reminder already on screen is never dismissed by a sync', async () => {
    (notifee.cancelTriggerNotification as jest.Mock).mockClear();
    (notifee.cancelNotification as jest.Mock).mockClear();
    (notifee.cancelDisplayedNotification as jest.Mock).mockClear();
    await expect(cancelLocalNotification('some-id')).resolves.toBe(true);
    expect(notifee.cancelTriggerNotification).toHaveBeenCalledWith('some-id');
    // notifee.cancelNotification removes DISPLAYED notifications as well, so it is never used here.
    expect(notifee.cancelNotification).not.toHaveBeenCalled();
    expect(notifee.cancelDisplayedNotification).not.toHaveBeenCalled();
  });

  it('removes the copy already in the shade only when asked (the user deleted the reminder)', async () => {
    (notifee.cancelTriggerNotification as jest.Mock).mockClear();
    (notifee.cancelNotification as jest.Mock).mockClear();
    (notifee.cancelDisplayedNotification as jest.Mock).mockClear();
    await expect(cancelLocalNotification('gone-id', {dismissDisplayed: true})).resolves.toBe(true);
    expect(notifee.cancelTriggerNotification).toHaveBeenCalledWith('gone-id');
    expect(notifee.cancelDisplayedNotification).toHaveBeenCalledWith('gone-id');
    expect(notifee.cancelNotification).not.toHaveBeenCalled();
  });

  it('reports a failed native cancellation as false, and still attempts the displayed one when asked', async () => {
    (notifee.cancelTriggerNotification as jest.Mock).mockRejectedValueOnce(new Error('native'));
    (notifee.cancelDisplayedNotification as jest.Mock).mockClear();
    await expect(cancelLocalNotification('other-id', {dismissDisplayed: true})).resolves.toBe(false);
    expect(notifee.cancelDisplayedNotification).toHaveBeenCalledWith('other-id');
  });
});
