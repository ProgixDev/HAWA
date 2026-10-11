import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import {STRUCTURED_KEY_SERVICE} from '../../services/structuredEncryption';
import {isRamadan} from '../hijriCalendar';

// CROSS-PROFILE REMINDER ISOLATION (audit finding F10).
//
// The TTC ("Essayer de concevoir"), SOPK ("Cycles irréguliers") and post-Ramadan Qadaa reminders have OWNER-GLOBAL
// notification ids but are derived from PROFILE-scoped records (the cycle, the confirmed periods, the daily journal,
// the Qadaa ledger). While a managed (daughter) profile was active their syncs cancelled the owner's reminders (the
// daughter has no confirmed cycle / owes nothing) or re-scheduled them from the daughter's data — and, because every
// profile (re)hydration re-runs them, a launch with a daughter persisted as active ended in that contaminated state.
//
// What is proven here, with the REAL stores, the REAL notification chokepoint and a stateful fake notifee:
//   - while a daughter is active (no data / with data) not one native create or cancel happens, whoever asks;
//   - the owner's triggers are exactly as they were — and a setting the owner changed meanwhile only takes effect
//     once she is back, derived from HER data;
//   - a profile that is still being read is never reconciled against its neutral placeholder;
//   - a profile switch in the middle of a run, an unreadable record, and a restart with the daughter persisted as
//     the active profile (emulated wiring, and the real App module) all end in the owner's state.
// Each test is a fresh process: modules are reset, the native trigger set is carried over like Android's alarms.
// It proves JavaScript behaviour only — not that a phone delivers anything. Synthetic data only.

jest.mock('@notifee/react-native', () => require('../../testUtils/fakeNotifee').notifeeModule);

// Mid-Ramadan 2025, 10:00 — the Qadaa reminder is only evaluated during Ramadan, and one fixed "now" keeps every
// scenario's relative dates deterministic.
const NOW = (() => {
  for (let offset = 0; offset < 40; offset += 1) {
    const candidate = new Date(2025, 1, 15 + offset);
    if (isRamadan(candidate) && !isRamadan(new Date(2025, 1, 14 + offset))) {
      return new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate() + 5, 10, 0, 0);
    }
  }
  throw new Error('Ramadan start not found');
})();

const daysFromNow = (days: number, hour = 12) =>
  new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + days, hour, 0, 0, 0);
const isoDay = (date: Date) => date.toLocaleDateString('en-CA');

type Fake = typeof import('../../testUtils/fakeNotifee');
type TriggerRecord = {notification: {title?: string; body?: string; data?: unknown}; trigger: {timestamp: number; repeatFrequency?: number}};

const M = {
  fake: () => require('../../testUtils/fakeNotifee') as Fake,
  secure: () => require('../../services/secureAsyncStorage') as typeof import('../../services/secureAsyncStorage'),
  notifications: () => require('../../services/pregnancyNotifications') as typeof import('../../services/pregnancyNotifications'),
  activeProfile: () => require('../../state/activeProfileStore') as typeof import('../../state/activeProfileStore'),
  managed: () => require('../../state/managedProfilesStore') as typeof import('../../state/managedProfilesStore'),
  onboarding: () => require('../../state/onboardingPreferences') as typeof import('../../state/onboardingPreferences'),
  confirmed: () => require('../../state/confirmedPeriodHistoryStore') as typeof import('../../state/confirmedPeriodHistoryStore'),
  ledger: () => require('../../state/qadaaLedgerStore') as typeof import('../../state/qadaaLedgerStore'),
  qadaaState: () => require('../../state/qadaaReminderNotificationStore') as typeof import('../../state/qadaaReminderNotificationStore'),
  conception: () => require('../../state/conceptionPreferences') as typeof import('../../state/conceptionPreferences'),
  irregularPrefs: () => require('../../state/irregularPreferences') as typeof import('../../state/irregularPreferences'),
  ttc: () => require('../conceptionReminderScheduling') as typeof import('../conceptionReminderScheduling'),
  sopk: () => require('../irregularReminderScheduling') as typeof import('../irregularReminderScheduling'),
  qadaa: () => require('../qadaaReminderScheduling') as typeof import('../qadaaReminderScheduling'),
};

