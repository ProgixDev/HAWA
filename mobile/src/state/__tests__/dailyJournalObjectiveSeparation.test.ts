import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  currentDailyJournalBase,
  DAILY_JOURNAL_BASE_BY_OBJECTIVE,
  deleteJournalSection,
  getAllJournalEntries,
  getJournalEntry,
  migrateDailyJournalToObjectives,
  saveJournalSection,
} from '../dailyJournalStore';
import {setSelectedObjective} from '../onboardingPreferences';
import {STRUCTURED_ENCRYPTED_BASES} from '../../services/secureAsyncStorage';
import {readStoredString} from '../../testUtils/structuredStorage';

const LEGACY = '@hawa/daily-journal/v1';
const DONE_FLAG = '@awa/structured-migration/daily-journal-objective-split/v1';
const intimacy = (answer: 'yes' | 'no') => ({answer, protection: 'unknown', time: '21:30'} as never);

describe('daily journal — one journal per objective', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await setSelectedObjective('cycle');
  });

  it('what is recorded under "Suivre mon cycle" never appears under another objective, and comes back when she returns', async () => {
    await setSelectedObjective('cycle');
    await saveJournalSection('2026-09-01', 'encryptedIntimacy' as never, intimacy('no'));
    await saveJournalSection('2026-09-01', 'flow', {intensity: 'moderate'});

    await setSelectedObjective('conceive');
    expect(await getJournalEntry('2026-09-01')).toBeUndefined();
    expect(await getAllJournalEntries()).toEqual([]);

    await saveJournalSection('2026-09-01', 'encryptedIntimacy' as never, intimacy('yes'));
    expect((await getJournalEntry('2026-09-01'))?.flow).toBeUndefined();
    expect(((await getJournalEntry('2026-09-01')) as never as {encryptedIntimacy: {answer: string}}).encryptedIntimacy.answer).toBe('yes');

    await setSelectedObjective('cycle');
    const cycle = (await getJournalEntry('2026-09-01')) as never as {flow: {intensity: string}; encryptedIntimacy: {answer: string}};
    expect(cycle.flow.intensity).toBe('moderate');
    expect(cycle.encryptedIntimacy.answer).toBe('no');
  });

  it('deleting a section only touches the journal of the objective in use', async () => {
    await setSelectedObjective('cycle');
    await saveJournalSection('2026-09-02', 'flow', {intensity: 'light'});
    await setSelectedObjective('irregular');
    await saveJournalSection('2026-09-02', 'flow', {intensity: 'heavy'});
    await deleteJournalSection('2026-09-02', 'flow');
    expect((await getJournalEntry('2026-09-02'))?.flow).toBeUndefined();
    await setSelectedObjective('cycle');
    expect((await getJournalEntry('2026-09-02'))?.flow?.intensity).toBe('light');
  });

  it('"Suivre mon cycle" keeps the ORIGINAL key; every other objective has its own, and each is a declared encrypted base', () => {
    expect(DAILY_JOURNAL_BASE_BY_OBJECTIVE.cycle).toBe(LEGACY);
    const others = Object.entries(DAILY_JOURNAL_BASE_BY_OBJECTIVE).filter(([objective]) => objective !== 'cycle').map(([, base]) => base);
    expect(new Set(others).size).toBe(others.length);
    expect(others).not.toContain(LEGACY);
    for (const base of Object.values(DAILY_JOURNAL_BASE_BY_OBJECTIVE)) {
      expect(STRUCTURED_ENCRYPTED_BASES).toContain(base);
    }
  });

  it('follows the current objective', async () => {
    await setSelectedObjective('pregnancy');
    expect(currentDailyJournalBase()).toBe('@hawa/daily-journal/v1/pregnancy');
    await setSelectedObjective('cycle');
    expect(currentDailyJournalBase()).toBe(LEGACY);
  });
});

