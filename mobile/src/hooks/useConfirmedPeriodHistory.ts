import {useCallback, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';

import {
  getConfirmedPeriodHistory,
  hydrateConfirmedPeriodHistory,
  subscribeConfirmedPeriodHistory,
  type ConfirmedPeriodOccurrence,
} from '../state/confirmedPeriodHistoryStore';

/**
 * Thin read hook over confirmedPeriodHistoryStore — the same historical
 * source of truth useQadaaStatus derives remainingQadaaDays from. Used by
 * FastingQadaaScreen's "Historique" section. Computes nothing itself; see
 * src/utils/qadaaHistoryPresentation.ts for the presentation derivation.
 */
export function useConfirmedPeriodHistory(): ConfirmedPeriodOccurrence[] {
  const [history, setHistory] = useState<ConfirmedPeriodOccurrence[]>(getConfirmedPeriodHistory());

  useFocusEffect(
    useCallback(() => {
      let active = true;
      hydrateConfirmedPeriodHistory().then(value => {
        if (active) {setHistory(value);}
      });
      const unsubscribe = subscribeConfirmedPeriodHistory(() => {
        if (active) {setHistory(getConfirmedPeriodHistory());}
      });
      return () => {
        active = false;
        unsubscribe();
      };
    }, []),
  );

  return history;
}
