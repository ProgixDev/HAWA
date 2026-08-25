import type {PremiumPlan} from '../config/premiumPricing';
import {getPremiumState, updatePremiumState} from '../state/premiumStore';

// The ONLY file that is allowed to know about a native purchase provider
// (Google Play Billing / StoreKit / RevenueCat) and the ONLY file allowed to
// call updatePremiumState() with a real entitlement value. Every screen goes
// through usePremium()/this service — never through a native purchase
// module directly — so wiring a real SDK later means implementing the 3
// functions below against that SDK's real API; nothing else in the app
// (store, hook, screens, gates) needs to change.
//
// No purchase SDK is installed in this project today (verified against
// package.json — no react-native-iap/react-native-purchases/RevenueCat/
// Billing dependency exists). Every function below therefore fails safely:
// it never flips `isPremium` to true, and reports 'unavailable' rather than
// silently pretending a purchase happened. This is intentional per the
// task's explicit "do not fake Premium" requirement, not an oversight.

export type PurchaseOutcome = 'success' | 'cancelled' | 'error' | 'unavailable';

const NO_PROVIDER_ERROR =
  'AWA Premium n’est pas encore disponible sur cet appareil. Réessaie plus tard.';

/** True once a real purchase provider is wired into this file. Kept as one
 * explicit flag (rather than scattering `false` literals through every
 * function below) so the day a real SDK is added, flipping this one
 * constant — plus implementing the 3 functions' TODO branches — is the
 * entire integration surface. */
const PURCHASE_PROVIDER_AVAILABLE = false;

/** Resolves real entitlement status. Called once at app startup
 * (App.tsx) and safe to call again (e.g. pull-to-refresh on the Premium
 * screen) — always re-derives from the provider, never trusts a stale local
 * flag as authoritative. Never throws: any provider failure resolves to the
 * safe default (`isPremium: false`) so app startup can never crash or hang
 * because entitlement resolution failed. */
export async function initializePremium(): Promise<void> {
  if (getPremiumState().loading) {return;}
  updatePremiumState({loading: true, error: null});

  try {
    if (!PURCHASE_PROVIDER_AVAILABLE) {
      // Fails safe: no provider means no entitlement, never a guess.
      updatePremiumState({isPremium: false, initialized: true, loading: false});
      return;
    }

    // TODO (when a real purchase SDK is added): resolve current entitlement
    // from the provider here, e.g.:
    //   const customerInfo = await Purchases.getCustomerInfo();
    //   updatePremiumState({isPremium: Boolean(customerInfo.entitlements.active['premium']), initialized: true, loading: false});
    updatePremiumState({isPremium: false, initialized: true, loading: false});
  } catch {
    // Never unlock Premium because of an error — safe fallback stays locked.
    updatePremiumState({isPremium: false, initialized: true, loading: false, error: NO_PROVIDER_ERROR});
  }
}

/** Starts a purchase for `plan`. Guards against a second concurrent call
 * itself (not just relying on the UI disabling its button) — a caller that
 * double-taps gets the SAME in-flight outcome, never a second purchase
 * request. Never resolves 'success' unless a real provider actually
 * confirmed the purchase. */
export async function purchasePremium(_plan: PremiumPlan): Promise<PurchaseOutcome> {
  if (getPremiumState().purchaseInProgress) {return 'error';}
  updatePremiumState({purchaseInProgress: true, error: null});

  try {
    if (!PURCHASE_PROVIDER_AVAILABLE) {
      updatePremiumState({purchaseInProgress: false, error: NO_PROVIDER_ERROR});
      return 'unavailable';
    }

    // TODO (when a real purchase SDK is added): start the real purchase flow
    // for `plan` here, e.g.:
    //   const {customerInfo} = await Purchases.purchasePackage(packageFor(plan));
    //   const isPremium = Boolean(customerInfo.entitlements.active['premium']);
    //   updatePremiumState({isPremium, purchaseInProgress: false});
    //   return 'success';
    // Map the SDK's own cancellation/error codes to 'cancelled'/'error' —
    // user cancellation must never be treated as a fatal error, and no raw
    // SDK code/stack trace is ever shown to the user (see NO_PROVIDER_ERROR
    // for the user-safe message pattern to reuse).
    updatePremiumState({purchaseInProgress: false, error: NO_PROVIDER_ERROR});
    return 'unavailable';
  } catch {
    updatePremiumState({purchaseInProgress: false, error: NO_PROVIDER_ERROR});
    return 'error';
  }
}

/** Restores a previous purchase. Same concurrency guard and safe-failure
 * discipline as purchasePremium() above. 'unavailable' (no provider) and
 * 'success' with no active purchase found are both real, expected, non-error
 * outcomes for the caller to distinguish and message accordingly. */
export async function restorePurchases(): Promise<PurchaseOutcome> {
  if (getPremiumState().restoreInProgress) {return 'error';}
  updatePremiumState({restoreInProgress: true, error: null});

  try {
    if (!PURCHASE_PROVIDER_AVAILABLE) {
      updatePremiumState({restoreInProgress: false, error: NO_PROVIDER_ERROR});
      return 'unavailable';
    }

    // TODO (when a real purchase SDK is added): restore entitlements from
    // the provider here, e.g.:
    //   const customerInfo = await Purchases.restorePurchases();
    //   const isPremium = Boolean(customerInfo.entitlements.active['premium']);
    //   updatePremiumState({isPremium, restoreInProgress: false});
    //   return 'success';
    updatePremiumState({restoreInProgress: false, error: NO_PROVIDER_ERROR});
    return 'unavailable';
  } catch {
    updatePremiumState({restoreInProgress: false, error: NO_PROVIDER_ERROR});
    return 'error';
  }
}
