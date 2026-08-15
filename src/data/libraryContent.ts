import type { ComponentProps } from 'react';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';

import type { ObjectiveId } from '../state/onboardingPreferences';
import type { ComputedCyclePhase } from '../utils/cycleMath';

export type IconName = ComponentProps<typeof MaterialDesignIcons>['name'];

export type LibraryTint =
  | 'pink'
  | 'purple'
  | 'green'
  | 'teal'
  | 'gold'
  | 'red'
  | 'blue';

export const LIBRARY_TINTS: Record<LibraryTint, { fg: string; bg: string }> = {
  pink: { fg: '#DC7B82', bg: '#F7D7D6' },
  purple: { fg: '#6D4AE8', bg: '#EEE3FA' },
  green: { fg: '#3E8E56', bg: '#E4F3E7' },
  teal: { fg: '#2C8E93', bg: '#DDF0F1' },
  gold: { fg: '#B7791F', bg: '#FBEFD9' },
  red: { fg: '#C1485A', bg: '#FBE1E5' },
  blue: { fg: '#3E6FBE', bg: '#E4ECFB' },
};

// Every article belongs to exactly one lens. The two must never be blended
// into the same category, chip bar, grid, or recommendation feed — the
// screen keeps two entirely separate browsing surfaces instead.
export type LibraryContentType = 'medical' | 'religious';

export type LibraryCategoryId =
  // Medical
  | 'firstPeriod'
  | 'cycle'
  | 'flow'
  | 'symptoms'
  | 'fertility'
  | 'ovulation'
  | 'pain'
  | 'hydration'
  | 'sleep'
  | 'mood'
  | 'basalTemperature'
  | 'cervicalMucus'
  | 'lhTests'
  | 'nutrition'
  | 'conceptionTips'
  | 'birthControlPills'
  | 'patch'
  | 'ring'
  | 'hormonalTreatments'
  | 'missedPills'
  | 'sideEffects'
  | 'pcos'
  | 'hormones'
  | 'acne'
  | 'weight'
  | 'exercise'
  | 'pregnancyWeekly'
  | 'babyDevelopment'
  | 'medicalExams'
  | 'childbirthPrep'
  | 'postpartumRecovery'
  | 'lochia'
  | 'nifas'
  | 'breastfeeding'
  | 'emotionalHealth'
  | 'physicalRecoveryLoss'
  | 'emotionalRecoveryLoss'
  | 'fertilityAfterLoss'
  | 'menopause'
  | 'hotFlashes'
  | 'bones'
  | 'treatments'
  // Religious — "Cycle & pratique religieuse" only
  | 'fiqhWomen'
  | 'menstruationPurity'
  | 'istihada'
  | 'nifasFiqh'
  | 'ramadan'
  | 'fastingQadaa'
  | 'prayerDuringMenstruation'
  | 'returningToPrayer'
  | 'religiousFaq';

export type LibraryCategory = {
  id: LibraryCategoryId;
  label: string;
  icon: IconName;
  tint: LibraryTint;
  contentType: LibraryContentType;
};

export const MEDICAL_CATEGORIES: LibraryCategory[] = [
  {
    id: 'firstPeriod',
    label: 'Premières règles',
    icon: 'flower-outline',
    tint: 'pink',
    contentType: 'medical',
  },
  {
    id: 'cycle',
    label: 'Comprendre son cycle',
    icon: 'autorenew',
    tint: 'purple',
    contentType: 'medical',
  },
  {
    id: 'flow',
    label: 'Flux menstruel',
    icon: 'water',
    tint: 'pink',
    contentType: 'medical',
  },
  {
    id: 'symptoms',
    label: 'Symptômes',
    icon: 'heart-outline',
    tint: 'pink',
    contentType: 'medical',
  },
  {
    id: 'fertility',
    label: 'Fertilité',
    icon: 'sprout',
    tint: 'green',
    contentType: 'medical',
  },
  {
    id: 'ovulation',
    label: 'Ovulation',
    icon: 'egg-outline',
    tint: 'purple',
    contentType: 'medical',
  },
  {
    id: 'pain',
    label: 'Douleurs',
    icon: 'heart-flash',
    tint: 'red',
    contentType: 'medical',
  },
  {
    id: 'hydration',
    label: 'Hydratation',
    icon: 'cup-water',
    tint: 'teal',
    contentType: 'medical',
  },
  {
    id: 'sleep',
    label: 'Sommeil',
    icon: 'weather-night',
    tint: 'purple',
    contentType: 'medical',
  },
  {
    id: 'mood',
    label: 'Humeur',
    icon: 'emoticon-happy-outline',
    tint: 'gold',
    contentType: 'medical',
  },
  {
    id: 'basalTemperature',
    label: 'Température basale',
    icon: 'thermometer',
    tint: 'gold',
    contentType: 'medical',
  },
  {
    id: 'cervicalMucus',
    label: 'Glaire cervicale',
    icon: 'water-percent',
    tint: 'green',
    contentType: 'medical',
  },
  {
    id: 'lhTests',
    label: 'Tests d’ovulation (LH)',
    icon: 'test-tube',
    tint: 'purple',
    contentType: 'medical',
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    icon: 'food-apple-outline',
    tint: 'green',
    contentType: 'medical',
  },
  {
    id: 'conceptionTips',
    label: 'Conseils conception',
    icon: 'heart-plus-outline',
    tint: 'pink',
    contentType: 'medical',
  },
  {
    id: 'birthControlPills',
    label: 'Pilule contraceptive',
    icon: 'pill',
    tint: 'purple',
    contentType: 'medical',
  },
  {
    id: 'patch',
    label: 'Patch contraceptif',
    icon: 'bandage',
    tint: 'teal',
    contentType: 'medical',
  },
  {
    id: 'ring',
    label: 'Anneau vaginal',
    icon: 'ring',
    tint: 'pink',
    contentType: 'medical',
  },
  {
    id: 'hormonalTreatments',
    label: 'Traitements hormonaux',
    icon: 'sync',
    tint: 'blue',
    contentType: 'medical',
  },
  {
    id: 'missedPills',
    label: 'Oubli de pilule',
    icon: 'calendar-remove-outline',
    tint: 'red',
    contentType: 'medical',
  },
  {
    id: 'sideEffects',
    label: 'Effets secondaires',
    icon: 'alert-circle-outline',
    tint: 'red',
    contentType: 'medical',
  },
  {
    id: 'pcos',
    label: 'SOPK',
    icon: 'snowflake-variant',
    tint: 'teal',
    contentType: 'medical',
  },
  {
    id: 'hormones',
    label: 'Hormones',
    icon: 'atom-variant',
    tint: 'purple',
    contentType: 'medical',
  },
  {
    id: 'acne',
    label: 'Acné hormonale',
    icon: 'spa-outline',
    tint: 'pink',
    contentType: 'medical',
  },
  {
    id: 'weight',
    label: 'Poids',
    icon: 'scale-bathroom',
    tint: 'blue',
    contentType: 'medical',
  },
  {
    id: 'exercise',
    label: 'Exercice',
    icon: 'dumbbell',
    tint: 'green',
    contentType: 'medical',
  },
  {
    id: 'pregnancyWeekly',
    label: 'Grossesse semaine par semaine',
    icon: 'human-pregnant',
    tint: 'purple',
    contentType: 'medical',
  },
  {
    id: 'babyDevelopment',
    label: 'Développement du bébé',
    icon: 'baby-face-outline',
    tint: 'blue',
    contentType: 'medical',
  },
  {
    id: 'medicalExams',
    label: 'Examens médicaux',
    icon: 'stethoscope',
    tint: 'blue',
    contentType: 'medical',
  },
  {
    id: 'childbirthPrep',
    label: 'Préparation à l’accouchement',
    icon: 'baby-carriage',
    tint: 'pink',
    contentType: 'medical',
  },
  {
    id: 'postpartumRecovery',
    label: 'Récupération post-partum',
    icon: 'heart-outline',
    tint: 'blue',
    contentType: 'medical',
  },
  {
    id: 'lochia',
    label: 'Lochies',
    icon: 'water',
    tint: 'pink',
    contentType: 'medical',
  },
  {
    id: 'nifas',
    label: 'Nifas (aspect médical)',
    icon: 'water-off-outline',
    tint: 'gold',
    contentType: 'medical',
  },
  {
    id: 'breastfeeding',
    label: 'Allaitement',
    icon: 'baby-bottle-outline',
    tint: 'pink',
    contentType: 'medical',
  },
  {
    id: 'emotionalHealth',
    label: 'Santé émotionnelle',
    icon: 'brain',
    tint: 'purple',
    contentType: 'medical',
  },
  {
    id: 'physicalRecoveryLoss',
    label: 'Récupération physique',
    icon: 'heart-pulse',
    tint: 'blue',
    contentType: 'medical',
  },
  {
    id: 'emotionalRecoveryLoss',
    label: 'Récupération émotionnelle',
    icon: 'emoticon-outline',
    tint: 'purple',
    contentType: 'medical',
  },
  {
    id: 'fertilityAfterLoss',
    label: 'Retour de la fertilité',
    icon: 'sprout-outline',
    tint: 'green',
    contentType: 'medical',
  },
  {
    id: 'menopause',
    label: 'Ménopause & périménopause',
    icon: 'gender-female',
    tint: 'red',
    contentType: 'medical',
  },
  {
    id: 'hotFlashes',
    label: 'Bouffées de chaleur',
    icon: 'fire',
    tint: 'red',
    contentType: 'medical',
  },
  {
    id: 'bones',
    label: 'Os & ostéoporose',
    icon: 'bone',
    tint: 'blue',
    contentType: 'medical',
  },
  {
    id: 'treatments',
    label: 'Traitements',
    icon: 'medical-bag',
    tint: 'blue',
    contentType: 'medical',
  },
];

