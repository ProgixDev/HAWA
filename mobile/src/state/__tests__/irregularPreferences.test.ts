import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getIrregularPreferences,
  setIrregularPreferences,
} from '../irregularPreferences';

// Same in-memory-singleton constraint as irregularJournalStore.test.ts —
// AsyncStorage.clear() doesn't reset the module's in-memory `preferences`
// object, so this suite verifies real save/read behavior through
// setIrregularPreferences()/getIrregularPreferences() (the same functions
// SOPK onboarding and Profile → Notifications & rappels actually call)
// rather than round-tripping through hydration in each test.

describe('irregularPreferences', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persists cyclePattern', async () => {
    await setIrregularPreferences({cyclePattern: 'very_variable'});
    expect(getIrregularPreferences().cyclePattern).toBe('very_variable');
  });

  it('persists a real selected lastPeriodDate', async () => {
    await setIrregularPreferences({lastPeriodDate: '2026-08-19'});
    expect(getIrregularPreferences().lastPeriodDate).toBe('2026-08-19');
  });

  it('persists an explicit null lastPeriodDate when the user skips — never a fabricated date', async () => {
    await setIrregularPreferences({lastPeriodDate: '2026-08-19'});
    await setIrregularPreferences({lastPeriodDate: null});
    expect(getIrregularPreferences().lastPeriodDate).toBeNull();
  });

  it('persists selected tracked items', async () => {
    await setIrregularPreferences({trackedItems: ['acne', 'weight', 'otherSymptoms']});
    expect(getIrregularPreferences().trackedItems).toEqual(['acne', 'weight', 'otherSymptoms']);
  });

  it('persists reminder preferences together', async () => {
    await setIrregularPreferences({
      reminders: {dailyJournalEnabled: true, dailyJournalTime: '20:30', unrecordedPeriodEnabled: true},
    });
    expect(getIrregularPreferences().reminders).toEqual({
      dailyJournalEnabled: true,
      dailyJournalTime: '20:30',
      unrecordedPeriodEnabled: true,
    });
  });

  it('a reminder change made from Profile (mode: edit) uses the SAME store onboarding wrote to — one source of truth', async () => {
    // Simulates onboarding turning the daily journal reminder ON...
    await setIrregularPreferences({
      reminders: {dailyJournalEnabled: true, dailyJournalTime: '09:00', unrecordedPeriodEnabled: false},
    });
    expect(getIrregularPreferences().reminders.dailyJournalEnabled).toBe(true);

    // ...then Profile -> Notifications & rappels (IrregularRemindersScreen
    // with {mode:'edit'}) turning it back OFF, via the exact same setter.
    await setIrregularPreferences({
      reminders: {dailyJournalEnabled: false, dailyJournalTime: '09:00', unrecordedPeriodEnabled: false},
    });
    expect(getIrregularPreferences().reminders.dailyJournalEnabled).toBe(false);
  });

  it('merges a partial update without clobbering fields the caller did not pass', async () => {
    await setIrregularPreferences({cyclePattern: 'irregular'});
    await setIrregularPreferences({trackedItems: ['mood']});
    const preferences = getIrregularPreferences();
    expect(preferences.cyclePattern).toBe('irregular');
    expect(preferences.trackedItems).toEqual(['mood']);
  });

  it('getIrregularPreferences never mutates the internal state (returns independent copies)', async () => {
    await setIrregularPreferences({trackedItems: ['acne']});
    const snapshot = getIrregularPreferences();
    snapshot.trackedItems.push('weight');
    expect(getIrregularPreferences().trackedItems).toEqual(['acne']);
  });
});
