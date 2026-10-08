import {useEffect, useState} from 'react';

import {getUnavailableStructuredKeys, subscribeStructuredAvailability} from '../services/secureAsyncStorage';

export {isActiveProfileDataUnavailable} from '../services/secureAsyncStorage';

// Lets a screen ask "could the data I am about to show not be READ?" — which is different from "is there no data?".
// Used by the banner, Statistics and the reminder scheduler so that unreadable records never read as an empty history.

export type UnavailableItem = ReturnType<typeof getUnavailableStructuredKeys>[number];

export function useStructuredDataAvailability(): {unavailable: UnavailableItem[]; anyUnavailable: boolean} {
  const [unavailable, setUnavailable] = useState<UnavailableItem[]>(getUnavailableStructuredKeys);
  useEffect(() => {
    setUnavailable(getUnavailableStructuredKeys());
    return subscribeStructuredAvailability(() => setUnavailable(getUnavailableStructuredKeys()));
  }, []);
  return {unavailable, anyUnavailable: unavailable.length > 0};
}

