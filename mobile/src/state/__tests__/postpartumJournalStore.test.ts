import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPostpartumJournalEntry,
  migrateLegacyPlainPostpartumMoodNotes,
  savePostpartumJournalField,
} from '../postpartumJournalStore';

const STORAGE_KEY = '@hawa/postpartum-journal/v3';

// See miscarriageJournalStore.test.ts's header comment — same in-memory
// singleton constraint applies here, so the migration test runs first.

describe('postpartumJournalStore — encryption at rest', () => {
  it('migrates legacy plaintext moodNote to AES-256-GCM at rest, preserving content exactly', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        '2026-08-20': {
          date: '2026-08-20',
          mood: 'Fatiguée',
          moodNote: 'Nuit difficile avec le bébé',
          fatigue: 'Élevée',
        },
      }),
    );

    await migrateLegacyPlainPostpartumMoodNotes();

    const entry = getPostpartumJournalEntry('2026-08-20');
    expect(entry?.moodNote).toBe('Nuit difficile avec le bébé');
    expect(entry?.mood).toBe('Fatiguée');
    expect(entry?.fatigue).toBe('Élevée');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!)['2026-08-20'];
    expect(typeof persisted.moodNote).toBe('object');
    expect(persisted.moodNote.ciphertext).toBeDefined();
    expect(JSON.stringify(persisted)).not.toContain('Nuit difficile');
  });

  it('migration is idempotent', async () => {
    await migrateLegacyPlainPostpartumMoodNotes();
    await migrateLegacyPlainPostpartumMoodNotes();
    expect(getPostpartumJournalEntry('2026-08-20')?.moodNote).toBe('Nuit difficile avec le bébé');
  });

  it('migration is a no-op when nothing is legacy plaintext', async () => {
    const before = await AsyncStorage.getItem(STORAGE_KEY);
    await migrateLegacyPlainPostpartumMoodNotes();
    const after = await AsyncStorage.getItem(STORAGE_KEY);
    expect(after).toBe(before);
  });

  it('a fresh save encrypts moodNote at rest while keeping the in-memory value plaintext', async () => {
    await savePostpartumJournalField('2026-09-01', 'moodNote', 'Journée plus calme aujourd’hui');

    expect(getPostpartumJournalEntry('2026-09-01')?.moodNote).toBe('Journée plus calme aujourd’hui');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!)['2026-09-01'];
    expect(typeof persisted.moodNote).toBe('object');
    expect(JSON.stringify(persisted)).not.toContain('Journée plus calme');
  });

  it('structured fields (mood, fatigue, sleep, pain, physicalRecovery) remain plaintext at rest', async () => {
    await savePostpartumJournalField('2026-09-02', 'mood', 'Sereine');
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!)['2026-09-02'];
    expect(persisted.mood).toBe('Sereine');
  });
});
