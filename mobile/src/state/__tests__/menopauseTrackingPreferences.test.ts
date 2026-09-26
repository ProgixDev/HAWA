import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getMenopausePreferences,
  setMenopauseHormonalTreatmentStatus,
  setMenopauseLabTracking,
  setMenopauseStage,
  setMenopauseTrackedSymptoms,
} from '../menopausePreferences';
import {
  addMenopauseLabResult,
  getAllMenopauseJournalEntries,
  getMenopauseJournalEntry,
  getMenopauseLabResults,
  saveMenopauseJournalField,
} from '../menopauseJournalStore';
import {
  MENOPAUSE_SYMPTOM_OPTIONS,
  getVisibleMenopauseSymptomOptions,
} from '../../config/menopauseJournalConfig';

// Tracking PREFERENCES steer what the UI offers now; they must never rewrite
// or delete recorded history.
const ids = (options: ReturnType<typeof getVisibleMenopauseSymptomOptions>) => options.map(option => option.id);

describe('A — onboarding-selected symptoms control the symptom-tracking UI', () => {
  it('offers exactly the tracked symptoms, not all six', () => {
    expect(ids(getVisibleMenopauseSymptomOptions(['hot_flashes', 'night_sweats']))).toEqual(['hot_flashes', 'night_sweats']);
    expect(MENOPAUSE_SYMPTOM_OPTIONS).toHaveLength(6);
  });

  it('keeps the canonical option order whatever order they were chosen in', () => {
    expect(ids(getVisibleMenopauseSymptomOptions(['brain_fog', 'hot_flashes']))).toEqual(['hot_flashes', 'brain_fog']);
  });

  it('a symptom already recorded for the day stays offered even when no longer tracked', () => {
    expect(ids(getVisibleMenopauseSymptomOptions(['hot_flashes'], ['fatigue']))).toEqual(['hot_flashes', 'fatigue']);
  });

  it('zero tracked symptoms is a real empty result — it does NOT fall back to "all six"', () => {
    expect(getVisibleMenopauseSymptomOptions([])).toEqual([]);
  });
});

describe('B/C/D — editing preferences never touches recorded history', () => {
  beforeAll(async () => {
    await setMenopauseTrackedSymptoms(['hot_flashes', 'night_sweats']);
    await setMenopauseHormonalTreatmentStatus('track');
    await setMenopauseLabTracking('both');
    await saveMenopauseJournalField('2026-09-01', 'symptoms', ['hot_flashes', 'night_sweats']);
    await saveMenopauseJournalField('2026-09-02', 'symptoms', ['night_sweats', 'brain_fog']);
    await saveMenopauseJournalField('2026-09-02', 'treatmentStatus', 'taken');
    await saveMenopauseJournalField('2026-09-02', 'mood', 'good');
    await saveMenopauseJournalField('2026-09-02', 'sleepDurationHours', 7);
    await saveMenopauseJournalField('2026-09-02', 'energyLevel', 'medium');
    await addMenopauseLabResult({type: 'fsh', value: 40, unit: 'UI/L', date: '2026-09-03'});
  });

  const snapshot = async () => ({
    entries: getAllMenopauseJournalEntries(),
    labs: getMenopauseLabResults(),
    rawEntries: await AsyncStorage.getItem('@hawa/menopause-journal/v1'),
    rawLabs: await AsyncStorage.getItem('@hawa/menopause-lab-results/v1'),
  });

  it('B. editing symptoms [A, B] → [A, C]: current preference changes, historical B entries stay', async () => {
    const before = await snapshot();
    await setMenopauseTrackedSymptoms(['hot_flashes', 'brain_fog']);

    expect(getMenopausePreferences().trackedSymptoms).toEqual(['hot_flashes', 'brain_fog']);
    // current UI: A and C offered, B (night_sweats) no longer offered by default
    expect(ids(getVisibleMenopauseSymptomOptions(getMenopausePreferences().trackedSymptoms))).toEqual([
      'hot_flashes',
      'brain_fog',
    ]);
    // ...but the history is exactly as it was, in memory and in storage
    const after = await snapshot();
    expect(after).toEqual(before);
    expect(getMenopauseJournalEntry('2026-09-01')?.symptoms).toEqual(['hot_flashes', 'night_sweats']);
    expect(getMenopauseJournalEntry('2026-09-02')?.symptoms).toEqual(['night_sweats', 'brain_fog']);
  });

  it('editing to zero tracked symptoms keeps every historical symptom entry', async () => {
    const before = await snapshot();
    await setMenopauseTrackedSymptoms([]);
    expect(getMenopausePreferences().trackedSymptoms).toEqual([]);
    expect(await snapshot()).toEqual(before);
  });

  it('C. turning treatment tracking off keeps the treatment history; turning it on again shows it', async () => {
    const before = await snapshot();
    await setMenopauseHormonalTreatmentStatus('no');
    expect(getMenopausePreferences().hormonalTreatmentStatus).toBe('no');
    expect(getMenopauseJournalEntry('2026-09-02')?.treatmentStatus).toBe('taken');
    expect(await snapshot()).toEqual(before);

    await setMenopauseHormonalTreatmentStatus('track');
    expect(getMenopausePreferences().hormonalTreatmentStatus).toBe('track');
    expect(getMenopauseJournalEntry('2026-09-02')?.treatmentStatus).toBe('taken');
  });

  it('D. changing / disabling lab tracking keeps the recorded lab results', async () => {
    const before = await snapshot();
    await setMenopauseLabTracking('none');
    expect(getMenopausePreferences().labTracking).toBe('none');
    await setMenopauseLabTracking('estradiol');
    expect(getMenopausePreferences().labTracking).toBe('estradiol');
    expect(getMenopauseLabResults('fsh')).toHaveLength(1);
    expect(await snapshot()).toEqual(before);
  });

  it('changing the stage keeps mood / sleep / energy history and the other preferences', async () => {
    const before = await snapshot();
    const otherPrefs = {...getMenopausePreferences()};
    await setMenopauseStage('menopause');
    expect(getMenopausePreferences()).toEqual({...otherPrefs, stage: 'menopause'});
    expect(await snapshot()).toEqual(before);
    expect(getMenopauseJournalEntry('2026-09-02')).toMatchObject({mood: 'good', sleepDurationHours: 7, energyLevel: 'medium'});
  });
});
