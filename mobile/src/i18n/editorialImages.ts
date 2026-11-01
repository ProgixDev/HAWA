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
// HINDI ('hi'): same rule — no Hindi artwork exists; the resolver returns the ENGLISH variant and the spoken description says that
// the lettering in the picture is English (EDITORIAL_IMAGES_MISSING_HINDI lists them).
// ALBANIAN ('sq'): same rule — no Albanian artwork exists; the resolver returns the ENGLISH variant and the spoken description says that
// the lettering in the picture is English (EDITORIAL_IMAGES_MISSING_ALBANIAN lists them).
// JAPANESE ('ja'): same rule — no Japanese artwork exists; the resolver returns the ENGLISH variant and the spoken description says that
// the lettering in the picture is English (EDITORIAL_IMAGES_MISSING_JAPANESE lists them).
// KOREAN ('ko'): same rule — no Korean artwork exists; the resolver returns the ENGLISH variant and the spoken description says that
// the lettering in the picture is English (EDITORIAL_IMAGES_MISSING_KOREAN lists them).
// PORTUGUESE ('pt-PT' Portugal, 'pt-BR' Brasil): same rule — no Portuguese artwork exists; the resolver returns the ENGLISH variant and the spoken description
// says that the lettering in the picture is English (EDITORIAL_IMAGES_MISSING_PORTUGUESE lists them).
// BENGALI ('bn'): same rule — no Bengali artwork exists; the resolver returns the ENGLISH variant and the spoken description says that the lettering in the
// picture is English (EDITORIAL_IMAGES_MISSING_BENGALI lists them).
// DANISH ('da'): same rule — no Danish artwork exists; the resolver returns the ENGLISH variant and the spoken description says that the lettering in the
// picture is English (EDITORIAL_IMAGES_MISSING_DANISH lists them).
// SWEDISH ('sv'): same rule — no Swedish artwork exists; the resolver returns the ENGLISH variant and the spoken description says that the lettering in the
// picture is English (EDITORIAL_IMAGES_MISSING_SWEDISH lists them).
// NORWEGIAN BOKMÅL ('nb'): same rule — no Norwegian artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_NORWEGIAN lists them).
// POLISH ('pl'): same rule — no Polish artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_POLISH lists them).
// UKRAINIAN ('uk'): same rule — no Ukrainian artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_UKRAINIAN lists them).
// CZECH ('cs'): same rule — no Czech artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_CZECH lists them).
// SLOVAK ('sk'): same rule — no Slovak artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_SLOVAK lists them).
// HUNGARIAN ('hu'): same rule — no Hungarian artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_HUNGARIAN lists them).
// ROMANIAN ('ro'): same rule — no Romanian artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_ROMANIAN lists them).
// BULGARIAN ('bg'): same rule — no Bulgarian artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_BULGARIAN lists them).
// SERBIAN ('sr'): same rule — no Serbian artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_SERBIAN lists them).
// CROATIAN ('hr'): same rule — no Croatian artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_CROATIAN lists them).
// BOSNIAN ('bs'): same rule — no Bosnian artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_BOSNIAN lists them).
// SLOVENIAN ('sl'): same rule — no Slovenian artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_SLOVENIAN lists them).
// NEPALI ('ne'): same rule — no Nepali artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_NEPALI lists them).
// SINHALA ('si'): same rule — no Sinhala artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_SINHALA lists them).
// THAI ('th'): same rule — no Thai artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_THAI lists them).
// VIETNAMESE ('vi'): same rule — no Vietnamese artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_VIETNAMESE lists them).
// UZBEK ('uz'): same rule — no Uzbek artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_UZBEK lists them).
// AZERBAIJANI ('az'): same rule — no Azerbaijani artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_AZERBAIJANI lists them).
// GEORGIAN ('ka'): same rule — no Georgian artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_GEORGIAN lists them).
// ARMENIAN ('hy'): same rule — no Armenian artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_ARMENIAN lists them).
// TAJIK ('tg'): same rule — no Tajik artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_TAJIK lists them).
// KYRGYZ ('ky'): same rule — no Kyrgyz artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_KYRGYZ lists them).
// TURKMEN ('tk'): same rule — no Turkmen artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_TURKMEN lists them).
// MALAY ('ms'): same rule — no Malay artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_MALAY lists them).
// SOMALI ('so'): same rule — no Somali artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_SOMALI lists them).
// SWAHILI ('sw'): same rule — no Swahili artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_SWAHILI lists them).
// KAZAKH ('kk'): same rule — no Kazakh artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_KAZAKH lists them).
// WOLOF ('wo'): same rule — no Wolof artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_WOLOF lists them).
// HAUSA ('ha'): same rule — no Hausa artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_HAUSA lists them).
// AMHARIC ('am'): same rule — no Amharic artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_AMHARIC lists them).
// DUTCH ('nl'): same rule — no Dutch artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_DUTCH lists them).
// FINNISH ('fi'): same rule — no Finnish artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_FINNISH lists them).
// GREEK ('el'): same rule — no Greek artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_GREEK lists them).
// FILIPINO ('fil'): same rule — no Filipino artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_FILIPINO lists them).
// TAMIL ('ta'): same rule — no Tamil artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_TAMIL lists them).
// TELUGU ('te'): same rule — no Telugu artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_TELUGU lists them).
// MARATHI ('mr'): same rule — no Marathi artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_MARATHI lists them).
// GUJARATI ('gu'): same rule — no Gujarati artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_GUJARATI lists them).
// PUNJABI ('pa'): same rule — no Punjabi artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_PUNJABI lists them).
// BURMESE ('my'): same rule — no Burmese artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_BURMESE lists them).
// KHMER ('km'): same rule — no Khmer artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_KHMER lists them).
// LAO ('lo'): same rule — no Lao artwork exists; the English variant is returned and the spoken description says that the lettering is English
// (EDITORIAL_IMAGES_MISSING_LAO lists them).
export type LocalizedImageSet = Readonly<Record<'fr' | 'en' | 'es' | 'it', ImageSourcePropType>> & {
  readonly tr?: ImageSourcePropType;
  readonly ru?: ImageSourcePropType;
  readonly de?: ImageSourcePropType;
  readonly zh?: ImageSourcePropType;
  readonly id?: ImageSourcePropType;
  readonly hi?: ImageSourcePropType;
  readonly sq?: ImageSourcePropType;
  readonly ja?: ImageSourcePropType;
  readonly ko?: ImageSourcePropType;
  readonly 'pt-PT'?: ImageSourcePropType;
  readonly 'pt-BR'?: ImageSourcePropType;
  readonly bn?: ImageSourcePropType;
  readonly da?: ImageSourcePropType;
  readonly sv?: ImageSourcePropType;
  readonly nb?: ImageSourcePropType;
  readonly pl?: ImageSourcePropType;
  readonly uk?: ImageSourcePropType;
  readonly cs?: ImageSourcePropType;
  readonly sk?: ImageSourcePropType;
  readonly hu?: ImageSourcePropType;
  readonly ro?: ImageSourcePropType;
  readonly bg?: ImageSourcePropType;
  readonly sr?: ImageSourcePropType;
  readonly hr?: ImageSourcePropType;
  readonly bs?: ImageSourcePropType;
  readonly sl?: ImageSourcePropType;
  readonly ne?: ImageSourcePropType;
  readonly si?: ImageSourcePropType;
  readonly th?: ImageSourcePropType;
  readonly vi?: ImageSourcePropType;
  readonly uz?: ImageSourcePropType;
  readonly az?: ImageSourcePropType;
  readonly ka?: ImageSourcePropType;
  readonly hy?: ImageSourcePropType;
  readonly tg?: ImageSourcePropType;
  readonly ky?: ImageSourcePropType;
  readonly tk?: ImageSourcePropType;
  readonly ms?: ImageSourcePropType;
  readonly so?: ImageSourcePropType;
  readonly sw?: ImageSourcePropType;
  readonly kk?: ImageSourcePropType;
  readonly wo?: ImageSourcePropType;
  readonly ha?: ImageSourcePropType;
  readonly am?: ImageSourcePropType;
  readonly nl?: ImageSourcePropType;
  readonly fi?: ImageSourcePropType;
  readonly el?: ImageSourcePropType;
  readonly fil?: ImageSourcePropType;
  readonly ta?: ImageSourcePropType;
  readonly te?: ImageSourcePropType;
  readonly mr?: ImageSourcePropType;
  readonly gu?: ImageSourcePropType;
  readonly pa?: ImageSourcePropType;
  readonly my?: ImageSourcePropType;
  readonly km?: ImageSourcePropType;
  readonly lo?: ImageSourcePropType;
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

/** The text-in-image illustrations that still have NO Albanian variant (their lettering is English in Albanian). */
export const EDITORIAL_IMAGES_MISSING_ALBANIAN: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).sq === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Japanese variant (their lettering is English in Japanese). */
export const EDITORIAL_IMAGES_MISSING_JAPANESE: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).ja === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Korean variant (their lettering is English in Korean). */
export const EDITORIAL_IMAGES_MISSING_KOREAN: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).ko === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Portuguese variant (their lettering is English in Portuguese, Portugal and Brazil alike). */
export const EDITORIAL_IMAGES_MISSING_PORTUGUESE: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet)['pt-PT'] === undefined && (set as LocalizedImageSet)['pt-BR'] === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Bengali variant (their lettering is English in Bengali). */
export const EDITORIAL_IMAGES_MISSING_BENGALI: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).bn === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Danish variant (their lettering is English in Danish). */
export const EDITORIAL_IMAGES_MISSING_DANISH: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).da === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Swedish variant (their lettering is English in Swedish). */
export const EDITORIAL_IMAGES_MISSING_SWEDISH: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).sv === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Norwegian Bokmål variant (their lettering is English in Norwegian). */
export const EDITORIAL_IMAGES_MISSING_NORWEGIAN: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).nb === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Polish variant (their lettering is English in Polish). */
export const EDITORIAL_IMAGES_MISSING_POLISH: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).pl === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Ukrainian variant (their lettering is English in Ukrainian). */
export const EDITORIAL_IMAGES_MISSING_UKRAINIAN: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).uk === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Czech variant (their lettering is English in Czech). */
export const EDITORIAL_IMAGES_MISSING_CZECH: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).cs === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Slovak variant (their lettering is English in Slovak). */
export const EDITORIAL_IMAGES_MISSING_SLOVAK: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).sk === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Hungarian variant (their lettering is English in Hungarian). */
export const EDITORIAL_IMAGES_MISSING_HUNGARIAN: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).hu === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Romanian variant (their lettering is English in Romanian). */
export const EDITORIAL_IMAGES_MISSING_ROMANIAN: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).ro === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Bulgarian variant (their lettering is English in Bulgarian). */
export const EDITORIAL_IMAGES_MISSING_BULGARIAN: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).bg === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Serbian variant (their lettering is English in Serbian). */
export const EDITORIAL_IMAGES_MISSING_SERBIAN: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).sr === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Croatian variant (their lettering is English in Croatian). */
export const EDITORIAL_IMAGES_MISSING_CROATIAN: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).hr === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Bosnian variant (their lettering is English in Bosnian). */
export const EDITORIAL_IMAGES_MISSING_BOSNIAN: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).bs === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Slovenian variant (their lettering is English in Slovenian). */
export const EDITORIAL_IMAGES_MISSING_SLOVENIAN: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).sl === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Nepali variant (their lettering is English in Nepali). */
export const EDITORIAL_IMAGES_MISSING_NEPALI: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).ne === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Sinhala variant (their lettering is English in Sinhala). */
export const EDITORIAL_IMAGES_MISSING_SINHALA: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).si === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Thai variant (their lettering is English in Thai). */
export const EDITORIAL_IMAGES_MISSING_THAI: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).th === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Vietnamese variant (their lettering is English in Vietnamese). */
export const EDITORIAL_IMAGES_MISSING_VIETNAMESE: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).vi === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Uzbek variant (their lettering is English in Uzbek). */
export const EDITORIAL_IMAGES_MISSING_UZBEK: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).uz === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Azerbaijani variant (their lettering is English in Azerbaijani). */
export const EDITORIAL_IMAGES_MISSING_AZERBAIJANI: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).az === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Georgian variant (their lettering is English in Georgian). */
export const EDITORIAL_IMAGES_MISSING_GEORGIAN: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).ka === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Armenian variant (their lettering is English in Armenian). */
export const EDITORIAL_IMAGES_MISSING_ARMENIAN: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).hy === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Tajik variant (their lettering is English in Tajik). */
export const EDITORIAL_IMAGES_MISSING_TAJIK: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).tg === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Kyrgyz variant (their lettering is English in Kyrgyz). */
export const EDITORIAL_IMAGES_MISSING_KYRGYZ: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).ky === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Turkmen variant (their lettering is English in Turkmen). */
export const EDITORIAL_IMAGES_MISSING_TURKMEN: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).tk === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Malay variant (their lettering is English in Malay). */
export const EDITORIAL_IMAGES_MISSING_MALAY: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).ms === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Somali variant (their lettering is English in Somali). */
export const EDITORIAL_IMAGES_MISSING_SOMALI: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).so === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Swahili variant (their lettering is English in Swahili). */
export const EDITORIAL_IMAGES_MISSING_SWAHILI: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).sw === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Kazakh variant (their lettering is English in Kazakh). */
export const EDITORIAL_IMAGES_MISSING_KAZAKH: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).kk === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Wolof variant (their lettering is English in Wolof). */
export const EDITORIAL_IMAGES_MISSING_WOLOF: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).wo === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Hausa variant (their lettering is English in Hausa). */
export const EDITORIAL_IMAGES_MISSING_HAUSA: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).ha === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Amharic variant (their lettering is English in Amharic). */
export const EDITORIAL_IMAGES_MISSING_AMHARIC: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).am === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Dutch variant (their lettering is English in Dutch). */
export const EDITORIAL_IMAGES_MISSING_DUTCH: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).nl === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Finnish variant (their lettering is English in Finnish). */
export const EDITORIAL_IMAGES_MISSING_FINNISH: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).fi === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Greek variant (their lettering is English in Greek). */
export const EDITORIAL_IMAGES_MISSING_GREEK: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).el === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Filipino variant (their lettering is English in Filipino). */
export const EDITORIAL_IMAGES_MISSING_FILIPINO: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).fil === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Tamil variant (their lettering is English in Tamil). */
export const EDITORIAL_IMAGES_MISSING_TAMIL: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).ta === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Telugu variant (their lettering is English in Telugu). */
export const EDITORIAL_IMAGES_MISSING_TELUGU: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).te === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Marathi variant (their lettering is English in Marathi). */
export const EDITORIAL_IMAGES_MISSING_MARATHI: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).mr === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Gujarati variant (their lettering is English in Gujarati). */
export const EDITORIAL_IMAGES_MISSING_GUJARATI: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).gu === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Punjabi variant (their lettering is English in Punjabi). */
export const EDITORIAL_IMAGES_MISSING_PUNJABI: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).pa === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Burmese variant (their lettering is English in Burmese). */
export const EDITORIAL_IMAGES_MISSING_BURMESE: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).my === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Khmer variant (their lettering is English in Khmer). */
export const EDITORIAL_IMAGES_MISSING_KHMER: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).km === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Lao variant (their lettering is English in Lao). */
export const EDITORIAL_IMAGES_MISSING_LAO: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).lo === undefined)
  .map(([name]) => name as string);

