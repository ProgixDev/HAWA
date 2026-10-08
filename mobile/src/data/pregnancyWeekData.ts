import type {ImageSourcePropType} from 'react-native';

import {resolveEditorialLanguage, type EditorialLanguage} from '../i18n/editorialLanguage';

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
//
// SPANISH EDITORIAL CONTENT: the `es` object per week is a complete,
// independent translation of the French original (the source language),
// never of the English text. Same careful, non-literal medical-translation
// discipline as English: "peut"/"peuvent" always render as "puede"/"pueden"
// (never a stronger claim), every numeric value is preserved exactly (only
// the decimal separator is localized, comma stays a comma as in French —
// matching established Spanish numeric formatting elsewhere in the app, e.g.
// "64,2 kg" in src/i18n/locales/es.ts), and each week's `es` object has
// exactly the same fields present as that week's `fr`/`en` objects (no
// invented `comparison` for weeks 1–3/41, no `weight` anywhere).
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
    es: PregnancyWeekEditorialContent;
    it: PregnancyWeekEditorialContent;
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
      es: {
        babyDescription:
          'El embarazo se calcula a partir del primer día de tu última regla, por convención médica. En esta etapa, la fecundación generalmente todavía no ha tenido lugar.',
        bodyChanges: [
          'Este periodo suele preceder a la concepción; habitualmente todavía no hay ningún cambio físico relacionado con el embarazo.',
        ],
        toKnow: [
          'Contar el embarazo desde la última regla permite estimar una fecha prevista de parto de forma estandarizada, aunque la concepción ocurra en realidad un poco más tarde.',
          'Es habitual no notar ningún cambio en esta etapa.',
        ],
      },
      it: {
        babyDescription: 'Per convenzione medica, la gravidanza si data a partire dal primo giorno dell’ultima mestruazione. In questa fase, di solito, la fecondazione non è ancora avvenuta.',
        bodyChanges: [
          'Questo periodo precede in genere il concepimento; di solito non c’è ancora alcun cambiamento fisico legato alla gravidanza.',
        ],
        toKnow: [
          'Contare la gravidanza dall’ultima mestruazione offre un modo standardizzato per stimare la data presunta del parto, anche se il concepimento avviene in realtà un po’ più tardi.',
          'È normale non notare alcun cambiamento in questa fase.',
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
      es: {
        babyDescription:
          'La ovulación y una posible fecundación suelen producirse alrededor de este periodo, según la duración del ciclo de cada mujer.',
        bodyChanges: [
          'El momento de la ovulación puede variar según la duración del ciclo, lo que influye en la fecha real posible de la concepción.',
          'En esta etapa generalmente todavía no hay ningún cambio físico específico del embarazo.',
        ],
        toKnow: ['El momento exacto de la ovulación varía de una persona a otra, lo que explica por qué este periodo sigue siendo una estimación.'],
      },
      it: {
        babyDescription: 'L’ovulazione e l’eventuale fecondazione avvengono in genere in questo periodo, a seconda della durata del ciclo di ciascuna donna.',
        bodyChanges: [
          'Il momento dell’ovulazione può variare in base alla durata del ciclo, e questo influisce sulla data effettiva del possibile concepimento.',
          'In questa fase, di solito non c’è ancora alcun cambiamento fisico specifico della gravidanza.',
        ],
        toKnow: [
          'Il momento esatto dell’ovulazione varia da donna a donna, ed è per questo che questo periodo resta una stima.',
        ],
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
      es: {
        babyDescription:
          'Si ha habido fecundación, el óvulo fecundado comienza a dividirse y a desplazarse hacia el útero, pero todavía no se puede detectar nada con una prueba de embarazo.',
        bodyChanges: [
          'Esta semana todavía se sitúa dentro del periodo de datación médica en torno a la concepción; en esta etapa generalmente no hay ningún signo físico perceptible.',
        ],
        toKnow: ['La mayoría de las pruebas de embarazo en orina empiezan a ser fiables aproximadamente a partir de la semana siguiente, una vez iniciada la implantación.'],
      },
      it: {
        babyDescription: 'Se la fecondazione è avvenuta, l’ovulo inizia a dividersi e a spostarsi verso l’utero, ma per ora un test di gravidanza non rileva ancora nulla.',
        bodyChanges: [
          'Questa settimana rientra ancora nel periodo di datazione medica che circonda il concepimento; in genere in questa fase non si nota alcun segno fisico.',
        ],
        toKnow: [
          'La maggior parte dei test di gravidanza sulle urine diventa affidabile a partire dalla settimana successiva circa, quando l’impianto è iniziato.',
        ],
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
      es: {
        babyDescription:
          'El embrión acaba de implantarse en la pared del útero. El saco amniótico y el saco vitelino, que lo nutrirá al principio, se están formando.',
        length: 'Aproximadamente 2 mm',
        comparison: 'Semilla de amapola',
        bodyChanges: [
          'Algunas personas todavía no notan ningún signo en esta etapa tan temprana.',
          'Una prueba de embarazo en orina generalmente puede detectar el embarazo a partir de esta semana.',
        ],
        toKnow: ['Este es el momento habitual en el que una prueba de embarazo puede empezar a dar un resultado positivo.'],
      },
      it: {
        babyDescription: 'L’embrione si è appena impiantato nella parete dell’utero. Si stanno formando il sacco amniotico e il sacco vitellino, che lo nutrirà nei primissimi giorni.',
        length: 'Circa 2 mm',
        comparison: 'Seme di papavero',
        bodyChanges: [
          'Alcune donne non notano ancora alcun segno in questa fase così precoce.',
          'Un test di gravidanza sulle urine può in genere rilevare la gravidanza a partire da questa settimana.',
        ],
        toKnow: [
          'È il momento in cui, di solito, un test di gravidanza può iniziare a dare un risultato positivo.',
        ],
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
      es: {
        babyDescription:
          'El sistema nervioso comienza a formarse y el corazón, todavía diminuto, está a punto de latir por primera vez.',
        length: 'Aproximadamente 2 mm',
        comparison: 'Semilla de sésamo',
        bodyChanges: ['Puede aparecer un cansancio inusual, náuseas leves o sensibilidad en el pecho.'],
        toKnow: ['Este es el momento recomendado para pedir cita con un profesional de la salud y comenzar el seguimiento del embarazo.'],
      },
      it: {
        babyDescription: 'Il sistema nervoso comincia a formarsi e il cuore, ancora minuscolo, sta per battere per la prima volta.',
        length: 'Circa 2 mm',
        comparison: 'Seme di sesamo',
        bodyChanges: [
          'Possono comparire stanchezza insolita, lieve nausea o tensione al seno.',
        ],
        toKnow: [
          'È il momento consigliato per fissare un appuntamento con un professionista sanitario e iniziare il percorso di assistenza in gravidanza.',
        ],
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
      es: {
        babyDescription:
          'Aparecen los primeros esbozos de los brazos y las piernas, así como pequeñas marcas donde se formarán las orejas. A veces ya puede detectarse el corazón mediante una ecografía.',
        length: 'Aproximadamente 6 mm',
        comparison: 'Guisante',
        bodyChanges: ['Las náuseas y el cansancio pueden intensificarse en algunas personas durante este periodo.'],
        toKnow: ['A veces puede verse actividad cardiaca ya desde esta semana en una ecografía precoz.'],
      },
      it: {
        babyDescription: 'Compaiono i primi abbozzi di braccia e gambe, insieme a piccole rientranze dove si formeranno le orecchie. Il cuore può a volte essere già rilevato con l’ecografia.',
        length: 'Circa 6 mm',
        comparison: 'Pisello',
        bodyChanges: [
          'In questo periodo, per alcune donne nausea e stanchezza possono intensificarsi.',
        ],
        toKnow: [
          'L’attività del cuore può a volte essere visibile già da questa settimana con un’ecografia precoce.',
        ],
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
      es: {
        babyDescription:
          'El cerebro se desarrolla más rápido que el resto del cuerpo, lo que da una frente prominente. Empiezan a aparecer pequeños esbozos de manos en el extremo de los brazos.',
        length: 'Aproximadamente 10 mm',
        comparison: 'Grano de uva',
        bodyChanges: ['Son posibles antojos alimentarios particulares o, por el contrario, aversiones a ciertos alimentos.'],
        toKnow: ['El tubo neural, origen del cerebro y la médula espinal, continúa cerrándose durante estas semanas.'],
      },
      it: {
        babyDescription: 'Il cervello si sviluppa più velocemente del resto del corpo, dando al bambino una fronte prominente. Alle estremità delle braccia iniziano a comparire i piccoli abbozzi delle mani.',
        length: 'Circa 10 mm',
        comparison: 'Acino d’uva',
        bodyChanges: [
          'Sono possibili voglie particolari oppure, al contrario, avversioni per certi cibi.',
        ],
        toKnow: [
          'Il tubo neurale, da cui hanno origine il cervello e il midollo spinale, continua a chiudersi durante queste settimane.',
        ],
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
      es: {
        babyDescription:
          'El embrión pasa ahora a llamarse feto. Los brazos se alargan, la cabeza empieza a enderezarse ligeramente y la placenta continúa formándose.',
        length: 'Aproximadamente 16 mm',
        comparison: 'Frambuesa',
        bodyChanges: ['La sensibilidad a los olores y las náuseas matutinas son frecuentes en esta etapa, sin ser sistemáticas.'],
        toKnow: ['La primera ecografía de datación suele programarse entre la semana 8 y la semana 14.'],
      },
      it: {
        babyDescription: 'L’embrione ora viene chiamato feto. Le braccia si allungano, la testa comincia a raddrizzarsi leggermente e la placenta continua a formarsi.',
        length: 'Circa 16 mm',
        comparison: 'Lampone',
        bodyChanges: [
          'In questa fase sono frequenti, anche se non per tutte, la sensibilità agli odori e la nausea mattutina.',
        ],
        toKnow: [
          'La prima ecografia di datazione è in genere programmata tra la settimana 8 e la settimana 14.',
        ],
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
      es: {
        babyDescription:
          'Los rasgos del rostro se precisan, los párpados protegen los ojos, y las manos y los pies van tomando forma con los futuros dedos.',
        length: 'Aproximadamente 22 mm',
        comparison: 'Fresa',
        bodyChanges: ['Todavía puede haber un cansancio marcado y náuseas; suelen tender a atenuarse hacia el final del primer trimestre.'],
        toKnow: ['Los órganos genitales apenas empiezan a diferenciarse, pero el sexo generalmente solo es identificable mucho más tarde, en la ecografía morfológica.'],
      },
      it: {
        babyDescription: 'I tratti del viso diventano più definiti, le palpebre proteggono gli occhi e le mani e i piedi prendono forma, con le future dita.',
        length: 'Circa 22 mm',
        comparison: 'Fragola',
        bodyChanges: [
          'Stanchezza marcata e nausea possono essere ancora presenti; spesso tendono ad attenuarsi verso la fine del primo trimestre.',
        ],
        toKnow: [
          'Gli organi genitali stanno appena iniziando a differenziarsi, ma in genere il sesso non è identificabile fino a molto più tardi, con l’ecografia morfologica.',
        ],
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
      es: {
        babyDescription:
          'El rostro se vuelve más reconocible, los párpados reaccionan a la luz y el corazón late a un ritmo rápido, aproximadamente tres veces más rápido que el de un adulto.',
        length: 'Aproximadamente 30 mm',
        comparison: 'Albaricoque pequeño',
        bodyChanges: ['Tu contorno de cintura puede empezar a cambiar ligeramente, aunque el vientre generalmente todavía no es visible.'],
        toKnow: ['El cribado combinado del primer trimestre, cuando se ofrece, suele realizarse entre la semana 11 y la semana 14.'],
      },
      it: {
        babyDescription: 'Il viso diventa più riconoscibile, le palpebre reagiscono alla luce e il cuore batte a un ritmo veloce, circa tre volte più rapido di quello di un adulto.',
        length: 'Circa 30 mm',
        comparison: 'Piccola albicocca',
        bodyChanges: [
          'La vita può iniziare a cambiare leggermente, anche se in genere la pancia non è ancora visibile.',
        ],
        toKnow: [
          'Il test combinato del primo trimestre, quando viene proposto, si esegue in genere tra la settimana 11 e la settimana 14.',
        ],
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
      es: {
        babyDescription:
          'Los dedos de las manos y los pies se separan, aparecen diminutas uñas, y la placenta va asumiendo progresivamente el papel del saco vitelino para nutrir al feto.',
        length: 'Aproximadamente 41 mm',
        comparison: 'Higo',
        bodyChanges: ['Es posible notar cambios de humor, relacionados en particular con las variaciones hormonales.'],
        toKnow: ['Los movimientos del bebé comienzan, pero generalmente todavía no se sienten en esta etapa.'],
      },
      it: {
        babyDescription: 'Le dita delle mani e dei piedi si separano, compaiono minuscole unghie e la placenta subentra gradualmente al sacco vitellino nel nutrire il feto.',
        length: 'Circa 41 mm',
        comparison: 'Fico',
        bodyChanges: [
          'Potresti notare sbalzi d’umore, legati in particolare ai cambiamenti ormonali.',
        ],
        toKnow: [
          'I movimenti del bambino stanno iniziando, ma in genere in questa fase non si avvertono ancora.',
        ],
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
      es: {
        babyDescription:
          'Los órganos internos y los músculos han crecido bien, y el esqueleto empieza a osificarse. Los órganos reproductores se han formado, aunque todavía no son visibles en la ecografía.',
        length: 'Aproximadamente 5,4 cm',
        comparison: 'Ciruela',
        bodyChanges: ['Las náuseas suelen tender a atenuarse progresivamente en torno a este periodo, aunque esto varía mucho de una persona a otra.'],
        toKnow: ['El final del primer trimestre suele asociarse a una disminución del riesgo de aborto espontáneo en comparación con las semanas anteriores.'],
      },
      it: {
        babyDescription: 'Gli organi interni e i muscoli sono cresciuti bene e lo scheletro comincia a ossificarsi. Gli organi riproduttivi si sono formati, anche se non sono ancora visibili all’ecografia.',
        length: 'Circa 5,4 cm',
        comparison: 'Prugna',
        bodyChanges: [
          'La nausea tende spesso ad attenuarsi gradualmente in questo periodo, anche se varia molto da donna a donna.',
        ],
        toKnow: [
          'La fine del primo trimestre viene spesso associata a un rischio di aborto spontaneo più basso rispetto alle settimane precedenti.',
        ],
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
      es: {
        babyDescription:
          'Los movimientos, todavía entrecortados, se vuelven un poco más coordinados. Algunos bebés ya esbozan un reflejo de succión del pulgar.',
        length: 'Aproximadamente 7,4 cm',
        comparison: 'Melocotón',
        bodyChanges: ['Muchas personas recuperan progresivamente algo más de energía a medida que se acerca el segundo trimestre.'],
        toKnow: ['El primer trimestre suele terminar alrededor de esta semana; el seguimiento continúa con consultas más espaciadas.'],
      },
      it: {
        babyDescription: 'I movimenti, ancora a scatti, diventano un po’ più coordinati. Alcuni bambini mostrano già il riflesso di succhiarsi il pollice.',
        length: 'Circa 7,4 cm',
        comparison: 'Pesca',
        bodyChanges: [
          'Molte donne recuperano gradualmente un po’ più di energia con l’avvicinarsi del secondo trimestre.',
        ],
        toKnow: [
          'Il primo trimestre termina in genere intorno a questa settimana; l’assistenza prosegue con appuntamenti più distanziati.',
        ],
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
      es: {
        babyDescription:
          'La cabeza se redondea y se proporciona cada vez más con el resto del cuerpo. El feto traga un poco de líquido amniótico, que pasa por el estómago y los riñones.',
        length: 'Aproximadamente 8,5 cm',
        comparison: 'Kiwi',
        bodyChanges: ['El vientre empieza a redondearse de forma más visible en algunas personas.'],
        toKnow: ['Un profesional de la salud a veces puede empezar a oír el ritmo cardiaco con un aparato de ultrasonidos colocado sobre el vientre.'],
      },
      it: {
        babyDescription: 'La testa diventa più rotonda e più proporzionata al resto del corpo. Il feto ingerisce un po’ di liquido amniotico, che passa attraverso lo stomaco e i reni.',
        length: 'Circa 8,5 cm',
        comparison: 'Kiwi',
        bodyChanges: [
          'Per alcune donne la pancia inizia ad arrotondarsi in modo più visibile.',
        ],
        toKnow: [
          'Un professionista sanitario può a volte iniziare a sentire il battito cardiaco con un apparecchio a ultrasuoni appoggiato sulla pancia.',
        ],
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
      es: {
        babyDescription:
          'Un vello fino llamado lanugo va cubriendo progresivamente la piel, y empiezan a aparecer las cejas y las pestañas. Los ojos se vuelven sensibles a la luz.',
        length: 'Aproximadamente 10,1 cm',
        comparison: 'Manzana',
        bodyChanges: ['El apetito puede cambiar, a veces con nuevos antojos o aversiones alimentarias.'],
        toKnow: ['La audición empieza a desarrollarse hacia este periodo: tu voz y los sonidos internos del cuerpo se vuelven progresivamente perceptibles.'],
      },
      it: {
        babyDescription: 'Una lanugine sottile chiamata lanugo ricopre gradualmente la pelle e iniziano a comparire sopracciglia e ciglia. Gli occhi diventano sensibili alla luce.',
        length: 'Circa 10,1 cm',
        comparison: 'Mela',
        bodyChanges: [
          'Il tuo appetito può cambiare, a volte con nuove voglie o avversioni per certi cibi.',
        ],
        toKnow: [
          'L’udito comincia a svilupparsi in questo periodo: la tua voce e i suoni interni del corpo diventano gradualmente percepibili.',
        ],
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
      es: {
        babyDescription: 'El sistema nervioso permite movimientos de los brazos y las piernas. Las manos pueden cerrarse formando pequeños puños.',
        length: 'Aproximadamente 11,6 cm',
        comparison: 'Aguacate',
        bodyChanges: ['Algunas personas empiezan a notar movimientos muy ligeros a partir de este periodo, a menudo descritos como un aleteo.'],
        toKnow: ['Sentir los primeros movimientos varía mucho de un embarazo a otro, en particular según se trate o no de un primer embarazo.'],
      },
      it: {
        babyDescription: 'Il sistema nervoso permette i movimenti di braccia e gambe. Le mani possono chiudersi in piccoli pugni.',
        length: 'Circa 11,6 cm',
        comparison: 'Avocado',
        bodyChanges: [
          'Alcune donne iniziano ad avvertire movimenti molto leggeri a partire da questo periodo, spesso descritti come un battito d’ali.',
        ],
        toKnow: [
          'Avvertire i primi movimenti varia molto da una gravidanza all’altra, in particolare a seconda che si tratti o meno di una prima gravidanza.',
        ],
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
      es: {
        babyDescription:
          'Los ojos, todavía cerrados, pueden moverse, y el bebé ahora reacciona a los sonidos fuertes. Las huellas digitales empiezan a formarse.',
        length: 'Aproximadamente 12 cm',
        comparison: 'Granada',
        bodyChanges: ['Pueden aparecer dolores de espalda leves a medida que cambia tu centro de gravedad.'],
        toKnow: ['Los sonidos externos empiezan a percibirse, de forma amortiguada, a través del líquido amniótico.'],
      },
      it: {
        babyDescription: 'Gli occhi, ancora chiusi, possono muoversi e il bambino ora reagisce ai suoni forti. Le impronte digitali iniziano a formarsi.',
        length: 'Circa 12 cm',
        comparison: 'Melograno',
        bodyChanges: [
          'Può comparire un lieve mal di schiena, dovuto allo spostamento del tuo baricentro.',
        ],
        toKnow: [
          'I suoni esterni iniziano a essere percepiti, in forma attutita, attraverso il liquido amniotico.',
        ],
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
      es: {
        babyDescription:
          'La audición, el tacto, la deglución y el reflejo de succión siguen desarrollándose. El bebé se vuelve cada vez más activo, con más movimientos de brazos y piernas.',
        length: 'Aproximadamente 14,2 cm',
        comparison: 'Pimiento',
        bodyChanges: ['El vientre suele ser bien visible en esta etapa, y tu centro de gravedad continúa desplazándose.'],
        toKnow: ['La ecografía morfológica, que examina el desarrollo general del bebé, suele ofrecerse entre la semana 18 y la semana 21.'],
      },
      it: {
        babyDescription: 'Udito, tatto, deglutizione e riflesso di suzione continuano a svilupparsi. Il bambino è sempre più attivo, con più movimenti di braccia e gambe.',
        length: 'Circa 14,2 cm',
        comparison: 'Peperone',
        bodyChanges: [
          'In questa fase la pancia è spesso ben visibile e il tuo baricentro continua a spostarsi.',
        ],
        toKnow: [
          'L’ecografia morfologica, che esamina lo sviluppo complessivo del bambino, viene in genere proposta tra la settimana 18 e la settimana 21.',
        ],
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
      es: {
        babyDescription:
          'Los futuros dientes definitivos empiezan a formarse detrás de los dientes de leche en preparación, y el bebé sigue ganando peso progresivamente.',
        length: 'Aproximadamente 15,3 cm',
        comparison: 'Tomate grande',
        bodyChanges: ['Puede aparecer una sensación de tirón en los laterales del vientre (dolor ligamentoso) a medida que crece el útero.'],
        toKnow: ['Este es un periodo frecuente para empezar a sentir con más claridad los movimientos del bebé.'],
      },
      it: {
        babyDescription: 'I futuri denti permanenti iniziano a formarsi dietro i denti da latte in preparazione, e il bambino continua ad aumentare gradualmente di peso.',
        length: 'Circa 15,3 cm',
        comparison: 'Pomodoro grande',
        bodyChanges: [
          'Con la crescita dell’utero può comparire una sensazione di tiraggio ai lati della pancia (dolore ai legamenti rotondi).',
        ],
        toKnow: [
          'È un momento frequente in cui si iniziano ad avvertire più distintamente i movimenti del bambino.',
        ],
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
      es: {
        babyDescription:
          'A partir de esta semana, la longitud se mide de la cabeza a los talones en lugar de la cabeza a la parte baja de la espalda, ya que las piernas ahora están extendidas y se pueden medir — esto explica un aumento visible de la talla de referencia respecto a las semanas anteriores.',
        length: 'Aproximadamente 25,6 cm',
        comparison: 'Plátano',
        bodyChanges: ['El vientre bien redondeado puede empezar a modificar tu equilibrio y tu postura.'],
        toKnow: ['La mitad del embarazo suele marcarse con un chequeo completo con el profesional de la salud que lleva tu seguimiento.'],
      },
      it: {
        babyDescription: 'Da questa settimana la lunghezza viene misurata dalla testa al tallone anziché dalla testa al sedere, perché ora le gambe possono essere distese e misurate: questo spiega un evidente salto della misura di riferimento rispetto alle settimane precedenti.',
        length: 'Circa 25,6 cm',
        comparison: 'Banana',
        bodyChanges: [
          'La tua pancia ormai ben arrotondata può iniziare a influire sull’equilibrio e sulla postura.',
        ],
        toKnow: [
          'La metà della gravidanza è spesso segnata da un controllo completo con il professionista sanitario che ti segue.',
        ],
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
      es: {
        babyDescription: 'Los movimientos se vuelven más claros y coordinados, y es frecuente empezar a sentirlos bien durante este periodo.',
        length: 'Aproximadamente 26,7 cm',
        comparison: 'Zanahoria',
        bodyChanges: ['Puede aparecer una ligera falta de aliento al hacer esfuerzos, a medida que el útero ocupa más espacio.'],
        toKnow: ['Familiarizarte con el ritmo habitual de los movimientos del bebé te ayuda a detectar mejor un cambio inusual.'],
      },
      it: {
        babyDescription: 'I movimenti diventano più chiari e più coordinati ed è normale iniziare ad avvertirli chiaramente in questo periodo.',
        length: 'Circa 26,7 cm',
        comparison: 'Carota',
        bodyChanges: [
          'Può comparire un lieve affanno sotto sforzo, perché l’utero occupa più spazio.',
        ],
        toKnow: [
          'Familiarizzare con il ritmo abituale dei movimenti del tuo bambino rende più facile accorgersi di un cambiamento insolito.',
        ],
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
      es: {
        babyDescription:
          'Los pulmones continúan desarrollándose y el bebé practica pequeños movimientos respiratorios. Las papilas gustativas también se están formando.',
        length: 'Aproximadamente 27,8 cm',
        comparison: 'Boniato',
        bodyChanges: ['Pueden aparecer calambres en las piernas, sobre todo por la noche, en algunas personas.'],
        toKnow: ['Lo que comes puede influir en el líquido amniótico, que el bebé traga regularmente.'],
      },
      it: {
        babyDescription: 'I polmoni continuano a svilupparsi e il bambino si esercita con piccoli movimenti respiratori. Si stanno formando anche le papille gustative.',
        length: 'Circa 27,8 cm',
        comparison: 'Patata dolce',
        bodyChanges: [
          'Per alcune donne sono possibili crampi alle gambe, soprattutto di notte.',
        ],
        toKnow: [
          'Ciò che mangi può influenzare il liquido amniotico, che il bambino deglutisce regolarmente.',
        ],
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
      es: {
        babyDescription:
          'Los miembros ya están bien proporcionados. El bebé practica la respiración y empieza a alternar fases de sueño y de vigilia.',
        length: 'Aproximadamente 28,9 cm',
        comparison: 'Mango grande',
        bodyChanges: ['Pueden aparecer dolores de espalda más marcados con el aumento de peso progresivo.'],
        toKnow: ['Observar los periodos de actividad y de calma del bebé te ayuda a conocer su propio ritmo.'],
      },
      it: {
        babyDescription: 'Gli arti sono ormai ben proporzionati. Il bambino si esercita a respirare e inizia ad alternare fasi di sonno e di veglia.',
        length: 'Circa 28,9 cm',
        comparison: 'Mango grande',
        bodyChanges: [
          'Con l’aumento graduale di peso può comparire un mal di schiena più marcato.',
        ],
        toKnow: [
          'Osservare i periodi di attività e di quiete del bambino ti aiuta a conoscere il suo ritmo.',
        ],
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
      es: {
        babyDescription:
          'El bebé alcanza el umbral de viabilidad: en caso de un nacimiento muy prematuro en esta etapa, una atención médica especializada en neonatología puede permitir la supervivencia, con un acompañamiento adecuado.',
        length: 'Aproximadamente 30 cm',
        comparison: 'Mazorca de maíz',
        bodyChanges: ['Puede aparecer una presión mayor sobre la vejiga y ganas frecuentes de orinar.'],
        toKnow: ['El cribado de la diabetes gestacional suele ofrecerse en torno a este periodo.'],
      },
      it: {
        babyDescription: 'Il bambino raggiunge la soglia di vitalità: in caso di nascita molto prematura in questa fase, cure neonatali specialistiche possono permettere la sopravvivenza, con un supporto adeguato.',
        length: 'Circa 30 cm',
        comparison: 'Pannocchia',
        bodyChanges: [
          'Possono comparire una maggiore pressione sulla vescica e frequenti stimoli a urinare.',
        ],
        toKnow: [
          'Lo screening del diabete gestazionale viene in genere proposto intorno a questo periodo.',
        ],
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
      es: {
        babyDescription:
          'El bebé ahora reacciona a los ruidos fuertes con un sobresalto o una patada, y a veces puede sentirse hipo ocasional. Orina regularmente en el líquido amniótico.',
        length: 'Aproximadamente 34,6 cm',
        comparison: 'Calabacín',
        bodyChanges: ['Pueden volverse más frecuentes los ardores de estómago o los reflujos ácidos.'],
        toKnow: ['Sentir hipo fetal de vez en cuando generalmente se considera normal.'],
      },
      it: {
        babyDescription: 'Ora il bambino reagisce ai rumori forti con un sobbalzo o un calcio e a volte si possono avvertire dei singhiozzi. Urina regolarmente nel liquido amniotico.',
        length: 'Circa 34,6 cm',
        comparison: 'Zucchina',
        bodyChanges: [
          'Bruciore di stomaco o reflusso acido possono diventare più frequenti.',
        ],
        toKnow: [
          'I singhiozzi del feto avvertiti di tanto in tanto sono in genere considerati normali.',
        ],
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
      es: {
        babyDescription:
          'Los ojos se abren por primera vez. El color definitivo de los ojos generalmente no se conocerá hasta varios meses después del nacimiento.',
        length: 'Aproximadamente 35,6 cm',
        comparison: 'Pepino',
        bodyChanges: ['Puede aparecer una hinchazón leve en los tobillos o los pies, especialmente al final del día.'],
        toKnow: ['El tercer trimestre se acerca, con un seguimiento médico que generalmente se vuelve más frecuente.'],
      },
      it: {
        babyDescription: 'Gli occhi si aprono per la prima volta. Il loro colore definitivo, in genere, non si conoscerà se non diversi mesi dopo la nascita.',
        length: 'Circa 35,6 cm',
        comparison: 'Cetriolo',
        bodyChanges: [
          'Può comparire un lieve gonfiore a caviglie o piedi, soprattutto verso la fine della giornata.',
        ],
        toKnow: [
          'Il terzo trimestre si avvicina e in genere il controllo medico diventa più frequente.',
        ],
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
      es: {
        babyDescription:
          'Los pulmones empiezan a ser capaces de iniciar una respiración, y el bebé sigue ganando redondez a medida que se deposita grasa bajo la piel.',
        length: 'Aproximadamente 36,6 cm',
        comparison: 'Coliflor',
        bodyChanges: ['El cansancio puede volver a medida que tu cuerpo carga con un peso creciente.'],
        toKnow: ['El inicio del tercer trimestre suele ser una buena ocasión para empezar a pensar en tu plan de parto.'],
      },
      it: {
        babyDescription: 'I polmoni diventano capaci di avviare la respirazione e il bambino continua a riempirsi man mano che il grasso si accumula sotto la pelle.',
        length: 'Circa 36,6 cm',
        comparison: 'Cavolfiore',
        bodyChanges: [
          'La stanchezza può ripresentarsi perché il tuo corpo porta un peso sempre maggiore.',
        ],
        toKnow: [
          'L’inizio del terzo trimestre è spesso un buon momento per iniziare a pensare al tuo piano del parto.',
        ],
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
      es: {
        babyDescription:
          'El ritmo cardiaco, más rápido al principio del embarazo, se ha estabilizado en torno a 130 a 140 latidos por minuto y ahora puede oírse con un estetoscopio.',
        length: 'Aproximadamente 37,6 cm',
        comparison: 'Berenjena',
        bodyChanges: ['La falta de aliento o los ardores de estómago pueden volverse más frecuentes a medida que el útero ocupa más espacio.'],
        toKnow: ['El tercer trimestre suele comenzar alrededor de esta semana, con consultas que se vuelven más seguidas.'],
      },
      it: {
        babyDescription: 'Il battito cardiaco, più rapido all’inizio della gravidanza, si è stabilizzato intorno a 130-140 battiti al minuto e ora può essere ascoltato con uno stetoscopio.',
        length: 'Circa 37,6 cm',
        comparison: 'Melanzana',
        bodyChanges: [
          'Affanno o bruciore di stomaco possono diventare più frequenti perché l’utero occupa più spazio.',
        ],
        toKnow: [
          'Il terzo trimestre inizia in genere intorno a questa settimana, con appuntamenti sempre più frequenti.',
        ],
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
      es: {
        babyDescription:
          'El bebé ya está bien formado; las próximas semanas se dedicarán sobre todo a la maduración de los órganos y al aumento de peso. La fina capa protectora que cubre su piel empieza a reabsorberse.',
        length: 'Aproximadamente 38,6 cm',
        comparison: 'Calabaza butternut',
        bodyChanges: ['Puede costar más conciliar el sueño, debido al tamaño cada vez mayor del vientre.'],
        toKnow: ['Descansar sobre el lado izquierdo suele recomendarse al final del embarazo para favorecer la circulación.'],
      },
      it: {
        babyDescription: 'Il bambino è già ben formato; le prossime settimane saranno dedicate soprattutto alla maturazione degli organi e all’aumento di peso. Il sottile rivestimento protettivo che ricopre la sua pelle comincia a essere riassorbito.',
        length: 'Circa 38,6 cm',
        comparison: 'Zucca butternut',
        bodyChanges: [
          'Può diventare più difficile dormire a causa della pancia sempre più grande.',
        ],
        toKnow: [
          'Nella gravidanza avanzata si consiglia spesso di riposare sul fianco sinistro per favorire la circolazione.',
        ],
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
      es: {
        babyDescription:
          'La visión sigue desarrollándose; al nacer, el bebé podrá distinguir los rostros cercanos, antes de aprender progresivamente a seguir objetos en movimiento.',
        length: 'Aproximadamente 39,9 cm',
        comparison: 'Col',
        bodyChanges: ['Puede acentuarse una sensación de pesadez en la parte baja de la espalda o en la pelvis.'],
        toKnow: ['Las consultas prenatales generalmente se vuelven más seguidas a partir de esta etapa.'],
      },
      it: {
        babyDescription: 'La vista continua a svilupparsi; alla nascita il bambino sarà in grado di distinguere i volti vicini, per poi imparare gradualmente a seguire gli oggetti in movimento.',
        length: 'Circa 39,9 cm',
        comparison: 'Cavolo',
        bodyChanges: [
          'Una sensazione di pesantezza nella parte bassa della schiena o nel bacino può aumentare.',
        ],
        toKnow: [
          'Da questa fase in poi, le visite prenatali in genere diventano più frequenti.',
        ],
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
      es: {
        babyDescription:
          'El bebé se mueve activamente, a veces se chupa los dedos y puede hacer movimientos amplios. Su piel se vuelve menos arrugada a medida que se acumula grasa.',
        length: 'Aproximadamente 41,1 cm',
        comparison: 'Coco',
        bodyChanges: ['Pueden empezar a sentirse ocasionalmente contracciones de entrenamiento, llamadas de Braxton Hicks.'],
        toKnow: ['El bebé empieza a reconocer algunas voces familiares que oye regularmente desde el exterior.'],
      },
      it: {
        babyDescription: 'Il bambino si muove attivamente, a volte si succhia le dita e può fare movimenti ampi. La sua pelle diventa meno rugosa man mano che si accumula il grasso.',
        length: 'Circa 41,1 cm',
        comparison: 'Noce di cocco',
        bodyChanges: [
          'Le contrazioni di allenamento, note come contrazioni di Braxton Hicks, possono iniziare a farsi sentire di tanto in tanto.',
        ],
        toKnow: [
          'Il bambino comincia a riconoscere alcune voci familiari che sente regolarmente dall’esterno.',
        ],
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
      es: {
        babyDescription:
          'El bebé ya está bien formado y se va colocando poco a poco con la cabeza hacia abajo de cara al nacimiento. Durante las semanas restantes, sobre todo continúa ganando peso.',
        length: 'Aproximadamente 42,4 cm',
        comparison: 'Manojo de apio',
        bodyChanges: ['Un aumento de peso más marcado es habitual durante este periodo, relacionado con el crecimiento del bebé.'],
        toKnow: ['La colocación con la cabeza hacia abajo (presentación cefálica) se vuelve más frecuente a medida que se acerca el término.'],
      },
      it: {
        babyDescription: 'Il bambino è già ben formato e si sistema gradualmente a testa in giù in preparazione alla nascita. Nelle settimane che restano continua soprattutto a prendere peso.',
        length: 'Circa 42,4 cm',
        comparison: 'Mazzo di sedano',
        bodyChanges: [
          'In questo periodo è frequente un aumento di peso più evidente, legato alla crescita del bambino.',
        ],
        toKnow: [
          'La posizione a testa in giù (presentazione cefalica) diventa più comune man mano che ci si avvicina al termine.',
        ],
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
      es: {
        babyDescription:
          'El cerebro y el sistema nervioso ya están bien desarrollados. Los huesos continúan endureciéndose, a excepción de los del cráneo, que permanecen flexibles para facilitar el paso durante el nacimiento.',
        length: 'Aproximadamente 43,7 cm',
        comparison: 'Piña',
        bodyChanges: ['Es frecuente en esta etapa tener dificultad para encontrar una posición cómoda para dormir.'],
        toKnow: ['La flexibilidad de los huesos del cráneo al nacer es temporal y se va cerrando progresivamente durante el primer año.'],
      },
      it: {
        babyDescription: 'Il cervello e il sistema nervoso sono ormai ben sviluppati. Le ossa continuano a indurirsi, tranne quelle del cranio, che restano flessibili per facilitarne il passaggio durante il parto.',
        length: 'Circa 43,7 cm',
        comparison: 'Ananas',
        bodyChanges: [
          'In questa fase è frequente avere difficoltà a trovare una posizione comoda per dormire.',
        ],
        toKnow: [
          'La flessibilità delle ossa del cranio alla nascita è temporanea e si chiude gradualmente nel corso del primo anno.',
        ],
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
      es: {
        babyDescription: 'El bebé, acurrucado por falta de espacio, generalmente mantiene las piernas replegadas hacia el pecho mientras sigue moviéndose con regularidad.',
        length: 'Aproximadamente 45 cm',
        comparison: 'Melón cantalupo',
        bodyChanges: ['A pesar del espacio reducido, los movimientos del bebé y los cambios de forma del vientre suelen seguir siendo perceptibles.'],
        toKnow: ['Seguir prestando atención a los movimientos habituales del bebé sigue siendo pertinente hasta el parto.'],
      },
      it: {
        babyDescription: 'Il bambino, raggomitolato per mancanza di spazio, tiene in genere le gambe piegate verso il petto continuando a muoversi regolarmente.',
        length: 'Circa 45 cm',
        comparison: 'Melone cantalupo',
        bodyChanges: [
          'Nonostante lo spazio ridotto, i movimenti del bambino e il cambiamento della forma della tua pancia di solito restano percepibili.',
        ],
        toKnow: [
          'Continuare a prestare attenzione ai movimenti abituali del bambino resta importante fino alla nascita.',
        ],
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
      es: {
        babyDescription: 'El bebé sigue ganando redondez, lo que le ayudará a regular su temperatura una vez nacido. El espacio disponible en el útero se vuelve más limitado.',
        length: 'Aproximadamente 46,2 cm',
        comparison: 'Melón dulce',
        bodyChanges: ['Puede aparecer una presión pélvica más marcada a medida que el bebé desciende progresivamente.'],
        toKnow: ['A pesar del espacio reducido, el bebé debe seguir moviéndose con una regularidad similar a la de las semanas anteriores.'],
      },
      it: {
        babyDescription: 'Il bambino continua a riempirsi, cosa che lo aiuterà a regolare la temperatura una volta nato. Lo spazio disponibile nell’utero diventa più limitato.',
        length: 'Circa 46,2 cm',
        comparison: 'Melone bianco',
        bodyChanges: [
          'Man mano che il bambino scende gradualmente, può comparire una pressione pelvica più marcata.',
        ],
        toKnow: [
          'Nonostante lo spazio limitato, il bambino dovrebbe continuare a muoversi con una regolarità simile a quella delle settimane precedenti.',
        ],
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
      es: {
        babyDescription:
          'Los pulmones generalmente han madurado lo suficiente para permitir una respiración autónoma, y el bebé es capaz de succionar y digerir.',
        length: 'Aproximadamente 47,4 cm',
        comparison: 'Lechuga romana',
        bodyChanges: ['A veces puedes sentir una respiración más corta, ya que el útero ocupa mucho espacio bajo las costillas.'],
        toKnow: ['El embarazo se considera a término entre la semana 37 y la semana 42.'],
      },
      it: {
        babyDescription: 'I polmoni sono in genere abbastanza maturi da permettere la respirazione autonoma e il bambino è in grado di succhiare e digerire.',
        length: 'Circa 47,4 cm',
        comparison: 'Lattuga romana',
        bodyChanges: [
          'A volte puoi sentirti più affannata, perché l’utero occupa molto spazio sotto le costole.',
        ],
        toKnow: [
          'La gravidanza è considerata a termine tra la settimana 37 e la settimana 42.',
        ],
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
      es: {
        babyDescription: 'El bebé se considera suficientemente maduro para nacer. La gran mayoría de los bebés ya se colocan con la cabeza hacia abajo.',
        length: 'Aproximadamente 48,6 cm',
        comparison: 'Puerro',
        bodyChanges: ['Es frecuente sentir una presión pélvica creciente a medida que el bebé se encaja en la pelvis.'],
        toKnow: ['A partir de esta semana, se considera alcanzado el término y el nacimiento puede producirse en cualquier momento.'],
      },
      it: {
        babyDescription: 'Il bambino è considerato abbastanza maturo per nascere. La grande maggioranza dei bambini ora è posizionata a testa in giù.',
        length: 'Circa 48,6 cm',
        comparison: 'Porro',
        bodyChanges: [
          'Una sensazione di pressione pelvica crescente è frequente, man mano che il bambino si impegna nel bacino.',
        ],
        toKnow: [
          'Da questa settimana il termine è considerato raggiunto e il parto può avvenire in qualsiasi momento.',
        ],
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
      es: {
        babyDescription:
          'El vello fino que cubría la piel ha desaparecido en su mayor parte, y los intestinos acumulan meconio, las primeras heces del recién nacido.',
        length: 'Aproximadamente 49,8 cm',
        comparison: 'Tallo de ruibarbo',
        bodyChanges: ['Familiarizarte con los signos que anuncian el trabajo de parto puede ser útil a medida que se acerca el nacimiento.'],
        toKnow: ['Un parto programado, cuando se plantea sin indicación médica, generalmente no se recomienda antes de la semana 39.'],
      },
      it: {
        babyDescription: 'La lanugine sottile che ricopriva la pelle è in gran parte scomparsa e nell’intestino si accumula il meconio, le prime feci del neonato.',
        length: 'Circa 49,8 cm',
        comparison: 'Gambo di rabarbaro',
        bodyChanges: [
          'Familiarizzare con i segni del travaglio può essere utile man mano che la nascita si avvicina.',
        ],
        toKnow: [
          'Un parto programmato, quando non c’è un’indicazione medica, in genere non è consigliato prima della settimana 39.',
        ],
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
      es: {
        babyDescription:
          'La piel, antes más fina, se ha engrosado y ahora protege mejor al bebé. Una capa protectora, el vérnix, también facilita su paso durante el nacimiento.',
        length: 'Aproximadamente 50,7 cm',
        comparison: 'Sandía',
        bodyChanges: ['La impaciencia y un cierto cansancio son frecuentes a medida que se acerca la fecha prevista.'],
        toKnow: ['La circulación sanguínea del recién nacido continúa ajustándose justo después del nacimiento, lo que puede dar temporalmente un tono ligeramente azulado a las manos o los pies.'],
      },
      it: {
        babyDescription: 'La pelle, prima più sottile, si è ispessita e ora protegge meglio il bambino. Un rivestimento protettivo, la vernice caseosa, ne facilita inoltre il passaggio durante il parto.',
        length: 'Circa 50,7 cm',
        comparison: 'Anguria',
        bodyChanges: [
          'Impazienza e una certa stanchezza sono frequenti con l’avvicinarsi della data presunta del parto.',
        ],
        toKnow: [
          'La circolazione sanguigna del neonato continua ad adattarsi subito dopo la nascita, e questo può dare temporaneamente a mani o piedi una leggera sfumatura bluastra.',
        ],
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
      es: {
        babyDescription:
          'El bebé está totalmente desarrollado y listo para nacer. La fecha prevista de parto es una estimación: muchos nacimientos ocurren en los días que la rodean, antes o después.',
        length: 'Aproximadamente 51,2 cm',
        comparison: 'Calabaza',
        bodyChanges: ['Es frecuente durante este periodo esperar signos de trabajo de parto (contracciones regulares, rotura de aguas).'],
        toKnow: ['Superar ligeramente la fecha prevista sigue siendo habitual y no significa necesariamente que haya un problema; generalmente se propone un seguimiento más cercano.'],
      },
      it: {
        babyDescription: 'Il bambino è completamente sviluppato e pronto a nascere. La data presunta del parto è una stima: molte nascite avvengono nei giorni che la circondano, prima o dopo.',
        length: 'Circa 51,2 cm',
        comparison: 'Zucca',
        bodyChanges: [
          'In questo periodo è frequente attendere i segni del travaglio (contrazioni regolari, rottura delle acque).',
        ],
        toKnow: [
          'Superare di poco la data presunta del parto resta comune e non significa necessariamente che ci sia un problema; in genere viene proposto un monitoraggio più ravvicinato.',
        ],
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
      es: {
        babyDescription:
          'El bebé sigue totalmente desarrollado. Más allá de la fecha prevista, generalmente se propone un seguimiento más cercano para vigilar el bienestar del bebé.',
        bodyChanges: ['La espera prolongada puede ir acompañada de un mayor cansancio e impaciencia.'],
        toKnow: ['Sobrepasar el término generalmente es objeto de una vigilancia reforzada por parte del equipo médico.'],
      },
      it: {
        babyDescription: 'Il bambino è ancora completamente sviluppato. Oltre la data presunta del parto, in genere viene proposto un monitoraggio più ravvicinato per controllare il benessere del bambino.',
        bodyChanges: [
          'L’attesa prolungata può accompagnarsi a maggiore stanchezza e impazienza.',
        ],
        toKnow: [
          'Superare il termine porta in genere a un monitoraggio più intenso da parte dell’équipe medica.',
        ],
      },
    },
  },
];

// PHASE 7M / Spanish editorial content: default matches the app's
// English-first default (all real callers — PregnancyDashboard.tsx,
// PregnancyWeekScreen.tsx — already pass an explicit, normalized `lang`
// derived from i18n.language, so this default is only ever exercised by a
// caller that omits it, e.g. a test). Resolution is explicit per language via
// resolveEditorialLanguage(): 'fr' -> French, 'es' -> Spanish, 'it' -> Italian,
// anything else (including 'en' and any unrecognized/future value) -> English.
// English is the fallback for an unknown language — never French.
export function getPregnancyWeekData(week: number, lang: EditorialLanguage = 'en'): PregnancyWeekData | undefined {
  const entry = PREGNANCY_WEEK_DATA.find(item => item.week === week);
  if (!entry) {
    return undefined;
  }
  const content = entry.content[resolveEditorialLanguage(lang)];
  return {
    week: entry.week,
    babyImage: entry.babyImage,
    sourceRefs: entry.sourceRefs,
    ...content,
  };
}
