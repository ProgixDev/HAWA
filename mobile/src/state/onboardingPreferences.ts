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
// cycle-confirmation flow (CycleInformationScreen/setCyclePreferences(),
// addPeriodOccurrence()/confirmPeriodStart(), or correctPeriodOccurrence()/
// updateCurrentPeriodRange() — the only call sites that ever set it).
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

// hydrateCyclePreferences() seeds `periodHistory` from the still-unconfirmed
// FALLBACK cyclePreferences (today − 5 days, 5-day period) so that in-memory
// consumers always have one record to read. That record is a placeholder, not
// something the user recorded — it must never be kept as real history once
// she confirms her first real period, or it would be persisted next to it and
// keep feeding predictions, the month strip and "is today inside a period?".
// A no-op once real cycle data has been confirmed.
const discardUnconfirmedPeriodSeed = (): void => {
  if (!hasConfirmedCycleData) {
    periodHistory = [];
  }
};

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

/* ============================================================
   PERIOD DATA MODEL (single source: this file + confirmedPeriodHistoryStore)

   - cyclePreferences.periodDuration / cycleDuration / regularity are HABITUAL
     settings. They change ONLY through their configuration flow
     (setCyclePreferences() from CycleInformationScreen) — never as a side
     effect of recording, correcting or ending an actual period.
   - periodHistory is the list of RECORDED periods (one record per real
     occurrence: {startDate, endDate}). endDate is the projected end
     (start + periodDuration - 1) until the user edits the range or confirms
     the actual end, after which it is the real end.
   - cyclePreferences.lastPeriodStart is ALWAYS the latest real period start
     (the max start of periodHistory once cycle data is confirmed).
   - confirmedPeriodHistoryStore holds ACTUAL start/end pairs (qadaa source);
     periodEndDateTime is the exact confirmed end of the CURRENT period
     (purity / prayer). Each confirmed end is mirrored into the matching
     periodHistory record (see the subscription at the bottom of this file).

   Writers: addPeriodOccurrence (new period / historical backfill),
   correctPeriodOccurrence (explicit correction of one occurrence),
   setCyclePreferences (habitual settings + declared latest start).
============================================================ */

/** Two period starts closer than this cannot be two real periods — same lower
 * bound the app already uses for a plausible cycle length. */
const MIN_PLAUSIBLE_CYCLE_GAP_DAYS = 15;

const keyToDate = (key: string): Date => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};
const keyPlusDays = (key: string, days: number): string => {
  const base = keyToDate(key);
  return cycleDateKey(new Date(base.getFullYear(), base.getMonth(), base.getDate() + days));
};
const keyDiffDays = (later: string, earlier: string): number =>
  Math.round((keyToDate(later).getTime() - keyToDate(earlier).getTime()) / 86_400_000);
const projectedEndKey = (startKey: string, duration: number): string =>
  keyPlusDays(startKey, Math.max(1, duration) - 1);
const sortHistory = (records: PeriodHistoryRecord[]): PeriodHistoryRecord[] =>
  [...records].sort((a, b) => a.startDate.localeCompare(b.startDate));

/** The recorded periods that are real (never the unconfirmed placeholder). */
const realHistory = (): PeriodHistoryRecord[] => (hasConfirmedCycleData ? periodHistory : []);

/** Latest real period start key, or null when nothing real is recorded yet.
 * Considers both the history and lastPeriodStart so a legacy blob where the
 * two disagree still resolves to the true latest start. */
const latestRealStartKey = (): string | null => {
  if (!hasConfirmedCycleData) {return null;}
  return periodHistory.reduce(
    (latest, record) => (record.startDate > latest ? record.startDate : latest),
    cycleDateKey(cyclePreferences.lastPeriodStart),
  );
};

/** True when this record's end is only the projection from the habitual
 * duration (never edited, never confirmed) — so it may follow a change of
 * that duration; a user-set / confirmed end must never be overwritten. */
const hasProjectedEnd = (record: PeriodHistoryRecord, duration: number): boolean =>
  record.endDate === projectedEndKey(record.startDate, duration) &&
  !getConfirmedPeriodHistory().some(occurrence => occurrence.id === record.id);

/** A confirmed periodEndDateTime that predates the (new) latest start belongs
 * to an earlier period and would be wrongly paired with this one. */
