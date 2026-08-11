import {useCallback, useEffect, useMemo, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';

import {fetchPrayerSchedule, type PrayerSchedule, type PrayerWindow} from '../services/prayerTimes';
import {
  getCyclePreferences,
  getPeriodEndDateTime,
  getSelectedLocation,
  getSelectedSchool,
  hydratePeriodEndDateTime,
  hydrateCyclePreferences,
  hydrateSelectedLocation,
  subscribePeriodEndDateTime,
  subscribeCyclePreferences,
  subscribeSelectedLocation,
  type CyclePreferences,
  type OnboardingLocation,
  type SchoolId,
} from '../state/onboardingPreferences';
import {isMenstruatingNow} from '../utils/cycleMath';
import {getPrayerDueAfterPurity, type PurityPrayerResult} from '../utils/purityPrayerLogic';

export type PrayerPurityStatus = {
  cyclePreferences: CyclePreferences;
  selectedLocation: OnboardingLocation | null;
  periodEndDateTime: Date | null;
  schedule: PrayerSchedule | undefined;
  loading: boolean;
  error: boolean;
  now: Date;
  isMenstruating: boolean;
  purityResult: PurityPrayerResult;
  nextWindow: PrayerWindow | undefined;
  refresh: () => Promise<void>;
};

/**
 * Single source of truth for "is she menstruating / is purity restored / is
 * a prayer due" — the SAME fetchPrayerSchedule + getPrayerDueAfterPurity
 * calculation used by PrayerTimesScreen. The Home screen's compact
 * SpiritualGuidanceCard summary consumes this exact result too, so the two
 * screens can never disagree.
 *
 * Pass `enabled = false` to skip fetching entirely (e.g. Home hides this
 * behind the "spiritual markers" toggle) — location/period-end hydration
 * still runs since it's just a cheap local read, only the prayer-time
 * network request is skipped.
 */
export function usePrayerPurityStatus(enabled = true): PrayerPurityStatus {
  const [cyclePreferences, setCyclePreferences] = useState(getCyclePreferences);

  const [selectedLocation, setSelectedLocation] = useState<OnboardingLocation | null>(getSelectedLocation());
  const [selectedSchool, setSelectedSchool] = useState<SchoolId | null>(getSelectedSchool());
  const [periodEndDateTime, setPeriodEndDateTime] = useState<Date | null>(getPeriodEndDateTime());
  const [schedule, setSchedule] = useState<PrayerSchedule | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let active = true;
    hydrateCyclePreferences().then(value => {if (active) {setCyclePreferences(value);}});
    const unsubscribe = subscribeCyclePreferences(() => {if (active) {setCyclePreferences(getCyclePreferences());}});
    return () => {active = false; unsubscribe();};
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      hydrateSelectedLocation().then(location => {
        if (active) {setSelectedLocation(location);}
      });
      setSelectedSchool(getSelectedSchool());
      const unsubscribe = subscribeSelectedLocation(() => {
        if (active) {setSelectedLocation(getSelectedLocation());}
      });
      return () => {active = false; unsubscribe();};
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      hydratePeriodEndDateTime().then(value => {
        if (active) {setPeriodEndDateTime(value);}
      });
      const unsubscribe = subscribePeriodEndDateTime(() => {
        if (active) {setPeriodEndDateTime(getPeriodEndDateTime());}
      });
      return () => {active = false; unsubscribe();};
    }, []),
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const loadSchedule = useCallback(async () => {
    if (!enabled || !selectedLocation) {
      setSchedule(undefined);
      return;
    }
    setError(false);
    try {
      const result = await fetchPrayerSchedule(selectedLocation, selectedSchool);
      setSchedule(result);
    } catch {
      setError(true);
    }
  }, [enabled, selectedLocation, selectedSchool]);

  useEffect(() => {
    setLoading(true);
    loadSchedule().finally(() => setLoading(false));
  }, [loadSchedule]);

  const isMenstruating = useMemo(
    () => isMenstruatingNow(now, cyclePreferences, periodEndDateTime),
    [now, cyclePreferences, periodEndDateTime],
  );

  const purityResult = useMemo(
    () => getPrayerDueAfterPurity(isMenstruating, periodEndDateTime, schedule?.purityWindows),
    [isMenstruating, periodEndDateTime, schedule],
  );

  const nextWindow = useMemo(() => {
    if (!schedule) {return undefined;}
    return schedule.windows.find(candidate => candidate.start.getTime() > now.getTime()) ?? schedule.nextDayFirstWindow;
  }, [schedule, now]);

  return {
    cyclePreferences,
    selectedLocation,
    periodEndDateTime,
    schedule,
    loading,
    error,
    now,
    isMenstruating,
    purityResult,
    nextWindow,
    refresh: loadSchedule,
  };
}
