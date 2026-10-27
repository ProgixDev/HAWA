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

const ID = 'babydevelopment-developpement-bebe';

const HERO = require('../../assets/images/library/cycle-phases-diagram.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const MILESTONE_ICONS = [
  'heart-pulse',
  'baby-face-outline',
  'ear-hearing',
  'eye-outline',
] as const;

// PHASE 7L.2 — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('BabyDevelopment', {
  fr: {
    badge: 'GROSSESSE • DÉVELOPPEMENT',
    title: 'Le développement\ndu bébé in utero',
    metaDuration: '6 min de lecture',
    metaType: 'Article',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Comment ton bébé grandit, trimestre après trimestre.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Le premier trimestre : les débuts',
      'Le deuxième trimestre : les sens s’éveillent',
      'Le troisième trimestre : la dernière ligne droite',
      'Les grandes étapes en un coup d’œil',
      'Idées reçues',
      'À retenir',
    ],
    body1: 'Dès la 6e semaine, un cœur minuscule commence déjà à battre. Au cours de ce premier trimestre, les organes principaux se mettent progressivement en place.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Le rythme cardiaque du bébé est l’un des premiers signes visibles à l’échographie, souvent un moment marquant du suivi.',
    body2: 'Vers la 20e semaine, tu peux généralement ressentir les premiers mouvements du bébé. C’est aussi la période où ses sens commencent à se développer.',
    body3: 'À partir du 3e trimestre, le bébé prend rapidement du poids et se positionne progressivement pour la naissance.',
    neutralText: 'Le rythme de développement varie d’un bébé à l’autre : ces repères restent des moyennes générales.',
    milestones: [
      'Dès 6 semaines : le cœur commence à battre',
      'Vers 20 semaines : premiers mouvements ressentis',
      'Vers 24-26 semaines : l’audition se développe',
      'Vers 28 semaines : les yeux s’ouvrent progressivement',
    ],
    myths: [
      'Le bébé « entend tout » dès le début : l’audition ne se développe réellement qu’à partir du 2e trimestre',
      'La forme du ventre indique le sexe du bébé : aucune preuve scientifique ne le confirme',
      'Un bébé actif est forcément en meilleure santé : le niveau d’activité varie beaucoup d’un bébé à l’autre',
    ],
    tip2Title: 'Bon à savoir',
    tip2Text: 'Chaque étape du développement du bébé suit un rythme propre ; le suivi médical régulier permet de vérifier que tout évolue normalement.',
    shareMessage: 'Le développement du bébé in utero — AWA',
  },
  en: {
    badge: 'PREGNANCY • DEVELOPMENT',
    title: 'Your baby’s development\nin utero',
    metaDuration: '6 min read',
    metaType: 'Article',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'How your baby grows, trimester by trimester.',
    contentsTitle: 'In this article',
    topics: [
      'The first trimester: the early days',
      'The second trimester: the senses awaken',
      'The third trimester: the home stretch',
      'Key milestones at a glance',
      'Common myths',
      'What to remember',
    ],
    body1: 'From as early as week 6, a tiny heart already begins to beat. Over the course of this first trimester, the main organs gradually form.',
    tip1Title: 'Good to know',
    tip1Text: 'The baby’s heartbeat is one of the first visible signs on ultrasound, often a memorable moment in your care.',
    body2: 'Around week 20, you can usually feel the baby’s first movements. This is also when the senses start to develop.',
    body3: 'From the 3rd trimester onward, the baby gains weight quickly and gradually moves into position for birth.',
    neutralText: 'The pace of development varies from baby to baby: these milestones remain general averages.',
    milestones: [
      'From 6 weeks: the heart begins to beat',
      'Around 20 weeks: first movements felt',
      'Around 24-26 weeks: hearing develops',
      'Around 28 weeks: the eyes gradually open',
    ],
    myths: [
      'The baby “hears everything” from the start: hearing doesn’t really develop until the 2nd trimester',
      'The shape of the belly indicates the baby’s sex: no scientific evidence supports this',
      'An active baby is necessarily healthier: activity levels vary widely from one baby to another',
    ],
    tip2Title: 'Good to know',
    tip2Text: 'Each stage of the baby’s development follows its own pace; regular medical check-ups help confirm that everything is progressing normally.',
    shareMessage: 'Baby’s development in utero — AWA',
  },
  es: {
    badge: 'EMBARAZO • DESARROLLO',
    title: 'El desarrollo\ndel bebé en el útero',
    metaDuration: '6 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Cómo crece tu bebé, trimestre tras trimestre.',
    contentsTitle: 'En este artículo',
    topics: [
      'El primer trimestre: los inicios',
      'El segundo trimestre: los sentidos despiertan',
      'El tercer trimestre: la recta final',
      'Los grandes hitos de un vistazo',
      'Ideas falsas',
      'Para recordar',
    ],
    body1: 'Ya desde la semana 6, un corazón diminuto empieza a latir. A lo largo de este primer trimestre, los órganos principales se van formando progresivamente.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'El ritmo cardíaco del bebé es una de las primeras señales visibles en la ecografía, a menudo un momento destacado del seguimiento.',
    body2: 'Hacia la semana 20, generalmente puedes sentir los primeros movimientos del bebé. También es el periodo en el que sus sentidos empiezan a desarrollarse.',
    body3: 'A partir del 3.er trimestre, el bebé gana peso rápidamente y se va colocando progresivamente para el nacimiento.',
    neutralText: 'El ritmo de desarrollo varía de un bebé a otro: estas referencias siguen siendo promedios generales.',
    milestones: [
      'Desde las 6 semanas: el corazón empieza a latir',
      'Hacia las 20 semanas: primeros movimientos percibidos',
      'Hacia las 24-26 semanas: se desarrolla la audición',
      'Hacia las 28 semanas: los ojos se abren progresivamente',
    ],
    myths: [
      'El bebé «lo oye todo» desde el principio: la audición solo se desarrolla realmente a partir del 2.º trimestre',
      'La forma de la barriga indica el sexo del bebé: ninguna prueba científica lo confirma',
      'Un bebé activo es necesariamente más sano: el nivel de actividad varía mucho de un bebé a otro',
    ],
    tip2Title: 'DATO ÚTIL',
    tip2Text: 'Cada etapa del desarrollo del bebé sigue su propio ritmo; el seguimiento médico regular permite comprobar que todo evoluciona con normalidad.',
    shareMessage: 'El desarrollo del bebé en el útero — AWA',
  },
  it: {
    badge: 'GRAVIDANZA • SVILUPPO',
    title: 'Lo sviluppo del tuo bambino\nnell’utero',
    metaDuration: '6 min di lettura',
    metaType: 'Articolo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Come cresce il tuo bambino, trimestre dopo trimestre.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Il primo trimestre: i primi giorni',
      'Il secondo trimestre: i sensi si risvegliano',
      'Il terzo trimestre: il rettilineo finale',
      'Le tappe principali in sintesi',
      'Falsi miti comuni',
      'Cosa ricordare',
    ],
    body1: 'Già dalla settimana 6, un minuscolo cuore comincia a battere. Nel corso di questo primo trimestre, gli organi principali si formano gradualmente.',
    tip1Title: 'Da sapere',
    tip1Text: 'Il battito cardiaco del bambino è uno dei primi segni visibili all’ecografia, spesso un momento memorabile del tuo percorso di cura.',
    body2: 'Intorno alla settimana 20, di solito puoi sentire i primi movimenti del bambino. È anche il momento in cui i sensi iniziano a svilupparsi.',
    body3: 'A partire dal terzo trimestre, il bambino aumenta rapidamente di peso e si posiziona gradualmente per la nascita.',
    neutralText: 'Il ritmo di sviluppo varia da un bambino all’altro: queste tappe restano medie generali.',
    milestones: [
      'Da 6 settimane: il cuore comincia a battere',
      'Intorno alle 20 settimane: si sentono i primi movimenti',
      'Intorno alle 24-26 settimane: si sviluppa l’udito',
      'Intorno alle 28 settimane: gli occhi si aprono gradualmente',
    ],
    myths: [
      'Il bambino «sente tutto» fin dall’inizio: l’udito non si sviluppa davvero prima del secondo trimestre',
      'La forma della pancia indica il sesso del bambino: nessuna prova scientifica lo conferma',
      'Un bambino attivo è necessariamente più sano: il livello di attività varia molto da un bambino all’altro',
    ],
    tip2Title: 'Da sapere',
    tip2Text: 'Ogni fase dello sviluppo del bambino segue il proprio ritmo; i controlli medici regolari aiutano a confermare che tutto procede normalmente.',
    shareMessage: 'Lo sviluppo del bambino nell’utero — AWA',
  },
  tr: {
    badge: 'GEBELİK • GELİŞİM',
    title: 'Bebeğinin rahim içindeki\ngelişimi',
    metaDuration: '6 dk okuma',
    metaType: 'Makale',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Bebeğinin üç aylık dönemler boyunca nasıl büyüdüğünü öğren.',
    contentsTitle: 'Bu makalede',
    topics: [
      'İlk trimester: ilk günler',
      'İkinci trimester: duyuların uyanışı',
      'Üçüncü trimester: son düzlük',
      'Önemli gelişim adımları bir bakışta',
      'Sık görülen yanlış inanışlar',
      'Akılda tutulacaklar',
    ],
    body1: 'Daha 6. haftadan itibaren minik bir kalp atmaya başlar. Bu ilk trimester boyunca ana organlar yavaş yavaş oluşur.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Bebeğin kalp atışı, ultrasonda görülen ilk belirgin işaretlerden biridir ve takibin sırasında çoğu zaman unutulmaz bir andır.',
    body2: '20. hafta civarında bebeğin ilk hareketlerini genellikle hissedebilirsin. Duyular da bu dönemde gelişmeye başlar.',
    body3: '3. trimesterden itibaren bebek hızla kilo alır ve yavaş yavaş doğum için pozisyonunu alır.',
    neutralText: 'Gelişim hızı bebekten bebeğe değişir: bu adımlar genel ortalamalar olarak kalır.',
    milestones: [
      '6. haftadan itibaren: kalp atmaya başlar',
      '20. hafta civarı: ilk hareketler hissedilir',
      '24-26. hafta civarı: işitme gelişir',
      '28. hafta civarı: gözler yavaş yavaş açılır',
    ],
    myths: [
      'Bebek en başından beri “her şeyi duyar”: işitme, 2. trimesterden önce gerçek anlamda gelişmez',
      'Karnın şekli bebeğin cinsiyetini gösterir: bunu destekleyen bilimsel bir kanıt yoktur',
      'Hareketli bir bebek mutlaka daha sağlıklıdır: hareketlilik düzeyi bebekten bebeğe çok değişir',
    ],
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Bebeğin gelişiminin her aşaması kendi hızında ilerler; düzenli sağlık kontrolleri her şeyin normal seyrettiğini doğrulamana yardımcı olur.',
    shareMessage: 'Bebeğin rahim içindeki gelişimi — AWA',
  },
  ru: {
    badge: 'БЕРЕМЕННОСТЬ • РАЗВИТИЕ',
    title: 'Развитие вашего ребёнка\nво время беременности',
    metaDuration: '6 мин чтения',
    metaType: 'Статья',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Как растёт ваш малыш — триместр за триместром.',
    contentsTitle: 'В этой статье',
    topics: [
      'Первый триместр: самые первые дни',
      'Второй триместр: просыпаются органы чувств',
      'Третий триместр: финишная прямая',
      'Основные этапы вкратце',
      'Распространённые мифы',
      'Что запомнить',
    ],
    body1: 'Уже примерно с 6-й недели начинает биться крошечное сердце. В течение первого триместра постепенно формируются основные органы.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Сердцебиение малыша — один из первых признаков, которые видны на УЗИ, и часто это запоминающийся момент наблюдения за беременностью.',
    body2: 'Примерно к 20-й неделе обычно можно почувствовать первые шевеления малыша. Именно в это время начинают развиваться органы чувств.',
    body3: 'С третьего триместра малыш быстро набирает вес и постепенно занимает положение для родов.',
    neutralText: 'Темп развития у каждого малыша свой: эти этапы остаются лишь общими средними ориентирами.',
    milestones: [
      'С 6 недель: начинает биться сердце',
      'Около 20 недель: ощущаются первые шевеления',
      'Около 24–26 недель: развивается слух',
      'Около 28 недель: глаза постепенно открываются',
    ],
    myths: [
      'Малыш «слышит всё» с самого начала: на самом деле слух по-настоящему развивается лишь во втором триместре',
      'Форма живота указывает на пол малыша: научных подтверждений этому нет',
      'Активный малыш обязательно здоровее: уровень активности у разных малышей сильно различается',
    ],
    tip2Title: 'Полезно знать',
    tip2Text: 'Каждый этап развития малыша идёт в своём темпе; регулярные медицинские осмотры помогают убедиться, что всё протекает нормально.',
    shareMessage: 'Развитие малыша во время беременности — AWA',
  },
  de: {
    badge: 'SCHWANGERSCHAFT • ENTWICKLUNG',
    title: 'Die Entwicklung deines Babys\nim Mutterleib',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Artikel',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Wie dein Baby wächst, Trimester für Trimester.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Das erste Trimester: die ersten Tage',
      'Das zweite Trimester: die Sinne erwachen',
      'Das dritte Trimester: die Zielgerade',
      'Wichtige Meilensteine im Überblick',
      'Verbreitete Mythen',
      'Was du dir merken solltest',
    ],
    body1: 'Schon ab der 6. Woche beginnt ein winziges Herz zu schlagen. Im Laufe dieses ersten Trimesters bilden sich nach und nach die wichtigsten Organe.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Der Herzschlag des Babys gehört zu den ersten sichtbaren Zeichen im Ultraschall und ist oft ein unvergesslicher Moment bei deiner Betreuung.',
    body2: 'Etwa ab der 20. Woche kannst du die ersten Bewegungen des Babys meist spüren. Auch die Sinne beginnen sich in dieser Zeit zu entwickeln.',
    body3: 'Ab dem 3. Trimester nimmt das Baby schnell an Gewicht zu und bringt sich nach und nach in die Geburtsposition.',
    neutralText: 'Das Entwicklungstempo ist von Baby zu Baby verschieden: Diese Meilensteine sind nur allgemeine Durchschnittswerte.',
    milestones: [
      'Ab 6 Wochen: Das Herz beginnt zu schlagen',
      'Etwa ab 20 Wochen: erste Bewegungen spürbar',
      'Etwa ab 24–26 Wochen: das Gehör entwickelt sich',
      'Etwa ab 28 Wochen: die Augen öffnen sich allmählich',
    ],
    myths: [
      'Das Baby „hört von Anfang an alles“: Das Gehör entwickelt sich erst im 2. Trimester richtig',
      'Die Form des Bauchs verrät das Geschlecht des Babys: Dafür gibt es keinen wissenschaftlichen Beleg',
      'Ein aktives Baby ist zwangsläufig gesünder: Wie aktiv Babys sind, ist sehr unterschiedlich',
    ],
    tip2Title: 'Gut zu wissen',
    tip2Text: 'Jede Entwicklungsphase des Babys verläuft in ihrem eigenen Tempo; regelmäßige ärztliche Kontrollen helfen dabei, sicherzugehen, dass alles normal verläuft.',
    shareMessage: 'Die Entwicklung des Babys im Mutterleib — AWA',
  },
  zh: {
      badge: '怀孕 • 发育',
      title: '宝宝在子宫内的\n发育',
      metaDuration: '阅读约 6 分钟',
      metaType: '文章',
      metaLevel: '入门',
      metaValidated: '已审核内容',
      intro: '宝宝是如何一个孕期阶段一个孕期阶段成长的。',
      contentsTitle: '本文内容',
      topics: [
        '孕早期：最初的日子',
        '孕中期：感官苏醒',
        '孕晚期：最后冲刺',
        '关键里程碑一览',
        '常见误区',
        '需要记住的',
      ],
      body1: '最早从第 6 周起，一颗小小的心脏就已开始跳动。在孕早期的这段时间里，主要器官逐步形成。',
      tip1Title: '小贴士',
      tip1Text: '胎心是超声检查中最先能看到的迹象之一，常常是产检过程中令人难忘的一刻。',
      body2: '大约在第 20 周，你通常可以感觉到宝宝的第一次胎动。这个时期，感官也开始发育。',
      body3: '从孕晚期开始，宝宝体重快速增加，并逐渐转入准备分娩的位置。',
      neutralText: '每个宝宝的发育节奏各不相同：这些里程碑只是一般的平均情况。',
      milestones: [
        '从第 6 周起：心脏开始跳动',
        '约第 20 周：首次感觉到胎动',
        '约第 24 至 26 周：听力发育',
        '约第 28 周：眼睛逐渐睁开',
      ],
      myths: [
        '宝宝从一开始就“什么都能听见”：听力要到孕中期才真正发育',
        '肚子的形状可以说明宝宝的性别：没有任何科学依据支持这一说法',
        '胎动多的宝宝一定更健康：不同宝宝的活跃程度差别很大',
      ],
      tip2Title: '小贴士',
      tip2Text: '宝宝发育的每个阶段都有自己的节奏；定期的产检有助于确认一切都在正常进展。',
      shareMessage: '宝宝在子宫内的发育 — AWA',
    },
  id: {
    badge: 'KEHAMILAN • PERKEMBANGAN',
    title: 'Perkembangan bayimu\ndi dalam rahim',
    metaDuration: '6 menit baca',
    metaType: 'Artikel',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Bagaimana bayimu tumbuh, trimester demi trimester.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Trimester pertama: hari-hari awal',
      'Trimester kedua: indra mulai terbangun',
      'Trimester ketiga: menjelang akhir',
      'Tonggak penting sekilas',
      'Mitos yang umum',
      'Yang perlu diingat',
    ],
    body1: 'Sejak minggu ke-6, jantung kecil sudah mulai berdetak. Sepanjang trimester pertama ini, organ-organ utama terbentuk secara bertahap.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Detak jantung bayi adalah salah satu tanda pertama yang terlihat pada USG, sering kali menjadi momen yang berkesan dalam pemeriksaanmu.',
    body2: 'Sekitar minggu ke-20, kamu biasanya bisa merasakan gerakan pertama bayi. Pada masa ini, indra-indranya juga mulai berkembang.',
    body3: 'Mulai trimester ke-3, bayi bertambah berat badannya dengan cepat dan perlahan bergerak ke posisi untuk persalinan.',
    neutralText: 'Kecepatan perkembangan berbeda dari satu bayi ke bayi lain: tonggak-tonggak ini hanyalah rata-rata umum.',
    milestones: [
      'Mulai 6 minggu: jantung mulai berdetak',
      'Sekitar 20 minggu: gerakan pertama terasa',
      'Sekitar 24-26 minggu: pendengaran berkembang',
      'Sekitar 28 minggu: mata mulai terbuka secara bertahap',
    ],
    myths: [
      'Bayi “mendengar segalanya” sejak awal: pendengaran baru benar-benar berkembang pada trimester ke-2',
      'Bentuk perut menunjukkan jenis kelamin bayi: tidak ada bukti ilmiah yang mendukung hal ini',
      'Bayi yang aktif pasti lebih sehat: tingkat keaktifan sangat beragam dari satu bayi ke bayi lain',
    ],
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Setiap tahap perkembangan bayi mengikuti iramanya sendiri; pemeriksaan medis rutin membantu memastikan semuanya berjalan normal.',
    shareMessage: 'Perkembangan bayi di dalam rahim — AWA',
  },
  hi: {
    badge: 'गर्भावस्था • विकास',
    title: 'गर्भ में आपके\nशिशु का विकास',
    metaDuration: '6 मिनट में पढ़ें',
    metaType: 'लेख',
    metaLevel: 'शुरुआती',
    metaValidated: 'जाँची गई जानकारी',
    intro: 'आपका शिशु तिमाही-दर-तिमाही कैसे बढ़ता है।',
    contentsTitle: 'इस लेख में',
    topics: [
      'पहली तिमाही: शुरुआती दिन',
      'दूसरी तिमाही: इंद्रियाँ जागती हैं',
      'तीसरी तिमाही: आख़िरी पड़ाव',
      'मुख्य पड़ावों पर एक नज़र',
      'आम मिथक',
      'क्या याद रखें',
    ],
    body1: 'सप्ताह 6 से ही एक नन्हा-सा दिल धड़कना शुरू कर देता है। इस पहली तिमाही के दौरान मुख्य अंग धीरे-धीरे बनते हैं।',
    tip1Title: 'जानना अच्छा रहेगा',
    tip1Text: 'शिशु की धड़कन अल्ट्रासाउंड में दिखने वाले पहले संकेतों में से एक है, और आपकी देखभाल के दौरान अक्सर एक यादगार पल बन जाती है।',
    body2: 'लगभग सप्ताह 20 के आसपास आप आमतौर पर शिशु की पहली हलचल महसूस कर सकती हैं। इसी समय इंद्रियों का विकास भी शुरू होता है।',
    body3: 'तीसरी तिमाही से शिशु का वज़न तेज़ी से बढ़ता है और वह धीरे-धीरे जन्म के लिए सही स्थिति में आ जाता है।',
    neutralText: 'विकास की रफ़्तार हर शिशु में अलग होती है: ये पड़ाव केवल सामान्य औसत हैं।',
    milestones: [
      '6 सप्ताह से: दिल धड़कना शुरू करता है',
      'लगभग 20 सप्ताह: पहली हलचल महसूस होती है',
      'लगभग 24-26 सप्ताह: सुनने की क्षमता विकसित होती है',
      'लगभग 28 सप्ताह: आँखें धीरे-धीरे खुलती हैं',
    ],
    myths: [
      'शिशु शुरू से “सब कुछ सुनता है”: सुनने की क्षमता असल में दूसरी तिमाही में ही विकसित होती है',
      'पेट का आकार शिशु का लिंग बताता है: इसका कोई वैज्ञानिक प्रमाण नहीं है',
      'ज़्यादा हलचल करने वाला शिशु ज़रूर ज़्यादा स्वस्थ होता है: हलचल का स्तर एक शिशु से दूसरे में काफ़ी अलग होता है',
    ],
    tip2Title: 'जानना अच्छा रहेगा',
    tip2Text: 'शिशु के विकास का हर चरण अपनी रफ़्तार से चलता है; नियमित चिकित्सकीय जाँच यह पक्का करने में मदद करती है कि सब कुछ सामान्य ढंग से आगे बढ़ रहा है।',
    shareMessage: 'गर्भ में शिशु का विकास — AWA',
  },
  sq: {
    badge: 'SHTATZËNIA • ZHVILLIMI',
    title: 'Zhvillimi i bebes sate\nnë mitër',
    metaDuration: '6 min lexim',
    metaType: 'Artikull',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Si rritet bebja jote, tremujor pas tremujori.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Tremujori i parë: ditët e para',
      'Tremujori i dytë: ndjenjat zgjohen',
      'Tremujori i tretë: faza e fundit',
      'Momentet kryesore në një vështrim',
      'Mitet e zakonshme',
      'Çfarë të mbash mend',
    ],
    body1: 'Që nga java e 6, një zemër e vogël fillon tashmë të rrah. Gjatë këtij tremujori të parë, organet kryesore formohen gradualisht.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Rrahja e zemrës së bebes është një nga shenjat e para të dukshme në ekografi, shpesh një moment i paharrueshëm në ndjekjen tënde mjekësore.',
    body2: 'Rreth javës 20, zakonisht mund t’i ndjesh lëvizjet e para të bebes. Është edhe koha kur fillojnë të zhvillohen shqisat.',
    body3: 'Nga tremujori i 3-të e tutje, bebja shton shpejt peshë dhe gradualisht merr pozicionin për lindjen.',
    neutralText: 'Ritmi i zhvillimit ndryshon nga një beb te tjetri: këto momente mbeten mesatare të përgjithshme.',
    milestones: [
      'Nga java e 6: zemra fillon të rrah',
      'Rreth javës 20: ndihen lëvizjet e para',
      'Rreth javëve 24-26: zhvillohet dëgjimi',
      'Rreth javës 28: sytë çelen gradualisht',
    ],
    myths: [
      'Bebja “dëgjon gjithçka” që në fillim: dëgjimi nuk zhvillohet vërtet deri në tremujorin e 2-të',
      'Forma e barkut tregon gjininë e bebes: asnjë provë shkencore nuk e mbështet këtë',
      'Një beb aktiv është domosdoshmërisht më i shëndetshëm: niveli i aktivitetit ndryshon shumë nga një beb te tjetri',
    ],
    tip2Title: 'Mirë është ta dish',
    tip2Text: 'Çdo fazë e zhvillimit të bebes ndjek ritmin e vet; kontrollet mjekësore të rregullta ndihmojnë të konfirmohet që gjithçka po përparon normalisht.',
    shareMessage: 'Zhvillimi i bebes në mitër — AWA',
  },
  ja: {
    badge: '妊娠 • 赤ちゃんの成長',
    title: 'おなかの中での\n赤ちゃんの成長',
    metaDuration: '読了6分',
    metaType: '記事',
    metaLevel: '初級',
    metaValidated: '監修済みの内容',
    intro: '赤ちゃんが、妊娠初期・中期・後期とどのように育っていくかを紹介します。',
    contentsTitle: 'この記事の内容',
    topics: [
      '妊娠初期：はじまりのころ',
      '妊娠中期：感覚が目覚める',
      '妊娠後期：いよいよ最終段階',
      'おもな節目を一覧で',
      'よくある思い込み',
      '覚えておきたいこと',
    ],
    body1: '早ければ妊娠6週から、小さな心臓が拍動を始めます。この妊娠初期のあいだに、おもな器官が少しずつ形づくられていきます。',
    tip1Title: '知っておきたいこと',
    tip1Text: '赤ちゃんの心拍は、超音波検査で最初に確認できるサインのひとつで、妊婦健診の中でも心に残る瞬間になることが多いです。',
    body2: '妊娠20週ごろには、赤ちゃんの最初の動きを感じられるようになるのが一般的です。このころから、感覚も発達し始めます。',
    body3: '妊娠後期に入ると、赤ちゃんは急速に体重が増え、出産に向けて少しずつ位置を整えていきます。',
    neutralText: '成長のペースは赤ちゃんによって異なります。ここで紹介する節目は、あくまで一般的な目安です。',
    milestones: [
      '6週から：心臓が拍動を始める',
      '20週ごろ：最初の胎動を感じる',
      '24〜26週ごろ：聴覚が発達する',
      '28週ごろ：目が少しずつ開く',
    ],
    myths: [
      '赤ちゃんは最初から「何でも聞こえている」：聴覚が本格的に発達するのは妊娠中期からです',
      'おなかの形で赤ちゃんの性別がわかる：これを裏づける科学的根拠はありません',
      'よく動く赤ちゃんは必ず健康：活発さの程度は、赤ちゃんによって大きく異なります',
    ],
    tip2Title: '知っておきたいこと',
    tip2Text: '赤ちゃんの成長の各段階は、それぞれのペースで進みます。定期的な健診を受けると、順調に進んでいるかどうかを確認できます。',
    shareMessage: 'おなかの中での赤ちゃんの成長 — AWA',
  },
  ko: {
    badge: '임신 • 발달',
    title: '자궁 속\n아기의 발달',
    metaDuration: '6분 읽기',
    metaType: '아티클',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '아기가 임신 초기, 중기, 후기를 거치며 어떻게 자라는지 알아봐요.',
    contentsTitle: '이 아티클에서는',
    topics: [
      '임신 초기: 첫 시작',
      '임신 중기: 감각이 깨어나요',
      '임신 후기: 마지막 구간',
      '주요 이정표 한눈에 보기',
      '흔한 오해',
      '기억해 둘 점',
    ],
    body1: '임신 6주부터 작은 심장이 이미 뛰기 시작해요. 임신 초기 동안 주요 장기가 차근차근 만들어져요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '아기의 심장 박동은 초음파에서 가장 먼저 눈에 보이는 신호 중 하나로, 진료 과정에서 오래 기억에 남는 순간인 경우가 많아요.',
    body2: '임신 20주 무렵부터는 보통 아기의 첫 움직임을 느낄 수 있어요. 이 시기에 감각도 발달하기 시작해요.',
    body3: '임신 후기부터 아기는 체중이 빠르게 늘고, 출산을 위해 서서히 자리를 잡아요.',
    neutralText: '발달 속도는 아기마다 달라요. 이 이정표는 어디까지나 일반적인 평균이에요.',
    milestones: [
      '6주부터: 심장이 뛰기 시작해요',
      '20주 무렵: 첫 움직임을 느껴요',
      '24~26주 무렵: 청각이 발달해요',
      '28주 무렵: 눈이 서서히 떠져요',
    ],
    myths: [
      '아기는 처음부터 “모든 것을 듣는다”: 청각은 임신 중기가 되어서야 제대로 발달해요',
      '배 모양으로 아기의 성별을 알 수 있다: 이를 뒷받침하는 과학적 근거는 없어요',
      '활동적인 아기가 반드시 더 건강하다: 활동량은 아기마다 크게 달라요',
    ],
    tip2Title: '알아 두면 좋아요',
    tip2Text: '아기의 발달 단계는 저마다의 속도로 진행돼요. 정기적인 건강 검진은 모든 것이 정상적으로 진행되고 있는지 확인하는 데 도움이 돼요.',
    shareMessage: '자궁 속 아기의 발달 — AWA',
  },
  'pt-PT': {
    badge: 'GRAVIDEZ • DESENVOLVIMENTO',
    title: 'O desenvolvimento do seu bebé\nno útero',
    metaDuration: '6 min de leitura',
    metaType: 'Artigo',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Como o seu bebé cresce, trimestre a trimestre.',
    contentsTitle: 'Neste artigo',
    topics: [
      'O 1.º trimestre: os primeiros tempos',
      'O 2.º trimestre: os sentidos despertam',
      'O 3.º trimestre: a reta final',
      'Marcos importantes num relance',
      'Mitos comuns',
      'O que reter',
    ],
    body1: 'Logo a partir da semana 6, um pequeno coração já começa a bater. Ao longo deste primeiro trimestre, os principais órgãos formam-se progressivamente.',
    tip1Title: 'Bom saber',
    tip1Text: 'Os batimentos cardíacos do bebé são um dos primeiros sinais visíveis na ecografia, muitas vezes um momento memorável no seu acompanhamento.',
    body2: 'Por volta da semana 20, é normalmente possível sentir os primeiros movimentos do bebé. É também nesta altura que os sentidos começam a desenvolver-se.',
    body3: 'A partir do 3.º trimestre, o bebé ganha peso rapidamente e coloca-se, aos poucos, na posição para o parto.',
    neutralText: 'O ritmo de desenvolvimento varia de bebé para bebé: estes marcos continuam a ser médias gerais.',
    milestones: [
      'A partir das 6 semanas: o coração começa a bater',
      'Por volta das 20 semanas: primeiros movimentos sentidos',
      'Por volta das 24-26 semanas: a audição desenvolve-se',
      'Por volta das 28 semanas: os olhos abrem-se gradualmente',
    ],
    myths: [
      'O bebé “ouve tudo” desde o início: a audição só se desenvolve verdadeiramente a partir do 2.º trimestre',
      'A forma da barriga indica o sexo do bebé: nenhuma evidência científica o comprova',
      'Um bebé ativo é necessariamente mais saudável: o nível de atividade varia muito de um bebé para outro',
    ],
    tip2Title: 'Bom saber',
    tip2Text: 'Cada etapa do desenvolvimento do bebé segue o seu próprio ritmo; as consultas médicas regulares ajudam a confirmar que tudo está a evoluir normalmente.',
    shareMessage: 'O desenvolvimento do bebé no útero — AWA',
  },
  bn: {
    badge: 'গর্ভাবস্থা • বিকাশ',
    title: 'গর্ভে আপনার শিশুর\nবিকাশ',
    metaDuration: 'পড়তে 6 মিনিট',
    metaType: 'নিবন্ধ',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'প্রতিটি ত্রৈমাসিকে আপনার শিশু কীভাবে বেড়ে ওঠে।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'প্রথম ত্রৈমাসিক: শুরুর দিনগুলো',
      'দ্বিতীয় ত্রৈমাসিক: ইন্দ্রিয়গুলো জেগে ওঠে',
      'তৃতীয় ত্রৈমাসিক: শেষ ধাপ',
      'এক নজরে প্রধান ধাপসমূহ',
      'প্রচলিত ভুল ধারণা',
      'যা মনে রাখবেন',
    ],
    body1: 'ষষ্ঠ সপ্তাহ থেকেই একটি ক্ষুদ্র হৃদয় স্পন্দিত হতে শুরু করে। এই প্রথম ত্রৈমাসিকজুড়ে প্রধান অঙ্গগুলো ধীরে ধীরে গড়ে ওঠে।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'আলট্রাসাউন্ডে দেখা যায় এমন প্রথম লক্ষণগুলোর একটি হলো শিশুর হৃদস্পন্দন, যা আপনার চিকিৎসাসেবার সময় প্রায়ই একটি স্মরণীয় মুহূর্ত হয়ে থাকে।',
    body2: 'প্রায় 20তম সপ্তাহে সাধারণত শিশুর প্রথম নড়াচড়া টের পাওয়া যায়। এই সময়েই ইন্দ্রিয়গুলোরও বিকাশ শুরু হয়।',
    body3: 'তৃতীয় ত্রৈমাসিক থেকে শিশুর ওজন দ্রুত বাড়ে এবং ধীরে ধীরে জন্মের জন্য সঠিক অবস্থানে চলে আসে।',
    neutralText: 'বিকাশের গতি এক শিশু থেকে আরেক শিশুতে আলাদা হয়: এই ধাপগুলো কেবল সাধারণ গড় হিসাব।',
    milestones: [
      '6 সপ্তাহ থেকে: হৃদয় স্পন্দিত হতে শুরু করে',
      'প্রায় 20 সপ্তাহে: প্রথম নড়াচড়া টের পাওয়া যায়',
      'প্রায় 24-26 সপ্তাহে: শ্রবণশক্তির বিকাশ হয়',
      'প্রায় 28 সপ্তাহে: চোখ ধীরে ধীরে খুলতে শুরু করে',
    ],
    myths: [
      'শিশু শুরু থেকেই “সবকিছু শুনতে পায়”: দ্বিতীয় ত্রৈমাসিকের আগে শ্রবণশক্তি আসলে গড়ে ওঠে না',
      'পেটের আকৃতি দেখে শিশুর লিঙ্গ বোঝা যায়: এর পক্ষে কোনো বৈজ্ঞানিক প্রমাণ নেই',
      'সক্রিয় শিশু অবশ্যই বেশি সুস্থ: সক্রিয়তার মাত্রা এক শিশু থেকে আরেক শিশুতে অনেক আলাদা হয়',
    ],
    tip2Title: 'জেনে রাখা ভালো',
    tip2Text: 'শিশুর বিকাশের প্রতিটি ধাপ নিজস্ব গতিতে চলে; নিয়মিত চিকিৎসা পরীক্ষা নিশ্চিত করতে সাহায্য করে যে সবকিছু স্বাভাবিকভাবে এগোচ্ছে।',
    shareMessage: 'গর্ভে শিশুর বিকাশ — AWA',
  },
  da: {
    badge: 'GRAVIDITET • UDVIKLING',
    title: 'Din babys udvikling\ni livmoderen',
    metaDuration: '6 min. læsning',
    metaType: 'Artikel',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemset indhold',
    intro: 'Sådan vokser din baby, trimester for trimester.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Det første trimester: de tidlige dage',
      'Det andet trimester: sanserne vågner',
      'Det tredje trimester: den sidste etape',
      'Vigtige milepæle på et øjeblik',
      'Almindelige myter',
      'Hvad du skal huske',
    ],
    body1: 'Allerede fra uge 6 begynder et lille hjerte at slå. I løbet af dette første trimester dannes de vigtigste organer gradvist.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Babyens hjertelyd er et af de første synlige tegn ved ultralyd og er ofte et mindeværdigt øjeblik i din graviditetsopfølgning.',
    body2: 'Omkring uge 20 kan du som regel mærke babyens første bevægelser. Det er også nu, sanserne begynder at udvikle sig.',
    body3: 'Fra det 3. trimester tager babyen hurtigt på og bevæger sig gradvist i fødselspositionen.',
    neutralText: 'Udviklingshastigheden varierer fra baby til baby: disse milepæle er kun generelle gennemsnit.',
    milestones: [
      'Fra uge 6: hjertet begynder at slå',
      'Omkring uge 20: første bevægelser mærkes',
      'Omkring uge 24-26: hørelsen udvikles',
      'Omkring uge 28: øjnene åbner sig gradvist',
    ],
    myths: [
      'Babyen "hører alt" fra starten: hørelsen udvikler sig reelt ikke før i det 2. trimester',
      'Maveformens form afslører babyens køn: der er ingen videnskabelig dokumentation for dette',
      'En aktiv baby er nødvendigvis sundere: aktivitetsniveauet varierer meget fra baby til baby',
    ],
    tip2Title: 'Godt at vide',
    tip2Text: 'Hvert trin i babyens udvikling følger sin egen takt; regelmæssige lægetjek hjælper med at bekræfte, at alt forløber normalt.',
    shareMessage: 'Babyens udvikling i livmoderen — AWA',
  },
  sv: {
    badge: 'GRAVIDITET • UDVIKLING',
    title: 'Din babys udvikling\ni livmoderen',
    metaDuration: '6 min. läsning',
    metaType: 'Artikel',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemset indhold',
    intro: 'Sådan vokser din baby, trimester for trimester.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Det förste trimester: de tidlige dage',
      'Det andet trimester: sanserne vågner',
      'Det tredje trimester: den sidste etape',
      'Vigtige milepäle på et öjeblik',
      'Almindelige myter',
      'Hvad du skal huske',
    ],
    body1: 'Allerede fran vecka 6 begynder et lille hjerte at slå. I löbet av dette förste trimester dannes de vigtigste organer gradvist.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Babyens hjertelyd ar et av de förste synlige tegn ved ultralyd och ar ofta et mindevärdigt öjeblik i din graviditetsopfölgning.',
    body2: 'Omkring vecka 20 kan du som regel märke babyens förste bevägelser. Det ar også nu, sanserne begynder at udvikle sig.',
    body3: 'Fra det 3. trimester tager babyen hurtigt på och beväger sig gradvist i födselspositionen.',
    neutralText: 'Udviklingshastigheden varierer fran baby till baby: disse milepäle ar kun generelle gennemsnit.',
    milestones: [
      'Fra vecka 6: hjertet begynder at slå',
      'Omkring vecka 20: förste bevägelser märkes',
      'Omkring vecka 24-26: hörelsen udvikles',
      'Omkring vecka 28: öjnene åbner sig gradvist',
    ],
    myths: [
      'Babyen "hörer alt" fran starten: hörelsen udvikler sig reelt inte för i det 2. trimester',
      'Maveformens form afslörer babyens kön: der ar ingen videnskabelig dokumentation for dette',
      'En aktiv baby ar nödvendigvis sundere: aktivitetsniveauet varierer mycket fran baby till baby',
    ],
    tip2Title: 'Godt at vide',
    tip2Text: 'Hvert trin i babyens udvikling fölger sin egen takt; regelmässige lägetjek hjälper med at bekräfte, at alt forlöber normalt.',
    shareMessage: 'Babyens udvikling i livmoderen — AWA',
  },
  nb: {
    badge: 'SVANGERSKAP • UTVIKLING',
    title: 'Babyens utvikling\ni livmoren',
    metaDuration: '6 min lesing',
    metaType: 'Artikkel',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Hvordan babyen din vokser, trimester for trimester.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Første trimester: de første dagene',
      'Andre trimester: sansene våkner',
      'Tredje trimester: siste etappe',
      'Viktige milepæler på et blikk',
      'Vanlige myter',
      'Det viktigste å huske',
    ],
    body1: 'Allerede fra uke 6 begynner et lite hjerte å slå. I løpet av dette første trimesteret dannes de viktigste organene gradvis.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Babyens hjerteslag er et av de første synlige tegnene på ultralyd, og ofte et uforglemmelig øyeblikk under oppfølgingen din.',
    body2: 'Rundt uke 20 kan du vanligvis kjenne babyens første bevegelser. Dette er også da sansene begynner å utvikle seg.',
    body3: 'Fra tredje trimester legger babyen raskt på seg og flytter seg gradvis i posisjon for fødselen.',
    neutralText: 'Utviklingstakten varierer fra baby til baby: disse milepælene er fortsatt generelle gjennomsnitt.',
    milestones: [
      'Fra 6 uker: hjertet begynner å slå',
      'Rundt 20 uker: første bevegelser kjennes',
      'Rundt 24–26 uker: hørselen utvikles',
      'Rundt 28 uker: øynene åpner seg gradvis',
    ],
    myths: [
      'Babyen «hører alt» fra begynnelsen: hørselen utvikles egentlig ikke før i andre trimester',
      'Formen på magen viser kjønnet til babyen: ingen vitenskapelige bevis støtter dette',
      'En aktiv baby er nødvendigvis friskere: aktivitetsnivået varierer mye fra baby til baby',
    ],
    tip2Title: 'Godt å vite',
    tip2Text: 'Hvert trinn i babyens utvikling følger sitt eget tempo; regelmessige kontroller hos lege hjelper med å bekrefte at alt utvikler seg normalt.',
    shareMessage: 'Babyens utvikling i livmoren – AWA',
  },
  pl: {
    badge: 'CIĄŻA • ROZWÓJ',
    title: 'Rozwój Twojego dziecka\nw łonie matki',
    metaDuration: '6 min czytania',
    metaType: 'Artykuł',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Jak rośnie Twoje dziecko, trymestr po trymestrze.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Pierwszy trymestr: pierwsze dni',
      'Drugi trymestr: budzą się zmysły',
      'Trzeci trymestr: ostatnia prosta',
      'Najważniejsze etapy w skrócie',
      'Popularne mity',
      'Co zapamiętać',
    ],
    body1: 'Już od 6. tygodnia zaczyna bić maleńkie serce. W trakcie tego pierwszego trymestru stopniowo kształtują się główne narządy.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Bicie serca dziecka to jeden z pierwszych widocznych objawów w badaniu USG, często niezapomniany moment w trakcie opieki.',
    body2: 'Około 20. tygodnia zwykle można poczuć pierwsze ruchy dziecka. To także czas, gdy zaczynają rozwijać się zmysły.',
    body3: 'Od 3. trymestru dziecko szybko przybiera na wadze i stopniowo układa się do porodu.',
    neutralText: 'Tempo rozwoju jest różne u każdego dziecka: te etapy pozostają ogólnymi średnimi.',
    milestones: [
      'Od 6. tygodnia: zaczyna bić serce',
      'Około 20. tygodnia: pierwsze odczuwalne ruchy',
      'Około 24.–26. tygodnia: rozwija się słuch',
      'Około 28. tygodnia: oczy stopniowo się otwierają',
    ],
    myths: [
      'Dziecko „słyszy wszystko” od początku: słuch rozwija się naprawdę dopiero w 2. trymestrze',
      'Kształt brzucha wskazuje płeć dziecka: nie ma na to dowodów naukowych',
      'Aktywne dziecko jest koniecznie zdrowsze: poziom aktywności bardzo różni się u poszczególnych dzieci',
    ],
    tip2Title: 'Warto wiedzieć',
    tip2Text: 'Każdy etap rozwoju dziecka przebiega we własnym tempie; regularne badania kontrolne pomagają potwierdzić, że wszystko postępuje prawidłowo.',
    shareMessage: 'Rozwój dziecka w łonie matki — AWA',
  },
  uk: {
    badge: 'ВАГІТНІСТЬ • РОЗВИТОК',
    title: 'Розвиток вашої дитини\nв утробі',
    metaDuration: '6 хв читання',
    metaType: 'Стаття',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Як росте ваша дитина, триместр за триместром.',
    contentsTitle: 'У цій статті',
    topics: [
      'Перший триместр: перші дні',
      'Другий триместр: прокидаються відчуття',
      'Третій триместр: фінішна пряма',
      'Основні віхи коротко',
      'Поширені міфи',
      'Що запам’ятати',
    ],
    body1: 'Уже з 6-го тижня починає битися крихітне серце. Протягом цього першого триместру поступово формуються основні органи.',
    tip1Title: 'Варто знати',
    tip1Text: 'Серцебиття дитини — одна з перших видимих ознак на УЗД, часто це незабутній момент під час спостереження.',
    body2: 'Близько 20-го тижня зазвичай можна відчути перші рухи дитини. Це також час, коли починають розвиватися відчуття.',
    body3: 'З 3-го триместру дитина швидко набирає вагу й поступово займає положення для пологів.',
    neutralText: 'Темп розвитку різниться в різних дітей: ці віхи залишаються загальними середніми значеннями.',
    milestones: [
      'З 6 тижнів: починає битися серце',
      'Близько 20 тижнів: відчуваються перші рухи',
      'Близько 24–26 тижнів: розвивається слух',
      'Близько 28 тижнів: очі поступово розплющуються',
    ],
    myths: [
      'Дитина «чує все» від початку: слух по-справжньому розвивається лише у 2-му триместрі',
      'Форма живота вказує на стать дитини: наукових підтверджень цьому немає',
      'Активна дитина неодмінно здоровіша: рівень активності сильно різниться в різних дітей',
    ],
    tip2Title: 'Варто знати',
    tip2Text: 'Кожен етап розвитку дитини має власний темп; регулярні медичні огляди допомагають переконатися, що все розвивається нормально.',
    shareMessage: 'Розвиток дитини в утробі — AWA',
  },
  cs: {
    badge: 'TĚHOTENSTVÍ • VÝVOJ',
    title: 'Vývoj vašeho miminka\nv děloze',
    metaDuration: '6 min čtení',
    metaType: 'Článek',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Jak miminko roste, trimestr po trimestru.',
    contentsTitle: 'V tomto článku',
    topics: [
      'První trimestr: první dny',
      'Druhý trimestr: smysly se probouzejí',
      'Třetí trimestr: poslední úsek',
      'Klíčové milníky na první pohled',
      'Časté mýty',
      'Co si zapamatovat',
    ],
    body1: 'Už od 6. týdne začíná bít drobné srdíčko. Během tohoto prvního trimestru se postupně vytvářejí hlavní orgány.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Tlukot srdce miminka je jednou z prvních viditelných známek na ultrazvuku a často bývá nezapomenutelným okamžikem vaší péče.',
    body2: 'Kolem 20. týdne obvykle ucítíte první pohyby miminka. V této době se také začínají vyvíjet smysly.',
    body3: 'Od třetího trimestru miminko rychle přibírá na váze a postupně zaujímá polohu pro porod.',
    neutralText: 'Tempo vývoje se u jednotlivých miminek liší: tyto milníky zůstávají obecnými průměry.',
    milestones: [
      'Od 6. týdne: srdce začíná bít',
      'Kolem 20. týdne: první pociťované pohyby',
      'Kolem 24.–26. týdne: vyvíjí se sluch',
      'Kolem 28. týdne: oči se postupně otevírají',
    ],
    myths: [
      'Miminko „slyší všechno“ od začátku: sluch se doopravdy vyvíjí až ve 2. trimestru',
      'Tvar bříška prozrazuje pohlaví miminka: žádný vědecký důkaz to nepotvrzuje',
      'Aktivní miminko je nutně zdravější: úroveň aktivity se mezi miminky velmi liší',
    ],
    tip2Title: 'Stojí za to vědět',
    tip2Text: 'Každá fáze vývoje miminka probíhá vlastním tempem; pravidelné lékařské kontroly pomáhají potvrdit, že vše probíhá normálně.',
    shareMessage: 'Vývoj miminka v děloze — AWA',
  },
  sk: {
    badge: 'TEHOTENSTVO • VÝVOJ',
    title: 'Vývoj vášho bábätka\nv maternici',
    metaDuration: '6 min čítania',
    metaType: 'Článok',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Ako vaše bábätko rastie, trimester po trimestri.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Prvý trimester: prvé dni',
      'Druhý trimester: zmysly sa prebúdzajú',
      'Tretí trimester: záverečná rovinka',
      'Kľúčové míľniky na prvý pohľad',
      'Časté mýty',
      'Čo si zapamätať',
    ],
    body1: 'Už od 6. týždňa začína biť drobné srdiečko. Počas prvého trimestra sa postupne tvoria hlavné orgány.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Tlkot srdca bábätka je jedným z prvých viditeľných znakov na ultrazvuku a pre mnohé ženy býva nezabudnuteľným okamihom.',
    body2: 'Okolo 20. týždňa zvyčajne pocítite prvé pohyby bábätka. V tomto období sa začínajú vyvíjať aj zmysly.',
    body3: 'Od tretieho trimestra bábätko rýchlo priberá a postupne zaujíma polohu na pôrod.',
    neutralText: 'Tempo vývoja sa u každého bábätka líši: tieto míľniky sú iba všeobecné priemery.',
    milestones: [
      'Od 6 týždňov: srdce začína biť',
      'Okolo 20 týždňov: pocítite prvé pohyby',
      'Okolo 24 – 26 týždňov: vyvíja sa sluch',
      'Okolo 28 týždňov: oči sa postupne otvárajú',
    ],
    myths: [
      'Bábätko „počuje všetko“ od začiatku: sluch sa skutočne vyvíja až v druhom trimestri',
      'Tvar brucha prezrádza pohlavie bábätka: žiadny vedecký dôkaz to nepotvrdzuje',
      'Aktívne bábätko je nevyhnutne zdravšie: úroveň aktivity sa medzi bábätkami veľmi líši',
    ],
    tip2Title: 'Stojí za to vedieť',
    tip2Text: 'Každá fáza vývoja bábätka má svoje tempo; pravidelné lekárske kontroly pomáhajú potvrdiť, že všetko prebieha normálne.',
    shareMessage: 'Vývoj bábätka v maternici — AWA',
  },
  hu: {
    badge: 'TERHESSÉG • FEJLŐDÉS',
    title: 'A babád fejlődése\naz anyaméhben',
    metaDuration: '6 perc olvasás',
    metaType: 'Cikk',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Hogyan növekszik a babád, trimeszterről trimeszterre.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Az első trimeszter: az első napok',
      'A második trimeszter: ébrednek az érzékek',
      'A harmadik trimeszter: a hajrá',
      'A legfontosabb mérföldkövek egy pillantásra',
      'Gyakori tévhitek',
      'Amit érdemes megjegyezni',
    ],
    body1: 'Már a 6. hét körül egy apró szív kezd dobogni. Az első trimeszter során fokozatosan kialakulnak a fő szervek.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'A baba szívverése az ultrahangon látható egyik első jel, és gyakran emlékezetes pillanat a gondozásod során.',
    body2: 'A 20. hét körül általában érezni kezded a baba első mozgásait. Ekkor kezdenek fejlődni az érzékek is.',
    body3: 'A harmadik trimesztertől a baba gyorsan hízik, és fokozatosan a szüléshez megfelelő helyzetbe fordul.',
    neutralText: 'A fejlődés üteme babánként eltérő: ezek a mérföldkövek csak általános átlagok.',
    milestones: [
      '6 hetesen: elkezd dobogni a szív',
      'Körülbelül 20 hetesen: az első mozgások érezhetők',
      'Körülbelül 24–26 hetesen: kifejlődik a hallás',
      'Körülbelül 28 hetesen: a szemek fokozatosan kinyílnak',
    ],
    myths: [
      'A baba az elejétől „mindent hall”: a hallás valójában csak a 2. trimeszterben fejlődik ki',
      'A has alakja elárulja a baba nemét: erre nincs tudományos bizonyíték',
      'Az aktív baba szükségszerűen egészségesebb: az aktivitás szintje babánként nagyon eltérő',
    ],
    tip2Title: 'Érdemes tudni',
    tip2Text: 'A baba fejlődésének minden szakasza a saját ritmusában halad; a rendszeres orvosi vizsgálatok segítenek megerősíteni, hogy minden rendben zajlik.',
    shareMessage: 'A baba fejlődése az anyaméhben — AWA',
  },
  ro: {
    badge: 'SARCINĂ • DEZVOLTARE',
    title: 'Dezvoltarea bebelușului\ntău în uter',
    metaDuration: '6 min de citit',
    metaType: 'Articol',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Cum crește bebelușul tău, trimestru după trimestru.',
    contentsTitle: 'În acest articol',
    topics: [
      'Primul trimestru: primele zile',
      'Al doilea trimestru: simțurile se trezesc',
      'Al treilea trimestru: ultima linie dreaptă',
      'Reperele-cheie dintr-o privire',
      'Mituri frecvente',
      'Ce să reții',
    ],
    body1: 'Încă din săptămâna 6, o inimioară minusculă începe deja să bată. Pe parcursul acestui prim trimestru, principalele organe se formează treptat.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Bătaia inimii bebelușului este unul dintre primele semne vizibile la ecografie, adesea un moment de neuitat în urmărirea ta.',
    body2: 'În jurul săptămânii 20, de obicei poți simți primele mișcări ale bebelușului. Tot atunci încep să se dezvolte simțurile.',
    body3: 'Din al treilea trimestru, bebelușul se îngrașă rapid și se așază treptat în poziția de naștere.',
    neutralText: 'Ritmul dezvoltării variază de la un bebeluș la altul: aceste repere rămân medii generale.',
    milestones: [
      'De la 6 săptămâni: inima începe să bată',
      'În jur de 20 de săptămâni: primele mișcări simțite',
      'În jur de 24-26 de săptămâni: auzul se dezvoltă',
      'În jur de 28 de săptămâni: ochii se deschid treptat',
    ],
    myths: [
      'Bebelușul „aude tot” de la început: auzul nu se dezvoltă cu adevărat decât în al doilea trimestru',
      'Forma burții indică sexul bebelușului: nicio dovadă științifică nu susține acest lucru',
      'Un bebeluș activ este neapărat mai sănătos: nivelul de activitate variază mult de la un bebeluș la altul',
    ],
    tip2Title: 'Bine de știut',
    tip2Text: 'Fiecare etapă a dezvoltării bebelușului își urmează propriul ritm; controalele medicale regulate ajută la confirmarea faptului că totul decurge normal.',
    shareMessage: 'Dezvoltarea bebelușului în uter — AWA',
  },
  bg: {
    badge: 'БРЕМЕННОСТ • РАЗВИТИЕ',
    title: 'Развитието на бебето ти\nв утробата',
    metaDuration: '6 мин четене',
    metaType: 'Статия',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Как расте бебето ти, триместър след триместър.',
    contentsTitle: 'В тази статия',
    topics: [
      'Първи триместър: първите дни',
      'Втори триместър: сетивата се събуждат',
      'Трети триместър: последната права',
      'Ключовите етапи с един поглед',
      'Чести митове',
      'Какво да запомниш',
    ],
    body1: 'Още от 6-ата седмица мъничко сърце вече започва да бие. През този първи триместър основните органи се формират постепенно.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Сърдечният ритъм на бебето е един от първите видими признаци на ехографията, често незабравим момент в проследяването ти.',
    body2: 'Около 20-ата седмица обикновено можеш да усетиш първите движения на бебето. Тогава започват да се развиват и сетивата.',
    body3: 'От третия триместър нататък бебето бързо наддава на тегло и постепенно заема положение за раждането.',
    neutralText: 'Темпото на развитие варира от бебе на бебе: тези ориентири остават общи средни стойности.',
    milestones: [
      'От 6 седмици: сърцето започва да бие',
      'Около 20 седмици: усещат се първите движения',
      'Около 24–26 седмици: развива се слухът',
      'Около 28 седмици: очите постепенно се отварят',
    ],
    myths: [
      'Бебето „чува всичко“ от самото начало: слухът не се развива истински преди втория триместър',
      'Формата на корема показва пола на бебето: няма научни доказателства за това',
      'Активното бебе е непременно по-здраво: нивото на активност варира значително от бебе на бебе',
    ],
    tip2Title: 'Добре е да знаеш',
    tip2Text: 'Всеки етап от развитието на бебето следва собствения си ритъм; редовните медицински прегледи помагат да се потвърди, че всичко протича нормално.',
    shareMessage: 'Развитието на бебето в утробата — AWA',
  },
  sr: {
    badge: 'ТРУДНОЋА • РАЗВОЈ',
    title: 'Развој твоје бебе\nу материци',
    metaDuration: '6 мин читања',
    metaType: 'Чланак',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Како твоја беба расте, триместар по триместар.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Први триместар: први дани',
      'Други триместар: чула се буде',
      'Трећи триместар: последња деоница',
      'Кључне фазе укратко',
      'Чести митови',
      'Шта да запамтиш',
    ],
    body1: 'Већ од 6. недеље мало срце почиње да куца. Током овог првог триместра главни органи се постепено формирају.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Откуцаји срца бебе су један од првих видљивих знакова на ултразвуку, често незаборавни тренутак у твом праћењу.',
    body2: 'Око 20. недеље обично можеш осетити прве покрете бебе. Тада се почињу развијати и чула.',
    body3: 'Од трећег триместра беба брзо добија на тежини и постепено заузима положај за порођај.',
    neutralText: 'Темпо развоја варира од бебе до бебе: ове фазе остају општи просеци.',
    milestones: [
      'Од 6 недеља: срце почиње да куца',
      'Око 20 недеља: први покрети се осећају',
      'Око 24–26 недеља: развија се слух',
      'Око 28 недеља: очи се постепено отварају',
    ],
    myths: [
      'Беба „чује све“ од самог почетка: слух се заправо не развија до другог триместра',
      'Облик стомака показује пол бебе: ниједан научни доказ то не подржава',
      'Активна беба је нужно здравија: ниво активности увелико варира од бебе до бебе',
    ],
    tip2Title: 'Добро је знати',
    tip2Text: 'Свака фаза развоја бебе прати свој темпо; редовни лекарски прегледи помажу да се потврди да све напредује нормално.',
    shareMessage: 'Развој бебе у материци — AWA',
  },
  hr: {
    badge: 'TRUDNOĆA • RAZVOJ',
    title: 'Razvoj tvoje bebe\nu maternici',
    metaDuration: '6 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Kako tvoja beba raste, trimestar po trimestar.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Prvi trimestar: prvi dani',
      'Drugi trimestar: osjetila se bude',
      'Treći trimestar: završnica',
      'Ključne prekretnice na jednom mjestu',
      'Česti mitovi',
      'Što zapamtiti',
    ],
    body1: 'Već od 6. tjedna sićušno srce počinje kucati. Tijekom prvog trimestra postupno se oblikuju glavni organi.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Otkucaji bebina srca jedan su od prvih vidljivih znakova na ultrazvuku, često nezaboravan trenutak tijekom praćenja.',
    body2: 'Oko 20. tjedna obično možeš osjetiti prve bebine pokrete. Tada se počinju razvijati i osjetila.',
    body3: 'Od trećeg trimestra beba brzo dobiva na težini i postupno zauzima položaj za porod.',
    neutralText: 'Tempo razvoja razlikuje se od bebe do bebe: ove prekretnice ostaju opći prosjeci.',
    milestones: [
      'Od 6. tjedna: srce počinje kucati',
      'Oko 20. tjedna: osjećaju se prvi pokreti',
      'Oko 24.–26. tjedna: razvija se sluh',
      'Oko 28. tjedna: oči se postupno otvaraju',
    ],
    myths: [
      'Beba „čuje sve“ od početka: sluh se zapravo ne razvija prije drugog trimestra',
      'Oblik trbuha otkriva spol bebe: nijedan znanstveni dokaz to ne potvrđuje',
      'Aktivna beba nužno je zdravija: razina aktivnosti jako se razlikuje od bebe do bebe',
    ],
    tip2Title: 'Dobro je znati',
    tip2Text: 'Svaka faza bebina razvoja slijedi vlastiti tempo; redoviti liječnički pregledi pomažu potvrditi da sve napreduje normalno.',
    shareMessage: 'Razvoj bebe u maternici — AWA',
  },
  bs: {
    badge: 'TRUDNOĆA • RAZVOJ',
    title: 'Razvoj tvoje bebe\nu maternici',
    metaDuration: '6 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Kako tvoja beba raste, trimestar po trimestar.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Prvi trimestar: prvi dani',
      'Drugi trimestar: osjetila se bude',
      'Treći trimestar: završnica',
      'Ključne prekretnice na jednom mjestu',
      'Česti mitovi',
      'Što zapamtiti',
    ],
    body1: 'Već od 6. sedmice sićušno srce počinje kucati. Tokom prvog trimestra postupno se oblikuju glavni organi.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Otkucaji bebina srca jedan su od prvih vidljivih znakova na ultrazvuku, često nezaboravan trenutak tokom praćenja.',
    body2: 'Oko 20. sedmice obično možeš osjetiti prve bebine pokrete. Tada se počinju razvijati i osjetila.',
    body3: 'Od trećeg trimestra beba brzo dobiva na težini i postupno zauzima položaj za porođaj.',
    neutralText: 'Tempo razvoja razlikuje se od bebe do bebe: ove prekretnice ostaju opći prosjeci.',
    milestones: [
      'Od 6. sedmice: srce počinje kucati',
      'Oko 20. sedmice: osjećaju se prvi pokreti',
      'Oko 24.–26. sedmice: razvija se sluh',
      'Oko 28. sedmice: oči se postupno otvaraju',
    ],
    myths: [
      'Beba „čuje sve“ od početka: sluh se zapravo ne razvija prije drugog trimestra',
      'Oblik trbuha otkriva spol bebe: nijedan znanstveni dokaz to ne potvrđuje',
      'Aktivna beba nužno je zdravija: razina aktivnosti jako se razlikuje od bebe do bebe',
    ],
    tip2Title: 'Dobro je znati',
    tip2Text: 'Svaka faza bebina razvoja slijedi vlastiti tempo; redoviti ljekarski pregledi pomažu potvrditi da sve napreduje normalno.',
    shareMessage: 'Razvoj bebe u maternici — AWA',
  },
  sl: {
    badge: 'NOSEČNOST • RAZVOJ',
    title: 'Razvoj tvojega dojenčka\nv maternici',
    metaDuration: '6 min branja',
    metaType: 'Članek',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Kako tvoj dojenček raste, trimesečje za trimesečjem.',
    contentsTitle: 'V tem članku',
    topics: [
      'Prvo trimesečje: prvi dnevi',
      'Drugo trimesečje: čutila se prebujajo',
      'Tretje trimesečje: zadnji ovinek',
      'Ključni mejniki na enem mestu',
      'Pogosti miti',
      'Kaj si zapomniti',
    ],
    body1: 'Že od 6. tedna začne biti drobno srce. Med prvim trimesečjem se postopoma oblikujejo glavni organi.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Utripanje dojenčkovega srca je eden prvih vidnih znakov na ultrazvoku, pogosto nepozaben trenutek med spremljanjem.',
    body2: 'Okoli 20. tedna običajno začutiš prve dojenčkove gibe. Takrat se začnejo razvijati tudi čutila.',
    body3: 'Od tretjega trimesečja dojenček hitro pridobiva na teži in se postopoma namesti v položaj za porod.',
    neutralText: 'Tempo razvoja se razlikuje od dojenčka do dojenčka: ti mejniki ostajajo splošna povprečja.',
    milestones: [
      'Od 6. tedna: srce začne biti',
      'Okoli 20. tedna: občutijo se prvi gibi',
      'Okoli 24.–26. tedna: razvija se sluh',
      'Okoli 28. tedna: oči se postopoma odpirajo',
    ],
    myths: [
      'Dojenček „sliši vse“ od začetka: sluh se v resnici ne razvije pred drugim trimesečjem',
      'Oblika trebuha razkriva spol dojenčka: noben znanstveni dokaz tega ne potrjuje',
      'Aktiven dojenček je nujno bolj zdrav: raven aktivnosti se zelo razlikuje od dojenčka do dojenčka',
    ],
    tip2Title: 'Vredno vedeti',
    tip2Text: 'Vsaka faza dojenčkovega razvoja sledi lastnemu tempu; redni zdravniški pregledi pomagajo potrditi, da vse poteka normalno.',
    shareMessage: 'Razvoj dojenčka v maternici — AWA',
  },
  ne: {
    badge: 'गर्भावस्था • विकास',
    title: 'गर्भमा तपाईंको शिशुको\nविकास',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'लेख',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'त्रैमासिकपिच्छे तपाईंको शिशु कसरी बढ्छ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'पहिलो त्रैमासिक: सुरुका दिनहरू',
      'दोस्रो त्रैमासिक: इन्द्रियहरू जागृत हुन्छन्',
      'तेस्रो त्रैमासिक: अन्तिम चरण',
      'एक नजरमा मुख्य माइलस्टोनहरू',
      'सामान्य भ्रमहरू',
      'सम्झनुपर्ने कुराहरू',
    ],
    body1: 'हप्ता 6 देखि नै एउटा सानो मुटु धड्कन थाल्छ। यो पहिलो त्रैमासिकमा मुख्य अङ्गहरू बिस्तारै बन्छन्।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'शिशुको मुटुको धड्कन अल्ट्रासाउन्डमा देखिने पहिलो संकेतहरूमध्ये एक हो, जुन तपाईंको हेरचाहमा प्रायः एउटा सम्झनलायक क्षण हुन्छ।',
    body2: 'हप्ता 20 को वरिपरि, तपाईंले सामान्यतया शिशुको पहिलो चाल महसुस गर्न सक्नुहुन्छ। यही समयमा इन्द्रियहरू विकसित हुन थाल्छन्।',
    body3: 'तेस्रो त्रैमासिकदेखि, शिशुको तौल छिटो बढ्छ र बिस्तारै जन्मका लागि आफ्नो स्थानमा आउँछ।',
    neutralText: 'विकासको गति शिशुपिच्छे फरक हुन्छ: यी माइलस्टोनहरू सामान्य औसत मात्र हुन्।',
    milestones: [
      '6 हप्तादेखि: मुटु धड्कन थाल्छ',
      'करिब 20 हप्तामा: पहिलो चाल महसुस हुन्छ',
      'करिब 24-26 हप्तामा: सुन्ने क्षमता विकसित हुन्छ',
      'करिब 28 हप्तामा: आँखाहरू बिस्तारै खुल्छन्',
    ],
    myths: [
      'शिशुले सुरुदेखि नै “सबै कुरा सुन्छ”: सुन्ने क्षमता दोस्रो त्रैमासिकसम्म साँच्चै विकसित हुँदैन',
      'पेटको आकारले शिशुको लिङ्ग बताउँछ: यसलाई समर्थन गर्ने कुनै वैज्ञानिक प्रमाण छैन',
      'सक्रिय शिशु अनिवार्य रूपमा बढी स्वस्थ हुन्छ: सक्रियताको स्तर शिशुपिच्छे धेरै फरक हुन्छ',
    ],
    tip2Title: 'जान्न लायक',
    tip2Text: 'शिशुको विकासको हरेक चरण आफ्नै गतिमा हुन्छ; नियमित चिकित्सकीय जाँचले सबै कुरा सामान्य रूपमा अघि बढिरहेको पुष्टि गर्न मद्दत गर्छ।',
    shareMessage: 'गर्भमा शिशुको विकास — AWA',
  },
  si: {
    badge: 'ගර්භණී කාලය • වර්ධනය',
    title: 'ගර්භාෂය තුළ ඔබේ දරුවාගේ\nවර්ධනය',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'ලිපිය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඔබේ දරුවා ත්‍රෛමාසිකයෙන් ත්‍රෛමාසිකය වර්ධනය වන ආකාරය.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'පළමු ත්‍රෛමාසිකය: මුල් දින',
      'දෙවන ත්‍රෛමාසිකය: ඉන්ද්‍රියයන් අවදි වේ',
      'තෙවන ත්‍රෛමාසිකය: අවසන් අදියර',
      'ප්‍රධාන සන්ධිස්ථාන එක් බැල්මකින්',
      'පොදු මිථ්‍යා විශ්වාස',
      'මතක තබාගත යුතු දේ',
    ],
    body1: '6 වන සතියේ සිටම, කුඩා හදවතක් දැනටමත් ගැහෙන්නට පටන් ගනී. මෙම පළමු ත්‍රෛමාසිකය තුළ, ප්‍රධාන අවයව ක්‍රමයෙන් සෑදේ.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'දරුවාගේ හෘද ස්පන්දනය අල්ට්‍රාසවුන්ඩ් පරීක්ෂණයේ පළමු දෘශ්‍යමාන සලකුණුවලින් එකක් වන අතර, බොහෝ විට ඔබේ සත්කාරයේ අමතක නොවන මොහොතකි.',
    body2: 'සති 20ක් පමණ වන විට, ඔබට සාමාන්‍යයෙන් දරුවාගේ පළමු චලනයන් දැනිය හැක. මෙය ඉන්ද්‍රියයන් වර්ධනය වීමට පටන් ගන්නා කාලයද වේ.',
    body3: '3 වන ත්‍රෛමාසිකයේ සිට, දරුවා වේගයෙන් බර වැඩි කරගන්නා අතර ක්‍රමයෙන් උපතට සුදුසු ඉරියව්වට පැමිණේ.',
    neutralText: 'වර්ධනයේ වේගය දරුවාගෙන් දරුවාට වෙනස් වේ: මෙම සන්ධිස්ථාන සාමාන්‍ය සාමාන්‍යයන් ලෙස පවතී.',
    milestones: [
      'සති 6 සිට: හදවත ගැහෙන්නට පටන් ගනී',
      'සති 20ක් පමණ: පළමු චලනයන් දැනේ',
      'සති 24-26ක් පමණ: ශ්‍රවණය වර්ධනය වේ',
      'සති 28ක් පමණ: ඇස් ක්‍රමයෙන් විවෘත වේ',
    ],
    myths: [
      'දරුවා ආරම්භයේ සිටම “සියල්ල අසයි”: ශ්‍රවණය සැබවින්ම වර්ධනය වන්නේ 2 වන ත්‍රෛමාසිකය දක්වා නොවේ',
      'බඩේ හැඩය දරුවාගේ ලිංගය දක්වයි: මෙයට විද්‍යාත්මක සාක්ෂියක් නැත',
      'ක්‍රියාශීලී දරුවා අනිවාර්යයෙන්ම වඩා සෞඛ්‍ය සම්පන්නයි: ක්‍රියාකාරිත්ව මට්ටම් දරුවාගෙන් දරුවාට බොහෝ සේ වෙනස් වේ',
    ],
    tip2Title: 'දැනගත යුතු දේ',
    tip2Text: 'දරුවාගේ වර්ධනයේ සෑම අවධියක්ම තමන්ගේම වේගය අනුගමනය කරයි; නිතිපතා වෛද්‍ය පරීක්ෂණ සියල්ල සාමාන්‍ය ලෙස ප්‍රගතියක් ලබන බව තහවුරු කිරීමට උපකාරී වේ.',
    shareMessage: 'ගර්භාෂය තුළ දරුවාගේ වර්ධනය — AWA',
  },
  th: {
    badge: 'การตั้งครรภ์ • พัฒนาการ',
    title: 'พัฒนาการของลูกน้อย\nในครรภ์',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'บทความ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ลูกน้อยของคุณเติบโตอย่างไร ในแต่ละไตรมาส',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ไตรมาสแรก: วันแรก ๆ',
      'ไตรมาสที่สอง: ประสาทสัมผัสเริ่มตื่นขึ้น',
      'ไตรมาสที่สาม: ช่วงสุดท้าย',
      'หมุดหมายสำคัญโดยสรุป',
      'ความเชื่อผิด ๆ ที่พบบ่อย',
      'สิ่งที่ควรจำ',
    ],
    body1: 'ตั้งแต่สัปดาห์ที่ 6 หัวใจดวงน้อยก็เริ่มเต้นแล้ว ตลอดไตรมาสแรกนี้ อวัยวะสำคัญจะค่อย ๆ ก่อตัวขึ้น',
    tip1Title: 'ควรรู้',
    tip1Text: 'การเต้นของหัวใจทารกเป็นหนึ่งในสัญญาณแรกที่เห็นได้จากอัลตราซาวนด์ ซึ่งมักเป็นช่วงเวลาที่น่าจดจำในการดูแลครรภ์ของคุณ',
    body2: 'ราวสัปดาห์ที่ 20 โดยทั่วไปคุณจะรู้สึกถึงการเคลื่อนไหวครั้งแรกของทารก และเป็นช่วงที่ประสาทสัมผัสเริ่มพัฒนาด้วย',
    body3: 'ตั้งแต่ไตรมาสที่ 3 เป็นต้นไป ทารกจะน้ำหนักขึ้นอย่างรวดเร็วและค่อย ๆ เข้าสู่ท่าเตรียมคลอด',
    neutralText: 'จังหวะของพัฒนาการแตกต่างกันในทารกแต่ละคน: หมุดหมายเหล่านี้เป็นเพียงค่าเฉลี่ยทั่วไป',
    milestones: [
      'ตั้งแต่ 6 สัปดาห์: หัวใจเริ่มเต้น',
      'ราว 20 สัปดาห์: รู้สึกถึงการเคลื่อนไหวครั้งแรก',
      'ราว 24-26 สัปดาห์: การได้ยินพัฒนา',
      'ราว 28 สัปดาห์: ดวงตาค่อย ๆ เปิด',
    ],
    myths: [
      'ทารก “ได้ยินทุกอย่าง” ตั้งแต่แรก: การได้ยินไม่ได้พัฒนาจริงจังจนถึงไตรมาสที่ 2',
      'รูปร่างของหน้าท้องบอกเพศของทารก: ไม่มีหลักฐานทางวิทยาศาสตร์รองรับ',
      'ทารกที่ดิ้นเก่งย่อมแข็งแรงกว่า: ระดับการเคลื่อนไหวแตกต่างกันมากในทารกแต่ละคน',
    ],
    tip2Title: 'ควรรู้',
    tip2Text: 'พัฒนาการของทารกแต่ละขั้นมีจังหวะของตัวเอง การตรวจติดตามทางการแพทย์สม่ำเสมอช่วยยืนยันว่าทุกอย่างดำเนินไปตามปกติ',
    shareMessage: 'พัฒนาการของทารกในครรภ์ — AWA',
  },
  vi: {
    badge: 'THAI KỲ • SỰ PHÁT TRIỂN',
    title: 'Sự phát triển của em bé\ntrong bụng mẹ',
    metaDuration: '6 phút đọc',
    metaType: 'Bài viết',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Em bé của bạn lớn lên như thế nào, qua từng tam cá nguyệt.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Tam cá nguyệt thứ nhất: những ngày đầu',
      'Tam cá nguyệt thứ hai: các giác quan thức tỉnh',
      'Tam cá nguyệt thứ ba: chặng nước rút',
      'Các cột mốc chính trong nháy mắt',
      'Những lầm tưởng thường gặp',
      'Điều cần nhớ',
    ],
    body1: 'Ngay từ tuần thứ 6, một trái tim bé xíu đã bắt đầu đập. Trong suốt tam cá nguyệt thứ nhất này, các cơ quan chính dần hình thành.',
    tip1Title: 'Nên biết',
    tip1Text: 'Nhịp tim của em bé là một trong những dấu hiệu đầu tiên nhìn thấy được trên siêu âm, thường là một khoảnh khắc đáng nhớ trong quá trình thăm khám của bạn.',
    body2: 'Khoảng tuần thứ 20, bạn thường có thể cảm nhận những cử động đầu tiên của em bé. Đây cũng là lúc các giác quan bắt đầu phát triển.',
    body3: 'Từ tam cá nguyệt thứ 3 trở đi, em bé tăng cân nhanh và dần dần vào tư thế chuẩn bị cho cuộc sinh.',
    neutralText: 'Nhịp độ phát triển khác nhau ở mỗi em bé: những cột mốc này vẫn chỉ là mức trung bình chung.',
    milestones: [
      'Từ 6 tuần: tim bắt đầu đập',
      'Khoảng 20 tuần: cảm nhận được những cử động đầu tiên',
      'Khoảng 24-26 tuần: thính giác phát triển',
      'Khoảng 28 tuần: đôi mắt dần mở ra',
    ],
    myths: [
      'Em bé “nghe được mọi thứ” ngay từ đầu: thính giác thực sự chỉ phát triển từ tam cá nguyệt thứ 2',
      'Hình dạng bụng cho biết giới tính của em bé: không có bằng chứng khoa học nào ủng hộ điều này',
      'Em bé hay cử động thì chắc chắn khỏe mạnh hơn: mức độ hoạt động khác nhau rất nhiều giữa các em bé',
    ],
    tip2Title: 'Nên biết',
    tip2Text: 'Mỗi giai đoạn phát triển của em bé diễn ra theo nhịp riêng; các lần khám định kỳ giúp xác nhận mọi thứ đang tiến triển bình thường.',
    shareMessage: 'Sự phát triển của em bé trong bụng mẹ — AWA',
  },
  uz: {
    badge: 'HOMILADORLIK • RIVOJLANISH',
    title: 'Chaqalogʻingizning bachadondagi\nrivojlanishi',
    metaDuration: '6 daq oʻqish',
    metaType: 'Maqola',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Chaqalogʻingiz trimestrdan trimestrga qanday oʻsadi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Birinchi trimestr: dastlabki kunlar',
      'Ikkinchi trimestr: sezgilar uygʻonadi',
      'Uchinchi trimestr: yakuniy bosqich',
      'Asosiy bosqichlar bir qarashda',
      'Keng tarqalgan afsonalar',
      'Esda tutish kerak boʻlgan narsalar',
    ],
    body1: 'Hatto 6-haftadan boshlab kichkina yurak urishni boshlaydi. Bu birinchi trimestr davomida asosiy aʼzolar asta-sekin shakllanadi.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Chaqaloqning yurak urishi UZI da koʻrinadigan dastlabki belgilardan biri, koʻpincha parvarishingizdagi esda qolarli lahza.',
    body2: 'Taxminan 20-haftada odatda chaqaloqning dastlabki harakatlarini sezish mumkin. Aynan shu paytda sezgilar rivojlana boshlaydi.',
    body3: '3-trimestrdan boshlab chaqaloq tez vazn oladi va asta-sekin tugʻilish uchun holat egallaydi.',
    neutralText: 'Rivojlanish surʼati chaqaloqdan chaqaloqqa farq qiladi: bu bosqichlar umumiy oʻrtacha koʻrsatkichlar boʻlib qoladi.',
    milestones: [
      '6 haftadan: yurak urishni boshlaydi',
      'Taxminan 20 hafta: dastlabki harakatlar seziladi',
      'Taxminan 24-26 hafta: eshitish rivojlanadi',
      'Taxminan 28 hafta: koʻzlar asta-sekin ochiladi',
    ],
    myths: [
      'Chaqaloq boshidanoq “hamma narsani eshitadi”: eshitish aslida faqat 2-trimestrda rivojlanadi',
      'Qorin shakli chaqaloq jinsini koʻrsatadi: buni hech qanday ilmiy dalil tasdiqlamaydi',
      'Faol chaqaloq albatta sogʻlomroq: faollik darajasi chaqaloqdan chaqaloqqa juda farq qiladi',
    ],
    tip2Title: 'Bilish foydali',
    tip2Text: 'Chaqaloq rivojlanishining har bir bosqichi oʻz surʼatida kechadi; muntazam tibbiy tekshiruvlar hammasi normal rivojlanayotganini tasdiqlashga yordam beradi.',
    shareMessage: 'Chaqaloqning bachadondagi rivojlanishi — AWA',
  },
  az: {
    badge: 'HAMİLƏLİK • İNKİŞAF',
    title: 'Körpənizin bətndaxili\ninkişafı',
    metaDuration: '6 dəq oxu',
    metaType: 'Məqalə',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Körpəniz trimestrdən trimestrə necə böyüyür.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Birinci trimestr: ilk günlər',
      'İkinci trimestr: hisslər oyanır',
      'Üçüncü trimestr: son düzənlik',
      'Əsas mərhələlər bir baxışda',
      'Geniş yayılmış miflər',
      'Yadda saxlamalı məqamlar',
    ],
    body1: 'Daha 6-cı həftədən kiçik ürək artıq döyünməyə başlayır. Bu birinci trimestr ərzində əsas orqanlar tədricən formalaşır.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Körpənin ürək döyüntüsü ultrasəsdə görünən ilk əlamətlərdən biridir və çox vaxt qayğınızda yadda qalan anlardan biri olur.',
    body2: 'Təxminən 20-ci həftədə adətən körpənin ilk hərəkətlərini hiss edə bilərsiniz. Bu, həm də hisslərin inkişaf etməyə başladığı vaxtdır.',
    body3: '3-cü trimestrdən başlayaraq körpə sürətlə çəki yığır və tədricən doğuş üçün vəziyyət alır.',
    neutralText: 'İnkişaf tempi körpədən körpəyə dəyişir: bu mərhələlər ümumi ortalamalar olaraq qalır.',
    milestones: [
      '6 həftədən: ürək döyünməyə başlayır',
      'Təxminən 20 həftədə: ilk hərəkətlər hiss olunur',
      'Təxminən 24–26 həftədə: eşitmə inkişaf edir',
      'Təxminən 28 həftədə: gözlər tədricən açılır',
    ],
    myths: [
      'Körpə əvvəldən “hər şeyi eşidir”: eşitmə həqiqətən 2-ci trimestrdən əvvəl inkişaf etmir',
      'Qarının forması körpənin cinsini göstərir: bunu elmi sübut dəstəkləmir',
      'Aktiv körpə mütləq daha sağlamdır: aktivlik səviyyəsi körpədən körpəyə xeyli dəyişir',
    ],
    tip2Title: 'Bilmək faydalıdır',
    tip2Text: 'Körpənin inkişafının hər mərhələsi öz tempi ilə gedir; müntəzəm tibbi yoxlamalar hər şeyin normal getdiyini təsdiqləməyə kömək edir.',
    shareMessage: 'Körpənin bətndaxili inkişafı — AWA',
  },
  ka: {
    badge: 'ორსულობა • განვითარება',
    title: 'თქვენი ბავშვის განვითარება\nსაშვილოსნოში',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'სტატია',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'როგორ იზრდება თქვენი ბავშვი, ტრიმესტრიდან ტრიმესტრამდე.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'პირველი ტრიმესტრი: პირველი დღეები',
      'მეორე ტრიმესტრი: გრძნობის ორგანოები იღვიძებს',
      'მესამე ტრიმესტრი: ბოლო ეტაპი',
      'ძირითადი ეტაპები ერთი შეხედვით',
      'გავრცელებული მითები',
      'რა უნდა დაიმახსოვროთ',
    ],
    body1: 'უკვე მე-6 კვირიდან პატარა გული ფეთქვას იწყებს. ამ პირველი ტრიმესტრის განმავლობაში ძირითადი ორგანოები ეტაპობრივად ყალიბდება.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'ბავშვის გულისცემა ულტრაბგერაზე ერთ-ერთი პირველი თვალსაჩინო ნიშანია და ხშირად თქვენი მეთვალყურეობის დასამახსოვრებელი მომენტია.',
    body2: 'დაახლოებით მე-20 კვირას ბავშვის პირველი მოძრაობები, როგორც წესი, იგრძნობა. ამ დროს იწყება გრძნობის ორგანოების განვითარებაც.',
    body3: 'მესამე ტრიმესტრიდან ბავშვი სწრაფად იმატებს წონაში და ეტაპობრივად მშობიარობისთვის სათანადო მდგომარეობას იკავებს.',
    neutralText: 'განვითარების ტემპი ბავშვიდან ბავშვამდე განსხვავდება: ეს ეტაპები ზოგადი საშუალო მაჩვენებლებია.',
    milestones: [
      '6 კვირიდან: გული ფეთქვას იწყებს',
      'დაახლოებით 20 კვირას: იგრძნობა პირველი მოძრაობები',
      'დაახლოებით 24-26 კვირას: ვითარდება სმენა',
      'დაახლოებით 28 კვირას: თვალები ეტაპობრივად იხსნება',
    ],
    myths: [
      'ბავშვი თითქოს თავიდანვე „ყველაფერს ისმენს“: სმენა ნამდვილად მხოლოდ მეორე ტრიმესტრში ვითარდება',
      'მუცლის ფორმა ბავშვის სქესს გვაჩვენებს: ამას მეცნიერული მტკიცებულება არ ადასტურებს',
      'აქტიური ბავშვი აუცილებლად უფრო ჯანმრთელია: აქტიურობის დონე ბავშვიდან ბავშვამდე ძლიერ განსხვავდება',
    ],
    tip2Title: 'კარგია ვიცოდეთ',
    tip2Text: 'ბავშვის განვითარების ყოველი ეტაპი საკუთარი ტემპით მიმდინარეობს; რეგულარული სამედიცინო შემოწმება გვეხმარება დავრწმუნდეთ, რომ ყველაფერი ნორმალურად მიდის.',
    shareMessage: 'ბავშვის განვითარება საშვილოსნოში — AWA',
  },
  hy: {
    badge: 'ՀՂԻՈՒԹՅՈՒՆ • ԶԱՐԳԱՑՈՒՄ',
    title: 'Ձեր երեխայի զարգացումը\nարգանդում',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'Հոդված',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ինչպես է աճում ձեր երեխան՝ եռամսյակ առ եռամսյակ:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Առաջին եռամսյակ. առաջին օրերը',
      'Երկրորդ եռամսյակ. զգայարանները արթնանում են',
      'Երրորդ եռամսյակ. վերջին հատվածը',
      'Հիմնական նշաձողերը՝ մի հայացքով',
      'Տարածված առասպելներ',
      'Ինչ հիշել',
    ],
    body1: 'Արդեն 6-րդ շաբաթից փոքրիկ սիրտը սկսում է բաբախել: Այս առաջին եռամսյակի ընթացքում հիմնական օրգանները աստիճանաբար ձևավորվում են:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Երեխայի սրտի բաբախյունը ուլտրաձայնային հետազոտության առաջին տեսանելի նշաններից մեկն է, որը հաճախ հիշարժան պահ է ձեր հսկողության ընթացքում:',
    body2: 'Մոտ 20-րդ շաբաթում սովորաբար կարող եք զգալ երեխայի առաջին շարժումները: Սա նաև այն ժամանակն է, երբ սկսում են զարգանալ զգայարանները:',
    body3: 'Երրորդ եռամսյակից սկսած՝ երեխան արագ քաշ է հավաքում և աստիճանաբար տեղավորվում է ծննդաբերության դիրքում:',
    neutralText: 'Զարգացման տեմպը տարբերվում է մի երեխայից մյուսը. այս նշաձողերը մնում են ընդհանուր միջինային ցուցանիշներ:',
    milestones: [
      '6 շաբաթից. սիրտը սկսում է բաբախել',
      'Մոտ 20 շաբաթում. զգացվում են առաջին շարժումները',
      'Մոտ 24–26 շաբաթում. զարգանում է լսողությունը',
      'Մոտ 28 շաբաթում. աչքերը աստիճանաբար բացվում են',
    ],
    myths: [
      'Երեխան «լսում է ամեն ինչ» սկզբից. լսողությունը իրականում չի զարգանում մինչև երկրորդ եռամսյակ',
      'Փորի ձևը ցույց է տալիս երեխայի սեռը. դրա օգտին գիտական ապացույց չկա',
      'Ակտիվ երեխան անպայման ավելի առողջ է. ակտիվության մակարդակը խիստ տարբերվում է մի երեխայից մյուսը',
    ],
    tip2Title: 'Լավ է իմանալ',
    tip2Text: 'Երեխայի զարգացման յուրաքանչյուր փուլ ընթանում է իր տեմպով. կանոնավոր բժշկական հսկողությունը օգնում է հաստատել, որ ամեն ինչ նորմալ է ընթանում:',
    shareMessage: 'Երեխայի զարգացումը արգանդում — AWA',
  },
  tg: {
    badge: 'ҲОМИЛАДОРӢ • ИНКИШОФ',
    title: 'Инкишофи тифли шумо\nдар батн',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Мақола',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Тифли шумо чӣ тавр рушд мекунад, триместр ба триместр.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Триместри аввал: рӯзҳои аввал',
      'Триместри дуюм: ҳиссиёт бедор мешаванд',
      'Триместри севум: марҳилаи ниҳоӣ',
      'Нуқтаҳои асосии рушд дар як нигоҳ',
      'Афсонаҳои маъмул',
      'Чӣ бояд дар хотир дошт',
    ],
    body1: 'Аллакай аз ҳафтаи 6 дили хурдакак метапад. Дар давоми ин триместри аввал узвҳои асосӣ тадриҷан ташаккул меёбанд.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Набзи дили тифл яке аз аввалин нишонаҳои намоён дар ултрасадо аст ва аксар вақт лаҳзаи фаромӯшнашаванда мебошад.',
    body2: 'Тақрибан дар ҳафтаи 20 одатан аввалин ҳаракатҳои тифлро ҳис кардан мумкин аст. Ҳамин вақт ҳиссиёт низ инкишоф меёбанд.',
    body3: 'Аз триместри 3 тифл зуд вазн мегирад ва тадриҷан барои таваллуд ҷой мегирад.',
    neutralText: 'Суръати инкишоф дар ҳар тифл гуногун аст: ин нуқтаҳо танҳо ҳисоби миёнаи умумӣ мебошанд.',
    milestones: [
      'Аз ҳафтаи 6: дил метапад',
      'Тақрибан дар ҳафтаи 20: аввалин ҳаракатҳо ҳис мешаванд',
      'Тақрибан дар ҳафтаҳои 24-26: шунавоӣ инкишоф меёбад',
      'Тақрибан дар ҳафтаи 28: чашмҳо тадриҷан кушода мешаванд',
    ],
    myths: [
      'Тифл аз ибтидо «ҳама чизро мешунавад»: шунавоӣ дар асл то триместри 2 инкишоф намеёбад',
      'Шакли шикам ҷинси тифлро нишон медиҳад: ягон далели илмӣ ин фикрро тасдиқ намекунад',
      'Тифли фаъол ҳатман солимтар аст: сатҳи фаъолият дар тифлҳо хеле гуногун аст',
    ],
    tip2Title: 'Донистан хуб аст',
    tip2Text: 'Ҳар марҳилаи инкишофи тифл суръати худро дорад; санҷишҳои мунтазами тиббӣ кумак мекунанд, ки ҳама чиз муқаррарӣ пеш меравад.',
    shareMessage: 'Инкишофи тифл дар батн — AWA',
  },
  ky: {
    badge: 'КУРСАКТУУЛУК • ӨНҮГҮҮ',
    title: 'Ымыркайыңыздын жатындагы\nөнүгүшү',
    metaDuration: '6 мүн окуу',
    metaType: 'Макала',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Ымыркайыңыз триместрден триместрге кантип өсөт.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Биринчи триместр: алгачкы күндөр',
      'Экинчи триместр: сезим органдары ойгонот',
      'Үчүнчү триместр: акыркы бурулуш',
      'Негизги этаптар бир көз ирмемде',
      'Кеңири таралган жалган түшүнүктөр',
      'Эмнени эстен чыгарбоо керек',
    ],
    body1: 'Алгачкы 6-жумадан эле кичинекей жүрөк согуп баштайт. Бул биринчи триместрдин ичинде негизги органдар акырындап түзүлөт.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Ымыркайдын жүрөк согушу УЗИде көрүнгөн алгачкы белгилердин бири жана көбүнчө кам көрүүдө эсте калган учур болот.',
    body2: 'Болжол менен 20-жумада ымыркайдын алгачкы кыймылдарын сезсеңиз болот. Дал ушул мезгилде сезим органдары да өнүгө баштайт.',
    body3: '3-триместрден баштап ымыркай тез салмак алат жана төрөткө карата акырындап туура абалга келет.',
    neutralText: 'Өнүгүү ылдамдыгы ымыркайдан ымыркайга карата айырмаланат: бул этаптар жалпы орточо маанилер бойдон калат.',
    milestones: [
      '6-жумадан: жүрөк согуп баштайт',
      'Болжол менен 20-жумада: алгачкы кыймылдар сезилет',
      'Болжол менен 24–26-жумада: угуу өнүгөт',
      'Болжол менен 28-жумада: көздөр акырындап ачылат',
    ],
    myths: [
      'Ымыркай баштапкы мезгилден эле «бардыгын угат»: угуу чындыгында 2-триместрге чейин өнүкпөйт',
      'Курсактын формасы ымыркайдын жынысын көрсөтөт: муну илимий далил тастыктабайт',
      'Активдүү ымыркай сөзсүз дени сак: активдүүлүк деңгээли бир ымыркайдан экинчисине көп айырмаланат',
    ],
    tip2Title: 'Билүү пайдалуу',
    tip2Text: 'Ымыркайдын өнүгүшүнүн ар бир этабы өз темпинде өтөт; үзгүлтүксүз медициналык текшерүүлөр баары нормалдуу жүрүп жатканын тастыктоого жардам берет.',
    shareMessage: 'Ымыркайдын жатындагы өнүгүшү — AWA',
  },
  tk: {
    badge: 'GÖWRELILIK • ÖSÜŞ',
    title: 'Bäbegiňiziň ýatgydaky\nösüşi',
    metaDuration: '6 min okamak',
    metaType: 'Makala',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Bäbegiňiz trimestrden trimestre nähili ösýär.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Birinji trimestr: ilkinji günler',
      'Ikinji trimestr: duýgy agzalary oýanýar',
      'Üçünji trimestr: soňky burulyş',
      'Esasy tapgyrlar bir seretmekde',
      'Giňden ýaýran ýalňyş düşünjeler',
      'Nämäni ýatdan çykarmaly däl',
    ],
    body1: 'Takmynan 6-njy hepdeden başlap, kiçijik ýürek urup başlaýar. Bu birinji trimestriň dowamynda esasy agzalar ýuwaş-ýuwaşdan emele gelýär.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Bäbegiň ýürek urgusy UZI-de görünýän ilkinji alamatlaryň biri we köplenç ideg wagtynda ýatda galýan pursat bolýar.',
    body2: 'Takmynan 20-nji hepdede bäbegiň ilkinji hereketlerini duýup bilersiňiz. Dogry şu döwürde duýgy agzalary hem ösüp başlaýar.',
    body3: '3-nji trimestrden başlap bäbek çalt agram alýar we dogluşa taýýar ýagdaýa ýuwaş-ýuwaşdan geçýär.',
    neutralText: 'Ösüş çaltlygy bäbekden bäbege tapawutlanýar: bu tapgyrlar umumy ortaça bahalar bolup galýar.',
    milestones: [
      '6-njy hepdeden: ýürek urup başlaýar',
      'Takmynan 20-nji hepdede: ilkinji hereketler duýulýar',
      'Takmynan 24–26-njy hepdede: eşitmek ösýär',
      'Takmynan 28-nji hepdede: gözler ýuwaş-ýuwaşdan açylýar',
    ],
    myths: [
      'Bäbek başdan «hemmesini eşidýär»: eşitmek hakykatdan 2-nji trimestre çenli ösmeýär',
      'Garnyň görnüşi bäbegiň jynsyny görkezýär: muny ylmy delil tassyklamaýar',
      'Işjeň bäbek hökman has saglam: işjeňlik derejesi bäbekden bäbege köp tapawutlanýar',
    ],
    tip2Title: 'Bilmek peýdaly',
    tip2Text: 'Bäbegiň ösüşiniň her tapgyry öz ritminde geçýär; yzygiderli lukmançylyk barlaglary hemme zadyň adaty ýagdaýda gidýändigini tassyklamaga ýardam berýär.',
    shareMessage: 'Bäbegiň ýatgydaky ösüşi — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function BabyDevelopmentArticleScreen({
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

          <AwaText variant="titleSmall" style={styles.intro}>
            {content.intro}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>{content.contentsTitle}</AwaText>

            {content.topics.map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.contentNumber}>{index + 1}.</AwaText>
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
            2. {content.topics[1]}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body2}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            3. {content.topics[2]}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body3}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.neutralBox}>
            <MaterialDesignIcons
              name="information-outline"
              size={22}
              color={theme.colors.textMuted}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.neutralText}>
              {content.neutralText}
            </AwaText>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <View style={styles.daily}>
            {MILESTONE_ICONS.map((icon, index) => (
              <View key={content.milestones[index]} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>{content.milestones[index]}</AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.myths.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="close-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />

                <AwaText variant="bodySmall" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>6. {content.topics[5]}</AwaText>

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

      <ReadingControls articleId={ID} durationMinutes={6} scrollRef={scrollRef} />
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
  contentNumber: {width: 25},
  contentText: {flex: 1},
  h2: {
    marginTop: 24,
  },
  body: {marginTop: 8},
  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 4},
  neutralBox: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  neutralText: {flex: 1},
  daily: {marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  dailyItem: {
    width: '48.7%',
    minHeight: 108,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },
  dailyText: {
    marginTop: 8,
    textAlign: 'center',
  },
  checkList: {
    marginTop: 12,
    padding: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  checkText: {flex: 1},
  });
}