const clearStalePeriodEnd = (previousLastPeriodStart: Date): void => {
  const currentPeriodEnd = getPeriodEndDateTime();
  if (
    currentPeriodEnd &&
    cyclePreferences.lastPeriodStart.getTime() !== previousLastPeriodStart.getTime() &&
    currentPeriodEnd.getTime() < cyclePreferences.lastPeriodStart.getTime()
  ) {
    setPeriodEndDateTime(null);
  }
};

export const setCyclePreferences = (value: CyclePreferences) => {
  const previousLastPeriodStart = cyclePreferences.lastPeriodStart;
  const previousDuration = cyclePreferences.periodDuration;
  const previousRegularity = cyclePreferences.regularity;
  const latestKey = latestRealStartKey();
  const previousRecords = realHistory();
  discardUnconfirmedPeriodSeed();
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

  // The declared latest period start. NEW period vs CORRECTION of the latest
  // one (M4): a start later than the latest by at least a plausible cycle gap
  // is a new period; anything else (same start, an earlier one, or one just a
  // few days later) restates the latest period and REPLACES it — the old start
  // must not linger in the history next to the corrected one.
  const declaredKey = cycleDateKey(cyclePreferences.lastPeriodStart);
  const defaultEnd = projectedEndKey(declaredKey, cyclePreferences.periodDuration);
  const newRecord: PeriodHistoryRecord = {id: declaredKey, startDate: declaredKey, endDate: defaultEnd};
  const latestRecord = latestKey ? previousRecords.find(record => record.id === latestKey) : undefined;
  const isNewPeriod =
    latestKey === null || (declaredKey > latestKey && keyDiffDays(declaredKey, latestKey) >= MIN_PLAUSIBLE_CYCLE_GAP_DAYS);

  if (isNewPeriod || !latestRecord) {
    periodHistory = sortHistory([...previousRecords.filter(item => item.id !== declaredKey), newRecord]);
  } else if (declaredKey === latestKey) {
    // Same period: keep its (possibly user-set / confirmed) end. Only a
    // still-projected end follows a change of the habitual duration.
    const end = hasProjectedEnd(latestRecord, previousDuration) ? defaultEnd : latestRecord.endDate;
    periodHistory = sortHistory([...previousRecords.filter(item => item.id !== latestKey), {...latestRecord, endDate: end}]);
  } else {
    const others = previousRecords.filter(item => item.id !== latestKey);
    const end = hasProjectedEnd(latestRecord, previousDuration)
      ? defaultEnd
      : keyPlusDays(declaredKey, keyDiffDays(latestRecord.endDate, latestRecord.startDate));
    const overlaps = others.some(item => declaredKey <= item.endDate && end >= item.startDate);
    periodHistory = overlaps
      ? sortHistory([...previousRecords.filter(item => item.id !== declaredKey), newRecord])
      : sortHistory([...others, {id: declaredKey, startDate: declaredKey, endDate: end}]);
  }
  notifyCycleListeners();
  persistCycle().catch(() => {});

  // A genuinely new period start supersedes any previously confirmed
  // periodEndDateTime that belongs to an earlier period. Without this, a
  // stale confirmation could later be paired with this unrelated cycle by
  // any code reading periodEndDateTime alongside cyclePreferences (see the
  // qadaa sync investigation). Only clear when the start actually moved
  // forward past the old confirmed end, so editing the *same* period's
  // start (e.g. correcting a typo) doesn't wipe a same-period confirmation.
  clearStalePeriodEnd(previousLastPeriodStart);
};

/** Records a period start the user declares: a NEW period, or a HISTORICAL
 * BACKFILL of an older one. Never a correction (see correctPeriodOccurrence).
 * - lastPeriodStart becomes max(existing latest, this start): backfilling an
 *   old period adds it to the history without moving lastPeriodStart back (M16);
 *   a genuinely newer start becomes the latest as before.
 * - A start already covered by a recorded period is a no-op (no duplicate, the
 *   existing — possibly confirmed — end is kept).
 * - The new record's end is the habitual projection, clamped so it can never
 *   run into the next recorded period. No confirmed end is invented.
 * periodDuration/cycleDuration/regularity are left exactly as configured. */
