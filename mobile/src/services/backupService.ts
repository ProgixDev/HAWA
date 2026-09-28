import AsyncStorage from '@react-native-async-storage/async-storage';

import {profileKeySuffix, profileScopedKey} from '../state/profileScopedStorage';

// PURPOSE (M40 audit): backup/restore is MACHINE-ORIENTED app recovery, not a
// user-readable export. `backupNow()` snapshots the RAW AsyncStorage values of
// every `@awa*` / `@hawa*` key exactly as the stores persisted them — so every
// field encrypted at rest (encryptedNote / encryptedIntimacy / `<section>.note`
// / the per-store SENSITIVE_FIELDS ...) stays an opaque AES-GCM envelope and is
// NEVER decrypted here, and the AES keys live in the Keychain, never in the
// snapshot. The snapshot is stored back inside AsyncStorage (BACKUP_KEY) — same
// device, same protection level as the source data. It carries no labels, no
// period/category filtering and no PDF/CSV rendering: the formatted, decrypted,
// professional-facing report remains the Premium "Export" feature
// (medicalExport*.ts). `buildPortableDataJson()` below is the raw data-portability
// dump behind "Télécharger mes données" — same raw values, see its comment.
const BACKUP_KEY = '@awa/backup/local-v1';
const SETTINGS_KEY = '@awa/backup/settings-v1';

export type BackupSettings = {enabled: boolean; wifiOnly: boolean; frequency: 'daily'|'weekly'|'manual'};
/** `scope`/`profileId`/`profileType` are optional so every OWNER snapshot
 * (created before this field existed, or still created by the unchanged
 * owner-only backupNow() below) parses exactly as before — `scope` is only
 * ever set to 'managed-profile' by backupNowForProfile(), never by the
 * owner's own path. Lets restore (and any future diagnostics) tell at a
 * glance which profile a snapshot belongs to, though the real isolation
 * guarantee comes from each profile having its own separate storage key
 * (see backupKeyForProfile below), not from trusting this metadata. */
export type BackupSnapshot = {
  createdAt: string;
  sizeBytes: number;
  entries: Record<string,string|null>;
  scope?: 'managed-profile';
  profileId?: string;
  profileType?: 'daughter';
};
const DEFAULT_SETTINGS: BackupSettings = {enabled:true,wifiOnly:true,frequency:'daily'};

export async function readAwaStorage():Promise<Record<string,string|null>>{const keys=(await AsyncStorage.getAllKeys()).filter(key=>(key.startsWith('@awa')||key.startsWith('@hawa'))&&key!==BACKUP_KEY);const pairs=await Promise.all(keys.map(async key=>[key,await AsyncStorage.getItem(key)] as const));return Object.fromEntries(pairs)}
export async function getBackupSnapshot():Promise<BackupSnapshot|undefined>{const raw=await AsyncStorage.getItem(BACKUP_KEY);if(!raw)return undefined;try{return JSON.parse(raw) as BackupSnapshot}catch{return undefined}}
export async function backupNow():Promise<BackupSnapshot>{const entries=await readAwaStorage();const raw=JSON.stringify(entries);const snapshot:BackupSnapshot={createdAt:new Date().toISOString(),sizeBytes:new TextEncoder().encode(raw).length,entries};await AsyncStorage.setItem(BACKUP_KEY,JSON.stringify(snapshot));return snapshot}
/** The raw JSON behind "Télécharger mes données": exactly readAwaStorage() —
 * raw internal keys/values, encrypted fields still ciphertext (never decrypted),
 * no labels, no period/category filter, not a report. PRODUCT DECISION REQUIRED
 * (M40): whether this free raw copy of the user's own plaintext tracking data is
 * the intended data-portability route next to the Premium formatted export. */
export async function buildPortableDataJson():Promise<string>{return JSON.stringify(await readAwaStorage(),null,2)}
export async function restoreBackup(snapshot:BackupSnapshot):Promise<void>{await Promise.all(Object.entries(snapshot.entries).map(([key,value])=>value===null?AsyncStorage.removeItem(key):AsyncStorage.setItem(key,value)))}
export async function deleteTrackedData():Promise<void>{const keys=(await AsyncStorage.getAllKeys()).filter(key=>(key.startsWith('@awa')||key.startsWith('@hawa'))&&key!==SETTINGS_KEY);await Promise.all(keys.map(key=>AsyncStorage.removeItem(key)))}

