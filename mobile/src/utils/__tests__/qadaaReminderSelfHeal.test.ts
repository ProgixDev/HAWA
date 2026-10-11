import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import {STRUCTURED_KEY_SERVICE} from '../../services/structuredEncryption';
import {hijriMonthStart, isRamadan, nextHijriMonthStart} from '../hijriCalendar';

// POST-RAMADAN QADAA REMINDER — what the saved snapshot may and may not be trusted for (audit finding F12).
//
// The scheduler keeps a snapshot of "what I scheduled" and used to skip all work when the snapshot still matched the
// month — without asking Android whether the trigger was still there. An OEM task killer, an app update or a reboot
// gap could therefore leave a reminder that existed only in the snapshot, and a privacy-setting change was ignored
// by that short-circuit (already-scheduled text stayed un-redacted). Proven here with the REAL stores, the REAL
// notification chokepoint and a stateful fake notifee:
//   - plain sync: reuse only when native still has the trigger pending (or its moment passed): no duplicate create
//     when everything is fine, a re-arm when the trigger vanished or the pending list cannot be read;
//   - a first attempt that failed (notifications off) is retried once they are on;
//   - forced sync: re-derives ignoring the snapshot, replaces IN PLACE (never cancelled first), re-redacts the text,
//     and on the first day of Shawwal — when the in-Ramadan derivation no longer applies — still keeps the reminder.
// Each test is a fresh process. It proves JavaScript behaviour only — not that a phone delivers anything.

jest.mock('@notifee/react-native', () => require('../../testUtils/fakeNotifee').notifeeModule);

const RAMADAN_DAY = (() => {
  for (let offset = 0; offset < 40; offset += 1) {
    const candidate = new Date(2025, 1, 15 + offset);
    if (isRamadan(candidate) && !isRamadan(new Date(2025, 1, 14 + offset))) {
      return new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate() + 5, 10, 0, 0);
    }
  }
  throw new Error('Ramadan start not found');
})();
// The reminder's own moment: 09:00 on the first day of Shawwal (what the scheduler derives, from the same helpers).
const SHAWWAL_FIRST = nextHijriMonthStart(hijriMonthStart(RAMADAN_DAY));
const REMINDER_AT = new Date(SHAWWAL_FIRST.getFullYear(), SHAWWAL_FIRST.getMonth(), SHAWWAL_FIRST.getDate(), 9, 0, 0, 0);
const onShawwalFirst = (hours: number, minutes = 0) =>
  new Date(SHAWWAL_FIRST.getFullYear(), SHAWWAL_FIRST.getMonth(), SHAWWAL_FIRST.getDate(), hours, minutes, 0, 0);

const QADAA_ID = 'qadaa-post-ramadan-reminder';
const STATE_KEY = '@hawa/qadaa-post-ramadan-reminder/v1';

type Fake = typeof import('../../testUtils/fakeNotifee');

const M = {
  fake: () => require('../../testUtils/fakeNotifee') as Fake,
  secure: () => require('../../services/secureAsyncStorage') as typeof import('../../services/secureAsyncStorage'),
  onboarding: () => require('../../state/onboardingPreferences') as typeof import('../../state/onboardingPreferences'),
  ledger: () => require('../../state/qadaaLedgerStore') as typeof import('../../state/qadaaLedgerStore'),
  state: () => require('../../state/qadaaReminderNotificationStore') as typeof import('../../state/qadaaReminderNotificationStore'),
  qadaa: () => require('../qadaaReminderScheduling') as typeof import('../qadaaReminderScheduling'),
  security: () => require('../../state/securityPreferences') as typeof import('../../state/securityPreferences'),
  i18n: () => (require('../../i18n') as {default: typeof import('../../i18n').default}).default,
};

jest.setTimeout(60_000);

const asyncStorage = () =>
  (require('@react-native-async-storage/async-storage') as {default: typeof AsyncStorage}).default;

const settle = async () => {
  for (let index = 0; index < 40; index += 1) {
    await new Promise<void>(resolve => setImmediate(resolve));
  }
};

function coldStart(surviving?: ReadonlyMap<string, unknown>): void {
  jest.resetModules();
  const fake = M.fake();
  fake.resetFakeNotifee();
  surviving?.forEach((record, id) => fake.fakeNotifeeState.triggers.set(id, record as never));
  M.secure().resetStructuredStorageForTests();
}

