import AsyncStorage from '../services/secureAsyncStorage';
import {registerOwnerStore} from './ownerStoreRegistry';

// LEGACY, READ-ONLY. Before the Qadaa ledger existed, the number of Ramadan
// qadaa days the user had made up was a single integer stored here. It is now
// tracked as individual completion records in qadaaLedgerStore.ts, which folds
// this integer into the ledger exactly once (see hydrateQadaaLedger). Nothing
// writes to this key any more, and it is never deleted or renamed: it stays as
// the source of that one-time migration (and as a safety net for a downgrade).
export type QadaaProgressState = {
  completedDays: number;
  updatedAt: number;
};

const PROGRESS_STORAGE_KEY = 'awa:qadaa:progress:v1';
const DEFAULT_PROGRESS: QadaaProgressState = {completedDays: 0, updatedAt: 0};

let progress: QadaaProgressState = {...DEFAULT_PROGRESS};
let hydration: Promise<QadaaProgressState> | null = null;
let hydrated = false;
// Bumped by every reset (ownerStoreRegistry): a read that started before it must not land in the fresh memory.
let readGeneration = 0;

const isValidProgress = (value: unknown): value is QadaaProgressState => {
  if (!value || typeof value !== 'object') {return false;}
  const candidate = value as Partial<QadaaProgressState>;
  return (
    typeof candidate.completedDays === 'number' &&
    Number.isFinite(candidate.completedDays) &&
    candidate.completedDays >= 0 &&
    typeof candidate.updatedAt === 'number'
  );
};

/** Reads the legacy counter once. A missing / damaged entry resolves to 0 completed days; a failed read rejects (and can be retried). */
export const hydrateQadaaProgress = (): Promise<QadaaProgressState> => {
  if (hydrated) {
    return Promise.resolve(progress);
  }
  if (!hydration) {
    const generation = readGeneration;
    hydration = AsyncStorage.getItem(PROGRESS_STORAGE_KEY)
      .then(raw => {
        if (generation !== readGeneration) {return progress;} // reset while reading: stale
        hydrated = true;
        if (raw) {
          try {
            const parsed: unknown = JSON.parse(raw);
            if (isValidProgress(parsed)) {
              progress = parsed;
            }
          } catch {
            // A damaged value is treated as "nothing completed".
          }
        }
        return progress;
      })
      .catch(error => {
        // A failed READ must not look like "0 completed days": the caller (the
        // one-time ledger migration) has to know it could not read the counter.
        if (generation === readGeneration) {
          hydration = null;
        }
        throw error;
      });
  }
  return hydration;
};

// Owner-only legacy counter, not profile-scoped, memoised, READ-ONLY (nothing ever writes it): dropped and re-read after
// a backup restore / data deletion, or reset in memory only after a full wipe (see ownerStoreRegistry.ts). Without the
// reset, a wiped account's old counter would still be in memory and a fresh ledger would fold it back in as a
// "migrated" completion (qadaaLedgerStore.ts). Neither operation writes or recreates the key.
const resetMemory = (): void => {
  readGeneration += 1;
  progress = {...DEFAULT_PROGRESS};
  hydration = null;
  hydrated = false;
};
registerOwnerStore('qadaa-progress', {
  reload: async () => {
    resetMemory();
    try {
      await hydrateQadaaProgress();
    } catch {
      // not latched: the next hydrate (the ledger migration) retries the real read
    }
  },
  resetToDefaults: resetMemory,
});
