import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadGeneralHealth,
  migrateLegacyPlainGeneralHealthNotes,
  updateGeneralHealth,
} from '../generalHealthStore';

const STORAGE_KEY = '@awa/general-health/v1';

describe('generalHealthStore — encryption at rest', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('migrates legacy plaintext medicalNotes to AES-256-GCM at rest, preserving content exactly', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        heightCm: 168,
        weightKg: 62,
        bloodType: 'A+',
        chronicConditions: ['Asthme'],
        treatments: [],
        allergies: [],
        medicalNotes: 'Allergie sévère à la pénicilline',
        healthGoal: 'Suivi post-partum',
        goalProgress: 40,
        updatedAt: '2026-08-20',
      }),
    );

    await migrateLegacyPlainGeneralHealthNotes();

    const profile = await loadGeneralHealth();
    expect(profile.medicalNotes).toBe('Allergie sévère à la pénicilline');
    expect(profile.chronicConditions).toEqual(['Asthme']);
    expect(profile.bloodType).toBe('A+');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!);
    expect(typeof persisted.medicalNotes).toBe('object');
    expect(persisted.medicalNotes.ciphertext).toBeDefined();
    expect(JSON.stringify(persisted)).not.toContain('pénicilline');
  });

  it('migration is idempotent', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({medicalNotes: 'Note historique', updatedAt: '2026-08-20'}),
    );
    await migrateLegacyPlainGeneralHealthNotes();
    await migrateLegacyPlainGeneralHealthNotes();
    const profile = await loadGeneralHealth();
    expect(profile.medicalNotes).toBe('Note historique');
  });

  it('migration is a no-op when nothing is legacy plaintext', async () => {
    const before = await AsyncStorage.getItem(STORAGE_KEY);
    await migrateLegacyPlainGeneralHealthNotes();
    const after = await AsyncStorage.getItem(STORAGE_KEY);
    expect(after).toBe(before);
  });

  it('a fresh update encrypts medicalNotes at rest while keeping the returned/cached value plaintext', async () => {
    const updated = await updateGeneralHealth({medicalNotes: 'Suivi tension artérielle'});
    expect(updated.medicalNotes).toBe('Suivi tension artérielle');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!);
    expect(typeof persisted.medicalNotes).toBe('object');
    expect(JSON.stringify(persisted)).not.toContain('tension artérielle');
  });

  it('structured fields (height, weight, bloodType, conditions) remain plaintext at rest', async () => {
    await updateGeneralHealth({heightCm: 170, bloodType: 'O-'});
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!);
    expect(persisted.heightCm).toBe(170);
    expect(persisted.bloodType).toBe('O-');
  });
});
