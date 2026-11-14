import AsyncStorage from '../services/secureAsyncStorage';
import {migrateRecordSafely, sealEntryFields, sealField} from '../services/legacyFieldMigration';
import type {DailyJournalEntry, JournalSection} from '../types/journal';
import {
  carrySealedField,
  decryptFieldValue,
  encryptFieldValue,
  isEncryptedFieldPayload,
  restoreSealedFields,
  withCarriedSealedFields,
} from '../services/atRestFieldEncryption';
import {getActiveProfileId, OWNER_PROFILE_ID} from './activeProfileStore';
import {getActiveObjective, hydrateActiveObjective, type ObjectiveId} from './onboardingPreferences';
import {profileScopedKey} from './profileScopedStorage';
import {MIGRATION_STATE_PREFIX} from '../services/storageKeyClassifier';

const STORAGE_KEY_BASE = '@hawa/daily-journal/v1';

// One daily journal PER OBJECTIVE: what is recorded under "Suivre mon cycle" (flow, mood, "Vie intime", notes, photos…) is never shown under
// "Essayer de concevoir" or any other objective, and each objective's records come back when she returns to it. 'cycle' keeps the
// ORIGINAL key (byte-identical, so existing data and every daughter profile — always "Suivre mon cycle" — need no migration); the
// other objectives get their own key. The storage key is bound into the encryption (structuredEncryption.ts), which is why moving
// records between keys re-encrypts them (see migrateDailyJournalToObjectives).
export const DAILY_JOURNAL_BASE_BY_OBJECTIVE: Readonly<Record<ObjectiveId, string>> = {
  cycle: '@hawa/daily-journal/v1',
  conceive: '@hawa/daily-journal/v1/conceive',
  contraception: '@hawa/daily-journal/v1/contraception',
  irregular: '@hawa/daily-journal/v1/irregular',
  menopause: '@hawa/daily-journal/v1/menopause',
  pregnancy: '@hawa/daily-journal/v1/pregnancy',
  postpartum: '@hawa/daily-journal/v1/postpartum',
  loss: '@hawa/daily-journal/v1/loss',
};

/** The objective whose journal is in use: the owner's current objective; a managed (daughter) profile only ever has "Suivre mon cycle". */
export const dailyJournalObjective = (): ObjectiveId => (getActiveProfileId() === OWNER_PROFILE_ID ? getActiveObjective() : 'cycle');

/** Base storage key (without profile suffix) of the journal in use. */
export const currentDailyJournalBase = (): string => DAILY_JOURNAL_BASE_BY_OBJECTIVE[dailyJournalObjective()];
// Profile-scoped (see profileScopedStorage.ts) — the mother's journal stays under
// the exact key above (no migration needed); every read/write below resolves the
// key FRESH from the CURRENT active profile, so this store needs no separate
// cache-invalidation-on-switch step (it never caches in memory — see readEntries()).
const currentStorageKey = () => profileScopedKey(currentDailyJournalBase(), getActiveProfileId());
// The owner's objective is read from storage at startup: wait for it so a read can never go to the wrong objective's journal.
const currentStorageKeyReady = async (): Promise<string> => {
  if (getActiveProfileId() === OWNER_PROFILE_ID) {await hydrateActiveObjective();}
  return currentStorageKey();
};

// Only these 9 nested per-category free-text `note` fields are sensitive
// narrative content — every other DailyJournalEntry field (severity/level/
// intensity enums, numeric values, booleans, arrays of tags) is structured
// selection data and stays plaintext. Distinct from, and never touching,
// this same entry's separately-encrypted `encryptedNote` ("Notes
// personnelles", privateNotesEncryption.ts) and `encryptedIntimacy` ("Vie
// intime", privateJournalEncryption.ts) fields, which arrive at this store
// already encrypted by their own dedicated services. `hydration` has no
// `note` field and is intentionally excluded.
const NOTE_SECTIONS = [
  'symptoms',
  'mood',
  'flow',
  'temperature',
  'sleep',
  'activity',
  'weight',
  'cervicalMucus',
  'lhTest',
] as const;

