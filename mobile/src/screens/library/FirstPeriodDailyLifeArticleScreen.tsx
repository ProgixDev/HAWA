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
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

const ID = 'firstperiod-gerer-quotidien';

const HERO = require('../../assets/images/library/rules-hero.png');

// Icons/images stay language-neutral — only TEXT moves into the bilingual
// CONTENT object below, keyed by index to stay aligned with these icons.
const DAILY_ICONS = ['school-outline', 'run', 'power-sleep'] as const;

const RELATED_META = [
  {
    image: require('../../assets/images/library/featured-flow.png'),
    articleId: 'firstperiod-choisir-protection',
  },
  {
    image: require('../../assets/images/library/pain-hero.png'),
    articleId: 'pain-gerer-douleurs',
  },
  {
    image: require('../../assets/images/library/regular-cycle-hero.png'),
    articleId: 'firstperiod-cycle-irregulier',
  },
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('FirstPeriodDailyLife', {
  fr: {
    badge: 'PREMIÈRES RÈGLES',
    title: 'Comment gérer ses\npremières règles au quotidien ?',
    metaDuration: '5 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Avec quelques petites habitudes, les premières règles s’intègrent facilement à ton quotidien, à l’école comme en dehors.',
    contentsTitle: 'Dans cet article',
    topics: [
      'S’organiser au quotidien',
      'Préparer une trousse de secours',
      'Si les règles arrivent de façon inattendue',
    ],
    body1: 'École, sport, sommeil : les règles n’empêchent pas de continuer tes activités habituelles. Il suffit d’adapter quelques habitudes pour rester à l’aise tout au long de la journée.',
    dailyTips: [
      'École ou activités : garde une protection dans ton sac',
      'Sport : le sport reste possible, adapte simplement ton rythme',
      'Sommeil : une protection de nuit adaptée suffit',
    ],
    body2: 'Une petite trousse avec une ou deux protections, une culotte de rechange et des lingettes peut se glisser facilement dans un sac d’école ou de sport. Elle permet de rester tranquille en toute circonstance.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Garder toujours une protection avec toi évite le stress d’être prise au dépourvu.',
    body3: 'Cela arrive souvent, surtout au début. Une infirmière scolaire, une enseignante ou une amie a presque toujours de quoi dépanner. Un vêtement noué autour de la taille peut aussi suffire en attendant de trouver une protection.',
    relatedTitle: '♥  Tu pourrais aussi aimer',
    related: [
      {
        title: 'Quelle protection choisir pour mes premières règles ?',
        meta: '6 min  ·  Guide',
      },
      {
        title: 'Gérer les douleurs menstruelles',
        meta: '7 min  ·  Guide',
      },
      {
        title: 'Mes premières règles sont irrégulières : est-ce normal ?',
        meta: '5 min  ·  Guide',
      },
    ],
    shareMessage: 'Comment gérer ses premières règles au quotidien ? — AWA',
  },
  en: {
    badge: 'FIRST PERIOD',
    title: 'How to manage your\nfirst period day to day?',
    metaDuration: '5 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'With a few small habits, your first period fits easily into your daily life, at school and beyond.',
    contentsTitle: 'In this article',
    topics: [
      'Getting organized day to day',
      'Putting together a small emergency kit',
      'If your period arrives unexpectedly',
    ],
    body1: 'School, sports, sleep: your period doesn’t stop you from continuing your usual activities. You just need to adjust a few habits to stay comfortable throughout the day.',
    dailyTips: [
      'School or activities: keep a pad or tampon in your bag',
      'Sports: you can still play sports, just adjust your pace',
      'Sleep: a suitable overnight pad is enough',
    ],
    body2: 'A small kit with one or two pads or tampons, a spare pair of underwear, and some wipes can easily fit into a school or sports bag. It helps you feel at ease no matter what happens.',
    tip1Title: 'Good to know',
    tip1Text: 'Always keeping a pad or tampon with you avoids the stress of being caught off guard.',
    body3: 'This happens often, especially at first. A school nurse, a teacher, or a friend almost always has something that can help. Tying a piece of clothing around your waist can also work while you find a pad or tampon.',
    relatedTitle: '♥  You might also like',
    related: [
      {
        title: 'Which pad or tampon should I choose for my first period?',
        meta: '6 min  ·  Guide',
      },
      {
        title: 'Managing period pain',
        meta: '7 min  ·  Guide',
      },
      {
        title: 'My first periods are irregular: is that normal?',
        meta: '5 min  ·  Guide',
      },
    ],
    shareMessage: 'How to manage your first period day to day? — AWA',
  },
  es: {
    badge: 'PRIMERA MENSTRUACIÓN',
    title: '¿Cómo gestionar tu primera\nmenstruación en el día a día?',
    metaDuration: '5 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Con algunos pequeños hábitos, la primera menstruación se integra fácilmente en tu día a día, tanto en la escuela como fuera de ella.',
    contentsTitle: 'En este artículo',
    topics: [
      'Organizarte en el día a día',
      'Preparar un pequeño kit de emergencia',
      'Si la menstruación llega de forma inesperada',
    ],
    body1: 'Escuela, deporte, sueño: la menstruación no te impide seguir con tus actividades habituales. Basta con adaptar algunos hábitos para sentirte cómoda durante todo el día.',
    dailyTips: [
      'Escuela o actividades: lleva una protección en tu mochila',
      'Deporte: hacer deporte sigue siendo posible, solo adapta tu ritmo',
      'Sueño: una protección nocturna adecuada es suficiente',
    ],
    body2: 'Un pequeño kit con una o dos protecciones, una braga de recambio y toallitas cabe fácilmente en una mochila escolar o deportiva. Te permite estar tranquila en cualquier circunstancia.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Llevar siempre una protección contigo evita el estrés de que te pille desprevenida.',
    body3: 'Esto ocurre a menudo, sobre todo al principio. Una enfermera escolar, una profesora o una amiga casi siempre tienen algo que puede ayudarte. Una prenda anudada alrededor de la cintura también puede servir mientras encuentras una protección.',
    relatedTitle: '♥  También te podría gustar',
    related: [
      {
        title: '¿Qué protección elegir para mi primera menstruación?',
        meta: '6 min  ·  Guía',
      },
      {
        title: 'Gestionar los dolores menstruales',
        meta: '7 min  ·  Guía',
      },
      {
        title: 'Mi primera menstruación es irregular: ¿es normal?',
        meta: '5 min  ·  Guía',
      },
    ],
    shareMessage: '¿Cómo gestionar tu primera menstruación en el día a día? — AWA',
  },
  it: {
    badge: 'PRIMO CICLO',
    title: 'Come gestire il tuo\nprimo ciclo giorno per giorno?',
    metaDuration: '5 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Con qualche piccola abitudine, il tuo primo ciclo si inserisce facilmente nella vita di tutti i giorni, a scuola e non solo.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Organizzarsi giorno per giorno',
      'Preparare un piccolo kit d’emergenza',
      'Se il ciclo arriva all’improvviso',
    ],
    body1: 'Scuola, sport, sonno: il ciclo non ti impedisce di continuare le tue attività abituali. Basta adattare qualche abitudine per restare comoda per tutta la giornata.',
    dailyTips: [
      'Scuola o attività: tieni un assorbente o un tampone nella borsa',
      'Sport: puoi continuare a fare sport, basta adattare il ritmo',
      'Sonno: basta un assorbente notturno adatto',
    ],
    body2: 'Un piccolo kit con uno o due assorbenti o tamponi, un paio di mutandine di ricambio e qualche salvietta entra facilmente in una borsa da scuola o da sport. Ti aiuta a sentirti a tuo agio qualunque cosa accada.',
    tip1Title: 'Da sapere',
    tip1Text: 'Avere sempre con te un assorbente o un tampone evita lo stress di essere colta alla sprovvista.',
    body3: 'Succede spesso, soprattutto all’inizio. Un’infermiera della scuola, un’insegnante o un’amica ha quasi sempre qualcosa che può aiutare. Anche legarti un indumento intorno alla vita può funzionare mentre trovi un assorbente o un tampone.',
    relatedTitle: '♥  Potrebbe interessarti anche',
    related: [
      {
        title: 'Quale assorbente o tampone scegliere per il mio primo ciclo?',
        meta: '6 min  ·  Guida',
      },
      {
        title: 'Gestire il dolore mestruale',
        meta: '7 min  ·  Guida',
      },
      {
        title: 'I miei primi cicli sono irregolari: è normale?',
        meta: '5 min  ·  Guida',
      },
    ],
    shareMessage: 'Come gestire il tuo primo ciclo giorno per giorno? — AWA',
  },
  tr: {
    badge: 'İLK ADET',
    title: 'İlk adetini günlük hayatta\nnasıl yönetirsin?',
    metaDuration: '5 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Birkaç küçük alışkanlıkla ilk adetin, okulda ve okul dışında günlük hayatına kolayca yerleşir.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Günlük hayatta düzen kurmak',
      'Küçük bir acil durum seti hazırlamak',
      'Adetin beklenmedik bir anda gelirse',
    ],
    body1: 'Okul, spor, uyku: adetin olağan etkinliklerini sürdürmene engel olmaz. Gün boyu rahat kalmak için sadece birkaç alışkanlığı ayarlaman yeterli.',
    dailyTips: [
      'Okul ya da etkinlikler: çantanda bir ped ya da tampon bulundur',
      'Spor: spor yapmaya devam edebilirsin, sadece temponu ayarla',
      'Uyku: uygun bir gece pedi yeterli',
    ],
    body2: 'Bir iki ped ya da tampon, yedek bir iç çamaşırı ve birkaç ıslak mendilden oluşan küçük bir set, okul ya da spor çantasına rahatça sığar. Ne olursa olsun kendini rahat hissetmene yardımcı olur.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Yanında her zaman bir ped ya da tampon bulundurmak, hazırlıksız yakalanma stresini önler.',
    body3: 'Bu sık olur, özellikle başlangıçta. Okul hemşiresinde, bir öğretmende ya da bir arkadaşta neredeyse her zaman işe yarayacak bir şey bulunur. Ped ya da tampon bulana kadar belinin etrafına bir giysi bağlamak da işe yarayabilir.',
    relatedTitle: '♥  Bunlar da hoşuna gidebilir',
    related: [
      {
        title: 'İlk adetim için hangi ped ya da tamponu seçmeliyim?',
        meta: '6 dk  ·  Rehber',
      },
      {
        title: 'Adet ağrısıyla başa çıkmak',
        meta: '7 dk  ·  Rehber',
      },
      {
        title: 'İlk adetlerim düzensiz: bu normal mi?',
        meta: '5 dk  ·  Rehber',
      },
    ],
    shareMessage: 'İlk adetini günlük hayatta nasıl yönetirsin? — AWA',
  },
  ru: {
    badge: 'ПЕРВЫЕ МЕСЯЧНЫЕ',
    title: 'Как справляться с\nпервыми месячными в повседневной жизни?',
    metaDuration: '5 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Несколько простых привычек помогут легко вписать первые месячные в повседневную жизнь — в школе и не только.',
    contentsTitle: 'В этой статье',
    topics: [
      'Как организовать повседневную жизнь',
      'Как собрать небольшой набор на крайний случай',
      'Если месячные начались неожиданно',
    ],
    body1: 'Школа, спорт, сон: месячные не мешают вам заниматься привычными делами. Достаточно немного скорректировать привычки, чтобы чувствовать себя комфортно в течение дня.',
    dailyTips: [
      'Школа и занятия: держите в сумке прокладку или тампон',
      'Спорт: заниматься спортом можно, нужно лишь подстроить темп',
      'Сон: достаточно подходящей ночной прокладки',
    ],
    body2: 'Небольшой набор — одна-две прокладки или тампона, запасное бельё и влажные салфетки — легко поместится в школьную или спортивную сумку. С ним вы будете чувствовать себя спокойно, что бы ни случилось.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Если прокладка или тампон всегда под рукой, вы избежите стресса из-за неожиданной ситуации.',
    body3: 'Такое случается нередко, особенно в начале. Школьная медсестра, учительница или подруга почти всегда могут чем-то помочь. Пока вы не нашли прокладку или тампон, можно также повязать на талию кофту или куртку.',
    relatedTitle: '♥  Вам может понравиться',
    related: [
      {
        title: 'Какую прокладку или тампон выбрать для первых месячных?',
        meta: '6 мин  ·  Руководство',
      },
      {
        title: 'Как справляться с болью во время месячных',
        meta: '7 мин  ·  Руководство',
      },
      {
        title: 'Мои первые месячные нерегулярны: это нормально?',
        meta: '5 мин  ·  Руководство',
      },
    ],
    shareMessage: 'Как справляться с первыми месячными в повседневной жизни? — AWA',
  },
  de: {
    badge: 'ERSTE PERIODE',
    title: 'Wie gehst du im Alltag\nmit deiner ersten Periode um?',
    metaDuration: '5 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Mit ein paar kleinen Gewohnheiten fügt sich deine erste Periode leicht in deinen Alltag ein, in der Schule und darüber hinaus.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Den Alltag organisieren',
      'Ein kleines Notfallset zusammenstellen',
      'Wenn deine Periode unerwartet kommt',
    ],
    body1: 'Schule, Sport, Schlaf: Deine Periode hält dich nicht davon ab, deinen gewohnten Aktivitäten nachzugehen. Du musst nur ein paar Gewohnheiten anpassen, damit du dich den ganzen Tag über wohlfühlst.',
    dailyTips: [
      'Schule oder Aktivitäten: Hab eine Binde oder einen Tampon in deiner Tasche',
      'Sport: Du kannst weiter Sport treiben, passe nur dein Tempo an',
      'Schlaf: Eine passende Nachtbinde reicht aus',
    ],
    body2: 'Ein kleines Set mit ein oder zwei Binden oder Tampons, einer Ersatzunterhose und ein paar Feuchttüchern passt leicht in eine Schul- oder Sporttasche. Es gibt dir das Gefühl, auf alles vorbereitet zu sein.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Wenn du immer eine Binde oder einen Tampon dabeihast, erspart dir das den Stress, überrascht zu werden.',
    body3: 'Das passiert oft, besonders am Anfang. Die Schulkrankenschwester, eine Lehrerin oder eine Freundin hat fast immer etwas, das helfen kann. Auch ein um die Taille gebundenes Kleidungsstück kann helfen, bis du eine Binde oder einen Tampon findest.',
    relatedTitle: '♥  Das könnte dir auch gefallen',
    related: [
      {
        title: 'Welche Binde oder welchen Tampon wähle ich für meine erste Periode?',
        meta: '6 Min.  ·  Ratgeber',
      },
      {
        title: 'Mit Periodenschmerzen umgehen',
        meta: '7 Min.  ·  Ratgeber',
      },
      {
        title: 'Meine ersten Perioden sind unregelmäßig: Ist das normal?',
        meta: '5 Min.  ·  Ratgeber',
      },
    ],
    shareMessage: 'Wie gehst du im Alltag mit deiner ersten Periode um? – AWA',
  },
  zh: {
      badge: '初潮',
      title: '初潮期间的\n日常该怎么应对？',
      metaDuration: '阅读约 5 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审核内容',
      intro: '只要养成几个小习惯，初潮就能轻松融入你的日常生活，无论在学校还是其他场合。',
      contentsTitle: '本文内容',
      topics: [
        '安排好日常生活',
        '准备一个小小的应急包',
        '月经突然来了怎么办',
      ],
      body1: '上学、运动、睡觉：月经并不会妨碍你继续日常活动。你只需要调整几个习惯，让自己整天都保持舒适。',
      dailyTips: [
        '上学或参加活动：在包里放一片卫生巾或卫生棉条',
        '运动：你仍然可以运动，只需调整节奏',
        '睡眠：一片合适的夜用卫生巾就足够了',
      ],
      body2: '一个小包里放一两片卫生巾或卫生棉条、一条备用内裤和几张湿巾，可以轻松放进书包或运动包。无论发生什么，它都能让你更从容。',
      tip1Title: '小贴士',
      tip1Text: '随身带着一片卫生巾或卫生棉条，就不必担心措手不及。',
      body3: '这种情况很常见，尤其是刚开始的时候。校医、老师或朋友几乎总能帮上忙。在找到卫生巾或卫生棉条之前，把一件衣服系在腰间也是个办法。',
      relatedTitle: '♥  你可能还喜欢',
      related: [
        {
          title: '初潮时该选择卫生巾还是卫生棉条？',
          meta: '6 分钟  ·  指南',
        },
        {
          title: '应对经期疼痛',
          meta: '7 分钟  ·  指南',
        },
        {
          title: '我的前几次月经不规律：正常吗？',
          meta: '5 分钟  ·  指南',
        },
      ],
      shareMessage: '初潮期间的日常该怎么应对？ — AWA',
    },
  'zh-Hant': {
      badge: '初潮',
      title: '初潮期間的\n日常該怎麼應對？',
      metaDuration: '閱讀約 5 分鐘',
      metaType: '指南',
      metaLevel: '入門',
      metaValidated: '已稽核內容',
      intro: '只要養成幾個小習慣，初潮就能輕鬆融入你的日常生活，無論在學校還是其他場合。',
      contentsTitle: '本文內容',
      topics: [
        '安排好日常生活',
        '準備一個小小的應急包',
        '月經突然來了怎麼辦',
      ],
      body1: '上學、運動、睡覺：月經並不會妨礙你繼續日常活動。你只需要調整幾個習慣，讓自己整天都保持舒適。',
      dailyTips: [
        '上學或參加活動：在包裡放一片衛生棉或衛生棉條',
        '運動：你仍然可以運動，只需調整節奏',
        '睡眠：一片合適的夜用衛生棉就足夠了',
      ],
      body2: '一個小包裡放一兩片衛生棉或衛生棉條、一條備用內褲和幾張溼巾，可以輕鬆放進書包或運動包。無論發生什麼，它都能讓你更從容。',
      tip1Title: '小提醒',
      tip1Text: '隨身帶著一片衛生棉或衛生棉條，就不必擔心措手不及。',
      body3: '這種情況很常見，尤其是剛開始的時候。校醫、老師或朋友幾乎總能幫上忙。在找到衛生棉或衛生棉條之前，把一件衣服系在腰間也是個辦法。',
      relatedTitle: '♥  你可能還喜歡',
      related: [
        {
          title: '初潮時該選擇衛生棉還是衛生棉條？',
          meta: '6 分鐘  ·  指南',
        },
        {
          title: '應對經期疼痛',
          meta: '7 分鐘  ·  指南',
        },
        {
          title: '我的前幾次月經不規律：正常嗎？',
          meta: '5 分鐘  ·  指南',
        },
      ],
      shareMessage: '初潮期間的日常該怎麼應對？ — AWA',
    },
  ar: {
    badge: 'أول حيض',
    title: 'كيف تتعاملين مع\nأول حيض يومًا بيوم؟',
    metaDuration: '5 دقائق للقراءة',
    metaType: 'دليل',
    metaLevel: 'مبتدئة',
    metaValidated: 'محتوى مراجَع',
    intro: 'ببعض العادات الصغيرة، يندمج أول حيض لك بسهولة في حياتك اليومية، في المدرسة وخارجها.',
    contentsTitle: 'في هذا المقال',
    topics: [
      'التنظيم يومًا بيوم',
      'تحضير حقيبة طوارئ صغيرة',
      'إذا جاء حيضك على غير توقّع',
    ],
    body1: 'المدرسة والرياضة والنوم: لا يمنعك حيضك من مواصلة أنشطتك المعتادة. يكفي أن تعدّلي بعض العادات لتبقي مرتاحة طوال اليوم.',
    dailyTips: [
      'المدرسة أو الأنشطة: احتفظي بفوطة أو سدادة قطنية في حقيبتك',
      'الرياضة: يمكنك ممارسة الرياضة، فقط عدّلي وتيرتك',
      'النوم: تكفي فوطة ليلية مناسبة',
    ],
    body2: 'حقيبة صغيرة تحوي فوطة أو فوطتين أو سدادتين قطنيتين، وملابس داخلية احتياطية، وبعض المناديل المبللة، يسهل وضعها في حقيبة المدرسة أو الرياضة. وتساعدك على الشعور بالراحة مهما حدث.',
    tip1Title: 'من المفيد أن تعرفي',
    tip1Text: 'حمل فوطة أو سدادة قطنية معك دائمًا يجنّبك قلق المفاجأة.',
    body3: 'هذا يحدث كثيرًا، خاصة في البداية. فالممرضة المدرسية أو المعلّمة أو الصديقة تملك دائمًا تقريبًا ما يفيد. كما قد ينفع ربط قطعة ملابس حول خصرك ريثما تجدين فوطة أو سدادة قطنية.',
    relatedTitle: '♥  قد يعجبك أيضًا',
    related: [
      {
        title: 'أي فوطة أو سدادة قطنية أختار لأول حيض؟',
        meta: '6 د  ·  دليل',
      },
      {
        title: 'التعامل مع ألم الحيض',
        meta: '7 د  ·  دليل',
      },
      {
        title: 'دورتي الأولى غير منتظمة: هل هذا طبيعي؟',
        meta: '5 د  ·  دليل',
      },
    ],
    shareMessage: 'كيف تتعاملين مع أول حيض يومًا بيوم؟ — AWA',
  },
  kab: {
    badge: 'LḤID AMEZWARU',
    title: 'Amek ara tmesleḍ lḥid-ik\namezwaru yal ass?',
    metaDuration: '5 n tesdatin n tɣuri',
    metaType: 'Amawal',
    metaLevel: 'Amagrad',
    metaValidated: 'Agbur yettwasenqed',
    intro: 'S kra n tiɣawsiwin timecṭuḥin, lḥid-ik amezwaru ad yekcem s lehna ɣer tudert-ik n yal ass, deg uɣerbaz d kra n wadeg-nniḍen.',
    contentsTitle: 'deg umagrad-a',
    topics: [
      'Asmunteg n yal ass',
      'Aheggi n tqeffalt tamecṭuḥt n uzaglu',
      'Ma yella lḥid-ik d-yusa war ma tettṛaǧuḍ',
    ],
    body1: 'Aɣerbaz, armud, anyal: lḥid-ik ur k-yeḥbis ara seg ugerrez n yimagen-ik n yal ass. Ilaq kan ad tbeddleḍ kra n tiɣawsiwin akken ad tḥussed s tawsit deg wass.',
    dailyTips: [
      'Aɣerbaz neɣ armud: eǧǧ aḥerres neɣ tampon deg tqeffalt-ik',
      'Armud: tzemreḍ ad tmuddeḍ, kan ssenqes arrad',
      'Anyal: aḥerres n yiḍ yemṣaḥen yekfa',
    ],
    body2: 'Tqeffalt tamecṭuḥt s yiwen neɣ sin n yiḥerrasen neɣ n tampon, ajeddig n ilebsan d kra n yimecḍiwen tezmer ad tkcem s lehna ɣer tqeffalt n uɣerbaz neɣ n armud. Ittɛawan ad tḥussed s tawsit mebla acu ara d-yeḍru.',
    tip1Title: 'Yelha ad tezwareḍ',
    tip1Text: 'Ad tesɛuḍ dima aḥerres neɣ tampon yidek ad yeḥrez aḥezzeb n tfaja.',
    body3: 'Wagi yeḍra aṭas, s wudem uslig deg tazwara. Tamsiwelt n uɣerbaz, aselmad, neɣ ameddakel almi ar yesɛa kra n wayen izemren ad yɛawen. Ad tessiwḍeḍ aqeṭṭun n ukudiy ɣef yiri-ik izemmer daɣen ad yelhu alamma ara tafeḍ aḥerres neɣ tampon.',
    relatedTitle: '♥  Ahat ad k-yehwu daɣen',
    related: [
      {
        title: 'Anwa aḥerres neɣ tampon ara fren i lḥid-iw amezwaru?',
        meta: '6 n tesdatin  ·  Amawal',
      },
      {
        title: 'Tawalt n ṭṭṛaḥ n lḥid',
        meta: '7 n tesdatin  ·  Amawal',
      },
      {
        title: 'Lḥid-iw amezwaru ur yemṣaḥ ara: d amagnu wagi?',
        meta: '5 n tesdatin  ·  Amawal',
      },
    ],
    shareMessage: 'Amek ara tmesleḍ lḥid-ik amezwaru yal ass? — AWA',
  },
  om: {
    badge: 'DHIITA JI\'AA JALQABAA',
    title: 'Dhiita ji\'aa kee jalqabaa\nguyyaa guyyaan akkamitti to\'attu?',
    metaDuration: 'Daqiiqaa 5 dubbisuuf',
    metaType: 'Qajeelfama',
    metaLevel: 'Jalqabaaf',
    metaValidated: 'Qabiyyee ilaalame',
    intro: 'Amala xixiqqaa muraasaan, dhiitni ji\'aa kee jalqabaa jireenya guyyaa guyyaa kee keessatti, mana barumsaa fi ala salphaatti seena.',
    contentsTitle: 'Barreeffama kana keessatti',
    topics: [
      'Guyyaa guyyaan of qindeessuu',
      'Kitii hatattamaa xiqqoo qopheessuu',
      'Yoo dhiitni ji\'aa kee hin eegamin dhufe',
    ],
    body1: 'Mana barumsaa, ispoortii, hirriba: dhiitni ji\'aa kee hojii kee baratamaa itti fufuu irraa si hin dhoowwu. Guyyaa guutuu akka mijaa\'uuf amala muraasa sirreessuu qofa si barbaachisa.',
    dailyTips: [
      'Mana barumsaa ykn hojii: paadii ykn tampoon boorsaa kee keessa qabadhu',
      'Ispoortii: ispoortii taphachuu ni dandeessa, saffisa kee qofa sirreessi',
      'Hirriba: paadii halkanii mijataa gahaa dha',
    ],
    body2: 'Kitiin xiqqoon paadii ykn tampoon tokko ykn lama, uffata keessaa dabalataa fi wipes muraasa qabu boorsaa mana barumsaa ykn ispoortii keessatti salphaatti galuu danda\'a. Wanti kamiyyuu yoo ta\'e illee mijaa\'uuf si gargaara.',
    tip1Title: 'Beekuun gaarii dha',
    tip1Text: 'Yeroo hunda paadii ykn tampoon si bira qabachuun yaaddoo hin eegamne irraa ittisa.',
    body3: 'Kun yeroo baay\'ee ta\'a, keessumaa jalqabarratti. Nurse mana barumsaa, barsiisaan, ykn hiriyyaan yeroo hundumaa gargaaruu danda\'u waa qaba. Uffata biraa mudhii kee irratti hidhuunis yeroo paadii ykn tampoon barbaaddu hojjechuu danda\'a.',
    relatedTitle: '♥  Kunis sitti tolu ta\'a',
    related: [
      {
        title: 'Dhiita ji\'aa kee jalqabaaf paadii ykn tampoon kam filachuu qabda?',
        meta: 'Daqiiqaa 6  ·  Qajeelfama',
      },
      {
        title: 'Dhukkubbii dhiita ji\'aa to\'achuu',
        meta: 'Daqiiqaa 7  ·  Qajeelfama',
      },
      {
        title: 'Dhiitni ji\'aa koo jalqabaa idilee hin ta\'in: kun idilee dhaa?',
        meta: 'Daqiiqaa 5  ·  Qajeelfama',
      },
    ],
    shareMessage: 'Dhiita ji\'aa kee jalqabaa guyyaa guyyaan akkamitti to\'attu? — AWA',
  },
  ti: {
    badge: 'ቀዳማይ ወርሓዊ ደም',
    title: 'ቀዳማይ ወርሓዊ ደመይ መዓልታዊ\nብኸመይ ኣመሓድር?',
    metaDuration: '5 ደቒቕ ንባብ',
    metaType: 'መምርሒ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'ዝተገምገመ ትሕዝቶ',
    intro: 'ብገለ ንኣሽቱ ልምድታት፣ ቀዳማይ ወርሓዊ ደምኪ ብቐሊሉ ኣብ መዓልታዊ ህይወትኪ፣ ኣብ ቤት ትምህርትን ካልእ ቦታታትን ይእቶ።',
    contentsTitle: 'ኣብዚ ጽሑፍ',
    topics: [
      'መዓልታዊ ምውዳብ',
      'ንኣሽቶ ናይ ህጹጽ ኣቕሑት ኪት ምድላው',
      'ወርሓዊ ደምኪ ብዘይተጸበኽዮ እንተመጸ',
    ],
    body1: 'ቤት ትምህርቲ፣ ስፖርት፣ ድቃስ፦ ወርሓዊ ደምኪ ልሙድ ንጥፈታትኪ ከይትቅጽሊ ኣይዓግተኪን። ብመዓልቲ ምቾትኪ ንምሕላው ገለ ልምድታት ጥራይ ምስምማዕ የድሊ።',
    dailyTips: [
      'ቤት ትምህርቲ ወይ ንጥፈታት፦ ኣብ ቦርሳኺ ፓድ ወይ ታምፖን ሓዚ',
      'ስፖርት፦ ስፖርት ክትጻወቲ ትኽእሊ፣ ሪትምኪ ጥራይ ኣሰማምዒ',
      'ድቃስ፦ ዝሰማማዕ ናይ ለይቲ ፓድ ይኣክል',
    ],
    body2: 'ሓደ ወይ ክልተ ፓድ ወይ ታምፖን፣ ተወሳኺ ውሽጣዊ ክዳውንቲ ከምኡ እውን ገለ መጽረጊ ዝሓዘ ንእሽቶ ኪት ኣብ ቦርሳ ቤት ትምህርቲ ወይ ስፖርት ብቐሊሉ ክኣቱ ይኽእል። ዝኾነ ይኹን ኣብ ዝተፈጸመ ምቾት ክስምዐኪ ይሕግዝ።',
    tip1Title: 'ርዳእ እዚ',
    tip1Text: 'ኩሉ ግዜ ፓድ ወይ ታምፖን ምሓዝ ብዘይተጸበኽዮ ምትእትታው ጭንቀት የስዕር።',
    body3: 'እዚ ብተደጋጋሚ ይፍጸም፣ ብፍላይ ኣብ መጀመሪያ። ኣብ ቤት ትምህርቲ ኖርስ፣ መምህር ወይ ዓርከ ኩሉ ግዜ ዝሕግዝ ገለ ነገር ኣለዎ። ፓድ ወይ ታምፖን ክትረኽቢ ከሎኺ ክዳን ኣብ ክሳድኪ ምእሳር እውን ክሰርሕ ይኽእል።',
    relatedTitle: '♥  ክትፈትይዮም ትኽእሊ',
    related: [
      {
        title: 'ንቀዳማይ ወርሓዊ ደመይ ኣየናይ ፓድ ወይ ታምፖን ክምረጽ?',
        meta: '6 ደቒቕ  ·  መምርሒ',
      },
      {
        title: 'ቃንዛ ወርሓዊ ደም ምምሕዳር',
        meta: '7 ደቒቕ  ·  መምርሒ',
      },
      {
        title: 'ቀዳሞት ወርሓዊ ደመይ ዘይርጉኣት እየን፦ ንቡር ድዩ?',
        meta: '5 ደቒቕ  ·  መምርሒ',
      },
    ],
    shareMessage: 'ቀዳማይ ወርሓዊ ደመይ መዓልታዊ ብኸመይ ኣመሓድር? — AWA',
  },
  rw: {
    badge: 'IMIHANGO YA MBERE',
    title: 'Nacunga nte imihango yanjye\nya mbere buri munsi?',
    metaDuration: 'Iminota 5 yo gusoma',
    metaType: 'Igitabo',
    metaLevel: 'Ku batangiye',
    metaValidated: 'Ibikubiyemo byasuzumwe',
    intro: 'Hamwe n’ingeso nke nto, imihango yawe ya mbere ihuza byoroshye n’ubuzima bwawe bwa buri munsi, ku ishuri no hanze yaryo.',
    contentsTitle: 'Muri iyi nkuru',
    topics: [
      'Kwitegura buri munsi',
      'Gutegura agakapu gato k’ibitunguranye',
      'Niba imihango yawe ije bitunguranye',
    ],
    body1: 'Ishuri, siporo, ibitotsi: imihango yawe ntikubuza gukomeza ibyo usanzwe ukora. Ukeneye gusa guhindura ingeso nke kugira ngo wumve utuje umunsi wose.',
    dailyTips: [
      'Ishuri cyangwa ibikorwa: bika igitambaro cyangwa tampon mu gikapu cyawe',
      'Siporo: ushobora gukomeza gukora siporo, uhindure gusa umuvuduko',
      'Ibitotsi: igitambaro gikwiye cyo ku manywa n’ijoro kirahagije',
    ],
    body2: 'Agakapu gato karimo igitambaro kimwe cyangwa bibiri cyangwa tampon, umwenda w’imbere w’inyongera, n’impapuro zitose bishobora kujya byoroshye mu gikapu cy’ishuri cyangwa icya siporo. Kagufasha kumva utuje uko byagenda kose.',
    tip1Title: 'Ni byiza kubimenya',
    tip1Text: 'Guhorana igitambaro cyangwa tampon bikurinda guhangayika wafashwe n’igitunguranye.',
    body3: 'Ibi bikunze kubaho, cyane cyane mu ntangiriro. Umuforomo w’ishuri, umwarimu, cyangwa inshuti hafi buri gihe agira ikintu cyafasha. Kuboha umwenda mu rukenyerero nabyo bishobora gufasha mu gihe ushaka igitambaro cyangwa tampon.',
    relatedTitle: '♥  Ushobora no gukunda',
    related: [
      {
        title: 'Ni igitambaro cyangwa tampon iyihe nahitamo ku mihango yanjye ya mbere?',
        meta: 'Iminota 6  ·  Igitabo',
      },
      {
        title: 'Gucunga ububabare bw’imihango',
        meta: 'Iminota 7  ·  Igitabo',
      },
      {
        title: 'Imihango yanjye ya mbere ntihora: ni ibisanzwe?',
        meta: 'Iminota 5  ·  Igitabo',
      },
    ],
    shareMessage: 'Nacunga nte imihango yanjye ya mbere buri munsi? — AWA',
  },
  rn: {
    badge: 'IMIHANGO YA MBERE',
    title: 'Wokoresha ute imihango yawe\nya mbere buri musi?',
    metaDuration: 'Iminuta 5 yo gusoma',
    metaType: 'Ubuyobozi',
    metaLevel: 'Intangiriro',
    metaValidated: 'Ibikubiye vyasuzumwe',
    intro: 'Hamwe n’ingeso nkeya zoroshe, imihango yawe ya mbere ihuza vyoroshe n’ubuzima bwawe bwa buri musi, ku ishure no hanze yaryo.',
    contentsTitle: 'Muri iyi nkuru',
    topics: [
      'Kwitegura buri musi',
      'Gutegura agasakoshi gato k’ibikenewe vyihuta',
      'Iyo imihango yawe ije ku buryo butateganijwe',
    ],
    body1: 'Ishure, siporo, ibitiro: imihango yawe ntikubuza gukomeza ibikorwa vyawe bisanzwe. Ukeneye gusa guhindura ingeso zimwezimwe kugira ugume woroherewe umusi wose.',
    dailyTips: [
      'Ishure canke ibikorwa: bika igitambaro canke tampon mu gasakoshi kawe',
      'Siporo: ushobora gukomeza gukina, uhindura gusa umuvuduko',
      'Ibitiro: igitambaro gikwiye cyo ku ijoro kirahagije',
    ],
    body2: 'Agasakoshi gato karimwo igitambaro kimwe canke bibiri canke tampon, ishaki ry’imyambaro y’imbere n’impapuro zo guhanagura gashobora kuhira vyoroshe mu isakoshi y’ishure canke ya siporo. Gatuma wumva utuje uko vyoba vyifashe vyose.',
    tip1Title: 'Ni vyiza kubimenya',
    tip1Text: 'Guhorana igitambaro canke tampon bikurinda guhagarika umutima ko wokubitwa utiteguye.',
    body3: 'Ivyo bikunda, cane cane mu ntango. Umuforoma w’ishure, umwarimu, canke incuti hafi buri gihe bafise ikintu cashobora gufasha. Kuboha ikintu c’imyambaro mu rukenyerero na ko birashobora gufasha mu gihe urondera igitambaro canke tampon.',
    relatedTitle: '♥  Ushobora no gukunda',
    related: [
      {
        title: 'Ni igitambaro canke tampon ikihe nahitamwo ku mihango yanje ya mbere?',
        meta: 'Iminuta 6  ·  Ubuyobozi',
      },
      {
        title: 'Gucunga ububabare bw’imihango',
        meta: 'Iminuta 7  ·  Ubuyobozi',
      },
      {
        title: 'Imihango yanje ya mbere ntihamye: ni ibisanzwe?',
        meta: 'Iminuta 5  ·  Ubuyobozi',
      },
    ],
    shareMessage: 'Wokoresha ute imihango yawe ya mbere buri musi? — AWA',
  },
  ig: {
    badge: 'NSỌ ỌNWA MBỤ',
    title: 'Kedu ka m ga-esi jikwaa\nnsọ ọnwa mbụ m kwa ụbọchị?',
    metaDuration: 'Nkeji 5 ka a na-agụ',
    metaType: 'Ntuziaka',
    metaLevel: 'Maka ndị na-amalite',
    metaValidated: 'Ọdịnaya a nyochara',
    intro: 'Site n’obere omume ole na ole, nsọ ọnwa mbụ gị na-abanye n’ụzọ dị mfe n’ndụ gị kwa ụbọchị, n’ụlọ akwụkwọ na ebe ọzọ.',
    contentsTitle: 'N’edemede a',
    topics: [
      'Ịhazi onwe gị kwa ụbọchị',
      'Ịkwado obere akpa maka ihe mberede',
      'Ọ bụrụ na nsọ ọnwa gị abịa n’enweghị ịtụ anya',
    ],
    body1: 'Ụlọ akwụkwọ, egwuregwu, ụra: nsọ ọnwa gị anaghị egbochi gị ịga n’ihu na ọrụ gị nkịtị. Ị kwesịrị naanị ịhazi omume ole na ole ka ị nọrọ n’ahụ iru ala n’ụbọchị niile.',
    dailyTips: [
      'Ụlọ akwụkwọ ma ọ bụ ọrụ: debe pad ma ọ bụ tampon n’akpa gị',
      'Egwuregwu: ị ka nwere ike ịme egwuregwu, naanị hazie ọsọ gị',
      'Ụra: pad kwesịrị ekwesị maka abalị zuru ezu',
    ],
    body2: 'Obere akpa nwere otu pad ma ọ bụ abụọ ma ọ bụ tampon, uwe nkpuchi ọzọ, na akwụkwọ nchacha ole na ole nwere ike ịbanye n’ụzọ dị mfe n’akpa ụlọ akwụkwọ ma ọ bụ nke egwuregwu. Ọ na-enyere gị aka ịnọ n’udo ihe ọ bụla mere.',
    tip1Title: 'Ọ dị mma ịmara',
    tip1Text: 'Ịnọgide na-ebu pad ma ọ bụ tampon na-egbochi nrụgide nke ịdaba n’enweghị nkwadebe.',
    body3: 'Nke a na-eme ugboro ugboro, karịsịa na mbụ. Onye nọọsụ ụlọ akwụkwọ, onye nkụzi, ma ọ bụ enyi fọrọ nke nta ka ọ bụrụ mgbe niile nwere ihe nwere ike inye aka. Ịkekọ otu uwe n’úkwù gị nwekwara ike ịrụ ọrụ ka ị na-achọ pad ma ọ bụ tampon.',
    relatedTitle: '♥  Ị nwere ike ịkpọkwa ndị a',
    related: [
      {
        title: 'Kedu pad ma ọ bụ tampon m ga-ahọrọ maka nsọ ọnwa mbụ m?',
        meta: 'Nkeji 6  ·  Ntuziaka',
      },
      {
        title: 'Ijikwa mgbu nsọ ọnwa',
        meta: 'Nkeji 7  ·  Ntuziaka',
      },
      {
        title: 'Nsọ ọnwa mbụ m anaghị adị n’usoro: ọ̀ bụ ihe nkịtị?',
        meta: 'Nkeji 5  ·  Ntuziaka',
      },
    ],
    shareMessage: 'Kedu ka m ga-esi jikwaa nsọ ọnwa mbụ m kwa ụbọchị? — AWA',
  },
  yo: {
    badge: 'NǸKAN OṢÙ ÀKỌ́KỌ́',
    title: 'Báwo ni mo ṣe lè ṣàkóso\nnǹkan oṣù àkọ́kọ́ mi lójoojúmọ́?',
    metaDuration: 'Kíkà ní ìṣẹ́jú 5',
    metaType: 'Ìtọ́sọ́nà',
    metaLevel: 'Olùbẹ̀rẹ̀',
    metaValidated: 'Àkóónú tí a ti àtúnyẹ̀wò',
    intro: 'Pẹ̀lú àwọn àṣà kékeré díẹ̀, nǹkan oṣù àkọ́kọ́ rẹ rọrùn láti bá ìgbésí ayé ojoojúmọ́ rẹ lọ, ní ilé ẹ̀kọ́ àti níbòmíràn.',
    contentsTitle: 'Nínú àpilẹ̀kọ yìí',
    topics: [
      'Ṣíṣètò lójoojúmọ́',
      'Pípèsè àpò kékeré fún pàjáwìrì',
      'Tí nǹkan oṣù rẹ bá dé láìròtẹ́lẹ̀',
    ],
    body1: 'Ilé ẹ̀kọ́, eré ìdárayá, oorun: nǹkan oṣù rẹ kò dí ọ lọ́wọ́ láti tẹ̀síwájú pẹ̀lú àwọn ìgbòkègbodò rẹ déédéé. O kàn nílò láti ṣe àtúnṣe àwọn àṣà díẹ̀ kí o lè wà ní ìtùnú ní gbogbo ọjọ́.',
    dailyTips: [
      'Ilé ẹ̀kọ́ tàbí àwọn ìgbòkègbodò: máa ní pádì tàbí tampon nínú àpò rẹ',
      'Eré ìdárayá: o ṣì lè ṣe eré ìdárayá, kàn ṣe àtúnṣe ìyára rẹ',
      'Oorun: pádì alẹ́ tó yẹ ti tó',
    ],
    body2: 'Àpò kékeré kan pẹ̀lú pádì tàbí tampon kan tàbí méjì, aṣọ abẹ́ àfikún kan, àti àwọn aṣọ ìnu díẹ̀ lè wọ inú àpò ilé ẹ̀kọ́ tàbí ti eré ìdárayá ní irọ̀rùn. Ó ń jẹ́ kí o wà ní ìbàlẹ̀ ọkàn ohunkóhun tó bá ṣẹlẹ̀.',
    tip1Title: 'Ohun tó yẹ kí o mọ̀',
    tip1Text: 'Níní pádì tàbí tampon pẹ̀lú rẹ nígbà gbogbo ń yẹra fún ìdààmú pé a mú ọ láìmọ̀.',
    body3: 'Èyí máa ń ṣẹlẹ̀ nígbà púpọ̀, pàápàá ní àkọ́kọ́. Nọ́ọ̀sì ilé ẹ̀kọ́, olùkọ́, tàbí ọ̀rẹ́ kan fẹ́rẹ̀ẹ́ máa ní ohun kan tó lè ranni lọ́wọ́ nígbà gbogbo. Fífi aṣọ kan dì mọ́ ìbàdí rẹ náà lè ṣiṣẹ́ nígbà tí o bá ń wá pádì tàbí tampon.',
    relatedTitle: '♥  O lè fẹ́ràn èyí náà',
    related: [
      {
        title: 'Pádì tàbí tampon wo ni kí n yàn fún nǹkan oṣù àkọ́kọ́ mi?',
        meta: '6 min  ·  Ìtọ́sọ́nà',
      },
      {
        title: 'Ṣíṣàkóso ìrora nǹkan oṣù',
        meta: '7 min  ·  Ìtọ́sọ́nà',
      },
      {
        title: 'Nǹkan oṣù àkọ́kọ́ mi kò déédé: ṣé ó jẹ́ deede?',
        meta: '5 min  ·  Ìtọ́sọ́nà',
      },
    ],
    shareMessage: 'Báwo ni mo ṣe lè ṣàkóso nǹkan oṣù àkọ́kọ́ mi lójoojúmọ́? — AWA',
  },
  zu: {
    badge: 'ISIKHATHI SOKUQALA',
    title: 'Ngiphatha kanjani\nisikhathi sami sokuqala nsuku zonke?',
    metaDuration: 'Imizuzu eyi-5 yokufunda',
    metaType: 'Isikhokelo',
    metaLevel: 'Okwabaqalayo',
    metaValidated: 'Okuqulunqwe kabusha',
    intro: 'Ngemikhuba embalwa emincane, isikhathi sakho sokuqala singena kalula empilweni yakho yansuku zonke, esikoleni nakwenye indawo.',
    contentsTitle: 'Kulesi sihloko',
    topics: [
      'Ukuhleleka nsuku zonke',
      'Ukuhlanganisa isikhwama esincane sesimo esiphuthumayo',
      'Uma isikhathi sakho sifika ngokungalindelekile',
    ],
    body1: 'Isikole, ezemidlalo, ukulala: isikhathi sakho asikuvimbeli ukuqhubeka nemisebenzi yakho ejwayelekile. Udinga nje ukulungisa eminye imikhuba ukuze uhlale ukhululekile usuku lonke.',
    dailyTips: [
      'Isikole noma imisebenzi: gcina i-pad noma i-tampon esikhwameni sakho',
      'Ezemidlalo: ungasadlala, nje lungisa isivinini sakho',
      'Ukulala: i-pad efanelekile yasebusuku iyanele',
    ],
    body2: 'Isikhwama esincane esine-pad noma ama-tampon amabili, ingubo yangaphansi eyengeziwe, namanyela ambalwa singangena kalula esikhwameni sesikole noma sezemidlalo. Sikusiza uzizwe ukhululekile noma yini eyenzekayo.',
    tip1Title: 'Kuhle ukwazi',
    tip1Text: 'Ukuhlala unayo i-pad noma i-tampon kugwema ukucindezeleka kokubanjwa ungazilungisile.',
    body3: 'Lokhu kwenzeka kaningi, ikakhulukazi ekuqaleni. Umhlengikazi wesikole, uthisha, noma umngane cishe njalo unalokho okungasiza. Ukubophela ingubo okhalweni nakho kungasebenza ngenkathi uthola i-pad noma i-tampon.',
    relatedTitle: '♥  Ungathanda nalokhu',
    related: [
      {
        title: 'Ngikhetha iyiphi i-pad noma i-tampon esikhathini sami sokuqala?',
        meta: 'Imizuzu eyi-6  ·  Isikhokelo',
      },
      {
        title: 'Ukuphatha ubuhlungu besikhathi',
        meta: 'Imizuzu eyi-7  ·  Isikhokelo',
      },
      {
        title: 'Izikhathi zami zokuqala aziyohleleki: ingabe lokhu kujwayelekile?',
        meta: 'Imizuzu eyi-5  ·  Isikhokelo',
      },
    ],
    shareMessage: 'Ngiphatha kanjani isikhathi sami sokuqala nsuku zonke? — AWA',
  },
  xh: {
    badge: 'IXESHA LOKUQALA LENYANGA',
    title: 'Ndingalawula njani ixesha lam\nlokuqala lenyanga imihla ngemihla?',
    metaDuration: 'Imizuzu emi-5 yokufunda',
    metaType: 'Isikhokelo',
    metaLevel: 'Umqali',
    metaValidated: 'Umxholo ohlolwe',
    intro: 'Ngeenkqubo ezimbalwa ezincinci, ixesha lakho lokuqala lenyanga lingena lula kubomi bakho bemihla ngemihla, esikolweni nangaphaya.',
    contentsTitle: 'Kweli nqaku',
    topics: [
      'Ukuzilungiselela imihla ngemihla',
      'Ukwenza ibhokisi encinci yongxamiseko',
      'Ukuba ixesha lakho lenyanga lifika ngokungalindelekanga',
    ],
    body1: 'Isikolo, ezemidlalo, ukulala: ixesha lakho lenyanga alikuthinteli ukuqhubeka nemisebenzi yakho eqhelekileyo. Kufuneka nje ulungelelanise iinkqubo ezimbalwa ukuze uhlale ukhululekile imini yonke.',
    dailyTips: [
      'Isikolo okanye imisebenzi: gcina ipad okanye i-tampon ebhegini yakho',
      'Ezemidlalo: usengadlala, kodwa lungelelanisa isantya sakho',
      'Ukulala: ipad efanelekileyo yobusuku iyaneliseka',
    ],
    body2: 'Ibhokisi encinci enepad enye okanye ezimbini okanye ii-tampon, iimpahla zangaphantsi ezisisigxina, kunye namalaphu aluncedo inokungena ngokulula ebhegini yesikolo okanye yezemidlalo. Inceda ukuba uzive ukhululekile nokuba kwenzeka ntoni.',
    tip1Title: 'Kulungile ukwazi',
    tip1Text: 'Ukuhlala unepad okanye i-tampon kuphepha uxinzelelo lokubanjwa ungakhange ulungele.',
    body3: 'Oku kwenzeka rhoqo, ngakumbi ekuqaleni. Umongikazi wesikolo, utitshala, okanye umhlobo phantse rhoqo unento enokunceda. Ukubophelela isiqwenga seempahla esinqeni kunganceda nako ngoxa ufuna ipad okanye i-tampon.',
    relatedTitle: '♥  Usenokuthanda ke nale',
    related: [
      {
        title: 'Ndikhethe iyiphi ipad okanye i-tampon yexesha lam lokuqala lenyanga?',
        meta: 'Imizuzu emi-6  ·  Isikhokelo',
      },
      {
        title: 'Ukulawula intlungu yexesha lenyanga',
        meta: 'Imizuzu emi-7  ·  Isikhokelo',
      },
      {
        title: 'Amaxesha am okuqala enyanga awalungelelani: ngaba kuqhelekile?',
        meta: 'Imizuzu emi-5  ·  Isikhokelo',
      },
    ],
    shareMessage: 'Ndingalawula njani ixesha lam lokuqala lenyanga imihla ngemihla? — AWA',
  },
  sn: {
    badge: 'KUMWEDZI KWEKUTANGA',
    title: 'Maitiro ekubata kumwedzi\nkwako kwekutanga zuva nezuva?',
    metaDuration: 'Maminetsi mashanu ekuverenga',
    metaType: 'Gwara',
    metaLevel: 'Anotangira',
    metaValidated: 'Zvakatariswa',
    intro: 'Netsika dzidiki shoma, kumwedzi kwako kwekutanga kunopinda nyore muhupenyu hwako hwezuva nezuva, kuchikoro nepamwe.',
    contentsTitle: 'Muchinyorwa chino',
    topics: [
      'Kuzvironga zuva nezuva',
      'Kugadzira kit diki yezvakaoma',
      'Kana kumwedzi kwako kwasvika zvisina kutarisirwa',
    ],
    body1: 'Chikoro, mitambo, hope: kumwedzi kwako hakukudzivisi kuenderera nezvaunoita zvakajairika. Unongoda kugadzirisa tsika shoma kuti unzwe wakasununguka zuva rose.',
    dailyTips: [
      'Chikoro kana zvaunoita: chengeta padhi kana tampon mubhegi rako',
      'Mitambo: unogona kuramba uchitamba, ingogadzirisa kumhanya kwako',
      'Hope: padhi yakakodzera yeusiku inokwana',
    ],
    body2: 'Kit diki ine padhi kana matampon mamwe kana maviri, kapeti rimwe rekuchinja, nematauro mashoma inogona kupinda nyore mubhegi rechikoro kana remitambo. Inokubatsira kunzwa wakasununguka zvichienda zvose zvichiitika.',
    tip1Title: 'Zvakanaka kuziva',
    tip1Text: 'Kugara une padhi kana tampon newe kunodzivisa kushushikana kwekubatwa usina kugadzirira.',
    body3: 'Izvi zvinoitika kazhinji, kunyanya pakutanga. Nesi wechikoro, mudzidzisi, kana shamwari zvinenge zvine chinogona kubatsira. Kusunga chidimbu chehembe muchiuno chako zvinogonawo kubatsira usati wawana padhi kana tampon.',
    relatedTitle: '♥  Unogona kufarirawo',
    related: [
      {
        title: 'Ndisarudze padhi kana tampon ipi pakumwedzi kwangu kwekutanga?',
        meta: 'Maminetsi 6  ·  Gwara',
      },
      {
        title: 'Kubata kurwadza kwekumwedzi',
        meta: 'Maminetsi 7  ·  Gwara',
      },
      {
        title: 'Kumwedzi kwangu kwekutanga hakurongeki: zvakajairika here?',
        meta: 'Maminetsi 5  ·  Gwara',
      },
    ],
    shareMessage: 'Maitiro ekubata kumwedzi kwako kwekutanga zuva nezuva? — AWA',
  },
  ln: {
    badge: 'SANZA YA LIBOSO',
    title: 'Ndenge nini kokamba\nsanza na ngai ya liboso mokolo na mokolo?',
    metaDuration: 'Minitɛ 5 ya kotánga',
    metaType: 'Buku ya bokambi',
    metaLevel: 'Ya ebandeli',
    metaValidated: 'Makambo oyo ekomami malamu',
    intro: 'Na bizaleli mike, sanza na yo ya liboso ekɔtaka pɛtɛɛ na bomoi na yo ya mokolo na mokolo, na kelasi mpe na bisika mosusu.',
    contentsTitle: 'Na lisolo oyo',
    topics: [
      'Komibongisa mokolo na mokolo',
      'Kobongisa sakɔ moke ya mpasi',
      'Soki sanza na yo eyi na kozela te',
    ],
    body1: 'Kelasi, ba sport, mpɛndɛ: sanza na yo ekangi yo te na misala na yo ya bozalani. Esengeli kaka kobongola bizaleli mike mpo ozala na kimia na mokolo mobimba.',
    dailyTips: [
      'Kelasi to misala: batela pad to tampon na sakɔ na yo',
      'Sport: okoki kokoba kosala sport, bongisa kaka lombango na yo',
      'Mpɛndɛ: pad ya butu oyo ebongi ekoki',
    ],
    body2: 'Sakɔ moke oyo ezali na pad to tampon moko to mibale, elamba ya kati ya kobakisa, mpe mapapye mike ya kopɛtola ekoki kokɔta pɛtɛɛ na sakɔ ya kelasi to ya sport. Esalisaka yo oyoka malamu likambo nyonso oyo ekoya.',
    tip1Title: 'Ezali malamu koyeba',
    tip1Text: 'Kozala ntango nyonso na pad to tampon elongo na yo ekimisaka mpasi ya kokamwa.',
    body3: 'Oyo esalemaka mbala mingi, mingi mingi na ebandeli. Infirmière ya kelasi, molakisi, to moninga ayebi mbala mingi eloko ekoki kosalisa. Kokanga elamba na loketo ekoki mpe kosalisa tii omoni pad to tampon.',
    relatedTitle: '♥  Okoki mpe kolinga',
    related: [
      {
        title: 'Pad to tampon nini ya kopona mpo na sanza na ngai ya liboso?',
        meta: 'Min 6  ·  Buku ya bokambi',
      },
      {
        title: 'Kokamba mpasi ya sanza',
        meta: 'Min 7  ·  Buku ya bokambi',
      },
      {
        title: 'Sanza na ngai ya liboso ezali ya molongo te: ezali ya bozalani?',
        meta: 'Min 5  ·  Buku ya bokambi',
      },
    ],
    shareMessage: 'Ndenge nini kokamba sanza na ngai ya liboso mokolo na mokolo? — AWA',
  },
  ff: {
    badge: 'REGLES ADANNDE',
    title: 'No mi reenata regles\nam adannde nyalaade kala?',
    metaDuration: 'Ɗaɓɓitaago minti 5',
    metaType: 'Paltirgel',
    metaLevel: 'Fuɗɗoode',
    metaValidated: 'Ko nastii ndikkaama',
    intro: 'E kuuje pamaaje seɗɗa, regles maaɗa adannde ɗon nasta nyalaade maaɗa moƴƴum, nder lekkol e ɓaawo.',
    contentsTitle: 'Nder winndannde ndee',
    topics: [
      'Taaskugo nyalaade kala',
      'Taaskugo saaku pamaru ngam saa\'i tampere',
      'Si regles maaɗa yotti bilaa anndugo',
    ],
    body1: 'Lekkol, ɗaɓɓude ɓanndu, ndaneego: regles maaɗa haɓɓataa maaɗa tokkugo kuuje maaɗa sunnaaji. Haani wayrugo kuuje seɗɗa ngam hoosugo hoyre nyalde fuu.',
    dailyTips: [
      'Lekkol malla kuuje: hoosir takkaadu malla tampon nder saaku maaɗa',
      'Ɗaɓɓude ɓanndu: a waaway fahin ɗaɓɓude, wayrir ɓoyɗal maaɗa tan',
      'Ndaneego: takkaadu reenugo jemma ko moƴƴi',
    ],
    body2: 'Saaku pamaru e takkaadu malla tampon gooto malla ɗiɗi, cuuɗi feere, e laawol laaɓal ɗon nasta saaku lekkol malla ɗaɓɓude. Ɗum walla maaɗa hoosugo hoyre ko wayri fuu.',
    tip1Title: 'Ko haani anndugo',
    tip1Text: 'Hoosugo takkaadu malla tampon e maaɗa saa\'i fuu ɓoyɗina tampere ɗum ɗon wara bilaa anndugo.',
    body3: 'Ɗum saa\'i ɗuuɗum waɗa, ɓurɗum nder fuɗɗoode. Nurse lekkol, jannginoowo, malla jaaɓaaɗo saa\'i feere woodi ko walla. Haɓɓugo ngaayka dow hakkunde maaɗa waaway walla saa\'i ɗo a tawata takkaadu malla tampon.',
    relatedTitle: '♥  A waaway yiɗugo fahin',
    related: [
      {
        title: 'Takkaadu malla tampon ɗume mi suɓtay ngam regles am adannde?',
        meta: 'Minti 6  ·  Paltirgel',
      },
      {
        title: 'Reenugo muusal regles',
        meta: 'Minti 7  ·  Paltirgel',
      },
      {
        title: 'Regles am adannde ɗon wayra: ɗum ko wayri?',
        meta: 'Minti 5  ·  Paltirgel',
      },
    ],
    shareMessage: 'No mi reenata regles am adannde nyalaade kala? — AWA',
  },
  id: {
    badge: 'HAID PERTAMA',
    title: 'Bagaimana menjalani\nhaid pertama sehari-hari?',
    metaDuration: '5 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Dengan beberapa kebiasaan kecil, haid pertamamu bisa menyatu dengan mudah dalam kehidupan sehari-hari, di sekolah maupun di luar sekolah.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Mengatur diri sehari-hari',
      'Menyiapkan kit darurat kecil',
      'Jika haidmu datang tiba-tiba',
    ],
    body1: 'Sekolah, olahraga, tidur: haid tidak menghalangimu melanjutkan aktivitas seperti biasa. Kamu hanya perlu menyesuaikan beberapa kebiasaan agar tetap nyaman sepanjang hari.',
    dailyTips: [
      'Sekolah atau kegiatan: simpan pembalut atau tampon di tasmu',
      'Olahraga: kamu tetap bisa berolahraga, cukup sesuaikan temponya',
      'Tidur: pembalut malam yang sesuai sudah cukup',
    ],
    body2: 'Kit kecil berisi satu atau dua pembalut atau tampon, satu celana dalam cadangan, dan beberapa tisu basah mudah dimasukkan ke dalam tas sekolah atau tas olahraga. Ini membuatmu merasa tenang apa pun yang terjadi.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Selalu membawa pembalut atau tampon menghindarkanmu dari stres karena terlanjur tidak siap.',
    body3: 'Hal ini sering terjadi, terutama di awal. Petugas UKS, seorang guru, atau seorang teman hampir selalu punya sesuatu yang bisa membantu. Mengikatkan sepotong pakaian di pinggang juga bisa membantu sementara kamu mencari pembalut atau tampon.',
    relatedTitle: '♥  Mungkin kamu juga suka',
    related: [
      {
        title: 'Pembalut atau tampon apa yang sebaiknya kupilih untuk haid pertamaku?',
        meta: '6 mnt  ·  Panduan',
      },
      {
        title: 'Mengatasi nyeri haid',
        meta: '7 mnt  ·  Panduan',
      },
      {
        title: 'Haid pertamaku tidak teratur: apakah itu normal?',
        meta: '5 mnt  ·  Panduan',
      },
    ],
    shareMessage: 'Bagaimana menjalani haid pertama sehari-hari? — AWA',
  },
  hi: {
    badge: 'पहला पीरियड',
    title: 'पहले पीरियड को रोज़मर्रा\nकी ज़िंदगी में कैसे संभालें?',
    metaDuration: '5 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'जाँची गई जानकारी',
    intro: 'कुछ छोटी आदतों के साथ आपका पहला पीरियड स्कूल और बाकी जगहों पर आपकी रोज़ की ज़िंदगी में आसानी से घुल-मिल जाता है।',
    contentsTitle: 'इस लेख में',
    topics: [
      'रोज़ की तैयारी',
      'एक छोटी इमरजेंसी किट बनाना',
      'अगर पीरियड अचानक आ जाए',
    ],
    body1: 'स्कूल, खेल-कूद, नींद: पीरियड आपको अपनी रोज़ की गतिविधियाँ जारी रखने से नहीं रोकता। बस दिन भर आरामदायक रहने के लिए कुछ आदतें थोड़ी बदलनी होती हैं।',
    dailyTips: [
      'स्कूल या दूसरी गतिविधियाँ: अपने बैग में एक पैड या टैम्पोन रखें',
      'खेल-कूद: आप खेल सकती हैं, बस अपनी रफ़्तार थोड़ी कम-ज़्यादा रखें',
      'नींद: रात के लिए बना सही पैड काफ़ी है',
    ],
    body2: 'एक या दो पैड या टैम्पोन, एक अतिरिक्त अंडरवियर और कुछ वाइप्स की छोटी-सी किट स्कूल या स्पोर्ट्स बैग में आसानी से आ जाती है। इससे कुछ भी हो जाए, आप निश्चिंत रहती हैं।',
    tip1Title: 'जानना अच्छा रहेगा',
    tip1Text: 'हमेशा अपने पास एक पैड या टैम्पोन रखने से अचानक परेशानी में पड़ने का तनाव नहीं रहता।',
    body3: 'ऐसा अक्सर होता है, खासकर शुरुआत में। स्कूल की नर्स, कोई टीचर या कोई दोस्त लगभग हमेशा मदद के लिए कुछ न कुछ दे सकती है। जब तक आपको पैड या टैम्पोन न मिले, कमर के चारों ओर कोई कपड़ा बाँध लेना भी काम आ सकता है।',
    relatedTitle: '♥  ये भी आपको पसंद आ सकता है',
    related: [
      {
        title: 'पहले पीरियड के लिए कौन-सा पैड या टैम्पोन चुनूँ?',
        meta: '6 मिनट  ·  गाइड',
      },
      {
        title: 'पीरियड के दर्द को संभालना',
        meta: '7 मिनट  ·  गाइड',
      },
      {
        title: 'मेरे पहले पीरियड अनियमित हैं: क्या यह सामान्य है?',
        meta: '5 मिनट  ·  गाइड',
      },
    ],
    shareMessage: 'पहले पीरियड को रोज़मर्रा की ज़िंदगी में कैसे संभालें? — AWA',
  },
  sq: {
    badge: 'MENSTRUACIONI I PARË',
    title: 'Si ta menaxhosh\nmenstruacionin e parë çdo ditë?',
    metaDuration: '5 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Me disa zakone të vogla, menstruacioni yt i parë përshtatet lehtë në jetën tënde të përditshme, në shkollë dhe jashtë saj.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Organizimi i përditshëm',
      'Përgatitja e një çante të vogël emergjence',
      'Nëse menstruacioni të vjen papritur',
    ],
    body1: 'Shkolla, sporti, gjumi: menstruacioni nuk të ndalon të vazhdosh aktivitetet e zakonshme. Duhet vetëm të përshtatësh disa zakone për të qenë rehat gjatë gjithë ditës.',
    dailyTips: [
      'Shkolla ose aktivitetet: mbaj një peshqir higjienik ose tampon në çantë',
      'Sporti: mund të vazhdosh të bësh sport, thjesht përshtate ritmin',
      'Gjumi: mjafton një peshqir higjienik i përshtatshëm për natën',
    ],
    body2: 'Një çantë e vogël me një ose dy peshqirë higjienikë ose tamponë, një palë të brendshme rezervë dhe disa shami të lagura futet lehtë në çantën e shkollës ose të sportit. Të ndihmon të ndihesh e qetë çfarëdo që të ndodhë.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Të kesh gjithmonë me vete një peshqir higjienik ose tampon të shmang stresin e të kapurit në befasi.',
    body3: 'Kjo ndodh shpesh, sidomos në fillim. Infermierja e shkollës, një mësuese ose një shoqe pothuajse gjithmonë ka diçka që mund të ndihmojë. Edhe lidhja e një rrobe rreth belit mund të funksionojë, derisa të gjesh një peshqir higjienik ose tampon.',
    relatedTitle: '♥  Mund të të pëlqejnë edhe',
    related: [
      {
        title: 'Cilin peshqir higjienik ose tampon duhet të zgjedh për menstruacionin tim të parë?',
        meta: '6 min  ·  Udhëzues',
      },
      {
        title: 'Menaxhimi i dhimbjes menstruale',
        meta: '7 min  ·  Udhëzues',
      },
      {
        title: 'Menstruacionet e mia të para janë të parregullta: a është normale?',
        meta: '5 min  ·  Udhëzues',
      },
    ],
    shareMessage: 'Si ta menaxhosh menstruacionin e parë çdo ditë? — AWA',
  },
  ja: {
    badge: '初経',
    title: '初めての生理を\n毎日の生活でどう過ごす？',
    metaDuration: '読了5分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '監修済みの内容',
    intro: 'ちょっとした習慣があれば、初めての生理も、学校をはじめ毎日の生活になじみやすくなります。',
    contentsTitle: 'この記事の内容',
    topics: [
      '毎日の過ごし方を整える',
      '小さな緊急ポーチを用意する',
      '生理が突然来たときは',
    ],
    body1: '学校、運動、睡眠。生理があっても、いつもの活動は続けられます。1日を快適に過ごせるように、いくつかの習慣を少し調整するだけで大丈夫です。',
    dailyTips: [
      '学校や習いごと：ナプキンやタンポンをバッグに入れておく',
      '運動：運動はできます。ペースだけ調整しましょう',
      '睡眠：夜用のナプキンを使えば十分です',
    ],
    body2: 'ナプキンやタンポンを1〜2個、替えの下着、ウェットティッシュを入れた小さなポーチは、学校や運動用のバッグに無理なく入ります。何があっても安心して過ごせます。',
    tip1Title: '知っておきたいこと',
    tip1Text: 'ナプキンやタンポンをいつも持ち歩いておくと、不意を突かれる不安を避けられます。',
    body3: '特に最初のころは、よくあることです。保健室の先生、学校の先生、友だちなど、たいていは助けてくれる誰かが何か持っています。ナプキンやタンポンを見つけるまでのあいだ、上着を腰に巻いておく方法もあります。',
    relatedTitle: '♥  こちらもおすすめ',
    related: [
      {
        title: '初めての生理には、ナプキンとタンポンのどちらを選べばいい？',
        meta: '6分  ·  ガイド',
      },
      {
        title: '生理痛との付き合い方',
        meta: '7分  ·  ガイド',
      },
      {
        title: '初めのころの生理が不規則なのは普通？',
        meta: '5分  ·  ガイド',
      },
    ],
    shareMessage: '初めての生理を毎日の生活でどう過ごす？ — AWA',
  },
  ko: {
    badge: '첫 생리',
    title: '첫 생리를\n일상에서 어떻게 관리할까요?',
    metaDuration: '5분 읽기',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '작은 습관 몇 가지만 있으면 첫 생리도 학교를 비롯한 일상에 쉽게 녹아들 수 있어요.',
    contentsTitle: '이 아티클에서는',
    topics: [
      '하루하루 준비하기',
      '작은 비상 키트 꾸리기',
      '생리가 갑자기 시작되면',
    ],
    body1: '학교, 운동, 잠. 생리 때문에 평소 하던 활동을 그만둘 필요는 없어요. 하루 종일 편안하게 지내도록 몇 가지 습관만 조금 조정하면 돼요.',
    dailyTips: [
      '학교나 활동: 가방에 생리대나 탐폰을 하나 넣어 두어요',
      '운동: 운동은 그대로 할 수 있어요. 속도만 조절해요',
      '수면: 밤에 쓰기 알맞은 생리대면 충분해요',
    ],
    body2: '생리대나 탐폰 한두 개, 여분의 속옷 한 벌, 물티슈 몇 장으로 이루어진 작은 키트는 학교 가방이나 운동 가방에 쉽게 들어가요. 어떤 일이 생겨도 마음이 놓여요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '생리대나 탐폰을 항상 가지고 다니면 갑자기 당황하는 스트레스를 피할 수 있어요.',
    body3: '특히 처음에는 이런 일이 자주 있어요. 보건 선생님, 선생님, 친구 중 누군가는 거의 항상 도움이 될 만한 것을 가지고 있어요. 생리대나 탐폰을 구하는 동안 옷을 허리에 둘러 묶는 것도 방법이 될 수 있어요.',
    relatedTitle: '♥  함께 보면 좋은 글',
    related: [
      {
        title: '첫 생리에는 어떤 생리대나 탐폰을 골라야 할까요?',
        meta: '6분  ·  가이드',
      },
      {
        title: '생리통 관리하기',
        meta: '7분  ·  가이드',
      },
      {
        title: '첫 생리가 불규칙해요. 정상인가요?',
        meta: '5분  ·  가이드',
      },
    ],
    shareMessage: '첫 생리를 일상에서 어떻게 관리할까요? — AWA',
  },
  'pt-PT': {
    badge: 'PRIMEIRO PERÍODO',
    title: 'Como gerir o seu\nprimeiro período no dia a dia?',
    metaDuration: '5 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Com alguns pequenos hábitos, o primeiro período integra-se facilmente no seu quotidiano, na escola e fora dela.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Organizar-se no dia a dia',
      'Preparar um pequeno kit de emergência',
      'Se o período chegar de surpresa',
    ],
    body1: 'Escola, desporto, sono: o período não a impede de continuar as suas atividades habituais. Basta ajustar alguns hábitos para se manter confortável ao longo do dia.',
    dailyTips: [
      'Escola ou atividades: tenha um penso ou um tampão na mala',
      'Desporto: pode continuar a praticá-lo, basta adaptar o ritmo',
      'Sono: um penso próprio para a noite é suficiente',
    ],
    body2: 'Um pequeno kit com um ou dois pensos ou tampões, uma muda de roupa interior e alguns toalhetes cabe facilmente numa mochila escolar ou de desporto. Ajuda a sentir-se tranquila aconteça o que acontecer.',
    tip1Title: 'Bom saber',
    tip1Text: 'Ter sempre um penso ou um tampão consigo evita o stress de ser apanhada de surpresa.',
    body3: 'Isto acontece com frequência, sobretudo no início. Uma enfermeira da escola, uma professora ou uma amiga quase sempre têm algo que pode ajudar. Atar uma peça de roupa à volta da cintura também pode resolver enquanto procura um penso ou um tampão.',
    relatedTitle: '♥  Também pode gostar',
    related: [
      {
        title: 'Que penso ou tampão devo escolher para o meu primeiro período?',
        meta: '6 min  ·  Guia',
      },
      {
        title: 'Gerir a dor menstrual',
        meta: '7 min  ·  Guia',
      },
      {
        title: 'Os meus primeiros períodos são irregulares: é normal?',
        meta: '5 min  ·  Guia',
      },
    ],
    shareMessage: 'Como gerir o seu primeiro período no dia a dia? — AWA',
  },
  bn: {
    badge: 'প্রথম মাসিক',
    title: 'প্রথম মাসিক প্রতিদিনের\nজীবনে কীভাবে সামলাবেন?',
    metaDuration: 'পড়তে 5 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'কয়েকটি ছোট অভ্যাসেই আপনার প্রথম মাসিক স্কুলে ও স্কুলের বাইরে প্রতিদিনের জীবনে সহজে মানিয়ে যায়।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'প্রতিদিন গুছিয়ে চলা',
      'একটি ছোট জরুরি কিট তৈরি করা',
      'মাসিক হঠাৎ শুরু হয়ে গেলে',
    ],
    body1: 'স্কুল, খেলাধুলা, ঘুম: মাসিক আপনাকে স্বাভাবিক কাজকর্ম চালিয়ে যেতে বাধা দেয় না। শুধু সারাদিন স্বাচ্ছন্দ্যে থাকার জন্য কয়েকটি অভ্যাস একটু বদলে নিতে হবে।',
    dailyTips: [
      'স্কুল বা অন্যান্য কাজ: ব্যাগে একটি প্যাড বা ট্যাম্পন রাখুন',
      'খেলাধুলা: খেলাধুলা করতে পারেন, শুধু গতি একটু বদলে নিন',
      'ঘুম: রাতের জন্য উপযুক্ত একটি প্যাডই যথেষ্ট',
    ],
    body2: 'এক বা দুটি প্যাড বা ট্যাম্পন, একজোড়া বাড়তি অন্তর্বাস এবং কিছু টিস্যু নিয়ে একটি ছোট কিট সহজেই স্কুল বা খেলার ব্যাগে ধরে যায়। যা-ই ঘটুক, এটি আপনাকে নিশ্চিন্তে থাকতে সাহায্য করে।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'সবসময় সঙ্গে একটি প্যাড বা ট্যাম্পন রাখলে হঠাৎ অপ্রস্তুত হয়ে পড়ার দুশ্চিন্তা এড়ানো যায়।',
    body3: 'এমনটা প্রায়ই ঘটে, বিশেষ করে শুরুর দিকে। স্কুলের নার্স, কোনো শিক্ষক বা বান্ধবীর কাছে প্রায় সবসময়ই সাহায্য করার মতো কিছু থাকে। প্যাড বা ট্যাম্পন জোগাড় করার সময় কোমরে একটি কাপড় বেঁধে নিলেও কাজ চলে।',
    relatedTitle: '♥  আপনার আরও ভালো লাগতে পারে',
    related: [
      {
        title: 'প্রথম মাসিকের জন্য কোন প্যাড বা ট্যাম্পন বেছে নেব?',
        meta: '6 মিনিট  ·  গাইড',
      },
      {
        title: 'মাসিকের ব্যথা সামলানো',
        meta: '7 মিনিট  ·  গাইড',
      },
      {
        title: 'আমার প্রথম দিকের মাসিক অনিয়মিত: এটা কি স্বাভাবিক?',
        meta: '5 মিনিট  ·  গাইড',
      },
    ],
    shareMessage: 'প্রথম মাসিক প্রতিদিনের জীবনে কীভাবে সামলাবেন? — AWA',
  },
  da: {
    badge: 'FØRSTE MENSTRUATION',
    title: 'Hvad gør du med din første\nmenstruation i hverdagen?',
    metaDuration: '5 min læsning',
    metaType: 'Guide',
    metaLevel: 'Grundlæggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Et par små vaner er alt, hvad du behøver for nemt at håndtere din første menstruation i hverdagen, i skolen og udenfor.',
    contentsTitle: 'I denne artikel',
    topics: [
      'At holde styr på hverdagen',
      'At lave en lille nødkit',
      'Hvis menstruationen starter uventet',
    ],
    body1: 'Skole, sport, søvn: menstruation forhindrer dig ikke i at fortsætte dine normale aktiviteter. Du skal blot ændre et par vaner for at have det godt hele dagen.',
    dailyTips: [
      'Skole eller andre aktiviteter: hav et bind eller en tampon i tasken',
      'Sport: du kan stadig dyrke sport, bare juster intensiteten lidt',
      'Søvn: et natbind er nok om natten',
    ],
    body2: 'Et eller to bind eller tamponer, et ekstra par underbukser og lidt toiletpapir udgør en lille kit, der nemt kan ligge i en skole- eller sportstaske. Uanset hvad der sker, hjælper det dig med at føle dig tryg.',
    tip1Title: 'Godt at vide',
    tip1Text: 'At have et bind eller en tampon med til enhver tid hjælper dig med at undgå bekymringen om at blive taget på sengen.',
    body3: 'Det sker tit, især i starten. Skolesygeplejersken, en lærer eller en veninde har næsten altid noget at hjælpe med. Mens du finder et bind eller en tampon, kan du binde et stykke stof om livet.',
    relatedTitle: '♥  Du vil måske også synes om',
    related: [
      {
        title: 'Hvilken beskyttelse skal jeg vælge til min første menstruation?',
        meta: '6 min  ·  Guide',
      },
      {
        title: 'At håndtere menstruationssmerter',
        meta: '7 min  ·  Guide',
      },
      {
        title: 'Er min tidlige menstruation uregelmæssig: er det normalt?',
        meta: '5 min  ·  Guide',
      },
    ],
    shareMessage: 'Hvad gør du med din første menstruation i hverdagen? — AWA',
  },
  sv: {
    badge: 'FÖRSTE MENSTRUATION',
    title: 'Hvad gör du med din förste\nmenstruation i hverdagen?',
    metaDuration: '5 min läsning',
    metaType: 'Guide',
    metaLevel: 'Grundläggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Et par små vaner ar alt, hvad du behöver for nemt at håndtere din förste menstruation i hverdagen, i skolen och udenfor.',
    contentsTitle: 'I denne artikel',
    topics: [
      'At holde styr på hverdagen',
      'At lave en lille nödkit',
      'Hvis menstruationen starter uventet',
    ],
    body1: 'Skole, sport, sövn: menstruation forhindrer dig inte i at fortsätte dina normale aktiviteter. Du skal blot ändre et par vaner for att have det godt hele dagen.',
    dailyTips: [
      'Skole eller andre aktiviteter: hav et bind eller en tampon i tasken',
      'Sport: du kan fortfarande dyrke sport, bare juster intensiteten lidt',
      'Sövn: et natbind ar nok om natten',
    ],
    body2: 'Et eller to bind eller tamponer, et ekstra par underbukser och lite toiletpapir udgör en lille kit, der nemt kan ligge i en skole- eller sportstaske. Uanset hvad der sker, hjälper det dig med at föle dig tryg.',
    tip1Title: 'Godt at vide',
    tip1Text: 'At have et bind eller en tampon med till enhver tid hjälper dig med at undgå bekymringen om at blive taget på sengen.',
    body3: 'Det sker tit, isär i starten. Skolesygeplejersken, en lärer eller en veninde har nästen alltid noget at hjälpe med. Mens du finder et bind eller en tampon, kan du binde et stykke stof om livet.',
    relatedTitle: '♥  Du vil måske også synes om',
    related: [
      {
        title: 'Hvilken beskyttelse skal jag välge till min förste menstruation?',
        meta: '6 min  ·  Guide',
      },
      {
        title: 'At håndtere menstruationssmerter',
        meta: '7 min  ·  Guide',
      },
      {
        title: 'Er min tidlige menstruation uregelmässig: ar det normalt?',
        meta: '5 min  ·  Guide',
      },
    ],
    shareMessage: 'Hvad gör du med din förste menstruation i hverdagen? — AWA',
  },
  nb: {
    badge: 'FØRSTE MENS',
    title: 'Hvordan håndterer du\nden første mensen i hverdagen?',
    metaDuration: '5 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Med noen små vaner passer den første mensen lett inn i hverdagen din, på skolen og ellers.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Organisere seg i hverdagen',
      'Sette sammen et lite nødsett',
      'Hvis mensen kommer uventet',
    ],
    body1: 'Skole, idrett, søvn: mensen hindrer deg ikke i å fortsette med de vanlige aktivitetene dine. Du trenger bare å justere noen vaner for å føle deg komfortabel gjennom dagen.',
    dailyTips: [
      'Skole eller aktiviteter: ha et bind eller en tampong i vesken',
      'Idrett: du kan fortsatt drive med idrett, bare juster tempoet',
      'Søvn: et egnet nattbind er nok',
    ],
    body2: 'Et lite sett med ett eller to bind eller tamponger, en ekstra truse og noen våtservietter får lett plass i en skole- eller sportsbag. Det hjelper deg å føle deg trygg uansett hva som skjer.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Å alltid ha et bind eller en tampong med seg unngår stresset ved å bli tatt på sengen.',
    body3: 'Dette skjer ofte, særlig i begynnelsen. Helsesykepleieren på skolen, en lærer eller en venninne har nesten alltid noe som kan hjelpe. Å knytte et klesplagg rundt livet kan også fungere mens du finner et bind eller en tampong.',
    relatedTitle: '♥  Dette liker du kanskje også',
    related: [
      {
        title: 'Hvilket bind eller hvilken tampong bør jeg velge til den første mensen?',
        meta: '6 min  ·  Veiledning',
      },
      {
        title: 'Håndtere menstruasjonssmerter',
        meta: '7 min  ·  Veiledning',
      },
      {
        title: 'De første menstruasjonene mine er uregelmessige: er det normalt?',
        meta: '5 min  ·  Veiledning',
      },
    ],
    shareMessage: 'Hvordan håndterer du den første mensen i hverdagen? – AWA',
  },
  pl: {
    badge: 'PIERWSZA MIESIĄCZKA',
    title: 'Jak radzić sobie z pierwszą\nmiesiączką na co dzień?',
    metaDuration: '5 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Dzięki kilku małym nawykom pierwsza miesiączka łatwo wpisze się w Twoje codzienne życie, w szkole i poza nią.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Organizacja na co dzień',
      'Skompletowanie małego zestawu awaryjnego',
      'Gdy miesiączka pojawi się nieoczekiwanie',
    ],
    body1: 'Szkoła, sport, sen: miesiączka nie przeszkadza Ci w kontynuowaniu zwykłych zajęć. Wystarczy dostosować kilka nawyków, by czuć się komfortowo przez cały dzień.',
    dailyTips: [
      'Szkoła lub zajęcia: noś w torbie podpaskę lub tampon',
      'Sport: nadal możesz ćwiczyć, po prostu dostosuj tempo',
      'Sen: wystarczy odpowiednia podpaska na noc',
    ],
    body2: 'Mały zestaw z jedną lub dwiema podpaskami albo tamponami, zapasowymi majtkami i chusteczkami z łatwością zmieści się w szkolnej lub sportowej torbie. Pomaga czuć się swobodnie, cokolwiek się wydarzy.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Zawsze mając przy sobie podpaskę lub tampon, unikasz stresu związanego z zaskoczeniem.',
    body3: 'Zdarza się to często, zwłaszcza na początku. Pielęgniarka szkolna, nauczycielka lub koleżanka prawie zawsze ma coś, co może pomóc. Zawiązanie ubrania wokół talii też może pomóc, zanim znajdziesz podpaskę lub tampon.',
    relatedTitle: '♥  Może Cię też zainteresować',
    related: [
      {
        title: 'Którą podpaskę lub tampon wybrać na pierwszą miesiączkę?',
        meta: '6 min  ·  Poradnik',
      },
      {
        title: 'Jak radzić sobie z bólem miesiączkowym',
        meta: '7 min  ·  Poradnik',
      },
      {
        title: 'Moja pierwsza miesiączka jest nieregularna: czy to normalne?',
        meta: '5 min  ·  Poradnik',
      },
    ],
    shareMessage: 'Jak radzić sobie z pierwszą miesiączką na co dzień? — AWA',
  },
  uk: {
    badge: 'ПЕРША МЕНСТРУАЦІЯ',
    title: 'Як упоратися з першою\nменструацією щодня?',
    metaDuration: '5 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Завдяки кільком маленьким звичкам перша менструація легко впишеться у ваше повсякденне життя — у школі та поза нею.',
    contentsTitle: 'У цій статті',
    topics: [
      'Організація на щодень',
      'Збирання невеликого аварійного набору',
      'Якщо менструація почалася несподівано',
    ],
    body1: 'Школа, спорт, сон: менструація не заважає вам продовжувати звичні заняття. Потрібно лише трохи підлаштувати кілька звичок, щоб почуватися комфортно протягом дня.',
    dailyTips: [
      'Школа чи заняття: тримайте в сумці прокладку або тампон',
      'Спорт: ви все ще можете займатися, просто підлаштуйте темп',
      'Сон: достатньо відповідної нічної прокладки',
    ],
    body2: 'Невеликий набір з однією-двома прокладками чи тампонами, запасними трусиками та вологими серветками легко вміститься у шкільну чи спортивну сумку. Він допомагає почуватися спокійно, що б не трапилося.',
    tip1Title: 'Варто знати',
    tip1Text: 'Якщо завжди мати при собі прокладку або тампон, можна уникнути стресу від несподіванки.',
    body3: 'Таке трапляється часто, особливо спочатку. Шкільна медсестра, вчителька або подруга майже завжди має щось, що може допомогти. Зав’язаний навколо пояса одяг також може виручити, поки ви знайдете прокладку чи тампон.',
    relatedTitle: '♥  Вас також може зацікавити',
    related: [
      {
        title: 'Яку прокладку чи тампон обрати для першої менструації?',
        meta: '6 хв  ·  Посібник',
      },
      {
        title: 'Як упоратися з менструальним болем',
        meta: '7 хв  ·  Посібник',
      },
      {
        title: 'Моя перша менструація нерегулярна: це нормально?',
        meta: '5 хв  ·  Посібник',
      },
    ],
    shareMessage: 'Як упоратися з першою менструацією щодня? — AWA',
  },
  cs: {
    badge: 'PRVNÍ MENSTRUACE',
    title: 'Jak zvládat první\nmenstruaci v každodenním životě?',
    metaDuration: '5 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'S několika drobnými návyky zapadne vaše první menstruace snadno do každodenního života, ve škole i mimo ni.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Organizace v každodenním životě',
      'Sestavení malé záchranné soupravy',
      'Když menstruace přijde nečekaně',
    ],
    body1: 'Škola, sport, spánek: menstruace vám nebrání pokračovat v obvyklých činnostech. Stačí upravit několik návyků, abyste se po celý den cítila dobře.',
    dailyTips: [
      'Škola nebo aktivity: mějte v tašce vložku nebo tampon',
      'Sport: můžete dál sportovat, jen přizpůsobte tempo',
      'Spánek: stačí vhodná noční vložka',
    ],
    body2: 'Malá souprava s jednou či dvěma vložkami nebo tampony, náhradními kalhotkami a vlhčenými ubrousky se snadno vejde do školní či sportovní tašky. Pomůže vám cítit se v pohodě, ať se stane cokoli.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Mít vždy u sebe vložku nebo tampon vás ušetří stresu z toho, že budete zaskočena.',
    body3: 'Stává se to často, zejména zpočátku. Školní zdravotní sestra, učitelka nebo kamarádka má téměř vždy něco, co pomůže. Uvázat si oblečení kolem pasu může také pomoci, než seženete vložku nebo tampon.',
    relatedTitle: '♥  Mohlo by se vám líbit',
    related: [
      {
        title: 'Jakou vložku nebo tampon zvolit při první menstruaci?',
        meta: '6 min  ·  Průvodce',
      },
      {
        title: 'Zvládání menstruační bolesti',
        meta: '7 min  ·  Průvodce',
      },
      {
        title: 'Moje první menstruace jsou nepravidelné: je to normální?',
        meta: '5 min  ·  Průvodce',
      },
    ],
    shareMessage: 'Jak zvládat první menstruaci v každodenním životě? — AWA',
  },
  sk: {
    badge: 'PRVÁ MENŠTRUÁCIA',
    title: 'Ako zvládať prvú\nmenštruáciu v každodennom živote?',
    metaDuration: '5 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'S niekoľkými malými návykmi sa vaša prvá menštruácia ľahko zapojí do každodenného života, v škole aj mimo nej.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Organizácia v každodennom živote',
      'Zostavenie malej núdzovej súpravy',
      'Ak menštruácia príde nečakane',
    ],
    body1: 'Škola, šport, spánok: menštruácia vám nebráni pokračovať v bežných aktivitách. Stačí upraviť niekoľko návykov, aby ste sa počas dňa cítili pohodlne.',
    dailyTips: [
      'Škola alebo aktivity: majte v taške vložku alebo tampón',
      'Šport: môžete naďalej športovať, len prispôsobte tempo',
      'Spánok: stačí vhodná nočná vložka',
    ],
    body2: 'Malá súprava s jednou či dvoma vložkami alebo tampónmi, náhradnými nohavičkami a vlhčenými obrúskami sa ľahko zmestí do školskej alebo športovej tašky. Pomáha vám cítiť sa v pohode, nech sa stane čokoľvek.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Ak máte vždy pri sebe vložku alebo tampón, vyhnete sa stresu z prekvapenia.',
    body3: 'Stáva sa to často, najmä spočiatku. Školská sestra, učiteľka alebo kamarátka majú takmer vždy niečo, čo môže pomôcť. Uviazanie kusu oblečenia okolo pása môže tiež fungovať, kým nájdete vložku alebo tampón.',
    relatedTitle: '♥  Mohlo by sa vám páčiť',
    related: [
      {
        title: 'Ktorú vložku alebo tampón si vybrať na prvú menštruáciu?',
        meta: '6 min  ·  Sprievodca',
      },
      {
        title: 'Zvládanie menštruačných bolestí',
        meta: '7 min  ·  Sprievodca',
      },
      {
        title: 'Moje prvé menštruácie sú nepravidelné: je to normálne?',
        meta: '5 min  ·  Sprievodca',
      },
    ],
    shareMessage: 'Ako zvládať prvú menštruáciu v každodennom živote? — AWA',
  },
  hu: {
    badge: 'AZ ELSŐ MENSTRUÁCIÓ',
    title: 'Hogyan kezeljem az első\nmenstruációmat a mindennapokban?',
    metaDuration: '5 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Néhány apró szokással az első menstruációd könnyen beilleszthető a mindennapjaidba, az iskolában és azon kívül is.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Szervezkedés a mindennapokban',
      'Kis vészhelyzeti csomag összeállítása',
      'Ha a menstruáció váratlanul jön meg',
    ],
    body1: 'Iskola, sport, alvás: a menstruáció nem akadályoz a megszokott tevékenységeid folytatásában. Csak néhány szokáson kell változtatnod, hogy a nap folyamán kényelmesen érezd magad.',
    dailyTips: [
      'Iskola vagy tevékenységek: tarts a táskádban betétet vagy tampont',
      'Sport: továbbra is sportolhatsz, csak igazítsd a tempót',
      'Alvás: elég egy megfelelő éjszakai betét',
    ],
    body2: 'Egy kis csomag egy-két betéttel vagy tampónnal, tartalék bugyival és nedves törlőkendőkkel könnyen elfér egy iskolai vagy sporttáskában. Segít, hogy bármi történjék, jól érezd magad.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'Ha mindig van nálad betét vagy tampon, elkerülöd a meglepetés stresszét.',
    body3: 'Ez gyakran megesik, főleg az elején. Az iskolai ápolónőnél, egy tanárnál vagy egy barátnőnél szinte mindig van valami, ami segíthet. Egy ruhadarab a derekad köré kötve is megoldás lehet, amíg betétet vagy tampont találsz.',
    relatedTitle: '♥  Ez is tetszhet',
    related: [
      {
        title: 'Melyik betétet vagy tampont válasszam az első menstruációmra?',
        meta: '6 perc  ·  Útmutató',
      },
      {
        title: 'A menstruációs fájdalom kezelése',
        meta: '7 perc  ·  Útmutató',
      },
      {
        title: 'Az első menstruációim szabálytalanok: ez normális?',
        meta: '5 perc  ·  Útmutató',
      },
    ],
    shareMessage: 'Hogyan kezeljem az első menstruációmat a mindennapokban? — AWA',
  },
  ro: {
    badge: 'PRIMA MENSTRUAȚIE',
    title: 'Cum îți gestionezi prima\nmenstruație zi de zi?',
    metaDuration: '5 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Cu câteva obiceiuri mici, prima ta menstruație se integrează ușor în viața ta de zi cu zi, la școală și în afara ei.',
    contentsTitle: 'În acest articol',
    topics: [
      'Organizarea de zi cu zi',
      'Pregătirea unei mici truse de urgență',
      'Dacă menstruația sosește pe neașteptate',
    ],
    body1: 'Școală, sport, somn: menstruația nu te oprește să-ți continui activitățile obișnuite. Trebuie doar să-ți ajustezi câteva obiceiuri pentru a rămâne confortabil pe tot parcursul zilei.',
    dailyTips: [
      'Școală sau activități: ține un absorbant sau un tampon în geantă',
      'Sport: poți face în continuare sport, doar ajustează-ți ritmul',
      'Somn: un absorbant potrivit pentru noapte este suficient',
    ],
    body2: 'O mică trusă cu unul sau două absorbante sau tampoane, o pereche de chiloți de schimb și câteva șervețele încape ușor într-o geantă de școală sau de sport. Te ajută să te simți bine indiferent ce se întâmplă.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Să ai mereu la tine un absorbant sau un tampon te scutește de stresul de a fi prinsă nepregătită.',
    body3: 'Se întâmplă des, mai ales la început. O asistentă școlară, o profesoară sau o prietenă are aproape întotdeauna ceva care te poate ajuta. Legarea unei haine în jurul taliei poate funcționa și ea cât timp găsești un absorbant sau un tampon.',
    relatedTitle: '♥  Ți-ar putea plăcea și',
    related: [
      {
        title: 'Ce absorbant sau tampon să aleg pentru prima menstruație?',
        meta: '6 min  ·  Ghid',
      },
      {
        title: 'Gestionarea durerilor menstruale',
        meta: '7 min  ·  Ghid',
      },
      {
        title: 'Primele mele menstruații sunt neregulate: este normal?',
        meta: '5 min  ·  Ghid',
      },
    ],
    shareMessage: 'Cum îți gestionezi prima menstruație zi de zi? — AWA',
  },
  bg: {
    badge: 'ПЪРВА МЕНСТРУАЦИЯ',
    title: 'Как да се справяш с първата си\nменструация в ежедневието?',
    metaDuration: '5 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'С няколко малки навика първата ти менструация се вписва лесно в ежедневието ти, в училище и извън него.',
    contentsTitle: 'В тази статия',
    topics: [
      'Организиране в ежедневието',
      'Приготвяне на малък комплект за спешни случаи',
      'Ако менструацията дойде неочаквано',
    ],
    body1: 'Училище, спорт, сън: менструацията не те спира да продължиш обичайните си дейности. Просто трябва да приспособиш няколко навика, за да си комфортна през целия ден.',
    dailyTips: [
      'Училище или дейности: носи превръзка или тампон в чантата си',
      'Спорт: можеш да продължиш да спортуваш, просто приспособи темпото си',
      'Сън: достатъчна е подходяща нощна превръзка',
    ],
    body2: 'Малък комплект с една-две превръзки или тампона, резервна долна част от бельо и няколко мокри кърпички лесно се събира в училищна или спортна чанта. Помага ти да се чувстваш спокойно, каквото и да се случи.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Да носиш винаги превръзка или тампон със себе си избягва стреса да бъдеш изненадана.',
    body3: 'Това се случва често, особено в началото. Училищната медицинска сестра, учителка или приятелка почти винаги има нещо, което може да помогне. Завързването на дреха около кръста също може да свърши работа, докато намериш превръзка или тампон.',
    relatedTitle: '♥  Може да ти хареса и',
    related: [
      {
        title: 'Каква превръзка или тампон да избера за първата си менструация?',
        meta: '6 мин  ·  Ръководство',
      },
      {
        title: 'Справяне с менструалната болка',
        meta: '7 мин  ·  Ръководство',
      },
      {
        title: 'Първите ми менструации са нередовни: нормално ли е?',
        meta: '5 мин  ·  Ръководство',
      },
    ],
    shareMessage: 'Как да се справяш с първата си менструация в ежедневието? — AWA',
  },
  sr: {
    badge: 'ПРВА МЕНСТРУАЦИЈА',
    title: 'Како да организујеш прву\nменструацију из дана у дан?',
    metaDuration: '5 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Уз неколико малих навика, твоја прва менструација лако се уклапа у свакодневни живот, у школи и ван ње.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Организација из дана у дан',
      'Састављање малог комплета за хитне случајеве',
      'Ако ти менструација стигне неочекивано',
    ],
    body1: 'Школа, спорт, сан: менструација те не спречава да наставиш уобичајене активности. Само треба да прилагодиш неколико навика да би остала удобно током целог дана.',
    dailyTips: [
      'Школа или активности: држи улошак или тампон у торби',
      'Спорт: и даље можеш да се бавиш спортом, само прилагоди темпо',
      'Сан: довољан је одговарајући ноћни улошак',
    ],
    body2: 'Мали комплет са једним или два улошка или тампона, резервним доњим вешом и неколико марамица лако стаје у школску или спортску торбу. Помаже ти да се осећаш мирно шта год да се догоди.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Ако увек носиш улошак или тампон са собом, избегаваш стрес да те ствар затекне неприпремљену.',
    body3: 'Ово се често дешава, нарочито на почетку. Школска медицинска сестра, наставник или другарица готово увек има нешто што може помоћи. Привезивање комада одеће око струка такође може помоћи док не пронађеш улошак или тампон.',
    relatedTitle: '♥  Можда ће ти се свидети и',
    related: [
      {
        title: 'Који улошак или тампон да изаберем за прву менструацију?',
        meta: '6 мин  ·  Водич',
      },
      {
        title: 'Како се носити са менструалним боловима',
        meta: '7 мин  ·  Водич',
      },
      {
        title: 'Моје прве менструације су неправилне: да ли је то нормално?',
        meta: '5 мин  ·  Водич',
      },
    ],
    shareMessage: 'Како да организујеш прву менструацију из дана у дан? — AWA',
  },
  hr: {
    badge: 'PRVA MENSTRUACIJA',
    title: 'Kako se nositi s prvom\nmenstruacijom iz dana u dan?',
    metaDuration: '5 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Uz nekoliko malih navika tvoja prva menstruacija lako se uklapa u svakodnevicu, u školi i izvan nje.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Organizacija iz dana u dan',
      'Sastavljanje malog kompleta za hitne slučajeve',
      'Ako menstruacija stigne neočekivano',
    ],
    body1: 'Škola, sport, san: menstruacija te ne sprječava da nastaviš uobičajene aktivnosti. Samo trebaš prilagoditi nekoliko navika kako bi ti tijekom dana bilo ugodno.',
    dailyTips: [
      'Škola ili aktivnosti: u torbi drži uložak ili tampon',
      'Sport: i dalje se možeš baviti sportom, samo prilagodi tempo',
      'San: dovoljan je prikladan noćni uložak',
    ],
    body2: 'Mali komplet s jednim ili dva uloška ili tampona, rezervnim donjim rubljem i vlažnim maramicama lako stane u školsku ili sportsku torbu. Pomaže ti da se osjećaš sigurno što god se dogodilo.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Ako uvijek nosiš uložak ili tampon sa sobom, izbjeći ćeš stres zbog iznenađenja.',
    body3: 'To se često događa, osobito na početku. Školska medicinska sestra, učiteljica ili prijateljica gotovo uvijek ima nešto što može pomoći. Vezivanje odjevnog predmeta oko struka također može poslužiti dok ne nađeš uložak ili tampon.',
    relatedTitle: '♥  Moglo bi ti se svidjeti',
    related: [
      {
        title: 'Koji uložak ili tampon odabrati za prvu menstruaciju?',
        meta: '6 min  ·  Vodič',
      },
      {
        title: 'Nošenje s menstrualnom boli',
        meta: '7 min  ·  Vodič',
      },
      {
        title: 'Moje prve menstruacije su nepravilne: je li to normalno?',
        meta: '5 min  ·  Vodič',
      },
    ],
    shareMessage: 'Kako se nositi s prvom menstruacijom iz dana u dan? — AWA',
  },
  bs: {
    badge: 'PRVA MENSTRUACIJA',
    title: 'Kako se nositi s prvom\nmenstruacijom iz dana u dan?',
    metaDuration: '5 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Uz nekoliko malih navika tvoja prva menstruacija lako se uklapa u svakodnevicu, u školi i izvan nje.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Organizacija iz dana u dan',
      'Sastavljanje malog kompleta za hitne slučajeve',
      'Ako menstruacija stigne neočekivano',
    ],
    body1: 'Škola, sport, san: menstruacija te ne sprječava da nastaviš uobičajene aktivnosti. Samo trebaš prilagoditi nekoliko navika kako bi ti tokom dana bilo ugodno.',
    dailyTips: [
      'Škola ili aktivnosti: u torbi drži uložak ili tampon',
      'Sport: i dalje se možeš baviti sportom, samo prilagodi tempo',
      'San: dovoljan je prikladan noćni uložak',
    ],
    body2: 'Mali komplet s jednim ili dva uloška ili tampona, rezervnim donjim rubljem i vlažnim maramicama lako stane u školsku ili sportsku torbu. Pomaže ti da se osjećaš sigurno što god se dogodilo.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Ako uvijek nosiš uložak ili tampon sa sobom, izbjeći ćeš stres zbog iznenađenja.',
    body3: 'To se često događa, osobito na početku. Školska medicinska sestra, učiteljica ili prijateljica gotovo uvijek ima nešta što može pomoći. Vezivanje odjevnog predmeta oko struka također može poslužiti dok ne nađeš uložak ili tampon.',
    relatedTitle: '♥  Moglo bi ti se svidjeti',
    related: [
      {
        title: 'Koji uložak ili tampon odabrati za prvu menstruaciju?',
        meta: '6 min  ·  Vodič',
      },
      {
        title: 'Nošenje s menstrualnom boli',
        meta: '7 min  ·  Vodič',
      },
      {
        title: 'Moje prve menstruacije su nepravilne: je li to normalno?',
        meta: '5 min  ·  Vodič',
      },
    ],
    shareMessage: 'Kako se nositi s prvom menstruacijom iz dana u dan? — AWA',
  },
  sl: {
    badge: 'PRVA MENSTRUACIJA',
    title: 'Kako se soočiti s prvo\nmenstruacijo iz dneva v dan?',
    metaDuration: '5 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Z nekaj majhnimi navadami se tvoja prva menstruacija zlahka vključi v vsakdan, v šoli in drugje.',
    contentsTitle: 'V tem članku',
    topics: [
      'Organizacija iz dneva v dan',
      'Sestavljanje majhnega kompleta za nujne primere',
      'Če menstruacija pride nepričakovano',
    ],
    body1: 'Šola, šport, spanje: menstruacija te ne ovira pri nadaljevanju običajnih dejavnosti. Samo nekaj navad moraš prilagoditi, da se čez dan počutiš udobno.',
    dailyTips: [
      'Šola ali dejavnosti: v torbi imej vložek ali tampon',
      'Šport: še vedno se lahko ukvarjaš s športom, samo prilagodi tempo',
      'Spanje: dovolj je primeren nočni vložek',
    ],
    body2: 'Majhen komplet z enim ali dvema vložkoma ali tamponoma, rezervnim spodnjim perilom in robčki zlahka stane v šolsko ali športno torbo. Pomaga ti, da se počutiš varno, karkoli se zgodi.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Če imaš vedno s seboj vložek ali tampon, se izogneš stresu zaradi presenečenja.',
    body3: 'To se pogosto dogaja, zlasti na začetku. Šolska medicinska sestra, učiteljica ali prijateljica ima skoraj vedno kaj, kar lahko pomaga. Tudi povezovanje oblačila okoli pasu lahko pomaga, dokler ne najdeš vložka ali tampona.',
    relatedTitle: '♥  Morda ti bo všeč tudi',
    related: [
      {
        title: 'Kateri vložek ali tampon izbrati za prvo menstruacijo?',
        meta: '6 min  ·  Vodnik',
      },
      {
        title: 'Obvladovanje menstrualne bolečine',
        meta: '7 min  ·  Vodnik',
      },
      {
        title: 'Moje prve menstruacije so neredne: je to normalno?',
        meta: '5 min  ·  Vodnik',
      },
    ],
    shareMessage: 'Kako se soočiti s prvo menstruacijo iz dneva v dan? — AWA',
  },
  ne: {
    badge: 'पहिलो महिनावारी',
    title: 'आफ्नो पहिलो महिनावारी\nदैनिक जीवनमा कसरी सम्हाल्ने?',
    metaDuration: '5 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'केही साना बानीहरूसँगै, तपाईंको पहिलो महिनावारी विद्यालय र त्यसभन्दा बाहिर पनि दैनिक जीवनमा सजिलै मिल्छ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'दैनिक रूपमा व्यवस्थित हुने',
      'आपतकालीन सानो किट तयार गर्ने',
      'अप्रत्याशित रूपमा महिनावारी आए',
    ],
    body1: 'विद्यालय, खेलकुद, निद्रा: तपाईंको महिनावारीले तपाईंलाई सामान्य गतिविधि जारी राख्नबाट रोक्दैन। दिनभर सहज रहन केही बानीहरू मात्र मिलाउनुपर्छ।',
    dailyTips: [
      'विद्यालय वा गतिविधिहरू: आफ्नो झोलामा एउटा प्याड वा ट्याम्पोन राख्नुहोस्',
      'खेलकुद: तपाईं अझै खेलकुद खेल्न सक्नुहुन्छ, केवल आफ्नो गति मिलाउनुहोस्',
      'निद्रा: राति मिल्ने एउटा प्याड नै पर्याप्त छ',
    ],
    body2: 'एक-दुई प्याड वा ट्याम्पोन, एक जोर थप अन्तर्वस्त्र र केही वाइप्ससहितको सानो किट विद्यालय वा खेलकुदको झोलामा सजिलै अटाउँछ। जे भए पनि यसले तपाईंलाई सहज महसुस गराउँछ।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'सधैँ आफूसँग एउटा प्याड वा ट्याम्पोन राख्नाले अचानक पर्ने तनावबाट बचाउँछ।',
    body3: 'यस्तो प्रायः हुन्छ, विशेष गरी सुरुमा। विद्यालयको नर्स, शिक्षक वा साथीसँग लगभग सधैँ मद्दत गर्न सक्ने कुनै चीज हुन्छ। प्याड वा ट्याम्पोन खोज्दासम्म कम्मरमा लुगा बाँध्नु पनि काम लाग्न सक्छ।',
    relatedTitle: '♥  तपाईंलाई यी पनि मन पर्न सक्छन्',
    related: [
      {
        title: 'पहिलो महिनावारीका लागि कुन प्याड वा ट्याम्पोन छान्ने?',
        meta: '6 मिनेट  ·  मार्गदर्शन',
      },
      {
        title: 'महिनावारीको दुखाइ सम्हाल्ने',
        meta: '7 मिनेट  ·  मार्गदर्शन',
      },
      {
        title: 'मेरा पहिलो महिनावारीहरू अनियमित छन्: के यो सामान्य हो?',
        meta: '5 मिनेट  ·  मार्गदर्शन',
      },
    ],
    shareMessage: 'आफ्नो पहिलो महिनावारी दैनिक जीवनमा कसरी सम्हाल्ने? — AWA',
  },
  si: {
    badge: 'පළමු ඔසප්',
    title: 'ඔබේ පළමු ඔසප් දිනපතා\nකළමනාකරණය කරන්නේ කෙසේද?',
    metaDuration: 'කියවීමට මිනිත්තු 5',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'කුඩා පුරුදු කිහිපයක් සමඟ, ඔබේ පළමු ඔසප් පාසලේදී සහ ඉන් පිටතදී ඔබේ එදිනෙදා ජීවිතයට පහසුවෙන් ගැළපේ.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'එදිනෙදා ජීවිතයේ සංවිධානය වීම',
      'කුඩා හදිසි කට්ටලයක් සකස් කිරීම',
      'ඔබේ ඔසප් අනපේක්ෂිතව පැමිණියහොත්',
    ],
    body1: 'පාසල, ක්‍රීඩා, නින්ද: ඔබේ ඔසප් ඔබේ සුපුරුදු ක්‍රියාකාරකම් දිගටම කරගෙන යාමෙන් ඔබව නොනවත්වයි. දවස පුරා සුවපහසුව පවත්වා ගැනීමට ඔබට පුරුදු කිහිපයක් පමණක් සකස් කළ යුතුයි.',
    dailyTips: [
      'පාසල හෝ ක්‍රියාකාරකම්: ඔබේ බෑගයේ පෑඩ් එකක් හෝ ටැම්පන් එකක් තබාගන්න',
      'ක්‍රීඩා: ඔබට තවමත් ක්‍රීඩා කළ හැක, ඔබේ වේගය පමණක් සකස් කරන්න',
      'නින්ද: සුදුසු රාත්‍රී පෑඩ් එකක් ප්‍රමාණවත්',
    ],
    body2: 'පෑඩ් හෝ ටැම්පන් එකක් හෝ දෙකක්, අමතර යට ඇඳුමක් සහ තෙත් ටිෂූ කිහිපයක් සහිත කුඩා කට්ටලයක් පාසල් හෝ ක්‍රීඩා බෑගයකට පහසුවෙන් ගැළපේ. කුමක් සිදු වුවද ඔබට සුවපහසුවක් දැනීමට එය උපකාරී වේ.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'සැමවිටම ඔබ සමඟ පෑඩ් එකක් හෝ ටැම්පන් එකක් තබාගැනීම අනපේක්ෂිතව අසුවීමේ ආතතිය වළක්වයි.',
    body3: 'මෙය බොහෝ විට, විශේෂයෙන් මුලදී, සිදුවේ. පාසල් හෙදියකට, ගුරුවරියකට, හෝ මිතුරියකට සෑම විටම පාහේ උපකාරී විය හැකි දෙයක් ඇත. ඔබ පෑඩ් එකක් හෝ ටැම්පන් එකක් සොයාගන්නා අතරතුර ඇඳුමක් ඔබේ ඉණ වටා බැඳීමද ක්‍රියා කළ හැක.',
    relatedTitle: '♥  ඔබට මෙයද වුවමනා විය හැක',
    related: [
      {
        title: 'මගේ පළමු ඔසප් සඳහා කුමන පෑඩ් හෝ ටැම්පන් තෝරා ගත යුතුද?',
        meta: 'මිනි. 6  ·  මාර්ගෝපදේශය',
      },
      {
        title: 'ඔසප් වේදනාව කළමනාකරණය කිරීම',
        meta: 'මිනි. 7  ·  මාර්ගෝපදේශය',
      },
      {
        title: 'මගේ පළමු ඔසප් අක්‍රමවත්: එය සාමාන්‍යද?',
        meta: 'මිනි. 5  ·  මාර්ගෝපදේශය',
      },
    ],
    shareMessage: 'ඔබේ පළමු ඔසප් දිනපතා කළමනාකරණය කරන්නේ කෙසේද? — AWA',
  },
  th: {
    badge: 'ประจำเดือนครั้งแรก',
    title: 'วิธีจัดการประจำเดือน\nครั้งแรกในชีวิตประจำวัน',
    metaDuration: 'อ่าน 5 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ด้วยนิสัยเล็ก ๆ ไม่กี่อย่าง ประจำเดือนครั้งแรกของคุณก็เข้ากับชีวิตประจำวันได้ง่าย ทั้งที่โรงเรียนและที่อื่น',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'จัดการในแต่ละวัน',
      'เตรียมชุดฉุกเฉินเล็ก ๆ',
      'หากประจำเดือนมาโดยไม่คาดคิด',
    ],
    body1: 'โรงเรียน กีฬา การนอน: ประจำเดือนไม่ได้หยุดคุณจากกิจกรรมตามปกติ เพียงแค่ปรับนิสัยบางอย่างเพื่อให้สบายตลอดวัน',
    dailyTips: [
      'โรงเรียนหรือกิจกรรม: เก็บผ้าอนามัยแบบแผ่นหรือแบบสอดไว้ในกระเป๋า',
      'กีฬา: คุณยังเล่นกีฬาได้ เพียงปรับจังหวะ',
      'การนอน: ผ้าอนามัยแบบแผ่นสำหรับกลางคืนที่เหมาะสมก็เพียงพอ',
    ],
    body2: 'ชุดเล็ก ๆ ที่มีผ้าอนามัยแบบแผ่นหรือแบบสอดหนึ่งถึงสองชิ้น กางเกงในสำรอง และทิชชู่เปียกบางส่วน ใส่ในกระเป๋านักเรียนหรือกระเป๋ากีฬาได้ง่าย ช่วยให้คุณรู้สึกสบายใจไม่ว่าจะเกิดอะไรขึ้น',
    tip1Title: 'ควรรู้',
    tip1Text: 'การพกผ้าอนามัยแบบแผ่นหรือแบบสอดติดตัวเสมอช่วยหลีกเลี่ยงความเครียดจากการตั้งตัวไม่ทัน',
    body3: 'เหตุการณ์นี้เกิดขึ้นบ่อย โดยเฉพาะในช่วงแรก พยาบาลโรงเรียน ครู หรือเพื่อนเกือบทุกครั้งมีสิ่งที่ช่วยได้ การผูกเสื้อผ้าไว้รอบเอวก็ใช้ได้ระหว่างที่คุณหาผ้าอนามัยแบบแผ่นหรือแบบสอด',
    relatedTitle: '♥  คุณอาจสนใจ',
    related: [
      {
        title: 'ฉันควรเลือกผ้าอนามัยแบบแผ่นหรือแบบสอดแบบไหนสำหรับประจำเดือนครั้งแรก?',
        meta: '6 นาที  ·  คู่มือ',
      },
      {
        title: 'การจัดการอาการปวดประจำเดือน',
        meta: '7 นาที  ·  คู่มือ',
      },
      {
        title: 'ประจำเดือนช่วงแรกของฉันไม่สม่ำเสมอ ปกติไหม?',
        meta: '5 นาที  ·  คู่มือ',
      },
    ],
    shareMessage: 'วิธีจัดการประจำเดือนครั้งแรกในชีวิตประจำวัน — AWA',
  },
  vi: {
    badge: 'KỲ KINH ĐẦU TIÊN',
    title: 'Cách xử lý kỳ kinh đầu tiên\nmỗi ngày?',
    metaDuration: '5 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Chỉ với vài thói quen nhỏ, kỳ kinh đầu tiên sẽ dễ dàng hòa vào cuộc sống hằng ngày của bạn, ở trường học và ngoài đó.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Sắp xếp mỗi ngày',
      'Chuẩn bị một bộ dụng cụ khẩn cấp nhỏ',
      'Nếu kỳ kinh đến bất ngờ',
    ],
    body1: 'Trường học, thể thao, giấc ngủ: kỳ kinh không ngăn bạn tiếp tục các hoạt động thường ngày. Bạn chỉ cần điều chỉnh một vài thói quen để luôn thoải mái suốt cả ngày.',
    dailyTips: [
      'Trường học hoặc các hoạt động: để một miếng băng vệ sinh hoặc tampon trong cặp',
      'Thể thao: bạn vẫn có thể chơi thể thao, chỉ cần điều chỉnh nhịp độ',
      'Giấc ngủ: một miếng băng vệ sinh ban đêm phù hợp là đủ',
    ],
    body2: 'Một bộ dụng cụ nhỏ gồm một hai miếng băng vệ sinh hoặc tampon, một chiếc quần lót dự phòng và vài tờ khăn ướt có thể dễ dàng nằm gọn trong cặp đi học hoặc túi thể thao. Nó giúp bạn cảm thấy yên tâm dù có chuyện gì xảy ra.',
    tip1Title: 'Nên biết',
    tip1Text: 'Luôn mang theo một miếng băng vệ sinh hoặc tampon giúp tránh nỗi lo bị bất ngờ.',
    body3: 'Điều này thường xảy ra, đặc biệt lúc ban đầu. Y tá trường, một giáo viên hoặc một người bạn gần như luôn có thứ gì đó có thể giúp. Buộc một chiếc áo quanh eo cũng có thể hữu ích trong lúc bạn tìm băng vệ sinh hoặc tampon.',
    relatedTitle: '♥  Có thể bạn cũng thích',
    related: [
      {
        title: 'Nên chọn băng vệ sinh hay tampon nào cho kỳ kinh đầu tiên?',
        meta: '6 phút  ·  Hướng dẫn',
      },
      {
        title: 'Xử lý cơn đau trong kỳ kinh',
        meta: '7 phút  ·  Hướng dẫn',
      },
      {
        title: 'Những kỳ kinh đầu của tôi không đều: có bình thường không?',
        meta: '5 phút  ·  Hướng dẫn',
      },
    ],
    shareMessage: 'Cách xử lý kỳ kinh đầu tiên mỗi ngày? — AWA',
  },
  uz: {
    badge: 'BIRINCHI HAYZ',
    title: 'Birinchi hayzni kundalik hayotda\nqanday boshqarish kerak?',
    metaDuration: '5 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Bir nechta kichik odat bilan birinchi hayzingiz maktabda ham, undan tashqarida ham kundalik hayotingizga oson singib ketadi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Kundalik hayotni tashkil qilish',
      'Kichik favqulodda toʻplam tayyorlash',
      'Hayz kutilmaganda boshlansa',
    ],
    body1: 'Maktab, sport, uyqu: hayz odatiy mashgʻulotlaringizni davom ettirishga xalaqit bermaydi. Kun davomida oʻzingizni qulay his qilish uchun faqat bir nechta odatni moslashtirish kerak.',
    dailyTips: [
      'Maktab yoki mashgʻulotlar: sumkangizda prokladka yoki tampon olib yuring',
      'Sport: sport bilan shugʻullanishda davom etishingiz mumkin, faqat surʼatni moslang',
      'Uyqu: tungi uchun mos prokladka yetarli',
    ],
    body2: 'Bir-ikkita prokladka yoki tampon, ehtiyot ichki kiyim va salfetkalardan iborat kichik toʻplam maktab yoki sport sumkasiga oson sigʻadi. U har qanday holatda ham oʻzingizni xotirjam his qilishga yordam beradi.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Yoningizda doim prokladka yoki tampon boʻlishi tayyorsiz qolish stressidan qutqaradi.',
    body3: 'Bu koʻp uchraydi, ayniqsa dastlab. Maktab hamshirasi, oʻqituvchi yoki doʻstingizda deyarli har doim yordam beradigan narsa topiladi. Prokladka yoki tampon topguningizcha belingizga kiyim bogʻlab olish ham yordam berishi mumkin.',
    relatedTitle: '♥  Sizga yoqishi mumkin',
    related: [
      {
        title: 'Birinchi hayzim uchun qaysi prokladka yoki tamponni tanlashim kerak?',
        meta: '6 daq  ·  Qoʻllanma',
      },
      {
        title: 'Hayz ogʻriqlarini boshqarish',
        meta: '7 daq  ·  Qoʻllanma',
      },
      {
        title: 'Birinchi hayzlarim notekis: bu normalmi?',
        meta: '5 daq  ·  Qoʻllanma',
      },
    ],
    shareMessage: 'Birinchi hayzni kundalik hayotda qanday boshqarish kerak? — AWA',
  },
  az: {
    badge: 'İLK AYBAŞI',
    title: 'İlk aybaşınızı gündəlik\nhəyatda necə idarə etmək olar?',
    metaDuration: '5 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Bir neçə kiçik vərdişlə ilk aybaşınız məktəbdə və məktəbdən kənarda gündəlik həyatınıza asanlıqla uyğunlaşır.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Gündəlik həyatda təşkil olunmaq',
      'Kiçik təcili çanta hazırlamaq',
      'Aybaşı gözlənilmədən başlayarsa',
    ],
    body1: 'Məktəb, idman, yuxu: aybaşı adi fəaliyyətlərinizi davam etdirməyinizə mane olmur. Sadəcə gün ərzində rahat qalmaq üçün bir neçə vərdişi tənzimləmək lazımdır.',
    dailyTips: [
      'Məktəb və ya fəaliyyətlər: çantanızda gigiyenik bez və ya tampon saxlayın',
      'İdman: idmanla məşğul ola bilərsiniz, sadəcə templi tənzimləyin',
      'Yuxu: gecə üçün uyğun gigiyenik bez kifayətdir',
    ],
    body2: 'Bir-iki gigiyenik bez və ya tampon, ehtiyat alt paltarı və bir neçə nəm salfetdən ibarət kiçik dəst məktəb və ya idman çantasına asanlıqla sığır. O, hər şeydən asılı olmayaraq özünüzü rahat hiss etməyə kömək edir.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Yanınızda həmişə gigiyenik bez və ya tampon saxlamaq hazırlıqsız yaxalanmaq stresindən qoruyur.',
    body3: 'Bu, xüsusilə əvvəlcə tez-tez baş verir. Məktəb tibb bacısında, müəllimdə və ya dostda demək olar ki, həmişə kömək edəcək bir şey tapılır. Gigiyenik bez və ya tampon tapana qədər belinizə bir geyim bağlamaq da kömək edə bilər.',
    relatedTitle: '♥  Bunlar da xoşunuza gələ bilər',
    related: [
      {
        title: 'İlk aybaşım üçün hansı gigiyenik bezi və ya tamponu seçməliyəm?',
        meta: '6 dəq  ·  Bələdçi',
      },
      {
        title: 'Aybaşı ağrılarını idarə etmək',
        meta: '7 dəq  ·  Bələdçi',
      },
      {
        title: 'İlk aybaşılarım qeyri-müntəzəmdir: bu normaldır?',
        meta: '5 dəq  ·  Bələdçi',
      },
    ],
    shareMessage: 'İlk aybaşınızı gündəlik həyatda necə idarə etmək olar? — AWA',
  },
  ka: {
    badge: 'პირველი მენსტრუაცია',
    title: 'როგორ გავუმკლავდეთ პირველ\nმენსტრუაციას ყოველდღიურად?',
    metaDuration: '5 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'რამდენიმე პატარა ჩვევით თქვენი პირველი მენსტრუაცია ადვილად ჯდება ყოველდღიურ ცხოვრებაში, სკოლაში და მის გარეთაც.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'ყოველდღიური ორგანიზება',
      'პატარა გადაუდებელი ნაკრების აწყობა',
      'თუ მენსტრუაცია მოულოდნელად მოვიდა',
    ],
    body1: 'სკოლა, სპორტი, ძილი: მენსტრუაცია არ გიშლით ხელს ჩვეულებრივი საქმიანობის გაგრძელებაში. უბრალოდ რამდენიმე ჩვევის მორგებაა საჭირო, რომ მთელი დღე კომფორტულად იყოთ.',
    dailyTips: [
      'სკოლა ან აქტივობები: ჩანთაში საფენი ან ტამპონი გქონდეთ',
      'სპორტი: შეგიძლიათ კვლავ დაკავდეთ სპორტით, უბრალოდ ტემპი მოარგეთ',
      'ძილი: შესაფერისი ღამის საფენი საკმარისია',
    ],
    body2: 'პატარა ნაკრები ერთი ან ორი საფენით ან ტამპონით, სათადარიგო საცვლით და რამდენიმე სველი ხელსახოცით ადვილად ეტევა სკოლის ან სპორტულ ჩანთაში. ის გეხმარებათ, რაც არ უნდა მოხდეს, თავი კარგად იგრძნოთ.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'საფენის ან ტამპონის ყოველთვის თან ქონა გაუთვალისწინებელი სიტუაციის სტრესს გარიდებთ.',
    body3: 'ეს ხშირად ხდება, განსაკუთრებით თავიდან. სკოლის ექთანს, მასწავლებელს ან მეგობარს თითქმის ყოველთვის აქვს რაიმე, რაც დაგეხმარებათ. წელზე ტანსაცმლის გადაკრვაც გამოდგება, სანამ საფენს ან ტამპონს იპოვით.',
    relatedTitle: '♥  შეიძლება მოგეწონოთ',
    related: [
      {
        title: 'რომელი საფენი ან ტამპონი ავირჩიო პირველი მენსტრუაციისთვის?',
        meta: '6 წთ  ·  გზამკვლევი',
      },
      {
        title: 'მენსტრუაციული ტკივილის მართვა',
        meta: '7 წთ  ·  გზამკვლევი',
      },
      {
        title: 'ჩემი პირველი მენსტრუაციები არარეგულარულია: ეს ნორმალურია?',
        meta: '5 წთ  ·  გზამკვლევი',
      },
    ],
    shareMessage: 'როგორ გავუმკლავდეთ პირველ მენსტრუაციას ყოველდღიურად? — AWA',
  },
  hy: {
    badge: 'ԱՌԱՋԻՆ ԴԱՇՏԱՆ',
    title: 'Ինչպե՞ս հոգալ առաջին\nդաշտանը օրեցօր:',
    metaDuration: '5 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Մի քանի փոքր սովորությամբ ձեր առաջին դաշտանը հեշտությամբ տեղավորվում է ձեր առօրյայում՝ դպրոցում և դրանից դուրս:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Կազմակերպվել օրեցօր',
      'Փոքր շտապ պայուսակ պատրաստել',
      'Եթե դաշտանը սկսվի անսպասելիորեն',
    ],
    body1: 'Դպրոց, սպորտ, քուն. ձեր դաշտանը չի խանգարում շարունակել սովորական գործունեությունը: Պարզապես պետք է մի քանի սովորություն հարմարեցնել՝ օրվա ընթացքում հարմար մնալու համար:',
    dailyTips: [
      'Դպրոց կամ պարապմունքներ. պայուսակում պահեք միջադիր կամ տամպոն',
      'Սպորտ. կարող եք շարունակել սպորտով զբաղվել, պարզապես հարմարեցրեք ձեր տեմպը',
      'Քուն. բավական է գիշերվա համար հարմար միջադիրը',
    ],
    body2: 'Մեկ-երկու միջադիրով կամ տամպոնով, պահեստային ներքնազգեստով և մի քանի անձեռոցիկով փոքր պայուսակը հեշտությամբ տեղավորվում է դպրոցական կամ մարզական պայուսակում: Այն օգնում է հանգիստ զգալ, ինչ էլ որ պատահի:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Միշտ միջադիր կամ տամպոն ձեզ հետ պահելը խուսափեցնում է անսպասելիության սթրեսից:',
    body3: 'Սա հաճախ է պատահում, հատկապես սկզբում: Դպրոցի բուժքույրը, ուսուցիչը կամ ընկերուհին գրեթե միշտ ունի ինչ-որ օգնող բան: Հագուստի մի կտոր գոտկատեղին կապելը նույնպես կարող է աշխատել, մինչ դուք միջադիր կամ տամպոն եք գտնում:',
    relatedTitle: '♥  Ձեզ կարող է նաև հետաքրքրել',
    related: [
      {
        title: 'Ո՞ր միջադիրը կամ տամպոնն ընտրել առաջին դաշտանիս համար',
        meta: '6 ր  ·  Ուղեցույց',
      },
      {
        title: 'Դաշտանային ցավի կառավարում',
        meta: '7 ր  ·  Ուղեցույց',
      },
      {
        title: 'Իմ առաջին դաշտանները անկանոն են. սա նորմա՞լ է',
        meta: '5 ր  ·  Ուղեցույց',
      },
    ],
    shareMessage: 'Ինչպե՞ս հոգալ առաջին դաշտանը օրեցօր: — AWA',
  },
  tg: {
    badge: 'ҲАЙЗИ АВВАЛ',
    title: 'Чӣ тавр ҳайзи аввалро\nдар ҳаёти ҳаррӯза идора кард?',
    metaDuration: '5 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Бо чанд одати хурд ҳайзи аввали шумо ба осонӣ ба ҳаёти ҳаррӯзаатон, дар мактаб ва берун аз он ҷойгир мешавад.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Ташкили ҳаёти ҳаррӯза',
      'Омода кардани ҷомадони хурди ҳолати фавқулода',
      'Агар ҳайз ногаҳон оғоз шавад',
    ],
    body1: 'Мактаб, варзиш, хоб: ҳайз шуморо аз идомаи фаъолияти одатӣ бознамедорад. Танҳо бояд чанд одатро мутобиқ кунед, то дар давоми рӯз роҳат бимонед.',
    dailyTips: [
      'Мактаб ё машғулият: пайванд ё тампонро дар борхалтаатон нигоҳ доред',
      'Варзиш: метавонед ба варзиш машғул шавед, танҳо суръатро танзим кунед',
      'Хоб: пайванди мувофиқи шабона кифоя аст',
    ],
    body2: 'Ҷомадони хурд бо як-ду пайванд ё тампон, як ҷуфт либоси таги эҳтиётӣ ва чанд дастмоли тар ба осонӣ дар борхалтаи мактабӣ ё варзишӣ ҷой мегирад. Он ба шумо кумак мекунад, ки новобаста аз ҳар чизе, худро роҳат ҳис кунед.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Ҳамеша бо худ доштани пайванд ё тампон аз стресси ногаҳонӣ пешгирӣ мекунад.',
    body3: 'Ин зуд-зуд рух медиҳад, хусусан дар аввал. Ҳамшираи мактаб, муаллим ё дугона қариб ҳамеша чизе дорад, ки метавонад кумак кунад. Бастани пораи либос ба камар низ метавонад кор кунад, то пайванд ё тампон пайдо кунед.',
    relatedTitle: '♥  Шояд ба шумо ҳам маъқул шавад',
    related: [
      {
        title: 'Барои ҳайзи аввалам кадом пайванд ё тампонро интихоб кунам?',
        meta: '6 дақ  ·  Роҳнамо',
      },
      {
        title: 'Идораи дарди ҳайз',
        meta: '7 дақ  ·  Роҳнамо',
      },
      {
        title: 'Ҳайзҳои аввали ман номунтазаманд: оё ин муқаррарӣ аст?',
        meta: '5 дақ  ·  Роҳнамо',
      },
    ],
    shareMessage: 'Чӣ тавр ҳайзи аввалро дар ҳаёти ҳаррӯза идора кард? — AWA',
  },
  ky: {
    badge: 'БИРИНЧИ ЕТЕК КИРИМ',
    title: 'Биринчи етек киримди күнүмдүк\nжашоодо кантип башкаруу?',
    metaDuration: '5 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Бир нече кичинекей адат менен биринчи етек кирим күнүмдүк жашооңузга, мектепте жана андан тышкары, оңой сыят.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Күнүмдүк жашоодо уюштуруу',
      'Шашылыш кичинекей топтом даярдоо',
      'Етек кирим күтүлбөгөн жерден келсе',
    ],
    body1: 'Мектеп, спорт, уйку: етек кирим адаттагы иштериңизди улантууга тоскоол болбойт. Күн бою ыңгайлуу болуу үчүн бир нече адатты гана тууралоо керек.',
    dailyTips: [
      'Мектеп же иш-чаралар: баштыкчаңызда прокладка же тампон сактаңыз',
      'Спорт: спорт менен машыга бересиз, жөн гана темпиңизди тууралаңыз',
      'Уйку: ылайыктуу түнкү прокладка жетиштүү',
    ],
    body2: 'Бир-эки прокладка же тампон, запастагы ич кийим жана бир нече салфеткадан турган кичинекей топтом мектеп же спорт баштыкчасына оңой сыят. Эмне болбосун, өзүңүздү эркин сезүүгө жардам берет.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Жаныңызда ар дайым прокладка же тампон болушу күтүлбөгөн жерден калуунун стрессинен сактайт.',
    body3: 'Бул көп болот, айрыкча башында. Мектептин медайымы, мугалим же дос дээрлик ар дайым жардам бере турган нерсеси болот. Прокладка же тампон тапканга чейин белге кийим байлап алуу да жардам бере алат.',
    relatedTitle: '♥  Сизге дагы жагышы мүмкүн',
    related: [
      {
        title: 'Биринчи етек кирим үчүн кайсы прокладканы же тампонду тандоо керек?',
        meta: '6 мүн  ·  Колдонмо',
      },
      {
        title: 'Етек кирим оорусун башкаруу',
        meta: '7 мүн  ·  Колдонмо',
      },
      {
        title: 'Биринчи етек киримдерим туура эмес: бул кадимкиби?',
        meta: '5 мүн  ·  Колдонмо',
      },
    ],
    shareMessage: 'Биринчи етек киримди күнүмдүк жашоодо кантип башкаруу? — AWA',
  },
  tk: {
    badge: 'ILKINJI AÝBAŞY',
    title: 'Ilkinji aýbaşyňyzy gündelik\ndurmuşda nähili dolandyrmaly?',
    metaDuration: '5 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Birnäçe kiçijik endik bilen ilkinji aýbaşyňyz mekdepde we ondan daşda gündelik durmuşyňyza aňsat goşulýar.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Gündelik durmuşda guramaçylyk',
      'Kiçijik gyssagly toplum düzmek',
      'Aýbaşyňyz garaşylmadyk wagtda gelse',
    ],
    body1: 'Mekdep, sport, uky: aýbaşy adaty işjeňligiňizi dowam etdirmegiňize päsgel bermeýär. Gün dowamynda rahat bolmak üçin diňe birnäçe endigi sazlamaly.',
    dailyTips: [
      'Mekdep ýa-da işjeňlikler: sumkaňyzda prokladka ýa-da tampon saklaň',
      'Sport: sport bilen meşgullanyp bilersiňiz, diňe ritmiňizi sazlaň',
      'Uky: laýyk gijeki prokladka ýeterlik',
    ],
    body2: 'Bir-iki prokladka ýa-da tampon, artykmaç içki eşik we birnäçe salfetka bilen kiçijik toplum mekdep ýa-da sport sumkasyna aňsat sygýar. Ol näme bolsa-da özüňizi rahat duýmaga kömek edýär.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Hemişe ýanyňyzda prokladka ýa-da tampon saklamak garaşylmadyk ýagdaýa düşmegiň stresinden gaça durýar.',
    body3: 'Bu köplenç bolýar, aýratyn-da başda. Mekdep şepagat uýasynda, mugallymda ýa-da dostuňyzda hemişe diýen ýaly kömek edip biljek zat bolýar. Prokladka ýa-da tampon tapýança bir eşigi biliňize daňmak hem kömek edip biler.',
    relatedTitle: '♥  Size ýarap biler',
    related: [
      {
        title: 'Ilkinji aýbaşym üçin haýsy prokladkany ýa-da tamponyny saýlamaly?',
        meta: '6 min  ·  Gollanma',
      },
      {
        title: 'Aýbaşy agyrysyny dolandyrmak',
        meta: '7 min  ·  Gollanma',
      },
      {
        title: 'Ilkinji aýbaşylarym düzgünsiz: bu adatymy?',
        meta: '5 min  ·  Gollanma',
      },
    ],
    shareMessage: 'Ilkinji aýbaşyňyzy gündelik durmuşda nähili dolandyrmaly? — AWA',
  },
  ms: {
    badge: 'HAID PERTAMA',
    title: 'Bagaimana menguruskan haid\npertama anda sehari-hari?',
    metaDuration: '5 min bacaan',
    metaType: 'Panduan',
    metaLevel: 'Permulaan',
    metaValidated: 'Kandungan disemak',
    intro: 'Dengan beberapa tabiat kecil, haid pertama anda dapat disesuaikan dengan mudah dalam kehidupan seharian anda, di sekolah dan di tempat lain.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Menyusun diri dari hari ke hari',
      'Menyediakan kit kecemasan yang kecil',
      'Jika haid anda tiba secara tiba-tiba',
    ],
    body1: 'Sekolah, sukan, tidur: haid anda tidak menghalang anda daripada meneruskan aktiviti biasa. Anda hanya perlu melaraskan beberapa tabiat untuk kekal selesa sepanjang hari.',
    dailyTips: [
      'Sekolah atau aktiviti: simpan tuala wanita atau tampon dalam beg anda',
      'Sukan: anda masih boleh bersukan, cuma laraskan rentak anda',
      'Tidur: tuala wanita khas waktu malam sudah memadai',
    ],
    body2: 'Kit kecil dengan satu atau dua tuala wanita atau tampon, sehelai seluar dalam ganti dan beberapa tisu basah boleh dimuatkan dengan mudah dalam beg sekolah atau sukan. Ia membantu anda berasa tenang apa pun yang berlaku.',
    tip1Title: 'Elok diketahui',
    tip1Text: 'Sentiasa membawa tuala wanita atau tampon mengelakkan tekanan apabila tiba-tiba terkejut.',
    body3: 'Ini kerap berlaku, terutamanya pada mulanya. Jururawat sekolah, guru atau rakan hampir selalu mempunyai sesuatu yang boleh membantu. Mengikat sehelai pakaian di pinggang juga boleh berkesan sementara anda mencari tuala wanita atau tampon.',
    relatedTitle: '♥  Anda mungkin juga suka',
    related: [
      {
        title: 'Tuala wanita atau tampon manakah yang patut saya pilih untuk haid pertama?',
        meta: '6 min  ·  Panduan',
      },
      {
        title: 'Menguruskan sakit haid',
        meta: '7 min  ·  Panduan',
      },
      {
        title: 'Haid pertama saya tidak teratur: adakah itu normal?',
        meta: '5 min  ·  Panduan',
      },
    ],
    shareMessage: 'Bagaimana menguruskan haid pertama anda sehari-hari? — AWA',
  },
  so: {
    badge: 'CAADADA UGU HORREYSA',
    title: 'Sidee loo maamulaa caadadaada\nugu horreysa maalin kasta?',
    metaDuration: '5 daq akhris',
    metaType: 'Hage',
    metaLevel: 'Bilow',
    metaValidated: 'Macluumaad la dib-u-eegay',
    intro: 'Dhowr caado yaryar awgood, caadadaada ugu horreysa si fudud ayay ugu habboonaataa nolol-maalmeedkaaga, dugsiga iyo meelo kaleba.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Is-habaynta maalin kasta',
      'Diyaarinta bacaad yar oo degdeg ah',
      'Haddii caadadaadu lama filaan timaaddo',
    ],
    body1: 'Dugsi, ciyaar, hurdo: caadadaadu kuma joojinayso inaad sii wadato hawlahaaga caadiga ah. Waxaad u baahan tahay oo keliya inaad hagaajiso dhowr caado si aad maalinta oo dhan raaxo ugu jirto.',
    dailyTips: [
      'Dugsi ama hawlo: tuwaal ama tampoon ku hay boorsadaada',
      'Ciyaar: weli waad ciyaari kartaa, kaliya hagaaji xawaarahaaga',
      'Hurdo: tuwaal habeen ku habboon ayaa ku filan',
    ],
    body2: 'Bacaad yar oo ka kooban hal ama laba tuwaal ama tampoon, dhar hoose oo dheeraad ah, iyo xoogaa maro qoyan ayaa si fudud ugu soo geli kara boorsada dugsiga ama ciyaarta. Wuxuu kaa caawinayaa inaad raaxo dareento wax kasta oo dhacaya.',
    tip1Title: 'Waxtar leh in la ogaado',
    tip1Text: 'Mar walba haysashada tuwaal ama tampoon waxay ka fogaysaa walaaca ah in lagu qabto si lama filaan ah.',
    body3: 'Tani inta badan way dhacdaa, gaar ahaan bilowga. Kalkaaliso dugsiga, macallin, ama saaxiib inta badan wuxuu hayaa wax kaa caawin kara. Xidhidhka dharka dhexdaada ayaa sidoo kale shaqayn kara intaad raadinayso tuwaal ama tampoon.',
    relatedTitle: '♥  Waxaad sidoo kale jeclaan kartaa',
    related: [
      {
        title: 'Waa kuwee ilaalin ah ee aan dooran lahaa caadadayda ugu horreysa?',
        meta: '6 daq  ·  Hage',
      },
      {
        title: 'Maamulka xanuunka caadada',
        meta: '7 daq  ·  Hage',
      },
      {
        title: 'Caadooyinkayga ugu horreeya waa aan joogto ahayn: ma caadi baa?',
        meta: '5 daq  ·  Hage',
      },
    ],
    shareMessage: 'Sidee loo maamulaa caadadaada ugu horreysa maalin kasta? — AWA',
  },
  sw: {
    badge: 'HEDHI YA KWANZA',
    title: 'Jinsi ya kusimamia hedhi\nyako ya kwanza kila siku?',
    metaDuration: 'Dakika 5 za kusoma',
    metaType: 'Mwongozo',
    metaLevel: 'Mwanzo',
    metaValidated: 'Maudhui yaliyokaguliwa',
    intro: 'Kwa tabia ndogo chache, hedhi yako ya kwanza inaingia kwa urahisi katika maisha yako ya kila siku, shuleni na kwingineko.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Kujipanga kila siku',
      'Kuandaa kifurushi kidogo cha dharura',
      'Hedhi yako ikifika bila kutarajia',
    ],
    body1: 'Shule, michezo, usingizi: hedhi yako haikuzuii kuendelea na shughuli zako za kawaida. Unahitaji tu kurekebisha tabia chache ili ubaki na faraja siku nzima.',
    dailyTips: [
      'Shule au shughuli: weka pedi au tamponi kwenye begi lako',
      'Michezo: bado unaweza kucheza michezo, rekebisha tu mwendo wako',
      'Usingizi: pedi ya usiku inayofaa inatosha',
    ],
    body2: 'Kifurushi kidogo chenye pedi au tamponi moja au mbili, chupi ya akiba, na tishu chache kinaweza kuingia kwa urahisi kwenye begi la shule au la michezo. Kinakusaidia kujisikia huru kila kitakachotokea.',
    tip1Title: 'Vyema kujua',
    tip1Text: 'Kubeba pedi au tamponi nawe daima kunaepusha msongo wa kushtukizwa.',
    body3: 'Hili hutokea mara nyingi, hasa mwanzoni. Muuguzi wa shule, mwalimu, au rafiki karibu kila mara ana kitu kinachoweza kusaidia. Kufunga nguo kiunoni pia kunaweza kufaa wakati unatafuta pedi au tamponi.',
    relatedTitle: '♥  Huenda pia ukapenda',
    related: [
      {
        title: 'Nichague pedi au tamponi gani kwa hedhi yangu ya kwanza?',
        meta: 'Dakika 6  ·  Mwongozo',
      },
      {
        title: 'Kudhibiti maumivu ya hedhi',
        meta: 'Dakika 7  ·  Mwongozo',
      },
      {
        title: 'Hedhi zangu za kwanza si za mpangilio: je, ni kawaida?',
        meta: 'Dakika 5  ·  Mwongozo',
      },
    ],
    shareMessage: 'Jinsi ya kusimamia hedhi yako ya kwanza kila siku? — AWA',
  },
  kk: {
    badge: 'АЛҒАШҚЫ ЕТЕККІР',
    title: 'Алғашқы етеккірді күнделікті\nқалай басқаруға болады?',
    metaDuration: '5 мин оқу',
    metaType: 'Нұсқаулық',
    metaLevel: 'Бастауыш',
    metaValidated: 'Тексерілген мазмұн',
    intro: 'Бірнеше шағын әдетпен алғашқы етеккіріңіз күнделікті өміріңізге, мектепте және одан тыс жерде оңай сіңеді.',
    contentsTitle: 'Осы мақалада',
    topics: [
      'Күнделікті ұйымдастыру',
      'Шағын шұғыл жиынтық жинау',
      'Етеккіріңіз күтпеген жерден келсе',
    ],
    body1: 'Мектеп, спорт, ұйқы: етеккіріңіз әдеттегі әрекеттеріңізді жалғастыруға кедергі болмайды. Күні бойы жайлы болу үшін бірнеше әдетті ғана реттеу керек.',
    dailyTips: [
      'Мектеп немесе іс-шаралар: сөмкеңізде прокладка немесе тампон болсын',
      'Спорт: спортпен айналыса беруге болады, тек қарқынды реттеңіз',
      'Ұйқы: тиісті түнгі прокладка жеткілікті',
    ],
    body2: 'Бір-екі прокладка немесе тампоны, қосалқы іш киімі және бірнеше майлығы бар шағын жиынтық мектеп немесе спорт сөмкесіне оңай сыяды. Ол не болса да өзіңізді еркін сезінуге көмектеседі.',
    tip1Title: 'Білуге тиісті',
    tip1Text: 'Прокладка немесе тампонды әрқашан жаныңызда алып жүру күтпеген жерден қалып қоюдың күйзелісінен сақтайды.',
    body3: 'Бұл жиі болады, әсіресе алғашында. Мектеп медбикесінде, мұғалімде немесе достың қолында көбіне көмектесе алатын нәрсе болады. Прокладка немесе тампон тапқанша, белге киім байлау да көмектесуі мүмкін.',
    relatedTitle: '♥  Сізге де ұнауы мүмкін',
    related: [
      {
        title: 'Алғашқы етеккірім үшін қандай прокладка немесе тампон таңдауым керек?',
        meta: '6 мин  ·  Нұсқаулық',
      },
      {
        title: 'Етеккір ауыруын басқару',
        meta: '7 мин  ·  Нұсқаулық',
      },
      {
        title: 'Алғашқы етеккірлерім тұрақсыз: бұл қалыпты ма?',
        meta: '5 мин  ·  Нұсқаулық',
      },
    ],
    shareMessage: 'Алғашқы етеккірді күнделікті қалай басқаруға болады? — AWA',
  },
  wo: {
    badge: 'RÈGLE BU NJËKK',
    title: 'Naka laay yor sama\nrègle bu njëkk bés ak bés?',
    metaDuration: '5 simili jàng',
    metaType: 'Ndigal',
    metaLevel: 'Tàmbali',
    metaValidated: 'Mbind bu ñu seetlu',
    intro: 'Ak ay yoon yu ndaw, sa règle bu njëkk dafay dugg ci yomb ci sa dund bu bés, ci daara ak ci yeneen bérëb.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Tëral sa bés',
      'Defar benn saakoo bu ndaw ngir gaaw',
      'Bu sa règle dikkee ci lu ñu xaarul',
    ],
    body1: 'Daara, sport, nelaw: sa règle du tee nga kontine sa jëf yu cosaan. Soxla rekk nga soppi yenn yoon ngir nekk ci neex bés bi gépp.',
    dailyTips: [
      'Daara walla jëf: denc benn pad walla tampoŋ ci sa saakoo',
      'Sport: mën nga kontine sport, defar rekk sa ritm',
      'Nelaw: benn pad bu méngoo ak guddi doy na',
    ],
    body2: 'Benn saakoo bu ndaw ak benn walla ñaari pad walla tampoŋ, benn mbubb bu dem, ak ay mouchoir mën na dugg ci saakoo daara walla sport. Dafay dimbli nga nekk ci jàmm lu mu mën a doon.',
    tip1Title: 'Lu baax a xam',
    tip1Text: 'Denc saa su ne benn pad walla tampoŋ ci sa wet dafay tee coono bu ñu la jàpp ci lu ñu xaarul.',
    body3: 'Loolu daa am, lool ci njëkk. Benn infirmier bu daara, benn jàngalekat walla benn xarit mën na am lu dimbli. Takk benn yéré ci sa ndiggu mën na dimbli itam ba nga gis benn pad walla tampoŋ.',
    relatedTitle: '♥  Mën nga bëgg itam',
    related: [
      {
        title: 'Ban pad walla tampoŋ laay tànn ngir sama règle bu njëkk?',
        meta: '6 simili  ·  Ndigal',
      },
      {
        title: 'Yor metitu règle',
        meta: '7 simili  ·  Ndigal',
      },
      {
        title: 'Samay règle yu njëkk jubuñu: daa jub?',
        meta: '5 simili  ·  Ndigal',
      },
    ],
    shareMessage: 'Naka laay yor sama règle bu njëkk bés ak bés? — AWA',
  },
  ha: {
    badge: 'HAILAR FARKO',
    title: 'Yadda za a gudanar da\nhailar farko kullum?',
    metaDuration: 'karatun minti 5',
    metaType: 'Jagora',
    metaLevel: 'Mafari',
    metaValidated: 'Abun da aka duba',
    intro: 'Da wasu ƙananan dabi’u, hailarki ta farko tana shiga rayuwarki ta yau da kullum cikin sauƙi, a makaranta da sauran wurare.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Tsara kanki kullum',
      'Shirya ƙaramar jaka ta gaggawa',
      'Idan hailarki ta zo ba zato ba tsammani',
    ],
    body1: 'Makaranta, wasanni, barci: hailarki ba ta hana ki ci gaba da ayyukanki na yau da kullum ba. Kawai kina bukatar daidaita wasu dabi’u don ki ji daɗi a duk ranar.',
    dailyTips: [
      'Makaranta ko ayyuka: ajiye audugar haila ko tampon a jakarki',
      'Wasanni: za ki iya ci gaba da wasanni, kawai daidaita saurinki',
      'Barci: audugar dare mai dacewa ta isa',
    ],
    body2: 'Ƙaramar jaka mai audugar haila ɗaya ko biyu ko tampon, rigar ciki ta ajiya, da wasu tissue masu danshi na iya shiga cikin jakar makaranta ko ta wasanni cikin sauƙi. Tana taimaka miki ki ji daɗi ko me zai faru.',
    tip1Title: 'Abin da ya dace a sani',
    tip1Text: 'Kullum ajiye audugar haila ko tampon tare da ke yana guje wa damuwar kamu ba zato ba.',
    body3: 'Wannan yana faruwa sau da yawa, musamman a farko. Ma’aikaciyar jinya ta makaranta, malama, ko aboki kusan koyaushe suna da abin da zai taimaka. Daure wani kayan sawa a kugu kuma na iya aiki yayin da kike neman audugar haila ko tampon.',
    relatedTitle: '♥  Kila ma za ki so',
    related: [
      {
        title: 'Wace audugar haila ko tampon zan zaɓa don hailata ta farko?',
        meta: 'minti 6  ·  Jagora',
      },
      {
        title: 'Magance ciwon haila',
        meta: 'minti 7  ·  Jagora',
      },
      {
        title: 'Hailata ta farko ba ta da tsari: al’ada ce?',
        meta: 'minti 5  ·  Jagora',
      },
    ],
    shareMessage: 'Yadda za a gudanar da hailar farko kullum? — AWA',
  },
  am: {
    badge: 'የመጀመሪያ የወር አበባ',
    title: 'የመጀመሪያ የወር አበባሽን\nበየቀኑ እንዴት መቆጣጠር?',
    metaDuration: '5 ደቂቃ ንባብ',
    metaType: 'መመሪያ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'የተረጋገጠ ይዘት',
    intro: 'በጥቂት ትናንሽ ልማዶች የመጀመሪያ የወር አበባሽ በትምህርት ቤትና በሌላም ቦታ ወደ ዕለት ሕይወትሽ በቀላሉ ይገባል።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'በየቀኑ መደራጀት',
      'ትንሽ የድንገተኛ ኪት ማዘጋጀት',
      'የወር አበባሽ ሳይታሰብ ቢመጣ',
    ],
    body1: 'ትምህርት ቤት፣ ስፖርት፣ እንቅልፍ፦ የወር አበባሽ የተለመዱ እንቅስቃሴዎችሽን ከመቀጠል አይከለክልሽም። በቀኑ ሁሉ ምቾት እንዲሰማሽ ጥቂት ልማዶችን ብቻ ማስተካከል ያስፈልግሻል።',
    dailyTips: [
      'ትምህርት ቤት ወይም እንቅስቃሴዎች፦ በቦርሳሽ ውስጥ ሞዴስ ወይም ታምፖን ያዢ',
      'ስፖርት፦ አሁንም ስፖርት መሥራት ትችያለሽ፣ ፍጥነትሽን ብቻ አስተካክዪ',
      'እንቅልፍ፦ ተስማሚ የሌሊት ሞዴስ በቂ ነው',
    ],
    body2: 'አንድ ወይም ሁለት ሞዴስ ወይም ታምፖን፣ ተጨማሪ የውስጥ ልብስ እና ጥቂት እርጥብ ሳሙና ወረቀቶች ያሉት ትንሽ ኪት በትምህርት ቤት ወይም በስፖርት ቦርሳ ውስጥ በቀላሉ ሊገባ ይችላል። ምንም ቢሆን ምቾት እንዲሰማሽ ይረዳል።',
    tip1Title: 'ማወቅ ጠቃሚ ነው',
    tip1Text: 'ሁልጊዜ ሞዴስ ወይም ታምፖን ከአንቺ ጋር መያዝ ሳይታሰብ የመያዝ ውጥረትን ያስቀራል።',
    body3: 'ይህ ብዙ ጊዜ ይከሰታል፣ በተለይ በመጀመሪያ። የትምህርት ቤት ነርስ፣ መምህር ወይም ጓደኛ ማለት ይቻላል ሁልጊዜ ሊረዳ የሚችል ነገር አላቸው። ሞዴስ ወይም ታምፖን እስክታገኚ ድረስ ልብስ በወገብሽ ላይ ማሰርም ሊሠራ ይችላል።',
    relatedTitle: '♥  ሊወዱትም ይችላሉ',
    related: [
      {
        title: 'ለመጀመሪያ የወር አበባዬ የትኛውን ሞዴስ ወይም ታምፖን ልምረጥ?',
        meta: '6 ደቂቃ  ·  መመሪያ',
      },
      {
        title: 'የወር አበባ ህመምን መቆጣጠር',
        meta: '7 ደቂቃ  ·  መመሪያ',
      },
      {
        title: 'የመጀመሪያ የወር አበባዎቼ ወጥ አይደሉም፦ የተለመደ ነው?',
        meta: '5 ደቂቃ  ·  መመሪያ',
      },
    ],
    shareMessage: 'የመጀመሪያ የወር አበባን በየቀኑ እንዴት መቆጣጠር? — AWA',
  },
  nl: {
    badge: 'EERSTE MENSTRUATIE',
    title: 'Hoe beheer je je eerste\nmenstruatie in het dagelijks leven?',
    metaDuration: '5 min lezen',
    metaType: 'Gids',
    metaLevel: 'Beginner',
    metaValidated: 'Gecontroleerde inhoud',
    intro: 'Met een paar kleine gewoonten past je eerste menstruatie gemakkelijk in je dagelijks leven, op school en daarbuiten.',
    contentsTitle: 'In dit artikel',
    topics: [
      'Je dagelijks organiseren',
      'Een klein noodpakketje samenstellen',
      'Als je menstruatie onverwacht komt',
    ],
    body1: 'School, sport, slaap: je menstruatie weerhoudt je er niet van je gebruikelijke activiteiten voort te zetten. Je hoeft alleen enkele gewoonten aan te passen om je de hele dag comfortabel te voelen.',
    dailyTips: [
      'School of activiteiten: houd een maandverbandje of tampon in je tas',
      'Sport: je kunt gewoon blijven sporten, pas alleen je tempo aan',
      'Slaap: een geschikt nachtverband is genoeg',
    ],
    body2: 'Een klein pakketje met een of twee maandverbandjes of tampons, een reserve-onderbroek en wat doekjes past gemakkelijk in een school- of sporttas. Het helpt je je op je gemak te voelen, wat er ook gebeurt.',
    tip1Title: 'Goed om te weten',
    tip1Text: 'Altijd een maandverbandje of tampon bij je hebben voorkomt de stress van overvallen worden.',
    body3: 'Dit gebeurt vaak, vooral in het begin. Een schoolverpleegkundige, een leraar of een vriendin heeft bijna altijd iets dat kan helpen. Een kledingstuk om je middel knopen kan ook werken terwijl je een maandverbandje of tampon zoekt.',
    relatedTitle: '♥  Misschien vind je dit ook leuk',
    related: [
      {
        title: 'Welk maandverband of welke tampon kies ik voor mijn eerste menstruatie?',
        meta: '6 min  ·  Gids',
      },
      {
        title: 'Menstruatiepijn beheersen',
        meta: '7 min  ·  Gids',
      },
      {
        title: 'Mijn eerste menstruaties zijn onregelmatig: is dat normaal?',
        meta: '5 min  ·  Gids',
      },
    ],
    shareMessage: 'Hoe beheer je je eerste menstruatie in het dagelijks leven? — AWA',
  },
  fi: {
    badge: 'ENSIMMÄISET KUUKAUTISET',
    title: 'Miten hallitset ensimmäiset\nkuukautisesi arjessa?',
    metaDuration: '5 min lukuaika',
    metaType: 'Opas',
    metaLevel: 'Aloittelija',
    metaValidated: 'Tarkistettu sisältö',
    intro: 'Muutamalla pienellä tavalla ensimmäiset kuukautisesi sopivat helposti arkeesi koulussa ja sen ulkopuolella.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Arjen järjestäminen',
      'Pienen hätäpaketin kokoaminen',
      'Jos kuukautiset alkavat yllättäen',
    ],
    body1: 'Koulu, urheilu, uni: kuukautiset eivät estä jatkamasta tavanomaisia toimiasi. Sinun tarvitsee vain säätää muutamia tapoja pysyäksesi mukavana koko päivän.',
    dailyTips: [
      'Koulu tai harrastukset: pidä side tai tamponi laukussa',
      'Urheilu: voit edelleen urheilla, säädä vain tahtiasi',
      'Uni: sopiva yösiteen riittää',
    ],
    body2: 'Pieni paketti, jossa on yksi tai kaksi sidettä tai tamponia, varalle alushousut ja muutama pyyhe, mahtuu helposti koulu- tai urheilukassiin. Se auttaa tuntemaan olosi rauhalliseksi tapahtuu mitä tahansa.',
    tip1Title: 'Hyvä tietää',
    tip1Text: 'Sivun tai tamponin pitäminen aina mukana välttää yllätetyksi tulemisen stressin.',
    body3: 'Näin käy usein, erityisesti alussa. Koulun terveydenhoitajalla, opettajalla tai ystävällä on lähes aina jotain, mikä voi auttaa. Vaatteen sitominen vyötärölle voi myös toimia, kunnes löydät siteen tai tamponin.',
    relatedTitle: '♥  Saatat pitää myös näistä',
    related: [
      {
        title: 'Minkä siteen tai tamponin valitsen ensimmäisiin kuukautisiini?',
        meta: '6 min  ·  Opas',
      },
      {
        title: 'Kuukautiskivun hallinta',
        meta: '7 min  ·  Opas',
      },
      {
        title: 'Ensimmäiset kuukautiseni ovat epäsäännölliset: onko se normaalia?',
        meta: '5 min  ·  Opas',
      },
    ],
    shareMessage: 'Miten hallitset ensimmäiset kuukautisesi arjessa? — AWA',
  },
  el: {
    badge: 'ΠΡΩΤΗ ΠΕΡΙΟΔΟΣ',
    title: 'Πώς να διαχειριστείς την πρώτη\nσου περίοδο στην καθημερινότητα;',
    metaDuration: '5 λεπτά ανάγνωσης',
    metaType: 'Οδηγός',
    metaLevel: 'Αρχάριο',
    metaValidated: 'Ελεγμένο περιεχόμενο',
    intro: 'Με λίγες μικρές συνήθειες, η πρώτη σου περίοδος ενσωματώνεται εύκολα στην καθημερινότητά σου, στο σχολείο και αλλού.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Οργάνωση στην καθημερινότητα',
      'Φτιάχνοντας ένα μικρό κιτ έκτακτης ανάγκης',
      'Αν η περίοδος έρθει απροσδόκητα',
    ],
    body1: 'Σχολείο, άθληση, ύπνος: η περίοδός σου δεν σε εμποδίζει να συνεχίσεις τις συνηθισμένες δραστηριότητές σου. Χρειάζεται απλώς να προσαρμόσεις μερικές συνήθειες για να νιώθεις άνετα όλη την ημέρα.',
    dailyTips: [
      'Σχολείο ή δραστηριότητες: κράτα μια σερβιέτα ή ένα ταμπόν στην τσάντα σου',
      'Άθληση: μπορείς να συνεχίσεις να αθλείσαι, απλώς προσάρμοσε τον ρυθμό σου',
      'Ύπνος: αρκεί μια κατάλληλη νυχτερινή σερβιέτα',
    ],
    body2: 'Ένα μικρό κιτ με μία ή δύο σερβιέτες ή ταμπόν, ένα εφεδρικό εσώρουχο και μερικά μαντιλάκια χωράει εύκολα σε μια σχολική ή αθλητική τσάντα. Σε βοηθά να νιώθεις άνετα ό,τι κι αν συμβεί.',
    tip1Title: 'Καλό είναι να γνωρίζεις',
    tip1Text: 'Το να έχεις πάντα μαζί σου μια σερβιέτα ή ένα ταμπόν αποφεύγει το άγχος του να σε πιάσει απροετοίμαστη.',
    body3: 'Αυτό συμβαίνει συχνά, ειδικά στην αρχή. Η νοσηλεύτρια του σχολείου, μια δασκάλα ή μια φίλη σχεδόν πάντα έχει κάτι που μπορεί να βοηθήσει. Το να δέσεις ένα ρούχο γύρω από τη μέση σου μπορεί επίσης να βοηθήσει μέχρι να βρεις μια σερβιέτα ή ένα ταμπόν.',
    relatedTitle: '♥  Μπορεί επίσης να σου αρέσουν',
    related: [
      {
        title: 'Ποια σερβιέτα ή ταμπόν να επιλέξω για την πρώτη μου περίοδο;',
        meta: '6 λεπτά  ·  Οδηγός',
      },
      {
        title: 'Διαχείριση του πόνου της περιόδου',
        meta: '7 λεπτά  ·  Οδηγός',
      },
      {
        title: 'Οι πρώτες μου περίοδοι είναι ακανόνιστες: είναι φυσιολογικό;',
        meta: '5 λεπτά  ·  Οδηγός',
      },
    ],
    shareMessage: 'Πώς να διαχειριστείς την πρώτη σου περίοδο στην καθημερινότητα; — AWA',
  },
  fil: {
    badge: 'UNANG REGLA',
    title: 'Paano pangasiwaan ang iyong\nunang regla sa araw-araw?',
    metaDuration: '5 min na babasahin',
    metaType: 'Gabay',
    metaLevel: 'Baguhan',
    metaValidated: 'Sinuring nilalaman',
    intro: 'Sa ilang maliliit na gawi, madaling sasama sa iyong araw-araw na buhay ang iyong unang regla, sa paaralan at iba pa.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Pag-aayos sa araw-araw',
      'Paghahanda ng maliit na emergency kit',
      'Kung hindi inaasahang dumating ang regla',
    ],
    body1: 'Paaralan, isport, tulog: hindi ka pinipigilan ng regla na ipagpatuloy ang iyong mga karaniwang gawain. Kailangan lamang iayos ang ilang gawi para manatili kang komportable sa buong araw.',
    dailyTips: [
      'Paaralan o mga aktibidad: magdala ng napkin o tampon sa iyong bag',
      'Isport: maaari ka pa ring maglaro ng isport, iayos lamang ang iyong bilis',
      'Tulog: sapat na ang angkop na napkin para sa gabi',
    ],
    body2: 'Madaling magkasya sa bag sa paaralan o pang-isport ang maliit na kit na may isa o dalawang napkin o tampon, pamalit na panloob, at ilang wipes. Tinutulungan ka nitong maging panatag anuman ang mangyari.',
    tip1Title: 'Mabuting malaman',
    tip1Text: 'Ang palaging pagdadala ng napkin o tampon ay iniiwasan ang stress ng pagkabigla.',
    body3: 'Madalas itong mangyari, lalo na sa simula. Halos laging may mapagkukunan ng tulong ang nars ng paaralan, isang guro, o kaibigan. Maaari ring makatulong ang pagtali ng damit sa iyong baywang habang naghahanap ka ng napkin o tampon.',
    relatedTitle: '♥  Maaaring magustuhan mo rin',
    related: [
      {
        title: 'Anong napkin o tampon ang pipiliin ko para sa unang regla?',
        meta: '6 min  ·  Gabay',
      },
      {
        title: 'Pangangasiwa sa sakit ng regla',
        meta: '7 min  ·  Gabay',
      },
      {
        title: 'Hindi regular ang aking mga unang regla: normal ba iyon?',
        meta: '5 min  ·  Gabay',
      },
    ],
    shareMessage: 'Paano pangasiwaan ang iyong unang regla sa araw-araw? — AWA',
  },
  ta: {
    badge: 'முதல் மாதவிடாய்',
    title: 'உங்கள் முதல் மாதவிடாயை\nஅன்றாடம் எப்படிக் கையாள்வது?',
    metaDuration: '5 நிமிடம் படிக்க',
    metaType: 'வழிகாட்டி',
    metaLevel: 'தொடக்க நிலை',
    metaValidated: 'சரிபார்க்கப்பட்ட உள்ளடக்கம்',
    intro: 'சில சிறிய பழக்கங்களுடன், பள்ளியிலும் அதற்கு அப்பாலும் உங்கள் முதல் மாதவிடாய் உங்கள் அன்றாட வாழ்க்கையில் எளிதாகப் பொருந்துகிறது.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      'அன்றாடம் ஒழுங்கமைத்தல்',
      'ஒரு சிறிய அவசரத் தொகுப்பைத் தயார் செய்தல்',
      'உங்கள் மாதவிடாய் எதிர்பாராமல் வந்தால்',
    ],
    body1: 'பள்ளி, விளையாட்டு, உறக்கம்: உங்கள் வழக்கமான செயல்களைத் தொடர்வதிலிருந்து மாதவிடாய் உங்களைத் தடுக்காது. நாள் முழுவதும் வசதியாக இருக்க சில பழக்கங்களை மட்டும் சரிசெய்ய வேண்டும்.',
    dailyTips: [
      'பள்ளி அல்லது செயல்பாடுகள்: உங்கள் பையில் ஒரு நாப்கினையோ டேம்பனையோ வைத்திருங்கள்',
      'விளையாட்டு: நீங்கள் இன்னும் விளையாட்டு விளையாடலாம், உங்கள் வேகத்தை மட்டும் சரிசெய்யுங்கள்',
      'உறக்கம்: பொருத்தமான இரவு நாப்கின் போதும்',
    ],
    body2: 'ஒன்று அல்லது இரண்டு நாப்கின்கள் அல்லது டேம்பன்கள், ஒரு மாற்று உள்ளாடை, சில துடைப்புத் துணிகள் கொண்ட ஒரு சிறிய தொகுப்பு, பள்ளி அல்லது விளையாட்டுப் பையில் எளிதாக அடங்கும். என்ன நடந்தாலும் நீங்கள் நிம்மதியாக உணர இது உதவுகிறது.',
    tip1Title: 'தெரிந்துகொள்ளுங்கள்',
    tip1Text: 'எப்போதும் ஒரு நாப்கினையோ டேம்பனையோ உங்களுடன் வைத்திருப்பது திடீரென்று சிக்கிக்கொள்ளும் அழுத்தத்தைத் தவிர்க்கிறது.',
    body3: 'இது அடிக்கடி நடக்கிறது, குறிப்பாகத் தொடக்கத்தில். பள்ளிச் செவிலியர், ஓர் ஆசிரியர் அல்லது ஒரு நண்பரிடம் கிட்டத்தட்ட எப்போதும் உதவக்கூடிய ஏதாவது இருக்கும். நீங்கள் ஒரு நாப்கினையோ டேம்பனையோ கண்டறியும் வரை, உங்கள் இடுப்பைச் சுற்றி ஓர் ஆடையைக் கட்டுவதும் உதவலாம்.',
    relatedTitle: '♥  உங்களுக்குப் பிடிக்கக்கூடியவை',
    related: [
      {
        title: 'என் முதல் மாதவிடாய்க்கு எந்த நாப்கினையோ டேம்பனையோ தேர்ந்தெடுப்பது?',
        meta: '6 நிமிடம்  ·  வழிகாட்டி',
      },
      {
        title: 'மாதவிடாய் வலியைக் கையாளுதல்',
        meta: '7 நிமிடம்  ·  வழிகாட்டி',
      },
      {
        title: 'என் முதல் மாதவிடாய்கள் ஒழுங்கற்றவை: இது இயல்பா?',
        meta: '5 நிமிடம்  ·  வழிகாட்டி',
      },
    ],
    shareMessage: 'உங்கள் முதல் மாதவிடாயை அன்றாடம் எப்படிக் கையாள்வது? — AWA',
  },
  te: {
    badge: 'మొదటి నెలసరి',
    title: 'మీ మొదటి నెలసరిని\nరోజువారీగా ఎలా నిర్వహించాలి?',
    metaDuration: '5 నిమిషాల పఠనం',
    metaType: 'గైడ్',
    metaLevel: 'ప్రారంభ స్థాయి',
    metaValidated: 'మదింపు చేసిన కంటెంట్',
    intro: 'కొన్ని చిన్న అలవాట్లతో, మీ మొదటి నెలసరి మీ రోజువారీ జీవితంలో, పాఠశాలలో, ఇతర చోట్ల సులభంగా ఇమిడిపోతుంది.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      'రోజువారీగా ఏర్పాటు చేసుకోవడం',
      'ఒక చిన్న అత్యవసర కిట్‌ను సిద్ధం చేసుకోవడం',
      'మీ నెలసరి అనుకోకుండా వస్తే',
    ],
    body1: 'పాఠశాల, క్రీడలు, నిద్ర: మీ నెలసరి మీ సాధారణ కార్యకలాపాలను కొనసాగించకుండా మిమ్మల్ని ఆపదు. రోజంతా సౌకర్యంగా ఉండటానికి కొన్ని అలవాట్లను సర్దుబాటు చేసుకుంటే చాలు.',
    dailyTips: [
      'పాఠశాల లేదా కార్యకలాపాలు: మీ బ్యాగ్‌లో ఒక ప్యాడ్ లేదా టాంపోన్ ఉంచుకోండి',
      'క్రీడలు: మీరు ఇంకా క్రీడలు ఆడవచ్చు, మీ వేగాన్ని సర్దుబాటు చేసుకోండి',
      'నిద్ర: తగిన రాత్రి ప్యాడ్ చాలు',
    ],
    body2: 'ఒకటి లేదా రెండు ప్యాడ్లు లేదా టాంపోన్లు, ఒక అదనపు లోదుస్తుల జత, కొన్ని వైప్స్‌తో కూడిన చిన్న కిట్ పాఠశాల లేదా క్రీడా బ్యాగ్‌లో సులభంగా ఇమిడిపోతుంది. ఏం జరిగినా హాయిగా అనిపించడానికి ఇది సహాయపడుతుంది.',
    tip1Title: 'తెలుసుకోవాల్సినవి',
    tip1Text: 'ఎల్లప్పుడూ మీ వెంట ఒక ప్యాడ్ లేదా టాంపోన్ ఉంచుకోవడం అనుకోకుండా చిక్కుకునే ఒత్తిడిని నివారిస్తుంది.',
    body3: 'ఇది తరచుగా జరుగుతుంది, ముఖ్యంగా మొదట్లో. ఒక పాఠశాల నర్సు, ఒక ఉపాధ్యాయురాలు లేదా ఒక స్నేహితురాలి దగ్గర దాదాపు ఎల్లప్పుడూ సహాయపడేది ఏదో ఒకటి ఉంటుంది. మీరు ఒక ప్యాడ్ లేదా టాంపోన్ కనుగొనే వరకు నడుము చుట్టూ ఒక దుస్తును కట్టుకోవడం కూడా పనిచేస్తుంది.',
    relatedTitle: '♥  మీకు ఇవి కూడా నచ్చవచ్చు',
    related: [
      {
        title: 'నా మొదటి నెలసరికి ఏ ప్యాడ్ లేదా టాంపోన్‌ను ఎంచుకోవాలి?',
        meta: '6 ని  ·  గైడ్',
      },
      {
        title: 'నెలసరి నొప్పిని నిర్వహించడం',
        meta: '7 ని  ·  గైడ్',
      },
      {
        title: 'నా మొదటి నెలసరులు అస్తవ్యస్తంగా ఉన్నాయి: ఇది సహజమేనా?',
        meta: '5 ని  ·  గైడ్',
      },
    ],
    shareMessage: 'మీ మొదటి నెలసరిని రోజువారీగా ఎలా నిర్వహించాలి? — AWA',
  },
  mr: {
    badge: 'पहिली पाळी',
    title: 'तुमची पहिली पाळी रोजच्या\nजीवनात कशी सांभाळावी?',
    metaDuration: '5 मिनिटे वाचन',
    metaType: 'मार्गदर्शक',
    metaLevel: 'प्रारंभ स्तर',
    metaValidated: 'पुनरावलोकन केलेला मजकूर',
    intro: 'काही छोट्या सवयींनी तुमची पहिली पाळी तुमच्या रोजच्या जीवनात, शाळेत आणि बाहेरही, सहज बसते.',
    contentsTitle: 'या लेखात',
    topics: [
      'रोज नीट आयोजन करणे',
      'एक छोटी आणीबाणीची किट तयार करणे',
      'तुमची पाळी अनपेक्षितपणे आली तर',
    ],
    body1: 'शाळा, खेळ, झोप: तुमची पाळी तुम्हाला तुमच्या नेहमीच्या कामांपासून थांबवत नाही. दिवसभर आरामात राहण्यासाठी फक्त काही सवयी जुळवाव्या लागतात.',
    dailyTips: [
      'शाळा किंवा कामे: तुमच्या बॅगेत एक पॅड किंवा टॅम्पॉन ठेवा',
      'खेळ: तुम्ही खेळ खेळू शकता, फक्त तुमची गती जुळवा',
      'झोप: रात्रीसाठी योग्य पॅड पुरेसा आहे',
    ],
    body2: 'एक किंवा दोन पॅड किंवा टॅम्पॉन, अतिरिक्त अंतर्वस्त्र आणि काही वाइप्स असलेली छोटी किट शाळेच्या किंवा खेळाच्या बॅगेत सहज मावू शकते. काहीही झाले तरी ती तुम्हाला सहज वाटण्यास मदत करते.',
    tip1Title: 'हे जाणून घ्या',
    tip1Text: 'नेहमी एक पॅड किंवा टॅम्पॉन सोबत ठेवल्याने अचानक पकडले जाण्याचा ताण टळतो.',
    body3: 'हे अनेकदा घडते, विशेषतः सुरुवातीला. शाळेची नर्स, एखादी शिक्षिका किंवा मैत्रीण यांच्याकडे जवळजवळ नेहमीच काही उपयोगी असते. तुम्ही पॅड किंवा टॅम्पॉन शोधेपर्यंत कंबरेभोवती एखादा कपडा बांधणेही उपयोगी ठरू शकते.',
    relatedTitle: '♥  तुम्हाला हे देखील आवडेल',
    related: [
      {
        title: 'माझ्या पहिल्या पाळीसाठी मी कोणता पॅड किंवा टॅम्पॉन निवडावा?',
        meta: '6 मिनिटे  ·  मार्गदर्शक',
      },
      {
        title: 'पाळीतील वेदना सांभाळणे',
        meta: '7 मिनिटे  ·  मार्गदर्शक',
      },
      {
        title: 'माझ्या पहिल्या पाळ्या अनियमित आहेत: हे सामान्य आहे का?',
        meta: '5 मिनिटे  ·  मार्गदर्शक',
      },
    ],
    shareMessage: 'तुमची पहिली पाळी रोजच्या जीवनात कशी सांभाळावी? — AWA',
  },
  gu: {
    badge: 'પ્રથમ માસિક',
    title: 'તમારા પ્રથમ માસિકને\nરોજિંદા જીવનમાં કેવી રીતે સંભાળવું?',
    metaDuration: '5 મિનિટ વાંચન',
    metaType: 'માર્ગદર્શિકા',
    metaLevel: 'પ્રારંભિક સ્તર',
    metaValidated: 'પુનરાવલોકન કરેલી સામગ્રી',
    intro: 'થોડી નાની ટેવો સાથે, તમારું પ્રથમ માસિક તમારા રોજિંદા જીવનમાં, શાળામાં અને બહાર, સરળતાથી ગોઠવાઈ જાય છે.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      'રોજિંદું આયોજન કરવું',
      'નાની કટોકટી કીટ તૈયાર કરવી',
      'જો માસિક અણધાર્યું આવે',
    ],
    body1: 'શાળા, રમતગમત, ઊંઘ: તમારું માસિક તમને તમારી સામાન્ય પ્રવૃત્તિઓ ચાલુ રાખવાથી રોકતું નથી. આખો દિવસ આરામદાયક રહેવા માટે તમારે ફક્ત થોડી ટેવો ગોઠવવાની જરૂર છે.',
    dailyTips: [
      'શાળા કે પ્રવૃત્તિઓ: તમારી બેગમાં એક પેડ કે ટેમ્પોન રાખો',
      'રમતગમત: તમે રમતગમત ચાલુ રાખી શકો છો, ફક્ત તમારી ગતિ ગોઠવો',
      'ઊંઘ: રાત માટેનું યોગ્ય પેડ પૂરતું છે',
    ],
    body2: 'એક કે બે પેડ કે ટેમ્પોન, બદલવા માટે એક વધારાનું અંડરવેર અને થોડા વાઇપ્સ સાથેની નાની કીટ શાળા કે રમતગમતની બેગમાં સહેલાઈથી સમાઈ જાય છે. ગમે તે થાય, તે તમને સહજ અનુભવવામાં મદદ કરે છે.',
    tip1Title: 'જાણવા જેવું',
    tip1Text: 'હંમેશાં એક પેડ કે ટેમ્પોન સાથે રાખવાથી અચાનક ફસાઈ જવાનો તણાવ ટળે છે.',
    body3: 'આવું ઘણી વાર થાય છે, ખાસ કરીને શરૂઆતમાં. શાળાની નર્સ, શિક્ષક કે મિત્ર પાસે લગભગ હંમેશાં કંઈક હોય છે જે મદદ કરી શકે. પેડ કે ટેમ્પોન મળે ત્યાં સુધી કમર પર કપડું બાંધી લેવું પણ કામ આવી શકે છે.',
    relatedTitle: '♥  તમને આ પણ ગમી શકે',
    related: [
      {
        title: 'મારા પ્રથમ માસિક માટે મારે કયું પેડ કે ટેમ્પોન પસંદ કરવું?',
        meta: '6 મિનિટ  ·  માર્ગદર્શિકા',
      },
      {
        title: 'માસિકના દુખાવાને સંભાળવો',
        meta: '7 મિનિટ  ·  માર્ગદર્શિકા',
      },
      {
        title: 'મારા પ્રથમ માસિક અનિયમિત છે: શું એ સામાન્ય છે?',
        meta: '5 મિનિટ  ·  માર્ગદર્શિકા',
      },
    ],
    shareMessage: 'તમારા પ્રથમ માસિકને રોજિંદા જીવનમાં કેવી રીતે સંભાળવું? — AWA',
  },
  pa: {
    badge: 'ਪਹਿਲੀ ਮਾਹਵਾਰੀ',
    title: 'ਆਪਣੀ ਪਹਿਲੀ ਮਾਹਵਾਰੀ ਨੂੰ\nਰੋਜ਼ਾਨਾ ਕਿਵੇਂ ਸੰਭਾਲੀਏ?',
    metaDuration: '5 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਗਾਈਡ',
    metaLevel: 'ਸ਼ੁਰੂਆਤੀ ਪੱਧਰ',
    metaValidated: 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ',
    intro: 'ਕੁਝ ਛੋਟੀਆਂ ਆਦਤਾਂ ਨਾਲ, ਤੁਹਾਡੀ ਪਹਿਲੀ ਮਾਹਵਾਰੀ ਸਕੂਲ ਅਤੇ ਉਸ ਤੋਂ ਬਾਹਰ ਵੀ ਤੁਹਾਡੀ ਰੋਜ਼ਾਨਾ ਜ਼ਿੰਦਗੀ ਵਿੱਚ ਸੌਖਿਆਂ ਹੀ ਰਲ ਜਾਂਦੀ ਹੈ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      'ਰੋਜ਼ਾਨਾ ਤਰਤੀਬ ਬਣਾਉਣਾ',
      'ਐਮਰਜੈਂਸੀ ਲਈ ਇੱਕ ਛੋਟੀ ਕਿੱਟ ਤਿਆਰ ਕਰਨਾ',
      'ਜੇ ਮਾਹਵਾਰੀ ਅਚਾਨਕ ਆ ਜਾਵੇ',
    ],
    body1: 'ਸਕੂਲ, ਖੇਡਾਂ, ਨੀਂਦ: ਮਾਹਵਾਰੀ ਤੁਹਾਨੂੰ ਆਪਣੀਆਂ ਆਮ ਸਰਗਰਮੀਆਂ ਜਾਰੀ ਰੱਖਣ ਤੋਂ ਨਹੀਂ ਰੋਕਦੀ। ਬਸ ਦਿਨ ਭਰ ਆਰਾਮਦਾਇਕ ਰਹਿਣ ਲਈ ਕੁਝ ਆਦਤਾਂ ਥੋੜ੍ਹੀਆਂ ਬਦਲਣੀਆਂ ਪੈਂਦੀਆਂ ਹਨ।',
    dailyTips: [
      'ਸਕੂਲ ਜਾਂ ਸਰਗਰਮੀਆਂ: ਆਪਣੇ ਬੈਗ ਵਿੱਚ ਇੱਕ ਪੈਡ ਜਾਂ ਟੈਂਪੂਨ ਰੱਖੋ',
      'ਖੇਡਾਂ: ਤੁਸੀਂ ਖੇਡਾਂ ਵਿੱਚ ਹਿੱਸਾ ਲੈ ਸਕਦੇ ਹੋ, ਬਸ ਆਪਣੀ ਰਫ਼ਤਾਰ ਥੋੜ੍ਹੀ ਢਾਲ ਲਓ',
      'ਨੀਂਦ: ਰਾਤ ਲਈ ਢੁਕਵਾਂ ਪੈਡ ਹੀ ਕਾਫ਼ੀ ਹੈ',
    ],
    body2: 'ਇੱਕ ਜਾਂ ਦੋ ਪੈਡ ਜਾਂ ਟੈਂਪੂਨ, ਅੰਦਰਲੇ ਕੱਪੜਿਆਂ ਦਾ ਇੱਕ ਵਾਧੂ ਜੋੜਾ ਅਤੇ ਕੁਝ ਵਾਈਪਸ ਵਾਲੀ ਇੱਕ ਛੋਟੀ ਕਿੱਟ ਸਕੂਲ ਜਾਂ ਖੇਡਾਂ ਦੇ ਬੈਗ ਵਿੱਚ ਆਸਾਨੀ ਨਾਲ ਆ ਜਾਂਦੀ ਹੈ। ਇਹ ਤੁਹਾਨੂੰ ਕੁਝ ਵੀ ਹੋਵੇ, ਸਹਿਜ ਮਹਿਸੂਸ ਕਰਵਾਉਂਦੀ ਹੈ।',
    tip1Title: 'ਜਾਣਨ ਯੋਗ',
    tip1Text: 'ਹਮੇਸ਼ਾ ਆਪਣੇ ਕੋਲ ਇੱਕ ਪੈਡ ਜਾਂ ਟੈਂਪੂਨ ਰੱਖਣ ਨਾਲ ਅਚਾਨਕ ਫਸ ਜਾਣ ਦੀ ਚਿੰਤਾ ਤੋਂ ਬਚਾਅ ਹੁੰਦਾ ਹੈ।',
    body3: 'ਇਹ ਅਕਸਰ ਹੁੰਦਾ ਹੈ, ਖ਼ਾਸ ਕਰਕੇ ਸ਼ੁਰੂ ਵਿੱਚ। ਸਕੂਲ ਦੀ ਨਰਸ, ਕੋਈ ਅਧਿਆਪਕਾ ਜਾਂ ਕੋਈ ਸਹੇਲੀ ਲਗਭਗ ਹਮੇਸ਼ਾ ਕੋਲ ਕੁਝ ਅਜਿਹਾ ਰੱਖਦੀ ਹੈ ਜੋ ਮਦਦ ਕਰ ਸਕੇ। ਜਦੋਂ ਤੱਕ ਪੈਡ ਜਾਂ ਟੈਂਪੂਨ ਨਹੀਂ ਮਿਲਦਾ, ਕਮਰ ਦੁਆਲੇ ਕੋਈ ਕੱਪੜਾ ਬੰਨ੍ਹ ਲੈਣਾ ਵੀ ਕੰਮ ਆ ਸਕਦਾ ਹੈ।',
    relatedTitle: '♥  ਤੁਹਾਨੂੰ ਇਹ ਵੀ ਪਸੰਦ ਆ ਸਕਦਾ ਹੈ',
    related: [
      {
        title: 'ਮੈਨੂੰ ਪਹਿਲੀ ਮਾਹਵਾਰੀ ਲਈ ਕਿਹੜਾ ਪੈਡ ਜਾਂ ਟੈਂਪੂਨ ਚੁਣਨਾ ਚਾਹੀਦਾ ਹੈ?',
        meta: '6 ਮਿੰਟ  ·  ਗਾਈਡ',
      },
      {
        title: 'ਮਾਹਵਾਰੀ ਦੇ ਦਰਦ ਨੂੰ ਸੰਭਾਲਣਾ',
        meta: '7 ਮਿੰਟ  ·  ਗਾਈਡ',
      },
      {
        title: 'ਮੇਰੀਆਂ ਪਹਿਲੀਆਂ ਮਾਹਵਾਰੀਆਂ ਬੇਨਿਯਮੀ ਵਾਲੀਆਂ ਹਨ: ਕੀ ਇਹ ਆਮ ਹੈ?',
        meta: '5 ਮਿੰਟ  ·  ਗਾਈਡ',
      },
    ],
    shareMessage: 'ਆਪਣੀ ਪਹਿਲੀ ਮਾਹਵਾਰੀ ਨੂੰ ਰੋਜ਼ਾਨਾ ਕਿਵੇਂ ਸੰਭਾਲੀਏ? — AWA',
  },
  my: {
    badge: 'ပထမဆုံးရာသီ',
    title: 'သင့်ပထမဆုံးရာသီကို နေ့စဉ်ဘဝတွင်\nမည်သို့စီမံမည်နည်း။',
    metaDuration: 'ဖတ်ချိန် 5 မိနစ်',
    metaType: 'လမ်းညွှန်',
    metaLevel: 'အခြေခံအဆင့်',
    metaValidated: 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ',
    intro: 'အကျင့်ကောင်းအနည်းငယ်ဖြင့် သင့်ပထမဆုံးရာသီသည် ကျောင်းနှင့် အခြားနေရာများတွင် သင့်နေ့စဉ်ဘဝထဲသို့ လွယ်ကူစွာ ဝင်ဆန့်သွားသည်။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'နေ့စဉ်စီစဉ်ထားရှိခြင်း',
      'အရေးပေါ်အိတ်ငယ်လေး ပြင်ဆင်ခြင်း',
      'သင့်ရာသီ မမျှော်လင့်ဘဲ ရောက်လာလျှင်',
    ],
    body1: 'ကျောင်း၊ အားကစား၊ အိပ်စက်ခြင်း - သင့်ရာသီသည် ပုံမှန်လှုပ်ရှားမှုများ ဆက်လုပ်ခြင်းကို မတားဆီးပါ။ တစ်နေကုန် သက်တောင့်သက်သာရှိစေရန် အကျင့်အနည်းငယ်ကိုသာ ညှိရန်လိုသည်။',
    dailyTips: [
      'ကျောင်း သို့မဟုတ် လှုပ်ရှားမှုများ - အိတ်ထဲတွင် ရာသီသွေးစုပ်ပြား သို့မဟုတ် တမ်ပွန် ထားပါ',
      'အားကစား - အားကစားဆက်လုပ်နိုင်သည်၊ အရှိန်ကိုသာ ညှိပါ',
      'အိပ်စက်ခြင်း - သင့်လျော်သော ညအိပ်ရာသီသွေးစုပ်ပြား တစ်ခုဆိုလျှင် လုံလောက်သည်',
    ],
    body2: 'ရာသီသွေးစုပ်ပြား သို့မဟုတ် တမ်ပွန် တစ်ခု သို့မဟုတ် နှစ်ခု၊ အတွင်းခံ အပိုတစ်စုံနှင့် သုတ်ပုဝါအချို့ပါသော အိတ်ငယ်လေးကို ကျောင်းအိတ် သို့မဟုတ် အားကစားအိတ်ထဲ လွယ်လွယ်ကူကူ ထည့်ထားနိုင်သည်။ မည်သည့်အရာဖြစ်ပေါ်လာသည်ဖြစ်စေ သက်တောင့်သက်သာ ခံစားရစေရန် ကူညီသည်။',
    tip1Title: 'သိထားသင့်သည်',
    tip1Text: 'ရာသီသွေးစုပ်ပြား သို့မဟုတ် တမ်ပွန်ကို အမြဲယူထားခြင်းဖြင့် မမျှော်လင့်ဘဲ ကြုံရသည့် စိတ်ဖိစီးမှုကို ရှောင်ရှားနိုင်သည်။',
    body3: 'ဤအရာသည် မကြာခဏဖြစ်တတ်သည်၊ အထူးသဖြင့် အစပိုင်းတွင် ဖြစ်သည်။ ကျောင်းသူနာပြု၊ ဆရာမ သို့မဟုတ် သူငယ်ချင်းတစ်ဦးတွင် ကူညီနိုင်သည့်အရာ အမြဲနီးပါး ရှိသည်။ ရာသီသွေးစုပ်ပြား သို့မဟုတ် တမ်ပွန်ကို ရှာနေစဉ် အဝတ်အစားတစ်ခုကို ခါးတွင်ပတ်ချည်ထားခြင်းလည်း အသုံးဝင်နိုင်သည်။',
    relatedTitle: '♥  သင်စိတ်ဝင်စားနိုင်သည့် အကြောင်းအရာများ',
    related: [
      {
        title: 'ပထမဆုံးရာသီအတွက် မည်သည့်ရာသီသွေးစုပ်ပြား သို့မဟုတ် တမ်ပွန်ကို ရွေးသင့်သနည်း။',
        meta: '6 မိနစ်  ·  လမ်းညွှန်',
      },
      {
        title: 'ရာသီလာချိန် ဝမ်းဗိုက်နာခြင်းကို စီမံခြင်း',
        meta: '7 မိနစ်  ·  လမ်းညွှန်',
      },
      {
        title: 'ကျွန်မ၏ ပထမဆုံးရာသီများ မမှန်ပါ၊ ပုံမှန်ဖြစ်သလား။',
        meta: '5 မိနစ်  ·  လမ်းညွှန်',
      },
    ],
    shareMessage: 'သင့်ပထမဆုံးရာသီကို နေ့စဉ်ဘဝတွင် မည်သို့စီမံမည်နည်း။ — AWA',
  },
  km: {
    badge: 'រដូវដំបូង',
    title: 'តើត្រូវគ្រប់គ្រងរដូវដំបូង\nរបស់អ្នកប្រចាំថ្ងៃយ៉ាងដូចម្តេច?',
    metaDuration: 'អាន 5 នាទី',
    metaType: 'មគ្គុទ្ទេសក៍',
    metaLevel: 'កម្រិតដំបូង',
    metaValidated: 'មាតិកាបានពិនិត្យ',
    intro: 'ដោយទម្លាប់តូចៗមួយចំនួន រដូវដំបូងរបស់អ្នកអាចចូលក្នុងជីវិតប្រចាំថ្ងៃបានយ៉ាងងាយស្រួល ទាំងនៅសាលា និងកន្លែងផ្សេងទៀត។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'ការរៀបចំខ្លួនប្រចាំថ្ងៃ',
      'ការរៀបចំកញ្ចប់សង្គ្រោះបន្ទាន់តូចមួយ',
      'ប្រសិនបើរដូវមកដល់ដោយមិនបានរំពឹងទុក',
    ],
    body1: 'សាលារៀន កីឡា ដំណេក៖ រដូវរបស់អ្នកមិនរារាំងអ្នកពីការបន្តសកម្មភាពធម្មតារបស់អ្នកទេ។ អ្នកគ្រាន់តែត្រូវកែសម្រួលទម្លាប់មួយចំនួនដើម្បីរក្សាភាពស្រួលខ្លួនពេញមួយថ្ងៃ។',
    dailyTips: [
      'សាលារៀន ឬសកម្មភាព៖ ទុកក្រណាត់អនាម័យ ឬថេមប៉ុងក្នុងកាបូបរបស់អ្នក',
      'កីឡា៖ អ្នកនៅតែអាចលេងកីឡាបាន គ្រាន់តែកែសម្រួលល្បឿនរបស់អ្នក',
      'ដំណេក៖ ក្រណាត់អនាម័យសម្រាប់ពេលយប់ដែលសមស្របគឺគ្រប់គ្រាន់',
    ],
    body2: 'កញ្ចប់តូចមួយដែលមានក្រណាត់អនាម័យ ឬថេមប៉ុងមួយឬពីរ ខោទ្រនាប់ស្តុកមួយ និងក្រដាសជូតសើមមួយចំនួន អាចដាក់ក្នុងកាបូបសាលា ឬកាបូបកីឡាបានយ៉ាងងាយ។ វាជួយឱ្យអ្នកមានអារម្មណ៍ស្រួលខ្លួនទោះមានអ្វីកើតឡើងក៏ដោយ។',
    tip1Title: 'គួរដឹង',
    tip1Text: 'ការមានក្រណាត់អនាម័យ ឬថេមប៉ុងជាប់ខ្លួនជានិច្ច ជៀសវាងភាពតានតឹងដោយសារមិនបានត្រៀមខ្លួន។',
    body3: 'រឿងនេះកើតឡើងញឹកញាប់ ជាពិសេសនៅដំបូង។ គិលានុបដ្ឋាយិការបស់សាលា គ្រូបង្រៀន ឬមិត្តភក្តិស្ទើរតែតែងតែមានអ្វីមួយដែលអាចជួយបាន។ ការចងសម្លៀកបំពាក់មួយដុំជុំវិញចង្កេះក៏អាចជួយបានដែរ ខណៈពេលដែលអ្នករកក្រណាត់អនាម័យ ឬថេមប៉ុង។',
    relatedTitle: '♥  អ្នកក៏អាចចូលចិត្ត',
    related: [
      {
        title: 'តើខ្ញុំគួរជ្រើសរើសក្រណាត់អនាម័យ ឬថេមប៉ុងអ្វីសម្រាប់រដូវដំបូងរបស់ខ្ញុំ?',
        meta: '6 នាទី  ·  មគ្គុទ្ទេសក៍',
      },
      {
        title: 'ការគ្រប់គ្រងការឈឺពោះរដូវ',
        meta: '7 នាទី  ·  មគ្គុទ្ទេសក៍',
      },
      {
        title: 'រដូវដំបូងរបស់ខ្ញុំមិនទៀងទាត់៖ តើនេះធម្មតាឬទេ?',
        meta: '5 នាទី  ·  មគ្គុទ្ទេសក៍',
      },
    ],
    shareMessage: 'តើត្រូវគ្រប់គ្រងរដូវដំបូងរបស់អ្នកប្រចាំថ្ងៃយ៉ាងដូចម្តេច? — AWA',
  },
  lo: {
    badge: 'ປະຈຳເດືອນຄັ້ງທຳອິດ',
    title: 'ຈັດການປະຈຳເດືອນຄັ້ງທຳອິດ\nໃນຊີວິດປະຈຳວັນແນວໃດ?',
    metaDuration: 'ອ່ານ 5 ນາທີ',
    metaType: 'ຄູ່ມື',
    metaLevel: 'ລະດັບເລີ່ມຕົ້ນ',
    metaValidated: 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ',
    intro: 'ດ້ວຍນິໄສນ້ອຍໆບໍ່ຫຼາຍອັນ ປະຈຳເດືອນຄັ້ງທຳອິດຂອງທ່ານຈະເຂົ້າກັບຊີວິດປະຈຳວັນໄດ້ງ່າຍ ທັງທີ່ໂຮງຮຽນ ແລະ ບ່ອນອື່ນ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ການຈັດແຈງໃນຊີວິດປະຈຳວັນ',
      'ການຈັດຊຸດສຸກເສີນນ້ອຍໆ',
      'ຖ້າປະຈຳເດືອນມາຢ່າງບໍ່ຄາດຄິດ',
    ],
    body1: 'ໂຮງຮຽນ, ກີລາ, ການນອນ: ປະຈຳເດືອນບໍ່ໄດ້ຫ້າມທ່ານບໍ່ໃຫ້ເຮັດກິດຈະກຳຕາມປົກກະຕິ. ທ່ານພຽງແຕ່ຕ້ອງປັບນິໄສບໍ່ຫຼາຍອັນເພື່ອໃຫ້ສະບາຍຕະຫຼອດວັນ.',
    dailyTips: [
      'ໂຮງຮຽນ ຫຼື ກິດຈະກຳ: ເກັບຜ້າອະນາໄມ ຫຼື ທຳປອນໄວ້ໃນກະເປົາ',
      'ກີລາ: ທ່ານຍັງຫຼິ້ນກີລາໄດ້ ພຽງແຕ່ປັບຈັງຫວະ',
      'ການນອນ: ຜ້າອະນາໄມແບບກາງຄືນທີ່ເໝາະສົມກໍພຽງພໍ',
    ],
    body2: 'ຊຸດນ້ອຍໆທີ່ມີຜ້າອະນາໄມ ຫຼື ທຳປອນ 1 ຫາ 2 ອັນ, ຊຸດຊັ້ນໃນສຳຮອງ ແລະ ຜ້າເຊັດບໍ່ຫຼາຍແຜ່ນ ສາມາດໃສ່ໃນກະເປົາໂຮງຮຽນ ຫຼື ກະເປົາກີລາໄດ້ງ່າຍ. ມັນຊ່ວຍໃຫ້ທ່ານຮູ້ສຶກສະບາຍໃຈບໍ່ວ່າຈະເກີດຫຍັງຂຶ້ນ.',
    tip1Title: 'ຄວນຮູ້',
    tip1Text: 'ການພົກຜ້າອະນາໄມ ຫຼື ທຳປອນຕິດຕົວສະເໝີ ຊ່ວຍຫຼີກເວັ້ນຄວາມກັງວົນຈາກການຖືກຈັບໂຕບໍ່ທັນ.',
    body3: 'ເລື່ອງນີ້ເກີດຂຶ້ນເລື້ອຍໆ ໂດຍສະເພາະໃນຕອນທຳອິດ. ພະຍາບານໂຮງຮຽນ, ຄູ ຫຼື ໝູ່ເກືອບສະເໝີມີສິ່ງທີ່ຊ່ວຍໄດ້. ການຜູກເສື້ອຜ້າອ້ອມແອວກໍສາມາດໃຊ້ໄດ້ໃນຂະນະທີ່ທ່ານຊອກຫາຜ້າອະນາໄມ ຫຼື ທຳປອນ.',
    relatedTitle: '♥  ທ່ານອາດຈະມັກ',
    related: [
      {
        title: 'ຄວນເລືອກຜ້າອະນາໄມ ຫຼື ທຳປອນແບບໃດສຳລັບປະຈຳເດືອນຄັ້ງທຳອິດ?',
        meta: '6 ນາທີ  ·  ຄູ່ມື',
      },
      {
        title: 'ການຈັດການອາການເຈັບທ້ອງປະຈຳເດືອນ',
        meta: '7 ນາທີ  ·  ຄູ່ມື',
      },
      {
        title: 'ປະຈຳເດືອນຄັ້ງທຳອິດຂອງຂ້ອຍບໍ່ສະໝ່ຳສະເໝີ: ເປັນເລື່ອງປົກກະຕິບໍ?',
        meta: '5 ນາທີ  ·  ຄູ່ມື',
      },
    ],
    shareMessage: 'ຈັດການປະຈຳເດືອນຄັ້ງທຳອິດໃນຊີວິດປະຈຳວັນແນວໃດ? — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FirstPeriodDailyLifeArticleScreen({
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

          <View style={styles.daily}>
            {DAILY_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons name={icon as never} color={theme.colors.primary} size={25} />
                <AwaText variant="bodySmall" style={styles.dailyText}>{content.dailyTips[index]}</AwaText>
              </View>
            ))}
          </View>

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
              <AwaText variant="titleSmall" emphasized>{content.tip1Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip1Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            3. {content.topics[2]}
          </AwaText>

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
          {RELATED_META.map((item, index) => (
            <AwaCard variant="filled" padding="none"
              key={item.articleId}
              onPress={() =>
                navigation.push('ArticleReader', {articleId: item.articleId})
              }
              style={styles.relatedCard}>
              <Image
                source={item.image}
                resizeMode="cover"
                style={styles.relatedImage}
              />

              <View style={styles.relatedCopy}>
                <AwaText variant="labelSmall" emphasized>
                  {content.related[index].title}
                </AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.relatedMeta}>{content.related[index].meta}</AwaText>
              </View>
            </AwaCard>
          ))}
        </ScrollView>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={5} scrollRef={scrollRef} />
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
  daily: {marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  dailyItem: {
    width: '48.7%',
    minHeight: 108,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  dailyText: {
    marginTop: 8,
    textAlign: 'center',
  },
  relatedHeader: {
    marginTop: 24,
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
