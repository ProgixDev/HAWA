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
// (CycleObjectiveConfirmationScreen.tsx) — no per-objective screens.
export const OBJECTIVE_CONFIRMATION_CONTENT: Record<ObjectiveId, ObjectiveConfirmationContent> = {
  cycle: {
    title: 'Parfait ! 🎉',
    description: 'Tu as choisi le suivi classique du cycle.',
    nextStep: 'Tu pourras personnaliser ton suivi et ajouter tes premières informations\nà l’étape suivante.',
    buttonLabel: 'Commencer mon suivi',
  },
  conceive: {
    title: 'Parfait ! 🎉',
    description: 'Tu as choisi un suivi pour t’accompagner dans ton projet de conception.',
    nextStep: 'Nous allons personnaliser ton suivi de fertilité,d’ovulation et de cycle selon tes besoins.',
    buttonLabel: 'Configurer mon suivi',
  },
  contraception: {
    title: 'Parfait ! 🎉',
    description: 'Tu as choisi un suivi adapté à ta contraception.',
    nextStep: 'Tu pourras renseigner ton type de contraception et personnaliser le \nsuivi de ton cycle.',
    buttonLabel: 'Configurer mon suivi',
  },
  irregular: {
    title: 'Parfait ! 🎉',
    description: 'Tu as choisi un suivi pour mieux comprendre tes cycles irréguliers.',
    nextStep: 'Nous allons adapter ton suivi pour observer\ntes cycles, symptômes et tendances dans le temps.',
    buttonLabel: 'Configurer mon suivi',
  },
  menopause: {
    title: 'Parfait ! 🎉',
    description: 'Tu as choisi un suivi adapté à la ménopause.',
    nextStep: 'Tu pourras suivre ton bien-être, tes symptômes\net les changements que tu observes au quotidien.',
    buttonLabel: 'Commencer mon suivi',
  },
  pregnancy: {
    title: 'Parfait ! 🎉',
    description: 'Tu as choisi le suivi de grossesse.',
    nextStep: 'Nous allons personnaliser ton accompagnement pour suivre ta grossesse semaine après semaine.',
    buttonLabel: 'Commencer mon suivi',
  },
  postpartum: {
    title: 'Parfait ! 💜',
    description: 'Tu as choisi un accompagnement post-partum.',
    nextStep: 'AWA t’accompagnera dans ta récupération,le suivi des lochies, ton bien-être quotidien et le retour progressif de ton cycle.',
    buttonLabel: 'Commencer mon suivi',
  },
  loss: {
    title: 'Ton suivi est prêt',
    description: 'Tu as choisi un suivi après une fausse couche.',
    nextStep: 'Nous allons adapter ton espace de suivi\nà ta récupération et à ton bien-être.',
    buttonLabel: 'Commencer mon suivi',
  },
};
