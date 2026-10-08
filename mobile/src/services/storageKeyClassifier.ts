import {profileKeySuffix} from '../state/profileScopedStorage';

// THE one place that decides what an AsyncStorage key is. Backup, restore, "delete my data", managed-profile
// deletion and the orphan audit all used to carry their own copy of "does this key belong to AWA?", and the
// copies drifted: the Qadaa ledger lives under the older `awa:` namespace (not `@awa` / `@hawa`), so it was
// silently left out of backups and of "delete my data". Classification is by an explicit, reviewed list — an
// unknown `awa:` key is NOT assumed to be disposable health data; it is reported as 'unclassified' and left alone.

const PROFILE_MARKER = ':profile:';

/** The owner's local backup slot, its settings, and every per-profile backup slot (`<slot>:profile:<id>`). */
export const BACKUP_SLOT_KEY = '@awa/backup/local-v1';
export const BACKUP_SETTINGS_KEY = '@awa/backup/settings-v1';
/** Rollback journal written while a restore is in progress (see restoreJournal.ts). Never part of a backup. */
export const RESTORE_JOURNAL_KEY = '@awa/restore-journal/v1';
/** Structured-data encryption migration bookkeeping (see structuredDataMigration.ts). Never part of a backup. */
export const MIGRATION_STATE_PREFIX = '@awa/structured-migration/';

export type StorageKeyKind =
  /** Health / tracking / religious-practice records (profile-scoped or the owner's). */
  | 'tracking-data'
  /** Settings and preferences (language, theme, reminder preferences, …). */
  | 'preferences'
  /** Profile registry: managed-profile list, active profile, deleted-profile ids. */
  | 'profile-registry'
  /** A backup copy or backup bookkeeping — never itself included in a backup. */
  | 'backup-artifact'
  /** Migration / restore bookkeeping — never included in a backup, removed with the data it protects. */
  | 'internal-state'
  /** An `awa:` key nobody has classified: left untouched by backup and deletion, surfaced by the audit. */
  | 'unclassified'
  /** Not an AWA key at all. */
  | 'foreign';

export type StorageKeyInfo = {
  key: string;
  kind: StorageKeyKind;
  /** The managed profile the key belongs to; null = the owner's, or account-global. */
  profileId: string | null;
  /** The key without its `:profile:<id>` suffix. */
  baseKey: string;
};

// `awa:` namespace prefixes that are known user data. The Qadaa ledger/progress predate the '@' convention.
const KNOWN_AWA_COLON_PREFIXES = ['awa:qadaa:'] as const;

const PROFILE_REGISTRY_BASES = new Set([
  '@hawa/managed-profiles/v1',
  '@hawa/active-profile-id',
  '@hawa/deleted-managed-profile-ids/v1',
]);

// Settings / preferences — everything else under @awa/@hawa that is not tracking data. Kept as a deny-list of
// the few non-tracking families so that a NEW store defaults to 'tracking-data' (the conservative side: it is
// backed up and deleted with the user's data rather than silently skipped).
const PREFERENCE_PREFIXES = [
  '@awa/appearance/',
  '@awa/security/',
  '@hawa/language',
  '@hawa/theme',
  '@hawa/app-lock',
  '@hawa/premium',
  '@hawa/onboarding',
  '@hawa/cycle-reminder-preferences',
  '@hawa/quick-actions',
  '@hawa/calendar-filters',
  '@hawa/notification',
];

export const splitProfileKey = (key: string): {baseKey: string; profileId: string | null} => {
  const at = key.lastIndexOf(PROFILE_MARKER);
  if (at <= 0) {return {baseKey: key, profileId: null};}
  const profileId = key.slice(at + PROFILE_MARKER.length);
  return profileId ? {baseKey: key.slice(0, at), profileId} : {baseKey: key, profileId: null};
};

export function classifyStorageKey(key: string): StorageKeyInfo {
  const {baseKey, profileId} = splitProfileKey(key);
  const info = (kind: StorageKeyKind): StorageKeyInfo => ({key, kind, profileId, baseKey});

  if (key.startsWith('awa:')) {
    return info(KNOWN_AWA_COLON_PREFIXES.some(prefix => key.startsWith(prefix)) ? 'tracking-data' : 'unclassified');
  }
  if (!(key.startsWith('@awa') || key.startsWith('@hawa'))) {return info('foreign');}

  if (baseKey === BACKUP_SLOT_KEY || baseKey === BACKUP_SETTINGS_KEY) {return info('backup-artifact');}
  if (key === RESTORE_JOURNAL_KEY || key.startsWith(MIGRATION_STATE_PREFIX)) {return info('internal-state');}
  if (PROFILE_REGISTRY_BASES.has(baseKey)) {return info('profile-registry');}
  if (PREFERENCE_PREFIXES.some(prefix => baseKey.startsWith(prefix))) {return info('preferences');}
  return info('tracking-data');
}

/** True for every key AWA owns or knows of (including 'unclassified' `awa:` keys). */
export const isAwaStorageKey = (key: string): boolean => classifyStorageKey(key).kind !== 'foreign';

/** Does this key's data belong to exactly this managed profile? (Exact `:profile:<id>` suffix — never a prefix match.) */
export const belongsToManagedProfile = (key: string, profileId: string): boolean =>
  isAwaStorageKey(key) && key.endsWith(profileKeySuffix(profileId));

/** Included in the OWNER's whole-app backup: everything the user created, except backup artifacts and internal state. */
export function isIncludedInBackup(key: string): boolean {
  const {kind} = classifyStorageKey(key);
  return kind === 'tracking-data' || kind === 'preferences' || kind === 'profile-registry';
}

/** Included in a MANAGED PROFILE's backup: only that profile's own tracking data and preferences. */
export function isIncludedInProfileBackup(key: string, profileId: string): boolean {
  if (!belongsToManagedProfile(key, profileId)) {return false;}
  const {kind} = classifyStorageKey(key);
  return kind === 'tracking-data' || kind === 'preferences';
}

/** Removed by the owner's "delete my data": everything AWA owns except the backup settings and unclassified keys. */
export function isDeletedWithAllTrackedData(key: string): boolean {
  const {kind, baseKey} = classifyStorageKey(key);
  if (kind === 'foreign' || kind === 'unclassified') {return false;}
  return baseKey !== BACKUP_SETTINGS_KEY;
}

/** Removed by "delete tracked data of one managed profile": only her own tracking data / preferences / internal state. */
export function isDeletedWithProfileTrackedData(key: string, profileId: string): boolean {
  if (!belongsToManagedProfile(key, profileId)) {return false;}
  const {kind, baseKey} = classifyStorageKey(key);
  if (kind === 'unclassified' || kind === 'foreign') {return false;}
  return baseKey !== BACKUP_SETTINGS_KEY;
}
