import type {SharingKey, SharingToggles} from '../state/awaADeuxSharingStore';

// THE rule for what the partner may see. Whatever displays or transmits partner data —
// the partner preview today, the partner view / sync later — must go through these two
// functions, so a switch that is off can never leak information.

const PREGNANCY_KEYS: readonly SharingKey[] = ['pregnancyWeek', 'dueDate', 'babyDevelopment'];

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
};

export function computePartnerVisibility(toggles: SharingToggles, context: PartnerContext): PartnerVisibility {
  const fields = {...toggles};
  if (!context.isPregnant) {
    PREGNANCY_KEYS.forEach(key => {
      fields[key] = false;
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
