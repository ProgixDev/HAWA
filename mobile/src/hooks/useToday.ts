import {useEffect, useMemo, useState} from 'react';
import {AppState} from 'react-native';

// THE single way a dashboard/calendar obtains "today". A screen that reads
// `new Date()` once (useMemo(..., [])) keeps treating yesterday as today
// until it is fully re-mounted — the app can stay open across midnight, or be
// backgrounded overnight and simply resumed. This hook re-evaluates the local
// calendar day (a) when the day actually changes while the app is foregrounded
// and (b) whenever the app returns to the foreground, and only then produces a
// NEW `today`/`todayKey` — so every effect/memo that depends on them re-runs
// exactly once per day change, never on every tick.
//
// The day key follows the project-wide convention (`toLocaleDateString('en-CA')`,
// local YYYY-MM-DD — never a UTC toISOString slice).

const MAX_TIMER_MS = 30 * 60 * 1000;
const MIDNIGHT_MARGIN_MS = 250;

export const localDayKey = (date: Date): string => date.toLocaleDateString('en-CA');

export const startOfLocalDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Milliseconds from `now` until the next local midnight (DST-safe: built
 * from the calendar fields, not from a fixed 24h). Always > 0. */
export const msUntilNextLocalMidnight = (now: Date): number => {
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(1, nextMidnight.getTime() - now.getTime());
};

export type TodayInfo = {
  /** Local start of the current day. Identity only changes when the day does. */
  today: Date;
  /** Local 'YYYY-MM-DD' key of the current day. */
  todayKey: string;
};

export function useToday(): TodayInfo {
  const [todayKey, setTodayKey] = useState(() => localDayKey(new Date()));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const refresh = () => {
      // Functional update: identical key → same state → no re-render.
      setTodayKey(current => {
        const next = localDayKey(new Date());
        return next === current ? current : next;
      });
    };

    const schedule = () => {
      if (timer) {clearTimeout(timer);}
      // Wake up at the next midnight, but never sleep longer than
      // MAX_TIMER_MS so a device clock/timezone change is picked up too.
      const delay = Math.min(msUntilNextLocalMidnight(new Date()) + MIDNIGHT_MARGIN_MS, MAX_TIMER_MS);
      timer = setTimeout(() => {
        if (cancelled) {return;}
        refresh();
        schedule();
      }, delay);
    };

    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refresh();
        schedule();
      }
    });

    // Cover the gap between the first render and this effect.
    refresh();
    schedule();

    return () => {
      cancelled = true;
      if (timer) {clearTimeout(timer);}
      subscription.remove();
    };
  }, []);

  return useMemo(() => {
    const [year, month, day] = todayKey.split('-').map(Number);
    return {today: new Date(year, month - 1, day), todayKey};
  }, [todayKey]);
}
