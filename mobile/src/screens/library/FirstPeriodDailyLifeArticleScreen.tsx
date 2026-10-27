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
