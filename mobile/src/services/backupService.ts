import AsyncStorage from '@react-native-async-storage/async-storage';

import {profileScopedKey} from '../state/profileScopedStorage';
import {DELETED_MANAGED_PROFILES_STORAGE_KEY, parseDeletedManagedProfileIds} from '../state/deletedManagedProfiles';
import {MANAGED_PROFILES_STORAGE_KEY} from '../state/managedProfilesStore';
import {
  BACKUP_SETTINGS_KEY,
  BACKUP_SLOT_KEY,
  belongsToManagedProfile,
  isDeletedWithAllTrackedData,
  isDeletedWithProfileTrackedData,
  isIncludedInBackup,
  isIncludedInProfileBackup,
} from './storageKeyClassifier';
import {applyWritesWithJournal, type RestoreWrite} from './restoreJournal';
import {getRawItem, isStructuredEncryptionEnabled, withKeyLock} from './secureAsyncStorage';
import {StructuredDataError, decryptStructured, encryptStructured, isStructuredEnvelope} from './structuredEncryption';

// PURPOSE (M40 audit): backup/restore is MACHINE-ORIENTED app recovery, not a user-readable export. `backupNow()`
// snapshots the RAW AsyncStorage values of every key that belongs in a backup (see storageKeyClassifier.ts — which
// now includes the Qadaa ledger under the older `awa:` namespace that this file used to skip) exactly as the stores
// persisted them: records encrypted at rest stay opaque envelopes, bound by their authenticated data to the very
// storage key they are restored to.
//
// The snapshot is itself ENCRYPTED before it is stored (device-bound: same Keychain domain as the structured data, the
// storage slot's own key as authenticated data) — a plaintext copy of the user's data no longer sits next to the
// encrypted one. Snapshots written by older builds (plain JSON) are still read. A PORTABLE backup that can be restored
// on another phone is a different thing (portableBackup.ts): it is protected by a user-held passphrase, because a
// device-bound key must never leave its device.
const BACKUP_KEY = BACKUP_SLOT_KEY;
const SETTINGS_KEY = BACKUP_SETTINGS_KEY;

export type BackupSettings = {enabled: boolean; wifiOnly: boolean; frequency: 'daily'|'weekly'|'manual'};
/** `scope`/`profileId`/`profileType` are optional so every OWNER snapshot (created before this field existed) parses
 * exactly as before — `scope` is only ever set to 'managed-profile' by backupNowForProfile(). The real isolation
 * guarantee comes from each profile having its own separate storage key (see backupKeyForProfile below), not from
 * trusting this metadata. */
export type BackupSnapshot = {
  createdAt: string;
  sizeBytes: number;
  entries: Record<string, string | null>;
  scope?: 'managed-profile';
  profileId?: string;
  profileType?: 'daughter';
};
const DEFAULT_SETTINGS: BackupSettings = {enabled: true, wifiOnly: true, frequency: 'daily'};

/** Status of a stored local backup — "unreadable" is never reported as "no backup". */
export type LocalBackupStatus =
  | {status: 'none'}
  | {status: 'ok'; snapshot: BackupSnapshot; legacyPlaintext: boolean}
  | {status: 'unreadable'; reason: 'key-missing' | 'key-lost' | 'authentication-failed' | 'malformed' | 'unsupported-version'}
  | {status: 'corrupted'};

const isSnapshot = (value: unknown): value is BackupSnapshot => {
  if (!value || typeof value !== 'object') {return false;}
  const candidate = value as Partial<BackupSnapshot>;
  if (typeof candidate.createdAt !== 'string' || !candidate.entries || typeof candidate.entries !== 'object') {return false;}
  return Object.values(candidate.entries).every(entry => entry === null || typeof entry === 'string');
};

async function readSlot(slotKey: string): Promise<LocalBackupStatus> {
  const raw = await getRawItem(slotKey);
  if (!raw) {return {status: 'none'};}
  let json = raw;
  let legacyPlaintext = true;
  if (isStructuredEnvelope(raw)) {
    legacyPlaintext = false;
    try {
      json = await decryptStructured(slotKey, raw);
    } catch (error) {
      return {status: 'unreadable', reason: error instanceof StructuredDataError ? error.reason : 'authentication-failed'};
    }
  }
  try {
    const parsed: unknown = JSON.parse(json);
    return isSnapshot(parsed) ? {status: 'ok', snapshot: parsed, legacyPlaintext} : {status: 'corrupted'};
  } catch {
    return {status: 'corrupted'};
  }
}

