import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  LOCAL_ACCOUNT_ID,
  SESSION_STORAGE_KEY,
  SIGNED_OUT_SESSION,
  getActiveAccountId,
  getSession,
  isSignedOut,
  resetAccountScopeForTests,
  scopeKey,
  whenAccountScopeReady,
  ACCOUNT_SCOPED_BASES,
} from '../accountScope';
import {
  activateProfile,
  createLocalAccount,
  deriveAccountId,
  findLocalAccount,
  listLocalAccounts,
  maskEmail,
  signOutLocalProfile,
} from '../localAccounts';
import {
  getSelectedObjective,
  hydrateActiveObjective,
  hydrateHasCompletedOnboarding,
  setHasCompletedOnboarding,
  setSelectedObjective,
} from '../onboardingPreferences';
import {getCachedPersonalInformation, loadPersonalInformation, updatePersonalInformation} from '../personalInformationStore';
import {getConfirmedPeriodHistory, hydrateConfirmedPeriodHistory, recordConfirmedPeriodEnd} from '../confirmedPeriodHistoryStore';
import {
  classifyStorageKey,
  isDeletedWithAllTrackedData,
  isIncludedInBackup,
  belongsToManagedProfile,
} from '../../services/storageKeyClassifier';
import secureAsyncStorage, {
  isStructuredBase,
  resetStructuredStorageForTests,
  setStructuredEncryptionEnabled,
  waitForPendingStorageWrites,
} from '../../services/secureAsyncStorage';
import {isStructuredEnvelope} from '../../services/structuredEncryption';
import {profileScopedKey} from '../profileScopedStorage';
import {addManagedProfile, getManagedProfiles} from '../managedProfilesStore';
import {backupNow, deleteTrackedData, readAwaStorage, restoreBackup} from '../../services/backupService';
import {auditManagedProfileOrphans} from '../../services/managedProfileOrphanAudit';

// LOCAL PROFILES (state/localAccounts.ts, accountScope.ts): the eleven onboarding records are kept per local profile; every other record is shared.
// These tests use the REAL stores, the REAL storage adapter and an in-memory AsyncStorage; only the native Keychain is the global in-memory mock.

const ALICE = 'alice@example.com';
const BOB = 'bob@example.com';

async function wipe() {
  await AsyncStorage.clear();
  resetAccountScopeForTests();
  resetStructuredStorageForTests();
  await activateProfile(LOCAL_ACCOUNT_ID);
}

const physicalKeys = async () => [...(await AsyncStorage.getAllKeys())];

beforeEach(async () => {
  await wipe();
});

describe('local identifier', () => {
  it('is deterministic, case/space-insensitive and never contains the e-mail', () => {
    const id = deriveAccountId('  Alice@Example.com ');
    expect(id).toBe(deriveAccountId('alice@example.com'));
    expect(id).toMatch(/^acct-[0-9a-f]{16}$/);
    expect(id).not.toContain('alice');
    expect(id).not.toBe(deriveAccountId(BOB));
  });

  it('the registry keeps a masked label only, and no raw e-mail anywhere in storage', async () => {
    await createLocalAccount(ALICE);
    expect(maskEmail(ALICE)).toBe('al***@example.com');
    const keys = await AsyncStorage.getAllKeys();
    const values = await Promise.all(keys.map(key => AsyncStorage.getItem(key)));
    const everything = JSON.stringify([...keys, ...values]);
    expect(everything).not.toContain('alice@example.com');
    expect((await listLocalAccounts()).map(account => account.label)).toEqual(['al***@example.com']);
  });

  it('refuses an invalid e-mail and an e-mail that already has a profile (creating never reuses another profile)', async () => {
    expect(await createLocalAccount('not-an-email')).toEqual({ok: false, reason: 'invalid-email'});
    expect((await createLocalAccount(ALICE)).ok).toBe(true);
    expect(await createLocalAccount('ALICE@example.com ')).toEqual({ok: false, reason: 'exists'});
    expect(await findLocalAccount(ALICE)).not.toBeNull();
    expect(await findLocalAccount(BOB)).toBeNull();
  });
});

