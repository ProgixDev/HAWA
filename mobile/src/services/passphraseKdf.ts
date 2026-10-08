import Aes from 'react-native-aes-crypto';
import {bytesToHex, hexToBytes, randomBytes} from '@noble/ciphers/utils.js';

// Turns a user-held backup passphrase into a 256-bit AES key. NOT a home-made KDF: PBKDF2-HMAC-SHA256 (RFC 8018,
// OWASP-recommended iteration count) computed by the platform's native implementation (react-native-aes-crypto →
// BouncyCastle on Android). A pure-JavaScript PBKDF2/scrypt/Argon2 at a safe cost would take minutes in Hermes, which
// is why a native module is used at all; the module's PBKDF2 is the only thing taken from it.
//
// The parameters travel inside every backup file (salt, iteration count), so the cost can be raised later without
// breaking old files. The salt is random per backup (16 bytes); the passphrase is never stored, logged or sent anywhere.
//
// DEVICE BENCHMARK: PBKDF2 at 600,000 iterations is the cost used by default. It has been verified against the RFC 6070 /
// RFC 7914 test vectors (see passphraseKdf.test.ts) but its wall-clock time on a Samsung Galaxy A13-class phone has NOT
// been measured here — that needs a build installed on a test device (see the Phase 9 report).

export const KDF_ALGORITHM = 'PBKDF2-HMAC-SHA256' as const;
export const DEFAULT_KDF_ITERATIONS = 600_000;
/** A file claiming fewer iterations than this is refused (it would not be a backup this app ever wrote). */
export const MIN_KDF_ITERATIONS = 100_000;
/** …and more than this is refused (it would freeze the phone: a hostile file must not be able to do that). */
export const MAX_KDF_ITERATIONS = 5_000_000;
export const KDF_SALT_BYTES = 16;
export const DERIVED_KEY_BYTES = 32;
export const MIN_PASSPHRASE_LENGTH = 10;

let iterationOverride: number | null = null;
/** Test-only: lets tests use a cheap iteration count (the production default is never lowered at runtime). */
export const __setKdfIterationsForTests = (iterations: number | null): void => {
  iterationOverride = iterations;
};
export const defaultKdfIterations = (): number => iterationOverride ?? DEFAULT_KDF_ITERATIONS;

/** Unicode-normalised (NFKC) so the same typed passphrase gives the same key on any keyboard / platform. Not trimmed:
 * every character the user typed counts. */
export const normalizePassphrase = (passphrase: string): string => passphrase.normalize('NFKC');

export type PassphraseCheck = {ok: true} | {ok: false; reason: 'too-short' | 'too-repetitive'};

/** A deliberately small rule set (length + not one repeated character): a long passphrase the user can remember beats
 * composition rules, and the real protection is the iteration count. */
export function checkPassphrase(passphrase: string): PassphraseCheck {
  const normalized = normalizePassphrase(passphrase);
  if ([...normalized].length < MIN_PASSPHRASE_LENGTH) {return {ok: false, reason: 'too-short'};}
  if (new Set([...normalized]).size < 4) {return {ok: false, reason: 'too-repetitive'};}
  return {ok: true};
}

export const randomSaltHex = (): string => bytesToHex(randomBytes(KDF_SALT_BYTES));

export async function derivePassphraseKey(passphrase: string, saltHex: string, iterations: number): Promise<Uint8Array> {
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > MAX_KDF_ITERATIONS) {
    throw new Error('invalid KDF cost');
  }
  // The native PBKDF2 takes the salt as text and uses its UTF-8 bytes; the hex string is the salt's canonical text form.
  const hex = await Aes.pbkdf2(normalizePassphrase(passphrase), saltHex, iterations, DERIVED_KEY_BYTES * 8, 'sha256');
  const key = hexToBytes(hex);
  if (key.length !== DERIVED_KEY_BYTES) {throw new Error('unexpected derived key length');}
  return key;
}
