import AsyncStorage, {isStructuredUnavailableError} from '../services/secureAsyncStorage';
import {commitOptimistic, markSaveFailureHandled} from '../services/saveFailure';

import {hydrateQadaaProgress, type QadaaProgressState} from './qadaaProgressStore';
import {getActiveProfileId, isOwnerActive, subscribeActiveProfileId} from './activeProfileStore';
import {profileScopedKey} from './profileScopedStorage';

// Persistent Qadaa ledger: everything the USER declares about her Qadaa
// ("Jeûnes à rattraper"), kept strictly apart from the AUTOMATIC part.
//
//   - AUTOMATIC Qadaa is never stored here. It stays derived, on every
//     computation, from confirmedPeriodHistoryStore + the Ramadan detection
//     (src/utils/qadaaLogic.ts), so editing the menstrual history keeps
//     recalculating it.
//   - MANUAL entries (`manualEntries`): user-declared owed days — possibly from
//     years ago, possibly with no known Ramadan. They never reference the
//     menstrual history, so editing that history can never move them.
//   - COMPLETIONS (`completions`): one record per "Marquer comme rattrapé". The
//     model is balance-based: a completion is not tied to a specific owed day.
//
// Balance formula (single implementation: src/utils/qadaaBalance.ts):
//   total = automatic + sum(manual)            remaining = max(0, total − completed)
//
// Deletion strategy: a removed manual entry / undone completion is deleted
// outright (no tombstone) — this is sensitive health/religious-practice data and
// the user asked for it to disappear. The migration flag below is what keeps a
// deleted migrated completion from ever being re-created.
//
// Storage: key `awa:qadaa:ledger:v1` (versioned). The legacy keys
// (`awa:qadaa:progress:v1`, `@hawa/remaining-qadaa-days`) are left untouched:
// the legacy completed counter is migrated ONCE into a completion record (see
// `hydrateQadaaLedger`), the old key is only ever READ.

export type QadaaYearSystem = 'hijri' | 'gregorian';