describe('two local profiles complete onboarding with different answers', () => {
  it('keeps the answers apart, survives sign-out, returns to the original profile intact and leaves the shared health history untouched', async () => {
    // The ORIGINAL profile (what the app already had): completed, objective, a name, and a confirmed period in the shared health history.
    await setSelectedObjective('pregnancy');
    await setHasCompletedOnboarding(true);
    await updatePersonalInformation({firstName: 'Local', lastName: 'Original'});
    await recordConfirmedPeriodEnd(new Date(2026, 9, 1), new Date(2026, 9, 6));
    const historyBefore = getConfirmedPeriodHistory();
    expect(historyBefore).toHaveLength(1);
    const originalKeys = await physicalKeys();

    // Profile A is created: it starts with its OWN, empty onboarding.
    const alice = await createLocalAccount(ALICE);
    expect(alice.ok).toBe(true);
    if (!alice.ok) {throw new Error('unreachable');}
    await activateProfile(alice.account.id);
    expect(getActiveAccountId()).toBe(alice.account.id);
    expect(await hydrateHasCompletedOnboarding()).toBe(false);
    expect(getSelectedObjective()).toBe('cycle'); // the default, NOT the original profile's pregnancy
    expect(getCachedPersonalInformation().firstName).toBe('');
    expect(getCachedPersonalInformation().lastName).toBe('');

    await setSelectedObjective('conceive');
    await setHasCompletedOnboarding(true);
    await updatePersonalInformation({firstName: 'Alice'});

    // Profile B: again empty, then different answers.
    const bob = await createLocalAccount(BOB);
    if (!bob.ok) {throw new Error('unreachable');}
    await activateProfile(bob.account.id);
    expect(await hydrateHasCompletedOnboarding()).toBe(false);
    expect(getSelectedObjective()).toBe('cycle');
    expect(getCachedPersonalInformation().firstName).toBe('');
    await setSelectedObjective('menopause');
    await updatePersonalInformation({firstName: 'Bob'});

    // Back to A: its own answers.
    await activateProfile(alice.account.id);
    expect(await hydrateHasCompletedOnboarding()).toBe(true);
    expect(await hydrateActiveObjective()).toBe('conceive');
    expect(getCachedPersonalInformation().firstName).toBe('Alice');

    // Sign out: the session is cleared, the saved information stays.
    await signOutLocalProfile();
    expect(isSignedOut()).toBe(true);
    expect(getSession()).toBe(SIGNED_OUT_SESSION);
    expect(await AsyncStorage.getItem(SESSION_STORAGE_KEY)).toBe(SIGNED_OUT_SESSION);

    // Return to the original profile through "Continuer sans compte": everything it had is there, unchanged.
    await activateProfile(LOCAL_ACCOUNT_ID);
    expect(await hydrateHasCompletedOnboarding()).toBe(true);
    expect(await hydrateActiveObjective()).toBe('pregnancy');
    expect(await loadPersonalInformation()).toMatchObject({firstName: 'Local', lastName: 'Original'});

    // The original profile's keys are byte-for-byte what they were (nothing renamed, moved or deleted) ...
    const afterKeys = await physicalKeys();
    for (const key of originalKeys) {expect(afterKeys).toContain(key);}
    // ... and the SHARED health history was never touched by the other profiles.
    await hydrateConfirmedPeriodHistory();
    expect(getConfirmedPeriodHistory()).toEqual(historyBefore);
  });

  it('a profile that never answered keeps nothing of the others: its first launch is a clean onboarding', async () => {
    await setSelectedObjective('postpartum');
    await setHasCompletedOnboarding(true);
    const carol = await createLocalAccount('carol@example.com');
    if (!carol.ok) {throw new Error('unreachable');}
    await activateProfile(carol.account.id);
    expect(await hydrateHasCompletedOnboarding()).toBe(false);
    expect(await hydrateActiveObjective()).toBe('cycle');
  });
});

