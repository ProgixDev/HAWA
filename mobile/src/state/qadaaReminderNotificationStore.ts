import AsyncStorage, {isStructuredUnavailableError, readOwnedItem} from '../services/secureAsyncStorage';
import {commitOptimistic} from '../services/saveFailure';

// Persisted scheduling state for the post-Ramadan Qadaa local notification —
// mirrors postpartumNifasReminderStore.ts's shape/idioms. Kept strictly
// separate from qadaaProgressStore.ts (completed-days count) and
// confirmedPeriodHistoryStore.ts (the immutable historical record): this
// store only remembers what was already scheduled, so repeated app
// launches/hydrations/focuses/preference updates never reschedule an
// identical notification.
export type QadaaReminderNotificationState = {
  /** yyyy-mm-dd of the Hijri-month-start (Gregorian) this schedule was
   * computed for — a fresh Ramadan (next year) naturally produces a
   * different key, forcing a fresh schedule. */
  ramadanMonthStartKey: string | null;
  fireAt: string | null;
  occurrenceId: string | null;
  /** Whether scheduleLocalNotification() actually succeeded (false when
   * permission was unavailable) — distinct from "we computed a schedule",
   * so a later sync can retry once permission becomes available instead of
   * permanently treating a failed attempt as handled. */
  scheduled: boolean;
};

const STORAGE_KEY = '@hawa/qadaa-post-ramadan-reminder/v1';

export const DEFAULT_QADAA_REMINDER_NOTIFICATION_STATE: QadaaReminderNotificationState = {
  ramadanMonthStartKey: null,
  fireAt: null,
  occurrenceId: null,
  scheduled: false,
};

let state: QadaaReminderNotificationState = DEFAULT_QADAA_REMINDER_NOTIFICATION_STATE;
const listeners = new Set<() => void>();
let hydration: Promise<QadaaReminderNotificationState> | null = null;
let hydrated = false;
// Bumped by every explicit write (and every rollback of one). A read that was already in flight when the write
// happened describes an OLDER state and must not replace it — otherwise a cancel issued while the first read was
// still pending (a language change right after launch) would be undone in memory the moment that read lands.
let writeRevision = 0;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const isValidState = (value: unknown): value is QadaaReminderNotificationState => {
  if (!value || typeof value !== 'object') {return false;}
  const candidate = value as Partial<QadaaReminderNotificationState>;
  return (
    (candidate.ramadanMonthStartKey === null || typeof candidate.ramadanMonthStartKey === 'string') &&
    (candidate.fireAt === null || typeof candidate.fireAt === 'string') &&
    (candidate.occurrenceId === null || typeof candidate.occurrenceId === 'string') &&
    typeof candidate.scheduled === 'boolean'
  );
};

export const getQadaaReminderNotificationState = (): QadaaReminderNotificationState => state;

export const setQadaaReminderNotificationState = async (
  next: QadaaReminderNotificationState,
): Promise<void> => {
  const previous = state;
  writeRevision += 1;
  state = next;
  notifyListeners();
  await commitOptimistic(previous, () => state, restored => {
    writeRevision += 1;
    state = restored;
    notifyListeners();
  }, () => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)));
};

export const hydrateQadaaReminderNotificationState = (): Promise<QadaaReminderNotificationState> => {
  // Same reasoning as every other store here: once the first real
  // AsyncStorage read resolves, the in-memory value is authoritative — a
  // re-returned first-read promise would clobber a just-persisted schedule.
  if (hydrated) {
    return Promise.resolve(state);
  }
  if (!hydration) {
    const revisionAtStart = writeRevision;
    hydration = readOwnedItem(STORAGE_KEY, hydrateQadaaReminderNotificationState)
      .then(raw => {
        hydrated = true;
        if (raw && revisionAtStart === writeRevision) {
          const parsed: unknown = JSON.parse(raw);
          if (isValidState(parsed)) {
            state = parsed;
            notifyListeners();
          }
        }
        return state;
      })
      .catch(error => {
        if (isStructuredUnavailableError(error)) {
          // not latched: a later hydrate (or "Try again") re-reads the real record
          hydration = null;
          return state;
        }
        hydrated = true;
        return state;
      });
  }
  return hydration;
};

export const subscribeQadaaReminderNotification = (listener: () => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};
