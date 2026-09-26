import type {DailyJournalEntry} from '../types/journal';
import type {IrregularJournalEntry} from '../state/irregularJournalStore';
import type {ConfirmedPeriodOccurrence} from '../state/confirmedPeriodHistoryStore';
import {computeConfirmedPeriodDurationDays, parsePeriodStart} from './irregularDailyTrackingMath';

// Shared, pure read-side helpers for the SOPK ("Cycles irréguliers")
// objective. They exist so that Dashboard / Calendar / Statistics / Profile
// all answer the same three questions the same way, instead of each screen
// re-deriving (and disagreeing on) them:
//
//   1. Is this day an ACTUAL period day, spotting, or "no bleeding"?
//   2. Which associated symptoms were saved with the day's fatigue entry?
//   3. When did the user's most recent REAL period start?
//
// Nothing here predicts anything (no ovulation / fertility / regularity
// logic) and nothing here interprets spotting medically — it only tells the
// three already-existing states apart.

/* ============================================================
 * 1. Period day classification
 * ========================================================== */

export type IrregularPeriodDayKind = 'period' | 'spotting' | 'no-bleeding';

/** Classifies what the user recorded for one day's "Règles" question.
 *
 * The SOPK "Règles" answer is mirrored into the shared dailyJournalStore's
 * `flow` section (see IrregularJournalEntryScreen.tsx), where BOTH "Non" and
 * "Spotting" are stored as `intensity: 'none'` — so `flow` alone cannot tell
 * them apart, and `Boolean(flow.intensity)` is true for 'none' (a non-empty
 * string), which used to make both look like period days. The SOPK entry's own
 * `details.period.status` keeps the distinction, so it is consulted to tell
 * "spotting" from "no bleeding". A real flow intensity (light → veryHeavy) is
 * always a period day, whichever screen recorded it.
 *
 * Returns `null` when nothing was recorded for the day. */
export function classifyIrregularPeriodDay(
  flow: DailyJournalEntry['flow'] | undefined,
  irregularEntry: IrregularJournalEntry | undefined,
): IrregularPeriodDayKind | null {
  const status = irregularEntry?.details?.period?.status;

  if (flow?.intensity) {
    if (flow.intensity !== 'none') {return 'period';}
    return status === 'spotting' ? 'spotting' : 'no-bleeding';
  }

  // No shared flow record (e.g. it could not be written): fall back on the
  // SOPK entry's own answer.
  if (status === 'yes') {return 'period';}
  if (status === 'spotting') {return 'spotting';}
  if (status === 'no') {return 'no-bleeding';}
  return null;
}

export const isActualPeriodDay = (
  flow: DailyJournalEntry['flow'] | undefined,
  irregularEntry: IrregularJournalEntry | undefined,
): boolean => classifyIrregularPeriodDay(flow, irregularEntry) === 'period';

/** Date keys (YYYY-MM-DD) of every day that is an actual period day. */
export function collectActualPeriodDayKeys(
  journalEntries: readonly DailyJournalEntry[],
  irregularEntriesByDate: Readonly<Record<string, IrregularJournalEntry>>,
): string[] {
  const flowByDate = new Map<string, DailyJournalEntry['flow']>();
  journalEntries.forEach(entry => flowByDate.set(entry.date, entry.flow));
  const keys = new Set<string>([...flowByDate.keys(), ...Object.keys(irregularEntriesByDate)]);
  return Array.from(keys)
    .filter(key => isActualPeriodDay(flowByDate.get(key), irregularEntriesByDate[key]))
    .sort();
}

/* ============================================================
 * 2. Fatigue associated symptoms — one canonical shape
 * ========================================================== */

/** The associated symptoms saved with a day's "Fatigue & symptômes" entry.
 *
 * Canonical location: the entry's top-level `symptoms` (what Calendar,
 * Statistics and the store's own types document, and what
 * saveIrregularFatigueEntry writes). An intermediate version of the journal
 * screen wrote them to `details.fatigue.symptoms` instead, so existing
 * devices may hold entries in that older place; those are still READ here
 * (never rewritten in place — the store only moves them to the canonical
 * location the next time that day's fatigue entry is saved). */
