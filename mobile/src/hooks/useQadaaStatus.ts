import {useToday} from './useToday';
import {useCallback, useRef, useState} from 'react';
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
  getQadaaLedger,
  hydrateQadaaLedger,
  recordQadaaCompletion,
  subscribeQadaaLedger,
  type QadaaCompletionEntry,
  type QadaaLedger,
  type QadaaManualEntry,
} from '../state/qadaaLedgerStore';
import {isRamadan} from '../utils/hijriCalendar';
import {computeQadaaFromHistory, shouldShowQadaaReminder} from '../utils/qadaaLogic';
import {computeQadaaBalance, type QadaaBalance} from '../utils/qadaaBalance';
import {markSaveFailureHandled} from '../services/saveFailure';

export type QadaaStatus = {
  /** The authoritative remaining balance (see utils/qadaaBalance.ts). null only
   * until the very first hydration/computation resolves. */
  remainingQadaaDays: number | null;
  /** automatic + manual owed days — never decreases as completions are recorded. */
  totalQadaaDays: number | null;
  /** Completed days counted against the current total (never above it). */
  completedQadaaDays: number | null;
  /** Days derived from CONFIRMED menstruation during Ramadan (read-only here). */
  automaticQadaaDays: number | null;
  /** Days the user declared herself (manual / historical entries). */
  manualQadaaDays: number | null;
  /** Completions beyond the current total (e.g. after a period correction). */
  surplusCompletedDays: number | null;
  /** The full balance, or null until first computed. */
  balance: QadaaBalance | null;
  manualEntries: readonly QadaaManualEntry[];
  completions: readonly QadaaCompletionEntry[];
  hijriYear: number | undefined;
  loading: boolean;
  ramadanActive: boolean;
  showReminder: boolean;
  /** Records ONE made-up day. No-ops once remainingQadaaDays is 0 and while a
   * previous call is still in flight (double-tap safe). */
  markOneQadaaDayCompleted: () => Promise<void>;
};

const toOccurrenceDates = (occurrence: ConfirmedPeriodOccurrence) => ({
  periodStart: new Date(occurrence.periodStart),
  periodEndDateTime: new Date(occurrence.periodEndDateTime),
});

/**
 * Single source of truth for "how many Ramadan fasting days are still owed" —
 * consumed identically by FastingQadaaScreen, the dashboards' spiritual card
 * summary, and (through the same computeQadaaBalance) the reminder scheduler.
 *
 * Three independent inputs, combined ONLY by utils/qadaaBalance.ts:
 *  - AUTOMATIC: derived from confirmed period history
 *    (confirmedPeriodHistoryStore + utils/qadaaLogic.ts) — never the predictive
 *    `cyclePreferences`, never copied into the ledger, so editing the menstrual
 *    history keeps recalculating it.
 *  - MANUAL: the user's own entries (qadaaLedgerStore.manualEntries).
 *  - COMPLETIONS: the user's made-up-day records (qadaaLedgerStore.completions).
 * Marking days complete never mutates the menstrual history.
 */
export function useQadaaStatus(): QadaaStatus {
  const [remainingQadaaDays, setLocalRemaining] = useState<number | null>(getRemainingQadaaDays());
  const [balance, setBalance] = useState<QadaaBalance | null>(null);
  const [ledgerView, setLedgerView] = useState<Pick<QadaaLedger, 'manualEntries' | 'completions'>>({
    manualEntries: [],
    completions: [],
  });
  const [hijriYear, setHijriYear] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(remainingQadaaDays === null);
  // Latest balance, readable synchronously by the completion handler.
  const balanceRef = useRef<QadaaBalance | null>(null);
  const markingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      // History AND the ledger must both be known before the first authoritative
      // recompute runs — keeps `loading` true until both hydrated (avoids a
      // "3 then 2" flash).
      let latestHistory: ConfirmedPeriodOccurrence[] | null = null;
      let latestLedger: QadaaLedger | null = null;

      // Cached, previously-persisted REMAINING value first — avoids a "À jour"
      // flash before the fresh computation below resolves (see qadaaStore.ts).
      // It is only a display cache: recompute() below always overwrites it with
      // the authoritative balance.
      hydrateRemainingQadaaDays().then(cached => {
        if (active && cached !== null) {setLocalRemaining(cached);}
      });
      const unsubscribeQadaa = subscribeRemainingQadaaDays(() => {
        if (active) {setLocalRemaining(getRemainingQadaaDays());}
      });

      const recompute = () => {
        if (latestHistory === null || latestLedger === null) {return;}
        const automatic = computeQadaaFromHistory(latestHistory.map(toOccurrenceDates));
        const next = computeQadaaBalance(automatic.remainingDays, latestLedger.manualEntries, latestLedger.completions);
        balanceRef.current = next;

        // A cache of a derived value: a refused/failed write is not user-actionable (see services/saveFailure.ts).
        setRemainingQadaaDays(next.remainingDays).catch(markSaveFailureHandled);
        if (active) {
          setBalance(next);
          setLedgerView({manualEntries: latestLedger.manualEntries, completions: latestLedger.completions});
          setHijriYear(automatic.hijriYear);
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
            try {
              history = await recordConfirmedPeriodEnd(cyclePreferences.lastPeriodStart, periodEndDateTime);
            } catch (error) {
              // One-time migration of a legacy scalar: not user-initiated; it is retried on the next load.
              markSaveFailureHandled(error);
            }
          }
        }

        latestHistory = history;
        recompute();
      };
      bootstrapHistory();

      hydrateQadaaLedger().then(ledger => {
        latestLedger = ledger;
        recompute();
      });

      const unsubscribeHistory = subscribeConfirmedPeriodHistory(() => {
        latestHistory = getConfirmedPeriodHistory();
        recompute();
      });
      const unsubscribeLedger = subscribeQadaaLedger(() => {
        latestLedger = getQadaaLedger();
        recompute();
      });

      return () => {
        active = false;
        unsubscribeQadaa();
        unsubscribeHistory();
        unsubscribeLedger();
      };
    }, []),
  );

  // Re-evaluated when the local day changes / the app returns to the
  // foreground — see src/hooks/useToday.ts.
  const {today} = useToday();
  const ramadanActive = isRamadan(today);
  const showReminder = remainingQadaaDays !== null && shouldShowQadaaReminder(remainingQadaaDays, today);

  const markOneQadaaDayCompleted = useCallback(async () => {
    // The ref is set synchronously, so a second tap before the first has
    // finished (or before React re-rendered a disabled button) is ignored.
    if (markingRef.current) {return;}
    const remaining = balanceRef.current?.remainingDays ?? 0;
    if (remaining <= 0) {return;}
    markingRef.current = true;
    try {
      await recordQadaaCompletion({quantity: 1, maxQuantity: remaining});
    } finally {
      markingRef.current = false;
    }
  }, []);

  return {
    // The authoritative balance wins as soon as it exists; the persisted cache
    // (qadaaStore) is only what is shown until then.
    remainingQadaaDays: balance ? balance.remainingDays : remainingQadaaDays,
    totalQadaaDays: balance?.totalDays ?? null,
    completedQadaaDays: balance?.completedDays ?? null,
    automaticQadaaDays: balance?.automaticDays ?? null,
    manualQadaaDays: balance?.manualDays ?? null,
    surplusCompletedDays: balance?.surplusCompletedDays ?? null,
    balance,
    manualEntries: ledgerView.manualEntries,
    completions: ledgerView.completions,
    hijriYear,
    loading,
    ramadanActive,
    showReminder,
    markOneQadaaDayCompleted,
  };
}
