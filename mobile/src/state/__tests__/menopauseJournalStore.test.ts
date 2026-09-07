import AsyncStorage from '@react-native-async-storage/async-storage';
import {encryptFieldValue} from '../../services/atRestFieldEncryption';
import {
  getMenopauseJournalEntry,
  migrateLegacyPlainMenopauseNotes,
  saveMenopauseJournalField,
} from '../menopauseJournalStore';

const STORAGE_KEY = '@hawa/menopause-journal/v1';
// Matches the store's own private ENCRYPTION_SERVICE constant — duplicated
// here (not exported) only so this test can pre-construct an
// already-encrypted payload for the partial-migration scenario below.
const ENCRYPTION_SERVICE = 'com.hawa.private.menopause-journal.encryption-key';

// The store keeps an in-memory singleton (`entries`/`hydrated`) that
// persists across tests in this file regardless of AsyncStorage.clear() —
// same constraint every other AWA journal store test file works within (see
// irregularJournalStore.test.ts / miscarriageJournalStore.test.ts). Both
// migration scenarios (full-plaintext AND partial-already-encrypted) are
// seeded together in the FIRST test, before hydrateMenopauseJournal() is
// ever called and permanently flips `hydrated` to true; every other test
// below uses its own distinct date and never re-hydrates, so it's
// unaffected either way.

describe('menopauseJournalStore — encryption at rest (notes, treatmentNote)', () => {
  it('migrates legacy plaintext fields, and migrates only the still-plaintext field when the other is already encrypted', async () => {
    const alreadyEncryptedNotes = await encryptFieldValue(ENCRYPTION_SERVICE, 'Ancienne note déjà chiffrée');

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        '2026-07-01': {
          date: '2026-07-01',
          mood: 'neutral',
          symptoms: ['hot_flashes'],
          notes: 'Bouffées de chaleur intenses ce soir',
          treatmentNote: 'Prise retardée de deux heures',
        },
        '2026-07-02': {
          date: '2026-07-02',
          notes: alreadyEncryptedNotes,
          treatmentNote: 'Nouvelle note en clair',
        },
      }),
    );

    await migrateLegacyPlainMenopauseNotes();

    const fullyMigrated = getMenopauseJournalEntry('2026-07-01');
    expect(fullyMigrated?.notes).toBe('Bouffées de chaleur intenses ce soir');
    expect(fullyMigrated?.treatmentNote).toBe('Prise retardée de deux heures');
    expect(fullyMigrated?.mood).toBe('neutral');
    expect(fullyMigrated?.symptoms).toEqual(['hot_flashes']);

    const partiallyMigrated = getMenopauseJournalEntry('2026-07-02');
    expect(partiallyMigrated?.treatmentNote).toBe('Nouvelle note en clair');
    // The already-encrypted `notes` payload decrypts to its original
    // content unchanged — proving it was passed through, not corrupted or
    // double-encrypted.
    expect(partiallyMigrated?.notes).toBe('Ancienne note déjà chiffrée');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!);
    expect(typeof persisted['2026-07-01'].notes).toBe('object');
    expect(typeof persisted['2026-07-01'].treatmentNote).toBe('object');
    expect(persisted['2026-07-01'].notes.ciphertext).toBeDefined();
    expect(typeof persisted['2026-07-02'].notes).toBe('object');
    expect(typeof persisted['2026-07-02'].treatmentNote).toBe('object');
    expect(JSON.stringify(persisted)).not.toContain('Bouffées de chaleur intenses');
    expect(JSON.stringify(persisted)).not.toContain('Prise retardée');
    expect(JSON.stringify(persisted)).not.toContain('Nouvelle note en clair');
  });

  it('migration is idempotent', async () => {
    await migrateLegacyPlainMenopauseNotes();
    await migrateLegacyPlainMenopauseNotes();
    const entry = getMenopauseJournalEntry('2026-07-01');
    expect(entry?.notes).toBe('Bouffées de chaleur intenses ce soir');
    expect(entry?.treatmentNote).toBe('Prise retardée de deux heures');
  });

  it('migration is a no-op when nothing is legacy plaintext', async () => {
    const before = await AsyncStorage.getItem(STORAGE_KEY);
    await migrateLegacyPlainMenopauseNotes();
    const after = await AsyncStorage.getItem(STORAGE_KEY);
    expect(after).toBe(before);
  });

  it('a fresh save encrypts notes and treatmentNote at rest while keeping the in-memory value plaintext', async () => {
    await saveMenopauseJournalField('2026-07-03', 'notes', 'Journée globalement calme');
    await saveMenopauseJournalField('2026-07-03', 'treatmentNote', 'Traitement pris à l’heure');

    const entry = getMenopauseJournalEntry('2026-07-03');
    expect(entry?.notes).toBe('Journée globalement calme');
    expect(entry?.treatmentNote).toBe('Traitement pris à l’heure');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!)['2026-07-03'];
    expect(typeof persisted.notes).toBe('object');
    expect(typeof persisted.treatmentNote).toBe('object');
    expect(JSON.stringify(persisted)).not.toContain('Journée globalement calme');
    expect(JSON.stringify(persisted)).not.toContain('Traitement pris');
  });

  it('an empty string field is never persisted as an encrypted blob — the field is simply absent', async () => {
    await saveMenopauseJournalField('2026-07-04', 'notes', ' ');
    await saveMenopauseJournalField('2026-07-04', 'notes', '');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!)['2026-07-04'];
    expect(persisted.notes).toBeUndefined();
  });

  it('a field never saved for a date stays undefined — never a fabricated value', async () => {
    await saveMenopauseJournalField('2026-07-05', 'mood', 'good');
    const entry = getMenopauseJournalEntry('2026-07-05');
    expect(entry?.notes).toBeUndefined();
    expect(entry?.treatmentNote).toBeUndefined();
  });

  it('structured fields (symptoms, mood, sleepDurationHours, energyLevel, treatmentStatus) remain plaintext at rest', async () => {
    await saveMenopauseJournalField('2026-07-06', 'symptoms', ['night_sweats']);
    await saveMenopauseJournalField('2026-07-06', 'mood', 'tired');
    await saveMenopauseJournalField('2026-07-06', 'sleepDurationHours', 5);
    await saveMenopauseJournalField('2026-07-06', 'energyLevel', 'low');
    await saveMenopauseJournalField('2026-07-06', 'treatmentStatus', 'taken');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!)['2026-07-06'];
    expect(persisted.symptoms).toEqual(['night_sweats']);
    expect(persisted.mood).toBe('tired');
    expect(persisted.sleepDurationHours).toBe(5);
    expect(persisted.energyLevel).toBe('low');
    expect(persisted.treatmentStatus).toBe('taken');
  });
});
