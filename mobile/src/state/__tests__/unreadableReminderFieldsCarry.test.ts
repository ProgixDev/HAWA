import * as Keychain from 'react-native-keychain';

import {clearAesKeyCache} from '../../services/secureAesKeyStore';
import {isEncryptedFieldPayload} from '../../services/atRestFieldEncryption';
import {readStoredJson} from '../../testUtils/structuredStorage';
import {
  deleteCustomReminder,
  getCustomReminders,
  saveCustomReminder,
  type CustomReminder,
} from '../pregnancyCustomRemindersStore';
import {
  getHealthReminders,
  saveHealthReminder,
  type HealthReminder,
} from '../pregnancyHealthRemindersStore';

// Phase 2 — F16: an encrypted field that cannot be opened RIGHT NOW must never be blanked ON DISK.
//
// The reminder stores decrypt a field and hand the UI / the schedulers a plain value; when decryption fails (the
// Keychain answered an error, the key is not available yet, the payload is corrupted) they answer with a blank.
// Saving ANY reminder of the same list writes the whole list back — so that blank REPLACED the sealed payload on disk,
// and the text was lost for good even if the key came back a minute later.
//
// The sealed payload is now carried with the record, untouched, and written back byte-for-byte while the field is
// still blank. No key is created or replaced, nothing is re-encrypted or migrated, the payload format is the same;
// a value she types always wins. Fixtures only: the Keychain here is the in-memory mock from jest.setup.js.

const CUSTOM_KEY = '@hawa/pregnancy-custom-reminders';
const HEALTH_KEY = '@hawa/pregnancy-health-reminders';
const CUSTOM_SERVICE = 'com.hawa.private.pregnancy-custom-reminders.encryption-key';
const HEALTH_SERVICE = 'com.hawa.private.pregnancy-health-reminders.encryption-key';

const getGenericPassword = Keychain.getGenericPassword as unknown as jest.Mock;
const originalGet = getGenericPassword.getMockImplementation() as (options?: {service?: string}) => Promise<unknown>;

/** Makes the field-level key of the given services unreadable (a Keychain error), as it is while the phone is locked. */
function keychainFailsFor(...services: string[]) {
  clearAesKeyCache();
  getGenericPassword.mockImplementation(async (options?: {service?: string}) => {
    if (options?.service && services.includes(options.service)) {
      throw new Error('keystore unavailable');
    }
    return originalGet(options);
  });
}

function keychainWorks() {
  clearAesKeyCache();
  getGenericPassword.mockImplementation(originalGet);
}

const stamp = '2026-09-01T00:00:00.000Z';
const custom = (overrides: Partial<CustomReminder>): CustomReminder => ({
  id: 'c1',
  title: 'Prise de sang',
  description: 'Etre a jeun',
  date: '2026-10-01',
  time: '08:00',
  repeat: 'daily',
  enabled: true,
  createdAt: stamp,
  updatedAt: stamp,
  ...overrides,
});
const health = (overrides: Partial<HealthReminder>): HealthReminder => ({
  id: 'h1',
  kind: 'medication',
  name: 'Acide folique',
  time: '09:00',
  repeat: 'daily',
  enabled: true,
  createdAt: stamp,
  updatedAt: stamp,
  ...overrides,
});

const persistedCustom = async () => (await readStoredJson<Array<Record<string, unknown>>>(CUSTOM_KEY)) ?? [];
const persistedHealth = async () => (await readStoredJson<Array<Record<string, unknown>>>(HEALTH_KEY)) ?? [];
const byId = (rows: Array<Record<string, unknown>>, id: string) => rows.find(row => row.id === id);

beforeEach(async () => {
  keychainWorks();
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  await AsyncStorage.clear();
  await Keychain.resetGenericPassword({service: CUSTOM_SERVICE});
  await Keychain.resetGenericPassword({service: HEALTH_SERVICE});
  clearAesKeyCache();
});

afterAll(() => {
  keychainWorks();
});

