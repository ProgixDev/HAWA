import AsyncStorage from '@react-native-async-storage/async-storage';

// Postpartum's own Lochia daily-tracking store — one entry per calendar day,
// same module-singleton + AsyncStorage pattern as postpartumJournalStore.ts.
// Kept as a SEPARATE store (never merged into postpartumJournalStore) since
// Lochia is its own tracking concern, reached from its own screen
// (PostpartumLochiaScreen.tsx) and not one of the 5 Postpartum Journal
// categories that govern Dashboard/Calendar completion.
export type LochiaFlow = 'Très léger' | 'Léger' | 'Modéré' | 'Abondant';
export type LochiaColor =
  | 'Rouge vif'
  | 'Rouge'
  | 'Rose'
  | 'Brun'
  | 'Jaune / blanc';
export type LochiaConsistency = 'Liquide' | 'Épais' | 'Avec petits caillots';

export type PostpartumLochiaEntry = {
  date: string;
  flow: LochiaFlow;
  color: LochiaColor;
  consistency: LochiaConsistency;
  symptoms: string[];
  note?: string;
};

const STORAGE_KEY = '@hawa/postpartum-lochia/v1';

type EntriesByDate = Record<string, PostpartumLochiaEntry>;

export type PostpartumLochiaTracking = {
  /** Local YYYY-MM-DD selected by the user when she explicitly marks the
   * medical lochia tracking as finished. Null means it remains open. */
  endedDate: string | null;
};

type PersistedLochiaState = {
  entries: EntriesByDate;
  tracking: PostpartumLochiaTracking;
};

const DEFAULT_TRACKING: PostpartumLochiaTracking = { endedDate: null };

let entries: EntriesByDate = {};
let tracking: PostpartumLochiaTracking = { ...DEFAULT_TRACKING };
const listeners = new Set<() => void>();
let hydration: Promise<EntriesByDate> | null = null;
let hydrated = false;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const FLOWS: LochiaFlow[] = ['Très léger', 'Léger', 'Modéré', 'Abondant'];
const COLORS: LochiaColor[] = [
  'Rouge vif',
  'Rouge',
  'Rose',
  'Brun',
  'Jaune / blanc',
];
const CONSISTENCIES: LochiaConsistency[] = [
  'Liquide',
  'Épais',
  'Avec petits caillots',
];

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string');

const isValidEntry = (value: unknown): value is PostpartumLochiaEntry => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<PostpartumLochiaEntry>;
  return (
    typeof candidate.date === 'string' &&
    FLOWS.includes(candidate.flow as LochiaFlow) &&
    COLORS.includes(candidate.color as LochiaColor) &&
    CONSISTENCIES.includes(candidate.consistency as LochiaConsistency) &&
    isStringArray(candidate.symptoms) &&
    (candidate.note === undefined || typeof candidate.note === 'string')
  );
};

const persist = () =>
  AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ entries, tracking } satisfies PersistedLochiaState),
  ).catch(() => {});

export const getPostpartumLochiaEntry = (
  date: string,
): PostpartumLochiaEntry | undefined =>
  entries[date] ? { ...entries[date] } : undefined;

/** Every entry, keyed by date — the single source Postpartum Statistics
 * reads for Lochia counts/chart/distribution. Never persist a derived
 * statistic separately; always recompute from this. */
export const getAllPostpartumLochiaEntries = (): EntriesByDate => ({
  ...entries,
});

export const getPostpartumLochiaTracking = (): PostpartumLochiaTracking => ({
  ...tracking,
});

export async function savePostpartumLochiaEntry(
  date: string,
  entry: Omit<PostpartumLochiaEntry, 'date'>,
): Promise<void> {
  entries = { ...entries, [date]: { ...entry, date } };
  notifyListeners();
  await persist();
}

export async function markPostpartumLochiaEnded(date: string): Promise<void> {
  tracking = { endedDate: date };
  notifyListeners();
  await persist();
}

export async function reopenPostpartumLochiaTracking(): Promise<void> {
  tracking = { ...DEFAULT_TRACKING };
  notifyListeners();
  await persist();
}

export const hydratePostpartumLochia = (): Promise<EntriesByDate> => {
  if (hydrated) {
    return Promise.resolve({ ...entries });
  }
  if (!hydration) {
    hydration = AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        hydrated = true;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            const candidate = parsed as Record<string, unknown>;
            // Backward compatibility: v1 originally persisted the entries
            // record directly. New data wraps it with tracking metadata.
            const rawEntries =
              candidate.entries && typeof candidate.entries === 'object'
                ? (candidate.entries as Record<string, unknown>)
                : candidate;
            const valid: EntriesByDate = {};
            for (const [key, value] of Object.entries(rawEntries)) {
              if (isValidEntry(value)) {
                valid[key] = value;
              }
            }
            entries = valid;
            const rawTracking = candidate.tracking;
            if (rawTracking && typeof rawTracking === 'object') {
              const endedDate = (
                rawTracking as Partial<PostpartumLochiaTracking>
              ).endedDate;
              tracking = {
                endedDate: typeof endedDate === 'string' ? endedDate : null,
              };
            }
            notifyListeners();
          }
        }
        return { ...entries };
      })
      .catch(() => {
        hydrated = true;
        return { ...entries };
      });
  }
  return hydration;
};

export const subscribePostpartumLochia = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
