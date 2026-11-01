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
  ms: {
    badge: 'KEHAMILAN • PERKEMBANGAN',
    title: 'Perkembangan bayi anda\ndalam rahim',
    metaDuration: '6 min bacaan',
    metaType: 'Artikel',
    metaLevel: 'Permulaan',
    metaValidated: 'Kandungan disemak',
    intro: 'Bagaimana bayi anda membesar, trimester demi trimester.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Trimester pertama: hari-hari awal',
      'Trimester kedua: deria mula berjaga',
      'Trimester ketiga: peringkat akhir',
      'Pencapaian utama sekilas pandang',
      'Mitos yang lazim',
      'Apa yang perlu diingat',
    ],
    body1: 'Seawal minggu ke-6, jantung yang kecil sudah mula berdenyut. Sepanjang trimester pertama ini, organ utama terbentuk secara beransur-ansur.',
    tip1Title: 'Elok diketahui',
    tip1Text: 'Degupan jantung bayi ialah salah satu tanda pertama yang kelihatan pada ultrasound, selalunya detik yang tidak dilupakan dalam penjagaan anda.',
    body2: 'Sekitar minggu ke-20, anda biasanya boleh merasai pergerakan pertama bayi. Ini juga masa deria mula berkembang.',
    body3: 'Mulai trimester ke-3, bayi bertambah berat dengan pantas dan beransur-ansur mengambil posisi untuk kelahiran.',
    neutralText: 'Kadar perkembangan berbeza dari seorang bayi ke seorang bayi: pencapaian ini kekal sebagai purata umum.',
    milestones: [
      'Mulai 6 minggu: jantung mula berdenyut',
      'Sekitar 20 minggu: pergerakan pertama dirasai',
      'Sekitar 24-26 minggu: pendengaran berkembang',
      'Sekitar 28 minggu: mata beransur-ansur terbuka',
    ],
    myths: [
      'Bayi “mendengar segala-galanya” sejak awal: pendengaran sebenarnya tidak berkembang sehingga trimester ke-2',
      'Bentuk perut menunjukkan jantina bayi: tiada bukti saintifik menyokong perkara ini',
      'Bayi yang aktif semestinya lebih sihat: tahap aktiviti sangat berbeza dari seorang bayi ke seorang bayi',
    ],
    tip2Title: 'Elok diketahui',
    tip2Text: 'Setiap peringkat perkembangan bayi mengikuti rentaknya sendiri; pemeriksaan perubatan yang tetap membantu mengesahkan bahawa semuanya berjalan seperti biasa.',
    shareMessage: 'Perkembangan bayi dalam rahim — AWA',
  },
  so: {
    badge: 'UUR • KORITAAN',
    title: 'Koritaanka ilmahaaga\nilmo-galeenka dhexdiisa',
    metaDuration: '6 daq akhris',
    metaType: 'Maqaal',
    metaLevel: 'Bilow',
    metaValidated: 'Macluumaad la dib-u-eegay',
    intro: 'Sida ilmahaagu u korayo, saddex-bille saddex-bille.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Saddex-billaha koowaad: maalmaha hore',
      'Saddex-billaha labaad: dareemuhu way toosaan',
      'Saddex-billaha saddexaad: tallaabadii ugu dambeysay',
      'Calaamadaha muhiimka ah hal mar',
      'Xaqiiqooyin been ah oo caan ah',
      'Waxa la xasuusto',
    ],
    body1: 'Laga bilaabo toddobaadka 6, wadne yar ayaa horey u bilaabaya inuu garaaco. Saddex-billahan koowaad gudahiisa, xubnaha ugu muhiimsan tartiib ayay u samaysmaan.',
    tip1Title: 'Waxtar leh in la ogaado',
    tip1Text: 'Garaaca wadnaha ilmuhu waa mid ka mid ah calaamadaha ugu horreeya ee muuqda ultrasaawnka, inta badan waa daqiiqad la xasuusto daryeelkaaga dhexdiisa.',
    body2: 'Qiyaastii toddobaadka 20, guud ahaan waxaad dareemi kartaa dhaqdhaqaaqyada ilmaha ugu horreeya. Tani waa sidoo kale marka dareemuhu bilaabmaan inay koraan.',
    body3: 'Laga bilaabo saddex-billaha 3aad, ilmuhu wuxuu si dhaqso ah miisaan u kasbadaa wuxuuna tartiib u galaa jagada dhalmada.',
    neutralText: 'Xawaaraha koritaanku wuu ku kala duwan yahay ilmo ilaa ilmo: calaamadahani waa celceliso guud oo keliya.',
    milestones: [
      'Laga bilaabo 6 toddobaad: wadnaha ayaa bilaabaya inuu garaaco',
      'Qiyaastii 20 toddobaad: dhaqdhaqaaqyadii ugu horreeyay ayaa la dareemaa',
      'Qiyaastii 24-26 toddobaad: maqalku wuu koraa',
      'Qiyaastii 28 toddobaad: indhuhu tartiib ayay u furmaan',
    ],
    myths: [
      'Ilmuhu “wax walba wuu maqlaa” bilowga: maqalku dhab ahaan ma koro ilaa saddex-billaha 2aad',
      'Qaabka calooshu wuxuu muujiyaa jinsiga ilmaha: caddayn sayniseed oo taas taageerta ma jirto',
      'Ilmo firfircoon waa inuu si dhab ah u caafimaad qabaa: heerka firfircoonidu aad ayuu ugu kala duwan yahay ilmo ilaa ilmo',
    ],
    tip2Title: 'Waxtar leh in la ogaado',
    tip2Text: 'Heer kasta oo koritaanka ilmaha ah wuxuu raacaa xawaarihiisa; baaritaannada caafimaad ee joogtada ahi waxay caawiyaan in la xaqiijiyo in wax walba caadi u socdaan.',
    shareMessage: 'Koritaanka ilmaha ilmo-galeenka dhexdiisa — AWA',
  },
  sw: {
    badge: 'UJAUZITO • UKUAJI',
    title: 'Ukuaji wa mtoto wako\ntumboni',
    metaDuration: 'Dakika 6 za kusoma',
    metaType: 'Makala',
    metaLevel: 'Mwanzo',
    metaValidated: 'Maudhui yaliyokaguliwa',
    intro: 'Jinsi mtoto wako anavyokua, trimesta kwa trimesta.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Trimesta ya kwanza: siku za mwanzo',
      'Trimesta ya pili: milango ya fahamu inaamka',
      'Trimesta ya tatu: hatua ya mwisho',
      'Hatua muhimu kwa muhtasari',
      'Imani potofu za kawaida',
      'Cha kukumbuka',
    ],
    body1: 'Kuanzia wiki ya 6, moyo mdogo tayari unaanza kupiga. Katika trimesta hii ya kwanza, viungo vikuu vinaundwa polepole.',
    tip1Title: 'Vyema kujua',
    tip1Text: 'Mapigo ya moyo ya mtoto ni mojawapo ya dalili za kwanza zinazoonekana kwenye ultrasound, mara nyingi ni wakati wa kukumbukwa katika huduma zako.',
    body2: 'Karibu na wiki ya 20, kwa kawaida unaweza kuhisi mienendo ya kwanza ya mtoto. Huu pia ndio wakati milango ya fahamu inaanza kukua.',
    body3: 'Kuanzia trimesta ya 3, mtoto anaongezeka uzito kwa kasi na polepole anajiweka katika mkao wa kuzaliwa.',
    neutralText: 'Kasi ya ukuaji hutofautiana kati ya mtoto na mtoto: hatua hizi muhimu zinabaki kuwa wastani wa jumla.',
    milestones: [
      'Kuanzia wiki 6: moyo unaanza kupiga',
      'Karibu na wiki 20: mienendo ya kwanza inahisiwa',
      'Karibu na wiki 24-26: kusikia kunakua',
      'Karibu na wiki 28: macho yanafunguka polepole',
    ],
    myths: [
      'Mtoto “husikia kila kitu” tangu mwanzo: kusikia hakukui kwa kweli hadi trimesta ya 2',
      'Umbo la tumbo linaonyesha jinsia ya mtoto: hakuna ushahidi wa kisayansi unaounga mkono hili',
      'Mtoto mchangamfu ni lazima awe na afya zaidi: kiwango cha shughuli hutofautiana sana kati ya mtoto na mtoto',
    ],
    tip2Title: 'Vyema kujua',
    tip2Text: 'Kila hatua ya ukuaji wa mtoto hufuata mwendo wake; ukaguzi wa mara kwa mara wa kitabibu husaidia kuthibitisha kuwa kila kitu kinaendelea kawaida.',
    shareMessage: 'Ukuaji wa mtoto tumboni — AWA',
  },
  kk: {
    badge: 'ЖҮКТІЛІК • ДАМУ',
    title: 'Нәрестеңіздің құрсақтағы\nдамуы',
    metaDuration: '6 мин оқу',
    metaType: 'Мақала',
    metaLevel: 'Бастауыш',
    metaValidated: 'Тексерілген мазмұн',
    intro: 'Нәрестеңіз триместрден триместрге қалай өсетіні.',
    contentsTitle: 'Осы мақалада',
    topics: [
      'Бірінші триместр: алғашқы күндер',
      'Екінші триместр: сезім мүшелері оянады',
      'Үшінші триместр: соңғы кезең',
      'Негізгі кезеңдерге шолу',
      'Жиі кездесетін қате пікірлер',
      'Нені есте сақтау керек',
    ],
    body1: 'Тіпті 6-шы аптадан бастап кішкентай жүрек соға бастайды. Осы бірінші триместр барысында негізгі ағзалар біртіндеп қалыптасады.',
    tip1Title: 'Білуге тиісті',
    tip1Text: 'Нәрестенің жүрек соғуы ультрадыбыстық зерттеуде көрінетін алғашқы белгілердің бірі, күтіміңіздегі есте қаларлық сәт болады.',
    body2: '20-шы аптаның айналасында әдетте нәрестенің алғашқы қозғалыстарын сезесіз. Сезім мүшелері де осы кезде дами бастайды.',
    body3: '3-ші триместрден бастап нәресте тез салмақ қосады және босану үшін біртіндеп қажетті қалыпқа келеді.',
    neutralText: 'Даму қарқыны әр нәрестеде әртүрлі: бұл белгілер жалпы орташа мәндер болып қала береді.',
    milestones: [
      '6 аптадан: жүрек соға бастайды',
      'Шамамен 20 аптада: алғашқы қозғалыстар сезіледі',
      'Шамамен 24-26 аптада: есту дамиды',
      'Шамамен 28 аптада: көздер біртіндеп ашылады',
    ],
    myths: [
      'Нәресте басынан бастап “бәрін естиді”: есту шын мәнінде 2-ші триместрге дейін дамымайды',
      'Іштің пішіні нәрестенің жынысын көрсетеді: оны растайтын ғылыми дәлел жоқ',
      'Белсенді нәресте міндетті түрде сау болады: белсенділік деңгейі нәрестеден нәрестеге айтарлықтай өзгереді',
    ],
    tip2Title: 'Білуге тиісті',
    tip2Text: 'Нәрестенің дамуының әр кезеңі өз қарқынымен жүреді; тұрақты медициналық тексерулер бәрінің қалыпты жүріп жатқанын растауға көмектеседі.',
    shareMessage: 'Нәрестенің құрсақтағы дамуы — AWA',
  },
  wo: {
    badge: 'ËMB • MÀGG',
    title: 'Màggug sa doom\nci biir',
    metaDuration: '6 simili jàng',
    metaType: 'Bind',
    metaLevel: 'Tàmbali',
    metaValidated: 'Mbind bu ñu seetlu',
    intro: 'Naka sa doom di màgg, trimestr ak trimestr.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Trimestr bu njëkk: fan yu njëkk',
      'Trimestr bu ñaareel: yaram di yewu',
      'Trimestr bu ñetteel: ñaar fuñ bu mujj',
      'Ñaar fuñ yu am solo ci benn xool',
      'Ay fen yu bari',
      'Li war a fàttaliku',
    ],
    body1: 'Ba ci ayu-bés 6, benn xol bu ndaw dafa tàmbali dóon. Ci trimestr bu njëkk bii, yaxu yu mag yi dañuy defaru tuuti-tuuti.',
    tip1Title: 'Lu baax a xam',
    tip1Text: 'Dóonug xolu doom bi benn ci màndarga yu njëkk yi ñuy gis ci ekografi, te daa nekk benn jamono ju ñuy fàtte ba abadan ci sa topp.',
    body2: 'Ci ayu-bés 20, daa jub nga dégg yëngu yu njëkk yu doom bi. Jamono jooju la yaram yi di tàmbali yewu.',
    body3: 'Ci trimestr bu ñetteel, doom bi dafay yokku yenn ci gaaw te di jël anam bu jur ci tuuti-tuuti.',
    neutralText: 'Ritmu màgg wuute na ci doom ak doom: ñaar fuñ yii digg-dóomu yu yaatu rekk lañu.',
    milestones: [
      'Ba ci 6 ayu-bés: xol bi tàmbali dóon',
      'Ci 20 ayu-bés: yëngu yu njëkk ñu ngi leen dégg',
      'Ci 24-26 ayu-bés: dégg di màgg',
      'Ci 28 ayu-bés: gën yi di ubbiku tuuti-tuuti',
    ],
    myths: [
      'Doom bi “dégg lépp” ba ci tàmbali: dégg du màgg ba trimestr bu ñaareel',
      'Wëñu biir bi wone sa doom: amul benn tabax xam-xam bu ko dëggal',
      'Doom bu yëngu lool gën a wér: yëngu wuute na lool ci doom ak doom',
    ],
    tip2Title: 'Lu baax a xam',
    tip2Text: 'Ñaar fuñ bu nekk ci màggug doom bi am na ritmam; seetlu yu doktoor yu sax dañuy dimbli ngir dëggal ne lépp ngi dem ni mu ware.',
    shareMessage: 'Màggug doom bi ci biir — AWA',
  },
  ha: {
    badge: 'CIKI • GIRMA',
    title: 'Girman jaririnki\na cikin mahaifa',
    metaDuration: 'karatun minti 6',
    metaType: 'Labari',
    metaLevel: 'Mafari',
    metaValidated: 'Abun da aka duba',
    intro: 'Yadda jaririnki ke girma, kashi bayan kashi.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Kashi na farko: kwanakin farko',
      'Kashi na biyu: hankula suna farkawa',
      'Kashi na uku: kusa da ƙarshe',
      'Muhimman matakai a kallo ɗaya',
      'Tatsuniyoyin da suka zama ruwan dare',
      'Abin da za a tuna',
    ],
    body1: 'Tun daga mako na 6, ƙaramar zuciya ta riga ta fara bugawa. A cikin wannan kashi na farko, muhimman sassan jiki suna samuwa a hankali.',
    tip1Title: 'Abin da ya kamata ki sani',
    tip1Text: 'Bugun zuciyar jariri yana daga cikin alamomin farko da ake gani a ultrasound, galibi lokaci ne da ba a mantawa da shi a kulawarki.',
    body2: 'A kusa da mako na 20, yawanci ana jin motsin jariri na farko. A wannan lokaci ne hankula ke fara girma.',
    body3: 'Daga kashi na 3, jariri yana ƙara nauyi da sauri kuma yana ɗaukar matsayi don haihuwa a hankali.',
    neutralText: 'Saurin girma ya bambanta daga jariri zuwa jariri: waɗannan matakai matsakaici ne na gaba ɗaya.',
    milestones: [
      'Daga makonni 6: zuciya ta fara bugawa',
      'A kusa da makonni 20: ana jin motsi na farko',
      'A kusa da makonni 24-26: ji yana girma',
      'A kusa da makonni 28: idanu suna buɗewa a hankali',
    ],
    myths: [
      'Jariri “yana jin komai” tun farko: ji ba ya girma sosai sai kashi na biyu',
      'Siffar ciki tana nuna jinsin jariri: babu wata hujjar kimiyya da ke goyon bayan haka',
      'Jariri mai motsi sosai ya fi lafiya: yawan motsi ya bambanta sosai daga jariri zuwa jariri',
    ],
    tip2Title: 'Abin da ya kamata ki sani',
    tip2Text: 'Kowane mataki na girman jariri yana da saurinsa; duba lafiya akai-akai yana taimakawa tabbatar cewa komai yana tafiya yadda ya kamata.',
    shareMessage: 'Girman jariri a cikin mahaifa — AWA',
  },
  am: {
    badge: 'እርግዝና • እድገት',
    title: 'የሕፃንሽ እድገት\nበማህፀን ውስጥ',
    metaDuration: '6 ደቂቃ ንባብ',
    metaType: 'ጽሑፍ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'የተረጋገጠ ይዘት',
    intro: 'ሕፃንሽ እንዴት እንደሚያድግ፣ ሶስት ወር ከሶስት ወር።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'የመጀመሪያው ሶስት ወር፦ የመጀመሪያዎቹ ቀናት',
      'ሁለተኛው ሶስት ወር፦ ስሜት ህዋሳት ይነቃሉ',
      'ሶስተኛው ሶስት ወር፦ የመጨረሻው ርቀት',
      'ዋና ዋና ደረጃዎች በአንድ እይታ',
      'የተለመዱ አፈ ታሪኮች',
      'ማስታወስ ያለብሽ',
    ],
    body1: 'ከሳምንት 6 ጀምሮ ትንሽ ልብ መምታት ይጀምራል። በዚህ የመጀመሪያ ሶስት ወር ዋና ዋና አካላት ቀስ በቀስ ይፈጠራሉ።',
    tip1Title: 'ማወቅ ጠቃሚ ነው',
    tip1Text: 'የሕፃኑ የልብ ምት በአልትራሳውንድ ላይ ከሚታዩ የመጀመሪያ ምልክቶች አንዱ ሲሆን፣ ብዙ ጊዜ በእንክብካቤሽ ውስጥ የማይረሳ ጊዜ ነው።',
    body2: 'በሳምንት 20 አካባቢ፣ የሕፃኑን የመጀመሪያ እንቅስቃሴዎች ብዙውን ጊዜ መስማት ትችያለሽ። ስሜት ህዋሳት ማደግ የሚጀምሩትም በዚህ ጊዜ ነው።',
    body3: 'ከ3ኛው ሶስት ወር ጀምሮ ሕፃኑ በፍጥነት ክብደት ይጨምራል እና ለወሊድ ቀስ በቀስ ቦታውን ይይዛል።',
    neutralText: 'የእድገት ፍጥነት ከሕፃን ወደ ሕፃን ይለያያል፦ እነዚህ ደረጃዎች አጠቃላይ አማካዮች ናቸው።',
    milestones: [
      'ከ6 ሳምንታት ጀምሮ፦ ልብ መምታት ይጀምራል',
      'በ20 ሳምንታት አካባቢ፦ የመጀመሪያ እንቅስቃሴዎች ይሰማሉ',
      'በ24-26 ሳምንታት አካባቢ፦ ጆሮ መስማት ያድጋል',
      'በ28 ሳምንታት አካባቢ፦ ዓይኖች ቀስ በቀስ ይከፈታሉ',
    ],
    myths: [
      'ሕፃኑ ከጅምሩ “ሁሉን ይሰማል”፦ መስማት እስከ 2ኛው ሶስት ወር ድረስ በትክክል አያድግም',
      'የሆድ ቅርጽ የሕፃኑን ጾታ ያመለክታል፦ ይህን የሚደግፍ ሳይንሳዊ ማስረጃ የለም',
      'ንቁ ሕፃን የግድ ጤናማ ነው፦ የእንቅስቃሴ መጠን ከሕፃን ወደ ሕፃን በጣም ይለያያል',
    ],
    tip2Title: 'ማወቅ ጠቃሚ ነው',
    tip2Text: 'እያንዳንዱ የሕፃኑ እድገት ደረጃ የራሱን ፍጥነት ይከተላል፤ መደበኛ የሕክምና ምርመራዎች ሁሉም ነገር በመደበኛ እየሄደ መሆኑን ለማረጋገጥ ይረዳሉ።',
    shareMessage: 'የሕፃን እድገት በማህፀን ውስጥ — AWA',
  },
  nl: {
    badge: 'ZWANGERSCHAP • ONTWIKKELING',
    title: 'De ontwikkeling van je baby\nin de baarmoeder',
    metaDuration: '6 min lezen',
    metaType: 'Artikel',
    metaLevel: 'Beginner',
    metaValidated: 'Gecontroleerde inhoud',
    intro: 'Hoe je baby groeit, trimester voor trimester.',
    contentsTitle: 'In dit artikel',
    topics: [
      'Het eerste trimester: de eerste dagen',
      'Het tweede trimester: de zintuigen ontwaken',
      'Het derde trimester: de laatste loodjes',
      'Belangrijke mijlpalen in één oogopslag',
      'Veelvoorkomende mythen',
      'Wat je moet onthouden',
    ],
    body1: 'Al vanaf week 6 begint een klein hartje te kloppen. In de loop van dit eerste trimester vormen zich geleidelijk de belangrijkste organen.',
    tip1Title: 'Goed om te weten',
    tip1Text: 'Het hartje van de baby is een van de eerste zichtbare tekenen op de echo, vaak een gedenkwaardig moment tijdens je zorgtraject.',
    body2: 'Rond week 20 voel je meestal de eerste bewegingen van de baby. Dit is ook het moment waarop de zintuigen zich beginnen te ontwikkelen.',
    body3: 'Vanaf het 3e trimester komt de baby snel aan in gewicht en neemt geleidelijk de positie voor de bevalling in.',
    neutralText: 'Het tempo van de ontwikkeling verschilt van baby tot baby: deze mijlpalen blijven algemene gemiddelden.',
    milestones: [
      'Vanaf 6 weken: het hart begint te kloppen',
      'Rond 20 weken: eerste bewegingen voelbaar',
      'Rond 24-26 weken: het gehoor ontwikkelt zich',
      'Rond 28 weken: de ogen gaan geleidelijk open',
    ],
    myths: [
      'De baby “hoort alles” vanaf het begin: het gehoor ontwikkelt zich pas echt in het 2e trimester',
      'De vorm van de buik verraadt het geslacht van de baby: hiervoor bestaat geen wetenschappelijk bewijs',
      'Een actieve baby is per se gezonder: de mate van activiteit verschilt sterk van baby tot baby',
    ],
    tip2Title: 'Goed om te weten',
    tip2Text: 'Elke fase van de ontwikkeling van de baby verloopt in zijn eigen tempo; regelmatige medische controles helpen bevestigen dat alles normaal verloopt.',
    shareMessage: 'Ontwikkeling van de baby in de baarmoeder — AWA',
  },
  fi: {
    badge: 'RASKAUS • KEHITYS',
    title: 'Vauvasi kehitys\nkohdussa',
    metaDuration: '6 min lukuaika',
    metaType: 'Artikkeli',
    metaLevel: 'Aloittelija',
    metaValidated: 'Tarkistettu sisältö',
    intro: 'Miten vauvasi kasvaa kolmannes kolmanneksen jälkeen.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Ensimmäinen kolmannes: ensimmäiset päivät',
      'Toinen kolmannes: aistit heräävät',
      'Kolmas kolmannes: loppusuora',
      'Tärkeimmät virstanpylväät yhdellä silmäyksellä',
      'Yleiset myytit',
      'Mitä muistaa',
    ],
    body1: 'Jo viikosta 6 alkaen pieni sydän alkaa lyödä. Tämän ensimmäisen kolmanneksen aikana tärkeimmät elimet muodostuvat vähitellen.',
    tip1Title: 'Hyvä tietää',
    tip1Text: 'Vauvan sydämenlyönnit ovat yksi ensimmäisistä ultraäänessä näkyvistä merkeistä, ja se on usein mieleenpainuva hetki seurannassasi.',
    body2: 'Noin viikolla 20 voit yleensä tuntea vauvan ensimmäiset liikkeet. Tällöin myös aistit alkavat kehittyä.',
    body3: 'Kolmannesta kolmanneksesta alkaen vauva kasvaa nopeasti ja asettuu vähitellen syntymäasentoon.',
    neutralText: 'Kehityksen tahti vaihtelee vauvasta toiseen: nämä virstanpylväät ovat vain yleisiä keskiarvoja.',
    milestones: [
      'Viikosta 6: sydän alkaa lyödä',
      'Noin viikolla 20: ensimmäiset liikkeet tuntuvat',
      'Noin viikoilla 24–26: kuulo kehittyy',
      'Noin viikolla 28: silmät aukeavat vähitellen',
    ],
    myths: [
      'Vauva “kuulee kaiken” alusta asti: kuulo ei oikeastaan kehity ennen toista kolmannesta',
      'Vatsan muoto kertoo vauvan sukupuolen: tälle ei ole tieteellistä näyttöä',
      'Vilkas vauva on välttämättä terveempi: aktiivisuus vaihtelee suuresti vauvasta toiseen',
    ],
    tip2Title: 'Hyvä tietää',
    tip2Text: 'Vauvan kehityksen jokainen vaihe etenee omaa tahtiaan; säännölliset lääkärintarkastukset auttavat varmistamaan, että kaikki etenee normaalisti.',
    shareMessage: 'Vauvan kehitys kohdussa — AWA',
  },
  el: {
    badge: 'ΕΓΚΥΜΟΣΥΝΗ • ΑΝΑΠΤΥΞΗ',
    title: 'Η ανάπτυξη του μωρού σου\nστη μήτρα',
    metaDuration: '6 λεπτά ανάγνωσης',
    metaType: 'Άρθρο',
    metaLevel: 'Αρχάριο',
    metaValidated: 'Ελεγμένο περιεχόμενο',
    intro: 'Πώς μεγαλώνει το μωρό σου, τρίμηνο με το τρίμηνο.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Το πρώτο τρίμηνο: οι πρώτες ημέρες',
      'Το δεύτερο τρίμηνο: οι αισθήσεις ξυπνούν',
      'Το τρίτο τρίμηνο: η τελική ευθεία',
      'Βασικά ορόσημα με μια ματιά',
      'Συχνοί μύθοι',
      'Τι να θυμάσαι',
    ],
    body1: 'Ήδη από την 6η εβδομάδα, μια μικροσκοπική καρδιά αρχίζει να χτυπά. Στη διάρκεια αυτού του πρώτου τριμήνου, τα κύρια όργανα σχηματίζονται σταδιακά.',
    tip1Title: 'Καλό είναι να γνωρίζεις',
    tip1Text: 'Ο καρδιακός παλμός του μωρού είναι ένα από τα πρώτα ορατά σημάδια στο υπερηχογράφημα, συχνά μια αξέχαστη στιγμή της παρακολούθησής σου.',
    body2: 'Γύρω στην 20ή εβδομάδα, συνήθως μπορείς να νιώσεις τις πρώτες κινήσεις του μωρού. Τότε αρχίζουν επίσης να αναπτύσσονται οι αισθήσεις.',
    body3: 'Από το 3ο τρίμηνο και μετά, το μωρό παίρνει γρήγορα βάρος και σταδιακά παίρνει θέση για τον τοκετό.',
    neutralText: 'Ο ρυθμός ανάπτυξης διαφέρει από μωρό σε μωρό: αυτά τα ορόσημα παραμένουν γενικοί μέσοι όροι.',
    milestones: [
      'Από τις 6 εβδομάδες: η καρδιά αρχίζει να χτυπά',
      'Γύρω στις 20 εβδομάδες: νιώθονται οι πρώτες κινήσεις',
      'Γύρω στις 24-26 εβδομάδες: αναπτύσσεται η ακοή',
      'Γύρω στις 28 εβδομάδες: τα μάτια ανοίγουν σταδιακά',
    ],
    myths: [
      'Το μωρό «ακούει τα πάντα» από την αρχή: η ακοή δεν αναπτύσσεται πραγματικά πριν το 2ο τρίμηνο',
      'Το σχήμα της κοιλιάς δείχνει το φύλο του μωρού: καμία επιστημονική απόδειξη δεν το στηρίζει',
      'Ένα δραστήριο μωρό είναι αναγκαστικά πιο υγιές: το επίπεδο δραστηριότητας διαφέρει πολύ από μωρό σε μωρό',
    ],
    tip2Title: 'Καλό είναι να γνωρίζεις',
    tip2Text: 'Κάθε στάδιο της ανάπτυξης του μωρού ακολουθεί τον δικό του ρυθμό· οι τακτικοί ιατρικοί έλεγχοι βοηθούν να επιβεβαιωθεί ότι όλα εξελίσσονται φυσιολογικά.',
    shareMessage: 'Η ανάπτυξη του μωρού στη μήτρα — AWA',
  },
  fil: {
    badge: 'PAGBUBUNTIS • PAG-UNLAD',
    title: 'Ang pag-unlad ng iyong sanggol\nsa sinapupunan',
    metaDuration: '6 min na babasahin',
    metaType: 'Artikulo',
    metaLevel: 'Baguhan',
    metaValidated: 'Sinuring nilalaman',
    intro: 'Paano lumalaki ang iyong sanggol, trimester kada trimester.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Ang unang trimester: ang mga unang araw',
      'Ang ikalawang trimester: nagigising ang mga pandama',
      'Ang ikatlong trimester: ang huling hakbang',
      'Mahahalagang yugto sa isang sulyap',
      'Mga karaniwang maling akala',
      'Ang dapat tandaan',
    ],
    body1: 'Mula pa lamang sa ika-6 na linggo, nagsisimula nang tumibok ang isang napakaliit na puso. Sa unang trimester na ito, unti-unting nabubuo ang mga pangunahing organo.',
    tip1Title: 'Mabuting malaman',
    tip1Text: 'Ang tibok ng puso ng sanggol ay isa sa mga unang nakikitang senyales sa ultrasound, madalas isang di-malilimutang sandali sa iyong pangangalaga.',
    body2: 'Sa paligid ng ika-20 linggo, karaniwang mararamdaman mo na ang mga unang galaw ng sanggol. Ito rin ang panahon kung kailan nagsisimulang umunlad ang mga pandama.',
    body3: 'Mula sa ika-3 trimester, mabilis na tumataba ang sanggol at unti-unting pumuposisyon para sa panganganak.',
    neutralText: 'Nag-iiba ang bilis ng pag-unlad sa bawat sanggol: pangkalahatang karaniwan lamang ang mga yugtong ito.',
    milestones: [
      'Mula sa 6 na linggo: nagsisimulang tumibok ang puso',
      'Sa paligid ng 20 linggo: nararamdaman ang mga unang galaw',
      'Sa paligid ng 24-26 linggo: umuunlad ang pandinig',
      'Sa paligid ng 28 linggo: unti-unting dumidilat ang mga mata',
    ],
    myths: [
      'Naririnig ng sanggol ang lahat mula sa simula: hindi talaga umuunlad ang pandinig hanggang sa ika-2 trimester',
      'Ipinapakita ng hugis ng tiyan ang kasarian ng sanggol: walang siyentipikong ebidensya na sumusuporta rito',
      'Mas malusog ang aktibong sanggol: malaki ang pagkakaiba ng antas ng aktibidad sa bawat sanggol',
    ],
    tip2Title: 'Mabuting malaman',
    tip2Text: 'May sariling bilis ang bawat yugto ng pag-unlad ng sanggol; nakakatulong ang regular na medikal na pagsusuri para tiyaking normal ang lahat ng pag-usad.',
    shareMessage: 'Ang pag-unlad ng sanggol sa sinapupunan — AWA',
  },
  ta: {
    badge: 'கர்ப்பம் • வளர்ச்சி',
    title: 'கருப்பையில் உங்கள் குழந்தையின்\nவளர்ச்சி',
    metaDuration: '6 நிமிடம் படிக்க',
    metaType: 'கட்டுரை',
    metaLevel: 'தொடக்க நிலை',
    metaValidated: 'சரிபார்க்கப்பட்ட உள்ளடக்கம்',
    intro: 'மும்மாதம் மும்மாதமாக உங்கள் குழந்தை எப்படி வளர்கிறது.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      'முதல் மும்மாதம்: தொடக்க நாட்கள்',
      'இரண்டாம் மும்மாதம்: புலன்கள் விழிக்கின்றன',
      'மூன்றாம் மும்மாதம்: இறுதிக் கட்டம்',
      'முக்கிய மைல்கற்கள் ஒரே பார்வையில்',
      'பொதுவான தவறான நம்பிக்கைகள்',
      'நினைவில் கொள்ள வேண்டியவை',
    ],
    body1: '6-ஆம் வாரத்திலிருந்தே, ஒரு சிறிய இதயம் துடிக்கத் தொடங்குகிறது. இந்த முதல் மும்மாதத்தில், முக்கிய உறுப்புகள் படிப்படியாக உருவாகின்றன.',
    tip1Title: 'தெரிந்துகொள்ளுங்கள்',
    tip1Text: 'குழந்தையின் இதயத் துடிப்பு அல்ட்ராசவுண்டில் தெரியும் முதல் அறிகுறிகளில் ஒன்று, பெரும்பாலும் உங்கள் பராமரிப்பில் நினைவில் நிற்கும் ஒரு தருணம்.',
    body2: 'ஏறக்குறைய 20-ஆம் வாரத்தில், குழந்தையின் முதல் அசைவுகளை பொதுவாக உணரலாம். இந்தக் காலத்தில்தான் புலன்களும் வளரத் தொடங்குகின்றன.',
    body3: 'மூன்றாம் மும்மாதத்திலிருந்து, குழந்தை விரைவாக எடை கூடுகிறது, படிப்படியாகப் பிறப்புக்கான நிலைக்கு வருகிறது.',
    neutralText: 'வளர்ச்சியின் வேகம் ஒரு குழந்தையிலிருந்து மற்றொன்றுக்கு மாறுபடும்: இந்த மைல்கற்கள் பொதுவான சராசரிகளாகவே இருக்கும்.',
    milestones: [
      '6 வாரங்களிலிருந்து: இதயம் துடிக்கத் தொடங்குகிறது',
      'ஏறக்குறைய 20 வாரங்களில்: முதல் அசைவுகள் உணரப்படுகின்றன',
      'ஏறக்குறைய 24-26 வாரங்களில்: செவித்திறன் வளர்கிறது',
      'ஏறக்குறைய 28 வாரங்களில்: கண்கள் படிப்படியாகத் திறக்கின்றன',
    ],
    myths: [
      'குழந்தை தொடக்கத்திலிருந்தே “எல்லாவற்றையும் கேட்கிறது”: செவித்திறன் உண்மையில் 2-ஆம் மும்மாதம் வரை வளர்வதில்லை',
      'வயிற்றின் வடிவம் குழந்தையின் பாலினத்தைக் காட்டுகிறது: இதற்கு அறிவியல் சான்று எதுவும் இல்லை',
      'சுறுசுறுப்பான குழந்தை கட்டாயம் அதிக ஆரோக்கியமானது: செயல்பாட்டு அளவு ஒரு குழந்தையிலிருந்து மற்றொன்றுக்கு மிகவும் மாறுபடும்',
    ],
    tip2Title: 'தெரிந்துகொள்ளுங்கள்',
    tip2Text: 'குழந்தையின் வளர்ச்சியின் ஒவ்வொரு கட்டமும் தன் சொந்த வேகத்தைப் பின்பற்றுகிறது; அனைத்தும் இயல்பாக முன்னேறுகிறது என்பதை உறுதிப்படுத்த, தொடர்ந்த மருத்துவப் பரிசோதனைகள் உதவுகின்றன.',
    shareMessage: 'கருப்பையில் குழந்தையின் வளர்ச்சி — AWA',
  },
  te: {
    badge: 'గర్భం • ఎదుగుదల',
    title: 'గర్భంలో మీ శిశువు\nఎదుగుదల',
    metaDuration: '6 నిమిషాల పఠనం',
    metaType: 'వ్యాసం',
    metaLevel: 'ప్రారంభ స్థాయి',
    metaValidated: 'మదింపు చేసిన కంటెంట్',
    intro: 'త్రైమాసికం తర్వాత త్రైమాసికం మీ శిశువు ఎలా ఎదుగుతుంది.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      'మొదటి త్రైమాసికం: ప్రారంభ రోజులు',
      'రెండవ త్రైమాసికం: ఇంద్రియాలు మేల్కొంటాయి',
      'మూడవ త్రైమాసికం: చివరి దశ',
      'ముఖ్య మైలురాళ్లు ఒక్క చూపులో',
      'సాధారణ అపోహలు',
      'గుర్తుంచుకోవాల్సినవి',
    ],
    body1: '6వ వారం నుండే ఒక చిన్న గుండె ఇప్పటికే కొట్టుకోవడం మొదలుపెడుతుంది. ఈ మొదటి త్రైమాసికంలో ప్రధాన అవయవాలు క్రమంగా ఏర్పడతాయి.',
    tip1Title: 'తెలుసుకోవాల్సినవి',
    tip1Text: 'శిశువు గుండె చప్పుడు అల్ట్రాసౌండ్‌లో కనిపించే మొదటి సంకేతాల్లో ఒకటి, మీ గర్భ పరీక్షల్లో తరచుగా గుర్తుండిపోయే క్షణం.',
    body2: '20వ వారం చుట్టూ, మీరు సాధారణంగా శిశువు మొదటి కదలికలను అనుభవించవచ్చు. ఇప్పుడే ఇంద్రియాలు కూడా వికసించడం మొదలవుతుంది.',
    body3: 'మూడవ త్రైమాసికం నుండి, శిశువు వేగంగా బరువు పెరుగుతుంది, ప్రసవానికి క్రమంగా సరైన స్థితిలోకి వస్తుంది.',
    neutralText: 'ఎదుగుదల వేగం ఒక శిశువు నుండి మరొక శిశువుకు మారుతుంది: ఈ మైలురాళ్లు సాధారణ సగటులుగానే ఉంటాయి.',
    milestones: [
      '6 వారాల నుండి: గుండె కొట్టుకోవడం మొదలవుతుంది',
      'సుమారు 20 వారాలు: మొదటి కదలికలు అనుభవంలోకి వస్తాయి',
      'సుమారు 24-26 వారాలు: వినికిడి వికసిస్తుంది',
      'సుమారు 28 వారాలు: కళ్లు క్రమంగా తెరుచుకుంటాయి',
    ],
    myths: [
      'శిశువు మొదటి నుండి “అన్నీ వింటుంది”: వినికిడి నిజంగా రెండవ త్రైమాసికం వరకు వికసించదు',
      'పొట్ట ఆకారం శిశువు లింగాన్ని సూచిస్తుంది: దీనికి శాస్త్రీయ ఆధారాలు లేవు',
      'చురుకైన శిశువు తప్పనిసరిగా ఎక్కువ ఆరోగ్యంగా ఉంటుంది: కార్యకలాప స్థాయి ఒక శిశువు నుండి మరొక శిశువుకు చాలా మారుతుంది',
    ],
    tip2Title: 'తెలుసుకోవాల్సినవి',
    tip2Text: 'శిశువు ఎదుగుదలలోని ప్రతి దశ తన సొంత వేగాన్ని అనుసరిస్తుంది; క్రమమైన వైద్య పరీక్షలు అన్నీ సాధారణంగా పురోగమిస్తున్నాయని నిర్ధారించడానికి సహాయపడతాయి.',
    shareMessage: 'గర్భంలో శిశువు ఎదుగుదల — AWA',
  },
  mr: {
    badge: 'गर्भारपण • विकास',
    title: 'गर्भाशयात तुमच्या\nबाळाचा विकास',
    metaDuration: '6 मिनिटे वाचन',
    metaType: 'लेख',
    metaLevel: 'प्रारंभ स्तर',
    metaValidated: 'पुनरावलोकन केलेला मजकूर',
    intro: 'तुमचे बाळ तिमाहीमागून तिमाही कसे वाढते.',
    contentsTitle: 'या लेखात',
    topics: [
      'पहिली तिमाही: सुरुवातीचे दिवस',
      'दुसरी तिमाही: इंद्रिये जागी होतात',
      'तिसरी तिमाही: शेवटचा टप्पा',
      'महत्त्वाचे टप्पे एका नजरेत',
      'सामान्य गैरसमज',
      'लक्षात ठेवायचे',
    ],
    body1: 'आठव्या आठवड्याआधीच, म्हणजे सुमारे 6व्या आठवड्यापासून, एक छोटेसे हृदय धडधडू लागते. या पहिल्या तिमाहीत मुख्य अवयव हळूहळू तयार होतात.',
    tip1Title: 'हे जाणून घ्या',
    tip1Text: 'बाळाचे हृदयाचे ठोके सोनोग्राफीवर दिसणाऱ्या पहिल्या खुणांपैकी एक आहेत, आणि तुमच्या देखरेखीतील तो बहुतेकदा एक अविस्मरणीय क्षण असतो.',
    body2: 'सुमारे 20व्या आठवड्यात तुम्हाला साधारणपणे बाळाच्या पहिल्या हालचाली जाणवतात. याच वेळी इंद्रियांचा विकास सुरू होतो.',
    body3: 'तिसऱ्या तिमाहीपासून बाळाचे वजन झपाट्याने वाढते आणि प्रसूतीसाठी ते हळूहळू योग्य स्थितीत येते.',
    neutralText: 'विकासाची गती एका बाळापासून दुसऱ्या बाळापर्यंत वेगळी असते: हे टप्पे सर्वसाधारण सरासरीच राहतात.',
    milestones: [
      '6 आठवड्यांपासून: हृदय धडधडू लागते',
      'सुमारे 20 आठवडे: पहिल्या हालचाली जाणवतात',
      'सुमारे 24-26 आठवडे: श्रवणशक्ती विकसित होते',
      'सुमारे 28 आठवडे: डोळे हळूहळू उघडतात',
    ],
    myths: [
      'बाळाला सुरुवातीपासूनच “सर्व काही ऐकू येते”: श्रवणशक्ती खरेतर दुसऱ्या तिमाहीपर्यंत विकसित होत नाही',
      'पोटाचा आकार बाळाचे लिंग दर्शवतो: याला कोणताही वैज्ञानिक आधार नाही',
      'जास्त हालचाल करणारे बाळ अधिक निरोगी असतेच: हालचालीची पातळी एका बाळापासून दुसऱ्यापर्यंत खूप बदलते',
    ],
    tip2Title: 'हे जाणून घ्या',
    tip2Text: 'बाळाच्या विकासाचा प्रत्येक टप्पा स्वतःच्या गतीने पुढे जातो; नियमित वैद्यकीय तपासण्या सर्व काही सामान्यपणे सुरू असल्याची खात्री करण्यास मदत करतात.',
    shareMessage: 'गर्भाशयात बाळाचा विकास — AWA',
  },
  gu: {
    badge: 'ગર્ભાવસ્થા • વિકાસ',
    title: 'ગર્ભમાં તમારા બાળકનો\nવિકાસ',
    metaDuration: '6 મિનિટ વાંચન',
    metaType: 'લેખ',
    metaLevel: 'પ્રારંભિક સ્તર',
    metaValidated: 'પુનરાવલોકન કરેલી સામગ્રી',
    intro: 'તમારું બાળક ત્રિમાસિક પછી ત્રિમાસિક કેવી રીતે વિકસે છે.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      'પ્રથમ ત્રિમાસિક: શરૂઆતના દિવસો',
      'બીજું ત્રિમાસિક: ઇન્દ્રિયો જાગે છે',
      'ત્રીજું ત્રિમાસિક: અંતિમ તબક્કો',
      'મુખ્ય સીમાચિહ્નો એક નજરમાં',
      'સામાન્ય ગેરમાન્યતાઓ',
      'શું યાદ રાખવું',
    ],
    body1: 'છઠ્ઠા અઠવાડિયાથી જ એક નાનકડું હૃદય ધબકવા લાગે છે. આ પ્રથમ ત્રિમાસિક દરમિયાન મુખ્ય અવયવો ધીમે ધીમે બને છે.',
    tip1Title: 'જાણવા જેવું',
    tip1Text: 'બાળકના હૃદયના ધબકારા સોનોગ્રાફીમાં દેખાતા પ્રથમ સંકેતોમાંના એક છે, અને તમારી સંભાળ દરમિયાન ઘણી વાર એ યાદગાર ક્ષણ બની રહે છે.',
    body2: 'લગભગ 20મા અઠવાડિયે તમે સામાન્ય રીતે બાળકની પહેલી હલનચલન અનુભવી શકો છો. આ જ સમયે ઇન્દ્રિયોનો વિકાસ શરૂ થાય છે.',
    body3: 'ત્રીજા ત્રિમાસિકથી બાળકનું વજન ઝડપથી વધે છે અને તે ધીમે ધીમે પ્રસૂતિ માટેની સ્થિતિમાં આવે છે.',
    neutralText: 'વિકાસની ગતિ દરેક બાળકમાં અલગ હોય છે: આ સીમાચિહ્નો માત્ર સામાન્ય સરેરાશ છે.',
    milestones: [
      '6 અઠવાડિયાથી: હૃદય ધબકવાનું શરૂ કરે છે',
      'લગભગ 20 અઠવાડિયે: પહેલી હલનચલન અનુભવાય છે',
      'લગભગ 24-26 અઠવાડિયે: સાંભળવાની ક્ષમતા વિકસે છે',
      'લગભગ 28 અઠવાડિયે: આંખો ધીમે ધીમે ખૂલે છે',
    ],
    myths: [
      'બાળક શરૂઆતથી જ “બધું સાંભળે છે”: સાંભળવાની ક્ષમતા બીજા ત્રિમાસિક સુધી ખરેખર વિકસતી નથી',
      'પેટનો આકાર બાળકનું જાતિ દર્શાવે છે: આને ટેકો આપતો કોઈ વૈજ્ઞાનિક પુરાવો નથી',
      'સક્રિય બાળક અવશ્ય વધુ સ્વસ્થ હોય છે: સક્રિયતાનું સ્તર એક બાળકથી બીજા બાળકમાં ઘણું જુદું હોય છે',
    ],
    tip2Title: 'જાણવા જેવું',
    tip2Text: 'બાળકના વિકાસનો દરેક તબક્કો પોતાની ગતિએ ચાલે છે; નિયમિત તબીબી તપાસ બધું સામાન્ય રીતે આગળ વધી રહ્યું છે તેની ખાતરી કરવામાં મદદ કરે છે.',
    shareMessage: 'ગર્ભમાં બાળકનો વિકાસ — AWA',
  },
  pa: {
    badge: 'ਗਰਭ-ਅਵਸਥਾ • ਵਿਕਾਸ',
    title: 'ਕੁੱਖ ਵਿੱਚ ਤੁਹਾਡੇ ਬੱਚੇ ਦਾ\nਵਿਕਾਸ',
    metaDuration: '6 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਲੇਖ',
    metaLevel: 'ਸ਼ੁਰੂਆਤੀ ਪੱਧਰ',
    metaValidated: 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ',
    intro: 'ਤੁਹਾਡਾ ਬੱਚਾ ਕਿਵੇਂ ਵਧਦਾ ਹੈ, ਤਿਮਾਹੀ ਦਰ ਤਿਮਾਹੀ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      'ਪਹਿਲੀ ਤਿਮਾਹੀ: ਸ਼ੁਰੂਆਤੀ ਦਿਨ',
      'ਦੂਜੀ ਤਿਮਾਹੀ: ਇੰਦਰੀਆਂ ਜਾਗਦੀਆਂ ਹਨ',
      'ਤੀਜੀ ਤਿਮਾਹੀ: ਆਖ਼ਰੀ ਪੜਾਅ',
      'ਇੱਕ ਨਜ਼ਰ ਵਿੱਚ ਮੁੱਖ ਪੜਾਅ',
      'ਆਮ ਭਰਮ',
      'ਕੀ ਯਾਦ ਰੱਖਣਾ ਹੈ',
    ],
    body1: 'ਹਫ਼ਤਾ 6 ਤੋਂ ਹੀ ਇੱਕ ਨੰਨ੍ਹਾ ਜਿਹਾ ਦਿਲ ਧੜਕਣਾ ਸ਼ੁਰੂ ਕਰ ਦਿੰਦਾ ਹੈ। ਇਸ ਪਹਿਲੀ ਤਿਮਾਹੀ ਦੌਰਾਨ ਮੁੱਖ ਅੰਗ ਹੌਲੀ-ਹੌਲੀ ਬਣਦੇ ਹਨ।',
    tip1Title: 'ਜਾਣਨ ਯੋਗ',
    tip1Text: 'ਬੱਚੇ ਦੇ ਦਿਲ ਦੀ ਧੜਕਣ ਅਲਟਰਾਸਾਊਂਡ ’ਤੇ ਦਿਖਾਈ ਦੇਣ ਵਾਲੇ ਪਹਿਲੇ ਸੰਕੇਤਾਂ ਵਿੱਚੋਂ ਇੱਕ ਹੈ, ਅਤੇ ਅਕਸਰ ਤੁਹਾਡੀ ਦੇਖਭਾਲ ਦਾ ਇੱਕ ਯਾਦਗਾਰੀ ਪਲ ਹੁੰਦਾ ਹੈ।',
    body2: 'ਲਗਭਗ ਹਫ਼ਤਾ 20 ਦੇ ਆਸ-ਪਾਸ ਤੁਸੀਂ ਆਮ ਤੌਰ ’ਤੇ ਬੱਚੇ ਦੀਆਂ ਪਹਿਲੀਆਂ ਹਰਕਤਾਂ ਮਹਿਸੂਸ ਕਰ ਸਕਦੇ ਹੋ। ਇਹੀ ਉਹ ਸਮਾਂ ਹੈ ਜਦੋਂ ਇੰਦਰੀਆਂ ਵਿਕਸਿਤ ਹੋਣੀਆਂ ਸ਼ੁਰੂ ਹੁੰਦੀਆਂ ਹਨ।',
    body3: 'ਤੀਜੀ ਤਿਮਾਹੀ ਤੋਂ ਬੱਚੇ ਦਾ ਭਾਰ ਤੇਜ਼ੀ ਨਾਲ ਵਧਦਾ ਹੈ ਅਤੇ ਉਹ ਹੌਲੀ-ਹੌਲੀ ਜਨਮ ਲਈ ਸਹੀ ਸਥਿਤੀ ਵਿੱਚ ਆ ਜਾਂਦਾ ਹੈ।',
    neutralText: 'ਵਿਕਾਸ ਦੀ ਰਫ਼ਤਾਰ ਹਰ ਬੱਚੇ ਵਿੱਚ ਵੱਖਰੀ ਹੁੰਦੀ ਹੈ: ਇਹ ਪੜਾਅ ਸਿਰਫ਼ ਆਮ ਔਸਤ ਹਨ।',
    milestones: [
      '6 ਹਫ਼ਤਿਆਂ ਤੋਂ: ਦਿਲ ਧੜਕਣਾ ਸ਼ੁਰੂ ਕਰਦਾ ਹੈ',
      'ਲਗਭਗ 20 ਹਫ਼ਤੇ: ਪਹਿਲੀਆਂ ਹਰਕਤਾਂ ਮਹਿਸੂਸ ਹੁੰਦੀਆਂ ਹਨ',
      'ਲਗਭਗ 24-26 ਹਫ਼ਤੇ: ਸੁਣਨ ਦੀ ਸ਼ਕਤੀ ਵਿਕਸਿਤ ਹੁੰਦੀ ਹੈ',
      'ਲਗਭਗ 28 ਹਫ਼ਤੇ: ਅੱਖਾਂ ਹੌਲੀ-ਹੌਲੀ ਖੁੱਲ੍ਹਦੀਆਂ ਹਨ',
    ],
    myths: [
      'ਬੱਚਾ ਸ਼ੁਰੂ ਤੋਂ ਹੀ “ਸਭ ਕੁਝ ਸੁਣਦਾ ਹੈ”: ਸੁਣਨ ਦੀ ਸ਼ਕਤੀ ਦੂਜੀ ਤਿਮਾਹੀ ਤੋਂ ਪਹਿਲਾਂ ਸੱਚਮੁੱਚ ਵਿਕਸਿਤ ਨਹੀਂ ਹੁੰਦੀ',
      'ਪੇਟ ਦੀ ਸ਼ਕਲ ਬੱਚੇ ਦਾ ਲਿੰਗ ਦੱਸਦੀ ਹੈ: ਇਸ ਦਾ ਕੋਈ ਵਿਗਿਆਨਕ ਸਬੂਤ ਨਹੀਂ ਹੈ',
      'ਜ਼ਿਆਦਾ ਹਰਕਤ ਕਰਨ ਵਾਲਾ ਬੱਚਾ ਲਾਜ਼ਮੀ ਤੌਰ ’ਤੇ ਵੱਧ ਤੰਦਰੁਸਤ ਹੁੰਦਾ ਹੈ: ਹਰਕਤ ਦਾ ਪੱਧਰ ਇੱਕ ਬੱਚੇ ਤੋਂ ਦੂਜੇ ਵਿੱਚ ਬਹੁਤ ਵੱਖਰਾ ਹੁੰਦਾ ਹੈ',
    ],
    tip2Title: 'ਜਾਣਨ ਯੋਗ',
    tip2Text: 'ਬੱਚੇ ਦੇ ਵਿਕਾਸ ਦਾ ਹਰ ਪੜਾਅ ਆਪਣੀ ਰਫ਼ਤਾਰ ਨਾਲ ਚੱਲਦਾ ਹੈ; ਨਿਯਮਿਤ ਡਾਕਟਰੀ ਜਾਂਚਾਂ ਇਹ ਪੱਕਾ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰਦੀਆਂ ਹਨ ਕਿ ਸਭ ਕੁਝ ਠੀਕ ਚੱਲ ਰਿਹਾ ਹੈ।',
    shareMessage: 'ਕੁੱਖ ਵਿੱਚ ਬੱਚੇ ਦਾ ਵਿਕਾਸ — AWA',
  },
  my: {
    badge: 'ကိုယ်ဝန်ဆောင်ခြင်း • ဖွံ့ဖြိုးမှု',
    title: 'သားအိမ်အတွင်းရှိ သင့်ကလေး၏\nဖွံ့ဖြိုးမှု',
    metaDuration: 'ဖတ်ချိန် 6 မိနစ်',
    metaType: 'ဆောင်းပါး',
    metaLevel: 'အခြေခံအဆင့်',
    metaValidated: 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ',
    intro: 'သင့်ကလေး သုံးလပတ်အလိုက် မည်သို့ကြီးထွားလာသည်။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'ပထမသုံးလပတ်။ အစောပိုင်းရက်များ',
      'ဒုတိယသုံးလပတ်။ အာရုံငါးပါး နိုးကြားလာခြင်း',
      'တတိယသုံးလပတ်။ နောက်ဆုံးအဆင့်',
      'အဓိက အဆင့်များကို တစ်ချက်တည်း ကြည့်ခြင်း',
      'အဖြစ်များသော အယူအဆမှားများ',
      'မှတ်ထားရမည့်အရာများ',
    ],
    body1: 'အပတ် 6 အစောပိုင်းမှစ၍ သေးငယ်သော နှလုံးတစ်ခု ခုန်လာပြီဖြစ်သည်။ ဤပထမသုံးလပတ်အတွင်း အဓိကအင်္ဂါများ တဖြည်းဖြည်း ပေါ်ပေါက်လာသည်။',
    tip1Title: 'သိထားသင့်သည်',
    tip1Text: 'ကလေး၏ နှလုံးခုန်သံသည် အယ်ထရာဆောင်းတွင် ပထမဆုံး မြင်ရသော လက္ခဏာများထဲမှ တစ်ခုဖြစ်ပြီး သင့်စောင့်ရှောက်မှုကာလအတွင်း မမေ့နိုင်သော အချိန်တစ်ခု ဖြစ်တတ်သည်။',
    body2: 'အပတ် 20 ဝန်းကျင်တွင် ကလေး၏ ပထမဆုံး လှုပ်ရှားမှုများကို များသောအားဖြင့် ခံစားရနိုင်သည်။ ဤအချိန်တွင်ပင် အာရုံငါးပါး စတင်ဖွံ့ဖြိုးလာသည်။',
    body3: 'တတိယသုံးလပတ်မှစ၍ ကလေးသည် ကိုယ်အလေးချိန် လျင်မြန်စွာ တိုးလာပြီး မွေးဖွားရန် နေရာယူလာသည်။',
    neutralText: 'ဖွံ့ဖြိုးမှု အရှိန်သည် ကလေးတစ်ဦးချင်းအလိုက် ကွာခြားသည်။ ဤအဆင့်များမှာ ယေဘုယျပျမ်းမျှတန်ဖိုးများသာ ဖြစ်သည်။',
    milestones: [
      'အပတ် 6 မှစ၍ နှလုံး စတင်ခုန်သည်',
      'အပတ် 20 ဝန်းကျင်။ ပထမဆုံး လှုပ်ရှားမှုများ ခံစားရသည်',
      'အပတ် 24-26 ဝန်းကျင်။ ကြားနိုင်စွမ်း ဖွံ့ဖြိုးလာသည်',
      'အပတ် 28 ဝန်းကျင်။ မျက်လုံးများ တဖြည်းဖြည်း ပွင့်လာသည်',
    ],
    myths: [
      'ကလေးသည် အစကတည်းက “အားလုံးကို ကြားသည်”။ ကြားနိုင်စွမ်းသည် ဒုတိယသုံးလပတ်မတိုင်မီ အမှန်တကယ် မဖွံ့ဖြိုးသေးပါ',
      'ဗိုက်ပုံသဏ္ဍာန်က ကလေး၏ လိင်ကို ညွှန်ပြသည်။ ၎င်းကို ထောက်ခံသော သိပ္ပံအထောက်အထား မရှိပါ',
      'တက်ကြွသော ကလေးသည် ပိုကျန်းမာသည်ဟု မဆိုနိုင်ပါ။ လှုပ်ရှားမှုပမာဏသည် ကလေးတစ်ဦးနှင့်တစ်ဦး အလွန်ကွာခြားသည်',
    ],
    tip2Title: 'သိထားသင့်သည်',
    tip2Text: 'ကလေး၏ ဖွံ့ဖြိုးမှုအဆင့်တိုင်းသည် ကိုယ်ပိုင်အရှိန်ဖြင့် ဖြစ်ပေါ်သည်။ ပုံမှန်ဆေးစစ်မှုများက အားလုံးပုံမှန်ဖြစ်ပေါ်နေကြောင်း အတည်ပြုရန် ကူညီသည်။',
    shareMessage: 'သားအိမ်အတွင်းရှိ ကလေး၏ ဖွံ့ဖြိုးမှု — AWA',
  },
  km: {
    badge: 'ការមានផ្ទៃពោះ • ការលូតលាស់',
    title: 'ការលូតលាស់របស់ទារករបស់អ្នក\nក្នុងស្បូន',
    metaDuration: 'អាន 6 នាទី',
    metaType: 'អត្ថបទ',
    metaLevel: 'កម្រិតដំបូង',
    metaValidated: 'មាតិកាបានពិនិត្យ',
    intro: 'របៀបដែលទារករបស់អ្នកលូតលាស់ ត្រីមាសម្តងៗ។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'ត្រីមាសទីមួយ៖ ថ្ងៃដំបូងៗ',
      'ត្រីមាសទីពីរ៖ អារម្មណ៍ស្ទាក់ភ្ញាក់',
      'ត្រីមាសទីបី៖ ជំហានចុងក្រោយ',
      'ព្រឹត្តិការណ៍សំខាន់ៗមួយភ្លែត',
      'ទំនៀមទម្លាប់ដែលច្រឡំជាទូទៅ',
      'អ្វីដែលត្រូវចងចាំ',
    ],
    body1: 'ចាប់ពីសប្តាហ៍ទី 6 ម្លេះ បេះដូងតូចមួយចាប់ផ្តើមលោតរួចហើយ។ ក្នុងអំឡុងត្រីមាសទីមួយនេះ សរីរាង្គសំខាន់ៗបង្កើតឡើងបន្តិចម្តងៗ។',
    tip1Title: 'គួរដឹង',
    tip1Text: 'ចង្វាក់បេះដូងរបស់ទារកគឺជាសញ្ញាដែលអាចមើលឃើញដំបូងគេមួយនៅលើអ៊ុលត្រាសោន ជាញឹកញាប់ជាពេលវេលាដែលគួរឱ្យចងចាំក្នុងការថែទាំរបស់អ្នក។',
    body2: 'ប្រហែលសប្តាហ៍ទី 20 ជាធម្មតាអ្នកអាចមានអារម្មណ៍ពីចលនាដំបូងរបស់ទារក។ នេះក៏ជាពេលដែលអារម្មណ៍សាច់ឈាមចាប់ផ្តើមលូតលាស់ដែរ។',
    body3: 'ចាប់ពីត្រីមាសទី 3 ទៅ ទារកឡើងទម្ងន់យ៉ាងលឿន ហើយបន្តិចម្តងៗរៀបចំទីតាំងសម្រាប់ការសម្រាល។',
    neutralText: 'ល្បឿននៃការលូតលាស់ខុសគ្នាពីទារកមួយទៅទារកមួយ៖ ព្រឹត្តិការណ៍សំខាន់ៗទាំងនេះនៅតែជាមធ្យមភាគទូទៅប៉ុណ្ណោះ។',
    milestones: [
      'ចាប់ពី 6 សប្តាហ៍៖ បេះដូងចាប់ផ្តើមលោត',
      'ប្រហែល 20 សប្តាហ៍៖ មានអារម្មណ៍ពីចលនាដំបូង',
      'ប្រហែល 24-26 សប្តាហ៍៖ ការស្តាប់លូតលាស់',
      'ប្រហែល 28 សប្តាហ៍៖ ភ្នែកបើកបន្តិចម្តងៗ',
    ],
    myths: [
      'ទារក “ឮអ្វីៗទាំងអស់” តាំងពីដំបូង៖ ការស្តាប់មិនលូតលាស់ពិតប្រាកដរហូតដល់ត្រីមាសទី 2',
      'រូបរាងនៃពោះបង្ហាញពីភេទរបស់ទារក៖ គ្មានភស្តុតាងវិទ្យាសាស្ត្រគាំទ្រទេ',
      'ទារកដែលសកម្មគឺមានសុខភាពល្អជាងជាចាំបាច់៖ កម្រិតសកម្មភាពខុសគ្នាច្រើនពីទារកមួយទៅទារកមួយ',
    ],
    tip2Title: 'គួរដឹង',
    tip2Text: 'ដំណាក់កាលនីមួយៗនៃការលូតលាស់របស់ទារកមានល្បឿនរៀងខ្លួន៖ ការពិនិត្យសុខភាពទៀងទាត់ជួយបញ្ជាក់ថាអ្វីៗកំពុងដំណើរការជាធម្មតា។',
    shareMessage: 'ការលូតលាស់របស់ទារកក្នុងស្បូន — AWA',
  },
  lo: {
    badge: 'ການຖືພາ • ພັດທະນາການ',
    title: 'ພັດທະນາການຂອງລູກນ້ອຍ\nໃນມົດລູກ',
    metaDuration: 'ອ່ານ 6 ນາທີ',
    metaType: 'ບົດຄວາມ',
    metaLevel: 'ລະດັບເລີ່ມຕົ້ນ',
    metaValidated: 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ',
    intro: 'ລູກນ້ອຍຂອງທ່ານເຕີບໂຕແນວໃດ ໄຕມາດຕໍ່ໄຕມາດ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ໄຕມາດທຳອິດ: ມື້ທຳອິດໆ',
      'ໄຕມາດທີສອງ: ການຮັບຮູ້ເລີ່ມຕື່ນຕົວ',
      'ໄຕມາດທີສາມ: ຊ່ວງສຸດທ້າຍ',
      'ຈຸດສຳຄັນໂດຍຫຍໍ້',
      'ຄວາມເຊື່ອຜິດໆທີ່ພົບທົ່ວໄປ',
      'ສິ່ງທີ່ຄວນຈື່',
    ],
    body1: 'ຕັ້ງແຕ່ອາທິດທີ 6 ຫົວໃຈນ້ອຍໆກໍເລີ່ມເຕັ້ນແລ້ວ. ຕະຫຼອດໄຕມາດທຳອິດນີ້ ອະໄວຍະວະສຳຄັນຕ່າງໆຄ່ອຍໆກໍ່ຕົວຂຶ້ນ.',
    tip1Title: 'ຄວນຮູ້',
    tip1Text: 'ການເຕັ້ນຂອງຫົວໃຈລູກນ້ອຍແມ່ນໜຶ່ງໃນສັນຍານທຳອິດທີ່ເຫັນໄດ້ຈາກອັນຕຣາຊາວ ແລະ ມັກເປັນຊ່ວງເວລາທີ່ປະທັບໃຈໃນການດູແລຂອງທ່ານ.',
    body2: 'ປະມານອາທິດທີ 20 ທ່ານມັກຮູ້ສຶກເຖິງການເຄື່ອນໄຫວທຳອິດຂອງລູກນ້ອຍ. ນີ້ຍັງເປັນຊ່ວງທີ່ການຮັບຮູ້ຕ່າງໆເລີ່ມພັດທະນາ.',
    body3: 'ຕັ້ງແຕ່ໄຕມາດທີ 3 ເປັນຕົ້ນໄປ ລູກນ້ອຍນ້ຳໜັກເພີ່ມຂຶ້ນໄວ ແລະ ຄ່ອຍໆປ່ຽນທ່າກຽມພ້ອມສຳລັບການເກີດ.',
    neutralText: 'ຈັງຫວະພັດທະນາການແຕກຕ່າງກັນໄປໃນລູກນ້ອຍແຕ່ລະຄົນ: ຈຸດສຳຄັນເຫຼົ່ານີ້ເປັນພຽງຄ່າສະເລ່ຍທົ່ວໄປ.',
    milestones: [
      'ຕັ້ງແຕ່ 6 ອາທິດ: ຫົວໃຈເລີ່ມເຕັ້ນ',
      'ປະມານ 20 ອາທິດ: ຮູ້ສຶກເຖິງການເຄື່ອນໄຫວທຳອິດ',
      'ປະມານ 24-26 ອາທິດ: ການໄດ້ຍິນເລີ່ມພັດທະນາ',
      'ປະມານ 28 ອາທິດ: ຕາຄ່ອຍໆເປີດ',
    ],
    myths: [
      'ລູກນ້ອຍ “ໄດ້ຍິນທຸກຢ່າງ” ຕັ້ງແຕ່ເລີ່ມຕົ້ນ: ການໄດ້ຍິນຍັງບໍ່ພັດທະນາຢ່າງແທ້ຈິງຈົນເຖິງໄຕມາດທີ 2',
      'ຮູບຮ່າງຂອງທ້ອງບອກເພດຂອງລູກນ້ອຍ: ບໍ່ມີຫຼັກຖານທາງວິທະຍາສາດຮອງຮັບ',
      'ລູກນ້ອຍທີ່ຂຸກຂິກຫຼາຍຕ້ອງແຂງແຮງກວ່າ: ລະດັບການເຄື່ອນໄຫວແຕກຕ່າງກັນຫຼາຍໃນລູກນ້ອຍແຕ່ລະຄົນ',
    ],
    tip2Title: 'ຄວນຮູ້',
    tip2Text: 'ແຕ່ລະຂັ້ນຕອນຂອງພັດທະນາການລູກນ້ອຍມີຈັງຫວະຂອງຕົນເອງ; ການກວດສຸຂະພາບເປັນປະຈຳຊ່ວຍຢືນຢັນວ່າທຸກຢ່າງດຳເນີນໄປຕາມປົກກະຕິ.',
    shareMessage: 'ພັດທະນາການຂອງລູກນ້ອຍໃນມົດລູກ — AWA',
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
