import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getHealthReminders,
  migrateLegacyPlainPregnancyHealthReminders,
  saveHealthReminder,
} from '../pregnancyHealthRemindersStore';

const STORAGE_KEY = '@hawa/pregnancy-health-reminders';

describe('pregnancyHealthRemindersStore — encryption at rest (name)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('a fresh save encrypts the health-reminder name while the returned value stays plaintext, and preserves reminder shape', async () => {
    const reminders = await saveHealthReminder({
      id: 'hr-1',
      kind: 'medication',
      name: 'Utrogestan 200mg',
      time: '21:00',
      repeat: 'daily',
      startDate: '2026-09-01',
      endDate: '2026-12-01',
      enabled: true,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });

    const reminder = reminders.find(r => r.id === 'hr-1');
    expect(reminder?.name).toBe('Utrogestan 200mg');
    expect(reminder?.kind).toBe('medication');
    expect(reminder?.time).toBe('21:00');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!).find((r: {id: string}) => r.id === 'hr-1');
    expect(typeof persisted.name).toBe('object');
    expect(persisted.name.ciphertext).toBeDefined();
    expect(persisted.kind).toBe('medication'); // structured, plaintext
    expect(persisted.time).toBe('21:00');
    expect(JSON.stringify(persisted)).not.toContain('Utrogestan');
  });

  it('getHealthReminders decrypts on read, restoring the exact same shape', async () => {
    await saveHealthReminder({
      id: 'hr-2',
      kind: 'vitamin',
      name: 'Acide folique',
      time: '08:00',
      repeat: 'daily',
      enabled: true,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });

    const reminders = await getHealthReminders();
    expect(reminders.find(r => r.id === 'hr-2')?.name).toBe('Acide folique');
  });

  it('migrates a legacy plaintext name to AES-256-GCM at rest, preserving content exactly', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'hr-3',
          kind: 'medication',
          name: 'Aspégic Nourrisson',
          time: '09:00',
          repeat: 'daily',
          enabled: true,
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
        },
      ]),
    );

    await migrateLegacyPlainPregnancyHealthReminders();

    const reminders = await getHealthReminders();
    expect(reminders.find(r => r.id === 'hr-3')?.name).toBe('Aspégic Nourrisson');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!).find((r: {id: string}) => r.id === 'hr-3');
    expect(typeof persisted.name).toBe('object');
    expect(JSON.stringify(persisted)).not.toContain('Aspégic');
  });

  it('migration is idempotent', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'hr-4',
          kind: 'vitamin',
          name: 'Vitamine D',
          time: '08:00',
          repeat: 'daily',
          enabled: true,
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
        },
      ]),
    );
    await migrateLegacyPlainPregnancyHealthReminders();
    await migrateLegacyPlainPregnancyHealthReminders();
    const reminders = await getHealthReminders();
    expect(reminders.find(r => r.id === 'hr-4')?.name).toBe('Vitamine D');
  });

  it('migration is a no-op when nothing is legacy plaintext', async () => {
    await saveHealthReminder({
      id: 'hr-5',
      kind: 'vitamin',
      name: 'Fer',
      time: '08:00',
      repeat: 'daily',
      enabled: true,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });
    const before = await AsyncStorage.getItem(STORAGE_KEY);
    await migrateLegacyPlainPregnancyHealthReminders();
    const after = await AsyncStorage.getItem(STORAGE_KEY);
    expect(after).toBe(before);
  });

  it('reminder scheduling fields (kind, time, repeat, startDate, endDate, enabled) remain plaintext at rest', async () => {
    await saveHealthReminder({
      id: 'hr-6',
      kind: 'medication',
      name: 'Doliprane',
      time: '14:00',
      repeat: 'daily',
      startDate: '2026-09-01',
      endDate: '2026-09-10',
      enabled: false,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!).find((r: {id: string}) => r.id === 'hr-6');
    expect(persisted.kind).toBe('medication');
    expect(persisted.time).toBe('14:00');
    expect(persisted.repeat).toBe('daily');
    expect(persisted.startDate).toBe('2026-09-01');
    expect(persisted.endDate).toBe('2026-09-10');
    expect(persisted.enabled).toBe(false);
  });

  it('never exposes the plaintext name through the raw persisted bytes', async () => {
    await saveHealthReminder({
      id: 'hr-7',
      kind: 'medication',
      name: 'SECRET_MEDICATION_MARKER',
      time: '10:00',
      repeat: 'daily',
      enabled: true,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(raw).not.toContain('SECRET_MEDICATION_MARKER');
  });
});
