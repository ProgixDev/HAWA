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

const ID = 'firstperiod-questions-frequentes';

const HERO = require('../../assets/images/library/popular-flower.png');

// Images stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these illustrations.
const FAQ_IMAGES = [
  null,
  null,
  require('../../assets/images/library/pain-massage.png'),
  null,
  null,
] as const;

const RELATED_IMAGES = [
  CYCLE_PHASES_HERO,
  require('../../assets/images/library/featured-flow.png'),
  require('../../assets/images/library/pain-hero.png'),
] as const;

const RELATED_ARTICLE_IDS = [
  'firstperiod-premieres-regles',
  'firstperiod-choisir-protection',
  'pain-gerer-douleurs',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'PREMIÈRES RÈGLES',
    title: 'Questions fréquentes\nsur les premières règles',
    metaDuration: '4 min de lecture',
    metaType: 'FAQ',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Les réponses simples aux questions les plus courantes sur les premières règles.',
    contentsTitle: 'Dans cet article',
    faq: [
      {
        question: '« Est-ce normal d’avoir peu de sang ? »',
        answer:
          'Oui. Les tout premiers cycles ont souvent un flux léger. Le flux peut varier d’un cycle à l’autre, surtout au début.',
      },
      {
        question: '« Est-ce normal d’avoir beaucoup de sang ? »',
        answer:
          'Un flux plus abondant peut aussi arriver, notamment les deux premiers jours. Si les protections doivent être changées plus d’une fois par heure pendant plusieurs heures, il est utile d’en parler à un professionnel de santé.',
      },
      {
        question: '« Est-ce normal d’avoir mal ? »',
        answer:
          'De légères crampes dans le bas-ventre sont fréquentes et généralement sans gravité. Une bouillotte ou un peu de repos peuvent aider. Des douleurs très intenses méritent d’être signalées.',
      },
      {
        question: '« Est-ce que je peux faire du sport ? »',
        answer:
          'Oui, le sport reste possible pendant les règles. Il suffit d’adapter l’intensité à ce que le corps ressent ce jour-là.',
      },
      {
        question: '« Est-ce que je peux me baigner ? »',
        answer:
          'Oui, se baigner reste possible avec une protection adaptée. Beaucoup de personnes choisissent simplement d’attendre d’être plus à l’aise avec cette idée.',
      },
    ],
    tipTitle: 'Bon à savoir',
    tipText: 'Il n’existe pas de question gênante : chaque corps est différent, et il est toujours possible d’en parler à une personne de confiance.',
    relatedTitle: '♥  Tu pourrais aussi aimer',
    related: [
      {title: 'Tes premières règles : à quoi t’attendre', meta: '5 min  ·  Guide'},
      {title: 'Quelle protection choisir pour mes premières règles ?', meta: '6 min  ·  Guide'},
      {title: 'Gérer les douleurs menstruelles', meta: '7 min  ·  Guide'},
    ],
    shareMessage: 'Questions fréquentes sur les premières règles — AWA',
  },
  en: {
    badge: 'FIRST PERIOD',
    title: 'Frequently asked questions\nabout your first period',
    metaDuration: '4 min read',
    metaType: 'FAQ',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Simple answers to the most common questions about your first period.',
    contentsTitle: 'In this article',
    faq: [
      {
        question: '“Is it normal to have very little blood?”',
        answer:
          'Yes. The very first cycles often have a light flow. The flow can vary from one cycle to the next, especially at the start.',
      },
      {
        question: '“Is it normal to have a lot of blood?”',
        answer:
          'A heavier flow can also happen, especially during the first two days. If you need to change your protection more than once an hour for several hours in a row, it’s a good idea to talk to a healthcare professional about it.',
      },
      {
        question: '“Is it normal to have cramps?”',
        answer:
          'Mild cramps in the lower belly are common and usually nothing to worry about. A hot water bottle or a bit of rest can help. Very intense pain is worth mentioning to someone.',
      },
      {
        question: '“Can I play sports?”',
        answer:
          'Yes, you can still play sports during your period. Just adjust the intensity to how your body feels that day.',
      },
      {
        question: '“Can I go swimming?”',
        answer:
          'Yes, you can still go swimming with the right protection. Many people simply choose to wait until they feel more comfortable with the idea.',
      },
    ],
    tipTitle: 'Good to know',
    tipText: 'There’s no such thing as an embarrassing question: every body is different, and you can always talk to someone you trust.',
    relatedTitle: '♥  You might also like',
    related: [
      {title: 'Your first period: what to expect', meta: '5 min  ·  Guide'},
      {title: 'Which protection should I choose for my first period?', meta: '6 min  ·  Guide'},
      {title: 'Managing period pain', meta: '7 min  ·  Guide'},
    ],
    shareMessage: 'Frequently asked questions about your first period — AWA',
  },
  es: {
    badge: 'PRIMERA MENSTRUACIÓN',
    title: 'Preguntas frecuentes\nsobre la primera menstruación',
    metaDuration: '4 min de lectura',
    metaType: 'FAQ',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Respuestas sencillas a las preguntas más habituales sobre la primera menstruación.',
    contentsTitle: 'En este artículo',
    faq: [
      {
        question: '«¿Es normal tener poca sangre?»',
        answer:
          'Sí. Los primerísimos ciclos suelen tener un flujo ligero. El flujo puede variar de un ciclo a otro, sobre todo al principio.',
      },
      {
        question: '«¿Es normal tener mucha sangre?»',
        answer:
          'Un flujo más abundante también puede ocurrir, especialmente los dos primeros días. Si necesitas cambiar de protección más de una vez por hora durante varias horas seguidas, es buena idea hablarlo con un profesional de la salud.',
      },
      {
        question: '«¿Es normal tener dolor?»',
        answer:
          'Los cólicos leves en la parte baja del vientre son frecuentes y, por lo general, no tienen importancia. Una bolsa de agua caliente o un poco de descanso pueden ayudar. Un dolor muy intenso merece ser comentado con alguien.',
      },
      {
        question: '«¿Puedo hacer deporte?»',
        answer:
          'Sí, puedes seguir haciendo deporte durante la menstruación. Basta con adaptar la intensidad a lo que tu cuerpo sienta ese día.',
      },
      {
        question: '«¿Puedo bañarme?»',
        answer:
          'Sí, puedes bañarte con una protección adecuada. Muchas personas simplemente prefieren esperar a sentirse más cómodas con la idea.',
      },
    ],
    tipTitle: 'DATO ÚTIL',
    tipText: 'No existen las preguntas incómodas: cada cuerpo es diferente, y siempre puedes hablar de ello con una persona de confianza.',
    relatedTitle: '♥  También te podría gustar',
    related: [
      {title: 'Tu primera menstruación: qué esperar', meta: '5 min  ·  Guía'},
      {title: '¿Qué protección elegir para mi primera menstruación?', meta: '6 min  ·  Guía'},
      {title: 'Gestionar los dolores menstruales', meta: '7 min  ·  Guía'},
    ],
    shareMessage: 'Preguntas frecuentes sobre la primera menstruación — AWA',
  },
  it: {
    badge: 'PRIMO CICLO',
    title: 'Domande frequenti\nsul tuo primo ciclo',
    metaDuration: '4 min di lettura',
    metaType: 'FAQ',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Risposte semplici alle domande più comuni sul tuo primo ciclo.',
    contentsTitle: 'In questo articolo',
    faq: [
      {
        question: '«È normale avere pochissimo sangue?»',
        answer: 'Sì. I primissimi cicli hanno spesso un flusso leggero. Il flusso può variare da un ciclo all’altro, soprattutto all’inizio.',
      },
      {
        question: '«È normale avere molto sangue?»',
        answer: 'Può capitare anche un flusso più abbondante, soprattutto nei primi due giorni. Se hai bisogno di cambiare l’assorbente più di una volta all’ora per diverse ore di seguito, è una buona idea parlarne con un operatore sanitario.',
      },
      {
        question: '«È normale avere i crampi?»',
        answer: 'I crampi lievi nella parte bassa del ventre sono comuni e di solito non c’è nulla di cui preoccuparsi. Una borsa dell’acqua calda o un po’ di riposo possono aiutare. Un dolore molto intenso merita di essere comunicato a qualcuno.',
      },
      {
        question: '«Posso fare sport?»',
        answer: 'Sì, puoi continuare a fare sport durante il ciclo. Basta adattare l’intensità a come si sente il tuo corpo quel giorno.',
      },
      {
        question: '«Posso andare a nuotare?»',
        answer: 'Sì, puoi continuare ad andare a nuotare con la protezione adatta. Molte persone scelgono semplicemente di aspettare di sentirsi più a proprio agio con l’idea.',
      },
    ],
    tipTitle: 'Da sapere',
    tipText: 'Non esistono domande imbarazzanti: ogni corpo è diverso e puoi sempre parlarne con qualcuno di cui ti fidi.',
    relatedTitle: '♥  Potrebbe interessarti anche',
    related: [
      {
        title: 'Il tuo primo ciclo: cosa aspettarti',
        meta: '5 min  ·  Guida',
      },
      {
        title: 'Quale protezione scegliere per il mio primo ciclo?',
        meta: '6 min  ·  Guida',
      },
      {
        title: 'Gestire il dolore mestruale',
        meta: '7 min  ·  Guida',
      },
    ],
    shareMessage: 'Domande frequenti sul tuo primo ciclo — AWA',
  },
  tr: {
    badge: 'İLK ADET',
    title: 'İlk adetinle ilgili\nsık sorulan sorular',
    metaDuration: '4 dk okuma',
    metaType: 'SSS',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'İlk adetinle ilgili en sık sorulan sorulara basit yanıtlar.',
    contentsTitle: 'Bu makalede',
    faq: [
      {
        question: '“Çok az kan gelmesi normal mi?”',
        answer: 'Evet. İlk döngülerde akış çoğu zaman hafif olur. Özellikle başlangıçta akış bir döngüden diğerine değişebilir.',
      },
      {
        question: '“Çok fazla kan gelmesi normal mi?”',
        answer: 'Özellikle ilk iki gün daha yoğun bir akış da olabilir. Birkaç saat boyunca saatte birden fazla kez pedini ya da bezini değiştirmen gerekiyorsa, bir sağlık uzmanıyla konuşmak iyi olur.',
      },
      {
        question: '“Kramp girmesi normal mi?”',
        answer: 'Alt karında hafif kramplar yaygındır ve genellikle endişelenecek bir durum değildir. Sıcak su torbası ya da biraz dinlenmek iyi gelebilir. Çok şiddetli bir ağrıyı birine söylemekte fayda var.',
      },
      {
        question: '“Spor yapabilir miyim?”',
        answer: 'Evet, adet döneminde de spor yapabilirsin. Yoğunluğu o gün bedeninin nasıl hissettirdiğine göre ayarlaman yeterli.',
      },
      {
        question: '“Yüzmeye gidebilir miyim?”',
        answer: 'Evet, uygun korumayla yine yüzebilirsin. Pek çok kişi bu fikre daha rahat alışana kadar beklemeyi tercih ediyor.',
      },
    ],
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Utanılacak soru diye bir şey yoktur: her beden farklıdır ve güvendiğin biriyle her zaman konuşabilirsin.',
    relatedTitle: '♥  Bunlar da hoşuna gidebilir',
    related: [
      {
        title: 'İlk adetin: neyle karşılaşabilirsin',
        meta: '5 dk  ·  Rehber',
      },
      {
        title: 'İlk adetim için hangi korumayı seçmeliyim?',
        meta: '6 dk  ·  Rehber',
      },
      {
        title: 'Adet ağrısıyla başa çıkmak',
        meta: '7 dk  ·  Rehber',
      },
    ],
    shareMessage: 'İlk adetinle ilgili sık sorulan sorular — AWA',
  },
  ru: {
    badge: 'ПЕРВЫЕ МЕСЯЧНЫЕ',
    title: 'Часто задаваемые вопросы\nо первых месячных',
    metaDuration: '4 мин чтения',
    metaType: 'Вопросы и ответы',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Простые ответы на самые частые вопросы о первых месячных.',
    contentsTitle: 'В этой статье',
    faq: [
      {
        question: '«Это нормально, если выделений очень мало?»',
        answer: 'Да. Первые циклы нередко сопровождаются скудными выделениями. Их объём может меняться от цикла к циклу, особенно в начале.',
      },
      {
        question: '«Это нормально, если выделений очень много?»',
        answer: 'Бывают и более обильные выделения, особенно в первые два дня. Если вам нужно менять средство гигиены чаще одного раза в час на протяжении нескольких часов подряд, стоит обсудить это с медицинским специалистом.',
      },
      {
        question: '«Это нормально, если болит живот?»',
        answer: 'Лёгкие спазмы внизу живота — обычное явление и, как правило, не повод для беспокойства. Помочь могут грелка или немного отдыха. Об очень сильной боли стоит кому-нибудь рассказать.',
      },
      {
        question: '«Можно ли заниматься спортом?»',
        answer: 'Да, во время месячных можно заниматься спортом. Просто подберите нагрузку в зависимости от самочувствия в этот день.',
      },
      {
        question: '«Можно ли плавать?»',
        answer: 'Да, при использовании подходящего средства гигиены плавать можно. Многие просто предпочитают подождать, пока не привыкнут к этой мысли.',
      },
    ],
    tipTitle: 'ПОЛЕЗНО ЗНАТЬ',
    tipText: 'Неловких вопросов не бывает: каждый организм индивидуален, и вы всегда можете поговорить с тем, кому доверяете.',
    relatedTitle: '♥  Вам также может понравиться',
    related: [
      {
        title: 'Ваши первые месячные: чего ожидать',
        meta: '5 мин  ·  Руководство',
      },
      {
        title: 'Какое средство гигиены выбрать для первых месячных?',
        meta: '6 мин  ·  Руководство',
      },
      {
        title: 'Как справляться с болью во время месячных',
        meta: '7 мин  ·  Руководство',
      },
    ],
    shareMessage: 'Часто задаваемые вопросы о первых месячных — AWA',
  },
  de: {
    badge: 'ERSTE PERIODE',
    title: 'Häufige Fragen\nzu deiner ersten Periode',
    metaDuration: '4 Min. Lesezeit',
    metaType: 'Häufige Fragen',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Einfache Antworten auf die häufigsten Fragen zu deiner ersten Periode.',
    contentsTitle: 'In diesem Artikel',
    faq: [
      {
        question: '„Ist es normal, sehr wenig Blut zu haben?“',
        answer:
          'Ja. Die allerersten Zyklen gehen oft mit einer schwachen Blutung einher. Die Stärke der Blutung kann von Zyklus zu Zyklus schwanken, besonders am Anfang.',
      },
      {
        question: '„Ist es normal, viel Blut zu haben?“',
        answer:
          'Auch eine stärkere Blutung kommt vor, besonders an den ersten beiden Tagen. Wenn du mehrere Stunden hintereinander öfter als einmal pro Stunde dein Hygieneprodukt wechseln musst, solltest du mit medizinischem Fachpersonal darüber sprechen.',
      },
      {
        question: '„Ist es normal, Krämpfe zu haben?“',
        answer:
          'Leichte Krämpfe im Unterbauch sind häufig und meist kein Grund zur Sorge. Eine Wärmflasche oder ein bisschen Ruhe können helfen. Sehr starke Schmerzen solltest du jemandem anvertrauen.',
      },
      {
        question: '„Kann ich Sport treiben?“',
        answer:
          'Ja, du kannst während deiner Periode weiterhin Sport treiben. Passe die Intensität einfach daran an, wie sich dein Körper an diesem Tag anfühlt.',
      },
      {
        question: '„Kann ich schwimmen gehen?“',
        answer:
          'Ja, mit dem passenden Hygieneprodukt kannst du auch schwimmen gehen. Viele warten einfach ab, bis sie sich mit dem Gedanken wohler fühlen.',
      },
    ],
    tipTitle: 'Gut zu wissen',
    tipText: 'Es gibt keine peinlichen Fragen: Jeder Körper ist anders, und du kannst jederzeit mit einer Person sprechen, der du vertraust.',
    relatedTitle: '♥  Das könnte dich auch interessieren',
    related: [
      {
        title: 'Deine erste Periode: Was dich erwartet',
        meta: '5 Min.  ·  Ratgeber',
      },
      {
        title: 'Welches Hygieneprodukt passt für meine erste Periode?',
        meta: '6 Min.  ·  Ratgeber',
      },
      {
        title: 'Mit Periodenschmerzen umgehen',
        meta: '7 Min.  ·  Ratgeber',
      },
    ],
    shareMessage: 'Häufige Fragen zu deiner ersten Periode — AWA',
  },
  zh: {
      badge: '初潮',
      title: '关于初潮\n的常见问题',
      metaDuration: '阅读约 4 分钟',
      metaType: '常见问题',
      metaLevel: '入门',
      metaValidated: '经审阅的内容',
      intro: '用简单的话，解答关于初潮最常见的问题。',
      contentsTitle: '本文内容',
      faq: [
        {
          question: '“出血量很少正常吗？”',
          answer: '正常。最初几次月经的经量往往比较少。经量在不同周期之间可能有所变化，尤其是在刚开始的时候。',
        },
        {
          question: '“出血量很多正常吗？”',
          answer: '经量较多也可能出现，尤其是在最初两天。如果连续几个小时，每小时都需要更换不止一次卫生用品，建议你向医疗专业人员咨询。',
        },
        {
          question: '“会痛经正常吗？”',
          answer: '下腹部轻微的痉挛痛很常见，通常不必担心。热水袋或稍作休息可能会有帮助。如果疼痛非常剧烈，值得告诉身边的人。',
        },
        {
          question: '“可以运动吗？”',
          answer: '可以，月经期间依然可以运动。只要根据当天身体的感觉调整强度就好。',
        },
        {
          question: '“可以游泳吗？”',
          answer: '可以，只要使用合适的防护用品，月经期间依然可以游泳。也有不少人会选择等自己对这件事更自在一些再去。',
        },
      ],
      tipTitle: '小贴士',
      tipText: '没有什么问题是难为情的：每个人的身体都不一样，你随时可以与信任的人聊一聊。',
      relatedTitle: '♥  你可能还想看',
      related: [
        {
          title: '你的初潮：会发生什么',
          meta: '5 分钟  ·  指南',
        },
        {
          title: '初潮该选哪种卫生用品？',
          meta: '6 分钟  ·  指南',
        },
        {
          title: '缓解经期疼痛',
          meta: '7 分钟  ·  指南',
        },
      ],
      shareMessage: '关于初潮的常见问题 — AWA',
    },
  id: {
    badge: 'HAID PERTAMA',
    title: 'Pertanyaan yang sering diajukan\ntentang haid pertamamu',
    metaDuration: '4 menit baca',
    metaType: 'FAQ',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Jawaban sederhana untuk pertanyaan yang paling sering muncul tentang haid pertamamu.',
    contentsTitle: 'Dalam artikel ini',
    faq: [
      {
        question: '“Apakah normal kalau darahnya sangat sedikit?”',
        answer: 'Ya. Siklus-siklus pertama sering kali memiliki aliran darah yang ringan. Alirannya bisa berbeda dari satu siklus ke siklus berikutnya, terutama di awal.',
      },
      {
        question: '“Apakah normal kalau darahnya banyak?”',
        answer: 'Aliran yang lebih deras juga bisa terjadi, terutama pada dua hari pertama. Jika kamu perlu mengganti pembalut lebih dari sekali dalam satu jam selama beberapa jam berturut-turut, sebaiknya bicarakan hal ini dengan tenaga kesehatan.',
      },
      {
        question: '“Apakah normal kalau kram?”',
        answer: 'Kram ringan di perut bagian bawah itu umum dan biasanya tidak perlu dikhawatirkan. Kompres botol air panas atau sedikit istirahat bisa membantu. Nyeri yang sangat hebat sebaiknya kamu ceritakan kepada seseorang.',
      },
      {
        question: '“Bolehkah aku berolahraga?”',
        answer: 'Ya, kamu tetap bisa berolahraga saat haid. Sesuaikan saja intensitasnya dengan kondisi tubuhmu hari itu.',
      },
      {
        question: '“Bolehkah aku berenang?”',
        answer: 'Ya, kamu tetap bisa berenang dengan perlindungan yang tepat. Banyak orang memilih menunggu sampai merasa lebih nyaman dengan hal itu.',
      },
    ],
    tipTitle: 'Perlu diketahui',
    tipText: 'Tidak ada pertanyaan yang memalukan: setiap tubuh berbeda, dan kamu selalu bisa bercerita kepada orang yang kamu percaya.',
    relatedTitle: '♥  Mungkin kamu juga suka',
    related: [
      {
        title: 'Haid pertamamu: apa yang bisa diharapkan',
        meta: '5 mnt  ·  Panduan',
      },
      {
        title: 'Pembalut apa yang sebaiknya kupilih untuk haid pertamaku?',
        meta: '6 mnt  ·  Panduan',
      },
      {
        title: 'Mengatasi nyeri haid',
        meta: '7 mnt  ·  Panduan',
      },
    ],
    shareMessage: 'Pertanyaan yang sering diajukan tentang haid pertamamu — AWA',
  },
  hi: {
    badge: 'पहला पीरियड',
    title: 'पहले पीरियड के बारे में\nअक्सर पूछे जाने वाले सवाल',
    metaDuration: '4 मिनट में पढ़ें',
    metaType: 'अक्सर पूछे जाने वाले सवाल',
    metaLevel: 'शुरुआती',
    metaValidated: 'जाँची गई जानकारी',
    intro: 'पहले पीरियड से जुड़े सबसे आम सवालों के सरल जवाब।',
    contentsTitle: 'इस लेख में',
    faq: [
      {
        question: '“क्या बहुत कम ब्लीडिंग होना सामान्य है?”',
        answer: 'हाँ। शुरुआती चक्रों में अक्सर फ़्लो हल्का होता है। खासकर शुरुआत में फ़्लो एक चक्र से दूसरे चक्र में बदल सकता है।',
      },
      {
        question: '“क्या बहुत ज़्यादा ब्लीडिंग होना सामान्य है?”',
        answer: 'ज़्यादा फ़्लो भी हो सकता है, खासकर पहले दो दिनों में। अगर आपको कई घंटों तक लगातार एक घंटे में एक से ज़्यादा बार प्रोटेक्शन बदलना पड़े, तो किसी स्वास्थ्य विशेषज्ञ से इस बारे में बात करना अच्छा रहेगा।',
      },
      {
        question: '“क्या ऐंठन होना सामान्य है?”',
        answer: 'पेट के निचले हिस्से में हल्की ऐंठन आम है और आमतौर पर चिंता की बात नहीं होती। गर्म पानी की बोतल से सेंक या थोड़ा आराम मदद कर सकता है। बहुत तेज़ दर्द हो तो किसी को ज़रूर बताएँ।',
      },
      {
        question: '“क्या मैं खेल-कूद कर सकती हूँ?”',
        answer: 'हाँ, पीरियड में भी आप खेल-कूद कर सकती हैं। बस उस दिन आपका शरीर जैसा महसूस करे, उसके हिसाब से मेहनत कम-ज़्यादा रखें।',
      },
      {
        question: '“क्या मैं तैर सकती हूँ?”',
        answer: 'हाँ, सही प्रोटेक्शन के साथ आप तैर सकती हैं। कई लड़कियाँ बस तब तक इंतज़ार करना चुनती हैं जब तक वे इस बारे में सहज महसूस न करने लगें।',
      },
    ],
    tipTitle: 'जानना अच्छा रहेगा',
    tipText: 'कोई सवाल शर्मिंदगी भरा नहीं होता: हर शरीर अलग होता है, और आप हमेशा किसी भरोसेमंद व्यक्ति से बात कर सकती हैं।',
    relatedTitle: '♥  ये भी आपको पसंद आ सकता है',
    related: [
      {
        title: 'आपका पहला पीरियड: क्या उम्मीद रखें',
        meta: '5 मिनट  ·  गाइड',
      },
      {
        title: 'पहले पीरियड के लिए कौन-सा प्रोटेक्शन चुनूँ?',
        meta: '6 मिनट  ·  गाइड',
      },
      {
        title: 'पीरियड के दर्द को संभालना',
        meta: '7 मिनट  ·  गाइड',
      },
    ],
    shareMessage: 'पहले पीरियड के बारे में अक्सर पूछे जाने वाले सवाल — AWA',
  },
  sq: {
    badge: 'MENSTRUACIONI I PARË',
    title: 'Pyetje të shpeshta\nmbi menstruacionin e parë',
    metaDuration: '4 min lexim',
    metaType: 'Pyetje të shpeshta',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Përgjigje të thjeshta për pyetjet më të shpeshta rreth menstruacionit të parë.',
    contentsTitle: 'Në këtë artikull',
    faq: [
      {
        question: '“A është normale të kem shumë pak gjak?”',
        answer: 'Po. Ciklet e para kanë shpesh rrjedhje të lehtë. Rrjedhja mund të ndryshojë nga një cikël te tjetri, sidomos në fillim.',
      },
      {
        question: '“A është normale të kem shumë gjak?”',
        answer: 'Mund të ndodhë edhe një rrjedhje më e bollshme, sidomos gjatë dy ditëve të para. Nëse të duhet ta ndërrosh mbrojtjen më shumë se një herë në orë për disa orë radhazi, është mirë të flasësh për këtë me një profesionist të shëndetësisë.',
      },
      {
        question: '“A është normale të kem kramba?”',
        answer: 'Krambat e lehta në pjesën e poshtme të barkut janë të zakonshme dhe zakonisht nuk ka arsye shqetësimi. Një shishe me ujë të nxehtë ose pak pushim mund të ndihmojë. Dhimbja shumë e fortë ia vlen t’i thuhet dikujt.',
      },
      {
        question: '“A mund të bëj sport?”',
        answer: 'Po, mund të vazhdosh të bësh sport gjatë menstruacioneve. Thjesht përshtate intensitetin sipas asaj që ndjen trupi yt atë ditë.',
      },
      {
        question: '“A mund të bëj not?”',
        answer: 'Po, mund të vazhdosh të bësh not me mbrojtjen e duhur. Shumë vajza thjesht zgjedhin të presin derisa të ndihen më rehat me idenë.',
      },
    ],
    tipTitle: 'Mirë është ta dish',
    tipText: 'Nuk ka pyetje të turpshme: çdo trup është i ndryshëm dhe mund të flasësh gjithmonë me dikë që i beson.',
    relatedTitle: '♥  Mund të të pëlqejnë edhe',
    related: [
      {
        title: 'Menstruacioni yt i parë: çfarë të presësh',
        meta: '5 min  ·  Udhëzues',
      },
      {
        title: 'Cilën mbrojtje duhet të zgjedh për menstruacionin tim të parë?',
        meta: '6 min  ·  Udhëzues',
      },
      {
        title: 'Menaxhimi i dhimbjes menstruale',
        meta: '7 min  ·  Udhëzues',
      },
    ],
    shareMessage: 'Pyetje të shpeshta mbi menstruacionin e parë — AWA',
  },
  ja: {
    badge: '初経',
    title: '初めての生理について\nよくある質問',
    metaDuration: '読了4分',
    metaType: 'よくある質問',
    metaLevel: '初級',
    metaValidated: '監修済みの内容',
    intro: '初めての生理についてのよくある質問に、わかりやすくお答えします。',
    contentsTitle: 'この記事の内容',
    faq: [
      {
        question: '「血の量がとても少ないのは普通？」',
        answer: 'はい。最初のころの周期は、経血量が少ないことがよくあります。特に始めのうちは、周期ごとに量が変わることがあります。',
      },
      {
        question: '「血の量がとても多いのは普通？」',
        answer: '特に最初の2日間は、経血量が多くなることもあります。数時間続けて、1時間に1回より多く生理用品を交換する必要がある場合は、医療従事者に相談するとよいでしょう。',
      },
      {
        question: '「生理痛があるのは普通？」',
        answer: '下腹部の軽い痛みはよくあることで、たいていは心配ありません。湯たんぽで温めたり、少し休んだりすると楽になることがあります。とても強い痛みは、誰かに伝えておくとよいでしょう。',
      },
      {
        question: '「運動してもいい？」',
        answer: 'はい、生理中でも運動できます。その日の体の調子に合わせて、強さを調整してください。',
      },
      {
        question: '「泳いでもいい？」',
        answer: 'はい、適切な生理用品を使えば泳げます。もう少し慣れるまで待つことを選ぶ人も多くいます。',
      },
    ],
    tipTitle: '知っておきたいこと',
    tipText: '恥ずかしい質問というものはありません。体は人それぞれ違います。信頼できる人にいつでも話してみてください。',
    relatedTitle: '♥  こちらもおすすめ',
    related: [
      {
        title: '初めての生理：知っておきたいこと',
        meta: '5分  ·  ガイド',
      },
      {
        title: '初めての生理にはどんな生理用品を選べばいい？',
        meta: '6分  ·  ガイド',
      },
      {
        title: '生理痛との付き合い方',
        meta: '7分  ·  ガイド',
      },
    ],
    shareMessage: '初めての生理についてよくある質問 — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FirstPeriodFaqArticleScreen({
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

          <AwaText variant="titleMedium" style={styles.intro}>
            {content.intro}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>{content.contentsTitle}</AwaText>

            {content.faq.map((item, index) => (
              <View key={item.question} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="titleSmall" emphasized colorRole="primary" style={styles.contentNumber}>{index + 1}.</AwaText>
                  <AwaText variant="bodyMedium" style={styles.contentText}>
                    {item.question}
                  </AwaText>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </AwaCard>

          {content.faq.map((item, index) => (
            <React.Fragment key={item.question}>
              <AwaText variant="titleMedium" style={styles.h2}>
                {index + 1}. {item.question}
              </AwaText>

              <AwaText variant="bodyMedium" style={styles.body}>{item.answer}</AwaText>

              {FAQ_IMAGES[index] ? (
                <Image
                  source={FAQ_IMAGES[index]}
                  resizeMode="cover"
                  style={styles.wideImage}
                />
              ) : null}
            </React.Fragment>
          ))}

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
                  articleId: RELATED_ARTICLE_IDS[index],
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

      <ReadingControls articleId={ID} durationMinutes={4} scrollRef={scrollRef} />
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
    minHeight: 38,
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
    marginTop: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 3},
  wideImage: {width: '100%', height: 120, marginTop: 16, borderRadius: 12},
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