jest.setTimeout(60_000);

/** The AsyncStorage mock of the CURRENT module registry (a cold start replaces it; its backing data is shared). */
const asyncStorage = () =>
  (require('@react-native-async-storage/async-storage') as {default: typeof AsyncStorage}).default;

const settle = async () => {
  for (let index = 0; index < 40; index += 1) {
    await new Promise<void>(resolve => setImmediate(resolve));
  }
};

/** A new JavaScript process: every module (stores, schedulers, the fake notifee) is evaluated afresh; what Android
 * kept — the pending triggers — and what the disk kept (AsyncStorage / Keychain mocks) survive. */
function coldStart(surviving?: ReadonlyMap<string, TriggerRecord>): void {
  jest.resetModules();
  const fake = M.fake();
  fake.resetFakeNotifee();
  surviving?.forEach((record, id) => fake.fakeNotifeeState.triggers.set(id, record as never));
  M.secure().resetStructuredStorageForTests();
}

const pendingTriggers = (): Map<string, TriggerRecord> =>
  new Map(M.fake().fakeNotifeeState.triggers as unknown as Map<string, TriggerRecord>);

const idsPending = (): string[] => Array.from(M.fake().fakeNotifeeState.triggers.keys()).sort();

/** What each pending trigger will deliver and when — compared whole, so "unchanged" means unchanged. */
const triggersSnapshot = (): Record<string, unknown> => {
  const snapshot: Record<string, unknown> = {};
  pendingTriggers().forEach((record, id) => {
    snapshot[id] = {
      timestamp: record.trigger.timestamp,
      repeatFrequency: record.trigger.repeatFrequency,
      title: record.notification.title,
      body: record.notification.body,
      data: record.notification.data,
    };
  });
  return snapshot;
};

const nativeWrites = () => {
  const {notifee} = M.fake();
  return {
    created: (notifee.createTriggerNotification as jest.Mock).mock.calls.length,
    cancelled:
      (notifee.cancelTriggerNotification as jest.Mock).mock.calls.length +
      (notifee.cancelTriggerNotifications as jest.Mock).mock.calls.length,
  };
};

/** The native creates / cancels that name one of `ids` (a create carries the notification, a cancel the id[s]). */
const nativeWritesFor = (ids: readonly string[]) => {
  const {notifee} = M.fake();
  const named = (calls: unknown[][]): string[] =>
    calls.flatMap(call => {
      const first = call[0];
      if (typeof first === 'string') {return [first];}
      if (Array.isArray(first)) {return first.filter((item): item is string => typeof item === 'string');}
      const id = (first as {id?: unknown} | undefined)?.id;
      return typeof id === 'string' ? [id] : [];
    }).filter(id => ids.includes(id));
  return {
    created: named((notifee.createTriggerNotification as jest.Mock).mock.calls),
    cancelled: named([
      ...(notifee.cancelTriggerNotification as jest.Mock).mock.calls,
      ...(notifee.cancelTriggerNotifications as jest.Mock).mock.calls,
    ]),
  };
};

const QADAA_ID = 'qadaa-post-ramadan-reminder';

type Scenario = {
  name: string;
  /** Objective-specific reminder ids the owner has pending after seeding. */
  ids: string[];
  seed: () => Promise<void>;
  /** An OWNER-wide setting (not profile-scoped) changed while the daughter is active, and the id that setting
   * switches off. It must take effect only once the owner is active again. */
  changeOwnerSetting: () => Promise<void>;
  switchedOff: string;
  /** A profile-scoped base key of this scenario's sources — made unreadable for the "unreadable" test. */
  profileBase: string;
};

