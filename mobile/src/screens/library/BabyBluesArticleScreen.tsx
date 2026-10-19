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
