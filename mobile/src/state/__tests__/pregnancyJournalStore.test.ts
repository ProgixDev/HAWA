import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPregnancyJournalState,
  migrateLegacyPlainPregnancyNotes,
  savePregnancyMedicalInformation,
  savePregnancySymptoms,
} from '../pregnancyJournalStore';

const STORAGE_KEY = '@hawa/pregnancy-journal/v1';

describe('pregnancyJournalStore — medicalInformationHistory', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('keeps independent entries for different dates instead of overwriting the previous one', async () => {
    await savePregnancyMedicalInformation({
      date: '2026-08-24',
      note: 'Entrée A',
      updatedAt: '2026-08-24T10:00:00.000Z',
    });

    await savePregnancyMedicalInformation({
      date: '2026-08-25',
      note: 'Entrée B',
      updatedAt: '2026-08-25T10:00:00.000Z',
    });

    const state = await getPregnancyJournalState();

    expect(state.medicalInformationHistory).toHaveLength(2);
    expect(
      state.medicalInformationHistory.find(entry => entry.date === '2026-08-24')?.note,
    ).toBe('Entrée A');
    expect(
      state.medicalInformationHistory.find(entry => entry.date === '2026-08-25')?.note,
    ).toBe('Entrée B');
  });

  it('replaces the entry for the same date instead of duplicating it', async () => {
    await savePregnancyMedicalInformation({
      date: '2026-08-24',
      note: 'Première version',
      updatedAt: '2026-08-24T10:00:00.000Z',
    });

    await savePregnancyMedicalInformation({
      date: '2026-08-24',
      note: 'Version corrigée',
      updatedAt: '2026-08-24T11:00:00.000Z',
    });

    const state = await getPregnancyJournalState();
    const entriesForDay = state.medicalInformationHistory.filter(entry => entry.date === '2026-08-24');

    expect(entriesForDay).toHaveLength(1);
    expect(entriesForDay[0].note).toBe('Version corrigée');
  });

  it('always appends undated entries as distinct records since they have no upsert key', async () => {
    await savePregnancyMedicalInformation({
      note: 'Allergie permanente',
      updatedAt: '2026-08-24T10:00:00.000Z',
    });

    await savePregnancyMedicalInformation({
      note: 'Autre note sans date',
      updatedAt: '2026-08-25T10:00:00.000Z',
    });

    const state = await getPregnancyJournalState();
    expect(state.medicalInformationHistory).toHaveLength(2);
  });

  it('migrates a legacy single-record medicalInformation into the history array without losing it', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        symptoms: [],
        weights: [],
        medicalInformation: {
          date: '2026-08-20',
          note: 'Ancienne note enregistrée avant la migration',
          updatedAt: '2026-08-20T09:00:00.000Z',
        },
      }),
    );

    const state = await getPregnancyJournalState();

    expect(state.medicalInformationHistory).toHaveLength(1);
    expect(state.medicalInformationHistory[0].note).toBe(
      'Ancienne note enregistrée avant la migration',
    );

    await savePregnancyMedicalInformation({
      date: '2026-08-25',
      note: 'Nouvelle entrée après migration',
      updatedAt: '2026-08-25T10:00:00.000Z',
    });

    const stateAfter = await getPregnancyJournalState();
    expect(stateAfter.medicalInformationHistory).toHaveLength(2);
    expect(
      stateAfter.medicalInformationHistory.find(entry => entry.date === '2026-08-20'),
    ).toBeDefined();
    expect(
      stateAfter.medicalInformationHistory.find(entry => entry.date === '2026-08-25'),
    ).toBeDefined();
  });
});

describe('pregnancyJournalStore — encryption at rest', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('a fresh medicalInformationHistory note is encrypted at rest while the read-back value stays plaintext', async () => {
    await savePregnancyMedicalInformation({
      date: '2026-09-01',
      note: 'Suivi tensiomètre à domicile',
      updatedAt: '2026-09-01T10:00:00.000Z',
    });

    const state = await getPregnancyJournalState();
    expect(state.medicalInformationHistory[0].note).toBe('Suivi tensiomètre à domicile');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!).medicalInformationHistory[0];
    expect(typeof persisted.note).toBe('object');
    expect(persisted.note.ciphertext).toBeDefined();
    expect(JSON.stringify(persisted)).not.toContain('tensiomètre');
  });

  it('a fresh symptom note is encrypted at rest while the symptoms list itself stays plaintext', async () => {
    await savePregnancySymptoms({
      date: '2026-09-02',
      symptoms: ['Nausées', 'Fatigue'],
      note: 'Surtout le matin',
      updatedAt: '2026-09-02T08:00:00.000Z',
    });

    const state = await getPregnancyJournalState();
    expect(state.symptoms[0].note).toBe('Surtout le matin');
    expect(state.symptoms[0].symptoms).toEqual(['Nausées', 'Fatigue']);

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!).symptoms[0];
    expect(typeof persisted.note).toBe('object');
    expect(persisted.symptoms).toEqual(['Nausées', 'Fatigue']);
    expect(JSON.stringify(persisted)).not.toContain('Surtout le matin');
  });

  it('migrates legacy plaintext notes (symptoms + medicalInformationHistory) to AES-256-GCM at rest, preserving content exactly', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        symptoms: [{date: '2026-08-15', symptoms: ['Vertiges'], note: 'Après le déjeuner', updatedAt: '2026-08-15T12:00:00.000Z'}],
        weights: [],
        medicalInformationHistory: [{date: '2026-08-16', note: 'Carence en fer diagnostiquée', updatedAt: '2026-08-16T09:00:00.000Z'}],
      }),
    );

    await migrateLegacyPlainPregnancyNotes();

    const state = await getPregnancyJournalState();
    expect(state.symptoms[0].note).toBe('Après le déjeuner');
    expect(state.medicalInformationHistory[0].note).toBe('Carence en fer diagnostiquée');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!);
    expect(typeof persisted.symptoms[0].note).toBe('object');
    expect(typeof persisted.medicalInformationHistory[0].note).toBe('object');
    expect(JSON.stringify(persisted)).not.toContain('Carence en fer');
  });

  it('migration is idempotent and a no-op when nothing is legacy plaintext', async () => {
    await migrateLegacyPlainPregnancyNotes();
    const before = await AsyncStorage.getItem(STORAGE_KEY);
    await migrateLegacyPlainPregnancyNotes();
    const after = await AsyncStorage.getItem(STORAGE_KEY);
    expect(after).toBe(before);
  });
});