const SCENARIOS: Scenario[] = [
  {
    name: 'TTC (Essayer de concevoir)',
    ids: [
      'conceive-daily-journal',
      'conceive-estimated-ovulation',
      'conceive-fertile-window',
      'conceive-lh-test',
      'conceive-temperature',
    ],
    seed: async () => {
      await M.onboarding().setActiveObjective('conceive');
      await M.onboarding().hydrateCyclePreferences();
      await M.onboarding().setCyclePreferences({
        lastPeriodStart: daysFromNow(-6),
        periodDuration: 5,
        cycleDuration: 28,
        regularity: 'yes',
      });
      await M.conception().setConceptionPreferences({
        tryingDuration: 'under_3_months',
        ovulationAwareness: 'often',
        indicators: ['temperature'],
        reminders: {fertile_window: true, estimated_ovulation: true, temperature: true, lh_test: true, daily_journal: true},
      });
    },
    changeOwnerSetting: async () => {
      await M.conception().setConceptionPreferences({
        reminders: {fertile_window: true, estimated_ovulation: true, temperature: true, lh_test: false, daily_journal: true},
      });
    },
    switchedOff: 'conceive-lh-test',
    profileBase: '@hawa/cycle-preferences',
  },
  {
    name: 'SOPK (Cycles irréguliers)',
    ids: ['irregular-daily-journal-reminder', 'irregular-unrecorded-period-reminder'],
    seed: async () => {
      await M.onboarding().setActiveObjective('irregular');
      await M.confirmed().hydrateConfirmedPeriodHistory();
      await M.irregularPrefs().setIrregularPreferences({
        cyclePattern: 'irregular',
        lastPeriodDate: isoDay(daysFromNow(-30)),
        trackedItems: ['acne'],
        reminders: {dailyJournalEnabled: true, dailyJournalTime: '20:10', unrecordedPeriodEnabled: true},
      });
      await M.confirmed().recordConfirmedPeriodEnd(daysFromNow(-90), daysFromNow(-86));
      await M.confirmed().recordConfirmedPeriodEnd(daysFromNow(-60), daysFromNow(-56));
      await M.confirmed().recordConfirmedPeriodEnd(daysFromNow(-30), daysFromNow(-26));
    },
    changeOwnerSetting: async () => {
      await M.irregularPrefs().setIrregularPreferences({
        reminders: {dailyJournalEnabled: true, dailyJournalTime: '20:10', unrecordedPeriodEnabled: false},
      });
    },
    switchedOff: 'irregular-unrecorded-period-reminder',
    profileBase: '@hawa/confirmed-period-history',
  },
];

/** Owner's Qadaa data: 3 historical days owed, spiritual markers on. */
async function seedOwnerQadaa(): Promise<void> {
  M.onboarding().setSpiritualMarkersEnabled(true);
  await M.ledger().hydrateQadaaLedger();
  await M.ledger().addManualQadaaEntry({quantity: 3, year: 2016, yearSystem: 'gregorian'});
}

/** The three syncs, awaited — what a launch with the owner active does. */
async function runOwnerSyncs(): Promise<void> {
  await M.ttc().syncConceptionReminders();
  await M.sopk().syncIrregularReminders();
  await M.qadaa().syncQadaaReminderNotification();
}

