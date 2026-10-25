import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Image,
  Pressable,
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
import {
  isArticleBookmarked,
  loadLibraryState,
  saveScrollPosition,
  toggleBookmark,
} from '../../state/libraryStore';
import ReadingControls from '../../components/articles/ReadingControls';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
import {getBottomPadding, getTopPadding, READING_CONTROLS_SPACE} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {resolveEditorialLanguage} from '../../i18n/editorialLanguage';
import {CYCLE_PHASES_HERO, resolveEditorialImage} from '../../i18n/editorialImages';
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

const ARTICLE_ID = 'cycle-phases-expliquees';

const HERO = CYCLE_PHASES_HERO;
const DIAGRAM = require('../../assets/images/library/cycle-phases-diagram.png');

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const BODY_CHANGES_ICONS = [
  {icon: 'water-outline'},
  {icon: 'leaf'},
  {icon: 'white-balance-sunny'},
  {icon: 'weather-night'},
] as const;

const WHY_ITEMS_ICONS = [
  {icon: 'heart-pulse'},
  {icon: 'calendar-check-outline'},
  {icon: 'emoticon-happy-outline'},
  {icon: 'lightning-bolt'},
  {icon: 'notebook-edit-outline'},
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('CyclePhases', {
  fr: {
    badge: 'Cycle menstruel',
    title: 'Les différentes phases\ndu cycle expliquées',
    metaDuration: '6 min de lecture',
    metaValidated: 'Contenu validé',
    intro: 'Ton cycle menstruel se compose de plusieurs phases, chacune ayant un rôle essentiel dans ton équilibre hormonal et ta santé.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Les 4 phases du cycle',
      'Comment ton corps change',
      'Pourquoi comprendre ton cycle est important',
      'Questions fréquentes',
    ],
    body1: 'Ton cycle est généralement divisé en quatre phases principales. Leur durée peut varier d’une personne à l’autre : chaque corps possède son propre rythme.',
    diagram: {
      menstrual: {name: 'Phase menstruelle', days: 'Jours 1 à 5'},
      follicular: {name: 'Phase folliculaire', days: 'Jours 1 à 13'},
      luteal: {name: 'Phase lutéale', days: 'Jours 15 à 28'},
      ovulatory: {name: 'Phase ovulatoire', days: 'Autour du jour 14'},
    },
    tip1Title: 'Bon à savoir',
    tip1Text: 'Chaque femme est unique : observe ton corps et apprends à connaître ton propre rythme.',
    body2: 'Les variations hormonales peuvent influencer ton énergie, ton humeur, ton sommeil et certaines sensations physiques tout au long du cycle.',
    bodyChanges: [
      {title: 'Pendant les règles', text: 'Ton énergie peut être plus basse et ton corps peut avoir besoin de davantage de repos.'},
      {title: 'Phase folliculaire', text: 'L’énergie remonte progressivement et tu peux te sentir plus dynamique.'},
      {title: 'Autour de l’ovulation', text: 'Certaines femmes ressentent davantage d’énergie, de motivation et de confiance.'},
      {title: 'Phase lutéale', text: 'La fatigue, les ballonnements ou les variations d’humeur peuvent apparaître.'},
    ],
    softTipTitle: 'Écoute ton corps',
    softTipText: 'Il n’existe pas une seule façon de vivre chaque phase. Tes sensations personnelles restent le meilleur repère.',
    body3: 'Mieux connaître ton cycle peut t’aider à anticiper certaines périodes et à comprendre les changements que tu observes dans ton quotidien.',
    whyItems: [
      'Mieux comprendre les signaux de ton corps',
      'Anticiper tes règles et tes différentes phases',
      'Comprendre certaines variations d’humeur',
      'Adapter ton activité selon ton niveau d’énergie',
      'Améliorer ton suivi quotidien',
    ],
    body4: 'Voici quelques réponses aux questions souvent posées sur les différentes phases du cycle.',
    faq: [
      {
        question: 'Est-ce normal que mon cycle ne dure pas exactement 28 jours ?',
        answer: 'Oui. La durée d’un cycle peut varier d’une personne à l’autre et même légèrement d’un mois à l’autre.',
      },
      {
        question: 'L’ovulation a-t-elle toujours lieu au jour 14 ?',
        answer: 'Non. Le jour 14 est une estimation courante pour un cycle de 28 jours, mais l’ovulation peut survenir plus tôt ou plus tard.',
      },
      {
        question: 'Pourquoi mes symptômes changent-ils selon les phases ?',
        answer: 'Les variations hormonales au cours du cycle peuvent influencer l’énergie, l’humeur, le sommeil et certaines sensations physiques.',
      },
      {
        question: 'Est-ce utile de suivre mes symptômes ?',
        answer: 'Oui. Les noter régulièrement peut t’aider à reconnaître tes propres tendances et à mieux comprendre ton rythme.',
      },
    ],
    endTitle: 'Ton cycle, ton rythme',
    endText: 'Plus tu observes ton cycle, plus tu peux comprendre ce qui est habituel pour toi.',
    shareMessage: 'Les différentes phases du cycle expliquées — AWA',
  },
  en: {
    badge: 'Menstrual cycle',
    title: 'The different phases\nof the cycle explained',
    metaDuration: '6 min read',
    metaValidated: 'Reviewed content',
    intro: 'Your menstrual cycle is made up of several phases, each playing an essential role in your hormonal balance and your health.',
    contentsTitle: 'In this article',
    topics: [
      'The 4 phases of the cycle',
      'How your body changes',
      'Why understanding your cycle matters',
      'Frequently asked questions',
    ],
    body1: 'Your cycle is generally divided into four main phases. Their length can vary from person to person: every body has its own rhythm.',
    diagram: {
      menstrual: {name: 'Menstrual phase', days: 'Days 1 to 5'},
      follicular: {name: 'Follicular phase', days: 'Days 1 to 13'},
      luteal: {name: 'Luteal phase', days: 'Days 15 to 28'},
      ovulatory: {name: 'Ovulatory phase', days: 'Around day 14'},
    },
    tip1Title: 'Good to know',
    tip1Text: 'Every woman is unique: observe your body and learn your own rhythm.',
    body2: 'Hormonal changes can influence your energy, mood, sleep, and certain physical sensations throughout the cycle.',
    bodyChanges: [
      {title: 'During your period', text: 'Your energy may be lower and your body may need more rest.'},
      {title: 'Follicular phase', text: 'Energy gradually rises and you may feel more energized.'},
      {title: 'Around ovulation', text: 'Some women feel more energy, motivation, and confidence.'},
      {title: 'Luteal phase', text: 'Fatigue, bloating, or mood changes may appear.'},
    ],
    softTipTitle: 'Listen to your body',
    softTipText: 'There isn’t just one way to experience each phase. Your own sensations remain the best guide.',
    body3: 'Getting to know your cycle better can help you anticipate certain periods and understand the changes you notice day to day.',
    whyItems: [
      'Better understand your body’s signals',
      'Anticipate your period and its different phases',
      'Understand certain mood changes',
      'Adjust your activity to your energy level',
      'Improve your daily tracking',
    ],
    body4: 'Here are a few answers to questions commonly asked about the different phases of the cycle.',
    faq: [
      {
        question: 'Is it normal that my cycle doesn’t last exactly 28 days?',
        answer: 'Yes. The length of a cycle can vary from person to person, and even slightly from month to month.',
      },
      {
        question: 'Does ovulation always happen on day 14?',
        answer: 'No. Day 14 is a common estimate for a 28-day cycle, but ovulation can happen earlier or later.',
      },
      {
        question: 'Why do my symptoms change depending on the phase?',
        answer: 'Hormonal changes throughout the cycle can influence energy, mood, sleep, and certain physical sensations.',
      },
      {
        question: 'Is it useful to track my symptoms?',
        answer: 'Yes. Noting them regularly can help you recognize your own patterns and better understand your rhythm.',
      },
    ],
    endTitle: 'Your cycle, your rhythm',
    endText: 'The more you observe your cycle, the more you can understand what’s typical for you.',
    shareMessage: 'The different phases of the cycle explained — AWA',
  },
  es: {
    badge: 'Ciclo menstrual',
    title: 'Las diferentes fases\ndel ciclo explicadas',
    metaDuration: '6 min de lectura',
    metaValidated: 'Contenido validado',
    intro: 'Tu ciclo menstrual se compone de varias fases, cada una con un papel esencial en tu equilibrio hormonal y tu salud.',
    contentsTitle: 'En este artículo',
    topics: [
      'Las 4 fases del ciclo',
      'Cómo cambia tu cuerpo',
      'Por qué es importante entender tu ciclo',
      'Preguntas frecuentes',
    ],
    body1: 'Tu ciclo generalmente se divide en cuatro fases principales. Su duración puede variar de una persona a otra: cada cuerpo tiene su propio ritmo.',
    diagram: {
      menstrual: {name: 'Fase menstrual', days: 'Días 1 a 5'},
      follicular: {name: 'Fase folicular', days: 'Días 1 a 13'},
      luteal: {name: 'Fase lútea', days: 'Días 15 a 28'},
      ovulatory: {name: 'Fase ovulatoria', days: 'Alrededor del día 14'},
    },
    tip1Title: 'Dato útil',
    tip1Text: 'Cada mujer es única: observa tu cuerpo y aprende a conocer tu propio ritmo.',
    body2: 'Las variaciones hormonales pueden influir en tu energía, tu estado de ánimo, tu sueño y ciertas sensaciones físicas a lo largo del ciclo.',
    bodyChanges: [
      {title: 'Durante el período', text: 'Tu energía puede ser más baja y tu cuerpo puede necesitar más descanso.'},
      {title: 'Fase folicular', text: 'La energía sube progresivamente y puedes sentirte más activa.'},
      {title: 'Alrededor de la ovulación', text: 'Algunas mujeres sienten más energía, motivación y confianza.'},
      {title: 'Fase lútea', text: 'Pueden aparecer fatiga, hinchazón o cambios en el estado de ánimo.'},
    ],
    softTipTitle: 'Escucha a tu cuerpo',
    softTipText: 'No existe una única forma de vivir cada fase. Tus propias sensaciones siguen siendo la mejor referencia.',
    body3: 'Conocer mejor tu ciclo puede ayudarte a anticipar ciertos momentos y a entender los cambios que observas en tu día a día.',
    whyItems: [
      'Entender mejor las señales de tu cuerpo',
      'Anticipar tu período y sus diferentes fases',
      'Entender ciertos cambios en el estado de ánimo',
      'Adaptar tu actividad según tu nivel de energía',
      'Mejorar tu seguimiento diario',
    ],
    body4: 'Aquí tienes algunas respuestas a las preguntas que se hacen con frecuencia sobre las diferentes fases del ciclo.',
    faq: [
      {
        question: '¿Es normal que mi ciclo no dure exactamente 28 días?',
        answer: 'Sí. La duración de un ciclo puede variar de una persona a otra, e incluso ligeramente de un mes a otro.',
      },
      {
        question: '¿La ovulación siempre ocurre en el día 14?',
        answer: 'No. El día 14 es una estimación habitual para un ciclo de 28 días, pero la ovulación puede ocurrir antes o después.',
      },
      {
        question: '¿Por qué cambian mis síntomas según la fase?',
        answer: 'Las variaciones hormonales a lo largo del ciclo pueden influir en la energía, el estado de ánimo, el sueño y ciertas sensaciones físicas.',
      },
      {
        question: '¿Es útil hacer seguimiento de mis síntomas?',
        answer: 'Sí. Anotarlos con regularidad puede ayudarte a reconocer tus propias tendencias y a entender mejor tu ritmo.',
      },
    ],
    endTitle: 'Tu ciclo, tu ritmo',
    endText: 'Cuanto más observes tu ciclo, mejor podrás entender lo que es habitual para ti.',
    shareMessage: 'Las diferentes fases del ciclo explicadas — AWA',
  },
  it: {
    badge: 'Ciclo mestruale',
    title: 'Le diverse fasi\ndel ciclo spiegate',
    metaDuration: '6 min di lettura',
    metaValidated: 'Contenuto validato',
    intro: 'Il tuo ciclo mestruale è composto da diverse fasi, ognuna con un ruolo essenziale per il tuo equilibrio ormonale e la tua salute.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Le 4 fasi del ciclo',
      'Come cambia il tuo corpo',
      'Perché è importante capire il tuo ciclo',
      'Domande frequenti',
    ],
    body1: 'Il ciclo si divide generalmente in quattro fasi principali. La loro durata può variare da persona a persona: ogni corpo ha il suo ritmo.',
    diagram: {
      menstrual: {
        name: 'Fase mestruale',
        days: 'Giorni da 1 a 5',
      },
      follicular: {
        name: 'Fase follicolare',
        days: 'Giorni da 1 a 13',
      },
      luteal: {
        name: 'Fase luteale',
        days: 'Giorni da 15 a 28',
      },
      ovulatory: {
        name: 'Fase ovulatoria',
        days: 'Intorno al giorno 14',
      },
    },
    tip1Title: 'Da sapere',
    tip1Text: 'Ogni donna è unica: osserva il tuo corpo e impara a conoscere il tuo ritmo.',
    body2: 'I cambiamenti ormonali possono influire su energia, umore, sonno e su alcune sensazioni fisiche nel corso del ciclo.',
    bodyChanges: [
      {
        title: 'Durante il periodo mestruale',
        text: 'La tua energia può essere più bassa e il tuo corpo può avere bisogno di più riposo.',
      },
      {
        title: 'Fase follicolare',
        text: 'L’energia aumenta gradualmente e puoi sentirti più in forma.',
      },
      {
        title: 'Intorno all’ovulazione',
        text: 'Alcune donne sentono più energia, motivazione e fiducia in sé.',
      },
      {
        title: 'Fase luteale',
        text: 'Possono comparire stanchezza, gonfiore o variazioni dell’umore.',
      },
    ],
    softTipTitle: 'Ascolta il tuo corpo',
    softTipText: 'Non esiste un solo modo di vivere ogni fase. Le tue sensazioni restano la migliore guida.',
    body3: 'Conoscere meglio il tuo ciclo può aiutarti a prevedere alcuni momenti e a capire i cambiamenti che noti giorno dopo giorno.',
    whyItems: [
      'Comprendere meglio i segnali del tuo corpo',
      'Prevedere il tuo periodo mestruale e le sue diverse fasi',
      'Capire alcune variazioni dell’umore',
      'Adattare la tua attività al tuo livello di energia',
      'Migliorare il tuo monitoraggio quotidiano',
    ],
    body4: 'Ecco alcune risposte alle domande più frequenti sulle diverse fasi del ciclo.',
    faq: [
      {
        question: 'È normale che il mio ciclo non duri esattamente 28 giorni?',
        answer: 'Sì. La durata di un ciclo può variare da persona a persona, e anche leggermente da un mese all’altro.',
      },
      {
        question: 'L’ovulazione avviene sempre il giorno 14?',
        answer: 'No. Il giorno 14 è una stima comune per un ciclo di 28 giorni, ma l’ovulazione può avvenire prima o dopo.',
      },
      {
        question: 'Perché i miei sintomi cambiano a seconda della fase?',
        answer: 'I cambiamenti ormonali nel corso del ciclo possono influire su energia, umore, sonno e su alcune sensazioni fisiche.',
      },
      {
        question: 'È utile monitorare i miei sintomi?',
        answer: 'Sì. Annotarli con regolarità può aiutarti a riconoscere i tuoi schemi personali e a capire meglio il tuo ritmo.',
      },
    ],
    endTitle: 'Il tuo ciclo, il tuo ritmo',
    endText: 'Più osservi il tuo ciclo, più puoi capire cosa è tipico per te.',
    shareMessage: 'Le diverse fasi del ciclo spiegate — AWA',
  },
  tr: {
    badge: 'Adet döngüsü',
    title: 'Döngünün farklı\nevreleri anlatılıyor',
    metaDuration: '6 dk okuma',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Adet döngün, hormonal dengen ve sağlığın için temel bir rol oynayan birkaç evreden oluşur.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Döngünün 4 evresi',
      'Vücudun nasıl değişir',
      'Döngünü anlamak neden önemli',
      'Sık sorulan sorular',
    ],
    body1: 'Döngün genellikle dört ana evreye ayrılır. Süreleri kişiden kişiye değişebilir: her vücudun kendine özgü bir ritmi vardır.',
    diagram: {
      menstrual: {
        name: 'Adet evresi',
        days: '1. ila 5. günler',
      },
      follicular: {
        name: 'Foliküler evre',
        days: '1. ila 13. günler',
      },
      luteal: {
        name: 'Luteal evre',
        days: '15. ila 28. günler',
      },
      ovulatory: {
        name: 'Yumurtlama evresi',
        days: '14. gün civarı',
      },
    },
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Her kadın benzersizdir: vücudunu gözlemle ve kendi ritmini öğren.',
    body2: 'Hormonal değişimler, döngü boyunca enerjini, ruh halini, uykunu ve bazı bedensel hislerini etkileyebilir.',
    bodyChanges: [
      {
        title: 'Adet sırasında',
        text: 'Enerjin daha düşük olabilir ve vücudun daha fazla dinlenmeye ihtiyaç duyabilir.',
      },
      {
        title: 'Foliküler evre',
        text: 'Enerjin giderek artar ve kendini daha dinç hissedebilirsin.',
      },
      {
        title: 'Yumurtlama civarı',
        text: 'Bazı kadınlar kendini daha enerjik, motive ve kendinden emin hisseder.',
      },
      {
        title: 'Luteal evre',
        text: 'Yorgunluk, şişkinlik veya ruh hali değişimleri ortaya çıkabilir.',
      },
    ],
    softTipTitle: 'Vücudunu dinle',
    softTipText: 'Her evreyi yaşamanın tek bir yolu yoktur. Kendi hislerin en iyi rehberin olmaya devam eder.',
    body3: 'Döngünü daha iyi tanımak, bazı dönemleri önceden tahmin etmene ve günlük hayatta fark ettiğin değişimleri anlamana yardımcı olabilir.',
    whyItems: [
      'Vücudunun verdiği sinyalleri daha iyi anlamak',
      'Adetini ve farklı evrelerini önceden tahmin etmek',
      'Bazı ruh hali değişimlerini anlamak',
      'Aktiviteni enerji düzeyine göre ayarlamak',
      'Günlük takibini geliştirmek',
    ],
    body4: 'İşte döngünün farklı evreleri hakkında sık sorulan soruların bazı yanıtları.',
    faq: [
      {
        question: 'Döngümün tam 28 gün sürmemesi normal mi?',
        answer: 'Evet. Bir döngünün uzunluğu kişiden kişiye, hatta aydan aya hafifçe değişebilir.',
      },
      {
        question: 'Yumurtlama her zaman 14. günde mi olur?',
        answer: 'Hayır. 14. gün, 28 günlük bir döngü için yaygın bir tahmindir, ancak yumurtlama daha erken veya daha geç olabilir.',
      },
      {
        question: 'Belirtilerim neden evreye göre değişiyor?',
        answer: 'Döngü boyunca yaşanan hormonal değişimler enerjiyi, ruh halini, uykuyu ve bazı bedensel hisleri etkileyebilir.',
      },
      {
        question: 'Belirtilerimi takip etmek işe yarar mı?',
        answer: 'Evet. Belirtilerini düzenli olarak not etmek, kendi örüntülerini fark etmene ve ritmini daha iyi anlamana yardımcı olabilir.',
      },
    ],
    endTitle: 'Döngün, senin ritmin',
    endText: 'Döngünü ne kadar çok gözlemlersen, senin için neyin olağan olduğunu o kadar iyi anlayabilirsin.',
    shareMessage: 'Döngünün farklı evreleri anlatılıyor — AWA',
  },
  ru: {
    badge: 'Менструальный цикл',
    title: 'Фазы цикла:\nобъясняем простыми словами',
    metaDuration: '6 мин чтения',
    metaValidated: 'Проверенный материал',
    intro: 'Ваш менструальный цикл состоит из нескольких фаз, каждая из которых играет важную роль в гормональном балансе и здоровье.',
    contentsTitle: 'В этой статье',
    topics: [
      '4 фазы цикла',
      'Как меняется ваше тело',
      'Почему важно понимать свой цикл',
      'Часто задаваемые вопросы',
    ],
    body1: 'Цикл обычно делится на четыре основные фазы. Их продолжительность может отличаться у разных женщин: у каждого организма свой ритм.',
    diagram: {
      menstrual: {
        name: 'Менструальная фаза',
        days: 'С 1-го по 5-й день',
      },
      follicular: {
        name: 'Фолликулярная фаза',
        days: 'С 1-го по 13-й день',
      },
      luteal: {
        name: 'Лютеиновая фаза',
        days: 'С 15-го по 28-й день',
      },
      ovulatory: {
        name: 'Овуляторная фаза',
        days: 'Около 14-го дня',
      },
    },
    tip1Title: 'ПОЛЕЗНО ЗНАТЬ',
    tip1Text: 'Каждая женщина уникальна: наблюдайте за своим телом и узнавайте свой собственный ритм.',
    body2: 'Гормональные изменения могут влиять на вашу энергию, настроение, сон и некоторые физические ощущения на протяжении цикла.',
    bodyChanges: [
      {
        title: 'Во время месячных',
        text: 'Энергии может быть меньше, а организму может требоваться больше отдыха.',
      },
      {
        title: 'Фолликулярная фаза',
        text: 'Энергия постепенно растёт, и вы можете чувствовать себя бодрее.',
      },
      {
        title: 'Около овуляции',
        text: 'Некоторые женщины чувствуют прилив энергии, мотивации и уверенности.',
      },
      {
        title: 'Лютеиновая фаза',
        text: 'Могут появиться усталость, вздутие или перепады настроения.',
      },
    ],
    softTipTitle: 'Прислушивайтесь к своему телу',
    softTipText: 'Каждую фазу можно переживать по-разному. Ваши собственные ощущения остаются лучшим ориентиром.',
    body3: 'Лучшее понимание своего цикла может помочь заранее предвидеть некоторые периоды и разобраться в изменениях, которые вы замечаете изо дня в день.',
    whyItems: [
      'Лучше понимать сигналы своего тела',
      'Заранее предвидеть месячные и разные фазы цикла',
      'Понимать некоторые перепады настроения',
      'Подстраивать активность под уровень энергии',
      'Улучшить ежедневное отслеживание',
    ],
    body4: 'Вот несколько ответов на частые вопросы о разных фазах цикла.',
    faq: [
      {
        question: 'Нормально ли, что мой цикл длится не ровно 28 дней?',
        answer: 'Да. Продолжительность цикла может отличаться у разных женщин и даже немного меняться от месяца к месяцу.',
      },
      {
        question: 'Всегда ли овуляция происходит на 14-й день?',
        answer: 'Нет. 14-й день — это распространённая оценка для 28-дневного цикла, но овуляция может наступить раньше или позже.',
      },
      {
        question: 'Почему мои симптомы меняются в зависимости от фазы?',
        answer: 'Гормональные изменения на протяжении цикла могут влиять на энергию, настроение, сон и некоторые физические ощущения.',
      },
      {
        question: 'Полезно ли отслеживать симптомы?',
        answer: 'Да. Регулярные записи помогают заметить собственные закономерности и лучше понять свой ритм.',
      },
    ],
    endTitle: 'Ваш цикл, ваш ритм',
    endText: 'Чем внимательнее вы наблюдаете за своим циклом, тем лучше понимаете, что для вас типично.',
    shareMessage: 'Фазы цикла: объясняем простыми словами — AWA',
  },
  de: {
    badge: 'Menstruationszyklus',
    title: 'Die verschiedenen Phasen\ndes Zyklus einfach erklärt',
    metaDuration: '6 Min. Lesezeit',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Dein Menstruationszyklus besteht aus mehreren Phasen, die jeweils eine wichtige Rolle für dein hormonelles Gleichgewicht und deine Gesundheit spielen.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Die 4 Phasen des Zyklus',
      'Wie sich dein Körper verändert',
      'Warum es wichtig ist, deinen Zyklus zu verstehen',
      'Häufige Fragen',
    ],
    body1: 'Dein Zyklus wird in der Regel in vier Hauptphasen eingeteilt. Ihre Dauer kann von Person zu Person unterschiedlich sein: Jeder Körper hat seinen eigenen Rhythmus.',
    diagram: {
      menstrual: {name: 'Menstruationsphase', days: 'Tag 1 bis 5'},
      follicular: {name: 'Follikelphase', days: 'Tag 1 bis 13'},
      luteal: {name: 'Lutealphase', days: 'Tag 15 bis 28'},
      ovulatory: {name: 'Ovulationsphase', days: 'Etwa Tag 14'},
    },
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Jede Frau ist einzigartig: Beobachte deinen Körper und lerne deinen eigenen Rhythmus kennen.',
    body2: 'Hormonelle Veränderungen können im Lauf des Zyklus deine Energie, deine Stimmung, deinen Schlaf und bestimmte körperliche Empfindungen beeinflussen.',
    bodyChanges: [
      {title: 'Während deiner Periode', text: 'Deine Energie kann geringer sein, und dein Körper braucht möglicherweise mehr Ruhe.'},
      {title: 'Follikelphase', text: 'Die Energie steigt allmählich, und du fühlst dich vielleicht fitter.'},
      {title: 'Um den Eisprung', text: 'Manche Frauen fühlen sich energiegeladener, motivierter und selbstsicherer.'},
      {title: 'Lutealphase', text: 'Müdigkeit, Blähungen oder Stimmungsschwankungen können auftreten.'},
    ],
    softTipTitle: 'Höre auf deinen Körper',
    softTipText: 'Es gibt nicht nur eine Art, jede Phase zu erleben. Deine eigenen Empfindungen bleiben der beste Wegweiser.',
    body3: 'Wenn du deinen Zyklus besser kennst, kannst du bestimmte Phasen vorausahnen und die Veränderungen verstehen, die dir im Alltag auffallen.',
    whyItems: [
      'Die Signale deines Körpers besser verstehen',
      'Deine Periode und die verschiedenen Zyklusphasen vorausahnen',
      'Bestimmte Stimmungsschwankungen nachvollziehen',
      'Deine Aktivität an dein Energieniveau anpassen',
      'Dein tägliches Tracking verbessern',
    ],
    body4: 'Hier findest du ein paar Antworten auf häufige Fragen zu den verschiedenen Phasen des Zyklus.',
    faq: [
      {
        question: 'Ist es normal, dass mein Zyklus nicht genau 28 Tage dauert?',
        answer: 'Ja. Die Zyklusdauer kann von Person zu Person und sogar von Monat zu Monat leicht schwanken.',
      },
      {
        question: 'Findet der Eisprung immer an Tag 14 statt?',
        answer: 'Nein. Tag 14 ist ein gängiger Richtwert für einen 28-Tage-Zyklus, aber der Eisprung kann früher oder später stattfinden.',
      },
      {
        question: 'Warum verändern sich meine Symptome je nach Phase?',
        answer: 'Hormonelle Veränderungen im Lauf des Zyklus können Energie, Stimmung, Schlaf und bestimmte körperliche Empfindungen beeinflussen.',
      },
      {
        question: 'Ist es sinnvoll, meine Symptome festzuhalten?',
        answer: 'Ja. Wenn du sie regelmäßig notierst, erkennst du leichter deine eigenen Muster und verstehst deinen Rhythmus besser.',
      },
    ],
    endTitle: 'Dein Zyklus, dein Rhythmus',
    endText: 'Je mehr du deinen Zyklus beobachtest, desto besser verstehst du, was für dich typisch ist.',
    shareMessage: 'Die verschiedenen Phasen des Zyklus einfach erklärt — AWA',
  },
  zh: {
      badge: '月经周期',
      title: '月经周期\n各个阶段详解',
      metaDuration: '阅读约 6 分钟',
      metaValidated: '已审核内容',
      intro: '你的月经周期由几个阶段组成，每个阶段对你的激素平衡和健康都起着重要作用。',
      contentsTitle: '本文内容',
      topics: [
        '周期的 4 个阶段',
        '你的身体如何变化',
        '为什么了解周期很重要',
        '常见问题',
      ],
      body1: '你的周期通常分为四个主要阶段。每个阶段的长度因人而异：每个人的身体都有自己的节奏。',
      diagram: {
        menstrual: {
          name: '月经期',
          days: '第 1 至 5 天',
        },
        follicular: {
          name: '卵泡期',
          days: '第 1 至 13 天',
        },
        luteal: {
          name: '黄体期',
          days: '第 15 至 28 天',
        },
        ovulatory: {
          name: '排卵期',
          days: '第 14 天前后',
        },
      },
      tip1Title: '小贴士',
      tip1Text: '每个人都是独一无二的：留意自己的身体，了解属于你自己的节奏。',
      body2: '激素的变化会在整个周期中影响你的精力、情绪、睡眠和某些身体感受。',
      bodyChanges: [
        {
          title: '月经期间',
          text: '你的精力可能较低，身体可能需要更多休息。',
        },
        {
          title: '卵泡期',
          text: '精力逐渐回升，你可能会感觉更有活力。',
        },
        {
          title: '排卵前后',
          text: '有些女性会感到精力、干劲和自信更足。',
        },
        {
          title: '黄体期',
          text: '可能出现疲倦、腹胀或情绪波动。',
        },
      ],
      softTipTitle: '倾听身体的声音',
      softTipText: '每个阶段的感受并不只有一种。你自己的感觉始终是最好的参考。',
      body3: '更好地了解自己的周期，可以帮助你预判某些时段，并理解日常中察觉到的变化。',
      whyItems: [
        '更好地理解身体发出的信号',
        '预判月经来潮及周期的各个阶段',
        '理解某些情绪变化',
        '根据精力状态调整活动安排',
        '让日常记录更完善',
      ],
      body4: '以下是关于周期各个阶段的一些常见问题解答。',
      faq: [
        {
          question: '我的周期不是刚好 28 天，正常吗？',
          answer: '是的。周期长度因人而异，甚至每个月之间也可能略有不同。',
        },
        {
          question: '排卵一定发生在第 14 天吗？',
          answer: '不一定。对于 28 天的周期，第 14 天是常见的估算，但排卵可能更早或更晚。',
        },
        {
          question: '为什么我的症状会随阶段变化？',
          answer: '整个周期中的激素变化会影响精力、情绪、睡眠和某些身体感受。',
        },
        {
          question: '记录症状有用吗？',
          answer: '有用。定期记录可以帮助你发现自己的规律，更好地了解自己的节奏。',
        },
      ],
      endTitle: '你的周期，你的节奏',
      endText: '你越是留意自己的周期，就越能了解什么对你来说是常态。',
      shareMessage: '月经周期各个阶段详解 — AWA',
    },
  id: {
    badge: 'Siklus menstruasi',
    title: 'Penjelasan berbagai fase\ndalam siklus',
    metaDuration: '6 menit baca',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Siklus menstruasimu terdiri dari beberapa fase, yang masing-masing berperan penting dalam keseimbangan hormon dan kesehatanmu.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      '4 fase siklus',
      'Bagaimana tubuhmu berubah',
      'Mengapa memahami siklusmu itu penting',
      'Pertanyaan yang sering diajukan',
    ],
    body1: 'Siklusmu umumnya dibagi menjadi empat fase utama. Lamanya bisa berbeda dari satu orang ke orang lain: setiap tubuh punya iramanya sendiri.',
    diagram: {
      menstrual: {
        name: 'Fase menstruasi',
        days: 'Hari ke-1 sampai ke-5',
      },
      follicular: {
        name: 'Fase folikuler',
        days: 'Hari ke-1 sampai ke-13',
      },
      luteal: {
        name: 'Fase luteal',
        days: 'Hari ke-15 sampai ke-28',
      },
      ovulatory: {
        name: 'Fase ovulasi',
        days: 'Sekitar hari ke-14',
      },
    },
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Setiap perempuan unik: amati tubuhmu dan kenali iramamu sendiri.',
    body2: 'Perubahan hormon bisa memengaruhi energi, suasana hati, tidur, dan beberapa sensasi fisik sepanjang siklus.',
    bodyChanges: [
      {
        title: 'Saat haid',
        text: 'Energimu mungkin lebih rendah dan tubuhmu mungkin butuh lebih banyak istirahat.',
      },
      {
        title: 'Fase folikuler',
        text: 'Energi naik secara bertahap dan kamu mungkin merasa lebih bersemangat.',
      },
      {
        title: 'Sekitar ovulasi',
        text: 'Sebagian perempuan merasa lebih berenergi, termotivasi, dan percaya diri.',
      },
      {
        title: 'Fase luteal',
        text: 'Kelelahan, kembung, atau perubahan suasana hati bisa muncul.',
      },
    ],
    softTipTitle: 'Dengarkan tubuhmu',
    softTipText: 'Tidak hanya ada satu cara untuk menjalani setiap fase. Sensasi yang kamu rasakan sendiri tetap menjadi panduan terbaik.',
    body3: 'Mengenal siklusmu lebih baik dapat membantumu mengantisipasi masa-masa tertentu dan memahami perubahan yang kamu rasakan dari hari ke hari.',
    whyItems: [
      'Lebih memahami sinyal dari tubuhmu',
      'Mengantisipasi haidmu dan berbagai fasenya',
      'Memahami beberapa perubahan suasana hati',
      'Menyesuaikan aktivitas dengan tingkat energimu',
      'Meningkatkan pencatatan harianmu',
    ],
    body4: 'Berikut beberapa jawaban atas pertanyaan yang sering diajukan tentang berbagai fase siklus.',
    faq: [
      {
        question: 'Apakah normal jika siklusku tidak persis 28 hari?',
        answer: 'Ya. Panjang siklus bisa berbeda dari satu orang ke orang lain, bahkan sedikit berbeda dari bulan ke bulan.',
      },
      {
        question: 'Apakah ovulasi selalu terjadi pada hari ke-14?',
        answer: 'Tidak. Hari ke-14 adalah perkiraan umum untuk siklus 28 hari, tetapi ovulasi bisa terjadi lebih awal atau lebih lambat.',
      },
      {
        question: 'Mengapa gejalaku berubah tergantung fasenya?',
        answer: 'Perubahan hormon sepanjang siklus bisa memengaruhi energi, suasana hati, tidur, dan beberapa sensasi fisik.',
      },
      {
        question: 'Apakah berguna mencatat gejalaku?',
        answer: 'Ya. Mencatatnya secara teratur dapat membantumu mengenali pola dirimu sendiri dan lebih memahami iramamu.',
      },
    ],
    endTitle: 'Siklusmu, iramamu',
    endText: 'Semakin sering kamu mengamati siklusmu, semakin kamu bisa memahami apa yang wajar bagimu.',
    shareMessage: 'Penjelasan berbagai fase dalam siklus — AWA',
  },
  hi: {
    badge: 'मासिक चक्र',
    title: 'चक्र के अलग-अलग\nचरण, आसान भाषा में',
    metaDuration: '6 मिनट का पाठ',
    metaValidated: 'समीक्षा किया गया कंटेंट',
    intro: 'आपका मासिक चक्र कई चरणों से मिलकर बनता है, और हर चरण आपके हार्मोनल संतुलन और सेहत में अहम भूमिका निभाता है।',
    contentsTitle: 'इस लेख में',
    topics: [
      'चक्र के 4 चरण',
      'आपका शरीर कैसे बदलता है',
      'अपने चक्र को समझना क्यों ज़रूरी है',
      'अक्सर पूछे जाने वाले सवाल',
    ],
    body1: 'आपका चक्र आमतौर पर चार मुख्य चरणों में बँटा होता है। इनकी अवधि हर महिला में अलग हो सकती है: हर शरीर की अपनी लय होती है।',
    diagram: {
      menstrual: {
        name: 'मासिक धर्म चरण',
        days: 'दिन 1 से 5',
      },
      follicular: {
        name: 'फ़ॉलिकुलर चरण',
        days: 'दिन 1 से 13',
      },
      luteal: {
        name: 'ल्यूटियल चरण',
        days: 'दिन 15 से 28',
      },
      ovulatory: {
        name: 'ओव्यूलेशन चरण',
        days: 'दिन 14 के आसपास',
      },
    },
    tip1Title: 'जानना अच्छा रहेगा',
    tip1Text: 'हर महिला अलग होती है: अपने शरीर को देखें और अपनी लय पहचानें।',
    body2: 'हार्मोनल बदलाव पूरे चक्र में आपकी ऊर्जा, मूड, नींद और कुछ शारीरिक एहसासों को प्रभावित कर सकते हैं।',
    bodyChanges: [
      {
        title: 'आपके पीरियड के दौरान',
        text: 'आपकी ऊर्जा कम हो सकती है और शरीर को ज़्यादा आराम की ज़रूरत पड़ सकती है।',
      },
      {
        title: 'फ़ॉलिकुलर चरण',
        text: 'ऊर्जा धीरे-धीरे बढ़ती है और आप ज़्यादा तरोताज़ा महसूस कर सकती हैं।',
      },
      {
        title: 'ओव्यूलेशन के आसपास',
        text: 'कुछ महिलाएँ ज़्यादा ऊर्जा, उत्साह और आत्मविश्वास महसूस करती हैं।',
      },
      {
        title: 'ल्यूटियल चरण',
        text: 'थकान, पेट फूलना या मूड में बदलाव दिख सकते हैं।',
      },
    ],
    softTipTitle: 'अपने शरीर की सुनें',
    softTipText: 'हर चरण को महसूस करने का सिर्फ़ एक तरीका नहीं होता। आपके अपने एहसास ही सबसे अच्छा मार्गदर्शन हैं।',
    body3: 'अपने चक्र को बेहतर जानने से आप कुछ समय का पहले से अंदाज़ा लगा सकती हैं और रोज़ दिखने वाले बदलावों को समझ सकती हैं।',
    whyItems: [
      'अपने शरीर के संकेतों को बेहतर समझें',
      'अपने पीरियड और उसके अलग-अलग चरणों का पहले से अंदाज़ा लगाएँ',
      'मूड के कुछ बदलावों को समझें',
      'अपनी ऊर्जा के हिसाब से गतिविधि तय करें',
      'अपनी रोज़ की ट्रैकिंग बेहतर करें',
    ],
    body4: 'चक्र के अलग-अलग चरणों के बारे में अक्सर पूछे जाने वाले कुछ सवालों के जवाब यहाँ हैं।',
    faq: [
      {
        question: 'क्या यह सामान्य है कि मेरा चक्र ठीक 28 दिन का नहीं होता?',
        answer: 'हाँ। चक्र की अवधि हर महिला में अलग हो सकती है, और एक ही महिला में महीने-दर-महीने थोड़ी बदल भी सकती है।',
      },
      {
        question: 'क्या ओव्यूलेशन हमेशा दिन 14 को ही होता है?',
        answer: 'नहीं। 28 दिन के चक्र के लिए दिन 14 एक आम अनुमान है, लेकिन ओव्यूलेशन इससे पहले या बाद में भी हो सकता है।',
      },
      {
        question: 'चरण के हिसाब से मेरे लक्षण क्यों बदलते हैं?',
        answer: 'पूरे चक्र में होने वाले हार्मोनल बदलाव ऊर्जा, मूड, नींद और कुछ शारीरिक एहसासों को प्रभावित कर सकते हैं।',
      },
      {
        question: 'क्या अपने लक्षण ट्रैक करना फ़ायदेमंद है?',
        answer: 'हाँ। इन्हें नियमित रूप से नोट करने से आप अपने पैटर्न पहचान सकती हैं और अपनी लय को बेहतर समझ सकती हैं।',
      },
    ],
    endTitle: 'आपका चक्र, आपकी लय',
    endText: 'आप अपने चक्र को जितना ज़्यादा देखेंगी, उतना बेहतर समझ पाएँगी कि आपके लिए क्या सामान्य है।',
    shareMessage: 'चक्र के अलग-अलग चरण, आसान भाषा में — AWA',
  },
  sq: {
    badge: 'Cikli menstrual',
    title: 'Fazat e ndryshme\ntë ciklit të shpjeguara',
    metaDuration: '6 min lexim',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Cikli yt menstrual përbëhet nga disa faza, secila me një rol thelbësor në ekuilibrin tënd hormonal dhe në shëndetin tënd.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      '4 fazat e ciklit',
      'Si ndryshon trupi yt',
      'Pse ka rëndësi ta kuptosh ciklin tënd',
      'Pyetje të shpeshta',
    ],
    body1: 'Cikli yt ndahet përgjithësisht në katër faza kryesore. Gjatësia e tyre mund të ndryshojë nga një person te tjetri: çdo trup ka ritmin e vet.',
    diagram: {
      menstrual: {
        name: 'Faza menstruale',
        days: 'Ditët 1 deri në 5',
      },
      follicular: {
        name: 'Faza folikulare',
        days: 'Ditët 1 deri në 13',
      },
      luteal: {
        name: 'Faza luteale',
        days: 'Ditët 15 deri në 28',
      },
      ovulatory: {
        name: 'Faza e ovulacionit',
        days: 'Rreth ditës 14',
      },
    },
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Çdo grua është unike: vëzhgo trupin tënd dhe mëso ritmin tënd.',
    body2: 'Ndryshimet hormonale mund të ndikojnë te energjia, disponimi, gjumi dhe disa ndjesi fizike gjatë ciklit.',
    bodyChanges: [
      {
        title: 'Gjatë menstruacioneve',
        text: 'Energjia jote mund të jetë më e ulët dhe trupi yt mund të ketë nevojë për më shumë pushim.',
      },
      {
        title: 'Faza folikulare',
        text: 'Energjia rritet gradualisht dhe mund të ndihesh më plot energji.',
      },
      {
        title: 'Rreth ovulacionit',
        text: 'Disa gra ndihen me më shumë energji, motivim dhe vetëbesim.',
      },
      {
        title: 'Faza luteale',
        text: 'Mund të shfaqen lodhje, fryrje ose ndryshime të gjendjes shpirtërore.',
      },
    ],
    softTipTitle: 'Dëgjo trupin tënd',
    softTipText: 'Nuk ka vetëm një mënyrë për ta përjetuar çdo fazë. Ndjesitë e tua mbeten udhërrëfyesi më i mirë.',
    body3: 'Ta njohësh më mirë ciklin tënd mund të të ndihmojë t’i parashikosh disa periudha dhe t’i kuptosh ndryshimet që vëren çdo ditë.',
    whyItems: [
      'Të kuptosh më mirë sinjalet e trupit tënd',
      'Të parashikosh menstruacionet dhe fazat e tyre të ndryshme',
      'Të kuptosh disa ndryshime të gjendjes shpirtërore',
      'Ta përshtatësh aktivitetin me nivelin e energjisë',
      'Ta përmirësosh ndjekjen tënde të përditshme',
    ],
    body4: 'Ja disa përgjigje për pyetjet që bëhen shpesh rreth fazave të ndryshme të ciklit.',
    faq: [
      {
        question: 'A është normale kur cikli im nuk zgjat saktësisht 28 ditë?',
        answer: 'Po. Gjatësia e ciklit mund të ndryshojë nga një person te tjetri, madje edhe pak nga një muaj te tjetri.',
      },
      {
        question: 'A ndodh ovulacioni gjithmonë në ditën 14?',
        answer: 'Jo. Dita 14 është një vlerësim i zakonshëm për një cikël 28-ditor, por ovulacioni mund të ndodhë më herët ose më vonë.',
      },
      {
        question: 'Pse simptomat e mia ndryshojnë sipas fazës?',
        answer: 'Ndryshimet hormonale gjatë ciklit mund të ndikojnë te energjia, disponimi, gjumi dhe disa ndjesi fizike.',
      },
      {
        question: 'A është e dobishme të ndjek simptomat e mia?',
        answer: 'Po. T’i shënosh rregullisht mund të të ndihmojë t’i njohësh modelet e tua dhe ta kuptosh më mirë ritmin tënd.',
      },
    ],
    endTitle: 'Cikli yt, ritmi yt',
    endText: 'Sa më shumë ta vëzhgosh ciklin tënd, aq më shumë mund ta kuptosh se çfarë është tipike për ty.',
    shareMessage: 'Fazat e ndryshme të ciklit të shpjeguara — AWA',
  },
  ja: {
    badge: '生理周期',
    title: '周期のフェーズを\nわかりやすく解説',
    metaDuration: '読了時間6分',
    metaValidated: '確認済みの内容',
    intro: '生理周期はいくつかのフェーズで成り立っていて、それぞれがホルモンバランスと健康に大切な役割を果たしています。',
    contentsTitle: 'この記事の内容',
    topics: [
      '周期の4つのフェーズ',
      '体の変化',
      '周期を知ることが大切な理由',
      'よくある質問',
    ],
    body1: '周期は一般に、4つの主なフェーズに分けられます。長さは人によって異なり、体にはそれぞれのリズムがあります。',
    diagram: {
      menstrual: {
        name: '月経期',
        days: '1〜5日目',
      },
      follicular: {
        name: '卵胞期',
        days: '1〜13日目',
      },
      luteal: {
        name: '黄体期',
        days: '15〜28日目',
      },
      ovulatory: {
        name: '排卵期',
        days: '14日目前後',
      },
    },
    tip1Title: '知っておきたいこと',
    tip1Text: '女性は一人ひとり違います。ご自身の体をよく観察して、自分のリズムを知りましょう。',
    body2: 'ホルモンの変化は、周期を通じて、エネルギー、気分、睡眠、そして体のいくつかの感覚に影響することがあります。',
    bodyChanges: [
      {
        title: '生理中',
        text: 'エネルギーが低めになり、体がいつもより休息を必要とすることがあります。',
      },
      {
        title: '卵胞期',
        text: 'エネルギーが少しずつ高まり、活力を感じやすくなることがあります。',
      },
      {
        title: '排卵の前後',
        text: 'エネルギーややる気、自信が高まると感じる人もいます。',
      },
      {
        title: '黄体期',
        text: '疲れ、お腹の張り、気分の変化が現れることがあります。',
      },
    ],
    softTipTitle: '体の声に耳を傾けましょう',
    softTipText: '各フェーズの感じ方は一通りではありません。ご自身の感覚が、いちばん確かな目安です。',
    body3: '周期をよく知ることで、ある時期を予測しやすくなり、日々感じる変化も理解しやすくなります。',
    whyItems: [
      '体からのサインをよりよく理解できる',
      '生理や各フェーズを予測しやすくなる',
      '気分の変化の理由がわかりやすくなる',
      'エネルギーの状態に合わせて活動を調整できる',
      '毎日の記録をより充実させられる',
    ],
    body4: 'ここでは、周期のフェーズについてよくある質問にお答えします。',
    faq: [
      {
        question: '周期がきっかり28日ではないのは普通ですか？',
        answer: 'はい。周期の長さは人によって異なり、同じ人でも月ごとに少し変わることがあります。',
      },
      {
        question: '排卵はいつも14日目に起こりますか？',
        answer: 'いいえ。14日目は28日周期でよく使われる目安ですが、排卵はそれより早く、または遅く起こることもあります。',
      },
      {
        question: 'フェーズによって症状が変わるのはなぜですか？',
        answer: '周期を通じたホルモンの変化が、エネルギー、気分、睡眠、そして体のいくつかの感覚に影響することがあります。',
      },
      {
        question: '症状を記録するのは役に立ちますか？',
        answer: 'はい。こまめに記録すると、ご自身のパターンに気づきやすくなり、リズムへの理解が深まります。',
      },
    ],
    endTitle: 'あなたの周期、あなたのリズム',
    endText: '周期をよく観察するほど、自分にとっての普通がわかるようになります。',
    shareMessage: '周期のフェーズをわかりやすく解説 — AWA',
  },
  ko: {
    badge: '생리 주기',
    title: '생리 주기의 여러 단계,\n쉽게 알아봐요',
    metaDuration: '읽는 데 6분',
    metaValidated: '검토된 콘텐츠',
    intro: '생리 주기는 여러 단계로 이루어져 있고, 각 단계는 호르몬 균형과 건강에 중요한 역할을 해요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '주기의 4단계',
      '몸은 어떻게 달라질까요',
      '주기를 이해하는 것이 중요한 이유',
      '자주 묻는 질문',
    ],
    body1: '주기는 보통 크게 네 단계로 나뉘어요. 단계별 길이는 사람마다 다를 수 있어요. 몸마다 자기만의 리듬이 있으니까요.',
    diagram: {
      menstrual: {
        name: '월경기',
        days: '1~5일째',
      },
      follicular: {
        name: '난포기',
        days: '1~13일째',
      },
      luteal: {
        name: '황체기',
        days: '15~28일째',
      },
      ovulatory: {
        name: '배란기',
        days: '14일째 즈음',
      },
    },
    tip1Title: '알아두면 좋아요',
    tip1Text: '사람마다 모두 달라요. 몸을 관찰하면서 나만의 리듬을 알아가 보세요.',
    body2: '호르몬 변화는 주기 내내 에너지, 기분, 수면, 그리고 몇몇 신체 감각에 영향을 줄 수 있어요.',
    bodyChanges: [
      {
        title: '생리 중',
        text: '에너지가 떨어지고 몸이 더 많은 휴식을 필요로 할 수 있어요.',
      },
      {
        title: '난포기',
        text: '에너지가 서서히 올라가면서 활력이 느껴질 수 있어요.',
      },
      {
        title: '배란 즈음',
        text: '에너지, 의욕, 자신감이 더 커졌다고 느끼는 사람도 있어요.',
      },
      {
        title: '황체기',
        text: '피로감, 복부 팽만, 기분 변화가 나타날 수 있어요.',
      },
    ],
    softTipTitle: '몸의 소리에 귀 기울이기',
    softTipText: '각 단계를 겪는 방식은 한 가지만 있는 것이 아니에요. 내가 느끼는 감각이 여전히 가장 좋은 길잡이예요.',
    body3: '주기를 더 잘 알면 특정 시기를 미리 예상하고, 하루하루 느끼는 변화를 이해하는 데 도움이 될 수 있어요.',
    whyItems: [
      '몸이 보내는 신호를 더 잘 이해할 수 있어요',
      '생리와 각 단계를 미리 예상할 수 있어요',
      '기분 변화를 이해하는 데 도움이 돼요',
      '에너지 수준에 맞춰 활동을 조절할 수 있어요',
      '일상 기록을 더 잘 할 수 있어요',
    ],
    body4: '주기의 여러 단계에 대해 자주 묻는 질문에 답해 드려요.',
    faq: [
      {
        question: '주기가 정확히 28일이 아니어도 괜찮은가요?',
        answer: '네. 주기의 길이는 사람마다 다를 수 있고, 같은 사람도 달마다 조금씩 달라질 수 있어요.',
      },
      {
        question: '배란은 항상 14일째에 일어나나요?',
        answer: '아니에요. 14일째는 28일 주기에서 흔히 쓰는 추정일 뿐이고, 배란은 더 일찍 또는 더 늦게 일어날 수 있어요.',
      },
      {
        question: '단계에 따라 증상이 달라지는 이유는 무엇인가요?',
        answer: '주기 동안의 호르몬 변화가 에너지, 기분, 수면, 그리고 몇몇 신체 감각에 영향을 줄 수 있어요.',
      },
      {
        question: '증상을 기록하는 것이 도움이 되나요?',
        answer: '네. 꾸준히 기록하면 나만의 패턴을 알아보고 내 리듬을 더 잘 이해하는 데 도움이 될 수 있어요.',
      },
    ],
    endTitle: '나의 주기, 나의 리듬',
    endText: '주기를 더 많이 관찰할수록 나에게 평소 어떤 모습이 자연스러운지 더 잘 알 수 있어요.',
    shareMessage: '생리 주기의 여러 단계, 쉽게 알아봐요 — AWA',
  },
  'pt-PT': {
    badge: 'Ciclo menstrual',
    title: 'As diferentes fases\ndo ciclo explicadas',
    metaDuration: '6 min de leitura',
    metaValidated: 'Conteúdo revisto',
    intro: 'O seu ciclo menstrual é composto por várias fases, cada uma com um papel essencial no seu equilíbrio hormonal e na sua saúde.',
    contentsTitle: 'Neste artigo',
    topics: [
      'As 4 fases do ciclo',
      'Como o seu corpo muda',
      'Porque é importante compreender o seu ciclo',
      'Perguntas frequentes',
    ],
    body1: 'O ciclo divide-se geralmente em quatro fases principais. A sua duração pode variar de pessoa para pessoa: cada corpo tem o seu ritmo.',
    diagram: {
      menstrual: {
        name: 'Fase menstrual',
        days: 'Dias 1 a 5',
      },
      follicular: {
        name: 'Fase folicular',
        days: 'Dias 1 a 13',
      },
      luteal: {
        name: 'Fase lútea',
        days: 'Dias 15 a 28',
      },
      ovulatory: {
        name: 'Fase ovulatória',
        days: 'Por volta do dia 14',
      },
    },
    tip1Title: 'Bom saber',
    tip1Text: 'Cada mulher é única: observe o seu corpo e aprenda o seu próprio ritmo.',
    body2: 'As alterações hormonais podem influenciar a energia, o humor, o sono e certas sensações físicas ao longo do ciclo.',
    bodyChanges: [
      {
        title: 'Durante o período',
        text: 'A energia pode estar mais baixa e o corpo pode precisar de mais descanso.',
      },
      {
        title: 'Fase folicular',
        text: 'A energia aumenta gradualmente e pode sentir-se com mais vitalidade.',
      },
      {
        title: 'Perto da ovulação',
        text: 'Algumas mulheres sentem mais energia, motivação e confiança.',
      },
      {
        title: 'Fase lútea',
        text: 'Podem surgir cansaço, inchaço ou alterações de humor.',
      },
    ],
    softTipTitle: 'Ouça o seu corpo',
    softTipText: 'Não existe uma única forma de viver cada fase. As suas próprias sensações continuam a ser o melhor guia.',
    body3: 'Conhecer melhor o seu ciclo pode ajudar a antecipar certos períodos e a compreender as alterações que nota no dia a dia.',
    whyItems: [
      'Compreender melhor os sinais do seu corpo',
      'Antecipar o período e as suas diferentes fases',
      'Compreender certas alterações de humor',
      'Adaptar a atividade ao seu nível de energia',
      'Melhorar o seu registo diário',
    ],
    body4: 'Eis algumas respostas a perguntas frequentes sobre as diferentes fases do ciclo.',
    faq: [
      {
        question: 'É normal que o meu ciclo não dure exatamente 28 dias?',
        answer: 'Sim. A duração de um ciclo pode variar de pessoa para pessoa e, até, ligeiramente de mês para mês.',
      },
      {
        question: 'A ovulação acontece sempre no dia 14?',
        answer: 'Não. O dia 14 é uma estimativa habitual para um ciclo de 28 dias, mas a ovulação pode ocorrer mais cedo ou mais tarde.',
      },
      {
        question: 'Porque é que os meus sintomas mudam consoante a fase?',
        answer: 'As alterações hormonais ao longo do ciclo podem influenciar a energia, o humor, o sono e certas sensações físicas.',
      },
      {
        question: 'É útil registar os meus sintomas?',
        answer: 'Sim. Anotá-los com regularidade pode ajudar a reconhecer os seus próprios padrões e a compreender melhor o seu ritmo.',
      },
    ],
    endTitle: 'O seu ciclo, o seu ritmo',
    endText: 'Quanto mais observar o seu ciclo, mais poderá compreender o que é típico para si.',
    shareMessage: 'As diferentes fases do ciclo explicadas — AWA',
  },
  bn: {
    badge: 'মাসিক চক্র',
    title: 'চক্রের বিভিন্ন পর্যায়\nসহজ ভাষায়',
    metaDuration: 'পড়তে 6 মিনিট',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'আপনার মাসিক চক্র কয়েকটি পর্যায়ে গঠিত, যার প্রতিটি আপনার হরমোনের ভারসাম্য ও স্বাস্থ্যে গুরুত্বপূর্ণ ভূমিকা রাখে।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'চক্রের 4টি পর্যায়',
      'আপনার শরীর কীভাবে বদলায়',
      'চক্র বোঝা কেন গুরুত্বপূর্ণ',
      'সাধারণ জিজ্ঞাসা',
    ],
    body1: 'আপনার চক্র সাধারণত চারটি প্রধান পর্যায়ে ভাগ করা হয়। এগুলোর দৈর্ঘ্য একজন থেকে আরেকজনে আলাদা হতে পারে: প্রতিটি শরীরের নিজস্ব ছন্দ আছে।',
    diagram: {
      menstrual: {
        name: 'মাসিক পর্যায়',
        days: '1 থেকে 5 দিন',
      },
      follicular: {
        name: 'ফলিকুলার পর্যায়',
        days: '1 থেকে 13 দিন',
      },
      luteal: {
        name: 'লিউটিয়াল পর্যায়',
        days: '15 থেকে 28 দিন',
      },
      ovulatory: {
        name: 'ডিম্বস্ফোটন পর্যায়',
        days: 'প্রায় 14তম দিন',
      },
    },
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'প্রতিটি নারী অনন্য: নিজের শরীরকে লক্ষ্য করুন এবং নিজের ছন্দ চিনে নিন।',
    body2: 'হরমোনের পরিবর্তন চক্র জুড়ে আপনার শক্তি, মেজাজ, ঘুম এবং কিছু শারীরিক অনুভূতিকে প্রভাবিত করতে পারে।',
    bodyChanges: [
      {
        title: 'মাসিকের সময়',
        text: 'আপনার শক্তি কম থাকতে পারে এবং শরীরের আরও বিশ্রামের প্রয়োজন হতে পারে।',
      },
      {
        title: 'ফলিকুলার পর্যায়',
        text: 'শক্তি ধীরে ধীরে বাড়ে এবং আপনি আরও প্রাণবন্ত বোধ করতে পারেন।',
      },
      {
        title: 'ডিম্বস্ফোটনের সময়',
        text: 'কিছু নারী বেশি শক্তি, উদ্যম ও আত্মবিশ্বাস অনুভব করেন।',
      },
      {
        title: 'লিউটিয়াল পর্যায়',
        text: 'ক্লান্তি, পেট ফাঁপা বা মেজাজের পরিবর্তন দেখা দিতে পারে।',
      },
    ],
    softTipTitle: 'নিজের শরীরের কথা শুনুন',
    softTipText: 'প্রতিটি পর্যায় অনুভব করার একটিমাত্র উপায় নেই। আপনার নিজের অনুভূতিই সবচেয়ে ভালো পথনির্দেশক।',
    body3: 'নিজের চক্র সম্পর্কে ভালোভাবে জানলে কিছু সময়ের আগাম আন্দাজ করা এবং প্রতিদিন যে পরিবর্তনগুলো লক্ষ্য করেন তা বুঝতে সহজ হয়।',
    whyItems: [
      'আপনার শরীরের সংকেত আরও ভালোভাবে বুঝুন',
      'আপনার মাসিক ও এর বিভিন্ন পর্যায়ের আগাম আন্দাজ করুন',
      'মেজাজের কিছু পরিবর্তন বুঝুন',
      'আপনার শক্তির মাত্রা অনুযায়ী কার্যকলাপ ঠিক করুন',
      'আপনার দৈনিক ট্র্যাকিং উন্নত করুন',
    ],
    body4: 'চক্রের বিভিন্ন পর্যায় নিয়ে সচরাচর যেসব প্রশ্ন করা হয়, তার কয়েকটি উত্তর এখানে দেওয়া হলো।',
    faq: [
      {
        question: 'আমার চক্র ঠিক 28 দিনের না হওয়া কি স্বাভাবিক?',
        answer: 'হ্যাঁ। চক্রের দৈর্ঘ্য একজন থেকে আরেকজনে আলাদা হতে পারে, এমনকি প্রতি মাসেও সামান্য বদলাতে পারে।',
      },
      {
        question: 'ডিম্বস্ফোটন কি সবসময় 14তম দিনে হয়?',
        answer: 'না। 28 দিনের চক্রে 14তম দিন একটি প্রচলিত আনুমানিক হিসাব, কিন্তু ডিম্বস্ফোটন আগে বা পরেও হতে পারে।',
      },
      {
        question: 'পর্যায় অনুযায়ী আমার উপসর্গ কেন বদলায়?',
        answer: 'চক্র জুড়ে হরমোনের পরিবর্তন শক্তি, মেজাজ, ঘুম এবং কিছু শারীরিক অনুভূতিকে প্রভাবিত করতে পারে।',
      },
      {
        question: 'আমার উপসর্গ ট্র্যাক করা কি উপকারী?',
        answer: 'হ্যাঁ। নিয়মিত লিখে রাখলে আপনার নিজের ধরনগুলো চিনতে এবং নিজের ছন্দ আরও ভালোভাবে বুঝতে সাহায্য করে।',
      },
    ],
    endTitle: 'আপনার চক্র, আপনার ছন্দ',
    endText: 'আপনি যত বেশি আপনার চক্র পর্যবেক্ষণ করবেন, তত ভালোভাবে বুঝতে পারবেন আপনার জন্য কোনটি স্বাভাবিক।',
    shareMessage: 'চক্রের বিভিন্ন পর্যায় সহজ ভাষায় — AWA',
  },
  da: {
    badge: 'Menstruationscyklus',
    title: 'Cyklussens faser\nforklaret enkelt',
    metaDuration: '6 min læsning',
    metaValidated: 'Gennemgået indhold',
    intro: 'Din menstruationscyklus består af flere faser, som hver spiller en vigtig rolle for din hormonbalance og dit velbefindende.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Cyklussens 4 faser',
      'Hvad der sker i din krop',
      'Hvorfor det er nyttigt at forstå din cyklus',
      'Ofte stillede spørgsmål',
    ],
    body1: 'Din cyklus er normalt opdelt i fire hoveddele. Varigheden varierer fra kvinde til kvinde: enhver krop har sin egen rytme.',
    diagram: {
      menstrual: {
        name: 'Menstruationsfasen',
        days: 'Dag 1 til 5',
      },
      follicular: {
        name: 'Follikelfasen',
        days: 'Dag 1 til 13',
      },
      luteal: {
        name: 'Lutealfasen',
        days: 'Dag 15 til 28',
      },
      ovulatory: {
        name: 'Ægløsningsfasen',
        days: 'Ca. dag 14',
      },
    },
    tip1Title: 'Godt at vide',
    tip1Text: 'Alle er unikke: observer din egen krop og lær din personlige rytme at kende.',
    body2: 'Hormonforandringer i løbet af cyklussen kan påvirke din energi, dit humør, din søvn og visse fysiske fornemmelser.',
    bodyChanges: [
      {
        title: 'Under menstruationen',
        text: 'Din energi kan være lavere, og din krop har måske brug for mere hvile.',
      },
      {
        title: 'Follikelfasen',
        text: 'Energien stiger gradvist, og du kan føle dig mere livlig.',
      },
      {
        title: 'Omkring ægløsningen',
        text: 'Nogle kvinder mærker mere energi, initiativ og selvtillid.',
      },
      {
        title: 'Lutealfasen',
        text: 'Træthed, oppustethed eller humørsvingninger kan opstå.',
      },
    ],
    softTipTitle: 'Lyt til din krop',
    softTipText: 'Der er ingen enkelt måde at opleve hver fase på. Dine egne fornemmelser er den bedste vejledning.',
    body3: 'At kende sin cyklus godt gør det lettere at forudse visse perioder og forstå de forandringer, du bemærker i hverdagen.',
    whyItems: [
      'Forstå din krops signaler bedre',
      'Forudse din menstruation og dens faser',
      'Forstå visse humørsvingninger',
      'Tilpas dine aktiviteter til dit energiniveau',
      'Forbedre din daglige registrering',
    ],
    body4: 'Her er svar på nogle af de oftest stillede spørgsmål om cyklussens faser.',
    faq: [
      {
        question: 'Er det normalt, at min cyklus ikke er præcis 28 dage?',
        answer: 'Ja. Cykluslængden varierer fra kvinde til kvinde og kan endda ændre sig lidt fra måned til måned.',
      },
      {
        question: 'Sker ægløsning altid på dag 14?',
        answer: 'Nej. Dag 14 er et udbredt skøn for en 28-dages cyklus, men ægløsning kan ske tidligere eller senere.',
      },
      {
        question: 'Hvorfor ændrer mine symptomer sig afhængigt af fasen?',
        answer: 'Hormonforandringer i løbet af cyklussen kan påvirke energi, humør, søvn og visse fysiske fornemmelser.',
      },
      {
        question: 'Er det nyttigt at registrere mine symptomer?',
        answer: 'Ja. Regelmæssig registrering hjælper dig med at genkende dine egne mønstre og forstå din rytme bedre.',
      },
    ],
    endTitle: 'Din cyklus, din rytme',
    endText: 'Jo mere du observerer din cyklus, jo bedre vil du forstå, hvad der er normalt for dig.',
    shareMessage: 'Cyklussens faser forklaret enkelt — AWA',
  },
  da: {
    badge: 'Menstruationscyklus',
    title: 'Cyklussens faser\nforklaret enkelt',
    metaDuration: '6 min läsning',
    metaValidated: 'Gennemgået indhold',
    intro: 'Din menstruationscyklus består av flere faser, som hver spiller en vigtig rolle for din hormonbalance och ditt velbefindende.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Cyklussens 4 faser',
      'Hvad der sker i din krop',
      'Hvorfor det ar nyttigt at forstå din cyklus',
      'Ofte stillede spörgsmål',
    ],
    body1: 'Din cyklus ar normalt opdelt i fire hoveddele. Varigheden varierer fran kvinna till kvinde: enhver krop har sin egen rytme.',
    diagram: {
      menstrual: {
        name: 'Menstruationsfasen',
        days: 'Dag 1 till 5',
      },
      follicular: {
        name: 'Follikelfasen',
        days: 'Dag 1 till 13',
      },
      luteal: {
        name: 'Lutealfasen',
        days: 'Dag 15 till 28',
      },
      ovulatory: {
        name: 'Äglösningsfasen',
        days: 'Ca. dag 14',
      },
    },
    tip1Title: 'Godt at vide',
    tip1Text: 'Alla ar unikke: observer din egen krop och lär din personlige rytme at kende.',
    body2: 'Hormonforandringer i löbet av cyklussen kan påvirke din energi, ditt humör, din sövn och visse fysiske fornemmelser.',
    bodyChanges: [
      {
        title: 'Under menstruationen',
        text: 'Din energi kan väre lavere, och din krop har måske brug for mere hvile.',
      },
      {
        title: 'Follikelfasen',
        text: 'Energien stiger gradvist, och du kan föle dig mere livlig.',
      },
      {
        title: 'Omkring äglösningen',
        text: 'Nogle kvinnor märker mere energi, initiativ och selvtillid.',
      },
      {
        title: 'Lutealfasen',
        text: 'Träthed, oppustethed eller humörsvingninger kan opstå.',
      },
    ],
    softTipTitle: 'Lyt till din krop',
    softTipText: 'Der ar ingen enkelt måde at opleve hver fase på. Dine egne fornemmelser ar den bedste vejledning.',
    body3: 'At kende sin cyklus godt gör det lettere at forudse visse perioder och forstå de forandringer, du bemärker i hverdagen.',
    whyItems: [
      'Forstå din krops signaler bedre',
      'Forudse din menstruation och dens faser',
      'Forstå visse humörsvingninger',
      'Tilpas dina aktiviteter till ditt energiniveau',
      'Forbedre din daglige registrering',
    ],
    body4: 'Her ar svar på nogle av de oftest stillede spörgsmål om cyklussens faser.',
    faq: [
      {
        question: 'Er det normalt, at min cyklus inte ar präcis 28 dage?',
        answer: 'Ja. Cykluslängden varierer fran kvinna till kvinna och kan endda ändre sig lite fran måned till måned.',
      },
      {
        question: 'Sker äglösning alltid på dag 14?',
        answer: 'Nej. Dag 14 ar et udbredt skön for en 28-dages cyklus, men äglösning kan ske tidligere eller senere.',
      },
      {
        question: 'Hvorfor ändrer mine symtom sig afhängigt av fasen?',
        answer: 'Hormonforandringer i löbet av cyklussen kan påvirke energi, humör, sövn och visse fysiske fornemmelser.',
      },
      {
        question: 'Er det nyttigt at registrere mine symtom?',
        answer: 'Ja. Regelmässig registrering hjälper dig med at genkende dina egne mönstre och forstå din rytme bedre.',
      },
    ],
    endTitle: 'Din cyklus, din rytme',
    endText: 'Jo mere du observerer din cyklus, jo bedre vil du forstå, hvad der ar normalt for dig.',
    shareMessage: 'Cyklussens faser forklaret enkelt — AWA',
  },
  sv: {
    badge: 'Menstruationscyklus',
    title: 'Cyklussens faser\nforklaret enkelt',
    metaDuration: '6 min läsning',
    metaValidated: 'Gennemgået indhold',
    intro: 'Din menstruationscyklus består av flere faser, som hver spiller en vigtig rolle for din hormonbalance och ditt velbefindende.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Cyklussens 4 faser',
      'Hvad der sker i din krop',
      'Hvorfor det ar nyttigt at forstå din cyklus',
      'Ofte stillede spörgsmål',
    ],
    body1: 'Din cyklus ar normalt opdelt i fire hoveddele. Varigheden varierer fran kvinna till kvinde: enhver krop har sin egen rytme.',
    diagram: {
      menstrual: {
        name: 'Menstruationsfasen',
        days: 'Dag 1 till 5',
      },
      follicular: {
        name: 'Follikelfasen',
        days: 'Dag 1 till 13',
      },
      luteal: {
        name: 'Lutealfasen',
        days: 'Dag 15 till 28',
      },
      ovulatory: {
        name: 'Äglösningsfasen',
        days: 'Ca. dag 14',
      },
    },
    tip1Title: 'Godt at vide',
    tip1Text: 'Alla ar unikke: observer din egen krop och lär din personlige rytme at kende.',
    body2: 'Hormonforandringer i löbet av cyklussen kan påvirke din energi, ditt humör, din sövn och visse fysiske fornemmelser.',
    bodyChanges: [
      {
        title: 'Under menstruationen',
        text: 'Din energi kan väre lavere, och din krop har måske brug for mere hvile.',
      },
      {
        title: 'Follikelfasen',
        text: 'Energien stiger gradvist, och du kan föle dig mere livlig.',
      },
      {
        title: 'Omkring äglösningen',
        text: 'Nogle kvinnor märker mere energi, initiativ och selvtillid.',
      },
      {
        title: 'Lutealfasen',
        text: 'Träthed, oppustethed eller humörsvingninger kan opstå.',
      },
    ],
    softTipTitle: 'Lyt till din krop',
    softTipText: 'Der ar ingen enkelt måde at opleve hver fase på. Dine egne fornemmelser ar den bedste vejledning.',
    body3: 'At kende sin cyklus godt gör det lettere at forudse visse perioder och forstå de forandringer, du bemärker i hverdagen.',
    whyItems: [
      'Forstå din krops signaler bedre',
      'Forudse din menstruation och dens faser',
      'Forstå visse humörsvingninger',
      'Tilpas dina aktiviteter till ditt energiniveau',
      'Forbedre din daglige registrering',
    ],
    body4: 'Her ar svar på nogle av de oftest stillede spörgsmål om cyklussens faser.',
    faq: [
      {
        question: 'Er det normalt, at min cyklus inte ar präcis 28 dage?',
        answer: 'Ja. Cykluslängden varierer fran kvinna till kvinna och kan endda ändre sig lite fran måned till måned.',
      },
      {
        question: 'Sker äglösning alltid på dag 14?',
        answer: 'Nej. Dag 14 ar et udbredt skön for en 28-dages cyklus, men äglösning kan ske tidligere eller senere.',
      },
      {
        question: 'Hvorfor ändrer mine symtom sig afhängigt av fasen?',
        answer: 'Hormonforandringer i löbet av cyklussen kan påvirke energi, humör, sövn och visse fysiske fornemmelser.',
      },
      {
        question: 'Er det nyttigt at registrere mine symtom?',
        answer: 'Ja. Regelmässig registrering hjälper dig med at genkende dina egne mönstre och forstå din rytme bedre.',
      },
    ],
    endTitle: 'Din cyklus, din rytme',
    endText: 'Jo mere du observerer din cyklus, jo bedre vil du forstå, hvad der ar normalt for dig.',
    shareMessage: 'Cyklussens faser forklaret enkelt — AWA',
  },
} as const);

function CyclePhasesArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t, i18n} = useTranslation();
  const lang = resolveEditorialLanguage(i18n.language);
  const content = CONTENT[lang];
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const [bookmarked, setBookmarked] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(
    null,
  );
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let mounted = true;

    loadLibraryState().then(() => {
      if (mounted) {
        setBookmarked(
          isArticleBookmarked(ARTICLE_ID),
        );
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

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
        showsVerticalScrollIndicator={false}
        onScroll={event =>
          saveScrollPosition(
            ARTICLE_ID,
            event.nativeEvent.contentOffset.y,
          )
        }
        scrollEventThrottle={200}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: getBottomPadding(
              insets.bottom,
              READING_CONTROLS_SPACE,
            ),
          },
        ]}>
        {/* HERO */}
        <View style={styles.heroWrap}>
          <Image
            source={resolveEditorialImage(HERO, lang)}
            resizeMode="cover"
            style={styles.hero}
          />

          <View
            style={[
              styles.topBar,
              {
                paddingTop: getTopPadding(
                  insets.top,
                  true,
                ),
              },
            ]}>
            <AwaIconButton
              accessibilityLabel={t('library.reader.back')}
              icon="chevron-left"
              iconSize={23}
              onPress={() =>
                navigation.goBack()
              }
              variant="tonal"
            />

            <View style={styles.topActions}>
              <AwaIconButton
                accessibilityLabel={t('libraryArticle.bookmarkA11y')}
                icon={
                    bookmarked
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
                iconSize={20}
                onPress={() =>
                  setBookmarked(
                    toggleBookmark(ARTICLE_ID),
                  )
                }
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

        {/* ARTICLE */}
        <View style={styles.article}>
          <View style={styles.badge}>
            <AwaText variant="labelSmall" colorRole="primary">
              {content.badge}
            </AwaText>
          </View>

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

          <View style={styles.metaRow}>
            {[
              [
                'clock-outline',
                content.metaDuration,
              ],
              [
                'shield-check-outline',
                content.metaValidated,
              ],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? (
                  <View
                    style={styles.metaDivider}
                  />
                ) : null}

                <View style={styles.meta}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={14}
                    color={theme.colors.textMuted}
                  />

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
                    {text}
                  </AwaText>
                </View>
              </React.Fragment>
            ))}
          </View>

          <AwaText variant="bodyMedium" style={styles.intro}>
            {content.intro}
          </AwaText>

          {/* SOMMAIRE */}
          <AwaCard variant="filled" padding="none" style={styles.contentsCard}>
            <AwaText variant="titleSmall" emphasized style={styles.contentsTitle}>
              {content.contentsTitle}
            </AwaText>

            {content.topics.map((text, index) => (
              <View
                key={text}
                style={styles.contentsRow}>
                <View style={styles.contentsLeft}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary"
                    style={styles.contentsNumber}>
                    {index + 1}.
                  </AwaText>

                  <AwaText variant="bodySmall"
                    style={styles.contentsText}>
                    {text}
                  </AwaText>
                </View>

                {/* Kept as textMuted (not the dominant accent): this chevron
                    was already a distinct muted gray in the original design,
                    not the PURPLE accent used for contentsNumber. */}
                <MaterialDesignIcons
                  name="chevron-right"
                  color={theme.colors.textMuted}
                  size={19}
                />
              </View>
            ))}
          </AwaCard>

          {/* SECTION 1 */}
          <AwaText variant="titleLarge" emphasized style={styles.sectionTitle}>
            1. {content.topics[0]}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body1}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.diagramCard}>
            <View style={styles.phaseRow}>
              <View style={styles.phaseCopy}>
                <AwaText variant="labelSmall" style={styles.phaseName}>
                  {content.diagram.menstrual.name}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.phaseDays}>
                  {content.diagram.menstrual.days}
                </AwaText>
              </View>

              <View style={styles.phaseCopy}>
                <AwaText variant="labelSmall"
                  style={[
                    styles.phaseName,
                    styles.right,
                  ]}>
                  {content.diagram.follicular.name}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant"
                  style={[
                    styles.phaseDays,
                    styles.right,
                  ]}>
                  {content.diagram.follicular.days}
                </AwaText>
              </View>
            </View>

            <Image
              source={DIAGRAM}
              style={styles.diagram}
              resizeMode="cover"
            />

            <View style={styles.phaseRow}>
              <View style={styles.phaseCopy}>
                <AwaText variant="labelSmall" style={styles.phaseName}>
                  {content.diagram.luteal.name}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.phaseDays}>
                  {content.diagram.luteal.days}
                </AwaText>
              </View>

              <View style={styles.phaseCopy}>
                <AwaText variant="labelSmall"
                  style={[
                    styles.phaseName,
                    styles.right,
                  ]}>
                  {content.diagram.ovulatory.name}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant"
                  style={[
                    styles.phaseDays,
                    styles.right,
                  ]}>
                  {content.diagram.ovulatory.days}
                </AwaText>
              </View>
            </View>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="lightbulb-outline"
              size={24}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized colorRole="primary">
                {content.tip1Title}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip1Text}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 2 */}
          <AwaText variant="titleLarge" emphasized style={styles.sectionTitle}>
            2. {content.topics[1]}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body2}
          </AwaText>

          <View style={styles.changeGrid}>
            {BODY_CHANGES_ICONS.map((iconItem, index) => {
              const item = content.bodyChanges[index];

              return (
                <View
                  key={item.title}
                  style={styles.changeCard}>
                  <View style={styles.changeIcon}>
                    <MaterialDesignIcons
                      name={iconItem.icon as never}
                      size={24}
                      color={theme.colors.primary}
                    />
                  </View>

                  <AwaText variant="titleSmall" emphasized style={styles.changeTitle}>
                    {item.title}
                  </AwaText>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.changeText}>
                    {item.text}
                  </AwaText>
                </View>
              );
            })}
          </View>

          <AwaCard variant="filled" padding="none" style={styles.softTip}>
            <MaterialDesignIcons
              name="heart-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized colorRole="primary">
                {content.softTipTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.softTipText}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 3 */}
          <AwaText variant="titleLarge" emphasized style={styles.sectionTitle}>
            3. {content.topics[2]}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body3}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.whyCard}>
            {WHY_ITEMS_ICONS.map((iconItem, index) => {
              const text = content.whyItems[index];

              return (
                <View
                  key={text}
                  style={[
                    styles.whyRow,
                    index <
                      WHY_ITEMS_ICONS.length - 1 &&
                      styles.whyDivider,
                  ]}>
                  <View style={styles.whyIcon}>
                    <MaterialDesignIcons
                      name={iconItem.icon as never}
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>

                  <AwaText variant="labelSmall" style={styles.whyText}>
                    {text}
                  </AwaText>
                </View>
              );
            })}
          </AwaCard>

          {/* SECTION 4 */}
          <AwaText variant="titleLarge" emphasized style={styles.sectionTitle}>
            4. {content.topics[3]}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body4}
          </AwaText>

          <View style={styles.faqList}>
            {content.faq.map((item, index) => {
              const opened = openFaq === index;

              return (
                <Pressable
                  key={item.question}
                  onPress={() =>
                    setOpenFaq(
                      opened ? null : index,
                    )
                  }
                  style={({pressed}) => [
                    styles.faqCard,
                    opened &&
                      styles.faqCardOpen,
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.faqHeader}>
                    <AwaText variant="labelSmall"
                      style={styles.faqQuestion}>
                      {item.question}
                    </AwaText>

                    <View
                      style={[
                        styles.faqChevron,
                        opened &&
                          styles.faqChevronOpen,
                      ]}>
                      <MaterialDesignIcons
                        name={
                          opened
                            ? 'chevron-up'
                            : 'chevron-down'
                        }
                        size={18}
                        color={theme.colors.primary}
                      />
                    </View>
                  </View>

                  {opened ? (
                    <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.faqAnswer}>
                      {item.answer}
                    </AwaText>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <AwaCard variant="filled" padding="none" style={styles.endCard}>
            <MaterialDesignIcons
              name="calendar-heart"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.endCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.endTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.endText}>
                {content.endText}
              </AwaText>
            </View>
          </AwaCard>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ARTICLE_ID}
        durationMinutes={6}
        scrollRef={scrollRef}
      />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    scroll: {
      paddingBottom: 32,
    },

    heroWrap: {
      height: 270,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    hero: {
      width: '100%',
      height: '100%',
    },

    topBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },

    topActions: {
      flexDirection: 'row',
      gap: 8,
    },


    pressed: {
      opacity: 0.72,
    },

    article: {
      marginTop: -16,
      paddingHorizontal: 20,
      paddingTop: 20,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
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

    metaRow: {
      marginTop: 12,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 12,
    },

    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    metaDivider: {
      width: 1,
      height: 18,
      backgroundColor: theme.colors.border,
    },


    intro: {
      marginTop: 16,
    },

    contentsCard: {
      marginTop: 20,
      padding: 16,
    },

    contentsTitle: {
      marginBottom: 8,
    },

    contentsRow: {
      minHeight: 36,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    contentsLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },

    contentsNumber: {
      width: 23,
    },

    contentsText: {
      flex: 1,
    },

    sectionTitle: {
      marginTop: 24,
    },

    body: {
      marginTop: 8,
    },

    diagramCard: {
      marginTop: 16,
      padding: 16,
    },

    diagram: {
      alignSelf: 'center',
      width: 220,
      height: 220,
      borderRadius: 110,
    },

    phaseRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },

    phaseCopy: {
      width: '46%',
    },

    phaseName: {
    },

    phaseDays: {
      marginTop: 3,
    },

    right: {
      textAlign: 'right',
    },

    tip: {
      marginTop: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },

    softTip: {
      marginTop: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },

    tipCopy: {
      flex: 1,
      marginLeft: 12,
    },


    tipText: {
      marginTop: 4,
    },

    changeGrid: {
      marginTop: 16,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    changeCard: {
      width: '48.7%',
      minHeight: 142,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },

    changeIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },

    changeTitle: {
      marginTop: 8,
    },

    changeText: {
      marginTop: 4,
    },

    whyCard: {
      marginTop: 16,
      paddingHorizontal: 16,
    },

    whyRow: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
    },

    whyDivider: {
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },

    whyIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },

    whyText: {
      flex: 1,
      marginLeft: 12,
    },

    faqList: {
      marginTop: 16,
      gap: 8,
    },

    faqCard: {
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },

    faqCardOpen: {
      borderColor: theme.colors.primary,
      backgroundColor: withAlpha(theme.colors.primary, 0.08),
    },

    faqHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    faqQuestion: {
      flex: 1,
      paddingRight: 12,
    },

    faqChevron: {
      width: 28,
      height: 28,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },

    faqChevronOpen: {
      backgroundColor: withAlpha(theme.colors.primary, 0.18),
    },

    faqAnswer: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth:
        StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },

    endCard: {
      marginTop: 20,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },

    endCopy: {
      flex: 1,
      marginLeft: 12,
    },


    endText: {
      marginTop: 4,
    },
  });
}

export default CyclePhasesArticleScreen;
