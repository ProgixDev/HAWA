import type {ImageSourcePropType} from 'react-native';

import type {LibraryCategoryId} from './libraryContent';
import type {LibraryGroupId} from './libraryObjectiveConfig';

// Article covers, one per browse group (src/assets/images/cover).
const COVER: Record<LibraryGroupId | 'spiritual' | 'pregnancyWeekly' | 'pregnancyMove' | 'babyDev' | 'pregnancyExams' | 'childbirth' | 'cycleUnderstand' | 'cyclePhases' | 'cycleFlow' | 'cyclePain' | 'spm' | 'cycleIndicator' | 'firstPeriod1' | 'pp1' | 'pp2' | 'pp3' | 'pp4' | 'pp5' | 'cycleHygiene' | 'cycleColors' | 'fp2' | 'fp3' | 'fp4' | 'fp5' | 'fp6' | 'fp7' | 'fertile1' | 'ovulation' | 'cycleHydration' | 'cycleMood', ImageSourcePropType> = {
  firstPeriod: require('../assets/images/cover/premieres-regles.png'),
  cycle: require('../assets/images/cover/cycle-menstruel.png'),
  fertility: require('../assets/images/cover/fertilite.png'),
  contraception: require('../assets/images/cover/contraception.png'),
  pregnancy: require('../assets/images/cover/grossesse.png'),
  pregnancyWeekly: require('../assets/images/cover/grossesse_semaine.png'),
  pregnancyMove: require('../assets/images/cover/grossesse_bouger.png'),
  babyDev: require('../assets/images/cover/grossesse_dev.png'),
  pregnancyExams: require('../assets/images/cover/grossesse_calndrier.png'),
  childbirth: require('../assets/images/cover/grossesse_acc.png'),
  cycleUnderstand: require('../assets/images/cover/cycle_menstruel.png'),
  cyclePhases: require('../assets/images/cover/cycle-phase.png'),
  cycleFlow: require('../assets/images/cover/cycle-flux.png'),
  cyclePain: require('../assets/images/cover/cycle-douleur.png'),
  spm: require('../assets/images/cover/SPM.png'),
  cycleIndicator: require('../assets/images/cover/cycle_indicateur.png'),
  firstPeriod1: require('../assets/images/cover/premieres-regles1.png'),
  pp1: require('../assets/images/cover/post-partum1.png'),
  pp2: require('../assets/images/cover/post-partum2.png'),
  pp3: require('../assets/images/cover/post-partum3.png'),
  pp4: require('../assets/images/cover/post-partum4.png'),
  pp5: require('../assets/images/cover/post-partum5.png'),
  cycleHygiene: require('../assets/images/cover/cycle-hygiene.png'),
  cycleColors: require('../assets/images/cover/cycle-couleur.png'),
  fp2: require('../assets/images/cover/premieres-regles2.png'),
  fp3: require('../assets/images/cover/premieres-regles3.png'),
  fp4: require('../assets/images/cover/premieres-regles4.png'),
  fp5: require('../assets/images/cover/premieres-regles5.png'),
  fp6: require('../assets/images/cover/premieres-regles6.png'),
  fp7: require('../assets/images/cover/premieres-regles7.png'),
  fertile1: require('../assets/images/cover/fertilite1.png'),
  ovulation: require('../assets/images/cover/ovulation.png'),
  cycleHydration: require('../assets/images/cover/cycle-hydrater.png'),
  cycleMood: require('../assets/images/cover/cycle-humeur.png'),
  postpartum: require('../assets/images/cover/post-partum.png'),
  loss: require('../assets/images/cover/apres-fausse-couche.png'),
  pcos: require('../assets/images/cover/sopk.png'),
  menopause: require('../assets/images/cover/menopause.png'),
  spiritual: require('../assets/images/cover/cycle-religieux.png'),
};

/** Cover of a browse group. */
export const getGroupCover = (groupId: LibraryGroupId | 'spiritual'): ImageSourcePropType => COVER[groupId];

