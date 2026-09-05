import {addDays} from './cycleMath';
import {getHijriAdjustmentDays} from '../state/onboardingPreferences';

export type HijriDateParts = {year: number; month: number; day: number};

export type HijriMonthDay = {gregorian: Date; hijriDay: number};

export const HIJRI_MONTH_RAMADAN = 9;
export const HIJRI_MONTH_DHOUL_HIJJA = 12;

// Reuses the exact same ICU islamic-calendar conversion already trusted
// elsewhere in the app (cycleMath.ts's formatHijriDate/formatHijriDay use
// the same `-u-ca-islamic` extension) — just requesting numeric fields
// instead of localized names, so month/year can be compared reliably to
// detect month boundaries and Ramadan/Dhoul Hijja.
const hijriNumericFormatter = new Intl.DateTimeFormat('en-u-ca-islamic', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

/**
 * THE single point where the user's manual Hijri adjustment
 * (onboardingPreferences.ts's getHijriAdjustmentDays()) is applied — shifting
 * the Gregorian input by that many days before the ICU lookup is
 * mathematically equivalent to shifting the resulting Hijri day count by the
 * same amount (both calendars are simple sequential day counts), and it
 * naturally propagates to every function below without any of them needing
 * to know the adjustment exists. Never apply the adjustment a second time
 * anywhere else — every Hijri classification/formatting path must go through
 * this one function (directly, or via the other exports in this file).
 */
export function hijriPartsFor(date: Date): HijriDateParts {
  const adjustedDate = addDays(date, getHijriAdjustmentDays());
  const parts = hijriNumericFormatter.formatToParts(adjustedDate);
  const value = (type: string) => Number(parts.find(part => part.type === type)?.value ?? NaN);
  return {year: value('year'), month: value('month'), day: value('day')};
}

/**
 * The Gregorian date corresponding to day 1 of the Hijri month that
 * contains `date`. Walks backward day-by-day (a Hijri month is at most 30
 * days, so this is bounded) using the ICU conversion above — no Hijri
 * astronomical calculation is reimplemented here.
 */
export function hijriMonthStart(date: Date): Date {
  let cursor = date;
  let parts = hijriPartsFor(cursor);
  while (parts.day > 1) {
    cursor = addDays(cursor, -1);
    parts = hijriPartsFor(cursor);
  }
  return cursor;
}

/** All Gregorian days that fall within the Hijri month starting at `monthStart`. */
export function getHijriMonthDays(monthStart: Date): HijriMonthDay[] {
  const {year: targetYear, month: targetMonth} = hijriPartsFor(monthStart);
  const days: HijriMonthDay[] = [];
  let cursor = monthStart;
  for (let index = 0; index < 30; index += 1) {
    const parts = hijriPartsFor(cursor);
    if (parts.year !== targetYear || parts.month !== targetMonth) {break;}
    days.push({gregorian: cursor, hijriDay: parts.day});
    cursor = addDays(cursor, 1);
  }
  return days;
}

/** Day 1 of the Hijri month following the one starting at `monthStart`. */
export function nextHijriMonthStart(monthStart: Date): Date {
  // +32 always overshoots past the current Hijri month (max 30 days) while
  // staying within the immediately following one (min 29 days), so walking
  // back to day 1 from there lands on the correct next month.
  return hijriMonthStart(addDays(monthStart, 32));
}

/** Day 1 of the Hijri month preceding the one starting at `monthStart`. */
export function previousHijriMonthStart(monthStart: Date): Date {
  return hijriMonthStart(addDays(monthStart, -1));
}

export function isRamadan(monthStart: Date): boolean {
  return hijriPartsFor(monthStart).month === HIJRI_MONTH_RAMADAN;
}

export function isDhoulHijja(monthStart: Date): boolean {
  return hijriPartsFor(monthStart).month === HIJRI_MONTH_DHOUL_HIJJA;
}
