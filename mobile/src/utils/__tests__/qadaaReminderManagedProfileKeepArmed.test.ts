import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import {STRUCTURED_KEY_SERVICE} from '../../services/structuredEncryption';
import {isRamadan} from '../hijriCalendar';

// F10 (owner post-Ramadan Qadaa reminder while a managed profile stays active).
//
// The reminder has an OWNER-global id but is derived from PROFILE-scoped records. While a daughter is active the
// scheduler derives nothing and never cancels or clears (reminderProfileIsolation.test.ts). What it now ALSO does is
// keep what the owner ALREADY armed alive, from the OWNER's own saved snapshot only (owner-global key): a trigger lost
// natively, or one needing fresh text, is re-armed in place — same instant, same occurrence id.
// ARMING a reminder the owner never armed (and clearing it when HER OWN data says nothing is owed) from the owner's
// read-only snapshots is covered by qadaaReminderOwnerSnapshotWhileManagedActive.test.ts.
// Real stores + real notification chokepoint + stateful fake notifee; proves JavaScript behaviour only.

jest.mock('@notifee/react-native', () => require('../../testUtils/fakeNotifee').notifeeModule);

const NOW = (() => {
  for (let offset = 0; offset < 40; offset += 1) {
    const candidate = new Date(2025, 1, 15 + offset);
    if (isRamadan(candidate) && !isRamadan(new Date(2025, 1, 14 + offset))) {
      return new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate() + 5, 10, 0, 0);
    }
  }
  throw new Error('Ramadan start not found');
})();

const QADAA_ID = 'qadaa-post-ramadan-reminder';
const STATE_KEY = '@hawa/qadaa-post-ramadan-reminder/v1';

type Fake = typeof import('../../testUtils/fakeNotifee');
type TriggerRecord = {
  notification: {title?: string; body?: string; data?: {inAppOccurrenceId?: string}};
  trigger: {timestamp: number};
};

const M = {
  fake: () => require('../../testUtils/fakeNotifee') as Fake,
  secure: () => require('../../services/secureAsyncStorage') as typeof import('../../services/secureAsyncStorage'),
  activeProfile: () => require('../../state/activeProfileStore') as typeof import('../../state/activeProfileStore'),
  managed: () => require('../../state/managedProfilesStore') as typeof import('../../state/managedProfilesStore'),
  onboarding: () => require('../../state/onboardingPreferences') as typeof import('../../state/onboardingPreferences'),
  ledger: () => require('../../state/qadaaLedgerStore') as typeof import('../../state/qadaaLedgerStore'),
  state: () => require('../../state/qadaaReminderNotificationStore') as typeof import('../../state/qadaaReminderNotificationStore'),
  qadaa: () => require('../qadaaReminderScheduling') as typeof import('../qadaaReminderScheduling'),
};

jest.setTimeout(60_000);

const settle = async () => {
  for (let index = 0; index < 40; index += 1) {
    await new Promise<void>(resolve => setImmediate(resolve));
  }
};

function coldStart(): void {
  jest.resetModules();
  M.fake().resetFakeNotifee();
  M.secure().resetStructuredStorageForTests();
}

const triggers = () => M.fake().fakeNotifeeState.triggers as unknown as Map<string, TriggerRecord>;
const pendingIds = () => Array.from(triggers().keys()).sort();
const creates = () => (M.fake().notifee.createTriggerNotification as jest.Mock).mock.calls.length;
const cancels = () =>
  (M.fake().notifee.cancelTriggerNotification as jest.Mock).mock.calls.length +
  (M.fake().notifee.cancelTriggerNotifications as jest.Mock).mock.calls.length;
const snapshot = () => M.state().getQadaaReminderNotificationState();

async function seedOwnerOwing(): Promise<void> {
  M.onboarding().setSpiritualMarkersEnabled(true);
  await M.ledger().hydrateQadaaLedger();
  await M.ledger().addManualQadaaEntry({quantity: 3, year: 2016, yearSystem: 'gregorian'});
  await settle();
}

async function activateDaughter(owing: boolean): Promise<void> {
  const daughter = await M.managed().addManagedProfile({
    type: 'daughter',
    firstName: 'Noor',
    birthDate: '2013-01-01',
    hasHadFirstPeriod: true,
    lastPeriodDate: '2025-02-01',
    periodLength: 4,
    cycleLength: 30,
    regularity: 'yes',
  });
  await M.activeProfile().setActiveProfileId(daughter.id);
  await settle();
  if (owing) {
    await M.ledger().hydrateQadaaLedger();
    await M.ledger().addManualQadaaEntry({quantity: 9, year: 2021, yearSystem: 'gregorian'});
    await settle();
  }
}