export function getIrregularFatigueSymptoms(entry: IrregularJournalEntry | undefined): string[] {
  if (!entry) {return [];}
  return entry.symptoms ?? entry.details?.fatigue?.symptoms ?? [];
}

/* ============================================================
 * 2b. "Aucune" is an ANSWER, not a symptom
 * ========================================================== */

/** The explicit "no symptom" answer offered by the SOPK acne / hair growth /
 * pain / fatigue journals (IrregularJournalEntryScreen.tsx's ACNE_OPTIONS,
 * HAIR_OPTIONS, IRREGULAR_INTENSITY_OPTIONS...). It is a real, stored answer
 * (the day IS tracked / answered) but it is NOT a positive symptom occurrence:
 * it must never feed "jours avec ...", frequencies, Calendar markers or
 * monthly summaries. Presence-based "answered / completed" logic (Dashboard
 * "Suivi du jour", tracked days, the selected-day card) keeps using the plain
 * truthiness of the stored value. */
export const IRREGULAR_NO_SYMPTOM_ANSWER = 'Aucune';

/** True when a stored category answer reports something: non-empty and not the
 * explicit "Aucune". */
export function isIrregularSymptomAnswer(value: string | null | undefined): boolean {
  const normalized = value?.trim();
  return Boolean(normalized) && normalized!.toLowerCase() !== IRREGULAR_NO_SYMPTOM_ANSWER.toLowerCase();
}

/** Categories that can hold a positive occurrence on a day. */
export type IrregularOccurrenceCategory = 'acne' | 'hairGrowth' | 'pain' | 'fatigue' | 'mood' | 'weight';

/** Whether the entry holds a POSITIVE occurrence for `category`: a real
 * answer other than "Aucune". Mood (no "Aucune" option) and weight (free
 * measurement) are simply "recorded". For the combined "Fatigue & symptômes"
 * category, a real associated symptom selected on the day also counts, even
 * when the fatigue level itself is "Aucune". */
export function hasIrregularCategoryOccurrence(
  entry: IrregularJournalEntry | undefined,
  category: IrregularOccurrenceCategory,
): boolean {
  if (!entry) {return false;}
  if (isIrregularSymptomAnswer(entry[category])) {return true;}
  if (category === 'fatigue') {
    return getIrregularFatigueSymptoms(entry).some(isIrregularSymptomAnswer);
  }
  return false;
}

/* ============================================================
 * 3. Real period starts
 * ========================================================== */

/** Two period days closer together than this are treated as the same period
 * (a period recorded on several days, some of them possibly not logged), not
 * as a new one. Reuses the plausibility floor AWA already applies to
 * observed cycle lengths (onboardingPreferences.ts keeps only 15–90 day
 * start-to-start gaps) — not a new medical threshold. */
export const MIN_DAYS_BETWEEN_PERIOD_STARTS = 15;

const DAY_MS = 86_400_000;

const toKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const keyToDate = (key: string): Date => new Date(`${key}T12:00:00`);

const keyDiffDays = (laterKey: string, earlierKey: string): number =>
  Math.round((keyToDate(laterKey).getTime() - keyToDate(earlierKey).getTime()) / DAY_MS);

export type IrregularPeriodEpisode = {
  /** First recorded period day (YYYY-MM-DD). */
  start: string;
  /** Last recorded period day of the episode (YYYY-MM-DD). */
  end: string;
  /** Inclusive span start → end, in days. */
  spanDays: number;
};

/** Groups recorded period days into periods. The first day of each group is a
 * real period START. Only actual period days go in (see
 * collectActualPeriodDayKeys) — "Non" and "Spotting" never start a period. */
