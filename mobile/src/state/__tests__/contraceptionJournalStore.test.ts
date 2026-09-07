import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getContraceptionJournalEntry,
  migrateLegacyPlainContraceptionNotes,
  saveContraceptionJournalField,
} from '../contraceptionJournalStore';

const STORAGE_KEY = '@hawa/contraception-journal/v1';

// The store keeps an in-memory singleton (`entries`/`hydrated`) that
// persists across tests in this file regardless of AsyncStorage.clear() —
// same constraint every other AWA journal store test file works within (see
// miscarriageJournalStore.test.ts). The migration test runs first, before
// anything else in this file calls hydrateContraceptionJournal().

describe('contraceptionJournalStore — encryption at rest', () => {
  it('migrates legacy plaintext notes to AES-256-GCM at rest, preserving content exactly', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        '2026-09-01': {
          date: '2026-09-01',
          feelings: ['Ballonnements', 'Fatigue'],
          notes: 'Effets secondaires ressentis après la prise',
        },
      }),
    );

    await migrateLegacyPlainContraceptionNotes();

    const entry = getContraceptionJournalEntry('2026-09-01');
    expect(entry?.notes).toBe('Effets secondaires ressentis après la prise');
    expect(entry?.feelings).toEqual(['Ballonnements', 'Fatigue']);

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!)['2026-09-01'];
    expect(typeof persisted.notes).toBe('object');
    expect(persisted.notes.ciphertext).toBeDefined();
    expect(persisted.feelings).toEqual(['Ballonnements', 'Fatigue']); // structured, plaintext
    expect(JSON.stringify(persisted)).not.toContain('Effets secondaires');
  });

  it('migration is idempotent', async () => {
    await migrateLegacyPlainContraceptionNotes();
    await migrateLegacyPlainContraceptionNotes();
    expect(getContraceptionJournalEntry('2026-09-01')?.notes).toBe('Effets secondaires ressentis après la prise');
  });

  it('migration is a no-op when nothing is legacy plaintext', async () => {
    const before = await AsyncStorage.getItem(STORAGE_KEY);
    await migrateLegacyPlainContraceptionNotes();
    const after = await AsyncStorage.getItem(STORAGE_KEY);
    expect(after).toBe(before);
  });

  it('a fresh save encrypts notes at rest while keeping the in-memory value plaintext', async () => {
    await saveContraceptionJournalField('2026-09-02', 'notes', 'Nouvelle note du jour');
    expect(getContraceptionJournalEntry('2026-09-02')?.notes).toBe('Nouvelle note du jour');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!)['2026-09-02'];
    expect(typeof persisted.notes).toBe('object');
    expect(JSON.stringify(persisted)).not.toContain('Nouvelle note du jour');
  });

  it('an empty/undefined note is never persisted as an encrypted blob', async () => {
    await saveContraceptionJournalField('2026-09-03', 'feelings', ['Aucun ressenti particulier']);
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!)['2026-09-03'];
    expect(persisted.notes).toBeUndefined();
    expect(getContraceptionJournalEntry('2026-09-03')?.notes).toBeUndefined();
  });

  it('structured field (feelings) remains plaintext at rest — only notes is encrypted', async () => {
    await saveContraceptionJournalField('2026-09-04', 'feelings', ['Bien', 'Stable']);
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!)['2026-09-04'];
    expect(persisted.feelings).toEqual(['Bien', 'Stable']);
  });

  it('never logs or exposes the plaintext note through the raw persisted bytes', async () => {
    await saveContraceptionJournalField('2026-09-05', 'notes', 'SECRET_MARKER_CTR9');
    expect(getContraceptionJournalEntry('2026-09-05')?.notes).toBe('SECRET_MARKER_CTR9'); // in-memory decrypted value is expected here
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(raw).not.toContain('SECRET_MARKER_CTR9');
  });
});
