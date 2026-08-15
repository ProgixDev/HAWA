export type ObjectiveId =
  | 'cycle'
  | 'conceive'
  | 'contraception'
  | 'irregular'
  | 'menopause'
  | 'pregnancy'
  | 'postpartum'
  | 'loss';

export type CycleRegularity = 'yes' | 'no' | 'unknown';

export type CyclePreferences = {
  lastPeriodStart: Date;
  periodDuration: number;
  cycleDuration: number;
  regularity: CycleRegularity;
};

export type PeriodHistoryRecord = {
  id: string;
  startDate: string;
  endDate: string;
};

export type SchoolId = 'hanafi' | 'maliki' | 'chafii' | 'hanbali' | 'unknown';
export type OnboardingLocation = {
  city: string;
  country: string;
  timezone?: string;
  latitude: number;
  longitude: number;
};

const OBJECTIVE_STORAGE_KEY = '@hawa/active-objective';
const SPIRITUAL_MARKERS_STORAGE_KEY = '@hawa/spiritual-markers-enabled';
const OBJECTIVE_IDS: ObjectiveId[] = [
  'cycle',
  'conceive',
  'contraception',
  'irregular',
  'menopause',
  'pregnancy',
  'postpartum',
  'loss',
];
let activeObjective: ObjectiveId = 'cycle';
let objectiveHydrated = false;
let objectiveHydration: Promise<ObjectiveId> | null = null;
let objectiveRevision = 0;
const objectiveListeners = new Set<() => void>();
let firstName = 'Amina';
let spiritualMarkersEnabled = true;
let spiritualMarkersHydration: Promise<boolean> | null = null;
const spiritualMarkersListeners = new Set<() => void>();
let selectedSchool: SchoolId | null = null;
let selectedLocation: OnboardingLocation | null = null;
const LOCATION_STORAGE_KEY = '@hawa/selected-location';
const locationListeners = new Set<() => void>();
let locationHydration: Promise<OnboardingLocation | null> | null = null;
let locationHydrated = false;
let cyclePreferences: CyclePreferences = {
  lastPeriodStart: new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    Math.max(1, new Date().getDate() - 5),
  ),
  periodDuration: 5,
  cycleDuration: 28,
  regularity: 'yes',
};
const CYCLE_STORAGE_KEY = '@hawa/cycle-preferences';
const cycleListeners = new Set<() => void>();
let cycleHydrated = false;
let cycleHydration: Promise<CyclePreferences> | null = null;
let periodHistory: PeriodHistoryRecord[] = [];
// Anchor date for the 'unknown' regularity observation window (see
// computeCyclePredictionStatus() in cycleMath.ts). Deliberately NOT a fresh
// "now" timestamp — it's derived from the same lastPeriodStart every other
// cycle calculation already uses, so observation counts from the most
// recent REAL period known at the moment 'unknown' was selected, not from
// an unrelated new concept of time.
let cycleObservationStartedAt: Date | null = null;

const cycleDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;

const cycleSnapshot = () => ({
  preferences: {
    ...cyclePreferences,
    lastPeriodStart: cyclePreferences.lastPeriodStart.toISOString(),
  },
  periodHistory,
  observationStartedAt: cycleObservationStartedAt
    ? cycleObservationStartedAt.toISOString()
    : null,
});

const notifyCycleListeners = () =>
  cycleListeners.forEach(listener => listener());
const persistCycle = () =>
  AsyncStorage.setItem(CYCLE_STORAGE_KEY, JSON.stringify(cycleSnapshot()));

const isObjectiveId = (value: unknown): value is ObjectiveId =>
  typeof value === 'string' && OBJECTIVE_IDS.includes(value as ObjectiveId);

const notifyObjectiveListeners = () =>
  objectiveListeners.forEach(listener => listener());

export const getActiveObjective = (): ObjectiveId => activeObjective;

