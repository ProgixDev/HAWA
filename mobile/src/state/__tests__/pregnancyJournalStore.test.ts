import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPregnancyJournalState,
  savePregnancyMedicalInformation,
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
