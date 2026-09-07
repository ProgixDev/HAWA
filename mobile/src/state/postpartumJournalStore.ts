import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  decryptFieldValue,
  encryptFieldValue,
  isEncryptedFieldPayload,
} from '../services/atRestFieldEncryption';

// Postpartum's OWN daily tracking store — deliberately separate from
// dailyJournalStore.ts (Cycle/shared mood-sleep-hydration-activity-note
// entries, which also carry Cycle-specific fields like `flow`/
// `temperature`/`intimacy` that must never leak into Postpartum) and from
// pregnancyJournalStore.ts. One entry per calendar day, keyed the same
// 'YYYY-MM-DD' way every other journal-style store in this project uses.
//
// Categories are Postpartum-specific (Fatigue / Sommeil / Humeur / Douleurs
// / Récupération physique) — a DIFFERENT shape from Pregnancy's Journal
// quotidien (Symptômes / Poids / Humeur / Sommeil / Informations médicales
// personnelles) by design; the two objectives track different things and
// must never share a category list or a store.
export type PostpartumJournalCategory = 'fatigue' | 'sleep' | 'mood' | 'pain' | 'physicalRecovery';

export type PostpartumJournalEntry = {
  date: string;
  fatigue?: string;
  sleep?: string;
  /** Optional sleep duration in hours (supports half-hours) — a secondary
   * field alongside `sleep` (quality); completion for "sleep" is still
   * governed only by `sleep` itself. */
  sleepDuration?: number;
  mood?: string;
  /** Optional free-text note attached to the day's mood — a secondary
   * field; completion for the "mood" category is still governed only by
   * `mood` itself. */
  moodNote?: string;
  pain?: string;
  physicalRecovery?: string;
};

// Bumped to v3 — Fatigue/Douleurs/Récupération physique is a different,
// incompatible shape from the previous v2 (Symptômes/Poids/Informations
// médicales) schema; a fresh key avoids any stale-field ambiguity rather
// than silently carrying over data under fields that no longer exist.
const STORAGE_KEY = '@hawa/postpartum-journal/v3';

type EntriesByDate = Record<string, PostpartumJournalEntry>;

let entries: EntriesByDate = {};
const listeners = new Set<() => void>();
let hydration: Promise<EntriesByDate> | null = null;
let hydrated = false;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const isValidEntry = (value: unknown): value is PostpartumJournalEntry => {
  if (!value || typeof value !== 'object') {return false;}
  const candidate = value as Partial<PostpartumJournalEntry>;
  if (typeof candidate.date !== 'string') {return false;}
  return (
    (candidate.fatigue === undefined || typeof candidate.fatigue === 'string') &&
    (candidate.sleep === undefined || typeof candidate.sleep === 'string') &&
    (candidate.sleepDuration === undefined || typeof candidate.sleepDuration === 'number') &&
    (candidate.mood === undefined || typeof candidate.mood === 'string') &&
    (candidate.moodNote === undefined || typeof candidate.moodNote === 'string') &&
    (candidate.pain === undefined || typeof candidate.pain === 'string') &&
    (candidate.physicalRecovery === undefined || typeof candidate.physicalRecovery === 'string')
  );
};

// Encryption at rest — `moodNote` (the day's free-text mood annotation) is
// this store's sensitive field; `fatigue`/`sleep`/`mood`/`pain`/
// `physicalRecovery` stay plaintext (structured tracking values). Encrypted
// ONLY at the AsyncStorage persistence boundary, same mechanism/reasoning as
// miscarriageJournalStore.ts — the in-memory `entries` object stays plain
// decrypted strings, so no screen needs to change.
const ENCRYPTION_SERVICE = 'com.hawa.private.postpartum-journal.encryption-key';
const SENSITIVE_FIELDS = ['moodNote'] as const;

async function encryptEntryForStorage(entry: PostpartumJournalEntry): Promise<Record<string, unknown>> {
  const output: Record<string, unknown> = {...entry};
  for (const field of SENSITIVE_FIELDS) {
    const value = entry[field];
    if (typeof value === 'string' && value.length > 0) {
      output[field] = await encryptFieldValue(ENCRYPTION_SERVICE, value);
    } else {
      delete output[field];
    }
  }
  return output;
}

async function decryptEntryFromStorage(raw: Record<string, unknown>): Promise<PostpartumJournalEntry> {
  const output: Record<string, unknown> = {...raw};
  for (const field of SENSITIVE_FIELDS) {
    const value = raw[field];
    if (isEncryptedFieldPayload(value)) {
      try {
        output[field] = await decryptFieldValue<string>(ENCRYPTION_SERVICE, value);
      } catch {
        delete output[field];
      }
    }
  }
  return output as PostpartumJournalEntry;
}

const persist = async () => {
  try {
    const serializable: Record<string, unknown> = {};
    for (const [date, entry] of Object.entries(entries)) {
      serializable[date] = await encryptEntryForStorage(entry);
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    // Never throw out of a save action — in-memory state is unaffected.
  }
};

export const getPostpartumJournalEntry = (date: string): PostpartumJournalEntry | undefined =>
  entries[date] ? {...entries[date]} : undefined;

/** Every entry, keyed by date — used by the Postpartum Calendar/Statistics
 * to derive counts/averages across a whole history without guessing dates
 * one by one. Mirrors dailyJournalStore's getAllJournalEntries. */
export const getAllPostpartumJournalEntries = (): EntriesByDate => ({...entries});

/** THE single canonical way to record a Postpartum daily-tracking answer —
 * used by PostpartumJournalEntryScreen (and nowhere else; do not duplicate
 * this call). Generic over the field so each category keeps its own real
 * type (number for sleepDuration, string elsewhere). */
export async function savePostpartumJournalField<K extends Exclude<keyof PostpartumJournalEntry, 'date'>>(
  date: string,
  category: K,
  value: NonNullable<PostpartumJournalEntry[K]>,
): Promise<void> {
  entries = {...entries, [date]: {...entries[date], date, [category]: value}};
  notifyListeners();
  await persist();
}

export const hydratePostpartumJournal = (): Promise<EntriesByDate> => {
  if (hydrated) {
    return Promise.resolve({...entries});
  }
  if (!hydration) {
    hydration = AsyncStorage.getItem(STORAGE_KEY)
      .then(async raw => {
        hydrated = true;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            const valid: EntriesByDate = {};
            for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
              if (!value || typeof value !== 'object') {continue;}
              const decrypted = await decryptEntryFromStorage(value as Record<string, unknown>);
              if (isValidEntry(decrypted)) {valid[key] = decrypted;}
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

export const subscribePostpartumJournal = (listener: () => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};

/** One-shot, idempotent, crash-safe migration for every day's `moodNote`
 * ever saved before encryption-at-rest existed — called once at app boot
 * (App.tsx). Checks the RAW persisted JSON for a plaintext `moodNote` so an
 * already-migrated store skips past without re-encrypting on every boot.
 * See migrateLegacyPlainMiscarriageNotes() in miscarriageJournalStore.ts for
 * the identical reasoning. */
export async function migrateLegacyPlainPostpartumMoodNotes(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {return;}
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {return;}
    const hasLegacyPlaintext = Object.values(parsed as Record<string, unknown>).some(entry => {
      if (!entry || typeof entry !== 'object') {return false;}
      return SENSITIVE_FIELDS.some(field => typeof (entry as Record<string, unknown>)[field] === 'string');
    });
    if (!hasLegacyPlaintext) {return;}

    await hydratePostpartumJournal();
    await persist();
  } catch {
    // Never throw out of a boot-time migration — next launch retries.
  }
}
