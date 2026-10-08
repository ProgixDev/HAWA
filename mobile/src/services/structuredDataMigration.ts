import AsyncStorage from '@react-native-async-storage/async-storage';

import {MIGRATION_STATE_PREFIX} from './storageKeyClassifier';
import {isStructuredBase, isStructuredEncryptionEnabled, withKeyLock} from './secureAsyncStorage';
import {StructuredDataError, decryptStructured, encryptStructured, isStructuredEnvelope} from './structuredEncryption';

// Rewrites legacy PLAINTEXT structured records as encrypted envelopes — without ever being able to lose or
// resurrect data. AsyncStorage has no transactions, so safety comes from the ORDER of steps and from a persisted
// phase that lets a restart finish or abandon exactly the step that was interrupted.
//
// Per record (all steps under the record's key lock, so a normal edit, a restore or a profile deletion cannot
// interleave with the commit):
//
//   1. read       the stored value P. Missing  -> nothing to migrate: NEVER create a record (no resurrection).
//                 Already an envelope -> verify it decrypts, record "done".
//   2. encrypt    P -> E (fresh nonce, bound to this storage key).
//   3. stage      write E to a TEMP key (an encrypted, verified recovery copy of the data).
//   4. verify     read the temp key back, decrypt, compare with P. Mismatch -> drop the temp key, leave P alone.
//   5. mark       persist phase "committing" for this key.
//   6. re-check   re-read the real key: if it is no longer exactly P (the user edited it meanwhile) -> abandon this
//                 attempt, the newer value is migrated on the next run (the edit already wrote an envelope anyway).
//   7. commit     write E over the real key.
//   8. verify     read the real key back, decrypt, compare with P. Mismatch -> put P back (still in memory).
//   9. finish     persist phase "done", remove the temp key.
//
// A process killed between any two steps is handled by recoverStructuredMigration() (phase + what is on disk decide):
//   - real key is a verified envelope  -> finish (done);
//   - real key still plaintext         -> nothing was lost, retry later;
//   - real key gone                    -> the data was deleted on purpose: drop the temp copy, do NOT recreate it;
//   - real key an unreadable envelope  -> mark failed and keep everything, report it.
// The plaintext is only ever overwritten by an envelope that was already verified to decrypt to it, and the verified
// temp copy stays until the real record has been verified too. A failure NEVER deletes the original and is NEVER
// treated as "empty".

const STATE_KEY = `${MIGRATION_STATE_PREFIX}state/v1`;
const TEMP_PREFIX = `${MIGRATION_STATE_PREFIX}tmp/`;
const tempKeyFor = (key: string): string => `${TEMP_PREFIX}${key}`;

export type MigrationPhase = 'committing' | 'done' | 'failed';
type KeyState = {phase: MigrationPhase; attempts: number; updatedAt: string; reason?: string};
type StateMap = {version: 1; keys: Record<string, KeyState>};

export type MigrationStep =
  | 'after-stage'
  | 'after-verify-stage'
  | 'after-mark-committing'
  | 'after-recheck'
  | 'after-commit'
  | 'after-verify-commit'
  | null;
let injectedFault: MigrationStep = null;
/** Test hook: simulate the process being killed right after `step` (the thrown error plays the kill). */
export const __setMigrationFaultForTests = (step: MigrationStep): void => {
  injectedFault = step;
};
const KILL_MESSAGE = 'simulated process kill';
const killPoint = (step: Exclude<MigrationStep, null>): void => {
  if (injectedFault === step) {
    injectedFault = null;
    throw new Error(`${KILL_MESSAGE}: ${step}`);
  }
};
const isKill = (error: unknown): boolean => error instanceof Error && error.message.startsWith(KILL_MESSAGE);

// ---- persisted state (one small JSON record; a damaged one is simply rebuilt from what is on disk) -----------------

let stateWrite: Promise<unknown> = Promise.resolve();

