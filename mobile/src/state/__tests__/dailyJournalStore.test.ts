import AsyncStorage from '@react-native-async-storage/async-storage';
import {encryptFieldValue} from '../../services/atRestFieldEncryption';
import {
  getAllJournalEntries,
  getJournalEntry,
  migrateLegacyPlainDailyJournalNotes,
  saveJournalSection,
} from '../dailyJournalStore';

const STORAGE_KEY = '@hawa/daily-journal/v1';
// Matches the store's own private ENCRYPTION_SERVICE constant — duplicated
// here (not exported) only so this test can pre-construct an
// already-encrypted payload for the mixed-state migration scenario below.
const ENCRYPTION_SERVICE = 'com.hawa.private.daily-journal.encryption-key';

describe('dailyJournalStore — encryption at rest (per-category notes)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('a fresh save encrypts every populated nested note while the returned/read value stays plaintext', async () => {
    await saveJournalSection('2026-09-01', 'symptoms', {names: ['Ballonnements'], note: 'Douleur légère le matin'});
    await saveJournalSection('2026-09-01', 'mood', {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 4, note: 'Journée plutôt sereine'});

    const entry = await getJournalEntry('2026-09-01');
    expect(entry?.symptoms?.note).toBe('Douleur légère le matin');
    expect(entry?.mood?.note).toBe('Journée plutôt sereine');
    expect(entry?.symptoms?.names).toEqual(['Ballonnements']);
    expect(entry?.mood?.level).toBe('good');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!).find((e: {date: string}) => e.date === '2026-09-01');
    expect(typeof persisted.symptoms.note).toBe('object');
    expect(typeof persisted.mood.note).toBe('object');
    expect(persisted.symptoms.note.ciphertext).toBeDefined();
    expect(persisted.symptoms.names).toEqual(['Ballonnements']); // structured, plaintext
    expect(JSON.stringify(persisted)).not.toContain('Douleur légère');
    expect(JSON.stringify(persisted)).not.toContain('plutôt sereine');
  });

  it('per-category notes stay independent — encrypting one never disturbs another on the same day', async () => {
    await saveJournalSection('2026-09-02', 'flow', {intensity: 'moderate', note: 'Note règles'});
    await saveJournalSection('2026-09-02', 'sleep', {duration: '7h', note: 'Note sommeil'});
    await saveJournalSection('2026-09-02', 'weight', {value: 61, unit: 'kg'}); // no note at all

    const entry = await getJournalEntry('2026-09-02');
    expect(entry?.flow?.note).toBe('Note règles');
    expect(entry?.sleep?.note).toBe('Note sommeil');
    expect(entry?.weight?.note).toBeUndefined();
    expect(entry?.weight?.value).toBe(61);
  });

  it('an empty note is never persisted as an encrypted blob — the field is simply absent', async () => {
    await saveJournalSection('2026-09-03', 'temperature', {value: 36.7, unit: 'C', note: ''});

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!).find((e: {date: string}) => e.date === '2026-09-03');
    expect(persisted.temperature.note).toBeUndefined();

    const entry = await getJournalEntry('2026-09-03');
    expect(entry?.temperature?.note).toBeFalsy();
    expect(entry?.temperature?.value).toBe(36.7);
  });

  it('a missing category has no note and is never fabricated', async () => {
    await saveJournalSection('2026-09-04', 'activity', {type: 'Marche', durationMinutes: 20});
    const entry = await getJournalEntry('2026-09-04');
    expect(entry?.cervicalMucus).toBeUndefined();
    expect(entry?.lhTest).toBeUndefined();
    expect(entry?.activity?.note).toBeUndefined();
  });

  it('migrates a legacy plaintext note while leaving an already-encrypted sibling note untouched (mixed state), preserving content exactly', async () => {
    const alreadyEncryptedSymptomsNote = await encryptFieldValue(ENCRYPTION_SERVICE, 'Note symptômes déjà chiffrée');

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: '2026-09-05-1',
          date: '2026-09-05',
          symptoms: {names: ['Fatigue'], note: alreadyEncryptedSymptomsNote},
          mood: {level: 'tired', energy: 2, stress: 3, irritability: 2, motivation: 2, note: 'Note humeur en clair'},
          flow: {intensity: 'none', note: ''},
          cervicalMucus: {type: 'dry'}, // no note key at all
        },
      ]),
    );

    await migrateLegacyPlainDailyJournalNotes();

    const entry = await getJournalEntry('2026-09-05');
    expect(entry?.symptoms?.note).toBe('Note symptômes déjà chiffrée');
    expect(entry?.mood?.note).toBe('Note humeur en clair');
    expect(entry?.flow?.note).toBeFalsy();
    expect(entry?.cervicalMucus?.note).toBeUndefined();
    expect(entry?.symptoms?.names).toEqual(['Fatigue']);
    expect(entry?.cervicalMucus?.type).toBe('dry');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!)[0];
    expect(typeof persisted.symptoms.note).toBe('object');
    expect(typeof persisted.mood.note).toBe('object');
    expect(JSON.stringify(persisted)).not.toContain('en clair');
    expect(JSON.stringify(persisted)).not.toContain('déjà chiffrée');
  });

  it('migration is idempotent', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {id: '2026-09-06-1', date: '2026-09-06', lhTest: {result: 'negative', note: 'Note LH en clair'}},
      ]),
    );
    await migrateLegacyPlainDailyJournalNotes();
    await migrateLegacyPlainDailyJournalNotes();
    const entry = await getJournalEntry('2026-09-06');
    expect(entry?.lhTest?.note).toBe('Note LH en clair');
  });

  it('migration is a no-op when nothing is legacy plaintext', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{id: '2026-09-07-1', date: '2026-09-07', weight: {value: 60, unit: 'kg'}}]),
    );
    const before = await AsyncStorage.getItem(STORAGE_KEY);
    await migrateLegacyPlainDailyJournalNotes();
    const after = await AsyncStorage.getItem(STORAGE_KEY);
    expect(after).toBe(before);
  });

  it('structured fields (severity, level, intensity, arrays, numbers, booleans) remain plaintext at rest across every note-bearing category', async () => {
    await saveJournalSection('2026-09-08', 'symptoms', {names: ['Nausées', 'Vertiges'], severity: 'moderate', painLocation: 'Bas du dos'});
    await saveJournalSection('2026-09-08', 'flow', {intensity: 'heavy', color: 'Rouge vif', periodStart: true});
    await saveJournalSection('2026-09-08', 'cervicalMucus', {type: 'eggWhite'});

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!).find((e: {date: string}) => e.date === '2026-09-08');
    expect(persisted.symptoms.names).toEqual(['Nausées', 'Vertiges']);
    expect(persisted.symptoms.severity).toBe('moderate');
    expect(persisted.symptoms.painLocation).toBe('Bas du dos');
    expect(persisted.flow.intensity).toBe('heavy');
    expect(persisted.flow.periodStart).toBe(true);
    expect(persisted.cervicalMucus.type).toBe('eggWhite');
  });

  it('never disturbs the separately-encrypted "Notes personnelles"/"Vie intime" fields on the same entry', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: '2026-09-09-1',
          date: '2026-09-09',
          encryptedNote: {version: 1, iv: 'aa', ciphertext: 'bb'},
          encryptedIntimacy: {version: 1, iv: 'cc', ciphertext: 'dd'},
          mood: {level: 'good', energy: 4, stress: 1, irritability: 1, motivation: 5, note: 'Note humeur'},
        },
      ]),
    );

    await saveJournalSection('2026-09-09', 'mood', {level: 'good', energy: 4, stress: 1, irritability: 1, motivation: 5, note: 'Note humeur mise à jour'});

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!).find((e: {date: string}) => e.date === '2026-09-09');
    expect(persisted.encryptedNote).toEqual({version: 1, iv: 'aa', ciphertext: 'bb'});
    expect(persisted.encryptedIntimacy).toEqual({version: 1, iv: 'cc', ciphertext: 'dd'});

    const entry = await getJournalEntry('2026-09-09');
    expect(entry?.mood?.note).toBe('Note humeur mise à jour');
  });

  it('getAllJournalEntries decrypts every entry consistently', async () => {
    await saveJournalSection('2026-09-10', 'activity', {type: 'Yoga', note: 'Séance relaxante'});
    await saveJournalSection('2026-09-11', 'sleep', {duration: '6h', note: 'Nuit agitée'});

    const all = await getAllJournalEntries();
    expect(all.find(e => e.date === '2026-09-10')?.activity?.note).toBe('Séance relaxante');
    expect(all.find(e => e.date === '2026-09-11')?.sleep?.note).toBe('Nuit agitée');
  });
});
