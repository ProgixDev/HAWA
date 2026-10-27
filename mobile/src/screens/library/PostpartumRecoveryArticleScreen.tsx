import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Image,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import ReadingControls from '../../components/articles/ReadingControls';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
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
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

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
const CONTENT = withBrazilianPortuguese('PostpartumRecovery', {
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
  tr: {
    badge: 'DOĞUM SONRASI • TOPARLANMA',
    title: 'Doğum sonrası\ntoparlanma',
    metaDuration: '10 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Bedenin zamana ihtiyaç duyar: doğumdan sonra neler normal olabilir.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Doğum sonrası dönemi anlamak',
      'İlk günler: yavaşlamak ve toparlanmak',
      'Toparlanma sürecinde nelerin normal olabileceği',
      'Gün be gün kendine bakmak',
      'Hareket etmek ve aktivitelere kademeli olarak dönmek',
      'Uyku, yorgunluk ve yeni rutinler',
      'Doğumdan sonraki duygular',
      'Ne zaman görüş almalı',
      'Bir sağlık uzmanıyla kontrole gitmek',
      'Akılda tutulacaklar',
    ],
    headings: [
      'Doğum sonrası dönemi anlamak',
      'İlk günler: yavaşlamak ve toparlanmak',
      'Toparlanma sürecinde nelerin normal olabileceği',
      'Gün be gün kendine bakmak',
      'Hareket etmek ve aktivitelere kademeli olarak dönmek',
      'Uyku, yorgunluk ve yeni rutinler',
      'Doğumdan sonraki duygular',
      'Ne zaman görüş almalısın?',
      'Bir sağlık uzmanıyla kontrole gitmek',
      'Akılda tutulacaklar',
    ],
    section1Body1: 'Doğum sonrası dönem, doğumun ardından gelir. Birkaç günle sınırlı değildir: beden, günlük ritim ve duygular, sonraki haftalar boyunca kademeli olarak değişmeye devam edebilir.',
    section1Body2: '“Quarantaine” (kırk gün), toparlanmanın ilk haftalarını anlatmak için sıkça kullanılan geleneksel bir ifadedir. İyi bir hatırlatma olabilir: gebelik ve doğumdan sonra yavaşlamak ve bedene zaman tanımak yerinde olur.',
    highlight1Title: 'Bütün bedenin toparlanması',
    highlight1Text: 'Toparlanma yalnızca bedeni değil; uykuyu, enerjiyi, günlük düzeni ve hayatın yeni bir aşamasına duygusal uyumu da ilgilendirir.',
    section2Body: 'İlk günler yoğun geçebilir. Dinlenme, temel bakım ve yeni ritme uyum çoğu zaman öncelik olur. Hemen alışılmış enerji düzeyine dönmene gerek yok.',
    recoveryPillars: [
      {
        title: 'Dinlenme',
        text: 'Aktivite ile dinlenmeyi dönüşümlü yapmak, bedenin kademeli olarak toparlanmasına yardımcı olur.',
      },
      {
        title: 'Beslenme',
        text: 'Düzenli yemek yemek ve ihtiyacına göre sıvı almak, günlük toparlanmayı destekler.',
      },
      {
        title: 'Destek',
        text: 'Yardımı kabul etmek, enerjini temel bakım ve toparlanma için saklamanı mümkün kılar.',
      },
      {
        title: 'Nazik hareket',
        text: 'Durumuna ve rahatına saygı göstererek hareketlere ve aktivitelere kademeli olarak geri dön.',
      },
    ],
    section3Body1: 'Her toparlanma farklıdır. Bazı değişiklikler uyum döneminin bir parçası olabilir ve kademeli olarak değişebilir:',
    normalSigns: [
      'Belirgin yorgunluk',
      'Giderek azalan kanama',
      'Hormonal ve duygusal dalgalanmalar',
    ],
    section3Body2: 'Belirtilerin şiddeti ve süresi kişiden kişiye değişebilir. Önemli olan, belirtilerin nasıl seyrettiğini izlemek ve bir değişiklik endişe verici ya da olağandışı görünüyorsa görüş almaktır.',
    section4Body: 'Doğum sonrası dönemde, zorlayıcı bir rutinden çok küçük ve gerçekçi alışkanlıklar çoğu zaman daha yardımcıdır. Amaç, baskı eklemeden toparlanmayı desteklemektir.',
    selfCareTips: [
      'Mümkün olduğunda gerçek dinlenme anları planla.',
      'Günlük işler ve yemekler için yardım iste.',
      'Düzenli su iç ve çeşitli beslen.',
      'Toparlanmanı başkalarınınkiyle kıyaslamaktan kaçın.',
      'Her şeyi hemen yapmaya çalışmadan aktivitelere kademeli olarak dön.',
    ],
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Çevrende destek bulundurmak ve yardımı kabul etmek bir lüks değildir. Enerjini korumana ve toparlanmanın daha kademeli ilerlemesine yardımcı olabilir.',
    section5Body1: 'Aktivitelere dönüş adım adım gerçekleşebilir; rahatına, enerjine ve doğumdan sonra aldığın önerilere bağlıdır. Nazik hareketler ve gündelik aktiviteler zaten harekete dönüş sayılır.',
    section5Body2: 'Daha yoğun aktivitelerde, adımları atlamadan ilerlemek ve olası belirtileri ya da rahatsızlığı dikkate almak daha iyidir.',
    alertTitle: 'Bedeninin sinyallerini dinle',
    alertText: 'Bir aktivite sırasında artan rahatsızlık, yavaşlamak için ve gerekirse devam etmeden ya da yoğunluğu artırmadan önce sana uygun görüş almak için bir nedendir.',
    section6Body: 'Uyku, doğumdan sonra düzensizleşebilir. Biriken yorgunluk enerjiyi, konsantrasyonu ve ruh halini etkileyebilir. Mümkün olduğunda bazı işleri basitleştirmek ve sorumlulukları paylaşmak yardımcı olabilir.',
    milestones: [
      [
        'İlk günler',
        'Dinlenme, uyum ve temel bakım.',
      ],
      [
        'İlk haftalar',
        'Kademeli toparlanma ve yeni rutinlerin başlangıcı.',
      ],
      [
        'Doğum sonrası kontrolden sonra',
        'Toparlanmanın ilerleyişini gözden geçirmek ve aktivitelere kademeli dönüşü konuşmak.',
      ],
    ],
    section7Body1: 'Doğum sonrası dönem birçok duyguyu beraberinde getirebilir: sevinç, endişe, yorgunluk, hassasiyet ya da bunalmış hissetme. Bu duygular, özellikle uykunun ve günlük alışkanlıkların değiştiği bir dönemde hızla değişebilir.',
    section7Body2: 'Duygularla başa çıkmak zorlaştığında ya da gündelik hayatta çok yer kapladığında, güvendiğin biriyle ya da bir uzmanla konuşmak yardımcı olabilir.',
    highlight2Title: 'Destek istemek normaldir',
    highlight2Text: 'Nasıl hissettiğini konuşmak ve destek aramak için tamamen tükenmeni ya da bunalmanı beklemene gerek yok.',
    section8Body: 'Bazı durumlar, özellikle kötüleştiğinde, sürdüğünde ya da belirgin endişe yarattığında bir sağlık uzmanıyla konuşmaya değerdir.',
    consultationSigns: [
      {
        title: 'Kötüleşen belirtiler',
        text: 'Düzelmek yerine artan ağrı ya da rahatsızlık, uzman görüşü almayı gerektirir.',
      },
      {
        title: 'Olağandışı kanama',
        text: 'Birdenbire artan ya da olağandışı bir kanama, bir sağlık uzmanına bildirilmelidir.',
      },
      {
        title: 'Süregelen sıkıntı',
        text: 'Duygusal sıkıntı çok yer kaplıyorsa ya da gündelik hayatı zorlaştırıyorsa, bunu konuşmak ve destek istemek önemlidir.',
      },
      {
        title: 'Belirgin endişe',
        text: 'Toparlanmanla ilgili kuşkun varsa, görüş sormak durumuna uygun önerilere ulaşmana yardımcı olur.',
      },
    ],
    section9Body: 'Takip randevuları; toparlanmayı, belirtileri, aktivitelere dönüşü ve kalan sorularını konuşmak için bir fırsattır. Önceden birkaç soru hazırlamak, hiçbir şeyin unutulmamasına yardımcı olabilir.',
    questionTitle: 'Hazırlayabileceğin sorular',
    questions: [
      'Toparlanmam, durumum için beklendiği gibi ilerliyor mu?',
      'Hangi aktivitelere kademeli olarak dönebilirim?',
      'Hangi belirtilere dikkat etmeliyim?',
      'Egzersize daha yoğun bir dönüşü ne zaman düşünebilirim?',
      'Özel bir öneriye ya da rehabilitasyona ihtiyacım var mı?',
    ],
    summaryItems: [
      'Doğumdan sonraki toparlanma kademelidir ve herkes için farklıdır.',
      'Dinlenme ve destek, toparlanmanın ayrılmaz bir parçası olabilir.',
      'Bedensel değişiklikler, uyku ve duygular haftalar içinde değişebilir.',
      'Aktivitelere kademeli dönmek, enerjine ve rahatına daha iyi saygı göstermene yardımcı olur.',
      'Olağandışı, süregelen ya da endişe verici bir belirti fark edersen görüş almak iyi bir adımdır.',
    ],
    finalTipTitle: 'İhtiyacın olan zamanı tanı kendine',
    finalTipText: 'Toparlanma bir yarış değildir. Kademeli ilerlemek, ihtiyaçlarına saygı göstermek ve gerektiğinde destek istemek zaten önemli adımlardır.',
    disclaimerText: 'Bu makale yalnızca bilgilendirme amaçlıdır ve kişiye özel tıbbi görüşün yerini tutmaz. Belirgin, süregelen ya da endişe verici bir belirti yaşarsan bir sağlık uzmanıyla iletişime geç.',
    shareMessage: 'Doğum sonrası toparlanma — AWA',
  },
  ru: {
    badge: 'ПОСЛЕРОДОВОЙ ПЕРИОД • ВОССТАНОВЛЕНИЕ',
    title: 'Восстановление\nпосле родов',
    metaDuration: '10 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Вашему телу нужно время: что считается нормой после родов.',
    contentsTitle: 'В этой статье',
    topics: [
      'Что такое послеродовой период',
      'Первые дни: замедлиться и восстанавливаться',
      'Что может быть нормой во время восстановления',
      'Забота о себе в повседневной жизни',
      'Постепенное возвращение к движению и привычным делам',
      'Сон, усталость и новый распорядок',
      'Эмоции после родов',
      'Когда стоит обратиться за советом',
      'Визит к медицинскому специалисту',
      'Что запомнить',
    ],
    headings: [
      'Что такое послеродовой период',
      'Первые дни: замедлиться и восстанавливаться',
      'Что может быть нормой во время восстановления',
      'Забота о себе в повседневной жизни',
      'Постепенное возвращение к движению и привычным делам',
      'Сон, усталость и новый распорядок',
      'Эмоции после родов',
      'Когда стоит обратиться за советом?',
      'Визит к медицинскому специалисту',
      'Что запомнить',
    ],
    section1Body1: 'Послеродовой период начинается после родов. Он не ограничивается несколькими днями: тело, повседневный ритм и эмоции могут продолжать постепенно меняться в течение следующих недель.',
    section1Body2: '«Карантин» — традиционное выражение, которым часто описывают первые недели восстановления. Оно служит хорошим напоминанием: после беременности и родов стоит замедлиться и дать телу время.',
    highlight1Title: 'Восстановление всего организма',
    highlight1Text: 'Восстановление касается тела, но также сна, энергии, организации повседневной жизни и эмоционального привыкания к новому этапу жизни.',
    section2Body: 'Первые дни могут быть насыщенными. Отдых, базовый уход и привыкание к новому ритму часто выходят на первое место. Не нужно сразу возвращаться к обычному уровню энергии.',
    recoveryPillars: [
      {title: 'Отдых', text: 'Чередование активности и отдыха помогает телу восстанавливаться постепенно.'},
      {title: 'Питание', text: 'Регулярное питание и достаточное питьё по потребности поддерживают восстановление изо дня в день.'},
      {title: 'Поддержка', text: 'Если принимать помощь, можно сберечь силы для самого необходимого ухода и восстановления.'},
      {title: 'Мягкое движение', text: 'Постепенно возвращайтесь к движениям и занятиям, учитывая своё состояние и комфорт.'},
    ],
    section3Body1: 'Каждое восстановление проходит по-своему. Некоторые изменения могут быть частью периода адаптации и постепенно меняться:',
    normalSigns: [
      'Выраженная усталость',
      'Выделения, которые постепенно уменьшаются',
      'Гормональные и эмоциональные колебания',
    ],
    section3Body2: 'Интенсивность и длительность симптомов могут отличаться у разных женщин. Важно наблюдать, как они меняются, и обращаться за советом, если какое-то изменение кажется тревожным или необычным.',
    section4Body: 'В послеродовой период небольшие реалистичные привычки часто полезнее, чем строгий распорядок. Цель — поддерживать восстановление, не создавая лишнего давления.',
    selfCareTips: [
      'По возможности планируйте настоящие моменты отдыха.',
      'Просите помощи с повседневными делами и приготовлением еды.',
      'Пейте регулярно и питайтесь разнообразно.',
      'Не сравнивайте своё восстановление с чужим.',
      'Возвращайтесь к занятиям постепенно, не пытаясь сразу всё успеть.',
    ],
    tip1Title: 'ПОЛЕЗНО ЗНАТЬ',
    tip1Text: 'Окружать себя поддержкой и принимать помощь — это не роскошь. Это помогает сберечь силы и сделать восстановление более плавным.',
    section5Body1: 'Возвращаться к занятиям можно шаг за шагом, ориентируясь на комфорт, энергию и рекомендации, полученные после родов. Мягкие движения и повседневные дела уже считаются возвращением к движению.',
    section5Body2: 'Для более интенсивных нагрузок лучше продвигаться, не перескакивая через этапы, и учитывать любые симптомы или дискомфорт.',
    alertTitle: 'Прислушивайтесь к сигналам своего тела',
    alertText: 'Если дискомфорт нарастает во время занятия, это повод замедлиться и при необходимости обратиться за индивидуальным советом, прежде чем продолжать или увеличивать нагрузку.',
    section6Body: 'После родов сон может стать нерегулярным. Накопленная усталость может влиять на энергию, концентрацию и настроение. По возможности помогает упрощение некоторых дел и распределение обязанностей.',
    milestones: [
      ['Первые дни', 'Отдых, привыкание и необходимый уход.'],
      ['Первые недели', 'Постепенное восстановление и начало нового распорядка.'],
      ['После послеродового осмотра', 'Оценить, как идёт восстановление, и обсудить постепенное возвращение к занятиям.'],
    ],
    section7Body1: 'Послеродовой период может приносить множество эмоций: радость, тревогу, усталость, повышенную чувствительность или ощущение, что всё слишком тяжело. Эти чувства могут быстро меняться, особенно когда меняются сон и привычный распорядок.',
    section7Body2: 'Разговор с человеком, которому вы доверяете, или со специалистом может помочь, когда эмоции трудно переносить или они занимают много места в повседневной жизни.',
    highlight2Title: 'Просить о поддержке — это нормально',
    highlight2Text: 'Не нужно ждать, пока вы окончательно выбьетесь из сил или почувствуете себя подавленной, чтобы поговорить о своём состоянии и попросить поддержки.',
    section8Body: 'Некоторые ситуации стоит обсудить со медицинским специалистом, особенно если они усиливаются, сохраняются или вызывают сильное беспокойство.',
    consultationSigns: [
      {title: 'Ухудшение симптомов', text: 'Боль или дискомфорт, которые нарастают, а не проходят, требуют консультации специалиста.'},
      {title: 'Необычные кровянистые выделения', text: 'О кровотечении, которое внезапно становится обильнее или необычным, следует сообщить медицинскому специалисту.'},
      {title: 'Стойкое эмоциональное неблагополучие', text: 'Если душевная тревога занимает много места или затрудняет повседневную жизнь, важно поговорить об этом и попросить поддержки.'},
      {title: 'Сильное беспокойство', text: 'Если у вас есть сомнения по поводу восстановления, обращение за советом поможет получить рекомендации, подходящие именно вам.'},
    ],
    section9Body: 'Контрольные визиты — повод поговорить о восстановлении, симптомах, возвращении к занятиям и оставшихся вопросах. Если заранее подготовить несколько вопросов, ничего не будет забыто.',
    questionTitle: 'Вопросы, которые можно подготовить',
    questions: [
      'Идёт ли моё восстановление так, как ожидается в моей ситуации?',
      'К каким занятиям я могу постепенно вернуться?',
      'За какими симптомами мне следует наблюдать?',
      'Когда можно задуматься о возвращении к более интенсивным тренировкам?',
      'Нужны ли мне особые рекомендации или реабилитация?',
    ],
    summaryItems: [
      'Восстановление после родов происходит постепенно и у каждой женщины по-своему.',
      'Отдых и поддержка могут быть неотъемлемой частью восстановления.',
      'Физические изменения, сон и эмоции могут меняться в течение нескольких недель.',
      'Постепенное возвращение к занятиям помогает лучше уважать свою энергию и комфорт.',
      'Если вы заметили необычный, стойкий или тревожный симптом, обратиться за советом — хороший шаг.',
    ],
    finalTipTitle: 'Дайте себе столько времени, сколько нужно',
    finalTipText: 'Восстановление — это не гонка. Двигаться постепенно, уважать свои потребности и просить поддержки, когда это необходимо, — уже важные шаги.',
    disclaimerText: 'Эта статья носит исключительно информационный характер и не заменяет индивидуальную медицинскую консультацию. Если вы заметили выраженный, стойкий или тревожный симптом, обратитесь к медицинскому специалисту.',
    shareMessage: 'Восстановление после родов — AWA',
  },
  de: {
    badge: 'WOCHENBETT • ERHOLUNG',
    title: 'Erholung\nnach der Geburt',
    metaDuration: '10 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Dein Körper braucht Zeit: was nach der Geburt normal ist.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Das Wochenbett verstehen',
      'Die ersten Tage: langsamer machen und erholen',
      'Was während der Erholung normal sein kann',
      'Im Alltag gut für dich sorgen',
      'Sich bewegen und Aktivitäten schrittweise wieder aufnehmen',
      'Schlaf, Müdigkeit und neue Routinen',
      'Gefühle nach der Geburt',
      'Wann du dir Rat holen solltest',
      'Rücksprache mit medizinischem Fachpersonal',
      'Was du dir merken kannst',
    ],
    headings: [
      'Das Wochenbett verstehen',
      'Die ersten Tage: langsamer machen und erholen',
      'Was während der Erholung normal sein kann',
      'Im Alltag gut für dich sorgen',
      'Sich bewegen und Aktivitäten schrittweise wieder aufnehmen',
      'Schlaf, Müdigkeit und neue Routinen',
      'Gefühle nach der Geburt',
      'Wann solltest du dir Rat holen?',
      'Rücksprache mit medizinischem Fachpersonal',
      'Was du dir merken kannst',
    ],
    section1Body1: 'Das Wochenbett schließt sich an die Geburt an. Es beschränkt sich nicht auf wenige Tage: Dein Körper, dein Tagesrhythmus und deine Gefühle können sich in den folgenden Wochen weiter nach und nach verändern.',
    section1Body2: 'Die „Quarantaine“ ist ein traditioneller Ausdruck, der oft für die ersten Wochen der Erholung verwendet wird. Er kann eine gute Erinnerung sein: Nach Schwangerschaft und Geburt tut es gut, einen Gang herunterzuschalten und dem Körper Zeit zu geben.',
    highlight1Title: 'Eine Erholung für den ganzen Körper',
    highlight1Text: 'Die Erholung betrifft den Körper, aber auch Schlaf, Energie, die Organisation des Alltags und die emotionale Anpassung an einen neuen Lebensabschnitt.',
    section2Body: 'Die ersten Tage können intensiv sein. Ruhe, grundlegende Pflege und das Einfinden in den neuen Rhythmus stehen oft im Vordergrund. Du musst nicht sofort wieder dein gewohntes Energieniveau erreichen.',
    recoveryPillars: [
      {title: 'Ruhe', text: 'Der Wechsel zwischen Aktivität und Ruhe hilft dem Körper, sich nach und nach zu erholen.'},
      {title: 'Ernährung', text: 'Regelmäßig essen und nach Bedarf trinken unterstützt die Erholung im Alltag.'},
      {title: 'Unterstützung', text: 'Wenn du Hilfe annimmst, kannst du Kraft für das Wesentliche, deine Pflege und deine Erholung, sparen.'},
      {title: 'Sanfte Bewegung', text: 'Nimm Bewegungen und Aktivitäten schrittweise wieder auf und achte dabei auf deinen Zustand und dein Wohlbefinden.'},
    ],
    section3Body1: 'Jede Erholung verläuft anders. Manche Veränderungen können zur Umstellungsphase gehören und sich nach und nach weiterentwickeln:',
    normalSigns: [
      'Deutliche Müdigkeit',
      'Blutungen, die nach und nach nachlassen',
      'Hormonelle und emotionale Schwankungen',
    ],
    section3Body2: 'Intensität und Dauer der Beschwerden können von Frau zu Frau unterschiedlich sein. Wichtig ist, ihre Entwicklung zu beobachten und dir Rat zu holen, wenn dir eine Veränderung besorgniserregend oder ungewöhnlich erscheint.',
    section4Body: 'Im Wochenbett helfen kleine, realistische Gewohnheiten oft mehr als eine anspruchsvolle Routine. Ziel ist es, die Erholung zu unterstützen, ohne zusätzlichen Druck aufzubauen.',
    selfCareTips: [
      'Plane, wann immer möglich, echte Ruhepausen ein.',
      'Bitte um Hilfe bei Alltagsaufgaben und Mahlzeiten.',
      'Trinke regelmäßig und ernähre dich abwechslungsreich.',
      'Vergleiche deine Erholung nicht mit der einer anderen.',
      'Nimm Aktivitäten schrittweise wieder auf, ohne sofort alles schaffen zu wollen.',
    ],
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Dich mit Unterstützung zu umgeben und Hilfe anzunehmen ist kein Luxus. Es kann helfen, Energie zu bewahren und die Erholung behutsamer zu gestalten.',
    section5Body1: 'Aktivitäten kannst du Schritt für Schritt wieder aufnehmen, je nach Wohlbefinden, Energie und den Empfehlungen, die du nach der Geburt erhalten hast. Sanfte Bewegungen und alltägliche Aktivitäten zählen bereits als Rückkehr zur Bewegung.',
    section5Body2: 'Bei intensiveren Aktivitäten ist es am besten, Schritt für Schritt vorzugehen, keine Etappe zu überspringen und Beschwerden oder Unwohlsein ernst zu nehmen.',
    alertTitle: 'Höre auf die Signale deines Körpers',
    alertText: 'Unwohlsein, das bei einer Aktivität zunimmt, ist ein Grund, langsamer zu machen und dir bei Bedarf passenden Rat zu holen, bevor du weitermachst oder die Intensität steigerst.',
    section6Body: 'Der Schlaf kann nach der Geburt unregelmäßig werden. Angesammelte Müdigkeit kann Energie, Konzentration und Stimmung beeinflussen. Wenn möglich, kann es helfen, manche Aufgaben zu vereinfachen und Verantwortung zu teilen.',
    milestones: [
      ['Erste Tage', 'Ruhe, Eingewöhnung und grundlegende Pflege.'],
      ['Erste Wochen', 'Schrittweise Erholung und Beginn neuer Routinen.'],
      ['Nach der Nachuntersuchung', 'Fortschritte der Erholung besprechen und über die schrittweise Wiederaufnahme von Aktivitäten sprechen.'],
    ],
    section7Body1: 'Das Wochenbett kann viele Gefühle mit sich bringen: Freude, Sorge, Müdigkeit, Empfindlichkeit oder das Gefühl, überfordert zu sein. Diese Gefühle können schnell wechseln, besonders in einer Zeit, in der sich Schlaf und Alltagsgewohnheiten verändern.',
    section7Body2: 'Mit einer Vertrauensperson oder mit Fachpersonal zu sprechen kann helfen, wenn Gefühle schwer zu bewältigen sind oder viel Raum im Alltag einnehmen.',
    highlight2Title: 'Um Unterstützung zu bitten ist normal',
    highlight2Text: 'Du musst nicht warten, bis du völlig erschöpft oder überfordert bist, um darüber zu sprechen, wie es dir geht, und dir Unterstützung zu holen.',
    section8Body: 'Manche Situationen solltest du mit medizinischem Fachpersonal besprechen, besonders wenn sie sich verschlimmern, anhalten oder dich stark beunruhigen.',
    consultationSigns: [
      {title: 'Sich verschlimmernde Beschwerden', text: 'Schmerzen oder Unwohlsein, die zunehmen, statt besser zu werden, verdienen fachlichen Rat.'},
      {title: 'Ungewöhnliche Blutungen', text: 'Blutungen, die plötzlich stärker werden oder ungewöhnlich sind, solltest du medizinischem Fachpersonal melden.'},
      {title: 'Anhaltende seelische Belastung', text: 'Wenn seelische Belastung viel Raum einnimmt oder den Alltag erschwert, ist es wichtig, darüber zu sprechen und Unterstützung zu suchen.'},
      {title: 'Deutliche Sorge', text: 'Wenn du bei deiner Erholung unsicher bist, hilft dir eine Nachfrage, Empfehlungen zu bekommen, die zu deiner Situation passen.'},
    ],
    section9Body: 'Kontrolltermine sind eine Gelegenheit, über Erholung, Beschwerden, die Wiederaufnahme von Aktivitäten und offene Fragen zu sprechen. Ein paar vorbereitete Fragen helfen dir, nichts zu vergessen.',
    questionTitle: 'Fragen, die du vorbereiten kannst',
    questions: [
      'Verläuft meine Erholung so, wie es für meine Situation zu erwarten ist?',
      'Welche Aktivitäten kann ich schrittweise wieder aufnehmen?',
      'Auf welche Symptome sollte ich achten?',
      'Wann kann ich über einen intensiveren Wiedereinstieg in den Sport nachdenken?',
      'Brauche ich spezielle Hinweise oder eine Rückbildung?',
    ],
    summaryItems: [
      'Die Erholung nach der Geburt verläuft schrittweise und ist bei jeder Frau anders.',
      'Ruhe und Unterstützung können ein fester Teil der Erholung sein.',
      'Körperliche Veränderungen, Schlaf und Gefühle können sich über die Wochen entwickeln.',
      'Aktivitäten schrittweise wieder aufzunehmen hilft dir, deine Energie und dein Wohlbefinden besser zu achten.',
      'Wenn dir ein ungewöhnliches, anhaltendes oder besorgniserregendes Symptom auffällt, ist es ein guter Schritt, dir Rat zu holen.',
    ],
    finalTipTitle: 'Nimm dir die Zeit, die du brauchst',
    finalTipText: 'Erholung ist kein Wettrennen. Schritt für Schritt voranzugehen, auf deine Bedürfnisse zu achten und bei Bedarf um Unterstützung zu bitten, sind bereits wichtige Schritte.',
    disclaimerText: 'Dieser Artikel dient ausschließlich der Information und ersetzt keine individuelle ärztliche Beratung. Wenn dir ein deutliches, anhaltendes oder besorgniserregendes Symptom auffällt, wende dich an medizinisches Fachpersonal.',
    shareMessage: 'Erholung nach der Geburt – AWA',
  },
  zh: {
      badge: '产后 • 恢复',
      title: '分娩后的\n身体恢复',
      metaDuration: '阅读约 10 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '你的身体需要时间：产后哪些情况可能是正常的。',
      contentsTitle: '本文内容',
      topics: [
        '了解产后阶段',
        '最初几天：放慢节奏，好好恢复',
        '恢复期间哪些情况可能是正常的',
        '日常照顾自己',
        '循序渐进地活动和恢复日常',
        '睡眠、疲劳与新的作息',
        '分娩后的情绪',
        '何时寻求建议',
        '向医疗专业人员复诊',
        '记住这几点',
      ],
      headings: [
        '了解产后阶段',
        '最初几天：放慢节奏，好好恢复',
        '恢复期间哪些情况可能是正常的',
        '日常照顾自己',
        '循序渐进地活动和恢复日常',
        '睡眠、疲劳与新的作息',
        '分娩后的情绪',
        '什么时候该寻求建议？',
        '向医疗专业人员复诊',
        '记住这几点',
      ],
      section1Body1: '产后阶段紧接着分娩开始，并不只是短短几天：在接下来的几周里，身体、日常节奏和情绪都可能继续慢慢变化。',
      section1Body2: '“四十天”（quarantaine）是一种传统说法，常用来形容产后最初几周的恢复期。它也是个很好的提醒：经历怀孕和分娩之后，值得放慢脚步，给身体一些时间。',
      highlight1Title: '全身的恢复',
      highlight1Text: '恢复不只关乎身体，也关乎睡眠、精力、日常安排，以及对人生新阶段的情绪适应。',
      section2Body: '最初几天可能很紧张。休息、基础护理和适应新的节奏，往往是最重要的事。不必马上恢复到平时的精力水平。',
      recoveryPillars: [
        {
          title: '休息',
          text: '活动与休息交替进行，有助于身体慢慢恢复。',
        },
        {
          title: '营养',
          text: '规律进食，并按需要补充水分，有助于日常恢复。',
        },
        {
          title: '支持',
          text: '接受他人的帮助，就能把精力留给必要的照护和恢复。',
        },
        {
          title: '轻柔活动',
          text: '根据自己的状态和舒适度，逐步恢复活动。',
        },
      ],
      section3Body1: '每个人的恢复过程都不一样。有些变化可能属于适应期的一部分，会慢慢发生改变：',
      normalSigns: [
        '明显的疲劳',
        '出血逐渐减少',
        '激素水平和情绪的波动',
      ],
      section3Body2: '症状的强度和持续时间因人而异。重要的是留意它们的变化；如果出现令你担心或不寻常的变化，请及时寻求建议。',
      section4Body: '产后阶段，小而现实的习惯往往比苛刻的安排更有帮助。目标是支持恢复，而不是给自己增加压力。',
      selfCareTips: [
        '尽可能安排真正的休息时间。',
        '日常事务和饮食可以请人帮忙。',
        '规律喝水，饮食保持多样。',
        '不要拿自己的恢复情况和别人比较。',
        '逐步恢复活动，不必急着一下子做完所有事。',
      ],
      tip1Title: '小贴士',
      tip1Text: '身边有人支持、愿意接受帮助，并不是奢侈。这有助于保存精力，让恢复更加循序渐进。',
      section5Body1: '恢复活动可以一步一步来，根据舒适度、精力以及分娩后得到的建议而定。轻柔的动作和日常活动，本身就算是在恢复运动。',
      section5Body2: '对于强度更大的活动，最好循序渐进、不要跳步，并留意任何症状或不适。',
      alertTitle: '留意身体发出的信号',
      alertText: '如果活动中不适感加重，说明需要放慢节奏；必要时，在继续或加大强度之前，请先寻求适合你的建议。',
      section6Body: '分娩后，睡眠可能变得不规律。累积的疲劳会影响精力、注意力和情绪。如果可以，简化一些事务、分担责任会有所帮助。',
      milestones: [
        [
          '最初几天',
          '休息、适应和必要的护理。',
        ],
        [
          '最初几周',
          '逐步恢复，并开始建立新的作息。',
        ],
        [
          '产后检查之后',
          '了解恢复的进展，并讨论如何逐步恢复活动。',
        ],
      ],
      section7Body1: '产后阶段可能带来许多情绪：喜悦、担忧、疲惫、敏感，或是不堪重负的感觉。这些感受可能变化很快，尤其是在睡眠和日常习惯都在改变的时期。',
      section7Body2: '当情绪变得难以应对，或在日常生活中占据很大的位置时，和信任的人或专业人员聊一聊会有帮助。',
      highlight2Title: '寻求支持是很正常的事',
      highlight2Text: '不必等到筋疲力尽、不堪重负时，才去谈论自己的感受、寻求支持。',
      section8Body: '有些情况值得和医疗专业人员讨论，尤其是在情况加重、持续存在或让你十分担心的时候。',
      consultationSigns: [
        {
          title: '症状加重',
          text: '疼痛或不适不但没有好转反而加重，应当向专业人员咨询。',
        },
        {
          title: '不寻常的出血',
          text: '出血突然增多或有异常，应告知医疗专业人员。',
        },
        {
          title: '持续的痛苦',
          text: '如果情绪上的痛苦占据了很大的位置，或让日常生活变得艰难，请把它说出来并寻求支持，这很重要。',
        },
        {
          title: '明显的担忧',
          text: '如果对自己的恢复情况有疑虑，寻求建议能帮你获得适合自己情况的指导。',
        },
      ],
      section9Body: '复诊是谈论恢复情况、症状、恢复活动以及其他疑问的好机会。提前准备几个问题，有助于避免遗漏。',
      questionTitle: '可以提前准备的问题',
      questions: [
        '按我的情况来看，我的恢复进展符合预期吗？',
        '我可以逐步恢复哪些活动？',
        '我需要留意哪些症状？',
        '我什么时候可以考虑更高强度的运动？',
        '我是否需要特别的建议或康复训练？',
      ],
      summaryItems: [
        '分娩后的恢复是循序渐进的，每个人都不一样。',
        '休息和支持可以是恢复中不可缺少的一部分。',
        '身体变化、睡眠和情绪可能会在数周内不断变化。',
        '逐步恢复活动，有助于更好地顾及自己的精力和舒适度。',
        '如果出现不寻常、持续或令你担心的症状，寻求建议是个好办法。',
      ],
      finalTipTitle: '给自己需要的时间',
      finalTipText: '恢复不是一场比赛。循序渐进、尊重自己的需要、必要时寻求支持，这些本身就已经是重要的一步。',
      disclaimerText: '本文仅供参考，不能替代个性化的医疗建议。如果出现明显、持续或令你担心的症状，请联系医疗专业人员。',
      shareMessage: '分娩后的身体恢复 — AWA',
    },
  id: {
    badge: 'PASCAPERSALINAN • PEMULIHAN',
    title: 'Pemulihan\nsetelah melahirkan',
    metaDuration: '10 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Tubuhmu butuh waktu: apa saja yang wajar terjadi setelah melahirkan.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Memahami masa pascapersalinan',
      'Hari-hari pertama: memperlambat ritme dan memulihkan diri',
      'Apa yang bisa dianggap wajar selama pemulihan',
      'Merawat diri sehari-hari',
      'Bergerak dan kembali beraktivitas secara bertahap',
      'Tidur, kelelahan, dan rutinitas baru',
      'Emosi setelah melahirkan',
      'Kapan perlu meminta saran',
      'Kontrol ke tenaga kesehatan',
      'Hal yang perlu diingat',
    ],
    headings: [
      'Memahami masa pascapersalinan',
      'Hari-hari pertama: memperlambat ritme dan memulihkan diri',
      'Apa yang bisa dianggap wajar selama pemulihan',
      'Merawat diri sehari-hari',
      'Bergerak dan kembali beraktivitas secara bertahap',
      'Tidur, kelelahan, dan rutinitas baru',
      'Emosi setelah melahirkan',
      'Kapan sebaiknya meminta saran?',
      'Kontrol ke tenaga kesehatan',
      'Hal yang perlu diingat',
    ],
    section1Body1: 'Masa pascapersalinan dimulai setelah melahirkan. Masa ini tidak terbatas pada beberapa hari saja: tubuh, ritme harian, dan emosi bisa terus berubah secara bertahap selama minggu-minggu berikutnya.',
    section1Body2: '“Quarantaine” adalah ungkapan tradisional yang sering dipakai untuk menggambarkan beberapa minggu pertama pemulihan. Ungkapan ini bisa menjadi pengingat yang baik: setelah hamil dan melahirkan, sebaiknya kamu memperlambat ritme dan memberi waktu bagi tubuh.',
    highlight1Title: 'Pemulihan seluruh tubuh',
    highlight1Text: 'Pemulihan menyangkut tubuh, tetapi juga tidur, energi, pengaturan kegiatan sehari-hari, dan penyesuaian emosi terhadap tahap kehidupan yang baru.',
    section2Body: 'Hari-hari pertama bisa terasa intens. Istirahat, perawatan dasar, dan penyesuaian dengan ritme baru sering menjadi prioritas. Kamu tidak perlu langsung mendapatkan kembali tingkat energimu yang biasa.',
    recoveryPillars: [
      {
        title: 'Istirahat',
        text: 'Menyelingi aktivitas dengan istirahat membantu tubuh pulih secara bertahap.',
      },
      {
        title: 'Nutrisi',
        text: 'Makan secara teratur dan minum sesuai kebutuhanmu menunjang pemulihan sehari-hari.',
      },
      {
        title: 'Dukungan',
        text: 'Menerima bantuan memungkinkanmu menghemat energi untuk perawatan dan pemulihan yang esensial.',
      },
      {
        title: 'Gerakan lembut',
        text: 'Kembalilah bergerak dan beraktivitas secara bertahap, dengan menghargai kondisi dan kenyamananmu.',
      },
    ],
    section3Body1: 'Setiap pemulihan berbeda. Beberapa perubahan bisa menjadi bagian dari masa penyesuaian dan berkembang secara bertahap:',
    normalSigns: [
      'Kelelahan yang signifikan',
      'Pendarahan yang berangsur berkurang',
      'Fluktuasi hormonal dan emosional',
    ],
    section3Body2: 'Intensitas dan lamanya gejala bisa berbeda dari satu orang ke orang lain. Yang terpenting adalah memperhatikan perkembangannya dan meminta saran jika ada perubahan yang terasa mengkhawatirkan atau tidak biasa.',
    section4Body: 'Pada masa pascapersalinan, kebiasaan kecil yang realistis sering kali lebih membantu daripada rutinitas yang menuntut. Tujuannya adalah menunjang pemulihan tanpa menambah tekanan.',
    selfCareTips: [
      'Jadwalkan waktu istirahat yang sungguh-sungguh kapan pun memungkinkan.',
      'Mintalah bantuan untuk pekerjaan rumah dan makanan.',
      'Minumlah secara teratur dan jaga pola makan yang beragam.',
      'Hindari membandingkan pemulihanmu dengan pemulihan orang lain.',
      'Kembalilah beraktivitas secara bertahap, tanpa mencoba melakukan semuanya sekaligus.',
    ],
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Dikelilingi dukungan dan menerima bantuan bukanlah kemewahan. Hal ini bisa membantu menjaga energi dan membuat pemulihan berjalan lebih bertahap.',
    section5Body1: 'Kembali beraktivitas bisa dilakukan selangkah demi selangkah, sesuai kenyamanan, energi, dan anjuran yang diterima setelah melahirkan. Gerakan lembut dan aktivitas sehari-hari sudah termasuk kembali bergerak.',
    section5Body2: 'Untuk aktivitas yang lebih berat, sebaiknya maju tanpa melewati tahapan dan memperhatikan gejala atau rasa tidak nyaman yang muncul.',
    alertTitle: 'Dengarkan sinyal dari tubuhmu',
    alertText: 'Rasa tidak nyaman yang bertambah saat beraktivitas adalah alasan untuk memperlambat dan, bila perlu, meminta saran yang sesuai sebelum melanjutkan atau menambah intensitas.',
    section6Body: 'Tidur bisa menjadi tidak teratur setelah melahirkan. Kelelahan yang menumpuk dapat memengaruhi energi, konsentrasi, dan suasana hati. Jika memungkinkan, menyederhanakan beberapa tugas dan berbagi tanggung jawab bisa membantu.',
    milestones: [
      [
        'Hari-hari pertama',
        'Istirahat, penyesuaian, dan perawatan esensial.',
      ],
      [
        'Minggu-minggu pertama',
        'Pemulihan bertahap dan awal rutinitas baru.',
      ],
      [
        'Setelah pemeriksaan pascapersalinan',
        'Meninjau perkembangan pemulihan dan membahas kembali beraktivitas secara bertahap.',
      ],
    ],
    section7Body1: 'Masa pascapersalinan bisa membawa banyak emosi: bahagia, khawatir, lelah, sensitif, atau merasa kewalahan. Perasaan ini bisa berubah dengan cepat, terutama pada masa ketika tidur dan kebiasaan sehari-hari sedang berubah.',
    section7Body2: 'Berbicara dengan orang yang kamu percaya atau dengan tenaga profesional bisa membantu ketika emosi sulit dikendalikan atau menyita banyak ruang dalam kehidupan sehari-hari.',
    highlight2Title: 'Meminta dukungan adalah hal yang wajar',
    highlight2Text: 'Kamu tidak perlu menunggu sampai benar-benar kehabisan tenaga atau kewalahan untuk membicarakan perasaanmu dan mencari dukungan.',
    section8Body: 'Beberapa situasi layak dibicarakan dengan tenaga kesehatan, terutama jika memburuk, menetap, atau menimbulkan kekhawatiran yang besar.',
    consultationSigns: [
      {
        title: 'Gejala yang memburuk',
        text: 'Nyeri atau rasa tidak nyaman yang bertambah, bukannya membaik, perlu mendapat saran dari tenaga profesional.',
      },
      {
        title: 'Pendarahan yang tidak biasa',
        text: 'Pendarahan yang tiba-tiba menjadi lebih banyak atau tidak biasa sebaiknya dilaporkan kepada tenaga kesehatan.',
      },
      {
        title: 'Tekanan batin yang menetap',
        text: 'Jika tekanan emosional menyita banyak ruang atau membuat kehidupan sehari-hari sulit, penting untuk membicarakannya dan meminta dukungan.',
      },
      {
        title: 'Kekhawatiran yang besar',
        text: 'Jika kamu ragu tentang pemulihanmu, meminta saran membantumu mendapatkan anjuran yang sesuai dengan situasimu.',
      },
    ],
    section9Body: 'Janji kontrol adalah kesempatan untuk membahas pemulihan, gejala, kembali beraktivitas, dan pertanyaan yang masih tersisa. Menyiapkan beberapa pertanyaan sebelumnya bisa membantu memastikan tidak ada yang terlupa.',
    questionTitle: 'Pertanyaan yang bisa kamu siapkan',
    questions: [
      'Apakah pemulihanku berjalan sesuai harapan untuk kondisiku?',
      'Aktivitas apa saja yang boleh kulanjutkan secara bertahap?',
      'Gejala apa yang perlu kuwaspadai?',
      'Kapan aku bisa mempertimbangkan kembali berolahraga dengan intensitas lebih berat?',
      'Apakah aku memerlukan saran khusus atau rehabilitasi?',
    ],
    summaryItems: [
      'Pemulihan setelah melahirkan berlangsung bertahap dan berbeda bagi setiap orang.',
      'Istirahat dan dukungan bisa menjadi bagian yang tak terpisahkan dari pemulihan.',
      'Perubahan fisik, tidur, dan emosi bisa terus berkembang selama beberapa minggu.',
      'Kembali beraktivitas secara bertahap membantumu lebih menghargai energi dan kenyamananmu.',
      'Jika kamu menyadari gejala yang tidak biasa, menetap, atau mengkhawatirkan, meminta saran adalah langkah yang baik.',
    ],
    finalTipTitle: 'Luangkan waktu yang kamu butuhkan',
    finalTipText: 'Pemulihan bukanlah perlombaan. Maju secara bertahap, menghargai kebutuhanmu, dan meminta dukungan saat diperlukan sudah merupakan langkah-langkah penting.',
    disclaimerText: 'Artikel ini hanya untuk tujuan informasi dan tidak menggantikan saran medis yang dipersonalisasi. Jika kamu mengalami gejala yang signifikan, menetap, atau mengkhawatirkan, hubungi tenaga kesehatan.',
    shareMessage: 'Pemulihan setelah melahirkan — AWA',
  },
  hi: {
    badge: 'प्रसवोत्तर • रिकवरी',
    title: 'प्रसव के बाद\nरिकवरी',
    metaDuration: '10 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षा किया गया कंटेंट',
    intro: 'आपके शरीर को समय चाहिए: बच्चे के जन्म के बाद क्या सामान्य हो सकता है।',
    contentsTitle: 'इस लेख में',
    topics: [
      'प्रसवोत्तर काल को समझना',
      'शुरुआती दिन: धीमे चलें और ठीक होने दें',
      'रिकवरी के दौरान क्या सामान्य हो सकता है',
      'रोज़ाना अपना ध्यान रखना',
      'धीरे-धीरे चलना-फिरना और काम दोबारा शुरू करना',
      'नींद, थकान और नई दिनचर्या',
      'प्रसव के बाद की भावनाएँ',
      'सलाह कब लें',
      'स्वास्थ्य विशेषज्ञ से जाँच करवाना',
      'याद रखने वाली बातें',
    ],
    headings: [
      'प्रसवोत्तर काल को समझना',
      'शुरुआती दिन: धीमे चलें और ठीक होने दें',
      'रिकवरी के दौरान क्या सामान्य हो सकता है',
      'रोज़ाना अपना ध्यान रखना',
      'धीरे-धीरे चलना-फिरना और काम दोबारा शुरू करना',
      'नींद, थकान और नई दिनचर्या',
      'प्रसव के बाद की भावनाएँ',
      'सलाह कब लेनी चाहिए?',
      'स्वास्थ्य विशेषज्ञ से जाँच करवाना',
      'याद रखने वाली बातें',
    ],
    section1Body1: 'प्रसवोत्तर काल बच्चे के जन्म के बाद शुरू होता है। यह सिर्फ़ कुछ दिनों का नहीं होता: अगले कुछ हफ़्तों तक शरीर, रोज़ की दिनचर्या और भावनाएँ धीरे-धीरे बदलती रह सकती हैं।',
    section1Body2: '“क्वारंटाइन” एक पारंपरिक शब्द है, जिसका इस्तेमाल अक्सर रिकवरी के पहले हफ़्तों के लिए किया जाता है। यह एक अच्छी याद दिलाता है: गर्भावस्था और प्रसव के बाद धीमे चलना और शरीर को समय देना ज़रूरी है।',
    highlight1Title: 'पूरे शरीर की रिकवरी',
    highlight1Text: 'रिकवरी का संबंध शरीर से तो है ही, साथ ही नींद, ऊर्जा, रोज़ के कामों की व्यवस्था और ज़िंदगी के नए पड़ाव से तालमेल बिठाने से भी है।',
    section2Body: 'शुरुआती दिन थकाने वाले हो सकते हैं। आराम, ज़रूरी देखभाल और नई दिनचर्या के साथ तालमेल बिठाना अक्सर सबसे पहली प्राथमिकता होती है। अपनी पहले जैसी ऊर्जा तुरंत वापस पाने की ज़रूरत नहीं है।',
    recoveryPillars: [
      {
        title: 'आराम',
        text: 'काम और आराम को बारी-बारी से करने से शरीर धीरे-धीरे ठीक होता है।',
      },
      {
        title: 'खान-पान',
        text: 'नियमित रूप से खाना और अपनी ज़रूरत के हिसाब से पानी पीना रोज़ की रिकवरी में मदद करता है।',
      },
      {
        title: 'सहयोग',
        text: 'मदद स्वीकार करने से ज़रूरी देखभाल और रिकवरी के लिए ऊर्जा बचाई जा सकती है।',
      },
      {
        title: 'हल्की गतिविधि',
        text: 'अपनी हालत और सहूलियत का ध्यान रखते हुए चलना-फिरना और काम धीरे-धीरे दोबारा शुरू करें।',
      },
    ],
    section3Body1: 'हर किसी की रिकवरी अलग होती है। कुछ बदलाव तालमेल बैठने की अवधि का हिस्सा हो सकते हैं और धीरे-धीरे बदलते रहते हैं:',
    normalSigns: [
      'बहुत ज़्यादा थकान',
      'रक्तस्राव का धीरे-धीरे कम होना',
      'हार्मोन और भावनाओं में उतार-चढ़ाव',
    ],
    section3Body2: 'लक्षणों की तीव्रता और अवधि हर महिला में अलग हो सकती है। ज़रूरी यह है कि आप देखती रहें कि वे कैसे बदल रहे हैं, और कोई बदलाव चिंताजनक या असामान्य लगे तो सलाह लें।',
    section4Body: 'प्रसवोत्तर काल में, कठिन दिनचर्या के बजाय छोटी और व्यावहारिक आदतें अक्सर ज़्यादा मददगार होती हैं। मकसद यह है कि बिना किसी दबाव के रिकवरी में सहारा मिले।',
    selfCareTips: [
      'जब भी हो सके, आराम के लिए सच में समय निकालें।',
      'रोज़ के कामों और खाने के लिए मदद माँगें।',
      'नियमित रूप से पानी पिएँ और अलग-अलग तरह का खाना खाएँ।',
      'अपनी रिकवरी की तुलना किसी और से न करें।',
      'सब कुछ एक साथ करने की कोशिश किए बिना, काम धीरे-धीरे दोबारा शुरू करें।',
    ],
    tip1Title: 'जानना अच्छा रहेगा',
    tip1Text: 'अपने आसपास सहयोग रखना और मदद स्वीकार करना कोई विलासिता नहीं है। इससे ऊर्जा बची रह सकती है और रिकवरी ज़्यादा धीरे-धीरे और आराम से हो सकती है।',
    section5Body1: 'काम दोबारा शुरू करना कदम-दर-कदम हो सकता है, आपकी सहूलियत, ऊर्जा और प्रसव के बाद मिली सलाह के अनुसार। हल्की गतिविधियाँ और रोज़मर्रा के काम भी पहले से ही चलने-फिरने की वापसी माने जाते हैं।',
    section5Body2: 'ज़्यादा मेहनत वाली गतिविधियों के लिए, कोई चरण छोड़े बिना आगे बढ़ना और किसी भी लक्षण या तकलीफ़ पर ध्यान देना बेहतर है।',
    alertTitle: 'अपने शरीर के संकेतों को सुनें',
    alertText: 'किसी गतिविधि के दौरान तकलीफ़ बढ़ना धीमे होने की वजह है, और ज़रूरत हो तो आगे बढ़ने या मेहनत बढ़ाने से पहले अपने हिसाब से सलाह लें।',
    section6Body: 'बच्चे के जन्म के बाद नींद अनियमित हो सकती है। जमा हुई थकान ऊर्जा, ध्यान और मूड पर असर डाल सकती है। जब संभव हो, कुछ कामों को आसान बनाना और ज़िम्मेदारियाँ बाँटना मदद कर सकता है।',
    milestones: [
      [
        'शुरुआती दिन',
        'आराम, तालमेल बिठाना और ज़रूरी देखभाल।',
      ],
      [
        'शुरुआती हफ़्ते',
        'धीरे-धीरे रिकवरी और नई दिनचर्या की शुरुआत।',
      ],
      [
        'प्रसव के बाद की जाँच के बाद',
        'रिकवरी की प्रगति देखें और धीरे-धीरे काम दोबारा शुरू करने पर बात करें।',
      ],
    ],
    section7Body1: 'प्रसवोत्तर काल में कई भावनाएँ आ सकती हैं: खुशी, चिंता, थकान, संवेदनशीलता या सब कुछ बहुत ज़्यादा लगना। ये भावनाएँ जल्दी-जल्दी बदल सकती हैं, खासकर तब जब नींद और रोज़ की आदतें बदल रही हों।',
    section7Body2: 'जब भावनाओं को संभालना मुश्किल हो जाए या वे रोज़ की ज़िंदगी में बहुत जगह घेरने लगें, तो किसी भरोसेमंद व्यक्ति या विशेषज्ञ से बात करना मदद कर सकता है।',
    highlight2Title: 'सहारा माँगना सामान्य बात है',
    highlight2Text: 'अपनी भावनाओं के बारे में बात करने और सहारा लेने के लिए पूरी तरह थक जाने या टूट जाने का इंतज़ार करने की ज़रूरत नहीं है।',
    section8Body: 'कुछ स्थितियों के बारे में स्वास्थ्य विशेषज्ञ से बात करना ठीक रहता है, खासकर जब वे बिगड़ें, बनी रहें या बहुत चिंता पैदा करें।',
    consultationSigns: [
      {
        title: 'लक्षणों का बिगड़ना',
        text: 'जो दर्द या तकलीफ़ ठीक होने के बजाय बढ़ रही हो, उसके लिए विशेषज्ञ की सलाह लेनी चाहिए।',
      },
      {
        title: 'असामान्य रक्तस्राव',
        text: 'अगर रक्तस्राव अचानक ज़्यादा हो जाए या असामान्य लगे, तो स्वास्थ्य विशेषज्ञ को बताना चाहिए।',
      },
      {
        title: 'लगातार बनी रहने वाली परेशानी',
        text: 'अगर भावनात्मक परेशानी बहुत जगह घेर ले या रोज़ की ज़िंदगी मुश्किल कर दे, तो इस बारे में बात करना और सहारा माँगना ज़रूरी है।',
      },
      {
        title: 'बहुत ज़्यादा चिंता',
        text: 'अपनी रिकवरी को लेकर शक हो तो सलाह लेने से आपको अपनी स्थिति के अनुसार सुझाव मिल सकते हैं।',
      },
    ],
    section9Body: 'फ़ॉलो-अप अपॉइंटमेंट रिकवरी, लक्षणों, काम दोबारा शुरू करने और बाकी सवालों पर बात करने का मौका होते हैं। पहले से कुछ सवाल तैयार कर लेने से यह पक्का किया जा सकता है कि कुछ भूल न जाए।',
    questionTitle: 'तैयार किए जा सकने वाले सवाल',
    questions: [
      'क्या मेरी रिकवरी मेरी स्थिति के हिसाब से उम्मीद के मुताबिक़ चल रही है?',
      'मैं कौन-सी गतिविधियाँ धीरे-धीरे दोबारा शुरू कर सकती हूँ?',
      'मुझे किन लक्षणों पर नज़र रखनी चाहिए?',
      'मैं ज़्यादा मेहनत वाली कसरत दोबारा कब शुरू करने के बारे में सोच सकती हूँ?',
      'क्या मुझे किसी खास सलाह या पुनर्वास की ज़रूरत है?',
    ],
    summaryItems: [
      'प्रसव के बाद की रिकवरी धीरे-धीरे होती है और हर किसी के लिए अलग होती है।',
      'आराम और सहयोग रिकवरी का अहम हिस्सा हो सकते हैं।',
      'शारीरिक बदलाव, नींद और भावनाएँ हफ़्तों में बदलती रह सकती हैं।',
      'काम धीरे-धीरे दोबारा शुरू करने से आप अपनी ऊर्जा और सहूलियत का बेहतर ध्यान रख पाती हैं।',
      'अगर कोई असामान्य, लगातार बना रहने वाला या चिंताजनक लक्षण दिखे, तो सलाह लेना अच्छा कदम है।',
    ],
    finalTipTitle: 'अपनी ज़रूरत के मुताबिक़ समय लें',
    finalTipText: 'रिकवरी कोई दौड़ नहीं है। धीरे-धीरे आगे बढ़ना, अपनी ज़रूरतों का सम्मान करना और ज़रूरत पड़ने पर सहारा माँगना, ये सब पहले से ही अहम कदम हैं।',
    disclaimerText: 'यह लेख सिर्फ़ जानकारी के लिए है और व्यक्तिगत चिकित्सकीय सलाह की जगह नहीं लेता। अगर आपको कोई गंभीर, लगातार बना रहने वाला या चिंताजनक लक्षण हो, तो स्वास्थ्य विशेषज्ञ से संपर्क करें।',
    shareMessage: 'प्रसव के बाद रिकवरी — AWA',
  },
  sq: {
    badge: 'PAS LINDJES • RIPËRTËRIRJA',
    title: 'Ripërtëritja\npas lindjes',
    metaDuration: '10 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Trupi yt ka nevojë për kohë: çfarë është normale pas lindjes.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Të kuptojmë periudhën pas lindjes',
      'Ditët e para: ngadalëso dhe rimëkëmbu',
      'Çfarë mund të jetë normale gjatë ripërtëritjes',
      'Kujdesu për veten çdo ditë',
      'Lëvizja dhe rifillimi gradual i aktiviteteve',
      'Gjumi, lodhja dhe rutinat e reja',
      'Emocionet pas lindjes',
      'Kur duhet të kërkosh këshillë',
      'Kontrolli te një profesionist i shëndetësisë',
      'Çfarë duhet të mbash mend',
    ],
    headings: [
      'Të kuptojmë periudhën pas lindjes',
      'Ditët e para: ngadalëso dhe rimëkëmbu',
      'Çfarë mund të jetë normale gjatë ripërtëritjes',
      'Kujdesu për veten çdo ditë',
      'Lëvizja dhe rifillimi gradual i aktiviteteve',
      'Gjumi, lodhja dhe rutinat e reja',
      'Emocionet pas lindjes',
      'Kur duhet të kërkosh këshillë?',
      'Kontrolli te një profesionist i shëndetësisë',
      'Çfarë duhet të mbash mend',
    ],
    section1Body1: 'Periudha pas lindjes vjen pas lindjes së fëmijës. Ajo nuk kufizohet në disa ditë: trupi, ritmi i përditshëm dhe emocionet mund të vazhdojnë të ndryshojnë gradualisht gjatë javëve që pasojnë.',
    section1Body2: '“Karantina” është një shprehje tradicionale që përdoret shpesh për të përshkruar javët e para të ripërtëritjes. Ajo mund të shërbejë si kujtesë e mirë: pas shtatzënisë dhe lindjes, ia vlen të ngadalësosh dhe t’i japësh trupit kohën që i duhet.',
    highlight1Title: 'Një ripërtëritje e gjithë trupit',
    highlight1Text: 'Ripërtëritja ka të bëjë me trupin, por edhe me gjumin, energjinë, organizimin e përditshëm dhe përshtatjen emocionale me një fazë të re të jetës.',
    section2Body: 'Ditët e para mund të jenë intensive. Pushimi, kujdesi bazë dhe përshtatja me ritmin e ri janë shpesh përparësitë. Nuk ka nevojë të rifitosh menjëherë nivelin tënd të zakonshëm të energjisë.',
    recoveryPillars: [
      {
        title: 'Pushimi',
        text: 'Ndërrimi i aktivitetit me pushimin e ndihmon trupin të rimëkëmbet gradualisht.',
      },
      {
        title: 'Ushqimi',
        text: 'Të ushqyerit rregullisht dhe të pirit sipas nevojave të tua e mbështet ripërtëritjen çdo ditë.',
      },
      {
        title: 'Mbështetja',
        text: 'Pranimi i ndihmës të mundëson të kursesh energji për kujdesin thelbësor dhe për ripërtëritjen.',
      },
      {
        title: 'Lëvizja e butë',
        text: 'Rifillo gradualisht lëvizjet dhe aktivitetet, duke respektuar gjendjen dhe rehatinë tënde.',
      },
    ],
    section3Body1: 'Çdo ripërtëritje është ndryshe. Disa ndryshime mund të jenë pjesë e periudhës së përshtatjes dhe mund të evoluojnë gradualisht:',
    normalSigns: [
      'Lodhje e theksuar',
      'Gjakderdhje që pakësohet gradualisht',
      'Luhatje hormonale dhe emocionale',
    ],
    section3Body2: 'Intensiteti dhe kohëzgjatja e simptomave mund të ndryshojnë nga një person te tjetri. Ajo që ka rëndësi është të vëzhgosh se si evoluojnë dhe të kërkosh këshillë nëse një ndryshim të duket shqetësues ose i pazakontë.',
    section4Body: 'Gjatë periudhës pas lindjes, zakonet e vogla dhe realiste shpesh ndihmojnë më shumë se një rutinë kërkuese. Qëllimi është ta mbështesësh ripërtëritjen pa shtuar presion.',
    selfCareTips: [
      'Planifiko momente të vërteta pushimi sa herë që të jetë e mundur.',
      'Kërko ndihmë për punët e përditshme dhe për ushqimet.',
      'Pi rregullisht dhe mbaj një ushqyerje të larmishme.',
      'Shmang krahasimin e ripërtëritjes sate me atë të dikujt tjetër.',
      'Rifillo aktivitetet gradualisht, pa u përpjekur t’i bësh të gjitha menjëherë.',
    ],
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Të rrethohesh me mbështetje dhe të pranosh ndihmë nuk është luks. Kjo mund të ndihmojë të ruash energjinë dhe ta bëjë ripërtëritjen më graduale.',
    section5Body1: 'Rifillimi i aktiviteteve mund të bëhet hap pas hapi, sipas rehatisë, energjisë dhe rekomandimeve të marra pas lindjes. Lëvizjet e buta dhe aktivitetet e përditshme llogariten tashmë si kthim në lëvizje.',
    section5Body2: 'Për aktivitete më intensive, më mirë është të përparosh pa kapërcyer hapa dhe të marrësh parasysh çdo simptomë ose shqetësim.',
    alertTitle: 'Dëgjo sinjalet e trupit tënd',
    alertText: 'Shqetësimi që shtohet gjatë një aktiviteti është arsye për të ngadalësuar dhe, nëse duhet, për të kërkuar një këshillë të përshtatshme përpara se të vazhdosh ose të rritësh intensitetin.',
    section6Body: 'Gjumi mund të bëhet i parregullt pas lindjes. Lodhja e grumbulluar mund të ndikojë te energjia, përqendrimi dhe disponimi. Kur është e mundur, thjeshtimi i disa detyrave dhe ndarja e përgjegjësive mund të ndihmojë.',
    milestones: [
      [
        'Ditët e para',
        'Pushim, përshtatje dhe kujdes thelbësor.',
      ],
      [
        'Javët e para',
        'Rimëkëmbje graduale dhe fillimi i rutinave të reja.',
      ],
      [
        'Pas kontrollit pas lindjes',
        'Shqyrto ecurinë e ripërtëritjes dhe diskuto rifillimin gradual të aktiviteteve.',
      ],
    ],
    section7Body1: 'Periudha pas lindjes mund të sjellë shumë emocione: gëzim, shqetësim, lodhje, ndjeshmëri ose ndjenjën e të qenit e mbingarkuar. Këto ndjenja mund të ndryshojnë shpejt, sidomos në një kohë kur gjumi dhe zakonet e përditshme po ndryshojnë.',
    section7Body2: 'Të flasësh me dikë që i beson ose me një profesionist mund të ndihmojë kur emocionet bëhen të vështira për t’u përballuar ose zënë shumë vend në jetën e përditshme.',
    highlight2Title: 'Të kërkosh mbështetje është normale',
    highlight2Text: 'Nuk ka nevojë të presësh derisa të jesh plotësisht e rraskapitur ose e mbingarkuar për të folur se si ndihesh dhe për të kërkuar mbështetje.',
    section8Body: 'Disa situata ia vlen t’i diskutosh me një profesionist të shëndetësisë, sidomos kur përkeqësohen, vazhdojnë ose shkaktojnë shqetësim të madh.',
    consultationSigns: [
      {
        title: 'Simptoma që përkeqësohen',
        text: 'Dhimbja ose shqetësimi që shtohet në vend që të përmirësohet meriton këshillën e një profesionisti.',
      },
      {
        title: 'Gjakderdhje e pazakontë',
        text: 'Gjakderdhja që papritur bëhet më e bollshme ose e pazakontë duhet t’i raportohet një profesionisti të shëndetësisë.',
      },
      {
        title: 'Ankth i vazhdueshëm',
        text: 'Nëse ankthi emocional zë shumë vend ose e vështirëson jetën e përditshme, është e rëndësishme të flasësh për të dhe të kërkosh mbështetje.',
      },
      {
        title: 'Shqetësim i madh',
        text: 'Nëse ke dyshime për ripërtëritjen tënde, kërkimi i një këshille të ndihmon të marrësh rekomandime të përshtatshme për situatën tënde.',
      },
    ],
    section9Body: 'Vizitat e ndjekjes janë një mundësi për të folur për ripërtëritjen, simptomat, rifillimin e aktiviteteve dhe çdo pyetje që mbetet. Përgatitja paraprake e disa pyetjeve mund të ndihmojë që asgjë të mos harrohet.',
    questionTitle: 'Pyetje që mund të përgatisësh',
    questions: [
      'A po ecën ripërtëritja ime ashtu siç pritet për situatën time?',
      'Cilat aktivitete mund t’i rifillo gradualisht?',
      'Cilat simptoma duhet t’i vëzhgoj?',
      'Kur mund të mendoj për një kthim më intensiv te stërvitja?',
      'A kam nevojë për ndonjë këshillë të veçantë ose për rehabilitim?',
    ],
    summaryItems: [
      'Ripërtëritja pas lindjes është graduale dhe ndryshe për secilën.',
      'Pushimi dhe mbështetja mund të jenë pjesë përbërëse e ripërtëritjes.',
      'Ndryshimet fizike, gjumi dhe emocionet mund të evoluojnë gjatë javëve.',
      'Rifillimi gradual i aktiviteteve të ndihmon të respektosh më mirë energjinë dhe rehatinë tënde.',
      'Nëse vëren një simptomë të pazakontë, të vazhdueshme ose shqetësuese, kërkimi i një këshille është hap i mirë.',
    ],
    finalTipTitle: 'Merr kohën që të duhet',
    finalTipText: 'Ripërtëritja nuk është garë. Të ecësh përpara gradualisht, duke respektuar nevojat e tua dhe duke kërkuar mbështetje kur duhet, janë tashmë hapa të rëndësishëm.',
    disclaimerText: 'Ky artikull është vetëm për qëllime informimi dhe nuk zëvendëson këshillën mjekësore të personalizuar. Nëse përjeton një simptomë të theksuar, të vazhdueshme ose shqetësuese, kontakto një profesionist të shëndetësisë.',
    shareMessage: 'Ripërtëritja pas lindjes — AWA',
  },
  ja: {
    badge: '産後 • 回復',
    title: '出産後の\n回復',
    metaDuration: '読了10分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '内容確認済み',
    intro: '体には時間が必要です。出産後に見られる、ごく自然な変化について。',
    contentsTitle: 'この記事の内容',
    topics: [
      '産後とは',
      '最初の数日：ゆっくり過ごして回復する',
      '回復中に見られることがある変化',
      '毎日のセルフケア',
      '少しずつ体を動かし、活動を再開する',
      '睡眠、疲れ、新しい生活リズム',
      '出産後の気持ち',
      '相談を考えたほうがよいとき',
      '医療従事者に相談する',
      '覚えておきたいこと',
    ],
    headings: [
      '産後とは',
      '最初の数日：ゆっくり過ごして回復する',
      '回復中に見られることがある変化',
      '毎日のセルフケア',
      '少しずつ体を動かし、活動を再開する',
      '睡眠、疲れ、新しい生活リズム',
      '出産後の気持ち',
      'どんなときに相談すればよいですか？',
      '医療従事者に相談する',
      '覚えておきたいこと',
    ],
    section1Body1: '産後とは、出産に続く期間のことです。数日で終わるものではなく、体、毎日のリズム、気持ちは、その後の数週間をかけて少しずつ変化していくことがあります。',
    section1Body2: '「quarantaine」は、回復の最初の数週間を表すために使われてきた伝統的な表現です。妊娠と出産のあとは、ペースを落として体に時間を与えることが大切だと、あらためて思い出させてくれる言葉でもあります。',
    highlight1Title: '全身の回復',
    highlight1Text: '回復は体だけでなく、睡眠、エネルギー、毎日の段取り、そして新しい人生の段階への気持ちの調整にもかかわります。',
    section2Body: '最初の数日は、慌ただしく感じられることがあります。休息、基本的なケア、新しいリズムに慣れることが優先されることが多く、すぐにいつもの元気を取り戻す必要はありません。',
    recoveryPillars: [
      {
        title: '休息',
        text: '活動と休息を交互に取ることで、体が少しずつ回復しやすくなります。',
      },
      {
        title: '栄養',
        text: '規則的に食事をとり、必要に応じて水分を補給することが、毎日の回復を支えます。',
      },
      {
        title: 'サポート',
        text: '助けを受け入れることで、大切なケアと回復のためにエネルギーを残しておくことができます。',
      },
      {
        title: '軽い運動',
        text: '体の状態や心地よさを大切にしながら、動きや活動を少しずつ再開しましょう。',
      },
    ],
    section3Body1: '回復の経過は人それぞれです。次のような変化は、慣れていく期間の一部として見られ、少しずつ変わっていくことがあります。',
    normalSigns: [
      '強い疲れ',
      '少しずつ減っていく出血',
      'ホルモンの変動と気持ちの揺れ',
    ],
    section3Body2: '症状の強さや続く期間には個人差があります。大切なのは、その経過を見守ること、そして気になる変化や普段と違う変化があれば相談することです。',
    section4Body: '産後は、負担の大きい習慣よりも、無理のない小さな習慣のほうが役立つことが多くあります。目標は、プレッシャーを増やさずに回復を支えることです。',
    selfCareTips: [
      'できるときには、しっかり休む時間をつくりましょう。',
      '家事や食事の用意を、周りの人に頼みましょう。',
      'こまめに水分をとり、バランスのよい食事を心がけましょう。',
      'ほかの人の回復と比べないようにしましょう。',
      'すべてを一度にやろうとせず、少しずつ活動を再開しましょう。',
    ],
    tip1Title: '知っておきたいこと',
    tip1Text: '周りに支えてもらい、助けを受け入れることは、ぜいたくではありません。エネルギーを保ち、回復をより穏やかに進める助けになります。',
    section5Body1: '活動の再開は、心地よさ、エネルギー、そして出産後に受けたアドバイスに合わせて、段階的に進めることができます。軽い動きや日常の活動も、すでに体を動かすことの再開にあたります。',
    section5Body2: 'より強度の高い活動では、段階を飛ばさずに進め、症状や違和感があればそれを考慮に入れるのが望ましいです。',
    alertTitle: '体からのサインに耳を傾けましょう',
    alertText: '活動中に不快感が強くなる場合は、ペースを落とす合図です。必要であれば、続けたり強度を上げたりする前に、状況に合ったアドバイスを受けましょう。',
    section6Body: '出産後は、睡眠が不規則になることがあります。疲れがたまると、エネルギー、集中力、気分に影響することがあります。可能であれば、いくつかの作業を簡単にしたり、役割を分担したりすると助けになります。',
    milestones: [
      [
        '最初の数日',
        '休息、慣れること、大切なケア。',
      ],
      [
        '最初の数週間',
        '少しずつの回復と、新しい生活リズムの始まり。',
      ],
      [
        '産後健診のあと',
        '回復の経過を確認し、活動を少しずつ再開することについて相談する。',
      ],
    ],
    section7Body1: '産後は、喜び、心配、疲れ、敏感さ、圧倒されるような感覚など、さまざまな気持ちが生まれることがあります。睡眠や毎日の習慣が変わる時期には、こうした気持ちが急に移り変わることもあります。',
    section7Body2: '信頼できる人や専門家に話すことは、気持ちを整えるのが難しいときや、気持ちが日常の大きな部分を占めているときに助けになります。',
    highlight2Title: '助けを求めるのは自然なこと',
    highlight2Text: 'すっかり疲れ果てたり、押しつぶされそうになったりするまで待たなくても、今の気持ちについて話し、支えを求めて大丈夫です。',
    section8Body: '状況によっては、医療従事者に相談したほうがよいことがあります。特に、悪化している、続いている、または大きな不安がある場合です。',
    consultationSigns: [
      {
        title: '症状の悪化',
        text: '良くなるどころか強くなっていく痛みや不快感は、専門家に相談したほうがよいでしょう。',
      },
      {
        title: 'いつもと違う出血',
        text: '急に量が増えた出血や、いつもと違う出血は、医療従事者に伝えましょう。',
      },
      {
        title: '続く心の苦しさ',
        text: '心の苦しさが大きな部分を占めていたり、日常生活を難しくしていたりする場合は、話して支えを求めることが大切です。',
      },
      {
        title: '大きな不安',
        text: '回復について迷いがあるときは、相談することで、ご自身の状況に合ったアドバイスを受けられます。',
      },
    ],
    section9Body: '診察は、回復の経過、症状、活動の再開、まだ残っている疑問について話す機会です。事前にいくつか質問を準備しておくと、聞き忘れを防ぐ助けになります。',
    questionTitle: '準備しておける質問',
    questions: [
      '私の状況として、回復は順調に進んでいますか？',
      'どの活動なら少しずつ再開できますか？',
      'どんな症状に注意すればよいですか？',
      'より強度の高い運動はいつ頃から考えてよいですか？',
      '特別なアドバイスやリハビリは必要ですか？',
    ],
    summaryItems: [
      '出産後の回復は段階的に進み、人それぞれです。',
      '休息とサポートは、回復の大切な一部になります。',
      '体の変化、睡眠、気持ちは、数週間かけて変わっていくことがあります。',
      '活動を少しずつ再開することで、エネルギーや心地よさを大切にしやすくなります。',
      'いつもと違う症状、続く症状、気になる症状があれば、相談するのは良い一歩です。',
    ],
    finalTipTitle: '必要な時間をとりましょう',
    finalTipText: '回復は競争ではありません。自分のペースを大切にしながら少しずつ進み、必要なときには支えを求めること。それだけでも、すでに大切な一歩です。',
    disclaimerText: 'この記事は情報提供のみを目的としており、個別の医療アドバイスに代わるものではありません。強い症状、続く症状、気になる症状がある場合は、医療従事者に連絡してください。',
    shareMessage: '出産後の回復 — AWA',
  },
  ko: {
    badge: '산후 • 회복',
    title: '출산 후\n회복',
    metaDuration: '읽는 데 10분',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '몸에는 시간이 필요해요. 출산 후 어떤 변화가 정상일 수 있는지 알아봐요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '산후 기간 이해하기',
      '첫 며칠: 천천히 쉬며 회복하기',
      '회복 중에 나타날 수 있는 정상적인 변화',
      '일상 속에서 나를 돌보기',
      '움직임과 활동을 차근차근 다시 시작하기',
      '수면, 피로, 새로운 일상',
      '출산 후의 감정',
      '조언을 구해야 할 때',
      '의료 전문가와 상담하기',
      '기억해 둘 점',
    ],
    headings: [
      '산후 기간 이해하기',
      '첫 며칠: 천천히 쉬며 회복하기',
      '회복 중에 나타날 수 있는 정상적인 변화',
      '일상 속에서 나를 돌보기',
      '움직임과 활동을 차근차근 다시 시작하기',
      '수면, 피로, 새로운 일상',
      '출산 후의 감정',
      '언제 조언을 구해야 할까요?',
      '의료 전문가와 상담하기',
      '기억해 둘 점',
    ],
    section1Body1: '산후 기간은 출산 직후부터 이어지는 시기예요. 며칠에 그치지 않고, 이후 몇 주 동안 몸과 하루의 리듬, 감정이 계속해서 조금씩 변해 갈 수 있어요.',
    section1Body2: '“쿠아랑틴(quarantaine)”은 회복 첫 몇 주를 가리킬 때 흔히 쓰는 전통적인 표현이에요. 임신과 출산을 겪은 뒤에는 속도를 늦추고 몸에 시간을 주는 것이 좋다는 점을 떠올리게 해 줘요.',
    highlight1Title: '온몸의 회복',
    highlight1Text: '회복은 몸뿐 아니라 수면, 에너지, 일상의 구성, 그리고 새로운 삶의 단계에 대한 감정적인 적응까지 아우르는 과정이에요.',
    section2Body: '첫 며칠은 강렬할 수 있어요. 휴식, 기본적인 돌봄, 새로운 리듬에 적응하는 것이 우선인 경우가 많아요. 평소의 에너지 수준을 바로 되찾을 필요는 없어요.',
    recoveryPillars: [
      {
        title: '휴식',
        text: '활동과 휴식을 번갈아 하면 몸이 차츰 회복하는 데 도움이 돼요.',
      },
      {
        title: '영양',
        text: '규칙적으로 먹고 필요에 맞게 수분을 섭취하면 하루하루의 회복에 도움이 돼요.',
      },
      {
        title: '도움',
        text: '도움을 받아들이면 꼭 필요한 돌봄과 회복에 에너지를 아낄 수 있어요.',
      },
      {
        title: '가벼운 움직임',
        text: '몸 상태와 편안함을 살피며 움직임과 활동을 조금씩 다시 시작해 보세요.',
      },
    ],
    section3Body1: '회복은 사람마다 달라요. 다음과 같은 변화는 적응 기간의 일부일 수 있고, 차츰 달라질 수 있어요.',
    normalSigns: [
      '심한 피로',
      '점차 줄어드는 출혈',
      '호르몬과 감정의 변화',
    ],
    section3Body2: '증상의 강도와 지속 기간은 사람마다 다를 수 있어요. 중요한 것은 증상이 어떻게 변하는지 지켜보고, 변화가 걱정스럽거나 평소와 다르게 느껴지면 조언을 구하는 거예요.',
    section4Body: '산후 기간에는 부담스러운 루틴보다 작고 현실적인 습관이 더 도움이 되는 경우가 많아요. 부담을 더하지 않으면서 회복을 돕는 것이 목표예요.',
    selfCareTips: [
      '가능할 때마다 제대로 쉬는 시간을 마련하세요.',
      '집안일과 식사에 도움을 요청하세요.',
      '수분을 규칙적으로 섭취하고 다양하게 먹으세요.',
      '내 회복을 다른 사람의 회복과 비교하지 마세요.',
      '모든 것을 한꺼번에 하려 하지 말고 활동을 조금씩 다시 시작하세요.',
    ],
    tip1Title: '알아 두세요',
    tip1Text: '주변의 도움을 받아들이는 것은 사치가 아니에요. 에너지를 아끼고 회복을 더 차근차근 이어 가는 데 도움이 될 수 있어요.',
    section5Body1: '활동은 편안함과 에너지, 출산 후 받은 권고 사항에 따라 한 단계씩 다시 시작할 수 있어요. 가벼운 움직임과 일상적인 활동도 이미 움직임을 되찾는 과정이에요.',
    section5Body2: '더 강도 높은 활동은 단계를 건너뛰지 않고 차근차근 늘리는 것이 좋고, 증상이나 불편함이 있는지도 함께 살펴야 해요.',
    alertTitle: '몸이 보내는 신호에 귀 기울이세요',
    alertText: '활동 중에 불편함이 커진다면 속도를 늦춰야 한다는 신호예요. 필요하면 계속하거나 강도를 높이기 전에 맞춤 조언을 구하세요.',
    section6Body: '출산 후에는 수면이 불규칙해질 수 있어요. 쌓인 피로는 에너지, 집중력, 기분에 영향을 줄 수 있어요. 가능하면 일부 일을 단순하게 하고 책임을 나누면 도움이 될 수 있어요.',
    milestones: [
      [
        '첫 며칠',
        '휴식, 적응, 꼭 필요한 돌봄.',
      ],
      [
        '첫 몇 주',
        '점진적인 회복과 새로운 일상의 시작.',
      ],
      [
        '산후 검진 이후',
        '회복 경과를 확인하고 활동을 차근차근 다시 시작하는 것에 대해 상담해요.',
      ],
    ],
    section7Body1: '산후 기간에는 기쁨, 걱정, 피로, 예민함, 또는 벅찬 느낌 등 많은 감정이 찾아올 수 있어요. 특히 수면과 일상의 습관이 바뀌는 시기에는 이런 감정이 빠르게 변할 수 있어요.',
    section7Body2: '감정을 다스리기 어렵거나 감정이 일상에서 큰 부분을 차지할 때는 믿을 수 있는 사람이나 전문가와 이야기하는 것이 도움이 될 수 있어요.',
    highlight2Title: '도움을 청하는 것은 자연스러운 일이에요',
    highlight2Text: '완전히 지치거나 벅차게 느낄 때까지 기다릴 필요 없이, 지금의 기분에 대해 이야기하고 도움을 청해도 괜찮아요.',
    section8Body: '특히 상황이 나빠지거나 계속되거나 큰 걱정이 될 때는 의료 전문가와 상의해 볼 만한 경우가 있어요.',
    consultationSigns: [
      {
        title: '악화되는 증상',
        text: '나아지지 않고 오히려 심해지는 통증이나 불편함은 전문가의 조언을 받아 볼 만해요.',
      },
      {
        title: '평소와 다른 출혈',
        text: '갑자기 양이 많아지거나 평소와 다른 출혈은 의료 전문가에게 알려야 해요.',
      },
      {
        title: '계속되는 괴로움',
        text: '감정적인 괴로움이 큰 부분을 차지하거나 일상을 어렵게 만든다면, 이야기를 나누고 도움을 청하는 것이 중요해요.',
      },
      {
        title: '큰 걱정',
        text: '회복에 대해 의문이 든다면 조언을 구하는 것이 내 상황에 맞는 권고를 받는 데 도움이 돼요.',
      },
    ],
    section9Body: '정기 진료는 회복, 증상, 활동 재개, 그리고 남아 있는 궁금증에 대해 이야기할 기회예요. 미리 몇 가지 질문을 준비해 두면 빠뜨리는 것이 없도록 하는 데 도움이 될 수 있어요.',
    questionTitle: '준비해 볼 수 있는 질문',
    questions: [
      '내 상황에서 회복이 예상대로 진행되고 있나요?',
      '어떤 활동을 차근차근 다시 시작할 수 있나요?',
      '어떤 증상을 주의 깊게 살펴야 하나요?',
      '언제쯤 더 강도 높은 운동을 다시 생각해 볼 수 있나요?',
      '특별한 조언이나 재활이 필요한가요?',
    ],
    summaryItems: [
      '출산 후 회복은 점진적이며 사람마다 달라요.',
      '휴식과 도움은 회복의 중요한 일부가 될 수 있어요.',
      '신체 변화, 수면, 감정은 몇 주에 걸쳐 달라질 수 있어요.',
      '활동을 조금씩 다시 시작하면 에너지와 편안함을 더 잘 존중할 수 있어요.',
      '평소와 다르거나 계속되거나 걱정스러운 증상이 있다면 조언을 구하는 것이 좋은 방법이에요.',
    ],
    finalTipTitle: '필요한 만큼 시간을 가지세요',
    finalTipText: '회복은 경주가 아니에요. 차근차근 나아가고, 나의 필요를 존중하고, 필요할 때 도움을 청하는 것만으로도 이미 중요한 걸음이에요.',
    disclaimerText: '이 아티클은 정보 제공을 목적으로 하며 개인에게 맞춘 의학적 조언을 대신하지 않아요. 심하거나 계속되거나 걱정스러운 증상이 있다면 의료 전문가에게 문의하세요.',
    shareMessage: '출산 후 회복 — AWA',
  },
  'pt-PT': {
    badge: 'PÓS-PARTO • RECUPERAÇÃO',
    title: 'Recuperação\napós o parto',
    metaDuration: '10 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'O seu corpo precisa de tempo: o que é normal depois de dar à luz.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Compreender o pós-parto',
      'Os primeiros dias: abrandar e recuperar',
      'O que pode ser normal durante a recuperação',
      'Cuidar de si no dia a dia',
      'Mexer-se e retomar as atividades gradualmente',
      'Sono, cansaço e novas rotinas',
      'Emoções após o parto',
      'Quando procurar aconselhamento',
      'Consulta com um profissional de saúde',
      'O que reter',
    ],
    headings: [
      'Compreender o pós-parto',
      'Os primeiros dias: abrandar e recuperar',
      'O que pode ser normal durante a recuperação',
      'Cuidar de si no dia a dia',
      'Mexer-se e retomar as atividades gradualmente',
      'Sono, cansaço e novas rotinas',
      'Emoções após o parto',
      'Quando deve procurar aconselhamento?',
      'Consulta com um profissional de saúde',
      'O que reter',
    ],
    section1Body1: 'O pós-parto é o período que se segue ao parto. Não se limita a alguns dias: o corpo, o ritmo do dia a dia e as emoções podem continuar a evoluir gradualmente ao longo das semanas seguintes.',
    section1Body2: 'A “quarentena” é uma expressão tradicional muitas vezes usada para descrever as primeiras semanas de recuperação. Pode servir de bom lembrete: depois da gravidez e do parto, vale a pena abrandar e dar tempo ao corpo.',
    highlight1Title: 'Uma recuperação de todo o corpo',
    highlight1Text: 'A recuperação diz respeito ao corpo, mas também ao sono, à energia, à organização do dia a dia e à adaptação emocional a uma nova etapa da vida.',
    section2Body: 'Os primeiros dias podem ser intensos. O descanso, os cuidados básicos e a adaptação ao novo ritmo são muitas vezes as prioridades. Não é preciso recuperar de imediato o seu nível habitual de energia.',
    recoveryPillars: [
      {
        title: 'Descanso',
        text: 'Alternar atividade e descanso ajuda o corpo a recuperar gradualmente.',
      },
      {
        title: 'Alimentação',
        text: 'Comer com regularidade e beber de acordo com as suas necessidades apoia a recuperação no dia a dia.',
      },
      {
        title: 'Apoio',
        text: 'Aceitar ajuda permite poupar energia para os cuidados essenciais e para a recuperação.',
      },
      {
        title: 'Movimento suave',
        text: 'Retome gradualmente os movimentos e as atividades, respeitando o seu estado e o seu conforto.',
      },
    ],
    section3Body1: 'Cada recuperação é diferente. Algumas alterações podem fazer parte do período de adaptação e evoluir gradualmente:',
    normalSigns: [
      'Cansaço acentuado',
      'Perdas de sangue que diminuem gradualmente',
      'Oscilações hormonais e emocionais',
    ],
    section3Body2: 'A intensidade e a duração dos sintomas podem variar de pessoa para pessoa. O importante é observar como evoluem e procurar aconselhamento se uma alteração parecer preocupante ou fora do habitual.',
    section4Body: 'Durante o pós-parto, hábitos pequenos e realistas são muitas vezes mais úteis do que uma rotina exigente. O objetivo é apoiar a recuperação sem acrescentar pressão.',
    selfCareTips: [
      'Planeie momentos de descanso reais sempre que possível.',
      'Peça ajuda para as tarefas domésticas e as refeições.',
      'Beba com regularidade e mantenha uma alimentação variada.',
      'Evite comparar a sua recuperação com a de outras pessoas.',
      'Retome as atividades gradualmente, sem tentar fazer tudo de imediato.',
    ],
    tip1Title: 'Bom saber',
    tip1Text: 'Rodear-se de apoio e aceitar ajuda não é um luxo. Pode ajudar a preservar a energia e tornar a recuperação mais gradual.',
    section5Body1: 'A retoma das atividades pode fazer-se passo a passo, consoante o conforto, a energia e as recomendações recebidas após o parto. Os movimentos suaves e as atividades do dia a dia já contam como um regresso ao movimento.',
    section5Body2: 'Para atividades mais intensas, é preferível progredir sem saltar etapas e ter em conta quaisquer sintomas ou desconforto.',
    alertTitle: 'Escute os sinais do seu corpo',
    alertText: 'Um desconforto que aumenta durante uma atividade é motivo para abrandar e, se necessário, procurar aconselhamento adequado antes de continuar ou de aumentar a intensidade.',
    section6Body: 'O sono pode tornar-se irregular depois do parto. O cansaço acumulado pode afetar a energia, a concentração e o humor. Quando possível, simplificar certas tarefas e partilhar responsabilidades pode ajudar.',
    milestones: [
      [
        'Primeiros dias',
        'Descanso, adaptação e cuidados essenciais.',
      ],
      [
        'Primeiras semanas',
        'Recuperação gradual e início de novas rotinas.',
      ],
      [
        'Após a consulta de revisão do puerpério',
        'Fazer o ponto da situação da recuperação e conversar sobre a retoma gradual das atividades.',
      ],
    ],
    section7Body1: 'O pós-parto pode trazer muitas emoções: alegria, preocupação, cansaço, sensibilidade ou a sensação de estar sobrecarregada. Estes sentimentos podem mudar rapidamente, sobretudo numa altura em que o sono e os hábitos do dia a dia estão a mudar.',
    section7Body2: 'Falar com alguém de confiança ou com um profissional pode ajudar quando as emoções se tornam difíceis de gerir ou ocupam muito espaço no dia a dia.',
    highlight2Title: 'Pedir apoio é normal',
    highlight2Text: 'Não é preciso esperar até estar completamente exausta ou sobrecarregada para falar sobre o que sente e procurar apoio.',
    section8Body: 'Há situações que merecem ser faladas com um profissional de saúde, sobretudo quando pioram, persistem ou causam preocupação significativa.',
    consultationSigns: [
      {
        title: 'Agravamento dos sintomas',
        text: 'Uma dor ou um desconforto que aumenta em vez de melhorar merece aconselhamento profissional.',
      },
      {
        title: 'Perdas de sangue fora do habitual',
        text: 'Uma hemorragia que se torna de repente mais abundante ou fora do habitual deve ser comunicada a um profissional de saúde.',
      },
      {
        title: 'Sofrimento persistente',
        text: 'Se o sofrimento emocional ocupa muito espaço ou dificulta o dia a dia, é importante falar sobre isso e pedir apoio.',
      },
      {
        title: 'Preocupação significativa',
        text: 'Em caso de dúvida sobre a sua recuperação, pedir aconselhamento ajuda a obter recomendações adequadas à sua situação.',
      },
    ],
    section9Body: 'As consultas de acompanhamento são uma oportunidade para falar sobre a recuperação, os sintomas, a retoma das atividades e quaisquer dúvidas que subsistam. Preparar algumas perguntas com antecedência pode ajudar a garantir que nada fica esquecido.',
    questionTitle: 'Perguntas que pode preparar',
    questions: [
      'A minha recuperação está a evoluir como esperado para a minha situação?',
      'Que atividades posso retomar gradualmente?',
      'A que sintomas devo estar atenta?',
      'Quando posso considerar um regresso mais intenso ao exercício?',
      'Preciso de algum aconselhamento ou reabilitação específicos?',
    ],
    summaryItems: [
      'A recuperação após o parto é gradual e diferente para cada mulher.',
      'O descanso e o apoio podem fazer parte integrante da recuperação.',
      'As alterações físicas, o sono e as emoções podem evoluir ao longo das semanas.',
      'Retomar as atividades gradualmente ajuda a respeitar melhor a sua energia e o seu conforto.',
      'Se notar um sintoma fora do habitual, persistente ou preocupante, procurar aconselhamento é um bom passo.',
    ],
    finalTipTitle: 'Tome o tempo de que precisa',
    finalTipText: 'A recuperação não é uma corrida. Avançar gradualmente, respeitar as suas necessidades e pedir apoio quando necessário já são passos importantes.',
    disclaimerText: 'Este artigo tem apenas fins informativos e não substitui um aconselhamento médico personalizado. Se sentir um sintoma significativo, persistente ou preocupante, contacte um profissional de saúde.',
    shareMessage: 'Recuperação após o parto — AWA',
  },
  bn: {
    badge: 'প্রসবোত্তর • সুস্থতা',
    title: 'সন্তান প্রসবের পর\nসুস্থ হয়ে ওঠা',
    metaDuration: '10 মিনিটের পাঠ',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'আপনার শরীরের সময় দরকার: সন্তান জন্মের পর কী স্বাভাবিক হতে পারে।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'প্রসবোত্তর সময় বোঝা',
      'প্রথম কয়েক দিন: ধীরে চলা ও সুস্থ হয়ে ওঠা',
      'সুস্থ হওয়ার সময় কী স্বাভাবিক হতে পারে',
      'প্রতিদিন নিজের যত্ন নেওয়া',
      'ধীরে ধীরে নড়াচড়া ও কাজকর্মে ফেরা',
      'ঘুম, ক্লান্তি ও নতুন রুটিন',
      'প্রসবের পর আবেগ',
      'কখন পরামর্শ নেবেন',
      'স্বাস্থ্যসেবা পেশাজীবীর কাছে যাওয়া',
      'যা মনে রাখবেন',
    ],
    headings: [
      'প্রসবোত্তর সময় বোঝা',
      'প্রথম কয়েক দিন: ধীরে চলা ও সুস্থ হয়ে ওঠা',
      'সুস্থ হওয়ার সময় কী স্বাভাবিক হতে পারে',
      'প্রতিদিন নিজের যত্ন নেওয়া',
      'ধীরে ধীরে নড়াচড়া ও কাজকর্মে ফেরা',
      'ঘুম, ক্লান্তি ও নতুন রুটিন',
      'প্রসবের পর আবেগ',
      'কখন পরামর্শ নেওয়া উচিত?',
      'স্বাস্থ্যসেবা পেশাজীবীর কাছে যাওয়া',
      'যা মনে রাখবেন',
    ],
    section1Body1: 'প্রসবোত্তর সময় শুরু হয় সন্তান প্রসবের পর থেকে। এটি কয়েক দিনেই সীমাবদ্ধ নয়: পরবর্তী কয়েক সপ্তাহ ধরে শরীর, দৈনন্দিন ছন্দ ও আবেগ ধীরে ধীরে বদলাতে থাকতে পারে।',
    section1Body2: '“কোয়ারেন্টিন” (quarantaine) একটি ঐতিহ্যবাহী প্রকাশ, যা প্রায়ই সুস্থ হয়ে ওঠার প্রথম কয়েক সপ্তাহ বোঝাতে ব্যবহৃত হয়। এটি একটি ভালো স্মারক হতে পারে: গর্ভাবস্থা ও প্রসবের পর ধীরে চলা এবং শরীরকে সময় দেওয়া উচিত।',
    highlight1Title: 'সারা শরীরের সুস্থ হয়ে ওঠা',
    highlight1Text: 'সুস্থ হয়ে ওঠা শুধু শরীরের বিষয় নয়, এর সঙ্গে জড়িত ঘুম, শক্তি, দৈনন্দিন কাজের গুছিয়ে নেওয়া এবং জীবনের নতুন ধাপের সঙ্গে মানসিকভাবে মানিয়ে নেওয়াও।',
    section2Body: 'প্রথম কয়েক দিন তীব্র হতে পারে। বিশ্রাম, মৌলিক যত্ন এবং নতুন ছন্দের সঙ্গে মানিয়ে নেওয়াই প্রায়ই অগ্রাধিকার পায়। আগের মতো শক্তি সঙ্গে সঙ্গে ফিরে পাওয়ার প্রয়োজন নেই।',
    recoveryPillars: [
      {
        title: 'বিশ্রাম',
        text: 'কাজ ও বিশ্রাম পালা করে নিলে শরীর ধীরে ধীরে সুস্থ হতে পারে।',
      },
      {
        title: 'পুষ্টি',
        text: 'নিয়মিত খাওয়া এবং প্রয়োজন অনুযায়ী পানি পান করা প্রতিদিনের সুস্থতায় সহায়তা করে।',
      },
      {
        title: 'সহায়তা',
        text: 'সাহায্য গ্রহণ করলে জরুরি যত্ন ও সুস্থ হয়ে ওঠার জন্য শক্তি বাঁচানো সম্ভব হয়।',
      },
      {
        title: 'হালকা নড়াচড়া',
        text: 'নিজের অবস্থা ও স্বাচ্ছন্দ্যকে সম্মান করে ধীরে ধীরে নড়াচড়া ও কাজকর্মে ফিরুন।',
      },
    ],
    section3Body1: 'প্রতিটি সুস্থ হওয়ার অভিজ্ঞতা আলাদা। কিছু পরিবর্তন মানিয়ে নেওয়ার সময়ের অংশ হতে পারে এবং ধীরে ধীরে বদলাতে পারে:',
    normalSigns: [
      'উল্লেখযোগ্য ক্লান্তি',
      'রক্তস্রাব ধীরে ধীরে কমে আসা',
      'হরমোন ও আবেগের ওঠানামা',
    ],
    section3Body2: 'উপসর্গের তীব্রতা ও স্থায়িত্ব একজন থেকে আরেকজনে ভিন্ন হতে পারে। গুরুত্বপূর্ণ হলো সেগুলো কীভাবে বদলাচ্ছে তা লক্ষ্য করা এবং কোনো পরিবর্তন উদ্বেগজনক বা অস্বাভাবিক মনে হলে পরামর্শ নেওয়া।',
    section4Body: 'প্রসবোত্তর সময়ে কঠোর রুটিনের চেয়ে ছোট ও বাস্তবসম্মত অভ্যাস প্রায়ই বেশি সহায়ক। লক্ষ্য হলো চাপ না বাড়িয়ে সুস্থ হয়ে ওঠায় সহায়তা করা।',
    selfCareTips: [
      'যখনই সম্ভব, বিশ্রামের জন্য সত্যিকারের সময় রাখুন।',
      'দৈনন্দিন কাজ ও খাবারের ব্যাপারে সাহায্য চান।',
      'নিয়মিত পানি পান করুন এবং বৈচিত্র্যময় খাবার খান।',
      'আপনার সুস্থ হওয়ার সঙ্গে অন্য কারও তুলনা করবেন না।',
      'সবকিছু একসঙ্গে করার চেষ্টা না করে ধীরে ধীরে কাজকর্মে ফিরুন।',
    ],
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'নিজের চারপাশে সহায়তা রাখা এবং সাহায্য গ্রহণ করা বিলাসিতা নয়। এটি শক্তি ধরে রাখতে এবং সুস্থ হয়ে ওঠা আরও ধীরগতির ও স্বাভাবিক করতে সাহায্য করতে পারে।',
    section5Body1: 'কাজকর্মে ফেরা ধাপে ধাপে হতে পারে, আপনার স্বাচ্ছন্দ্য, শক্তি এবং প্রসবের পর পাওয়া পরামর্শ অনুযায়ী। হালকা নড়াচড়া ও দৈনন্দিন কাজকর্মও ইতিমধ্যে নড়াচড়ায় ফেরার অংশ।',
    section5Body2: 'আরও তীব্র কার্যকলাপের ক্ষেত্রে কোনো ধাপ বাদ না দিয়ে এগোনো এবং কোনো উপসর্গ বা অস্বস্তি থাকলে তা বিবেচনায় নেওয়া ভালো।',
    alertTitle: 'আপনার শরীরের সংকেত শুনুন',
    alertText: 'কোনো কাজ করার সময় অস্বস্তি বাড়লে ধীর হওয়া উচিত এবং প্রয়োজনে চালিয়ে যাওয়া বা তীব্রতা বাড়ানোর আগে উপযুক্ত পরামর্শ নেওয়া উচিত।',
    section6Body: 'সন্তান প্রসবের পর ঘুম অনিয়মিত হয়ে যেতে পারে। জমে থাকা ক্লান্তি শক্তি, মনোযোগ ও মেজাজকে প্রভাবিত করতে পারে। সম্ভব হলে কিছু কাজ সহজ করে নেওয়া এবং দায়িত্ব ভাগ করে নেওয়া সাহায্য করতে পারে।',
    milestones: [
      [
        'প্রথম কয়েক দিন',
        'বিশ্রাম, মানিয়ে নেওয়া এবং জরুরি যত্ন।',
      ],
      [
        'প্রথম কয়েক সপ্তাহ',
        'ধীরে ধীরে সুস্থ হওয়া এবং নতুন রুটিনের শুরু।',
      ],
      [
        'প্রসবোত্তর পরীক্ষার পর',
        'সুস্থ হওয়ার অগ্রগতি পর্যালোচনা করা এবং ধীরে ধীরে কাজকর্মে ফেরা নিয়ে আলোচনা করা।',
      ],
    ],
    section7Body1: 'প্রসবোত্তর সময়ে অনেক আবেগ আসতে পারে: আনন্দ, দুশ্চিন্তা, ক্লান্তি, স্পর্শকাতরতা, কিংবা সবকিছু সামলাতে না পারার অনুভূতি। এই অনুভূতিগুলো দ্রুত বদলাতে পারে, বিশেষ করে যখন ঘুম ও দৈনন্দিন অভ্যাস বদলে যাচ্ছে।',
    section7Body2: 'আবেগ সামলানো কঠিন হয়ে পড়লে বা দৈনন্দিন জীবনে অনেকটা জায়গা নিয়ে নিলে বিশ্বস্ত কারও সঙ্গে বা কোনো পেশাজীবীর সঙ্গে কথা বললে সাহায্য হতে পারে।',
    highlight2Title: 'সহায়তা চাওয়া স্বাভাবিক',
    highlight2Text: 'পুরোপুরি ক্লান্ত বা অভিভূত হওয়ার জন্য অপেক্ষা করার দরকার নেই; আপনি কেমন বোধ করছেন তা নিয়ে কথা বলুন এবং সহায়তা চান।',
    section8Body: 'কিছু পরিস্থিতি স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে আলোচনা করা উচিত, বিশেষ করে যখন সেগুলো খারাপ হয়, থেকে যায় বা উল্লেখযোগ্য উদ্বেগ সৃষ্টি করে।',
    consultationSigns: [
      {
        title: 'উপসর্গ খারাপ হওয়া',
        text: 'ব্যথা বা অস্বস্তি কমার বদলে বাড়লে পেশাজীবীর পরামর্শ নেওয়া উচিত।',
      },
      {
        title: 'অস্বাভাবিক রক্তস্রাব',
        text: 'রক্তস্রাব হঠাৎ বেড়ে গেলে বা অস্বাভাবিক হলে তা স্বাস্থ্যসেবা পেশাজীবীকে জানানো উচিত।',
      },
      {
        title: 'দীর্ঘস্থায়ী মানসিক কষ্ট',
        text: 'মানসিক কষ্ট যদি অনেকটা জায়গা নিয়ে নেয় বা দৈনন্দিন জীবন কঠিন করে তোলে, তাহলে তা নিয়ে কথা বলা এবং সহায়তা চাওয়া গুরুত্বপূর্ণ।',
      },
      {
        title: 'উল্লেখযোগ্য উদ্বেগ',
        text: 'সুস্থ হওয়া নিয়ে সন্দেহ থাকলে পরামর্শ চাইলে আপনার পরিস্থিতির উপযোগী নির্দেশনা পেতে সাহায্য হয়।',
      },
    ],
    section9Body: 'ফলোআপ অ্যাপয়েন্টমেন্ট হলো সুস্থ হওয়া, উপসর্গ, কাজকর্মে ফেরা এবং বাকি প্রশ্নগুলো নিয়ে কথা বলার সুযোগ। আগে থেকে কিছু প্রশ্ন প্রস্তুত করে রাখলে কিছু ভুলে না যাওয়া নিশ্চিত করতে সাহায্য হতে পারে।',
    questionTitle: 'যেসব প্রশ্ন প্রস্তুত করতে পারেন',
    questions: [
      'আমার পরিস্থিতি অনুযায়ী কি আমার সুস্থ হওয়া প্রত্যাশামতো এগোচ্ছে?',
      'কোন কাজকর্মে আমি ধীরে ধীরে ফিরতে পারি?',
      'কোন উপসর্গের দিকে নজর রাখা উচিত?',
      'কখন আমি আরও তীব্র ব্যায়ামে ফেরার কথা ভাবতে পারি?',
      'আমার কি কোনো বিশেষ পরামর্শ বা পুনর্বাসনের প্রয়োজন আছে?',
    ],
    summaryItems: [
      'প্রসবের পর সুস্থ হওয়া ধীরে ধীরে হয় এবং প্রত্যেকের ক্ষেত্রে আলাদা।',
      'বিশ্রাম ও সহায়তা সুস্থ হওয়ার অবিচ্ছেদ্য অংশ হতে পারে।',
      'শারীরিক পরিবর্তন, ঘুম ও আবেগ কয়েক সপ্তাহ ধরে বদলাতে পারে।',
      'ধীরে ধীরে কাজকর্মে ফিরলে আপনার শক্তি ও স্বাচ্ছন্দ্যকে আরও ভালোভাবে সম্মান করা যায়।',
      'অস্বাভাবিক, দীর্ঘস্থায়ী বা উদ্বেগজনক কোনো উপসর্গ দেখলে পরামর্শ নেওয়া একটি ভালো পদক্ষেপ।',
    ],
    finalTipTitle: 'যতটা সময় দরকার, নিন',
    finalTipText: 'সুস্থ হয়ে ওঠা কোনো প্রতিযোগিতা নয়। ধীরে ধীরে এগোনো, নিজের প্রয়োজনকে সম্মান করা এবং দরকার হলে সহায়তা চাওয়া ইতিমধ্যেই গুরুত্বপূর্ণ পদক্ষেপ।',
    disclaimerText: 'এই নিবন্ধ শুধুমাত্র তথ্যের উদ্দেশ্যে এবং ব্যক্তিগত চিকিৎসা পরামর্শের বিকল্প নয়। কোনো উল্লেখযোগ্য, দীর্ঘস্থায়ী বা উদ্বেগজনক উপসর্গ দেখা দিলে স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে যোগাযোগ করুন।',
    shareMessage: 'সন্তান প্রসবের পর সুস্থ হয়ে ওঠা — AWA',
  },
  da: {
    badge: 'Efterfødsel • Restitution',
    title: 'At komme sig\nefter fødslen',
    metaDuration: '10 minutters læsning',
    metaType: 'Guide',
    metaLevel: 'Grundlæggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Din krop har brug for tid: hvad der kan være normalt efter en fødsel.',
    contentsTitle: 'I denne artikel',
    topics: [
      'At forstå efterfødselsperioden',
      'De første dage: at tage det roligt og restituere',
      'Hvad der kan være normalt under restitutionen',
      'At tage vare på sig selv hver dag',
      'At vende gradvist tilbage til aktivitet',
      'Søvn, træthed og nye rutiner',
      'Følelser efter fødslen',
      'Hvornår du bør søge råd',
      'At opsøge en sundhedsprofessionel',
      'Husk',
    ],
    headings: [
      'At forstå efterfødselsperioden',
      'De første dage: at tage det roligt og restituere',
      'Hvad der kan være normalt under restitutionen',
      'At tage vare på sig selv hver dag',
      'At vende gradvist tilbage til aktivitet',
      'Søvn, træthed og nye rutiner',
      'Følelser efter fødslen',
      'Hvornår bør du søge råd?',
      'At opsøge en sundhedsprofessionel',
      'Husk',
    ],
    section1Body1: 'Efterfødselsperioden begynder efter fødslen. Den er ikke begrænset til blot et par dage: krop, daglig rytme og følelser kan alle ændre sig gradvist over de kommende uger.',
    section1Body2: '"Karantænen" (quarantaine) er et traditionelt udtryk, der ofte bruges om de første uger af restitutionen. Det kan minde os om noget vigtigt: efter graviditet og fødsel er det godt at tage det roligt og give kroppen tid.',
    highlight1Title: 'Restitution for hele kroppen',
    highlight1Text: 'At komme sig handler ikke kun om kroppen – det handler også om søvn, energi, at finde en ny daglig rytme og at vænne sig til et nyt kapitel i livet.',
    section2Body: 'De første dage kan være intense. Hvile, grundlæggende omsorg og at finde sig til rette i en ny hverdag er oftest det, der har forrang. Du behøver ikke at have overskud med det samme.',
    recoveryPillars: [
      {
        title: 'Hvile',
        text: 'At veksle mellem aktivitet og hvile giver kroppen mulighed for gradvist at restituere.',
      },
      {
        title: 'Ernæring',
        text: 'At spise jævnligt og drikke nok vand er en støtte til din daglige trivsel.',
      },
      {
        title: 'Støtte',
        text: 'At tage imod hjælp frigiver energi til nødvendig omsorg og restitution.',
      },
      {
        title: 'Let bevægelse',
        text: 'Vend gradvist tilbage til bevægelse og aktiviteter i dit eget tempo og efter din komfort.',
      },
    ],
    section3Body1: 'Alle restituerer forskelligt. Nogle forandringer er en del af tilpasningsprocessen og kan ændre sig gradvist:',
    normalSigns: [
      'Mærkbar træthed',
      'Blødning der aftager gradvist',
      'Hormonelle og følelsesmæssige udsving',
    ],
    section3Body2: 'Intensiteten og varigheden af symptomer varierer fra person til person. Det vigtige er at bemærke, hvordan de ændrer sig, og at søge råd, hvis noget virker bekymrende eller unormalt.',
    section4Body: 'I efterfødselsperioden er små, realistiske vaner ofte mere nyttige end strikse rutiner. Målet er at støtte restitutionen uden at øge presset.',
    selfCareTips: [
      'Sæt ægte tid af til hvile, når det er muligt.',
      'Bed om hjælp til daglige opgaver og måltider.',
      'Drik jævnligt vand og spis varieret.',
      'Sammenlign ikke din restitution med andres.',
      'Vend gradvist tilbage til aktiviteter i stedet for at forsøge at gøre alt på én gang.',
    ],
    tip1Title: 'Godt at vide',
    tip1Text: 'At have støtte omkring dig og tage imod hjælp er ikke en luksus. Det kan hjælpe dig med at bevare energien og gøre restitutionen mere skånsom og naturlig.',
    section5Body1: 'At vende tilbage til aktiviteter kan ske trinvis, i overensstemmelse med din komfort, energi og de råd, du har fået efter fødslen. Let bevægelse og daglige aktiviteter tæller allerede som en tilbagevenden til aktivitet.',
    section5Body2: 'For mere intensive aktiviteter er det bedst ikke at springe trin over og at tage hensyn til eventuelle symptomer eller ubehag.',
    alertTitle: 'Lyt til din krop',
    alertText: 'Hvis ubehaget øges under en aktivitet, bør du sætte tempoet ned og om nødvendigt søge råd, inden du fortsætter eller øger intensiteten.',
    section6Body: 'Efter fødslen kan søvnen blive uregelmæssig. Ophobning af træthed kan påvirke energi, koncentration og humør. Hvis det er muligt, kan det hjælpe at forenkle visse opgaver og dele ansvaret.',
    milestones: [
      [
        'De første dage',
        'Hvile, tilpasning og grundlæggende omsorg.',
      ],
      [
        'De første uger',
        'Gradvis restitution og begyndende nye rutiner.',
      ],
      [
        'Efter efterfødselskontrollen',
        'At gennemgå fremskridt i restitutionen og drøfte en gradvis tilbagevenden til aktiviteter.',
      ],
    ],
    section7Body1: 'I efterfødselsperioden kan mange følelser opstå: glæde, bekymring, træthed, sårbarhed eller en følelse af at være overvældet. Disse følelser kan skifte hurtigt, særligt når søvn og daglige vaner ændrer sig.',
    section7Body2: 'Hvis det bliver svært at håndtere følelserne, eller de fylder meget i hverdagen, kan det hjælpe at tale med en man stoler på eller med en professionel.',
    highlight2Title: 'Det er normalt at søge støtte',
    highlight2Text: 'Du behøver ikke vente på at være fuldstændig udmattet eller overvældet – tal om, hvordan du har det, og søg støtte.',
    section8Body: 'Visse situationer bør drøftes med en sundhedsprofessionel, særligt hvis de forværres, bliver vedvarende eller giver anledning til bekymring.',
    consultationSigns: [
      {
        title: 'Forværring af symptomer',
        text: 'Hvis smerte eller ubehag øges i stedet for at aftage, bør du søge råd.',
      },
      {
        title: 'Usædvanlig blødning',
        text: 'Hvis blødningen pludselig tiltager eller virker unormal, bør du informere en sundhedsprofessionel.',
      },
      {
        title: 'Vedvarende psykisk belastning',
        text: 'Hvis psykisk belastning fylder meget eller gør hverdagen svær, er det vigtigt at tale om det og søge støtte.',
      },
      {
        title: 'Væsentlige bekymringer',
        text: 'Hvis du er i tvivl om din restitution, kan det at søge råd hjælpe dig med vejledning, der passer til din situation.',
      },
    ],
    section9Body: 'Opfølgningsaftaler er en mulighed for at tale om restitution, symptomer, tilbagevenden til aktiviteter og øvrige spørgsmål. At forberede et par spørgsmål på forhånd kan hjælpe dig med ikke at glemme noget.',
    questionTitle: 'Spørgsmål du kan forberede',
    questions: [
      'Forløber min restitution som forventet ud fra min situation?',
      'Hvilke aktiviteter kan jeg gradvist genoptage?',
      'Hvilke symptomer bør jeg holde øje med?',
      'Hvornår kan jeg overveje at vende tilbage til mere intense aktiviteter?',
      'Har jeg brug for specialiseret rådgivning eller genoptræning?',
    ],
    summaryItems: [
      'Restitution efter fødslen sker gradvist og er forskellig for alle.',
      'Hvile og støtte kan være en uundværlig del af restitutionen.',
      'Fysiske forandringer, søvn og følelser kan ændre sig over uger.',
      'En gradvis tilbagevenden til aktiviteter respekterer din energi og komfort bedre.',
      'Søg råd, hvis du oplever usædvanlige, vedvarende eller bekymrende symptomer.',
    ],
    finalTipTitle: 'Tag den tid, du har brug for',
    finalTipText: 'Restitution er ikke en konkurrence. At tage det gradvist, respektere dine behov og søge støtte, når det er nødvendigt, er allerede vigtige skridt.',
    disclaimerText: 'Denne artikel er udelukkende til informationsformål og erstatter ikke personlig medicinsk rådgivning. Kontakt en sundhedsprofessionel, hvis du oplever betydelige, vedvarende eller bekymrende symptomer.',
    shareMessage: 'At komme sig efter fødslen — AWA',
  },
  sv: {
    badge: 'Efterfödsel • Restitution',
    title: 'At komme sig\nefter födslen',
    metaDuration: '10 minutters läsning',
    metaType: 'Guide',
    metaLevel: 'Grundläggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Din krop har brug for tid: hvad der kan väre normalt efter en födsel.',
    contentsTitle: 'I denne artikel',
    topics: [
      'At forstå efterfödselsperioden',
      'De förste dage: at tage det roligt och restituere',
      'Hvad der kan väre normalt under restitutionen',
      'At tage vare på sig selv hver dag',
      'At vende gradvist tilbage till aktivitet',
      'Sövn, träthed och nye rutiner',
      'Fölelser efter födslen',
      'Hvornår du bör söge råd',
      'At opsöge en halsasprofessionel',
      'Husk',
    ],
    headings: [
      'At forstå efterfödselsperioden',
      'De förste dage: at tage det roligt och restituere',
      'Hvad der kan väre normalt under restitutionen',
      'At tage vare på sig selv hver dag',
      'At vende gradvist tilbage till aktivitet',
      'Sövn, träthed och nye rutiner',
      'Fölelser efter födslen',
      'Hvornår bör du söge råd?',
      'At opsöge en halsasprofessionel',
      'Husk',
    ],
    section1Body1: 'Efterfödselsperioden begynder efter födslen. Den ar inte begränset till blot et par dage: krop, daglig rytme och fölelser kan alla ändre sig gradvist over de kommende veckor.',
    section1Body2: '"Karantänen" (quarantaine) ar et traditionelt udtryk, der ofta bruges om de förste veckor av restitutionen. Det kan minde os om noget vigtigt: efter graviditet och födsel ar det godt at tage det roligt och give kroppen tid.',
    highlight1Title: 'Restitution for hele kroppen',
    highlight1Text: 'At komme sig handler inte kun om kroppen – det handler også om sövn, energi, at finde en ny daglig rytme och at vänne sig till et nyt kapitel i livet.',
    section2Body: 'De förste dagar kan väre intense. Hvile, grundläggende omsorg och at finde sig till rette i en ny hverdag ar oftest det, der har forrang. Du behöver inte at have overskud med det samme.',
    recoveryPillars: [
      {
        title: 'Hvile',
        text: 'At veksle mellem aktivitet och hvile giver kroppen mulighed for gradvist at restituere.',
      },
      {
        title: 'Ernäring',
        text: 'At spise jävnligt och drikke nok vand ar en stötte till din daglige trivsel.',
      },
      {
        title: 'Stötte',
        text: 'At tage imod hjälp frigiver energi till nödvendig omsorg och restitution.',
      },
      {
        title: 'Let bevägelse',
        text: 'Vend gradvist tilbage till bevägelse och aktiviteter i ditt eget tempo och efter din komfort.',
      },
    ],
    section3Body1: 'Alla restituerer forskelligt. Nogle forandringer ar en del av tilpasningsprocessen och kan ändre sig gradvist:',
    normalSigns: [
      'Märkbar träthed',
      'Blödning der aftager gradvist',
      'Hormonelle och fölelsesmässige udsving',
    ],
    section3Body2: 'Intensiteten och varigheden av symtom varierer fran person till person. Det vigtige ar at bemärke, hvordan de ändrer sig, och at söge råd, hvis noget virker bekymrende eller unormalt.',
    section4Body: 'I efterfödselsperioden ar små, realistiske vaner ofta mere nyttige end strikse rutiner. Målet ar at stötte restitutionen uden at öge presset.',
    selfCareTips: [
      'Sät ägte tid av till hvile, når det ar muligt.',
      'Bed om hjälp till daglige opgaver och måltider.',
      'Drik jävnligt vand och spis varieret.',
      'Sammenlign inte din restitution med andres.',
      'Vend gradvist tilbage till aktiviteter i stedet for att forsöge at göre alt på én gang.',
    ],
    tip1Title: 'Godt at vide',
    tip1Text: 'At have stötte omkring dig och tage imod hjälp ar inte en luksus. Det kan hjälpe dig med at bevare energien och göre restitutionen mere skånsom och naturlig.',
    section5Body1: 'At vende tilbage till aktiviteter kan ske trinvis, i overensstemmelse med din komfort, energi och de råd, du har fået efter födslen. Let bevägelse och daglige aktiviteter täller redan som en tilbagevenden till aktivitet.',
    section5Body2: 'For mere intensive aktiviteter ar det bedst inte at springe trin over och at tage hensyn till eventuelle symtom eller ubehag.',
    alertTitle: 'Lyt till din krop',
    alertText: 'Hvis ubehaget öges under en aktivitet, bör du sätte tempoet ned och om nödvendigt söge råd, inden du fortsätter eller öger intensiteten.',
    section6Body: 'Efter födslen kan sövnen blive uregelmässig. Ophobning av träthed kan påvirke energi, koncentration och humör. Hvis det ar muligt, kan det hjälpe at forenkle visse opgaver och dele ansvaret.',
    milestones: [
      [
        'De förste dage',
        'Hvile, tilpasning och grundläggende omsorg.',
      ],
      [
        'De förste veckor',
        'Gradvis restitution och begyndende nye rutiner.',
      ],
      [
        'Efter efterfödselskontrollen',
        'At gennemgå fremskridt i restitutionen och dröfte en gradvis tilbagevenden till aktiviteter.',
      ],
    ],
    section7Body1: 'I efterfödselsperioden kan mange fölelser opstå: gläde, bekymring, träthed, sårbarhed eller en fölelse av at väre overväldet. Disse fölelser kan skifte hurtigt, särligt når sövn och daglige vaner ändrer sig.',
    section7Body2: 'Hvis det bliver svärt at håndtere fölelserne, eller de fylder mycket i hverdagen, kan det hjälpe at tale med en man stoler på eller med en professionel.',
    highlight2Title: 'Det ar normalt at söge stötte',
    highlight2Text: 'Du behöver inte vente på at väre fuldständig udmattet eller overväldet – tal om, hvordan du har det, och sög stötte.',
    section8Body: 'Visse situationer bör dröftes med en halsasprofessionel, särligt hvis de forvärres, bliver vedvarende eller giver anledning till bekymring.',
    consultationSigns: [
      {
        title: 'Forvärring av symtom',
        text: 'Hvis smarta eller ubehag öges i stedet for att aftage, bör du söge råd.',
      },
      {
        title: 'Usädvanlig blödning',
        text: 'Hvis blödningen pludselig tiltager eller virker unormal, bör du informere en halsasprofessionel.',
      },
      {
        title: 'Vedvarende psykisk belastning',
        text: 'Hvis psykisk belastning fylder mycket eller gör hverdagen svär, ar det vigtigt at tale om det och söge stötte.',
      },
      {
        title: 'Väsentlige bekymringer',
        text: 'Hvis du ar i tvivl om din restitution, kan det at söge råd hjälpe dig med vejledning, der passer till din situation.',
      },
    ],
    section9Body: 'Opfölgningsaftaler ar en mulighed for att tale om restitution, symtom, tilbagevenden till aktiviteter och övrige spörgsmål. At forberede et par spörgsmål på forhånd kan hjälpe dig med inte at glemme noget.',
    questionTitle: 'Spörgsmål du kan forberede',
    questions: [
      'Forlöber min restitution som forventet ud fran min situation?',
      'Hvilke aktiviteter kan jag gradvist genoptage?',
      'Hvilke symtom bör jag holde öje med?',
      'Hvornår kan jag overveje at vende tilbage till mere intense aktiviteter?',
      'Har jag brug for specialiseret rådgivning eller genopträning?',
    ],
    summaryItems: [
      'Restitution efter födslen sker gradvist och ar forskellig for alle.',
      'Hvile och stötte kan väre en uundvärlig del av restitutionen.',
      'Fysiske forandringer, sövn och fölelser kan ändre sig over veckor.',
      'En gradvis tilbagevenden till aktiviteter respekterer din energi och komfort bedre.',
      'Sög råd, hvis du oplever usädvanlige, vedvarende eller bekymrende symtom.',
    ],
    finalTipTitle: 'Tag den tid, du har brug for',
    finalTipText: 'Restitution ar inte en konkurrence. At tage det gradvist, respektere dina behov och söge stötte, når det ar nödvendigt, ar redan vigtige skridt.',
    disclaimerText: 'Denne artikel ar udelukkende till informationsformål och erstatter inte personlig medicinsk rådgivning. Kontakt en halsasprofessionel, hvis du oplever betydelige, vedvarende eller bekymrende symtom.',
    shareMessage: 'At komme sig efter födslen — AWA',
  },
  nb: {
    badge: 'BARSELTID • TILFRISKNING',
    title: 'Tilfriskning\netter fødselen',
    metaDuration: '10 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Kroppen din trenger tid: hva som er normalt etter fødselen.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Forstå barseltiden',
      'De første dagene: senke tempoet og hente seg inn',
      'Hva som kan være normalt under tilfriskningen',
      'Ta vare på deg selv i hverdagen',
      'Bevege seg og gradvis gjenoppta aktiviteter',
      'Søvn, tretthet og nye rutiner',
      'Følelser etter fødselen',
      'Når du bør søke råd',
      'Kontroll hos helsepersonell',
      'Det viktigste å huske',
    ],
    headings: [
      'Forstå barseltiden',
      'De første dagene: senke tempoet og hente seg inn',
      'Hva som kan være normalt under tilfriskningen',
      'Ta vare på deg selv i hverdagen',
      'Bevege seg og gradvis gjenoppta aktiviteter',
      'Søvn, tretthet og nye rutiner',
      'Følelser etter fødselen',
      'Når bør du søke råd?',
      'Kontroll hos helsepersonell',
      'Det viktigste å huske',
    ],
    section1Body1: 'Barseltiden kommer etter fødselen. Den er ikke begrenset til noen få dager: kroppen, hverdagsrytmen og følelsene kan fortsette å utvikle seg gradvis i ukene som følger.',
    section1Body2: '«Quarantaine» er et tradisjonelt uttrykk som ofte brukes om de første ukene av tilfriskningen. Det kan tjene som en god påminnelse: etter svangerskap og fødsel er det verdt å senke tempoet og gi kroppen tid.',
    highlight1Title: 'En tilfriskning av hele kroppen',
    highlight1Text: 'Tilfriskningen gjelder kroppen, men også søvn, energi, organisering av hverdagen og den følelsesmessige tilpasningen til en ny fase i livet.',
    section2Body: 'De første dagene kan være intense. Hvile, grunnleggende pleie og tilpasning til den nye rytmen er ofte prioriteringene. Du trenger ikke umiddelbart få tilbake ditt vanlige energinivå.',
    recoveryPillars: [
      {title: 'Hvile', text: 'Å veksle mellom aktivitet og hvile hjelper kroppen å komme seg gradvis.'},
      {title: 'Ernæring', text: 'Å spise regelmessig og drikke etter behov støtter tilfriskningen fra dag til dag.'},
      {title: 'Støtte', text: 'Å ta imot hjelp gjør det mulig å spare energi til nødvendig pleie og tilfriskning.'},
      {title: 'Mild bevegelse', text: 'Gjenoppta bevegelser og aktiviteter gradvis, med respekt for tilstanden og komforten din.'},
    ],
    section3Body1: 'Hver tilfriskning er forskjellig. Noen endringer kan være en del av tilpasningsperioden og utvikle seg gradvis:',
    normalSigns: [
      'Betydelig tretthet',
      'Blødning som gradvis avtar',
      'Hormonelle og følelsesmessige svingninger',
    ],
    section3Body2: 'Styrken og varigheten på symptomene kan variere fra person til person. Det som er viktig, er å følge med på hvordan de utvikler seg og å søke råd hvis en endring virker bekymringsfull eller uvanlig.',
    section4Body: 'I barseltiden er små, realistiske vaner ofte mer til hjelp enn en krevende rutine. Målet er å støtte tilfriskningen uten å legge på press.',
    selfCareTips: [
      'Planlegg virkelige hvileøyeblikk når det er mulig.',
      'Be om hjelp til daglige gjøremål og måltider.',
      'Drikk jevnlig og hold et variert kosthold.',
      'Unngå å sammenligne din tilfriskning med noen andres.',
      'Gjenoppta aktiviteter gradvis, uten å prøve å gjøre alt med en gang.',
    ],
    tip1Title: 'Godt å vite',
    tip1Text: 'Å omgi deg med støtte og ta imot hjelp er ikke en luksus. Det kan bidra til å bevare energi og gjøre tilfriskningen mer gradvis.',
    section5Body1: 'Gjenopptakelse av aktiviteter kan skje trinn for trinn, ut fra komfort, energi og anbefalingene du har fått etter fødselen. Milde bevegelser og hverdagsaktiviteter teller allerede som en tilbakevending til bevegelse.',
    section5Body2: 'For mer intense aktiviteter er det best å gå frem uten å hoppe over trinn og ta hensyn til eventuelle symptomer eller ubehag.',
    alertTitle: 'Lytt til kroppens signaler',
    alertText: 'Ubehag som øker under en aktivitet er en grunn til å senke tempoet og, om nødvendig, søke tilpasset råd før du fortsetter eller øker intensiteten.',
    section6Body: 'Søvnen kan bli uregelmessig etter fødselen. Akkumulert tretthet kan påvirke energi, konsentrasjon og humør. Når det er mulig, kan det hjelpe å forenkle visse oppgaver og dele ansvar.',
    milestones: [
      ['De første dagene', 'Hvile, tilpasning og nødvendig pleie.'],
      ['De første ukene', 'Gradvis tilfriskning og starten på nye rutiner.'],
      ['Etter barselkontrollen', 'Gå gjennom fremgangen i tilfriskningen og diskuter gradvis gjenopptakelse av aktiviteter.'],
    ],
    section7Body1: 'Barseltiden kan gi mange følelser: glede, bekymring, tretthet, sårbarhet eller en følelse av å bli overveldet. Disse følelsene kan skifte raskt, særlig i en tid da søvn og daglige vaner endrer seg.',
    section7Body2: 'Å snakke med noen du stoler på eller med en fagperson kan hjelpe når følelsene blir vanskelige å håndtere eller tar mye plass i hverdagen.',
    highlight2Title: 'Å be om støtte er normalt',
    highlight2Text: 'Du trenger ikke vente til du er helt utmattet eller overveldet for å snakke om hvordan du har det og søke støtte.',
    section8Body: 'Visse situasjoner er verdt å ta opp med helsepersonell, særlig når de blir verre, vedvarer eller gir betydelig bekymring.',
    consultationSigns: [
      {title: 'Forverrede symptomer', text: 'Smerte eller ubehag som øker i stedet for å bli bedre, fortjener faglig råd.'},
      {title: 'Uvanlig blødning', text: 'Blødning som plutselig blir kraftigere eller uvanlig, bør meldes til helsepersonell.'},
      {title: 'Vedvarende nød', text: 'Hvis følelsesmessig nød tar mye plass eller gjør hverdagen vanskelig, er det viktig å snakke om det og be om støtte.'},
      {title: 'Betydelig bekymring', text: 'Ved tvil om tilfriskningen din hjelper det å be om råd, slik at du får anbefalinger tilpasset din situasjon.'},
    ],
    section9Body: 'Oppfølgingstimer er en anledning til å snakke om tilfriskningen, symptomer, gjenopptakelse av aktiviteter og eventuelle gjenstående spørsmål. Å forberede noen spørsmål på forhånd kan hjelpe med å sikre at ingenting blir glemt.',
    questionTitle: 'Spørsmål du kan forberede',
    questions: [
      'Går tilfriskningen min som forventet for min situasjon?',
      'Hvilke aktiviteter kan jeg gradvis gjenoppta?',
      'Hvilke symptomer bør jeg være oppmerksom på?',
      'Når kan jeg tenke på en mer intens tilbakevending til trening?',
      'Trenger jeg spesifikke råd eller rehabilitering?',
    ],
    summaryItems: [
      'Tilfriskningen etter fødselen er gradvis og forskjellig for alle.',
      'Hvile og støtte kan være en integrert del av tilfriskningen.',
      'Fysiske endringer, søvn og følelser kan utvikle seg i løpet av ukene.',
      'Å gjenoppta aktiviteter gradvis hjelper deg å respektere energien og komforten din bedre.',
      'Hvis du merker et uvanlig, vedvarende eller bekymringsfullt symptom, er det et godt skritt å søke råd.',
    ],
    finalTipTitle: 'Ta den tiden du trenger',
    finalTipText: 'Tilfriskning er ikke et kappløp. Å gå gradvis frem, respektere behovene dine og be om støtte når det er nødvendig, er allerede viktige skritt.',
    disclaimerText: 'Denne artikkelen er kun til informasjon og erstatter ikke personlig medisinsk rådgivning. Hvis du opplever et betydelig, vedvarende eller bekymringsfullt symptom, bør du kontakte helsepersonell.',
    shareMessage: 'Tilfriskning etter fødselen – AWA',
  },
  pl: {
    badge: 'POŁÓG • REGENERACJA',
    title: 'Regeneracja\npo porodzie',
    metaDuration: '10 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Twoje ciało potrzebuje czasu: co jest normalne po porodzie.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Zrozumieć połóg',
      'Pierwsze dni: zwolnić tempo i dojść do siebie',
      'Co może być normalne podczas regeneracji',
      'Dbanie o siebie na co dzień',
      'Ruch i stopniowy powrót do aktywności',
      'Sen, zmęczenie i nowe rutyny',
      'Emocje po porodzie',
      'Kiedy zasięgnąć porady',
      'Wizyta kontrolna u specjalisty',
      'Co zapamiętać',
    ],
    headings: [
      'Zrozumieć połóg',
      'Pierwsze dni: zwolnić tempo i dojść do siebie',
      'Co może być normalne podczas regeneracji',
      'Dbanie o siebie na co dzień',
      'Ruch i stopniowy powrót do aktywności',
      'Sen, zmęczenie i nowe rutyny',
      'Emocje po porodzie',
      'Kiedy zasięgnąć porady?',
      'Wizyta kontrolna u specjalisty',
      'Co zapamiętać',
    ],
    section1Body1: 'Połóg następuje po porodzie. Nie ogranicza się do kilku dni: ciało, codzienny rytm i emocje mogą stopniowo zmieniać się jeszcze przez kolejne tygodnie.',
    section2Body: 'Pierwsze dni mogą być intensywne. Priorytetem są często odpoczynek, podstawowa pielęgnacja i przystosowanie się do nowego rytmu. Nie trzeba od razu odzyskiwać zwykłego poziomu energii.',
    section1Body2: 'Francuskie określenie „quarantaine” to tradycyjne wyrażenie, często używane do opisania pierwszych tygodni regeneracji. Może służyć jako dobre przypomnienie: po ciąży i porodzie warto zwolnić tempo i dać ciału czas.',
    highlight1Title: 'Regeneracja całego ciała',
    highlight1Text: 'Regeneracja dotyczy ciała, ale też snu, energii, codziennej organizacji i emocjonalnego przystosowania się do nowego etapu życia.',
    recoveryPillars: [
      {title: 'Odpoczynek', text: 'Naprzemienność aktywności i odpoczynku pomaga ciału stopniowo wracać do formy.'},
      {title: 'Odżywianie', text: 'Regularne jedzenie i picie zgodnie z potrzebami wspiera codzienną regenerację.'},
      {title: 'Wsparcie', text: 'Przyjmowanie pomocy pozwala oszczędzić energię na niezbędną pielęgnację i regenerację.'},
      {title: 'Delikatny ruch', text: 'Stopniowo wracaj do ruchu i aktywności, szanując swój stan i komfort.'},
    ],
    section3Body1: 'Każda regeneracja jest inna. Niektóre zmiany mogą być częścią okresu przystosowania i stopniowo się zmieniać:',
    normalSigns: [
      'Znaczne zmęczenie',
      'Krwawienie, które stopniowo słabnie',
      'Wahania hormonalne i emocjonalne',
    ],
    section3Body2: 'Nasilenie i czas trwania objawów mogą się różnić u poszczególnych osób. Ważne jest obserwowanie, jak się zmieniają, i zasięgnięcie porady, jeśli jakaś zmiana wydaje się niepokojąca lub nietypowa.',
    section4Body: 'W okresie poporodowym małe, realistyczne nawyki są często bardziej pomocne niż wymagająca rutyna. Celem jest wspieranie regeneracji bez dodawania presji.',
    selfCareTips: [
      'Planuj prawdziwe chwile odpoczynku, kiedy tylko to możliwe.',
      'Proś o pomoc w codziennych obowiązkach i posiłkach.',
      'Pij regularnie i dbaj o urozmaiconą dietę.',
      'Unikaj porównywania swojej regeneracji z regeneracją innych.',
      'Wracaj do aktywności stopniowo, nie próbując robić wszystkiego od razu.',
    ],
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Otaczanie się wsparciem i przyjmowanie pomocy to nie luksus. Może pomóc zachować energię i sprawić, że regeneracja będzie przebiegać łagodniej.',
    section5Body1: 'Powrót do aktywności może następować krok po kroku, w zależności od komfortu, energii i zaleceń otrzymanych po porodzie. Delikatne ruchy i codzienne czynności już są powrotem do ruchu.',
    section5Body2: 'W przypadku bardziej intensywnych aktywności najlepiej postępować bez pomijania etapów i uwzględniać wszelkie objawy lub dyskomfort.',
    alertTitle: 'Słuchaj sygnałów swojego ciała',
    alertText: 'Dyskomfort, który nasila się podczas aktywności, jest powodem, by zwolnić i w razie potrzeby zasięgnąć odpowiedniej porady, zanim będziesz kontynuować lub zwiększać intensywność.',
    section6Body: 'Sen po porodzie może stać się nieregularny. Skumulowane zmęczenie może wpływać na energię, koncentrację i nastrój. Gdy to możliwe, pomóc może uproszczenie niektórych zadań i dzielenie się obowiązkami.',
    milestones: [
      ['Pierwsze dni', 'Odpoczynek, przystosowanie i niezbędna pielęgnacja.'],
      ['Pierwsze tygodnie', 'Stopniowa regeneracja i początek nowych rutyn.'],
      ['Po wizycie poporodowej', 'Ocena postępów regeneracji i omówienie stopniowego powrotu do aktywności.'],
    ],
    section7Body1: 'Połóg może przynosić wiele emocji: radość, niepokój, zmęczenie, wrażliwość lub poczucie przytłoczenia. Te uczucia mogą szybko się zmieniać, zwłaszcza w czasie, gdy zmieniają się sen i codzienne nawyki.',
    section7Body2: 'Rozmowa z kimś, komu ufasz, lub ze specjalistą może pomóc, gdy emocje stają się trudne do opanowania lub zajmują dużo miejsca w codziennym życiu.',
    highlight2Title: 'Proszenie o wsparcie jest normalne',
    highlight2Text: 'Nie trzeba czekać, aż będziesz całkowicie wyczerpana lub przytłoczona, by porozmawiać o tym, jak się czujesz, i poszukać wsparcia.',
    section8Body: 'Niektóre sytuacje warto omówić ze specjalistą, zwłaszcza gdy się pogarszają, utrzymują lub budzą znaczny niepokój.',
    consultationSigns: [
      {title: 'Pogarszające się objawy', text: 'Ból lub dyskomfort, który się nasila zamiast ustępować, zasługuje na poradę specjalisty.'},
      {title: 'Nietypowe krwawienie', text: 'Krwawienie, które nagle staje się obfitsze lub nietypowe, należy zgłosić specjaliście.'},
      {title: 'Uporczywe cierpienie', text: 'Jeśli cierpienie emocjonalne zajmuje dużo miejsca lub utrudnia codzienne życie, ważne jest, by o tym porozmawiać i poprosić o wsparcie.'},
      {title: 'Znaczny niepokój', text: 'W razie wątpliwości co do regeneracji prośba o poradę pomaga uzyskać zalecenia dopasowane do Twojej sytuacji.'},
    ],
    section9Body: 'Wizyty kontrolne to okazja, by porozmawiać o regeneracji, objawach, powrocie do aktywności i wszelkich pozostałych pytaniach. Przygotowanie kilku pytań z wyprzedzeniem może pomóc niczego nie zapomnieć.',
    questionTitle: 'Pytania, które możesz przygotować',
    questions: [
      'Czy moja regeneracja przebiega zgodnie z oczekiwaniami w mojej sytuacji?',
      'Do jakich aktywności mogę stopniowo wracać?',
      'Na jakie objawy powinnam zwracać uwagę?',
      'Kiedy mogę rozważyć bardziej intensywny powrót do ćwiczeń?',
      'Czy potrzebuję szczególnych wskazówek lub rehabilitacji?',
    ],
    summaryItems: [
      'Regeneracja po porodzie przebiega stopniowo i jest inna dla każdej.',
      'Odpoczynek i wsparcie mogą być integralną częścią regeneracji.',
      'Zmiany fizyczne, sen i emocje mogą zmieniać się w ciągu tygodni.',
      'Stopniowy powrót do aktywności pozwala lepiej uszanować energię i komfort.',
      'Jeśli zauważysz nietypowy, uporczywy lub niepokojący objaw, zasięgnięcie porady to dobry krok.',
    ],
    finalTipTitle: 'Daj sobie potrzebny czas',
    finalTipText: 'Regeneracja to nie wyścig. Postępowanie krok po kroku, z poszanowaniem swoich potrzeb, i proszenie o wsparcie w razie potrzeby to już ważne kroki.',
    disclaimerText: 'Ten artykuł ma charakter wyłącznie informacyjny i nie zastępuje spersonalizowanej porady medycznej. Jeśli wystąpi znaczny, uporczywy lub niepokojący objaw, skontaktuj się ze specjalistą.',
    shareMessage: 'Regeneracja po porodzie — AWA',
  },
  uk: {
    badge: 'ПІСЛЯ ПОЛОГІВ • ВІДНОВЛЕННЯ',
    title: 'Відновлення\nпісля пологів',
    metaDuration: '10 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Вашому тілу потрібен час: що нормально після пологів.',
    contentsTitle: 'У цій статті',
    topics: [
      'Розуміння післяпологового періоду',
      'Перші дні: сповільнитися та відновитися',
      'Що може бути нормальним під час відновлення',
      'Дбайте про себе щодня',
      'Рух і поступове відновлення активності',
      'Сон, втома та нові рутини',
      'Емоції після пологів',
      'Коли звертатися за порадою',
      'Огляд у медичного фахівця',
      'Що запам’ятати',
    ],
    headings: [
      'Розуміння післяпологового періоду',
      'Перші дні: сповільнитися та відновитися',
      'Що може бути нормальним під час відновлення',
      'Дбайте про себе щодня',
      'Рух і поступове відновлення активності',
      'Сон, втома та нові рутини',
      'Емоції після пологів',
      'Коли звертатися за порадою?',
      'Огляд у медичного фахівця',
      'Що запам’ятати',
    ],
    section1Body1: 'Післяпологовий період настає після пологів. Він не обмежується кількома днями: тіло, щоденний ритм та емоції можуть поступово змінюватися ще протягом наступних тижнів.',
    section2Body: 'Перші дні можуть бути напруженими. Пріоритетами часто є відпочинок, базовий догляд і пристосування до нового ритму. Не потрібно одразу відновлювати звичний рівень енергії.',
    section1Body2: 'Французьке слово «quarantaine» — традиційний вислів, що часто описує перші тижні відновлення. Воно може слугувати гарним нагадуванням: після вагітності та пологів варто сповільнитися та дати тілу час.',
    highlight1Title: 'Відновлення всього тіла',
    highlight1Text: 'Відновлення стосується тіла, але також сну, енергії, щоденної організації та емоційного пристосування до нового етапу життя.',
    recoveryPillars: [
      {title: 'Відпочинок', text: 'Чергування активності й відпочинку допомагає тілу поступово відновлюватися.'},
      {title: 'Харчування', text: 'Регулярне харчування та пиття відповідно до потреб підтримує щоденне відновлення.'},
      {title: 'Підтримка', text: 'Прийняття допомоги дозволяє зберегти енергію для необхідного догляду та відновлення.'},
      {title: 'М’який рух', text: 'Поступово відновлюйте рухи та активності, поважаючи свій стан і комфорт.'},
    ],
    section3Body1: 'Кожне відновлення різне. Деякі зміни можуть бути частиною періоду пристосування й поступово змінюватися:',
    normalSigns: [
      'Значна втома',
      'Кровотеча, що поступово слабшає',
      'Гормональні та емоційні коливання',
    ],
    section3Body2: 'Інтенсивність і тривалість симптомів можуть різнитися в різних людей. Важливо стежити за їхніми змінами й шукати поради, якщо якась зміна здається тривожною чи нетиповою.',
    section4Body: 'У післяпологовий період малі, реалістичні звички часто корисніші за вимогливу рутину. Мета — підтримувати відновлення, не додаючи тиску.',
    selfCareTips: [
      'Плануйте справжні моменти відпочинку, коли тільки можливо.',
      'Просіть допомоги з повсякденними справами та їжею.',
      'Пийте регулярно та підтримуйте різноманітне харчування.',
      'Уникайте порівняння свого відновлення з чужим.',
      'Відновлюйте активності поступово, не намагаючись робити все одразу.',
    ],
    tip1Title: 'Варто знати',
    tip1Text: 'Оточувати себе підтримкою та приймати допомогу — це не розкіш. Це може допомогти зберегти енергію й зробити відновлення плавнішим.',
    section5Body1: 'Відновлення активності може відбуватися крок за кроком, залежно від комфорту, енергії та рекомендацій, отриманих після пологів. М’які рухи та щоденні справи вже є поверненням до руху.',
    section5Body2: 'Для інтенсивніших активностей краще просуватися без пропуску етапів і враховувати будь-які симптоми чи дискомфорт.',
    alertTitle: 'Прислухайтеся до сигналів свого тіла',
    alertText: 'Дискомфорт, що посилюється під час активності, — привід сповільнитися та за потреби звернутися за відповідною порадою, перш ніж продовжувати чи збільшувати інтенсивність.',
    section6Body: 'Сон після пологів може ставати нерегулярним. Накопичена втома може впливати на енергію, концентрацію та настрій. За можливості спрощення певних завдань і розподіл обов’язків можуть допомогти.',
    milestones: [
      ['Перші дні', 'Відпочинок, пристосування та необхідний догляд.'],
      ['Перші тижні', 'Поступове відновлення та початок нових рутин.'],
      ['Після післяпологового огляду', 'Оцінка прогресу відновлення та обговорення поступового відновлення активності.'],
    ],
    section7Body1: 'Післяпологовий період може приносити багато емоцій: радість, тривогу, втому, чутливість або відчуття переповненості. Ці почуття можуть швидко змінюватися, особливо в час, коли змінюються сон і щоденні звички.',
    section7Body2: 'Розмова з кимось, кому ви довіряєте, або зі спеціалістом може допомогти, коли емоції стають важкими для керування або займають багато місця в повсякденному житті.',
    highlight2Title: 'Просити підтримки — нормально',
    highlight2Text: 'Не потрібно чекати, поки ви будете повністю виснажені чи переповнені, щоб поговорити про свій стан і шукати підтримки.',
    section8Body: 'Деякі ситуації варто обговорити з медичним фахівцем, особливо коли вони погіршуються, зберігаються або викликають значне занепокоєння.',
    consultationSigns: [
      {title: 'Симптоми, що погіршуються', text: 'Біль чи дискомфорт, що посилюється замість того, щоб покращуватися, заслуговує на пораду фахівця.'},
      {title: 'Нетипова кровотеча', text: 'Кровотечу, що раптово стає рясніша чи нетипова, слід повідомити медичному фахівцю.'},
      {title: 'Стійке страждання', text: 'Якщо емоційне страждання займає багато місця або ускладнює повсякденне життя, важливо поговорити про це й попросити підтримки.'},
      {title: 'Значне занепокоєння', text: 'У разі сумніву щодо вашого відновлення прохання про пораду допомагає отримати рекомендації, що відповідають вашій ситуації.'},
    ],
    section9Body: 'Контрольні візити — нагода поговорити про відновлення, симптоми, відновлення активності та будь-які запитання, що залишилися. Підготовка кількох запитань заздалегідь може допомогти нічого не забути.',
    questionTitle: 'Запитання, які можна підготувати',
    questions: [
      'Чи відновлення проходить так, як очікується в моїй ситуації?',
      'До яких активностей я можу поступово повертатися?',
      'На які симптоми мені слід звертати увагу?',
      'Коли я можу розглядати інтенсивніше повернення до вправ?',
      'Чи потрібні мені особливі поради або реабілітація?',
    ],
    summaryItems: [
      'Відновлення після пологів поступове й різне для кожної.',
      'Відпочинок і підтримка можуть бути невід’ємною частиною відновлення.',
      'Фізичні зміни, сон і емоції можуть змінюватися протягом тижнів.',
      'Поступове відновлення активності допомагає краще поважати вашу енергію та комфорт.',
      'Якщо ви помітили нетиповий, стійкий або тривожний симптом, звернення за порадою — добрий крок.',
    ],
    finalTipTitle: 'Дайте собі потрібний час',
    finalTipText: 'Відновлення — це не гонка. Просуватися поступово, поважаючи свої потреби, і просити підтримки за потреби — це вже важливі кроки.',
    disclaimerText: 'Ця стаття має виключно інформаційний характер і не замінює персоналізованої медичної поради. Якщо у вас з’явиться значний, стійкий або тривожний симптом, зверніться до медичного фахівця.',
    shareMessage: 'Відновлення після пологів — AWA',
  },
  cs: {
    badge: 'PO PORODU • ZOTAVENÍ',
    title: 'Zotavení\npo porodu',
    metaDuration: '10 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Vaše tělo potřebuje čas: co je po porodu normální.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Pochopení období po porodu',
      'První dny: zpomalit a zotavovat se',
      'Co může být během zotavení normální',
      'Péče o sebe v každodenním životě',
      'Postupný pohyb a obnovování aktivit',
      'Spánek, únava a nové rutiny',
      'Emoce po porodu',
      'Kdy vyhledat radu',
      'Kontrola u zdravotnického pracovníka',
      'Co si zapamatovat',
    ],
    headings: [
      'Pochopení období po porodu',
      'První dny: zpomalit a zotavovat se',
      'Co může být během zotavení normální',
      'Péče o sebe v každodenním životě',
      'Postupný pohyb a obnovování aktivit',
      'Spánek, únava a nové rutiny',
      'Emoce po porodu',
      'Kdy vyhledat radu?',
      'Kontrola u zdravotnického pracovníka',
      'Co si zapamatovat',
    ],
    section1Body1: 'Období po porodu následuje po porodu. Neomezuje se na několik dní: tělo, denní rytmus i emoce se mohou v následujících týdnech dál postupně vyvíjet.',
    section1Body2: '„Šestinedělí“ je tradiční výraz, který se často používá k popisu prvních týdnů zotavování. Může sloužit jako dobrá připomínka: po těhotenství a porodu stojí za to zpomalit a dát tělu čas.',
    highlight1Title: 'Zotavení celého těla',
    highlight1Text: 'Zotavení se týká těla, ale také spánku, energie, denní organizace a emočního přizpůsobení se nové životní etapě.',
    section2Body: 'První dny mohou být intenzivní. Prioritou bývá odpočinek, základní péče a přizpůsobení se novému rytmu. Není třeba hned získat zpět obvyklou úroveň energie.',
    recoveryPillars: [
      {title: 'Odpočinek', text: 'Střídání aktivity a odpočinku pomáhá tělu postupně se zotavovat.'},
      {title: 'Výživa', text: 'Pravidelné jídlo a pití podle potřeb podporuje každodenní zotavení.'},
      {title: 'Podpora', text: 'Přijetí pomoci umožňuje ušetřit energii pro základní péči a zotavení.'},
      {title: 'Jemný pohyb', text: 'Postupně obnovujte pohyby a aktivity s ohledem na svůj stav a pohodlí.'},
    ],
    section3Body1: 'Každé zotavení je jiné. Některé změny mohou být součástí období přizpůsobení a postupně se vyvíjet:',
    normalSigns: [
      'Výrazná únava',
      'Krvácení, které postupně ubývá',
      'Hormonální a emoční výkyvy',
    ],
    section3Body2: 'Intenzita a délka příznaků se mohou u každé ženy lišit. Důležité je sledovat, jak se vyvíjejí, a vyhledat radu, pokud se změna zdá znepokojivá nebo neobvyklá.',
    section4Body: 'V období po porodu jsou malé, realistické návyky často užitečnější než náročná rutina. Cílem je podpořit zotavení, aniž byste přidávala tlak.',
    selfCareTips: [
      'Pokud je to možné, naplánujte si skutečné chvíle odpočinku.',
      'Požádejte o pomoc s každodenními úkoly a jídlem.',
      'Pravidelně pijte a udržujte pestrou stravu.',
      'Nesrovnávejte své zotavení se zotavením jiné ženy.',
      'Obnovujte aktivity postupně, aniž byste se snažila stihnout vše hned.',
    ],
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Mít kolem sebe podporu a přijímat pomoc není luxus. Může to pomoci šetřit energii a učinit zotavení postupnějším.',
    section5Body1: 'Obnovování aktivit může probíhat krok za krokem, podle pohodlí, energie a doporučení získaných po porodu. Jemné pohyby a každodenní činnosti se již počítají jako návrat k pohybu.',
    section5Body2: 'U intenzivnějších aktivit je nejlepší postupovat bez přeskakování kroků a zohlednit případné příznaky nebo nepohodlí.',
    alertTitle: 'Naslouchejte signálům svého těla',
    alertText: 'Nepohodlí, které se během aktivity zvyšuje, je důvodem zpomalit a v případě potřeby vyhledat vhodnou radu, než budete pokračovat nebo zvýšíte intenzitu.',
    section6Body: 'Spánek se po porodu může stát nepravidelným. Nahromaděná únava může ovlivnit energii, soustředění a náladu. Pokud je to možné, může pomoci zjednodušení některých úkolů a sdílení odpovědností.',
    milestones: [
      ['První dny', 'Odpočinek, přizpůsobení a základní péče.'],
      ['První týdny', 'Postupné zotavování a začátek nových rutin.'],
      ['Po poporodní kontrole', 'Zhodnocení pokroku v zotavení a rozhovor o postupném obnovování aktivit.'],
    ],
    section7Body1: 'Období po porodu může přinést mnoho emocí: radost, obavy, únavu, citlivost nebo pocit přetížení. Tyto pocity se mohou rychle měnit, zejména v době, kdy se mění spánek a denní návyky.',
    section7Body2: 'Rozhovor s někým, komu důvěřujete, nebo s odborníkem může pomoci, když se emoce stávají obtížně zvladatelnými nebo zabírají v každodenním životě hodně místa.',
    highlight2Title: 'Požádat o podporu je normální',
    highlight2Text: 'Není třeba čekat, až budete úplně vyčerpaná nebo přetížená, abyste mohla promluvit o tom, jak se cítíte, a vyhledat podporu.',
    section8Body: 'Některé situace stojí za to probrat se zdravotnickým pracovníkem, zejména když se zhoršují, přetrvávají nebo způsobují výraznou obavu.',
    consultationSigns: [
      {title: 'Zhoršující se příznaky', text: 'Bolest nebo nepohodlí, které se místo zlepšování zvyšuje, si zaslouží odbornou radu.'},
      {title: 'Neobvyklé krvácení', text: 'Krvácení, které se náhle zesílí nebo je neobvyklé, je třeba nahlásit zdravotnickému pracovníkovi.'},
      {title: 'Přetrvávající tíseň', text: 'Pokud emoční tíseň zabírá hodně místa nebo ztěžuje každodenní život, je důležité o tom mluvit a požádat o podporu.'},
      {title: 'Výrazná obava', text: 'Pokud máte o svém zotavení pochybnosti, požádání o radu vám pomůže získat doporučení vhodná pro vaši situaci.'},
    ],
    section9Body: 'Kontrolní návštěvy jsou příležitostí promluvit o zotavení, příznacích, obnovování aktivit a případných zbývajících otázkách. Příprava několika otázek předem může pomoci, aby se na nic nezapomnělo.',
    questionTitle: 'Otázky, které si můžete připravit',
    questions: [
      'Probíhá moje zotavení tak, jak se pro mou situaci očekává?',
      'Které aktivity mohu postupně obnovit?',
      'Jaké příznaky mám sledovat?',
      'Kdy mohu uvažovat o intenzivnějším návratu ke cvičení?',
      'Potřebuji nějakou specifickou radu nebo rehabilitaci?',
    ],
    summaryItems: [
      'Zotavení po porodu je postupné a u každé ženy jiné.',
      'Odpočinek a podpora mohou být nedílnou součástí zotavení.',
      'Tělesné změny, spánek a emoce se mohou v průběhu týdnů vyvíjet.',
      'Postupné obnovování aktivit vám pomáhá lépe respektovat vaši energii a pohodlí.',
      'Pokud zaznamenáte neobvyklý, přetrvávající nebo znepokojivý příznak, je dobrým krokem požádat o radu.',
    ],
    finalTipTitle: 'Dopřejte si čas, který potřebujete',
    finalTipText: 'Zotavení není závod. Postupovat postupně, respektovat své potřeby a v případě nutnosti požádat o podporu jsou už samy o sobě důležité kroky.',
    disclaimerText: 'Tento článek je pouze informativní a nenahrazuje individuální lékařskou radu. Pokud zaznamenáte výrazný, přetrvávající nebo znepokojivý příznak, kontaktujte zdravotnického pracovníka.',
    shareMessage: 'Zotavení po porodu — AWA',
  },
  sk: {
    badge: 'PO PÔRODE • ZOTAVENIE',
    title: 'Zotavenie\npo pôrode',
    metaDuration: '10 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Vaše telo potrebuje čas: čo je po pôrode normálne.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Pochopenie obdobia po pôrode',
      'Prvé dni: spomaliť a zotaviť sa',
      'Čo môže byť počas zotavenia normálne',
      'Starostlivosť o seba v každodennom živote',
      'Postupný pohyb a obnovenie aktivít',
      'Spánok, únava a nové rutiny',
      'Emócie po pôrode',
      'Kedy hľadať radu',
      'Kontrola u zdravotníckeho pracovníka',
      'Čo si zapamätať',
    ],
    headings: [
      'Pochopenie obdobia po pôrode',
      'Prvé dni: spomaliť a zotaviť sa',
      'Čo môže byť počas zotavenia normálne',
      'Starostlivosť o seba v každodennom živote',
      'Postupný pohyb a obnovenie aktivít',
      'Spánok, únava a nové rutiny',
      'Emócie po pôrode',
      'Kedy by ste mali hľadať radu?',
      'Kontrola u zdravotníckeho pracovníka',
      'Čo si zapamätať',
    ],
    section1Body1: 'Obdobie po pôrode nasleduje po pôrode. Neobmedzuje sa na niekoľko dní: telo, denný rytmus a emócie sa môžu naďalej postupne vyvíjať počas nasledujúcich týždňov.',
    section1Body2: '„Karanténa“ je tradičné vyjadrenie, ktoré sa často používa na opis prvých týždňov zotavovania. Môže slúžiť ako dobrá pripomienka: po tehotenstve a pôrode stojí za to spomaliť a dať telu čas.',
    highlight1Title: 'Zotavenie celého tela',
    highlight1Text: 'Zotavenie sa týka tela, ale aj spánku, energie, každodennej organizácie a emočného prispôsobenia sa novej životnej etape.',
    section2Body: 'Prvé dni môžu byť intenzívne. Prioritou je často odpočinok, základná starostlivosť a prispôsobenie sa novému rytmu. Nie je potrebné okamžite získať späť obvyklú úroveň energie.',
    recoveryPillars: [
      {title: 'Odpočinok', text: 'Striedanie aktivity a odpočinku pomáha telu postupne sa zotavovať.'},
      {title: 'Výživa', text: 'Pravidelné jedenie a pitie podľa potrieb podporuje každodenné zotavenie.'},
      {title: 'Podpora', text: 'Prijatie pomoci umožňuje ušetriť energiu na základnú starostlivosť a zotavenie.'},
      {title: 'Jemný pohyb', text: 'Postupne obnovte pohyby a aktivity, s ohľadom na svoj stav a pohodlie.'},
    ],
    section3Body1: 'Každé zotavenie je iné. Niektoré zmeny môžu byť súčasťou obdobia prispôsobovania a postupne sa vyvíjať:',
    normalSigns: [
      'Výrazná únava',
      'Krvácanie, ktoré postupne ustupuje',
      'Hormonálne a emočné kolísanie',
    ],
    section3Body2: 'Intenzita a trvanie príznakov sa môžu líšiť od ženy k žene. Dôležité je sledovať, ako sa vyvíjajú, a vyhľadať radu, ak sa zmena zdá znepokojujúca alebo nezvyčajná.',
    section4Body: 'V období po pôrode sú malé, realistické návyky často užitočnejšie než náročná rutina. Cieľom je podporiť zotavenie bez pridávania tlaku.',
    selfCareTips: [
      'Podľa možnosti si naplánujte skutočné chvíle odpočinku.',
      'Požiadajte o pomoc s každodennými úlohami a jedlami.',
      'Pravidelne pite a udržiavajte pestrú stravu.',
      'Neporovnávajte svoje zotavenie so zotavením niekoho iného.',
      'Aktivity obnovujte postupne, bez snahy robiť všetko hneď.',
    ],
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Obklopiť sa podporou a prijať pomoc nie je luxus. Môže to pomôcť zachovať energiu a urobiť zotavenie postupnejším.',
    section5Body1: 'Obnovenie aktivít môže prebiehať krok za krokom, podľa pohodlia, energie a odporúčaní získaných po pôrode. Jemné pohyby a bežné každodenné aktivity sa už počítajú ako návrat k pohybu.',
    section5Body2: 'Pri intenzívnejších aktivitách je najlepšie postupovať bez preskakovania krokov a zohľadniť prípadné príznaky alebo nepohodlie.',
    alertTitle: 'Počúvajte signály svojho tela',
    alertText: 'Nepohodlie, ktoré sa počas aktivity zvyšuje, je dôvodom spomaliť a v prípade potreby vyhľadať prispôsobenú radu pred pokračovaním alebo zvýšením intenzity.',
    section6Body: 'Spánok sa po pôrode môže stať nepravidelným. Nahromadená únava môže ovplyvniť energiu, sústredenie a náladu. Ak je to možné, zjednodušenie niektorých úloh a zdieľanie zodpovednosti môže pomôcť.',
    milestones: [
      ['Prvé dni', 'Odpočinok, prispôsobenie a základná starostlivosť.'],
      ['Prvé týždne', 'Postupné zotavenie a začiatok nových rutín.'],
      ['Po popôrodnej kontrole', 'Posúdenie priebehu zotavenia a rozhovor o postupnom obnovení aktivít.'],
    ],
    section7Body1: 'Obdobie po pôrode môže priniesť veľa emócií: radosť, obavy, únavu, citlivosť alebo pocit preťaženia. Tieto pocity sa môžu rýchlo meniť, najmä v čase, keď sa menia spánok a každodenné návyky.',
    section7Body2: 'Rozhovor s niekým, komu dôverujete, alebo s odborníkom môže pomôcť, keď sa emócie ťažko zvládajú alebo zaberajú veľa miesta v každodennom živote.',
    highlight2Title: 'Požiadať o podporu je normálne',
    highlight2Text: 'Nie je potrebné čakať, kým budete úplne vyčerpaná alebo preťažená, aby ste hovorili o tom, ako sa cítite, a vyhľadali podporu.',
    section8Body: 'O niektorých situáciách stojí za to hovoriť so zdravotníckym pracovníkom, najmä keď sa zhoršujú, pretrvávajú alebo spôsobujú výraznú obavu.',
    consultationSigns: [
      {title: 'Zhoršujúce sa príznaky', text: 'Bolesť alebo nepohodlie, ktoré sa zvyšujú namiesto zlepšovania, si zaslúžia odbornú radu.'},
      {title: 'Nezvyčajné krvácanie', text: 'Krvácanie, ktoré sa náhle zosilní alebo je nezvyčajné, treba oznámiť zdravotníckemu pracovníkovi.'},
      {title: 'Pretrvávajúca tieseň', text: 'Ak emočná tieseň zaberá veľa miesta alebo sťažuje každodenný život, je dôležité o nej hovoriť a požiadať o podporu.'},
      {title: 'Výrazná obava', text: 'Ak máte pochybnosti o svojom zotavení, požiadanie o radu vám pomôže získať odporúčania vhodné pre vašu situáciu.'},
    ],
    section9Body: 'Kontrolné návštevy sú príležitosťou hovoriť o zotavení, príznakoch, obnovení aktivít a prípadných zostávajúcich otázkach. Vopred pripravených niekoľko otázok môže pomôcť, aby sa na nič nezabudlo.',
    questionTitle: 'Otázky, ktoré si môžete pripraviť',
    questions: [
      'Postupuje moje zotavenie tak, ako sa pre moju situáciu očakáva?',
      'Ktoré aktivity môžem postupne obnoviť?',
      'Na aké príznaky si mám dávať pozor?',
      'Kedy môžem uvažovať o intenzívnejšom návrate k cvičeniu?',
      'Potrebujem nejakú osobitnú radu alebo rehabilitáciu?',
    ],
    summaryItems: [
      'Zotavenie po pôrode je postupné a pre každú ženu iné.',
      'Odpočinok a podpora môžu byť neoddeliteľnou súčasťou zotavenia.',
      'Telesné zmeny, spánok a emócie sa môžu vyvíjať počas týždňov.',
      'Postupné obnovenie aktivít vám pomáha lepšie rešpektovať svoju energiu a pohodlie.',
      'Ak si všimnete nezvyčajný, pretrvávajúci alebo znepokojujúci príznak, požiadať o radu je dobrý krok.',
    ],
    finalTipTitle: 'Doprajte si čas, ktorý potrebujete',
    finalTipText: 'Zotavenie nie je preteky. Postupovať pomaly, rešpektovať svoje potreby a v prípade potreby požiadať o podporu sú už samy osebe dôležité kroky.',
    disclaimerText: 'Tento článok má iba informatívny charakter a nenahrádza individuálnu lekársku radu. Ak sa u vás objaví výrazný, pretrvávajúci alebo znepokojujúci príznak, obráťte sa na zdravotníckeho pracovníka.',
    shareMessage: 'Zotavenie po pôrode — AWA',
  },
  hu: {
    badge: 'SZÜLÉS UTÁN • FELÉPÜLÉS',
    title: 'Felépülés\na szülés után',
    metaDuration: '10 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'A testednek időre van szüksége: mi a normális a szülés után.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'A szülés utáni időszak megértése',
      'Az első napok: lassítás és felépülés',
      'Mi lehet normális a felépülés során',
      'Gondoskodás magadról a mindennapokban',
      'A mozgás és a tevékenységek fokozatos újrakezdése',
      'Alvás, fáradtság és új rutinok',
      'Érzelmek szülés után',
      'Mikor kérj tanácsot',
      'Kontroll egy egészségügyi szakembernél',
      'Amit érdemes megjegyezni',
    ],
    headings: [
      'A szülés utáni időszak megértése',
      'Az első napok: lassítás és felépülés',
      'Mi lehet normális a felépülés során',
      'Gondoskodás magadról a mindennapokban',
      'A mozgás és a tevékenységek fokozatos újrakezdése',
      'Alvás, fáradtság és új rutinok',
      'Érzelmek szülés után',
      'Mikor kérj tanácsot?',
      'Kontroll egy egészségügyi szakembernél',
      'Amit érdemes megjegyezni',
    ],
    section1Body1: 'A szülés utáni időszak a szülést követi. Nem korlátozódik néhány napra: a test, a napi ritmus és az érzelmek a következő hetekben is fokozatosan alakulhatnak.',
    section1Body2: 'A „karantén” hagyományos kifejezés, amelyet gyakran használnak a felépülés első heteinek leírására. Jó emlékeztető lehet: a terhesség és a szülés után érdemes lassítani és időt adni a testnek.',
    highlight1Title: 'Az egész test felépülése',
    highlight1Text: 'A felépülés a testet érinti, de az alvást, az energiát, a napi szervezést és egy új életszakaszhoz való érzelmi alkalmazkodást is.',
    section2Body: 'Az első napok intenzívek lehetnek. A pihenés, az alapvető ellátás és az új ritmushoz való alkalmazkodás gyakran a prioritás. Nem kell azonnal visszanyerni a szokásos energiaszintedet.',
    recoveryPillars: [
      {title: 'Pihenés', text: 'A tevékenység és a pihenés váltogatása segít a testnek fokozatosan felépülni.'},
      {title: 'Táplálkozás', text: 'A rendszeres étkezés és az igények szerinti ivás támogatja a mindennapi felépülést.'},
      {title: 'Támogatás', text: 'A segítség elfogadása lehetővé teszi, hogy energiát spórolj az alapvető ellátásra és a felépülésre.'},
      {title: 'Kíméletes mozgás', text: 'Fokozatosan indítsd újra a mozgásokat és tevékenységeket, az állapotodat és a kényelmedet tiszteletben tartva.'},
    ],
    section3Body1: 'Minden felépülés más. Egyes változások az alkalmazkodási időszak részei lehetnek, és fokozatosan alakulhatnak:',
    normalSigns: [
      'Jelentős fáradtság',
      'Fokozatosan csökkenő vérzés',
      'Hormonális és érzelmi ingadozások',
    ],
    section3Body2: 'A tünetek erőssége és időtartama nőnként eltérhet. Az a fontos, hogy figyeld az alakulásukat, és kérj tanácsot, ha egy változás aggasztónak vagy szokatlannak tűnik.',
    section4Body: 'A szülés utáni időszakban az apró, reális szokások gyakran hasznosabbak, mint egy megterhelő rutin. A cél a felépülés támogatása anélkül, hogy nyomást adnál hozzá.',
    selfCareTips: [
      'Lehetőség szerint tervezz valódi pihenési pillanatokat.',
      'Kérj segítséget a napi feladatokhoz és az étkezésekhez.',
      'Igyál rendszeresen, és tartsd fenn a változatos étrendet.',
      'Ne hasonlítsd a felépülésedet senki máséhoz.',
      'A tevékenységeket fokozatosan indítsd újra, anélkül, hogy mindent azonnal meg akarnál tenni.',
    ],
    tip1Title: 'Érdemes tudni',
    tip1Text: 'A támogatás körülvétele és a segítség elfogadása nem luxus. Segíthet megőrizni az energiát, és fokozatosabbá teheti a felépülést.',
    section5Body1: 'A tevékenységek újrakezdése lépésről lépésre történhet, a kényelmedtől, az energiádtól és a szülés után kapott javaslatoktól függően. A kíméletes mozgások és a mindennapi tevékenységek már számítanak a mozgáshoz való visszatérésnek.',
    section5Body2: 'Az intenzívebb tevékenységeknél a legjobb lépések kihagyása nélkül haladni, és figyelembe venni az esetleges tüneteket vagy kellemetlenségeket.',
    alertTitle: 'Figyelj a tested jelzéseire',
    alertText: 'A tevékenység közben fokozódó kellemetlenség ok arra, hogy lassíts, és szükség esetén személyre szabott tanácsot kérj a folytatás vagy az intenzitás növelése előtt.',
    section6Body: 'Az alvás szülés után szabálytalanná válhat. A felhalmozódott fáradtság befolyásolhatja az energiát, a koncentrációt és a hangulatot. Ha lehetséges, egyes feladatok egyszerűsítése és a felelősségek megosztása segíthet.',
    milestones: [
      ['Első napok', 'Pihenés, alkalmazkodás és alapvető ellátás.'],
      ['Első hetek', 'Fokozatos felépülés és új rutinok kezdete.'],
      ['A szülés utáni kontroll után', 'A felépülés előrehaladásának áttekintése és a tevékenységek fokozatos újrakezdéséről való beszélgetés.'],
    ],
    section7Body1: 'A szülés utáni időszak sok érzelmet hozhat: örömöt, aggodalmat, fáradtságot, érzékenységet vagy a túlterheltség érzését. Ezek az érzések gyorsan változhatnak, különösen egy olyan időszakban, amikor az alvás és a napi szokások változnak.',
    section7Body2: 'Egy megbízható személlyel vagy szakemberrel való beszélgetés segíthet, ha az érzelmek nehezen kezelhetők, vagy sok teret foglalnak el a mindennapokban.',
    highlight2Title: 'A támogatás kérése természetes',
    highlight2Text: 'Nem kell megvárnod, hogy teljesen kimerült vagy túlterhelt legyél ahhoz, hogy beszélj az érzéseidről és támogatást keress.',
    section8Body: 'Bizonyos helyzeteket érdemes egészségügyi szakemberrel megbeszélni, különösen ha rosszabbodnak, fennmaradnak, vagy jelentős aggodalmat okoznak.',
    consultationSigns: [
      {title: 'Romló tünetek', text: 'A javulás helyett fokozódó fájdalom vagy kellemetlenség szakmai tanácsot érdemel.'},
      {title: 'Szokatlan vérzés', text: 'A hirtelen erősebbé váló vagy szokatlan vérzést jelezni kell egészségügyi szakembernek.'},
      {title: 'Tartós szorongás', text: 'Ha az érzelmi szorongás sok teret foglal el, vagy megnehezíti a mindennapokat, fontos beszélni róla és támogatást kérni.'},
      {title: 'Jelentős aggodalom', text: 'Ha kétségeid vannak a felépülésedről, a tanácskérés segít a helyzetedhez illő javaslatokat kapni.'},
    ],
    section9Body: 'A kontrollvizsgálatok alkalmat adnak a felépülésről, a tünetekről, a tevékenységek újrakezdéséről és az esetleges megmaradt kérdésekről való beszélgetésre. Néhány kérdés előzetes előkészítése segíthet, hogy semmi ne maradjon ki.',
    questionTitle: 'Kérdések, amelyeket előkészíthetsz',
    questions: [
      'A felépülésem a helyzetemhez képest az elvárt módon halad?',
      'Mely tevékenységeket indíthatom újra fokozatosan?',
      'Milyen tünetekre figyeljek?',
      'Mikor gondolhatok intenzívebb visszatérésre a testmozgáshoz?',
      'Szükségem van valamilyen különleges tanácsra vagy rehabilitációra?',
    ],
    summaryItems: [
      'A szülés utáni felépülés fokozatos, és mindenkinél más.',
      'A pihenés és a támogatás a felépülés szerves része lehet.',
      'A testi változások, az alvás és az érzelmek a hetek során alakulhatnak.',
      'A tevékenységek fokozatos újrakezdése segít jobban tiszteletben tartani az energiádat és a kényelmedet.',
      'Ha szokatlan, tartós vagy aggasztó tünetet észlelsz, jó lépés tanácsot kérni.',
    ],
    finalTipTitle: 'Szánj annyi időt, amennyire szükséged van',
    finalTipText: 'A felépülés nem verseny. A fokozatos haladás, az igényeid tiszteletben tartása és szükség esetén a támogatás kérése már önmagukban fontos lépések.',
    disclaimerText: 'Ez a cikk kizárólag tájékoztató jellegű, és nem helyettesíti a személyre szabott orvosi tanácsot. Ha jelentős, tartós vagy aggasztó tünetet tapasztalsz, fordulj egészségügyi szakemberhez.',
    shareMessage: 'Felépülés a szülés után — AWA',
  },
  ro: {
    badge: 'POSTNATAL • RECUPERARE',
    title: 'Recuperarea\ndupă naștere',
    metaDuration: '10 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Corpul tău are nevoie de timp: ce este normal după naștere.',
    contentsTitle: 'În acest articol',
    topics: [
      'Înțelegerea perioadei postnatale',
      'Primele zile: încetinirea ritmului și refacerea',
      'Ce poate fi normal în timpul recuperării',
      'Grija de tine zi de zi',
      'Mișcarea și reluarea treptată a activităților',
      'Somnul, oboseala și noile rutine',
      'Emoțiile după naștere',
      'Când să ceri un sfat',
      'Controlul la un profesionist din domeniul sănătății',
      'Ce să reții',
    ],
    headings: [
      'Înțelegerea perioadei postnatale',
      'Primele zile: încetinirea ritmului și refacerea',
      'Ce poate fi normal în timpul recuperării',
      'Grija de tine zi de zi',
      'Mișcarea și reluarea treptată a activităților',
      'Somnul, oboseala și noile rutine',
      'Emoțiile după naștere',
      'Când ar trebui să ceri un sfat?',
      'Controlul la un profesionist din domeniul sănătății',
      'Ce să reții',
    ],
    section1Body1: 'Perioada postnatală urmează nașterii. Ea nu se limitează la câteva zile: corpul, ritmul zilnic și emoțiile pot continua să evolueze treptat în săptămânile următoare.',
    section1Body2: '„Lăuzia” este o expresie tradițională folosită adesea pentru a descrie primele săptămâni de recuperare. Poate servi ca un bun memento: după sarcină și naștere, merită să încetinești ritmul și să-i dai corpului timp.',
    highlight1Title: 'O recuperare a întregului corp',
    highlight1Text: 'Recuperarea privește corpul, dar și somnul, energia, organizarea zilnică și adaptarea emoțională la o nouă etapă a vieții.',
    section2Body: 'Primele zile pot fi intense. Odihna, îngrijirile de bază și adaptarea la noul ritm sunt adesea prioritățile. Nu e nevoie să-ți recapeți imediat nivelul obișnuit de energie.',
    recoveryPillars: [
      {title: 'Odihna', text: 'Alternarea activității cu odihna ajută corpul să-și revină treptat.'},
      {title: 'Alimentația', text: 'A mânca regulat și a bea în funcție de nevoile tale susține recuperarea de zi cu zi.'},
      {title: 'Sprijinul', text: 'Acceptarea ajutorului face posibilă economisirea energiei pentru îngrijirile esențiale și pentru recuperare.'},
      {title: 'Mișcarea blândă', text: 'Reia treptat mișcările și activitățile, respectându-ți starea și confortul.'},
    ],
    section3Body1: 'Fiecare recuperare este diferită. Unele schimbări pot face parte din perioada de adaptare și pot evolua treptat:',
    normalSigns: [
      'Oboseală importantă',
      'Sângerare care scade treptat',
      'Fluctuații hormonale și emoționale',
    ],
    section3Body2: 'Intensitatea și durata simptomelor pot varia de la o persoană la alta. Ceea ce contează este să urmărești cum evoluează și să ceri un sfat dacă o schimbare pare îngrijorătoare sau neobișnuită.',
    section4Body: 'În perioada postnatală, obiceiurile mici și realiste sunt adesea mai utile decât o rutină solicitantă. Scopul este să susții recuperarea fără a adăuga presiune.',
    selfCareTips: [
      'Planifică momente reale de odihnă ori de câte ori este posibil.',
      'Cere ajutor pentru treburile zilnice și pentru mese.',
      'Bea regulat și păstrează o alimentație variată.',
      'Evită să-ți compari recuperarea cu a altcuiva.',
      'Reia treptat activitățile, fără a încerca să faci totul imediat.',
    ],
    tip1Title: 'Bine de știut',
    tip1Text: 'Să te înconjori de sprijin și să accepți ajutorul nu este un lux. Poate ajuta la păstrarea energiei și poate face recuperarea mai graduală.',
    section5Body1: 'Reluarea activităților se poate face pas cu pas, în funcție de confort, de energie și de recomandările primite după naștere. Mișcările blânde și activitățile de zi cu zi contează deja ca o revenire la mișcare.',
    section5Body2: 'Pentru activitățile mai intense, este mai bine să progresezi fără să sari peste etape și să iei în calcul orice simptome sau disconfort.',
    alertTitle: 'Ascultă semnalele corpului tău',
    alertText: 'Un disconfort care crește în timpul unei activități este un motiv să încetinești și, la nevoie, să ceri un sfat adaptat înainte de a continua sau de a crește intensitatea.',
    section6Body: 'Somnul poate deveni neregulat după naștere. Oboseala acumulată poate afecta energia, concentrarea și starea de spirit. Când este posibil, simplificarea anumitor sarcini și împărțirea responsabilităților pot ajuta.',
    milestones: [
      ['Primele zile', 'Odihnă, adaptare și îngrijiri esențiale.'],
      ['Primele săptămâni', 'Recuperare treptată și începutul noilor rutine.'],
      ['După controlul postnatal', 'Verifică progresul recuperării și discută despre reluarea treptată a activităților.'],
    ],
    section7Body1: 'Perioada postnatală poate aduce multe emoții: bucurie, îngrijorare, oboseală, sensibilitate sau un sentiment de copleșire. Aceste sentimente se pot schimba repede, mai ales într-o perioadă în care somnul și obiceiurile zilnice se schimbă.',
    section7Body2: 'Discuția cu o persoană în care ai încredere sau cu un profesionist poate ajuta atunci când emoțiile devin greu de gestionat sau ocupă mult loc în viața de zi cu zi.',
    highlight2Title: 'Este normal să ceri sprijin',
    highlight2Text: 'Nu e nevoie să aștepți să fii complet epuizată sau copleșită pentru a vorbi despre cum te simți și a cere sprijin.',
    section8Body: 'Unele situații merită discutate cu un profesionist din domeniul sănătății, mai ales când se agravează, persistă sau provoacă o îngrijorare importantă.',
    consultationSigns: [
      {title: 'Simptome care se agravează', text: 'O durere sau un disconfort care crește în loc să se amelioreze merită sfatul unui profesionist.'},
      {title: 'Sângerări neobișnuite', text: 'O sângerare care devine brusc mai abundentă sau neobișnuită trebuie semnalată unui profesionist din domeniul sănătății.'},
      {title: 'Suferință persistentă', text: 'Dacă suferința emoțională ocupă mult loc sau îți îngreunează viața de zi cu zi, este important să vorbești despre ea și să ceri sprijin.'},
      {title: 'Îngrijorare importantă', text: 'Dacă ai îndoieli cu privire la recuperarea ta, cererea unui sfat te ajută să primești recomandări adaptate situației tale.'},
    ],
    section9Body: 'Consultațiile de urmărire sunt o ocazie de a vorbi despre recuperare, simptome, reluarea activităților și orice întrebări rămase. Pregătirea câtorva întrebări din timp poate ajuta să nu se uite nimic.',
    questionTitle: 'Întrebări pe care le poți pregăti',
    questions: [
      'Recuperarea mea evoluează conform așteptărilor pentru situația mea?',
      'Ce activități pot relua treptat?',
      'Ce simptome ar trebui să urmăresc?',
      'Când pot lua în considerare o revenire mai intensă la sport?',
      'Am nevoie de sfaturi specifice sau de recuperare?',
    ],
    summaryItems: [
      'Recuperarea după naștere este treptată și diferită pentru fiecare.',
      'Odihna și sprijinul pot face parte integrantă din recuperare.',
      'Schimbările fizice, somnul și emoțiile pot evolua pe parcursul săptămânilor.',
      'Reluarea treptată a activităților te ajută să-ți respecți mai bine energia și confortul.',
      'Dacă observi un simptom neobișnuit, persistent sau îngrijorător, a cere un sfat este un pas bun.',
    ],
    finalTipTitle: 'Ia-ți timpul de care ai nevoie',
    finalTipText: 'Recuperarea nu este o cursă. A înainta treptat, respectându-ți nevoile, și a cere sprijin atunci când este necesar sunt deja pași importanți.',
    disclaimerText: 'Acest articol are doar caracter informativ și nu înlocuiește sfatul medical personalizat. Dacă ai un simptom important, persistent sau îngrijorător, contactează un profesionist din domeniul sănătății.',
    shareMessage: 'Recuperarea după naștere — AWA',
  },
  bg: {
    badge: 'СЛЕД РАЖДАНЕ • ВЪЗСТАНОВЯВАНЕ',
    title: 'Възстановяване\nслед раждане',
    metaDuration: '10 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Тялото ти се нуждае от време: какво е нормално след раждане.',
    contentsTitle: 'В тази статия',
    topics: [
      'Разбиране на следродовия период',
      'Първите дни: забавяне и възстановяване',
      'Какво може да е нормално по време на възстановяването',
      'Грижа за себе си ден за ден',
      'Постепенно движение и възобновяване на дейностите',
      'Сън, умора и нови рутини',
      'Емоции след раждане',
      'Кога да потърсиш съвет',
      'Преглед при здравен специалист',
      'Какво да запомниш',
    ],
    headings: [
      'Разбиране на следродовия период',
      'Първите дни: забавяне и възстановяване',
      'Какво може да е нормално по време на възстановяването',
      'Грижа за себе си ден за ден',
      'Постепенно движение и възобновяване на дейностите',
      'Сън, умора и нови рутини',
      'Емоции след раждане',
      'Кога да потърсиш съвет?',
      'Преглед при здравен специалист',
      'Какво да запомниш',
    ],
    section1Body1: 'Следродовият период следва раждането. Не се ограничава до няколко дни: тялото, ежедневният ритъм и емоциите могат да продължат да се променят постепенно през следващите седмици.',
    section1Body2: '„Карантината“ е традиционен израз, често използван, за да опише първите седмици на възстановяване. Може да служи като добро напомняне: след бременност и раждане си струва да забавиш темпото и да дадеш време на тялото си.',
    highlight1Title: 'Възстановяване на цялото тяло',
    highlight1Text: 'Възстановяването засяга тялото, но и съня, енергията, ежедневната организация и емоционалното приспособяване към нов етап от живота.',
    section2Body: 'Първите дни могат да бъдат интензивни. Почивката, основната грижа и приспособяването към новия ритъм често са приоритет. Не е нужно веднага да възвърнеш обичайното си ниво на енергия.',
    recoveryPillars: [
      {title: 'Почивка', text: 'Редуването на активност и почивка помага на тялото да се възстановява постепенно.'},
      {title: 'Хранене', text: 'Редовното хранене и пиенето според нуждите ти подпомагат ежедневното възстановяване.'},
      {title: 'Подкрепа', text: 'Приемането на помощ дава възможност да запазиш енергия за най-важната грижа и за възстановяването.'},
      {title: 'Нежно движение', text: 'Постепенно възобновявай движенията и дейностите, като уважаваш състоянието и комфорта си.'},
    ],
    section3Body1: 'Всяко възстановяване е различно. Някои промени могат да са част от периода на приспособяване и да се развиват постепенно:',
    normalSigns: [
      'Значителна умора',
      'Кървене, което постепенно намалява',
      'Хормонални и емоционални колебания',
    ],
    section3Body2: 'Интензивността и продължителността на симптомите могат да варират от човек на човек. Важното е да следиш как се развиват и да потърсиш съвет, ако дадена промяна изглежда тревожна или необичайна.',
    section4Body: 'През следродовия период малките, реалистични навици често са по-полезни от взискателна рутина. Целта е да подкрепиш възстановяването, без да добавяш натиск.',
    selfCareTips: [
      'Планирай истински моменти за почивка, когато е възможно.',
      'Поискай помощ с ежедневните задачи и храната.',
      'Пий редовно и поддържай разнообразно хранене.',
      'Избягвай да сравняваш възстановяването си с това на друга жена.',
      'Възобновявай дейностите постепенно, без да се опитваш да правиш всичко веднага.',
    ],
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Да се обградиш с подкрепа и да приемеш помощ не е лукс. Това може да помогне да запазиш енергия и възстановяването да бъде по-постепенно.',
    section5Body1: 'Възобновяването на дейностите може да става стъпка по стъпка, според комфорта, енергията и препоръките, получени след раждането. Нежните движения и ежедневните дейности вече се броят за връщане към движението.',
    section5Body2: 'За по-интензивни дейности е най-добре да напредваш, без да прескачаш стъпки, и да вземаш предвид евентуалните симптоми или дискомфорт.',
    alertTitle: 'Вслушвай се в сигналите на тялото си',
    alertText: 'Дискомфорт, който се засилва по време на дадена дейност, е причина да забавиш и при нужда да потърсиш подходящ съвет, преди да продължиш или да увеличиш интензивността.',
    section6Body: 'Сънят може да стане нередовен след раждане. Натрупаната умора може да повлияе на енергията, концентрацията и настроението. Когато е възможно, опростяването на някои задачи и споделянето на отговорностите може да помогне.',
    milestones: [
      ['Първите дни', 'Почивка, приспособяване и основна грижа.'],
      ['Първите седмици', 'Постепенно възстановяване и начало на нови рутини.'],
      ['След следродовия преглед', 'Преглед на напредъка на възстановяването и обсъждане на постепенното възобновяване на дейностите.'],
    ],
    section7Body1: 'Следродовият период може да донесе много емоции: радост, тревога, умора, чувствителност или чувство на претоварване. Тези чувства могат да се сменят бързо, особено във време, когато сънят и ежедневните навици се променят.',
    section7Body2: 'Разговорът с човек, на когото се доверяваш, или със специалист може да помогне, когато емоциите стават трудни за овладяване или заемат голямо място в ежедневието.',
    highlight2Title: 'Да поискаш подкрепа е нормално',
    highlight2Text: 'Не е нужно да чакаш, докато си напълно изтощена или претоварена, за да поговориш за това как се чувстваш и да потърсиш подкрепа.',
    section8Body: 'Някои ситуации си струва да бъдат обсъдени със здравен специалист, особено когато се влошават, продължават или предизвикват значително притеснение.',
    consultationSigns: [
      {title: 'Влошаващи се симптоми', text: 'Болка или дискомфорт, които се засилват вместо да се подобряват, заслужават професионален съвет.'},
      {title: 'Необичайно кървене', text: 'Кървене, което внезапно става по-обилно или необичайно, трябва да се съобщи на здравен специалист.'},
      {title: 'Упорито страдание', text: 'Ако емоционалното страдание заема голямо място или затруднява ежедневието, важно е да поговориш за него и да потърсиш подкрепа.'},
      {title: 'Значително притеснение', text: 'При съмнение за възстановяването ти, поискването на съвет ти помага да получиш препоръки, подходящи за ситуацията ти.'},
    ],
    section9Body: 'Прегледите за проследяване са възможност да поговориш за възстановяването, симптомите, възобновяването на дейностите и всички оставащи въпроси. Предварителното подготвяне на няколко въпроса може да помогне нищо да не бъде забравено.',
    questionTitle: 'Въпроси, които можеш да подготвиш',
    questions: [
      'Протича ли възстановяването ми според очакваното за моята ситуация?',
      'Кои дейности мога постепенно да възобновя?',
      'Какви симптоми да следя?',
      'Кога мога да обмисля по-интензивно връщане към упражненията?',
      'Нуждая ли се от специфичен съвет или рехабилитация?',
    ],
    summaryItems: [
      'Възстановяването след раждане е постепенно и различно за всяка жена.',
      'Почивката и подкрепата могат да бъдат неразделна част от възстановяването.',
      'Физическите промени, сънят и емоциите могат да се развиват през седмиците.',
      'Постепенното възобновяване на дейностите ти помага да уважаваш по-добре енергията и комфорта си.',
      'Ако забележиш необичаен, упорит или тревожен симптом, търсенето на съвет е добра стъпка.',
    ],
    finalTipTitle: 'Дай си нужното време',
    finalTipText: 'Възстановяването не е състезание. Да вървиш напред постепенно, да уважаваш нуждите си и да поискаш подкрепа, когато е необходимо, вече са важни стъпки.',
    disclaimerText: 'Тази статия е само с информационна цел и не замества персонализирания медицински съвет. Ако изпитваш значителен, упорит или тревожен симптом, свържи се със здравен специалист.',
    shareMessage: 'Възстановяване след раждане — AWA',
  },
  sr: {
    badge: 'ПОСЛЕ ПОРОЂАЈА • ОПОРАВАК',
    title: 'Опоравак\nпосле порођаја',
    metaDuration: '10 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Твом телу је потребно време: шта је нормално после порођаја.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Разумевање периода после порођаја',
      'Први дани: успоравање и опоравак',
      'Шта може бити нормално током опоравка',
      'Брига о себи из дана у дан',
      'Постепено кретање и настављање активности',
      'Сан, умор и нове рутине',
      'Емоције после порођаја',
      'Када потражити савет',
      'Преглед код здравственог радника',
      'Шта да запамтиш',
    ],
    headings: [
      'Разумевање периода после порођаја',
      'Први дани: успоравање и опоравак',
      'Шта може бити нормално током опоравка',
      'Брига о себи из дана у дан',
      'Постепено кретање и настављање активности',
      'Сан, умор и нове рутине',
      'Емоције после порођаја',
      'Када потражити савет?',
      'Преглед код здравственог радника',
      'Шта да запамтиш',
    ],
    section1Body1: 'Период после порођаја следи порођај. Не ограничава се на неколико дана: тело, свакодневни ритам и емоције могу се и даље постепено мењати током наредних недеља.',
    section1Body2: '„Карантин“ је традиционалан израз који се често користи да опише прве недеље опоравка. Може послужити као добар подсетник: после трудноће и порођаја вреди успорити и дати телу времена.',
    highlight1Title: 'Опоравак целог тела',
    highlight1Text: 'Опоравак се тиче тела, али и сна, енергије, свакодневне организације и емоционалног прилагођавања новој фази живота.',
    section2Body: 'Први дани могу бити интензивни. Одмор, основна нега и прилагођавање новом ритму често су приоритет. Нема потребе да одмах повратиш свој уобичајени ниво енергије.',
    recoveryPillars: [
      {title: 'Одмор', text: 'Смењивање активности и одмора помаже телу да се постепено опоравља.'},
      {title: 'Исхрана', text: 'Редовно једење и пијење према својим потребама подржава свакодневни опоравак.'},
      {title: 'Подршка', text: 'Прихватање помоћи омогућава да сачуваш енергију за најважнију негу и опоравак.'},
      {title: 'Нежно кретање', text: 'Постепено настављај покрете и активности, поштујући своје стање и удобност.'},
    ],
    section3Body1: 'Сваки опоравак је различит. Неке промене могу бити део периода прилагођавања и постепено се развијати:',
    normalSigns: [
      'Значајан умор',
      'Крварење које се постепено смањује',
      'Хормонске и емоционалне флуктуације',
    ],
    section3Body2: 'Интензитет и трајање симптома могу варирати од особе до особе. Важно је пратити како се развијају и потражити савет ако промена изгледа забрињавајуће или необично.',
    section4Body: 'У периоду после порођаја мале, реалне навике често су кориснији од захтевне рутине. Циљ је да подржиш опоравак без додавања притиска.',
    selfCareTips: [
      'Планирај праве тренутке одмора кад год је могуће.',
      'Затражи помоћ око свакодневних обавеза и оброка.',
      'Пиј редовно и одржавај разноврсну исхрану.',
      'Избегавај да упоређујеш свој опоравак са опоравком друге жене.',
      'Настављај активности постепено, без покушаја да све урадиш одмах.',
    ],
    tip1Title: 'Добро је знати',
    tip1Text: 'Окружити се подршком и прихватити помоћ није луксуз. То може помоћи да сачуваш енергију и да опоравак буде постепенији.',
    section5Body1: 'Настављање активности може ићи корак по корак, према удобности, енергији и препорукама добијеним после порођаја. Нежни покрети и свакодневне активности већ се рачунају као повратак кретању.',
    section5Body2: 'За интензивније активности најбоље је напредовати без прескакања корака и узети у обзир евентуалне симптоме или нелагодност.',
    alertTitle: 'Слушај сигнале свог тела',
    alertText: 'Нелагодност која се појачава током неке активности разлог је да успориш и, по потреби, потражиш прилагођен савет пре него што наставиш или повећаш интензитет.',
    section6Body: 'Сан може постати нередован после порођаја. Накупљени умор може утицати на енергију, концентрацију и расположење. Када је могуће, поједностављивање неких задатака и подела одговорности може помоћи.',
    milestones: [
      ['Први дани', 'Одмор, прилагођавање и основна нега.'],
      ['Прве недеље', 'Постепен опоравак и почетак нових рутина.'],
      ['После контроле после порођаја', 'Преглед напретка опоравка и разговор о постепеном настављању активности.'],
    ],
    section7Body1: 'Период после порођаја може донети многе емоције: радост, бригу, умор, осетљивост или осећај преплављености. Ова осећања се могу брзо смењивати, нарочито у времену када се сан и свакодневне навике мењају.',
    section7Body2: 'Разговор са неким коме верујеш или са стручњаком може помоћи када емоције постану тешке за управљање или заузму много места у свакодневном животу.',
    highlight2Title: 'Тражити подршку је нормално',
    highlight2Text: 'Не мораш чекати да будеш потпуно исцрпљена или преплављена да би разговарала о томе како се осећаш и потражила подршку.',
    section8Body: 'Неке ситуације вреди размотрити са здравственим радником, нарочито када се погоршавају, трају или изазивају значајну забринутост.',
    consultationSigns: [
      {title: 'Симптоми који се погоршавају', text: 'Бол или нелагодност који се појачавају уместо да се побољшавају заслужују стручни савет.'},
      {title: 'Необично крварење', text: 'Крварење које изненада постаје обилније или необично треба пријавити здравственом раднику.'},
      {title: 'Упорна патња', text: 'Ако емоционална патња заузима много места или отежава свакодневни живот, важно је да о томе разговараш и потражиш подршку.'},
      {title: 'Значајна забринутост', text: 'При сумњи у свој опоравак, тражење савета помаже ти да добијеш препоруке прилагођене твојој ситуацији.'},
    ],
    section9Body: 'Прегледи за праћење су прилика да разговараш о опоравку, симптомима, настављању активности и свим преосталим питањима. Унапред припремање неколико питања може помоћи да ништа не буде заборављено.',
    questionTitle: 'Питања која можеш припремити',
    questions: [
      'Да ли мој опоравак напредује како се очекује за моју ситуацију?',
      'Које активности могу постепено да наставим?',
      'На које симптоме да пазим?',
      'Када могу да размислим о интензивнијем повратку вежбању?',
      'Да ли ми је потребан специфичан савет или рехабилитација?',
    ],
    summaryItems: [
      'Опоравак после порођаја је постепен и различит за сваку жену.',
      'Одмор и подршка могу бити саставни део опоравка.',
      'Физичке промене, сан и емоције могу се развијати током недеља.',
      'Постепено настављање активности помаже ти да боље поштујеш своју енергију и удобност.',
      'Ако приметиш необичан, упоран или забрињавајући симптом, тражење савета је добра одлука.',
    ],
    finalTipTitle: 'Узми време које ти је потребно',
    finalTipText: 'Опоравак није трка. Напредовање постепено, поштовање својих потреба и тражење подршке када је потребно већ су важни кораци.',
    disclaimerText: 'Овај чланак је само у информативне сврхе и не замењује персонализовани медицински савет. Ако осетиш значајан, упоран или забрињавајући симптом, обрати се здравственом раднику.',
    shareMessage: 'Опоравак после порођаја — AWA',
  },
  hr: {
    badge: 'NAKON PORODA • OPORAVAK',
    title: 'Oporavak\nnakon poroda',
    metaDuration: '10 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Tvom tijelu treba vremena: što je normalno nakon poroda.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Razumijevanje razdoblja nakon poroda',
      'Prvi dani: uspori i oporavi se',
      'Što može biti normalno tijekom oporavka',
      'Briga o sebi iz dana u dan',
      'Postupno kretanje i nastavak aktivnosti',
      'San, umor i nove rutine',
      'Emocije nakon poroda',
      'Kada zatražiti savjet',
      'Pregled kod zdravstvenog djelatnika',
      'Što zapamtiti',
    ],
    headings: [
      'Razumijevanje razdoblja nakon poroda',
      'Prvi dani: uspori i oporavi se',
      'Što može biti normalno tijekom oporavka',
      'Briga o sebi iz dana u dan',
      'Postupno kretanje i nastavak aktivnosti',
      'San, umor i nove rutine',
      'Emocije nakon poroda',
      'Kada zatražiti savjet?',
      'Pregled kod zdravstvenog djelatnika',
      'Što zapamtiti',
    ],
    section1Body1: 'Razdoblje nakon poroda slijedi porod. Nije ograničeno na nekoliko dana: tijelo, svakodnevni ritam i emocije mogu se i dalje postupno mijenjati tijekom sljedećih tjedana.',
    section1Body2: 'Tradicionalni izraz „karantena“ često se koristi za opis prvih tjedana oporavka. Može poslužiti kao dobar podsjetnik: nakon trudnoće i poroda vrijedi usporiti i dati tijelu vremena.',
    highlight1Title: 'Oporavak cijelog tijela',
    highlight1Text: 'Oporavak se odnosi na tijelo, ali i na san, energiju, svakodnevnu organizaciju i emocionalnu prilagodbu novoj životnoj fazi.',
    section2Body: 'Prvi dani mogu biti intenzivni. Odmor, osnovna njega i prilagodba novom ritmu često su prioriteti. Nema potrebe odmah vratiti uobičajenu razinu energije.',
    recoveryPillars: [
      {title: 'Odmor', text: 'Izmjenjivanje aktivnosti i odmora pomaže tijelu da se postupno oporavlja.'},
      {title: 'Prehrana', text: 'Redovito jelo i pijenje prema potrebama podupire svakodnevni oporavak.'},
      {title: 'Podrška', text: 'Prihvaćanje pomoći omogućuje uštedu energije za bitnu njegu i oporavak.'},
      {title: 'Blago kretanje', text: 'Postupno nastavi pokrete i aktivnosti, poštujući svoje stanje i ugodu.'},
    ],
    section3Body1: 'Svaki je oporavak drugačiji. Neke promjene mogu biti dio razdoblja prilagodbe i postupno se mijenjati:',
    normalSigns: [
      'Znatan umor',
      'Krvarenje koje se postupno smanjuje',
      'Hormonske i emocionalne fluktuacije',
    ],
    section3Body2: 'Intenzitet i trajanje simptoma mogu se razlikovati od osobe do osobe. Važno je pratiti kako se mijenjaju i zatražiti savjet ako se promjena čini zabrinjavajućom ili neobičnom.',
    section4Body: 'Tijekom razdoblja nakon poroda male, realistične navike često su korisnije od zahtjevne rutine. Cilj je podržati oporavak bez dodatnog pritiska.',
    selfCareTips: [
      'Kad god je moguće, planiraj prave trenutke odmora.',
      'Zatraži pomoć oko svakodnevnih poslova i obroka.',
      'Redovito pij i drži se raznolike prehrane.',
      'Izbjegavaj uspoređivati svoj oporavak s tuđim.',
      'Aktivnosti nastavljaj postupno, bez pokušaja da sve odmah učiniš.',
    ],
    tip1Title: 'Dobro je znati',
    tip1Text: 'Okružiti se podrškom i prihvatiti pomoć nije luksuz. To može pomoći sačuvati energiju i učiniti oporavak postupnijim.',
    section5Body1: 'Nastavak aktivnosti može teći korak po korak, prema ugodi, energiji i preporukama primljenim nakon poroda. Blaga kretanja i svakodnevne aktivnosti već se računaju kao povratak kretanju.',
    section5Body2: 'Za intenzivnije aktivnosti najbolje je napredovati bez preskakanja koraka i uzeti u obzir sve simptome ili nelagodu.',
    alertTitle: 'Slušaj signale svog tijela',
    alertText: 'Nelagoda koja se pojačava tijekom aktivnosti razlog je za usporavanje i, po potrebi, traženje prilagođenog savjeta prije nastavka ili povećanja intenziteta.',
    section6Body: 'San može postati nepravilan nakon poroda. Nakupljeni umor može utjecati na energiju, koncentraciju i raspoloženje. Kad je moguće, pojednostavljenje određenih zadataka i dijeljenje odgovornosti može pomoći.',
    milestones: [
      ['Prvi dani', 'Odmor, prilagodba i osnovna njega.'],
      ['Prvi tjedni', 'Postupan oporavak i početak novih rutina.'],
      ['Nakon poslijeporođajnog pregleda', 'Pregled napretka oporavka i razgovor o postupnom nastavku aktivnosti.'],
    ],
    section7Body1: 'Razdoblje nakon poroda može donijeti mnoge emocije: radost, brigu, umor, osjetljivost ili osjećaj preplavljenosti. Ti se osjećaji mogu brzo mijenjati, osobito u vrijeme kad se mijenjaju san i svakodnevne navike.',
    section7Body2: 'Razgovor s osobom kojoj vjeruješ ili sa stručnom osobom može pomoći kad emocije postanu teške za nošenje ili zauzmu puno mjesta u svakodnevnom životu.',
    highlight2Title: 'Tražiti podršku je normalno',
    highlight2Text: 'Nema potrebe čekati da budeš potpuno iscrpljena ili preplavljena kako bi razgovarala o tome kako se osjećaš i zatražila podršku.',
    section8Body: 'O nekim situacijama vrijedi razgovarati sa zdravstvenim djelatnikom, osobito kad se pogoršavaju, traju ili izazivaju znatnu zabrinutost.',
    consultationSigns: [
      {title: 'Pogoršanje simptoma', text: 'Bol ili nelagoda koja se pojačava umjesto da se smanjuje zaslužuje stručni savjet.'},
      {title: 'Neobično krvarenje', text: 'Krvarenje koje iznenada postane obilnije ili neobično treba prijaviti zdravstvenom djelatniku.'},
      {title: 'Dugotrajna patnja', text: 'Ako emocionalna patnja zauzima puno mjesta ili otežava svakodnevni život, važno je razgovarati o tome i zatražiti podršku.'},
      {title: 'Znatna zabrinutost', text: 'Ako imaš nedoumice o svom oporavku, traženje savjeta pomaže ti dobiti preporuke prilagođene tvojoj situaciji.'},
    ],
    section9Body: 'Kontrolni pregledi prilika su za razgovor o oporavku, simptomima, nastavku aktivnosti i svim preostalim pitanjima. Unaprijed pripremljeno nekoliko pitanja može pomoći da ništa ne bude zaboravljeno.',
    questionTitle: 'Pitanja koja možeš pripremiti',
    questions: [
      'Napreduje li moj oporavak kako se očekuje za moju situaciju?',
      'Koje aktivnosti mogu postupno nastaviti?',
      'Na koje simptome trebam paziti?',
      'Kada mogu razmisliti o intenzivnijem povratku vježbanju?',
      'Trebam li neke posebne savjete ili rehabilitaciju?',
    ],
    summaryItems: [
      'Oporavak nakon poroda je postupan i kod svake žene drugačiji.',
      'Odmor i podrška mogu biti sastavni dio oporavka.',
      'Tjelesne promjene, san i emocije mogu se mijenjati tijekom tjedana.',
      'Postupan nastavak aktivnosti pomaže ti bolje poštovati svoju energiju i ugodu.',
      'Ako primijetiš neobičan, dugotrajan ili zabrinjavajući simptom, traženje savjeta dobar je korak.',
    ],
    finalTipTitle: 'Uzmi vrijeme koje ti treba',
    finalTipText: 'Oporavak nije utrka. Postupno napredovanje, poštovanje svojih potreba i traženje podrške kad je potrebno već su važni koraci.',
    disclaimerText: 'Ovaj je članak samo informativne naravi i ne zamjenjuje individualni medicinski savjet. Ako imaš znatan, dugotrajan ili zabrinjavajući simptom, obrati se zdravstvenom djelatniku.',
    shareMessage: 'Oporavak nakon poroda — AWA',
  },
  bs: {
    badge: 'NAKON PORODA • OPORAVAK',
    title: 'Oporavak\nnakon porođaja',
    metaDuration: '10 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Tvom tijelu treba vremena: što je normalno nakon porođaja.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Razumijevanje razdoblja nakon porođaja',
      'Prvi dani: uspori i oporavi se',
      'Što može biti normalno tokom oporavka',
      'Briga o sebi iz dana u dan',
      'Postupno kretanje i nastavak aktivnosti',
      'San, umor i nove rutine',
      'Emocije nakon porođaja',
      'Kada zatražiti savjet',
      'Pregled kod zdravstvenog radnika',
      'Što zapamtiti',
    ],
    headings: [
      'Razumijevanje razdoblja nakon porođaja',
      'Prvi dani: uspori i oporavi se',
      'Što može biti normalno tokom oporavka',
      'Briga o sebi iz dana u dan',
      'Postupno kretanje i nastavak aktivnosti',
      'San, umor i nove rutine',
      'Emocije nakon porođaja',
      'Kada zatražiti savjet?',
      'Pregled kod zdravstvenog radnika',
      'Što zapamtiti',
    ],
    section1Body1: 'Razdoblje nakon porođaja slijedi porođaj. Nije ograničeno na nekoliko dana: tijelo, svakodnevni ritam i emocije mogu se i dalje postupno mijenjati tokom sljedećih sedmica.',
    section1Body2: 'Tradicionalni izraz „karantena“ često se koristi za opis prvih sedmica oporavka. Može poslužiti kao dobar podsjetnik: nakon trudnoće i porođaja vrijedi usporiti i dati tijelu vremena.',
    highlight1Title: 'Oporavak cijelog tijela',
    highlight1Text: 'Oporavak se odnosi na tijelo, ali i na san, energiju, svakodnevnu organizaciju i emocionalnu prilagodbu novoj životnoj fazi.',
    section2Body: 'Prvi dani mogu biti intenzivni. Odmor, osnovna njega i prilagodba novom ritmu često su prioriteti. Nema potrebe odmah vratiti uobičajenu razinu energije.',
    recoveryPillars: [
      {title: 'Odmor', text: 'Izmjenjivanje aktivnosti i odmora pomaže tijelu da se postupno oporavlja.'},
      {title: 'Ishrana', text: 'Redovito jelo i pijenje prema potrebama podupire svakodnevni oporavak.'},
      {title: 'Podrška', text: 'Prihvaćanje pomoći omogućuje uštedu energije za bitnu njegu i oporavak.'},
      {title: 'Blago kretanje', text: 'Postupno nastavi pokrete i aktivnosti, poštujući svoje stanje i ugodu.'},
    ],
    section3Body1: 'Svaki je oporavak drugačiji. Neke promjene mogu biti dio razdoblja prilagodbe i postupno se mijenjati:',
    normalSigns: [
      'Znatan umor',
      'Krvarenje koje se postupno smanjuje',
      'Hormonske i emocionalne fluktuacije',
    ],
    section3Body2: 'Intenzitet i trajanje simptoma mogu se razlikovati od osobe do osobe. Važno je pratiti kako se mijenjaju i zatražiti savjet ako se promjena čini zabrinjavajućom ili neobičnom.',
    section4Body: 'Tokom razdoblja nakon porođaja male, realistične navike često su korisnije od zahtjevne rutine. Cilj je podržati oporavak bez dodatnog pritiska.',
    selfCareTips: [
      'Kad god je moguće, planiraj prave trenutke odmora.',
      'Zatraži pomoć oko svakodnevnih poslova i obroka.',
      'Redovito pij i drži se raznolike ishrane.',
      'Izbjegavaj uspoređivati svoj oporavak s tuđim.',
      'Aktivnosti nastavljaj postupno, bez pokušaja da sve odmah učiniš.',
    ],
    tip1Title: 'Dobro je znati',
    tip1Text: 'Okružiti se podrškom i prihvatiti pomoć nije luksuz. To može pomoći sačuvati energiju i učiniti oporavak postupnijim.',
    section5Body1: 'Nastavak aktivnosti može teći korak po korak, prema ugodi, energiji i preporukama primljenim nakon porođaja. Blaga kretanja i svakodnevne aktivnosti već se računaju kao povratak kretanju.',
    section5Body2: 'Za intenzivnije aktivnosti najbolje je napredovati bez preskakanja koraka i uzeti u obzir sve simptome ili nelagodu.',
    alertTitle: 'Slušaj signale svog tijela',
    alertText: 'Nelagoda koja se pojačava tokom aktivnosti razlog je za usporavanje i, po potrebi, traženje prilagođenog savjeta prije nastavka ili povećanja intenziteta.',
    section6Body: 'San može postati nepravilan nakon porođaja. Nakupljeni umor može utjecati na energiju, koncentraciju i raspoloženje. Kad je moguće, pojednostavljenje određenih zadataka i dijeljenje odgovornosti može pomoći.',
    milestones: [
      ['Prvi dani', 'Odmor, prilagodba i osnovna njega.'],
      ['Prve sedmice', 'Postupan oporavak i početak novih rutina.'],
      ['Nakon poslijeporođajnog pregleda', 'Pregled napretka oporavka i razgovor o postupnom nastavku aktivnosti.'],
    ],
    section7Body1: 'Razdoblje nakon porođaja može donijeti mnoge emocije: radost, brigu, umor, osjetljivost ili osjećaj preplavljenosti. Ti se osjećaji mogu brzo mijenjati, osobito u vrijeme kad se mijenjaju san i svakodnevne navike.',
    section7Body2: 'Razgovor s osobom kojoj vjeruješ ili sa stručnom osobom može pomoći kad emocije postanu teške za nošenje ili zauzmu puno mjesta u svakodnevnom životu.',
    highlight2Title: 'Tražiti podršku je normalno',
    highlight2Text: 'Nema potrebe čekati da budeš potpuno iscrpljena ili preplavljena kako bi razgovarala o tome kako se osjećaš i zatražila podršku.',
    section8Body: 'O nekim situacijama vrijedi razgovarati sa zdravstvenim radnikom, osobito kad se pogoršavaju, traju ili izazivaju znatnu zabrinutost.',
    consultationSigns: [
      {title: 'Pogoršanje simptoma', text: 'Bol ili nelagoda koja se pojačava umjesto da se smanjuje zaslužuje stručni savjet.'},
      {title: 'Neobično krvarenje', text: 'Krvarenje koje iznenada postane obilnije ili neobično treba prijaviti zdravstvenom radniku.'},
      {title: 'Dugotrajna patnja', text: 'Ako emocionalna patnja zauzima puno mjesta ili otežava svakodnevni život, važno je razgovarati o tome i zatražiti podršku.'},
      {title: 'Znatna zabrinutost', text: 'Ako imaš nedoumice o svom oporavku, traženje savjeta pomaže ti dobiti preporuke prilagođene tvojoj situaciji.'},
    ],
    section9Body: 'Kontrolni pregledi prilika su za razgovor o oporavku, simptomima, nastavku aktivnosti i svim preostalim pitanjima. Unaprijed pripremljeno nekoliko pitanja može pomoći da ništa ne bude zaboravljeno.',
    questionTitle: 'Pitanja koja možeš pripremiti',
    questions: [
      'Napreduje li moj oporavak kako se očekuje za moju situaciju?',
      'Koje aktivnosti mogu postupno nastaviti?',
      'Na koje simptome trebam paziti?',
      'Kada mogu razmisliti o intenzivnijem povratku vježbanju?',
      'Trebam li neke posebne savjete ili rehabilitaciju?',
    ],
    summaryItems: [
      'Oporavak nakon porođaja je postupan i kod svake žene drugačiji.',
      'Odmor i podrška mogu biti sastavni dio oporavka.',
      'Tjelesne promjene, san i emocije mogu se mijenjati tokom sedmica.',
      'Postupan nastavak aktivnosti pomaže ti bolje poštovati svoju energiju i ugodu.',
      'Ako primijetiš neobičan, dugotrajan ili zabrinjavajući simptom, traženje savjeta dobar je korak.',
    ],
    finalTipTitle: 'Uzmi vrijeme koje ti treba',
    finalTipText: 'Oporavak nije utrka. Postupno napredovanje, poštovanje svojih potreba i traženje podrške kad je potrebno već su važni koraci.',
    disclaimerText: 'Ovaj je članak samo informativne naravi i ne zamjenjuje individualni medicinski savjet. Ako imaš znatan, dugotrajan ili zabrinjavajući simptom, obrati se zdravstvenom radniku.',
    shareMessage: 'Oporavak nakon porođaja — AWA',
  },
  sl: {
    badge: 'PO PORODU • OKREVANJE',
    title: 'Okrevanje\npo porodu',
    metaDuration: '10 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Tvoje telo potrebuje čas: kaj je normalno po porodu.',
    contentsTitle: 'V tem članku',
    topics: [
      'Razumevanje obdobja po porodu',
      'Prvi dnevi: upočasni in okrevaj',
      'Kaj je lahko normalno med okrevanjem',
      'Skrb zase iz dneva v dan',
      'Postopno gibanje in nadaljevanje dejavnosti',
      'Spanje, utrujenost in nove rutine',
      'Čustva po porodu',
      'Kdaj poiskati nasvet',
      'Pregled pri zdravstvenem delavcu',
      'Kaj si zapomniti',
    ],
    headings: [
      'Razumevanje obdobja po porodu',
      'Prvi dnevi: upočasni in okrevaj',
      'Kaj je lahko normalno med okrevanjem',
      'Skrb zase iz dneva v dan',
      'Postopno gibanje in nadaljevanje dejavnosti',
      'Spanje, utrujenost in nove rutine',
      'Čustva po porodu',
      'Kdaj poiskati nasvet?',
      'Pregled pri zdravstvenem delavcu',
      'Kaj si zapomniti',
    ],
    section1Body1: 'Obdobje po porodu sledi porodu. Ni omejeno na nekaj dni: telo, vsakdanji ritem in čustva se lahko še naprej postopoma spreminjajo v naslednjih tednih.',
    section1Body2: 'Tradicionalni izraz „karantena“ se pogosto uporablja za opis prvih tednov okrevanja. Lahko služi kot dober opomnik: po nosečnosti in porodu je vredno upočasniti in dati telesu časa.',
    highlight1Title: 'Okrevanje celotnega telesa',
    highlight1Text: 'Okrevanje se nanaša na telo, a tudi na spanje, energijo, vsakdanjo organizacijo in čustveno prilagoditev novemu življenjskemu obdobju.',
    section2Body: 'Prvi dnevi so lahko intenzivni. Počitek, osnovna nega in prilagoditev novemu ritmu so pogosto prednostne naloge. Ni treba takoj povrniti običajne ravni energije.',
    recoveryPillars: [
      {title: 'Počitek', text: 'Izmenjevanje dejavnosti in počitka pomaga telesu, da se postopoma opomore.'},
      {title: 'Prehrana', text: 'Redno jesti in piti glede na potrebe podpira vsakodnevno okrevanje.'},
      {title: 'Podpora', text: 'Sprejemanje pomoči omogoča prihraniti energijo za bistveno nego in okrevanje.'},
      {title: 'Nežno gibanje', text: 'Postopno nadaljuj gibe in dejavnosti, ob spoštovanju svojega stanja in udobja.'},
    ],
    section3Body1: 'Vsako okrevanje je drugačno. Nekatere spremembe so lahko del obdobja prilagoditve in se postopoma spreminjajo:',
    normalSigns: [
      'Izrazita utrujenost',
      'Krvavitev, ki se postopoma zmanjšuje',
      'Hormonska in čustvena nihanja',
    ],
    section3Body2: 'Intenzivnost in trajanje simptomov se lahko razlikujeta od osebe do osebe. Pomembno je spremljati, kako se spreminjajo, in poiskati nasvet, če se sprememba zdi zaskrbljujoča ali nenavadna.',
    section4Body: 'V obdobju po porodu so male, realistične navade pogosto koristnejše od zahtevne rutine. Cilj je podpreti okrevanje brez dodatnega pritiska.',
    selfCareTips: [
      'Kadar je mogoče, načrtuj prave trenutke počitka.',
      'Prosi za pomoč pri vsakdanjih opravilih in obrokih.',
      'Redno pij in se drži raznolike prehrane.',
      'Izogibaj se primerjanju svojega okrevanja s tujim.',
      'Dejavnosti nadaljuj postopoma, brez poskusa, da bi vse naredila takoj.',
    ],
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Obdati se s podporo in sprejeti pomoč ni razkošje. Lahko pomaga ohraniti energijo in naredi okrevanje postopnejše.',
    section5Body1: 'Nadaljevanje dejavnosti lahko poteka korak za korakom, glede na udobje, energijo in priporočila, prejeta po porodu. Nežna gibanja in vsakdanje dejavnosti se že štejejo kot povratek h gibanju.',
    section5Body2: 'Pri intenzivnejših dejavnostih je najbolje napredovati brez preskakovanja korakov in upoštevati vse simptome ali nelagodje.',
    alertTitle: 'Prisluhni signalom svojega telesa',
    alertText: 'Nelagodje, ki se med dejavnostjo povečuje, je razlog za upočasnitev in, po potrebi, iskanje prilagojenega nasveta pred nadaljevanjem ali povečanjem intenzivnosti.',
    section6Body: 'Spanec lahko po porodu postane nereden. Nakopičena utrujenost lahko vpliva na energijo, koncentracijo in razpoloženje. Kadar je mogoče, lahko pomaga poenostavitev določenih nalog in delitev odgovornosti.',
    milestones: [
      ['Prvi dnevi', 'Počitek, prilagoditev in osnovna nega.'],
      ['Prvi tedni', 'Postopno okrevanje in začetek novih rutin.'],
      ['Po poporodnem pregledu', 'Pregled napredka okrevanja in pogovor o postopnem nadaljevanju dejavnosti.'],
    ],
    section7Body1: 'Obdobje po porodu lahko prinese mnoga čustva: veselje, skrb, utrujenost, občutljivost ali občutek preplavljenosti. Ta čustva se lahko hitro spreminjajo, zlasti v času, ko se spreminjata spanec in vsakdanje navade.',
    section7Body2: 'Pogovor z osebo, ki ji zaupaš, ali strokovnjakom lahko pomaga, kadar čustva postanejo težko obvladljiva ali zavzamejo veliko prostora v vsakdanjem življenju.',
    highlight2Title: 'Prositi za podporo je normalno',
    highlight2Text: 'Ni treba čakati, da si popolnoma izčrpana ali preplavljena, da spregovoriš o tem, kako se počutiš, in zaprosiš za podporo.',
    section8Body: 'O nekaterih situacijah je vredno govoriti z zdravstvenim delavcem, zlasti kadar se poslabšujejo, vztrajajo ali povzročajo znatno zaskrbljenost.',
    consultationSigns: [
      {title: 'Poslabšanje simptomov', text: 'Bolečina ali nelagodje, ki se povečuje namesto da bi se zmanjševalo, zasluži strokovni nasvet.'},
      {title: 'Nenavadna krvavitev', text: 'Krvavitev, ki nenadoma postane obilnejša ali nenavadna, je treba prijaviti zdravstvenemu delavcu.'},
      {title: 'Dolgotrajna stiska', text: 'Če čustvena stiska zavzema veliko prostora ali otežuje vsakdanje življenje, je pomembno govoriti o tem in zaprositi za podporo.'},
      {title: 'Znatna zaskrbljenost', text: 'Če imaš dvome o svojem okrevanju, ti iskanje nasveta pomaga dobiti priporočila, prilagojena tvoji situaciji.'},
    ],
    section9Body: 'Kontrolni pregledi so priložnost za pogovor o okrevanju, simptomih, nadaljevanju dejavnosti in vseh preostalih vprašanjih. Vnaprej pripravljenih nekaj vprašanj lahko pomaga, da nič ni pozabljeno.',
    questionTitle: 'Vprašanja, ki jih lahko pripraviš',
    questions: [
      'Ali moje okrevanje napreduje, kot se pričakuje za mojo situacijo?',
      'Katere dejavnosti lahko postopoma nadaljujem?',
      'Na katere simptome moram paziti?',
      'Kdaj lahko razmislim o intenzivnejšem povratku k vadbi?',
      'Ali potrebujem kakšne posebne nasvete ali rehabilitacijo?',
    ],
    summaryItems: [
      'Okrevanje po porodu je postopno in pri vsaki ženski drugačno.',
      'Počitek in podpora sta lahko sestavni del okrevanja.',
      'Telesne spremembe, spanje in čustva se lahko skozi tedne spreminjajo.',
      'Postopno nadaljevanje dejavnosti ti pomaga bolje spoštovati svojo energijo in udobje.',
      'Če opaziš nenavaden, dolgotrajen ali zaskrbljujoč simptom, je iskanje nasveta dober korak.',
    ],
    finalTipTitle: 'Vzemi si čas, ki ga potrebuješ',
    finalTipText: 'Okrevanje ni tekma. Postopno napredovanje, spoštovanje svojih potreb in iskanje podpore, kadar je potrebna, so že pomembni koraki.',
    disclaimerText: 'Ta članek je samo informativne narave in ne nadomešča osebnega zdravniškega nasveta. Če imaš pomemben, dolgotrajen ali zaskrbljujoč simptom, se obrni na zdravstvenega delavca.',
    shareMessage: 'Okrevanje po porodu — AWA',
  },
  ne: {
    badge: 'सुत्केरीपछि • स्वास्थ्यलाभ',
    title: 'प्रसवपछिको\nस्वास्थ्यलाभ',
    metaDuration: '10 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'तपाईंको शरीरलाई समय चाहिन्छ: प्रसवपछि के सामान्य हो।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'सुत्केरीपछिको अवधि बुझ्ने',
      'पहिला दिनहरू: ढिलो हुने र निको हुने',
      'स्वास्थ्यलाभको क्रममा के सामान्य हुन सक्छ',
      'दिनदिनै आफ्नो ख्याल राख्ने',
      'चाल र गतिविधिहरू बिस्तारै फेरि सुरु गर्ने',
      'निद्रा, थकान र नयाँ दिनचर्या',
      'प्रसवपछिका भावनाहरू',
      'सल्लाह कहिले लिने',
      'स्वास्थ्यकर्मीसँग जाँच',
      'के सम्झने',
    ],
    headings: [
      'सुत्केरीपछिको अवधि बुझ्ने',
      'पहिला दिनहरू: ढिलो हुने र निको हुने',
      'स्वास्थ्यलाभको क्रममा के सामान्य हुन सक्छ',
      'दिनदिनै आफ्नो ख्याल राख्ने',
      'चाल र गतिविधिहरू बिस्तारै फेरि सुरु गर्ने',
      'निद्रा, थकान र नयाँ दिनचर्या',
      'प्रसवपछिका भावनाहरू',
      'सल्लाह कहिले लिनुपर्छ?',
      'स्वास्थ्यकर्मीसँग जाँच',
      'के सम्झने',
    ],
    section1Body1: 'सुत्केरीपछिको अवधि प्रसवपछि आउँछ। यो केही दिनमा मात्र सीमित हुँदैन: आगामी हप्ताहरूमा शरीर, दैनिक लय र भावनाहरू बिस्तारै विकसित हुँदै जान सक्छन्।',
    section1Body2: '“क्वारेन्टिन” एउटा परम्परागत अभिव्यक्ति हो जुन प्रायः स्वास्थ्यलाभका पहिला हप्ताहरू वर्णन गर्न प्रयोग गरिन्छ। यो राम्रो सम्झना बन्न सक्छ: गर्भावस्था र प्रसवपछि, ढिलो हुनु र शरीरलाई समय दिनु लायक छ।',
    highlight1Title: 'सम्पूर्ण शरीरको स्वास्थ्यलाभ',
    highlight1Text: 'स्वास्थ्यलाभले शरीरलाई, तर निद्रा, ऊर्जा, दैनिक व्यवस्था, र जीवनको नयाँ चरणसँग भावनात्मक समायोजनलाई पनि समेट्छ।',
    section2Body: 'पहिला दिनहरू तीव्र हुन सक्छन्। आराम, आधारभूत हेरचाह र नयाँ लयसँग मिलाउनु प्रायः प्राथमिकता हुन्। तुरुन्तै आफ्नो सामान्य ऊर्जाको स्तर फर्कन चाहिँदैन।',
    recoveryPillars: [
      {title: 'आराम', text: 'गतिविधि र आराम पालैपालो गर्नाले शरीरलाई बिस्तारै निको हुन मद्दत गर्छ।'},
      {title: 'पोषण', text: 'नियमित खाने र आफ्नो आवश्यकताअनुसार पिउनाले दैनिक स्वास्थ्यलाभलाई साथ दिन्छ।'},
      {title: 'साथ', text: 'मद्दत स्वीकार गर्नाले आवश्यक हेरचाह र स्वास्थ्यलाभका लागि ऊर्जा जोगाउन सम्भव बनाउँछ।'},
      {title: 'कोमल चाल', text: 'आफ्नो अवस्था र सहजताको सम्मान गर्दै चाल र गतिविधिहरू बिस्तारै फेरि सुरु गर्नुहोस्।'},
    ],
    section3Body1: 'हरेक स्वास्थ्यलाभ फरक हुन्छ। केही परिवर्तनहरू समायोजन अवधिको हिस्सा हुन सक्छन् र बिस्तारै विकसित हुन्छन्:',
    normalSigns: [
      'ठूलो थकान',
      'बिस्तारै घट्दै जाने रक्तस्राव',
      'हर्मोनल र भावनात्मक उतारचढाव',
    ],
    section3Body2: 'लक्षणहरूको तीव्रता र अवधि व्यक्तिपिच्छे फरक हुन सक्छ। महत्त्वपूर्ण कुरा तिनीहरू कसरी बदलिन्छन् हेर्नु र कुनै परिवर्तन चिन्ताजनक वा असामान्य लागे सल्लाह लिनु हो।',
    section4Body: 'सुत्केरीपछिको अवधिमा, कडा दिनचर्याभन्दा साना, यथार्थपरक बानीहरू प्रायः बढी मद्दतकारी हुन्छन्। लक्ष्य दबाब नथपी स्वास्थ्यलाभलाई साथ दिनु हो।',
    selfCareTips: [
      'सम्भव भएसम्म आरामका वास्तविक क्षणहरूको योजना बनाउनुहोस्।',
      'दैनिक कामकाज र खानामा मद्दत माग्नुहोस्।',
      'नियमित रूपमा पिउनुहोस् र विविधतापूर्ण खानपान राख्नुहोस्।',
      'आफ्नो स्वास्थ्यलाभलाई अरू कसैको सँग तुलना नगर्नुहोस्।',
      'सबै कुरा तुरुन्तै गर्न नखोजी गतिविधिहरू बिस्तारै फेरि सुरु गर्नुहोस्।',
    ],
    tip1Title: 'जान्न लायक',
    tip1Text: 'आफूलाई साथले घेर्नु र मद्दत स्वीकार गर्नु विलासिता होइन। यसले ऊर्जा जोगाउन र स्वास्थ्यलाभलाई अझ क्रमिक बनाउन मद्दत गर्न सक्छ।',
    section5Body1: 'गतिविधिहरू फेरि सुरु गर्ने काम चरणबद्ध रूपमा, सहजता, ऊर्जा, र प्रसवपछि प्राप्त सिफारिसहरूका आधारमा हुन सक्छ। कोमल चाल र दैनिक गतिविधिहरू आफैँ चालमा फर्कने कामका रूपमा गनिन्छन्।',
    section5Body2: 'अझ तीव्र गतिविधिहरूका लागि, चरणहरू नछुटाई प्रगति गर्नु र कुनै लक्षण वा असहजतालाई ध्यानमा राख्नु उत्तम हुन्छ।',
    alertTitle: 'आफ्नो शरीरका संकेतहरू सुन्नुहोस्',
    alertText: 'गतिविधिको क्रममा बढ्ने असहजता ढिलो हुनुपर्छ र, आवश्यक परे, जारी राख्नुअघि वा तीव्रता बढाउनुअघि मिलाइएको सल्लाह लिनुपर्छ भन्ने कारण हो।',
    section6Body: 'प्रसवपछि निद्रा अनियमित हुन सक्छ। जम्मा भएको थकानले ऊर्जा, एकाग्रता र मनोदशालाई असर गर्न सक्छ। सम्भव हुँदा, केही कामहरू सरल बनाउनु र जिम्मेवारी बाँड्नुले मद्दत गर्न सक्छ।',
    milestones: [
      ['पहिला दिनहरू', 'आराम, समायोजन र आवश्यक हेरचाह।'],
      ['पहिला हप्ताहरू', 'क्रमिक स्वास्थ्यलाभ र नयाँ दिनचर्याको सुरुवात।'],
      ['प्रसवोत्तर जाँचपछि', 'स्वास्थ्यलाभको प्रगति समीक्षा गर्नुहोस् र बिस्तारै गतिविधिहरू फेरि सुरु गर्नेबारे छलफल गर्नुहोस्।'],
    ],
    section7Body1: 'सुत्केरीपछिको अवधिले धेरै भावनाहरू ल्याउन सक्छ: खुसी, चिन्ता, थकान, संवेदनशीलता वा अभिभूत भएको अनुभूति। यी अनुभूतिहरू छिटो बदलिन सक्छन्, विशेष गरी निद्रा र दैनिक बानी बदलिँदै गरेको समयमा।',
    section7Body2: 'आफूले विश्वास गर्ने कसैसँग वा व्यावसायिकसँग कुरा गर्नाले भावनाहरू व्यवस्थापन गर्न कठिन हुँदा वा दैनिक जीवनमा धेरै ठाउँ लिँदा मद्दत गर्न सक्छ।',
    highlight2Title: 'साथ माग्नु सामान्य हो',
    highlight2Text: 'आफूलाई कस्तो लागिरहेको छ भन्नेबारे कुरा गर्न र साथ खोज्न पूर्ण रूपमा थकित वा अभिभूत नहुन्जेलसम्म पर्खनु पर्दैन।',
    section8Body: 'केही अवस्थाहरू स्वास्थ्यकर्मीसँग छलफल गर्न लायक हुन्छन्, विशेष गरी जब ती बिग्रन्छन्, रहिरहन्छन्, वा ठूलो चिन्ता निम्त्याउँछन्।',
    consultationSigns: [
      {title: 'बिग्रँदा लक्षणहरू', text: 'सुध्रिनुको सट्टा बढ्ने दुखाइ वा असहजताले व्यावसायिक सल्लाह पाउन लायक छ।'},
      {title: 'असामान्य रक्तस्राव', text: 'अचानक बढी हुने वा असामान्य बन्ने रक्तस्रावलाई स्वास्थ्यकर्मीलाई जानकारी गराउनुपर्छ।'},
      {title: 'लगातार पीडा', text: 'भावनात्मक पीडाले धेरै ठाउँ लिँदा वा दैनिक जीवन गाह्रो बनाउँदा, यसबारे कुरा गर्नु र साथ माग्नु महत्त्वपूर्ण छ।'},
      {title: 'ठूलो चिन्ता', text: 'आफ्नो स्वास्थ्यलाभबारे शङ्का भएमा, सल्लाह माग्नाले तपाईंको अवस्थाअनुकूल सिफारिसहरू पाउन मद्दत गर्छ।'},
    ],
    section9Body: 'फलोअप भेटघाटहरू स्वास्थ्यलाभ, लक्षण, गतिविधिहरू फेरि सुरु गर्ने, र बाँकी कुनै प्रश्नबारे कुरा गर्ने अवसर हुन्। पहिल्यै केही प्रश्न तयार गर्दा केही नबिर्सिएको सुनिश्चित गर्न मद्दत गर्न सक्छ।',
    questionTitle: 'तपाईंले तयार गर्न सक्ने प्रश्नहरू',
    questions: [
      'के मेरो स्वास्थ्यलाभ मेरो अवस्थाका लागि अपेक्षित रूपमा अघि बढिरहेको छ?',
      'म कुन गतिविधिहरू बिस्तारै फेरि सुरु गर्न सक्छु?',
      'मैले कुन लक्षणहरूमा ध्यान दिनुपर्छ?',
      'म कहिले अझ तीव्र व्यायामतर्फ फर्कनेबारे विचार गर्न सक्छु?',
      'के मलाई कुनै विशेष सल्लाह वा पुनर्स्थापना चाहिन्छ?',
    ],
    summaryItems: [
      'प्रसवपछिको स्वास्थ्यलाभ क्रमिक हुन्छ र सबैका लागि फरक हुन्छ।',
      'आराम र साथ स्वास्थ्यलाभको अभिन्न अङ्ग हुन सक्छन्।',
      'शारीरिक परिवर्तन, निद्रा र भावनाहरू हप्ताहरूमा विकसित हुन सक्छन्।',
      'बिस्तारै गतिविधिहरू फेरि सुरु गर्नाले तपाईंको ऊर्जा र सहजताको राम्रो सम्मान गर्न मद्दत गर्छ।',
      'असामान्य, लगातार वा चिन्ताजनक लक्षण देखिए, सल्लाह लिनु राम्रो कदम हो।',
    ],
    finalTipTitle: 'आवश्यक समय लिनुहोस्',
    finalTipText: 'स्वास्थ्यलाभ दौड होइन। बिस्तारै अघि बढ्नु, आफ्ना आवश्यकताको सम्मान गर्नु, र आवश्यक पर्दा साथ माग्नु पहिल्यै महत्त्वपूर्ण कदमहरू हुन्।',
    disclaimerText: 'यो लेख केवल जानकारीका लागि हो र व्यक्तिगत चिकित्सकीय सल्लाहको स्थान लिँदैन। तपाईंलाई ठूलो, लगातार वा चिन्ताजनक लक्षण देखिए, स्वास्थ्यकर्मीसँग सम्पर्क गर्नुहोस्।',
    shareMessage: 'प्रसवपछिको स्वास्थ्यलाभ — AWA',
  },
  si: {
    badge: 'ප්‍රසූතියෙන් පසු • යථා තත්ත්වයට පැමිණීම',
    title: 'ප්‍රසූතියෙන් පසු\nයථා තත්ත්වයට පැමිණීම',
    metaDuration: 'කියවීමට මිනිත්තු 10',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඔබේ ශරීරයට කාලය අවශ්‍යයි: ප්‍රසූතියෙන් පසු සාමාන්‍ය දේ.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'ප්‍රසූතියෙන් පසු කාලය තේරුම් ගැනීම',
      'පළමු දින: සෙමින් ගොස් යථා තත්ත්වයට පැමිණීම',
      'යථා තත්ත්වයට පැමිණීමේදී සාමාන්‍ය විය හැක්කේ කුමක්ද',
      'දිනෙන් දින ඔබ ගැන සැලකිලිමත් වීම',
      'චලනය වී ක්‍රියාකාරකම් ක්‍රමයෙන් නැවත ආරම්භ කිරීම',
      'නින්ද, වෙහෙස සහ නව පුරුදු',
      'ප්‍රසූතියෙන් පසු හැඟීම්',
      'උපදෙස් ඉල්ලිය යුත්තේ කවදාද',
      'සෞඛ්‍ය වෘත්තිකයෙකු සමඟ පරීක්ෂාවක්',
      'මතක තබාගත යුතු දේ',
    ],
    headings: [
      'ප්‍රසූතියෙන් පසු කාලය තේරුම් ගැනීම',
      'පළමු දින: සෙමින් ගොස් යථා තත්ත්වයට පැමිණීම',
      'යථා තත්ත්වයට පැමිණීමේදී සාමාන්‍ය විය හැක්කේ කුමක්ද',
      'දිනෙන් දින ඔබ ගැන සැලකිලිමත් වීම',
      'චලනය වී ක්‍රියාකාරකම් ක්‍රමයෙන් නැවත ආරම්භ කිරීම',
      'නින්ද, වෙහෙස සහ නව පුරුදු',
      'ප්‍රසූතියෙන් පසු හැඟීම්',
      'ඔබ උපදෙස් ඉල්ලිය යුත්තේ කවදාද?',
      'සෞඛ්‍ය වෘත්තිකයෙකු සමඟ පරීක්ෂාවක්',
      'මතක තබාගත යුතු දේ',
    ],
    section1Body1: 'ප්‍රසූතියෙන් පසු කාලය ප්‍රසූතියෙන් පසු පැමිණේ. එය දින කිහිපයකට සීමා නොවේ: ශරීරය, එදිනෙදා රිද්මය සහ හැඟීම් ඉදිරි සති තුළ ක්‍රමයෙන් වෙනස් වීම දිගටම කරගෙන යා හැක.',
    section1Body2: '“ක්වාරන්ටේන්” යනු යථා තත්ත්වයට පැමිණීමේ පළමු සති විස්තර කිරීමට බොහෝ විට භාවිතා කරන සම්ප්‍රදායික යෙදුමකි. එය හොඳ සිහිකැඳවීමක් විය හැක: ගර්භණී කාලයෙන් සහ ප්‍රසූතියෙන් පසු, සෙමින් ගොස් ශරීරයට කාලය දීම වටී.',
    highlight1Title: 'මුළු ශරීරයේම යථා තත්ත්වයට පැමිණීමක්',
    highlight1Text: 'යථා තත්ත්වයට පැමිණීම ශරීරයට අදාළ වන අතර, නින්ද, ශක්තිය, එදිනෙදා සංවිධානය සහ ජීවිතයේ නව අවධියකට චිත්තවේගී හැඩගැසීමටද අදාළ වේ.',
    section2Body: 'පළමු දින දැඩි විය හැක. විවේකය, මූලික සත්කාර සහ නව රිද්මයට හැඩගැසීම බොහෝ විට ප්‍රමුඛතා වේ. ඔබේ සුපුරුදු ශක්ති මට්ටම වහාම නැවත ලබා ගැනීමට අවශ්‍ය නැත.',
    recoveryPillars: [
      {title: 'විවේකය', text: 'ක්‍රියාකාරකම සහ විවේකය මාරුවෙන් මාරුවට කිරීම ශරීරයට ක්‍රමයෙන් යථා තත්ත්වයට පැමිණීමට උපකාරී වේ.'},
      {title: 'පෝෂණය', text: 'නිතිපතා අනුභව කිරීම සහ ඔබේ අවශ්‍යතා අනුව පානය කිරීම දිනෙන් දින යථා තත්ත්වයට පැමිණීමට සහාය වේ.'},
      {title: 'සහාය', text: 'උදව් පිළිගැනීම අත්‍යවශ්‍ය සත්කාර සහ යථා තත්ත්වයට පැමිණීම සඳහා ශක්තිය ඉතිරි කර ගැනීමට හැකියාව ලබා දෙයි.'},
      {title: 'මෘදු චලනය', text: 'ඔබේ තත්ත්වයට සහ සුවපහසුවට ගරු කරමින්, චලන සහ ක්‍රියාකාරකම් ක්‍රමයෙන් නැවත ආරම්භ කරන්න.'},
    ],
    section3Body1: 'සෑම යථා තත්ත්වයට පැමිණීමක්ම වෙනස්. සමහර වෙනස්කම් හැඩගැසීමේ කාලයේ කොටසක් විය හැකි අතර ක්‍රමයෙන් වෙනස් විය හැක:',
    normalSigns: [
      'සැලකිය යුතු වෙහෙස',
      'ක්‍රමයෙන් අඩු වන ලේ ගැලීම',
      'හෝමෝන සහ චිත්තවේගී උච්චාවචනය',
    ],
    section3Body2: 'රෝග ලක්ෂණවල තීව්‍රතාව සහ කාලය පුද්ගලයාගෙන් පුද්ගලයාට වෙනස් විය හැක. වැදගත් වන්නේ ඒවා වෙනස් වන ආකාරය නිරීක්ෂණය කිරීම සහ වෙනසක් කනස්සල්ලට කරුණක් හෝ අසාමාන්‍ය ලෙස පෙනේ නම් උපදෙස් ඉල්ලීමයි.',
    section4Body: 'ප්‍රසූතියෙන් පසු කාලය තුළ, කුඩා, යථාර්ථවාදී පුරුදු බොහෝ විට දැඩි පුරුද්දකට වඩා උපකාරී වේ. අරමුණ පීඩනයක් එකතු නොකර යථා තත්ත්වයට පැමිණීමට සහාය වීමයි.',
    selfCareTips: [
      'හැකි සෑම විටම සැබෑ විවේක මොහොතවල් සැලසුම් කරන්න.',
      'එදිනෙදා කාර්යයන් සහ ආහාර වේල් සඳහා උදව් ඉල්ලන්න.',
      'නිතිපතා පානය කර විවිධාකාර ආහාර වේලක් පවත්වන්න.',
      'ඔබේ යථා තත්ත්වයට පැමිණීම වෙනත් කෙනෙකුගේ එකක් සමඟ සංසන්දනය කිරීම වළක්වන්න.',
      'සියල්ල එකවර කිරීමට උත්සාහ නොකර, ක්‍රියාකාරකම් ක්‍රමයෙන් නැවත ආරම්භ කරන්න.',
    ],
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'ඔබව සහාය වලින් වටකර ගැනීම සහ උදව් පිළිගැනීම සුඛෝපභෝගී දෙයක් නොවේ. එය ශක්තිය ආරක්ෂා කිරීමට සහ යථා තත්ත්වයට පැමිණීම වඩා ක්‍රමානුකූල කිරීමට උපකාරී විය හැක.',
    section5Body1: 'ක්‍රියාකාරකම් නැවත ආරම්භ කිරීම, සුවපහසුව, ශක්තිය සහ ප්‍රසූතියෙන් පසු ලැබුණු නිර්දේශ මත පදනම්ව, පියවරෙන් පියවර සිදුවිය හැක. මෘදු චලන සහ එදිනෙදා ක්‍රියාකාරකම් දැනටමත් චලනයට නැවත පැමිණීමක් ලෙස ගණන් ගනී.',
    section5Body2: 'වඩා දැඩි ක්‍රියාකාරකම් සඳහා, පියවර මඟ නොහරිමින් ප්‍රගතියක් ලැබීම සහ ඕනෑම රෝග ලක්ෂණ හෝ අපහසුතා සැලකිල්ලට ගැනීම වඩා හොඳයි.',
    alertTitle: 'ඔබේ ශරීරයේ සංඥාවලට සවන් දෙන්න',
    alertText: 'ක්‍රියාකාරකමක් අතරතුර වැඩි වන අපහසුතාව සෙමින් යාමට සහ, අවශ්‍ය නම්, දිගටම කරගෙන යාමට හෝ තීව්‍රතාව වැඩි කිරීමට පෙර සුදුසු උපදෙස් ඉල්ලීමට හේතුවකි.',
    section6Body: 'ප්‍රසූතියෙන් පසු නින්ද අක්‍රමවත් විය හැක. සමුච්චිත වෙහෙස ශක්තියට, සාන්ද්‍රණයට සහ මනෝභාවයට බලපෑ හැක. හැකි විට, සමහර කාර්යයන් සරල කිරීම සහ වගකීම් බෙදාගැනීම උපකාරී විය හැක.',
    milestones: [
      ['පළමු දින', 'විවේකය, හැඩගැසීම සහ අත්‍යවශ්‍ය සත්කාර.'],
      ['පළමු සති', 'ක්‍රමානුකූල යථා තත්ත්වයට පැමිණීම සහ නව පුරුදුවල ආරම්භය.'],
      ['ප්‍රසූතියෙන් පසු පරීක්ෂාවෙන් පසු', 'යථා තත්ත්වයට පැමිණීමේ ප්‍රගතිය සමාලෝචනය කර ක්‍රියාකාරකම් ක්‍රමයෙන් නැවත ආරම්භ කිරීම සාකච්ඡා කරන්න.'],
    ],
    section7Body1: 'ප්‍රසූතියෙන් පසු කාලය බොහෝ හැඟීම් ගෙන ඒමට පුළුවන්: සතුට, කනස්සල්ල, වෙහෙස, සංවේදීතාව, හෝ අධික බරක් දැනීම. මෙම හැඟීම් ඉක්මනින් මාරු විය හැක, විශේෂයෙන් නින්ද සහ එදිනෙදා පුරුදු වෙනස් වන කාලයක.',
    section7Body2: 'හැඟීම් කළමනාකරණය කිරීමට අපහසු වන විට හෝ එදිනෙදා ජීවිතයේ බොහෝ ඉඩක් ගන්නා විට, ඔබ විශ්වාස කරන කෙනෙකු හෝ වෘත්තිකයෙකු සමඟ කතා කිරීම උපකාරී විය හැක.',
    highlight2Title: 'සහාය ඉල්ලීම සාමාන්‍යයි',
    highlight2Text: 'ඔබට දැනෙන ආකාරය ගැන කතා කිරීමට සහ සහාය ලබා ගැනීමට ඔබ සම්පූර්ණයෙන්ම වෙහෙසට පත්වන තුරු හෝ අධික බරක් දැනෙන තුරු බලා සිටීමට අවශ්‍ය නැත.',
    section8Body: 'සමහර තත්ත්වයන් සෞඛ්‍ය වෘත්තිකයෙකු සමඟ සාකච්ඡා කිරීම වටී, විශේෂයෙන් ඒවා නරක අතට හැරෙන, දිගටම පවතින, හෝ සැලකිය යුතු කනස්සල්ලක් ඇති කරන විට.',
    consultationSigns: [
      {title: 'නරක අතට හැරෙන රෝග ලක්ෂණ', text: 'යහපත් වනවාට වඩා වැඩි වන වේදනාව හෝ අපහසුතාව වෘත්තීය උපදෙස්වලට සුදුසුයි.'},
      {title: 'අසාමාන්‍ය ලේ ගැලීම', text: 'හදිසියේ වැඩි වන හෝ අසාමාන්‍ය ලේ ගැලීම සෞඛ්‍ය වෘත්තිකයෙකුට වාර්තා කළ යුතුයි.'},
      {title: 'දිගටම පවතින දුක්ඛිතභාවය', text: 'චිත්තවේගී දුක්ඛිතභාවය බොහෝ ඉඩක් ගන්නේ නම් හෝ එදිනෙදා ජීවිතය අපහසු කරන්නේ නම්, ඒ ගැන කතා කර සහාය ඉල්ලීම වැදගත්.'},
      {title: 'සැලකිය යුතු කනස්සල්ලක්', text: 'ඔබේ යථා තත්ත්වයට පැමිණීම ගැන සැකයක් ඇත්නම්, උපදෙස් ඉල්ලීම ඔබේ තත්ත්වයට ගැළපෙන නිර්දේශ ලබා ගැනීමට උපකාරී වේ.'},
    ],
    section9Body: 'පසු විපරම් හමුවීම් යථා තත්ත්වයට පැමිණීම, රෝග ලක්ෂණ, ක්‍රියාකාරකම් නැවත ආරම්භ කිරීම සහ ඉතිරි ඕනෑම ප්‍රශ්නයක් ගැන කතා කිරීමට අවස්ථාවකි. කල්තියා ප්‍රශ්න කිහිපයක් සූදානම් කිරීම කිසිවක් අමතක නොවන බව සහතික කිරීමට උපකාරී විය හැක.',
    questionTitle: 'ඔබට සූදානම් කළ හැකි ප්‍රශ්න',
    questions: [
      'මගේ යථා තත්ත්වයට පැමිණීම මගේ තත්ත්වයට අපේක්ෂිත පරිදි ප්‍රගතියක් ලබනවාද?',
      'මට ක්‍රමයෙන් නැවත ආරම්භ කළ හැකි ක්‍රියාකාරකම් මොනවාද?',
      'මා අවධානයෙන් සිටිය යුතු රෝග ලක්ෂණ මොනවාද?',
      'වඩා දැඩි ව්‍යායාමයකට නැවත පැමිණීම සලකා බැලිය හැක්කේ කවදාද?',
      'මට කිසියම් විශේෂ උපදෙසක් හෝ පුනරුත්ථාපනයක් අවශ්‍යද?',
    ],
    summaryItems: [
      'ප්‍රසූතියෙන් පසු යථා තත්ත්වයට පැමිණීම ක්‍රමානුකූල වන අතර සෑම කෙනෙකුටම වෙනස්.',
      'විවේකය සහ සහාය යථා තත්ත්වයට පැමිණීමේ අනිවාර්ය කොටසක් විය හැක.',
      'ශාරීරික වෙනස්කම්, නින්ද සහ හැඟීම් සති පුරා වෙනස් විය හැක.',
      'ක්‍රියාකාරකම් ක්‍රමයෙන් නැවත ආරම්භ කිරීම ඔබේ ශක්තියට සහ සුවපහසුවට වඩා හොඳින් ගරු කිරීමට උපකාරී වේ.',
      'ඔබ අසාමාන්‍ය, දිගටම පවතින, හෝ කනස්සල්ලට කරුණක් වන රෝග ලක්ෂණයක් දුටුවහොත්, උපදෙස් ඉල්ලීම හොඳ පියවරකි.',
    ],
    finalTipTitle: 'ඔබට අවශ්‍ය කාලය ගන්න',
    finalTipText: 'යථා තත්ත්වයට පැමිණීම තරඟයක් නොවේ. ක්‍රමයෙන් ඉදිරියට යාම, ඔබේ අවශ්‍යතාවලට ගරු කිරීම සහ අවශ්‍ය විට සහාය ඉල්ලීම දැනටමත් වැදගත් පියවර වේ.',
    disclaimerText: 'මෙම ලිපිය තොරතුරු සඳහා පමණි, පුද්ගලීකරණය කළ වෛද්‍ය උපදෙස් වෙනුවට නොපවතී. ඔබ සැලකිය යුතු, දිගටම පවතින, හෝ කනස්සල්ලට කරුණක් වන රෝග ලක්ෂණයක් අත්විඳින්නේ නම්, සෞඛ්‍ය වෘත්තිකයෙකු අමතන්න.',
    shareMessage: 'ප්‍රසූතියෙන් පසු යථා තත්ත්වයට පැමිණීම — AWA',
  },
  th: {
    badge: 'หลังคลอด • การฟื้นตัว',
    title: 'การฟื้นตัว\nหลังคลอด',
    metaDuration: 'อ่าน 10 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ร่างกายของคุณต้องใช้เวลา: อะไรที่เป็นปกติหลังคลอด',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ทำความเข้าใจช่วงหลังคลอด',
      'วันแรก ๆ: ชะลอและฟื้นตัว',
      'อะไรที่อาจเป็นปกติระหว่างการฟื้นตัว',
      'ดูแลตัวเองในแต่ละวัน',
      'เคลื่อนไหวและกลับมาทำกิจกรรมทีละน้อย',
      'การนอน ความเหนื่อยล้า และกิจวัตรใหม่',
      'อารมณ์หลังคลอด',
      'เมื่อไรควรขอคำแนะนำ',
      'การตรวจกับบุคลากรทางการแพทย์',
      'สิ่งที่ควรจำ',
    ],
    headings: [
      'ทำความเข้าใจช่วงหลังคลอด',
      'วันแรก ๆ: ชะลอและฟื้นตัว',
      'อะไรที่อาจเป็นปกติระหว่างการฟื้นตัว',
      'ดูแลตัวเองในแต่ละวัน',
      'เคลื่อนไหวและกลับมาทำกิจกรรมทีละน้อย',
      'การนอน ความเหนื่อยล้า และกิจวัตรใหม่',
      'อารมณ์หลังคลอด',
      'เมื่อไรควรขอคำแนะนำ?',
      'การตรวจกับบุคลากรทางการแพทย์',
      'สิ่งที่ควรจำ',
    ],
    section1Body1: 'ช่วงหลังคลอดตามหลังการคลอด ไม่ได้จำกัดอยู่เพียงไม่กี่วัน: ร่างกาย จังหวะชีวิตประจำวัน และอารมณ์อาจเปลี่ยนแปลงต่อไปทีละน้อยในสัปดาห์ถัดมา',
    section1Body2: '“ควอรันแทน” (quarantaine) เป็นสำนวนดั้งเดิมที่มักใช้เรียกสัปดาห์แรกของการฟื้นตัว อาจเป็นคำเตือนที่ดี: หลังตั้งครรภ์และคลอด ควรชะลอและให้เวลาร่างกาย',
    highlight1Title: 'การฟื้นตัวทั้งตัว',
    highlight1Text: 'การฟื้นตัวเกี่ยวกับร่างกาย แต่ยังรวมถึงการนอน พลังงาน การจัดระเบียบในแต่ละวัน และการปรับตัวทางอารมณ์ต่อชีวิตช่วงใหม่',
    section2Body: 'วันแรก ๆ อาจเข้มข้น การพักผ่อน การดูแลพื้นฐาน และการปรับตัวกับจังหวะใหม่ มักเป็นสิ่งสำคัญที่สุด ไม่จำเป็นต้องกลับมามีพลังงานระดับปกติทันที',
    recoveryPillars: [
      {title: 'พักผ่อน', text: 'การสลับระหว่างกิจกรรมกับการพักช่วยให้ร่างกายค่อย ๆ ฟื้นตัว'},
      {title: 'โภชนาการ', text: 'การกินสม่ำเสมอและดื่มน้ำตามความต้องการสนับสนุนการฟื้นตัวในแต่ละวัน'},
      {title: 'การสนับสนุน', text: 'การยอมรับความช่วยเหลือทำให้ประหยัดพลังงานไว้สำหรับการดูแลและการฟื้นตัวที่จำเป็น'},
      {title: 'การเคลื่อนไหวเบา ๆ', text: 'ค่อย ๆ กลับมาเคลื่อนไหวและทำกิจกรรม โดยเคารพสภาพและความสบายของคุณ'},
    ],
    section3Body1: 'การฟื้นตัวของแต่ละคนต่างกัน การเปลี่ยนแปลงบางอย่างอาจเป็นส่วนหนึ่งของช่วงปรับตัวและค่อย ๆ เปลี่ยนไป:',
    normalSigns: [
      'เหนื่อยล้ามาก',
      'เลือดที่ออกค่อย ๆ ลดลง',
      'ความผันผวนของฮอร์โมนและอารมณ์',
    ],
    section3Body2: 'ความรุนแรงและระยะเวลาของอาการอาจต่างกันในแต่ละคน สิ่งสำคัญคือสังเกตว่าเปลี่ยนไปอย่างไรและขอคำแนะนำหากการเปลี่ยนแปลงดูน่ากังวลหรือผิดปกติ',
    section4Body: 'ในช่วงหลังคลอด นิสัยเล็ก ๆ ที่เป็นจริงมักมีประโยชน์กว่ากิจวัตรที่เรียกร้องมาก เป้าหมายคือสนับสนุนการฟื้นตัวโดยไม่เพิ่มแรงกดดัน',
    selfCareTips: [
      'วางแผนช่วงพักผ่อนจริง ๆ ทุกครั้งที่ทำได้',
      'ขอความช่วยเหลือเรื่องงานประจำวันและมื้ออาหาร',
      'ดื่มน้ำสม่ำเสมอและกินอาหารหลากหลาย',
      'หลีกเลี่ยงการเปรียบเทียบการฟื้นตัวของคุณกับของคนอื่น',
      'ค่อย ๆ กลับมาทำกิจกรรม โดยไม่พยายามทำทุกอย่างทันที',
    ],
    tip1Title: 'ควรรู้',
    tip1Text: 'การมีการสนับสนุนรอบตัวและยอมรับความช่วยเหลือไม่ใช่ความฟุ่มเฟือย ช่วยรักษาพลังงานและทำให้การฟื้นตัวเป็นไปอย่างค่อยเป็นค่อยไป',
    section5Body1: 'การกลับมาทำกิจกรรมทำได้ทีละขั้น ตามความสบาย พลังงาน และคำแนะนำที่ได้รับหลังคลอด การเคลื่อนไหวเบา ๆ และกิจกรรมในชีวิตประจำวันนับเป็นการกลับมาเคลื่อนไหวแล้ว',
    section5Body2: 'สำหรับกิจกรรมที่หนักกว่า ควรก้าวหน้าโดยไม่ข้ามขั้นตอน และคำนึงถึงอาการหรือความไม่สบายใด ๆ',
    alertTitle: 'ฟังสัญญาณจากร่างกายของคุณ',
    alertText: 'ความไม่สบายที่เพิ่มขึ้นระหว่างทำกิจกรรมเป็นเหตุผลให้ชะลอ และหากจำเป็น ขอคำแนะนำที่เหมาะสมก่อนทำต่อหรือเพิ่มความหนัก',
    section6Body: 'การนอนอาจไม่สม่ำเสมอหลังคลอด ความเหนื่อยล้าสะสมอาจส่งผลต่อพลังงาน สมาธิ และอารมณ์ เมื่อเป็นไปได้ การทำงานบางอย่างให้ง่ายขึ้นและแบ่งความรับผิดชอบช่วยได้',
    milestones: [
      ['วันแรก ๆ', 'พักผ่อน ปรับตัว และการดูแลที่จำเป็น'],
      ['สัปดาห์แรก ๆ', 'ฟื้นตัวทีละน้อยและเริ่มกิจวัตรใหม่'],
      ['หลังตรวจหลังคลอด', 'ทบทวนความคืบหน้าของการฟื้นตัวและพูดคุยเรื่องการค่อย ๆ กลับมาทำกิจกรรม'],
    ],
    section7Body1: 'ช่วงหลังคลอดอาจนำอารมณ์มากมาย: ความสุข ความกังวล ความเหนื่อยล้า ความอ่อนไหว หรือความรู้สึกท่วมท้น ความรู้สึกเหล่านี้อาจเปลี่ยนเร็ว โดยเฉพาะในช่วงที่การนอนและนิสัยประจำวันกำลังเปลี่ยนไป',
    section7Body2: 'การพูดคุยกับคนที่คุณไว้ใจหรือผู้เชี่ยวชาญช่วยได้เมื่ออารมณ์จัดการยากหรือกินพื้นที่มากในชีวิตประจำวัน',
    highlight2Title: 'การขอการสนับสนุนเป็นเรื่องปกติ',
    highlight2Text: 'ไม่จำเป็นต้องรอจนหมดแรงหรือท่วมท้นโดยสิ้นเชิงก่อนจึงพูดถึงความรู้สึกและขอการสนับสนุน',
    section8Body: 'บางสถานการณ์ควรพูดคุยกับบุคลากรทางการแพทย์ โดยเฉพาะเมื่อแย่ลง คงอยู่ หรือทำให้กังวลมาก',
    consultationSigns: [
      {title: 'อาการที่แย่ลง', text: 'อาการปวดหรือความไม่สบายที่เพิ่มขึ้นแทนที่จะดีขึ้น ควรได้รับคำแนะนำจากผู้เชี่ยวชาญ'},
      {title: 'เลือดออกผิดปกติ', text: 'เลือดที่ออกมากขึ้นอย่างกะทันหันหรือผิดปกติ ควรแจ้งบุคลากรทางการแพทย์'},
      {title: 'ความทุกข์ที่คงอยู่', text: 'หากความทุกข์ทางอารมณ์กินพื้นที่มากหรือทำให้ชีวิตประจำวันยากลำบาก สิ่งสำคัญคือพูดถึงและขอการสนับสนุน'},
      {title: 'ความกังวลมาก', text: 'หากสงสัยเรื่องการฟื้นตัวของคุณ การขอคำแนะนำช่วยให้คุณได้คำแนะนำที่เหมาะกับสถานการณ์'},
    ],
    section9Body: 'การนัดตรวจติดตามเป็นโอกาสพูดคุยเรื่องการฟื้นตัว อาการ การกลับมาทำกิจกรรม และคำถามที่เหลือ การเตรียมคำถามไม่กี่ข้อไว้ล่วงหน้าช่วยให้ไม่ลืมสิ่งใด',
    questionTitle: 'คำถามที่คุณเตรียมได้',
    questions: [
      'การฟื้นตัวของฉันดำเนินไปตามที่คาดสำหรับสถานการณ์ของฉันหรือไม่?',
      'ฉันค่อย ๆ กลับมาทำกิจกรรมอะไรได้บ้าง?',
      'ฉันควรสังเกตอาการอะไร?',
      'เมื่อไรที่ฉันพิจารณากลับมาออกกำลังกายที่หนักขึ้นได้?',
      'ฉันต้องการคำแนะนำหรือการฟื้นฟูเฉพาะหรือไม่?',
    ],
    summaryItems: [
      'การฟื้นตัวหลังคลอดเป็นไปทีละน้อยและต่างกันในแต่ละคน',
      'การพักผ่อนและการสนับสนุนเป็นส่วนหนึ่งของการฟื้นตัวได้',
      'การเปลี่ยนแปลงทางกาย การนอน และอารมณ์ อาจเปลี่ยนไปตามสัปดาห์',
      'การค่อย ๆ กลับมาทำกิจกรรมช่วยให้เคารพพลังงานและความสบายของคุณมากขึ้น',
      'หากสังเกตเห็นอาการที่ผิดปกติ คงอยู่ หรือน่ากังวล การขอคำแนะนำเป็นก้าวที่ดี',
    ],
    finalTipTitle: 'ใช้เวลาที่คุณต้องการ',
    finalTipText: 'การฟื้นตัวไม่ใช่การแข่งขัน การก้าวไปทีละน้อย เคารพความต้องการของคุณ และขอการสนับสนุนเมื่อจำเป็น ล้วนเป็นก้าวสำคัญแล้ว',
    disclaimerText: 'บทความนี้เพื่อให้ข้อมูลเท่านั้น และไม่ได้ทดแทนคำแนะนำทางการแพทย์เฉพาะบุคคล หากคุณมีอาการที่สำคัญ คงอยู่ หรือน่ากังวล โปรดติดต่อบุคลากรทางการแพทย์',
    shareMessage: 'การฟื้นตัวหลังคลอด — AWA',
  },
  vi: {
    badge: 'SAU SINH • HỒI PHỤC',
    title: 'Hồi phục\nsau khi sinh',
    metaDuration: '10 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Cơ thể bạn cần thời gian: điều gì là bình thường sau khi sinh.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Hiểu về giai đoạn sau sinh',
      'Những ngày đầu: chậm lại và hồi phục',
      'Điều gì có thể là bình thường trong quá trình hồi phục',
      'Chăm sóc bản thân mỗi ngày',
      'Vận động và tiếp tục hoạt động dần dần',
      'Giấc ngủ, mệt mỏi và thói quen mới',
      'Cảm xúc sau khi sinh',
      'Khi nào nên tìm lời khuyên',
      'Kiểm tra cùng nhân viên y tế',
      'Điều cần nhớ',
    ],
    headings: [
      'Hiểu về giai đoạn sau sinh',
      'Những ngày đầu: chậm lại và hồi phục',
      'Điều gì có thể là bình thường trong quá trình hồi phục',
      'Chăm sóc bản thân mỗi ngày',
      'Vận động và tiếp tục hoạt động dần dần',
      'Giấc ngủ, mệt mỏi và thói quen mới',
      'Cảm xúc sau khi sinh',
      'Khi nào nên tìm lời khuyên?',
      'Kiểm tra cùng nhân viên y tế',
      'Điều cần nhớ',
    ],
    section1Body1: 'Giai đoạn sau sinh nối tiếp cuộc sinh. Nó không chỉ giới hạn trong vài ngày: cơ thể, nhịp sinh hoạt hằng ngày và cảm xúc có thể tiếp tục thay đổi dần dần trong những tuần tiếp theo.',
    section1Body2: '“Quarantaine” là một cách nói truyền thống thường dùng để mô tả những tuần hồi phục đầu tiên. Nó có thể là một lời nhắc nhở tốt: sau thai kỳ và sinh nở, đáng để chậm lại và cho cơ thể thời gian.',
    highlight1Title: 'Một sự hồi phục toàn diện',
    highlight1Text: 'Sự hồi phục liên quan đến cơ thể, nhưng cũng cả giấc ngủ, năng lượng, cách tổ chức cuộc sống hằng ngày và sự thích nghi về cảm xúc với một giai đoạn mới của cuộc đời.',
    section2Body: 'Những ngày đầu có thể rất dồn dập. Nghỉ ngơi, chăm sóc cơ bản và thích nghi với nhịp sống mới thường là những ưu tiên. Không cần phải lấy lại ngay mức năng lượng thông thường.',
    recoveryPillars: [
      {title: 'Nghỉ ngơi', text: 'Xen kẽ hoạt động và nghỉ ngơi giúp cơ thể hồi phục dần dần.'},
      {title: 'Dinh dưỡng', text: 'Ăn uống đều đặn và uống nước theo nhu cầu hỗ trợ sự hồi phục mỗi ngày.'},
      {title: 'Sự hỗ trợ', text: 'Chấp nhận sự giúp đỡ giúp bạn tiết kiệm năng lượng cho việc chăm sóc thiết yếu và hồi phục.'},
      {title: 'Vận động nhẹ nhàng', text: 'Dần dần tiếp tục các động tác và hoạt động, tôn trọng tình trạng và sự thoải mái của bạn.'},
    ],
    section3Body1: 'Mỗi quá trình hồi phục đều khác nhau. Một số thay đổi có thể là một phần của giai đoạn thích nghi và diễn tiến dần dần:',
    normalSigns: [
      'Mệt mỏi đáng kể',
      'Ra máu giảm dần',
      'Dao động nội tiết và cảm xúc',
    ],
    section3Body2: 'Cường độ và thời gian của các triệu chứng có thể khác nhau giữa từng người. Điều quan trọng là theo dõi chúng diễn tiến ra sao và tìm lời khuyên nếu một thay đổi có vẻ đáng lo hoặc bất thường.',
    section4Body: 'Trong giai đoạn sau sinh, những thói quen nhỏ, thực tế thường hữu ích hơn một thói quen đòi hỏi cao. Mục tiêu là hỗ trợ sự hồi phục mà không tạo thêm áp lực.',
    selfCareTips: [
      'Lên kế hoạch cho những khoảnh khắc nghỉ ngơi thực sự bất cứ khi nào có thể.',
      'Nhờ giúp đỡ các công việc hằng ngày và bữa ăn.',
      'Uống nước đều đặn và duy trì chế độ ăn đa dạng.',
      'Tránh so sánh quá trình hồi phục của bạn với bất kỳ ai khác.',
      'Tiếp tục các hoạt động dần dần, không cố làm tất cả ngay lập tức.',
    ],
    tip1Title: 'Nên biết',
    tip1Text: 'Có người hỗ trợ xung quanh và chấp nhận sự giúp đỡ không phải là điều xa xỉ. Nó có thể giúp giữ gìn năng lượng và khiến quá trình hồi phục diễn ra từ từ hơn.',
    section5Body1: 'Việc tiếp tục các hoạt động có thể diễn ra từng bước, dựa trên sự thoải mái, năng lượng và các khuyến nghị nhận được sau khi sinh. Những động tác nhẹ nhàng và hoạt động hằng ngày đã được tính là sự trở lại vận động.',
    section5Body2: 'Với các hoạt động cường độ cao hơn, tốt nhất nên tiến triển mà không bỏ qua các bước và cân nhắc mọi triệu chứng hay khó chịu.',
    alertTitle: 'Hãy lắng nghe các tín hiệu của cơ thể',
    alertText: 'Khó chịu tăng lên trong khi hoạt động là lý do để chậm lại và, nếu cần, tìm lời khuyên phù hợp trước khi tiếp tục hoặc tăng cường độ.',
    section6Body: 'Giấc ngủ có thể trở nên không đều sau khi sinh. Mệt mỏi tích lũy có thể ảnh hưởng đến năng lượng, sự tập trung và tâm trạng. Khi có thể, đơn giản hóa một số việc và chia sẻ trách nhiệm có thể giúp ích.',
    milestones: [
      ['Những ngày đầu', 'Nghỉ ngơi, thích nghi và chăm sóc thiết yếu.'],
      ['Những tuần đầu', 'Hồi phục dần dần và bắt đầu những thói quen mới.'],
      ['Sau lần khám hậu sản', 'Xem lại tiến trình hồi phục và trao đổi về việc tiếp tục hoạt động dần dần.'],
    ],
    section7Body1: 'Giai đoạn sau sinh có thể mang lại nhiều cảm xúc: niềm vui, lo lắng, mệt mỏi, nhạy cảm hoặc cảm giác choáng ngợp. Những cảm xúc này có thể thay đổi nhanh, đặc biệt trong thời điểm giấc ngủ và thói quen hằng ngày đang thay đổi.',
    section7Body2: 'Nói chuyện với người bạn tin tưởng hoặc với một chuyên gia có thể giúp ích khi cảm xúc trở nên khó kiểm soát hoặc chiếm nhiều chỗ trong cuộc sống hằng ngày.',
    highlight2Title: 'Nhờ sự hỗ trợ là điều bình thường',
    highlight2Text: 'Không cần chờ đến khi bạn hoàn toàn kiệt sức hoặc choáng ngợp mới nói về cảm nhận của mình và tìm sự hỗ trợ.',
    section8Body: 'Một số tình huống đáng được trao đổi với nhân viên y tế, đặc biệt khi chúng nặng thêm, kéo dài hoặc gây lo lắng đáng kể.',
    consultationSigns: [
      {title: 'Triệu chứng nặng thêm', text: 'Cơn đau hoặc khó chịu tăng lên thay vì cải thiện đáng được tìm lời khuyên chuyên môn.'},
      {title: 'Ra máu bất thường', text: 'Việc ra máu đột ngột nhiều hơn hoặc bất thường nên được báo với nhân viên y tế.'},
      {title: 'Nỗi đau khổ kéo dài', text: 'Nếu nỗi đau khổ về mặt cảm xúc chiếm nhiều chỗ hoặc khiến cuộc sống hằng ngày khó khăn, điều quan trọng là nói về nó và nhờ sự hỗ trợ.'},
      {title: 'Lo lắng đáng kể', text: 'Nếu nghi ngờ về quá trình hồi phục, việc hỏi lời khuyên giúp bạn nhận được các khuyến nghị phù hợp với tình huống của mình.'},
    ],
    section9Body: 'Các buổi hẹn theo dõi là cơ hội để trao đổi về sự hồi phục, triệu chứng, việc tiếp tục các hoạt động và mọi thắc mắc còn lại. Chuẩn bị trước vài câu hỏi có thể giúp đảm bảo không quên điều gì.',
    questionTitle: 'Những câu hỏi bạn có thể chuẩn bị',
    questions: [
      'Quá trình hồi phục của tôi có diễn ra như dự kiến với tình huống của tôi không?',
      'Tôi có thể dần tiếp tục những hoạt động nào?',
      'Tôi nên để ý những triệu chứng nào?',
      'Khi nào tôi có thể cân nhắc quay lại tập luyện với cường độ cao hơn?',
      'Tôi có cần lời khuyên hoặc phục hồi chức năng cụ thể nào không?',
    ],
    summaryItems: [
      'Sự hồi phục sau khi sinh diễn ra dần dần và khác nhau ở mỗi người.',
      'Nghỉ ngơi và sự hỗ trợ có thể là một phần không thể tách rời của quá trình hồi phục.',
      'Thay đổi thể chất, giấc ngủ và cảm xúc có thể thay đổi qua nhiều tuần.',
      'Tiếp tục các hoạt động dần dần giúp bạn tôn trọng năng lượng và sự thoải mái của mình tốt hơn.',
      'Nếu bạn nhận thấy một triệu chứng bất thường, kéo dài hoặc đáng lo, tìm lời khuyên là một bước tốt.',
    ],
    finalTipTitle: 'Hãy dành thời gian bạn cần',
    finalTipText: 'Hồi phục không phải là một cuộc đua. Tiến bước dần dần, tôn trọng nhu cầu của bạn và nhờ sự hỗ trợ khi cần thiết đã là những bước quan trọng.',
    disclaimerText: 'Bài viết này chỉ để cung cấp thông tin và không thay thế lời khuyên y khoa cá nhân hóa. Nếu bạn có triệu chứng đáng kể, kéo dài hoặc đáng lo, hãy liên hệ nhân viên y tế.',
    shareMessage: 'Hồi phục sau khi sinh — AWA',
  },
  uz: {
    badge: 'TUGʻRUQDAN KEYIN • TIKLANISH',
    title: 'Tugʻruqdan keyingi\ntiklanish',
    metaDuration: '10 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Tanangizga vaqt kerak: tugʻruqdan keyin nima normal.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Tugʻruqdan keyingi davrni tushunish',
      'Dastlabki kunlar: sekinlashish va tiklanish',
      'Tiklanish paytida nima normal boʻlishi mumkin',
      'Kundalik hayotda oʻzingizga gʻamxoʻrlik qilish',
      'Harakat qilish va faoliyatni asta-sekin qayta boshlash',
      'Uyqu, charchoq va yangi tartib',
      'Tugʻruqdan keyingi hissiyotlar',
      'Qachon maslahat olish kerak',
      'Sogʻliqni saqlash mutaxassisi bilan tekshiruv',
      'Esda tutish kerak boʻlgan narsalar',
    ],
    headings: [
      'Tugʻruqdan keyingi davrni tushunish',
      'Dastlabki kunlar: sekinlashish va tiklanish',
      'Tiklanish paytida nima normal boʻlishi mumkin',
      'Kundalik hayotda oʻzingizga gʻamxoʻrlik qilish',
      'Harakat qilish va faoliyatni asta-sekin qayta boshlash',
      'Uyqu, charchoq va yangi tartib',
      'Tugʻruqdan keyingi hissiyotlar',
      'Qachon maslahat olish kerak?',
      'Sogʻliqni saqlash mutaxassisi bilan tekshiruv',
      'Esda tutish kerak boʻlgan narsalar',
    ],
    section1Body1: 'Tugʻruqdan keyingi davr tugʻruqdan soʻng boshlanadi. U bir necha kun bilan cheklanmaydi: tana, kundalik ritm va hissiyotlar keyingi haftalarda ham asta-sekin oʻzgarishda davom etishi mumkin.',
    section1Body2: '“Chilla” — tiklanishning dastlabki haftalarini tasvirlash uchun koʻpincha ishlatiladigan anʼanaviy ibora. U yaxshi eslatma boʻlishi mumkin: homiladorlik va tugʻruqdan keyin sekinlashib, tanaga vaqt berish maqsadga muvofiq.',
    highlight1Title: 'Butun tananing tiklanishi',
    highlight1Text: 'Tiklanish tanaga, shuningdek, uyquga, energiyaga, kundalik tashkil etishga va hayotning yangi bosqichiga hissiy moslashuvga tegishli.',
    section2Body: 'Dastlabki kunlar zich boʻlishi mumkin. Dam olish, asosiy parvarish va yangi ritmga moslashish koʻpincha ustuvor vazifalar. Odatiy energiya darajangizni darhol qaytarish shart emas.',
    recoveryPillars: [
      {title: 'Dam olish', text: 'Faollik va damni almashtirish tananing asta-sekin tiklanishiga yordam beradi.'},
      {title: 'Ovqatlanish', text: 'Muntazam ovqatlanish va ehtiyojga qarab ichish kundalik tiklanishni qoʻllab-quvvatlaydi.'},
      {title: 'Qoʻllab-quvvatlash', text: 'Yordamni qabul qilish muhim parvarish va tiklanish uchun energiyani tejash imkonini beradi.'},
      {title: 'Muloyim harakat', text: 'Holatingiz va qulayligingizni hurmat qilgan holda harakat va faoliyatni asta-sekin qayta boshlang.'},
    ],
    section3Body1: 'Har bir tiklanish boshqacha. Baʼzi oʻzgarishlar moslashuv davrining bir qismi boʻlishi va asta-sekin oʻzgarishi mumkin:',
    normalSigns: [
      'Sezilarli charchoq',
      'Asta-sekin kamayadigan qon ketishi',
      'Gormonal va hissiy tebranishlar',
    ],
    section3Body2: 'Alomatlarning kuchi va davomiyligi odamdan odamga farq qilishi mumkin. Muhimi — ularning qanday oʻzgarishini kuzatish va agar oʻzgarish xavotirli yoki odatdan tashqari tuyulsa, maslahat olish.',
    section4Body: 'Tugʻruqdan keyingi davrda kichik, real odatlar koʻpincha qiyin tartibdan koʻra foydaliroq. Maqsad — bosim qoʻshmasdan tiklanishni qoʻllab-quvvatlash.',
    selfCareTips: [
      'Iloji boricha haqiqiy dam olish lahzalarini rejalashtiring.',
      'Kundalik ishlar va ovqat tayyorlashda yordam soʻrang.',
      'Muntazam ichib turing va xilma-xil ovqatlaning.',
      'Tiklanishingizni boshqalarnikiga solishtirishdan saqlaning.',
      'Faoliyatni asta-sekin qayta boshlang, hammasini darhol qilishga urinmasdan.',
    ],
    tip1Title: 'Bilish foydali',
    tip1Text: 'Atrofingizni qoʻllab-quvvatlovchi odamlar bilan oʻrash va yordamni qabul qilish hashamat emas. Bu energiyani saqlashga va tiklanishni bosqichma-bosqich qilishga yordam beradi.',
    section5Body1: 'Faoliyatni qayta boshlash qulaylikka, energiyaga va tugʻruqdan keyin olingan tavsiyalarga qarab bosqichma-bosqich boʻlishi mumkin. Muloyim harakatlar va kundalik faoliyat allaqachon harakatga qaytish hisoblanadi.',
    section5Body2: 'Intensivroq faoliyat uchun bosqichlarni oʻtkazib yubormasdan oldinga siljish va har qanday alomat yoki noqulaylikni hisobga olish maʼqul.',
    alertTitle: 'Tanangiz signallarini tinglang',
    alertText: 'Faoliyat paytida kuchayib boruvchi noqulaylik sekinlashish va, kerak boʻlsa, davom ettirish yoki shiddatni oshirishdan oldin mos maslahat olish uchun sabab.',
    section6Body: 'Tugʻruqdan keyin uyqu notekis boʻlishi mumkin. Toʻplangan charchoq energiyaga, eʼtiborga va kayfiyatga taʼsir qilishi mumkin. Iloji boricha baʼzi ishlarni soddalashtirish va majburiyatlarni boʻlishish yordam beradi.',
    milestones: [
      ['Dastlabki kunlar', 'Dam olish, moslashuv va asosiy parvarish.'],
      ['Dastlabki haftalar', 'Asta-sekin tiklanish va yangi tartiblarning boshlanishi.'],
      ['Tugʻruqdan keyingi tekshiruvdan soʻng', 'Tiklanish jarayonini koʻrib chiqish va faoliyatni asta-sekin qayta boshlashni muhokama qilish.'],
    ],
    section7Body1: 'Tugʻruqdan keyingi davr koʻp hissiyotlarni olib kelishi mumkin: quvonch, xavotir, charchoq, sezgirlik yoki ogʻirlik hissi. Bu his-tuygʻular, ayniqsa uyqu va kundalik odatlar oʻzgarayotgan paytda, tez almashishi mumkin.',
    section7Body2: 'Ishongan kishingiz yoki mutaxassis bilan gaplashish hissiyotlarni boshqarish qiyinlashganda yoki kundalik hayotda koʻp joy egallaganda yordam berishi mumkin.',
    highlight2Title: 'Yordam soʻrash normal',
    highlight2Text: 'Qanday his qilayotganingiz haqida gapirish va yordam soʻrash uchun butunlay holdan toyguncha yoki qiynalguncha kutish shart emas.',
    section8Body: 'Baʼzi vaziyatlarni sogʻliqni saqlash mutaxassisi bilan muhokama qilishga arziydi, ayniqsa ular yomonlashsa, saqlanib qolsa yoki jiddiy xavotir tugʻdirsa.',
    consultationSigns: [
      {title: 'Yomonlashayotgan alomatlar', text: 'Yaxshilanish oʻrniga kuchayib borayotgan ogʻriq yoki noqulaylik mutaxassis maslahatiga arziydi.'},
      {title: 'Odatdan tashqari qon ketishi', text: 'Birdan koʻpayadigan yoki odatdan tashqari qon ketishi haqida sogʻliqni saqlash mutaxassisiga xabar berish kerak.'},
      {title: 'Doimiy iztirob', text: 'Agar hissiy iztirob koʻp joy egallasa yoki kundalik hayotni qiyinlashtirsa, bu haqda gaplashish va yordam soʻrash muhim.'},
      {title: 'Jiddiy xavotir', text: 'Tiklanishingizga shubha boʻlsa, maslahat soʻrash vaziyatingizga mos tavsiyalarni olishga yordam beradi.'},
    ],
    section9Body: 'Nazorat qabullari tiklanish, alomatlar, faoliyatni qayta boshlash va qolgan savollar haqida gaplashish imkoniyati. Oldindan bir nechta savol tayyorlash hech narsa unutilmasligiga yordam beradi.',
    questionTitle: 'Tayyorlashingiz mumkin boʻlgan savollar',
    questions: [
      'Mening tiklanishim vaziyatim uchun kutilganidek ketayaptimi?',
      'Qaysi faoliyatni asta-sekin qayta boshlashim mumkin?',
      'Qaysi alomatlarga eʼtibor berishim kerak?',
      'Mashqlarga intensivroq qaytishni qachon oʻylab koʻrsam boʻladi?',
      'Menga alohida maslahat yoki tiklanish kerakmi?',
    ],
    summaryItems: [
      'Tugʻruqdan keyingi tiklanish bosqichma-bosqich va har kimda boshqacha.',
      'Dam olish va qoʻllab-quvvatlash tiklanishning ajralmas qismi boʻlishi mumkin.',
      'Jismoniy oʻzgarishlar, uyqu va hissiyotlar haftalar davomida oʻzgarishi mumkin.',
      'Faoliyatni asta-sekin qayta boshlash energiya va qulayligingizni yaxshiroq hurmat qilishga yordam beradi.',
      'Agar odatdan tashqari, doimiy yoki xavotirli alomatni sezsangiz, maslahat soʻrash yaxshi qadam.',
    ],
    finalTipTitle: 'Kerakli vaqtni oling',
    finalTipText: 'Tiklanish poyga emas. Asta-sekin oldinga siljish, ehtiyojlaringizni hurmat qilish va zarur boʻlganda yordam soʻrash allaqachon muhim qadamlar.',
    disclaimerText: 'Bu maqola faqat maʼlumot uchun va shaxsiy tibbiy maslahatni almashtirmaydi. Agar sezilarli, doimiy yoki xavotirli alomat sezsangiz, sogʻliqni saqlash mutaxassisiga murojaat qiling.',
    shareMessage: 'Tugʻruqdan keyingi tiklanish — AWA',
  },
  az: {
    badge: 'DOĞUŞDAN SONRA • BƏRPA',
    title: 'Doğuşdan sonra\nbərpa',
    metaDuration: '10 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Bədəninizin vaxta ehtiyacı var: doğuşdan sonra nə normaldır.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Doğuşdan sonrakı dövrü anlamaq',
      'İlk günlər: yavaşlamaq və bərpa olunmaq',
      'Bərpa zamanı nə normal ola bilər',
      'Gündəlik həyatda özünüzə qulluq etmək',
      'Hərəkət etmək və fəaliyyətlərə tədricən qayıtmaq',
      'Yuxu, yorğunluq və yeni rutinlər',
      'Doğuşdan sonra emosiyalar',
      'Nə vaxt məsləhət almaq lazımdır',
      'Tibb işçisi ilə yoxlama',
      'Yadda saxlamalı məqamlar',
    ],
    headings: [
      'Doğuşdan sonrakı dövrü anlamaq',
      'İlk günlər: yavaşlamaq və bərpa olunmaq',
      'Bərpa zamanı nə normal ola bilər',
      'Gündəlik həyatda özünüzə qulluq etmək',
      'Hərəkət etmək və fəaliyyətlərə tədricən qayıtmaq',
      'Yuxu, yorğunluq və yeni rutinlər',
      'Doğuşdan sonra emosiyalar',
      'Nə vaxt məsləhət almaq lazımdır?',
      'Tibb işçisi ilə yoxlama',
      'Yadda saxlamalı məqamlar',
    ],
    section1Body1: 'Doğuşdan sonrakı dövr doğuşdan sonra gəlir. O, bir neçə gün ilə məhdudlaşmır: bədən, gündəlik ritm və emosiyalar sonrakı həftələr ərzində tədricən dəyişməyə davam edə bilər.',
    section1Body2: '“Qırx gün” bərpanın ilk həftələrini təsvir etmək üçün çox vaxt istifadə edilən ənənəvi ifadədir. O, yaxşı xatırlatma ola bilər: hamiləlikdən və doğuşdan sonra yavaşlamağa və bədənə vaxt verməyə dəyər.',
    highlight1Title: 'Bütün bədənin bərpası',
    highlight1Text: 'Bərpa bədənə, eləcə də yuxuya, enerjiyə, gündəlik təşkilata və həyatın yeni mərhələsinə emosional uyğunlaşmaya aiddir.',
    section2Body: 'İlk günlər gərgin ola bilər. İstirahət, əsas qayğı və yeni ritmə uyğunlaşma çox vaxt prioritetlərdir. Adi enerji səviyyənizi dərhal bərpa etməyə ehtiyac yoxdur.',
    recoveryPillars: [
      {title: 'İstirahət', text: 'Fəaliyyət və istirahəti növbələşdirmək bədənin tədricən bərpa olunmasına kömək edir.'},
      {title: 'Qidalanma', text: 'Müntəzəm yemək və ehtiyaclara görə içmək gündəlik bərpanı dəstəkləyir.'},
      {title: 'Dəstək', text: 'Köməyi qəbul etmək əsas qayğı və bərpa üçün enerji qənaət etməyə imkan verir.'},
      {title: 'Mülayim hərəkət', text: 'Vəziyyətinizə və rahatlığınıza hörmət edərək hərəkətlərə və fəaliyyətlərə tədricən qayıdın.'},
    ],
    section3Body1: 'Hər bərpa fərqlidir. Bəzi dəyişikliklər uyğunlaşma dövrünün bir hissəsi ola və tədricən inkişaf edə bilər:',
    normalSigns: [
      'Əhəmiyyətli yorğunluq',
      'Tədricən azalan qanaxma',
      'Hormonal və emosional dalğalanmalar',
    ],
    section3Body2: 'Simptomların intensivliyi və müddəti şəxsdən şəxsə dəyişə bilər. Vacib olan onların necə inkişaf etdiyini izləmək və dəyişiklik narahatedici və ya qeyri-adi görünürsə, məsləhət almaqdır.',
    section4Body: 'Doğuşdan sonrakı dövrdə kiçik, real vərdişlər çox vaxt tələbkar rejimdən daha faydalıdır. Məqsəd əlavə təzyiq yaratmadan bərpanı dəstəkləməkdir.',
    selfCareTips: [
      'Mümkün olduqda real istirahət anları planlaşdırın.',
      'Gündəlik işlərdə və yeməklərdə kömək istəyin.',
      'Müntəzəm için və müxtəlif qidalanmanı saxlayın.',
      'Bərpanızı başqasınınkı ilə müqayisə etməkdən çəkinin.',
      'Hər şeyi dərhal etməyə çalışmadan fəaliyyətləri tədricən bərpa edin.',
    ],
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Ətrafınıza dəstək yığmaq və köməyi qəbul etmək lüks deyil. O, enerjini qorumağa və bərpanı daha tədrici etməyə kömək edə bilər.',
    section5Body1: 'Fəaliyyətlərin bərpası rahatlığa, enerjiyə və doğuşdan sonra alınan tövsiyələrə əsasən addım-addım baş verə bilər. Mülayim hərəkətlər və gündəlik fəaliyyətlər artıq hərəkətə qayıdış sayılır.',
    section5Body2: 'Daha intensiv fəaliyyətlər üçün mərhələləri atlamadan irəliləmək və hər hansı simptomları və ya narahatlığı nəzərə almaq daha yaxşıdır.',
    alertTitle: 'Bədəninizin siqnallarını dinləyin',
    alertText: 'Fəaliyyət zamanı artan narahatlıq yavaşlamaq və lazım gələrsə, davam etməzdən və ya intensivliyi artırmazdan əvvəl uyğun məsləhət almaq üçün səbəbdir.',
    section6Body: 'Yuxu doğuşdan sonra qeyri-müntəzəm ola bilər. Yığılmış yorğunluq enerjiyə, konsentrasiyaya və əhvala təsir edə bilər. Mümkün olduqda bəzi işləri sadələşdirmək və məsuliyyətləri bölüşmək kömək edə bilər.',
    milestones: [
      ['İlk günlər', 'İstirahət, uyğunlaşma və əsas qayğı.'],
      ['İlk həftələr', 'Tədricən bərpa və yeni rutinlərin başlanğıcı.'],
      ['Doğuşdan sonrakı müayinədən sonra', 'Bərpanın gedişini nəzərdən keçirin və fəaliyyətlərin tədricən bərpasını müzakirə edin.'],
    ],
    section7Body1: 'Doğuşdan sonrakı dövr çoxlu emosiya gətirə bilər: sevinc, narahatlıq, yorğunluq, həssaslıq və ya bunaldılma hissi. Bu hisslər, xüsusilə yuxu və gündəlik vərdişlər dəyişən dövrdə tez dəyişə bilər.',
    section7Body2: 'Etibar etdiyiniz biri və ya mütəxəssislə danışmaq emosiyaları idarə etmək çətinləşdikdə və ya gündəlik həyatda çox yer tutduqda kömək edə bilər.',
    highlight2Title: 'Dəstək istəmək normaldır',
    highlight2Text: 'Özünüzü necə hiss etdiyiniz barədə danışmaq və dəstək axtarmaq üçün tam tükənməyi və ya bunalmağı gözləməyə ehtiyac yoxdur.',
    section8Body: 'Bəzi vəziyyətləri, xüsusilə pisləşdikdə, davam etdikdə və ya əhəmiyyətli narahatlıq yaratdıqda, tibb işçisi ilə müzakirə etməyə dəyər.',
    consultationSigns: [
      {title: 'Pisləşən simptomlar', text: 'Yaxşılaşmaq əvəzinə artan ağrı və ya narahatlıq mütəxəssis məsləhətinə layiqdir.'},
      {title: 'Qeyri-adi qanaxma', text: 'Qəfildən bollaşan və ya qeyri-adi qanaxma tibb işçisinə bildirilməlidir.'},
      {title: 'Davamlı sıxıntı', text: 'Emosional sıxıntı çox yer tutarsa və ya gündəlik həyatı çətinləşdirərsə, bu barədə danışmaq və dəstək istəmək vacibdir.'},
      {title: 'Əhəmiyyətli narahatlıq', text: 'Bərpanızla bağlı şübhə olarsa, məsləhət istəmək vəziyyətinizə uyğun tövsiyələr almağa kömək edir.'},
    ],
    section9Body: 'Nəzarət qəbulları bərpa, simptomlar, fəaliyyətlərin bərpası və qalan suallar barədə danışmaq üçün fürsətdir. Əvvəlcədən bir neçə sual hazırlamaq heç nəyin unudulmamasını təmin etməyə kömək edə bilər.',
    questionTitle: 'Hazırlaya biləcəyiniz suallar',
    questions: [
      'Bərpam vəziyyətim üçün gözlənildiyi kimi gedirmi?',
      'Hansı fəaliyyətləri tədricən bərpa edə bilərəm?',
      'Hansı simptomlara diqqət etməliyəm?',
      'İdmana daha intensiv qayıtmağı nə vaxt düşünə bilərəm?',
      'Mənə xüsusi məsləhət və ya reabilitasiya lazımdırmı?',
    ],
    summaryItems: [
      'Doğuşdan sonrakı bərpa tədricidir və hər kəs üçün fərqlidir.',
      'İstirahət və dəstək bərpanın ayrılmaz hissəsi ola bilər.',
      'Fiziki dəyişikliklər, yuxu və emosiyalar həftələr ərzində dəyişə bilər.',
      'Fəaliyyətləri tədricən bərpa etmək enerjinizə və rahatlığınıza daha yaxşı hörmət etməyə kömək edir.',
      'Qeyri-adi, davamlı və ya narahatedici simptom görsəniz, məsləhət almaq yaxşı addımdır.',
    ],
    finalTipTitle: 'Lazım olan vaxtı ayırın',
    finalTipText: 'Bərpa yarış deyil. Tədricən irəliləmək, ehtiyaclarınıza hörmət etmək və lazım olduqda dəstək istəmək artıq vacib addımlardır.',
    disclaimerText: 'Bu məqalə yalnız məlumat məqsədilə təqdim olunur və fərdi tibbi məsləhəti əvəz etmir. Əhəmiyyətli, davamlı və ya narahatedici simptom yaşayırsınızsa, tibb işçisi ilə əlaqə saxlayın.',
    shareMessage: 'Doğuşdan sonra bərpa — AWA',
  },
  ka: {
    badge: 'მშობიარობის შემდგომი პერიოდი • გამოჯანმრთელება',
    title: 'გამოჯანმრთელება\nმშობიარობის შემდეგ',
    metaDuration: '10 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'თქვენს სხეულს დრო სჭირდება: რა არის ნორმალური მშობიარობის შემდეგ.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'მშობიარობის შემდგომი პერიოდის გაგება',
      'პირველი დღეები: შენელება და გამოჯანმრთელება',
      'რა შეიძლება იყოს ნორმალური გამოჯანმრთელებისას',
      'საკუთარ თავზე ზრუნვა ყოველდღიურად',
      'მოძრაობა და აქტივობების ეტაპობრივი განახლება',
      'ძილი, დაღლილობა და ახალი რუტინები',
      'ემოციები მშობიარობის შემდეგ',
      'როდის ვითხოვოთ რჩევა',
      'ჯანდაცვის სპეციალისტთან შემოწმება',
      'რა უნდა დაიმახსოვროთ',
    ],
    headings: [
      'მშობიარობის შემდგომი პერიოდის გაგება',
      'პირველი დღეები: შენელება და გამოჯანმრთელება',
      'რა შეიძლება იყოს ნორმალური გამოჯანმრთელებისას',
      'საკუთარ თავზე ზრუნვა ყოველდღიურად',
      'მოძრაობა და აქტივობების ეტაპობრივი განახლება',
      'ძილი, დაღლილობა და ახალი რუტინები',
      'ემოციები მშობიარობის შემდეგ',
      'როდის უნდა ითხოვოთ რჩევა?',
      'ჯანდაცვის სპეციალისტთან შემოწმება',
      'რა უნდა დაიმახსოვროთ',
    ],
    section1Body1: 'მშობიარობის შემდგომი პერიოდი მშობიარობას მოსდევს. ის რამდენიმე დღით არ შემოიფარგლება: სხეული, ყოველდღიური რიტმი და ემოციები მომდევნო კვირებშიც ეტაპობრივად შეიძლება განაგრძობდეს ცვლილებას.',
    section1Body2: '„კარანტინი“ ტრადიციული გამოთქმაა, რომელიც ხშირად გამოჯანმრთელების პირველი კვირების აღსაწერად გამოიყენება. ის კარგ შეხსენებად გამოდგება: ორსულობისა და მშობიარობის შემდეგ ღირს შენელება და სხეულისთვის დროის მიცემა.',
    highlight1Title: 'მთელი სხეულის გამოჯანმრთელება',
    highlight1Text: 'გამოჯანმრთელება სხეულს ეხება, მაგრამ ასევე ძილს, ენერგიას, ყოველდღიურ ორგანიზაციას და ცხოვრების ახალ ეტაპთან ემოციურ ადაპტაციას.',
    section2Body: 'პირველი დღეები შეიძლება ინტენსიური იყოს. დასვენება, ძირითადი მოვლა და ახალ რიტმთან ადაპტაცია ხშირად პრიორიტეტებია. თქვენი ჩვეული ენერგიის დონის დაუყოვნებლივ დაბრუნება საჭირო არ არის.',
    recoveryPillars: [
      {title: 'დასვენება', text: 'აქტივობისა და დასვენების მონაცვლეობა სხეულს ეტაპობრივად გამოჯანმრთელებაში ეხმარება.'},
      {title: 'კვება', text: 'რეგულარულად ჭამა და საჭიროების მიხედვით სმა ყოველდღიურ გამოჯანმრთელებას უჭერს მხარს.'},
      {title: 'მხარდაჭერა', text: 'დახმარების მიღება საშუალებას იძლევა ენერგია არსებით მოვლასა და გამოჯანმრთელებას შევუნახოთ.'},
      {title: 'რბილი მოძრაობა', text: 'ეტაპობრივად განაახლეთ მოძრაობები და აქტივობები, თქვენი მდგომარეობისა და კომფორტის პატივისცემით.'},
    ],
    section3Body1: 'ყოველი გამოჯანმრთელება განსხვავებულია. ზოგი ცვლილება ადაპტაციის პერიოდის ნაწილი შეიძლება იყოს და ეტაპობრივად განვითარდეს:',
    normalSigns: [
      'მნიშვნელოვანი დაღლილობა',
      'სისხლდენა, რომელიც ეტაპობრივად მცირდება',
      'ჰორმონული და ემოციური ცვალებადობა',
    ],
    section3Body2: 'სიმპტომების ინტენსივობა და ხანგრძლივობა ადამიანიდან ადამიანამდე შეიძლება განსხვავდებოდეს. მთავარია დააკვირდეთ მათ ცვლილებას და ითხოვოთ რჩევა, თუ ცვლილება შემაშფოთებელი ან უჩვეულო ჩანს.',
    section4Body: 'მშობიარობის შემდგომ პერიოდში პატარა, რეალისტური ჩვევები ხშირად უფრო სასარგებლოა, ვიდრე მომთხოვნი რუტინა. მიზანია გამოჯანმრთელებას მხარდაჭერა ზეწოლის დამატების გარეშე.',
    selfCareTips: [
      'დაგეგმეთ რეალური დასვენების მომენტები, როცა კი შესაძლებელია.',
      'ითხოვეთ დახმარება ყოველდღიურ საქმეებსა და კვებაში.',
      'რეგულარულად ისვით და შეინარჩუნეთ მრავალფეროვანი კვება.',
      'ნუ შეადარებთ თქვენს გამოჯანმრთელებას სხვისას.',
      'აქტივობები ეტაპობრივად განაახლეთ, ყველაფრის დაუყოვნებლივ გაკეთების მცდელობის გარეშე.',
    ],
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'მხარდაჭერით გარემოცვა და დახმარების მიღება ფუფუნება არ არის. ეს ენერგიის შენახვაში გეხმარებათ და გამოჯანმრთელებას უფრო ეტაპობრივს ხდის.',
    section5Body1: 'აქტივობების განახლება ნაბიჯ-ნაბიჯ შეიძლება მოხდეს, კომფორტის, ენერგიისა და მშობიარობის შემდეგ მიღებული რეკომენდაციების მიხედვით. რბილი მოძრაობები და ყოველდღიური აქტივობები უკვე მოძრაობაზე დაბრუნებად ითვლება.',
    section5Body2: 'უფრო ინტენსიური აქტივობებისთვის უმჯობესია ეტაპების გამოტოვების გარეშე წინსვლა და ნებისმიერი სიმპტომის ან დისკომფორტის გათვალისწინება.',
    alertTitle: 'მოუსმინეთ თქვენი სხეულის სიგნალებს',
    alertText: 'დისკომფორტი, რომელიც აქტივობის დროს იზრდება, ტემპის შენელებისა და, საჭიროების შემთხვევაში, გაგრძელებამდე ან ინტენსივობის გაზრდამდე მორგებული რჩევის ძიების მიზეზია.',
    section6Body: 'ძილი მშობიარობის შემდეგ შეიძლება არარეგულარული გახდეს. დაგროვილმა დაღლილობამ შეიძლება ენერგიაზე, კონცენტრაციასა და ხასიათზე იმოქმედოს. შესაძლებლობის შემთხვევაში, ზოგი საქმის გამარტივება და პასუხისმგებლობების გაზიარება დაგეხმარებათ.',
    milestones: [
      ['პირველი დღეები', 'დასვენება, ადაპტაცია და არსებითი მოვლა.'],
      ['პირველი კვირები', 'ეტაპობრივი გამოჯანმრთელება და ახალი რუტინების დასაწყისი.'],
      ['მშობიარობის შემდგომი შემოწმების შემდეგ', 'გამოჯანმრთელების პროგრესის გადახედვა და აქტივობების ეტაპობრივი განახლების განხილვა.'],
    ],
    section7Body1: 'მშობიარობის შემდგომმა პერიოდმა შეიძლება მრავალი ემოცია მოიტანოს: სიხარული, შეშფოთება, დაღლილობა, მგრძნობელობა ან გადატვირთულობის განცდა. ეს გრძნობები შეიძლება სწრაფად შეიცვალოს, განსაკუთრებით დროს, როცა ძილი და ყოველდღიური ჩვევები იცვლება.',
    section7Body2: 'ადამიანთან, ვისაც ენდობით, ან პროფესიონალთან საუბარი შეიძლება დაგეხმაროთ, როცა ემოციების მართვა რთულდება ან ისინი ყოველდღიურ ცხოვრებაში დიდ ადგილს იკავებს.',
    highlight2Title: 'მხარდაჭერის თხოვნა ნორმალურია',
    highlight2Text: 'არ არის საჭირო დაელოდოთ სრულ გამოფიტვას ან გადატვირთულობას, რომ თქვენს თვითგრძნობაზე ისაუბროთ და მხარდაჭერა ითხოვოთ.',
    section8Body: 'ზოგი სიტუაცია ჯანდაცვის სპეციალისტთან განხილვას იმსახურებს, განსაკუთრებით როცა ისინი უარესდება, გრძელდება ან მნიშვნელოვან შეშფოთებას იწვევს.',
    consultationSigns: [
      {title: 'სიმპტომების გაუარესება', text: 'ტკივილი ან დისკომფორტი, რომელიც უმჯობესდება კი არა, იზრდება, პროფესიულ რჩევას იმსახურებს.'},
      {title: 'უჩვეულო სისხლდენა', text: 'სისხლდენა, რომელიც მოულოდნელად უფრო უხვი ან უჩვეულო ხდება, ჯანდაცვის სპეციალისტს უნდა შეატყობინოთ.'},
      {title: 'გაგრძელებული დისკომფორტი', text: 'თუ ემოციური დისკომფორტი დიდ ადგილს იკავებს ან ყოველდღიურ ცხოვრებას ართულებს, მნიშვნელოვანია ამის შესახებ ისაუბროთ და მხარდაჭერა ითხოვოთ.'},
      {title: 'მნიშვნელოვანი შეშფოთება', text: 'თუ თქვენს გამოჯანმრთელებაში ეჭვი გაქვთ, რჩევის თხოვნა გეხმარებათ თქვენს სიტუაციაზე მორგებული რეკომენდაციების მიღებაში.'},
    ],
    section9Body: 'შემდგომი ვიზიტები შესაძლებლობაა, ისაუბროთ გამოჯანმრთელებაზე, სიმპტომებზე, აქტივობების განახლებასა და დარჩენილ კითხვებზე. წინასწარ რამდენიმე კითხვის მომზადებამ შეიძლება უზრუნველყოს, რომ არაფერი დაგავიწყდეთ.',
    questionTitle: 'კითხვები, რომელთა მომზადებაც შეგიძლიათ',
    questions: [
      'ჩემი გამოჯანმრთელება ჩემს სიტუაციაში მოსალოდნელად მიმდინარეობს?',
      'რომელი აქტივობების ეტაპობრივად განახლება შემიძლია?',
      'რომელ სიმპტომებს უნდა დავაკვირდე?',
      'როდის შეიძლება განვიხილო ვარჯიშზე უფრო ინტენსიური დაბრუნება?',
      'მჭირდება რაიმე განსაკუთრებული რჩევა ან რეაბილიტაცია?',
    ],
    summaryItems: [
      'გამოჯანმრთელება მშობიარობის შემდეგ ეტაპობრივია და ყველასთვის განსხვავებული.',
      'დასვენება და მხარდაჭერა გამოჯანმრთელების განუყოფელი ნაწილი შეიძლება იყოს.',
      'ფიზიკური ცვლილებები, ძილი და ემოციები კვირების განმავლობაში შეიძლება განვითარდეს.',
      'აქტივობების ეტაპობრივი განახლება გეხმარებათ უკეთ დაიცვათ თქვენი ენერგია და კომფორტი.',
      'თუ უჩვეულო, გაგრძელებულ ან შემაშფოთებელ სიმპტომს შეამჩნევთ, რჩევის თხოვნა კარგი ნაბიჯია.',
    ],
    finalTipTitle: 'დაუთმეთ საჭირო დრო',
    finalTipText: 'გამოჯანმრთელება რბოლა არ არის. ეტაპობრივად წინსვლა, თქვენი საჭიროებების პატივისცემა და, საჭიროებისას, მხარდაჭერის თხოვნა უკვე მნიშვნელოვანი ნაბიჯებია.',
    disclaimerText: 'ეს სტატია მხოლოდ საინფორმაციოა და პერსონალიზებულ სამედიცინო რჩევას არ ანაცვლებს. თუ მნიშვნელოვან, გაგრძელებულ ან შემაშფოთებელ სიმპტომს განიცდით, დაუკავშირდით ჯანდაცვის სპეციალისტს.',
    shareMessage: 'გამოჯანმრთელება მშობიარობის შემდეგ — AWA',
  },
  hy: {
    badge: 'ՀԵՏԾՆՆԴՅԱՆ ՇՐՋԱՆ • ՎԵՐԱԿԱՆԳՆՈՒՄ',
    title: 'Վերականգնում\nծննդաբերությունից հետո',
    metaDuration: '10 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ձեր մարմինը ժամանակի կարիք ունի. ինչն է նորմալ ծննդաբերությունից հետո:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Հասկանալ հետծննդյան շրջանը',
      'Առաջին օրերը. դանդաղեցնել տեմպը և վերականգնվել',
      'Ինչը կարող է նորմալ լինել վերականգնման ընթացքում',
      'Հոգ տանել ձեր մասին օրեցօր',
      'Շարժվել և աստիճանաբար վերսկսել գործունեությունը',
      'Քուն, հոգնածություն և նոր ռեժիմներ',
      'Հույզեր ծննդաբերությունից հետո',
      'Երբ խորհուրդ հարցնել',
      'Այց առողջապահության մասնագետին',
      'Ինչ հիշել',
    ],
    headings: [
      'Հասկանալ հետծննդյան շրջանը',
      'Առաջին օրերը. դանդաղեցնել տեմպը և վերականգնվել',
      'Ինչը կարող է նորմալ լինել վերականգնման ընթացքում',
      'Հոգ տանել ձեր մասին օրեցօր',
      'Շարժվել և աստիճանաբար վերսկսել գործունեությունը',
      'Քուն, հոգնածություն և նոր ռեժիմներ',
      'Հույզեր ծննդաբերությունից հետո',
      'Ե՞րբ պետք է խորհուրդ հարցնել',
      'Այց առողջապահության մասնագետին',
      'Ինչ հիշել',
    ],
    section1Body1: 'Հետծննդյան շրջանը հաջորդում է ծննդաբերությանը: Այն չի սահմանափակվում մի քանի օրով. մարմինը, առօրյա ռիթմը և հույզերը կարող են շարունակել աստիճանաբար փոխվել հաջորդ շաբաթների ընթացքում:',
    section1Body2: '«Քառասունքը» ավանդական արտահայտություն է, որն հաճախ օգտագործվում է վերականգնման առաջին շաբաթները նկարագրելու համար: Այն կարող է լավ հիշեցում լինել. հղիությունից և ծննդաբերությունից հետո արժե դանդաղեցնել տեմպը և ժամանակ տալ մարմնին:',
    highlight1Title: 'Վերականգնում ամբողջ մարմնով',
    highlight1Text: 'Վերականգնումը վերաբերում է մարմնին, բայց նաև քնին, էներգիային, առօրյա կազմակերպմանը և կյանքի նոր փուլին հուզական հարմարվելուն:',
    section2Body: 'Առաջին օրերը կարող են լինել ինտենսիվ: Հանգիստը, հիմնական խնամքը և նոր ռիթմին հարմարվելը հաճախ առաջնահերթություններն են: Պետք չէ անմիջապես վերագտնել ձեր սովորական էներգիայի մակարդակը:',
    recoveryPillars: [
      {title: 'Հանգիստ', text: 'Ակտիվության և հանգստի հերթափոխումը օգնում է մարմնին աստիճանաբար վերականգնվել:'},
      {title: 'Սնունդ', text: 'Կանոնավոր սնվելը և կարիքներին համապատասխան խմելը աջակցում է առօրյա վերականգնմանը:'},
      {title: 'Աջակցություն', text: 'Օգնություն ընդունելը թույլ է տալիս խնայել էներգիան՝ էական խնամքի և վերականգնման համար:'},
      {title: 'Մեղմ շարժում', text: 'Աստիճանաբար վերսկսեք շարժումներն ու գործունեությունը՝ հարգելով ձեր վիճակը և հարմարավետությունը:'},
    ],
    section3Body1: 'Յուրաքանչյուր վերականգնում տարբեր է: Որոշ փոփոխություններ կարող են հարմարվողական շրջանի մաս լինել և աստիճանաբար զարգանալ.',
    normalSigns: [
      'Զգալի հոգնածություն',
      'Արյունահոսություն, որը աստիճանաբար նվազում է',
      'Հորմոնալ և հուզական տատանումներ',
    ],
    section3Body2: 'Ախտանիշների ինտենսիվությունը և տևողությունը կարող են տարբերվել մարդուց մարդ: Կարևորն այն է՝ հետևել, թե ինչպես են դրանք զարգանում, և խորհուրդ հարցնել, եթե փոփոխությունը թվում է անհանգստացնող կամ անսովոր:',
    section4Body: 'Հետծննդյան շրջանում փոքր, իրատեսական սովորությունները հաճախ ավելի օգտակար են, քան պահանջկոտ ռեժիմը: Նպատակը վերականգնմանը աջակցելն է՝ առանց ճնշում ավելացնելու:',
    selfCareTips: [
      'Հնարավորության դեպքում պլանավորեք իրական հանգստի պահեր:',
      'Օգնություն խնդրեք առօրյա գործերում և ճաշերում:',
      'Կանոնավոր խմեք և պահպանեք բազմազան սննդակարգ:',
      'Խուսափեք ձեր վերականգնումը ուրիշի հետ համեմատելուց:',
      'Աստիճանաբար վերսկսեք գործունեությունը՝ առանց ամեն ինչ անմիջապես անելու փորձի:',
    ],
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Աջակցությամբ շրջապատվելը և օգնություն ընդունելը շքեղություն չէ: Այն կարող է օգնել պահպանել էներգիան և վերականգնումը դարձնել ավելի աստիճանական:',
    section5Body1: 'Գործունեության վերսկսումը կարող է տեղի ունենալ քայլ առ քայլ՝ ըստ հարմարավետության, էներգիայի և ծննդաբերությունից հետո ստացած խորհուրդների: Մեղմ շարժումները և առօրյա գործունեությունը արդեն հաշվվում են որպես շարժմանը վերադարձ:',
    section5Body2: 'Ավելի ինտենսիվ գործունեության համար ավելի լավ է առաջ գնալ՝ առանց փուլեր բաց թողնելու և հաշվի առնելով ցանկացած ախտանիշ կամ անհարմարություն:',
    alertTitle: 'Լսեք ձեր մարմնի ազդանշանները',
    alertText: 'Գործունեության ընթացքում մեծացող անհարմարությունը պատճառ է դանդաղեցնելու և, անհրաժեշտության դեպքում, հարմարեցված խորհուրդ հարցնելու՝ նախքան շարունակելը կամ ինտենսիվությունը մեծացնելը:',
    section6Body: 'Ծննդաբերությունից հետո քունը կարող է դառնալ անկանոն: Կուտակված հոգնածությունը կարող է ազդել էներգիայի, կենտրոնացման և տրամադրության վրա: Հնարավորության դեպքում որոշ գործեր պարզեցնելը և պարտականությունները կիսելը կարող է օգնել:',
    milestones: [
      ['Առաջին օրերը', 'Հանգիստ, հարմարում և էական խնամք:'],
      ['Առաջին շաբաթները', 'Աստիճանական վերականգնում և նոր ռեժիմների սկիզբ:'],
      ['Հետծննդյան հետազոտությունից հետո', 'Վերանայեք վերականգնման առաջընթացը և քննարկեք գործունեության աստիճանական վերսկսումը:'],
    ],
    section7Body1: 'Հետծննդյան շրջանը կարող է բերել բազմաթիվ հույզեր. ուրախություն, անհանգստություն, հոգնածություն, զգայունություն կամ ծանրաբեռնվածության զգացում: Այս զգացմունքները կարող են արագ փոխվել, հատկապես այն ժամանակ, երբ քունը և առօրյա սովորությունները փոխվում են:',
    section7Body2: 'Ձեր վստահած մարդու կամ մասնագետի հետ խոսելը կարող է օգնել, երբ հույզերը դժվար է դառնում կառավարել կամ երբ դրանք մեծ տեղ են զբաղեցնում առօրյայում:',
    highlight2Title: 'Աջակցություն խնդրելը նորմալ է',
    highlight2Text: 'Պետք չէ սպասել, մինչև լիովին սպառվեք կամ ծանրաբեռնվեք, որպեսզի խոսեք ձեր ինքնազգացողության մասին և աջակցություն փնտրեք:',
    section8Body: 'Որոշ իրավիճակներ արժե քննարկել առողջապահության մասնագետի հետ, հատկապես երբ դրանք վատանում են, շարունակվում են կամ զգալի անհանգստություն են առաջացնում:',
    consultationSigns: [
      {title: 'Վատացող ախտանիշներ', text: 'Ցավը կամ անհարմարությունը, որը բարելավվելու փոխարեն մեծանում է, արժանի է մասնագիտական խորհրդի:'},
      {title: 'Անսովոր արյունահոսություն', text: 'Արյունահոսությունը, որը հանկարծակի դառնում է ավելի առատ կամ անսովոր, պետք է հայտնել առողջապահության մասնագետին:'},
      {title: 'Շարունակական անհարմարություն', text: 'Եթե հուզական անհարմարությունը մեծ տեղ է զբաղեցնում կամ դժվարացնում է առօրյան, կարևոր է խոսել այդ մասին և աջակցություն խնդրել:'},
      {title: 'Զգալի անհանգստություն', text: 'Ձեր վերականգնման վերաբերյալ կասկածի դեպքում խորհուրդ հարցնելը օգնում է ստանալ ձեր իրավիճակին համապատասխան առաջարկություններ:'},
    ],
    section9Body: 'Հսկողության այցերը առիթ են քննարկելու վերականգնումը, ախտանիշները, գործունեության վերսկսումը և ցանկացած մնացած հարց: Նախապես մի քանի հարց պատրաստելը կարող է օգնել, որ ոչինչ չմոռացվի:',
    questionTitle: 'Հարցեր, որոնք կարող եք պատրաստել',
    questions: [
      'Իմ վերականգնումը ընթանո՞ւմ է այնպես, ինչպես սպասվում է իմ իրավիճակի համար:',
      'Ո՞ր գործունեությունը կարող եմ աստիճանաբար վերսկսել:',
      'Ո՞ր ախտանիշներին պետք է ուշադրություն դարձնեմ:',
      'Ե՞րբ կարող եմ դիտարկել ֆիզիկական վարժությունների ավելի ինտենսիվ վերադարձ:',
      'Ինձ որևէ հատուկ խորհուրդ կամ վերականգնում պե՞տք է:',
    ],
    summaryItems: [
      'Ծննդաբերությունից հետո վերականգնումը աստիճանական է և բոլորի համար տարբեր:',
      'Հանգիստը և աջակցությունը կարող են վերականգնման անբաժանելի մասը լինել:',
      'Ֆիզիկական փոփոխությունները, քունը և հույզերը կարող են փոխվել շաբաթների ընթացքում:',
      'Գործունեությունը աստիճանաբար վերսկսելը օգնում է ավելի լավ հարգել ձեր էներգիան և հարմարավետությունը:',
      'Եթե նկատում եք անսովոր, շարունակական կամ անհանգստացնող ախտանիշ, խորհուրդ հարցնելը լավ քայլ է:',
    ],
    finalTipTitle: 'Վերցրեք ձեզ անհրաժեշտ ժամանակը',
    finalTipText: 'Վերականգնումը մրցավազք չէ: Աստիճանաբար առաջ շարժվելը, ձեր կարիքները հարգելը և անհրաժեշտության դեպքում աջակցություն խնդրելը արդեն կարևոր քայլեր են:',
    disclaimerText: 'Այս հոդվածը միայն տեղեկատվական նպատակով է և չի փոխարինում անհատականացված բժշկական խորհրդատվությանը: Եթե զգում եք զգալի, շարունակական կամ անհանգստացնող ախտանիշ, կապվեք առողջապահության մասնագետի հետ:',
    shareMessage: 'Վերականգնում ծննդաբերությունից հետո — AWA',
  },
  tg: {
    badge: 'ДАВРАИ БАЪДИЗОӢ • БАРҚАРОРШАВӢ',
    title: 'Барқароршавӣ\nпас аз таваллуд',
    metaDuration: '10 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Бадани шумо вақт мехоҳад: пас аз таваллуд чӣ муқаррарӣ аст.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Фаҳмидани давраи баъдизоӣ',
      'Рӯзҳои аввал: суръатро паст кардан ва барқарор шудан',
      'Чӣ метавонад ҳангоми барқароршавӣ муқаррарӣ бошад',
      'Ғамхорӣ аз худ дар ҳаёти ҳаррӯза',
      'Ҳаракат кардан ва тадриҷан аз сар гирифтани фаъолият',
      'Хоб, хастагӣ ва тартиботи нав',
      'Эҳсосот пас аз таваллуд',
      'Кай маслиҳат пурсидан лозим аст',
      'Назорат бо мутахассиси соҳаи тиб',
      'Чӣ бояд дар хотир дошт',
    ],
    headings: [
      'Фаҳмидани давраи баъдизоӣ',
      'Рӯзҳои аввал: суръатро паст кардан ва барқарор шудан',
      'Чӣ метавонад ҳангоми барқароршавӣ муқаррарӣ бошад',
      'Ғамхорӣ аз худ дар ҳаёти ҳаррӯза',
      'Ҳаракат кардан ва тадриҷан аз сар гирифтани фаъолият',
      'Хоб, хастагӣ ва тартиботи нав',
      'Эҳсосот пас аз таваллуд',
      'Кай бояд маслиҳат пурсид?',
      'Назорат бо мутахассиси соҳаи тиб',
      'Чӣ бояд дар хотир дошт',
    ],
    section1Body1: 'Давраи баъдизоӣ пас аз таваллуд меояд. Он ба чанд рӯз маҳдуд нест: бадан, суръати ҳаррӯза ва эҳсосот метавонанд дар ҳафтаҳои минбаъда тадриҷан тағйир ёфтанро идома диҳанд.',
    section1Body2: '«Карантин» ибораи анъанавист, ки аксар вақт барои тавсифи ҳафтаҳои аввали барқароршавӣ истифода мешавад. Он метавонад ёдоварии хубе бошад: пас аз ҳомиладорӣ ва таваллуд сазовор аст суръатро паст кунед ва ба бадан вақт диҳед.',
    highlight1Title: 'Барқароршавии тамоми бадан',
    highlight1Text: 'Барқароршавӣ ба бадан, вале инчунин ба хоб, қувват, ташкили ҳаррӯза ва мутобиқшавии ҳиссӣ ба марҳилаи нави зиндагӣ марбут аст.',
    section2Body: 'Рӯзҳои аввал метавонанд пурзӯр бошанд. Истироҳат, нигоҳубини асосӣ ва мутобиқшавӣ ба суръати нав аксар вақт афзалиятҳо мебошанд. Лозим нест, ки фавран сатҳи қуввати одатии худро бозгардонед.',
    recoveryPillars: [
      {title: 'Истироҳат', text: 'Иваз кардани фаъолият ва истироҳат ба бадан кумак мекунад тадриҷан барқарор шавад.'},
      {title: 'Ғизо', text: 'Мунтазам хӯрдан ва вобаста ба эҳтиёҷ нӯшидан барқароршавии ҳаррӯзаро дастгирӣ мекунад.'},
      {title: 'Дастгирӣ', text: 'Қабул кардани кумак имкон медиҳад қувватро барои нигоҳубини зарурӣ ва барқароршавӣ сарфа кунед.'},
      {title: 'Ҳаракати нарм', text: 'Тадриҷан ҳаракатҳо ва фаъолиятро аз сар гиред, бо эҳтироми ҳолат ва роҳатии худ.'},
    ],
    section3Body1: 'Ҳар барқароршавӣ гуногун аст. Баъзе тағйирот метавонад қисми давраи мутобиқшавӣ бошад ва тадриҷан тағйир ёбад:',
    normalSigns: [
      'Хастагии назаррас',
      'Хунравие, ки тадриҷан кам мешавад',
      'Тағйироти гормонӣ ва ҳиссӣ',
    ],
    section3Body2: 'Шиддат ва давомнокии нишонаҳо аз шахс ба шахс фарқ карда метавонад. Муҳим он аст, ки тағйирёбии онҳоро пайгирӣ кунед ва агар тағйироте нигаронкунанда ё ғайриоддӣ ба назар расад, маслиҳат пурсед.',
    section4Body: 'Дар давраи баъдизоӣ одатҳои хурд ва воқеӣ аксар вақт аз тартиби талабкор муфидтаранд. Мақсад дастгирии барқароршавӣ бидуни илова кардани фишор аст.',
    selfCareTips: [
      'Ҳар вақт имкон бошад, лаҳзаҳои воқеии истироҳатро банақшагирӣ кунед.',
      'Барои корҳои ҳаррӯза ва хӯрок кумак пурсед.',
      'Мунтазам об нӯшед ва ғизои гуногун нигоҳ доред.',
      'Аз муқоисаи барқароршавии худ бо барқароршавии каси дигар худдорӣ кунед.',
      'Фаъолиятро тадриҷан аз сар гиред, бидуни кӯшиши ҳама чизро фавран анҷом додан.',
    ],
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Худро бо дастгирӣ иҳота кардан ва қабул кардани кумак аз ҳад зиёд нест. Он метавонад ба нигоҳ доштани қувват ва тадриҷӣ кардани барқароршавӣ кумак кунад.',
    section5Body1: 'Аз сар гирифтани фаъолият метавонад қадам ба қадам, мувофиқи роҳатӣ, қувват ва тавсияҳои пас аз таваллуд гирифташуда сурат гирад. Ҳаракатҳои нарм ва фаъолиятҳои ҳаррӯза аллакай бозгашт ба ҳаракат ҳисоб мешаванд.',
    section5Body2: 'Барои фаъолиятҳои шадидтар беҳтар аст бидуни ҷаҳиш аз қадамҳо пеш равед ва ҳар нишона ё нороҳатиро ба назар гиред.',
    alertTitle: 'Ба сигналҳои бадани худ гӯш диҳед',
    alertText: 'Нороҳатие, ки ҳангоми фаъолият афзоиш меёбад, сабабест, ки суръатро суст кунед ва, агар лозим бошад, пеш аз идома ё зиёд кардани шиддат маслиҳати мувофиқ пурсед.',
    section6Body: 'Хоб пас аз таваллуд метавонад номунтазам шавад. Хастагии ҷамъшуда метавонад ба қувват, тамаркуз ва кайфият таъсир расонад. Ҳар вақт имкон бошад, содда кардани баъзе корҳо ва тақсим кардани масъулиятҳо метавонад кумак кунад.',
    milestones: [
      ['Рӯзҳои аввал', 'Истироҳат, мутобиқшавӣ ва нигоҳубини зарурӣ.'],
      ['Ҳафтаҳои аввал', 'Барқароршавии тадриҷӣ ва оғози тартиботи нав.'],
      ['Пас аз санҷиши баъдизоӣ', 'Баррасии пешрафти барқароршавӣ ва муҳокимаи тадриҷан аз сар гирифтани фаъолият.'],
    ],
    section7Body1: 'Давраи баъдизоӣ метавонад эҳсосоти зиёдро оварад: шодӣ, нигаронӣ, хастагӣ, ҳассосият ё эҳсоси аз ҳад зиёд будан. Ин эҳсосот метавонанд зуд тағйир ёбанд, хусусан дар даврае, ки хоб ва одатҳои ҳаррӯза тағйир меёбанд.',
    section7Body2: 'Гап задан бо касе, ки ба ӯ боварӣ доред, ё бо мутахассис метавонад кумак кунад, вақте ки эҳсосот идора кардан душвор мешаванд ё дар ҳаёти ҳаррӯза ҷои зиёд мегиранд.',
    highlight2Title: 'Пурсидани дастгирӣ муқаррарӣ аст',
    highlight2Text: 'Интизор шудан лозим нест, то комилан хаста ё аз ҳад зиёд бор шавед, то дар бораи эҳсоси худ гап занед ва дастгирӣ ҷӯед.',
    section8Body: 'Баъзе вазъиятҳо сазоворанд, ки бо мутахассиси соҳаи тиб муҳокима шаванд, хусусан вақте ки бадтар мешаванд, идома меёбанд ё нигаронии назаррас ба вуҷуд меоранд.',
    consultationSigns: [
      {title: 'Бадтар шудани нишонаҳо', text: 'Дард ё нороҳатие, ки ба ҷои беҳтар шудан афзоиш меёбад, маслиҳати касбиро сазовор аст.'},
      {title: 'Хунравии ғайриоддӣ', text: 'Хунравие, ки ногаҳон зиёдтар ё ғайриоддӣ мешавад, бояд ба мутахассиси соҳаи тиб хабар дода шавад.'},
      {title: 'Ноороми доимӣ', text: 'Агар ноороми ҳиссӣ ҷои зиёд мегирад ё ҳаёти ҳаррӯзаро душвор мекунад, муҳим аст дар ин бора гап занед ва дастгирӣ пурсед.'},
      {title: 'Нигаронии назаррас', text: 'Дар сурати шубҳа дар бораи барқароршавии худ, маслиҳат пурсидан ба шумо кумак мекунад тавсияҳои мувофиқ ба вазъияти худро бигиред.'},
    ],
    section9Body: 'Қабулҳои пайгирӣ имконияти гап задан дар бораи барқароршавӣ, нишонаҳо, аз сар гирифтани фаъолият ва ҳар саволи боқимонда. Омода кардани чанд савол аз пеш метавонад кумак кунад, ки ҳеҷ чиз фаромӯш нашавад.',
    questionTitle: 'Саволҳое, ки омода карда метавонед',
    questions: [
      'Оё барқароршавии ман мувофиқи вазъияти ман пеш меравад?',
      'Кадом фаъолиятҳоро тадриҷан аз сар гирифта метавонам?',
      'Кадом нишонаҳоро бояд пайгирӣ кунам?',
      'Кай метавонам бозгашти шадидтар ба машқро дар назар гирам?',
      'Оё ба маслиҳат ё барқарорсозии махсус ниёз дорам?',
    ],
    summaryItems: [
      'Барқароршавӣ пас аз таваллуд тадриҷӣ аст ва барои ҳама гуногун аст.',
      'Истироҳат ва дастгирӣ метавонад ҷузъи ҷудонашавандаи барқароршавӣ бошад.',
      'Тағйироти ҷисмонӣ, хоб ва эҳсосот метавонад дар давоми ҳафтаҳо тағйир ёбад.',
      'Тадриҷан аз сар гирифтани фаъолият ба шумо кумак мекунад қувват ва роҳатии худро беҳтар эҳтиром кунед.',
      'Агар нишонаи ғайриоддӣ, доимӣ ё нигаронкунандаро мушоҳида кунед, маслиҳат пурсидан қадами хуб аст.',
    ],
    finalTipTitle: 'Вақти заруриро ба худ диҳед',
    finalTipText: 'Барқароршавӣ мусобиқа нест. Тадриҷан пеш рафтан, эҳтироми эҳтиёҷоти худ ва пурсидани дастгирӣ дар сурати зарурат аллакай қадамҳои муҳиманд.',
    disclaimerText: 'Ин мақола танҳо барои иттилоъ аст ва маслиҳати шахсии тиббиро иваз намекунад. Агар нишонаи назаррас, доимӣ ё нигаронкунанда эҳсос кунед, бо мутахассиси соҳаи тиб тамос гиред.',
    shareMessage: 'Барқароршавӣ пас аз таваллуд — AWA',
  },
  ky: {
    badge: 'ТӨРӨТТӨН КИЙИН • КАЛЫБЫНА КЕЛҮҮ',
    title: 'Төрөттөн кийин\nкалыбына келүү',
    metaDuration: '10 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Денеңизге убакыт керек: төрөттөн кийин эмне кадимки.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Төрөттөн кийинки мезгилди түшүнүү',
      'Алгачкы күндөр: жайлатуу жана калыбына келүү',
      'Калыбына келүү учурунда эмне кадимки болушу мүмкүн',
      'Күнүмдүк жашоодо өзүңүзгө кам көрүү',
      'Кыймылдоо жана иш-аракеттерди акырындык менен улантуу',
      'Уйку, чарчоо жана жаңы тартиптер',
      'Төрөттөн кийинки эмоциялар',
      'Кеңешти качан сурап кайрылуу керек',
      'Ден соолук сактоо адиси менен текшерүү',
      'Эмнени эстен чыгарбоо керек',
    ],
    headings: [
      'Төрөттөн кийинки мезгилди түшүнүү',
      'Алгачкы күндөр: жайлатуу жана калыбына келүү',
      'Калыбына келүү учурунда эмне кадимки болушу мүмкүн',
      'Күнүмдүк жашоодо өзүңүзгө кам көрүү',
      'Кыймылдоо жана иш-аракеттерди акырындык менен улантуу',
      'Уйку, чарчоо жана жаңы тартиптер',
      'Төрөттөн кийинки эмоциялар',
      'Кеңешти качан сурап кайрылуу керек?',
      'Ден соолук сактоо адиси менен текшерүү',
      'Эмнени эстен чыгарбоо керек',
    ],
    section1Body1: 'Төрөттөн кийинки мезгил төрөттөн кийин келет. Ал бир нече күн менен чектелбейт: дене, күнүмдүк ритм жана эмоциялар кийинки жумаларда акырындап өнүгө берет.',
    section1Body2: '«Кырк күн» — калыбына келүүнүн алгачкы жумаларын сүрөттөө үчүн көп колдонулган салттуу сөз айкашы. Ал жакшы эскертме боло алат: курсактуулуктан жана төрөттөн кийин жайлатып, денеге убакыт берген жакшы.',
    highlight1Title: 'Бүт дененин калыбына келүүсү',
    highlight1Text: 'Калыбына келүү денеге гана эмес, ошондой эле уйкуга, энергияга, күнүмдүк уюштурууга жана жашоонун жаңы этабына эмоционалдык ыңгайлашууга да тиешелүү.',
    section2Body: 'Алгачкы күндөр интенсивдүү болушу мүмкүн. Эс алуу, негизги кам көрүү жана жаңы ритмге ыңгайлашуу көбүнчө артыкчылыктуу болот. Адаттагы энергия деңгээлин дароо кайра алуунун кереги жок.',
    recoveryPillars: [
      {title: 'Эс алуу', text: 'Активдүүлүк менен эс алууну алмаштыруу денеге акырындап калыбына келүүгө жардам берет.'},
      {title: 'Тамактануу', text: 'Үзгүлтүксүз тамактануу жана муктаждыкка жараша суюктук ичүү күнүмдүк калыбына келүүнү колдойт.'},
      {title: 'Колдоо', text: 'Жардамды кабыл алуу негизги кам көрүү жана калыбына келүү үчүн күчтү үнөмдөөгө мүмкүндүк берет.'},
      {title: 'Жумшак кыймыл', text: 'Абалыңызды жана ыңгайлуулугуңузду сыйлап, кыймылдарды жана иш-аракеттерди акырындап улантыңыз.'},
    ],
    section3Body1: 'Ар бир калыбына келүү ар башка. Айрым өзгөрүүлөр ыңгайлашуу мезгилинин бир бөлүгү болуп, акырындап өнүгүшү мүмкүн:',
    normalSigns: [
      'Олуттуу чарчоо',
      'Акырындап азайган кан кетүү',
      'Гормондук жана эмоционалдык термелүүлөр',
    ],
    section3Body2: 'Белгилердин курчтугу жана узактыгы адамдан адамга айырмаланышы мүмкүн. Маанилүүсү — алардын кантип өнүгүп жатканын байкоо жана өзгөрүү тынчсыздандырса же адаттан тыш көрүнсө, кеңеш сурап кайрылуу.',
    section4Body: 'Төрөттөн кийинки мезгилде кичинекей, реалдуу адаттар талап кылган тартипке караганда көбүнчө пайдалуураак. Максат — кошумча кысым түшүрбөстөн калыбына келүүнү колдоо.',
    selfCareTips: [
      'Мүмкүн болгондо чыныгы эс алуу учурларын пландаңыз.',
      'Күнүмдүк иштерде жана тамакта жардам сураңыз.',
      'Үзгүлтүксүз суу ичиңиз жана ар түрдүү тамактаныңыз.',
      'Калыбына келүүңүздү башка бирөөнүкү менен салыштыруудан сактаныңыз.',
      'Баарын дароо кылууга аракет кылбастан, иш-аракеттерди акырындап улантыңыз.',
    ],
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Өзүңүздү колдоо менен курчоо жана жардамды кабыл алуу — люкс эмес. Ал энергияны сактоого жана калыбына келүүнү акырындыраак кылууга жардам бериши мүмкүн.',
    section5Body1: 'Иш-аракеттерди улантуу ыңгайлуулукка, энергияга жана төрөттөн кийин алынган сунуштарга жараша кадам-кадам менен болушу мүмкүн. Жумшак кыймылдар жана күнүмдүк иш-аракеттер буга чейин эле кыймылга кайтуу болуп эсептелет.',
    section5Body2: 'Интенсивдүүрөөк иш-аракеттер үчүн кадамдарды өткөрүп жибербей алдыга жылган жана ар кандай белгилерди же ыңгайсыздыкты эске алган жакшы.',
    alertTitle: 'Денеңиздин сигналдарын угуңуз',
    alertText: 'Иш-аракет учурунда күчөгөн ыңгайсыздык жайлатуу үчүн жана, керек болсо, улантуудан же интенсивдүүлүктү көбөйтүүдөн мурун ылайыкталган кеңеш алуу үчүн себеп.',
    section6Body: 'Төрөттөн кийин уйку туура эмес болуп калышы мүмкүн. Топтолгон чарчоо энергияга, көңүл топтоого жана маанайга таасир этиши мүмкүн. Мүмкүн болгондо, айрым иштерди жөнөкөйлөтүү жана жоопкерчиликти бөлүшүү жардам бериши мүмкүн.',
    milestones: [
      ['Алгачкы күндөр', 'Эс алуу, ыңгайлашуу жана негизги кам көрүү.'],
      ['Алгачкы жумалар', 'Акырындык менен калыбына келүү жана жаңы тартиптердин башталышы.'],
      ['Төрөттөн кийинки текшерүүдөн кийин', 'Калыбына келүүнүн прогрессин карап чыгуу жана иш-аракеттерди акырындап улантууну талкуулоо.'],
    ],
    section7Body1: 'Төрөттөн кийинки мезгил көптөгөн эмоцияларды алып келиши мүмкүн: кубаныч, тынчсыздануу, чарчоо, сезгичтик же басып калган сезим. Бул сезимдер тез өзгөрүшү мүмкүн, айрыкча уйку жана күнүмдүк адаттар өзгөрүп жаткан убакта.',
    section7Body2: 'Эмоциялар башкаруу кыйын болуп калганда же күнүмдүк жашоодо көп орун ээлегенде, ишенген адамыңыз же адис менен сүйлөшүү жардам бериши мүмкүн.',
    highlight2Title: 'Колдоо сурап кайрылуу кадимки көрүнүш',
    highlight2Text: 'Өзүңүздү кандай сезгениңиз жөнүндө сүйлөшүү жана колдоо издөө үчүн толугу менен чарчаганга же басылганга чейин күтүүнүн кереги жок.',
    section8Body: 'Айрым абалдарды ден соолук сактоо адиси менен талкуулоого татыйт, айрыкча алар начарласа, улана берсе же олуттуу тынчсыздануу жаратса.',
    consultationSigns: [
      {title: 'Начарлаган белгилер', text: 'Жакшырбастан күчөгөн оору же ыңгайсыздык адистин кеңешине татыйт.'},
      {title: 'Адаттан тыш кан кетүү', text: 'Капыстан көбөйгөн же адаттан тыш кан кетүү ден соолук сактоо адисине билдирилиши керек.'},
      {title: 'Улана берген кысымчылык', text: 'Эмоционалдык кысымчылык көп орун ээлесе же күнүмдүк жашоону кыйындатса, бул жөнүндө сүйлөшүү жана колдоо сурап кайрылуу маанилүү.'},
      {title: 'Олуттуу тынчсыздануу', text: 'Калыбына келүүңүз боюнча күмөн болсо, кеңеш сурап кайрылуу абалыңызга ылайыктуу сунуштарды алууга жардам берет.'},
    ],
    section9Body: 'Кийинки кабыл алуулар калыбына келүү, белгилер, иш-аракеттерди улантуу жана калган суроолор жөнүндө сүйлөшүү мүмкүнчүлүгү. Алдын ала бир нече суроо даярдоо эч нерсе унутулбашына көмөктөшөт.',
    questionTitle: 'Даярдаса боло турган суроолор',
    questions: [
      'Менин калыбына келүүм абалыма күтүлгөндөй жүрүп жатабы?',
      'Кайсы иш-аракеттерди акырындап улантсам болот?',
      'Кандай белгилерге көңүл буруу керек?',
      'Көнүгүүгө интенсивдүүрөөк кайтууну качан ойлонсом болот?',
      'Мага кандайдыр бир өзгөчө кеңеш же калыбына келтирүү керекпи?',
    ],
    summaryItems: [
      'Төрөттөн кийинки калыбына келүү акырындык менен жүрөт жана ар бир адамда башкача.',
      'Эс алуу жана колдоо калыбына келүүнүн ажырагыс бөлүгү болушу мүмкүн.',
      'Физикалык өзгөрүүлөр, уйку жана эмоциялар жумалар бою өзгөрүшү мүмкүн.',
      'Иш-аракеттерди акырындап улантуу энергияңызды жана ыңгайлуулугуңузду жакшыраак сыйлоого жардам берет.',
      'Адаттан тыш, улана берген же тынчсыздандырган белги байкасаңыз, кеңеш сурап кайрылуу жакшы кадам.',
    ],
    finalTipTitle: 'Керектүү убакытты алыңыз',
    finalTipText: 'Калыбына келүү жарыш эмес. Акырындык менен жылуу, муктаждыктарыңызды сыйлоо жана керек болгондо колдоо сурап кайрылуу буга чейин эле маанилүү кадамдар.',
    disclaimerText: 'Бул макала маалымат берүү максатында гана жазылган жана жекелештирилген медициналык кеңешти алмаштырбайт. Олуттуу, улана берген же тынчсыздандырган белги сезсеңиз, ден соолук сактоо адиси менен байланышыңыз.',
    shareMessage: 'Төрөттөн кийин калыбына келүү — AWA',
  },
  tk: {
    badge: 'DOGRANDAN SOŇ • DIKELIŞ',
    title: 'Dograndan soňky\ndikeliş',
    metaDuration: '10 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Bedeniňiz wagta mätäç: dograndan soň nämäniň adatydygy.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Dograndan soňky döwri düşünmek',
      'Ilkinji günler: haýallamak we dikelmek',
      'Dikeliş wagtynda nämäniň adaty bolup biljekdigi',
      'Gündelik özüňize ideg etmek',
      'Hereket etmek we işjeňlikleri ýuwaş-ýuwaşdan täzeden başlamak',
      'Uky, ýadawlyk we täze tertipler',
      'Dograndan soňky duýgular',
      'Maslahaty haçan soramaly',
      'Saglyk hünärmeni bilen barlag',
      'Nämäni ýatda saklamaly',
    ],
    headings: [
      'Dograndan soňky döwri düşünmek',
      'Ilkinji günler: haýallamak we dikelmek',
      'Dikeliş wagtynda nämäniň adaty bolup biljekdigi',
      'Gündelik özüňize ideg etmek',
      'Hereket etmek we işjeňlikleri ýuwaş-ýuwaşdan täzeden başlamak',
      'Uky, ýadawlyk we täze tertipler',
      'Dograndan soňky duýgular',
      'Maslahaty haçan soramaly?',
      'Saglyk hünärmeni bilen barlag',
      'Nämäni ýatda saklamaly',
    ],
    section1Body1: 'Dograndan soňky döwür dogrumdan soň gelýär. Ol birnäçe gün bilen çäklenmeýär: beden, gündelik ritm we duýgular indiki hepdelerde ýuwaş-ýuwaşdan üýtgemegini dowam etdirip biler.',
    section1Body2: '«Kwarantin» dikelişiň ilkinji hepdelerini suratlandyrmak üçin köplenç ulanylýan däp adalgasy. Ol gowy ýatlatma bolup biler: göwrelilikden we dogrumdan soň haýallamak we bedene wagt bermek mynasyp.',
    highlight1Title: 'Bütin bedeniň dikelişi',
    highlight1Text: 'Dikeliş bedene, şeýle hem uka, energiýa, gündelik guramaçylyga we durmuşyň täze tapgyryna duýgusal uýgunlaşmaga degişli.',
    section2Body: 'Ilkinji günler güýçli bolup biler. Dynç, esasy ideg we täze ritme uýgunlaşmak köplenç ileri tutulýan zatlar. Adaty energiýa derejäňizi derrew gaýtadan gazanmak hökman däl.',
    recoveryPillars: [
      {title: 'Dynç', text: 'Işjeňligi we dynçy çalşyrmak bedeniň ýuwaş-ýuwaşdan dikelmegine kömek edýär.'},
      {title: 'Iýmitlenmek', text: 'Yzygiderli iýmek we zerurlyklaryňyza görä içmek gündelik dikelişe goldaw berýär.'},
      {title: 'Goldaw', text: 'Kömegi kabul etmek zerur ideg we dikeliş üçin energiýany tygşytlamaga mümkinçilik berýär.'},
      {title: 'Ýumşak hereket', text: 'Ýagdaýyňyza we rahatlygyňyza hormat goýup, hereketleri we işjeňlikleri ýuwaş-ýuwaşdan täzeden başlaň.'},
    ],
    section3Body1: 'Her dikeliş dürli. Käbir üýtgeşmeler uýgunlaşma döwrüniň bir bölegi bolup, ýuwaş-ýuwaşdan üýtgäp biler:',
    normalSigns: [
      'Möhüm ýadawlyk',
      'Ýuwaş-ýuwaşdan azalýan gan akma',
      'Gormonal we duýgusal yrgyldylar',
    ],
    section3Body2: 'Alamatlaryň güýçlüligi we dowamlylygy adamdan adama tapawutlanyp biler. Möhümi olaryň nähili üýtgeýändigini synlamak we üýtgeşme alada goýýan ýa-da adaty däl bolsa maslahat almak.',
    section4Body: 'Dograndan soňky döwürde kiçijik, hakyky endikler talap edýän tertipden köplenç has peýdaly. Maksat basyş goşman dikelişe goldaw bermek.',
    selfCareTips: [
      'Mümkin bolanda hakyky dynç pursatlaryny meýilleşdiriň.',
      'Gündelik işler we tagamlar boýunça kömek soraň.',
      'Yzygiderli içiň we dürli-dürli iýmitlenmegi saklaň.',
      'Dikelişiňizi başga birinikiň bilen deňeşdirmekden gaça duruň.',
      'Hemme zady derrew etmäge synanyşmazdan, işjeňlikleri ýuwaş-ýuwaşdan täzeden başlaň.',
    ],
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Goldaw bilen gurşalmak we kömegi kabul etmek artykmaçlyk däl däl. Ol energiýany goramaga we dikelişi has ýuwaş-ýuwaşdan etmäge kömek edip biler.',
    section5Body1: 'Işjeňlikleri täzeden başlamak rahatlyga, energiýa we dograndan soň alnan maslahatlara görä ädimme-ädim bolup biler. Ýumşak hereketler we gündelik işjeňlikler eýýäm herekete gaýdyp gelmek hasaplanýar.',
    section5Body2: 'Has güýçli işjeňlikler üçin, ädimleri sypdyrmazdan öňe gitmek we islendik alamaty ýa-da biynjalygy hasaba almak has gowy.',
    alertTitle: 'Bedeniňiziň signallaryna gulak asyň',
    alertText: 'Işjeňlik wagtynda artýan biynjalyk haýallamak we zerur bolsa dowam etmezden ýa-da intensiwligi artdyrmazdan öň laýyk maslahat almak üçin sebäp.',
    section6Body: 'Uky dograndan soň düzgünsiz bolup biler. Ýygnanan ýadawlyk energiýa, üns jemlemäge we keýbe täsir edip biler. Mümkin bolanda käbir işleri ýönekeýleşdirmek we jogapkärçilikleri paýlaşmak kömek edip biler.',
    milestones: [
      ['Ilkinji günler', 'Dynç, uýgunlaşma we esasy ideg.'],
      ['Ilkinji hepdeler', 'Ýuwaş-ýuwaşdan dikeliş we täze tertipleriň başlanmagy.'],
      ['Dograndan soňky barlagdan soň', 'Dikeliş ösüşini gözden geçiriň we işjeňlikleri ýuwaş-ýuwaşdan täzeden başlamagy maslahatlaşyň.'],
    ],
    section7Body1: 'Dograndan soňky döwür köp duýgy getirip biler: şatlyk, alada, ýadawlyk, duýgurlyk ýa-da basylan duýgusy. Bu duýgular, aýratyn-da uky we gündelik endikler üýtgeýän wagtynda, çalt süýşüp biler.',
    section7Body2: 'Ynanýan adamyňyz ýa-da hünärmen bilen gürleşmek duýgular dolandyrmak kyn bolanda ýa-da gündelik durmuşda köp ýer eýelände kömek edip biler.',
    highlight2Title: 'Goldaw soramak adaty zat',
    highlight2Text: 'Özüňizi nähili duýýandygyňyz barada gürleşmek we goldaw soramak üçin doly ýadanyňyz ýa-da basylanyňyz bilen garaşmak hökman däl.',
    section8Body: 'Käbir ýagdaýlar saglyk hünärmeni bilen maslahatlaşmaga mynasyp, aýratyn-da erbetleşende, dowam edende ýa-da möhüm alada döredende.',
    consultationSigns: [
      {title: 'Erbetleşýän alamatlar', text: 'Gowulaşmagyň ýerine artýan agyry ýa-da biynjalyk hünärmen maslahatyna mynasyp.'},
      {title: 'Adaty däl gan akma', text: 'Birden köpelýän ýa-da adaty däl gan akma saglyk hünärmenine habar berilmeli.'},
      {title: 'Dowamly ejir', text: 'Duýgusal ejir köp ýer eýelese ýa-da gündelik durmuşy kynlaşdyrsa, bu barada gürleşmek we goldaw soramak möhüm.'},
      {title: 'Möhüm alada', text: 'Dikelişiňiz barada şübhe bolsa, maslahat soramak ýagdaýyňyza laýyk maslahatlary almaga kömek edýär.'},
    ],
    section9Body: 'Yzarlama kabul edişleri dikeliş, alamatlar, işjeňlikleri täzeden başlamak we galan soraglar barada gürleşmek üçin pursat. Birnäçe soragy öňünden taýýarlamak hiç zadyň ýatdan çykmazlygyny üpjün etmäge kömek edip biler.',
    questionTitle: 'Taýýarlap bilýän soraglaryňyz',
    questions: [
      'Dikelişim ýagdaýym üçin garaşylyşy ýaly öňe barýarmy?',
      'Haýsy işjeňlikleri ýuwaş-ýuwaşdan täzeden başlap bilerin?',
      'Haýsy alamatlara üns bermeli?',
      'Maşklara has güýçli gaýdyp gelmegi haçan pikir edip bilerin?',
      'Maňa aýratyn maslahat ýa-da dikeldiş gerekmi?',
    ],
    summaryItems: [
      'Dograndan soňky dikeliş ýuwaş-ýuwaşdan we her kim üçin dürli.',
      'Dynç we goldaw dikelişiň aýrylmaz bölegi bolup biler.',
      'Fiziki üýtgeşmeler, uky we duýgular hepdeler dowamynda üýtgäp biler.',
      'Işjeňlikleri ýuwaş-ýuwaşdan täzeden başlamak energiýaňyza we rahatlygyňyza has gowy hormat goýmaga kömek edýär.',
      'Adaty däl, dowamly ýa-da alada goýýan alamat görseňiz, maslahat soramak gowy ädim.',
    ],
    finalTipTitle: 'Gerek wagtyňyzy alyň',
    finalTipText: 'Dikeliş ýaryş däl. Ýuwaş-ýuwaşdan öňe gitmek, zerurlyklaryňyza hormat goýmak we zerur bolanda goldaw soramak eýýäm möhüm ädimler.',
    disclaimerText: 'Bu makala diňe maglumat maksatly we şahsylaşdyrylan lukmançylyk maslahatyny çalyşmaýar. Möhüm, dowamly ýa-da alada goýýan alamat başdan geçirseňiz, saglyk hünärmeni bilen habarlaşyň.',
    shareMessage: 'Dograndan soňky dikeliş — AWA',
  },
} as const);

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
            <AwaIconButton
              accessibilityLabel={t('library.reader.back')}
              icon="chevron-left"
              iconSize={23}
              onPress={() => navigation.goBack()}
              variant="tonal"
            />

            <View style={styles.actions}>
              <AwaIconButton
                accessibilityLabel={t('library.screen.addBookmark')}
                icon={saved ? 'bookmark' : 'bookmark-outline'}
                iconSize={20}
                onPress={handleBookmark}
                variant="tonal"
              />

              <AwaIconButton
                accessibilityLabel={t('libraryArticle.shareA11y')}
                icon="share-variant-outline"
                iconSize={20}
                onPress={handleShare}
                variant="tonal"
              />
            </View>
          </View>
        </View>

        <View style={styles.article}>
          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">{content.badge}</AwaText>
          </View>

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

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

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant">{text}</AwaText>
                </View>
              </React.Fragment>
            ))}
          </View>

          <AwaText variant="titleSmall" colorRole="onSurfaceVariant" style={styles.intro}>
            {content.intro}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>{content.contentsTitle}</AwaText>

            {content.topics.map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.contentNumber}>{index + 1}.</AwaText>
                  <AwaText variant="bodySmall" style={styles.contentText}>{item}</AwaText>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </AwaCard>

          {/* SECTION 1 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.headings[0]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.highlight}>
            <MaterialDesignIcons
              name="heart-pulse"
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.highlight1Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.highlight1Text}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 2 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.headings[1]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section2Body}
          </AwaText>

          <View style={styles.pillarGrid}>
            {RECOVERY_PILLAR_ICONS.map((icon, index) => (
              <AwaCard variant="filled" padding="none" key={icon} style={styles.pillarCard}>
                <View style={styles.pillarIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>
                <AwaText variant="titleSmall" emphasized style={styles.pillarTitle}>{content.recoveryPillars[index].title}</AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.pillarText}>{content.recoveryPillars[index].text}</AwaText>
              </AwaCard>
            ))}
          </View>

          {/* SECTION 3 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            3. {content.headings[2]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body1}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.normalSigns.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body2}
          </AwaText>

          {/* SECTION 4 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            4. {content.headings[3]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section4Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tipList}>
            {content.selfCareTips.map((item, index) => (
              <View key={item} style={styles.tipRow}>
                <View style={styles.tipNumber}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary">{index + 1}</AwaText>
                </View>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipRowText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip1Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip1Text}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 5 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            5. {content.headings[4]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section5Body1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section5Body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="run-fast"
              size={24}
              color={theme.colors.warning}
            />
            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alertTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.alertText}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 6 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            6. {content.headings[5]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section6Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.timeline}>
            {content.milestones.map(([period, description], index) => (
              <View key={period} style={styles.timelineRow}>
                <View style={styles.timelineMarker}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary">{index + 1}</AwaText>
                </View>
                <View style={styles.timelineCopy}>
                  <AwaText variant="titleSmall" emphasized>{period}</AwaText>
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.timelineText}>{description}</AwaText>
                </View>
              </View>
            ))}
          </AwaCard>

          {/* SECTION 7 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            7. {content.headings[6]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section7Body1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section7Body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.highlight}>
            <MaterialDesignIcons
              name="account-heart-outline"
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.highlight2Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.highlight2Text}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 8 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>8. {content.headings[7]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section8Body}
          </AwaText>

          <View style={styles.consultList}>
            {CONSULTATION_SIGN_ICONS.map((icon, index) => (
              <AwaCard variant="filled" padding="none" key={icon} style={styles.consultCard}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={21}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.consultCopy}>
                  <AwaText variant="titleSmall" emphasized>{content.consultationSigns[index].title}</AwaText>
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.consultText}>{content.consultationSigns[index].text}</AwaText>
                </View>
              </AwaCard>
            ))}
          </View>

          {/* SECTION 9 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            9. {content.headings[8]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section9Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <MaterialDesignIcons
                name="message-question-outline"
                size={22}
                color={theme.colors.primary}
              />
              <AwaText variant="titleSmall" emphasized style={styles.questionTitle}>
                {content.questionTitle}
              </AwaText>
            </View>

            {content.questions.map((item, index) => (
              <View key={item} style={styles.questionRow}>
                <View style={styles.questionBullet}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary">{index + 1}</AwaText>
                </View>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.questionText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* SECTION 10 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>10. {content.headings[9]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
            {content.summaryItems.map(item => (
              <View key={item} style={styles.summaryItem}>
                <MaterialDesignIcons
                  name="check"
                  size={18}
                  color={theme.colors.success}
                />
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.finalTip}>
            <MaterialDesignIcons
              name="heart-outline"
              size={25}
              color={theme.colors.primary}
            />
            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.finalTipTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.finalTipText}
              </AwaText>
            </View>
          </AwaCard>

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={19}
              color={theme.colors.textMuted}
            />
            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.disclaimerText}>
              {content.disclaimerText}
            </AwaText>
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
  scroll: {paddingBottom: 32},
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
  article: {
    marginTop: -16,
    padding: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: theme.colors.background,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },
  title: {
    marginTop: 12,
  },
  metas: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 4},
  metaDivider: {width: 1, height: 20, backgroundColor: theme.colors.border},
  intro: {
    marginTop: 16,
  },
  contents: {
    marginTop: 20,
    padding: 16,
  },
  contentsTitle: {
    marginBottom: 8,
  },
  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentLeft: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  contentNumber: {width: 25},
  contentText: {flex: 1},
  h2: {
    marginTop: 28,
  },
  body: {
    marginTop: 8,
  },
  highlight: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {
    marginTop: 4,
  },
  pillarGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillarCard: {
    width: '48.5%',
    padding: 12,
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
    marginTop: 8,
  },
  pillarText: {
    marginTop: 4,
  },
  checkList: {
    marginTop: 12,
    padding: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  checkText: {
    flex: 1,
  },
  tipList: {
    marginTop: 16,
    padding: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipNumber: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  tipRowText: {
    flex: 1,
    marginLeft: 12,
    paddingTop: 2,
  },
  timeline: {
    marginTop: 16,
    padding: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  timelineCopy: {flex: 1, marginLeft: 12},
  timelineText: {
    marginTop: 3,
  },
  consultList: {marginTop: 16, gap: 12},
  consultCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  consultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  consultCopy: {flex: 1, marginLeft: 12},
  consultText: {
    marginTop: 4,
  },
  questionCard: {
    marginTop: 16,
    padding: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  questionTitle: {
    flex: 1,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  questionBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  questionText: {
    flex: 1,
    marginLeft: 8,
    paddingTop: 2,
  },
  summaryCard: {
    marginTop: 16,
    padding: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  summaryText: {
    flex: 1,
  },
  finalTip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  disclaimer: {
    marginTop: 20,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
  },
  });
}
