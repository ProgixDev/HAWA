import {useEffect, useState} from 'react';

import {
  getPregnancyTrackingPreferences,
  hydratePregnancyTrackingPreferences,
  subscribePregnancyTrackingPreferences,
  type PregnancyTrackingPreference,
} from '../state/pregnancyPreferences';

/** The Pregnancy "tracking preferences" (which daily-tracking categories the
 * user chose), live: hydrated once and re-rendered on every change, so the
 * Dashboard and the journal sheet follow an edit without a remount. It only
 * READS the preference — recorded history is never affected by it. */
export function usePregnancyTrackingPreferences(): Set<PregnancyTrackingPreference> {
  const [preferences, setPreferences] = useState(getPregnancyTrackingPreferences);

  useEffect(() => {
    let active = true;
    hydratePregnancyTrackingPreferences().then(value => {
      if (active) {setPreferences(value);}
    });
    const unsubscribe = subscribePregnancyTrackingPreferences(() => {
      if (active) {setPreferences(getPregnancyTrackingPreferences());}
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return preferences;
}
