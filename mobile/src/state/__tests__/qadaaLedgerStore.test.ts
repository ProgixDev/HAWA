import AsyncStorage from '@react-native-async-storage/async-storage';
import {readStoredString} from '../../testUtils/structuredStorage';

type LedgerModule = typeof import('../qadaaLedgerStore');

const LEDGER_KEY = 'awa:qadaa:ledger:v1';
const LEGACY_KEY = 'awa:qadaa:progress:v1';
const CACHE_KEY = '@hawa/remaining-qadaa-days';

let store: LedgerModule;
// The AsyncStorage instance the CURRENT registry's store talks to (the mock is
// rebuilt on every registry reset, but shares the same backing data).
let storage: typeof AsyncStorage;

// A fresh module registry = an app restart: every in-memory singleton is
// rebuilt, only what reached AsyncStorage survives.
const restartApp = (): LedgerModule => {
  jest.resetModules();
  storage = require('@react-native-async-storage/async-storage').default;
  store = require('../qadaaLedgerStore');
  return store;
};

const stored = async () => JSON.parse((await readStoredString(LEDGER_KEY)) as string);

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.restoreAllMocks();
  restartApp();
});

describe('manual entries', () => {
  it('B. adds a manual entry with a stable id, source MANUAL and no fabricated date', async () => {
    await store.hydrateQadaaLedger();
    const entry = await store.addManualQadaaEntry({quantity: 2});
    expect(entry).toMatchObject({source: 'MANUAL', quantity: 2, year: null, yearSystem: null, note: null});
    expect(typeof entry.id).toBe('string');
    expect(entry.id.length).toBeGreaterThan(5);
    expect(entry.createdAt).toBe(entry.updatedAt);
    expect(store.getQadaaLedger().manualEntries).toEqual([entry]);
  });

  it('H. accepts a Ramadan from 10 years ago, with its year and calendar', async () => {
    await store.hydrateQadaaLedger();
    const entry = await store.addManualQadaaEntry({quantity: 6, year: 2016, yearSystem: 'gregorian'});
    expect(entry).toMatchObject({quantity: 6, year: 2016, yearSystem: 'gregorian'});
  });

  it('I. an unknown-year entry stores null year/system (no fake date, createdAt is separate)', async () => {
    await store.hydrateQadaaLedger();
    const now = new Date(2026, 8, 26, 10, 0, 0);
    const entry = await store.addManualQadaaEntry({quantity: 7}, now);
    expect(entry.year).toBeNull();
    expect(entry.yearSystem).toBeNull();
    expect(entry.createdAt).toBe(now.toISOString());
    expect(JSON.stringify(entry)).not.toMatch(/missedOn|missedDate/);
  });

  it.each([0, -1, 1.5, NaN, Infinity, 1000, '3' as unknown as number])('rejects the quantity %p', async quantity => {
    await store.hydrateQadaaLedger();
    await expect(store.addManualQadaaEntry({quantity})).rejects.toThrow();
    expect(store.getQadaaLedger().manualEntries).toEqual([]);
  });

  it('rejects a year without its calendar', async () => {
    await store.hydrateQadaaLedger();
    await expect(store.addManualQadaaEntry({quantity: 2, year: 2020})).rejects.toThrow();
  });

  it('N. double submit: the same submission id creates ONE entry', async () => {
    await store.hydrateQadaaLedger();
    const [first, second] = await Promise.all([
      store.addManualQadaaEntry({id: 'submission-1', quantity: 2}),
      store.addManualQadaaEntry({id: 'submission-1', quantity: 2}),
    ]);
    expect(second.id).toBe(first.id);
    expect(store.getQadaaLedger().manualEntries).toHaveLength(1);
    expect((await stored()).manualEntries).toHaveLength(1);
  });

  it('F. edits quantity / year / note and keeps id, source and createdAt', async () => {
    await store.hydrateQadaaLedger();
    const created = await store.addManualQadaaEntry({quantity: 4, year: 2020, yearSystem: 'gregorian'}, new Date(2026, 0, 1));
    const updated = await store.updateManualQadaaEntry(
      created.id,
      {quantity: 6, year: 1441, yearSystem: 'hijri', note: '  arrière  '},
      new Date(2026, 5, 1),
    );
    expect(updated).toMatchObject({id: created.id, source: 'MANUAL', quantity: 6, year: 1441, yearSystem: 'hijri', note: 'arrière'});
    expect(updated?.createdAt).toBe(created.createdAt);
    expect(updated?.updatedAt).not.toBe(created.updatedAt);
    expect(store.getQadaaLedger().manualEntries).toHaveLength(1);
  });

  it('F. editing can switch an entry back to "ancien solde"', async () => {
    await store.hydrateQadaaLedger();
    const created = await store.addManualQadaaEntry({quantity: 4, year: 2020, yearSystem: 'gregorian'});
    const updated = await store.updateManualQadaaEntry(created.id, {quantity: 4, year: null, yearSystem: null});
    expect(updated).toMatchObject({year: null, yearSystem: null});
  });

  it('editing an unknown id changes nothing and returns null', async () => {
    await store.hydrateQadaaLedger();
    await store.addManualQadaaEntry({quantity: 2});
    expect(await store.updateManualQadaaEntry('nope', {quantity: 9})).toBeNull();
    expect(store.getQadaaLedger().manualEntries[0].quantity).toBe(2);
  });

  it('G. deletes ONLY the chosen manual entry (other entries and completions untouched)', async () => {
    await store.hydrateQadaaLedger();
    const keep = await store.addManualQadaaEntry({quantity: 3, year: 2018, yearSystem: 'gregorian'});
    const drop = await store.addManualQadaaEntry({quantity: 2});
    await store.recordQadaaCompletion({});
    expect(await store.removeManualQadaaEntry(drop.id)).toBe(true);
    expect(store.getQadaaLedger().manualEntries).toEqual([keep]);
    expect(store.getQadaaLedger().completions).toHaveLength(1);
    expect(await store.removeManualQadaaEntry(drop.id)).toBe(false);
  });
});

