import {useCallback, useMemo, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';

import {getAllJournalEntries} from '../state/dailyJournalStore';
import {
  getAllIrregularJournalEntries,
  hydrateIrregularJournal,
  subscribeIrregularJournal,
} from '../state/irregularJournalStore';
import {
  getConfirmedPeriodHistory,
  hydrateConfirmedPeriodHistory,
  subscribeConfirmedPeriodHistory,
} from '../state/confirmedPeriodHistoryStore';
import {
  getIrregularPreferences,
  hydrateIrregularPreferences,
  subscribeIrregularPreferences,
} from '../state/irregularPreferences';
import {
  collectActualPeriodDayKeys,
  type IrregularPeriodSources,
} from '../utils/irregularJournalSelectors';

/**
 * The real period data behind every SOPK ("Cycles irréguliers") screen that
 * needs "when did the last period start / how long was it / what cycles have
 * been observed": the actual period days recorded through the journal, the
 * cycle-confirmed occurrences, and the onboarding answer. Feed the result to
 * the pure resolvers in utils/irregularJournalSelectors.ts.
 *
 * Read-only — it never writes to confirmedPeriodHistory or to the onboarding
 * answer. The shared daily journal has no subscription API, so it is re-read
 * on focus and whenever the SOPK journal changes (the "Règles" answer is
 * saved to both). `enabled: false` makes the hook inert (for screens that only
 * need this in the SOPK objective).
 */
export function useIrregularPeriodSources(enabled = true): IrregularPeriodSources {
  const [periodDayKeys, setPeriodDayKeys] = useState<string[]>([]);
  const [confirmedHistory, setConfirmedHistory] = useState(getConfirmedPeriodHistory);
  const [declaredLastPeriodDate, setDeclaredLastPeriodDate] = useState(
    () => getIrregularPreferences().lastPeriodDate,
  );

  useFocusEffect(
    useCallback(() => {
      if (!enabled) {return undefined;}
      let active = true;

      const reloadPeriodDays = async () => {
        await hydrateIrregularJournal();
        const journalEntries = await getAllJournalEntries();
        if (active) {
          setPeriodDayKeys(collectActualPeriodDayKeys(journalEntries, getAllIrregularJournalEntries()));
        }
      };

      reloadPeriodDays().catch(() => {});
      hydrateConfirmedPeriodHistory().then(history => {
        if (active) {setConfirmedHistory(history);}
      });
      hydrateIrregularPreferences().then(value => {
        if (active) {setDeclaredLastPeriodDate(value.lastPeriodDate);}
      });

      const unsubscribeJournal = subscribeIrregularJournal(() => {
        reloadPeriodDays().catch(() => {});
      });
      const unsubscribeConfirmed = subscribeConfirmedPeriodHistory(() => {
        if (active) {setConfirmedHistory(getConfirmedPeriodHistory());}
      });
      const unsubscribePrefs = subscribeIrregularPreferences(() => {
        if (active) {setDeclaredLastPeriodDate(getIrregularPreferences().lastPeriodDate);}
      });

      return () => {
        active = false;
        unsubscribeJournal();
        unsubscribeConfirmed();
        unsubscribePrefs();
      };
    }, [enabled]),
  );

  return useMemo(
    () => ({periodDayKeys, confirmedHistory, declaredLastPeriodDate}),
    [periodDayKeys, confirmedHistory, declaredLastPeriodDate],
  );
}