const readState = async (): Promise<StateMap> => {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StateMap>;
      if (parsed && parsed.version === 1 && parsed.keys && typeof parsed.keys === 'object') {return parsed as StateMap;}
    }
  } catch {
    // damaged state: rebuilt below — the data itself is the source of truth, never this marker
  }
  return {version: 1, keys: {}};
};

const updateState = (mutate: (state: StateMap) => void): Promise<void> => {
  const run = stateWrite.then(async () => {
    const state = await readState();
    mutate(state);
    await AsyncStorage.setItem(STATE_KEY, JSON.stringify(state));
  });
  stateWrite = run.catch(() => undefined);
  return run;
};

const setPhase = (key: string, phase: MigrationPhase, reason?: string): Promise<void> =>
  updateState(state => {
    const previous = state.keys[key];
    state.keys[key] = {phase, attempts: (previous?.attempts ?? 0) + (phase === 'committing' ? 1 : 0), updatedAt: new Date().toISOString(), ...(reason ? {reason} : {})};
  });

const clearPhase = (key: string): Promise<void> =>
  updateState(state => {
    delete state.keys[key];
  });

// ---- the migration of ONE record -------------------------------------------------------------------------------------

export type MigrationOutcome = 'migrated' | 'already-encrypted' | 'absent' | 'raced' | 'failed' | 'skipped';

async function migrateOneLocked(key: string): Promise<MigrationOutcome> {
  const original = await AsyncStorage.getItem(key);
  if (original === null) {
    await AsyncStorage.removeItem(tempKeyFor(key));
    await clearPhase(key);
    return 'absent';
  }
  if (isStructuredEnvelope(original)) {
    try {
      await decryptStructured(key, original);
    } catch (error) {
      await setPhase(key, 'failed', error instanceof StructuredDataError ? error.reason : 'authentication-failed');
      return 'failed';
    }
    await AsyncStorage.removeItem(tempKeyFor(key));
    await setPhase(key, 'done');
    return 'already-encrypted';
  }

  let envelope: string;
  try {
    envelope = await encryptStructured(key, original);
  } catch (error) {
    await setPhase(key, 'failed', error instanceof StructuredDataError ? error.reason : 'encrypt-failed');
    return 'failed';
  }

  const tempKey = tempKeyFor(key);
  await AsyncStorage.setItem(tempKey, envelope);
  killPoint('after-stage');
  let stagedOk = false;
  try {
    stagedOk = (await AsyncStorage.getItem(tempKey)) === envelope && (await decryptStructured(key, envelope)) === original;
  } catch {
    stagedOk = false;
  }
  if (!stagedOk) {
    await AsyncStorage.removeItem(tempKey);
    await setPhase(key, 'failed', 'staged-copy-mismatch');
    return 'failed';
  }
  killPoint('after-verify-stage');

  await setPhase(key, 'committing');
  killPoint('after-mark-committing');

  if ((await AsyncStorage.getItem(key)) !== original) {
    await AsyncStorage.removeItem(tempKey);
    await clearPhase(key);
    return 'raced';
  }
  killPoint('after-recheck');

  await AsyncStorage.setItem(key, envelope);
  killPoint('after-commit');

  let committedOk = false;
  try {
    const stored = await AsyncStorage.getItem(key);
    committedOk = stored === envelope && (await decryptStructured(key, stored)) === original;
  } catch {
    committedOk = false;
  }
  if (!committedOk) {
    await AsyncStorage.setItem(key, original); // the original is still in memory: put it back
    await AsyncStorage.removeItem(tempKey);
    await setPhase(key, 'failed', 'commit-verification-failed');
    return 'failed';
  }
  killPoint('after-verify-commit');

  await setPhase(key, 'done');
  await AsyncStorage.removeItem(tempKey);
  return 'migrated';
}

export function migrateStructuredKey(key: string): Promise<MigrationOutcome> {
  if (!isStructuredEncryptionEnabled() || !isStructuredBase(key)) {return Promise.resolve('skipped');}
  return withKeyLock(key, async () => {
    try {
      return await migrateOneLocked(key);
    } catch (error) {
      if (isKill(error)) {throw error;} // a "killed" process does no cleanup
      await setPhase(key, 'failed', 'unexpected-error').catch(() => undefined);
      return 'failed';
    }
  });
}