// "Cycle & pratique religieuse" — a fully separate, always educational-only
// section. Never filtered by objective, never rendered inside the medical
// chip bar / topic grid, never combined with medical articles in a list.
export const RELIGIOUS_CATEGORIES: LibraryCategory[] = [
  {
    id: 'fiqhWomen',
    label: 'Fiqh féminin',
    icon: 'book-heart-outline',
    tint: 'purple',
    contentType: 'religious',
  },
  {
    id: 'menstruationPurity',
    label: 'Règles & pureté',
    icon: 'shield-check-outline',
    tint: 'gold',
    contentType: 'religious',
  },
  {
    id: 'istihada',
    label: 'Istihâda',
    icon: 'water-alert-outline',
    tint: 'red',
    contentType: 'religious',
  },
  {
    id: 'nifasFiqh',
    label: 'Nifas (fiqh)',
    icon: 'moon-waning-crescent',
    tint: 'gold',
    contentType: 'religious',
  },
  {
    id: 'ramadan',
    label: 'Ramadan',
    icon: 'moon-waxing-crescent',
    tint: 'purple',
    contentType: 'religious',
  },
  {
    id: 'fastingQadaa',
    label: 'Jeûne & Qadaa',
    icon: 'calendar-question-outline',
    tint: 'gold',
    contentType: 'religious',
  },
  {
    id: 'prayerDuringMenstruation',
    label: 'Prière pendant les règles',
    icon: 'hands-pray',
    tint: 'purple',
    contentType: 'religious',
  },
  {
    id: 'returningToPrayer',
    label: 'Retour à la prière',
    icon: 'clipboard-check-outline',
    tint: 'green',
    contentType: 'religious',
  },
  {
    id: 'religiousFaq',
    label: 'Questions fréquentes',
    icon: 'frequently-asked-questions',
    tint: 'blue',
    contentType: 'religious',
  },
];

export const LIBRARY_CATEGORIES: LibraryCategory[] = [
  ...MEDICAL_CATEGORIES,
  ...RELIGIOUS_CATEGORIES,
];

const CATEGORY_BY_ID = new Map(
  LIBRARY_CATEGORIES.map(category => [category.id, category]),
);

export const getCategoryById = (
  id: LibraryCategoryId,
): LibraryCategory | undefined => CATEGORY_BY_ID.get(id);

export const OBJECTIVE_HEADLINES: Record<ObjectiveId, string> = {
  cycle: 'Suivre mon cycle',
  conceive: 'Essayer de concevoir',
  contraception: 'Gérer ma contraception',
  irregular: 'Comprendre mes cycles irréguliers',
  menopause: 'Traverser la ménopause',
  pregnancy: 'Vivre ma grossesse',
  postpartum: 'Récupérer après l’accouchement',
  loss: 'Me reconstruire après une perte',
};

// PCOS ("SOPK") is not yet its own selectable onboarding objective, so its
// dedicated category set is surfaced under "irregular cycles", which it very
// commonly causes — this keeps every objective from the spec covered without
// inventing a new ObjectiveId outside the onboarding flow.
export const OBJECTIVE_CATEGORY_IDS: Record<ObjectiveId, LibraryCategoryId[]> =
  {
    cycle: [
      'firstPeriod',
      'cycle',
      'flow',
      'symptoms',
      'fertility',
      'ovulation',
      'pain',
      'hydration',
      'sleep',
      'mood',
    ],
    conceive: [
      'fertility',
      'ovulation',
      'basalTemperature',
      'cervicalMucus',
      'lhTests',
      'nutrition',
      'conceptionTips',
    ],
    contraception: [
      'birthControlPills',
      'patch',
      'ring',
      'hormonalTreatments',
      'missedPills',
      'sideEffects',
    ],
    irregular: ['pcos', 'hormones', 'acne', 'weight', 'nutrition', 'exercise'],
    pregnancy: [
      'pregnancyWeekly',
      'babyDevelopment',
      'nutrition',
      'medicalExams',
      'childbirthPrep',
    ],
    postpartum: [
      'postpartumRecovery',
      'lochia',
      'breastfeeding',
      'nifas',
      'emotionalHealth',
    ],
    loss: [
      'physicalRecoveryLoss',
      'emotionalRecoveryLoss',
      'fertilityAfterLoss',
    ],
    menopause: [
      'menopause',
      'hormones',
      'hotFlashes',
      'sleep',
      'bones',
      'mood',
      'treatments',
    ],
  };

export function getMedicalCategoriesForObjective(
  objective: ObjectiveId,
): LibraryCategory[] {
  const ids = new Set<LibraryCategoryId>(
    OBJECTIVE_CATEGORY_IDS[objective] ?? [],
  );
  return MEDICAL_CATEGORIES.filter(category => ids.has(category.id));
}

export const RELIGIOUS_DISCLAIMER =
  'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. ' +
  'AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.';

export type ArticleLevel = 'beginner' | 'intermediate' | 'advanced';
export type ArticleType = 'article' | 'guide' | 'faq';

export type LibraryArticle = {
  id: string;
  title: string;
  categoryId: LibraryCategoryId;
  level: ArticleLevel;
  type: ArticleType;
  durationMinutes: number;
  tags: string[];
  isNew?: boolean;
  phases?: ComputedCyclePhase[];
  summary: string;
  content: string[];
};

