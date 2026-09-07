import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  decryptFieldValue,
  encryptFieldValue,
  isEncryptedFieldPayload,
} from '../services/atRestFieldEncryption';

// Canonical per-day tracking store for the "Cycles irréguliers / SOPK"
// objective — same module-singleton + AsyncStorage pattern as
// postpartumJournalStore.ts. Deliberately a NEW, separate store rather than
// reusing the shared Cycle dailyJournalStore.ts: that store also carries a
// large surface of Cycle/fertility-specific fields (flow.periodStart,
// intimacy, lhTest, cervicalMucus, ...) that must never leak into SOPK's UI
// (objective isolation), and SOPK's own vocabulary (acné/pilosité/poids/
// douleurs/humeur/fatigue as 5-point neutral scales) doesn't map cleanly onto
// any existing field there except loosely mood/weight. "Règles" is
// deliberately NOT a field here — recording a period start/flow already has
// one canonical home (the shared dailyJournalStore's `flow` section, written
// by src/screens/journal/MenstrualFlowScreen.tsx, already read everywhere
// else in the app for Calendar/Statistics) and must not gain a second,
// divergent SOPK-only copy.

export type IrregularJournalCategory = 'acne' | 'hairGrowth' | 'weight' | 'pain' | 'mood' | 'fatigue';

// `period` uses the same visual entry screen as the other SOPK categories,
// while the actual flow remains mirrored to dailyJournalStore so the existing
// Cycle calendar and predictions keep their one canonical period record.
export type IrregularJournalRouteCategory = IrregularJournalCategory | 'period';

export type IrregularJournalDetails = {
  note?: string;
  areas?: string[];
  symptoms?: string[];
  status?: 'yes' | 'no' | 'spotting';
  flowIntensity?: string;
  painLevel?: string;
  weightFeeling?: string;
};

export type IrregularJournalEntry = {
  date: string;
  acne?: string;
  hairGrowth?: string;
  weight?: string;
  pain?: string;
  mood?: string;
  fatigue?: string;
  /** Optional multi-selected "symptômes associés" for the combined
   * "Fatigue & symptômes" journal category — a sibling of `fatigue`, not a
   * separate IrregularJournalCategory, since both are saved together from
   * one screen/one CTA (see saveIrregularFatigueEntry below). May be an
   * empty array — that still means "explicitly saved, nothing else to
   * report", never "not recorded". */
  symptoms?: string[];
  /**
   * Optional UI detail retained alongside the compact canonical summary
   * strings above. Keeping summaries as strings preserves existing calendar,
   * statistics and export readers while allowing the SOPK forms to restore
   * the user's selected zones, note and secondary choices on return.
   */
  details?: Partial<Record<IrregularJournalRouteCategory, IrregularJournalDetails>>;
  /** A compact period summary for the SOPK journal list only. */
  period?: string;
};

type EntriesByDate = Record<string, IrregularJournalEntry>;

const STORAGE_KEY = '@hawa/irregular-journal/v1';

// Encrypts only the free-text `note` nested per-category inside `details`.
// Every other field (compact summary strings, areas/symptoms selections,
// status/intensity choices) is structured, non-sensitive selection data and
// stays plaintext, matching the project's existing encryption scope.
const ENCRYPTION_SERVICE = 'com.hawa.private.irregular-journal.encryption-key';

async function encryptEntryForStorage(entry: IrregularJournalEntry): Promise<Record<string, unknown>> {
  const output: Record<string, unknown> = {...entry};
  if (entry.details) {
    const encryptedDetails: Record<string, unknown> = {};
    for (const [category, detail] of Object.entries(entry.details)) {
      if (!detail) {continue;}
      const detailOutput: Record<string, unknown> = {...detail};
      if (typeof detail.note === 'string' && detail.note.length > 0) {
        detailOutput.note = await encryptFieldValue(ENCRYPTION_SERVICE, detail.note);
      } else {
        delete detailOutput.note;
      }
      encryptedDetails[category] = detailOutput;
    }
    output.details = encryptedDetails;
  }
  return output;
}

async function decryptEntryFromStorage(raw: Record<string, unknown>): Promise<IrregularJournalEntry> {
  const output: Record<string, unknown> = {...raw};
  const rawDetails = raw.details;
  if (rawDetails && typeof rawDetails === 'object') {
    const decryptedDetails: Record<string, unknown> = {};
    for (const [category, detail] of Object.entries(rawDetails as Record<string, unknown>)) {
      if (!detail || typeof detail !== 'object') {continue;}
      const detailOutput: Record<string, unknown> = {...(detail as Record<string, unknown>)};
      const noteValue = (detail as Record<string, unknown>).note;
      if (isEncryptedFieldPayload(noteValue)) {
        try {
          detailOutput.note = await decryptFieldValue<string>(ENCRYPTION_SERVICE, noteValue);
        } catch {
          delete detailOutput.note;
        }
      }
      decryptedDetails[category] = detailOutput;
    }
    output.details = decryptedDetails;
  }
  return output as IrregularJournalEntry;
}

