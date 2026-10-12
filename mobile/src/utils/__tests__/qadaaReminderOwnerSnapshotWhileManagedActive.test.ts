import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import {STRUCTURED_KEY_SERVICE} from '../../services/structuredEncryption';
import {isRamadan} from '../hijriCalendar';

// F10 completion: while a managed (daughter) profile stays active through Ramadan, the OWNER's post-Ramadan Qadaa
// reminder is derived from the OWNER's own records through strictly read-only snapshot readers (unsuffixed keys,
// stores' own parsers, no in-memory state / listeners / writes / migration / profile switch). Real stores + real
// notification chokepoint + stateful fake notifee; proves JavaScript behaviour only.

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
const OWNER_LEDGER_KEY = 'awa:qadaa:ledger:v1';
const OWNER_HISTORY_KEY = '@hawa/confirmed-period-history';
const LEGACY_PROGRESS_KEY = 'awa:qadaa:progress:v1';

type Fake = typeof import('../../testUtils/fakeNotifee');
type TriggerRecord = {notification: {data?: {inAppOccurrenceId?: string}}; trigger: {timestamp: number}};

const M = {
  fake: () => require('../../testUtils/fakeNotifee') as Fake,
  secure: () => require('../../services/secureAsyncStorage') as typeof import('../../services/secureAsyncStorage'),
  activeProfile: () => require('../../state/activeProfileStore') as typeof import('../../state/activeProfileStore'),
  managed: () => require('../../state/managedProfilesStore') as typeof import('../../state/managedProfilesStore'),
  onboarding: () => require('../../state/onboardingPreferences') as typeof import('../../state/onboardingPreferences'),
  ledger: () => require('../../state/qadaaLedgerStore') as typeof import('../../state/qadaaLedgerStore'),
  history: () => require('../../state/confirmedPeriodHistoryStore') as typeof import('../../state/confirmedPeriodHistoryStore'),
  state: () => require('../../state/qadaaReminderNotificationStore') as typeof import('../../state/qadaaReminderNotificationStore'),
  qadaa: () => require('../qadaaReminderScheduling') as typeof import('../qadaaReminderScheduling'),
  storage: () =>
    (require('@react-native-async-storage/async-storage') as {default: typeof AsyncStorage}).default,
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

/** The owner owes `quantity` historical days (spiritual markers on). */
async function seedOwner(quantity: number): Promise<void> {
  M.onboarding().setSpiritualMarkersEnabled(true);
  await M.ledger().hydrateQadaaLedger();
  if (quantity > 0) {
    await M.ledger().addManualQadaaEntry({quantity, year: 2016, yearSystem: 'gregorian'});
  }
  await settle();
}

/** A daughter becomes (and stays) the active profile; optionally she owes days of her own. */
async function activateDaughter(owing: number): Promise<string> {
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
  if (owing > 0) {
    await M.ledger().hydrateQadaaLedger();
    await M.ledger().addManualQadaaEntry({quantity: owing, year: 2021, yearSystem: 'gregorian'});
    await settle();
  }
  return daughter.id;
}

/** Makes reads of one raw storage key fail at the storage layer (an I/O error), everything else untouched. */
function failReadsOf(key: string): () => void {
  const getItem = M.storage().getItem as unknown as jest.Mock;
  const real = getItem.getMockImplementation() as (k: string) => Promise<string | null>;
  getItem.mockImplementation((k: string) => (k === key ? Promise.reject(new Error('I/O error')) : real(k)));
  return () => getItem.mockImplementation(real);
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

describe('a daughter stays active through Ramadan: the owner\'s reminder is armed from HER OWN records', () => {
  it('never armed: armed with the same instant and occurrence id the owner-active path produces, whether the daughter owes days or not', async () => {
    await seedOwner(3);
    expect(snapshot().fireAt).toBeNull();
    await activateDaughter(9);

    await M.qadaa().syncQadaaReminderNotification();

    const armed = triggers().get(QADAA_ID) as TriggerRecord;
    expect(armed).toBeDefined();
    expect(pendingIds()).toEqual([QADAA_ID]);
    expect(snapshot().scheduled).toBe(true);
    expect(cancels()).toBe(0);

    // The owner comes back: HER path replaces it in place with exactly the same trigger.
    await M.activeProfile().setActiveProfileId('owner');
    await settle();
    await M.qadaa().forceSyncQadaaReminderNotification();
    const ownerArmed = triggers().get(QADAA_ID) as TriggerRecord;
    expect(ownerArmed.trigger.timestamp).toBe(armed.trigger.timestamp);
    expect(ownerArmed.notification.data?.inAppOccurrenceId).toBe(armed.notification.data?.inAppOccurrenceId);
  });

  it('daughter owing days but the owner owing none: nothing is armed (a daughter\'s data never influences the owner\'s reminder)', async () => {
    await seedOwner(0);
    await activateDaughter(9);

    await M.qadaa().syncQadaaReminderNotification();
    await M.qadaa().forceSyncQadaaReminderNotification();
    await settle();

    expect(pendingIds()).toEqual([]);
    expect(snapshot()).toEqual({ramadanMonthStartKey: null, fireAt: null, occurrenceId: null, scheduled: false});
  });

  it('the owner balance counts her completions: fully made up -> nothing armed, whatever the daughter owes', async () => {
    await seedOwner(3);
    await M.ledger().recordQadaaCompletion({quantity: 3});
    await settle();
    await activateDaughter(5);

    await M.qadaa().forceSyncQadaaReminderNotification();

    expect(pendingIds()).toEqual([]);
  });

  it('armed earlier, then the OWNER\'s own data says nothing is owed: cleared while the daughter is active (never because of HER data)', async () => {
    await seedOwner(3);
    await M.qadaa().syncQadaaReminderNotification();
    expect(pendingIds()).toEqual([QADAA_ID]);
    await M.ledger().recordQadaaCompletion({quantity: 3}); // no sync is wired: the armed snapshot is now stale
    await settle();
    expect(pendingIds()).toEqual([QADAA_ID]);
    await activateDaughter(7); // she owes days: must not keep it alive

    await M.qadaa().syncQadaaReminderNotification();

    expect(pendingIds()).toEqual([]);
    expect(snapshot().scheduled).toBe(false);
  });

  it('armed earlier and the owner still owes: a daughter who owes nothing never cancels it', async () => {
    await seedOwner(3);
    await M.qadaa().syncQadaaReminderNotification();
    const armedAt = (triggers().get(QADAA_ID) as TriggerRecord).trigger.timestamp;
    await activateDaughter(0);
    const cancelledBefore = cancels();

    await M.qadaa().syncQadaaReminderNotification();
    await M.qadaa().forceSyncQadaaReminderNotification();

    expect(cancels()).toBe(cancelledBefore);
    expect((triggers().get(QADAA_ID) as TriggerRecord).trigger.timestamp).toBe(armedAt);
  });

  it('spiritual markers off: not armed (the owner applies it on her return)', async () => {
    await seedOwner(3);
    await activateDaughter(0);
    M.onboarding().setSpiritualMarkersEnabled(false);
    await settle();

    await M.qadaa().forceSyncQadaaReminderNotification();

    expect(pendingIds()).toEqual([]);
  });

  it('restart with the daughter persisted as the active profile: armed from the owner\'s stored records', async () => {
    await seedOwner(3);
    await activateDaughter(2);
    await settle();

    coldStart(); // a new process: nothing in memory, nothing pending natively
    await M.activeProfile().hydrateActiveProfileId();
    await M.onboarding().hydrateSpiritualMarkersEnabled();
    expect(M.activeProfile().isOwnerActive()).toBe(false);
    await M.qadaa().syncQadaaReminderNotification();

    expect(pendingIds()).toEqual([QADAA_ID]);
  });
});

describe('unreadable records: everything is left exactly as it is, and a failure never crosses profiles', () => {
  it('the OWNER\'s ledger unreadable: an armed reminder is not cleared or re-armed; the daughter\'s own keys are not marked', async () => {
    await seedOwner(3);
    await M.qadaa().syncQadaaReminderNotification(); // armed by the owner herself
    const armed = snapshot();
    const daughterId = await activateDaughter(4);
    const createdBefore = creates();
    const restore = failReadsOf(OWNER_LEDGER_KEY);

    await M.qadaa().forceSyncQadaaReminderNotification();
    restore();

    expect(creates()).toBe(createdBefore);
    expect(cancels()).toBe(0);
    expect(pendingIds()).toEqual([QADAA_ID]);
    expect(snapshot()).toEqual(armed);
    // (recorded in the unavailable registry when the record is a structured one, i.e. in the encrypted mode)
    expect(M.secure().isStructuredKeyUnavailable(OWNER_LEDGER_KEY)).toBe(M.secure().isStructuredEncryptionEligible(OWNER_LEDGER_KEY));
    expect(M.secure().isStructuredKeyUnavailable(`${OWNER_LEDGER_KEY}:profile:${daughterId}`)).toBe(false);
    expect(M.secure().isActiveProfileDataUnavailable([OWNER_LEDGER_KEY, OWNER_HISTORY_KEY])).toBe(false);
    // The daughter's own ledger is still readable and writable by her.
    await M.ledger().hydrateQadaaLedger();
    await expect(M.ledger().addManualQadaaEntry({quantity: 1, year: 2022, yearSystem: 'gregorian'})).resolves.toBeDefined();

    // Readable again: a later sync reconciles from her own data (replaced in place, never cancelled).
    await M.qadaa().forceSyncQadaaReminderNotification();
    expect(pendingIds()).toEqual([QADAA_ID]);
    expect(creates()).toBe(createdBefore + 1);
    expect(cancels()).toBe(0);
  });

  it('an armed reminder is left in place when the owner\'s confirmed periods are unreadable (not cleared, not re-armed)', async () => {
    await seedOwner(3);
    await M.qadaa().syncQadaaReminderNotification();
    await M.ledger().recordQadaaCompletion({quantity: 3}); // she owes nothing now, but...
    await activateDaughter(0);
    const before = snapshot();
    const restore = failReadsOf(OWNER_HISTORY_KEY);

    await M.qadaa().forceSyncQadaaReminderNotification();
    restore();

    expect(cancels()).toBe(0);
    expect(pendingIds()).toEqual([QADAA_ID]);
    expect(snapshot()).toEqual(before);
  });

  it('the DAUGHTER\'s records unreadable: the owner\'s reminder is still derived from the owner\'s own data', async () => {
    await seedOwner(3);
    const daughterId = await activateDaughter(0);
    const daughterLedgerKey = `${OWNER_LEDGER_KEY}:profile:${daughterId}`;
    M.secure().__markUnavailableForTests(daughterLedgerKey);
    M.secure().__markUnavailableForTests(`${OWNER_HISTORY_KEY}:profile:${daughterId}`);

    await M.qadaa().forceSyncQadaaReminderNotification();

    expect(pendingIds()).toEqual([QADAA_ID]);
    expect(M.secure().isStructuredKeyUnavailable(daughterLedgerKey)).toBe(true); // still hers, untouched
    expect(M.secure().isStructuredKeyUnavailable(OWNER_LEDGER_KEY)).toBe(false);
  });

  it('the legacy completed-days counter unreadable (ledger not migrated yet): unavailable, nothing armed', async () => {
    await M.storage().setItem(
      OWNER_LEDGER_KEY,
      JSON.stringify({version: 1, legacyProgressMigrated: false, manualEntries: [], completions: []}),
    );
    await activateDaughter(0);
    const restore = failReadsOf(LEGACY_PROGRESS_KEY);

    const result = await M.ledger().readOwnerQadaaLedgerSnapshot();
    restore();

    expect(result).toEqual({status: 'unavailable'});
  });
});

describe('the owner snapshot readers are strictly read-only', () => {
  it('no write, no in-memory change, no notification, no migration write-back, no profile switch', async () => {
    // The owner's stored ledger has NOT folded the legacy counter yet: 4 owed manually, 1 made up in the old counter.
    await M.storage().setItem(
      OWNER_LEDGER_KEY,
      JSON.stringify({
        version: 1,
        legacyProgressMigrated: false,
        manualEntries: [
          {
            id: 'm1',
            source: 'MANUAL',
            quantity: 4,
            year: null,
            yearSystem: null,
            note: null,
            createdAt: '2020-01-01T00:00:00.000Z',
            updatedAt: '2020-01-01T00:00:00.000Z',
          },
        ],
        completions: [],
      }),
    );
    await M.storage().setItem(LEGACY_PROGRESS_KEY, JSON.stringify({completedDays: 1, updatedAt: 5}));
    const daughterId = await activateDaughter(0);
    await M.ledger().hydrateQadaaLedger();
    const daughterLedger = M.ledger().getQadaaLedger();
    const daughterHistory = M.history().getConfirmedPeriodHistory();
    const ledgerListener = jest.fn();
    const historyListener = jest.fn();
    M.ledger().subscribeQadaaLedger(ledgerListener);
    M.history().subscribeConfirmedPeriodHistory(historyListener);
    await settle(); // the daughter's own derived ledger write has landed
    const rawBefore = await M.storage().getAllKeys();
    const ledgerRawBefore = await M.storage().getItem(OWNER_LEDGER_KEY);
    const setItem = M.storage().setItem as unknown as jest.Mock;
    const writesBefore = setItem.mock.calls.length;

    const ledger = await M.ledger().readOwnerQadaaLedgerSnapshot();
    const history = await M.history().readOwnerConfirmedPeriodHistorySnapshot();

    // The folded view the owner herself would see...
    expect(ledger.status).toBe('ok');
    if (ledger.status === 'ok') {
      expect(ledger.value.manualEntries.map(entry => entry.quantity)).toEqual([4]);
      expect(ledger.value.completions.map(entry => [entry.quantity, entry.origin])).toEqual([[1, 'MIGRATED']]);
    }
    expect(history).toEqual({status: 'ok', value: []});
    // ...and nothing else moved.
    expect(setItem.mock.calls.length).toBe(writesBefore);
    expect(await M.storage().getAllKeys()).toEqual(rawBefore);
    expect(await M.storage().getItem(OWNER_LEDGER_KEY)).toBe(ledgerRawBefore);
    expect(M.ledger().getQadaaLedger()).toBe(daughterLedger);
    expect(M.history().getConfirmedPeriodHistory()).toEqual(daughterHistory);
    expect(ledgerListener).not.toHaveBeenCalled();
    expect(historyListener).not.toHaveBeenCalled();
    expect(M.activeProfile().getActiveProfileId()).toBe(daughterId);
  });

  it('an unparsable owner record is unavailable, never an empty ledger / history', async () => {
    await M.storage().setItem(OWNER_LEDGER_KEY, '{not json');
    await M.storage().setItem(OWNER_HISTORY_KEY, '{not json');

    expect(await M.ledger().readOwnerQadaaLedgerSnapshot()).toEqual({status: 'unavailable'});
    expect(await M.history().readOwnerConfirmedPeriodHistorySnapshot()).toEqual({status: 'unavailable'});
  });
});