export const setActiveObjective = async (value: ObjectiveId): Promise<void> => {
  objectiveRevision += 1;
  activeObjective = value;
  notifyObjectiveListeners();
  await AsyncStorage.setItem(OBJECTIVE_STORAGE_KEY, value);
};

export const hydrateActiveObjective = (): Promise<ObjectiveId> => {
  if (objectiveHydrated) {
    return Promise.resolve(activeObjective);
  }
  if (!objectiveHydration) {
    const hydrationRevision = objectiveRevision;
    objectiveHydration = AsyncStorage.getItem(OBJECTIVE_STORAGE_KEY)
      .then(stored => {
        objectiveHydrated = true;
        if (hydrationRevision === objectiveRevision && isObjectiveId(stored)) {
          activeObjective = stored;
          notifyObjectiveListeners();
        }
        return activeObjective;
      })
      .catch(() => {
        objectiveHydrated = true;
        return activeObjective;
      });
  }
  return objectiveHydration;
};

export const subscribeActiveObjective = (listener: () => void) => {
  objectiveListeners.add(listener);
  return () => {
    objectiveListeners.delete(listener);
  };
};

// Compatibility aliases for the existing onboarding and summary screens.
// They point to the same canonical activeObjective; no second state exists.
export const setSelectedObjective = setActiveObjective;
export const getSelectedObjective = getActiveObjective;

export const setSpiritualMarkersEnabled = (value: boolean) => {
  spiritualMarkersEnabled = value;
  spiritualMarkersListeners.forEach(listener => listener());
  AsyncStorage.setItem(
    SPIRITUAL_MARKERS_STORAGE_KEY,
    value ? 'true' : 'false',
  ).catch(() => {});
};

export const getSpiritualMarkersEnabled = () => spiritualMarkersEnabled;

export const hydrateSpiritualMarkersEnabled = (): Promise<boolean> => {
  if (!spiritualMarkersHydration) {
    spiritualMarkersHydration = AsyncStorage.getItem(
      SPIRITUAL_MARKERS_STORAGE_KEY,
    )
      .then(value => {
        if (value !== null) {
          spiritualMarkersEnabled = value === 'true';
        }
        spiritualMarkersListeners.forEach(listener => listener());
        return spiritualMarkersEnabled;
      })
      .catch(() => spiritualMarkersEnabled);
  }
  return spiritualMarkersHydration;
};

export const subscribeSpiritualMarkersEnabled = (listener: () => void) => {
  spiritualMarkersListeners.add(listener);
  return () => {
    spiritualMarkersListeners.delete(listener);
  };
};

export const setSelectedSchool = (value: SchoolId) => {
  selectedSchool = value;
};

export const getSelectedSchool = () => selectedSchool;

const isStoredLocation = (value: unknown): value is OnboardingLocation => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<OnboardingLocation>;
  return (
    typeof candidate.city === 'string' &&
    typeof candidate.country === 'string' &&
    Number.isFinite(candidate.latitude) &&
    Number.isFinite(candidate.longitude)
  );
};

const notifyLocationListeners = () => {
  locationListeners.forEach(listener => listener());
};

export const setSelectedLocation = async (value: OnboardingLocation) => {
  selectedLocation = { ...value };
  notifyLocationListeners();
  await AsyncStorage.setItem(
    LOCATION_STORAGE_KEY,
    JSON.stringify(selectedLocation),
  );
};

export const getSelectedLocation = (): OnboardingLocation | null =>
  selectedLocation ? { ...selectedLocation } : null;

