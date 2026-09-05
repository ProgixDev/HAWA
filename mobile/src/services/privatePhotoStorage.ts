import {DocumentDirectoryPath, mkdir, readFile, unlink, writeFile} from '@dr.pogodin/react-native-fs';
import {decryptPhotoBytes, encryptPhotoBytes} from './privatePhotoEncryption';

// Durable, app-private local storage for "Photos privées" — see
// JournalPrivatePhotosScreen.tsx. Copies an image-picker URI (a gallery
// content:// grant or a camera FileProvider URI, both of which Android may
// reclaim at any time — confirmed by reading react-native-image-picker's own
// Android source, whose comment says its camera files live in
// `getCacheDir()`, "auto-cleaned according to android docs") into AWA's own
// persistent app storage (`DocumentDirectoryPath`, NOT the cache dir, NOT any
// public/shared location) so the photo survives ordinary app restarts.
//
// Every new/re-migrated file is now encrypted at rest with AES-256-GCM
// (privatePhotoEncryption.ts) — this is real encryption, not just app-private
// isolation. Uninstalling AWA or clearing its app data still removes these
// files, exactly like every other local-only AsyncStorage-backed feature.

const PRIVATE_PHOTOS_ROOT = `${DocumentDirectoryPath}/journal-private-photos`;
const PRIVATE_PHOTOS_ROOT_URI = `file://${PRIVATE_PHOTOS_ROOT}/`;

// Trailing marker appended to every newly-written (or re-migrated) photo
// file's name — added exclusively by copyPrivatePhotoToAppStorage() below
// and never appears on anything else this app writes, so it's a reliable,
// zero-ambiguity way to tell "new, encrypted" apart from "legacy, plaintext"
// among this app's own durable photo files. No separate metadata/db needed.
const ENCRYPTED_SUFFIX = '.awaenc';

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
  webp: 'image/webp',
  gif: 'image/gif',
};

// Never transcodes — only picks a sensible extension so the copied file
// keeps a recognizable format; the bytes themselves are copied (now
// encrypted) as-is.
const extensionFor = (mimeType?: string, fileName?: string): string => {
  const byMime = mimeType ? EXTENSION_BY_MIME[mimeType.toLowerCase()] : undefined;
  if (byMime) {return byMime;}
  const match = fileName?.match(/\.([a-zA-Z0-9]+)$/);
  if (match) {return match[1].toLowerCase();}
  return 'jpg';
};

const stripFileScheme = (uri: string): string => (uri.startsWith('file://') ? uri.slice('file://'.length) : uri);

// A fresh, unpredictable token appended to every destination filename below
// — guarantees a replacement (or a legacy re-migration) never reuses the
// currently-persisted file's exact path, even when the new photo resolves
// to the same extension as the one it's replacing. Same timestamp+random
// idiom already used elsewhere in this codebase (JournalPrivatePhotosScreen.tsx's
// newPhotoId(), privateSectionAuth.ts's randomSalt()) — no uuid dependency.
const newFileGeneration = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** True only for a URI this module itself wrote, identified by its app-private
 * directory prefix — since copyPrivatePhotoToAppStorage() is the only code
 * that ever writes into this directory, the prefix check alone is a reliable
 * ownership marker. Used to decide both "does this still need migrating?"
 * and "is it safe to delete this file?" — a gallery/content:// URI, or any
 * other app's file, can never match this prefix. */
export const isAppOwnedPrivatePhotoUri = (uri: string): boolean => uri.startsWith(PRIVATE_PHOTOS_ROOT_URI);

/** True only for a durable file this module has encrypted — see
 * ENCRYPTED_SUFFIX above. An app-owned URI that does NOT satisfy this is a
 * legacy plaintext file from before this feature existed. */
export const isEncryptedPrivatePhotoUri = (uri: string): boolean => uri.endsWith(ENCRYPTED_SUFFIX);

/** Recovers the original image mime type from an encrypted file's own name
 * (`<photoId>.<originalExt>.awaenc`) — the extension is deliberately kept in
 * the filename so a decrypted photo can be given a correct `data:` URI mime
 * prefix without any separate metadata store. Defaults to `image/jpeg` for
 * an unrecognized/missing extension, matching extensionFor()'s own default. */
