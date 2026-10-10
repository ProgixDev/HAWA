import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import {STRUCTURED_KEY_SERVICE} from '../../services/structuredEncryption';

// PROFILE ISOLATION UNDER FAILURE — an unreadable record of ONE profile (owner or managed daughter) must neither expose
// nor damage another profile's data, and a deleted (tombstoned) daughter must not be brought back by a failed read.
// Real stores, encryption ON, a cold start (jest.resetModules()) before every observation. Fixtures only.

type Secure = typeof import('../../services/secureAsyncStorage');

const M = {
  secure: () => require('../../services/secureAsyncStorage') as Secure,
  active: () => require('../activeProfileStore') as typeof import('../activeProfileStore'),
  profiles: () => require('../managedProfilesStore') as typeof import('../managedProfilesStore'),
  deletion: () => require('../../services/managedProfileDeletion') as typeof import('../../services/managedProfileDeletion'),
  onboarding: () => require('../onboardingPreferences') as typeof import('../onboardingPreferences'),
  confirmed: () => require('../confirmedPeriodHistoryStore') as typeof import('../confirmedPeriodHistoryStore'),
  cycleReminders: () => require('../cycleReminderPreferences') as typeof import('../cycleReminderPreferences'),
  journal: () => require('../dailyJournalStore') as typeof import('../dailyJournalStore'),
  qadaa: () => require('../qadaaStore') as typeof import('../qadaaStore'),
  ledger: () => require('../qadaaLedgerStore') as typeof import('../qadaaLedgerStore'),
};

const UNAVAILABLE = '__STRUCTURED_DATA_UNAVAILABLE__';
const OWNER = 'owner';

const settle = async () => {
  for (let index = 0; index < 25; index += 1) {
    await new Promise<void>(resolve => setImmediate(resolve));
  }
};

const coldStart = (): Secure => {
  jest.resetModules();
  const secure = M.secure();
  secure.setStructuredEncryptionEnabled(true);
  secure.resetStructuredStorageForTests();
  return secure;
};

const rawOf = (key: string) => AsyncStorage.getItem(key);

const corruptCiphertext = async (key: string): Promise<string> => {
  const stored = (await AsyncStorage.getItem(key)) as string;
  const envelope = JSON.parse(stored) as {c: string};
  envelope.c = `${envelope.c.slice(0, -1)}${envelope.c.endsWith('0') ? '1' : '0'}`;
  const corrupted = JSON.stringify(envelope);
  await AsyncStorage.setItem(key, corrupted);
  return corrupted;
};

const isUnavailableError = (error: unknown) => (error as {name?: string})?.name === 'StructuredDataUnavailableError';
const day = (year: number, month: number, date: number, hour = 12) => new Date(year, month, date, hour);

const PROFILE_SCOPED_BASES = [
  '@hawa/cycle-preferences',
  '@hawa/confirmed-period-history',
  '@hawa/cycle-reminder-preferences/v1',
  '@hawa/daily-journal/v1',
  '@hawa/remaining-qadaa-days',
  '@hawa/period-end-datetime',
  'awa:qadaa:ledger:v1',
];

const hydrateProfileScoped = async () => {
  await M.onboarding().hydrateCyclePreferences();
  await M.onboarding().hydratePeriodEndDateTime();
  await M.confirmed().hydrateConfirmedPeriodHistory();
  await M.cycleReminders().hydrateCycleReminderPreferences();
  await M.qadaa().hydrateRemainingQadaaDays();
  await M.ledger().hydrateQadaaLedger();
  await settle();
};

const useProfile = async (id: string) => {
  await M.active().hydrateActiveProfileId();
  await M.active().setActiveProfileId(id);
  await settle();
};

