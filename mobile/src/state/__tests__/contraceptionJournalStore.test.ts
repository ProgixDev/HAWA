import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearContraceptionJournalField,
  getContraceptionJournalEntry,
  subscribeContraceptionJournal,
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

describe('contraceptionJournalStore — clearing / correcting a saved field', () => {
  const persistedFor = async (date: string) => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw)[date] : undefined;
  };

  it('clearing the note removes it from memory AND storage (no orphan ciphertext), keeping feelings', async () => {
    await saveContraceptionJournalField('2026-09-10', 'feelings', ['Bien']);
    await saveContraceptionJournalField('2026-09-10', 'notes', 'CLEAR_ME_MARKER');
    expect((await persistedFor('2026-09-10')).notes.ciphertext).toBeDefined();

    await clearContraceptionJournalField('2026-09-10', 'notes');

    expect(getContraceptionJournalEntry('2026-09-10')?.notes).toBeUndefined();
    expect(getContraceptionJournalEntry('2026-09-10')?.feelings).toEqual(['Bien']);
    const persisted = await persistedFor('2026-09-10');
    expect('notes' in persisted).toBe(false);
    expect(persisted.feelings).toEqual(['Bien']);
    expect(JSON.stringify(persisted)).not.toContain('ciphertext');
    expect(JSON.stringify(persisted)).not.toContain('CLEAR_ME_MARKER');
  });

  it('clearing the feelings keeps the encrypted note untouched', async () => {
    await saveContraceptionJournalField('2026-09-11', 'feelings', ['Fatigue']);
    await saveContraceptionJournalField('2026-09-11', 'notes', 'Note conservée');

    await clearContraceptionJournalField('2026-09-11', 'feelings');

    expect(getContraceptionJournalEntry('2026-09-11')?.feelings).toBeUndefined();
    expect(getContraceptionJournalEntry('2026-09-11')?.notes).toBe('Note conservée');
    const persisted = await persistedFor('2026-09-11');
    expect('feelings' in persisted).toBe(false);
    expect(typeof persisted.notes).toBe('object'); // still encrypted at rest
    expect(JSON.stringify(persisted)).not.toContain('Note conservée');
  });

  it('an entry with nothing left is dropped entirely (no empty shell in memory or storage)', async () => {
    await saveContraceptionJournalField('2026-09-12', 'notes', 'Seule note');
    await clearContraceptionJournalField('2026-09-12', 'notes');

    expect(getContraceptionJournalEntry('2026-09-12')).toBeUndefined();
    expect(await persistedFor('2026-09-12')).toBeUndefined();
  });

  it('editing after a clear works and is encrypted again', async () => {
    await saveContraceptionJournalField('2026-09-13', 'notes', 'Première');
    await clearContraceptionJournalField('2026-09-13', 'notes');
    await saveContraceptionJournalField('2026-09-13', 'notes', 'Seconde');

    expect(getContraceptionJournalEntry('2026-09-13')?.notes).toBe('Seconde');
    const persisted = await persistedFor('2026-09-13');
    expect(persisted.notes.ciphertext).toBeDefined();
    expect(JSON.stringify(persisted)).not.toContain('Seconde');
  });

  it('clearing a field that is not there is a harmless no-op', async () => {
    const before = await AsyncStorage.getItem(STORAGE_KEY);
    await clearContraceptionJournalField('2026-09-14', 'notes');
    await saveContraceptionJournalField('2026-09-15', 'feelings', ['Bien']);
    await clearContraceptionJournalField('2026-09-15', 'notes');

    expect(getContraceptionJournalEntry('2026-09-14')).toBeUndefined();
    expect(getContraceptionJournalEntry('2026-09-15')?.feelings).toEqual(['Bien']);
    expect(before).not.toBeNull();
  });

  it('notifies subscribers so Dashboard / Calendar completion refreshes', async () => {
    await saveContraceptionJournalField('2026-09-16', 'feelings', ['Bien']);
    const listener = jest.fn();
    const unsubscribe = subscribeContraceptionJournal(listener);
    await clearContraceptionJournalField('2026-09-16', 'feelings');
    unsubscribe();
    expect(listener).toHaveBeenCalled();
  });
});
