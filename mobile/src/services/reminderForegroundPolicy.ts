/**
 * When coming back to the foreground has to re-derive every reminder (Phase 2 — F14).
 *
 * Android keeps an alarm as an absolute instant, but what "08:30 every day" MEANS depends on the phone's time zone at
 * the moment it was scheduled. After a zone change (travel, automatic zone, a daylight-saving switch) or a clock that
 * was set by hand, the alarms handed over earlier are an hour or more away from where she put them. Notifee re-arms
 * alarms after a reboot only: it has no receiver for a time-zone change, a clock change or an app update. The app can
 * therefore correct this only the next time its own code runs — on the next process start (every objective syncs at
 * module scope) or on the next foreground, which is what this decides.
 *
 *  - the zone / UTC offset differs from what was seen before        → 'force'  (re-derive even the reminders that
 *                                                                      keep a snapshot and would skip the work)
 *  - the clock went BACKWARDS since the last resync                 → 'force'
 *  - a long time has passed since the last resync                   → 'refresh' (window-based schedules, e.g. a pill
 *                                                                      reminder skipping break days, are topped up)
 *  - otherwise                                                      → 'none'  (the foreground itself costs nothing)
 *
 * In-memory on purpose: nothing about her location/zone is written to storage. A zone change while the app was closed
 * is covered by the process start, which always re-derives everything.
 */
export const FOREGROUND_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

export type ForegroundResync = 'none' | 'refresh' | 'force';

/** What decides WHEN a stored local time happens: the zone name and its UTC offset right now (DST included). */
export function currentTimeBasis(now: Date = new Date()): string {
  let zone = '';
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch {
    // Some JS engines have no Intl zone support: the offset alone still detects every change that matters.
  }
  return `${zone}|${now.getTimezoneOffset()}`;
}

export type ForegroundResyncPolicyOptions = {
  now?: () => number;
  readBasis?: () => string;
  refreshIntervalMs?: number;
};

export type ForegroundResyncPolicy = {
  /** Call on every transition to the foreground. */
  onForeground(): ForegroundResync;
  /** Every reminder was just re-derived for another reason (privacy, language, permission): restart the interval. */
  noteResync(): void;
};

export function createForegroundResyncPolicy(options: ForegroundResyncPolicyOptions = {}): ForegroundResyncPolicy {
  // Looked up at call time (not captured), so a faked clock is honoured even by a policy created at import time.
  const now = options.now ?? (() => Date.now());
  const readBasis = options.readBasis ?? currentTimeBasis;
  const refreshIntervalMs = options.refreshIntervalMs ?? FOREGROUND_REFRESH_INTERVAL_MS;

  // Process start counts as a resync: every objective syncs at module scope when the bundle loads.
  let basis = readBasis();
  let lastResyncAt = now();

  return {
    onForeground(): ForegroundResync {
      const at = now();
      const nextBasis = readBasis();
      const basisChanged = nextBasis !== basis;
      const elapsed = at - lastResyncAt;
      basis = nextBasis;

      if (basisChanged || elapsed < 0) {
        lastResyncAt = at;
        return 'force';
      }
      if (elapsed >= refreshIntervalMs) {
        lastResyncAt = at;
        return 'refresh';
      }
      return 'none';
    },
    noteResync(): void {
      basis = readBasis();
      lastResyncAt = now();
    },
  };
}