// ---- recovery after an interruption ----------------------------------------------------------------------------------

export type RecoveryReport = {finished: string[]; retryLater: string[]; dropped: string[]; failed: string[]};

/**
 * Settles every record that was left mid-migration. Safe to run at every launch, before migrating. Never writes
 * anything but a verified envelope over a verified plaintext it already holds, and never recreates a missing record.
 */
export async function recoverStructuredMigration(): Promise<RecoveryReport> {
  const report: RecoveryReport = {finished: [], retryLater: [], dropped: [], failed: []};
  const state = await readState();
  const allKeys = await AsyncStorage.getAllKeys();
  const tempKeys = allKeys.filter(key => key.startsWith(TEMP_PREFIX));
  const toCheck = new Set<string>([
    ...Object.entries(state.keys).filter(([, value]) => value.phase === 'committing').map(([key]) => key),
    ...tempKeys.map(key => key.slice(TEMP_PREFIX.length)),
  ]);

  for (const key of toCheck) {
    await withKeyLock(key, async () => {
      const real = await AsyncStorage.getItem(key);
      const tempKey = tempKeyFor(key);
      if (real === null) {
        await AsyncStorage.removeItem(tempKey);
        await clearPhase(key);
        report.dropped.push(key);
        return;
      }
      if (isStructuredEnvelope(real)) {
        try {
          await decryptStructured(key, real);
          await AsyncStorage.removeItem(tempKey);
          await setPhase(key, 'done');
          report.finished.push(key);
        } catch (error) {
          await setPhase(key, 'failed', error instanceof StructuredDataError ? error.reason : 'authentication-failed');
          report.failed.push(key); // kept as-is: neither the record nor the temp copy is touched
        }
        return;
      }
      await AsyncStorage.removeItem(tempKey);
      await clearPhase(key);
      report.retryLater.push(key);
    });
  }
  return report;
}

// ---- running the migration -------------------------------------------------------------------------------------------

export type MigrationSummary = {
  migrated: number;
  alreadyEncrypted: number;
  raced: number;
  failed: string[];
  recovery: RecoveryReport;
};

let running: Promise<MigrationSummary> | null = null;

/**
 * Migrates every legacy plaintext structured record (owner and managed profiles), one record at a time, yielding to the
 * app between records. Re-entrant calls share the run already in progress. Never throws for a data problem — failures
 * are listed in the summary and the originals stay untouched.
 */
export function runStructuredMigration(): Promise<MigrationSummary> {
  if (running) {return running;}
  running = (async () => {
    const summary: MigrationSummary = {migrated: 0, alreadyEncrypted: 0, raced: 0, failed: [], recovery: {finished: [], retryLater: [], dropped: [], failed: []}};
    if (!isStructuredEncryptionEnabled()) {return summary;}
    summary.recovery = await recoverStructuredMigration();
    const keys = (await AsyncStorage.getAllKeys()).filter(isStructuredBase).sort();
    for (const key of keys) {
      const outcome = await migrateStructuredKey(key);
      if (outcome === 'migrated') {summary.migrated += 1;}
      else if (outcome === 'already-encrypted') {summary.alreadyEncrypted += 1;}
      else if (outcome === 'raced') {summary.raced += 1;}
      else if (outcome === 'failed') {summary.failed.push(key);}
      await new Promise<void>(resolve => setTimeout(resolve, 0)); // let the UI breathe between records
    }
    return summary;
  })().finally(() => {
    running = null;
  });
  return running;
}

/** What the migration knows about each record (for diagnostics and the data-health screen). Keys + phases only. */
export async function getStructuredMigrationState(): Promise<Record<string, MigrationPhase>> {
  const state = await readState();
  return Object.fromEntries(Object.entries(state.keys).map(([key, value]) => [key, value.phase]));
}
