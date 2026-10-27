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
const CONTENT = withBrazilianPortuguese('FirstPeriodFaq', {
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
  ko: {
    badge: '첫 생리',
    title: '첫 생리에 대한\n자주 묻는 질문',
    metaDuration: '4분 읽기',
    metaType: '자주 묻는 질문',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '첫 생리에 대해 가장 많이 하는 질문에 쉽게 답해 드려요.',
    contentsTitle: '이 아티클에서는',
    faq: [
      {
        question: '“피가 아주 적게 나와도 괜찮은가요?”',
        answer: '네, 괜찮아요. 처음 몇 번의 주기에는 출혈량이 적은 경우가 많아요. 특히 초기에는 주기마다 출혈량이 달라질 수 있어요.',
      },
      {
        question: '“피가 아주 많이 나와도 괜찮은가요?”',
        answer: '출혈량이 더 많을 수도 있어요. 특히 처음 이틀 동안 그럴 수 있어요. 몇 시간 동안 계속 한 시간에 한 번 넘게 생리용품을 갈아야 한다면 의료 전문가와 상담해 보는 것이 좋아요.',
      },
      {
        question: '“생리통이 있어도 괜찮은가요?”',
        answer: '아랫배가 은은하게 아픈 생리통은 흔하고 보통 걱정하지 않아도 돼요. 따뜻한 물주머니나 약간의 휴식이 도움이 될 수 있어요. 통증이 아주 심하다면 주변 사람에게 이야기해 보세요.',
      },
      {
        question: '“운동을 해도 되나요?”',
        answer: '네, 생리 중에도 운동할 수 있어요. 그날 몸 상태에 맞게 강도만 조절하면 돼요.',
      },
      {
        question: '“수영을 해도 되나요?”',
        answer: '네, 알맞은 생리용품을 쓰면 수영도 할 수 있어요. 많은 사람이 그 상황이 더 편해질 때까지 기다리기도 해요.',
      },
    ],
    tipTitle: '알아 두면 좋아요',
    tipText: '부끄러운 질문이란 없어요. 몸은 모두 다르고, 믿을 수 있는 사람에게 언제든 이야기해도 괜찮아요.',
    relatedTitle: '♥  함께 보면 좋은 글',
    related: [
      {
        title: '첫 생리, 무엇을 기대해야 할까요',
        meta: '5분  ·  가이드',
      },
      {
        title: '첫 생리에는 어떤 생리용품을 골라야 할까요?',
        meta: '6분  ·  가이드',
      },
      {
        title: '생리통 관리하기',
        meta: '7분  ·  가이드',
      },
    ],
    shareMessage: '첫 생리에 대한 자주 묻는 질문 — AWA',
  },
  'pt-PT': {
    badge: 'PRIMEIRO PERÍODO',
    title: 'Perguntas frequentes\nsobre o primeiro período',
    metaDuration: '4 min de leitura',
    metaType: 'Perguntas frequentes',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Respostas simples às perguntas mais comuns sobre o primeiro período.',
    contentsTitle: 'Neste artigo',
    faq: [
      {
        question: '“É normal ter muito pouco sangue?”',
        answer: 'Sim. Os primeiros ciclos têm muitas vezes um fluxo ligeiro. O fluxo pode variar de um ciclo para o outro, sobretudo no início.',
      },
      {
        question: '“É normal ter muito sangue?”',
        answer: 'Um fluxo mais abundante também pode acontecer, sobretudo nos dois primeiros dias. Se precisar de mudar a proteção mais do que uma vez por hora durante várias horas seguidas, é aconselhável falar disso com um profissional de saúde.',
      },
      {
        question: '“É normal ter cólicas?”',
        answer: 'As cólicas ligeiras na parte inferior da barriga são comuns e, normalmente, não têm motivo para preocupação. Uma botija de água quente ou um pouco de descanso podem ajudar. Vale a pena mencionar a alguém uma dor muito intensa.',
      },
      {
        question: '“Posso fazer desporto?”',
        answer: 'Sim, pode continuar a fazer desporto durante o período. Basta adaptar a intensidade ao que o seu corpo sente nesse dia.',
      },
      {
        question: '“Posso ir nadar?”',
        answer: 'Sim, pode continuar a nadar com a proteção adequada. Muitas pessoas preferem simplesmente esperar até se sentirem mais à vontade com a ideia.',
      },
    ],
    tipTitle: 'Bom saber',
    tipText: 'Não existem perguntas embaraçosas: cada corpo é diferente e pode sempre falar com alguém em quem confie.',
    relatedTitle: '♥  Também pode gostar',
    related: [
      {
        title: 'O seu primeiro período: o que esperar',
        meta: '5 min  ·  Guia',
      },
      {
        title: 'Que proteção devo escolher para o meu primeiro período?',
        meta: '6 min  ·  Guia',
      },
      {
        title: 'Gerir a dor menstrual',
        meta: '7 min  ·  Guia',
      },
    ],
    shareMessage: 'Perguntas frequentes sobre o primeiro período — AWA',
  },
  bn: {
    badge: 'প্রথম মাসিক',
    title: 'প্রথম মাসিক নিয়ে\nসচরাচর জিজ্ঞাসা',
    metaDuration: 'পড়তে 4 মিনিট',
    metaType: 'সচরাচর জিজ্ঞাসা',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'প্রথম মাসিক নিয়ে সবচেয়ে প্রচলিত প্রশ্নগুলোর সহজ উত্তর।',
    contentsTitle: 'এই নিবন্ধে',
    faq: [
      {
        question: '“খুব কম রক্তক্ষরণ হওয়া কি স্বাভাবিক?”',
        answer: 'হ্যাঁ। একদম প্রথম দিকের চক্রগুলোতে প্রায়ই রক্তক্ষরণ কম হয়। বিশেষ করে শুরুর দিকে এক চক্র থেকে আরেক চক্রে রক্তক্ষরণের পরিমাণ বদলাতে পারে।',
      },
      {
        question: '“অনেক বেশি রক্তক্ষরণ হওয়া কি স্বাভাবিক?”',
        answer: 'বেশি রক্তক্ষরণও হতে পারে, বিশেষ করে প্রথম দুই দিনে। টানা কয়েক ঘণ্টা ধরে যদি ঘণ্টায় একবারের বেশি সুরক্ষা সামগ্রী বদলাতে হয়, তাহলে এ বিষয়ে একজন স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে কথা বলা ভালো।',
      },
      {
        question: '“তলপেটে ব্যথা হওয়া কি স্বাভাবিক?”',
        answer: 'তলপেটে হালকা ব্যথা সাধারণ এবং সাধারণত দুশ্চিন্তার কিছু নয়। গরম পানির ব্যাগ বা একটু বিশ্রাম সাহায্য করতে পারে। খুব তীব্র ব্যথা হলে কাউকে জানানো উচিত।',
      },
      {
        question: '“আমি কি খেলাধুলা করতে পারি?”',
        answer: 'হ্যাঁ, মাসিকের সময়ও খেলাধুলা করতে পারেন। শুধু সেদিন আপনার শরীর কেমন বোধ করছে, সেই অনুযায়ী তীব্রতা ঠিক করে নিন।',
      },
      {
        question: '“আমি কি সাঁতার কাটতে পারি?”',
        answer: 'হ্যাঁ, সঠিক সুরক্ষা সামগ্রী ব্যবহার করে সাঁতার কাটতে পারেন। অনেকেই বিষয়টি নিয়ে আরও স্বচ্ছন্দ বোধ না করা পর্যন্ত অপেক্ষা করতে পছন্দ করেন।',
      },
    ],
    tipTitle: 'জেনে রাখা ভালো',
    tipText: '“লজ্জাজনক প্রশ্ন” বলে কিছু নেই: প্রতিটি শরীর আলাদা, আর আপনি সবসময় বিশ্বস্ত কারও সঙ্গে কথা বলতে পারেন।',
    relatedTitle: '♥  আপনার আরও ভালো লাগতে পারে',
    related: [
      {
        title: 'আপনার প্রথম মাসিক: কী আশা করবেন',
        meta: '5 মিনিট  ·  গাইড',
      },
      {
        title: 'প্রথম মাসিকের জন্য কোন সুরক্ষা সামগ্রী বেছে নেব?',
        meta: '6 মিনিট  ·  গাইড',
      },
      {
        title: 'মাসিকের ব্যথা সামলানো',
        meta: '7 মিনিট  ·  গাইড',
      },
    ],
    shareMessage: 'প্রথম মাসিক নিয়ে সচরাচর জিজ্ঞাসা — AWA',
  },
  da: {
    badge: 'FØRSTE MENSTRUATION',
    title: 'Hyppige spørgsmål om\nden første menstruation',
    metaDuration: '4 min læsning',
    metaType: 'FAQ',
    metaLevel: 'Grundlæggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Simple svar på de mest almindelige spørgsmål om den første menstruation.',
    contentsTitle: 'I denne artikel',
    faq: [
      {
        question: '"Er det normalt at bløde meget lidt?"',
        answer: 'Ja. De allertidligste cyklusser er ofte lette. Blødningsmængden kan variere fra cyklus til cyklus, især i starten.',
      },
      {
        question: '"Er det normalt at bløde meget?"',
        answer: 'Kraftig blødning kan også forekomme, især i de første to dage. Hvis du skal skifte beskyttelse mere end én gang i timen i flere timer i træk, er det en god idé at tale med en sundhedsprofessionel.',
      },
      {
        question: '"Er det normalt at have mavesmerter?"',
        answer: 'Let mavesmerter er normalt og giver generelt ikke anledning til bekymring. En varmepude eller lidt hvile kan hjælpe. Kontakt nogen, hvis smerten er meget kraftig.',
      },
      {
        question: '"Kan jeg dyrke sport?"',
        answer: 'Ja, du kan dyrke sport under menstruationen. Juster bare intensiteten efter, hvordan du har det den dag.',
      },
      {
        question: '"Kan jeg svømme?"',
        answer: 'Ja, du kan svømme med den rette beskyttelse. Mange foretrækker at vente, til de er mere fortrolige med det.',
      },
    ],
    tipTitle: 'Godt at vide',
    tipText: 'Der findes ingen "pinlige spørgsmål": enhver krop er forskellig, og du kan altid tale med nogen du stoler på.',
    relatedTitle: '♥  Du vil måske også synes om',
    related: [
      {
        title: 'Din første menstruation: hvad du kan forvente',
        meta: '5 min  ·  Guide',
      },
      {
        title: 'Hvilken beskyttelse skal jeg vælge til min første menstruation?',
        meta: '6 min  ·  Guide',
      },
      {
        title: 'At håndtere menstruationssmerter',
        meta: '7 min  ·  Guide',
      },
    ],
    shareMessage: 'Hyppige spørgsmål om den første menstruation — AWA',
  },
  sv: {
    badge: 'FÖRSTE MENSTRUATION',
    title: 'Hyppige spörgsmål om\nden förste menstruation',
    metaDuration: '4 min läsning',
    metaType: 'FAQ',
    metaLevel: 'Grundläggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Simple svar på de mest almindelige spörgsmål om den förste menstruation.',
    contentsTitle: 'I denne artikel',
    faq: [
      {
        question: '"Er det normalt at blöde mycket lidt?"',
        answer: 'Ja. De allertidligste cyklusser ar ofta lette. Blödningsmängden kan variere fran cyklus till cyklus, isär i starten.',
      },
      {
        question: '"Er det normalt at blöde meget?"',
        answer: 'Kraftig blödning kan også forekomme, isär i de förste to dagar. Hvis du skal skifte beskyttelse mere end én gang i timen i flere timer i träk, ar det en god idé at tale med en halsasprofessionel.',
      },
      {
        question: '"Er det normalt at have mavesmerter?"',
        answer: 'Let mavesmartor ar normalt och giver generelt inte anledning till bekymring. En varmepude eller lite hvile kan hjälpe. Kontakt nogen, hvis smerten ar mycket kraftig.',
      },
      {
        question: '"Kan jag dyrke sport?"',
        answer: 'Ja, du kan dyrke sport under menstruationen. Juster bare intensiteten efter, hvordan du har det den dag.',
      },
      {
        question: '"Kan jag svömme?"',
        answer: 'Ja, du kan svömme med den rette beskyttelse. Mange foreträkker at vente, till de ar mere fortrolige med det.',
      },
    ],
    tipTitle: 'Godt at vide',
    tipText: 'Der findes ingen "pinlige spörgsmål": enhver krop ar forskellig, och du kan alltid tale med nogen du stoler på.',
    relatedTitle: '♥  Du vil måske også synes om',
    related: [
      {
        title: 'Din förste menstruation: hvad du kan forvente',
        meta: '5 min  ·  Guide',
      },
      {
        title: 'Hvilken beskyttelse skal jag välge till min förste menstruation?',
        meta: '6 min  ·  Guide',
      },
      {
        title: 'At håndtere menstruationssmerter',
        meta: '7 min  ·  Guide',
      },
    ],
    shareMessage: 'Hyppige spörgsmål om den förste menstruation — AWA',
  },
  nb: {
    badge: 'FØRSTE MENS',
    title: 'Ofte stilte spørsmål\nom den første mensen',
    metaDuration: '4 min lesing',
    metaType: 'Vanlige spørsmål',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Enkle svar på de vanligste spørsmålene om den første mensen.',
    contentsTitle: 'I denne artikkelen',
    faq: [
      {
        question: '«Er det normalt å blø veldig lite?»',
        answer:
          'Ja. De aller første syklusene har ofte lett blødning. Blødningen kan variere fra en syklus til den neste, særlig i begynnelsen.',
      },
      {
        question: '«Er det normalt å blø mye?»',
        answer:
          'Kraftigere blødning kan også forekomme, særlig de to første dagene. Hvis du må bytte beskyttelse oftere enn én gang i timen i flere timer på rad, er det lurt å snakke med helsepersonell om det.',
      },
      {
        question: '«Er det normalt å ha kramper?»',
        answer:
          'Milde kramper i nedre del av magen er vanlige og som regel ikke noe å bekymre seg for. En varmeflaske eller litt hvile kan hjelpe. Svært sterke smerter er verdt å nevne for noen.',
      },
      {
        question: '«Kan jeg drive med idrett?»',
        answer:
          'Ja, du kan fortsatt drive med idrett under mensen. Juster bare intensiteten etter hvordan kroppen din føler seg den dagen.',
      },
      {
        question: '«Kan jeg bade?»',
        answer:
          'Ja, du kan fortsatt bade med riktig beskyttelse. Mange velger rett og slett å vente til de føler seg mer komfortable med tanken.',
      },
    ],
    tipTitle: 'Godt å vite',
    tipText: 'Det finnes ikke noe pinlig spørsmål: hver kropp er forskjellig, og du kan alltid snakke med noen du stoler på.',
    relatedTitle: '♥  Dette liker du kanskje også',
    related: [
      {title: 'Din første mens: hva du kan forvente', meta: '5 min  ·  Veiledning'},
      {title: 'Hvilken beskyttelse bør jeg velge til den første mensen?', meta: '6 min  ·  Veiledning'},
      {title: 'Håndtere menstruasjonssmerter', meta: '7 min  ·  Veiledning'},
    ],
    shareMessage: 'Ofte stilte spørsmål om den første mensen – AWA',
  },
  pl: {
    badge: 'PIERWSZA MIESIĄCZKA',
    title: 'Najczęściej zadawane pytania\no pierwszą miesiączkę',
    metaDuration: '4 min czytania',
    metaType: 'FAQ',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Proste odpowiedzi na najczęstsze pytania o pierwszą miesiączkę.',
    contentsTitle: 'W tym artykule',
    faq: [
      {
        question: '„Czy to normalne, że krwawienie jest bardzo skąpe?”',
        answer:
          'Tak. Pierwsze cykle często mają skąpe krwawienie. Obfitość może się zmieniać z cyklu na cykl, zwłaszcza na początku.',
      },
      {
        question: '„Czy to normalne, że krwawienie jest obfite?”',
        answer:
          'Zdarza się też obfitsze krwawienie, zwłaszcza w pierwszych dwóch dniach. Jeśli przez kilka godzin z rzędu musisz zmieniać środek ochrony częściej niż raz na godzinę, warto porozmawiać o tym ze specjalistą.',
      },
      {
        question: '„Czy to normalne, że mam skurcze?”',
        answer:
          'Łagodne skurcze w dolnej części brzucha są częste i zwykle nie ma powodu do niepokoju. Pomóc może termofor lub odrobina odpoczynku. O bardzo silnym bólu warto komuś powiedzieć.',
      },
      {
        question: '„Czy mogę uprawiać sport?”',
        answer:
          'Tak, podczas miesiączki nadal możesz uprawiać sport. Po prostu dostosuj intensywność do tego, jak czuje się Twoje ciało danego dnia.',
      },
      {
        question: '„Czy mogę pływać?”',
        answer:
          'Tak, przy odpowiednim środku ochrony nadal możesz pływać. Wiele osób po prostu woli poczekać, aż poczują się swobodniej z tą myślą.',
      },
    ],
    tipTitle: 'Warto wiedzieć',
    tipText: 'Nie ma czegoś takiego jak wstydliwe pytanie: każde ciało jest inne i zawsze możesz porozmawiać z kimś, komu ufasz.',
    relatedTitle: '♥  Może Cię też zainteresować',
    related: [
      {title: 'Twoja pierwsza miesiączka: czego się spodziewać', meta: '5 min  ·  Poradnik'},
      {title: 'Jaki środek ochrony wybrać na pierwszą miesiączkę?', meta: '6 min  ·  Poradnik'},
      {title: 'Jak radzić sobie z bólem miesiączkowym', meta: '7 min  ·  Poradnik'},
    ],
    shareMessage: 'Najczęściej zadawane pytania o pierwszą miesiączkę — AWA',
  },
  uk: {
    badge: 'ПЕРША МЕНСТРУАЦІЯ',
    title: 'Поширені запитання\nпро першу менструацію',
    metaDuration: '4 хв читання',
    metaType: 'Запитання',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Прості відповіді на найчастіші запитання про першу менструацію.',
    contentsTitle: 'У цій статті',
    faq: [
      {
        question: '«Чи нормально, що виділень дуже мало?»',
        answer:
          'Так. Перші цикли часто супроводжуються слабкими виділеннями. Інтенсивність може змінюватися від циклу до циклу, особливо на початку.',
      },
      {
        question: '«Чи нормально, що виділень багато?»',
        answer:
          'Рясніші виділення також можливі, особливо в перші два дні. Якщо кілька годин поспіль вам доводиться змінювати засіб гігієни частіше ніж раз на годину, варто поговорити про це з лікарем.',
      },
      {
        question: '«Чи нормально, що в мене спазми?»',
        answer:
          'Легкі спазми внизу живота — звичайне явище, і зазвичай це не привід для занепокоєння. Допомогти можуть грілка або трохи відпочинку. Про дуже сильний біль варто комусь розповісти.',
      },
      {
        question: '«Чи можна займатися спортом?»',
        answer:
          'Так, під час менструації ви все ще можете займатися спортом. Просто підберіть інтенсивність відповідно до самопочуття вашого тіла цього дня.',
      },
      {
        question: '«Чи можна плавати?»',
        answer:
          'Так, з відповідним засобом гігієни ви все ще можете плавати. Багато хто просто воліє зачекати, поки почуватиметься впевненіше з цією думкою.',
      },
    ],
    tipTitle: 'Варто знати',
    tipText: 'Не існує незручних запитань: кожне тіло різне, і ви завжди можете поговорити з тим, кому довіряєте.',
    relatedTitle: '♥  Вас також може зацікавити',
    related: [
      {title: 'Ваша перша менструація: чого очікувати', meta: '5 хв  ·  Посібник'},
      {title: 'Який засіб гігієни обрати для першої менструації?', meta: '6 хв  ·  Посібник'},
      {title: 'Як упоратися з менструальним болем', meta: '7 хв  ·  Посібник'},
    ],
    shareMessage: 'Поширені запитання про першу менструацію — AWA',
  },
  cs: {
    badge: 'PRVNÍ MENSTRUACE',
    title: 'Často kladené otázky\no první menstruaci',
    metaDuration: '4 min čtení',
    metaType: 'Časté dotazy',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Jednoduché odpovědi na nejčastější otázky o první menstruaci.',
    contentsTitle: 'V tomto článku',
    faq: [
      {
        question: '„Je normální mít velmi málo krve?“',
        answer:
          'Ano. Úplně první cykly mívají slabé krvácení. Množství se může od cyklu k cyklu lišit, zejména na začátku.',
      },
      {
        question: '„Je normální mít hodně krve?“',
        answer:
          'Silnější krvácení se také může objevit, zejména během prvních dvou dnů. Pokud potřebujete měnit ochranu častěji než jednou za hodinu několik hodin po sobě, je dobré o tom promluvit se zdravotnickým pracovníkem.',
      },
      {
        question: '„Je normální mít křeče?“',
        answer:
          'Mírné křeče v podbřišku jsou běžné a obvykle nejsou důvodem k obavám. Pomoci může termofor nebo trocha odpočinku. Velmi intenzivní bolest stojí za to někomu říct.',
      },
      {
        question: '„Mohu sportovat?“',
        answer:
          'Ano, během menstruace můžete dál sportovat. Jen přizpůsobte intenzitu tomu, jak se vaše tělo ten den cítí.',
      },
      {
        question: '„Mohu chodit plavat?“',
        answer:
          'Ano, s vhodnou ochranou můžete dál plavat. Mnoho dívek si prostě raději počká, až se s touto myšlenkou bude cítit pohodlněji.',
      },
    ],
    tipTitle: 'Stojí za to vědět',
    tipText: 'Neexistuje trapná otázka: každé tělo je jiné a vždy si můžete promluvit s někým, komu důvěřujete.',
    relatedTitle: '♥  Mohlo by se vám líbit',
    related: [
      {title: 'Vaše první menstruace: co očekávat', meta: '5 min  ·  Průvodce'},
      {title: 'Jakou ochranu zvolit při první menstruaci?', meta: '6 min  ·  Průvodce'},
      {title: 'Zvládání menstruační bolesti', meta: '7 min  ·  Průvodce'},
    ],
    shareMessage: 'Často kladené otázky o první menstruaci — AWA',
  },
  sk: {
    badge: 'PRVÁ MENŠTRUÁCIA',
    title: 'Často kladené otázky\no prvej menštruácii',
    metaDuration: '4 min čítania',
    metaType: 'Často kladené otázky',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Jednoduché odpovede na najčastejšie otázky o prvej menštruácii.',
    contentsTitle: 'V tomto článku',
    faq: [
      {
        question: '„Je normálne, že mám veľmi málo krvi?“',
        answer:
          'Áno. Úplne prvé cykly majú často slabé krvácanie. Množstvo krvácania sa môže z cyklu na cyklus líšiť, najmä na začiatku.',
      },
      {
        question: '„Je normálne, že mám veľa krvi?“',
        answer:
          'Silnejšie krvácanie sa môže vyskytnúť tiež, najmä počas prvých dvoch dní. Ak potrebujete meniť hygienickú pomôcku častejšie ako raz za hodinu niekoľko hodín po sebe, je dobré porozprávať sa o tom so zdravotníckym pracovníkom.',
      },
      {
        question: '„Je normálne, že mám kŕče?“',
        answer:
          'Mierne kŕče v podbrušku sú bežné a zvyčajne nie sú dôvodom na obavy. Môže pomôcť termofor alebo trocha odpočinku. O veľmi silnej bolesti stojí za to niekomu povedať.',
      },
      {
        question: '„Môžem športovať?“',
        answer:
          'Áno, počas menštruácie môžete naďalej športovať. Len prispôsobte intenzitu tomu, ako sa vaše telo ten deň cíti.',
      },
      {
        question: '„Môžem chodiť plávať?“',
        answer:
          'Áno, s vhodnou hygienickou pomôckou môžete plávať aj naďalej. Mnohé dievčatá si jednoducho zvolia počkať, kým sa s touto myšlienkou budú cítiť pohodlnejšie.',
      },
    ],
    tipTitle: 'Stojí za to vedieť',
    tipText: 'Neexistuje trápna otázka: každé telo je iné a vždy sa môžete porozprávať s niekým, komu dôverujete.',
    relatedTitle: '♥  Mohlo by sa vám páčiť',
    related: [
      {title: 'Vaša prvá menštruácia: čo očakávať', meta: '5 min  ·  Sprievodca'},
      {title: 'Ktorú hygienickú pomôcku si vybrať na prvú menštruáciu?', meta: '6 min  ·  Sprievodca'},
      {title: 'Zvládanie menštruačných bolestí', meta: '7 min  ·  Sprievodca'},
    ],
    shareMessage: 'Často kladené otázky o prvej menštruácii — AWA',
  },
  hu: {
    badge: 'AZ ELSŐ MENSTRUÁCIÓ',
    title: 'Gyakran ismételt kérdések\naz első menstruációról',
    metaDuration: '4 perc olvasás',
    metaType: 'GYIK',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Egyszerű válaszok az első menstruációval kapcsolatos leggyakoribb kérdésekre.',
    contentsTitle: 'Ebben a cikkben',
    faq: [
      {
        question: '„Normális, hogy nagyon kevés a vérzésem?”',
        answer:
          'Igen. A legelső ciklusok vérzése gyakran gyenge. A vérzés ciklusról ciklusra eltérhet, különösen az elején.',
      },
      {
        question: '„Normális, hogy sok a vérzésem?”',
        answer:
          'Erősebb vérzés is előfordulhat, különösen az első két napon. Ha több órán át óránként többször kell cserélned a higiéniai terméket, érdemes ezt megbeszélned egy egészségügyi szakemberrel.',
      },
      {
        question: '„Normális, hogy görcseim vannak?”',
        answer:
          'Az alhasi enyhe görcsök gyakoriak, és általában nem adnak okot aggodalomra. Segíthet egy meleg vizes palack vagy egy kis pihenés. A nagyon erős fájdalmat érdemes valakinek jelezni.',
      },
      {
        question: '„Sportolhatok?”',
        answer:
          'Igen, a menstruáció alatt is sportolhatsz. Csak igazítsd az intenzitást ahhoz, ahogyan a tested aznap érzi magát.',
      },
      {
        question: '„Úszhatok?”',
        answer:
          'Igen, megfelelő védelemmel továbbra is úszhatsz. Sokan egyszerűen úgy döntenek, hogy megvárják, amíg kényelmesebben érzik magukat ezzel a gondolattal.',
      },
    ],
    tipTitle: 'Érdemes tudni',
    tipText: 'Nincs olyan, hogy kínos kérdés: minden test más, és bármikor beszélhetsz valakivel, akiben megbízol.',
    relatedTitle: '♥  Ez is tetszhet',
    related: [
      {title: 'Az első menstruációd: mire számíts', meta: '5 perc  ·  Útmutató'},
      {title: 'Melyik higiéniai terméket válasszam az első menstruációmra?', meta: '6 perc  ·  Útmutató'},
      {title: 'A menstruációs fájdalom kezelése', meta: '7 perc  ·  Útmutató'},
    ],
    shareMessage: 'Gyakran ismételt kérdések az első menstruációról — AWA',
  },
  ro: {
    badge: 'PRIMA MENSTRUAȚIE',
    title: 'Întrebări frecvente\ndespre prima menstruație',
    metaDuration: '4 min de citit',
    metaType: 'Întrebări frecvente',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Răspunsuri simple la cele mai frecvente întrebări despre prima ta menstruație.',
    contentsTitle: 'În acest articol',
    faq: [
      {
        question: '„Este normal să am foarte puțin sânge?”',
        answer:
          'Da. Primele cicluri au adesea un flux ușor. Fluxul poate varia de la un ciclu la altul, mai ales la început.',
      },
      {
        question: '„Este normal să am mult sânge?”',
        answer:
          'Un flux mai abundent se poate întâmpla și el, mai ales în primele două zile. Dacă trebuie să-ți schimbi protecția mai des de o dată pe oră, timp de mai multe ore la rând, este bine să vorbești despre asta cu un profesionist din domeniul sănătății.',
      },
      {
        question: '„Este normal să am crampe?”',
        answer:
          'Crampele ușoare în partea de jos a burții sunt frecvente și de obicei nu sunt motiv de îngrijorare. O sticlă cu apă caldă sau puțină odihnă pot ajuta. Merită să spui cuiva despre o durere foarte intensă.',
      },
      {
        question: '„Pot face sport?”',
        answer:
          'Da, poți face în continuare sport în timpul menstruației. Doar ajustează intensitatea la cum se simte corpul tău în ziua respectivă.',
      },
      {
        question: '„Pot merge la înot?”',
        answer:
          'Da, poți merge în continuare la înot cu protecția potrivită. Multe persoane aleg pur și simplu să aștepte până se simt mai confortabil cu ideea.',
      },
    ],
    tipTitle: 'Bine de știut',
    tipText: 'Nu există întrebări jenante: fiecare corp este diferit și poți oricând să vorbești cu o persoană în care ai încredere.',
    relatedTitle: '♥  Ți-ar putea plăcea și',
    related: [
      {title: 'Prima ta menstruație: la ce să te aștepți', meta: '5 min  ·  Ghid'},
      {title: 'Ce protecție să aleg pentru prima menstruație?', meta: '6 min  ·  Ghid'},
      {title: 'Gestionarea durerilor menstruale', meta: '7 min  ·  Ghid'},
    ],
    shareMessage: 'Întrebări frecvente despre prima menstruație — AWA',
  },
  bg: {
    badge: 'ПЪРВА МЕНСТРУАЦИЯ',
    title: 'Често задавани въпроси\nза първата менструация',
    metaDuration: '4 мин четене',
    metaType: 'Чести въпроси',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Прости отговори на най-честите въпроси за първата ти менструация.',
    contentsTitle: 'В тази статия',
    faq: [
      {
        question: '„Нормално ли е да има много малко кръв?“',
        answer:
          'Да. Най-първите цикли често имат слаб поток. Потокът може да варира от един цикъл до следващия, особено в началото.',
      },
      {
        question: '„Нормално ли е да има много кръв?“',
        answer:
          'По-обилен поток също може да се случи, особено през първите два дни. Ако трябва да сменяш защитата си повече от веднъж на час в продължение на няколко часа подред, добре е да поговориш за това със здравен специалист.',
      },
      {
        question: '„Нормално ли е да има крампи?“',
        answer:
          'Леките крампи в долната част на корема са чести и обикновено не са повод за тревога. Грейка с гореща вода или малко почивка могат да помогнат. Много силна болка заслужава да бъде споделена с някого.',
      },
      {
        question: '„Мога ли да спортувам?“',
        answer:
          'Да, можеш да продължиш да спортуваш по време на менструацията. Просто приспособи интензитета към това как се чувства тялото ти в този ден.',
      },
      {
        question: '„Мога ли да плувам?“',
        answer:
          'Да, можеш да продължиш да плуваш с подходяща защита. Много хора просто избират да изчакат, докато се почувстват по-комфортно с тази идея.',
      },
    ],
    tipTitle: 'Добре е да знаеш',
    tipText: 'Няма неловки въпроси: всяко тяло е различно и винаги можеш да поговориш с човек, на когото се доверяваш.',
    relatedTitle: '♥  Може да ти хареса и',
    related: [
      {title: 'Първата ти менструация: какво да очакваш', meta: '5 мин  ·  Ръководство'},
      {title: 'Каква защита да избера за първата си менструация?', meta: '6 мин  ·  Ръководство'},
      {title: 'Справяне с менструалната болка', meta: '7 мин  ·  Ръководство'},
    ],
    shareMessage: 'Често задавани въпроси за първата менструация — AWA',
  },
  sr: {
    badge: 'ПРВА МЕНСТРУАЦИЈА',
    title: 'Често постављана питања\nо првој менструацији',
    metaDuration: '4 мин читања',
    metaType: 'Честа питања',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Једноставни одговори на најчешћа питања о твојој првој менструацији.',
    contentsTitle: 'У овом чланку',
    faq: [
      {
        question: '„Да ли је нормално да има веома мало крви?“',
        answer:
          'Да. Прави први циклуси често имају слаб проток. Проток може варирати од једног циклуса до другог, нарочито на почетку.',
      },
      {
        question: '„Да ли је нормално да има много крви?“',
        answer:
          'Може се десити и јачи проток, нарочито током прва два дана. Ако треба да мењаш заштиту чешће од једном на сат неколико сати заредом, добро је да разговараш о томе са здравственим радником.',
      },
      {
        question: '„Да ли је нормално имати грчеве?“',
        answer:
          'Благи грчеви у доњем делу стомака су чести и обично нису разлог за бригу. Боца са топлом водом или мало одмора могу помоћи. Веома јак бол вреди поменути некоме.',
      },
      {
        question: '„Могу ли да се бавим спортом?“',
        answer:
          'Да, током менструације и даље можеш да се бавиш спортом. Само прилагоди интензитет томе како се твоје тело осећа тог дана.',
      },
      {
        question: '„Могу ли да пливам?“',
        answer:
          'Да, и даље можеш да пливаш уз одговарајућу заштиту. Многе једноставно изаберу да сачекају док се не осећају удобније са том идејом.',
      },
    ],
    tipTitle: 'Добро је знати',
    tipText: 'Не постоји непријатно питање: свако тело је другачије, а увек можеш разговарати са неким коме верујеш.',
    relatedTitle: '♥  Можда ће ти се свидети и',
    related: [
      {title: 'Твоја прва менструација: шта да очекујеш', meta: '5 мин  ·  Водич'},
      {title: 'Коју заштиту да изаберем за прву менструацију?', meta: '6 мин  ·  Водич'},
      {title: 'Како се носити са менструалним боловима', meta: '7 мин  ·  Водич'},
    ],
    shareMessage: 'Често постављана питања о првој менструацији — AWA',
  },
  hr: {
    badge: 'PRVA MENSTRUACIJA',
    title: 'Često postavljana pitanja\no prvoj menstruaciji',
    metaDuration: '4 min čitanja',
    metaType: 'Česta pitanja',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Jednostavni odgovori na najčešća pitanja o prvoj menstruaciji.',
    contentsTitle: 'U ovom članku',
    faq: [
      {
        question: '„Je li normalno imati vrlo malo krvi?“',
        answer:
          'Da. Prvi ciklusi često imaju slab protok. Protok se može razlikovati od ciklusa do ciklusa, osobito na početku.',
      },
      {
        question: '„Je li normalno imati puno krvi?“',
        answer:
          'Obilniji protok također se može dogoditi, osobito prva dva dana. Ako zaštitu moraš mijenjati češće od jednom na sat tijekom nekoliko sati zaredom, dobro je o tome razgovarati sa zdravstvenim djelatnikom.',
      },
      {
        question: '„Je li normalno imati grčeve?“',
        answer:
          'Blagi grčevi u donjem dijelu trbuha česti su i obično nisu razlog za zabrinutost. Termofor ili malo odmora mogu pomoći. Vrlo jaku bol vrijedi spomenuti nekome.',
      },
      {
        question: '„Mogu li se baviti sportom?“',
        answer:
          'Da, tijekom menstruacije i dalje se možeš baviti sportom. Samo prilagodi intenzitet tome kako se tvoje tijelo taj dan osjeća.',
      },
      {
        question: '„Mogu li ići na plivanje?“',
        answer:
          'Da, uz odgovarajuću zaštitu i dalje možeš ići na plivanje. Mnoge se osobe jednostavno odluče pričekati dok se ne osjećaju ugodnije s tom idejom.',
      },
    ],
    tipTitle: 'Dobro je znati',
    tipText: 'Ne postoji neugodno pitanje: svako je tijelo drugačije i uvijek možeš razgovarati s osobom kojoj vjeruješ.',
    relatedTitle: '♥  Moglo bi ti se svidjeti',
    related: [
      {title: 'Tvoja prva menstruacija: što očekivati', meta: '5 min  ·  Vodič'},
      {title: 'Koju zaštitu odabrati za prvu menstruaciju?', meta: '6 min  ·  Vodič'},
      {title: 'Nošenje s menstrualnom boli', meta: '7 min  ·  Vodič'},
    ],
    shareMessage: 'Često postavljana pitanja o prvoj menstruaciji — AWA',
  },
  bs: {
    badge: 'PRVA MENSTRUACIJA',
    title: 'Često postavljana pitanja\no prvoj menstruaciji',
    metaDuration: '4 min čitanja',
    metaType: 'Česta pitanja',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Jednostavni odgovori na najčešća pitanja o prvoj menstruaciji.',
    contentsTitle: 'U ovom članku',
    faq: [
      {
        question: '„Je li normalno imati vrlo malo krvi?“',
        answer:
          'Da. Prvi ciklusi često imaju slab protok. Protok se može razlikovati od ciklusa do ciklusa, osobito na početku.',
      },
      {
        question: '„Je li normalno imati puno krvi?“',
        answer:
          'Obilniji protok također se može dogoditi, osobito prva dva dana. Ako zaštitu moraš mijenjati češće od jednom na sat tokom nekoliko sati zaredom, dobro je o tome razgovarati sa zdravstvenim radnikom.',
      },
      {
        question: '„Je li normalno imati grčeve?“',
        answer:
          'Blagi grčevi u donjem dijelu trbuha česti su i obično nisu razlog za zabrinutost. Termofor ili malo odmora mogu pomoći. Vrlo jaku bol vrijedi spomenuti nekome.',
      },
      {
        question: '„Mogu li se baviti sportom?“',
        answer:
          'Da, tokom menstruacije i dalje se možeš baviti sportom. Samo prilagodi intenzitet tome kako se tvoje tijelo taj dan osjeća.',
      },
      {
        question: '„Mogu li ići na plivanje?“',
        answer:
          'Da, uz odgovarajuću zaštitu i dalje možeš ići na plivanje. Mnoge se osobe jednostavno odluče pričekati dok se ne osjećaju ugodnije s tom idejom.',
      },
    ],
    tipTitle: 'Dobro je znati',
    tipText: 'Ne postoji neugodno pitanje: svako je tijelo drugačije i uvijek možeš razgovarati s osobom kojoj vjeruješ.',
    relatedTitle: '♥  Moglo bi ti se svidjeti',
    related: [
      {title: 'Tvoja prva menstruacija: što očekivati', meta: '5 min  ·  Vodič'},
      {title: 'Koju zaštitu odabrati za prvu menstruaciju?', meta: '6 min  ·  Vodič'},
      {title: 'Nošenje s menstrualnom boli', meta: '7 min  ·  Vodič'},
    ],
    shareMessage: 'Često postavljana pitanja o prvoj menstruaciji — AWA',
  },
  sl: {
    badge: 'PRVA MENSTRUACIJA',
    title: 'Pogosto zastavljena vprašanja\no prvi menstruaciji',
    metaDuration: '4 min branja',
    metaType: 'Pogosta vprašanja',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Preprosti odgovori na najpogostejša vprašanja o prvi menstruaciji.',
    contentsTitle: 'V tem članku',
    faq: [
      {
        question: '„Ali je normalno imeti zelo malo krvi?“',
        answer:
          'Da. Prvi cikli imajo pogosto šibek tok. Tok se lahko razlikuje od cikla do cikla, zlasti na začetku.',
      },
      {
        question: '„Ali je normalno imeti veliko krvi?“',
        answer:
          'Obilnejši tok se lahko tudi pojavi, zlasti prva dva dni. Če moraš zaščito menjati pogosteje kot enkrat na uro več ur zapored, se je dobro o tem pogovoriti z zdravstvenim delavcem.',
      },
      {
        question: '„Ali je normalno imeti krče?“',
        answer:
          'Blagi krči v spodnjem delu trebuha so pogosti in običajno niso razlog za zaskrbljenost. Termofor ali malo počitka lahko pomaga. Zelo hudo bolečino je vredno nekomu omeniti.',
      },
      {
        question: '„Ali se lahko ukvarjam s športom?“',
        answer:
          'Da, med menstruacijo se še vedno lahko ukvarjaš s športom. Samo prilagodi intenzivnost temu, kako se tvoje telo ta dan počuti.',
      },
      {
        question: '„Ali lahko grem plavat?“',
        answer:
          'Da, z ustrezno zaščito lahko še vedno greš plavat. Mnoge osebe se preprosto odločijo počakati, dokler se ne počutijo bolj udobno s to idejo.',
      },
    ],
    tipTitle: 'Vredno vedeti',
    tipText: 'Ne obstaja nerodno vprašanje: vsako telo je drugačno in vedno se lahko pogovoriš z osebo, ki ji zaupaš.',
    relatedTitle: '♥  Morda ti bo všeč tudi',
    related: [
      {title: 'Tvoja prva menstruacija: kaj pričakovati', meta: '5 min  ·  Vodnik'},
      {title: 'Katero zaščito izbrati za prvo menstruacijo?', meta: '6 min  ·  Vodnik'},
      {title: 'Obvladovanje menstrualne bolečine', meta: '7 min  ·  Vodnik'},
    ],
    shareMessage: 'Pogosto zastavljena vprašanja o prvi menstruaciji — AWA',
  },
  ne: {
    badge: 'पहिलो महिनावारी',
    title: 'आफ्नो पहिलो महिनावारीबारे\nबारम्बार सोधिने प्रश्नहरू',
    metaDuration: '4 मिनेट पढाइ',
    metaType: 'बारम्बार सोधिने प्रश्न',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'आफ्नो पहिलो महिनावारीबारे सबैभन्दा सामान्य प्रश्नहरूका सरल उत्तरहरू।',
    contentsTitle: 'यो लेखमा',
    faq: [
      {
        question: '“धेरै थोरै रगत जानु सामान्य हो?”',
        answer:
          'हो। एकदम सुरुका चक्रहरूमा प्रायः हल्का बहाव हुन्छ। विशेष गरी सुरुमा बहाव एक चक्रदेखि अर्कोमा फरक हुन सक्छ।',
      },
      {
        question: '“धेरै रगत जानु सामान्य हो?”',
        answer:
          'बढी बहाव पनि हुन सक्छ, विशेष गरी पहिलो दुई दिनमा। लगातार धेरै घण्टासम्म एक घण्टामा एकपटकभन्दा बढी सुरक्षा बदल्नुपर्‍यो भने, स्वास्थ्यकर्मीसँग कुरा गर्नु राम्रो हुन्छ।',
      },
      {
        question: '“ऐंठन हुनु सामान्य हो?”',
        answer:
          'तल्लो पेटमा हल्का ऐंठन सामान्य हो र प्रायः चिन्ता गर्नुपर्ने कुरा होइन। तातो पानीको बोतल वा अलिकति आरामले मद्दत गर्न सक्छ। निकै तीव्र दुखाइ कसैलाई बताउन लायक हुन्छ।',
      },
      {
        question: '“के म खेलकुद खेल्न सक्छु?”',
        answer:
          'सक्नुहुन्छ, महिनावारीमा पनि खेलकुद खेल्न सकिन्छ। केवल त्यो दिन आफ्नो शरीरलाई कस्तो लाग्छ त्यसअनुसार तीव्रता मिलाउनुहोस्।',
      },
      {
        question: '“के म पौडी खेल्न सक्छु?”',
        answer:
          'सक्नुहुन्छ, सही सुरक्षासहित पौडी खेल्न सकिन्छ। धेरैले यो विचारसँग बढी सहज नभएसम्म पर्खन छान्छन्।',
      },
    ],
    tipTitle: 'जान्न लायक',
    tipText: 'लाज लाग्ने प्रश्न भन्ने कुनै कुरा हुँदैन: हरेक शरीर फरक हुन्छ, र तपाईं जहिले पनि विश्वास गर्ने कसैसँग कुरा गर्न सक्नुहुन्छ।',
    relatedTitle: '♥  तपाईंलाई यी पनि मन पर्न सक्छन्',
    related: [
      {title: 'तपाईंको पहिलो महिनावारी: के अपेक्षा गर्ने', meta: '5 मिनेट  ·  मार्गदर्शन'},
      {title: 'पहिलो महिनावारीका लागि कुन सुरक्षा छान्ने?', meta: '6 मिनेट  ·  मार्गदर्शन'},
      {title: 'महिनावारीको दुखाइ सम्हाल्ने', meta: '7 मिनेट  ·  मार्गदर्शन'},
    ],
    shareMessage: 'आफ्नो पहिलो महिनावारीबारे बारम्बार सोधिने प्रश्नहरू — AWA',
  },
  si: {
    badge: 'පළමු ඔසප්',
    title: 'ඔබේ පළමු ඔසප් ගැන\nනිතර අසන ප්‍රශ්න',
    metaDuration: 'කියවීමට මිනිත්තු 4',
    metaType: 'නිති අසන ප්‍රශ්න',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඔබේ පළමු ඔසප් පිළිබඳ වඩාත්ම පොදු ප්‍රශ්නවලට සරල පිළිතුරු.',
    contentsTitle: 'මෙම ලිපියේ',
    faq: [
      {
        question: '“ඉතා සුළු ලේ ප්‍රමාණයක් තිබීම සාමාන්‍යද?”',
        answer:
          'ඔව්. ඉතා මුල් චක්‍රවල බොහෝ විට සැහැල්ලු ගලනයක් ඇත. ගලනය, විශේෂයෙන් ආරම්භයේදී, චක්‍රයෙන් චක්‍රයට වෙනස් විය හැක.',
      },
      {
        question: '“බොහෝ ලේ ප්‍රමාණයක් තිබීම සාමාන්‍යද?”',
        answer:
          'වැඩි ගලනයක්ද ඇතිවිය හැක, විශේෂයෙන් පළමු දින දෙක තුළ. ඔබට පැය කිහිපයක් පුරා පැයකට වරකට වඩා ඔබේ ආරක්ෂාව වෙනස් කිරීමට සිදුවන්නේ නම්, ඒ ගැන සෞඛ්‍ය වෘත්තිකයෙකු සමඟ කතා කිරීම හොඳ අදහසකි.',
      },
      {
        question: '“මාංශ පේශි සංකෝචන තිබීම සාමාන්‍යද?”',
        answer:
          'පහළ බඩේ සැහැල්ලු සංකෝචන පොදු වන අතර සාමාන්‍යයෙන් කනස්සල්ලට කරුණක් නොවේ. උණු වතුර බෝතලයක් හෝ ටිකක් විවේකය උපකාරී විය හැක. ඉතා දැඩි වේදනාවක් යමෙකුට සඳහන් කිරීම වටී.',
      },
      {
        question: '“මට ක්‍රීඩා කළ හැකිද?”',
        answer:
          'ඔව්, ඔබට ඔබේ ඔසප් කාලයේදී තවමත් ක්‍රීඩා කළ හැක. එදින ඔබේ ශරීරයට දැනෙන ආකාරයට තීව්‍රතාව පමණක් සකස් කරන්න.',
      },
      {
        question: '“මට පිහිනීමට යා හැකිද?”',
        answer:
          'ඔව්, නිසි ආරක්ෂාව සමඟ ඔබට තවමත් පිහිනීමට යා හැක. බොහෝ දෙනා අදහස ගැන වඩා සුවපහසුවක් දැනෙන තුරු රැඳී සිටීමට සරලව තෝරා ගනිති.',
      },
    ],
    tipTitle: 'දැනගත යුතු දේ',
    tipText: 'ලැජ්ජා සහගත ප්‍රශ්නයක් යැයි කිසිවක් නැත: සෑම ශරීරයක්ම වෙනස්, සහ ඔබට සැමවිටම ඔබ විශ්වාස කරන කෙනෙකු සමඟ කතා කළ හැක.',
    relatedTitle: '♥  ඔබට මෙයද වුවමනා විය හැක',
    related: [
      {title: 'ඔබේ පළමු ඔසප්: අපේක්ෂා කළ යුත්තේ කුමක්ද', meta: 'මිනි. 5  ·  මාර්ගෝපදේශය'},
      {title: 'මගේ පළමු ඔසප් සඳහා කුමන ආරක්ෂාව තෝරා ගත යුතුද?', meta: 'මිනි. 6  ·  මාර්ගෝපදේශය'},
      {title: 'ඔසප් වේදනාව කළමනාකරණය කිරීම', meta: 'මිනි. 7  ·  මාර්ගෝපදේශය'},
    ],
    shareMessage: 'ඔබේ පළමු ඔසප් ගැන නිතර අසන ප්‍රශ්න — AWA',
  },
  th: {
    badge: 'ประจำเดือนครั้งแรก',
    title: 'คำถามที่พบบ่อย\nเกี่ยวกับประจำเดือนครั้งแรก',
    metaDuration: 'อ่าน 4 นาที',
    metaType: 'คำถามที่พบบ่อย',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'คำตอบง่าย ๆ สำหรับคำถามที่พบบ่อยที่สุดเกี่ยวกับประจำเดือนครั้งแรกของคุณ',
    contentsTitle: 'ในบทความนี้',
    faq: [
      {
        question: '“เป็นเรื่องปกติไหมที่เลือดออกน้อยมาก?”',
        answer:
          'ใช่ รอบเดือนแรก ๆ มักมีปริมาณน้อย ปริมาณอาจเปลี่ยนไปจากรอบหนึ่งไปอีกรอบหนึ่ง โดยเฉพาะในช่วงต้น',
      },
      {
        question: '“เป็นเรื่องปกติไหมที่เลือดออกมาก?”',
        answer:
          'ปริมาณที่มากขึ้นก็เกิดขึ้นได้ โดยเฉพาะในสองวันแรก หากคุณต้องเปลี่ยนอุปกรณ์มากกว่าหนึ่งครั้งต่อชั่วโมงติดต่อกันหลายชั่วโมง ควรปรึกษาบุคลากรทางการแพทย์',
      },
      {
        question: '“เป็นเรื่องปกติไหมที่ปวดเกร็ง?”',
        answer:
          'อาการปวดเกร็งเบา ๆ ที่ท้องน้อยพบบ่อยและมักไม่น่ากังวล กระเป๋าน้ำร้อนหรือการพักผ่อนช่วยได้ หากปวดรุนแรงมากควรบอกใครสักคน',
      },
      {
        question: '“ฉันเล่นกีฬาได้ไหม?”',
        answer:
          'ได้ คุณยังเล่นกีฬาระหว่างมีประจำเดือนได้ เพียงปรับความหนักตามความรู้สึกของร่างกายในวันนั้น',
      },
      {
        question: '“ฉันว่ายน้ำได้ไหม?”',
        answer:
          'ได้ คุณยังว่ายน้ำได้ด้วยอุปกรณ์ที่เหมาะสม หลายคนเลือกรอจนรู้สึกสบายใจกับแนวคิดนี้มากขึ้น',
      },
    ],
    tipTitle: 'ควรรู้',
    tipText: 'ไม่มีคำถามที่น่าอายเลย: ร่างกายแต่ละคนต่างกัน และคุณพูดคุยกับคนที่คุณไว้ใจได้เสมอ',
    relatedTitle: '♥  คุณอาจสนใจ',
    related: [
      {title: 'ประจำเดือนครั้งแรกของคุณ: สิ่งที่คาดหวังได้', meta: '5 นาที  ·  คู่มือ'},
      {title: 'ฉันควรเลือกอุปกรณ์แบบไหนสำหรับประจำเดือนครั้งแรก?', meta: '6 นาที  ·  คู่มือ'},
      {title: 'การจัดการอาการปวดประจำเดือน', meta: '7 นาที  ·  คู่มือ'},
    ],
    shareMessage: 'คำถามที่พบบ่อยเกี่ยวกับประจำเดือนครั้งแรก — AWA',
  },
  vi: {
    badge: 'KỲ KINH ĐẦU TIÊN',
    title: 'Câu hỏi thường gặp\nvề kỳ kinh đầu tiên',
    metaDuration: '4 phút đọc',
    metaType: 'Câu hỏi thường gặp',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Những câu trả lời đơn giản cho các câu hỏi phổ biến nhất về kỳ kinh đầu tiên của bạn.',
    contentsTitle: 'Trong bài viết này',
    faq: [
      {
        question: '“Ra rất ít máu có bình thường không?”',
        answer:
          'Có. Những chu kỳ đầu tiên thường có lượng kinh ít. Lượng máu có thể thay đổi từ chu kỳ này sang chu kỳ khác, đặc biệt lúc ban đầu.',
      },
      {
        question: '“Ra nhiều máu có bình thường không?”',
        answer:
          'Lượng kinh nhiều hơn cũng có thể xảy ra, đặc biệt trong hai ngày đầu. Nếu bạn cần thay sản phẩm vệ sinh nhiều hơn một lần mỗi giờ trong nhiều giờ liên tiếp, nên nói chuyện với nhân viên y tế về điều đó.',
      },
      {
        question: '“Bị đau bụng kinh có bình thường không?”',
        answer:
          'Những cơn đau nhẹ ở bụng dưới là phổ biến và thường không có gì đáng lo. Một túi nước ấm hoặc nghỉ ngơi một chút có thể giúp ích. Nếu đau rất dữ dội, hãy nói với ai đó.',
      },
      {
        question: '“Tôi có thể chơi thể thao không?”',
        answer:
          'Có, bạn vẫn có thể chơi thể thao trong kỳ kinh. Chỉ cần điều chỉnh cường độ theo cảm giác của cơ thể bạn vào ngày hôm đó.',
      },
      {
        question: '“Tôi có thể đi bơi không?”',
        answer:
          'Có, bạn vẫn có thể đi bơi với sản phẩm vệ sinh phù hợp. Nhiều người chỉ đơn giản chọn chờ đến khi cảm thấy thoải mái hơn với ý tưởng đó.',
      },
    ],
    tipTitle: 'Nên biết',
    tipText: 'Không có câu hỏi nào là đáng ngại: mỗi cơ thể đều khác nhau và bạn luôn có thể nói chuyện với người bạn tin tưởng.',
    relatedTitle: '♥  Có thể bạn cũng thích',
    related: [
      {title: 'Kỳ kinh đầu tiên của bạn: điều cần biết', meta: '5 phút  ·  Hướng dẫn'},
      {title: 'Nên chọn sản phẩm vệ sinh nào cho kỳ kinh đầu tiên?', meta: '6 phút  ·  Hướng dẫn'},
      {title: 'Xử lý cơn đau trong kỳ kinh', meta: '7 phút  ·  Hướng dẫn'},
    ],
    shareMessage: 'Câu hỏi thường gặp về kỳ kinh đầu tiên — AWA',
  },
  uz: {
    badge: 'BIRINCHI HAYZ',
    title: 'Birinchi hayz haqida\nkoʻp beriladigan savollar',
    metaDuration: '4 daq oʻqish',
    metaType: 'Savol-javob',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Birinchi hayz haqidagi eng keng tarqalgan savollarga oddiy javoblar.',
    contentsTitle: 'Ushbu maqolada',
    faq: [
      {
        question: '“Qon juda kam boʻlishi normalmi?”',
        answer:
          'Ha. Eng birinchi sikllarda oqim koʻpincha yengil boʻladi. Oqim, ayniqsa boshida, sikldan sikliga oʻzgarishi mumkin.',
      },
      {
        question: '“Qon koʻp boʻlishi normalmi?”',
        answer:
          'Koʻproq oqim ham boʻlishi mumkin, ayniqsa dastlabki ikki kunda. Agar bir necha soat ketma-ket himoya vositasini soatiga bir martadan koʻp almashtirishingiz kerak boʻlsa, bu haqda shifokor bilan gaplashgan yaxshi.',
      },
      {
        question: '“Qisqarishlar (ogʻriq) boʻlishi normalmi?”',
        answer:
          'Qorin pastki qismidagi yengil qisqarishlar keng tarqalgan va odatda xavotirga sabab emas. Issiq suvli grelka yoki biroz dam yordam berishi mumkin. Juda kuchli ogʻriq haqida kimgadir aytib qoʻyishga arziydi.',
      },
      {
        question: '“Sport bilan shugʻullansam boʻladimi?”',
        answer:
          'Ha, hayz paytida ham sport bilan shugʻullanishingiz mumkin. Faqat shiddatni shu kuni tanangiz qanday his qilishiga moslang.',
      },
      {
        question: '“Suzsam boʻladimi?”',
        answer:
          'Ha, mos himoya vositasi bilan suzishingiz mumkin. Koʻpchilik shunchaki bu fikrga koʻnikkunicha kutishni afzal koʻradi.',
      },
    ],
    tipTitle: 'Bilish foydali',
    tipText: 'Xijolatli savol degan narsa yoʻq: har bir tana boshqacha va ishongan kishingiz bilan har doim gaplashishingiz mumkin.',
    relatedTitle: '♥  Sizga yoqishi mumkin',
    related: [
      {title: 'Birinchi hayzingiz: nimalarni kutish kerak', meta: '5 daq  ·  Qoʻllanma'},
      {title: 'Birinchi hayzim uchun qaysi vositani tanlashim kerak?', meta: '6 daq  ·  Qoʻllanma'},
      {title: 'Hayz ogʻriqlarini boshqarish', meta: '7 daq  ·  Qoʻllanma'},
    ],
    shareMessage: 'Birinchi hayz haqida koʻp beriladigan savollar — AWA',
  },
  az: {
    badge: 'İLK AYBAŞI',
    title: 'İlk aybaşı barədə tez-tez\nverilən suallar',
    metaDuration: '4 dəq oxu',
    metaType: 'FAQ',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'İlk aybaşı ilə bağlı ən çox verilən suallara sadə cavablar.',
    contentsTitle: 'Bu məqalədə',
    faq: [
      {
        question: '“Qanın çox az olması normaldır?”',
        answer:
          'Bəli. Ən ilk dövrlərdə axın çox vaxt zəif olur. Axın, xüsusilə əvvəlində, bir dövrdən digərinə dəyişə bilər.',
      },
      {
        question: '“Qanın çox olması normaldır?”',
        answer:
          'Daha bol axın da ola bilər, xüsusilə ilk iki gündə. Bir neçə saat ardıcıl olaraq qoruyucu vasitəni saatda bir dəfədən çox dəyişmək lazım gəlirsə, bu barədə tibb işçisi ilə danışmaq yaxşı olar.',
      },
      {
        question: '“Qarında sancı olması normaldır?”',
        answer:
          'Qarının aşağı hissəsində yüngül sancılar geniş yayılıb və adətən narahatlıq doğurmur. İsti su qabı və ya bir az istirahət kömək edə bilər. Çox şiddətli ağrını kiməsə demək lazımdır.',
      },
      {
        question: '“İdmanla məşğul ola bilərəm?”',
        answer:
          'Bəli, aybaşı zamanı da idmanla məşğul ola bilərsiniz. Sadəcə intensivliyi həmin gün bədəninizin hiss etdiyinə uyğun tənzimləyin.',
      },
      {
        question: '“Üzə bilərəm?”',
        answer:
          'Bəli, uyğun qoruyucu vasitə ilə üzə bilərsiniz. Bir çox insan sadəcə bu fikirlə özünü rahat hiss edənə qədər gözləməyi seçir.',
      },
    ],
    tipTitle: 'Bilmək faydalıdır',
    tipText: 'Utandırıcı sual yoxdur: hər bədən fərqlidir və etibar etdiyiniz biri ilə həmişə danışa bilərsiniz.',
    relatedTitle: '♥  Bunlar da xoşunuza gələ bilər',
    related: [
      {title: 'İlk aybaşınız: nələri gözləmək olar', meta: '5 dəq  ·  Bələdçi'},
      {title: 'İlk aybaşım üçün hansı qoruyucu vasitəni seçməliyəm?', meta: '6 dəq  ·  Bələdçi'},
      {title: 'Aybaşı ağrılarını idarə etmək', meta: '7 dəq  ·  Bələdçi'},
    ],
    shareMessage: 'İlk aybaşı barədə tez-tez verilən suallar — AWA',
  },
  ka: {
    badge: 'პირველი მენსტრუაცია',
    title: 'ხშირად დასმული კითხვები\nთქვენი პირველი მენსტრუაციის შესახებ',
    metaDuration: '4 წთ საკითხავი',
    metaType: 'ხშირი კითხვები',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'მარტივი პასუხები ყველაზე გავრცელებულ კითხვებზე თქვენი პირველი მენსტრუაციის შესახებ.',
    contentsTitle: 'ამ სტატიაში',
    faq: [
      {
        question: '„ნორმალურია, რომ ძალიან ცოტა სისხლი მაქვს?“',
        answer:
          'დიახ. ძალიან პირველ ციკლებს ხშირად მსუბუქი ნაკადი აქვს. ნაკადი ერთი ციკლიდან მეორეზე შეიძლება განსხვავდებოდეს, განსაკუთრებით დასაწყისში.',
      },
      {
        question: '„ნორმალურია, რომ ბევრი სისხლი მაქვს?“',
        answer:
          'უფრო უხვი ნაკადიც შეიძლება იყოს, განსაკუთრებით პირველ ორ დღეს. თუ დამცავი საშუალების გამოცვლა გჭირდებათ საათში ერთზე მეტჯერ რამდენიმე საათის განმავლობაში ზედიზედ, კარგი იქნება ამის შესახებ ჯანდაცვის სპეციალისტს ესაუბროთ.',
      },
      {
        question: '„ნორმალურია, რომ სპაზმები მაქვს?“',
        answer:
          'ქვედა მუცელში მსუბუქი სპაზმები ხშირია და ჩვეულებრივ შესაშფოთებელი არ არის. ცხელი წყლის ბოთლმა ან ცოტა დასვენებამ შეიძლება უშველოს. ძალიან ძლიერი ტკივილი ვინმესთვის ნახსენებად ღირს.',
      },
      {
        question: '„შემიძლია სპორტით დაკავება?“',
        answer:
          'დიახ, მენსტრუაციის დროსაც შეგიძლიათ სპორტით დაკავება. უბრალოდ ინტენსივობა მოარგეთ იმას, თუ როგორ გრძნობს თავს თქვენი სხეული იმ დღეს.',
      },
      {
        question: '„შემიძლია ცურვა?“',
        answer:
          'დიახ, სწორი დამცავი საშუალებით კვლავ შეგიძლიათ ცურვა. ბევრი უბრალოდ ირჩევს დაელოდოს, სანამ ამ იდეასთან უფრო კომფორტულად იგრძნობს თავს.',
      },
    ],
    tipTitle: 'კარგია ვიცოდეთ',
    tipText: '„უხერხული“ კითხვა არ არსებობს: ყველა სხეული განსხვავებულია და ყოველთვის შეგიძლიათ ესაუბროთ ადამიანს, რომელსაც ენდობით.',
    relatedTitle: '♥  შეიძლება მოგეწონოთ',
    related: [
      {title: 'თქვენი პირველი მენსტრუაცია: რას უნდა ელოდეთ', meta: '5 წთ  ·  გზამკვლევი'},
      {title: 'რომელი დამცავი საშუალება ავირჩიო პირველი მენსტრუაციისთვის?', meta: '6 წთ  ·  გზამკვლევი'},
      {title: 'მენსტრუაციული ტკივილის მართვა', meta: '7 წთ  ·  გზამკვლევი'},
    ],
    shareMessage: 'ხშირად დასმული კითხვები თქვენი პირველი მენსტრუაციის შესახებ — AWA',
  },
  hy: {
    badge: 'ԱՌԱՋԻՆ ԴԱՇՏԱՆ',
    title: 'Հաճախակի տրվող հարցեր\nձեր առաջին դաշտանի մասին',
    metaDuration: '4 ր կարդալու համար',
    metaType: 'ՀՏՀ',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Պարզ պատասխաններ ձեր առաջին դաշտանի մասին ամենատարածված հարցերին:',
    contentsTitle: 'Այս հոդվածում',
    faq: [
      {
        question: '«Նորմա՞լ է, որ արյունը շատ քիչ է»:',
        answer:
          'Այո: Առաջին ցիկլերը հաճախ ունենում են թեթև արտահոսք: Արտահոսքը կարող է տարբերվել մի ցիկլից մյուսը, հատկապես սկզբում:',
      },
      {
        question: '«Նորմա՞լ է, որ արյունը շատ է»:',
        answer:
          'Ավելի առատ արտահոսք նույնպես կարող է պատահել, հատկապես առաջին երկու օրերին: Եթե մի քանի ժամ անընդմեջ պաշտպանության միջոցը պետք է փոխեք ժամում մեկից ավելի անգամ, լավ է այդ մասին խոսել առողջապահության մասնագետի հետ:',
      },
      {
        question: '«Նորմա՞լ է ջղաձգումներ ունենալը»:',
        answer:
          'Որովայնի ստորին հատվածում թեթև ջղաձգումները տարածված են և սովորաբար անհանգստանալու պատճառ չեն: Տաք ջրով տաքացուցիչը կամ մի փոքր հանգիստը կարող են օգնել: Շատ ուժեղ ցավի մասին արժե որևէ մեկին ասել:',
      },
      {
        question: '«Կարո՞ղ եմ սպորտով զբաղվել»:',
        answer:
          'Այո, դաշտանի ընթացքում կարող եք շարունակել սպորտով զբաղվել: Պարզապես հարմարեցրեք ինտենսիվությունը ձեր մարմնի այդ օրվա զգացողությանը:',
      },
      {
        question: '«Կարո՞ղ եմ լողալ»:',
        answer:
          'Այո, ճիշտ պաշտպանությամբ կարող եք շարունակել լողալ: Շատերը պարզապես նախընտրում են սպասել, մինչև ավելի հարմար զգան այդ գաղափարի հետ:',
      },
    ],
    tipTitle: 'Լավ է իմանալ',
    tipText: 'Ամաչելի հարց գոյություն չունի. յուրաքանչյուր մարմին տարբեր է, և դուք միշտ կարող եք խոսել ձեր վստահած մարդու հետ:',
    relatedTitle: '♥  Ձեզ կարող է նաև հետաքրքրել',
    related: [
      {title: 'Ձեր առաջին դաշտանը. ինչ սպասել', meta: '5 ր  ·  Ուղեցույց'},
      {title: 'Ի՞նչ պաշտպանություն ընտրել առաջին դաշտանիս համար', meta: '6 ր  ·  Ուղեցույց'},
      {title: 'Դաշտանային ցավի կառավարում', meta: '7 ր  ·  Ուղեցույց'},
    ],
    shareMessage: 'Հաճախակի տրվող հարցեր ձեր առաջին դաշտանի մասին — AWA',
  },
  tg: {
    badge: 'ҲАЙЗИ АВВАЛ',
    title: 'Саволҳои зуд-зуд додашаванда\nдар бораи ҳайзи аввали шумо',
    metaDuration: '4 дақ барои хондан',
    metaType: 'Саволу ҷавоб',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Посухҳои оддӣ ба маъмултарин саволҳо дар бораи ҳайзи аввали шумо.',
    contentsTitle: 'Дар ин мақола',
    faq: [
      {
        question: '«Оё муқаррарӣ аст, ки хун хеле кам бошад?»',
        answer:
          'Бале. Давраҳои хеле аввал аксар вақт ҷараёни сабук доранд. Ҷараён аз як давра то давраи дигар, хусусан дар оғоз, фарқ карда метавонад.',
      },
      {
        question: '«Оё муқаррарӣ аст, ки хун зиёд бошад?»',
        answer:
          'Ҷараёни зиёдтар низ метавонад рух диҳад, хусусан дар ду рӯзи аввал. Агар зиёда аз як маротиба дар як соат дар давоми чанд соати пайиҳам воситаи муҳофизатро иваз кардан лозим шавад, хуб аст дар ин бора бо мутахассиси соҳаи тиб гап занед.',
      },
      {
        question: '«Оё муқаррарӣ аст, ки кашишхӯрӣ бошад?»',
        answer:
          'Кашишхӯрии сабук дар поёни шикам маъмул аст ва одатан сабаби нигаронӣ нест. Грелка ё андаке истироҳат метавонад кумак кунад. Дарди хеле шадидро сазовор аст ба касе гӯед.',
      },
      {
        question: '«Оё ман метавонам ба варзиш машғул шавам?»',
        answer:
          'Бале, шумо метавонед дар вақти ҳайз ҳам ба варзиш машғул шавед. Танҳо шиддатро ба ҳолати бадани худ дар ҳамон рӯз мутобиқ кунед.',
      },
      {
        question: '«Оё ман метавонам шино кунам?»',
        answer:
          'Бале, шумо метавонед бо воситаи муҳофизати мувофиқ шино кунед. Бисёриҳо танҳо интихоб мекунанд, ки интизор шаванд, то ин фикр барояшон роҳаттар шавад.',
      },
    ],
    tipTitle: 'Донистан хуб аст',
    tipText: 'Саволи шармовар вуҷуд надорад: ҳар бадан гуногун аст ва шумо ҳамеша метавонед бо касе, ки ба ӯ боварӣ доред, гап занед.',
    relatedTitle: '♥  Шояд ба шумо ҳам маъқул шавад',
    related: [
      {title: 'Ҳайзи аввали шумо: чӣ интизор шудан лозим аст', meta: '5 дақ  ·  Роҳнамо'},
      {title: 'Барои ҳайзи аввалам кадом воситаи муҳофизатро интихоб кунам?', meta: '6 дақ  ·  Роҳнамо'},
      {title: 'Идораи дарди ҳайз', meta: '7 дақ  ·  Роҳнамо'},
    ],
    shareMessage: 'Саволҳои зуд-зуд додашаванда дар бораи ҳайзи аввали шумо — AWA',
  },
  ky: {
    badge: 'БИРИНЧИ ЕТЕК КИРИМ',
    title: 'Биринчи етек кирим боюнча\nкөп берилүүчү суроолор',
    metaDuration: '4 мүн окуу',
    metaType: 'КБС',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Биринчи етек кирим боюнча эң көп берилүүчү суроолорго жөнөкөй жооптор.',
    contentsTitle: 'Бул макалада',
    faq: [
      {
        question: '«Кан өтө аз болушу кадимкиби?»',
        answer:
          'Ооба. Эң алгачкы циклдерде агым көбүнчө аз болот. Агым, айрыкча башында, циклден циклге өзгөрүшү мүмкүн.',
      },
      {
        question: '«Кан көп болушу кадимкиби?»',
        answer:
          'Көбүрөөк агым да болушу мүмкүн, айрыкча алгачкы эки күндө. Эгер коргонуу каражатыңызды бир нече саат катары менен саатына бир жолудан көп алмаштыруу керек болсо, бул жөнүндө ден соолук сактоо адиси менен сүйлөшкөн жакшы.',
      },
      {
        question: '«Спазмдар болушу кадимкиби?»',
        answer:
          'Курсактын ылдый жагындагы жеңил спазмдар кеңири таралган жана көбүнчө тынчсыздандырбайт. Ысык суу грелкасы же бир аз эс алуу жардам бере алат. Өтө күчтүү оору жөнүндө бирөөгө айтканга татыйт.',
      },
      {
        question: '«Спорт менен машыксам болобу?»',
        answer:
          'Ооба, етек кирим учурунда да спорт менен машыга бересиз. Интенсивдүүлүгүн ошол күнү денеңиздин абалына жараша тууралаңыз.',
      },
      {
        question: '«Сууда сүзсөм болобу?»',
        answer:
          'Ооба, туура коргонуу менен сууда сүзө бересиз. Көпчүлүк адамдар бул идеяга көбүрөөк көнгөнчө күтүүнү тандайт.',
      },
    ],
    tipTitle: 'Билүү пайдалуу',
    tipText: 'Уялтуучу суроо деген жок: ар бир дене ар башка жана ишенген адамыңыз менен ар дайым сүйлөшө аласыз.',
    relatedTitle: '♥  Сизге дагы жагышы мүмкүн',
    related: [
      {title: 'Биринчи етек кирим: эмне күтүү керек', meta: '5 мүн  ·  Колдонмо'},
      {title: 'Биринчи етек кирим үчүн кайсы коргонууну тандоо керек?', meta: '6 мүн  ·  Колдонмо'},
      {title: 'Етек кирим оорусун башкаруу', meta: '7 мүн  ·  Колдонмо'},
    ],
    shareMessage: 'Биринчи етек кирим боюнча көп берилүүчү суроолор — AWA',
  },
  tk: {
    badge: 'ILKINJI AÝBAŞY',
    title: 'Ilkinji aýbaşyňyz barada\nköp berilýän soraglar',
    metaDuration: '4 min okamak',
    metaType: 'KBS',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Ilkinji aýbaşyňyz barada iň köp berilýän soraglara ýönekeý jogaplar.',
    contentsTitle: 'Bu makalada',
    faq: [
      {
        question: '«Gan gaty az bolmagy adatymy?»',
        answer:
          'Hawa. Iň ilkinji siklerde köplenç gan akma ýeňil bolýar. Gan akma sikldan sika, aýratyn-da başda, üýtgäp biler.',
      },
      {
        question: '«Gan köp bolmagy adatymy?»',
        answer:
          'Has köp gan akma hem bolup biler, aýratyn-da ilkinji iki günde. Birnäçe sagat yzly-yzyna goranyş serişdesini sagatda birden köp çalyşmaly bolsaňyz, bu barada saglyk hünärmeni bilen gürleşmek maslahat berilýär.',
      },
      {
        question: '«Çekişme bolmagy adatymy?»',
        answer:
          'Garnyň aşagyndaky ýeňil çekişmeler umumy zat we adatça alada üçin sebäp däl. Ysyk suw gaby ýa-da az-kem dynç almak kömek edip biler. Gaty güýçli agyry barada kimdir birine aýtmaga mynasyp.',
      },
      {
        question: '«Sport bilen meşgullanyp bilemmi?»',
        answer:
          'Hawa, aýbaşy wagtynda sport bilen meşgullanmagy dowam etdirip bilersiňiz. Diňe intensiwligi şol günki bedeniňiziň duýgusyna görä sazlaň.',
      },
      {
        question: '«Ýüzüp bilemmi?»',
        answer:
          'Hawa, dogry goranyş serişdesi bilen ýüzmäge bolýar. Köp adam diňe bu pikire has rahat bolýança garaşmagy saýlaýar.',
      },
    ],
    tipTitle: 'Bilmek peýdaly',
    tipText: 'Utandyryjy sorag ýok: her bedeniň özboluşlylygy bar we hemişe ynanýan adamyňyz bilen gürleşip bilersiňiz.',
    relatedTitle: '♥  Size ýarap biler',
    related: [
      {title: 'Ilkinji aýbaşyňyz: nämä garaşmaly', meta: '5 min  ·  Gollanma'},
      {title: 'Ilkinji aýbaşym üçin haýsy goranyş serişdesini saýlamaly?', meta: '6 min  ·  Gollanma'},
      {title: 'Aýbaşy agyrysyny dolandyrmak', meta: '7 min  ·  Gollanma'},
    ],
    shareMessage: 'Ilkinji aýbaşyňyz barada köp berilýän soraglar — AWA',
  },
} as const);

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