export function deriveIrregularPeriodEpisodes(periodDayKeys: readonly string[]): IrregularPeriodEpisode[] {
  const sorted = Array.from(new Set(periodDayKeys)).sort();
  const episodes: IrregularPeriodEpisode[] = [];
  sorted.forEach(key => {
    const current = episodes[episodes.length - 1];
    if (current && keyDiffDays(key, current.start) < MIN_DAYS_BETWEEN_PERIOD_STARTS) {
      current.end = key;
      current.spanDays = keyDiffDays(key, current.start) + 1;
      return;
    }
    episodes.push({start: key, end: key, spanDays: 1});
  });
  return episodes;
}

/** Local YYYY-MM-DD of a confirmed occurrence's start (stored as a full ISO
 * datetime — see confirmedPeriodHistoryStore.ts). null when unparseable. */
export function confirmedOccurrenceStartKey(occurrence: ConfirmedPeriodOccurrence): string | null {
  const parsed = parsePeriodStart(occurrence.periodStart);
  return Number.isNaN(parsed.getTime()) ? null : toKey(parsed);
}

export type IrregularPeriodSources = {
  /** Actual period days recorded through the SOPK / shared journal. */
  periodDayKeys: readonly string[];
  /** Cycle-confirmed occurrences (start AND confirmed end). */
  confirmedHistory: readonly ConfirmedPeriodOccurrence[];
  /** The onboarding answer "Quand ont commencé tes dernières règles ?". */
  declaredLastPeriodDate: string | null;
};

/** Every real period start the app knows about, oldest first, each period
 * once: starts derived from recorded period days, confirmed occurrences and
 * the user's own onboarding answer. `asOfKey` drops anything after that day.
 * confirmedPeriodHistory is only READ — a period that merely started (no
 * confirmed end) is never written into it. */
export function resolveIrregularPeriodStarts(sources: IrregularPeriodSources, asOfKey?: string): string[] {
  const candidates: string[] = [
    ...deriveIrregularPeriodEpisodes(sources.periodDayKeys).map(episode => episode.start),
    ...sources.confirmedHistory.map(confirmedOccurrenceStartKey).filter((key): key is string => key !== null),
  ];
  if (sources.declaredLastPeriodDate) {candidates.push(sources.declaredLastPeriodDate);}

  const starts: string[] = [];
  Array.from(new Set(candidates))
    .filter(key => !asOfKey || key <= asOfKey)
    .sort()
    .forEach(key => {
      const previous = starts[starts.length - 1];
      if (previous && keyDiffDays(key, previous) < MIN_DAYS_BETWEEN_PERIOD_STARTS) {return;}
      starts.push(key);
    });
  return starts;
}

/** The most recent real period start — the reference for "Jour N du cycle". */
export function resolveLatestIrregularPeriodStart(sources: IrregularPeriodSources, asOfKey?: string): string | null {
  const starts = resolveIrregularPeriodStarts(sources, asOfKey);
  return starts.length ? starts[starts.length - 1] : null;
}

/** Duration of the most recent period, only when it can be stated from real
 * data: a confirmed occurrence with a confirmed end, or a recorded period
 * that is over (its last recorded day is before today). An ongoing period
 * has no duration yet — never a fabricated one. */
export function resolveLatestIrregularPeriodDuration(
  sources: IrregularPeriodSources,
  todayKey: string,
): number | null {
  const latestStart = resolveLatestIrregularPeriodStart(sources, todayKey);
  if (!latestStart) {return null;}

  const sameEpisode = (key: string): boolean => {
    const gap = keyDiffDays(key, latestStart);
    return gap >= 0 && gap < MIN_DAYS_BETWEEN_PERIOD_STARTS;
  };

  const confirmed = sources.confirmedHistory.find(occurrence => {
    const key = confirmedOccurrenceStartKey(occurrence);
    return key !== null && sameEpisode(key);
  });
  if (confirmed) {return computeConfirmedPeriodDurationDays(confirmed);}

  const episode = deriveIrregularPeriodEpisodes(sources.periodDayKeys).find(item => sameEpisode(item.start));
  return episode && episode.end < todayKey ? episode.spanDays : null;
}
