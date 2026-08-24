import {addDays, diffDays, startOfDay} from './cycleMath';
import type {PregnancyDatingMethod, PregnancyTrackingPreference} from '../state/pregnancyPreferences';
import type {PregnancyJournalState} from '../state/pregnancyJournalStore';
import type {PregnancyMedicalEvent} from '../state/pregnancyMedicalEventsStore';
import type {DailyJournalEntry} from '../types/journal';

export type PregnancyStatus = {
  /** false when datingMethod === 'later' or no date has been chosen yet —
   * every other field is then a safe, inert placeholder, never a fake
   * "real" value. */
  configured: boolean;
  gestationalWeeks: number;
  gestationalDays: number;
  /** "Semaine actuelle" — 1-indexed (day 0 of gestation is week 1). */
  week: number;
  trimester: 1 | 2 | 3;
  estimatedDueDate: Date | null;
  progressPercent: number;
  remainingDays: number;
  /** Whole weeks left until the estimated due date — `Math.floor(remainingDays / 7)`, paired with `remainingDaysRemainder` for a precise "X semaines + Y jours" display instead of a rounded approximation. */
  remainingWeeks: number;
  /** `remainingDays % 7` — the leftover days beyond `remainingWeeks` full weeks. */
  remainingDaysRemainder: number;
};

// Standard obstetric convention (40 weeks / 280 days), applied uniformly
// regardless of which dating method the user picked — this is what keeps
// the three methods from ever producing conflicting results.
const PREGNANCY_TOTAL_DAYS = 280;
// Standard offset from estimated conception back to the equivalent LMP
// (last menstrual period) date, same convention obstetric due-date
// calculators use. Deliberately NOT the same computation as Cycle's
// ovulation prediction (ovulationDayFor) — this project's Cycle ovulation
// logic estimates a FUTURE ovulation from average cycle length, whereas
// this is a fixed backward offset from an already-known conception date.
const CONCEPTION_TO_LMP_OFFSET_DAYS = 14;

const UNCONFIGURED_STATUS: PregnancyStatus = {
  configured: false,
  gestationalWeeks: 0,
  gestationalDays: 0,
  week: 0,
  trimester: 1,
  estimatedDueDate: null,
  progressPercent: 0,
  remainingDays: PREGNANCY_TOTAL_DAYS,
  remainingWeeks: Math.floor(PREGNANCY_TOTAL_DAYS / 7),
  remainingDaysRemainder: PREGNANCY_TOTAL_DAYS % 7,
};

/**
 * The ONE pregnancy calculation utility — every screen that needs
 * gestational week/trimester/DPA/progress must call this instead of
 * deriving its own formula, so they can never disagree.
 *
 * All three supported dating methods are normalized to a single internal
 * reference (the estimated LMP date) before computing anything, so
 * `lastPeriod`, `dueDate`, and `conceptionDate` all produce results on the
 * same, consistent 280-day timeline.
 */
export function computePregnancyStatus(
  datingMethod: PregnancyDatingMethod,
  datingDate: Date | null,
  now: Date,
): PregnancyStatus {
  if (datingMethod === 'later' || !datingDate || Number.isNaN(datingDate.getTime())) {
    return {...UNCONFIGURED_STATUS};
  }

  const today = startOfDay(now);

  let lmpDate: Date;
  if (datingMethod === 'lastPeriod') {
    lmpDate = startOfDay(datingDate);
  } else if (datingMethod === 'conceptionDate') {
    lmpDate = addDays(startOfDay(datingDate), -CONCEPTION_TO_LMP_OFFSET_DAYS);
  } else {
    // dueDate
    lmpDate = addDays(startOfDay(datingDate), -PREGNANCY_TOTAL_DAYS);
  }

  const elapsedDays = diffDays(today, lmpDate);
  const clampedElapsed = Math.max(0, Math.min(PREGNANCY_TOTAL_DAYS, elapsedDays));

  const gestationalWeeks = Math.floor(clampedElapsed / 7);
  const gestationalDays = clampedElapsed % 7;
  const week = gestationalWeeks + 1;
  const trimester: 1 | 2 | 3 = gestationalWeeks < 13 ? 1 : gestationalWeeks < 27 ? 2 : 3;
  const estimatedDueDate = addDays(lmpDate, PREGNANCY_TOTAL_DAYS);
  const remainingDays = Math.max(0, PREGNANCY_TOTAL_DAYS - clampedElapsed);
  const remainingWeeks = Math.floor(remainingDays / 7);
  const remainingDaysRemainder = remainingDays % 7;
  const progressPercent = Math.round((clampedElapsed / PREGNANCY_TOTAL_DAYS) * 100);

  return {
    configured: true,
    gestationalWeeks,
    gestationalDays,
    week,
    trimester,
    estimatedDueDate,
    progressPercent,
    remainingDays,
    remainingWeeks,
    remainingDaysRemainder,
  };
}

// Business rule: from this gestational week onward, pregnancy is considered
// "late stage" — the one place that decides when PregnancyDashboard's
// delivery-confirmation CTA ("J'ai accouché") may appear. Centralized here,
// next to computePregnancyStatus, so nothing else recomputes gestational
// week to answer the same question.
export const LATE_PREGNANCY_WEEK_THRESHOLD = 37;

export const isLatePregnancy = (status: PregnancyStatus): boolean =>
  status.configured && status.week >= LATE_PREGNANCY_WEEK_THRESHOLD;

/**
 * "Suivi du jour" completion — whether a given tracking category has a real
 * saved entry for `todayKey` ('YYYY-MM-DD'). The ONE place this is decided,
 * so PregnancyDashboard's "N / total complété" count can never drift from
 * what the journal screens actually persisted. Mood/sleep/hydration/notes/
 * activity live in the shared dailyJournalStore (same as Cycle); symptoms/
 * weight/medicalInfo live in pregnancyJournalStore; appointments come from
 * pregnancyMedicalEventsStore.
 */
export function isPregnancyTrackingCategoryCompleted(
  category: PregnancyTrackingPreference,
  todayKey: string,
  daily: DailyJournalEntry | undefined,
  pregnancyJournal: PregnancyJournalState,
  events: readonly PregnancyMedicalEvent[],
): boolean {
  switch (category) {
    case 'hydration':
      return Boolean(daily?.hydration);
    case 'mood':
      return Boolean(daily?.mood);
    case 'sleep':
      return Boolean(daily?.sleep);
    case 'activity':
      return Boolean(daily?.activity);
    case 'notes':
      return Boolean(daily?.note?.text?.trim());
    case 'weight':
      return pregnancyJournal.weights.some(entry => entry.date === todayKey);
    case 'symptoms':
      return pregnancyJournal.symptoms.some(entry => entry.date === todayKey);
    case 'medicalInfo': {
      // `medicalInformation.date` is an OPTIONAL user-chosen reference date
      // (e.g. "date of an exam mentioned in the note") — not "the day this
      // was saved." Using it here was the actual bug: saving today with no
      // reference date picked (the common case, since that field is
      // explicitly optional) left "Suivi du jour" showing this category as
      // not completed even though it was. `updatedAt` is always set to the
      // real save timestamp, so it's the correct field to check against
      // `todayKey` — same "was this touched today" semantics as every other
      // case above.
      const updatedAt = pregnancyJournal.medicalInformation?.updatedAt;
      if (!updatedAt) {return false;}
      return new Date(updatedAt).toLocaleDateString('en-CA') === todayKey;
    }
    case 'appointments':
      return events.some(event => event.date === todayKey);
    default:
      return false;
  }
}