/** Owner: period Sep 10, 31-day cycle, Qadaa 7, reminder 21:30. Daughter: period Aug 20, 26-day cycle, Qadaa 3, reminder 07:05. */
const seedBothProfiles = async (): Promise<{daughterId: string}> => {
  coldStart();
  await M.active().hydrateActiveProfileId();
  await hydrateProfileScoped();

  M.onboarding().setCyclePreferences({lastPeriodStart: day(2026, 8, 10), periodDuration: 6, cycleDuration: 31, regularity: 'yes'});
  await M.onboarding().setPeriodEndDateTime(day(2026, 8, 15, 18));
  await M.confirmed().recordConfirmedPeriodEnd(day(2026, 8, 10), day(2026, 8, 15));
  await M.cycleReminders().setCycleReminderPreferences({
    ...M.cycleReminders().getCycleReminderPreferences(), dailyJournalEnabled: true, dailyJournalTime: '21:30',
  });
  await M.qadaa().setRemainingQadaaDays(7);
  await M.ledger().addManualQadaaEntry({quantity: 5});
  await M.journal().saveJournalSection('2026-09-20', 'mood', {level: 'sad', energy: 1, stress: 4, irritability: 2, motivation: 1});
  await settle();

  const daughter = await M.profiles().addManagedProfile({type: 'daughter', firstName: 'Noor', birthDate: '2012-05-01', hasHadFirstPeriod: false});
  await M.active().setActiveProfileId(daughter.id);
  await settle();
  await hydrateProfileScoped();
  M.onboarding().setCyclePreferences({lastPeriodStart: day(2026, 7, 20), periodDuration: 4, cycleDuration: 26, regularity: 'yes'});
  await M.onboarding().setPeriodEndDateTime(day(2026, 7, 23, 18));
  await M.confirmed().recordConfirmedPeriodEnd(day(2026, 7, 20), day(2026, 7, 23));
  await M.cycleReminders().setCycleReminderPreferences({
    ...M.cycleReminders().getCycleReminderPreferences(), dailyJournalEnabled: true, dailyJournalTime: '07:05',
  });
  await M.qadaa().setRemainingQadaaDays(3);
  await M.ledger().addManualQadaaEntry({quantity: 2});
  await M.journal().saveJournalSection('2026-08-21', 'mood', {level: 'good', energy: 3, stress: 1, irritability: 1, motivation: 3});
  await settle();
  await M.active().setActiveProfileId(OWNER);
  await settle();
  return {daughterId: daughter.id};
};

const ownerKeys = async () =>
  (await AsyncStorage.getAllKeys()).filter(key => !key.includes(':profile:') && PROFILE_SCOPED_BASES.includes(key));
const daughterKeys = async (id: string) => (await AsyncStorage.getAllKeys()).filter(key => key.endsWith(`:profile:${id}`));

const profileView = async () => {
  await hydrateProfileScoped();
  const journal: Record<string, string | null> = {};
  for (const date of ['2026-09-20', '2026-08-21']) {
    try {
      journal[date] = (await M.journal().getJournalEntry(date))?.mood?.level ?? null;
    } catch (error) {
      if (!isUnavailableError(error)) {throw error;}
      journal[date] = UNAVAILABLE;
    }
  }
  const ledger = M.ledger().getQadaaLedger();
  return {
    cycleDuration: M.onboarding().getCyclePreferences().cycleDuration,
    confirmed: M.onboarding().getHasConfirmedCycleData(),
    recordedStarts: M.onboarding().getRecordedPeriodHistory().map(record => record.startDate),
    periodEnd: M.onboarding().getPeriodEndDateTime()?.toISOString() ?? null,
    confirmedHistory: M.confirmed().getConfirmedPeriodHistory().map(item => item.id),
    reminderTime: M.cycleReminders().getCycleReminderPreferences().dailyJournalTime,
    qadaaDays: M.qadaa().getRemainingQadaaDays(),
    ledgerQuantities: ledger.manualEntries.map(entry => entry.quantity),
    journal,
  };
};

const NEUTRAL = {
  cycleDuration: 28, confirmed: false, recordedStarts: [] as string[], periodEnd: null, confirmedHistory: [] as string[],
  reminderTime: null, qadaaDays: null, ledgerQuantities: [] as number[],
};

const snapshot = async (keys: string[]) => Object.fromEntries(await Promise.all(keys.map(async key => [key, await rawOf(key)] as const)));

beforeEach(async () => {
  await AsyncStorage.clear();
  await Keychain.resetGenericPassword({service: STRUCTURED_KEY_SERVICE});
});

afterAll(() => {
  jest.resetModules();
  M.secure().setStructuredEncryptionEnabled(false);
});

