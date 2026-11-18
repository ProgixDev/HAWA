import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  correctPeriodOccurrence,
  getHasConfirmedCycleDuration,
  getHasExplicitPeriodDuration,
  getPeriodHistory,
  getRecordedPeriodHistory,
  reloadCycleStateFromStorage,
  setCyclePreferences,
} from '../onboardingPreferences';
import {recordConfirmedPeriodEnd, removeConfirmedPeriodOccurrence} from '../confirmedPeriodHistoryStore';
import {OWNER_PROFILE_ID, getActiveProfileId, resetActiveProfileForTests} from '../activeProfileStore';
import {profileScopedKey} from '../profileScopedStorage';

// What is a PREDICTED end of period, and what is an end the person herself entered / edited / confirmed — and when does a saved configuration count as an
// explicit period length. The real store, the real storage adapter; AsyncStorage is the in-memory test mock.

const CYCLE_KEY = () => profileScopedKey('@hawa/cycle-preferences', getActiveProfileId());
const START = new Date(2026, 10, 14, 12, 0, 0);
const cycle = (periodDuration = 5, start = START) => ({lastPeriodStart: start, periodDuration, cycleDuration: 29, regularity: 'yes' as const});
const record = () => getRecordedPeriodHistory().find(item => item.startDate === '2026-11-14');

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetActiveProfileForTests();
  await removeConfirmedPeriodOccurrence(START); // the confirmed-period history is a singleton: leave nothing behind
  await reloadCycleStateFromStorage();
});

describe('explicit period length', () => {
  it('nothing is explicit on a fresh profile', () => {
    expect(getHasExplicitPeriodDuration()).toBe(false);
  });

  it('saving the configuration with the proposed 5 days confirms the data but NOT the period length', async () => {
    await setCyclePreferences(cycle(5));
    expect(getHasConfirmedCycleDuration()).toBe(true); // the existing flag is unchanged
    expect(getHasExplicitPeriodDuration()).toBe(false);
  });

  it('picking the period length (even the same 5 days) makes it explicit', async () => {
    await setCyclePreferences(cycle(5), {periodDurationExplicit: true});
    expect(getHasExplicitPeriodDuration()).toBe(true);
  });

  it('it is stored with the cycle snapshot and survives a restart', async () => {
    await setCyclePreferences(cycle(6), {periodDurationExplicit: true});
    expect(JSON.parse((await AsyncStorage.getItem(CYCLE_KEY())) as string).hasExplicitPeriodDuration).toBe(true);
    await reloadCycleStateFromStorage(); // a new launch re-reads storage
    expect(getHasExplicitPeriodDuration()).toBe(true);
  });

  it('a later save that leaves the length unchanged keeps it explicit; a save that changes it WITHOUT an explicit choice does not', async () => {
    await setCyclePreferences(cycle(6), {periodDurationExplicit: true});
    await setCyclePreferences({...cycle(6), cycleDuration: 30});
    expect(getHasExplicitPeriodDuration()).toBe(true);
    await setCyclePreferences(cycle(4));
    expect(getHasExplicitPeriodDuration()).toBe(false);
  });

  it('an installation saved before this flag existed is NOT treated as explicit (no reliable evidence), while its other flags keep their migration', async () => {
    const legacy = {
      preferences: {lastPeriodStart: START.toISOString(), periodDuration: 5, cycleDuration: 28, regularity: 'yes'},
      periodHistory: [{id: '2026-11-14', startDate: '2026-11-14', endDate: '2026-11-18'}],
      observationStartedAt: null,
      hasConfirmedCycleData: true,
      hasConfirmedCycleDuration: true,
    };
    await AsyncStorage.setItem(CYCLE_KEY(), JSON.stringify(legacy));
    await reloadCycleStateFromStorage();
    expect(getHasConfirmedCycleDuration()).toBe(true);
    expect(getHasExplicitPeriodDuration()).toBe(false);
    expect(getRecordedPeriodHistory()).toEqual(legacy.periodHistory); // nothing rewritten: no endConfirmed invented, nothing deleted
  });

  it('a blob older than every flag is not explicit either', async () => {
    await AsyncStorage.setItem(CYCLE_KEY(), JSON.stringify({preferences: {lastPeriodStart: START.toISOString(), periodDuration: 5, cycleDuration: 28, regularity: 'yes'}}));
    await reloadCycleStateFromStorage();
    expect(getHasExplicitPeriodDuration()).toBe(false);
  });

  it('switching profile does not carry an explicit length to another profile', async () => {
    await setCyclePreferences(cycle(6), {periodDurationExplicit: true});
    expect(getActiveProfileId()).toBe(OWNER_PROFILE_ID);
    await AsyncStorage.removeItem(CYCLE_KEY());
    await reloadCycleStateFromStorage();
    expect(getHasExplicitPeriodDuration()).toBe(false);
  });
});