const ENCRYPTION_SERVICE = 'com.hawa.private.daily-journal.encryption-key';

async function encryptEntryForStorage(entry: DailyJournalEntry): Promise<Record<string, unknown>> {
  const output: Record<string, unknown> = {...entry};
  for (const section of NOTE_SECTIONS) {
    const value = entry[section] as Record<string, unknown> | undefined;
    if (!value || typeof value !== 'object') {continue;}
    const sectionCopy: Record<string, unknown> = {...value};
    if (typeof sectionCopy.note === 'string' && sectionCopy.note.length > 0) {
      sectionCopy.note = await encryptFieldValue(ENCRYPTION_SERVICE, sectionCopy.note);
    } else {
      delete sectionCopy.note;
    }
    // A note that could not be decrypted when this entry was read goes back as the sealed payload it was.
    output[section] = restoreSealedFields(sectionCopy);
  }
  return output;
}

async function decryptEntryFromStorage(raw: Record<string, unknown>): Promise<DailyJournalEntry> {
  const output: Record<string, unknown> = {...raw};
  for (const section of NOTE_SECTIONS) {
    const value = raw[section];
    if (!value || typeof value !== 'object') {continue;}
    const sectionCopy: Record<string, unknown> = {...(value as Record<string, unknown>)};
    const noteValue = sectionCopy.note;
    if (isEncryptedFieldPayload(noteValue)) {
      try {
        sectionCopy.note = await decryptFieldValue<string>(ENCRYPTION_SERVICE, noteValue);
      } catch {
        delete sectionCopy.note;
        carrySealedField(sectionCopy, 'note', noteValue);
      }
    }
    output[section] = sectionCopy;
  }
  return output as DailyJournalEntry;
}

const readEntries = async (): Promise<DailyJournalEntry[]> => {
  const raw = await AsyncStorage.getItem(await currentStorageKeyReady());
  if (!raw) {return [];}
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>[];
    return await Promise.all(parsed.map(entry => decryptEntryFromStorage(entry)));
  } catch {return [];}
};

const writeEntries = async (entries: DailyJournalEntry[]): Promise<void> => {
  const serializable = await Promise.all(entries.map(entry => encryptEntryForStorage(entry)));
  await AsyncStorage.setItem(await currentStorageKeyReady(), JSON.stringify(serializable));
};

export async function saveJournalSection<K extends JournalSection>(
  date: string,
  section: K,
  value: NonNullable<DailyJournalEntry[K]>,
): Promise<void> {
  const entries = await readEntries();
  const index = entries.findIndex(entry => entry.date === date);
  const current: DailyJournalEntry = index >= 0
    ? entries[index]
    : {id: `${date}-${Date.now()}`, date};
  // The caller's section replaces the stored one: a note that could not be read stays sealed unless she typed a new one.
  const updated = {...current, [section]: withCarriedSealedFields(current[section], value)};
  if (index >= 0) {entries[index] = updated;} else {entries.push(updated);}
  await writeEntries(entries);
}

export async function getJournalEntry(date: string): Promise<DailyJournalEntry | undefined> {
  const entries = await readEntries();
  return entries.find(entry => entry.date === date);
}

export async function getJournalEntriesForMonth(year: number, month: number): Promise<DailyJournalEntry[]> {
  const entries = await readEntries();
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return entries.filter(entry => entry.date.startsWith(prefix));
}

/** Every entry, regardless of month — used by screens that filter their own
 * date range client-side (e.g. Pregnancy Statistics' 7/30/all filter). */
export async function getAllJournalEntries(): Promise<DailyJournalEntry[]> {
  return readEntries();
}

export async function deleteJournalSection(date: string, section: JournalSection): Promise<void> {
  const entries = await readEntries();
  const index = entries.findIndex(entry => entry.date === date);
  if (index < 0) {return;}
  const updated = {...entries[index]};
  delete updated[section];
  entries[index] = updated;
  await writeEntries(entries);
}

