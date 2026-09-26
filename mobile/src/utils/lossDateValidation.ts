import {diffDays, formatFullDate, startOfDay} from './cycleMath';
import {validateLossDate} from './postpartumLossDateValidation';

// ONE shared, pure chronology model for the "Après une fausse couche" (loss)
// objective, used by every writer/reader of these dates:
//
//   loss date  <=  cycle-return date  <=  today        (return of the period)
//   loss date  <=  every dated journal entry <= today  (miscarriageJournalStore)
//
// "Dated data" means exactly: the cycle-return date (miscarriagePreferences.
// firstReturnedPeriodDate, only meaningful under cycleReturnStatus 'yes') and
// the per-day journal entries that hold real content (miscarriageJournalStore).
// Everything else (bleedingStatus, tryingAgainStatus, reminders) is a GLOBAL,
// UNDATED answer and never takes part in date-conflict detection.
//
// Only ORDER relations between dates the user already entered — no medical or
// religious rule. Nothing in here ever moves, deletes or corrects a stored
// value: the callers reject a NEW invalid write and ask the user to correct
// the other date explicitly.

export type LossDateValidation =
  | {valid: true}
  | {valid: false; message: string};

export const CYCLE_RETURN_FUTURE_MESSAGE =
  'La date de tes premières règles revenues ne peut pas être dans le futur.';
export const CYCLE_RETURN_BEFORE_LOSS_MESSAGE =
  'La date de tes premières règles revenues ne peut pas précéder la date de ta fausse couche.';
export const CYCLE_RETURN_INVALID_MESSAGE =
  'La date de tes premières règles revenues n’est pas valide.';
export const JOURNAL_FUTURE_MESSAGE =
  'Tu ne peux pas enregistrer un suivi pour une date à venir.';
export const JOURNAL_BEFORE_LOSS_MESSAGE =
  'Tu ne peux pas enregistrer un suivi pour une date antérieure à ta fausse couche.';

const KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Parses a stored 'YYYY-MM-DD' key into a local start-of-day Date; null for
 * anything missing or malformed (including impossible dates like 2026-02-31). */
export const parseLossDateKey = (value: string | null | undefined): Date | null => {
  if (!value || !KEY_PATTERN.test(value)) {return null;}
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {return null;}
  const day = startOfDay(parsed);
  return day.toLocaleDateString('en-CA') === value ? day : null;
};

/** The canonical validation of a cycle-return date, applied by EVERY writer:
 * a valid date, never in the future, never before the loss date (when known). */
export function validateCycleReturnDate(params: {
  date: Date;
  now: Date;
  lossDate: string | null | undefined;
}): LossDateValidation {
  if (Number.isNaN(params.date.getTime())) {
    return {valid: false, message: CYCLE_RETURN_INVALID_MESSAGE};
  }
  const day = startOfDay(params.date);
  if (diffDays(day, startOfDay(params.now)) > 0) {
    return {valid: false, message: CYCLE_RETURN_FUTURE_MESSAGE};
  }
  const loss = parseLossDateKey(params.lossDate);
  if (loss && diffDays(day, loss) < 0) {
    return {valid: false, message: CYCLE_RETURN_BEFORE_LOSS_MESSAGE};
  }
  return {valid: true};
}

export type StoredCycleReturnDateState =
  | 'none' // nothing recorded
  | 'ok' // a real event that already happened, after the loss
  | 'future' // legacy: recorded in the future (not an event yet)
  | 'before_loss' // legacy: recorded before the loss date
  | 'invalid'; // legacy: unparsable

/** Classifies an ALREADY STORED cycle-return date (possibly legacy) for the
 * readers (Dashboard, Calendar, Statistics). Read-only: never rewrites it. */
export function classifyStoredCycleReturnDate(params: {
  cycleReturnStatus: string | null | undefined;
  cycleReturnDate: string | null | undefined;
  now: Date;
  lossDate: string | null | undefined;
}): StoredCycleReturnDateState {
  if (params.cycleReturnStatus !== 'yes' || !params.cycleReturnDate) {return 'none';}
  const date = parseLossDateKey(params.cycleReturnDate);
  if (!date) {return 'invalid';}
  const result = validateCycleReturnDate({date, now: params.now, lossDate: params.lossDate});
  if (result.valid) {return 'ok';}
  return diffDays(date, startOfDay(params.now)) > 0 ? 'future' : 'before_loss';
}

/** A dated Loss journal entry (Saignements / Symptômes / Notes / Reprise des
 * essais) may only be written for a day that has happened and that is not
 * before the loss date. Used by the historical (selected-day) entry path. */
