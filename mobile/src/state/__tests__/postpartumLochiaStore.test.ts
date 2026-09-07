import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPostpartumLochiaEntry,
  getPostpartumLochiaTracking,
  markPostpartumLochiaEnded,
  migrateLegacyPlainPostpartumLochiaNotes,
  savePostpartumLochiaEntry,
} from '../postpartumLochiaStore';

const STORAGE_KEY = '@hawa/postpartum-lochia/v1';

// The store keeps an in-memory singleton (`entries`/`hydrated`) that
// persists across tests in this file regardless of AsyncStorage.clear() —
// same constraint every other AWA journal store test file works within (see
// miscarriageJournalStore.test.ts). The migration test runs first, before
// anything else in this file calls hydratePostpartumLochia().

describe('postpartumLochiaStore — encryption at rest', () => {
  it('migrates a legacy plaintext note to AES-256-GCM at rest, preserving content exactly, and never touches `tracking`', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        entries: {
          '2026-09-01': {
            date: '2026-09-01',
            flow: 'Modéré',
            color: 'Rouge',
            consistency: 'Liquide',
            symptoms: ['Douleurs légères'],
            note: 'Amélioration progressive depuis hier',
          },
        },
        tracking: {endedDate: null},
      }),
    );

    await migrateLegacyPlainPostpartumLochiaNotes();

    const entry = getPostpartumLochiaEntry('2026-09-01');
    expect(entry?.note).toBe('Amélioration progressive depuis hier');
    expect(entry?.flow).toBe('Modéré');
    expect(entry?.color).toBe('Rouge');
    expect(entry?.consistency).toBe('Liquide');
    expect(entry?.symptoms).toEqual(['Douleurs légères']);
    expect(getPostpartumLochiaTracking()).toEqual({endedDate: null});

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!).entries['2026-09-01'];
    expect(typeof persisted.note).toBe('object');
    expect(persisted.note.ciphertext).toBeDefined();
    expect(persisted.flow).toBe('Modéré'); // structured, plaintext
    expect(JSON.stringify(persisted)).not.toContain('Amélioration progressive');
  });

  it('migration is idempotent', async () => {
    await migrateLegacyPlainPostpartumLochiaNotes();
    await migrateLegacyPlainPostpartumLochiaNotes();
    expect(getPostpartumLochiaEntry('2026-09-01')?.note).toBe('Amélioration progressive depuis hier');
  });

  it('migration is a no-op when nothing is legacy plaintext', async () => {
    const before = await AsyncStorage.getItem(STORAGE_KEY);
    await migrateLegacyPlainPostpartumLochiaNotes();
    const after = await AsyncStorage.getItem(STORAGE_KEY);
    expect(after).toBe(before);
  });

  it('a fresh save round-trips the note as plaintext in memory while encrypting it at rest', async () => {
    await savePostpartumLochiaEntry('2026-09-02', {
      flow: 'Léger',
      color: 'Rose',
      consistency: 'Épais',
      symptoms: [],
      note: 'Note du jour 2',
    });

    expect(getPostpartumLochiaEntry('2026-09-02')?.note).toBe('Note du jour 2');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!).entries['2026-09-02'];
    expect(typeof persisted.note).toBe('object');
    expect(JSON.stringify(persisted)).not.toContain('Note du jour 2');
  });

  it('an empty/undefined note is never persisted as an encrypted blob', async () => {
    await savePostpartumLochiaEntry('2026-09-03', {
      flow: 'Abondant',
      color: 'Brun',
      consistency: 'Avec petits caillots',
      symptoms: [],
    });

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!).entries['2026-09-03'];
    expect(persisted.note).toBeUndefined();
    expect(getPostpartumLochiaEntry('2026-09-03')?.note).toBeUndefined();
  });

  it('structured fields (flow, color, consistency, symptoms) remain plaintext at rest', async () => {
    await savePostpartumLochiaEntry('2026-09-04', {
      flow: 'Très léger',
      color: 'Jaune / blanc',
      consistency: 'Liquide',
      symptoms: ['Aucun'],
      note: 'Une note',
    });
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!).entries['2026-09-04'];
    expect(persisted.flow).toBe('Très léger');
    expect(persisted.color).toBe('Jaune / blanc');
    expect(persisted.consistency).toBe('Liquide');
    expect(persisted.symptoms).toEqual(['Aucun']);
  });

  it('`tracking` (endedDate) is unaffected by note encryption and survives a save', async () => {
    await markPostpartumLochiaEnded('2026-09-05');
    await savePostpartumLochiaEntry('2026-09-06', {
      flow: 'Léger',
      color: 'Rouge',
      consistency: 'Liquide',
      symptoms: [],
      note: 'Note après clôture',
    });
    expect(getPostpartumLochiaTracking()).toEqual({endedDate: '2026-09-05'});

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(JSON.parse(raw!).tracking).toEqual({endedDate: '2026-09-05'});
  });

  it('never exposes the plaintext note through the raw persisted bytes', async () => {
    await savePostpartumLochiaEntry('2026-09-07', {
      flow: 'Modéré',
      color: 'Rouge vif',
      consistency: 'Liquide',
      symptoms: [],
      note: 'SECRET_MARKER_LOCHIA4',
    });
    expect(getPostpartumLochiaEntry('2026-09-07')?.note).toBe('SECRET_MARKER_LOCHIA4');
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(raw).not.toContain('SECRET_MARKER_LOCHIA4');
  });
});