/**
 * Idempotent, interruption-safe boot-time migration of every section's note saved as plain text before field-level
 * encryption existed. Works on the PERSISTED record only (never on the store's memoised in-memory state): see
 * services/legacyFieldMigration.ts. Unreadable/unavailable record -> nothing is written, the next launch retries.
 */
export async function migrateLegacyPlainDailyJournalNotes(): Promise<void> {
  await migrateRecordSafely(await currentStorageKeyReady(), async parsed => {
    if (!Array.isArray(parsed)) {return null;}
    let changed = false;
    const next: unknown[] = [];
    for (const rawEntry of parsed) {
      if (!rawEntry || typeof rawEntry !== 'object' || Array.isArray(rawEntry)) {
        next.push(rawEntry);
        continue;
      }
      const entry: Record<string, unknown> = {...(rawEntry as Record<string, unknown>)};
      for (const section of NOTE_SECTIONS) {
        const value = entry[section];
        if (!value || typeof value !== 'object' || Array.isArray(value)) {continue;}
        const sealed = await sealEntryFields(value as Record<string, unknown>, ['note'], note => sealField(ENCRYPTION_SERVICE, note), 'drop');
        if (sealed.changed) {
          entry[section] = sealed.value;
          changed = true;
        }
      }
      next.push(entry);
    }
    return changed ? next : null;
  });
}

// ============================================================================
// ONE-SHOT SPLIT OF THE FORMER SHARED JOURNAL
// ============================================================================

const ACTIVE_OBJECTIVE_STORAGE_KEY = '@hawa/active-objective';
const SPLIT_DONE_KEY = `${MIGRATION_STATE_PREFIX}daily-journal-objective-split/v1`;

export type DailyJournalSplitOutcome = 'not-needed' | 'migrated' | 'skipped' | 'conflict';

/**
 * Until now every objective shared the original journal key, which now belongs to "Suivre mon cycle". Run once at startup, this
 * re-attributes the OWNER's existing records to the objective she is on right now (a daughter's journal is always "Suivre mon
 * cycle", so it stays where it is), and the other objectives start empty. When she is on "Suivre mon cycle" nothing moves.
 *
 * Moving a record means reading it (decrypted) and writing it under the new key (encrypted for that key — the key is part of the
 * encryption), reading it back to prove it is identical, and only then removing the original. Anything unexpected leaves the
 * original untouched and the flag unset, so the next launch retries; no record is ever deleted before its copy is verified.
 */
export async function migrateDailyJournalToObjectives(): Promise<DailyJournalSplitOutcome> {
  try {
    if (await AsyncStorage.getItem(SPLIT_DONE_KEY)) {return 'not-needed';}

    // Read the stored objective ourselves: an unreadable record must never be mistaken for "no objective chosen yet".
    const storedObjective = await AsyncStorage.getItem(ACTIVE_OBJECTIVE_STORAGE_KEY);
    const objective = (storedObjective ?? 'cycle') as ObjectiveId;
    const target = DAILY_JOURNAL_BASE_BY_OBJECTIVE[objective];
    if (!target) {return 'skipped';}

    let outcome: DailyJournalSplitOutcome = 'not-needed';
    if (objective !== 'cycle') {
      const legacy = await AsyncStorage.getItem(STORAGE_KEY_BASE);
      if (legacy) {
        const existing = await AsyncStorage.getItem(target);
        if (existing && existing !== legacy) {return 'conflict';}
        if (!existing) {
          await AsyncStorage.setItem(target, legacy);
          if ((await AsyncStorage.getItem(target)) !== legacy) {
            await AsyncStorage.removeItem(target);
            return 'skipped';
          }
        }
        await AsyncStorage.removeItem(STORAGE_KEY_BASE);
        outcome = 'migrated';
      }
    }
    await AsyncStorage.setItem(SPLIT_DONE_KEY, 'done');
    return outcome;
  } catch {
    return 'skipped';
  }
}