export const addPeriodOccurrence = (date: Date): void => {
  const startKey = cycleDateKey(date);
  const previousLastPeriodStart = cyclePreferences.lastPeriodStart;
  const latestKey = latestRealStartKey();
  const base = realHistory();
  if (base.some(record => record.startDate <= startKey && startKey <= record.endDate)) {
    return;
  }
  const next = base.filter(record => record.startDate > startKey).sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  let endKey = projectedEndKey(startKey, cyclePreferences.periodDuration);
  if (next && endKey >= next.startDate) {
    endKey = keyPlusDays(next.startDate, -1);
  }
  discardUnconfirmedPeriodSeed();
  hasConfirmedCycleData = true;
  periodHistory = sortHistory([
    ...base.filter(record => record.id !== startKey),
    {id: startKey, startDate: startKey, endDate: endKey},
  ]);
  if (latestKey === null || startKey > latestKey) {
    cyclePreferences = {...cyclePreferences, lastPeriodStart: keyToDate(startKey)};
  } else if (latestKey !== cycleDateKey(cyclePreferences.lastPeriodStart)) {
    // Legacy state where lastPeriodStart lagged behind the history: heal it.
    cyclePreferences = {...cyclePreferences, lastPeriodStart: keyToDate(latestKey)};
  }
  notifyCycleListeners();
  persistCycle().catch(() => {});
  clearStalePeriodEnd(previousLastPeriodStart);
};

/** THE canonical way to record "my period really started on this date" — used
 * by the Dashboard/Calendar/Conceive period-start confirmation sheet
 * (PeriodStartBottomSheet). Delegates to addPeriodOccurrence(): a newer start
 * becomes lastPeriodStart, a past date is backfilled without moving it back.
 * Any date/late status/irregular window derived from `lastPeriodStart`
 * recomputes automatically the next time it's read — nothing here needs to
 * reset a "late" flag or a stale prediction, because none is ever cached. */
