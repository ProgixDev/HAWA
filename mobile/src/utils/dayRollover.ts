// Pure helpers for what a screen should do with a day-dependent SELECTION when
// the shared useToday() (src/hooks/useToday.ts) reports that a new day began.
// They only decide; the day itself always comes from useToday(), and no
// timer/AppState logic lives here.
//
// Rule: a selection that was "following today" moves to the new today; a
// selection the user pointed at another date is never moved by midnight.

const sameCalendarDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** The selected calendar day after `previousToday` → `today`. */
export const rollSelectedDate = (selected: Date, previousToday: Date, today: Date): Date =>
  sameCalendarDay(selected, previousToday) ? today : selected;

/** The visible month (first-of-month Date) after `previousToday` → `today`:
 * follows the new day's month only if the user was looking at the month that
 * contained the previous today; a month she navigated to is never moved. */
export const rollVisibleMonth = (visibleMonth: Date, previousToday: Date, today: Date): Date =>
  visibleMonth.getFullYear() === previousToday.getFullYear() && visibleMonth.getMonth() === previousToday.getMonth()
    ? new Date(today.getFullYear(), today.getMonth(), 1)
    : visibleMonth;
