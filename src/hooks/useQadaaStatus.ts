import {useCallback, useMemo, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';

import {getCyclePreferences, hydratePeriodEndDateTime} from '../state/onboardingPreferences';
import {
  getConfirmedPeriodHistory,
  hydrateConfirmedPeriodHistory,
  recordConfirmedPeriodEnd,
  subscribeConfirmedPeriodHistory,
  type ConfirmedPeriodOccurrence,
} from '../state/confirmedPeriodHistoryStore';
import {
  getRemainingQadaaDays,
  hydrateRemainingQadaaDays,
  setRemainingQadaaDays,
  subscribeRemainingQadaaDays,
} from '../state/qadaaStore';
import {
  getQadaaCompletedDays,
  hydrateQadaaProgress,
  markOneQadaaDayCompleted as persistOneQadaaDayCompleted,
  subscribeQadaaProgress,
} from '../state/qadaaProgressStore';
import {startOfDay} from '../utils/cycleMath';
import {isRamadan} from '../utils/hijriCalendar';
import {computeQadaaFromHistory, shouldShowQadaaReminder} from '../utils/qadaaLogic';

export type QadaaStatus = {
  /** totalQadaaDays - completedQadaaDays, floored at 0. null only until the
   * very first hydration/computation resolves. */
  remainingQadaaDays: number | null;
  /** Confirmed Ramadan days ever detected (immutable historical truth —
   * never decreases as completions are recorded). */
  totalQadaaDays: number | null;
  /** Persisted count of qadaa days the user has marked as made up. */
  completedQadaaDays: number | null;
  hijriYear: number | undefined;
  loading: boolean;
  ramadanActive: boolean;
  showReminder: boolean;
  /** Marks exactly one qadaa day as completed. No-ops once remainingQadaaDays
   * is already 0. Safe to call concurrently — see qadaaProgressStore.ts. */
  markOneQadaaDayCompleted: () => Promise<void>;
};

const toOccurrenceDates = (occurrence: ConfirmedPeriodOccurrence) => ({
  periodStart: new Date(occurrence.periodStart),
  periodEndDateTime: new Date(occurrence.periodEndDateTime),
});

/**
 * Single source of truth for "how many Ramadan fasting days are still owed
 * because of confirmed menstruation" — consumed identically by
 * FastingQadaaScreen, CycleHomeScreen's SpiritualGuidanceCard summary, and
 * (via navigation only) the Hijri Calendar shortcut.
 *
 * totalQadaaDays is derived ONLY from confirmed period history
 * (src/state/confirmedPeriodHistoryStore.ts via src/utils/qadaaLogic.ts) —
 * never the current, predictive `cyclePreferences` — so a later change to
 * the current cycle's averages can never rewrite an already-confirmed
 * Ramadan obligation (see the qadaa sync investigation).
 *
 * completedQadaaDays is a SEPARATE persisted counter
 * (src/state/qadaaProgressStore.ts). Marking days complete never mutates
 * confirmedPeriodHistoryStore — history stays the immutable record of what
 * was originally missed; only remainingQadaaDays (total − completed) moves.
 */
export function useQadaaStatus(): QadaaStatus {
  const [remainingQadaaDays, setLocalRemaining] = useState<number | null>(getRemainingQadaaDays());
  const [totalQadaaDays, setTotalQadaaDays] = useState<number | null>(null);
  const [completedQadaaDays, setCompletedQadaaDays] = useState<number | null>(null);
  const [hijriYear, setHijriYear] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(remainingQadaaDays === null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      // Both must be known before the first authoritative recompute runs —
      // this is what keeps `loading` true until history AND persisted
      // completion progress have both hydrated (avoids a "3 then 2" flash).
      let latestHistory: ConfirmedPeriodOccurrence[] | null = null;
      let latestCompletedDays: number | null = null;

      // Cached, previously-persisted REMAINING value first — avoids a
      // "À jour" flash before the fresh computation below resolves (see
      // qadaaStore.ts). This cache already reflects completion, since
      // recompute() below always persists total-minus-completed, not the
      // raw total.
      hydrateRemainingQadaaDays().then(cached => {
        if (active && cached !== null) {setLocalRemaining(cached);}
      });
      const unsubscribeQadaa = subscribeRemainingQadaaDays(() => {
        if (active) {setLocalRemaining(getRemainingQadaaDays());}
      });

      const recompute = () => {
        if (latestHistory === null || latestCompletedDays === null) {return;}
        const result = computeQadaaFromHistory(latestHistory.map(toOccurrenceDates));
        const total = result.remainingDays;
        const completed = Math.min(total, latestCompletedDays);
        const remaining = Math.max(0, total - completed);

        setRemainingQadaaDays(remaining);
        if (active) {
          setTotalQadaaDays(total);
          setCompletedQadaaDays(completed);
          setHijriYear(result.hijriYear);
          setLoading(false);
        }
      };

      const bootstrapHistory = async () => {
        let history = await hydrateConfirmedPeriodHistory();

        // One-time, conservative migration from the pre-history single
        // `periodEndDateTime` scalar: only when it's still unambiguously
        // consistent with the CURRENT cyclePreferences (i.e. not already
        // stale/paired with a later, unrelated cycle — exactly the
        // condition that caused the sync bug). If it's ambiguous, we do
        // NOT guess — history simply stays empty rather than fabricating
        // a historical occurrence.
        if (history.length === 0) {
          const periodEndDateTime = await hydratePeriodEndDateTime();
          const cyclePreferences = getCyclePreferences();
          if (periodEndDateTime && periodEndDateTime.getTime() >= cyclePreferences.lastPeriodStart.getTime()) {
            history = await recordConfirmedPeriodEnd(cyclePreferences.lastPeriodStart, periodEndDateTime);
          }
        }

        latestHistory = history;
        recompute();
      };
      bootstrapHistory();

      hydrateQadaaProgress().then(progress => {
        latestCompletedDays = progress.completedDays;
        recompute();
      });

      const unsubscribeHistory = subscribeConfirmedPeriodHistory(() => {
        latestHistory = getConfirmedPeriodHistory();
        recompute();
      });
      const unsubscribeProgress = subscribeQadaaProgress(() => {
        latestCompletedDays = getQadaaCompletedDays();
        recompute();
      });

      return () => {
        active = false;
        unsubscribeQadaa();
        unsubscribeHistory();
        unsubscribeProgress();
      };
    }, []),
  );

  const today = useMemo(() => startOfDay(new Date()), []);
  const ramadanActive = isRamadan(today);
  const showReminder = remainingQadaaDays !== null && shouldShowQadaaReminder(remainingQadaaDays, today);

  const markOneQadaaDayCompleted = useCallback(async () => {
    if (totalQadaaDays === null || remainingQadaaDays === null || remainingQadaaDays <= 0) {
      return;
    }
    const progress = await persistOneQadaaDayCompleted(totalQadaaDays);
    const remaining = Math.max(0, totalQadaaDays - progress.completedDays);
    setRemainingQadaaDays(remaining);
    setCompletedQadaaDays(progress.completedDays);
  }, [totalQadaaDays, remainingQadaaDays]);

  return {
    remainingQadaaDays,
    totalQadaaDays,
    completedQadaaDays,
    hijriYear,
    loading,
    ramadanActive,
    showReminder,
    markOneQadaaDayCompleted,
  };
}