describe('fixture sanity', () => {
  it('both profiles are stored under their own encrypted keys and are readable after a cold start', async () => {
    const {daughterId} = await seedBothProfiles();
    expect((await ownerKeys()).length).toBe(PROFILE_SCOPED_BASES.length);
    expect((await daughterKeys(daughterId)).length).toBe(PROFILE_SCOPED_BASES.length);
    coldStart();
    await useProfile(OWNER);
    expect(await profileView()).toMatchObject({cycleDuration: 31, confirmedHistory: ['2026-09-10'], reminderTime: '21:30', qadaaDays: 7, ledgerQuantities: [5]});
    await useProfile(daughterId);
    expect(await profileView()).toMatchObject({cycleDuration: 26, confirmedHistory: ['2026-08-20'], reminderTime: '07:05', qadaaDays: 3, ledgerQuantities: [2]});
  });
});

describe('profile isolation when one profile\'s record is unreadable', () => {
  it('an unreadable DAUGHTER record never exposes the owner\'s data under her profile, and never touches the owner', async () => {
    const {daughterId} = await seedBothProfiles();
    const ownerBefore = await snapshot(await ownerKeys());
    const hers = await daughterKeys(daughterId);
    const corrupted: Record<string, string> = {};
    for (const key of hers) {corrupted[key] = await corruptCiphertext(key);}

    const secure = coldStart();
    await useProfile(OWNER);
    const ownerView = await profileView();
    expect(ownerView).toMatchObject({cycleDuration: 31, confirmed: true, confirmedHistory: ['2026-09-10'], reminderTime: '21:30', qadaaDays: 7, ledgerQuantities: [5]});
    expect(ownerView.journal['2026-09-20']).toBe('sad');
    expect(ownerView.journal['2026-08-21']).toBeNull();
    expect(secure.isActiveProfileDataUnavailable(PROFILE_SCOPED_BASES)).toBe(false);

    await useProfile(daughterId);
    const daughterView = await profileView();
    expect(daughterView).toMatchObject(NEUTRAL);
    expect(daughterView.journal['2026-09-20']).toBe(UNAVAILABLE);
    expect(daughterView.journal['2026-08-21']).toBe(UNAVAILABLE);
    expect(secure.isActiveProfileDataUnavailable(PROFILE_SCOPED_BASES)).toBe(true);
    const flagged = secure.getUnavailableStructuredKeys().map(item => item.key);
    expect(flagged.length).toBeGreaterThan(0);
    expect(flagged.every(key => key.endsWith(`:profile:${daughterId}`))).toBe(true);

    // edits made while she is active are refused and cannot reach either profile's stored bytes
    await M.confirmed().recordConfirmedPeriodEnd(day(2026, 9, 1), day(2026, 9, 4)).catch(() => undefined);
    await M.qadaa().setRemainingQadaaDays(99).catch(() => undefined);
    await M.ledger().addManualQadaaEntry({quantity: 9}).catch(() => undefined);
    await M.journal().saveJournalSection('2026-09-25', 'flow', {intensity: 'heavy'}).catch(() => undefined);
    M.onboarding().addPeriodOccurrence(day(2026, 9, 2));
    await settle();
    for (const key of hers) {expect(await rawOf(key)).toBe(corrupted[key]);}
    expect(await snapshot(await ownerKeys())).toEqual(ownerBefore);

    await useProfile(OWNER);
    const ownerAgain = await profileView();
    expect(ownerAgain).toMatchObject({cycleDuration: 31, confirmed: true, confirmedHistory: ['2026-09-10'], reminderTime: '21:30', qadaaDays: 7, ledgerQuantities: [5]});
    expect(ownerAgain.journal['2026-09-20']).toBe('sad');
    expect(secure.isActiveProfileDataUnavailable(PROFILE_SCOPED_BASES)).toBe(false);
  });

  it('an unreadable OWNER record never exposes (or damages) the daughter\'s data, and the daughter stays fully usable', async () => {
    const {daughterId} = await seedBothProfiles();
    const daughterBefore = await snapshot(await daughterKeys(daughterId));
    const mine = await ownerKeys();
    const corrupted: Record<string, string> = {};
    for (const key of mine) {corrupted[key] = await corruptCiphertext(key);}

    const secure = coldStart();
    await useProfile(daughterId);
    const daughterView = await profileView();
    expect(daughterView).toMatchObject({cycleDuration: 26, confirmed: true, confirmedHistory: ['2026-08-20'], reminderTime: '07:05', qadaaDays: 3, ledgerQuantities: [2]});
    expect(daughterView.journal['2026-08-21']).toBe('good');
    expect(daughterView.journal['2026-09-20']).toBeNull(); // the owner's day is not hers
    expect(secure.isActiveProfileDataUnavailable(PROFILE_SCOPED_BASES)).toBe(false);

    await useProfile(OWNER);
    const ownerView = await profileView();
    expect(ownerView).toMatchObject(NEUTRAL);
    expect(ownerView.journal['2026-09-20']).toBe(UNAVAILABLE);
    expect(secure.isActiveProfileDataUnavailable(PROFILE_SCOPED_BASES)).toBe(true);

    await M.confirmed().recordConfirmedPeriodEnd(day(2026, 9, 1), day(2026, 9, 4)).catch(() => undefined);
    await M.qadaa().setRemainingQadaaDays(99).catch(() => undefined);
    await M.ledger().addManualQadaaEntry({quantity: 9}).catch(() => undefined);
    await settle();
    for (const key of mine) {expect(await rawOf(key)).toBe(corrupted[key]);}
    expect(await snapshot(await daughterKeys(daughterId))).toEqual(daughterBefore);
  });

  it('a record copied from the owner into the daughter\'s key is not accepted as hers (bound to its own key)', async () => {
    const {daughterId} = await seedBothProfiles();
    const ownerHistory = (await rawOf('@hawa/confirmed-period-history')) as string;
    const hersKey = `@hawa/confirmed-period-history:profile:${daughterId}`;
    await AsyncStorage.setItem(hersKey, ownerHistory);

    const secure = coldStart();
    await useProfile(daughterId);
    const view = await profileView();
    expect(view.confirmedHistory).toEqual([]);
    expect(secure.isStructuredKeyUnavailable(hersKey)).toBe(true);
    expect(await rawOf(hersKey)).toBe(ownerHistory);
  });
});

