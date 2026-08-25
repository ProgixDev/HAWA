import {useEffect, useState} from 'react';
import {getPremiumState, subscribePremiumState, type PremiumState} from '../state/premiumStore';

/** THE single way any screen/component reads Premium status — never read
 * getPremiumState() once and stash it in local state, always go through this
 * hook so a purchase/restore elsewhere in the app is reflected immediately,
 * with no restart and no stale snapshot. Mirrors the subscribeX()/useState
 * pattern already used throughout the app's other stores (e.g.
 * subscribeCyclePreferences in CycleHomeScreen.tsx). */
export function usePremium(): PremiumState {
  const [state, setState] = useState<PremiumState>(getPremiumState);

  useEffect(() => subscribePremiumState(() => setState(getPremiumState())), []);

  return state;
}
