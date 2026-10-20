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

const ID = 'bones-sante-osseuse';

const HERO = require('../../assets/images/library/food-magnesium.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const PREVENTION_ICONS = [
  'bowl-mix-outline',
  'weather-sunny',
  'shoe-sneaker',
  'smoking-off',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'SANTÉ OSSEUSE',
    title: 'Prendre soin de\nsa santé osseuse',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro: 'Pourquoi la ménopause augmente le risque d’ostéoporose, et comment protéger ses os au quotidien.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Pourquoi la ménopause fragilise les os',
      'Ostéopénie et ostéoporose',
      'Le dépistage par ostéodensitométrie',
      'Les piliers de la prévention',
      'Facteurs qui augmentent le risque',
      'À retenir',
    ],
    body1: 'Les œstrogènes protègent naturellement la densité osseuse en freinant le renouvellement osseux. Leur baisse pendant la ménopause accélère la perte osseuse, surtout durant les premières années suivant l’arrêt des règles.',
    body2: 'L’ostéopénie désigne une densité osseuse plus basse que la normale, sans atteindre le seuil de l’ostéoporose. L’ostéoporose correspond à une fragilité osseuse plus marquée, qui augmente le risque de fracture, notamment en cas de chute.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Ces deux termes décrivent une perte de densité osseuse, pas une fracture déjà présente : ils invitent à la prévention, pas à l’inquiétude.',
    body3: 'Cet examen indolore mesure la densité minérale osseuse. Il peut être proposé selon ton âge, tes antécédents personnels et familiaux, ou d’autres facteurs de risque identifiés avec ton médecin.',
    preventionHabits: [
      'Calcium (produits laitiers, légumes verts)',
      'Vitamine D (soleil modéré, alimentation)',
      'Exercices porteurs de poids (marche, renforcement)',
      'Limiter tabac et alcool',
    ],
    riskFactors: [
      'Des antécédents familiaux d’ostéoporose',
      'Une ménopause précoce (avant 45 ans)',
      'Un tabagisme actuel ou passé',
      'Une corpulence très mince ou une activité physique très faible',
    ],
    alertTitle: 'À noter',
    alertText: 'Avoir un ou plusieurs de ces facteurs ne signifie pas développer une ostéoporose : ils aident surtout à orienter la discussion avec ton médecin sur un éventuel dépistage.',
    tip2Title: 'Bon à savoir',
    tip2Text: 'Calcium, vitamine D et activité physique porteuse de poids restent les gestes les plus utiles au quotidien pour préserver la solidité de tes os sur le long terme.',
    shareMessage: 'Prendre soin de sa santé osseuse — AWA',
  },
  en: {
    badge: 'BONE HEALTH',
    title: 'Taking care of\nyour bone health',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro: 'Why menopause increases the risk of osteoporosis, and how to protect your bones every day.',
    contentsTitle: 'In this article',
    topics: [
      'Why menopause weakens bones',
      'Osteopenia and osteoporosis',
      'Screening with bone densitometry',
      'The pillars of prevention',
      'Factors that increase the risk',
      'What to remember',
    ],
    body1: 'Estrogen naturally helps protect bone density by slowing down bone turnover. The drop in estrogen during menopause speeds up bone loss, especially in the first few years after your periods stop.',
    body2: 'Osteopenia refers to bone density that’s lower than normal, without reaching the threshold for osteoporosis. Osteoporosis is a more pronounced bone fragility that increases the risk of fracture, particularly in the event of a fall.',
    tip1Title: 'Good to know',
    tip1Text: 'Both terms describe a loss of bone density, not a fracture that has already happened — they’re a prompt for prevention, not a reason to worry.',
    body3: 'This painless exam measures bone mineral density. It may be offered based on your age, your personal and family history, or other risk factors identified with your doctor.',
    preventionHabits: [
      'Calcium (dairy products, leafy greens)',
      'Vitamin D (moderate sun exposure, diet)',
      'Weight-bearing exercise (walking, strength training)',
      'Limit tobacco and alcohol',
    ],
    riskFactors: [
      'A family history of osteoporosis',
      'Early menopause (before age 45)',
      'Current or past smoking',
      'A very slim build or very low physical activity',
    ],
    alertTitle: 'Please note',
    alertText: 'Having one or more of these factors doesn’t mean you’ll develop osteoporosis — they’re mainly there to help guide the conversation with your doctor about possible screening.',
    tip2Title: 'Good to know',
    tip2Text: 'Calcium, vitamin D, and weight-bearing physical activity remain the most useful everyday habits for preserving bone strength in the long run.',
    shareMessage: 'Taking care of your bone health — AWA',
  },
  es: {
    badge: 'SALUD ÓSEA',
    title: 'Cuidar de\ntu salud ósea',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido validado',
    intro: 'Por qué la menopausia aumenta el riesgo de osteoporosis, y cómo proteger tus huesos en el día a día.',
    contentsTitle: 'En este artículo',
    topics: [
      'Por qué la menopausia debilita los huesos',
      'Osteopenia y osteoporosis',
      'La detección mediante densitometría ósea',
      'Los pilares de la prevención',
      'Factores que aumentan el riesgo',
      'Para recordar',
    ],
    body1: 'Los estrógenos protegen naturalmente la densidad ósea al frenar la renovación del hueso. Su disminución durante la menopausia acelera la pérdida ósea, sobre todo durante los primeros años después de que cesen las reglas.',
    body2: 'La osteopenia designa una densidad ósea más baja de lo normal, sin llegar al umbral de la osteoporosis. La osteoporosis corresponde a una fragilidad ósea más marcada, que aumenta el riesgo de fractura, en particular en caso de caída.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Estos dos términos describen una pérdida de densidad ósea, no una fractura ya presente: invitan a la prevención, no a la preocupación.',
    body3: 'Este examen indoloro mide la densidad mineral ósea. Puede proponerse según tu edad, tus antecedentes personales y familiares, u otros factores de riesgo identificados con tu médico.',
    preventionHabits: [
      'Calcio (lácteos, verduras de hoja verde)',
      'Vitamina D (sol moderado, alimentación)',
      'Ejercicios con carga de peso (caminar, fortalecimiento)',
      'Limitar el tabaco y el alcohol',
    ],
    riskFactors: [
      'Antecedentes familiares de osteoporosis',
      'Una menopausia precoz (antes de los 45 años)',
      'Tabaquismo actual o pasado',
      'Una complexión muy delgada o una actividad física muy baja',
    ],
    alertTitle: 'A tener en cuenta',
    alertText: 'Tener uno o varios de estos factores no significa que vayas a desarrollar osteoporosis: sirven sobre todo para orientar la conversación con tu médico sobre una posible detección.',
    tip2Title: 'DATO ÚTIL',
    tip2Text: 'El calcio, la vitamina D y la actividad física con carga de peso siguen siendo los gestos más útiles en el día a día para preservar la solidez de tus huesos a largo plazo.',
    shareMessage: 'Cuidar de tu salud ósea — AWA',
  },
  it: {
    badge: 'SALUTE DELLE OSSA',
    title: 'Prenderti cura\ndella salute delle tue ossa',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenuto validato',
    intro: 'Perché la menopausa aumenta il rischio di osteoporosi e come proteggere ogni giorno le tue ossa.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Perché la menopausa indebolisce le ossa',
      'Osteopenia e osteoporosi',
      'Lo screening con la densitometria ossea',
      'I pilastri della prevenzione',
      'I fattori che aumentano il rischio',
      'Cosa ricordare',
    ],
    body1: 'Gli estrogeni contribuiscono naturalmente a proteggere la densità ossea rallentando il ricambio osseo. Il calo degli estrogeni durante la menopausa accelera la perdita ossea, soprattutto nei primi anni dopo la scomparsa delle mestruazioni.',
    body2: 'L’osteopenia indica una densità ossea inferiore alla norma, senza raggiungere la soglia dell’osteoporosi. L’osteoporosi è una fragilità ossea più marcata che aumenta il rischio di frattura, in particolare in caso di caduta.',
    tip1Title: 'Da sapere',
    tip1Text: 'Entrambi i termini descrivono una perdita di densità ossea, non una frattura già avvenuta — sono uno stimolo alla prevenzione, non un motivo di preoccupazione.',
    body3: 'Questo esame indolore misura la densità minerale ossea. Può essere proposto in base alla tua età, alla tua storia personale e familiare o ad altri fattori di rischio individuati con il tuo medico.',
    preventionHabits: [
      'Calcio (latticini, verdure a foglia verde)',
      'Vitamina D (esposizione moderata al sole, alimentazione)',
      'Esercizio fisico con carico (camminata, allenamento di forza)',
      'Limitare il tabacco e l’alcol',
    ],
    riskFactors: [
      'Una storia familiare di osteoporosi',
      'Menopausa precoce (prima dei 45 anni)',
      'Fumo attuale o passato',
      'Una corporatura molto esile o un’attività fisica molto scarsa',
    ],
    alertTitle: 'Attenzione',
    alertText: 'Avere uno o più di questi fattori non significa che sviluppherai l’osteoporosi — servono soprattutto a orientare il confronto con il tuo medico su un possibile screening.',
    tip2Title: 'Da sapere',
    tip2Text: 'Calcio, vitamina D e attività fisica con carico restano le abitudini quotidiane più utili per preservare nel tempo la solidità delle ossa.',
    shareMessage: 'Prenderti cura della salute delle tue ossa — AWA',
  },
  tr: {
    badge: 'KEMİK SAĞLIĞI',
    title: 'Kemik sağlığına\nözen göster',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Orta düzey',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Menopoz osteoporoz riskini neden artırır ve kemiklerini her gün nasıl koruyabilirsin?',
    contentsTitle: 'Bu makalede',
    topics: [
      'Menopoz kemikleri neden zayıflatır?',
      'Osteopeni ve osteoporoz',
      'Kemik dansitometrisi ile tarama',
      'Korunmanın temel dayanakları',
      'Riski artıran etkenler',
      'Akılda tutulacaklar',
    ],
    body1: 'Östrojen, kemik yenilenmesini yavaşlatarak kemik yoğunluğunun korunmasına doğal olarak yardımcı olur. Menopozda östrojenin düşmesi, özellikle adetlerin kesilmesinden sonraki ilk yıllarda kemik kaybını hızlandırır.',
    body2: 'Osteopeni, kemik yoğunluğunun normalden düşük olduğu, ancak osteoporoz eşiğine ulaşmadığı durumu ifade eder. Osteoporoz ise kemiklerin daha belirgin biçimde kırılganlaşması anlamına gelir ve özellikle düşme durumunda kırık riskini artırır.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Her iki terim de kemik yoğunluğundaki bir kaybı anlatır, yaşanmış bir kırığı değil. Bunlar endişelenmek için değil, korunma için bir hatırlatmadır.',
    body3: 'Bu ağrısız tetkik, kemik mineral yoğunluğunu ölçer. Yaşına, kişisel ve ailesel öyküne ya da doktorunla belirlenen diğer risk etkenlerine göre önerilebilir.',
    preventionHabits: [
      'Kalsiyum (süt ürünleri, yeşil yapraklı sebzeler)',
      'D vitamini (ölçülü güneş ışığı, beslenme)',
      'Ağırlık taşıtan egzersiz (yürüyüş, kuvvet antrenmanı)',
      'Tütün ve alkolü sınırlama',
    ],
    riskFactors: [
      'Ailede osteoporoz öyküsü',
      'Erken menopoz (45 yaşından önce)',
      'Halen ya da geçmişte sigara kullanımı',
      'Çok zayıf bir yapı ya da çok düşük fiziksel aktivite',
    ],
    alertTitle: 'Dikkat',
    alertText: 'Bu etkenlerden birine veya birkaçına sahip olmak osteoporoz geliştireceğin anlamına gelmez. Bu etkenler esas olarak, olası tarama konusunda doktorunla yapacağın görüşmeye yön vermeye yardımcı olur.',
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Kalsiyum, D vitamini ve ağırlık taşıtan fiziksel aktivite, uzun vadede kemik gücünü korumak için en faydalı günlük alışkanlıklar olmaya devam ediyor.',
    shareMessage: 'Kemik sağlığına özen göster — AWA',
  },
  ru: {
    badge: 'ЗДОРОВЬЕ КОСТЕЙ',
    title: 'Забота о здоровье\nваших костей',
    metaDuration: '6 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Средний уровень',
    metaValidated: 'Проверенный материал',
    intro: 'Почему менопауза повышает риск остеопороза и как ежедневно защищать кости.',
    contentsTitle: 'В этой статье',
    topics: [
      'Почему менопауза ослабляет кости',
      'Остеопения и остеопороз',
      'Обследование с помощью денситометрии',
      'Основы профилактики',
      'Факторы, повышающие риск',
      'Что важно запомнить',
    ],
    body1: 'Эстрогены естественным образом помогают сохранять плотность костей, замедляя обновление костной ткани. Снижение уровня эстрогенов в период менопаузы ускоряет потерю костной массы, особенно в первые годы после прекращения месячных.',
    body2: 'Остеопения — это пониженная по сравнению с нормой плотность костей, не достигающая порога остеопороза. Остеопороз — это более выраженная хрупкость костей, которая повышает риск переломов, особенно при падении.',
    tip1Title: 'ПОЛЕЗНО ЗНАТЬ',
    tip1Text: 'Оба термина описывают снижение плотности костей, а не уже произошедший перелом — это повод для профилактики, а не для тревоги.',
    body3: 'Это безболезненное обследование измеряет минеральную плотность костей. Его могут предложить с учётом вашего возраста, личной и семейной истории или других факторов риска, выявленных вместе с врачом.',
    preventionHabits: [
      'Кальций (молочные продукты, зелёные листовые овощи)',
      'Витамин D (умеренное пребывание на солнце, питание)',
      'Физическая нагрузка с весом (ходьба, силовые тренировки)',
      'Ограничение табака и алкоголя',
    ],
    riskFactors: [
      'Остеопороз у родственников',
      'Ранняя менопауза (до 45 лет)',
      'Курение в настоящем или прошлом',
      'Очень худощавое телосложение или очень низкая физическая активность',
    ],
    alertTitle: 'Обратите внимание',
    alertText: 'Наличие одного или нескольких из этих факторов не означает, что у вас разовьётся остеопороз — они в первую очередь помогают определить тему разговора с врачом о возможном обследовании.',
    tip2Title: 'ПОЛЕЗНО ЗНАТЬ',
    tip2Text: 'Кальций, витамин D и физическая активность с весовой нагрузкой по-прежнему остаются самыми полезными повседневными привычками для сохранения прочности костей на долгие годы.',
    shareMessage: 'Забота о здоровье ваших костей — AWA',
  },
  de: {
    badge: 'KNOCHENGESUNDHEIT',
    title: 'Auf deine\nKnochengesundheit achten',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Fortgeschritten',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Warum die Menopause das Osteoporoserisiko erhöht und wie du deine Knochen jeden Tag schützen kannst.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Warum die Menopause die Knochen schwächt',
      'Osteopenie und Osteoporose',
      'Früherkennung mit der Knochendichtemessung',
      'Die Säulen der Vorbeugung',
      'Faktoren, die das Risiko erhöhen',
      'Was du dir merken solltest',
    ],
    body1: 'Östrogen trägt auf natürliche Weise dazu bei, die Knochendichte zu schützen, indem es den Knochenumbau verlangsamt. Der Östrogenabfall in den Wechseljahren beschleunigt den Knochenabbau, besonders in den ersten Jahren nach dem Ausbleiben der Periode.',
    body2: 'Osteopenie bezeichnet eine Knochendichte, die unter dem Normalwert liegt, ohne die Schwelle zur Osteoporose zu erreichen. Osteoporose ist eine ausgeprägtere Knochenbrüchigkeit, die das Frakturrisiko erhöht, insbesondere bei einem Sturz.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Beide Begriffe beschreiben einen Verlust an Knochendichte, keinen bereits eingetretenen Knochenbruch – sie sind ein Anlass zur Vorbeugung, kein Grund zur Sorge.',
    body3: 'Diese schmerzfreie Untersuchung misst die Knochenmineraldichte. Sie kann dir je nach Alter, persönlicher und familiärer Vorgeschichte oder weiteren Risikofaktoren angeboten werden, die du gemeinsam mit deiner Ärztin oder deinem Arzt erkannt hast.',
    preventionHabits: [
      'Calcium (Milchprodukte, grünes Blattgemüse)',
      'Vitamin D (maßvolle Sonnenexposition, Ernährung)',
      'Belastende Bewegung (Gehen, Krafttraining)',
      'Tabak und Alkohol einschränken',
    ],
    riskFactors: [
      'Osteoporose in der Familie',
      'Frühe Menopause (vor dem 45. Lebensjahr)',
      'Aktuelles oder früheres Rauchen',
      'Sehr schlanke Statur oder sehr wenig körperliche Aktivität',
    ],
    alertTitle: 'Bitte beachte',
    alertText: 'Wenn einer oder mehrere dieser Faktoren auf dich zutreffen, bedeutet das nicht, dass du eine Osteoporose entwickelst – sie helfen vor allem dabei, das Gespräch mit deiner Ärztin oder deinem Arzt über eine mögliche Früherkennung zu lenken.',
    tip2Title: 'Gut zu wissen',
    tip2Text: 'Calcium, Vitamin D und belastende körperliche Aktivität bleiben die nützlichsten Alltagsgewohnheiten, um die Knochenstärke langfristig zu erhalten.',
    shareMessage: 'Auf deine Knochengesundheit achten — AWA',
  },
  zh: {
      badge: '骨骼健康',
      title: '呵护\n你的骨骼健康',
      metaDuration: '阅读约 6 分钟',
      metaType: '指南',
      metaLevel: '进阶',
      metaValidated: '已审阅内容',
      intro: '为什么绝经会增加骨质疏松的风险，以及如何在日常中保护你的骨骼。',
      contentsTitle: '本文内容',
      topics: [
        '为什么绝经会让骨骼变脆弱',
        '骨量减少与骨质疏松',
        '骨密度检查筛查',
        '预防的几大支柱',
        '会增加风险的因素',
        '需要记住的',
      ],
      body1: '雌激素通过减缓骨转换，自然地帮助保护骨密度。绝经时雌激素下降会加速骨量流失，尤其是在月经停止后的最初几年。',
      body2: '骨量减少是指骨密度低于正常水平，但尚未达到骨质疏松的标准。骨质疏松则是更明显的骨骼脆弱，会增加骨折的风险，尤其是在跌倒的时候。',
      tip1Title: '小贴士',
      tip1Text: '这两个术语描述的都是骨密度的下降，而不是已经发生的骨折——它们是在提示你做好预防，而不是让你担心。',
      body3: '这项检查没有痛感，用于测量骨矿物质密度。可能会根据你的年龄、个人和家族病史，或与医生一起确认的其他风险因素来建议做这项检查。',
      preventionHabits: [
        '钙（乳制品、绿叶蔬菜）',
        '维生素 D（适度晒太阳、饮食）',
        '负重运动（散步、力量训练）',
        '减少吸烟和饮酒',
      ],
      riskFactors: [
        '骨质疏松家族史',
        '过早绝经（45 岁之前）',
        '目前或曾经吸烟',
        '身形非常瘦，或体育活动非常少',
      ],
      alertTitle: '请注意',
      alertText: '有其中一个或多个因素，并不意味着你一定会患上骨质疏松——它们主要是帮助你和医生探讨是否需要进行筛查。',
      tip2Title: '小贴士',
      tip2Text: '钙、维生素 D 和负重的体育活动，仍然是长期维护骨骼强度最有用的日常习惯。',
      shareMessage: '呵护你的骨骼健康 — AWA',
    },
  id: {
    badge: 'KESEHATAN TULANG',
    title: 'Merawat\nkesehatan tulangmu',
    metaDuration: '6 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Menengah',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Mengapa menopause meningkatkan risiko osteoporosis, dan bagaimana melindungi tulangmu setiap hari.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Mengapa menopause melemahkan tulang',
      'Osteopenia dan osteoporosis',
      'Pemeriksaan dengan densitometri tulang',
      'Pilar-pilar pencegahan',
      'Faktor yang meningkatkan risiko',
      'Yang perlu diingat',
    ],
    body1: 'Estrogen secara alami membantu melindungi kepadatan tulang dengan memperlambat pergantian jaringan tulang. Turunnya kadar estrogen saat menopause mempercepat pengeroposan tulang, terutama pada beberapa tahun pertama setelah haidmu berhenti.',
    body2: 'Osteopenia adalah kepadatan tulang yang lebih rendah dari normal, tetapi belum mencapai ambang osteoporosis. Osteoporosis adalah kerapuhan tulang yang lebih nyata dan meningkatkan risiko patah tulang, terutama saat terjatuh.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Kedua istilah ini menggambarkan berkurangnya kepadatan tulang, bukan patah tulang yang sudah terjadi — keduanya menjadi pengingat untuk melakukan pencegahan, bukan alasan untuk cemas.',
    body3: 'Pemeriksaan tanpa rasa sakit ini mengukur kepadatan mineral tulang. Pemeriksaan ini bisa ditawarkan berdasarkan usiamu, riwayat pribadi dan keluargamu, atau faktor risiko lain yang dikenali bersama dokter.',
    preventionHabits: [
      'Kalsium (produk susu, sayuran hijau berdaun)',
      'Vitamin D (paparan sinar matahari secukupnya, makanan)',
      'Olahraga yang membebani tulang (jalan kaki, latihan kekuatan)',
      'Batasi rokok dan alkohol',
    ],
    riskFactors: [
      'Riwayat osteoporosis dalam keluarga',
      'Menopause dini (sebelum usia 45 tahun)',
      'Merokok saat ini atau di masa lalu',
      'Tubuh yang sangat kurus atau aktivitas fisik yang sangat rendah',
    ],
    alertTitle: 'Harap diperhatikan',
    alertText: 'Memiliki satu atau beberapa faktor ini tidak berarti kamu akan terkena osteoporosis — faktor-faktor ini terutama membantu mengarahkan pembicaraanmu dengan dokter tentang kemungkinan pemeriksaan.',
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Kalsium, vitamin D, dan aktivitas fisik yang membebani tulang tetap menjadi kebiasaan sehari-hari yang paling berguna untuk menjaga kekuatan tulang dalam jangka panjang.',
    shareMessage: 'Merawat kesehatan tulangmu — AWA',
  },
  hi: {
    badge: 'हड्डियों की सेहत',
    title: 'अपनी हड्डियों की\nसेहत का ध्यान रखें',
    metaDuration: '6 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'मेनोपॉज़ ऑस्टियोपोरोसिस का जोखिम क्यों बढ़ाता है, और रोज़ अपनी हड्डियों की सुरक्षा कैसे करें।',
    contentsTitle: 'इस लेख में',
    topics: [
      'मेनोपॉज़ हड्डियों को कमज़ोर क्यों करता है',
      'ऑस्टियोपीनिया और ऑस्टियोपोरोसिस',
      'बोन डेंसिटोमेट्री से जाँच',
      'बचाव के मुख्य आधार',
      'जोखिम बढ़ाने वाले कारक',
      'याद रखने वाली बातें',
    ],
    body1: 'एस्ट्रोजन हड्डियों के बनने-टूटने की प्रक्रिया को धीमा करके हड्डियों के घनत्व की स्वाभाविक रूप से सुरक्षा करता है। मेनोपॉज़ (रजोनिवृत्ति) के दौरान एस्ट्रोजन घटने से हड्डियों का क्षय तेज़ हो जाता है, खासकर पीरियड बंद होने के बाद के शुरुआती कुछ सालों में।',
    body2: 'ऑस्टियोपीनिया का मतलब है हड्डियों का घनत्व सामान्य से कम होना, लेकिन ऑस्टियोपोरोसिस की सीमा तक न पहुँचना। ऑस्टियोपोरोसिस हड्डियों की ज़्यादा गंभीर कमज़ोरी है, जो फ़्रैक्चर का जोखिम बढ़ाती है, खासकर गिरने की स्थिति में।',
    tip1Title: 'जानने लायक बात',
    tip1Text: 'दोनों शब्द हड्डियों के घनत्व में कमी बताते हैं, किसी हो चुके फ़्रैक्चर को नहीं — ये बचाव की ओर ध्यान दिलाते हैं, चिंता का कारण नहीं हैं।',
    body3: 'यह दर्द रहित जाँच हड्डियों के खनिज घनत्व को मापती है। आपकी उम्र, आपके व्यक्तिगत और पारिवारिक इतिहास, या आपके डॉक्टर के साथ पहचाने गए अन्य जोखिम कारकों के आधार पर यह सुझाई जा सकती है।',
    preventionHabits: [
      'कैल्शियम (डेयरी उत्पाद, हरी पत्तेदार सब्ज़ियाँ)',
      'विटामिन D (सीमित मात्रा में धूप, आहार)',
      'वज़न उठाने वाले व्यायाम (चलना, स्ट्रेंथ ट्रेनिंग)',
      'तंबाकू और अल्कोहल को सीमित करें',
    ],
    riskFactors: [
      'परिवार में ऑस्टियोपोरोसिस का इतिहास',
      'जल्दी मेनोपॉज़ (45 साल की उम्र से पहले)',
      'वर्तमान या पहले धूम्रपान करना',
      'बहुत दुबला शरीर या बहुत कम शारीरिक गतिविधि',
    ],
    alertTitle: 'ध्यान दें',
    alertText: 'इनमें से एक या ज़्यादा कारक होने का मतलब यह नहीं कि आपको ऑस्टियोपोरोसिस हो ही जाएगा — ये मुख्य रूप से संभावित जाँच के बारे में आपके डॉक्टर से बातचीत को दिशा देने के लिए हैं।',
    tip2Title: 'जानने लायक बात',
    tip2Text: 'कैल्शियम, विटामिन D और वज़न उठाने वाली शारीरिक गतिविधि लंबे समय तक हड्डियों की मज़बूती बनाए रखने के लिए सबसे उपयोगी रोज़ की आदतें बनी रहती हैं।',
    shareMessage: 'अपनी हड्डियों की सेहत का ध्यान रखें — AWA',
  },
  sq: {
    badge: 'SHËNDETI I KOCKAVE',
    title: 'Kujdesi për\nshëndetin e kockave të tua',
    metaDuration: '6 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Mesatar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Pse menopauza e rrit rrezikun e osteoporozës dhe si t’i mbrosh kockat çdo ditë.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Pse menopauza i dobëson kockat',
      'Osteopenia dhe osteoporoza',
      'Kontrolli me densitometri kockore',
      'Shtyllat e parandalimit',
      'Faktorët që e rrisin rrezikun',
      'Çfarë duhet të mbash mend',
    ],
    body1: 'Estrogjeni ndihmon natyrshëm në mbrojtjen e densitetit kockor duke ngadalësuar ripërtëritjen e kockës. Rënia e estrogjenit gjatë menopauzës e përshpejton humbjen e kockës, sidomos në vitet e para pasi të ndalojnë menstruacionet.',
    body2: 'Osteopenia i referohet një densiteti kockor më të ulët se normalja, pa arritur pragun e osteoporozës. Osteoporoza është një brishtësi kockore më e theksuar që e rrit rrezikun e frakturave, veçanërisht në rast rënieje.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Të dy termat përshkruajnë një humbje të densitetit kockor, jo një frakturë që ka ndodhur tashmë — ato janë një shtysë për parandalim, jo një arsye për t’u shqetësuar.',
    body3: 'Ky ekzaminim pa dhimbje mat densitetin mineral të kockës. Mund të propozohet sipas moshës sate, historikut tënd personal e familjar ose faktorëve të tjerë të rrezikut të identifikuar me mjekun tënd.',
    preventionHabits: [
      'Kalciumi (produkte qumështi, perime me gjethe jeshile)',
      'Vitamina D (ekspozim i moderuar ndaj diellit, ushqimi)',
      'Ushtrime me ngarkesë (ecje, ushtrime forcimi)',
      'Kufizo duhanin dhe alkoolin',
    ],
    riskFactors: [
      'Një histori familjare osteoporoze',
      'Menopauzë e hershme (para moshës 45 vjeç)',
      'Pirja e duhanit tani ose në të kaluarën',
      'Trup shumë i hollë ose aktivitet fizik shumë i ulët',
    ],
    alertTitle: 'Kujdes',
    alertText: 'Të kesh një ose më shumë nga këta faktorë nuk do të thotë se do të zhvillosh osteoporozë — ata janë kryesisht për të ndihmuar në orientimin e bisedës me mjekun tënd për një kontroll të mundshëm.',
    tip2Title: 'Mirë është ta dish',
    tip2Text: 'Kalciumi, vitamina D dhe aktiviteti fizik me ngarkesë mbeten zakonet më të dobishme të përditshme për ruajtjen e forcës së kockave në afat të gjatë.',
    shareMessage: 'Kujdesi për shëndetin e kockave të tua — AWA',
  },
  ja: {
    badge: '骨の健康',
    title: '骨の健康を\n守るために',
    metaDuration: '読了6分',
    metaType: 'ガイド',
    metaLevel: '中級',
    metaValidated: '確認済みの内容',
    intro: '更年期に骨粗しょう症のリスクが高まる理由と、毎日の暮らしで骨を守る方法を紹介します。',
    contentsTitle: 'この記事の内容',
    topics: [
      '更年期に骨がもろくなる理由',
      '骨量減少症と骨粗しょう症',
      '骨密度検査による検診',
      '予防の柱',
      'リスクを高める要因',
      '覚えておきたいこと',
    ],
    body1: 'エストロゲンには、骨の代謝のスピードを抑えて骨密度を守る働きが本来あります。更年期にエストロゲンが減少すると、特に生理が止まってからの数年間、骨量の減少が速まります。',
    body2: '骨量減少症とは、骨粗しょう症の基準には達していないものの、骨密度が正常より低い状態を指します。骨粗しょう症は、骨がより明らかにもろくなった状態で、特に転倒したときなどに骨折のリスクが高まります。',
    tip1Title: '知っておきたいこと',
    tip1Text: 'どちらの言葉も、すでに骨折が起きたことではなく、骨密度の低下を表しています。心配するためのものではなく、予防を始めるきっかけです。',
    body3: 'この痛みのない検査では、骨のミネラル量（骨密度）を測定します。年齢、ご自身や家族の病歴、そのほか医師と確認したリスク要因に応じて、検査を勧められることがあります。',
    preventionHabits: [
      'カルシウム（乳製品、葉物野菜）',
      'ビタミンD（適度な日光浴、食事）',
      '体重をかける運動（ウォーキング、筋力トレーニング）',
      '喫煙と飲酒を控える',
    ],
    riskFactors: [
      '骨粗しょう症の家族歴',
      '早期の閉経（45歳より前）',
      '現在または過去の喫煙',
      '非常にやせている、または運動量が非常に少ない',
    ],
    alertTitle: 'ご注意ください',
    alertText: 'これらの要因が一つ以上あっても、骨粗しょう症になるとは限りません。主に、検査の可能性について医師と話し合うための手がかりとして役立てるものです。',
    tip2Title: '知っておきたいこと',
    tip2Text: 'カルシウム、ビタミンD、そして体重をかける運動は、長い目で見て骨の強さを保つために、毎日の習慣として今も最も役立つものです。',
    shareMessage: '骨の健康を守るために — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function BoneHealthArticleScreen({
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

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.intro}>
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

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body1}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body3}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <View style={styles.daily}>
            {PREVENTION_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>{content.preventionHabits[index]}</AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.riskFactors.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="alert-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
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
  contentNumber: {width: 24},
  contentText: {flex: 1},
  h2: {
    marginTop: 24,
  },
  body: {marginTop: 8},
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
  checkList: {
    marginTop: 12,
    padding: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  checkText: {flex: 1},
  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
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
