import {
  getHasConfirmedCycleData,
  hydrateActiveObjective,
  hydrateCyclePreferences,
  setActiveObjective,
  type ObjectiveId,
} from '../state/onboardingPreferences';
import {getConceptionPreferences, hydrateConceptionPreferences} from '../state/conceptionPreferences';
import {getContraceptionPreferences, hydrateContraceptionPreferences} from '../state/contraceptionPreferences';
import {getIrregularPreferences, hydrateIrregularPreferences} from '../state/irregularPreferences';
import {getMenopausePreferences, hydrateMenopausePreferences} from '../state/menopausePreferences';
import {getPregnancyDating, hydratePregnancyDating} from '../state/pregnancyPreferences';
import {getPostpartumPreferences, hydratePostpartumPreferences} from '../state/postpartumPreferences';
import {getMiscarriagePreferences, hydrateMiscarriagePreferences} from '../state/miscarriagePreferences';
import {
  beginObjectiveSetup,
  clearPendingObjectiveSetup,
  getPendingObjectiveSetup,
  readPersistedObjectiveSetup,
} from '../state/objectiveSetupFlow';

// Switching objective from inside the app (Profile → "Mon objectif", the
// Miscarriage → Conception hand-off). Uses the configuration state each
// objective ALREADY owns — no second "is configured" architecture:
//
// - an objective whose REQUIRED configuration is complete is simply activated
//   (all of its data was never touched) and its dashboard is opened;
// - an objective that was never configured — or only partly configured because
//   the user abandoned its onboarding chain — resumes ITS OWN existing chain at
//   the first incomplete step (already-given answers are prefilled by the
//   screens themselves), and its dashboard opens once that chain is finished.
//
// Data belonging to any objective is never deleted or migrated.

/** A screen of an objective's own onboarding chain (the same screens
 * first-launch onboarding uses, minus the shared name / spiritual / location
 * steps the user has already answered). All of them accept an undefined
 * `mode`, so they can be opened at any point of the chain and continue with
 * the rest of it. */
export type ObjectiveSetupRoute =
  | 'CycleInformation'
  | 'ConceptionTryingDuration'
  | 'ConceptionOvulationAwareness'
  | 'ConceptionIndicators'
  | 'ContraceptionMethod'
  | 'ContraceptionInformation'
  | 'PillSchedule'
  | 'IrregularCyclePattern'
  | 'IrregularLastPeriod'
  | 'IrregularTrackedItems'
  | 'MenopauseStage'
  | 'MenopauseSymptoms'
  | 'MenopauseHormonalTreatment'
  | 'MenopauseLabTracking'
  | 'PregnancyDatingSetup'
  | 'PostpartumDeliveryDate'
  | 'MiscarriageDate'
  | 'MiscarriageBleeding'
  | 'MiscarriageCycleReturn'
  | 'MiscarriageTryingAgain';

/** One question of an objective's onboarding chain, in chain order.
 * `required` mirrors the existing product flow: the step's own "next" button is
 * disabled until it is answered. Optional steps (explicit skip / empty
 * selection allowed) and the trailing *Reminders screens (opt-in) never make an
 * objective "unconfigured". */
type SetupStep = {route: ObjectiveSetupRoute; required: boolean; done: boolean};

/** The chain of `objective` with each step's completion, read through the
 * stores' own getters once they are hydrated. Every "not answered yet" default
 * of those stores is `null` / empty (or, for cycle data, the provenance flag) —
 * a placeholder is never mistaken for a configuration.
 *
 * Required configuration per objective (source: the real onboarding screens):
 * - cycle: confirmed cycle data (single screen; its Reminders step is optional)
 * - conceive: confirmed cycle data + tryingDuration + ovulationAwareness +
 *   at least one fertility indicator
 * - contraception: method + methodStartDate + hasTreatmentBreak (+ the pill
 *   schedule type when the method is the pill)
 * - irregular: cyclePattern + at least one tracked item (lastPeriodDate has an
 *   explicit "je préfère renseigner plus tard" skip → optional)
 * - menopause: stage + hormonalTreatmentStatus + labTracking (symptoms may be
 *   an empty selection → optional)
 * - pregnancy: dating date, or the explicit 'later' answer (tracking / reminder
 *   preferences default to a complete valid set → optional)
 * - postpartum: delivery date (delivery type / feeding are skippable)
 * - loss: miscarriageDate + bleedingStatus + cycleReturnStatus +
 *   tryingAgainStatus */
