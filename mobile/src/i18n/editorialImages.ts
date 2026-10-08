import type {ImageSourcePropType} from 'react-native';

import {resolveEditorialLanguage, type EditorialLanguage} from './editorialLanguage';

// Editorial illustrations that carry lettering baked into the artwork exist in
// one variant per language. Static require() calls only (Metro bundles each
// file); the language is picked at render time from the app's existing i18n
// language via resolveEditorialLanguage() — English for anything unrecognized.
export type LocalizedImageSet = Readonly<Record<EditorialLanguage, ImageSourcePropType>>;

export const CYCLE_PHASES_HERO: LocalizedImageSet = {
  fr: require('../assets/images/library/cycle-phases-hero.fr.webp'),
  en: require('../assets/images/library/cycle-phases-hero.en.webp'),
  es: require('../assets/images/library/cycle-phases-hero.es.webp'),
  it: require('../assets/images/library/cycle-phases-hero.it.webp'),
};

export const PREGNANCY_FOLLOW_UP_HERO: LocalizedImageSet = {
  fr: require('../assets/images/library/grossesse_semiane.fr.webp'),
  en: require('../assets/images/library/grossesse_semiane.en.webp'),
  es: require('../assets/images/library/grossesse_semiane.es.webp'),
  it: require('../assets/images/library/grossesse_semiane.it.webp'),
};

export const PREGNANCY_EXERCISE_HERO: LocalizedImageSet = {
  fr: require('../assets/images/library/activité_grossesse.fr.webp'),
  en: require('../assets/images/library/activité_grossesse.en.webp'),
  es: require('../assets/images/library/activité_grossesse.es.webp'),
  it: require('../assets/images/library/activité_grossesse.it.webp'),
};

export const EXERCISE_HERO: LocalizedImageSet = {
  fr: require('../assets/images/library/activité.fr.webp'),
  en: require('../assets/images/library/activité.en.webp'),
  es: require('../assets/images/library/activité.es.webp'),
  it: require('../assets/images/library/activité.it.webp'),
};

const isLocalizedSet = (image: unknown): image is LocalizedImageSet =>
  typeof image === 'object' &&
  image !== null &&
  !Array.isArray(image) &&
  'fr' in image &&
  'en' in image &&
  'es' in image &&
  'it' in image;

/** Picks the variant for `language`; a plain (language-neutral) image is returned as-is. */
export function resolveEditorialImage(
  image: ImageSourcePropType | LocalizedImageSet,
  language: string | null | undefined,
): ImageSourcePropType {
  return isLocalizedSet(image) ? image[resolveEditorialLanguage(language)] : image;
}

// The three heroes whose lettering says something (the cover is decorative) get a
// spoken description in the selected language. Decorative illustrations stay silent.
export type MeaningfulEditorialImage = 'pregnancyFollowUp' | 'pregnancyExercise' | 'exercise';

export const EDITORIAL_IMAGE_ALT: Record<MeaningfulEditorialImage, Record<EditorialLanguage, string>> = {
  pregnancyFollowUp: {
    fr: 'Illustration : une médecin et une femme enceinte pendant un suivi avec échographie. Texte : Suivi médical pendant la grossesse, pour la santé de maman et le bien-être de bébé.',
    en: 'Illustration: a doctor and a pregnant woman during a check-up with an ultrasound. Text: Medical care during pregnancy, for mom’s health and baby’s well-being.',
    es: 'Ilustración: una médica y una mujer embarazada durante un control con ecografía. Texto: Control médico durante el embarazo, por la salud de mamá y el bienestar del bebé.',
    it: 'Illustrazione: una dottoressa e una donna incinta durante un controllo con ecografia. Testo: Controlli medici in gravidanza, per la salute della mamma e il benessere del bambino.',
  },
  pregnancyExercise: {
    fr: 'Illustration : une femme enceinte en fente avant sur un tapis de yoga. Texte : Bouger pour une grossesse en santé. Affiche : une maman en bonne santé pour un bébé épanoui.',
    en: 'Illustration: a pregnant woman in a lunge stretch on a yoga mat. Text: Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.',
    es: 'Ilustración: una mujer embarazada estirando en zancada sobre una esterilla de yoga. Texto: Muévete por un embarazo saludable. Cartel: una mamá en buena salud para un bebé feliz.',
    it: 'Illustrazione: una donna incinta in affondo su un tappetino da yoga. Testo: Muoviti per una gravidanza in salute. Quadro: una mamma in salute per un bambino sereno.',
  },
  exercise: {
    fr: 'Illustration : une femme en fente avant sur un tapis de yoga. Texte : Bouger pour se sentir bien. Affiche : corps, équilibre, énergie.',
    en: 'Illustration: a woman in a lunge stretch on a yoga mat. Text: Move to feel good. Poster: body, balance, energy.',
    es: 'Ilustración: una mujer estirando en zancada sobre una esterilla de yoga. Texto: Muévete para sentirte bien. Cartel: cuerpo, equilibrio, energía.',
    it: 'Illustrazione: una donna in affondo su un tappetino da yoga. Testo: Muoviti per sentirti bene. Quadro: corpo, equilibrio, energia.',
  },
};