export const hydrateSelectedLocation =
  (): Promise<OnboardingLocation | null> => {
    // Once the initial AsyncStorage read has resolved, the in-memory value is
    // authoritative (kept current by setSelectedLocation) — return it
    // directly instead of the cached first-read promise. Re-resolving that
    // stale promise on every later call (e.g. a screen's useFocusEffect
    // firing again) would silently overwrite a newer value with the snapshot
    // from whenever the app first hydrated.
    if (locationHydrated) {
      return Promise.resolve(getSelectedLocation());
    }
    if (!locationHydration) {
      locationHydration = AsyncStorage.getItem(LOCATION_STORAGE_KEY)
        .then(raw => {
          locationHydrated = true;
          if (!raw) {
            return getSelectedLocation();
          }
          const parsed: unknown = JSON.parse(raw);
          if (isStoredLocation(parsed)) {
            selectedLocation = { ...parsed };
            notifyLocationListeners();
          }
          return getSelectedLocation();
        })
        .catch(() => {
          locationHydrated = true;
          return getSelectedLocation();
        });
    }
    return locationHydration;
  };

export const subscribeSelectedLocation = (listener: () => void) => {
  locationListeners.add(listener);
  return () => {
    locationListeners.delete(listener);
  };
};

export const setFirstName = (value: string) => {
  if (value.trim()) {
    firstName = value.trim();
  }
};

export const getFirstName = () => firstName;

export const setCyclePreferences = (value: CyclePreferences) => {
  const previousLastPeriodStart = cyclePreferences.lastPeriodStart;
  const previousRegularity = cyclePreferences.regularity;
  cyclePreferences = {
    ...value,
    lastPeriodStart: new Date(value.lastPeriodStart),
  };

  // Entering 'unknown' (freshly, or again after having left it) starts a new
  // observation window anchored to the real period start just declared;
  // re-saving while already 'unknown' preserves existing observation
  // progress instead of resetting it.
  if (
    cyclePreferences.regularity === 'unknown' &&
    previousRegularity !== 'unknown'
  ) {
    cycleObservationStartedAt = new Date(cyclePreferences.lastPeriodStart);
  }

  const start = new Date(cyclePreferences.lastPeriodStart);
  const end = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + cyclePreferences.periodDuration - 1,
  );
  const record = {
    id: cycleDateKey(start),
    startDate: cycleDateKey(start),
    endDate: cycleDateKey(end),
  };
  periodHistory = [
    ...periodHistory.filter(item => item.id !== record.id),
    record,
  ].sort((a, b) => a.startDate.localeCompare(b.startDate));
  notifyCycleListeners();
  persistCycle().catch(() => {});

  // A genuinely new period start supersedes any previously confirmed
  // periodEndDateTime that belongs to an earlier period. Without this, a
  // stale confirmation could later be paired with this unrelated cycle by
  // any code reading periodEndDateTime alongside cyclePreferences (see the
  // qadaa sync investigation). Only clear when the start actually moved
  // forward past the old confirmed end, so editing the *same* period's
  // start (e.g. correcting a typo) doesn't wipe a same-period confirmation.
  const currentPeriodEnd = getPeriodEndDateTime();
  if (
    currentPeriodEnd &&
    cyclePreferences.lastPeriodStart.getTime() !==
      previousLastPeriodStart.getTime() &&
    currentPeriodEnd.getTime() < cyclePreferences.lastPeriodStart.getTime()
  ) {
    setPeriodEndDateTime(null);
  }
};

/** THE single canonical way to record "my period really started on this
 * date" — used by the Dashboard/Calendar period-start confirmation CTA (and
 * nowhere else; do not duplicate this call). Delegates entirely to
 * setCyclePreferences(), so it inherits the exact same history-preserving
 * persistence, observation-window anchoring, and stale periodEndDateTime
 * cleanup — only `lastPeriodStart` changes, periodDuration/cycleDuration/
 * regularity are left exactly as the user configured them. Any date/late
 * status/irregular window derived from `lastPeriodStart` recomputes
 * automatically the next time it's read — nothing here needs to reset a
 * "late" flag or a stale prediction, because none is ever cached. */
export const confirmPeriodStart = (date: Date): void => {
  setCyclePreferences({ ...cyclePreferences, lastPeriodStart: new Date(date) });
};

