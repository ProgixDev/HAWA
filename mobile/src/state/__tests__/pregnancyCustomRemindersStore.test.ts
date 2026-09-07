import AsyncStorage from '@react-native-async-storage/async-storage';
import {encryptFieldValue} from '../../services/atRestFieldEncryption';
import {
  getCustomReminders,
  migrateLegacyPlainPregnancyCustomReminders,
  saveCustomReminder,
} from '../pregnancyCustomRemindersStore';

const STORAGE_KEY = '@hawa/pregnancy-custom-reminders';
const ENCRYPTION_SERVICE = 'com.hawa.private.pregnancy-custom-reminders.encryption-key';

describe('pregnancyCustomRemindersStore — encryption at rest (title, description)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('a fresh save encrypts both title and description while the returned value stays plaintext', async () => {
    const reminders = await saveCustomReminder({
      id: 'rem-1',
      title: 'RDV gynécologue — dépistage trisomie',
      description: 'Apporter la carte de groupe sanguin',
      date: '2026-09-10',
      time: '09:30',
      repeat: 'once',
      enabled: true,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });

    const reminder = reminders.find(r => r.id === 'rem-1');
    expect(reminder?.title).toBe('RDV gynécologue — dépistage trisomie');
    expect(reminder?.description).toBe('Apporter la carte de groupe sanguin');
    expect(reminder?.date).toBe('2026-09-10');
    expect(reminder?.repeat).toBe('once');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!).find((r: {id: string}) => r.id === 'rem-1');
    expect(typeof persisted.title).toBe('object');
    expect(typeof persisted.description).toBe('object');
    expect(persisted.title.ciphertext).toBeDefined();
    expect(persisted.date).toBe('2026-09-10'); // structured, plaintext
    expect(persisted.repeat).toBe('once');
    expect(JSON.stringify(persisted)).not.toContain('gynécologue');
    expect(JSON.stringify(persisted)).not.toContain('groupe sanguin');
  });

  it('getCustomReminders decrypts on read, restoring the exact same shape', async () => {
    await saveCustomReminder({
      id: 'rem-2',
      title: 'Prise de sang diabète gestationnel',
      date: '2026-09-12',
      time: '08:00',
      repeat: 'once',
      enabled: true,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });

    const reminders = await getCustomReminders();
    const reminder = reminders.find(r => r.id === 'rem-2');
    expect(reminder?.title).toBe('Prise de sang diabète gestationnel');
    expect(reminder?.description).toBeUndefined();
  });

  it('an empty/undefined description is never persisted as an encrypted blob', async () => {
    await saveCustomReminder({
      id: 'rem-3',
      title: 'Rappel vitamines',
      description: '',
      date: '2026-09-13',
      time: '20:00',
      repeat: 'daily',
      enabled: true,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!).find((r: {id: string}) => r.id === 'rem-3');
    expect(persisted.description).toBeUndefined();
  });

  it('migrates legacy plaintext title/description to AES-256-GCM at rest, preserving content exactly', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'rem-4',
          title: 'Consultation sage-femme',
          description: 'Discuter du plan de naissance',
          date: '2026-09-14',
          time: '10:00',
          repeat: 'once',
          enabled: true,
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
        },
      ]),
    );

    await migrateLegacyPlainPregnancyCustomReminders();

    const reminders = await getCustomReminders();
    const reminder = reminders.find(r => r.id === 'rem-4');
    expect(reminder?.title).toBe('Consultation sage-femme');
    expect(reminder?.description).toBe('Discuter du plan de naissance');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!).find((r: {id: string}) => r.id === 'rem-4');
    expect(typeof persisted.title).toBe('object');
    expect(typeof persisted.description).toBe('object');
    expect(JSON.stringify(persisted)).not.toContain('sage-femme');
    expect(JSON.stringify(persisted)).not.toContain('plan de naissance');
  });

  it('migrates only the still-plaintext field when the other is already encrypted (partial migration)', async () => {
    const alreadyEncryptedTitle = await encryptFieldValue(ENCRYPTION_SERVICE, 'Titre déjà chiffré');

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'rem-5',
          title: alreadyEncryptedTitle,
          description: 'Description encore en clair',
          date: '2026-09-15',
          time: '11:00',
          repeat: 'weekly',
          enabled: true,
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
        },
      ]),
    );

    await migrateLegacyPlainPregnancyCustomReminders();

    const reminders = await getCustomReminders();
    const reminder = reminders.find(r => r.id === 'rem-5');
    expect(reminder?.title).toBe('Titre déjà chiffré');
    expect(reminder?.description).toBe('Description encore en clair');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!).find((r: {id: string}) => r.id === 'rem-5');
    expect(typeof persisted.title).toBe('object');
    expect(typeof persisted.description).toBe('object');
  });

  it('migration is idempotent', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'rem-5b',
          title: 'Titre en clair',
          description: 'Description en clair',
          date: '2026-09-15',
          time: '11:00',
          repeat: 'weekly',
          enabled: true,
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
        },
      ]),
    );
    await migrateLegacyPlainPregnancyCustomReminders();
    await migrateLegacyPlainPregnancyCustomReminders();
    const reminders = await getCustomReminders();
    expect(reminders.find(r => r.id === 'rem-5b')?.description).toBe('Description en clair');
  });

  it('migration is a no-op when nothing is legacy plaintext', async () => {
    await saveCustomReminder({
      id: 'rem-5c',
      title: 'Déjà chiffré après un premier save',
      date: '2026-09-15',
      time: '11:00',
      repeat: 'weekly',
      enabled: true,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });
    const before = await AsyncStorage.getItem(STORAGE_KEY);
    await migrateLegacyPlainPregnancyCustomReminders();
    const after = await AsyncStorage.getItem(STORAGE_KEY);
    expect(after).toBe(before);
  });

  it('never exposes the plaintext title/description through the raw persisted bytes', async () => {
    await saveCustomReminder({
      id: 'rem-6',
      title: 'SECRET_TITLE_MARKER',
      description: 'SECRET_DESC_MARKER',
      date: '2026-09-16',
      time: '12:00',
      repeat: 'once',
      enabled: true,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(raw).not.toContain('SECRET_TITLE_MARKER');
    expect(raw).not.toContain('SECRET_DESC_MARKER');
  });
});
