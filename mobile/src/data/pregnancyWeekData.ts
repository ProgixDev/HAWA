import type {ImageSourcePropType} from 'react-native';

// ============================================================
// CENTRALIZED WEEK-BY-WEEK PREGNANCY REFERENCE DATA
// ============================================================
//
// The ONE place general, educational, week-by-week fetal/maternal
// reference content lives. PregnancyDashboard's "Ton bébé" card and
// PregnancyWeekScreen both read this file via getPregnancyWeekData(week,
// lang), so they can never disagree and this content is never duplicated.
//
// This is NOT user-specific medical data. Every value below is a general
// population-level reference figure (never the user's own ultrasound
// measurement) and is phrased accordingly ("environ", "moyen(ne)" /
// "about", "average").
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
//
// PHASE 7L (bilingual editorial content): the French editorial text below
// is unchanged from before this phase. The English text is a careful,
// non-literal medical translation — never a stronger claim than the French
// (e.g. "peut" always renders as "may/can", never "will"), with every
// numeric value (length, week numbers, durations) preserved exactly, only
// reformatted to English decimal/locale conventions (comma → period).
// `week`, `babyImage`, and `sourceRefs` are language-neutral and are never
// duplicated per language — see PregnancyWeekEntry below.
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

type PregnancyWeekEditorialContent = {
  babyDescription?: string;
  length?: string;
  comparison?: string;
  bodyChanges?: string[];
  toKnow?: string[];
};

type PregnancyWeekEntry = {
  week: number;
  babyImage?: ImageSourcePropType;
  sourceRefs?: string[];
  content: {
    fr: PregnancyWeekEditorialContent;
    en: PregnancyWeekEditorialContent;
  };
};

