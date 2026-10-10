import AsyncStorage from '@react-native-async-storage/async-storage';
import {gcm} from '@noble/ciphers/aes.js';
import {bytesToHex, hexToBytes, randomBytes, utf8ToBytes} from '@noble/ciphers/utils.js';

import {decodeUtf8} from '../utils/utf8';
import {getManagedProfiles, hydrateManagedProfiles} from '../state/managedProfilesStore';
import {DELETED_MANAGED_PROFILES_STORAGE_KEY, parseDeletedManagedProfileIds} from '../state/deletedManagedProfiles';
import {encryptFieldValue} from './atRestFieldEncryption';
import {peekAesKey} from './secureAesKeyStore';
import {readAwaStorage, readAwaStorageForProfile, planRestore, type BackupSnapshot} from './backupService';
import {applyWritesWithJournal} from './restoreJournal';
import {clearStructuredCache, isStructuredBase, isStructuredEncryptionEnabled} from './secureAsyncStorage';
import {StructuredDataError, decryptStructured, encryptStructured, isStructuredEnvelope} from './structuredEncryption';
import {
  DERIVED_KEY_BYTES,
  KDF_ALGORITHM,
  MAX_KDF_ITERATIONS,
  MIN_KDF_ITERATIONS,
  checkPassphrase,
  defaultKdfIterations,
  derivePassphraseKey,
  randomSaltHex,
} from './passphraseKdf';

// PORTABLE backup: a single file the user can keep anywhere and restore on ANOTHER phone, protected only by a passphrase
// the user holds. It is deliberately a different thing from the local backup slot (backupService.ts), which is
// device-bound.
//
// WHY the contents are decrypted first. Everything on the phone is encrypted with keys that live in THIS phone's
// Keystore and can never leave it. Copying the stored ciphertext into a backup would produce a file no other device can
// open. So the export pipeline, in memory only:
//   1. reads each stored value;
//   2. decrypts the structured-data envelope (structuredEncryption.ts) and every field-level envelope inside it
//      (notes, intimacy, medical notes… — each under the device key of its own domain);
//   3. seals the whole payload ONCE with AES-256-GCM under a key derived from the passphrase.
// Restoring does the reverse on the destination phone: authenticate + decrypt with the passphrase, validate, then
// re-encrypt every record under that phone's OWN fresh keys. No device key is ever written into a backup, no plaintext
// touches a file or a log, and a wrong passphrase / damaged file is rejected BEFORE anything on the phone is changed.
//
// Not included: private photos (encrypted files on disk, referenced only by path in the journal) — they are outside every
// AsyncStorage backup today and are NOT portable; this is stated to the user.
//
// File: JSON with a clear-text header {format, version, kdf:{alg,iter,salt}, cipher:{alg}, createdAt, scope} and the
// sealed payload {n, c}. The header is bound into the GCM tag as associated data, so changing the iteration count, the
// salt or the scope invalidates the file.

export const PORTABLE_BACKUP_FORMAT = 'awa-portable-backup' as const;
export const PORTABLE_BACKUP_VERSION = 1 as const;
export const PORTABLE_BACKUP_EXTENSION = 'awabackup';

export type PortableBackupScope = {kind: 'owner'} | {kind: 'managed-profile'; profileId: string};

export type PortableBackupErrorCode =
  | 'weak-passphrase'
  | 'unreadable-data' // some stored records cannot be decrypted on this phone: an incomplete backup is never produced silently
  | 'not-a-backup'
  | 'unsupported-version'
  | 'wrong-passphrase-or-corrupted'
  | 'invalid-contents'
  | 'profile-missing'
  | 'storage-failed';

export class PortableBackupError extends Error {
  readonly code: PortableBackupErrorCode;
  /** Storage keys that could not be exported (unreadable-data only) — keys, never values. */
  readonly keys: string[];
  constructor(code: PortableBackupErrorCode, keys: string[] = []) {
    super(`portable backup: ${code}`);
    this.name = 'PortableBackupError';
    this.code = code;
    this.keys = keys;
  }
}

type Header = {
  format: typeof PORTABLE_BACKUP_FORMAT;
  version: typeof PORTABLE_BACKUP_VERSION;
  createdAt: string;
  scope: PortableBackupScope;
  kdf: {alg: typeof KDF_ALGORITHM; iter: number; salt: string};
  cipher: {alg: 'AES-256-GCM'};
};
type FileShape = Header & {n: string; c: string};
type Payload = {version: 1; createdAt: string; scope: PortableBackupScope; entries: Record<string, string | null>};

