import type {QadaaCompletionEntry, QadaaManualEntry} from '../state/qadaaLedgerStore';

// The ONE authoritative Qadaa balance calculation. Every consumer — the hook
// behind FastingQadaaScreen and the dashboards (useQadaaStatus) and the
// post-Ramadan notification scheduler — feeds this function; nobody adds or
// subtracts Qadaa numbers on their own.
//
//   automaticOwed  = distinct Ramadan days inside CONFIRMED periods
//                    (computeQadaaFromHistory — derived, never stored)
//   manualOwed     = sum(quantity of the manual entries)
//   totalOwed      = automaticOwed + manualOwed
//   completed      = sum(quantity of the completion records)
//   effective      = min(totalOwed, completed)
//   remaining      = max(0, totalOwed − effective)
//
// RECONCILIATION (BUG-01): completion records are the user's own reports and
// are NEVER deleted or trimmed because the total shrank (e.g. after correcting a
// menstrual period). When completed > totalOwed the displayed balance is simply
// floored at 0, and the difference is reported as `surplusCompletedDays` so the
// screen can say so openly. The surplus is not discarded: if the total grows
// again it is applied again, deterministically (remaining = total − completed),
// and the user can always see and undo the completion records behind it.

export type QadaaBalance = {
  automaticDays: number;
  manualDays: number;
  totalDays: number;
  /** Sum of every completion record (may exceed totalDays). */
  completedReportedDays: number;
  /** Completed days that count against the current total. */
  completedDays: number;
  remainingDays: number;
  /** completedReportedDays − completedDays: completions beyond the current total. */
  surplusCompletedDays: number;
};

const sumQuantities = (items: readonly {quantity: number}[]): number =>
  items.reduce((sum, item) => sum + (Number.isFinite(item.quantity) && item.quantity > 0 ? Math.floor(item.quantity) : 0), 0);

export function computeQadaaBalance(
  automaticDays: number,
  manualEntries: readonly Pick<QadaaManualEntry, 'quantity'>[],
  completions: readonly Pick<QadaaCompletionEntry, 'quantity'>[],
): QadaaBalance {
  const automatic = Number.isFinite(automaticDays) && automaticDays > 0 ? Math.floor(automaticDays) : 0;
  const manual = sumQuantities(manualEntries);
  const totalDays = automatic + manual;
  const completedReportedDays = sumQuantities(completions);
  const completedDays = Math.min(totalDays, completedReportedDays);
  return {
    automaticDays: automatic,
    manualDays: manual,
    totalDays,
    completedReportedDays,
    completedDays,
    remainingDays: Math.max(0, totalDays - completedDays),
    surplusCompletedDays: completedReportedDays - completedDays,
  };
}

export type QadaaBalanceStatus = {
  kind: 'remaining' | 'all-made-up' | 'none';
  label: string;
};

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * Truthful, derived status wording for the balance (used by the history header).
 * Never says "À jour" while days remain: with a positive remainder it says how
 * many days are left.
 */
export function describeQadaaBalanceStatus(balance: QadaaBalance): QadaaBalanceStatus {
  if (balance.remainingDays > 0) {
    return {kind: 'remaining', label: plural(balance.remainingDays, 'jour restant', 'jours restants')};
  }
  if (balance.totalDays > 0) {
    return {kind: 'all-made-up', label: 'Tout est rattrapé'};
  }
  return {kind: 'none', label: 'À jour'};
}