/** Every subscription App.tsx makes for these three objectives, byte for byte in what triggers what. */
function wireLikeApp(): void {
  const onboarding = M.onboarding();
  const confirmed = M.confirmed();
  const ledger = M.ledger();
  const conception = M.conception();
  const irregularPrefs = M.irregularPrefs();
  const {syncConceptionReminders} = M.ttc();
  const {syncIrregularReminders} = M.sopk();
  const {syncQadaaReminderNotification} = M.qadaa();
  const quiet = (run: () => Promise<void>) => () => {
    run().catch(() => undefined);
  };

  Promise.all([onboarding.hydrateActiveObjective(), onboarding.hydrateCyclePreferences(), conception.hydrateConceptionPreferences()])
    .then(quiet(syncConceptionReminders))
    .catch(() => undefined);
  onboarding.subscribeActiveObjective(quiet(syncConceptionReminders));
  onboarding.subscribeCyclePreferences(quiet(syncConceptionReminders));
  conception.subscribeConceptionPreferences(quiet(syncConceptionReminders));

  Promise.all([onboarding.hydrateActiveObjective(), irregularPrefs.hydrateIrregularPreferences(), confirmed.hydrateConfirmedPeriodHistory()])
    .then(quiet(() => syncIrregularReminders()))
    .catch(() => undefined);
  onboarding.subscribeActiveObjective(quiet(() => syncIrregularReminders()));
  irregularPrefs.subscribeIrregularPreferences(quiet(() => syncIrregularReminders()));
  confirmed.subscribeConfirmedPeriodHistory(quiet(() => syncIrregularReminders()));

  Promise.all([
    onboarding.hydrateSpiritualMarkersEnabled(),
    confirmed.hydrateConfirmedPeriodHistory(),
    ledger.hydrateQadaaLedger(),
    onboarding.hydrateHijriAdjustmentDays(),
  ])
    .then(quiet(syncQadaaReminderNotification))
    .catch(() => undefined);
  onboarding.subscribeSpiritualMarkersEnabled(quiet(syncQadaaReminderNotification));
  confirmed.subscribeConfirmedPeriodHistory(quiet(syncQadaaReminderNotification));
  ledger.subscribeQadaaLedger(quiet(syncQadaaReminderNotification));
  onboarding.subscribeHijriAdjustmentDays(quiet(syncQadaaReminderNotification));
}

/** A daughter with nothing recorded: her cycle is the neutral placeholder, she owes nothing. */
async function addDaughterWithoutData() {
  return M.managed().addManagedProfile({type: 'daughter', firstName: 'Noor', birthDate: '2015-01-01', hasHadFirstPeriod: false});
}

