import AsyncStorage from '@react-native-async-storage/async-storage';

// REGRESSION COVERAGE — personal information / general health have NO fabricated defaults.
//
// A user who never entered a height, weight, blood type, last name, e-mail, phone, birth date, country or health goal
// must read "not provided" (null / empty string) from the stores — never a plausible-looking invented value — and the
// stores must never persist a value she did not give. Existing saved records must load byte-for-byte unchanged, and a
// managed (daughter) profile must never read the owner's health record. Fixtures only — every value below is invented.

const PERSONAL_KEY = '@hawa/personal-information/v1';
const HEALTH_KEY = '@awa/general-health/v1';

type Secure = typeof import('../../services/secureAsyncStorage');

const M = {
  secure: () => require('../../services/secureAsyncStorage') as Secure,
  health: () => require('../generalHealthStore') as typeof import('../generalHealthStore'),
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

describe('generalHealthStore — no fabricated defaults', () => {
  it('a brand-new user has every measurement "not provided"', async () => {
    coldStart();
    const {loadGeneralHealth, getCachedGeneralHealth} = M.health();
    const profile = await loadGeneralHealth();

    expect(profile.heightCm).toBeNull();
    expect(profile.weightKg).toBeNull();
    expect(profile.bloodType).toBe('');
    expect(profile.healthGoal).toBe('');
    expect(profile.goalProgress).toBeNull();
    expect(profile.updatedAt).toBe('');
    expect(profile.chronicConditions).toEqual([]);
    expect(profile.treatments).toEqual([]);
    expect(profile.allergies).toEqual([]);
    expect(profile.medicalNotes).toBe('');
    expect(getCachedGeneralHealth()).toEqual(profile);
  });

  it('BMI is undefined (insufficient data) when height or weight is missing — never NaN or 0', () => {
    coldStart();
    const {calculateBmi, classifyBmi} = M.health();
    expect(calculateBmi(null, null)).toBeUndefined();
    expect(calculateBmi(null, 60)).toBeUndefined();
    expect(calculateBmi(170, null)).toBeUndefined();
    expect(calculateBmi(undefined, undefined)).toBeUndefined();
    expect(calculateBmi(0, 60)).toBeUndefined();
    expect(classifyBmi(calculateBmi(null, 60))).toBe('insufficientData');
    expect(calculateBmi(170, 60)).toBeCloseTo(20.76, 1);
  });

  it('saving ONE field persists only that field (untouched fields are never written as fake values)', async () => {
    const secure = coldStart();
    const {updateGeneralHealth} = M.health();
    await updateGeneralHealth({bloodType: 'A+'});

    const persisted = await storedJson(secure, HEALTH_KEY);
    expect(persisted).not.toBeNull();
    expect(persisted!.bloodType).toBe('A+');
    for (const field of ['heightCm', 'weightKg', 'healthGoal', 'goalProgress']) {
      expect(field in persisted!).toBe(false);
    }
    const serialized = JSON.stringify(persisted);
    expect(serialized).not.toContain('165');
    expect(serialized).not.toContain('Rester en forme');
  });

  it('an existing saved record loads unchanged, including values that equal the old defaults', async () => {
    const stored = {
      heightCm: 165,
      weightKg: 60,
      bloodType: 'O+',
      chronicConditions: ['Asthme'],
      treatments: ['Fer'],
      allergies: ['Pollen'],
      medicalNotes: 'Note synthétique',
      healthGoal: 'Améliorer mon sommeil',
      goalProgress: 40,
      updatedAt: '2026-08-20',
    };
    await AsyncStorage.setItem(HEALTH_KEY, JSON.stringify(stored));
    coldStart();
    const {loadGeneralHealth} = M.health();
    const profile = await loadGeneralHealth();
    expect(profile).toEqual(stored);
  });

  it('a partial legacy record keeps what was saved and reports the rest as not provided', async () => {
    await AsyncStorage.setItem(HEALTH_KEY, JSON.stringify({heightCm: 171, bloodType: 'B-', updatedAt: '2026-01-02'}));
    coldStart();
    const {loadGeneralHealth} = M.health();
    const profile = await loadGeneralHealth();
    expect(profile.heightCm).toBe(171);
    expect(profile.bloodType).toBe('B-');
    expect(profile.updatedAt).toBe('2026-01-02');
    expect(profile.weightKg).toBeNull();
    expect(profile.healthGoal).toBe('');
    expect(profile.goalProgress).toBeNull();
  });

  it('corrupted measurement values (null, 0, strings) read as not provided, never NaN/0', async () => {
    await AsyncStorage.setItem(
      HEALTH_KEY,
      JSON.stringify({heightCm: 0, weightKg: 'abc', bloodType: null, goalProgress: 'x', allergies: 'oops'}),
    );
    coldStart();
    const {loadGeneralHealth} = M.health();
    const profile = await loadGeneralHealth();
    expect(profile.heightCm).toBeNull();
    expect(profile.weightKg).toBeNull();
    expect(profile.bloodType).toBe('');
    expect(profile.goalProgress).toBeNull();
    expect(profile.allergies).toEqual([]);
  });

  it('the boot-time notes migration does not stamp a fake "last update" date or add default fields', async () => {
    await AsyncStorage.setItem(HEALTH_KEY, JSON.stringify({medicalNotes: 'Note historique'}));
    const secure = coldStart();
    const {migrateLegacyPlainGeneralHealthNotes, loadGeneralHealth} = M.health();
    await migrateLegacyPlainGeneralHealthNotes();

    const persisted = await storedJson(secure, HEALTH_KEY);
    expect(persisted).not.toBeNull();
    expect('heightCm' in persisted!).toBe(false);
    expect('weightKg' in persisted!).toBe(false);
    expect('updatedAt' in persisted!).toBe(false);
    const profile = await loadGeneralHealth();
    expect(profile.medicalNotes).toBe('Note historique');
    expect(profile.updatedAt).toBe('');
  });

  it('a managed profile never reads — nor overwrites — the owner’s health record', async () => {
    coldStart();
    const {updateGeneralHealth, loadGeneralHealth, getCachedGeneralHealth} = M.health();
    const {addManagedProfile, resetManagedProfilesForTests} = M.managed();
    const {setActiveProfileId, resetActiveProfileForTests, OWNER_PROFILE_ID} = M.active();
    await resetManagedProfilesForTests();
    await resetActiveProfileForTests();

    await updateGeneralHealth({heightCm: 172, weightKg: 64, bloodType: 'AB+', medicalNotes: 'Note du propriétaire'});

    const daughter = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2014-06-15', hasHadFirstPeriod: false});
    await setActiveProfileId(daughter.id);

    // Synchronous cached read must already be the daughter's (empty) state.
    expect(getCachedGeneralHealth().heightCm).toBeNull();
    const daughterProfile = await loadGeneralHealth();
    expect(daughterProfile.heightCm).toBeNull();
    expect(daughterProfile.weightKg).toBeNull();
    expect(daughterProfile.bloodType).toBe('');
    expect(daughterProfile.medicalNotes).toBe('');

    await updateGeneralHealth({bloodType: 'O-'});
    expect(getCachedGeneralHealth().bloodType).toBe('O-');
    expect(getCachedGeneralHealth().heightCm).toBeNull();

    await setActiveProfileId(OWNER_PROFILE_ID);
    const owner = await loadGeneralHealth();
    expect(owner.heightCm).toBe(172);
    expect(owner.weightKg).toBe(64);
    expect(owner.bloodType).toBe('AB+');
    expect(owner.medicalNotes).toBe('Note du propriétaire');
  });

  it('the owner’s record stays under the exact legacy storage key (no migration)', async () => {
    const secure = coldStart();
    const {updateGeneralHealth} = M.health();
    await updateGeneralHealth({weightKg: 70});
    const persisted = await storedJson(secure, HEALTH_KEY);
    expect(persisted?.weightKg).toBe(70);
  });
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

describe('medical export — never reads personal information / general health', () => {
  it('no export service imports the personal-information or general-health stores', () => {
    const fs = require('fs') as typeof import('fs');
    const path = require('path') as typeof import('path');
    const servicesDir = path.resolve(__dirname, '../../services');
    const exportFiles = fs.readdirSync(servicesDir).filter(name => /^medicalExport.*\.ts$/.test(name));
    expect(exportFiles.length).toBeGreaterThan(0);
    for (const name of exportFiles) {
      const source = fs.readFileSync(path.join(servicesDir, name), 'utf8');
      expect(source).not.toContain('personalInformationStore');
      expect(source).not.toContain('generalHealthStore');
    }
  });
});
