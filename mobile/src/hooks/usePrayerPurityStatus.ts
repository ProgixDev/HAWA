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

type PrayerScheduleStatus = {
  selectedLocation: OnboardingLocation | null;
  schedule: PrayerSchedule | undefined;
  loading: boolean;
  error: boolean;
  now: Date;
  nextWindow: PrayerWindow | undefined;
  refresh: () => Promise<void>;
};

/**
 * Objective-agnostic prayer-schedule fetch: location + prayer times only,
 * no menstrual/purity data. Shared base for `usePrayerPurityStatus` (Cycle)
 * and `usePregnancySpiritualStatus` (Pregnancy) so both read the exact same
 * location/schedule state instead of duplicating the fetch logic.
 */
function usePrayerSchedule(enabled: boolean): PrayerScheduleStatus {
  const [selectedLocation, setSelectedLocation] = useState<OnboardingLocation | null>(getSelectedLocation());
  const [selectedSchool, setSelectedSchool] = useState<SchoolId | null>(getSelectedSchool());
  const [schedule, setSchedule] = useState<PrayerSchedule | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => new Date());

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

  const nextWindow = useMemo(() => {
    if (!schedule) {return undefined;}
    return schedule.windows.find(candidate => candidate.start.getTime() > now.getTime()) ?? schedule.nextDayFirstWindow;
  }, [schedule, now]);

  return {
    selectedLocation,
    schedule,
    loading,
    error,
    now,
    nextWindow,
    refresh: loadSchedule,
  };
}

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
  const [periodEndDateTime, setPeriodEndDateTime] = useState<Date | null>(getPeriodEndDateTime());

  const schedule = usePrayerSchedule(enabled);

  useEffect(() => {
    let active = true;
    hydrateCyclePreferences().then(value => {if (active) {setCyclePreferences(value);}});
    const unsubscribe = subscribeCyclePreferences(() => {if (active) {setCyclePreferences(getCyclePreferences());}});
    return () => {active = false; unsubscribe();};
  }, []);

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

  const isMenstruating = useMemo(
    () => isMenstruatingNow(schedule.now, cyclePreferences, periodEndDateTime),
    [schedule.now, cyclePreferences, periodEndDateTime],
  );

  const purityResult = useMemo(
    () => getPrayerDueAfterPurity(isMenstruating, periodEndDateTime, schedule.schedule?.purityWindows),
    [isMenstruating, periodEndDateTime, schedule.schedule],
  );

  return {
    cyclePreferences,
    selectedLocation: schedule.selectedLocation,
    periodEndDateTime,
    schedule: schedule.schedule,
    loading: schedule.loading,
    error: schedule.error,
    now: schedule.now,
    isMenstruating,
    purityResult,
    nextWindow: schedule.nextWindow,
    refresh: schedule.refresh,
  };
}

export type PregnancySpiritualStatus = PrayerScheduleStatus;

/**
 * Pregnancy-safe counterpart to `usePrayerPurityStatus`: same shared
 * location/prayer-schedule fetch, but deliberately never touches
 * cyclePreferences / periodEndDateTime / menstruation or purity status.
 * PregnancyDashboard must not derive spiritual state from Cycle menstrual
 * data — see the "Repères spirituels" adaptation for Pregnancy.
 */
export function usePregnancySpiritualStatus(enabled = true): PregnancySpiritualStatus {
  return usePrayerSchedule(enabled);
}

export type PostpartumSpiritualStatus = PrayerScheduleStatus;

/**
 * Postpartum-safe counterpart to `usePrayerPurityStatus`: same shared
 * location/prayer-schedule fetch, but deliberately never touches
 * cyclePreferences / periodEndDateTime / menstruation or purity status —
 * nifas is a distinct state from Cycle purity and has no rules engine here
 * yet (see PostpartumDashboard's "Repères spirituels" card, which only
 * shows a neutral "Nifas — Jour X" day count, never a purity verdict).
 */
export function usePostpartumSpiritualStatus(enabled = true): PostpartumSpiritualStatus {
  return usePrayerSchedule(enabled);
}

export type MiscarriageSpiritualStatus = PrayerScheduleStatus;

/**
 * Miscarriage-safe counterpart to `usePrayerPurityStatus`: same shared
 * location/prayer-schedule fetch, but deliberately never touches
 * cyclePreferences / periodEndDateTime / menstruation or purity status —
 * "Après une fausse couche" must never copy normal menstrual Cycle "purity
 * status" automatically (see MiscarriageDashboard's "Repères spirituels"
 * card, which only ever shows prayer time + Hijri date, exactly like
 * Pregnancy's).
 */
export function useMiscarriageSpiritualStatus(enabled = true): MiscarriageSpiritualStatus {
  return usePrayerSchedule(enabled);
}

export type ContraceptionSpiritualStatus = PrayerScheduleStatus;

/**
 * Contraception-safe counterpart to `usePrayerPurityStatus`: same shared
 * location/prayer-schedule fetch, but deliberately never touches
 * cyclePreferences / periodEndDateTime / menstruation or purity status —
 * ContraceptionDashboard's "Repères spirituels" card only ever shows prayer
 * time + Hijri date, exactly like Pregnancy/Postpartum/Miscarriage's.
 */
export function useContraceptionSpiritualStatus(enabled = true): ContraceptionSpiritualStatus {
  return usePrayerSchedule(enabled);
}

export type MenopauseSpiritualStatus = PrayerScheduleStatus;

/**
 * Menopause-safe counterpart to `usePrayerPurityStatus`: same shared
 * location/prayer-schedule fetch, but deliberately never touches
 * cyclePreferences / periodEndDateTime / menstruation or purity status —
 * MenopauseDashboard's "Repères spirituels" card only ever shows prayer time
 * + Hijri date, exactly like Pregnancy/Postpartum/Miscarriage/Contraception's.
 */
export function useMenopauseSpiritualStatus(enabled = true): MenopauseSpiritualStatus {
  return usePrayerSchedule(enabled);
}
