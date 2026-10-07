import AsyncStorage from '@react-native-async-storage/async-storage';

// confirmedPeriodHistoryStore.ts is a module singleton with a hydration
// cache, so every test loads a fresh copy on top of an empty AsyncStorage —
// same convention as src/state/__tests__/cyclePeriodHistory.test.ts.
type Store = typeof import('../confirmedPeriodHistoryStore');
let store: Store;

const HISTORY_KEY = '@hawa/confirmed-period-history';

const validOccurrence = (id: string) => ({
  id,
  periodStart: new Date(`${id}T00:00:00.000Z`).toISOString(),
  periodEndDateTime: new Date(`${id}T00:00:00.000Z`).toISOString(),
  capturedAt: new Date(`${id}T00:00:00.000Z`).toISOString(),
});

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.resetModules();
  store = require('../confirmedPeriodHistoryStore');
});

// AUDIT FIX — hydrateConfirmedPeriodHistory() used to gate the WHOLE stored
// array on `parsed.every(isValidOccurrence)`: if even one record failed
// validation, every other (valid, real, already-confirmed) occurrence was
// silently discarded too. Each occurrence is independent (keyed by its own
// `id`), so filtering per-record is safe and loses no valid history — this
// data also feeds qadaa (fasting makeup) calculations, where silently
// discarding it all would be a real-world cost.
describe('hydrateConfirmedPeriodHistory — per-record resilience, not all-or-nothing', () => {
  it('a single malformed record no longer discards the entire stored history', async () => {
    const stored = [
      validOccurrence('2026-01-05'),
      {id: '2026-01-12'}, // malformed: missing periodEndDateTime/capturedAt
      validOccurrence('2026-01-19'),
    ];
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(stored));

    const history = await store.hydrateConfirmedPeriodHistory();

    expect(history).toHaveLength(2);
    expect(history.map(occurrence => occurrence.id)).toEqual(['2026-01-05', '2026-01-19']);
  });

  it('preserves the original order of the valid records', async () => {
    const stored = [
      validOccurrence('2026-02-01'),
      null,
      validOccurrence('2026-03-01'),
      'not-an-object',
      validOccurrence('2026-04-01'),
    ];
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(stored));

    const history = await store.hydrateConfirmedPeriodHistory();

    expect(history.map(occurrence => occurrence.id)).toEqual(['2026-02-01', '2026-03-01', '2026-04-01']);
  });

  it('when ALL records are malformed, resolves to an empty history (not a crash)', async () => {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([{foo: 'bar'}, 42, null]));

    const history = await store.hydrateConfirmedPeriodHistory();

    expect(history).toEqual([]);
  });

  it('when every record is valid, behaves exactly as before (nothing dropped)', async () => {
    const stored = [validOccurrence('2026-05-01'), validOccurrence('2026-06-01')];
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(stored));

    const history = await store.hydrateConfirmedPeriodHistory();

    expect(history).toHaveLength(2);
  });

  it('getConfirmedPeriodHistory() reflects the same filtered result after hydration', async () => {
    const stored = [validOccurrence('2026-07-01'), {id: 'broken'}];
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(stored));

    await store.hydrateConfirmedPeriodHistory();

    expect(store.getConfirmedPeriodHistory().map(occurrence => occurrence.id)).toEqual(['2026-07-01']);
  });

  it('a non-array stored value still resolves to an empty history (not a crash)', async () => {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify({not: 'an array'}));

    const history = await store.hydrateConfirmedPeriodHistory();

    expect(history).toEqual([]);
  });

  it('recording a new occurrence after a partial-corruption hydrate still works normally', async () => {
    const stored = [validOccurrence('2026-08-01'), {id: 'broken'}];
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(stored));
    await store.hydrateConfirmedPeriodHistory();

    await store.recordConfirmedPeriodEnd(new Date(2026, 8, 1), new Date(2026, 8, 5));

    const history = store.getConfirmedPeriodHistory();
    expect(history.map(occurrence => occurrence.id)).toEqual(['2026-08-01', '2026-09-01']);
  });
});