describe('app restart', () => {
  it('after sign-out the next launch is still signed out (the previous profile is never reconnected)', async () => {
    const alice = await createLocalAccount(ALICE);
    if (!alice.ok) {throw new Error('unreachable');}
    await activateProfile(alice.account.id);
    await signOutLocalProfile();

    resetAccountScopeForTests(); // a new process: nothing in memory
    await whenAccountScopeReady();
    expect(getSession()).toBe(SIGNED_OUT_SESSION);
    expect(isSignedOut()).toBe(true);
    expect(getActiveAccountId()).toBe(LOCAL_ACCOUNT_ID); // while signed out only the default records are in use
  });

  it('a profile that was NOT signed out is restored on the next launch, before any scoped record is read', async () => {
    await setSelectedObjective('pregnancy'); // original profile
    const alice = await createLocalAccount(ALICE);
    if (!alice.ok) {throw new Error('unreachable');}
    await activateProfile(alice.account.id);
    await setSelectedObjective('conceive');
    await waitForPendingStorageWrites();

    resetAccountScopeForTests(); // a new process: nothing in memory, the session not read yet
    // A store reading "at import" (before anything asked for the session) must still get Alice's record, not the original profile's.
    const read = await secureAsyncStorage.getItem('@hawa/active-objective');
    expect(getActiveAccountId()).toBe(alice.account.id);
    expect(read).toBe(await AsyncStorage.getItem(`@hawa/active-objective:acct:${alice.account.id}`));
    expect(read).not.toBe(await AsyncStorage.getItem('@hawa/active-objective'));
  });

  it('with no stored session (every existing installation) the original profile is the active one: nothing changes for current users', async () => {
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    resetAccountScopeForTests();
    await whenAccountScopeReady();
    expect(getSession()).toBe(LOCAL_ACCOUNT_ID);
    expect(scopeKey('@hawa/active-objective')).toBe('@hawa/active-objective');
  });
});