/** The text-in-image illustrations that still have NO Hindi variant (their lettering is English in Hindi). */
export const EDITORIAL_IMAGES_MISSING_HINDI: readonly string[] = [
  ['cycle-phases-hero', CYCLE_PHASES_HERO],
  ['grossesse_semiane', PREGNANCY_FOLLOW_UP_HERO],
  ['activité_grossesse', PREGNANCY_EXERCISE_HERO],
  ['activité', EXERCISE_HERO],
]
  .filter(([, set]) => (set as LocalizedImageSet).hi === undefined)
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
    en: 'Illustration: a doctor and a pregnant woman during a check-up with an ultrasound. Text: Medical care during pregnancy, for mom\'s health and baby\'s well-being.',
    es: 'Ilustración: una médica y una mujer embarazada durante un control con ecografía. Texto: Control médico durante el embarazo, por la salud de mamá y el bienestar del bebé.',
    tr: 'İlüstrasyon: Ultrason eşliğinde kontrol sırasında bir doktor ve hamile bir kadın. Görseldeki yazı İngilizcedir: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    ru: 'Иллюстрация: врач и беременная женщина на плановом осмотре с УЗИ. Надпись на картинке на английском языке: «Medical care during pregnancy, for mom\'s health and baby\'s well-being.»',
    de: 'Illustration: eine Ärztin und eine Schwangere bei einer Vorsorgeuntersuchung mit Ultraschall. Die Beschriftung im Bild ist auf Englisch: „Medical care during pregnancy, for mom\'s health and baby\'s well-being.“',
    zh: '插图：一位医生与一位孕妇在做超声检查的产检中。图中文字为英文：“Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    id: 'Ilustrasi: seorang dokter dan ibu hamil saat pemeriksaan kehamilan dengan USG. Tulisan pada gambar berbahasa Inggris: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    sq: 'Ilustrim: një mjeke dhe një grua shtatzënë gjatë një kontrolli me ekografi. Teksti në figurë është në anglisht: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    ja: 'イラスト：超音波検査を行う妊婦健診中の医師と妊婦。画像内の文字は英語です：「Medical care during pregnancy, for mom\'s health and baby\'s well-being.」',
    ko: '일러스트: 초음파 검사와 함께 임신 중 검진을 받는 의사와 임산부. 이미지 속 글자는 영어예요: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    'pt-PT': 'Ilustração: uma médica e uma grávida durante uma consulta com ecografia. O texto na imagem está em inglês: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    'pt-BR': 'Ilustração: uma médica e uma gestante durante um exame de ultrassonografia. O texto na imagem está em inglês: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    bn: 'চিত্র: আলট্রাসাউন্ডসহ গর্ভকালীন চেকআপের সময় একজন চিকিৎসক ও একজন গর্ভবতী নারী। ছবির লেখাটি ইংরেজিতে: "Medical care during pregnancy, for mom\'s health and baby\'s well-being."',
    hi: 'चित्र: अल्ट्रासाउंड के साथ जाँच के दौरान एक डॉक्टर और एक गर्भवती महिला। चित्र में लिखा टेक्स्ट अंग्रेज़ी में है: "Medical care during pregnancy, for mom\'s health and baby\'s well-being."',
    it: 'Illustrazione: una dottoressa e una donna incinta durante un controllo con ecografia. Testo: Controlli medici in gravidanza, per la salute della mamma e il benessere del bambino.',
    da: 'Illustration: en læge og en gravid kvinde under en kontrol med ultralyd. Teksten i billedet er på engelsk: "Medical care during pregnancy, for mom\'s health and baby\'s well-being."',
    sv: 'Illustration: en läkare och en gravid kvinna vid en kontroll med ultraljud. Texten i bilden är på engelska: "Medical care during pregnancy, for mom\'s health and baby\'s well-being."',
    nb: 'Illustrasjon: en lege og en gravid kvinne under en kontroll med ultralyd. Teksten i bildet er på engelsk: "Medical care during pregnancy, for mom\'s health and baby\'s well-being."',
    pl: 'Ilustracja: lekarka i kobieta w ciąży podczas badania kontrolnego z USG. Tekst na obrazku jest po angielsku: "Medical care during pregnancy, for mom\'s health and baby\'s well-being."',
    uk: 'Ілюстрація: лікарка та вагітна жінка під час контрольного УЗД. Текст на зображенні англійською: "Medical care during pregnancy, for mom\'s health and baby\'s well-being."',
    cs: 'Ilustrace: lékařka a těhotná žena při kontrolním ultrazvuku. Text na obrázku je anglicky: "Medical care during pregnancy, for mom\'s health and baby\'s well-being."',
    sk: 'Ilustrácia: lekárka a tehotná žena pri kontrolnom ultrazvuku. Text na obrázku je po anglicky: "Medical care during pregnancy, for mom\'s health and baby\'s well-being."',
    hu: 'Illusztráció: orvos és egy várandós nő ultrahang-vizsgálaton. A képen lévő szöveg angol nyelvű: "Medical care during pregnancy, for mom\'s health and baby\'s well-being."',
    ro: 'Ilustrație: un medic și o femeie însărcinată în timpul unei ecografii. Textul din imagine este în engleză: "Medical care during pregnancy, for mom\'s health and baby\'s well-being."',
    bg: 'Илюстрация: лекар и бременна жена по време на ехография. Текстът в изображението е на английски: "Medical care during pregnancy, for mom\'s health and baby\'s well-being."',
    sr: 'Илустрација: лекар и трудница током ултразвука. Текст на слици је на енглеском: "Medical care during pregnancy, for mom\'s health and baby\'s well-being."',
    hr: 'Ilustracija: liječnik i trudnica tijekom ultrazvuka. Tekst na slici je na engleskom: "Medical care during pregnancy, for mom\'s health and baby\'s well-being."',
    bs: 'Ilustracija: ljekar i trudnica tokom ultrazvuka. Tekst na slici je na engleskom: "Medical care during pregnancy, for mom\'s health and baby\'s well-being."',
    sl: 'Ilustracija: zdravnik in nosečnica med ultrazvokom. Besedilo na sliki je v angleščini: "Medical care during pregnancy, for mom\'s health and baby\'s well-being."',
    ne: 'चित्र: अल्ट्रासाउन्डको क्रममा चिकित्सक र गर्भवती महिला। चित्रमा लेखिएको पाठ अङ्ग्रेजीमा छ: "Medical care during pregnancy, for mom\'s health and baby\'s well-being."',
    si: 'රූපය: අල්ට්‍රාසවුන්ඩ් පරීක්ෂාවක් අතරතුර වෛද්‍යවරයකු සහ ගර්භනී කාන්තාවක්. රූපයේ ලියා ඇති පෙළ ඉංග්‍රීසියෙන් ඇත: "Medical care during pregnancy, for mom\'s health and baby\'s well-being."',
    th: 'ภาพ: แพทย์และหญิงตั้งครรภ์ระหว่างการตรวจอัลตราซาวนด์ ข้อความในภาพเป็นภาษาอังกฤษ: "Medical care during pregnancy, for mom\'s health and baby\'s well-being."',
    vi: 'Hình ảnh: bác sĩ và phụ nữ mang thai trong lúc siêu âm. Chữ trong hình bằng tiếng Anh: "Medical care during pregnancy, for mom\'s health and baby\'s well-being."',
    uz: 'Tasvir: shifokor va homilador ayol UZI paytida. Tasvirdagi matn inglizcha: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    az: 'Şəkil: həkim və hamilə qadın ultrasəs müayinəsi zamanı. Şəkildəki mətn ingiliscədir: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    ka: 'სურათი: ექიმი და ორსული ქალი ულტრაბგერითი გამოკვლევის დროს. სურათზე ტექსტი ინგლისურია: „Medical care during pregnancy, for mom\'s health and baby\'s well-being.“',
    hy: 'Նկար. բժիշկը և հղի կինը ուլտրաձայնային հետազոտության ժամանակ: Նկարի վրայի գրությունը անգլերեն է. «Medical care during pregnancy, for mom\'s health and baby\'s well-being»:',
    tg: 'Тасвир. Табиб ва зани ҳомила ҳангоми муоинаи ултрасадо. Навиштаи рӯи тасвир ба забони англисӣ аст: «Medical care during pregnancy, for mom\'s health and baby\'s well-being».',
    ky: 'Сүрөт. Дарыгер жана кош бойлуу аял УЗИ текшерүүсү учурунда. Сүрөттөгү жазуу англис тилинде: «Medical care during pregnancy, for mom\'s health and baby\'s well-being».',
    tk: 'Surat: lukman we göwreli aýal UZI barlagy wagtynda. Suratdaky ýazgy iňlisçe: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    ms: 'Gambar: doktor dan wanita hamil semasa pemeriksaan ultrasound. Tulisan pada gambar dalam bahasa Inggeris: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    so: 'Sawir: dhakhtar iyo naag uur leh inta ultrasaawn la sameynayo. Qoraalka sawirka ku jira waa Ingiriis: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    sw: 'Picha: daktari na mwanamke mjamzito wakati wa uchunguzi wa ultrasound. Maandishi kwenye picha ni ya Kiingereza: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    kk: 'Сурет. Дәрігер мен жүкті әйел УДЗ тексеруі кезінде. Суреттегі жазу ағылшын тілінде: «Medical care during pregnancy, for mom\'s health and baby\'s well-being».',
    wo: 'Nataal. Doktoor ak jigéen ju ëmb ci jamonoy ekografi. Bind bi ci nataal bi ci angale la: «Medical care during pregnancy, for mom\'s health and baby\'s well-being».',
    ha: 'Hoto. Likita da mace mai ciki a lokacin ultrasound. Rubutun da ke cikin hoton da Turanci ne: «Medical care during pregnancy, for mom\'s health and baby\'s well-being».',
    am: 'ምስል፦ ሐኪም እና እርጉዝ ሴት በአልትራሳውንድ ምርመራ ወቅት። በምስሉ ውስጥ ያለው ጽሑፍ እንግሊዝኛ ነው፦ “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    nl: 'Afbeelding. Een arts en een zwangere vrouw tijdens een echo-onderzoek. De tekst in de afbeelding is Engels: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    fi: 'Kuva. Lääkäri ja raskaana oleva nainen ultraäänitutkimuksessa. Kuvan teksti on englantia: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    el: 'Εικόνα. Ένας γιατρός και μια έγκυος γυναίκα σε υπερηχογράφημα. Το κείμενο της εικόνας είναι στα αγγλικά: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    fil: 'Larawan. Isang doktor at isang buntis na babae sa isang ultrasound. Nasa Ingles ang teksto sa larawan: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    ta: 'படம். ஒரு மருத்துவரும் ஒரு கர்ப்பிணிப் பெண்ணும் அல்ட்ராசவுண்டில். படத்தில் உள்ள எழுத்து ஆங்கிலத்தில் உள்ளது: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    te: 'చిత్రం. అల్ట్రాసౌండ్‌లో ఒక వైద్యురాలు, ఒక గర్భిణి. చిత్రంలోని అక్షరాలు ఆంగ్లంలో ఉన్నాయి: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    mr: 'चित्र. सोनोग्राफीमध्ये एक डॉक्टर आणि एक गर्भवती स्त्री. चित्रातील अक्षरे इंग्रजीत आहेत: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    gu: 'ચિત્ર. સોનોગ્રાફીમાં એક ડૉક્ટર અને એક ગર્ભવતી સ્ત્રી. ચિત્રમાંના અક્ષરો અંગ્રેજીમાં છે: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    pa: 'ਤਸਵੀਰ। ਅਲਟਰਾਸਾਊਂਡ ਦੌਰਾਨ ਇੱਕ ਡਾਕਟਰ ਅਤੇ ਇੱਕ ਗਰਭਵਤੀ ਔਰਤ। ਤਸਵੀਰ ਵਿਚਲੇ ਅੱਖਰ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਹਨ: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    my: 'ပုံ။ အယ်ထရာဆောင်းလုပ်နေစဉ် ဆရာဝန်တစ်ဦးနှင့် ကိုယ်ဝန်ဆောင်အမျိုးသမီးတစ်ဦး။ ပုံထဲရှိစာသားများသည် အင်္ဂလိပ်ဘာသာဖြစ်သည် - “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    km: 'រូបភាព៖ វេជ្ជបណ្ឌិតម្នាក់ និងស្ត្រីមានផ្ទៃពោះម្នាក់ កំពុងពិនិត្យដោយអ៊ុលត្រាសោន។ អត្ថបទក្នុងរូបភាពជាភាសាអង់គ្លេស៖ “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
    lo: 'ຮູບປະກອບ: ແພດ ແລະ ຍິງຖືພາຄົນໜຶ່ງ ກຳລັງກວດຮ່າງກາຍດ້ວຍອັນຕຣາຊາວ. ຂໍ້ຄວາມໃນຮູບເປັນພາສາອັງກິດ: “Medical care during pregnancy, for mom\'s health and baby\'s well-being.”',
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
    sq: 'Ilustrim: një grua shtatzënë duke bërë shtrirje në pozicion sulmi (lunge) mbi një tapet joge. Teksti në figurë është në anglisht: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    ja: 'イラスト：ヨガマットの上でランジのストレッチをする妊婦。画像内の文字は英語です：「Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.」',
    ko: '일러스트: 요가 매트 위에서 런지 스트레칭을 하는 임산부. 이미지 속 글자는 영어예요: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    'pt-PT': 'Ilustração: uma grávida a fazer um alongamento em afundo sobre um tapete de ioga. O texto na imagem está em inglês: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    'pt-BR': 'Ilustração: uma gestante fazendo um alongamento em avanço sobre um tapete de ioga. O texto na imagem está em inglês: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    bn: 'চিত্র: যোগব্যায়ামের ম্যাটে লাঞ্জ স্ট্রেচ করছেন একজন গর্ভবতী নারী। ছবির লেখাটি ইংরেজিতে: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    hi: 'चित्र: योगा मैट पर लंज स्ट्रेच करती एक गर्भवती महिला। चित्र में लिखा टेक्स्ट अंग्रेज़ी में है: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    it: 'Illustrazione: una donna incinta in affondo su un tappetino da yoga. Testo: Muoviti per una gravidanza in salute. Quadro: una mamma in salute per un bambino sereno.',
    da: 'Illustration: en gravid kvinde i et fremfald-stræk på en yogamåtte. Teksten i billedet er på engelsk: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    sv: 'Illustration: en gravid kvinna i ett utfallssteg på en yogamatta. Texten i bilden är på engelska: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    nb: 'Illustrasjon: en gravid kvinne i et utfallsstrekk på en yogamatte. Teksten i bildet er på engelsk: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    pl: 'Ilustracja: kobieta w ciąży w wykroku na macie do jogi. Tekst na obrazku jest po angielsku: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    uk: 'Ілюстрація: вагітна жінка у випаді на килимку для йоги. Текст на зображенні англійською: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    cs: 'Ilustrace: těhotná žena v předkroku na podložce na jógu. Text na obrázku je anglicky: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    sk: 'Ilustrácia: tehotná žena v predkroku na podložke na jogu. Text na obrázku je po anglicky: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    hu: 'Illusztráció: várandós nő kitörésben jógaszőnyegen. A képen lévő szöveg angol nyelvű: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    ro: 'Ilustrație: o femeie însărcinată pe un covoraș de yoga, în mișcare. Textul din imagine este în engleză: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    bg: 'Илюстрация: бременна жена върху постелка за йога, в движение. Текстът в изображението е на английски: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    sr: 'Илустрација: трудница на простирци за јогу, у покрету. Текст на слици је на енглеском: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    hr: 'Ilustracija: trudnica na prostirci za jogu, u pokretu. Tekst na slici je na engleskom: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    bs: 'Ilustracija: trudnica na prostirci za jogu, u pokretu. Tekst na slici je na engleskom: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    sl: 'Ilustracija: nosečnica na podlogi za jogo, v gibanju. Besedilo na sliki je v angleščini: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    ne: 'चित्र: योग म्याटमा चलायमान गर्भवती महिला। चित्रमा लेखिएको पाठ अङ्ग्रेजीमा छ: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    si: 'රූපය: යෝගා මැට් එකක් මත ව්‍යායාම කරන ගර්භනී කාන්තාවක්. රූපයේ ලියා ඇති පෙළ ඉංග්‍රීසියෙන් ඇත: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    th: 'ภาพ: หญิงตั้งครรภ์กำลังเคลื่อนไหวบนเสื่อโยคะ ข้อความในภาพเป็นภาษาอังกฤษ: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    vi: 'Hình ảnh: phụ nữ mang thai đang vận động trên thảm yoga. Chữ trong hình bằng tiếng Anh: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    uz: 'Tasvir: homilador ayol yoga gilamchasida mashq qilmoqda. Tasvirdagi matn inglizcha: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    az: 'Şəkil: hamilə qadın yoqa döşəyində məşq edir. Şəkildəki mətn ingiliscədir: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    ka: 'სურათი: ორსული ქალი იოგას ხალიჩაზე ვარჯიშობს. სურათზე ტექსტი ინგლისურია: „Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.“',
    hy: 'Նկար. հղի կինը յոգայի գորգի վրա մարզվում է: Նկարի վրայի գրությունը անգլերեն է. «Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby»:',
    tg: 'Тасвир. Зани ҳомила дар болои гилемчаи йога машқ мекунад. Навиштаи рӯи тасвир ба забони англисӣ аст: «Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby».',
    ky: 'Сүрөт. Кош бойлуу аял йога килемчесинде көнүгүү жасап жатат. Сүрөттөгү жазуу англис тилинде: «Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby».',
    tk: 'Surat: göwreli aýal ýoga düşeginiň üstünde maşk edýär. Suratdaky ýazgy iňlisçe: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    ms: 'Gambar: wanita hamil bersenam di atas tilam yoga. Tulisan pada gambar dalam bahasa Inggeris: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    so: 'Sawir: naag uur leh oo layli ku samaynaysa gogosha yoga. Qoraalka sawirka ku jira waa Ingiriis: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    sw: 'Picha: mwanamke mjamzito akifanya mazoezi kwenye mkeka wa yoga. Maandishi kwenye picha ni ya Kiingereza: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    kk: 'Сурет. Жүкті әйел йога кілемшесінде жаттығу жасап жатыр. Суреттегі жазу ағылшын тілінде: «Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby».',
    wo: 'Nataal. Jigéen ju ëmb di yëngu ci benn tapi yoga. Bind bi ci nataal bi ci angale la: «Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby».',
    ha: 'Hoto. Mace mai ciki tana motsa jiki a kan tabarmar yoga. Rubutun da ke cikin hoton da Turanci ne: «Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby».',
    am: 'ምስል፦ እርጉዝ ሴት በዮጋ ምንጣፍ ላይ እየተለማመደች። በምስሉ ውስጥ ያለው ጽሑፍ እንግሊዝኛ ነው፦ “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    nl: 'Afbeelding. Een zwangere vrouw die oefeningen doet op een yogamat. De tekst in de afbeelding is Engels: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    fi: 'Kuva. Raskaana oleva nainen tekemässä harjoituksia joogamatolla. Kuvan teksti on englantia: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    el: 'Εικόνα. Μια έγκυος γυναίκα που κάνει ασκήσεις σε στρώμα γιόγκα. Το κείμενο της εικόνας είναι στα αγγλικά: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    fil: 'Larawan. Isang buntis na babaeng nag-eehersisyo sa yoga mat. Nasa Ingles ang teksto sa larawan: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    ta: 'படம். யோகா மேட்டில் உடற்பயிற்சி செய்யும் ஒரு கர்ப்பிணிப் பெண். படத்தில் உள்ள எழுத்து ஆங்கிலத்தில் உள்ளது: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    te: 'చిత్రం. యోగా మ్యాట్‌పై వ్యాయామం చేస్తున్న ఒక గర్భిణి. చిత్రంలోని అక్షరాలు ఆంగ్లంలో ఉన్నాయి: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    mr: 'चित्र. योगा मॅटवर व्यायाम करणारी एक गर्भवती स्त्री. चित्रातील अक्षरे इंग्रजीत आहेत: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    gu: 'ચિત્ર. યોગા મેટ પર કસરત કરતી એક ગર્ભવતી સ્ત્રી. ચિત્રમાંના અક્ષરો અંગ્રેજીમાં છે: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    pa: 'ਤਸਵੀਰ। ਯੋਗਾ ਮੈਟ ’ਤੇ ਕਸਰਤ ਕਰਦੀ ਇੱਕ ਗਰਭਵਤੀ ਔਰਤ। ਤਸਵੀਰ ਵਿਚਲੇ ਅੱਖਰ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਹਨ: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    my: 'ပုံ။ ယိုဂါအခင်းပေါ်တွင် လေ့ကျင့်ခန်းလုပ်နေသော ကိုယ်ဝန်ဆောင်အမျိုးသမီးတစ်ဦး။ ပုံထဲရှိစာသားများသည် အင်္ဂလိပ်ဘာသာဖြစ်သည် - “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    km: 'រូបភាព៖ ស្ត្រីមានផ្ទៃពោះម្នាក់ កំពុងលាតសន្ធឹងរាងកាយលើកន្ទេលយ៉ូហ្គា។ អត្ថបទក្នុងរូបភាពជាភាសាអង់គ្លេស៖ “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
    lo: 'ຮູບປະກອບ: ຍິງຖືພາຄົນໜຶ່ງ ກຳລັງຍືດຮ່າງກາຍທ່າກ້າວຍາວເທິງເສື່ອໂຢຄະ. ຂໍ້ຄວາມໃນຮູບເປັນພາສາອັງກິດ: “Move for a healthy pregnancy. Poster: a mom in good health for a thriving baby.”',
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
    sq: 'Ilustrim: një grua duke bërë shtrirje në pozicion sulmi (lunge) mbi një tapet joge. Teksti në figurë është në anglisht: “Move to feel good. Poster: body, balance, energy.”',
    ja: 'イラスト：ヨガマットの上でランジのストレッチをする女性。画像内の文字は英語です：「Move to feel good. Poster: body, balance, energy.」',
    ko: '일러스트: 요가 매트 위에서 런지 스트레칭을 하는 여성. 이미지 속 글자는 영어예요: “Move to feel good. Poster: body, balance, energy.”',
    'pt-PT': 'Ilustração: uma mulher a fazer um alongamento em afundo sobre um tapete de ioga. O texto na imagem está em inglês: “Move to feel good. Poster: body, balance, energy.”',
    'pt-BR': 'Ilustração: uma mulher fazendo um alongamento em avanço sobre um tapete de ioga. O texto na imagem está em inglês: “Move to feel good. Poster: body, balance, energy.”',
    bn: 'চিত্র: যোগব্যায়ামের ম্যাটে লাঞ্জ স্ট্রেচ করছেন একজন নারী। ছবির লেখাটি ইংরেজিতে: “Move to feel good. Poster: body, balance, energy.”',
    hi: 'चित्र: योगा मैट पर लंज स्ट्रेच करती एक महिला। चित्र में लिखा टेक्स्ट अंग्रेज़ी में है: “Move to feel good. Poster: body, balance, energy.”',
    it: 'Illustrazione: una donna in affondo su un tappetino da yoga. Testo: Muoviti per sentirti bene. Quadro: corpo, equilibrio, energia.',
    da: 'Illustration: en kvinde i et fremfald-stræk på en yogamåtte. Teksten i billedet er på engelsk: “Move to feel good. Poster: body, balance, energy.”',
    sv: 'Illustration: en kvinna i ett utfallssteg på en yogamatta. Texten i bilden är på engelska: “Move to feel good. Poster: body, balance, energy.”',
    nb: 'Illustrasjon: en kvinne i et utfallsstrekk på en yogamatte. Teksten i bildet er på engelsk: “Move to feel good. Poster: body, balance, energy.”',
    pl: 'Ilustracja: kobieta w wykroku na macie do jogi. Tekst na obrazku jest po angielsku: “Move to feel good. Poster: body, balance, energy.”',
    uk: 'Ілюстрація: жінка у випаді на килимку для йоги. Текст на зображенні англійською: “Move to feel good. Poster: body, balance, energy.”',
    cs: 'Ilustrace: žena v předkroku na podložce na jógu. Text na obrázku je anglicky: “Move to feel good. Poster: body, balance, energy.”',
    sk: 'Ilustrácia: žena v predkroku na podložke na jogu. Text na obrázku je po anglicky: “Move to feel good. Poster: body, balance, energy.”',
    hu: 'Illusztráció: nő kitörésben jógaszőnyegen. A képen lévő szöveg angol nyelvű: “Move to feel good. Poster: body, balance, energy.”',
    ro: 'Ilustrație: o femeie pe un covoraș de yoga, în mișcare. Textul din imagine este în engleză: “Move to feel good. Poster: body, balance, energy.”',
    bg: 'Илюстрация: жена върху постелка за йога, в движение. Текстът в изображението е на английски: “Move to feel good. Poster: body, balance, energy.”',
    sr: 'Илустрација: жена на простирци за јогу, у покрету. Текст на слици је на енглеском: “Move to feel good. Poster: body, balance, energy.”',
    hr: 'Ilustracija: žena na prostirci za jogu, u pokretu. Tekst na slici je na engleskom: “Move to feel good. Poster: body, balance, energy.”',
    bs: 'Ilustracija: žena na prostirci za jogu, u pokretu. Tekst na slici je na engleskom: “Move to feel good. Poster: body, balance, energy.”',
    sl: 'Ilustracija: ženska na podlogi za jogo, v gibanju. Besedilo na sliki je v angleščini: “Move to feel good. Poster: body, balance, energy.”',
    ne: 'चित्र: योग म्याटमा चलायमान महिला। चित्रमा लेखिएको पाठ अङ्ग्रेजीमा छ: “Move to feel good. Poster: body, balance, energy.”',
    si: 'රූපය: යෝගා මැට් එකක් මත ව්‍යායාම කරන කාන්තාවක්. රූපයේ ලියා ඇති පෙළ ඉංග්‍රීසියෙන් ඇත: “Move to feel good. Poster: body, balance, energy.”',
    th: 'ภาพ: หญิงกำลังเคลื่อนไหวบนเสื่อโยคะ ข้อความในภาพเป็นภาษาอังกฤษ: “Move to feel good. Poster: body, balance, energy.”',
    vi: 'Hình ảnh: người phụ nữ đang vận động trên thảm yoga. Chữ trong hình bằng tiếng Anh: “Move to feel good. Poster: body, balance, energy.”',
    uz: 'Tasvir: ayol yoga gilamchasida mashq qilmoqda. Tasvirdagi matn inglizcha: “Move to feel good. Poster: body, balance, energy.”',
    az: 'Şəkil: qadın yoqa döşəyində məşq edir. Şəkildəki mətn ingiliscədir: “Move to feel good. Poster: body, balance, energy.”',
    ka: 'სურათი: ქალი იოგას ხალიჩაზე ვარჯიშობს. სურათზე ტექსტი ინგლისურია: „Move to feel good. Poster: body, balance, energy.“',
    hy: 'Նկար. կինը յոգայի գորգի վրա մարզվում է: Նկարի վրայի գրությունը անգլերեն է. «Move to feel good. Poster: body, balance, energy»:',
    tg: 'Тасвир. Зан дар болои гилемчаи йога машқ мекунад. Навиштаи рӯи тасвир ба забони англисӣ аст: «Move to feel good. Poster: body, balance, energy».',
    ky: 'Сүрөт. Аял йога килемчесинде көнүгүү жасап жатат. Сүрөттөгү жазуу англис тилинде: «Move to feel good. Poster: body, balance, energy».',
    tk: 'Surat: aýal ýoga düşeginiň üstünde maşk edýär. Suratdaky ýazgy iňlisçe: “Move to feel good. Poster: body, balance, energy.”',
    ms: 'Gambar: wanita bersenam di atas tilam yoga. Tulisan pada gambar dalam bahasa Inggeris: “Move to feel good. Poster: body, balance, energy.”',
    so: 'Sawir: naag layli ku samaynaysa gogosha yoga. Qoraalka sawirka ku jira waa Ingiriis: “Move to feel good. Poster: body, balance, energy.”',
    sw: 'Picha: mwanamke akifanya mazoezi kwenye mkeka wa yoga. Maandishi kwenye picha ni ya Kiingereza: “Move to feel good. Poster: body, balance, energy.”',
    kk: 'Сурет. Әйел йога кілемшесінде жаттығу жасап жатыр. Суреттегі жазу ағылшын тілінде: «Move to feel good. Poster: body, balance, energy».',
    wo: 'Nataal. Jigéen di yëngu ci benn tapi yoga. Bind bi ci nataal bi ci angale la: «Move to feel good. Poster: body, balance, energy».',
    ha: 'Hoto. Mace tana motsa jiki a kan tabarmar yoga. Rubutun da ke cikin hoton da Turanci ne: «Move to feel good. Poster: body, balance, energy».',
    am: 'ምስል፦ ሴት በዮጋ ምንጣፍ ላይ እየተለማመደች። በምስሉ ውስጥ ያለው ጽሑፍ እንግሊዝኛ ነው፦ “Move to feel good. Poster: body, balance, energy.”',
    nl: 'Afbeelding. Een vrouw die oefeningen doet op een yogamat. De tekst in de afbeelding is Engels: “Move to feel good. Poster: body, balance, energy.”',
    fi: 'Kuva. Nainen tekemässä harjoituksia joogamatolla. Kuvan teksti on englantia: “Move to feel good. Poster: body, balance, energy.”',
    el: 'Εικόνα. Μια γυναίκα που κάνει ασκήσεις σε στρώμα γιόγκα. Το κείμενο της εικόνας είναι στα αγγλικά: “Move to feel good. Poster: body, balance, energy.”',
    fil: 'Larawan. Isang babaeng nag-eehersisyo sa yoga mat. Nasa Ingles ang teksto sa larawan: “Move to feel good. Poster: body, balance, energy.”',
    ta: 'படம். யோகா மேட்டில் உடற்பயிற்சி செய்யும் ஒரு பெண். படத்தில் உள்ள எழுத்து ஆங்கிலத்தில் உள்ளது: “Move to feel good. Poster: body, balance, energy.”',
    te: 'చిత్రం. యోగా మ్యాట్‌పై వ్యాయామం చేస్తున్న ఒక మహిళ. చిత్రంలోని అక్షరాలు ఆంగ్లంలో ఉన్నాయి: “Move to feel good. Poster: body, balance, energy.”',
    mr: 'चित्र. योगा मॅटवर व्यायाम करणारी एक स्त्री. चित्रातील अक्षरे इंग्रजीत आहेत: “Move to feel good. Poster: body, balance, energy.”',
    gu: 'ચિત્ર. યોગા મેટ પર કસરત કરતી એક સ્ત્રી. ચિત્રમાંના અક્ષરો અંગ્રેજીમાં છે: “Move to feel good. Poster: body, balance, energy.”',
    pa: 'ਤਸਵੀਰ। ਯੋਗਾ ਮੈਟ ’ਤੇ ਕਸਰਤ ਕਰਦੀ ਇੱਕ ਔਰਤ। ਤਸਵੀਰ ਵਿਚਲੇ ਅੱਖਰ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਹਨ: “Move to feel good. Poster: body, balance, energy.”',
    my: 'ပုံ။ ယိုဂါအခင်းပေါ်တွင် လေ့ကျင့်ခန်းလုပ်နေသော အမျိုးသမီးတစ်ဦး။ ပုံထဲရှိစာသားများသည် အင်္ဂလိပ်ဘာသာဖြစ်သည် - “Move to feel good. Poster: body, balance, energy.”',
    km: 'រូបភាព៖ ស្ត្រីម្នាក់ កំពុងលាតសន្ធឹងរាងកាយលើកន្ទេលយ៉ូហ្គា។ អត្ថបទក្នុងរូបភាពជាភាសាអង់គ្លេស៖ “Move to feel good. Poster: body, balance, energy.”',
    lo: 'ຮູບປະກອບ: ຍິງຄົນໜຶ່ງ ກຳລັງຍືດຮ່າງກາຍທ່າກ້າວຍາວເທິງເສື່ອໂຢຄະ. ຂໍ້ຄວາມໃນຮູບເປັນພາສາອັງກິດ: “Move to feel good. Poster: body, balance, energy.”',
  },
};
