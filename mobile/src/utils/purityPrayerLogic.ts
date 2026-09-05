import type {PrayerName, PrayerWindow} from '../services/prayerTimes';

export type PurityStatus = 'menstruating' | 'pure' | 'unknown';

export type PurityPrayerResult = {
  status: PurityStatus;
  prayerDue: boolean;
  prayerName?: PrayerName;
  prayerStart?: Date;
  prayerEnd?: Date;
  /** Set only when `prayerDue` is false and purity was regained between two
   * prayer windows (e.g. after Fajr's window closes at Sunrise but before
   * Dhuhr begins) — informational only, this prayer is not "due". */
  nextPrayerName?: PrayerName;
  nextPrayerTime?: Date;
};

/**
 * Implements the single HAWA product rule for this feature: "if purity
 * returns before the end of the current prayer time, that prayer becomes
 * due." Compares the exact moment a period ended against the prayer
 * windows for that day and returns which prayer (if any) purity was
 * regained during.
 *
 * `purityWindows` must include the previous day's trailing Isha window
 * (see `fetchPrayerSchedule`) so a `periodEndDateTime` before today's Fajr
 * is correctly attributed to the still-open Isha window rather than left
 * unmatched. Windows have a deliberate gap between Sunrise and Dhuhr (Fajr's
 * window closes at Sunrise) — a `periodEndDateTime` falling in that gap
 * correctly yields no prayer due, per the product rule.
 */
export function getPrayerDueAfterPurity(
  isMenstruating: boolean,
  periodEndDateTime: Date | null | undefined,
  purityWindows: PrayerWindow[] | null | undefined,
): PurityPrayerResult {
  if (isMenstruating) {
    return {status: 'menstruating', prayerDue: false};
  }

  if (!periodEndDateTime || Number.isNaN(periodEndDateTime.getTime())) {
    return {status: 'unknown', prayerDue: false};
  }

  if (!purityWindows || purityWindows.length === 0) {
    // Purity is a fact independent of prayer-time data availability — only
    // the "which prayer is due" detail is unknown until the schedule loads.
    return {status: 'pure', prayerDue: false};
  }

  const endTime = periodEndDateTime.getTime();
  const containingWindow = purityWindows.find(
    candidate => endTime >= candidate.start.getTime() && endTime < candidate.end.getTime(),
  );

  if (containingWindow) {
    return {
      status: 'pure',
      prayerDue: true,
      prayerName: containingWindow.name,
      prayerStart: containingWindow.start,
      prayerEnd: containingWindow.end,
    };
  }

  const nextWindow = purityWindows
    .filter(candidate => candidate.start.getTime() > endTime)
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0];

  return {
    status: 'pure',
    prayerDue: false,
    nextPrayerName: nextWindow?.name,
    nextPrayerTime: nextWindow?.start,
  };
}
