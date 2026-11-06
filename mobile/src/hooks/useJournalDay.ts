import {useCallback, useMemo, useState} from 'react';

import {addDays, startOfDay} from '../utils/cycleMath';
import {localDayKey, useToday} from './useToday';

/** How many days back a journal entry can still be filled in or corrected. */
export const JOURNAL_MAX_DAYS_BACK = 30;

/** The day a journal entry screen edits: today by default, or one of the previous days (e.g. last night's sleep forgotten the day before).
 * Never a future day. `dayKey` follows the project-wide local 'YYYY-MM-DD' convention (useToday.ts). */
export function useJournalDay() {
  const {today} = useToday();
  const [offset, setOffset] = useState(0);
  const day = useMemo(() => addDays(startOfDay(today), -offset), [today, offset]);
  const dayKey = useMemo(() => localDayKey(day), [day]);
  const goPrevious = useCallback(() => setOffset(current => Math.min(JOURNAL_MAX_DAYS_BACK, current + 1)), []);
  const goNext = useCallback(() => setOffset(current => Math.max(0, current - 1)), []);
  return {
    day,
    dayKey,
    isToday: offset === 0,
    canGoPrevious: offset < JOURNAL_MAX_DAYS_BACK,
    canGoNext: offset > 0,
    goPrevious,
    goNext,
    previousDay: addDays(day, -1),
    nextDay: addDays(day, 1),
  };
}