describe('storage keys of a local profile', () => {
  const ID = deriveAccountId(ALICE);

  it('only the onboarding records and the list of managed profiles are scoped, and never a managed (daughter) profile key', async () => {
    await createLocalAccount(ALICE);
    await activateProfile(ID);
    expect(ACCOUNT_SCOPED_BASES).toHaveLength(12);
    for (const base of ACCOUNT_SCOPED_BASES) {
      expect(scopeKey(base)).toBe(`${base}:acct:${ID}`);
      expect(scopeKey(scopeKey(base))).toBe(scopeKey(base)); // idempotent
    }
    // a daughter's record and any shared health record are left alone
    expect(scopeKey(profileScopedKey('@hawa/cycle-preferences', 'daughter-1'))).toBe('@hawa/cycle-preferences:profile:daughter-1');
    expect(scopeKey('@hawa/daily-journal/v1')).toBe('@hawa/daily-journal/v1');
    expect(scopeKey('@hawa/confirmed-period-history')).toBe('@hawa/confirmed-period-history');
    expect(scopeKey('@hawa/pregnancy-journal/v1')).toBe('@hawa/pregnancy-journal/v1');
  });

  it('the original profile keeps its current keys exactly (no suffix)', () => {
    for (const base of ACCOUNT_SCOPED_BASES) {expect(scopeKey(base)).toBe(base);}
  });

  it('classification: a scoped key is the owner\'s tracking data — backed up, deleted with the owner data, encrypted like its base, never a managed profile', () => {
    for (const base of ACCOUNT_SCOPED_BASES) {
      const key = `${base}:acct:${ID}`;
      const info = classifyStorageKey(key);
      expect(info.baseKey).toBe(base);
      expect(info.profileId).toBeNull(); // not a managed profile: the orphan audit and the profile backups never see it
      expect(info.kind).toBe(classifyStorageKey(base).kind);
      expect(isIncludedInBackup(key)).toBe(isIncludedInBackup(base));
      expect(isDeletedWithAllTrackedData(key)).toBe(true);
      expect(belongsToManagedProfile(key, 'daughter-1')).toBe(false);
      expect(isStructuredBase(key)).toBe(isStructuredBase(base));
    }
    // the encrypted ones stay encrypted
    expect(isStructuredBase(`@hawa/active-objective:acct:${ID}`)).toBe(true);
    expect(isStructuredBase(`@hawa/cycle-preferences:acct:${ID}`)).toBe(true);
    expect(isStructuredBase(`@hawa/selected-location:acct:${ID}`)).toBe(true);
  });

  it('a daughter\'s keys keep their classification and stay hers (managed-profile behaviour unchanged)', () => {
    const daughter = '@hawa/daily-journal/v1:profile:daughter-1';
    expect(classifyStorageKey(daughter).profileId).toBe('daughter-1');
    expect(belongsToManagedProfile(daughter, 'daughter-1')).toBe(true);
    expect(belongsToManagedProfile(`@hawa/cycle-preferences:acct:${ID}`, 'daughter-1')).toBe(false);
  });

  it('the session and the registry are bookkeeping of this phone: never in a backup (a restore must not sign anyone in), removed with "delete my data"', () => {
    for (const key of [SESSION_STORAGE_KEY, '@awa/local-accounts/registry-v1']) {
      expect(classifyStorageKey(key).kind).toBe('internal-state');
      expect(isIncludedInBackup(key)).toBe(false);
      expect(isDeletedWithAllTrackedData(key)).toBe(true);
    }
  });

  it('written records really live under the profile\'s own physical key, and the default profile\'s key is not touched by another profile', async () => {
    await setSelectedObjective('pregnancy'); // original profile
    await createLocalAccount(ALICE);
    await activateProfile(ID);
    await setSelectedObjective('conceive');
    await waitForPendingStorageWrites();
    const keys = await physicalKeys();
    expect(keys).toContain('@hawa/active-objective');
    expect(keys).toContain(`@hawa/active-objective:acct:${ID}`);
    expect(await AsyncStorage.getItem('@hawa/active-objective')).not.toBe(await AsyncStorage.getItem(`@hawa/active-objective:acct:${ID}`));
  });
});

describe('encryption at rest is preserved for a local profile\'s copy of an encrypted record', () => {
  afterEach(() => {
    setStructuredEncryptionEnabled(false);
    resetStructuredStorageForTests();
  });

  it('the profile\'s physical key holds an envelope (not the plain value), reads back through the adapter, and the original profile\'s record is separate', async () => {
    setStructuredEncryptionEnabled(true);
    const created = await createLocalAccount(ALICE);
    if (!created.ok) {throw new Error('unreachable');}
    await secureAsyncStorage.setItem('@hawa/active-objective', JSON.stringify('pregnancy')); // original profile
    await activateProfile(created.account.id);
    await secureAsyncStorage.setItem('@hawa/active-objective', JSON.stringify('conceive'));
    await waitForPendingStorageWrites();

    const physical = `@hawa/active-objective:acct:${created.account.id}`;
    const stored = await AsyncStorage.getItem(physical);
    expect(stored).not.toBeNull();
    expect(isStructuredEnvelope(stored as string)).toBe(true);
    expect(stored).not.toContain('conceive');
    expect(await secureAsyncStorage.getItem('@hawa/active-objective')).toBe(JSON.stringify('conceive'));

    // the original profile's own record is another, separate envelope under the unchanged key
    expect(isStructuredEnvelope((await AsyncStorage.getItem('@hawa/active-objective')) as string)).toBe(true);
    await activateProfile(LOCAL_ACCOUNT_ID);
    expect(await secureAsyncStorage.getItem('@hawa/active-objective')).toBe(JSON.stringify('pregnancy'));
  });
});

