import {useCallback, useEffect, useState} from 'react';

import {
  getSharingToggles,
  hydrateSharingToggles,
  setSharingToggle,
  subscribeSharingToggles,
  type SharingKey,
  type SharingToggles,
} from '../state/awaADeuxSharingStore';
import {
  getActiveObjective,
  hydrateActiveObjective,
  subscribeActiveObjective,
} from '../state/onboardingPreferences';

/**
 * The saved "AWA à deux" sharing choices, kept in sync with their store, plus whether
 * pregnancy mode is on (the active objective is pregnancy) — which decides whether the
 * Pregnancy category exists at all for the partner.
 */
export function useAwaADeuxSharing(): {
  toggles: SharingToggles;
  isPregnant: boolean;
  loaded: boolean;
  setToggle: (key: SharingKey, value: boolean) => void;
} {
  const [toggles, setToggles] = useState<SharingToggles>(getSharingToggles);
  const [isPregnant, setIsPregnant] = useState(() => getActiveObjective() === 'pregnancy');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    hydrateSharingToggles().then(value => {
      if (active) {
        setToggles(value);
        setLoaded(true);
      }
    });
    hydrateActiveObjective().then(value => {
      if (active) {setIsPregnant(value === 'pregnancy');}
    });
    const unsubscribeToggles = subscribeSharingToggles(() => {
      if (active) {setToggles(getSharingToggles());}
    });
    const unsubscribeObjective = subscribeActiveObjective(() => {
      if (active) {setIsPregnant(getActiveObjective() === 'pregnancy');}
    });
    return () => {
      active = false;
      unsubscribeToggles();
      unsubscribeObjective();
    };
  }, []);

  const setToggle = useCallback((key: SharingKey, value: boolean) => {
    setSharingToggle(key, value).catch(error => console.warn('[AWA à deux] Unable to save a sharing choice:', error));
  }, []);

  return {toggles, isPregnant, loaded, setToggle};
}