describe('daily journal — one-shot split of the former shared journal', () => {
  const stored = JSON.stringify([{id: 'a', date: '2026-09-03', flow: {intensity: 'moderate'}}]);

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('on "Suivre mon cycle" nothing moves and the flag is set', async () => {
    await AsyncStorage.setItem('@hawa/active-objective', 'cycle');
    await AsyncStorage.setItem(LEGACY, stored);
    expect(await migrateDailyJournalToObjectives()).toBe('not-needed');
    expect(await readStoredString(LEGACY)).toBe(stored);
    expect(await AsyncStorage.getItem(DONE_FLAG)).toBe('done');
  });

  it('on another objective the records move to that objective (verified), the original is removed, and cycle starts empty', async () => {
    await AsyncStorage.setItem('@hawa/active-objective', 'conceive');
    await AsyncStorage.setItem(LEGACY, stored);
    expect(await migrateDailyJournalToObjectives()).toBe('migrated');
    expect(await readStoredString('@hawa/daily-journal/v1/conceive')).toBe(stored);
    expect(await AsyncStorage.getItem(LEGACY)).toBeNull();

    await setSelectedObjective('conceive');
    expect((await getJournalEntry('2026-09-03'))?.flow?.intensity).toBe('moderate');
    await setSelectedObjective('cycle');
    expect(await getJournalEntry('2026-09-03')).toBeUndefined();
  });

  it('runs only once: records of "Suivre mon cycle" are never moved later when she changes objective', async () => {
    await AsyncStorage.setItem('@hawa/active-objective', 'cycle');
    await AsyncStorage.setItem(LEGACY, stored);
    await migrateDailyJournalToObjectives();
    await AsyncStorage.setItem('@hawa/active-objective', 'conceive');
    expect(await migrateDailyJournalToObjectives()).toBe('not-needed');
    expect(await readStoredString(LEGACY)).toBe(stored);
    expect(await AsyncStorage.getItem('@hawa/daily-journal/v1/conceive')).toBeNull();
  });

  it('a fresh install (no journal at all) just sets the flag', async () => {
    expect(await migrateDailyJournalToObjectives()).toBe('not-needed');
    expect(await AsyncStorage.getItem(DONE_FLAG)).toBe('done');
  });

  it('an interrupted run (copy done, original still there) finishes without losing or duplicating anything', async () => {
    await AsyncStorage.setItem('@hawa/active-objective', 'irregular');
    await AsyncStorage.setItem(LEGACY, stored);
    await AsyncStorage.setItem('@hawa/daily-journal/v1/irregular', stored);
    expect(await migrateDailyJournalToObjectives()).toBe('migrated');
    expect(await AsyncStorage.getItem(LEGACY)).toBeNull();
    expect(await readStoredString('@hawa/daily-journal/v1/irregular')).toBe(stored);
  });

  it('a different record already under the target objective is a conflict: nothing is deleted, the flag stays unset', async () => {
    await AsyncStorage.setItem('@hawa/active-objective', 'conceive');
    await AsyncStorage.setItem(LEGACY, stored);
    await AsyncStorage.setItem('@hawa/daily-journal/v1/conceive', '[{"id":"other","date":"2026-09-09"}]');
    expect(await migrateDailyJournalToObjectives()).toBe('conflict');
    expect(await readStoredString(LEGACY)).toBe(stored);
    expect(await AsyncStorage.getItem(DONE_FLAG)).toBeNull();
  });

  it('a copy that cannot be verified is rolled back and the original stays', async () => {
    await AsyncStorage.setItem('@hawa/active-objective', 'conceive');
    await AsyncStorage.setItem(LEGACY, stored);
    const realSet = AsyncStorage.setItem.bind(AsyncStorage);
    const spy = jest.spyOn(AsyncStorage, 'setItem').mockImplementation(async (key: string, value: string) => {
      // the copy lands altered: it can never be read back identical
      return realSet(key, key === '@hawa/daily-journal/v1/conceive' ? 'tampered' : value);
    });
    expect(await migrateDailyJournalToObjectives()).toBe('skipped');
    spy.mockRestore();
    expect(await readStoredString(LEGACY)).toBe(stored);
    expect(await AsyncStorage.getItem(DONE_FLAG)).toBeNull();
  });
});