export const getCyclePreferences = (): CyclePreferences => ({
  ...cyclePreferences,
  lastPeriodStart: new Date(cyclePreferences.lastPeriodStart),
});

export const getPeriodHistory = (): PeriodHistoryRecord[] =>
  periodHistory.map(item => ({ ...item }));

/** True only when `date` falls within a REAL confirmed period record
 * (inclusive start/end) — never a predicted/estimated window. Compares
 * calendar days only (via the same 'YYYY-MM-DD' key every periodHistory
 * record already uses), so hours/minutes/timezone can't shift the result.
 * This is the one place that answers "is today inside an active confirmed
 * period?" — reuse it instead of re-deriving from phase/prediction state. */
export const isDateWithinConfirmedPeriod = (date: Date): boolean => {
  const key = cycleDateKey(date);
  return periodHistory.some(
    record => record.startDate <= key && key <= record.endDate,
  );
};

/** Anchor date for the 'unknown' regularity observation window — see
 * computeCyclePredictionStatus() in cycleMath.ts. Null until the user has
 * ever selected "Je ne sais pas". */
export const getCycleObservationStartedAt = (): Date | null =>
  cycleObservationStartedAt ? new Date(cycleObservationStartedAt) : null;

export const subscribeCyclePreferences = (listener: () => void) => {
  cycleListeners.add(listener);
  return () => {
    cycleListeners.delete(listener);
  };
};

export const hydrateCyclePreferences = (): Promise<CyclePreferences> => {
  if (cycleHydrated) {
    return Promise.resolve(getCyclePreferences());
  }
  if (!cycleHydration) {
    cycleHydration = AsyncStorage.getItem(CYCLE_STORAGE_KEY)
      .then(raw => {
        cycleHydrated = true;
        if (raw) {
          const parsed = JSON.parse(raw) as {
            preferences?: Partial<CyclePreferences> & {
              lastPeriodStart?: string;
            };
            periodHistory?: PeriodHistoryRecord[];
            observationStartedAt?: string | null;
          };
          const start = parsed.preferences?.lastPeriodStart
            ? new Date(parsed.preferences.lastPeriodStart)
            : null;
          if (start && !Number.isNaN(start.getTime())) {
            cyclePreferences = {
              ...cyclePreferences,
              ...parsed.preferences,
              lastPeriodStart: start,
            } as CyclePreferences;
          }
          if (Array.isArray(parsed.periodHistory)) {
            periodHistory = parsed.periodHistory.filter(
              item =>
                item &&
                typeof item.startDate === 'string' &&
                typeof item.endDate === 'string',
            );
          }
          if (parsed.observationStartedAt) {
            const observationStart = new Date(parsed.observationStartedAt);
            if (!Number.isNaN(observationStart.getTime())) {
              cycleObservationStartedAt = observationStart;
            }
          }
        }
        if (periodHistory.length === 0) {
          const start = cyclePreferences.lastPeriodStart;
          const end = new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate() + cyclePreferences.periodDuration - 1,
          );
          periodHistory = [
            {
              id: cycleDateKey(start),
              startDate: cycleDateKey(start),
              endDate: cycleDateKey(end),
            },
          ];
        }
        notifyCycleListeners();
        return getCyclePreferences();
      })
      .catch(() => {
        cycleHydrated = true;
        return getCyclePreferences();
      });
  }
  return cycleHydration;
};

