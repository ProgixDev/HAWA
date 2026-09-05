import type {ImageSourcePropType} from 'react-native';

// ============================================================
// CENTRALIZED WEEK-BY-WEEK PREGNANCY REFERENCE DATA
// ============================================================
//
// The ONE place general, educational, week-by-week fetal/maternal
// reference content lives. PregnancyDashboard's "Ton bébé" card and
// PregnancyWeekScreen both read this file via getPregnancyWeekData(week),
// so they can never disagree and this content is never duplicated.
//
// This is NOT user-specific medical data. Every value below is a general
// population-level reference figure (never the user's own ultrasound
// measurement) and is phrased accordingly ("environ", "moyen(ne)").
//
// SOURCE REGISTRY
// ----------------------------------------------------------------
// NHS_S4L   — NHS Start4Life, "Your pregnancy week by week"
//             (nhs.uk/start4life/pregnancy/week-by-week) — fetal length and
//             the fruit/vegetable size comparison for weeks 4–40 were
//             verified directly against this source (fetched per-week) and
//             then paraphrased below; the comparisons reuse NHS's own
//             published mapping rather than an invented one.
// OB_DATING — Standard obstetric last-menstrual-period (LMP) dating
//             convention (the same convention already implemented in
//             computePregnancyStatus, consistent with NHS/ACOG patient
//             guidance): gestation is counted from the first day of the
//             last period, so weeks 1–2 predate ovulation/fertilization.
//
// MEASUREMENT CONSISTENCY NOTE (see task requirement on not silently
// mixing measurement systems): NHS measures the fetus head-to-bottom
// (crown-rump) through week 19, then switches to head-to-heel from week 20
// onward once the legs can be seen extended — this produces a real, one-time
// jump in the published length figures at week 20, not an error. The week
// 20 entry's description says so explicitly rather than hiding it.
// `weight` is intentionally left undefined for every week: the verified
// source above does not publish a specific gram figure per week, and no
// number is fabricated here to fill that gap.
// `comparison` is intentionally omitted for weeks 1–3 and 41 (no fetus/no
// published figure yet) and for weeks 4–5 uses NHS's own "poppy seed" /
// "sesame seed" wording rather than a fruit, matching what NHS itself says
// at that stage.
// ============================================================

export type PregnancyWeekData = {
  week: number;
  /** Decorative fetal/pregnancy illustration for this week. Never claim it is
   * an exact medical visualization of the user's own pregnancy. */
  babyImage?: ImageSourcePropType;
  /** General educational description of fetal development at this week. */
  babyDescription?: string;
  /** General/average reference length (e.g. "Environ 5,4 cm") — a
   * population reference, never the user's own measured value. */
  length?: string;
  /** General/average reference weight. Left undefined project-wide — see
   * source registry note above. */
  weight?: string;
  /** General size comparison, reused from the verified source above. */
  comparison?: string;
  /** General, possible maternal body changes at this stage — phrased as
   * possibilities, never as claims about what this specific user feels.
   * The user's own real symptoms belong to the Pregnancy Journal. */
  bodyChanges?: string[];
  /** General "did you know" / educational, non-diagnostic facts. */
  toKnow?: string[];
  /** Internal source traceability — never rendered in the UI. */
  sourceRefs?: string[];
};