// ============================================================
// PROFILE-SCOPED variants — a managed daughter profile is NOT an
// independent account (CLAUDE.md §4): the functions above (owner's own
// "Sauvegarde"/"Supprimer mes données") stay completely untouched and keep
// operating on the WHOLE @awa*/@hawa* keyspace exactly as before. These
// variants exist only for a managed profile, and are filtered to ONLY the
// keys profileScopedKey()/profileKeySuffix() actually wrote for that one
// profile (e.g. `@hawa/cycle-preferences:profile:<id>`) — the owner's own
// keys are bare/unsuffixed and can never match, so they can never be
// touched by a daughter's export/delete/restore. A managed profile's own
// data is never mixed with another managed profile's (different suffix)
// or with account-level global settings (no suffix at all, never matched).
// Each profile's "Sauvegarder maintenant" snapshot lives under its OWN
// dedicated key (the same profileScopedKey()/`:profile:<id>` convention
// every other profile-scoped store already uses) — never the owner's
// BACKUP_KEY. This is what makes cross-profile restore structurally
// impossible (Part G's "safest behavior" — see this file's own final
// report): a daughter's snapshot can only ever have been WRITTEN by
// backupNowForProfile(herOwnId), which itself only ever reads HER OWN
// suffixed keys — there is no code path that could put another profile's
// data into it, so restore never needs to guess or reject a mismatched id.
const backupKeyForProfile = (profileId: string): string => profileScopedKey(BACKUP_KEY, profileId);

export async function readAwaStorageForProfile(profileId:string):Promise<Record<string,string|null>>{const suffix=profileKeySuffix(profileId);const ownBackupKey=backupKeyForProfile(profileId);const keys=(await AsyncStorage.getAllKeys()).filter(key=>(key.startsWith('@awa')||key.startsWith('@hawa'))&&key!==BACKUP_KEY&&key!==ownBackupKey&&key.endsWith(suffix));const pairs=await Promise.all(keys.map(async key=>[key,await AsyncStorage.getItem(key)] as const));return Object.fromEntries(pairs)}
/** Same raw-data-portability shape as buildPortableDataJson(), scoped to
 * one managed profile's own keys only — see readAwaStorageForProfile(). */
export async function buildPortableDataJsonForProfile(profileId:string):Promise<string>{return JSON.stringify(await readAwaStorageForProfile(profileId),null,2)}
/** "Sauvegarder maintenant" for a managed profile — writes to HER OWN
 * dedicated backup key (backupKeyForProfile), never the owner's BACKUP_KEY,
 * so creating Hanane's backup can never overwrite the mother's (or Lina's). */
export async function backupNowForProfile(profileId:string):Promise<BackupSnapshot>{const entries=await readAwaStorageForProfile(profileId);const raw=JSON.stringify(entries);const snapshot:BackupSnapshot={createdAt:new Date().toISOString(),sizeBytes:new TextEncoder().encode(raw).length,entries,scope:'managed-profile',profileId,profileType:'daughter'};await AsyncStorage.setItem(backupKeyForProfile(profileId),JSON.stringify(snapshot));return snapshot}
export async function getBackupSnapshotForProfile(profileId:string):Promise<BackupSnapshot|undefined>{const raw=await AsyncStorage.getItem(backupKeyForProfile(profileId));if(!raw)return undefined;try{return JSON.parse(raw) as BackupSnapshot}catch{return undefined}}
/** Restoring a managed profile's own backup snapshot — every entry in it
 * already carries her own `:profile:<id>` suffix (by construction, see
 * backupNowForProfile above), so this re-filters by that same suffix as a
 * second, defense-in-depth guarantee before writing anything back; it can
 * never overwrite the mother's, or another daughter's, data. */
export async function restoreBackupForProfile(snapshot:BackupSnapshot,profileId:string):Promise<void>{const suffix=profileKeySuffix(profileId);const entries=Object.entries(snapshot.entries).filter(([key])=>key.endsWith(suffix));await Promise.all(entries.map(([key,value])=>value===null?AsyncStorage.removeItem(key):AsyncStorage.setItem(key,value)))}
/** "Supprimer les données de suivi de {firstName}" — clears ONLY the tracking
 * data this managed profile owns (cycle settings, period history, journal,
 * reminder preferences, ...), never the managed-profile RECORD itself (her
 * name/photo/creation info in managedProfilesStore.ts, deleted only via
 * "Gérer les profils" → swipe → Supprimer — a completely different, already
 * existing operation, deliberately left untouched here), never the mother's
 * data, never another daughter's, and never SETTINGS_KEY. */
export async function deleteTrackedDataForProfile(profileId:string):Promise<void>{const suffix=profileKeySuffix(profileId);const keys=(await AsyncStorage.getAllKeys()).filter(key=>(key.startsWith('@awa')||key.startsWith('@hawa'))&&key!==SETTINGS_KEY&&key.endsWith(suffix));await Promise.all(keys.map(key=>AsyncStorage.removeItem(key)))}
export async function loadBackupSettings():Promise<BackupSettings>{const raw=await AsyncStorage.getItem(SETTINGS_KEY);if(!raw)return {...DEFAULT_SETTINGS};try{return {...DEFAULT_SETTINGS,...JSON.parse(raw)}}catch{return {...DEFAULT_SETTINGS}}}
export async function saveBackupSettings(value:BackupSettings):Promise<void>{await AsyncStorage.setItem(SETTINGS_KEY,JSON.stringify(value))}
export function formatBytes(bytes:number):string{if(bytes<1024)return `${bytes} o`;if(bytes<1048576)return `${(bytes/1024).toFixed(1).replace('.',',')} Ko`;return `${(bytes/1048576).toFixed(1).replace('.',',')} Mo`}