const PREGNANCY_WEEK_DATA: readonly PregnancyWeekEntry[] = [
  // ---------------------------------------------------------- weeks 1–3
  // No embryo/fetus exists yet to describe — see OB_DATING note above.
  {
    week: 1,
    babyImage: require('../assets/images/pregnancy/development/week-01.png'),
    sourceRefs: ['OB_DATING'],
    content: {
      fr: {
        babyDescription:
          'La grossesse est datée à partir du premier jour de tes dernières règles, par convention médicale. À ce stade, la fécondation n’a généralement pas encore eu lieu.',
        bodyChanges: [
          'Cette période précède généralement la conception ; il n’y a habituellement pas encore de changement physique lié à la grossesse.',
        ],
        toKnow: [
          'Compter la grossesse depuis les dernières règles permet d’estimer une date prévue d’accouchement de façon standardisée, même si la conception survient un peu plus tard.',
          'Il est courant de ne remarquer aucun changement à ce stade.',
        ],
      },
      en: {
        babyDescription:
          'Pregnancy is dated from the first day of your last period, by medical convention. At this stage, fertilization has generally not yet taken place.',
        bodyChanges: [
          'This period generally comes before conception; there usually isn’t yet any pregnancy-related physical change.',
        ],
        toKnow: [
          'Counting pregnancy from the last period gives a standardized way of estimating a due date, even though conception actually happens a bit later.',
          'It’s common not to notice any change at this stage.',
        ],
      },
    },
  },
  {
    week: 2,
    babyImage: require('../assets/images/pregnancy/development/week-02.png'),
    sourceRefs: ['OB_DATING'],
    content: {
      fr: {
        babyDescription:
          'L’ovulation et une éventuelle fécondation surviennent généralement autour de cette période, selon la durée du cycle de chacune.',
        bodyChanges: [
          'Le moment de l’ovulation peut varier selon la durée du cycle, ce qui influence la date réelle possible de conception.',
          'Il n’y a généralement pas encore de changement physique spécifique à la grossesse à ce stade.',
        ],
        toKnow: ['Le moment exact de l’ovulation varie d’une personne à l’autre, ce qui explique pourquoi cette période reste une estimation.'],
      },
      en: {
        babyDescription:
          'Ovulation and possible fertilization generally occur around this time, depending on each person’s cycle length.',
        bodyChanges: [
          'The timing of ovulation can vary depending on cycle length, which affects the actual possible date of conception.',
          'There is generally no pregnancy-specific physical change yet at this stage.',
        ],
        toKnow: ['The exact timing of ovulation varies from person to person, which is why this period remains an estimate.'],
      },
    },
  },
  {
    week: 3,
    babyImage: require('../assets/images/pregnancy/development/week-03.png'),
    sourceRefs: ['OB_DATING'],
    content: {
      fr: {
        babyDescription:
          'Si une fécondation a eu lieu, l’œuf commence à se diviser et à migrer vers l’utérus, mais rien n’est encore détectable par un test de grossesse.',
        bodyChanges: [
          'Cette semaine se situe encore dans la période de datation médicale entourant la conception ; aucun signe physique n’est généralement perceptible à ce stade.',
        ],
        toKnow: ['La plupart des tests de grossesse urinaires deviennent fiables à partir de la semaine suivante environ, une fois l’implantation amorcée.'],
      },
      en: {
        babyDescription:
          'If fertilization has occurred, the egg begins dividing and moving toward the uterus, but nothing is detectable yet by a pregnancy test.',
        bodyChanges: [
          'This week still falls within the medical dating period surrounding conception; no physical sign is generally noticeable at this stage.',
        ],
        toKnow: ['Most urine pregnancy tests become reliable from around the following week, once implantation has begun.'],
      },
    },
  },

  // ---------------------------------------------------------- weeks 4–7 (embryo)
  {
    week: 4,
    babyImage: require('../assets/images/pregnancy/development/week-04.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'L’embryon vient de s’implanter dans la paroi de l’utérus. Le sac amniotique et le sac vitellin, qui le nourrira au tout début, se mettent en place.',
        length: 'Environ 2 mm',
        comparison: 'Graine de pavot',
        bodyChanges: [
          'Certaines personnes ne remarquent encore aucun signe à ce stade très précoce.',
          'Un test de grossesse urinaire peut généralement détecter la grossesse à partir de cette semaine.',
        ],
        toKnow: ['C’est le moment habituel où un test de grossesse peut commencer à donner un résultat positif.'],
      },
      en: {
        babyDescription:
          'The embryo has just implanted in the uterine wall. The amniotic sac and the yolk sac, which will nourish it in the very first days, are forming.',
        length: 'About 2 mm',
        comparison: 'Poppy seed',
        bodyChanges: [
          'Some people don’t notice any sign yet at this very early stage.',
          'A urine pregnancy test can generally detect pregnancy from this week onward.',
        ],
        toKnow: ['This is the usual time when a pregnancy test can start giving a positive result.'],
      },
    },
  },
  {
    week: 5,
    babyImage: require('../assets/images/pregnancy/development/week-05.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le système nerveux commence à se former et le cœur, encore minuscule, s’apprête à battre pour la première fois.',
        length: 'Environ 2 mm',
        comparison: 'Graine de sésame',
        bodyChanges: ['Une fatigue inhabituelle, des nausées légères ou une sensibilité de la poitrine peuvent apparaître.'],
        toKnow: ['C’est le moment recommandé pour prendre rendez-vous avec un professionnel de santé afin de démarrer le suivi de grossesse.'],
      },
      en: {
        babyDescription:
          'The nervous system begins to form, and the heart, still tiny, is about to beat for the first time.',
        length: 'About 2 mm',
        comparison: 'Sesame seed',
        bodyChanges: ['Unusual fatigue, mild nausea, or breast tenderness may appear.'],
        toKnow: ['This is the recommended time to make an appointment with a healthcare professional to start pregnancy care.'],
      },
    },
  },
  {
    week: 6,
    babyImage: require('../assets/images/pregnancy/development/week-06.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les ébauches des bras et des jambes apparaissent, ainsi que de petites indentations là où les oreilles se formeront. Le cœur peut parfois déjà être détecté par échographie.',
        length: 'Environ 6 mm',
        comparison: 'Petit pois',
        bodyChanges: ['Les nausées et la fatigue peuvent s’intensifier chez certaines personnes durant cette période.'],
        toKnow: ['Une activité cardiaque peut parfois être visible dès cette semaine lors d’une échographie précoce.'],
      },
      en: {
        babyDescription:
          'The buds of the arms and legs appear, along with small indentations where the ears will form. The heart can sometimes already be detected on ultrasound.',
        length: 'About 6 mm',
        comparison: 'Pea',
        bodyChanges: ['Nausea and fatigue may intensify for some people during this period.'],
        toKnow: ['Heart activity can sometimes be visible as early as this week on an early ultrasound.'],
      },
    },
  },
  {
    week: 7,
    babyImage: require('../assets/images/pregnancy/development/week-07.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le cerveau se développe plus vite que le reste du corps, donnant un front proéminent. De petites ébauches de mains commencent à apparaître au bout des bras.',
        length: 'Environ 10 mm',
        comparison: 'Grain de raisin',
        bodyChanges: ['Des envies alimentaires particulières ou, au contraire, des aversions pour certains aliments sont possibles.'],
        toKnow: ['Le tube neural, à l’origine du cerveau et de la moelle épinière, poursuit sa fermeture durant ces semaines.'],
      },
      en: {
        babyDescription:
          'The brain develops faster than the rest of the body, giving a prominent forehead. Small hand buds begin to appear at the ends of the arms.',
        length: 'About 10 mm',
        comparison: 'Grape',
        bodyChanges: ['Particular food cravings, or conversely aversions to certain foods, are possible.'],
        toKnow: ['The neural tube, which gives rise to the brain and spinal cord, continues closing during these weeks.'],
      },
    },
  },

  // ---------------------------------------------------------- weeks 8–13 (first trimester, fetus)
  {
    week: 8,
    babyImage: require('../assets/images/pregnancy/development/week-08.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'L’embryon est désormais appelé fœtus. Les bras s’allongent, la tête commence à se redresser légèrement et le placenta poursuit sa formation.',
        length: 'Environ 16 mm',
        comparison: 'Framboise',
        bodyChanges: ['La sensibilité aux odeurs et les nausées matinales sont fréquentes à ce stade, sans être systématiques.'],
        toKnow: ['La première échographie de datation est généralement programmée entre la semaine 8 et la semaine 14.'],
      },
      en: {
        babyDescription:
          'The embryo is now called a fetus. The arms are lengthening, the head begins to straighten slightly, and the placenta continues forming.',
        length: 'About 16 mm',
        comparison: 'Raspberry',
        bodyChanges: ['Sensitivity to smells and morning sickness are common at this stage, though not universal.'],
        toKnow: ['The first dating ultrasound is generally scheduled between week 8 and week 14.'],
      },
    },
  },
  {
    week: 9,
    babyImage: require('../assets/images/pregnancy/development/week-09.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les traits du visage se précisent, les paupières protègent les yeux, et les mains et les pieds se dessinent avec les futurs doigts et orteils.',
        length: 'Environ 22 mm',
        comparison: 'Fraise',
        bodyChanges: ['Une fatigue marquée et des nausées peuvent encore être présentes ; elles tendent souvent à s’atténuer d’ici la fin du premier trimestre.'],
        toKnow: ['Les organes génitaux commencent tout juste à se différencier, mais le sexe n’est en général identifiable que bien plus tard, lors de l’échographie morphologique.'],
      },
      en: {
        babyDescription:
          'Facial features become more defined, the eyelids protect the eyes, and the hands and feet are taking shape with the future fingers and toes.',
        length: 'About 22 mm',
        comparison: 'Strawberry',
        bodyChanges: ['Marked fatigue and nausea may still be present; they often tend to ease off by the end of the first trimester.'],
        toKnow: ['The genital organs are just beginning to differentiate, but the sex generally isn’t identifiable until much later, at the anatomy ultrasound.'],
      },
    },
  },
  {
    week: 10,
    babyImage: require('../assets/images/pregnancy/development/week-10.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le visage devient plus reconnaissable, les paupières réagissent à la lumière et le cœur bat à un rythme rapide, environ trois fois plus vite que celui d’un adulte.',
        length: 'Environ 30 mm',
        comparison: 'Petit abricot',
        bodyChanges: ['Le tour de taille peut commencer à légèrement évoluer, même si le ventre n’est généralement pas encore visible.'],
        toKnow: ['Le dépistage combiné du premier trimestre, quand il est proposé, se fait généralement entre la semaine 11 et la semaine 14.'],
      },
      en: {
        babyDescription:
          'The face becomes more recognizable, the eyelids react to light, and the heart beats at a fast rate, about three times faster than an adult’s.',
        length: 'About 30 mm',
        comparison: 'Small apricot',
        bodyChanges: ['Your waistline may start to change slightly, even though the belly generally isn’t visible yet.'],
        toKnow: ['Combined first-trimester screening, when offered, is generally done between week 11 and week 14.'],
      },
    },
  },
  {
    week: 11,
    babyImage: require('../assets/images/pregnancy/development/week-11.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les doigts et les orteils se séparent, de minuscules ongles apparaissent, et le placenta prend progressivement le relais du sac vitellin pour nourrir le fœtus.',
        length: 'Environ 41 mm',
        comparison: 'Figue',
        bodyChanges: ['Il est possible de ressentir des variations d’humeur, liées notamment aux changements hormonaux.'],
        toKnow: ['Les mouvements du bébé commencent, mais ils ne sont généralement pas encore ressentis à ce stade.'],
      },
      en: {
        babyDescription:
          'The fingers and toes separate, tiny nails appear, and the placenta gradually takes over from the yolk sac in nourishing the fetus.',
        length: 'About 41 mm',
        comparison: 'Fig',
        bodyChanges: ['You may notice mood swings, linked in particular to hormonal changes.'],
        toKnow: ['The baby’s movements are beginning, but they generally aren’t felt yet at this stage.'],
      },
    },
  },
  {
    week: 12,
    babyImage: require('../assets/images/pregnancy/development/week-12.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les organes internes et les muscles ont bien grandi, et le squelette commence à s’ossifier. Les organes reproducteurs se sont formés, sans être encore visibles à l’échographie.',
        length: 'Environ 5,4 cm',
        comparison: 'Prune',
        bodyChanges: ['Les nausées ont souvent tendance à s’atténuer progressivement autour de cette période, bien que cela varie beaucoup d’une personne à l’autre.'],
        toKnow: ['La fin du premier trimestre est souvent associée à une baisse du risque de fausse couche par rapport aux semaines précédentes.'],
      },
      en: {
        babyDescription:
          'The internal organs and muscles have grown well, and the skeleton is starting to ossify. The reproductive organs have formed, though they aren’t visible on ultrasound yet.',
        length: 'About 5.4 cm',
        comparison: 'Plum',
        bodyChanges: ['Nausea often tends to gradually ease around this time, though this varies a lot from person to person.'],
        toKnow: ['The end of the first trimester is often associated with a lower miscarriage risk compared with the preceding weeks.'],
      },
    },
  },
  {
    week: 13,
    babyImage: require('../assets/images/pregnancy/development/week-13.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les mouvements, encore saccadés, deviennent un peu plus coordonnés. Certains bébés esquissent déjà un réflexe de succion du pouce.',
        length: 'Environ 7,4 cm',
        comparison: 'Pêche',
        bodyChanges: ['Beaucoup de personnes retrouvent progressivement un peu plus d’énergie à l’approche du deuxième trimestre.'],
        toKnow: ['Le premier trimestre se termine généralement autour de cette semaine ; le suivi se poursuit avec des rendez-vous plus espacés.'],
      },
      en: {
        babyDescription:
          'Movements, still jerky, become a little more coordinated. Some babies already show a thumb-sucking reflex.',
        length: 'About 7.4 cm',
        comparison: 'Peach',
        bodyChanges: ['Many people gradually regain a bit more energy as the second trimester approaches.'],
        toKnow: ['The first trimester generally ends around this week; care continues with more widely spaced appointments.'],
      },
    },
  },

  // ---------------------------------------------------------- weeks 14–19 (early second trimester)
  {
    week: 14,
    babyImage: require('../assets/images/pregnancy/development/week-14.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'La tête s’arrondit et se proportionne davantage avec le reste du corps. Le fœtus avale un peu de liquide amniotique, qui transite par l’estomac et les reins.',
        length: 'Environ 8,5 cm',
        comparison: 'Kiwi',
        bodyChanges: ['Le ventre commence à s’arrondir plus visiblement chez certaines personnes.'],
        toKnow: ['Un professionnel de santé peut parfois commencer à entendre le rythme cardiaque avec un appareil à ultrasons posé sur le ventre.'],
      },
      en: {
        babyDescription:
          'The head becomes more rounded and more proportionate with the rest of the body. The fetus swallows a little amniotic fluid, which passes through the stomach and kidneys.',
        length: 'About 8.5 cm',
        comparison: 'Kiwi',
        bodyChanges: ['The belly starts to round out more visibly for some people.'],
        toKnow: ['A healthcare professional can sometimes start hearing the heartbeat with an ultrasound device placed on the belly.'],
      },
    },
  },
  {
    week: 15,
    babyImage: require('../assets/images/pregnancy/development/week-15.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Un fin duvet appelé lanugo recouvre progressivement la peau, et les sourcils ainsi que les cils commencent à apparaître. Les yeux deviennent sensibles à la lumière.',
        length: 'Environ 10,1 cm',
        comparison: 'Pomme',
        bodyChanges: ['L’appétit peut évoluer, avec parfois de nouvelles envies ou aversions alimentaires.'],
        toKnow: ['L’audition commence à se développer vers cette période : la voix et les bruits internes du corps deviennent progressivement perceptibles.'],
      },
      en: {
        babyDescription:
          'A fine down called lanugo gradually covers the skin, and eyebrows and eyelashes begin to appear. The eyes become sensitive to light.',
        length: 'About 10.1 cm',
        comparison: 'Apple',
        bodyChanges: ['Your appetite may change, sometimes with new food cravings or aversions.'],
        toKnow: ['Hearing begins developing around this time: your voice and the body’s internal sounds gradually become perceptible.'],
      },
    },
  },
  {
    week: 16,
    babyImage: require('../assets/images/pregnancy/development/week-16.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription: 'Le système nerveux permet des mouvements des bras et des jambes. Les mains peuvent se refermer en petits poings.',
        length: 'Environ 11,6 cm',
        comparison: 'Avocat',
        bodyChanges: ['Certaines personnes commencent à ressentir de très légers mouvements à partir de cette période, souvent décrits comme des papillonnements.'],
        toKnow: ['Ressentir les premiers mouvements varie beaucoup d’une grossesse à l’autre, en particulier selon qu’il s’agit d’une première grossesse.'],
      },
      en: {
        babyDescription: 'The nervous system allows arm and leg movements. The hands can close into little fists.',
        length: 'About 11.6 cm',
        comparison: 'Avocado',
        bodyChanges: ['Some people start feeling very light movements from around this time, often described as fluttering.'],
        toKnow: ['Feeling the first movements varies a lot from one pregnancy to another, particularly depending on whether it’s a first pregnancy.'],
      },
    },
  },
  {
    week: 17,
    babyImage: require('../assets/images/pregnancy/development/week-17.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les yeux, encore fermés, peuvent bouger, et le bébé réagit désormais aux sons forts. Les empreintes digitales commencent à se dessiner.',
        length: 'Environ 12 cm',
        comparison: 'Grenade',
        bodyChanges: ['Des maux de dos légers peuvent apparaître à mesure que le centre de gravité change.'],
        toKnow: ['Les bruits extérieurs commencent à être perçus, de façon atténuée, à travers le liquide amniotique.'],
      },
      en: {
        babyDescription:
          'The eyes, still closed, can move, and the baby now reacts to loud sounds. Fingerprints are starting to form.',
        length: 'About 12 cm',
        comparison: 'Pomegranate',
        bodyChanges: ['Mild back pain may appear as your center of gravity shifts.'],
        toKnow: ['Outside sounds are starting to be perceived, in muffled form, through the amniotic fluid.'],
      },
    },
  },
  {
    week: 18,
    babyImage: require('../assets/images/pregnancy/development/week-18.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'L’audition, le toucher, la déglutition et le réflexe de succion continuent de se développer. Le bébé devient de plus en plus actif, avec davantage de mouvements des bras et des jambes.',
        length: 'Environ 14,2 cm',
        comparison: 'Poivron',
        bodyChanges: ['Le ventre est souvent bien visible à ce stade, et le centre de gravité continue de se déplacer.'],
        toKnow: ['L’échographie morphologique, qui examine le développement général du bébé, est généralement proposée entre la semaine 18 et la semaine 21.'],
      },
      en: {
        babyDescription:
          'Hearing, touch, swallowing, and the sucking reflex continue developing. The baby is becoming more and more active, with more arm and leg movements.',
        length: 'About 14.2 cm',
        comparison: 'Bell pepper',
        bodyChanges: ['The belly is often clearly visible at this stage, and your center of gravity keeps shifting.'],
        toKnow: ['The anatomy ultrasound, which examines the baby’s overall development, is generally offered between week 18 and week 21.'],
      },
    },
  },
  {
    week: 19,
    babyImage: require('../assets/images/pregnancy/development/week-19.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les futures dents définitives commencent à se former derrière les dents de lait en préparation, et le bébé continue de prendre du poids progressivement.',
        length: 'Environ 15,3 cm',
        comparison: 'Grosse tomate',
        bodyChanges: ['Une sensation de tiraillement sur les côtés du ventre (douleurs ligamentaires) peut survenir avec la croissance de l’utérus.'],
        toKnow: ['C’est une période fréquente pour commencer à ressentir plus distinctement les mouvements du bébé.'],
      },
      en: {
        babyDescription:
          'The future permanent teeth begin forming behind the baby teeth being prepared, and the baby continues gradually gaining weight.',
        length: 'About 15.3 cm',
        comparison: 'Large tomato',
        bodyChanges: ['A pulling sensation on the sides of the belly (round ligament pain) may occur as the uterus grows.'],
        toKnow: ['This is a common time to start feeling the baby’s movements more distinctly.'],
      },
    },
  },

  // ---------------------------------------------------------- weeks 20–27 (mid second trimester)
  {
    week: 20,
    babyImage: require('../assets/images/pregnancy/development/week-20.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'À partir de cette semaine, la longueur est mesurée de la tête aux talons plutôt que de la tête au bas du dos, car les jambes sont désormais dépliées et mesurables — ce qui explique une augmentation visible de la taille de référence par rapport aux semaines précédentes.',
        length: 'Environ 25,6 cm',
        comparison: 'Banane',
        bodyChanges: ['Le ventre bien arrondi peut commencer à modifier l’équilibre et la posture.'],
        toKnow: ['La mi-grossesse est souvent marquée par un bilan complet avec le professionnel de santé assurant le suivi.'],
      },
      en: {
        babyDescription:
          'From this week onward, length is measured from head to heel rather than head to bottom, since the legs can now be extended and measured — this explains a visible jump in the reference size compared with previous weeks.',
        length: 'About 25.6 cm',
        comparison: 'Banana',
        bodyChanges: ['Your nicely rounded belly may start to affect your balance and posture.'],
        toKnow: ['The midpoint of pregnancy is often marked by a full check-up with the healthcare professional following your care.'],
      },
    },
  },
  {
    week: 21,
    babyImage: require('../assets/images/pregnancy/development/week-21.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription: 'Les mouvements deviennent plus francs et coordonnés, et il est fréquent de commencer à bien les ressentir durant cette période.',
        length: 'Environ 26,7 cm',
        comparison: 'Carotte',
        bodyChanges: ['Un léger essoufflement à l’effort peut apparaître à mesure que l’utérus prend de la place.'],
        toKnow: ['Se familiariser avec le rythme habituel des mouvements du bébé permet de mieux repérer un changement inhabituel.'],
      },
      en: {
        babyDescription: 'Movements become clearer and more coordinated, and it’s common to start feeling them clearly during this period.',
        length: 'About 26.7 cm',
        comparison: 'Carrot',
        bodyChanges: ['Mild shortness of breath on exertion may appear as the uterus takes up more space.'],
        toKnow: ['Getting familiar with your baby’s usual movement pattern makes it easier to notice an unusual change.'],
      },
    },
  },
  {
    week: 22,
    babyImage: require('../assets/images/pregnancy/development/week-22.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les poumons continuent de se développer et le bébé s’exerce à de petits mouvements respiratoires. Les bourgeons du goût se forment également.',
        length: 'Environ 27,8 cm',
        comparison: 'Patate douce',
        bodyChanges: ['Des crampes dans les jambes, notamment la nuit, sont possibles chez certaines personnes.'],
        toKnow: ['Ce que tu manges peut influencer le liquide amniotique, que le bébé avale régulièrement.'],
      },
      en: {
        babyDescription:
          'The lungs continue developing, and the baby practices small breathing movements. Taste buds are also forming.',
        length: 'About 27.8 cm',
        comparison: 'Sweet potato',
        bodyChanges: ['Leg cramps, particularly at night, are possible for some people.'],
        toKnow: ['What you eat can influence the amniotic fluid, which the baby regularly swallows.'],
      },
    },
  },
  {
    week: 23,
    babyImage: require('../assets/images/pregnancy/development/week-23.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les membres sont désormais bien proportionnés. Le bébé s’exerce à respirer et commence à alterner des phases de sommeil et d’éveil.',
        length: 'Environ 28,9 cm',
        comparison: 'Grosse mangue',
        bodyChanges: ['Des maux de dos plus marqués peuvent apparaître avec la prise de poids progressive.'],
        toKnow: ['Observer les périodes d’activité et de calme du bébé aide à connaître son rythme propre.'],
      },
      en: {
        babyDescription:
          'The limbs are now well proportioned. The baby practices breathing and begins alternating sleep and wake phases.',
        length: 'About 28.9 cm',
        comparison: 'Large mango',
        bodyChanges: ['More pronounced back pain may appear with gradual weight gain.'],
        toKnow: ['Observing the baby’s active and quiet periods helps you learn their own rhythm.'],
      },
    },
  },
  {
    week: 24,
    babyImage: require('../assets/images/pregnancy/development/week-24.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le bébé atteint le seuil de viabilité : en cas de naissance très prématurée à ce stade, une prise en charge médicale spécialisée en néonatalogie peut permettre la survie, avec un accompagnement adapté.',
        length: 'Environ 30 cm',
        comparison: 'Épi de maïs',
        bodyChanges: ['Une pression accrue sur la vessie et des envies fréquentes d’uriner peuvent apparaître.'],
        toKnow: ['Le dépistage du diabète gestationnel est généralement proposé autour de cette période.'],
      },
      en: {
        babyDescription:
          'The baby reaches the threshold of viability: in the event of a very premature birth at this stage, specialized neonatal medical care can allow for survival, with appropriate support.',
        length: 'About 30 cm',
        comparison: 'Ear of corn',
        bodyChanges: ['Increased pressure on the bladder and frequent urges to urinate may appear.'],
        toKnow: ['Gestational diabetes screening is generally offered around this time.'],
      },
    },
  },
  {
    week: 25,
    babyImage: require('../assets/images/pregnancy/development/week-25.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le bébé réagit désormais aux bruits forts par un sursaut ou un coup de pied, et un hoquet occasionnel peut être ressenti. Il urine régulièrement dans le liquide amniotique.',
        length: 'Environ 34,6 cm',
        comparison: 'Courgette',
        bodyChanges: ['Des brûlures d’estomac ou des remontées acides peuvent devenir plus fréquentes.'],
        toKnow: ['Un hoquet fœtal ressenti de temps en temps est généralement considéré comme normal.'],
      },
      en: {
        babyDescription:
          'The baby now reacts to loud noises with a startle or a kick, and occasional hiccups may be felt. They urinate regularly into the amniotic fluid.',
        length: 'About 34.6 cm',
        comparison: 'Zucchini',
        bodyChanges: ['Heartburn or acid reflux may become more frequent.'],
        toKnow: ['Fetal hiccups felt from time to time are generally considered normal.'],
      },
    },
  },
  {
    week: 26,
    babyImage: require('../assets/images/pregnancy/development/week-26.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription: 'Les yeux s’ouvrent pour la première fois. La couleur définitive des yeux ne sera généralement connue que plusieurs mois après la naissance.',
        length: 'Environ 35,6 cm',
        comparison: 'Concombre',
        bodyChanges: ['Un gonflement léger des chevilles ou des pieds peut apparaître, en particulier en fin de journée.'],
        toKnow: ['Le troisième trimestre approche, avec un suivi médical qui devient généralement plus fréquent.'],
      },
      en: {
        babyDescription: 'The eyes open for the first time. Their final color generally won’t be known until several months after birth.',
        length: 'About 35.6 cm',
        comparison: 'Cucumber',
        bodyChanges: ['Mild swelling of the ankles or feet may appear, particularly by the end of the day.'],
        toKnow: ['The third trimester is approaching, with medical follow-up generally becoming more frequent.'],
      },
    },
  },
  {
    week: 27,
    babyImage: require('../assets/images/pregnancy/development/week-27.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les poumons deviennent capables d’amorcer une respiration, et le bébé continue de prendre en rondeur à mesure que la graisse se dépose sous la peau.',
        length: 'Environ 36,6 cm',
        comparison: 'Chou-fleur',
        bodyChanges: ['La fatigue peut revenir à mesure que le corps porte un poids croissant.'],
        toKnow: ['Le début du troisième trimestre est souvent l’occasion de commencer à réfléchir au projet de naissance.'],
      },
      en: {
        babyDescription:
          'The lungs become capable of initiating breathing, and the baby continues filling out as fat deposits under the skin.',
        length: 'About 36.6 cm',
        comparison: 'Cauliflower',
        bodyChanges: ['Fatigue may return as your body carries a growing amount of weight.'],
        toKnow: ['The start of the third trimester is often a good time to start thinking about your birth plan.'],
      },
    },
  },

  // ---------------------------------------------------------- weeks 28–33 (early third trimester)
  {
    week: 28,
    babyImage: require('../assets/images/pregnancy/development/week-28.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le rythme cardiaque, plus rapide en tout début de grossesse, s’est stabilisé autour de 130 à 140 battements par minute et peut désormais s’entendre au stéthoscope.',
        length: 'Environ 37,6 cm',
        comparison: 'Aubergine',
        bodyChanges: ['Un essoufflement ou des brûlures d’estomac peuvent devenir plus fréquents à mesure que l’utérus prend de la place.'],
        toKnow: ['Le troisième trimestre débute généralement autour de cette semaine, avec des consultations qui se rapprochent.'],
      },
      en: {
        babyDescription:
          'The heart rate, faster in very early pregnancy, has stabilized at around 130 to 140 beats per minute and can now be heard with a stethoscope.',
        length: 'About 37.6 cm',
        comparison: 'Eggplant',
        bodyChanges: ['Shortness of breath or heartburn may become more frequent as the uterus takes up more space.'],
        toKnow: ['The third trimester generally begins around this week, with appointments becoming more frequent.'],
      },
    },
  },
  {
    week: 29,
    babyImage: require('../assets/images/pregnancy/development/week-29.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le bébé est déjà bien formé ; les prochaines semaines seront surtout consacrées à la maturation des organes et à la prise de poids. Le fin enduit protecteur qui recouvre sa peau commence à se résorber.',
        length: 'Environ 38,6 cm',
        comparison: 'Courge butternut',
        bodyChanges: ['Le sommeil peut devenir plus difficile à trouver, en raison de la taille grandissante du ventre.'],
        toKnow: ['Se reposer sur le côté gauche est souvent conseillé en fin de grossesse pour favoriser la circulation.'],
      },
      en: {
        babyDescription:
          'The baby is already well formed; the coming weeks will mainly be devoted to organ maturation and weight gain. The thin protective coating covering their skin begins to be reabsorbed.',
        length: 'About 38.6 cm',
        comparison: 'Butternut squash',
        bodyChanges: ['Sleep may become harder to find because of your growing belly.'],
        toKnow: ['Resting on your left side is often recommended in late pregnancy to support circulation.'],
      },
    },
  },
  {
    week: 30,
    babyImage: require('../assets/images/pregnancy/development/week-30.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'La vision continue de se développer ; à la naissance, le bébé pourra distinguer les visages proches, avant de progressivement apprendre à suivre des objets en mouvement.',
        length: 'Environ 39,9 cm',
        comparison: 'Chou',
        bodyChanges: ['Une sensation de lourdeur dans le bas du dos ou le bassin peut s’accentuer.'],
        toKnow: ['Les consultations prénatales deviennent généralement plus rapprochées à partir de ce stade.'],
      },
      en: {
        babyDescription:
          'Vision continues developing; at birth, the baby will be able to make out nearby faces, before gradually learning to track moving objects.',
        length: 'About 39.9 cm',
        comparison: 'Cabbage',
        bodyChanges: ['A feeling of heaviness in the lower back or pelvis may increase.'],
        toKnow: ['Prenatal appointments generally become more frequent from this stage onward.'],
      },
    },
  },
  {
    week: 31,
    babyImage: require('../assets/images/pregnancy/development/week-31.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le bébé bouge activement, suce parfois ses doigts et peut faire des mouvements amples. Sa peau devient moins fripée à mesure que la graisse s’accumule.',
        length: 'Environ 41,1 cm',
        comparison: 'Noix de coco',
        bodyChanges: ['Des contractions d’entraînement, dites de Braxton Hicks, peuvent commencer à se faire sentir occasionnellement.'],
        toKnow: ['Le bébé commence à reconnaître certaines voix familières entendues régulièrement depuis l’extérieur.'],
      },
      en: {
        babyDescription:
          'The baby moves actively, sometimes sucks their fingers, and can make broad movements. Their skin becomes less wrinkled as fat accumulates.',
        length: 'About 41.1 cm',
        comparison: 'Coconut',
        bodyChanges: ['Practice contractions, known as Braxton Hicks, may start being felt occasionally.'],
        toKnow: ['The baby is starting to recognize certain familiar voices heard regularly from outside.'],
      },
    },
  },
  {
    week: 32,
    babyImage: require('../assets/images/pregnancy/development/week-32.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le bébé est déjà bien formé et se positionne peu à peu tête en bas en vue de la naissance. Il continue surtout à prendre du poids durant les semaines restantes.',
        length: 'Environ 42,4 cm',
        comparison: 'Botte de céleri',
        bodyChanges: ['Une prise de poids plus marquée est courante durant cette période, en lien avec la croissance du bébé.'],
        toKnow: ['Le positionnement tête en bas (présentation céphalique) devient plus fréquent à l’approche du terme.'],
      },
      en: {
        babyDescription:
          'The baby is already well formed and is gradually settling head-down in preparation for birth. They mainly continue gaining weight during the remaining weeks.',
        length: 'About 42.4 cm',
        comparison: 'Bunch of celery',
        bodyChanges: ['More noticeable weight gain is common during this period, linked to the baby’s growth.'],
        toKnow: ['Head-down positioning (cephalic presentation) becomes more common as term approaches.'],
      },
    },
  },
  {
    week: 33,
    babyImage: require('../assets/images/pregnancy/development/week-33.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le cerveau et le système nerveux sont désormais bien développés. Les os continuent de se durcir, à l’exception de ceux du crâne, qui restent souples pour faciliter le passage lors de la naissance.',
        length: 'Environ 43,7 cm',
        comparison: 'Ananas',
        bodyChanges: ['Une gêne pour trouver une position confortable pour dormir est fréquente à ce stade.'],
        toKnow: ['La souplesse des os du crâne à la naissance est temporaire et se referme progressivement durant la première année.'],
      },
      en: {
        babyDescription:
          'The brain and nervous system are now well developed. The bones continue hardening, except for those of the skull, which stay flexible to make it easier to pass through during birth.',
        length: 'About 43.7 cm',
        comparison: 'Pineapple',
        bodyChanges: ['Difficulty finding a comfortable sleeping position is common at this stage.'],
        toKnow: ['The flexibility of the skull bones at birth is temporary and gradually closes up during the first year.'],
      },
    },
  },

  // ---------------------------------------------------------- weeks 34–40 (late third trimester)
  {
    week: 34,
    babyImage: require('../assets/images/pregnancy/development/week-34.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription: 'Le bébé, recroquevillé faute de place, garde généralement les jambes repliées vers la poitrine tout en continuant à bouger régulièrement.',
        length: 'Environ 45 cm',
        comparison: 'Melon cantaloup',
        bodyChanges: ['Malgré l’espace réduit, les mouvements du bébé et les changements de forme du ventre restent habituellement perceptibles.'],
        toKnow: ['Continuer à surveiller les mouvements habituels du bébé reste pertinent jusqu’à l’accouchement.'],
      },
      en: {
        babyDescription: 'The baby, curled up for lack of space, generally keeps their legs folded toward the chest while continuing to move regularly.',
        length: 'About 45 cm',
        comparison: 'Cantaloupe melon',
        bodyChanges: ['Despite the reduced space, the baby’s movements and the changing shape of your belly usually remain noticeable.'],
        toKnow: ['Continuing to pay attention to the baby’s usual movements remains relevant right up until birth.'],
      },
    },
  },
  {
    week: 35,
    babyImage: require('../assets/images/pregnancy/development/week-35.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription: 'Le bébé continue de s’arrondir, ce qui l’aidera à réguler sa température une fois né. L’espace disponible dans l’utérus devient plus limité.',
        length: 'Environ 46,2 cm',
        comparison: 'Melon miel',
        bodyChanges: ['Une pression pelvienne plus marquée peut apparaître à mesure que le bébé descend progressivement.'],
        toKnow: ['Malgré l’espace restreint, le bébé doit continuer à bouger avec une régularité similaire aux semaines précédentes.'],
      },
      en: {
        babyDescription: 'The baby keeps filling out, which will help them regulate their temperature once born. The available space in the uterus becomes more limited.',
        length: 'About 46.2 cm',
        comparison: 'Honeydew melon',
        bodyChanges: ['More pronounced pelvic pressure may appear as the baby gradually descends.'],
        toKnow: ['Despite the limited space, the baby should continue moving with a regularity similar to previous weeks.'],
      },
    },
  },
  {
    week: 36,
    babyImage: require('../assets/images/pregnancy/development/week-36.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les poumons ont généralement suffisamment mûri pour permettre une respiration autonome, et le bébé est capable de téter et de digérer.',
        length: 'Environ 47,4 cm',
        comparison: 'Laitue romaine',
        bodyChanges: ['Une respiration parfois plus courte peut être ressentie, l’utérus prenant beaucoup de place sous les côtes.'],
        toKnow: ['La grossesse est considérée à terme entre la semaine 37 et la semaine 42.'],
      },
      en: {
        babyDescription:
          'The lungs have generally matured enough to allow independent breathing, and the baby is able to suck and digest.',
        length: 'About 47.4 cm',
        comparison: 'Romaine lettuce',
        bodyChanges: ['You may sometimes feel shorter of breath, as the uterus takes up a lot of space under the ribs.'],
        toKnow: ['Pregnancy is considered full term between week 37 and week 42.'],
      },
    },
  },
  {
    week: 37,
    babyImage: require('../assets/images/pregnancy/development/week-37.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription: 'Le bébé est considéré comme suffisamment mature pour naître. La grande majorité des bébés se positionnent désormais tête en bas.',
        length: 'Environ 48,6 cm',
        comparison: 'Poireau',
        bodyChanges: ['Une sensation de pression pelvienne croissante est fréquente à mesure que le bébé s’engage dans le bassin.'],
        toKnow: ['À partir de cette semaine, le terme est considéré comme atteint et la naissance peut survenir à tout moment.'],
      },
      en: {
        babyDescription: 'The baby is considered mature enough to be born. The large majority of babies are now positioned head-down.',
        length: 'About 48.6 cm',
        comparison: 'Leek',
        bodyChanges: ['A feeling of growing pelvic pressure is common as the baby engages in the pelvis.'],
        toKnow: ['From this week on, term is considered reached and birth can happen at any time.'],
      },
    },
  },
  {
    week: 38,
    babyImage: require('../assets/images/pregnancy/development/week-38.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription: 'Le duvet fin qui recouvrait la peau a en grande partie disparu, et les intestins accumulent le méconium, les premières selles du nouveau-né.',
        length: 'Environ 49,8 cm',
        comparison: 'Tige de rhubarbe',
        bodyChanges: ['Se familiariser avec les signes annonçant le travail peut être utile à l’approche de la naissance.'],
        toKnow: ['Un accouchement programmé, lorsqu’il est envisagé sans indication médicale, n’est généralement pas recommandé avant la 39e semaine.'],
      },
      en: {
        babyDescription: 'The fine down that covered the skin has largely disappeared, and the intestines are accumulating meconium, the newborn’s first stool.',
        length: 'About 49.8 cm',
        comparison: 'Rhubarb stalk',
        bodyChanges: ['Getting familiar with the signs of labor can be useful as birth approaches.'],
        toKnow: ['A scheduled birth, when considered without a medical indication, is generally not recommended before week 39.'],
      },
    },
  },
  {
    week: 39,
    babyImage: require('../assets/images/pregnancy/development/week-39.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'La peau, auparavant plus fine, s’est épaissie et protège désormais mieux le bébé. Un enduit protecteur, le vernix, facilite aussi son passage lors de la naissance.',
        length: 'Environ 50,7 cm',
        comparison: 'Pastèque',
        bodyChanges: ['L’impatience et une certaine fatigue sont fréquentes à l’approche de la date prévue.'],
        toKnow: ['La circulation sanguine du nouveau-né continue de s’ajuster juste après la naissance, ce qui peut donner temporairement des mains ou des pieds légèrement bleutés.'],
      },
      en: {
        babyDescription:
          'The skin, previously thinner, has thickened and now protects the baby better. A protective coating, the vernix, also eases their passage during birth.',
        length: 'About 50.7 cm',
        comparison: 'Watermelon',
        bodyChanges: ['Impatience and a certain amount of fatigue are common as the due date approaches.'],
        toKnow: ['The newborn’s blood circulation continues adjusting just after birth, which can temporarily give the hands or feet a slightly bluish tinge.'],
      },
    },
  },
  {
    week: 40,
    babyImage: require('../assets/images/pregnancy/development/week-40.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le bébé est pleinement développé et prêt à naître. La date prévue d’accouchement est une estimation : beaucoup de naissances ont lieu dans les jours qui l’entourent, avant ou après.',
        length: 'Environ 51,2 cm',
        comparison: 'Citrouille',
        bodyChanges: ['L’attente de signes de travail (contractions régulières, perte des eaux) est fréquente durant cette période.'],
        toKnow: ['Dépasser légèrement la date prévue reste courant et ne signifie pas nécessairement qu’il y a un problème ; un suivi rapproché est généralement proposé.'],
      },
      en: {
        babyDescription:
          'The baby is fully developed and ready to be born. The due date is an estimate: many births happen in the days surrounding it, before or after.',
        length: 'About 51.2 cm',
        comparison: 'Pumpkin',
        bodyChanges: ['Waiting for signs of labor (regular contractions, water breaking) is common during this period.'],
        toKnow: ['Going slightly past the due date remains common and doesn’t necessarily mean there’s a problem; closer monitoring is generally offered.'],
      },
    },
  },

  // ---------------------------------------------------------- week 41 (post-term)
  // No NHS Start4Life page exists beyond week 40 with a published length
  // figure — none is fabricated here.
  {
    week: 41,
    babyImage: require('../assets/images/pregnancy/development/week-41.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le bébé reste pleinement développé. Au-delà de la date prévue, un suivi plus rapproché est généralement proposé pour surveiller le bien-être du bébé.',
        bodyChanges: ['L’attente prolongée peut s’accompagner d’une fatigue et d’une impatience accrues.'],
        toKnow: ['Un dépassement de terme fait généralement l’objet d’une surveillance renforcée par l’équipe médicale.'],
      },
      en: {
        babyDescription:
          'The baby remains fully developed. Beyond the due date, closer monitoring is generally offered to check on the baby’s wellbeing.',
        bodyChanges: ['The prolonged wait may come with increased fatigue and impatience.'],
        toKnow: ['Going past term generally leads to increased monitoring by the medical team.'],
      },
    },
  },
];

// PHASE 7M: default matches the app's English-first default (both real
// callers — PregnancyDashboard.tsx, PregnancyWeekScreen.tsx — already pass an
// explicit, normalized `lang` derived from i18n.language, so this default is
// only ever exercised by a caller that omits it, e.g. a test).
export function getPregnancyWeekData(week: number, lang: 'fr' | 'en' = 'en'): PregnancyWeekData | undefined {
  const entry = PREGNANCY_WEEK_DATA.find(item => item.week === week);
  if (!entry) {
    return undefined;
  }
  const content = lang === 'en' ? entry.content.en : entry.content.fr;
  return {
    week: entry.week,
    babyImage: entry.babyImage,
    sourceRefs: entry.sourceRefs,
    ...content,
  };
}
