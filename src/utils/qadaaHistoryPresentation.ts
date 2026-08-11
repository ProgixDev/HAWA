import {formatFullDate, formatShortDate, addDays, startOfDay} from './cycleMath';
import {hijriPartsFor, isRamadan} from './hijriCalendar';
import type {ConfirmedPeriodOccurrence} from '../state/confirmedPeriodHistoryStore';

export type QadaaHistoryEntry = {
  id: string;
  ramadanDays: number;
  hijriYear: number;
  hijriDayStart: number;
  hijriDayEnd: number;
  gregorianStart: Date;
  gregorianEnd: Date;
};

/**
 * Presentation-only derivation for the "Historique" section — reuses the
 * exact same `isRamadan`/`hijriPartsFor` primitives `computeQadaaFromHistory`
 * uses (src/utils/qadaaLogic.ts), just to describe a confirmed occurrence
 * instead of aggregating a count. Does not duplicate or alter the qadaa
 * counting rule itself.
 *
 * Returns undefined for occurrences with no Ramadan overlap (e.g. a
 * confirmed Safar period) — the caller should drop those from the
 * "Historique" list, since they're not qadaa-relevant history.
 */
export function summarizeQadaaHistoryEntry(occurrence: ConfirmedPeriodOccurrence): QadaaHistoryEntry | undefined {
  const periodStart = new Date(occurrence.periodStart);
  const periodEndDateTime = new Date(occurrence.periodEndDateTime);
  const start = startOfDay(periodStart);
  const end = startOfDay(periodEndDateTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end.getTime() < start.getTime()) {
    return undefined;
  }

  let ramadanDays = 0;
  let hijriYear: number | undefined;
  let hijriDayStart: number | undefined;
  let hijriDayEnd: number | undefined;

  let cursor = start;
  while (cursor.getTime() <= end.getTime()) {
    if (isRamadan(cursor)) {
      const parts = hijriPartsFor(cursor);
      ramadanDays += 1;
      if (hijriYear === undefined) {hijriYear = parts.year;}
      if (hijriDayStart === undefined || parts.day < hijriDayStart) {hijriDayStart = parts.day;}
      if (hijriDayEnd === undefined || parts.day > hijriDayEnd) {hijriDayEnd = parts.day;}
    }
    cursor = addDays(cursor, 1);
  }

  if (ramadanDays === 0 || hijriYear === undefined || hijriDayStart === undefined || hijriDayEnd === undefined) {
    return undefined;
  }

  return {
    id: occurrence.id,
    ramadanDays,
    hijriYear,
    hijriDayStart,
    hijriDayEnd,
    gregorianStart: periodStart,
    gregorianEnd: periodEndDateTime,
  };
}

export const formatQadaaHistoryHijriRange = (entry: QadaaHistoryEntry): string =>
  entry.hijriDayStart === entry.hijriDayEnd
    ? `${entry.hijriDayStart} Ramadan ${entry.hijriYear} AH`
    : `${entry.hijriDayStart} au ${entry.hijriDayEnd} Ramadan ${entry.hijriYear} AH`;

export const formatQadaaHistoryGregorianRange = (entry: QadaaHistoryEntry): string => {
  const sameYear = entry.gregorianStart.getFullYear() === entry.gregorianEnd.getFullYear();
  return sameYear
    ? `${formatShortDate(entry.gregorianStart)} – ${formatFullDate(entry.gregorianEnd)}`
    : `${formatFullDate(entry.gregorianStart)} – ${formatFullDate(entry.gregorianEnd)}`;
};