export const LIBRARY_ARTICLES: LibraryArticle[] = [
  // ---------------------------------------------------------------- cycle
  {
    id: 'cycle-comprendre-ton-cycle',
    title: 'Comprendre ton cycle menstruel',
    categoryId: 'cycle',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 6,
    tags: ['cycle', 'bases', 'hormones'],
    summary: 'Les grandes étapes de ton cycle, expliquées simplement.',
    content: [
      'Ton cycle menstruel dure en moyenne 28 jours, mais tout ce qui va de 21 à 35 jours reste parfaitement normal.',
      'Il se découpe en quatre grandes phases : les règles, la phase folliculaire, l’ovulation, puis la phase lutéale.',
      'Apprendre à reconnaître ces phases t’aide à mieux comprendre ton énergie, ton humeur et tes symptômes au fil du mois.',
    ],
  },
  {
    id: 'cycle-phases-expliquees',
    title: 'Les différentes phases du cycle',
    categoryId: 'cycle',
    level: 'beginner',
    type: 'article',
    durationMinutes: 5,
    tags: ['cycle', 'phases', 'hormones'],
    phases: ['follicular', 'luteal'],
    summary:
      'Œstrogènes, progestérone : ce qui se passe vraiment chaque semaine.',
    content: [
      'Pendant la phase folliculaire, les œstrogènes augmentent progressivement et préparent un nouvel ovule.',
      'À l’ovulation, un pic hormonal libère l’ovule le plus mature vers les trompes.',
      'En phase lutéale, la progestérone domine ; si aucune fécondation n’a lieu, elle chute et déclenche les règles suivantes.',
    ],
  },
  {
    id: 'cycle-signe-vital',
    title: 'Ton cycle, un excellent indicateur de santé',
    categoryId: 'cycle',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 5,
    tags: ['santé', 'bien-être', 'suivi', 'cycle'],
    summary:
      'Pourquoi le cycle est parfois appelé le « cinquième signe vital ».',
    content: [
      'Le cycle menstruel reflète souvent l’équilibre général du corps, au même titre que le pouls ou la tension.',
      'Un cycle régulier, sans douleur excessive, est généralement le signe d’un bon fonctionnement hormonal.',
      'Consulter en cas de changement inhabituel et durable reste le meilleur réflexe de prévention.',
    ],
  },
  // ------------------------------------------------------------ firstPeriod
  {
    id: 'firstperiod-premieres-regles',
    title: 'Tes premières règles : à quoi t’attendre',
    categoryId: 'firstPeriod',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 5,
    tags: ['premières règles', 'puberté'],
    isNew: true,
    summary: 'Ce qui est normal, ce qui rassure, et ce qu’il faut savoir.',
    content: [
      'Les premières règles arrivent le plus souvent entre 10 et 15 ans, environ deux ans après le début de la puberté.',
      'Un cycle irrégulier au début est tout à fait normal, le corps met parfois un an ou deux à trouver son rythme.',
      'Garder toujours une protection avec toi et en parler à une personne de confiance rend cette étape plus sereine.',
    ],
  },
  // -------------------------------------------------------------------- flow
  {
    id: 'flow-comprendre-flux',
    title: 'Comprendre ton flux menstruel',
    categoryId: 'flow',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 7,
    tags: ['flux', 'règles'],
    phases: ['menstruation'],
    summary: 'Flux léger, moyen ou abondant : que signifient ces variations.',
    content: [
      'Un flux menstruel normal représente entre 30 et 80 ml de sang perdu sur l’ensemble des règles.',
      'Il est souvent plus abondant les deux premiers jours, puis diminue progressivement.',
      'Un flux très abondant qui nécessite de changer de protection chaque heure mérite d’être signalé à un médecin.',
    ],
  },
  {
    id: 'flow-hygiene-intime',
    title: 'Bien vivre son hygiène intime pendant les règles',
    categoryId: 'flow',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 6,
    tags: ['hygiène', 'flux', 'protections'],
    phases: ['menstruation'],
    summary:
      'Des gestes simples pour rester à l’aise tout en respectant ton corps.',
    content: [
      'La zone intime s’auto-nettoie grâce à sa propre flore, un lavage doux à l’eau claire suffit la plupart du temps.',
      'Change régulièrement tes protections (toutes les 4 à 6 heures) et privilégie des sous-vêtements en coton.',
      'Évite les produits parfumés ou les douches internes, qui perturbent l’équilibre naturel du pH.',
    ],
  },
  // --------------------------------------------------------------- symptoms
  {
    id: 'symptoms-reconnaitre',
    title: 'Reconnaître les symptômes de ton cycle',
    categoryId: 'symptoms',
    level: 'beginner',
    type: 'article',
    durationMinutes: 4,
    tags: ['symptômes', 'sein', 'ballonnements'],
    phases: ['luteal'],
    summary: 'Seins sensibles, ballonnements, fatigue : d’où ça vient.',
    content: [
      'La plupart des symptômes prémenstruels apparaissent en phase lutéale, sous l’effet de la chute de progestérone.',
      'Tension mammaire, ballonnements, fatigue ou irritabilité sont fréquents et généralement bénins.',
      'Les noter chaque mois dans ton journal t’aide à distinguer ce qui est habituel de ce qui mériterait un avis médical.',
    ],
  },
  // -------------------------------------------------------------- fertility
  {
    id: 'fertility-fenetre-fertile',
    title: 'La fenêtre fertile, comment ça marche',
    categoryId: 'fertility',
    level: 'beginner',
    type: 'article',
    durationMinutes: 5,
    tags: ['fertilité', 'ovulation', 'conception'],
    phases: ['fertile'],
    summary: 'Pourquoi les 6 jours autour de l’ovulation comptent le plus.',
    content: [
      'Les spermatozoïdes peuvent survivre jusqu’à 5 jours dans les voies génitales, ce qui élargit la fenêtre de conception possible.',
      'L’ovule, lui, ne reste fécondable qu’environ 24 heures après sa libération.',
      'C’est pourquoi les rapports dans les jours précédant l’ovulation offrent les meilleures chances de conception.',
    ],
  },
  // -------------------------------------------------------------- ovulation
  {
    id: 'ovulation-comprendre-ovulation',
    title: 'Comprendre l’ovulation',
    categoryId: 'ovulation',
    level: 'beginner',
    type: 'article',
    durationMinutes: 5,
    tags: ['ovulation', 'fertilité'],
    phases: ['fertile', 'ovulation'],
    summary: 'Le moment clé de ton cycle, et comment le repérer.',
    content: [
      'L’ovulation survient environ 14 jours avant les règles suivantes, quelle que soit la durée totale du cycle.',
      'La glaire cervicale devient plus claire et élastique à l’approche de ce jour fertile.',
      'Une légère douleur d’un côté du bas-ventre (« mittelschmerz ») accompagne parfois la libération de l’ovule.',
    ],
  },
  // ------------------------------------------------------------------- pain
  {
    id: 'pain-gerer-douleurs',
    title: 'Gérer les douleurs menstruelles',
    categoryId: 'pain',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 7,
    tags: ['douleurs', 'crampes', 'confort'],
    phases: ['menstruation'],
    summary:
      'Chaleur, mouvement doux, alimentation : des gestes qui soulagent vraiment.',
    content: [
      'Les crampes viennent des contractions utérines qui aident à évacuer la muqueuse ; elles sont dues aux prostaglandines.',
      'Une bouillotte, un bain chaud ou un massage du bas-ventre peuvent réduire l’intensité de la douleur.',
      'Si les douleurs t’empêchent de vivre normalement chaque mois, il est important d’en parler à un professionnel de santé.',
    ],
  },
  // -------------------------------------------------------------- hydration
  {
    id: 'hydration-bien-shydrater',
    title: 'Bien s’hydrater pendant le cycle',
    categoryId: 'hydration',
    level: 'beginner',
    type: 'article',
    durationMinutes: 3,
    tags: ['hydratation', 'ballonnements'],
    phases: ['menstruation', 'luteal'],
    summary:
      'Pourquoi boire plus d’eau réduit les ballonnements prémenstruels.',
    content: [
      'Contre-intuitif mais vrai : bien s’hydrater aide le corps à moins retenir d’eau et réduit les ballonnements.',
      'Vise environ 1,5 à 2 litres par jour, un peu plus pendant les règles pour compenser les pertes.',
      'Les tisanes de gingembre ou de camomille apportent aussi une hydratation apaisante en période de crampes.',
    ],
  },
  // ----------------------------------------------------------------- sleep
  {
    id: 'sleep-sommeil-et-cycle',
    title: 'Sommeil et hormones : le lien méconnu',
    categoryId: 'sleep',
    level: 'beginner',
    type: 'article',
    durationMinutes: 4,
    tags: ['sommeil', 'ménopause', 'cycle'],
    phases: ['luteal', 'menstruation'],
    summary:
      'Pourquoi ton sommeil varie selon la phase du cycle, et à la ménopause.',
    content: [
      'La progestérone a un léger effet sédatif ; sa baisse en fin de cycle peut perturber le sommeil.',
      'À la ménopause, les bouffées de chaleur nocturnes sont une cause fréquente de réveils.',
      'Une routine du coucher stable et une chambre fraîche aident à limiter ces perturbations, à tout âge.',
    ],
  },
  // ------------------------------------------------------------------ mood
  {
    id: 'mood-humeur-et-hormones',
    title: 'Humeur et fluctuations hormonales',
    categoryId: 'mood',
    level: 'beginner',
    type: 'article',
    durationMinutes: 4,
    tags: ['humeur', 'cycle', 'ménopause'],
    phases: ['luteal'],
    summary: 'Pourquoi ton moral varie au fil du cycle et de la vie.',
    content: [
      'Les variations d’œstrogènes et de progestérone influencent directement les neurotransmetteurs liés à l’humeur.',
      'L’irritabilité prémenstruelle ou les sautes d’humeur ménopausiques ont donc une explication biologique réelle.',
      'Sommeil, activité physique et soutien social restent les meilleurs alliés pour stabiliser l’humeur.',
    ],
  },
  // ------------------------------------------------------- basalTemperature
  {
    id: 'basaltemp-suivre-temperature',
    title: 'Suivre sa température basale',
    categoryId: 'basalTemperature',
    level: 'intermediate',
    type: 'guide',
    durationMinutes: 6,
    tags: ['température', 'ovulation', 'conception'],
    summary: 'Une méthode simple pour confirmer que l’ovulation a eu lieu.',
    content: [
      'La température basale augmente légèrement (0,2 à 0,5 °C) juste après l’ovulation, sous l’effet de la progestérone.',
      'Elle se mesure chaque matin, avant de se lever, toujours à la même heure et avec le même thermomètre.',
      'Ce n’est pas une méthode prédictive mais confirmative : elle t’aide à mieux connaître ton propre cycle.',
    ],
  },
  // ----------------------------------------------------------- cervicalMucus
  {
    id: 'cervicalmucus-observer-glaire',
    title: 'Observer sa glaire cervicale',
    categoryId: 'cervicalMucus',
    level: 'intermediate',
    type: 'guide',
    durationMinutes: 5,
    tags: ['glaire cervicale', 'fertilité', 'ovulation'],
    isNew: true,
    phases: ['fertile'],
    summary: 'Un signal naturel et gratuit pour repérer ta période fertile.',
    content: [
      'La glaire cervicale change de texture au fil du cycle sous l’effet des œstrogènes et de la progestérone.',
      'À l’approche de l’ovulation, elle devient claire, filante et élastique, semblable à du blanc d’œuf.',
      'Observer ce changement chaque jour, en complément d’autres signes, aide à mieux cerner ta fenêtre fertile.',
    ],
  },
  // ---------------------------------------------------------------- lhTests
  {
    id: 'lhtests-comprendre-tests-ovulation',
    title: 'Comprendre les tests d’ovulation (LH)',
    categoryId: 'lhTests',
    level: 'intermediate',
    type: 'guide',
    durationMinutes: 5,
    tags: ['LH', 'tests d’ovulation', 'fertilité'],
    isNew: true,
    summary: 'Comment fonctionnent ces bandelettes et quand les utiliser.',
    content: [
      'Les tests d’ovulation détectent le pic de l’hormone LH, qui déclenche la libération de l’ovule 24 à 36 heures après.',
      'Il est conseillé de commencer les tests quelques jours avant la date d’ovulation estimée par ton cycle.',
      'Un résultat positif signale le moment le plus fertile pour les rapports dans les 1 à 2 jours qui suivent.',
    ],
  },
  // -------------------------------------------------------------- nutrition
  {
    id: 'nutrition-conception-fertilite',
    title: 'Nutrition et fertilité',
    categoryId: 'nutrition',
    level: 'intermediate',
    type: 'guide',
    durationMinutes: 6,
    tags: ['nutrition', 'fertilité', 'conception', 'SOPK', 'grossesse'],
    summary:
      'Les nutriments qui soutiennent un cycle fertile et une grossesse en santé.',
    content: [
      'L’acide folique, le fer et les oméga-3 jouent un rôle reconnu dans la préparation à la conception et pendant la grossesse.',
      'Privilégier les légumes verts, les légumineuses et les bonnes graisses soutient l’équilibre hormonal.',
      'Limiter le sucre raffiné et l’alcool contribue aussi à un cycle plus régulier et à une meilleure sensibilité à l’insuline.',
    ],
  },
  // ---------------------------------------------------------- conceptionTips
  {
    id: 'conceptiontips-essayer-de-concevoir',
    title: 'Essayer de concevoir : par où commencer',
    categoryId: 'conceptionTips',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 6,
    tags: ['conception', 'fertilité', 'couple'],
    summary: 'Les repères essentiels pour démarrer sereinement.',
    content: [
      'Identifier ta fenêtre fertile grâce à ton cycle est la première étape la plus utile.',
      'Des rapports réguliers tous les 2 à 3 jours couvrent naturellement la période la plus fertile.',
      'La majorité des couples conçoivent dans les 12 mois ; il est conseillé de consulter au-delà si besoin.',
    ],
  },
  {
    id: 'conceptiontips-comprendre-nidation',
    title: 'Comprendre la nidation',
    categoryId: 'conceptionTips',
    level: 'intermediate',
    type: 'article',
    durationMinutes: 5,
    tags: ['nidation', 'conception', 'grossesse précoce'],
    summary: 'Ce qui se passe entre la fécondation et le test positif.',
    content: [
      'Après la fécondation, l’œuf met 6 à 10 jours pour atteindre l’utérus et s’y implanter.',
      'De légers saignements ou tiraillements légers peuvent parfois accompagner la nidation, sans que ce soit systématique.',
      'C’est seulement après l’implantation que l’hormone hCG commence à être produite et devient détectable par un test.',
    ],
  },
  {
    id: 'conceptiontips-hygiene-de-vie',
    title: 'Mode de vie et parcours de conception',
    categoryId: 'conceptionTips',
    level: 'beginner',
    type: 'article',
    durationMinutes: 4,
    tags: ['mode de vie', 'stress', 'conception'],
    summary: 'Sommeil, stress et activité physique : l’équilibre qui aide.',
    content: [
      'Un sommeil régulier et suffisant soutient la production hormonale nécessaire à un cycle fertile.',
      'Le stress chronique peut perturber l’ovulation ; des pratiques comme la respiration ou la marche aident à le réguler.',
      'Une activité physique modérée est bénéfique, mais l’excès d’entraînement intense peut au contraire freiner la fertilité.',
    ],
  },
  // ----------------------------------------------------------- birthControlPills
  {
    id: 'birthcontrolpills-comprendre-la-pilule',
    title: 'Comprendre la pilule contraceptive',
    categoryId: 'birthControlPills',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 6,
    tags: ['pilule', 'contraception hormonale'],
    isNew: true,
    summary:
      'Comment agit la pilule, et les points clés à connaître avant de la choisir.',
    content: [
      'La pilule contient des hormones (œstrogènes et/ou progestatif) qui empêchent l’ovulation et épaississent la glaire cervicale.',
      'Elle se prend chaque jour, idéalement à la même heure, pour garantir une efficacité optimale.',
      'Un suivi médical régulier permet d’ajuster le dosage ou le type de pilule selon ta tolérance.',
    ],
  },
  // ------------------------------------------------------------------- patch
  {
    id: 'patch-le-patch-contraceptif',
    title: 'Le patch contraceptif',
    categoryId: 'patch',
    level: 'beginner',
    type: 'article',
    durationMinutes: 4,
    tags: ['patch', 'contraception hormonale'],
    isNew: true,
    summary: 'Une alternative hebdomadaire à la pilule quotidienne.',
    content: [
      'Le patch diffuse en continu des hormones à travers la peau et se change une fois par semaine, trois semaines sur quatre.',
      'Il offre la même efficacité qu’une pilule bien suivie, avec l’avantage de ne pas dépendre d’une prise quotidienne.',
      'Une légère irritation cutanée est possible à l’endroit de la pose ; changer de zone à chaque application aide à la prévenir.',
    ],
  },
  // -------------------------------------------------------------------- ring
  {
    id: 'ring-anneau-vaginal',
    title: 'L’anneau vaginal contraceptif',
    categoryId: 'ring',
    level: 'beginner',
    type: 'article',
    durationMinutes: 4,
    tags: ['anneau vaginal', 'contraception hormonale'],
    isNew: true,
    summary: 'Un anneau souple, posé pour trois semaines.',
    content: [
      'L’anneau libère en continu de faibles doses d’hormones directement au niveau vaginal.',
      'Il se place soi-même, reste en continu pendant trois semaines, puis est retiré pour une semaine de pause.',
      'Sa position exacte dans le vagin n’a pas besoin d’être précise pour être efficace, ce qui le rend simple à utiliser.',
    ],
  },
  // ----------------------------------------------------------- hormonalTreatments
  {
    id: 'hormonaltreatments-panorama',
    title: 'Panorama des traitements hormonaux contraceptifs',
    categoryId: 'hormonalTreatments',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 6,
    tags: ['contraception', 'hormones', 'méthodes'],
    summary:
      'Pilule, patch, anneau, implant, stérilet hormonal : ce qui les distingue.',
    content: [
      'Toutes ces méthodes agissent en empêchant l’ovulation ou en épaississant la glaire cervicale, à des dosages et fréquences différents.',
      'L’implant et le stérilet hormonal offrent une protection de plusieurs années sans geste quotidien ni hebdomadaire.',
      'Le choix dépend surtout de ta tolérance aux hormones, de ton mode de vie et de tes projets de grossesse à venir.',
    ],
  },
  {
    id: 'hormonaltreatments-choisir-sa-methode',
    title: 'Choisir le traitement qui te convient',
    categoryId: 'hormonalTreatments',
    level: 'intermediate',
    type: 'faq',
    durationMinutes: 5,
    tags: ['contraception', 'choix', 'hormones'],
    summary: 'Les questions à te poser avant de choisir.',
    content: [
      'Ton mode de vie, ta tolérance aux hormones et ton projet de grossesse à venir orientent le choix le plus adapté.',
      'Aucune méthode n’est universellement « meilleure » : celle qui te convient est celle que tu peux suivre sereinement.',
      'Un échange avec une sage-femme ou un médecin permet d’ajuster ce choix à ta situation personnelle.',
    ],
  },
  // ------------------------------------------------------------------ missedPills
  {
    id: 'missedpills-que-faire-en-cas-doubli',
    title: 'Oubli de pilule : que faire ?',
    categoryId: 'missedPills',
    level: 'intermediate',
    type: 'faq',
    durationMinutes: 4,
    tags: ['oubli de pilule', 'contraception'],
    isNew: true,
    summary: 'La conduite à tenir dépend surtout du délai depuis l’oubli.',
    content: [
      'En général, un oubli de moins de 12 heures ne réduit pas l’efficacité : prends le comprimé dès que tu t’en rends compte.',
      'Au-delà de 12 heures, une contraception de secours ou un moyen complémentaire (préservatif) peut être nécessaire selon la notice.',
      'La notice de ta plaquette reste la référence exacte à suivre ; en cas de doute, une pharmacienne ou un médecin peut te conseiller rapidement.',
    ],
  },
  // ----------------------------------------------------------------- sideEffects
  {
    id: 'sideeffects-reconnaitre-les-effets-secondaires',
    title: 'Reconnaître les effets secondaires possibles',
    categoryId: 'sideEffects',
    level: 'intermediate',
    type: 'article',
    durationMinutes: 5,
    tags: ['effets secondaires', 'contraception', 'hormones'],
    isNew: true,
    summary: 'Ce qui est courant et bénin, et ce qui doit alerter.',
    content: [
      'Nausées légères, sensibilité des seins ou petits saignements sont fréquents dans les premiers mois d’un nouveau moyen de contraception.',
      'Ces effets s’estompent généralement après 2 à 3 cycles, le temps que le corps s’adapte.',
      'Des douleurs thoraciques, des maux de tête violents inhabituels ou un gonflement d’une jambe nécessitent une consultation rapide.',
    ],
  },
  // --------------------------------------------------------------------- pcos
  {
    id: 'pcos-comprendre-sopk',
    title: 'Comprendre le SOPK',
    categoryId: 'pcos',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 6,
    tags: ['SOPK', 'cycle irrégulier', 'hormones'],
    isNew: true,
    summary: 'Le syndrome des ovaires polykystiques, en clair.',
    content: [
      'Le SOPK touche environ 1 femme sur 10 et se caractérise par un déséquilibre hormonal androgénique.',
      'Cycles irréguliers, acné et pilosité accrue en sont des signes fréquents, à des degrés très variables.',
      'Un diagnostic repose sur plusieurs critères combinés (échographie, bilan hormonal, symptômes) et jamais un seul signe isolé.',
    ],
  },
  // ----------------------------------------------------------------- hormones
  {
    id: 'hormones-comprendre-tes-hormones',
    title: 'Comprendre tes hormones du cycle',
    categoryId: 'hormones',
    level: 'intermediate',
    type: 'article',
    durationMinutes: 5,
    tags: ['hormones', 'cycle', 'SOPK'],
    summary: 'Œstrogènes, progestérone, LH, FSH : qui fait quoi.',
    content: [
      'La FSH stimule la maturation des follicules ovariens en tout début de cycle.',
      'Le pic de LH déclenche l’ovulation environ 36 heures après son apparition.',
      'Un déséquilibre durable entre ces hormones peut expliquer des cycles irréguliers ou anovulatoires.',
    ],
  },
  {
    id: 'hormones-menopause-equilibre',
    title: 'Les hormones pendant la ménopause',
    categoryId: 'hormones',
    level: 'intermediate',
    type: 'article',
    durationMinutes: 5,
    tags: ['ménopause', 'hormones', 'œstrogènes'],
    summary: 'La baisse d’œstrogènes et ses effets sur le corps.',
    content: [
      'La chute progressive des œstrogènes explique la plupart des symptômes de la ménopause.',
      'Elle influence aussi la santé osseuse, cardiovasculaire et la qualité du sommeil.',
      'Des traitements hormonaux existent et peuvent être discutés avec un médecin selon ton profil.',
    ],
  },
  {
    id: 'hormones-equilibre-apres-une-perte',
    title: 'Retrouver un équilibre hormonal après une perte',
    categoryId: 'hormones',
    level: 'intermediate',
    type: 'article',
    durationMinutes: 5,
    tags: ['fausse couche', 'hormones'],
    summary:
      'Ce que le corps traverse pour revenir à l’équilibre après une fausse couche.',
    content: [
      'Le taux d’hCG met plusieurs semaines à redescendre complètement après une fausse couche.',
      'Ce retour progressif explique certains symptômes hormonaux persistants pendant quelques semaines.',
      'Un dosage sanguin peut confirmer que les hormones sont revenues à un niveau normal si besoin.',
    ],
  },
  {
    id: 'hormones-resistance-insuline',
    title: 'Résistance à l’insuline et cycle',
    categoryId: 'hormones',
    level: 'advanced',
    type: 'article',
    durationMinutes: 6,
    tags: ['insuline', 'SOPK', 'nutrition'],
    summary:
      'Le lien souvent méconnu entre glycémie et hormones, notamment en cas de SOPK.',
    content: [
      'Une résistance à l’insuline pousse le corps à en produire davantage, ce qui stimule la production d’androgènes.',
      'Cela peut aggraver certains symptômes du SOPK comme l’acné ou les cycles irréguliers.',
      'Réduire les sucres rapides et privilégier des repas riches en fibres aide à stabiliser la glycémie.',
    ],
  },
  // -------------------------------------------------------------------- acne
  {
    id: 'acne-acne-hormonale',
    title: 'Comprendre l’acné hormonale',
    categoryId: 'acne',
    level: 'beginner',
    type: 'article',
    durationMinutes: 4,
    tags: ['acné', 'SOPK', 'hormones'],
    isNew: true,
    summary:
      'Pourquoi elle apparaît souvent sur le bas du visage et la mâchoire.',
    content: [
      'Un excès relatif d’androgènes, fréquent en cas de SOPK ou avant les règles, stimule la production de sébum.',
      'L’acné hormonale touche typiquement le bas du visage, la mâchoire et le cou.',
      'Une routine de soin douce, sans sur-nettoyage, associée si besoin à un avis dermatologique, donne les meilleurs résultats.',
    ],
  },
  // ------------------------------------------------------------------ weight
  {
    id: 'weight-poids-et-cycle',
    title: 'Poids et régularité du cycle',
    categoryId: 'weight',
    level: 'intermediate',
    type: 'article',
    durationMinutes: 4,
    tags: ['poids', 'SOPK', 'cycle'],
    summary: 'Pourquoi le poids influence la fréquence de tes cycles.',
    content: [
      'Le tissu adipeux joue un rôle actif dans la production d’hormones, ce qui relie poids et cycle.',
      'Une perte de poids modérée (5 à 10 %) peut suffire à régulariser des cycles liés au SOPK.',
      'L’objectif reste l’équilibre global plutôt qu’un chiffre précis sur la balance.',
    ],
  },
  // ---------------------------------------------------------------- exercise
  {
    id: 'exercise-bouger-pour-le-cycle',
    title: 'Bouger pour soutenir ton cycle',
    categoryId: 'exercise',
    level: 'beginner',
    type: 'article',
    durationMinutes: 4,
    tags: ['exercice', 'SOPK', 'insuline'],
    summary: 'Le type d’activité qui aide vraiment en cas de SOPK.',
    content: [
      'L’exercice régulier améliore la sensibilité à l’insuline, un facteur clé dans la gestion du SOPK.',
      'Une activité modérée mais régulière (marche rapide, renforcement) est souvent plus bénéfique qu’un entraînement intense ponctuel.',
      'Trouver une activité plaisante augmente considérablement les chances de la maintenir dans la durée.',
    ],
  },
  {
    id: 'exercise-bouger-enceinte',
    title: 'Bouger pendant la grossesse',
    categoryId: 'exercise',
    level: 'beginner',
    type: 'article',
    durationMinutes: 4,
    tags: ['grossesse', 'activité physique'],
    summary: 'Quels mouvements restent sûrs et bénéfiques.',
    content: [
      'La marche, la natation et le yoga prénatal sont généralement recommandés tout au long de la grossesse.',
      'Éviter les sports à impact ou à risque de chute, surtout à partir du deuxième trimestre.',
      'Toujours écouter les signaux de ton corps et en parler à ta sage-femme ou ton médecin.',
    ],
  },
  {
    id: 'exercise-renforcer-perinee',
    title: 'Renforcer son périnée après l’accouchement',
    categoryId: 'exercise',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 5,
    tags: ['périnée', 'rééducation', 'post-partum'],
    summary: 'Pourquoi la rééducation périnéale est essentielle.',
    content: [
      'La grossesse et l’accouchement sollicitent fortement les muscles du plancher pelvien.',
      'Des exercices de respiration et de contraction douce peuvent commencer dès les premières semaines, avec l’accord d’un professionnel.',
      'Une rééducation encadrée par une sage-femme ou un kinésithérapeute prévient les fuites urinaires à long terme.',
    ],
  },
  // ----------------------------------------------------------- pregnancyWeekly
  {
    id: 'pregnancy-semaine-par-semaine',
    title: 'Ta grossesse, semaine par semaine',
    categoryId: 'pregnancyWeekly',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 7,
    tags: ['grossesse', 'suivi'],
    isNew: true,
    summary: 'Les grandes étapes du premier au troisième trimestre.',
    content: [
      'Le premier trimestre pose les fondations : tous les organes principaux du bébé se forment progressivement.',
      'Le deuxième trimestre est souvent le plus confortable, avec l’apparition des premiers mouvements.',
      'Le troisième trimestre prépare le corps à l’accouchement, avec une prise de poids et une fatigue plus marquées.',
    ],
  },
  // --------------------------------------------------------- babyDevelopment
  {
    id: 'babydevelopment-developpement-bebe',
    title: 'Le développement du bébé in utero',
    categoryId: 'babyDevelopment',
    level: 'beginner',
    type: 'article',
    durationMinutes: 5,
    tags: ['grossesse', 'bébé', 'développement'],
    summary: 'Comment ton bébé grandit, trimestre après trimestre.',
    content: [
      'Dès la 6e semaine, un cœur minuscule commence déjà à battre.',
      'Vers la 20e semaine, tu peux généralement ressentir les premiers mouvements du bébé.',
      'À partir du 3e trimestre, le bébé prend rapidement du poids et se positionne pour la naissance.',
    ],
  },
  // ------------------------------------------------------------- medicalExams
  {
    id: 'medicalexams-suivi-medical',
    title: 'Le calendrier des examens de grossesse',
    categoryId: 'medicalExams',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 5,
    tags: ['grossesse', 'examens', 'suivi médical'],
    summary: 'Échographies et bilans essentiels, trimestre par trimestre.',
    content: [
      'Trois échographies principales rythment généralement la grossesse, une par trimestre.',
      'Des prises de sang régulières surveillent le taux de fer, le diabète gestationnel et d’autres marqueurs clés.',
      'Ne pas hésiter à noter tes questions avant chaque rendez-vous pour ne rien oublier sur le moment.',
    ],
  },
  // -------------------------------------------------------------- childbirthPrep
  {
    id: 'childbirthprep-preparer-accouchement',
    title: 'Se préparer sereinement à l’accouchement',
    categoryId: 'childbirthPrep',
    level: 'intermediate',
    type: 'guide',
    durationMinutes: 7,
    tags: ['accouchement', 'préparation'],
    summary: 'Respiration, positions et sac de maternité : l’essentiel.',
    content: [
      'Les cours de préparation à la naissance t’aident à comprendre les étapes du travail et les techniques de respiration.',
      'Préparer ton sac de maternité dès le 8e mois t’évite le stress de dernière minute.',
      'Rédiger un projet de naissance simple t’aide à exprimer tes souhaits à l’équipe médicale.',
    ],
  },
  // ---------------------------------------------------------- postpartumRecovery
  {
    id: 'postpartum-recuperation-globale',
    title: 'La récupération après l’accouchement',
    categoryId: 'postpartumRecovery',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 6,
    tags: ['post-partum', 'récupération'],
    summary: 'Ton corps a besoin de temps : ce qui est normal.',
    content: [
      'La période post-partum, ou « quarantaine », dure traditionnellement environ 40 jours de récupération intense.',
      'Fatigue, saignements et fluctuations hormonales font partie d’un processus normal de guérison.',
      'S’entourer et accepter de l’aide n’est pas un luxe, c’est une nécessité pour bien récupérer.',
    ],
  },
  {
    id: 'postpartum-retour-de-couches',
    title: 'Le retour de couches, à quoi s’attendre',
    categoryId: 'postpartumRecovery',
    level: 'beginner',
    type: 'article',
    durationMinutes: 4,
    tags: ['retour de couches', 'post-partum', 'cycle'],
    summary: 'Quand tes règles reviennent-elles après l’accouchement.',
    content: [
      'Sans allaitement, les règles reviennent en général 6 à 8 semaines après l’accouchement.',
      'En cas d’allaitement exclusif, le retour peut être retardé de plusieurs mois selon la fréquence des tétées.',
      'Les premiers cycles peuvent être irréguliers ou plus abondants avant de retrouver leur rythme habituel.',
    ],
  },
  // ------------------------------------------------------------------ lochia
  {
    id: 'lochia-comprendre-lochies',
    title: 'Comprendre les lochies après la naissance',
    categoryId: 'lochia',
    level: 'beginner',
    type: 'article',
    durationMinutes: 4,
    tags: ['lochies', 'post-partum', 'saignements'],
    summary: 'Ces saignements post-accouchement, et leur évolution normale.',
    content: [
      'Les lochies sont des pertes vaginales qui évacuent progressivement la muqueuse utérine après l’accouchement.',
      'Elles sont d’abord rouge vif, puis s’éclaircissent en rosé, puis en blanc-jaunâtre sur 2 à 6 semaines.',
      'Une odeur forte, de la fièvre ou un flux qui redevient soudainement abondant doivent être signalés rapidement.',
    ],
  },
  // -------------------------------------------------------------------- nifas
  {
    id: 'nifas-aspects-medicaux',
    title: 'Le nifas : aspects médicaux',
    categoryId: 'nifas',
    level: 'beginner',
    type: 'article',
    durationMinutes: 5,
    tags: ['nifas', 'post-partum', 'saignements'],
    summary:
      'Ce que ce terme désigne sur le plan physiologique, et comment en prendre soin.',
    content: [
      'Sur le plan médical, les lochies désignent les pertes post-accouchement. Le nifas relève d’un cadre religieux distinct, même si les observations médicales peuvent servir de contexte éducatif.',
      'Ces saignements diminuent progressivement sur plusieurs semaines à mesure que l’utérus retrouve sa taille normale.',
      'Une bonne hygiène, du repos et une hydratation suffisante favorisent une récupération confortable.',
    ],
  },
  // ------------------------------------------------------------- breastfeeding
  {
    id: 'breastfeeding-debuter-allaitement',
    title: 'Débuter l’allaitement en confiance',
    categoryId: 'breastfeeding',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 6,
    tags: ['allaitement', 'bébé'],
    summary: 'Mise en place, rythme et signaux à observer les premiers jours.',
    content: [
      'Une mise au sein précoce, dans l’heure suivant la naissance, favorise le démarrage de la lactation.',
      'Les nouveau-nés tètent souvent 8 à 12 fois par 24h, ce qui est parfaitement normal.',
      'Une bonne prise du sein est la clé pour éviter les douleurs ; une sage-femme ou consultante en lactation peut t’accompagner.',
    ],
  },
  // -------------------------------------------------------------- emotionalHealth
  {
    id: 'emotionalhealth-baby-blues',
    title: 'Baby blues et santé émotionnelle post-partum',
    categoryId: 'emotionalHealth',
    level: 'beginner',
    type: 'article',
    durationMinutes: 5,
    tags: ['santé émotionnelle', 'baby blues', 'post-partum'],
    summary:
      'Différencier le baby blues passager d’une dépression post-partum.',
    content: [
      'Le baby blues touche jusqu’à 80 % des jeunes mères, avec des pleurs et une hypersensibilité entre le 3e et le 5e jour.',
      'Il disparaît généralement en une à deux semaines sans traitement spécifique.',
      'S’il persiste au-delà de deux semaines ou s’intensifie, il est important de consulter : une dépression post-partum se soigne bien.',
    ],
  },
  // --------------------------------------------------------- physicalRecoveryLoss
  {
    id: 'lossphysical-recuperation-physique',
    title: 'La récupération physique après une fausse couche',
    categoryId: 'physicalRecoveryLoss',
    level: 'beginner',
    type: 'article',
    durationMinutes: 5,
    tags: ['fausse couche', 'récupération'],
    summary: 'Saignements, cycle et retour à la normale.',
    content: [
      'Le corps met généralement quelques semaines à retrouver un équilibre hormonal après une fausse couche.',
      'Un cycle peut revenir dès 4 à 6 semaines, mais chaque parcours est différent.',
      'Un suivi médical de contrôle permet de vérifier que tout est rentré dans l’ordre en toute sérénité.',
    ],
  },
  // -------------------------------------------------------- emotionalRecoveryLoss
  {
    id: 'lossemotional-traverser-le-deuil',
    title: 'Traverser le deuil émotionnellement',
    categoryId: 'emotionalRecoveryLoss',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 6,
    tags: ['fausse couche', 'deuil', 'soutien'],
    summary: 'Il n’y a pas de bonne façon de vivre cette épreuve.',
    content: [
      'La tristesse, la colère ou le sentiment de vide sont des réactions normales face à cette perte.',
      'Parler à un proche, un groupe de soutien ou un professionnel peut alléger ce poids.',
      'S’accorder du temps, sans pression ni comparaison, fait partie intégrante de la guérison.',
    ],
  },
  // ------------------------------------------------------------ fertilityAfterLoss
  {
    id: 'lossfertility-fertilite-apres-perte',
    title: 'Fertilité et nouvel essai après une perte',
    categoryId: 'fertilityAfterLoss',
    level: 'intermediate',
    type: 'guide',
    durationMinutes: 5,
    tags: ['fausse couche', 'fertilité', 'nouvel essai'],
    summary: 'Quand et comment envisager un nouveau projet.',
    content: [
      'La fertilité revient généralement dès le cycle suivant une fausse couche précoce.',
      'De nombreux professionnels considèrent qu’il n’y a pas besoin d’attendre plusieurs cycles avant un nouvel essai, sauf avis contraire.',
      'Se sentir prête, physiquement et émotionnellement, reste le repère le plus important.',
    ],
  },
  // --------------------------------------------------------------- menopause
  {
    id: 'menopause-comprendre-la-transition',
    title: 'Comprendre la transition ménopausique',
    categoryId: 'menopause',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 6,
    tags: ['ménopause', 'périménopause'],
    summary:
      'Ce qui change progressivement, des années avant l’arrêt des règles.',
    content: [
      'La périménopause peut débuter plusieurs années avant la ménopause, avec des cycles de plus en plus irréguliers.',
      'La ménopause est confirmée après 12 mois consécutifs sans règles.',
      'Chaque femme vit cette transition différemment ; en parler ouvertement aide à mieux l’anticiper.',
    ],
  },
  // -------------------------------------------------------------- hotFlashes
  {
    id: 'hotflashes-bouffees-de-chaleur',
    title: 'Apprivoiser les bouffées de chaleur',
    categoryId: 'hotFlashes',
    level: 'beginner',
    type: 'article',
    durationMinutes: 4,
    tags: ['bouffées de chaleur', 'ménopause'],
    summary: 'Pourquoi elles surviennent et comment les atténuer.',
    content: [
      'Les bouffées de chaleur touchent jusqu’à 80 % des femmes pendant la transition ménopausique.',
      'Elles seraient liées à un dérèglement du centre de régulation de la température, sensible à la baisse d’œstrogènes.',
      'Vêtements en couches, caféine limitée et respiration lente peuvent en réduire la fréquence.',
    ],
  },
  // ------------------------------------------------------------------- bones
  {
    id: 'bones-sante-osseuse',
    title: 'Prendre soin de sa santé osseuse',
    categoryId: 'bones',
    level: 'intermediate',
    type: 'guide',
    durationMinutes: 5,
    tags: ['ostéoporose', 'ménopause', 'calcium'],
    summary: 'Pourquoi la ménopause augmente le risque d’ostéoporose.',
    content: [
      'Les œstrogènes protègent naturellement la densité osseuse ; leur baisse accélère la perte osseuse après la ménopause.',
      'Le calcium, la vitamine D et les exercices porteurs de poids aident à ralentir cette perte.',
      'Un dépistage par ostéodensitométrie peut être proposé selon ton âge et tes facteurs de risque.',
    ],
  },
  // -------------------------------------------------------------- treatments
  {
    id: 'treatments-traitements-menopause',
    title: 'Les traitements de la ménopause',
    categoryId: 'treatments',
    level: 'intermediate',
    type: 'guide',
    durationMinutes: 6,
    tags: ['ménopause', 'traitements', 'hormones'],
    isNew: true,
    summary: 'Traitement hormonal et alternatives non hormonales, en bref.',
    content: [
      'Le traitement hormonal de la ménopause (THM) compense la baisse d’œstrogènes et soulage les symptômes les plus gênants.',
      'Il n’est pas adapté à toutes les situations ; un bilan médical permet d’évaluer les bénéfices et les précautions nécessaires.',
      'Des options non hormonales (phytothérapie encadrée, thérapies comportementales, ajustements du mode de vie) existent aussi selon les besoins.',
    ],
  },

  // ================================================================
  // RELIGIOUS — "Cycle & pratique religieuse" (educational only)
  // ================================================================
  {
    id: 'fiqhwomen-introduction',
    title: 'Le fiqh féminin, une introduction',
    categoryId: 'fiqhWomen',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 5,
    tags: ['fiqh', 'femme', 'introduction'],
    summary: 'Un aperçu des grands sujets abordés dans cette section.',
    content: [
      'Le fiqh féminin regroupe les règles pratiques qui concernent spécifiquement le corps et le culte des femmes : pureté rituelle, règles, nifas, jeûne et prière.',
      'Ces règles varient parfois selon les écoles juridiques (madhahib) ; connaître celle que tu suis habituellement facilite la compréhension.',
      'Cette section propose des repères généraux et éducatifs pour t’aider à t’orienter, sans jamais remplacer l’avis d’un savant qualifié.',
    ],
  },
  {
    id: 'menstruationpurity-statut-de-purete',
    title: 'Statut de pureté : les bases',
    categoryId: 'menstruationPurity',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 5,
    tags: ['pureté', 'règles', 'ghusl'],
    summary: 'Comprendre le lien entre cycle et état de pureté rituelle.',
    content: [
      'Dans la tradition islamique, la période des règles place la femme dans un état dispensé de certains actes d’adoration.',
      'Le retour à l’état de pureté rituelle passe par le ghusl (grande ablution), une fois les règles terminées.',
      'En cas de doute sur la fin des règles, observer l’absence totale de saignement avant d’effectuer le ghusl est le repère le plus communément suivi.',
    ],
  },
  {
    id: 'istihada-comprendre-les-saignements',
    title: 'Comprendre l’Istihâda',
    categoryId: 'istihada',
    level: 'intermediate',
    type: 'faq',
    durationMinutes: 5,
    tags: ['istihâda', 'fiqh', 'saignements'],
    summary: 'Distinguer un saignement irrégulier des règles habituelles.',
    content: [
      'L’Istihâda désigne un saignement irrégulier, hors du cycle habituel, qui n’a pas le même statut que les règles.',
      'Dans ce cas, la prière et le jeûne restent obligatoires, avec des précautions d’hygiène adaptées selon les avis des savants.',
      'Se référer à la durée habituelle de tes propres règles aide à distinguer les deux situations, mais un avis qualifié reste recommandé au moindre doute.',
    ],
  },
  {
  id: 'nifasfiqh-repere-fiqh',
  title: 'Le nifas en pratique religieuse',
  categoryId: 'nifasFiqh',
  level: 'beginner',
  type: 'faq',
  durationMinutes: 6,
  tags: [
    'nifas',
    'fiqh',
    'post-partum',
    'prière',
    'jeûne',
    'pureté',
  ],
  summary:
    'Comprendre le nifas, sa durée, la prière, le jeûne et la reprise des adorations après l’accouchement.',
  content: [
    'Le nifas désigne, dans la pratique religieuse, la période liée aux saignements suivant l’accouchement.',

    'Les références concernant sa durée maximale peuvent varier selon les écoles juridiques. Une référence fréquemment retenue est de 40 jours, sans qu’AWA ne présente ce chiffre comme une vérité unique.',

    'Pendant la période reconnue comme nifas selon la référence suivie, la prière rituelle est suspendue.',

    'Le jeûne obligatoire n’est pas accompli pendant la période de nifas ; les jours concernés peuvent ensuite être organisés dans le cadre du rattrapage selon la référence suivie.',

    'Lorsque le nifas prend fin, la purification rituelle marque la reprise des actes d’adoration concernés selon la référence juridique retenue.',

    'AWA fournit uniquement des repères éducatifs généraux. En cas de doute sur une situation personnelle, l’avis d’un savant qualifié ou d’une organisation religieuse reconnue doit être privilégié.',
  ],
},
  {
    id: 'ramadan-jeune-et-regles',
    title: 'Le jeûne pendant le Ramadan',
    categoryId: 'ramadan',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 4,
    tags: ['ramadan', 'jeûne', 'règles'],
    isNew: true,
    summary:
      'Conseils pratiques pour vivre le mois de Ramadan en période de règles.',
    content: [
      'Pendant les règles, le jeûne n’est pas requis et les jours seront rattrapés après le Ramadan.',
      'Certaines profitent de ces jours pour se reposer davantage et se recentrer autrement sur la spiritualité du mois.',
      'Noter les jours de règles pendant le mois facilite ensuite le calcul du nombre de jours à rattraper (qadaa).',
    ],
  },
  {
    id: 'fastingqadaa-dispense-et-rattrapage',
    title: 'Jeûne et dispense : le rattrapage (Qadaa)',
    categoryId: 'fastingQadaa',
    level: 'beginner',
    type: 'faq',
    durationMinutes: 4,
    tags: ['qadaa', 'jeûne', 'rattrapage'],
    summary: 'Comment et quand rattraper les jours de jeûne manqués.',
    content: [
      'Les jours de jeûne manqués pour cause de règles se rattrapent hors période de Ramadan, sans urgence particulière.',
      'Il est courant de les rattraper avant le Ramadan suivant, dès que ta situation le permet.',
      'La grossesse et l’allaitement peuvent aussi donner lieu à une dispense, à discuter selon ta situation avec un savant de confiance.',
    ],
  },
  {
    id: 'prayerduringmenstruation-la-priere-suspendue',
    title: 'La prière pendant les règles',
    categoryId: 'prayerDuringMenstruation',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 4,
    tags: ['prière', 'règles', 'dispense'],
    summary: 'Pourquoi la prière rituelle est suspendue durant cette période.',
    content: [
      'Pendant les règles, la prière rituelle (salat) est suspendue, selon l’avis majoritaire des écoles juridiques.',
      'Contrairement au jeûne, les prières manquées pendant les règles ne sont pas rattrapées après.',
      'D’autres formes d’adoration (invocations, mémorisation, écoute) restent généralement accessibles pendant cette période, selon l’avis suivi.',
    ],
  },
  {
    id: 'returningtoprayer-le-ghusl-et-le-retour',
    title: 'Le ghusl et le retour à la prière',
    categoryId: 'returningToPrayer',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 4,
    tags: ['ghusl', 'prière', 'retour'],
    summary: 'Les étapes générales pour reprendre la prière après les règles.',
    content: [
      'Une fois les règles terminées, le ghusl (grande ablution) permet de retrouver l’état de pureté rituelle nécessaire à la prière.',
      'Le ghusl suit généralement une méthode précise (intention, lavage complet du corps) qui peut varier légèrement selon l’école suivie.',
      'Après le ghusl, les prières reprennent normalement, sans qu’il soit nécessaire de rattraper celles manquées pendant les règles.',
    ],
  },
  {
    id: 'religiousfaq-questions-frequentes',
    title: 'Questions fréquentes de fiqh féminin',
    categoryId: 'religiousFaq',
    level: 'beginner',
    type: 'faq',
    durationMinutes: 5,
    tags: ['fiqh', 'questions fréquentes'],
    summary: 'Les interrogations les plus posées, réunies en un endroit.',
    content: [
      'De nombreuses questions autour du cycle, de la prière et du jeûne reviennent régulièrement d’une femme à l’autre.',
      'Les positions peuvent légèrement varier selon les écoles juridiques ; se référer à celle que tu suis habituellement est recommandé.',
      'En cas de doute persistant, demander l’avis d’un savant de confiance reste la meilleure option.',
    ],
  },
  {
    id: 'religiousfaq-reperes-apres-une-perte',
    title: 'Repères spirituels après une perte',
    categoryId: 'religiousFaq',
    level: 'beginner',
    type: 'faq',
    durationMinutes: 5,
    tags: ['fausse couche', 'spiritualité', 'fiqh'],
    summary: 'Ce que la tradition évoque au sujet du deuil périnatal.',
    content: [
      'La perte d’une grossesse, même précoce, est reconnue comme une épreuve légitime dans la tradition islamique.',
      'Selon l’avancement de la grossesse, différents avis existent sur le statut à considérer ; un savant local peut t’orienter au cas par cas.',
      'La patience (sabr) et l’espoir en la miséricorde divine sont des piliers souvent rappelés dans ce contexte.',
    ],
  },
];

export const getArticleById = (id: string): LibraryArticle | undefined =>
  LIBRARY_ARTICLES.find(article => article.id === id);