export type QadaaManualEntry = {
  id: string;
  /** Always 'MANUAL' — a manual entry can never masquerade as an automatic one. */
  source: 'MANUAL';
  /** Positive integer number of owed days. */
  quantity: number;
  /** Ramadan year when the user knows it, else null ("ancien solde / année inconnue"). */
  year: number | null;
  /** Calendar of `year`; null exactly when `year` is null. */
  yearSystem: QadaaYearSystem | null;
  /** Optional short free-text label; never required, never interpreted. */
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QadaaCompletionEntry = {
  id: string;
  /** Positive integer number of days made up (normally 1). */
  quantity: number;
  /** The instant the user recorded the completion (ISO). */
  completedAt: string;
  /** Local calendar day (yyyy-mm-dd, `en-CA`) of `completedAt` — no UTC shift. */
  completedOn: string;
  createdAt: string;
  /** 'MIGRATED' = carried over from the pre-ledger completed-days counter. */
  origin: 'USER' | 'MIGRATED';
};

export type QadaaLedger = {
  version: 1;
  /** True once the legacy completed-days counter has been folded into the ledger. */
  legacyProgressMigrated: boolean;
  manualEntries: QadaaManualEntry[];
  completions: QadaaCompletionEntry[];
};

export type QadaaManualEntryInput = {
  /** Optional idempotency key: submitting the same id twice creates ONE entry. */
  id?: string;
  quantity: number;
  year?: number | null;
  yearSystem?: QadaaYearSystem | null;
  note?: string | null;
};

export const QADAA_LEDGER_STORAGE_KEY = 'awa:qadaa:ledger:v1';
// Profile-scoped (see profileScopedStorage.ts) — the mother's ledger stays under the
// exact key above, unsuffixed; a managed (daughter) profile gets her own suffixed
// key, and (see hydrateQadaaLedger below) never runs the legacy-counter migration,
// since that legacy counter is the MOTHER's own pre-ledger data, never a daughter's.
const currentLedgerStorageKey = () => profileScopedKey(QADAA_LEDGER_STORAGE_KEY, getActiveProfileId());
export const QADAA_LEGACY_COMPLETION_ID = 'qadaa-completion-legacy-progress';
export const QADAA_MAX_DAYS_PER_ENTRY = 999;
export const QADAA_MAX_NOTE_LENGTH = 80;

const EMPTY_LEDGER: QadaaLedger = {
  version: 1,
  legacyProgressMigrated: false,
  manualEntries: [],
  completions: [],
};

let ledger: QadaaLedger = {...EMPTY_LEDGER};
const listeners = new Set<() => void>();
let hydration: Promise<QadaaLedger> | null = null;
let hydrated = false;
let hydratedForProfileId: string | null = null;
// Why the last read of the ledger failed (see ensureWritable()).
let lastReadFailure: unknown = null;
let writeChain: Promise<void> = Promise.resolve();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const localDateKey = (date: Date): string => date.toLocaleDateString('en-CA');

let idCounter = 0;
const newId = (prefix: string): string => {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

const isIsoString = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(new Date(value).getTime());

const sanitizeManualEntry = (value: unknown): QadaaManualEntry | null => {
  if (!value || typeof value !== 'object') {return null;}
  const c = value as Partial<QadaaManualEntry>;
  if (typeof c.id !== 'string' || !c.id || !isPositiveInteger(c.quantity)) {return null;}
  if (!isIsoString(c.createdAt) || !isIsoString(c.updatedAt)) {return null;}
  const hasYear =
    typeof c.year === 'number' && Number.isInteger(c.year) && (c.yearSystem === 'hijri' || c.yearSystem === 'gregorian');
  return {
    id: c.id,
    source: 'MANUAL',
    quantity: c.quantity,
    year: hasYear ? (c.year as number) : null,
    yearSystem: hasYear ? (c.yearSystem as QadaaYearSystem) : null,
    note: typeof c.note === 'string' && c.note.trim() ? c.note.trim().slice(0, QADAA_MAX_NOTE_LENGTH) : null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
};

const sanitizeCompletion = (value: unknown): QadaaCompletionEntry | null => {
  if (!value || typeof value !== 'object') {return null;}
  const c = value as Partial<QadaaCompletionEntry>;
  if (typeof c.id !== 'string' || !c.id || !isPositiveInteger(c.quantity)) {return null;}
  if (!isIsoString(c.completedAt) || !isIsoString(c.createdAt)) {return null;}
  return {
    id: c.id,
    quantity: c.quantity,
    completedAt: c.completedAt,
    completedOn: typeof c.completedOn === 'string' && c.completedOn ? c.completedOn : localDateKey(new Date(c.completedAt)),
    createdAt: c.createdAt,
    origin: c.origin === 'MIGRATED' ? 'MIGRATED' : 'USER',
  };
};

// Invalid ENTRIES are dropped individually so one damaged record can never hide
// the rest of the ledger; unparsable JSON yields an empty ledger.
const parseLedger = (raw: string | null): QadaaLedger | null => {
  if (!raw) {return null;}
  try {
    const parsed = JSON.parse(raw) as Partial<QadaaLedger> | null;
    if (!parsed || typeof parsed !== 'object') {return null;}
    const seen = new Set<string>();
    const unique = <T extends {id: string}>(items: (T | null)[]): T[] =>
      items.filter((item): item is T => {
        if (!item || seen.has(item.id)) {return false;}
        seen.add(item.id);
        return true;
      });
    return {
      version: 1,
      legacyProgressMigrated: parsed.legacyProgressMigrated === true,
      manualEntries: unique((Array.isArray(parsed.manualEntries) ? parsed.manualEntries : []).map(sanitizeManualEntry)),
      completions: unique((Array.isArray(parsed.completions) ? parsed.completions : []).map(sanitizeCompletion)),
    };
  } catch {
    return null;
  }
};

// Writes are serialized and each one carries the snapshot taken when it was
// requested, so the last write on disk is always the latest in-memory state.
const persist = (): Promise<void> => {
  const snapshot = JSON.stringify(ledger);
  writeChain = writeChain
    .catch(() => undefined)
    .then(() => AsyncStorage.setItem(currentLedgerStorageKey(), snapshot));
  return writeChain;
};

export const getQadaaLedger = (): QadaaLedger => ledger;

export const subscribeQadaaLedger = (listener: () => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};

/**
 * Loads the ledger (once) and runs the one-time legacy migration.
 *
 * MIGRATION (idempotent): the pre-ledger model was a single integer
 * `completedDays` in `awa:qadaa:progress:v1`. When the ledger has not migrated
 * it yet (`legacyProgressMigrated === false`) and that integer is > 0, ONE
 * completion record is created (deterministic id `QADAA_LEGACY_COMPLETION_ID`,
 * origin 'MIGRATED', quantity = the old integer) so the user's remaining
 * balance is exactly what it was before, then the flag is set and the ledger is
 * persisted. Re-hydrating (or restarting) reads the flag and does nothing, and
 * the deterministic id blocks a duplicate even if the flag were lost. The legacy
 * key and the cached remaining value are only read / left in place.
 *
 * A failed AsyncStorage read does not mark the ledger as hydrated (a later call
 * retries) and every mutation refuses to run until it is, so an unreadable
 * ledger can never be overwritten by an empty one.
 */
export const hydrateQadaaLedger = (): Promise<QadaaLedger> => {
  const profileId = getActiveProfileId();
  if (hydrated && hydratedForProfileId === profileId) {return Promise.resolve(ledger);}
  hydration = (async () => {
    let raw: string | null;
    try {
      raw = await AsyncStorage.getItem(currentLedgerStorageKey());
    } catch (readError) {
      lastReadFailure = readError;
      hydration = null;
      // Unreadable ledger: empty (and write-refused, see ensureWritable), never the previously active profile's.
      ledger = {...EMPTY_LEDGER, manualEntries: [], completions: []};
      return ledger;
    }

    let next = parseLedger(raw) ?? {...EMPTY_LEDGER, manualEntries: [], completions: []};
    let changed = raw === null;

    // The legacy pre-ledger counter (qadaaProgressStore.ts) is the MOTHER's own
    // historical data — a managed (daughter) profile never had it, so her ledger
    // is simply marked already-migrated instead of ever reading/folding it in.
    if (!next.legacyProgressMigrated && isOwnerActive()) {
      let legacy: QadaaProgressState;
      try {
        legacy = await hydrateQadaaProgress();
      } catch {
        // The old counter could not be read: stay un-hydrated (retry later)
        // rather than record "0 completed" and lose it for good.
        hydration = null;
        ledger = {...EMPTY_LEDGER, manualEntries: [], completions: []};
        return ledger;
      }
      const legacyQuantity = Math.floor(legacy.completedDays);
      if (isPositiveInteger(legacyQuantity) && !next.completions.some(item => item.id === QADAA_LEGACY_COMPLETION_ID)) {
        const at = legacy.updatedAt > 0 ? new Date(legacy.updatedAt) : new Date();
        const migrated: QadaaCompletionEntry = {
          id: QADAA_LEGACY_COMPLETION_ID,
          quantity: legacyQuantity,
          completedAt: at.toISOString(),
          completedOn: localDateKey(at),
          createdAt: new Date().toISOString(),
          origin: 'MIGRATED',
        };
        next = {...next, completions: [...next.completions, migrated]};
      }
      next = {...next, legacyProgressMigrated: true};
      changed = true;
    } else if (!next.legacyProgressMigrated) {
      next = {...next, legacyProgressMigrated: true};
      changed = true;
    }

    ledger = next;
    hydrated = true;
    hydratedForProfileId = profileId;
    if (changed) {
      // Derived migration write (re-derived at every load): not a user edit, retried by the next load.
      persist().catch(markSaveFailureHandled);
    }
    notifyListeners();
    return ledger;
  })();
  return hydration;
};

// Re-reads (and re-notifies) from the newly active profile's own key whenever the
// active profile changes.
subscribeActiveProfileId(() => {
  hydrated = false;
  hydrateQadaaLedger().catch(() => undefined);
});

const ensureWritable = async (): Promise<void> => {
  await hydrateQadaaLedger();
  if (!hydrated) {
    // The record's own "unavailable" failure is surfaced as such (services/saveFailure.ts) so the person is pointed to
    // the recovery screen; any other read failure keeps the generic refusal.
    if (isStructuredUnavailableError(lastReadFailure)) {throw lastReadFailure;}
    throw new Error('[qadaaLedgerStore] The Qadaa ledger could not be read; refusing to write.');
  }
};

// A refused/failed write REJECTS (services/saveFailure.ts) and the ledger goes back to what it was, so the balance on
// screen never counts a completion/entry that was not persisted.
const commit = async (next: QadaaLedger): Promise<void> => {
  const previous = ledger;
  ledger = next;
  notifyListeners();
  await commitOptimistic(previous, () => ledger, restored => {
    ledger = restored;
    notifyListeners();
  }, persist);
};

const normalizeNote = (note: string | null | undefined): string | null => {
  const trimmed = (note ?? '').trim();
  return trimmed ? trimmed.slice(0, QADAA_MAX_NOTE_LENGTH) : null;
};

const validateManualInput = (input: QadaaManualEntryInput) => {
  if (!isPositiveInteger(input.quantity) || input.quantity > QADAA_MAX_DAYS_PER_ENTRY) {
    throw new Error('[qadaaLedgerStore] A manual Qadaa quantity must be an integer between 1 and 999.');
  }
  const hasYear = input.year !== null && input.year !== undefined;
  if (hasYear && (!Number.isInteger(input.year) || !input.yearSystem)) {
    throw new Error('[qadaaLedgerStore] A manual Qadaa year needs its calendar (hijri or gregorian).');
  }
  return {
    quantity: input.quantity,
    year: hasYear ? (input.year as number) : null,
    yearSystem: hasYear ? (input.yearSystem as QadaaYearSystem) : null,
    note: normalizeNote(input.note),
  };
};

/** Adds one user-declared owed-days entry. Same `id` twice → the first entry is returned unchanged. */
export const addManualQadaaEntry = async (
  input: QadaaManualEntryInput,
  now: Date = new Date(),
): Promise<QadaaManualEntry> => {
  const fields = validateManualInput(input);
  await ensureWritable();
  const id = input.id ?? newId('qadaa-manual');
  const existing = ledger.manualEntries.find(entry => entry.id === id);
  if (existing) {return existing;}
  const entry: QadaaManualEntry = {
    id,
    source: 'MANUAL',
    ...fields,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  await commit({...ledger, manualEntries: [...ledger.manualEntries, entry]});
  return entry;
};

/** Corrects quantity / year / note of a MANUAL entry. Returns null when it does not exist. */
export const updateManualQadaaEntry = async (
  id: string,
  input: Omit<QadaaManualEntryInput, 'id'>,
  now: Date = new Date(),
): Promise<QadaaManualEntry | null> => {
  const fields = validateManualInput(input);
  await ensureWritable();
  const current = ledger.manualEntries.find(entry => entry.id === id);
  if (!current) {return null;}
  const updated: QadaaManualEntry = {...current, ...fields, updatedAt: now.toISOString()};
  await commit({
    ...ledger,
    manualEntries: ledger.manualEntries.map(entry => (entry.id === id ? updated : entry)),
  });
  return updated;
};

/** Removes ONLY that manual entry. Returns false when it did not exist. */
export const removeManualQadaaEntry = async (id: string): Promise<boolean> => {
  await ensureWritable();
  if (!ledger.manualEntries.some(entry => entry.id === id)) {return false;}
  await commit({...ledger, manualEntries: ledger.manualEntries.filter(entry => entry.id !== id)});
  return true;
};

/**
 * Records "Marquer comme rattrapé". `maxQuantity` (the caller's current
 * remaining balance) caps the quantity so a completion can never push the
 * remaining balance below zero; with `maxQuantity <= 0` nothing is recorded.
 * Same `id` twice → the first record is returned unchanged.
 */
export const recordQadaaCompletion = async (
  options: {id?: string; quantity?: number; completedAt?: Date; maxQuantity?: number} = {},
): Promise<QadaaCompletionEntry | null> => {
  const requested = options.quantity ?? 1;
  if (!isPositiveInteger(requested)) {
    throw new Error('[qadaaLedgerStore] A completion quantity must be a positive integer.');
  }
  await ensureWritable();
  const id = options.id ?? newId('qadaa-completion');
  const existing = ledger.completions.find(entry => entry.id === id);
  if (existing) {return existing;}
  const quantity = options.maxQuantity === undefined ? requested : Math.min(requested, Math.floor(options.maxQuantity));
  if (!isPositiveInteger(quantity)) {return null;}
  const completedAt = options.completedAt ?? new Date();
  const entry: QadaaCompletionEntry = {
    id,
    quantity,
    completedAt: completedAt.toISOString(),
    completedOn: localDateKey(completedAt),
    createdAt: new Date().toISOString(),
    origin: 'USER',
  };
  await commit({...ledger, completions: [...ledger.completions, entry]});
  return entry;
};

/** Undoes (deletes) one completion record. Returns false when it did not exist. */
export const undoQadaaCompletion = async (id: string): Promise<boolean> => {
  await ensureWritable();
  if (!ledger.completions.some(entry => entry.id === id)) {return false;}
  await commit({...ledger, completions: ledger.completions.filter(entry => entry.id !== id)});
  return true;
};
