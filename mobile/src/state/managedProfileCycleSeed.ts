import {getManagedProfiles, recordManagedProfileFirstPeriod as recordFirstPeriodOnProfile} from './managedProfilesStore';
import {
  getCyclePreferences,
  getHasConfirmedCycleData,
  getHasConfirmedCycleDuration,
  getRecordedPeriodHistory,
  hydrateCyclePreferences,
  recordFirstEverPeriod,
  setCyclePreferences,
} from './onboardingPreferences';

// Initializes a managed (daughter) profile's own cycle context from whatever she
// declared during creation (ManagedProfileCycleSetupScreen — lastPeriodDate/
// periodLength/cycleLength) THE FIRST TIME she becomes the active profile —
// regardless of which path made her active (ManagedProfileSuccessScreen's "Accéder
// au profil", or later switching to her from "Gérer les profils"). Idempotent: once
// she has any real declared cycle data (getHasConfirmedCycleData() — the SAME flag
// the mother's own onboarding uses), this never runs again and never overwrites
// anything she (or the mother, on her behalf) has since edited.
//
// If she had never had her first period (hasHadFirstPeriod === false), this seeds
// nothing — her cycle context stays at the neutral empty/pre-first-period defaults,
// exactly as CLAUDE.md §5/this feature's own "no data fallback" rule requires: never
// fabricate a period that wasn't declared.
//
// Call this AFTER the caller has already made `profileId` the active profile (see
// activeProfileStore.ts's setActiveProfileId) — it operates on whatever profile's
// cyclePreferences key is currently active, exactly like every other store this
// feature scoped.
export async function seedManagedProfileCycleIfNeeded(profileId: string): Promise<void> {
  await hydrateCyclePreferences();
  if (getHasConfirmedCycleData()) {return;} // already has real data — never re-seed/overwrite

  const profile = getManagedProfiles().find(item => item.id === profileId);
  if (!profile || !profile.hasHadFirstPeriod || !profile.lastPeriodDate) {return;}

  // CyclePreferences.periodDuration/cycleDuration are non-nullable — there is
  // no way to represent "only one of the two was confirmed" at this layer. So
  // only call setCyclePreferences() (which marks getHasConfirmedCycleData()
  // true) when BOTH were genuinely confirmed on ManagedProfileCycleSetupScreen
  // (never ManagedProfileCycleSetupScreen's own untouched-stepper defaults —
  // ManagedProfileCycleSetupScreen.tsx only ever persists a real number once
  // the mother actually touched that stepper, null otherwise). If either is
  // still unknown, fall back to the SAME recordFirstEverPeriod() path
  // recordManagedProfileFirstPeriod() below already uses for this exact
  // reason (see its own comment) — the real date is seeded without
  // fabricating a duration, and getHasConfirmedCycleData() stays false.
  if (profile.periodLength !== null && profile.cycleLength !== null) {
    // Regularity: whatever the mother declared on ManagedProfileCycleSetupScreen
    // (profile.regularity) — never fabricated from cycleLength/periodLength (a
    // 28-day cycle does not itself establish regularity). Falls back to
    // 'unknown' only when it was never asked (a pre-existing profile created
    // before this field existed) — the same honest state ProfileScreen.tsx's
    // "Régularité du cycle" row/editor shows as "Non renseignée".
    setCyclePreferences({
      lastPeriodStart: new Date(`${profile.lastPeriodDate}T12:00:00`),
      periodDuration: profile.periodLength,
      cycleDuration: profile.cycleLength,
      regularity: profile.regularity ?? 'unknown',
    });
  } else {
    recordFirstEverPeriod(new Date(`${profile.lastPeriodDate}T12:00:00`), profile.regularity ?? 'unknown');
  }
}

/**
 * Records an EXISTING pre-first-period daughter's first period — called from
 * CycleHomeScreen's/CalendarScreen's "Ses premières règles ont commencé"
 * action, never during profile creation (that path writes directly via
 * addManagedProfile() — see ManagedProfileFirstPeriodScreen.tsx/
 * ManagedProfileCycleSetupScreen.tsx). Must run while `profileId` is already
 * the active profile (same precondition as seedManagedProfileCycleIfNeeded
 * above) — it operates on whichever profile's cyclePreferences key is
 * currently active.
 *
 * At this moment only the DATE is actually known — never her habitual period/
 * cycle duration (nobody asked). Uses `recordFirstEverPeriod()`, NOT
 * `setCyclePreferences()`: it records the real date and regularity 'unknown'
 * (ONE recorded period is not enough to know her real cycle length, and
 * computeCyclePredictionStatus's 'unknown' branch — cycleMath.ts — is exactly
 * the existing "observing — not enough data yet" mode this needs, so no new
 * prediction logic is required) WITHOUT marking period/cycle duration as
 * confirmed — see onboardingPreferences.ts's `hasConfirmedCycleDuration` field
 * comment for exactly why setCyclePreferences() is the wrong call here: it
 * would make the internal 5/28-day computation placeholder display as if the
 * mother had confirmed a 28-day cycle (ProfileScreen.tsx's "Durée du cycle"/
 * "Durée des règles" rows, describeAverageCycle() in cycleMath.ts). Also
 * updates the ManagedProfile record itself (managedProfilesStore.ts's
 * recordManagedProfileFirstPeriod) with periodLength/cycleLength left `null`
 * (still unknown) and regularity `'unknown'`, so the two stay in sync — that
 * record is otherwise stale/read by e.g. any future export/edit feature.
 */
/**
 * Mirrors the ACTIVE daughter's recorded cycle onto her ManagedProfile record
 * (what a restored backup brings back), so record and cycle never disagree: the
 * record is only a seed, and a restored history must not leave it saying "no first
 * period". The cycle store stays the source of truth — this only copies from it,
 * never the other way round, and writes nothing when no period is recorded.
 */
export async function syncManagedProfileRecordFromCycle(profileId: string): Promise<void> {
  await hydrateCyclePreferences();
  const recorded = getRecordedPeriodHistory();
  if (recorded.length === 0) {return;}
  const latest = recorded[recorded.length - 1].startDate;
  const cycle = getCyclePreferences();
  const lengthsProvided = getHasConfirmedCycleDuration();
  await recordFirstPeriodOnProfile(profileId, {
    lastPeriodDate: latest,
    periodLength: lengthsProvided ? cycle.periodDuration : null,
    cycleLength: lengthsProvided ? cycle.cycleDuration : null,
    regularity: cycle.regularity,
  });
}

export async function recordManagedProfileFirstPeriod(profileId: string, date: Date): Promise<void> {
  await hydrateCyclePreferences();
  recordFirstEverPeriod(date, 'unknown');
  await recordFirstPeriodOnProfile(profileId, {
    lastPeriodDate: date.toLocaleDateString('en-CA'),
    periodLength: null,
    cycleLength: null,
    regularity: 'unknown',
  });
}