const creates = () => (M.fake().notifee.createTriggerNotification as jest.Mock).mock.calls.length;
const cancelsOfQadaa = () => {
  const {notifee} = M.fake();
  const single = (notifee.cancelTriggerNotification as jest.Mock).mock.calls.filter(([id]) => id === QADAA_ID);
  const many = (notifee.cancelTriggerNotifications as jest.Mock).mock.calls.filter(([ids]) => Array.isArray(ids) && ids.includes(QADAA_ID));
  return single.length + many.length;
};
const pending = () => M.fake().fakeNotifeeState.triggers.get(QADAA_ID) as
  | {notification: {title: string; body: string; data: {inAppOccurrenceId: string}}; trigger: {timestamp: number}}
  | undefined;
const snapshot = () => M.state().getQadaaReminderNotificationState();

/** 3 historical days owed, spiritual markers on, in Ramadan — the reminder is due to be armed. */
async function seedOwed(): Promise<void> {
  M.onboarding().setSpiritualMarkersEnabled(true);
  await M.ledger().hydrateQadaaLedger();
  await M.ledger().addManualQadaaEntry({quantity: 3, year: 2016, yearSystem: 'gregorian'});
  await settle();
}

beforeAll(() => {
  jest.useFakeTimers({now: RAMADAN_DAY, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask']});
});

afterAll(() => {
  jest.useRealTimers();
  jest.resetModules();
});

beforeEach(async () => {
  jest.setSystemTime(RAMADAN_DAY);
  await AsyncStorage.clear();
  await Keychain.resetGenericPassword({service: STRUCTURED_KEY_SERVICE});
  coldStart();
});

describe('plain sync — the snapshot is believed only while Android still holds the trigger', () => {
  it('everything fine: any number of syncs creates the trigger ONCE (no duplicate, no re-create)', async () => {
    await seedOwed();

    await M.qadaa().syncQadaaReminderNotification();
    await M.qadaa().syncQadaaReminderNotification();
    await M.qadaa().syncQadaaReminderNotification();

    expect(creates()).toBe(1);
    expect(Array.from(M.fake().fakeNotifeeState.triggers.keys())).toEqual([QADAA_ID]);
    expect(pending()?.trigger.timestamp).toBe(REMINDER_AT.getTime());
    expect(snapshot()).toMatchObject({scheduled: true, fireAt: REMINDER_AT.toISOString()});
  });

  it('the trigger vanished natively (task killer / update / reboot gap): the next plain sync re-arms it — one trigger', async () => {
    await seedOwed();
    await M.qadaa().syncQadaaReminderNotification();
    const armed = pending();
    expect(armed).toBeDefined();

    M.fake().fakeNotifeeState.triggers.delete(QADAA_ID); // the snapshot still says "scheduled"
    expect(snapshot().scheduled).toBe(true);

    await M.qadaa().syncQadaaReminderNotification();

    expect(creates()).toBe(2);
    expect(Array.from(M.fake().fakeNotifeeState.triggers.keys())).toEqual([QADAA_ID]);
    expect(pending()?.trigger.timestamp).toBe(REMINDER_AT.getTime());
    expect(pending()?.notification.data.inAppOccurrenceId).toBe(armed?.notification.data.inAppOccurrenceId);
    expect(snapshot().scheduled).toBe(true);
  });

  it('the pending list cannot be read: "cannot confirm" re-schedules (an upsert by id — still one trigger)', async () => {
    await seedOwed();
    await M.qadaa().syncQadaaReminderNotification();
    expect(creates()).toBe(1);

    (M.fake().notifee.getTriggerNotificationIds as jest.Mock).mockRejectedValue(new Error('native unreadable'));
    try {
      await M.qadaa().syncQadaaReminderNotification();
    } finally {
      (M.fake().notifee.getTriggerNotificationIds as jest.Mock).mockImplementation(async () =>
        Array.from(M.fake().fakeNotifeeState.triggers.keys()),
      );
    }

    expect(creates()).toBe(2);
    expect(Array.from(M.fake().fakeNotifeeState.triggers.keys())).toEqual([QADAA_ID]);
  });

  it('the pending list itself throws: still "cannot confirm" — re-scheduled, never a crash of the sync', async () => {
    await seedOwed();
    await M.qadaa().syncQadaaReminderNotification();
    expect(creates()).toBe(1);

    const notifications = require('../../services/pregnancyNotifications') as typeof import('../../services/pregnancyNotifications');
    const spy = jest.spyOn(notifications, 'getPendingReminderIds').mockRejectedValue(new Error('bridge down'));
    try {
      await M.qadaa().syncQadaaReminderNotification();
    } finally {
      spy.mockRestore();
    }

    expect(creates()).toBe(2);
    expect(Array.from(M.fake().fakeNotifeeState.triggers.keys())).toEqual([QADAA_ID]);
  });

  it('a failed first attempt (notifications off) is retried once they are on — not treated as handled', async () => {
    await seedOwed();
    M.fake().fakeNotifeeState.authorizationStatus = 0; // Android 13+: not granted

    await M.qadaa().syncQadaaReminderNotification();
    expect(M.fake().fakeNotifeeState.triggers.has(QADAA_ID)).toBe(false);
    expect(snapshot().scheduled).toBe(false);

    M.fake().fakeNotifeeState.authorizationStatus = 1; // she turned them on in Android settings
    await M.qadaa().syncQadaaReminderNotification();

    expect(pending()?.trigger.timestamp).toBe(REMINDER_AT.getTime());
    expect(snapshot()).toMatchObject({scheduled: true});
  });

  it('a native create that throws is recorded as "not scheduled" (never a lie) and the next sync retries', async () => {
    await seedOwed();
    M.fake().fakeNotifeeState.createTriggerError = new Error('native boom');

    await expect(M.qadaa().syncQadaaReminderNotification()).rejects.toThrow('native boom');
    expect(snapshot().scheduled).toBe(false);
    expect(M.fake().fakeNotifeeState.triggers.has(QADAA_ID)).toBe(false);

    await M.qadaa().syncQadaaReminderNotification();
    expect(pending()?.trigger.timestamp).toBe(REMINDER_AT.getTime());
    expect(snapshot().scheduled).toBe(true);
  });

  it('killed between the native create and the snapshot write: the next process re-arms it in place — one trigger', async () => {
    await seedOwed();
    // The write of the reminder's own record fails (the process "dies" right after Android took the trigger).
    const setItem = asyncStorage().setItem as unknown as jest.Mock;
    const realSetItem = setItem.getMockImplementation() as (key: string, value: string) => Promise<void>;
    setItem.mockImplementation((key: string, value: string) =>
      key === STATE_KEY ? Promise.reject(new Error('process killed')) : realSetItem(key, value),
    );
    try {
      await expect(M.qadaa().syncQadaaReminderNotification()).rejects.toThrow('process killed');
    } finally {
      setItem.mockImplementation(realSetItem);
    }
    expect(M.fake().fakeNotifeeState.triggers.has(QADAA_ID)).toBe(true); // Android has it; the snapshot does not

    coldStart(new Map(M.fake().fakeNotifeeState.triggers));
    await M.qadaa().syncQadaaReminderNotification();

    expect(Array.from(M.fake().fakeNotifeeState.triggers.keys())).toEqual([QADAA_ID]);
    expect(snapshot()).toMatchObject({scheduled: true, fireAt: REMINDER_AT.toISOString()});
  });

  it('a reminder whose moment has passed (delivered) is not re-armed, and stays on screen', async () => {
    await seedOwed();
    await M.qadaa().syncQadaaReminderNotification();

    jest.setSystemTime(new Date(REMINDER_AT.getTime() + 5000)); // 09:00:05 on the first day of Shawwal
    M.fake().deliverTrigger(QADAA_ID);
    const before = creates();

    await M.qadaa().syncQadaaReminderNotification();
    await M.qadaa().forceSyncQadaaReminderNotification();

    expect(creates()).toBe(before);
    expect(M.fake().displayedIds()).toEqual([QADAA_ID]);
    expect(M.fake().fakeNotifeeState.triggers.has(QADAA_ID)).toBe(false);
  });
});

describe('forced sync — re-derives, replaces in place, never leaves the reminder cancelled', () => {
  it('re-redacts: text scheduled before the privacy setting changed is replaced by the generic text, in place', async () => {
    await seedOwed();
    await M.security().loadSecurityPreferences();
    await M.qadaa().syncQadaaReminderNotification();
    const i18n = M.i18n();
    expect(pending()?.notification.title).toBe(i18n.t('notifications.qadaa.title'));

    M.security().updatePrivacySecuritySettings({discreetNotifications: true});
    // what Android holds still carries the un-redacted text: a notification bakes its text in when it is created
    expect(pending()?.notification.title).toBe(i18n.t('notifications.qadaa.title'));

    const cancelsBefore = cancelsOfQadaa();
    await M.qadaa().forceSyncQadaaReminderNotification();

    expect(pending()?.notification.title).toBe('AWA');
    expect(pending()?.notification.body).toBe(i18n.t('notifications.privacyGenericBody'));
    expect(pending()?.trigger.timestamp).toBe(REMINDER_AT.getTime());
    expect(Array.from(M.fake().fakeNotifeeState.triggers.keys())).toEqual([QADAA_ID]);
    expect(cancelsOfQadaa()).toBe(cancelsBefore); // replaced in place: the trigger was never cancelled first
  });

  it('is idempotent: a second forced sync leaves one trigger with the identical content', async () => {
    await seedOwed();
    await M.qadaa().forceSyncQadaaReminderNotification();
    const first = JSON.stringify(pending());

    await M.qadaa().forceSyncQadaaReminderNotification();

    expect(JSON.stringify(pending())).toBe(first);
    expect(Array.from(M.fake().fakeNotifeeState.triggers.keys())).toEqual([QADAA_ID]);
    expect(snapshot().scheduled).toBe(true);
  });

  it('first day of Shawwal BEFORE the reminder hour (the audited language-change case): the reminder is kept, with fresh text', async () => {
    await seedOwed();
    await M.qadaa().syncQadaaReminderNotification();
    const i18n = M.i18n();
    await i18n.changeLanguage('en');
    const englishTitle = i18n.t('notifications.qadaa.title');
    await M.qadaa().forceSyncQadaaReminderNotification();
    expect(pending()?.notification.title).toBe(englishTitle);

    // The month has turned: 08:00 on the first day of Shawwal. Ramadan is over, so nothing is re-derived — but the
    // reminder armed during Ramadan is still ahead (09:00) and must stay.
    jest.setSystemTime(onShawwalFirst(8, 0));
    expect(isRamadan(onShawwalFirst(8, 0))).toBe(false);
    await i18n.changeLanguage('fr');
    const frenchTitle = i18n.t('notifications.qadaa.title');
    expect(frenchTitle).not.toBe(englishTitle);
    const cancelsBefore = cancelsOfQadaa();

    await M.qadaa().forceSyncQadaaReminderNotification();

    expect(pending()?.trigger.timestamp).toBe(REMINDER_AT.getTime()); // still due at 09:00…
    expect(pending()?.notification.title).toBe(frenchTitle); // …in the language she now uses
    expect(cancelsOfQadaa()).toBe(cancelsBefore); // never cancelled first
    expect(snapshot()).toMatchObject({scheduled: true, fireAt: REMINDER_AT.toISOString()});
    await i18n.changeLanguage('en');
  });

  it('first day of Shawwal before the hour: a trigger lost natively is re-armed by the plain sync as well', async () => {
    await seedOwed();
    await M.qadaa().syncQadaaReminderNotification();
    M.fake().fakeNotifeeState.triggers.delete(QADAA_ID);
    jest.setSystemTime(onShawwalFirst(8, 0));

    await M.qadaa().syncQadaaReminderNotification();

    expect(pending()?.trigger.timestamp).toBe(REMINDER_AT.getTime());
  });

  it('first day of Shawwal AFTER the hour (already delivered): nothing is created and the shade is untouched', async () => {
    await seedOwed();
    await M.qadaa().syncQadaaReminderNotification();
    jest.setSystemTime(new Date(REMINDER_AT.getTime() + 60_000));
    M.fake().deliverTrigger(QADAA_ID);
    const before = creates();

    await M.qadaa().forceSyncQadaaReminderNotification();

    expect(creates()).toBe(before);
    expect(M.fake().displayedIds()).toEqual([QADAA_ID]);
  });

  it('eligibility rules are the plain sync\'s: spiritual markers off clears it (and a later forced sync does not bring it back)', async () => {
    await seedOwed();
    await M.qadaa().syncQadaaReminderNotification();
    expect(pending()).toBeDefined();

    M.onboarding().setSpiritualMarkersEnabled(false);
    await M.qadaa().forceSyncQadaaReminderNotification();
    expect(M.fake().fakeNotifeeState.triggers.has(QADAA_ID)).toBe(false);
    expect(snapshot()).toMatchObject({scheduled: false, fireAt: null});

    await M.qadaa().forceSyncQadaaReminderNotification();
    expect(M.fake().fakeNotifeeState.triggers.has(QADAA_ID)).toBe(false);
  });

  it('nothing owed any more: a forced sync clears the reminder instead of re-arming it', async () => {
    await seedOwed();
    await M.qadaa().syncQadaaReminderNotification();
    await M.ledger().recordQadaaCompletion({quantity: 3, maxQuantity: 3});

    await M.qadaa().forceSyncQadaaReminderNotification();

    expect(M.fake().fakeNotifeeState.triggers.has(QADAA_ID)).toBe(false);
  });

  it('an unreadable record: the reminder is left exactly as it is, forced or not', async () => {
    await seedOwed();
    await M.qadaa().syncQadaaReminderNotification();
    const armed = JSON.stringify(pending());
    const writes = creates();

    M.secure().__markUnavailableForTests('awa:qadaa:ledger:v1');
    await M.qadaa().forceSyncQadaaReminderNotification();
    await M.qadaa().syncQadaaReminderNotification();

    expect(JSON.stringify(pending())).toBe(armed);
    expect(creates()).toBe(writes);
    expect(cancelsOfQadaa()).toBe(0);
  });
});

describe('operations never overlap (one queue for sync, forced sync and cancel)', () => {
  it('a burst of plain syncs creates the trigger once: runs are serialized and share one follow-up', async () => {
    await seedOwed();

    await Promise.all(Array.from({length: 10}, () => M.qadaa().syncQadaaReminderNotification()));

    expect(creates()).toBe(1);
    expect(Array.from(M.fake().fakeNotifeeState.triggers.keys())).toEqual([QADAA_ID]);
  });

  it('a forced sync and a cancel requested while a run is in flight wait their turn, in order', async () => {
    await seedOwed();
    const {notifee} = M.fake();
    const create = notifee.createTriggerNotification as jest.Mock;
    const realCreate = create.getMockImplementation() as (...args: unknown[]) => Promise<string>;
    const gates: (() => void)[] = [];
    create.mockImplementation((...args: unknown[]) => new Promise<string>(resolve => gates.push(() => resolve(realCreate(...args)))));
    try {
      const first = M.qadaa().syncQadaaReminderNotification();
      for (let index = 0; index < 60 && gates.length === 0; index += 1) {
        await new Promise<void>(resolve => setImmediate(resolve));
      }
      expect(gates.length).toBe(1); // the first run is handing the reminder to Android

      const forced = M.qadaa().forceSyncQadaaReminderNotification();
      const cancelled = M.qadaa().cancelQadaaReminderNotification();
      for (let index = 0; index < 20; index += 1) {
        await new Promise<void>(resolve => setImmediate(resolve));
      }
      expect(cancelsOfQadaa()).toBe(0); // the cancel has not overtaken the run in flight
      expect(gates.length).toBe(1); // nor has the forced run started creating

      for (let pass = 0; pass < 60; pass += 1) {
        gates.splice(0).forEach(release => release());
        await new Promise<void>(resolve => setImmediate(resolve));
      }
      await Promise.all([first, forced, cancelled]);
    } finally {
      create.mockImplementation(realCreate);
    }

    // run, then forced run, then cancel: the last request wins
    expect(M.fake().fakeNotifeeState.triggers.has(QADAA_ID)).toBe(false);
    expect(snapshot()).toMatchObject({scheduled: false, fireAt: null});

    // and the next plain sync derives from the data again: she still owes days
    await M.qadaa().syncQadaaReminderNotification();
    expect(pending()?.trigger.timestamp).toBe(REMINDER_AT.getTime());
  });

  it('a cancel issued while the first state read is still in flight is not undone when that read lands', async () => {
    await seedOwed();
    await M.qadaa().syncQadaaReminderNotification();
    expect(snapshot().scheduled).toBe(true);

    // A new process: the persisted snapshot says "scheduled"; the first read is held while a cancel is issued.
    coldStart(new Map(M.fake().fakeNotifeeState.triggers));
    const getItem = asyncStorage().getItem as unknown as jest.Mock;
    const realGetItem = getItem.getMockImplementation() as (key: string) => Promise<string | null>;
    const held: (() => void)[] = [];
    getItem.mockImplementation((key: string) => {
      if (key !== STATE_KEY) {
        return realGetItem(key);
      }
      const olderValue = realGetItem(key); // what the disk holds NOW — the read lands later, after the cancel
      return new Promise<string | null>(resolve => held.push(() => resolve(olderValue)));
    });
    try {
      const hydrating = M.state().hydrateQadaaReminderNotificationState();
      const cancelled = M.qadaa().cancelQadaaReminderNotification();
      for (let index = 0; index < 20; index += 1) {
        await new Promise<void>(resolve => setImmediate(resolve));
      }
      // Release every held read as it appears (with encryption on, the write of the cancel verifies the record it
      // replaces with a read of its own, which is held too).
      let finished = false;
      const done = Promise.all([hydrating, cancelled]).finally(() => {
        finished = true;
      });
      for (let pass = 0; pass < 80 && !finished; pass += 1) {
        held.splice(0).forEach(release => release());
        await new Promise<void>(resolve => setImmediate(resolve));
      }
      await done;
    } finally {
      getItem.mockImplementation(realGetItem);
    }

    expect(M.state().getQadaaReminderNotificationState()).toMatchObject({scheduled: false, fireAt: null});
  });
});