const headerAad = (header: Header): Uint8Array =>
  utf8ToBytes(
    [header.format, header.version, header.createdAt, JSON.stringify(header.scope), header.kdf.alg, header.kdf.iter, header.kdf.salt, header.cipher.alg].join('|'),
  );

// ------------------------------------------------------------------------------------------------------------------
// Field-level (legacy) envelopes: {version:1, iv, ciphertext} written by atRestFieldEncryption / notes / intimacy.
// ------------------------------------------------------------------------------------------------------------------

const FIELD_ENCRYPTION_SERVICES: readonly string[] = [
  'com.hawa.private.notes.encryption-key',
  'com.hawa.private.intimacy.encryption-key',
  'com.hawa.private.daily-journal.encryption-key',
  'com.hawa.private.contraception-journal.encryption-key',
  'com.hawa.private.general-health.encryption-key',
  'com.hawa.private.irregular-journal.encryption-key',
  'com.hawa.private.menopause-journal.encryption-key',
  'com.hawa.private.miscarriage-journal.encryption-key',
  'com.hawa.private.personal-information.encryption-key',
  'com.hawa.private.postpartum-journal.encryption-key',
  'com.hawa.private.postpartum-lochia.encryption-key',
  'com.hawa.private.pregnancy-custom-reminders.encryption-key',
  'com.hawa.private.pregnancy-health-reminders.encryption-key',
  'com.hawa.private.pregnancy-journal.encryption-key',
  'com.hawa.private.pregnancy-medical-events.encryption-key',
];

const PLAIN_FIELD_MARK = '$awaPlain';

type FieldEnvelope = {version: 1; iv: string; ciphertext: string};
const isFieldEnvelope = (value: unknown): value is FieldEnvelope => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {return false;}
  const candidate = value as Record<string, unknown>;
  return candidate.version === 1 && typeof candidate.iv === 'string' && /^[0-9a-f]{24}$/i.test(candidate.iv) && typeof candidate.ciphertext === 'string' && /^[0-9a-f]+$/i.test(candidate.ciphertext);
};
type PlainField = {[PLAIN_FIELD_MARK]: true; s: string; v: unknown};
const isPlainField = (value: unknown): value is PlainField =>
  !!value && typeof value === 'object' && (value as Record<string, unknown>)[PLAIN_FIELD_MARK] === true && typeof (value as Record<string, unknown>).s === 'string';

/** Tries each field-encryption domain's EXISTING key (never creates one); the GCM tag says which one is right. */
async function decryptFieldEnvelope(envelope: FieldEnvelope): Promise<PlainField | null> {
  for (const service of FIELD_ENCRYPTION_SERVICES) {
    const key = await peekAesKey(service);
    if (!key) {continue;}
    try {
      const plaintext = gcm(key, hexToBytes(envelope.iv)).decrypt(hexToBytes(envelope.ciphertext));
      return {[PLAIN_FIELD_MARK]: true, s: service, v: JSON.parse(decodeUtf8(plaintext))};
    } catch {
      // not this domain's key
    }
  }
  return null;
}

/** Walks parsed JSON replacing every field envelope by its plaintext form. Returns false if one cannot be opened. */
async function openFields(node: unknown, unreadable: {count: number}): Promise<unknown> {
  if (Array.isArray(node)) {
    const out: unknown[] = [];
    for (const item of node) {out.push(await openFields(item, unreadable));}
    return out;
  }
  if (node && typeof node === 'object') {
    if (isFieldEnvelope(node)) {
      const opened = await decryptFieldEnvelope(node);
      if (!opened) {unreadable.count += 1;}
      return opened ?? node;
    }
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {out[key] = await openFields(value, unreadable);}
    return out;
  }
  return node;
}

/** The reverse, on the destination phone: every plaintext field is sealed under THAT phone's key for its domain. */
async function sealFields(node: unknown): Promise<unknown> {
  if (Array.isArray(node)) {
    const out: unknown[] = [];
    for (const item of node) {out.push(await sealFields(item));}
    return out;
  }
  if (node && typeof node === 'object') {
    if (isPlainField(node)) {
      if (!FIELD_ENCRYPTION_SERVICES.includes(node.s)) {throw new PortableBackupError('invalid-contents');}
      return encryptFieldValue(node.s, node.v);
    }
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {out[key] = await sealFields(value);}
    return out;
  }
  return node;
}

const looksLikeJsonContainer = (value: string): boolean => {
  const first = value.trimStart()[0];
  return first === '{' || first === '[';
};

