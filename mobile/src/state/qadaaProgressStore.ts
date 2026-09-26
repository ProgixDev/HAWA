import AsyncStorage from '@react-native-async-storage/async-storage';

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
    hydration = AsyncStorage.getItem(PROGRESS_STORAGE_KEY)
      .then(raw => {
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
        hydration = null;
        throw error;
      });
  }
  return hydration;
};
