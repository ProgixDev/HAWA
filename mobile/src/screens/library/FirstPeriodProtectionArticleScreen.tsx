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
