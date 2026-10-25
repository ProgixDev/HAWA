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

const ID = 'emotionalhealth-baby-blues';

/* -------------------------------------------------------------------------- */
/*                                    IMAGE                                   */
/* -------------------------------------------------------------------------- */

const HERO = require('../../assets/images/library/rules-hero.png');

/* -------------------------------------------------------------------------- */
/*                                    DATA                                    */
/* -------------------------------------------------------------------------- */

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const META_ICONS = [
  'clock-outline',
  'book-open-page-variant-outline',
  'chart-bar',
  'shield-check-outline',
] as const;

const SIGN_ICONS = [
  'emoticon-sad-outline',
  'heart-outline',
  'weather-cloudy',
  'sleep',
] as const;

const SUPPORT_ICONS = [
  'sleep',
  'account-group-outline',
  'cup-water',
  'food-apple-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('BabyBlues', {
  fr: {
    badgeText: 'POST-PARTUM • SANTÉ ÉMOTIONNELLE',
    title: 'Baby blues et santé\némotionnelle post-partum',
    subtitle:
      'Comprendre ce qui peut changer émotionnellement après la naissance et savoir quand demander du soutien.',
    metaItems: ['10 min de lecture', 'Article', 'Débutant', 'Contenu validé'],
    introTitle: 'À savoir',
    introText:
      'Après une naissance, il est courant de traverser une période de grande sensibilité émotionnelle. Le baby blues est généralement temporaire, mais une souffrance qui persiste ou s’intensifie mérite une attention professionnelle.',
    contentsEyebrow: 'GUIDE',
    contentsTitle: 'Dans cet article',
    contents: [
      'Comprendre le baby blues',
      'Les signes les plus fréquents',
      'Ce qui aide au quotidien',
      'Baby blues ou dépression post-partum ?',
      'Quand demander de l’aide',
      'À retenir',
    ],
    section1Kicker: 'COMPRENDRE',
    section1Title: 'Qu’est-ce que le baby blues ?',
    section1Body1:
      'Le baby blues correspond à une période de changements émotionnels qui peut survenir dans les premiers jours après la naissance. Les variations hormonales, la fatigue, le manque de sommeil et l’adaptation à cette nouvelle étape peuvent contribuer à cette sensibilité.',
    section1Body2:
      'Ce n’est pas un échec et cela ne signifie pas que l’on est une mauvaise mère. Chaque personne vit les premiers jours du post-partum à sa manière.',
    statTitle: 'Un phénomène fréquent',
    statText:
      'Le baby blues est fréquent après l’accouchement et tend à s’améliorer spontanément en quelques jours.',
    section2Kicker: 'LES SIGNES',
    section2Title: 'Ce que l’on peut ressentir',
    section2Body:
      'Les manifestations sont variables. Certaines personnes ressentent surtout de la fatigue et de la sensibilité, tandis que d’autres peuvent avoir des changements d’humeur plus marqués.',
    commonSigns: [
      {
        title: 'Émotivité',
        description:
          'Pleurer plus facilement ou se sentir particulièrement sensible.',
      },
      {
        title: 'Hypersensibilité',
        description:
          'Les émotions peuvent sembler plus fortes et changer rapidement.',
      },
      {
        title: 'Variations d’humeur',
        description:
          'Un sentiment de fragilité peut alterner avec des moments de bien-être.',
      },
      {
        title: 'Fatigue',
        description: 'La fatigue des premiers jours peut amplifier les émotions.',
      },
    ],
    section3Kicker: 'QUOTIDIEN',
    section3Title: 'Ce qui peut aider',
    section3Body:
      'Pendant cette période, les besoins de récupération sont importants. De petites choses simples peuvent rendre les journées plus confortables.',
    dailySupport: [
      {
        title: 'Se reposer',
        description: 'Profiter des moments disponibles pour récupérer.',
      },
      {
        title: 'Accepter de l’aide',
        description: 'Ne pas hésiter à demander du soutien autour de soi.',
      },
      {
        title: 'Boire régulièrement',
        description: 'Garder une hydratation suffisante au cours de la journée.',
      },
      {
        title: 'Manger suffisamment',
        description: 'Privilégier des repas réguliers et simples.',
      },
    ],
    quoteText:
      '« Demander de l’aide pendant le post-partum est une façon de prendre soin de soi et de son bébé. »',
    section4Kicker: 'DIFFÉRENCIER',
    section4Title: 'Baby blues ou dépression post-partum ?',
    section4Body:
      'Le baby blues est généralement bref et s’améliore progressivement. Une dépression post-partum est différente : elle peut être plus persistante, plus intense et avoir un impact important sur le quotidien.',
    compareTitle: 'Deux situations à distinguer',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Souvent bref, avec une amélioration progressive au fil des jours.',
    comparePostpartumTitle: 'Dépression post-partum',
    comparePostpartumText:
      'Peut durer davantage, s’intensifier et nécessiter un accompagnement professionnel.',
    section5Kicker: 'VIGILANCE',
    section5Title: 'Quand demander de l’aide ?',
    section5Body:
      'Il est important de parler à un professionnel de santé si la souffrance émotionnelle ne s’améliore pas, devient plus intense ou commence à compliquer le quotidien.',
    attentionTitle: 'Signaux à surveiller',
    attentionSubtitle: 'Parlez-en à un professionnel si…',
    attentionSigns: [
      'Les symptômes durent plus de deux semaines.',
      'La tristesse ou l’angoisse devient plus intense.',
      'Il devient difficile de s’occuper de soi ou du bébé.',
      'Un sentiment de détresse important apparaît.',
    ],
    professionalTitle: 'Un accompagnement est possible',
    professionalText:
      'Une sage-femme, un médecin, un psychologue ou un autre professionnel de santé peut écouter, évaluer la situation et proposer un accompagnement adapté.',
    tipTitle: 'Bon à savoir',
    tipText:
      'Les émotions du post-partum ne sont pas une mesure de la qualité de ton rôle de mère. Tu as le droit d’avoir besoin de repos, d’écoute et de soutien.',
    section6Kicker: 'ESSENTIEL',
    section6Title: 'À retenir',
    takeaways: [
      'Le baby blues est fréquent après une naissance.',
      'La fatigue et les changements hormonaux peuvent influencer l’humeur.',
      'Le soutien de l’entourage peut faciliter cette période.',
      'Une souffrance persistante ou importante mérite une évaluation professionnelle.',
    ],
    disclaimerText:
      'Cet article a une vocation informative et ne remplace pas un avis médical personnalisé. En cas de doute ou de souffrance importante, adresse-toi à un professionnel de santé.',
    endText: 'Prendre soin de soi fait aussi partie du post-partum.',
    shareTitle: 'Baby blues et santé émotionnelle post-partum',
    shareMessage:
      'Baby blues et santé émotionnelle post-partum — AWA\n\nUn guide pour comprendre les changements émotionnels fréquents après la naissance.',
  },
  en: {
    badgeText: 'POSTPARTUM • EMOTIONAL HEALTH',
    title: 'Baby blues and postpartum\nemotional health',
    subtitle:
      'Understanding what can change emotionally after birth and knowing when to seek support.',
    metaItems: ['10 min read', 'Article', 'Beginner', 'Reviewed content'],
    introTitle: 'Good to know',
    introText:
      'After giving birth, it’s common to go through a period of heightened emotional sensitivity. The baby blues is usually temporary, but distress that persists or intensifies deserves professional attention.',
    contentsEyebrow: 'GUIDE',
    contentsTitle: 'In this article',
    contents: [
      'Understanding the baby blues',
      'The most common signs',
      'What helps day to day',
      'Baby blues or postpartum depression?',
      'When to ask for help',
      'Key takeaways',
    ],
    section1Kicker: 'UNDERSTANDING',
    section1Title: 'What is the baby blues?',
    section1Body1:
      'The baby blues is a period of emotional changes that can occur in the first few days after giving birth. Hormonal shifts, fatigue, lack of sleep, and adjusting to this new stage can all contribute to this sensitivity.',
    section1Body2:
      'This is not a failure and it does not mean you are a bad mother. Everyone experiences the first days of postpartum in their own way.',
    statTitle: 'A common experience',
    statText:
      'The baby blues is common after childbirth and tends to improve on its own within a few days.',
    section2Kicker: 'THE SIGNS',
    section2Title: 'What you may feel',
    section2Body:
      'What people experience varies. Some mainly feel fatigue and sensitivity, while others may have more noticeable mood changes.',
    commonSigns: [
      {
        title: 'Emotionality',
        description: 'Crying more easily or feeling particularly sensitive.',
      },
      {
        title: 'Hypersensitivity',
        description: 'Emotions can feel stronger and shift quickly.',
      },
      {
        title: 'Mood swings',
        description:
          'A sense of fragility can alternate with moments of well-being.',
      },
      {
        title: 'Fatigue',
        description: 'Fatigue from the first days can amplify emotions.',
      },
    ],
    section3Kicker: 'DAY TO DAY',
    section3Title: 'What can help',
    section3Body:
      'During this period, the need for rest is significant. Small, simple things can make the days more comfortable.',
    dailySupport: [
      {
        title: 'Resting',
        description: 'Taking advantage of any free moments to recover.',
      },
      {
        title: 'Accepting help',
        description: 'Don’t hesitate to ask for support from those around you.',
      },
      {
        title: 'Drinking regularly',
        description: 'Staying sufficiently hydrated throughout the day.',
      },
      {
        title: 'Eating enough',
        description: 'Favoring regular, simple meals.',
      },
    ],
    quoteText:
      '“Asking for help during postpartum is a way of taking care of yourself and your baby.”',
    section4Kicker: 'TELLING THEM APART',
    section4Title: 'Baby blues or postpartum depression?',
    section4Body:
      'The baby blues is usually brief and improves gradually. Postpartum depression is different: it can be more persistent, more intense, and have a significant impact on daily life.',
    compareTitle: 'Two situations to distinguish',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Often brief, with gradual improvement over the following days.',
    comparePostpartumTitle: 'Postpartum depression',
    comparePostpartumText:
      'Can last longer, intensify, and require professional support.',
    section5Kicker: 'STAYING ALERT',
    section5Title: 'When to ask for help?',
    section5Body:
      'It’s important to talk to a healthcare professional if the emotional distress doesn’t improve, becomes more intense, or starts to make daily life harder.',
    attentionTitle: 'Warning signs to watch for',
    attentionSubtitle: 'Talk to a professional if…',
    attentionSigns: [
      'Symptoms last more than two weeks.',
      'Sadness or anxiety becomes more intense.',
      'It becomes difficult to take care of yourself or your baby.',
      'A significant feeling of distress appears.',
    ],
    professionalTitle: 'Support is available',
    professionalText:
      'A midwife, doctor, psychologist, or other healthcare professional can listen, assess the situation, and offer appropriate support.',
    tipTitle: 'Good to know',
    tipText:
      'Postpartum emotions are not a measure of how good a mother you are. You have the right to need rest, to be listened to, and to be supported.',
    section6Kicker: 'KEY POINTS',
    section6Title: 'Key takeaways',
    takeaways: [
      'The baby blues is common after giving birth.',
      'Fatigue and hormonal changes can affect mood.',
      'Support from those around you can make this period easier.',
      'Persistent or significant distress deserves a professional evaluation.',
    ],
    disclaimerText:
      'This article is for informational purposes and does not replace personalized medical advice. If in doubt or experiencing significant distress, speak with a healthcare professional.',
    endText: 'Taking care of yourself is also part of postpartum.',
    shareTitle: 'Baby blues and postpartum emotional health',
    shareMessage:
      'Baby blues and postpartum emotional health — AWA\n\nA guide to understanding the emotional changes that are common after giving birth.',
  },
  es: {
    badgeText: 'POSPARTO • SALUD EMOCIONAL',
    title: 'Baby blues y salud\nemocional posparto',
    subtitle:
      'Comprender lo que puede cambiar emocionalmente después del parto y saber cuándo pedir apoyo.',
    metaItems: ['10 min de lectura', 'Artículo', 'Principiante', 'Contenido validado'],
    introTitle: 'DATO ÚTIL',
    introText:
      'Después de un parto, es frecuente atravesar un periodo de gran sensibilidad emocional. El baby blues suele ser temporal, pero un malestar que persiste o se intensifica merece atención profesional.',
    contentsEyebrow: 'GUÍA',
    contentsTitle: 'En este artículo',
    contents: [
      'Comprender el baby blues',
      'Los signos más frecuentes',
      'Lo que ayuda en el día a día',
      '¿Baby blues o depresión posparto?',
      'Cuándo pedir ayuda',
      'Para recordar',
    ],
    section1Kicker: 'COMPRENDER',
    section1Title: '¿Qué es el baby blues?',
    section1Body1:
      'El baby blues corresponde a un periodo de cambios emocionales que puede surgir en los primeros días después del parto. Las variaciones hormonales, la fatiga, la falta de sueño y la adaptación a esta nueva etapa pueden contribuir a esta sensibilidad.',
    section1Body2:
      'Esto no es un fracaso y no significa que seas una mala madre. Cada persona vive los primeros días del posparto a su manera.',
    statTitle: 'Un fenómeno frecuente',
    statText:
      'El baby blues es frecuente después del parto y tiende a mejorar espontáneamente en unos pocos días.',
    section2Kicker: 'LOS SIGNOS',
    section2Title: 'Lo que puedes sentir',
    section2Body:
      'Las manifestaciones son variables. Algunas personas sienten sobre todo fatiga y sensibilidad, mientras que otras pueden tener cambios de humor más marcados.',
    commonSigns: [
      {
        title: 'Emotividad',
        description:
          'Llorar con más facilidad o sentirte especialmente sensible.',
      },
      {
        title: 'Hipersensibilidad',
        description:
          'Las emociones pueden parecer más intensas y cambiar rápidamente.',
      },
      {
        title: 'Cambios de humor',
        description:
          'Una sensación de fragilidad puede alternar con momentos de bienestar.',
      },
      {
        title: 'Fatiga',
        description: 'La fatiga de los primeros días puede amplificar las emociones.',
      },
    ],
    section3Kicker: 'DÍA A DÍA',
    section3Title: 'Lo que puede ayudar',
    section3Body:
      'Durante este periodo, las necesidades de recuperación son importantes. Pequeñas cosas sencillas pueden hacer que los días sean más llevaderos.',
    dailySupport: [
      {
        title: 'Descansar',
        description: 'Aprovechar los momentos disponibles para recuperarte.',
      },
      {
        title: 'Aceptar ayuda',
        description: 'No dudar en pedir apoyo a quienes te rodean.',
      },
      {
        title: 'Beber con regularidad',
        description: 'Mantener una hidratación suficiente a lo largo del día.',
      },
      {
        title: 'Comer lo suficiente',
        description: 'Priorizar comidas regulares y sencillas.',
      },
    ],
    quoteText:
      '«Pedir ayuda durante el posparto es una forma de cuidar de ti misma y de tu bebé.»',
    section4Kicker: 'DIFERENCIAR',
    section4Title: '¿Baby blues o depresión posparto?',
    section4Body:
      'El baby blues suele ser breve y mejora progresivamente. La depresión posparto es diferente: puede ser más persistente, más intensa y tener un impacto importante en el día a día.',
    compareTitle: 'Dos situaciones que distinguir',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'A menudo breve, con una mejora progresiva a lo largo de los días.',
    comparePostpartumTitle: 'Depresión posparto',
    comparePostpartumText:
      'Puede durar más, intensificarse y requerir acompañamiento profesional.',
    section5Kicker: 'VIGILANCIA',
    section5Title: '¿Cuándo pedir ayuda?',
    section5Body:
      'Es importante hablar con un profesional de la salud si el malestar emocional no mejora, se vuelve más intenso o empieza a complicar el día a día.',
    attentionTitle: 'Señales a vigilar',
    attentionSubtitle: 'Habla con un profesional si…',
    attentionSigns: [
      'Los síntomas duran más de dos semanas.',
      'La tristeza o la angustia se vuelve más intensa.',
      'Se vuelve difícil cuidar de ti misma o del bebé.',
      'Aparece una sensación de angustia importante.',
    ],
    professionalTitle: 'Es posible recibir acompañamiento',
    professionalText:
      'Una partera, un médico, un psicólogo u otro profesional de la salud puede escucharte, evaluar la situación y proponer un acompañamiento adaptado.',
    tipTitle: 'DATO ÚTIL',
    tipText:
      'Las emociones del posparto no son una medida de lo buena madre que eres. Tienes derecho a necesitar descanso, a que te escuchen y a recibir apoyo.',
    section6Kicker: 'ESENCIAL',
    section6Title: 'Para recordar',
    takeaways: [
      'El baby blues es frecuente después de un parto.',
      'La fatiga y los cambios hormonales pueden influir en el estado de ánimo.',
      'El apoyo del entorno puede facilitar este periodo.',
      'Un malestar persistente o importante merece una evaluación profesional.',
    ],
    disclaimerText:
      'Este artículo tiene una finalidad informativa y no sustituye una opinión médica personalizada. En caso de duda o de malestar importante, acude a un profesional de la salud.',
    endText: 'Cuidar de ti misma también forma parte del posparto.',
    shareTitle: 'Baby blues y salud emocional posparto',
    shareMessage:
      'Baby blues y salud emocional posparto — AWA\n\nUna guía para comprender los cambios emocionales frecuentes después del parto.',
  },
  it: {
    badgeText: 'POST-PARTUM • BENESSERE EMOTIVO',
    title: 'Baby blues e benessere\nemotivo nel post-partum',
    subtitle: 'Capire cosa può cambiare a livello emotivo dopo il parto e sapere quando cercare sostegno.',
    metaItems: [
      '10 min di lettura',
      'Articolo',
      'Principiante',
      'Contenuto validato',
    ],
    introTitle: 'Da sapere',
    introText: 'Dopo il parto è comune attraversare un periodo di maggiore sensibilità emotiva. Il baby blues di solito è passeggero, ma un malessere che persiste o si intensifica merita l’attenzione di un professionista.',
    contentsEyebrow: 'GUIDA',
    contentsTitle: 'In questo articolo',
    contents: [
      'Capire il baby blues',
      'I segni più comuni',
      'Cosa aiuta ogni giorno',
      'Baby blues o depressione post-partum?',
      'Quando chiedere aiuto',
      'Punti chiave',
    ],
    section1Kicker: 'CAPIRE',
    section1Title: 'Che cos’è il baby blues?',
    section1Body1: 'Il baby blues è un periodo di cambiamenti emotivi che può comparire nei primi giorni dopo il parto. Gli sbalzi ormonali, la stanchezza, la mancanza di sonno e l’adattamento a questa nuova fase possono contribuire a questa sensibilità.',
    section1Body2: 'Non è un fallimento e non significa che sei una cattiva madre. Ognuna vive i primi giorni del post-partum a modo suo.',
    statTitle: 'Un’esperienza comune',
    statText: 'Il baby blues è comune dopo il parto e tende a migliorare da solo nel giro di qualche giorno.',
    section2Kicker: 'I SEGNI',
    section2Title: 'Cosa potresti provare',
    section2Body: 'Ciò che si vive varia da persona a persona. Alcune avvertono soprattutto stanchezza e sensibilità, altre possono avere sbalzi d’umore più evidenti.',
    commonSigns: [
      {
        title: 'Emotività',
        description: 'Piangere più facilmente o sentirsi particolarmente sensibili.',
      },
      {
        title: 'Ipersensibilità',
        description: 'Le emozioni possono sembrare più forti e cambiare rapidamente.',
      },
      {
        title: 'Sbalzi d’umore',
        description: 'Una sensazione di fragilità può alternarsi a momenti di benessere.',
      },
      {
        title: 'Stanchezza',
        description: 'La stanchezza dei primi giorni può amplificare le emozioni.',
      },
    ],
    section3Kicker: 'OGNI GIORNO',
    section3Title: 'Cosa può aiutare',
    section3Body: 'In questo periodo il bisogno di riposo è importante. Piccole cose semplici possono rendere le giornate più confortevoli.',
    dailySupport: [
      {
        title: 'Riposare',
        description: 'Approfittare di ogni momento libero per recuperare le forze.',
      },
      {
        title: 'Accettare aiuto',
        description: 'Non esitare a chiedere sostegno alle persone intorno a te.',
      },
      {
        title: 'Bere regolarmente',
        description: 'Mantenersi sufficientemente idratata durante la giornata.',
      },
      {
        title: 'Mangiare abbastanza',
        description: 'Privilegiare pasti regolari e semplici.',
      },
    ],
    quoteText: '“Chiedere aiuto nel post-partum è un modo per prenderti cura di te e del tuo bambino.”',
    section4Kicker: 'DISTINGUERE',
    section4Title: 'Baby blues o depressione post-partum?',
    section4Body: 'Il baby blues di solito è breve e migliora gradualmente. La depressione post-partum è diversa: può essere più persistente, più intensa e avere un impatto significativo sulla vita quotidiana.',
    compareTitle: 'Due situazioni da distinguere',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText: 'Spesso breve, con un miglioramento graduale nei giorni successivi.',
    comparePostpartumTitle: 'Depressione post-partum',
    comparePostpartumText: 'Può durare più a lungo, intensificarsi e richiedere un sostegno professionale.',
    section5Kicker: 'RESTARE ATTENTE',
    section5Title: 'Quando chiedere aiuto?',
    section5Body: 'È importante parlare con un professionista sanitario se il malessere emotivo non migliora, diventa più intenso o inizia a rendere più difficile la vita quotidiana.',
    attentionTitle: 'Segnali a cui prestare attenzione',
    attentionSubtitle: 'Parlane con un professionista se…',
    attentionSigns: [
      'I sintomi durano più di due settimane.',
      'La tristezza o l’ansia diventano più intense.',
      'Diventa difficile prenderti cura di te o del tuo bambino.',
      'Compare una forte sensazione di sofferenza.',
    ],
    professionalTitle: 'Un sostegno è disponibile',
    professionalText: 'Un’ostetrica, un medico, una psicologa o un altro professionista sanitario può ascoltarti, valutare la situazione e proporti un sostegno adeguato.',
    tipTitle: 'Da sapere',
    tipText: 'Le emozioni del post-partum non misurano quanto sei una brava madre. Hai il diritto di avere bisogno di riposo, di essere ascoltata e di essere sostenuta.',
    section6Kicker: 'PUNTI CHIAVE',
    section6Title: 'Punti chiave',
    takeaways: [
      'Il baby blues è comune dopo il parto.',
      'La stanchezza e i cambiamenti ormonali possono influire sull’umore.',
      'Il sostegno delle persone che ti circondano può rendere questo periodo più facile.',
      'Un malessere persistente o importante merita una valutazione professionale.',
    ],
    disclaimerText: 'Questo articolo ha scopo informativo e non sostituisce un parere medico personalizzato. In caso di dubbi o di forte sofferenza, parlane con un professionista sanitario.',
    endText: 'Prendersi cura di sé fa parte anche del post-partum.',
    shareTitle: 'Baby blues e benessere emotivo nel post-partum',
    shareMessage: 'Baby blues e benessere emotivo nel post-partum — AWA\n\nUna guida per capire i cambiamenti emotivi comuni dopo il parto.',
  },
  tr: {
    badgeText: 'DOĞUM SONRASI • DUYGUSAL SAĞLIK',
    title: 'Bebek hüznü ve doğum sonrası\nduygusal sağlık',
    subtitle: 'Doğumdan sonra duygusal olarak neyin değişebileceğini anlamak ve ne zaman destek alman gerektiğini bilmek.',
    metaItems: [
      '10 dk okuma',
      'Makale',
      'Başlangıç',
      'Gözden geçirilmiş içerik',
    ],
    introTitle: 'Bilmekte fayda var',
    introText: 'Doğumdan sonra duygusal hassasiyetin arttığı bir dönemden geçmek yaygındır. Bebek hüznü genellikle geçicidir, ancak süren ya da yoğunlaşan sıkıntı profesyonel ilgiyi hak eder.',
    contentsEyebrow: 'REHBER',
    contentsTitle: 'Bu makalede',
    contents: [
      'Bebek hüznünü anlamak',
      'En sık görülen belirtiler',
      'Günlük hayatta ne işe yarar',
      'Bebek hüznü mü, doğum sonrası depresyon mu?',
      'Ne zaman yardım istemeli',
      'Önemli çıkarımlar',
    ],
    section1Kicker: 'ANLAMAK',
    section1Title: 'Bebek hüznü nedir?',
    section1Body1: 'Bebek hüznü, doğumdan sonraki ilk günlerde ortaya çıkabilen duygusal değişimlerin yaşandığı bir dönemdir. Hormonal değişimler, yorgunluk, uykusuzluk ve bu yeni döneme uyum sağlamak bu hassasiyete katkıda bulunabilir.',
    section1Body2: 'Bu bir başarısızlık değildir ve kötü bir anne olduğun anlamına gelmez. Doğum sonrasının ilk günlerini herkes kendine özgü bir biçimde yaşar.',
    statTitle: 'Yaygın bir deneyim',
    statText: 'Bebek hüznü doğumdan sonra yaygındır ve birkaç gün içinde kendiliğinden düzelme eğilimindedir.',
    section2Kicker: 'BELİRTİLER',
    section2Title: 'Neler hissedebilirsin',
    section2Body: 'Yaşananlar kişiden kişiye değişir. Bazıları esas olarak yorgunluk ve hassasiyet hissederken, bazılarında ruh hali değişimleri daha belirgin olabilir.',
    commonSigns: [
      {
        title: 'Duygusallık',
        description: 'Daha kolay ağlamak ya da özellikle hassas hissetmek.',
      },
      {
        title: 'Aşırı hassasiyet',
        description: 'Duygular daha güçlü hissedilebilir ve hızla değişebilir.',
      },
      {
        title: 'Ruh hali dalgalanmaları',
        description: 'Kırılganlık hissi, iyi hissettiğin anlarla dönüşümlü olarak yaşanabilir.',
      },
      {
        title: 'Yorgunluk',
        description: 'İlk günlerin yorgunluğu duyguları güçlendirebilir.',
      },
    ],
    section3Kicker: 'GÜNLÜK HAYAT',
    section3Title: 'Neler yardımcı olabilir',
    section3Body: 'Bu dönemde dinlenme ihtiyacı büyüktür. Küçük ve basit şeyler günleri daha rahat geçirmene yardımcı olabilir.',
    dailySupport: [
      {
        title: 'Dinlenmek',
        description: 'Boş kalan her anı toparlanmak için değerlendirmek.',
      },
      {
        title: 'Yardımı kabul etmek',
        description: 'Çevrendekilerden destek istemekten çekinme.',
      },
      {
        title: 'Düzenli su içmek',
        description: 'Gün boyunca yeterince sıvı almak.',
      },
      {
        title: 'Yeterince yemek',
        description: 'Düzenli ve basit öğünleri tercih etmek.',
      },
    ],
    quoteText: '“Doğum sonrasında yardım istemek, kendine ve bebeğine iyi bakmanın bir yoludur.”',
    section4Kicker: 'AYIRT ETMEK',
    section4Title: 'Bebek hüznü mü, doğum sonrası depresyon mu?',
    section4Body: 'Bebek hüznü genellikle kısa sürer ve giderek düzelir. Doğum sonrası depresyon ise farklıdır: daha kalıcı ve daha yoğun olabilir ve günlük hayat üzerinde önemli bir etkisi olabilir.',
    compareTitle: 'Ayırt edilmesi gereken iki durum',
    compareBabyBluesTitle: 'Bebek hüznü',
    compareBabyBluesText: 'Çoğunlukla kısa sürer, sonraki günlerde giderek düzelir.',
    comparePostpartumTitle: 'Doğum sonrası depresyon',
    comparePostpartumText: 'Daha uzun sürebilir, yoğunlaşabilir ve profesyonel destek gerektirebilir.',
    section5Kicker: 'DİKKATLİ OLMAK',
    section5Title: 'Ne zaman yardım istemeli?',
    section5Body: 'Duygusal sıkıntı düzelmiyorsa, yoğunlaşıyorsa ya da günlük hayatı zorlaştırmaya başlıyorsa bir sağlık profesyoneliyle konuşmak önemlidir.',
    attentionTitle: 'Dikkat edilmesi gereken uyarı işaretleri',
    attentionSubtitle: 'Şu durumlarda bir profesyonelle konuş…',
    attentionSigns: [
      'Belirtiler iki haftadan uzun sürüyorsa.',
      'Üzüntü ya da kaygı yoğunlaşıyorsa.',
      'Kendine ya da bebeğine bakmak zorlaşıyorsa.',
      'Belirgin bir sıkıntı hissi ortaya çıkıyorsa.',
    ],
    professionalTitle: 'Destek almak mümkün',
    professionalText: 'Bir ebe, doktor, psikolog ya da başka bir sağlık profesyoneli seni dinleyebilir, durumu değerlendirebilir ve uygun destek önerebilir.',
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Doğum sonrası duygular, ne kadar iyi bir anne olduğunun ölçüsü değildir. Dinlenmeye ihtiyaç duymaya, sözünün dinlenmesine ve desteklenmeye hakkın var.',
    section6Kicker: 'ÖNEMLİ NOKTALAR',
    section6Title: 'Önemli çıkarımlar',
    takeaways: [
      'Bebek hüznü doğumdan sonra yaygındır.',
      'Yorgunluk ve hormonal değişimler ruh halini etkileyebilir.',
      'Çevrendekilerin desteği bu dönemi kolaylaştırabilir.',
      'Süren ya da belirgin sıkıntı profesyonel bir değerlendirmeyi hak eder.',
    ],
    disclaimerText: 'Bu makale bilgilendirme amaçlıdır ve kişiye özel tıbbi tavsiyenin yerini tutmaz. Şüphen varsa ya da belirgin bir sıkıntı yaşıyorsan bir sağlık profesyoneliyle konuş.',
    endText: 'Kendine iyi bakmak da doğum sonrasının bir parçasıdır.',
    shareTitle: 'Bebek hüznü ve doğum sonrası duygusal sağlık',
    shareMessage: 'Bebek hüznü ve doğum sonrası duygusal sağlık — AWA\n\nDoğumdan sonra yaygın olan duygusal değişimleri anlamaya yönelik bir rehber.',
  },
  ru: {
    badgeText: 'ПОСЛЕРОДОВОЙ ПЕРИОД • ЭМОЦИОНАЛЬНОЕ ЗДОРОВЬЕ',
    title: 'Послеродовая хандра и эмоциональное\nздоровье после родов',
    subtitle:
      'Что может меняться эмоционально после родов и как понять, когда стоит обратиться за поддержкой.',
    metaItems: ['10 мин чтения', 'Статья', 'Для начинающих', 'Проверенный материал'],
    introTitle: 'Полезно знать',
    introText:
      'После родов нередко наступает период повышенной эмоциональной чувствительности. Послеродовая хандра («беби-блюз») обычно временная, но тревожное состояние, которое не проходит или усиливается, заслуживает внимания специалиста.',
    contentsEyebrow: 'РУКОВОДСТВО',
    contentsTitle: 'В этой статье',
    contents: [
      'Что такое послеродовая хандра',
      'Самые частые признаки',
      'Что помогает изо дня в день',
      'Послеродовая хандра или послеродовая депрессия?',
      'Когда просить о помощи',
      'Главные выводы',
    ],
    section1Kicker: 'ПОНИМАНИЕ',
    section1Title: 'Что такое послеродовая хандра?',
    section1Body1:
      'Послеродовая хандра — это период эмоциональных перемен, который может возникнуть в первые дни после родов. Гормональные изменения, усталость, недосып и привыкание к новому этапу жизни могут усиливать эту чувствительность.',
    section1Body2:
      'Это не неудача и не означает, что вы плохая мать. Каждая женщина по-своему переживает первые дни после родов.',
    statTitle: 'Распространённое состояние',
    statText:
      'Послеродовая хандра часто встречается после родов и, как правило, проходит сама в течение нескольких дней.',
    section2Kicker: 'ПРИЗНАКИ',
    section2Title: 'Что вы можете чувствовать',
    section2Body:
      'Переживания у всех разные. Одни в основном чувствуют усталость и ранимость, у других заметнее перепады настроения.',
    commonSigns: [
      {
        title: 'Эмоциональность',
        description: 'Слёзы появляются легче, и вы чувствуете себя особенно ранимой.',
      },
      {
        title: 'Повышенная чувствительность',
        description: 'Эмоции могут казаться сильнее и быстро меняться.',
      },
      {
        title: 'Перепады настроения',
        description:
          'Ощущение хрупкости может сменяться минутами хорошего самочувствия.',
      },
      {
        title: 'Усталость',
        description: 'Усталость первых дней может усиливать эмоции.',
      },
    ],
    section3Kicker: 'ИЗО ДНЯ В ДЕНЬ',
    section3Title: 'Что может помочь',
    section3Body:
      'В этот период потребность в отдыхе очень велика. Небольшие простые вещи могут сделать дни комфортнее.',
    dailySupport: [
      {
        title: 'Отдыхать',
        description: 'Использовать любую свободную минуту, чтобы восстановиться.',
      },
      {
        title: 'Принимать помощь',
        description: 'Не стесняйтесь просить поддержки у близких.',
      },
      {
        title: 'Пить регулярно',
        description: 'Достаточно пить в течение дня.',
      },
      {
        title: 'Достаточно есть',
        description: 'Отдавать предпочтение простой еде в привычное время.',
      },
    ],
    quoteText:
      '«Просить о помощи после родов — это способ позаботиться о себе и о своём ребёнке».',
    section4Kicker: 'КАК ОТЛИЧИТЬ',
    section4Title: 'Послеродовая хандра или послеродовая депрессия?',
    section4Body:
      'Послеродовая хандра обычно непродолжительна и постепенно проходит. Послеродовая депрессия — другое состояние: она может быть более стойкой, более выраженной и заметно влиять на повседневную жизнь.',
    compareTitle: 'Две ситуации, которые важно различать',
    compareBabyBluesTitle: 'Послеродовая хандра',
    compareBabyBluesText:
      'Часто непродолжительна, с постепенным улучшением в последующие дни.',
    comparePostpartumTitle: 'Послеродовая депрессия',
    comparePostpartumText:
      'Может длиться дольше, усиливаться и требовать профессиональной поддержки.',
    section5Kicker: 'БУДЬТЕ ВНИМАТЕЛЬНЫ',
    section5Title: 'Когда просить о помощи?',
    section5Body:
      'Важно поговорить с медицинским специалистом, если эмоциональное состояние не улучшается, становится тяжелее или начинает усложнять повседневную жизнь.',
    attentionTitle: 'Тревожные признаки, на которые стоит обратить внимание',
    attentionSubtitle: 'Обратитесь к специалисту, если…',
    attentionSigns: [
      'Симптомы длятся более двух недель.',
      'Грусть или тревога усиливаются.',
      'Становится трудно заботиться о себе или о ребёнке.',
      'Появляется сильное ощущение душевного неблагополучия.',
    ],
    professionalTitle: 'Поддержка доступна',
    professionalText:
      'Акушерка, врач, психолог или другой медицинский специалист может выслушать вас, оценить ситуацию и предложить подходящую поддержку.',
    tipTitle: 'Полезно знать',
    tipText:
      'Эмоции после родов не показывают, насколько вы хорошая мать. Вы имеете право нуждаться в отдыхе, в том, чтобы вас выслушали и поддержали.',
    section6Kicker: 'КЛЮЧЕВЫЕ МОМЕНТЫ',
    section6Title: 'Главные выводы',
    takeaways: [
      'Послеродовая хандра часто встречается после родов.',
      'Усталость и гормональные изменения могут влиять на настроение.',
      'Поддержка близких может облегчить этот период.',
      'Стойкое или выраженное душевное неблагополучие заслуживает профессиональной оценки.',
    ],
    disclaimerText:
      'Эта статья носит информационный характер и не заменяет индивидуальную медицинскую консультацию. Если вы сомневаетесь или испытываете сильное душевное неблагополучие, поговорите с медицинским специалистом.',
    endText: 'Забота о себе — тоже часть послеродового периода.',
    shareTitle: 'Послеродовая хандра и эмоциональное здоровье после родов',
    shareMessage:
      'Послеродовая хандра и эмоциональное здоровье после родов — AWA\n\nРуководство о том, как понять эмоциональные перемены, которые часто бывают после родов.',
  },
  de: {
    badgeText: 'WOCHENBETT • EMOTIONALE GESUNDHEIT',
    title: 'Babyblues und emotionale\nGesundheit im Wochenbett',
    subtitle:
      'Verstehen, was sich nach der Geburt emotional verändern kann, und wissen, wann du dir Unterstützung holen solltest.',
    metaItems: ['10 Min. Lesezeit', 'Artikel', 'Einsteiger', 'Geprüfter Inhalt'],
    introTitle: 'Gut zu wissen',
    introText:
      'Nach der Geburt ist es häufig, eine Zeit mit erhöhter emotionaler Empfindsamkeit zu erleben. Der Babyblues ist meist vorübergehend, doch ein Gefühl der Belastung, das anhält oder stärker wird, verdient fachliche Aufmerksamkeit.',
    contentsEyebrow: 'RATGEBER',
    contentsTitle: 'In diesem Artikel',
    contents: [
      'Den Babyblues verstehen',
      'Die häufigsten Anzeichen',
      'Was im Alltag hilft',
      'Babyblues oder Wochenbettdepression?',
      'Wann du dir Hilfe holen solltest',
      'Das Wichtigste in Kürze',
    ],
    section1Kicker: 'VERSTEHEN',
    section1Title: 'Was ist der Babyblues?',
    section1Body1:
      'Der Babyblues ist eine Phase emotionaler Veränderungen, die in den ersten Tagen nach der Geburt auftreten kann. Hormonelle Umstellungen, Erschöpfung, Schlafmangel und die Anpassung an diese neue Lebensphase können zu dieser Empfindsamkeit beitragen.',
    section1Body2:
      'Das ist kein Versagen und bedeutet nicht, dass du eine schlechte Mutter bist. Jede erlebt die ersten Tage im Wochenbett auf ihre eigene Weise.',
    statTitle: 'Eine häufige Erfahrung',
    statText:
      'Der Babyblues ist nach der Geburt häufig und bessert sich in der Regel innerhalb weniger Tage von selbst.',
    section2Kicker: 'DIE ANZEICHEN',
    section2Title: 'Was du fühlen kannst',
    section2Body:
      'Das Erleben ist unterschiedlich. Manche spüren vor allem Erschöpfung und Empfindsamkeit, andere bemerken deutlichere Stimmungsschwankungen.',
    commonSigns: [
      {
        title: 'Emotionalität',
        description: 'Schneller weinen oder besonders empfindsam sein.',
      },
      {
        title: 'Überempfindlichkeit',
        description: 'Gefühle können stärker wirken und schnell wechseln.',
      },
      {
        title: 'Stimmungsschwankungen',
        description:
          'Ein Gefühl von Zerbrechlichkeit kann sich mit Momenten des Wohlbefindens abwechseln.',
      },
      {
        title: 'Erschöpfung',
        description: 'Die Müdigkeit der ersten Tage kann Gefühle verstärken.',
      },
    ],
    section3Kicker: 'IM ALLTAG',
    section3Title: 'Was helfen kann',
    section3Body:
      'In dieser Zeit ist das Ruhebedürfnis groß. Kleine, einfache Dinge können die Tage angenehmer machen.',
    dailySupport: [
      {
        title: 'Ausruhen',
        description: 'Freie Momente nutzen, um dich zu erholen.',
      },
      {
        title: 'Hilfe annehmen',
        description: 'Zögere nicht, dir Unterstützung von deinem Umfeld zu holen.',
      },
      {
        title: 'Regelmäßig trinken',
        description: 'Über den Tag verteilt ausreichend Flüssigkeit zu dir nehmen.',
      },
      {
        title: 'Genug essen',
        description: 'Regelmäßige, einfache Mahlzeiten bevorzugen.',
      },
    ],
    quoteText:
      '„Sich im Wochenbett Hilfe zu holen, ist eine Art, für sich selbst und für das Baby zu sorgen.“',
    section4Kicker: 'UNTERSCHEIDEN',
    section4Title: 'Babyblues oder Wochenbettdepression?',
    section4Body:
      'Der Babyblues ist meist kurz und bessert sich nach und nach. Eine Wochenbettdepression ist anders: Sie kann länger anhalten, stärker sein und den Alltag deutlich beeinträchtigen.',
    compareTitle: 'Zwei Situationen, die man unterscheiden sollte',
    compareBabyBluesTitle: 'Babyblues',
    compareBabyBluesText:
      'Oft von kurzer Dauer, mit allmählicher Besserung in den folgenden Tagen.',
    comparePostpartumTitle: 'Wochenbettdepression',
    comparePostpartumText:
      'Kann länger dauern, stärker werden und professionelle Unterstützung erfordern.',
    section5Kicker: 'AUFMERKSAM BLEIBEN',
    section5Title: 'Wann solltest du dir Hilfe holen?',
    section5Body:
      'Es ist wichtig, mit medizinischem Fachpersonal zu sprechen, wenn sich die emotionale Belastung nicht bessert, stärker wird oder den Alltag zunehmend erschwert.',
    attentionTitle: 'Warnzeichen, auf die du achten solltest',
    attentionSubtitle: 'Sprich mit einer Fachperson, wenn …',
    attentionSigns: [
      'Die Beschwerden länger als zwei Wochen anhalten.',
      'Traurigkeit oder Angst stärker werden.',
      'Es dir schwerfällt, für dich selbst oder für dein Baby zu sorgen.',
      'Ein starkes Gefühl der Belastung auftritt.',
    ],
    professionalTitle: 'Unterstützung ist da',
    professionalText:
      'Eine Hebamme, eine Ärztin oder ein Arzt, eine Psychologin oder ein Psychologe oder anderes medizinisches Fachpersonal kann dir zuhören, die Situation einschätzen und passende Unterstützung anbieten.',
    tipTitle: 'Gut zu wissen',
    tipText:
      'Deine Gefühle im Wochenbett sagen nichts darüber aus, wie gut du als Mutter bist. Du hast das Recht, Ruhe zu brauchen, gehört zu werden und Unterstützung zu bekommen.',
    section6Kicker: 'KERNPUNKTE',
    section6Title: 'Das Wichtigste in Kürze',
    takeaways: [
      'Der Babyblues ist nach der Geburt häufig.',
      'Erschöpfung und hormonelle Veränderungen können die Stimmung beeinflussen.',
      'Die Unterstützung deines Umfelds kann diese Zeit erleichtern.',
      'Anhaltende oder starke Belastung verdient eine fachliche Abklärung.',
    ],
    disclaimerText:
      'Dieser Artikel dient der Information und ersetzt keine individuelle ärztliche Beratung. Bei Zweifeln oder starker Belastung sprich mit medizinischem Fachpersonal.',
    endText: 'Für dich selbst zu sorgen gehört auch zum Wochenbett.',
    shareTitle: 'Babyblues und emotionale Gesundheit im Wochenbett',
    shareMessage:
      'Babyblues und emotionale Gesundheit im Wochenbett — AWA\n\nEin Ratgeber, um die emotionalen Veränderungen zu verstehen, die nach der Geburt häufig sind.',
  },
  zh: {
      badgeText: '产后 • 情绪健康',
      title: '产后情绪低落\n与产后情绪健康',
      subtitle: '了解分娩后情绪可能出现的变化，以及何时该寻求支持。',
      metaItems: [
        '阅读约 10 分钟',
        '文章',
        '入门',
        '经审阅的内容',
      ],
      introTitle: '小贴士',
      introText: '分娩后，有一段时间情绪变得格外敏感是很常见的。产后情绪低落通常是暂时的，但如果痛苦的感受持续不退或越来越强烈，就值得寻求专业人员的关注。',
      contentsEyebrow: '指南',
      contentsTitle: '本文内容',
      contents: [
        '了解产后情绪低落',
        '最常见的表现',
        '日常生活中有哪些帮助',
        '产后情绪低落，还是产后抑郁？',
        '何时该寻求帮助',
        '要点回顾',
      ],
      section1Kicker: '了解',
      section1Title: '什么是产后情绪低落？',
      section1Body1: '产后情绪低落是指分娩后头几天里可能出现的一段情绪波动期。激素变化、疲惫、睡眠不足，以及对新阶段的适应，都可能让你变得更加敏感。',
      section1Body2: '这不是失败，也不意味着你不是一个好妈妈。每个人度过产后最初几天的方式都不一样。',
      statTitle: '很常见的经历',
      statText: '产后情绪低落在分娩后很常见，通常几天内会自行好转。',
      section2Kicker: '表现',
      section2Title: '你可能会有的感受',
      section2Body: '每个人的感受不尽相同。有些人主要感到疲惫和敏感，也有些人的情绪变化会更明显。',
      commonSigns: [
        {
          title: '容易动情',
          description: '更容易哭泣，或者感觉特别敏感。',
        },
        {
          title: '过度敏感',
          description: '情绪可能显得更强烈，而且变化很快。',
        },
        {
          title: '情绪起伏',
          description: '脆弱的感觉可能与心情舒畅的时刻交替出现。',
        },
        {
          title: '疲惫',
          description: '最初几天积累的疲惫会放大情绪。',
        },
      ],
      section3Kicker: '日常',
      section3Title: '有哪些帮助',
      section3Body: '这段时间里，身体非常需要休息。一些简单的小事就能让日子过得更舒适。',
      dailySupport: [
        {
          title: '休息',
          description: '利用每一段空闲时间恢复体力。',
        },
        {
          title: '接受帮助',
          description: '不要犹豫，向身边的人寻求支持。',
        },
        {
          title: '规律喝水',
          description: '全天保持充足的水分。',
        },
        {
          title: '吃够',
          description: '尽量吃规律、简单的饭菜。',
        },
      ],
      quoteText: '“在产后寻求帮助，是照顾自己和宝宝的一种方式。”',
      section4Kicker: '如何区分',
      section4Title: '产后情绪低落，还是产后抑郁？',
      section4Body: '产后情绪低落通常持续时间短，并会逐渐好转。产后抑郁则不同：它可能持续更久、程度更重，并对日常生活造成明显影响。',
      compareTitle: '需要区分的两种情况',
      compareBabyBluesTitle: '产后情绪低落',
      compareBabyBluesText: '通常持续时间短，在随后的几天里逐渐好转。',
      comparePostpartumTitle: '产后抑郁',
      comparePostpartumText: '可能持续更久、逐渐加重，需要专业人员的支持。',
      section5Kicker: '保持留意',
      section5Title: '何时该寻求帮助？',
      section5Body: '如果情绪上的痛苦没有好转、变得更强烈，或者开始让日常生活更加吃力，请务必与医疗专业人员谈一谈。',
      attentionTitle: '需要留意的警示信号',
      attentionSubtitle: '出现以下情况，请与专业人员谈谈…',
      attentionSigns: [
        '症状持续超过两周。',
        '悲伤或焦虑变得更强烈。',
        '照顾自己或宝宝变得困难。',
        '出现明显的痛苦感受。',
      ],
      professionalTitle: '你可以得到支持',
      professionalText: '助产士、医生、心理咨询师或其他医疗专业人员可以倾听你、评估你的情况，并提供合适的支持。',
      tipTitle: '小贴士',
      tipText: '产后的情绪并不能衡量你是不是一个好妈妈。你有权需要休息、被倾听、被支持。',
      section6Kicker: '要点',
      section6Title: '要点回顾',
      takeaways: [
        '产后情绪低落在分娩后很常见。',
        '疲惫和激素变化都可能影响情绪。',
        '身边人的支持可以让这段时期更轻松。',
        '持续或明显的痛苦值得接受专业评估。',
      ],
      disclaimerText: '本文仅供参考，不能替代个性化的医疗建议。如有疑虑或感到明显的痛苦，请咨询医疗专业人员。',
      endText: '照顾好自己，也是产后的一部分。',
      shareTitle: '产后情绪低落与产后情绪健康',
      shareMessage: '产后情绪低落与产后情绪健康 — AWA\n\n一份帮助你了解分娩后常见情绪变化的指南。',
    },
  id: {
    badgeText: 'PASCAPERSALINAN • KESEHATAN EMOSIONAL',
    title: 'Baby blues dan kesehatan emosional\npascapersalinan',
    subtitle: 'Memahami apa saja yang bisa berubah secara emosional setelah melahirkan dan kapan perlu mencari dukungan.',
    metaItems: [
      '10 menit baca',
      'Artikel',
      'Pemula',
      'Konten telah ditinjau',
    ],
    introTitle: 'Perlu diketahui',
    introText: 'Setelah melahirkan, wajar jika kamu melewati masa dengan kepekaan emosi yang meningkat. Baby blues biasanya bersifat sementara, tetapi tekanan batin yang berlanjut atau makin berat perlu mendapat perhatian profesional.',
    contentsEyebrow: 'PANDUAN',
    contentsTitle: 'Dalam artikel ini',
    contents: [
      'Memahami baby blues',
      'Tanda yang paling umum',
      'Apa yang membantu sehari-hari',
      'Baby blues atau depresi pascapersalinan?',
      'Kapan perlu meminta bantuan',
      'Poin-poin penting',
    ],
    section1Kicker: 'MEMAHAMI',
    section1Title: 'Apa itu baby blues?',
    section1Body1: 'Baby blues adalah masa perubahan emosi yang bisa terjadi dalam beberapa hari pertama setelah melahirkan. Perubahan hormon, kelelahan, kurang tidur, dan penyesuaian terhadap tahap baru ini semuanya bisa berperan dalam kepekaan tersebut.',
    section1Body2: 'Ini bukan kegagalan dan bukan berarti kamu ibu yang buruk. Setiap orang menjalani hari-hari pertama pascapersalinan dengan caranya sendiri.',
    statTitle: 'Pengalaman yang umum',
    statText: 'Baby blues umum terjadi setelah melahirkan dan cenderung membaik dengan sendirinya dalam beberapa hari.',
    section2Kicker: 'TANDA-TANDANYA',
    section2Title: 'Apa yang mungkin kamu rasakan',
    section2Body: 'Pengalaman setiap orang berbeda-beda. Sebagian terutama merasakan kelelahan dan kepekaan, sementara yang lain mungkin mengalami perubahan suasana hati yang lebih terasa.',
    commonSigns: [
      {
        title: 'Mudah emosional',
        description: 'Lebih mudah menangis atau merasa sangat sensitif.',
      },
      {
        title: 'Hipersensitivitas',
        description: 'Emosi bisa terasa lebih kuat dan berubah dengan cepat.',
      },
      {
        title: 'Suasana hati berubah-ubah',
        description: 'Perasaan rapuh bisa berganti-ganti dengan saat-saat merasa baik.',
      },
      {
        title: 'Kelelahan',
        description: 'Kelelahan dari hari-hari pertama bisa memperkuat emosi.',
      },
    ],
    section3Kicker: 'SEHARI-HARI',
    section3Title: 'Apa yang bisa membantu',
    section3Body: 'Pada masa ini, kebutuhan akan istirahat sangat besar. Hal-hal kecil dan sederhana bisa membuat hari-harimu lebih nyaman.',
    dailySupport: [
      {
        title: 'Beristirahat',
        description: 'Manfaatkan setiap waktu luang untuk memulihkan diri.',
      },
      {
        title: 'Menerima bantuan',
        description: 'Jangan ragu meminta dukungan dari orang-orang di sekitarmu.',
      },
      {
        title: 'Minum secara teratur',
        description: 'Menjaga asupan air yang cukup sepanjang hari.',
      },
      {
        title: 'Makan secukupnya',
        description: 'Utamakan makanan yang sederhana dan teratur.',
      },
    ],
    quoteText: '“Meminta bantuan di masa pascapersalinan adalah cara untuk merawat dirimu dan bayimu.”',
    section4Kicker: 'MEMBEDAKANNYA',
    section4Title: 'Baby blues atau depresi pascapersalinan?',
    section4Body: 'Baby blues biasanya singkat dan membaik secara bertahap. Depresi pascapersalinan berbeda: bisa lebih menetap, lebih berat, dan berdampak besar pada kehidupan sehari-hari.',
    compareTitle: 'Dua keadaan yang perlu dibedakan',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText: 'Biasanya singkat, dengan perbaikan bertahap dalam beberapa hari berikutnya.',
    comparePostpartumTitle: 'Depresi pascapersalinan',
    comparePostpartumText: 'Bisa berlangsung lebih lama, makin berat, dan membutuhkan dukungan profesional.',
    section5Kicker: 'TETAP WASPADA',
    section5Title: 'Kapan perlu meminta bantuan?',
    section5Body: 'Penting untuk berbicara dengan tenaga kesehatan jika tekanan emosional tidak membaik, menjadi lebih berat, atau mulai mempersulit kehidupan sehari-hari.',
    attentionTitle: 'Tanda yang perlu diwaspadai',
    attentionSubtitle: 'Bicaralah dengan tenaga profesional jika…',
    attentionSigns: [
      'Gejala berlangsung lebih dari dua minggu.',
      'Kesedihan atau kecemasan menjadi lebih berat.',
      'Menjadi sulit untuk merawat dirimu atau bayimu.',
      'Muncul perasaan tertekan yang berat.',
    ],
    professionalTitle: 'Dukungan tersedia untukmu',
    professionalText: 'Bidan, dokter, psikolog, atau tenaga kesehatan lainnya bisa mendengarkanmu, menilai keadaanmu, dan menawarkan dukungan yang sesuai.',
    tipTitle: 'Perlu diketahui',
    tipText: 'Emosi di masa pascapersalinan bukan ukuran seberapa baik kamu sebagai ibu. Kamu berhak membutuhkan istirahat, didengarkan, dan didukung.',
    section6Kicker: 'POIN PENTING',
    section6Title: 'Poin-poin penting',
    takeaways: [
      'Baby blues umum terjadi setelah melahirkan.',
      'Kelelahan dan perubahan hormon bisa memengaruhi suasana hati.',
      'Dukungan dari orang-orang di sekitarmu bisa membuat masa ini lebih mudah.',
      'Tekanan batin yang menetap atau berat perlu dievaluasi oleh tenaga profesional.',
    ],
    disclaimerText: 'Artikel ini bersifat informatif dan tidak menggantikan nasihat medis yang dipersonalisasi. Jika ragu atau mengalami tekanan batin yang berat, bicaralah dengan tenaga kesehatan.',
    endText: 'Merawat dirimu sendiri juga bagian dari masa pascapersalinan.',
    shareTitle: 'Baby blues dan kesehatan emosional pascapersalinan',
    shareMessage: 'Baby blues dan kesehatan emosional pascapersalinan — AWA\n\nPanduan untuk memahami perubahan emosi yang umum terjadi setelah melahirkan.',
  },
  hi: {
    badgeText: 'प्रसवोत्तर • भावनात्मक स्वास्थ्य',
    title: 'बेबी ब्लूज़ और प्रसवोत्तर\nभावनात्मक स्वास्थ्य',
    subtitle: 'जानें कि बच्चे के जन्म के बाद भावनात्मक रूप से क्या बदल सकता है और सहारा कब लेना चाहिए।',
    metaItems: [
      '10 मिनट में पढ़ें',
      'लेख',
      'शुरुआती',
      'समीक्षित सामग्री',
    ],
    introTitle: 'जानना ज़रूरी है',
    introText: 'बच्चे को जन्म देने के बाद कुछ समय तक भावनाओं के प्रति ज़्यादा संवेदनशील महसूस करना आम बात है। बेबी ब्लूज़ आमतौर पर अस्थायी होता है, लेकिन जो परेशानी बनी रहे या बढ़ती जाए, उस पर विशेषज्ञ का ध्यान ज़रूरी है।',
    contentsEyebrow: 'गाइड',
    contentsTitle: 'इस लेख में',
    contents: [
      'बेबी ब्लूज़ को समझना',
      'सबसे आम संकेत',
      'रोज़ाना क्या मदद करता है',
      'बेबी ब्लूज़ या प्रसवोत्तर डिप्रेशन?',
      'मदद कब माँगें',
      'मुख्य बातें',
    ],
    section1Kicker: 'समझना',
    section1Title: 'बेबी ब्लूज़ क्या है?',
    section1Body1: 'बेबी ब्लूज़ भावनात्मक बदलावों का एक दौर है, जो बच्चे के जन्म के बाद पहले कुछ दिनों में आ सकता है। हार्मोन में बदलाव, थकान, नींद की कमी और इस नए पड़ाव से तालमेल बिठाना, ये सब इस संवेदनशीलता का कारण बन सकते हैं।',
    section1Body2: 'यह कोई कमी नहीं है, और इसका मतलब यह नहीं कि आप एक बुरी माँ हैं। प्रसव के बाद के पहले दिन हर महिला अपने तरीके से जीती है।',
    statTitle: 'एक आम अनुभव',
    statText: 'बेबी ब्लूज़ प्रसव के बाद आम है और आमतौर पर कुछ दिनों में अपने आप ठीक होने लगता है।',
    section2Kicker: 'संकेत',
    section2Title: 'आप क्या महसूस कर सकती हैं',
    section2Body: 'अनुभव हर किसी का अलग होता है। कुछ महिलाओं को मुख्य रूप से थकान और संवेदनशीलता महसूस होती है, जबकि कुछ को मूड में ज़्यादा साफ़ बदलाव दिख सकते हैं।',
    commonSigns: [
      {
        title: 'भावुकता',
        description: 'आसानी से रो पड़ना या खुद को बहुत संवेदनशील महसूस करना।',
      },
      {
        title: 'अति संवेदनशीलता',
        description: 'भावनाएँ ज़्यादा तीव्र लग सकती हैं और जल्दी बदल सकती हैं।',
      },
      {
        title: 'मूड में उतार-चढ़ाव',
        description: 'कमज़ोरी का एहसास और अच्छा महसूस करने के पल बारी-बारी से आ सकते हैं।',
      },
      {
        title: 'थकान',
        description: 'शुरुआती दिनों की थकान भावनाओं को और बढ़ा सकती है।',
      },
    ],
    section3Kicker: 'रोज़मर्रा',
    section3Title: 'क्या मदद कर सकता है',
    section3Body: 'इस दौरान आराम की बहुत ज़रूरत होती है। छोटी-छोटी आसान बातें दिनों को ज़्यादा आरामदेह बना सकती हैं।',
    dailySupport: [
      {
        title: 'आराम करना',
        description: 'जब भी थोड़ा समय मिले, उसका इस्तेमाल सुस्ताने और ताक़त वापस पाने में करें।',
      },
      {
        title: 'मदद स्वीकार करना',
        description: 'अपने आस-पास के लोगों से सहारा माँगने में झिझकें नहीं।',
      },
      {
        title: 'नियमित रूप से पानी पीना',
        description: 'पूरे दिन शरीर में पर्याप्त पानी बनाए रखें।',
      },
      {
        title: 'पर्याप्त खाना',
        description: 'नियमित और सादे भोजन को प्राथमिकता दें।',
      },
    ],
    quoteText: '“प्रसव के बाद मदद माँगना खुद की और अपने बच्चे की देखभाल करने का एक तरीका है।”',
    section4Kicker: 'फ़र्क़ पहचानना',
    section4Title: 'बेबी ब्लूज़ या प्रसवोत्तर डिप्रेशन?',
    section4Body: 'बेबी ब्लूज़ आमतौर पर थोड़े समय का होता है और धीरे-धीरे ठीक होता है। प्रसवोत्तर डिप्रेशन अलग है: यह ज़्यादा समय तक रह सकता है, ज़्यादा तीव्र हो सकता है और रोज़मर्रा की ज़िंदगी पर गहरा असर डाल सकता है।',
    compareTitle: 'दो अलग स्थितियाँ',
    compareBabyBluesTitle: 'बेबी ब्लूज़',
    compareBabyBluesText: 'अक्सर थोड़े समय का, और अगले कुछ दिनों में धीरे-धीरे सुधार के साथ।',
    comparePostpartumTitle: 'प्रसवोत्तर डिप्रेशन',
    comparePostpartumText: 'ज़्यादा समय तक रह सकता है, बढ़ सकता है और इसमें विशेषज्ञ की मदद की ज़रूरत पड़ सकती है।',
    section5Kicker: 'सतर्क रहना',
    section5Title: 'मदद कब माँगें?',
    section5Body: 'अगर भावनात्मक परेशानी ठीक नहीं हो रही, बढ़ती जा रही है, या रोज़मर्रा के काम मुश्किल करने लगी है, तो किसी स्वास्थ्य विशेषज्ञ से बात करना ज़रूरी है।',
    attentionTitle: 'इन चेतावनी संकेतों पर ध्यान दें',
    attentionSubtitle: 'विशेषज्ञ से बात करें अगर…',
    attentionSigns: [
      'लक्षण दो सप्ताह से ज़्यादा समय तक रहें।',
      'उदासी या चिंता और तीव्र हो जाए।',
      'अपना या अपने बच्चे का ध्यान रखना मुश्किल हो जाए।',
      'गहरी बेचैनी या परेशानी का एहसास होने लगे।',
    ],
    professionalTitle: 'सहारा उपलब्ध है',
    professionalText: 'दाई-नर्स (मिडवाइफ़), डॉक्टर, मनोवैज्ञानिक या कोई अन्य स्वास्थ्य विशेषज्ञ आपकी बात सुन सकते हैं, स्थिति को परख सकते हैं और सही सहारा दे सकते हैं।',
    tipTitle: 'जानना ज़रूरी है',
    tipText: 'प्रसव के बाद की भावनाएँ यह नहीं बतातीं कि आप कितनी अच्छी माँ हैं। आपको आराम की ज़रूरत होने, अपनी बात सुने जाने और सहारा पाने का पूरा हक़ है।',
    section6Kicker: 'ज़रूरी बातें',
    section6Title: 'मुख्य बातें',
    takeaways: [
      'बच्चे के जन्म के बाद बेबी ब्लूज़ आम है।',
      'थकान और हार्मोन में बदलाव मूड पर असर डाल सकते हैं।',
      'आस-पास के लोगों का सहारा इस दौर को आसान बना सकता है।',
      'लगातार बनी रहने वाली या गहरी परेशानी की विशेषज्ञ से जाँच करवानी चाहिए।',
    ],
    disclaimerText: 'यह लेख केवल जानकारी के लिए है और व्यक्तिगत चिकित्सकीय सलाह का विकल्प नहीं है। शंका होने पर या गहरी परेशानी महसूस होने पर किसी स्वास्थ्य विशेषज्ञ से बात करें।',
    endText: 'अपना ख्याल रखना भी प्रसव के बाद की देखभाल का हिस्सा है।',
    shareTitle: 'बेबी ब्लूज़ और प्रसवोत्तर भावनात्मक स्वास्थ्य',
    shareMessage: 'बेबी ब्लूज़ और प्रसवोत्तर भावनात्मक स्वास्थ्य — AWA\n\nबच्चे के जन्म के बाद होने वाले आम भावनात्मक बदलावों को समझने के लिए एक गाइड।',
  },
  sq: {
    badgeText: 'PAS LINDJES • SHËNDETI EMOCIONAL',
    title: 'Baby blues dhe shëndeti\nemocional pas lindjes',
    subtitle: 'Të kuptosh çfarë mund të ndryshojë emocionalisht pas lindjes dhe të dish kur të kërkosh mbështetje.',
    metaItems: [
      '10 min lexim',
      'Artikull',
      'Fillestar',
      'Përmbajtje e shqyrtuar',
    ],
    introTitle: 'Mirë është ta dish',
    introText: 'Pas lindjes, është e zakonshme të kalosh një periudhë me ndjeshmëri emocionale më të lartë. Baby blues zakonisht është kalimtar, por shqetësimi që vazhdon ose shtohet meriton vëmendje profesionale.',
    contentsEyebrow: 'UDHËZUES',
    contentsTitle: 'Në këtë artikull',
    contents: [
      'Të kuptosh baby blues',
      'Shenjat më të zakonshme',
      'Çfarë ndihmon çdo ditë',
      'Baby blues apo depresion pas lindjes?',
      'Kur të kërkosh ndihmë',
      'Pikat kryesore',
    ],
    section1Kicker: 'TË KUPTOSH',
    section1Title: 'Çfarë është baby blues?',
    section1Body1: 'Baby blues është një periudhë ndryshimesh emocionale që mund të shfaqet gjatë ditëve të para pas lindjes. Ndryshimet hormonale, lodhja, mungesa e gjumit dhe përshtatja me këtë fazë të re mund të kontribuojnë të gjitha në këtë ndjeshmëri.',
    section1Body2: 'Kjo nuk është dështim dhe nuk do të thotë se je nënë e keqe. Çdo grua i jeton ditët e para pas lindjes në mënyrën e vet.',
    statTitle: 'Një përvojë e zakonshme',
    statText: 'Baby blues është i zakonshëm pas lindjes dhe zakonisht përmirësohet vetë brenda pak ditësh.',
    section2Kicker: 'SHENJAT',
    section2Title: 'Çfarë mund të ndjesh',
    section2Body: 'Përvoja ndryshon nga njëra te tjetra. Disa ndiejnë kryesisht lodhje dhe ndjeshmëri, ndërsa të tjera mund të kenë ndryshime më të dukshme të gjendjes shpirtërore.',
    commonSigns: [
      {
        title: 'Emocionalitet',
        description: 'Qan më lehtë ose ndihesh veçanërisht e ndjeshme.',
      },
      {
        title: 'Hipersensibilitet',
        description: 'Emocionet mund të duken më të forta dhe të ndryshojnë shpejt.',
      },
      {
        title: 'Luhatje të gjendjes shpirtërore',
        description: 'Ndjenja e brishtësisë mund të ndërrojë me çaste mirëqenieje.',
      },
      {
        title: 'Lodhje',
        description: 'Lodhja e ditëve të para mund t’i shtojë emocionet.',
      },
    ],
    section3Kicker: 'ÇDO DITË',
    section3Title: 'Çfarë mund të ndihmojë',
    section3Body: 'Në këtë periudhë, nevoja për pushim është e madhe. Gjëra të vogla e të thjeshta mund t’i bëjnë ditët më të rehatshme.',
    dailySupport: [
      {
        title: 'Pushimi',
        description: 'Shfrytëzo çdo çast të lirë për t’u rikuperuar.',
      },
      {
        title: 'Pranimi i ndihmës',
        description: 'Mos ngurro të kërkosh mbështetje nga ata që të rrethojnë.',
      },
      {
        title: 'Pirja e ujit rregullisht',
        description: 'Mbaju mirë e hidratuar gjatë gjithë ditës.',
      },
      {
        title: 'Ngrënia e mjaftueshme',
        description: 'Zgjidh vakte të rregullta dhe të thjeshta.',
      },
    ],
    quoteText: '“Të kërkosh ndihmë pas lindjes është një mënyrë për të kujdesur për veten dhe për bebin tënd.”',
    section4Kicker: 'SI TË NDAHEN',
    section4Title: 'Baby blues apo depresion pas lindjes?',
    section4Body: 'Baby blues zakonisht është i shkurtër dhe përmirësohet gradualisht. Depresioni pas lindjes është ndryshe: mund të jetë më i qëndrueshëm, më i fortë dhe të ketë ndikim të rëndësishëm në jetën e përditshme.',
    compareTitle: 'Dy situata që duhen dalluar',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText: 'Shpesh i shkurtër, me përmirësim gradual gjatë ditëve në vijim.',
    comparePostpartumTitle: 'Depresioni pas lindjes',
    comparePostpartumText: 'Mund të zgjasë më shumë, të shtohet dhe të kërkojë mbështetje profesionale.',
    section5Kicker: 'MBAJ SYTË HAPUR',
    section5Title: 'Kur të kërkosh ndihmë?',
    section5Body: 'Është e rëndësishme të flasësh me një profesionist të shëndetësisë nëse shqetësimi emocional nuk përmirësohet, bëhet më i fortë ose fillon ta vështirësojë jetën e përditshme.',
    attentionTitle: 'Shenja për t’u vëzhguar',
    attentionSubtitle: 'Flit me një profesionist nëse…',
    attentionSigns: [
      'Simptomat zgjasin më shumë se dy javë.',
      'Trishtimi ose ankthi bëhet më i fortë.',
      'Bëhet e vështirë të kujdesesh për veten ose për bebin.',
      'Shfaqet një ndjenjë e fortë shqetësimi.',
    ],
    professionalTitle: 'Mbështetja është e disponueshme',
    professionalText: 'Një mami, mjek, psikolog ose profesionist tjetër i shëndetësisë mund të të dëgjojë, ta vlerësojë situatën dhe të të ofrojë mbështetjen e duhur.',
    tipTitle: 'Mirë është ta dish',
    tipText: 'Emocionet pas lindjes nuk janë masë e asaj sa nënë e mirë je. Ke të drejtë të kesh nevojë për pushim, të dëgjohesh dhe të mbështetesh.',
    section6Kicker: 'PIKAT KRYESORE',
    section6Title: 'Pikat kryesore',
    takeaways: [
      'Baby blues është i zakonshëm pas lindjes.',
      'Lodhja dhe ndryshimet hormonale mund të ndikojnë te gjendja shpirtërore.',
      'Mbështetja nga ata që të rrethojnë mund ta lehtësojë këtë periudhë.',
      'Shqetësimi i vazhdueshëm ose i fortë meriton një vlerësim profesional.',
    ],
    disclaimerText: 'Ky artikull është vetëm për informim dhe nuk zëvendëson këshillën mjekësore të personalizuar. Në rast dyshimi ose shqetësimi të fortë, flit me një profesionist të shëndetësisë.',
    endText: 'Kujdesi për veten është edhe pjesë e periudhës pas lindjes.',
    shareTitle: 'Baby blues dhe shëndeti emocional pas lindjes',
    shareMessage: 'Baby blues dhe shëndeti emocional pas lindjes — AWA\n\nNjë udhëzues për të kuptuar ndryshimet emocionale që janë të zakonshme pas lindjes.',
  },
  ja: {
    badgeText: '産後 • 心の健康',
    title: 'マタニティブルーと\n産後の心の健康',
    subtitle: '出産後に起こりうる心の変化を知り、どんなときに支えを求めればよいかを理解しましょう。',
    metaItems: [
      '読了時間10分',
      '記事',
      '初級',
      '確認済みの内容',
    ],
    introTitle: '知っておきたいこと',
    introText: '出産後は、感情が揺れやすくなる時期を経験することがよくあります。マタニティブルーは通常一時的なものですが、つらさが続いたり強くなったりする場合は、専門家に相談することが大切です。',
    contentsEyebrow: 'ガイド',
    contentsTitle: 'この記事の内容',
    contents: [
      'マタニティブルーとは',
      'よくある症状',
      '毎日の過ごし方で助けになること',
      'マタニティブルーか、産後うつか',
      '助けを求めるタイミング',
      'ポイントのまとめ',
    ],
    section1Kicker: '理解する',
    section1Title: 'マタニティブルーとは？',
    section1Body1: 'マタニティブルーは、出産後の数日間に起こりうる心の変化の時期です。ホルモンの変化、疲れ、睡眠不足、そして新しい生活への適応が重なって、感情が揺れやすくなることがあります。',
    section1Body2: 'これは失敗ではなく、悪い母親だという意味でもありません。産後の最初の数日間の感じ方は、人それぞれです。',
    statTitle: 'よくある経験',
    statText: 'マタニティブルーは出産後によく見られ、数日のうちに自然に落ち着いていく傾向があります。',
    section2Kicker: '症状',
    section2Title: '感じること',
    section2Body: '感じ方は人によって異なります。主に疲れや敏感さを感じる人もいれば、気分の変化がはっきりと現れる人もいます。',
    commonSigns: [
      {
        title: '涙もろさ',
        description: 'いつもより泣きやすくなったり、とても敏感に感じたりします。',
      },
      {
        title: '過敏さ',
        description: '感情が強く感じられ、すばやく移り変わることがあります。',
      },
      {
        title: '気分の波',
        description: '不安定な気持ちと、穏やかな気持ちが入れ替わることがあります。',
      },
      {
        title: '疲れ',
        description: '最初の数日間の疲れが、感情を大きくすることがあります。',
      },
    ],
    section3Kicker: '毎日の過ごし方',
    section3Title: '助けになること',
    section3Body: 'この時期は、休息がとても大切です。小さなことでも、毎日を少し楽にしてくれます。',
    dailySupport: [
      {
        title: '休むこと',
        description: '空いた時間を使って、体を回復させましょう。',
      },
      {
        title: '助けを受け入れること',
        description: '周りの人に遠慮なく助けを求めてください。',
      },
      {
        title: 'こまめに飲むこと',
        description: '一日を通して十分に水分をとりましょう。',
      },
      {
        title: 'しっかり食べること',
        description: '規則正しく、簡単な食事を心がけましょう。',
      },
    ],
    quoteText: '「産後に助けを求めることは、自分と赤ちゃんを大切にする方法のひとつです。」',
    section4Kicker: '見分ける',
    section4Title: 'マタニティブルーか、産後うつか',
    section4Body: 'マタニティブルーは通常短期間で、少しずつ改善していきます。産後うつは異なり、より長く続いたり、より強く現れたり、日常生活に大きな影響を与えたりすることがあります。',
    compareTitle: '見分けたい2つの状態',
    compareBabyBluesTitle: 'マタニティブルー',
    compareBabyBluesText: '多くは短期間で、その後の数日で少しずつ改善します。',
    comparePostpartumTitle: '産後うつ',
    comparePostpartumText: '長く続いたり、強くなったりすることがあり、専門家の支えが必要になる場合があります。',
    section5Kicker: '気をつける',
    section5Title: '助けを求めるタイミングは？',
    section5Body: '心のつらさが良くならない、強くなる、または日常生活が難しくなってきたときは、医療従事者に相談することが大切です。',
    attentionTitle: '注意したいサイン',
    attentionSubtitle: '次のような場合は専門家に相談しましょう',
    attentionSigns: [
      '症状が2週間以上続く。',
      '悲しみや不安が強くなる。',
      '自分や赤ちゃんの世話をするのが難しくなる。',
      '強いつらさを感じるようになる。',
    ],
    professionalTitle: '支えを受けられます',
    professionalText: '助産師、医師、心理士などの医療従事者が、話を聞き、状況を確認し、適切な支えを提案してくれます。',
    tipTitle: '知っておきたいこと',
    tipText: '産後の感情は、母親としての良し悪しを測るものではありません。休むこと、話を聞いてもらうこと、支えてもらうことは、あなたの当然の権利です。',
    section6Kicker: 'ポイント',
    section6Title: 'ポイントのまとめ',
    takeaways: [
      'マタニティブルーは出産後によく見られます。',
      '疲れやホルモンの変化が、気分に影響することがあります。',
      '周りの人の支えが、この時期を楽にしてくれます。',
      'つらさが続く場合や強い場合は、専門家による評価を受けることが大切です。',
    ],
    disclaimerText: 'この記事は情報提供を目的としており、一人ひとりに合わせた医療上のアドバイスに代わるものではありません。不安がある場合や強いつらさを感じる場合は、医療従事者にご相談ください。',
    endText: '自分をいたわることも、産後の大切な一部です。',
    shareTitle: 'マタニティブルーと産後の心の健康',
    shareMessage: 'マタニティブルーと産後の心の健康 — AWA\n\n出産後によく見られる心の変化を理解するためのガイドです。',
  },
  ko: {
    badgeText: '산후 • 정서 건강',
    title: '베이비 블루와 산후\n정서 건강',
    subtitle: '출산 후 감정에 일어날 수 있는 변화를 이해하고, 언제 도움을 구해야 하는지 알아봐요.',
    metaItems: [
      '읽는 데 10분',
      '아티클',
      '입문',
      '검토된 콘텐츠',
    ],
    introTitle: '알아 두면 좋아요',
    introText: '출산 후에는 감정이 평소보다 예민해지는 시기를 겪는 경우가 흔해요. 베이비 블루는 대개 일시적이지만, 괴로움이 계속되거나 점점 심해진다면 전문가의 관심이 필요해요.',
    contentsEyebrow: '가이드',
    contentsTitle: '이 아티클의 내용',
    contents: [
      '베이비 블루 이해하기',
      '가장 흔한 신호',
      '일상에서 도움이 되는 것',
      '베이비 블루일까, 산후 우울증일까?',
      '도움을 요청해야 할 때',
      '핵심 정리',
    ],
    section1Kicker: '이해하기',
    section1Title: '베이비 블루란 무엇일까요?',
    section1Body1: '베이비 블루는 출산 후 처음 며칠 사이에 나타날 수 있는 감정 변화의 시기예요. 호르몬 변화, 피로, 수면 부족, 그리고 새로운 단계에 적응하는 일이 모두 이런 예민함에 영향을 줄 수 있어요.',
    section1Body2: '이것은 실패가 아니고, 나쁜 엄마라는 뜻도 아니에요. 산후의 첫 며칠은 누구나 저마다 다르게 보내요.',
    statTitle: '흔한 경험이에요',
    statText: '베이비 블루는 출산 후에 흔하고, 보통 며칠 안에 저절로 나아져요.',
    section2Kicker: '신호',
    section2Title: '느낄 수 있는 것들',
    section2Body: '겪는 모습은 사람마다 달라요. 주로 피로와 예민함을 느끼는 사람도 있고, 기분 변화가 더 뚜렷하게 나타나는 사람도 있어요.',
    commonSigns: [
      {
        title: '감정 기복',
        description: '더 쉽게 눈물이 나거나 유난히 예민하게 느껴져요.',
      },
      {
        title: '과민함',
        description: '감정이 더 강하게 느껴지고 빠르게 바뀔 수 있어요.',
      },
      {
        title: '기분 변화',
        description: '마음이 약해진 느낌과 편안한 순간이 번갈아 찾아올 수 있어요.',
      },
      {
        title: '피로',
        description: '처음 며칠의 피로가 감정을 더 크게 느끼게 할 수 있어요.',
      },
    ],
    section3Kicker: '일상',
    section3Title: '도움이 될 수 있는 것',
    section3Body: '이 시기에는 휴식이 많이 필요해요. 작고 간단한 일들이 하루를 한결 편안하게 만들어 줄 수 있어요.',
    dailySupport: [
      {
        title: '쉬기',
        description: '틈이 날 때마다 회복하는 시간으로 써요.',
      },
      {
        title: '도움 받기',
        description: '주변 사람들에게 망설이지 말고 도움을 청해요.',
      },
      {
        title: '규칙적으로 마시기',
        description: '하루 동안 수분을 충분히 섭취해요.',
      },
      {
        title: '충분히 먹기',
        description: '규칙적이고 간단한 식사를 챙겨요.',
      },
    ],
    quoteText: '“산후에 도움을 요청하는 것은 나 자신과 아기를 돌보는 한 가지 방법이에요.”',
    section4Kicker: '구분하기',
    section4Title: '베이비 블루일까, 산후 우울증일까?',
    section4Body: '베이비 블루는 대개 짧게 지나가고 점차 나아져요. 산후 우울증은 달라요. 더 오래 지속되고, 더 강하게 나타나며, 일상에 큰 영향을 줄 수 있어요.',
    compareTitle: '구분해야 할 두 가지 상황',
    compareBabyBluesTitle: '베이비 블루',
    compareBabyBluesText: '대개 짧게 지나가고, 이후 며칠에 걸쳐 점차 나아져요.',
    comparePostpartumTitle: '산후 우울증',
    comparePostpartumText: '더 오래 이어지고 심해질 수 있으며, 전문가의 도움이 필요할 수 있어요.',
    section5Kicker: '주의하기',
    section5Title: '언제 도움을 요청해야 할까요?',
    section5Body: '정서적인 괴로움이 나아지지 않거나, 더 심해지거나, 일상이 힘들어지기 시작한다면 의료 전문가와 이야기해 보는 것이 중요해요.',
    attentionTitle: '주의해서 봐야 할 신호',
    attentionSubtitle: '다음과 같다면 전문가와 상담해 보세요…',
    attentionSigns: [
      '증상이 2주 넘게 이어져요.',
      '슬픔이나 불안이 더 심해져요.',
      '나 자신이나 아기를 돌보기가 어려워져요.',
      '심한 괴로움이 느껴져요.',
    ],
    professionalTitle: '도움을 받을 수 있어요',
    professionalText: '조산사, 의사, 심리 전문가 등 의료 전문가가 이야기를 들어 주고, 상황을 살펴보고, 알맞은 도움을 안내해 줄 수 있어요.',
    tipTitle: '알아 두면 좋아요',
    tipText: '산후의 감정은 얼마나 좋은 엄마인지를 재는 기준이 아니에요. 쉬고 싶어 하고, 이야기를 들어 달라고 하고, 도움을 받을 권리가 있어요.',
    section6Kicker: '핵심',
    section6Title: '핵심 정리',
    takeaways: [
      '베이비 블루는 출산 후에 흔해요.',
      '피로와 호르몬 변화가 기분에 영향을 줄 수 있어요.',
      '주변 사람들의 도움이 이 시기를 더 수월하게 해 줄 수 있어요.',
      '괴로움이 계속되거나 심하다면 전문가의 진단과 평가를 받아 보는 것이 좋아요.',
    ],
    disclaimerText: '이 아티클은 정보 제공을 위한 것이며 개인별 의학적 조언을 대신하지 않아요. 걱정되거나 심한 괴로움을 느낀다면 의료 전문가와 상담해 보세요.',
    endText: '나 자신을 돌보는 것도 산후의 한 부분이에요.',
    shareTitle: '베이비 블루와 산후 정서 건강',
    shareMessage: '베이비 블루와 산후 정서 건강 — AWA\n\n출산 후에 흔히 나타나는 감정 변화를 이해하는 데 도움이 되는 가이드예요.',
  },
  'pt-PT': {
    badgeText: 'PÓS-PARTO • SAÚDE EMOCIONAL',
    title: 'Tristeza pós-parto (baby blues) e saúde\nemocional no pós-parto',
    subtitle: 'Perceber o que pode mudar emocionalmente após o parto e saber quando procurar apoio.',
    metaItems: [
      '10 min de leitura',
      'Artigo',
      'Iniciante',
      'Conteúdo revisto',
    ],
    introTitle: 'Bom saber',
    introText: 'Depois de dar à luz, é comum passar por um período de maior sensibilidade emocional. A tristeza pós-parto (baby blues) é geralmente passageira, mas um mal-estar que persiste ou se intensifica merece atenção profissional.',
    contentsEyebrow: 'GUIA',
    contentsTitle: 'Neste artigo',
    contents: [
      'Perceber a tristeza pós-parto',
      'Os sinais mais comuns',
      'O que ajuda no dia a dia',
      'Tristeza pós-parto ou depressão pós-parto?',
      'Quando pedir ajuda',
      'Pontos-chave',
    ],
    section1Kicker: 'PERCEBER',
    section1Title: 'O que é a tristeza pós-parto (baby blues)?',
    section1Body1: 'A tristeza pós-parto (baby blues) é um período de alterações emocionais que pode surgir nos primeiros dias depois do parto. As oscilações hormonais, o cansaço, a falta de sono e a adaptação a esta nova fase podem contribuir para esta sensibilidade.',
    section1Body2: 'Isto não é uma falha e não significa que seja uma má mãe. Cada mulher vive os primeiros dias do pós-parto à sua maneira.',
    statTitle: 'Uma experiência comum',
    statText: 'A tristeza pós-parto (baby blues) é comum depois do parto e tende a melhorar por si só em poucos dias.',
    section2Kicker: 'OS SINAIS',
    section2Title: 'O que pode sentir',
    section2Body: 'O que cada mulher vive varia. Algumas sentem sobretudo cansaço e sensibilidade, enquanto outras podem ter alterações de humor mais notórias.',
    commonSigns: [
      {
        title: 'Emotividade',
        description: 'Chorar com mais facilidade ou sentir-se particularmente sensível.',
      },
      {
        title: 'Hipersensibilidade',
        description: 'As emoções podem parecer mais intensas e mudar depressa.',
      },
      {
        title: 'Oscilações de humor',
        description: 'Uma sensação de fragilidade pode alternar com momentos de bem-estar.',
      },
      {
        title: 'Cansaço',
        description: 'O cansaço dos primeiros dias pode amplificar as emoções.',
      },
    ],
    section3Kicker: 'DIA A DIA',
    section3Title: 'O que pode ajudar',
    section3Body: 'Durante este período, a necessidade de descanso é grande. Pequenos gestos simples podem tornar os dias mais confortáveis.',
    dailySupport: [
      {
        title: 'Descansar',
        description: 'Aproveitar todos os momentos livres para recuperar.',
      },
      {
        title: 'Aceitar ajuda',
        description: 'Não hesite em pedir apoio a quem a rodeia.',
      },
      {
        title: 'Beber com regularidade',
        description: 'Manter uma hidratação suficiente ao longo do dia.',
      },
      {
        title: 'Comer o suficiente',
        description: 'Privilegiar refeições regulares e simples.',
      },
    ],
    quoteText: '“Pedir ajuda no pós-parto é uma forma de cuidar de si e do seu bebé.”',
    section4Kicker: 'DISTINGUIR',
    section4Title: 'Tristeza pós-parto ou depressão pós-parto?',
    section4Body: 'A tristeza pós-parto (baby blues) é geralmente breve e melhora gradualmente. A depressão pós-parto é diferente: pode ser mais persistente, mais intensa e ter um impacto significativo no dia a dia.',
    compareTitle: 'Duas situações a distinguir',
    compareBabyBluesTitle: 'Tristeza pós-parto (baby blues)',
    compareBabyBluesText: 'Muitas vezes breve, com melhoria gradual ao longo dos dias seguintes.',
    comparePostpartumTitle: 'Depressão pós-parto',
    comparePostpartumText: 'Pode durar mais tempo, intensificar-se e exigir apoio profissional.',
    section5Kicker: 'ESTAR ATENTA',
    section5Title: 'Quando pedir ajuda?',
    section5Body: 'É importante falar com um profissional de saúde se o mal-estar emocional não melhorar, se tornar mais intenso ou começar a dificultar o dia a dia.',
    attentionTitle: 'Sinais de alerta a vigiar',
    attentionSubtitle: 'Fale com um profissional se…',
    attentionSigns: [
      'Os sintomas duram mais de duas semanas.',
      'A tristeza ou a ansiedade se tornam mais intensas.',
      'Se torna difícil cuidar de si ou do seu bebé.',
      'Surge uma sensação significativa de sofrimento.',
    ],
    professionalTitle: 'Existe apoio disponível',
    professionalText: 'Uma parteira, um médico, um psicólogo ou outro profissional de saúde pode ouvi-la, avaliar a situação e propor um apoio adequado.',
    tipTitle: 'Bom saber',
    tipText: 'As emoções do pós-parto não são uma medida do tipo de mãe que é. Tem o direito de precisar de descanso, de ser ouvida e de ser apoiada.',
    section6Kicker: 'PONTOS-CHAVE',
    section6Title: 'Pontos-chave',
    takeaways: [
      'A tristeza pós-parto (baby blues) é comum depois do parto.',
      'O cansaço e as alterações hormonais podem afetar o humor.',
      'O apoio de quem a rodeia pode tornar este período mais fácil.',
      'Um mal-estar persistente ou significativo merece uma avaliação profissional.',
    ],
    disclaimerText: 'Este artigo tem fins informativos e não substitui um aconselhamento médico personalizado. Em caso de dúvida ou de mal-estar significativo, fale com um profissional de saúde.',
    endText: 'Cuidar de si também faz parte do pós-parto.',
    shareTitle: 'Tristeza pós-parto (baby blues) e saúde emocional no pós-parto',
    shareMessage: 'Tristeza pós-parto (baby blues) e saúde emocional no pós-parto — AWA\n\nUm guia para perceber as alterações emocionais comuns depois do parto.',
  },
  bn: {
    badgeText: 'প্রসবোত্তর • মানসিক স্বাস্থ্য',
    title: 'বেবি ব্লুজ ও প্রসবোত্তর\nমানসিক স্বাস্থ্য',
    subtitle: 'সন্তান জন্মের পর মানসিকভাবে কী পরিবর্তন হতে পারে তা বুঝুন এবং কখন সহায়তা নিতে হবে তা জানুন।',
    metaItems: [
      'পড়তে 10 মিনিট',
      'নিবন্ধ',
      'প্রাথমিক',
      'পর্যালোচিত বিষয়বস্তু',
    ],
    introTitle: 'জেনে রাখা ভালো',
    introText: 'সন্তান জন্মের পর কিছু সময় মানসিকভাবে বেশি স্পর্শকাতর হয়ে পড়া খুবই স্বাভাবিক। বেবি ব্লুজ সাধারণত সাময়িক হয়, তবে যে মানসিক কষ্ট দীর্ঘস্থায়ী হয় বা বেড়ে যায়, তাতে পেশাদার মনোযোগ প্রয়োজন।',
    contentsEyebrow: 'গাইড',
    contentsTitle: 'এই নিবন্ধে',
    contents: [
      'বেবি ব্লুজ বোঝা',
      'সবচেয়ে সাধারণ লক্ষণ',
      'প্রতিদিন যা সাহায্য করে',
      'বেবি ব্লুজ নাকি প্রসবোত্তর বিষণ্নতা?',
      'কখন সাহায্য চাইবেন',
      'মূল কথা',
    ],
    section1Kicker: 'বোঝা',
    section1Title: 'বেবি ব্লুজ কী?',
    section1Body1: 'বেবি ব্লুজ হলো মানসিক পরিবর্তনের একটি সময়, যা সন্তান জন্মের প্রথম কয়েক দিনে দেখা দিতে পারে। হরমোনের পরিবর্তন, ক্লান্তি, ঘুমের অভাব এবং জীবনের এই নতুন ধাপের সঙ্গে মানিয়ে নেওয়া, সবই এই স্পর্শকাতরতায় ভূমিকা রাখতে পারে।',
    section1Body2: 'এটি কোনো ব্যর্থতা নয়, আর এর অর্থ এই নয় যে আপনি খারাপ মা। প্রসবোত্তর সময়ের প্রথম দিনগুলো প্রত্যেকে নিজের মতো করে অনুভব করেন।',
    statTitle: 'একটি সাধারণ অভিজ্ঞতা',
    statText: 'সন্তান প্রসবের পর বেবি ব্লুজ সাধারণ ব্যাপার এবং কয়েক দিনের মধ্যে এটি নিজে থেকেই কমে আসে।',
    section2Kicker: 'লক্ষণ',
    section2Title: 'আপনি যা অনুভব করতে পারেন',
    section2Body: 'অভিজ্ঞতা একেকজনের একেক রকম। কেউ মূলত ক্লান্তি ও স্পর্শকাতরতা অনুভব করেন, আবার কারও মেজাজের পরিবর্তন আরও স্পষ্ট হতে পারে।',
    commonSigns: [
      {
        title: 'আবেগপ্রবণতা',
        description: 'সহজেই কান্না পাওয়া বা বিশেষভাবে স্পর্শকাতর বোধ করা।',
      },
      {
        title: 'অতি সংবেদনশীলতা',
        description: 'অনুভূতি আরও তীব্র মনে হতে পারে এবং দ্রুত বদলে যেতে পারে।',
      },
      {
        title: 'মেজাজের ওঠানামা',
        description: 'ভঙ্গুর লাগার অনুভূতি আর ভালো থাকার মুহূর্ত পালা করে আসতে পারে।',
      },
      {
        title: 'ক্লান্তি',
        description: 'প্রথম দিনগুলোর ক্লান্তি অনুভূতিকে আরও বাড়িয়ে তুলতে পারে।',
      },
    ],
    section3Kicker: 'প্রতিদিন',
    section3Title: 'কী সাহায্য করতে পারে',
    section3Body: 'এই সময়ে বিশ্রামের প্রয়োজন অনেক বেশি। ছোট ও সহজ কিছু বিষয় দিনগুলোকে আরও আরামদায়ক করতে পারে।',
    dailySupport: [
      {
        title: 'বিশ্রাম নেওয়া',
        description: 'অবসরের প্রতিটি মুহূর্তকে সুস্থ হয়ে ওঠার কাজে লাগানো।',
      },
      {
        title: 'সাহায্য গ্রহণ করা',
        description: 'আশপাশের মানুষের কাছে সহায়তা চাইতে দ্বিধা করবেন না।',
      },
      {
        title: 'নিয়মিত পানি পান',
        description: 'সারা দিন পর্যাপ্ত পানি পান করা।',
      },
      {
        title: 'যথেষ্ট খাওয়া',
        description: 'নিয়মিত ও সহজ খাবারকে প্রাধান্য দেওয়া।',
      },
    ],
    quoteText: '“প্রসবোত্তর সময়ে সাহায্য চাওয়া নিজের এবং আপনার সন্তানের যত্ন নেওয়ারই একটি উপায়।”',
    section4Kicker: 'পার্থক্য বোঝা',
    section4Title: 'বেবি ব্লুজ নাকি প্রসবোত্তর বিষণ্নতা?',
    section4Body: 'বেবি ব্লুজ সাধারণত অল্প সময়ের হয় এবং ধীরে ধীরে ভালো হয়ে যায়। প্রসবোত্তর বিষণ্নতা আলাদা: এটি আরও দীর্ঘস্থায়ী ও তীব্র হতে পারে এবং দৈনন্দিন জীবনে উল্লেখযোগ্য প্রভাব ফেলতে পারে।',
    compareTitle: 'দুটি আলাদা পরিস্থিতি',
    compareBabyBluesTitle: 'বেবি ব্লুজ',
    compareBabyBluesText: 'প্রায়ই অল্প সময়ের হয়, পরের কয়েক দিনে ধীরে ধীরে উন্নতি হয়।',
    comparePostpartumTitle: 'প্রসবোত্তর বিষণ্নতা',
    comparePostpartumText: 'বেশি সময় ধরে চলতে পারে, তীব্র হতে পারে এবং পেশাদার সহায়তার প্রয়োজন হতে পারে।',
    section5Kicker: 'সতর্ক থাকা',
    section5Title: 'কখন সাহায্য চাইবেন?',
    section5Body: 'মানসিক কষ্ট যদি না কমে, আরও তীব্র হয় বা দৈনন্দিন জীবন কঠিন করে তুলতে শুরু করে, তাহলে স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে কথা বলা জরুরি।',
    attentionTitle: 'যেসব সতর্কতামূলক লক্ষণে নজর রাখবেন',
    attentionSubtitle: 'পেশাজীবীর সঙ্গে কথা বলুন যদি…',
    attentionSigns: [
      'উপসর্গ দুই সপ্তাহের বেশি স্থায়ী হয়।',
      'দুঃখ বা উদ্বেগ আরও তীব্র হয়ে ওঠে।',
      'নিজের বা সন্তানের যত্ন নেওয়া কঠিন হয়ে পড়ে।',
      'গভীর মানসিক কষ্টের অনুভূতি দেখা দেয়।',
    ],
    professionalTitle: 'সহায়তা পাওয়া যায়',
    professionalText: 'ধাত্রী, ডাক্তার, মনোবিজ্ঞানী বা অন্য কোনো স্বাস্থ্যসেবা পেশাজীবী আপনার কথা শুনতে, পরিস্থিতি মূল্যায়ন করতে এবং উপযুক্ত সহায়তা দিতে পারেন।',
    tipTitle: 'জেনে রাখা ভালো',
    tipText: 'প্রসবোত্তর আবেগ আপনি কতটা ভালো মা তার মাপকাঠি নয়। বিশ্রামের প্রয়োজন থাকা, মনোযোগ দিয়ে শোনা এবং সহায়তা পাওয়ার অধিকার আপনার আছে।',
    section6Kicker: 'মূল বিষয়',
    section6Title: 'মূল কথা',
    takeaways: [
      'সন্তান জন্মের পর বেবি ব্লুজ সাধারণ ব্যাপার।',
      'ক্লান্তি ও হরমোনের পরিবর্তন মেজাজকে প্রভাবিত করতে পারে।',
      'আশপাশের মানুষের সহায়তা এই সময়টা সহজ করে তুলতে পারে।',
      'দীর্ঘস্থায়ী বা গভীর মানসিক কষ্টে পেশাদার মূল্যায়ন প্রয়োজন।',
    ],
    disclaimerText: 'এই নিবন্ধ শুধু তথ্যের জন্য এবং ব্যক্তিগত চিকিৎসা পরামর্শের বিকল্প নয়। সন্দেহ থাকলে বা গভীর মানসিক কষ্ট অনুভব করলে স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে কথা বলুন।',
    endText: 'নিজের যত্ন নেওয়াও প্রসবোত্তর সময়ের অংশ।',
    shareTitle: 'বেবি ব্লুজ ও প্রসবোত্তর মানসিক স্বাস্থ্য',
    shareMessage: 'বেবি ব্লুজ ও প্রসবোত্তর মানসিক স্বাস্থ্য — AWA\n\nসন্তান জন্মের পর যে মানসিক পরিবর্তনগুলো সাধারণ, সেগুলো বোঝার একটি গাইড।',
  },
  da: {
    badgeText: 'BARSEL • FØLELSESMÆSSIG SUNDHED',
    title: 'Baby blues og følelsesmæssig\nsundhed efter fødslen',
    subtitle:
      'Forstå, hvad der kan ændre sig følelsesmæssigt efter en fødsel, og hvornår du bør søge støtte.',
    metaItems: ['10 min. læsning', 'Artikel', 'Begynder', 'Gennemset indhold'],
    introTitle: 'Godt at vide',
    introText:
      'Efter en fødsel er det almindeligt at gå igennem en periode med øget følelsesmæssig sårbarhed. Baby blues er som regel midlertidigt, men vedvarende eller tiltagende ubehag fortjener professionel opmærksomhed.',
    contentsEyebrow: 'GUIDE',
    contentsTitle: 'I denne artikel',
    contents: [
      'Forstå baby blues',
      'De mest almindelige tegn',
      'Hvad hjælper i hverdagen',
      'Baby blues eller fødselsdepression?',
      'Hvornår skal du bede om hjælp',
      'Vigtigste pointer',
    ],
    section1Kicker: 'FORSTÅELSE',
    section1Title: 'Hvad er baby blues?',
    section1Body1:
      'Baby blues er en periode med følelsesmæssige forandringer, der kan opstå i de første dage efter fødslen. Hormonelle ændringer, træthed, søvnmangel og det at tilpasse sig denne nye fase kan alle bidrage til denne sårbarhed.',
    section1Body2:
      'Det er ikke et tegn på svaghed, og det betyder ikke, at du er en dårlig mor. Alle oplever de første dage efter fødslen på deres egen måde.',
    statTitle: 'En almindelig oplevelse',
    statText:
      'Baby blues er hyppigt efter en fødsel og har tendens til at bedre sig af sig selv i løbet af få dage.',
    section2Kicker: 'TEGNENE',
    section2Title: 'Hvad du måske føler',
    section2Body:
      'Oplevelserne varierer. Nogle føler primært træthed og sårbarhed, mens andre kan have mere tydelige humørsvingninger.',
    commonSigns: [
      {
        title: 'Følsomhed',
        description: 'At græde lettere eller føle sig særligt sårbar.',
      },
      {
        title: 'Overfølsomhed',
        description: 'Følelser kan virke stærkere og skifte hurtigt.',
      },
      {
        title: 'Humørsvingninger',
        description:
          'En fornemmelse af skrøbelighed kan veksle med øjeblikke af velvære.',
      },
      {
        title: 'Træthed',
        description: 'Træthed fra de første dage kan forstærke følelserne.',
      },
    ],
    section3Kicker: 'I HVERDAGEN',
    section3Title: 'Hvad kan hjælpe',
    section3Body:
      'I denne periode er behovet for hvile stort. Små, enkle ting kan gøre dagene mere behagelige.',
    dailySupport: [
      {
        title: 'At hvile',
        description: 'Udnyt ledige øjeblikke til at komme dig.',
      },
      {
        title: 'At tage imod hjælp',
        description: 'Tøv ikke med at bede om støtte fra dem omkring dig.',
      },
      {
        title: 'At drikke regelmæssigt',
        description: 'Hold dig tilstrækkeligt hydreret i løbet af dagen.',
      },
      {
        title: 'At spise nok',
        description: 'Prioritér regelmæssige, enkle måltider.',
      },
    ],
    quoteText:
      '"At bede om hjælp efter fødslen er en måde at tage vare på dig selv og din baby."',
    section4Kicker: 'AT SKELNE',
    section4Title: 'Baby blues eller fødselsdepression?',
    section4Body:
      'Baby blues er som regel kortvarig og bedres gradvist. Fødselsdepression er anderledes: den kan vare længere, være mere intens og have en betydelig indvirkning på hverdagen.',
    compareTitle: 'To situationer at skelne imellem',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Ofte kortvarig, med gradvis bedring i de følgende dage.',
    comparePostpartumTitle: 'Fødselsdepression',
    comparePostpartumText:
      'Kan vare længere, intensiveres og kræve professionel støtte.',
    section5Kicker: 'VÆR OPMÆRKSOM',
    section5Title: 'Hvornår skal du bede om hjælp?',
    section5Body:
      'Det er vigtigt at tale med en sundhedsprofessionel, hvis det følelsesmæssige ubehag ikke bedres, bliver mere intenst eller begynder at gøre hverdagen sværere.',
    attentionTitle: 'Advarselstegn at holde øje med',
    attentionSubtitle: 'Tal med en professionel, hvis…',
    attentionSigns: [
      'Symptomerne varer mere end to uger.',
      'Tristhed eller angst bliver mere intens.',
      'Det bliver svært at tage vare på dig selv eller din baby.',
      'En stærk følelse af nød opstår.',
    ],
    professionalTitle: 'Støtte er tilgængelig',
    professionalText:
      'En jordemoder, læge, psykolog eller anden sundhedsprofessionel kan lytte, vurdere situationen og tilbyde passende støtte.',
    tipTitle: 'Godt at vide',
    tipText:
      'Dine følelser efter fødslen er ikke et mål for, hvor god en mor du er. Du har ret til at have brug for hvile, at blive lyttet til og at få støtte.',
    section6Kicker: 'VIGTIGE PUNKTER',
    section6Title: 'Vigtigste pointer',
    takeaways: [
      'Baby blues er hyppigt efter en fødsel.',
      'Træthed og hormonelle ændringer kan påvirke humøret.',
      'Støtte fra dem omkring dig kan gøre denne periode lettere.',
      'Vedvarende eller betydeligt ubehag fortjener en professionel vurdering.',
    ],
    disclaimerText:
      'Denne artikel er til information og erstatter ikke personlig medicinsk rådgivning. Hvis du er i tvivl eller oplever betydeligt ubehag, så tal med en sundhedsprofessionel.',
    endText: 'At tage vare på dig selv er også en del af barselsperioden.',
    shareTitle: 'Baby blues og følelsesmæssig sundhed efter fødslen',
    shareMessage:
      'Baby blues og følelsesmæssig sundhed efter fødslen — AWA\n\nEn guide til at forstå de følelsesmæssige forandringer, der er almindelige efter en fødsel.',
  },
  da: {
    badgeText: 'BARSEL • FÖLELSESMÄSSIG SUNDHED',
    title: 'Baby blues och fölelsesmässig\nhalsa efter födslen',
    subtitle:
      'Forstå, hvad der kan ändre sig fölelsesmässigt efter en födsel, och hvornår du bör söge stötte.',
    metaItems: ['10 min. läsning', 'Artikel', 'Begynder', 'Gennemset indhold'],
    introTitle: 'Godt at vide',
    introText:
      'Efter en födsel ar det almindeligt at gå igennem en periode med öget fölelsesmässig sårbarhed. Baby blues ar som regel midlertidigt, men vedvarende eller tiltagende ubehag fortjener professionel opmärksomhed.',
    contentsEyebrow: 'GUIDE',
    contentsTitle: 'I denne artikel',
    contents: [
      'Forstå baby blues',
      'De mest almindelige tegn',
      'Hvad hjälper i hverdagen',
      'Baby blues eller födselsdepression?',
      'Hvornår skal du bede om hjälp',
      'Vigtigste pointer',
    ],
    section1Kicker: 'FORSTÅELSE',
    section1Title: 'Hvad ar baby blues?',
    section1Body1:
      'Baby blues ar en periode med fölelsesmässige forandringer, der kan opstå i de förste dagar efter födslen. Hormonelle ändringer, träthed, sövnmangel och det at tilpasse sig denne nye fase kan alla bidrage till denne sårbarhed.',
    section1Body2:
      'Det ar inte et tegn på svaghed, och det betyder inte, at du ar en dårlig mor. Alla oplever de förste dagar efter födslen på deres egen måde.',
    statTitle: 'En almindelig oplevelse',
    statText:
      'Baby blues ar hyppigt efter en födsel och har tendens till at bedre sig av sig selv i löbet av få dagar.',
    section2Kicker: 'TEGNENE',
    section2Title: 'Hvad du måske föler',
    section2Body:
      'Oplevelserne varierer. Nogle föler primärt träthed och sårbarhed, mens andre kan have mere tydelige humörsvingninger.',
    commonSigns: [
      {
        title: 'Fölsomhed',
        description: 'At gräde lettere eller föle sig särligt sårbar.',
      },
      {
        title: 'Overfölsomhed',
        description: 'Fölelser kan virke stärkere och skifte hurtigt.',
      },
      {
        title: 'Humörsvingninger',
        description:
          'En fornemmelse av skröbelighed kan veksle med öjeblikke av velväre.',
      },
      {
        title: 'Träthed',
        description: 'Träthed fran de förste dagar kan forstärke fölelserne.',
      },
    ],
    section3Kicker: 'I HVERDAGEN',
    section3Title: 'Hvad kan hjälpe',
    section3Body:
      'I denne periode ar behovet for hvile stort. Små, enkle ting kan göre dagene mere behagelige.',
    dailySupport: [
      {
        title: 'At hvile',
        description: 'Udnyt ledige öjeblikke till at komme dig.',
      },
      {
        title: 'At tage imod hjälp',
        description: 'Töv inte med at bede om stötte fran dem omkring dig.',
      },
      {
        title: 'At drikke regelmässigt',
        description: 'Hold dig tilsträkkeligt hydreret i löbet av dagen.',
      },
      {
        title: 'At spise nok',
        description: 'Prioritér regelmässige, enkle måltider.',
      },
    ],
    quoteText:
      '"At bede om hjälp efter födslen ar en måde at tage vare på dig selv och din baby."',
    section4Kicker: 'AT SKELNE',
    section4Title: 'Baby blues eller födselsdepression?',
    section4Body:
      'Baby blues ar som regel kortvarig och bedres gradvist. Födselsdepression ar anderledes: den kan vare längere, väre mere intens och have en betydelig indvirkning på hverdagen.',
    compareTitle: 'To situationer at skelne imellem',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Ofte kortvarig, med gradvis bedring i de fölgende dagar.',
    comparePostpartumTitle: 'Födselsdepression',
    comparePostpartumText:
      'Kan vare längere, intensiveres och kräve professionel stötte.',
    section5Kicker: 'VÄR OPMÄRKSOM',
    section5Title: 'Hvornår skal du bede om hjälp?',
    section5Body:
      'Det ar vigtigt at tale med en halsasprofessionel, hvis det fölelsesmässige ubehag inte bedres, bliver mere intenst eller begynder at göre hverdagen svärere.',
    attentionTitle: 'Advarselstegn at holde öje med',
    attentionSubtitle: 'Tal med en professionel, hvis…',
    attentionSigns: [
      'Symtomne varer mere end to veckor.',
      'Tristhed eller angst bliver mere intens.',
      'Det bliver svärt at tage vare på dig selv eller din baby.',
      'En stärk fölelse av nöd opstår.',
    ],
    professionalTitle: 'Stötte ar tilgängelig',
    professionalText:
      'En jordemoder, läge, psykolog eller anden halsasprofessionel kan lytte, vurdere situationen och tilbyde passende stötte.',
    tipTitle: 'Godt at vide',
    tipText:
      'Dine fölelser efter födslen ar inte et mål for, hvor god en mor du ar. Du har ret till at have brug for hvile, at blive lyttet till och at få stötte.',
    section6Kicker: 'VIGTIGE PUNKTER',
    section6Title: 'Vigtigste pointer',
    takeaways: [
      'Baby blues ar hyppigt efter en födsel.',
      'Träthed och hormonelle ändringer kan påvirke humöret.',
      'Stötte fran dem omkring dig kan göre denne periode lettere.',
      'Vedvarende eller betydeligt ubehag fortjener en professionel vurdering.',
    ],
    disclaimerText:
      'Denne artikel ar till information och erstatter inte personlig medicinsk rådgivning. Hvis du ar i tvivl eller oplever betydeligt ubehag, så tal med en halsasprofessionel.',
    endText: 'At tage vare på dig selv ar også en del av barselsperioden.',
    shareTitle: 'Baby blues och fölelsesmässig halsa efter födslen',
    shareMessage:
      'Baby blues och fölelsesmässig halsa efter födslen — AWA\n\nEn guide till at forstå de fölelsesmässige forandringer, der ar almindelige efter en födsel.',
  },
  sv: {
    badgeText: 'BARSEL • FÖLELSESMÄSSIG SUNDHED',
    title: 'Baby blues och fölelsesmässig\nhalsa efter födslen',
    subtitle:
      'Forstå, hvad der kan ändre sig fölelsesmässigt efter en födsel, och hvornår du bör söge stötte.',
    metaItems: ['10 min. läsning', 'Artikel', 'Begynder', 'Gennemset indhold'],
    introTitle: 'Godt at vide',
    introText:
      'Efter en födsel ar det almindeligt at gå igennem en periode med öget fölelsesmässig sårbarhed. Baby blues ar som regel midlertidigt, men vedvarende eller tiltagende ubehag fortjener professionel opmärksomhed.',
    contentsEyebrow: 'GUIDE',
    contentsTitle: 'I denne artikel',
    contents: [
      'Forstå baby blues',
      'De mest almindelige tegn',
      'Hvad hjälper i hverdagen',
      'Baby blues eller födselsdepression?',
      'Hvornår skal du bede om hjälp',
      'Vigtigste pointer',
    ],
    section1Kicker: 'FORSTÅELSE',
    section1Title: 'Hvad ar baby blues?',
    section1Body1:
      'Baby blues ar en periode med fölelsesmässige forandringer, der kan opstå i de förste dagar efter födslen. Hormonelle ändringer, träthed, sövnmangel och det at tilpasse sig denne nye fase kan alla bidrage till denne sårbarhed.',
    section1Body2:
      'Det ar inte et tegn på svaghed, och det betyder inte, at du ar en dårlig mor. Alla oplever de förste dagar efter födslen på deres egen måde.',
    statTitle: 'En almindelig oplevelse',
    statText:
      'Baby blues ar hyppigt efter en födsel och har tendens till at bedre sig av sig selv i löbet av få dagar.',
    section2Kicker: 'TEGNENE',
    section2Title: 'Hvad du måske föler',
    section2Body:
      'Oplevelserne varierer. Nogle föler primärt träthed och sårbarhed, mens andre kan have mere tydelige humörsvingninger.',
    commonSigns: [
      {
        title: 'Fölsomhed',
        description: 'At gräde lettere eller föle sig särligt sårbar.',
      },
      {
        title: 'Overfölsomhed',
        description: 'Fölelser kan virke stärkere och skifte hurtigt.',
      },
      {
        title: 'Humörsvingninger',
        description:
          'En fornemmelse av skröbelighed kan veksle med öjeblikke av velväre.',
      },
      {
        title: 'Träthed',
        description: 'Träthed fran de förste dagar kan forstärke fölelserne.',
      },
    ],
    section3Kicker: 'I HVERDAGEN',
    section3Title: 'Hvad kan hjälpe',
    section3Body:
      'I denne periode ar behovet for hvile stort. Små, enkle ting kan göre dagene mere behagelige.',
    dailySupport: [
      {
        title: 'At hvile',
        description: 'Udnyt ledige öjeblikke till at komme dig.',
      },
      {
        title: 'At tage imod hjälp',
        description: 'Töv inte med at bede om stötte fran dem omkring dig.',
      },
      {
        title: 'At drikke regelmässigt',
        description: 'Hold dig tilsträkkeligt hydreret i löbet av dagen.',
      },
      {
        title: 'At spise nok',
        description: 'Prioritér regelmässige, enkle måltider.',
      },
    ],
    quoteText:
      '"At bede om hjälp efter födslen ar en måde at tage vare på dig selv och din baby."',
    section4Kicker: 'AT SKELNE',
    section4Title: 'Baby blues eller födselsdepression?',
    section4Body:
      'Baby blues ar som regel kortvarig och bedres gradvist. Födselsdepression ar anderledes: den kan vare längere, väre mere intens och have en betydelig indvirkning på hverdagen.',
    compareTitle: 'To situationer at skelne imellem',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Ofte kortvarig, med gradvis bedring i de fölgende dagar.',
    comparePostpartumTitle: 'Födselsdepression',
    comparePostpartumText:
      'Kan vare längere, intensiveres och kräve professionel stötte.',
    section5Kicker: 'VÄR OPMÄRKSOM',
    section5Title: 'Hvornår skal du bede om hjälp?',
    section5Body:
      'Det ar vigtigt at tale med en halsasprofessionel, hvis det fölelsesmässige ubehag inte bedres, bliver mere intenst eller begynder at göre hverdagen svärere.',
    attentionTitle: 'Advarselstegn at holde öje med',
    attentionSubtitle: 'Tal med en professionel, hvis…',
    attentionSigns: [
      'Symtomne varer mere end to veckor.',
      'Tristhed eller angst bliver mere intens.',
      'Det bliver svärt at tage vare på dig selv eller din baby.',
      'En stärk fölelse av nöd opstår.',
    ],
    professionalTitle: 'Stötte ar tilgängelig',
    professionalText:
      'En jordemoder, läge, psykolog eller anden halsasprofessionel kan lytte, vurdere situationen och tilbyde passende stötte.',
    tipTitle: 'Godt at vide',
    tipText:
      'Dine fölelser efter födslen ar inte et mål for, hvor god en mor du ar. Du har ret till at have brug for hvile, at blive lyttet till och at få stötte.',
    section6Kicker: 'VIGTIGE PUNKTER',
    section6Title: 'Vigtigste pointer',
    takeaways: [
      'Baby blues ar hyppigt efter en födsel.',
      'Träthed och hormonelle ändringer kan påvirke humöret.',
      'Stötte fran dem omkring dig kan göre denne periode lettere.',
      'Vedvarende eller betydeligt ubehag fortjener en professionel vurdering.',
    ],
    disclaimerText:
      'Denne artikel ar till information och erstatter inte personlig medicinsk rådgivning. Hvis du ar i tvivl eller oplever betydeligt ubehag, så tal med en halsasprofessionel.',
    endText: 'At tage vare på dig selv ar også en del av barselsperioden.',
    shareTitle: 'Baby blues och fölelsesmässig halsa efter födslen',
    shareMessage:
      'Baby blues och fölelsesmässig halsa efter födslen — AWA\n\nEn guide till at forstå de fölelsesmässige forandringer, der ar almindelige efter en födsel.',
  },
} as const);

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export default function BabyBluesArticleScreen({
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

  /* ------------------------------------------------------------------------ */
  /*                              LOAD BOOKMARK                               */
  /* ------------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------------ */
  /*                                BOOKMARK                                  */
  /* ------------------------------------------------------------------------ */

  const handleBookmark = () => {
    const nextValue = toggleBookmark(ID);
    setSaved(nextValue);
  };

  /* ------------------------------------------------------------------------ */
  /*                                  SHARE                                    */
  /* ------------------------------------------------------------------------ */

  const handleShare = async () => {
    try {
      await Share.share({
        title: content.shareTitle,
        message: content.shareMessage,
      });
    } catch {
      // Le partage peut être annulé par l'utilisateur.
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                                  RENDER                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <View style={styles.screen}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
      />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={200}
        onScroll={event => {
          saveScrollPosition(
            ID,
            event.nativeEvent.contentOffset.y,
          );
        }}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: getBottomPadding(
              insets.bottom,
              READING_CONTROLS_SPACE,
            ),
          },
        ]}>
        {/* ================================================================== */}
        {/* HERO                                                               */}
        {/* ================================================================== */}

        <View style={styles.heroWrap}>
          <Image
            source={HERO}
            resizeMode="cover"
            style={styles.hero}
          />

          {/* HEADER */}

          <View
            style={[
              styles.top,
              {
                paddingTop: getTopPadding(insets.top, true),
              },
            ]}>
            <AwaIconButton
              accessibilityLabel={t('library.reader.back')}
              icon="chevron-left"
              iconSize={24}
              onPress={() => navigation.goBack()}
              variant="tonal"
            />

            <View style={styles.actions}>
              <AwaIconButton
                accessibilityLabel={
                  saved ? t('library.screen.removeBookmark') : t('library.screen.addBookmark')
                }
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

        {/* ================================================================== */}
        {/* ARTICLE                                                            */}
        {/* ================================================================== */}

        <View style={styles.article}>
          {/* CATEGORY */}

          <View style={styles.badge}>
            <MaterialDesignIcons
              name="heart-outline"
              size={13}
              color={theme.colors.primary}
            />

            <AwaText variant="labelSmall" emphasized colorRole="primary">
              {content.badgeText}
            </AwaText>
          </View>

          {/* TITLE */}

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

          {/* SUBTITLE */}

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.subtitle}>
            {content.subtitle}
          </AwaText>

          {/* ================================================================= */}
          {/* META                                                              */}
          {/* ================================================================= */}

          <View style={styles.metas}>
            {META_ICONS.map((icon, index) => {
              const text = content.metaItems[index];

              return (
                <React.Fragment key={text}>
                  {index > 0 && <View style={styles.metaDivider} />}

                  <View style={styles.metaItem}>
                    <MaterialDesignIcons
                      name={icon as never}
                      color={theme.colors.textMuted}
                      size={16}
                    />

                    <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
                      {text}
                    </AwaText>
                  </View>
                </React.Fragment>
              );
            })}
          </View>

          {/* ================================================================= */}
          {/* INTRODUCTION                                                      */}
          {/* ================================================================= */}

          <AwaCard variant="filled" padding="none" style={styles.introCard}>
            <View style={styles.introIcon}>
              <MaterialDesignIcons
                name="information-outline"
                size={22}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.introCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.introTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.introText}>
                {content.introText}
              </AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* TABLE OF CONTENTS                                                 */}
          {/* ================================================================= */}

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <View style={styles.contentsHeader}>
              <View>
                <AwaText variant="labelSmall" emphasized colorRole="primary">
                  {content.contentsEyebrow}
                </AwaText>

                <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>
                  {content.contentsTitle}
                </AwaText>
              </View>

              <View style={styles.contentsCount}>
                <AwaText variant="labelSmall" emphasized colorRole="primary">
                  {String(content.contents.length).padStart(2, '0')}
                </AwaText>
              </View>
            </View>

            {content.contents.map((item, index) => (
              <View
                key={item}
                style={[
                  styles.contentRow,
                  index === content.contents.length - 1 &&
                    styles.contentRowLast,
                ]}>
                <View style={styles.contentLeft}>
                  <View style={styles.numberCircle}>
                    <AwaText variant="labelSmall" emphasized colorRole="primary">
                      {index + 1}
                    </AwaText>
                  </View>

                  <AwaText variant="bodySmall" style={styles.contentText}>
                    {item}
                  </AwaText>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={18}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 01                                                        */}
          {/* ================================================================= */}

          <SectionHeading
            styles={styles}
            number="01"
            kicker={content.section1Kicker}
            title={content.section1Title}
          />

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body2}
          </AwaText>

          {/* STAT CARD */}

          <AwaCard variant="filled" padding="none" style={styles.statCard}>
            <View style={styles.statIcon}>
              <MaterialDesignIcons
                name="account-heart-outline"
                size={24}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.statCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.statTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.statText}>
                {content.statText}
              </AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 02                                                        */}
          {/* ================================================================= */}

          <SectionHeading
            styles={styles}
            number="02"
            kicker={content.section2Kicker}
            title={content.section2Title}
          />

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section2Body}
          </AwaText>

          {/* SIGNS GRID */}

          <View style={styles.signGrid}>
            {SIGN_ICONS.map(
              (icon, index) => {
                const {title, description} = content.commonSigns[index];

                return (
                  <AwaCard variant="filled" padding="none"
                    key={title}
                    style={styles.signCard}>
                    <View style={styles.signIcon}>
                      <MaterialDesignIcons
                        name={icon as never}
                        size={21}
                        color={theme.colors.primary}
                      />
                    </View>

                    <AwaText variant="titleSmall" emphasized style={styles.signTitle}>
                      {title}
                    </AwaText>

                    <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.signDescription}>
                      {description}
                    </AwaText>
                  </AwaCard>
                );
              },
            )}
          </View>

          {/* ================================================================= */}
          {/* SECTION 03                                                        */}
          {/* ================================================================= */}

          <SectionHeading
            styles={styles}
            number="03"
            kicker={content.section3Kicker}
            title={content.section3Title}
          />

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body}
          </AwaText>

          {/* SUPPORT LIST */}

          <View style={styles.supportList}>
            {SUPPORT_ICONS.map(
              (icon, index) => {
                const {title, description} = content.dailySupport[index];

                return (
                  <AwaCard variant="filled" padding="none"
                    key={title}
                    style={styles.supportRow}>
                    <View style={styles.supportIcon}>
                      <MaterialDesignIcons
                        name={icon as never}
                        size={21}
                        color={theme.colors.success}
                      />
                    </View>

                    <View style={styles.supportCopy}>
                      <AwaText variant="titleSmall" emphasized>
                        {title}
                      </AwaText>

                      <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.supportDescription}>
                        {description}
                      </AwaText>
                    </View>

                    <View style={styles.supportNumber}>
                      <AwaText variant="labelSmall" emphasized colorRole="success">
                        {index + 1}
                      </AwaText>
                    </View>
                  </AwaCard>
                );
              },
            )}
          </View>

          {/* QUOTE */}

          <AwaCard variant="filled" padding="none" style={styles.quoteCard}>
            <View style={styles.quoteIcon}>
              <MaterialDesignIcons
                name="format-quote-open"
                size={25}
                color={theme.colors.primary}
              />
            </View>

            <AwaText variant="bodyLarge" style={styles.quoteText}>
              {content.quoteText}
            </AwaText>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 04                                                        */}
          {/* ================================================================= */}

          <SectionHeading
            styles={styles}
            number="04"
            kicker={content.section4Kicker}
            title={content.section4Title}
          />

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section4Body}
          </AwaText>

          {/* COMPARISON */}

          <AwaCard variant="filled" padding="none" style={styles.compareCard}>
            <View style={styles.compareHeader}>
              <View style={styles.compareHeaderIcon}>
                <MaterialDesignIcons
                  name="compare-horizontal"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>

              <AwaText variant="titleSmall" emphasized style={styles.compareTitle}>
                {content.compareTitle}
              </AwaText>
            </View>

            <View style={styles.compareItem}>
              <View style={styles.compareDotNormal} />

              <View style={styles.compareCopy}>
                <AwaText variant="titleSmall" emphasized>
                  {content.compareBabyBluesTitle}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.compareItemText}>
                  {content.compareBabyBluesText}
                </AwaText>
              </View>
            </View>

            <View style={styles.compareLine} />

            <View style={styles.compareItem}>
              <View style={styles.compareDotAttention} />

              <View style={styles.compareCopy}>
                <AwaText variant="titleSmall" emphasized>
                  {content.comparePostpartumTitle}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.compareItemText}>
                  {content.comparePostpartumText}
                </AwaText>
              </View>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 05                                                        */}
          {/* ================================================================= */}

          <SectionHeading
            styles={styles}
            number="05"
            kicker={content.section5Kicker}
            title={content.section5Title}
          />

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section5Body}
          </AwaText>

          {/* ATTENTION CARD */}

          <AwaCard variant="filled" padding="none" style={styles.attentionCard}>
            <View style={styles.attentionHeader}>
              <View style={styles.attentionIcon}>
                <MaterialDesignIcons
                  name="alert-circle-outline"
                  size={22}
                  color={theme.colors.warning}
                />
              </View>

              <View style={styles.attentionHeaderCopy}>
                <AwaText variant="titleSmall" emphasized>
                  {content.attentionTitle}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="warning" style={styles.attentionSubtitle}>
                  {content.attentionSubtitle}
                </AwaText>
              </View>
            </View>

            {content.attentionSigns.map((item, index) => (
              <View
                key={item}
                style={styles.attentionRow}>
                <View style={styles.attentionBullet}>
                  <AwaText variant="labelSmall" emphasized colorRole="warning">
                    {index + 1}
                  </AwaText>
                </View>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.attentionText}>
                  {item}
                </AwaText>
              </View>
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* PROFESSIONAL SUPPORT                                              */}
          {/* ================================================================= */}

          <AwaCard variant="filled" padding="none" style={styles.professionalCard}>
            <View style={styles.professionalIcon}>
              <MaterialDesignIcons
                name="stethoscope"
                size={24}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.professionalCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.professionalTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.professionalText}>
                {content.professionalText}
              </AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* GOOD TO KNOW                                                      */}
          {/* ================================================================= */}

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <View style={styles.tipIcon}>
              <MaterialDesignIcons
                name="lightbulb-outline"
                size={23}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.tipTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tipText}
              </AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 06                                                        */}
          {/* ================================================================= */}

          <SectionHeading
            styles={styles}
            number="06"
            kicker={content.section6Kicker}
            title={content.section6Title}
          />

          <AwaCard variant="filled" padding="none" style={styles.takeawayList}>
            {content.takeaways.map((text, index) => (
              <Takeaway
                key={text}
                styles={styles}
                successColor={theme.colors.success}
                text={text}
                last={index === content.takeaways.length - 1}
              />
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* DISCLAIMER                                                         */}
          {/* ================================================================= */}

          <AwaCard variant="filled" padding="none" style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-check-outline"
              size={19}
              color={theme.colors.textMuted}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.disclaimerText}>
              {content.disclaimerText}
            </AwaText>
          </AwaCard>

          {/* ================================================================= */}
          {/* END                                                                */}
          {/* ================================================================= */}

          <View style={styles.endMark}>
            <View style={styles.endLine} />

            <View style={styles.endIcon}>
              <MaterialDesignIcons
                name="heart-outline"
                size={18}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.endLine} />
          </View>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.endText}>
            {content.endText}
          </AwaText>
        </View>
      </ScrollView>

      {/* ==================================================================== */}
      {/* READING CONTROLS                                                     */}
      {/* ==================================================================== */}

      <ReadingControls
        articleId={ID}
        durationMinutes={10}
        scrollRef={scrollRef}
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                             SECTION HEADING                                */
/* -------------------------------------------------------------------------- */