describe('completion history', () => {
  it('D. records one completion with id, quantity, completedAt, completedOn and createdAt', async () => {
    await store.hydrateQadaaLedger();
    const at = new Date(2026, 8, 26, 9, 30, 0);
    const entry = await store.recordQadaaCompletion({completedAt: at, maxQuantity: 6});
    expect(entry).toMatchObject({quantity: 1, completedAt: at.toISOString(), completedOn: '2026-09-26', origin: 'USER'});
    expect(typeof entry?.id).toBe('string');
    expect(typeof entry?.createdAt).toBe('string');
  });

  it('completedOn is the LOCAL day (no UTC shift close to midnight)', async () => {
    await store.hydrateQadaaLedger();
    const lateEvening = new Date(2026, 8, 26, 23, 45, 0);
    const earlyMorning = new Date(2026, 8, 27, 0, 15, 0);
    expect((await store.recordQadaaCompletion({completedAt: lateEvening}))?.completedOn).toBe('2026-09-26');
    expect((await store.recordQadaaCompletion({completedAt: earlyMorning}))?.completedOn).toBe('2026-09-27');
  });

  it('never records more than the remaining balance allows (no negative remaining)', async () => {
    await store.hydrateQadaaLedger();
    expect(await store.recordQadaaCompletion({maxQuantity: 0})).toBeNull();
    expect((await store.recordQadaaCompletion({quantity: 5, maxQuantity: 2}))?.quantity).toBe(2);
    expect(store.getQadaaLedger().completions).toHaveLength(1);
  });

  it('rejects a non-positive / fractional quantity', async () => {
    await store.hydrateQadaaLedger();
    await expect(store.recordQadaaCompletion({quantity: 0})).rejects.toThrow();
    await expect(store.recordQadaaCompletion({quantity: -2})).rejects.toThrow();
    await expect(store.recordQadaaCompletion({quantity: 1.5})).rejects.toThrow();
  });

  it('N. the same completion id twice creates ONE completion', async () => {
    await store.hydrateQadaaLedger();
    await Promise.all([store.recordQadaaCompletion({id: 'tap-1'}), store.recordQadaaCompletion({id: 'tap-1'})]);
    expect(store.getQadaaLedger().completions).toHaveLength(1);
  });

  it('E. undo removes exactly that completion', async () => {
    await store.hydrateQadaaLedger();
    const first = await store.recordQadaaCompletion({});
    const second = await store.recordQadaaCompletion({});
    expect(await store.undoQadaaCompletion(first!.id)).toBe(true);
    expect(store.getQadaaLedger().completions.map(item => item.id)).toEqual([second!.id]);
    expect(await store.undoQadaaCompletion(first!.id)).toBe(false);
  });
});

