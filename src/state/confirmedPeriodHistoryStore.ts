import AsyncStorage from '@react-native-async-storage/async-storage';

// Confirmed menstrual occurrences — kept strictly separate from
// cyclePreferences (predictive: lastPeriodStart/averagePeriodLength/
// cycleDuration). Each entry pairs an ACTUAL confirmed period start with
// its ACTUAL confirmed end, captured together at the moment the user taps
// "Mes règles sont terminées". Historical qadaa (src/utils/qadaaLogic.ts)
// is derived only from this list, never from current cycle predictions, so
// a later edit to cyclePreferences can never reinterpret an
// already-confirmed occurrence (see the qadaa sync investigation).
export type ConfirmedPeriodOccurrence = {
  /** The occurrence's period-start date (yyyy-mm-dd) — also its dedup key,
   * so re-confirming/editing the end time for the same period (the
   * PurityStatusCard "Modifier" flow) updates this record in place instead
   * of appending a duplicate. */
  id: string;
  /** ISO date (start of day) the confirmed period began. */
  periodStart: string;
  /** ISO datetime the user confirmed the period ended. */
  periodEndDateTime: string;
  /** ISO datetime this record was captured or last edited. */
  capturedAt: string;
};

const HISTORY_STORAGE_KEY = '@hawa/confirmed-period-history';

let history: ConfirmedPeriodOccurrence[] = [];
const listeners = new Set<() => void>();
let hydration: Promise<ConfirmedPeriodOccurrence[]> | null = null;
let hydrated = false;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const dateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isValidOccurrence = (value: unknown): value is ConfirmedPeriodOccurrence => {
  if (!value || typeof value !== 'object') {return false;}
  const candidate = value as Partial<ConfirmedPeriodOccurrence>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.periodStart === 'string' &&
    typeof candidate.periodEndDateTime === 'string' &&
    typeof candidate.capturedAt === 'string'
  );
};

export const getConfirmedPeriodHistory = (): ConfirmedPeriodOccurrence[] => [...history];

/**
 * Records (or, for the same period-start day, updates in place) one
 * confirmed occurrence. This is the ONLY way qadaa-relevant history is
 * written — never reconstructed later from cyclePreferences.
 */
export const recordConfirmedPeriodEnd = async (
  periodStart: Date,
  periodEndDateTime: Date,
  capturedAt: Date = new Date(),
): Promise<ConfirmedPeriodOccurrence[]> => {
  const id = dateKey(periodStart);
  const record: ConfirmedPeriodOccurrence = {
    id,
    periodStart: periodStart.toISOString(),
    periodEndDateTime: periodEndDateTime.toISOString(),
    capturedAt: capturedAt.toISOString(),
  };

  const existingIndex = history.findIndex(occurrence => occurrence.id === id);
  history =
    existingIndex >= 0
      ? [...history.slice(0, existingIndex), record, ...history.slice(existingIndex + 1)]
      : [...history, record];

  notifyListeners();
  await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  return getConfirmedPeriodHistory();
};

/**
 * Removes one confirmed occurrence by its period-start day, if present.
 * No-ops (no write, no notify) when nothing matches — safe to call
 * speculatively, e.g. to clean up the old occurrence after a period-range
 * edit renames its start date (see CalendarScreen.tsx's savePeriodEditing).
 */
export const removeConfirmedPeriodOccurrence = async (
  periodStart: Date,
): Promise<ConfirmedPeriodOccurrence[]> => {
  const id = dateKey(periodStart);
  if (!history.some(occurrence => occurrence.id === id)) {
    return getConfirmedPeriodHistory();
  }
  history = history.filter(occurrence => occurrence.id !== id);
  notifyListeners();
  await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  return getConfirmedPeriodHistory();
};

export const hydrateConfirmedPeriodHistory = (): Promise<ConfirmedPeriodOccurrence[]> => {
  // Same reasoning as onboardingPreferences' hydrate* functions: once the
  // first real AsyncStorage read resolves, the in-memory list is
  // authoritative — re-returning the cached first-read promise on every
  // later call would clobber a just-recorded occurrence.
  if (hydrated) {
    return Promise.resolve(getConfirmedPeriodHistory());
  }
  if (!hydration) {
    hydration = AsyncStorage.getItem(HISTORY_STORAGE_KEY)
      .then(raw => {
        hydrated = true;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.every(isValidOccurrence)) {
            history = parsed;
            notifyListeners();
          }
        }
        return getConfirmedPeriodHistory();
      })
      .catch(() => {
        hydrated = true;
        return getConfirmedPeriodHistory();
      });
  }
  return hydration;
};

export const subscribeConfirmedPeriodHistory = (listener: () => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};
