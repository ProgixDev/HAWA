import AsyncStorage from '@react-native-async-storage/async-storage';
import {sha256} from 'js-sha256';

import {clearStructuredCache, waitForPendingStorageWrites} from '../services/secureAsyncStorage';
import {
  LOCAL_ACCOUNT_ID,
  SIGNED_OUT_SESSION,
  isValidAccountId,
  whenAccountScopeReady,
  writeSession,
} from './accountScope';
import {OWNER_PROFILE_ID, reloadActiveProfileData, setActiveProfileId} from './activeProfileStore';
import {reloadManagedProfilesForActiveAccount} from './managedProfilesStore';
import {loadPersonalInformation, resetPersonalInformationMemory} from './personalInformationStore';
import {reloadAllOwnerStores} from './ownerStoreRegistry';

// LOCAL PROFILES of this phone — a frontend-only demonstration, not online accounts. Nothing here talks to a server: the e-mail is NOT verified (it only
// has to look like an e-mail) and NO password is checked or stored. A profile is identified by a hash of its e-mail; the raw e-mail is never stored,
// never part of a storage key, and only a masked label ("ma***@gmail.com") is kept to tell the profiles apart in the list.
//
// What a profile owns: the answers of the onboarding questionnaire and whether it was completed (the eleven records in accountScope.ts). The daily
// health logs and every other record stay shared between the profiles of this device, and the default profile (`local`, "Continuer sans compte")
// keeps the data AWA already had, untouched.

const REGISTRY_STORAGE_KEY = '@awa/local-accounts/registry-v1';
const ID_SALT = 'awa-local-profile:v1:';

export type LocalAccount = {id: string; label: string; createdAt: string};

export const normalizeEmail = (value: string): string => value.trim().toLowerCase();
export const isPlausibleEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(value));

/** Deterministic local identifier derived from the normalized e-mail (never the e-mail itself). */
export const deriveAccountId = (email: string): string => `acct-${sha256(`${ID_SALT}${normalizeEmail(email)}`).slice(0, 16)}`;

/** "ma***@gmail.com": enough to recognise a profile, not enough to recover the address. */
export const maskEmail = (email: string): string => {
  const [local = '', domain = ''] = normalizeEmail(email).split('@');
  return `${local.slice(0, 2)}***@${domain}`;
};

let registryWrite: Promise<unknown> = Promise.resolve();

export async function listLocalAccounts(): Promise<LocalAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(REGISTRY_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {return [];}
    return parsed.filter(
      (item): item is LocalAccount =>
        typeof item === 'object' && item !== null && isValidAccountId((item as LocalAccount).id) && typeof (item as LocalAccount).label === 'string',
    );
  } catch {
    return [];
  }
}

export async function findLocalAccount(email: string): Promise<LocalAccount | null> {
  if (!isPlausibleEmail(email)) {return null;}
  const id = deriveAccountId(email);
  return (await listLocalAccounts()).find(account => account.id === id) ?? null;
}

export type CreateAccountResult = {ok: true; account: LocalAccount} | {ok: false; reason: 'invalid-email' | 'exists'};

/** Registers a NEW local profile. An e-mail that already has one is refused (the person signs in instead): creating must never reuse another
 * profile's onboarding answers. Does not activate it — see activateProfile. */
export async function createLocalAccount(email: string, now: Date = new Date()): Promise<CreateAccountResult> {
  if (!isPlausibleEmail(email)) {return {ok: false, reason: 'invalid-email'};}
  const id = deriveAccountId(email);
  const created: {value: CreateAccountResult | null} = {value: null};
  registryWrite = registryWrite.catch(() => undefined).then(async () => {
    const accounts = await listLocalAccounts();
    if (accounts.some(account => account.id === id)) {
      created.value = {ok: false, reason: 'exists'};
      return;
    }
    const account: LocalAccount = {id, label: maskEmail(email), createdAt: now.toISOString()};
    await AsyncStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify([...accounts, account]));
    created.value = {ok: true, account};
  });
  await registryWrite;
  return created.value ?? {ok: false, reason: 'invalid-email'};
}

/**
 * Makes `target` the active local profile WITHOUT closing the app: `LOCAL_ACCOUNT_ID` (the default, "Continuer sans compte"), an `acct-…` id, or
 * SIGNED_OUT_SESSION (sign out). In order: (1) every storage write in flight finishes; (2) the session is saved — a failure throws and the previous
 * profile stays in force; (3) decrypted values cached from the previous profile are dropped; (4) the active health profile goes back to the owner (a
 * managed daughter profile keeps all her data, she is simply not the open one); (5) the in-memory stores re-read their records under the new profile.
 * Nothing is deleted or copied: every profile's records stay where they are.
 */
export async function activateProfile(target: string): Promise<void> {
  await whenAccountScopeReady();
  const next = target === SIGNED_OUT_SESSION || target === LOCAL_ACCOUNT_ID || isValidAccountId(target) ? target : LOCAL_ACCOUNT_ID;
  await waitForPendingStorageWrites();
  await writeSession(next);
  clearStructuredCache();
  // The list of managed (daughter) profiles is the one of the profile now in force; only then is the active health profile set back to the owner.
  await reloadManagedProfilesForActiveAccount();
  await setActiveProfileId(OWNER_PROFILE_ID);
  resetPersonalInformationMemory();
  await reloadAllOwnerStores();
  reloadActiveProfileData();
  await loadPersonalInformation();
}

/** Clears the active session; the profile's saved information stays. Reopening the app lands on the sign-in screen, never on a previous profile. */
export const signOutLocalProfile = (): Promise<void> => activateProfile(SIGNED_OUT_SESSION);
