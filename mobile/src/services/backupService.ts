import AsyncStorage from '@react-native-async-storage/async-storage';

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
export type BackupSnapshot = {createdAt: string; sizeBytes: number; entries: Record<string,string|null>};
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
export async function loadBackupSettings():Promise<BackupSettings>{const raw=await AsyncStorage.getItem(SETTINGS_KEY);if(!raw)return {...DEFAULT_SETTINGS};try{return {...DEFAULT_SETTINGS,...JSON.parse(raw)}}catch{return {...DEFAULT_SETTINGS}}}
export async function saveBackupSettings(value:BackupSettings):Promise<void>{await AsyncStorage.setItem(SETTINGS_KEY,JSON.stringify(value))}
export function formatBytes(bytes:number):string{if(bytes<1024)return `${bytes} o`;if(bytes<1048576)return `${(bytes/1024).toFixed(1).replace('.',',')} Ko`;return `${(bytes/1048576).toFixed(1).replace('.',',')} Mo`}