async function writeSlot(slotKey: string, snapshot: BackupSnapshot): Promise<void> {
  let stored: string;
  if (!isStructuredEncryptionEnabled()) {
    // Roll-back / test switch only: the build is explicitly running without structured encryption.
    await withKeyLock(slotKey, () => AsyncStorage.setItem(slotKey, JSON.stringify(snapshot)));
    return;
  }
  try {
    stored = await encryptStructured(slotKey, JSON.stringify(snapshot));
  } catch (error) {
    // Encryption is mandatory for a backup: when it cannot be done, the old backup stays and the caller learns why —
    // a plaintext copy is never written as a fallback.
    throw error instanceof StructuredDataError ? error : new Error('backup could not be encrypted');
  }
  await withKeyLock(slotKey, () => AsyncStorage.setItem(slotKey, stored));
}

const byteLength = (value: string): number => new TextEncoder().encode(value).length;

async function readKeys(filter: (key: string) => boolean): Promise<Record<string, string | null>> {
  const keys = (await AsyncStorage.getAllKeys()).filter(filter);
  const pairs = await Promise.all(keys.map(async key => [key, await AsyncStorage.getItem(key)] as const));
  return Object.fromEntries(pairs);
}

export const readAwaStorage = (): Promise<Record<string, string | null>> => readKeys(isIncludedInBackup);

export async function getLocalBackupStatus(): Promise<LocalBackupStatus> {
  return readSlot(BACKUP_KEY);
}
export async function getBackupSnapshot(): Promise<BackupSnapshot | undefined> {
  const status = await readSlot(BACKUP_KEY);
  return status.status === 'ok' ? status.snapshot : undefined;
}
export async function backupNow(): Promise<BackupSnapshot> {
  const entries = await readAwaStorage();
  const snapshot: BackupSnapshot = {createdAt: new Date().toISOString(), sizeBytes: byteLength(JSON.stringify(entries)), entries};
  await writeSlot(BACKUP_KEY, snapshot);
  return snapshot;
}
/** The raw JSON behind "Télécharger mes données": exactly readAwaStorage() — raw internal keys/values, encrypted records
 * still ciphertext (never decrypted), no labels, no filter, not a report. PRODUCT DECISION REQUIRED (M40): whether this
 * free raw copy of the user's own tracking data is the intended data-portability route next to the Premium formatted
 * export. A copy that can be read on another phone is the passphrase-protected portable backup (portableBackup.ts). */
export async function buildPortableDataJson(): Promise<string> {
  return JSON.stringify(await readAwaStorage(), null, 2);
}

/**
 * The writes a restore of `snapshot` performs, WITHOUT performing them: everything validated and computed first, so a
 * bad snapshot changes nothing.
 *
 *   - only keys that belong in a backup are restored (backup slots, migration/restore bookkeeping and keys of other
 *     apps in a snapshot are ignored);
 *   - what belongs to a managed profile that was explicitly deleted AFTER the snapshot was taken is skipped, the
 *     profile is dropped from the restored profile list, and the deleted-ids list is merged, never shrunk;
 *   - a snapshot written before Qadaa data was backed up has no `awa:` entries: it simply does not touch the Qadaa
 *     records already on the device (restore only ever writes the keys the snapshot contains).
 */
export function planRestore(snapshot: BackupSnapshot, deletedIds: readonly string[], scope?: {profileId: string}): RestoreWrite[] {
  if (!isSnapshot(snapshot)) {throw new Error('invalid backup');}
  const belongsToDeleted = (key: string) => deletedIds.some(id => belongsToManagedProfile(key, id));
  const writes: RestoreWrite[] = [];
  for (const [key, value] of Object.entries(snapshot.entries)) {
    if (scope) {
      if (!isIncludedInProfileBackup(key, scope.profileId)) {continue;}
    } else {
      if (!isIncludedInBackup(key) || belongsToDeleted(key)) {continue;}
    }
    if (value === null) {
      writes.push({key, value: null});
      continue;
    }
    if (!scope && key === DELETED_MANAGED_PROFILES_STORAGE_KEY) {
      writes.push({key, value: JSON.stringify(Array.from(new Set([...deletedIds, ...parseDeletedManagedProfileIds(value)])))});
      continue;
    }
    if (!scope && key === MANAGED_PROFILES_STORAGE_KEY && deletedIds.length > 0) {
      try {
        const profiles = JSON.parse(value) as unknown;
        if (Array.isArray(profiles)) {
          const kept = profiles.filter(profile => !(profile && typeof profile === 'object' && deletedIds.includes((profile as {id?: string}).id ?? '')));
          writes.push({key, value: JSON.stringify(kept)});
          continue;
        }
      } catch {
        // not a list we understand: restored untouched below
      }
    }
    writes.push({key, value});
  }
  return writes;
}

