import notifee from '@notifee/react-native';

import {scheduleLocalNotification, cancelLocalNotification} from '../pregnancyNotifications';
import {getPrivacySecuritySettings, loadSecurityPreferences} from '../../state/securityPreferences';

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
  },
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

beforeEach(() => {
  jest.clearAllMocks();
  mockRequestPermission.mockResolvedValue({authorizationStatus: 1});
  mockGetPrivacySettings.mockReturnValue({...ALL_OFF});
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

  it('cancels any existing notification with the same id before rescheduling (upsert semantics)', async () => {
    await scheduleLocalNotification(baseInput());
    expect(notifee.cancelTriggerNotification).toHaveBeenCalledWith('test-reminder');
  });

  it('never schedules for a fireDate already in the past', async () => {
    await scheduleLocalNotification(baseInput({fireDate: new Date(Date.now() - 1000)}));
    expect(mockCreateTrigger).not.toHaveBeenCalled();
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
    await expect(cancelLocalNotification('missing-id')).resolves.toBeUndefined();
  });
});
