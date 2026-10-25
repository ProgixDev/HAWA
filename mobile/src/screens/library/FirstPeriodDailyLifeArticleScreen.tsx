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
  da: {
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
