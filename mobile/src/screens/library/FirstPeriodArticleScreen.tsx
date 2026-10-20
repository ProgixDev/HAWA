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
const CONTENT = {
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
} as const;

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
