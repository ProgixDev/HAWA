import type {SharingKey} from '../state/awaADeuxSharingStore';
import type {ObjectiveId} from '../state/onboardingPreferences';

// "AWA à deux" follows the objective chosen in the onboarding: what she can share — and so what the partner can ever see — depends on it.
//
//   cycle          cycle phase, next period (estimated), support tips
//   conceive       estimated fertile window, ovulation, tips for the conception project
//   contraception  useful cycle information (the fertile period is NOT offered: it is not a conception goal here)
//   irregular      cycle information, shared mood / symptoms, adapted tips
//   pregnancy      pregnancy follow-up (week, due date, development), tips — no menstrual information
//   postpartum     recovery, support and well-being
//   menopause      mood / symptoms and tips to accompany her
//   loss           emotional support, recovery and tips, with respect for confidentiality
//
// Pure data: the labels live in the dictionaries; the single place the rule is applied is computePartnerVisibility (utils/awaADeuxSharing.ts), which
// every partner screen already goes through, so a choice that does not belong to the objective is never offered AND never visible.

export type PartnerSectionId = 'cycle' | 'fertility' | 'pregnancy' | 'wellbeing';

export const SECTION_KEYS: Record<PartnerSectionId, readonly SharingKey[]> = {
  cycle: ['cycleDay', 'nextPeriod', 'periodStatus'],
  fertility: ['fertileWindow', 'ovulation', 'fertilityStatus'],
  pregnancy: ['pregnancyWeek', 'dueDate', 'babyDevelopment', 'pregnancyStage'],
  wellbeing: ['mood', 'dailyAdvice'],
};

const SECTIONS_BY_OBJECTIVE: Record<ObjectiveId, readonly PartnerSectionId[]> = {
  cycle: ['cycle', 'wellbeing'],
  conceive: ['fertility', 'wellbeing'],
  contraception: ['cycle', 'wellbeing'],
  irregular: ['cycle', 'wellbeing'],
  pregnancy: ['pregnancy', 'wellbeing'],
  postpartum: ['wellbeing'],
  menopause: ['wellbeing'],
  loss: ['wellbeing'],
};

export const sectionsForObjective = (objective: ObjectiveId): readonly PartnerSectionId[] => SECTIONS_BY_OBJECTIVE[objective] ?? SECTIONS_BY_OBJECTIVE.cycle;

export const sharingKeysForObjective = (objective: ObjectiveId): Set<SharingKey> =>
  new Set(sectionsForObjective(objective).flatMap(section => SECTION_KEYS[section]));
