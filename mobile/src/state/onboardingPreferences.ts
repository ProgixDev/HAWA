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
// No fake placeholder — genuinely empty until personalInformationStore.ts
// (the canonical persisted source; this is only a synchronous in-memory
// mirror of it) has real data to push in via setFirstName() below.
let firstName = '';
let spiritualMarkersEnabled = true;
// Provenance flag: true only once the user (or an existing pre-fix install
// — see the migration branch in hydrateSpiritualMarkersEnabled()) has
// actually confirmed a real choice. `spiritualMarkersEnabled` itself stays a
// plain boolean for every existing consumer (dashboards/Library/reminders/
// Settings/Summary) — this flag is consulted only by the onboarding screen,
// which must never let "Suivant" silently persist the untouched default as
// if it were a deliberate choice.
let hasConfirmedSpiritualMarkersChoice = false;
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
// Provenance flag: true only once the user has gone through a legitimate
// cycle-confirmation flow (CycleInformationScreen, confirmPeriodStart(), or
// updateCurrentPeriodRange() — the only 3 call sites that ever set it).
// Never inferred by comparing lastPeriodStart/periodDuration/cycleDuration
// against the fallback constants below, since a real user can legitimately
// land on those exact values. Used by TTC (and only TTC today) to decide
// whether it's safe to present cycle-derived predictions as personalized
// fact, or must show an honest "configure ton cycle" state instead.
let hasConfirmedCycleData = false;
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
  hasConfirmedCycleData,
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

/* ============================================================
   ONBOARDING COMPLETION — a persistent, device-local record that the
   REQUIRED onboarding journey (Welcome → Objective → objective-specific
   setup → Auth/Anonymous Mode → entering the app) was genuinely finished at
   least once. Deliberately separate from `activeObjective` (which a
   completed user can freely change later from Settings without that ever
   re-triggering onboarding) and from feature-scoped provenance flags like
   `hasConfirmedSpiritualMarkersChoice`/`hasConfirmedCycleData` (each of
   those only proves ONE narrow sub-answer was made deliberately, never that
   the whole journey was completed). THE only legitimate place to call
   setHasCompletedOnboarding(true) is AnonymousAvatarCustomizerScreen.tsx's
   `enterApp()` — the single real convergence point every onboarding path
   reaches today (Auth/Registration cannot complete it themselves: no
   backend account/session exists yet, see CLAUDE.md). If a real backend
   registration/login path is added later, its own successful-completion
   boundary must call this too — never invent a second, parallel completion
   concept for it.
============================================================ */

const ONBOARDING_COMPLETED_STORAGE_KEY = '@hawa/has-completed-onboarding';
let hasCompletedOnboarding = false;
let onboardingCompletedHydrated = false;
let onboardingCompletedHydration: Promise<boolean> | null = null;
const onboardingCompletedListeners = new Set<() => void>();

/** THE single legitimate way to record that onboarding was genuinely
 * completed — see the section comment above for the one real call site.
 * Never call this merely because a screen was opened, an objective was
 * picked, or a step was skipped/cancelled — only on true, final success. */
export const setHasCompletedOnboarding = (value: boolean): Promise<void> => {
  hasCompletedOnboarding = value;
  onboardingCompletedHydrated = true;
  onboardingCompletedListeners.forEach(listener => listener());
  return value
    ? AsyncStorage.setItem(ONBOARDING_COMPLETED_STORAGE_KEY, 'true').catch(() => {})
    : AsyncStorage.removeItem(ONBOARDING_COMPLETED_STORAGE_KEY).catch(() => {});
};

/** Synchronous read of the last-hydrated value — callers that can await
 * hydration (SplashScreen's startup routing) should prefer
 * hydrateHasCompletedOnboarding() instead, so a cold launch never reads the
 * in-memory default before AsyncStorage has actually been checked. */
export const getHasCompletedOnboarding = (): boolean => hasCompletedOnboarding;

export const hydrateHasCompletedOnboarding = (): Promise<boolean> => {
  if (onboardingCompletedHydrated) {
    return Promise.resolve(hasCompletedOnboarding);
  }
  if (!onboardingCompletedHydration) {
    onboardingCompletedHydration = AsyncStorage.getItem(ONBOARDING_COMPLETED_STORAGE_KEY)
      .then(value => {
        onboardingCompletedHydrated = true;
        hasCompletedOnboarding = value === 'true';
        onboardingCompletedListeners.forEach(listener => listener());
        return hasCompletedOnboarding;
      })
      .catch(() => {
        onboardingCompletedHydrated = true;
        return hasCompletedOnboarding;
      });
  }
  return onboardingCompletedHydration;
};

export const subscribeHasCompletedOnboarding = (listener: () => void) => {
  onboardingCompletedListeners.add(listener);
  return () => {
    onboardingCompletedListeners.delete(listener);
  };
};

/** THE single legitimate way to record a real spiritual-markers choice —
 * called by SpiritualPreferencesScreen.tsx (onboarding, only once she's
 * explicitly tapped one of the two options) and ProfileScreen.tsx's Settings
 * toggle. Marks the choice as confirmed so onboarding never mistakes the
 * internal default for a deliberate answer again. */
export const setSpiritualMarkersEnabled = (value: boolean) => {
  spiritualMarkersEnabled = value;
  hasConfirmedSpiritualMarkersChoice = true;
  spiritualMarkersListeners.forEach(listener => listener());
  AsyncStorage.setItem(
    SPIRITUAL_MARKERS_STORAGE_KEY,
    value ? 'true' : 'false',
  ).catch(() => {});
};

export const getSpiritualMarkersEnabled = () => spiritualMarkersEnabled;

