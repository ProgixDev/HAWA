import AsyncStorage from '@react-native-async-storage/async-storage';

// Persisted count of Ramadan qadaa fasting days the user has actually made
// up — kept STRICTLY separate from confirmedPeriodHistoryStore (the
// immutable historical record of how many days were originally missed).
// completedDays only ever grows via markOneQadaaDayCompleted, and is
// clamped to whatever the current total is at write time; it never
// mutates history. useQadaaStatus combines totalQadaaDays (from history)
// with completedQadaaDays (from here) to derive the displayed
// remainingQadaaDays — this store has no notion of "remaining" itself.
export type QadaaProgressState = {
  completedDays: number;
  updatedAt: number;
};

const PROGRESS_STORAGE_KEY = 'awa:qadaa:progress:v1';
const DEFAULT_PROGRESS: QadaaProgressState = {completedDays: 0, updatedAt: 0};

let progress: QadaaProgressState = {...DEFAULT_PROGRESS};
const listeners = new Set<() => void>();
let hydration: Promise<QadaaProgressState> | null = null;
let hydrated = false;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

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

export const getQadaaCompletedDays = (): number => progress.completedDays;

export const hydrateQadaaProgress = (): Promise<QadaaProgressState> => {
  // Same reasoning as every other store here: once the first real
  // AsyncStorage read resolves, the in-memory value is authoritative — a
  // fresh/missing entry (e.g. an existing user updating to this version)
  // safely resolves to the DEFAULT_PROGRESS (completedDays: 0) already set
  // above, never a crash and never a fabricated non-zero value.
  if (hydrated) {
    return Promise.resolve(progress);
  }
  if (!hydration) {
    hydration = AsyncStorage.getItem(PROGRESS_STORAGE_KEY)
      .then(raw => {
        hydrated = true;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (isValidProgress(parsed)) {
            progress = parsed;
            notifyListeners();
          }
        }
        return progress;
      })
      .catch(() => {
        hydrated = true;
        return progress;
      });
  }
  return hydration;
};

/**
 * Increments completedDays by exactly 1, clamped to `totalQadaaDays`
 * (the CURRENT total at call time, passed in by the caller — never
 * inferred here, so this store never needs to know how the total is
 * calculated). Reads and mutates the in-memory `progress` synchronously
 * before the AsyncStorage write starts, so two rapid calls can never both
 * read the same pre-increment value — the second call always sees the
 * first call's already-applied increment.
 */
export const markOneQadaaDayCompleted = async (totalQadaaDays: number): Promise<QadaaProgressState> => {
  const nextCompletedDays = Math.min(totalQadaaDays, progress.completedDays + 1);
  if (nextCompletedDays === progress.completedDays) {
    return progress;
  }

  progress = {completedDays: nextCompletedDays, updatedAt: Date.now()};
  notifyListeners();
  await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  return progress;
};

export const subscribeQadaaProgress = (listener: () => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};