describe('which period ends are the person\'s own', () => {
  it('a projected end carries no flag: the end that setCyclePreferences records is only the projection', async () => {
    await setCyclePreferences(cycle(5), {periodDurationExplicit: true});
    expect(record()).toEqual({id: '2026-11-14', startDate: '2026-11-14', endDate: '2026-11-18'});
    expect(record()?.endConfirmed).toBeUndefined();
  });

  it('changing the usual length does NOT move a period that is already recorded (1 Nov + 5 days stays 5 Nov after 5 → 6); the next period follows the new length', async () => {
    const november = new Date(2026, 10, 1, 12, 0, 0);
    await setCyclePreferences(cycle(5, november), {periodDurationExplicit: true});
    const endOf = (startKey: string) => getRecordedPeriodHistory().find(item => item.startDate === startKey)?.endDate;
    expect(endOf('2026-11-01')).toBe('2026-11-05');
    await setCyclePreferences(cycle(6, november), {periodDurationExplicit: true});
    expect(endOf('2026-11-01')).toBe('2026-11-05'); // unchanged
    expect(getRecordedPeriodHistory().find(item => item.startDate === '2026-11-01')?.endConfirmed).toBeUndefined();
    await setCyclePreferences(cycle(6, new Date(2026, 10, 30, 12, 0, 0)), {periodDurationExplicit: true}); // the next period
    expect(endOf('2026-11-30')).toBe('2026-12-05');
    expect(endOf('2026-11-01')).toBe('2026-11-05');
  });

  it('a range edited by the person (correctPeriodOccurrence with an end) is flagged as hers', async () => {
    await setCyclePreferences(cycle(5), {periodDurationExplicit: true});
    await correctPeriodOccurrence(START, START, new Date(2026, 10, 18, 12, 0, 0)); // the SAME end as the projection
    expect(record()).toEqual({id: '2026-11-14', startDate: '2026-11-14', endDate: '2026-11-18', endConfirmed: true});
  });

  it('a user-set end is never overwritten by a later change of the usual length — even when it equals the projection', async () => {
    await setCyclePreferences(cycle(5), {periodDurationExplicit: true});
    await correctPeriodOccurrence(START, START, new Date(2026, 10, 18, 12, 0, 0));
    await setCyclePreferences(cycle(8), {periodDurationExplicit: true});
    expect(record()?.endDate).toBe('2026-11-18');
    expect(record()?.endConfirmed).toBe(true);
  });

  it('moving only the start of a projected period keeps it a projection (the length is carried over, not "given")', async () => {
    await setCyclePreferences(cycle(5), {periodDurationExplicit: true});
    await correctPeriodOccurrence(START, new Date(2026, 10, 15, 12, 0, 0));
    const moved = getPeriodHistory().find(item => item.startDate === '2026-11-15');
    expect(moved?.endDate).toBe('2026-11-19');
    expect(moved?.endConfirmed).toBeUndefined();
  });

  it('moving the start of a period whose end she gave keeps it hers', async () => {
    await setCyclePreferences(cycle(5), {periodDurationExplicit: true});
    await correctPeriodOccurrence(START, START, new Date(2026, 10, 17, 12, 0, 0));
    await correctPeriodOccurrence(START, new Date(2026, 10, 15, 12, 0, 0));
    expect(getPeriodHistory().find(item => item.startDate === '2026-11-15')?.endConfirmed).toBe(true);
  });

  it('confirming the end of the period (the confirmed-period history mirrors it into the record) flags it as hers', async () => {
    await setCyclePreferences(cycle(5), {periodDurationExplicit: true});
    await recordConfirmedPeriodEnd(START, new Date(2026, 10, 17, 12, 0, 0));
    expect(record()?.endDate).toBe('2026-11-17');
    expect(record()?.endConfirmed).toBe(true);
  });

  it('the flag is persisted with the history and read back after a restart; a record written before the flag has none', async () => {
    await setCyclePreferences(cycle(5), {periodDurationExplicit: true});
    await correctPeriodOccurrence(START, START, new Date(2026, 10, 17, 12, 0, 0));
    await reloadCycleStateFromStorage();
    expect(record()?.endConfirmed).toBe(true);
  });
});
