import type {SharingKey, SharingToggles} from '../state/awaADeuxSharingStore';
import type {ObjectiveId} from '../state/onboardingPreferences';
import {sharingKeysForObjective} from './awaADeuxObjective';

// THE rule for what the partner may see. Whatever displays or transmits partner data —
// the partner preview today, the partner view / sync later — must go through these two
// functions, so a switch that is off can never leak information.

const PREGNANCY_KEYS: readonly SharingKey[] = ['pregnancyWeek', 'dueDate', 'babyDevelopment', 'pregnancyStage'];
// While pregnant there is no cycle: the menstrual / fertility choices are never offered and never visible to the partner.
const CYCLE_KEYS: readonly SharingKey[] = ['cycleDay', 'nextPeriod', 'periodStatus', 'fertileWindow', 'ovulation', 'fertilityStatus'];

export type PartnerVisibility = {
  /** Effective visibility of every choice: her switch AND (for pregnancy) pregnancy mode. */
  fields: SharingToggles;
  /** Tips to support the partner: content written for the partner, not her data. */
  supportTips: true;
  /**
   * Recommendations are always shown, but adapted to the cycle phase only when she
   * shares her cycle day and phase — otherwise they are general, so they cannot reveal
   * a phase she chose not to share.
   */
  recommendations: 'phase' | 'general';
};

export type PartnerContext = {
  /** Pregnancy mode is on (the active objective is pregnancy). */
  isPregnant: boolean;
  /** The objective chosen in the onboarding: only the choices that belong to it can ever be visible. Omitted = the pregnancy rule alone. */
  objective?: ObjectiveId;
};

export function computePartnerVisibility(toggles: SharingToggles, context: PartnerContext): PartnerVisibility {
  const fields = {...toggles};
  if (!context.isPregnant) {
    PREGNANCY_KEYS.forEach(key => {
      fields[key] = false;
    });
  }
  if (context.isPregnant) {
    CYCLE_KEYS.forEach(key => {
      fields[key] = false;
    });
  }
  if (context.objective) {
    const allowed = sharingKeysForObjective(context.objective);
    (Object.keys(fields) as SharingKey[]).forEach(key => {
      if (!allowed.has(key)) {fields[key] = false;}
    });
  }
  return {
    fields,
    supportTips: true,
    recommendations: fields.cycleDay ? 'phase' : 'general',
  };
}

/**
 * The partner-side payload: only the values whose choice is effectively ON. A value
 * that is off is not "hidden" — it is absent.
 */
export function buildPartnerSnapshot<T>(
  values: Partial<Record<SharingKey, T>>,
  toggles: SharingToggles,
  context: PartnerContext,
): Partial<Record<SharingKey, T>> {
  const {fields} = computePartnerVisibility(toggles, context);
  const snapshot: Partial<Record<SharingKey, T>> = {};
  (Object.keys(fields) as SharingKey[]).forEach(key => {
    if (fields[key] && values[key] !== undefined) {snapshot[key] = values[key];}
  });
  return snapshot;
}
