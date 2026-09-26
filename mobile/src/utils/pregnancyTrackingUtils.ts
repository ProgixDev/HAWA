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
export const PREGNANCY_TOTAL_DAYS = 280;
/** 40 weeks — the same timeline expressed in weeks. */
export const PREGNANCY_TOTAL_WEEKS = PREGNANCY_TOTAL_DAYS / 7;
// Standard offset from estimated conception back to the equivalent LMP
// (last menstrual period) date, same convention obstetric due-date
// calculators use. Deliberately NOT the same computation as Cycle's
// ovulation prediction (ovulationDayFor) — this project's Cycle ovulation
// logic estimates a FUTURE ovulation from average cycle length, whereas
// this is a fixed backward offset from an already-known conception date.
export const CONCEPTION_TO_LMP_OFFSET_DAYS = 14;

/** The equivalent LMP (start of the 280-day timeline) for a dating value —
 * the ONE place each dating method is normalized, shared by
 * computePregnancyStatus and the dating validation
 * (pregnancyDatingValidation.ts) so they can never disagree. */
export function pregnancyLmpFromDating(
  datingMethod: Exclude<PregnancyDatingMethod, 'later'>,
  datingDate: Date,
): Date {
  const day = startOfDay(datingDate);
  if (datingMethod === 'lastPeriod') {
    return day;
  }
  if (datingMethod === 'conceptionDate') {
    return addDays(day, -CONCEPTION_TO_LMP_OFFSET_DAYS);
  }
  // dueDate
  return addDays(day, -PREGNANCY_TOTAL_DAYS);
}

/** French label for a trimester — the single wording used by every Pregnancy
 * screen ("1er trimestre", "2e trimestre", "3e trimestre"). */
export const formatPregnancyTrimester = (trimester: 1 | 2 | 3): string =>
  trimester === 1 ? '1er trimestre' : `${trimester}e trimestre`;

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

  const lmpDate = pregnancyLmpFromDating(datingMethod, datingDate);

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

/** Label for the "Semaine N sur 40" progress line. `status.week` is 1-indexed
 * (day 0 of gestation = week 1), so at the exact 280-day boundary
 * (40 SA + 0 jours) it is 41 � the post-term week the reference data
 * (data/pregnancyWeekData.ts) already contains. "Semaine 41 sur 40" contradicts
 * itself, so from that point the line reads "Terme atteint" (wording already
 * used by the week-40 reference content). Nothing else about the dating
 * semantics changes: week, SA + jours, % and remaining weeks are untouched.
 * PRODUCT DECISION REQUIRED (not decided here): how AWA should present
 * progress AFTER the 40-week boundary � computePregnancyStatus clamps elapsed
 * days at 280, so every later day still reads 40 SA + 0 jours / week 41. */
export const formatPregnancyProgressLabel = (status: PregnancyStatus): string =>
  status.week > PREGNANCY_TOTAL_WEEKS
    ? 'Terme atteint'
    : `Semaine ${status.week} sur ${PREGNANCY_TOTAL_WEEKS}`;

/** Whether a stored postpartum delivery date ('YYYY-MM-DD') belongs to the
 * CURRENT pregnancy, as opposed to being left over from an earlier journey.
 * A new pregnancy can only start after the previous delivery, so a delivery
 * dated BEFORE the current pregnancy's (equivalent) start is history of a
 * previous journey and must not make this pregnancy look already delivered
 * (that would hide "J'ai accouch�" and skip the delivery-date step). Only a
 * chronological comparison against the existing dating � no invented
 * identifier. DATA-MODEL DECISION REQUIRED (behaviour kept): while the current
 * pregnancy has no dating yet ('later') nothing dates it, so a stored delivery
 * date cannot be attributed to a journey and is still taken as confirmed. */
export function isDeliveryOfCurrentPregnancy(
  deliveryDate: string | null | undefined,
  dating: {method: PregnancyDatingMethod; date: string | null},
): boolean {
  if (!deliveryDate) {return false;}
  const delivery = new Date(`${deliveryDate}T12:00:00`);
  if (Number.isNaN(delivery.getTime())) {return false;}
  if (dating.method === 'later' || !dating.date) {return true;}
  const datingDate = new Date(dating.date);
  if (Number.isNaN(datingDate.getTime())) {return true;}
  return diffDays(startOfDay(delivery), pregnancyLmpFromDating(dating.method, datingDate)) >= 0;
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
      // An entry's `date` is an OPTIONAL user-chosen reference date (e.g.
      // "date of an exam mentioned in the note") — not "the day this was
      // saved." `updatedAt` is always set to the real save timestamp, so
      // it's the correct field to check against `todayKey` — same "was this
      // touched today" semantics as every other case above.
      return pregnancyJournal.medicalInformationHistory.some(
        entry => new Date(entry.updatedAt).toLocaleDateString('en-CA') === todayKey,
      );
    }
    case 'appointments':
      return events.some(event => event.date === todayKey);
    default:
      return false;
  }
}
