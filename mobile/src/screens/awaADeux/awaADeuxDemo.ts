import type {SharingKey} from '../../state/awaADeuxSharingStore';
import i18n from '../../i18n';

// DEMO / MOCK CONTENT for the "AWA à deux" onboarding screens.
//
// Nothing here is real: there is no partner, no pairing, no backend and no health
// data behind these values. They only let the UX be validated before the real
// architecture (accounts, pairing, permissions, sharing) is built. Nothing is
// persisted — the sharing switches live in local screen state only.
//
// Every display string below reads the live app language via i18n.t() (same
// non-component pattern as cycleMath.ts's averageCycle.* usage), so this file
// never needs a `t` parameter threaded through its callers.

/** Fictitious values of the "what your partner sees" preview. */
export const demoPreview = () => ({
  cycleDay: '16',
  cycleDayCaption: i18n.t('awaADeux.demo.cycleDayCaption'),
  nextPeriod: i18n.t('awaADeux.demo.nextPeriod'),
  phase: i18n.t('awaADeux.demo.phase'),
  advice: i18n.t('awaADeux.demo.advice'),
  fertileWindow: i18n.t('awaADeux.demo.fertileWindow'),
  ovulation: i18n.t('awaADeux.demo.ovulation'),
  pregnancyWeek: i18n.t('awaADeux.demo.pregnancyWeek'),
  dueDate: i18n.t('awaADeux.demo.dueDate'),
  mood: i18n.t('awaADeux.demo.mood'),
  periodStatus: i18n.t('awaADeux.demo.periodStatus'),
  fertilityStatus: i18n.t('awaADeux.demo.fertilityStatus'),
  babyDevelopment: i18n.t('awaADeux.demo.babyDevelopment'),
  supportTips: i18n.t('awaADeux.demo.supportTips'),
  phaseRecommendation: i18n.t('awaADeux.demo.phaseRecommendation'),
  generalRecommendation: i18n.t('awaADeux.demo.generalRecommendation'),
} as const);

// The sharing choices themselves (keys, defaults, persistence) live in
// src/state/awaADeuxSharingStore.ts; the rule for what the partner may see in
// src/utils/awaADeuxSharing.ts. Re-exported here for the screens.
export {DEFAULT_SHARING_TOGGLES} from '../../state/awaADeuxSharingStore';
export type {SharingKey, SharingToggles} from '../../state/awaADeuxSharingStore';

/** Four categories. The pregnancy one is only offered while pregnancy mode is on. */
export type SharingSection = {
  id: 'cycle' | 'fertility' | 'pregnancy' | 'wellbeing';
  title: string;
  pregnancyOnly?: boolean;
  items: Array<{key: SharingKey; label: string; icon: string}>;
};

export const sharingSections = (): SharingSection[] => [
  {
    id: 'cycle',
    title: i18n.t('awaADeux.sections.cycle.title'),
    items: [
      {key: 'cycleDay', label: i18n.t('awaADeux.sections.cycle.cycleDay'), icon: 'calendar-month-outline'},
      {key: 'nextPeriod', label: i18n.t('awaADeux.sections.cycle.nextPeriod'), icon: 'calendar-clock-outline'},
      {key: 'periodStatus', label: i18n.t('awaADeux.sections.cycle.periodStatus'), icon: 'calendar-check-outline'},
    ],
  },
  {
    id: 'fertility',
    title: i18n.t('awaADeux.sections.fertility.title'),
    items: [
      {key: 'fertileWindow', label: i18n.t('awaADeux.sections.fertility.fertileWindow'), icon: 'flower-outline'},
      {key: 'ovulation', label: i18n.t('awaADeux.sections.fertility.ovulation'), icon: 'water-outline'},
      {key: 'fertilityStatus', label: i18n.t('awaADeux.sections.fertility.fertilityStatus'), icon: 'flower-tulip-outline'},
    ],
  },
  {
    id: 'pregnancy',
    title: i18n.t('awaADeux.sections.pregnancy.title'),
    pregnancyOnly: true,
    items: [
      {key: 'pregnancyWeek', label: i18n.t('awaADeux.sections.pregnancy.pregnancyWeek'), icon: 'baby-face-outline'},
      {key: 'dueDate', label: i18n.t('awaADeux.sections.pregnancy.dueDate'), icon: 'calendar-heart'},
      {key: 'babyDevelopment', label: i18n.t('awaADeux.sections.pregnancy.babyDevelopment'), icon: 'human-pregnant'},
    ],
  },
  {
    id: 'wellbeing',
    title: i18n.t('awaADeux.sections.wellbeing.title'),
    items: [
      {key: 'mood', label: i18n.t('awaADeux.sections.wellbeing.mood'), icon: 'emoticon-happy-outline'},
      {key: 'dailyAdvice', label: i18n.t('awaADeux.sections.wellbeing.dailyAdvice'), icon: 'lightbulb-on-outline'},
    ],
  },
];

/**
 * Shown in the "Bien-être et soutien" card WITHOUT a switch: content written for the
 * partner, not personal data of hers.
 */
export const supportContent = (): Array<{id: string; label: string; note: string; icon: string}> => [
  {
    id: 'supportTips',
    label: i18n.t('awaADeux.supportContent.supportTipsLabel'),
    note: i18n.t('awaADeux.supportContent.supportTipsNote'),
    icon: 'hand-heart-outline',
  },
  {
    id: 'recommendations',
    label: i18n.t('awaADeux.supportContent.recommendationsLabel'),
    note: i18n.t('awaADeux.supportContent.recommendationsNote'),
    icon: 'heart-plus-outline',
  },
];