async function getSetupSteps(objective: ObjectiveId): Promise<SetupStep[]> {
  // hydrate…() only guarantees the stored value has been loaded — several of
  // these stores resolve it from a cached first-read promise, which would be a
  // STALE snapshot after a later write. The value is therefore always read
  // through the store's own getter once hydration is done.
  switch (objective) {
    case 'cycle':
      await hydrateCyclePreferences();
      return [{route: 'CycleInformation', required: true, done: getHasConfirmedCycleData()}];
    case 'conceive': {
      // Conception reuses the confirmed cycle data AND has its own steps.
      await Promise.all([hydrateCyclePreferences(), hydrateConceptionPreferences()]);
      const prefs = getConceptionPreferences();
      return [
        {route: 'CycleInformation', required: true, done: getHasConfirmedCycleData()},
        {route: 'ConceptionTryingDuration', required: true, done: prefs.tryingDuration !== null},
        {route: 'ConceptionOvulationAwareness', required: true, done: prefs.ovulationAwareness !== null},
        {route: 'ConceptionIndicators', required: true, done: prefs.indicators.length > 0},
      ];
    }
    case 'contraception': {
      await hydrateContraceptionPreferences();
      const prefs = getContraceptionPreferences();
      const steps: SetupStep[] = [
        {route: 'ContraceptionMethod', required: true, done: prefs.method !== null},
        // "Non" (false) is a real answer — only null is "not answered".
        {
          route: 'ContraceptionInformation',
          required: true,
          done: prefs.methodStartDate !== null && prefs.hasTreatmentBreak !== null,
        },
      ];
      if (prefs.method === 'pill') {
        steps.push({route: 'PillSchedule', required: true, done: prefs.pillScheduleType !== null});
      }
      return steps;
    }
    case 'irregular': {
      await hydrateIrregularPreferences();
      const prefs = getIrregularPreferences();
      return [
        {route: 'IrregularCyclePattern', required: true, done: prefs.cyclePattern !== null},
        {route: 'IrregularLastPeriod', required: false, done: prefs.lastPeriodDate !== null},
        {route: 'IrregularTrackedItems', required: true, done: prefs.trackedItems.length > 0},
      ];
    }
    case 'menopause': {
      await hydrateMenopausePreferences();
      const prefs = getMenopausePreferences();
      return [
        {route: 'MenopauseStage', required: true, done: prefs.stage !== null},
        {route: 'MenopauseSymptoms', required: false, done: prefs.trackedSymptoms.length > 0},
        {route: 'MenopauseHormonalTreatment', required: true, done: prefs.hormonalTreatmentStatus !== null},
        {route: 'MenopauseLabTracking', required: true, done: prefs.labTracking !== null},
      ];
    }
    case 'pregnancy': {
      // 'later' is a real answer ("I'll date it later"); the untouched
      // default is {method: 'lastPeriod', date: null}.
      await hydratePregnancyDating();
      const dating = getPregnancyDating();
      return [{route: 'PregnancyDatingSetup', required: true, done: dating.method === 'later' || dating.date !== null}];
    }
    case 'postpartum':
      await hydratePostpartumPreferences();
      return [{route: 'PostpartumDeliveryDate', required: true, done: getPostpartumPreferences().deliveryDate !== null}];
    case 'loss': {
      await hydrateMiscarriagePreferences();
      const prefs = getMiscarriagePreferences();
      return [
        {route: 'MiscarriageDate', required: true, done: prefs.miscarriageDate !== null},
        {route: 'MiscarriageBleeding', required: true, done: prefs.bleedingStatus !== null},
        {route: 'MiscarriageCycleReturn', required: true, done: prefs.cycleReturnStatus !== null},
        {route: 'MiscarriageTryingAgain', required: true, done: prefs.tryingAgainStatus !== null},
      ];
    }
  }
}

/** Where switching to `objective` must open its chain: the first step that is
 * not done yet (an optional step sitting before a missing required one is
 * re-offered, prefilled — it cannot be told apart from "not visited"), or null
 * when every REQUIRED step is complete (= configured, open the dashboard). */