function SectionHeading({
  styles,
  number,
  kicker,
  title,
}: {
  styles: ReturnType<typeof createStyles>;
  number: string;
  kicker: string;
  title: string;
}): React.JSX.Element {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionNumber}>
        <AwaText variant="labelSmall" emphasized colorRole="primary">
          {number}
        </AwaText>
      </View>

      <View style={styles.sectionHeadingCopy}>
        <AwaText variant="labelSmall" emphasized colorRole="primary">
          {kicker}
        </AwaText>

        <AwaText variant="titleLarge" emphasized style={styles.h2}>
          {title}
        </AwaText>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                TAKEAWAY                                    */
/* -------------------------------------------------------------------------- */

function Takeaway({
  styles,
  successColor,
  text,
  last = false,
}: {
  styles: ReturnType<typeof createStyles>;
  successColor: string;
  text: string;
  last?: boolean;
}): React.JSX.Element {
  return (
    <View
      style={[
        styles.takeawayRow,
        last && styles.takeawayRowLast,
      ]}>
      <View style={styles.takeawayCheck}>
        <MaterialDesignIcons
          name="check"
          size={16}
          color={successColor}
        />
      </View>

      <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.takeawayText}>
        {text}
      </AwaText>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  /* ------------------------------------------------------------------------ */
  /* SCREEN                                                                  */
  /* ------------------------------------------------------------------------ */

  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scroll: {
    paddingBottom: 32,
  },

  /* ------------------------------------------------------------------------ */
  /* HERO                                                                    */
  /* ------------------------------------------------------------------------ */

  heroWrap: {
    height: 265,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceSecondary,
  },

  hero: {
    width: '100%',
    height: '100%',
  },


  /* ------------------------------------------------------------------------ */
  /* TOP BAR                                                                 */
  /* ------------------------------------------------------------------------ */

  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
  },



  /* ------------------------------------------------------------------------ */
  /* HERO LABEL (currently unused, kept theme-safe for future use)           */
  /* ------------------------------------------------------------------------ */

  heroLabel: {
    position: 'absolute',
    left: 20,
    bottom: 31,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 12,
    paddingVertical: 8,

    borderRadius: 12,

    backgroundColor: withAlpha(theme.colors.text, 0.72),

    gap: 8,
  },

  heroLabelIcon: {
    width: 21,
    height: 21,
    borderRadius: 11,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: withAlpha(theme.colors.surface, 0.12),
  },

  heroLabelText: {
    color: theme.colors.surface,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  /* ------------------------------------------------------------------------ */
  /* ARTICLE                                                                 */
  /* ------------------------------------------------------------------------ */

  article: {
    marginTop: -24,

    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,

    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,

    backgroundColor: theme.colors.background,
  },

  /* ------------------------------------------------------------------------ */
  /* BADGE                                                                   */
  /* ------------------------------------------------------------------------ */

  badge: {
    alignSelf: 'flex-start',

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 12,
    paddingVertical: 8,

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,

    gap: 4,
  },


  /* ------------------------------------------------------------------------ */
  /* TITLE                                                                   */
  /* ------------------------------------------------------------------------ */

  title: {
    marginTop: 12,


  },

  subtitle: {
    marginTop: 12,


  },

  /* ------------------------------------------------------------------------ */
  /* META                                                                    */
  /* ------------------------------------------------------------------------ */

  metas: {
    marginTop: 16,

    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',

    gap: 8,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metaDivider: {
    width: 1,
    height: 19,
    backgroundColor: theme.colors.border,
  },


  /* ------------------------------------------------------------------------ */
  /* INTRO CARD                                                              */
  /* ------------------------------------------------------------------------ */

  introCard: {
    marginTop: 20,

    padding: 16,

    flexDirection: 'row',
    alignItems: 'flex-start',



  },

  introIcon: {
    width: 41,
    height: 41,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },

  introCopy: {
    flex: 1,
    marginLeft: 12,
  },


  introText: {
    marginTop: 4,


  },

  /* ------------------------------------------------------------------------ */
  /* CONTENTS                                                                */
  /* ------------------------------------------------------------------------ */

  contents: {
    marginTop: 24,

    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,



  },

  contentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 8,
  },


  contentsTitle: {
    marginTop: 2,

  },

  contentsCount: {
    width: 35,
    height: 35,

    borderRadius: 18,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },


  contentRow: {
    minHeight: 48,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  contentRowLast: {
    borderBottomWidth: 0,
  },

  contentLeft: {
    flex: 1,

    flexDirection: 'row',
    alignItems: 'center',
  },

  numberCircle: {
    width: 26,
    height: 26,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,

    marginRight: 12,
  },


  contentText: {
    flex: 1,


  },

  /* ------------------------------------------------------------------------ */
  /* SECTION HEADING                                                         */
  /* ------------------------------------------------------------------------ */

  sectionHeading: {
    marginTop: 32,

    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  sectionNumber: {
    width: 39,
    height: 39,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.primarySoft,
  },


  sectionHeadingCopy: {
    flex: 1,

    marginLeft: 12,
    paddingTop: 1,
  },


  h2: {
    marginTop: 2,


  },

  /* ------------------------------------------------------------------------ */
  /* BODY                                                                    */
  /* ------------------------------------------------------------------------ */

  body: {
    marginTop: 12,


  },

  /* ------------------------------------------------------------------------ */
  /* STAT CARD                                                               */
  /* ------------------------------------------------------------------------ */

  statCard: {
    marginTop: 16,

    padding: 16,

    flexDirection: 'row',
    alignItems: 'center',



  },

  statIcon: {
    width: 45,
    height: 45,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.primarySoft,
  },

  statCopy: {
    flex: 1,
    marginLeft: 12,
  },


  statText: {
    marginTop: 4,


  },

  /* ------------------------------------------------------------------------ */
  /* SIGNS                                                                    */
  /* ------------------------------------------------------------------------ */

  signGrid: {
    marginTop: 16,

    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',

    gap: 8,
  },

  signCard: {
    width: '48.3%',
    minHeight: 158,

    padding: 12,




  },

  signIcon: {
    width: 37,
    height: 37,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.primarySoft,
  },

  signTitle: {
    marginTop: 12,

  },

  signDescription: {
    marginTop: 4,


  },

  /* ------------------------------------------------------------------------ */
  /* SUPPORT                                                                  */
  /* ------------------------------------------------------------------------ */

  supportList: {
    marginTop: 16,
    gap: 8,
  },

  supportRow: {
    minHeight: 77,

    padding: 12,

    flexDirection: 'row',
    alignItems: 'center',


    backgroundColor: withAlpha(theme.colors.success, 0.12),

  },

  supportIcon: {
    width: 42,
    height: 42,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },

  supportCopy: {
    flex: 1,
    marginLeft: 12,
  },


  supportDescription: {
    marginTop: 3,


  },

  supportNumber: {
    width: 25,
    height: 25,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },


  /* ------------------------------------------------------------------------ */
  /* QUOTE                                                                    */
  /* ------------------------------------------------------------------------ */

  quoteCard: {
    marginTop: 20,

    padding: 20,



  },

  quoteIcon: {
    width: 30,
    height: 30,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor: theme.colors.surface,
  },

  quoteText: {
    marginTop: 8,


    fontStyle: 'italic',
  },

  /* ------------------------------------------------------------------------ */
  /* COMPARISON                                                               */
  /* ------------------------------------------------------------------------ */

  compareCard: {
    marginTop: 16,

    padding: 16,




  },

  compareHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 12,
  },

  compareHeaderIcon: {
    width: 38,
    height: 38,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.primarySoft,
  },

  compareTitle: {
    flex: 1,

    marginLeft: 12,

  },

  compareItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // The two dots below are a genuine two-state legend (not decorative):
  // green = baby blues (mild, self-resolving), amber = postpartum
  // depression (needs professional evaluation). Both states map cleanly
  // onto the app's existing success/warning semantic tokens, so no fixed
  // hex value is needed here — this is not a documented exception.
  compareDotNormal: {
    width: 10,
    height: 10,

    borderRadius: 5,

    marginTop: 4,

    backgroundColor: theme.colors.success,
  },

  compareDotAttention: {
    width: 10,
    height: 10,

    borderRadius: 5,

    marginTop: 4,

    backgroundColor: theme.colors.warning,
  },

  compareCopy: {
    flex: 1,
    marginLeft: 12,
  },


  compareItemText: {
    marginTop: 4,


  },

  compareLine: {
    height: 1,

    marginVertical: 16,

    backgroundColor: theme.colors.border,
  },

  /* ------------------------------------------------------------------------ */
  /* ATTENTION                                                                */
  /* ------------------------------------------------------------------------ */

  attentionCard: {
    marginTop: 16,

    padding: 16,


    backgroundColor: withAlpha(theme.colors.warning, 0.12),

  },

  attentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 12,
  },

  attentionIcon: {
    width: 42,
    height: 42,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },

  attentionHeaderCopy: {
    flex: 1,
    marginLeft: 12,
  },


  attentionSubtitle: {
    marginTop: 3,

  },

  attentionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    marginTop: 8,
  },

  attentionBullet: {
    width: 23,
    height: 23,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },


  attentionText: {
    flex: 1,

    marginLeft: 8,
    paddingTop: 2,


  },

  /* ------------------------------------------------------------------------ */
  /* PROFESSIONAL                                                             */
  /* ------------------------------------------------------------------------ */

  professionalCard: {
    marginTop: 16,

    padding: 16,

    flexDirection: 'row',
    alignItems: 'flex-start',



  },

  professionalIcon: {
    width: 43,
    height: 43,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },

  professionalCopy: {
    flex: 1,
    marginLeft: 12,
  },


  professionalText: {
    marginTop: 4,


  },

  /* ------------------------------------------------------------------------ */
  /* TIP                                                                      */
  /* ------------------------------------------------------------------------ */

  tip: {
    marginTop: 16,

    padding: 16,

    flexDirection: 'row',
    alignItems: 'flex-start',



  },

  tipIcon: {
    width: 40,
    height: 40,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },

  tipCopy: {
    flex: 1,
    marginLeft: 12,
  },


  tipText: {
    marginTop: 4,


  },

  /* ------------------------------------------------------------------------ */
  /* TAKEAWAYS                                                                */
  /* ------------------------------------------------------------------------ */

  takeawayList: {
    marginTop: 16,

    padding: 16,


    backgroundColor: withAlpha(theme.colors.success, 0.12),

  },

  takeawayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    marginBottom: 12,
  },

  takeawayRowLast: {
    marginBottom: 0,
  },

  takeawayCheck: {
    width: 27,
    height: 27,

    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },

  takeawayText: {
    flex: 1,

    marginLeft: 8,
    paddingTop: 3,


  },

  /* ------------------------------------------------------------------------ */
  /* DISCLAIMER                                                               */
  /* ------------------------------------------------------------------------ */

  disclaimer: {
    marginTop: 20,

    padding: 12,

    flexDirection: 'row',
    alignItems: 'flex-start',


  },

  disclaimerText: {
    flex: 1,

    marginLeft: 8,


  },

  /* ------------------------------------------------------------------------ */
  /* END                                                                      */
  /* ------------------------------------------------------------------------ */

  endMark: {
    marginTop: 28,

    flexDirection: 'row',
    alignItems: 'center',
  },

  endLine: {
    flex: 1,

    height: 1,

    backgroundColor: theme.colors.border,
  },

  endIcon: {
    width: 35,
    height: 35,

    marginHorizontal: 12,

    borderRadius: 18,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.primarySoft,
  },

  endText: {
    marginTop: 12,

    textAlign: 'center',


    fontStyle: 'italic',
  },
  });
}
