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
    minHeight: 105,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  relatedImage: {width: 80, alignSelf: 'stretch'},
  relatedCopy: {flex: 1, padding: 12},
  relatedMeta: {marginTop: 8},
  });
}
