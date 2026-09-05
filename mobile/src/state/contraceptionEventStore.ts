import AsyncStorage from '@react-native-async-storage/async-storage';

// Contraception's ring/patch event-tracking store — a SEPARATE store from
// contraceptionIntakeHistoryStore.ts (pill/other's single-status-per-day
// model) because ring and patch have genuinely different event types that
// can legitimately co-occur on the same day (e.g. removing the old ring and
// inserting a new one). Forcing that into a single `status` field per date
// would misrepresent the real event, so this store instead holds a LIST of
// events per date. Deliberately does NOT compute or assume any replacement
// schedule — every event here is something the user explicitly logged, never
// a predicted/expected date derived from a cadence AWA doesn't actually know.
// Same safe "hydrated flag + fresh snapshot on repeat calls" pattern as
// postpartumLochiaStore.ts / contraceptionIntakeHistoryStore.ts.
export type ContraceptionEventType =
  | 'ring_insertion'
  | 'ring_removal'
  | 'ring_replacement'
  | 'patch_application'
  | 'patch_removal'
  | 'patch_replacement';

export type ContraceptionEvent = {
  /** Deterministic, not random — `${date}_${type}_${index}`, so re-hydrating
   * the same persisted data always reproduces the same ids (stable list keys,
   * stable notification/edit targeting later). */
  id: string;
  /** yyyy-mm-dd, local — same date-key convention used throughout AWA. */
  date: string;
  type: ContraceptionEventType;
  /** ISO timestamp of when this event was recorded. */
  recordedAt: string;
};

const STORAGE_KEY = '@hawa/contraception-event-history/v1';

type EventsByDate = Record<string, ContraceptionEvent[]>;

let entries: EventsByDate = {};
const listeners = new Set<() => void>();
let hydration: Promise<EventsByDate> | null = null;
let hydrated = false;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const EVENT_TYPES: ContraceptionEventType[] = [
  'ring_insertion',
  'ring_removal',
  'ring_replacement',
  'patch_application',
  'patch_removal',
  'patch_replacement',
];

const isEventType = (value: unknown): value is ContraceptionEventType =>
  typeof value === 'string' && (EVENT_TYPES as string[]).includes(value);

const isValidEvent = (value: unknown): value is ContraceptionEvent => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<ContraceptionEvent>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.date === 'string' &&
    isEventType(candidate.type) &&
    typeof candidate.recordedAt === 'string'
  );
};

const persist = () =>
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries)).catch(() => {});

export const getContraceptionEventsForDate = (date: string): ContraceptionEvent[] =>
  entries[date] ? [...entries[date]] : [];

export const getAllContraceptionEvents = (): EventsByDate => ({...entries});

/** Most-recent-first (by date, then by recordedAt within a date), capped at
 * `limit` — mirrors getRecentContraceptionIntakeRecords()'s shape so History
 * UI can read either store the same way. */
export const getRecentContraceptionEvents = (limit: number): ContraceptionEvent[] =>
  Object.values(entries)
    .flat()
    .sort((a, b) => {
      if (a.date !== b.date) {return a.date < b.date ? 1 : -1;}
      return a.recordedAt < b.recordedAt ? 1 : -1;
    })
    .slice(0, limit);

/** Next unused id suffix for `date` — the highest existing suffix among that
 * date's SURVIVING events, plus one. Deliberately NOT `existing.length`:
 * that would reuse an id after a delete-then-re-add of the same day (e.g.
 * add → add → delete the first → add again would reuse the deleted event's
 * id, silently colliding two distinct events under one id and making a
 * later delete remove both at once). Scanning surviving ids instead means a
 * freed index is never reused, matching the file's own "ids stay unique"
 * guarantee. The numeric suffix is always the segment after the LAST
 * underscore — safe even though `type` itself contains underscores (e.g.
 * "ring_insertion"), since `lastIndexOf` skips past those. */
function nextEventIdSuffix(date: string): number {
  const existing = entries[date] ?? [];
  let maxSuffix = -1;
  for (const event of existing) {
    const suffix = Number(event.id.slice(event.id.lastIndexOf('_') + 1));
    if (Number.isInteger(suffix) && suffix > maxSuffix) {
      maxSuffix = suffix;
    }
  }
  return maxSuffix + 1;
}

/** Appends a new event for `date` — never overwrites existing events for
 * that day, since ring/patch days can genuinely hold more than one real
 * event (e.g. removal + replacement). Returns the created event so a caller
 * (e.g. an edit/delete flow) can reference its id immediately. */
export async function addContraceptionEvent(
  date: string,
  type: ContraceptionEventType,
): Promise<ContraceptionEvent> {
  const existing = entries[date] ?? [];
  const event: ContraceptionEvent = {
    id: `${date}_${type}_${nextEventIdSuffix(date)}`,
    date,
    type,
    recordedAt: new Date().toISOString(),
  };
  entries = {...entries, [date]: [...existing, event]};
  notifyListeners();
  await persist();
  return event;
}

/** Removes one event by id — used by History's delete action. A no-op if
 * the id no longer exists (e.g. already deleted from another screen).
 * Scans every date rather than parsing the date back out of `id` — the id's
 * `type` segment (e.g. "ring_insertion") itself contains underscores, so a
 * naive split would be ambiguous. */
export async function deleteContraceptionEvent(id: string): Promise<void> {
  const dateWithEvent = Object.keys(entries).find(date =>
    entries[date].some(event => event.id === id),
  );
  if (!dateWithEvent) {
    return;
  }
  const filtered = entries[dateWithEvent].filter(event => event.id !== id);
  const next = {...entries};
  if (filtered.length > 0) {
    next[dateWithEvent] = filtered;
  } else {
    delete next[dateWithEvent];
  }
  entries = next;
  notifyListeners();
  await persist();
}

export const hydrateContraceptionEvents = (): Promise<EventsByDate> => {
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
            const valid: EventsByDate = {};
            for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
              if (Array.isArray(value)) {
                const validEvents = value.filter(isValidEvent);
                if (validEvents.length > 0) {
                  valid[key] = validEvents;
                }
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

export const subscribeContraceptionEvents = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