/** A daughter with her OWN cycle, periods and Qadaa — all of it different from the owner's, and owing nothing. */
async function addDaughterWithData() {
  const daughter = await M.managed().addManagedProfile({
    type: 'daughter',
    firstName: 'Hanane',
    birthDate: '2013-01-01',
    hasHadFirstPeriod: true,
    lastPeriodDate: isoDay(daysFromNow(-12)),
    periodLength: 4,
    cycleLength: 35,
    regularity: 'yes',
  });
  await M.activeProfile().setActiveProfileId(daughter.id);
  await settle();
  await M.onboarding().hydrateCyclePreferences();
  await M.onboarding().setCyclePreferences({
    lastPeriodStart: daysFromNow(-12),
    periodDuration: 4,
    cycleDuration: 35,
    regularity: 'yes',
  });
  await M.confirmed().hydrateConfirmedPeriodHistory();
  await M.confirmed().recordConfirmedPeriodEnd(daysFromNow(-47), daysFromNow(-43));
  await M.confirmed().recordConfirmedPeriodEnd(daysFromNow(-12), daysFromNow(-8));
  await M.ledger().hydrateQadaaLedger();
  await M.ledger().addManualQadaaEntry({quantity: 2, year: 2020, yearSystem: 'gregorian'});
  await M.ledger().recordQadaaCompletion({quantity: 2});
  await settle();
  await M.activeProfile().setActiveProfileId('owner');
  await settle();
  return daughter;
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

describe.each(SCENARIOS)('$name — the owner\'s reminders while a managed profile is active', scenario => {
  /** The owner has her reminders pending (seeded and armed), App's wiring is live, and the baseline is taken. */
  async function ownerArmedAndWired() {
    await scenario.seed();
    await seedOwnerQadaa();
    await settle();
    await runOwnerSyncs();
    expect(idsPending()).toEqual([...scenario.ids, QADAA_ID].sort());
    wireLikeApp();
    await settle();
    expect(idsPending()).toEqual([...scenario.ids, QADAA_ID].sort());
    return {before: triggersSnapshot(), writes: nativeWrites()};
  }

  it('daughter with NO data: nothing is created or cancelled, whoever asks; the owner\'s change takes effect on her return', async () => {
    const {before, writes} = await ownerArmedAndWired();
    const daughter = await addDaughterWithoutData();

    await M.activeProfile().setActiveProfileId(daughter.id);
    await settle(); // her (empty) records are read; every store announces; App's wiring re-runs the syncs
    M.activeProfile().reloadActiveProfileData();
    await Promise.allSettled([runOwnerSyncs(), runOwnerSyncs(), M.qadaa().forceSyncQadaaReminderNotification()]);
    await settle();

    expect(triggersSnapshot()).toEqual(before); // exactly the owner's triggers: same ids, instants and text
    expect(nativeWrites()).toEqual(writes); // not one create, not one cancel

    // An owner-wide setting changed meanwhile is NOT applied while she is not the active profile…
    await scenario.changeOwnerSetting();
    await settle();
    expect(idsPending()).toContain(scenario.switchedOff);
    expect(nativeWrites()).toEqual(writes);

    // …and is, derived from the owner's data, the moment she is back.
    await M.activeProfile().setActiveProfileId('owner');
    await settle();
    expect(idsPending()).toEqual([...scenario.ids.filter(id => id !== scenario.switchedOff), QADAA_ID].sort());
    const after = triggersSnapshot();
    Object.keys(after).forEach(id => expect(after[id]).toEqual((before as Record<string, unknown>)[id]));
  });

  it('daughter WITH her own data (a different cycle, periods owed to nobody): the owner\'s triggers are not rebuilt from it', async () => {
    const {before} = await ownerArmedAndWired();
    const daughter = await addDaughterWithData();
    // seeding her data announced stores and ran App's wiring in both profiles; what matters is the end state
    await settle();
    expect(triggersSnapshot()).toEqual(before);

    const writes = nativeWrites();
    await M.activeProfile().setActiveProfileId(daughter.id);
    await settle();
    await runOwnerSyncs();
    await M.qadaa().forceSyncQadaaReminderNotification();
    await settle();

    expect(triggersSnapshot()).toEqual(before);
    expect(nativeWrites()).toEqual(writes);

    await M.activeProfile().setActiveProfileId('owner');
    await settle();
    expect(triggersSnapshot()).toEqual(before); // derived again from the OWNER's records: the same reminders
  });

  it('an owner trigger lost natively while the daughter is active stays lost until the owner is back, then is re-armed from HER data', async () => {
    const {before} = await ownerArmedAndWired();
    const daughter = await addDaughterWithoutData();
    await M.activeProfile().setActiveProfileId(daughter.id);
    await settle();

    M.fake().fakeNotifeeState.triggers.delete(QADAA_ID);
    M.fake().fakeNotifeeState.triggers.delete(scenario.ids[0]);
    const writes = nativeWrites();
    await runOwnerSyncs();
    await settle();
    expect(idsPending()).not.toContain(QADAA_ID);
    expect(idsPending()).not.toContain(scenario.ids[0]);
    expect(nativeWrites()).toEqual(writes);

    await M.activeProfile().setActiveProfileId('owner');
    await settle();
    expect(triggersSnapshot()).toEqual(before);
  });

  it('a profile still being read is never reconciled against its neutral placeholder: nothing happens until her records arrive', async () => {
    const {before} = await ownerArmedAndWired();
    const daughter = await addDaughterWithoutData();
    await M.activeProfile().setActiveProfileId(daughter.id);
    await settle();
    const writes = nativeWrites();

    // The owner's profile-scoped records are slow to read…
    const storage = asyncStorage().getItem as jest.Mock;
    const realGetItem = storage.getMockImplementation() as (key: string) => Promise<string | null>;
    const OWNER_KEYS = ['@hawa/cycle-preferences', '@hawa/confirmed-period-history', 'awa:qadaa:ledger:v1', '@hawa/daily-journal/v1'];
    const held: (() => void)[] = [];
    storage.mockImplementation((key: string) => {
      if (!OWNER_KEYS.includes(key)) {
        return realGetItem(key);
      }
      return new Promise(resolve => held.push(() => resolve(realGetItem(key))));
    });
    try {
      // …while memory still holds the daughter's / a neutral state.
      await M.activeProfile().setActiveProfileId('owner');
      const runs = Promise.allSettled([runOwnerSyncs(), M.qadaa().forceSyncQadaaReminderNotification()]);
      for (let index = 0; index < 40; index += 1) {
        await new Promise<void>(resolve => setImmediate(resolve));
      }
      expect(held.length).toBeGreaterThan(0);
      expect(nativeWrites()).toEqual(writes); // waiting for her records: nothing derived, nothing cancelled
      expect(triggersSnapshot()).toEqual(before);

      // Release each read as it appears (an encrypted record's second read is only issued after the first).
      let finished = false;
      const done = runs.finally(() => {
        finished = true;
      });
      for (let pass = 0; pass < 80 && !finished; pass += 1) {
        held.splice(0).forEach(release => release());
        await new Promise<void>(resolve => setImmediate(resolve));
      }
      await done;
    } finally {
      storage.mockImplementation(realGetItem);
    }
    await settle();

    expect(triggersSnapshot()).toEqual(before); // derived from HER records, once they were read
  });

  it('a profile switch in the middle of a run: the run finishes for the owner, every later run is a no-op, nothing is corrupted', async () => {
    const {before} = await ownerArmedAndWired();
    const daughter = await addDaughterWithoutData();

    // Her reminders are all lost natively (the phone was restarted by an aggressive task killer)…
    M.fake().fakeNotifeeState.triggers.clear();
    // …and the native create calls of the next runs are held, so a switch can land in the middle of them.
    const {notifee} = M.fake();
    const create = notifee.createTriggerNotification as jest.Mock;
    const realCreate = create.getMockImplementation() as (...args: unknown[]) => Promise<string>;
    const gates: (() => void)[] = [];
    create.mockImplementation((...args: unknown[]) => new Promise<string>(resolve => gates.push(() => resolve(realCreate(...args)))));
    try {
      const inFlight = Promise.allSettled([
        M.ttc().syncConceptionReminders(),
        M.sopk().syncIrregularReminders(),
        M.qadaa().syncQadaaReminderNotification(),
      ]);
      for (let index = 0; index < 80 && gates.length < scenario.ids.length + 1; index += 1) {
        await new Promise<void>(resolve => setImmediate(resolve));
      }
      expect(gates.length).toBe(scenario.ids.length + 1); // every owner reminder is being handed to Android

      await M.activeProfile().setActiveProfileId(daughter.id); // the person switches profile NOW
      const after = Promise.allSettled([runOwnerSyncs(), M.qadaa().forceSyncQadaaReminderNotification()]);
      for (let pass = 0; pass < 120; pass += 1) {
        gates.splice(0).forEach(release => release());
        await new Promise<void>(resolve => setImmediate(resolve));
      }
      await inFlight;
      await after;
    } finally {
      create.mockImplementation(realCreate);
    }
    await settle();

    // The runs that began for the owner finished HER reminders, from HER data; every run requested after the switch
    // was a no-op — nothing the daughter's records could have produced, and nothing cancelled.
    expect(triggersSnapshot()).toEqual(before);
  });

  it('an unreadable owner record: scheduled reminders are left exactly as they are (and reconciled once readable again)', async () => {
    const {before} = await ownerArmedAndWired();
    const owned = [...scenario.ids, QADAA_ID];
    const writes = nativeWritesFor(owned);

    M.secure().__markUnavailableForTests(scenario.profileBase);
    await M.conception().setConceptionPreferences({
      reminders: {fertile_window: false, estimated_ovulation: false, temperature: false, lh_test: false, daily_journal: false},
    });
    await M.irregularPrefs().setIrregularPreferences({
      reminders: {dailyJournalEnabled: false, dailyJournalTime: null, unrecordedPeriodEnabled: false},
    });
    await runOwnerSyncs();
    await settle();

    expect(triggersSnapshot()).toEqual(before);
    expect(nativeWritesFor(owned)).toEqual(writes); // not one create or cancel of an owner reminder

    // Unreadable Qadaa ledger: same rule.
    M.secure().resetStructuredStorageForTests();
    M.secure().__markUnavailableForTests('awa:qadaa:ledger:v1');
    await M.qadaa().forceSyncQadaaReminderNotification();
    expect(triggersSnapshot()).toEqual(before);
  });

  it('restart with the daughter persisted as the active profile (App wiring): the owner\'s triggers are untouched at launch and after', async () => {
    await scenario.seed();
    await seedOwnerQadaa();
    await settle();
    await runOwnerSyncs();
    const before = triggersSnapshot();
    expect(Object.keys(before).sort()).toEqual([...scenario.ids, QADAA_ID].sort());

    const daughter = await addDaughterWithData();
    await M.activeProfile().setActiveProfileId(daughter.id); // persisted: this is the profile the app was closed on
    await settle();

    // ----- the app is started again; Android still has the owner's alarms --------------------------------------
    coldStart(pendingTriggers());
    await M.activeProfile().hydrateActiveProfileId(); // the persisted active profile is restored first...
    wireLikeApp(); // ...then every module-level hydration + subscription of App.tsx runs and re-syncs
    await settle();

    expect(M.activeProfile().getActiveProfileId()).toBe(daughter.id);
    expect(triggersSnapshot()).toEqual(before);
    expect(nativeWrites()).toEqual({created: 0, cancelled: 0}); // not even a re-creation, from the neutral placeholder

    await M.activeProfile().setActiveProfileId('owner');
    await settle();
    expect(triggersSnapshot()).toEqual(before);
  });

  it('restart where the owner\'s first sync wins the race against the profile restore: the end state is still the owner\'s', async () => {
    await scenario.seed();
    await seedOwnerQadaa();
    await settle();
    await runOwnerSyncs();
    const before = triggersSnapshot();
    const daughter = await addDaughterWithoutData();
    await M.activeProfile().setActiveProfileId(daughter.id);
    await settle();

    coldStart(pendingTriggers());
    wireLikeApp();
    await settle(); // the launch-time syncs run (for the placeholder 'owner' profile) before the restore lands
    await M.activeProfile().hydrateActiveProfileId();
    await settle();

    expect(M.activeProfile().getActiveProfileId()).toBe(daughter.id);
    expect(triggersSnapshot()).toEqual(before);
  });

  it('restart where the profile restore lands in the MIDDLE of the launch-time reads: the end state is still the owner\'s', async () => {
    await scenario.seed();
    await seedOwnerQadaa();
    await settle();
    await runOwnerSyncs();
    const before = triggersSnapshot();
    const daughter = await addDaughterWithData();
    await M.activeProfile().setActiveProfileId(daughter.id);
    await settle();

    coldStart(pendingTriggers());
    wireLikeApp();
    const restored = M.activeProfile().hydrateActiveProfileId(); // not awaited: it races with every launch-time read
    await restored;
    await settle();

    expect(M.activeProfile().getActiveProfileId()).toBe(daughter.id);
    expect(triggersSnapshot()).toEqual(before);
    await M.activeProfile().setActiveProfileId('owner');
    await settle();
    expect(triggersSnapshot()).toEqual(before);
  });
});

describe('Qadaa reminder: the owner\'s own setting wins on her return, a daughter never sets it', () => {
  it('spiritual markers switched off while a daughter is active: the reminder is cleared when the owner is back, not before', async () => {
    await seedOwnerQadaa();
    await settle();
    await M.qadaa().syncQadaaReminderNotification();
    expect(idsPending()).toEqual([QADAA_ID]);
    wireLikeApp();
    await settle();
    const daughter = await addDaughterWithoutData();
    await M.activeProfile().setActiveProfileId(daughter.id);
    await settle();
    const writes = nativeWrites();

    M.onboarding().setSpiritualMarkersEnabled(false);
    await settle();
    expect(idsPending()).toEqual([QADAA_ID]); // the daughter being active must not decide for the owner
    expect(nativeWrites()).toEqual(writes);
    expect(M.qadaaState().getQadaaReminderNotificationState().scheduled).toBe(true);

    await M.activeProfile().setActiveProfileId('owner');
    await settle();
    expect(idsPending()).toEqual([]);
    expect(M.qadaaState().getQadaaReminderNotificationState().scheduled).toBe(false);
  });

  it('the language-change flow (cancel, then sync) run while a daughter is active does not wipe the owner\'s reminder', async () => {
    await seedOwnerQadaa();
    await settle();
    await M.qadaa().syncQadaaReminderNotification();
    const armed = triggersSnapshot();
    expect(Object.keys(armed)).toEqual([QADAA_ID]);
    const daughter = await addDaughterWithoutData();
    await M.activeProfile().setActiveProfileId(daughter.id);
    await settle();
    const writes = nativeWrites();

    await M.qadaa().cancelQadaaReminderNotification().then(M.qadaa().syncQadaaReminderNotification);
    await settle();

    expect(triggersSnapshot()).toEqual(armed);
    expect(nativeWrites()).toEqual(writes);
    expect(M.qadaaState().getQadaaReminderNotificationState().scheduled).toBe(true);

    // …and with the owner active the same flow still does what it always did: cancel, then re-derive and re-arm.
    await M.activeProfile().setActiveProfileId('owner');
    await settle();
    await M.qadaa().cancelQadaaReminderNotification();
    expect(idsPending()).toEqual([]);
    await M.qadaa().syncQadaaReminderNotification();
    expect(triggersSnapshot()).toEqual(armed);
  });

  it('a daughter who owes nothing no longer cancels the owner\'s reminder (the original defect)', async () => {
    await seedOwnerQadaa();
    await settle();
    await M.qadaa().syncQadaaReminderNotification();
    const armed = triggersSnapshot();
    expect(Object.keys(armed)).toEqual([QADAA_ID]);

    const daughter = await addDaughterWithoutData();
    await M.activeProfile().setActiveProfileId(daughter.id);
    await settle();
    await M.qadaa().syncQadaaReminderNotification();
    await M.qadaa().forceSyncQadaaReminderNotification();
    await settle();

    expect(triggersSnapshot()).toEqual(armed);
    expect(M.qadaaState().getQadaaReminderNotificationState().scheduled).toBe(true); // the snapshot is not reset either
  });
});

describe.each(SCENARIOS)('the real App module, launched with a daughter persisted as the active profile — $name', scenario => {
  it('ends with the owner\'s TTC / SOPK / Qadaa triggers exactly as they were (nothing derived from the daughter)', async () => {
    // The owner's world, built and armed in "the previous process".
    await scenario.seed();
    await seedOwnerQadaa();
    await settle();
    await runOwnerSyncs();
    const before = triggersSnapshot();
    expect(Object.keys(before).sort()).toEqual([...scenario.ids, QADAA_ID].sort());
    const daughter = await addDaughterWithoutData();
    await M.activeProfile().setActiveProfileId(daughter.id); // persisted: the profile the app was closed on
    await settle();
    const surviving = pendingTriggers();

    type Launched = {snapshot: Record<string, unknown>; profile: string};
    const launched: {current: Launched | null} = {current: null};
    await jest.isolateModulesAsync(async () => {
      const fake = require('../../testUtils/fakeNotifee') as Fake;
      fake.resetFakeNotifee();
      surviving.forEach((record, id) => fake.fakeNotifeeState.triggers.set(id, record as never));
      require('../../../App'); // importing the app runs its launch-time hydration + every reminder sync
      for (let index = 0; index < 120; index += 1) {
        await new Promise<void>(resolve => setImmediate(resolve));
      }
      const snapshot: Record<string, unknown> = {};
      fake.fakeNotifeeState.triggers.forEach((record, id) => {
        const typed = record as unknown as TriggerRecord;
        snapshot[id] = {
          timestamp: typed.trigger.timestamp,
          repeatFrequency: typed.trigger.repeatFrequency,
          title: typed.notification.title,
          body: typed.notification.body,
          data: typed.notification.data,
        };
      });
      launched.current = {
        snapshot,
        profile: (require('../../state/activeProfileStore') as typeof import('../../state/activeProfileStore')).getActiveProfileId(),
      };
    });

    // (App's launch-time syncs may legitimately re-upsert the owner's own, identical reminders before the persisted
    // profile is restored; what must never be left behind is a reminder cancelled or rebuilt from the daughter.)
    const result = launched.current;
    expect(result).not.toBeNull();
    expect(result?.profile).toBe(daughter.id);
    expect(result?.snapshot).toEqual(before);
  });
});
