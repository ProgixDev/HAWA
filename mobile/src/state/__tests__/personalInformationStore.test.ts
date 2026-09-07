import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadPersonalInformation,
  migrateLegacyPlainPersonalInformation,
  updatePersonalInformation,
} from '../personalInformationStore';

const STORAGE_KEY = '@hawa/personal-information/v1';

describe('personalInformationStore — encryption at rest', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('migrates legacy plaintext lastName/birthDate/email/phone to AES-256-GCM at rest, preserving content exactly', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        firstName: 'Sarah',
        lastName: 'Boukhalfa',
        birthDate: '1995-03-12',
        email: 'sarah.b@example.com',
        phone: '+213 5 55 12 34 56',
        country: 'Algérie',
        language: 'Français',
        preferredName: 'Sarah',
        calendar: 'double',
        timeFormat: '24h',
      }),
    );

    await migrateLegacyPlainPersonalInformation();

    const info = await loadPersonalInformation();
    expect(info.lastName).toBe('Boukhalfa');
    expect(info.birthDate).toBe('1995-03-12');
    expect(info.email).toBe('sarah.b@example.com');
    expect(info.phone).toBe('+213 5 55 12 34 56');
    // Non-sensitive fields untouched.
    expect(info.firstName).toBe('Sarah');
    expect(info.country).toBe('Algérie');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!);
    expect(typeof persisted.lastName).toBe('object');
    expect(typeof persisted.email).toBe('object');
    expect(typeof persisted.phone).toBe('object');
    expect(typeof persisted.birthDate).toBe('object');
    expect(persisted.firstName).toBe('Sarah'); // plaintext by design
    expect(JSON.stringify(persisted)).not.toContain('Boukhalfa');
    expect(JSON.stringify(persisted)).not.toContain('sarah.b@example.com');
    expect(JSON.stringify(persisted)).not.toContain('+213 5 55 12 34 56');
  });

  it('migration is idempotent', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({lastName: 'Test', email: 'a@b.com', phone: '000', birthDate: '2000-01-01'}),
    );
    await migrateLegacyPlainPersonalInformation();
    await migrateLegacyPlainPersonalInformation();
    const info = await loadPersonalInformation();
    expect(info.lastName).toBe('Test');
    expect(info.email).toBe('a@b.com');
  });

  it('migration is a no-op when nothing is legacy plaintext', async () => {
    const before = await AsyncStorage.getItem(STORAGE_KEY);
    await migrateLegacyPlainPersonalInformation();
    const after = await AsyncStorage.getItem(STORAGE_KEY);
    expect(after).toBe(before);
  });

  it('a fresh update encrypts sensitive fields at rest while keeping the returned/cached value plaintext', async () => {
    const updated = await updatePersonalInformation({email: 'new@example.com', phone: '+1 555 0100'});
    expect(updated.email).toBe('new@example.com');
    expect(updated.phone).toBe('+1 555 0100');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!);
    expect(typeof persisted.email).toBe('object');
    expect(typeof persisted.phone).toBe('object');
    expect(JSON.stringify(persisted)).not.toContain('new@example.com');
  });

  it('firstName/preferredName/country/language/calendar/timeFormat remain plaintext at rest', async () => {
    await updatePersonalInformation({firstName: 'Amina', country: 'Maroc'});
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const persisted = JSON.parse(raw!);
    expect(persisted.firstName).toBe('Amina');
    expect(persisted.country).toBe('Maroc');
  });
});
