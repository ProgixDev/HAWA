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
import {CYCLE_PHASES_HERO, resolveEditorialImage} from '../../i18n/editorialImages';
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

const ID = 'firstperiod-cycle-irregulier';

const HERO = require('../../assets/images/library/regular-cycle-hero.png');

// Images/ids stay language-neutral — only TEXT (title/meta) moves into the
// bilingual CONTENT object below, keyed by index to stay aligned with these.
const RELATED_IMAGES = [
  require('../../assets/images/library/regular-cycle-hero.png'),
  CYCLE_PHASES_HERO,
  require('../../assets/images/library/popular-flower.png'),
] as const;

const RELATED_IDS = [
  'cycle-comprendre-ton-cycle',
  'firstperiod-premieres-regles',
  'firstperiod-questions-frequentes',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('FirstPeriodIrregular', {
  fr: {
    badge: 'PREMIÈRES RÈGLES',
    title: 'Mes premières règles sont\nirrégulières : est-ce normal ?',
    metaDuration: '5 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Oui, c’est tout à fait normal. Voici pourquoi le cycle met du temps à se stabiliser, et quand il est utile d’en parler.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Pourquoi le cycle est irrégulier au début',
      'Combien de temps pour se stabiliser',
      'Quand consulter',
    ],
    body1: 'Les hormones qui régulent le cycle mettent du temps à trouver leur équilibre. Il est donc fréquent que les cycles soient plus courts, plus longs, ou espacés de façon inégale pendant les premières années.',
    body2: 'Le cycle peut mettre un à deux ans, parfois un peu plus, avant de devenir plus régulier. Ce temps d’adaptation varie beaucoup d’une personne à l’autre, sans que cela pose problème.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Un cycle irrégulier au début n’est jamais considéré comme un retard : le corps prend simplement le temps qu’il lui faut.',
    body3: 'Dans la grande majorité des cas, il n’y a rien d’inquiétant à observer. Un avis médical reste toutefois utile si les règles sont absentes pendant plusieurs mois après leur apparition, ou en cas de doute persistant.',
    alertTitle: 'Consulter si',
    alertText: 'Absence de règles pendant plusieurs mois, douleurs très intenses, ou saignements très abondants.',
    relatedTitle: '♥  Tu pourrais aussi aimer',
    related: [
      {title: 'Cycle régulier ou irrégulier : quelles différences ?', meta: '5 min  ·  Guide'},
      {title: 'Tes premières règles : à quoi t’attendre', meta: '5 min  ·  Guide'},
      {title: 'Questions fréquentes sur les premières règles', meta: '4 min  ·  FAQ'},
    ],
    shareMessage: 'Mes premières règles sont irrégulières : est-ce normal ? — AWA',
  },
  en: {
    badge: 'FIRST PERIOD',
    title: 'My first period is\nirregular: is that normal?',
    metaDuration: '5 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Yes, that’s completely normal. Here’s why the cycle takes time to settle down, and when it’s worth talking about it.',
    contentsTitle: 'In this article',
    topics: [
      'Why the cycle is irregular at first',
      'How long it takes to settle down',
      'When to see a doctor',
    ],
    body1: 'The hormones that regulate the cycle take time to find their balance. It’s therefore common for cycles to be shorter, longer, or spaced unevenly during the first few years.',
    body2: 'The cycle can take one to two years, sometimes a bit more, to become more regular. This adjustment period varies a lot from person to person, without it being a problem.',
    tip1Title: 'Good to know',
    tip1Text: 'An irregular cycle at first is never considered a delay: your body is simply taking the time it needs.',
    body3: 'In the vast majority of cases, there’s nothing to worry about. That said, it’s a good idea to see a doctor if your period is absent for several months after it first appears, or if you have ongoing doubts.',
    alertTitle: 'See a doctor if',
    alertText: 'No period for several months, very intense pain, or very heavy bleeding.',
    relatedTitle: '♥  You might also like',
    related: [
      {title: 'Regular or irregular cycle: what’s the difference?', meta: '5 min  ·  Guide'},
      {title: 'Your first period: what to expect', meta: '5 min  ·  Guide'},
      {title: 'Frequently asked questions about your first period', meta: '4 min  ·  FAQ'},
    ],
    shareMessage: 'My first period is irregular: is that normal? — AWA',
  },
  es: {
    badge: 'PRIMERA MENSTRUACIÓN',
    title: 'Mi primera menstruación es\nirregular: ¿es normal?',
    metaDuration: '5 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Sí, es completamente normal. Aquí te explicamos por qué el ciclo tarda en estabilizarse, y cuándo conviene hablar de ello.',
    contentsTitle: 'En este artículo',
    topics: [
      'Por qué el ciclo es irregular al principio',
      'Cuánto tiempo tarda en estabilizarse',
      'Cuándo consultar',
    ],
    body1: 'Las hormonas que regulan el ciclo tardan en encontrar su equilibrio. Por eso es frecuente que los ciclos sean más cortos, más largos o estén espaciados de forma desigual durante los primeros años.',
    body2: 'El ciclo puede tardar de uno a dos años, a veces un poco más, en volverse más regular. Este tiempo de adaptación varía mucho de una persona a otra, sin que eso suponga un problema.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Un ciclo irregular al principio nunca se considera un retraso: el cuerpo simplemente se toma el tiempo que necesita.',
    body3: 'En la gran mayoría de los casos, no hay nada preocupante que observar. Aun así, conviene pedir una opinión médica si la menstruación está ausente durante varios meses después de su aparición, o si persisten las dudas.',
    alertTitle: 'Consulta si',
    alertText: 'Ausencia de menstruación durante varios meses, dolores muy intensos o sangrados muy abundantes.',
    relatedTitle: '♥  También te podría gustar',
    related: [
      {title: 'Ciclo regular o irregular: ¿qué diferencias hay?', meta: '5 min  ·  Guía'},
      {title: 'Tu primera menstruación: qué esperar', meta: '5 min  ·  Guía'},
      {title: 'Preguntas frecuentes sobre la primera menstruación', meta: '4 min  ·  FAQ'},
    ],
    shareMessage: 'Mi primera menstruación es irregular: ¿es normal? — AWA',
  },
  it: {
    badge: 'PRIMO CICLO',
    title: 'Il mio primo ciclo è\nirregolare: è normale?',
    metaDuration: '5 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Sì, è del tutto normale. Ecco perché il ciclo ha bisogno di tempo per stabilizzarsi e quando vale la pena parlarne.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Perché all’inizio il ciclo è irregolare',
      'Quanto tempo ci vuole per stabilizzarsi',
      'Quando rivolgersi al medico',
    ],
    body1: 'Gli ormoni che regolano il ciclo hanno bisogno di tempo per trovare il loro equilibrio. È quindi comune che i cicli siano più corti, più lunghi o distanziati in modo non uniforme durante i primi anni.',
    body2: 'Il ciclo può impiegare da uno a due anni, a volte un po’ di più, per diventare più regolare. Questo periodo di assestamento varia molto da persona a persona, senza che sia un problema.',
    tip1Title: 'Da sapere',
    tip1Text: 'Un ciclo irregolare all’inizio non è mai considerato un ritardo: il tuo corpo si sta semplicemente prendendo il tempo di cui ha bisogno.',
    body3: 'Nella grande maggioranza dei casi non c’è nulla di cui preoccuparsi. Detto questo, è una buona idea rivolgersi al medico se il ciclo è assente per diversi mesi dopo la prima comparsa, o se hai dubbi che persistono.',
    alertTitle: 'Rivolgiti al medico se',
    alertText: 'Il ciclo manca da diversi mesi, hai un dolore molto intenso o un sanguinamento molto abbondante.',
    relatedTitle: '♥  Potrebbe interessarti anche',
    related: [
      {
        title: 'Ciclo regolare o irregolare: qual è la differenza?',
        meta: '5 min  ·  Guida',
      },
      {
        title: 'Il tuo primo ciclo: cosa aspettarti',
        meta: '5 min  ·  Guida',
      },
      {
        title: 'Domande frequenti sul tuo primo ciclo',
        meta: '4 min  ·  FAQ',
      },
    ],
    shareMessage: 'Il mio primo ciclo è irregolare: è normale? — AWA',
  },
  tr: {
    badge: 'İLK ADET',
    title: 'İlk adetim düzensiz:\nbu normal mi?',
    metaDuration: '5 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Evet, bu tamamen normal. Döngünün neden oturmasının zaman aldığını ve ne zaman konuşmaya değeceğini burada bulabilirsin.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Döngü başlangıçta neden düzensizdir?',
      'Oturması ne kadar sürer?',
      'Ne zaman doktora gitmeli?',
    ],
    body1: 'Döngüyü düzenleyen hormonların dengelenmesi zaman alır. Bu yüzden ilk yıllarda döngülerin daha kısa, daha uzun ya da düzensiz aralıklı olması yaygındır.',
    body2: 'Döngünün daha düzenli hale gelmesi bir ila iki yıl, bazen biraz daha uzun sürebilir. Bu uyum dönemi kişiden kişiye çok değişir ve bir sorun anlamına gelmez.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Başlangıçta düzensiz bir döngü asla bir gecikme sayılmaz: vücudun yalnızca ihtiyaç duyduğu zamanı alıyor.',
    body3: 'Vakaların büyük çoğunluğunda endişelenecek bir şey yoktur. Yine de adetin ilk görüldükten sonra birkaç ay boyunca gelmiyorsa ya da aklında süren şüpheler varsa doktora görünmen iyi olur.',
    alertTitle: 'Şu durumlarda doktora git',
    alertText: 'Birkaç ay boyunca adet görmeme, çok şiddetli ağrı ya da çok yoğun kanama.',
    relatedTitle: '♥  Bunlar da ilgini çekebilir',
    related: [
      {
        title: 'Düzenli ya da düzensiz döngü: fark nedir?',
        meta: '5 dk  ·  Rehber',
      },
      {
        title: 'İlk adetin: nelerle karşılaşabilirsin?',
        meta: '5 dk  ·  Rehber',
      },
      {
        title: 'İlk adetle ilgili sık sorulan sorular',
        meta: '4 dk  ·  SSS',
      },
    ],
    shareMessage: 'İlk adetim düzensiz: bu normal mi? — AWA',
  },
  ru: {
    badge: 'ПЕРВЫЕ МЕСЯЧНЫЕ',
    title: 'Первые месячные\nнерегулярны: это нормально?',
    metaDuration: '5 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Да, это совершенно нормально. Почему цикл устанавливается не сразу и когда стоит обсудить это с врачом.',
    contentsTitle: 'В этой статье',
    topics: [
      'Почему в начале цикл нерегулярный',
      'Сколько времени нужно, чтобы он установился',
      'Когда обратиться к врачу',
    ],
    body1: 'Гормонам, регулирующим цикл, нужно время, чтобы найти баланс. Поэтому в первые годы часто бывает, что циклы короче, длиннее или неравномерно распределены.',
    body2: 'Цикл может устанавливаться от одного до двух лет, иногда чуть дольше. Этот период адаптации сильно отличается у разных девушек и не является проблемой.',
    tip1Title: 'ПОЛЕЗНО ЗНАТЬ',
    tip1Text: 'Нерегулярный цикл в начале никогда не считается задержкой: организму просто нужно столько времени, сколько нужно.',
    body3: 'В подавляющем большинстве случаев поводов для беспокойства нет. Тем не менее стоит обратиться к врачу, если месячные отсутствуют в течение нескольких месяцев после первых или если сомнения не проходят.',
    alertTitle: 'Обратитесь к врачу, если',
    alertText: 'Месячных нет в течение нескольких месяцев, очень сильная боль или очень обильные кровотечения.',
    relatedTitle: '♥  Вам также может понравиться',
    related: [
      {
        title: 'Регулярный или нерегулярный цикл: в чём разница?',
        meta: '5 мин  ·  Руководство',
      },
      {
        title: 'Ваши первые месячные: чего ожидать',
        meta: '5 мин  ·  Руководство',
      },
      {
        title: 'Часто задаваемые вопросы о первых месячных',
        meta: '4 мин  ·  Вопросы и ответы',
      },
    ],
    shareMessage: 'Первые месячные нерегулярны: это нормально? — AWA',
  },
  de: {
    badge: 'ERSTE PERIODE',
    title: 'Meine erste Periode ist\nunregelmäßig: Ist das normal?',
    metaDuration: '5 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Ja, das ist völlig normal. Hier erfährst du, warum der Zyklus Zeit braucht, um sich einzupendeln, und wann es sinnvoll ist, darüber zu sprechen.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Warum der Zyklus am Anfang unregelmäßig ist',
      'Wie lange es dauert, bis er sich einpendelt',
      'Wann du zur Ärztin oder zum Arzt gehen solltest',
    ],
    body1: 'Die Hormone, die den Zyklus steuern, brauchen Zeit, um ihr Gleichgewicht zu finden. Deshalb sind Zyklen in den ersten Jahren oft kürzer, länger oder in unterschiedlichen Abständen.',
    body2: 'Es kann ein bis zwei Jahre, manchmal etwas länger dauern, bis der Zyklus regelmäßiger wird. Diese Anpassungsphase ist von Person zu Person sehr verschieden, ohne dass sie ein Problem darstellt.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Ein anfangs unregelmäßiger Zyklus gilt nie als Verspätung: Dein Körper nimmt sich einfach die Zeit, die er braucht.',
    body3: 'In den allermeisten Fällen gibt es keinen Grund zur Sorge. Dennoch ist es ratsam, ärztlichen Rat einzuholen, wenn deine Periode nach dem ersten Auftreten mehrere Monate ausbleibt oder wenn du weiterhin Zweifel hast.',
    alertTitle: 'Geh zur Ärztin oder zum Arzt, wenn',
    alertText: 'die Periode mehrere Monate ausbleibt, du sehr starke Schmerzen hast oder die Blutung sehr stark ist.',
    relatedTitle: '♥  Das könnte dich auch interessieren',
    related: [
      {
        title: 'Regelmäßiger oder unregelmäßiger Zyklus: Was ist der Unterschied?',
        meta: '5 Min.  ·  Ratgeber',
      },
      {
        title: 'Deine erste Periode: Was dich erwartet',
        meta: '5 Min.  ·  Ratgeber',
      },
      {
        title: 'Häufige Fragen zu deiner ersten Periode',
        meta: '4 Min.  ·  Häufige Fragen',
      },
    ],
    shareMessage: 'Meine erste Periode ist unregelmäßig: Ist das normal? — AWA',
  },
  zh: {
      badge: '初潮',
      title: '我的初潮后月经不规律：\n正常吗？',
      metaDuration: '阅读约 5 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '是的，这完全正常。下面说说为什么月经周期需要时间才能稳定下来，以及什么时候值得去咨询。',
      contentsTitle: '本文内容',
      topics: [
        '为什么一开始月经周期不规律',
        '需要多久才能稳定',
        '什么时候该看医生',
      ],
      body1: '调节月经周期的激素需要时间才能找到平衡。因此在最初几年里，周期时而较短、时而较长，或间隔不均匀，都很常见。',
      body2: '月经周期可能需要一到两年，有时甚至更久，才会变得比较规律。这段适应期因人而异，差别很大，这并不是问题。',
      tip1Title: '小贴士',
      tip1Text: '一开始月经周期不规律，从来都不算“推迟”：你的身体只是在用它需要的时间慢慢调整。',
      body3: '绝大多数情况下，不需要担心。不过，如果初潮之后月经连续几个月没有来，或者你一直心存疑虑，最好去看医生。',
      alertTitle: '出现以下情况请就医',
      alertText: '连续几个月没有月经、疼痛非常剧烈，或出血量非常大。',
      relatedTitle: '♥  你可能还想看',
      related: [
        {
          title: '月经周期规律还是不规律：有什么区别？',
          meta: '5 分钟  ·  指南',
        },
        {
          title: '你的初潮：会有什么变化',
          meta: '5 分钟  ·  指南',
        },
        {
          title: '关于初潮的常见问题',
          meta: '4 分钟  ·  常见问题',
        },
      ],
      shareMessage: '初潮后月经不规律：正常吗？ — AWA',
    },
  id: {
    badge: 'HAID PERTAMA',
    title: 'Haid pertamaku\ntidak teratur: apakah itu normal?',
    metaDuration: '5 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Ya, itu sepenuhnya normal. Berikut alasan mengapa siklus butuh waktu untuk stabil, dan kapan sebaiknya kamu membicarakannya.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Mengapa siklus tidak teratur di awal',
      'Berapa lama sampai stabil',
      'Kapan harus ke dokter',
    ],
    body1: 'Hormon yang mengatur siklus butuh waktu untuk menemukan keseimbangannya. Karena itu, wajar jika siklus lebih pendek, lebih panjang, atau berjarak tidak merata selama beberapa tahun pertama.',
    body2: 'Siklus bisa membutuhkan satu sampai dua tahun, kadang sedikit lebih lama, untuk menjadi lebih teratur. Masa penyesuaian ini sangat bervariasi dari satu orang ke orang lain, dan bukan berarti ada masalah.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Siklus yang tidak teratur di awal tidak pernah dianggap sebagai keterlambatan: tubuhmu hanya mengambil waktu yang dibutuhkannya.',
    body3: 'Pada sebagian besar kasus, tidak ada yang perlu dikhawatirkan. Meski begitu, sebaiknya temui dokter jika haidmu tidak datang selama beberapa bulan setelah pertama kali muncul, atau jika kamu terus merasa ragu.',
    alertTitle: 'Temui dokter jika',
    alertText: 'Tidak haid selama beberapa bulan, nyeri yang sangat hebat, atau perdarahan yang sangat deras.',
    relatedTitle: '♥  Mungkin kamu juga suka',
    related: [
      {
        title: 'Siklus teratur atau tidak teratur: apa bedanya?',
        meta: '5 mnt  ·  Panduan',
      },
      {
        title: 'Haid pertamamu: apa yang bisa diharapkan',
        meta: '5 mnt  ·  Panduan',
      },
      {
        title: 'Pertanyaan yang sering diajukan tentang haid pertamamu',
        meta: '4 mnt  ·  FAQ',
      },
    ],
    shareMessage: 'Haid pertamaku tidak teratur: apakah itu normal? — AWA',
  },
  hi: {
    badge: 'पहला पीरियड',
    title: 'मेरा पहला पीरियड अनियमित\nहै: क्या यह सामान्य है?',
    metaDuration: '5 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'जाँची गई जानकारी',
    intro: 'हाँ, यह बिल्कुल सामान्य है। यहाँ जानें कि चक्र को स्थिर होने में समय क्यों लगता है, और कब डॉक्टर से बात करना ठीक रहेगा।',
    contentsTitle: 'इस लेख में',
    topics: [
      'शुरुआत में चक्र अनियमित क्यों होता है',
      'स्थिर होने में कितना समय लगता है',
      'डॉक्टर को कब दिखाएँ',
    ],
    body1: 'चक्र को नियंत्रित करने वाले हार्मोन को अपना संतुलन बनाने में समय लगता है। इसलिए शुरुआती कुछ वर्षों में चक्र का छोटा, लंबा या असमान अंतराल पर आना आम बात है।',
    body2: 'चक्र को ज़्यादा नियमित होने में एक से दो साल, कभी-कभी थोड़ा और ज़्यादा समय लग सकता है। यह समय हर व्यक्ति में बहुत अलग होता है, और इसमें कोई समस्या नहीं है।',
    tip1Title: 'जानना अच्छा रहेगा',
    tip1Text: 'शुरुआत में अनियमित चक्र को कभी भी देरी नहीं माना जाता: आपका शरीर बस उतना समय ले रहा है जितना उसे चाहिए।',
    body3: 'ज़्यादातर मामलों में चिंता की कोई बात नहीं होती। फिर भी, अगर पहला पीरियड आने के बाद कई महीनों तक पीरियड न आए, या आपके मन में लगातार शंका हो, तो डॉक्टर को दिखाना अच्छा रहेगा।',
    alertTitle: 'इन स्थितियों में डॉक्टर को दिखाएँ',
    alertText: 'कई महीनों तक पीरियड न आना, बहुत तेज़ दर्द, या बहुत ज़्यादा रक्तस्राव।',
    relatedTitle: '♥  ये भी आपको पसंद आ सकता है',
    related: [
      {
        title: 'नियमित या अनियमित चक्र: क्या फ़र्क़ है?',
        meta: '5 मिनट  ·  गाइड',
      },
      {
        title: 'आपका पहला पीरियड: क्या उम्मीद रखें',
        meta: '5 मिनट  ·  गाइड',
      },
      {
        title: 'पहले पीरियड के बारे में अक्सर पूछे जाने वाले सवाल',
        meta: '4 मिनट  ·  अक्सर पूछे जाने वाले सवाल',
      },
    ],
    shareMessage: 'मेरा पहला पीरियड अनियमित है: क्या यह सामान्य है? — AWA',
  },
  sq: {
    badge: 'MENSTRUACIONI I PARË',
    title: 'Menstruacioni im i parë është\ni parregullt: a është normale?',
    metaDuration: '5 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Po, është plotësisht normale. Ja pse cikli kërkon kohë për t’u stabilizuar dhe kur ia vlen të flasësh për të.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Pse cikli është i parregullt në fillim',
      'Sa kohë duhet për t’u stabilizuar',
      'Kur të shkosh te mjeku',
    ],
    body1: 'Hormonet që rregullojnë ciklin kanë nevojë për kohë për të gjetur ekuilibrin. Prandaj është e zakonshme që ciklet të jenë më të shkurtra, më të gjata ose të ndara në mënyrë të pabarabartë gjatë vitave të para.',
    body2: 'Cikli mund të ketë nevojë për një deri në dy vjet, nganjëherë pak më shumë, për t’u bërë më i rregullt. Kjo periudhë përshtatjeje ndryshon shumë nga një person te tjetri, pa qenë problem.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Një cikël i parregullt në fillim nuk konsiderohet kurrë vonesë: trupi yt thjesht po merr kohën që i duhet.',
    body3: 'Në shumicën dërrmuese të rasteve, nuk ka arsye shqetësimi. Megjithatë, është mirë të shkosh te mjeku nëse menstruacioni mungon për disa muaj pasi ka ardhur për herë të parë, ose nëse ke dyshime të vazhdueshme.',
    alertTitle: 'Shko te mjeku nëse',
    alertText: 'Nuk ke menstruacione për disa muaj, ke dhimbje shumë të forta ose gjakderdhje shumë të bollshme.',
    relatedTitle: '♥  Mund të të pëlqejnë edhe',
    related: [
      {
        title: 'Cikël i rregullt apo i parregullt: cili është ndryshimi?',
        meta: '5 min  ·  Udhëzues',
      },
      {
        title: 'Menstruacioni yt i parë: çfarë të presësh',
        meta: '5 min  ·  Udhëzues',
      },
      {
        title: 'Pyetje të shpeshta mbi menstruacionin e parë',
        meta: '4 min  ·  Pyetje të shpeshta',
      },
    ],
    shareMessage: 'Menstruacioni im i parë është i parregullt: a është normale? — AWA',
  },
  ja: {
    badge: '初経',
    title: '初めのころの生理が\n不規則なのは普通？',
    metaDuration: '読了5分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '監修済みの内容',
    intro: 'はい、まったく普通のことです。周期が落ち着くまでに時間がかかる理由と、相談したほうがよいタイミングを紹介します。',
    contentsTitle: 'この記事の内容',
    topics: [
      '最初は周期が不規則になる理由',
      '落ち着くまでにかかる期間',
      '医師に相談するタイミング',
    ],
    body1: '周期を調整するホルモンは、バランスが整うまでに時間がかかります。そのため、最初の数年間は、周期が短くなったり長くなったり、間隔がふぞろいになったりするのはよくあることです。',
    body2: '周期がより規則的になるまでには、1〜2年、場合によってはもう少しかかることがあります。この調整期間は人によって大きく異なり、それが問題というわけではありません。',
    tip1Title: '知っておきたいこと',
    tip1Text: '最初のころの不規則な周期は、「遅れ」とは見なされません。体が必要な時間をかけているだけです。',
    body3: 'ほとんどの場合、心配はいりません。ただし、生理が始まってから数か月来ない場合や、不安が続く場合は、医師に相談するとよいでしょう。',
    alertTitle: '次のようなときは医師に相談を',
    alertText: '数か月間生理が来ない、とても強い痛みがある、出血量がとても多い。',
    relatedTitle: '♥  こちらもおすすめ',
    related: [
      {
        title: '規則的な周期と不規則な周期：何が違う？',
        meta: '5分  ·  ガイド',
      },
      {
        title: '初めての生理：知っておきたいこと',
        meta: '5分  ·  ガイド',
      },
      {
        title: '初めての生理についてよくある質問',
        meta: '4分  ·  よくある質問',
      },
    ],
    shareMessage: '初めのころの生理が不規則なのは普通？ — AWA',
  },
  ko: {
    badge: '첫 생리',
    title: '첫 생리가\n불규칙해요. 정상인가요?',
    metaDuration: '5분 읽기',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '네, 아주 정상이에요. 주기가 자리를 잡는 데 시간이 걸리는 이유와 상담이 필요한 경우를 알아봐요.',
    contentsTitle: '이 아티클에서는',
    topics: [
      '처음에는 주기가 왜 불규칙할까요',
      '자리를 잡는 데 걸리는 시간',
      '의사에게 진료받아야 할 때',
    ],
    body1: '주기를 조절하는 호르몬이 균형을 찾는 데는 시간이 걸려요. 그래서 처음 몇 년 동안은 주기가 짧거나 길거나 간격이 고르지 않은 경우가 흔해요.',
    body2: '주기가 더 규칙적으로 자리 잡기까지 1~2년, 때로는 그보다 조금 더 걸릴 수 있어요. 이 적응 기간은 사람마다 크게 다르고, 그것이 문제인 것은 아니에요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '처음에 주기가 불규칙한 것은 결코 늦어지는 것으로 보지 않아요. 몸이 필요한 만큼 시간을 들이고 있을 뿐이에요.',
    body3: '대부분의 경우 걱정할 필요는 없어요. 다만 첫 생리가 시작된 뒤 몇 달 동안 생리가 없거나 계속 의문이 든다면 의사에게 진료받는 것이 좋아요.',
    alertTitle: '이럴 때는 의사에게 진료받으세요',
    alertText: '몇 달 동안 생리가 없을 때, 통증이 아주 심할 때, 출혈이 아주 많을 때.',
    relatedTitle: '♥  함께 보면 좋은 글',
    related: [
      {
        title: '규칙적인 주기와 불규칙한 주기: 무엇이 다를까요?',
        meta: '5분  ·  가이드',
      },
      {
        title: '첫 생리, 무엇을 기대해야 할까요',
        meta: '5분  ·  가이드',
      },
      {
        title: '첫 생리에 대한 자주 묻는 질문',
        meta: '4분  ·  FAQ',
      },
    ],
    shareMessage: '첫 생리가 불규칙해요. 정상인가요? — AWA',
  },
  'pt-PT': {
    badge: 'PRIMEIRO PERÍODO',
    title: 'O meu primeiro período é\nirregular: é normal?',
    metaDuration: '5 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Sim, é perfeitamente normal. Eis porque o ciclo demora a estabilizar e quando vale a pena falar disso.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Porque é que o ciclo é irregular no início',
      'Quanto tempo demora a estabilizar',
      'Quando consultar um médico',
    ],
    body1: 'As hormonas que regulam o ciclo demoram tempo a encontrar o equilíbrio. É por isso comum que os ciclos sejam mais curtos, mais longos ou espaçados de forma desigual durante os primeiros anos.',
    body2: 'O ciclo pode demorar um a dois anos, por vezes um pouco mais, a tornar-se mais regular. Este período de adaptação varia muito de pessoa para pessoa, sem que isso seja um problema.',
    tip1Title: 'Bom saber',
    tip1Text: 'Um ciclo irregular no início nunca é considerado um atraso: o seu corpo está apenas a levar o tempo de que precisa.',
    body3: 'Na grande maioria dos casos, não há motivo para preocupação. Ainda assim, é aconselhável consultar um médico se o período estiver ausente durante vários meses depois de ter surgido pela primeira vez, ou se tiver dúvidas persistentes.',
    alertTitle: 'Consulte um médico se',
    alertText: 'Não tiver período há vários meses, tiver dor muito intensa ou uma hemorragia muito abundante.',
    relatedTitle: '♥  Também pode gostar',
    related: [
      {
        title: 'Ciclo regular ou irregular: qual é a diferença?',
        meta: '5 min  ·  Guia',
      },
      {
        title: 'O seu primeiro período: o que esperar',
        meta: '5 min  ·  Guia',
      },
      {
        title: 'Perguntas frequentes sobre o primeiro período',
        meta: '4 min  ·  Perguntas frequentes',
      },
    ],
    shareMessage: 'O meu primeiro período é irregular: é normal? — AWA',
  },
  bn: {
    badge: 'প্রথম মাসিক',
    title: 'আমার প্রথম দিকের মাসিক\nঅনিয়মিত: এটা কি স্বাভাবিক?',
    metaDuration: 'পড়তে 5 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'হ্যাঁ, এটি সম্পূর্ণ স্বাভাবিক। চক্র স্থির হতে কেন সময় লাগে এবং কখন এ নিয়ে কথা বলা উচিত, তা এখানে জানুন।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'শুরুতে চক্র কেন অনিয়মিত থাকে',
      'স্থির হতে কত সময় লাগে',
      'কখন ডাক্তার দেখাবেন',
    ],
    body1: 'যেসব হরমোন চক্র নিয়ন্ত্রণ করে, তাদের ভারসাম্য খুঁজে পেতে সময় লাগে। তাই প্রথম কয়েক বছরে চক্র ছোট, বড় বা অসমান ব্যবধানে হওয়া খুবই সাধারণ।',
    body2: 'চক্র আরও নিয়মিত হতে এক থেকে দুই বছর, কখনো কখনো আরও একটু বেশি সময় লাগতে পারে। এই মানিয়ে নেওয়ার সময়কাল একজন থেকে আরেকজনে অনেক আলাদা হয়, এবং এটি কোনো সমস্যা নয়।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'শুরুতে অনিয়মিত চক্রকে কখনো “দেরি” বলে গণ্য করা হয় না: আপনার শরীর শুধু প্রয়োজনীয় সময়টুকু নিচ্ছে।',
    body3: 'অধিকাংশ ক্ষেত্রেই দুশ্চিন্তার কিছু নেই। তবে প্রথম মাসিক শুরু হওয়ার পর যদি কয়েক মাস মাসিক বন্ধ থাকে, অথবা আপনার মনে ক্রমাগত সন্দেহ থাকে, তাহলে ডাক্তার দেখানো ভালো।',
    alertTitle: 'ডাক্তার দেখান যদি',
    alertText: 'কয়েক মাস মাসিক না হয়, খুব তীব্র ব্যথা হয়, অথবা খুব বেশি রক্তক্ষরণ হয়।',
    relatedTitle: '♥  আপনার আরও ভালো লাগতে পারে',
    related: [
      {
        title: 'নিয়মিত না অনিয়মিত চক্র: পার্থক্য কী?',
        meta: '5 মিনিট  ·  গাইড',
      },
      {
        title: 'আপনার প্রথম মাসিক: কী আশা করবেন',
        meta: '5 মিনিট  ·  গাইড',
      },
      {
        title: 'প্রথম মাসিক নিয়ে সচরাচর জিজ্ঞাসা',
        meta: '4 মিনিট  ·  সচরাচর জিজ্ঞাসা',
      },
    ],
    shareMessage: 'আমার প্রথম দিকের মাসিক অনিয়মিত: এটা কি স্বাভাবিক? — AWA',
  },
  da: {
    badge: 'FØRSTE MENSTRUATION',
    title: 'Min tidlige menstruation er\nuregelmæssig: er det normalt?',
    metaDuration: '5 min læsning',
    metaType: 'Guide',
    metaLevel: 'Grundlæggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Ja, det er helt normalt. Find ud af her, hvorfor det tager tid for cyklussen at stabilisere sig, og hvornår du bør tale med nogen.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvorfor cyklussen er uregelmæssig i starten',
      'Hvor lang tid tager det at stabilisere sig',
      'Hvornår du skal gå til lægen',
    ],
    body1: 'De hormoner, der regulerer cyklussen, har brug for tid til at finde balancen. Det er derfor meget almindeligt i de første par år at have cyklusser, der er kortere, længere eller med ujævne intervaller.',
    body2: 'Det kan tage et til to år, sommetider lidt mere, for cyklussen at blive mere regelmæssig. Denne tilpasningsperiode varierer meget fra person til person, og det er ikke et problem.',
    tip1Title: 'Godt at vide',
    tip1Text: 'En uregelmæssig cyklus i starten betragtes aldrig som "forsinket": din krop tager bare den tid, den har brug for.',
    body3: 'I de fleste tilfælde er der intet at bekymre sig om. Men hvis menstruationen stopper i et par måneder efter din første cyklus, eller du løbende er i tvivl, er det en god idé at gå til lægen.',
    alertTitle: 'Gå til lægen hvis',
    alertText: 'Menstruationen udebliver i et par måneder, smerten er meget kraftig, eller blødningen er meget kraftig.',
    relatedTitle: '♥  Du vil måske også synes om',
    related: [
      {
        title: 'Regelmæssig eller uregelmæssig cyklus: hvad er forskellen?',
        meta: '5 min  ·  Guide',
      },
      {
        title: 'Din første menstruation: hvad du kan forvente',
        meta: '5 min  ·  Guide',
      },
      {
        title: 'Hyppige spørgsmål om den første menstruation',
        meta: '4 min  ·  FAQ',
      },
    ],
    shareMessage: 'Min tidlige menstruation er uregelmæssig: er det normalt? — AWA',
  },
  sv: {
    badge: 'FÖRSTE MENSTRUATION',
    title: 'Min tidlige menstruation er\nuregelmässig: ar det normalt?',
    metaDuration: '5 min läsning',
    metaType: 'Guide',
    metaLevel: 'Grundläggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Ja, det ar helt normalt. Find ud av her, hvorfor det tager tid for cyklussen at stabilisere sig, och hvornår du bör tale med nogen.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvorfor cyklussen ar uregelmässig i starten',
      'Hvor lang tid tager det at stabilisere sig',
      'Hvornår du skal gå till lägen',
    ],
    body1: 'De hormoner, der regulerer cyklussen, har brug for tid till at finde balancen. Det ar derfor mycket almindeligt i de förste par år at have cyklusser, der ar kortere, längere eller med ujävne intervaller.',
    body2: 'Det kan tage et till to år, sommetider lite mere, for cyklussen at blive mere regelmässig. Denne tilpasningsperiode varierer mycket fran person till person, och det ar inte et problem.',
    tip1Title: 'Godt at vide',
    tip1Text: 'En uregelmässig cyklus i starten betragtes aldrig som "forsinket": din krop tager bare den tid, den har brug for.',
    body3: 'I de fleste tilfälde ar der intet at bekymre sig om. Men hvis menstruationen stopper i et par måneder efter din förste cyklus, eller du löbende ar i tvivl, ar det en god idé at gå till lägen.',
    alertTitle: 'Gå till lägen hvis',
    alertText: 'Menstruationen udebliver i et par måneder, smerten ar mycket kraftig, eller blödningen ar mycket kraftig.',
    relatedTitle: '♥  Du vil måske også synes om',
    related: [
      {
        title: 'Regelmässig eller uregelmässig cyklus: hvad ar forskellen?',
        meta: '5 min  ·  Guide',
      },
      {
        title: 'Din förste menstruation: hvad du kan forvente',
        meta: '5 min  ·  Guide',
      },
      {
        title: 'Hyppige spörgsmål om den förste menstruation',
        meta: '4 min  ·  FAQ',
      },
    ],
    shareMessage: 'Min tidlige menstruation ar uregelmässig: ar det normalt? — AWA',
  },
  nb: {
    badge: 'FØRSTE MENS',
    title: 'Den første mensen min er\nuregelmessig: er det normalt?',
    metaDuration: '5 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Ja, det er helt normalt. Her er hvorfor syklusen trenger tid på å falle til ro, og når det er verdt å snakke om det.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hvorfor syklusen er uregelmessig i begynnelsen',
      'Hvor lang tid det tar å falle til ro',
      'Når du bør gå til lege',
    ],
    body1: 'Hormonene som regulerer syklusen trenger tid på å finne balansen. Det er derfor vanlig at syklusene er kortere, lengre eller ujevnt fordelt de første årene.',
    body2: 'Det kan ta ett til to år, noen ganger litt mer, før syklusen blir mer regelmessig. Denne tilpasningsperioden varierer mye fra person til person, uten at det er et problem.',
    tip1Title: 'Godt å vite',
    tip1Text: 'En uregelmessig syklus i begynnelsen regnes aldri som en forsinkelse: kroppen din tar bare den tiden den trenger.',
    body3: 'I de aller fleste tilfeller er det ikke noe å bekymre seg for. Likevel er det lurt å gå til lege hvis mensen uteblir i flere måneder etter at den først kom, eller hvis du har vedvarende tvil.',
    alertTitle: 'Gå til lege hvis',
    alertText: 'Ingen mens på flere måneder, svært sterke smerter eller svært kraftig blødning.',
    relatedTitle: '♥  Dette liker du kanskje også',
    related: [
      {title: 'Regelmessig eller uregelmessig syklus: hva er forskjellen?', meta: '5 min  ·  Veiledning'},
      {title: 'Din første mens: hva du kan forvente', meta: '5 min  ·  Veiledning'},
      {title: 'Ofte stilte spørsmål om den første mensen', meta: '4 min  ·  Vanlige spørsmål'},
    ],
    shareMessage: 'Den første mensen min er uregelmessig: er det normalt? – AWA',
  },
  pl: {
    badge: 'PIERWSZA MIESIĄCZKA',
    title: 'Moja pierwsza miesiączka jest\nnieregularna: czy to normalne?',
    metaDuration: '5 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Tak, to całkowicie normalne. Oto dlaczego cykl potrzebuje czasu, by się ustabilizować, i kiedy warto o tym porozmawiać.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Dlaczego cykl na początku jest nieregularny',
      'Ile trwa stabilizacja',
      'Kiedy zgłosić się do lekarza',
    ],
    body1: 'Hormony regulujące cykl potrzebują czasu, by znaleźć równowagę. Dlatego w pierwszych latach często zdarzają się cykle krótsze, dłuższe lub nierówno rozłożone.',
    body2: 'Cykl może potrzebować od roku do dwóch lat, czasem trochę dłużej, by stać się bardziej regularny. Ten okres dostosowania bardzo różni się u poszczególnych osób i nie jest problemem.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Nieregularny cykl na początku nigdy nie jest uznawany za opóźnienie: Twoje ciało po prostu potrzebuje tyle czasu, ile mu trzeba.',
    body3: 'W zdecydowanej większości przypadków nie ma powodów do niepokoju. Warto jednak zgłosić się do lekarza, jeśli miesiączka nie pojawia się przez kilka miesięcy po pierwszej lub jeśli masz uporczywe wątpliwości.',
    alertTitle: 'Zgłoś się do lekarza, jeśli',
    alertText: 'Brak miesiączki przez kilka miesięcy, bardzo silny ból lub bardzo obfite krwawienie.',
    relatedTitle: '♥  Może Cię też zainteresować',
    related: [
      {title: 'Cykl regularny czy nieregularny: jaka jest różnica?', meta: '5 min  ·  Poradnik'},
      {title: 'Twoja pierwsza miesiączka: czego się spodziewać', meta: '5 min  ·  Poradnik'},
      {title: 'Najczęściej zadawane pytania o pierwszą miesiączkę', meta: '4 min  ·  FAQ'},
    ],
    shareMessage: 'Moja pierwsza miesiączka jest nieregularna: czy to normalne? — AWA',
  },
  uk: {
    badge: 'ПЕРША МЕНСТРУАЦІЯ',
    title: 'Моя перша менструація\nнерегулярна: це нормально?',
    metaDuration: '5 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Так, це цілком нормально. Ось чому циклу потрібен час, щоб налагодитися, і коли варто про це поговорити.',
    contentsTitle: 'У цій статті',
    topics: [
      'Чому спочатку цикл нерегулярний',
      'Скільки часу потрібно, щоб він налагодився',
      'Коли звернутися до лікаря',
    ],
    body1: 'Гормонам, що регулюють цикл, потрібен час, щоб знайти баланс. Тому в перші роки часто трапляються цикли коротші, довші або нерівномірно розподілені.',
    body2: 'Циклу може знадобитися від одного до двох років, іноді трохи більше, щоб стати регулярнішим. Цей період пристосування дуже різний в різних людей і не є проблемою.',
    tip1Title: 'Варто знати',
    tip1Text: 'Нерегулярний цикл спочатку ніколи не вважається запізненням: ваше тіло просто потребує стільки часу, скільки йому потрібно.',
    body3: 'У переважній більшості випадків турбуватися нема про що. Проте варто звернутися до лікаря, якщо менструація відсутня кілька місяців після першої або якщо у вас є постійні сумніви.',
    alertTitle: 'Зверніться до лікаря, якщо',
    alertText: 'Немає менструації кілька місяців, дуже сильний біль або дуже рясна кровотеча.',
    relatedTitle: '♥  Вас також може зацікавити',
    related: [
      {title: 'Регулярний чи нерегулярний цикл: у чому різниця?', meta: '5 хв  ·  Посібник'},
      {title: 'Ваша перша менструація: чого очікувати', meta: '5 хв  ·  Посібник'},
      {title: 'Поширені запитання про першу менструацію', meta: '4 хв  ·  Запитання'},
    ],
    shareMessage: 'Моя перша менструація нерегулярна: це нормально? — AWA',
  },
  cs: {
    badge: 'PRVNÍ MENSTRUACE',
    title: 'Moje první menstruace jsou\nnepravidelné: je to normální?',
    metaDuration: '5 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Ano, je to zcela normální. Zde je vysvětlení, proč cyklu trvá, než se ustálí, a kdy stojí za to o tom mluvit.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Proč je cyklus zpočátku nepravidelný',
      'Jak dlouho trvá, než se ustálí',
      'Kdy navštívit lékaře',
    ],
    body1: 'Hormony, které cyklus řídí, potřebují čas, aby našly rovnováhu. Je proto běžné, že jsou cykly v prvních letech kratší, delší nebo nerovnoměrně rozložené.',
    body2: 'Cyklu může trvat rok až dva, někdy o něco déle, než se zpravidelní. Toto období přizpůsobení se u každé dívky velmi liší, aniž by to byl problém.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Nepravidelný cyklus na začátku se nikdy nepovažuje za zpoždění: vaše tělo si prostě bere čas, který potřebuje.',
    body3: 'Ve velké většině případů není důvod k obavám. Přesto je dobré navštívit lékaře, pokud menstruace několik měsíců po prvním objevení chybí nebo pokud máte trvalé pochybnosti.',
    alertTitle: 'Navštivte lékaře, pokud',
    alertText: 'Menstruace chybí několik měsíců, máte velmi intenzivní bolest nebo velmi silné krvácení.',
    relatedTitle: '♥  Mohlo by se vám líbit',
    related: [
      {title: 'Pravidelný, nebo nepravidelný cyklus: v čem je rozdíl?', meta: '5 min  ·  Průvodce'},
      {title: 'Vaše první menstruace: co očekávat', meta: '5 min  ·  Průvodce'},
      {title: 'Často kladené otázky o první menstruaci', meta: '4 min  ·  Časté dotazy'},
    ],
    shareMessage: 'Moje první menstruace jsou nepravidelné: je to normální? — AWA',
  },
  sk: {
    badge: 'PRVÁ MENŠTRUÁCIA',
    title: 'Moja prvá menštruácia je\nnepravidelná: je to normálne?',
    metaDuration: '5 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Áno, je to úplne normálne. Tu je dôvod, prečo cyklu trvá, kým sa ustáli, a kedy stojí za to o tom hovoriť.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Prečo je cyklus spočiatku nepravidelný',
      'Ako dlho trvá, kým sa ustáli',
      'Kedy navštíviť lekára',
    ],
    body1: 'Hormóny, ktoré regulujú cyklus, potrebujú čas, aby našli rovnováhu. Preto je bežné, že cykly sú počas prvých rokov kratšie, dlhšie alebo nerovnomerne rozložené.',
    body2: 'Cyklu môže trvať jeden až dva roky, niekedy trochu viac, kým sa stane pravidelnejším. Toto obdobie prispôsobovania sa u každej líši, bez toho, aby to bol problém.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Spočiatku nepravidelný cyklus sa nikdy nepovažuje za meškanie: vaše telo si jednoducho berie čas, ktorý potrebuje.',
    body3: 'Vo veľkej väčšine prípadov niet dôvodu na obavy. Napriek tomu je dobré navštíviť lekára, ak menštruácia chýba niekoľko mesiacov po tom, čo sa prvýkrát objavila, alebo ak máte pretrvávajúce pochybnosti.',
    alertTitle: 'Navštívte lekára, ak',
    alertText: 'Menštruácia chýba niekoľko mesiacov, bolesť je veľmi silná alebo krvácanie veľmi silné.',
    relatedTitle: '♥  Mohlo by sa vám páčiť',
    related: [
      {title: 'Pravidelný alebo nepravidelný cyklus: aký je rozdiel?', meta: '5 min  ·  Sprievodca'},
      {title: 'Vaša prvá menštruácia: čo očakávať', meta: '5 min  ·  Sprievodca'},
      {title: 'Často kladené otázky o prvej menštruácii', meta: '4 min  ·  Často kladené otázky'},
    ],
    shareMessage: 'Moja prvá menštruácia je nepravidelná: je to normálne? — AWA',
  },
  hu: {
    badge: 'AZ ELSŐ MENSTRUÁCIÓ',
    title: 'Az első menstruációm\nszabálytalan: ez normális?',
    metaDuration: '5 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Igen, ez teljesen normális. Íme, miért tart idő, mire a ciklus beáll, és mikor érdemes beszélni róla.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Miért szabálytalan a ciklus az elején',
      'Mennyi idő alatt áll be',
      'Mikor menj orvoshoz',
    ],
    body1: 'A ciklust szabályozó hormonoknak időre van szükségük az egyensúly megtalálásához. Ezért gyakori, hogy az első néhány évben a ciklusok rövidebbek, hosszabbak vagy egyenlőtlenül elosztottak.',
    body2: 'A ciklus beállásához egy-két évre, néha kicsit többre is szükség lehet. Ez az alkalmazkodási időszak nőnként nagyon eltérő, anélkül, hogy ez probléma lenne.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'A kezdetben szabálytalan ciklust soha nem tekintik késésnek: a tested egyszerűen megvárja azt az időt, amire szüksége van.',
    body3: 'A legtöbb esetben nincs ok aggodalomra. Ennek ellenére érdemes orvoshoz fordulni, ha a menstruáció első megjelenése után több hónapig elmarad, vagy ha tartós kétségeid vannak.',
    alertTitle: 'Fordulj orvoshoz, ha',
    alertText: 'Több hónapig nincs menstruáció, nagyon erős a fájdalom, vagy nagyon erős a vérzés.',
    relatedTitle: '♥  Ez is tetszhet',
    related: [
      {title: 'Rendszeres vagy szabálytalan ciklus: mi a különbség?', meta: '5 perc  ·  Útmutató'},
      {title: 'Az első menstruációd: mire számíts', meta: '5 perc  ·  Útmutató'},
      {title: 'Gyakran ismételt kérdések az első menstruációról', meta: '4 perc  ·  GYIK'},
    ],
    shareMessage: 'Az első menstruációm szabálytalan: ez normális? — AWA',
  },
  ro: {
    badge: 'PRIMA MENSTRUAȚIE',
    title: 'Prima mea menstruație este\nneregulată: este normal?',
    metaDuration: '5 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Da, este complet normal. Iată de ce ciclului îi ia timp să se stabilizeze și când merită să vorbești despre asta.',
    contentsTitle: 'În acest articol',
    topics: [
      'De ce ciclul este neregulat la început',
      'Cât durează până se stabilizează',
      'Când să mergi la medic',
    ],
    body1: 'Hormonii care reglează ciclul au nevoie de timp pentru a-și găsi echilibrul. De aceea este frecvent ca ciclurile să fie mai scurte, mai lungi sau inegal distanțate în primii ani.',
    body2: 'Ciclului îi poate lua unul până la doi ani, uneori puțin mai mult, pentru a deveni mai regulat. Această perioadă de adaptare variază mult de la o persoană la alta, fără să fie o problemă.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Un ciclu neregulat la început nu este niciodată considerat o întârziere: corpul tău își ia pur și simplu timpul de care are nevoie.',
    body3: 'În marea majoritate a cazurilor, nu este niciun motiv de îngrijorare. Cu toate acestea, este bine să mergi la medic dacă menstruația lipsește mai multe luni după prima apariție sau dacă ai îndoieli persistente.',
    alertTitle: 'Mergi la medic dacă',
    alertText: 'Nu ai menstruație timp de mai multe luni, ai dureri foarte intense sau sângerări foarte abundente.',
    relatedTitle: '♥  Ți-ar putea plăcea și',
    related: [
      {title: 'Ciclu regulat sau neregulat: care este diferența?', meta: '5 min  ·  Ghid'},
      {title: 'Prima ta menstruație: la ce să te aștepți', meta: '5 min  ·  Ghid'},
      {title: 'Întrebări frecvente despre prima menstruație', meta: '4 min  ·  Întrebări frecvente'},
    ],
    shareMessage: 'Prima mea menstruație este neregulată: este normal? — AWA',
  },
  bg: {
    badge: 'ПЪРВА МЕНСТРУАЦИЯ',
    title: 'Първата ми менструация е\nнередовна: нормално ли е?',
    metaDuration: '5 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Да, това е напълно нормално. Ето защо на цикъла му е нужно време да се установи и кога си струва да говориш за това.',
    contentsTitle: 'В тази статия',
    topics: [
      'Защо цикълът е нередовен в началото',
      'Колко време отнема да се установи',
      'Кога да отидеш на лекар',
    ],
    body1: 'Хормоните, които регулират цикъла, имат нужда от време, за да намерят баланса си. Затова е често циклите през първите няколко години да са по-къси, по-дълги или неравномерно разположени.',
    body2: 'На цикъла му може да отнеме от една до две години, понякога малко повече, за да стане по-редовен. Този период на приспособяване варира много от човек на човек, без да е проблем.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Нередовният цикъл в началото никога не се счита за закъснение: тялото ти просто си взема нужното време.',
    body3: 'В огромното мнозинство от случаите няма за какво да се тревожиш. Въпреки това е добре да отидеш на лекар, ако менструацията ти отсъства няколко месеца след първата ѝ поява или ако имаш упорити съмнения.',
    alertTitle: 'Иди на лекар, ако',
    alertText: 'Няма менструация няколко месеца, имаш много силна болка или много обилно кървене.',
    relatedTitle: '♥  Може да ти хареса и',
    related: [
      {title: 'Редовен или нередовен цикъл: каква е разликата?', meta: '5 мин  ·  Ръководство'},
      {title: 'Първата ти менструация: какво да очакваш', meta: '5 мин  ·  Ръководство'},
      {title: 'Често задавани въпроси за първата менструация', meta: '4 мин  ·  Чести въпроси'},
    ],
    shareMessage: 'Първата ми менструация е нередовна: нормално ли е? — AWA',
  },
  sr: {
    badge: 'ПРВА МЕНСТРУАЦИЈА',
    title: 'Моја прва менструација је\nнеправилна: да ли је то нормално?',
    metaDuration: '5 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Да, то је потпуно нормално. Ево зашто је циклусу потребно време да се устали и када вреди разговарати о томе.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Зашто је циклус на почетку неправилан',
      'Колико траје док се устали',
      'Када посетити лекара',
    ],
    body1: 'Хормонима који регулишу циклус треба времена да пронађу равнотежу. Зато је уобичајено да циклуси буду краћи, дужи или неравномерно размакнути током првих неколико година.',
    body2: 'Циклусу може требати једна до две године, понекад и нешто више, да постане правилнији. Овај период прилагођавања увелико варира од особе до особе, а да то не буде проблем.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Неправилан циклус на почетку се никада не сматра кашњењем: твоје тело једноставно узима време које му је потребно.',
    body3: 'У огромној већини случајева нема разлога за бригу. Ипак, добро је посетити лекара ако ти менструација изостане неколико месеци након што се први пут појави или ако имаш трајне сумње.',
    alertTitle: 'Посети лекара ако',
    alertText: 'Нема менструације неколико месеци, имаш веома јак бол или веома обилно крварење.',
    relatedTitle: '♥  Можда ће ти се свидети и',
    related: [
      {title: 'Редовни или нередовни циклус: каква је разлика?', meta: '5 мин  ·  Водич'},
      {title: 'Твоја прва менструација: шта да очекујеш', meta: '5 мин  ·  Водич'},
      {title: 'Често постављана питања о првој менструацији', meta: '4 мин  ·  Честа питања'},
    ],
    shareMessage: 'Моја прва менструација је неправилна: да ли је то нормално? — AWA',
  },
  hr: {
    badge: 'PRVA MENSTRUACIJA',
    title: 'Moja prva menstruacija je\nnepravilna: je li to normalno?',
    metaDuration: '5 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Da, to je potpuno normalno. Evo zašto ciklusu treba vremena da se ustali i kada je vrijedno o tome razgovarati.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Zašto je ciklus na početku nepravilan',
      'Koliko mu treba da se ustali',
      'Kada posjetiti liječnika',
    ],
    body1: 'Hormonima koji reguliraju ciklus treba vremena da pronađu ravnotežu. Stoga je uobičajeno da ciklusi tijekom prvih nekoliko godina budu kraći, dulji ili nejednako razmaknuti.',
    body2: 'Ciklusu može trebati jedna do dvije godine, ponekad i nešto više, da postane pravilniji. To razdoblje prilagodbe jako se razlikuje od osobe do osobe, a da to nije problem.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Nepravilan ciklus na početku nikad se ne smatra kašnjenjem: tvoje tijelo jednostavno uzima vrijeme koje mu treba.',
    body3: 'U velikoj većini slučajeva nema razloga za zabrinutost. Ipak, dobro je posjetiti liječnika ako menstruacije nema nekoliko mjeseci nakon što se prvi put pojavila ili ako imaš trajne nedoumice.',
    alertTitle: 'Posjeti liječnika ako',
    alertText: 'Nema menstruacije nekoliko mjeseci, imaš vrlo jaku bol ili vrlo obilno krvarenje.',
    relatedTitle: '♥  Moglo bi ti se svidjeti',
    related: [
      {title: 'Pravilan ili nepravilan ciklus: u čemu je razlika?', meta: '5 min  ·  Vodič'},
      {title: 'Tvoja prva menstruacija: što očekivati', meta: '5 min  ·  Vodič'},
      {title: 'Često postavljana pitanja o prvoj menstruaciji', meta: '4 min  ·  Česta pitanja'},
    ],
    shareMessage: 'Moja prva menstruacija je nepravilna: je li to normalno? — AWA',
  },
  bs: {
    badge: 'PRVA MENSTRUACIJA',
    title: 'Moja prva menstruacija je\nnepravilna: je li to normalno?',
    metaDuration: '5 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Da, to je potpuno normalno. Evo zašta ciklusu treba vremena da se ustali i kada je vrijedno o tome razgovarati.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Zašta je ciklus na početku nepravilan',
      'Koliko mu treba da se ustali',
      'Kada posjetiti ljekara',
    ],
    body1: 'Hormonima koji reguliraju ciklus treba vremena da pronađu ravnotežu. Stoga je uobičajeno da ciklusi tokom prvih nekoliko godina budu kraći, dulji ili nejednako razmaknuti.',
    body2: 'Ciklusu može trebati jedna do dvije godine, ponekad i nešta više, da postane pravilniji. To razdoblje prilagodbe jako se razlikuje od osobe do osobe, a da to nije problem.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Nepravilan ciklus na početku nikad se ne smatra kašnjenjem: tvoje tijelo jednostavno uzima vrijeme koje mu treba.',
    body3: 'U velikoj većini slučajeva nema razloga za zabrinutost. Ipak, dobro je posjetiti ljekara ako menstruacije nema nekoliko mjeseci nakon što se prvi put pojavila ili ako imaš trajne nedoumice.',
    alertTitle: 'Posjeti ljekara ako',
    alertText: 'Nema menstruacije nekoliko mjeseci, imaš vrlo jaku bol ili vrlo obilno krvarenje.',
    relatedTitle: '♥  Moglo bi ti se svidjeti',
    related: [
      {title: 'Pravilan ili nepravilan ciklus: u čemu je razlika?', meta: '5 min  ·  Vodič'},
      {title: 'Tvoja prva menstruacija: što očekivati', meta: '5 min  ·  Vodič'},
      {title: 'Često postavljana pitanja o prvoj menstruaciji', meta: '4 min  ·  Česta pitanja'},
    ],
    shareMessage: 'Moja prva menstruacija je nepravilna: je li to normalno? — AWA',
  },
  sl: {
    badge: 'PRVA MENSTRUACIJA',
    title: 'Moja prva menstruacija je\nneredna: je to normalno?',
    metaDuration: '5 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Da, to je povsem normalno. Tu je, zakaj ciklu traja, da se ustali, in kdaj je vredno o tem govoriti.',
    contentsTitle: 'V tem članku',
    topics: [
      'Zakaj je cikel na začetku nereden',
      'Koliko časa traja, da se ustali',
      'Kdaj obiskati zdravnika',
    ],
    body1: 'Hormonom, ki uravnavajo cikel, je treba časa, da najdejo ravnovesje. Zato je običajno, da so cikli v prvih nekaj letih krajši, daljši ali neenakomerno razmaknjeni.',
    body2: 'Ciklu lahko traja eno do dve leti, včasih tudi nekaj več, da postane bolj reden. To obdobje prilagoditve se zelo razlikuje od osebe do osebe, ne da bi bilo to težava.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Nereden cikel na začetku se nikoli ne šteje za zamudo: tvoje telo preprosto vzame čas, ki ga potrebuje.',
    body3: 'V veliki večini primerov ni razloga za zaskrbljenost. Kljub temu je dobro obiskati zdravnika, če menstruacije ni več mesecev, potem ko se je prvič pojavila, ali če imaš trajne dvome.',
    alertTitle: 'Obišči zdravnika, če',
    alertText: 'Menstruacije ni več mesecev, imaš zelo hudo bolečino ali zelo obilno krvavitev.',
    relatedTitle: '♥  Morda ti bo všeč tudi',
    related: [
      {title: 'Reden ali nereden cikel: v čem je razlika?', meta: '5 min  ·  Vodnik'},
      {title: 'Tvoja prva menstruacija: kaj pričakovati', meta: '5 min  ·  Vodnik'},
      {title: 'Pogosto zastavljena vprašanja o prvi menstruaciji', meta: '4 min  ·  Pogosta vprašanja'},
    ],
    shareMessage: 'Moja prva menstruacija je neredna: je to normalno? — AWA',
  },
  ne: {
    badge: 'पहिलो महिनावारी',
    title: 'मेरो पहिलो महिनावारी\nअनियमित छ: के यो सामान्य हो?',
    metaDuration: '5 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'हो, यो पूर्ण रूपमा सामान्य हो। चक्र स्थिर हुन किन समय लाग्छ, र कहिले कुरा गर्न लायक हुन्छ, यहाँ छ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'सुरुमा चक्र किन अनियमित हुन्छ',
      'स्थिर हुन कति समय लाग्छ',
      'चिकित्सकलाई कहिले देखाउने',
    ],
    body1: 'चक्रलाई नियमन गर्ने हर्मोनहरूलाई सन्तुलन भेट्टाउन समय लाग्छ। त्यसैले पहिलो केही वर्ष चक्रहरू छोटा, लामा वा असमान दूरीमा हुनु सामान्य हो।',
    body2: 'चक्र बढी नियमित हुन एकदेखि दुई वर्ष, कहिलेकाहीँ अलिक बढी समय लाग्न सक्छ। यो समायोजन अवधि व्यक्तिपिच्छे निकै फरक हुन्छ, यो समस्या नभई।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'सुरुमा अनियमित चक्रलाई कहिल्यै ढिलाइ मानिँदैन: तपाईंको शरीरले आवश्यक समय मात्र लिइरहेको हुन्छ।',
    body3: 'अधिकांश अवस्थामा चिन्ता गर्नुपर्ने केही हुँदैन। यद्यपि, महिनावारी पहिलो पटक देखिएपछि धेरै महिनासम्म नआएमा, वा लगातार शङ्का भएमा चिकित्सकलाई देखाउनु राम्रो हुन्छ।',
    alertTitle: 'यस्तो भए चिकित्सकलाई देखाउनुहोस्',
    alertText: 'धेरै महिनासम्म महिनावारी नआउनु, निकै तीव्र दुखाइ, वा निकै धेरै रक्तस्राव।',
    relatedTitle: '♥  तपाईंलाई यी पनि मन पर्न सक्छन्',
    related: [
      {title: 'नियमित वा अनियमित चक्र: के फरक छ?', meta: '5 मिनेट  ·  मार्गदर्शन'},
      {title: 'तपाईंको पहिलो महिनावारी: के अपेक्षा गर्ने', meta: '5 मिनेट  ·  मार्गदर्शन'},
      {title: 'पहिलो महिनावारीबारे बारम्बार सोधिने प्रश्नहरू', meta: '4 मिनेट  ·  बारम्बार सोधिने प्रश्न'},
    ],
    shareMessage: 'मेरो पहिलो महिनावारी अनियमित छ: के यो सामान्य हो? — AWA',
  },
  si: {
    badge: 'පළමු ඔසප්',
    title: 'මගේ පළමු ඔසප් අක්‍රමවත්:\nඑය සාමාන්‍යද?',
    metaDuration: 'කියවීමට මිනිත්තු 5',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඔව්, එය සම්පූර්ණයෙන්ම සාමාන්‍යයි. චක්‍රය ස්ථාවර වීමට කාලය ගත වන්නේ ඇයි, සහ ඒ ගැන කතා කිරීම වටින්නේ කවදාද යන්න මෙන්න.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'මුලදී චක්‍රය අක්‍රමවත් වන්නේ ඇයි',
      'ස්ථාවර වීමට කොපමණ කාලයක් ගතවේද',
      'වෛද්‍යවරයෙකු හමුවිය යුත්තේ කවදාද',
    ],
    body1: 'චක්‍රය නියාමනය කරන හෝමෝනවලට තම සමතුලිතතාව සොයාගැනීමට කාලය ගතවේ. එබැවින් පළමු වසර කිහිපය තුළ චක්‍ර කෙටි, දිගු, හෝ අසමාන ලෙස පරතරයක් ඇති වීම සාමාන්‍යයි.',
    body2: 'චක්‍රය වඩා නිතිපතා වීමට වසර එකක සිට දෙකක් දක්වා, සමහර විට ඊට ටිකක් වැඩියෙන් ගත විය හැක. මෙම සකස් වීමේ කාලය පුද්ගලයාගෙන් පුද්ගලයාට බොහෝ සේ වෙනස් වන අතර, එය ගැටලුවක් නොවේ.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'මුලදී අක්‍රමවත් චක්‍රයක් කිසිවිටෙකත් ප්‍රමාදයක් ලෙස නොසැලකේ: ඔබේ ශරීරය අවශ්‍ය කාලය ගනිමින් සිටී.',
    body3: 'බහුතර අවස්ථාවලදී, කනස්සල්ලට කරුණක් නැත. එසේ වුවද, ඔබේ ඔසප් පළමුව දිස්වී මාස කිහිපයක් නොපැමිණෙන්නේ නම්, හෝ ඔබට දිගටම සැකයක් ඇත්නම්, වෛද්‍යවරයෙකු හමුවීම හොඳ අදහසකි.',
    alertTitle: 'මෙසේ නම් වෛද්‍යවරයෙකු හමුවන්න',
    alertText: 'මාස කිහිපයක් ඔසප් නැත, ඉතා දැඩි වේදනාව, හෝ ඉතා වැඩි ලේ ගැලීම.',
    relatedTitle: '♥  ඔබට මෙයද වුවමනා විය හැක',
    related: [
      {title: 'නිතිපතා හෝ අක්‍රමවත් චක්‍රය: වෙනස කුමක්ද?', meta: 'මිනි. 5  ·  මාර්ගෝපදේශය'},
      {title: 'ඔබේ පළමු ඔසප්: අපේක්ෂා කළ යුත්තේ කුමක්ද', meta: 'මිනි. 5  ·  මාර්ගෝපදේශය'},
      {title: 'ඔබේ පළමු ඔසප් ගැන නිතර අසන ප්‍රශ්න', meta: 'මිනි. 4  ·  නිති අසන ප්‍රශ්න'},
    ],
    shareMessage: 'මගේ පළමු ඔසප් අක්‍රමවත්: එය සාමාන්‍යද? — AWA',
  },
  th: {
    badge: 'ประจำเดือนครั้งแรก',
    title: 'ประจำเดือนครั้งแรกของฉัน\nไม่สม่ำเสมอ ปกติไหม?',
    metaDuration: 'อ่าน 5 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ใช่ เป็นเรื่องปกติอย่างสมบูรณ์ นี่คือเหตุผลที่รอบเดือนต้องใช้เวลาจึงเข้าที่ และเมื่อไรที่ควรพูดคุยเรื่องนี้',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ทำไมรอบเดือนจึงไม่สม่ำเสมอในช่วงแรก',
      'ใช้เวลานานแค่ไหนจึงเข้าที่',
      'เมื่อไรควรพบแพทย์',
    ],
    body1: 'ฮอร์โมนที่ควบคุมรอบเดือนต้องใช้เวลาหาสมดุล จึงเป็นเรื่องปกติที่รอบเดือนจะสั้นลง ยาวขึ้น หรือห่างไม่เท่ากันในช่วงไม่กี่ปีแรก',
    body2: 'รอบเดือนอาจใช้เวลาหนึ่งถึงสองปี บางครั้งมากกว่านั้นเล็กน้อย จึงจะสม่ำเสมอขึ้น ช่วงปรับตัวนี้แตกต่างกันมากในแต่ละคน โดยไม่ได้เป็นปัญหา',
    tip1Title: 'ควรรู้',
    tip1Text: 'รอบเดือนที่ไม่สม่ำเสมอในช่วงแรกไม่เคยถือว่ามาช้า: ร่างกายของคุณเพียงแค่ใช้เวลาที่ต้องการ',
    body3: 'ในกรณีส่วนใหญ่ ไม่มีอะไรต้องกังวล อย่างไรก็ตาม ควรพบแพทย์หากประจำเดือนขาดหายไปหลายเดือนหลังจากมาครั้งแรก หรือหากมีความสงสัยต่อเนื่อง',
    alertTitle: 'พบแพทย์หาก',
    alertText: 'ไม่มีประจำเดือนหลายเดือน ปวดรุนแรงมาก หรือเลือดออกมากผิดปกติ',
    relatedTitle: '♥  คุณอาจสนใจ',
    related: [
      {title: 'รอบเดือนสม่ำเสมอหรือไม่สม่ำเสมอ: ต่างกันอย่างไร?', meta: '5 นาที  ·  คู่มือ'},
      {title: 'ประจำเดือนครั้งแรกของคุณ: สิ่งที่คาดหวังได้', meta: '5 นาที  ·  คู่มือ'},
      {title: 'คำถามที่พบบ่อยเกี่ยวกับประจำเดือนครั้งแรก', meta: '4 นาที  ·  คำถามที่พบบ่อย'},
    ],
    shareMessage: 'ประจำเดือนครั้งแรกของฉันไม่สม่ำเสมอ ปกติไหม? — AWA',
  },
  vi: {
    badge: 'KỲ KINH ĐẦU TIÊN',
    title: 'Kỳ kinh đầu tiên của tôi\nkhông đều: có bình thường không?',
    metaDuration: '5 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Có, điều đó hoàn toàn bình thường. Đây là lý do chu kỳ cần thời gian để ổn định và khi nào nên nói chuyện về điều đó.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Tại sao lúc đầu chu kỳ không đều',
      'Mất bao lâu để ổn định',
      'Khi nào nên đi khám bác sĩ',
    ],
    body1: 'Các hormone điều hòa chu kỳ cần thời gian để tìm được sự cân bằng. Vì vậy, chu kỳ ngắn hơn, dài hơn hoặc cách nhau không đều trong vài năm đầu là điều thường gặp.',
    body2: 'Chu kỳ có thể mất từ một đến hai năm, đôi khi lâu hơn một chút, để trở nên đều hơn. Giai đoạn điều chỉnh này khác nhau rất nhiều giữa từng người, và đó không phải là vấn đề.',
    tip1Title: 'Nên biết',
    tip1Text: 'Chu kỳ không đều lúc ban đầu không bao giờ bị coi là chậm kinh: cơ thể bạn chỉ đang dành thời gian cần thiết.',
    body3: 'Trong đại đa số trường hợp, không có gì đáng lo. Tuy vậy, nên đi khám bác sĩ nếu kỳ kinh vắng mặt nhiều tháng sau khi xuất hiện lần đầu, hoặc nếu bạn vẫn còn nghi ngờ.',
    alertTitle: 'Hãy đi khám bác sĩ nếu',
    alertText: 'Không có kinh trong nhiều tháng, đau rất dữ dội hoặc ra máu rất nhiều.',
    relatedTitle: '♥  Có thể bạn cũng thích',
    related: [
      {title: 'Chu kỳ đều hay không đều: khác nhau thế nào?', meta: '5 phút  ·  Hướng dẫn'},
      {title: 'Kỳ kinh đầu tiên của bạn: điều cần biết', meta: '5 phút  ·  Hướng dẫn'},
      {title: 'Câu hỏi thường gặp về kỳ kinh đầu tiên', meta: '4 phút  ·  Câu hỏi thường gặp'},
    ],
    shareMessage: 'Kỳ kinh đầu tiên của tôi không đều: có bình thường không? — AWA',
  },
  uz: {
    badge: 'BIRINCHI HAYZ',
    title: 'Birinchi hayzim\nnotekis: bu normalmi?',
    metaDuration: '5 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Ha, bu mutlaqo normal. Nima uchun siklning barqarorlashishi vaqt olishi va qachon bu haqda gaplashishga arzishi haqida.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Nima uchun sikl dastlab notekis boʻladi',
      'Barqarorlashish qancha vaqt oladi',
      'Qachon shifokorga borish kerak',
    ],
    body1: 'Siklni boshqaradigan gormonlar muvozanatini topishi uchun vaqt kerak. Shuning uchun dastlabki bir necha yilda sikllar qisqaroq, uzunroq yoki notekis oraliqda kelishi odatiy hol.',
    body2: 'Siklning muntazam boʻlishi uchun bir yildan ikki yilgacha, baʼzan biroz koʻproq vaqt ketishi mumkin. Bu moslashuv davri odamdan odamga juda farq qiladi va muammo emas.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Dastlab notekis sikl hech qachon kechikish hisoblanmaydi: tanangiz shunchaki kerakli vaqtni olmoqda.',
    body3: 'Aksariyat hollarda xavotirga hech narsa yoʻq. Shunga qaramay, agar hayz birinchi marta paydo boʻlganidan keyin bir necha oy boʻlmasa yoki doimiy shubhalaringiz boʻlsa, shifokorga murojaat qilgan yaxshi.',
    alertTitle: 'Quyidagi hollarda shifokorga boring',
    alertText: 'Bir necha oy hayz boʻlmasa, juda kuchli ogʻriq yoki juda koʻp qon ketishi boʻlsa.',
    relatedTitle: '♥  Sizga yoqishi mumkin',
    related: [
      {title: 'Muntazam yoki notekis sikl: farqi nimada?', meta: '5 daq  ·  Qoʻllanma'},
      {title: 'Birinchi hayzingiz: nimalarni kutish kerak', meta: '5 daq  ·  Qoʻllanma'},
      {title: 'Birinchi hayz haqida koʻp beriladigan savollar', meta: '4 daq  ·  Savol-javob'},
    ],
    shareMessage: 'Birinchi hayzim notekis: bu normalmi? — AWA',
  },
  az: {
    badge: 'İLK AYBAŞI',
    title: 'İlk aybaşım qeyri-müntəzəmdir:\nbu normaldır?',
    metaDuration: '5 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Bəli, bu tamamilə normaldır. Dövrün nə üçün oturuşması üçün vaxt tələb etdiyini və nə vaxt bu barədə danışmağa dəyər olduğunu burada öyrənin.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Dövr nə üçün əvvəlcə qeyri-müntəzəm olur',
      'Oturuşması nə qədər vaxt aparır',
      'Nə vaxt həkimə müraciət etmək lazımdır',
    ],
    body1: 'Dövrü tənzimləyən hormonların tarazlıq tapması üçün vaxt lazımdır. Buna görə ilk illərdə dövrlərin daha qısa, daha uzun olması və ya qeyri-bərabər aralıqlarla gəlməsi adi haldır.',
    body2: 'Dövrün daha müntəzəm olması bir ilə iki il, bəzən bir az da çox çəkə bilər. Bu uyğunlaşma dövrü şəxsdən şəxsə çox dəyişir və problem demək deyil.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Əvvəlcə qeyri-müntəzəm dövr heç vaxt gecikmə hesab edilmir: bədəniniz sadəcə lazım olan vaxtı alır.',
    body3: 'Əksər hallarda narahat olmağa əsas yoxdur. Bununla belə, aybaşı ilk dəfə göründükdən sonra bir neçə ay yoxdursa və ya davamlı şübhələriniz varsa, həkimə müraciət etmək yaxşıdır.',
    alertTitle: 'Bu hallarda həkimə müraciət edin',
    alertText: 'Bir neçə ay aybaşının olmaması, çox şiddətli ağrı və ya çox bol qanaxma.',
    relatedTitle: '♥  Bunlar da xoşunuza gələ bilər',
    related: [
      {title: 'Müntəzəm və ya qeyri-müntəzəm dövr: fərq nədir?', meta: '5 dəq  ·  Bələdçi'},
      {title: 'İlk aybaşınız: nələri gözləmək olar', meta: '5 dəq  ·  Bələdçi'},
      {title: 'İlk aybaşı barədə tez-tez verilən suallar', meta: '4 dəq  ·  FAQ'},
    ],
    shareMessage: 'İlk aybaşım qeyri-müntəzəmdir: bu normaldır? — AWA',
  },
  ka: {
    badge: 'პირველი მენსტრუაცია',
    title: 'ჩემი პირველი მენსტრუაცია\nარარეგულარულია: ეს ნორმალურია?',
    metaDuration: '5 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'დიახ, ეს სრულიად ნორმალურია. აი, რატომ სჭირდება ციკლს დამკვიდრებისთვის დრო და როდის ღირს ამის შესახებ საუბარი.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რატომ არის ციკლი თავიდან არარეგულარული',
      'რამდენი ხანი სჭირდება დამკვიდრებას',
      'როდის მივმართოთ ექიმს',
    ],
    body1: 'ჰორმონებს, რომლებიც ციკლს არეგულირებს, ბალანსის მოსაძებნად დრო სჭირდება. ამიტომ ხშირია, რომ პირველი რამდენიმე წლის განმავლობაში ციკლი უფრო მოკლე, უფრო გრძელი ან არათანაბრად დაშორებული იყოს.',
    body2: 'ციკლს შეიძლება ერთი-ორი წელი, ზოგჯერ ცოტა მეტიც დასჭირდეს, რომ უფრო რეგულარული გახდეს. ეს ადაპტაციის პერიოდი ადამიანიდან ადამიანამდე ძლიერ განსხვავდება და პრობლემას არ წარმოადგენს.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'თავიდან არარეგულარული ციკლი არასდროს განიხილება დაგვიანებად: თქვენს სხეულს უბრალოდ ის დრო სჭირდება, რაც საჭიროა.',
    body3: 'შემთხვევათა აბსოლუტურ უმრავლესობაში საფიქრალი არაფერია. ამასთან, კარგია ექიმთან მისვლა, თუ მენსტრუაცია პირველი გამოჩენის შემდეგ რამდენიმე თვის განმავლობაში არ მოდის ან გაქვთ გაგრძელებული ეჭვები.',
    alertTitle: 'მიმართეთ ექიმს, თუ',
    alertText: 'მენსტრუაცია რამდენიმე თვის განმავლობაში არ მოდის, ძალიან ძლიერი ტკივილია ან ძალიან უხვი სისხლდენაა.',
    relatedTitle: '♥  შეიძლება მოგეწონოთ',
    related: [
      {title: 'რეგულარული თუ არარეგულარული ციკლი: რა არის განსხვავება?', meta: '5 წთ  ·  გზამკვლევი'},
      {title: 'თქვენი პირველი მენსტრუაცია: რას უნდა ელოდეთ', meta: '5 წთ  ·  გზამკვლევი'},
      {title: 'ხშირად დასმული კითხვები თქვენი პირველი მენსტრუაციის შესახებ', meta: '4 წთ  ·  ხშირი კითხვები'},
    ],
    shareMessage: 'ჩემი პირველი მენსტრუაცია არარეგულარულია: ეს ნორმალურია? — AWA',
  },
  hy: {
    badge: 'ԱՌԱՋԻՆ ԴԱՇՏԱՆ',
    title: 'Իմ առաջին դաշտանները\nանկանոն են. սա նորմա՞լ է',
    metaDuration: '5 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Այո, դա լիովին նորմալ է: Ահա թե ինչու է ցիկլին ժամանակ պետք կայունանալու համար և երբ արժե այդ մասին խոսել:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ինչու է ցիկլը սկզբում անկանոն',
      'Որքան ժամանակ է պետք կայունանալու համար',
      'Երբ դիմել բժշկի',
    ],
    body1: 'Ցիկլը կարգավորող հորմոններին ժամանակ է պետք՝ իրենց հավասարակշռությունը գտնելու համար: Ուստի առաջին մի քանի տարիներին տարածված է, որ ցիկլերը լինեն ավելի կարճ, ավելի երկար կամ անհավասար հեռավորությամբ:',
    body2: 'Ցիկլին կարող է մեկ-երկու տարի, երբեմն մի փոքր ավելի, պահանջվել՝ ավելի կանոնավոր դառնալու համար: Այս հարմարվողական շրջանը խիստ տարբերվում է մարդուց մարդ՝ առանց խնդիր լինելու:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Սկզբում անկանոն ցիկլը երբեք չի համարվում ուշացում. ձեր մարմինը պարզապես վերցնում է իրեն անհրաժեշտ ժամանակը:',
    body3: 'Դեպքերի ճնշող մեծամասնությունում անհանգստանալու պատճառ չկա: Այդուհանդերձ, լավ է դիմել բժշկի, եթե դաշտանը առաջին անգամ հայտնվելուց հետո բացակայում է մի քանի ամիս կամ եթե շարունակական կասկածներ ունեք:',
    alertTitle: 'Դիմեք բժշկի, եթե',
    alertText: 'Մի քանի ամիս դաշտան չկա, շատ ուժեղ ցավ կամ շատ առատ արյունահոսություն:',
    relatedTitle: '♥  Ձեզ կարող է նաև հետաքրքրել',
    related: [
      {title: 'Կանոնավոր թե անկանոն ցիկլ. ո՞րն է տարբերությունը', meta: '5 ր  ·  Ուղեցույց'},
      {title: 'Ձեր առաջին դաշտանը. ինչ սպասել', meta: '5 ր  ·  Ուղեցույց'},
      {title: 'Հաճախակի տրվող հարցեր ձեր առաջին դաշտանի մասին', meta: '4 ր  ·  ՀՏՀ'},
    ],
    shareMessage: 'Իմ առաջին դաշտանները անկանոն են. սա նորմա՞լ է — AWA',
  },
  tg: {
    badge: 'ҲАЙЗИ АВВАЛ',
    title: 'Ҳайзи аввали ман\nномунтазам аст: оё ин муқаррарӣ аст?',
    metaDuration: '5 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Бале, ин комилан муқаррарӣ аст. Инак чаро давра вақт мегирад, то устувор шавад ва кай гап задан дар ин бора сазовор аст.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Чаро давра дар аввал номунтазам аст',
      'Барои устувор шудан чӣ қадар вақт лозим аст',
      'Кай бояд ба табиб муроҷиат кард',
    ],
    body1: 'Гормонҳое, ки давраро танзим мекунанд, барои ёфтани тавозуни худ вақт мегиранд. Аз ин рӯ маъмул аст, ки давраҳо дар чанд соли аввал кӯтоҳтар, дарозтар ё номунтазам фосиладор бошанд.',
    body2: 'Барои мунтазамтар шудани давра метавонад як то ду сол, баъзан андаке бештар лозим шавад. Ин давраи мутобиқшавӣ аз шахс ба шахс хеле фарқ мекунад, бидуни он ки мушкил бошад.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Давраи дар аввал номунтазам ҳеҷ гоҳ дермонӣ ҳисоб намешавад: бадани шумо танҳо вақти заруриро мегирад.',
    body3: 'Дар аксари мутлақи ҳолатҳо чизе нест, ки нигарон кунад. Бо вуҷуди ин, хуб аст ба табиб муроҷиат кунед, агар ҳайз пас аз аввалин пайдо шуданаш чанд моҳ набошад ё шубҳаҳои идомадор дошта бошед.',
    alertTitle: 'Ба табиб муроҷиат кунед, агар',
    alertText: 'Чанд моҳ ҳайз нест, дарди хеле шадид ё хунравии хеле зиёд.',
    relatedTitle: '♥  Шояд ба шумо ҳам маъқул шавад',
    related: [
      {title: 'Давраи мунтазам ё номунтазам: фарқ дар чист?', meta: '5 дақ  ·  Роҳнамо'},
      {title: 'Ҳайзи аввали шумо: чӣ интизор шудан лозим аст', meta: '5 дақ  ·  Роҳнамо'},
      {title: 'Саволҳои зуд-зуд додашаванда дар бораи ҳайзи аввали шумо', meta: '4 дақ  ·  Саволу ҷавоб'},
    ],
    shareMessage: 'Ҳайзи аввали ман номунтазам аст: оё ин муқаррарӣ аст? — AWA',
  },
  ky: {
    badge: 'БИРИНЧИ ЕТЕК КИРИМ',
    title: 'Биринчи етек киримим\nтуура эмес: бул кадимкиби?',
    metaDuration: '5 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Ооба, бул толугу менен кадимки көрүнүш. Цикл эмне үчүн отурукташууга убакыт алат жана бул жөнүндө качан сүйлөшкөн жакшы.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Цикл башында эмне үчүн туура эмес',
      'Отурукташуу канча убакыт алат',
      'Дарыгерге качан барыш керек',
    ],
    body1: 'Циклди жөнгө салган гормондор тең салмактуулугун табууга убакыт алат. Ошондуктан алгачкы бир нече жылда циклдер кыскараак, узунураак же бирдей эмес аралыкта болушу кеңири таралган.',
    body2: 'Цикл туруктуураак болушу үчүн бир-эки жыл, кээде бир аз көбүрөөк убакыт кетиши мүмкүн. Бул ыңгайлашуу мезгили адамдан адамга абдан айырмаланат, бул көйгөй болбостон.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Башында туура эмес цикл эч качан кечигүү деп эсептелбейт: денеңиз өзүнө керектүү убакытты жөн гана алып жатат.',
    body3: 'Абдан көп учурларда тынчсыздануунун кереги жок. Ошентсе да, етек кирим биринчи жолу пайда болгондон кийин бир нече ай болбосо же дайыма күмөн болсо, дарыгерге барган жакшы.',
    alertTitle: 'Дарыгерге барыңыз, эгер',
    alertText: 'Бир нече ай етек кирим болбосо, абдан күчтүү оору же абдан көп кан кетүү болсо.',
    relatedTitle: '♥  Сизге дагы жагышы мүмкүн',
    related: [
      {title: 'Туура же туура эмес цикл: айырмасы эмнеде?', meta: '5 мүн  ·  Колдонмо'},
      {title: 'Биринчи етек кирим: эмне күтүү керек', meta: '5 мүн  ·  Колдонмо'},
      {title: 'Биринчи етек кирим боюнча көп берилүүчү суроолор', meta: '4 мүн  ·  КБС'},
    ],
    shareMessage: 'Биринчи етек киримим туура эмес: бул кадимкиби? — AWA',
  },
  tk: {
    badge: 'ILKINJI AÝBAŞY',
    title: 'Ilkinji aýbaşym\ndüzgünsiz: bu adatymy?',
    metaDuration: '5 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Hawa, bu doly adaty zat. Sikliň ornaşmagy üçin näme üçin wagt gerekdigi we haçan bu barada gürleşmäge mynasypdygy.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Sikl näme üçin başda düzgünsiz',
      'Ornaşmagy üçin näçe wagt gerek',
      'Lukmana haçan ýüz tutmaly',
    ],
    body1: 'Sikli sazlaýan gormonlar deňagramlylygyny tapmak üçin wagt talap edýär. Şonuň üçin ilkinji birnäçe ýylda sikliň gysga, uzyn ýa-da deň däl aralykly bolmagy adaty zat.',
    body2: 'Sikliň has yzygiderli bolmagy üçin bir-iki ýyl, käwagt birneme köp wagt gerek bolup biler. Bu uýgunlaşma döwri adamdan adama köp tapawutlanýar, bu kynçylyk bolmazdan.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Başdaky düzgünsiz sikl hiç haçan gijikme hasaplanmaýar: bedeniňiz diňe gerek bolan wagty alýar.',
    body3: 'Aglaba köp ýagdaýda alada üçin sebäp ýok. Şeýle-de bolsa, aýbaşyňyz ilkinji gezek peýda bolandan soň birnäçe aý bolmasa ýa-da dowamly şübheleriňiz bar bolsa, lukmana ýüz tutmak maslahat berilýär.',
    alertTitle: 'Şu ýagdaýda lukmana ýüz tutuň',
    alertText: 'Birnäçe aý aýbaşy bolmasa, gaty güýçli agyry ýa-da gaty köp gan akma bolsa.',
    relatedTitle: '♥  Size ýarap biler',
    related: [
      {title: 'Yzygiderli ýa-da düzgünsiz sikl: tapawudy näme?', meta: '5 min  ·  Gollanma'},
      {title: 'Ilkinji aýbaşyňyz: nämä garaşmaly', meta: '5 min  ·  Gollanma'},
      {title: 'Ilkinji aýbaşyňyz barada köp berilýän soraglar', meta: '4 min  ·  KBS'},
    ],
    shareMessage: 'Ilkinji aýbaşym düzgünsiz: bu adatymy? — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FirstPeriodIrregularArticleScreen({
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            1. {content.topics[0]}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body1}
          </AwaText>

          <Image
            source={require('../../assets/images/library/regular-cycle-causes.png')}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body2}
          </AwaText>

          <Image
            source={require('../../assets/images/library/regular-cycle-balance.png')}
            resizeMode="cover"
            style={styles.wideImage}
          />

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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body3}
          </AwaText>

          <Image
            source={require('../../assets/images/library/regular-cycle-consult.png')}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alertTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.alertText}
              </AwaText>
            </View>
          </AwaCard>
        </View>

        <View style={styles.relatedHeader}>
          <AwaText variant="titleMedium" emphasized>{content.relatedTitle}</AwaText>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.relatedRow}>
          {content.related.map((item, index) => (
            <AwaCard variant="filled" padding="none"
              key={item.title}
              onPress={() =>
                navigation.push('ArticleReader', {
                  articleId: RELATED_IDS[index],
                })
              }
              style={styles.relatedCard}>
              <Image
                source={resolveEditorialImage(RELATED_IMAGES[index], lang)}
                resizeMode="cover"
                style={styles.relatedImage}
              />

              <View style={styles.relatedCopy}>
                <AwaText variant="labelSmall" emphasized>
                  {item.title}
                </AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.relatedMeta}>{item.meta}</AwaText>
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
  wideImage: {
    width: '100%',
    height: 120,
    marginTop: 16,
    borderRadius: 12,
  },
  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 3},
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
