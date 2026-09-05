// Canonical frontend Premium/subscription state — the ONE source of truth
// every screen must read instead of maintaining its own local `isPremium`.
// Same module-singleton + listeners pattern already used throughout
// src/state/ (e.g. menopausePreferences.ts), except this is runtime
// entitlement status, not persisted user data: the real source of truth is
// whichever purchase provider purchaseService.ts talks to, never
// AsyncStorage on its own (see purchaseService.ts's own header comment).
//
// No purchase SDK exists in this project yet (confirmed: no
// react-native-iap/react-native-purchases/RevenueCat/Billing dependency in
// package.json). Until one is added, `initializePremium()` always resolves
// to `isPremium: false` and purchase/restore actions always report
// `'unavailable'` — see purchaseService.ts. This file has no opinion about
// whether a provider exists; it only stores whatever purchaseService.ts
// reports, and never invents a favorable answer on its own.

export type PremiumState = {
  /** Real entitlement only — never true unless a purchase provider actually
   * confirmed it. Defaults to false, and errors/unavailability must never
   * flip this to true. */
  isPremium: boolean;
  /** False until initializePremium() has resolved once at app startup —
   * screens must treat "not yet initialized" as an explicit loading state,
   * never silently render as if `isPremium` were a final answer. */
  initialized: boolean;
  /** True while the initial entitlement resolution (or a manual refresh) is
   * in flight. */
  loading: boolean;
  purchaseInProgress: boolean;
  restoreInProgress: boolean;
  /** User-safe message only (never a raw SDK code/stack trace) — see
   * purchaseService.ts's own error-mapping discipline. Cleared on the next
   * successful action. */
  error: string | null;
};

const INITIAL_STATE: PremiumState = {
  isPremium: false,
  initialized: false,
  loading: false,
  purchaseInProgress: false,
  restoreInProgress: false,
  error: null,
};

let state: PremiumState = {...INITIAL_STATE};
const listeners = new Set<() => void>();

const notifyListeners = (): void => {
  listeners.forEach(listener => listener());
};

export const getPremiumState = (): PremiumState => ({...state});

export const subscribePremiumState = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Internal — only ever called by purchaseService.ts, never directly by a
 * screen/component. Merges a partial update and notifies subscribers. */
export function updatePremiumState(patch: Partial<PremiumState>): void {
  state = {...state, ...patch};
  notifyListeners();
}

/** Resets to the safe, fully-locked default — used only for test isolation
 * (see __tests__) so one test's state can never leak into the next. Never
 * called from application code. */
export function resetPremiumStateForTests(): void {
  state = {...INITIAL_STATE};
  notifyListeners();
}
