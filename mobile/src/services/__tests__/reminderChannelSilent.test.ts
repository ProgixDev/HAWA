import notifee from '@notifee/react-native';

import {
  __resetNotificationServiceForTests,
  getReminderDeliveryState,
  isReminderChannelSilent,
  openReminderChannelSettings,
  scheduleLocalNotificationWithResult,
} from '../pregnancyNotifications';
import {fakeNotifeeState, resetFakeNotifee} from '../../testUtils/fakeNotifee';

// The reminders channel may have been created silent by an older version (or muted on purpose). AWA must NEVER fix
// that by deleting/recreating the channel or minting a replacement: it only reports 'channel-silent' (a gentle
// hint) and opens the channel's page in Android settings.
jest.mock('@notifee/react-native', () => require('../../testUtils/fakeNotifee').notifeeModule);
jest.mock('../../state/securityPreferences', () => ({
  loadSecurityPreferences: jest.fn().mockResolvedValue(undefined),
  getPrivacySecuritySettings: jest.fn(() => ({discreetMode: false, discreetNotifications: false, hideNotificationPreview: false})),
}));

const CHANNEL = 'pregnancy-reminders';
const HIGH = 4;
const LOW = 2;

beforeEach(() => {
  resetFakeNotifee();
  __resetNotificationServiceForTests();
});

describe('isReminderChannelSilent', () => {
  it.each([
    ['importance HIGH with a sound', {importance: HIGH, sound: 'default'}, false],
    ['importance HIGH with a soundURI', {importance: HIGH, soundURI: 'content://settings/system/notification_sound'}, false],
    ['importance HIGH and no sound at all (created silent by an older version)', {importance: HIGH}, true],
    // notifee never reports the text "none": any non-empty sound field means a sound exists, so never a false "silent".
    ['a non-empty sound field is a sound, whatever its text', {importance: HIGH, sound: 'none'}, false],
    ['sound fields of an unexpected type are not trusted', {importance: HIGH, sound: 7}, false],
    ['soundURI of an unexpected type is not trusted', {importance: HIGH, soundURI: {}}, false],
    ['native shape: default sound reports only soundURI', {importance: HIGH, soundURI: 'content://settings/system/notification_sound', blocked: false}, false],
    ['native shape: custom raw sound reports soundURI and sound', {importance: HIGH, soundURI: 'android.resource://pkg/123', sound: 'chime'}, false],
    ['native shape: no sound reports neither field', {importance: HIGH, vibration: true, blocked: false}, true],
    ['importance lowered below DEFAULT', {importance: LOW, sound: 'default'}, true],
    ['vibration off but sound on is not silent', {importance: HIGH, sound: 'default', vibration: false}, false],
    ['importance NONE is the blocked case, reported elsewhere', {importance: 0}, false],
    ['no importance: record not trusted', {sound: undefined}, false],
    ['null channel', null, false],
    ['non-object', 'x', false],
  ])('%s', (_name, channel, expected) => {
    expect(isReminderChannelSilent(channel)).toBe(expected);
  });
});

describe('what the fake reports for getChannel (mirrors notifee 9.1.8 Android: soundURI iff the channel has a sound)', () => {
  it('a channel created with sound "default" reports soundURI (and no `sound`): ready', async () => {
    await notifee.createChannel({id: CHANNEL, name: 'AWA', importance: HIGH, sound: 'default', vibration: true} as any);
    const reported: any = await notifee.getChannel(CHANNEL);
    expect(reported.soundURI).toEqual(expect.any(String));
    expect(reported.sound).toBeUndefined();
    expect(reported.blocked).toBe(false);
    await expect(getReminderDeliveryState()).resolves.toBe('ready');
  });

  it('a channel created WITHOUT sound reports no sound field at all: channel-silent', async () => {
    await notifee.createChannel({id: CHANNEL, name: 'AWA', importance: HIGH} as any);
    const reported: any = await notifee.getChannel(CHANNEL);
    expect(reported.soundURI).toBeUndefined();
    expect(reported.sound).toBeUndefined();
    await expect(getReminderDeliveryState()).resolves.toBe('channel-silent');
  });

  it('the user setting the sound to None later (stored sound removed) is reported as silent', async () => {
    await notifee.createChannel({id: CHANNEL, name: 'AWA', importance: HIGH, sound: 'default'} as any);
    fakeNotifeeState.channels.set(CHANNEL, {...fakeNotifeeState.channels.get(CHANNEL), sound: undefined, soundURI: undefined});
    await expect(getReminderDeliveryState()).resolves.toBe('channel-silent');
  });

  it('importance NONE reports blocked: true and is not judged silent', async () => {
    fakeNotifeeState.channels.set(CHANNEL, {id: CHANNEL, importance: 0, sound: 'default'});
    expect(((await notifee.getChannel(CHANNEL)) as any).blocked).toBe(true);
  });
});

