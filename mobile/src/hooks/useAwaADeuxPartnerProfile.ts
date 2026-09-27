import {useCallback, useEffect, useState} from 'react';

import {
  getAwaADeuxPartnerProfileFirstName,
  hydrateAwaADeuxPartnerProfileFirstName,
  setAwaADeuxPartnerProfileFirstName,
  subscribeAwaADeuxPartnerProfileFirstName,
} from '../state/awaADeuxPartnerProfileStore';

/**
 * The PARTNER's own, self-edited profile first name ('' while none is saved yet), kept in
 * sync with its store. This is deliberately a DIFFERENT value from
 * useAwaADeuxPartnerName() (the owner's original entry) — see
 * awaADeuxPartnerProfileStore.ts's header comment for why they never merge automatically.
 */
export function useAwaADeuxPartnerProfile(): {
  firstName: string;
  loaded: boolean;
  setFirstName: (value: string) => boolean;
} {
  const [firstName, setName] = useState(getAwaADeuxPartnerProfileFirstName);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    hydrateAwaADeuxPartnerProfileFirstName().then(value => {
      if (active) {
        setName(value);
        setLoaded(true);
      }
    });
    const unsubscribe = subscribeAwaADeuxPartnerProfileFirstName(() => {
      if (active) {setName(getAwaADeuxPartnerProfileFirstName());}
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const setFirstName = useCallback((value: string) => {
    const {accepted, saved} = setAwaADeuxPartnerProfileFirstName(value);
    saved.catch(error => console.warn('[AWA à deux] Unable to save the partner profile first name:', error));
    return accepted;
  }, []);

  return {firstName, loaded, setFirstName};
}
