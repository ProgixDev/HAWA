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
import {type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {resolveEditorialLanguage} from '../../i18n/editorialLanguage';
import {CYCLE_PHASES_HERO, resolveEditorialImage} from '../../i18n/editorialImages';
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

const ID = 'firstperiod-choisir-protection';

const HERO = require('../../assets/images/library/featured-flow.png');

// Images stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these illustrations.
const OPTION_IMAGES = [
  require('../../assets/images/first-period-pad.png'),
  require('../../assets/images/flux7.png'),
  require('../../assets/images/flux6.png'),
] as const;

const RELATED_IMAGES = [
  {
    image: require('../../assets/images/library/rules-hero.png'),
    articleId: 'flow-comprendre-flux',
  },
  {
    image: require('../../assets/images/library/rules-hero.png'),
    articleId: 'firstperiod-gerer-quotidien',
  },
  {
    image: CYCLE_PHASES_HERO,
    articleId: 'firstperiod-premieres-regles',
  },
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('FirstPeriodProtection', {
  fr: {
    badge: 'PREMIÈRES RÈGLES',
    title: 'Quelle protection choisir\npour mes premières règles ?',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Il existe plusieurs façons de se protéger pendant les règles. Aucune n’est meilleure qu’une autre : le confort personnel guide le choix.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Les différentes protections',
      'Comment choisir selon son confort',
      'Comment changer sa protection',
    ],
    body1: 'Pour les premières règles, la serviette hygiénique est généralement la protection la plus simple à utiliser, car elle se place directement dans la culotte. Les culottes menstruelles et les tampons sont d’autres options, à essayer plus tard si l’on s’en sent l’envie.',
    options: [
      {
        title: 'Serviettes hygiéniques',
        text: 'Faciles à utiliser, elles se placent dans la culotte et se changent régulièrement.',
      },
      {
        title: 'Culottes menstruelles',
        text: 'Une culotte absorbante et lavable, confortable pour un usage quotidien.',
      },
      {
        title: 'Tampons',
        text: 'S’insèrent à l’intérieur ; leur usage se choisit avec le temps et à son rythme.',
      },
    ],
    body2: 'Il n’y a pas de bonne ou de mauvaise protection : chacune convient différemment selon le corps, les habitudes et le niveau d’aisance de chacune. Les tampons, par exemple, s’insèrent à l’intérieur et demandent un peu plus de familiarité avec son corps — rien n’oblige à les utiliser dès les premières règles.',
    tipTitle: 'Bon à savoir',
    tipText: 'Tester différentes protections au fil du temps permet de trouver celle qui convient le mieux, sans pression.',
    body3: 'Une protection se change en moyenne toutes les 4 à 6 heures, davantage les jours de flux plus abondant. La changer régulièrement permet de rester à l’aise et de préserver l’hygiène intime.',
    relatedTitle: '♥  Tu pourrais aussi aimer',
    related: [
      {title: 'Comprendre ton flux menstruel', meta: '7 min  ·  Guide'},
      {title: 'Comment gérer ses premières règles au quotidien ?', meta: '5 min  ·  Guide'},
      {title: 'Tes premières règles : à quoi t’attendre', meta: '5 min  ·  Guide'},
    ],
    shareMessage: 'Quelle protection choisir pour mes premières règles ? — AWA',
  },
  en: {
    badge: 'FIRST PERIOD',
    title: 'Which protection should I choose\nfor my first period?',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'There are several ways to protect yourself during your period. None is better than another — personal comfort is what guides the choice.',
    contentsTitle: 'In this article',
    topics: [
      'The different types of protection',
      'How to choose based on your comfort',
      'How to change your protection',
    ],
    body1: 'For your first period, a pad is usually the simplest protection to use, since it goes directly into your underwear. Period underwear and tampons are other options you can try later, whenever you feel like it.',
    options: [
      {
        title: 'Pads',
        text: 'Easy to use, they go in your underwear and are changed regularly.',
      },
      {
        title: 'Period underwear',
        text: 'Absorbent, washable underwear that’s comfortable for everyday use.',
      },
      {
        title: 'Tampons',
        text: 'Inserted inside the body; whether and when to use them is up to you, at your own pace.',
      },
    ],
    body2: 'There’s no right or wrong protection: each one suits different bodies, habits, and comfort levels. Tampons, for example, are inserted inside the body and call for a bit more familiarity with it — nothing says you have to use them from your very first period.',
    tipTitle: 'Good to know',
    tipText: 'Trying different types of protection over time helps you find the one that suits you best, with no pressure.',
    body3: 'On average, protection should be changed every 4 to 6 hours, more often on heavier-flow days. Changing it regularly helps you stay comfortable and keep up good intimate hygiene.',
    relatedTitle: '♥  You might also like',
    related: [
      {title: 'Understanding your menstrual flow', meta: '7 min  ·  Guide'},
      {title: 'How to manage your first period day to day?', meta: '5 min  ·  Guide'},
      {title: 'Your first period: what to expect', meta: '5 min  ·  Guide'},
    ],
    shareMessage: 'Which protection should I choose for my first period? — AWA',
  },
  es: {
    badge: 'PRIMERA MENSTRUACIÓN',
    title: '¿Qué protección elegir para\nmi primera menstruación?',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Existen varias formas de protegerte durante la menstruación. Ninguna es mejor que otra: la comodidad personal es lo que guía la elección.',
    contentsTitle: 'En este artículo',
    topics: [
      'Los distintos tipos de protección',
      'Cómo elegir según tu comodidad',
      'Cómo cambiar tu protección',
    ],
    body1: 'Para la primera menstruación, la compresa suele ser la protección más sencilla de usar, ya que se coloca directamente en la ropa interior. Las bragas menstruales y los tampones son otras opciones que puedes probar más adelante, si te apetece.',
    options: [
      {
        title: 'Compresas',
        text: 'Fáciles de usar, se colocan en la ropa interior y se cambian con regularidad.',
      },
      {
        title: 'Bragas menstruales',
        text: 'Una braga absorbente y lavable, cómoda para el uso diario.',
      },
      {
        title: 'Tampones',
        text: 'Se insertan por dentro; su uso se elige con el tiempo y a tu propio ritmo.',
      },
    ],
    body2: 'No existe una protección buena ni una mala: cada una se adapta de forma diferente según el cuerpo, los hábitos y el nivel de comodidad de cada persona. Los tampones, por ejemplo, se insertan por dentro y requieren algo más de familiaridad con tu cuerpo; nada te obliga a usarlos desde tu primera menstruación.',
    tipTitle: 'DATO ÚTIL',
    tipText: 'Probar distintas protecciones con el tiempo te permite encontrar la que mejor te conviene, sin ninguna presión.',
    body3: 'Una protección se cambia, en promedio, cada 4 a 6 horas, con más frecuencia los días de flujo más abundante. Cambiarla con regularidad te ayuda a sentirte cómoda y a mantener una buena higiene íntima.',
    relatedTitle: '♥  También te podría gustar',
    related: [
      {title: 'Comprende tu flujo menstrual', meta: '7 min  ·  Guía'},
      {title: '¿Cómo gestionar tu primera menstruación en el día a día?', meta: '5 min  ·  Guía'},
      {title: 'Tu primera menstruación: qué esperar', meta: '5 min  ·  Guía'},
    ],
    shareMessage: '¿Qué protección elegir para mi primera menstruación? — AWA',
  },
  it: {
    badge: 'PRIMO CICLO',
    title: 'Quale protezione scegliere\nper il primo ciclo?',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Esistono diversi modi per proteggerti durante il ciclo. Nessuno è migliore di un altro: a guidare la scelta è il comfort personale.',
    contentsTitle: 'In questo articolo',
    topics: [
      'I diversi tipi di protezione',
      'Come scegliere in base al tuo comfort',
      'Come cambiare la protezione',
    ],
    body1: 'Per il primo ciclo, l’assorbente esterno è di solito la protezione più semplice da usare, perché si applica direttamente sulla biancheria intima. Le mutandine mestruali e i tamponi sono altre opzioni che puoi provare più avanti, quando ne avrai voglia.',
    options: [
      {
        title: 'Assorbenti',
        text: 'Facili da usare, si applicano sulla biancheria intima e si cambiano regolarmente.',
      },
      {
        title: 'Mutandine mestruali',
        text: 'Biancheria assorbente e lavabile, comoda per l’uso di tutti i giorni.',
      },
      {
        title: 'Tamponi',
        text: 'Si inseriscono all’interno del corpo; se e quando usarli dipende da te, con i tuoi tempi.',
      },
    ],
    body2: 'Non esiste una protezione giusta o sbagliata: ognuna si adatta a corpi, abitudini e livelli di comfort diversi. I tamponi, per esempio, si inseriscono all’interno del corpo e richiedono un po’ più di familiarità con esso: nulla dice che tu debba usarli già dal primo ciclo.',
    tipTitle: 'Da sapere',
    tipText: 'Provare nel tempo diversi tipi di protezione ti aiuta a trovare quella più adatta a te, senza alcuna pressione.',
    body3: 'In media, la protezione va cambiata ogni 4-6 ore, più spesso nei giorni di flusso più abbondante. Cambiarla regolarmente ti aiuta a stare comoda e a mantenere una buona igiene intima.',
    relatedTitle: '♥  Potrebbe interessarti anche',
    related: [
      {
        title: 'Capire il tuo flusso mestruale',
        meta: '7 min  ·  Guida',
      },
      {
        title: 'Come gestire il primo ciclo giorno per giorno?',
        meta: '5 min  ·  Guida',
      },
      {
        title: 'Il tuo primo ciclo: cosa aspettarti',
        meta: '5 min  ·  Guida',
      },
    ],
    shareMessage: 'Quale protezione scegliere per il primo ciclo? — AWA',
  },
  tr: {
    badge: 'İLK ADET',
    title: 'İlk adetim için\nhangi ürünü seçmeliyim?',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Adet döneminde kendini korumanın birkaç yolu var. Hiçbiri diğerinden daha iyi değil; seçimi kişisel konforun belirler.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Farklı koruma ürünleri',
      'Konforuna göre nasıl seçersin',
      'Koruma ürününü nasıl değiştirirsin',
    ],
    body1: 'İlk adetinde ped genellikle kullanması en kolay üründür, çünkü doğrudan iç çamaşırına yerleştirilir. Adet külotu ve tampon ise canın istediğinde daha sonra deneyebileceğin diğer seçeneklerdir.',
    options: [
      {
        title: 'Ped',
        text: 'Kullanımı kolaydır, iç çamaşırına yerleştirilir ve düzenli aralıklarla değiştirilir.',
      },
      {
        title: 'Adet külotu',
        text: 'Emici, yıkanabilir ve günlük kullanımda rahat bir iç çamaşırıdır.',
      },
      {
        title: 'Tampon',
        text: 'Vücudun içine yerleştirilir; kullanıp kullanmayacağın ve ne zaman kullanacağın kendi hızında, sana kalmış.',
      },
    ],
    body2: 'Doğru ya da yanlış bir koruma ürünü yoktur: her biri farklı bedenlere, alışkanlıklara ve konfor düzeylerine uyar. Örneğin tamponlar vücudun içine yerleştirilir ve vücudunu biraz daha tanımayı gerektirir; ilk adetinden itibaren kullanman gerektiği anlamına gelmez.',
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Zaman içinde farklı koruma ürünlerini denemek, kendine en uygun olanı baskı hissetmeden bulmana yardımcı olur.',
    body3: 'Ortalama olarak koruma ürünü her 4 ila 6 saatte bir değiştirilmelidir; kanamanın yoğun olduğu günlerde daha sık değiştirmen gerekebilir. Düzenli değiştirmek, rahat etmene ve genital hijyeni iyi korumana yardımcı olur.',
    relatedTitle: '♥  Bunlar da ilgini çekebilir',
    related: [
      {
        title: 'Adet kanamanı anlamak',
        meta: '7 dk  ·  Rehber',
      },
      {
        title: 'İlk adetini günlük hayatında nasıl yönetirsin?',
        meta: '5 dk  ·  Rehber',
      },
      {
        title: 'İlk adetin: neler beklemelisin',
        meta: '5 dk  ·  Rehber',
      },
    ],
    shareMessage: 'İlk adetim için hangi ürünü seçmeliyim? — AWA',
  },
  ru: {
    badge: 'ПЕРВЫЕ МЕСЯЧНЫЕ',
    title: 'Какое средство гигиены выбрать\nдля первых месячных?',
    metaDuration: '6 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Есть несколько способов защиты во время месячных. Ни один не лучше другого — выбор определяется личным комфортом.',
    contentsTitle: 'В этой статье',
    topics: [
      'Разные виды средств гигиены',
      'Как выбрать в зависимости от комфорта',
      'Как менять средство гигиены',
    ],
    body1: 'Для первых месячных прокладка обычно — самое простое средство: она крепится прямо на бельё. Менструальное бельё и тампоны — другие варианты, которые можно попробовать позже, когда захочется.',
    options: [
      {
        title: 'Прокладки',
        text: 'Просты в использовании: крепятся на бельё и регулярно меняются.',
      },
      {
        title: 'Менструальное бельё',
        text: 'Впитывающее, многоразовое бельё, удобное для повседневной носки.',
      },
      {
        title: 'Тампоны',
        text: 'Вводятся внутрь тела; пользоваться ими или нет и когда — решать вам, в вашем собственном темпе.',
      },
    ],
    body2: 'Правильного или неправильного средства не бывает: каждое подходит разным телам, привычкам и уровню комфорта. Тампоны, например, вводятся внутрь тела и требуют чуть большего знакомства с ним — ничто не обязывает пользоваться ими с самых первых месячных.',
    tipTitle: 'Полезно знать',
    tipText: 'Пробуя разные средства гигиены со временем, вы найдёте то, что подходит вам лучше всего, — без всякого давления.',
    body3: 'В среднем средство гигиены нужно менять каждые 4–6 часов, а в дни с более обильными выделениями — чаще. Регулярная смена помогает чувствовать себя комфортно и соблюдать правила интимной гигиены.',
    relatedTitle: '♥  Вам также может понравиться',
    related: [
      {title: 'Как понять свои менструальные выделения', meta: '7 мин  ·  Руководство'},
      {title: 'Как справляться с первыми месячными изо дня в день?', meta: '5 мин  ·  Руководство'},
      {title: 'Ваши первые месячные: чего ожидать', meta: '5 мин  ·  Руководство'},
    ],
    shareMessage: 'Какое средство гигиены выбрать для первых месячных? — AWA',
  },
  de: {
    badge: 'ERSTE PERIODE',
    title: 'Welcher Schutz passt\nzu meiner ersten Periode?',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Es gibt mehrere Möglichkeiten, sich während der Periode zu schützen. Keine ist besser als die andere – dein persönliches Wohlbefinden entscheidet.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Die verschiedenen Arten von Schutz',
      'So wählst du, was sich für dich gut anfühlt',
      'So wechselst du deinen Schutz',
    ],
    body1: 'Für die erste Periode ist eine Binde meist der einfachste Schutz, denn sie wird direkt in die Unterwäsche geklebt. Periodenunterwäsche und Tampons sind weitere Möglichkeiten, die du später ausprobieren kannst, wann immer du Lust darauf hast.',
    options: [
      {
        title: 'Binden',
        text: 'Einfach anzuwenden: Sie werden in die Unterwäsche geklebt und regelmäßig gewechselt.',
      },
      {
        title: 'Periodenunterwäsche',
        text: 'Saugfähige, waschbare Unterwäsche, die sich im Alltag angenehm trägt.',
      },
      {
        title: 'Tampons',
        text: 'Werden in den Körper eingeführt; ob und wann du sie nutzt, entscheidest du in deinem eigenen Tempo.',
      },
    ],
    body2: 'Es gibt keinen richtigen oder falschen Schutz: Jeder passt zu anderen Körpern, Gewohnheiten und Komfortbedürfnissen. Tampons zum Beispiel werden in den Körper eingeführt und setzen ein wenig mehr Vertrautheit mit ihm voraus – nichts verlangt, dass du sie schon bei deiner allerersten Periode nutzt.',
    tipTitle: 'Gut zu wissen',
    tipText: 'Wenn du mit der Zeit verschiedene Schutzarten ausprobierst, findest du heraus, welche am besten zu dir passt – ganz ohne Druck.',
    body3: 'Im Durchschnitt sollte der Schutz alle 4 bis 6 Stunden gewechselt werden, an Tagen mit stärkerer Blutung häufiger. Regelmäßiges Wechseln hilft dir, dich wohlzufühlen und eine gute Intimhygiene einzuhalten.',
    relatedTitle: '♥  Das könnte dir auch gefallen',
    related: [
      {title: 'Deine Menstruationsblutung verstehen', meta: '7 Min.  ·  Ratgeber'},
      {title: 'Wie gehst du im Alltag mit deiner ersten Periode um?', meta: '5 Min.  ·  Ratgeber'},
      {title: 'Deine erste Periode: Was dich erwartet', meta: '5 Min.  ·  Ratgeber'},
    ],
    shareMessage: 'Welcher Schutz passt zu meiner ersten Periode? – AWA',
  },
  zh: {
      badge: '初潮',
      title: '第一次来月经，\n该选哪种卫生用品？',
      metaDuration: '阅读约 6 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审核内容',
      intro: '月经期间有好几种防护方式。没有哪一种比另一种更好，个人的舒适感才是选择的依据。',
      contentsTitle: '本文内容',
      topics: [
        '不同类型的卫生用品',
        '如何根据舒适感来选择',
        '如何更换卫生用品',
      ],
      body1: '第一次来月经时，卫生巾通常是最容易使用的，因为它直接贴在内裤上。月经内裤和卫生棉条是另外的选择，你可以等之后想尝试的时候再试。',
      options: [
        {
          title: '卫生巾',
          text: '使用方便，贴在内裤上，定时更换。',
        },
        {
          title: '月经内裤',
          text: '可吸收、可清洗的内裤，日常穿着很舒适。',
        },
        {
          title: '卫生棉条',
          text: '放入体内使用；用不用、什么时候用，由你按自己的节奏决定。',
        },
      ],
      body2: '没有对错之分的卫生用品：每一种都适合不同的身体、习惯和舒适度。例如，卫生棉条是放入体内的，需要对自己的身体多一些了解，并没有谁规定你第一次来月经就必须使用。',
      tipTitle: '小贴士',
      tipText: '随着时间慢慢尝试不同类型的卫生用品，有助于找到最适合你的那一种，没有任何压力。',
      body3: '一般来说，卫生用品应每 4 到 6 小时更换一次，经量多的日子更要勤换。定期更换有助于你保持舒适，并做好私处清洁。',
      relatedTitle: '♥  你可能还想看',
      related: [
        {
          title: '了解你的经量',
          meta: '7 分钟  ·  指南',
        },
        {
          title: '如何应对日常中的初潮？',
          meta: '5 分钟  ·  指南',
        },
        {
          title: '你的初潮：会发生什么',
          meta: '5 分钟  ·  指南',
        },
      ],
      shareMessage: '第一次来月经，该选哪种卫生用品？ — AWA',
    },
  'zh-Hant': {
      badge: '初潮',
      title: '第一次來月經，\n該選哪種衛生用品？',
      metaDuration: '閱讀約 6 分鐘',
      metaType: '指南',
      metaLevel: '入門',
      metaValidated: '已稽核內容',
      intro: '月經期間有好幾種防護方式。沒有哪一種比另一種更好，個人的舒適感才是選擇的依據。',
      contentsTitle: '本文內容',
      topics: [
        '不同型別的衛生用品',
        '如何根據舒適感來選擇',
        '如何更換衛生用品',
      ],
      body1: '第一次來月經時，衛生棉通常是最容易使用的，因為它直接貼在內褲上。月經內褲和衛生棉條是另外的選擇，你可以等之後想嘗試的時候再試。',
      options: [
        {
          title: '衛生棉',
          text: '使用方便，貼在內褲上，定時更換。',
        },
        {
          title: '月經內褲',
          text: '可吸收、可清洗的內褲，日常穿著很舒適。',
        },
        {
          title: '衛生棉條',
          text: '放入體內使用；用不用、什麼時候用，由你按自己的節奏決定。',
        },
      ],
      body2: '沒有對錯之分的衛生用品：每一種都適合不同的身體、習慣和舒適度。例如，衛生棉條是放入體內的，需要對自己的身體多一些瞭解，並沒有誰規定你第一次來月經就必須使用。',
      tipTitle: '小提醒',
      tipText: '隨著時間慢慢嘗試不同型別的衛生用品，有助於找到最適合你的那一種，沒有任何壓力。',
      body3: '一般來說，衛生用品應每 4 到 6 小時更換一次，經量多的日子更要勤換。定期更換有助於你保持舒適，並做好私處清潔。',
      relatedTitle: '♥  你可能還想看',
      related: [
        {
          title: '瞭解你的經量',
          meta: '7 分鐘  ·  指南',
        },
        {
          title: '如何應對日常中的初潮？',
          meta: '5 分鐘  ·  指南',
        },
        {
          title: '你的初潮：會發生什麼',
          meta: '5 分鐘  ·  指南',
        },
      ],
      shareMessage: '第一次來月經，該選哪種衛生用品？ — AWA',
    },
  ar: {
    badge: 'أول حيض',
    title: 'أي وسيلة حماية أختار\nلحيضي الأول؟',
    metaDuration: 'قراءة 6 دقائق',
    metaType: 'دليل',
    metaLevel: 'مبتدئة',
    metaValidated: 'محتوى مراجَع',
    intro: 'توجد عدة طرق للحماية أثناء الحيض. لا توجد طريقة أفضل من غيرها، فالراحة الشخصية هي التي توجّه الاختيار.',
    contentsTitle: 'في هذا المقال',
    topics: [
      'أنواع وسائل الحماية المختلفة',
      'كيف تختارين بحسب راحتك',
      'كيف تغيّرين وسيلة الحماية',
    ],
    body1: 'في أول حيض، تكون الفوطة الصحية عادةً أبسط وسيلة للاستخدام، إذ توضع مباشرة في الملابس الداخلية. أما الملابس الداخلية الخاصة بالحيض والسدادات القطنية فخيارات أخرى يمكنك تجربتها لاحقًا متى شئتِ.',
    options: [
      {
        title: 'الفوط الصحية',
        text: 'سهلة الاستخدام، توضع في الملابس الداخلية وتُغيَّر بانتظام.',
      },
      {
        title: 'ملابس الحيض الداخلية',
        text: 'ملابس داخلية ماصّة وقابلة للغسل، مريحة للاستخدام اليومي.',
      },
      {
        title: 'السدادات القطنية',
        text: 'تُدخَل داخل الجسم؛ واستخدامها وموعده أمر يعود إليك، وبالوتيرة التي تناسبك.',
      },
    ],
    body2: 'لا توجد وسيلة حماية صحيحة وأخرى خاطئة: كل وسيلة تناسب أجسامًا وعادات ومستويات راحة مختلفة. فالسدادات القطنية مثلًا تُدخَل داخل الجسم وتتطلب ألفة أكبر قليلًا به، ولا شيء يفرض عليك استخدامها منذ أول حيض.',
    tipTitle: 'من الجيد أن تعرفي',
    tipText: 'تجربة أنواع مختلفة من وسائل الحماية مع الوقت تساعدك على إيجاد ما يناسبك أكثر، دون أي ضغط.',
    body3: 'في المتوسط، ينبغي تغيير وسيلة الحماية كل 4 إلى 6 ساعات، وبوتيرة أكبر في أيام التدفق الغزير. ويساعدك تغييرها بانتظام على الشعور بالراحة والحفاظ على نظافة حميمة جيدة.',
    relatedTitle: '♥  قد يعجبك أيضًا',
    related: [
      {title: 'فهم تدفّق الحيض لديك', meta: '7 دقائق  ·  دليل'},
      {title: 'كيف تتدبّرين حيضك الأول يومًا بيوم؟', meta: '5 دقائق  ·  دليل'},
      {title: 'حيضك الأول: ماذا تتوقعين', meta: '5 دقائق  ·  دليل'},
    ],
    shareMessage: 'أي وسيلة حماية أختار لحيضي الأول؟ — AWA',
  },
  kab: {
    badge: 'LḤIḌ AQDIM',
    title: 'Anwa amdan ara fkeɣ\nilmend n lḥiḍ-iw amezwaru?',
    metaDuration: '6 n tesdidin n tɣuri',
    metaType: 'Amusnaw',
    metaLevel: 'Anagar',
    metaValidated: 'Agbur yettwaɛass',
    intro: 'Llan aṭas n tarrayin i tuḥfazt deg lḥiḍ. Yiwen ur yelhi ugar n wayeḍ — tazmert n wul-ik d ayen ara k-yeqqnen deg usafag.',
    contentsTitle: 'Deg umagrad-a',
    topics: [
      'Iswiren yemgaraden n uḥfaḍ',
      'Amek ara tafeḍ ayen i k-iwulmen',
      'Amek ara tsenfaleḍ aḥfaḍ-ik',
    ],
    body1: 'I lḥiḍ amezwaru, tasekkint (pad) d tin yessefsun akk, acku tettɛeddi ɣer s ddaw n tkabbut. Takabbut n lḥiḍ d tampons d tarrayin-nniḍen ara tɛerḍeḍ mbeɛd, mi ara k-iwulem.',
    options: [
      {
        title: 'Tisekkinin',
        text: 'Fessus i useqdec, ɛeddint deg ukabbut-ik u ttsenfalent s lḥal.',
      },
      {
        title: 'Takabbut n lḥiḍ',
        text: 'Takabbut yettwaɣman, yettwaslaɣ, i yelhan i useqdec n yal ass.',
      },
      {
        title: 'Tampons',
        text: 'Ttuḍemmren daxel n ugris; ma ara ten-tesqedceḍ d melmi, d kečč i s-yeqqnen, s wawal-ik.',
      },
    ],
    body2: 'Ulac aḥfaḍ ṣaḥiḥ neɣ ur yelli ara ṣaḥiḥ: yal yiwen ihuccu i ugris, i yiɛaddan d umdan yemgaraden. Tampons, amedya, ttwaḍemren daxel n ugris u ssutren ad tessneḍ ugar ugris-ik — ulac ayen yeqqnen ad ten-tesqedceḍ seg lḥiḍ-ik amezwaru.',
    tipTitle: 'Yelha ad teɛlmeḍ',
    tipText: 'Ma tɛerḍeḍ iswiren yemgaraden n uḥfaḍ akud, ad k-yɛawen ad tafeḍ win i k-iwulmen akk, war lɛaqaba.',
    body3: 'Deg umetti, ilaq ad tsenfaleḍ aḥfaḍ yal 4 ɣer 6 n tsaɛtin, tikwal ugar deg ussan n uzray ameqqran. Asenfel s lḥal ad k-yɛawen ad tḥessseḍ tazmert d ad tḥafḍeḍ ɣef tifnit tuffirt.',
    relatedTitle: '♥  Ahat ad k-yehwu daɣen',
    related: [
      {title: 'Tamyart n uzray-ik n lḥiḍ', meta: '7 tesdidin  ·  Amusnaw'},
      {title: 'Amek ara tseggmeḍ lḥiḍ-ik amezwaru ass ass?', meta: '5 tesdidin  ·  Amusnaw'},
      {title: 'Lḥiḍ-ik amezwaru: d acu ara tarmeḍ', meta: '5 tesdidin  ·  Amusnaw'},
    ],
    shareMessage: 'Anwa amdan ara fkeɣ ilmend n lḥiḍ-iw amezwaru? — AWA',
  },
  om: {
    badge: 'LAGUU JALQABAA',
    title: 'Laguu koo isa jalqabaa irratti\nwaan ittisu kam filadha?',
    metaDuration: 'Daqiiqaa 6 dubbisuu',
    metaType: 'Qajeelfama',
    metaLevel: 'Jalqabaa',
    metaValidated: 'Qabiyyee sakatta\'amee',
    intro: 'Yeroo laguu of eeggachuuf karaa baay\'ee jira. Tokkoon isaanii isa kaan caalaa gaarii miti — filannoon isaa mijataa ta\'uu kee irratti hundaa\'a.',
    contentsTitle: 'Barruu kana keessatti',
    topics: [
      'Gosoota wantoota ittisanii garaagaraa',
      'Mijataa ta\'uu kee irratti hundaa\'uun akkamitti filatta',
      'Wanta ittisu kee akkamitti jijjiirta',
    ],
    body1: 'Laguu jalqabaa irratti, pad yeroo baay\'ee kan itti fayyadamuuf salphaa dha, sababni isaas tuqaa uffata keessaa irratti kaa\'amuu isaati. Uffata keessaa laguu fi tampoon filannoo biroo yeroo fedhe yaaluu dandeessu dha.',
    options: [
      {
        title: 'Pad',
        text: 'Itti fayyadamuuf salphaa dha, uffata keessaa irra kaa\'ama, yeroo yeroon jijjiirama.',
      },
      {
        title: 'Uffata keessaa laguu',
        text: 'Uffata keessaa dhiiga sooruu fi dhiqamuu danda\'u, guyyaa guyyaatti uffachuuf mijataa dha.',
      },
      {
        title: 'Tampoon',
        text: 'Qaama keessa kaa\'ama; itti fayyadamuu fi yoom akka ta\'e fedhii kee fi saffisa keetiin murtaa\'a.',
      },
    ],
    body2: 'Wanti ittisu sirrii ykn dogoggora hin qabu: tokkoon tokkoon isaanii qaama, amala fi mijataa ta\'uu garaagaraaf ni ta\'a. Fakkeenyaaf, tampoon qaama keessa kaa\'ama, qaama kee waliin dhiyeenyi tokko ni barbaachisa — laguu kee isa jalqabaa irraa eegalee itti fayyadamuu akka qabdu homtu hin jedhu.',
    tipTitle: 'Beekuun gaarii dha',
    tipText: 'Yeroo dheeraa keessatti gosoota wantoota ittisanii garaagaraa yaaluun isa si mijeessu argachuuf si gargaara, dhiibbaa tokko malee.',
    body3: 'Giddugaleessaan, wanti ittisu sa\'aatii 4 hanga 6 keessatti jijjiiramuu qaba, guyyoota dhiigni baay\'ee ba\'u irratti caalaatti. Yeroo yeroon jijjiiruun mijataa akka taatu fi qulqullina qaama dhokataa gaarii akka eegdu si gargaara.',
    relatedTitle: '♥  Kunis si ni gammachiisa',
    related: [
      {title: 'Dhiigni laguu kee akkamitti akka ta\'e hubachuu', meta: 'Daqiiqaa 7  ·  Qajeelfama'},
      {title: 'Laguu kee isa jalqabaa guyyaa guyyaan akkamitti to\'attaa?', meta: 'Daqiiqaa 5  ·  Qajeelfama'},
      {title: 'Laguu kee isa jalqabaa: maal eegamu', meta: 'Daqiiqaa 5  ·  Qajeelfama'},
    ],
    shareMessage: 'Laguu koo isa jalqabaa irratti waan ittisu kam filadha? — AWA',
  },
  ti: {
    badge: 'ቀዳማይ ወርሓዊ ደም',
    title: 'ንቀዳማይ ወርሓዊ ደመይ\nኣየናይ ሓለዋ ክመርጽ',
    metaDuration: '6 ደቒቕ ንባብ',
    metaType: 'መምርሒ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'ዝተገምገመ ትሕዝቶ',
    intro: 'ኣብ እዋን ወርሓዊ ደም ርእስኺ ንምሕላው ብዙሕ መንገዲታት ኣሎ። ሓደ ካብ ካልእ ዝሓሸ የለን — ምቾት ናይ ባዕልኺ እዩ ምርጫ ዘመርሕ።',
    contentsTitle: 'ኣብዚ ጽሑፍ',
    topics: [
      'ዝተፈላለዩ ዓይነታት ሓለዋ',
      'ብምቾትኪ ከመይ ትመርጺ',
      'ሓለዋኺ ከመይ ትቅይርዮ',
    ],
    body1: 'ንቀዳማይ ወርሓዊ ደም ብዝበዝሐ ፓድ (ኣብ ሕድሪ ዝግበር) ንምጥቃም ዝቐለለ እዩ፡ ምኽንያቱ ብቐጥታ ኣብ ታሕተዋይ ክዳን ይኣቱ። ናይ ወርሓዊ ደም ታሕተዋይ ክዳንን ታምፖንን ድሕሪ ግዜ ክትፈትንዮም እትኽእሊ ካልኦት ኣማራጺታት እዮም።',
    options: [
      {
        title: 'ፓድ',
        text: 'ንምጥቃም ቀሊል፡ ኣብ ታሕተዋይ ክዳን ይግበር ብኣገባብ ድማ ይቕየር።',
      },
      {
        title: 'ናይ ወርሓዊ ደም ታሕተዋይ ክዳን',
        text: 'ዘምጥጥን፡ ዝሕጸብ ታሕተዋይ ክዳን፡ ንመዓልታዊ ጥቕሚ ምቹእ።',
      },
      {
        title: 'ታምፖን',
        text: 'ኣብ ውሽጢ ኣካል ይኣቱ፤ ምጥቃሙን ግዜኡን ብውሳኔኺ፡ ብናይ ባዕልኺ ፍጥነት እዩ።',
      },
    ],
    body2: 'ቅኑዕ ወይ ጌጋ ሓለዋ የለን፡ ነፍሲ ወከፍ ንዝተፈላለዩ ኣካላት፡ ልምድታትን ምቾትን ይሰማማዕ። ታምፖን ንኣብነት ኣብ ውሽጢ ኣካል ይኣቱ፡ ብዛዕባ ኣካል ዝያዳ ትውውቕ ድማ የድሊ — ካብ ቀዳማይ ወርሓዊ ደምኪ ክትጥቀምዮ ዘገድድ የለን።',
    tipTitle: 'ከተፍልጥዮ ዘለካ',
    tipText: 'ብግዜ ዝተፈላለየ ዓይነት ሓለዋ ምፍታን፡ ብዘይ ጸቕጢ ንዓኺ ዝበለጸ ንምርካብ ይሕግዘኪ።',
    body3: 'ብማእከላይ ሓለዋ ኣብ ነፍሲ ወከፍ 4 ክሳብ 6 ሰዓታት ክትቅየር ይግባእ፡ ኣብ ዝያዳ ደም ዝፈሰሰሉ መዓልታት ድማ ብዝያዳ። ብኣገባብ ምቅያር ምቾትኪ ንምሕላውን ጽቡቕ ናይ ውሽጣዊ ንጽህና ንምሕላውን ይሕግዘኪ።',
    relatedTitle: '♥  እዚ እውን ክትፈትዊ ትኽእሊ',
    related: [
      {title: 'ወርሓዊ ደመይ ምርዳእ', meta: '7 ደቒቕ  ·  መምርሒ'},
      {title: 'ቀዳማይ ወርሓዊ ደምኪ መዓልታዊ ከመይ ትማሓደሪ?', meta: '5 ደቒቕ  ·  መምርሒ'},
      {title: 'ቀዳማይ ወርሓዊ ደምኪ፡ እንታይ ትጽበዪ', meta: '5 ደቒቕ  ·  መምርሒ'},
    ],
    shareMessage: 'ንቀዳማይ ወርሓዊ ደመይ ኣየናይ ሓለዋ ክመርጽ? — AWA',
  },
  rw: {
    badge: 'IMIHANGO YA MBERE',
    title: 'Ni ikihe kintu cyo kwirinda nahitamo\nku mihango yanjye ya mbere?',
    metaDuration: 'Gusoma: iminota 6',
    metaType: 'Ubuyobozi',
    metaLevel: 'Utangiye',
    metaValidated: 'Ibikubiyemo byasuzumwe',
    intro: 'Hari uburyo bwinshi bwo kwirinda mu gihe cy\'imihango. Nta bwiza kurusha ubundi — ibyo wumva uguhesheje amahoro ni byo bigufasha guhitamo.',
    contentsTitle: 'Muri iyi nkuru',
    topics: [
      'Ubwoko butandukanye bwo kwirinda',
      'Uko wahitamo bijyanye n\'ibigushimisha',
      'Uko uhindura ikikurinda',
    ],
    body1: 'Ku mihango ya mbere, agatambaro gakoreshwa ku mubiri (pad) ni ko koroshye gukoresha, kuko gashyirwa mu cyenda. Ikariso yagenewe imihango na tampon ni ubundi buryo ushobora kugerageza nyuma, igihe wumvise ubishaka.',
    options: [
      {
        title: 'Pad',
        text: 'Biroroshye gukoresha, bishyirwa mu cyenda kandi bigahindurwa buri gihe.',
      },
      {
        title: 'Ikariso yagenewe imihango',
        text: 'Ikariso ikurura amaraso, ishobora gukaywa, kandi yoroheje gukoresha buri munsi.',
      },
      {
        title: 'Tampon',
        text: 'Zishyirwa mu mubiri imbere; niba uzikoresha n\'igihe uzikoresha, ni wowe ubihitamo, ku muvuduko wawe.',
      },
    ],
    body2: 'Nta kintu cyo kwirinda kiba cyiza cyangwa kibi: buri kimwe gikwiranye n\'imibiri itandukanye, imigenzo itandukanye, n\'ibyo buri wese yumva amerewe neza. Tampon, urugero, zishyirwa mu mubiri imbere kandi zisaba kumenya umubiri wawe gato — nta kivuga ko ugomba kuzikoresha guhera ku mihango yawe ya mbere.',
    tipTitle: 'Byiza kumenya',
    tipText: 'Kugerageza ubwoko butandukanye bwo kwirinda uko iminsi igenda bigufasha kubona icyo ukwiriye cyane, nta gahato.',
    body3: 'Ugereranyije, ikikurinda gikwiye guhindurwa buri masaha 4 kugeza kuri 6, kenshi ku minsi y\'amaraso menshi. Kugihindura buri gihe bigufasha kumererwa neza no kwita ku isuku y\'ibice by\'ibanga.',
    relatedTitle: '♥  Ushobora no gukunda',
    related: [
      {title: 'Gusobanukirwa amaraso y\'imihango yawe', meta: 'iminota 7  ·  Ubuyobozi'},
      {title: 'Wakwita ute ku mihango ya mbere umunsi ku munsi?', meta: 'iminota 5  ·  Ubuyobozi'},
      {title: 'Imihango yawe ya mbere: icyo witegura', meta: 'iminota 5  ·  Ubuyobozi'},
    ],
    shareMessage: 'Ni ikihe kintu cyo kwirinda nahitamo ku mihango yanjye ya mbere? — AWA',
  },
  rn: {
    badge: 'IMIHANGO Y\'INTANGIRIRO',
    title: 'Ni ikinga ikihe nokwihitamwo\nku mihango yanje ya mbere?',
    metaDuration: 'Iminota 6 yo gusoma',
    metaType: 'Ubuyobozi',
    metaLevel: 'Intangiriro',
    metaValidated: 'Ibisuzumwe',
    intro: 'Hariho inzira nyinshi zo kwikingira mu gihe c\'imihango. Nta n\'imwe isumba indi — ukuntu wumva umerewe neza ni co kiyobora ihitamwo.',
    contentsTitle: 'Muri iyi ngingo',
    topics: [
      'Ubwoko butandukanye bw\'ibikinga',
      'Ukuntu wohitamwo ukurikije ukuntu wumva umerewe neza',
      'Ukuntu wohindura ikinga',
    ],
    body1: 'Ku mihango yawe ya mbere, pad ni yo isanzwe yoroshe gukoresha, kuko ishirwa muri karuvate yawe. Karuvate zo mu gihe c\'imihango na tampon ni izindi nzira ushobora kugerageza nyuma, igihe wumvise ubishaka.',
    options: [
      {
        title: 'Pad',
        text: 'Biroroshe gukoresha, bishirwa muri karuvate kandi bigahindurwa buri kanya.',
      },
      {
        title: 'Karuvate zo mu gihe c\'imihango',
        text: 'Karuvate zinywa amaraso, zozwa, zoroshe gukoresha buri munsi.',
      },
      {
        title: 'Tampon',
        text: 'Zishirwa imbere mu mubiri; kuzikoresha n\'igihe co kuzikoresha biri ku wundi, uko ushaka.',
      },
    ],
    body2: 'Nta kinga ryiza canke ribi: buri kimwe kigenewe imibiri, imigenzo n\'ukuntu abantu bumva bameze neza bitandukanye. Tampon, nk\'akarorero, zishirwa imbere mu mubiri kandi zisaba kuwumenyera gatoyi — nta ndwi ivuga ko ugomba kuzikoresha kuva ku mihango yawe ya mbere.',
    tipTitle: 'Ni vyiza kubimenya',
    tipText: 'Kugerageza ubwoko butandukanye bw\'ibikinga uko igihe gihita bigufasha kubona ikikubereye cane, nta gukanda.',
    body3: 'Ku rugero, ikinga rikwiye guhindurwa buri masaha 4 kugera kuri 6, kenshi cane mu minsi imihango iri myinshi. Kuhahindura buri kanya bigufasha kuguma wumva umerewe neza no kubungabunga isuku nziza y\'ibice vyawe vy\'ibanga.',
    relatedTitle: '♥  Ushobora no gukunda',
    related: [
      {title: 'Gusobanukirwa amaraso y\'imihango yawe', meta: 'Iminota 7  ·  Ubuyobozi'},
      {title: 'Ni gute wogenzura imihango yawe ya mbere buri musi?', meta: 'Iminota 5  ·  Ubuyobozi'},
      {title: 'Imihango yawe ya mbere: ivyo gutegereza', meta: 'Iminota 5  ·  Ubuyobozi'},
    ],
    shareMessage: 'Ni ikinga ikihe nokwihitamwo ku mihango yanje ya mbere? — AWA',
  },
  ig: {
    badge: 'NSỌ MBỤ',
    title: 'Kedu ihe nche m ga-ahọrọ\nmaka nsọ m nke mbụ?',
    metaDuration: 'Nkeji 6 ọgụgụ',
    metaType: 'Nduzi',
    metaLevel: 'Onye mbido',
    metaValidated: 'Ọdịnaya a nyochara',
    intro: 'Ụzọ dị iche iche dị ị ga-esi chebe onwe gị n\'oge nsọ. Ọ dịghị nke ka nke ọzọ mma — ntụsara ahụ gị bụ ya na-eduzi nhọrọ.',
    contentsTitle: 'N\'isiokwu a',
    topics: [
      'Ụdị ihe nche dị iche iche',
      'Etu esi ahọrọ dabere na ntụsara ahụ gị',
      'Etu esi agbanwe ihe nche gị',
    ],
    body1: 'Maka nsọ gị nke mbụ, pad na-abụkarị ihe nche kacha mfe iji, ebe ọ na-abanye ozugbo n\'ime akwa ime gị. Akwa ime nsọ na tampon bụ nhọrọ ndị ọzọ ị nwere ike ịnwale mgbe e mesịrị, mgbe ọ masịrị gị.',
    options: [
      {
        title: 'Pad',
        text: 'Ọ dị mfe iji, ọ na-anọ n\'akwa ime gị, a na-agbanwekwa ya mgbe niile.',
      },
      {
        title: 'Akwa ime nsọ',
        text: 'Akwa ime nwere ike ịmịkọrọ mmiri, nke a na-asa, nke dị mma maka ojiji kwa ụbọchị.',
      },
      {
        title: 'Tampon',
        text: 'A na-etinye ya n\'ime ahụ; ma ị ga-eji ha ma ọ bụ mgbe ị ga-eji ha dabere na gị, n\'ọsọ nke gị.',
      },
    ],
    body2: 'Ọ dịghị ihe nche ziri ezi ma ọ bụ nke na-ezighị ezi: nke ọ bụla dabara n\'ahụ, omume na ntụsara ahụ dị iche iche. Tampon, dịka ọmụmaatụ, a na-etinye ya n\'ime ahụ, ọ chọkwara ka i mara ahụ gị ntakịrị — ọ nweghị ihe na-ekwu na ị ga-eji ha site na nsọ gị nke mbụ.',
    tipTitle: 'Ihe ọ dị mma ịma',
    tipText: 'Ịnwale ụdị ihe nche dị iche iche n\'oge na-aga na-enyere gị aka ịchọta nke kacha dabara gị, na-enweghị nrụgide.',
    body3: 'N\'ozuzu, a ghaghị ịgbanwe ihe nche kwa awa 4 ruo 6, ugboro ugboro karị n\'ụbọchị ọbara na-asọpụta nke ukwuu. Ịgbanwe ya mgbe niile na-enyere gị aka ịnọ n\'udo na idebe ahụ ike ebe ndị nzuzo gị.',
    relatedTitle: '♥  Ị nwekwara ike ịmasị',
    related: [
      {title: 'Ịghọta ọbara nsọ gị', meta: 'Nkeji 7  ·  Nduzi'},
      {title: 'Etu esi achịkwa nsọ gị nke mbụ kwa ụbọchị?', meta: 'Nkeji 5  ·  Nduzi'},
      {title: 'Nsọ gị nke mbụ: ihe ị ga-atụ anya', meta: 'Nkeji 5  ·  Nduzi'},
    ],
    shareMessage: 'Kedu ihe nche m ga-ahọrọ maka nsọ m nke mbụ? — AWA',
  },
  yo: {
    badge: 'NǸKAN OṢÙ AKỌ́KỌ́',
    title: 'Irú ìdáàbòbò wo ni kí n yàn\nfún nǹkan oṣù àkọ́kọ́ mi?',
    metaDuration: 'Ìṣẹ́jú 6 láti kà',
    metaType: 'Ìtọ́sọ́nà',
    metaLevel: 'Olùbẹ̀rẹ̀',
    metaValidated: 'Àkóónú tí a ti yẹ̀ wò',
    intro: 'Ọ̀nà púpọ̀ ló wà láti dáàbò bo ara rẹ nígbà nǹkan oṣù. Kò sí èyí tó sàn ju èkejì lọ — ìtùnú ara ẹni ni ó yẹ kó darí yíyàn.',
    contentsTitle: 'Nínú àpilẹ̀kọ yìí',
    topics: [
      'Àwọn oríṣiríṣi ìdáàbòbò',
      'Bí o ṣe lè yàn gẹ́gẹ́ bí ìtùnú rẹ',
      'Bí o ṣe lè pààrọ̀ ìdáàbòbò rẹ',
    ],
    body1: 'Fún nǹkan oṣù àkọ́kọ́ rẹ, pad ni ó sábà máa rọrùn jù láti lò, nítorí pé ó máa ń lọ taara sí abẹ́ ẹ̀wù abẹ́lẹ̀ rẹ. Ẹ̀wù abẹ́lẹ̀ nǹkan oṣù àti tampon jẹ́ àwọn àṣàyàn mìíràn tí o lè gbìyànjú nígbà tó bá wù ọ́.',
    options: [
      {
        title: 'Pad',
        text: 'Wọ́n rọrùn láti lò, wọ́n máa ń lọ sí abẹ́ ẹ̀wù abẹ́lẹ̀ rẹ, a sì máa ń pààrọ̀ wọn déédé.',
      },
      {
        title: 'Ẹ̀wù abẹ́lẹ̀ nǹkan oṣù',
        text: 'Ẹ̀wù abẹ́lẹ̀ tó ń fa omi mu, tí a lè fọ̀, tó sì tù ni lára fún lílò lójoojúmọ́.',
      },
      {
        title: 'Tampon',
        text: 'A máa ń fi sínú ara; ìwọ ni o ni ìpinnu bóyá àti ìgbà wo ni o máa lò wọ́n, ní ìwọ̀n ìrìn rẹ.',
      },
    ],
    body2: 'Kò sí ìdáàbòbò tó tọ́ tàbí tó kùnà: ọ̀kọ̀ọ̀kan ló bá oríṣiríṣi ara, àṣà àti ìtùnú mu. Tampon, fún àpẹẹrẹ, ni a máa ń fi sínú ara, ó sì nílò kí o mọ ara rẹ díẹ̀ sí i — kò sí ohun tó sọ pé o gbọ́dọ̀ lò ó láti nǹkan oṣù àkọ́kọ́ rẹ.',
    tipTitle: 'Ohun tó dára láti mọ̀',
    tipText: 'Gbígbìyànjú oríṣiríṣi ìdáàbòbò pẹ̀lú ìgbà ń ràn ọ́ lọ́wọ́ láti rí èyí tó bá ọ mu jù, láìsí ìfúnpá.',
    body3: 'Ní àpapọ̀, ó yẹ kí a pààrọ̀ ìdáàbòbò ní wákàtí 4 sí 6 kọ̀ọ̀kan, ní ìgbà púpọ̀ sí i ní àwọn ọjọ́ tí ẹ̀jẹ̀ bá pọ̀. Pípààrọ̀ rẹ̀ déédé ń ràn ọ́ lọ́wọ́ láti máa tura, àti láti ní ìmọ́tótó ara tó dára.',
    relatedTitle: '♥  O lè fẹ́ràn èyí pẹ̀lú',
    related: [
      {title: 'Òye ìṣàn nǹkan oṣù rẹ', meta: 'Ìṣẹ́jú 7  ·  Ìtọ́sọ́nà'},
      {title: 'Báwo ni a ṣe lè bójú tó nǹkan oṣù àkọ́kọ́ lójoojúmọ́?', meta: 'Ìṣẹ́jú 5  ·  Ìtọ́sọ́nà'},
      {title: 'Nǹkan oṣù àkọ́kọ́ rẹ: ohun tí o lè retí', meta: 'Ìṣẹ́jú 5  ·  Ìtọ́sọ́nà'},
    ],
    shareMessage: 'Irú ìdáàbòbò wo ni kí n yàn fún nǹkan oṣù àkọ́kọ́ mi? — AWA',
  },
  zu: {
    badge: 'UKUYA ESIKHATHINI KOKUQALA',
    title: 'Yiluphi uvikelo okufanele ngilukhethe\nesikhathini sami sokuqala?',
    metaDuration: 'Imizuzu emi-6 yokufunda',
    metaType: 'Umhlahlandlela',
    metaLevel: 'Ongaqalayo',
    metaValidated: 'Okuqukethwe okubuyekeziwe',
    intro: 'Zikhona izindlela eziningana zokuzivikela ngesikhathi sokuya esikhathini. Akukho ngcono kunenye — induduzo yakho iyiyona eholela ekukhetheni.',
    contentsTitle: 'Kulesi sihloko',
    topics: [
      'Izinhlobo ezahlukene zovikelo',
      'Ukukhetha ngokuya ngendlela ozizwa ngayo',
      'Ukushintsha uvikelo lwakho',
    ],
    body1: 'Ekuyeni kwakho esikhathini kokuqala, iphedi imvamisa iyona ndlela elula yokusebenzisa, njengoba ihamba ngqo phakathi kwezingubo zangaphansi. Izingubo zangaphansi zesikhathi nama-tampon kuyizinketho ezinye ongazizama kamuva, noma nini lapho uzizwa uthanda.',
    options: [
      {
        title: 'Amaphedi',
        text: 'Alula ukusebenzisa, afakwa phakathi kwezingubo zangaphansi futhi ashintshwa njalo.',
      },
      {
        title: 'Izingubo zangaphansi zesikhathi',
        text: 'Izingubo zangaphansi ezimunca futhi ezigezwayo ezikhululekile ukuzigqokela nsuku zonke.',
      },
      {
        title: 'Ama-tampon',
        text: 'Afakwa ngaphakathi emzimbeni; ukuthi uwasebenzisa yini nokuthi nini kuncike kuwe, ngejubane lakho.',
      },
    ],
    body2: 'Akukho uvikelo olulungile noma olungalungile: ngamunye ulingana nemizimba, izijwayezi nezinga lokukhululeka okuhlukene. Ama-tampon, isibonelo, afakwa ngaphakathi emzimbeni futhi adinga ukuwazi kancane ngaphezulu — akukho okusho ukuthi kufanele uwasebenzise kusukela esikhathini sakho sokuqala.',
    tipTitle: 'Kuhle ukwazi',
    tipText: 'Ukuzama izinhlobo ezahlukene zovikelo ngokuhamba kwesikhathi kukusiza ukuthola olulingana nawe kangcono, ngaphandle kwengcindezi.',
    body3: 'Ngokwesilinganiso, uvikelo kufanele lushintshwe njalo ngamahora angu-4 kuya ku-6, kaningi ezinsukwini zokuhamba kakhulu. Ukulushintsha njalo kukusiza uzizwe ukhululekile futhi ugcine inhlanzeko enhle yezindawo zangasese.',
    relatedTitle: '♥  Ungathanda nalokhu',
    related: [
      {title: 'Ukuqonda ukuhamba kwegazi lakho lesikhathi', meta: 'Imizuzu emi-7  ·  Umhlahlandlela'},
      {title: 'Ungakuphatha kanjani ukuya kwakho esikhathini kokuqala usuku nosuku?', meta: 'Imizuzu emi-5  ·  Umhlahlandlela'},
      {title: 'Ukuya kwakho esikhathini kokuqala: okufanele ukulindele', meta: 'Imizuzu emi-5  ·  Umhlahlandlela'},
    ],
    shareMessage: 'Yiluphi uvikelo okufanele ngilukhethe esikhathini sami sokuqala? — AWA',
  },
  xh: {
    badge: 'IXESHA LOKUQALA LENYANGA',
    title: 'Ndiyikhethe phi indlela yokuzikhusela\nexeshini lam lokuqala lenyanga?',
    metaDuration: 'Imizuzu emi-6 yokufunda',
    metaType: 'Isikhokelo',
    metaLevel: 'Umqali',
    metaValidated: 'Umxholo ohlolwe',
    intro: 'Zininzi iindlela zokuzikhusela exeshini lakho lenyanga. Akukho enye engcono kunenye — ukuba ukhululekile kunguwe okhokelayo ekukhetheni.',
    contentsTitle: 'Kweli nqaku',
    topics: [
      'Iindidi ezahlukeneyo zokuzikhusela',
      'Ukukhetha ngokokuba ukhululeke njani',
      'Indlela yokutshintsha into oyisebenzisayo',
    ],
    body1: 'Kwixesha lakho lokuqala lenyanga, ipadi ngokuqhelekileyo yeyona ndlela ilula yokuzikhusela, kuba iya ngqo kwingubo yakho yangaphantsi. Ingubo yangaphantsi yexesha lenyanga neetamponi ziindlela ezinye onokuzizama kamva, nanini na xa uziva uthanda.',
    options: [
      {
        title: 'Iipadi',
        text: 'Zilula ukuzisebenzisa, ziya kwingubo yakho yangaphantsi kwaye zitshintshwa rhoqo.',
      },
      {
        title: 'Ingubo yangaphantsi yexesha lenyanga',
        text: 'Ingubo yangaphantsi encumayo, ewasheka, ekhululekileyo ekusebenziseni mihla le.',
      },
      {
        title: 'Iitamponi',
        text: 'ZiBekwa ngaphakathi emzimbeni; ukuba uzisebenzisa na kwaye nini kuxhomekeke kuwe, ngesantya sakho.',
      },
    ],
    body2: 'Akukho ndlela yokuzikhusela eyiyo okanye engeyiyo: nganye ifanelekile kwimizimba, kwizinto ezenziwa rhoqo, nakwiindlela zokukhululeka ezahlukeneyo. Iitamponi, umzekelo, ziBekwa ngaphakathi emzimbeni kwaye zifuna ukuwuqhelana ngakumbi umzimba wakho — akukho nto ithi kufuneka uzisebenzise ukususela kwixesha lakho lokuqala lenyanga.',
    tipTitle: 'Kulungile ukwazi',
    tipText: 'Ukuzama iindidi ezahlukeneyo zokuzikhusela ngokuhamba kwexesha kukunceda ufumane eyona ikulungeleyo, ngaphandle koxinzelelo.',
    body3: 'Ngokomndilili, into oyisebenzisayo kufuneka itshintshwe rhoqo emva kweeyure ezi-4 ukuya kwezi-6, rhoqo ngakumbi ngeentsuku zokopha kakhulu. Ukuyitshintsha rhoqo kukunceda uhlale ukhululekile kwaye ugcine inzulu yococeko lwengingqi yangasese.',
    relatedTitle: '♥  Unokuthanda nale',
    related: [
      {title: 'Ukuqonda ukopha kwexesha lakho lenyanga', meta: 'Imizuzu emi-7  ·  Isikhokelo'},
      {title: 'Ungawulawula njani umhla ngomhla ixesha lakho lokuqala lenyanga?', meta: 'Imizuzu emi-5  ·  Isikhokelo'},
      {title: 'Ixesha lakho lokuqala lenyanga: ukuba ulindele ntoni', meta: 'Imizuzu emi-5  ·  Isikhokelo'},
    ],
    shareMessage: 'Ndiyikhethe phi indlela yokuzikhusela exeshini lam lokuqala lenyanga? — AWA',
  },
  sn: {
    badge: 'KUENDA KUMWEDZI KWEKUTANGA',
    title: 'Ndinofanira kusarudza chii chekuzvidzivirira\nnekuenda kwangu kumwedzi kwekutanga?',
    metaDuration: 'Kuverenga kwemaminetsi 6',
    metaType: 'Gwaro',
    metaLevel: 'Anotanga',
    metaValidated: 'Zvakaongororwa',
    intro: 'Kune nzira dzakawanda dzekuzvidzivirira panguva yekuenda kumwedzi. Hapana yakanakisa kupfuura imwe — kunyaradzwa kwako ndiko kunotungamira sarudzo.',
    contentsTitle: 'Muchinyorwa chino',
    topics: [
      'Mhando dzakasiyana dzekuzvidzivirira',
      'Nzira yekusarudza zvichienderana nekunyaradzwa kwako',
      'Nzira yekushandura chaunoshandisa',
    ],
    body1: 'Pakuenda kwako kumwedzi kwekutanga, pad ndiyo inowanzova nzira iri nyore kushandisa, nokuti inoenda zvakananga muhembe yako yemukati. Hembe dzemukati dzekuenda kumwedzi ne tampon ndedzimwe nzira dzaungaedza gare gare, kana wanzwa kuda.',
    options: [
      {
        title: 'Pad',
        text: 'Dzinoshandiswa zviri nyore, dzinoiswa muhembe yemukati uye dzinoshandurwa nguva dzose.',
      },
      {
        title: 'Hembe dzemukati dzekuenda kumwedzi',
        text: 'Hembe dzemukati dzinotora ropa, dzinosukwa, dzinonyaradza pakushandiswa kwezuva nezuva.',
      },
      {
        title: 'Tampon',
        text: 'Dzinoiswa mukati memuviri; kuti uzvishandise here uye rinhi zvinoenderana newe, nekumhanya kwako.',
      },
    ],
    body2: 'Hapana chinodzivirira chakarurama kana chisina kururama: imwe neimwe inokodzera miviri, tsika uye mazinga ekunyaradzwa akasiyana. Tampon, somuenzaniso, dzinoiswa mukati memuviri uye dzinoda kuzivana zvishoma nemuviri — hapana chinoti unofanira kudzishandisa kubva pakuenda kwako kumwedzi kwekutanga.',
    tipTitle: 'Zvakanaka kuziva',
    tipText: 'Kuedza mhando dzakasiyana dzekuzvidzivirira nenguva kunokubatsira kuwana inokukodzera zvakanyanya, pasina kumanikidzwa.',
    body3: 'Pazvakajairika, chinodzivirira chinofanira kushandurwa mushure memaawa 4 kusvika ku 6 oga oga, kakawanda pamazuva ane ropa rakawanda. Kuchishandura nguva dzose kunokubatsira kunyaradzwa uye kuchengeta tsika dzakanaka dzekuchenjera hutsanana hwemuviri.',
    relatedTitle: '♥  Unogona kunakidzwawo nezvi',
    related: [
      {title: 'Kunzwisisa kuyerera kwako kwekuenda kumwedzi', meta: 'maminetsi 7  ·  Gwaro'},
      {title: 'Ungatarisira sei kuenda kwako kumwedzi kwekutanga zuva nezuva?', meta: 'maminetsi 5  ·  Gwaro'},
      {title: 'Kuenda kwako kumwedzi kwekutanga: zvekutarisira', meta: 'maminetsi 5  ·  Gwaro'},
    ],
    shareMessage: 'Ndinofanira kusarudza chii chekuzvidzivirira nekuenda kwangu kumwedzi kwekutanga? — AWA',
  },
  ln: {
    badge: 'SANZA YA LIBOSO',
    title: 'Nasengeli kopona ndenge nini ya kobatela\nmpo na sanza na ngai ya liboso?',
    metaDuration: 'Miniti 6 ya kotánga',
    metaType: 'Malako',
    metaLevel: 'Ya ebandeli',
    metaValidated: 'Makambo oyo etalelami',
    intro: 'Ezali na banzela mingi ya kobatela nzoto na yo na ntango ya sanza. Moko te eleki mosusu — kimia na yo ya nzoto nde ezali kokamba poni.',
    contentsTitle: 'Na lisolo oyo',
    topics: [
      'Ndenge ndenge ya kobatela',
      'Ndenge ya kopona engebene na kimia na yo',
      'Ndenge ya kobongola eloko ya kobatela',
    ],
    body1: 'Mpo na sanza na yo ya liboso, pad ezali mbala mingi eloko ya pɛtɛɛ koleka mpo na kosalela, pamba te etɛlɛmaka na kati ya bilamba na yo. Bilamba ya sanza mpe ba tampon ezali banzela mosusu okoki komeka sima, ntango olingi.',
    options: [
      {
        title: 'Ba pad',
        text: 'Pɛtɛɛ mpo na kosalela, etɛlɛmaka na kati ya bilamba na yo mpe ebongolami mbala na mbala.',
      },
      {
        title: 'Bilamba ya sanza',
        text: 'Bilamba oyo ezwaka mpe esukolami, ezali na kimia mpo na mokolo na mokolo.',
      },
      {
        title: 'Ba tampon',
        text: 'Etyami na kati ya nzoto; kosalela yango to te mpe ntango nini, ezali na yo, na lombangu na yo moko.',
      },
    ],
    body2: 'Eloko ya malamu to ya mabe ezali te: moko na moko ebongi na nzoto, bizalela mpe kimia ekeseni. Ba tampon, na ndakisa, etyami na kati ya nzoto mpe esengi koyeba nzoto na yo mingi — eloko moko te eloba ete osengeli kosalela yango uta sanza na yo ya liboso.',
    tipTitle: 'Eloko ya koyeba',
    tipText: 'Komeka ndenge ndenge ya kobatela na ntango esalisaka yo kozwa oyo ebongi na yo koleka, na bopusi moko te.',
    body3: 'Na kati-kati, esengeli kobongola eloko ya kobatela na ngonga 4 tii 6 nyonso, mbala mingi koleka na mikolo oyo makila ezali mingi. Kobongola yango mbala na mbala esalisi yo kozala na kimia mpe kobatela bopɛtɛ ya nzoto.',
    relatedTitle: '♥  Okoki mpe kolinga',
    related: [
      {title: 'Kososola makila ya sanza na yo', meta: 'Miniti 7  ·  Malako'},
      {title: 'Ndenge nini ya kokamba sanza na yo ya liboso mokolo na mokolo?', meta: 'Miniti 5  ·  Malako'},
      {title: 'Sanza na yo ya liboso: ntina nini ya kolikya', meta: 'Miniti 5  ·  Malako'},
    ],
    shareMessage: 'Nasengeli kopona ndenge nini ya kobatela mpo na sanza na ngai ya liboso? — AWA',
  },
  ff: {
    badge: 'LEWRU artungo',
    title: 'Ɗume mi suɓata ngam\nlewru am artungo?',
    metaDuration: 'Janngugol minti 6',
    metaType: 'Jannginoore',
    metaLevel: 'Fuɗɗoode',
    metaValidated: 'Ko ndaaraa',
    intro: 'Woodi feere ɗuuɗɗe ngam hisnude ɓanndu maaɗa nder lewru. Walaa feere ɓuri feere: ko ɗum wooɗan ma ɗum suɓata.',
    contentsTitle: 'Nder ɗuuɗal ndeen',
    topics: [
      'Feere hisnude ɗe woodi',
      'No suɓirta bana ko ɗum wooɗan ma',
      'No waylirta hisnude maaɗa',
    ],
    body1: 'Ngam lewru artungo, pad ko ɓuri sella huutinaade, ngam ɗum yaha haa nder kaddu maaɗa. Kaddu lewru e tampon ko feere goɗɗe ma waaɗata nyannde ko ndaa yiɗi.',
    options: [
      {
        title: 'Pad',
        text: 'Ɗum sella huutinaade, ɗum jooɗoo nder kaddu e ɗum waylittee wakkati.',
      },
      {
        title: 'Kaddu lewru',
        text: 'Kaddu ɗum ndiyam ɗum ɓuuɓa e ɗum lootetee, ɗum wooɗa ngam huutinaade fu nyannde.',
      },
      {
        title: 'Tampon',
        text: 'Ɗum naatnaa nder ɓanndu; to ɗum huutinete e saa\'i ko ɗum huutinete ko maaɗa, e ko ɗum yaha ko foti.',
      },
    ],
    body2: 'Walaa hisnude moyyere malla bonnere: kala feere ɗum wooɗi e ɓanndu feere, e ɗum yeeso, e ko ɗum wooɗan. Tampon, ko ɗum naatnaa nder ɓanndu, ɗum yiɗi anndude ɓanndu maaɗa seɗɗa ɓuri — walaa ko wi\'i a hokka ɗum ko lewru maaɗa artungo.',
    tipTitle: 'Ɗum ɓuri nafugo anndude',
    tipText: 'Ndaaru feere hisnude ɗuuɗɗe ko ɗum woni wakkati, ɗum wallay ma tawde ko ɗum wooɗi ma ɓuri, bannda ɓesngu.',
    body3: 'Ko ɗum yaha, hisnude maaɗa haani waylude ko ɗum woni hakkunde nga\'u 4 haa 6, e ɓuri ɗuuɗugo nyalaaje ko ndiyam ɗam ɗuuɗi. Waylugo ɗum wakkati ɗum wallay ma wondude e ɗum ɓanndu maaɗa nder kaddu.',
    relatedTitle: '♥  Ɗum ko jooɗi kadi ɗum yiɗa',
    related: [
      {title: 'Faamugo ndiyam lewru maaɗa', meta: 'Minti 7  ·  Jannginoore'},
      {title: 'No ɗum yaha lewru maaɗa artungo nyannde nyannde?', meta: 'Minti 5  ·  Jannginoore'},
      {title: 'Lewru maaɗa artungo: ko haani yiɗde', meta: 'Minti 5  ·  Jannginoore'},
    ],
    shareMessage: 'Ɗume mi suɓata ngam lewru am artungo? — AWA',
  },
  id: {
    badge: 'HAID PERTAMA',
    title: 'Pelindung apa yang sebaiknya kupilih\nuntuk haid pertama?',
    metaDuration: '6 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Ada beberapa cara untuk melindungi diri saat haid. Tidak ada yang lebih baik dari yang lain — kenyamanan pribadilah yang menuntun pilihanmu.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Berbagai jenis pelindung',
      'Cara memilih sesuai kenyamananmu',
      'Cara mengganti pelindungmu',
    ],
    body1: 'Untuk haid pertama, pembalut biasanya pelindung yang paling mudah digunakan karena langsung dipasang di celana dalam. Celana dalam haid dan tampon adalah pilihan lain yang bisa kamu coba nanti, kapan pun kamu merasa ingin.',
    options: [
      {
        title: 'Pembalut',
        text: 'Mudah digunakan, dipasang di celana dalam dan diganti secara teratur.',
      },
      {
        title: 'Celana dalam haid',
        text: 'Celana dalam yang menyerap dan bisa dicuci, nyaman untuk dipakai sehari-hari.',
      },
      {
        title: 'Tampon',
        text: 'Dimasukkan ke dalam tubuh; apakah dan kapan menggunakannya adalah pilihanmu, sesuai kecepatanmu sendiri.',
      },
    ],
    body2: 'Tidak ada pelindung yang benar atau salah: masing-masing cocok untuk tubuh, kebiasaan, dan tingkat kenyamanan yang berbeda. Tampon, misalnya, dimasukkan ke dalam tubuh dan membutuhkan sedikit lebih banyak keakraban dengan tubuhmu — tidak ada yang mengharuskanmu memakainya sejak haid pertama.',
    tipTitle: 'Perlu diketahui',
    tipText: 'Mencoba berbagai jenis pelindung seiring waktu membantumu menemukan yang paling cocok untukmu, tanpa tekanan.',
    body3: 'Rata-rata, pelindung perlu diganti setiap 4 sampai 6 jam, lebih sering pada hari-hari dengan aliran darah yang lebih deras. Menggantinya secara teratur membantumu tetap nyaman dan menjaga kebersihan area kewanitaan dengan baik.',
    relatedTitle: '♥  Kamu mungkin juga suka',
    related: [
      {
        title: 'Memahami aliran darah haidmu',
        meta: '7 mnt  ·  Panduan',
      },
      {
        title: 'Bagaimana menjalani haid pertamamu sehari-hari?',
        meta: '5 mnt  ·  Panduan',
      },
      {
        title: 'Haid pertamamu: apa yang bisa diharapkan',
        meta: '5 mnt  ·  Panduan',
      },
    ],
    shareMessage: 'Pelindung apa yang sebaiknya kupilih untuk haid pertama? — AWA',
  },
  hi: {
    badge: 'पहला पीरियड',
    title: 'पहले पीरियड के लिए\nकौन-सा प्रोटेक्शन चुनूँ?',
    metaDuration: '6 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'जाँची गई जानकारी',
    intro: 'पीरियड के दौरान खुद को सुरक्षित रखने के कई तरीके हैं। कोई भी तरीका दूसरे से बेहतर नहीं है — चुनाव आपके आराम पर निर्भर करता है।',
    contentsTitle: 'इस लेख में',
    topics: [
      'प्रोटेक्शन के अलग-अलग प्रकार',
      'अपने आराम के हिसाब से कैसे चुनें',
      'प्रोटेक्शन कैसे बदलें',
    ],
    body1: 'पहले पीरियड के लिए पैड आमतौर पर सबसे आसान विकल्प होता है, क्योंकि वह सीधे अंडरवियर में लगाया जाता है। पीरियड अंडरवियर और टैम्पोन दूसरे विकल्प हैं, जिन्हें आप बाद में, जब मन करे, आज़मा सकती हैं।',
    options: [
      {
        title: 'पैड',
        text: 'इस्तेमाल में आसान। ये अंडरवियर में लगते हैं और नियमित रूप से बदले जाते हैं।',
      },
      {
        title: 'पीरियड अंडरवियर',
        text: 'सोखने वाला, धोकर दोबारा पहनने लायक अंडरवियर, जो रोज़ के इस्तेमाल के लिए आरामदायक है।',
      },
      {
        title: 'टैम्पोन',
        text: 'शरीर के अंदर लगाए जाते हैं; इन्हें इस्तेमाल करना है या नहीं और कब करना है, यह आप अपनी रफ़्तार से तय करें।',
      },
    ],
    body2: 'कोई प्रोटेक्शन सही या गलत नहीं होता: हर एक अलग शरीर, आदतों और आराम के स्तर के लिए ठीक बैठता है। जैसे, टैम्पोन शरीर के अंदर लगाए जाते हैं और इसके लिए अपने शरीर से थोड़ी ज़्यादा जान-पहचान चाहिए — ऐसा कहीं नहीं लिखा कि इन्हें पहले ही पीरियड से इस्तेमाल करना ज़रूरी है।',
    tipTitle: 'जानना अच्छा रहेगा',
    tipText: 'समय के साथ अलग-अलग प्रकार के प्रोटेक्शन आज़माने से आपको वह मिल जाता है जो आपके लिए सबसे अच्छा हो, और इसमें कोई दबाव नहीं है।',
    body3: 'औसतन प्रोटेक्शन हर 4 से 6 घंटे में बदलना चाहिए, और ज़्यादा फ़्लो वाले दिनों में और जल्दी-जल्दी। नियमित रूप से बदलने से आप आरामदायक रहती हैं और निजी स्वच्छता बनी रहती है।',
    relatedTitle: '♥  ये भी आपको पसंद आ सकता है',
    related: [
      {
        title: 'अपने माहवारी के फ़्लो को समझें',
        meta: '7 मिनट  ·  गाइड',
      },
      {
        title: 'पहले पीरियड को रोज़मर्रा की ज़िंदगी में कैसे संभालें?',
        meta: '5 मिनट  ·  गाइड',
      },
      {
        title: 'आपका पहला पीरियड: क्या उम्मीद रखें',
        meta: '5 मिनट  ·  गाइड',
      },
    ],
    shareMessage: 'पहले पीरियड के लिए कौन-सा प्रोटेक्शन चुनूँ? — AWA',
  },
  sq: {
    badge: 'MENSTRUACIONI I PARË',
    title: 'Cilën mbrojtje duhet të zgjedh\npër menstruacionin tim të parë?',
    metaDuration: '6 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Ka disa mënyra për t’u mbrojtur gjatë menstruacioneve. Asnjëra nuk është më e mirë se tjetra — rehatia personale është ajo që drejton zgjedhjen.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Llojet e ndryshme të mbrojtjes',
      'Si të zgjedhësh sipas rehatisë sate',
      'Si ta ndërrosh mbrojtjen',
    ],
    body1: 'Për menstruacionin e parë, një peshqir higjienik është zakonisht mbrojtja më e thjeshtë për t’u përdorur, pasi vendoset drejtpërdrejt në të brendshmet. Të brendshmet për menstruacione dhe tamponët janë opsione të tjera që mund t’i provosh më vonë, kur të ndihesh gati.',
    options: [
      {
        title: 'Peshqirët higjienikë',
        text: 'Të lehtë për t’u përdorur, vendosen në të brendshme dhe ndërrohen rregullisht.',
      },
      {
        title: 'Të brendshmet për menstruacione',
        text: 'Të brendshme thithëse e të larshme, të rehatshme për përdorim të përditshëm.',
      },
      {
        title: 'Tamponët',
        text: 'Vendosen brenda trupit; nëse dhe kur do t’i përdorësh, varet nga ti, në ritmin tënd.',
      },
    ],
    body2: 'Nuk ka mbrojtje të drejtë apo të gabuar: secila i përshtatet trupave, zakoneve dhe niveleve të ndryshme të rehatisë. Tamponët, për shembull, vendosen brenda trupit dhe kërkojnë pak më shumë njohje me të — asgjë nuk thotë se duhet t’i përdorësh që nga menstruacioni i parë.',
    tipTitle: 'Mirë është ta dish',
    tipText: 'Të provosh lloje të ndryshme mbrojtjeje me kalimin e kohës të ndihmon të gjesh atë që të përshtatet më mirë, pa presion.',
    body3: 'Mesatarisht, mbrojtja duhet ndërruar çdo 4 deri në 6 orë, më shpesh në ditët me rrjedhje më të bollshme. Ndërrimi i rregullt të ndihmon të ndihesh rehat dhe të ruash higjienën e mirë intime.',
    relatedTitle: '♥  Mund të të pëlqejnë edhe',
    related: [
      {
        title: 'Kuptimi i rrjedhjes sate menstruale',
        meta: '7 min  ·  Udhëzues',
      },
      {
        title: 'Si ta menaxhosh menstruacionin e parë çdo ditë?',
        meta: '5 min  ·  Udhëzues',
      },
      {
        title: 'Menstruacioni yt i parë: çfarë të presësh',
        meta: '5 min  ·  Udhëzues',
      },
    ],
    shareMessage: 'Cilën mbrojtje duhet të zgjedh për menstruacionin tim të parë? — AWA',
  },
  ja: {
    badge: '初経',
    title: '初めての生理には\nどんな生理用品を選べばいい？',
    metaDuration: '読了6分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '監修済みの内容',
    intro: '生理中の対策にはいくつかの方法があります。どれが優れているということはなく、自分が心地よいと感じるものを基準に選びます。',
    contentsTitle: 'この記事の内容',
    topics: [
      '生理用品の種類',
      '心地よさに合わせた選び方',
      '交換のしかた',
    ],
    body1: '初めての生理には、下着に直接つけるナプキンがいちばん使いやすいことが多いです。吸水ショーツやタンポンは、使ってみたくなったときに、あとから試せる選択肢です。',
    options: [
      {
        title: 'ナプキン',
        text: '使いやすく、下着につけて、こまめに交換します。',
      },
      {
        title: '吸水ショーツ',
        text: '吸水性があり、洗って繰り返し使える下着で、毎日でも心地よく使えます。',
      },
      {
        title: 'タンポン',
        text: '体の中に挿入するタイプです。使うかどうか、いつ使うかは、自分のペースで決めて大丈夫です。',
      },
    ],
    body2: '正解や不正解はありません。体や習慣、心地よさは人それぞれで、合う生理用品も違います。たとえばタンポンは体の中に挿入するため、自分の体にもう少し慣れている必要があります。初めての生理から使わなければならないということはありません。',
    tipTitle: '知っておきたいこと',
    tipText: '時間をかけていろいろな種類を試すことで、自分に合ったものが見つかります。無理をする必要はありません。',
    body3: '生理用品は、平均して4〜6時間ごとに交換します。経血量が多い日は、もっとこまめに交換しましょう。定期的に交換すると、快適に過ごせて、デリケートゾーンを清潔に保てます。',
    relatedTitle: '♥  こちらもおすすめ',
    related: [
      {
        title: '経血量について知ろう',
        meta: '7分  ·  ガイド',
      },
      {
        title: '初めての生理を毎日の生活でどう過ごす？',
        meta: '5分  ·  ガイド',
      },
      {
        title: '初めての生理：知っておきたいこと',
        meta: '5分  ·  ガイド',
      },
    ],
    shareMessage: '初めての生理にはどんな生理用品を選べばいい？ — AWA',
  },
  ko: {
    badge: '첫 생리',
    title: '첫 생리에는 어떤 생리용품을\n골라야 할까요?',
    metaDuration: '6분 읽기',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '생리 중에 몸을 보호하는 방법은 여러 가지예요. 어느 것이 더 낫다고 할 수는 없고, 개인의 편안함이 선택의 기준이 돼요.',
    contentsTitle: '이 아티클에서는',
    topics: [
      '생리용품의 종류',
      '편안함에 따라 고르는 방법',
      '생리용품을 교체하는 방법',
    ],
    body1: '첫 생리에는 속옷에 바로 붙이는 생리대가 보통 가장 쓰기 쉬워요. 생리 팬티와 탐폰은 마음이 내킬 때 나중에 써 볼 수 있는 다른 선택지예요.',
    options: [
      {
        title: '생리대',
        text: '쓰기 쉬워요. 속옷에 붙여서 사용하고 정기적으로 갈아 줘요.',
      },
      {
        title: '생리 팬티',
        text: '흡수력이 있고 세탁해서 다시 입을 수 있어서 평소에도 편하게 입기 좋은 속옷이에요.',
      },
      {
        title: '탐폰',
        text: '몸 안에 넣어서 사용해요. 사용할지, 언제 사용할지는 자신의 속도에 맞춰 직접 정하면 돼요.',
      },
    ],
    body2: '정답이나 오답인 생리용품은 없어요. 몸, 생활 습관, 편안함의 기준에 따라 맞는 것이 모두 달라요. 예를 들어 탐폰은 몸 안에 넣는 방식이라 내 몸에 조금 더 익숙해져야 해요. 첫 생리부터 꼭 써야 하는 것은 아니에요.',
    tipTitle: '알아 두면 좋아요',
    tipText: '시간을 두고 여러 종류를 써 보면 나에게 가장 잘 맞는 것을 찾을 수 있어요. 부담 가질 필요 없어요.',
    body3: '평균적으로 생리용품은 4~6시간마다 갈아야 해요. 출혈량이 많은 날에는 더 자주 갈아 주세요. 정기적으로 갈아 주면 편안하게 지내고 질 주변 위생을 잘 지키는 데 도움이 돼요.',
    relatedTitle: '♥  함께 보면 좋은 글',
    related: [
      {
        title: '생리 출혈량 이해하기',
        meta: '7분  ·  가이드',
      },
      {
        title: '첫 생리를 일상에서 어떻게 관리할까요?',
        meta: '5분  ·  가이드',
      },
      {
        title: '첫 생리, 무엇을 기대해야 할까요',
        meta: '5분  ·  가이드',
      },
    ],
    shareMessage: '첫 생리에는 어떤 생리용품을 골라야 할까요? — AWA',
  },
  'pt-PT': {
    badge: 'PRIMEIRO PERÍODO',
    title: 'Que proteção devo escolher\npara o meu primeiro período?',
    metaDuration: '6 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Existem várias formas de se proteger durante o período. Nenhuma é melhor do que outra — o conforto pessoal é o que orienta a escolha.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Os diferentes tipos de proteção',
      'Como escolher consoante o seu conforto',
      'Como mudar a proteção',
    ],
    body1: 'Para o primeiro período, o penso higiénico é geralmente a proteção mais simples de usar, pois fica diretamente na roupa interior. A roupa interior menstrual e os tampões são outras opções que pode experimentar mais tarde, quando lhe apetecer.',
    options: [
      {
        title: 'Pensos higiénicos',
        text: 'Fáceis de usar, ficam na roupa interior e mudam-se com regularidade.',
      },
      {
        title: 'Roupa interior menstrual',
        text: 'Roupa interior lavável, com poder de absorção, confortável para o uso diário.',
      },
      {
        title: 'Tampões',
        text: 'Inserem-se dentro do corpo; usá-los ou não, e quando, é uma decisão sua, ao seu ritmo.',
      },
    ],
    body2: 'Não há proteção certa ou errada: cada uma convém a corpos, hábitos e níveis de conforto diferentes. Os tampões, por exemplo, inserem-se dentro do corpo e exigem um pouco mais de familiaridade com ele — nada diz que tem de os usar logo no primeiro período.',
    tipTitle: 'Bom saber',
    tipText: 'Experimentar diferentes tipos de proteção ao longo do tempo ajuda a encontrar a que melhor lhe convém, sem pressão.',
    body3: 'Em média, a proteção deve ser mudada a cada 4 a 6 horas, com maior frequência nos dias de fluxo mais abundante. Mudá-la com regularidade ajuda a manter-se confortável e a ter uma boa higiene íntima.',
    relatedTitle: '♥  Também pode gostar',
    related: [
      {
        title: 'Compreender o seu fluxo menstrual',
        meta: '7 min  ·  Guia',
      },
      {
        title: 'Como gerir o primeiro período no dia a dia?',
        meta: '5 min  ·  Guia',
      },
      {
        title: 'O seu primeiro período: o que esperar',
        meta: '5 min  ·  Guia',
      },
    ],
    shareMessage: 'Que proteção devo escolher para o meu primeiro período? — AWA',
  },
  bn: {
    badge: 'প্রথম মাসিক',
    title: 'প্রথম মাসিকের জন্য\nকোন সুরক্ষা সামগ্রী বেছে নেব?',
    metaDuration: 'পড়তে 6 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'মাসিকের সময় নিজেকে সুরক্ষিত রাখার একাধিক উপায় আছে। কোনোটিই অন্যটির চেয়ে ভালো নয়: আপনার নিজের স্বাচ্ছন্দ্যই পছন্দ ঠিক করে দেয়।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'সুরক্ষা সামগ্রীর বিভিন্ন ধরন',
      'স্বাচ্ছন্দ্য অনুযায়ী কীভাবে বেছে নেবেন',
      'সুরক্ষা সামগ্রী কীভাবে বদলাবেন',
    ],
    body1: 'প্রথম মাসিকের জন্য সাধারণত প্যাড ব্যবহার করাই সবচেয়ে সহজ, কারণ এটি সরাসরি অন্তর্বাসে লাগানো যায়। পিরিয়ড আন্ডারওয়্যার ও ট্যাম্পন অন্য দুটি বিকল্প, যা পরে ইচ্ছা হলে চেষ্টা করে দেখতে পারেন।',
    options: [
      {
        title: 'প্যাড',
        text: 'ব্যবহার করা সহজ; অন্তর্বাসে লাগাতে হয় এবং নিয়মিত বদলাতে হয়।',
      },
      {
        title: 'পিরিয়ড আন্ডারওয়্যার',
        text: 'শোষণক্ষম, ধোয়া যায় এমন অন্তর্বাস, যা প্রতিদিনের ব্যবহারে আরামদায়ক।',
      },
      {
        title: 'ট্যাম্পন',
        text: 'শরীরের ভেতরে প্রবেশ করাতে হয়; ব্যবহার করবেন কি না এবং কবে করবেন, তা আপনার নিজের গতিতে আপনিই ঠিক করবেন।',
      },
    ],
    body2: 'সুরক্ষা সামগ্রীর কোনো সঠিক বা ভুল পছন্দ নেই: প্রতিটি ধরন ভিন্ন শরীর, অভ্যাস ও স্বাচ্ছন্দ্যের সঙ্গে মানানসই। যেমন, ট্যাম্পন শরীরের ভেতরে প্রবেশ করাতে হয়, তাই নিজের শরীর সম্পর্কে আরেকটু পরিচিতি দরকার হয়: প্রথম মাসিক থেকেই এটি ব্যবহার করতে হবে, এমন কোনো কথা নেই।',
    tipTitle: 'জেনে রাখা ভালো',
    tipText: 'সময়ের সঙ্গে বিভিন্ন ধরনের সুরক্ষা সামগ্রী চেষ্টা করলে আপনার জন্য সবচেয়ে উপযুক্তটি খুঁজে পাওয়া যায়, কোনো চাপ ছাড়াই।',
    body3: 'গড়ে প্রতি 4 থেকে 6 ঘণ্টায় সুরক্ষা সামগ্রী বদলানো উচিত; রক্তক্ষরণ বেশি হলে আরও ঘন ঘন বদলাতে হবে। নিয়মিত বদলালে আপনি স্বাচ্ছন্দ্যে থাকবেন এবং ব্যক্তিগত পরিচ্ছন্নতাও বজায় থাকবে।',
    relatedTitle: '♥  আপনার আরও ভালো লাগতে পারে',
    related: [
      {
        title: 'আপনার মাসিকের রক্তক্ষরণ বোঝা',
        meta: '7 মিনিট  ·  গাইড',
      },
      {
        title: 'প্রথম মাসিক প্রতিদিনের জীবনে কীভাবে সামলাবেন?',
        meta: '5 মিনিট  ·  গাইড',
      },
      {
        title: 'আপনার প্রথম মাসিক: কী আশা করবেন',
        meta: '5 মিনিট  ·  গাইড',
      },
    ],
    shareMessage: 'প্রথম মাসিকের জন্য কোন সুরক্ষা সামগ্রী বেছে নেব? — AWA',
  },
  da: {
    badge: 'FØRSTE MENSTRUATION',
    title: 'Hvilken beskyttelse skal jeg\nvælge til min første menstruation?',
    metaDuration: '6 min læsning',
    metaType: 'Guide',
    metaLevel: 'Grundlæggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Der er flere måder at beskytte sig på under menstruationen. Ingen er bedre end andre: din egen komfort er det, der afgør valget.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Forskellige typer beskyttelse',
      'Sådan vælger du efter komfort',
      'Sådan skifter du beskyttelse',
    ],
    body1: 'Et bind er generelt det nemmeste til den første menstruation, fordi det sidder direkte i undertøjet. Menstruationsundertøj og tamponer er to andre muligheder, som du kan prøve senere, hvis du ønsker det.',
    options: [
      {
        title: 'Bind',
        text: 'Nemt at bruge; sidder i undertøjet og skal skiftes regelmæssigt.',
      },
      {
        title: 'Menstruationsundertøj',
        text: 'Absorberende, vaskbart undertøj, der er behageligt til daglig brug.',
      },
      {
        title: 'Tampon',
        text: 'Indsættes indeni kroppen; det er dit eget valg, om og hvornår du vil prøve det.',
      },
    ],
    body2: 'Der er intet rigtigt eller forkert valg af beskyttelse: hver type passer til forskellige kroppe, vaner og komfortniveauer. En tampon indsættes for eksempel indeni kroppen, så den kræver lidt mere fortrolighed med din krop: der er ingen grund til at bruge den fra din allerførste menstruation.',
    tipTitle: 'Godt at vide',
    tipText: 'At prøve forskellige typer beskyttelse over tid hjælper dig med at finde den, der passer bedst til dig, uden pres.',
    body3: 'Generelt bør du skifte beskyttelse hvert 4. til 6. time; hyppigere ved kraftig blødning. Regelmæssig skift holder dig komfortabel og opretholder personlig hygiejne.',
    relatedTitle: '♥  Du vil måske også synes om',
    related: [
      {
        title: 'At forstå din menstruationsblødning',
        meta: '7 min  ·  Guide',
      },
      {
        title: 'Hvad gør du med din første menstruation i hverdagen?',
        meta: '5 min  ·  Guide',
      },
      {
        title: 'Din første menstruation: hvad du kan forvente',
        meta: '5 min  ·  Guide',
      },
    ],
    shareMessage: 'Hvilken beskyttelse skal jeg vælge til min første menstruation? — AWA',
  },
  sv: {
    badge: 'FÖRSTE MENSTRUATION',
    title: 'Hvilken beskyttelse skal jeg\nvälge till min förste menstruation?',
    metaDuration: '6 min läsning',
    metaType: 'Guide',
    metaLevel: 'Grundläggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Der ar flere måder at beskytte sig på under menstruationen. Ingen ar bedre end andre: din egen komfort ar det, der afgör valget.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Forskellige typer beskyttelse',
      'Sådan välger du efter komfort',
      'Sådan skifter du beskyttelse',
    ],
    body1: 'Et bind ar generelt det nemmeste till den förste menstruation, fordi det sidder direkte i undertöjet. Menstruationsundertöj och tamponer ar to andre muligheder, som du kan pröve senere, hvis du önsker det.',
    options: [
      {
        title: 'Bind',
        text: 'Nemt at bruge; sidder i undertöjet och skal skiftes regelmässigt.',
      },
      {
        title: 'Menstruationsundertöj',
        text: 'Absorberende, vaskbart undertöj, der ar behageligt till daglig brug.',
      },
      {
        title: 'Tampon',
        text: 'Indsättes indeni kroppen; det ar ditt eget valg, om och hvornår du vil pröve det.',
      },
    ],
    body2: 'Der ar intet rigtigt eller forkert valg av beskyttelse: hver type passer till forskellige kroppe, vaner och komfortniveauer. En tampon indsättes for eksempel indeni kroppen, så den kräver lite mere fortrolighed med din krop: der ar ingen grund till at bruge den fran din allerförste menstruation.',
    tipTitle: 'Godt at vide',
    tipText: 'At pröve forskellige typer beskyttelse over tid hjälper dig med at finde den, der passer bedst till dig, uden pres.',
    body3: 'Generelt bör du skifte beskyttelse hvert 4. till 6. time; hyppigere ved kraftig blödning. Regelmässig skift holder dig komfortabel och opretholder personlig hygiejne.',
    relatedTitle: '♥  Du vil måske også synes om',
    related: [
      {
        title: 'At forstå din menstruationsblödning',
        meta: '7 min  ·  Guide',
      },
      {
        title: 'Hvad gör du med din förste menstruation i hverdagen?',
        meta: '5 min  ·  Guide',
      },
      {
        title: 'Din förste menstruation: hvad du kan forvente',
        meta: '5 min  ·  Guide',
      },
    ],
    shareMessage: 'Hvilken beskyttelse skal jag välge till min förste menstruation? — AWA',
  },
  nb: {
    badge: 'FØRSTE MENS',
    title: 'Hvilken beskyttelse bør jeg velge\ntil den første mensen?',
    metaDuration: '6 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Det finnes flere måter å beskytte seg på under mensen. Ingen er bedre enn en annen – personlig komfort avgjør valget.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'De ulike typene beskyttelse',
      'Hvordan du velger ut fra komfort',
      'Hvordan du bytter beskyttelse',
    ],
    body1: 'Til den første mensen er et bind vanligvis den enkleste beskyttelsen å bruke, siden det legges direkte i trusen. Menstrusundertøy og tamponger er andre alternativer du kan prøve senere, når du har lyst.',
    options: [
      {
        title: 'Bind',
        text: 'Enkle å bruke, de legges i trusen og byttes jevnlig.',
      },
      {
        title: 'Menstrusundertøy',
        text: 'Absorberende, vaskbart undertøy som er behagelig til daglig bruk.',
      },
      {
        title: 'Tamponger',
        text: 'Settes inn i kroppen; om og når du vil bruke dem, bestemmer du selv, i ditt eget tempo.',
      },
    ],
    body2: 'Det finnes ingen riktig eller gal beskyttelse: hver enkelt passer ulike kropper, vaner og komfortnivåer. Tamponger settes for eksempel inn i kroppen og krever litt mer kjennskap til den – ingenting sier at du må bruke dem fra den aller første mensen.',
    tipTitle: 'Godt å vite',
    tipText: 'Å prøve ulike typer beskyttelse over tid hjelper deg å finne den som passer deg best, uten press.',
    body3: 'I gjennomsnitt bør beskyttelsen byttes hver 4. til 6. time, oftere på dager med kraftigere blødning. Å bytte jevnlig hjelper deg å føle deg komfortabel og holde god intim hygiene.',
    relatedTitle: '♥  Dette liker du kanskje også',
    related: [
      {title: 'Forstå menstruasjonsblødningen din', meta: '7 min  ·  Veiledning'},
      {title: 'Hvordan håndterer du den første mensen i hverdagen?', meta: '5 min  ·  Veiledning'},
      {title: 'Din første mens: hva du kan forvente', meta: '5 min  ·  Veiledning'},
    ],
    shareMessage: 'Hvilken beskyttelse bør jeg velge til den første mensen? – AWA',
  },
  pl: {
    badge: 'PIERWSZA MIESIĄCZKA',
    title: 'Jaki środek ochrony wybrać\nna pierwszą miesiączkę?',
    metaDuration: '6 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Podczas miesiączki można chronić się na kilka sposobów. Żaden nie jest lepszy od innego — wyboru dokonuje osobisty komfort.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Rodzaje środków ochrony',
      'Jak wybrać zgodnie z własnym komfortem',
      'Jak zmieniać środek ochrony',
    ],
    body1: 'Na pierwszą miesiączkę podpaska jest zwykle najprostszym środkiem ochrony, ponieważ wkłada się ją wprost na bieliznę. Majtki menstruacyjne i tampony to inne opcje, które możesz wypróbować później, kiedy tylko będziesz mieć ochotę.',
    options: [
      {
        title: 'Podpaski',
        text: 'Łatwe w użyciu, przykleja się je do bielizny i regularnie zmienia.',
      },
      {
        title: 'Majtki menstruacyjne',
        text: 'Chłonna, nadająca się do prania bielizna, wygodna na co dzień.',
      },
      {
        title: 'Tampony',
        text: 'Wprowadzane do wnętrza ciała; to, czy i kiedy ich użyć, zależy od Ciebie, we własnym tempie.',
      },
    ],
    body2: 'Nie ma lepszego ani gorszego środka ochrony: każdy pasuje do innych ciał, nawyków i poziomów komfortu. Tampony na przykład wprowadza się do wnętrza ciała i wymagają nieco większej znajomości własnego ciała — nic nie mówi, że musisz ich używać już od pierwszej miesiączki.',
    tipTitle: 'Warto wiedzieć',
    tipText: 'Wypróbowywanie z czasem różnych środków ochrony pomaga znaleźć ten, który pasuje Ci najbardziej, bez presji.',
    body3: 'Średnio środek ochrony należy zmieniać co 4 do 6 godzin, częściej w dni z obfitszym krwawieniem. Regularna zmiana pomaga czuć się komfortowo i dbać o dobrą higienę intymną.',
    relatedTitle: '♥  Może Cię też zainteresować',
    related: [
      {title: 'Zrozumieć swoje krwawienie miesiączkowe', meta: '7 min  ·  Poradnik'},
      {title: 'Jak radzić sobie z pierwszą miesiączką na co dzień?', meta: '5 min  ·  Poradnik'},
      {title: 'Twoja pierwsza miesiączka: czego się spodziewać', meta: '5 min  ·  Poradnik'},
    ],
    shareMessage: 'Jaki środek ochrony wybrać na pierwszą miesiączkę? — AWA',
  },
  uk: {
    badge: 'ПЕРША МЕНСТРУАЦІЯ',
    title: 'Який засіб гігієни обрати\nдля першої менструації?',
    metaDuration: '6 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Під час менструації є кілька способів захисту. Жоден не кращий за інший — вибір визначає особистий комфорт.',
    contentsTitle: 'У цій статті',
    topics: [
      'Різні види засобів гігієни',
      'Як обрати відповідно до власного комфорту',
      'Як змінювати засіб гігієни',
    ],
    body1: 'Для першої менструації прокладка зазвичай найпростіший засіб, адже її просто кладуть на білизну. Менструальна білизна й тампони — інші варіанти, які можна спробувати пізніше, коли захочеться.',
    options: [
      {
        title: 'Прокладки',
        text: 'Прості у використанні, кладуться на білизну й регулярно змінюються.',
      },
      {
        title: 'Менструальна білизна',
        text: 'Вбираюча, придатна для прання білизна, зручна на щодень.',
      },
      {
        title: 'Тампони',
        text: 'Вводяться в тіло; чи користуватися ними і коли — вирішуєте ви, у власному темпі.',
      },
    ],
    body2: 'Немає правильного чи неправильного засобу: кожен підходить різним тілам, звичкам і рівням комфорту. Тампони, наприклад, вводяться в тіло й потребують трохи більшого знайомства з ним — ніщо не каже, що ви мусите користуватися ними з першої ж менструації.',
    tipTitle: 'Варто знати',
    tipText: 'Пробуючи з часом різні засоби гігієни, ви знайдете той, що підходить вам найкраще, — без тиску.',
    body3: 'У середньому засіб гігієни слід змінювати кожні 4–6 годин, частіше — у дні з рясними виділеннями. Регулярна зміна допомагає почуватися комфортно й підтримувати гарну інтимну гігієну.',
    relatedTitle: '♥  Вас також може зацікавити',
    related: [
      {title: 'Розуміння ваших менструальних виділень', meta: '7 хв  ·  Посібник'},
      {title: 'Як упоратися з першою менструацією щодня?', meta: '5 хв  ·  Посібник'},
      {title: 'Ваша перша менструація: чого очікувати', meta: '5 хв  ·  Посібник'},
    ],
    shareMessage: 'Який засіб гігієни обрати для першої менструації? — AWA',
  },
  cs: {
    badge: 'PRVNÍ MENSTRUACE',
    title: 'Jakou ochranu zvolit\npři první menstruaci?',
    metaDuration: '6 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Existuje několik způsobů, jak se během menstruace chránit. Žádný není lepší než jiný — volbu řídí osobní pohodlí.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Různé druhy ochrany',
      'Jak vybírat podle pohodlí',
      'Jak ochranu měnit',
    ],
    body1: 'Při první menstruaci je obvykle nejjednodušší ochranou vložka, protože se dává přímo do kalhotek. Menstruační kalhotky a tampony jsou další možnosti, které můžete vyzkoušet později, kdykoli budete mít chuť.',
    options: [
      {
        title: 'Vložky',
        text: 'Snadno se používají, dávají se do kalhotek a pravidelně se mění.',
      },
      {
        title: 'Menstruační kalhotky',
        text: 'Savé, omyvatelné kalhotky, pohodlné pro každodenní použití.',
      },
      {
        title: 'Tampony',
        text: 'Zavádějí se dovnitř těla; zda a kdy je použít, je na vás, vlastním tempem.',
      },
    ],
    body2: 'Neexistuje správná ani špatná ochrana: každá vyhovuje jiným tělům, návykům a úrovním pohodlí. Tampony se například zavádějí dovnitř těla a vyžadují o něco větší znalost vlastního těla — nic nenařizuje, že je musíte používat od úplně první menstruace.',
    tipTitle: 'Stojí za to vědět',
    tipText: 'Zkoušení různých druhů ochrany v průběhu času vám pomůže najít tu, která vám vyhovuje nejlépe, bez tlaku.',
    body3: 'V průměru by se ochrana měla měnit každé 4 až 6 hodin, ve dnech silnějšího krvácení častěji. Pravidelná výměna vám pomůže cítit se pohodlně a dodržovat dobrou intimní hygienu.',
    relatedTitle: '♥  Mohlo by se vám líbit',
    related: [
      {title: 'Pochopení menstruačního krvácení', meta: '7 min  ·  Průvodce'},
      {title: 'Jak zvládat první menstruaci v každodenním životě?', meta: '5 min  ·  Průvodce'},
      {title: 'Vaše první menstruace: co očekávat', meta: '5 min  ·  Průvodce'},
    ],
    shareMessage: 'Jakou ochranu zvolit při první menstruaci? — AWA',
  },
  sk: {
    badge: 'PRVÁ MENŠTRUÁCIA',
    title: 'Ktorú hygienickú pomôcku si mám\nvybrať na prvú menštruáciu?',
    metaDuration: '6 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Existuje niekoľko spôsobov, ako sa počas menštruácie chrániť. Žiadny nie je lepší ako iný — výber riadi osobné pohodlie.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Rôzne druhy hygienických pomôcok',
      'Ako si vybrať podľa pohodlia',
      'Ako pomôcku meniť',
    ],
    body1: 'Na prvú menštruáciu je zvyčajne najjednoduchšie použiť vložku, pretože sa lepí priamo na bielizeň. Menštruačné nohavičky a tampóny sú ďalšie možnosti, ktoré môžete vyskúšať neskôr, kedykoľvek budete chcieť.',
    options: [
      {
        title: 'Vložky',
        text: 'Ľahko sa používajú, lepia sa na bielizeň a pravidelne sa menia.',
      },
      {
        title: 'Menštruačné nohavičky',
        text: 'Savá, umývateľná bielizeň, pohodlná na každodenné používanie.',
      },
      {
        title: 'Tampóny',
        text: 'Zavádzajú sa do tela; či a kedy ich použiť, je na vás, vlastným tempom.',
      },
    ],
    body2: 'Neexistuje správna ani nesprávna pomôcka: každá vyhovuje iným telám, zvykom a úrovniam pohodlia. Tampóny sa napríklad zavádzajú do tela a vyžadujú trochu väčšiu zžitosť s ním — nič nehovorí, že ich musíte používať už od prvej menštruácie.',
    tipTitle: 'Stojí za to vedieť',
    tipText: 'Vyskúšanie rôznych druhov pomôcok v priebehu času vám pomôže nájsť tú, ktorá vám vyhovuje najviac, bez tlaku.',
    body3: 'V priemere by sa pomôcka mala meniť každé 4 až 6 hodín, v dňoch so silnejším krvácaním častejšie. Pravidelná výmena vám pomáha zostať v pohodlí a udržiavať dobrú intímnu hygienu.',
    relatedTitle: '♥  Mohlo by sa vám páčiť',
    related: [
      {title: 'Pochopenie menštruačného krvácania', meta: '7 min  ·  Sprievodca'},
      {title: 'Ako zvládať prvú menštruáciu v každodennom živote?', meta: '5 min  ·  Sprievodca'},
      {title: 'Vaša prvá menštruácia: čo očakávať', meta: '5 min  ·  Sprievodca'},
    ],
    shareMessage: 'Ktorú hygienickú pomôcku si mám vybrať na prvú menštruáciu? — AWA',
  },
  hu: {
    badge: 'AZ ELSŐ MENSTRUÁCIÓ',
    title: 'Melyik higiéniai terméket válasszam\naz első menstruációmra?',
    metaDuration: '6 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'A menstruáció alatt többféleképpen védekezhetsz. Egyik sem jobb a másiknál — a választást a személyes kényelem vezérli.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'A higiéniai termékek különböző típusai',
      'Hogyan válassz a kényelmed alapján',
      'Hogyan cseréld a terméket',
    ],
    body1: 'Az első menstruációra általában a betét a legegyszerűbb használni, mivel közvetlenül a bugyidba kerül. A menstruációs bugyi és a tampon más lehetőségek, amelyeket később, bármikor kipróbálhatsz, ha kedved tartja.',
    options: [
      {
        title: 'Betétek',
        text: 'Könnyen használhatók, a bugyiba kerülnek, és rendszeresen cserélendők.',
      },
      {
        title: 'Menstruációs bugyi',
        text: 'Nedvszívó, kimosható bugyi, amely kényelmes a mindennapi használatra.',
      },
      {
        title: 'Tamponok',
        text: 'A testbe kerülnek; hogy használod-e és mikor, az rajtad múlik, a saját tempódban.',
      },
    ],
    body2: 'Nincs helyes vagy helytelen termék: mindegyik más testhez, szokásokhoz és kényelmi szinthez illik. A tamponokat például a testbe kell behelyezni, és egy kicsit nagyobb testismeretet igényelnek — semmi nem mondja, hogy az első menstruációtól kezdve kell használnod őket.',
    tipTitle: 'Érdemes tudni',
    tipText: 'Az idők során különböző típusok kipróbálása segít megtalálni a legjobban illőt, nyomás nélkül.',
    body3: 'Átlagosan 4–6 óránként kell cserélni a terméket, az erősebb vérzésű napokon gyakrabban. A rendszeres csere segít a kényelem megőrzésében és a jó intim higiénia fenntartásában.',
    relatedTitle: '♥  Ez is tetszhet',
    related: [
      {title: 'A menstruációs vérzésed megértése', meta: '7 perc  ·  Útmutató'},
      {title: 'Hogyan kezeljem az első menstruációmat a mindennapokban?', meta: '5 perc  ·  Útmutató'},
      {title: 'Az első menstruációd: mire számíts', meta: '5 perc  ·  Útmutató'},
    ],
    shareMessage: 'Melyik higiéniai terméket válasszam az első menstruációmra? — AWA',
  },
  ro: {
    badge: 'PRIMA MENSTRUAȚIE',
    title: 'Ce protecție să aleg\npentru prima menstruație?',
    metaDuration: '6 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Există mai multe moduri de a te proteja în timpul menstruației. Niciunul nu este mai bun decât altul — confortul personal este cel care ghidează alegerea.',
    contentsTitle: 'În acest articol',
    topics: [
      'Diferitele tipuri de protecție',
      'Cum alegi în funcție de confortul tău',
      'Cum îți schimbi protecția',
    ],
    body1: 'Pentru prima menstruație, un absorbant este de obicei protecția cea mai simplu de folosit, deoarece se lipește direct pe lenjerie. Lenjeria menstruală și tampoanele sunt alte opțiuni pe care le poți încerca mai târziu, oricând ai chef.',
    options: [
      {
        title: 'Absorbante',
        text: 'Ușor de folosit, se pun pe lenjerie și se schimbă regulat.',
      },
      {
        title: 'Lenjerie menstruală',
        text: 'Lenjerie absorbantă și lavabilă, confortabilă pentru uzul de zi cu zi.',
      },
      {
        title: 'Tampoane',
        text: 'Se introduc în interiorul corpului; dacă și când le folosești depinde de tine, în ritmul tău.',
      },
    ],
    body2: 'Nu există o protecție corectă sau greșită: fiecare se potrivește altor corpuri, obiceiuri și niveluri de confort. Tampoanele, de exemplu, se introduc în interiorul corpului și cer o familiaritate ceva mai mare cu acesta — nimic nu spune că trebuie să le folosești încă de la prima menstruație.',
    tipTitle: 'Bine de știut',
    tipText: 'Încercarea în timp a diferitelor tipuri de protecție te ajută să o găsești pe cea care ți se potrivește cel mai bine, fără presiune.',
    body3: 'În medie, protecția trebuie schimbată la fiecare 4-6 ore, mai des în zilele cu flux mai abundent. Schimbarea ei regulată te ajută să rămâi confortabilă și să menții o bună igienă intimă.',
    relatedTitle: '♥  Ți-ar putea plăcea și',
    related: [
      {title: 'Înțelegerea fluxului tău menstrual', meta: '7 min  ·  Ghid'},
      {title: 'Cum îți gestionezi prima menstruație zi de zi?', meta: '5 min  ·  Ghid'},
      {title: 'Prima ta menstruație: la ce să te aștepți', meta: '5 min  ·  Ghid'},
    ],
    shareMessage: 'Ce protecție să aleg pentru prima menstruație? — AWA',
  },
  bg: {
    badge: 'ПЪРВА МЕНСТРУАЦИЯ',
    title: 'Каква защита да избера\nза първата си менструация?',
    metaDuration: '6 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Има няколко начина да се предпазиш по време на менструация. Никой не е по-добър от другите — личният комфорт е онова, което насочва избора.',
    contentsTitle: 'В тази статия',
    topics: [
      'Различните видове защита',
      'Как да избереш според комфорта си',
      'Как да сменяш защитата си',
    ],
    body1: 'За първата менструация превръзката обикновено е най-простата защита за използване, тъй като се залепя директно на бельото. Менструалното бельо и тампоните са други възможности, които можеш да опиташ по-късно, когато ти се прииска.',
    options: [
      {
        title: 'Превръзки',
        text: 'Лесни за използване, залепват се на бельото и се сменят редовно.',
      },
      {
        title: 'Менструално бельо',
        text: 'Абсорбиращо, перящо се бельо, удобно за ежедневна употреба.',
      },
      {
        title: 'Тампони',
        text: 'Поставят се вътре в тялото; дали и кога да ги използваш зависи от теб, в твоето темпо.',
      },
    ],
    body2: 'Няма правилна или грешна защита: всяка подхожда на различни тела, навици и нива на комфорт. Тампоните, например, се поставят вътре в тялото и изискват малко повече опознаване на тялото — нищо не казва, че трябва да ги използваш още от първата си менструация.',
    tipTitle: 'Добре е да знаеш',
    tipText: 'Изпробването на различни видове защита във времето ти помага да намериш онази, която ти подхожда най-добре, без натиск.',
    body3: 'Средно защитата трябва да се сменя на всеки 4 до 6 часа, по-често в дните с по-обилен поток. Редовната смяна ти помага да останеш комфортна и да поддържаш добра интимна хигиена.',
    relatedTitle: '♥  Може да ти хареса и',
    related: [
      {title: 'Разбиране на менструалния ти поток', meta: '7 мин  ·  Ръководство'},
      {title: 'Как да се справяш с първата си менструация в ежедневието?', meta: '5 мин  ·  Ръководство'},
      {title: 'Първата ти менструация: какво да очакваш', meta: '5 мин  ·  Ръководство'},
    ],
    shareMessage: 'Каква защита да избера за първата си менструация? — AWA',
  },
  sr: {
    badge: 'ПРВА МЕНСТРУАЦИЈА',
    title: 'Коју заштиту да изаберем\nза прву менструацију?',
    metaDuration: '6 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Постоји неколико начина да се заштитиш током менструације. Ниједан није бољи од другог — личан комфор води избор.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Различите врсте заштите',
      'Како изабрати према удобности',
      'Како мењати заштиту',
    ],
    body1: 'За прву менструацију улошак је обично најједноставнија заштита, јер се ставља директно у доњи веш. Менструално рубље и тампони су друге опције које можеш пробати касније, кад год пожелиш.',
    options: [
      {
        title: 'Улошци',
        text: 'Једноставни за употребу, стављају се у доњи веш и редовно се мењају.',
      },
      {
        title: 'Менструално рубље',
        text: 'Упијајући, перив доњи веш који је удобан за свакодневну употребу.',
      },
      {
        title: 'Тампони',
        text: 'Стављају се унутар тела; да ли ћеш их и када користити зависи од тебе, својим темпом.',
      },
    ],
    body2: 'Не постоји исправна или погрешна заштита: свака одговара различитим телима, навикама и нивоима удобности. Тампони се, на пример, стављају унутар тела и захтевају мало више познавања тела — ништа не каже да их мораш користити већ од прве менструације.',
    tipTitle: 'Добро је знати',
    tipText: 'Пробање различитих врста заштите током времена помаже ти да пронађеш ону која ти најбоље одговара, без притиска.',
    body3: 'У просеку, заштиту треба мењати сваких 4 до 6 сати, чешће у дане обилнијег протока. Редовна промена помаже ти да останеш удобно и одржаваш добру интимну хигијену.',
    relatedTitle: '♥  Можда ће ти се свидети и',
    related: [
      {title: 'Разумевање твог менструалног протока', meta: '7 мин  ·  Водич'},
      {title: 'Како да организујеш прву менструацију из дана у дан?', meta: '5 мин  ·  Водич'},
      {title: 'Твоја прва менструација: шта да очекујеш', meta: '5 мин  ·  Водич'},
    ],
    shareMessage: 'Коју заштиту да изаберем за прву менструацију? — AWA',
  },
  hr: {
    badge: 'PRVA MENSTRUACIJA',
    title: 'Koju zaštitu odabrati\nza prvu menstruaciju?',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Postoji nekoliko načina zaštite tijekom menstruacije. Nijedan nije bolji od drugog — izbor vodi osobna ugoda.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Različite vrste zaštite',
      'Kako odabrati prema ugodi',
      'Kako mijenjati zaštitu',
    ],
    body1: 'Za prvu menstruaciju uložak je obično najjednostavnija zaštita jer se stavlja izravno na donje rublje. Menstrualno donje rublje i tamponi druge su mogućnosti koje možeš isprobati kasnije, kad ti bude do toga.',
    options: [
      {
        title: 'Ulošci',
        text: 'Jednostavni za korištenje, stavljaju se na donje rublje i redovito mijenjaju.',
      },
      {
        title: 'Menstrualno donje rublje',
        text: 'Upijajuće donje rublje koje se može prati, ugodno za svakodnevnu uporabu.',
      },
      {
        title: 'Tamponi',
        text: 'Umeću se u tijelo; hoćeš li ih i kada koristiti ovisi o tebi, svojim tempom.',
      },
    ],
    body2: 'Ne postoji ispravna ni pogrešna zaštita: svaka odgovara različitim tijelima, navikama i razinama ugode. Tamponi se, primjerice, umeću u tijelo i traže malo više poznavanja vlastitog tijela — ništa ne kaže da ih moraš koristiti od prve menstruacije.',
    tipTitle: 'Dobro je znati',
    tipText: 'Isprobavanje različitih vrsta zaštite tijekom vremena pomaže ti pronaći onu koja ti najbolje odgovara, bez pritiska.',
    body3: 'U prosjeku zaštitu treba mijenjati svaka 4 do 6 sati, a češće onih dana kad je protok obilniji. Redovita zamjena pomaže ti da ostaneš ugodno i održavaš dobru intimnu higijenu.',
    relatedTitle: '♥  Moglo bi ti se svidjeti',
    related: [
      {title: 'Razumijevanje menstrualnog protoka', meta: '7 min  ·  Vodič'},
      {title: 'Kako se nositi s prvom menstruacijom iz dana u dan?', meta: '5 min  ·  Vodič'},
      {title: 'Tvoja prva menstruacija: što očekivati', meta: '5 min  ·  Vodič'},
    ],
    shareMessage: 'Koju zaštitu odabrati za prvu menstruaciju? — AWA',
  },
  bs: {
    badge: 'PRVA MENSTRUACIJA',
    title: 'Koju zaštitu odabrati\nza prvu menstruaciju?',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Postoji nekoliko načina zaštite tokom menstruacije. Nijedan nije bolji od drugog — izbor vodi osobna ugoda.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Različite vrste zaštite',
      'Kako odabrati prema ugodi',
      'Kako mijenjati zaštitu',
    ],
    body1: 'Za prvu menstruaciju uložak je obično najjednostavnija zaštita jer se stavlja izravno na donje rublje. Menstrualno donje rublje i tamponi druge su mogućnosti koje možeš isprobati kasnije, kad ti bude do toga.',
    options: [
      {
        title: 'Ulošci',
        text: 'Jednostavni za korištenje, stavljaju se na donje rublje i redovito mijenjaju.',
      },
      {
        title: 'Menstrualno donje rublje',
        text: 'Upijajuće donje rublje koje se može prati, ugodno za svakodnevnu uporabu.',
      },
      {
        title: 'Tamponi',
        text: 'Umeću se u tijelo; hoćeš li ih i kada koristiti ovisi o tebi, svojim tempom.',
      },
    ],
    body2: 'Ne postoji ispravna ni pogrešna zaštita: svaka odgovara različitim tijelima, navikama i razinama ugode. Tamponi se, primjerice, umeću u tijelo i traže malo više poznavanja vlastitog tijela — ništa ne kaže da ih moraš koristiti od prve menstruacije.',
    tipTitle: 'Dobro je znati',
    tipText: 'Isprobavanje različitih vrsta zaštite tokom vremena pomaže ti pronaći onu koja ti najbolje odgovara, bez pritiska.',
    body3: 'U prosjeku zaštitu treba mijenjati svaka 4 do 6 sati, a češće onih dana kad je protok obilniji. Redovita zamjena pomaže ti da ostaneš ugodno i održavaš dobru intimnu higijenu.',
    relatedTitle: '♥  Moglo bi ti se svidjeti',
    related: [
      {title: 'Razumijevanje menstrualnog protoka', meta: '7 min  ·  Vodič'},
      {title: 'Kako se nositi s prvom menstruacijom iz dana u dan?', meta: '5 min  ·  Vodič'},
      {title: 'Tvoja prva menstruacija: što očekivati', meta: '5 min  ·  Vodič'},
    ],
    shareMessage: 'Koju zaštitu odabrati za prvu menstruaciju? — AWA',
  },
  sl: {
    badge: 'PRVA MENSTRUACIJA',
    title: 'Katero zaščito izbrati\nza prvo menstruacijo?',
    metaDuration: '6 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Obstaja več načinov zaščite med menstruacijo. Nobena ni boljša od druge — izbiro vodi osebno udobje.',
    contentsTitle: 'V tem članku',
    topics: [
      'Različne vrste zaščite',
      'Kako izbrati glede na udobje',
      'Kako menjati zaščito',
    ],
    body1: 'Za prvo menstruacijo je vložek običajno najpreprostejša zaščita, saj se namesti neposredno na spodnje perilo. Menstrualno perilo in tamponi so druge možnosti, ki jih lahko preizkusiš pozneje, ko ti bo do tega.',
    options: [
      {
        title: 'Vložki',
        text: 'Preprosti za uporabo, namestijo se na spodnje perilo in se redno menjajo.',
      },
      {
        title: 'Menstrualno perilo',
        text: 'Vpojno perilo, ki ga je mogoče prati, udobno za vsakdanjo uporabo.',
      },
      {
        title: 'Tamponi',
        text: 'Vstavijo se v telo; ali in kdaj jih boš uporabljala, je odvisno od tebe, v tvojem tempu.',
      },
    ],
    body2: 'Ne obstaja prava ali napačna zaščita: vsaka ustreza različnim telesom, navadam in ravneh udobja. Tamponi se na primer vstavijo v telo in zahtevajo malo več poznavanja lastnega telesa — nič ne pravi, da jih moraš uporabljati od prve menstruacije.',
    tipTitle: 'Vredno vedeti',
    tipText: 'Preizkušanje različnih vrst zaščite skozi čas ti pomaga najti tisto, ki ti najbolj ustreza, brez pritiska.',
    body3: 'V povprečju je treba zaščito menjati vsakih 4 do 6 ur, pogosteje na dneve z obilnejšim tokom. Redna menjava ti pomaga ostati udobno in vzdrževati dobro intimno higieno.',
    relatedTitle: '♥  Morda ti bo všeč tudi',
    related: [
      {title: 'Razumevanje menstrualnega toka', meta: '7 min  ·  Vodnik'},
      {title: 'Kako se soočiti s prvo menstruacijo iz dneva v dan?', meta: '5 min  ·  Vodnik'},
      {title: 'Tvoja prva menstruacija: kaj pričakovati', meta: '5 min  ·  Vodnik'},
    ],
    shareMessage: 'Katero zaščito izbrati za prvo menstruacijo? — AWA',
  },
  ne: {
    badge: 'पहिलो महिनावारी',
    title: 'पहिलो महिनावारीका लागि\nकुन सुरक्षा छान्ने?',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'महिनावारीमा आफूलाई सुरक्षित राख्ने धेरै तरिका छन्। कुनै पनि अर्कोभन्दा राम्रो छैन — व्यक्तिगत सहजताले नै छनोट निर्देशित गर्छ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'सुरक्षाका विभिन्न प्रकारहरू',
      'आफ्नो सहजताअनुसार कसरी छान्ने',
      'आफ्नो सुरक्षा कसरी बदल्ने',
    ],
    body1: 'पहिलो महिनावारीका लागि, प्याड प्रायः प्रयोग गर्न सबैभन्दा सरल सुरक्षा हो, किनभने यो सिधै तपाईंको अन्तर्वस्त्रमा राखिन्छ। महिनावारीको अन्तर्वस्त्र र ट्याम्पोन अन्य विकल्प हुन् जुन तपाईंले पछि, जब मन लाग्छ, प्रयास गर्न सक्नुहुन्छ।',
    options: [
      {
        title: 'प्याडहरू',
        text: 'प्रयोग गर्न सजिलो, तिनलाई अन्तर्वस्त्रमा राखिन्छ र नियमित बदलिन्छ।',
      },
      {
        title: 'महिनावारीको अन्तर्वस्त्र',
        text: 'सोख्ने, धुन मिल्ने अन्तर्वस्त्र जुन दैनिक प्रयोगका लागि सहज हुन्छ।',
      },
      {
        title: 'ट्याम्पोन',
        text: 'शरीरभित्र राखिन्छ; तिनलाई प्रयोग गर्ने वा नगर्ने र कहिले गर्ने भन्ने कुरा तपाईंकै गतिमा तपाईंमै निर्भर छ।',
      },
    ],
    body2: 'कुनै सही वा गलत सुरक्षा हुँदैन: हरेकले फरक शरीर, बानी र सहजताको स्तरलाई मिल्छ। उदाहरणका लागि, ट्याम्पोन शरीरभित्र राखिन्छ र आफ्नो शरीरसँग अलिक बढी परिचय चाहिन्छ — तपाईंको पहिलो महिनावारीदेखि नै तिनलाई प्रयोग गर्नैपर्छ भन्ने कुनै कुरा छैन।',
    tipTitle: 'जान्न लायक',
    tipText: 'समयसँगै विभिन्न प्रकारका सुरक्षा प्रयास गर्नाले कुनै दबाबबिना तपाईंलाई सबैभन्दा मिल्ने भेट्टाउन मद्दत गर्छ।',
    body3: 'औसतमा, सुरक्षा हरेक 4 देखि 6 घण्टामा बदल्नुपर्छ, बढी बहाव हुने दिनहरूमा अझ बारम्बार। नियमित रूपमा बदल्नाले तपाईंलाई सहज रहन र राम्रो निजी सरसफाइ कायम राख्न मद्दत गर्छ।',
    relatedTitle: '♥  तपाईंलाई यी पनि मन पर्न सक्छन्',
    related: [
      {title: 'आफ्नो महिनावारीको बहाव बुझ्नुहोस्', meta: '7 मिनेट  ·  मार्गदर्शन'},
      {title: 'आफ्नो पहिलो महिनावारी दैनिक जीवनमा कसरी सम्हाल्ने?', meta: '5 मिनेट  ·  मार्गदर्शन'},
      {title: 'तपाईंको पहिलो महिनावारी: के अपेक्षा गर्ने', meta: '5 मिनेट  ·  मार्गदर्शन'},
    ],
    shareMessage: 'पहिलो महिनावारीका लागि कुन सुरक्षा छान्ने? — AWA',
  },
  si: {
    badge: 'පළමු ඔසප්',
    title: 'මගේ පළමු ඔසප් සඳහා කුමන\nආරක්ෂාව තෝරා ගත යුතුද?',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඔබේ ඔසප් කාලයේදී ඔබව ආරක්ෂා කර ගැනීමට ක්‍රම කිහිපයක් ඇත. කිසිවක් වෙනත් එකකට වඩා හොඳ නැත — තේරීම මඟ පෙන්වන්නේ පෞද්ගලික සුවපහසුවයි.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'විවිධ ආරක්ෂා වර්ග',
      'ඔබේ සුවපහසුව අනුව තෝරා ගන්නේ කෙසේද',
      'ඔබේ ආරක්ෂාව වෙනස් කරන්නේ කෙසේද',
    ],
    body1: 'ඔබේ පළමු ඔසප් සඳහා, පෑඩ් එකක් සාමාන්‍යයෙන් භාවිතා කිරීමට සරලම ආරක්ෂාවයි, මන්ද එය කෙලින්ම ඔබේ යට ඇඳුමේ තබයි. ඔසප් යට ඇඳුම් සහ ටැම්පන් ඔබට අවශ්‍ය ඕනෑම වේලාවක පසුව උත්සාහ කළ හැකි වෙනත් විකල්පවේ.',
    options: [
      {
        title: 'පෑඩ්',
        text: 'භාවිතා කිරීමට පහසුයි, ඒවා ඔබේ යට ඇඳුමේ තබා නිතිපතා වෙනස් කෙරේ.',
      },
      {
        title: 'ඔසප් යට ඇඳුම්',
        text: 'එදිනෙදා භාවිතයට සුවපහසු, අවශෝෂක, සෝදාගත හැකි යට ඇඳුම්.',
      },
      {
        title: 'ටැම්පන්',
        text: 'ශරීරය ඇතුළත ඇතුළු කෙරේ; ඒවා භාවිතා කළ යුතුද සහ කවදාද යන්න ඔබේම වේගයෙන් ඔබට භාරයි.',
      },
    ],
    body2: 'නිවැරදි හෝ වැරදි ආරක්ෂාවක් නැත: සෑම එකක්ම විවිධ ශරීර, පුරුදු සහ සුවපහසු මට්ටම්වලට ගැළපේ. උදාහරණයක් ලෙස, ටැම්පන් ශරීරය ඇතුළත ඇතුළු කෙරෙන අතර එය ගැන ටිකක් වැඩි හුරුපුරුදු බවක් අවශ්‍ය වේ — ඔබේ පළමු ඔසප් සිටම ඒවා භාවිතා කළ යුතු යැයි කිසිවක් නොකියයි.',
    tipTitle: 'දැනගත යුතු දේ',
    tipText: 'කාලයත් සමඟ විවිධ ආරක්ෂා වර්ග උත්සාහ කිරීම, කිසිදු පීඩනයකින් තොරව ඔබට වඩාත්ම ගැළපෙන එක සොයාගැනීමට උපකාරී වේ.',
    body3: 'සාමාන්‍යයෙන්, ආරක්ෂාව පැය 4 සිට 6 දක්වා වරක් වෙනස් කළ යුතු අතර, වැඩි ගලනය සහිත දිනවල ඊට වඩා නිතර. එය නිතිපතා වෙනස් කිරීම ඔබට සුවපහසුව පවත්වා ගැනීමට සහ හොඳ සමීප සනීපාරක්ෂාව පවත්වා ගැනීමට උපකාරී වේ.',
    relatedTitle: '♥  ඔබට මෙයද වුවමනා විය හැක',
    related: [
      {title: 'ඔබේ ඔසප් ගලනය තේරුම් ගැනීම', meta: 'මිනි. 7  ·  මාර්ගෝපදේශය'},
      {title: 'ඔබේ පළමු ඔසප් දිනපතා කළමනාකරණය කරන්නේ කෙසේද?', meta: 'මිනි. 5  ·  මාර්ගෝපදේශය'},
      {title: 'ඔබේ පළමු ඔසප්: අපේක්ෂා කළ යුත්තේ කුමක්ද', meta: 'මිනි. 5  ·  මාර්ගෝපදේශය'},
    ],
    shareMessage: 'මගේ පළමු ඔසප් සඳහා කුමන ආරක්ෂාව තෝරා ගත යුතුද? — AWA',
  },
  th: {
    badge: 'ประจำเดือนครั้งแรก',
    title: 'ฉันควรเลือกอุปกรณ์แบบไหน\nสำหรับประจำเดือนครั้งแรก?',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'มีหลายวิธีในการป้องกันระหว่างมีประจำเดือน ไม่มีวิธีใดดีกว่ากัน — ความสบายส่วนตัวคือตัวนำทางการเลือก',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'อุปกรณ์ประเภทต่าง ๆ',
      'วิธีเลือกตามความสบายของคุณ',
      'วิธีเปลี่ยนอุปกรณ์',
    ],
    body1: 'สำหรับประจำเดือนครั้งแรก ผ้าอนามัยแบบแผ่นมักเป็นอุปกรณ์ที่ใช้ง่ายที่สุด เพราะติดลงในกางเกงในโดยตรง กางเกงในอนามัยและผ้าอนามัยแบบสอดเป็นตัวเลือกอื่นที่คุณลองได้ภายหลังเมื่อรู้สึกอยากลอง',
    options: [
      {
        title: 'ผ้าอนามัยแบบแผ่น',
        text: 'ใช้ง่าย ติดในกางเกงใน และเปลี่ยนเป็นประจำ',
      },
      {
        title: 'กางเกงในอนามัย',
        text: 'กางเกงในที่ดูดซับได้และซักได้ สบายสำหรับใช้ทุกวัน',
      },
      {
        title: 'ผ้าอนามัยแบบสอด',
        text: 'สอดเข้าไปในร่างกาย จะใช้หรือไม่และเมื่อไรขึ้นอยู่กับคุณ ตามจังหวะของคุณ',
      },
    ],
    body2: 'ไม่มีอุปกรณ์ที่ถูกหรือผิด: แต่ละแบบเหมาะกับร่างกาย นิสัย และระดับความสบายที่ต่างกัน ผ้าอนามัยแบบสอด เช่น สอดเข้าไปในร่างกายและต้องคุ้นเคยกับร่างกายมากขึ้นเล็กน้อย — ไม่มีอะไรบังคับว่าต้องใช้ตั้งแต่ประจำเดือนครั้งแรก',
    tipTitle: 'ควรรู้',
    tipText: 'การลองอุปกรณ์หลายแบบตามเวลาช่วยให้คุณหาแบบที่เหมาะกับคุณที่สุด โดยไม่มีแรงกดดัน',
    body3: 'โดยเฉลี่ยควรเปลี่ยนอุปกรณ์ทุก 4 ถึง 6 ชั่วโมง และบ่อยขึ้นในวันที่มีปริมาณมาก การเปลี่ยนเป็นประจำช่วยให้คุณสบายตัวและรักษาสุขอนามัยในจุดซ่อนเร้นที่ดี',
    relatedTitle: '♥  คุณอาจสนใจ',
    related: [
      {title: 'ทำความเข้าใจปริมาณประจำเดือนของคุณ', meta: '7 นาที  ·  คู่มือ'},
      {title: 'วิธีจัดการประจำเดือนครั้งแรกในชีวิตประจำวัน', meta: '5 นาที  ·  คู่มือ'},
      {title: 'ประจำเดือนครั้งแรกของคุณ: สิ่งที่คาดหวังได้', meta: '5 นาที  ·  คู่มือ'},
    ],
    shareMessage: 'ฉันควรเลือกอุปกรณ์แบบไหนสำหรับประจำเดือนครั้งแรก? — AWA',
  },
  vi: {
    badge: 'KỲ KINH ĐẦU TIÊN',
    title: 'Nên chọn sản phẩm vệ sinh nào\ncho kỳ kinh đầu tiên?',
    metaDuration: '6 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Có nhiều cách để bảo vệ bản thân trong kỳ kinh. Không cách nào tốt hơn cách nào — sự thoải mái cá nhân là điều định hướng lựa chọn.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Các loại sản phẩm vệ sinh khác nhau',
      'Cách chọn dựa trên sự thoải mái của bạn',
      'Cách thay sản phẩm vệ sinh',
    ],
    body1: 'Với kỳ kinh đầu tiên, băng vệ sinh thường là sản phẩm đơn giản nhất để dùng, vì nó được dán trực tiếp vào quần lót. Quần lót kinh nguyệt và tampon là những lựa chọn khác bạn có thể thử sau, bất cứ khi nào bạn muốn.',
    options: [
      {
        title: 'Băng vệ sinh',
        text: 'Dễ sử dụng, được dán vào quần lót và thay đều đặn.',
      },
      {
        title: 'Quần lót kinh nguyệt',
        text: 'Quần lót thấm hút, có thể giặt lại, thoải mái cho việc dùng hằng ngày.',
      },
      {
        title: 'Tampon',
        text: 'Được đặt vào bên trong cơ thể; việc có dùng hay không và khi nào dùng là tùy bạn, theo nhịp của bạn.',
      },
    ],
    body2: 'Không có sản phẩm vệ sinh nào đúng hay sai: mỗi loại phù hợp với những cơ thể, thói quen và mức độ thoải mái khác nhau. Ví dụ, tampon được đặt vào bên trong cơ thể và đòi hỏi bạn quen thuộc với cơ thể hơn một chút — không có gì buộc bạn phải dùng ngay từ kỳ kinh đầu tiên.',
    tipTitle: 'Nên biết',
    tipText: 'Thử các loại sản phẩm vệ sinh khác nhau theo thời gian giúp bạn tìm ra loại phù hợp nhất, không áp lực.',
    body3: 'Trung bình, nên thay sản phẩm vệ sinh mỗi 4 đến 6 giờ, thường xuyên hơn vào những ngày ra nhiều máu. Thay đều đặn giúp bạn thoải mái và giữ vệ sinh vùng kín tốt.',
    relatedTitle: '♥  Có thể bạn cũng thích',
    related: [
      {title: 'Hiểu lượng kinh nguyệt của bạn', meta: '7 phút  ·  Hướng dẫn'},
      {title: 'Cách xử lý kỳ kinh đầu tiên mỗi ngày?', meta: '5 phút  ·  Hướng dẫn'},
      {title: 'Kỳ kinh đầu tiên của bạn: điều cần biết', meta: '5 phút  ·  Hướng dẫn'},
    ],
    shareMessage: 'Nên chọn sản phẩm vệ sinh nào cho kỳ kinh đầu tiên? — AWA',
  },
  uz: {
    badge: 'BIRINCHI HAYZ',
    title: 'Birinchi hayzim uchun qaysi himoya\nvositasini tanlashim kerak?',
    metaDuration: '6 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Hayz paytida oʻzingizni himoya qilishning bir necha usuli bor. Birortasi boshqasidan yaxshiroq emas — tanlovni shaxsiy qulaylik belgilaydi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Himoya vositalarining turlari',
      'Qulayligingizga qarab qanday tanlash kerak',
      'Himoya vositasini qanday almashtirish kerak',
    ],
    body1: 'Birinchi hayz uchun prokladka odatda ishlatish eng oson vosita, chunki u bevosita ichki kiyimga qoʻyiladi. Hayz uchun ichki kiyim va tamponlar esa xohlaganingizda keyinroq sinab koʻrishingiz mumkin boʻlgan boshqa variantlar.',
    options: [
      {
        title: 'Prokladkalar',
        text: 'Ishlatish oson, ichki kiyimga qoʻyiladi va muntazam almashtiriladi.',
      },
      {
        title: 'Hayz uchun ichki kiyim',
        text: 'Kundalik foydalanish uchun qulay, soʻruvchan, yuviladigan ichki kiyim.',
      },
      {
        title: 'Tamponlar',
        text: 'Tananing ichiga kiritiladi; ulardan foydalanish yoki foydalanmaslik va qachon foydalanish oʻz surʼatingizdagi tanlovingiz.',
      },
    ],
    body2: 'Toʻgʻri yoki notoʻgʻri himoya vositasi yoʻq: har biri turli tanalar, odatlar va qulaylik darajasiga mos keladi. Masalan, tamponlar tananing ichiga kiritiladi va tanani biroz koʻproq bilishni talab qiladi — ularni birinchi hayzdanoq ishlatish shart degan gap yoʻq.',
    tipTitle: 'Bilish foydali',
    tipText: 'Vaqt oʻtishi bilan turli himoya vositalarini sinab koʻrish bosimsiz oʻzingizga eng mosini topishga yordam beradi.',
    body3: 'Oʻrtacha hisobda himoya vositasini har 4 soatdan 6 soatgacha almashtirish kerak, oqim koʻp kunlarda esa tez-tezroq. Uni muntazam almashtirish oʻzingizni qulay his qilishga va intim gigiyenani yaxshi saqlashga yordam beradi.',
    relatedTitle: '♥  Sizga yoqishi mumkin',
    related: [
      {title: 'Hayz oqimini tushunish', meta: '7 daq  ·  Qoʻllanma'},
      {title: 'Birinchi hayzni kundalik hayotda qanday boshqarish kerak?', meta: '5 daq  ·  Qoʻllanma'},
      {title: 'Birinchi hayzingiz: nimalarni kutish kerak', meta: '5 daq  ·  Qoʻllanma'},
    ],
    shareMessage: 'Birinchi hayzim uchun qaysi himoya vositasini tanlashim kerak? — AWA',
  },
  az: {
    badge: 'İLK AYBAŞI',
    title: 'İlk aybaşım üçün hansı\nqoruyucu vasitəni seçməliyəm?',
    metaDuration: '6 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Aybaşı zamanı özünüzü qorumağın bir neçə yolu var. Heç biri digərindən yaxşı deyil — seçimi şəxsi rahatlıq müəyyən edir.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Qoruyucu vasitələrin müxtəlif növləri',
      'Rahatlığınıza görə necə seçmək olar',
      'Qoruyucu vasitəni necə dəyişmək olar',
    ],
    body1: 'İlk aybaşı üçün gigiyenik bez adətən istifadəsi ən sadə vasitədir, çünki o, birbaşa alt paltarına yerləşdirilir. Aybaşı alt paltarı və tamponlar istədiyiniz zaman sonradan sınaya biləcəyiniz digər seçimlərdir.',
    options: [
      {
        title: 'Gigiyenik bezlər',
        text: 'İstifadəsi asandır, alt paltarına yerləşdirilir və müntəzəm dəyişdirilir.',
      },
      {
        title: 'Aybaşı alt paltarı',
        text: 'Gündəlik istifadə üçün rahat, yuyula bilən, hopdurucu alt paltarı.',
      },
      {
        title: 'Tamponlar',
        text: 'Bədənin daxilinə yerləşdirilir; onlardan istifadə edib-etməmək və nə vaxt istifadə etmək öz tempinizə görə sizin seçiminizdir.',
      },
    ],
    body2: 'Düzgün və ya yanlış qoruyucu vasitə yoxdur: hər biri fərqli bədənlərə, vərdişlərə və rahatlıq səviyyələrinə uyğundur. Məsələn, tamponlar bədənin daxilinə yerləşdirilir və onu bir az daha yaxşı tanımağı tələb edir — ilk aybaşıdan onlardan istifadə etməyiniz heç bir şəkildə vacib deyil.',
    tipTitle: 'Bilmək faydalıdır',
    tipText: 'Zamanla müxtəlif qoruyucu vasitələri sınamaq, heç bir təzyiq olmadan sizə ən uyğun olanı tapmağa kömək edir.',
    body3: 'Orta hesabla qoruyucu vasitə hər 4–6 saatdan bir dəyişdirilməlidir, axının bol olduğu günlərdə daha tez-tez. Müntəzəm dəyişmək özünüzü rahat hiss etməyə və intim gigiyenanı yaxşı saxlamağa kömək edir.',
    relatedTitle: '♥  Bunlar da xoşunuza gələ bilər',
    related: [
      {title: 'Aybaşı axınınızı anlamaq', meta: '7 dəq  ·  Bələdçi'},
      {title: 'İlk aybaşınızı gündəlik həyatda necə idarə etmək olar?', meta: '5 dəq  ·  Bələdçi'},
      {title: 'İlk aybaşınız: nələri gözləmək olar', meta: '5 dəq  ·  Bələdçi'},
    ],
    shareMessage: 'İlk aybaşım üçün hansı qoruyucu vasitəni seçməliyəm? — AWA',
  },
  ka: {
    badge: 'პირველი მენსტრუაცია',
    title: 'რომელი დამცავი საშუალება ავირჩიო\nპირველი მენსტრუაციისთვის?',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'მენსტრუაციის დროს თავის დაცვის რამდენიმე გზა არსებობს. არცერთი სხვაზე უკეთესი არ არის — არჩევანს პირადი კომფორტი წარმართავს.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'დამცავი საშუალებების სხვადასხვა ტიპი',
      'როგორ ავირჩიოთ თქვენი კომფორტის მიხედვით',
      'როგორ შევცვალოთ დამცავი საშუალება',
    ],
    body1: 'პირველი მენსტრუაციისთვის საფენი, როგორც წესი, გამოსაყენებლად ყველაზე მარტივი დამცავი საშუალებაა, რადგან პირდაპირ საცვალზე მაგრდება. მენსტრუაციის საცვალი და ტამპონები სხვა ვარიანტებია, რომელთა ცდაც მოგვიანებით შეგიძლიათ, როცა მოგინდებათ.',
    options: [
      {
        title: 'საფენები',
        text: 'გამოსაყენებლად მარტივია, საცვალზე მაგრდება და რეგულარულად იცვლება.',
      },
      {
        title: 'მენსტრუაციის საცვალი',
        text: 'შთამნთქმელი, გასარეცხი საცვალი, რომელიც ყოველდღიური გამოყენებისთვის კომფორტულია.',
      },
      {
        title: 'ტამპონები',
        text: 'სხეულის შიგნით შეიყვანება; გამოყენება და დრო თქვენზეა დამოკიდებული, თქვენი ტემპით.',
      },
    ],
    body2: 'სწორი ან არასწორი დამცავი საშუალება არ არსებობს: თითოეული განსხვავებულ სხეულს, ჩვევებსა და კომფორტის დონეს ერგება. მაგალითად, ტამპონები სხეულის შიგნით შეიყვანება და სხეულის უფრო კარგ ცოდნას მოითხოვს — არაფერი გავალდებულებთ, რომ ისინი თქვენი პირველი მენსტრუაციიდან გამოიყენოთ.',
    tipTitle: 'კარგია ვიცოდეთ',
    tipText: 'დამცავი საშუალებების სხვადასხვა ტიპის დროთა განმავლობაში ცდა გეხმარებათ იპოვოთ თქვენთვის საუკეთესო, ზეწოლის გარეშე.',
    body3: 'საშუალოდ, დამცავი საშუალება ყოველ 4-დან 6 საათში უნდა შეიცვალოს, უფრო უხვი ნაკადის დღეებში უფრო ხშირად. რეგულარულმა შეცვლამ დაგეხმარებათ კომფორტულად იყოთ და ინტიმური ჰიგიენა კარგად შეინარჩუნოთ.',
    relatedTitle: '♥  შეიძლება მოგეწონოთ',
    related: [
      {title: 'თქვენი მენსტრუაციული ნაკადის გაგება', meta: '7 წთ  ·  გზამკვლევი'},
      {title: 'როგორ გავუმკლავდეთ პირველ მენსტრუაციას ყოველდღიურად?', meta: '5 წთ  ·  გზამკვლევი'},
      {title: 'თქვენი პირველი მენსტრუაცია: რას უნდა ელოდეთ', meta: '5 წთ  ·  გზამკვლევი'},
    ],
    shareMessage: 'რომელი დამცავი საშუალება ავირჩიო პირველი მენსტრუაციისთვის? — AWA',
  },
  hy: {
    badge: 'ԱՌԱՋԻՆ ԴԱՇՏԱՆ',
    title: 'Ի՞նչ պաշտպանություն ընտրել\nառաջին դաշտանիս համար',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Դաշտանի ընթացքում պաշտպանվելու մի քանի եղանակ կա: Ոչ մեկը մյուսից լավը չէ. ընտրությունը ուղղորդում է անձնական հարմարավետությունը:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Պաշտպանության տարբեր տեսակներ',
      'Ինչպես ընտրել՝ ըստ ձեր հարմարավետության',
      'Ինչպես փոխել պաշտպանությունը',
    ],
    body1: 'Առաջին դաշտանի համար միջադիրը սովորաբար օգտագործելու ամենապարզ պաշտպանությունն է, քանի որ այն ուղղակի դրվում է ներքնազգեստի մեջ: Դաշտանային ներքնազգեստը և տամպոնները այլ տարբերակներ են, որոնք կարող եք փորձել ավելի ուշ, երբ ցանկանաք:',
    options: [
      {
        title: 'Միջադիրներ',
        text: 'Հեշտ օգտագործվող, դրվում են ներքնազգեստի մեջ և փոխվում են կանոնավոր:',
      },
      {
        title: 'Դաշտանային ներքնազգեստ',
        text: 'Կլանող, լվացվող ներքնազգեստ, որը հարմար է ամենօրյա օգտագործման համար:',
      },
      {
        title: 'Տամպոններ',
        text: 'Տեղադրվում են մարմնի ներսում. օգտագործել դրանք, թե երբ՝ ձեր ընտրությունն է, ձեր տեմպով:',
      },
    ],
    body2: 'Ճիշտ կամ սխալ պաշտպանություն գոյություն չունի. յուրաքանչյուրը հարմար է տարբեր մարմինների, սովորությունների և հարմարավետության մակարդակների համար: Տամպոնները, օրինակ, տեղադրվում են մարմնի ներսում և պահանջում են դրա հետ մի փոքր ավելի ծանոթություն. ոչինչ չի պարտադրում դրանք օգտագործել հենց առաջին դաշտանից:',
    tipTitle: 'Լավ է իմանալ',
    tipText: 'Ժամանակի ընթացքում պաշտպանության տարբեր տեսակներ փորձելը օգնում է գտնել ձեզ ամենահարմարը՝ առանց ճնշման:',
    body3: 'Միջինում պաշտպանությունը պետք է փոխել յուրաքանչյուր 4–6 ժամը մեկ, ավելի առատ արտահոսքով օրերին՝ ավելի հաճախ: Այն կանոնավոր փոխելը օգնում է մնալ հարմար և պահպանել ինտիմ լավ հիգիենա:',
    relatedTitle: '♥  Ձեզ կարող է նաև հետաքրքրել',
    related: [
      {title: 'Հասկանալ ձեր դաշտանային արտահոսքը', meta: '7 ր  ·  Ուղեցույց'},
      {title: 'Ինչպե՞ս հոգալ առաջին դաշտանը օրեցօր:', meta: '5 ր  ·  Ուղեցույց'},
      {title: 'Ձեր առաջին դաշտանը. ինչ սպասել', meta: '5 ր  ·  Ուղեցույց'},
    ],
    shareMessage: 'Ի՞նչ պաշտպանություն ընտրել առաջին դաշտանիս համար — AWA',
  },
  tg: {
    badge: 'ҲАЙЗИ АВВАЛ',
    title: 'Барои ҳайзи аввалам кадом\nвоситаи муҳофизатро интихоб кунам?',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Барои муҳофизат дар вақти ҳайз якчанд роҳ вуҷуд дорад. Ягонтои онҳо аз дигаре беҳтар нест — роҳатии шахсӣ интихобро роҳнамоӣ мекунад.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Навъҳои гуногуни воситаҳои муҳофизат',
      'Чӣ тавр мувофиқи роҳатии худ интихоб кардан',
      'Чӣ тавр воситаи муҳофизатро иваз кардан',
    ],
    body1: 'Барои ҳайзи аввал пайванд одатан оддитарин восита аст, зеро он бевосита ба либоси таг мегузорад. Либоси таги ҳайзӣ ва тампонҳо имкониятҳои дигаре ҳастанд, ки баъдтар, ҳар вақт хоҳед, санҷида метавонед.',
    options: [
      {
        title: 'Пайвандҳо',
        text: 'Истифодааш осон аст, ба либоси таг гузошта мешавад ва мунтазам иваз карда мешавад.',
      },
      {
        title: 'Либоси таги ҳайзӣ',
        text: 'Либоси таги ҷаббанда ва шусташаванда, ки барои истифодаи ҳаррӯза роҳат аст.',
      },
      {
        title: 'Тампонҳо',
        text: 'Ба дохили бадан гузошта мешаванд; истифода бурдан ё нахурдан ва кай, ба худи шумо вобаста аст, бо суръати худ.',
      },
    ],
    body2: 'Воситаи муҳофизати дуруст ё нодуруст вуҷуд надорад: ҳар кадом ба баданҳо, одатҳо ва сатҳи роҳатии гуногун мувофиқ аст. Масалан, тампонҳо ба дохили бадан гузошта мешаванд ва шиносоии бештарро бо он талаб мекунанд — ҳеҷ чиз намегӯяд, ки шумо бояд онҳоро аз ҳайзи аввал истифода баред.',
    tipTitle: 'Донистан хуб аст',
    tipText: 'Бо мурури замон санҷидани навъҳои гуногуни воситаҳои муҳофизат ба шумо кумак мекунад беҳтарини мувофиқи худро ёбед, бе фишор.',
    body3: 'Дар миёна воситаи муҳофизатро ҳар 4 то 6 соат иваз кардан лозим аст, дар рӯзҳои ҷараёни зиёд бештар. Мунтазам иваз кардан ба шумо кумак мекунад роҳат бимонед ва гигиенаи наздикиро хуб нигоҳ доред.',
    relatedTitle: '♥  Шояд ба шумо ҳам маъқул шавад',
    related: [
      {title: 'Фаҳмидани ҷараёни ҳайзи шумо', meta: '7 дақ  ·  Роҳнамо'},
      {title: 'Чӣ тавр ҳайзи аввалро дар ҳаёти ҳаррӯза идора кард?', meta: '5 дақ  ·  Роҳнамо'},
      {title: 'Ҳайзи аввали шумо: чӣ интизор шудан лозим аст', meta: '5 дақ  ·  Роҳнамо'},
    ],
    shareMessage: 'Барои ҳайзи аввалам кадом воситаи муҳофизатро интихоб кунам? — AWA',
  },
  ky: {
    badge: 'БИРИНЧИ ЕТЕК КИРИМ',
    title: 'Биринчи етек кирим үчүн кайсы\nкоргонууну тандоо керек?',
    metaDuration: '6 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Етек кирим учурунда өзүңүздү коргоонун бир нече жолу бар. Эч бири башкасынан жакшыраак эмес — тандоого жеке ыңгайлуулук багыт берет.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Коргонуунун ар кандай түрлөрү',
      'Ыңгайлуулугуңузга жараша кантип тандоо керек',
      'Коргонуу каражатын кантип алмаштыруу керек',
    ],
    body1: 'Биринчи етек кирим үчүн прокладка, адатта, колдонууга эң жөнөкөй коргонуу, анткени ал түздөн-түз ич кийимге коюлат. Етек кирим ич кийими жана тампондор — кааласаңыз, кийин байкап көрө турган башка варианттар.',
    options: [
      {
        title: 'Прокладкалар',
        text: 'Колдонууга оңой, ич кийимге коюлат жана үзгүлтүксүз алмаштырылат.',
      },
      {
        title: 'Етек кирим ич кийими',
        text: 'Күнүмдүк колдонууга ыңгайлуу, сиңирүүчү, жуулуучу ич кийим.',
      },
      {
        title: 'Тампондор',
        text: 'Дененин ичине киргизилет; аларды колдонуу-колдонбоо жана качан колдонуу өзүңүздүн ылдамдыгыңызга жараша өзүңүздүн тандооңуз.',
      },
    ],
    body2: 'Туура же туура эмес коргонуу деген жок: ар бири ар кандай денеге, адатка жана ыңгайлуулукка ылайыктуу. Мисалы, тампондор дененин ичине киргизилет жана аны бир аз көбүрөөк билүүнү талап кылат — аларды эң биринчи етек киримден баштап колдонуу керек деп эч ким айтпайт.',
    tipTitle: 'Билүү пайдалуу',
    tipText: 'Убакыттын өтүшү менен коргонуунун ар кандай түрлөрүн байкап көрүү кысымсыз өзүңүзгө эң ылайыктуусун табууга жардам берет.',
    body3: 'Орточо алганда, коргонуу каражаты ар 4–6 саат сайын алмаштырылышы керек, агым көп күндөрү көбүрөөк. Үзгүлтүксүз алмаштыруу ыңгайлуу болууга жана жакшы жакын гигиенаны сактоого жардам берет.',
    relatedTitle: '♥  Сизге дагы жагышы мүмкүн',
    related: [
      {title: 'Етек кирим агымын түшүнүү', meta: '7 мүн  ·  Колдонмо'},
      {title: 'Биринчи етек киримди күнүмдүк жашоодо кантип башкаруу?', meta: '5 мүн  ·  Колдонмо'},
      {title: 'Биринчи етек кирим: эмне күтүү керек', meta: '5 мүн  ·  Колдонмо'},
    ],
    shareMessage: 'Биринчи етек кирим үчүн кайсы коргонууну тандоо керек? — AWA',
  },
  tk: {
    badge: 'ILKINJI AÝBAŞY',
    title: 'Ilkinji aýbaşym üçin haýsy\ngoranyş serişdesini saýlamaly?',
    metaDuration: '6 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Aýbaşy wagtynda özüňizi goramagyň birnäçe usuly bar. Hiç biri beýlekisinden gowy däl — saýlawa şahsy rahatlyk ugur görkezýär.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Goranyş serişdeleriniň dürli görnüşleri',
      'Rahatlygyňyza görä nädip saýlamaly',
      'Goranyş serişdesini nähili çalyşmaly',
    ],
    body1: 'Ilkinji aýbaşyňyz üçin prokladka adatça ulanmagyň iň ýönekeý goranyş serişdesi, sebäbi ol göni içki eşige ýerleşdirilýär. Aýbaşy içki eşigi we tamponlar islän wagtyňyz soňrak synap görüp boljak beýleki wariantlar.',
    options: [
      {
        title: 'Prokladkalar',
        text: 'Ulanmaga aňsat, olar içki eşige ýerleşdirilýär we yzygiderli çalşylýar.',
      },
      {
        title: 'Aýbaşy içki eşigi',
        text: 'Gündelik ulanmak üçin rahat, siňdiriji, ýuwulýan içki eşik.',
      },
      {
        title: 'Tamponlar',
        text: 'Bedeniň içine ýerleşdirilýär; olary ulanmalymy ýa-da haçan ulanmalydygy öz ritmiňizde, özüňize bagly.',
      },
    ],
    body2: 'Dogry ýa-da nädogry goranyş serişdesi ýok: her biri dürli bedenlere, endiklere we rahatlyk derejelerine laýyk gelýär. Tamponlar, meselem, bedeniň içine ýerleşdirilýär we onuň bilen birneme has köp tanyşlyk talap edýär — ilkinji aýbaşydan başlap ulanmaly diýip hiç zat aýtmaýar.',
    tipTitle: 'Bilmek peýdaly',
    tipText: 'Wagtyň geçmegi bilen dürli görnüşli goranyş serişdelerini synap görmek basyşsyz, size iň gowy laýyk gelenini tapmaga kömek edýär.',
    body3: 'Ortaça, goranyş serişdesi her 4–6 sagatdan çalşylmaly, köp gan akma günlerinde has ýygy. Ony yzygiderli çalşyp durmak rahat galmaga we ýakyn ýerleriň arassaçylygyny gowy saklamaga kömek edýär.',
    relatedTitle: '♥  Size ýarap biler',
    related: [
      {title: 'Aýbaşy gan akmaňyzy düşünmek', meta: '7 min  ·  Gollanma'},
      {title: 'Ilkinji aýbaşyňyzy gündelik durmuşda nähili dolandyrmaly?', meta: '5 min  ·  Gollanma'},
      {title: 'Ilkinji aýbaşyňyz: nämä garaşmaly', meta: '5 min  ·  Gollanma'},
    ],
    shareMessage: 'Ilkinji aýbaşym üçin haýsy goranyş serişdesini saýlamaly? — AWA',
  },
  ms: {
    badge: 'HAID PERTAMA',
    title: 'Perlindungan manakah yang patut saya pilih\nuntuk haid pertama saya?',
    metaDuration: '6 min bacaan',
    metaType: 'Panduan',
    metaLevel: 'Permulaan',
    metaValidated: 'Kandungan disemak',
    intro: 'Terdapat beberapa cara untuk melindungi diri semasa haid. Tiada satu pun yang lebih baik daripada yang lain — keselesaan peribadi yang memandu pilihan.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Pelbagai jenis perlindungan',
      'Bagaimana memilih berdasarkan keselesaan anda',
      'Bagaimana menukar perlindungan anda',
    ],
    body1: 'Untuk haid pertama anda, tuala wanita biasanya perlindungan yang paling mudah digunakan, kerana ia diletakkan terus pada seluar dalam anda. Seluar dalam haid dan tampon ialah pilihan lain yang boleh anda cuba kemudian, bila-bila masa anda mahu.',
    options: [
      {
        title: 'Tuala wanita',
        text: 'Mudah digunakan, diletakkan pada seluar dalam dan ditukar secara tetap.',
      },
      {
        title: 'Seluar dalam haid',
        text: 'Seluar dalam yang menyerap dan boleh dibasuh, yang selesa untuk kegunaan harian.',
      },
      {
        title: 'Tampon',
        text: 'Dimasukkan ke dalam tubuh; sama ada dan bila untuk menggunakannya terpulang kepada anda, mengikut rentak anda.',
      },
    ],
    body2: 'Tiada perlindungan yang betul atau salah: setiap satu sesuai dengan tubuh, tabiat dan tahap keselesaan yang berbeza. Tampon, sebagai contoh, dimasukkan ke dalam tubuh dan memerlukan sedikit lebih kebiasaan dengannya — tiada apa yang mengatakan anda mesti menggunakannya sejak haid pertama.',
    tipTitle: 'Elok diketahui',
    tipText: 'Mencuba pelbagai jenis perlindungan dari semasa ke semasa membantu anda menemui yang paling sesuai dengan anda, tanpa tekanan.',
    body3: 'Secara purata, perlindungan perlu ditukar setiap 4 hingga 6 jam, lebih kerap pada hari aliran yang lebih banyak. Menukarnya secara tetap membantu anda kekal selesa dan menjaga kebersihan intim yang baik.',
    relatedTitle: '♥  Anda mungkin juga suka',
    related: [
      {title: 'Memahami aliran haid anda', meta: '7 min  ·  Panduan'},
      {title: 'Bagaimana menguruskan haid pertama anda sehari-hari?', meta: '5 min  ·  Panduan'},
      {title: 'Haid pertama anda: apa yang dijangka', meta: '5 min  ·  Panduan'},
    ],
    shareMessage: 'Perlindungan manakah yang patut saya pilih untuk haid pertama saya? — AWA',
  },
  so: {
    badge: 'CAADADA UGU HORREYSA',
    title: 'Waa kuwee ilaalin ah ee aan dooran lahaa\ncaadadayda ugu horreysa?',
    metaDuration: '6 daq akhris',
    metaType: 'Hage',
    metaLevel: 'Bilow',
    metaValidated: 'Macluumaad la dib-u-eegay',
    intro: 'Dhowr hab ayaa jira oo naftaada lagu ilaaliyo inta caadadaadu jirto. Midna kan kale kama fiicna — raaxada shakhsi ahaaneed ayaa hagta doorashada.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Noocyada kala duwan ee ilaalinta',
      'Sida loo doorto iyadoo loo eegayo raaxadaada',
      'Sida loo beddelo ilaalintaada',
    ],
    body1: 'Caadadaada ugu horreysa, tuwaal waa inta badan ilaalinta ugu fudud ee la isticmaalo, maadaama ay toos u gashay dharkaaga hoose. Nillaha caadada iyo tampoonnadu waa doorashooyin kale oo aad ku dayan karto dambe, mar kasta oo aad dareento.',
    options: [
      {
        title: 'Tuwaalo',
        text: 'Way fududahay in la isticmaalo, dharka hoose ayay gelaan oo si joogto ah ayaa loo beddelaa.',
      },
      {
        title: 'Nillaha caadada',
        text: 'Dhar hoose xoog nuuga oo la dhaqi karo oo raaxo leh isticmaalka maalinlaha ah.',
      },
      {
        title: 'Tampoonno',
        text: 'Jidhka gudihiisa ayaa la geliyaa; in la isticmaalo iyo goorta waa adiga ku xiran, xawaarahaaga.',
      },
    ],
    body2: 'Ilaalin sax ah ama khalad ah ma jirto: mid kastaa wuxuu ku habboon yahay jidhka, caadooyinka, iyo heerarka raaxada kala duwan. Tampoonnada, tusaale ahaan, waxaa la geliyaa jidhka gudihiisa waxayna u baahan yihiin xoogaa aqoon dheeraad ah oo jidhka ah — waxba ma sheegaan inaad u baahan tahay inaad isticmaasho laga bilaabo caadadaada ugu horreysa.',
    tipTitle: 'Waxtar leh in la ogaado',
    tipText: 'Isku dayga noocyada kala duwan ee ilaalinta waqti ka dib wuxuu kaa caawinayaa inaad hesho midka kuugu habboon, cadaadis la’aan.',
    body3: 'Celcelis ahaan, ilaalinta waa in la beddelo 4 ilaa 6 saacadood kasta, mararka ka badan maalmaha socodku culus yahay. Beddelidda joogtada ahi waxay kaa caawisaa inaad raaxo ahaato oo aad hesho nadaafad gaar ah oo wanaagsan.',
    relatedTitle: '♥  Waxaad sidoo kale jeclaan kartaa',
    related: [
      {title: 'Fahamka socodka caadadaada', meta: '7 daq  ·  Hage'},
      {title: 'Sidee loo maamulaa caadadaada ugu horreysa maalin kasta?', meta: '5 daq  ·  Hage'},
      {title: 'Caadadaada ugu horreysa: waxa la filayo', meta: '5 daq  ·  Hage'},
    ],
    shareMessage: 'Waa kuwee ilaalin ah ee aan dooran lahaa caadadayda ugu horreysa? — AWA',
  },
  sw: {
    badge: 'HEDHI YA KWANZA',
    title: 'Nichague kinga gani\nkwa hedhi yangu ya kwanza?',
    metaDuration: 'Dakika 6 za kusoma',
    metaType: 'Mwongozo',
    metaLevel: 'Mwanzo',
    metaValidated: 'Maudhui yaliyokaguliwa',
    intro: 'Kuna njia kadhaa za kujikinga wakati wa hedhi yako. Hakuna iliyo bora kuliko nyingine — faraja binafsi ndiyo inayoongoza uchaguzi.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Aina tofauti za kinga',
      'Jinsi ya kuchagua kulingana na faraja yako',
      'Jinsi ya kubadilisha kinga yako',
    ],
    body1: 'Kwa hedhi yako ya kwanza, pedi kwa kawaida ndiyo kinga rahisi zaidi kutumia, kwa kuwa inawekwa moja kwa moja kwenye chupi yako. Chupi za hedhi na tamponi ni chaguo nyingine unazoweza kujaribu baadaye, wakati wowote unapojisikia kufanya hivyo.',
    options: [
      {
        title: 'Pedi',
        text: 'Ni rahisi kutumia, zinawekwa kwenye chupi yako na kubadilishwa mara kwa mara.',
      },
      {
        title: 'Chupi za hedhi',
        text: 'Chupi zinazofyonza na kuoshwa, zenye faraja kwa matumizi ya kila siku.',
      },
      {
        title: 'Tamponi',
        text: 'Huingizwa ndani ya mwili; kama na lini utazitumia ni juu yako, kwa mwendo wako mwenyewe.',
      },
    ],
    body2: 'Hakuna kinga sahihi wala isiyo sahihi: kila moja inafaa miili, tabia, na viwango vya faraja tofauti. Tamponi, kwa mfano, huingizwa ndani ya mwili na zinahitaji kuufahamu mwili wako zaidi kidogo — hakuna kinachosema lazima uzitumie tangu hedhi yako ya kwanza.',
    tipTitle: 'Vyema kujua',
    tipText: 'Kujaribu aina tofauti za kinga kadiri muda unavyopita kunakusaidia kupata ile inayokufaa zaidi, bila shinikizo.',
    body3: 'Kwa wastani, kinga inapaswa kubadilishwa kila baada ya saa 4 hadi 6, mara nyingi zaidi katika siku za mtiririko mzito. Kuibadilisha mara kwa mara kunakusaidia kubaki na faraja na kudumisha usafi mzuri wa sehemu za siri.',
    relatedTitle: '♥  Huenda pia ukapenda',
    related: [
      {title: 'Kuelewa mtiririko wako wa hedhi', meta: 'Dakika 7  ·  Mwongozo'},
      {title: 'Jinsi ya kusimamia hedhi yako ya kwanza kila siku?', meta: 'Dakika 5  ·  Mwongozo'},
      {title: 'Hedhi yako ya kwanza: nini cha kutarajia', meta: 'Dakika 5  ·  Mwongozo'},
    ],
    shareMessage: 'Nichague kinga gani kwa hedhi yangu ya kwanza? — AWA',
  },
  kk: {
    badge: 'АЛҒАШҚЫ ЕТЕККІР',
    title: 'Алғашқы етеккірім үшін қандай\nқорғаныс таңдауым керек?',
    metaDuration: '6 мин оқу',
    metaType: 'Нұсқаулық',
    metaLevel: 'Бастауыш',
    metaValidated: 'Тексерілген мазмұн',
    intro: 'Етеккір кезінде өзіңізді қорғаудың бірнеше жолы бар. Ешқайсысы басқасынан жақсы емес — таңдауды жеке жайлылық бағыттайды.',
    contentsTitle: 'Осы мақалада',
    topics: [
      'Қорғаныс құралдарының әртүрлі түрлері',
      'Жайлылығыңызға қарай қалай таңдау керек',
      'Қорғаныс құралын қалай ауыстыру керек',
    ],
    body1: 'Алғашқы етеккір үшін прокладка әдетте қолдануға ең қарапайым қорғаныс құралы, себебі ол тікелей іш киіміңізге бекітіледі. Етеккір іш киімі мен тампондар — кейін қаласаңыз, кез келген уақытта байқап көруге болатын басқа нұсқалар.',
    options: [
      {
        title: 'Прокладкалар',
        text: 'Қолдануға оңай, іш киімге бекітіледі және тұрақты ауыстырылады.',
      },
      {
        title: 'Етеккір іш киімі',
        text: 'Күнделікті қолдануға ыңғайлы, сіңіргіш, жууға болатын іш киім.',
      },
      {
        title: 'Тампондар',
        text: 'Дененің ішіне енгізіледі; оларды қолдану-қолданбау және қашан қолдану — өз қарқыныңызбен, сіздің қалауыңыз.',
      },
    ],
    body2: 'Дұрыс немесе бұрыс қорғаныс жоқ: әрқайсысы әртүрлі денелерге, әдеттерге және жайлылық деңгейлеріне сай. Мысалы, тампондар дененің ішіне енгізіледі және денеге сәл көбірек үйренуді қажет етеді — оларды ең алғашқы етеккірден бастап қолдану міндетті дегенді ештеңе білдірмейді.',
    tipTitle: 'Білуге тиісті',
    tipText: 'Қорғаныс құралдарының әртүрлі түрлерін уақыт өте байқап көру өзіңізге ең сайын қысымсыз табуға көмектеседі.',
    body3: 'Орта есеппен қорғаныс құралын әр 4-тен 6 сағат сайын, мол көлемді күндері жиірек ауыстыру керек. Оны тұрақты ауыстыру жайлы болуға және жақсы жеке гигиенаны сақтауға көмектеседі.',
    relatedTitle: '♥  Сізге де ұнауы мүмкін',
    related: [
      {title: 'Етеккір көлемін түсіну', meta: '7 мин  ·  Нұсқаулық'},
      {title: 'Алғашқы етеккірді күнделікті қалай басқаруға болады?', meta: '5 мин  ·  Нұсқаулық'},
      {title: 'Алғашқы етеккіріңіз: нені күту керек', meta: '5 мин  ·  Нұсқаулық'},
    ],
    shareMessage: 'Алғашқы етеккірім үшін қандай қорғаныс таңдауым керек? — AWA',
  },
  wo: {
    badge: 'RÈGLE BU NJËKK',
    title: 'Ban aar laay tànn\nngir sama règle bu njëkk?',
    metaDuration: '6 simili jàng',
    metaType: 'Ndigal',
    metaLevel: 'Tàmbali',
    metaValidated: 'Mbind bu ñu seetlu',
    intro: 'Am na ay anam yu bari ngir aar sa bopp ci sa règle. Kenn gëna baax ci keneen — sa neex mooy ki di tànn.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Xeet yi aar yi',
      'Naka ngay tànn ci sa neex',
      'Naka ngay soppi sa aar',
    ],
    body1: 'Ngir sa règle bu njëkk, pad mooy aar bi gëna yomb a jëfandikoo ci yoon, ndax dafay dugg ci sa mbubb. Mbubb ngir règle ak tampoŋ yeneen tànneef lañu yu nga mën a jéem ginnaaw, bu nga ko bëggee.',
    options: [
      {
        title: 'Pad',
        text: 'Yomb a jëfandikoo, dañuy dugg ci sa mbubb te soppi leen ci yoon.',
      },
      {
        title: 'Mbubb ngir règle',
        text: 'Mbubb bu ñu mën a sab te mu nooy ngir jëfandikoo ci bés bu nekk.',
      },
      {
        title: 'Tampoŋ',
        text: 'Dañuy dugg ci biir yaram; jëfandikoo ko walla bañ ko ak kañ, yaw la, ci sa ritm.',
      },
    ],
    body2: 'Amul aar bu jub walla bu bon: bu nekk dafay méngoo ay yaram, ay yoon ak ay neex yu wuute. Tampoŋ yi, misaal, dañuy dugg ci biir yaram te soxla xam yaram bu gëna bari — amul lu tax nga war a jëfandikoo leen ci sa règle bu njëkk.',
    tipTitle: 'Lu baax a xam',
    tipText: 'Jéem ay xeetu aar ci jamono dafay la dimbli nga gis bi gëna méngoo, te coono amul.',
    body3: 'Ci digg-dóomu, war nañu soppi aar bi ci 4 ba 6 waxtu, gën a bari ci fan yu deret bi bari. Soppi ko ci yoon dafay dimbli nga nekk ci neex te des ci set bu baax.',
    relatedTitle: '♥  Mën nga bëgg itam',
    related: [
      {title: 'Xam sa deret bu règle', meta: '7 simili  ·  Ndigal'},
      {title: 'Naka laay yor sama règle bu njëkk bés ak bés?', meta: '5 simili  ·  Ndigal'},
      {title: 'Sa règle bu njëkk: lu ñuy xaar', meta: '5 simili  ·  Ndigal'},
    ],
    shareMessage: 'Ban aar laay tànn ngir sama règle bu njëkk? — AWA',
  },
  ha: {
    badge: 'HAILAR FARKO',
    title: 'Wace kariya zan zaɓa\ndon hailata ta farko?',
    metaDuration: 'karatun minti 6',
    metaType: 'Jagora',
    metaLevel: 'Mafari',
    metaValidated: 'Abun da aka duba',
    intro: 'Akwai hanyoyi da dama na kare kanki lokacin haila. Babu wacce ta fi wata — jin daɗin kanki shi ne ke jagorantar zaɓi.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Nau’ikan kariya daban-daban',
      'Yadda za a zaɓa bisa jin daɗinki',
      'Yadda za a canza kariyarki',
    ],
    body1: 'Ga hailarki ta farko, audugar haila yawanci ita ce kariya mafi sauƙin amfani, tunda tana shiga kai tsaye a rigar cikinki. Rigar ciki ta haila da tampon wasu zaɓuɓɓuka ne da za ki iya gwadawa daga baya, duk lokacin da kika ga dama.',
    options: [
      {
        title: 'Audugar haila',
        text: 'Sauƙin amfani, tana shiga a rigar ciki kuma ana canza ta akai-akai.',
      },
      {
        title: 'Rigar ciki ta haila',
        text: 'Rigar ciki mai shan jini, wacce ake wankewa, mai daɗi don amfanin yau da kullum.',
      },
      {
        title: 'Tampon',
        text: 'Ana shigar da shi cikin jiki; ko za a yi amfani da shi da lokacin yin hakan naki ne, bisa saurinki.',
      },
    ],
    body2: 'Babu kariya daidai ko kuskure: kowacce tana dacewa da jiki, dabi’u, da matakan jin daɗi daban-daban. Tampon, misali, ana shigar da shi cikin jiki kuma yana bukatar ƙarin sanin jikin — babu abin da ya ce dole ne ki yi amfani da su tun daga hailarki ta farko.',
    tipTitle: 'Abin da ya dace a sani',
    tipText: 'Gwada nau’ikan kariya daban-daban a kan lokaci yana taimaka miki ki sami wacce ta fi dacewa da ke, ba tare da matsi ba.',
    body3: 'A matsakaici, ya kamata a canza kariya kowane sa’a 4 zuwa 6, ya fi yawa a kwanakin da jini ya fi yawa. Canza ta akai-akai yana taimaka miki ki ji daɗi kuma ki kula da tsabtar al’aura mai kyau.',
    relatedTitle: '♥  Kila ma za ki so',
    related: [
      {title: 'Fahimtar yawan jinin hailarki', meta: 'minti 7  ·  Jagora'},
      {title: 'Yadda za a gudanar da hailar farko kullum?', meta: 'minti 5  ·  Jagora'},
      {title: 'Hailarki ta farko: abin da za ki tsammata', meta: 'minti 5  ·  Jagora'},
    ],
    shareMessage: 'Wace kariya zan zaɓa don hailata ta farko? — AWA',
  },
  am: {
    badge: 'የመጀመሪያ የወር አበባ',
    title: 'ለመጀመሪያ የወር አበባዬ የትኛውን\nመከላከያ ልምረጥ?',
    metaDuration: '6 ደቂቃ ንባብ',
    metaType: 'መመሪያ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'የተረጋገጠ ይዘት',
    intro: 'በወር አበባሽ ጊዜ ራስሽን ለመጠበቅ በርካታ መንገዶች አሉ። አንዳቸውም ከሌላው አይሻልም — ምርጫውን የሚመራው የግል ምቾት ነው።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'የተለያዩ የመከላከያ ዓይነቶች',
      'በምቾትሽ መሠረት እንዴት መምረጥ',
      'መከላከያሽን እንዴት መቀየር',
    ],
    body1: 'ለመጀመሪያ የወር አበባሽ ሞዴስ ብዙውን ጊዜ ለመጠቀም በጣም ቀላሉ መከላከያ ነው፣ ምክንያቱም በቀጥታ በውስጥ ልብስሽ ውስጥ ይገባል። የወር አበባ የውስጥ ልብስና ታምፖን በኋላ፣ በፈለግሽ ጊዜ ልትሞክሪያቸው የምትችያቸው ሌሎች አማራጮች ናቸው።',
    options: [
      {
        title: 'ሞዴስ',
        text: 'ለመጠቀም ቀላል፣ በውስጥ ልብስሽ ውስጥ ይገባል እና በየጊዜው ይቀየራል።',
      },
      {
        title: 'የወር አበባ የውስጥ ልብስ',
        text: 'ለዕለታዊ አጠቃቀም ምቹ የሆነ ፈሳሽ የሚስብ፣ የሚታጠብ የውስጥ ልብስ።',
      },
      {
        title: 'ታምፖን',
        text: 'ወደ ሰውነት ውስጥ ይገባል፤ ለመጠቀም ወይም መቼ ለመጠቀም ወሳኙ አንቺ ነሽ፣ በራስሽ ፍጥነት።',
      },
    ],
    body2: 'ትክክል ወይም ስህተት መከላከያ የለም፦ እያንዳንዱ ለተለያዩ አካላት፣ ልማዶችና የምቾት ደረጃዎች ይስማማል። ታምፖን፣ ለምሳሌ፣ ወደ ሰውነት ውስጥ ይገባል እና ከሰውነት ጋር ትንሽ ተጨማሪ መተዋወቅን ይጠይቃል — ከመጀመሪያ የወር አበባሽ ጀምሮ መጠቀም አለብሽ የሚል ምንም ነገር የለም።',
    tipTitle: 'ማወቅ ጠቃሚ ነው',
    tipText: 'በጊዜ ሂደት የተለያዩ የመከላከያ ዓይነቶችን መሞከር ያለ ጫና በጣም የሚስማማሽን እንድታገኚ ይረዳሻል።',
    body3: 'በአማካይ መከላከያ በየ4 እስከ 6 ሰዓት መቀየር አለበት፣ ፍሰት በሚበዛባቸው ቀናት ደግሞ በተደጋጋሚ። በየጊዜው መቀየር ምቾት እንዲሰማሽና ጥሩ የግል ንጽሕናን እንድትጠብቂ ይረዳሻል።',
    relatedTitle: '♥  ሊወዱትም ይችላሉ',
    related: [
      {title: 'የወር አበባ ፍሰትሽን መረዳት', meta: '7 ደቂቃ  ·  መመሪያ'},
      {title: 'የመጀመሪያ የወር አበባን በየቀኑ እንዴት መቆጣጠር?', meta: '5 ደቂቃ  ·  መመሪያ'},
      {title: 'የመጀመሪያ የወር አበባሽ፦ ምን መጠበቅ', meta: '5 ደቂቃ  ·  መመሪያ'},
    ],
    shareMessage: 'ለመጀመሪያ የወር አበባዬ የትኛውን መከላከያ ልምረጥ? — AWA',
  },
  nl: {
    badge: 'EERSTE MENSTRUATIE',
    title: 'Welke bescherming kies ik\nvoor mijn eerste menstruatie?',
    metaDuration: '6 min lezen',
    metaType: 'Gids',
    metaLevel: 'Beginner',
    metaValidated: 'Gecontroleerde inhoud',
    intro: 'Er zijn meerdere manieren om jezelf tijdens je menstruatie te beschermen. Geen enkele is beter dan een andere — persoonlijk comfort bepaalt de keuze.',
    contentsTitle: 'In dit artikel',
    topics: [
      'De verschillende soorten bescherming',
      'Hoe je kiest op basis van je comfort',
      'Hoe je je bescherming verwisselt',
    ],
    body1: 'Voor je eerste menstruatie is maandverband meestal de eenvoudigste bescherming om te gebruiken, omdat het rechtstreeks in je ondergoed gaat. Menstruatieondergoed en tampons zijn andere opties die je later kunt proberen, wanneer je daar zin in hebt.',
    options: [
      {
        title: 'Maandverband',
        text: 'Eenvoudig te gebruiken, het gaat in je ondergoed en wordt regelmatig verwisseld.',
      },
      {
        title: 'Menstruatieondergoed',
        text: 'Absorberend, wasbaar ondergoed dat comfortabel is voor dagelijks gebruik.',
      },
      {
        title: 'Tampons',
        text: 'Worden in het lichaam ingebracht; of en wanneer je ze gebruikt, bepaal je zelf, in je eigen tempo.',
      },
    ],
    body2: 'Er bestaat geen juiste of foute bescherming: elke past bij andere lichamen, gewoonten en comfortniveaus. Tampons worden bijvoorbeeld in het lichaam ingebracht en vragen iets meer vertrouwdheid met het lichaam — niets zegt dat je ze vanaf je allereerste menstruatie moet gebruiken.',
    tipTitle: 'Goed om te weten',
    tipText: 'Na verloop van tijd verschillende soorten bescherming proberen helpt je de soort te vinden die het best bij je past, zonder druk.',
    body3: 'Gemiddeld moet bescherming elke 4 tot 6 uur worden verwisseld, vaker op dagen met een hevigere bloeding. Regelmatig verwisselen helpt je comfortabel te blijven en een goede intieme hygiëne te behouden.',
    relatedTitle: '♥  Misschien vind je dit ook leuk',
    related: [
      {title: 'Je menstruatiebloeding begrijpen', meta: '7 min  ·  Gids'},
      {title: 'Hoe beheer je je eerste menstruatie in het dagelijks leven?', meta: '5 min  ·  Gids'},
      {title: 'Je eerste menstruatie: wat je kunt verwachten', meta: '5 min  ·  Gids'},
    ],
    shareMessage: 'Welke bescherming kies ik voor mijn eerste menstruatie? — AWA',
  },
  fi: {
    badge: 'ENSIMMÄISET KUUKAUTISET',
    title: 'Minkä suojan valitsen\nensimmäisiin kuukautisiini?',
    metaDuration: '6 min lukuaika',
    metaType: 'Opas',
    metaLevel: 'Aloittelija',
    metaValidated: 'Tarkistettu sisältö',
    intro: 'Kuukautisten aikana on useita tapoja suojautua. Mikään ei ole toista parempi — henkilökohtainen mukavuus ohjaa valintaa.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Eri suojatyypit',
      'Miten valita mukavuutesi mukaan',
      'Miten vaihdat suojaasi',
    ],
    body1: 'Ensimmäisiin kuukautisiin side on yleensä yksinkertaisin käyttää, koska se asetetaan suoraan alushousuihin. Kuukautisalushousut ja tamponit ovat muita vaihtoehtoja, joita voit kokeilla myöhemmin, kun siltä tuntuu.',
    options: [
      {
        title: 'Siteet',
        text: 'Helppoja käyttää, ne asetetaan alushousuihin ja vaihdetaan säännöllisesti.',
      },
      {
        title: 'Kuukautisalushousut',
        text: 'Imukykyiset, pestävät alushousut, jotka ovat mukavat arkikäytössä.',
      },
      {
        title: 'Tamponit',
        text: 'Asetetaan kehon sisään; käytätkö niitä ja milloin, on sinun päätettävissäsi omaan tahtiisi.',
      },
    ],
    body2: 'Oikeaa tai väärää suojaa ei ole: kukin sopii eri kehoille, tavoille ja mukavuustasoille. Tamponit esimerkiksi asetetaan kehon sisään ja vaativat hieman enemmän tutustumista omaan kehoon — mikään ei sano, että niitä pitäisi käyttää jo ensimmäisistä kuukautisista lähtien.',
    tipTitle: 'Hyvä tietää',
    tipText: 'Eri suojatyyppien kokeilu ajan myötä auttaa löytämään sinulle parhaiten sopivan ilman painetta.',
    body3: 'Keskimäärin suoja tulisi vaihtaa 4–6 tunnin välein, runsaampina vuotopäivinä useammin. Säännöllinen vaihto auttaa pysymään mukavana ja ylläpitämään hyvää intiimihygieniaa.',
    relatedTitle: '♥  Saatat pitää myös näistä',
    related: [
      {title: 'Kuukautisvuotosi ymmärtäminen', meta: '7 min  ·  Opas'},
      {title: 'Miten hallitset ensimmäiset kuukautisesi arjessa?', meta: '5 min  ·  Opas'},
      {title: 'Ensimmäiset kuukautisesi: mitä odottaa', meta: '5 min  ·  Opas'},
    ],
    shareMessage: 'Minkä suojan valitsen ensimmäisiin kuukautisiini? — AWA',
  },
  el: {
    badge: 'ΠΡΩΤΗ ΠΕΡΙΟΔΟΣ',
    title: 'Ποια προστασία να επιλέξω\nγια την πρώτη μου περίοδο;',
    metaDuration: '6 λεπτά ανάγνωσης',
    metaType: 'Οδηγός',
    metaLevel: 'Αρχάριο',
    metaValidated: 'Ελεγμένο περιεχόμενο',
    intro: 'Υπάρχουν διάφοροι τρόποι προστασίας κατά την περίοδο. Κανένας δεν είναι καλύτερος από τους άλλους — η προσωπική άνεση καθοδηγεί την επιλογή.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Οι διαφορετικοί τύποι προστασίας',
      'Πώς να επιλέξεις ανάλογα με την άνεσή σου',
      'Πώς να αλλάζεις την προστασία σου',
    ],
    body1: 'Για την πρώτη περίοδο, η σερβιέτα είναι συνήθως η απλούστερη προστασία, αφού μπαίνει απευθείας στο εσώρουχό σου. Τα εσώρουχα περιόδου και τα ταμπόν είναι άλλες επιλογές που μπορείς να δοκιμάσεις αργότερα, όποτε θελήσεις.',
    options: [
      {
        title: 'Σερβιέτες',
        text: 'Εύκολες στη χρήση, μπαίνουν στο εσώρουχο και αλλάζονται τακτικά.',
      },
      {
        title: 'Εσώρουχα περιόδου',
        text: 'Απορροφητικά, πλενόμενα εσώρουχα που είναι άνετα για καθημερινή χρήση.',
      },
      {
        title: 'Ταμπόν',
        text: 'Εισάγονται μέσα στο σώμα· το αν και το πότε θα τα χρησιμοποιήσεις εξαρτάται από σένα, με τον δικό σου ρυθμό.',
      },
    ],
    body2: 'Δεν υπάρχει σωστή ή λάθος προστασία: η καθεμία ταιριάζει σε διαφορετικά σώματα, συνήθειες και επίπεδα άνεσης. Τα ταμπόν, για παράδειγμα, εισάγονται μέσα στο σώμα και απαιτούν λίγη περισσότερη εξοικείωση με αυτό — τίποτα δεν λέει ότι πρέπει να τα χρησιμοποιήσεις από την πολύ πρώτη περίοδο.',
    tipTitle: 'Καλό είναι να γνωρίζεις',
    tipText: 'Η δοκιμή διαφορετικών τύπων προστασίας με τον καιρό σε βοηθά να βρεις αυτόν που σου ταιριάζει καλύτερα, χωρίς πίεση.',
    body3: 'Κατά μέσο όρο, η προστασία πρέπει να αλλάζεται κάθε 4 έως 6 ώρες, πιο συχνά τις ημέρες με πιο έντονη ροή. Η τακτική αλλαγή σε βοηθά να νιώθεις άνετα και να διατηρείς καλή ευαίσθητη υγιεινή.',
    relatedTitle: '♥  Μπορεί επίσης να σου αρέσουν',
    related: [
      {title: 'Κατανοώντας την εμμηνορροϊκή ροή σου', meta: '7 λεπτά  ·  Οδηγός'},
      {title: 'Πώς να διαχειριστείς την πρώτη σου περίοδο στην καθημερινότητα;', meta: '5 λεπτά  ·  Οδηγός'},
      {title: 'Η πρώτη σου περίοδος: τι να περιμένεις', meta: '5 λεπτά  ·  Οδηγός'},
    ],
    shareMessage: 'Ποια προστασία να επιλέξω για την πρώτη μου περίοδο; — AWA',
  },
  fil: {
    badge: 'UNANG REGLA',
    title: 'Anong proteksyon ang pipiliin ko\npara sa unang regla?',
    metaDuration: '6 min na babasahin',
    metaType: 'Gabay',
    metaLevel: 'Baguhan',
    metaValidated: 'Sinuring nilalaman',
    intro: 'May iba’t ibang paraan para protektahan ang sarili habang may regla. Walang mas mainam kaysa sa iba — ang personal na ginhawa ang gumagabay sa pagpili.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Ang iba’t ibang uri ng proteksyon',
      'Paano pumili ayon sa iyong ginhawa',
      'Paano palitan ang iyong proteksyon',
    ],
    body1: 'Para sa unang regla, karaniwang ang napkin ang pinakasimpleng proteksyon, dahil direkta itong inilalagay sa iyong panloob. Ang panloob na pang-regla at ang mga tampon ay iba pang opsyon na maaari mong subukan sa ibang pagkakataon, kapag gusto mo na.',
    options: [
      {
        title: 'Mga napkin',
        text: 'Madaling gamitin, inilalagay sa panloob at regular na pinapalitan.',
      },
      {
        title: 'Panloob na pang-regla',
        text: 'Sumisipsip at nahuhugasang panloob na komportable para sa pang-araw-araw na gamit.',
      },
      {
        title: 'Mga tampon',
        text: 'Ipinapasok sa loob ng katawan; nasa iyo kung gagamitin at kailan, sa sarili mong bilis.',
      },
    ],
    body2: 'Walang tama o maling proteksyon: bawat isa ay angkop sa iba’t ibang katawan, gawi, at antas ng ginhawa. Ang mga tampon, halimbawa, ay ipinapasok sa loob ng katawan at nangangailangan ng kaunti pang pagiging pamilyar dito — walang nagsasabing kailangan mong gamitin ang mga ito mula sa pinakaunang regla.',
    tipTitle: 'Mabuting malaman',
    tipText: 'Ang pagsubok ng iba’t ibang uri ng proteksyon sa paglipas ng panahon ay tumutulong sa iyong mahanap ang pinakaangkop sa iyo, walang pressure.',
    body3: 'Sa karaniwan, dapat palitan ang proteksyon tuwing 4 hanggang 6 na oras, mas madalas sa mga araw na mas malakas ang daloy. Ang regular na pagpapalit ay tumutulong na manatili kang komportable at mapanatili ang mabuting intimate hygiene.',
    relatedTitle: '♥  Maaaring magustuhan mo rin',
    related: [
      {title: 'Pag-unawa sa iyong daloy ng regla', meta: '7 min  ·  Gabay'},
      {title: 'Paano pangasiwaan ang iyong unang regla sa araw-araw?', meta: '5 min  ·  Gabay'},
      {title: 'Ang iyong unang regla: ano ang aasahan', meta: '5 min  ·  Gabay'},
    ],
    shareMessage: 'Anong proteksyon ang pipiliin ko para sa unang regla? — AWA',
  },
  ta: {
    badge: 'முதல் மாதவிடாய்',
    title: 'என் முதல் மாதவிடாய்க்கு\nஎந்தப் பாதுகாப்பைத் தேர்ந்தெடுப்பது?',
    metaDuration: '6 நிமிடம் படிக்க',
    metaType: 'வழிகாட்டி',
    metaLevel: 'தொடக்க நிலை',
    metaValidated: 'சரிபார்க்கப்பட்ட உள்ளடக்கம்',
    intro: 'மாதவிடாயின்போது உங்களைப் பாதுகாத்துக்கொள்ள பல வழிகள் உள்ளன. எதுவும் மற்றொன்றை விடச் சிறந்தது அல்ல — தனிப்பட்ட வசதியே தேர்வை வழிநடத்துகிறது.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      'பாதுகாப்பின் பல்வேறு வகைகள்',
      'உங்கள் வசதியின் அடிப்படையில் எப்படித் தேர்ந்தெடுப்பது',
      'உங்கள் பாதுகாப்பை எப்படி மாற்றுவது',
    ],
    body1: 'உங்கள் முதல் மாதவிடாய்க்கு, நாப்கின் பொதுவாகப் பயன்படுத்த எளிமையான பாதுகாப்பு, ஏனெனில் அது நேரடியாக உங்கள் உள்ளாடையில் வைக்கப்படுகிறது. மாதவிடாய் உள்ளாடையும் டேம்பன்களும் நீங்கள் விரும்பும்போது, பின்னர் முயலக்கூடிய மற்ற விருப்பங்கள்.',
    options: [
      {
        title: 'நாப்கின்கள்',
        text: 'பயன்படுத்த எளிது, உள்ளாடையில் வைத்து தொடர்ந்து மாற்றப்படுகின்றன.',
      },
      {
        title: 'மாதவிடாய் உள்ளாடை',
        text: 'அன்றாடப் பயன்பாட்டுக்கு வசதியான, உறிஞ்சும், துவைக்கக்கூடிய உள்ளாடை.',
      },
      {
        title: 'டேம்பன்கள்',
        text: 'உடலுக்குள் செலுத்தப்படுகின்றன; பயன்படுத்துவதா, எப்போது என்பது உங்கள் வேகத்தில் உங்கள் விருப்பம்.',
      },
    ],
    body2: 'சரி தவறான பாதுகாப்பு என்று எதுவும் இல்லை: ஒவ்வொன்றும் வெவ்வேறு உடல்களுக்கும், பழக்கங்களுக்கும், வசதி நிலைகளுக்கும் பொருந்தும். எடுத்துக்காட்டாக, டேம்பன்கள் உடலுக்குள் செலுத்தப்படுகின்றன, அதில் சற்று அதிகப் பரிச்சயம் தேவை — உங்கள் மிக முதல் மாதவிடாயிலிருந்தே அவற்றைப் பயன்படுத்த வேண்டும் என்று எதுவும் சொல்லவில்லை.',
    tipTitle: 'தெரிந்துகொள்ளுங்கள்',
    tipText: 'காலப்போக்கில் வெவ்வேறு வகைப் பாதுகாப்பை முயல்வது, அழுத்தம் இல்லாமல், உங்களுக்கு மிகப் பொருந்தும் ஒன்றைக் கண்டறிய உதவுகிறது.',
    body3: 'சராசரியாக, பாதுகாப்பை ஒவ்வொரு 4 முதல் 6 மணிநேரத்துக்கும் மாற்ற வேண்டும், அதிக ஓட்டமுள்ள நாட்களில் அடிக்கடி. தொடர்ந்து மாற்றுவது நீங்கள் வசதியாக இருக்கவும், நல்ல அந்தரங்கச் சுகாதாரத்தைப் பேணவும் உதவுகிறது.',
    relatedTitle: '♥  உங்களுக்குப் பிடிக்கக்கூடியவை',
    related: [
      {title: 'உங்கள் மாதவிடாய் ஓட்டத்தைப் புரிந்துகொள்ளுதல்', meta: '7 நிமிடம்  ·  வழிகாட்டி'},
      {title: 'உங்கள் முதல் மாதவிடாயை அன்றாடம் எப்படிக் கையாள்வது?', meta: '5 நிமிடம்  ·  வழிகாட்டி'},
      {title: 'உங்கள் முதல் மாதவிடாய்: என்ன எதிர்பார்ப்பது', meta: '5 நிமிடம்  ·  வழிகாட்டி'},
    ],
    shareMessage: 'என் முதல் மாதவிடாய்க்கு எந்தப் பாதுகாப்பைத் தேர்ந்தெடுப்பது? — AWA',
  },
  te: {
    badge: 'మొదటి నెలసరి',
    title: 'నా మొదటి నెలసరికి\nఏ రక్షణను ఎంచుకోవాలి?',
    metaDuration: '6 నిమిషాల పఠనం',
    metaType: 'గైడ్',
    metaLevel: 'ప్రారంభ స్థాయి',
    metaValidated: 'మదింపు చేసిన కంటెంట్',
    intro: 'మీ నెలసరిలో మిమ్మల్ని మీరు రక్షించుకోవడానికి అనేక మార్గాలు ఉన్నాయి. ఏదీ మరొకదాని కంటే మెరుగైనది కాదు — వ్యక్తిగత సౌకర్యమే ఎంపికకు మార్గనిర్దేశం చేస్తుంది.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      'వివిధ రకాల రక్షణలు',
      'మీ సౌకర్యం ఆధారంగా ఎలా ఎంచుకోవాలి',
      'మీ రక్షణను ఎలా మార్చాలి',
    ],
    body1: 'మీ మొదటి నెలసరికి, ప్యాడ్ సాధారణంగా ఉపయోగించడానికి అత్యంత సరళమైన రక్షణ, ఎందుకంటే అది నేరుగా మీ లోదుస్తుల్లోకి వెళ్తుంది. నెలసరి అండర్‌వేర్, టాంపోన్లు మీకు ఇష్టమైనప్పుడు తర్వాత ప్రయత్నించగల ఇతర ఎంపికలు.',
    options: [
      {
        title: 'ప్యాడ్లు',
        text: 'ఉపయోగించడానికి సులభం, అవి మీ లోదుస్తుల్లో ఉంచబడి క్రమం తప్పకుండా మార్చబడతాయి.',
      },
      {
        title: 'నెలసరి అండర్‌వేర్',
        text: 'రోజువారీ ఉపయోగానికి సౌకర్యవంతమైన, శోషించే, ఉతకగల అండర్‌వేర్.',
      },
      {
        title: 'టాంపోన్లు',
        text: 'శరీరం లోపల ఉంచబడతాయి; వాటిని ఉపయోగించాలా, ఎప్పుడు అనేది మీ సొంత వేగంలో మీ ఇష్టం.',
      },
    ],
    body2: 'సరైన లేదా తప్పు రక్షణ అంటూ ఏదీ లేదు: ప్రతి ఒక్కటి భిన్న శరీరాలకు, అలవాట్లకు, సౌకర్య స్థాయిలకు సరిపోతుంది. ఉదాహరణకు, టాంపోన్లు శరీరం లోపల ఉంచబడతాయి, మీ శరీరంతో కొంచెం ఎక్కువ పరిచయం అవసరం — మీ మొదటి నెలసరి నుండే వాటిని ఉపయోగించాలని ఏదీ చెప్పడం లేదు.',
    tipTitle: 'తెలుసుకోవాల్సినవి',
    tipText: 'కాలక్రమేణా వేర్వేరు రక్షణ రకాలను ప్రయత్నించడం, ఒత్తిడి లేకుండా, మీకు బాగా సరిపోయేదాన్ని కనుగొనడానికి సహాయపడుతుంది.',
    body3: 'సగటున, రక్షణను ప్రతి 4 నుండి 6 గంటలకు మార్చాలి, ఎక్కువ రక్తస్రావం ఉన్న రోజుల్లో మరింత తరచుగా. దాన్ని క్రమం తప్పకుండా మార్చడం మీరు సౌకర్యంగా ఉండటానికి, మంచి సన్నిహిత పరిశుభ్రతను పాటించడానికి సహాయపడుతుంది.',
    relatedTitle: '♥  మీకు ఇవి కూడా నచ్చవచ్చు',
    related: [
      {title: 'మీ నెలసరి రక్తస్రావాన్ని అర్థం చేసుకోవడం', meta: '7 ని  ·  గైడ్'},
      {title: 'మీ మొదటి నెలసరిని రోజువారీగా ఎలా నిర్వహించాలి?', meta: '5 ని  ·  గైడ్'},
      {title: 'మీ మొదటి నెలసరి: ఏమి ఆశించాలి', meta: '5 ని  ·  గైడ్'},
    ],
    shareMessage: 'నా మొదటి నెలసరికి ఏ రక్షణను ఎంచుకోవాలి? — AWA',
  },
  mr: {
    badge: 'पहिली पाळी',
    title: 'माझ्या पहिल्या पाळीसाठी\nमी कोणते संरक्षण निवडावे?',
    metaDuration: '6 मिनिटे वाचन',
    metaType: 'मार्गदर्शक',
    metaLevel: 'प्रारंभ स्तर',
    metaValidated: 'पुनरावलोकन केलेला मजकूर',
    intro: 'पाळीदरम्यान स्वतःचे संरक्षण करण्याचे अनेक मार्ग आहेत. कोणताही दुसऱ्यापेक्षा चांगला नाही — निवड वैयक्तिक आराम ठरवतो.',
    contentsTitle: 'या लेखात',
    topics: [
      'संरक्षणाचे वेगवेगळे प्रकार',
      'तुमच्या आरामानुसार कसे निवडावे',
      'तुमचे संरक्षण कसे बदलावे',
    ],
    body1: 'तुमच्या पहिल्या पाळीसाठी पॅड हे सहसा वापरण्यास सर्वात सोपे संरक्षण असते, कारण ते थेट तुमच्या अंतर्वस्त्रात लावले जाते. पाळीसाठीचे अंतर्वस्त्र आणि टॅम्पॉन हे इतर पर्याय आहेत जे तुम्हाला वाटेल तेव्हा नंतर तुम्ही वापरून पाहू शकता.',
    options: [
      {
        title: 'पॅड',
        text: 'वापरण्यास सोपे, ते तुमच्या अंतर्वस्त्रात लावले जातात आणि नियमितपणे बदलले जातात.',
      },
      {
        title: 'पाळीसाठीचे अंतर्वस्त्र',
        text: 'शोषक, धुता येण्याजोगे अंतर्वस्त्र जे रोजच्या वापरासाठी आरामदायी असते.',
      },
      {
        title: 'टॅम्पॉन',
        text: 'शरीराच्या आत घातले जातात; ते वापरायचे की नाही आणि केव्हा, हे तुमच्या गतीने तुमच्यावर अवलंबून आहे.',
      },
    ],
    body2: 'कोणतेही संरक्षण योग्य किंवा अयोग्य नसते: प्रत्येक वेगवेगळ्या शरीरांना, सवयींना आणि आराम पातळींना साजेसे असते. उदाहरणार्थ, टॅम्पॉन शरीराच्या आत घातले जातात आणि त्यासाठी शरीराशी थोडी जास्त ओळख लागते — तुमच्या अगदी पहिल्या पाळीपासूनच ते वापरावे लागतील असे कुठेही म्हटलेले नाही.',
    tipTitle: 'हे जाणून घ्या',
    tipText: 'कालांतराने संरक्षणाचे वेगवेगळे प्रकार वापरून पाहिल्याने तुम्हाला, कोणत्याही दबावाशिवाय, तुम्हाला सर्वात जुळणारे शोधण्यास मदत होते.',
    body3: 'सरासरी, संरक्षण दर 4 ते 6 तासांनी बदलले पाहिजे, जास्त स्रावाच्या दिवशी अधिक वेळा. ते नियमितपणे बदलल्याने तुम्हाला आरामात राहण्यास आणि खाजगी भागाची चांगली स्वच्छता राखण्यास मदत होते.',
    relatedTitle: '♥  तुम्हाला हे देखील आवडेल',
    related: [
      {title: 'तुमचा मासिक पाळीचा स्राव समजून घेणे', meta: '7 मिनिटे  ·  मार्गदर्शक'},
      {title: 'तुमची पहिली पाळी रोजच्या जीवनात कशी सांभाळावी?', meta: '5 मिनिटे  ·  मार्गदर्शक'},
      {title: 'तुमची पहिली पाळी: काय अपेक्षित आहे', meta: '5 मिनिटे  ·  मार्गदर्शक'},
    ],
    shareMessage: 'माझ्या पहिल्या पाळीसाठी मी कोणते संरक्षण निवडावे? — AWA',
  },
  gu: {
    badge: 'પ્રથમ માસિક',
    title: 'મારા પ્રથમ માસિક માટે મારે\nકયું સંરક્ષણ પસંદ કરવું?',
    metaDuration: '6 મિનિટ વાંચન',
    metaType: 'માર્ગદર્શિકા',
    metaLevel: 'પ્રારંભિક સ્તર',
    metaValidated: 'પુનરાવલોકન કરેલી સામગ્રી',
    intro: 'માસિક દરમિયાન પોતાને સુરક્ષિત રાખવાની ઘણી રીતો છે. કોઈ એક બીજી કરતાં વધુ સારી નથી — પસંદગી વ્યક્તિગત આરામ પ્રમાણે થાય છે.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      'સંરક્ષણના જુદા જુદા પ્રકારો',
      'તમારા આરામ પ્રમાણે કેવી રીતે પસંદ કરવું',
      'તમારું સંરક્ષણ કેવી રીતે બદલવું',
    ],
    body1: 'પ્રથમ માસિક માટે, પેડ સામાન્ય રીતે વાપરવામાં સૌથી સરળ સંરક્ષણ છે, કારણ કે તે સીધું અંડરવેરમાં મૂકાય છે. માસિક માટેનું અંડરવેર અને ટેમ્પોન બીજા વિકલ્પો છે, જે તમે પછીથી, જ્યારે પણ મન થાય ત્યારે અજમાવી શકો છો.',
    options: [
      {
        title: 'પેડ',
        text: 'વાપરવામાં સરળ, તે અંડરવેરમાં મૂકાય છે અને નિયમિત રીતે બદલાય છે.',
      },
      {
        title: 'માસિક માટેનું અંડરવેર',
        text: 'શોષી લેતું, ધોઈ શકાય તેવું અંડરવેર જે રોજિંદા ઉપયોગ માટે આરામદાયક છે.',
      },
      {
        title: 'ટેમ્પોન',
        text: 'શરીરની અંદર મૂકાય છે; તે વાપરવા કે નહીં અને ક્યારે વાપરવા એ તમારા પર, તમારી પોતાની ગતિએ આધાર રાખે છે.',
      },
    ],
    body2: 'સાચું કે ખોટું સંરક્ષણ જેવું કંઈ નથી: દરેક જુદા જુદા શરીર, ટેવો અને આરામના સ્તરને અનુકૂળ હોય છે. ઉદાહરણ તરીકે ટેમ્પોન શરીરની અંદર મૂકાય છે અને તેના માટે શરીરથી થોડી વધુ પરિચિતતા જોઈએ — તમારે તેમને સાવ પ્રથમ માસિકથી જ વાપરવા પડે એવું કંઈ નથી.',
    tipTitle: 'જાણવા જેવું',
    tipText: 'સમય જતાં સંરક્ષણના જુદા જુદા પ્રકારો અજમાવવાથી, કોઈ દબાણ વગર, તમને સૌથી અનુકૂળ હોય તે શોધવામાં મદદ મળે છે.',
    body3: 'સરેરાશ, સંરક્ષણ દર 4 થી 6 કલાકે બદલવું જોઈએ, વધુ સ્રાવવાળા દિવસોમાં વધુ વાર. નિયમિત બદલવાથી તમે આરામદાયક રહો છો અને અંગત સ્વચ્છતા સારી રીતે જળવાય છે.',
    relatedTitle: '♥  તમને આ પણ ગમી શકે',
    related: [
      {title: 'તમારા માસિકના સ્રાવને સમજવો', meta: '7 મિનિટ  ·  માર્ગદર્શિકા'},
      {title: 'તમારા પ્રથમ માસિકને રોજિંદા જીવનમાં કેવી રીતે સંભાળવું?', meta: '5 મિનિટ  ·  માર્ગદર્શિકા'},
      {title: 'તમારું પ્રથમ માસિક: શું અપેક્ષા રાખવી', meta: '5 મિનિટ  ·  માર્ગદર્શિકા'},
    ],
    shareMessage: 'મારા પ્રથમ માસિક માટે મારે કયું સંરક્ષણ પસંદ કરવું? — AWA',
  },
  pa: {
    badge: 'ਪਹਿਲੀ ਮਾਹਵਾਰੀ',
    title: 'ਮੈਨੂੰ ਆਪਣੀ ਪਹਿਲੀ ਮਾਹਵਾਰੀ ਲਈ\nਕਿਹੜਾ ਬਚਾਅ ਵਾਲਾ ਸਾਮਾਨ ਚੁਣਨਾ ਚਾਹੀਦਾ ਹੈ?',
    metaDuration: '6 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਗਾਈਡ',
    metaLevel: 'ਸ਼ੁਰੂਆਤੀ ਪੱਧਰ',
    metaValidated: 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ',
    intro: 'ਮਾਹਵਾਰੀ ਦੌਰਾਨ ਆਪਣਾ ਬਚਾਅ ਕਰਨ ਦੇ ਕਈ ਤਰੀਕੇ ਹਨ। ਕੋਈ ਵੀ ਦੂਜੇ ਨਾਲੋਂ ਬਿਹਤਰ ਨਹੀਂ — ਚੋਣ ਨਿੱਜੀ ਆਰਾਮ ਦੇ ਆਧਾਰ \'ਤੇ ਹੁੰਦੀ ਹੈ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      'ਬਚਾਅ ਵਾਲੇ ਸਾਮਾਨ ਦੀਆਂ ਵੱਖ-ਵੱਖ ਕਿਸਮਾਂ',
      'ਆਪਣੇ ਆਰਾਮ ਅਨੁਸਾਰ ਚੋਣ ਕਿਵੇਂ ਕਰੀਏ',
      'ਸਾਮਾਨ ਕਿਵੇਂ ਬਦਲੀਏ',
    ],
    body1: 'ਪਹਿਲੀ ਮਾਹਵਾਰੀ ਲਈ ਪੈਡ ਆਮ ਤੌਰ \'ਤੇ ਵਰਤਣ ਵਿੱਚ ਸਭ ਤੋਂ ਸੌਖਾ ਹੁੰਦਾ ਹੈ, ਕਿਉਂਕਿ ਇਹ ਸਿੱਧਾ ਅੰਦਰਲੇ ਕੱਪੜੇ ਵਿੱਚ ਲੱਗਦਾ ਹੈ। ਪੀਰੀਅਡ ਅੰਡਰਵੀਅਰ ਅਤੇ ਟੈਂਪੂਨ ਹੋਰ ਵਿਕਲਪ ਹਨ ਜੋ ਤੁਸੀਂ ਬਾਅਦ ਵਿੱਚ, ਜਦੋਂ ਵੀ ਮਨ ਕਰੇ, ਅਜ਼ਮਾ ਸਕਦੇ ਹੋ।',
    options: [
      {
        title: 'ਪੈਡ',
        text: 'ਵਰਤਣ ਵਿੱਚ ਸੌਖੇ, ਇਹ ਅੰਦਰਲੇ ਕੱਪੜੇ ਵਿੱਚ ਲੱਗਦੇ ਹਨ ਅਤੇ ਨਿਯਮਿਤ ਬਦਲੇ ਜਾਂਦੇ ਹਨ।',
      },
      {
        title: 'ਪੀਰੀਅਡ ਅੰਡਰਵੀਅਰ',
        text: 'ਸੋਖਣ ਵਾਲਾ, ਧੋਣਯੋਗ ਅੰਦਰਲਾ ਕੱਪੜਾ ਜੋ ਰੋਜ਼ਾਨਾ ਵਰਤੋਂ ਲਈ ਆਰਾਮਦਾਇਕ ਹੈ।',
      },
      {
        title: 'ਟੈਂਪੂਨ',
        text: 'ਸਰੀਰ ਦੇ ਅੰਦਰ ਪਾਏ ਜਾਂਦੇ ਹਨ; ਇਨ੍ਹਾਂ ਨੂੰ ਵਰਤਣਾ ਹੈ ਜਾਂ ਨਹੀਂ ਅਤੇ ਕਦੋਂ, ਇਹ ਤੁਹਾਡੀ ਮਰਜ਼ੀ ਅਤੇ ਤੁਹਾਡੀ ਰਫ਼ਤਾਰ \'ਤੇ ਨਿਰਭਰ ਹੈ।',
      },
    ],
    body2: 'ਕੋਈ ਸਹੀ ਜਾਂ ਗ਼ਲਤ ਸਾਮਾਨ ਨਹੀਂ ਹੁੰਦਾ: ਹਰ ਇੱਕ ਵੱਖ-ਵੱਖ ਸਰੀਰਾਂ, ਆਦਤਾਂ ਅਤੇ ਆਰਾਮ ਦੇ ਪੱਧਰਾਂ ਲਈ ਢੁਕਵਾਂ ਹੁੰਦਾ ਹੈ। ਉਦਾਹਰਣ ਵਜੋਂ ਟੈਂਪੂਨ ਸਰੀਰ ਦੇ ਅੰਦਰ ਪਾਏ ਜਾਂਦੇ ਹਨ ਅਤੇ ਆਪਣੇ ਸਰੀਰ ਨਾਲ ਥੋੜ੍ਹੀ ਹੋਰ ਜਾਣ-ਪਛਾਣ ਮੰਗਦੇ ਹਨ — ਇਹ ਕਿਤੇ ਨਹੀਂ ਕਹਿੰਦਾ ਕਿ ਤੁਹਾਨੂੰ ਇਹ ਬਿਲਕੁਲ ਪਹਿਲੀ ਮਾਹਵਾਰੀ ਤੋਂ ਹੀ ਵਰਤਣੇ ਪੈਣਗੇ।',
    tipTitle: 'ਜਾਣਨ ਯੋਗ',
    tipText: 'ਸਮੇਂ ਨਾਲ ਵੱਖ-ਵੱਖ ਕਿਸਮਾਂ ਅਜ਼ਮਾਉਣ ਨਾਲ ਤੁਹਾਨੂੰ ਉਹ ਲੱਭਣ ਵਿੱਚ ਮਦਦ ਮਿਲਦੀ ਹੈ ਜੋ ਤੁਹਾਡੇ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਹੈ, ਬਿਨਾਂ ਕਿਸੇ ਦਬਾਅ ਦੇ।',
    body3: 'ਔਸਤਨ, ਇਹ ਸਾਮਾਨ ਹਰ 4 ਤੋਂ 6 ਘੰਟਿਆਂ ਬਾਅਦ ਬਦਲਣਾ ਚਾਹੀਦਾ ਹੈ, ਵੱਧ ਵਹਾਅ ਵਾਲੇ ਦਿਨਾਂ ਵਿੱਚ ਹੋਰ ਵੱਧ ਵਾਰ। ਨਿਯਮਿਤ ਬਦਲਣ ਨਾਲ ਤੁਸੀਂ ਆਰਾਮਦਾਇਕ ਰਹਿੰਦੇ ਹੋ ਅਤੇ ਨਿੱਜੀ ਅੰਗਾਂ ਦੀ ਚੰਗੀ ਸਫ਼ਾਈ ਬਣੀ ਰਹਿੰਦੀ ਹੈ।',
    relatedTitle: '♥  ਤੁਹਾਨੂੰ ਇਹ ਵੀ ਪਸੰਦ ਆ ਸਕਦਾ ਹੈ',
    related: [
      {title: 'ਆਪਣੇ ਮਾਹਵਾਰੀ ਦੇ ਵਹਾਅ ਨੂੰ ਸਮਝਣਾ', meta: '7 ਮਿੰਟ  ·  ਗਾਈਡ'},
      {title: 'ਆਪਣੀ ਪਹਿਲੀ ਮਾਹਵਾਰੀ ਨੂੰ ਰੋਜ਼ਾਨਾ ਕਿਵੇਂ ਸੰਭਾਲੀਏ?', meta: '5 ਮਿੰਟ  ·  ਗਾਈਡ'},
      {title: 'ਤੁਹਾਡੀ ਪਹਿਲੀ ਮਾਹਵਾਰੀ: ਕੀ ਉਮੀਦ ਰੱਖੀਏ', meta: '5 ਮਿੰਟ  ·  ਗਾਈਡ'},
    ],
    shareMessage: 'ਮੈਨੂੰ ਆਪਣੀ ਪਹਿਲੀ ਮਾਹਵਾਰੀ ਲਈ ਕਿਹੜਾ ਬਚਾਅ ਵਾਲਾ ਸਾਮਾਨ ਚੁਣਨਾ ਚਾਹੀਦਾ ਹੈ? — AWA',
  },
  my: {
    badge: 'ပထမဆုံးရာသီ',
    title: 'ပထမဆုံးရာသီအတွက် မည်သည့်\nကာကွယ်ရေးပစ္စည်းကို ရွေးသင့်သနည်း။',
    metaDuration: 'ဖတ်ချိန် 6 မိနစ်',
    metaType: 'လမ်းညွှန်',
    metaLevel: 'အခြေခံအဆင့်',
    metaValidated: 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ',
    intro: 'ရာသီလာစဉ် ကိုယ်ကို ကာကွယ်ရန် နည်းလမ်းအမျိုးမျိုး ရှိသည်။ မည်သည့်အရာမျှ အခြားတစ်ခုထက် မကောင်းပါ - ကိုယ်ပိုင်သက်တောင့်သက်သာမှုက ရွေးချယ်မှုကို လမ်းညွှန်သည်။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'ကာကွယ်ရေးပစ္စည်း အမျိုးအစားများ',
      'သင့်သက်တောင့်သက်သာမှုအလိုက် မည်သို့ရွေးချယ်မည်နည်း',
      'သင့်ကာကွယ်ရေးပစ္စည်းကို မည်သို့လဲမည်နည်း',
    ],
    body1: 'ပထမဆုံးရာသီအတွက် ရာသီသွေးစုပ်ပြားသည် အတွင်းခံထဲတွင် တိုက်ရိုက်ထည့်သည့်အတွက် များသောအားဖြင့် အသုံးပြုရ အရိုးရှင်းဆုံး ကာကွယ်ရေးပစ္စည်းဖြစ်သည်။ ရာသီသွေးစုပ်အတွင်းခံနှင့် တမ်ပွန်တို့သည် စိတ်ကြိုက်သည့်အချိန်တွင် နောက်ပိုင်း စမ်းသုံးနိုင်သော အခြားရွေးချယ်စရာများ ဖြစ်သည်။',
    options: [
      {
        title: 'ရာသီသွေးစုပ်ပြားများ',
        text: 'အသုံးပြုရလွယ်ကူပြီး အတွင်းခံထဲတွင် ထည့်ကာ ပုံမှန်လဲရသည်။',
      },
      {
        title: 'ရာသီသွေးစုပ်အတွင်းခံ',
        text: 'နေ့စဉ်အသုံးပြုရာတွင် သက်တောင့်သက်သာရှိပြီး စုပ်ယူနိုင်စွမ်းရှိသော လျှော်၍ရသည့် အတွင်းခံ။',
      },
      {
        title: 'တမ်ပွန်များ',
        text: 'ခန္ဓာကိုယ်အတွင်းသို့ ထည့်သွင်းသုံးရသည်၊ အသုံးပြုမည်၊ မည်သည့်အချိန် အသုံးပြုမည်ဆိုသည်မှာ ကိုယ့်အရှိန်အတိုင်း သင်ကိုယ်တိုင် ဆုံးဖြတ်ရမည့်ကိစ္စဖြစ်သည်။',
      },
    ],
    body2: 'မှန်ကန်သော သို့မဟုတ် မှားယွင်းသော ကာကွယ်ရေးပစ္စည်းဟူ၍ မရှိပါ - တစ်ခုစီသည် မတူညီသော ခန္ဓာကိုယ်များ၊ အကျင့်များနှင့် သက်တောင့်သက်သာမှုအဆင့်များနှင့် ကိုက်ညီသည်။ ဥပမာ၊ တမ်ပွန်များသည် ခန္ဓာကိုယ်အတွင်းသို့ ထည့်သွင်းသုံးရပြီး ခန္ဓာကိုယ်နှင့် ပိုမိုရင်းနှီးမှု အနည်းငယ်လိုသည် - အလွန်ပထမဆုံးရာသီမှစ၍ အသုံးပြုရမည်ဟု မည်သည့်အရာကမျှ မဆိုပါ။',
    tipTitle: 'သိထားသင့်သည်',
    tipText: 'အချိန်ကြာလာသည်နှင့်အမျှ ကာကွယ်ရေးပစ္စည်းအမျိုးအစားအမျိုးမျိုးကို စမ်းသုံးကြည့်ခြင်းက ဖိအားမရှိဘဲ သင့်အတွက် အသင့်တော်ဆုံးကို ရှာဖွေရန် ကူညီသည်။',
    body3: 'ပျမ်းမျှအားဖြင့် ကာကွယ်ရေးပစ္စည်းကို ၄ နာရီမှ ၆ နာရီတိုင်း လဲသင့်သည်၊ သွေးထွက်ပမာဏများသောနေ့များတွင် ပိုမကြာခဏ လဲသင့်သည်။ ပုံမှန်လဲခြင်းက သက်တောင့်သက်သာရှိစေပြီး ကိုယ်ရေးကိုယ်တာနေရာ သန့်ရှင်းမှုကောင်းမွန်စေရန် ကူညီသည်။',
    relatedTitle: '♥  သင်စိတ်ဝင်စားနိုင်သည့် အကြောင်းအရာများ',
    related: [
      {title: 'သင့်ရာသီသွေးထွက်ပမာဏကို နားလည်ခြင်း', meta: '7 မိနစ်  ·  လမ်းညွှန်'},
      {title: 'သင့်ပထမဆုံးရာသီကို နေ့စဉ်ဘဝတွင် မည်သို့စီမံမည်နည်း။', meta: '5 မိနစ်  ·  လမ်းညွှန်'},
      {title: 'သင့်ပထမဆုံးရာသီ၊ ဘာတွေမျှော်လင့်ရမလဲ', meta: '5 မိနစ်  ·  လမ်းညွှန်'},
    ],
    shareMessage: 'ပထမဆုံးရာသီအတွက် မည်သည့်ကာကွယ်ရေးပစ္စည်းကို ရွေးသင့်သနည်း။ — AWA',
  },
  km: {
    badge: 'រដូវដំបូង',
    title: 'តើខ្ញុំគួរជ្រើសរើសសម្ភារៈការពារអ្វី\nសម្រាប់រដូវដំបូងរបស់ខ្ញុំ?',
    metaDuration: 'អាន 6 នាទី',
    metaType: 'មគ្គុទ្ទេសក៍',
    metaLevel: 'កម្រិតដំបូង',
    metaValidated: 'មាតិកាបានពិនិត្យ',
    intro: 'មានវិធីជាច្រើនដើម្បីការពារខ្លួនក្នុងអំឡុងពេលរដូវ។ គ្មានវិធីណាល្អជាងវិធីណាទេ — ភាពស្រួលខ្លួនផ្ទាល់ខ្លួនគឺជាអ្វីដែលណែនាំការជ្រើសរើស។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'ប្រភេទផ្សេងៗនៃសម្ភារៈការពារ',
      'របៀបជ្រើសរើសតាមភាពស្រួលខ្លួនរបស់អ្នក',
      'របៀបផ្លាស់ប្តូរសម្ភារៈការពាររបស់អ្នក',
    ],
    body1: 'សម្រាប់រដូវដំបូងរបស់អ្នក ជាធម្មតាក្រណាត់អនាម័យគឺជាសម្ភារៈការពារដែលងាយប្រើបំផុត ព្រោះវាដាក់ត្រង់លើខោទ្រនាប់របស់អ្នក។ ខោទ្រនាប់សម្រាប់រដូវ និងថេមប៉ុង គឺជាជម្រើសផ្សេងទៀតដែលអ្នកអាចសាកល្បងនៅពេលក្រោយ នៅពេលណាដែលអ្នកចង់។',
    options: [
      {
        title: 'ក្រណាត់អនាម័យ',
        text: 'ងាយស្រួលប្រើ វាដាក់លើខោទ្រនាប់ ហើយត្រូវបានផ្លាស់ប្តូរជាប្រចាំ។',
      },
      {
        title: 'ខោទ្រនាប់សម្រាប់រដូវ',
        text: 'ខោទ្រនាប់ស្រូបទឹកបាន និងអាចបោកគក់បាន ដែលស្រួលពាក់ប្រចាំថ្ងៃ។',
      },
      {
        title: 'ថេមប៉ុង',
        text: 'ដាក់ចូលខាងក្នុងរាងកាយ ការប្រើវា និងពេលវេលាប្រើគឺអាស្រ័យលើអ្នក តាមល្បឿនរបស់អ្នកផ្ទាល់។',
      },
    ],
    body2: 'គ្មានសម្ភារៈការពារណាត្រឹមត្រូវ ឬខុសនោះទេ៖ នីមួយៗស័ក្តិសមនឹងរាងកាយ ទម្លាប់ និងកម្រិតភាពស្រួលខ្លួនខុសៗគ្នា។ ឧទាហរណ៍ ថេមប៉ុងត្រូវដាក់ចូលខាងក្នុងរាងកាយ ហើយត្រូវការភាពស៊ាំនឹងរាងកាយបន្តិចទៀត — គ្មានអ្វីបង្ខំឱ្យអ្នកប្រើវាតាំងពីរដូវដំបូងបំផុតរបស់អ្នកនោះទេ។',
    tipTitle: 'គួរដឹង',
    tipText: 'ការសាកល្បងសម្ភារៈការពារប្រភេទផ្សេងៗតាមពេលវេលា ជួយអ្នករកប្រភេទដែលសមនឹងអ្នកបំផុត ដោយគ្មានសម្ពាធ។',
    body3: 'ជាមធ្យម គួរផ្លាស់ប្តូរសម្ភារៈការពាររៀងរាល់ 4 ដល់ 6 ម៉ោង ហើយញឹកញាប់ជាងនេះក្នុងថ្ងៃដែលមានបរិមាណឈាមរដូវច្រើន។ ការផ្លាស់ប្តូរជាប្រចាំជួយអ្នករក្សាភាពស្រួលខ្លួន និងរក្សាអនាម័យផ្នែកខាងក្នុងឱ្យបានល្អ។',
    relatedTitle: '♥  អ្នកក៏អាចចូលចិត្ត',
    related: [
      {title: 'ការយល់ដឹងអំពីបរិមាណឈាមរដូវរបស់អ្នក', meta: '7 នាទី  ·  មគ្គុទ្ទេសក៍'},
      {title: 'តើត្រូវគ្រប់គ្រងរដូវដំបូងរបស់អ្នកប្រចាំថ្ងៃយ៉ាងដូចម្តេច?', meta: '5 នាទី  ·  មគ្គុទ្ទេសក៍'},
      {title: 'រដូវដំបូងរបស់អ្នក៖ អ្វីដែលត្រូវរំពឹងទុក', meta: '5 នាទី  ·  មគ្គុទ្ទេសក៍'},
    ],
    shareMessage: 'តើខ្ញុំគួរជ្រើសរើសសម្ភារៈការពារអ្វីសម្រាប់រដូវដំបូងរបស់ខ្ញុំ? — AWA',
  },
  lo: {
    badge: 'ປະຈຳເດືອນຄັ້ງທຳອິດ',
    title: 'ຄວນເລືອກຜ້າອະນາໄມແບບໃດ\nສຳລັບປະຈຳເດືອນຄັ້ງທຳອິດ?',
    metaDuration: 'ອ່ານ 6 ນາທີ',
    metaType: 'ຄູ່ມື',
    metaLevel: 'ລະດັບເລີ່ມຕົ້ນ',
    metaValidated: 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ',
    intro: 'ມີຫຼາຍວິທີໃນການປ້ອງກັນຕົນເອງໃນລະຫວ່າງມີປະຈຳເດືອນ. ບໍ່ມີວິທີໃດດີກວ່າວິທີອື່ນ — ຄວາມສະບາຍສ່ວນຕົວຄືສິ່ງທີ່ນຳທາງການເລືອກ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ປະເພດຕ່າງໆຂອງການປ້ອງກັນ',
      'ວິທີເລືອກຕາມຄວາມສະບາຍຂອງທ່ານ',
      'ວິທີປ່ຽນຜ້າອະນາໄມ',
    ],
    body1: 'ສຳລັບປະຈຳເດືອນຄັ້ງທຳອິດ ຜ້າອະນາໄມມັກເປັນການປ້ອງກັນທີ່ງ່າຍທີ່ສຸດໃນການໃຊ້ ເພາະໃສ່ໃນຊຸດຊັ້ນໃນໂດຍກົງ. ຊຸດຊັ້ນໃນສຳລັບປະຈຳເດືອນ ແລະ ທຳປອນເປັນທາງເລືອກອື່ນທີ່ທ່ານສາມາດລອງໃນພາຍຫຼັງ ເມື່ອໃດກໍຕາມທີ່ທ່ານຢາກ.',
    options: [
      {
        title: 'ຜ້າອະນາໄມ',
        text: 'ໃຊ້ງ່າຍ, ໃສ່ໃນຊຸດຊັ້ນໃນ ແລະ ປ່ຽນເປັນປະຈຳ.',
      },
      {
        title: 'ຊຸດຊັ້ນໃນສຳລັບປະຈຳເດືອນ',
        text: 'ຊຸດຊັ້ນໃນທີ່ດູດຊຶມໄດ້ ແລະ ຊັກໄດ້ ສະບາຍສຳລັບການໃຊ້ທຸກວັນ.',
      },
      {
        title: 'ທຳປອນ',
        text: 'ໃສ່ເຂົ້າໄປພາຍໃນຮ່າງກາຍ; ຈະໃຊ້ຫຼືບໍ່ ແລະ ເມື່ອໃດ ແມ່ນຂຶ້ນກັບທ່ານ ຕາມຈັງຫວະຂອງທ່ານເອງ.',
      },
    ],
    body2: 'ບໍ່ມີການປ້ອງກັນທີ່ຖືກຫຼືຜິດ: ແຕ່ລະແບບເໝາະກັບຮ່າງກາຍ, ນິໄສ ແລະ ລະດັບຄວາມສະບາຍທີ່ແຕກຕ່າງກັນ. ຕົວຢ່າງ, ທຳປອນຖືກໃສ່ເຂົ້າໄປພາຍໃນຮ່າງກາຍ ແລະ ຕ້ອງຄຸ້ນເຄີຍກັບຮ່າງກາຍຫຼາຍຂຶ້ນເລັກນ້ອຍ — ບໍ່ມີຫຍັງບອກວ່າທ່ານຕ້ອງໃຊ້ມັນຕັ້ງແຕ່ປະຈຳເດືອນຄັ້ງທຳອິດ.',
    tipTitle: 'ຄວນຮູ້',
    tipText: 'ການລອງການປ້ອງກັນຫຼາຍປະເພດເມື່ອເວລາຜ່ານໄປ ຊ່ວຍໃຫ້ທ່ານຊອກຫາແບບທີ່ເໝາະກັບທ່ານທີ່ສຸດ ໂດຍບໍ່ມີຄວາມກົດດັນ.',
    body3: 'ໂດຍສະເລ່ຍ ຄວນປ່ຽນຜ້າອະນາໄມທຸກ 4 ຫາ 6 ຊົ່ວໂມງ ແລະ ບ່ອຍຂຶ້ນໃນມື້ທີ່ມີປະລິມານເລືອດປະຈຳເດືອນຫຼາຍ. ການປ່ຽນເປັນປະຈຳຊ່ວຍໃຫ້ທ່ານສະບາຍ ແລະ ຮັກສາສຸຂະອະນາໄມສ່ວນຕົວທີ່ດີ.',
    relatedTitle: '♥  ທ່ານອາດຈະມັກ',
    related: [
      {title: 'ເຂົ້າໃຈປະລິມານເລືອດປະຈຳເດືອນຂອງທ່ານ', meta: '7 ນາທີ  ·  ຄູ່ມື'},
      {title: 'ຈັດການປະຈຳເດືອນຄັ້ງທຳອິດໃນຊີວິດປະຈຳວັນແນວໃດ?', meta: '5 ນາທີ  ·  ຄູ່ມື'},
      {title: 'ປະຈຳເດືອນຄັ້ງທຳອິດຂອງທ່ານ: ສິ່ງທີ່ຄວນຄາດຫວັງ', meta: '5 ນາທີ  ·  ຄູ່ມື'},
    ],
    shareMessage: 'ຄວນເລືອກຜ້າອະນາໄມແບບໃດສຳລັບປະຈຳເດືອນຄັ້ງທຳອິດ? — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FirstPeriodProtectionArticleScreen({
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

          <AwaText variant="bodyMedium" style={styles.intro}>
            {content.intro}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>{content.contentsTitle}</AwaText>

            {content.topics.map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="titleSmall" emphasized colorRole="primary" style={styles.contentNumber}>{index + 1}.</AwaText>
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.topics[0]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body1}
          </AwaText>

          {content.options.map((option, index) => (
            <AwaCard variant="filled" padding="none" key={option.title} style={styles.visualCard}>
              <Image
                source={OPTION_IMAGES[index]}
                resizeMode="cover"
                style={styles.visualImage}
              />

              <View style={styles.visualCopy}>
                <AwaText variant="titleSmall" emphasized>{option.title}</AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.visualText}>{option.text}</AwaText>
              </View>
            </AwaCard>
          ))}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tipTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tipText}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body3}
          </AwaText>
        </View>

        <View style={styles.relatedHeader}>
          <AwaText variant="titleMedium" emphasized>{content.relatedTitle}</AwaText>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.relatedRow}>
          {RELATED_IMAGES.map((item, index) => (
            <AwaCard variant="filled" padding="none"
              key={item.articleId + index}
              onPress={() =>
                navigation.push('ArticleReader', {articleId: item.articleId})
              }
              style={styles.relatedCard}>
              <Image
                source={resolveEditorialImage(item.image, lang)}
                resizeMode="cover"
                style={styles.relatedImage}
              />

              <View style={styles.relatedCopy}>
                <AwaText variant="labelSmall" emphasized>
                  {content.related[index].title}
                </AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.relatedMeta}>
                  {content.related[index].meta}
                </AwaText>
              </View>
            </AwaCard>
          ))}
        </ScrollView>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={6} scrollRef={scrollRef} />
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
  contentsTitle: {marginBottom: 8},
  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentLeft: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  contentNumber: {width: 24},
  contentText: {flex: 1},
  h2: {
    marginTop: 24,
  },
  body: {marginTop: 8},
  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 3},
  visualCard: {
    marginTop: 16,
    minHeight: 98,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  visualImage: {width: 72, height: 72, borderRadius: 12},
  visualCopy: {flex: 1, marginLeft: 12},
  visualText: {marginTop: 4},
  relatedHeader: {
    marginTop: 8,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  relatedRow: {gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4},
  relatedCard: {
    width: 230,
    height: 112,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  relatedImage: {width: 80, height: '100%'},
  relatedCopy: {flex: 1, padding: 12},
  relatedMeta: {marginTop: 8},
  });
}
