import {gcm} from '@noble/ciphers/aes.js';
import {bytesToHex, hexToBytes, randomBytes, utf8ToBytes, bytesToUtf8} from '@noble/ciphers/utils.js';
import {getOrCreateAesKey} from './secureAesKeyStore';
import {
  deleteJournalSection,
  getAllJournalEntries,
  saveJournalSection,
} from '../state/dailyJournalStore';
import type {DailyJournalEntry, EncryptedNotePayload} from '../types/journal';

// Local encryption at rest for "Notes personnelles" (JournalNoteScreen.tsx's
// `note` section, see dailyJournalStore.ts) — the "generic private notes"
// field named in TODO.md §1.19 as the last major still-plaintext sensitive
// field. Deliberately its own file/domain (own Keychain service, own
// envelope type) rather than reusing privateJournalEncryption.ts directly —
// same reasoning as privatePhotoEncryption.ts's own separate key: "a future
// rotation/wipe of one domain must never affect the other." Same cipher
// stack, same coexistence-with-legacy-plaintext strategy, same error
// handling discipline as that file — no second crypto implementation.

const ENCRYPTION_KEY_SERVICE = 'com.hawa.private.notes.encryption-key';
const CURRENT_VERSION = 1;

const safeErrorInfo = (error: unknown): string =>
  error instanceof Error ? `${error.name}: ${error.message}` : String(error);

export type NoteSection = {text: string; updatedAt: string};

async function getOrCreateEncryptionKey(): Promise<Uint8Array> {
  return getOrCreateAesKey(ENCRYPTION_KEY_SERVICE, 'notes-encryption-key');
}

/** Encrypts one day's "Notes personnelles" with AES-256-GCM — a fresh random
 * 12-byte nonce every call (never reused), authentication tag embedded in
 * the returned ciphertext by the cipher itself. */
export async function encryptNoteSection(data: NoteSection): Promise<EncryptedNotePayload> {
  const key = await getOrCreateEncryptionKey();
  const nonce = randomBytes(12);
  const plaintext = utf8ToBytes(JSON.stringify(data));
  const ciphertext = gcm(key, nonce).encrypt(plaintext);
  return {version: CURRENT_VERSION, iv: bytesToHex(nonce), ciphertext: bytesToHex(ciphertext)};
}

/** Decrypts a payload produced by encryptNoteSection(). Throws on an
 * unsupported version or on ciphertext/tag corruption — callers must catch
 * this and show an honest failure state (never crash, never display
 * garbage, never auto-delete the corrupted payload). */
export async function decryptNoteSection(payload: EncryptedNotePayload): Promise<NoteSection> {
  if (payload.version !== CURRENT_VERSION) {
    throw new Error(`Unsupported encryptedNote version: ${payload.version}`);
  }
  const key = await getOrCreateEncryptionKey();
  const nonce = hexToBytes(payload.iv);
  const ciphertext = hexToBytes(payload.ciphertext);
  const plaintext = gcm(key, nonce).decrypt(ciphertext);
  return JSON.parse(bytesToUtf8(plaintext)) as NoteSection;
}

export type ResolvedNoteSection = {data: NoteSection | undefined; corrupted: boolean};

/** Read-time resolution for a day's "Notes personnelles": prefers the
 * encrypted shape (decrypting it), falls back to the legacy plaintext `note`
 * field for entries saved before this existed, or reports `corrupted` if an
 * encrypted payload exists but can't be decrypted (never thrown to the
 * caller, never silently shown as blank/garbage). Never logs the decrypted
 * value. */
export async function resolveNoteSection(entry: DailyJournalEntry | undefined): Promise<ResolvedNoteSection> {
  if (entry?.encryptedNote) {
    try {
      return {data: await decryptNoteSection(entry.encryptedNote), corrupted: false};
    } catch {
      return {data: undefined, corrupted: true};
    }
  }
  if (entry?.note) {
    return {data: {text: entry.note.text, updatedAt: entry.note.updatedAt}, corrupted: false};
  }
  return {data: undefined, corrupted: false};
}

/** One-shot, idempotent, crash-safe migration for every day's note ever
 * saved before encryption-at-rest existed — called once at app boot
 * (App.tsx), same spirit as the other one-shot hydrate calls there.
 *
 * Per entry: encrypt the legacy plaintext `note`, persist it as
 * `encryptedNote`, and ONLY THEN delete the plaintext `note` field — so a
 * crash between those two steps just leaves that one entry not-yet-migrated
 * (both fields present) for the next boot to retry; it can never lose the
 * text. Entries that already have `encryptedNote` are skipped (idempotent).
 * A single entry's migration failure (e.g. Keychain briefly unavailable)
 * never aborts the sweep for the other entries, and never touches that
 * entry's plaintext. Never logs note content. */
export async function migrateLegacyPlainNotes(): Promise<void> {
  let entries: DailyJournalEntry[];
  try {
    entries = await getAllJournalEntries();
  } catch {
    return;
  }

  const pending = entries.filter(entry => entry.note && !entry.encryptedNote);

  for (const entry of pending) {
    const legacyNote = entry.note;
    if (!legacyNote) {
      continue;
    }
    // Sequential, not Promise.all: saveJournalSection/deleteJournalSection
    // each read-modify-write the whole entries array under one AsyncStorage
    // key, so concurrent calls across entries would race and clobber
    // each other.
    try {
      const encrypted = await encryptNoteSection({
        text: legacyNote.text,
        updatedAt: legacyNote.updatedAt,
      });
      await saveJournalSection(entry.date, 'encryptedNote', encrypted);
      await deleteJournalSection(entry.date, 'note');
    } catch (error) {
      if (__DEV__) {
        console.warn('[privateNotesEncryption] migration failed for one date, will retry next launch:', safeErrorInfo(error));
      }
    }
  }
}
