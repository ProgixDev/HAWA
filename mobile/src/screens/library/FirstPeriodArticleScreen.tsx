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

const ID = 'firstperiod-premieres-regles';

const HERO = CYCLE_PHASES_HERO;

// Images stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these illustrations.
const TOPIC_IMAGES = [
  require('../../assets/images/first-period-calendar.png'),
  require('../../assets/images/first-period-normal.png'),
  require('../../assets/images/first-period-pad.png'),
  require('../../assets/images/first-period-care.png'),
  require('../../assets/images/first-period-support.png'),
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('FirstPeriod', {
  fr: {
    badge: 'PREMIÈRES RÈGLES',
    title: 'Tes premières règles :\nà quoi t’attendre',
    metaDuration: '5 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Ce qui est normal, ce qui rassure, et ce qu’il faut savoir.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Quand arrivent les premières règles ?',
      'Ce qui est normal',
      'Comment ça fonctionne ?',
      'Prendre soin de soi',
      'Parler et se faire soutenir',
    ],
    details: [
      {title: 'Quand arrivent les premières règles ?', text: 'Elles apparaissent le plus souvent entre 10 et 15 ans, environ deux ans après les premiers signes de la puberté.'},
      {title: 'Ce qui est tout à fait normal', text: 'Au début, les cycles peuvent être irréguliers, courts ou longs. Ton corps prend simplement le temps de trouver son rythme.'},
      {title: 'Comprendre comment ça fonctionne', text: 'Les règles durent généralement de 3 à 7 jours. Le flux et la couleur peuvent changer d’un jour à l’autre.'},
      {title: 'Prendre soin de toi', text: 'Change régulièrement de protection, lave-toi doucement et choisis des vêtements confortables pour rester à l’aise.'},
      {title: 'Parler et se faire soutenir', text: 'Tu peux en parler à ta mère, une sœur, une proche, une enseignante ou un professionnel de santé en qui tu as confiance.'},
    ],
    tip1Title: 'Bon à savoir',
    tip1Text: 'Un cycle irrégulier au début est tout à fait normal. Ton corps apprend encore à fonctionner.',
    tip2Title: 'Tu n’es pas seule',
    tip2Text: 'Chaque corps est unique. Prends le temps, sois patiente et n’hésite pas à demander de l’aide à une personne de confiance.',
    shareTitle: 'Premières règles · AWA',
    shareMessage: 'Tes premières règles : à quoi t’attendre · AWA',
  },
  en: {
    badge: 'FIRST PERIOD',
    title: 'Your first period:\nwhat to expect',
    metaDuration: '5 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'What’s normal, what’s reassuring, and what you need to know.',
    contentsTitle: 'In this article',
    topics: [
      'When does your first period arrive?',
      'What’s normal',
      'How it works',
      'Taking care of yourself',
      'Talking about it and getting support',
    ],
    details: [
      {title: 'When does your first period arrive?', text: 'It most often arrives between ages 10 and 15, about two years after the first signs of puberty.'},
      {title: 'What’s completely normal', text: 'At first, cycles can be irregular, short, or long. Your body is simply taking its time to find its rhythm.'},
      {title: 'Understanding how it works', text: 'Periods usually last 3 to 7 days. The flow and color can change from one day to the next.'},
      {title: 'Taking care of yourself', text: 'Change your protection regularly, wash gently, and choose comfortable clothing so you feel at ease.'},
      {title: 'Talking about it and getting support', text: 'You can talk to your mother, a sister, someone close to you, a teacher, or a healthcare professional you trust.'},
    ],
    tip1Title: 'Good to know',
    tip1Text: 'An irregular cycle at first is completely normal. Your body is still learning how to find its rhythm.',
    tip2Title: 'You’re not alone',
    tip2Text: 'Every body is unique. Take your time, be patient, and don’t hesitate to ask for help from someone you trust.',
    shareTitle: 'First period · AWA',
    shareMessage: 'Your first period: what to expect · AWA',
  },
  es: {
    badge: 'PRIMERA MENSTRUACIÓN',
    title: 'Tu primera menstruación:\nqué esperar',
    metaDuration: '5 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Lo que es normal, lo que tranquiliza y lo que necesitas saber.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Cuándo llega la primera menstruación?',
      'Lo que es normal',
      '¿Cómo funciona?',
      'Cuidar de ti misma',
      'Hablar de ello y sentirte apoyada',
    ],
    details: [
      {title: '¿Cuándo llega la primera menstruación?', text: 'Suele llegar entre los 10 y los 15 años, unos dos años después de los primeros signos de la pubertad.'},
      {title: 'Lo que es completamente normal', text: 'Al principio, los ciclos pueden ser irregulares, cortos o largos. Tu cuerpo simplemente se toma su tiempo para encontrar su ritmo.'},
      {title: 'Entender cómo funciona', text: 'La menstruación suele durar de 3 a 7 días. El flujo y el color pueden cambiar de un día a otro.'},
      {title: 'Cuidar de ti', text: 'Cambia tu protección con regularidad, lávate con suavidad y elige ropa cómoda para sentirte bien.'},
      {title: 'Hablar de ello y sentirte apoyada', text: 'Puedes hablar de ello con tu madre, una hermana, alguien cercano, una profesora o un profesional de la salud en quien confíes.'},
    ],
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Un ciclo irregular al principio es completamente normal. Tu cuerpo todavía está aprendiendo a encontrar su ritmo.',
    tip2Title: 'No estás sola',
    tip2Text: 'Cada cuerpo es único. Tómate tu tiempo, ten paciencia y no dudes en pedir ayuda a una persona de confianza.',
    shareTitle: 'Primera menstruación · AWA',
    shareMessage: 'Tu primera menstruación: qué esperar · AWA',
  },
  it: {
    badge: 'PRIMO CICLO',
    title: 'Il tuo primo ciclo:\ncosa aspettarti',
    metaDuration: '5 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Cosa è normale, cosa è rassicurante e cosa devi sapere.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Quando arriva il tuo primo ciclo?',
      'Cosa è normale',
      'Come funziona',
      'Prenderti cura di te',
      'Parlarne e trovare sostegno',
    ],
    details: [
      {
        title: 'Quando arriva il tuo primo ciclo?',
        text: 'Di solito arriva tra i 10 e i 15 anni, circa due anni dopo i primi segni della pubertà.',
      },
      {
        title: 'Cosa è del tutto normale',
        text: 'All’inizio i cicli possono essere irregolari, corti o lunghi. Il tuo corpo si sta semplicemente prendendo il tempo per trovare il suo ritmo.',
      },
      {
        title: 'Capire come funziona',
        text: 'Le mestruazioni durano di solito da 3 a 7 giorni. Il flusso e il colore possono cambiare da un giorno all’altro.',
      },
      {
        title: 'Prenderti cura di te',
        text: 'Cambia regolarmente l’assorbente, lavati con delicatezza e scegli vestiti comodi per sentirti a tuo agio.',
      },
      {
        title: 'Parlarne e trovare sostegno',
        text: 'Puoi parlarne con tua madre, una sorella, una persona a te vicina, un’insegnante o un professionista sanitario di cui ti fidi.',
      },
    ],
    tip1Title: 'Da sapere',
    tip1Text: 'Un ciclo irregolare all’inizio è del tutto normale. Il tuo corpo sta ancora imparando a trovare il suo ritmo.',
    tip2Title: 'Non sei sola',
    tip2Text: 'Ogni corpo è unico. Prenditi il tuo tempo, sii paziente e non esitare a chiedere aiuto a una persona di cui ti fidi.',
    shareTitle: 'Primo ciclo · AWA',
    shareMessage: 'Il tuo primo ciclo: cosa aspettarti · AWA',
  },
  tr: {
    badge: 'İLK ADET',
    title: 'İlk adetin:\nneler beklemeli',
    metaDuration: '5 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Neyin normal, neyin güven verici olduğu ve bilmen gerekenler.',
    contentsTitle: 'Bu makalede',
    topics: [
      'İlk adetin ne zaman gelir?',
      'Neyin normal olduğu',
      'Nasıl işler',
      'Kendine iyi bakmak',
      'Bunu konuşmak ve destek almak',
    ],
    details: [
      {
        title: 'İlk adetin ne zaman gelir?',
        text: 'Çoğunlukla ergenliğin ilk belirtilerinden yaklaşık iki yıl sonra, 10 ile 15 yaş arasında gelir.',
      },
      {
        title: 'Tamamen normal olanlar',
        text: 'Başlangıçta döngüler düzensiz, kısa veya uzun olabilir. Vücudun yalnızca ritmini bulmak için zaman tanıyor.',
      },
      {
        title: 'Nasıl işlediğini anlamak',
        text: 'Adetler genellikle 3 ila 7 gün sürer. Kanama miktarı ve rengi bir günden diğerine değişebilir.',
      },
      {
        title: 'Kendine iyi bakmak',
        text: 'Hijyenik ürününü düzenli olarak değiştir, nazikçe yıka ve rahat hissetmen için rahat kıyafetler seç.',
      },
      {
        title: 'Bunu konuşmak ve destek almak',
        text: 'Annenle, bir kız kardeşinle, yakınındaki biriyle, bir öğretmenle veya güvendiğin bir sağlık profesyoneliyle konuşabilirsin.',
      },
    ],
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Başlangıçta döngünün düzensiz olması tamamen normaldir. Vücudun ritmini bulmayı hâlâ öğreniyor.',
    tip2Title: 'Yalnız değilsin',
    tip2Text: 'Her vücut benzersizdir. Kendine zaman tanı, sabırlı ol ve güvendiğin birinden yardım istemekten çekinme.',
    shareTitle: 'İlk adet · AWA',
    shareMessage: 'İlk adetin: neler beklemeli · AWA',
  },
  ru: {
    badge: 'ПЕРВЫЕ МЕСЯЧНЫЕ',
    title: 'Ваши первые месячные:\nчего ожидать',
    metaDuration: '5 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Что считается нормой, что должно успокаивать и что важно знать.',
    contentsTitle: 'В этой статье',
    topics: [
      'Когда приходят первые месячные?',
      'Что считается нормой',
      'Как это происходит',
      'Забота о себе',
      'Как поговорить об этом и найти поддержку',
    ],
    details: [
      {title: 'Когда приходят первые месячные?', text: 'Чаще всего они начинаются в возрасте от 10 до 15 лет, примерно через два года после первых признаков полового созревания.'},
      {title: 'Что совершенно нормально', text: 'Сначала цикл может быть нерегулярным, коротким или длинным. Организму просто нужно время, чтобы найти свой ритм.'},
      {title: 'Как это происходит', text: 'Месячные обычно длятся от 3 до 7 дней. Обильность и цвет выделений могут меняться изо дня в день.'},
      {title: 'Забота о себе', text: 'Регулярно меняйте средства гигиены, бережно подмывайтесь и выбирайте удобную одежду, чтобы чувствовать себя спокойно.'},
      {title: 'Как поговорить об этом и найти поддержку', text: 'Вы можете поговорить с мамой, сестрой, кем-то из близких, с учителем или с врачом, которому доверяете.'},
    ],
    tip1Title: 'Полезно знать',
    tip1Text: 'Нерегулярный цикл в самом начале — совершенно нормально. Организм ещё учится находить свой ритм.',
    tip2Title: 'Вы не одни',
    tip2Text: 'Каждый организм уникален. Не торопитесь, будьте терпеливы и не стесняйтесь просить помощи у того, кому доверяете.',
    shareTitle: 'Первые месячные · AWA',
    shareMessage: 'Ваши первые месячные: чего ожидать · AWA',
  },
  de: {
    badge: 'ERSTE PERIODE',
    title: 'Deine erste Periode:\nwas dich erwartet',
    metaDuration: '5 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Was normal ist, was beruhigend ist und was du wissen solltest.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Wann kommt deine erste Periode?',
      'Was normal ist',
      'Wie es abläuft',
      'Gut für dich sorgen',
      'Darüber sprechen und Unterstützung finden',
    ],
    details: [
      {title: 'Wann kommt deine erste Periode?', text: 'Meist setzt sie zwischen 10 und 15 Jahren ein, etwa zwei Jahre nach den ersten Anzeichen der Pubertät.'},
      {title: 'Was völlig normal ist', text: 'Am Anfang kann der Zyklus unregelmäßig, kurz oder lang sein. Dein Körper braucht einfach Zeit, um seinen Rhythmus zu finden.'},
      {title: 'Verstehen, wie es abläuft', text: 'Die Periode dauert meist 3 bis 7 Tage. Stärke und Farbe der Blutung können sich von Tag zu Tag verändern.'},
      {title: 'Gut für dich sorgen', text: 'Wechsle deine Hygieneprodukte regelmäßig, wasche dich sanft und wähle bequeme Kleidung, damit du dich wohlfühlst.'},
      {title: 'Darüber sprechen und Unterstützung finden', text: 'Du kannst mit deiner Mutter, einer Schwester, einer dir nahestehenden Person, einer Lehrerin oder einem Lehrer oder mit medizinischem Fachpersonal sprechen, dem du vertraust.'},
    ],
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Ein unregelmäßiger Zyklus am Anfang ist völlig normal. Dein Körper lernt noch, seinen Rhythmus zu finden.',
    tip2Title: 'Du bist nicht allein',
    tip2Text: 'Jeder Körper ist einzigartig. Nimm dir Zeit, hab Geduld und zögere nicht, dir Hilfe bei jemandem zu holen, dem du vertraust.',
    shareTitle: 'Erste Periode · AWA',
    shareMessage: 'Deine erste Periode: was dich erwartet · AWA',
  },
  zh: {
      badge: '初潮',
      title: '你的第一次月经：\n会发生什么',
      metaDuration: '阅读约 5 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '哪些是正常的，哪些让人安心，以及你需要知道的事。',
      contentsTitle: '本文内容',
      topics: [
        '第一次月经什么时候来？',
        '什么是正常的',
        '它是如何运作的',
        '照顾好自己',
        '说出来，并获得支持',
      ],
      details: [
        {
          title: '第一次月经什么时候来？',
          text: '多数情况下出现在 10 到 15 岁之间，大约在青春期最初的迹象出现两年后。',
        },
        {
          title: '哪些是完全正常的',
          text: '刚开始时，月经周期可能不规律，时长可能偏短或偏长。你的身体只是需要一些时间来找到自己的节奏。',
        },
        {
          title: '了解它是如何运作的',
          text: '月经通常持续 3 到 7 天。经量和颜色每天都可能有所变化。',
        },
        {
          title: '照顾好自己',
          text: '定时更换卫生用品，温和地清洗，选择舒适的衣物，让自己感到自在。',
        },
        {
          title: '说出来，并获得支持',
          text: '你可以和妈妈、姐妹、身边亲近的人、老师，或你信任的医疗专业人员聊一聊。',
        },
      ],
      tip1Title: '小贴士',
      tip1Text: '刚开始时月经周期不规律是完全正常的。你的身体还在学习如何找到自己的节奏。',
      tip2Title: '你并不孤单',
      tip2Text: '每个人的身体都是独一无二的。给自己一些时间，保持耐心，也不要犹豫，向你信任的人寻求帮助。',
      shareTitle: '第一次月经 · AWA',
      shareMessage: '你的第一次月经：会发生什么 · AWA',
    },
  id: {
    badge: 'HAID PERTAMA',
    title: 'Haid pertamamu:\napa yang bisa diharapkan',
    metaDuration: '5 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Apa yang normal, apa yang menenangkan, dan apa yang perlu kamu ketahui.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Kapan haid pertamamu datang?',
      'Apa yang normal',
      'Cara kerjanya',
      'Merawat dirimu',
      'Membicarakannya dan mendapat dukungan',
    ],
    details: [
      {
        title: 'Kapan haid pertamamu datang?',
        text: 'Haid pertama paling sering datang di usia 10 sampai 15 tahun, sekitar dua tahun setelah tanda-tanda pertama pubertas.',
      },
      {
        title: 'Apa yang sepenuhnya normal',
        text: 'Pada awalnya, siklus bisa tidak teratur, pendek, atau panjang. Tubuhmu hanya mengambil waktu untuk menemukan iramanya.',
      },
      {
        title: 'Memahami cara kerjanya',
        text: 'Haid biasanya berlangsung 3 sampai 7 hari. Aliran dan warna darahnya bisa berubah dari satu hari ke hari berikutnya.',
      },
      {
        title: 'Merawat dirimu',
        text: 'Ganti pembalutmu secara teratur, bersihkan dengan lembut, dan pilih pakaian yang nyaman agar kamu merasa tenang.',
      },
      {
        title: 'Membicarakannya dan mendapat dukungan',
        text: 'Kamu bisa bercerita kepada ibumu, kakak atau adik perempuanmu, orang terdekat, guru, atau tenaga kesehatan yang kamu percaya.',
      },
    ],
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Siklus yang tidak teratur di awal itu sepenuhnya normal. Tubuhmu masih belajar menemukan iramanya.',
    tip2Title: 'Kamu tidak sendirian',
    tip2Text: 'Setiap tubuh itu unik. Luangkan waktu, bersabarlah, dan jangan ragu meminta bantuan dari orang yang kamu percaya.',
    shareTitle: 'Haid pertama · AWA',
    shareMessage: 'Haid pertamamu: apa yang bisa diharapkan · AWA',
  },
  hi: {
    badge: 'पहला पीरियड',
    title: 'आपका पहला पीरियड:\nक्या उम्मीद रखें',
    metaDuration: '5 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'जाँची गई जानकारी',
    intro: 'क्या सामान्य है, क्या तसल्ली देने वाला है, और आपको क्या जानना चाहिए।',
    contentsTitle: 'इस लेख में',
    topics: [
      'आपका पहला पीरियड कब आता है?',
      'क्या सामान्य है',
      'यह कैसे काम करता है',
      'अपना ख़याल रखना',
      'बात करना और सहारा पाना',
    ],
    details: [
      {
        title: 'आपका पहला पीरियड कब आता है?',
        text: 'यह अक्सर 10 से 15 साल की उम्र के बीच आता है, किशोरावस्था के पहले संकेतों के लगभग दो साल बाद।',
      },
      {
        title: 'क्या बिल्कुल सामान्य है',
        text: 'शुरुआत में चक्र अनियमित, छोटे या लंबे हो सकते हैं। आपका शरीर बस अपनी लय पाने में समय ले रहा है।',
      },
      {
        title: 'यह कैसे काम करता है, इसे समझें',
        text: 'पीरियड आमतौर पर 3 से 7 दिन चलते हैं। फ़्लो और रंग एक दिन से दूसरे दिन बदल सकते हैं।',
      },
      {
        title: 'अपना ख़याल रखना',
        text: 'प्रोटेक्शन नियमित रूप से बदलें, हल्के हाथ से धोएँ और आरामदायक कपड़े चुनें ताकि आप सहज महसूस करें।',
      },
      {
        title: 'बात करना और सहारा पाना',
        text: 'आप अपनी माँ, बहन, किसी क़रीबी, किसी टीचर या अपने भरोसेमंद स्वास्थ्य विशेषज्ञ से बात कर सकती हैं।',
      },
    ],
    tip1Title: 'जानना अच्छा रहेगा',
    tip1Text: 'शुरुआत में अनियमित चक्र बिल्कुल सामान्य है। आपका शरीर अभी अपनी लय पाना सीख रहा है।',
    tip2Title: 'आप अकेली नहीं हैं',
    tip2Text: 'हर शरीर अनोखा होता है। अपना समय लें, धैर्य रखें और किसी भरोसेमंद व्यक्ति से मदद माँगने में झिझकें नहीं।',
    shareTitle: 'पहला पीरियड · AWA',
    shareMessage: 'आपका पहला पीरियड: क्या उम्मीद रखें · AWA',
  },
  sq: {
    badge: 'MENSTRUACIONI I PARË',
    title: 'Menstruacioni yt i parë:\nçfarë të presësh',
    metaDuration: '5 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Çfarë është normale, çfarë është qetësuese dhe çfarë duhet të dish.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Kur vjen menstruacioni yt i parë?',
      'Çfarë është normale',
      'Si funksionon',
      'Kujdesi për veten',
      'Të flasësh për të dhe të marrësh mbështetje',
    ],
    details: [
      {
        title: 'Kur vjen menstruacioni yt i parë?',
        text: 'Më shpesh vjen midis moshës 10 dhe 15 vjeç, rreth dy vjet pas shenjave të para të pubertetit.',
      },
      {
        title: 'Çfarë është plotësisht normale',
        text: 'Në fillim, ciklet mund të jenë të parregullta, të shkurtra ose të gjata. Trupi yt thjesht po merr kohë për të gjetur ritmin e tij.',
      },
      {
        title: 'Të kuptosh si funksionon',
        text: 'Menstruacionet zakonisht zgjasin 3 deri në 7 ditë. Rrjedhja dhe ngjyra mund të ndryshojnë nga një ditë te tjetra.',
      },
      {
        title: 'Kujdesi për veten',
        text: 'Ndërro mbrojtjen rregullisht, lahu butë dhe zgjidh veshje të rehatshme që të ndihesh mirë.',
      },
      {
        title: 'Të flasësh për të dhe të marrësh mbështetje',
        text: 'Mund të flasësh me nënën, një motër, dikë të afërt, një mësuese ose një profesionist të shëndetësisë që i beson.',
      },
    ],
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Një cikël i parregullt në fillim është plotësisht normal. Trupi yt është ende duke mësuar si ta gjejë ritmin e tij.',
    tip2Title: 'Nuk je e vetme',
    tip2Text: 'Çdo trup është unik. Merr kohën tënde, ki durim dhe mos ngurro të kërkosh ndihmë nga dikush që i beson.',
    shareTitle: 'Menstruacioni i parë · AWA',
    shareMessage: 'Menstruacioni yt i parë: çfarë të presësh · AWA',
  },
  ja: {
    badge: '初経',
    title: '初めての生理：\n知っておきたいこと',
    metaDuration: '読了5分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '監修済みの内容',
    intro: '何が普通で、何が安心できることで、何を知っておけばよいかを紹介します。',
    contentsTitle: 'この記事の内容',
    topics: [
      '初めての生理はいつ来る？',
      '普通のこと',
      '生理のしくみ',
      '自分をいたわる',
      '話すこと、支えてもらうこと',
    ],
    details: [
      {
        title: '初めての生理はいつ来る？',
        text: '多くの場合は10〜15歳のあいだに来ます。思春期の最初のサインが現れてから、およそ2年後です。',
      },
      {
        title: 'まったく普通のこと',
        text: '最初のころは、周期が不規則だったり、短かったり長かったりすることがあります。体が自分のリズムを見つけるまで、ゆっくり時間をかけているだけです。',
      },
      {
        title: 'しくみを知る',
        text: '生理は通常3〜7日間続きます。経血量や色は、日によって変わることがあります。',
      },
      {
        title: '自分をいたわる',
        text: '生理用品をこまめに交換し、やさしく洗い、心地よい服を選ぶと、安心して過ごせます。',
      },
      {
        title: '話すこと、支えてもらうこと',
        text: 'お母さん、姉妹、身近な人、先生、信頼できる医療従事者に話してみてもよいでしょう。',
      },
    ],
    tip1Title: '知っておきたいこと',
    tip1Text: '最初のころの不規則な周期は、まったく普通のことです。体はまだ、リズムの見つけ方を学んでいる途中です。',
    tip2Title: 'ひとりではありません',
    tip2Text: '体はひとりひとり違います。ゆっくり、あせらずに。信頼できる人に助けを求めることをためらわないでください。',
    shareTitle: '初めての生理 · AWA',
    shareMessage: '初めての生理：知っておきたいこと · AWA',
  },
  ko: {
    badge: '첫 생리',
    title: '첫 생리,\n무엇을 기대해야 할까요',
    metaDuration: '5분 읽기',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '무엇이 정상인지, 무엇이 안심되는지, 꼭 알아야 할 점은 무엇인지 알아봐요.',
    contentsTitle: '이 아티클에서는',
    topics: [
      '첫 생리는 언제 시작될까요?',
      '정상적인 것',
      '생리의 원리',
      '나를 돌보기',
      '이야기하고 도움받기',
    ],
    details: [
      {
        title: '첫 생리는 언제 시작될까요?',
        text: '대개 10~15세 사이에 시작돼요. 사춘기의 첫 신호가 나타나고 약 2년 뒤예요.',
      },
      {
        title: '아주 정상적인 것',
        text: '처음에는 주기가 불규칙하거나 짧거나 길 수 있어요. 몸이 리듬을 찾는 데 시간이 걸리고 있을 뿐이에요.',
      },
      {
        title: '생리의 원리 이해하기',
        text: '생리는 보통 3~7일 동안 이어져요. 출혈량과 색은 하루하루 달라질 수 있어요.',
      },
      {
        title: '나를 돌보기',
        text: '생리용품을 정기적으로 갈고, 부드럽게 씻고, 편한 옷을 입어서 마음 편히 지내요.',
      },
      {
        title: '이야기하고 도움받기',
        text: '엄마, 언니나 누나, 가까운 사람, 선생님, 믿을 수 있는 의료 전문가에게 이야기할 수 있어요.',
      },
    ],
    tip1Title: '알아 두면 좋아요',
    tip1Text: '처음에 주기가 불규칙한 것은 아주 정상이에요. 몸이 아직 리듬을 찾는 법을 배우는 중이에요.',
    tip2Title: '혼자가 아니에요',
    tip2Text: '몸은 모두 저마다 달라요. 시간을 갖고 느긋하게 생각하고, 믿을 수 있는 사람에게 도움을 청하는 것을 망설이지 마세요.',
    shareTitle: '첫 생리 · AWA',
    shareMessage: '첫 생리, 무엇을 기대해야 할까요 · AWA',
  },
  'pt-PT': {
    badge: 'PRIMEIRO PERÍODO',
    title: 'O seu primeiro período:\no que esperar',
    metaDuration: '5 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'O que é normal, o que é tranquilizador e o que precisa de saber.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Quando chega o primeiro período?',
      'O que é normal',
      'Como funciona',
      'Cuidar de si',
      'Falar sobre o assunto e procurar apoio',
    ],
    details: [
      {
        title: 'Quando chega o primeiro período?',
        text: 'Chega mais frequentemente entre os 10 e os 15 anos, cerca de dois anos depois dos primeiros sinais da puberdade.',
      },
      {
        title: 'O que é perfeitamente normal',
        text: 'No início, os ciclos podem ser irregulares, curtos ou longos. O seu corpo está apenas a levar o seu tempo para encontrar o ritmo.',
      },
      {
        title: 'Compreender como funciona',
        text: 'Os períodos duram normalmente de 3 a 7 dias. O fluxo e a cor podem mudar de um dia para o outro.',
      },
      {
        title: 'Cuidar de si',
        text: 'Mude a proteção com regularidade, lave-se com suavidade e escolha roupa confortável para se sentir à vontade.',
      },
      {
        title: 'Falar sobre o assunto e procurar apoio',
        text: 'Pode falar com a sua mãe, uma irmã, alguém próximo, uma professora ou um profissional de saúde em quem confie.',
      },
    ],
    tip1Title: 'Bom saber',
    tip1Text: 'Um ciclo irregular no início é perfeitamente normal. O seu corpo ainda está a aprender a encontrar o seu ritmo.',
    tip2Title: 'Não está sozinha',
    tip2Text: 'Cada corpo é único. Dê-se tempo, tenha paciência e não hesite em pedir ajuda a alguém em quem confie.',
    shareTitle: 'Primeiro período · AWA',
    shareMessage: 'O seu primeiro período: o que esperar · AWA',
  },
  bn: {
    badge: 'প্রথম মাসিক',
    title: 'আপনার প্রথম মাসিক:\nকী আশা করবেন',
    metaDuration: 'পড়তে 5 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'কোনটি স্বাভাবিক, কোনটি আশ্বস্ত করে, এবং কী জানা দরকার।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'আপনার প্রথম মাসিক কখন আসে?',
      'যা স্বাভাবিক',
      'এটি কীভাবে কাজ করে',
      'নিজের যত্ন নেওয়া',
      'কথা বলা ও সহায়তা পাওয়া',
    ],
    details: [
      {
        title: 'আপনার প্রথম মাসিক কখন আসে?',
        text: 'এটি সবচেয়ে বেশি আসে 10 থেকে 15 বছর বয়সের মধ্যে, বয়ঃসন্ধির প্রথম লক্ষণ দেখা দেওয়ার প্রায় দুই বছর পর।',
      },
      {
        title: 'যা সম্পূর্ণ স্বাভাবিক',
        text: 'শুরুতে চক্র অনিয়মিত, ছোট বা বড় হতে পারে। আপনার শরীর শুধু নিজের ছন্দ খুঁজে পেতে সময় নিচ্ছে।',
      },
      {
        title: 'এটি কীভাবে কাজ করে তা বোঝা',
        text: 'মাসিক সাধারণত 3 থেকে 7 দিন স্থায়ী হয়। রক্তক্ষরণের পরিমাণ ও রং একদিন থেকে আরেকদিনে বদলাতে পারে।',
      },
      {
        title: 'নিজের যত্ন নেওয়া',
        text: 'নিয়মিত সুরক্ষা সামগ্রী বদলান, আলতো করে ধুয়ে নিন এবং আরামদায়ক পোশাক বেছে নিন, যাতে স্বচ্ছন্দ বোধ করেন।',
      },
      {
        title: 'কথা বলা ও সহায়তা পাওয়া',
        text: 'আপনি আপনার মা, বোন, কাছের কেউ, কোনো শিক্ষক অথবা বিশ্বস্ত কোনো স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে কথা বলতে পারেন।',
      },
    ],
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'শুরুতে অনিয়মিত চক্র সম্পূর্ণ স্বাভাবিক। আপনার শরীর এখনও নিজের ছন্দ খুঁজে নিতে শিখছে।',
    tip2Title: 'আপনি একা নন',
    tip2Text: 'প্রতিটি শরীর অনন্য। নিজেকে সময় দিন, ধৈর্য ধরুন এবং বিশ্বস্ত কারও কাছে সাহায্য চাইতে দ্বিধা করবেন না।',
    shareTitle: 'প্রথম মাসিক · AWA',
    shareMessage: 'আপনার প্রথম মাসিক: কী আশা করবেন · AWA',
  },
  da: {
    badge: 'FØRSTE MENSTRUATION',
    title: 'Din første menstruation:\nhvad du kan forvente',
    metaDuration: '5 min læsning',
    metaType: 'Guide',
    metaLevel: 'Grundlæggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Hvad der er normalt, hvad der er beroligende, og hvad du bør vide.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvornår kommer din første menstruation?',
      'Hvad er normalt',
      'Hvordan det fungerer',
      'At tage vare på sig selv',
      'At tale og få støtte',
    ],
    details: [
      {
        title: 'Hvornår kommer din første menstruation?',
        text: 'Det sker oftest mellem 10 og 15 år, cirka to år efter de første tegn på puberteten.',
      },
      {
        title: 'Hvad der er helt normalt',
        text: 'I starten kan cyklussen være uregelmæssig, kortere eller længere. Din krop tager bare tid til at finde sin rytme.',
      },
      {
        title: 'At forstå hvordan det fungerer',
        text: 'Menstruationen varer typisk 3 til 7 dage. Blødningsmængden og farven kan variere fra dag til dag.',
      },
      {
        title: 'At tage vare på sig selv',
        text: 'Skift beskyttelse regelmæssigt, vask dig forsigtigt, og vælg komfortable tøj, så du føler dig godt tilpas.',
      },
      {
        title: 'At tale og få støtte',
        text: 'Du kan tale med din mor, søster, en nær person, en lærer eller en betroet sundhedsprofessionel.',
      },
    ],
    tip1Title: 'Godt at vide',
    tip1Text: 'En uregelmæssig cyklus i starten er helt normalt. Din krop er stadig ved at lære at finde sin rytme.',
    tip2Title: 'Du er ikke alene',
    tip2Text: 'Enhver krop er unik. Giv dig selv tid, vær tålmodig, og tøv ikke med at bede om hjælp fra en du stoler på.',
    shareTitle: 'Første menstruation · AWA',
    shareMessage: 'Din første menstruation: hvad du kan forvente · AWA',
  },
  sv: {
    badge: 'FÖRSTE MENSTRUATION',
    title: 'Din förste menstruation:\nhvad du kan forvente',
    metaDuration: '5 min läsning',
    metaType: 'Guide',
    metaLevel: 'Grundläggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Hvad der ar normalt, hvad der ar beroligende, och hvad du bör vide.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvornår kommer din förste menstruation?',
      'Hvad ar normalt',
      'Hvordan det fungerer',
      'At tage vare på sig selv',
      'At tale och få stötte',
    ],
    details: [
      {
        title: 'Hvornår kommer din förste menstruation?',
        text: 'Det sker oftest mellem 10 och 15 år, cirka to år efter de förste tegn på puberteten.',
      },
      {
        title: 'Hvad der ar helt normalt',
        text: 'I starten kan cyklussen väre uregelmässig, kortere eller längere. Din krop tager bare tid till at finde sin rytme.',
      },
      {
        title: 'At forstå hvordan det fungerer',
        text: 'Menstruationen varer typisk 3 till 7 dagar. Blödningsmängden och farven kan variere fran dag till dag.',
      },
      {
        title: 'At tage vare på sig selv',
        text: 'Skift beskyttelse regelmässigt, vask dig forsigtigt, och välg komfortable töj, så du föler dig godt tilpas.',
      },
      {
        title: 'At tale och få stötte',
        text: 'Du kan tale med din mor, söster, en när person, en lärer eller en betroet halsasprofessionel.',
      },
    ],
    tip1Title: 'Godt at vide',
    tip1Text: 'En uregelmässig cyklus i starten ar helt normalt. Din krop ar fortfarande ved at läre at finde sin rytme.',
    tip2Title: 'Du ar inte alene',
    tip2Text: 'Enhver krop ar unik. Giv dig selv tid, vär tålmodig, och töv inte med at bede om hjälp fran en du stoler på.',
    shareTitle: 'Förste menstruation · AWA',
    shareMessage: 'Din förste menstruation: hvad du kan forvente · AWA',
  },
  nb: {
    badge: 'FØRSTE MENS',
    title: 'Din første mens:\nhva du kan forvente',
    metaDuration: '5 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Hva som er normalt, hva som er betryggende, og hva du trenger å vite.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Når kommer den første mensen?',
      'Hva som er normalt',
      'Hvordan det fungerer',
      'Ta vare på deg selv',
      'Snakke om det og få støtte',
    ],
    details: [
      {title: 'Når kommer den første mensen?', text: 'Den kommer oftest mellom 10 og 15 år, omtrent to år etter de første tegnene på pubertet.'},
      {title: 'Det som er helt normalt', text: 'I begynnelsen kan syklusene være uregelmessige, korte eller lange. Kroppen din bruker bare tid på å finne sin rytme.'},
      {title: 'Forstå hvordan det fungerer', text: 'Mensen varer vanligvis 3 til 7 dager. Blødningen og fargen kan endre seg fra en dag til den neste.'},
      {title: 'Ta vare på deg selv', text: 'Bytt beskyttelse jevnlig, vask deg forsiktig og velg behagelige klær slik at du føler deg vel.'},
      {title: 'Snakke om det og få støtte', text: 'Du kan snakke med moren din, en søster, noen du står nær, en lærer eller helsepersonell du stoler på.'},
    ],
    tip1Title: 'Godt å vite',
    tip1Text: 'En uregelmessig syklus i begynnelsen er helt normalt. Kroppen din lærer fortsatt hvordan den skal finne sin rytme.',
    tip2Title: 'Du er ikke alene',
    tip2Text: 'Hver kropp er unik. Ta deg tid, vær tålmodig, og ikke nøl med å be om hjelp fra noen du stoler på.',
    shareTitle: 'Første mens · AWA',
    shareMessage: 'Din første mens: hva du kan forvente · AWA',
  },
  pl: {
    badge: 'PIERWSZA MIESIĄCZKA',
    title: 'Twoja pierwsza miesiączka:\nczego się spodziewać',
    metaDuration: '5 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Co jest normalne, co uspokajające i co warto wiedzieć.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Kiedy pojawia się pierwsza miesiączka?',
      'Co jest normalne',
      'Jak to działa',
      'Dbanie o siebie',
      'Rozmowa i wsparcie',
    ],
    details: [
      {title: 'Kiedy pojawia się pierwsza miesiączka?', text: 'Najczęściej między 10. a 15. rokiem życia, około dwóch lat po pierwszych oznakach dojrzewania.'},
      {title: 'Co jest całkowicie normalne', text: 'Na początku cykle mogą być nieregularne, krótkie lub długie. Twoje ciało po prostu potrzebuje czasu, by znaleźć swój rytm.'},
      {title: 'Jak to działa', text: 'Miesiączka trwa zwykle od 3 do 7 dni. Obfitość i kolor krwawienia mogą zmieniać się z dnia na dzień.'},
      {title: 'Dbanie o siebie', text: 'Regularnie zmieniaj środki higieniczne, myj się delikatnie i wybieraj wygodną odzież, by czuć się swobodnie.'},
      {title: 'Rozmowa i wsparcie', text: 'Możesz porozmawiać z mamą, siostrą, bliską osobą, nauczycielką lub specjalistą, któremu ufasz.'},
    ],
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Nieregularny cykl na początku jest zupełnie normalny. Twoje ciało wciąż uczy się znajdować swój rytm.',
    tip2Title: 'Nie jesteś sama',
    tip2Text: 'Każde ciało jest wyjątkowe. Daj sobie czas, bądź cierpliwa i nie wahaj się prosić o pomoc kogoś, komu ufasz.',
    shareTitle: 'Pierwsza miesiączka · AWA',
    shareMessage: 'Twoja pierwsza miesiączka: czego się spodziewać · AWA',
  },
  uk: {
    badge: 'ПЕРША МЕНСТРУАЦІЯ',
    title: 'Ваша перша менструація:\nчого очікувати',
    metaDuration: '5 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Що нормально, що заспокоює і що варто знати.',
    contentsTitle: 'У цій статті',
    topics: [
      'Коли настає перша менструація?',
      'Що нормально',
      'Як це відбувається',
      'Дбайте про себе',
      'Розмова та підтримка',
    ],
    details: [
      {title: 'Коли настає перша менструація?', text: 'Найчастіше між 10 і 15 роками, приблизно через два роки після перших ознак статевого дозрівання.'},
      {title: 'Що цілком нормально', text: 'Спочатку цикли можуть бути нерегулярними, короткими чи довгими. Ваше тіло просто потребує часу, щоб знайти свій ритм.'},
      {title: 'Як це відбувається', text: 'Менструація зазвичай триває від 3 до 7 днів. Інтенсивність і колір виділень можуть змінюватися з дня на день.'},
      {title: 'Дбайте про себе', text: 'Регулярно змінюйте засоби гігієни, мийтеся ніжно й обирайте зручний одяг, щоб почуватися вільно.'},
      {title: 'Розмова та підтримка', text: 'Ви можете поговорити з мамою, сестрою, близькою людиною, вчителькою або лікарем, якому довіряєте.'},
    ],
    tip1Title: 'Варто знати',
    tip1Text: 'Нерегулярний цикл спочатку — це цілком нормально. Ваше тіло ще вчиться знаходити свій ритм.',
    tip2Title: 'Ви не самотні',
    tip2Text: 'Кожне тіло унікальне. Не поспішайте, будьте терплячі й не вагайтеся просити допомоги в когось, кому довіряєте.',
    shareTitle: 'Перша менструація · AWA',
    shareMessage: 'Ваша перша менструація: чого очікувати · AWA',
  },
  cs: {
    badge: 'PRVNÍ MENSTRUACE',
    title: 'Vaše první menstruace:\nco očekávat',
    metaDuration: '5 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Co je normální, co je uklidňující a co byste měla vědět.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Kdy přichází první menstruace?',
      'Co je normální',
      'Jak to funguje',
      'Péče o sebe',
      'Mluvit o tom a získat podporu',
    ],
    details: [
      {title: 'Kdy přichází první menstruace?', text: 'Nejčastěji přichází mezi 10. a 15. rokem, asi dva roky po prvních známkách puberty.'},
      {title: 'Co je zcela normální', text: 'Zpočátku mohou být cykly nepravidelné, krátké nebo dlouhé. Vaše tělo si prostě dává čas najít svůj rytmus.'},
      {title: 'Pochopení, jak to funguje', text: 'Menstruace obvykle trvá 3 až 7 dní. Množství i barva krvácení se mohou den ode dne měnit.'},
      {title: 'Péče o sebe', text: 'Pravidelně měňte ochranu, jemně se myjte a zvolte pohodlné oblečení, abyste se cítila dobře.'},
      {title: 'Mluvit o tom a získat podporu', text: 'Můžete si promluvit s maminkou, sestrou, někým blízkým, učitelkou nebo zdravotnickým pracovníkem, kterému důvěřujete.'},
    ],
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Nepravidelný cyklus na začátku je zcela normální. Vaše tělo se stále učí najít svůj rytmus.',
    tip2Title: 'Nejste na to sama',
    tip2Text: 'Každé tělo je jedinečné. Dopřejte si čas, buďte trpělivá a neváhejte požádat o pomoc někoho, komu důvěřujete.',
    shareTitle: 'První menstruace · AWA',
    shareMessage: 'Vaše první menstruace: co očekávat · AWA',
  },
  sk: {
    badge: 'PRVÁ MENŠTRUÁCIA',
    title: 'Vaša prvá menštruácia:\nčo očakávať',
    metaDuration: '5 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Čo je normálne, čo je upokojujúce a čo potrebujete vedieť.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Kedy príde vaša prvá menštruácia?',
      'Čo je normálne',
      'Ako to funguje',
      'Starostlivosť o seba',
      'Rozprávať sa o tom a získať podporu',
    ],
    details: [
      {title: 'Kedy príde vaša prvá menštruácia?', text: 'Najčastejšie príde medzi 10. a 15. rokom, približne dva roky po prvých znakoch puberty.'},
      {title: 'Čo je úplne normálne', text: 'Spočiatku môžu byť cykly nepravidelné, krátke alebo dlhé. Vaše telo si jednoducho dáva čas nájsť svoj rytmus.'},
      {title: 'Pochopenie, ako to funguje', text: 'Menštruácia zvyčajne trvá 3 až 7 dní. Množstvo krvácania a farba sa môžu z jedného dňa na druhý meniť.'},
      {title: 'Starostlivosť o seba', text: 'Pravidelne meňte hygienické pomôcky, umývajte sa jemne a vyberajte si pohodlné oblečenie, aby ste sa cítili dobre.'},
      {title: 'Rozprávať sa o tom a získať podporu', text: 'Môžete sa porozprávať s mamou, sestrou, blízkou osobou, učiteľkou alebo zdravotníckym pracovníkom, ktorému dôverujete.'},
    ],
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Spočiatku nepravidelný cyklus je úplne normálny. Vaše telo sa ešte len učí nájsť svoj rytmus.',
    tip2Title: 'Nie ste v tom sama',
    tip2Text: 'Každé telo je jedinečné. Dajte si čas, buďte trpezlivá a neváhajte požiadať o pomoc osobu, ktorej dôverujete.',
    shareTitle: 'Prvá menštruácia · AWA',
    shareMessage: 'Vaša prvá menštruácia: čo očakávať · AWA',
  },
  hu: {
    badge: 'AZ ELSŐ MENSTRUÁCIÓ',
    title: 'Az első menstruációd:\nmire számíts',
    metaDuration: '5 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Mi a normális, mi megnyugtató, és mit érdemes tudnod.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Mikor jön meg az első menstruációd?',
      'Mi a normális',
      'Hogyan működik',
      'Gondoskodj magadról',
      'Beszélni róla és támogatást kapni',
    ],
    details: [
      {title: 'Mikor jön meg az első menstruációd?', text: 'Leggyakrabban 10 és 15 éves kor között jön meg, nagyjából két évvel a pubertás első jelei után.'},
      {title: 'Ami teljesen normális', text: 'Kezdetben a ciklusok szabálytalanok, rövidek vagy hosszúak lehetnek. A tested egyszerűen időt vesz igénybe, hogy megtalálja a ritmusát.'},
      {title: 'Hogyan működik', text: 'A menstruáció általában 3–7 napig tart. A vérzés erőssége és színe napról napra változhat.'},
      {title: 'Gondoskodj magadról', text: 'Rendszeresen cseréld a higiéniai terméket, mosakodj kíméletesen, és válassz kényelmes ruházatot, hogy jól érezd magad.'},
      {title: 'Beszélni róla és támogatást kapni', text: 'Beszélhetsz az anyáddal, egy testvéreddel, egy közeli személlyel, egy tanárral vagy egy egészségügyi szakemberrel, akiben bízol.'},
    ],
    tip1Title: 'Érdemes tudni',
    tip1Text: 'A kezdetben szabálytalan ciklus teljesen normális. A tested még tanulja, hogyan találja meg a ritmusát.',
    tip2Title: 'Nem vagy egyedül',
    tip2Text: 'Minden test egyedi. Szánj rá időt, légy türelmes, és ne habozz segítséget kérni valakitől, akiben megbízol.',
    shareTitle: 'Az első menstruáció · AWA',
    shareMessage: 'Az első menstruációd: mire számíts · AWA',
  },
  ro: {
    badge: 'PRIMA MENSTRUAȚIE',
    title: 'Prima ta menstruație:\nla ce să te aștepți',
    metaDuration: '5 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Ce este normal, ce este liniștitor și ce trebuie să știi.',
    contentsTitle: 'În acest articol',
    topics: [
      'Când sosește prima menstruație?',
      'Ce este normal',
      'Cum funcționează',
      'Grija de tine',
      'Să vorbești despre ea și să primești sprijin',
    ],
    details: [
      {title: 'Când sosește prima menstruație?', text: 'Cel mai adesea sosește între 10 și 15 ani, la aproximativ doi ani după primele semne ale pubertății.'},
      {title: 'Ce este complet normal', text: 'La început, ciclurile pot fi neregulate, scurte sau lungi. Corpul tău își ia pur și simplu timp pentru a-și găsi ritmul.'},
      {title: 'Înțelegerea modului în care funcționează', text: 'Menstruația durează de obicei între 3 și 7 zile. Fluxul și culoarea se pot schimba de la o zi la alta.'},
      {title: 'Grija de tine', text: 'Schimbă-ți protecția în mod regulat, spală-te blând și alege haine confortabile pentru a te simți bine.'},
      {title: 'Să vorbești despre ea și să primești sprijin', text: 'Poți vorbi cu mama ta, cu o soră, cu o persoană apropiată, cu o profesoară sau cu un profesionist din domeniul sănătății în care ai încredere.'},
    ],
    tip1Title: 'Bine de știut',
    tip1Text: 'Un ciclu neregulat la început este complet normal. Corpul tău încă învață cum să-și găsească ritmul.',
    tip2Title: 'Nu ești singură',
    tip2Text: 'Fiecare corp este unic. Ia-ți timp, fii răbdătoare și nu ezita să ceri ajutor unei persoane în care ai încredere.',
    shareTitle: 'Prima menstruație · AWA',
    shareMessage: 'Prima ta menstruație: la ce să te aștepți · AWA',
  },
  bg: {
    badge: 'ПЪРВА МЕНСТРУАЦИЯ',
    title: 'Първата ти менструация:\nкакво да очакваш',
    metaDuration: '5 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Кое е нормално, кое е успокояващо и какво трябва да знаеш.',
    contentsTitle: 'В тази статия',
    topics: [
      'Кога идва първата менструация?',
      'Кое е нормално',
      'Как работи',
      'Грижа за себе си',
      'Да говориш за нея и да получиш подкрепа',
    ],
    details: [
      {title: 'Кога идва първата менструация?', text: 'Най-често идва между 10 и 15 години, около две години след първите признаци на пубертета.'},
      {title: 'Какво е напълно нормално', text: 'В началото циклите могат да бъдат нередовни, къси или дълги. Тялото ти просто си взема времето да намери ритъма си.'},
      {title: 'Разбиране как работи', text: 'Менструацията обикновено продължава от 3 до 7 дни. Потокът и цветът могат да се променят от ден на ден.'},
      {title: 'Грижа за себе си', text: 'Сменяй редовно защитата си, мий се нежно и избирай удобни дрехи, за да се чувстваш спокойно.'},
      {title: 'Да говориш за нея и да получиш подкрепа', text: 'Можеш да поговориш с майка си, сестра, близък човек, учителка или здравен специалист, на когото имаш доверие.'},
    ],
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Нередовният цикъл в началото е напълно нормален. Тялото ти още се учи как да намери ритъма си.',
    tip2Title: 'Не си сама',
    tip2Text: 'Всяко тяло е уникално. Дай си време, бъди търпелива и не се колебай да поискаш помощ от човек, на когото се доверяваш.',
    shareTitle: 'Първа менструация · AWA',
    shareMessage: 'Първата ти менструация: какво да очакваш · AWA',
  },
  sr: {
    badge: 'ПРВА МЕНСТРУАЦИЈА',
    title: 'Твоја прва менструација:\nшта да очекујеш',
    metaDuration: '5 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Шта је нормално, шта је умирујуће и шта треба да знаш.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Када стиже твоја прва менструација?',
      'Шта је нормално',
      'Како функционише',
      'Брига о себи',
      'Разговор о томе и подршка',
    ],
    details: [
      {title: 'Када стиже твоја прва менструација?', text: 'Најчешће стиже између 10. и 15. године, око две године после првих знакова пубертета.'},
      {title: 'Шта је потпуно нормално', text: 'У почетку циклуси могу бити неправилни, кратки или дуги. Твоје тело једноставно узима времена да пронађе свој ритам.'},
      {title: 'Разумевање како функционише', text: 'Менструација обично траје 3 до 7 дана. Проток и боја могу се мењати из дана у дан.'},
      {title: 'Брига о себи', text: 'Редовно мењај заштиту, нежно се пери и бирај удобну одећу да се осећаш угодно.'},
      {title: 'Разговор о томе и подршка', text: 'Можеш разговарати са мајком, сестром, неком блиском особом, наставником или здравственим радником коме верујеш.'},
    ],
    tip1Title: 'Добро је знати',
    tip1Text: 'Неправилан циклус на почетку је потпуно нормалан. Твоје тело још учи како да пронађе свој ритам.',
    tip2Title: 'Ниси сама',
    tip2Text: 'Свако тело је јединствено. Дај себи времена, буди стрпљива и не оклевај да затражиш помоћ од некога коме верујеш.',
    shareTitle: 'Прва менструација · AWA',
    shareMessage: 'Твоја прва менструација: шта да очекујеш · AWA',
  },
  hr: {
    badge: 'PRVA MENSTRUACIJA',
    title: 'Tvoja prva menstruacija:\nšto očekivati',
    metaDuration: '5 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Što je normalno, što umiruje i što trebaš znati.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Kada stiže tvoja prva menstruacija?',
      'Što je normalno',
      'Kako funkcionira',
      'Briga o sebi',
      'Razgovor i podrška',
    ],
    details: [
      {title: 'Kada stiže tvoja prva menstruacija?', text: 'Najčešće stiže između 10. i 15. godine, otprilike dvije godine nakon prvih znakova puberteta.'},
      {title: 'Što je posve normalno', text: 'Na početku ciklusi mogu biti nepravilni, kratki ili dugi. Tvom tijelu jednostavno treba vremena da pronađe svoj ritam.'},
      {title: 'Razumijevanje kako funkcionira', text: 'Menstruacija obično traje 3 do 7 dana. Protok i boja mogu se mijenjati iz dana u dan.'},
      {title: 'Briga o sebi', text: 'Redovito mijenjaj zaštitu, nježno se peri i odaberi udobnu odjeću kako bi se osjećala ugodno.'},
      {title: 'Razgovor i podrška', text: 'Možeš razgovarati s majkom, sestrom, bliskom osobom, učiteljicom ili zdravstvenim djelatnikom kojem vjeruješ.'},
    ],
    tip1Title: 'Dobro je znati',
    tip1Text: 'Nepravilan ciklus na početku posve je normalan. Tvoje tijelo još uči kako pronaći svoj ritam.',
    tip2Title: 'Nisi sama',
    tip2Text: 'Svako je tijelo jedinstveno. Daj si vremena, budi strpljiva i ne oklijevaj zatražiti pomoć od osobe kojoj vjeruješ.',
    shareTitle: 'Prva menstruacija · AWA',
    shareMessage: 'Tvoja prva menstruacija: što očekivati · AWA',
  },
  bs: {
    badge: 'PRVA MENSTRUACIJA',
    title: 'Tvoja prva menstruacija:\nšta očekivati',
    metaDuration: '5 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Što je normalno, što umiruje i što trebaš znati.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Kada stiže tvoja prva menstruacija?',
      'Što je normalno',
      'Kako funkcionira',
      'Briga o sebi',
      'Razgovor i podrška',
    ],
    details: [
      {title: 'Kada stiže tvoja prva menstruacija?', text: 'Najčešće stiže između 10. i 15. godine, otprilike dvije godine nakon prvih znakova puberteta.'},
      {title: 'Što je posve normalno', text: 'Na početku ciklusi mogu biti nepravilni, kratki ili dugi. Tvom tijelu jednostavno treba vremena da pronađe svoj ritam.'},
      {title: 'Razumijevanje kako funkcionira', text: 'Menstruacija obično traje 3 do 7 dana. Protok i boja mogu se mijenjati iz dana u dan.'},
      {title: 'Briga o sebi', text: 'Redovito mijenjaj zaštitu, nježno se peri i odaberi udobnu odjeću kako bi se osjećala ugodno.'},
      {title: 'Razgovor i podrška', text: 'Možeš razgovarati s majkom, sestrom, bliskom osobom, učiteljicom ili zdravstvenim radnikom kojem vjeruješ.'},
    ],
    tip1Title: 'Dobro je znati',
    tip1Text: 'Nepravilan ciklus na početku posve je normalan. Tvoje tijelo još uči kako pronaći svoj ritam.',
    tip2Title: 'Nisi sama',
    tip2Text: 'Svako je tijelo jedinstveno. Daj si vremena, budi strpljiva i ne oklijevaj zatražiti pomoć od osobe kojoj vjeruješ.',
    shareTitle: 'Prva menstruacija · AWA',
    shareMessage: 'Tvoja prva menstruacija: što očekivati · AWA',
  },
  sl: {
    badge: 'PRVA MENSTRUACIJA',
    title: 'Tvoja prva menstruacija:\nkaj pričakovati',
    metaDuration: '5 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Kaj je normalno, kaj pomirja in kaj moraš vedeti.',
    contentsTitle: 'V tem članku',
    topics: [
      'Kdaj prihaja tvoja prva menstruacija?',
      'Kaj je normalno',
      'Kako deluje',
      'Skrb zase',
      'Pogovor in podpora',
    ],
    details: [
      {title: 'Kdaj prihaja tvoja prva menstruacija?', text: 'Najpogosteje pride med 10. in 15. letom, približno dve leti po prvih znakih pubertete.'},
      {title: 'Kaj je povsem normalno', text: 'Na začetku so cikli lahko neredni, kratki ali dolgi. Tvoje telo preprosto potrebuje čas, da najde svoj ritem.'},
      {title: 'Razumevanje, kako deluje', text: 'Menstruacija običajno traja 3 do 7 dni. Tok in barva se lahko spreminjata iz dneva v dan.'},
      {title: 'Skrb zase', text: 'Redno menjaj zaščito, nežno se umivaj in izberi udobna oblačila, da se boš počutila prijetno.'},
      {title: 'Pogovor in podpora', text: 'Pogovoriš se lahko z mamo, sestro, bližnjo osebo, učiteljico ali zdravstvenim delavcem, ki mu zaupaš.'},
    ],
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Nereden cikel na začetku je povsem normalen. Tvoje telo se še uči, kako najti svoj ritem.',
    tip2Title: 'Nisi sama',
    tip2Text: 'Vsako telo je edinstveno. Daj si časa, bodi potrpežljiva in ne oklevaj prositi za pomoč osebe, ki ji zaupaš.',
    shareTitle: 'Prva menstruacija · AWA',
    shareMessage: 'Tvoja prva menstruacija: kaj pričakovati · AWA',
  },
  ne: {
    badge: 'पहिलो महिनावारी',
    title: 'तपाईंको पहिलो महिनावारी:\nके अपेक्षा गर्ने',
    metaDuration: '5 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'के सामान्य छ, के आश्वस्त पार्ने छ, र तपाईंले के जान्नुपर्छ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'तपाईंको पहिलो महिनावारी कहिले आउँछ?',
      'के सामान्य छ',
      'यो कसरी काम गर्छ',
      'आफ्नो ख्याल राख्ने',
      'यसबारे कुरा गर्ने र साथ पाउने',
    ],
    details: [
      {title: 'तपाईंको पहिलो महिनावारी कहिले आउँछ?', text: 'यो प्रायः 10 देखि 15 वर्षबीच, यौवनका पहिला संकेतहरू देखिएको करिब दुई वर्षपछि आउँछ।'},
      {title: 'के पूर्ण रूपमा सामान्य छ', text: 'सुरुमा चक्रहरू अनियमित, छोटा वा लामा हुन सक्छन्। तपाईंको शरीरले आफ्नो लय भेट्टाउन समय लिइरहेको मात्र हो।'},
      {title: 'यो कसरी काम गर्छ बुझ्ने', text: 'महिनावारी प्रायः 3 देखि 7 दिन रहन्छ। बहाव र रङ दिनैपिच्छे फरक हुन सक्छ।'},
      {title: 'आफ्नो ख्याल राख्ने', text: 'आफ्नो सुरक्षा नियमित रूपमा बदल्नुहोस्, कोमलतापूर्वक धुनुहोस्, र सहज लुगा छान्नुहोस् ताकि सहज महसुस होस्।'},
      {title: 'यसबारे कुरा गर्ने र साथ पाउने', text: 'तपाईं आफ्नी आमा, दिदीबहिनी, नजिकको कोही, शिक्षक वा आफूले विश्वास गर्ने स्वास्थ्यकर्मीसँग कुरा गर्न सक्नुहुन्छ।'},
    ],
    tip1Title: 'जान्न लायक',
    tip1Text: 'सुरुमा अनियमित चक्र पूर्ण रूपमा सामान्य हो। तपाईंको शरीरले अझै आफ्नो लय कसरी भेट्टाउने सिक्दै छ।',
    tip2Title: 'तपाईं एक्लै हुनुहुन्न',
    tip2Text: 'हरेक शरीर अनौठो हुन्छ। आफ्नो समय लिनुहोस्, धैर्य राख्नुहोस्, र आफूले विश्वास गर्ने कसैसँग मद्दत माग्न नहिच्किचाउनुहोस्।',
    shareTitle: 'पहिलो महिनावारी · AWA',
    shareMessage: 'तपाईंको पहिलो महिनावारी: के अपेक्षा गर्ने · AWA',
  },
  si: {
    badge: 'පළමු ඔසප්',
    title: 'ඔබේ පළමු ඔසප්:\nඅපේක්ෂා කළ යුත්තේ කුමක්ද',
    metaDuration: 'කියවීමට මිනිත්තු 5',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'සාමාන්‍ය දේ, සැනසිල්ලට හේතු වන දේ සහ ඔබ දැනගත යුතු දේ.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'ඔබේ පළමු ඔසප් පැමිණෙන්නේ කවදාද?',
      'සාමාන්‍ය දේ',
      'එය ක්‍රියා කරන ආකාරය',
      'ඔබ ගැන සැලකිලිමත් වීම',
      'ඒ ගැන කතා කිරීම සහ සහාය ලබා ගැනීම',
    ],
    details: [
      {title: 'ඔබේ පළමු ඔසප් පැමිණෙන්නේ කවදාද?', text: 'එය බොහෝ විට වයස 10 සහ 15 අතර, වැඩිවිය පැමිණීමේ පළමු සලකුණුවලින් වසර දෙකකට පමණ පසු පැමිණේ.'},
      {title: 'සම්පූර්ණයෙන්ම සාමාන්‍ය දේ', text: 'මුලදී, චක්‍ර අක්‍රමවත්, කෙටි, හෝ දිගු විය හැක. ඔබේ ශරීරය තම රිද්මය සොයාගැනීමට කාලය ගනිමින් සිටී.'},
      {title: 'එය ක්‍රියා කරන ආකාරය තේරුම් ගැනීම', text: 'ඔසප් සාමාන්‍යයෙන් දින 3 සිට 7 දක්වා පවතී. ගලනය සහ වර්ණය දිනෙන් දිනට වෙනස් විය හැක.'},
      {title: 'ඔබ ගැන සැලකිලිමත් වීම', text: 'ඔබේ ආරක්ෂාව නිතිපතා වෙනස් කරන්න, මෘදුවට සෝදන්න, සහ ඔබට සුවපහසුවක් දැනීමට සුවපහසු ඇඳුම් තෝරන්න.'},
      {title: 'ඒ ගැන කතා කිරීම සහ සහාය ලබා ගැනීම', text: 'ඔබට ඔබේ අම්මා, සහෝදරියක්, ඔබට සමීප කෙනෙක්, ගුරුවරියක්, හෝ ඔබ විශ්වාස කරන සෞඛ්‍ය වෘත්තිකයෙකු සමඟ කතා කළ හැක.'},
    ],
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'මුලදී අක්‍රමවත් චක්‍රයක් තිබීම සම්පූර්ණයෙන්ම සාමාන්‍යයි. ඔබේ ශරීරය තවමත් තම රිද්මය සොයාගන්නා ආකාරය ඉගෙන ගනිමින් සිටී.',
    tip2Title: 'ඔබ තනිවම නොවේ',
    tip2Text: 'සෑම ශරීරයක්ම අද්විතීයයි. ඔබේ කාලය ගන්න, ඉවසීමෙන් සිටින්න, සහ ඔබ විශ්වාස කරන කෙනෙකුගෙන් උදව් ඉල්ලීමට මැළි නොවන්න.',
    shareTitle: 'පළමු ඔසප් · AWA',
    shareMessage: 'ඔබේ පළමු ඔසප්: අපේක්ෂා කළ යුත්තේ කුමක්ද · AWA',
  },
  th: {
    badge: 'ประจำเดือนครั้งแรก',
    title: 'ประจำเดือนครั้งแรกของคุณ:\nสิ่งที่คาดหวังได้',
    metaDuration: 'อ่าน 5 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'อะไรที่เป็นปกติ อะไรที่ชวนให้สบายใจ และสิ่งที่คุณควรรู้',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ประจำเดือนครั้งแรกมาเมื่อไร?',
      'อะไรที่เป็นปกติ',
      'ทำงานอย่างไร',
      'ดูแลตัวเอง',
      'พูดคุยและขอการสนับสนุน',
    ],
    details: [
      {title: 'ประจำเดือนครั้งแรกมาเมื่อไร?', text: 'มักมาระหว่างอายุ 10 ถึง 15 ปี ประมาณสองปีหลังสัญญาณแรกของวัยแรกรุ่น'},
      {title: 'สิ่งที่เป็นปกติอย่างสมบูรณ์', text: 'ในช่วงแรก รอบเดือนอาจไม่สม่ำเสมอ สั้น หรือยาว ร่างกายของคุณกำลังใช้เวลาหาจังหวะของตัวเอง'},
      {title: 'ทำความเข้าใจว่าทำงานอย่างไร', text: 'ประจำเดือนมักมา 3 ถึง 7 วัน ปริมาณและสีอาจเปลี่ยนไปจากวันหนึ่งไปอีกวันหนึ่ง'},
      {title: 'ดูแลตัวเอง', text: 'เปลี่ยนอุปกรณ์เป็นประจำ ล้างอย่างอ่อนโยน และเลือกเสื้อผ้าที่สบายเพื่อให้รู้สึกผ่อนคลาย'},
      {title: 'พูดคุยและขอการสนับสนุน', text: 'คุณพูดคุยกับแม่ พี่สาว คนใกล้ชิด ครู หรือบุคลากรทางการแพทย์ที่คุณไว้ใจได้'},
    ],
    tip1Title: 'ควรรู้',
    tip1Text: 'รอบเดือนที่ไม่สม่ำเสมอในช่วงแรกเป็นเรื่องปกติอย่างสมบูรณ์ ร่างกายของคุณยังเรียนรู้ที่จะหาจังหวะของตัวเอง',
    tip2Title: 'คุณไม่ได้อยู่คนเดียว',
    tip2Text: 'ร่างกายแต่ละคนมีเอกลักษณ์ ใช้เวลาของคุณ อดทน และอย่าลังเลที่จะขอความช่วยเหลือจากคนที่คุณไว้ใจ',
    shareTitle: 'ประจำเดือนครั้งแรก · AWA',
    shareMessage: 'ประจำเดือนครั้งแรกของคุณ: สิ่งที่คาดหวังได้ · AWA',
  },
  vi: {
    badge: 'KỲ KINH ĐẦU TIÊN',
    title: 'Kỳ kinh đầu tiên của bạn:\nđiều cần biết',
    metaDuration: '5 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Điều gì là bình thường, điều gì đáng yên tâm và những gì bạn cần biết.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Khi nào kỳ kinh đầu tiên đến?',
      'Điều gì là bình thường',
      'Nó hoạt động như thế nào',
      'Chăm sóc bản thân',
      'Chia sẻ và tìm sự hỗ trợ',
    ],
    details: [
      {title: 'Khi nào kỳ kinh đầu tiên đến?', text: 'Thường đến trong khoảng từ 10 đến 15 tuổi, khoảng hai năm sau những dấu hiệu đầu tiên của tuổi dậy thì.'},
      {title: 'Điều hoàn toàn bình thường', text: 'Lúc đầu, chu kỳ có thể không đều, ngắn hoặc dài. Cơ thể bạn chỉ đang dành thời gian để tìm nhịp điệu của mình.'},
      {title: 'Hiểu cách nó hoạt động', text: 'Kỳ kinh thường kéo dài 3 đến 7 ngày. Lượng và màu máu có thể thay đổi từ ngày này sang ngày khác.'},
      {title: 'Chăm sóc bản thân', text: 'Thay sản phẩm vệ sinh đều đặn, rửa nhẹ nhàng và chọn quần áo thoải mái để bạn cảm thấy dễ chịu.'},
      {title: 'Chia sẻ và tìm sự hỗ trợ', text: 'Bạn có thể nói chuyện với mẹ, chị em gái, một người thân thiết, một giáo viên hoặc một nhân viên y tế mà bạn tin tưởng.'},
    ],
    tip1Title: 'Nên biết',
    tip1Text: 'Chu kỳ không đều lúc ban đầu là hoàn toàn bình thường. Cơ thể bạn vẫn đang học cách tìm nhịp điệu của mình.',
    tip2Title: 'Bạn không đơn độc',
    tip2Text: 'Mỗi cơ thể là duy nhất. Hãy dành thời gian, kiên nhẫn và đừng ngần ngại nhờ giúp đỡ từ một người bạn tin tưởng.',
    shareTitle: 'Kỳ kinh đầu tiên · AWA',
    shareMessage: 'Kỳ kinh đầu tiên của bạn: điều cần biết · AWA',
  },
  uz: {
    badge: 'BIRINCHI HAYZ',
    title: 'Birinchi hayzingiz:\nnimalarni kutish kerak',
    metaDuration: '5 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Nima meʼyor, nima tinchlantiradi va nimani bilish kerak.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Birinchi hayz qachon boshlanadi?',
      'Nima meʼyor hisoblanadi',
      'U qanday ishlaydi',
      'Oʻzingizga gʻamxoʻrlik qilish',
      'Bu haqda gaplashish va yordam olish',
    ],
    details: [
      {title: 'Birinchi hayz qachon boshlanadi?', text: 'U koʻpincha 10 yoshdan 15 yoshgacha, balogʻatga yetishning dastlabki belgilaridan taxminan ikki yil keyin boshlanadi.'},
      {title: 'Mutlaqo meʼyoriy holat', text: 'Dastlab sikllar notekis, qisqa yoki uzun boʻlishi mumkin. Tanangiz shunchaki oʻz ritmini topish uchun vaqt olmoqda.'},
      {title: 'Qanday ishlashini tushunish', text: 'Hayz odatda 3 kundan 7 kungacha davom etadi. Oqim va rang kundan kunga oʻzgarishi mumkin.'},
      {title: 'Oʻzingizga gʻamxoʻrlik qilish', text: 'Himoya vositasini muntazam almashtiring, muloyim yuving va oʻzingizni qulay his qilish uchun qulay kiyim tanlang.'},
      {title: 'Bu haqda gaplashish va yordam olish', text: 'Onangiz, opangiz, yaqin kishingiz, oʻqituvchingiz yoki ishongan shifokoringiz bilan gaplashishingiz mumkin.'},
    ],
    tip1Title: 'Bilish foydali',
    tip1Text: 'Dastlab sikl notekis boʻlishi mutlaqo meʼyoriy holat. Tanangiz hali oʻz ritmini topishni oʻrganmoqda.',
    tip2Title: 'Siz yolgʻiz emassiz',
    tip2Text: 'Har bir tana noyob. Shoshilmang, sabrli boʻling va ishongan kishingizdan yordam soʻrashdan tortinmang.',
    shareTitle: 'Birinchi hayz · AWA',
    shareMessage: 'Birinchi hayzingiz: nimalarni kutish kerak · AWA',
  },
  az: {
    badge: 'İLK AYBAŞI',
    title: 'İlk aybaşınız:\nnələri gözləmək olar',
    metaDuration: '5 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Nə normaldır, nə sakitləşdirir və nəyi bilmək lazımdır.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'İlk aybaşı nə vaxt başlayır?',
      'Nə normaldır',
      'O necə işləyir',
      'Özünüzə qulluq etmək',
      'Bu barədə danışmaq və dəstək almaq',
    ],
    details: [
      {title: 'İlk aybaşı nə vaxt başlayır?', text: 'O, çox vaxt 10 ilə 15 yaş arasında, yetkinləşmənin ilk əlamətlərindən təxminən iki il sonra başlayır.'},
      {title: 'Tamamilə normal haldır', text: 'Əvvəlcə dövrlər qeyri-müntəzəm, qısa və ya uzun ola bilər. Bədəniniz sadəcə öz ritmini tapmaq üçün vaxt alır.'},
      {title: 'Necə işlədiyini anlamaq', text: 'Aybaşı adətən 3 gündən 7 günə qədər davam edir. Axın və rəng gündən-günə dəyişə bilər.'},
      {title: 'Özünüzə qulluq etmək', text: 'Qoruyucu vasitəni müntəzəm dəyişin, mülayim yuyunun və özünüzü rahat hiss etmək üçün rahat geyim seçin.'},
      {title: 'Bu barədə danışmaq və dəstək almaq', text: 'Ananızla, bacınızla, yaxın biri ilə, müəllimlə və ya etibar etdiyiniz tibb işçisi ilə danışa bilərsiniz.'},
    ],
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Əvvəlcə dövrün qeyri-müntəzəm olması tamamilə normaldır. Bədəniniz hələ öz ritmini tapmağı öyrənir.',
    tip2Title: 'Siz tək deyilsiniz',
    tip2Text: 'Hər bədən fərqlidir. Vaxtınızı alın, səbirli olun və etibar etdiyiniz birindən kömək istəməkdən çəkinməyin.',
    shareTitle: 'İlk aybaşı · AWA',
    shareMessage: 'İlk aybaşınız: nələri gözləmək olar · AWA',
  },
  ka: {
    badge: 'პირველი მენსტრუაცია',
    title: 'თქვენი პირველი მენსტრუაცია:\nრას უნდა ელოდეთ',
    metaDuration: '5 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'რა არის ნორმალური, რა გამამშვიდებელია და რა უნდა იცოდეთ.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'როდის მოდის თქვენი პირველი მენსტრუაცია?',
      'რა არის ნორმალური',
      'როგორ მუშაობს ის',
      'საკუთარ თავზე ზრუნვა',
      'ამის შესახებ საუბარი და მხარდაჭერა',
    ],
    details: [
      {title: 'როდის მოდის თქვენი პირველი მენსტრუაცია?', text: 'ის ყველაზე ხშირად 10-დან 15 წლამდე ასაკში მოდის, მოზარდობის პირველი ნიშნებიდან დაახლოებით ორი წლის შემდეგ.'},
      {title: 'რა არის სრულიად ნორმალური', text: 'თავიდან ციკლები შეიძლება არარეგულარული, მოკლე ან გრძელი იყოს. თქვენს სხეულს უბრალოდ დრო სჭირდება საკუთარი რიტმის მოსაძებნად.'},
      {title: 'მისი მუშაობის გაგება', text: 'მენსტრუაცია ჩვეულებრივ 3-დან 7 დღემდე გრძელდება. ნაკადი და ფერი ერთი დღიდან მეორეზე შეიძლება შეიცვალოს.'},
      {title: 'საკუთარ თავზე ზრუნვა', text: 'რეგულარულად შეცვალეთ დამცავი საშუალება, ნაზად დაიბანეთ და აირჩიეთ კომფორტული ტანსაცმელი, რომ თავი კარგად იგრძნოთ.'},
      {title: 'ამის შესახებ საუბარი და მხარდაჭერა', text: 'შეგიძლიათ ესაუბროთ დედას, დას, ახლობელ ადამიანს, მასწავლებელს ან ჯანდაცვის სპეციალისტს, რომელსაც ენდობით.'},
    ],
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'თავიდან არარეგულარული ციკლი სრულიად ნორმალურია. თქვენი სხეული ჯერ კიდევ სწავლობს საკუთარი რიტმის პოვნას.',
    tip2Title: 'თქვენ მარტო არ ხართ',
    tip2Text: 'ყველა სხეული უნიკალურია. მიეცით თავს დრო, იყავით მოთმინებით და ნუ დააყოვნებთ ისეთი ადამიანისგან დახმარების თხოვნას, რომელსაც ენდობით.',
    shareTitle: 'პირველი მენსტრუაცია · AWA',
    shareMessage: 'თქვენი პირველი მენსტრუაცია: რას უნდა ელოდეთ · AWA',
  },
  hy: {
    badge: 'ԱՌԱՋԻՆ ԴԱՇՏԱՆ',
    title: 'Ձեր առաջին դաշտանը.\nինչ սպասել',
    metaDuration: '5 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ինչն է նորմալ, ինչն է հանգստացնող և ինչ պետք է իմանալ:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ե՞րբ է գալիս առաջին դաշտանը',
      'Ինչն է նորմալ',
      'Ինչպես է այն աշխատում',
      'Հոգ տանել ձեր մասին',
      'Խոսել այդ մասին և աջակցություն ստանալ',
    ],
    details: [
      {title: 'Ե՞րբ է գալիս առաջին դաշտանը', text: 'Այն ամենից հաճախ գալիս է 10–15 տարեկանում, սեռական հասունացման առաջին նշաններից մոտ երկու տարի անց:'},
      {title: 'Ինչն է լիովին նորմալ', text: 'Սկզբում ցիկլերը կարող են լինել անկանոն, կարճ կամ երկար: Ձեր մարմինը պարզապես ժամանակ է տալիս իրեն՝ իր ռիթմը գտնելու համար:'},
      {title: 'Հասկանալ, թե ինչպես է այն աշխատում', text: 'Դաշտանները սովորաբար տևում են 3–7 օր: Արտահոսքը և գույնը կարող են փոխվել մի օրից մյուսը:'},
      {title: 'Հոգ տանել ձեր մասին', text: 'Պաշտպանության միջոցը փոխեք կանոնավոր, լվացվեք մեղմ և ընտրեք հարմարավետ հագուստ, որպեսզի ինքներդ ձեզ հանգիստ զգաք:'},
      {title: 'Խոսել այդ մասին և աջակցություն ստանալ', text: 'Կարող եք խոսել մոր, քրոջ, ձեզ մոտ մարդու, ուսուցչի կամ ձեր վստահած առողջապահության մասնագետի հետ:'},
    ],
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Սկզբում անկանոն ցիկլը լիովին նորմալ է: Ձեր մարմինը դեռ սովորում է գտնել իր ռիթմը:',
    tip2Title: 'Դուք մենակ չեք',
    tip2Text: 'Յուրաքանչյուր մարմին եզակի է: Ժամանակ տվեք, համբերատար եղեք և մի տատանվեք օգնություն խնդրել ձեր վստահած մարդուց:',
    shareTitle: 'Առաջին դաշտան · AWA',
    shareMessage: 'Ձեր առաջին դաշտանը. ինչ սպասել · AWA',
  },
  tg: {
    badge: 'ҲАЙЗИ АВВАЛ',
    title: 'Ҳайзи аввали шумо:\nчӣ интизор шудан лозим аст',
    metaDuration: '5 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Чӣ муқаррарӣ аст, чӣ оромбахш аст ва шумо бояд чӣ донед.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Ҳайзи аввал кай меояд?',
      'Чӣ муқаррарӣ аст',
      'Чӣ тавр кор мекунад',
      'Ғамхорӣ аз худ',
      'Гап задан дар ин бора ва гирифтани дастгирӣ',
    ],
    details: [
      {title: 'Ҳайзи аввал кай меояд?', text: 'Он аксар вақт байни 10 ва 15-солагӣ, тақрибан ду сол пас аз аввалин нишонаҳои балоғат меояд.'},
      {title: 'Чӣ комилан муқаррарӣ аст', text: 'Дар аввал давраҳо метавонанд номунтазам, кӯтоҳ ё дароз бошанд. Бадани шумо танҳо вақт мегирад, то суръати худро ёбад.'},
      {title: 'Фаҳмидани тарзи кор', text: 'Ҳайз одатан 3 то 7 рӯз давом мекунад. Ҷараён ва ранг метавонанд аз як рӯз то рӯзи дигар тағйир ёбанд.'},
      {title: 'Ғамхорӣ аз худ', text: 'Воситаи муҳофизатро мунтазам иваз кунед, нарм шӯед ва либоси роҳат интихоб кунед, то худро хуб ҳис кунед.'},
      {title: 'Гап задан дар ин бора ва гирифтани дастгирӣ', text: 'Шумо метавонед бо модар, хоҳар, шахси наздик, муаллим ё мутахассиси соҳаи тибе, ки ба ӯ боварӣ доред, гап занед.'},
    ],
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Давраи номунтазам дар аввал комилан муқаррарӣ аст. Бадани шумо ҳанӯз меомӯзад, ки суръати худро чӣ тавр ёбад.',
    tip2Title: 'Шумо танҳо нестед',
    tip2Text: 'Ҳар бадан беназир аст. Вақт гиред, сабр кунед ва аз касе, ки ба ӯ боварӣ доред, кумак пурсидан шарм надоред.',
    shareTitle: 'Ҳайзи аввал · AWA',
    shareMessage: 'Ҳайзи аввали шумо: чӣ интизор шудан лозим аст · AWA',
  },
  ky: {
    badge: 'БИРИНЧИ ЕТЕК КИРИМ',
    title: 'Биринчи етек кирим:\nэмне күтүү керек',
    metaDuration: '5 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Эмне кадимки, эмне тынчтандырат жана эмнени билүү керек.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Биринчи етек кирим качан келет?',
      'Эмне кадимки',
      'Ал кантип иштейт',
      'Өзүңүзгө кам көрүү',
      'Бул жөнүндө сүйлөшүү жана колдоо алуу',
    ],
    details: [
      {title: 'Биринчи етек кирим качан келет?', text: 'Ал көбүнчө 10 менен 15 жаштын ортосунда, балагатка жетүүнүн алгачкы белгилеринен болжол менен эки жылдан кийин келет.'},
      {title: 'Толугу менен кадимки көрүнүш', text: 'Башында циклдер туура эмес, кыска же узун болушу мүмкүн. Денеңиз өз ритмин табууга жөн гана убакыт алат.'},
      {title: 'Ал кантип иштээрин түшүнүү', text: 'Етек кирим адатта 3–7 күн созулат. Агым жана түс күндөн күнгө өзгөрүшү мүмкүн.'},
      {title: 'Өзүңүзгө кам көрүү', text: 'Коргонуу каражатыңызды үзгүлтүксүз алмаштырыңыз, жумшак жуунуңуз жана өзүңүздү ыңгайлуу сезүү үчүн ыңгайлуу кийим тандаңыз.'},
      {title: 'Бул жөнүндө сүйлөшүү жана колдоо алуу', text: 'Апаңыз, эжеңиз, жакын адамыңыз, мугалимиңиз же ишенген ден соолук сактоо адиси менен сүйлөшө аласыз.'},
    ],
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Башында цикл туура эмес болушу толугу менен кадимки көрүнүш. Денеңиз ритмин табууну дагы эле үйрөнүп жатат.',
    tip2Title: 'Сиз жалгыз эмессиз',
    tip2Text: 'Ар бир дене уникалдуу. Убакыт алыңыз, сабырдуу болуңуз жана ишенген адамыңыздан жардам сурап кайрылуудан тартынбаңыз.',
    shareTitle: 'Биринчи етек кирим · AWA',
    shareMessage: 'Биринчи етек кирим: эмне күтүү керек · AWA',
  },
  tk: {
    badge: 'ILKINJI AÝBAŞY',
    title: 'Ilkinji aýbaşyňyz:\nnämä garaşmaly',
    metaDuration: '5 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Nämäniň adatydygy, nämäniň köňül rahatlandyrýandygy we bilmeli zatlaryňyz.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Ilkinji aýbaşy haçan gelýär?',
      'Nämäniň adatydygy',
      'Ol nähili işleýär',
      'Özüňize ideg etmek',
      'Ol barada gürleşmek we goldaw almak',
    ],
    details: [
      {title: 'Ilkinji aýbaşy haçan gelýär?', text: 'Ol köplenç 10 bilen 15 ýaşyň arasynda, ýetginjeklik başlanyň ilkinji alamatlaryndan takmynan iki ýyl soň gelýär.'},
      {title: 'Doly adaty zatlar', text: 'Ilkibaşda siklleriň düzgünsiz, gysga ýa-da uzyn bolmagy mümkin. Bedeniňiz diňe öz ritmini tapmaga wagt alýar.'},
      {title: 'Onuň nähili işleýändigini düşünmek', text: 'Aýbaşy adatça 3–7 gün dowam edýär. Gan akma we reňk günden güne üýtgäp biler.'},
      {title: 'Özüňize ideg etmek', text: 'Goranyş serişdesini yzygiderli çalşyň, ýumşak ýuwuň we özüňizi rahat duýmak üçin rahat eşik saýlaň.'},
      {title: 'Ol barada gürleşmek we goldaw almak', text: 'Eneňiz, uýaňyz, ýakyn adamyňyz, mugallymyňyz ýa-da ynanýan saglyk hünärmeniňiz bilen gürleşip bilersiňiz.'},
    ],
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Ilkibaşdaky düzgünsiz sikl doly adaty zat. Bedeniňiz henizem öz ritmini tapmagy öwrenýär.',
    tip2Title: 'Siz ýeke däl',
    tip2Text: 'Her bedeniň özboluşlylygy bar. Wagtyňyzy alyň, sabyr ediň we ynanýan adamyňyzdan kömek soramakdan çekinmäň.',
    shareTitle: 'Ilkinji aýbaşy · AWA',
    shareMessage: 'Ilkinji aýbaşyňyz: nämä garaşmaly · AWA',
  },
  ms: {
    badge: 'HAID PERTAMA',
    title: 'Haid pertama anda:\napa yang dijangka',
    metaDuration: '5 min bacaan',
    metaType: 'Panduan',
    metaLevel: 'Permulaan',
    metaValidated: 'Kandungan disemak',
    intro: 'Apa yang normal, apa yang menenangkan, dan apa yang perlu anda tahu.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Bilakah haid pertama anda tiba?',
      'Apa yang normal',
      'Bagaimana ia berfungsi',
      'Menjaga diri anda',
      'Berbincang tentangnya dan mendapatkan sokongan',
    ],
    details: [
      {title: 'Bilakah haid pertama anda tiba?', text: 'Ia paling kerap tiba antara umur 10 dan 15 tahun, kira-kira dua tahun selepas tanda pertama akil baligh.'},
      {title: 'Apa yang sepenuhnya normal', text: 'Pada mulanya, kitaran boleh tidak teratur, pendek atau panjang. Tubuh anda hanya mengambil masa untuk menemui rentaknya.'},
      {title: 'Memahami bagaimana ia berfungsi', text: 'Haid biasanya berlangsung 3 hingga 7 hari. Aliran dan warnanya boleh berubah dari satu hari ke hari berikutnya.'},
      {title: 'Menjaga diri anda', text: 'Tukar perlindungan anda dengan kerap, basuh dengan lembut, dan pilih pakaian yang selesa supaya anda berasa tenang.'},
      {title: 'Berbincang tentangnya dan mendapatkan sokongan', text: 'Anda boleh berbincang dengan ibu anda, kakak, orang yang rapat dengan anda, guru atau pengamal penjagaan kesihatan yang anda percayai.'},
    ],
    tip1Title: 'Elok diketahui',
    tip1Text: 'Kitaran yang tidak teratur pada mulanya adalah sepenuhnya normal. Tubuh anda masih belajar menemui rentaknya.',
    tip2Title: 'Anda tidak keseorangan',
    tip2Text: 'Setiap tubuh adalah unik. Luangkan masa, bersabarlah, dan jangan teragak-agak meminta bantuan daripada seseorang yang anda percayai.',
    shareTitle: 'Haid pertama · AWA',
    shareMessage: 'Haid pertama anda: apa yang dijangka · AWA',
  },
  so: {
    badge: 'CAADADA UGU HORREYSA',
    title: 'Caadadaada ugu horreysa:\nwaxa la filayo',
    metaDuration: '5 daq akhris',
    metaType: 'Hage',
    metaLevel: 'Bilow',
    metaValidated: 'Macluumaad la dib-u-eegay',
    intro: 'Waxa caadi ah, waxa quus gooya, iyo waxa aad ogaan lahayd.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Goorma ayay caadadaada ugu horreysa imaanaysaa?',
      'Waxa caadi ah',
      'Sida ay u shaqayso',
      'Naftaada daryeel',
      'La hadalka iyo helitaanka taageero',
    ],
    details: [
      {title: 'Goorma ayay caadadaada ugu horreysa imaanaysaa?', text: 'Inta badan waxay imaanaysaa u dhexeeya da’da 10 iyo 15, qiyaastii laba sano ka dib calaamadihii ugu horreeyay ee qaangaarka.'},
      {title: 'Waxa gabi ahaanba caadi ah', text: 'Bilowga, wareegyadu waxay noqon karaan kuwo aan joogto ahayn, gaaban, ama dheer. Jidhkaagu wuxuu si fudud qaadanayaa waqtigiisa si uu u helo xawaarihiisa.'},
      {title: 'Fahamka sida ay u shaqayso', text: 'Caadooyinku badiyaa waxay socdaan 3 ilaa 7 maalmood. Socodka iyo midabku wuu isbeddeli karaa maalin ilaa maalin.'},
      {title: 'Naftaada daryeel', text: 'Beddel ilaalintaada si joogto ah, si tartiib ah dhaq, oo dooro dhar raaxo leh si aad u raaxaysato.'},
      {title: 'La hadalka iyo helitaanka taageero', text: 'Waxaad la hadli kartaa hooyadaa, walaashaa, qof kuu dhow, macallin, ama xirfadle caafimaad oo aad ku kalsoon tahay.'},
    ],
    tip1Title: 'Waxtar leh in la ogaado',
    tip1Text: 'Wareeg aan joogto ahayn bilowga waa gabi ahaanba caadi. Jidhkaagu weli wuu baranayaa sida uu u helo xawaarihiisa.',
    tip2Title: 'Kaligaa ma tihid',
    tip2Text: 'Jidh kastaa waa mid gaar ah. Qaado waqtigaaga, samir yeelo, oo ha ka waaban inaad caawimaad weydiisato qof aad ku kalsoon tahay.',
    shareTitle: 'Caadada ugu horreysa · AWA',
    shareMessage: 'Caadadaada ugu horreysa: waxa la filayo · AWA',
  },
  sw: {
    badge: 'HEDHI YA KWANZA',
    title: 'Hedhi yako ya kwanza:\nnini cha kutarajia',
    metaDuration: 'Dakika 5 za kusoma',
    metaType: 'Mwongozo',
    metaLevel: 'Mwanzo',
    metaValidated: 'Maudhui yaliyokaguliwa',
    intro: 'Kilicho cha kawaida, kinachotuliza, na unachohitaji kujua.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Hedhi yako ya kwanza itafika lini?',
      'Kilicho cha kawaida',
      'Jinsi inavyofanya kazi',
      'Kujitunza',
      'Kuzungumza kuihusu na kupata msaada',
    ],
    details: [
      {title: 'Hedhi yako ya kwanza itafika lini?', text: 'Mara nyingi hufika kati ya umri wa miaka 10 na 15, takriban miaka miwili baada ya dalili za kwanza za balehe.'},
      {title: 'Kilicho cha kawaida kabisa', text: 'Mwanzoni, mizunguko inaweza kuwa isiyo ya mpangilio, mifupi, au mirefu. Mwili wako unachukua tu muda wake kupata mdundo wake.'},
      {title: 'Kuelewa jinsi inavyofanya kazi', text: 'Hedhi kwa kawaida hudumu siku 3 hadi 7. Mtiririko na rangi vinaweza kubadilika kutoka siku moja hadi nyingine.'},
      {title: 'Kujitunza', text: 'Badilisha kinga yako mara kwa mara, osha kwa upole, na uchague nguo za starehe ili ujisikie huru.'},
      {title: 'Kuzungumza kuihusu na kupata msaada', text: 'Unaweza kuzungumza na mama yako, dada, mtu wa karibu nawe, mwalimu, au mtaalamu wa afya unayemwamini.'},
    ],
    tip1Title: 'Vyema kujua',
    tip1Text: 'Mzunguko usio wa mpangilio mwanzoni ni wa kawaida kabisa. Mwili wako bado unajifunza jinsi ya kupata mdundo wake.',
    tip2Title: 'Hauko peke yako',
    tip2Text: 'Kila mwili ni wa kipekee. Chukua muda wako, kuwa mvumilivu, na usisite kuomba msaada kwa mtu unayemwamini.',
    shareTitle: 'Hedhi ya kwanza · AWA',
    shareMessage: 'Hedhi yako ya kwanza: nini cha kutarajia · AWA',
  },
  kk: {
    badge: 'АЛҒАШҚЫ ЕТЕККІР',
    title: 'Алғашқы етеккіріңіз:\nнені күту керек',
    metaDuration: '5 мин оқу',
    metaType: 'Нұсқаулық',
    metaLevel: 'Бастауыш',
    metaValidated: 'Тексерілген мазмұн',
    intro: 'Не қалыпты, не сендіреді және не білу керек.',
    contentsTitle: 'Осы мақалада',
    topics: [
      'Алғашқы етеккір қашан келеді?',
      'Не қалыпты',
      'Ол қалай жұмыс істейді',
      'Өзіңізге қамқор болу',
      'Бұл туралы сөйлесу және қолдау табу',
    ],
    details: [
      {title: 'Алғашқы етеккір қашан келеді?', text: 'Ол көбіне 10-нан 15 жасқа дейін, жыныстық жетілудің алғашқы белгілерінен шамамен екі жыл өткен соң келеді.'},
      {title: 'Мүлдем қалыпты нәрсе', text: 'Алғашында циклдар тұрақсыз, қысқа немесе ұзақ болуы мүмкін. Денеңіз жай ғана өз ырғағын табуға уақыт алып жатыр.'},
      {title: 'Оның қалай жұмыс істейтінін түсіну', text: 'Етеккір әдетте 3-тен 7 күнге дейін созылады. Көлемі мен түсі бір күннен екіншісіне өзгеруі мүмкін.'},
      {title: 'Өзіңізге қамқор болу', text: 'Қорғаныс құралыңызды тұрақты ауыстырыңыз, жұмсақ жуыныңыз және өзіңізді жайлы сезіну үшін ыңғайлы киім таңдаңыз.'},
      {title: 'Бұл туралы сөйлесу және қолдау табу', text: 'Анаңызбен, әпкеңізбен, жақын адамыңызбен, мұғалімімен немесе сенетін медицина маманымен сөйлесе аласыз.'},
    ],
    tip1Title: 'Білуге тиісті',
    tip1Text: 'Алғашында тұрақсыз цикл мүлдем қалыпты. Денеңіз әлі өз ырғағын табуды үйреніп жатыр.',
    tip2Title: 'Сіз жалғыз емессіз',
    tip2Text: 'Әр дене бірегей. Уақыт алыңыз, шыдамды болыңыз және сенетін адамнан көмек сұраудан тартынбаңыз.',
    shareTitle: 'Алғашқы етеккір · AWA',
    shareMessage: 'Алғашқы етеккіріңіз: нені күту керек · AWA',
  },
  wo: {
    badge: 'RÈGLE BU NJËKK',
    title: 'Sa règle bu njëkk:\nlu ñuy xaar',
    metaDuration: '5 simili jàng',
    metaType: 'Ndigal',
    metaLevel: 'Tàmbali',
    metaValidated: 'Mbind bu ñu seetlu',
    intro: 'Li daa jub, li di dalal ak li war a xam.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Kañ la sa règle bu njëkk di dikk?',
      'Li daa jub',
      'Naka mu di dem',
      'Yër sa bopp',
      'Wax ak am dimbali',
    ],
    details: [
      {title: 'Kañ la sa règle bu njëkk di dikk?', text: 'Dafay dikk ci wetu at 10 ba 15, ci wetu ñaari at ginnaaw màndarga yu njëkk yu mag.'},
      {title: 'Li daa jub ba noppi', text: 'Ci njëkk, wërsëg yi mën nañu nekk yu jubul, yu gàtt walla yu gudd. Sa yaram dafay jël jamono rekk ngir gis sa ritm.'},
      {title: 'Xam naka mu di dem', text: 'Règle yi daa yàgg 3 ba 7 fan. Deret bi ak kuloorëm mën nañu soppiku ci fan ak fan.'},
      {title: 'Yër sa bopp', text: 'Soppil sa aar ci yoon, ndaw ci lewet te tànn yéré yu neex ngir nekk ci jàmm.'},
      {title: 'Wax ak am dimbali', text: 'Mën nga wax ak sa yaay, benn rakk, benn nit ku jegeel la, benn jàngalekat walla benn liggéeykatu wér bu nga wóolu.'},
    ],
    tip1Title: 'Lu baax a xam',
    tip1Text: 'Wërsëg bu jubul ci njëkk daa jub ba noppi. Sa yaram ngi jàng ba tey naka muy gis sa ritm.',
    tip2Title: 'Yaw rekk nekkoo',
    tip2Text: 'Yaram bu nekk wuute na. Jël sa jamono, muñ te bu ñaaw a ñaan dimbali ci kenn ku nga wóolu.',
    shareTitle: 'Règle bu njëkk · AWA',
    shareMessage: 'Sa règle bu njëkk: lu ñuy xaar · AWA',
  },
  ha: {
    badge: 'HAILAR FARKO',
    title: 'Hailarki ta farko:\nabin da za ki tsammata',
    metaDuration: 'karatun minti 5',
    metaType: 'Jagora',
    metaLevel: 'Mafari',
    metaValidated: 'Abun da aka duba',
    intro: 'Abin da ke na al’ada, abin da ke kwantar da hankali, da abin da ya kamata ki sani.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Yaushe hailarki ta farko za ta zo?',
      'Abin da ke na al’ada',
      'Yadda take aiki',
      'Kula da kanki',
      'Magana game da ita da neman tallafi',
    ],
    details: [
      {title: 'Yaushe hailarki ta farko za ta zo?', text: 'Galibi tana zuwa tsakanin shekaru 10 zuwa 15, kusan shekaru biyu bayan alamomin balaga na farko.'},
      {title: 'Abin da ke na al’ada gaba ɗaya', text: 'A farko, zagaye na iya zama marasa tsari, gajeru, ko dogaye. Jikinki yana ɗaukar lokaci kawai don samun tsarinsa.'},
      {title: 'Fahimtar yadda take aiki', text: 'Haila yawanci tana ɗaukar kwana 3 zuwa 7. Yawan jini da launi na iya canzawa daga rana zuwa rana.'},
      {title: 'Kula da kanki', text: 'Canza kariyarki akai-akai, wanke jiki a hankali, kuma zaɓi tufafi masu daɗi don ki ji daɗi.'},
      {title: 'Magana game da ita da neman tallafi', text: 'Za ki iya magana da mahaifiyarki, ’yar’uwa, wani na kusa da ke, malama, ko ma’aikacin lafiya da kike amincewa da shi.'},
    ],
    tip1Title: 'Abin da ya dace a sani',
    tip1Text: 'Zagaye mara tsari a farko al’ada ne gaba ɗaya. Jikinki har yanzu yana koyon yadda zai samu tsarinsa.',
    tip2Title: 'Ba ke kaɗai ba ce',
    tip2Text: 'Kowane jiki na musamman ne. Ɗauki lokacinki, yi haƙuri, kuma kada ki yi jinkirin neman taimako daga wanda kike amincewa da shi.',
    shareTitle: 'Hailar farko · AWA',
    shareMessage: 'Hailarki ta farko: abin da za ki tsammata · AWA',
  },
  am: {
    badge: 'የመጀመሪያ የወር አበባ',
    title: 'የመጀመሪያ የወር አበባሽ፦\nምን መጠበቅ',
    metaDuration: '5 ደቂቃ ንባብ',
    metaType: 'መመሪያ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'የተረጋገጠ ይዘት',
    intro: 'ምን የተለመደ ነው፣ ምን ያረጋጋል፣ እና ምን ማወቅ እንዳለብሽ።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'የመጀመሪያ የወር አበባሽ መቼ ይመጣል?',
      'የተለመደው ምንድን ነው',
      'እንዴት እንደሚሠራ',
      'ራስሽን መንከባከብ',
      'ስለሱ መነጋገር እና ድጋፍ ማግኘት',
    ],
    details: [
      {title: 'የመጀመሪያ የወር አበባሽ መቼ ይመጣል?', text: 'ብዙውን ጊዜ ከ10 እስከ 15 ዓመት መካከል፣ ከጉርምስና የመጀመሪያ ምልክቶች ከሁለት ዓመት አካባቢ በኋላ ይመጣል።'},
      {title: 'ሙሉ በሙሉ የተለመደው', text: 'በመጀመሪያ ዑደቶች ወጥ ያልሆኑ፣ አጫጭር ወይም ረጃጅም ሊሆኑ ይችላሉ። ሰውነትሽ ሪትሙን ለማግኘት ጊዜውን እየወሰደ ነው።'},
      {title: 'እንዴት እንደሚሠራ መረዳት', text: 'የወር አበባ ብዙውን ጊዜ ከ3 እስከ 7 ቀናት ይቆያል። ፍሰቱና ቀለሙ ከቀን ወደ ቀን ሊለወጥ ይችላል።'},
      {title: 'ራስሽን መንከባከብ', text: 'መከላከያሽን በየጊዜው ቀይሪ፣ በቀስታ ታጠቢ፣ እና ምቾት እንዲሰማሽ ምቹ ልብስ ምረጪ።'},
      {title: 'ስለሱ መነጋገር እና ድጋፍ ማግኘት', text: 'ከእናትሽ፣ ከእህትሽ፣ ከቅርብ ሰው፣ ከመምህር ወይም ከምታምኚው የጤና ባለሙያ ጋር መነጋገር ትችያለሽ።'},
    ],
    tip1Title: 'ማወቅ ጠቃሚ ነው',
    tip1Text: 'በመጀመሪያ ወጥ ያልሆነ ዑደት ፍጹም የተለመደ ነው። ሰውነትሽ አሁንም ሪትሙን እንዴት እንደሚያገኝ እየተማረ ነው።',
    tip2Title: 'ብቻሽን አይደለሽም',
    tip2Text: 'እያንዳንዱ አካል ልዩ ነው። ጊዜሽን ውሰጂ፣ ታገሺ፣ እና ከምታምኚው ሰው እርዳታ ለመጠየቅ አትዘገዪ።',
    shareTitle: 'የመጀመሪያ የወር አበባ · AWA',
    shareMessage: 'የመጀመሪያ የወር አበባሽ፦ ምን መጠበቅ · AWA',
  },
  nl: {
    badge: 'EERSTE MENSTRUATIE',
    title: 'Je eerste menstruatie:\nwat je kunt verwachten',
    metaDuration: '5 min lezen',
    metaType: 'Gids',
    metaLevel: 'Beginner',
    metaValidated: 'Gecontroleerde inhoud',
    intro: 'Wat normaal is, wat geruststellend is en wat je moet weten.',
    contentsTitle: 'In dit artikel',
    topics: [
      'Wanneer komt je eerste menstruatie?',
      'Wat normaal is',
      'Hoe het werkt',
      'Voor jezelf zorgen',
      'Erover praten en steun krijgen',
    ],
    details: [
      {title: 'Wanneer komt je eerste menstruatie?', text: 'Ze komt meestal tussen de leeftijd van 10 en 15 jaar, ongeveer twee jaar na de eerste tekenen van de puberteit.'},
      {title: 'Wat volkomen normaal is', text: 'In het begin kunnen cycli onregelmatig, kort of lang zijn. Je lichaam neemt gewoon de tijd om zijn ritme te vinden.'},
      {title: 'Begrijpen hoe het werkt', text: 'Menstruaties duren meestal 3 tot 7 dagen. De hoeveelheid en de kleur kunnen van dag tot dag veranderen.'},
      {title: 'Voor jezelf zorgen', text: 'Verwissel je bescherming regelmatig, was je zacht en kies comfortabele kleding zodat je je op je gemak voelt.'},
      {title: 'Erover praten en steun krijgen', text: 'Je kunt praten met je moeder, een zus, iemand in je omgeving, een leraar of een zorgverlener die je vertrouwt.'},
    ],
    tip1Title: 'Goed om te weten',
    tip1Text: 'Een onregelmatige cyclus in het begin is volkomen normaal. Je lichaam is nog aan het leren zijn ritme te vinden.',
    tip2Title: 'Je staat er niet alleen voor',
    tip2Text: 'Elk lichaam is uniek. Neem de tijd, heb geduld en aarzel niet om hulp te vragen aan iemand die je vertrouwt.',
    shareTitle: 'Eerste menstruatie · AWA',
    shareMessage: 'Je eerste menstruatie: wat je kunt verwachten · AWA',
  },
  fi: {
    badge: 'ENSIMMÄISET KUUKAUTISET',
    title: 'Ensimmäiset kuukautisesi:\nmitä odottaa',
    metaDuration: '5 min lukuaika',
    metaType: 'Opas',
    metaLevel: 'Aloittelija',
    metaValidated: 'Tarkistettu sisältö',
    intro: 'Mikä on normaalia, mikä rauhoittavaa ja mitä sinun on hyvä tietää.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Milloin ensimmäiset kuukautiset tulevat?',
      'Mikä on normaalia',
      'Miten se toimii',
      'Itsestäsi huolehtiminen',
      'Asiasta puhuminen ja tuen saaminen',
    ],
    details: [
      {title: 'Milloin ensimmäiset kuukautiset tulevat?', text: 'Ne tulevat useimmiten 10–15 vuoden iässä, noin kaksi vuotta murrosiän ensimmäisten merkkien jälkeen.'},
      {title: 'Mikä on täysin normaalia', text: 'Aluksi kierrot voivat olla epäsäännöllisiä, lyhyitä tai pitkiä. Kehosi vain ottaa aikansa löytääkseen rytminsä.'},
      {title: 'Toiminnan ymmärtäminen', text: 'Kuukautiset kestävät yleensä 3–7 päivää. Vuodon määrä ja väri voivat muuttua päivästä toiseen.'},
      {title: 'Itsestäsi huolehtiminen', text: 'Vaihda suojasi säännöllisesti, pese lempeästi ja valitse mukavat vaatteet, jotta tunnet olosi helpoksi.'},
      {title: 'Asiasta puhuminen ja tuen saaminen', text: 'Voit puhua äidillesi, siskollesi, läheiselle, opettajalle tai luottamallesi terveydenhuollon ammattilaiselle.'},
    ],
    tip1Title: 'Hyvä tietää',
    tip1Text: 'Aluksi epäsäännöllinen kierto on täysin normaalia. Kehosi opettelee vielä löytämään rytminsä.',
    tip2Title: 'Et ole yksin',
    tip2Text: 'Jokainen keho on ainutlaatuinen. Ota aikasi, ole kärsivällinen äläkä epäröi pyytää apua luottamaltasi ihmiseltä.',
    shareTitle: 'Ensimmäiset kuukautiset · AWA',
    shareMessage: 'Ensimmäiset kuukautisesi: mitä odottaa · AWA',
  },
  el: {
    badge: 'ΠΡΩΤΗ ΠΕΡΙΟΔΟΣ',
    title: 'Η πρώτη σου περίοδος:\nτι να περιμένεις',
    metaDuration: '5 λεπτά ανάγνωσης',
    metaType: 'Οδηγός',
    metaLevel: 'Αρχάριο',
    metaValidated: 'Ελεγμένο περιεχόμενο',
    intro: 'Τι είναι φυσιολογικό, τι καθησυχαστικό και τι πρέπει να γνωρίζεις.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Πότε έρχεται η πρώτη σου περίοδος;',
      'Τι είναι φυσιολογικό',
      'Πώς λειτουργεί',
      'Φρόντισε τον εαυτό σου',
      'Μίλησε γι’ αυτό και βρες στήριξη',
    ],
    details: [
      {title: 'Πότε έρχεται η πρώτη σου περίοδος;', text: 'Έρχεται συνήθως ανάμεσα στα 10 και στα 15, περίπου δύο χρόνια μετά τα πρώτα σημάδια της εφηβείας.'},
      {title: 'Τι είναι απόλυτα φυσιολογικό', text: 'Στην αρχή, οι κύκλοι μπορεί να είναι ακανόνιστοι, σύντομοι ή μεγάλοι. Το σώμα σου απλώς παίρνει τον χρόνο του για να βρει τον ρυθμό του.'},
      {title: 'Κατανοώντας πώς λειτουργεί', text: 'Οι περίοδοι διαρκούν συνήθως 3 έως 7 ημέρες. Η ροή και το χρώμα μπορεί να αλλάζουν από μέρα σε μέρα.'},
      {title: 'Φροντίζοντας τον εαυτό σου', text: 'Άλλαζε την προστασία σου τακτικά, πλένεσαι απαλά και διάλεγε άνετα ρούχα για να νιώθεις άνετα.'},
      {title: 'Μιλώντας γι’ αυτό και βρίσκοντας στήριξη', text: 'Μπορείς να μιλήσεις με τη μητέρα σου, μια αδελφή, κάποιον κοντινό σου, μια δασκάλα ή έναν επαγγελματία υγείας που εμπιστεύεσαι.'},
    ],
    tip1Title: 'Καλό είναι να γνωρίζεις',
    tip1Text: 'Ένας ακανόνιστος κύκλος στην αρχή είναι απόλυτα φυσιολογικός. Το σώμα σου μαθαίνει ακόμη πώς να βρίσκει τον ρυθμό του.',
    tip2Title: 'Δεν είσαι μόνη',
    tip2Text: 'Κάθε σώμα είναι μοναδικό. Πάρε τον χρόνο σου, κάνε υπομονή και μην διστάσεις να ζητήσεις βοήθεια από κάποιον που εμπιστεύεσαι.',
    shareTitle: 'Πρώτη περίοδος · AWA',
    shareMessage: 'Η πρώτη σου περίοδος: τι να περιμένεις · AWA',
  },
  fil: {
    badge: 'UNANG REGLA',
    title: 'Ang iyong unang regla:\nano ang aasahan',
    metaDuration: '5 min na babasahin',
    metaType: 'Gabay',
    metaLevel: 'Baguhan',
    metaValidated: 'Sinuring nilalaman',
    intro: 'Ano ang normal, ano ang nakakapanatag, at ano ang kailangan mong malaman.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Kailan dumarating ang iyong unang regla?',
      'Ano ang normal',
      'Paano ito gumagana',
      'Pag-aalaga sa sarili',
      'Pag-uusap tungkol dito at paghahanap ng suporta',
    ],
    details: [
      {title: 'Kailan dumarating ang iyong unang regla?', text: 'Madalas itong dumarating sa pagitan ng edad na 10 at 15, humigit-kumulang dalawang taon matapos ang mga unang senyales ng pagdadalaga.'},
      {title: 'Ang ganap na normal', text: 'Sa simula, maaaring hindi regular, maikli, o mahaba ang mga siklo. Kinukuha lamang ng iyong katawan ang oras nito para mahanap ang ritmo.'},
      {title: 'Pag-unawa kung paano ito gumagana', text: 'Karaniwang tumatagal ng 3 hanggang 7 araw ang mga regla. Maaaring magbago ang daloy at kulay mula araw-araw.'},
      {title: 'Pag-aalaga sa sarili', text: 'Palitan nang regular ang iyong proteksyon, maghugas nang banayad, at pumili ng komportableng damit para maging maginhawa ka.'},
      {title: 'Pag-uusap tungkol dito at paghahanap ng suporta', text: 'Maaari kang makipag-usap sa iyong ina, kapatid na babae, isang taong malapit sa iyo, isang guro, o isang propesyonal sa kalusugan na pinagkakatiwalaan mo.'},
    ],
    tip1Title: 'Mabuting malaman',
    tip1Text: 'Ganap na normal ang hindi regular na siklo sa simula. Natututo pa ang iyong katawan kung paano mahanap ang ritmo nito.',
    tip2Title: 'Hindi ka nag-iisa',
    tip2Text: 'Natatangi ang bawat katawan. Maglaan ng oras, maging matiyaga, at huwag mag-atubiling humingi ng tulong sa isang taong pinagkakatiwalaan mo.',
    shareTitle: 'Unang regla · AWA',
    shareMessage: 'Ang iyong unang regla: ano ang aasahan · AWA',
  },
  ta: {
    badge: 'முதல் மாதவிடாய்',
    title: 'உங்கள் முதல் மாதவிடாய்:\nஎன்ன எதிர்பார்ப்பது',
    metaDuration: '5 நிமிடம் படிக்க',
    metaType: 'வழிகாட்டி',
    metaLevel: 'தொடக்க நிலை',
    metaValidated: 'சரிபார்க்கப்பட்ட உள்ளடக்கம்',
    intro: 'எது இயல்பு, எது ஆறுதல் தருகிறது, நீங்கள் என்ன தெரிந்துகொள்ள வேண்டும்.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      'உங்கள் முதல் மாதவிடாய் எப்போது வருகிறது?',
      'எது இயல்பு',
      'அது எப்படிச் செயல்படுகிறது',
      'உங்களைக் கவனித்துக்கொள்ளுதல்',
      'அதைப் பற்றிப் பேசுதல், ஆதரவு பெறுதல்',
    ],
    details: [
      {title: 'உங்கள் முதல் மாதவிடாய் எப்போது வருகிறது?', text: 'பெரும்பாலும் 10 முதல் 15 வயதுக்குள் வருகிறது, பருவமடைதலின் முதல் அறிகுறிகளுக்குப் பின் ஏறக்குறைய இரண்டு ஆண்டுகளில்.'},
      {title: 'முற்றிலும் இயல்பானது', text: 'தொடக்கத்தில், சுழற்சிகள் ஒழுங்கற்றதாக, குறுகியதாக அல்லது நீண்டதாக இருக்கலாம். உங்கள் உடல் தன் தாளத்தைக் கண்டறிய நேரம் எடுத்துக்கொள்கிறது.'},
      {title: 'அது எப்படிச் செயல்படுகிறது என்பதைப் புரிந்துகொள்ளுதல்', text: 'மாதவிடாய்கள் பொதுவாக 3 முதல் 7 நாட்கள் நீடிக்கும். ஓட்டமும் நிறமும் ஒரு நாளிலிருந்து அடுத்த நாளுக்கு மாறலாம்.'},
      {title: 'உங்களைக் கவனித்துக்கொள்ளுதல்', text: 'உங்கள் பாதுகாப்பைத் தொடர்ந்து மாற்றுங்கள், மென்மையாகக் கழுவுங்கள், நீங்கள் வசதியாக உணர வசதியான ஆடைகளைத் தேர்ந்தெடுங்கள்.'},
      {title: 'அதைப் பற்றிப் பேசுதல், ஆதரவு பெறுதல்', text: 'உங்கள் தாய், சகோதரி, உங்களுக்கு நெருக்கமான ஒருவர், ஓர் ஆசிரியர் அல்லது நீங்கள் நம்பும் ஒரு சுகாதார நிபுணரிடம் பேசலாம்.'},
    ],
    tip1Title: 'தெரிந்துகொள்ளுங்கள்',
    tip1Text: 'தொடக்கத்தில் ஒழுங்கற்ற சுழற்சி முற்றிலும் இயல்பானது. உங்கள் உடல் தன் தாளத்தை எப்படிக் கண்டறிவது என்பதை இன்னும் கற்றுக்கொண்டிருக்கிறது.',
    tip2Title: 'நீங்கள் தனியாக இல்லை',
    tip2Text: 'ஒவ்வொரு உடலும் தனித்துவமானது. நேரம் எடுத்துக்கொள்ளுங்கள், பொறுமையாக இருங்கள், நீங்கள் நம்பும் ஒருவரிடம் உதவி கேட்கத் தயங்காதீர்கள்.',
    shareTitle: 'முதல் மாதவிடாய் · AWA',
    shareMessage: 'உங்கள் முதல் மாதவிடாய்: என்ன எதிர்பார்ப்பது · AWA',
  },
  te: {
    badge: 'మొదటి నెలసరి',
    title: 'మీ మొదటి నెలసరి:\nఏమి ఆశించాలి',
    metaDuration: '5 నిమిషాల పఠనం',
    metaType: 'గైడ్',
    metaLevel: 'ప్రారంభ స్థాయి',
    metaValidated: 'మదింపు చేసిన కంటెంట్',
    intro: 'ఏది సహజం, ఏది ధైర్యం ఇస్తుంది, మీరు ఏమి తెలుసుకోవాలి.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      'మీ మొదటి నెలసరి ఎప్పుడు వస్తుంది?',
      'ఏది సహజం',
      'ఇది ఎలా పనిచేస్తుంది',
      'మిమ్మల్ని మీరు చూసుకోవడం',
      'దాని గురించి మాట్లాడటం, తోడ్పాటు పొందడం',
    ],
    details: [
      {title: 'మీ మొదటి నెలసరి ఎప్పుడు వస్తుంది?', text: 'ఇది చాలా తరచుగా యుక్తవయస్సు మొదటి సంకేతాల తర్వాత సుమారు రెండు సంవత్సరాలకు, 10 నుండి 15 ఏళ్ల మధ్య వస్తుంది.'},
      {title: 'పూర్తిగా సహజమైనవి', text: 'మొదట, చక్రాలు అస్తవ్యస్తంగా, చిన్నవిగా లేదా పొడవుగా ఉండవచ్చు. మీ శరీరం తన లయను కనుగొనడానికి సమయం తీసుకుంటోంది అంతే.'},
      {title: 'ఇది ఎలా పనిచేస్తుందో అర్థం చేసుకోవడం', text: 'నెలసరులు సాధారణంగా 3 నుండి 7 రోజులు ఉంటాయి. రక్తస్రావం, రంగు ఒక రోజు నుండి మరొక రోజుకు మారవచ్చు.'},
      {title: 'మిమ్మల్ని మీరు చూసుకోవడం', text: 'మీ రక్షణను క్రమం తప్పకుండా మార్చండి, మృదువుగా కడుక్కోండి, మీకు హాయిగా అనిపించేలా సౌకర్యవంతమైన దుస్తులను ఎంచుకోండి.'},
      {title: 'దాని గురించి మాట్లాడటం, తోడ్పాటు పొందడం', text: 'మీరు మీ తల్లితో, ఒక సోదరితో, మీకు దగ్గరి వ్యక్తితో, ఒక ఉపాధ్యాయురాలితో లేదా మీరు నమ్మే ఆరోగ్య నిపుణుడితో మాట్లాడవచ్చు.'},
    ],
    tip1Title: 'తెలుసుకోవాల్సినవి',
    tip1Text: 'మొదట అస్తవ్యస్త చక్రం పూర్తిగా సహజం. మీ శరీరం ఇంకా తన లయను ఎలా కనుగొనాలో నేర్చుకుంటోంది.',
    tip2Title: 'మీరు ఒంటరి కాదు',
    tip2Text: 'ప్రతి శరీరం ప్రత్యేకమైనది. మీ సమయం తీసుకోండి, ఓపికగా ఉండండి, మీరు నమ్మే వ్యక్తి నుండి సహాయం కోరడానికి వెనుకాడకండి.',
    shareTitle: 'మొదటి నెలసరి · AWA',
    shareMessage: 'మీ మొదటి నెలసరి: ఏమి ఆశించాలి · AWA',
  },
  mr: {
    badge: 'पहिली पाळी',
    title: 'तुमची पहिली पाळी:\nकाय अपेक्षित आहे',
    metaDuration: '5 मिनिटे वाचन',
    metaType: 'मार्गदर्शक',
    metaLevel: 'प्रारंभ स्तर',
    metaValidated: 'पुनरावलोकन केलेला मजकूर',
    intro: 'काय सामान्य आहे, काय दिलासा देणारे आहे आणि तुम्हाला काय जाणून घेणे गरजेचे आहे.',
    contentsTitle: 'या लेखात',
    topics: [
      'तुमची पहिली पाळी केव्हा येते?',
      'काय सामान्य आहे',
      'ती कशी चालते',
      'स्वतःची काळजी घेणे',
      'याबद्दल बोलणे आणि आधार मिळवणे',
    ],
    details: [
      {title: 'तुमची पहिली पाळी केव्हा येते?', text: 'ती बहुतेकदा वयाच्या 10 ते 15 दरम्यान येते, यौवनाच्या पहिल्या चिन्हांनंतर सुमारे दोन वर्षांनी.'},
      {title: 'पूर्णपणे सामान्य काय आहे', text: 'सुरुवातीला पाळी अनियमित, लहान किंवा मोठी असू शकते. तुमचे शरीर आपली लय शोधण्यासाठी फक्त वेळ घेत आहे.'},
      {title: 'ती कशी चालते हे समजून घेणे', text: 'पाळी सहसा 3 ते 7 दिवस चालते. स्राव आणि रंग एका दिवसापासून दुसऱ्या दिवसात बदलू शकतात.'},
      {title: 'स्वतःची काळजी घेणे', text: 'तुमचे संरक्षण नियमितपणे बदला, हळुवारपणे धुवा आणि आरामदायी कपडे निवडा, जेणेकरून तुम्हाला सहज वाटेल.'},
      {title: 'याबद्दल बोलणे आणि आधार मिळवणे', text: 'तुम्ही तुमच्या आईशी, बहिणीशी, जवळच्या व्यक्तीशी, शिक्षिकेशी किंवा तुमचा विश्वास असलेल्या आरोग्य व्यावसायिकाशी बोलू शकता.'},
    ],
    tip1Title: 'हे जाणून घ्या',
    tip1Text: 'सुरुवातीला अनियमित पाळी पूर्णपणे सामान्य आहे. तुमचे शरीर अजून आपली लय कशी शोधायची हे शिकत आहे.',
    tip2Title: 'तुम्ही एकट्या नाही',
    tip2Text: 'प्रत्येक शरीर अद्वितीय असते. तुमचा वेळ घ्या, संयम ठेवा आणि तुमचा विश्वास असलेल्या व्यक्तीकडे मदत मागायला संकोच करू नका.',
    shareTitle: 'पहिली पाळी · AWA',
    shareMessage: 'तुमची पहिली पाळी: काय अपेक्षित आहे · AWA',
  },
  gu: {
    badge: 'પ્રથમ માસિક',
    title: 'તમારું પ્રથમ માસિક:\nશું અપેક્ષા રાખવી',
    metaDuration: '5 મિનિટ વાંચન',
    metaType: 'માર્ગદર્શિકા',
    metaLevel: 'પ્રારંભિક સ્તર',
    metaValidated: 'પુનરાવલોકન કરેલી સામગ્રી',
    intro: 'શું સામાન્ય છે, શું આશ્વાસન આપે છે અને તમારે શું જાણવું જોઈએ.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      'તમારું પ્રથમ માસિક ક્યારે આવે છે?',
      'શું સામાન્ય છે',
      'તે કેવી રીતે કામ કરે છે',
      'પોતાની કાળજી લેવી',
      'વાત કરવી અને સહારો મેળવવો',
    ],
    details: [
      {title: 'તમારું પ્રથમ માસિક ક્યારે આવે છે?', text: 'તે મોટા ભાગે 10 થી 15 વર્ષની ઉંમર વચ્ચે, તરુણાવસ્થાના પ્રથમ સંકેતો પછી લગભગ બે વર્ષે આવે છે.'},
      {title: 'શું સંપૂર્ણ સામાન્ય છે', text: 'શરૂઆતમાં ચક્ર અનિયમિત, ટૂંકા કે લાંબા હોઈ શકે છે. તમારું શરીર પોતાની લય શોધવા માટે ફક્ત સમય લઈ રહ્યું છે.'},
      {title: 'તે કેવી રીતે કામ કરે છે તે સમજવું', text: 'માસિક સામાન્ય રીતે 3 થી 7 દિવસ ચાલે છે. સ્રાવ અને તેનો રંગ એક દિવસથી બીજા દિવસે બદલાઈ શકે છે.'},
      {title: 'પોતાની કાળજી લેવી', text: 'તમારું સંરક્ષણ નિયમિત રીતે બદલો, હળવેથી ધોવો, અને આરામદાયક કપડાં પસંદ કરો જેથી તમને સહજ લાગે.'},
      {title: 'વાત કરવી અને સહારો મેળવવો', text: 'તમે તમારી માતા, બહેન, નજીકની વ્યક્તિ, શિક્ષક કે તમે જેના પર વિશ્વાસ કરો છો તે આરોગ્ય વ્યાવસાયિક સાથે વાત કરી શકો છો.'},
    ],
    tip1Title: 'જાણવા જેવું',
    tip1Text: 'શરૂઆતમાં અનિયમિત ચક્ર સંપૂર્ણ સામાન્ય છે. તમારું શરીર હજુ પોતાની લય શોધતાં શીખી રહ્યું છે.',
    tip2Title: 'તમે એકલા નથી',
    tip2Text: 'દરેક શરીર અનોખું હોય છે. સમય લો, ધીરજ રાખો, અને તમે જેના પર વિશ્વાસ કરો છો તેમની મદદ માંગવામાં અચકાશો નહીં.',
    shareTitle: 'પ્રથમ માસિક · AWA',
    shareMessage: 'તમારું પ્રથમ માસિક: શું અપેક્ષા રાખવી · AWA',
  },
  pa: {
    badge: 'ਪਹਿਲੀ ਮਾਹਵਾਰੀ',
    title: 'ਤੁਹਾਡੀ ਪਹਿਲੀ ਮਾਹਵਾਰੀ:\nਕੀ ਉਮੀਦ ਰੱਖੀਏ',
    metaDuration: '5 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਗਾਈਡ',
    metaLevel: 'ਸ਼ੁਰੂਆਤੀ ਪੱਧਰ',
    metaValidated: 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ',
    intro: 'ਕੀ ਆਮ ਹੈ, ਕੀ ਤਸੱਲੀ ਦੇਣ ਵਾਲਾ ਹੈ, ਅਤੇ ਤੁਹਾਨੂੰ ਕੀ ਜਾਣਨਾ ਚਾਹੀਦਾ ਹੈ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      'ਤੁਹਾਡੀ ਪਹਿਲੀ ਮਾਹਵਾਰੀ ਕਦੋਂ ਆਉਂਦੀ ਹੈ?',
      'ਕੀ ਆਮ ਹੈ',
      'ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦੀ ਹੈ',
      'ਆਪਣਾ ਖ਼ਿਆਲ ਰੱਖਣਾ',
      'ਗੱਲ ਕਰਨਾ ਅਤੇ ਸਹਾਰਾ ਲੈਣਾ',
    ],
    details: [
      {title: 'ਤੁਹਾਡੀ ਪਹਿਲੀ ਮਾਹਵਾਰੀ ਕਦੋਂ ਆਉਂਦੀ ਹੈ?', text: 'ਇਹ ਅਕਸਰ 10 ਤੋਂ 15 ਸਾਲ ਦੀ ਉਮਰ ਵਿਚਕਾਰ ਆਉਂਦੀ ਹੈ, ਜਵਾਨੀ ਦੇ ਪਹਿਲੇ ਲੱਛਣਾਂ ਤੋਂ ਲਗਭਗ ਦੋ ਸਾਲ ਬਾਅਦ।'},
      {title: 'ਕੀ ਬਿਲਕੁਲ ਆਮ ਹੈ', text: 'ਸ਼ੁਰੂ ਵਿੱਚ ਚੱਕਰ ਬੇਨਿਯਮੀ ਵਾਲੇ, ਛੋਟੇ ਜਾਂ ਲੰਮੇ ਹੋ ਸਕਦੇ ਹਨ। ਤੁਹਾਡਾ ਸਰੀਰ ਆਪਣੀ ਲੈਅ ਲੱਭਣ ਲਈ ਬਸ ਆਪਣਾ ਸਮਾਂ ਲੈ ਰਿਹਾ ਹੁੰਦਾ ਹੈ।'},
      {title: 'ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦੀ ਹੈ, ਇਹ ਸਮਝਣਾ', text: 'ਮਾਹਵਾਰੀ ਆਮ ਤੌਰ \'ਤੇ 3 ਤੋਂ 7 ਦਿਨ ਚੱਲਦੀ ਹੈ। ਵਹਾਅ ਅਤੇ ਰੰਗ ਇੱਕ ਦਿਨ ਤੋਂ ਦੂਜੇ ਦਿਨ ਬਦਲ ਸਕਦੇ ਹਨ।'},
      {title: 'ਆਪਣਾ ਖ਼ਿਆਲ ਰੱਖਣਾ', text: 'ਆਪਣਾ ਬਚਾਅ ਵਾਲਾ ਸਾਮਾਨ ਨਿਯਮਿਤ ਬਦਲੋ, ਹੌਲੀ-ਹੌਲੀ ਸਫ਼ਾਈ ਕਰੋ, ਅਤੇ ਆਰਾਮਦਾਇਕ ਕੱਪੜੇ ਚੁਣੋ ਤਾਂ ਜੋ ਤੁਸੀਂ ਸਹਿਜ ਮਹਿਸੂਸ ਕਰੋ।'},
      {title: 'ਗੱਲ ਕਰਨਾ ਅਤੇ ਸਹਾਰਾ ਲੈਣਾ', text: 'ਤੁਸੀਂ ਆਪਣੀ ਮਾਂ, ਭੈਣ, ਕਿਸੇ ਨੇੜਲੇ, ਅਧਿਆਪਕਾ ਜਾਂ ਕਿਸੇ ਭਰੋਸੇਯੋਗ ਸਿਹਤ ਮਾਹਿਰ ਨਾਲ ਗੱਲ ਕਰ ਸਕਦੇ ਹੋ।'},
    ],
    tip1Title: 'ਜਾਣਨ ਯੋਗ',
    tip1Text: 'ਸ਼ੁਰੂ ਵਿੱਚ ਬੇਨਿਯਮੀ ਵਾਲਾ ਚੱਕਰ ਬਿਲਕੁਲ ਆਮ ਹੈ। ਤੁਹਾਡਾ ਸਰੀਰ ਅਜੇ ਆਪਣੀ ਲੈਅ ਲੱਭਣਾ ਸਿੱਖ ਰਿਹਾ ਹੈ।',
    tip2Title: 'ਤੁਸੀਂ ਇਕੱਲੇ ਨਹੀਂ ਹੋ',
    tip2Text: 'ਹਰ ਸਰੀਰ ਵਿਲੱਖਣ ਹੈ। ਆਪਣਾ ਸਮਾਂ ਲਓ, ਸਬਰ ਰੱਖੋ, ਅਤੇ ਕਿਸੇ ਭਰੋਸੇਯੋਗ ਵਿਅਕਤੀ ਤੋਂ ਮਦਦ ਮੰਗਣ ਵਿੱਚ ਝਿਜਕ ਨਾ ਕਰੋ।',
    shareTitle: 'ਪਹਿਲੀ ਮਾਹਵਾਰੀ · AWA',
    shareMessage: 'ਤੁਹਾਡੀ ਪਹਿਲੀ ਮਾਹਵਾਰੀ: ਕੀ ਉਮੀਦ ਰੱਖੀਏ · AWA',
  },
  my: {
    badge: 'ပထမဆုံးရာသီ',
    title: 'သင့်ပထမဆုံးရာသီ၊\nဘာတွေမျှော်လင့်ရမလဲ',
    metaDuration: 'ဖတ်ချိန် 5 မိနစ်',
    metaType: 'လမ်းညွှန်',
    metaLevel: 'အခြေခံအဆင့်',
    metaValidated: 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ',
    intro: 'ပုံမှန်ဖြစ်သည်များ၊ စိတ်ချရစေသည်များ နှင့် သင်သိထားသင့်သည်များ။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'သင့်ပထမဆုံးရာသီသည် မည်သည့်အချိန်တွင် ရောက်လာသနည်း။',
      'ပုံမှန်ဖြစ်သည်များ',
      'မည်သို့အလုပ်လုပ်သနည်း',
      'မိမိကိုယ်ကို ဂရုစိုက်ခြင်း',
      'ပြောဆိုခြင်းနှင့် အထောက်အပံ့ရယူခြင်း',
    ],
    details: [
      {title: 'သင့်ပထမဆုံးရာသီသည် မည်သည့်အချိန်တွင် ရောက်လာသနည်း။', text: 'အများအားဖြင့် အသက် 10 နှစ်နှင့် 15 နှစ်ကြား၊ ပျိုမေးဝင်ခြင်း၏ ပထမဆုံးလက္ခဏာများမှ ခန့်မှန်းခြေ နှစ်နှစ်အကြာတွင် ရောက်လာသည်။'},
      {title: 'လုံးဝပုံမှန်ဖြစ်သည်များ', text: 'အစပိုင်းတွင် ရာသီစက်ဝန်းများသည် ပုံမှန်မဟုတ်ဘဲ တိုနိုင်သည် သို့မဟုတ် ရှည်နိုင်သည်။ သင့်ခန္ဓာကိုယ်သည် ၎င်း၏ စည်းချက်ကို ရှာဖွေရန် အချိန်ယူနေခြင်းသာ ဖြစ်သည်။'},
      {title: 'မည်သို့အလုပ်လုပ်သည်ကို နားလည်ခြင်း', text: 'ရာသီသည် များသောအားဖြင့် 3 ရက်မှ 7 ရက်ကြာသည်။ သွေးထွက်ပမာဏနှင့် အရောင်သည် တစ်ရက်မှ တစ်ရက်သို့ ပြောင်းလဲနိုင်သည်။'},
      {title: 'မိမိကိုယ်ကို ဂရုစိုက်ခြင်း', text: 'သင့်ကာကွယ်ရေးပစ္စည်းကို ပုံမှန်လဲပါ၊ ညင်သာစွာဆေးကြောပါ၊ ပြီးလျှင် သက်သောင့်သက်သာခံစားရစေရန် သက်တောင့်သက်သာရှိသော အဝတ်အစားကို ရွေးပါ။'},
      {title: 'ပြောဆိုခြင်းနှင့် အထောက်အပံ့ရယူခြင်း', text: 'သင့်မိခင်၊ အစ်မ၊ သင်နှင့်ရင်းနှီးသူ၊ ဆရာမ သို့မဟုတ် သင်ယုံကြည်ရသော ကျန်းမာရေးပညာရှင်တစ်ဦးနှင့် ပြောဆိုနိုင်သည်။'},
    ],
    tip1Title: 'သိထားသင့်သည်',
    tip1Text: 'အစပိုင်းတွင် ရာသီစက်ဝန်း မမှန်ခြင်းသည် လုံးဝပုံမှန်ဖြစ်သည်။ သင့်ခန္ဓာကိုယ်သည် ၎င်း၏ စည်းချက်ကို ရှာဖွေရန် သင်ယူနေဆဲ ဖြစ်သည်။',
    tip2Title: 'သင်တစ်ယောက်တည်း မဟုတ်ပါ',
    tip2Text: 'ခန္ဓာကိုယ်တိုင်း ထူးခြားသည်။ အချိန်ယူပါ၊ စိတ်ရှည်ပါ၊ ပြီးလျှင် သင်ယုံကြည်ရသူထံမှ အကူအညီတောင်းရန် မတွန့်ဆုတ်ပါနှင့်။',
    shareTitle: 'ပထမဆုံးရာသီ · AWA',
    shareMessage: 'သင့်ပထမဆုံးရာသီ၊ ဘာတွေမျှော်လင့်ရမလဲ · AWA',
  },
  km: {
    badge: 'រដូវដំបូង',
    title: 'រដូវដំបូងរបស់អ្នក៖\nអ្វីដែលត្រូវរំពឹងទុក',
    metaDuration: 'អាន 5 នាទី',
    metaType: 'មគ្គុទ្ទេសក៍',
    metaLevel: 'កម្រិតដំបូង',
    metaValidated: 'មាតិកាបានពិនិត្យ',
    intro: 'អ្វីដែលធម្មតា អ្វីដែលធ្វើឱ្យអ្នកធូរចិត្ត និងអ្វីដែលអ្នកត្រូវដឹង។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'តើរដូវដំបូងមកដល់នៅពេលណា?',
      'អ្វីដែលធម្មតា',
      'វាដំណើរការយ៉ាងដូចម្តេច',
      'ថែទាំខ្លួនឯង',
      'និយាយអំពីវា និងស្វែងរកការគាំទ្រ',
    ],
    details: [
      {title: 'តើរដូវដំបូងមកដល់នៅពេលណា?', text: 'ជាទូទៅវាមកដល់នៅចន្លោះអាយុ 10 ដល់ 15 ឆ្នាំ ប្រហែលពីរឆ្នាំបន្ទាប់ពីសញ្ញាដំបូងនៃភាពពេញវ័យ។'},
      {title: 'អ្វីដែលធម្មតាទាំងស្រុង', text: 'នៅដំបូង វដ្តរដូវអាចមិនទៀងទាត់ ខ្លី ឬវែង។ រាងកាយរបស់អ្នកគ្រាន់តែកំពុងចំណាយពេលរកចង្វាក់របស់វា។'},
      {title: 'ការយល់ដឹងពីរបៀបដែលវាដំណើរការ', text: 'រដូវជាធម្មតាមានរយៈពេល 3 ដល់ 7 ថ្ងៃ។ បរិមាណឈាមរដូវ និងពណ៌អាចប្រែប្រួលពីថ្ងៃមួយទៅថ្ងៃមួយ។'},
      {title: 'ថែទាំខ្លួនឯង', text: 'ផ្លាស់ប្តូរសម្ភារៈការពាររបស់អ្នកជាប្រចាំ លាងសម្អាតដោយថ្នមៗ ហើយជ្រើសរើសសម្លៀកបំពាក់ស្រួលពាក់ ដើម្បីឱ្យអ្នកមានអារម្មណ៍ស្រួលខ្លួន។'},
      {title: 'និយាយអំពីវា និងស្វែងរកការគាំទ្រ', text: 'អ្នកអាចនិយាយជាមួយម្តាយ បងស្រី ឬប្អូនស្រី អ្នកជិតស្និទ្ធ គ្រូបង្រៀន ឬអ្នកជំនាញសុខាភិបាលដែលអ្នកទុកចិត្ត។'},
    ],
    tip1Title: 'គួរដឹង',
    tip1Text: 'វដ្តរដូវមិនទៀងទាត់នៅដំបូងគឺធម្មតាទាំងស្រុង។ រាងកាយរបស់អ្នកនៅតែកំពុងរៀនរកចង្វាក់របស់វា។',
    tip2Title: 'អ្នកមិនឯកាទេ',
    tip2Text: 'រាងកាយមនុស្សម្នាក់ៗមានតែមួយគត់។ ចំណាយពេលរបស់អ្នក ចេះអត់ធ្មត់ ហើយកុំស្ទាក់ស្ទើរក្នុងការសុំជំនួយពីអ្នកដែលអ្នកទុកចិត្ត។',
    shareTitle: 'រដូវដំបូង · AWA',
    shareMessage: 'រដូវដំបូងរបស់អ្នក៖ អ្វីដែលត្រូវរំពឹងទុក · AWA',
  },
  lo: {
    badge: 'ປະຈຳເດືອນຄັ້ງທຳອິດ',
    title: 'ປະຈຳເດືອນຄັ້ງທຳອິດຂອງທ່ານ:\nສິ່ງທີ່ຄວນຄາດຫວັງ',
    metaDuration: 'ອ່ານ 5 ນາທີ',
    metaType: 'ຄູ່ມື',
    metaLevel: 'ລະດັບເລີ່ມຕົ້ນ',
    metaValidated: 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ',
    intro: 'ສິ່ງທີ່ເປັນເລື່ອງປົກກະຕິ, ສິ່ງທີ່ໜ້າສະບາຍໃຈ ແລະ ສິ່ງທີ່ທ່ານຄວນຮູ້.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ປະຈຳເດືອນຄັ້ງທຳອິດມາເມື່ອໃດ?',
      'ສິ່ງທີ່ເປັນເລື່ອງປົກກະຕິ',
      'ມັນເຮັດວຽກແນວໃດ',
      'ການດູແລຕົນເອງ',
      'ການລົມກັນ ແລະ ການຂໍການສະໜັບສະໜູນ',
    ],
    details: [
      {title: 'ປະຈຳເດືອນຄັ້ງທຳອິດມາເມື່ອໃດ?', text: 'ສ່ວນຫຼາຍມາລະຫວ່າງອາຍຸ 10 ຫາ 15 ປີ ປະມານສອງປີຫຼັງຈາກສັນຍານທຳອິດຂອງການເຂົ້າສູ່ໄວສາວ.'},
      {title: 'ສິ່ງທີ່ເປັນເລື່ອງປົກກະຕິຢ່າງສິ້ນເຊີງ', text: 'ໃນຕອນທຳອິດ ຮອບເດືອນອາດບໍ່ສະໝ່ຳສະເໝີ, ສັ້ນ ຫຼື ຍາວ. ຮ່າງກາຍຂອງທ່ານພຽງແຕ່ໃຊ້ເວລາເພື່ອຊອກຫາຈັງຫວະຂອງມັນ.'},
      {title: 'ເຂົ້າໃຈວ່າມັນເຮັດວຽກແນວໃດ', text: 'ປະຈຳເດືອນປົກກະຕິມາ 3 ຫາ 7 ມື້. ປະລິມານເລືອດປະຈຳເດືອນ ແລະ ສີອາດປ່ຽນແປງຈາກມື້ໜຶ່ງໄປອີກມື້ໜຶ່ງ.'},
      {title: 'ການດູແລຕົນເອງ', text: 'ປ່ຽນຜ້າອະນາໄມເປັນປະຈຳ, ລ້າງເບົາໆ ແລະ ເລືອກເສື້ອຜ້າທີ່ສະບາຍເພື່ອໃຫ້ທ່ານຮູ້ສຶກສະບາຍໃຈ.'},
      {title: 'ການລົມກັນ ແລະ ການຂໍການສະໜັບສະໜູນ', text: 'ທ່ານສາມາດລົມກັບແມ່, ເອື້ອຍ ຫຼື ນ້ອງສາວ, ຄົນໃກ້ຊິດ, ຄູ ຫຼື ຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບທີ່ທ່ານໄວ້ວາງໃຈ.'},
    ],
    tip1Title: 'ຄວນຮູ້',
    tip1Text: 'ຮອບເດືອນທີ່ບໍ່ສະໝ່ຳສະເໝີໃນຕອນທຳອິດເປັນເລື່ອງປົກກະຕິຢ່າງສິ້ນເຊີງ. ຮ່າງກາຍຂອງທ່ານຍັງກຳລັງຮຽນຮູ້ວິທີຊອກຫາຈັງຫວະຂອງມັນ.',
    tip2Title: 'ທ່ານບໍ່ໄດ້ຢູ່ຄົນດຽວ',
    tip2Text: 'ທຸກຮ່າງກາຍມີເອກະລັກ. ໃຊ້ເວລາຂອງທ່ານ, ອົດທົນ ແລະ ຢ່າລັງເລທີ່ຈະຂໍຄວາມຊ່ວຍເຫຼືອຈາກຄົນທີ່ທ່ານໄວ້ວາງໃຈ.',
    shareTitle: 'ປະຈຳເດືອນຄັ້ງທຳອິດ · AWA',
    shareMessage: 'ປະຈຳເດືອນຄັ້ງທຳອິດຂອງທ່ານ: ສິ່ງທີ່ຄວນຄາດຫວັງ · AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FirstPeriodArticleScreen({
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
      title: content.shareTitle,
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
          <Image source={resolveEditorialImage(HERO, lang)} resizeMode="cover" style={styles.hero} />

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

            {content.topics.map((topic, index) => (
              <View key={topic} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="titleSmall" emphasized colorRole="primary" style={styles.contentNumber}>{index + 1}.</AwaText>
                  <AwaText variant="bodySmall" style={styles.contentText}>{topic}</AwaText>
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

          <AwaCard variant="filled" padding="none" style={styles.visualCard}>
            <Image
              source={TOPIC_IMAGES[0]}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <AwaText variant="titleSmall" emphasized>{content.details[0].title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.visualText}>{content.details[0].text}</AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.visualCard}>
            <Image
              source={TOPIC_IMAGES[1]}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <AwaText variant="titleSmall" emphasized>{content.details[1].title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.visualText}>{content.details[1].text}</AwaText>
            </View>
          </AwaCard>

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

          <AwaCard variant="filled" padding="none" style={styles.visualCard}>
            <Image
              source={TOPIC_IMAGES[2]}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <AwaText variant="titleSmall" emphasized>{content.details[2].title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.visualText}>{content.details[2].text}</AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.visualCard}>
            <Image
              source={TOPIC_IMAGES[3]}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <AwaText variant="titleSmall" emphasized>{content.details[3].title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.visualText}>{content.details[3].text}</AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.visualCard}>
            <Image
              source={TOPIC_IMAGES[4]}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <AwaText variant="titleSmall" emphasized>{content.details[4].title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.visualText}>{content.details[4].text}</AwaText>
            </View>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip2Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip2Text}
              </AwaText>
            </View>
          </AwaCard>
        </View>
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
  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 3},
  });
}