/** Restores the OWNER's snapshot — all-or-nothing from a restart's point of view (see restoreJournal.ts). */
export async function restoreBackup(snapshot: BackupSnapshot): Promise<void> {
  const deleted = parseDeletedManagedProfileIds(await AsyncStorage.getItem(DELETED_MANAGED_PROFILES_STORAGE_KEY));
  await applyWritesWithJournal(planRestore(snapshot, deleted));
}
export async function deleteTrackedData(): Promise<void> {
  const keys = (await AsyncStorage.getAllKeys()).filter(isDeletedWithAllTrackedData);
  await Promise.all(keys.map(key => withKeyLock(key, () => AsyncStorage.removeItem(key))));
}

// ============================================================
// PROFILE-SCOPED variants — a managed daughter profile is NOT an independent account (CLAUDE.md §4): the owner's own
// "Sauvegarde"/"Supprimer mes données" operate on the WHOLE keyspace; these variants exist only for a managed profile
// and are filtered to ONLY the keys profileScopedKey()/profileKeySuffix() actually wrote for that one profile (e.g.
// `@hawa/cycle-preferences:profile:<id>`, `awa:qadaa:ledger:v1:profile:<id>`) — the owner's keys are bare/unsuffixed
// and can never match; another daughter's carry another id. Each profile's snapshot lives under its OWN slot key, never
// the owner's, which is what makes cross-profile restore structurally impossible.
// ============================================================
const backupKeyForProfile = (profileId: string): string => profileScopedKey(BACKUP_KEY, profileId);

export const readAwaStorageForProfile = (profileId: string): Promise<Record<string, string | null>> =>
  readKeys(key => isIncludedInProfileBackup(key, profileId));
/** Same raw-data-portability shape as buildPortableDataJson(), scoped to one managed profile's own keys only. */
export async function buildPortableDataJsonForProfile(profileId: string): Promise<string> {
  return JSON.stringify(await readAwaStorageForProfile(profileId), null, 2);
}
/** "Sauvegarder maintenant" for a managed profile — writes to HER OWN slot, never the owner's. */
export async function backupNowForProfile(profileId: string): Promise<BackupSnapshot> {
  const entries = await readAwaStorageForProfile(profileId);
  const snapshot: BackupSnapshot = {
    createdAt: new Date().toISOString(),
    sizeBytes: byteLength(JSON.stringify(entries)),
    entries,
    scope: 'managed-profile',
    profileId,
    profileType: 'daughter',
  };
  await writeSlot(backupKeyForProfile(profileId), snapshot);
  return snapshot;
}
export async function getLocalBackupStatusForProfile(profileId: string): Promise<LocalBackupStatus> {
  return readSlot(backupKeyForProfile(profileId));
}
export async function getBackupSnapshotForProfile(profileId: string): Promise<BackupSnapshot | undefined> {
  const status = await readSlot(backupKeyForProfile(profileId));
  return status.status === 'ok' ? status.snapshot : undefined;
}
/** Restoring a managed profile's own snapshot. Every entry already carries her `:profile:<id>` suffix by construction;
 * this re-filters by it as defense in depth, so it can never overwrite the owner's or another daughter's data. */
export async function restoreBackupForProfile(snapshot: BackupSnapshot, profileId: string): Promise<void> {
  await applyWritesWithJournal(planRestore(snapshot, [], {profileId}));
}
/** "Supprimer les données de suivi de {firstName}" — clears ONLY the tracking data this managed profile owns, never the
 * profile RECORD itself (deleted via "Gérer les profils"), never the owner's data, never another daughter's. */
export async function deleteTrackedDataForProfile(profileId: string): Promise<void> {
  const keys = (await AsyncStorage.getAllKeys()).filter(key => isDeletedWithProfileTrackedData(key, profileId));
  await Promise.all(keys.map(key => withKeyLock(key, () => AsyncStorage.removeItem(key))));
}
export async function loadBackupSettings(): Promise<BackupSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) {return {...DEFAULT_SETTINGS};}
  try {
    return {...DEFAULT_SETTINGS, ...JSON.parse(raw)};
  } catch {
    return {...DEFAULT_SETTINGS};
  }
}
export async function saveBackupSettings(value: BackupSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(value));
}
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {return `${bytes} o`;}
  if (bytes < 1048576) {return `${(bytes / 1024).toFixed(1).replace('.', ',')} Ko`;}
  return `${(bytes / 1048576).toFixed(1).replace('.', ',')} Mo`;
}
