import type {ImageSourcePropType} from 'react-native';

import type {ObjectiveId} from '../state/onboardingPreferences';

export type ObjectiveConfirmationContent = {
  title: string;
  description: string;
  nextStep: string;
  buttonLabel: string;
  /** Optional decorative illustration — most objectives don't have a
   * dedicated existing asset yet (see FastingQadaaScreen-adjacent report),
   * so this stays undefined rather than reusing an unrelated image. */
  illustration?: ImageSourcePropType;
};

// ONE shared config for the ONE confirmation screen
// (CycleObjectiveConfirmationScreen.tsx) — no per-objective screens. Built
// from `t` at render time (single consumer, computed via useMemo there) so
// display text is localized without needing the module-level
// i18n-singleton/languageChanged pattern used by config files held by
// reference across multiple consumers.
export function buildObjectiveConfirmationContent(
  t: (key: string) => string,
): Record<ObjectiveId, ObjectiveConfirmationContent> {
  return {
    cycle: {
      title: t('objectiveConfirmation.cycle.title'),
      description: t('objectiveConfirmation.cycle.description'),
      nextStep: t('objectiveConfirmation.cycle.nextStep'),
      buttonLabel: t('objectiveConfirmation.cycle.buttonLabel'),
    },
    conceive: {
      title: t('objectiveConfirmation.conceive.title'),
      description: t('objectiveConfirmation.conceive.description'),
      nextStep: t('objectiveConfirmation.conceive.nextStep'),
      buttonLabel: t('objectiveConfirmation.conceive.buttonLabel'),
    },
    contraception: {
      title: t('objectiveConfirmation.contraception.title'),
      description: t('objectiveConfirmation.contraception.description'),
      nextStep: t('objectiveConfirmation.contraception.nextStep'),
      buttonLabel: t('objectiveConfirmation.contraception.buttonLabel'),
    },
    irregular: {
      title: t('objectiveConfirmation.irregular.title'),
      description: t('objectiveConfirmation.irregular.description'),
      nextStep: t('objectiveConfirmation.irregular.nextStep'),
      buttonLabel: t('objectiveConfirmation.irregular.buttonLabel'),
    },
    menopause: {
      title: t('objectiveConfirmation.menopause.title'),
      description: t('objectiveConfirmation.menopause.description'),
      nextStep: t('objectiveConfirmation.menopause.nextStep'),
      buttonLabel: t('objectiveConfirmation.menopause.buttonLabel'),
    },
    pregnancy: {
      title: t('objectiveConfirmation.pregnancy.title'),
      description: t('objectiveConfirmation.pregnancy.description'),
      nextStep: t('objectiveConfirmation.pregnancy.nextStep'),
      buttonLabel: t('objectiveConfirmation.pregnancy.buttonLabel'),
    },
    postpartum: {
      title: t('objectiveConfirmation.postpartum.title'),
      description: t('objectiveConfirmation.postpartum.description'),
      nextStep: t('objectiveConfirmation.postpartum.nextStep'),
      buttonLabel: t('objectiveConfirmation.postpartum.buttonLabel'),
    },
    loss: {
      title: t('objectiveConfirmation.loss.title'),
      description: t('objectiveConfirmation.loss.description'),
      nextStep: t('objectiveConfirmation.loss.nextStep'),
      buttonLabel: t('objectiveConfirmation.loss.buttonLabel'),
    },
  };
}
