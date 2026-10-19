import type {ImageSourcePropType} from 'react-native';

import {resolveEditorialLanguage, type EditorialLanguage} from './editorialLanguage';

// Editorial illustrations that carry lettering baked into the artwork exist in
// one variant per language. Static require() calls only (Metro bundles each
// file); the language is picked at render time from the app's existing i18n
// language via resolveEditorialLanguage() — English for anything unrecognized.
//
// TURKISH ('tr'): these four illustrations carry lettering baked into the artwork. A Turkish variant exists only
// for the images that have actually been produced (a Turkish artwork needs the lettering re-set in the design
// source — it cannot be produced by translating strings). 'tr' is therefore OPTIONAL in the set: while it is
// missing the resolver returns the ENGLISH variant explicitly — never French, Spanish or Italian — and the image's
// spoken description (EDITORIAL_IMAGE_ALT) says that the lettering in the picture is English. The assets that
// are still missing are listed in EDITORIAL_IMAGES_MISSING_TURKISH so they cannot be forgotten, and a test pins
// that list. Adding the file and a `tr` entry to a set below is all it takes to ship one.
// RUSSIAN ('ru'): same rule as Turkish — the lettering is part of the artwork and cannot be produced by translating
// strings, so 'ru' is OPTIONAL too: until a Russian artwork exists the resolver returns the ENGLISH variant and the
// spoken description says that the lettering in the picture is English (EDITORIAL_IMAGES_MISSING_RUSSIAN lists them).
// GERMAN ('de'): same rule again — the lettering is part of the artwork, so 'de' is OPTIONAL: until a German artwork
// exists the resolver returns the ENGLISH variant and the spoken description says that the lettering in the picture
// is English (EDITORIAL_IMAGES_MISSING_GERMAN lists them).
// SIMPLIFIED CHINESE ('zh'): same rule — until a Chinese artwork exists the resolver returns the ENGLISH variant and the
// spoken description says that the lettering in the picture is English (EDITORIAL_IMAGES_MISSING_CHINESE lists them).
// INDONESIAN ('id'): same rule — no Indonesian artwork exists yet; the resolver returns the ENGLISH variant and the spoken
// description says that the lettering in the picture is English (EDITORIAL_IMAGES_MISSING_INDONESIAN lists them).
export type LocalizedImageSet = Readonly<Record<'fr' | 'en' | 'es' | 'it', ImageSourcePropType>> & {
  readonly tr?: ImageSourcePropType;
  readonly ru?: ImageSourcePropType;
  readonly de?: ImageSourcePropType;
  readonly zh?: ImageSourcePropType;
  readonly id?: ImageSourcePropType;
};

export const CYCLE_PHASES_HERO: LocalizedImageSet = {
  fr: require('../assets/images/library/cycle-phases-hero.fr.webp'),
  en: require('../assets/images/library/cycle-phases-hero.en.webp'),
  es: require('../assets/images/library/cycle-phases-hero.es.webp'),
  it: require('../assets/images/library/cycle-phases-hero.it.webp'),
  tr: require('../assets/images/library/cycle-phases-hero.tr.webp'),
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
// ('tr' is optional, so it is deliberately not part of this check.)

/** Picks the variant for `language`; a plain (language-neutral) image is returned as-is. A language that has no
 * variant of its own yet (Turkish today) gets the English one — see the note on LocalizedImageSet. */
export function resolveEditorialImage(
  image: ImageSourcePropType | LocalizedImageSet,
  language: string | null | undefined,
): ImageSourcePropType {
  if (!isLocalizedSet(image)) {return image;}
  const resolved = resolveEditorialLanguage(language);
  return image[resolved] ?? image.en;
}

/** True when `language` has its own variant of this illustration (false for a plain, language-neutral image). */
export function hasLocalizedEditorialImage(image: ImageSourcePropType | LocalizedImageSet, language: string | null | undefined): boolean {
  return isLocalizedSet(image) && image[resolveEditorialLanguage(language)] !== undefined;
}

/** The text-in-image illustrations that still have NO Turkish variant (their lettering is English in Turkish). */
export const EDITORIAL_IMAGES_MISSING_TURKISH: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).tr === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Russian variant (their lettering is English in Russian). */
export const EDITORIAL_IMAGES_MISSING_RUSSIAN: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).ru === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO German variant (their lettering is English in German). */
export const EDITORIAL_IMAGES_MISSING_GERMAN: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).de === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Indonesian variant (their lettering is English in Indonesian). */
export const EDITORIAL_IMAGES_MISSING_INDONESIAN: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).id === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Simplified Chinese variant (their lettering is English in Chinese). */
export const EDITORIAL_IMAGES_MISSING_CHINESE: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).zh === undefined)
  .map(([name]) => name as string);

// The three heroes whose lettering says something (the cover is decorative) get a
// spoken description in the selected language. Decorative illustrations stay silent.
export type MeaningfulEditorialImage = 'pregnancyFollowUp' | 'pregnancyExercise' | 'exercise';