// Articles with a cover of their own, ahead of their category's group cover.
const ARTICLE_COVER: Record<string, ImageSourcePropType> = {
  'pregnancy-semaine-par-semaine': COVER.pregnancyWeekly,
  'exercise-bouger-enceinte': COVER.pregnancyMove,
  'babydevelopment-developpement-bebe': COVER.babyDev,
  'medicalexams-suivi-medical': COVER.pregnancyExams,
  'childbirthprep-preparer-accouchement': COVER.childbirth,
  'cycle-comprendre-ton-cycle': COVER.cycleUnderstand,
  'cycle-phases-expliquees': COVER.cyclePhases,
  'flow-comprendre-flux': COVER.cycleFlow,
  'pain-gerer-douleurs': COVER.cyclePain,
  'symptoms-reconnaitre': COVER.spm,
  'cycle-signe-vital': COVER.cycleIndicator,
  'firstperiod-premieres-regles': COVER.firstPeriod1,
  'lochia-comprendre-lochies': COVER.pp1,
  'postpartum-retour-de-couches': COVER.pp2,
  'postpartum-recuperation-globale': COVER.pp3,
  'breastfeeding-debuter-allaitement': COVER.pp4,
  'emotionalhealth-baby-blues': COVER.pp5,
  'flow-hygiene-intime': COVER.cycleHygiene,
  'flow-colors-textures': COVER.cycleColors,
  'firstperiod-premiers-signes': COVER.fp2,
  'firstperiod-comment-savoir': COVER.fp3,
  'firstperiod-choisir-protection': COVER.fp4,
  'firstperiod-gerer-quotidien': COVER.fp5,
  'firstperiod-cycle-irregulier': COVER.fp6,
  'firstperiod-questions-frequentes': COVER.fp7,
  'fertility-fenetre-fertile': COVER.fertile1,
  'ovulation-comprendre-ovulation': COVER.ovulation,
  'hydration-bien-shydrater': COVER.cycleHydration,
  'mood-humeur-et-hormones': COVER.cycleMood,
};

// Cover of an article: its own cover when it has one, else the one of the browse group its category belongs to (the same grouping as the
// Library screen's category tiles).
export const getArticleThumbnail = (categoryId: LibraryCategoryId, articleId?: string): ImageSourcePropType => {
  if (articleId && ARTICLE_COVER[articleId]) {
    return ARTICLE_COVER[articleId];
  }
  switch (categoryId) {
    case 'firstPeriod':
      return COVER.firstPeriod;

    case 'cycle':
    case 'flow':
    case 'symptoms':
    case 'pain':
    case 'hydration':
    case 'sleep':
    case 'mood':
      return COVER.cycle;

    case 'fertility':
    case 'ovulation':
    case 'conceptionTips':
    case 'basalTemperature':
    case 'cervicalMucus':
    case 'lhTests':
    case 'nutrition':
      return COVER.fertility;

    case 'birthControlPills':
    case 'patch':
    case 'ring':
    case 'hormonalTreatments':
    case 'missedPills':
    case 'sideEffects':
      return COVER.contraception;

    case 'pregnancyWeekly':
    case 'babyDevelopment':
    case 'medicalExams':
    case 'childbirthPrep':
      return COVER.pregnancy;

    case 'postpartumRecovery':
    case 'lochia':
    case 'nifas':
    case 'breastfeeding':
    case 'emotionalHealth':
      return COVER.postpartum;

    case 'physicalRecoveryLoss':
    case 'emotionalRecoveryLoss':
    case 'fertilityAfterLoss':
      return COVER.loss;

    case 'pcos':
    case 'hormones':
    case 'acne':
    case 'weight':
    case 'exercise':
      return COVER.pcos;

    case 'menopause':
    case 'hotFlashes':
    case 'bones':
    case 'treatments':
      return COVER.menopause;

    case 'fiqhWomen':
    case 'menstruationPurity':
    case 'istihada':
    case 'nifasFiqh':
    case 'ramadan':
    case 'fastingQadaa':
    case 'prayerDuringMenstruation':
    case 'returningToPrayer':
    case 'religiousFaq':
      return COVER.spiritual;

    default:
      return COVER.cycle;
  }
};
