import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getIrregularJournalEntry,
  migrateLegacyPlainIrregularNotes,
  saveIrregularFatigueEntry,
  saveIrregularJournalEntry,
  saveIrregularJournalField,
} from '../irregularJournalStore';

const STORAGE_KEY = '@hawa/irregular-journal/v1';

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

// See postpartumJournalStore.test.ts's header comment — same in-memory
// singleton constraint applies here; tests below share state within this
// describe block only (each uses its own dates, isolated from the block
// above), and the migration test runs first since it's the first call to
// hydrateIrregularJournal() in this file.
describe('irregularJournalStore — encryption at rest (details[category].note)', () => {
  it('migrates a legacy plaintext note nested under details[category], preserving content exactly', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        '2026-07-01': {
          date: '2026-07-01',
          acne: 'Modérée',
          details: {
            acne: {note: 'Poussée après le stress du travail', areas: ['Menton']},
          },
        },
      }),
    );

    await migrateLegacyPlainIrregularNotes();

    const entry = getIrregularJournalEntry('2026-07-01');
    expect(entry?.details?.acne?.note).toBe('Poussée après le stress du travail');
    expect(entry?.details?.acne?.areas).toEqual(['Menton']);
    expect(entry?.acne).toBe('Modérée');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!)['2026-07-01'];
    expect(typeof persisted.details.acne.note).toBe('object');
    expect(persisted.details.acne.note.ciphertext).toBeDefined();
    expect(JSON.stringify(persisted)).not.toContain('Poussée après le stress');
  });

  it('migration is idempotent', async () => {
    await migrateLegacyPlainIrregularNotes();
    await migrateLegacyPlainIrregularNotes();
    expect(getIrregularJournalEntry('2026-07-01')?.details?.acne?.note).toBe(
      'Poussée après le stress du travail',
    );
  });

  it('migration is a no-op when nothing is legacy plaintext', async () => {
    const before = await AsyncStorage.getItem(STORAGE_KEY);
    await migrateLegacyPlainIrregularNotes();
    const after = await AsyncStorage.getItem(STORAGE_KEY);
    expect(after).toBe(before);
  });

  it('a fresh save encrypts details[category].note at rest while keeping the in-memory value plaintext', async () => {
    await saveIrregularJournalEntry('2026-07-02', 'pain', 'Forte', {
      note: 'Douleur au réveil, atténuée dans la journée',
      painLevel: 'Forte',
    });

    expect(getIrregularJournalEntry('2026-07-02')?.details?.pain?.note).toBe(
      'Douleur au réveil, atténuée dans la journée',
    );

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!)['2026-07-02'];
    expect(typeof persisted.details.pain.note).toBe('object');
    expect(JSON.stringify(persisted)).not.toContain('Douleur au réveil');
  });

  it('multiple categories on the same day each get their own note independently encrypted', async () => {
    await saveIrregularJournalEntry('2026-07-03', 'acne', 'Légère', {note: 'Note acné'});
    await saveIrregularJournalEntry('2026-07-03', 'mood', 'Bien', {note: 'Note humeur'});

    const entry = getIrregularJournalEntry('2026-07-03');
    expect(entry?.details?.acne?.note).toBe('Note acné');
    expect(entry?.details?.mood?.note).toBe('Note humeur');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!)['2026-07-03'];
    expect(typeof persisted.details.acne.note).toBe('object');
    expect(typeof persisted.details.mood.note).toBe('object');
  });

  it('an empty note is never persisted as an encrypted blob — the field is simply absent', async () => {
    await saveIrregularJournalEntry('2026-07-04', 'weight', '65 kg', {note: ''});

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!)['2026-07-04'];
    expect(persisted.details.weight.note).toBeUndefined();
    expect(getIrregularJournalEntry('2026-07-04')?.details?.weight?.note).toBeFalsy();
  });

  it('structured details fields (areas, symptoms, status, painLevel) remain plaintext at rest', async () => {
    await saveIrregularJournalEntry('2026-07-05', 'pain', 'Modérée', {
      note: 'Une autre note',
      painLevel: 'Modérée',
      areas: ['Bas du dos'],
    });

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!)['2026-07-05'];
    expect(persisted.details.pain.painLevel).toBe('Modérée');
    expect(persisted.details.pain.areas).toEqual(['Bas du dos']);
  });
});