export const updateCurrentPeriodRange = async (
  start: Date,
  end: Date,
): Promise<CyclePreferences> => {
  const normalizedStart = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const normalizedEnd = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
  );
  if (normalizedEnd < normalizedStart) {
    throw new Error('INVALID_RANGE');
  }
  const duration =
    Math.round(
      (normalizedEnd.getTime() - normalizedStart.getTime()) / 86_400_000,
    ) + 1;
  const previousId = cycleDateKey(cyclePreferences.lastPeriodStart);
  const record = {
    id: cycleDateKey(normalizedStart),
    startDate: cycleDateKey(normalizedStart),
    endDate: cycleDateKey(normalizedEnd),
  };
  const otherRecords = periodHistory.filter(item => item.id !== previousId);
  const overlaps = otherRecords.some(
    item =>
      record.startDate <= item.endDate && record.endDate >= item.startDate,
  );
  if (overlaps) {
    throw new Error('OVERLAPPING_RANGE');
  }
  periodHistory = [...otherRecords, record].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
  const starts = periodHistory.map(
    item => new Date(`${item.startDate}T12:00:00`),
  );
  const lengths = starts
    .slice(1)
    .map((date, index) =>
      Math.round((date.getTime() - starts[index].getTime()) / 86_400_000),
    )
    .filter(value => value >= 15 && value <= 90);
  const cycleDuration =
    lengths.length > 0
      ? Math.round(
          lengths.reduce((sum, value) => sum + value, 0) / lengths.length,
        )
      : cyclePreferences.cycleDuration;
  cyclePreferences = {
    ...cyclePreferences,
    lastPeriodStart: normalizedStart,
    periodDuration: duration,
    cycleDuration,
  };
  notifyCycleListeners();
  await persistCycle();
  return getCyclePreferences();
};

// Exact end-of-period datetime the user confirmed (single source of truth for
// the purity/prayer-due feature). Persisted the same way as the location, so
// it survives app restarts and both MenstrualFlowScreen and PrayerTimesScreen
// read/write this one value instead of keeping their own copies.
let periodEndDateTime: Date | null = null;
const PERIOD_END_STORAGE_KEY = '@hawa/period-end-datetime';
const periodEndListeners = new Set<() => void>();
let periodEndHydration: Promise<Date | null> | null = null;
let periodEndHydrated = false;

const notifyPeriodEndListeners = () => {
  periodEndListeners.forEach(listener => listener());
};

export const setPeriodEndDateTime = async (
  value: Date | null,
): Promise<void> => {
  periodEndDateTime = value ? new Date(value) : null;
  notifyPeriodEndListeners();
  if (periodEndDateTime) {
    await AsyncStorage.setItem(
      PERIOD_END_STORAGE_KEY,
      periodEndDateTime.toISOString(),
    );
  } else {
    await AsyncStorage.removeItem(PERIOD_END_STORAGE_KEY);
  }
};

export const getPeriodEndDateTime = (): Date | null =>
  periodEndDateTime ? new Date(periodEndDateTime) : null;

export const hydratePeriodEndDateTime = (): Promise<Date | null> => {
  // Same reasoning as hydrateSelectedLocation: after the first real
  // AsyncStorage read, the in-memory value is authoritative (kept current
  // by setPeriodEndDateTime). Re-returning the cached first-read promise on
  // every later call — e.g. every time a screen's useFocusEffect re-fires —
  // would clobber a just-confirmed period end with the stale snapshot from
  // whenever the app first hydrated, making the UI fall back to "still
  // menstruating" even though the user already confirmed it ended.
  if (periodEndHydrated) {
    return Promise.resolve(getPeriodEndDateTime());
  }
  if (!periodEndHydration) {
    periodEndHydration = AsyncStorage.getItem(PERIOD_END_STORAGE_KEY)
      .then(raw => {
        periodEndHydrated = true;
        if (!raw) {
          return getPeriodEndDateTime();
        }
        const parsed = new Date(raw);
        if (!Number.isNaN(parsed.getTime())) {
          periodEndDateTime = parsed;
          notifyPeriodEndListeners();
        }
        return getPeriodEndDateTime();
      })
      .catch(() => {
        periodEndHydrated = true;
        return getPeriodEndDateTime();
      });
  }
  return periodEndHydration;
};

export const subscribePeriodEndDateTime = (listener: () => void) => {
  periodEndListeners.add(listener);
  return () => {
    periodEndListeners.delete(listener);
  };
};

import AsyncStorage from '@react-native-async-storage/async-storage';
