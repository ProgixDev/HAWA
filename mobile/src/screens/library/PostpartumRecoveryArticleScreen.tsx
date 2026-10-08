import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Image,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import ReadingControls from '../../components/articles/ReadingControls';
import {
  isArticleBookmarked,
  loadLibraryState,
  saveScrollPosition,
  toggleBookmark,
} from '../../state/libraryStore';
import {
  getBottomPadding,
  getTopPadding,
  READING_CONTROLS_SPACE,
} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {resolveEditorialLanguage} from '../../i18n/editorialLanguage';

const ID = 'postpartum-recuperation-globale';

const HERO = require('../../assets/images/library/spm-water.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const RECOVERY_PILLAR_ICONS = [
  'bed-outline',
  'food-apple-outline',
  'account-heart-outline',
  'walk',
] as const;

const CONSULTATION_SIGN_ICONS = [
  'alert-circle-outline',
  'water-alert-outline',
  'emoticon-sad-outline',
  'medical-bag',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'POST-PARTUM • RÉCUPÉRATION',
    title: 'La récupération\naprès l’accouchement',
    metaDuration: '10 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Ton corps a besoin de temps : ce qui est normal après la naissance.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Comprendre le post-partum',
      'Les premiers jours : ralentir et récupérer',
      'Ce qui peut être normal pendant la récupération',
      'Prendre soin de soi au quotidien',
      'Bouger et reprendre les activités progressivement',
      'Sommeil, fatigue et nouveaux rythmes',
      'Les émotions après la naissance',
      'Quand demander conseil',
      'Faire le point avec un professionnel',
      'À retenir',
    ],
    headings: [
      'Comprendre le post-partum',
      'Les premiers jours : ralentir et récupérer',
      'Ce qui peut être normal pendant la récupération',
      'Prendre soin de soi au quotidien',
      'Bouger et reprendre les activités progressivement',
      'Sommeil, fatigue et nouveaux rythmes',
      'Les émotions après la naissance',
      'Quand demander conseil ?',
      'Faire le point avec un professionnel',
      'À retenir',
    ],
    section1Body1: 'Le post-partum correspond à la période qui suit la naissance. Il ne se limite pas à quelques jours : le corps, le rythme quotidien et les émotions peuvent évoluer progressivement au fil des semaines.',
    section1Body2: 'La « quarantaine » est une expression traditionnelle souvent utilisée pour évoquer les premières semaines de récupération. Elle peut être un bon rappel : après la grossesse et l’accouchement, il est utile de ralentir et de laisser du temps au corps.',
    highlight1Title: 'Une récupération globale',
    highlight1Text: 'La récupération concerne le corps, mais aussi le sommeil, l’énergie, l’organisation quotidienne et l’adaptation émotionnelle à une nouvelle étape de vie.',
    section2Body: 'Les premiers jours peuvent être intenses. Le repos, les soins de base et l’adaptation au nouveau rythme sont souvent les priorités. Il n’est pas nécessaire de retrouver immédiatement son niveau d’énergie habituel.',
    recoveryPillars: [
      {title: 'Repos', text: 'Alterner les moments d’activité et de repos aide le corps à récupérer progressivement.'},
      {title: 'Alimentation', text: 'Manger régulièrement et boire selon ses besoins soutient la récupération au quotidien.'},
      {title: 'Soutien', text: 'Accepter de l’aide permet de préserver de l’énergie pour les soins essentiels et la récupération.'},
      {title: 'Mouvement doux', text: 'Reprendre les gestes et déplacements progressivement, en respectant son état et son confort.'},
    ],
    section3Body1: 'Chaque récupération est différente. Certains changements peuvent faire partie de la période d’adaptation et évoluer progressivement :',
    normalSigns: [
      'Fatigue importante',
      'Saignements qui diminuent progressivement',
      'Fluctuations hormonales et émotionnelles',
    ],
    section3Body2: 'L’intensité et la durée des symptômes peuvent varier d’une personne à l’autre. L’important est d’observer leur évolution et de demander conseil lorsqu’un changement semble préoccupant ou inhabituel.',
    section4Body: 'Pendant le post-partum, les petites habitudes réalistes sont souvent plus utiles qu’un programme exigeant. L’objectif est de soutenir la récupération sans ajouter de pression.',
    selfCareTips: [
      'Prévoir de vrais moments de repos lorsque cela est possible.',
      'Demander de l’aide pour les tâches quotidiennes et les repas.',
      'Boire régulièrement et garder une alimentation variée.',
      'Éviter de comparer sa récupération à celle des autres.',
      'Reprendre les activités progressivement, sans chercher à tout faire immédiatement.',
    ],
    tip1Title: 'Bon à savoir',
    tip1Text: 'S’entourer et accepter de l’aide n’est pas un luxe. Cela peut permettre de préserver de l’énergie et de rendre la récupération plus progressive.',
    section5Body1: 'La reprise des activités peut se faire étape par étape selon le confort, l’énergie et les recommandations reçues après l’accouchement. Les mouvements doux et les activités quotidiennes constituent déjà une reprise du mouvement.',
    section5Body2: 'Pour les activités plus intenses, il est préférable de progresser sans brûler les étapes et de tenir compte des éventuels symptômes ou inconforts.',
    alertTitle: 'Écouter les signaux du corps',
    alertText: 'Une gêne qui augmente pendant une activité est une raison de ralentir et, si nécessaire, de demander un avis adapté avant de poursuivre ou d’augmenter l’intensité.',
    section6Body: 'Le sommeil peut devenir irrégulier après la naissance. La fatigue accumulée peut influencer l’énergie, la concentration et l’humeur. Lorsque c’est possible, simplifier certaines tâches et partager les responsabilités peut aider.',
    milestones: [
      ['Premiers jours', 'Repos, adaptation et soins essentiels.'],
      ['Premières semaines', 'Récupération progressive et installation de nouveaux repères.'],
      ['Après la consultation post-natale', 'Faire le point sur la récupération et discuter de la reprise progressive des activités.'],
    ],
    section7Body1: 'Le post-partum peut s’accompagner de nombreuses émotions : joie, inquiétude, fatigue, sensibilité ou sentiment d’être dépassée. Ces ressentis peuvent varier rapidement, notamment dans une période où le sommeil et les habitudes quotidiennes changent.',
    section7Body2: 'Parler à une personne de confiance ou à un professionnel peut être utile lorsque les émotions deviennent difficiles à gérer ou prennent beaucoup de place dans le quotidien.',
    highlight2Title: 'Demander du soutien est normal',
    highlight2Text: 'Il n’est pas nécessaire d’attendre d’être totalement épuisée ou dépassée pour parler de ce que l’on ressent et chercher du soutien.',
    section8Body: 'Certaines situations méritent d’être discutées avec un professionnel de santé, surtout lorsqu’elles s’aggravent, persistent ou créent une inquiétude importante.',
    consultationSigns: [
      {title: 'Symptômes qui s’aggravent', text: 'Une douleur ou un inconfort qui augmente au lieu de s’améliorer mérite un avis professionnel.'},
      {title: 'Saignements inhabituels', text: 'Des saignements qui deviennent soudainement plus importants ou inhabituels doivent être signalés à un professionnel de santé.'},
      {title: 'Mal-être persistant', text: 'Si le mal-être émotionnel prend beaucoup de place ou rend le quotidien difficile, il est important d’en parler et de demander du soutien.'},
      {title: 'Une inquiétude importante', text: 'En cas de doute sur la récupération, demander conseil permet d’obtenir des recommandations adaptées à sa situation.'},
    ],
    section9Body: 'Les rendez-vous de suivi sont l’occasion de parler de la récupération, des symptômes, de la reprise des activités et des questions qui restent en suspens. Préparer quelques questions à l’avance peut aider à ne rien oublier.',
    questionTitle: 'Questions que tu peux préparer',
    questions: [
      'Est-ce que ma récupération évolue comme prévu pour ma situation ?',
      'Quelles activités puis-je reprendre progressivement ?',
      'Quels symptômes dois-je surveiller ?',
      'Quand puis-je envisager une reprise sportive plus intense ?',
      'Ai-je besoin de conseils ou d’une rééducation particulière ?',
    ],
    summaryItems: [
      'La récupération après l’accouchement est progressive et différente pour chaque personne.',
      'Le repos et le soutien peuvent faire partie intégrante de la récupération.',
      'Les changements physiques, le sommeil et les émotions peuvent évoluer au fil des semaines.',
      'Reprendre les activités progressivement permet de mieux respecter son énergie et son confort.',
      'En cas de symptôme inhabituel, persistant ou inquiétant, demander conseil est une bonne démarche.',
    ],
    finalTipTitle: 'Prends le temps nécessaire',
    finalTipText: 'La récupération n’est pas une course. Avancer progressivement, respecter ses besoins et demander du soutien lorsque nécessaire sont déjà des étapes importantes.',
    disclaimerText: 'Cet article a une vocation informative et ne remplace pas un avis médical personnalisé. En cas de symptôme important, persistant ou inquiétant, contacte un professionnel de santé.',
    shareMessage: 'La récupération après l’accouchement — AWA',
  },
  en: {
    badge: 'POSTPARTUM • RECOVERY',
    title: 'Recovery\nafter childbirth',
    metaDuration: '10 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Your body needs time: what’s normal after giving birth.',
    contentsTitle: 'In this article',
    topics: [
      'Understanding postpartum',
      'The first days: slowing down and recovering',
      'What can be normal during recovery',
      'Taking care of yourself day to day',
      'Moving and resuming activities gradually',
      'Sleep, fatigue, and new routines',
      'Emotions after childbirth',
      'When to seek advice',
      'Checking in with a healthcare professional',
      'What to remember',
    ],
    headings: [
      'Understanding postpartum',
      'The first days: slowing down and recovering',
      'What can be normal during recovery',
      'Taking care of yourself day to day',
      'Moving and resuming activities gradually',
      'Sleep, fatigue, and new routines',
      'Emotions after childbirth',
      'When should you seek advice?',
      'Checking in with a healthcare professional',
      'What to remember',
    ],
    section1Body1: 'The postpartum period follows childbirth. It isn’t limited to a few days: the body, daily rhythm, and emotions can keep evolving gradually over the following weeks.',
    section1Body2: 'The “quarantaine” is a traditional expression often used to describe the first weeks of recovery. It can serve as a good reminder: after pregnancy and childbirth, it’s worth slowing down and giving the body time.',
    highlight1Title: 'A whole-body recovery',
    highlight1Text: 'Recovery concerns the body, but also sleep, energy, daily organization, and the emotional adjustment to a new stage of life.',
    section2Body: 'The first days can be intense. Rest, basic care, and adjusting to the new rhythm are often the priorities. There’s no need to immediately regain your usual energy level.',
    recoveryPillars: [
      {title: 'Rest', text: 'Alternating activity and rest helps the body recover gradually.'},
      {title: 'Nutrition', text: 'Eating regularly and drinking according to your needs supports day-to-day recovery.'},
      {title: 'Support', text: 'Accepting help makes it possible to save energy for essential care and recovery.'},
      {title: 'Gentle movement', text: 'Gradually resume movements and activities, respecting your condition and comfort.'},
    ],
    section3Body1: 'Every recovery is different. Some changes can be part of the adjustment period and evolve gradually:',
    normalSigns: [
      'Significant fatigue',
      'Bleeding that gradually decreases',
      'Hormonal and emotional fluctuations',
    ],
    section3Body2: 'The intensity and duration of symptoms can vary from person to person. What matters is watching how they evolve and seeking advice if a change seems concerning or unusual.',
    section4Body: 'During the postpartum period, small, realistic habits are often more helpful than a demanding routine. The goal is to support recovery without adding pressure.',
    selfCareTips: [
      'Plan real moments of rest whenever possible.',
      'Ask for help with daily tasks and meals.',
      'Drink regularly and keep a varied diet.',
      'Avoid comparing your recovery to anyone else’s.',
      'Resume activities gradually, without trying to do everything right away.',
    ],
    tip1Title: 'Good to know',
    tip1Text: 'Surrounding yourself with support and accepting help isn’t a luxury. It can help preserve energy and make recovery more gradual.',
    section5Body1: 'Resuming activities can happen step by step, based on comfort, energy, and the recommendations received after childbirth. Gentle movements and everyday activities already count as a return to movement.',
    section5Body2: 'For more intense activities, it’s best to progress without skipping steps and to take any symptoms or discomfort into account.',
    alertTitle: 'Listen to your body’s signals',
    alertText: 'Discomfort that increases during an activity is a reason to slow down and, if needed, to seek tailored advice before continuing or increasing intensity.',
    section6Body: 'Sleep can become irregular after giving birth. Accumulated fatigue can affect energy, concentration, and mood. When possible, simplifying certain tasks and sharing responsibilities can help.',
    milestones: [
      ['First days', 'Rest, adjustment, and essential care.'],
      ['First weeks', 'Gradual recovery and the start of new routines.'],
      ['After the postnatal check-up', 'Review recovery progress and discuss gradually resuming activities.'],
    ],
    section7Body1: 'The postpartum period can bring many emotions: joy, worry, fatigue, sensitivity, or a feeling of being overwhelmed. These feelings can shift quickly, especially during a time when sleep and daily habits are changing.',
    section7Body2: 'Talking to someone you trust or to a professional can help when emotions become difficult to manage or take up a lot of space in daily life.',
    highlight2Title: 'Asking for support is normal',
    highlight2Text: 'There’s no need to wait until you’re completely exhausted or overwhelmed to talk about how you’re feeling and seek support.',
    section8Body: 'Some situations are worth discussing with a healthcare professional, especially when they get worse, persist, or cause significant concern.',
    consultationSigns: [
      {title: 'Worsening symptoms', text: 'Pain or discomfort that increases instead of improving deserves professional advice.'},
      {title: 'Unusual bleeding', text: 'Bleeding that suddenly becomes heavier or unusual should be reported to a healthcare professional.'},
      {title: 'Persistent distress', text: 'If emotional distress takes up a lot of space or makes daily life difficult, it’s important to talk about it and ask for support.'},
      {title: 'Significant concern', text: 'If in doubt about your recovery, asking for advice helps you get recommendations suited to your situation.'},
    ],
    section9Body: 'Follow-up appointments are an opportunity to talk about recovery, symptoms, resuming activities, and any remaining questions. Preparing a few questions in advance can help make sure nothing gets forgotten.',
    questionTitle: 'Questions you can prepare',
    questions: [
      'Is my recovery progressing as expected for my situation?',
      'Which activities can I gradually resume?',
      'What symptoms should I watch for?',
      'When can I consider a more intense return to exercise?',
      'Do I need any specific advice or rehabilitation?',
    ],
    summaryItems: [
      'Recovery after childbirth is gradual and different for everyone.',
      'Rest and support can be an integral part of recovery.',
      'Physical changes, sleep, and emotions can evolve over the weeks.',
      'Resuming activities gradually helps you better respect your energy and comfort.',
      'If you notice an unusual, persistent, or concerning symptom, seeking advice is a good step.',
    ],
    finalTipTitle: 'Take the time you need',
    finalTipText: 'Recovery isn’t a race. Moving forward gradually, respecting your needs, and asking for support when necessary are already important steps.',
    disclaimerText: 'This article is for informational purposes only and does not replace personalized medical advice. If you experience a significant, persistent, or concerning symptom, contact a healthcare professional.',
    shareMessage: 'Recovery after childbirth — AWA',
  },
  es: {
    badge: 'POSPARTO • RECUPERACIÓN',
    title: 'La recuperación\ndespués del parto',
    metaDuration: '10 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Tu cuerpo necesita tiempo: lo que es normal después del parto.',
    contentsTitle: 'En este artículo',
    topics: [
      'Comprender el posparto',
      'Los primeros días: bajar el ritmo y recuperarte',
      'Lo que puede ser normal durante la recuperación',
      'Cuidarte en el día a día',
      'Moverte y retomar las actividades progresivamente',
      'Sueño, fatiga y nuevos ritmos',
      'Las emociones después del parto',
      'Cuándo pedir consejo',
      'Hacer un balance con un profesional',
      'Para recordar',
    ],
    headings: [
      'Comprender el posparto',
      'Los primeros días: bajar el ritmo y recuperarte',
      'Lo que puede ser normal durante la recuperación',
      'Cuidarte en el día a día',
      'Moverte y retomar las actividades progresivamente',
      'Sueño, fatiga y nuevos ritmos',
      'Las emociones después del parto',
      '¿Cuándo pedir consejo?',
      'Hacer un balance con un profesional',
      'Para recordar',
    ],
    section1Body1: 'El posparto corresponde al periodo que sigue al parto. No se limita a unos pocos días: el cuerpo, el ritmo diario y las emociones pueden evolucionar progresivamente a lo largo de las semanas.',
    section1Body2: 'La «cuarentena» es una expresión tradicional que se usa a menudo para referirse a las primeras semanas de recuperación. Puede ser un buen recordatorio: después del embarazo y el parto, conviene bajar el ritmo y dar tiempo al cuerpo.',
    highlight1Title: 'Una recuperación integral',
    highlight1Text: 'La recuperación concierne al cuerpo, pero también al sueño, la energía, la organización diaria y la adaptación emocional a una nueva etapa de vida.',
    section2Body: 'Los primeros días pueden ser intensos. El descanso, los cuidados básicos y la adaptación al nuevo ritmo suelen ser las prioridades. No es necesario recuperar de inmediato tu nivel de energía habitual.',
    recoveryPillars: [
      {title: 'Descanso', text: 'Alternar momentos de actividad y de descanso ayuda al cuerpo a recuperarse progresivamente.'},
      {title: 'Alimentación', text: 'Comer con regularidad y beber según tus necesidades favorece la recuperación en el día a día.'},
      {title: 'Apoyo', text: 'Aceptar ayuda permite conservar energía para los cuidados esenciales y la recuperación.'},
      {title: 'Movimiento suave', text: 'Retomar los gestos y desplazamientos progresivamente, respetando tu estado y tu comodidad.'},
    ],
    section3Body1: 'Cada recuperación es diferente. Algunos cambios pueden formar parte del periodo de adaptación e ir evolucionando progresivamente:',
    normalSigns: [
      'Fatiga importante',
      'Sangrado que disminuye progresivamente',
      'Fluctuaciones hormonales y emocionales',
    ],
    section3Body2: 'La intensidad y la duración de los síntomas pueden variar de una persona a otra. Lo importante es observar su evolución y pedir consejo cuando un cambio parezca preocupante o inusual.',
    section4Body: 'Durante el posparto, los pequeños hábitos realistas suelen ser más útiles que un programa exigente. El objetivo es apoyar la recuperación sin añadir presión.',
    selfCareTips: [
      'Reservar verdaderos momentos de descanso cuando sea posible.',
      'Pedir ayuda para las tareas diarias y las comidas.',
      'Beber con regularidad y mantener una alimentación variada.',
      'Evitar comparar tu recuperación con la de otras personas.',
      'Retomar las actividades progresivamente, sin intentar hacerlo todo de inmediato.',
    ],
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Rodearte de apoyo y aceptar ayuda no es un lujo. Esto puede permitir conservar energía y hacer que la recuperación sea más gradual.',
    section5Body1: 'La reanudación de las actividades puede hacerse paso a paso, según la comodidad, la energía y las recomendaciones recibidas después del parto. Los movimientos suaves y las actividades cotidianas ya constituyen una reanudación del movimiento.',
    section5Body2: 'Para las actividades más intensas, es preferible progresar sin saltarte etapas y teniendo en cuenta los posibles síntomas o molestias.',
    alertTitle: 'Escuchar las señales del cuerpo',
    alertText: 'Una molestia que aumenta durante una actividad es motivo para bajar el ritmo y, si es necesario, pedir una opinión adaptada antes de continuar o aumentar la intensidad.',
    section6Body: 'El sueño puede volverse irregular después del parto. La fatiga acumulada puede influir en la energía, la concentración y el estado de ánimo. Cuando sea posible, simplificar ciertas tareas y compartir las responsabilidades puede ayudar.',
    milestones: [
      ['Primeros días', 'Descanso, adaptación y cuidados esenciales.'],
      ['Primeras semanas', 'Recuperación progresiva e instauración de nuevos puntos de referencia.'],
      ['Después de la consulta posnatal', 'Hacer un balance de la recuperación y hablar sobre la reanudación progresiva de las actividades.'],
    ],
    section7Body1: 'El posparto puede venir acompañado de numerosas emociones: alegría, inquietud, fatiga, sensibilidad o sensación de estar desbordada. Estas sensaciones pueden cambiar rápidamente, sobre todo en un periodo en el que el sueño y los hábitos diarios están cambiando.',
    section7Body2: 'Hablar con una persona de confianza o con un profesional puede ser útil cuando las emociones se vuelven difíciles de gestionar u ocupan mucho espacio en el día a día.',
    highlight2Title: 'Pedir apoyo es normal',
    highlight2Text: 'No es necesario esperar a estar totalmente agotada o desbordada para hablar de lo que sientes y buscar apoyo.',
    section8Body: 'Algunas situaciones merecen hablarse con un profesional de la salud, sobre todo cuando empeoran, persisten o generan una inquietud importante.',
    consultationSigns: [
      {title: 'Síntomas que empeoran', text: 'Un dolor o una molestia que aumenta en lugar de mejorar merece una opinión profesional.'},
      {title: 'Sangrado inusual', text: 'Un sangrado que de repente se vuelve más abundante o inusual debe comunicarse a un profesional de la salud.'},
      {title: 'Malestar persistente', text: 'Si el malestar emocional ocupa mucho espacio o dificulta el día a día, es importante hablar de ello y pedir apoyo.'},
      {title: 'Una inquietud importante', text: 'En caso de duda sobre la recuperación, pedir consejo permite obtener recomendaciones adaptadas a tu situación.'},
    ],
    section9Body: 'Las citas de seguimiento son una oportunidad para hablar de la recuperación, de los síntomas, de la reanudación de las actividades y de las preguntas que queden pendientes. Preparar algunas preguntas de antemano puede ayudarte a no olvidar nada.',
    questionTitle: 'Preguntas que puedes preparar',
    questions: [
      '¿Mi recuperación evoluciona como se esperaba para mi situación?',
      '¿Qué actividades puedo retomar progresivamente?',
      '¿Qué síntomas debo vigilar?',
      '¿Cuándo puedo plantearme una vuelta al deporte más intensa?',
      '¿Necesito algún consejo o una rehabilitación en particular?',
    ],
    summaryItems: [
      'La recuperación después del parto es progresiva y diferente para cada persona.',
      'El descanso y el apoyo pueden formar parte integral de la recuperación.',
      'Los cambios físicos, el sueño y las emociones pueden evolucionar a lo largo de las semanas.',
      'Retomar las actividades progresivamente permite respetar mejor tu energía y tu comodidad.',
      'En caso de síntoma inusual, persistente o preocupante, pedir consejo es un buen paso.',
    ],
    finalTipTitle: 'Tómate el tiempo que necesites',
    finalTipText: 'La recuperación no es una carrera. Avanzar progresivamente, respetar tus necesidades y pedir apoyo cuando sea necesario ya son pasos importantes.',
    disclaimerText: 'Este artículo tiene una finalidad informativa y no sustituye una opinión médica personalizada. En caso de síntoma importante, persistente o preocupante, contacta con un profesional de la salud.',
    shareMessage: 'La recuperación después del parto — AWA',
  },
  it: {
    badge: 'POST-PARTUM • RECUPERO',
    title: 'Il recupero\ndopo il parto',
    metaDuration: '10 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Il tuo corpo ha bisogno di tempo: cosa è normale dopo il parto.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Capire il post-partum',
      'I primi giorni: rallentare e recuperare',
      'Cosa può essere normale durante il recupero',
      'Prendersi cura di sé ogni giorno',
      'Muoversi e riprendere le attività gradualmente',
      'Sonno, stanchezza e nuove abitudini',
      'Le emozioni dopo il parto',
      'Quando chiedere un parere',
      'Il controllo con un operatore sanitario',
      'Cosa ricordare',
    ],
    headings: [
      'Capire il post-partum',
      'I primi giorni: rallentare e recuperare',
      'Cosa può essere normale durante il recupero',
      'Prendersi cura di sé ogni giorno',
      'Muoversi e riprendere le attività gradualmente',
      'Sonno, stanchezza e nuove abitudini',
      'Le emozioni dopo il parto',
      'Quando chiedere consiglio?',
      'Il controllo con un operatore sanitario',
      'Cosa ricordare',
    ],
    section1Body1: 'Il post-partum segue il parto. Non si limita a pochi giorni: il corpo, il ritmo quotidiano e le emozioni possono continuare a evolvere gradualmente nelle settimane successive.',
    section1Body2: 'La «quarantaine» è un’espressione tradizionale spesso usata per descrivere le prime settimane di recupero. Può essere un buon promemoria: dopo la gravidanza e il parto, è bene rallentare e dare tempo al corpo.',
    highlight1Title: 'Un recupero che riguarda tutto il corpo',
    highlight1Text: 'Il recupero riguarda il corpo, ma anche il sonno, l’energia, l’organizzazione quotidiana e l’adattamento emotivo a una nuova fase della vita.',
    section2Body: 'I primi giorni possono essere intensi. Riposo, cure di base e adattamento al nuovo ritmo sono spesso le priorità. Non c’è bisogno di ritrovare subito il tuo solito livello di energia.',
    recoveryPillars: [
      {
        title: 'Riposo',
        text: 'Alternare attività e riposo aiuta il corpo a recuperare gradualmente.',
      },
      {
        title: 'Alimentazione',
        text: 'Mangiare con regolarità e bere in base alle tue esigenze sostiene il recupero di ogni giorno.',
      },
      {
        title: 'Sostegno',
        text: 'Accettare aiuto permette di risparmiare energie per le cure essenziali e per il recupero.',
      },
      {
        title: 'Movimento dolce',
        text: 'Riprendi gradualmente movimenti e attività, rispettando le tue condizioni e il tuo comfort.',
      },
    ],
    section3Body1: 'Ogni recupero è diverso. Alcuni cambiamenti possono far parte della fase di adattamento ed evolvere gradualmente:',
    normalSigns: [
      'Stanchezza importante',
      'Sanguinamento che diminuisce gradualmente',
      'Fluttuazioni ormonali ed emotive',
    ],
    section3Body2: 'L’intensità e la durata dei sintomi possono variare da persona a persona. L’importante è osservare come evolvono e chiedere un parere se un cambiamento ti sembra preoccupante o insolito.',
    section4Body: 'Durante il post-partum, abitudini piccole e realistiche sono spesso più utili di una routine impegnativa. L’obiettivo è sostenere il recupero senza aggiungere pressione.',
    selfCareTips: [
      'Pianifica veri momenti di riposo ogni volta che è possibile.',
      'Chiedi aiuto per le faccende quotidiane e i pasti.',
      'Bevi con regolarità e segui un’alimentazione varia.',
      'Evita di paragonare il tuo recupero a quello di un’altra donna.',
      'Riprendi le attività gradualmente, senza cercare di fare tutto subito.',
    ],
    tip1Title: 'Da sapere',
    tip1Text: 'Circondarti di sostegno e accettare aiuto non è un lusso. Può aiutare a preservare le energie e rendere il recupero più graduale.',
    section5Body1: 'La ripresa delle attività può avvenire passo dopo passo, in base al comfort, all’energia e alle raccomandazioni ricevute dopo il parto. I movimenti dolci e le attività quotidiane contano già come ritorno al movimento.',
    section5Body2: 'Per le attività più intense, è meglio procedere senza saltare le tappe e tenere conto di eventuali sintomi o fastidi.',
    alertTitle: 'Ascolta i segnali del tuo corpo',
    alertText: 'Un fastidio che aumenta durante un’attività è un motivo per rallentare e, se necessario, per chiedere un consiglio adatto a te prima di continuare o aumentare l’intensità.',
    section6Body: 'Il sonno può diventare irregolare dopo il parto. La stanchezza accumulata può influire su energia, concentrazione e umore. Quando possibile, semplificare alcuni compiti e condividere le responsabilità può aiutare.',
    milestones: [
      [
        'Primi giorni',
        'Riposo, adattamento e cure essenziali.',
      ],
      [
        'Prime settimane',
        'Recupero graduale e inizio di nuove abitudini.',
      ],
      [
        'Dopo la visita post-parto',
        'Fai il punto sul recupero e parla della ripresa graduale delle attività.',
      ],
    ],
    section7Body1: 'Il post-partum può portare tante emozioni: gioia, preoccupazione, stanchezza, sensibilità o la sensazione di essere sopraffatta. Questi stati d’animo possono cambiare rapidamente, soprattutto in un periodo in cui sonno e abitudini quotidiane stanno cambiando.',
    section7Body2: 'Parlare con una persona di cui ti fidi o con un professionista può aiutare quando le emozioni diventano difficili da gestire o occupano molto spazio nella vita quotidiana.',
    highlight2Title: 'Chiedere sostegno è normale',
    highlight2Text: 'Non serve aspettare di essere completamente esausta o sopraffatta per parlare di come ti senti e cercare sostegno.',
    section8Body: 'Di alcune situazioni è bene parlare con un operatore sanitario, soprattutto quando peggiorano, persistono o causano una forte preoccupazione.',
    consultationSigns: [
      {
        title: 'Sintomi che peggiorano',
        text: 'Un dolore o un fastidio che aumenta invece di migliorare merita il parere di un professionista.',
      },
      {
        title: 'Sanguinamento insolito',
        text: 'Un sanguinamento che diventa all’improvviso più abbondante o insolito va segnalato a un operatore sanitario.',
      },
      {
        title: 'Disagio persistente',
        text: 'Se il disagio emotivo occupa molto spazio o rende difficile la vita quotidiana, è importante parlarne e chiedere sostegno.',
      },
      {
        title: 'Forte preoccupazione',
        text: 'Se hai dubbi sul tuo recupero, chiedere un parere ti aiuta a ricevere indicazioni adatte alla tua situazione.',
      },
    ],
    section9Body: 'Le visite di controllo sono un’occasione per parlare del recupero, dei sintomi, della ripresa delle attività e di eventuali domande rimaste aperte. Preparare qualche domanda in anticipo può aiutare a non dimenticare nulla.',
    questionTitle: 'Domande che puoi preparare',
    questions: [
      'Il mio recupero procede come previsto per la mia situazione?',
      'Quali attività posso riprendere gradualmente?',
      'Quali sintomi devo tenere d’occhio?',
      'Quando posso pensare a una ripresa più intensa dell’attività fisica?',
      'Ho bisogno di consigli specifici o di riabilitazione?',
    ],
    summaryItems: [
      'Il recupero dopo il parto è graduale e diverso per ognuna.',
      'Riposo e sostegno possono far parte integrante del recupero.',
      'Cambiamenti fisici, sonno ed emozioni possono evolvere nel corso delle settimane.',
      'Riprendere le attività gradualmente ti aiuta a rispettare meglio la tua energia e il tuo comfort.',
      'Se noti un sintomo insolito, persistente o preoccupante, chiedere un parere è un buon passo.',
    ],
    finalTipTitle: 'Prenditi il tempo che ti serve',
    finalTipText: 'Il recupero non è una gara. Andare avanti gradualmente, rispettando le tue esigenze e chiedendo sostegno quando serve, sono già passi importanti.',
    disclaimerText: 'Questo articolo ha solo scopo informativo e non sostituisce un parere medico personalizzato. Se hai un sintomo importante, persistente o preoccupante, contatta un operatore sanitario.',
    shareMessage: 'Il recupero dopo il parto — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PostpartumRecoveryArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t, i18n} = useTranslation();
  const lang = resolveEditorialLanguage(i18n.language);
  const content = CONTENT[lang];
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let mounted = true;

    loadLibraryState().then(() => {
      if (mounted) {
        setSaved(isArticleBookmarked(ID));
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleBookmark = () => {
    setSaved(toggleBookmark(ID));
  };

  const handleShare = () => {
    Share.share({
      message: content.shareMessage,
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
      />

      <ScrollView
        ref={scrollRef}
        onScroll={event =>
          saveScrollPosition(ID, event.nativeEvent.contentOffset.y)
        }
        scrollEventThrottle={200}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: getBottomPadding(
              insets.bottom,
              READING_CONTROLS_SPACE,
            ),
          },
        ]}>
        <View style={styles.heroWrap}>
          <Image source={HERO} resizeMode="cover" style={styles.hero} />

          <View
            style={[
              styles.top,
              {paddingTop: getTopPadding(insets.top, true)},
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.reader.back')}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [styles.circle, pressed && styles.pressed]}>
              <MaterialDesignIcons name="chevron-left" size={23} color={theme.colors.text} />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('library.screen.addBookmark')}
                onPress={handleBookmark}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('libraryArticle.shareA11y')}
                onPress={handleShare}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name="share-variant-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{content.badge}</Text>
          </View>

          <Text style={styles.title}>
            {content.title}
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', content.metaDuration],
              ['book-open-page-variant-outline', content.metaType],
              ['chart-bar', content.metaLevel],
              ['shield-check-outline', content.metaValidated],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? <View style={styles.metaDivider} /> : null}

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color={theme.colors.textMuted}
                    size={17}
                  />

                  <Text style={styles.meta}>{text}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.intro}>
            {content.intro}
          </Text>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>{content.contentsTitle}</Text>

            {content.topics.map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>{index + 1}.</Text>
                  <Text style={styles.contentText}>{item}</Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          {/* SECTION 1 */}
          <Text style={styles.h2}>1. {content.headings[0]}</Text>

          <Text style={styles.body}>
            {content.section1Body1}
          </Text>

          <Text style={styles.body}>
            {content.section1Body2}
          </Text>

          <View style={styles.highlight}>
            <MaterialDesignIcons
              name="heart-pulse"
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.highlight1Title}</Text>
              <Text style={styles.tipText}>
                {content.highlight1Text}
              </Text>
            </View>
          </View>

          {/* SECTION 2 */}
          <Text style={styles.h2}>
            2. {content.headings[1]}
          </Text>

          <Text style={styles.body}>
            {content.section2Body}
          </Text>

          <View style={styles.pillarGrid}>
            {RECOVERY_PILLAR_ICONS.map((icon, index) => (
              <View key={icon} style={styles.pillarCard}>
                <View style={styles.pillarIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>
                <Text style={styles.pillarTitle}>{content.recoveryPillars[index].title}</Text>
                <Text style={styles.pillarText}>{content.recoveryPillars[index].text}</Text>
              </View>
            ))}
          </View>

          {/* SECTION 3 */}
          <Text style={styles.h2}>
            3. {content.headings[2]}
          </Text>

          <Text style={styles.body}>
            {content.section3Body1}
          </Text>

          <View style={styles.checkList}>
            {content.normalSigns.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />
                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.body}>
            {content.section3Body2}
          </Text>

          {/* SECTION 4 */}
          <Text style={styles.h2}>
            4. {content.headings[3]}
          </Text>

          <Text style={styles.body}>
            {content.section4Body}
          </Text>

          <View style={styles.tipList}>
            {content.selfCareTips.map((item, index) => (
              <View key={item} style={styles.tipRow}>
                <View style={styles.tipNumber}>
                  <Text style={styles.tipNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.tipRowText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tip1Title}</Text>
              <Text style={styles.tipText}>
                {content.tip1Text}
              </Text>
            </View>
          </View>

          {/* SECTION 5 */}
          <Text style={styles.h2}>
            5. {content.headings[4]}
          </Text>

          <Text style={styles.body}>
            {content.section5Body1}
          </Text>

          <Text style={styles.body}>
            {content.section5Body2}
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="run-fast"
              size={24}
              color={theme.colors.warning}
            />
            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.alertTitle}</Text>
              <Text style={styles.tipText}>
                {content.alertText}
              </Text>
            </View>
          </View>

          {/* SECTION 6 */}
          <Text style={styles.h2}>
            6. {content.headings[5]}
          </Text>

          <Text style={styles.body}>
            {content.section6Body}
          </Text>

          <View style={styles.timeline}>
            {content.milestones.map(([period, description], index) => (
              <View key={period} style={styles.timelineRow}>
                <View style={styles.timelineMarker}>
                  <Text style={styles.timelineNumber}>{index + 1}</Text>
                </View>
                <View style={styles.timelineCopy}>
                  <Text style={styles.timelineTitle}>{period}</Text>
                  <Text style={styles.timelineText}>{description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* SECTION 7 */}
          <Text style={styles.h2}>
            7. {content.headings[6]}
          </Text>

          <Text style={styles.body}>
            {content.section7Body1}
          </Text>

          <Text style={styles.body}>
            {content.section7Body2}
          </Text>

          <View style={styles.highlight}>
            <MaterialDesignIcons
              name="account-heart-outline"
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.highlight2Title}</Text>
              <Text style={styles.tipText}>
                {content.highlight2Text}
              </Text>
            </View>
          </View>

          {/* SECTION 8 */}
          <Text style={styles.h2}>8. {content.headings[7]}</Text>

          <Text style={styles.body}>
            {content.section8Body}
          </Text>

          <View style={styles.consultList}>
            {CONSULTATION_SIGN_ICONS.map((icon, index) => (
              <View key={icon} style={styles.consultCard}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={21}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.consultCopy}>
                  <Text style={styles.consultTitle}>{content.consultationSigns[index].title}</Text>
                  <Text style={styles.consultText}>{content.consultationSigns[index].text}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* SECTION 9 */}
          <Text style={styles.h2}>
            9. {content.headings[8]}
          </Text>

          <Text style={styles.body}>
            {content.section9Body}
          </Text>

          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <MaterialDesignIcons
                name="message-question-outline"
                size={22}
                color={theme.colors.primary}
              />
              <Text style={styles.questionTitle}>
                {content.questionTitle}
              </Text>
            </View>

            {content.questions.map((item, index) => (
              <View key={item} style={styles.questionRow}>
                <View style={styles.questionBullet}>
                  <Text style={styles.questionNumber}>{index + 1}</Text>
                </View>
                <Text style={styles.questionText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* SECTION 10 */}
          <Text style={styles.h2}>10. {content.headings[9]}</Text>

          <View style={styles.summaryCard}>
            {content.summaryItems.map(item => (
              <View key={item} style={styles.summaryItem}>
                <MaterialDesignIcons
                  name="check"
                  size={18}
                  color={theme.colors.success}
                />
                <Text style={styles.summaryText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.finalTip}>
            <MaterialDesignIcons
              name="heart-outline"
              size={25}
              color={theme.colors.primary}
            />
            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.finalTipTitle}</Text>
              <Text style={styles.tipText}>
                {content.finalTipText}
              </Text>
            </View>
          </View>

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={19}
              color={theme.colors.textMuted}
            />
            <Text style={styles.disclaimerText}>
              {content.disclaimerText}
            </Text>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={10} scrollRef={scrollRef} />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {flex: 1, backgroundColor: theme.colors.background},
  scroll: {paddingBottom: 30},
  heroWrap: {height: 245, backgroundColor: theme.colors.surfaceSecondary},
  hero: {width: '100%', height: '100%'},
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actions: {flexDirection: 'row', gap: 8},
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.surface, 0.90),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pressed: {opacity: 0.74},
  article: {
    marginTop: -15,
    padding: 20,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: theme.colors.background,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: theme.colors.primarySoft,
  },
  badgeText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 27,
    lineHeight: 32,
    color: theme.colors.text,
    fontWeight: '700',
  },
  metas: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  metaDivider: {width: 1, height: 20, backgroundColor: theme.colors.border},
  meta: {fontSize: 9.5, color: theme.colors.textMuted},
  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  contents: {
    marginTop: 20,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  contentsTitle: {
    marginBottom: 7,
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '800',
  },
  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentLeft: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  contentNumber: {width: 25, color: theme.colors.primary, fontSize: 11.5, fontWeight: '800'},
  contentText: {flex: 1, fontSize: 12.3, lineHeight: 17, color: theme.colors.text},
  h2: {
    marginTop: 27,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },
  body: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21.5,
    color: theme.colors.textSecondary,
  },
  highlight: {
    marginTop: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tip: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  alert: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: theme.colors.text, fontWeight: '800'},
  tipText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textMuted,
  },
  pillarGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  pillarCard: {
    width: '48.5%',
    padding: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  pillarTitle: {
    marginTop: 9,
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },
  pillarText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 16.5,
    color: theme.colors.textMuted,
  },
  checkList: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  checkText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  tipList: {
    marginTop: 14,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 11,
  },
  tipNumber: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  tipNumberText: {fontSize: 10, color: theme.colors.primary, fontWeight: '800'},
  tipRowText: {
    flex: 1,
    marginLeft: 10,
    paddingTop: 2,
    fontSize: 12,
    lineHeight: 17.5,
    color: theme.colors.textSecondary,
  },
  timeline: {
    marginTop: 15,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  timelineMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  timelineNumber: {fontSize: 11, color: theme.colors.primary, fontWeight: '800'},
  timelineCopy: {flex: 1, marginLeft: 11},
  timelineTitle: {fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  timelineText: {
    marginTop: 3,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textMuted,
  },
  consultList: {marginTop: 14, gap: 10},
  consultCard: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  consultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  consultCopy: {flex: 1, marginLeft: 11},
  consultTitle: {fontSize: 13, color: theme.colors.text, fontWeight: '800'},
  consultText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textMuted,
  },
  questionCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 13,
  },
  questionTitle: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 11,
  },
  questionBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  questionNumber: {fontSize: 10, color: theme.colors.primary, fontWeight: '800'},
  questionText: {
    flex: 1,
    marginLeft: 9,
    paddingTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },
  summaryCard: {
    marginTop: 15,
    padding: 16,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  summaryText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },
  finalTip: {
    marginTop: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },
  disclaimer: {
    marginTop: 20,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 16,
    color: theme.colors.textMuted,
  },
  });
}
