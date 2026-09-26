import {useEffect, useState} from 'react';
import {
  getActiveObjective,
  getCycleObservationStartedAt,
  getCyclePreferences,
  getHasConfirmedCycleData,
  getRecordedPeriodHistory,
  subscribeActiveObjective,
  subscribeCyclePreferences,
} from '../state/onboardingPreferences';
import {journalCycleDayFor} from '../utils/journalCycleDay';

const computeFor = (today: Date): number | null => {
  const preferences = getCyclePreferences();
  return journalCycleDayFor({
    objective: getActiveObjective(),
    hasConfirmedCycleData: getHasConfirmedCycleData(),
    basics: preferences,
    regularity: preferences.regularity,
    periodStartDates: getRecordedPeriodHistory().map(record => new Date(`${record.startDate}T12:00:00`)),
    observationStartedAt: getCycleObservationStartedAt(),
    today,
  });
};

/** "Jour N du cycle" for the shared journal entry screens, or null when the
 * header must not show one (objective without a menstrual cycle, cycle data
 * not confirmed, or a count no prediction mode supports) — see
 * journalCycleDayFor(). `today` should come from useToday() so the value
 * follows the local day; the objective/cycle stores are subscribed so a
 * late hydration or an objective switch updates the header live. */
export function useJournalCycleDay(today: Date): number | null {
  const [cycleDay, setCycleDay] = useState<number | null>(() => computeFor(today));

  useEffect(() => {
    const refresh = () => setCycleDay(computeFor(today));
    refresh();
    const unsubscribeObjective = subscribeActiveObjective(refresh);
    const unsubscribeCycle = subscribeCyclePreferences(refresh);
    return () => {
      unsubscribeObjective();
      unsubscribeCycle();
    };
  }, [today]);

  return cycleDay;
}
