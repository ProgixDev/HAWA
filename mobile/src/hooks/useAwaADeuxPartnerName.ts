import {useCallback, useEffect, useState} from 'react';

import {
  getAwaADeuxPartnerName,
  hydrateAwaADeuxPartnerName,
  setAwaADeuxPartnerName,
  subscribeAwaADeuxPartnerName,
} from '../state/awaADeuxPartnerStore';

/**
 * The saved partner name of "AWA à deux" ('' while none is configured), kept in sync with
 * its store. Every AWA à deux screen that shows the name reads it from here.
 */
export function useAwaADeuxPartnerName(): {
  partnerName: string;
  loaded: boolean;
  setPartnerName: (value: string) => boolean;
} {
  const [partnerName, setName] = useState(getAwaADeuxPartnerName);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    hydrateAwaADeuxPartnerName().then(value => {
      if (active) {
        setName(value);
        setLoaded(true);
      }
    });
    const unsubscribe = subscribeAwaADeuxPartnerName(() => {
      if (active) {setName(getAwaADeuxPartnerName());}
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const setPartnerName = useCallback((value: string) => {
    const {accepted, saved} = setAwaADeuxPartnerName(value);
    saved.catch(error => console.warn('[AWA à deux] Unable to save the partner name:', error));
    return accepted;
  }, []);

  return {partnerName, loaded, setPartnerName};
}
