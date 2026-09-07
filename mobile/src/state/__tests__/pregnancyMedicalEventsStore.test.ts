import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPregnancyMedicalEvents,
  migrateLegacyPlainPregnancyMedicalEventNotes,
  savePregnancyMedicalEvent,
} from '../pregnancyMedicalEventsStore';

const STORAGE_KEY = '@hawa/pregnancy-medical-events';

describe('pregnancyMedicalEventsStore — encryption at rest', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('migrates legacy plaintext notes to AES-256-GCM at rest, preserving content exactly', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'evt-1',
          type: 'appointment',
          date: '2026-09-10',
          title: 'Échographie du 2e trimestre',
          practitioner: 'Dr. Amrani',
          notes: 'Prévoir la carte de groupe sanguin',
          createdAt: '2026-08-01T00:00:00.000Z',
          updatedAt: '2026-08-01T00:00:00.000Z',
        },
      ]),
    );

    await migrateLegacyPlainPregnancyMedicalEventNotes();

    const events = await getPregnancyMedicalEvents();
    expect(events[0].notes).toBe('Prévoir la carte de groupe sanguin');
    expect(events[0].title).toBe('Échographie du 2e trimestre');
    expect(events[0].practitioner).toBe('Dr. Amrani');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!)[0];
    expect(typeof persisted.notes).toBe('object');
    expect(persisted.notes.ciphertext).toBeDefined();
    expect(persisted.title).toBe('Échographie du 2e trimestre'); // structured, plaintext
    expect(JSON.stringify(persisted)).not.toContain('groupe sanguin');
  });

  it('migration is idempotent', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'evt-1',
          type: 'appointment',
          date: '2026-09-10',
          title: 'Échographie du 2e trimestre',
          notes: 'Prévoir la carte de groupe sanguin',
          createdAt: '2026-08-01T00:00:00.000Z',
          updatedAt: '2026-08-01T00:00:00.000Z',
        },
      ]),
    );
    await migrateLegacyPlainPregnancyMedicalEventNotes();
    await migrateLegacyPlainPregnancyMedicalEventNotes();
    const events = await getPregnancyMedicalEvents();
    expect(events[0]?.notes).toBe('Prévoir la carte de groupe sanguin');
  });

  it('migration is a no-op when nothing is legacy plaintext', async () => {
    const before = await AsyncStorage.getItem(STORAGE_KEY);
    await migrateLegacyPlainPregnancyMedicalEventNotes();
    const after = await AsyncStorage.getItem(STORAGE_KEY);
    expect(after).toBe(before);
  });

  it('a fresh save encrypts notes at rest while keeping the returned value plaintext', async () => {
    const events = await savePregnancyMedicalEvent({
      id: 'evt-2',
      type: 'exam',
      date: '2026-09-15',
      title: 'Prise de sang',
      notes: 'Résultats à récupérer en ligne',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });
    expect(events.find(e => e.id === 'evt-2')?.notes).toBe('Résultats à récupérer en ligne');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!).find((e: {id: string}) => e.id === 'evt-2');
    expect(typeof persisted.notes).toBe('object');
    expect(JSON.stringify(persisted)).not.toContain('récupérer en ligne');
  });
});