const PREGNANCY_WEEK_DATA: readonly PregnancyWeekData[] = [
  // ---------------------------------------------------------- weeks 1–3
  // No embryo/fetus exists yet to describe — see OB_DATING note above.
  {
    week: 1,
    babyImage: require('../assets/images/pregnancy/development/week-01.png'),
    babyDescription:
      'La grossesse est datée à partir du premier jour de tes dernières règles, par convention médicale. À ce stade, la fécondation n’a généralement pas encore eu lieu.',
    bodyChanges: [
      'Cette période précède généralement la conception ; il n’y a habituellement pas encore de changement physique lié à la grossesse.',
    ],
    toKnow: [
      'Compter la grossesse depuis les dernières règles permet d’estimer une date prévue d’accouchement de façon standardisée, même si la conception survient un peu plus tard.',
      'Il est courant de ne remarquer aucun changement à ce stade.',
    ],
    sourceRefs: ['OB_DATING'],
  },
  {
    week: 2,
    babyImage: require('../assets/images/pregnancy/development/week-02.png'),
    babyDescription:
      'L’ovulation et une éventuelle fécondation surviennent généralement autour de cette période, selon la durée du cycle de chacune.',
    bodyChanges: [
      'Le moment de l’ovulation peut varier selon la durée du cycle, ce qui influence la date réelle possible de conception.',
      'Il n’y a généralement pas encore de changement physique spécifique à la grossesse à ce stade.',
    ],
    toKnow: ['Le moment exact de l’ovulation varie d’une personne à l’autre, ce qui explique pourquoi cette période reste une estimation.'],
    sourceRefs: ['OB_DATING'],
  },
  {
    week: 3,
    babyImage: require('../assets/images/pregnancy/development/week-03.png'),
    babyDescription:
      'Si une fécondation a eu lieu, l’œuf commence à se diviser et à migrer vers l’utérus, mais rien n’est encore détectable par un test de grossesse.',
    bodyChanges: [
      'Cette semaine se situe encore dans la période de datation médicale entourant la conception ; aucun signe physique n’est généralement perceptible à ce stade.',
    ],
    toKnow: ['La plupart des tests de grossesse urinaires deviennent fiables à partir de la semaine suivante environ, une fois l’implantation amorcée.'],
    sourceRefs: ['OB_DATING'],
  },

  // ---------------------------------------------------------- weeks 4–7 (embryo)
  {
    week: 4,
    babyImage: require('../assets/images/pregnancy/development/week-04.png'),
    babyDescription:
      'L’embryon vient de s’implanter dans la paroi de l’utérus. Le sac amniotique et le sac vitellin, qui le nourrira au tout début, se mettent en place.',
    length: 'Environ 2 mm',
    comparison: 'Graine de pavot',
    bodyChanges: [
      'Certaines personnes ne remarquent encore aucun signe à ce stade très précoce.',
      'Un test de grossesse urinaire peut généralement détecter la grossesse à partir de cette semaine.',
    ],
    toKnow: ['C’est le moment habituel où un test de grossesse peut commencer à donner un résultat positif.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 5,
    babyImage: require('../assets/images/pregnancy/development/week-05.png'),
    babyDescription:
      'Le système nerveux commence à se former et le cœur, encore minuscule, s’apprête à battre pour la première fois.',
    length: 'Environ 2 mm',
    comparison: 'Graine de sésame',
    bodyChanges: ['Une fatigue inhabituelle, des nausées légères ou une sensibilité de la poitrine peuvent apparaître.'],
    toKnow: ['C’est le moment recommandé pour prendre rendez-vous avec un professionnel de santé afin de démarrer le suivi de grossesse.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 6,
    babyImage: require('../assets/images/pregnancy/development/week-06.png'),
    babyDescription:
      'Les ébauches des bras et des jambes apparaissent, ainsi que de petites indentations là où les oreilles se formeront. Le cœur peut parfois déjà être détecté par échographie.',
    length: 'Environ 6 mm',
    comparison: 'Petit pois',
    bodyChanges: ['Les nausées et la fatigue peuvent s’intensifier chez certaines personnes durant cette période.'],
    toKnow: ['Une activité cardiaque peut parfois être visible dès cette semaine lors d’une échographie précoce.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 7,
    babyImage: require('../assets/images/pregnancy/development/week-07.png'),
    babyDescription:
      'Le cerveau se développe plus vite que le reste du corps, donnant un front proéminent. De petites ébauches de mains commencent à apparaître au bout des bras.',
    length: 'Environ 10 mm',
    comparison: 'Grain de raisin',
    bodyChanges: ['Des envies alimentaires particulières ou, au contraire, des aversions pour certains aliments sont possibles.'],
    toKnow: ['Le tube neural, à l’origine du cerveau et de la moelle épinière, poursuit sa fermeture durant ces semaines.'],
    sourceRefs: ['NHS_S4L'],
  },

  // ---------------------------------------------------------- weeks 8–13 (first trimester, fetus)
  {
    week: 8,
    babyImage: require('../assets/images/pregnancy/development/week-08.png'),
    babyDescription:
      'L’embryon est désormais appelé fœtus. Les bras s’allongent, la tête commence à se redresser légèrement et le placenta poursuit sa formation.',
    length: 'Environ 16 mm',
    comparison: 'Framboise',
    bodyChanges: ['La sensibilité aux odeurs et les nausées matinales sont fréquentes à ce stade, sans être systématiques.'],
    toKnow: ['La première échographie de datation est généralement programmée entre la semaine 8 et la semaine 14.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 9,
    babyImage: require('../assets/images/pregnancy/development/week-09.png'),
    babyDescription:
      'Les traits du visage se précisent, les paupières protègent les yeux, et les mains et les pieds se dessinent avec les futurs doigts et orteils.',
    length: 'Environ 22 mm',
    comparison: 'Fraise',
    bodyChanges: ['Une fatigue marquée et des nausées peuvent encore être présentes ; elles tendent souvent à s’atténuer d’ici la fin du premier trimestre.'],
    toKnow: ['Les organes génitaux commencent tout juste à se différencier, mais le sexe n’est en général identifiable que bien plus tard, lors de l’échographie morphologique.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 10,
    babyImage: require('../assets/images/pregnancy/development/week-10.png'),
    babyDescription:
      'Le visage devient plus reconnaissable, les paupières réagissent à la lumière et le cœur bat à un rythme rapide, environ trois fois plus vite que celui d’un adulte.',
    length: 'Environ 30 mm',
    comparison: 'Petit abricot',
    bodyChanges: ['Le tour de taille peut commencer à légèrement évoluer, même si le ventre n’est généralement pas encore visible.'],
    toKnow: ['Le dépistage combiné du premier trimestre, quand il est proposé, se fait généralement entre la semaine 11 et la semaine 14.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 11,
    babyImage: require('../assets/images/pregnancy/development/week-11.png'),
    babyDescription:
      'Les doigts et les orteils se séparent, de minuscules ongles apparaissent, et le placenta prend progressivement le relais du sac vitellin pour nourrir le fœtus.',
    length: 'Environ 41 mm',
    comparison: 'Figue',
    bodyChanges: ['Il est possible de ressentir des variations d’humeur, liées notamment aux changements hormonaux.'],
    toKnow: ['Les mouvements du bébé commencent, mais ils ne sont généralement pas encore ressentis à ce stade.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 12,
    babyImage: require('../assets/images/pregnancy/development/week-12.png'),
    babyDescription:
      'Les organes internes et les muscles ont bien grandi, et le squelette commence à s’ossifier. Les organes reproducteurs se sont formés, sans être encore visibles à l’échographie.',
    length: 'Environ 5,4 cm',
    comparison: 'Prune',
    bodyChanges: ['Les nausées ont souvent tendance à s’atténuer progressivement autour de cette période, bien que cela varie beaucoup d’une personne à l’autre.'],
    toKnow: ['La fin du premier trimestre est souvent associée à une baisse du risque de fausse couche par rapport aux semaines précédentes.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 13,
    babyImage: require('../assets/images/pregnancy/development/week-13.png'),
    babyDescription:
      'Les mouvements, encore saccadés, deviennent un peu plus coordonnés. Certains bébés esquissent déjà un réflexe de succion du pouce.',
    length: 'Environ 7,4 cm',
    comparison: 'Pêche',
    bodyChanges: ['Beaucoup de personnes retrouvent progressivement un peu plus d’énergie à l’approche du deuxième trimestre.'],
    toKnow: ['Le premier trimestre se termine généralement autour de cette semaine ; le suivi se poursuit avec des rendez-vous plus espacés.'],
    sourceRefs: ['NHS_S4L'],
  },

  // ---------------------------------------------------------- weeks 14–19 (early second trimester)
  {
    week: 14,
    babyImage: require('../assets/images/pregnancy/development/week-14.png'),
    babyDescription:
      'La tête s’arrondit et se proportionne davantage avec le reste du corps. Le fœtus avale un peu de liquide amniotique, qui transite par l’estomac et les reins.',
    length: 'Environ 8,5 cm',
    comparison: 'Kiwi',
    bodyChanges: ['Le ventre commence à s’arrondir plus visiblement chez certaines personnes.'],
    toKnow: ['Un professionnel de santé peut parfois commencer à entendre le rythme cardiaque avec un appareil à ultrasons posé sur le ventre.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 15,
    babyImage: require('../assets/images/pregnancy/development/week-15.png'),
    babyDescription:
      'Un fin duvet appelé lanugo recouvre progressivement la peau, et les sourcils ainsi que les cils commencent à apparaître. Les yeux deviennent sensibles à la lumière.',
    length: 'Environ 10,1 cm',
    comparison: 'Pomme',
    bodyChanges: ['L’appétit peut évoluer, avec parfois de nouvelles envies ou aversions alimentaires.'],
    toKnow: ['L’audition commence à se développer vers cette période : la voix et les bruits internes du corps deviennent progressivement perceptibles.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 16,
    babyImage: require('../assets/images/pregnancy/development/week-16.png'),
    babyDescription:
      'Le système nerveux permet des mouvements des bras et des jambes. Les mains peuvent se refermer en petits poings.',
    length: 'Environ 11,6 cm',
    comparison: 'Avocat',
    bodyChanges: ['Certaines personnes commencent à ressentir de très légers mouvements à partir de cette période, souvent décrits comme des papillonnements.'],
    toKnow: ['Ressentir les premiers mouvements varie beaucoup d’une grossesse à l’autre, en particulier selon qu’il s’agit d’une première grossesse.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 17,
    babyImage: require('../assets/images/pregnancy/development/week-17.png'),
    babyDescription:
      'Les yeux, encore fermés, peuvent bouger, et le bébé réagit désormais aux sons forts. Les empreintes digitales commencent à se dessiner.',
    length: 'Environ 12 cm',
    comparison: 'Grenade',
    bodyChanges: ['Des maux de dos légers peuvent apparaître à mesure que le centre de gravité change.'],
    toKnow: ['Les bruits extérieurs commencent à être perçus, de façon atténuée, à travers le liquide amniotique.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 18,
    babyImage: require('../assets/images/pregnancy/development/week-18.png'),
    babyDescription:
      'L’audition, le toucher, la déglutition et le réflexe de succion continuent de se développer. Le bébé devient de plus en plus actif, avec davantage de mouvements des bras et des jambes.',
    length: 'Environ 14,2 cm',
    comparison: 'Poivron',
    bodyChanges: ['Le ventre est souvent bien visible à ce stade, et le centre de gravité continue de se déplacer.'],
    toKnow: ['L’échographie morphologique, qui examine le développement général du bébé, est généralement proposée entre la semaine 18 et la semaine 21.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 19,
    babyImage: require('../assets/images/pregnancy/development/week-19.png'),
    babyDescription:
      'Les futures dents définitives commencent à se former derrière les dents de lait en préparation, et le bébé continue de prendre du poids progressivement.',
    length: 'Environ 15,3 cm',
    comparison: 'Grosse tomate',
    bodyChanges: ['Une sensation de tiraillement sur les côtés du ventre (douleurs ligamentaires) peut survenir avec la croissance de l’utérus.'],
    toKnow: ['C’est une période fréquente pour commencer à ressentir plus distinctement les mouvements du bébé.'],
    sourceRefs: ['NHS_S4L'],
  },

  // ---------------------------------------------------------- weeks 20–27 (mid second trimester)
  {
    week: 20,
    babyImage: require('../assets/images/pregnancy/development/week-20.png'),
    babyDescription:
      'À partir de cette semaine, la longueur est mesurée de la tête aux talons plutôt que de la tête au bas du dos, car les jambes sont désormais dépliées et mesurables — ce qui explique une augmentation visible de la taille de référence par rapport aux semaines précédentes.',
    length: 'Environ 25,6 cm',
    comparison: 'Banane',
    bodyChanges: ['Le ventre bien arrondi peut commencer à modifier l’équilibre et la posture.'],
    toKnow: ['La mi-grossesse est souvent marquée par un bilan complet avec le professionnel de santé assurant le suivi.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 21,
    babyImage: require('../assets/images/pregnancy/development/week-21.png'),
    babyDescription: 'Les mouvements deviennent plus francs et coordonnés, et il est fréquent de commencer à bien les ressentir durant cette période.',
    length: 'Environ 26,7 cm',
    comparison: 'Carotte',
    bodyChanges: ['Un léger essoufflement à l’effort peut apparaître à mesure que l’utérus prend de la place.'],
    toKnow: ['Se familiariser avec le rythme habituel des mouvements du bébé permet de mieux repérer un changement inhabituel.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 22,
    babyImage: require('../assets/images/pregnancy/development/week-22.png'),
    babyDescription:
      'Les poumons continuent de se développer et le bébé s’exerce à de petits mouvements respiratoires. Les bourgeons du goût se forment également.',
    length: 'Environ 27,8 cm',
    comparison: 'Patate douce',
    bodyChanges: ['Des crampes dans les jambes, notamment la nuit, sont possibles chez certaines personnes.'],
    toKnow: ['Ce que tu manges peut influencer le liquide amniotique, que le bébé avale régulièrement.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 23,
    babyImage: require('../assets/images/pregnancy/development/week-23.png'),
    babyDescription:
      'Les membres sont désormais bien proportionnés. Le bébé s’exerce à respirer et commence à alterner des phases de sommeil et d’éveil.',
    length: 'Environ 28,9 cm',
    comparison: 'Grosse mangue',
    bodyChanges: ['Des maux de dos plus marqués peuvent apparaître avec la prise de poids progressive.'],
    toKnow: ['Observer les périodes d’activité et de calme du bébé aide à connaître son rythme propre.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 24,
    babyImage: require('../assets/images/pregnancy/development/week-24.png'),
    babyDescription:
      'Le bébé atteint le seuil de viabilité : en cas de naissance très prématurée à ce stade, une prise en charge médicale spécialisée en néonatalogie peut permettre la survie, avec un accompagnement adapté.',
    length: 'Environ 30 cm',
    comparison: 'Épi de maïs',
    bodyChanges: ['Une pression accrue sur la vessie et des envies fréquentes d’uriner peuvent apparaître.'],
    toKnow: ['Le dépistage du diabète gestationnel est généralement proposé autour de cette période.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 25,
    babyImage: require('../assets/images/pregnancy/development/week-25.png'),
    babyDescription:
      'Le bébé réagit désormais aux bruits forts par un sursaut ou un coup de pied, et un hoquet occasionnel peut être ressenti. Il urine régulièrement dans le liquide amniotique.',
    length: 'Environ 34,6 cm',
    comparison: 'Courgette',
    bodyChanges: ['Des brûlures d’estomac ou des remontées acides peuvent devenir plus fréquentes.'],
    toKnow: ['Un hoquet fœtal ressenti de temps en temps est généralement considéré comme normal.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 26,
    babyImage: require('../assets/images/pregnancy/development/week-26.png'),
    babyDescription: 'Les yeux s’ouvrent pour la première fois. La couleur définitive des yeux ne sera généralement connue que plusieurs mois après la naissance.',
    length: 'Environ 35,6 cm',
    comparison: 'Concombre',
    bodyChanges: ['Un gonflement léger des chevilles ou des pieds peut apparaître, en particulier en fin de journée.'],
    toKnow: ['Le troisième trimestre approche, avec un suivi médical qui devient généralement plus fréquent.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 27,
    babyImage: require('../assets/images/pregnancy/development/week-27.png'),
    babyDescription:
      'Les poumons deviennent capables d’amorcer une respiration, et le bébé continue de prendre en rondeur à mesure que la graisse se dépose sous la peau.',
    length: 'Environ 36,6 cm',
    comparison: 'Chou-fleur',
    bodyChanges: ['La fatigue peut revenir à mesure que le corps porte un poids croissant.'],
    toKnow: ['Le début du troisième trimestre est souvent l’occasion de commencer à réfléchir au projet de naissance.'],
    sourceRefs: ['NHS_S4L'],
  },

  // ---------------------------------------------------------- weeks 28–33 (early third trimester)
  {
    week: 28,
    babyImage: require('../assets/images/pregnancy/development/week-28.png'),
    babyDescription:
      'Le rythme cardiaque, plus rapide en tout début de grossesse, s’est stabilisé autour de 130 à 140 battements par minute et peut désormais s’entendre au stéthoscope.',
    length: 'Environ 37,6 cm',
    comparison: 'Aubergine',
    bodyChanges: ['Un essoufflement ou des brûlures d’estomac peuvent devenir plus fréquents à mesure que l’utérus prend de la place.'],
    toKnow: ['Le troisième trimestre débute généralement autour de cette semaine, avec des consultations qui se rapprochent.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 29,
    babyImage: require('../assets/images/pregnancy/development/week-29.png'),
    babyDescription:
      'Le bébé est déjà bien formé ; les prochaines semaines seront surtout consacrées à la maturation des organes et à la prise de poids. Le fin enduit protecteur qui recouvre sa peau commence à se résorber.',
    length: 'Environ 38,6 cm',
    comparison: 'Courge butternut',
    bodyChanges: ['Le sommeil peut devenir plus difficile à trouver, en raison de la taille grandissante du ventre.'],
    toKnow: ['Se reposer sur le côté gauche est souvent conseillé en fin de grossesse pour favoriser la circulation.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 30,
    babyImage: require('../assets/images/pregnancy/development/week-30.png'),
    babyDescription:
      'La vision continue de se développer ; à la naissance, le bébé pourra distinguer les visages proches, avant de progressivement apprendre à suivre des objets en mouvement.',
    length: 'Environ 39,9 cm',
    comparison: 'Chou',
    bodyChanges: ['Une sensation de lourdeur dans le bas du dos ou le bassin peut s’accentuer.'],
    toKnow: ['Les consultations prénatales deviennent généralement plus rapprochées à partir de ce stade.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 31,
    babyImage: require('../assets/images/pregnancy/development/week-31.png'),
    babyDescription:
      'Le bébé bouge activement, suce parfois ses doigts et peut faire des mouvements amples. Sa peau devient moins fripée à mesure que la graisse s’accumule.',
    length: 'Environ 41,1 cm',
    comparison: 'Noix de coco',
    bodyChanges: ['Des contractions d’entraînement, dites de Braxton Hicks, peuvent commencer à se faire sentir occasionnellement.'],
    toKnow: ['Le bébé commence à reconnaître certaines voix familières entendues régulièrement depuis l’extérieur.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 32,
    babyImage: require('../assets/images/pregnancy/development/week-32.png'),
    babyDescription:
      'Le bébé est déjà bien formé et se positionne peu à peu tête en bas en vue de la naissance. Il continue surtout à prendre du poids durant les semaines restantes.',
    length: 'Environ 42,4 cm',
    comparison: 'Botte de céleri',
    bodyChanges: ['Une prise de poids plus marquée est courante durant cette période, en lien avec la croissance du bébé.'],
    toKnow: ['Le positionnement tête en bas (présentation céphalique) devient plus fréquent à l’approche du terme.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 33,
    babyImage: require('../assets/images/pregnancy/development/week-33.png'),
    babyDescription:
      'Le cerveau et le système nerveux sont désormais bien développés. Les os continuent de se durcir, à l’exception de ceux du crâne, qui restent souples pour faciliter le passage lors de la naissance.',
    length: 'Environ 43,7 cm',
    comparison: 'Ananas',
    bodyChanges: ['Une gêne pour trouver une position confortable pour dormir est fréquente à ce stade.'],
    toKnow: ['La souplesse des os du crâne à la naissance est temporaire et se referme progressivement durant la première année.'],
    sourceRefs: ['NHS_S4L'],
  },

  // ---------------------------------------------------------- weeks 34–40 (late third trimester)
  {
    week: 34,
    babyImage: require('../assets/images/pregnancy/development/week-34.png'),
    babyDescription: 'Le bébé, recroquevillé faute de place, garde généralement les jambes repliées vers la poitrine tout en continuant à bouger régulièrement.',
    length: 'Environ 45 cm',
    comparison: 'Melon cantaloup',
    bodyChanges: ['Malgré l’espace réduit, les mouvements du bébé et les changements de forme du ventre restent habituellement perceptibles.'],
    toKnow: ['Continuer à surveiller les mouvements habituels du bébé reste pertinent jusqu’à l’accouchement.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 35,
    babyImage: require('../assets/images/pregnancy/development/week-35.png'),
    babyDescription: 'Le bébé continue de s’arrondir, ce qui l’aidera à réguler sa température une fois né. L’espace disponible dans l’utérus devient plus limité.',
    length: 'Environ 46,2 cm',
    comparison: 'Melon miel',
    bodyChanges: ['Une pression pelvienne plus marquée peut apparaître à mesure que le bébé descend progressivement.'],
    toKnow: ['Malgré l’espace restreint, le bébé doit continuer à bouger avec une régularité similaire aux semaines précédentes.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 36,
    babyImage: require('../assets/images/pregnancy/development/week-36.png'),
    babyDescription:
      'Les poumons ont généralement suffisamment mûri pour permettre une respiration autonome, et le bébé est capable de téter et de digérer.',
    length: 'Environ 47,4 cm',
    comparison: 'Laitue romaine',
    bodyChanges: ['Une respiration parfois plus courte peut être ressentie, l’utérus prenant beaucoup de place sous les côtes.'],
    toKnow: ['La grossesse est considérée à terme entre la semaine 37 et la semaine 42.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 37,
    babyImage: require('../assets/images/pregnancy/development/week-37.png'),
    babyDescription:
      'Le bébé est considéré comme suffisamment mature pour naître. La grande majorité des bébés se positionnent désormais tête en bas.',
    length: 'Environ 48,6 cm',
    comparison: 'Poireau',
    bodyChanges: ['Une sensation de pression pelvienne croissante est fréquente à mesure que le bébé s’engage dans le bassin.'],
    toKnow: ['À partir de cette semaine, le terme est considéré comme atteint et la naissance peut survenir à tout moment.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 38,
    babyImage: require('../assets/images/pregnancy/development/week-38.png'),
    babyDescription: 'Le duvet fin qui recouvrait la peau a en grande partie disparu, et les intestins accumulent le méconium, les premières selles du nouveau-né.',
    length: 'Environ 49,8 cm',
    comparison: 'Tige de rhubarbe',
    bodyChanges: ['Se familiariser avec les signes annonçant le travail peut être utile à l’approche de la naissance.'],
    toKnow: ['Un accouchement programmé, lorsqu’il est envisagé sans indication médicale, n’est généralement pas recommandé avant la 39e semaine.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 39,
    babyImage: require('../assets/images/pregnancy/development/week-39.png'),
    babyDescription:
      'La peau, auparavant plus fine, s’est épaissie et protège désormais mieux le bébé. Un enduit protecteur, le vernix, facilite aussi son passage lors de la naissance.',
    length: 'Environ 50,7 cm',
    comparison: 'Pastèque',
    bodyChanges: ['L’impatience et une certaine fatigue sont fréquentes à l’approche de la date prévue.'],
    toKnow: ['La circulation sanguine du nouveau-né continue de s’ajuster juste après la naissance, ce qui peut donner temporairement des mains ou des pieds légèrement bleutés.'],
    sourceRefs: ['NHS_S4L'],
  },
  {
    week: 40,
    babyImage: require('../assets/images/pregnancy/development/week-40.png'),
    babyDescription:
      'Le bébé est pleinement développé et prêt à naître. La date prévue d’accouchement est une estimation : beaucoup de naissances ont lieu dans les jours qui l’entourent, avant ou après.',
    length: 'Environ 51,2 cm',
    comparison: 'Citrouille',
    bodyChanges: ['L’attente de signes de travail (contractions régulières, perte des eaux) est fréquente durant cette période.'],
    toKnow: ['Dépasser légèrement la date prévue reste courant et ne signifie pas nécessairement qu’il y a un problème ; un suivi rapproché est généralement proposé.'],
    sourceRefs: ['NHS_S4L'],
  },

  // ---------------------------------------------------------- week 41 (post-term)
  // No NHS Start4Life page exists beyond week 40 with a published length
  // figure — none is fabricated here.
  {
    week: 41,
    babyImage: require('../assets/images/pregnancy/development/week-41.png'),
    babyDescription:
      'Le bébé reste pleinement développé. Au-delà de la date prévue, un suivi plus rapproché est généralement proposé pour surveiller le bien-être du bébé.',
    bodyChanges: ['L’attente prolongée peut s’accompagner d’une fatigue et d’une impatience accrues.'],
    toKnow: ['Un dépassement de terme fait généralement l’objet d’une surveillance renforcée par l’équipe médicale.'],
    sourceRefs: ['NHS_S4L'],
  },
];

export function getPregnancyWeekData(week: number): PregnancyWeekData | undefined {
  return PREGNANCY_WEEK_DATA.find(entry => entry.week === week);
}