async function toPortableValue(key: string, raw: string): Promise<string> {
  let plain = raw;
  if (isStructuredEnvelope(raw)) {plain = await decryptStructured(key, raw);}
  if (!looksLikeJsonContainer(plain)) {return plain;}
  let parsed: unknown;
  try {
    parsed = JSON.parse(plain);
  } catch {
    return plain; // not JSON: carried as it is
  }
  const unreadable = {count: 0};
  const opened = await openFields(parsed, unreadable);
  if (unreadable.count > 0) {throw new StructuredDataError('authentication-failed');}
  return JSON.stringify(opened);
}

async function fromPortableValue(key: string, value: string): Promise<string> {
  let result = value;
  if (looksLikeJsonContainer(value)) {
    let parsed: unknown;
    let isJson = true;
    try {
      parsed = JSON.parse(value);
    } catch {
      isJson = false; // looks like JSON but is a plain string — kept exactly as written
    }
    if (isJson) {
      try {
        result = JSON.stringify(await sealFields(parsed));
      } catch (error) {
        if (error instanceof PortableBackupError) {throw error;}
        // Sealing the private fields failed (e.g. the key store errored). Writing the value unsealed would leave
        // "$awaPlain" markers in the stores' data — abort the whole restore instead (nothing has been written yet).
        throw new PortableBackupError('storage-failed');
      }
    }
  }
  // Records the destination app keeps encrypted are sealed under its own structured-data key, bound to the storage key.
  return isStructuredEncryptionEnabled() && isStructuredBase(key) ? encryptStructured(key, result) : result;
}

// ------------------------------------------------------------------------------------------------------------------
// Create
// ------------------------------------------------------------------------------------------------------------------

export type CreatedPortableBackup = {fileName: string; contents: string; createdAt: string; recordCount: number};

export async function createPortableBackup(options: {passphrase: string; scope: PortableBackupScope; now?: Date}): Promise<CreatedPortableBackup> {
  if (!checkPassphrase(options.passphrase).ok) {throw new PortableBackupError('weak-passphrase');}
  const raw = options.scope.kind === 'owner' ? await readAwaStorage() : await readAwaStorageForProfile(options.scope.profileId);

  const entries: Record<string, string | null> = {};
  const unreadable: string[] = [];
  for (const [key, value] of Object.entries(raw)) {
    if (value === null) {
      entries[key] = null;
      continue;
    }
    try {
      entries[key] = await toPortableValue(key, value);
    } catch {
      unreadable.push(key); // collected — a backup missing records must never be produced without the user knowing
    }
  }
  if (unreadable.length > 0) {throw new PortableBackupError('unreadable-data', unreadable.sort());}

  const createdAt = (options.now ?? new Date()).toISOString();
  const header: Header = {
    format: PORTABLE_BACKUP_FORMAT,
    version: PORTABLE_BACKUP_VERSION,
    createdAt,
    scope: options.scope,
    kdf: {alg: KDF_ALGORITHM, iter: defaultKdfIterations(), salt: randomSaltHex()},
    cipher: {alg: 'AES-256-GCM'},
  };
  const payload: Payload = {version: 1, createdAt, scope: options.scope, entries};
  const key = await derivePassphraseKey(options.passphrase, header.kdf.salt, header.kdf.iter);
  const nonce = randomBytes(12);
  const sealed = gcm(key, nonce, headerAad(header)).encrypt(utf8ToBytes(JSON.stringify(payload)));
  const file: FileShape = {...header, n: bytesToHex(nonce), c: bytesToHex(sealed)};

  const stamp = createdAt.slice(0, 16).replace(/[-:T]/g, '');
  return {fileName: `awa-backup-${stamp}.${PORTABLE_BACKUP_EXTENSION}`, contents: JSON.stringify(file), createdAt, recordCount: Object.keys(entries).length};
}

// ------------------------------------------------------------------------------------------------------------------
// Inspect + restore
// ------------------------------------------------------------------------------------------------------------------

const isHex = (value: unknown, length?: number): value is string =>
  typeof value === 'string' && /^[0-9a-f]*$/i.test(value) && (length === undefined || value.length === length);

