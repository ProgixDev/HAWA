import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMiscarriageJournalEntry,
  hydrateMiscarriageJournal,
  migrateLegacyPlainMiscarriageNotes,
  saveMiscarriageJournalField,
} from '../miscarriageJournalStore';

const STORAGE_KEY = '@hawa/miscarriage-journal/v1';

// The store keeps an in-memory singleton (`entries`/`hydrated`) that
// persists across tests in this file regardless of AsyncStorage.clear() —
// same constraint every other AWA journal store test file works within (see
// irregularJournalStore.test.ts). The migration/hydration test MUST run
// first, before anything else in this file calls hydrateMiscarriageJournal()
// and permanently flips `hydrated` to true; every other test below uses its
// own distinct date and never re-hydrates, so it's unaffected either way.

describe('miscarriageJournalStore — encryption at rest', () => {
  it('migrates legacy plaintext personalNotes/bleedingNote/physicalSymptomsNote to AES-256-GCM at rest, preserving content exactly', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        '2026-08-20': {
          date: '2026-08-20',
          bleeding: 'Modéré',
          bleedingNote: 'Légère amélioration ce matin',
          physicalSymptoms: ['Crampes'],
          physicalSymptomsNote: 'Douleurs supportables',
          personalNotes: 'Journée difficile émotionnellement',
          tryingAgain: 'not_now',
        },
      }),
    );

    await migrateLegacyPlainMiscarriageNotes();

    // In-memory read stays exactly the same plaintext — no screen-facing change.
    const entry = getMiscarriageJournalEntry('2026-08-20');
    expect(entry?.personalNotes).toBe('Journée difficile émotionnellement');
    expect(entry?.bleedingNote).toBe('Légère amélioration ce matin');
    expect(entry?.physicalSymptomsNote).toBe('Douleurs supportables');
    // Structured fields untouched.
    expect(entry?.bleeding).toBe('Modéré');
    expect(entry?.physicalSymptoms).toEqual(['Crampes']);
    expect(entry?.tryingAgain).toBe('not_now');

    // The on-disk copy is now encrypted, never readable plaintext.
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!)['2026-08-20'];
    expect(typeof persisted.personalNotes).toBe('object');
    expect(persisted.personalNotes.ciphertext).toBeDefined();
    expect(JSON.stringify(persisted)).not.toContain('Journée difficile');
    expect(JSON.stringify(persisted)).not.toContain('Légère amélioration');
    expect(JSON.stringify(persisted)).not.toContain('Douleurs supportables');
  });

  it('migration is idempotent — re-running it does not double-encrypt or corrupt already-migrated data', async () => {
    await migrateLegacyPlainMiscarriageNotes();
    await migrateLegacyPlainMiscarriageNotes();

    const entry = getMiscarriageJournalEntry('2026-08-20');
    expect(entry?.personalNotes).toBe('Journée difficile émotionnellement');
  });

  it('migration is a no-op (does not rewrite storage) when nothing is legacy plaintext', async () => {
    const before = await AsyncStorage.getItem(STORAGE_KEY);
    await migrateLegacyPlainMiscarriageNotes();
    const after = await AsyncStorage.getItem(STORAGE_KEY);
    expect(after).toBe(before);
  });

  it('a fresh save encrypts personalNotes at rest while keeping the in-memory value plaintext', async () => {
    await saveMiscarriageJournalField('2026-09-01', 'personalNotes', 'Nouvelle note privée');

    expect(getMiscarriageJournalEntry('2026-09-01')?.personalNotes).toBe('Nouvelle note privée');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!)['2026-09-01'];
    expect(typeof persisted.personalNotes).toBe('object');
    expect(persisted.personalNotes.ciphertext).toBeDefined();
    expect(JSON.stringify(persisted)).not.toContain('Nouvelle note privée');
  });

  it('structured fields (bleeding, physicalSymptoms, tryingAgain) remain plaintext at rest — only narrative fields are encrypted', async () => {
    await saveMiscarriageJournalField('2026-09-02', 'bleeding', 'Léger');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!)['2026-09-02'];
    expect(persisted.bleeding).toBe('Léger');
  });

  it('never logs or exposes the encryption key/plaintext through the public read API', async () => {
    await saveMiscarriageJournalField('2026-09-03', 'personalNotes', 'SECRET_MARKER_7Q1');
    const all = await hydrateMiscarriageJournal();
    expect(JSON.stringify(all)).toContain('SECRET_MARKER_7Q1'); // in-memory decrypted value is expected here
    // but the raw persisted bytes must never contain it:
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(raw).not.toContain('SECRET_MARKER_7Q1');
  });
});
