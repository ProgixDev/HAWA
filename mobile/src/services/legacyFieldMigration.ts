import secureAsyncStorage from './secureAsyncStorage';
import {decryptFieldValue, encryptFieldValue} from './atRestFieldEncryption';

// Shared, interruption-safe engine behind the "legacy plaintext note -> field-level ciphertext" boot migrations
// (migrateLegacyPlain*Notes). The old per-store versions read the record, hydrated the store's memoised in-memory
// state and re-persisted THAT state: a failed/partial hydration (defaults in memory) could therefore be written over
// the real record, and a field that could not be decrypted was silently dropped by the re-persist.
//
// This engine never goes through a store's memoised state. It works on the PERSISTED record only:
//   1. read the record (a failed/unavailable read -> 'skipped', nothing written);
//   2. `build` returns the next JSON value with every legacy plaintext field sealed, leaving every other value
//      (including already-encrypted fields and fields it cannot interpret) byte-for-byte as it was, or null when
//      there is nothing to migrate;
//   3. re-read: if the record changed meanwhile (a user save), abort and let the next launch retry;
//   4. write the new record in ONE setItem (atomic: the old or the new record exists, never a mix), read it back and
//      verify it. A mismatch restores the original text.
// It is idempotent (a migrated record has no plaintext field left, so `build` returns null) and never throws.

export type MigrationOutcome = 'migrated' | 'nothing' | 'skipped';

/** Encrypts `value` for `service` and proves it round-trips before it is allowed to replace the plaintext. */
export async function sealField(service: string, value: string): Promise<unknown> {
  const payload = await encryptFieldValue(service, value);
  const back = await decryptFieldValue<string>(service, payload as never);
  if (back !== value) {throw new Error('field encryption round-trip mismatch');}
  return payload;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

export type Seal = (value: string) => Promise<unknown>;

/**
 * Seals every string-valued field named in `fields` of ONE entry object. `emptyPolicy` 'drop' deletes an empty string
 * (what the journal writers do) and counts it as legacy; 'keep' leaves it untouched and does not count it as legacy.
 */
export async function sealEntryFields(
  entry: Record<string, unknown>,
  fields: readonly string[],
  seal: Seal,
  emptyPolicy: 'drop' | 'keep',
): Promise<{value: Record<string, unknown>; changed: boolean}> {
  const value: Record<string, unknown> = {...entry};
  let changed = false;
  for (const field of fields) {
    const current = entry[field];
    if (typeof current !== 'string') {continue;}
    if (current.length === 0) {
      if (emptyPolicy === 'drop') {
        delete value[field];
        changed = true;
      }
      continue;
    }
    value[field] = await seal(current);
    changed = true;
  }
  return {value, changed};
}

/** For a record shaped {[date]: entry}. Returns null when no entry holds a legacy plaintext field. */
export async function sealMapFields(
  parsed: unknown,
  fields: readonly string[],
  seal: Seal,
  emptyPolicy: 'drop' | 'keep' = 'drop',
): Promise<Record<string, unknown> | null> {
  if (!isRecord(parsed)) {return null;}
  let changed = false;
  const next: Record<string, unknown> = {};
  for (const [date, entry] of Object.entries(parsed)) {
    if (!isRecord(entry)) {
      next[date] = entry;
      continue;
    }
    const sealed = await sealEntryFields(entry, fields, seal, emptyPolicy);
    changed = changed || sealed.changed;
    next[date] = sealed.value;
  }
  return changed ? next : null;
}

/** For a record shaped [entry, entry, ...]. Returns null when no entry holds a legacy plaintext field. */
export async function sealArrayFields(
  parsed: unknown,
  fields: readonly string[],
  seal: Seal,
  emptyPolicy: 'drop' | 'keep' = 'keep',
): Promise<unknown[] | null> {
  if (!Array.isArray(parsed)) {return null;}
  let changed = false;
  const next: unknown[] = [];
  for (const entry of parsed) {
    if (!isRecord(entry)) {
      next.push(entry);
      continue;
    }
    const sealed = await sealEntryFields(entry, fields, seal, emptyPolicy);
    changed = changed || sealed.changed;
    next.push(sealed.value);
  }
  return changed ? next : null;
}

export async function migrateRecordSafely(
  key: string,
  build: (parsed: unknown) => Promise<unknown | null>,
): Promise<MigrationOutcome> {
  try {
    const raw = await secureAsyncStorage.getItem(key);
    if (!raw) {return 'nothing';}
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return 'skipped'; // not ours to interpret
    }
    const next = await build(parsed);
    if (next === null) {return 'nothing';}
    const serialized = JSON.stringify(next);

    if ((await secureAsyncStorage.getItem(key)) !== raw) {return 'skipped';} // changed meanwhile: retry next launch
    await secureAsyncStorage.setItem(key, serialized);

    const written = await secureAsyncStorage.getItem(key);
    if (written !== serialized) {
      try {
        await secureAsyncStorage.setItem(key, raw);
      } catch {
        // best effort: the previous write already replaced a record we could read, nothing more to protect
      }
      return 'skipped';
    }
    return 'migrated';
  } catch {
    return 'skipped'; // unavailable record, locked Keystore, I/O error: nothing was written, next launch retries
  }
}
