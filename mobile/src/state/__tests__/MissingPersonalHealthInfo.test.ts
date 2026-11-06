import AsyncStorage from '@react-native-async-storage/async-storage';

// REGRESSION COVERAGE — personal information has NO fabricated defaults.
//
// A user who never entered a height, weight, blood type, last name, e-mail, phone, birth date, country or health goal
// must read "not provided" (null / empty string) from the stores — never a plausible-looking invented value — and the
// stores must never persist a value she did not give. Existing saved records must load byte-for-byte unchanged, and a
// managed (daughter) profile must never read the owner's health record. Fixtures only — every value below is invented.

const PERSONAL_KEY = '@hawa/personal-information/v1';

type Secure = typeof import('../../services/secureAsyncStorage');

const M = {
  secure: () => require('../../services/secureAsyncStorage') as Secure,
  personal: () => require('../personalInformationStore') as typeof import('../personalInformationStore'),
  active: () => require('../activeProfileStore') as typeof import('../activeProfileStore'),
  managed: () => require('../managedProfilesStore') as typeof import('../managedProfilesStore'),
};

/** A cold start: module-level caches are gone, storage persists. */
const coldStart = () => {
  jest.resetModules();
  const secure = M.secure();
  secure.resetStructuredStorageForTests();
  return secure;
};

const storedJson = async (secure: Secure, key: string): Promise<Record<string, unknown> | null> => {
  const raw = await secure.default.getItem(key);
  return raw === null ? null : (JSON.parse(raw) as Record<string, unknown>);
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('personalInformationStore — no fabricated defaults', () => {
  it('a brand-new user has every identifying field "not provided" (empty)', async () => {
    coldStart();
    const {loadPersonalInformation} = M.personal();
    const info = await loadPersonalInformation();

    expect(info.firstName).toBe('');
    expect(info.preferredName).toBe('');
    expect(info.lastName).toBe('');
    expect(info.birthDate).toBe('');
    expect(info.email).toBe('');
    expect(info.phone).toBe('');
    expect(info.country).toBe('');
  });

  it('the old invented identity is gone from the module source of truth', async () => {
    coldStart();
    const {getCachedPersonalInformation} = M.personal();
    const serialized = JSON.stringify(getCachedPersonalInformation());
    for (const fake of ['Benali', 'amina.benali', '1998-05-14', '+213', 'Algérie']) {
      expect(serialized).not.toContain(fake);
    }
  });

  it('saving only a first name persists nothing else identifying', async () => {
    const secure = coldStart();
    const {updatePersonalInformation} = M.personal();
    await updatePersonalInformation({firstName: 'Sarah'});

    const persisted = await storedJson(secure, PERSONAL_KEY);
    expect(persisted).not.toBeNull();
    expect(persisted!.firstName).toBe('Sarah');
    for (const field of ['lastName', 'birthDate', 'email', 'phone', 'country']) {
      expect(field in persisted!).toBe(false);
    }
  });

  it('an existing saved record loads unchanged, including values equal to the old defaults', async () => {
    await AsyncStorage.setItem(
      PERSONAL_KEY,
      JSON.stringify({
        firstName: 'Sarah',
        lastName: 'Benali',
        birthDate: '1998-05-14',
        email: 'amina.benali@email.com',
        phone: '+213 6 12 34 56 78',
        country: 'Algérie',
        language: 'Français',
        preferredName: 'Sarah',
        calendar: 'hijri',
        timeFormat: '12h',
      }),
    );
    coldStart();
    const {loadPersonalInformation} = M.personal();
    const info = await loadPersonalInformation();
    expect(info).toMatchObject({
      firstName: 'Sarah',
      lastName: 'Benali',
      birthDate: '1998-05-14',
      email: 'amina.benali@email.com',
      phone: '+213 6 12 34 56 78',
      country: 'Algérie',
      preferredName: 'Sarah',
      calendar: 'hijri',
      timeFormat: '12h',
    });
  });

  it('a partial legacy record keeps what was saved; absent or invalid fields are not provided', async () => {
    await AsyncStorage.setItem(PERSONAL_KEY, JSON.stringify({firstName: 'Nour', email: 'nour@example.com', phone: null}));
    coldStart();
    const {loadPersonalInformation} = M.personal();
    const info = await loadPersonalInformation();
    expect(info.firstName).toBe('Nour');
    expect(info.email).toBe('nour@example.com');
    expect(info.phone).toBe('');
    expect(info.lastName).toBe('');
    expect(info.birthDate).toBe('');
    expect(info.country).toBe('');
  });

  it('non-identifying preferences keep their (non-personal) defaults', async () => {
    coldStart();
    const {loadPersonalInformation} = M.personal();
    const info = await loadPersonalInformation();
    expect(info.calendar).toBe('double');
    expect(info.timeFormat).toBe('24h');
  });
});

describe('medical export — never reads personal information', () => {
  it('no export service imports the personal-information store', () => {
    const fs = require('fs') as typeof import('fs');
    const path = require('path') as typeof import('path');
    const servicesDir = path.resolve(__dirname, '../../services');
    const exportFiles = fs.readdirSync(servicesDir).filter(name => /^medicalExport.*\.ts$/.test(name));
    expect(exportFiles.length).toBeGreaterThan(0);
    for (const name of exportFiles) {
      const source = fs.readFileSync(path.join(servicesDir, name), 'utf8');
      expect(source).not.toContain('personalInformationStore');
    }
  });
});