describe('J. persistence / restart', () => {
  it('manual entries and completion history survive a restart, exactly', async () => {
    await store.hydrateQadaaLedger();
    const oldBalance = await store.addManualQadaaEntry({quantity: 5, year: 2016, yearSystem: 'gregorian', note: 'ancien'});
    const unknown = await store.addManualQadaaEntry({quantity: 7});
    const completion = await store.recordQadaaCompletion({completedAt: new Date(2026, 8, 26, 8, 0, 0)});
    const before = JSON.stringify(store.getQadaaLedger());

    restartApp();
    expect(store.getQadaaLedger().manualEntries).toEqual([]); // nothing in memory yet
    await store.hydrateQadaaLedger();
    expect(JSON.stringify(store.getQadaaLedger())).toBe(before);
    expect(store.getQadaaLedger().manualEntries.map(entry => entry.id)).toEqual([oldBalance.id, unknown.id]);
    expect(store.getQadaaLedger().completions.map(entry => entry.id)).toEqual([completion!.id]);
  });

  it('edits and deletions also survive a restart', async () => {
    await store.hydrateQadaaLedger();
    const a = await store.addManualQadaaEntry({quantity: 2});
    const b = await store.addManualQadaaEntry({quantity: 3});
    await store.updateManualQadaaEntry(a.id, {quantity: 3});
    await store.removeManualQadaaEntry(b.id);
    const done = await store.recordQadaaCompletion({});
    await store.undoQadaaCompletion(done!.id);

    restartApp();
    await store.hydrateQadaaLedger();
    expect(store.getQadaaLedger().manualEntries.map(entry => [entry.id, entry.quantity])).toEqual([[a.id, 3]]);
    expect(store.getQadaaLedger().completions).toEqual([]);
  });

  it('writes are ordered: the last state on disk is the latest state in memory', async () => {
    await store.hydrateQadaaLedger();
    const entry = await store.addManualQadaaEntry({quantity: 1});
    await Promise.all([
      store.updateManualQadaaEntry(entry.id, {quantity: 2}),
      store.updateManualQadaaEntry(entry.id, {quantity: 3}),
      store.updateManualQadaaEntry(entry.id, {quantity: 4}),
    ]);
    expect(store.getQadaaLedger().manualEntries[0].quantity).toBe(4);
    expect((await stored()).manualEntries[0].quantity).toBe(4);
  });

  it('a damaged entry is dropped on its own; the valid ones are kept', async () => {
    await AsyncStorage.setItem(
      LEDGER_KEY,
      JSON.stringify({
        version: 1,
        legacyProgressMigrated: true,
        manualEntries: [
          {id: 'ok', source: 'MANUAL', quantity: 3, year: null, yearSystem: null, note: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z'},
          {id: 'bad-quantity', quantity: -2, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z'},
          {id: 'ok', quantity: 9, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z'},
          'garbage',
        ],
        completions: [{id: 'c1', quantity: 1, completedAt: '2026-01-02T10:00:00.000Z', createdAt: '2026-01-02T10:00:00.000Z'}],
      }),
    );
    restartApp();
    const ledger = await store.hydrateQadaaLedger();
    expect(ledger.manualEntries.map(entry => [entry.id, entry.quantity])).toEqual([['ok', 3]]);
    expect(ledger.completions).toHaveLength(1);
    expect(ledger.completions[0].origin).toBe('USER');
  });

  it('an unreadable ledger is never overwritten by an empty one', async () => {
    await store.hydrateQadaaLedger();
    await store.addManualQadaaEntry({quantity: 5});
    const before = await readStoredString(LEDGER_KEY);

    restartApp();
    const getItem = storage.getItem as jest.Mock;
    const realGetItem = getItem.getMockImplementation() as (key: string) => Promise<string | null>;
    getItem.mockImplementation(async () => {
      throw new Error('storage unavailable');
    });
    await store.hydrateQadaaLedger(); // read failed: not hydrated, nothing invented
    // Refused either way. With structured encryption on, the failed READ of this record is reported as the record being
    // unavailable (so the person is pointed to the recovery screen); otherwise it is the store's own generic refusal.
    await expect(store.addManualQadaaEntry({quantity: 1})).rejects.toThrow(/refusing to write|structured data unavailable/);
    await expect(store.recordQadaaCompletion({})).rejects.toThrow(/refusing to write|structured data unavailable/);

    getItem.mockImplementation(realGetItem);
    expect(await readStoredString(LEDGER_KEY)).toBe(before); // disk untouched
    const recovered = await store.hydrateQadaaLedger(); // storage is back: retried
    expect(recovered.manualEntries.map(entry => entry.quantity)).toEqual([5]);
  });
});

describe('O. migration of the legacy completed-days counter', () => {
  const seedLegacy = (completedDays: number, updatedAt = new Date(2026, 5, 1, 12, 0, 0).getTime()) =>
    AsyncStorage.setItem(LEGACY_KEY, JSON.stringify({completedDays, updatedAt}));

  it('folds completedDays into ONE completion record, keeping the old remaining balance', async () => {
    await seedLegacy(3);
    restartApp();
    const ledger = await store.hydrateQadaaLedger();
    expect(ledger.legacyProgressMigrated).toBe(true);
    expect(ledger.completions).toHaveLength(1);
    expect(ledger.completions[0]).toMatchObject({
      id: store.QADAA_LEGACY_COMPLETION_ID,
      quantity: 3,
      origin: 'MIGRATED',
      completedOn: new Date(2026, 5, 1).toLocaleDateString('en-CA'),
    });
  });

  it('runs once: a second hydration / restart does not duplicate the completions', async () => {
    await seedLegacy(3);
    restartApp();
    await store.hydrateQadaaLedger();
    await store.hydrateQadaaLedger();

    restartApp();
    const ledger = await store.hydrateQadaaLedger();
    restartApp();
    const third = await store.hydrateQadaaLedger();
    expect(ledger.completions).toHaveLength(1);
    expect(third.completions).toHaveLength(1);
    expect(third.completions[0].quantity).toBe(3);
  });

  it('concurrent first hydrations still migrate once', async () => {
    await seedLegacy(2);
    restartApp();
    await Promise.all([store.hydrateQadaaLedger(), store.hydrateQadaaLedger(), store.hydrateQadaaLedger()]);
    expect(store.getQadaaLedger().completions).toHaveLength(1);
  });

  it('a migrated completion the user undoes never comes back', async () => {
    await seedLegacy(3);
    restartApp();
    await store.hydrateQadaaLedger();
    await store.undoQadaaCompletion(store.QADAA_LEGACY_COMPLETION_ID);
    restartApp();
    expect((await store.hydrateQadaaLedger()).completions).toEqual([]);
  });

  it('a user with no legacy progress gets no invented completion', async () => {
    restartApp();
    const ledger = await store.hydrateQadaaLedger();
    expect(ledger.completions).toEqual([]);
    expect(ledger.legacyProgressMigrated).toBe(true);
  });

  it('legacy 0 completed days → no completion record', async () => {
    await seedLegacy(0);
    restartApp();
    expect((await store.hydrateQadaaLedger()).completions).toEqual([]);
  });

  it('the legacy key and the cached remaining value are left in place, untouched', async () => {
    await seedLegacy(3);
    await AsyncStorage.setItem(CACHE_KEY, '2');
    const legacyBefore = await readStoredString(LEGACY_KEY);
    restartApp();
    await store.hydrateQadaaLedger();
    await store.recordQadaaCompletion({});
    expect(await readStoredString(LEGACY_KEY)).toBe(legacyBefore);
    expect(await readStoredString(CACHE_KEY)).toBe('2');
  });

  it('the confirmed period history is not touched by the migration', async () => {
    const history = JSON.stringify([
      {id: '2026-03-03', periodStart: '2026-03-03T00:00:00.000Z', periodEndDateTime: '2026-03-07T00:00:00.000Z', capturedAt: '2026-03-08T00:00:00.000Z'},
    ]);
    await AsyncStorage.setItem('@hawa/confirmed-period-history', history);
    await seedLegacy(2);
    restartApp();
    await store.hydrateQadaaLedger();
    expect(await readStoredString('@hawa/confirmed-period-history')).toBe(history);
  });

  it('an unreadable legacy counter is retried later, never recorded as "0 completed"', async () => {
    await seedLegacy(4);
    restartApp();
    const getItem = storage.getItem as jest.Mock;
    const original = getItem.getMockImplementation() as (key: string) => Promise<string | null>;
    getItem.mockImplementation(async (key: string) => {
      if (key === LEGACY_KEY) {throw new Error('legacy read failed');}
      return original(key);
    });
    await store.hydrateQadaaLedger();
    expect(store.getQadaaLedger().legacyProgressMigrated).toBe(false);
    expect(await readStoredString(LEDGER_KEY)).toBeNull();

    getItem.mockImplementation(original);
    restartApp();
    expect((await store.hydrateQadaaLedger()).completions[0]).toMatchObject({quantity: 4, origin: 'MIGRATED'});
  });
});

describe('the legacy progress store is read-only', () => {
  it('exposes no writer any more (nothing can drift away from the ledger)', () => {
    const legacy = require('../qadaaProgressStore');
    expect(Object.keys(legacy)).toEqual(['hydrateQadaaProgress']);
  });
});