beforeAll(() => {
  jest.useFakeTimers({now: NOW, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask']});
});

afterAll(() => {
  jest.useRealTimers();
  jest.resetModules();
});

beforeEach(async () => {
  await AsyncStorage.clear();
  await Keychain.resetGenericPassword({service: STRUCTURED_KEY_SERVICE});
  coldStart();
});

describe('a daughter stays active: the owner\'s ALREADY-armed reminder is kept alive from her own snapshot', () => {
  it('trigger lost natively -> re-armed with the SAME instant and occurrence id, never cancelled', async () => {
    await seedOwnerOwing();
    await M.qadaa().syncQadaaReminderNotification();
    const armed = triggers().get(QADAA_ID) as TriggerRecord;
    expect(armed).toBeDefined();
    const before = snapshot();
    expect(before.scheduled).toBe(true);

    await activateDaughter(false); // she owes nothing: the old code path used to CANCEL here
    triggers().delete(QADAA_ID); // OEM task killer / update / reboot gap
    const cancelledBefore = cancels();

    await M.qadaa().syncQadaaReminderNotification();

    const rearmed = triggers().get(QADAA_ID) as TriggerRecord;
    expect(rearmed).toBeDefined();
    expect(rearmed.trigger.timestamp).toBe(armed.trigger.timestamp);
    expect(rearmed.notification.data?.inAppOccurrenceId).toBe(armed.notification.data?.inAppOccurrenceId);
    expect(cancels()).toBe(cancelledBefore);
    expect(snapshot()).toEqual(before);
    expect(pendingIds()).toEqual([QADAA_ID]);
  });

  it('nothing lost: a plain sync writes nothing at all; a forced one replaces the trigger in place (no cancel)', async () => {
    await seedOwnerOwing();
    await M.qadaa().syncQadaaReminderNotification();
    await activateDaughter(false);
    const createdBefore = creates();
    const cancelledBefore = cancels();

    await M.qadaa().syncQadaaReminderNotification();
    expect(creates()).toBe(createdBefore);

    await M.qadaa().forceSyncQadaaReminderNotification();
    expect(creates()).toBe(createdBefore + 1);
    expect(cancels()).toBe(cancelledBefore);
    expect(pendingIds()).toEqual([QADAA_ID]);
  });

  it('the daughter owing days (or owing none) never changes what is armed: no cancel, no clear, no new instant', async () => {
    await seedOwnerOwing();
    await M.qadaa().syncQadaaReminderNotification();
    const armedAt = (triggers().get(QADAA_ID) as TriggerRecord).trigger.timestamp;
    await activateDaughter(true);
    const before = snapshot();

    await M.qadaa().syncQadaaReminderNotification();
    await M.qadaa().forceSyncQadaaReminderNotification();
    await M.qadaa().cancelQadaaReminderNotification(); // the language-change flow: a no-op in her name
    await M.qadaa().syncQadaaReminderNotification();

    expect(snapshot()).toEqual(before);
    expect((triggers().get(QADAA_ID) as TriggerRecord).trigger.timestamp).toBe(armedAt);
  });

  it('spiritual markers switched off: not re-armed while the daughter is active, and not cleared either (the owner decides on her return)', async () => {
    await seedOwnerOwing();
    await M.qadaa().syncQadaaReminderNotification();
    await activateDaughter(false);
    triggers().delete(QADAA_ID);
    M.onboarding().setSpiritualMarkersEnabled(false);
    await settle();
    const before = snapshot();

    await M.qadaa().forceSyncQadaaReminderNotification();

    expect(pendingIds()).toEqual([]);
    expect(snapshot()).toEqual(before);
  });

  it('her own snapshot unreadable: left exactly as it is (an unreadable record is not "nothing armed")', async () => {
    await seedOwnerOwing();
    await M.qadaa().syncQadaaReminderNotification();
    await activateDaughter(false);
    triggers().delete(QADAA_ID);
    M.secure().__markUnavailableForTests(STATE_KEY);
    const createdBefore = creates();

    await M.qadaa().forceSyncQadaaReminderNotification();

    expect(creates()).toBe(createdBefore);
    expect(pendingIds()).toEqual([]);
  });

  it('once the owner is back, her own records decide again (cleared when she owes nothing)', async () => {
    await seedOwnerOwing();
    await M.qadaa().syncQadaaReminderNotification();
    await activateDaughter(false);
    triggers().delete(QADAA_ID);
    await M.qadaa().syncQadaaReminderNotification();
    expect(pendingIds()).toEqual([QADAA_ID]);

    await M.activeProfile().setActiveProfileId('owner');
    await settle();
    await M.qadaa().syncQadaaReminderNotification();

    expect(pendingIds()).toEqual([QADAA_ID]); // she still owes 3 days
    expect(snapshot().scheduled).toBe(true);
  });
});
