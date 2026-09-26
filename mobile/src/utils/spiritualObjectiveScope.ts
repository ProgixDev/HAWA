import type {ObjectiveId} from '../state/onboardingPreferences';

/**
 * Which objectives surface the MENSTRUAL purity status (Menstrues / Pureté,
 * "Pureté retrouvée à…", period-end edit sheet).
 *
 * This only mirrors WHERE the existing UI already shows it — it is not a
 * religious rule and computes nothing. The dashboards' SpiritualGuidanceCard
 * (components/home/SpiritualGuidanceCard.tsx) hides purity for pregnancy,
 * postpartum, loss, contraception and menopause, and shows it (fed by
 * usePrayerPurityStatus) on the three period-based objectives: cycle,
 * conceive and irregular (SOPK). The Prayer Times screen must agree with that
 * card — its purity summary is tappable and navigates to Prayer Times — so
 * both read this single predicate/list.
 */
export const MENSTRUAL_PURITY_OBJECTIVES: readonly ObjectiveId[] = ['cycle', 'conceive', 'irregular'];

export const objectiveShowsMenstrualPurity = (objective: ObjectiveId): boolean =>
  MENSTRUAL_PURITY_OBJECTIVES.includes(objective);
