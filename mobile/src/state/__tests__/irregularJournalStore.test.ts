import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getIrregularJournalEntry,
  saveIrregularFatigueEntry,
  saveIrregularJournalField,
} from '../irregularJournalStore';

// The store keeps an in-memory singleton (`entries`) that persists across
// tests in this file regardless of AsyncStorage.clear() — same constraint
// every other AWA journal store test file works within. Each test below
// uses its own distinct date(s) so tests can never leak into each other,
// rather than relying on the total entry count.

describe('irregularJournalStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('saves acne for a given date', async () => {
    await saveIrregularJournalField('2026-01-01', 'acne', 'Légère');
    expect(getIrregularJournalEntry('2026-01-01')?.acne).toBe('Légère');
  });

  it('editing the same category on the same date upserts in place — no duplicate entry', async () => {
    await saveIrregularJournalField('2026-01-02', 'acne', 'Légère');
    await saveIrregularJournalField('2026-01-02', 'acne', 'Modérée');
    expect(getIrregularJournalEntry('2026-01-02')?.acne).toBe('Modérée');
  });

  it('saves a hair-growth observation', async () => {
    await saveIrregularJournalField('2026-01-03', 'hairGrowth', 'Légère');
    expect(getIrregularJournalEntry('2026-01-03')?.hairGrowth).toBe('Légère');
  });

  it('saves a weight measurement exactly as typed, never parsed/converted', async () => {
    await saveIrregularJournalField('2026-01-04', 'weight', '68,5 kg');
    expect(getIrregularJournalEntry('2026-01-04')?.weight).toBe('68,5 kg');
  });

  it('saves pain', async () => {
    await saveIrregularJournalField('2026-01-05', 'pain', 'Forte');
    expect(getIrregularJournalEntry('2026-01-05')?.pain).toBe('Forte');
  });

  it('saves mood', async () => {
    await saveIrregularJournalField('2026-01-06', 'mood', 'Bien');
    expect(getIrregularJournalEntry('2026-01-06')?.mood).toBe('Bien');
  });

  it('saves fatigue together with its associated symptoms in one atomic call', async () => {
    await saveIrregularFatigueEntry('2026-01-07', 'Modérée', ['Ballonnements', 'Nausées']);
    const entry = getIrregularJournalEntry('2026-01-07');
    expect(entry?.fatigue).toBe('Modérée');
    expect(entry?.symptoms).toEqual(['Ballonnements', 'Nausées']);
  });

  it('an explicitly empty symptoms selection is still a real saved entry, not "not recorded"', async () => {
    await saveIrregularFatigueEntry('2026-01-08', 'Aucune', []);
    const entry = getIrregularJournalEntry('2026-01-08');
    expect(entry?.fatigue).toBe('Aucune');
    expect(entry?.symptoms).toEqual([]);
  });

  it('an explicit "Aucune" value counts as a real saved entry, not missing data', async () => {
    await saveIrregularJournalField('2026-01-09', 'pain', 'Aucune');
    expect(getIrregularJournalEntry('2026-01-09')?.pain).toBe('Aucune');
  });

  it('keeps different dates fully isolated from each other', async () => {
    await saveIrregularJournalField('2026-02-01', 'mood', 'Bien');
    await saveIrregularJournalField('2026-02-02', 'mood', 'Difficile');
    expect(getIrregularJournalEntry('2026-02-01')?.mood).toBe('Bien');
    expect(getIrregularJournalEntry('2026-02-02')?.mood).toBe('Difficile');
  });

  it('keeps different dates in the SAME month fully isolated from each other', async () => {
    await saveIrregularJournalField('2026-03-10', 'weight', '65 kg');
    await saveIrregularJournalField('2026-03-11', 'weight', '65,4 kg');
    expect(getIrregularJournalEntry('2026-03-10')?.weight).toBe('65 kg');
    expect(getIrregularJournalEntry('2026-03-11')?.weight).toBe('65,4 kg');
  });

  it('lets several categories coexist on the same day without overwriting each other', async () => {
    const date = '2026-04-01';
    await saveIrregularJournalField(date, 'acne', 'Légère');
    await saveIrregularJournalField(date, 'pain', 'Modérée');
    await saveIrregularJournalField(date, 'mood', 'Bien');

    const entry = getIrregularJournalEntry(date);
    expect(entry?.acne).toBe('Légère');
    expect(entry?.pain).toBe('Modérée');
    expect(entry?.mood).toBe('Bien');
  });

  it('a category never saved for a date stays undefined — never a fabricated value', async () => {
    await saveIrregularJournalField('2026-05-01', 'acne', 'Légère');
    const entry = getIrregularJournalEntry('2026-05-01');
    expect(entry?.hairGrowth).toBeUndefined();
    expect(entry?.weight).toBeUndefined();
    expect(entry?.pain).toBeUndefined();
    expect(entry?.mood).toBeUndefined();
    expect(entry?.fatigue).toBeUndefined();
  });

  it('a date never saved at all has no entry — never a fabricated default entry', () => {
    expect(getIrregularJournalEntry('2026-06-01')).toBeUndefined();
  });
});
