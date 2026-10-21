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
