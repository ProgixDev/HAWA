import AsyncStorage from '@react-native-async-storage/async-storage';

import {RESTORE_JOURNAL_KEY} from './storageKeyClassifier';
import {setRawItemLocked, withKeyLock} from './secureAsyncStorage';

// Every write/removal of a data key goes through the per-key lock the encrypted storage and the migration use, so a
// restore can never interleave with a migration commit or a normal edit of the same record.
const putRaw = (key: string, value: string): Promise<void> => setRawItemLocked(key, value);
const dropRaw = (key: string): Promise<void> => withKeyLock(key, () => AsyncStorage.removeItem(key));

// A restore rewrites many AsyncStorage keys and AsyncStorage has no transactions: if the app is killed half-way
// the user would be left with a mixture of two points in time. So before the first write, the PREVIOUS value of
// every key about to be touched is saved in one journal record; the writes are then applied one by one; the
// journal is removed only after the last one. If a journal is found at launch, the restore did not finish and
// the previous values are put back — the app returns to exactly the state it was in before the restore started.
//
// The journal holds the previous RAW values (still-encrypted records stay encrypted; legacy plaintext stays
// plaintext exactly as it was stored) and only exists for the duration of a restore.

export type RestoreWrite = {key: string; value: string | null};

type RestoreJournal = {version: 1; startedAt: string; previous: Record<string, string | null>};

export type RestoreFault = 'after-journal' | 'mid-writes' | 'before-journal-removal' | null;
let injectedFault: RestoreFault = null;
/** Test hook: simulate the process being killed at a precise point (the thrown error is the "kill"). */
export const __setRestoreFaultForTests = (fault: RestoreFault): void => {
  injectedFault = fault;
};
const maybeFault = (point: Exclude<RestoreFault, null>): void => {
  if (injectedFault === point) {
    injectedFault = null;
    throw new Error(`simulated interruption: ${point}`);
  }
};

const readJournal = async (): Promise<RestoreJournal | null> => {
  const raw = await AsyncStorage.getItem(RESTORE_JOURNAL_KEY);
  if (!raw) {return null;}
  try {
    const parsed = JSON.parse(raw) as Partial<RestoreJournal>;
    if (parsed && parsed.version === 1 && parsed.previous && typeof parsed.previous === 'object') {
      return parsed as RestoreJournal;
    }
  } catch {
    // unreadable journal: treated below as "nothing trustworthy to roll back to"
  }
  return null;
};

/** Puts back what an interrupted restore had overwritten. Returns true when a rollback was performed. */
export async function recoverInterruptedRestore(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(RESTORE_JOURNAL_KEY);
  if (!raw) {return false;}
  const journal = await readJournal();
  if (!journal) {
    // A damaged journal cannot be rolled back from — and must not be left to block every future restore.
    await AsyncStorage.removeItem(RESTORE_JOURNAL_KEY);
    return false;
  }
  for (const [key, previous] of Object.entries(journal.previous)) {
    if (previous === null) {
      await dropRaw(key);
    } else {
      await putRaw(key, previous);
    }
  }
  await AsyncStorage.removeItem(RESTORE_JOURNAL_KEY);
  return true;
}

/**
 * Applies `writes` all-or-nothing from the point of view of a restart: either every write is applied, or the
 * previous state is restored by recoverInterruptedRestore(). Throws if a write fails (after rolling back).
 */
export async function applyWritesWithJournal(writes: readonly RestoreWrite[]): Promise<void> {
  if (writes.length === 0) {return;}
  // A previous interrupted restore is rolled back FIRST — never layer a new journal over an unfinished one.
  await recoverInterruptedRestore();

  const previous: Record<string, string | null> = {};
  for (const {key} of writes) {
    previous[key] = await AsyncStorage.getItem(key);
  }
  const journal: RestoreJournal = {version: 1, startedAt: new Date().toISOString(), previous};
  await AsyncStorage.setItem(RESTORE_JOURNAL_KEY, JSON.stringify(journal));
  maybeFault('after-journal');

  try {
    let applied = 0;
    for (const {key, value} of writes) {
      if (value === null) {
        await dropRaw(key);
      } else {
        await putRaw(key, value);
      }
      applied += 1;
      if (applied === Math.ceil(writes.length / 2)) {maybeFault('mid-writes');}
    }
    maybeFault('before-journal-removal');
  } catch (error) {
    // The kill-simulation faults must behave like a dead process: no in-process rollback.
    if (error instanceof Error && error.message.startsWith('simulated interruption')) {throw error;}
    await recoverInterruptedRestore();
    throw error;
  }
  await AsyncStorage.removeItem(RESTORE_JOURNAL_KEY);
}