describe('the real backup / restore / delete / orphan-audit services with a local profile\'s keys', () => {
  const ID = deriveAccountId(ALICE);

  async function seed() {
    await setSelectedObjective('pregnancy'); // original profile
    await createLocalAccount(ALICE);
    await activateProfile(ID);
    await setSelectedObjective('conceive');
    await setHasCompletedOnboarding(true);
    await waitForPendingStorageWrites();
  }

  it('the owner backup contains BOTH profiles\' onboarding records, and never the session or the registry', async () => {
    await seed();
    const keys = Object.keys(await readAwaStorage());
    expect(keys).toContain('@hawa/active-objective');
    expect(keys).toContain(`@hawa/active-objective:acct:${ID}`);
    expect(keys).toContain(`@hawa/has-completed-onboarding:acct:${ID}`);
    expect(keys).not.toContain(SESSION_STORAGE_KEY);
    expect(keys).not.toContain('@awa/local-accounts/registry-v1');
  });

  it('restoring a backup brings the profile\'s records back under the same keys and leaves the session alone', async () => {
    await seed();
    const snapshot = await backupNow();
    await AsyncStorage.removeItem(`@hawa/active-objective:acct:${ID}`);
    await restoreBackup(snapshot);
    expect(await AsyncStorage.getItem(`@hawa/active-objective:acct:${ID}`)).not.toBeNull();
    expect(getSession()).toBe(ID); // a restore never signs another profile in or out
  });

  it('"delete my data" removes the profile\'s records, the registry and the session together with the original profile\'s', async () => {
    await seed();
    await deleteTrackedData();
    const keys = await physicalKeys();
    expect(keys.filter(key => key.includes(':acct:'))).toEqual([]);
    expect(keys).not.toContain('@hawa/active-objective');
    expect(keys).not.toContain('@awa/local-accounts/registry-v1');
    expect(keys).not.toContain(SESSION_STORAGE_KEY);
    expect(getSession()).toBe(LOCAL_ACCOUNT_ID); // and the original profile is the one in force again
  });

  it('the managed-profile orphan audit never reports a local profile\'s key as an orphaned managed profile', async () => {
    await seed();
    const report = await auditManagedProfileOrphans();
    expect(report.complete).toBe(true);
    expect(report.orphans.map(orphan => orphan.profileId)).not.toContain(ID);
    expect(report.orphans).toEqual([]);
  });
});

describe('managed (daughter) profiles belong to the local profile that added them', () => {
  it('a new local profile does not see the daughter of another profile; her data stays under the owner and comes back with it', async () => {
    // the original profile adds a daughter and one record of hers
    await addManagedProfile({type: 'daughter', firstName: 'Fille', birthDate: '2015-01-01', hasHadFirstPeriod: false});
    expect(getManagedProfiles()).toHaveLength(1);
    const daughterId = getManagedProfiles()[0].id;
    const daughterKey = `@hawa/cycle-preferences:profile:${daughterId}`;
    await AsyncStorage.setItem(daughterKey, JSON.stringify({marker: 'daughter-data'}));

    // a NEW local profile: no daughter in its list
    const created = await createLocalAccount('parent2@example.com');
    if (!created.ok) {throw new Error('unreachable');}
    await activateProfile(created.account.id);
    expect(getManagedProfiles()).toEqual([]);

    // the daughter's records were not touched, copied or deleted
    expect(await AsyncStorage.getItem(daughterKey)).toBe(JSON.stringify({marker: 'daughter-data'}));
    // the other profile's own list is a separate record
    expect(await AsyncStorage.getItem(`@hawa/managed-profiles/v1:acct:${created.account.id}`)).toBeNull();

    // back to the original profile: the daughter is there again
    await activateProfile(LOCAL_ACCOUNT_ID);
    expect(getManagedProfiles().map(profile => profile.id)).toEqual([daughterId]);
  });
});