function mimeTypeForEncryptedUri(uri: string): string {
  const withoutSuffix = uri.slice(0, -ENCRYPTED_SUFFIX.length);
  const match = withoutSuffix.match(/\.([a-zA-Z0-9]+)$/);
  const ext = match ? match[1].toLowerCase() : '';
  return MIME_BY_EXTENSION[ext] ?? 'image/jpeg';
}

/** Copies a picker-returned (or legacy raw/plaintext) URI into
 * `journal-private-photos/<date>/<photoId>-<generation>.<ext>.awaenc` under
 * AWA's app-private, non-cache storage, encrypting the bytes with AES-256-GCM
 * (privatePhotoEncryption.ts) on the way in — never leaves a plaintext copy
 * of a new or re-migrated photo. Returns the durable `file://` URI to
 * persist in its place. The logical `photoId` never changes across a
 * replacement, but the physical filename always includes a fresh
 * `newFileGeneration()` token, so this write can NEVER land on the same path
 * as the photo's currently-persisted file — even when replacing with an
 * image of the same extension. This is what guarantees the currently
 * persisted file is never touched/overwritten before the caller's
 * `saveJournalSection()` call commits the new URI (see
 * JournalPrivatePhotosScreen.tsx's save(), which only deletes the old
 * AWA-owned file — via deletePrivatePhotoFile() — after that commit
 * succeeds). `fileName` also falls back to `sourceUri` itself so a legacy
 * already-app-owned plaintext file (`.../<id>.png`) being re-migrated keeps
 * its real original extension/mime, not a default. Throws on failure
 * (unresolvable source, read/encrypt/write error, disk full, etc.) —
 * callers must catch per-photo so one failure can't affect the other
 * up-to-4 photos in the same save. */
export async function copyPrivatePhotoToAppStorage(sourceUri: string, date: string, photoId: string, mimeType?: string, fileName?: string): Promise<string> {
  const dayDirectory = `${PRIVATE_PHOTOS_ROOT}/${date}`;
  await mkdir(dayDirectory); // behaves like `mkdir -p` — safe to call every time
  const ext = extensionFor(mimeType, fileName ?? sourceUri);
  const destinationPath = `${dayDirectory}/${photoId}-${newFileGeneration()}.${ext}${ENCRYPTED_SUFFIX}`;
  const plaintextBase64 = await readFile(stripFileScheme(sourceUri), 'base64');
  const encryptedBase64 = await encryptPhotoBytes(plaintextBase64);
  await writeFile(destinationPath, encryptedBase64, 'base64');
  return `file://${destinationPath}`;
}

/** Decrypts an AWA-owned encrypted photo file into a displayable `data:`
 * URI — no plaintext temporary file is ever written to disk; the decrypted
 * bytes exist only in memory for as long as the resulting URI is held.
 * Throws on decryption failure (corrupted/tampered file, unsupported
 * version) — callers must catch this per-photo and show an honest failure
 * state, exactly like any other unavailable-photo case (see
 * JournalPrivatePhotosScreen.tsx's failedIds/"Photo indisponible" handling).
 * Never called for a legacy plaintext file — those render directly from
 * their own `file://` URI, unchanged. */
export async function readPrivatePhotoAsDataUri(uri: string): Promise<string> {
  const encryptedBase64 = await readFile(stripFileScheme(uri), 'base64');
  const plaintextBase64 = await decryptPhotoBytes(encryptedBase64);
  return `data:${mimeTypeForEncryptedUri(uri)};base64,${plaintextBase64}`;
}

/** Deletes an AWA-owned durable photo file. Silently refuses (no-op) for any
 * URI that isn't ours — the original Gallery/Photo-Picker source file must
 * never be touched. Also silently no-ops if the file is already gone (RNFS's
 * unlink() throws in that case), since by the time this runs the journal
 * metadata is already correctly saved — a missing/already-deleted file is
 * never treated as an error that could roll back or corrupt that state. */
export async function deletePrivatePhotoFile(uri: string): Promise<void> {
  if (!isAppOwnedPrivatePhotoUri(uri)) {return;}
  try {
    await unlink(stripFileScheme(uri));
  } catch {
    // Already absent, or a transient failure — logged, not surfaced, and
    // never blocks/undoes the journal save that already succeeded.
    console.warn('[privatePhotoStorage] Could not delete superseded file (non-fatal):', uri);
  }
}
