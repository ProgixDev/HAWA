import AsyncStorage from '@react-native-async-storage/async-storage';

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
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
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
      .then(raw => {
        hydrated = true;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (isValidEntries(parsed)) {
            entries = parsed;
            notifyListeners();
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
