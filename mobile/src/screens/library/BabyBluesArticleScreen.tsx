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
const CONTENT = {
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
} as const;

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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.reader.back')}
              hitSlop={8}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                name="chevron-left"
                size={24}
                color={theme.colors.text}
              />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  saved ? t('library.screen.removeBookmark') : t('library.screen.addBookmark')
                }
                hitSlop={8}
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
                hitSlop={8}
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

            <Text style={styles.badgeText}>
              {content.badgeText}
            </Text>
          </View>

          {/* TITLE */}

          <Text style={styles.title}>
            {content.title}
          </Text>

          {/* SUBTITLE */}

          <Text style={styles.subtitle}>
            {content.subtitle}
          </Text>

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

                    <Text style={styles.meta}>
                      {text}
                    </Text>
                  </View>
                </React.Fragment>
              );
            })}
          </View>

          {/* ================================================================= */}
          {/* INTRODUCTION                                                      */}
          {/* ================================================================= */}

          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <MaterialDesignIcons
                name="information-outline"
                size={22}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.introCopy}>
              <Text style={styles.introTitle}>
                {content.introTitle}
              </Text>

              <Text style={styles.introText}>
                {content.introText}
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* TABLE OF CONTENTS                                                 */}
          {/* ================================================================= */}

          <View style={styles.contents}>
            <View style={styles.contentsHeader}>
              <View>
                <Text style={styles.contentsEyebrow}>
                  {content.contentsEyebrow}
                </Text>

                <Text style={styles.contentsTitle}>
                  {content.contentsTitle}
                </Text>
              </View>

              <View style={styles.contentsCount}>
                <Text style={styles.contentsCountText}>
                  {String(content.contents.length).padStart(2, '0')}
                </Text>
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
                    <Text style={styles.numberText}>
                      {index + 1}
                    </Text>
                  </View>

                  <Text style={styles.contentText}>
                    {item}
                  </Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={18}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 01                                                        */}
          {/* ================================================================= */}

          <SectionHeading
            styles={styles}
            number="01"
            kicker={content.section1Kicker}
            title={content.section1Title}
          />

          <Text style={styles.body}>
            {content.section1Body1}
          </Text>

          <Text style={styles.body}>
            {content.section1Body2}
          </Text>

          {/* STAT CARD */}

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MaterialDesignIcons
                name="account-heart-outline"
                size={24}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.statCopy}>
              <Text style={styles.statTitle}>
                {content.statTitle}
              </Text>

              <Text style={styles.statText}>
                {content.statText}
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 02                                                        */}
          {/* ================================================================= */}

          <SectionHeading
            styles={styles}
            number="02"
            kicker={content.section2Kicker}
            title={content.section2Title}
          />

          <Text style={styles.body}>
            {content.section2Body}
          </Text>

          {/* SIGNS GRID */}

          <View style={styles.signGrid}>
            {SIGN_ICONS.map(
              (icon, index) => {
                const {title, description} = content.commonSigns[index];

                return (
                  <View
                    key={title}
                    style={styles.signCard}>
                    <View style={styles.signIcon}>
                      <MaterialDesignIcons
                        name={icon as never}
                        size={21}
                        color={theme.colors.primary}
                      />
                    </View>

                    <Text style={styles.signTitle}>
                      {title}
                    </Text>

                    <Text style={styles.signDescription}>
                      {description}
                    </Text>
                  </View>
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

          <Text style={styles.body}>
            {content.section3Body}
          </Text>

          {/* SUPPORT LIST */}

          <View style={styles.supportList}>
            {SUPPORT_ICONS.map(
              (icon, index) => {
                const {title, description} = content.dailySupport[index];

                return (
                  <View
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
                      <Text style={styles.supportTitle}>
                        {title}
                      </Text>

                      <Text style={styles.supportDescription}>
                        {description}
                      </Text>
                    </View>

                    <View style={styles.supportNumber}>
                      <Text style={styles.supportNumberText}>
                        {index + 1}
                      </Text>
                    </View>
                  </View>
                );
              },
            )}
          </View>

          {/* QUOTE */}

          <View style={styles.quoteCard}>
            <View style={styles.quoteIcon}>
              <MaterialDesignIcons
                name="format-quote-open"
                size={25}
                color={theme.colors.primary}
              />
            </View>

            <Text style={styles.quoteText}>
              {content.quoteText}
            </Text>
          </View>

          {/* ================================================================= */}
          {/* SECTION 04                                                        */}
          {/* ================================================================= */}

          <SectionHeading
            styles={styles}
            number="04"
            kicker={content.section4Kicker}
            title={content.section4Title}
          />

          <Text style={styles.body}>
            {content.section4Body}
          </Text>

          {/* COMPARISON */}

          <View style={styles.compareCard}>
            <View style={styles.compareHeader}>
              <View style={styles.compareHeaderIcon}>
                <MaterialDesignIcons
                  name="compare-horizontal"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>

              <Text style={styles.compareTitle}>
                {content.compareTitle}
              </Text>
            </View>

            <View style={styles.compareItem}>
              <View style={styles.compareDotNormal} />

              <View style={styles.compareCopy}>
                <Text style={styles.compareItemTitle}>
                  {content.compareBabyBluesTitle}
                </Text>

                <Text style={styles.compareItemText}>
                  {content.compareBabyBluesText}
                </Text>
              </View>
            </View>

            <View style={styles.compareLine} />

            <View style={styles.compareItem}>
              <View style={styles.compareDotAttention} />

              <View style={styles.compareCopy}>
                <Text style={styles.compareItemTitle}>
                  {content.comparePostpartumTitle}
                </Text>

                <Text style={styles.compareItemText}>
                  {content.comparePostpartumText}
                </Text>
              </View>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 05                                                        */}
          {/* ================================================================= */}

          <SectionHeading
            styles={styles}
            number="05"
            kicker={content.section5Kicker}
            title={content.section5Title}
          />

          <Text style={styles.body}>
            {content.section5Body}
          </Text>

          {/* ATTENTION CARD */}

          <View style={styles.attentionCard}>
            <View style={styles.attentionHeader}>
              <View style={styles.attentionIcon}>
                <MaterialDesignIcons
                  name="alert-circle-outline"
                  size={22}
                  color={theme.colors.warning}
                />
              </View>

              <View style={styles.attentionHeaderCopy}>
                <Text style={styles.attentionTitle}>
                  {content.attentionTitle}
                </Text>

                <Text style={styles.attentionSubtitle}>
                  {content.attentionSubtitle}
                </Text>
              </View>
            </View>

            {content.attentionSigns.map((item, index) => (
              <View
                key={item}
                style={styles.attentionRow}>
                <View style={styles.attentionBullet}>
                  <Text style={styles.attentionBulletText}>
                    {index + 1}
                  </Text>
                </View>

                <Text style={styles.attentionText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* PROFESSIONAL SUPPORT                                              */}
          {/* ================================================================= */}

          <View style={styles.professionalCard}>
            <View style={styles.professionalIcon}>
              <MaterialDesignIcons
                name="stethoscope"
                size={24}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.professionalCopy}>
              <Text style={styles.professionalTitle}>
                {content.professionalTitle}
              </Text>

              <Text style={styles.professionalText}>
                {content.professionalText}
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* GOOD TO KNOW                                                      */}
          {/* ================================================================= */}

          <View style={styles.tip}>
            <View style={styles.tipIcon}>
              <MaterialDesignIcons
                name="lightbulb-outline"
                size={23}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.tipTitle}
              </Text>

              <Text style={styles.tipText}>
                {content.tipText}
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 06                                                        */}
          {/* ================================================================= */}

          <SectionHeading
            styles={styles}
            number="06"
            kicker={content.section6Kicker}
            title={content.section6Title}
          />

          <View style={styles.takeawayList}>
            {content.takeaways.map((text, index) => (
              <Takeaway
                key={text}
                styles={styles}
                successColor={theme.colors.success}
                text={text}
                last={index === content.takeaways.length - 1}
              />
            ))}
          </View>

          {/* ================================================================= */}
          {/* DISCLAIMER                                                         */}
          {/* ================================================================= */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-check-outline"
              size={19}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>
              {content.disclaimerText}
            </Text>
          </View>

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

          <Text style={styles.endText}>
            {content.endText}
          </Text>
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
        <Text style={styles.sectionNumberText}>
          {number}
        </Text>
      </View>

      <View style={styles.sectionHeadingCopy}>
        <Text style={styles.sectionKicker}>
          {kicker}
        </Text>

        <Text style={styles.h2}>
          {title}
        </Text>
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

      <Text style={styles.takeawayText}>
        {text}
      </Text>
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
    paddingBottom: 30,
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

  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.surface, 0.94),
    borderWidth: 1,
    borderColor: theme.colors.border,

    ...theme.shadow,
  },

  pressed: {
    opacity: 0.72,
    transform: [{scale: 0.96}],
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

    paddingHorizontal: 11,
    paddingVertical: 7,

    borderRadius: 20,

    backgroundColor: withAlpha(theme.colors.text, 0.72),

    gap: 6,
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
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  /* ------------------------------------------------------------------------ */
  /* ARTICLE                                                                 */
  /* ------------------------------------------------------------------------ */

  article: {
    marginTop: -22,

    paddingTop: 25,
    paddingHorizontal: 20,
    paddingBottom: 35,

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

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,

    gap: 5,
  },

  badgeText: {
    fontSize: 9.5,
    color: theme.colors.primary,
    fontWeight: '800',
    letterSpacing: 0.35,
  },

  /* ------------------------------------------------------------------------ */
  /* TITLE                                                                   */
  /* ------------------------------------------------------------------------ */

  title: {
    marginTop: 13,

    fontFamily: 'serif',
    fontSize: 29,
    lineHeight: 35,

    color: theme.colors.text,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  subtitle: {
    marginTop: 10,

    fontSize: 14,
    lineHeight: 21,

    color: theme.colors.textMuted,
  },

  /* ------------------------------------------------------------------------ */
  /* META                                                                    */
  /* ------------------------------------------------------------------------ */

  metas: {
    marginTop: 17,

    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',

    gap: 9,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  metaDivider: {
    width: 1,
    height: 19,
    backgroundColor: theme.colors.border,
  },

  meta: {
    fontSize: 9.5,
    color: theme.colors.textMuted,
  },

  /* ------------------------------------------------------------------------ */
  /* INTRO CARD                                                              */
  /* ------------------------------------------------------------------------ */

  introCard: {
    marginTop: 21,

    padding: 15,

    flexDirection: 'row',
    alignItems: 'flex-start',

    borderRadius: 17,

    backgroundColor: withAlpha(theme.colors.primary, 0.08),

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  introIcon: {
    width: 41,
    height: 41,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },

  introCopy: {
    flex: 1,
    marginLeft: 11,
  },

  introTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  introText: {
    marginTop: 4,

    fontSize: 11.5,
    lineHeight: 17,

    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* CONTENTS                                                                */
  /* ------------------------------------------------------------------------ */

  contents: {
    marginTop: 22,

    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 5,

    borderRadius: 18,

    backgroundColor: theme.colors.surfaceSecondary,

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  contentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 6,
  },

  contentsEyebrow: {
    fontSize: 8.5,
    color: theme.colors.primary,
    fontWeight: '900',
    letterSpacing: 1,
  },

  contentsTitle: {
    marginTop: 2,

    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '800',
  },

  contentsCount: {
    width: 35,
    height: 35,

    borderRadius: 18,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },

  contentsCountText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '800',
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

    marginRight: 10,
  },

  numberText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,

    fontSize: 12.2,
    lineHeight: 17,

    color: theme.colors.text,
  },

  /* ------------------------------------------------------------------------ */
  /* SECTION HEADING                                                         */
  /* ------------------------------------------------------------------------ */

  sectionHeading: {
    marginTop: 31,

    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  sectionNumber: {
    width: 39,
    height: 39,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.primarySoft,
  },

  sectionNumberText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  sectionHeadingCopy: {
    flex: 1,

    marginLeft: 11,
    paddingTop: 1,
  },

  sectionKicker: {
    fontSize: 8.5,

    color: theme.colors.primary,
    fontWeight: '900',

    letterSpacing: 1,
  },

  h2: {
    marginTop: 2,

    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,

    color: theme.colors.text,
    fontWeight: '700',
  },

  /* ------------------------------------------------------------------------ */
  /* BODY                                                                    */
  /* ------------------------------------------------------------------------ */

  body: {
    marginTop: 11,

    fontSize: 14,
    lineHeight: 22,

    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* STAT CARD                                                               */
  /* ------------------------------------------------------------------------ */

  statCard: {
    marginTop: 17,

    padding: 15,

    flexDirection: 'row',
    alignItems: 'center',

    borderRadius: 16,

    backgroundColor: theme.colors.surfaceSecondary,

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  statIcon: {
    width: 45,
    height: 45,

    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.primarySoft,
  },

  statCopy: {
    flex: 1,
    marginLeft: 12,
  },

  statTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  statText: {
    marginTop: 4,

    fontSize: 11.5,
    lineHeight: 17,

    color: theme.colors.textMuted,
  },

  /* ------------------------------------------------------------------------ */
  /* SIGNS                                                                    */
  /* ------------------------------------------------------------------------ */

  signGrid: {
    marginTop: 14,

    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',

    gap: 9,
  },

  signCard: {
    width: '48.3%',
    minHeight: 158,

    padding: 13,

    borderRadius: 16,

    backgroundColor: theme.colors.surface,

    borderWidth: 1,
    borderColor: theme.colors.border,

    ...theme.shadow,
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
    marginTop: 10,

    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  signDescription: {
    marginTop: 5,

    fontSize: 10.5,
    lineHeight: 15.5,

    color: theme.colors.textMuted,
  },

  /* ------------------------------------------------------------------------ */
  /* SUPPORT                                                                  */
  /* ------------------------------------------------------------------------ */

  supportList: {
    marginTop: 14,
    gap: 9,
  },

  supportRow: {
    minHeight: 77,

    padding: 11,

    flexDirection: 'row',
    alignItems: 'center',

    borderRadius: 16,

    backgroundColor: withAlpha(theme.colors.success, 0.12),

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  supportIcon: {
    width: 42,
    height: 42,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },

  supportCopy: {
    flex: 1,
    marginLeft: 11,
  },

  supportTitle: {
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  supportDescription: {
    marginTop: 3,

    fontSize: 10.5,
    lineHeight: 15,

    color: theme.colors.textMuted,
  },

  supportNumber: {
    width: 25,
    height: 25,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },

  supportNumberText: {
    fontSize: 9,
    color: theme.colors.success,
    fontWeight: '900',
  },

  /* ------------------------------------------------------------------------ */
  /* QUOTE                                                                    */
  /* ------------------------------------------------------------------------ */

  quoteCard: {
    marginTop: 19,

    padding: 18,

    borderRadius: 18,

    backgroundColor: withAlpha(theme.colors.primary, 0.08),

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  quoteIcon: {
    width: 30,
    height: 30,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 10,

    backgroundColor: theme.colors.surface,
  },

  quoteText: {
    marginTop: 8,

    fontFamily: 'serif',
    fontSize: 16,
    lineHeight: 23,

    color: theme.colors.text,
    fontStyle: 'italic',
  },

  /* ------------------------------------------------------------------------ */
  /* COMPARISON                                                               */
  /* ------------------------------------------------------------------------ */

  compareCard: {
    marginTop: 15,

    padding: 15,

    borderRadius: 18,

    backgroundColor: theme.colors.surface,

    borderWidth: 1,
    borderColor: theme.colors.border,

    ...theme.shadow,
  },

  compareHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 13,
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

    marginLeft: 10,

    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
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
    marginLeft: 10,
  },

  compareItemTitle: {
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  compareItemText: {
    marginTop: 4,

    fontSize: 10.8,
    lineHeight: 16,

    color: theme.colors.textMuted,
  },

  compareLine: {
    height: 1,

    marginVertical: 14,

    backgroundColor: theme.colors.border,
  },

  /* ------------------------------------------------------------------------ */
  /* ATTENTION                                                                */
  /* ------------------------------------------------------------------------ */

  attentionCard: {
    marginTop: 15,

    padding: 15,

    borderRadius: 18,

    backgroundColor: withAlpha(theme.colors.warning, 0.12),

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  attentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 12,
  },

  attentionIcon: {
    width: 42,
    height: 42,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },

  attentionHeaderCopy: {
    flex: 1,
    marginLeft: 10,
  },

  attentionTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  attentionSubtitle: {
    marginTop: 3,

    fontSize: 10.5,
    color: theme.colors.warning,
  },

  attentionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    marginTop: 9,
  },

  attentionBullet: {
    width: 23,
    height: 23,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },

  attentionBulletText: {
    fontSize: 9,
    color: theme.colors.warning,
    fontWeight: '900',
  },

  attentionText: {
    flex: 1,

    marginLeft: 9,
    paddingTop: 2,

    fontSize: 11.5,
    lineHeight: 17,

    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* PROFESSIONAL                                                             */
  /* ------------------------------------------------------------------------ */

  professionalCard: {
    marginTop: 16,

    padding: 15,

    flexDirection: 'row',
    alignItems: 'flex-start',

    borderRadius: 18,

    backgroundColor: theme.colors.surfaceSecondary,

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  professionalIcon: {
    width: 43,
    height: 43,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },

  professionalCopy: {
    flex: 1,
    marginLeft: 11,
  },

  professionalTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  professionalText: {
    marginTop: 5,

    fontSize: 11,
    lineHeight: 16.5,

    color: theme.colors.textMuted,
  },

  /* ------------------------------------------------------------------------ */
  /* TIP                                                                      */
  /* ------------------------------------------------------------------------ */

  tip: {
    marginTop: 17,

    padding: 15,

    flexDirection: 'row',
    alignItems: 'flex-start',

    borderRadius: 18,

    backgroundColor: withAlpha(theme.colors.primary, 0.08),

    borderWidth: 1,
    borderColor: theme.colors.border,
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
    marginLeft: 11,
  },

  tipTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  tipText: {
    marginTop: 5,

    fontSize: 11.5,
    lineHeight: 17,

    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* TAKEAWAYS                                                                */
  /* ------------------------------------------------------------------------ */

  takeawayList: {
    marginTop: 14,

    padding: 15,

    borderRadius: 18,

    backgroundColor: withAlpha(theme.colors.success, 0.12),

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  takeawayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    marginBottom: 13,
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

    marginLeft: 9,
    paddingTop: 3,

    fontSize: 11.5,
    lineHeight: 17,

    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* DISCLAIMER                                                               */
  /* ------------------------------------------------------------------------ */

  disclaimer: {
    marginTop: 20,

    padding: 13,

    flexDirection: 'row',
    alignItems: 'flex-start',

    borderRadius: 14,

    backgroundColor: theme.colors.surfaceSecondary,
  },

  disclaimerText: {
    flex: 1,

    marginLeft: 8,

    fontSize: 10,
    lineHeight: 15,

    color: theme.colors.textMuted,
  },

  /* ------------------------------------------------------------------------ */
  /* END                                                                      */
  /* ------------------------------------------------------------------------ */

  endMark: {
    marginTop: 29,

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

    marginHorizontal: 10,

    borderRadius: 18,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.primarySoft,
  },

  endText: {
    marginTop: 10,

    textAlign: 'center',

    fontFamily: 'serif',
    fontSize: 14,
    lineHeight: 20,

    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  });
}