let entries: EntriesByDate = {};
const listeners = new Set<() => void>();
let hydration: Promise<EntriesByDate> | null = null;
let hydrated = false;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

function isValidEntry(value: unknown): value is IrregularJournalEntry {
  if (!value || typeof value !== 'object') {return false;}
  const candidate = value as Partial<IrregularJournalEntry>;
  return typeof candidate.date === 'string';
}

function isValidEntries(value: unknown): value is EntriesByDate {
  if (!value || typeof value !== 'object') {return false;}
  return Object.values(value as Record<string, unknown>).every(isValidEntry);
}

async function persist(): Promise<void> {
  const serializable: Record<string, unknown> = {};
  for (const [date, entry] of Object.entries(entries)) {
    serializable[date] = await encryptEntryForStorage(entry);
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

export function getIrregularJournalEntry(date: string): IrregularJournalEntry | undefined {
  return entries[date];
}

export function getAllIrregularJournalEntries(): EntriesByDate {
  return {...entries};
}

/** THE single canonical way to persist a SOPK daily-tracking field — used by
 * IrregularJournalEntryScreen.tsx only. Upserts the given category for the
 * given date, preserving every other field already recorded that day. */
export async function saveIrregularJournalField<K extends IrregularJournalCategory>(
  date: string,
  category: K,
  value: NonNullable<IrregularJournalEntry[K]>,
): Promise<void> {
  const current = entries[date] ?? {date};
  entries = {...entries, [date]: {...current, [category]: value}};
  notifyListeners();
  await persist();
}

/**
 * Saves a SOPK form's compact summary and its optional presentation details
 * together. This extends the existing per-day record without changing the
 * original scalar fields consumed by Calendar, Statistics and exports.
 */
export async function saveIrregularJournalEntry(
  date: string,
  category: IrregularJournalRouteCategory,
  value: string,
  details: IrregularJournalDetails,
): Promise<void> {
  const current = entries[date] ?? {date};
  entries = {
    ...entries,
    [date]: {
      ...current,
      [category]: value,
      details: {...current.details, [category]: details},
    },
  };
  notifyListeners();
  await persist();
}

/** Upserts BOTH fields of the combined "Fatigue & symptômes" journal
 * category in one atomic save — same upsert-merge semantics as
 * saveIrregularJournalField above, kept as a separate function only because
 * `symptoms` is a string[], not a single-value IrregularJournalCategory.
 * Used by IrregularJournalEntryScreen.tsx only. */
export async function saveIrregularFatigueEntry(
  date: string,
  fatigue: string,
  symptoms: string[],
): Promise<void> {
  const current = entries[date] ?? {date};
  entries = {...entries, [date]: {...current, fatigue, symptoms}};
  notifyListeners();
  await persist();
}

export function hydrateIrregularJournal(): Promise<EntriesByDate> {
  if (hydrated) {
    return Promise.resolve(getAllIrregularJournalEntries());
  }
  if (!hydration) {
    hydration = AsyncStorage.getItem(STORAGE_KEY)
      .then(async raw => {
        hydrated = true;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            const decrypted: EntriesByDate = {};
            for (const [date, rawEntry] of Object.entries(parsed as Record<string, unknown>)) {
              if (!rawEntry || typeof rawEntry !== 'object') {continue;}
              const decryptedEntry = await decryptEntryFromStorage(rawEntry as Record<string, unknown>);
              if (isValidEntry(decryptedEntry)) {
                decrypted[date] = decryptedEntry;
              }
            }
            if (isValidEntries(decrypted)) {
              entries = decrypted;
              notifyListeners();
            }
          }
        }
        return getAllIrregularJournalEntries();
      })
      .catch(() => {
        hydrated = true;
        return getAllIrregularJournalEntries();
      });
  }
  return hydration;
}

export function subscribeIrregularJournal(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Idempotent boot-time migration: re-saves any entry whose per-category
 * `details[category].note` is still a plain string, encrypting it via the
 * same at-rest scheme as every other sensitive journal field. No-ops if no
 * plaintext note is found (safe to call on every app launch).
 */
export async function migrateLegacyPlainIrregularNotes(): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {return;}
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') {return;}
  const hasLegacyPlainNote = Object.values(parsed as Record<string, unknown>).some(rawEntry => {
    if (!rawEntry || typeof rawEntry !== 'object') {return false;}
    const rawDetails = (rawEntry as Record<string, unknown>).details;
    if (!rawDetails || typeof rawDetails !== 'object') {return false;}
    return Object.values(rawDetails as Record<string, unknown>).some(detail => {
      if (!detail || typeof detail !== 'object') {return false;}
      return typeof (detail as Record<string, unknown>).note === 'string';
    });
  });
  if (!hasLegacyPlainNote) {return;}
  await hydrateIrregularJournal();
  await persist();
}