export const confirmPeriodStart = (date: Date): void => {
  addPeriodOccurrence(date);
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

/** The periods the user actually recorded — an empty list until real cycle
 * data has been confirmed (see `hasConfirmedCycleData`), so the placeholder
 * record hydrateCyclePreferences() seeds from the fallback defaults is never
 * treated as observed history. Cycle Dashboard/Calendar/Profile read this;
 * getPeriodHistory() keeps its original raw behavior for every other caller. */
export const getRecordedPeriodHistory = (): PeriodHistoryRecord[] =>
  hasConfirmedCycleData ? getPeriodHistory() : [];

/** True only when `date` falls within a REAL confirmed period record
 * (inclusive start/end) — never a predicted/estimated window. Compares
 * calendar days only (via the same 'YYYY-MM-DD' key every periodHistory
 * record already uses), so hours/minutes/timezone can't shift the result.
 * This is the one place that answers "is today inside an active confirmed
 * period?" — reuse it instead of re-deriving from phase/prediction state. */
export const isDateWithinConfirmedPeriod = (date: Date): boolean => {
  if (!hasConfirmedCycleData) {return false;}
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

/** EXPLICIT CORRECTION of one recorded period (M4/M16): the occurrence that
 * starts on `oldStart` becomes `newStart`..`newEnd` — it is REPLACED, never
 * duplicated, and every other period is preserved. When `newEnd` is omitted the
 * occurrence keeps its length. lastPeriodStart is re-derived as the latest
 * start of the history, so correcting the latest period can move it backwards,
 * while correcting an older one leaves it untouched. Habitual
 * periodDuration/cycleDuration are NEVER touched (M8): an edited actual period
 * is not a new habit. An actual/confirmed end recorded for the old occurrence
 * is dropped when the corrected range no longer matches it. If `oldStart` is
 * not recorded, the range is simply added.
 * Throws INVALID_RANGE (end before start) / OVERLAPPING_RANGE. */
export const correctPeriodOccurrence = async (
  oldStart: Date,
  newStart: Date,
  newEnd?: Date,
): Promise<CyclePreferences> => {
  const oldKey = cycleDateKey(oldStart);
  const newKey = cycleDateKey(newStart);
  if (newEnd && cycleDateKey(newEnd) < newKey) {
    throw new Error('INVALID_RANGE');
  }
  const previousLastPeriodStart = cyclePreferences.lastPeriodStart;
  const base = realHistory();
  const old = base.find(item => item.id === oldKey);
  const endKey = newEnd
    ? cycleDateKey(newEnd)
    : old
      ? keyPlusDays(newKey, keyDiffDays(old.endDate, old.startDate))
      : projectedEndKey(newKey, cyclePreferences.periodDuration);
  const others = base.filter(item => item.id !== oldKey);
  if (others.some(item => newKey <= item.endDate && endKey >= item.startDate)) {
    throw new Error('OVERLAPPING_RANGE');
  }
  hasConfirmedCycleData = true;
  periodHistory = sortHistory([...others, {id: newKey, startDate: newKey, endDate: endKey}]);
  const latestKey = periodHistory[periodHistory.length - 1].startDate;
  if (latestKey !== cycleDateKey(cyclePreferences.lastPeriodStart)) {
    cyclePreferences = {...cyclePreferences, lastPeriodStart: keyToDate(latestKey)};
  }
  notifyCycleListeners();
  clearStalePeriodEnd(previousLastPeriodStart);
  // The scalar confirmed end (purity/prayer) describes the CURRENT period. When
  // that very period's range is corrected and the corrected end no longer
  // matches it, the old value would contradict the recorded range: drop it (no
  // end time is invented — an end can be re-confirmed through the usual flow).
  const scalarEnd = getPeriodEndDateTime();
  if (
    scalarEnd &&
    cycleDateKey(previousLastPeriodStart) === oldKey &&
    cycleDateKey(scalarEnd) !== endKey
  ) {
    await setPeriodEndDateTime(null);
  }
  await persistCycle();

  // The confirmed (qadaa) occurrence recorded for the OLD range no longer
  // describes this period once its start moved or its end changed.
  const staleConfirmed = getConfirmedPeriodHistory().find(occurrence => occurrence.id === oldKey);
  if (staleConfirmed && (oldKey !== newKey || cycleDateKey(new Date(staleConfirmed.periodEndDateTime)) !== endKey)) {
    await removeConfirmedPeriodOccurrence(oldStart);
  }
  return getCyclePreferences();
};

/** Edits the CURRENT (latest) recorded period's range. Correction semantics
 * (see correctPeriodOccurrence): it never redefines the habitual
 * periodDuration/cycleDuration — those change only through their own
 * configuration flow. */
export const updateCurrentPeriodRange = async (
  start: Date,
  end: Date,
): Promise<CyclePreferences> => {
  const latestKey = latestRealStartKey();
  return correctPeriodOccurrence(
    latestKey ? keyToDate(latestKey) : cyclePreferences.lastPeriodStart,
    start,
    end,
  );
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
import {
  getConfirmedPeriodHistory,
  removeConfirmedPeriodOccurrence,
  subscribeConfirmedPeriodEndRecorded,
} from './confirmedPeriodHistoryStore';

// Confirming the actual end of a period (PeriodEndBottomSheet, the Cycle
// information screen, the Calendar range editor…) must update the RECORDED
// period too (M7), otherwise periodHistory keeps the projected end while the
// confirmed history / periodEndDateTime say something else. Mirrored here, on
// every confirmed-end write, so every writer stays coherent; a period that was
// never confirmed keeps its projected end (nothing is invented) and hydrating
// older data never overrides a recorded range.
subscribeConfirmedPeriodEndRecorded(occurrence => {
  if (!hasConfirmedCycleData) {return;}
  const record = periodHistory.find(item => item.id === occurrence.id);
  const confirmedEnd = new Date(occurrence.periodEndDateTime);
  if (!record || Number.isNaN(confirmedEnd.getTime())) {return;}
  let endKey = cycleDateKey(confirmedEnd);
  if (endKey < record.startDate) {return;}
  const next = sortHistory(periodHistory).find(item => item.startDate > record.startDate);
  if (next && endKey >= next.startDate) {
    endKey = keyPlusDays(next.startDate, -1);
  }
  if (record.endDate === endKey) {return;}
  periodHistory = periodHistory.map(item => (item.id === record.id ? {...item, endDate: endKey} : item));
  notifyCycleListeners();
  persistCycle().catch(() => {});
});
