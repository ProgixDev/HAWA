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
