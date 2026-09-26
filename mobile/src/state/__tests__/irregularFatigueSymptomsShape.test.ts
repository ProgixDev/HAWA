import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getIrregularJournalEntry,
  hydrateIrregularJournal,
  saveIrregularJournalEntry,
} from '../irregularJournalStore';
import {getIrregularFatigueSymptoms} from '../../utils/irregularJournalSelectors';

const STORAGE_KEY = '@hawa/irregular-journal/v1';

const persistedFor = async (date: string) => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw)[date] : undefined;
};

// The store keeps an in-memory singleton that outlives AsyncStorage.clear()
// (same constraint as irregularJournalStore.test.ts): the legacy-hydration
// test therefore runs FIRST, before anything else hydrates the store.
describe('SOPK fatigue associated symptoms — canonical shape', () => {
  it('LEGACY: an entry saved under details.fatigue.symptoms is still readable, and nothing else is lost', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        '2026-09-01': {
          date: '2026-09-01',
          acne: 'Légère',
          fatigue: 'Forte',
          details: {fatigue: {symptoms: ['Crampes', 'Nausées']}, acne: {areas: ['Visage']}},
        },
      }),
    );
    await hydrateIrregularJournal();

    const entry = getIrregularJournalEntry('2026-09-01');
    expect(getIrregularFatigueSymptoms(entry)).toEqual(['Crampes', 'Nausées']);
    expect(entry?.acne).toBe('Légère');
    expect(entry?.details?.acne?.areas).toEqual(['Visage']);
  });

  it('LEGACY: re-saving that day moves the symptoms to the canonical place — no duplicate copy — and keeps other data', async () => {
    await saveIrregularJournalEntry('2026-09-01', 'fatigue', 'Modérée', {symptoms: ['Crampes']});

    const entry = getIrregularJournalEntry('2026-09-01');
    expect(entry?.symptoms).toEqual(['Crampes']);
    expect(entry?.details?.fatigue).not.toHaveProperty('symptoms');
    expect(getIrregularFatigueSymptoms(entry)).toEqual(['Crampes']);
    expect(entry?.acne).toBe('Légère');
    expect(entry?.details?.acne?.areas).toEqual(['Visage']);

    const persisted = await persistedFor('2026-09-01');
    expect(persisted.symptoms).toEqual(['Crampes']);
    expect(persisted.details.fatigue.symptoms).toBeUndefined();
  });

  it('SAVE: fatigue level + associated symptoms are stored once, at the top level', async () => {
    await saveIrregularJournalEntry('2026-09-10', 'fatigue', 'Forte', {symptoms: ['Ballonnements', 'Maux de tête']});

    const entry = getIrregularJournalEntry('2026-09-10');
    expect(entry?.fatigue).toBe('Forte');
    expect(entry?.symptoms).toEqual(['Ballonnements', 'Maux de tête']);
    expect(entry?.details?.fatigue).not.toHaveProperty('symptoms');

    const persisted = await persistedFor('2026-09-10');
    expect(persisted.symptoms).toEqual(['Ballonnements', 'Maux de tête']);
    expect(JSON.stringify(persisted.details)).not.toContain('Ballonnements');
  });

  it('SAVE keeps the encrypted free-text note next to the symptoms', async () => {
    await saveIrregularJournalEntry('2026-09-11', 'fatigue', 'Modérée', {
      symptoms: ['Nausées'],
      note: 'SECRET_FATIGUE_NOTE',
    });
    expect(getIrregularJournalEntry('2026-09-11')?.details?.fatigue?.note).toBe('SECRET_FATIGUE_NOTE');
    const raw = (await AsyncStorage.getItem(STORAGE_KEY)) as string;
    expect(raw).not.toContain('SECRET_FATIGUE_NOTE');
  });

  it('EDIT: a new selection replaces the previous one', async () => {
    await saveIrregularJournalEntry('2026-09-12', 'fatigue', 'Forte', {symptoms: ['Nausées', 'Crampes']});
    await saveIrregularJournalEntry('2026-09-12', 'fatigue', 'Forte', {symptoms: ['Crampes', 'Autre']});
    expect(getIrregularFatigueSymptoms(getIrregularJournalEntry('2026-09-12'))).toEqual(['Crampes', 'Autre']);
  });

  it('REMOVE: clearing every symptom saves an explicit empty selection (fatigue level kept)', async () => {
    await saveIrregularJournalEntry('2026-09-13', 'fatigue', 'Forte', {symptoms: ['Nausées']});
    await saveIrregularJournalEntry('2026-09-13', 'fatigue', 'Forte', {symptoms: []});

    const entry = getIrregularJournalEntry('2026-09-13');
    expect(getIrregularFatigueSymptoms(entry)).toEqual([]);
    expect(entry?.fatigue).toBe('Forte');
    expect((await persistedFor('2026-09-13')).symptoms).toEqual([]);
  });

  it('other categories are untouched: pain keeps its own details.symptoms and never gets a top-level symptoms', async () => {
    await saveIrregularJournalEntry('2026-09-14', 'pain', 'Modérée', {symptoms: ['Dos']});
    const entry = getIrregularJournalEntry('2026-09-14');
    expect(entry?.details?.pain?.symptoms).toEqual(['Dos']);
    expect(entry?.symptoms).toBeUndefined();
    expect(getIrregularFatigueSymptoms(entry)).toEqual([]);
  });

  it('saving fatigue never disturbs the period answer of the same day', async () => {
    await saveIrregularJournalEntry('2026-09-15', 'period', 'Spotting', {status: 'spotting', flowIntensity: ''});
    await saveIrregularJournalEntry('2026-09-15', 'fatigue', 'Légère', {symptoms: ['Autre']});
    const entry = getIrregularJournalEntry('2026-09-15');
    expect(entry?.details?.period?.status).toBe('spotting');
    expect(entry?.period).toBe('Spotting');
    expect(entry?.symptoms).toEqual(['Autre']);
  });
});
