import type {SharingKey} from '../../state/awaADeuxSharingStore';

// DEMO / MOCK CONTENT for the "AWA à deux" onboarding screens.
//
// Nothing here is real: there is no partner, no pairing, no backend and no health
// data behind these values. They only let the UX be validated before the real
// architecture (accounts, pairing, permissions, sharing) is built. Nothing is
// persisted — the sharing switches live in local screen state only.

/** Placeholder association code shown on the last screen. NOT generated, NOT validated, NOT secure. */
export const DEMO_PAIRING_CODE = 'AWA-7K4P9';
export const DEMO_PAIRING_VALIDITY = 'Valable pendant 24 heures';

/** The partner's first name in the preview (mock). */

/** Fictitious values of the "what your partner sees" preview. */
export const DEMO_PREVIEW = {
  cycleDay: '16',
  cycleDayCaption: 'Cycle en cours',
  nextPeriod: 'Pas encore',
  phase: 'Récupération',
  advice: 'Soutenez-la avec de petites attentions au quotidien.',
  fertileWindow: 'Dans 3 jours',
  ovulation: 'Estimée demain',
  pregnancyWeek: 'Semaine 12',
  dueDate: '14 mars',
  mood: 'Plutôt sereine',
  periodStatus: 'Terminées',
  fertilityStatus: 'Non fertile',
  babyDevelopment: 'Les organes de bébé continuent de se former.',
  supportTips: 'Proposez-lui un moment calme et une boisson chaude.',
  phaseRecommendation: 'Phase actuelle : privilégiez le repos et la douceur.',
  generalRecommendation: 'Restez à l’écoute et proposez votre aide.',
} as const;

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

export const SHARING_SECTIONS: SharingSection[] = [
  {
    id: 'cycle',
    title: 'Cycle',
    items: [
      {key: 'cycleDay', label: 'Jour du cycle et phase actuelle', icon: 'calendar-month-outline'},
      {key: 'nextPeriod', label: 'Prochaines règles estimées', icon: 'calendar-clock-outline'},
      {key: 'periodStatus', label: 'Statut des règles : en cours / terminées', icon: 'calendar-check-outline'},
    ],
  },
  {
    id: 'fertility',
    title: 'Fertilité et conception',
    items: [
      {key: 'fertileWindow', label: 'Fenêtre fertile', icon: 'flower-outline'},
      {key: 'ovulation', label: 'Ovulation estimée', icon: 'water-outline'},
      {key: 'fertilityStatus', label: 'Statut de fertilité : fertile / non fertile', icon: 'flower-tulip-outline'},
    ],
  },
  {
    id: 'pregnancy',
    title: 'Grossesse',
    pregnancyOnly: true,
    items: [
      {key: 'pregnancyWeek', label: 'Semaine de grossesse', icon: 'baby-face-outline'},
      {key: 'dueDate', label: 'Date prévue d’accouchement', icon: 'calendar-heart'},
      {key: 'babyDevelopment', label: 'Étape de la grossesse et développement de bébé', icon: 'human-pregnant'},
    ],
  },
  {
    id: 'wellbeing',
    title: 'Bien-être et soutien',
    items: [
      {key: 'mood', label: 'Humeur', icon: 'emoticon-happy-outline'},
      {key: 'dailyAdvice', label: 'Conseil du jour', icon: 'lightbulb-on-outline'},
    ],
  },
];

/**
 * Shown in the "Bien-être et soutien" card WITHOUT a switch: content written for the
 * partner, not personal data of hers.
 */
export const SUPPORT_CONTENT: Array<{id: string; label: string; note: string; icon: string}> = [
  {
    id: 'supportTips',
    label: 'Conseils pour soutenir votre partenaire',
    note: 'Toujours affichés côté partenaire',
    icon: 'hand-heart-outline',
  },
  {
    id: 'recommendations',
    label: 'Recommandations adaptées à la phase du cycle',
    note: 'Adaptées à la phase seulement si vous partagez le jour du cycle',
    icon: 'heart-plus-outline',
  },
];