describe('custom reminders (title, description)', () => {
  it('saving ANOTHER reminder while the key is unreadable leaves the unreadable one\'s sealed fields byte-identical', async () => {
    await saveCustomReminder(custom({id: 'c1'}));
    const before = byId(await persistedCustom(), 'c1')!;
    expect(isEncryptedFieldPayload(before.title)).toBe(true);
    expect(isEncryptedFieldPayload(before.description)).toBe(true);

    keychainFailsFor(CUSTOM_SERVICE);
    const unreadable = await getCustomReminders();
    expect(unreadable.find(item => item.id === 'c1')?.title).toBe(''); // what the UI / scheduler sees: nothing, not garbage

    // ...and she adds a different reminder (its own title cannot be encrypted either, so the save is refused or the
    // key is unavailable: use a plain list write path that does not need the key — an enabled toggle of c1 itself).
    await saveCustomReminder({...unreadable.find(item => item.id === 'c1')!, enabled: false, updatedAt: stamp});

    const after = byId(await persistedCustom(), 'c1')!;
    expect(after.title).toEqual(before.title);
    expect(after.description).toEqual(before.description);
    expect(after.enabled).toBe(false); // the legitimate change did go through
  });

  it('once the key is readable again the original text is back (nothing was lost in between)', async () => {
    await saveCustomReminder(custom({id: 'c1'}));
    keychainFailsFor(CUSTOM_SERVICE);
    const unreadable = await getCustomReminders();
    await saveCustomReminder({...unreadable[0], enabled: false, updatedAt: stamp});

    keychainWorks();
    const recovered = await getCustomReminders();

    expect(recovered).toHaveLength(1);
    expect(recovered[0]).toMatchObject({title: 'Prise de sang', description: 'Etre a jeun', enabled: false});
  });

  it('deleting a DIFFERENT reminder while one is unreadable keeps the unreadable one intact', async () => {
    await saveCustomReminder(custom({id: 'c1'}));
    await saveCustomReminder(custom({id: 'c2', title: 'Rendez-vous', description: undefined}));
    const before = byId(await persistedCustom(), 'c1')!;

    keychainFailsFor(CUSTOM_SERVICE);
    await deleteCustomReminder('c2');

    const rows = await persistedCustom();
    expect(rows.map(row => row.id)).toEqual(['c1']);
    expect(byId(rows, 'c1')!.title).toEqual(before.title);
    expect(byId(rows, 'c1')!.description).toEqual(before.description);
  });

  it('a title she TYPES for an unreadable reminder replaces the sealed one (her new value always wins)', async () => {
    await saveCustomReminder(custom({id: 'c1'}));
    const before = byId(await persistedCustom(), 'c1')!;

    keychainFailsFor(CUSTOM_SERVICE);
    const unreadable = await getCustomReminders();
    keychainWorks(); // she retypes it with the key available
    await saveCustomReminder({...unreadable[0], title: 'Nouveau titre'});

    const after = byId(await persistedCustom(), 'c1')!;
    expect(after.title).not.toEqual(before.title);
    expect((await getCustomReminders())[0].title).toBe('Nouveau titre');
  });

  it('clearing a READABLE description still removes it (a blank she chose is not "unreadable")', async () => {
    await saveCustomReminder(custom({id: 'c1'}));
    const [readable] = await getCustomReminders();

    await saveCustomReminder({...readable, description: undefined});

    expect((await getCustomReminders())[0].description).toBeUndefined();
    expect(byId(await persistedCustom(), 'c1')!.description).toBeUndefined();
  });

  it('the carried payload never leaks into what is persisted as an extra key', async () => {
    await saveCustomReminder(custom({id: 'c1'}));
    keychainFailsFor(CUSTOM_SERVICE);
    const unreadable = await getCustomReminders();
    await saveCustomReminder({...unreadable[0], updatedAt: '2026-09-02T00:00:00.000Z'});

    const row = byId(await persistedCustom(), 'c1')!;
    expect(Object.keys(row).sort()).toEqual(
      ['createdAt', 'date', 'description', 'enabled', 'id', 'repeat', 'time', 'title', 'updatedAt'].sort(),
    );
  });
});

describe('health reminders (name)', () => {
  it('an unreadable medicine/vitamin name survives a save of the same reminder\'s other fields', async () => {
    await saveHealthReminder(health({id: 'h1'}));
    const before = byId(await persistedHealth(), 'h1')!;
    expect(isEncryptedFieldPayload(before.name)).toBe(true);

    keychainFailsFor(HEALTH_SERVICE);
    const [unreadable] = await getHealthReminders();
    expect(unreadable.name).toBe('');
    await saveHealthReminder({...unreadable, enabled: false, updatedAt: stamp});

    const after = byId(await persistedHealth(), 'h1')!;
    expect(after.name).toEqual(before.name);
    expect(after.enabled).toBe(false);

    keychainWorks();
    expect((await getHealthReminders())[0].name).toBe('Acide folique');
  });

  it('saving another reminder while one name is unreadable does not blank it', async () => {
    await saveHealthReminder(health({id: 'h1'}));
    await saveHealthReminder(health({id: 'h2', kind: 'vitamin', name: 'Vitamine D'}));
    const before = byId(await persistedHealth(), 'h1')!;

    keychainFailsFor(HEALTH_SERVICE);
    const rows = await getHealthReminders();
    const h2 = rows.find(row => row.id === 'h2')!;
    await saveHealthReminder({...h2, time: '10:00'});

    expect(byId(await persistedHealth(), 'h1')!.name).toEqual(before.name);
  });
});
