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
  nb: {
    badge: 'Menstruasjonssyklus',
    title: 'De ulike fasene\ni syklusen forklart',
    metaDuration: '6 min lesing',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Menstruasjonssyklusen din består av flere faser, som hver spiller en viktig rolle for den hormonelle balansen og helsen din.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'De 4 fasene i syklusen',
      'Hvordan kroppen din endrer seg',
      'Hvorfor det er viktig å forstå syklusen din',
      'Ofte stilte spørsmål',
    ],
    body1: 'Syklusen din deles vanligvis inn i fire hovedfaser. Lengden kan variere fra person til person: hver kropp har sin egen rytme.',
    diagram: {
      menstrual: {name: 'Menstruasjonsfase', days: 'Dag 1 til 5'},
      follicular: {name: 'Follikelfase', days: 'Dag 1 til 13'},
      luteal: {name: 'Lutealfase', days: 'Dag 15 til 28'},
      ovulatory: {name: 'Eggløsningsfase', days: 'Rundt dag 14'},
    },
    tip1Title: 'Godt å vite',
    tip1Text: 'Hver kvinne er unik: observer kroppen din og lær din egen rytme.',
    body2: 'Hormonelle endringer kan påvirke energien, humøret, søvnen og visse kroppslige fornemmelser gjennom syklusen.',
    bodyChanges: [
      {title: 'Under mensen', text: 'Energien din kan være lavere, og kroppen kan trenge mer hvile.'},
      {title: 'Follikelfasen', text: 'Energien stiger gradvis, og du kan føle deg mer opplagt.'},
      {title: 'Rundt eggløsningen', text: 'Noen kvinner kjenner mer energi, motivasjon og selvtillit.'},
      {title: 'Lutealfasen', text: 'Tretthet, oppblåsthet eller humørsvingninger kan dukke opp.'},
    ],
    softTipTitle: 'Lytt til kroppen din',
    softTipText: 'Det finnes ikke bare én måte å oppleve hver fase på. Dine egne fornemmelser er fortsatt den beste veiviseren.',
    body3: 'Å bli bedre kjent med syklusen din kan hjelpe deg å forutse visse perioder og forstå endringene du merker fra dag til dag.',
    whyItems: [
      'Forstå kroppens signaler bedre',
      'Forutse mensen og de ulike fasene',
      'Forstå visse humørsvingninger',
      'Tilpasse aktiviteten til energinivået ditt',
      'Forbedre den daglige sporingen din',
    ],
    body4: 'Her er noen svar på spørsmål som ofte stilles om de ulike fasene i syklusen.',
    faq: [
      {
        question: 'Er det normalt at syklusen min ikke varer nøyaktig 28 dager?',
        answer: 'Ja. Lengden på en syklus kan variere fra person til person, og også litt fra måned til måned.',
      },
      {
        question: 'Skjer eggløsningen alltid på dag 14?',
        answer: 'Nei. Dag 14 er et vanlig estimat for en syklus på 28 dager, men eggløsningen kan skje tidligere eller senere.',
      },
      {
        question: 'Hvorfor endrer symptomene mine seg avhengig av fasen?',
        answer: 'Hormonelle endringer gjennom syklusen kan påvirke energi, humør, søvn og visse kroppslige fornemmelser.',
      },
      {
        question: 'Er det nyttig å følge symptomene mine?',
        answer: 'Ja. Å notere dem regelmessig kan hjelpe deg å kjenne igjen dine egne mønstre og forstå rytmen din bedre.',
      },
    ],
    endTitle: 'Syklusen din, din rytme',
    endText: 'Jo mer du observerer syklusen din, desto bedre kan du forstå hva som er typisk for deg.',
    shareMessage: 'De ulike fasene i syklusen forklart – AWA',
  },
  pl: {
    badge: 'Cykl miesiączkowy',
    title: 'Poszczególne fazy\ncyklu wyjaśnione',
    metaDuration: '6 min czytania',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Twój cykl miesiączkowy składa się z kilku faz, z których każda odgrywa istotną rolę w Twojej równowadze hormonalnej i zdrowiu.',
    contentsTitle: 'W tym artykule',
    topics: [
      '4 fazy cyklu',
      'Jak zmienia się Twoje ciało',
      'Dlaczego warto rozumieć swój cykl',
      'Najczęściej zadawane pytania',
    ],
    body1: 'Cykl dzieli się zazwyczaj na cztery główne fazy. Ich długość może się różnić u poszczególnych osób: każde ciało ma własny rytm.',
    diagram: {
      menstrual: {name: 'Faza menstruacyjna', days: 'Dni 1–5'},
      follicular: {name: 'Faza folikularna', days: 'Dni 1–13'},
      luteal: {name: 'Faza lutealna', days: 'Dni 15–28'},
      ovulatory: {name: 'Faza owulacyjna', days: 'Około 14. dnia'},
    },
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Każda kobieta jest wyjątkowa: obserwuj swoje ciało i poznaj własny rytm.',
    body2: 'Zmiany hormonalne mogą wpływać na Twoją energię, nastrój, sen i niektóre odczucia fizyczne w trakcie cyklu.',
    bodyChanges: [
      {title: 'Podczas miesiączki', text: 'Twoja energia może być mniejsza, a ciało może potrzebować więcej odpoczynku.'},
      {title: 'Faza folikularna', text: 'Energia stopniowo rośnie i możesz czuć się bardziej pełna sił.'},
      {title: 'Około owulacji', text: 'Niektóre kobiety odczuwają więcej energii, motywacji i pewności siebie.'},
      {title: 'Faza lutealna', text: 'Mogą pojawić się zmęczenie, wzdęcia lub zmiany nastroju.'},
    ],
    softTipTitle: 'Słuchaj swojego ciała',
    softTipText: 'Nie ma jednego sposobu przeżywania każdej fazy. Twoje własne odczucia pozostają najlepszym przewodnikiem.',
    body3: 'Lepsze poznanie cyklu może pomóc przewidywać niektóre okresy i rozumieć zmiany, które zauważasz na co dzień.',
    whyItems: [
      'Lepiej rozumiesz sygnały swojego ciała',
      'Przewidujesz miesiączkę i poszczególne fazy',
      'Rozumiesz niektóre zmiany nastroju',
      'Dostosowujesz aktywność do poziomu energii',
      'Usprawniasz codzienne śledzenie',
    ],
    body4: 'Oto kilka odpowiedzi na pytania często zadawane o poszczególne fazy cyklu.',
    faq: [
      {
        question: 'Czy to normalne, że mój cykl nie trwa dokładnie 28 dni?',
        answer: 'Tak. Długość cyklu może się różnić u poszczególnych osób, a nawet nieznacznie z miesiąca na miesiąc.',
      },
      {
        question: 'Czy owulacja zawsze następuje w 14. dniu?',
        answer: 'Nie. 14. dzień to częste oszacowanie dla cyklu 28-dniowego, ale owulacja może nastąpić wcześniej lub później.',
      },
      {
        question: 'Dlaczego moje objawy zmieniają się w zależności od fazy?',
        answer: 'Zmiany hormonalne w trakcie cyklu mogą wpływać na energię, nastrój, sen i niektóre odczucia fizyczne.',
      },
      {
        question: 'Czy warto śledzić swoje objawy?',
        answer: 'Tak. Regularne notowanie ich może pomóc rozpoznać własne wzorce i lepiej zrozumieć swój rytm.',
      },
    ],
    endTitle: 'Twój cykl, Twój rytm',
    endText: 'Im więcej obserwujesz swój cykl, tym lepiej rozumiesz, co jest typowe dla Ciebie.',
    shareMessage: 'Poszczególne fazy cyklu wyjaśnione — AWA',
  },
  uk: {
    badge: 'Менструальний цикл',
    title: 'Різні фази\nциклу пояснено',
    metaDuration: '6 хв читання',
    metaValidated: 'Перевірений вміст',
    intro: 'Ваш менструальний цикл складається з кількох фаз, кожна з яких відіграє важливу роль у вашому гормональному балансі та здоров’ї.',
    contentsTitle: 'У цій статті',
    topics: [
      '4 фази циклу',
      'Як змінюється ваше тіло',
      'Чому важливо розуміти свій цикл',
      'Поширені запитання',
    ],
    body1: 'Цикл зазвичай поділяють на чотири основні фази. Їхня тривалість може відрізнятися в різних людей: кожне тіло має власний ритм.',
    diagram: {
      menstrual: {name: 'Менструальна фаза', days: 'Дні 1–5'},
      follicular: {name: 'Фолікулярна фаза', days: 'Дні 1–13'},
      luteal: {name: 'Лютеїнова фаза', days: 'Дні 15–28'},
      ovulatory: {name: 'Овуляторна фаза', days: 'Близько 14-го дня'},
    },
    tip1Title: 'Варто знати',
    tip1Text: 'Кожна жінка унікальна: спостерігайте за своїм тілом і пізнавайте власний ритм.',
    body2: 'Гормональні зміни можуть впливати на вашу енергію, настрій, сон і деякі фізичні відчуття протягом циклу.',
    bodyChanges: [
      {title: 'Під час менструації', text: 'Ваша енергія може бути нижчою, а тілу може знадобитися більше відпочинку.'},
      {title: 'Фолікулярна фаза', text: 'Енергія поступово зростає, і ви можете почуватися бадьоріше.'},
      {title: 'Близько овуляції', text: 'Деякі жінки відчувають більше енергії, мотивації та впевненості.'},
      {title: 'Лютеїнова фаза', text: 'Можуть з’явитися втома, здуття або зміни настрою.'},
    ],
    softTipTitle: 'Прислухайтеся до свого тіла',
    softTipText: 'Не існує єдиного способу переживати кожну фазу. Ваші власні відчуття залишаються найкращим орієнтиром.',
    body3: 'Краще знання свого циклу може допомогти передбачати певні періоди й розуміти зміни, які ви помічаєте щодня.',
    whyItems: [
      'Краще розуміти сигнали свого тіла',
      'Передбачати менструацію та її різні фази',
      'Розуміти певні зміни настрою',
      'Підлаштовувати активність під рівень енергії',
      'Покращувати щоденне відстеження',
    ],
    body4: 'Ось кілька відповідей на запитання, які часто ставлять про різні фази циклу.',
    faq: [
      {
        question: 'Чи нормально, що мій цикл триває не рівно 28 днів?',
        answer: 'Так. Тривалість циклу може відрізнятися в різних людей і навіть трохи змінюватися від місяця до місяця.',
      },
      {
        question: 'Чи завжди овуляція відбувається на 14-й день?',
        answer: 'Ні. 14-й день — поширена оцінка для 28-денного циклу, але овуляція може відбутися раніше або пізніше.',
      },
      {
        question: 'Чому мої симптоми змінюються залежно від фази?',
        answer: 'Гормональні зміни протягом циклу можуть впливати на енергію, настрій, сон і деякі фізичні відчуття.',
      },
      {
        question: 'Чи корисно відстежувати свої симптоми?',
        answer: 'Так. Їх регулярний запис може допомогти розпізнати власні закономірності й краще зрозуміти свій ритм.',
      },
    ],
    endTitle: 'Ваш цикл, ваш ритм',
    endText: 'Чим більше ви спостерігаєте за своїм циклом, тим краще розумієте, що є типовим для вас.',
    shareMessage: 'Різні фази циклу пояснено — AWA',
  },
  cs: {
    badge: 'Menstruační cyklus',
    title: 'Jednotlivé fáze\ncyklu vysvětleny',
    metaDuration: '6 min čtení',
    metaValidated: 'Ověřený obsah',
    intro: 'Váš menstruační cyklus se skládá z několika fází, z nichž každá hraje zásadní roli ve vaší hormonální rovnováze a zdraví.',
    contentsTitle: 'V tomto článku',
    topics: [
      '4 fáze cyklu',
      'Jak se vaše tělo mění',
      'Proč je důležité rozumět svému cyklu',
      'Často kladené otázky',
    ],
    body1: 'Váš cyklus se obvykle dělí na čtyři hlavní fáze. Jejich délka se může u každé ženy lišit: každé tělo má svůj vlastní rytmus.',
    diagram: {
      menstrual: {name: 'Menstruační fáze', days: '1. až 5. den'},
      follicular: {name: 'Folikulární fáze', days: '1. až 13. den'},
      luteal: {name: 'Luteální fáze', days: '15. až 28. den'},
      ovulatory: {name: 'Ovulační fáze', days: 'Kolem 14. dne'},
    },
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Každá žena je jedinečná: pozorujte své tělo a poznávejte svůj vlastní rytmus.',
    body2: 'Hormonální změny mohou v průběhu cyklu ovlivňovat vaši energii, náladu, spánek a některé tělesné pocity.',
    bodyChanges: [
      {title: 'Během menstruace', text: 'Vaše energie může být nižší a tělo může potřebovat více odpočinku.'},
      {title: 'Folikulární fáze', text: 'Energie postupně roste a můžete se cítit svěžeji.'},
      {title: 'Kolem ovulace', text: 'Některé ženy cítí více energie, motivace a sebedůvěry.'},
      {title: 'Luteální fáze', text: 'Může se objevit únava, nadýmání nebo změny nálady.'},
    ],
    softTipTitle: 'Naslouchejte svému tělu',
    softTipText: 'Neexistuje jen jeden způsob, jak každou fázi prožívat. Vaše vlastní pocity zůstávají nejlepším vodítkem.',
    body3: 'Lepší poznání svého cyklu vám může pomoci předvídat některá období a porozumět změnám, které pozorujete každý den.',
    whyItems: [
      'Lépe rozumět signálům svého těla',
      'Předvídat menstruaci a její různé fáze',
      'Pochopit některé změny nálady',
      'Přizpůsobit aktivitu své úrovni energie',
      'Zlepšit své každodenní sledování',
    ],
    body4: 'Zde je několik odpovědí na otázky, které se často kladou o jednotlivých fázích cyklu.',
    faq: [
      {
        question: 'Je normální, že můj cyklus netrvá přesně 28 dní?',
        answer: 'Ano. Délka cyklu se může lišit od ženy k ženě a dokonce mírně i z měsíce na měsíc.',
      },
      {
        question: 'Probíhá ovulace vždy 14. den?',
        answer: 'Ne. 14. den je běžný odhad pro 28denní cyklus, ale ovulace může nastat dříve nebo později.',
      },
      {
        question: 'Proč se mé příznaky mění podle fáze?',
        answer: 'Hormonální změny v průběhu cyklu mohou ovlivňovat energii, náladu, spánek a některé tělesné pocity.',
      },
      {
        question: 'Je užitečné sledovat své příznaky?',
        answer: 'Ano. Jejich pravidelné zapisování vám může pomoci rozpoznat vlastní vzorce a lépe porozumět svému rytmu.',
      },
    ],
    endTitle: 'Váš cyklus, váš rytmus',
    endText: 'Čím více svůj cyklus pozorujete, tím lépe pochopíte, co je pro vás typické.',
    shareMessage: 'Jednotlivé fáze cyklu vysvětleny — AWA',
  },
  sk: {
    badge: 'Menštruačný cyklus',
    title: 'Jednotlivé fázy\ncyklu vysvetlené',
    metaDuration: '6 min čítania',
    metaValidated: 'Overený obsah',
    intro: 'Váš menštruačný cyklus sa skladá z niekoľkých fáz, z ktorých každá zohráva dôležitú úlohu pre vašu hormonálnu rovnováhu a zdravie.',
    contentsTitle: 'V tomto článku',
    topics: [
      '4 fázy cyklu',
      'Ako sa vaše telo mení',
      'Prečo je dôležité rozumieť svojmu cyklu',
      'Často kladené otázky',
    ],
    body1: 'Váš cyklus sa zvyčajne delí na štyri hlavné fázy. Ich dĺžka sa môže líšiť od ženy k žene: každé telo má svoj rytmus.',
    diagram: {
      menstrual: {name: 'Menštruačná fáza', days: '1. až 5. deň'},
      follicular: {name: 'Folikulárna fáza', days: '1. až 13. deň'},
      luteal: {name: 'Luteálna fáza', days: '15. až 28. deň'},
      ovulatory: {name: 'Ovulačná fáza', days: 'Okolo 14. dňa'},
    },
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Každá žena je jedinečná: sledujte svoje telo a spoznajte svoj vlastný rytmus.',
    body2: 'Hormonálne zmeny môžu počas cyklu ovplyvňovať vašu energiu, náladu, spánok a niektoré telesné pocity.',
    bodyChanges: [
      {title: 'Počas menštruácie', text: 'Vaša energia môže byť nižšia a telo môže potrebovať viac odpočinku.'},
      {title: 'Folikulárna fáza', text: 'Energia postupne stúpa a môžete sa cítiť sviežejšie.'},
      {title: 'Okolo ovulácie', text: 'Niektoré ženy pociťujú viac energie, motivácie a sebadôvery.'},
      {title: 'Luteálna fáza', text: 'Môže sa objaviť únava, nadúvanie alebo zmeny nálady.'},
    ],
    softTipTitle: 'Počúvajte svoje telo',
    softTipText: 'Každú fázu nemožno prežívať iba jedným spôsobom. Vaše vlastné pocity zostávajú najlepším sprievodcom.',
    body3: 'Lepšie poznanie vášho cyklu vám môže pomôcť predvídať niektoré obdobia a pochopiť zmeny, ktoré si všímate v každodennom živote.',
    whyItems: [
      'Lepšie pochopiť signály svojho tela',
      'Predvídať menštruáciu a jej rôzne fázy',
      'Pochopiť niektoré zmeny nálady',
      'Prispôsobiť aktivitu svojej úrovni energie',
      'Zlepšiť svoje každodenné sledovanie',
    ],
    body4: 'Tu je niekoľko odpovedí na otázky, ktoré sa často kladú o jednotlivých fázach cyklu.',
    faq: [
      {
        question: 'Je normálne, že môj cyklus netrvá presne 28 dní?',
        answer: 'Áno. Dĺžka cyklu sa môže líšiť od ženy k žene a dokonca mierne aj z mesiaca na mesiac.',
      },
      {
        question: 'Prebieha ovulácia vždy 14. deň?',
        answer: 'Nie. 14. deň je bežný odhad pri 28-dňovom cykle, ale ovulácia môže nastať skôr alebo neskôr.',
      },
      {
        question: 'Prečo sa moje príznaky menia podľa fázy?',
        answer: 'Hormonálne zmeny počas cyklu môžu ovplyvňovať energiu, náladu, spánok a niektoré telesné pocity.',
      },
      {
        question: 'Je užitočné sledovať svoje príznaky?',
        answer: 'Áno. Ich pravidelný zápis vám môže pomôcť rozpoznať vlastné vzorce a lepšie pochopiť svoj rytmus.',
      },
    ],
    endTitle: 'Váš cyklus, váš rytmus',
    endText: 'Čím viac svoj cyklus sledujete, tým lepšie môžete pochopiť, čo je pre vás typické.',
    shareMessage: 'Jednotlivé fázy cyklu vysvetlené — AWA',
  },
  hu: {
    badge: 'Menstruációs ciklus',
    title: 'A ciklus különböző\nszakaszai elmagyarázva',
    metaDuration: '6 perc olvasás',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'A menstruációs ciklusod több szakaszból áll, amelyek mindegyike alapvető szerepet játszik a hormonális egyensúlyodban és az egészségedben.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'A ciklus 4 szakasza',
      'Hogyan változik a tested',
      'Miért fontos megérteni a ciklusodat',
      'Gyakran ismételt kérdések',
    ],
    body1: 'A ciklus általában négy fő szakaszra oszlik. Hosszuk nőnként eltérhet: minden testnek megvan a saját ritmusa.',
    diagram: {
      menstrual: {name: 'Menstruációs szakasz', days: '1–5. nap'},
      follicular: {name: 'Follikuláris szakasz', days: '1–13. nap'},
      luteal: {name: 'Luteális szakasz', days: '15–28. nap'},
      ovulatory: {name: 'Peteérési szakasz', days: 'Körülbelül a 14. nap'},
    },
    tip1Title: 'Érdemes tudni',
    tip1Text: 'Minden nő egyedi: figyeld meg a testedet, és tanuld meg a saját ritmusodat.',
    body2: 'A hormonális változások a ciklus során befolyásolhatják az energiádat, a hangulatodat, az alvásodat és bizonyos testi érzeteket.',
    bodyChanges: [
      {title: 'A menstruáció alatt', text: 'Az energiád alacsonyabb lehet, és a testednek több pihenésre lehet szüksége.'},
      {title: 'Follikuláris szakasz', text: 'Az energia fokozatosan emelkedik, és élénkebbnek érezheted magad.'},
      {title: 'A peteérés körül', text: 'Egyes nők több energiát, motivációt és önbizalmat éreznek.'},
      {title: 'Luteális szakasz', text: 'Fáradtság, puffadás vagy hangulatváltozások jelentkezhetnek.'},
    ],
    softTipTitle: 'Figyelj a testedre',
    softTipText: 'Az egyes szakaszok megélésének nem csak egyféle módja van. A saját érzeteid maradnak a legjobb útmutató.',
    body3: 'A ciklusod jobb megismerése segíthet előre látni bizonyos időszakokat, és megérteni a mindennapokban észlelt változásokat.',
    whyItems: [
      'Jobban megérteni a tested jelzéseit',
      'Előre látni a menstruációdat és annak különböző szakaszait',
      'Megérteni bizonyos hangulatváltozásokat',
      'Az aktivitásodat az energiaszintedhez igazítani',
      'Javítani a mindennapi követésedet',
    ],
    body4: 'Íme néhány válasz a ciklus különböző szakaszaival kapcsolatban gyakran feltett kérdésekre.',
    faq: [
      {
        question: 'Normális, hogy a ciklusom nem pontosan 28 napos?',
        answer: 'Igen. A ciklus hossza nőnként eltérhet, sőt hónapról hónapra is kissé változhat.',
      },
      {
        question: 'A peteérés mindig a 14. napon történik?',
        answer: 'Nem. A 14. nap egy gyakori becslés 28 napos ciklus esetén, de a peteérés korábban vagy később is bekövetkezhet.',
      },
      {
        question: 'Miért változnak a tüneteim a szakasztól függően?',
        answer: 'A ciklus során bekövetkező hormonális változások befolyásolhatják az energiát, a hangulatot, az alvást és bizonyos testi érzeteket.',
      },
      {
        question: 'Hasznos a tüneteimet követni?',
        answer: 'Igen. Rendszeres feljegyzésük segíthet felismerni a saját mintáidat, és jobban megérteni a ritmusodat.',
      },
    ],
    endTitle: 'A ciklusod, a te ritmusod',
    endText: 'Minél jobban megfigyeled a ciklusodat, annál jobban megértheted, mi jellemző rád.',
    shareMessage: 'A ciklus különböző szakaszai elmagyarázva — AWA',
  },
  ro: {
    badge: 'Ciclul menstrual',
    title: 'Diferitele faze\nale ciclului, explicate',
    metaDuration: '6 min de citit',
    metaValidated: 'Conținut revizuit',
    intro: 'Ciclul tău menstrual este format din mai multe faze, fiecare având un rol esențial în echilibrul tău hormonal și în sănătatea ta.',
    contentsTitle: 'În acest articol',
    topics: [
      'Cele 4 faze ale ciclului',
      'Cum se schimbă corpul tău',
      'De ce contează înțelegerea ciclului tău',
      'Întrebări frecvente',
    ],
    body1: 'Ciclul tău este în general împărțit în patru faze principale. Durata lor poate varia de la o persoană la alta: fiecare corp are propriul ritm.',
    diagram: {
      menstrual: {name: 'Faza menstruală', days: 'Zilele 1 până la 5'},
      follicular: {name: 'Faza foliculară', days: 'Zilele 1 până la 13'},
      luteal: {name: 'Faza luteală', days: 'Zilele 15 până la 28'},
      ovulatory: {name: 'Faza ovulatorie', days: 'În jurul zilei 14'},
    },
    tip1Title: 'Bine de știut',
    tip1Text: 'Fiecare femeie este unică: observă-ți corpul și învață-ți propriul ritm.',
    body2: 'Schimbările hormonale îți pot influența energia, starea de spirit, somnul și anumite senzații fizice pe parcursul ciclului.',
    bodyChanges: [
      {title: 'În timpul menstruației', text: 'Energia ta poate fi mai scăzută, iar corpul tău poate avea nevoie de mai multă odihnă.'},
      {title: 'Faza foliculară', text: 'Energia crește treptat și te poți simți mai plină de energie.'},
      {title: 'În jurul ovulației', text: 'Unele femei simt mai multă energie, motivație și încredere.'},
      {title: 'Faza luteală', text: 'Pot apărea oboseală, balonare sau schimbări de dispoziție.'},
    ],
    softTipTitle: 'Ascultă-ți corpul',
    softTipText: 'Nu există un singur mod de a trăi fiecare fază. Propriile tale senzații rămân cel mai bun ghid.',
    body3: 'Cunoașterea mai bună a ciclului tău te poate ajuta să anticipezi anumite perioade și să înțelegi schimbările pe care le observi zi de zi.',
    whyItems: [
      'Să înțelegi mai bine semnalele corpului tău',
      'Să anticipezi menstruația și diferitele ei faze',
      'Să înțelegi anumite schimbări de dispoziție',
      'Să-ți adaptezi activitatea la nivelul de energie',
      'Să-ți îmbunătățești monitorizarea zilnică',
    ],
    body4: 'Iată câteva răspunsuri la întrebările frecvente despre diferitele faze ale ciclului.',
    faq: [
      {
        question: 'Este normal ca ciclul meu să nu dureze exact 28 de zile?',
        answer: 'Da. Durata unui ciclu poate varia de la o persoană la alta și chiar ușor de la o lună la alta.',
      },
      {
        question: 'Ovulația are loc întotdeauna în ziua 14?',
        answer: 'Nu. Ziua 14 este o estimare frecventă pentru un ciclu de 28 de zile, dar ovulația poate avea loc mai devreme sau mai târziu.',
      },
      {
        question: 'De ce se schimbă simptomele mele în funcție de fază?',
        answer: 'Schimbările hormonale din timpul ciclului pot influența energia, starea de spirit, somnul și anumite senzații fizice.',
      },
      {
        question: 'Este util să-mi urmăresc simptomele?',
        answer: 'Da. Notarea lor în mod regulat te poate ajuta să-ți recunoști propriile tipare și să-ți înțelegi mai bine ritmul.',
      },
    ],
    endTitle: 'Ciclul tău, ritmul tău',
    endText: 'Cu cât îți observi mai mult ciclul, cu atât poți înțelege mai bine ce este tipic pentru tine.',
    shareMessage: 'Diferitele faze ale ciclului, explicate — AWA',
  },
  bg: {
    badge: 'Менструален цикъл',
    title: 'Различните фази\nна цикъла, обяснени',
    metaDuration: '6 мин четене',
    metaValidated: 'Проверено съдържание',
    intro: 'Менструалният ти цикъл се състои от няколко фази, всяка от които играе съществена роля за хормоналния ти баланс и здравето ти.',
    contentsTitle: 'В тази статия',
    topics: [
      'Четирите фази на цикъла',
      'Как се променя тялото ти',
      'Защо е важно да разбираш цикъла си',
      'Често задавани въпроси',
    ],
    body1: 'Цикълът ти обикновено се разделя на четири основни фази. Продължителността им може да варира от човек на човек: всяко тяло има свой ритъм.',
    diagram: {
      menstrual: {name: 'Менструална фаза', days: 'Дни от 1 до 5'},
      follicular: {name: 'Фоликуларна фаза', days: 'Дни от 1 до 13'},
      luteal: {name: 'Лутеална фаза', days: 'Дни от 15 до 28'},
      ovulatory: {name: 'Овулаторна фаза', days: 'Около ден 14'},
    },
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Всяка жена е уникална: наблюдавай тялото си и научи собствения си ритъм.',
    body2: 'Хормоналните промени могат да повлияят на енергията, настроението, съня и някои физически усещания през цикъла.',
    bodyChanges: [
      {title: 'По време на менструацията', text: 'Енергията ти може да е по-ниска, а тялото ти може да има нужда от повече почивка.'},
      {title: 'Фоликуларна фаза', text: 'Енергията постепенно се повишава и можеш да се чувстваш по-енергична.'},
      {title: 'Около овулацията', text: 'Някои жени усещат повече енергия, мотивация и увереност.'},
      {title: 'Лутеална фаза', text: 'Може да се появят умора, подуване или промени в настроението.'},
    ],
    softTipTitle: 'Вслушай се в тялото си',
    softTipText: 'Няма само един начин да преживееш всяка фаза. Собствените ти усещания остават най-добрият ориентир.',
    body3: 'По-доброто опознаване на цикъла ти може да ти помогне да предвиждаш определени периоди и да разбираш промените, които забелязваш ден след ден.',
    whyItems: [
      'Да разбираш по-добре сигналите на тялото си',
      'Да предвиждаш менструацията и различните ѝ фази',
      'Да разбираш определени промени в настроението',
      'Да приспособяваш активността си към нивото на енергия',
      'Да подобриш ежедневното си проследяване',
    ],
    body4: 'Ето няколко отговора на често задавани въпроси за различните фази на цикъла.',
    faq: [
      {
        question: 'Нормално ли е цикълът ми да не продължава точно 28 дни?',
        answer: 'Да. Продължителността на цикъла може да варира от човек на човек и дори леко от месец на месец.',
      },
      {
        question: 'Овулацията винаги ли настъпва на 14-ия ден?',
        answer: 'Не. Ден 14 е честа оценка за 28-дневен цикъл, но овулацията може да настъпи по-рано или по-късно.',
      },
      {
        question: 'Защо симптомите ми се променят според фазата?',
        answer: 'Хормоналните промени през цикъла могат да повлияят на енергията, настроението, съня и някои физически усещания.',
      },
      {
        question: 'Полезно ли е да следя симптомите си?',
        answer: 'Да. Редовното им отбелязване може да ти помогне да разпознаеш собствените си модели и да разбереш по-добре ритъма си.',
      },
    ],
    endTitle: 'Твоят цикъл, твоят ритъм',
    endText: 'Колкото повече наблюдаваш цикъла си, толкова по-добре можеш да разбереш кое е типично за теб.',
    shareMessage: 'Различните фази на цикъла, обяснени — AWA',
  },
  sr: {
    badge: 'Менструални циклус',
    title: 'Различите фазе\nциклуса објашњене',
    metaDuration: '6 мин читања',
    metaValidated: 'Проверен садржај',
    intro: 'Твој менструални циклус се састоји од неколико фаза, од којих свака игра суштинску улогу у твојој хормонској равнотежи и здрављу.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Четири фазе циклуса',
      'Како се твоје тело мења',
      'Зашто је важно разумети свој циклус',
      'Често постављана питања',
    ],
    body1: 'Твој циклус се обично дели на четири главне фазе. Њихово трајање може варирати од особе до особе: свако тело има свој ритам.',
    diagram: {
      menstrual: {name: 'Менструална фаза', days: 'Дани 1 до 5'},
      follicular: {name: 'Фоликуларна фаза', days: 'Дани 1 до 13'},
      luteal: {name: 'Лутеална фаза', days: 'Дани 15 до 28'},
      ovulatory: {name: 'Овулаторна фаза', days: 'Око 14. дана'},
    },
    tip1Title: 'Добро је знати',
    tip1Text: 'Свака жена је јединствена: посматрај своје тело и упознај сопствени ритам.',
    body2: 'Хормонске промене могу утицати на твоју енергију, расположење, сан и одређена физичка осећања током циклуса.',
    bodyChanges: [
      {title: 'Током менструације', text: 'Енергија ти може бити мања, а тело може захтевати више одмора.'},
      {title: 'Фоликуларна фаза', text: 'Енергија постепено расте и можеш се осећати енергичније.'},
      {title: 'Око овулације', text: 'Неке жене осећају више енергије, мотивације и самопоуздања.'},
      {title: 'Лутеална фаза', text: 'Могу се појавити умор, надутост или промене расположења.'},
    ],
    softTipTitle: 'Слушај своје тело',
    softTipText: 'Не постоји само један начин да се доживи свака фаза. Твоја сопствена осећања остају најбољи водич.',
    body3: 'Боље упознавање циклуса може ти помоћи да предвидиш одређене периоде и разумеш промене које примећујеш из дана у дан.',
    whyItems: [
      'Боље разумеш сигнале свог тела',
      'Предвидиш менструацију и њене различите фазе',
      'Разумеш одређене промене расположења',
      'Прилагодиш активност свом нивоу енергије',
      'Побољшаш своје свакодневно праћење',
    ],
    body4: 'Ево неколико одговора на питања која се често постављају о различитим фазама циклуса.',
    faq: [
      {
        question: 'Да ли је нормално да мој циклус не траје тачно 28 дана?',
        answer: 'Да. Трајање циклуса може варирати од особе до особе, па чак и благо из месеца у месец.',
      },
      {
        question: 'Да ли се овулација увек дешава 14. дана?',
        answer: 'Не. 14. дан је уобичајена процена за циклус од 28 дана, али се овулација може десити раније или касније.',
      },
      {
        question: 'Зашто се моји симптоми мењају зависно од фазе?',
        answer: 'Хормонске промене током циклуса могу утицати на енергију, расположење, сан и одређена физичка осећања.',
      },
      {
        question: 'Да ли је корисно пратити своје симптоме?',
        answer: 'Да. Редовно бележење може ти помоћи да препознаш сопствене обрасце и боље разумеш свој ритам.',
      },
    ],
    endTitle: 'Твој циклус, твој ритам',
    endText: 'Што више посматраш свој циклус, то боље можеш разумети шта је типично за тебе.',
    shareMessage: 'Различите фазе циклуса објашњене — AWA',
  },
  hr: {
    badge: 'Menstrualni ciklus',
    title: 'Različite faze\nciklusa objašnjene',
    metaDuration: '6 min čitanja',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Tvoj menstrualni ciklus sastoji se od nekoliko faza, a svaka ima ključnu ulogu u tvojoj hormonskoj ravnoteži i zdravlju.',
    contentsTitle: 'U ovom članku',
    topics: [
      '4 faze ciklusa',
      'Kako se tvoje tijelo mijenja',
      'Zašto je važno razumjeti svoj ciklus',
      'Često postavljana pitanja',
    ],
    body1: 'Tvoj se ciklus općenito dijeli na četiri glavne faze. Njihovo trajanje može se razlikovati od osobe do osobe: svako tijelo ima svoj ritam.',
    diagram: {
      menstrual: {name: 'Menstrualna faza', days: '1. do 5. dan'},
      follicular: {name: 'Folikularna faza', days: '1. do 13. dan'},
      luteal: {name: 'Lutealna faza', days: '15. do 28. dan'},
      ovulatory: {name: 'Ovulacijska faza', days: 'Oko 14. dana'},
    },
    tip1Title: 'Dobro je znati',
    tip1Text: 'Svaka je žena jedinstvena: promatraj svoje tijelo i upoznaj vlastiti ritam.',
    body2: 'Hormonske promjene mogu tijekom ciklusa utjecati na tvoju energiju, raspoloženje, san i određene tjelesne osjećaje.',
    bodyChanges: [
      {title: 'Tijekom menstruacije', text: 'Energija ti može biti slabija, a tijelu može trebati više odmora.'},
      {title: 'Folikularna faza', text: 'Energija postupno raste i možeš se osjećati življe.'},
      {title: 'Oko ovulacije', text: 'Neke žene osjećaju više energije, motivacije i samopouzdanja.'},
      {title: 'Lutealna faza', text: 'Mogu se pojaviti umor, nadutost ili promjene raspoloženja.'},
    ],
    softTipTitle: 'Slušaj svoje tijelo',
    softTipText: 'Ne postoji samo jedan način proživljavanja svake faze. Tvoji osjećaji ostaju najbolji vodič.',
    body3: 'Bolje poznavanje ciklusa može ti pomoći predvidjeti određena razdoblja i razumjeti promjene koje svakodnevno primjećuješ.',
    whyItems: [
      'Bolje razumjeti signale svog tijela',
      'Predvidjeti menstruaciju i njezine različite faze',
      'Razumjeti određene promjene raspoloženja',
      'Prilagoditi aktivnost razini energije',
      'Poboljšati svakodnevno praćenje',
    ],
    body4: 'Evo nekoliko odgovora na pitanja koja se često postavljaju o različitim fazama ciklusa.',
    faq: [
      {
        question: 'Je li normalno da moj ciklus ne traje točno 28 dana?',
        answer: 'Da. Duljina ciklusa može se razlikovati od osobe do osobe, pa i neznatno iz mjeseca u mjesec.',
      },
      {
        question: 'Događa li se ovulacija uvijek 14. dana?',
        answer: 'Ne. 14. dan je uobičajena procjena za ciklus od 28 dana, ali se ovulacija može dogoditi ranije ili kasnije.',
      },
      {
        question: 'Zašto se moji simptomi mijenjaju ovisno o fazi?',
        answer: 'Hormonske promjene tijekom ciklusa mogu utjecati na energiju, raspoloženje, san i određene tjelesne osjećaje.',
      },
      {
        question: 'Je li korisno pratiti simptome?',
        answer: 'Da. Redovito bilježenje može ti pomoći prepoznati vlastite obrasce i bolje razumjeti svoj ritam.',
      },
    ],
    endTitle: 'Tvoj ciklus, tvoj ritam',
    endText: 'Što više promatraš svoj ciklus, to bolje možeš razumjeti što je tipično za tebe.',
    shareMessage: 'Različite faze ciklusa objašnjene — AWA',
  },
  bs: {
    badge: 'Menstrualni ciklus',
    title: 'Različite faze\nciklusa objašnjene',
    metaDuration: '6 min čitanja',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Tvoj menstrualni ciklus sastoji se od nekoliko faza, a svaka ima ključnu ulogu u tvojoj hormonskoj ravnoteži i zdravlju.',
    contentsTitle: 'U ovom članku',
    topics: [
      '4 faze ciklusa',
      'Kako se tvoje tijelo mijenja',
      'Zašta je važno razumjeti svoj ciklus',
      'Često postavljana pitanja',
    ],
    body1: 'Tvoj se ciklus općenito dijeli na četiri glavne faze. Njihovo trajanje može se razlikovati od osobe do osobe: svako tijelo ima svoj ritam.',
    diagram: {
      menstrual: {name: 'Menstrualna faza', days: '1. do 5. dan'},
      follicular: {name: 'Folikularna faza', days: '1. do 13. dan'},
      luteal: {name: 'Lutealna faza', days: '15. do 28. dan'},
      ovulatory: {name: 'Ovulacijska faza', days: 'Oko 14. dana'},
    },
    tip1Title: 'Dobro je znati',
    tip1Text: 'Svaka je žena jedinstvena: promatraj svoje tijelo i upoznaj vlastiti ritam.',
    body2: 'Hormonske promjene mogu tokom ciklusa utjecati na tvoju energiju, raspoloženje, san i određene tjelesne osjećaje.',
    bodyChanges: [
      {title: 'Tokom menstruacije', text: 'Energija ti može biti slabija, a tijelu može trebati više odmora.'},
      {title: 'Folikularna faza', text: 'Energija postupno raste i možeš se osjećati življe.'},
      {title: 'Oko ovulacije', text: 'Neke žene osjećaju više energije, motivacije i samopouzdanja.'},
      {title: 'Lutealna faza', text: 'Mogu se pojaviti umor, nadutost ili promjene raspoloženja.'},
    ],
    softTipTitle: 'Slušaj svoje tijelo',
    softTipText: 'Ne postoji samo jedan način proživljavanja svake faze. Tvoji osjećaji ostaju najbolji vodič.',
    body3: 'Bolje poznavanje ciklusa može ti pomoći predvidjeti određena razdoblja i razumjeti promjene koje svakodnevno primjećuješ.',
    whyItems: [
      'Bolje razumjeti signale svog tijela',
      'Predvidjeti menstruaciju i njezine različite faze',
      'Razumjeti određene promjene raspoloženja',
      'Prilagoditi aktivnost razini energije',
      'Poboljšati svakodnevno praćenje',
    ],
    body4: 'Evo nekoliko odgovora na pitanja koja se često postavljaju o različitim fazama ciklusa.',
    faq: [
      {
        question: 'Je li normalno da moj ciklus ne traje tačno 28 dana?',
        answer: 'Da. Duljina ciklusa može se razlikovati od osobe do osobe, pa i neznatno iz mjeseca u mjesec.',
      },
      {
        question: 'Događa li se ovulacija uvijek 14. dana?',
        answer: 'Ne. 14. dan je uobičajena procjena za ciklus od 28 dana, ali se ovulacija može dogoditi ranije ili kasnije.',
      },
      {
        question: 'Zašta se moji simptomi mijenjaju ovisno o fazi?',
        answer: 'Hormonske promjene tokom ciklusa mogu utjecati na energiju, raspoloženje, san i određene tjelesne osjećaje.',
      },
      {
        question: 'Je li korisno pratiti simptome?',
        answer: 'Da. Redovito bilježenje može ti pomoći prepoznati vlastite obrasce i bolje razumjeti svoj ritam.',
      },
    ],
    endTitle: 'Tvoj ciklus, tvoj ritam',
    endText: 'Što više promatraš svoj ciklus, to bolje možeš razumjeti što je tipično za tebe.',
    shareMessage: 'Različite faze ciklusa objašnjene — AWA',
  },
  sl: {
    badge: 'Menstrualni cikel',
    title: 'Različne faze\ncikla, razložene',
    metaDuration: '6 min branja',
    metaValidated: 'Preverjena vsebina',
    intro: 'Tvoj menstrualni cikel sestavlja več faz, od katerih ima vsaka ključno vlogo v tvojem hormonskem ravnovesju in zdravju.',
    contentsTitle: 'V tem članku',
    topics: [
      '4 faze cikla',
      'Kako se tvoje telo spreminja',
      'Zakaj je pomembno razumeti svoj cikel',
      'Pogosto zastavljena vprašanja',
    ],
    body1: 'Tvoj cikel je na splošno razdeljen na štiri glavne faze. Njihovo trajanje se lahko razlikuje od osebe do osebe: vsako telo ima svoj ritem.',
    diagram: {
      menstrual: {name: 'Menstrualna faza', days: '1. do 5. dan'},
      follicular: {name: 'Folikularna faza', days: '1. do 13. dan'},
      luteal: {name: 'Lutealna faza', days: '15. do 28. dan'},
      ovulatory: {name: 'Ovulacijska faza', days: 'Okoli 14. dne'},
    },
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Vsaka ženska je edinstvena: opazuj svoje telo in spoznaj lasten ritem.',
    body2: 'Hormonske spremembe lahko skozi cikel vplivajo na tvojo energijo, razpoloženje, spanje in določene telesne občutke.',
    bodyChanges: [
      {title: 'Med menstruacijo', text: 'Energija ti je lahko nižja, telo pa potrebuje več počitka.'},
      {title: 'Folikularna faza', text: 'Energija postopoma narašča in se lahko počutiš bolj živahno.'},
      {title: 'Okoli ovulacije', text: 'Nekatere ženske čutijo več energije, motivacije in samozavesti.'},
      {title: 'Lutealna faza', text: 'Lahko se pojavijo utrujenost, napihnjenost ali spremembe razpoloženja.'},
    ],
    softTipTitle: 'Prisluhni svojemu telesu',
    softTipText: 'Ne obstaja le en način doživljanja vsake faze. Tvoji občutki ostajajo najboljši vodnik.',
    body3: 'Boljše poznavanje cikla ti lahko pomaga predvideti določena obdobja in razumeti spremembe, ki jih opaziš iz dneva v dan.',
    whyItems: [
      'Bolje razumeti signale svojega telesa',
      'Predvideti menstruacijo in njene različne faze',
      'Razumeti določene spremembe razpoloženja',
      'Prilagoditi dejavnost ravni energije',
      'Izboljšati vsakodnevno spremljanje',
    ],
    body4: 'Tu je nekaj odgovorov na vprašanja, ki se pogosto postavljajo o različnih fazah cikla.',
    faq: [
      {
        question: 'Ali je normalno, da moj cikel ne traja natanko 28 dni?',
        answer: 'Da. Dolžina cikla se lahko razlikuje od osebe do osebe, in tudi rahlo iz meseca v mesec.',
      },
      {
        question: 'Ali ovulacija vedno nastopi 14. dan?',
        answer: 'Ne. 14. dan je običajna ocena za 28-dnevni cikel, vendar lahko ovulacija nastopi prej ali pozneje.',
      },
      {
        question: 'Zakaj se moji simptomi spreminjajo glede na fazo?',
        answer: 'Hormonske spremembe skozi cikel lahko vplivajo na energijo, razpoloženje, spanje in določene telesne občutke.',
      },
      {
        question: 'Ali je koristno spremljati simptome?',
        answer: 'Da. Redno beleženje ti lahko pomaga prepoznati lastne vzorce in bolje razumeti svoj ritem.',
      },
    ],
    endTitle: 'Tvoj cikel, tvoj ritem',
    endText: 'Bolj ko opazuješ svoj cikel, bolje lahko razumeš, kaj je tipično zate.',
    shareMessage: 'Različne faze cikla, razložene — AWA',
  },
  ne: {
    badge: 'मासिक चक्र',
    title: 'चक्रका विभिन्न चरणहरू\nव्याख्यासहित',
    metaDuration: '6 मिनेट पढाइ',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'तपाईंको मासिक चक्र धेरै चरणहरूले बनेको हुन्छ, जसमध्ये हरेकले तपाईंको हर्मोनल सन्तुलन र स्वास्थ्यमा आवश्यक भूमिका खेल्छ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'चक्रका 4 चरणहरू',
      'तपाईंको शरीर कसरी बदलिन्छ',
      'आफ्नो चक्र बुझ्नु किन महत्त्वपूर्ण छ',
      'बारम्बार सोधिने प्रश्नहरू',
    ],
    body1: 'तपाईंको चक्र सामान्यतया चार मुख्य चरणमा विभाजित हुन्छ। तिनको अवधि व्यक्तिपिच्छे फरक हुन सक्छ: हरेक शरीरको आफ्नै लय हुन्छ।',
    diagram: {
      menstrual: {name: 'महिनावारी चरण', days: 'दिन 1 देखि 5'},
      follicular: {name: 'फोलिकुलर चरण', days: 'दिन 1 देखि 13'},
      luteal: {name: 'ल्युटियल चरण', days: 'दिन 15 देखि 28'},
      ovulatory: {name: 'अण्डोत्सर्ग चरण', days: 'दिन 14 को वरिपरि'},
    },
    tip1Title: 'जान्न लायक',
    tip1Text: 'हरेक महिला अनौठी हुन्छिन्: आफ्नो शरीर अवलोकन गर्नुहोस् र आफ्नै लय सिक्नुहोस्।',
    body2: 'हर्मोनल परिवर्तनले चक्रभरि तपाईंको ऊर्जा, मनोदशा, निद्रा र केही शारीरिक अनुभूतिहरूलाई प्रभाव पार्न सक्छ।',
    bodyChanges: [
      {title: 'महिनावारीको समयमा', text: 'तपाईंको ऊर्जा कम हुन सक्छ र शरीरलाई बढी आराम चाहिन सक्छ।'},
      {title: 'फोलिकुलर चरण', text: 'ऊर्जा बिस्तारै बढ्छ र तपाईं बढी स्फूर्त महसुस गर्न सक्नुहुन्छ।'},
      {title: 'अण्डोत्सर्गको वरिपरि', text: 'केही महिलाहरू बढी ऊर्जा, उत्साह र आत्मविश्वास महसुस गर्छन्।'},
      {title: 'ल्युटियल चरण', text: 'थकान, पेट फुल्ने वा मनोदशामा परिवर्तन देखिन सक्छ।'},
    ],
    softTipTitle: 'आफ्नो शरीरको कुरा सुन्नुहोस्',
    softTipText: 'हरेक चरण अनुभव गर्ने एउटै मात्र तरिका हुँदैन। तपाईंका आफ्नै अनुभूतिहरू नै सबैभन्दा राम्रो मार्गदर्शक रहन्छन्।',
    body3: 'आफ्नो चक्रलाई राम्ररी चिन्नाले तपाईंलाई केही अवधिको पूर्वानुमान गर्न र दैनिक देखिने परिवर्तनहरू बुझ्न मद्दत गर्न सक्छ।',
    whyItems: [
      'आफ्नो शरीरका संकेतहरू राम्ररी बुझ्न',
      'आफ्नो महिनावारी र यसका विभिन्न चरणहरूको पूर्वानुमान गर्न',
      'केही मनोदशाका परिवर्तनहरू बुझ्न',
      'आफ्नो ऊर्जाको स्तरअनुसार गतिविधि मिलाउन',
      'आफ्नो दैनिक अनुगमन सुधार्न',
    ],
    body4: 'चक्रका विभिन्न चरणबारे प्रायः सोधिने प्रश्नहरूका केही उत्तरहरू यहाँ छन्।',
    faq: [
      {
        question: 'मेरो चक्र ठ्याक्कै 28 दिनको नहुनु सामान्य हो?',
        answer: 'हो। चक्रको अवधि व्यक्तिपिच्छे, र महिनैपिच्छे पनि अलिकति फरक हुन सक्छ।',
      },
      {
        question: 'के अण्डोत्सर्ग सधैँ 14 औँ दिनमै हुन्छ?',
        answer: 'होइन। 14 औँ दिन 28 दिने चक्रका लागि सामान्य अनुमान हो, तर अण्डोत्सर्ग अझ चाँडो वा पछि हुन सक्छ।',
      },
      {
        question: 'मेरा लक्षणहरू चरणअनुसार किन फरक पर्छन्?',
        answer: 'चक्रभरिको हर्मोनल परिवर्तनले ऊर्जा, मनोदशा, निद्रा र केही शारीरिक अनुभूतिहरूलाई प्रभाव पार्न सक्छ।',
      },
      {
        question: 'आफ्ना लक्षणहरू अनुगमन गर्नु उपयोगी हुन्छ?',
        answer: 'हुन्छ। तिनलाई नियमित रूपमा टिप्नुले तपाईंलाई आफ्ना ढाँचा चिन्न र आफ्नो लय राम्ररी बुझ्न मद्दत गर्न सक्छ।',
      },
    ],
    endTitle: 'तपाईंको चक्र, तपाईंको लय',
    endText: 'आफ्नो चक्र जति बढी अवलोकन गर्नुहुन्छ, तपाईंका लागि के सामान्य हो त्यति नै राम्ररी बुझ्न सक्नुहुन्छ।',
    shareMessage: 'चक्रका विभिन्न चरणहरू व्याख्यासहित — AWA',
  },
  si: {
    badge: 'ඔසප් චක්‍රය',
    title: 'චක්‍රයේ විවිධ අවධි\nපැහැදිලි කර ඇත',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඔබේ ඔසප් චක්‍රය අවධි කිහිපයකින් සමන්විත වන අතර, සෑම එකක්ම ඔබේ හෝමෝන සමතුලිතතාවයට සහ ඔබේ සෞඛ්‍යයට අත්‍යවශ්‍ය කාර්යභාරයක් ඉටු කරයි.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'චක්‍රයේ අවධි 4',
      'ඔබේ ශරීරය වෙනස් වන ආකාරය',
      'ඔබේ චක්‍රය තේරුම් ගැනීම වැදගත් වන්නේ ඇයි',
      'නිතර අසන ප්‍රශ්න',
    ],
    body1: 'ඔබේ චක්‍රය සාමාන්‍යයෙන් ප්‍රධාන අවධි හතරකට බෙදා ඇත. ඒවායේ දිග පුද්ගලයාගෙන් පුද්ගලයාට වෙනස් විය හැක: සෑම ශරීරයකටම තමන්ගේම රිද්මයක් ඇත.',
    diagram: {
      menstrual: {name: 'ඔසප් අවධිය', days: 'දින 1 සිට 5 දක්වා'},
      follicular: {name: 'ෆොලිකුලර් අවධිය', days: 'දින 1 සිට 13 දක්වා'},
      luteal: {name: 'ලූටියල් අවධිය', days: 'දින 15 සිට 28 දක්වා'},
      ovulatory: {name: 'ඩිම්බ මෝචන අවධිය', days: '14 වන දිනය පමණ'},
    },
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'සෑම කාන්තාවක්ම අද්විතීයයි: ඔබේ ශරීරය නිරීක්ෂණය කර ඔබේම රිද්මය ඉගෙන ගන්න.',
    body2: 'හෝමෝන වෙනස්කම් චක්‍රය පුරා ඔබේ ශක්තියට, මනෝභාවයට, නින්දට සහ සමහර ශාරීරික සංවේදනයන්ට බලපෑ හැක.',
    bodyChanges: [
      {title: 'ඔබේ ඔසප් කාලයේ', text: 'ඔබේ ශක්තිය අඩු විය හැකි අතර ඔබේ ශරීරයට වැඩි විවේකයක් අවශ්‍ය විය හැක.'},
      {title: 'ෆොලිකුලර් අවධිය', text: 'ශක්තිය ක්‍රමයෙන් ඉහළ යන අතර ඔබට වඩා ශක්තිමත් බවක් දැනිය හැක.'},
      {title: 'ඩිම්බ මෝචනය වටා', text: 'සමහර කාන්තාවන්ට වැඩි ශක්තියක්, උත්තේජනයක් සහ විශ්වාසයක් දැනේ.'},
      {title: 'ලූටියල් අවධිය', text: 'වෙහෙස, බඩ ඉදිමීම, හෝ මනෝභාව වෙනස්වීම් ඇතිවිය හැක.'},
    ],
    softTipTitle: 'ඔබේ ශරීරයට සවන් දෙන්න',
    softTipText: 'සෑම අවධියක්ම අත්විඳිය හැකි එකම ආකාරයක් පමණක් නැත. ඔබේම සංවේදනයන් හොඳම මාර්ගෝපදේශය ලෙස පවතී.',
    body3: 'ඔබේ චක්‍රය වඩා හොඳින් දැනගැනීම සමහර කාල පරිච්ඡේද අපේක්ෂා කිරීමටත් ඔබ දිනෙන් දින දකින වෙනස්කම් තේරුම් ගැනීමටත් ඔබට උපකාරී විය හැක.',
    whyItems: [
      'ඔබේ ශරීරයේ සංඥා වඩා හොඳින් තේරුම් ගන්න',
      'ඔබේ ඔසප් සහ එහි විවිධ අවධි අපේක්ෂා කරන්න',
      'සමහර මනෝභාව වෙනස්වීම් තේරුම් ගන්න',
      'ඔබේ ශක්ති මට්ටමට ඔබේ ක්‍රියාකාරකම සකසන්න',
      'ඔබේ දෛනික නිරීක්ෂණය වැඩිදියුණු කරන්න',
    ],
    body4: 'චක්‍රයේ විවිධ අවධි ගැන නිතර අසන ප්‍රශ්න සඳහා පිළිතුරු කිහිපයක් මෙන්න.',
    faq: [
      {
        question: 'මගේ චක්‍රය හරියටම දින 28ක් නොපැවතීම සාමාන්‍යද?',
        answer: 'ඔව්. චක්‍රයක දිග පුද්ගලයාගෙන් පුද්ගලයාට, මාසයෙන් මාසයට පවා සුළු වශයෙන් වෙනස් විය හැක.',
      },
      {
        question: 'ඩිම්බ මෝචනය සෑම විටම 14 වන දිනයේ සිදුවේද?',
        answer: 'නැහැ. 14 වන දිනය දින 28 චක්‍රයක් සඳහා පොදු ඇස්තමේන්තුවක් වන නමුත්, ඩිම්බ මෝචනය කලින් හෝ පසුව සිදුවිය හැක.',
      },
      {
        question: 'මගේ රෝග ලක්ෂණ අවධිය අනුව වෙනස් වන්නේ ඇයි?',
        answer: 'චක්‍රය පුරා හෝමෝන වෙනස්කම් ශක්තියට, මනෝභාවයට, නින්දට සහ සමහර ශාරීරික සංවේදනයන්ට බලපෑ හැක.',
      },
      {
        question: 'මගේ රෝග ලක්ෂණ නිරීක්ෂණය කිරීම ප්‍රයෝජනවත්ද?',
        answer: 'ඔව්. ඒවා නිතිපතා සටහන් කිරීම ඔබේම රටා හඳුනාගැනීමට සහ ඔබේ රිද්මය වඩා හොඳින් තේරුම් ගැනීමට උපකාරී විය හැක.',
      },
    ],
    endTitle: 'ඔබේ චක්‍රය, ඔබේ රිද්මය',
    endText: 'ඔබ ඔබේ චක්‍රය වැඩියෙන් නිරීක්ෂණය කරන තරමට, ඔබට සාමාන්‍ය දේ තේරුම් ගත හැක.',
    shareMessage: 'චක්‍රයේ විවිධ අවධි පැහැදිලි කර ඇත — AWA',
  },
  th: {
    badge: 'รอบเดือน',
    title: 'อธิบายระยะต่าง ๆ\nของรอบเดือน',
    metaDuration: 'อ่าน 6 นาที',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'รอบเดือนของคุณประกอบด้วยหลายระยะ แต่ละระยะมีบทบาทสำคัญต่อสมดุลของฮอร์โมนและสุขภาพของคุณ',
    contentsTitle: 'ในบทความนี้',
    topics: [
      '4 ระยะของรอบเดือน',
      'ร่างกายของคุณเปลี่ยนไปอย่างไร',
      'ทำไมการเข้าใจรอบเดือนของคุณจึงสำคัญ',
      'คำถามที่พบบ่อย',
    ],
    body1: 'โดยทั่วไปรอบเดือนแบ่งเป็นสี่ระยะหลัก ความยาวของแต่ละระยะแตกต่างกันในแต่ละคน: ร่างกายแต่ละคนมีจังหวะของตัวเอง',
    diagram: {
      menstrual: {name: 'ระยะมีประจำเดือน', days: 'วันที่ 1 ถึง 5'},
      follicular: {name: 'ระยะฟอลลิคูลาร์', days: 'วันที่ 1 ถึง 13'},
      luteal: {name: 'ระยะลูเทียล', days: 'วันที่ 15 ถึง 28'},
      ovulatory: {name: 'ระยะตกไข่', days: 'ราววันที่ 14'},
    },
    tip1Title: 'ควรรู้',
    tip1Text: 'ผู้หญิงแต่ละคนมีเอกลักษณ์: สังเกตร่างกายของคุณและเรียนรู้จังหวะของตัวเอง',
    body2: 'การเปลี่ยนแปลงของฮอร์โมนอาจมีอิทธิพลต่อพลังงาน อารมณ์ การนอนหลับ และความรู้สึกทางกายบางอย่างตลอดรอบเดือน',
    bodyChanges: [
      {title: 'ระหว่างมีประจำเดือน', text: 'พลังงานของคุณอาจต่ำลงและร่างกายอาจต้องการพักผ่อนมากขึ้น'},
      {title: 'ระยะฟอลลิคูลาร์', text: 'พลังงานค่อย ๆ เพิ่มขึ้นและคุณอาจรู้สึกกระปรี้กระเปร่ามากขึ้น'},
      {title: 'ช่วงใกล้ตกไข่', text: 'ผู้หญิงบางคนรู้สึกมีพลังงาน แรงจูงใจ และความมั่นใจมากขึ้น'},
      {title: 'ระยะลูเทียล', text: 'อาจมีความเหนื่อยล้า ท้องอืด หรืออารมณ์เปลี่ยนแปลง'},
    ],
    softTipTitle: 'ฟังเสียงร่างกายของคุณ',
    softTipText: 'การรับรู้แต่ละระยะไม่ได้มีเพียงแบบเดียว ความรู้สึกของคุณเองยังคงเป็นแนวทางที่ดีที่สุด',
    body3: 'การรู้จักรอบเดือนของคุณมากขึ้นช่วยให้คุณคาดการณ์บางช่วงและเข้าใจการเปลี่ยนแปลงที่คุณสังเกตเห็นในแต่ละวัน',
    whyItems: [
      'เข้าใจสัญญาณจากร่างกายของคุณดียิ่งขึ้น',
      'คาดการณ์ประจำเดือนและระยะต่าง ๆ ของคุณ',
      'เข้าใจการเปลี่ยนแปลงของอารมณ์บางอย่าง',
      'ปรับกิจกรรมให้เหมาะกับระดับพลังงานของคุณ',
      'ปรับปรุงการติดตามประจำวันของคุณ',
    ],
    body4: 'นี่คือคำตอบบางส่วนสำหรับคำถามที่พบบ่อยเกี่ยวกับระยะต่าง ๆ ของรอบเดือน',
    faq: [
      {
        question: 'เป็นเรื่องปกติหรือไม่ที่รอบเดือนของฉันไม่ได้ยาว 28 วันพอดี?',
        answer: 'ใช่ ความยาวของรอบเดือนแตกต่างกันในแต่ละคน และอาจต่างกันเล็กน้อยในแต่ละเดือนด้วย',
      },
      {
        question: 'การตกไข่เกิดขึ้นในวันที่ 14 เสมอหรือไม่?',
        answer: 'ไม่ วันที่ 14 เป็นค่าประมาณที่พบบ่อยสำหรับรอบ 28 วัน แต่การตกไข่อาจเกิดเร็วหรือช้ากว่านั้น',
      },
      {
        question: 'ทำไมอาการของฉันเปลี่ยนไปตามระยะ?',
        answer: 'การเปลี่ยนแปลงของฮอร์โมนตลอดรอบเดือนอาจมีอิทธิพลต่อพลังงาน อารมณ์ การนอนหลับ และความรู้สึกทางกายบางอย่าง',
      },
      {
        question: 'การติดตามอาการของฉันมีประโยชน์หรือไม่?',
        answer: 'ใช่ การจดบันทึกอย่างสม่ำเสมอช่วยให้คุณจดจำรูปแบบของตัวเองและเข้าใจจังหวะของคุณดียิ่งขึ้น',
      },
    ],
    endTitle: 'รอบเดือนของคุณ จังหวะของคุณ',
    endText: 'ยิ่งคุณสังเกตรอบเดือนของตัวเองมากเท่าไร คุณก็ยิ่งเข้าใจว่าอะไรเป็นปกติสำหรับคุณ',
    shareMessage: 'อธิบายระยะต่าง ๆ ของรอบเดือน — AWA',
  },
  vi: {
    badge: 'Chu kỳ kinh nguyệt',
    title: 'Giải thích các giai đoạn\nkhác nhau của chu kỳ',
    metaDuration: '6 phút đọc',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Chu kỳ kinh nguyệt của bạn gồm nhiều giai đoạn, mỗi giai đoạn đóng một vai trò thiết yếu đối với sự cân bằng nội tiết và sức khỏe của bạn.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      '4 giai đoạn của chu kỳ',
      'Cơ thể bạn thay đổi như thế nào',
      'Tại sao hiểu chu kỳ của mình lại quan trọng',
      'Câu hỏi thường gặp',
    ],
    body1: 'Chu kỳ của bạn thường được chia thành bốn giai đoạn chính. Độ dài của chúng có thể khác nhau giữa từng người: mỗi cơ thể có nhịp điệu riêng.',
    diagram: {
      menstrual: {name: 'Giai đoạn hành kinh', days: 'Ngày 1 đến 5'},
      follicular: {name: 'Giai đoạn nang trứng', days: 'Ngày 1 đến 13'},
      luteal: {name: 'Giai đoạn hoàng thể', days: 'Ngày 15 đến 28'},
      ovulatory: {name: 'Giai đoạn rụng trứng', days: 'Khoảng ngày 14'},
    },
    tip1Title: 'Nên biết',
    tip1Text: 'Mỗi phụ nữ là duy nhất: hãy quan sát cơ thể và học nhịp điệu riêng của bạn.',
    body2: 'Những thay đổi nội tiết có thể ảnh hưởng đến năng lượng, tâm trạng, giấc ngủ và một số cảm giác thể chất trong suốt chu kỳ.',
    bodyChanges: [
      {title: 'Trong kỳ kinh', text: 'Năng lượng của bạn có thể thấp hơn và cơ thể có thể cần nghỉ ngơi nhiều hơn.'},
      {title: 'Giai đoạn nang trứng', text: 'Năng lượng tăng dần và bạn có thể cảm thấy tràn đầy sức sống hơn.'},
      {title: 'Quanh thời điểm rụng trứng', text: 'Một số phụ nữ cảm thấy nhiều năng lượng, động lực và tự tin hơn.'},
      {title: 'Giai đoạn hoàng thể', text: 'Có thể xuất hiện mệt mỏi, đầy hơi hoặc thay đổi tâm trạng.'},
    ],
    softTipTitle: 'Hãy lắng nghe cơ thể bạn',
    softTipText: 'Không chỉ có một cách để trải qua mỗi giai đoạn. Cảm giác của chính bạn vẫn là chỉ dẫn tốt nhất.',
    body3: 'Hiểu rõ chu kỳ hơn có thể giúp bạn lường trước một số giai đoạn và hiểu những thay đổi bạn nhận thấy mỗi ngày.',
    whyItems: [
      'Hiểu rõ hơn các tín hiệu của cơ thể bạn',
      'Dự đoán trước kỳ kinh và các giai đoạn khác nhau của nó',
      'Hiểu một số thay đổi tâm trạng',
      'Điều chỉnh hoạt động theo mức năng lượng của bạn',
      'Cải thiện việc theo dõi hằng ngày',
    ],
    body4: 'Sau đây là một số câu trả lời cho những câu hỏi thường được đặt ra về các giai đoạn khác nhau của chu kỳ.',
    faq: [
      {
        question: 'Chu kỳ của tôi không kéo dài đúng 28 ngày có bình thường không?',
        answer: 'Có. Độ dài chu kỳ có thể khác nhau giữa từng người, thậm chí hơi khác nhau từ tháng này sang tháng khác.',
      },
      {
        question: 'Có phải rụng trứng luôn xảy ra vào ngày 14 không?',
        answer: 'Không. Ngày 14 là ước tính phổ biến cho chu kỳ 28 ngày, nhưng rụng trứng có thể xảy ra sớm hơn hoặc muộn hơn.',
      },
      {
        question: 'Tại sao các triệu chứng của tôi thay đổi tùy theo giai đoạn?',
        answer: 'Những thay đổi nội tiết trong suốt chu kỳ có thể ảnh hưởng đến năng lượng, tâm trạng, giấc ngủ và một số cảm giác thể chất.',
      },
      {
        question: 'Theo dõi triệu chứng của tôi có hữu ích không?',
        answer: 'Có. Ghi lại chúng đều đặn có thể giúp bạn nhận ra quy luật của riêng mình và hiểu rõ hơn nhịp điệu của bạn.',
      },
    ],
    endTitle: 'Chu kỳ của bạn, nhịp điệu của bạn',
    endText: 'Bạn càng quan sát chu kỳ của mình, bạn càng hiểu được điều gì là bình thường với bạn.',
    shareMessage: 'Giải thích các giai đoạn khác nhau của chu kỳ — AWA',
  },
  uz: {
    badge: 'Hayz sikli',
    title: 'Sikl bosqichlari\nbayoni',
    metaDuration: '6 daq oʻqish',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Hayz siklingiz bir necha bosqichdan iborat va ularning har biri gormonal muvozanatingiz va salomatligingizda muhim rol oʻynaydi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Siklning 4 bosqichi',
      'Tanangiz qanday oʻzgaradi',
      'Siklingizni tushunish nima uchun muhim',
      'Koʻp beriladigan savollar',
    ],
    body1: 'Siklingiz odatda toʻrtta asosiy bosqichga boʻlinadi. Ularning uzunligi odamdan odamga farq qilishi mumkin: har bir tananing oʻz ritmi bor.',
    diagram: {
      menstrual: {name: 'Hayz bosqichi', days: '1-kundan 5-kungacha'},
      follicular: {name: 'Follikulyar bosqich', days: '1-kundan 13-kungacha'},
      luteal: {name: 'Lyuteal bosqich', days: '15-kundan 28-kungacha'},
      ovulatory: {name: 'Ovulyatsiya bosqichi', days: 'Taxminan 14-kun'},
    },
    tip1Title: 'Bilish foydali',
    tip1Text: 'Har bir ayol noyob: tanangizni kuzating va oʻz ritmingizni oʻrganing.',
    body2: 'Gormonal oʻzgarishlar sikl davomida energiyangizga, kayfiyatingizga, uyquingizga va baʼzi jismoniy sezgilarga taʼsir qilishi mumkin.',
    bodyChanges: [
      {title: 'Hayz paytida', text: 'Energiyangiz pastroq boʻlishi va tanangiz koʻproq dam olishga muhtoj boʻlishi mumkin.'},
      {title: 'Follikulyar bosqich', text: 'Energiya asta-sekin ortadi va oʻzingizni tetikroq his qilishingiz mumkin.'},
      {title: 'Ovulyatsiya atrofida', text: 'Baʼzi ayollar koʻproq energiya, ishtiyoq va ishonchni his qiladi.'},
      {title: 'Lyuteal bosqich', text: 'Charchoq, shishish yoki kayfiyat oʻzgarishlari paydo boʻlishi mumkin.'},
    ],
    softTipTitle: 'Tanangizni tinglang',
    softTipText: 'Har bir bosqichni boshdan kechirishning yagona yoʻli yoʻq. Oʻz sezgilaringiz eng yaxshi yoʻl-yoʻriq boʻlib qoladi.',
    body3: 'Siklingizni yaxshiroq bilish baʼzi davrlarni oldindan sezishga va kundalik sezadigan oʻzgarishlarni tushunishga yordam beradi.',
    whyItems: [
      'Tanangizning signallarini yaxshiroq tushunish',
      'Hayzingizni va uning turli bosqichlarini oldindan sezish',
      'Baʼzi kayfiyat oʻzgarishlarini tushunish',
      'Faolligingizni energiya darajangizga moslash',
      'Kundalik kuzatuvingizni yaxshilash',
    ],
    body4: 'Sikl bosqichlari haqida tez-tez beriladigan savollarga bir nechta javob.',
    faq: [
      {
        question: 'Siklim aniq 28 kun davom etmasligi normalmi?',
        answer: 'Ha. Sikl uzunligi odamdan odamga, hatto oydan oyga ozgina farq qilishi mumkin.',
      },
      {
        question: 'Ovulyatsiya har doim 14-kunda sodir boʻladimi?',
        answer: 'Yoʻq. 14-kun 28 kunlik sikl uchun keng tarqalgan taxmin, lekin ovulyatsiya ertaroq yoki kechroq sodir boʻlishi mumkin.',
      },
      {
        question: 'Nima uchun alomatlarim bosqichga qarab oʻzgaradi?',
        answer: 'Sikl davomidagi gormonal oʻzgarishlar energiyaga, kayfiyatga, uyquga va baʼzi jismoniy sezgilarga taʼsir qilishi mumkin.',
      },
      {
        question: 'Alomatlarimni kuzatib borish foydalimi?',
        answer: 'Ha. Ularni muntazam yozib borish oʻz qonuniyatlaringizni tanishga va ritmingizni yaxshiroq tushunishga yordam beradi.',
      },
    ],
    endTitle: 'Sizning siklingiz, sizning ritmingiz',
    endText: 'Siklingizni qancha koʻp kuzatsangiz, siz uchun nima odatiy ekanini shuncha yaxshi tushunasiz.',
    shareMessage: 'Sikl bosqichlari bayoni — AWA',
  },
  az: {
    badge: 'Menstrual dövr',
    title: 'Dövrün müxtəlif\nfazalarının izahı',
    metaDuration: '6 dəq oxu',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Menstrual dövrünüz bir neçə fazadan ibarətdir və hər biri hormonal tarazlığınızda və sağlamlığınızda mühüm rol oynayır.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Dövrün 4 fazası',
      'Bədəniniz necə dəyişir',
      'Dövrünüzü anlamaq nə üçün vacibdir',
      'Tez-tez verilən suallar',
    ],
    body1: 'Dövrünüz adətən dörd əsas fazaya bölünür. Onların müddəti şəxsdən şəxsə dəyişə bilər: hər bədənin öz ritmi var.',
    diagram: {
      menstrual: {name: 'Menstrual faza', days: '1-ci gündən 5-ci günə qədər'},
      follicular: {name: 'Follikulyar faza', days: '1-ci gündən 13-cü günə qədər'},
      luteal: {name: 'Lutein fazası', days: '15-ci gündən 28-ci günə qədər'},
      ovulatory: {name: 'Ovulyator faza', days: '14-cü gün ətrafında'},
    },
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Hər qadın özünəməxsusdur: bədəninizi müşahidə edin və öz ritminizi öyrənin.',
    body2: 'Hormonal dəyişikliklər dövr boyu enerjinizə, əhvalınıza, yuxunuza və bəzi fiziki hisslərə təsir edə bilər.',
    bodyChanges: [
      {title: 'Aybaşı zamanı', text: 'Enerjiniz aşağı ola bilər və bədəniniz daha çox istirahətə ehtiyac duya bilər.'},
      {title: 'Follikulyar faza', text: 'Enerji tədricən artır və özünüzü daha enerjili hiss edə bilərsiniz.'},
      {title: 'Ovulyasiya ətrafında', text: 'Bəzi qadınlar daha çox enerji, motivasiya və özünəinam hiss edir.'},
      {title: 'Lutein fazası', text: 'Yorğunluq, şişkinlik və ya əhval dəyişikliyi görünə bilər.'},
    ],
    softTipTitle: 'Bədəninizi dinləyin',
    softTipText: 'Hər fazanı yaşamağın yalnız bir yolu yoxdur. Öz hissləriniz ən yaxşı bələdçi olaraq qalır.',
    body3: 'Dövrünüzü daha yaxşı tanımaq bəzi dövrləri qabaqcadan görməyə və gündəlik hiss etdiyiniz dəyişiklikləri anlamağa kömək edə bilər.',
    whyItems: [
      'Bədəninizin siqnallarını daha yaxşı anlamaq',
      'Aybaşınızı və onun müxtəlif fazalarını qabaqcadan görmək',
      'Bəzi əhval dəyişikliklərini anlamaq',
      'Fəaliyyətinizi enerji səviyyənizə uyğunlaşdırmaq',
      'Gündəlik izləməni yaxşılaşdırmaq',
    ],
    body4: 'Dövrün müxtəlif fazaları barədə tez-tez verilən suallara bir neçə cavab.',
    faq: [
      {
        question: 'Dövrümün tam 28 gün çəkməməsi normaldır?',
        answer: 'Bəli. Dövrün uzunluğu şəxsdən şəxsə, hətta aydan aya bir qədər dəyişə bilər.',
      },
      {
        question: 'Ovulyasiya həmişə 14-cü gündə baş verir?',
        answer: 'Xeyr. 14-cü gün 28 günlük dövr üçün geniş yayılmış təxmindir, lakin ovulyasiya daha tez və ya daha gec baş verə bilər.',
      },
      {
        question: 'Simptomlarım nə üçün fazadan asılı olaraq dəyişir?',
        answer: 'Dövr boyu hormonal dəyişikliklər enerjiyə, əhvala, yuxuya və bəzi fiziki hisslərə təsir edə bilər.',
      },
      {
        question: 'Simptomlarımı izləməyin faydası varmı?',
        answer: 'Bəli. Onları müntəzəm qeyd etmək öz qanunauyğunluqlarınızı tanımağa və ritminizi daha yaxşı anlamağa kömək edə bilər.',
      },
    ],
    endTitle: 'Sizin dövrünüz, sizin ritminiz',
    endText: 'Dövrünüzü nə qədər çox müşahidə etsəniz, sizin üçün nəyin tipik olduğunu bir o qədər yaxşı anlaya bilərsiniz.',
    shareMessage: 'Dövrün müxtəlif fazalarının izahı — AWA',
  },
  ka: {
    badge: 'მენსტრუაციული ციკლი',
    title: 'ციკლის სხვადასხვა ფაზა,\nახსნილი',
    metaDuration: '6 წთ საკითხავი',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'თქვენი მენსტრუაციული ციკლი რამდენიმე ფაზისგან შედგება, რომელთაგან თითოეულს არსებითი როლი აქვს თქვენს ჰორმონულ ბალანსსა და ჯანმრთელობაში.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'ციკლის 4 ფაზა',
      'როგორ იცვლება თქვენი სხეული',
      'რატომ არის მნიშვნელოვანი ციკლის გაგება',
      'ხშირად დასმული კითხვები',
    ],
    body1: 'თქვენი ციკლი ზოგადად ოთხ ძირითად ფაზად იყოფა. მათი ხანგრძლივობა ადამიანიდან ადამიანამდე შეიძლება განსხვავდებოდეს: ყველა სხეულს საკუთარი რიტმი აქვს.',
    diagram: {
      menstrual: {name: 'მენსტრუაციული ფაზა', days: '1-დან 5 დღემდე'},
      follicular: {name: 'ფოლიკულური ფაზა', days: '1-დან 13 დღემდე'},
      luteal: {name: 'ლუტეალური ფაზა', days: '15-დან 28 დღემდე'},
      ovulatory: {name: 'ოვულაციური ფაზა', days: 'დაახლოებით მე-14 დღე'},
    },
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'ყველა ქალი უნიკალურია: დააკვირდით თქვენს სხეულს და გაიგეთ საკუთარი რიტმი.',
    body2: 'ჰორმონულმა ცვლილებებმა შეიძლება ციკლის განმავლობაში გავლენა მოახდინოს თქვენს ენერგიაზე, ხასიათზე, ძილსა და ზოგიერთ ფიზიკურ შეგრძნებაზე.',
    bodyChanges: [
      {title: 'მენსტრუაციის დროს', text: 'თქვენი ენერგია შეიძლება დაბალი იყოს და თქვენს სხეულს მეტი დასვენება დასჭირდეს.'},
      {title: 'ფოლიკულური ფაზა', text: 'ენერგია ეტაპობრივად იზრდება და შეიძლება უფრო ენერგიულად იგრძნოთ თავი.'},
      {title: 'ოვულაციის გარშემო', text: 'ზოგი ქალი მეტ ენერგიას, მოტივაციასა და თავდაჯერებულობას გრძნობს.'},
      {title: 'ლუტეალური ფაზა', text: 'შეიძლება გამოჩნდეს დაღლილობა, შებერვა ან ხასიათის ცვლილებები.'},
    ],
    softTipTitle: 'მოუსმინეთ თქვენს სხეულს',
    softTipText: 'თითოეული ფაზის განცდის მხოლოდ ერთი გზა არ არსებობს. თქვენი საკუთარი შეგრძნებები რჩება საუკეთესო მეგზურად.',
    body3: 'ციკლის უკეთ გაცნობა შეიძლება დაგეხმაროთ გარკვეული პერიოდების წინასწარ განჭვრეტასა და იმ ცვლილებების გაგებაში, რომლებსაც ყოველდღიურად ამჩნევთ.',
    whyItems: [
      'უკეთ გაიგოთ თქვენი სხეულის სიგნალები',
      'წინასწარ განჭვრიტოთ მენსტრუაცია და მისი სხვადასხვა ფაზა',
      'გაიგოთ ხასიათის გარკვეული ცვლილებები',
      'მოარგოთ თქვენი აქტივობა ენერგიის დონეს',
      'გააუმჯობესოთ თქვენი ყოველდღიური კონტროლი',
    ],
    body4: 'აი რამდენიმე პასუხი კითხვებზე, რომლებსაც ციკლის სხვადასხვა ფაზის შესახებ ხშირად სვამენ.',
    faq: [
      {
        question: 'ნორმალურია, რომ ჩემი ციკლი ზუსტად 28 დღე არ გრძელდება?',
        answer: 'დიახ. ციკლის ხანგრძლივობა ადამიანიდან ადამიანამდე და თვიდან თვემდეც კი მცირედ შეიძლება განსხვავდებოდეს.',
      },
      {
        question: 'ოვულაცია ყოველთვის მე-14 დღეს ხდება?',
        answer: 'არა. მე-14 დღე 28-დღიანი ციკლის გავრცელებული შეფასებაა, მაგრამ ოვულაცია შეიძლება უფრო ადრე ან უფრო გვიან მოხდეს.',
      },
      {
        question: 'რატომ იცვლება ჩემი სიმპტომები ფაზის მიხედვით?',
        answer: 'ციკლის განმავლობაში ჰორმონულ ცვლილებებს შეუძლია ენერგიაზე, ხასიათზე, ძილსა და ზოგიერთ ფიზიკურ შეგრძნებაზე გავლენის მოხდენა.',
      },
      {
        question: 'სასარგებლოა სიმპტომების კონტროლი?',
        answer: 'დიახ. მათი რეგულარულად აღნიშვნა შეიძლება დაგეხმაროთ საკუთარი კანონზომიერებების ამოცნობასა და თქვენი რიტმის უკეთ გაგებაში.',
      },
    ],
    endTitle: 'თქვენი ციკლი, თქვენი რიტმი',
    endText: 'რაც უფრო მეტად აკვირდებით თქვენს ციკლს, მით უკეთ შეგიძლიათ გაიგოთ, რა არის თქვენთვის ტიპური.',
    shareMessage: 'ციკლის სხვადასხვა ფაზა, ახსნილი — AWA',
  },
  hy: {
    badge: 'Դաշտանային ցիկլ',
    title: 'Ցիկլի տարբեր\nփուլերի բացատրություն',
    metaDuration: '6 ր կարդալու համար',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ձեր դաշտանային ցիկլը բաղկացած է մի քանի փուլից, որոնցից յուրաքանչյուրը էական դեր է խաղում ձեր հորմոնալ հավասարակշռության և առողջության մեջ:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ցիկլի 4 փուլերը',
      'Ինչպես է փոխվում ձեր մարմինը',
      'Ինչու է կարևոր հասկանալ ձեր ցիկլը',
      'Հաճախակի տրվող հարցեր',
    ],
    body1: 'Ձեր ցիկլը սովորաբար բաժանվում է չորս հիմնական փուլի: Դրանց տևողությունը կարող է տարբերվել մարդուց մարդ. յուրաքանչյուր մարմին ունի իր ռիթմը:',
    diagram: {
      menstrual: {name: 'Դաշտանային փուլ', days: '1-ից 5-րդ օրեր'},
      follicular: {name: 'Ֆոլիկուլային փուլ', days: '1-ից 13-րդ օրեր'},
      luteal: {name: 'Լյուտեալ փուլ', days: '15-ից 28-րդ օրեր'},
      ovulatory: {name: 'Ձվազատման փուլ', days: 'Մոտ 14-րդ օրը'},
    },
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Յուրաքանչյուր կին եզակի է. դիտարկեք ձեր մարմինը և սովորեք ձեր սեփական ռիթմը:',
    body2: 'Հորմոնալ փոփոխությունները կարող են ազդել ձեր էներգիայի, տրամադրության, քնի և որոշ ֆիզիկական զգացողությունների վրա ցիկլի ընթացքում:',
    bodyChanges: [
      {title: 'Դաշտանի ընթացքում', text: 'Ձեր էներգիան կարող է ավելի ցածր լինել, և ձեր մարմինը կարող է ավելի շատ հանգստի կարիք ունենալ:'},
      {title: 'Ֆոլիկուլային փուլ', text: 'Էներգիան աստիճանաբար բարձրանում է, և դուք կարող եք ավելի եռանդուն զգալ:'},
      {title: 'Ձվազատման շուրջ', text: 'Որոշ կանայք զգում են ավելի շատ էներգիա, մոտիվացիա և վստահություն:'},
      {title: 'Լյուտեալ փուլ', text: 'Կարող են հայտնվել հոգնածություն, ուռածություն կամ տրամադրության փոփոխություններ:'},
    ],
    softTipTitle: 'Լսեք ձեր մարմինը',
    softTipText: 'Յուրաքանչյուր փուլն ապրելու միայն մեկ եղանակ չկա: Ձեր սեփական զգացողությունները մնում են լավագույն ուղեցույցը:',
    body3: 'Ձեր ցիկլը ավելի լավ ճանաչելը կարող է օգնել կանխատեսել որոշ շրջաններ և հասկանալ փոփոխությունները, որոնք նկատում եք օրեցօր:',
    whyItems: [
      'Ավելի լավ հասկանալ ձեր մարմնի ազդանշանները',
      'Կանխատեսել ձեր դաշտանը և դրա տարբեր փուլերը',
      'Հասկանալ տրամադրության որոշ փոփոխություններ',
      'Հարմարեցնել ձեր ակտիվությունը ձեր էներգիայի մակարդակին',
      'Բարելավել ձեր ամենօրյա հետևումը',
    ],
    body4: 'Ահա պատասխաններ ցիկլի տարբեր փուլերի մասին հաճախ տրվող հարցերին:',
    faq: [
      {
        question: 'Նորմա՞լ է, որ իմ ցիկլը ճիշտ 28 օր չի տևում:',
        answer: 'Այո: Ցիկլի տևողությունը կարող է տարբերվել մարդուց մարդ և նույնիսկ թեթևակի՝ ամսից ամիս:',
      },
      {
        question: 'Ձվազատումը միշտ տեղի ունենու՞մ է 14-րդ օրը:',
        answer: 'Ոչ: 14-րդ օրը 28-օրյա ցիկլի տարածված գնահատական է, սակայն ձվազատումը կարող է տեղի ունենալ ավելի շուտ կամ ավելի ուշ:',
      },
      {
        question: 'Ինչու են իմ ախտանիշները փոխվում՝ կախված փուլից:',
        answer: 'Ցիկլի ընթացքում հորմոնալ փոփոխությունները կարող են ազդել էներգիայի, տրամադրության, քնի և որոշ ֆիզիկական զգացողությունների վրա:',
      },
      {
        question: 'Օգտակա՞ր է հետևել իմ ախտանիշներին:',
        answer: 'Այո: Դրանք կանոնավոր գրանցելը կարող է օգնել ճանաչել ձեր սեփական օրինաչափությունները և ավելի լավ հասկանալ ձեր ռիթմը:',
      },
    ],
    endTitle: 'Ձեր ցիկլը, ձեր ռիթմը',
    endText: 'Որքան ավելի շատ եք դիտարկում ձեր ցիկլը, այնքան ավելի լավ կարող եք հասկանալ, թե ինչն է բնորոշ ձեզ:',
    shareMessage: 'Ցիկլի տարբեր փուլերի բացատրություն — AWA',
  },
  tg: {
    badge: 'Давраи ҳайз',
    title: 'Шарҳи марҳилаҳои\nгуногуни давра',
    metaDuration: '6 дақ барои хондан',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Давраи ҳайзии шумо аз якчанд марҳила иборат аст, ки ҳар кадом дар тавозуни гормонӣ ва саломатии шумо нақши муҳим доранд.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      '4 марҳилаи давра',
      'Бадани шумо чӣ тавр тағйир меёбад',
      'Чаро фаҳмидани давраи худ муҳим аст',
      'Саволҳои зуд-зуд додашаванда',
    ],
    body1: 'Давраи шумо одатан ба чор марҳилаи асосӣ тақсим мешавад. Дарозии онҳо аз шахс ба шахс фарқ карда метавонад: ҳар бадан суръати худро дорад.',
    diagram: {
      menstrual: {name: 'Марҳилаи ҳайз', days: 'Рӯзҳои 1 то 5'},
      follicular: {name: 'Марҳилаи фолликулярӣ', days: 'Рӯзҳои 1 то 13'},
      luteal: {name: 'Марҳилаи лютеалӣ', days: 'Рӯзҳои 15 то 28'},
      ovulatory: {name: 'Марҳилаи овуляция', days: 'Тақрибан рӯзи 14'},
    },
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Ҳар зан беназир аст: бадани худро мушоҳида кунед ва суръати худро биомӯзед.',
    body2: 'Тағйироти гормонӣ метавонад дар давоми давра ба қувват, кайфият, хоб ва баъзе эҳсосоти ҷисмонӣ таъсир расонад.',
    bodyChanges: [
      {title: 'Ҳангоми ҳайз', text: 'Қуввати шумо метавонад камтар бошад ва бадан ба истироҳати бештар ниёз дошта бошад.'},
      {title: 'Марҳилаи фолликулярӣ', text: 'Қувват тадриҷан боло меравад ва шумо метавонед худро пурқувваттар ҳис кунед.'},
      {title: 'Дар атрофи овуляция', text: 'Баъзе занон қувват, ангеза ва эътимоди бештарро ҳис мекунанд.'},
      {title: 'Марҳилаи лютеалӣ', text: 'Хастагӣ, дамидани шикам ё тағйирёбии кайфият метавонад пайдо шавад.'},
    ],
    softTipTitle: 'Ба бадани худ гӯш диҳед',
    softTipText: 'Барои аз сар гузаронидани ҳар марҳила танҳо як роҳ вуҷуд надорад. Эҳсосоти худи шумо беҳтарин роҳнамо мемонанд.',
    body3: 'Беҳтар шинохтани давраи худ метавонад ба шумо кумак кунад баъзе давраҳоро пешбинӣ кунед ва тағйироте, ки дар ҳаёти ҳаррӯза мушоҳида мекунед, бифаҳмед.',
    whyItems: [
      'Беҳтар фаҳмидани сигналҳои бадани худ',
      'Пешбинии ҳайз ва марҳилаҳои гуногуни он',
      'Фаҳмидани баъзе тағйироти кайфият',
      'Мутобиқ кардани фаъолият ба сатҳи қувват',
      'Беҳтар кардани пайгирии ҳаррӯза',
    ],
    body4: 'Инҳо чанд посух ба саволҳое мебошанд, ки дар бораи марҳилаҳои гуногуни давра зуд-зуд дода мешаванд.',
    faq: [
      {
        question: 'Оё муқаррарӣ аст, ки давраи ман дақиқан 28 рӯз нест?',
        answer: 'Бале. Дарозии давра аз шахс ба шахс ва ҳатто аз моҳ ба моҳ андаке фарқ карда метавонад.',
      },
      {
        question: 'Оё овуляция ҳамеша дар рӯзи 14 рух медиҳад?',
        answer: 'Не. Рӯзи 14 тахмини маъмул барои давраи 28-рӯза аст, вале овуляция метавонад барвақттар ё дертар рух диҳад.',
      },
      {
        question: 'Чаро нишонаҳои ман вобаста ба марҳила тағйир меёбанд?',
        answer: 'Тағйироти гормонӣ дар давоми давра метавонад ба қувват, кайфият, хоб ва баъзе эҳсосоти ҷисмонӣ таъсир расонад.',
      },
      {
        question: 'Оё пайгирии нишонаҳои ман муфид аст?',
        answer: 'Бале. Мунтазам қайд кардани онҳо метавонад ба шумо кумак кунад намунаҳои худро бишносед ва суръати худро беҳтар бифаҳмед.',
      },
    ],
    endTitle: 'Давраи шумо, суръати шумо',
    endText: 'Ҳар қадар давраи худро бештар мушоҳида кунед, ҳамон қадар беҳтар мефаҳмед, ки барои шумо чӣ муқаррарӣ аст.',
    shareMessage: 'Шарҳи марҳилаҳои гуногуни давра — AWA',
  },
  ky: {
    badge: 'Етек кирим цикли',
    title: 'Циклдин ар кандай\nфазалары түшүндүрүлөт',
    metaDuration: '6 мүн окуу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Етек кирим циклиңиз бир нече фазадан турат, алардын ар бири гормондук тең салмактуулугуңузда жана ден соолугуңузда маанилүү роль ойнойт.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Циклдин 4 фазасы',
      'Денеңиз кандай өзгөрөт',
      'Циклиңизди түшүнүү эмне үчүн маанилүү',
      'Көп берилүүчү суроолор',
    ],
    body1: 'Циклиңиз адатта төрт негизги фазага бөлүнөт. Алардын узактыгы адамдан адамга карата айырмаланышы мүмкүн: ар бир дененин өз ритми бар.',
    diagram: {
      menstrual: {name: 'Етек кирим фазасы', days: '1-күндөн 5-күнгө чейин'},
      follicular: {name: 'Фолликулярдык фаза', days: '1-күндөн 13-күнгө чейин'},
      luteal: {name: 'Лютеиндик фаза', days: '15-күндөн 28-күнгө чейин'},
      ovulatory: {name: 'Овуляциялык фаза', days: 'Болжол менен 14-күн'},
    },
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Ар бир аял уникалдуу: денеңизди байкап, өз ритмиңизди үйрөнүңүз.',
    body2: 'Гормондук өзгөрүүлөр цикл бою энергияңызга, маанайыңызга, уйкуңузга жана айрым физикалык сезимдериңизге таасир этиши мүмкүн.',
    bodyChanges: [
      {title: 'Етек кирим учурунда', text: 'Энергияңыз төмөн болушу мүмкүн жана денеңизге көбүрөөк эс алуу керек болушу мүмкүн.'},
      {title: 'Фолликулярдык фаза', text: 'Энергия акырындап көтөрүлөт жана өзүңүздү күчтүүрөөк сезишиңиз мүмкүн.'},
      {title: 'Овуляциянын тегереги', text: 'Айрым аялдар көбүрөөк энергияны, дилгирликти жана ишенимди сезет.'},
      {title: 'Лютеиндик фаза', text: 'Чарчоо, ич көбүшү же маанайдын өзгөрүшү пайда болушу мүмкүн.'},
    ],
    softTipTitle: 'Денеңизди угуңуз',
    softTipText: 'Ар бир фазаны башынан өткөрүүнүн бир гана жолу жок. Өзүңүздүн сезимдериңиз эң жакшы жетекчи бойдон калат.',
    body3: 'Циклиңизди жакшыраак таануу айрым мезгилдерди алдын ала билүүгө жана күнүмдүк байкаган өзгөрүүлөрдү түшүнүүгө жардам бериши мүмкүн.',
    whyItems: [
      'Денеңиздин белгилерин жакшыраак түшүнүү',
      'Етек киримиңизди жана анын ар кандай фазаларын алдын ала билүү',
      'Айрым маанай өзгөрүүлөрүн түшүнүү',
      'Активдүүлүгүңүздү энергия деңгээлиңизге ыңгайлаштыруу',
      'Күнүмдүк көзөмөлүңүздү жакшыртуу',
    ],
    body4: 'Циклдин ар кандай фазалары боюнча көп берилүүчү суроолорго бир нече жооп.',
    faq: [
      {
        question: 'Циклим так 28 күн болбогону кадимкиби?',
        answer: 'Ооба. Циклдин узактыгы адамдан адамга, ал тургай айдан айга бир аз айырмаланышы мүмкүн.',
      },
      {
        question: 'Овуляция ар дайым 14-күнү болобу?',
        answer: 'Жок. 14-күн 28 күндүк цикл үчүн кеңири таралган болжолдоо, бирок овуляция эртерээк же кечирээк болушу мүмкүн.',
      },
      {
        question: 'Эмне үчүн белгилерим фазага жараша өзгөрөт?',
        answer: 'Цикл бою гормондук өзгөрүүлөр энергияга, маанайга, уйкуга жана айрым физикалык сезимдерге таасир этиши мүмкүн.',
      },
      {
        question: 'Белгилеримди көзөмөлдөө пайдалуубу?',
        answer: 'Ооба. Аларды үзгүлтүксүз жазып туруу өз мыйзам ченемдүүлүгүңүздү таанууга жана ритмиңизди жакшыраак түшүнүүгө жардам бериши мүмкүн.',
      },
    ],
    endTitle: 'Сиздин циклиңиз, сиздин ритмиңиз',
    endText: 'Циклиңизди канчалык көп байкасаңыз, сиз үчүн эмне мүнөздүү экенин ошончолук жакшы түшүнө аласыз.',
    shareMessage: 'Циклдин ар кандай фазалары түшүндүрүлөт — AWA',
  },
  tk: {
    badge: 'Aýbaşy sikli',
    title: 'Sikliň dürli tapgyrlarynyň\ndüşündirilişi',
    metaDuration: '6 min okamak',
    metaValidated: 'Barlanan mazmun',
    intro: 'Aýbaşy sikliňiz gormonal deňagramlylygyňyzda we saglygyňyzda möhüm rol oýnaýan birnäçe tapgyrdan durýar.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Sikliň 4 tapgyry',
      'Bedeniňiz nähili üýtgeýär',
      'Sikliňizi düşünmek näme üçin möhüm',
      'Köp berilýän soraglar',
    ],
    body1: 'Sikliňiz adatça dört esasy tapgyra bölünýär. Olaryň uzynlygy adamdan adama tapawutlanyp biler: her bedeniň öz ritmi bar.',
    diagram: {
      menstrual: {name: 'Aýbaşy tapgyry', days: '1-nji günden 5-nji güne çenli'},
      follicular: {name: 'Follikulýar tapgyr', days: '1-nji günden 13-nji güne çenli'},
      luteal: {name: 'Lýuteal tapgyr', days: '15-nji günden 28-nji güne çenli'},
      ovulatory: {name: 'Ovulýasiýa tapgyry', days: 'Takmynan 14-nji gün'},
    },
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Her aýal ýeke-täk: bedeniňizi synlaň we öz ritmiňizi öwreniň.',
    body2: 'Gormonal üýtgeşmeler sikl dowamynda energiýaňyza, keýbiňize, ukyňyza we käbir fiziki duýgulara täsir edip biler.',
    bodyChanges: [
      {title: 'Aýbaşy wagtynda', text: 'Energiýaňyz pes bolup, bedeniňiz has köp dynç almaga mätäç bolup biler.'},
      {title: 'Follikulýar tapgyr', text: 'Energiýa ýuwaş-ýuwaşdan ýokarlanýar we özüňizi has işjeň duýup bilersiňiz.'},
      {title: 'Ovulýasiýa töwereginde', text: 'Käbir aýallar has köp energiýa, höwes we ynam duýýar.'},
      {title: 'Lýuteal tapgyr', text: 'Ýadawlyk, garnyň çişmegi ýa-da keýbiň üýtgemegi peýda bolup biler.'},
    ],
    softTipTitle: 'Bedeniňize gulak asyň',
    softTipText: 'Her tapgyry başdan geçirmegiň ýeke-täk usuly ýok. Öz duýgularyňyz iň gowy ugrukdyryjy bolup galýar.',
    body3: 'Sikliňizi has gowy tanamak käbir döwürleri öňünden görmäge we gündelik synlaýan üýtgeşmeleriňizi düşünmäge kömek edip biler.',
    whyItems: [
      'Bedeniňiziň signallaryny has gowy düşünmek',
      'Aýbaşyňyzy we onuň dürli tapgyrlaryny öňünden görmek',
      'Käbir keýp üýtgeşmelerini düşünmek',
      'Işjeňligiňizi energiýa derejäňize uýgunlaşdyrmak',
      'Gündelik yzarlamaňyzy gowulandyrmak',
    ],
    body4: 'Sikliň dürli tapgyrlary barada köp berilýän soraglara käbir jogaplar.',
    faq: [
      {
        question: 'Siklimiň takyk 28 gün dowam etmezligi adatymy?',
        answer: 'Hawa. Sikliň uzynlygy adamdan adama, hatda aýdan aýa-da az-kem tapawutlanyp biler.',
      },
      {
        question: 'Ovulýasiýa hemişe 14-nji gün bolýarmy?',
        answer: 'Ýok. 14-nji gün 28 günlük sikl üçin umumy baha, ýöne ovulýasiýa has ir ýa-da has giç bolup biler.',
      },
      {
        question: 'Alamatlarym tapgyra görä näme üçin üýtgeýär?',
        answer: 'Sikl dowamyndaky gormonal üýtgeşmeler energiýa, keýbe, uka we käbir fiziki duýgulara täsir edip biler.',
      },
      {
        question: 'Alamatlarymy yzarlamak peýdalymy?',
        answer: 'Hawa. Olary yzygiderli bellemek öz nusgalaryňyzy tanamaga we ritmiňizi has gowy düşünmäge kömek edip biler.',
      },
    ],
    endTitle: 'Sikliňiz, ritmiňiz',
    endText: 'Sikliňizi näçe köp synlasaňyz, özüňiz üçin nämäniň adatydygyny şonça-da gowy düşünip bilersiňiz.',
    shareMessage: 'Sikliň dürli tapgyrlarynyň düşündirilişi — AWA',
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