describe('a deleted (tombstoned) managed profile is not recreated by a failed read', () => {
  it('leaves no keys, no phantom "unreadable" flags and is not brought back by reading her keys', async () => {
    const {daughterId} = await seedBothProfiles();
    const hers = await daughterKeys(daughterId);
    for (const key of hers) {await corruptCiphertext(key);}

    const secure = coldStart();
    await useProfile(daughterId);
    await profileView();
    expect(secure.getUnavailableStructuredKeys().some(item => item.key.endsWith(`:profile:${daughterId}`))).toBe(true);
    await useProfile(OWNER);

    const result = await M.deletion().deleteManagedProfileCompletely(daughterId);
    expect(result).toMatchObject({deleted: true, failedSteps: []});

    expect((await AsyncStorage.getAllKeys()).filter(key => key.includes(daughterId))).toEqual([]);
    // her records are gone, so they are no longer "unreadable": the banner must not keep reporting them
    expect(secure.getUnavailableStructuredKeys().filter(item => item.key.includes(daughterId))).toEqual([]);

    // a late read of one of her keys is "no data": it creates nothing and brings nobody back
    for (const key of hers) {expect(await secure.default.getItem(key)).toBeNull();}
    expect((await AsyncStorage.getAllKeys()).filter(key => key.includes(daughterId))).toEqual([]);

    const cold = coldStart();
    expect((await M.profiles().hydrateManagedProfiles()).some(profile => profile.id === daughterId)).toBe(false);
    await M.active().hydrateActiveProfileId();
    await M.active().setActiveProfileId(daughterId); // refused: she does not exist any more
    expect(M.active().getActiveProfileId()).toBe(OWNER);
    await settle();
    expect(cold.getUnavailableStructuredKeys().filter(item => item.key.includes(daughterId))).toEqual([]);
    expect((await AsyncStorage.getAllKeys()).filter(key => key.includes(daughterId))).toEqual([]);
    expect(await profileView()).toMatchObject({cycleDuration: 31, confirmed: true, reminderTime: '21:30', qadaaDays: 7});
  });
});
