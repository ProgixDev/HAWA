import AsyncStorage from '@react-native-async-storage/async-storage';

// Contraception's own single-daily-action tracking store — one record per
// calendar day, kept separate from contraceptionPreferences.ts (onboarding
// preferences) since this is daily tracking data. Used by methods where a
// single yes/no(/late) action per day is the real, correct model: pill and
// other hormonal treatment. Ring/patch have genuinely different, possibly
// multiple-per-day event types (insertion/removal/replacement) and are
// deliberately tracked in the separate contraceptionEventStore.ts instead —
// forcing them into this date→single-status shape would misrepresent them,
// not simplify anything. Uses the same safe "hydrated flag + fresh snapshot
// on repeat calls" pattern as postpartumLochiaStore.ts — deliberately NOT
// the forever-memoized-promise pattern that caused a real stale-state bug in
// contraceptionPreferences.ts earlier (hydrate() there returns the exact
// same resolved promise forever, so a second call redelivers a frozen
// snapshot instead of the live in-memory state).
export type ContraceptionIntakeStatus = 'taken' | 'missed' | 'late';

export type ContraceptionIntakeRecord = {
  /** yyyy-mm-dd, local — same date-key convention used throughout AWA. */
  date: string;
  status: ContraceptionIntakeStatus;
  /** ISO timestamp of when this record was last written. */
  recordedAt: string;
};

const STORAGE_KEY = '@hawa/contraception-intake-history/v1';

type EntriesByDate = Record<string, ContraceptionIntakeRecord>;

let entries: EntriesByDate = {};
const listeners = new Set<() => void>();
let hydration: Promise<EntriesByDate> | null = null;
let hydrated = false;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const isStatus = (value: unknown): value is ContraceptionIntakeStatus =>
  value === 'taken' || value === 'missed' || value === 'late';

const isValidRecord = (value: unknown): value is ContraceptionIntakeRecord => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<ContraceptionIntakeRecord>;
  return (
    typeof candidate.date === 'string' &&
    isStatus(candidate.status) &&
    typeof candidate.recordedAt === 'string'
  );
};

const persist = () =>
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries)).catch(() => {});

export const getContraceptionIntakeRecord = (
  date: string,
): ContraceptionIntakeRecord | undefined =>
  entries[date] ? {...entries[date]} : undefined;

export const getAllContraceptionIntakeRecords = (): EntriesByDate => ({
  ...entries,
});

/** Most-recent-first, capped at `limit` — the Dashboard's history preview
 * reads this directly rather than re-deriving order itself. */
export const getRecentContraceptionIntakeRecords = (
  limit: number,
): ContraceptionIntakeRecord[] =>
  Object.values(entries)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, limit);

/** Upserts by local date — a second call for the same date (e.g. correcting
 * "Prise effectuée" to "J'ai oublié") overwrites that day's record instead
 * of creating a second, contradictory one. */
export async function setContraceptionIntakeStatus(
  date: string,
  status: ContraceptionIntakeStatus,
): Promise<void> {
  entries = {
    ...entries,
    [date]: {date, status, recordedAt: new Date().toISOString()},
  };
  notifyListeners();
  await persist();
}

/** Removes one date's record entirely — distinct from correcting it to a
 * different status (setContraceptionIntakeStatus above): this is for "I
 * didn't mean to record anything for that day at all," used by History's
 * delete action. A no-op if the date has no record. */
export async function deleteContraceptionIntakeRecord(date: string): Promise<void> {
  if (!entries[date]) {
    return;
  }
  const next = {...entries};
  delete next[date];
  entries = next;
  notifyListeners();
  await persist();
}

export const hydrateContraceptionIntakeHistory = (): Promise<EntriesByDate> => {
  if (hydrated) {
    return Promise.resolve({...entries});
  }
  if (!hydration) {
    hydration = AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        hydrated = true;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            const valid: EntriesByDate = {};
            for (const [key, value] of Object.entries(
              parsed as Record<string, unknown>,
            )) {
              if (isValidRecord(value)) {
                valid[key] = value;
              }
            }
            entries = valid;
            notifyListeners();
          }
        }
        return {...entries};
      })
      .catch(() => {
        hydrated = true;
        return {...entries};
      });
  }
  return hydration;
};

export const subscribeContraceptionIntakeHistory = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
