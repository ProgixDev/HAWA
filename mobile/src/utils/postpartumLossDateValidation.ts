import {diffDays, startOfDay} from './cycleMath';

// Pure date-coherence checks for the Postpartum delivery date and the
// Pregnancy-loss date, shared by the (onboarding AND edit-mode) date screens so
// a correction can never save a date the rest of the tracking contradicts.
// Only ORDER relations between dates the user already entered — no medical or
// religious rule.

export type DateValidation = {valid: true} | {valid: false; message: string};

const parseKey = (value: string | null | undefined): Date | null => {
  if (!value) {return null;}
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
};

/** A pregnancy-loss date: never in the future. */
export function validateLossDate(date: Date, now: Date): DateValidation {
  if (diffDays(startOfDay(date), startOfDay(now)) > 0) {
    return {valid: false, message: 'La date de la fausse couche ne peut pas être dans le futur.'};
  }
  return {valid: true};
}

/** The end date of the lochia tracking: never in the future, never BEFORE the
 * delivery date, and never AFTER a first postpartum period already recorded
 * (the cycle-return screen enforces the mirror rule: first period >= lochia
 * end). A recorded first period is never moved or deleted to make a date fit —
 * the user is asked to correct it first. Only ORDER relations, no medical or
 * religious rule. */
export function validateLochiaEndDate(params: {
  date: Date;
  now: Date;
  deliveryDate: string | null;
  firstPostpartumPeriodDate: string | null;
}): DateValidation {
  const day = startOfDay(params.date);
  if (diffDays(day, startOfDay(params.now)) > 0) {
    return {valid: false, message: 'La date de fin des lochies ne peut pas être dans le futur.'};
  }
  const delivery = parseKey(params.deliveryDate);
  if (delivery && diffDays(day, delivery) < 0) {
    return {valid: false, message: 'La date de fin des lochies ne peut pas précéder ta date d’accouchement.'};
  }
  const firstPeriod = parseKey(params.firstPostpartumPeriodDate);
  if (firstPeriod && diffDays(day, firstPeriod) > 0) {
    return {
      valid: false,
      message: 'Cette date est postérieure à la date de reprise des règles déjà enregistrée. Choisis une date antérieure ou corrige d’abord le retour du cycle.',
    };
  }
  return {valid: true};
}

/** True when a stored postpartum date (first period, lochia end) can belong to
 * the journey whose delivery is `currentDeliveryKey`: valid recordings are
 * always on/after their own delivery, so a value dated BEFORE it comes from an
 * earlier journey and must not constrain edits of this delivery. With no
 * current delivery nothing can belong to it. Read-only: never deletes. */
export const belongsToCurrentDelivery = (
  valueKey: string | null | undefined,
  currentDeliveryKey: string | null | undefined,
): boolean => Boolean(valueKey && currentDeliveryKey && valueKey >= currentDeliveryKey);

/** A postpartum delivery date: never in the future, and never AFTER dates
 * already recorded relative to it (the first period since delivery, the end of
 * the lochia) — the same ordering the cycle-return screen already enforces the
 * other way round. */
export function validateDeliveryDate(params: {
  date: Date;
  now: Date;
  firstPostpartumPeriodDate: string | null;
  lochiaEndedDate: string | null;
  /** Pregnancy -> Postpartum transition only: the start of the CURRENT
   * pregnancy (its equivalent LMP, see pregnancyLmpFromDating). A delivery
   * cannot precede the pregnancy it ends — a chronological-consistency bound
   * only, no medical threshold. Omitted by the standalone Postpartum
   * onboarding / edit flows, which have no pregnancy context. */
  pregnancyStartDate?: Date | null;
}): DateValidation {
  const day = startOfDay(params.date);
  if (diffDays(day, startOfDay(params.now)) > 0) {
    return {valid: false, message: 'La date d’accouchement ne peut pas être dans le futur.'};
  }
  if (params.pregnancyStartDate && diffDays(day, startOfDay(params.pregnancyStartDate)) < 0) {
    return {valid: false, message: 'La date d’accouchement ne peut pas précéder le début de ta grossesse.'};
  }
  const firstPeriod = parseKey(params.firstPostpartumPeriodDate);
  if (firstPeriod && diffDays(day, firstPeriod) > 0) {
    return {
      valid: false,
      message: 'Cette date est postérieure à la date de reprise des règles déjà enregistrée. Corrige d’abord le retour du cycle.',
    };
  }
  const lochiaEnded = parseKey(params.lochiaEndedDate);
  if (lochiaEnded && diffDays(day, lochiaEnded) > 0) {
    return {
      valid: false,
      message: 'Cette date est postérieure à la fin des lochies déjà enregistrée. Vérifie d’abord le suivi des lochies.',
    };
  }
  return {valid: true};
}
