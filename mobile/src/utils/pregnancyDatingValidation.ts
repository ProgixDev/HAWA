import {addDays, startOfDay} from './cycleMath';
import type {PregnancyDatingMethod} from '../state/pregnancyPreferences';
import {
  CONCEPTION_TO_LMP_OFFSET_DAYS,
  PREGNANCY_TOTAL_DAYS,
  pregnancyLmpFromDating,
} from './pregnancyTrackingUtils';

// Pure validation for the pregnancy dating value entered in
// PregnancyDatingSetupScreen. It is derived from the SAME 280-day timeline
// computePregnancyStatus uses (pregnancyLmpFromDating normalizes every dating
// method to an equivalent LMP), so what the screen accepts is exactly what the
// Dashboard / Statistics / Calendar / Week screen can represent:
//
//   0 <= (today - equivalentLMP) <= 280 days
//
// On top of that, an LMP or a conception date is something that already
// happened, so neither may be in the future (a conception date up to 14 days
// ahead would still fit the timeline arithmetically — but is not a real past
// event). A due date is legitimately in the future.

export type PregnancyDatingIssue = 'missing' | 'future' | 'tooOld' | 'pastDue' | 'tooFar';

export type PregnancyDatingValidation =
  | {valid: true}
  | {valid: false; issue: PregnancyDatingIssue; message: string};

export type PregnancyDatingRange = {min: Date; max: Date};

const METHOD_LABEL: Record<Exclude<PregnancyDatingMethod, 'later'>, string> = {
  lastPeriod: 'Le premier jour de tes dernières règles',
  conceptionDate: 'La date de conception',
  dueDate: 'La date prévue d’accouchement',
};

const OFFSET_DAYS: Record<Exclude<PregnancyDatingMethod, 'later'>, number> = {
  lastPeriod: 0,
  conceptionDate: CONCEPTION_TO_LMP_OFFSET_DAYS,
  dueDate: PREGNANCY_TOTAL_DAYS,
};

/** The selectable date range for a dating method, or null for 'later' (no
 * date). Used both as the date-picker bounds and by validatePregnancyDatingDate
 * so the two can never drift apart. */
export function getPregnancyDatingRange(
  method: PregnancyDatingMethod,
  now: Date,
): PregnancyDatingRange | null {
  if (method === 'later') {
    return null;
  }
  const today = startOfDay(now);
  // equivalent LMP in [today - 280d, today]  =>  date = LMP + offset
  const offset = OFFSET_DAYS[method];
  const min = addDays(today, -PREGNANCY_TOTAL_DAYS + offset);
  const timelineMax = addDays(today, offset);
  // an LMP / a conception is a past event: never after today
  const max = method === 'dueDate' ? timelineMax : today;
  return {min, max};
}

export function validatePregnancyDatingDate(
  method: PregnancyDatingMethod,
  date: Date | null,
  now: Date,
): PregnancyDatingValidation {
  if (method === 'later') {
    return {valid: true};
  }
  if (!date || Number.isNaN(date.getTime())) {
    return {valid: false, issue: 'missing', message: 'Choisis une date pour continuer.'};
  }

  const range = getPregnancyDatingRange(method, now);
  if (!range) {
    return {valid: true};
  }
  const day = startOfDay(date);
  const label = METHOD_LABEL[method];

  if (method !== 'dueDate' && day.getTime() > range.max.getTime()) {
    return {valid: false, issue: 'future', message: `${label} ne peut pas être dans le futur.`};
  }
  if (day.getTime() < range.min.getTime()) {
    return method === 'dueDate'
      ? {
          valid: false,
          issue: 'pastDue',
          message: `${label} est déjà passée. Choisis une date à partir d’aujourd’hui.`,
        }
      : {
          valid: false,
          issue: 'tooOld',
          message: 'Cette date est trop ancienne : elle correspond à une grossesse de plus de 40 semaines.',
        };
  }
  if (day.getTime() > range.max.getTime()) {
    return {
      valid: false,
      issue: 'tooFar',
      message: 'Cette date est trop éloignée : elle dépasse une grossesse de 40 semaines.',
    };
  }

  // Belt and braces: the accepted value must give a status the app can show.
  const lmp = pregnancyLmpFromDating(method, day);
  const elapsed = Math.round((startOfDay(now).getTime() - lmp.getTime()) / 86_400_000);
  if (elapsed < 0 || elapsed > PREGNANCY_TOTAL_DAYS) {
    return {valid: false, issue: 'tooFar', message: 'Cette date ne correspond pas à une grossesse en cours.'};
  }
  return {valid: true};
}
