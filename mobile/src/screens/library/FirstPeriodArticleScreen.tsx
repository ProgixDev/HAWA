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