describe('getReminderDeliveryState with the channel quiet', () => {
  it('reports channel-silent for a channel created without sound, and ready once it has one', async () => {
    fakeNotifeeState.channels.set(CHANNEL, {id: CHANNEL, name: 'AWA', importance: HIGH});
    await expect(getReminderDeliveryState()).resolves.toBe('channel-silent');

    fakeNotifeeState.channels.set(CHANNEL, {id: CHANNEL, name: 'AWA', importance: HIGH, sound: 'default'});
    await expect(getReminderDeliveryState()).resolves.toBe('ready');
  });

  it('a missing channel (never created) is ready, not a problem', async () => {
    await expect(getReminderDeliveryState()).resolves.toBe('ready');
  });

  it('an unreadable channel is ready, never alarming', async () => {
    (notifee.getChannel as jest.Mock).mockRejectedValueOnce(new Error('native error'));
    await expect(getReminderDeliveryState()).resolves.toBe('ready');
  });

  it('blocked and notifications-off still win over silent', async () => {
    fakeNotifeeState.channels.set(CHANNEL, {id: CHANNEL, importance: HIGH});
    fakeNotifeeState.blockedChannels.add(CHANNEL);
    await expect(getReminderDeliveryState()).resolves.toBe('channel-blocked');

    fakeNotifeeState.blockedChannels.clear();
    fakeNotifeeState.authorizationStatus = 0;
    await expect(getReminderDeliveryState()).resolves.toBe('notifications-off');
  });

  it('reading the state never creates, deletes or edits the channel (a mute stays as the user left it)', async () => {
    const muted = {id: CHANNEL, name: 'AWA', importance: LOW};
    fakeNotifeeState.channels.set(CHANNEL, muted);

    await expect(getReminderDeliveryState()).resolves.toBe('channel-silent');

    expect(notifee.createChannel).not.toHaveBeenCalled();
    expect(notifee.deleteChannel).not.toHaveBeenCalled();
    expect(fakeNotifeeState.channels.get(CHANNEL)).toBe(muted);
  });
});

describe('opening the channel settings', () => {
  it('opens the reminders channel page and touches no channel', async () => {
    fakeNotifeeState.channels.set(CHANNEL, {id: CHANNEL, importance: LOW});

    await openReminderChannelSettings();

    expect(notifee.openNotificationSettings).toHaveBeenCalledWith(CHANNEL);
    expect(notifee.createChannel).not.toHaveBeenCalled();
    expect(notifee.deleteChannel).not.toHaveBeenCalled();
    expect(Array.from(fakeNotifeeState.channels.keys())).toEqual([CHANNEL]);
  });

  it('falls back to the app-level page when the channel page cannot be opened, and never throws', async () => {
    (notifee.openNotificationSettings as jest.Mock)
      .mockRejectedValueOnce(new Error('no channel page'))
      .mockResolvedValueOnce(undefined);

    await expect(openReminderChannelSettings()).resolves.toBeUndefined();
    expect((notifee.openNotificationSettings as jest.Mock).mock.calls).toEqual([[CHANNEL], []]);
  });
});

describe('scheduling keeps a muted channel as it is', () => {
  it('re-upserts the existing channel without replacing the user choice or adding a second channel', async () => {
    fakeNotifeeState.channels.set(CHANNEL, {id: CHANNEL, name: 'old', importance: LOW});

    await scheduleLocalNotificationWithResult({
      id: 'r1',
      title: 't',
      body: 'b',
      fireDate: new Date(Date.now() + 3_600_000),
    });

    expect(notifee.deleteChannel).not.toHaveBeenCalled();
    expect(Array.from(fakeNotifeeState.channels.keys())).toEqual([CHANNEL]);
    expect(fakeNotifeeState.channels.get(CHANNEL)).toMatchObject({importance: LOW});
  });
});