export function validateLossJournalDate(params: {
  dateKey: string;
  now: Date;
  lossDate: string | null | undefined;
}): LossDateValidation {
  const date = parseLossDateKey(params.dateKey);
  if (!date) {return {valid: false, message: 'Cette date n’est pas valide.'};}
  if (diffDays(date, startOfDay(params.now)) > 0) {
    return {valid: false, message: JOURNAL_FUTURE_MESSAGE};
  }
  const loss = parseLossDateKey(params.lossDate);
  if (loss && diffDays(date, loss) < 0) {
    return {valid: false, message: JOURNAL_BEFORE_LOSS_MESSAGE};
  }
  return {valid: true};
}

/** Minimal structural view of a Loss journal entry (miscarriageJournalStore). */
export type LossJournalEntryLike = {
  bleeding?: string;
  bleedingNote?: string;
  physicalSymptoms?: string[];
  physicalSymptomsNote?: string;
  personalNotes?: string;
  tryingAgain?: string;
};

/** Whether a day's journal entry holds REAL content — an entry emptied by a
 * "clear" action (empty array / empty text) is not dated data any more. */
export const journalEntryHasContent = (entry: LossJournalEntryLike | undefined): boolean =>
  Boolean(
    entry &&
      (entry.bleeding ||
        entry.bleedingNote?.trim() ||
        entry.physicalSymptoms?.length ||
        entry.physicalSymptomsNote?.trim() ||
        entry.personalNotes?.trim() ||
        entry.tryingAgain),
  );

/** The sorted 'YYYY-MM-DD' keys of the days that hold real journal content. */
export const journalDatesWithContent = (
  entries: Record<string, LossJournalEntryLike | undefined>,
): string[] =>
  Object.keys(entries)
    .filter(key => parseLossDateKey(key) !== null && journalEntryHasContent(entries[key]))
    .sort();

export type LossDateConflict =
  | {kind: 'cycle_return'; date: string}
  | {kind: 'journal'; firstDate: string; count: number};

/** The dated data a NEW loss date would contradict (never modified here):
 * - a recorded cycle-return date earlier than the new loss date;
 * - journal days with real content earlier than the new loss date. */
export function findLossDateConflicts(params: {
  newLossDate: Date;
  cycleReturnStatus: string | null | undefined;
  cycleReturnDate: string | null | undefined;
  journalDates: string[];
}): LossDateConflict[] {
  const newLoss = startOfDay(params.newLossDate);
  const conflicts: LossDateConflict[] = [];

  const cycleReturn =
    params.cycleReturnStatus === 'yes' ? parseLossDateKey(params.cycleReturnDate) : null;
  if (cycleReturn && diffDays(newLoss, cycleReturn) > 0) {
    conflicts.push({kind: 'cycle_return', date: params.cycleReturnDate as string});
  }

  const earlier = params.journalDates
    .filter(key => {
      const date = parseLossDateKey(key);
      return date !== null && diffDays(newLoss, date) > 0;
    })
    .sort();
  if (earlier.length > 0) {
    conflicts.push({kind: 'journal', firstDate: earlier[0], count: earlier.length});
  }
  return conflicts;
}

const formatKey = (key: string): string => {
  const parsed = parseLossDateKey(key);
  return parsed ? formatFullDate(parsed).toLowerCase() : key;
};

export function describeLossDateConflict(conflict: LossDateConflict): string {
  if (conflict.kind === 'cycle_return') {
    return `Cette date est postérieure à la date de retour de tes règles déjà enregistrée (${formatKey(
      conflict.date,
    )}). Corrige d’abord le retour du cycle, puis reviens modifier la date de la fausse couche.`;
  }
  return conflict.count > 1
    ? `Ton journal contient déjà ${conflict.count} jours renseignés avant cette date (le premier : ${formatKey(
        conflict.firstDate,
      )}). Choisis une date antérieure ou égale à cette première entrée : ton historique n’est jamais modifié ni supprimé.`
    : `Ton journal contient déjà une entrée datée du ${formatKey(
        conflict.firstDate,
      )}, avant cette date. Choisis une date antérieure ou égale : ton historique n’est jamais modifié ni supprimé.`;
}

/** Full check before SAVING a corrected loss date: the date itself (never in
 * the future — same rule as onboarding) and then every dependent dated value.
 * Returns ONE French message naming each conflict; never changes anything. */
export function validateLossDateChange(params: {
  date: Date;
  now: Date;
  cycleReturnStatus: string | null | undefined;
  cycleReturnDate: string | null | undefined;
  journalDates: string[];
}): LossDateValidation {
  const own = validateLossDate(params.date, params.now);
  if (!own.valid) {return own;}
  const conflicts = findLossDateConflicts({
    newLossDate: params.date,
    cycleReturnStatus: params.cycleReturnStatus,
    cycleReturnDate: params.cycleReturnDate,
    journalDates: params.journalDates,
  });
  if (conflicts.length === 0) {return {valid: true};}
  return {valid: false, message: conflicts.map(describeLossDateConflict).join('\n\n')};
}