export const EDITORIAL_IMAGE_ALT: Record<MeaningfulEditorialImage, Record<EditorialLanguage, string>> = {
  pregnancyFollowUp: {
    fr: 'Illustration : une médecin et une femme enceinte pendant un suivi avec échographie. Texte : Suivi médical pendant la grossesse, pour la santé de maman et le bien-être de bébé.',
    en: 'Illustration: a doctor and a pregnant woman during a check-up with an ultrasound. Text: Medical care during pregnancy, for mom’s health and baby’s well-being.',
    es: 'Ilustración: una médica y una mujer embarazada durante un control con ecografía. Texto: Control médico durante el embarazo, por la salud de mamá y el bienestar del bebé.',
    tr: 'İlüstrasyon: Ultrason eşliğinde kontrol sırasında bir doktor ve hamile bir kadın. Görseldeki yazı İngilizcedir: “Medical care during pregnancy, for mom’s health and baby’s well-being.”',
    ru: 'Иллюстрация: врач и беременная женщина на плановом осмотре с УЗИ. Надпись на картинке на английском языке: «Medical care during pregnancy, for mom’s health and baby’s well-being.»',
    de: 'Illustration: eine Ärztin und eine Schwangere bei einer Vorsorgeuntersuchung mit Ultraschall. Die Beschriftung im Bild ist auf Englisch: „Medical care during pregnancy, for mom’s health and baby’s well-being.“',
    zh: '插图：一位医生与一位孕妇在做超声检查的产检中。图中文字为英文：“Medical care during pregnancy, for mom’s health and baby’s well-being.”',
    id: 'Ilustrasi: seorang dokter dan ibu hamil saat pemeriksaan kehamilan dengan USG. Tulisan pada gambar berbahasa Inggris: “Medical care during pregnancy, for mom’s health and baby’s well-being.”',
    it: 'Illustrazione: una dottoressa e una donna incinta durante un controllo con ecografia. Testo: Controlli medici in gravidanza, per la salute della mamma e il benessere del bambino.',
  },
  pregnancyExercise: {
    fr: 'Illustration : une femme enceinte en fente avant sur un tapis de yoga. Texte : Bouger pour une grossesse en santé. Affiche : une maman en bonne santé pour un bébé épanoui.',
    en: 'Illustration: a pregnant woman in a lunge stretch on a yoga mat. Text: Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.',
    es: 'Ilustración: una mujer embarazada estirando en zancada sobre una esterilla de yoga. Texto: Muévete por un embarazo saludable. Cartel: una mamá en buena salud para un bebé feliz.',
    tr: 'İlüstrasyon: Yoga matı üzerinde hamle pozunda esneyen hamile bir kadın. Görseldeki yazı İngilizcedir: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    ru: 'Иллюстрация: беременная женщина в выпаде на коврике для йоги. Надпись на картинке на английском языке: «Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.»',
    de: 'Illustration: eine Schwangere im Ausfallschritt auf einer Yogamatte. Die Beschriftung im Bild ist auf Englisch: „Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.“',
    zh: '插图：一位孕妇在瑜伽垫上做弓步拉伸。图中文字为英文：“Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    id: 'Ilustrasi: seorang ibu hamil melakukan peregangan lunge di atas matras yoga. Tulisan pada gambar berbahasa Inggris: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    it: 'Illustrazione: una donna incinta in affondo su un tappetino da yoga. Testo: Muoviti per una gravidanza in salute. Quadro: una mamma in salute per un bambino sereno.',
  },
  exercise: {
    fr: 'Illustration : une femme en fente avant sur un tapis de yoga. Texte : Bouger pour se sentir bien. Affiche : corps, équilibre, énergie.',
    en: 'Illustration: a woman in a lunge stretch on a yoga mat. Text: Move to feel good. Poster: body, balance, energy.',
    es: 'Ilustración: una mujer estirando en zancada sobre una esterilla de yoga. Texto: Muévete para sentirte bien. Cartel: cuerpo, equilibrio, energía.',
    tr: 'İlüstrasyon: Yoga matı üzerinde hamle pozunda esneyen bir kadın. Görseldeki yazı İngilizcedir: “Move to feel good. Poster: body, balance, energy.”',
    ru: 'Иллюстрация: женщина в выпаде на коврике для йоги. Надпись на картинке на английском языке: «Move to feel good. Poster: body, balance, energy.»',
    de: 'Illustration: eine Frau im Ausfallschritt auf einer Yogamatte. Die Beschriftung im Bild ist auf Englisch: „Move to feel good. Poster: body, balance, energy.“',
    zh: '插图：一位女性在瑜伽垫上做弓步拉伸。图中文字为英文：“Move to feel good. Poster: body, balance, energy.”',
    id: 'Ilustrasi: seorang perempuan melakukan peregangan lunge di atas matras yoga. Tulisan pada gambar berbahasa Inggris: “Move to feel good. Poster: body, balance, energy.”',
    it: 'Illustrazione: una donna in affondo su un tappetino da yoga. Testo: Muoviti per sentirti bene. Quadro: corpo, equilibrio, energia.',
  },
};