export async function getObjectiveResumeRoute(objective: ObjectiveId): Promise<ObjectiveSetupRoute | null> {
  const steps = await getSetupSteps(objective);
  if (!steps.some(step => step.required && !step.done)) {return null;}
  return (steps.find(step => !step.done) as SetupStep).route;
}

/** True once the user has completed every REQUIRED step of `objective`'s own
 * onboarding — not merely once "some data exists". */
export async function isObjectiveConfigured(objective: ObjectiveId): Promise<boolean> {
  return (await getObjectiveResumeRoute(objective)) === null;
}

/** Where an unconfigured objective's chain starts. Conception only asks for
 * cycle information when none was confirmed yet (same rule as LocationScreen /
 * SpiritualPreferencesScreen use in first-launch onboarding). */
export function getObjectiveSetupRoute(objective: ObjectiveId, hasConfirmedCycleData: boolean): ObjectiveSetupRoute {
  switch (objective) {
    case 'cycle':
      return 'CycleInformation';
    case 'conceive':
      return hasConfirmedCycleData ? 'ConceptionTryingDuration' : 'CycleInformation';
    case 'contraception':
      return 'ContraceptionMethod';
    case 'irregular':
      return 'IrregularCyclePattern';
    case 'menopause':
      return 'MenopauseStage';
    case 'pregnancy':
      return 'PregnancyDatingSetup';
    case 'postpartum':
      return 'PostpartumDeliveryDate';
    case 'loss':
      return 'MiscarriageDate';
  }
}

export type ObjectiveSwitchResult = 'unchanged' | 'activated' | 'setup-started';

export async function switchToObjective(params: {
  from: ObjectiveId;
  to: ObjectiveId;
  /** Opens the objective's dashboard (Case A). */
  openHome: () => void;
  /** Opens the objective's configuration chain at its first incomplete step (Case B). */
  openSetup: (route: ObjectiveSetupRoute) => void;
}): Promise<ObjectiveSwitchResult> {
  const {from, to, openHome, openSetup} = params;
  if (from === to) {return 'unchanged';}

  const resumeRoute = await getObjectiveResumeRoute(to);

  if (resumeRoute === null) {
    await setActiveObjective(to);
    openHome();
    return 'activated';
  }

  // The pending record is written BEFORE the active objective moves to the
  // half-configured target: should the process die in between, the restart
  // finds a record whose target is not active (stale → discarded) rather than
  // a half-configured active objective with no record to restore from.
  await beginObjectiveSetup(from, to);
  // The chain's own screens branch on the ACTIVE objective (e.g. the Cycle
  // information screen continues differently for Conception), so it is set
  // before navigating.
  await setActiveObjective(to);
  openSetup(resumeRoute);
  return 'setup-started';
}

export type StartupRestoreResult = 'none' | 'restored' | 'cleared';

/** Startup guard for an in-app setup flow that was interrupted by a process
 * kill. Awaits everything it decides on (persisted record, active objective,
 * the target's configuration) BEFORE deciding:
 * - nothing persisted (or corrupt / unknown ids, cleared by the reader) → 'none';
 * - the record no longer describes reality (a setup is already pending in this
 *   session, or the active objective is not the recorded target) → the stale
 *   record is dropped, nothing else changes;
 * - the target is now fully configured → only the pending flag is cleared, the
 *   active objective is kept ('cleared');
 * - the target is NOT fully configured → the previous objective is made active
 *   again (same as cancelPendingObjectiveSetup) and the flag cleared ('restored').
 * Partial configuration is never marked complete and never deleted. */
export async function restorePendingObjectiveSetupOnStartup(): Promise<StartupRestoreResult> {
  const persisted = await readPersistedObjectiveSetup();
  if (!persisted) {return 'none';}

  // A flow begun during THIS session owns the persisted record — leave it.
  if (getPendingObjectiveSetup()) {return 'none';}

  const active = await hydrateActiveObjective();
  if (active !== persisted.objective || (await isObjectiveConfigured(persisted.objective))) {
    await clearPendingObjectiveSetup();
    return 'cleared';
  }

  await setActiveObjective(persisted.previous);
  await clearPendingObjectiveSetup();
  return 'restored';
}
