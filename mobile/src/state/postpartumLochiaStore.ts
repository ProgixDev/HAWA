import AsyncStorage, {isStructuredUnavailableError, readOwnedItem} from '../services/secureAsyncStorage';
import {migrateRecordSafely, sealField, sealMapFields} from '../services/legacyFieldMigration';
import {commitOptimistic} from '../services/saveFailure';
import {
  decryptFieldValue,
  encryptFieldValue,
  isEncryptedFieldPayload,
} from '../services/atRestFieldEncryption';

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

// `flow`/`color`/`consistency` are fixed enums and `symptoms` is a
// structured tag list — `note` is the only genuine free-text field here and
// the only one encrypted at rest. `tracking` (endedDate) is unrelated
// metadata and is never touched by this transform.
const ENCRYPTION_SERVICE = 'com.hawa.private.postpartum-lochia.encryption-key';

async function encryptEntryForStorage(entry: PostpartumLochiaEntry): Promise<Record<string, unknown>> {
  const output: Record<string, unknown> = {...entry};
  if (typeof entry.note === 'string' && entry.note.length > 0) {
    output.note = await encryptFieldValue(ENCRYPTION_SERVICE, entry.note);
  } else {
    delete output.note;
  }
  return output;
}

async function decryptEntryFromStorage(raw: Record<string, unknown>): Promise<Record<string, unknown>> {
  const output: Record<string, unknown> = {...raw};
  if (isEncryptedFieldPayload(raw.note)) {
    try {
      output.note = await decryptFieldValue<string>(ENCRYPTION_SERVICE, raw.note);
    } catch {
      delete output.note;
    }
  }
  return output;
}

// A refused/failed write REJECTS (see services/saveFailure.ts) and the in-memory state goes back to what it was.
const persist = async () => {
  const serializableEntries: Record<string, unknown> = {};
  for (const [date, entry] of Object.entries(entries)) {
    serializableEntries[date] = await encryptEntryForStorage(entry);
  }
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({entries: serializableEntries, tracking}),
  );
};

const commitEntries = (previous: EntriesByDate): Promise<void> =>
  commitOptimistic(previous, () => entries, restored => {
    entries = restored;
    notifyListeners();
  }, persist);

const commitTracking = (previous: PostpartumLochiaTracking): Promise<void> =>
  commitOptimistic(previous, () => tracking, restored => {
    tracking = restored;
    notifyListeners();
  }, persist);

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
  const previous = entries;
  entries = { ...entries, [date]: { ...entry, date } };
  notifyListeners();
  await commitEntries(previous);
}

export async function markPostpartumLochiaEnded(date: string): Promise<void> {
  const previous = tracking;
  tracking = { endedDate: date };
  notifyListeners();
  await commitTracking(previous);
}

export async function reopenPostpartumLochiaTracking(): Promise<void> {
  const previous = tracking;
  tracking = { ...DEFAULT_TRACKING };
  notifyListeners();
  await commitTracking(previous);
}

export const hydratePostpartumLochia = (): Promise<EntriesByDate> => {
  if (hydrated) {
    return Promise.resolve({ ...entries });
  }
  if (!hydration) {
    hydration = readOwnedItem(STORAGE_KEY, hydratePostpartumLochia)
      .then(async raw => {
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
            for (const [key, rawValue] of Object.entries(rawEntries)) {
              if (!rawValue || typeof rawValue !== 'object') {continue;}
              const decrypted = await decryptEntryFromStorage(rawValue as Record<string, unknown>);
              if (isValidEntry(decrypted)) {
                valid[key] = decrypted;
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
      .catch(error => {
        if (isStructuredUnavailableError(error)) {
          // not latched: a later hydrate (or "Try again") re-reads the real record
          hydration = null;
          return { ...entries };
        }
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

/**
 * Idempotent, interruption-safe boot-time migration of every entry's note saved as plain text before field-level
 * encryption existed. Works on the PERSISTED record only (never on the store's memoised in-memory state): see
 * services/legacyFieldMigration.ts. Unreadable/unavailable record -> nothing is written, the next launch retries.
 */
export async function migrateLegacyPlainPostpartumLochiaNotes(): Promise<void> {
  const outcome = await migrateRecordSafely(STORAGE_KEY, async parsed => {
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {return null;}
    const candidate = parsed as Record<string, unknown>;
    const wrapped = !!candidate.entries && typeof candidate.entries === 'object';
    const sealed = await sealMapFields(wrapped ? candidate.entries : candidate, ['note'], value =>
      sealField(ENCRYPTION_SERVICE, value),
    );
    if (!sealed) {return null;}
    // `tracking` (and any other metadata) is carried over untouched.
    return wrapped ? {...candidate, entries: sealed} : sealed;
  });
  // Same observable behaviour as before: a store whose record was just migrated is loaded (read-only) afterwards.
  if (outcome === 'migrated') {
    await hydratePostpartumLochia();
  }
}