/** True once a real choice exists — either just made this session, or
 * migrated from an existing install (see hydrateSpiritualMarkersEnabled()).
 * Consult this — never a value comparison — before treating the current
 * boolean as something the user actually chose. Only the onboarding screen
 * needs this; every other consumer only ever wants the plain boolean. */
export const getHasConfirmedSpiritualMarkersChoice = (): boolean => hasConfirmedSpiritualMarkersChoice;

export const hydrateSpiritualMarkersEnabled = (): Promise<boolean> => {
  if (!spiritualMarkersHydration) {
    spiritualMarkersHydration = AsyncStorage.getItem(
      SPIRITUAL_MARKERS_STORAGE_KEY,
    )
      .then(value => {
        if (value !== null) {
          // The key can only exist on disk because a real
          // setSpiritualMarkersEnabled() call wrote it (onboarding or
          // Settings) — so its mere presence is itself proof of a real
          // prior choice, whatever that value is. Preserve it exactly;
          // never reset or reinterpret it.
          spiritualMarkersEnabled = value === 'true';
          hasConfirmedSpiritualMarkersChoice = true;
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

export type HijriAdjustmentDays = -1 | 0 | 1;

const HIJRI_ADJUSTMENT_STORAGE_KEY = '@hawa/hijri-adjustment-days';
let hijriAdjustmentDays: HijriAdjustmentDays = 0;
let hijriAdjustmentHydration: Promise<HijriAdjustmentDays> | null = null;
const hijriAdjustmentListeners = new Set<() => void>();

const isValidHijriAdjustment = (value: number): value is HijriAdjustmentDays =>
  value === -1 || value === 0 || value === 1;

/**
 * The user's manual day-shift applied uniformly to AWA's single canonical
 * ICU Hijri calculation (see src/utils/hijriCalendar.ts's hijriPartsFor) so
 * she can align the calendar with whatever local/regional reference she
 * personally follows, without AWA ever claiming to know an "official" date.
 * Defaults to 0 (AWA's raw calculation, unchanged) for every existing
 * install until she explicitly changes it — no migration ever sets this to
 * anything else. Applied in exactly ONE place (hijriPartsFor) so Ramadan/
 * Dhoul Hijja classification, Qadaa, the post-Ramadan reminder, and every
 * displayed Hijri date can never disagree with each other.
 */
export const setHijriAdjustmentDays = (value: HijriAdjustmentDays) => {
  hijriAdjustmentDays = value;
  hijriAdjustmentListeners.forEach(listener => listener());
  AsyncStorage.setItem(HIJRI_ADJUSTMENT_STORAGE_KEY, String(value)).catch(() => {});
};

export const getHijriAdjustmentDays = (): HijriAdjustmentDays => hijriAdjustmentDays;

export const hydrateHijriAdjustmentDays = (): Promise<HijriAdjustmentDays> => {
  if (!hijriAdjustmentHydration) {
    hijriAdjustmentHydration = AsyncStorage.getItem(HIJRI_ADJUSTMENT_STORAGE_KEY)
      .then(value => {
        const parsed = value !== null ? Number(value) : NaN;
        if (isValidHijriAdjustment(parsed)) {
          hijriAdjustmentDays = parsed;
        }
        hijriAdjustmentListeners.forEach(listener => listener());
        return hijriAdjustmentDays;
      })
      .catch(() => hijriAdjustmentDays);
  }
  return hijriAdjustmentHydration;
};

export const subscribeHijriAdjustmentDays = (listener: () => void) => {
  hijriAdjustmentListeners.add(listener);
  return () => {
    hijriAdjustmentListeners.delete(listener);
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

// Mirrors personalInformationStore's real preferredName/firstName, including
// clearing to '' when she has none (or deliberately removed it) — never
// guards against an empty value, since that would silently keep a stale
// name after a real, deliberate clear.
export const setFirstName = (value: string) => {
  firstName = value.trim();
};

export const getFirstName = () => firstName;

export const setCyclePreferences = (value: CyclePreferences) => {
  const previousLastPeriodStart = cyclePreferences.lastPeriodStart;
  const previousRegularity = cyclePreferences.regularity;
  cyclePreferences = {
    ...value,
    lastPeriodStart: new Date(value.lastPeriodStart),
  };
  hasConfirmedCycleData = true;

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

/** True only once real cycle information has actually been confirmed by the
 * user (see the `hasConfirmedCycleData` field comment above for the exact 3
 * legitimate call sites). Consult this — never a comparison against
 * 28/5/"today minus 5 days" — before treating cyclePreferences as
 * personalized fact. */
export const getHasConfirmedCycleData = (): boolean => hasConfirmedCycleData;

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
        let migratedFromUnflaggedRecord = false;
        if (raw) {
          const parsed = JSON.parse(raw) as {
            preferences?: Partial<CyclePreferences> & {
              lastPeriodStart?: string;
            };
            periodHistory?: PeriodHistoryRecord[];
            observationStartedAt?: string | null;
            hasConfirmedCycleData?: boolean;
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
          // Migration for installs from before this flag existed: the only
          // way this blob could ever have been written to disk at all is
          // through setCyclePreferences()/updateCurrentPeriodRange() (see
          // persistCycle()'s call sites) — both real-confirmation paths — so
          // a persisted blob predating this field is itself the evidence.
          // A blob that already carries an explicit boolean (post-migration
          // steady state) is trusted as-is instead.
          if (typeof parsed.hasConfirmedCycleData === 'boolean') {
            hasConfirmedCycleData = parsed.hasConfirmedCycleData;
          } else {
            hasConfirmedCycleData = true;
            migratedFromUnflaggedRecord = true;
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
        if (migratedFromUnflaggedRecord) {
          persistCycle().catch(() => {});
        }
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
  hasConfirmedCycleData = true;
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