function parseFile(contents: string): FileShape {
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new PortableBackupError('not-a-backup');
  }
  const file = parsed as Partial<FileShape> | null;
  if (!file || typeof file !== 'object' || file.format !== PORTABLE_BACKUP_FORMAT) {throw new PortableBackupError('not-a-backup');}
  if (file.version !== PORTABLE_BACKUP_VERSION) {throw new PortableBackupError('unsupported-version');}
  const scopeOk =
    !!file.scope && (file.scope.kind === 'owner' || (file.scope.kind === 'managed-profile' && typeof (file.scope as {profileId?: unknown}).profileId === 'string'));
  if (
    typeof file.createdAt !== 'string' || !scopeOk || !file.kdf || file.kdf.alg !== KDF_ALGORITHM || !isHex(file.kdf.salt, 32) ||
    typeof file.kdf.iter !== 'number' || file.kdf.iter < MIN_KDF_ITERATIONS || file.kdf.iter > MAX_KDF_ITERATIONS ||
    !file.cipher || file.cipher.alg !== 'AES-256-GCM' || !isHex(file.n, 24) || !isHex(file.c) || (file.c as string).length < 32
  ) {
    throw new PortableBackupError('invalid-contents');
  }
  return file as FileShape;
}

export type PortableBackupInfo = {createdAt: string; scope: PortableBackupScope; version: number};
/** Reads the clear-text header only (no passphrase needed) so the screen can say what file the user picked. */
export function inspectPortableBackup(contents: string): PortableBackupInfo {
  const file = parseFile(contents);
  return {createdAt: file.createdAt, scope: file.scope, version: file.version};
}

function parsePayload(decrypted: string, file: FileShape): Payload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(decrypted);
  } catch {
    throw new PortableBackupError('invalid-contents');
  }
  const payload = parsed as Partial<Payload> | null;
  if (
    !payload || payload.version !== 1 || !payload.entries || typeof payload.entries !== 'object' ||
    JSON.stringify(payload.scope) !== JSON.stringify(file.scope) // the authenticated payload must agree with the header
  ) {
    throw new PortableBackupError('invalid-contents');
  }
  for (const [key, value] of Object.entries(payload.entries)) {
    if (!(typeof key === 'string' && (value === null || typeof value === 'string'))) {throw new PortableBackupError('invalid-contents');}
  }
  return payload as Payload;
}

export type RestoredPortableBackup = {restoredRecords: number; scope: PortableBackupScope};

/**
 * Restores a portable backup. EVERYTHING that can fail — format, passphrase, authentication, schema, profile ownership,
 * re-encryption under this phone's keys — happens before the first write; only then are the writes applied through the
 * restore journal (all-or-nothing across a restart). A wrong passphrase or a damaged file changes nothing.
 */
export async function restorePortableBackup(options: {contents: string; passphrase: string}): Promise<RestoredPortableBackup> {
  const file = parseFile(options.contents);

  let decrypted: string;
  try {
    const key = await derivePassphraseKey(options.passphrase, file.kdf.salt, file.kdf.iter);
    if (key.length !== DERIVED_KEY_BYTES) {throw new Error('key');}
    const header: Header = {format: file.format, version: file.version, createdAt: file.createdAt, scope: file.scope, kdf: file.kdf, cipher: file.cipher};
    decrypted = decodeUtf8(gcm(key, hexToBytes(file.n), headerAad(header)).decrypt(hexToBytes(file.c)));
  } catch {
    throw new PortableBackupError('wrong-passphrase-or-corrupted');
  }
  const payload = parsePayload(decrypted, file);

  const deleted = parseDeletedManagedProfileIds(await AsyncStorage.getItem(DELETED_MANAGED_PROFILES_STORAGE_KEY));
  if (file.scope.kind === 'managed-profile') {
    const profiles = await hydrateManagedProfiles().catch(() => getManagedProfiles());
    if (!profiles.some(profile => profile.id === (file.scope as {profileId: string}).profileId)) {
      throw new PortableBackupError('profile-missing'); // her record is not on this phone: restore the owner's backup first
    }
  }
  const snapshot: BackupSnapshot = {createdAt: payload.createdAt, sizeBytes: 0, entries: payload.entries};
  const plan = planRestore(snapshot, deleted, file.scope.kind === 'managed-profile' ? {profileId: file.scope.profileId} : undefined);

  const writes = [];
  try {
    for (const {key, value} of plan) {
      writes.push({key, value: value === null ? null : await fromPortableValue(key, value)});
    }
  } catch (error) {
    if (error instanceof PortableBackupError) {throw error;}
    throw new PortableBackupError('storage-failed');
  }

  try {
    await applyWritesWithJournal(writes);
  } catch {
    throw new PortableBackupError('storage-failed');
  }
  clearStructuredCache();
  return {restoredRecords: writes.length, scope: file.scope};
}
