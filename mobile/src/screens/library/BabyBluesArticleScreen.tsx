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
  nb: {
    badgeText: 'BARSELTID • FØLELSESMESSIG HELSE',
    title: 'Barselgråt og følelsesmessig\nhelse etter fødselen',
    subtitle:
      'Forstå hva som kan endre seg følelsesmessig etter fødselen, og vite når du bør søke støtte.',
    metaItems: ['10 min lesing', 'Artikkel', 'Nybegynner', 'Gjennomgått innhold'],
    introTitle: 'Godt å vite',
    introText:
      'Etter fødselen er det vanlig å gå gjennom en periode med økt følelsesmessig sårbarhet. Barselgråt er vanligvis forbigående, men et ubehag som vedvarer eller forsterker seg, fortjener oppmerksomhet fra helsepersonell.',
    contentsEyebrow: 'VEILEDNING',
    contentsTitle: 'I denne artikkelen',
    contents: [
      'Forstå barselgråt',
      'De vanligste tegnene',
      'Hva som hjelper i hverdagen',
      'Barselgråt eller fødselsdepresjon?',
      'Når du bør be om hjelp',
      'Det viktigste å huske',
    ],
    section1Kicker: 'FORSTÅELSE',
    section1Title: 'Hva er barselgråt?',
    section1Body1:
      'Barselgråt er en periode med følelsesmessige endringer som kan oppstå de første dagene etter fødselen. Hormonelle svingninger, tretthet, søvnmangel og tilpasningen til denne nye fasen kan alle bidra til denne sårbarheten.',
    section1Body2:
      'Dette er ikke et nederlag, og det betyr ikke at du er en dårlig mor. Alle opplever de første dagene etter fødselen på sin egen måte.',
    statTitle: 'En vanlig opplevelse',
    statText:
      'Barselgråt er vanlig etter fødsel og bedrer seg som regel av seg selv i løpet av noen dager.',
    section2Kicker: 'TEGNENE',
    section2Title: 'Hva du kan kjenne',
    section2Body:
      'Opplevelsen varierer. Noen kjenner mest tretthet og sårbarhet, mens andre kan ha mer merkbare humørsvingninger.',
    commonSigns: [
      {
        title: 'Følelsesmessighet',
        description: 'Å gråte lettere eller være spesielt sårbar.',
      },
      {
        title: 'Overfølsomhet',
        description: 'Følelsene kan kjennes sterkere og skifte raskt.',
      },
      {
        title: 'Humørsvingninger',
        description:
          'En følelse av skjørhet kan veksle med øyeblikk av velvære.',
      },
      {
        title: 'Tretthet',
        description: 'Trettheten fra de første dagene kan forsterke følelsene.',
      },
    ],
    section3Kicker: 'I HVERDAGEN',
    section3Title: 'Hva som kan hjelpe',
    section3Body:
      'I denne perioden er behovet for hvile stort. Små, enkle ting kan gjøre dagene mer behagelige.',
    dailySupport: [
      {
        title: 'Hvile',
        description: 'Utnytt alle ledige øyeblikk til å hente deg inn.',
      },
      {
        title: 'Ta imot hjelp',
        description: 'Ikke nøl med å be menneskene rundt deg om støtte.',
      },
      {
        title: 'Drikke jevnlig',
        description: 'Hold deg tilstrekkelig hydrert gjennom dagen.',
      },
      {
        title: 'Spise nok',
        description: 'Prioriter regelmessige, enkle måltider.',
      },
    ],
    quoteText:
      '«Å be om hjelp etter fødselen er en måte å ta vare på deg selv og babyen din på.»',
    section4Kicker: 'SKILLE DEM FRA HVERANDRE',
    section4Title: 'Barselgråt eller fødselsdepresjon?',
    section4Body:
      'Barselgråt er vanligvis kortvarig og bedrer seg gradvis. Fødselsdepresjon er annerledes: den kan være mer vedvarende og mer intens, og ha stor innvirkning på hverdagen.',
    compareTitle: 'To situasjoner som bør skilles',
    compareBabyBluesTitle: 'Barselgråt',
    compareBabyBluesText:
      'Ofte kortvarig, med gradvis bedring i løpet av de neste dagene.',
    comparePostpartumTitle: 'Fødselsdepresjon',
    comparePostpartumText:
      'Kan vare lenger, forsterke seg og kreve profesjonell støtte.',
    section5Kicker: 'VÆR OPPMERKSOM',
    section5Title: 'Når bør du be om hjelp?',
    section5Body:
      'Det er viktig å snakke med helsepersonell hvis det følelsesmessige ubehaget ikke bedrer seg, blir mer intenst eller begynner å gjøre hverdagen vanskeligere.',
    attentionTitle: 'Varselsignaler å være oppmerksom på',
    attentionSubtitle: 'Snakk med helsepersonell hvis …',
    attentionSigns: [
      'Symptomene varer lenger enn to uker.',
      'Tristhet eller angst blir mer intens.',
      'Det blir vanskelig å ta vare på deg selv eller babyen.',
      'En sterk følelse av nød oppstår.',
    ],
    professionalTitle: 'Støtte finnes',
    professionalText:
      'En jordmor, lege, psykolog eller annet helsepersonell kan lytte, vurdere situasjonen og tilby passende støtte.',
    tipTitle: 'Godt å vite',
    tipText:
      'Følelsene dine etter fødselen sier ikke noe om hvor god mor du er. Du har rett til å trenge hvile, til å bli lyttet til og til å få støtte.',
    section6Kicker: 'VIKTIGE PUNKTER',
    section6Title: 'Det viktigste å huske',
    takeaways: [
      'Barselgråt er vanlig etter fødsel.',
      'Tretthet og hormonelle endringer kan påvirke humøret.',
      'Støtte fra menneskene rundt deg kan gjøre denne perioden lettere.',
      'Vedvarende eller sterkt ubehag fortjener en vurdering av helsepersonell.',
    ],
    disclaimerText:
      'Denne artikkelen er kun til informasjon og erstatter ikke personlig medisinsk rådgivning. Ved tvil eller sterkt ubehag bør du snakke med helsepersonell.',
    endText: 'Å ta vare på deg selv er også en del av barseltiden.',
    shareTitle: 'Barselgråt og følelsesmessig helse etter fødselen',
    shareMessage:
      'Barselgråt og følelsesmessig helse etter fødselen – AWA\n\nEn veiledning for å forstå de følelsesmessige endringene som er vanlige etter fødselen.',
  },
  pl: {
    badgeText: 'POŁÓG • ZDROWIE EMOCJONALNE',
    title: 'Baby blues i emocjonalne\nzdrowie w połogu',
    subtitle:
      'Zrozumieć, co może zmienić się emocjonalnie po porodzie, i wiedzieć, kiedy poszukać wsparcia.',
    metaItems: ['10 min czytania', 'Artykuł', 'Początkujący', 'Treść zweryfikowana'],
    introTitle: 'Warto wiedzieć',
    introText:
      'Po porodzie często pojawia się okres zwiększonej wrażliwości emocjonalnej. Baby blues jest zwykle przejściowy, ale cierpienie, które się utrzymuje lub nasila, zasługuje na uwagę specjalisty.',
    contentsEyebrow: 'PORADNIK',
    contentsTitle: 'W tym artykule',
    contents: [
      'Zrozumieć baby blues',
      'Najczęstsze objawy',
      'Co pomaga na co dzień',
      'Baby blues czy depresja poporodowa?',
      'Kiedy poprosić o pomoc',
      'Najważniejsze wnioski',
    ],
    section1Kicker: 'ZROZUMIEĆ',
    section1Title: 'Czym jest baby blues?',
    section1Body1:
      'Baby blues to okres zmian emocjonalnych, który może wystąpić w pierwszych dniach po porodzie. Zmiany hormonalne, zmęczenie, brak snu i przystosowanie się do nowego etapu mogą przyczyniać się do tej wrażliwości.',
    section1Body2:
      'To nie jest porażka i nie oznacza, że jesteś złą mamą. Każda przeżywa pierwsze dni połogu na swój sposób.',
    statTitle: 'Częste doświadczenie',
    statText:
      'Baby blues jest częsty po porodzie i zwykle sam ustępuje w ciągu kilku dni.',
    section2Kicker: 'OBJAWY',
    section2Title: 'Co możesz czuć',
    section2Body:
      'Doświadczenia są różne. Niektóre osoby odczuwają głównie zmęczenie i wrażliwość, a inne mogą mieć wyraźniejsze zmiany nastroju.',
    commonSigns: [
      {
        title: 'Emocjonalność',
        description: 'Łatwiejsze płakanie lub szczególna wrażliwość.',
      },
      {
        title: 'Nadwrażliwość',
        description: 'Emocje mogą być odczuwane mocniej i szybko się zmieniać.',
      },
      {
        title: 'Wahania nastroju',
        description:
          'Poczucie kruchości może przeplatać się z chwilami dobrego samopoczucia.',
      },
      {
        title: 'Zmęczenie',
        description: 'Zmęczenie z pierwszych dni może wzmacniać emocje.',
      },
    ],
    section3Kicker: 'NA CO DZIEŃ',
    section3Title: 'Co może pomóc',
    section3Body:
      'W tym okresie potrzeba odpoczynku jest duża. Małe, proste rzeczy mogą sprawić, że dni będą wygodniejsze.',
    dailySupport: [
      {
        title: 'Odpoczynek',
        description: 'Wykorzystywanie każdej wolnej chwili na regenerację.',
      },
      {
        title: 'Przyjmowanie pomocy',
        description: 'Nie wahaj się prosić o wsparcie osoby wokół siebie.',
      },
      {
        title: 'Regularne picie',
        description: 'Utrzymywanie odpowiedniego nawodnienia w ciągu dnia.',
      },
      {
        title: 'Jedzenie w wystarczającej ilości',
        description: 'Wybieranie regularnych, prostych posiłków.',
      },
    ],
    quoteText:
      '„Proszenie o pomoc w połogu to sposób na zadbanie o siebie i o swoje dziecko.”',
    section4Kicker: 'JAK ODRÓŻNIĆ',
    section4Title: 'Baby blues czy depresja poporodowa?',
    section4Body:
      'Baby blues jest zwykle krótkotrwały i stopniowo ustępuje. Depresja poporodowa jest inna: może być bardziej uporczywa, intensywniejsza i znacząco wpływać na codzienne życie.',
    compareTitle: 'Dwie sytuacje do odróżnienia',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Często krótkotrwały, ze stopniową poprawą w kolejnych dniach.',
    comparePostpartumTitle: 'Depresja poporodowa',
    comparePostpartumText:
      'Może trwać dłużej, nasilać się i wymagać profesjonalnego wsparcia.',
    section5Kicker: 'CZUJNOŚĆ',
    section5Title: 'Kiedy poprosić o pomoc?',
    section5Body:
      'Ważne jest, by porozmawiać ze specjalistą, jeśli cierpienie emocjonalne nie ustępuje, staje się intensywniejsze lub zaczyna utrudniać codzienne życie.',
    attentionTitle: 'Objawy ostrzegawcze',
    attentionSubtitle: 'Porozmawiaj ze specjalistą, jeśli…',
    attentionSigns: [
      'Objawy trwają dłużej niż dwa tygodnie.',
      'Smutek lub lęk staje się intensywniejszy.',
      'Trudno jest zadbać o siebie lub o dziecko.',
      'Pojawia się silne poczucie cierpienia.',
    ],
    professionalTitle: 'Wsparcie jest dostępne',
    professionalText:
      'Położna, lekarz, psycholog lub inny specjalista może Cię wysłuchać, ocenić sytuację i zaproponować odpowiednie wsparcie.',
    tipTitle: 'Warto wiedzieć',
    tipText:
      'Emocje w połogu nie są miarą tego, jak dobrą jesteś mamą. Masz prawo potrzebować odpoczynku, być wysłuchana i otrzymać wsparcie.',
    section6Kicker: 'NAJWAŻNIEJSZE',
    section6Title: 'Najważniejsze wnioski',
    takeaways: [
      'Baby blues jest częsty po porodzie.',
      'Zmęczenie i zmiany hormonalne mogą wpływać na nastrój.',
      'Wsparcie bliskich może ułatwić ten okres.',
      'Uporczywe lub znaczne cierpienie zasługuje na ocenę specjalisty.',
    ],
    disclaimerText:
      'Ten artykuł ma charakter informacyjny i nie zastępuje spersonalizowanej porady medycznej. W razie wątpliwości lub znacznego cierpienia porozmawiaj ze specjalistą.',
    endText: 'Dbanie o siebie to również część połogu.',
    shareTitle: 'Baby blues i emocjonalne zdrowie w połogu',
    shareMessage:
      'Baby blues i emocjonalne zdrowie w połogu — AWA\n\nPrzewodnik, który pomaga zrozumieć zmiany emocjonalne częste po porodzie.',
  },
  uk: {
    badgeText: 'ПІСЛЯ ПОЛОГІВ • ЕМОЦІЙНЕ ЗДОРОВ’Я',
    title: 'Бейбі-блюз та емоційне здоров’я\nпісля пологів',
    subtitle:
      'Розуміння того, що може змінитися емоційно після пологів, і знання, коли шукати підтримки.',
    metaItems: ['10 хв читання', 'Стаття', 'Початковий', 'Перевірений вміст'],
    introTitle: 'Варто знати',
    introText:
      'Після пологів часто настає період підвищеної емоційної чутливості. Бейбі-блюз зазвичай тимчасовий, але страждання, що зберігається чи посилюється, заслуговує на увагу фахівця.',
    contentsEyebrow: 'ПОСІБНИК',
    contentsTitle: 'У цій статті',
    contents: [
      'Розуміння бейбі-блюзу',
      'Найпоширеніші ознаки',
      'Що допомагає щодня',
      'Бейбі-блюз чи післяпологова депресія?',
      'Коли просити допомоги',
      'Головні висновки',
    ],
    section1Kicker: 'РОЗУМІННЯ',
    section1Title: 'Що таке бейбі-блюз?',
    section1Body1:
      'Бейбі-блюз — це період емоційних змін, що може виникнути в перші дні після пологів. До цієї чутливості можуть сприяти гормональні зміни, втома, брак сну та пристосування до нового етапу.',
    section1Body2:
      'Це не невдача й не означає, що ви погана мама. Кожна переживає перші дні після пологів по-своєму.',
    statTitle: 'Поширений досвід',
    statText:
      'Бейбі-блюз поширений після пологів і має тенденцію минати сам протягом кількох днів.',
    section2Kicker: 'ОЗНАКИ',
    section2Title: 'Що ви можете відчувати',
    section2Body:
      'Досвід різниться. Дехто відчуває переважно втому й чутливість, а інші можуть мати виразніші зміни настрою.',
    commonSigns: [
      {
        title: 'Емоційність',
        description: 'Легше плакати або особлива чутливість.',
      },
      {
        title: 'Підвищена чутливість',
        description: 'Емоції можуть відчуватися сильніше й швидко змінюватися.',
      },
      {
        title: 'Перепади настрою',
        description:
          'Відчуття крихкості може чергуватися з моментами добробуту.',
      },
      {
        title: 'Втома',
        description: 'Втома перших днів може підсилювати емоції.',
      },
    ],
    section3Kicker: 'НА ЩОДЕНЬ',
    section3Title: 'Що може допомогти',
    section3Body:
      'У цей період потреба у відпочинку значна. Малі, прості речі можуть зробити дні комфортнішими.',
    dailySupport: [
      {
        title: 'Відпочинок',
        description: 'Користуйтеся будь-якою вільною хвилиною, щоб відновитися.',
      },
      {
        title: 'Прийняття допомоги',
        description: 'Не вагайтеся просити підтримки в оточуючих.',
      },
      {
        title: 'Регулярне пиття',
        description: 'Підтримуйте достатнє споживання рідини протягом дня.',
      },
      {
        title: 'Достатнє харчування',
        description: 'Віддавайте перевагу регулярній, простій їжі.',
      },
    ],
    quoteText:
      '«Просити допомоги після пологів — це спосіб подбати про себе й про свою дитину.»',
    section4Kicker: 'ЯК РОЗРІЗНИТИ',
    section4Title: 'Бейбі-блюз чи післяпологова депресія?',
    section4Body:
      'Бейбі-блюз зазвичай короткий і поступово покращується. Післяпологова депресія інша: вона може бути стійкішою, інтенсивнішою та значно впливати на щоденне життя.',
    compareTitle: 'Дві ситуації, які слід розрізняти',
    compareBabyBluesTitle: 'Бейбі-блюз',
    compareBabyBluesText:
      'Часто короткий, з поступовим покращенням у наступні дні.',
    comparePostpartumTitle: 'Післяпологова депресія',
    comparePostpartumText:
      'Може тривати довше, посилюватися та потребувати професійної підтримки.',
    section5Kicker: 'БУДЬТЕ УВАЖНІ',
    section5Title: 'Коли просити допомоги?',
    section5Body:
      'Важливо поговорити з медичним фахівцем, якщо емоційне страждання не покращується, стає інтенсивнішим або починає ускладнювати щоденне життя.',
    attentionTitle: 'Тривожні ознаки, на які варто звертати увагу',
    attentionSubtitle: 'Поговоріть зі спеціалістом, якщо…',
    attentionSigns: [
      'Симптоми тривають понад два тижні.',
      'Смуток або тривога стають інтенсивнішими.',
      'Стає важко дбати про себе чи про дитину.',
      'З’являється виразне відчуття страждання.',
    ],
    professionalTitle: 'Підтримка доступна',
    professionalText:
      'Акушерка, лікар, психолог або інший медичний фахівець може вислухати, оцінити ситуацію та запропонувати відповідну підтримку.',
    tipTitle: 'Варто знати',
    tipText:
      'Емоції після пологів не є мірилом того, наскільки ви хороша мама. Ви маєте право потребувати відпочинку, бути вислуханою й отримувати підтримку.',
    section6Kicker: 'КЛЮЧОВІ МОМЕНТИ',
    section6Title: 'Головні висновки',
    takeaways: [
      'Бейбі-блюз поширений після пологів.',
      'Втома та гормональні зміни можуть впливати на настрій.',
      'Підтримка оточення може полегшити цей період.',
      'Стійке або значне страждання заслуговує на оцінку фахівця.',
    ],
    disclaimerText:
      'Ця стаття має інформаційний характер і не замінює персоналізованої медичної поради. У разі сумнівів або значного страждання поговоріть із медичним фахівцем.',
    endText: 'Дбайливе ставлення до себе — також частина післяпологового періоду.',
    shareTitle: 'Бейбі-блюз та емоційне здоров’я після пологів',
    shareMessage:
      'Бейбі-блюз та емоційне здоров’я після пологів — AWA\n\nПосібник, що допомагає зрозуміти емоційні зміни, поширені після пологів.',
  },
  cs: {
    badgeText: 'PO PORODU • EMOČNÍ ZDRAVÍ',
    title: 'Baby blues a emoční\nzdraví po porodu',
    subtitle:
      'Pochopte, co se může po porodu emočně měnit, a vězte, kdy vyhledat podporu.',
    metaItems: ['10 min čtení', 'Článek', 'Začátečník', 'Ověřený obsah'],
    introTitle: 'Stojí za to vědět',
    introText:
      'Po porodu je běžné procházet obdobím zvýšené emoční citlivosti. Baby blues bývá přechodné, ale tíseň, která přetrvává nebo sílí, si zaslouží odbornou pozornost.',
    contentsEyebrow: 'PRŮVODCE',
    contentsTitle: 'V tomto článku',
    contents: [
      'Pochopení baby blues',
      'Nejčastější příznaky',
      'Co pomáhá v každodenním životě',
      'Baby blues, nebo poporodní deprese?',
      'Kdy požádat o pomoc',
      'Hlavní poznatky',
    ],
    section1Kicker: 'POCHOPENÍ',
    section1Title: 'Co je baby blues?',
    section1Body1:
      'Baby blues je období emočních změn, které se může objevit v prvních dnech po porodu. K této citlivosti mohou přispívat hormonální změny, únava, nedostatek spánku i přizpůsobování se nové životní etapě.',
    section1Body2:
      'Není to selhání a neznamená to, že jste špatná matka. Každá žena prožívá první dny po porodu po svém.',
    statTitle: 'Běžná zkušenost',
    statText:
      'Baby blues je po porodu běžné a obvykle samo během několika dnů odezní.',
    section2Kicker: 'PŘÍZNAKY',
    section2Title: 'Co můžete cítit',
    section2Body:
      'Prožitky se liší. Některé ženy cítí hlavně únavu a citlivost, jiné mohou mít výraznější výkyvy nálady.',
    commonSigns: [
      {
        title: 'Emotivnost',
        description: 'Snadnější pláč nebo zvláštní citlivost.',
      },
      {
        title: 'Přecitlivělost',
        description: 'Emoce mohou být silnější a rychle se měnit.',
      },
      {
        title: 'Výkyvy nálady',
        description:
          'Pocit křehkosti se může střídat s chvílemi pohody.',
      },
      {
        title: 'Únava',
        description: 'Únava z prvních dnů může emoce zesilovat.',
      },
    ],
    section3Kicker: 'KAŽDÝ DEN',
    section3Title: 'Co může pomoci',
    section3Body:
      'V tomto období je potřeba odpočinku velká. Malé, jednoduché věci mohou dny zpříjemnit.',
    dailySupport: [
      {
        title: 'Odpočívat',
        description: 'Využít každou volnou chvilku k načerpání sil.',
      },
      {
        title: 'Přijmout pomoc',
        description: 'Neváhejte požádat o podporu své okolí.',
      },
      {
        title: 'Pravidelně pít',
        description: 'Udržovat dostatečný pitný režim během dne.',
      },
      {
        title: 'Dostatečně jíst',
        description: 'Dávat přednost pravidelným, jednoduchým jídlům.',
      },
    ],
    quoteText:
      '„Požádat o pomoc po porodu je způsob, jak pečovat o sebe i o své dítě.“',
    section4Kicker: 'ROZLIŠENÍ',
    section4Title: 'Baby blues, nebo poporodní deprese?',
    section4Body:
      'Baby blues bývá krátké a postupně se zlepšuje. Poporodní deprese je jiná: může být déletrvající, intenzivnější a výrazně ovlivnit každodenní život.',
    compareTitle: 'Dvě situace, které je třeba rozlišit',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Často krátké, s postupným zlepšením během následujících dnů.',
    comparePostpartumTitle: 'Poporodní deprese',
    comparePostpartumText:
      'Může trvat déle, sílit a vyžadovat odbornou podporu.',
    section5Kicker: 'POZORNOST',
    section5Title: 'Kdy požádat o pomoc?',
    section5Body:
      'Je důležité promluvit si se zdravotnickým pracovníkem, pokud se emoční tíseň nelepší, zesiluje nebo začíná ztěžovat každodenní život.',
    attentionTitle: 'Varovné signály, kterých si všímat',
    attentionSubtitle: 'Promluvte si s odborníkem, pokud…',
    attentionSigns: [
      'Příznaky trvají déle než dva týdny.',
      'Smutek nebo úzkost sílí.',
      'Je obtížné pečovat o sebe nebo o dítě.',
      'Objevuje se výrazný pocit tísně.',
    ],
    professionalTitle: 'Podpora je k dispozici',
    professionalText:
      'Porodní asistentka, lékař, psycholog nebo jiný zdravotnický pracovník vás může vyslechnout, posoudit situaci a nabídnout vhodnou podporu.',
    tipTitle: 'Stojí za to vědět',
    tipText:
      'Poporodní emoce nejsou měřítkem toho, jak dobrá jste matka. Máte právo potřebovat odpočinek, být vyslechnuta a mít podporu.',
    section6Kicker: 'KLÍČOVÉ BODY',
    section6Title: 'Hlavní poznatky',
    takeaways: [
      'Baby blues je po porodu běžné.',
      'Únava a hormonální změny mohou ovlivnit náladu.',
      'Podpora okolí může toto období usnadnit.',
      'Přetrvávající nebo výrazná tíseň si zaslouží odborné posouzení.',
    ],
    disclaimerText:
      'Tento článek má informativní charakter a nenahrazuje individuální lékařskou radu. Pokud máte pochybnosti nebo prožíváte výraznou tíseň, promluvte si se zdravotnickým pracovníkem.',
    endText: 'Péče o sebe je také součástí období po porodu.',
    shareTitle: 'Baby blues a emoční zdraví po porodu',
    shareMessage:
      'Baby blues a emoční zdraví po porodu — AWA\n\nPrůvodce emočními změnami, které jsou po porodu běžné.',
  },
  sk: {
    badgeText: 'PO PÔRODE • EMOČNÉ ZDRAVIE',
    title: 'Baby blues a emočné\nzdravie po pôrode',
    subtitle:
      'Pochopte, čo sa môže po pôrode emočne meniť, a vedzte, kedy hľadať podporu.',
    metaItems: ['10 min čítania', 'Článok', 'Začiatočník', 'Overený obsah'],
    introTitle: 'Stojí za to vedieť',
    introText:
      'Po pôrode je bežné prejsť obdobím zvýšenej emočnej citlivosti. Baby blues je zvyčajne dočasné, ale ťažkosti, ktoré pretrvávajú alebo sa stupňujú, si zaslúžia odbornú pozornosť.',
    contentsEyebrow: 'SPRIEVODCA',
    contentsTitle: 'V tomto článku',
    contents: [
      'Pochopenie baby blues',
      'Najčastejšie príznaky',
      'Čo pomáha v každodennom živote',
      'Baby blues alebo popôrodná depresia?',
      'Kedy požiadať o pomoc',
      'Hlavné body',
    ],
    section1Kicker: 'POCHOPENIE',
    section1Title: 'Čo je baby blues?',
    section1Body1:
      'Baby blues je obdobie emočných zmien, ktoré sa môže objaviť v prvých dňoch po pôrode. K tejto citlivosti môžu prispievať hormonálne zmeny, únava, nedostatok spánku a prispôsobovanie sa novej životnej etape.',
    section1Body2:
      'Nie je to zlyhanie a neznamená to, že ste zlá matka. Každá žena prežíva prvé dni po pôrode po svojom.',
    statTitle: 'Bežná skúsenosť',
    statText:
      'Baby blues je po pôrode časté a zvyčajne samo odznie do niekoľkých dní.',
    section2Kicker: 'PRÍZNAKY',
    section2Title: 'Čo môžete cítiť',
    section2Body:
      'Prežívanie je rôzne. Niektoré ženy cítia najmä únavu a citlivosť, iné môžu mať výraznejšie zmeny nálady.',
    commonSigns: [
      {
        title: 'Emocionalita',
        description: 'Ľahšie sa rozplačete alebo ste mimoriadne citlivá.',
      },
      {
        title: 'Precitlivenosť',
        description: 'Emócie môžu byť silnejšie a rýchlo sa meniť.',
      },
      {
        title: 'Zmeny nálady',
        description:
          'Pocit krehkosti sa môže striedať s chvíľami pohody.',
      },
      {
        title: 'Únava',
        description: 'Únava z prvých dní môže emócie znásobovať.',
      },
    ],
    section3Kicker: 'KAŽDÝ DEŇ',
    section3Title: 'Čo môže pomôcť',
    section3Body:
      'V tomto období je potreba odpočinku veľká. Malé, jednoduché veci môžu dni spríjemniť.',
    dailySupport: [
      {
        title: 'Odpočívať',
        description: 'Využiť každú voľnú chvíľu na regeneráciu.',
      },
      {
        title: 'Prijať pomoc',
        description: 'Neváhajte požiadať o podporu svoje okolie.',
      },
      {
        title: 'Pravidelne piť',
        description: 'Počas dňa dostatočne pite.',
      },
      {
        title: 'Dostatočne jesť',
        description: 'Uprednostnite pravidelné, jednoduché jedlá.',
      },
    ],
    quoteText:
      '„Požiadať o pomoc po pôrode je spôsob, ako sa postarať o seba a svoje bábätko.“',
    section4Kicker: 'ROZLÍŠENIE',
    section4Title: 'Baby blues alebo popôrodná depresia?',
    section4Body:
      'Baby blues je zvyčajne krátke a postupne ustupuje. Popôrodná depresia je iná: môže byť pretrvávajúcejšia, intenzívnejšia a výrazne ovplyvniť každodenný život.',
    compareTitle: 'Dve situácie, ktoré treba rozlíšiť',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Často krátke, s postupným zlepšením v nasledujúcich dňoch.',
    comparePostpartumTitle: 'Popôrodná depresia',
    comparePostpartumText:
      'Môže trvať dlhšie, stupňovať sa a vyžadovať odbornú podporu.',
    section5Kicker: 'POZORNOSŤ',
    section5Title: 'Kedy požiadať o pomoc?',
    section5Body:
      'Je dôležité porozprávať sa so zdravotníckym pracovníkom, ak emočné ťažkosti neustupujú, zosilnejú alebo začnú sťažovať každodenný život.',
    attentionTitle: 'Varovné znaky, na ktoré si treba dať pozor',
    attentionSubtitle: 'Porozprávajte sa s odborníkom, ak…',
    attentionSigns: [
      'Príznaky trvajú dlhšie ako dva týždne.',
      'Smútok alebo úzkosť zosilnejú.',
      'Stáva sa ťažké starať sa o seba alebo o bábätko.',
      'Objaví sa výrazný pocit úzkosti či tiesne.',
    ],
    professionalTitle: 'Podpora je dostupná',
    professionalText:
      'Pôrodná asistentka, lekár, psychológ alebo iný zdravotnícky pracovník vás môže vypočuť, posúdiť situáciu a ponúknuť vhodnú podporu.',
    tipTitle: 'Stojí za to vedieť',
    tipText:
      'Popôrodné emócie nie sú mierou toho, aká ste dobrá matka. Máte právo potrebovať odpočinok, byť vypočutá a podporovaná.',
    section6Kicker: 'KĽÚČOVÉ BODY',
    section6Title: 'Hlavné body',
    takeaways: [
      'Baby blues je po pôrode časté.',
      'Únava a hormonálne zmeny môžu ovplyvniť náladu.',
      'Podpora okolia môže toto obdobie uľahčiť.',
      'Pretrvávajúce alebo výrazné ťažkosti si zaslúžia odborné posúdenie.',
    ],
    disclaimerText:
      'Tento článok má informatívny charakter a nenahrádza individuálnu lekársku radu. V prípade pochybností alebo výraznej tiesne sa porozprávajte so zdravotníckym pracovníkom.',
    endText: 'Starostlivosť o seba je tiež súčasťou obdobia po pôrode.',
    shareTitle: 'Baby blues a emočné zdravie po pôrode',
    shareMessage:
      'Baby blues a emočné zdravie po pôrode — AWA\n\nSprievodca, ktorý pomáha pochopiť emočné zmeny bežné po pôrode.',
  },
  hu: {
    badgeText: 'SZÜLÉS UTÁN • ÉRZELMI EGÉSZSÉG',
    title: 'Baby blues és érzelmi\negészség szülés után',
    subtitle:
      'Értsd meg, mi változhat érzelmileg a szülés után, és tudd, mikor érdemes támogatást keresni.',
    metaItems: ['10 perc olvasás', 'Cikk', 'Kezdő', 'Ellenőrzött tartalom'],
    introTitle: 'Érdemes tudni',
    introText:
      'A szülés után gyakori, hogy az ember egy ideig fokozott érzelmi érzékenységet él át. A baby blues általában átmeneti, de a tartósan fennálló vagy erősödő szorongás szakmai figyelmet érdemel.',
    contentsEyebrow: 'ÚTMUTATÓ',
    contentsTitle: 'Ebben a cikkben',
    contents: [
      'A baby blues megértése',
      'A leggyakoribb jelek',
      'Ami a mindennapokban segít',
      'Baby blues vagy szülés utáni depresszió?',
      'Mikor kérj segítséget',
      'Legfontosabb tudnivalók',
    ],
    section1Kicker: 'MEGÉRTÉS',
    section1Title: 'Mi a baby blues?',
    section1Body1:
      'A baby blues érzelmi változások időszaka, amely a szülés utáni első napokban jelentkezhet. A hormonális változások, a fáradtság, az alváshiány és az új életszakaszhoz való alkalmazkodás mind hozzájárulhat ehhez az érzékenységhez.',
    section1Body2:
      'Ez nem kudarc, és nem jelenti azt, hogy rossz anya vagy. Mindenki a maga módján éli meg a szülés utáni első napokat.',
    statTitle: 'Gyakori tapasztalat',
    statText:
      'A baby blues gyakori a szülés után, és általában néhány napon belül magától javul.',
    section2Kicker: 'A JELEK',
    section2Title: 'Amit érezhetsz',
    section2Body:
      'A tapasztalatok különbözők. Egyesek főként fáradtságot és érzékenységet élnek meg, mások szembetűnőbb hangulatingadozást.',
    commonSigns: [
      {
        title: 'Érzelmesség',
        description: 'Könnyebben sírsz, vagy különösen érzékeny vagy.',
      },
      {
        title: 'Túlérzékenység',
        description: 'Az érzelmek erősebbnek tűnhetnek, és gyorsan változhatnak.',
      },
      {
        title: 'Hangulatingadozás',
        description:
          'A törékenység érzése váltakozhat a jó közérzet pillanataival.',
      },
      {
        title: 'Fáradtság',
        description: 'Az első napok fáradtsága felerősítheti az érzelmeket.',
      },
    ],
    section3Kicker: 'A MINDENNAPOKBAN',
    section3Title: 'Ami segíthet',
    section3Body:
      'Ebben az időszakban nagy a pihenés iránti igény. Kis, egyszerű dolgok kellemesebbé tehetik a napokat.',
    dailySupport: [
      {
        title: 'Pihenés',
        description: 'Használj ki minden szabad percet a regenerálódásra.',
      },
      {
        title: 'A segítség elfogadása',
        description: 'Ne habozz támogatást kérni a környezetedtől.',
      },
      {
        title: 'Rendszeres ivás',
        description: 'Igyál eleget a nap folyamán.',
      },
      {
        title: 'Elegendő étkezés',
        description: 'Részesítsd előnyben a rendszeres, egyszerű étkezéseket.',
      },
    ],
    quoteText:
      '„A szülés utáni időszakban segítséget kérni a magadról és a babádról való gondoskodás egyik módja.”',
    section4Kicker: 'A KÜLÖNBSÉG',
    section4Title: 'Baby blues vagy szülés utáni depresszió?',
    section4Body:
      'A baby blues általában rövid, és fokozatosan javul. A szülés utáni depresszió más: tartósabb, intenzívebb lehet, és jelentősen befolyásolhatja a mindennapi életet.',
    compareTitle: 'Két helyzet, amelyet érdemes megkülönböztetni',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Gyakran rövid, a következő napokban fokozatos javulással.',
    comparePostpartumTitle: 'Szülés utáni depresszió',
    comparePostpartumText:
      'Hosszabb ideig tarthat, erősödhet, és szakmai támogatást igényelhet.',
    section5Kicker: 'FIGYELMESSÉG',
    section5Title: 'Mikor kérj segítséget?',
    section5Body:
      'Fontos egészségügyi szakemberrel beszélni, ha az érzelmi szorongás nem javul, erősödik, vagy elkezdi megnehezíteni a mindennapokat.',
    attentionTitle: 'Figyelmeztető jelek',
    attentionSubtitle: 'Beszélj szakemberrel, ha…',
    attentionSigns: [
      'A tünetek két hétnél tovább tartanak.',
      'A szomorúság vagy a szorongás erősödik.',
      'Nehézzé válik gondoskodni magadról vagy a babádról.',
      'Jelentős szorongásérzés vagy kétségbeesés jelentkezik.',
    ],
    professionalTitle: 'Van segítség',
    professionalText:
      'Egy szülésznő, orvos, pszichológus vagy más egészségügyi szakember meghallgathat, felmérheti a helyzetet, és megfelelő támogatást ajánlhat.',
    tipTitle: 'Érdemes tudni',
    tipText:
      'A szülés utáni érzelmek nem mérik azt, mennyire vagy jó anya. Jogod van pihenésre, meghallgatásra és támogatásra.',
    section6Kicker: 'KULCSPONTOK',
    section6Title: 'Legfontosabb tudnivalók',
    takeaways: [
      'A baby blues gyakori a szülés után.',
      'A fáradtság és a hormonális változások befolyásolhatják a hangulatot.',
      'A környezeted támogatása megkönnyítheti ezt az időszakot.',
      'A tartós vagy jelentős szorongás szakmai kivizsgálást érdemel.',
    ],
    disclaimerText:
      'Ez a cikk tájékoztató jellegű, és nem helyettesíti a személyre szabott orvosi tanácsot. Kétség vagy jelentős szorongás esetén beszélj egészségügyi szakemberrel.',
    endText: 'A magadról való gondoskodás a szülés utáni időszak része.',
    shareTitle: 'Baby blues és érzelmi egészség szülés után',
    shareMessage:
      'Baby blues és érzelmi egészség szülés után — AWA\n\nÚtmutató a szülés után gyakori érzelmi változások megértéséhez.',
  },
  ro: {
    badgeText: 'POSTNATAL • SĂNĂTATE EMOȚIONALĂ',
    title: 'Baby blues și sănătatea\nemoțională postnatală',
    subtitle:
      'Înțelegerea a ceea ce se poate schimba emoțional după naștere și a momentului în care să ceri sprijin.',
    metaItems: ['10 min de citit', 'Articol', 'Începător', 'Conținut revizuit'],
    introTitle: 'Bine de știut',
    introText:
      'După naștere, este frecvent să treci printr-o perioadă de sensibilitate emoțională crescută. Baby blues-ul este de obicei trecător, dar o suferință care persistă sau se intensifică merită atenția unui profesionist.',
    contentsEyebrow: 'GHID',
    contentsTitle: 'În acest articol',
    contents: [
      'Înțelegerea baby blues-ului',
      'Cele mai frecvente semne',
      'Ce ajută zi de zi',
      'Baby blues sau depresie postnatală?',
      'Când să ceri ajutor',
      'Ce să reții',
    ],
    section1Kicker: 'ÎNȚELEGERE',
    section1Title: 'Ce este baby blues-ul?',
    section1Body1:
      'Baby blues-ul este o perioadă de schimbări emoționale care pot apărea în primele zile după naștere. Schimbările hormonale, oboseala, lipsa somnului și adaptarea la această nouă etapă pot contribui la această sensibilitate.',
    section1Body2:
      'Nu este un eșec și nu înseamnă că ești o mamă rea. Fiecare trăiește primele zile postnatale în felul ei.',
    statTitle: 'O experiență frecventă',
    statText:
      'Baby blues-ul este frecvent după naștere și tinde să se amelioreze de la sine în câteva zile.',
    section2Kicker: 'SEMNELE',
    section2Title: 'Ce poți simți',
    section2Body:
      'Ceea ce se simte variază. Unele femei simt mai ales oboseală și sensibilitate, în timp ce altele pot avea schimbări de dispoziție mai vizibile.',
    commonSigns: [
      {
        title: 'Emotivitate',
        description: 'Plângi mai ușor sau te simți deosebit de sensibilă.',
      },
      {
        title: 'Hipersensibilitate',
        description: 'Emoțiile pot părea mai puternice și se pot schimba repede.',
      },
      {
        title: 'Schimbări de dispoziție',
        description:
          'Un sentiment de fragilitate poate alterna cu momente de bine.',
      },
      {
        title: 'Oboseală',
        description: 'Oboseala primelor zile poate amplifica emoțiile.',
      },
    ],
    section3Kicker: 'ZI DE ZI',
    section3Title: 'Ce poate ajuta',
    section3Body:
      'În această perioadă, nevoia de odihnă este mare. Lucruri mici și simple pot face zilele mai confortabile.',
    dailySupport: [
      {
        title: 'Odihna',
        description: 'Profită de orice moment liber pentru a-ți reveni.',
      },
      {
        title: 'Acceptarea ajutorului',
        description: 'Nu ezita să ceri sprijin celor din jur.',
      },
      {
        title: 'Hidratarea regulată',
        description: 'Rămâi suficient de hidratată pe parcursul zilei.',
      },
      {
        title: 'Mâncatul suficient',
        description: 'Alege mese regulate și simple.',
      },
    ],
    quoteText:
      '„A cere ajutor în perioada postnatală este o modalitate de a avea grijă de tine și de bebelușul tău.”',
    section4Kicker: 'CUM DEOSEBEȘTI',
    section4Title: 'Baby blues sau depresie postnatală?',
    section4Body:
      'Baby blues-ul este de obicei scurt și se ameliorează treptat. Depresia postnatală este diferită: poate fi mai persistentă, mai intensă și poate avea un impact semnificativ asupra vieții de zi cu zi.',
    compareTitle: 'Două situații de deosebit',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Adesea scurt, cu o ameliorare treptată în zilele următoare.',
    comparePostpartumTitle: 'Depresia postnatală',
    comparePostpartumText:
      'Poate dura mai mult, se poate intensifica și poate necesita sprijin profesional.',
    section5Kicker: 'RĂMÂI ATENTĂ',
    section5Title: 'Când să ceri ajutor?',
    section5Body:
      'Este important să vorbești cu un profesionist din domeniul sănătății dacă suferința emoțională nu se ameliorează, devine mai intensă sau începe să îți îngreuneze viața de zi cu zi.',
    attentionTitle: 'Semne de alarmă de urmărit',
    attentionSubtitle: 'Vorbește cu un profesionist dacă…',
    attentionSigns: [
      'Simptomele durează mai mult de două săptămâni.',
      'Tristețea sau anxietatea devin mai intense.',
      'Devine greu să ai grijă de tine sau de bebeluș.',
      'Apare un sentiment semnificativ de suferință.',
    ],
    professionalTitle: 'Sprijinul este disponibil',
    professionalText:
      'O moașă, un medic, un psiholog sau alt profesionist din domeniul sănătății te poate asculta, evalua situația și oferi un sprijin adecvat.',
    tipTitle: 'Bine de știut',
    tipText:
      'Emoțiile postnatale nu măsoară cât de bună mamă ești. Ai dreptul să ai nevoie de odihnă, să fii ascultată și sprijinită.',
    section6Kicker: 'PUNCTE-CHEIE',
    section6Title: 'Ce să reții',
    takeaways: [
      'Baby blues-ul este frecvent după naștere.',
      'Oboseala și schimbările hormonale pot afecta starea de spirit.',
      'Sprijinul celor din jur poate ușura această perioadă.',
      'O suferință persistentă sau semnificativă merită o evaluare profesională.',
    ],
    disclaimerText:
      'Acest articol are caracter informativ și nu înlocuiește sfatul medical personalizat. Dacă ai îndoieli sau trăiești o suferință semnificativă, vorbește cu un profesionist din domeniul sănătății.',
    endText: 'A avea grijă de tine face parte și din perioada postnatală.',
    shareTitle: 'Baby blues și sănătatea emoțională postnatală',
    shareMessage:
      'Baby blues și sănătatea emoțională postnatală — AWA\n\nUn ghid pentru a înțelege schimbările emoționale frecvente după naștere.',
  },
  bg: {
    badgeText: 'СЛЕД РАЖДАНЕ • ЕМОЦИОНАЛНО ЗДРАВЕ',
    title: 'Бейби блуз и емоционално\nздраве след раждане',
    subtitle:
      'Разбиране на онова, което може да се промени емоционално след раждането, и кога да потърсиш подкрепа.',
    metaItems: ['10 мин четене', 'Статия', 'Начинаещ', 'Проверено съдържание'],
    introTitle: 'Добре е да знаеш',
    introText:
      'След раждането е често да преминеш през период на повишена емоционална чувствителност. Бейби блузът обикновено е временен, но страдание, което продължава или се засилва, заслужава вниманието на специалист.',
    contentsEyebrow: 'РЪКОВОДСТВО',
    contentsTitle: 'В тази статия',
    contents: [
      'Разбиране на бейби блуза',
      'Най-честите признаци',
      'Какво помага в ежедневието',
      'Бейби блуз или следродилна депресия?',
      'Кога да потърсиш помощ',
      'Какво да запомниш',
    ],
    section1Kicker: 'РАЗБИРАНЕ',
    section1Title: 'Какво е бейби блузът?',
    section1Body1:
      'Бейби блузът е период на емоционални промени, които могат да настъпят през първите дни след раждането. Хормоналните промени, умората, липсата на сън и приспособяването към този нов етап могат да допринесат за тази чувствителност.',
    section1Body2:
      'Това не е провал и не означава, че си лоша майка. Всяка преживява първите следродилни дни по свой начин.',
    statTitle: 'Често срещано преживяване',
    statText:
      'Бейби блузът е често срещан след раждане и обикновено отшумява сам в рамките на няколко дни.',
    section2Kicker: 'ПРИЗНАЦИТЕ',
    section2Title: 'Какво можеш да усещаш',
    section2Body:
      'Преживяването е различно. Някои жени усещат главно умора и чувствителност, докато други могат да имат по-забележими промени в настроението.',
    commonSigns: [
      {
        title: 'Емоционалност',
        description: 'Плачеш по-лесно или се чувстваш особено чувствителна.',
      },
      {
        title: 'Свръхчувствителност',
        description: 'Емоциите могат да изглеждат по-силни и да се сменят бързо.',
      },
      {
        title: 'Промени в настроението',
        description:
          'Усещането за уязвимост може да се редува с мигове на добро състояние.',
      },
      {
        title: 'Умора',
        description: 'Умората от първите дни може да усили емоциите.',
      },
    ],
    section3Kicker: 'В ЕЖЕДНЕВИЕТО',
    section3Title: 'Какво може да помогне',
    section3Body:
      'През този период нуждата от почивка е голяма. Малки, прости неща могат да направят дните по-комфортни.',
    dailySupport: [
      {
        title: 'Почивка',
        description: 'Използвай всеки свободен миг, за да се възстановиш.',
      },
      {
        title: 'Приемане на помощ',
        description: 'Не се колебай да поискаш подкрепа от близките си.',
      },
      {
        title: 'Редовно пиене на вода',
        description: 'Поддържай достатъчна хидратация през деня.',
      },
      {
        title: 'Достатъчно храна',
        description: 'Предпочитай редовни, прости ястия.',
      },
    ],
    quoteText:
      '„Искането на помощ след раждане е начин да се погрижиш за себе си и за бебето си.“',
    section4Kicker: 'КАК ДА РАЗЛИЧИШ',
    section4Title: 'Бейби блуз или следродилна депресия?',
    section4Body:
      'Бейби блузът обикновено е кратък и се подобрява постепенно. Следродилната депресия е различна: може да е по-упорита, по-интензивна и да има значително влияние върху ежедневието.',
    compareTitle: 'Две ситуации, които да различаваш',
    compareBabyBluesTitle: 'Бейби блуз',
    compareBabyBluesText:
      'Често кратък, с постепенно подобрение през следващите дни.',
    comparePostpartumTitle: 'Следродилна депресия',
    comparePostpartumText:
      'Може да продължи по-дълго, да се засили и да изисква професионална подкрепа.',
    section5Kicker: 'БЪДИ ВНИМАТЕЛНА',
    section5Title: 'Кога да потърсиш помощ?',
    section5Body:
      'Важно е да поговориш със здравен специалист, ако емоционалното страдание не се подобрява, става по-интензивно или започва да затруднява ежедневието ти.',
    attentionTitle: 'Тревожни признаци, които да следиш',
    attentionSubtitle: 'Поговори със специалист, ако…',
    attentionSigns: [
      'Симптомите продължават повече от две седмици.',
      'Тъгата или тревожността стават по-интензивни.',
      'Става трудно да се грижиш за себе си или за бебето си.',
      'Появява се значително чувство на страдание.',
    ],
    professionalTitle: 'Подкрепата е налична',
    professionalText:
      'Акушерка, лекар, психолог или друг здравен специалист може да те изслуша, да оцени ситуацията и да предложи подходяща подкрепа.',
    tipTitle: 'Добре е да знаеш',
    tipText:
      'Емоциите след раждане не мерят колко добра майка си. Имаш право да имаш нужда от почивка, да бъдеш изслушана и подкрепена.',
    section6Kicker: 'КЛЮЧОВИ ТОЧКИ',
    section6Title: 'Какво да запомниш',
    takeaways: [
      'Бейби блузът е често срещан след раждане.',
      'Умората и хормоналните промени могат да повлияят на настроението.',
      'Подкрепата на близките може да облекчи този период.',
      'Упоритото или значително страдание заслужава професионална оценка.',
    ],
    disclaimerText:
      'Тази статия е с информационна цел и не замества персонализирания медицински съвет. При съмнение или значително страдание поговори със здравен специалист.',
    endText: 'Грижата за себе си е част и от периода след раждане.',
    shareTitle: 'Бейби блуз и емоционално здраве след раждане',
    shareMessage:
      'Бейби блуз и емоционално здраве след раждане — AWA\n\nРъководство за разбиране на емоционалните промени, които са често срещани след раждане.',
  },
  sr: {
    badgeText: 'ПОСЛЕ ПОРОЂАЈА • ЕМОЦИОНАЛНО ЗДРАВЉЕ',
    title: 'Беби блуз и емоционално здравље\nпосле порођаја',
    subtitle:
      'Разумевање онога што се емоционално може променити после порођаја и знање када да потражиш подршку.',
    metaItems: ['10 мин читања', 'Чланак', 'Почетник', 'Проверен садржај'],
    introTitle: 'Добро је знати',
    introText:
      'После порођаја је уобичајено проћи кроз период појачане емоционалне осетљивости. Беби блуз је обично привремен, али стрес који траје или се појачава заслужује стручну пажњу.',
    contentsEyebrow: 'ВОДИЧ',
    contentsTitle: 'У овом чланку',
    contents: [
      'Разумевање беби блуза',
      'Најчешћи знаци',
      'Шта помаже из дана у дан',
      'Беби блуз или постпорођајна депресија?',
      'Када затражити помоћ',
      'Шта да запамтиш',
    ],
    section1Kicker: 'РАЗУМЕВАЊЕ',
    section1Title: 'Шта је беби блуз?',
    section1Body1:
      'Беби блуз је период емоционалних промена који се може јавити у првих неколико дана после порођаја. Хормонске промене, умор, недостатак сна и прилагођавање овој новој фази могу допринети овој осетљивости.',
    section1Body2:
      'То није неуспех и не значи да си лоша мајка. Свака жена на свој начин проживљава прве дане после порођаја.',
    statTitle: 'Уобичајено искуство',
    statText:
      'Беби блуз је чест после порођаја и обично се сам од себе поправља у року од неколико дана.',
    section2Kicker: 'ЗНАЦИ',
    section2Title: 'Шта можеш осећати',
    section2Body:
      'Искуства се разликују. Неке жене углавном осећају умор и осетљивост, док друге могу имати приметније промене расположења.',
    commonSigns: [
      {
        title: 'Емоционалност',
        description: 'Лакше плачеш или се осећаш посебно осетљиво.',
      },
      {
        title: 'Преосетљивост',
        description: 'Емоције могу бити јаче и брзо се смењивати.',
      },
      {
        title: 'Промене расположења',
        description:
          'Осећај кртости може се смењивати са тренуцима благостања.',
      },
      {
        title: 'Умор',
        description: 'Умор из првих дана може појачати емоције.',
      },
    ],
    section3Kicker: 'ИЗ ДАНА У ДАН',
    section3Title: 'Шта може помоћи',
    section3Body:
      'У овом периоду потреба за одмором је велика. Мале, једноставне ствари могу учинити дане удобнијим.',
    dailySupport: [
      {
        title: 'Одмарање',
        description: 'Искористи сваки слободан тренутак да се опоравиш.',
      },
      {
        title: 'Прихватање помоћи',
        description: 'Не оклевај да затражиш подршку од људи око себе.',
      },
      {
        title: 'Редовно пијење',
        description: 'Одржавај довољну хидратацију током дана.',
      },
      {
        title: 'Довољно хране',
        description: 'Предност дај редовним, једноставним оброцима.',
      },
    ],
    quoteText:
      '„Тражење помоћи после порођаја је начин да бринеш о себи и својој беби.“',
    section4Kicker: 'РАЗЛИКОВАЊЕ',
    section4Title: 'Беби блуз или постпорођајна депресија?',
    section4Body:
      'Беби блуз је обично кратак и постепено пролази. Постпорођајна депресија је другачија: може бити упорнија, интензивнија и значајно утицати на свакодневни живот.',
    compareTitle: 'Две ситуације које треба разликовати',
    compareBabyBluesTitle: 'Беби блуз',
    compareBabyBluesText:
      'Често кратак, уз постепено побољшање током наредних дана.',
    comparePostpartumTitle: 'Постпорођајна депресија',
    comparePostpartumText:
      'Може трајати дуже, појачавати се и захтевати стручну подршку.',
    section5Kicker: 'БУДНОСТ',
    section5Title: 'Када затражити помоћ?',
    section5Body:
      'Важно је да разговараш са здравственим радником ако емоционални стрес не пролази, постаје интензивнији или почиње да отежава свакодневни живот.',
    attentionTitle: 'Знаци упозорења на које треба обратити пажњу',
    attentionSubtitle: 'Разговарај са стручњаком ако…',
    attentionSigns: [
      'Симптоми трају дуже од две недеље.',
      'Туга или анксиозност постају интензивније.',
      'Постаје тешко бринути о себи или о беби.',
      'Појављује се значајан осећај патње.',
    ],
    professionalTitle: 'Подршка је доступна',
    professionalText:
      'Бабица, лекар, психолог или други здравствени радник може да те саслуша, процени ситуацију и понуди одговарајућу подршку.',
    tipTitle: 'Добро је знати',
    tipText:
      'Емоције после порођаја нису мерило тога колико си добра мајка. Имаш право да ти је потребан одмор, да будеш саслушана и да будеш подржана.',
    section6Kicker: 'КЉУЧНЕ ТАЧКЕ',
    section6Title: 'Шта да запамтиш',
    takeaways: [
      'Беби блуз је чест после порођаја.',
      'Умор и хормонске промене могу утицати на расположење.',
      'Подршка људи око тебе може олакшати овај период.',
      'Упорна или значајна патња заслужује стручну процену.',
    ],
    disclaimerText:
      'Овај чланак је само у информативне сврхе и не замењује персонализовани медицински савет. При сумњи или значајној патњи разговарај са здравственим радником.',
    endText: 'Брига о себи је такође део периода после порођаја.',
    shareTitle: 'Беби блуз и емоционално здравље после порођаја',
    shareMessage:
      'Беби блуз и емоционално здравље после порођаја — AWA\n\nВодич за разумевање емоционалних промена које су уобичајене после порођаја.',
  },
  hr: {
    badgeText: 'NAKON PORODA • EMOCIONALNO ZDRAVLJE',
    title: 'Baby blues i emocionalno zdravlje\nnakon poroda',
    subtitle:
      'Razumijevanje onoga što se emocionalno može promijeniti nakon poroda i znanje kada potražiti podršku.',
    metaItems: ['10 min čitanja', 'Članak', 'Početnica', 'Provjeren sadržaj'],
    introTitle: 'Dobro je znati',
    introText:
      'Nakon poroda je uobičajeno proći kroz razdoblje pojačane emocionalne osjetljivosti. Baby blues obično je privremen, ali tegobe koje traju ili se pojačavaju zaslužuju stručnu pozornost.',
    contentsEyebrow: 'VODIČ',
    contentsTitle: 'U ovom članku',
    contents: [
      'Razumijevanje baby bluesa',
      'Najčešći znakovi',
      'Što pomaže iz dana u dan',
      'Baby blues ili poslijeporođajna depresija?',
      'Kada zatražiti pomoć',
      'Što zapamtiti',
    ],
    section1Kicker: 'RAZUMIJEVANJE',
    section1Title: 'Što je baby blues?',
    section1Body1:
      'Baby blues je razdoblje emocionalnih promjena koje se može javiti u prvim danima nakon poroda. Hormonske promjene, umor, nedostatak sna i prilagodba na ovu novu fazu mogu pridonijeti toj osjetljivosti.',
    section1Body2:
      'To nije neuspjeh i ne znači da si loša majka. Svaka žena prve dane nakon poroda proživljava na svoj način.',
    statTitle: 'Uobičajeno iskustvo',
    statText:
      'Baby blues je čest nakon poroda i obično se sam popravlja unutar nekoliko dana.',
    section2Kicker: 'ZNAKOVI',
    section2Title: 'Što možeš osjećati',
    section2Body:
      'Iskustva se razlikuju. Neke žene uglavnom osjećaju umor i osjetljivost, dok druge mogu imati izraženije promjene raspoloženja.',
    commonSigns: [
      {
        title: 'Emocionalnost',
        description: 'Lakše plačeš ili si posebno osjetljiva.',
      },
      {
        title: 'Preosjetljivost',
        description: 'Emocije mogu biti jače i brzo se mijenjati.',
      },
      {
        title: 'Promjene raspoloženja',
        description:
          'Osjećaj krhkosti može se izmjenjivati s trenucima dobrog osjećanja.',
      },
      {
        title: 'Umor',
        description: 'Umor iz prvih dana može pojačati emocije.',
      },
    ],
    section3Kicker: 'IZ DANA U DAN',
    section3Title: 'Što može pomoći',
    section3Body:
      'U ovom je razdoblju potreba za odmorom velika. Male, jednostavne stvari mogu dane učiniti ugodnijima.',
    dailySupport: [
      {
        title: 'Odmaranje',
        description: 'Iskoristi svaki slobodan trenutak za oporavak.',
      },
      {
        title: 'Prihvaćanje pomoći',
        description: 'Ne oklijevaj zatražiti podršku od ljudi oko sebe.',
      },
      {
        title: 'Redovito pijenje',
        description: 'Održavaj dovoljnu hidrataciju tijekom dana.',
      },
      {
        title: 'Dovoljno jela',
        description: 'Daj prednost redovitim, jednostavnim obrocima.',
      },
    ],
    quoteText:
      '„Traženje pomoći nakon poroda način je brige o sebi i svojoj bebi.“',
    section4Kicker: 'RAZLIKOVANJE',
    section4Title: 'Baby blues ili poslijeporođajna depresija?',
    section4Body:
      'Baby blues obično je kratkotrajan i postupno prolazi. Poslijeporođajna depresija je drugačija: može biti postojanija, intenzivnija i znatno utjecati na svakodnevni život.',
    compareTitle: 'Dvije situacije koje treba razlikovati',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Često kratkotrajan, s postupnim poboljšanjem tijekom sljedećih dana.',
    comparePostpartumTitle: 'Poslijeporođajna depresija',
    comparePostpartumText:
      'Može trajati dulje, pojačavati se i zahtijevati stručnu podršku.',
    section5Kicker: 'OPREZ',
    section5Title: 'Kada zatražiti pomoć?',
    section5Body:
      'Važno je razgovarati sa zdravstvenim djelatnikom ako se emocionalne tegobe ne smanjuju, postaju intenzivnije ili počnu otežavati svakodnevni život.',
    attentionTitle: 'Znakovi upozorenja na koje treba paziti',
    attentionSubtitle: 'Razgovaraj sa stručnom osobom ako…',
    attentionSigns: [
      'Simptomi traju dulje od dva tjedna.',
      'Tuga ili tjeskoba postaju intenzivnije.',
      'Postaje teško brinuti se o sebi ili o bebi.',
      'Pojavljuje se snažan osjećaj patnje.',
    ],
    professionalTitle: 'Podrška je dostupna',
    professionalText:
      'Babica, liječnik, psiholog ili drugi zdravstveni djelatnik može te saslušati, procijeniti situaciju i ponuditi odgovarajuću podršku.',
    tipTitle: 'Dobro je znati',
    tipText:
      'Emocije nakon poroda nisu mjera toga kako dobra si majka. Imaš pravo trebati odmor, biti saslušana i imati podršku.',
    section6Kicker: 'KLJUČNE TOČKE',
    section6Title: 'Što zapamtiti',
    takeaways: [
      'Baby blues je čest nakon poroda.',
      'Umor i hormonske promjene mogu utjecati na raspoloženje.',
      'Podrška ljudi oko tebe može olakšati ovo razdoblje.',
      'Dugotrajne ili izražene tegobe zaslužuju stručnu procjenu.',
    ],
    disclaimerText:
      'Ovaj je članak informativne naravi i ne zamjenjuje individualni medicinski savjet. U slučaju nedoumice ili izraženih tegoba obrati se zdravstvenom djelatniku.',
    endText: 'Briga o sebi također je dio razdoblja nakon poroda.',
    shareTitle: 'Baby blues i emocionalno zdravlje nakon poroda',
    shareMessage:
      'Baby blues i emocionalno zdravlje nakon poroda — AWA\n\nVodič za razumijevanje emocionalnih promjena koje su uobičajene nakon poroda.',
  },
  bs: {
    badgeText: 'NAKON PORODA • EMOCIONALNO ZDRAVLJE',
    title: 'Baby blues i emocionalno zdravlje\nnakon porođaja',
    subtitle:
      'Razumijevanje onoga što se emocionalno može promijeniti nakon porođaja i znanje kada potražiti podršku.',
    metaItems: ['10 min čitanja', 'Članak', 'Početnica', 'Provjeren sadržaj'],
    introTitle: 'Dobro je znati',
    introText:
      'Nakon porođaja je uobičajeno proći kroz razdoblje pojačane emocionalne osjetljivosti. Baby blues obično je privremen, ali tegobe koje traju ili se pojačavaju zaslužuju stručnu pozornost.',
    contentsEyebrow: 'VODIČ',
    contentsTitle: 'U ovom članku',
    contents: [
      'Razumijevanje baby bluesa',
      'Najčešći znakovi',
      'Što pomaže iz dana u dan',
      'Baby blues ili poslijeporođajna depresija?',
      'Kada zatražiti pomoć',
      'Što zapamtiti',
    ],
    section1Kicker: 'RAZUMIJEVANJE',
    section1Title: 'Što je baby blues?',
    section1Body1:
      'Baby blues je razdoblje emocionalnih promjena koje se može javiti u prvim danima nakon porođaja. Hormonske promjene, umor, nedostatak sna i prilagodba na ovu novu fazu mogu pridonijeti toj osjetljivosti.',
    section1Body2:
      'To nije neuspjeh i ne znači da si loša majka. Svaka žena prve dane nakon porođaja proživljava na svoj način.',
    statTitle: 'Uobičajeno iskustvo',
    statText:
      'Baby blues je čest nakon porođaja i obično se sam popravlja unutar nekoliko dana.',
    section2Kicker: 'ZNAKOVI',
    section2Title: 'Što možeš osjećati',
    section2Body:
      'Iskustva se razlikuju. Neke žene uglavnom osjećaju umor i osjetljivost, dok druge mogu imati izraženije promjene raspoloženja.',
    commonSigns: [
      {
        title: 'Emocionalnost',
        description: 'Lakše plačeš ili si posebno osjetljiva.',
      },
      {
        title: 'Preosjetljivost',
        description: 'Emocije mogu biti jače i brzo se mijenjati.',
      },
      {
        title: 'Promjene raspoloženja',
        description:
          'Osjećaj krhkosti može se izmjenjivati s trenucima dobrog osjećanja.',
      },
      {
        title: 'Umor',
        description: 'Umor iz prvih dana može pojačati emocije.',
      },
    ],
    section3Kicker: 'IZ DANA U DAN',
    section3Title: 'Što može pomoći',
    section3Body:
      'U ovom je razdoblju potreba za odmorom velika. Male, jednostavne stvari mogu dane učiniti ugodnijima.',
    dailySupport: [
      {
        title: 'Odmaranje',
        description: 'Iskoristi svaki slobodan trenutak za oporavak.',
      },
      {
        title: 'Prihvaćanje pomoći',
        description: 'Ne oklijevaj zatražiti podršku od ljudi oko sebe.',
      },
      {
        title: 'Redovito pijenje',
        description: 'Održavaj dovoljnu hidrataciju tokom dana.',
      },
      {
        title: 'Dovoljno jela',
        description: 'Daj prednost redovitim, jednostavnim obrocima.',
      },
    ],
    quoteText:
      '„Traženje pomoći nakon porođaja način je brige o sebi i svojoj bebi.“',
    section4Kicker: 'RAZLIKOVANJE',
    section4Title: 'Baby blues ili poslijeporođajna depresija?',
    section4Body:
      'Baby blues obično je kratkotrajan i postupno prolazi. Poslijeporođajna depresija je drugačija: može biti postojanija, intenzivnija i znatno utjecati na svakodnevni život.',
    compareTitle: 'Dvije situacije koje treba razlikovati',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Često kratkotrajan, s postupnim poboljšanjem tokom sljedećih dana.',
    comparePostpartumTitle: 'Poslijeporođajna depresija',
    comparePostpartumText:
      'Može trajati dulje, pojačavati se i zahtijevati stručnu podršku.',
    section5Kicker: 'OPREZ',
    section5Title: 'Kada zatražiti pomoć?',
    section5Body:
      'Važno je razgovarati sa zdravstvenim radnikom ako se emocionalne tegobe ne smanjuju, postaju intenzivnije ili počnu otežavati svakodnevni život.',
    attentionTitle: 'Znakovi upozorenja na koje treba paziti',
    attentionSubtitle: 'Razgovaraj sa stručnom osobom ako…',
    attentionSigns: [
      'Simptomi traju dulje od dvije sedmice.',
      'Tuga ili tjeskoba postaju intenzivnije.',
      'Postaje teško brinuti se o sebi ili o bebi.',
      'Pojavljuje se snažan osjećaj patnje.',
    ],
    professionalTitle: 'Podrška je dostupna',
    professionalText:
      'Babica, ljekar, psiholog ili drugi zdravstveni radnik može te saslušati, procijeniti situaciju i ponuditi odgovarajuću podršku.',
    tipTitle: 'Dobro je znati',
    tipText:
      'Emocije nakon porođaja nisu mjera toga kako dobra si majka. Imaš pravo trebati odmor, biti saslušana i imati podršku.',
    section6Kicker: 'KLJUČNE TOČKE',
    section6Title: 'Što zapamtiti',
    takeaways: [
      'Baby blues je čest nakon porođaja.',
      'Umor i hormonske promjene mogu utjecati na raspoloženje.',
      'Podrška ljudi oko tebe može olakšati ovo razdoblje.',
      'Dugotrajne ili izražene tegobe zaslužuju stručnu procjenu.',
    ],
    disclaimerText:
      'Ovaj je članak informativne naravi i ne zamjenjuje individualni medicinski savjet. U slučaju nedoumice ili izraženih tegoba obrati se zdravstvenom radniku.',
    endText: 'Briga o sebi također je dio razdoblja nakon porođaja.',
    shareTitle: 'Baby blues i emocionalno zdravlje nakon porođaja',
    shareMessage:
      'Baby blues i emocionalno zdravlje nakon porođaja — AWA\n\nVodič za razumijevanje emocionalnih promjena koje su uobičajene nakon porođaja.',
  },
  sl: {
    badgeText: 'PO PORODU • ČUSTVENO ZDRAVJE',
    title: 'Baby blues in čustveno zdravje\npo porodu',
    subtitle:
      'Razumevanje tega, kar se lahko čustveno spremeni po porodu, in vedenje, kdaj poiskati podporo.',
    metaItems: ['10 min branja', 'Članek', 'Začetnica', 'Preverjena vsebina'],
    introTitle: 'Vredno vedeti',
    introText:
      'Po porodu je običajno, da prehodiš obdobje povečane čustvene občutljivosti. Baby blues je običajno začasen, a stiska, ki traja ali se stopnjuje, si zasluži strokovno pozornost.',
    contentsEyebrow: 'VODNIK',
    contentsTitle: 'V tem članku',
    contents: [
      'Razumevanje baby bluesa',
      'Najpogostejši znaki',
      'Kaj pomaga iz dneva v dan',
      'Baby blues ali poporodna depresija?',
      'Kdaj poiskati pomoč',
      'Kaj si zapomniti',
    ],
    section1Kicker: 'RAZUMEVANJE',
    section1Title: 'Kaj je baby blues?',
    section1Body1:
      'Baby blues je obdobje čustvenih sprememb, ki se lahko pojavi v prvih dneh po porodu. K tej občutljivosti lahko prispevajo hormonske spremembe, utrujenost, pomanjkanje spanja in prilagajanje na to novo obdobje.',
    section1Body2:
      'To ni neuspeh in ne pomeni, da si slaba mama. Vsaka ženska prve dni po porodu doživlja po svoje.',
    statTitle: 'Pogosta izkušnja',
    statText:
      'Baby blues je po porodu pogost in običajno mine sam od sebe v nekaj dneh.',
    section2Kicker: 'ZNAKI',
    section2Title: 'Kaj lahko čutiš',
    section2Body:
      'Izkušnje se razlikujejo. Nekatere ženske čutijo predvsem utrujenost in občutljivost, druge imajo izrazitejše spremembe razpoloženja.',
    commonSigns: [
      {
        title: 'Čustvenost',
        description: 'Laže jokaš ali si posebej občutljiva.',
      },
      {
        title: 'Preobčutljivost',
        description: 'Čustva so lahko močnejša in se hitro spreminjajo.',
      },
      {
        title: 'Nihanje razpoloženja',
        description:
          'Občutek krhkosti se lahko izmenjuje s trenutki dobrega počutja.',
      },
      {
        title: 'Utrujenost',
        description: 'Utrujenost prvih dni lahko okrepi čustva.',
      },
    ],
    section3Kicker: 'IZ DNEVA V DAN',
    section3Title: 'Kaj lahko pomaga',
    section3Body:
      'V tem obdobju je potreba po počitku velika. Majhne, preproste stvari lahko dneve naredijo prijetnejše.',
    dailySupport: [
      {
        title: 'Počitek',
        description: 'Izkoristi vsak prost trenutek za okrevanje.',
      },
      {
        title: 'Sprejemanje pomoči',
        description: 'Ne oklevaj prositi bližnje za podporo.',
      },
      {
        title: 'Redno pitje',
        description: 'Čez dan ostani dovolj hidrirana.',
      },
      {
        title: 'Dovolj jesti',
        description: 'Daj prednost rednim, preprostim obrokom.',
      },
    ],
    quoteText:
      '„Prositi za pomoč po porodu je način, kako poskrbeti zase in za svojega dojenčka.“',
    section4Kicker: 'RAZLIKOVANJE',
    section4Title: 'Baby blues ali poporodna depresija?',
    section4Body:
      'Baby blues je običajno kratkotrajen in postopoma mine. Poporodna depresija je drugačna: lahko je bolj vztrajna, intenzivnejša in pomembno vpliva na vsakdanje življenje.',
    compareTitle: 'Dve situaciji, ki ju je treba razlikovati',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Pogosto kratkotrajen, s postopnim izboljšanjem v naslednjih dneh.',
    comparePostpartumTitle: 'Poporodna depresija',
    comparePostpartumText:
      'Lahko traja dlje, se stopnjuje in zahteva strokovno podporo.',
    section5Kicker: 'POZORNOST',
    section5Title: 'Kdaj poiskati pomoč?',
    section5Body:
      'Pomembno je spregovoriti z zdravstvenim delavcem, če se čustvena stiska ne umiri, postane intenzivnejša ali začne otežavati vsakdanje življenje.',
    attentionTitle: 'Opozorilni znaki, na katere je treba paziti',
    attentionSubtitle: 'Spregovori s strokovnjakom, če…',
    attentionSigns: [
      'Simptomi trajajo več kot dva tedna.',
      'Žalost ali tesnoba postaneta intenzivnejši.',
      'Postane težko skrbeti zase ali za dojenčka.',
      'Pojavi se močan občutek stiske.',
    ],
    professionalTitle: 'Podpora je na voljo',
    professionalText:
      'Babica, zdravnik, psiholog ali drug zdravstveni delavec te lahko posluša, oceni situacijo in ponudi ustrezno podporo.',
    tipTitle: 'Vredno vedeti',
    tipText:
      'Čustva po porodu niso merilo tega, kako dobra mama si. Imaš pravico do počitka, do tega, da te kdo posluša, in do podpore.',
    section6Kicker: 'KLJUČNE TOČKE',
    section6Title: 'Kaj si zapomniti',
    takeaways: [
      'Baby blues je po porodu pogost.',
      'Utrujenost in hormonske spremembe lahko vplivajo na razpoloženje.',
      'Podpora bližnjih lahko olajša to obdobje.',
      'Dolgotrajna ali izrazita stiska si zasluži strokovno oceno.',
    ],
    disclaimerText:
      'Ta članek je informativne narave in ne nadomešča osebnega zdravniškega nasveta. V primeru dvoma ali izrazite stiske se obrni na zdravstvenega delavca.',
    endText: 'Skrb zase je tudi del obdobja po porodu.',
    shareTitle: 'Baby blues in čustveno zdravje po porodu',
    shareMessage:
      'Baby blues in čustveno zdravje po porodu — AWA\n\nVodnik za razumevanje čustvenih sprememb, ki so običajne po porodu.',
  },
  ne: {
    badgeText: 'सुत्केरीपछि • भावनात्मक स्वास्थ्य',
    title: 'बेबी ब्लूज र सुत्केरीपछिको\nभावनात्मक स्वास्थ्य',
    subtitle:
      'प्रसवपछि भावनात्मक रूपमा के बदलिन सक्छ बुझ्नुहोस् र कहिले सहयोग खोज्ने जान्नुहोस्।',
    metaItems: ['10 मिनेट पढाइ', 'लेख', 'सुरुवाती', 'समीक्षा गरिएको सामग्री'],
    introTitle: 'जान्न लायक',
    introText:
      'प्रसवपछि केही समय भावनात्मक संवेदनशीलता बढ्नु सामान्य हो। बेबी ब्लूज प्रायः अस्थायी हुन्छ, तर लामो समय रहने वा बढ्दै जाने मानसिक पीडाले व्यावसायिक ध्यान पाउनुपर्छ।',
    contentsEyebrow: 'मार्गदर्शन',
    contentsTitle: 'यो लेखमा',
    contents: [
      'बेबी ब्लूज बुझ्नुहोस्',
      'सबैभन्दा सामान्य संकेतहरू',
      'दिनदिनै के मद्दत गर्छ',
      'बेबी ब्लूज कि सुत्केरीपछिको डिप्रेसन?',
      'कहिले सहयोग माग्ने',
      'मुख्य कुराहरू',
    ],
    section1Kicker: 'बुझाइ',
    section1Title: 'बेबी ब्लूज के हो?',
    section1Body1:
      'बेबी ब्लूज प्रसवपछिका पहिलो केही दिनमा हुन सक्ने भावनात्मक परिवर्तनको अवधि हो। हर्मोनमा हुने परिवर्तन, थकान, निद्राको कमी र यो नयाँ चरणसँग अनुकूल हुनुले यो संवेदनशीलतामा योगदान पुर्‍याउन सक्छ।',
    section1Body2:
      'यो असफलता होइन र तपाईं नराम्री आमा हुनुहुन्छ भन्ने अर्थ पनि होइन। सुत्केरीपछिका पहिलो दिनहरू हरेकले आफ्नै तरिकाले अनुभव गर्छन्।',
    statTitle: 'एउटा सामान्य अनुभव',
    statText:
      'बेबी ब्लूज प्रसवपछि सामान्य हो र प्रायः केही दिनमै आफैँ सुध्रिन्छ।',
    section2Kicker: 'संकेतहरू',
    section2Title: 'तपाईंले के महसुस गर्न सक्नुहुन्छ',
    section2Body:
      'मानिसहरूको अनुभव फरक-फरक हुन्छ। कसैले मुख्यतया थकान र संवेदनशीलता महसुस गर्छन्, भने कसैमा मनोदशामा अझ स्पष्ट परिवर्तन हुन सक्छ।',
    commonSigns: [
      {
        title: 'भावुकता',
        description: 'सजिलै रुने वा विशेष रूपमा संवेदनशील महसुस गर्ने।',
      },
      {
        title: 'अति संवेदनशीलता',
        description: 'भावनाहरू बढी तीव्र महसुस हुन सक्छन् र छिटो फेरिन सक्छन्।',
      },
      {
        title: 'मनोदशामा उतारचढाव',
        description:
          'कमजोरीको अनुभूति र राम्रो महसुस हुने क्षणहरू पालैपालो आउन सक्छन्।',
      },
      {
        title: 'थकान',
        description: 'पहिलो दिनहरूको थकानले भावनाहरूलाई बढाउन सक्छ।',
      },
    ],
    section3Kicker: 'दिनदिनै',
    section3Title: 'के मद्दत गर्न सक्छ',
    section3Body:
      'यो अवधिमा आरामको आवश्यकता ठूलो हुन्छ। साना, सरल कुराहरूले दिनहरू बढी सहज बनाउन सक्छन्।',
    dailySupport: [
      {
        title: 'आराम गर्ने',
        description: 'निको हुन खाली समयको सदुपयोग गर्ने।',
      },
      {
        title: 'मद्दत स्वीकार गर्ने',
        description: 'वरपरका मानिसबाट साथ माग्न नहिच्किचाउनुहोस्।',
      },
      {
        title: 'नियमित पानी पिउने',
        description: 'दिनभर पर्याप्त पानी पिइरहने।',
      },
      {
        title: 'पर्याप्त खाने',
        description: 'नियमित, सरल खानालाई प्राथमिकता दिने।',
      },
    ],
    quoteText:
      '“सुत्केरीपछि मद्दत माग्नु आफ्नो र आफ्नो शिशुको ख्याल राख्ने तरिका हो।”',
    section4Kicker: 'भिन्नता छुट्ट्याउने',
    section4Title: 'बेबी ब्लूज कि सुत्केरीपछिको डिप्रेसन?',
    section4Body:
      'बेबी ब्लूज प्रायः छोटो हुन्छ र बिस्तारै सुध्रिन्छ। सुत्केरीपछिको डिप्रेसन फरक हो: यो बढी लामो, बढी तीव्र हुन सक्छ र दैनिक जीवनमा ठूलो असर पार्न सक्छ।',
    compareTitle: 'छुट्ट्याउनुपर्ने दुई अवस्था',
    compareBabyBluesTitle: 'बेबी ब्लूज',
    compareBabyBluesText:
      'प्रायः छोटो, आगामी दिनहरूमा क्रमिक सुधारसहित।',
    comparePostpartumTitle: 'सुत्केरीपछिको डिप्रेसन',
    comparePostpartumText:
      'लामो समय रहन सक्छ, तीव्र हुन सक्छ र व्यावसायिक साथ चाहिन सक्छ।',
    section5Kicker: 'सजग रहने',
    section5Title: 'कहिले मद्दत माग्ने?',
    section5Body:
      'भावनात्मक पीडा सुधारिएन, बढी तीव्र भयो वा दैनिक जीवन गाह्रो बनाउन थाल्यो भने स्वास्थ्यकर्मीसँग कुरा गर्नु महत्त्वपूर्ण छ।',
    attentionTitle: 'ध्यान दिनुपर्ने चेतावनी संकेतहरू',
    attentionSubtitle: 'यदि यस्तो भए व्यावसायिकसँग कुरा गर्नुहोस्…',
    attentionSigns: [
      'लक्षणहरू दुई हप्ताभन्दा बढी रहे।',
      'उदासी वा चिन्ता बढी तीव्र भयो।',
      'आफ्नो वा आफ्नो शिशुको ख्याल राख्न गाह्रो हुन थाल्यो।',
      'ठूलो पीडाको अनुभूति देखियो।',
    ],
    professionalTitle: 'साथ उपलब्ध छ',
    professionalText:
      'सुँडेनी, चिकित्सक, मनोवैज्ञानिक वा अन्य स्वास्थ्यकर्मीले तपाईंलाई सुन्न, अवस्थाको मूल्याङ्कन गर्न र उपयुक्त साथ दिन सक्छन्।',
    tipTitle: 'जान्न लायक',
    tipText:
      'सुत्केरीपछिका भावनाहरू तपाईं कति राम्री आमा हुनुहुन्छ भन्ने मापन होइनन्। तपाईंलाई आराम चाहिने, सुनिने र साथ पाउने अधिकार छ।',
    section6Kicker: 'मुख्य बुँदाहरू',
    section6Title: 'मुख्य कुराहरू',
    takeaways: [
      'बेबी ब्लूज प्रसवपछि सामान्य हो।',
      'थकान र हर्मोनल परिवर्तनले मनोदशालाई असर गर्न सक्छन्।',
      'वरपरका मानिसको साथले यो अवधि सहज बनाउन सक्छ।',
      'लामो समय रहने वा ठूलो पीडाले व्यावसायिक मूल्याङ्कन पाउनुपर्छ।',
    ],
    disclaimerText:
      'यो लेख जानकारीका लागि हो र व्यक्तिगत चिकित्सकीय सल्लाहको स्थान लिँदैन। शङ्का भए वा ठूलो पीडा महसुस भए स्वास्थ्यकर्मीसँग कुरा गर्नुहोस्।',
    endText: 'आफ्नो ख्याल राख्नु पनि सुत्केरीपछिको हिस्सा हो।',
    shareTitle: 'बेबी ब्लूज र सुत्केरीपछिको भावनात्मक स्वास्थ्य',
    shareMessage:
      'बेबी ब्लूज र सुत्केरीपछिको भावनात्मक स्वास्थ्य — AWA\n\nप्रसवपछि सामान्य रूपमा हुने भावनात्मक परिवर्तनहरू बुझ्न एउटा मार्गदर्शन।',
  },
  si: {
    badgeText: 'ප්‍රසූතියෙන් පසු • චිත්තවේගී සෞඛ්‍යය',
    title: 'දරු උපතින් පසු කම්පනය සහ ප්‍රසූතියෙන් පසු\nචිත්තවේගී සෞඛ්‍යය',
    subtitle:
      'ප්‍රසූතියෙන් පසු චිත්තවේගීව වෙනස් විය හැකි දේ තේරුම් ගෙන සහාය ඉල්ලිය යුත්තේ කවදාදැයි දැනගන්න.',
    metaItems: ['කියවීමට මිනිත්තු 10', 'ලිපිය', 'ආරම්භක', 'සමාලෝචනය කළ අන්තර්ගතය'],
    introTitle: 'දැනගත යුතු දේ',
    introText:
      'දරුවෙකු ප්‍රසූත කළ පසු, චිත්තවේගී සංවේදීතාව ඉහළ යන කාලයක් පසු කිරීම සාමාන්‍යයි. දරු උපතින් පසු කම්පනය බොහෝ විට තාවකාලික වුවද, දිගටම පවතින හෝ තීව්‍ර වන දුක්ඛිතභාවයට වෘත්තීය අවධානයක් ලැබිය යුතුයි.',
    contentsEyebrow: 'මාර්ගෝපදේශය',
    contentsTitle: 'මෙම ලිපියේ',
    contents: [
      'දරු උපතින් පසු කම්පනය තේරුම් ගැනීම',
      'වඩාත්ම පොදු සලකුණු',
      'දිනෙන් දින උපකාරී වන දේ',
      'දරු උපතින් පසු කම්පනයද, ප්‍රසූතියෙන් පසු අවපීඩනයද?',
      'උදව් ඉල්ලිය යුත්තේ කවදාද',
      'ප්‍රධාන කරුණු',
    ],
    section1Kicker: 'තේරුම් ගැනීම',
    section1Title: 'දරු උපතින් පසු කම්පනය යනු කුමක්ද?',
    section1Body1:
      'දරු උපතින් පසු කම්පනය යනු ප්‍රසූතියෙන් පසු පළමු දින කිහිපය තුළ ඇතිවිය හැකි චිත්තවේගී වෙනස්කම් කාලයකි. හෝමෝන වෙනස්වීම්, වෙහෙස, නින්ද නොමැතිකම සහ මෙම නව අවධියට හැඩගැසීම මෙම සංවේදීතාවට දායක විය හැක.',
    section1Body2:
      'මෙය අසාර්ථකත්වයක් නොවන අතර ඔබ නරක මවක් බවට එයින් අදහස් නොවේ. ප්‍රසූතියෙන් පසු පළමු දින සෑම කෙනෙකුම තමන්ගේම ආකාරයෙන් අත්විඳිති.',
    statTitle: 'පොදු අත්දැකීමක්',
    statText:
      'දරු උපතින් පසු කම්පනය ප්‍රසූතියෙන් පසු සාමාන්‍ය වන අතර දින කිහිපයක් තුළ තනිවම යහපත් වීමට නැඹුරු වේ.',
    section2Kicker: 'සලකුණු',
    section2Title: 'ඔබට දැනෙන්නට පුළුවන් දේ',
    section2Body:
      'මිනිසුන් අත්විඳින දේ වෙනස් වේ. සමහරුන්ට ප්‍රධාන වශයෙන් වෙහෙස සහ සංවේදීතාව දැනෙන අතර, තවත් අයට වඩාත් කැපී පෙනෙන මනෝභාව වෙනස්වීම් තිබිය හැක.',
    commonSigns: [
      {
        title: 'චිත්තවේගීභාවය',
        description: 'වඩාත් පහසුවෙන් අඬන්නට හෝ විශේෂයෙන් සංවේදී බවක් දැනෙන්නට පුළුවන්.',
      },
      {
        title: 'අධි සංවේදීතාව',
        description: 'හැඟීම් වඩාත් තදින් දැනෙන අතර ඉක්මනින් වෙනස් විය හැක.',
      },
      {
        title: 'මනෝභාව උච්චාවචනය',
        description:
          'බිඳෙනසුලු බවක් සුවපහසු මොහොතවල් සමඟ මාරුවෙමින් පැවතිය හැක.',
      },
      {
        title: 'වෙහෙස',
        description: 'පළමු දිනවල වෙහෙස හැඟීම් තවත් වැඩි කළ හැක.',
      },
    ],
    section3Kicker: 'දිනෙන් දින',
    section3Title: 'උපකාරී විය හැකි දේ',
    section3Body:
      'මෙම කාලය තුළ විවේකයේ අවශ්‍යතාව විශාලයි. කුඩා, සරල දේවල් දින වඩාත් සුවපහසු කළ හැක.',
    dailySupport: [
      {
        title: 'විවේක ගැනීම',
        description: 'යථා තත්ත්වයට පැමිණීමට ඕනෑම නිදහස් මොහොතක් ප්‍රයෝජනයට ගැනීම.',
      },
      {
        title: 'උදව් පිළිගැනීම',
        description: 'ඔබ අවට සිටින අයගෙන් සහාය ඉල්ලීමට මැළි නොවන්න.',
      },
      {
        title: 'නිතිපතා ජලය පානය කිරීම',
        description: 'දවස පුරා ප්‍රමාණවත් ලෙස ජලය පානය කර සිටීම.',
      },
      {
        title: 'ප්‍රමාණවත් ලෙස අනුභව කිරීම',
        description: 'නිතිපතා, සරල ආහාර වේල්වලට ප්‍රමුඛත්වය දීම.',
      },
    ],
    quoteText:
      '“ප්‍රසූතියෙන් පසු උදව් ඉල්ලීම ඔබ ගැනත් ඔබේ දරුවා ගැනත් සැලකිලිමත් වීමේ ක්‍රමයකි.”',
    section4Kicker: 'වෙන්කර හඳුනාගැනීම',
    section4Title: 'දරු උපතින් පසු කම්පනයද, ප්‍රසූතියෙන් පසු අවපීඩනයද?',
    section4Body:
      'දරු උපතින් පසු කම්පනය සාමාන්‍යයෙන් කෙටි වන අතර ක්‍රමයෙන් යහපත් වේ. ප්‍රසූතියෙන් පසු අවපීඩනය වෙනස්ය: එය වඩාත් දිගටම පවතින, වඩාත් තීව්‍ර විය හැකි අතර එදිනෙදා ජීවිතයට සැලකිය යුතු බලපෑමක් ඇති කළ හැක.',
    compareTitle: 'වෙන්කර හඳුනාගත යුතු තත්ත්වයන් දෙකක්',
    compareBabyBluesTitle: 'දරු උපතින් පසු කම්පනය',
    compareBabyBluesText:
      'බොහෝ විට කෙටි වන අතර, ඉදිරි දිනවලදී ක්‍රමයෙන් යහපත් වේ.',
    comparePostpartumTitle: 'ප්‍රසූතියෙන් පසු අවපීඩනය',
    comparePostpartumText:
      'වැඩි කාලයක් පැවතිය හැකි අතර, තීව්‍ර වී වෘත්තීය සහාය අවශ්‍ය විය හැක.',
    section5Kicker: 'සැලකිලිමත්ව සිටීම',
    section5Title: 'උදව් ඉල්ලිය යුත්තේ කවදාද?',
    section5Body:
      'චිත්තවේගී දුක්ඛිතභාවය යහපත් නොවන්නේ නම්, වඩාත් තීව්‍ර වන්නේ නම්, හෝ එදිනෙදා ජීවිතය අපහසු කරන්නට පටන් ගන්නේ නම් සෞඛ්‍ය වෘත්තිකයෙකු සමඟ කතා කිරීම වැදගත්.',
    attentionTitle: 'අවධානයට ලක් කළ යුතු අනතුරු ඇඟවීමේ සලකුණු',
    attentionSubtitle: 'වෘත්තිකයෙකු සමඟ කතා කරන්න, මෙසේ නම්…',
    attentionSigns: [
      'රෝග ලක්ෂණ සති දෙකකට වඩා පවතී.',
      'දුක හෝ කනස්සල්ල වඩාත් තීව්‍ර වේ.',
      'ඔබ ගැන හෝ ඔබේ දරුවා ගැන සැලකිලිමත් වීම අපහසු වේ.',
      'සැලකිය යුතු දුක්ඛිතභාවයක් ඇති වේ.',
    ],
    professionalTitle: 'සහාය ලබාගත හැක',
    professionalText:
      'ප්‍රසව හෙදියක්, වෛද්‍යවරයෙකු, මනෝවිද්‍යාඥයෙකු හෝ වෙනත් සෞඛ්‍ය වෘත්තිකයෙකුට සවන් දී, තත්ත්වය තක්සේරු කර, සුදුසු සහාය ලබා දිය හැක.',
    tipTitle: 'දැනගත යුතු දේ',
    tipText:
      'ප්‍රසූතියෙන් පසු හැඟීම් ඔබ කොතරම් හොඳ මවක්ද යන්නේ මිනුමක් නොවේ. ඔබට විවේකය අවශ්‍ය වීමට, සවන් දෙනු ලැබීමට සහ සහාය ලැබීමට අයිතියක් ඇත.',
    section6Kicker: 'ප්‍රධාන කරුණු',
    section6Title: 'ප්‍රධාන කරුණු',
    takeaways: [
      'දරු උපතින් පසු කම්පනය ප්‍රසූතියෙන් පසු පොදුයි.',
      'වෙහෙස සහ හෝමෝන වෙනස්කම් මනෝභාවයට බලපෑ හැක.',
      'ඔබ අවට සිටින අයගේ සහාය මෙම කාලය පහසු කළ හැක.',
      'දිගටම පවතින හෝ සැලකිය යුතු දුක්ඛිතභාවයට වෘත්තීය ඇගයීමක් ලැබිය යුතුයි.',
    ],
    disclaimerText:
      'මෙම ලිපිය තොරතුරු සඳහා පමණක් වන අතර පුද්ගලීකරණය කළ වෛද්‍ය උපදෙස් වෙනුවට නොපවතී. සැකයක් ඇත්නම් හෝ සැලකිය යුතු දුක්ඛිතභාවයක් අත්විඳින්නේ නම්, සෞඛ්‍ය වෘත්තිකයෙකු සමඟ කතා කරන්න.',
    endText: 'ඔබ ගැන සැලකිලිමත් වීමද ප්‍රසූතියෙන් පසු කාලයේ කොටසකි.',
    shareTitle: 'දරු උපතින් පසු කම්පනය සහ ප්‍රසූතියෙන් පසු චිත්තවේගී සෞඛ්‍යය',
    shareMessage:
      'දරු උපතින් පසු කම්පනය සහ ප්‍රසූතියෙන් පසු චිත්තවේගී සෞඛ්‍යය — AWA\n\nප්‍රසූතියෙන් පසු පොදු වන චිත්තවේගී වෙනස්කම් තේරුම් ගැනීමට මාර්ගෝපදේශයක්.',
  },
  th: {
    badgeText: 'หลังคลอด • สุขภาพทางอารมณ์',
    title: 'ภาวะเศร้าหลังคลอดและ\nสุขภาพทางอารมณ์หลังคลอด',
    subtitle:
      'ทำความเข้าใจสิ่งที่อาจเปลี่ยนไปทางอารมณ์หลังคลอด และรู้ว่าเมื่อไรควรขอความช่วยเหลือ',
    metaItems: ['อ่าน 10 นาที', 'บทความ', 'เริ่มต้น', 'เนื้อหาที่ผ่านการตรวจสอบ'],
    introTitle: 'ควรรู้',
    introText:
      'หลังคลอด เป็นเรื่องปกติที่จะมีช่วงที่อารมณ์อ่อนไหวมากขึ้น ภาวะเศร้าหลังคลอดมักเป็นเพียงชั่วคราว แต่ความทุกข์ที่ยังอยู่นานหรือรุนแรงขึ้นควรได้รับการดูแลจากผู้เชี่ยวชาญ',
    contentsEyebrow: 'คู่มือ',
    contentsTitle: 'ในบทความนี้',
    contents: [
      'ทำความเข้าใจภาวะเศร้าหลังคลอด',
      'สัญญาณที่พบบ่อยที่สุด',
      'สิ่งที่ช่วยได้ในแต่ละวัน',
      'ภาวะเศร้าหลังคลอดหรือภาวะซึมเศร้าหลังคลอด?',
      'เมื่อไรควรขอความช่วยเหลือ',
      'ประเด็นสำคัญ',
    ],
    section1Kicker: 'ทำความเข้าใจ',
    section1Title: 'ภาวะเศร้าหลังคลอดคืออะไร?',
    section1Body1:
      'ภาวะเศร้าหลังคลอดคือช่วงที่อารมณ์เปลี่ยนแปลง ซึ่งอาจเกิดขึ้นในช่วงไม่กี่วันแรกหลังคลอด การเปลี่ยนแปลงของฮอร์โมน ความเหนื่อยล้า การนอนไม่พอ และการปรับตัวกับช่วงชีวิตใหม่นี้ ล้วนทำให้เกิดความอ่อนไหวนี้ได้',
    section1Body2:
      'นี่ไม่ใช่ความล้มเหลว และไม่ได้หมายความว่าคุณเป็นแม่ที่ไม่ดี ทุกคนผ่านช่วงแรกหลังคลอดในแบบของตัวเอง',
    statTitle: 'ประสบการณ์ที่พบบ่อย',
    statText:
      'ภาวะเศร้าหลังคลอดพบบ่อยหลังการคลอด และมักดีขึ้นเองภายในไม่กี่วัน',
    section2Kicker: 'สัญญาณ',
    section2Title: 'สิ่งที่คุณอาจรู้สึก',
    section2Body:
      'ประสบการณ์ของแต่ละคนแตกต่างกัน บางคนรู้สึกเหนื่อยล้าและอ่อนไหวเป็นหลัก ขณะที่บางคนอาจมีอารมณ์เปลี่ยนแปลงชัดเจนกว่า',
    commonSigns: [
      {
        title: 'อารมณ์อ่อนไหวง่าย',
        description: 'ร้องไห้ง่ายขึ้นหรือรู้สึกอ่อนไหวเป็นพิเศษ',
      },
      {
        title: 'ไวต่อความรู้สึกมาก',
        description: 'อารมณ์อาจรู้สึกรุนแรงขึ้นและเปลี่ยนไปอย่างรวดเร็ว',
      },
      {
        title: 'อารมณ์แปรปรวน',
        description:
          'ความรู้สึกเปราะบางอาจสลับกับช่วงเวลาที่รู้สึกดี',
      },
      {
        title: 'ความเหนื่อยล้า',
        description: 'ความเหนื่อยล้าในช่วงแรกอาจทำให้อารมณ์รุนแรงขึ้น',
      },
    ],
    section3Kicker: 'ในแต่ละวัน',
    section3Title: 'สิ่งที่ช่วยได้',
    section3Body:
      'ในช่วงนี้ ความต้องการพักผ่อนมีมาก สิ่งเล็ก ๆ ง่าย ๆ ช่วยให้วันเวลาสบายขึ้นได้',
    dailySupport: [
      {
        title: 'พักผ่อน',
        description: 'ใช้ทุกช่วงเวลาว่างเพื่อฟื้นตัว',
      },
      {
        title: 'ยอมรับความช่วยเหลือ',
        description: 'อย่าลังเลที่จะขอการสนับสนุนจากคนรอบข้าง',
      },
      {
        title: 'ดื่มน้ำสม่ำเสมอ',
        description: 'ดื่มน้ำให้เพียงพอตลอดทั้งวัน',
      },
      {
        title: 'กินให้เพียงพอ',
        description: 'เลือกมื้ออาหารที่ง่ายและเป็นเวลา',
      },
    ],
    quoteText:
      '“การขอความช่วยเหลือหลังคลอดคือวิธีหนึ่งในการดูแลตัวคุณเองและลูกน้อย”',
    section4Kicker: 'การแยกความแตกต่าง',
    section4Title: 'ภาวะเศร้าหลังคลอดหรือภาวะซึมเศร้าหลังคลอด?',
    section4Body:
      'ภาวะเศร้าหลังคลอดมักสั้นและดีขึ้นทีละน้อย ส่วนภาวะซึมเศร้าหลังคลอดต่างออกไป: อาจคงอยู่นานกว่า รุนแรงกว่า และส่งผลต่อชีวิตประจำวันอย่างมาก',
    compareTitle: 'สองสถานการณ์ที่ควรแยกให้ออก',
    compareBabyBluesTitle: 'ภาวะเศร้าหลังคลอด',
    compareBabyBluesText:
      'มักสั้น และค่อย ๆ ดีขึ้นในอีกไม่กี่วันต่อมา',
    comparePostpartumTitle: 'ภาวะซึมเศร้าหลังคลอด',
    comparePostpartumText:
      'อาจคงอยู่นานกว่า รุนแรงขึ้น และต้องการการสนับสนุนจากผู้เชี่ยวชาญ',
    section5Kicker: 'การเฝ้าระวัง',
    section5Title: 'เมื่อไรควรขอความช่วยเหลือ?',
    section5Body:
      'สิ่งสำคัญคือควรพูดคุยกับบุคลากรทางการแพทย์ หากความทุกข์ทางอารมณ์ไม่ดีขึ้น รุนแรงขึ้น หรือเริ่มทำให้ชีวิตประจำวันยากขึ้น',
    attentionTitle: 'สัญญาณเตือนที่ควรสังเกต',
    attentionSubtitle: 'ควรพูดคุยกับผู้เชี่ยวชาญหาก…',
    attentionSigns: [
      'อาการคงอยู่นานเกินสองสัปดาห์',
      'ความเศร้าหรือความวิตกกังวลรุนแรงขึ้น',
      'การดูแลตัวเองหรือลูกน้อยทำได้ยากขึ้น',
      'เกิดความรู้สึกทุกข์ใจอย่างมาก',
    ],
    professionalTitle: 'มีผู้พร้อมให้การสนับสนุน',
    professionalText:
      'ผดุงครรภ์ แพทย์ นักจิตวิทยา หรือบุคลากรทางการแพทย์อื่น ๆ สามารถรับฟัง ประเมินสถานการณ์ และให้การสนับสนุนที่เหมาะสมได้',
    tipTitle: 'ควรรู้',
    tipText:
      'อารมณ์หลังคลอดไม่ได้วัดว่าคุณเป็นแม่ที่ดีเพียงใด คุณมีสิทธิ์ที่จะต้องการพักผ่อน ได้รับการรับฟัง และได้รับการสนับสนุน',
    section6Kicker: 'ประเด็นสำคัญ',
    section6Title: 'ประเด็นสำคัญ',
    takeaways: [
      'ภาวะเศร้าหลังคลอดพบบ่อยหลังการคลอด',
      'ความเหนื่อยล้าและการเปลี่ยนแปลงของฮอร์โมนอาจส่งผลต่ออารมณ์',
      'การสนับสนุนจากคนรอบข้างช่วยให้ช่วงนี้ง่ายขึ้น',
      'ความทุกข์ที่คงอยู่หรือรุนแรงควรได้รับการประเมินจากผู้เชี่ยวชาญ',
    ],
    disclaimerText:
      'บทความนี้เพื่อให้ข้อมูล และไม่ได้ทดแทนคำแนะนำทางการแพทย์เฉพาะบุคคล หากมีข้อสงสัยหรือรู้สึกทุกข์ใจอย่างมาก โปรดพูดคุยกับบุคลากรทางการแพทย์',
    endText: 'การดูแลตัวเองก็เป็นส่วนหนึ่งของช่วงหลังคลอดเช่นกัน',
    shareTitle: 'ภาวะเศร้าหลังคลอดและสุขภาพทางอารมณ์หลังคลอด',
    shareMessage:
      'ภาวะเศร้าหลังคลอดและสุขภาพทางอารมณ์หลังคลอด — AWA\n\nคู่มือทำความเข้าใจการเปลี่ยนแปลงทางอารมณ์ที่พบบ่อยหลังคลอด',
  },
  vi: {
    badgeText: 'SAU SINH • SỨC KHỎE TINH THẦN',
    title: 'Baby blues và sức khỏe\ntinh thần sau sinh',
    subtitle:
      'Hiểu những thay đổi có thể xảy ra về mặt cảm xúc sau khi sinh và biết khi nào nên tìm kiếm sự hỗ trợ.',
    metaItems: ['10 phút đọc', 'Bài viết', 'Cơ bản', 'Nội dung đã được thẩm định'],
    introTitle: 'Nên biết',
    introText:
      'Sau khi sinh, việc trải qua một giai đoạn nhạy cảm hơn về mặt cảm xúc là điều thường gặp. Baby blues thường chỉ là tạm thời, nhưng nỗi đau khổ kéo dài hoặc ngày càng nặng thì cần được chuyên gia quan tâm.',
    contentsEyebrow: 'HƯỚNG DẪN',
    contentsTitle: 'Trong bài viết này',
    contents: [
      'Hiểu về baby blues',
      'Những dấu hiệu thường gặp nhất',
      'Điều gì giúp ích mỗi ngày',
      'Baby blues hay trầm cảm sau sinh?',
      'Khi nào nên nhờ giúp đỡ',
      'Những điểm chính cần nhớ',
    ],
    section1Kicker: 'HIỂU VỀ',
    section1Title: 'Baby blues là gì?',
    section1Body1:
      'Baby blues là giai đoạn thay đổi cảm xúc có thể xảy ra trong vài ngày đầu sau khi sinh. Sự thay đổi nội tiết, mệt mỏi, thiếu ngủ và việc thích nghi với giai đoạn mới này đều có thể góp phần gây nên sự nhạy cảm đó.',
    section1Body2:
      'Đây không phải là thất bại và cũng không có nghĩa bạn là một người mẹ tồi. Mỗi người trải qua những ngày đầu sau sinh theo cách riêng của mình.',
    statTitle: 'Một trải nghiệm thường gặp',
    statText:
      'Baby blues thường gặp sau khi sinh và có xu hướng tự cải thiện trong vòng vài ngày.',
    section2Kicker: 'CÁC DẤU HIỆU',
    section2Title: 'Những gì bạn có thể cảm thấy',
    section2Body:
      'Trải nghiệm của mỗi người khác nhau. Có người chủ yếu cảm thấy mệt mỏi và nhạy cảm, trong khi người khác có thể thay đổi tâm trạng rõ rệt hơn.',
    commonSigns: [
      {
        title: 'Dễ xúc động',
        description: 'Dễ khóc hơn hoặc cảm thấy đặc biệt nhạy cảm.',
      },
      {
        title: 'Quá nhạy cảm',
        description: 'Cảm xúc có thể mạnh hơn và thay đổi nhanh chóng.',
      },
      {
        title: 'Tâm trạng thất thường',
        description:
          'Cảm giác mong manh có thể xen kẽ với những lúc cảm thấy dễ chịu.',
      },
      {
        title: 'Mệt mỏi',
        description: 'Sự mệt mỏi của những ngày đầu có thể khuếch đại cảm xúc.',
      },
    ],
    section3Kicker: 'MỖI NGÀY',
    section3Title: 'Điều gì có thể giúp ích',
    section3Body:
      'Trong giai đoạn này, nhu cầu nghỉ ngơi rất lớn. Những việc nhỏ, đơn giản có thể khiến những ngày trôi qua dễ chịu hơn.',
    dailySupport: [
      {
        title: 'Nghỉ ngơi',
        description: 'Tận dụng mọi khoảng trống để hồi phục.',
      },
      {
        title: 'Chấp nhận sự giúp đỡ',
        description: 'Đừng ngần ngại nhờ những người xung quanh hỗ trợ.',
      },
      {
        title: 'Uống nước đều đặn',
        description: 'Giữ đủ nước cho cơ thể suốt cả ngày.',
      },
      {
        title: 'Ăn đủ bữa',
        description: 'Ưu tiên những bữa ăn đều đặn, đơn giản.',
      },
    ],
    quoteText:
      '“Nhờ giúp đỡ trong giai đoạn sau sinh là một cách chăm sóc bản thân và em bé của bạn.”',
    section4Kicker: 'PHÂN BIỆT',
    section4Title: 'Baby blues hay trầm cảm sau sinh?',
    section4Body:
      'Baby blues thường ngắn và cải thiện dần. Trầm cảm sau sinh thì khác: có thể kéo dài hơn, nặng hơn và ảnh hưởng đáng kể đến cuộc sống hằng ngày.',
    compareTitle: 'Hai tình huống cần phân biệt',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Thường ngắn, cải thiện dần trong những ngày tiếp theo.',
    comparePostpartumTitle: 'Trầm cảm sau sinh',
    comparePostpartumText:
      'Có thể kéo dài hơn, nặng lên và cần sự hỗ trợ của chuyên gia.',
    section5Kicker: 'LUÔN CẢNH GIÁC',
    section5Title: 'Khi nào nên nhờ giúp đỡ?',
    section5Body:
      'Điều quan trọng là nói chuyện với nhân viên y tế nếu nỗi đau khổ về mặt cảm xúc không cải thiện, trở nên nặng hơn hoặc bắt đầu khiến cuộc sống hằng ngày khó khăn hơn.',
    attentionTitle: 'Những dấu hiệu cảnh báo cần chú ý',
    attentionSubtitle: 'Hãy nói chuyện với chuyên gia nếu…',
    attentionSigns: [
      'Các triệu chứng kéo dài hơn hai tuần.',
      'Nỗi buồn hoặc lo âu trở nên nặng hơn.',
      'Việc chăm sóc bản thân hoặc em bé trở nên khó khăn.',
      'Xuất hiện cảm giác đau khổ đáng kể.',
    ],
    professionalTitle: 'Luôn có sự hỗ trợ dành cho bạn',
    professionalText:
      'Nữ hộ sinh, bác sĩ, chuyên gia tâm lý hoặc nhân viên y tế khác có thể lắng nghe, đánh giá tình hình và đưa ra sự hỗ trợ phù hợp.',
    tipTitle: 'Nên biết',
    tipText:
      'Cảm xúc sau sinh không phải là thước đo bạn là một người mẹ tốt đến đâu. Bạn có quyền cần được nghỉ ngơi, được lắng nghe và được hỗ trợ.',
    section6Kicker: 'ĐIỂM CHÍNH',
    section6Title: 'Những điểm chính cần nhớ',
    takeaways: [
      'Baby blues thường gặp sau khi sinh.',
      'Mệt mỏi và thay đổi nội tiết có thể ảnh hưởng đến tâm trạng.',
      'Sự hỗ trợ từ những người xung quanh có thể giúp giai đoạn này dễ dàng hơn.',
      'Nỗi đau khổ kéo dài hoặc đáng kể cần được chuyên gia đánh giá.',
    ],
    disclaimerText:
      'Bài viết này chỉ mang tính thông tin và không thay thế lời khuyên y khoa cá nhân hóa. Nếu có nghi ngờ hoặc cảm thấy đau khổ đáng kể, hãy nói chuyện với nhân viên y tế.',
    endText: 'Chăm sóc bản thân cũng là một phần của giai đoạn sau sinh.',
    shareTitle: 'Baby blues và sức khỏe tinh thần sau sinh',
    shareMessage:
      'Baby blues và sức khỏe tinh thần sau sinh — AWA\n\nMột hướng dẫn để hiểu những thay đổi cảm xúc thường gặp sau khi sinh.',
  },
  uz: {
    badgeText: 'TUGʻRUQDAN KEYIN • HISSIY SALOMATLIK',
    title: 'Beybi-blyuz va tugʻruqdan keyingi\nhissiy salomatlik',
    subtitle:
      'Tugʻruqdan keyin hissiy jihatdan nimalar oʻzgarishi mumkinligini tushunish va qachon yordam soʻrash kerakligini bilish.',
    metaItems: ['10 daq oʻqish', 'Maqola', 'Boshlangʻich', 'Tasdiqlangan kontent'],
    introTitle: 'Bilish foydali',
    introText:
      'Tugʻruqdan keyin hissiy sezgirlik kuchaygan davrni boshdan kechirish keng tarqalgan. Beybi-blyuz odatda vaqtinchalik, ammo saqlanib qoladigan yoki kuchayib boradigan iztirob mutaxassis eʼtiboriga loyiq.',
    contentsEyebrow: 'QOʻLLANMA',
    contentsTitle: 'Ushbu maqolada',
    contents: [
      'Beybi-blyuzni tushunish',
      'Eng keng tarqalgan belgilar',
      'Kundalik hayotda nima yordam beradi',
      'Beybi-blyuz yoki tugʻruqdan keyingi depressiya?',
      'Qachon yordam soʻrash kerak',
      'Asosiy xulosalar',
    ],
    section1Kicker: 'TUSHUNISH',
    section1Title: 'Beybi-blyuz nima?',
    section1Body1:
      'Beybi-blyuz — tugʻruqdan keyingi dastlabki bir necha kunda yuz berishi mumkin boʻlgan hissiy oʻzgarishlar davri. Gormonal siljishlar, charchoq, uyqu yetishmasligi va bu yangi bosqichga moslashish — barchasi shu sezgirlikka hissa qoʻshishi mumkin.',
    section1Body2:
      'Bu muvaffaqiyatsizlik emas va yomon ona ekaningizni anglatmaydi. Har kim tugʻruqdan keyingi dastlabki kunlarni oʻzicha boshdan kechiradi.',
    statTitle: 'Keng tarqalgan tajriba',
    statText:
      'Beybi-blyuz tugʻruqdan keyin keng tarqalgan va odatda bir necha kun ichida oʻz-oʻzidan yaxshilanadi.',
    section2Kicker: 'BELGILAR',
    section2Title: 'Nimani his qilishingiz mumkin',
    section2Body:
      'Odamlarning tajribasi turlicha. Baʼzilar asosan charchoq va sezgirlikni his qiladi, boshqalarda esa kayfiyat oʻzgarishlari yaqqolroq boʻlishi mumkin.',
    commonSigns: [
      {
        title: 'Hissiyotlilik',
        description: 'Osonroq yigʻlash yoki alohida sezgir boʻlish.',
      },
      {
        title: 'Haddan tashqari sezgirlik',
        description: 'Hissiyotlar kuchliroq tuyulishi va tez oʻzgarishi mumkin.',
      },
      {
        title: 'Kayfiyat oʻzgarishlari',
        description:
          'Moʻrtlik hissi farovonlik lahzalari bilan almashishi mumkin.',
      },
      {
        title: 'Charchoq',
        description: 'Dastlabki kunlardagi charchoq hissiyotlarni kuchaytirishi mumkin.',
      },
    ],
    section3Kicker: 'KUNDALIK HAYOT',
    section3Title: 'Nima yordam berishi mumkin',
    section3Body:
      'Bu davrda dam olishga ehtiyoj katta. Kichik, oddiy narsalar kunlarni qulayroq qilishi mumkin.',
    dailySupport: [
      {
        title: 'Dam olish',
        description: 'Tiklanish uchun har qanday boʻsh lahzadan foydalanish.',
      },
      {
        title: 'Yordamni qabul qilish',
        description: 'Atrofingizdagilardan yordam soʻrashdan tortinmang.',
      },
      {
        title: 'Muntazam ichish',
        description: 'Kun davomida yetarli suv balansini saqlash.',
      },
      {
        title: 'Yetarli ovqatlanish',
        description: 'Muntazam, oddiy ovqatlarni afzal koʻrish.',
      },
    ],
    quoteText:
      '“Tugʻruqdan keyin yordam soʻrash — oʻzingizga va chaqalogʻingizga gʻamxoʻrlik qilishning bir usuli.”',
    section4Kicker: 'FARQLASH',
    section4Title: 'Beybi-blyuz yoki tugʻruqdan keyingi depressiya?',
    section4Body:
      'Beybi-blyuz odatda qisqa va asta-sekin yaxshilanadi. Tugʻruqdan keyingi depressiya boshqacha: u uzoqroq, kuchliroq boʻlishi va kundalik hayotga sezilarli taʼsir qilishi mumkin.',
    compareTitle: 'Farqlash kerak boʻlgan ikki holat',
    compareBabyBluesTitle: 'Beybi-blyuz',
    compareBabyBluesText:
      'Koʻpincha qisqa, keyingi kunlarda asta-sekin yaxshilanish bilan.',
    comparePostpartumTitle: 'Tugʻruqdan keyingi depressiya',
    comparePostpartumText:
      'Uzoqroq davom etishi, kuchayishi va mutaxassis yordamini talab qilishi mumkin.',
    section5Kicker: 'OGOH BOʻLISH',
    section5Title: 'Qachon yordam soʻrash kerak?',
    section5Body:
      'Agar hissiy iztirob yaxshilanmasa, kuchaysa yoki kundalik hayotni qiyinlashtira boshlasa, sogʻliqni saqlash mutaxassisi bilan gaplashish muhim.',
    attentionTitle: 'Eʼtibor berish kerak boʻlgan ogohlantiruvchi belgilar',
    attentionSubtitle: 'Quyidagi hollarda mutaxassis bilan gaplashing…',
    attentionSigns: [
      'Alomatlar ikki haftadan ortiq davom etadi.',
      'Qaygʻu yoki xavotir kuchayadi.',
      'Oʻzingizga yoki chaqalogʻingizga gʻamxoʻrlik qilish qiyinlashadi.',
      'Kuchli iztirob hissi paydo boʻladi.',
    ],
    professionalTitle: 'Yordam mavjud',
    professionalText:
      'Doya, shifokor, psixolog yoki boshqa sogʻliqni saqlash mutaxassisi tinglashi, vaziyatni baholashi va mos yordam taklif qilishi mumkin.',
    tipTitle: 'Bilish foydali',
    tipText:
      'Tugʻruqdan keyingi hissiyotlar qanchalik yaxshi ona ekaningizning oʻlchovi emas. Dam olishga ehtiyoj sezishga, tinglanishga va qoʻllab-quvvatlanishga haqqingiz bor.',
    section6Kicker: 'ASOSIY NUQTALAR',
    section6Title: 'Asosiy xulosalar',
    takeaways: [
      'Beybi-blyuz tugʻruqdan keyin keng tarqalgan.',
      'Charchoq va gormonal oʻzgarishlar kayfiyatga taʼsir qilishi mumkin.',
      'Atrofingizdagilarning qoʻllab-quvvatlashi bu davrni yengillashtirishi mumkin.',
      'Doimiy yoki kuchli iztirob mutaxassis baholashiga arziydi.',
    ],
    disclaimerText:
      'Bu maqola maʼlumot uchun va shaxsiy tibbiy maslahatni almashtirmaydi. Shubha boʻlsa yoki kuchli iztirob boʻlsa, sogʻliqni saqlash mutaxassisi bilan gaplashing.',
    endText: 'Oʻzingizga gʻamxoʻrlik qilish ham tugʻruqdan keyingi davrning bir qismi.',
    shareTitle: 'Beybi-blyuz va tugʻruqdan keyingi hissiy salomatlik',
    shareMessage:
      'Beybi-blyuz va tugʻruqdan keyingi hissiy salomatlik — AWA\n\nTugʻruqdan keyin keng tarqalgan hissiy oʻzgarishlarni tushunishga yordam beradigan qoʻllanma.',
  },
  az: {
    badgeText: 'DOĞUŞDAN SONRA • EMOSİONAL SAĞLAMLIQ',
    title: 'Beybi-blyuz və doğuşdan sonrakı\nemosional sağlamlıq',
    subtitle:
      'Doğuşdan sonra emosional baxımdan nələrin dəyişə biləcəyini anlamaq və nə vaxt dəstək axtarmaq lazım olduğunu bilmək.',
    metaItems: ['10 dəq oxu', 'Məqalə', 'Başlanğıc', 'Yoxlanılmış məzmun'],
    introTitle: 'Bilmək faydalıdır',
    introText:
      'Doğuşdan sonra artmış emosional həssaslıq dövrü yaşamaq adi haldır. Beybi-blyuz adətən müvəqqətidir, lakin davam edən və ya güclənən sıxıntı peşəkar diqqətə layiqdir.',
    contentsEyebrow: 'BƏLƏDÇİ',
    contentsTitle: 'Bu məqalədə',
    contents: [
      'Beybi-blyuzu anlamaq',
      'Ən geniş yayılmış əlamətlər',
      'Gündəlik həyatda nə kömək edir',
      'Beybi-blyuz, yoxsa doğuşdan sonrakı depressiya?',
      'Nə vaxt kömək istəmək lazımdır',
      'Əsas nəticələr',
    ],
    section1Kicker: 'ANLAMAQ',
    section1Title: 'Beybi-blyuz nədir?',
    section1Body1:
      'Beybi-blyuz doğuşdan sonrakı ilk bir neçə gündə baş verə bilən emosional dəyişikliklər dövrüdür. Hormonal dəyişikliklər, yorğunluq, yuxusuzluq və bu yeni mərhələyə uyğunlaşma bu həssaslığa töhfə verə bilər.',
    section1Body2:
      'Bu, uğursuzluq deyil və pis ana olduğunuz demək deyil. Hər kəs doğuşdan sonrakı ilk günləri öz yolu ilə yaşayır.',
    statTitle: 'Geniş yayılmış təcrübə',
    statText:
      'Beybi-blyuz doğuşdan sonra geniş yayılıb və bir neçə gün ərzində özü yaxşılaşmağa meyllidir.',
    section2Kicker: 'ƏLAMƏTLƏR',
    section2Title: 'Nə hiss edə bilərsiniz',
    section2Body:
      'İnsanların yaşadıqları dəyişir. Bəziləri əsasən yorğunluq və həssaslıq hiss edir, digərlərində isə daha nəzərəçarpan əhval dəyişiklikləri ola bilər.',
    commonSigns: [
      {
        title: 'Emosionallıq',
        description: 'Daha asan ağlamaq və ya özünü xüsusilə həssas hiss etmək.',
      },
      {
        title: 'Həddindən artıq həssaslıq',
        description: 'Emosiyalar daha güclü hiss oluna və tez dəyişə bilər.',
      },
      {
        title: 'Əhval dəyişkənliyi',
        description:
          'Kövrəklik hissi rifah anları ilə növbələşə bilər.',
      },
      {
        title: 'Yorğunluq',
        description: 'İlk günlərin yorğunluğu emosiyaları gücləndirə bilər.',
      },
    ],
    section3Kicker: 'GÜNDƏLİK HƏYAT',
    section3Title: 'Nə kömək edə bilər',
    section3Body:
      'Bu dövrdə istirahətə ehtiyac böyükdür. Kiçik, sadə şeylər günləri daha rahat edə bilər.',
    dailySupport: [
      {
        title: 'İstirahət etmək',
        description: 'Bərpa olunmaq üçün hər boş andan istifadə etmək.',
      },
      {
        title: 'Köməyi qəbul etmək',
        description: 'Ətrafınızdakılardan dəstək istəməkdən çəkinməyin.',
      },
      {
        title: 'Müntəzəm içmək',
        description: 'Gün ərzində kifayət qədər hidratasiyanı qorumaq.',
      },
      {
        title: 'Kifayət qədər yemək',
        description: 'Müntəzəm, sadə yeməklərə üstünlük vermək.',
      },
    ],
    quoteText:
      '“Doğuşdan sonrakı dövrdə kömək istəmək özünüzə və körpənizə qayğı göstərməyin bir yoludur.”',
    section4Kicker: 'FƏRQLƏNDİRMƏK',
    section4Title: 'Beybi-blyuz, yoxsa doğuşdan sonrakı depressiya?',
    section4Body:
      'Beybi-blyuz adətən qısa olur və tədricən yaxşılaşır. Doğuşdan sonrakı depressiya isə fərqlidir: o, daha davamlı, daha güclü ola və gündəlik həyata əhəmiyyətli təsir göstərə bilər.',
    compareTitle: 'Fərqləndirilməli iki vəziyyət',
    compareBabyBluesTitle: 'Beybi-blyuz',
    compareBabyBluesText:
      'Çox vaxt qısa olur, sonrakı günlərdə tədricən yaxşılaşma ilə.',
    comparePostpartumTitle: 'Doğuşdan sonrakı depressiya',
    comparePostpartumText:
      'Daha uzun çəkə, güclənə və peşəkar dəstək tələb edə bilər.',
    section5Kicker: 'AYIQ QALMAQ',
    section5Title: 'Nə vaxt kömək istəmək lazımdır?',
    section5Body:
      'Emosional sıxıntı yaxşılaşmırsa, güclənirsə və ya gündəlik həyatı çətinləşdirməyə başlayırsa, tibb işçisi ilə danışmaq vacibdir.',
    attentionTitle: 'Diqqət ediləcək xəbərdarlıq əlamətləri',
    attentionSubtitle: 'Bu hallarda mütəxəssislə danışın…',
    attentionSigns: [
      'Simptomlar iki həftədən çox davam edir.',
      'Kədər və ya narahatlıq güclənir.',
      'Özünüzə və ya körpənizə qulluq etmək çətinləşir.',
      'Əhəmiyyətli sıxıntı hissi yaranır.',
    ],
    professionalTitle: 'Dəstək mövcuddur',
    professionalText:
      'Mama, həkim, psixoloq və ya digər tibb işçisi sizi dinləyə, vəziyyəti qiymətləndirə və uyğun dəstək təklif edə bilər.',
    tipTitle: 'Bilmək faydalıdır',
    tipText:
      'Doğuşdan sonrakı emosiyalar nə qədər yaxşı ana olduğunuzun ölçüsü deyil. İstirahətə ehtiyac duymaq, dinlənilmək və dəstəklənmək hüququnuz var.',
    section6Kicker: 'ƏSAS MƏQAMLAR',
    section6Title: 'Əsas nəticələr',
    takeaways: [
      'Beybi-blyuz doğuşdan sonra geniş yayılıb.',
      'Yorğunluq və hormonal dəyişikliklər əhvala təsir edə bilər.',
      'Ətrafınızdakıların dəstəyi bu dövrü asanlaşdıra bilər.',
      'Davamlı və ya əhəmiyyətli sıxıntı peşəkar qiymətləndirməyə layiqdir.',
    ],
    disclaimerText:
      'Bu məqalə məlumat məqsədi daşıyır və fərdi tibbi məsləhəti əvəz etmir. Şübhə olarsa və ya əhəmiyyətli sıxıntı yaşayırsınızsa, tibb işçisi ilə danışın.',
    endText: 'Özünüzə qulluq etmək də doğuşdan sonrakı dövrün bir hissəsidir.',
    shareTitle: 'Beybi-blyuz və doğuşdan sonrakı emosional sağlamlıq',
    shareMessage:
      'Beybi-blyuz və doğuşdan sonrakı emosional sağlamlıq — AWA\n\nDoğuşdan sonra geniş yayılmış emosional dəyişiklikləri anlamaq üçün bələdçi.',
  },
  ka: {
    badgeText: 'მშობიარობის შემდგომი პერიოდი • ემოციური ჯანმრთელობა',
    title: 'ბეიბი-ბლუზი და მშობიარობის შემდგომი\nემოციური ჯანმრთელობა',
    subtitle:
      'გაიგეთ, რა შეიძლება შეიცვალოს ემოციურად მშობიარობის შემდეგ და როდის უნდა მოიძიოთ მხარდაჭერა.',
    metaItems: ['10 წთ საკითხავი', 'სტატია', 'დამწყები', 'გადამოწმებული შინაარსი'],
    introTitle: 'კარგია ვიცოდეთ',
    introText:
      'მშობიარობის შემდეგ ხშირია ემოციური მგრძნობელობის გაზრდილი პერიოდი. ბეიბი-ბლუზი, როგორც წესი, დროებითია, მაგრამ გაგრძელებული ან გაძლიერებული დისკომფორტი პროფესიონალის ყურადღებას იმსახურებს.',
    contentsEyebrow: 'გზამკვლევი',
    contentsTitle: 'ამ სტატიაში',
    contents: [
      'ბეიბი-ბლუზის გაგება',
      'ყველაზე გავრცელებული ნიშნები',
      'რა გვეხმარება ყოველდღიურად',
      'ბეიბი-ბლუზი თუ მშობიარობის შემდგომი დეპრესია?',
      'როდის უნდა ითხოვოთ დახმარება',
      'მთავარი დასკვნები',
    ],
    section1Kicker: 'გაგება',
    section1Title: 'რა არის ბეიბი-ბლუზი?',
    section1Body1:
      'ბეიბი-ბლუზი ემოციური ცვლილებების პერიოდია, რომელიც მშობიარობის შემდეგ პირველ დღეებში შეიძლება დადგეს. ამ მგრძნობელობას შეიძლება უწყობდეს ხელს ჰორმონული ცვლილებები, დაღლილობა, ძილის ნაკლებობა და ახალ ეტაპთან ადაპტაცია.',
    section1Body2:
      'ეს არ არის მარცხი და არ ნიშნავს, რომ ცუდი დედა ხართ. მშობიარობის შემდგომ პირველ დღეებს ყველა თავისებურად განიცდის.',
    statTitle: 'გავრცელებული განცდა',
    statText:
      'ბეიბი-ბლუზი მშობიარობის შემდეგ ხშირია და რამდენიმე დღეში, როგორც წესი, თავისთავად უმჯობესდება.',
    section2Kicker: 'ნიშნები',
    section2Title: 'რისი განცდა შეიძლება',
    section2Body:
      'განცდები განსხვავდება. ზოგი ძირითადად დაღლილობას და მგრძნობელობას გრძნობს, ზოგს კი უფრო შესამჩნევი ხასიათის ცვლილებები აქვს.',
    commonSigns: [
      {
        title: 'ემოციურობა',
        description: 'უფრო ადვილად ტირილი ან განსაკუთრებული მგრძნობელობა.',
      },
      {
        title: 'ჰიპერმგრძნობელობა',
        description: 'ემოციები შეიძლება უფრო ძლიერი ჩანდეს და სწრაფად შეიცვალოს.',
      },
      {
        title: 'ხასიათის ცვალებადობა',
        description:
          'მყიფეობის განცდა შეიძლება კარგი თვითგრძნობის მომენტებს ენაცვლებოდეს.',
      },
      {
        title: 'დაღლილობა',
        description: 'პირველი დღეების დაღლილობამ შეიძლება ემოციები გაამძაფროს.',
      },
    ],
    section3Kicker: 'ყოველდღიურად',
    section3Title: 'რა შეიძლება დაგეხმაროთ',
    section3Body:
      'ამ პერიოდში დასვენების საჭიროება დიდია. პატარა, მარტივმა რამეებმა დღეები უფრო კომფორტული შეიძლება გახადოს.',
    dailySupport: [
      {
        title: 'დასვენება',
        description: 'ყოველი თავისუფალი წუთის გამოყენება გამოსაჯანმრთელებლად.',
      },
      {
        title: 'დახმარების მიღება',
        description: 'ნუ დააყოვნებთ გარშემომყოფებისგან მხარდაჭერის თხოვნას.',
      },
      {
        title: 'რეგულარულად სმა',
        description: 'დღის განმავლობაში საკმარისი სითხის მიღება.',
      },
      {
        title: 'საკმარისად ჭამა',
        description: 'რეგულარული, მარტივი კვების არჩევა.',
      },
    ],
    quoteText:
      '„დახმარების თხოვნა მშობიარობის შემდგომ პერიოდში საკუთარ თავზეც და ბავშვზეც ზრუნვის ერთ-ერთი გზაა.“',
    section4Kicker: 'განსხვავება',
    section4Title: 'ბეიბი-ბლუზი თუ მშობიარობის შემდგომი დეპრესია?',
    section4Body:
      'ბეიბი-ბლუზი, როგორც წესი, მოკლეა და ეტაპობრივად უმჯობესდება. მშობიარობის შემდგომი დეპრესია განსხვავდება: ის შეიძლება უფრო ხანგრძლივი და ინტენსიური იყოს და ყოველდღიურ ცხოვრებაზე მნიშვნელოვნად იმოქმედოს.',
    compareTitle: 'ორი სიტუაცია, რომელთა განსხვავებაც საჭიროა',
    compareBabyBluesTitle: 'ბეიბი-ბლუზი',
    compareBabyBluesText:
      'ხშირად მოკლეა და მომდევნო დღეებში ეტაპობრივად უმჯობესდება.',
    comparePostpartumTitle: 'მშობიარობის შემდგომი დეპრესია',
    comparePostpartumText:
      'შეიძლება უფრო დიდხანს გაგრძელდეს, გამძაფრდეს და პროფესიონალის მხარდაჭერა საჭირო გახდეს.',
    section5Kicker: 'ფხიზლად ყოფნა',
    section5Title: 'როდის უნდა ითხოვოთ დახმარება?',
    section5Body:
      'მნიშვნელოვანია ჯანდაცვის სპეციალისტს მიმართოთ, თუ ემოციური დისკომფორტი არ უმჯობესდება, უფრო ინტენსიური ხდება ან ყოველდღიურ ცხოვრებას ართულებს.',
    attentionTitle: 'გამაფრთხილებელი ნიშნები',
    attentionSubtitle: 'მიმართეთ სპეციალისტს, თუ…',
    attentionSigns: [
      'სიმპტომები ორ კვირაზე მეტ ხანს გრძელდება.',
      'სევდა ან შფოთვა უფრო ინტენსიური ხდება.',
      'საკუთარ თავზე ან ბავშვზე ზრუნვა ჭირდება.',
      'ჩნდება დისკომფორტის ძლიერი განცდა.',
    ],
    professionalTitle: 'მხარდაჭერა ხელმისაწვდომია',
    professionalText:
      'ბებიაქალს, ექიმს, ფსიქოლოგს ან სხვა ჯანდაცვის სპეციალისტს შეუძლია მოგისმინოთ, სიტუაცია შეაფასოს და შესაბამისი მხარდაჭერა შემოგთავაზოთ.',
    tipTitle: 'კარგია ვიცოდეთ',
    tipText:
      'მშობიარობის შემდგომი ემოციები არ არის იმის საზომი, რამდენად კარგი დედა ხართ. თქვენ გაქვთ უფლება, გჭირდებოდეთ დასვენება, მოსმენა და მხარდაჭერა.',
    section6Kicker: 'მთავარი საკითხები',
    section6Title: 'მთავარი დასკვნები',
    takeaways: [
      'ბეიბი-ბლუზი მშობიარობის შემდეგ ხშირია.',
      'დაღლილობამ და ჰორმონულმა ცვლილებებმა შეიძლება ხასიათზე იმოქმედოს.',
      'გარშემომყოფთა მხარდაჭერას ამ პერიოდის გაადვილება შეუძლია.',
      'გაგრძელებული ან მნიშვნელოვანი დისკომფორტი პროფესიულ შეფასებას საჭიროებს.',
    ],
    disclaimerText:
      'ეს სტატია საინფორმაციოა და პერსონალიზებულ სამედიცინო რჩევას არ ანაცვლებს. ეჭვის ან მნიშვნელოვანი დისკომფორტის შემთხვევაში მიმართეთ ჯანდაცვის სპეციალისტს.',
    endText: 'საკუთარ თავზე ზრუნვა მშობიარობის შემდგომი პერიოდის ნაწილია.',
    shareTitle: 'ბეიბი-ბლუზი და მშობიარობის შემდგომი ემოციური ჯანმრთელობა',
    shareMessage:
      'ბეიბი-ბლუზი და მშობიარობის შემდგომი ემოციური ჯანმრთელობა — AWA\n\nგზამკვლევი მშობიარობის შემდეგ გავრცელებული ემოციური ცვლილებების გასაგებად.',
  },
  hy: {
    badgeText: 'ՀԵՏԾՆՆԴՅԱՆ ՇՐՋԱՆ • ՀՈՒԶԱԿԱՆ ԱՌՈՂՋՈՒԹՅՈՒՆ',
    title: 'Բեյբի-բլյուզ և հետծննդյան\nհուզական առողջություն',
    subtitle:
      'Հասկացեք, թե ինչ կարող է փոխվել հուզականորեն ծննդաբերությունից հետո և երբ պետք է աջակցություն փնտրել:',
    metaItems: ['10 ր կարդալու համար', 'Հոդված', 'Սկսնակ', 'Վերանայված բովանդակություն'],
    introTitle: 'Լավ է իմանալ',
    introText:
      'Ծննդաբերությունից հետո տարածված է հուզական զգայունության բարձրացած շրջանը: Բեյբի-բլյուզը սովորաբար ժամանակավոր է, սակայն շարունակվող կամ սաստկացող անհարմարությունը արժանի է մասնագետի ուշադրությանը:',
    contentsEyebrow: 'ՈՒՂԵՑՈՒՅՑ',
    contentsTitle: 'Այս հոդվածում',
    contents: [
      'Հասկանալ բեյբի-բլյուզը',
      'Ամենատարածված նշանները',
      'Ինչն է օգնում օրեցօր',
      'Բեյբի-բլյուզ, թե հետծննդյան դեպրեսիա:',
      'Երբ օգնություն խնդրել',
      'Հիմնական եզրակացություններ',
    ],
    section1Kicker: 'ՀԱՍԿԱՆԱԼ',
    section1Title: 'Ի՞նչ է բեյբի-բլյուզը:',
    section1Body1:
      'Բեյբի-բլյուզը հուզական փոփոխությունների շրջան է, որը կարող է առաջանալ ծննդաբերությունից հետո առաջին մի քանի օրվա ընթացքում: Հորմոնալ տեղաշարժերը, հոգնածությունը, քնի պակասը և այս նոր փուլին հարմարվելը կարող են նպաստել այս զգայունությանը:',
    section1Body2:
      'Սա անհաջողություն չէ և չի նշանակում, որ դուք վատ մայր եք: Յուրաքանչյուրն ապրում է հետծննդյան առաջին օրերը յուրովի:',
    statTitle: 'Տարածված փորձառություն',
    statText:
      'Բեյբի-բլյուզը տարածված է ծննդաբերությունից հետո և հակված է ինքնուրույն թեթևանալու մի քանի օրվա ընթացքում:',
    section2Kicker: 'ՆՇԱՆՆԵՐԸ',
    section2Title: 'Ինչ կարող եք զգալ',
    section2Body:
      'Մարդիկ տարբեր կերպ են ապրում սա: Ոմանք հիմնականում զգում են հոգնածություն և զգայունություն, մյուսները՝ ավելի նկատելի տրամադրության փոփոխություններ:',
    commonSigns: [
      {
        title: 'Հուզականություն',
        description: 'Ավելի հեշտ լալ կամ իրեն առանձնապես զգայուն զգալ:',
      },
      {
        title: 'Գերզգայունություն',
        description: 'Հույզերը կարող են ավելի ուժեղ թվալ և արագ փոխվել:',
      },
      {
        title: 'Տրամադրության տատանումներ',
        description:
          'Փխրունության զգացումը կարող է հերթափոխվել բարեկեցության պահերով:',
      },
      {
        title: 'Հոգնածություն',
        description: 'Առաջին օրերի հոգնածությունը կարող է ուժեղացնել հույզերը:',
      },
    ],
    section3Kicker: 'ՕՐԵՑՕՐ',
    section3Title: 'Ինչը կարող է օգնել',
    section3Body:
      'Այս շրջանում հանգստի կարիքը մեծ է: Պարզ, փոքր քայլերը կարող են օրերը դարձնել ավելի հարմարավետ:',
    dailySupport: [
      {
        title: 'Հանգստանալ',
        description: 'Օգտագործել ցանկացած ազատ պահ՝ վերականգնվելու համար:',
      },
      {
        title: 'Ընդունել օգնություն',
        description: 'Մի տատանվեք աջակցություն խնդրել ձեր շրջապատից:',
      },
      {
        title: 'Կանոնավոր խմել',
        description: 'Օրվա ընթացքում բավարար հիդրատացված մնալ:',
      },
      {
        title: 'Բավարար սնվել',
        description: 'Նախապատվություն տալ կանոնավոր, պարզ ճաշերին:',
      },
    ],
    quoteText:
      '«Հետծննդյան շրջանում օգնություն խնդրելը ձեր և ձեր երեխայի մասին հոգ տանելու եղանակ է»:',
    section4Kicker: 'ՏԱՐԲԵՐԱԿԵԼ',
    section4Title: 'Բեյբի-բլյուզ, թե հետծննդյան դեպրեսիա:',
    section4Body:
      'Բեյբի-բլյուզը սովորաբար կարճատև է և աստիճանաբար թեթևանում է: Հետծննդյան դեպրեսիան տարբեր է. այն կարող է լինել ավելի երկարատև, ավելի ուժեղ և էական ազդեցություն ունենալ առօրյա կյանքի վրա:',
    compareTitle: 'Երկու իրավիճակ, որոնք պետք է տարբերակել',
    compareBabyBluesTitle: 'Բեյբի-բլյուզ',
    compareBabyBluesText:
      'Հաճախ կարճատև է՝ հաջորդ օրերի ընթացքում աստիճանական բարելավմամբ:',
    comparePostpartumTitle: 'Հետծննդյան դեպրեսիա',
    comparePostpartumText:
      'Կարող է ավելի երկար տևել, սաստկանալ և պահանջել մասնագիտական աջակցություն:',
    section5Kicker: 'ԶԳՈՒՇ ՄՆԱԼ',
    section5Title: 'Ե՞րբ օգնություն խնդրել:',
    section5Body:
      'Կարևոր է խոսել առողջապահության մասնագետի հետ, եթե հուզական անհարմարությունը չի թեթևանում, դառնում է ավելի ուժեղ կամ սկսում է դժվարացնել առօրյա կյանքը:',
    attentionTitle: 'Նախազգուշացնող նշաններ, որոնց պետք է ուշադրություն դարձնել',
    attentionSubtitle: 'Խոսեք մասնագետի հետ, եթե…',
    attentionSigns: [
      'Ախտանիշները տևում են երկու շաբաթից ավելի:',
      'Տխրությունը կամ անհանգստությունը դառնում է ավելի ուժեղ:',
      'Դժվարանում է հոգ տանել ձեր կամ ձեր երեխայի մասին:',
      'Առաջանում է անհարմարության զգալի զգացում:',
    ],
    professionalTitle: 'Աջակցությունը հասանելի է',
    professionalText:
      'Մանկաբարձուհին, բժիշկը, հոգեբանը կամ առողջապահության այլ մասնագետը կարող է լսել, գնահատել իրավիճակը և առաջարկել համապատասխան աջակցություն:',
    tipTitle: 'Լավ է իմանալ',
    tipText:
      'Հետծննդյան հույզերը չեն չափում, թե որքան լավ մայր եք: Դուք իրավունք ունեք հանգստի կարիք ունենալու, լսված և աջակցված լինելու:',
    section6Kicker: 'ԿԱՐԵՎՈՐ ԿԵՏԵՐ',
    section6Title: 'Հիմնական եզրակացություններ',
    takeaways: [
      'Բեյբի-բլյուզը տարածված է ծննդաբերությունից հետո:',
      'Հոգնածությունը և հորմոնալ փոփոխությունները կարող են ազդել տրամադրության վրա:',
      'Շրջապատի աջակցությունը կարող է հեշտացնել այս շրջանը:',
      'Շարունակվող կամ զգալի անհարմարությունը արժանի է մասնագիտական գնահատման:',
    ],
    disclaimerText:
      'Այս հոդվածը տեղեկատվական նպատակով է և չի փոխարինում անհատականացված բժշկական խորհրդատվությանը: Կասկածի դեպքում կամ զգալի անհարմարություն զգալիս խոսեք առողջապահության մասնագետի հետ:',
    endText: 'Ձեր մասին հոգ տանելը նույնպես հետծննդյան շրջանի մաս է:',
    shareTitle: 'Բեյբի-բլյուզ և հետծննդյան հուզական առողջություն',
    shareMessage:
      'Բեյբի-բլյուզ և հետծննդյան հուզական առողջություն — AWA\n\nՈւղեցույց՝ ծննդաբերությունից հետո տարածված հուզական փոփոխությունները հասկանալու համար:',
  },
  tg: {
    badgeText: 'ДАВРАИ БАЪДИЗОӢ • САЛОМАТИИ ҲИССӢ',
    title: 'Бейби-блюз ва саломатии ҳиссии\nдавраи баъдизоӣ',
    subtitle:
      'Бифаҳмед, ки пас аз таваллуд аз ҷиҳати ҳиссӣ чӣ метавонад тағйир ёбад ва кай бояд дастгирӣ ҷӯед.',
    metaItems: ['10 дақ барои хондан', 'Мақола', 'Ибтидоӣ', 'Мазмуни баррасишуда'],
    introTitle: 'Донистан хуб аст',
    introText:
      'Пас аз таваллуд гузаштан аз давраи ҳассосияти баланди ҳиссӣ маъмул аст. Бейби-блюз одатан муваққатӣ аст, аммо ноороми идомадор ё афзуншаванда сазовори таваҷҷӯҳи мутахассис аст.',
    contentsEyebrow: 'РОҲНАМО',
    contentsTitle: 'Дар ин мақола',
    contents: [
      'Фаҳмидани бейби-блюз',
      'Маъмултарин нишонаҳо',
      'Чӣ дар ҳаёти ҳаррӯза кумак мекунад',
      'Бейби-блюз ё депрессияи баъдизоӣ?',
      'Кай кумак пурсидан лозим аст',
      'Хулосаҳои асосӣ',
    ],
    section1Kicker: 'ФАҲМИШ',
    section1Title: 'Бейби-блюз чист?',
    section1Body1:
      'Бейби-блюз давраи тағйироти ҳиссист, ки метавонад дар чанд рӯзи аввали пас аз таваллуд рух диҳад. Тағйироти гормонӣ, хастагӣ, камхобӣ ва мутобиқшавӣ ба ин марҳилаи нав метавонанд ба ин ҳассосият мусоидат кунанд.',
    section1Body2:
      'Ин шикаст нест ва маънои онро надорад, ки шумо модари бад ҳастед. Ҳар кас рӯзҳои аввали давраи баъдизоиро ба таври худ аз сар мегузаронад.',
    statTitle: 'Таҷрибаи маъмул',
    statText:
      'Бейби-блюз пас аз таваллуд маъмул аст ва одатан дар давоми чанд рӯз худ ба худ беҳтар мешавад.',
    section2Kicker: 'НИШОНАҲО',
    section2Title: 'Он чи шумо эҳсос карда метавонед',
    section2Body:
      'Таҷриба гуногун аст. Баъзеҳо асосан хастагӣ ва ҳассосиятро эҳсос мекунанд, дигарон метавонанд тағйироти намоёнтари кайфият дошта бошанд.',
    commonSigns: [
      {
        title: 'Эҳсосотӣ будан',
        description: 'Осонтар гиристан ё хеле ҳассос будан.',
      },
      {
        title: 'Ҳассосияти аз ҳад зиёд',
        description: 'Эҳсосот метавонанд қавитар шаванд ва зуд тағйир ёбанд.',
      },
      {
        title: 'Тағйирёбии кайфият',
        description:
          'Эҳсоси нозукӣ метавонад бо лаҳзаҳои ором иваз шавад.',
      },
      {
        title: 'Хастагӣ',
        description: 'Хастагии рӯзҳои аввал метавонад эҳсосотро афзун кунад.',
      },
    ],
    section3Kicker: 'ДАР ЗИНДАГИИ ҲАРРӮЗА',
    section3Title: 'Чӣ метавонад кумак кунад',
    section3Body:
      'Дар ин давра ниёз ба истироҳат калон аст. Корҳои хурди оддӣ метавонанд рӯзҳоро роҳаттар кунанд.',
    dailySupport: [
      {
        title: 'Истироҳат кардан',
        description: 'Аз ҳар лаҳзаи холӣ барои барқарор шудан истифода бурдан.',
      },
      {
        title: 'Кумакро қабул кардан',
        description: 'Аз наздикони худ дастгирӣ пурсидан шарм надоред.',
      },
      {
        title: 'Мунтазам об нӯшидан',
        description: 'Дар давоми рӯз ба қадри кофӣ об нӯшидан.',
      },
      {
        title: 'Ба қадри кофӣ хӯрдан',
        description: 'Хӯрокҳои мунтазам ва содаро афзалтар донистан.',
      },
    ],
    quoteText:
      '«Дар давраи баъдизоӣ кумак пурсидан роҳи ғамхорӣ аз худ ва тифли худ аст.»',
    section4Kicker: 'ФАРҚ КАРДАН',
    section4Title: 'Бейби-блюз ё депрессияи баъдизоӣ?',
    section4Body:
      'Бейби-блюз одатан кӯтоҳмуддат аст ва тадриҷан беҳтар мешавад. Депрессияи баъдизоӣ дигар аст: он метавонад дарозмуддаттар, шадидтар бошад ва ба ҳаёти ҳаррӯза таъсири ҷиддӣ расонад.',
    compareTitle: 'Ду ҳолат, ки бояд фарқ карда шаванд',
    compareBabyBluesTitle: 'Бейби-блюз',
    compareBabyBluesText:
      'Аксар вақт кӯтоҳмуддат аст ва дар рӯзҳои минбаъда тадриҷан беҳтар мешавад.',
    comparePostpartumTitle: 'Депрессияи баъдизоӣ',
    comparePostpartumText:
      'Метавонад дарозтар давом кунад, шадидтар шавад ва дастгирии касбиро талаб кунад.',
    section5Kicker: 'ҲУШЁР БУДАН',
    section5Title: 'Кай бояд кумак пурсид?',
    section5Body:
      'Муҳим аст, ки бо мутахассиси соҳаи тиб сӯҳбат кунед, агар ноороми ҳиссӣ беҳтар нашавад, шадидтар шавад ё ҳаёти ҳаррӯзаро мушкилтар кунад.',
    attentionTitle: 'Нишонаҳои огоҳкунанда',
    attentionSubtitle: 'Бо мутахассис сӯҳбат кунед, агар…',
    attentionSigns: [
      'Нишонаҳо зиёда аз ду ҳафта давом кунанд.',
      'Ғамгинӣ ё изтироб шадидтар шавад.',
      'Нигоҳубини худ ё тифл мушкил шавад.',
      'Эҳсоси назарраси азобу изтироб пайдо шавад.',
    ],
    professionalTitle: 'Дастгирӣ дастрас аст',
    professionalText:
      'Доя, табиб, равоншинос ё мутахассиси дигари соҳаи тиб метавонад гӯш диҳад, вазъро арзёбӣ кунад ва дастгирии мувофиқ пешниҳод намояд.',
    tipTitle: 'Донистан хуб аст',
    tipText:
      'Эҳсосоти давраи баъдизоӣ меъёри хуб будани шумо ҳамчун модар нест. Шумо ҳақ доред ба истироҳат, гӯш кардан ва дастгирӣ эҳтиёҷ дошта бошед.',
    section6Kicker: 'НУКТАҲОИ АСОСӢ',
    section6Title: 'Хулосаҳои асосӣ',
    takeaways: [
      'Бейби-блюз пас аз таваллуд маъмул аст.',
      'Хастагӣ ва тағйироти гормонӣ метавонанд ба кайфият таъсир расонанд.',
      'Дастгирии наздикон метавонад ин давраро осонтар кунад.',
      'Ноороми идомадор ё назаррас сазовори арзёбии касбӣ аст.',
    ],
    disclaimerText:
      'Ин мақола барои иттилоъ аст ва маслиҳати шахсии тиббиро иваз намекунад. Агар шубҳа дошта бошед ё ноороми ҷиддӣ эҳсос кунед, бо мутахассиси соҳаи тиб гап занед.',
    endText: 'Нигоҳубин аз худ низ қисми давраи баъдизоӣ аст.',
    shareTitle: 'Бейби-блюз ва саломатии ҳиссии давраи баъдизоӣ',
    shareMessage:
      'Бейби-блюз ва саломатии ҳиссии давраи баъдизоӣ — AWA\n\nРоҳнамо барои фаҳмидани тағйироти ҳиссие, ки пас аз таваллуд маъмул аст.',
  },
  ky: {
    badgeText: 'ТӨРӨТТӨН КИЙИН • ЭМОЦИОНАЛДЫК ДЕН СООЛУК',
    title: 'Бейби-блюз жана төрөттөн кийинки\nэмоционалдык ден соолук',
    subtitle:
      'Төрөттөн кийин эмоционалдык жактан эмне өзгөрүшү мүмкүн экенин түшүнүңүз жана колдоону качан сурап кайрылуу керектигин билиңиз.',
    metaItems: ['10 мүн окуу', 'Макала', 'Баштоочу', 'Текшерилген мазмун'],
    introTitle: 'Билүү пайдалуу',
    introText:
      'Төрөттөн кийин эмоционалдык сезгичтик жогорулаган мезгилди башынан өткөрүү кадимки көрүнүш. Бейби-блюз көбүнчө убактылуу болот, бирок улана берген же күчөгөн кысымчылык адис тарабынан көңүл бурууга татыктуу.',
    contentsEyebrow: 'КОЛДОНМО',
    contentsTitle: 'Бул макалада',
    contents: [
      'Бейби-блюзду түшүнүү',
      'Эң көп кездешкен белгилер',
      'Күнүмдүк жашоодо эмне жардам берет',
      'Бейби-блюзбу же төрөттөн кийинки депрессиябы?',
      'Жардамды качан сурап кайрылуу керек',
      'Негизги жыйынтыктар',
    ],
    section1Kicker: 'ТҮШҮНҮҮ',
    section1Title: 'Бейби-блюз деген эмне?',
    section1Body1:
      'Бейби-блюз — төрөттөн кийинки алгачкы күндөрдө пайда болушу мүмкүн болгон эмоционалдык өзгөрүүлөр мезгили. Гормондук өзгөрүүлөр, чарчоо, уйкунун жетишсиздиги жана жаңы этапка ыңгайлашуу бул сезгичтикке өбөлгө түзөт.',
    section1Body2:
      'Бул ийгиликсиздик эмес жана жаман эне экениңизди билдирбейт. Төрөттөн кийинки алгачкы күндөрдү ар бир адам өзүнчө башынан өткөрөт.',
    statTitle: 'Кеңири таралган тажрыйба',
    statText:
      'Бейби-блюз төрөттөн кийин көп кездешет жана бир нече күндүн ичинде өзүнөн өзү жакшырат.',
    section2Kicker: 'БЕЛГИЛЕР',
    section2Title: 'Эмнени сезишиңиз мүмкүн',
    section2Body:
      'Адамдардын сезими ар кандай. Кээ бирөөлөр көбүнчө чарчоону жана сезгичтикти сезет, башкалары маанайынын байкалаарлык өзгөрүшүн сезиши мүмкүн.',
    commonSigns: [
      {
        title: 'Эмоционалдуулук',
        description: 'Оңой ыйлап калуу же өзгөчө сезгич болуу.',
      },
      {
        title: 'Өтө сезгичтик',
        description: 'Эмоциялар күчтүүрөөк сезилип, тез алмашышы мүмкүн.',
      },
      {
        title: 'Маанайдын өзгөрүшү',
        description:
          'Морт болуп калган сезим жыргалчылык учурлары менен алмашып турушу мүмкүн.',
      },
      {
        title: 'Чарчоо',
        description: 'Алгачкы күндөрдөгү чарчоо эмоцияларды күчөтүшү мүмкүн.',
      },
    ],
    section3Kicker: 'КҮНҮМДҮК ЖАШОО',
    section3Title: 'Эмне жардам бериши мүмкүн',
    section3Body:
      'Бул мезгилде эс алууга болгон муктаждык чоң. Кичинекей, жөнөкөй нерселер күндөрдү ыңгайлуураак кылышы мүмкүн.',
    dailySupport: [
      {
        title: 'Эс алуу',
        description: 'Калыбына келүү үчүн ар бир бош мүнөттү пайдалануу.',
      },
      {
        title: 'Жардамды кабыл алуу',
        description: 'Жакындарыңыздан колдоо сурап кайрылуудан тартынбаңыз.',
      },
      {
        title: 'Үзгүлтүксүз суу ичүү',
        description: 'Күн бою организмде жетиштүү суюктукту сактоо.',
      },
      {
        title: 'Жетиштүү тамактануу',
        description: 'Үзгүлтүксүз, жөнөкөй тамактарга артыкчылык берүү.',
      },
    ],
    quoteText:
      '«Төрөттөн кийин жардам сурап кайрылуу — өзүңүзгө жана ымыркайыңызга кам көрүүнүн бир жолу.»',
    section4Kicker: 'АЙЫРМАЛОО',
    section4Title: 'Бейби-блюзбу же төрөттөн кийинки депрессиябы?',
    section4Body:
      'Бейби-блюз көбүнчө кыска мөөнөттүү болот жана акырындап жакшырат. Төрөттөн кийинки депрессия башкача: ал узакка созулушу, күчтүүрөөк болушу жана күнүмдүк жашоого олуттуу таасир этиши мүмкүн.',
    compareTitle: 'Айырмалоого тийиш болгон эки абал',
    compareBabyBluesTitle: 'Бейби-блюз',
    compareBabyBluesText:
      'Көбүнчө кыска мөөнөттүү, кийинки күндөрдө акырындап жакшырат.',
    comparePostpartumTitle: 'Төрөттөн кийинки депрессия',
    comparePostpartumText:
      'Көбүрөөк созулушу, күчөшү жана адистин колдоосун талап кылышы мүмкүн.',
    section5Kicker: 'САКТЫК',
    section5Title: 'Жардамды качан сурап кайрылуу керек?',
    section5Body:
      'Эмоционалдык кысымчылык жакшырбаса, күчөсө же күнүмдүк жашоону кыйындата баштаса, ден соолук сактоо адиси менен сүйлөшүү маанилүү.',
    attentionTitle: 'Көңүл бура турган эскертүү белгилери',
    attentionSubtitle: 'Адис менен сүйлөшүңүз, эгер…',
    attentionSigns: [
      'Белгилер эки жумадан ашык созулса.',
      'Кайгы же тынчсыздануу күчөсө.',
      'Өзүңүзгө же ымыркайыңызга кам көрүү кыйындап калса.',
      'Олуттуу кысымчылык сезими пайда болсо.',
    ],
    professionalTitle: 'Колдоо бар',
    professionalText:
      'Акушерка, дарыгер, психолог же башка ден соолук сактоо адиси сизди угуп, абалды баалап, ылайыктуу колдоо сунуштай алат.',
    tipTitle: 'Билүү пайдалуу',
    tipText:
      'Төрөттөн кийинки эмоциялар сиздин канчалык жакшы эне экениңиздин өлчөмү эмес. Эс алууга муктаж болууга, угулууга жана колдоого ээ болууга укугуңуз бар.',
    section6Kicker: 'НЕГИЗГИ ЧЕКИТТЕР',
    section6Title: 'Негизги жыйынтыктар',
    takeaways: [
      'Бейби-блюз төрөттөн кийин көп кездешет.',
      'Чарчоо жана гормондук өзгөрүүлөр маанайга таасир этиши мүмкүн.',
      'Жакындарыңыздын колдоосу бул мезгилди жеңилдетиши мүмкүн.',
      'Улана берген же олуттуу кысымчылык адис тарабынан баалоого татыктуу.',
    ],
    disclaimerText:
      'Бул макала маалымат максатында жазылган жана жекелештирилген медициналык кеңешти алмаштырбайт. Күмөн болсо же олуттуу кысымчылык сезсеңиз, ден соолук сактоо адиси менен сүйлөшүңүз.',
    endText: 'Өзүңүзгө кам көрүү да төрөттөн кийинки мезгилдин бир бөлүгү.',
    shareTitle: 'Бейби-блюз жана төрөттөн кийинки эмоционалдык ден соолук',
    shareMessage:
      'Бейби-блюз жана төрөттөн кийинки эмоционалдык ден соолук — AWA\n\nТөрөттөн кийин кеңири таралган эмоционалдык өзгөрүүлөрдү түшүнүүгө арналган колдонмо.',
  },
  tk: {
    badgeText: 'DOGRANDAN SOŇ • DUÝGUSAL SAGLYK',
    title: 'Bäbek blýuzy we dograndan soňky\nduýgusal saglyk',
    subtitle:
      'Dograndan soň duýgusal taýdan nämäniň üýtgäp biljekdigini düşünmek we goldawy haçan soramalydygyny bilmek.',
    metaItems: ['10 min okamak', 'Makala', 'Başlaýjy', 'Barlanan mazmun'],
    introTitle: 'Bilmek peýdaly',
    introText:
      'Dograndan soň duýgusal duýgurlygyň ýokarlanan döwrüni başdan geçirmek adaty zat. Bäbek blýuzy köplenç wagtlaýyn bolýar, ýöne dowam edýän ýa-da güýçlenýän kynçylyk hünärmen tarapyndan üns bermäge mynasyp.',
    contentsEyebrow: 'GOLLANMA',
    contentsTitle: 'Bu makalada',
    contents: [
      'Bäbek blýuzyny düşünmek',
      'Iň köp duş gelýän alamatlar',
      'Gündelik durmuşda näme kömek edýär',
      'Bäbek blýuzy ýa-da dograndan soňky depressiýa?',
      'Kömegi haçan soramaly',
      'Esasy netijeler',
    ],
    section1Kicker: 'DÜŞÜNMEK',
    section1Title: 'Bäbek blýuzy näme?',
    section1Body1:
      'Bäbek blýuzy — dograndan soňky ilkinji günlerde ýüze çykyp biljek duýgusal üýtgeşmeler döwri. Gormon üýtgeşmeleri, ýadawlyk, uky ýetmezçiligi we täze tapgyra uýgunlaşmak bu duýgurlyga goşant goşýar.',
    section1Body2:
      'Bu şowsuzlyk däl we erbet ene bolandygyňyzy aňlatmaýar. Dograndan soňky ilkinji günleri her kim aýratyn başdan geçirýär.',
    statTitle: 'Giňden ýaýran tejribe',
    statText:
      'Bäbek blýuzy dograndan soň köp duş gelýär we birnäçe günüň içinde özi gowulaşýar.',
    section2Kicker: 'ALAMATLAR',
    section2Title: 'Nämeleri duýup bilersiňiz',
    section2Body:
      'Adamlaryň duýgulary dürli. Käbirleri esasan ýadawlygy we duýgurlygy duýýar, beýlekileri keýbiniň has aýdyň üýtgeýşini duýup biler.',
    commonSigns: [
      {
        title: 'Duýgurlyk',
        description: 'Aňsat aglamak ýa-da aýratyn duýgur bolmak.',
      },
      {
        title: 'Aşa duýgurlyk',
        description: 'Duýgular güýçli duýlup, çalt çalşyp biler.',
      },
      {
        title: 'Keýbiň üýtgemegi',
        description:
          'Ejiz duýgy abadanlyk pursatlary bilen çalşyp durup biler.',
      },
      {
        title: 'Ýadawlyk',
        description: 'Ilkinji günlerdäki ýadawlyk duýgulary güýçlendirip biler.',
      },
    ],
    section3Kicker: 'GÜNDELIK DURMUŞ',
    section3Title: 'Näme kömek edip biler',
    section3Body:
      'Bu döwürde dynça bolan zerurlyk uly. Kiçijik, ýönekeý zatlar günleri has rahat edip biler.',
    dailySupport: [
      {
        title: 'Dynç almak',
        description: 'Dikelmek üçin her boş pursatdan peýdalanmak.',
      },
      {
        title: 'Kömegi kabul etmek',
        description: 'Ýakynlaryňyzdan goldaw soramakdan çekinmäň.',
      },
      {
        title: 'Yzygiderli suw içmek',
        description: 'Gün boýy bedeniňizde ýeterlik suwy saklamak.',
      },
      {
        title: 'Ýeterlik iýmek',
        description: 'Yzygiderli, ýönekeý tagamlara artykmaçlyk bermek.',
      },
    ],
    quoteText:
      '«Dograndan soň kömek soramak — özüňize we bäbegiňize ideg etmegiň bir ýoly.»',
    section4Kicker: 'TAPAWUTLANDYRMAK',
    section4Title: 'Bäbek blýuzy ýa-da dograndan soňky depressiýa?',
    section4Body:
      'Bäbek blýuzy köplenç gysga bolýar we ýuwaş-ýuwaşdan gowulaşýar. Dograndan soňky depressiýa başga: ol has dowamly, has güýçli bolup, gündelik durmuşa möhüm täsir edip biler.',
    compareTitle: 'Tapawutlandyrmaly iki ýagdaý',
    compareBabyBluesTitle: 'Bäbek blýuzy',
    compareBabyBluesText:
      'Köplenç gysga, indiki günlerde ýuwaş-ýuwaşdan gowulaşýar.',
    comparePostpartumTitle: 'Dograndan soňky depressiýa',
    comparePostpartumText:
      'Has uzaga çozup, güýçlenip we hünärmeniň goldawyny talap edip biler.',
    section5Kicker: 'AGALYK',
    section5Title: 'Kömegi haçan soramaly?',
    section5Body:
      'Duýgusal kynçylyk gowulaşmasa, güýçlense ýa-da gündelik durmuşy kynlaşdyryp başlasa, saglyk hünärmeni bilen gürleşmek möhüm.',
    attentionTitle: 'Üns bermeli duýduryş alamatlary',
    attentionSubtitle: 'Hünärmen bilen gürleşiň, eger…',
    attentionSigns: [
      'Alamatlar iki hepdeden köp dowam etse.',
      'Gam ýa-da biynjalyklyk güýçlense.',
      'Özüňize ýa-da bäbegiňize ideg etmek kynlaşsa.',
      'Möhüm kynçylyk duýgusy peýda bolsa.',
    ],
    professionalTitle: 'Goldaw bar',
    professionalText:
      'Akuşerka, lukman, psiholog ýa-da başga saglyk hünärmeni sizi diňläp, ýagdaýy baha berip, laýyk goldaw teklip edip biler.',
    tipTitle: 'Bilmek peýdaly',
    tipText:
      'Dograndan soňky duýgular siziň nähili gowy ene bolandygyňyzyň ölçegi däl. Dynç almaga zerur bolmaga, diňlenmäge we goldaw almaga hukugyňyz bar.',
    section6Kicker: 'ESASY NOKATLAR',
    section6Title: 'Esasy netijeler',
    takeaways: [
      'Bäbek blýuzy dograndan soň köp duş gelýär.',
      'Ýadawlyk we gormon üýtgeşmeleri keýbe täsir edip biler.',
      'Ýakynlaryňyzyň goldawy bu döwri ýeňilleşdirip biler.',
      'Dowam edýän ýa-da möhüm kynçylyk hünärmen tarapyndan baha bermäge mynasyp.',
    ],
    disclaimerText:
      'Bu makala maglumat maksadynda ýazyldy we şahsylaşdyrylan lukmançylyk maslahatyny çalyşmaýar. Şübhe bolsa ýa-da möhüm kynçylyk duýsaňyz, saglyk hünärmeni bilen gürleşiň.',
    endText: 'Özüňize ideg etmek hem dograndan soňky döwrüň bir bölegi.',
    shareTitle: 'Bäbek blýuzy we dograndan soňky duýgusal saglyk',
    shareMessage:
      'Bäbek blýuzy we dograndan soňky duýgusal saglyk — AWA\n\nDograndan soň giňden ýaýran duýgusal üýtgeşmeleri düşünmäge niýetlenen gollanma.',
  },
  ms: {
    badgeText: 'SELEPAS BERSALIN • KESIHATAN EMOSI',
    title: 'Baby blues dan kesihatan emosi\nselepas bersalin',
    subtitle:
      'Memahami apa yang boleh berubah secara emosi selepas bersalin dan mengetahui bila untuk mendapatkan sokongan.',
    metaItems: ['10 min bacaan', 'Artikel', 'Permulaan', 'Kandungan disemak'],
    introTitle: 'Elok diketahui',
    introText:
      'Selepas bersalin, adalah lazim untuk melalui tempoh kepekaan emosi yang meningkat. Baby blues biasanya bersifat sementara, tetapi kesusahan yang berterusan atau bertambah teruk memerlukan perhatian profesional.',
    contentsEyebrow: 'PANDUAN',
    contentsTitle: 'Dalam artikel ini',
    contents: [
      'Memahami baby blues',
      'Tanda yang paling lazim',
      'Apa yang membantu dari hari ke hari',
      'Baby blues atau kemurungan selepas bersalin?',
      'Bila untuk meminta bantuan',
      'Perkara penting untuk diingat',
    ],
    section1Kicker: 'MEMAHAMI',
    section1Title: 'Apakah baby blues?',
    section1Body1:
      'Baby blues ialah tempoh perubahan emosi yang boleh berlaku dalam beberapa hari pertama selepas bersalin. Perubahan hormon, keletihan, kurang tidur dan menyesuaikan diri dengan peringkat baharu ini semuanya boleh menyumbang kepada kepekaan ini.',
    section1Body2:
      'Ini bukan satu kegagalan dan ia tidak bermakna anda ibu yang tidak baik. Setiap orang melalui hari-hari pertama selepas bersalin dengan cara masing-masing.',
    statTitle: 'Pengalaman yang lazim',
    statText:
      'Baby blues adalah lazim selepas bersalin dan cenderung pulih sendiri dalam beberapa hari.',
    section2Kicker: 'TANDA-TANDA',
    section2Title: 'Apa yang mungkin anda rasa',
    section2Body:
      'Apa yang dialami berbeza-beza. Sesetengah orang terutamanya berasa letih dan sensitif, manakala yang lain mungkin mengalami perubahan emosi yang lebih ketara.',
    commonSigns: [
      {
        title: 'Mudah beremosi',
        description: 'Lebih mudah menangis atau berasa sangat sensitif.',
      },
      {
        title: 'Terlalu peka',
        description: 'Emosi boleh terasa lebih kuat dan berubah dengan cepat.',
      },
      {
        title: 'Emosi berubah-ubah',
        description:
          'Rasa rapuh boleh berselang-seli dengan saat-saat berasa sejahtera.',
      },
      {
        title: 'Keletihan',
        description: 'Keletihan pada hari-hari pertama boleh menguatkan emosi.',
      },
    ],
    section3Kicker: 'DARI HARI KE HARI',
    section3Title: 'Apa yang boleh membantu',
    section3Body:
      'Dalam tempoh ini, keperluan untuk berehat adalah besar. Perkara kecil dan mudah boleh menjadikan hari-hari lebih selesa.',
    dailySupport: [
      {
        title: 'Berehat',
        description: 'Menggunakan setiap detik terluang untuk memulihkan tenaga.',
      },
      {
        title: 'Menerima bantuan',
        description: 'Jangan teragak-agak meminta sokongan daripada orang di sekeliling anda.',
      },
      {
        title: 'Minum secara tetap',
        description: 'Kekal terhidrat secukupnya sepanjang hari.',
      },
      {
        title: 'Makan secukupnya',
        description: 'Utamakan hidangan yang tetap dan ringkas.',
      },
    ],
    quoteText:
      '“Meminta bantuan semasa selepas bersalin ialah satu cara menjaga diri anda dan bayi anda.”',
    section4Kicker: 'MEMBEZAKANNYA',
    section4Title: 'Baby blues atau kemurungan selepas bersalin?',
    section4Body:
      'Baby blues biasanya singkat dan beransur pulih. Kemurungan selepas bersalin berbeza: ia boleh lebih berpanjangan, lebih kuat dan memberi kesan besar kepada kehidupan seharian.',
    compareTitle: 'Dua keadaan yang perlu dibezakan',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Selalunya singkat, dengan pemulihan beransur-ansur dalam hari-hari berikutnya.',
    comparePostpartumTitle: 'Kemurungan selepas bersalin',
    comparePostpartumText:
      'Boleh berlarutan lebih lama, bertambah kuat dan memerlukan sokongan profesional.',
    section5Kicker: 'KEKAL BERWASPADA',
    section5Title: 'Bila untuk meminta bantuan?',
    section5Body:
      'Adalah penting untuk berbincang dengan pengamal penjagaan kesihatan jika kesusahan emosi tidak pulih, menjadi lebih kuat atau mula menyukarkan kehidupan seharian.',
    attentionTitle: 'Tanda amaran yang perlu diperhatikan',
    attentionSubtitle: 'Berbincanglah dengan pengamal profesional jika…',
    attentionSigns: [
      'Simptom berlarutan lebih daripada dua minggu.',
      'Kesedihan atau keresahan menjadi lebih kuat.',
      'Menjadi sukar untuk menjaga diri anda atau bayi anda.',
      'Muncul rasa tertekan yang ketara.',
    ],
    professionalTitle: 'Sokongan tersedia',
    professionalText:
      'Bidan, doktor, ahli psikologi atau pengamal penjagaan kesihatan lain boleh mendengar, menilai keadaan dan menawarkan sokongan yang sesuai.',
    tipTitle: 'Elok diketahui',
    tipText:
      'Emosi selepas bersalin bukan ukuran betapa baiknya anda sebagai ibu. Anda berhak memerlukan rehat, didengari dan disokong.',
    section6Kicker: 'PERKARA UTAMA',
    section6Title: 'Perkara penting untuk diingat',
    takeaways: [
      'Baby blues adalah lazim selepas bersalin.',
      'Keletihan dan perubahan hormon boleh menjejaskan emosi.',
      'Sokongan daripada orang di sekeliling anda boleh memudahkan tempoh ini.',
      'Kesusahan yang berterusan atau ketara memerlukan penilaian profesional.',
    ],
    disclaimerText:
      'Artikel ini bertujuan memberi maklumat dan tidak menggantikan nasihat perubatan yang diperibadikan. Jika ragu-ragu atau mengalami kesusahan yang ketara, berbincanglah dengan pengamal penjagaan kesihatan.',
    endText: 'Menjaga diri sendiri juga sebahagian daripada tempoh selepas bersalin.',
    shareTitle: 'Baby blues dan kesihatan emosi selepas bersalin',
    shareMessage:
      'Baby blues dan kesihatan emosi selepas bersalin — AWA\n\nPanduan untuk memahami perubahan emosi yang lazim selepas bersalin.',
  },
  so: {
    badgeText: 'DHALMADA KA DIB • CAAFIMAADKA DAREENKA',
    title: 'Baby blues iyo caafimaadka dareenka\ndhalmada ka dib',
    subtitle:
      'Fahamka waxa dareenka ahaan isbeddeli kara dhalmada ka dib iyo ogaanshaha goorta taageero la raadsado.',
    metaItems: ['10 daq akhris', 'Maqaal', 'Bilow', 'Macluumaad la dib-u-eegay'],
    introTitle: 'Waxtar leh in la ogaado',
    introText:
      'Dhalmada ka dib, waa caadi in la maro muddo dareen-xanaaq oo kordhay. Baby blues inta badan waa ku meel gaar, laakiin walaac sii socda ama sii xoogaysta wuxuu mudan yahay feejignaan xirfadle.',
    contentsEyebrow: 'HAGE',
    contentsTitle: 'Maqaalkan dhexdiisa',
    contents: [
      'Fahamka baby blues',
      'Calaamadaha ugu badan',
      'Waxa caawiya maalin kasta',
      'Baby blues mise niyad-jab dhalmada ka dib?',
      'Goorta caawimaad la weydiisto',
      'Qodobbada muhiimka ah',
    ],
    section1Kicker: 'FAHAM',
    section1Title: 'Waa maxay baby blues?',
    section1Body1:
      'Baby blues waa muddo isbeddello dareen ah oo dhici kara maalmaha ugu horreeya ee dhalmada ka dib. Isbeddelada hormoonka, daal, hurdo la’aan, iyo la qabsiga heerkan cusub dhammaantood waxay gacan ka geysan karaan dareen-xanaaqan.',
    section1Body2:
      'Tani ma aha guuldarro, macnaheeduna maaha inaad tahay hooyo xun. Qof walba wuxuu maalmaha ugu horreeya ee dhalmada ka dib ku maraa si u gaar ah.',
    statTitle: 'Khibrad caadi ah',
    statText:
      'Baby blues waa caadi dhalmada ka dib wuxuuna u badan yahay inuu iskiis u hagaajiyo dhowr maalmood gudahood.',
    section2Kicker: 'CALAAMADAHA',
    section2Title: 'Waxa aad dareemi kartid',
    section2Body:
      'Waxa dadku dareemaan way kala duwan yihiin. Qaarkood waxay inta badan dareemaan daal iyo dareen-xanaaq, kuwo kale na waxay yeelan karaan isbeddello niyadeed oo muuqda.',
    commonSigns: [
      {
        title: 'Dareen-badnaan',
        description: 'Ooyid si fudud ama dareen-xanaaq gaar ah.',
      },
      {
        title: 'Dareen-xanaaq xad dhaaf ah',
        description: 'Dareennadu way xoogaysan karaan oo si degdeg ah ayay isu beddelaan.',
      },
      {
        title: 'Isbeddelka niyadda',
        description:
          'Dareen jilicsanaan ayaa ku beddelan kara wakhtiyo fayoobaan.',
      },
      {
        title: 'Daal',
        description: 'Daalka maalmaha hore wuxuu kordhin karaa dareennada.',
      },
    ],
    section3Kicker: 'MAALIN KASTA',
    section3Title: 'Waxa caawin kara',
    section3Body:
      'Muddadan, baahida nasashadu waa weyn tahay. Waxyaabo yaryar oo fudud ayaa maalmaha ka dhigi kara kuwo raaxo badan.',
    dailySupport: [
      {
        title: 'Nasasho',
        description: 'Ka faa’iidayso wakhti kasta oo madhan si aad u bogsato.',
      },
      {
        title: 'Aqbalidda caawimaad',
        description: 'Ha ka waaban inaad weydiisato taageero dadka kuu dhow.',
      },
      {
        title: 'Cabbid joogto ah',
        description: 'Biyo ku filan cab maalinta oo dhan.',
      },
      {
        title: 'Cunto ku filan',
        description: 'Door bid cunto joogto ah oo fudud.',
      },
    ],
    quoteText:
      '“Weydiisashada caawimaad dhalmada ka dib waa hab aad naftaada iyo ilmahaaga ku daryeesho.”',
    section4Kicker: 'KALA SAARIDDA',
    section4Title: 'Baby blues mise niyad-jab dhalmada ka dib?',
    section4Body:
      'Baby blues inta badan waa gaaban oo tartiib ayuu u hagaagaa. Niyad-jabka dhalmada ka dib way ka duwan yahay: wuu sii socon karaa, xoog badnaan karaa, wuxuuna saameyn weyn ku yeelan karaa nolol-maalmeedka.',
    compareTitle: 'Laba xaaladood oo la kala saaro',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Inta badan waa gaaban, oo tartiib ayuu u hagaagaa maalmaha xiga.',
    comparePostpartumTitle: 'Niyad-jab dhalmada ka dib',
    comparePostpartumText:
      'Wuu sii socon karaa, xoog badnaan karaa, wuxuuna u baahan karaa taageero xirfadle.',
    section5Kicker: 'FEEJIGNAAN',
    section5Title: 'Goorma caawimaad la weydiistaa?',
    section5Body:
      'Waa muhiim in lala hadlo xirfadle caafimaad haddii dhibka dareenku aanu hagaagin, uu xoogaysto, ama uu bilaabo inuu nolol-maalmeedka adkeeyo.',
    attentionTitle: 'Calaamadaha digniinta ee la eego',
    attentionSubtitle: 'La hadal xirfadle haddii…',
    attentionSigns: [
      'Astaamuhu ka badan yihiin laba toddobaad.',
      'Murugada ama walaaca ayaa xoogaysta.',
      'Waxay adkaataa inaad naftaada ama ilmahaaga daryeesho.',
      'Dareen dhib weyn ayaa soo baxa.',
    ],
    professionalTitle: 'Taageero way jirtaa',
    professionalText:
      'Umulisada, dhakhtarka, saykolajiga, ama xirfadle kale oo caafimaad ayaa dhegeysan kara, qiimeyn kara xaaladda, oo bixin kara taageero ku habboon.',
    tipTitle: 'Waxtar leh in la ogaado',
    tipText:
      'Dareennada dhalmada ka dib ma aha cabbir ku saabsan sida hooyo fiican aad tahay. Waxaad xaq u leedahay inaad u baahato nasasho, in lagu dhegeysto, iyo in lagu taageero.',
    section6Kicker: 'QODOBBO MUHIIM AH',
    section6Title: 'Qodobbada muhiimka ah',
    takeaways: [
      'Baby blues waa caadi dhalmada ka dib.',
      'Daalka iyo isbeddelada hormoonku waxay saameyn karaan niyadda.',
      'Taageerada dadka kuu dhow waxay fududayn kartaa muddadan.',
      'Dhibka sii socda ama weyn wuxuu mudan yahay qiimeyn xirfadle.',
    ],
    disclaimerText:
      'Maqaalkan waa macluumaad oo keliya mana bedelo talo caafimaad oo shakhsi ah. Haddii aad shaki qabto ama aad dareento dhib weyn, la hadal xirfadle caafimaad.',
    endText: 'Naftaada daryeelkeedu sidoo kale wuxuu qayb ka yahay dhalmada ka dib.',
    shareTitle: 'Baby blues iyo caafimaadka dareenka dhalmada ka dib',
    shareMessage:
      'Baby blues iyo caafimaadka dareenka dhalmada ka dib — AWA\n\nHage lagu fahmo isbeddelada dareenka ee caadiga ah dhalmada ka dib.',
  },
  sw: {
    badgeText: 'BAADA YA KUJIFUNGUA • AFYA YA HISIA',
    title: 'Baby blues na afya ya hisia\nbaada ya kujifungua',
    subtitle:
      'Kuelewa kinachoweza kubadilika kihisia baada ya kujifungua na kujua wakati wa kutafuta msaada.',
    metaItems: ['Dakika 10 za kusoma', 'Makala', 'Mwanzo', 'Maudhui yaliyokaguliwa'],
    introTitle: 'Vyema kujua',
    introText:
      'Baada ya kujifungua, ni kawaida kupitia kipindi cha hisia kali zaidi. Baby blues kwa kawaida ni ya muda mfupi, lakini dhiki inayoendelea au kuongezeka inastahili uangalizi wa kitaalamu.',
    contentsEyebrow: 'MWONGOZO',
    contentsTitle: 'Katika makala hii',
    contents: [
      'Kuelewa baby blues',
      'Dalili za kawaida zaidi',
      'Kinachosaidia kila siku',
      'Baby blues au msongo wa mawazo baada ya kujifungua?',
      'Wakati wa kuomba msaada',
      'Mambo muhimu ya kukumbuka',
    ],
    section1Kicker: 'KUELEWA',
    section1Title: 'Baby blues ni nini?',
    section1Body1:
      'Baby blues ni kipindi cha mabadiliko ya hisia kinachoweza kutokea katika siku chache za kwanza baada ya kujifungua. Mabadiliko ya homoni, uchovu, ukosefu wa usingizi, na kuzoea hatua hii mpya vyote vinaweza kuchangia hali hii ya kuwa na hisia kali.',
    section1Body2:
      'Hii si kushindwa na haimaanishi wewe ni mama mbaya. Kila mtu hupitia siku za kwanza baada ya kujifungua kwa njia yake mwenyewe.',
    statTitle: 'Uzoefu wa kawaida',
    statText:
      'Baby blues ni ya kawaida baada ya kujifungua na huelekea kuimarika yenyewe ndani ya siku chache.',
    section2Kicker: 'DALILI',
    section2Title: 'Unachoweza kuhisi',
    section2Body:
      'Wanachopitia watu hutofautiana. Wengine huhisi hasa uchovu na unyeti, huku wengine wakiwa na mabadiliko ya hali ya moyo yanayoonekana zaidi.',
    commonSigns: [
      {
        title: 'Hisia kali',
        description: 'Kulia kwa urahisi zaidi au kuhisi unyeti wa kipekee.',
      },
      {
        title: 'Unyeti uliopitiliza',
        description: 'Hisia zinaweza kuhisiwa kuwa kali zaidi na kubadilika haraka.',
      },
      {
        title: 'Mabadiliko ya hali ya moyo',
        description:
          'Hisia ya udhaifu inaweza kubadilishana na nyakati za ustawi.',
      },
      {
        title: 'Uchovu',
        description: 'Uchovu wa siku za kwanza unaweza kukuza hisia.',
      },
    ],
    section3Kicker: 'KILA SIKU',
    section3Title: 'Kinachoweza kusaidia',
    section3Body:
      'Katika kipindi hiki, hitaji la kupumzika ni kubwa. Mambo madogo na rahisi yanaweza kufanya siku ziwe za faraja zaidi.',
    dailySupport: [
      {
        title: 'Kupumzika',
        description: 'Kutumia kila wakati wa ziada kupata nafuu.',
      },
      {
        title: 'Kukubali msaada',
        description: 'Usisite kuomba msaada kutoka kwa wanaokuzunguka.',
      },
      {
        title: 'Kunywa mara kwa mara',
        description: 'Kubaki na maji ya kutosha mwilini siku nzima.',
      },
      {
        title: 'Kula vya kutosha',
        description: 'Kupendelea milo ya mara kwa mara na rahisi.',
      },
    ],
    quoteText:
      '“Kuomba msaada baada ya kujifungua ni njia ya kujijali wewe na mtoto wako.”',
    section4Kicker: 'KUTOFAUTISHA',
    section4Title: 'Baby blues au msongo wa mawazo baada ya kujifungua?',
    section4Body:
      'Baby blues kwa kawaida ni ya muda mfupi na huimarika polepole. Msongo wa mawazo baada ya kujifungua ni tofauti: unaweza kudumu zaidi, kuwa mkali zaidi, na kuwa na athari kubwa kwa maisha ya kila siku.',
    compareTitle: 'Hali mbili za kutofautisha',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Mara nyingi ni fupi, na huimarika polepole katika siku zinazofuata.',
    comparePostpartumTitle: 'Msongo wa mawazo baada ya kujifungua',
    comparePostpartumText:
      'Unaweza kudumu zaidi, kuongezeka, na kuhitaji msaada wa kitaalamu.',
    section5Kicker: 'KUWA MAKINI',
    section5Title: 'Wakati wa kuomba msaada?',
    section5Body:
      'Ni muhimu kuzungumza na mtaalamu wa afya ikiwa dhiki ya hisia haiimarishi, inakuwa kali zaidi, au inaanza kufanya maisha ya kila siku kuwa magumu zaidi.',
    attentionTitle: 'Dalili za tahadhari za kuzingatia',
    attentionSubtitle: 'Zungumza na mtaalamu ikiwa…',
    attentionSigns: [
      'Dalili zinadumu zaidi ya wiki mbili.',
      'Huzuni au wasiwasi unaongezeka.',
      'Inakuwa vigumu kujijali wewe au mtoto wako.',
      'Hisia kubwa ya dhiki inaonekana.',
    ],
    professionalTitle: 'Msaada unapatikana',
    professionalText:
      'Mkunga, daktari, mwanasaikolojia, au mtaalamu mwingine wa afya anaweza kusikiliza, kutathmini hali, na kutoa msaada unaofaa.',
    tipTitle: 'Vyema kujua',
    tipText:
      'Hisia za baada ya kujifungua si kipimo cha jinsi ulivyo mama mzuri. Una haki ya kuhitaji kupumzika, kusikilizwa, na kusaidiwa.',
    section6Kicker: 'MAMBO MUHIMU',
    section6Title: 'Mambo muhimu ya kukumbuka',
    takeaways: [
      'Baby blues ni ya kawaida baada ya kujifungua.',
      'Uchovu na mabadiliko ya homoni vinaweza kuathiri hali ya moyo.',
      'Msaada kutoka kwa wanaokuzunguka unaweza kurahisisha kipindi hiki.',
      'Dhiki inayoendelea au kubwa inastahili tathmini ya kitaalamu.',
    ],
    disclaimerText:
      'Makala hii ni kwa madhumuni ya taarifa na haichukui nafasi ya ushauri wa kitabibu uliobinafsishwa. Ukiwa na shaka au unapitia dhiki kubwa, zungumza na mtaalamu wa afya.',
    endText: 'Kujijali pia ni sehemu ya kipindi cha baada ya kujifungua.',
    shareTitle: 'Baby blues na afya ya hisia baada ya kujifungua',
    shareMessage:
      'Baby blues na afya ya hisia baada ya kujifungua — AWA\n\nMwongozo wa kuelewa mabadiliko ya hisia ambayo ni ya kawaida baada ya kujifungua.',
  },
  kk: {
    badgeText: 'БОСАНҒАННАН КЕЙІН • ЭМОЦИЯЛЫҚ ДЕНСАУЛЫҚ',
    title: 'Бэби-блюз және босанғаннан кейінгі\nэмоциялық денсаулық',
    subtitle:
      'Босанғаннан кейін эмоциялық тұрғыда не өзгеруі мүмкін екенін түсіну және қолдауды қашан іздеу керектігін білу.',
    metaItems: ['10 мин оқу', 'Мақала', 'Бастауыш', 'Тексерілген мазмұн'],
    introTitle: 'Білуге тиісті',
    introText:
      'Босанғаннан кейін эмоциялық сезімталдықтың артқан кезеңін бастан өткеру қалыпты жағдай. Бэби-блюз әдетте уақытша болады, бірақ жалғасатын немесе күшейетін күйзеліс кәсіби назарға тұрарлық.',
    contentsEyebrow: 'НҰСҚАУЛЫҚ',
    contentsTitle: 'Осы мақалада',
    contents: [
      'Бэби-блюзді түсіну',
      'Ең жиі кездесетін белгілер',
      'Күнделікті не көмектеседі',
      'Бэби-блюз бе, әлде босанғаннан кейінгі депрессия ма?',
      'Көмекті қашан сұрау керек',
      'Негізгі қорытындылар',
    ],
    section1Kicker: 'ТҮСІНУ',
    section1Title: 'Бэби-блюз дегеніміз не?',
    section1Body1:
      'Бэби-блюз — босанғаннан кейінгі алғашқы күндерде болуы мүмкін эмоциялық өзгерістер кезеңі. Гормондардың өзгеруі, шаршау, ұйқының жетіспеуі және осы жаңа кезеңге бейімделу осы сезімталдыққа ықпал етуі мүмкін.',
    section1Body2:
      'Бұл сәтсіздік емес және сіздің жаман ана екеніңізді білдірмейді. Әркім босанғаннан кейінгі алғашқы күндерді өзінше бастан өткереді.',
    statTitle: 'Жиі кездесетін жағдай',
    statText:
      'Бэби-блюз босанғаннан кейін жиі кездеседі және әдетте бірнеше күн ішінде өздігінен жақсарады.',
    section2Kicker: 'БЕЛГІЛЕР',
    section2Title: 'Нені сезінуіңіз мүмкін',
    section2Body:
      'Адамдар сезінетін нәрсе әртүрлі. Кейбіреулері негізінен шаршау мен сезімталдықты сезінеді, ал басқаларында көңіл-күйдің өзгеруі анығырақ болуы мүмкін.',
    commonSigns: [
      {
        title: 'Эмоционалдылық',
        description: 'Оңай жылап жіберу немесе ерекше сезімтал болу.',
      },
      {
        title: 'Шамадан тыс сезімталдық',
        description: 'Эмоциялар күштірек сезілуі және тез ауысуы мүмкін.',
      },
      {
        title: 'Көңіл-күйдің ауытқуы',
        description:
          'Нәзіктік сезімі әл-ауқат сәттерімен кезектесуі мүмкін.',
      },
      {
        title: 'Шаршау',
        description: 'Алғашқы күндердегі шаршау эмоцияларды күшейтуі мүмкін.',
      },
    ],
    section3Kicker: 'КҮНДЕЛІКТІ',
    section3Title: 'Не көмектесе алады',
    section3Body:
      'Бұл кезеңде демалысқа деген қажеттілік жоғары. Кішкентай, қарапайым нәрселер күндерді жайлырақ ете алады.',
    dailySupport: [
      {
        title: 'Демалу',
        description: 'Қалпына келу үшін әрбір бос сәтті пайдалану.',
      },
      {
        title: 'Көмекті қабылдау',
        description: 'Айналаңыздағылардан қолдау сұраудан тартынбаңыз.',
      },
      {
        title: 'Үнемі су ішу',
        description: 'Күні бойы жеткілікті су ішіп отыру.',
      },
      {
        title: 'Жеткілікті тамақтану',
        description: 'Тұрақты, қарапайым тамақты жөн көру.',
      },
    ],
    quoteText:
      '“Босанғаннан кейін көмек сұрау — өзіңізге де, нәрестеңізге де қамқор болудың бір жолы.”',
    section4Kicker: 'АЖЫРАТУ',
    section4Title: 'Бэби-блюз бе, әлде босанғаннан кейінгі депрессия ма?',
    section4Body:
      'Бэби-блюз әдетте қысқа болады және біртіндеп жақсарады. Босанғаннан кейінгі депрессия басқаша: ол ұзағырақ, қарқындырақ болуы және күнделікті өмірге айтарлықтай әсер етуі мүмкін.',
    compareTitle: 'Ажырату керек екі жағдай',
    compareBabyBluesTitle: 'Бэби-блюз',
    compareBabyBluesText:
      'Көбіне қысқа, келесі күндерде біртіндеп жақсарады.',
    comparePostpartumTitle: 'Босанғаннан кейінгі депрессия',
    comparePostpartumText:
      'Ұзағырақ созылуы, күшеюі және кәсіби қолдауды қажет етуі мүмкін.',
    section5Kicker: 'САҚ БОЛУ',
    section5Title: 'Көмекті қашан сұрау керек?',
    section5Body:
      'Эмоциялық күйзеліс жақсармаса, күшейсе немесе күнделікті өмірді қиындата бастаса, медицина маманымен сөйлесу маңызды.',
    attentionTitle: 'Назар аударатын ескерту белгілері',
    attentionSubtitle: 'Мына жағдайда маманмен сөйлесіңіз…',
    attentionSigns: [
      'Белгілер екі аптадан астам созылса.',
      'Мұң немесе алаңдаушылық күшейсе.',
      'Өзіңізге немесе нәрестеңізге қамқор болу қиындаса.',
      'Айтарлықтай күйзеліс сезімі пайда болса.',
    ],
    professionalTitle: 'Қолдау қолжетімді',
    professionalText:
      'Акушер, дәрігер, психолог немесе басқа медицина маманы тыңдап, жағдайды бағалап, тиісті қолдау көрсете алады.',
    tipTitle: 'Білуге тиісті',
    tipText:
      'Босанғаннан кейінгі эмоциялар сіздің қандай жақсы ана екеніңіздің өлшемі емес. Демалуға, тыңдалуға және қолдау табуға қажеттілік сізде заңды.',
    section6Kicker: 'НЕГІЗГІ ТҮЙІНДЕР',
    section6Title: 'Негізгі қорытындылар',
    takeaways: [
      'Бэби-блюз босанғаннан кейін жиі кездеседі.',
      'Шаршау мен гормондық өзгерістер көңіл-күйге әсер етуі мүмкін.',
      'Айналаңыздағылардың қолдауы бұл кезеңді жеңілдетуі мүмкін.',
      'Жалғасатын немесе айтарлықтай күйзеліс кәсіби бағалауға тұрарлық.',
    ],
    disclaimerText:
      'Бұл мақала ақпараттық мақсатқа арналған және жекелендірілген медициналық кеңестің орнын баспайды. Күмән туындаса немесе айтарлықтай күйзеліс сезінсеңіз, медицина маманымен сөйлесіңіз.',
    endText: 'Өзіңізге қамқор болу — босанғаннан кейінгі кезеңнің бір бөлігі.',
    shareTitle: 'Бэби-блюз және босанғаннан кейінгі эмоциялық денсаулық',
    shareMessage:
      'Бэби-блюз және босанғаннан кейінгі эмоциялық денсаулық — AWA\n\nБосанғаннан кейін жиі кездесетін эмоциялық өзгерістерді түсінуге арналған нұсқаулық.',
  },
  wo: {
    badgeText: 'GINNAAW JUR • WÉR CI XOL',
    title: 'Baby blues ak wér ci xol\nginnaaw jur',
    subtitle:
      'Xam li mën a soppiku ci xol ginnaaw jur te xam kañ ngay ñaan dimbali.',
    metaItems: ['10 simili jàng', 'Bind', 'Tàmbali', 'Mbind bu ñu seetlu'],
    introTitle: 'Lu baax a xam',
    introText:
      'Ginnaaw jur, daa jub nga jàll ci jamono ju xol di nooy lool. Baby blues daa gàtt, waaye tiis bu sax walla bu di yokku war na ñu ko jëfandikoo ak doktoor.',
    contentsEyebrow: 'NDIGAL',
    contentsTitle: 'Ci bind bii',
    contents: [
      'Xam baby blues',
      'Màndarga yi gëna bari',
      'Li di dimbli bés bu nekk',
      'Baby blues walla depresiyoŋ ginnaaw jur?',
      'Kañ ngay ñaan dimbali',
      'Li am solo',
    ],
    section1Kicker: 'XAM',
    section1Title: 'Lan mooy baby blues?',
    section1Body1:
      'Baby blues mooy diir bu xol di soppiku ci fan yu njëkk ginnaaw jur. Soppi yu hormon, sonn, ñàkk nelaw ak bokk ak ñaar fuñ bu bees mën nañu yokk nooy bii.',
    section1Body2:
      'Loolu du tooñ te du wone ne yaw ndey bu bon nga. Ku nekk dafay dund fan yu njëkk ginnaaw jur ci sa anam.',
    statTitle: 'Dund bu bari',
    statText:
      'Baby blues dafa bari ginnaaw jur te daa wér ci boppam ci ay fan.',
    section2Kicker: 'MÀNDARGA YI',
    section2Title: 'Li nga mën a dégg',
    section2Body:
      'Li nit ñi di dégg wuute na. Yenn dañuy dégg sonn ak nooy rekk, yeneen mën nañu gis soppi ci xol yu gën a feeñ.',
    commonSigns: [
      {
        title: 'Xol bu nooy',
        description: 'Jooy ci yomb walla nekk bu nooy lool.',
      },
      {
        title: 'Nooy bu bari',
        description: 'Dégg yi mën nañu gën a dëgër te soppiku ci gaaw.',
      },
      {
        title: 'Soppi ci xol',
        description:
          'Dégg ci ndaw mën na dikk ak jamono yu ñuy dégg baax.',
      },
      {
        title: 'Sonn',
        description: 'Sonn bu fan yu njëkk mën na yokk dégg yi.',
      },
    ],
    section3Kicker: 'BÉS BU NEKK',
    section3Title: 'Li mën a dimbli',
    section3Body:
      'Ci jamono jii, soxlaay noppalu mag na. Ay yoon yu ndaw yu yomb mën nañu def fan yi gën a neex.',
    dailySupport: [
      {
        title: 'Noppalu',
        description: 'Jëfandikoo jamono yu amul lenn ngir wér.',
      },
      {
        title: 'Nangu dimbali',
        description: 'Bu ñaaw a ñaan dimbali ci ñi ngay dund ak ñoom.',
      },
      {
        title: 'Naan ndox bu sax',
        description: 'Naan ndox bu doy bés bi gépp.',
      },
      {
        title: 'Lekk bu doy',
        description: 'Tànn lekk yu yomb te sax.',
      },
    ],
    quoteText:
      '“Ñaan dimbali ginnaaw jur mooy yër sa bopp ak sa doom.”',
    section4Kicker: 'WUUTE',
    section4Title: 'Baby blues walla depresiyoŋ ginnaaw jur?',
    section4Body:
      'Baby blues daa gàtt te daa wér tuuti-tuuti. Depresiyoŋ ginnaaw jur wuute na: mën na yàgg, gën a dëgër te jëm lool ci dund bu bés.',
    compareTitle: 'Ñaari mbir yu war a séddale',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Daa gàtt, te daa wér tuuti-tuuti ci fan yu toftal.',
    comparePostpartumTitle: 'Depresiyoŋ ginnaaw jur',
    comparePostpartumText:
      'Mën na yàgg, gën a dëgër te soxla dimbali bu liggéeykat.',
    section5Kicker: 'TEGU',
    section5Title: 'Kañ ngay ñaan dimbali?',
    section5Body:
      'Am solo na nga wax ak benn liggéeykatu wér bu tiis bi wérul, bu mu gën a dëgër walla bu muy def dund bu bés gën a jafe.',
    attentionTitle: 'Màndarga yu war a teg',
    attentionSubtitle: 'Wax ak benn liggéeykat bu…',
    attentionSigns: [
      'Màndarga yi yàgg ci kaw ñaari ayu-bés.',
      'Nooy walla tiitaange di gën a dëgër.',
      'Jafe na nga yër sa bopp walla sa doom.',
      'Benn dégg bu tiis bu bari feeñ na.',
    ],
    professionalTitle: 'Dimbali am na',
    professionalText:
      'Benn ndey-jur, doktoor, psikolog walla beneen liggéeykatu wér mën na la déglu, seetlu sa mbir te joxe la dimbali bu méngoo.',
    tipTitle: 'Lu baax a xam',
    tipText:
      'Dégg yi ginnaaw jur du natt kàttanu sa ndey. Am nga yoon ngir soxla noppalu, ñu déglu la te dimbli la.',
    section6Kicker: 'LI AM SOLO',
    section6Title: 'Li am solo',
    takeaways: [
      'Baby blues dafa bari ginnaaw jur.',
      'Sonn ak soppi yu hormon mën nañu jëm ci xol.',
      'Dimbali bu ñi la wër mën na def jamono jii gën a yomb.',
      'Tiis bu sax walla bu bari war na ñu ko seetlu ak liggéeykat.',
    ],
    disclaimerText:
      'Bind bii ngir xibaar la te du wuutu ndigalu doktoor bu sa bopp. Bu am nga xel-ñaar walla tiis bu bari, wax ak benn liggéeykatu wér.',
    endText: 'Yër sa bopp bokk na ci jamono ginnaaw jur.',
    shareTitle: 'Baby blues ak wér ci xol ginnaaw jur',
    shareMessage:
      'Baby blues ak wér ci xol ginnaaw jur — AWA\n\nBenn ndigal ngir xam soppi yu xol yu daa am ginnaaw jur.',
  },
  ha: {
    badgeText: 'BAYAN HAIHUWA • LAFIYAR ZUCIYA',
    title: 'Baby blues da lafiyar zuciya\nbayan haihuwa',
    subtitle:
      'Fahimtar abin da zai iya sauyawa a zuciya bayan haihuwa da sanin lokacin da za a nemi tallafi.',
    metaItems: ['karatun minti 10', 'Labari', 'Mafari', 'Abun da aka duba'],
    introTitle: 'Abin da ya kamata ki sani',
    introText:
      'Bayan haihuwa, abu ne na yau da kullum a shiga wani lokaci na rashin ƙarfin zuciya. Baby blues yawanci na ɗan lokaci ne, amma damuwa da ke ci gaba ko ta ƙaru ta cancanci kulawar ƙwararre.',
    contentsEyebrow: 'JAGORA',
    contentsTitle: 'A cikin wannan labari',
    contents: [
      'Fahimtar baby blues',
      'Alamomin da suka fi yawa',
      'Abin da ke taimakawa kullum',
      'Baby blues ko baƙin ciki bayan haihuwa?',
      'Lokacin neman taimako',
      'Muhimman abubuwa',
    ],
    section1Kicker: 'FAHIMTA',
    section1Title: 'Menene baby blues?',
    section1Body1:
      'Baby blues wani lokaci ne na sauyin zuciya da zai iya faruwa a kwanakin farko bayan haihuwa. Sauyin hormone, gajiya, rashin barci, da daidaitawa da wannan sabon mataki duk suna iya ƙara wannan rauni.',
    section1Body2:
      'Wannan ba kasawa ba ce kuma ba ya nufin ke uwa ce mara kyau. Kowa yana rayuwar kwanakin farko na bayan haihuwa ta hanyarta.',
    statTitle: 'Abin da ya zama ruwan dare',
    statText:
      'Baby blues ya zama ruwan dare bayan haihuwa kuma yakan inganta da kansa cikin ’yan kwanaki.',
    section2Kicker: 'ALAMOMI',
    section2Title: 'Abin da za ki iya ji',
    section2Body:
      'Abin da mutane ke ji ya bambanta. Wasu galibi suna jin gajiya da rauni, wasu kuma za su iya samun sauyin yanayi mai bayyana sosai.',
    commonSigns: [
      {
        title: 'Saurin kuka',
        description: 'Yin kuka cikin sauƙi ko jin rauni sosai.',
      },
      {
        title: 'Hankali sosai',
        description: 'Ji na iya zama masu ƙarfi su kuma sauya da sauri.',
      },
      {
        title: 'Sauyin yanayi',
        description:
          'Jin rauni na iya musanyawa da lokutan jin daɗi.',
      },
      {
        title: 'Gajiya',
        description: 'Gajiyar kwanakin farko na iya ƙara ji.',
      },
    ],
    section3Kicker: 'KULLUM',
    section3Title: 'Abin da zai iya taimakawa',
    section3Body:
      'A wannan lokaci, bukatar hutu tana da girma. Ƙananan abubuwa masu sauƙi na iya sa kwanaki su fi dacewa.',
    dailySupport: [
      {
        title: 'Hutawa',
        description: 'Yin amfani da duk lokutan hutu don samun lafiya.',
      },
      {
        title: 'Karɓar taimako',
        description: 'Kada ki yi jinkirin neman tallafi daga na kusa da ke.',
      },
      {
        title: 'Shan ruwa akai-akai',
        description: 'Ci gaba da shan isasshen ruwa a duk rana.',
      },
      {
        title: 'Cin abinci sosai',
        description: 'Fifita abinci na yau da kullum masu sauƙi.',
      },
    ],
    quoteText:
      '“Neman taimako bayan haihuwa wata hanya ce ta kula da kanki da jaririnki.”',
    section4Kicker: 'BAMBANTA',
    section4Title: 'Baby blues ko baƙin ciki bayan haihuwa?',
    section4Body:
      'Baby blues yawanci gajere ne kuma yana inganta a hankali. Baƙin ciki bayan haihuwa ya bambanta: zai iya dawwama, ya fi ƙarfi, kuma ya shafi rayuwar yau da kullum sosai.',
    compareTitle: 'Yanayi biyu da za a bambanta',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Yawanci gajere, tare da ingantuwa a hankali a kwanakin da suka biyo baya.',
    comparePostpartumTitle: 'Baƙin ciki bayan haihuwa',
    comparePostpartumText:
      'Zai iya ɗaukar lokaci mai tsawo, ya ƙaru, kuma ya buƙaci tallafin ƙwararre.',
    section5Kicker: 'KULA',
    section5Title: 'Yaushe za a nemi taimako?',
    section5Body:
      'Yana da muhimmanci a yi magana da ma’aikacin lafiya idan baƙin cikin bai inganta ba, ya ƙaru, ko ya fara sa rayuwar yau da kullum ta yi wahala.',
    attentionTitle: 'Alamomin da za a lura da su',
    attentionSubtitle: 'Yi magana da ƙwararre idan…',
    attentionSigns: [
      'Alamomin sun fi mako biyu.',
      'Baƙin ciki ko fargaba ya ƙaru.',
      'Kula da kanki ko jaririnki ya zama da wahala.',
      'Jin damuwa mai yawa ya bayyana.',
    ],
    professionalTitle: 'Akwai tallafi',
    professionalText:
      'Ungozoma, likita, masanin halayyar ɗan adam, ko wani ma’aikacin lafiya zai iya saurarenki, ya tantance yanayin, ya kuma ba da tallafi mai dacewa.',
    tipTitle: 'Abin da ya kamata ki sani',
    tipText:
      'Ji bayan haihuwa ba ma’auni ba ne na yadda kike uwa mai kyau. Kina da ’yancin bukatar hutu, a saurare ki, kuma a tallafa miki.',
    section6Kicker: 'MUHIMMAN ABUBUWA',
    section6Title: 'Muhimman abubuwa',
    takeaways: [
      'Baby blues ya zama ruwan dare bayan haihuwa.',
      'Gajiya da sauyin hormone na iya shafar yanayi.',
      'Tallafin na kusa da ke na iya sauƙaƙa wannan lokaci.',
      'Damuwa mai ɗorewa ko mai yawa ta cancanci a tantance ta a wurin ƙwararre.',
    ],
    disclaimerText:
      'Wannan labari don bayani ne kuma ba ya maye gurbin shawarar likita ta keɓaɓɓiya. Idan kina cikin shakka ko damuwa mai yawa, yi magana da ma’aikacin lafiya.',
    endText: 'Kula da kanki ma wani ɓangare ne na bayan haihuwa.',
    shareTitle: 'Baby blues da lafiyar zuciya bayan haihuwa',
    shareMessage:
      'Baby blues da lafiyar zuciya bayan haihuwa — AWA\n\nJagora don fahimtar sauye-sauyen zuciya da suka zama ruwan dare bayan haihuwa.',
  },
  am: {
    badgeText: 'ከወሊድ በኋላ • ስሜታዊ ጤና',
    title: 'ቤቢ ብሉስ እና ከወሊድ በኋላ\nስሜታዊ ጤና',
    subtitle:
      'ከወሊድ በኋላ በስሜት ላይ ሊለወጥ የሚችለውን መረዳት እና ድጋፍ መቼ መፈለግ እንዳለብሽ ማወቅ።',
    metaItems: ['10 ደቂቃ ንባብ', 'ጽሑፍ', 'ጀማሪ', 'የተረጋገጠ ይዘት'],
    introTitle: 'ማወቅ ጠቃሚ ነው',
    introText:
      'ከወሊድ በኋላ ለተወሰነ ጊዜ ስሜት ከመጠን በላይ መጨመሩ የተለመደ ነው። ቤቢ ብሉስ ብዙውን ጊዜ ጊዜያዊ ነው፣ ነገር ግን የሚቀጥል ወይም የሚጨምር ሐዘን የባለሙያ ትኩረት ይገባዋል።',
    contentsEyebrow: 'መመሪያ',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    contents: [
      'ቤቢ ብሉስን መረዳት',
      'በጣም የተለመዱ ምልክቶች',
      'በየቀኑ የሚረዳው',
      'ቤቢ ብሉስ ወይስ ከወሊድ በኋላ ድብርት?',
      'እርዳታ መቼ መጠየቅ',
      'ዋና ዋና ነጥቦች',
    ],
    section1Kicker: 'መረዳት',
    section1Title: 'ቤቢ ብሉስ ምንድን ነው?',
    section1Body1:
      'ቤቢ ብሉስ ከወለድሽ በኋላ በመጀመሪያዎቹ ጥቂት ቀናት ሊከሰት የሚችል የስሜት ለውጥ ጊዜ ነው። የሆርሞን ለውጦች፣ ድካም፣ የእንቅልፍ እጦት እና ከዚህ አዲስ ደረጃ ጋር መላመድ ሁሉም ለዚህ ስሜታዊነት አስተዋጽኦ ሊያደርጉ ይችላሉ።',
    section1Body2:
      'ይህ ውድቀት አይደለም እንዲሁም መጥፎ እናት ነሽ ማለት አይደለም። እያንዳንዱ ሰው የከወሊድ በኋላ የመጀመሪያ ቀናትን በራሱ መንገድ ያሳልፋል።',
    statTitle: 'የተለመደ ተሞክሮ',
    statText:
      'ቤቢ ብሉስ ከወሊድ በኋላ የተለመደ ሲሆን በጥቂት ቀናት ውስጥ በራሱ የመሻሻል ዝንባሌ አለው።',
    section2Kicker: 'ምልክቶቹ',
    section2Title: 'ምን ሊሰማሽ ይችላል',
    section2Body:
      'ሰዎች የሚሰማቸው ይለያያል። አንዳንዶች በዋናነት ድካምና ስሜታዊነት ይሰማቸዋል፣ ሌሎች ደግሞ ይበልጥ የሚታይ የስሜት ለውጥ ሊኖራቸው ይችላል።',
    commonSigns: [
      {
        title: 'ስሜታዊነት',
        description: 'በቀላሉ ማልቀስ ወይም በተለይ ስሜታዊ መሆን።',
      },
      {
        title: 'ከልክ ያለፈ ስሜታዊነት',
        description: 'ስሜቶች ይበልጥ ጠንካራ ሊሰማቸው እና በፍጥነት ሊለዋወጡ ይችላሉ።',
      },
      {
        title: 'የስሜት መለዋወጥ',
        description:
          'የመሰበር ስሜት ከደህንነት አፍታዎች ጋር ሊፈራረቅ ይችላል።',
      },
      {
        title: 'ድካም',
        description: 'ከመጀመሪያዎቹ ቀናት የሚመጣ ድካም ስሜቶችን ሊያጎላ ይችላል።',
      },
    ],
    section3Kicker: 'በየቀኑ',
    section3Title: 'ምን ሊረዳ ይችላል',
    section3Body:
      'በዚህ ጊዜ የእረፍት ፍላጎት ከፍተኛ ነው። ትናንሽ፣ ቀላል ነገሮች ቀናትን ይበልጥ ምቹ ሊያደርጉ ይችላሉ።',
    dailySupport: [
      {
        title: 'ማረፍ',
        description: 'ለማገገም ማንኛውንም ነፃ ጊዜ መጠቀም።',
      },
      {
        title: 'እርዳታ መቀበል',
        description: 'በአካባቢሽ ካሉ ሰዎች ድጋፍ ለመጠየቅ አትዘገዪ።',
      },
      {
        title: 'በየጊዜው ውሃ መጠጣት',
        description: 'በቀኑ ውስጥ በቂ ውሃ መጠጣት።',
      },
      {
        title: 'በቂ መብላት',
        description: 'መደበኛና ቀላል ምግቦችን መምረጥ።',
      },
    ],
    quoteText:
      '“ከወሊድ በኋላ እርዳታ መጠየቅ ራስሽንና ሕፃንሽን የመንከባከብ መንገድ ነው።”',
    section4Kicker: 'መለየት',
    section4Title: 'ቤቢ ብሉስ ወይስ ከወሊድ በኋላ ድብርት?',
    section4Body:
      'ቤቢ ብሉስ ብዙውን ጊዜ አጭር ሲሆን ቀስ በቀስ ይሻሻላል። ከወሊድ በኋላ ድብርት የተለየ ነው፦ ይበልጥ ሊቆይ፣ ይበልጥ ጠንካራ ሊሆን እና በዕለት ሕይወት ላይ ከፍተኛ ተጽእኖ ሊኖረው ይችላል።',
    compareTitle: 'ልንለያቸው የሚገቡ ሁለት ሁኔታዎች',
    compareBabyBluesTitle: 'ቤቢ ብሉስ',
    compareBabyBluesText:
      'ብዙውን ጊዜ አጭር፣ በሚቀጥሉት ቀናት ቀስ በቀስ ከሚሻሻል ጋር።',
    comparePostpartumTitle: 'ከወሊድ በኋላ ድብርት',
    comparePostpartumText:
      'ረዘም ሊል፣ ሊጠናከር እና የባለሙያ ድጋፍ ሊያስፈልግ ይችላል።',
    section5Kicker: 'ንቁ መሆን',
    section5Title: 'እርዳታ መቼ መጠየቅ?',
    section5Body:
      'የስሜት ሐዘኑ ካልተሻሻለ፣ ከጠነከረ ወይም የዕለት ሕይወትን ማከበድ ከጀመረ የጤና ባለሙያ ጋር መነጋገር አስፈላጊ ነው።',
    attentionTitle: 'ልብ ልትይው የሚገቡ የማስጠንቀቂያ ምልክቶች',
    attentionSubtitle: 'ከባለሙያ ጋር ተነጋገሪ ከሆነ…',
    attentionSigns: [
      'ምልክቶች ከሁለት ሳምንት በላይ ቢቆዩ።',
      'ሐዘን ወይም ጭንቀት ቢጠነክር።',
      'ራስሽን ወይም ሕፃንሽን መንከባከብ ቢከብድ።',
      'ከፍተኛ የሐዘን ስሜት ቢመጣ።',
    ],
    professionalTitle: 'ድጋፍ አለ',
    professionalText:
      'ሚድዋይፍ፣ ሐኪም፣ ሳይኮሎጂስት ወይም ሌላ የጤና ባለሙያ ሊያዳምጥሽ፣ ሁኔታውን ሊገመግምና ተገቢ ድጋፍ ሊሰጥ ይችላል።',
    tipTitle: 'ማወቅ ጠቃሚ ነው',
    tipText:
      'ከወሊድ በኋላ ያሉ ስሜቶች ምን ያህል ጥሩ እናት እንደሆንሽ መለኪያ አይደሉም። እረፍት የመፈለግ፣ የመደመጥና የመደገፍ መብት አለሽ።',
    section6Kicker: 'ዋና ነጥቦች',
    section6Title: 'ዋና ዋና ነጥቦች',
    takeaways: [
      'ቤቢ ብሉስ ከወሊድ በኋላ የተለመደ ነው።',
      'ድካምና የሆርሞን ለውጦች ስሜትን ሊነኩ ይችላሉ።',
      'በአካባቢሽ ካሉ ሰዎች የሚገኝ ድጋፍ ይህን ጊዜ ሊያቀልል ይችላል።',
      'የሚቀጥል ወይም ከፍተኛ ሐዘን የባለሙያ ግምገማ ይገባዋል።',
    ],
    disclaimerText:
      'ይህ ጽሑፍ ለመረጃ ነው እና የግል የሕክምና ምክርን አይተካም። ጥርጣሬ ካለሽ ወይም ከፍተኛ ሐዘን ከተሰማሽ ከጤና ባለሙያ ጋር ተነጋገሪ።',
    endText: 'ራስን መንከባከብም የከወሊድ በኋላ አካል ነው።',
    shareTitle: 'ቤቢ ብሉስ እና ከወሊድ በኋላ ስሜታዊ ጤና',
    shareMessage:
      'ቤቢ ብሉስ እና ከወሊድ በኋላ ስሜታዊ ጤና — AWA\n\nከወሊድ በኋላ የተለመዱ የስሜት ለውጦችን ለመረዳት መመሪያ።',
  },
  nl: {
    badgeText: 'NA DE BEVALLING • EMOTIONELE GEZONDHEID',
    title: 'Babyblues en emotionele\ngezondheid na de bevalling',
    subtitle:
      'Begrijpen wat er na de bevalling emotioneel kan veranderen en weten wanneer je steun moet zoeken.',
    metaItems: ['10 min lezen', 'Artikel', 'Beginner', 'Gecontroleerde inhoud'],
    introTitle: 'Goed om te weten',
    introText:
      'Na de bevalling is het gebruikelijk een periode van verhoogde emotionele gevoeligheid door te maken. De babyblues is meestal tijdelijk, maar aanhoudend of toenemend ongemak verdient professionele aandacht.',
    contentsEyebrow: 'GIDS',
    contentsTitle: 'In dit artikel',
    contents: [
      'De babyblues begrijpen',
      'De meest voorkomende tekenen',
      'Wat dagelijks helpt',
      'Babyblues of postnatale depressie?',
      'Wanneer je hulp moet vragen',
      'Belangrijkste punten',
    ],
    section1Kicker: 'BEGRIJPEN',
    section1Title: 'Wat is de babyblues?',
    section1Body1:
      'De babyblues is een periode van emotionele veranderingen die in de eerste dagen na de bevalling kan optreden. Hormonale veranderingen, vermoeidheid, slaapgebrek en het wennen aan deze nieuwe fase kunnen allemaal bijdragen aan deze gevoeligheid.',
    section1Body2:
      'Dit is geen falen en het betekent niet dat je een slechte moeder bent. Iedereen beleeft de eerste dagen na de bevalling op zijn of haar eigen manier.',
    statTitle: 'Een veelvoorkomende ervaring',
    statText:
      'De babyblues komt vaak voor na een bevalling en verbetert meestal vanzelf binnen enkele dagen.',
    section2Kicker: 'DE TEKENEN',
    section2Title: 'Wat je kunt voelen',
    section2Body:
      'Wat mensen ervaren verschilt. Sommigen voelen vooral vermoeidheid en gevoeligheid, anderen hebben meer merkbare stemmingswisselingen.',
    commonSigns: [
      {
        title: 'Emotioneel zijn',
        description: 'Sneller huilen of je bijzonder gevoelig voelen.',
      },
      {
        title: 'Overgevoeligheid',
        description: 'Emoties kunnen sterker aanvoelen en snel wisselen.',
      },
      {
        title: 'Stemmingswisselingen',
        description:
          'Een gevoel van kwetsbaarheid kan worden afgewisseld met momenten van welzijn.',
      },
      {
        title: 'Vermoeidheid',
        description: 'Vermoeidheid van de eerste dagen kan emoties versterken.',
      },
    ],
    section3Kicker: 'DAGELIJKS',
    section3Title: 'Wat kan helpen',
    section3Body:
      'In deze periode is de behoefte aan rust groot. Kleine, eenvoudige dingen kunnen de dagen aangenamer maken.',
    dailySupport: [
      {
        title: 'Rusten',
        description: 'Gebruik elk vrij moment om te herstellen.',
      },
      {
        title: 'Hulp aannemen',
        description: 'Aarzel niet om steun te vragen aan mensen om je heen.',
      },
      {
        title: 'Regelmatig drinken',
        description: 'Zorg dat je de hele dag voldoende vocht binnenkrijgt.',
      },
      {
        title: 'Voldoende eten',
        description: 'Geef de voorkeur aan regelmatige, eenvoudige maaltijden.',
      },
    ],
    quoteText:
      '“Om hulp vragen na de bevalling is een manier om voor jezelf en je baby te zorgen.”',
    section4Kicker: 'HET ONDERSCHEID',
    section4Title: 'Babyblues of postnatale depressie?',
    section4Body:
      'De babyblues is meestal kort en verbetert geleidelijk. Een postnatale depressie is anders: die kan aanhoudender en intenser zijn en een grote impact hebben op het dagelijks leven.',
    compareTitle: 'Twee situaties om te onderscheiden',
    compareBabyBluesTitle: 'Babyblues',
    compareBabyBluesText:
      'Vaak kort, met geleidelijke verbetering in de dagen erna.',
    comparePostpartumTitle: 'Postnatale depressie',
    comparePostpartumText:
      'Kan langer duren, erger worden en professionele ondersteuning vereisen.',
    section5Kicker: 'ALERT BLIJVEN',
    section5Title: 'Wanneer hulp vragen?',
    section5Body:
      'Het is belangrijk om met een zorgverlener te praten als het emotionele ongemak niet verbetert, heviger wordt of het dagelijks leven moeilijker begint te maken.',
    attentionTitle: 'Waarschuwingssignalen om op te letten',
    attentionSubtitle: 'Praat met een professional als…',
    attentionSigns: [
      'De symptomen langer dan twee weken duren.',
      'Verdriet of angst heviger wordt.',
      'Het moeilijk wordt om voor jezelf of je baby te zorgen.',
      'Er een sterk gevoel van onwel zijn ontstaat.',
    ],
    professionalTitle: 'Er is steun beschikbaar',
    professionalText:
      'Een verloskundige, huisarts, psycholoog of andere zorgverlener kan luisteren, de situatie beoordelen en passende ondersteuning bieden.',
    tipTitle: 'Goed om te weten',
    tipText:
      'Emoties na de bevalling zeggen niets over wat voor moeder je bent. Je hebt het recht om rust nodig te hebben, gehoord te worden en ondersteund te worden.',
    section6Kicker: 'BELANGRIJKE PUNTEN',
    section6Title: 'Belangrijkste punten',
    takeaways: [
      'De babyblues komt vaak voor na een bevalling.',
      'Vermoeidheid en hormonale veranderingen kunnen je stemming beïnvloeden.',
      'Steun van mensen om je heen kan deze periode gemakkelijker maken.',
      'Aanhoudend of ernstig ongemak verdient een professionele beoordeling.',
    ],
    disclaimerText:
      'Dit artikel is bedoeld ter informatie en vervangt geen persoonlijk medisch advies. Bij twijfel of ernstig ongemak: praat met een zorgverlener.',
    endText: 'Goed voor jezelf zorgen hoort ook bij de periode na de bevalling.',
    shareTitle: 'Babyblues en emotionele gezondheid na de bevalling',
    shareMessage:
      'Babyblues en emotionele gezondheid na de bevalling — AWA\n\nEen gids om de emotionele veranderingen te begrijpen die vaak voorkomen na de bevalling.',
  },
  fi: {
    badgeText: 'SYNNYTYKSEN JÄLKEEN • HENKINEN TERVEYS',
    title: 'Baby blues ja synnytyksen jälkeinen\nhenkinen terveys',
    subtitle:
      'Ymmärrä, mikä voi muuttua henkisesti synnytyksen jälkeen, ja tiedä, milloin hakea tukea.',
    metaItems: ['10 min lukuaika', 'Artikkeli', 'Aloittelija', 'Tarkistettu sisältö'],
    introTitle: 'Hyvä tietää',
    introText:
      'Synnytyksen jälkeen on tavallista käydä läpi jakso, jolloin tunneherkkyys on tavallista suurempi. Baby blues on yleensä ohimenevä, mutta aiheuttama ahdistus, joka jatkuu tai voimistuu, ansaitsee ammattilaisen huomion.',
    contentsEyebrow: 'OPAS',
    contentsTitle: 'Tässä artikkelissa',
    contents: [
      'Baby bluesin ymmärtäminen',
      'Yleisimmät merkit',
      'Mikä auttaa arjessa',
      'Baby blues vai synnytyksen jälkeinen masennus?',
      'Milloin pyytää apua',
      'Tärkeimmät asiat',
    ],
    section1Kicker: 'YMMÄRTÄMINEN',
    section1Title: 'Mikä on baby blues?',
    section1Body1:
      'Baby blues on tunteiden muutosten jakso, jota voi esiintyä ensimmäisinä päivinä synnytyksen jälkeen. Hormonaaliset muutokset, väsymys, unen puute ja sopeutuminen tähän uuteen vaiheeseen voivat kaikki edistää tätä herkkyyttä.',
    section1Body2:
      'Tämä ei ole epäonnistuminen, eikä se tarkoita, että olisit huono äiti. Jokainen kokee synnytyksen jälkeiset ensimmäiset päivät omalla tavallaan.',
    statTitle: 'Yleinen kokemus',
    statText:
      'Baby blues on yleinen synnytyksen jälkeen, ja se yleensä helpottaa itsestään muutaman päivän kuluessa.',
    section2Kicker: 'MERKIT',
    section2Title: 'Mitä saatat tuntea',
    section2Body:
      'Kokemukset vaihtelevat. Jotkut tuntevat lähinnä väsymystä ja herkkyyttä, kun taas toisilla mielialan muutokset voivat olla selvempiä.',
    commonSigns: [
      {
        title: 'Tunteellisuus',
        description: 'Itkuherkkyys tai erityinen herkkyys.',
      },
      {
        title: 'Yliherkkyys',
        description: 'Tunteet voivat tuntua voimakkaammilta ja vaihtua nopeasti.',
      },
      {
        title: 'Mielialan vaihtelut',
        description:
          'Haurauden tunne voi vuorotella hyvinvoinnin hetkien kanssa.',
      },
      {
        title: 'Väsymys',
        description: 'Ensimmäisten päivien väsymys voi vahvistaa tunteita.',
      },
    ],
    section3Kicker: 'ARJESSA',
    section3Title: 'Mikä voi auttaa',
    section3Body:
      'Tänä aikana levon tarve on suuri. Pienet, yksinkertaiset asiat voivat tehdä päivistä miellyttävämpiä.',
    dailySupport: [
      {
        title: 'Lepääminen',
        description: 'Hyödynnä kaikki vapaat hetket palautumiseen.',
      },
      {
        title: 'Avun vastaanottaminen',
        description: 'Älä epäröi pyytää tukea läheisiltäsi.',
      },
      {
        title: 'Säännöllinen juominen',
        description: 'Pysy riittävän nesteytettynä koko päivän.',
      },
      {
        title: 'Riittävä syöminen',
        description: 'Suosi säännöllisiä, yksinkertaisia aterioita.',
      },
    ],
    quoteText:
      '“Avun pyytäminen synnytyksen jälkeen on tapa pitää huolta itsestäsi ja vauvastasi.”',
    section4Kicker: 'EROTTAMINEN',
    section4Title: 'Baby blues vai synnytyksen jälkeinen masennus?',
    section4Body:
      'Baby blues on yleensä lyhytkestoinen ja helpottaa vähitellen. Synnytyksen jälkeinen masennus on erilainen: se voi olla pitkäkestoisempi, voimakkaampi ja vaikuttaa merkittävästi arkeen.',
    compareTitle: 'Kaksi erotettavaa tilannetta',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Usein lyhytkestoinen, ja se helpottaa vähitellen seuraavien päivien aikana.',
    comparePostpartumTitle: 'Synnytyksen jälkeinen masennus',
    comparePostpartumText:
      'Voi kestää pidempään, voimistua ja vaatia ammattilaisen tukea.',
    section5Kicker: 'VALPPAANA PYSYMINEN',
    section5Title: 'Milloin pyytää apua?',
    section5Body:
      'On tärkeää puhua terveydenhuollon ammattilaisen kanssa, jos henkinen ahdistus ei helpotu, muuttuu voimakkaammaksi tai alkaa vaikeuttaa arkea.',
    attentionTitle: 'Huomioitavat varoitusmerkit',
    attentionSubtitle: 'Puhu ammattilaiselle, jos…',
    attentionSigns: [
      'Oireet kestävät yli kaksi viikkoa.',
      'Suru tai ahdistus voimistuu.',
      'Itsestä tai vauvasta huolehtiminen käy vaikeaksi.',
      'Ilmaantuu merkittävä ahdistuksen tunne.',
    ],
    professionalTitle: 'Tukea on saatavilla',
    professionalText:
      'Kätilö, lääkäri, psykologi tai muu terveydenhuollon ammattilainen voi kuunnella, arvioida tilannetta ja tarjota sopivaa tukea.',
    tipTitle: 'Hyvä tietää',
    tipText:
      'Synnytyksen jälkeiset tunteet eivät mittaa sitä, kuinka hyvä äiti olet. Sinulla on oikeus tarvita lepoa, tulla kuulluksi ja saada tukea.',
    section6Kicker: 'TÄRKEÄT KOHDAT',
    section6Title: 'Tärkeimmät asiat',
    takeaways: [
      'Baby blues on yleinen synnytyksen jälkeen.',
      'Väsymys ja hormonaaliset muutokset voivat vaikuttaa mielialaan.',
      'Läheisten tuki voi helpottaa tätä jaksoa.',
      'Jatkuva tai merkittävä ahdistus ansaitsee ammattilaisen arvion.',
    ],
    disclaimerText:
      'Tämä artikkeli on tarkoitettu tiedoksi eikä korvaa henkilökohtaista lääketieteellistä neuvontaa. Jos olet epävarma tai koet merkittävää ahdistusta, puhu terveydenhuollon ammattilaisen kanssa.',
    endText: 'Itsestäsi huolehtiminen kuuluu myös synnytyksen jälkeiseen aikaan.',
    shareTitle: 'Baby blues ja synnytyksen jälkeinen henkinen terveys',
    shareMessage:
      'Baby blues ja synnytyksen jälkeinen henkinen terveys — AWA\n\nOpas synnytyksen jälkeisten tavallisten tunnemuutosten ymmärtämiseen.',
  },
  el: {
    badgeText: 'ΛΟΧΕΙΑ • ΣΥΝΑΙΣΘΗΜΑΤΙΚΗ ΥΓΕΙΑ',
    title: 'Baby blues και συναισθηματική\nυγεία μετά τον τοκετό',
    subtitle:
      'Κατανόησε τι μπορεί να αλλάξει συναισθηματικά μετά τον τοκετό και μάθε πότε να ζητήσεις στήριξη.',
    metaItems: ['10 λεπτά ανάγνωσης', 'Άρθρο', 'Αρχάριο', 'Ελεγμένο περιεχόμενο'],
    introTitle: 'Καλό είναι να γνωρίζεις',
    introText:
      'Μετά τον τοκετό είναι συνηθισμένο να περνάς μια περίοδο αυξημένης συναισθηματικής ευαισθησίας. Το baby blues είναι συνήθως παροδικό, αλλά η δυσφορία που επιμένει ή εντείνεται αξίζει την προσοχή ενός επαγγελματία.',
    contentsEyebrow: 'ΟΔΗΓΟΣ',
    contentsTitle: 'Σε αυτό το άρθρο',
    contents: [
      'Κατανοώντας το baby blues',
      'Τα πιο συχνά σημάδια',
      'Τι βοηθά στην καθημερινότητα',
      'Baby blues ή λοχειακή κατάθλιψη;',
      'Πότε να ζητήσεις βοήθεια',
      'Βασικά συμπεράσματα',
    ],
    section1Kicker: 'ΚΑΤΑΝΟΗΣΗ',
    section1Title: 'Τι είναι το baby blues;',
    section1Body1:
      'Το baby blues είναι μια περίοδος συναισθηματικών αλλαγών που μπορεί να εμφανιστεί τις πρώτες ημέρες μετά τον τοκετό. Οι ορμονικές μεταβολές, η κόπωση, η έλλειψη ύπνου και η προσαρμογή σε αυτό το νέο στάδιο μπορούν να συμβάλλουν σε αυτή την ευαισθησία.',
    section1Body2:
      'Αυτό δεν είναι αποτυχία και δεν σημαίνει ότι είσαι κακή μητέρα. Καθεμία βιώνει τις πρώτες ημέρες της λοχείας με τον δικό της τρόπο.',
    statTitle: 'Μια συχνή εμπειρία',
    statText:
      'Το baby blues είναι συχνό μετά τον τοκετό και τείνει να υποχωρεί από μόνο του μέσα σε λίγες ημέρες.',
    section2Kicker: 'ΤΑ ΣΗΜΑΔΙΑ',
    section2Title: 'Τι μπορεί να νιώθεις',
    section2Body:
      'Όσα βιώνει κανείς διαφέρουν. Ορισμένες γυναίκες νιώθουν κυρίως κόπωση και ευαισθησία, ενώ άλλες μπορεί να έχουν πιο έντονες αλλαγές διάθεσης.',
    commonSigns: [
      {
        title: 'Συναισθηματική φόρτιση',
        description: 'Να κλαις πιο εύκολα ή να νιώθεις ιδιαίτερα ευαίσθητη.',
      },
      {
        title: 'Υπερευαισθησία',
        description: 'Τα συναισθήματα μπορεί να φαίνονται πιο έντονα και να αλλάζουν γρήγορα.',
      },
      {
        title: 'Εναλλαγές διάθεσης',
        description:
          'Ένα αίσθημα ευθραυστότητας μπορεί να εναλλάσσεται με στιγμές ευεξίας.',
      },
      {
        title: 'Κόπωση',
        description: 'Η κόπωση των πρώτων ημερών μπορεί να ενισχύσει τα συναισθήματα.',
      },
    ],
    section3Kicker: 'ΚΑΘΗΜΕΡΙΝΟΤΗΤΑ',
    section3Title: 'Τι μπορεί να βοηθήσει',
    section3Body:
      'Σε αυτή την περίοδο η ανάγκη για ξεκούραση είναι μεγάλη. Μικρά, απλά πράγματα μπορούν να κάνουν τις ημέρες πιο άνετες.',
    dailySupport: [
      {
        title: 'Ξεκούραση',
        description: 'Εκμεταλλεύσου κάθε ελεύθερη στιγμή για να αναρρώσεις.',
      },
      {
        title: 'Αποδοχή βοήθειας',
        description: 'Μην διστάσεις να ζητήσεις στήριξη από τους γύρω σου.',
      },
      {
        title: 'Τακτική πρόσληψη υγρών',
        description: 'Να παραμένεις επαρκώς ενυδατωμένη κατά τη διάρκεια της ημέρας.',
      },
      {
        title: 'Επαρκής διατροφή',
        description: 'Προτίμησε τακτικά, απλά γεύματα.',
      },
    ],
    quoteText:
      '«Το να ζητάς βοήθεια στη λοχεία είναι ένας τρόπος να φροντίζεις τον εαυτό σου και το μωρό σου.»',
    section4Kicker: 'ΔΙΑΧΩΡΙΣΜΟΣ',
    section4Title: 'Baby blues ή λοχειακή κατάθλιψη;',
    section4Body:
      'Το baby blues είναι συνήθως σύντομο και βελτιώνεται σταδιακά. Η λοχειακή κατάθλιψη είναι διαφορετική: μπορεί να είναι πιο επίμονη, πιο έντονη και να επηρεάζει σημαντικά την καθημερινή ζωή.',
    compareTitle: 'Δύο καταστάσεις που πρέπει να ξεχωρίζεις',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Συχνά σύντομο, με σταδιακή βελτίωση τις επόμενες ημέρες.',
    comparePostpartumTitle: 'Λοχειακή κατάθλιψη',
    comparePostpartumText:
      'Μπορεί να διαρκέσει περισσότερο, να εντείνεται και να χρειάζεται επαγγελματική στήριξη.',
    section5Kicker: 'ΠΑΡΑΜΕΝΟΝΤΑΣ ΕΠΑΓΡΥΠΝΗ',
    section5Title: 'Πότε να ζητήσεις βοήθεια;',
    section5Body:
      'Είναι σημαντικό να μιλήσεις με έναν επαγγελματία υγείας αν η συναισθηματική δυσφορία δεν βελτιώνεται, γίνεται πιο έντονη ή αρχίζει να δυσκολεύει την καθημερινή ζωή.',
    attentionTitle: 'Προειδοποιητικά σημάδια που πρέπει να προσέξεις',
    attentionSubtitle: 'Μίλησε με έναν επαγγελματία αν…',
    attentionSigns: [
      'Τα συμπτώματα διαρκούν περισσότερο από δύο εβδομάδες.',
      'Η λύπη ή το άγχος γίνεται πιο έντονο.',
      'Γίνεται δύσκολο να φροντίσεις τον εαυτό σου ή το μωρό σου.',
      'Εμφανίζεται ένα έντονο αίσθημα δυσφορίας.',
    ],
    professionalTitle: 'Υπάρχει στήριξη',
    professionalText:
      'Μια μαία, ένας γιατρός, ένας ψυχολόγος ή άλλος επαγγελματίας υγείας μπορεί να σε ακούσει, να αξιολογήσει την κατάσταση και να προτείνει κατάλληλη στήριξη.',
    tipTitle: 'Καλό είναι να γνωρίζεις',
    tipText:
      'Τα συναισθήματα της λοχείας δεν αποτελούν μέτρο του πόσο καλή μητέρα είσαι. Έχεις δικαίωμα να χρειάζεσαι ξεκούραση, να σε ακούνε και να σε στηρίζουν.',
    section6Kicker: 'ΒΑΣΙΚΑ ΣΗΜΕΙΑ',
    section6Title: 'Βασικά συμπεράσματα',
    takeaways: [
      'Το baby blues είναι συχνό μετά τον τοκετό.',
      'Η κόπωση και οι ορμονικές αλλαγές μπορούν να επηρεάσουν τη διάθεση.',
      'Η στήριξη των γύρω σου μπορεί να κάνει αυτή την περίοδο ευκολότερη.',
      'Η επίμονη ή έντονη δυσφορία αξίζει επαγγελματική αξιολόγηση.',
    ],
    disclaimerText:
      'Αυτό το άρθρο είναι ενημερωτικό και δεν αντικαθιστά εξατομικευμένη ιατρική συμβουλή. Αν έχεις αμφιβολίες ή νιώθεις έντονη δυσφορία, μίλησε με έναν επαγγελματία υγείας.',
    endText: 'Το να φροντίζεις τον εαυτό σου είναι επίσης μέρος της λοχείας.',
    shareTitle: 'Baby blues και συναισθηματική υγεία μετά τον τοκετό',
    shareMessage:
      'Baby blues και συναισθηματική υγεία μετά τον τοκετό — AWA\n\nΈνας οδηγός για να κατανοήσεις τις συναισθηματικές αλλαγές που είναι συχνές μετά τον τοκετό.',
  },
  fil: {
    badgeText: 'PAGKATAPOS MANGANAK • EMOSYONAL NA KALUSUGAN',
    title: 'Baby blues at emosyonal na\nkalusugan pagkatapos manganak',
    subtitle:
      'Unawain ang maaaring magbago sa damdamin pagkatapos manganak at alamin kung kailan hihingi ng suporta.',
    metaItems: ['10 min na babasahin', 'Artikulo', 'Baguhan', 'Sinuring nilalaman'],
    introTitle: 'Mabuting malaman',
    introText:
      'Pagkatapos manganak, karaniwan ang makaranas ng panahon ng mas matinding emosyonal na pagiging sensitibo. Karaniwang pansamantala lamang ang baby blues, ngunit karapat-dapat sa atensyon ng propesyonal ang paghihirap na nagpapatuloy o lumalala.',
    contentsEyebrow: 'GABAY',
    contentsTitle: 'Sa artikulong ito',
    contents: [
      'Pag-unawa sa baby blues',
      'Ang mga pinakakaraniwang senyales',
      'Ang nakakatulong sa araw-araw',
      'Baby blues o postpartum depression?',
      'Kailan hihingi ng tulong',
      'Mahahalagang tandaan',
    ],
    section1Kicker: 'PAG-UNAWA',
    section1Title: 'Ano ang baby blues?',
    section1Body1:
      'Ang baby blues ay panahon ng mga pagbabago sa damdamin na maaaring mangyari sa mga unang araw pagkatapos manganak. Maaaring mag-ambag sa pagiging sensitibong ito ang mga pagbabago sa hormone, pagod, kakulangan sa tulog, at pag-aangkop sa bagong yugtong ito.',
    section1Body2:
      'Hindi ito pagkabigo at hindi ito nangangahulugang masama kang ina. Iba-iba ang pagdanas ng bawat babae sa mga unang araw pagkatapos manganak.',
    statTitle: 'Isang karaniwang karanasan',
    statText:
      'Karaniwan ang baby blues pagkatapos manganak at kusang gumagaling sa loob ng ilang araw.',
    section2Kicker: 'ANG MGA SENYALES',
    section2Title: 'Ang maaari mong maramdaman',
    section2Body:
      'Nag-iiba ang nararanasan ng bawat isa. May ilang pangunahing pagod at pagiging sensitibo ang nararamdaman, habang ang iba ay maaaring may mas kapansin-pansing pagbabago ng mood.',
    commonSigns: [
      {
        title: 'Pagiging emosyonal',
        description: 'Mas madaling umiyak o pakiramdam na lalo kang sensitibo.',
      },
      {
        title: 'Labis na pagiging sensitibo',
        description: 'Maaaring mas matindi ang pakiramdam ng mga damdamin at mabilis magbago.',
      },
      {
        title: 'Pabago-bagong mood',
        description:
          'Maaaring salitan ng mga sandali ng ginhawa ang pakiramdam ng pagiging marupok.',
      },
      {
        title: 'Pagod',
        description: 'Maaaring palakasin ng pagod sa mga unang araw ang mga damdamin.',
      },
    ],
    section3Kicker: 'ARAW-ARAW',
    section3Title: 'Ang makakatulong',
    section3Body:
      'Sa panahong ito, malaki ang pangangailangan sa pahinga. Makakapagpagaan ng mga araw ang maliliit at simpleng bagay.',
    dailySupport: [
      {
        title: 'Pagpapahinga',
        description: 'Samantalahin ang anumang libreng sandali para gumaling.',
      },
      {
        title: 'Pagtanggap ng tulong',
        description: 'Huwag mag-atubiling humingi ng suporta sa mga nasa paligid mo.',
      },
      {
        title: 'Regular na pag-inom',
        description: 'Manatiling sapat ang hydration sa buong araw.',
      },
      {
        title: 'Sapat na pagkain',
        description: 'Piliin ang regular at simpleng mga pagkain.',
      },
    ],
    quoteText:
      '“Ang paghingi ng tulong pagkatapos manganak ay paraan ng pag-aalaga sa sarili at sa iyong sanggol.”',
    section4Kicker: 'PAGKAKAIBA',
    section4Title: 'Baby blues o postpartum depression?',
    section4Body:
      'Karaniwang maikli ang baby blues at unti-unting gumagaling. Iba ang postpartum depression: maaari itong mas matagal, mas matindi, at may malaking epekto sa pang-araw-araw na buhay.',
    compareTitle: 'Dalawang kalagayang dapat paghiwalayin',
    compareBabyBluesTitle: 'Baby blues',
    compareBabyBluesText:
      'Madalas maikli, na may unti-unting paggaling sa mga sumunod na araw.',
    comparePostpartumTitle: 'Postpartum depression',
    comparePostpartumText:
      'Maaaring mas matagal, lumala, at mangailangan ng propesyonal na suporta.',
    section5Kicker: 'PANANATILING MAPAGMASID',
    section5Title: 'Kailan hihingi ng tulong?',
    section5Body:
      'Mahalagang kausapin ang isang propesyonal sa kalusugan kung hindi gumagaling ang emosyonal na paghihirap, lumalala, o nagsisimulang pahirapan ang pang-araw-araw na buhay.',
    attentionTitle: 'Mga babalang senyales na dapat bantayan',
    attentionSubtitle: 'Makipag-usap sa isang propesyonal kung…',
    attentionSigns: [
      'Tumatagal nang higit sa dalawang linggo ang mga sintomas.',
      'Lumalala ang lungkot o pagkabalisa.',
      'Nagiging mahirap alagaan ang sarili o ang iyong sanggol.',
      'Lumilitaw ang matinding pakiramdam ng paghihirap.',
    ],
    professionalTitle: 'May magagamit na suporta',
    professionalText:
      'Maaaring makinig, suriin ang sitwasyon, at mag-alok ng angkop na suporta ang isang komadrona, doktor, psychologist, o ibang propesyonal sa kalusugan.',
    tipTitle: 'Mabuting malaman',
    tipText:
      'Hindi sukatan ng kung gaano ka kahusay na ina ang mga damdamin pagkatapos manganak. May karapatan kang mangailangan ng pahinga, pakinggan, at suportahan.',
    section6Kicker: 'MAHAHALAGANG PUNTO',
    section6Title: 'Mahahalagang tandaan',
    takeaways: [
      'Karaniwan ang baby blues pagkatapos manganak.',
      'Maaaring makaapekto sa mood ang pagod at mga pagbabago sa hormone.',
      'Makapagpapagaan ng panahong ito ang suporta ng mga nasa paligid mo.',
      'Karapat-dapat sa propesyonal na pagsusuri ang patuloy o matinding paghihirap.',
    ],
    disclaimerText:
      'Impormasyon lamang ang artikulong ito at hindi nito pinapalitan ang personalisadong medikal na payo. Kung may alinlangan o nakararanas ng matinding paghihirap, kumausap ng propesyonal sa kalusugan.',
    endText: 'Bahagi rin ng panahon pagkatapos manganak ang pag-aalaga sa sarili.',
    shareTitle: 'Baby blues at emosyonal na kalusugan pagkatapos manganak',
    shareMessage:
      'Baby blues at emosyonal na kalusugan pagkatapos manganak — AWA\n\nIsang gabay para maunawaan ang mga pagbabago sa damdamin na karaniwan pagkatapos manganak.',
  },
  ta: {
    badgeText: 'பிரசவத்திற்குப் பின் • உணர்வு ஆரோக்கியம்',
    title: 'பேபி ப்ளூஸும் பிரசவத்துக்குப் பிந்தைய\nஉணர்வு ஆரோக்கியமும்',
    subtitle:
      'பிரசவத்துக்குப் பின் உணர்வுரீதியாக என்ன மாறக்கூடும் என்பதைப் புரிந்துகொள்ளுதல், ஆதரவை எப்போது தேடுவது என்பதை அறிதல்.',
    metaItems: ['10 நிமிடம் படிக்க', 'கட்டுரை', 'தொடக்க நிலை', 'சரிபார்க்கப்பட்ட உள்ளடக்கம்'],
    introTitle: 'தெரிந்துகொள்ளுங்கள்',
    introText:
      'பிரசவத்துக்குப் பின், உணர்வுகள் அதிகம் உணர்திறன் பெறும் காலத்தைக் கடந்து செல்வது பொதுவானது. பேபி ப்ளூஸ் பொதுவாகத் தற்காலிகமானது, ஆனால் தொடரும் அல்லது தீவிரமாகும் மனவேதனை தொழில்முறைக் கவனத்துக்கு உரியது.',
    contentsEyebrow: 'வழிகாட்டி',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    contents: [
      'பேபி ப்ளூஸைப் புரிந்துகொள்ளுதல்',
      'மிகப் பொதுவான அறிகுறிகள்',
      'அன்றாடம் உதவுவது என்ன',
      'பேபி ப்ளூஸா அல்லது பிரசவத்துக்குப் பிந்தைய மனச்சோர்வா?',
      'உதவியை எப்போது கேட்பது',
      'முக்கியக் குறிப்புகள்',
    ],
    section1Kicker: 'புரிந்துகொள்ளுதல்',
    section1Title: 'பேபி ப்ளூஸ் என்றால் என்ன?',
    section1Body1:
      'பேபி ப்ளூஸ் என்பது பிரசவத்துக்குப் பின் முதல் சில நாட்களில் ஏற்படக்கூடிய உணர்வு மாற்றங்களின் காலம். ஹார்மோன் மாற்றங்கள், சோர்வு, உறக்கமின்மை மற்றும் இந்தப் புதிய கட்டத்துக்கு ஏற்ப மாறுதல் ஆகியவை இந்த உணர்திறனுக்குக் காரணமாகலாம்.',
    section1Body2:
      'இது தோல்வி அல்ல, நீங்கள் ஒரு மோசமான தாய் என்றும் பொருள் அல்ல. பிரசவத்துக்குப் பிந்தைய முதல் நாட்களை ஒவ்வொருவரும் தம் சொந்த வழியில் அனுபவிக்கிறார்கள்.',
    statTitle: 'ஒரு பொதுவான அனுபவம்',
    statText:
      'பேபி ப்ளூஸ் பிரசவத்துக்குப் பின் பொதுவாக ஏற்படுகிறது, சில நாட்களுக்குள் தானாகவே மேம்படும்.',
    section2Kicker: 'அறிகுறிகள்',
    section2Title: 'நீங்கள் உணரக்கூடியவை',
    section2Body:
      'மக்களின் அனுபவம் வேறுபடும். சிலர் முக்கியமாகச் சோர்வையும் உணர்திறனையும் உணர்கிறார்கள், மற்றவர்களுக்கு மனநிலை மாற்றங்கள் அதிகம் தெரியலாம்.',
    commonSigns: [
      {
        title: 'உணர்ச்சிவசம்',
        description: 'எளிதில் அழுவது அல்லது குறிப்பாக உணர்திறனுடன் இருப்பது.',
      },
      {
        title: 'மிகை உணர்திறன்',
        description: 'உணர்வுகள் வலிமையாகத் தோன்றலாம், விரைவாக மாறலாம்.',
      },
      {
        title: 'மனநிலை ஏற்ற இறக்கங்கள்',
        description:
          'பலவீனமான உணர்வு, நலமான தருணங்களுடன் மாறி மாறி வரலாம்.',
      },
      {
        title: 'சோர்வு',
        description: 'முதல் நாட்களின் சோர்வு உணர்வுகளைப் பெருக்கக்கூடும்.',
      },
    ],
    section3Kicker: 'அன்றாடம்',
    section3Title: 'உதவக்கூடியவை',
    section3Body:
      'இந்தக் காலத்தில் ஓய்வின் தேவை பெரிது. சிறிய, எளிய விஷயங்கள் நாட்களை இன்னும் வசதியாக்கலாம்.',
    dailySupport: [
      {
        title: 'ஓய்வெடுத்தல்',
        description: 'குணமடைய கிடைக்கும் ஒவ்வொரு ஓய்வு நேரத்தையும் பயன்படுத்துதல்.',
      },
      {
        title: 'உதவியை ஏற்றல்',
        description: 'உங்களைச் சுற்றியுள்ளவர்களிடம் ஆதரவு கேட்கத் தயங்காதீர்கள்.',
      },
      {
        title: 'தொடர்ந்து நீர் அருந்துதல்',
        description: 'நாள் முழுவதும் போதுமான அளவு நீர்ச்சத்துடன் இருத்தல்.',
      },
      {
        title: 'போதுமான அளவு உண்ணுதல்',
        description: 'ஒழுங்கான, எளிய உணவுகளுக்கு முன்னுரிமை கொடுத்தல்.',
      },
    ],
    quoteText:
      '“பிரசவத்துக்குப் பின் உதவி கேட்பது உங்களையும் உங்கள் குழந்தையையும் கவனித்துக்கொள்ளும் ஒரு வழி.”',
    section4Kicker: 'வேறுபடுத்துதல்',
    section4Title: 'பேபி ப்ளூஸா அல்லது பிரசவத்துக்குப் பிந்தைய மனச்சோர்வா?',
    section4Body:
      'பேபி ப்ளூஸ் பொதுவாகச் சுருக்கமானது, படிப்படியாக மேம்படும். பிரசவத்துக்குப் பிந்தைய மனச்சோர்வு வேறுபட்டது: அது அதிக நீடித்ததாகவும், அதிகத் தீவிரமானதாகவும், அன்றாட வாழ்க்கையில் குறிப்பிடத்தக்க தாக்கத்தை ஏற்படுத்துவதாகவும் இருக்கலாம்.',
    compareTitle: 'வேறுபடுத்த வேண்டிய இரண்டு நிலைகள்',
    compareBabyBluesTitle: 'பேபி ப்ளூஸ்',
    compareBabyBluesText:
      'பெரும்பாலும் சுருக்கமானது, அடுத்த நாட்களில் படிப்படியான முன்னேற்றத்துடன்.',
    comparePostpartumTitle: 'பிரசவத்துக்குப் பிந்தைய மனச்சோர்வு',
    comparePostpartumText:
      'நீண்ட காலம் நீடிக்கலாம், தீவிரமாகலாம், தொழில்முறை ஆதரவு தேவைப்படலாம்.',
    section5Kicker: 'விழிப்புடன் இருத்தல்',
    section5Title: 'உதவியை எப்போது கேட்பது?',
    section5Body:
      'உணர்வுரீதியான மனவேதனை மேம்படாவிட்டால், தீவிரமானால், அல்லது அன்றாட வாழ்க்கையைக் கடினமாக்கத் தொடங்கினால், சுகாதார நிபுணரிடம் பேசுவது முக்கியம்.',
    attentionTitle: 'கவனிக்க வேண்டிய எச்சரிக்கை அறிகுறிகள்',
    attentionSubtitle: 'ஒரு நிபுணரிடம் பேசுங்கள்…',
    attentionSigns: [
      'அறிகுறிகள் இரண்டு வாரங்களுக்கு மேல் நீடிக்கின்றன.',
      'சோகம் அல்லது பதற்றம் அதிகத் தீவிரமாகிறது.',
      'உங்களையோ உங்கள் குழந்தையையோ கவனித்துக்கொள்வது கடினமாகிறது.',
      'குறிப்பிடத்தக்க மனவேதனை உணர்வு தோன்றுகிறது.',
    ],
    professionalTitle: 'ஆதரவு கிடைக்கிறது',
    professionalText:
      'ஒரு மருத்துவச்சி, மருத்துவர், உளவியலாளர் அல்லது பிற சுகாதார நிபுணர் உங்களுக்குச் செவிகொடுத்து, நிலைமையை மதிப்பிட்டு, பொருத்தமான ஆதரவை வழங்க முடியும்.',
    tipTitle: 'தெரிந்துகொள்ளுங்கள்',
    tipText:
      'பிரசவத்துக்குப் பிந்தைய உணர்வுகள் நீங்கள் எவ்வளவு நல்ல தாய் என்பதன் அளவீடு அல்ல. உங்களுக்கு ஓய்வு தேவைப்படவும், கேட்கப்படவும், ஆதரிக்கப்படவும் உரிமை உண்டு.',
    section6Kicker: 'முக்கியப் புள்ளிகள்',
    section6Title: 'முக்கியக் குறிப்புகள்',
    takeaways: [
      'பேபி ப்ளூஸ் பிரசவத்துக்குப் பின் பொதுவானது.',
      'சோர்வும் ஹார்மோன் மாற்றங்களும் மனநிலையைப் பாதிக்கலாம்.',
      'உங்களைச் சுற்றியுள்ளவர்களின் ஆதரவு இந்தக் காலத்தை எளிதாக்கலாம்.',
      'தொடரும் அல்லது குறிப்பிடத்தக்க மனவேதனை தொழில்முறை மதிப்பீட்டுக்கு உரியது.',
    ],
    disclaimerText:
      'இந்தக் கட்டுரை தகவலுக்கானது, தனிப்பயன் மருத்துவ ஆலோசனைக்கு மாற்றல்ல. சந்தேகம் இருந்தால் அல்லது குறிப்பிடத்தக்க மனவேதனை இருந்தால், சுகாதார நிபுணரிடம் பேசுங்கள்.',
    endText: 'உங்களைக் கவனித்துக்கொள்வதும் பிரசவத்துக்குப் பிந்தைய காலத்தின் ஒரு பகுதியே.',
    shareTitle: 'பேபி ப்ளூஸும் பிரசவத்துக்குப் பிந்தைய உணர்வு ஆரோக்கியமும்',
    shareMessage:
      'பேபி ப்ளூஸும் பிரசவத்துக்குப் பிந்தைய உணர்வு ஆரோக்கியமும் — AWA\n\nபிரசவத்துக்குப் பின் பொதுவாக ஏற்படும் உணர்வு மாற்றங்களைப் புரிந்துகொள்ள ஒரு வழிகாட்டி.',
  },
  te: {
    badgeText: 'ప్రసవానంతరం • భావోద్వేగ ఆరోగ్యం',
    title: 'బేబీ బ్లూస్ & ప్రసవానంతర\nభావోద్వేగ ఆరోగ్యం',
    subtitle:
      'ప్రసవం తర్వాత భావోద్వేగపరంగా ఏమి మారవచ్చో అర్థం చేసుకోవడం, ఎప్పుడు ఆదరణ కోరాలో తెలుసుకోవడం.',
    metaItems: ['10 నిమిషాల పఠనం', 'వ్యాసం', 'ప్రారంభ స్థాయి', 'మదింపు చేసిన కంటెంట్'],
    introTitle: 'తెలుసుకోవాల్సినవి',
    introText:
      'ప్రసవం తర్వాత భావోద్వేగ సున్నితత్వం పెరిగే కాలాన్ని దాటడం సాధారణం. బేబీ బ్లూస్ సాధారణంగా తాత్కాలికం, కానీ కొనసాగే లేదా తీవ్రమయ్యే బాధకు నిపుణుల శ్రద్ధ అవసరం.',
    contentsEyebrow: 'గైడ్',
    contentsTitle: 'ఈ వ్యాసంలో',
    contents: [
      'బేబీ బ్లూస్‌ను అర్థం చేసుకోవడం',
      'అత్యంత సాధారణ సంకేతాలు',
      'రోజువారీ జీవితంలో ఏది సహాయపడుతుంది',
      'బేబీ బ్లూస్ లేదా ప్రసవానంతర కుంగుబాటు?',
      'సహాయాన్ని ఎప్పుడు కోరాలి',
      'ముఖ్యాంశాలు',
    ],
    section1Kicker: 'అర్థం చేసుకోవడం',
    section1Title: 'బేబీ బ్లూస్ అంటే ఏమిటి?',
    section1Body1:
      'బేబీ బ్లూస్ అనేది ప్రసవం తర్వాత మొదటి కొన్ని రోజుల్లో సంభవించగల భావోద్వేగ మార్పుల కాలం. హార్మోన్ల మార్పులు, అలసట, నిద్ర లేమి, ఈ కొత్త దశకు అలవాటు పడటం ఈ సున్నితత్వానికి కారణమవుతాయి.',
    section1Body2:
      'ఇది వైఫల్యం కాదు, మీరు చెడ్డ తల్లి అని కూడా అర్థం కాదు. ప్రసవానంతర మొదటి రోజులను ప్రతి ఒక్కరూ తమదైన రీతిలో అనుభవిస్తారు.',
    statTitle: 'ఒక సాధారణ అనుభవం',
    statText:
      'బేబీ బ్లూస్ ప్రసవం తర్వాత సాధారణం, కొన్ని రోజుల్లో తనంతట తానే మెరుగవుతుంది.',
    section2Kicker: 'సంకేతాలు',
    section2Title: 'మీకు అనిపించగలవి',
    section2Body:
      'అనుభవాలు మారుతూ ఉంటాయి. కొందరు ప్రధానంగా అలసటను, సున్నితత్వాన్ని అనుభవిస్తారు, మరికొందరికి మరింత స్పష్టమైన మానసిక స్థితి మార్పులు ఉండవచ్చు.',
    commonSigns: [
      {
        title: 'భావోద్వేగం',
        description: 'సులభంగా ఏడవడం లేదా ప్రత్యేకంగా సున్నితంగా అనిపించడం.',
      },
      {
        title: 'అతి సున్నితత్వం',
        description: 'భావోద్వేగాలు బలంగా అనిపించి వేగంగా మారవచ్చు.',
      },
      {
        title: 'మానసిక స్థితి ఊగిసలాట',
        description:
          'బలహీనత భావన, శ్రేయస్సు క్షణాలతో మారి మారి రావచ్చు.',
      },
      {
        title: 'అలసట',
        description: 'మొదటి రోజుల అలసట భావోద్వేగాలను పెంచవచ్చు.',
      },
    ],
    section3Kicker: 'రోజువారీ జీవితం',
    section3Title: 'ఏది సహాయపడగలదు',
    section3Body:
      'ఈ కాలంలో విశ్రాంతి అవసరం ఎక్కువగా ఉంటుంది. చిన్న, సరళమైన విషయాలు రోజులను మరింత సౌకర్యంగా మార్చగలవు.',
    dailySupport: [
      {
        title: 'విశ్రాంతి తీసుకోవడం',
        description: 'కోలుకోవడానికి ఏ ఖాళీ క్షణాన్నైనా ఉపయోగించుకోవడం.',
      },
      {
        title: 'సహాయాన్ని అంగీకరించడం',
        description: 'మీ చుట్టూ ఉన్నవారి తోడ్పాటును కోరడానికి వెనుకాడకండి.',
      },
      {
        title: 'క్రమం తప్పకుండా నీరు తాగడం',
        description: 'రోజంతా తగినంతగా నీటి శాతాన్ని కాపాడుకోవడం.',
      },
      {
        title: 'తగినంత తినడం',
        description: 'క్రమమైన, సరళమైన భోజనాలకు ప్రాధాన్యం ఇవ్వడం.',
      },
    ],
    quoteText:
      '“ప్రసవానంతర కాలంలో సహాయం కోరడం మిమ్మల్ని, మీ శిశువును మీరు చూసుకునే ఒక మార్గం.”',
    section4Kicker: 'వేరుచేసి చూడటం',
    section4Title: 'బేబీ బ్లూస్ లేదా ప్రసవానంతర కుంగుబాటు?',
    section4Body:
      'బేబీ బ్లూస్ సాధారణంగా కొద్దికాలమే ఉండి క్రమంగా మెరుగవుతుంది. ప్రసవానంతర కుంగుబాటు భిన్నమైనది: అది ఎక్కువ కాలం కొనసాగవచ్చు, మరింత తీవ్రంగా ఉండవచ్చు, రోజువారీ జీవితంపై గణనీయమైన ప్రభావం చూపవచ్చు.',
    compareTitle: 'వేరుచేసి చూడాల్సిన రెండు పరిస్థితులు',
    compareBabyBluesTitle: 'బేబీ బ్లూస్',
    compareBabyBluesText:
      'తరచుగా కొద్దికాలమే, తర్వాతి రోజుల్లో క్రమంగా మెరుగుపడుతుంది.',
    comparePostpartumTitle: 'ప్రసవానంతర కుంగుబాటు',
    comparePostpartumText:
      'ఎక్కువ కాలం కొనసాగవచ్చు, తీవ్రమవ్వచ్చు, నిపుణుల తోడ్పాటు అవసరం కావచ్చు.',
    section5Kicker: 'అప్రమత్తంగా ఉండటం',
    section5Title: 'సహాయాన్ని ఎప్పుడు కోరాలి?',
    section5Body:
      'భావోద్వేగ బాధ మెరుగుపడకపోతే, మరింత తీవ్రమైతే లేదా రోజువారీ జీవితాన్ని కష్టతరం చేయడం మొదలుపెడితే ఒక ఆరోగ్య నిపుణుడితో మాట్లాడటం ముఖ్యం.',
    attentionTitle: 'గమనించాల్సిన హెచ్చరిక సంకేతాలు',
    attentionSubtitle: 'ఇవి ఉంటే ఒక నిపుణుడితో మాట్లాడండి…',
    attentionSigns: [
      'లక్షణాలు రెండు వారాలకు మించి కొనసాగుతున్నాయి.',
      'విచారం లేదా ఆందోళన మరింత తీవ్రమవుతోంది.',
      'మిమ్మల్ని లేదా మీ శిశువును చూసుకోవడం కష్టంగా మారుతోంది.',
      'తీవ్రమైన బాధ భావన కలుగుతోంది.',
    ],
    professionalTitle: 'తోడ్పాటు అందుబాటులో ఉంది',
    professionalText:
      'ఒక మంత్రసాని, వైద్యులు, మనస్తత్వవేత్త లేదా ఇతర ఆరోగ్య నిపుణులు మీ మాట వినగలరు, పరిస్థితిని మదింపు చేయగలరు, తగిన తోడ్పాటును అందించగలరు.',
    tipTitle: 'తెలుసుకోవాల్సినవి',
    tipText:
      'ప్రసవానంతర భావోద్వేగాలు మీరు ఎంత మంచి తల్లి అనేదానికి కొలమానం కాదు. మీకు విశ్రాంతి అవసరం కావడానికి, మీ మాట వినబడటానికి, మీకు తోడ్పాటు లభించడానికి మీకు హక్కు ఉంది.',
    section6Kicker: 'ముఖ్యాంశాలు',
    section6Title: 'ముఖ్యమైన విషయాలు',
    takeaways: [
      'బేబీ బ్లూస్ ప్రసవం తర్వాత సాధారణం.',
      'అలసట, హార్మోన్ల మార్పులు మానసిక స్థితిని ప్రభావితం చేయవచ్చు.',
      'మీ చుట్టూ ఉన్నవారి తోడ్పాటు ఈ కాలాన్ని సులభతరం చేయగలదు.',
      'కొనసాగే లేదా గణనీయమైన బాధకు నిపుణుల మదింపు అవసరం.',
    ],
    disclaimerText:
      'ఈ వ్యాసం సమాచారం కోసం మాత్రమే, వ్యక్తిగత వైద్య సలహాకు ప్రత్యామ్నాయం కాదు. సందేహం ఉంటే లేదా గణనీయమైన బాధను అనుభవిస్తే, ఒక ఆరోగ్య నిపుణుడితో మాట్లాడండి.',
    endText: 'మిమ్మల్ని మీరు చూసుకోవడం కూడా ప్రసవానంతర కాలంలో భాగమే.',
    shareTitle: 'బేబీ బ్లూస్ & ప్రసవానంతర భావోద్వేగ ఆరోగ్యం',
    shareMessage:
      'బేబీ బ్లూస్ & ప్రసవానంతర భావోద్వేగ ఆరోగ్యం — AWA\n\nప్రసవం తర్వాత సాధారణంగా కనిపించే భావోద్వేగ మార్పులను అర్థం చేసుకోవడానికి ఒక గైడ్.',
  },
  mr: {
    badgeText: 'प्रसूतीनंतर • भावनिक आरोग्य',
    title: 'बेबी ब्लूज आणि प्रसूतीनंतरचे\nभावनिक आरोग्य',
    subtitle:
      'प्रसूतीनंतर भावनिकदृष्ट्या काय बदलू शकते ते समजून घेणे आणि आधार केव्हा घ्यावा हे जाणणे.',
    metaItems: ['10 मिनिटे वाचन', 'लेख', 'प्रारंभ स्तर', 'पुनरावलोकन केलेला मजकूर'],
    introTitle: 'हे जाणून घ्या',
    introText:
      'बाळाला जन्म दिल्यानंतर भावनिक संवेदनशीलता वाढण्याचा काळ येणे सामान्य आहे. बेबी ब्लूज सहसा तात्पुरते असते, पण कायम राहणाऱ्या किंवा वाढत जाणाऱ्या त्रासाकडे व्यावसायिकांनी लक्ष देणे गरजेचे आहे.',
    contentsEyebrow: 'मार्गदर्शक',
    contentsTitle: 'या लेखात',
    contents: [
      'बेबी ब्लूज समजून घेणे',
      'सर्वात सामान्य चिन्हे',
      'रोजच्या जीवनात काय मदत करते',
      'बेबी ब्लूज की प्रसूतीनंतरचे नैराश्य?',
      'मदत केव्हा मागावी',
      'मुख्य मुद्दे',
    ],
    section1Kicker: 'समजून घेणे',
    section1Title: 'बेबी ब्लूज म्हणजे काय?',
    section1Body1:
      'बेबी ब्लूज म्हणजे बाळाला जन्म दिल्यानंतरच्या पहिल्या काही दिवसांत येऊ शकणारा भावनिक बदलांचा काळ. हार्मोनल बदल, थकवा, झोपेची कमतरता आणि या नव्या टप्प्याशी जुळवून घेणे या सर्वांमुळे ही संवेदनशीलता वाढू शकते.',
    section1Body2:
      'हे अपयश नाही आणि तुम्ही वाईट आई आहात असा याचा अर्थ नाही. प्रत्येकजण प्रसूतीनंतरचे पहिले दिवस आपापल्या पद्धतीने अनुभवतो.',
    statTitle: 'एक सामान्य अनुभव',
    statText:
      'बाळंतपणानंतर बेबी ब्लूज सामान्य आहे आणि ते काही दिवसांत आपोआप कमी होण्याकडे कल असतो.',
    section2Kicker: 'चिन्हे',
    section2Title: 'तुम्हाला काय जाणवू शकते',
    section2Body:
      'लोकांचा अनुभव वेगवेगळा असतो. काहींना प्रामुख्याने थकवा आणि संवेदनशीलता जाणवते, तर इतरांना मनःस्थितीतील अधिक ठळक बदल जाणवू शकतात.',
    commonSigns: [
      {
        title: 'भावूकपणा',
        description: 'सहज रडू येणे किंवा विशेष संवेदनशील वाटणे.',
      },
      {
        title: 'अतिसंवेदनशीलता',
        description: 'भावना अधिक तीव्र वाटू शकतात आणि झपाट्याने बदलू शकतात.',
      },
      {
        title: 'मनःस्थितीतील चढ-उतार',
        description:
          'नाजूकपणाची भावना आणि बरे वाटण्याचे क्षण आलटून पालटून येऊ शकतात.',
      },
      {
        title: 'थकवा',
        description: 'पहिल्या दिवसांचा थकवा भावना आणखी वाढवू शकतो.',
      },
    ],
    section3Kicker: 'रोजच्या जीवनात',
    section3Title: 'काय मदत करू शकते',
    section3Body:
      'या काळात विश्रांतीची गरज मोठी असते. छोट्या, साध्या गोष्टी दिवस अधिक आरामदायी करू शकतात.',
    dailySupport: [
      {
        title: 'विश्रांती घेणे',
        description: 'मिळणाऱ्या प्रत्येक मोकळ्या क्षणाचा बरे होण्यासाठी उपयोग करणे.',
      },
      {
        title: 'मदत स्वीकारणे',
        description: 'आजूबाजूच्या लोकांकडे आधार मागायला संकोच करू नका.',
      },
      {
        title: 'नियमित पाणी पिणे',
        description: 'दिवसभर पुरेसे पाणी पित राहणे.',
      },
      {
        title: 'पुरेसे खाणे',
        description: 'नियमित, साध्या जेवणांना प्राधान्य देणे.',
      },
    ],
    quoteText:
      '“प्रसूतीनंतर मदत मागणे हा स्वतःची आणि तुमच्या बाळाची काळजी घेण्याचा एक मार्ग आहे.”',
    section4Kicker: 'फरक ओळखणे',
    section4Title: 'बेबी ब्लूज की प्रसूतीनंतरचे नैराश्य?',
    section4Body:
      'बेबी ब्लूज सहसा थोडक्या काळाचे असते आणि हळूहळू सुधारते. प्रसूतीनंतरचे नैराश्य वेगळे असते: ते अधिक काळ टिकणारे, अधिक तीव्र असू शकते आणि रोजच्या जीवनावर लक्षणीय परिणाम करू शकते.',
    compareTitle: 'ओळखायच्या दोन परिस्थिती',
    compareBabyBluesTitle: 'बेबी ब्लूज',
    compareBabyBluesText:
      'बहुतेकदा थोडक्या काळाचे, पुढील दिवसांत हळूहळू सुधारणा होणारे.',
    comparePostpartumTitle: 'प्रसूतीनंतरचे नैराश्य',
    comparePostpartumText:
      'अधिक काळ टिकू शकते, तीव्र होऊ शकते आणि व्यावसायिक आधाराची गरज भासू शकते.',
    section5Kicker: 'सजग राहणे',
    section5Title: 'मदत केव्हा मागावी?',
    section5Body:
      'भावनिक त्रास कमी होत नसेल, अधिक तीव्र होत असेल किंवा रोजचे जीवन कठीण करू लागला असेल, तर आरोग्य व्यावसायिकाशी बोलणे महत्त्वाचे आहे.',
    attentionTitle: 'लक्षात ठेवायची धोक्याची चिन्हे',
    attentionSubtitle: 'यापैकी काही असल्यास तज्ज्ञाशी बोला…',
    attentionSigns: [
      'लक्षणे दोन आठवड्यांपेक्षा जास्त टिकतात.',
      'दुःख किंवा चिंता अधिक तीव्र होते.',
      'स्वतःची किंवा बाळाची काळजी घेणे कठीण होते.',
      'त्रासाची लक्षणीय भावना निर्माण होते.',
    ],
    professionalTitle: 'आधार उपलब्ध आहे',
    professionalText:
      'दाई, डॉक्टर, मानसशास्त्रज्ञ किंवा इतर आरोग्य व्यावसायिक तुमचे ऐकू शकतात, परिस्थितीचे मूल्यांकन करू शकतात आणि योग्य आधार देऊ शकतात.',
    tipTitle: 'हे जाणून घ्या',
    tipText:
      'प्रसूतीनंतरच्या भावना तुम्ही किती चांगली आई आहात याचे मोजमाप नाहीत. तुम्हाला विश्रांतीची गरज असण्याचा, ऐकले जाण्याचा आणि आधार मिळण्याचा हक्क आहे.',
    section6Kicker: 'मुख्य मुद्दे',
    section6Title: 'मुख्य मुद्दे',
    takeaways: [
      'बाळाला जन्म दिल्यानंतर बेबी ब्लूज सामान्य आहे.',
      'थकवा आणि हार्मोनल बदल मनःस्थितीवर परिणाम करू शकतात.',
      'आजूबाजूच्या लोकांचा आधार हा काळ सोपा करू शकतो.',
      'कायम राहणाऱ्या किंवा लक्षणीय त्रासाचे व्यावसायिक मूल्यांकन होणे गरजेचे आहे.',
    ],
    disclaimerText:
      'हा लेख माहितीसाठी आहे आणि वैयक्तिक वैद्यकीय सल्ल्याची जागा घेत नाही. शंका असल्यास किंवा लक्षणीय त्रास होत असल्यास, आरोग्य व्यावसायिकाशी बोला.',
    endText: 'स्वतःची काळजी घेणे हा देखील प्रसूतीनंतरचा भाग आहे.',
    shareTitle: 'बेबी ब्लूज आणि प्रसूतीनंतरचे भावनिक आरोग्य',
    shareMessage:
      'बेबी ब्लूज आणि प्रसूतीनंतरचे भावनिक आरोग्य — AWA\n\nबाळाला जन्म दिल्यानंतर सामान्य असलेले भावनिक बदल समजून घेण्यासाठी एक मार्गदर्शक.',
  },
  gu: {
    badgeText: 'પ્રસૂતિ પછી • ભાવનાત્મક સ્વાસ્થ્ય',
    title: 'બેબી બ્લૂઝ અને પ્રસૂતિ પછીનું\nભાવનાત્મક સ્વાસ્થ્ય',
    subtitle:
      'પ્રસૂતિ પછી ભાવનાત્મક રીતે શું બદલાઈ શકે છે તે સમજવું અને ક્યારે મદદ લેવી તે જાણવું.',
    metaItems: ['10 મિનિટ વાંચન', 'લેખ', 'પ્રારંભિક સ્તર', 'પુનરાવલોકન કરેલી સામગ્રી'],
    introTitle: 'જાણવા જેવું',
    introText:
      'બાળકને જન્મ આપ્યા પછી થોડો સમય લાગણીઓ વધુ સંવેદનશીલ બને તે સામાન્ય છે. બેબી બ્લૂઝ સામાન્ય રીતે કામચલાઉ હોય છે, પરંતુ જે તકલીફ ચાલુ રહે કે વધતી જાય તેના માટે વ્યાવસાયિક ધ્યાન જરૂરી છે.',
    contentsEyebrow: 'માર્ગદર્શિકા',
    contentsTitle: 'આ લેખમાં',
    contents: [
      'બેબી બ્લૂઝને સમજવું',
      'સૌથી સામાન્ય લક્ષણો',
      'રોજિંદા જીવનમાં શું મદદ કરે છે',
      'બેબી બ્લૂઝ કે પ્રસૂતિ પછીનો હતાશા?',
      'ક્યારે મદદ માગવી',
      'મુખ્ય મુદ્દા',
    ],
    section1Kicker: 'સમજણ',
    section1Title: 'બેબી બ્લૂઝ એટલે શું?',
    section1Body1:
      'બેબી બ્લૂઝ એ પ્રસૂતિ પછીના પહેલા થોડા દિવસોમાં થઈ શકતા ભાવનાત્મક ફેરફારોનો સમયગાળો છે. હોર્મોનમાં ફેરફાર, થાક, ઊંઘની ઉણપ અને જીવનના આ નવા તબક્કા સાથે ગોઠવાવું, આ બધું આ સંવેદનશીલતામાં ફાળો આપી શકે છે.',
    section1Body2:
      'આ કોઈ નિષ્ફળતા નથી અને તેનો અર્થ એવો નથી કે તમે સારી માતા નથી. પ્રસૂતિ પછીના પહેલા દિવસો દરેક સ્ત્રી પોતાની રીતે અનુભવે છે.',
    statTitle: 'એક સામાન્ય અનુભવ',
    statText:
      'પ્રસૂતિ પછી બેબી બ્લૂઝ સામાન્ય છે અને સામાન્ય રીતે થોડા દિવસોમાં જાતે સુધરી જાય છે.',
    section2Kicker: 'લક્ષણો',
    section2Title: 'તમે શું અનુભવી શકો',
    section2Body:
      'અનુભવ દરેકનો અલગ હોય છે. કેટલીક સ્ત્રીઓને મુખ્યત્વે થાક અને સંવેદનશીલતા લાગે છે, જ્યારે બીજી સ્ત્રીઓમાં મૂડમાં વધુ નોંધપાત્ર ફેરફારો જોવા મળી શકે છે.',
    commonSigns: [
      {
        title: 'ભાવુકતા',
        description: 'વધુ સહેલાઈથી રડવું કે ખાસ સંવેદનશીલ લાગવું.',
      },
      {
        title: 'અતિસંવેદનશીલતા',
        description: 'લાગણીઓ વધુ તીવ્ર લાગી શકે અને ઝડપથી બદલાઈ શકે.',
      },
      {
        title: 'મૂડમાં ઉતાર-ચઢાવ',
        description:
          'નાજુકતાની લાગણી અને સારું લાગવાની ક્ષણો વારાફરતી આવી શકે.',
      },
      {
        title: 'થાક',
        description: 'પહેલા દિવસોનો થાક લાગણીઓને વધુ તીવ્ર બનાવી શકે.',
      },
    ],
    section3Kicker: 'રોજિંદા જીવનમાં',
    section3Title: 'શું મદદ કરી શકે',
    section3Body:
      'આ સમયગાળામાં આરામની જરૂર ઘણી વધારે હોય છે. નાની અને સરળ બાબતો દિવસોને વધુ સહ્ય બનાવી શકે છે.',
    dailySupport: [
      {
        title: 'આરામ કરવો',
        description: 'ખાલી સમય મળે ત્યારે સ્વસ્થ થવા માટે તેનો લાભ લેવો.',
      },
      {
        title: 'મદદ સ્વીકારવી',
        description: 'આસપાસના લોકો પાસે સહારો માગતા અચકાશો નહીં.',
      },
      {
        title: 'નિયમિત પાણી પીવું',
        description: 'આખા દિવસ દરમિયાન પૂરતું પાણી પીતા રહેવું.',
      },
      {
        title: 'પૂરતું ખાવું',
        description: 'નિયમિત અને સાદા ભોજનને પ્રાથમિકતા આપવી.',
      },
    ],
    quoteText:
      '“પ્રસૂતિ પછી મદદ માગવી એ તમારી અને તમારા બાળકની કાળજી લેવાનો એક રસ્તો છે.”',
    section4Kicker: 'તફાવત ઓળખવો',
    section4Title: 'બેબી બ્લૂઝ કે પ્રસૂતિ પછીનો હતાશા?',
    section4Body:
      'બેબી બ્લૂઝ સામાન્ય રીતે ટૂંકા સમયનો હોય છે અને ધીમે ધીમે સુધરે છે. પ્રસૂતિ પછીનો હતાશા અલગ છે: તે વધુ લાંબો ચાલી શકે, વધુ તીવ્ર હોઈ શકે અને રોજિંદા જીવન પર નોંધપાત્ર અસર કરી શકે.',
    compareTitle: 'ફરક કરવા જેવી બે પરિસ્થિતિઓ',
    compareBabyBluesTitle: 'બેબી બ્લૂઝ',
    compareBabyBluesText:
      'ઘણી વાર ટૂંકા સમયનો, પછીના દિવસોમાં ધીમે ધીમે સુધારા સાથે.',
    comparePostpartumTitle: 'પ્રસૂતિ પછીનો હતાશા',
    comparePostpartumText:
      'વધુ લાંબો ચાલી શકે, તીવ્ર બની શકે અને વ્યાવસાયિક સહાયની જરૂર પડી શકે.',
    section5Kicker: 'સજાગ રહેવું',
    section5Title: 'ક્યારે મદદ માગવી?',
    section5Body:
      'જો ભાવનાત્મક તકલીફ સુધરતી ન હોય, વધુ તીવ્ર બને અથવા રોજિંદા જીવનને મુશ્કેલ બનાવવા લાગે, તો આરોગ્ય વ્યાવસાયિક સાથે વાત કરવી મહત્વપૂર્ણ છે.',
    attentionTitle: 'ધ્યાન આપવા જેવા ચેતવણીના સંકેતો',
    attentionSubtitle: 'આ સ્થિતિમાં વ્યાવસાયિક સાથે વાત કરો…',
    attentionSigns: [
      'લક્ષણો બે અઠવાડિયાથી વધુ ચાલે.',
      'ઉદાસી કે ચિંતા વધુ તીવ્ર બને.',
      'તમારી પોતાની કે બાળકની સંભાળ રાખવી મુશ્કેલ બને.',
      'ભારે તકલીફની લાગણી ઊભી થાય.',
    ],
    professionalTitle: 'સહાય ઉપલબ્ધ છે',
    professionalText:
      'મિડવાઇફ, ડૉક્ટર, મનોવૈજ્ઞાનિક કે અન્ય આરોગ્ય વ્યાવસાયિક તમને સાંભળી શકે, પરિસ્થિતિનું મૂલ્યાંકન કરી શકે અને યોગ્ય સહાય આપી શકે.',
    tipTitle: 'જાણવા જેવું',
    tipText:
      'પ્રસૂતિ પછીની લાગણીઓ તમે કેટલી સારી માતા છો તેનું માપ નથી. તમને આરામની, સાંભળવામાં આવવાની અને સહારો મળવાની જરૂર હોવાનો હક છે.',
    section6Kicker: 'મુખ્ય બિંદુઓ',
    section6Title: 'મુખ્ય મુદ્દા',
    takeaways: [
      'પ્રસૂતિ પછી બેબી બ્લૂઝ સામાન્ય છે.',
      'થાક અને હોર્મોનમાં ફેરફાર મૂડ પર અસર કરી શકે છે.',
      'આસપાસના લોકોનો સહારો આ સમયગાળાને સરળ બનાવી શકે છે.',
      'સતત રહેતી કે ભારે તકલીફનું વ્યાવસાયિક મૂલ્યાંકન કરાવવું જોઈએ.',
    ],
    disclaimerText:
      'આ લેખ માહિતી માટે છે અને તે વ્યક્તિગત તબીબી સલાહનું સ્થાન લેતો નથી. શંકા હોય અથવા ભારે તકલીફ અનુભવાતી હોય તો આરોગ્ય વ્યાવસાયિક સાથે વાત કરો.',
    endText: 'તમારી પોતાની કાળજી લેવી એ પણ પ્રસૂતિ પછીના સમયનો એક ભાગ છે.',
    shareTitle: 'બેબી બ્લૂઝ અને પ્રસૂતિ પછીનું ભાવનાત્મક સ્વાસ્થ્ય',
    shareMessage:
      'બેબી બ્લૂઝ અને પ્રસૂતિ પછીનું ભાવનાત્મક સ્વાસ્થ્ય — AWA\n\nપ્રસૂતિ પછી સામાન્ય રીતે થતા ભાવનાત્મક ફેરફારોને સમજવા માટેની માર્ગદર્શિકા.',
  },
  pa: {
    badgeText: 'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ • ਭਾਵਨਾਤਮਕ ਸਿਹਤ',
    title: 'ਬੇਬੀ ਬਲੂਜ਼ ਅਤੇ ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ\nਭਾਵਨਾਤਮਕ ਸਿਹਤ',
    subtitle:
      'ਸਮਝੋ ਕਿ ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਭਾਵਨਾਵਾਂ ਵਿੱਚ ਕੀ ਬਦਲ ਸਕਦਾ ਹੈ ਅਤੇ ਸਹਾਰਾ ਕਦੋਂ ਲੈਣਾ ਚਾਹੀਦਾ ਹੈ।',
    metaItems: ['10 ਮਿੰਟ ਪੜ੍ਹਨ', 'ਲੇਖ', 'ਸ਼ੁਰੂਆਤੀ ਪੱਧਰ', 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ'],
    introTitle: 'ਜਾਣਨ ਯੋਗ',
    introText:
      'ਬੱਚੇ ਨੂੰ ਜਨਮ ਦੇਣ ਤੋਂ ਬਾਅਦ ਕੁਝ ਸਮੇਂ ਲਈ ਭਾਵਨਾਵਾਂ ਵਧੇਰੇ ਨਾਜ਼ੁਕ ਹੋ ਜਾਣਾ ਆਮ ਗੱਲ ਹੈ। ਬੇਬੀ ਬਲੂਜ਼ ਆਮ ਤੌਰ ’ਤੇ ਅਸਥਾਈ ਹੁੰਦਾ ਹੈ, ਪਰ ਜੋ ਪਰੇਸ਼ਾਨੀ ਬਣੀ ਰਹੇ ਜਾਂ ਵਧਦੀ ਜਾਵੇ, ਉਸ ਵੱਲ ਮਾਹਿਰ ਦਾ ਧਿਆਨ ਜ਼ਰੂਰੀ ਹੈ।',
    contentsEyebrow: 'ਗਾਈਡ',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    contents: [
      'ਬੇਬੀ ਬਲੂਜ਼ ਨੂੰ ਸਮਝਣਾ',
      'ਸਭ ਤੋਂ ਆਮ ਲੱਛਣ',
      'ਰੋਜ਼ਾਨਾ ਕੀ ਮਦਦ ਕਰਦਾ ਹੈ',
      'ਬੇਬੀ ਬਲੂਜ਼ ਜਾਂ ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਦੀ ਉਦਾਸੀ?',
      'ਮਦਦ ਕਦੋਂ ਮੰਗਣੀ ਹੈ',
      'ਮੁੱਖ ਨੁਕਤੇ',
    ],
    section1Kicker: 'ਸਮਝ',
    section1Title: 'ਬੇਬੀ ਬਲੂਜ਼ ਕੀ ਹੈ?',
    section1Body1:
      'ਬੇਬੀ ਬਲੂਜ਼ ਭਾਵਨਾਵਾਂ ਵਿੱਚ ਤਬਦੀਲੀਆਂ ਦਾ ਇੱਕ ਦੌਰ ਹੈ ਜੋ ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਪਹਿਲੇ ਕੁਝ ਦਿਨਾਂ ਵਿੱਚ ਆ ਸਕਦਾ ਹੈ। ਹਾਰਮੋਨ ਵਿੱਚ ਬਦਲਾਅ, ਥਕਾਵਟ, ਨੀਂਦ ਦੀ ਕਮੀ ਅਤੇ ਇਸ ਨਵੇਂ ਪੜਾਅ ਨਾਲ ਤਾਲਮੇਲ ਬਿਠਾਉਣਾ, ਇਹ ਸਭ ਇਸ ਨਾਜ਼ੁਕ ਅਵਸਥਾ ਵਿੱਚ ਹਿੱਸਾ ਪਾ ਸਕਦੇ ਹਨ।',
    section1Body2:
      'ਇਹ ਕੋਈ ਅਸਫਲਤਾ ਨਹੀਂ ਹੈ ਅਤੇ ਇਸ ਦਾ ਇਹ ਮਤਲਬ ਨਹੀਂ ਕਿ ਤੁਸੀਂ ਮਾੜੀ ਮਾਂ ਹੋ। ਹਰ ਔਰਤ ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਦੇ ਪਹਿਲੇ ਦਿਨ ਆਪਣੇ ਢੰਗ ਨਾਲ ਗੁਜ਼ਾਰਦੀ ਹੈ।',
    statTitle: 'ਇੱਕ ਆਮ ਅਨੁਭਵ',
    statText:
      'ਬੇਬੀ ਬਲੂਜ਼ ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਆਮ ਹੈ ਅਤੇ ਕੁਝ ਦਿਨਾਂ ਵਿੱਚ ਆਪਣੇ ਆਪ ਠੀਕ ਹੋ ਜਾਂਦਾ ਹੈ।',
    section2Kicker: 'ਲੱਛਣ',
    section2Title: 'ਤੁਸੀਂ ਕੀ ਮਹਿਸੂਸ ਕਰ ਸਕਦੇ ਹੋ',
    section2Body:
      'ਹਰ ਕਿਸੇ ਦਾ ਅਨੁਭਵ ਵੱਖਰਾ ਹੁੰਦਾ ਹੈ। ਕੁਝ ਨੂੰ ਮੁੱਖ ਤੌਰ ’ਤੇ ਥਕਾਵਟ ਅਤੇ ਨਾਜ਼ੁਕਤਾ ਮਹਿਸੂਸ ਹੁੰਦੀ ਹੈ, ਜਦਕਿ ਹੋਰਨਾਂ ਦੇ ਮੂਡ ਵਿੱਚ ਵਧੇਰੇ ਸਾਫ਼ ਤਬਦੀਲੀਆਂ ਹੋ ਸਕਦੀਆਂ ਹਨ।',
    commonSigns: [
      {
        title: 'ਭਾਵੁਕਤਾ',
        description: 'ਆਸਾਨੀ ਨਾਲ ਰੋ ਪੈਣਾ ਜਾਂ ਖ਼ਾਸ ਤੌਰ ’ਤੇ ਨਾਜ਼ੁਕ ਮਹਿਸੂਸ ਕਰਨਾ।',
      },
      {
        title: 'ਬਹੁਤ ਜ਼ਿਆਦਾ ਸੰਵੇਦਨਸ਼ੀਲਤਾ',
        description: 'ਭਾਵਨਾਵਾਂ ਵਧੇਰੇ ਤੇਜ਼ ਲੱਗ ਸਕਦੀਆਂ ਹਨ ਅਤੇ ਜਲਦੀ ਬਦਲ ਸਕਦੀਆਂ ਹਨ।',
      },
      {
        title: 'ਮੂਡ ਦਾ ਉਤਾਰ-ਚੜ੍ਹਾਅ',
        description:
          'ਕਮਜ਼ੋਰੀ ਦਾ ਅਹਿਸਾਸ ਅਤੇ ਚੰਗਾ ਮਹਿਸੂਸ ਕਰਨ ਦੇ ਪਲ ਵਾਰੀ-ਵਾਰੀ ਆ ਸਕਦੇ ਹਨ।',
      },
      {
        title: 'ਥਕਾਵਟ',
        description: 'ਪਹਿਲੇ ਦਿਨਾਂ ਦੀ ਥਕਾਵਟ ਭਾਵਨਾਵਾਂ ਨੂੰ ਹੋਰ ਵਧਾ ਸਕਦੀ ਹੈ।',
      },
    ],
    section3Kicker: 'ਰੋਜ਼ਾਨਾ',
    section3Title: 'ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ',
    section3Body:
      'ਇਸ ਦੌਰ ਵਿੱਚ ਆਰਾਮ ਦੀ ਲੋੜ ਬਹੁਤ ਹੁੰਦੀ ਹੈ। ਛੋਟੀਆਂ ਅਤੇ ਸਾਦੀਆਂ ਗੱਲਾਂ ਦਿਨਾਂ ਨੂੰ ਵਧੇਰੇ ਸੁਖਾਲਾ ਬਣਾ ਸਕਦੀਆਂ ਹਨ।',
    dailySupport: [
      {
        title: 'ਆਰਾਮ ਕਰਨਾ',
        description: 'ਹਰ ਵਿਹਲੇ ਪਲ ਦਾ ਫ਼ਾਇਦਾ ਲੈ ਕੇ ਤਾਕਤ ਮੁੜ ਹਾਸਲ ਕਰਨਾ।',
      },
      {
        title: 'ਮਦਦ ਸਵੀਕਾਰ ਕਰਨਾ',
        description: 'ਆਪਣੇ ਆਲੇ-ਦੁਆਲੇ ਦੇ ਲੋਕਾਂ ਤੋਂ ਸਹਾਰਾ ਮੰਗਣ ਵਿੱਚ ਝਿਜਕ ਨਾ ਕਰੋ।',
      },
      {
        title: 'ਨਿਯਮਿਤ ਤੌਰ ’ਤੇ ਪਾਣੀ ਪੀਣਾ',
        description: 'ਦਿਨ ਭਰ ਸਰੀਰ ਵਿੱਚ ਪਾਣੀ ਦੀ ਕਾਫ਼ੀ ਮਾਤਰਾ ਬਣਾਈ ਰੱਖਣਾ।',
      },
      {
        title: 'ਕਾਫ਼ੀ ਖਾਣਾ',
        description: 'ਨਿਯਮਿਤ ਅਤੇ ਸਾਦੇ ਭੋਜਨ ਨੂੰ ਤਰਜੀਹ ਦੇਣਾ।',
      },
    ],
    quoteText:
      '“ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਮਦਦ ਮੰਗਣਾ ਆਪਣੀ ਅਤੇ ਆਪਣੇ ਬੱਚੇ ਦੀ ਦੇਖਭਾਲ ਕਰਨ ਦਾ ਇੱਕ ਤਰੀਕਾ ਹੈ।”',
    section4Kicker: 'ਫ਼ਰਕ ਪਛਾਣਨਾ',
    section4Title: 'ਬੇਬੀ ਬਲੂਜ਼ ਜਾਂ ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਦੀ ਉਦਾਸੀ?',
    section4Body:
      'ਬੇਬੀ ਬਲੂਜ਼ ਆਮ ਤੌਰ ’ਤੇ ਥੋੜ੍ਹੇ ਸਮੇਂ ਦਾ ਹੁੰਦਾ ਹੈ ਅਤੇ ਹੌਲੀ-ਹੌਲੀ ਠੀਕ ਹੋ ਜਾਂਦਾ ਹੈ। ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਦੀ ਉਦਾਸੀ ਵੱਖਰੀ ਹੈ: ਇਹ ਵਧੇਰੇ ਲੰਮੀ, ਵਧੇਰੇ ਤੀਬਰ ਹੋ ਸਕਦੀ ਹੈ ਅਤੇ ਰੋਜ਼ਾਨਾ ਜ਼ਿੰਦਗੀ ’ਤੇ ਵੱਡਾ ਅਸਰ ਪਾ ਸਕਦੀ ਹੈ।',
    compareTitle: 'ਦੋ ਹਾਲਾਤ ਜਿਨ੍ਹਾਂ ਵਿੱਚ ਫ਼ਰਕ ਕਰਨਾ ਹੈ',
    compareBabyBluesTitle: 'ਬੇਬੀ ਬਲੂਜ਼',
    compareBabyBluesText:
      'ਅਕਸਰ ਥੋੜ੍ਹੇ ਸਮੇਂ ਦਾ, ਅਗਲੇ ਦਿਨਾਂ ਵਿੱਚ ਹੌਲੀ-ਹੌਲੀ ਸੁਧਾਰ ਨਾਲ।',
    comparePostpartumTitle: 'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਦੀ ਉਦਾਸੀ',
    comparePostpartumText:
      'ਇਹ ਵੱਧ ਸਮਾਂ ਰਹਿ ਸਕਦੀ ਹੈ, ਵਧ ਸਕਦੀ ਹੈ ਅਤੇ ਮਾਹਿਰ ਦੇ ਸਹਾਰੇ ਦੀ ਲੋੜ ਪੈ ਸਕਦੀ ਹੈ।',
    section5Kicker: 'ਸੁਚੇਤ ਰਹਿਣਾ',
    section5Title: 'ਮਦਦ ਕਦੋਂ ਮੰਗਣੀ ਚਾਹੀਦੀ ਹੈ?',
    section5Body:
      'ਜੇ ਭਾਵਨਾਤਮਕ ਪਰੇਸ਼ਾਨੀ ਠੀਕ ਨਹੀਂ ਹੁੰਦੀ, ਵਧੇਰੇ ਤੀਬਰ ਹੋ ਜਾਂਦੀ ਹੈ ਜਾਂ ਰੋਜ਼ਾਨਾ ਜ਼ਿੰਦਗੀ ਨੂੰ ਔਖਾ ਬਣਾਉਣ ਲੱਗਦੀ ਹੈ, ਤਾਂ ਸਿਹਤ ਮਾਹਿਰ ਨਾਲ ਗੱਲ ਕਰਨਾ ਜ਼ਰੂਰੀ ਹੈ।',
    attentionTitle: 'ਧਿਆਨ ਦੇਣ ਯੋਗ ਚੇਤਾਵਨੀ ਦੇ ਸੰਕੇਤ',
    attentionSubtitle: 'ਮਾਹਿਰ ਨਾਲ ਗੱਲ ਕਰੋ ਜੇ…',
    attentionSigns: [
      'ਲੱਛਣ ਦੋ ਹਫ਼ਤਿਆਂ ਤੋਂ ਵੱਧ ਰਹਿਣ।',
      'ਉਦਾਸੀ ਜਾਂ ਚਿੰਤਾ ਹੋਰ ਤੀਬਰ ਹੋ ਜਾਵੇ।',
      'ਆਪਣੀ ਜਾਂ ਆਪਣੇ ਬੱਚੇ ਦੀ ਦੇਖਭਾਲ ਕਰਨਾ ਔਖਾ ਹੋ ਜਾਵੇ।',
      'ਪਰੇਸ਼ਾਨੀ ਦਾ ਡੂੰਘਾ ਅਹਿਸਾਸ ਪੈਦਾ ਹੋਵੇ।',
    ],
    professionalTitle: 'ਸਹਾਰਾ ਮੌਜੂਦ ਹੈ',
    professionalText:
      'ਮਿਡਵਾਈਫ਼, ਡਾਕਟਰ, ਮਨੋਵਿਗਿਆਨੀ ਜਾਂ ਕੋਈ ਹੋਰ ਸਿਹਤ ਮਾਹਿਰ ਤੁਹਾਨੂੰ ਸੁਣ ਸਕਦਾ ਹੈ, ਹਾਲਾਤ ਦਾ ਜਾਇਜ਼ਾ ਲੈ ਸਕਦਾ ਹੈ ਅਤੇ ਢੁਕਵਾਂ ਸਹਾਰਾ ਦੇ ਸਕਦਾ ਹੈ।',
    tipTitle: 'ਜਾਣਨ ਯੋਗ',
    tipText:
      'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਦੀਆਂ ਭਾਵਨਾਵਾਂ ਇਹ ਨਹੀਂ ਮਾਪਦੀਆਂ ਕਿ ਤੁਸੀਂ ਕਿੰਨੀ ਚੰਗੀ ਮਾਂ ਹੋ। ਤੁਹਾਨੂੰ ਆਰਾਮ ਦੀ ਲੋੜ ਹੋਣ, ਸੁਣੇ ਜਾਣ ਅਤੇ ਸਹਾਰਾ ਮਿਲਣ ਦਾ ਪੂਰਾ ਹੱਕ ਹੈ।',
    section6Kicker: 'ਅਹਿਮ ਗੱਲਾਂ',
    section6Title: 'ਮੁੱਖ ਨੁਕਤੇ',
    takeaways: [
      'ਬੇਬੀ ਬਲੂਜ਼ ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਆਮ ਹੈ।',
      'ਥਕਾਵਟ ਅਤੇ ਹਾਰਮੋਨ ਦੀਆਂ ਤਬਦੀਲੀਆਂ ਮੂਡ ’ਤੇ ਅਸਰ ਪਾ ਸਕਦੀਆਂ ਹਨ।',
      'ਆਲੇ-ਦੁਆਲੇ ਦੇ ਲੋਕਾਂ ਦਾ ਸਹਾਰਾ ਇਸ ਦੌਰ ਨੂੰ ਸੌਖਾ ਬਣਾ ਸਕਦਾ ਹੈ।',
      'ਲਗਾਤਾਰ ਜਾਂ ਡੂੰਘੀ ਪਰੇਸ਼ਾਨੀ ਦਾ ਮਾਹਿਰ ਵੱਲੋਂ ਜਾਇਜ਼ਾ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ।',
    ],
    disclaimerText:
      'ਇਹ ਲੇਖ ਜਾਣਕਾਰੀ ਲਈ ਹੈ ਅਤੇ ਨਿੱਜੀ ਡਾਕਟਰੀ ਸਲਾਹ ਦੀ ਥਾਂ ਨਹੀਂ ਲੈਂਦਾ। ਸ਼ੱਕ ਹੋਣ ’ਤੇ ਜਾਂ ਡੂੰਘੀ ਪਰੇਸ਼ਾਨੀ ਮਹਿਸੂਸ ਹੋਣ ’ਤੇ ਕਿਸੇ ਸਿਹਤ ਮਾਹਿਰ ਨਾਲ ਗੱਲ ਕਰੋ।',
    endText: 'ਆਪਣਾ ਖ਼ਿਆਲ ਰੱਖਣਾ ਵੀ ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਦੇ ਦੌਰ ਦਾ ਹਿੱਸਾ ਹੈ।',
    shareTitle: 'ਬੇਬੀ ਬਲੂਜ਼ ਅਤੇ ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਭਾਵਨਾਤਮਕ ਸਿਹਤ',
    shareMessage:
      'ਬੇਬੀ ਬਲੂਜ਼ ਅਤੇ ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਭਾਵਨਾਤਮਕ ਸਿਹਤ — AWA\n\nਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਆਮ ਤੌਰ ’ਤੇ ਹੋਣ ਵਾਲੀਆਂ ਭਾਵਨਾਤਮਕ ਤਬਦੀਲੀਆਂ ਨੂੰ ਸਮਝਣ ਲਈ ਇੱਕ ਗਾਈਡ।',
  },
  my: {
    badgeText: 'ကလေးမွေးပြီးနောက် • စိတ်ခံစားမှု ကျန်းမာရေး',
    title: 'မီးဖွားပြီး စိတ်ဓာတ်ကျခြင်းနှင့်\nမီးဖွားပြီးနောက် စိတ်ခံစားမှု ကျန်းမာရေး',
    subtitle:
      'ကလေးမွေးပြီးနောက် စိတ်ခံစားမှုတွင် ပြောင်းလဲနိုင်သည့်အရာများကို နားလည်ပြီး အကူအညီမည်သည့်အချိန်တွင် ရှာသင့်သည်ကို သိရှိရန်။',
    metaItems: ['ဖတ်ချိန် 10 မိနစ်', 'ဆောင်းပါး', 'အခြေခံအဆင့်', 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ'],
    introTitle: 'သိထားသင့်သည်',
    introText:
      'ကလေးမွေးပြီးနောက် စိတ်ခံစားမှု ပိုမိုထိခိုက်လွယ်သော ကာလကို ကြုံတွေ့ရတတ်ခြင်းမှာ အဖြစ်များသည်။ မီးဖွားပြီး စိတ်ဓာတ်ကျခြင်းသည် များသောအားဖြင့် ယာယီသာဖြစ်သော်လည်း ဆက်လက်ဖြစ်နေသော သို့မဟုတ် ပိုမိုပြင်းထန်လာသော စိတ်ဆင်းရဲမှုကို ပညာရှင်၏ ဂရုစိုက်မှု လိုအပ်သည်။',
    contentsEyebrow: 'လမ်းညွှန်',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    contents: [
      'မီးဖွားပြီး စိတ်ဓာတ်ကျခြင်းကို နားလည်ခြင်း',
      'အဖြစ်အများဆုံး လက္ခဏာများ',
      'နေ့စဉ်ဘဝတွင် အထောက်အကူဖြစ်သည့်အရာများ',
      'မီးဖွားပြီး စိတ်ဓာတ်ကျခြင်းလား၊ မီးဖွားပြီးနောက် စိတ်ကျဆင်းရောဂါလား။',
      'အကူအညီကို မည်သည့်အချိန်တွင် တောင်းသင့်သနည်း',
      'အဓိကအချက်များ',
    ],
    section1Kicker: 'နားလည်ခြင်း',
    section1Title: 'မီးဖွားပြီး စိတ်ဓာတ်ကျခြင်းဆိုသည်မှာ အဘယ်နည်း။',
    section1Body1:
      'မီးဖွားပြီး စိတ်ဓာတ်ကျခြင်းသည် ကလေးမွေးပြီးနောက် ပထမရက်အနည်းငယ်အတွင်း ဖြစ်ပေါ်နိုင်သော စိတ်ခံစားမှု ပြောင်းလဲမှုကာလ ဖြစ်သည်။ ဟော်မုန်း ပြောင်းလဲမှု၊ ပင်ပန်းနွမ်းနယ်ခြင်း၊ အိပ်ရေးမဝခြင်းနှင့် ဤအဆင့်သစ်သို့ လိုက်လျောညီထွေ ပြောင်းလဲရခြင်းတို့အားလုံးသည် ဤထိခိုက်လွယ်မှုကို ဖြစ်စေနိုင်သည်။',
    section1Body2:
      'ဤအရာသည် ကျရှုံးမှု မဟုတ်သလို သင်သည် မကောင်းသော မိခင်ဖြစ်သည်ဟုလည်း မဆိုလိုပါ။ ကလေးမွေးပြီးနောက် ပထမရက်များကို လူတိုင်း ကိုယ်ပိုင်နည်းလမ်းဖြင့် ကြုံတွေ့ရသည်။',
    statTitle: 'အဖြစ်များသော အတွေ့အကြုံ',
    statText:
      'မီးဖွားပြီး စိတ်ဓာတ်ကျခြင်းသည် ကလေးမွေးဖွားပြီးနောက် အဖြစ်များပြီး ရက်အနည်းငယ်အတွင်း ကိုယ်တိုင် သက်သာလာတတ်သည်။',
    section2Kicker: 'လက္ခဏာများ',
    section2Title: 'သင်ခံစားရနိုင်သည့်အရာများ',
    section2Body:
      'လူတစ်ဦးချင်း ကြုံတွေ့ရပုံ ကွာခြားသည်။ အချို့မှာ အဓိကအားဖြင့် ပင်ပန်းနွမ်းနယ်ခြင်းနှင့် ထိခိုက်လွယ်ခြင်းကို ခံစားရပြီး အချို့မှာ ပိုမိုသိသာသော စိတ်ခံစားမှု ပြောင်းလဲမှုများ ရှိနိုင်သည်။',
    commonSigns: [
      {
        title: 'စိတ်လှုပ်ရှားလွယ်ခြင်း',
        description: 'ပိုမိုလွယ်ကူစွာ ငိုမိခြင်း သို့မဟုတ် အထူးထိခိုက်လွယ်သလို ခံစားရခြင်း။',
      },
      {
        title: 'အလွန်ထိခိုက်လွယ်ခြင်း',
        description: 'စိတ်ခံစားမှုများ ပိုပြင်းထန်ပြီး လျင်မြန်စွာ ပြောင်းလဲသလို ခံစားရနိုင်သည်။',
      },
      {
        title: 'စိတ်ခံစားမှု အတက်အကျ',
        description:
          'ကြေကွဲလွယ်သည့် ခံစားချက်သည် စိတ်ချမ်းသာသည့် အချိန်များနှင့် အလှည့်ကျ ဖြစ်ပေါ်နိုင်သည်။',
      },
      {
        title: 'ပင်ပန်းနွမ်းနယ်ခြင်း',
        description: 'ပထမရက်များမှ ပင်ပန်းနွမ်းနယ်မှုသည် စိတ်ခံစားမှုများကို ပိုမိုပြင်းထန်စေနိုင်သည်။',
      },
    ],
    section3Kicker: 'နေ့စဉ်ဘဝ',
    section3Title: 'အထောက်အကူဖြစ်နိုင်သည့်အရာများ',
    section3Body:
      'ဤကာလတွင် အနားယူရန် လိုအပ်မှုမှာ များပြားသည်။ ရိုးရှင်းသော အရာငယ်လေးများက နေ့ရက်များကို ပိုမိုသက်သောင့်သက်သာ ဖြစ်စေနိုင်သည်။',
    dailySupport: [
      {
        title: 'အနားယူခြင်း',
        description: 'အားလပ်ချိန်ရှိတိုင်း ပြန်လည်ကောင်းမွန်လာရန် အသုံးချခြင်း။',
      },
      {
        title: 'အကူအညီကို လက်ခံခြင်း',
        description: 'ပတ်ဝန်းကျင်ရှိ လူများထံမှ အထောက်အပံ့ တောင်းခံရန် မတွန့်တိုပါနှင့်။',
      },
      {
        title: 'ပုံမှန်သောက်ခြင်း',
        description: 'တစ်နေ့တာလုံး ရေလုံလောက်စွာ သောက်ခြင်း။',
      },
      {
        title: 'လုံလောက်စွာ စားခြင်း',
        description: 'ပုံမှန်ဆန်ပြီး ရိုးရှင်းသော အစားအစာများကို ရွေးချယ်ခြင်း။',
      },
    ],
    quoteText:
      '“ကလေးမွေးပြီးနောက် အကူအညီတောင်းခြင်းသည် ကိုယ့်ကိုယ်ကိုယ်နှင့် သင့်ကလေးကို စောင့်ရှောက်ခြင်း၏ နည်းလမ်းတစ်ခု ဖြစ်သည်။”',
    section4Kicker: 'ခွဲခြားသိရှိခြင်း',
    section4Title: 'မီးဖွားပြီး စိတ်ဓာတ်ကျခြင်းလား၊ မီးဖွားပြီးနောက် စိတ်ကျဆင်းရောဂါလား။',
    section4Body:
      'မီးဖွားပြီး စိတ်ဓာတ်ကျခြင်းသည် များသောအားဖြင့် ကာလတိုပြီး တဖြည်းဖြည်း သက်သာလာသည်။ မီးဖွားပြီးနောက် စိတ်ကျဆင်းရောဂါမှာ ကွဲပြားသည်။ ပိုမိုကြာရှည်နိုင်ပြီး ပိုပြင်းထန်နိုင်ကာ နေ့စဉ်ဘဝကို သိသိသာသာ ထိခိုက်စေနိုင်သည်။',
    compareTitle: 'ခွဲခြားရမည့် အခြေအနေနှစ်ခု',
    compareBabyBluesTitle: 'မီးဖွားပြီး စိတ်ဓာတ်ကျခြင်း',
    compareBabyBluesText:
      'မကြာခဏ ကာလတိုဖြစ်ပြီး နောက်လာမည့်ရက်များတွင် တဖြည်းဖြည်း သက်သာလာသည်။',
    comparePostpartumTitle: 'မီးဖွားပြီးနောက် စိတ်ကျဆင်းရောဂါ',
    comparePostpartumText:
      'ပိုကြာရှည်နိုင်ပြီး ပိုပြင်းထန်လာနိုင်ကာ ပညာရှင်၏ အထောက်အပံ့ လိုအပ်နိုင်သည်။',
    section5Kicker: 'သတိထားခြင်း',
    section5Title: 'အကူအညီကို မည်သည့်အချိန်တွင် တောင်းသင့်သနည်း။',
    section5Body:
      'စိတ်ခံစားမှု ဆင်းရဲခြင်း မသက်သာပါက၊ ပိုပြင်းထန်လာပါက သို့မဟုတ် နေ့စဉ်ဘဝကို ပိုခက်ခဲစေပါက ကျန်းမာရေးပညာရှင်နှင့် ပြောဆိုခြင်းသည် အရေးကြီးသည်။',
    attentionTitle: 'သတိထားရမည့် သတိပေးလက္ခဏာများ',
    attentionSubtitle: 'အောက်ပါအခြေအနေများတွင် ပညာရှင်နှင့် ပြောဆိုပါ…',
    attentionSigns: [
      'လက္ခဏာများ နှစ်ပတ်ထက်ပိုကြာခြင်း။',
      'ဝမ်းနည်းမှု သို့မဟုတ် စိုးရိမ်ပူပန်မှု ပိုပြင်းထန်လာခြင်း။',
      'ကိုယ့်ကိုယ်ကိုယ် သို့မဟုတ် သင့်ကလေးကို စောင့်ရှောက်ရန် ခက်ခဲလာခြင်း။',
      'သိသာသော စိတ်ဆင်းရဲမှု ခံစားချက် ပေါ်လာခြင်း။',
    ],
    professionalTitle: 'အထောက်အပံ့ ရရှိနိုင်သည်',
    professionalText:
      'သားဖွားဆရာမ၊ ဆရာဝန်၊ စိတ်ပညာရှင် သို့မဟုတ် အခြားကျန်းမာရေးပညာရှင်တစ်ဦးက နားထောင်ပေးနိုင်ပြီး အခြေအနေကို အကဲဖြတ်ကာ သင့်လျော်သော အထောက်အပံ့ ပေးနိုင်သည်။',
    tipTitle: 'သိထားသင့်သည်',
    tipText:
      'ကလေးမွေးပြီးနောက် စိတ်ခံစားမှုများသည် သင်မည်မျှကောင်းသော မိခင်ဖြစ်သည်ကို တိုင်းတာခြင်း မဟုတ်ပါ။ သင်သည် အနားယူရန်၊ နားထောင်ခံရရန်နှင့် အထောက်အပံ့ရရန် လိုအပ်ခွင့် ရှိသည်။',
    section6Kicker: 'အဓိကအချက်များ',
    section6Title: 'အဓိကအချက်များ',
    takeaways: [
      'မီးဖွားပြီး စိတ်ဓာတ်ကျခြင်းသည် ကလေးမွေးပြီးနောက် အဖြစ်များသည်။',
      'ပင်ပန်းနွမ်းနယ်ခြင်းနှင့် ဟော်မုန်း ပြောင်းလဲမှုများက စိတ်ခံစားမှုကို သက်ရောက်နိုင်သည်။',
      'ပတ်ဝန်းကျင်လူများ၏ အထောက်အပံ့သည် ဤကာလကို ပိုလွယ်ကူစေနိုင်သည်။',
      'ဆက်လက်ဖြစ်နေသော သို့မဟုတ် သိသာသော စိတ်ဆင်းရဲမှုကို ပညာရှင်၏ အကဲဖြတ်မှု လိုအပ်သည်။',
    ],
    disclaimerText:
      '၎င်းသည် အချက်အလက်ပေးရန်ဖြစ်ပြီး ကိုယ်ပိုင်ဆေးဘက်ဆိုင်ရာ အကြံပြုချက်ကို အစားထိုးခြင်းမရှိပါ။ သံသယရှိပါက သို့မဟုတ် သိသာသော စိတ်ဆင်းရဲမှု ခံစားရပါက ကျန်းမာရေးပညာရှင်နှင့် ပြောဆိုပါ။',
    endText: 'ကိုယ့်ကိုယ်ကိုယ် စောင့်ရှောက်ခြင်းသည်လည်း ကလေးမွေးပြီးနောက်ကာလ၏ အစိတ်အပိုင်းတစ်ခု ဖြစ်သည်။',
    shareTitle: 'မီးဖွားပြီး စိတ်ဓာတ်ကျခြင်းနှင့် မီးဖွားပြီးနောက် စိတ်ခံစားမှု ကျန်းမာရေး',
    shareMessage:
      'မီးဖွားပြီး စိတ်ဓာတ်ကျခြင်းနှင့် မီးဖွားပြီးနောက် စိတ်ခံစားမှု ကျန်းမာရေး — AWA\n\nကလေးမွေးပြီးနောက် အဖြစ်များသော စိတ်ခံစားမှု ပြောင်းလဲမှုများကို နားလည်ရန် လမ်းညွှန်။',
  },
  km: {
    badgeText: 'ក្រោយសម្រាលកូន • សុខភាពផ្លូវអារម្មណ៍',
    title: 'ទុក្ខព្រួយក្រោយសម្រាល និងសុខភាព\nផ្លូវអារម្មណ៍ក្រោយសម្រាលកូន',
    subtitle:
      'ស្វែងយល់ពីអ្វីដែលអាចផ្លាស់ប្តូរផ្នែកអារម្មណ៍ក្រោយសម្រាលកូន និងដឹងពេលណាគួរស្វែងរកការគាំទ្រ។',
    metaItems: ['អាន 10 នាទី', 'អត្ថបទ', 'កម្រិតដំបូង', 'មាតិកាបានពិនិត្យ'],
    introTitle: 'គួរដឹង',
    introText:
      'ក្រោយសម្រាលកូន វាជារឿងធម្មតាដែលឆ្លងកាត់រយៈពេលមួយដែលមានភាពរសើបផ្លូវអារម្មណ៍កើនឡើង។ ទុក្ខព្រួយក្រោយសម្រាលជាធម្មតាមានតែបណ្តោះអាសន្ន ប៉ុន្តែការឈឺចិត្តដែលនៅបន្ត ឬកាន់តែខ្លាំង គួរតែទទួលបានការយកចិត្តទុកដាក់ពីអ្នកជំនាញ។',
    contentsEyebrow: 'មគ្គុទ្ទេសក៍',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    contents: [
      'ស្វែងយល់ពីទុក្ខព្រួយក្រោយសម្រាល',
      'សញ្ញាទូទៅបំផុត',
      'អ្វីដែលជួយក្នុងជីវិតប្រចាំថ្ងៃ',
      'ទុក្ខព្រួយក្រោយសម្រាល ឬជំងឺធ្លាក់ទឹកចិត្តក្រោយសម្រាល?',
      'ពេលណាគួរស្នើសុំជំនួយ',
      'ចំណុចសំខាន់ៗ',
    ],
    section1Kicker: 'ការស្វែងយល់',
    section1Title: 'តើទុក្ខព្រួយក្រោយសម្រាលជាអ្វី?',
    section1Body1:
      'ទុក្ខព្រួយក្រោយសម្រាលគឺជារយៈពេលនៃការប្រែប្រួលផ្លូវអារម្មណ៍ ដែលអាចកើតឡើងក្នុងរយៈពេលពីរបីថ្ងៃដំបូងក្រោយសម្រាលកូន។ ការប្រែប្រួលនៃអរម៉ូន ការអស់កម្លាំង ការខ្វះដំណេក និងការសម្របខ្លួនទៅនឹងដំណាក់កាលថ្មីនេះ អាចរួមចំណែកដល់ភាពរសើបនេះទាំងអស់។',
    section1Body2:
      'នេះមិនមែនជាការបរាជ័យទេ ហើយក៏មិនមានន័យថាអ្នកជាម្តាយមិនល្អនោះដែរ។ មនុស្សគ្រប់គ្នាឆ្លងកាត់ថ្ងៃដំបូងនៃការក្រោយសម្រាលតាមរបៀបរៀងៗខ្លួន។',
    statTitle: 'បទពិសោធន៍ទូទៅ',
    statText:
      'ទុក្ខព្រួយក្រោយសម្រាលជារឿងទូទៅក្រោយការសម្រាលកូន ហើយមាននិន្នាការប្រសើរឡើងដោយខ្លួនឯងក្នុងរយៈពេលពីរបីថ្ងៃ។',
    section2Kicker: 'សញ្ញា',
    section2Title: 'អ្វីដែលអ្នកអាចមានអារម្មណ៍',
    section2Body:
      'អ្វីដែលមនុស្សជួបប្រទះមានភាពខុសគ្នា។ អ្នកខ្លះមានអារម្មណ៍អស់កម្លាំង និងរសើបជាសំខាន់ ចំណែកអ្នកខ្លះទៀតអាចមានការប្រែប្រួលអារម្មណ៍ដែលច្បាស់ជាង។',
    commonSigns: [
      {
        title: 'ងាយរំជួលចិត្ត',
        description: 'យំកាន់តែងាយ ឬមានអារម្មណ៍រសើបជាពិសេស។',
      },
      {
        title: 'រសើបហួសប្រមាណ',
        description: 'អារម្មណ៍អាចមានអារម្មណ៍ខ្លាំងជាងមុន ហើយប្រែប្រួលយ៉ាងឆាប់រហ័ស។',
      },
      {
        title: 'អារម្មណ៍ឡើងចុះ',
        description:
          'អារម្មណ៍ងាយបាក់ទឹកចិត្តអាចជំនួសគ្នាជាមួយនឹងពេលវេលាដែលមានសុខុមាលភាព។',
      },
      {
        title: 'អស់កម្លាំង',
        description: 'ភាពអស់កម្លាំងពីថ្ងៃដំបូងអាចបង្កើនអារម្មណ៍កាន់តែខ្លាំង។',
      },
    ],
    section3Kicker: 'ជីវិតប្រចាំថ្ងៃ',
    section3Title: 'អ្វីដែលអាចជួយបាន',
    section3Body:
      'ក្នុងរយៈពេលនេះ តម្រូវការសម្រាកមានច្រើនណាស់។ រឿងតូចៗ និងសាមញ្ញអាចធ្វើឱ្យថ្ងៃទាំងនោះស្រួលជាងមុន។',
    dailySupport: [
      {
        title: 'សម្រាក',
        description: 'ទាញយកប្រយោជន៍ពីគ្រប់ពេលទំនេរដើម្បីងើបឡើងវិញ។',
      },
      {
        title: 'ទទួលយកជំនួយ',
        description: 'កុំស្ទាក់ស្ទើរក្នុងការសុំការគាំទ្រពីមនុស្សជុំវិញអ្នក។',
      },
      {
        title: 'ផឹកទឹកឱ្យទៀងទាត់',
        description: 'ផឹកទឹកឱ្យបានគ្រប់គ្រាន់ពេញមួយថ្ងៃ។',
      },
      {
        title: 'បរិភោគឱ្យបានគ្រប់គ្រាន់',
        description: 'ជ្រើសរើសអាហារសាមញ្ញៗ ដែលទៀងទាត់។',
      },
    ],
    quoteText:
      '“ការស្នើសុំជំនួយក្នុងអំឡុងពេលក្រោយសម្រាលកូន គឺជាវិធីមួយនៃការថែទាំខ្លួនអ្នក និងទារករបស់អ្នក។”',
    section4Kicker: 'ការញែកភាពខុសគ្នា',
    section4Title: 'ទុក្ខព្រួយក្រោយសម្រាល ឬជំងឺធ្លាក់ទឹកចិត្តក្រោយសម្រាល?',
    section4Body:
      'ទុក្ខព្រួយក្រោយសម្រាលជាធម្មតាមានរយៈពេលខ្លី ហើយប្រសើរឡើងបន្តិចម្តងៗ។ ជំងឺធ្លាក់ទឹកចិត្តក្រោយសម្រាលមានភាពខុសគ្នា៖ វាអាចនៅបន្តយូរជាង ខ្លាំងជាង និងមានផលប៉ះពាល់ខ្លាំងដល់ជីវិតប្រចាំថ្ងៃ។',
    compareTitle: 'ស្ថានភាពពីរដែលត្រូវញែកឱ្យដាច់',
    compareBabyBluesTitle: 'ទុក្ខព្រួយក្រោយសម្រាល',
    compareBabyBluesText:
      'ជាញឹកញាប់មានរយៈពេលខ្លី ហើយប្រសើរឡើងបន្តិចម្តងៗក្នុងរយៈពេលពីរបីថ្ងៃបន្ទាប់។',
    comparePostpartumTitle: 'ជំងឺធ្លាក់ទឹកចិត្តក្រោយសម្រាល',
    comparePostpartumText:
      'អាចមានរយៈពេលយូរជាង កាន់តែខ្លាំង និងត្រូវការការគាំទ្រពីអ្នកជំនាញ។',
    section5Kicker: 'ការប្រុងប្រយ័ត្ន',
    section5Title: 'ពេលណាគួរស្នើសុំជំនួយ?',
    section5Body:
      'វាសំខាន់ក្នុងការនិយាយជាមួយអ្នកជំនាញសុខាភិបាល ប្រសិនបើការឈឺចិត្តមិនប្រសើរឡើង កាន់តែខ្លាំង ឬចាប់ផ្តើមធ្វើឱ្យជីវិតប្រចាំថ្ងៃកាន់តែលំបាក។',
    attentionTitle: 'សញ្ញាព្រមានដែលត្រូវសង្កេត',
    attentionSubtitle: 'និយាយជាមួយអ្នកជំនាញ ប្រសិនបើ…',
    attentionSigns: [
      'រោគសញ្ញាមានរយៈពេលលើសពីពីរសប្តាហ៍។',
      'ភាពសោកសៅ ឬការថប់បារម្ភកាន់តែខ្លាំង។',
      'វាក្លាយជាការលំបាកក្នុងការថែទាំខ្លួនអ្នក ឬទារករបស់អ្នក។',
      'មានអារម្មណ៍ឈឺចិត្តយ៉ាងខ្លាំង។',
    ],
    professionalTitle: 'មានការគាំទ្រសម្រាប់អ្នក',
    professionalText:
      'ឆ្មប វេជ្ជបណ្ឌិត អ្នកចិត្តវិទ្យា ឬអ្នកជំនាញសុខាភិបាលផ្សេងទៀត អាចស្តាប់ វាយតម្លៃស្ថានភាព និងផ្តល់ការគាំទ្រសមស្រប។',
    tipTitle: 'គួរដឹង',
    tipText:
      'អារម្មណ៍ក្រោយសម្រាលកូនមិនមែនជារង្វាស់នៃភាពល្អរបស់អ្នកជាម្តាយនោះទេ។ អ្នកមានសិទ្ធិត្រូវការសម្រាក ត្រូវបានគេស្តាប់ និងត្រូវបានគេគាំទ្រ។',
    section6Kicker: 'ចំណុចសំខាន់',
    section6Title: 'ចំណុចសំខាន់ៗ',
    takeaways: [
      'ទុក្ខព្រួយក្រោយសម្រាលជារឿងទូទៅក្រោយសម្រាលកូន។',
      'ភាពអស់កម្លាំង និងការប្រែប្រួលអរម៉ូនអាចប៉ះពាល់ដល់អារម្មណ៍។',
      'ការគាំទ្រពីមនុស្សជុំវិញអាចធ្វើឱ្យរយៈពេលនេះស្រួលជាងមុន។',
      'ការឈឺចិត្តដែលនៅបន្ត ឬខ្លាំង គួរទទួលបានការវាយតម្លៃពីអ្នកជំនាញ។',
    ],
    disclaimerText:
      'អត្ថបទនេះមានគោលបំណងផ្តល់ព័ត៌មាន ហើយមិនជំនួសដំបូន្មានពេទ្យផ្ទាល់ខ្លួនទេ។ ប្រសិនបើមានការសង្ស័យ ឬមានការឈឺចិត្តយ៉ាងខ្លាំង សូមនិយាយជាមួយអ្នកជំនាញសុខាភិបាល។',
    endText: 'ការថែទាំខ្លួនអ្នកក៏ជាផ្នែកមួយនៃការក្រោយសម្រាលកូនដែរ។',
    shareTitle: 'ទុក្ខព្រួយក្រោយសម្រាល និងសុខភាពផ្លូវអារម្មណ៍ក្រោយសម្រាលកូន',
    shareMessage:
      'ទុក្ខព្រួយក្រោយសម្រាល និងសុខភាពផ្លូវអារម្មណ៍ក្រោយសម្រាលកូន — AWA\n\nមគ្គុទ្ទេសក៍សម្រាប់ស្វែងយល់ពីការប្រែប្រួលផ្លូវអារម្មណ៍ដែលជារឿងទូទៅក្រោយសម្រាលកូន។',
  },
  lo: {
    badgeText: 'ຫຼັງຄອດ • ສຸຂະພາບທາງອາລົມ',
    title: 'ອາລົມເສົ້າຫຼັງຄອດ ແລະ\nສຸຂະພາບທາງອາລົມຫຼັງຄອດ',
    subtitle:
      'ເຂົ້າໃຈສິ່ງທີ່ອາດປ່ຽນແປງທາງອາລົມຫຼັງການເກີດລູກ ແລະ ຮູ້ວ່າເມື່ອໃດຄວນຂໍຄວາມຊ່ວຍເຫຼືອ.',
    metaItems: ['ອ່ານ 10 ນາທີ', 'ບົດຄວາມ', 'ລະດັບເລີ່ມຕົ້ນ', 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ'],
    introTitle: 'ຄວນຮູ້',
    introText:
      'ຫຼັງຈາກເກີດລູກ ເປັນເລື່ອງທົ່ວໄປທີ່ຈະຜ່ານໄລຍະທີ່ອາລົມອ່ອນໄຫວຫຼາຍຂຶ້ນ. ອາລົມເສົ້າຫຼັງຄອດມັກເປັນຊົ່ວຄາວ ແຕ່ຄວາມທຸກໃຈທີ່ຍັງຄົງຢູ່ ຫຼື ຮຸນແຮງຂຶ້ນ ຄວນໄດ້ຮັບການດູແລຈາກຜູ້ຊ່ຽວຊານ.',
    contentsEyebrow: 'ຄູ່ມື',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    contents: [
      'ເຂົ້າໃຈອາລົມເສົ້າຫຼັງຄອດ',
      'ອາການທີ່ພົບເລື້ອຍທີ່ສຸດ',
      'ສິ່ງທີ່ຊ່ວຍໄດ້ໃນແຕ່ລະວັນ',
      'ອາລົມເສົ້າຫຼັງຄອດ ຫຼື ພາວະຊຶມເສົ້າຫຼັງຄອດ?',
      'ເມື່ອໃດຄວນຂໍຄວາມຊ່ວຍເຫຼືອ',
      'ຈຸດສຳຄັນ',
    ],
    section1Kicker: 'ຄວາມເຂົ້າໃຈ',
    section1Title: 'ອາລົມເສົ້າຫຼັງຄອດແມ່ນຫຍັງ?',
    section1Body1:
      'ອາລົມເສົ້າຫຼັງຄອດແມ່ນໄລຍະທີ່ອາລົມປ່ຽນແປງ ເຊິ່ງອາດເກີດຂຶ້ນໃນສອງສາມມື້ທຳອິດຫຼັງການເກີດລູກ. ການປ່ຽນແປງຂອງຮໍໂມນ, ຄວາມອ່ອນເພຍ, ການນອນບໍ່ພຽງພໍ ແລະ ການປັບຕົວເຂົ້າກັບຊ່ວງຊີວິດໃໝ່ນີ້ ລ້ວນອາດເຮັດໃຫ້ອ່ອນໄຫວງ່າຍ.',
    section1Body2:
      'ນີ້ບໍ່ແມ່ນຄວາມລົ້ມເຫຼວ ແລະ ບໍ່ໄດ້ໝາຍຄວາມວ່າທ່ານເປັນແມ່ທີ່ບໍ່ດີ. ທຸກຄົນມີປະສົບການໃນສອງສາມມື້ທຳອິດຫຼັງຄອດແຕກຕ່າງກັນ.',
    statTitle: 'ປະສົບການທີ່ພົບທົ່ວໄປ',
    statText:
      'ອາລົມເສົ້າຫຼັງຄອດພົບໄດ້ທົ່ວໄປຫຼັງການເກີດລູກ ແລະ ມັກດີຂຶ້ນເອງພາຍໃນສອງສາມມື້.',
    section2Kicker: 'ອາການ',
    section2Title: 'ສິ່ງທີ່ທ່ານອາດຮູ້ສຶກ',
    section2Body:
      'ປະສົບການຂອງແຕ່ລະຄົນແຕກຕ່າງກັນ. ບາງຄົນຮູ້ສຶກອ່ອນເພຍ ແລະ ອ່ອນໄຫວເປັນຫຼັກ ໃນຂະນະທີ່ບາງຄົນອາດມີອາລົມປ່ຽນແປງຊັດເຈນກວ່າ.',
    commonSigns: [
      {
        title: 'ອາລົມຄວາມຮູ້ສຶກຫຼາຍຂຶ້ນ',
        description: 'ຮ້ອງໄຫ້ງ່າຍຂຶ້ນ ຫຼື ຮູ້ສຶກອ່ອນໄຫວເປັນພິເສດ.',
      },
      {
        title: 'ອ່ອນໄຫວເກີນປົກກະຕິ',
        description: 'ອາລົມອາດຮູ້ສຶກແຮງຂຶ້ນ ແລະ ປ່ຽນແປງໄວ.',
      },
      {
        title: 'ອາລົມປ່ຽນແປງງ່າຍ',
        description:
          'ຄວາມຮູ້ສຶກບອບບາງອາດສະຫຼັບກັບຊ່ວງເວລາທີ່ຮູ້ສຶກດີ.',
      },
      {
        title: 'ອ່ອນເພຍ',
        description: 'ຄວາມອ່ອນເພຍໃນສອງສາມມື້ທຳອິດອາດເຮັດໃຫ້ອາລົມແຮງຂຶ້ນ.',
      },
    ],
    section3Kicker: 'ໃນແຕ່ລະວັນ',
    section3Title: 'ສິ່ງທີ່ອາດຊ່ວຍໄດ້',
    section3Body:
      'ໃນໄລຍະນີ້ ຄວາມຕ້ອງການພັກຜ່ອນມີຫຼາຍ. ສິ່ງນ້ອຍໆທີ່ງ່າຍໆອາດເຮັດໃຫ້ແຕ່ລະມື້ສະບາຍຂຶ້ນ.',
    dailySupport: [
      {
        title: 'ພັກຜ່ອນ',
        description: 'ໃຊ້ທຸກຊ່ວງເວລາວ່າງເພື່ອຟື້ນຟູຮ່າງກາຍ.',
      },
      {
        title: 'ຍອມຮັບການຊ່ວຍເຫຼືອ',
        description: 'ຢ່າລັງເລທີ່ຈະຂໍການສະໜັບສະໜູນຈາກຄົນອ້ອມຂ້າງ.',
      },
      {
        title: 'ດື່ມນ້ຳເປັນປະຈຳ',
        description: 'ດື່ມນ້ຳໃຫ້ພຽງພໍຕະຫຼອດມື້.',
      },
      {
        title: 'ກິນອາຫານໃຫ້ພຽງພໍ',
        description: 'ເລືອກອາຫານງ່າຍໆທີ່ກິນເປັນປະຈຳ.',
      },
    ],
    quoteText:
      '“ການຂໍຄວາມຊ່ວຍເຫຼືອໃນໄລຍະຫຼັງຄອດ ແມ່ນວິທີໜຶ່ງໃນການດູແລຕົນເອງ ແລະ ລູກນ້ອຍຂອງທ່ານ.”',
    section4Kicker: 'ແຍກຄວາມແຕກຕ່າງ',
    section4Title: 'ອາລົມເສົ້າຫຼັງຄອດ ຫຼື ພາວະຊຶມເສົ້າຫຼັງຄອດ?',
    section4Body:
      'ອາລົມເສົ້າຫຼັງຄອດມັກເກີດຂຶ້ນໄລຍະສັ້ນ ແລະ ດີຂຶ້ນເທື່ອລະໜ້ອຍ. ພາວະຊຶມເສົ້າຫຼັງຄອດແຕກຕ່າງກັນ: ອາດຍາວນານກວ່າ, ຮຸນແຮງກວ່າ ແລະ ສົ່ງຜົນຕໍ່ຊີວິດປະຈຳວັນຢ່າງຫຼວງຫຼາຍ.',
    compareTitle: 'ສອງສະຖານະການທີ່ຄວນແຍກໃຫ້ອອກ',
    compareBabyBluesTitle: 'ອາລົມເສົ້າຫຼັງຄອດ',
    compareBabyBluesText:
      'ມັກເກີດໄລຍະສັ້ນ ແລະ ດີຂຶ້ນເທື່ອລະໜ້ອຍໃນສອງສາມມື້ຕໍ່ມາ.',
    comparePostpartumTitle: 'ພາວະຊຶມເສົ້າຫຼັງຄອດ',
    comparePostpartumText:
      'ອາດຍາວນານກວ່າ, ຮຸນແຮງຂຶ້ນ ແລະ ຕ້ອງການການດູແລຈາກຜູ້ຊ່ຽວຊານ.',
    section5Kicker: 'ເຝົ້າລະວັງ',
    section5Title: 'ເມື່ອໃດຄວນຂໍຄວາມຊ່ວຍເຫຼືອ?',
    section5Body:
      'ສຳຄັນທີ່ຈະປຶກສາຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບ ຖ້າຄວາມທຸກໃຈທາງອາລົມບໍ່ດີຂຶ້ນ, ຮຸນແຮງຂຶ້ນ ຫຼື ເລີ່ມເຮັດໃຫ້ຊີວິດປະຈຳວັນຍາກຂຶ້ນ.',
    attentionTitle: 'ສັນຍານເຕືອນທີ່ຄວນສັງເກດ',
    attentionSubtitle: 'ປຶກສາຜູ້ຊ່ຽວຊານ ຖ້າ…',
    attentionSigns: [
      'ອາການຕໍ່ເນື່ອງເກີນສອງອາທິດ.',
      'ຄວາມໂສກເສົ້າ ຫຼື ຄວາມກັງວົນຮຸນແຮງຂຶ້ນ.',
      'ເລີ່ມຍາກທີ່ຈະດູແລຕົນເອງ ຫຼື ລູກນ້ອຍ.',
      'ມີຄວາມຮູ້ສຶກທຸກໃຈຢ່າງຫຼວງຫຼາຍ.',
    ],
    professionalTitle: 'ມີການສະໜັບສະໜູນພ້ອມໃຫ້',
    professionalText:
      'ໝໍຕຳແຍ, ແພດ, ນັກຈິດຕະສາດ ຫຼື ຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບຄົນອື່ນ ສາມາດຮັບຟັງ, ປະເມີນສະຖານະການ ແລະ ໃຫ້ການສະໜັບສະໜູນທີ່ເໝາະສົມ.',
    tipTitle: 'ຄວນຮູ້',
    tipText:
      'ອາລົມຫຼັງຄອດບໍ່ແມ່ນເຄື່ອງວັດວ່າທ່ານເປັນແມ່ທີ່ດີຫຼາຍປານໃດ. ທ່ານມີສິດຕ້ອງການພັກຜ່ອນ, ໄດ້ຮັບການຮັບຟັງ ແລະ ໄດ້ຮັບການສະໜັບສະໜູນ.',
    section6Kicker: 'ຈຸດສຳຄັນ',
    section6Title: 'ຈຸດສຳຄັນ',
    takeaways: [
      'ອາລົມເສົ້າຫຼັງຄອດພົບໄດ້ທົ່ວໄປຫຼັງການເກີດລູກ.',
      'ຄວາມອ່ອນເພຍ ແລະ ການປ່ຽນແປງຂອງຮໍໂມນອາດສົ່ງຜົນຕໍ່ອາລົມ.',
      'ການສະໜັບສະໜູນຈາກຄົນອ້ອມຂ້າງຊ່ວຍໃຫ້ໄລຍະນີ້ງ່າຍຂຶ້ນ.',
      'ຄວາມທຸກໃຈທີ່ຍັງຄົງຢູ່ ຫຼື ຮຸນແຮງ ຄວນໄດ້ຮັບການປະເມີນຈາກຜູ້ຊ່ຽວຊານ.',
    ],
    disclaimerText:
      'ບົດຄວາມນີ້ແມ່ນຂໍ້ມູນທົ່ວໄປ ແລະ ບໍ່ແທນຄຳແນະນຳທາງການແພດສະເພາະບຸກຄົນ. ຖ້າມີຂໍ້ສົງໄສ ຫຼື ມີຄວາມທຸກໃຈຢ່າງຫຼວງຫຼາຍ ກະລຸນາປຶກສາຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບ.',
    endText: 'ການດູແລຕົນເອງກໍເປັນສ່ວນໜຶ່ງຂອງໄລຍະຫຼັງຄອດ.',
    shareTitle: 'ອາລົມເສົ້າຫຼັງຄອດ ແລະ ສຸຂະພາບທາງອາລົມຫຼັງຄອດ',
    shareMessage:
      'ອາລົມເສົ້າຫຼັງຄອດ ແລະ ສຸຂະພາບທາງອາລົມຫຼັງຄອດ — AWA\n\nຄູ່ມືເພື່ອເຂົ້າໃຈການປ່ຽນແປງທາງອາລົມທີ່ພົບທົ່ວໄປຫຼັງການເກີດລູກ.',
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
