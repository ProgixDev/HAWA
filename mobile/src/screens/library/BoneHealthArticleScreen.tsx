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
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

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
const CONTENT = withBrazilianPortuguese('BoneHealth', {
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
  ko: {
    badge: '뼈 건강',
    title: '내 뼈 건강\n돌보기',
    metaDuration: '읽는 데 6분',
    metaType: '가이드',
    metaLevel: '중급',
    metaValidated: '검토된 콘텐츠',
    intro: '폐경이 골다공증 위험을 높이는 이유와, 매일 뼈를 지키는 방법을 알아봐요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    topics: [
      '폐경이 뼈를 약하게 하는 이유',
      '골감소증과 골다공증',
      '골밀도 검사로 하는 선별',
      '예방의 기둥',
      '위험을 높이는 요인',
      '기억할 점',
    ],
    body1: '에스트로겐은 뼈의 대사 속도를 늦춰서 골밀도를 자연스럽게 지켜 줘요. 폐경 때 에스트로겐이 줄어들면 특히 생리가 멈춘 뒤 처음 몇 년 동안 뼈가 빠르게 소실돼요.',
    body2: '골감소증은 골밀도가 정상보다 낮지만 골다공증 기준에는 이르지 않은 상태를 말해요. 골다공증은 뼈가 더 뚜렷하게 약해져서, 특히 넘어졌을 때 골절 위험이 높아지는 상태예요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '두 용어 모두 이미 골절이 생겼다는 뜻이 아니라 골밀도가 줄었다는 뜻이에요. 걱정할 이유가 아니라 예방을 시작하라는 신호예요.',
    body3: '통증이 없는 이 검사는 골밀도를 측정해요. 나이, 개인 및 가족의 병력, 또는 의사와 함께 확인한 다른 위험 요인에 따라 권유될 수 있어요.',
    preventionHabits: [
      '칼슘(유제품, 잎채소)',
      '비타민 D(적당한 햇볕 쬐기, 식단)',
      '체중 부하 운동(걷기, 근력 운동)',
      '담배와 술 줄이기',
    ],
    riskFactors: [
      '골다공증 가족력',
      '이른 폐경(45세 이전)',
      '현재 또는 과거의 흡연',
      '매우 마른 체형이거나 신체 활동이 아주 적은 경우',
    ],
    alertTitle: '유의하세요',
    alertText: '이런 요인이 한 가지 이상 있다고 해서 골다공증이 생긴다는 뜻은 아니에요. 주로 선별 검사를 받을지 의사와 이야기할 때 방향을 잡는 데 도움이 되는 요인이에요.',
    tip2Title: '알아 두면 좋아요',
    tip2Text: '칼슘, 비타민 D, 체중 부하 신체 활동은 오랫동안 뼈의 힘을 지키는 데 가장 유용한 일상 습관이에요.',
    shareMessage: '내 뼈 건강 돌보기 — AWA',
  },
  'pt-PT': {
    badge: 'SAÚDE ÓSSEA',
    title: 'Cuidar da\nsua saúde óssea',
    metaDuration: '6 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Intermédio',
    metaValidated: 'Conteúdo revisto',
    intro: 'Porque é que a menopausa aumenta o risco de osteoporose, e como proteger os seus ossos todos os dias.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Porque é que a menopausa enfraquece os ossos',
      'Osteopenia e osteoporose',
      'Rastreio com densitometria óssea',
      'Os pilares da prevenção',
      'Fatores que aumentam o risco',
      'O que reter',
    ],
    body1: 'Os estrogénios ajudam naturalmente a proteger a densidade óssea, ao abrandar a renovação do osso. A descida dos estrogénios na menopausa acelera a perda óssea, sobretudo nos primeiros anos após o fim dos períodos.',
    body2: 'A osteopenia designa uma densidade óssea inferior ao normal, sem atingir o limiar da osteoporose. A osteoporose é uma fragilidade óssea mais acentuada, que aumenta o risco de fratura, em particular em caso de queda.',
    tip1Title: 'Bom saber',
    tip1Text: 'Ambos os termos descrevem uma perda de densidade óssea, e não uma fratura que já tenha ocorrido — são um convite à prevenção, não um motivo de preocupação.',
    body3: 'Este exame, indolor, mede a densidade mineral óssea. Pode ser proposto em função da sua idade, do seu historial pessoal e familiar, ou de outros fatores de risco identificados com o seu médico.',
    preventionHabits: [
      'Cálcio (produtos lácteos, vegetais de folha verde)',
      'Vitamina D (exposição solar moderada, alimentação)',
      'Exercício com carga (caminhada, musculação)',
      'Limitar o tabaco e o álcool',
    ],
    riskFactors: [
      'Historial familiar de osteoporose',
      'Menopausa precoce (antes dos 45 anos)',
      'Tabagismo atual ou passado',
      'Constituição muito magra ou atividade física muito reduzida',
    ],
    alertTitle: 'Atenção',
    alertText: 'Ter um ou mais destes fatores não significa que vá desenvolver osteoporose — servem sobretudo para orientar a conversa com o seu médico sobre um possível rastreio.',
    tip2Title: 'Bom saber',
    tip2Text: 'O cálcio, a vitamina D e a atividade física com carga continuam a ser os hábitos quotidianos mais úteis para preservar a força dos ossos a longo prazo.',
    shareMessage: 'Cuidar da sua saúde óssea — AWA',
  },
  bn: {
    badge: 'হাড়ের স্বাস্থ্য',
    title: 'আপনার হাড়ের\nস্বাস্থ্যের যত্ন নিন',
    metaDuration: 'পড়তে 6 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'মধ্যম',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'মেনোপজ কেন অস্টিওপোরোসিসের ঝুঁকি বাড়ায় এবং প্রতিদিন কীভাবে হাড় রক্ষা করবেন।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'মেনোপজ কেন হাড় দুর্বল করে',
      'অস্টিওপেনিয়া ও অস্টিওপোরোসিস',
      'বোন ডেনসিটোমেট্রির মাধ্যমে স্ক্রিনিং',
      'প্রতিরোধের স্তম্ভগুলো',
      'ঝুঁকি বাড়ায় এমন কারণ',
      'যা মনে রাখবেন',
    ],
    body1: 'ইস্ট্রোজেন স্বাভাবিকভাবেই হাড়ের পুনর্গঠনের গতি কমিয়ে হাড়ের ঘনত্ব রক্ষা করতে সাহায্য করে। মেনোপজের সময় ইস্ট্রোজেন কমে যাওয়ায় হাড়ক্ষয় দ্রুত হয়, বিশেষ করে মাসিক বন্ধ হওয়ার পর প্রথম কয়েক বছরে।',
    body2: 'অস্টিওপেনিয়া বলতে বোঝায় হাড়ের ঘনত্ব স্বাভাবিকের চেয়ে কম, কিন্তু অস্টিওপোরোসিসের সীমায় পৌঁছায়নি। অস্টিওপোরোসিস হলো হাড়ের আরও স্পষ্ট ভঙ্গুরতা, যা ভাঙনের ঝুঁকি বাড়ায়, বিশেষ করে পড়ে গেলে।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'দুটি শব্দই হাড়ের ঘনত্ব কমে যাওয়া বোঝায়, ইতিমধ্যে ঘটে যাওয়া হাড় ভাঙা নয় — এগুলো প্রতিরোধের তাগিদ, দুশ্চিন্তার কারণ নয়।',
    body3: 'ব্যথাহীন এই পরীক্ষায় হাড়ের খনিজ ঘনত্ব মাপা হয়। আপনার বয়স, ব্যক্তিগত ও পারিবারিক ইতিহাস, অথবা ডাক্তারের সঙ্গে চিহ্নিত অন্যান্য ঝুঁকির কারণ অনুযায়ী এটি প্রস্তাব করা হতে পারে।',
    preventionHabits: [
      'ক্যালসিয়াম (দুগ্ধজাত খাবার, পাতাওয়ালা সবুজ শাক)',
      'ভিটামিন ডি (পরিমিত রোদ, খাবার)',
      'ওজন বহনকারী ব্যায়াম (হাঁটা, শক্তি প্রশিক্ষণ)',
      'তামাক ও অ্যালকোহল সীমিত করুন',
    ],
    riskFactors: [
      'পরিবারে অস্টিওপোরোসিসের ইতিহাস',
      'আগেভাগে মেনোপজ (45 বছরের আগে)',
      'বর্তমানে বা অতীতে ধূমপান',
      'খুব পাতলা গড়ন বা খুব কম শারীরিক কার্যকলাপ',
    ],
    alertTitle: 'লক্ষ্য করুন',
    alertText: 'এই কারণগুলোর এক বা একাধিক থাকলে আপনার অস্টিওপোরোসিস হবেই তা নয় — এগুলো মূলত সম্ভাব্য স্ক্রিনিং নিয়ে ডাক্তারের সঙ্গে আলোচনাকে দিকনির্দেশনা দিতে সাহায্য করে।',
    tip2Title: 'জেনে রাখা ভালো',
    tip2Text: 'ক্যালসিয়াম, ভিটামিন ডি এবং ওজন বহনকারী শারীরিক কার্যকলাপ দীর্ঘমেয়াদে হাড়ের শক্তি ধরে রাখার জন্য সবচেয়ে কার্যকর দৈনন্দিন অভ্যাস।',
    shareMessage: 'আপনার হাড়ের স্বাস্থ্যের যত্ন নিন — AWA',
  },
  da: {
    badge: 'KNOGLESUNDHED',
    title: 'Pas på\ndine knogler',
    metaDuration: '6 min læsning',
    metaType: 'Guide',
    metaLevel: 'Mellemniveau',
    metaValidated: 'Gennemset indhold',
    intro: 'Hvorfor menopause øger risikoen for knogleskørhed, og hvordan du beskytter dine knogler i hverdagen.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvorfor menopause svækker knoglerne',
      'Osteopeni og osteoporose',
      'Screening med knogledensitometri',
      'Forebyggelsens søjler',
      'Faktorer der øger risikoen',
      'Hvad du kan tage med dig',
    ],
    body1: 'Østrogen beskytter naturligt knogletætheden ved at bremse knoglernes nedbrydning. Når østrogenet falder ved menopausen, går knogletabet hurtigere, særligt i de første år efter, at menstruationen ophører.',
    body2: 'Osteopeni betyder, at knogletætheden er under normalen, men endnu ikke på niveau med osteoporose. Osteoporose er en mere udtalt knogleskørhed, der øger brudrisikoen – især ved fald.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Begge ord beskriver en reduktion i knogletæthed, ikke et knoglebrydning der allerede er sket – de er et signal til forebyggelse, ikke en grund til bekymring.',
    body3: 'Denne smertefrie undersøgelse måler knoglernes mineraltæthed. Den kan anbefales afhængigt af din alder, personlige og familiære sygehistorik eller andre risikofaktorer identificeret med din læge.',
    preventionHabits: [
      'Calcium (mejeriprodukter, grønne bladgrøntsager)',
      'D-vitamin (moderat soleksponering, kost)',
      'Vægtbærende motion (gang, styrketræning)',
      'Begræns tobak og alkohol',
    ],
    riskFactors: [
      'Familiehistorik med osteoporose',
      'Tidlig menopause (før 45 år)',
      'Nuværende eller tidligere rygning',
      'Meget slank kropsbygning eller meget lidt fysisk aktivitet',
    ],
    alertTitle: 'Bemærk',
    alertText: 'At have én eller flere af disse faktorer betyder ikke, at du nødvendigvis vil udvikle osteoporose – de hjælper primært med at guide samtalen med din læge om eventuel screening.',
    tip2Title: 'Godt at vide',
    tip2Text: 'Calcium, D-vitamin og vægtbærende fysisk aktivitet er de mest effektive hverdagsvaner til at bevare knoglestyrken på lang sigt.',
    shareMessage: 'Pas på dine knogler — AWA',
  },
  sv: {
    badge: 'KNOGLESUNDHED',
    title: 'Pas på\ndine knogler',
    metaDuration: '6 min läsning',
    metaType: 'Guide',
    metaLevel: 'Mellemniveau',
    metaValidated: 'Gennemset indhold',
    intro: 'Hvorfor menopause öger risikoen for knogleskörhed, och hvordan du beskytter dina knogler i hverdagen.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvorfor menopause sväkker knoglerne',
      'Osteopeni och osteoporose',
      'Screening med knogledensitometri',
      'Forebyggelsens söjler',
      'Faktorer der öger risikoen',
      'Hvad du kan tage med dig',
    ],
    body1: 'Östrogen beskytter naturligt knogletätheden ved at bremse knoglernes nedbrydning. Når östrogenet falder ved menopausen, går knogletabet hurtigere, särligt i de förste år efter, at menstruationen ophörer.',
    body2: 'Osteopeni betyder, at knogletätheden ar under normalen, men annu inte på niveau med osteoporose. Osteoporose ar en mere udtalt knogleskörhed, der öger brudrisikoen – isär ved fald.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Begge ord beskriver en reduktion i knogletäthed, inte et knoglebrydning der redan ar sket – de ar et signal till forebyggelse, inte en grund till bekymring.',
    body3: 'Denne smertefrie undersögelse måler knoglernes mineraltäthed. Den kan anbefales afhängigt av din alder, personlige och familiäre sygehistorik eller andre risikofaktorer identificeret med din läge.',
    preventionHabits: [
      'Calcium (mejeriprodukter, grönne bladgröntsager)',
      'D-vitamin (moderat soleksponering, kost)',
      'Vägtbärende motion (gang, styrketräning)',
      'Begräns tobak och alkohol',
    ],
    riskFactors: [
      'Familiehistorik med osteoporose',
      'Tidlig menopause (för 45 år)',
      'Nuvärende eller tidligere rygning',
      'Meget slank kropsbygning eller mycket lite fysisk aktivitet',
    ],
    alertTitle: 'Bemärk',
    alertText: 'At have én eller flere av disse faktorer betyder inte, at du nödvendigvis vil udvikle osteoporose – de hjälper primärt med at guide samtalen med din läge om eventuel screening.',
    tip2Title: 'Godt at vide',
    tip2Text: 'Calcium, D-vitamin och vägtbärende fysisk aktivitet ar de mest effektive hverdagsvaner till at bevare knoglestyrken på lang sigt.',
    shareMessage: 'Pas på dina knogler — AWA',
  },
  nb: {
    badge: 'BENHELSE',
    title: 'Ta vare på\nskjelettet ditt',
    metaDuration: '6 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Middels',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Hvorfor menopausen øker risikoen for osteoporose, og hvordan du beskytter skjelettet ditt hver dag.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hvorfor menopausen svekker skjelettet',
      'Osteopeni og osteoporose',
      'Undersøkelse med bentetthetsmåling',
      'Pilarene i forebyggingen',
      'Faktorer som øker risikoen',
      'Det viktigste å huske',
    ],
    body1: 'Østrogen bidrar naturlig til å beskytte bentettheten ved å bremse omsetningen i beinvevet. Fallet i østrogen i menopausen fremskynder beintapet, særlig de første årene etter at mensen har opphørt.',
    body2: 'Osteopeni betyr bentetthet som er lavere enn normalt, uten å nå terskelen for osteoporose. Osteoporose er en mer uttalt skjørhet i skjelettet som øker risikoen for brudd, særlig ved fall.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Begge begrepene beskriver tap av bentetthet, ikke et brudd som allerede har skjedd – de er en oppfordring til forebygging, ikke en grunn til bekymring.',
    body3: 'Denne smertefrie undersøkelsen måler mineraltettheten i beinvevet. Den kan tilbys ut fra alderen din, din personlige og familiære sykehistorie eller andre risikofaktorer som er kartlagt sammen med legen din.',
    preventionHabits: [
      'Kalsium (meieriprodukter, bladgrønnsaker)',
      'D-vitamin (moderat soleksponering, kosthold)',
      'Vektbærende trening (gåing, styrketrening)',
      'Begrense tobakk og alkohol',
    ],
    riskFactors: [
      'Osteoporose i familien',
      'Tidlig menopause (før 45 år)',
      'Røyking nå eller tidligere',
      'Svært slank kroppsbygning eller svært lite fysisk aktivitet',
    ],
    alertTitle: 'Merk',
    alertText: 'Å ha en eller flere av disse faktorene betyr ikke at du kommer til å utvikle osteoporose – de er først og fremst til for å veilede samtalen med legen din om mulig undersøkelse.',
    tip2Title: 'Godt å vite',
    tip2Text: 'Kalsium, D-vitamin og vektbærende fysisk aktivitet er fortsatt de mest nyttige hverdagsvanene for å bevare beinstyrken på lang sikt.',
    shareMessage: 'Ta vare på skjelettet ditt – AWA',
  },
  pl: {
    badge: 'ZDROWIE KOŚCI',
    title: 'Dbaj o zdrowie\nswoich kości',
    metaDuration: '6 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Średnio zaawansowany',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Dlaczego menopauza zwiększa ryzyko osteoporozy i jak na co dzień chronić swoje kości.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Dlaczego menopauza osłabia kości',
      'Osteopenia i osteoporoza',
      'Badanie densytometrii kości',
      'Filary profilaktyki',
      'Czynniki zwiększające ryzyko',
      'Co zapamiętać',
    ],
    body1: 'Estrogeny w naturalny sposób pomagają chronić gęstość kości, spowalniając ich przebudowę. Spadek estrogenów w menopauzie przyspiesza utratę masy kostnej, zwłaszcza w pierwszych latach po ustaniu miesiączek.',
    body2: 'Osteopenia oznacza gęstość kości niższą od normy, nieprzekraczającą jednak progu osteoporozy. Osteoporoza to wyraźniejsza kruchość kości, zwiększająca ryzyko złamań, zwłaszcza w razie upadku.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Oba terminy opisują utratę gęstości kości, a nie złamanie, które już nastąpiło — to wezwanie do profilaktyki, a nie powód do niepokoju.',
    body3: 'To bezbolesne badanie mierzy gęstość mineralną kości. Może być zaproponowane w zależności od wieku, historii osobistej i rodzinnej lub innych czynników ryzyka ustalonych z lekarzem.',
    preventionHabits: [
      'Wapń (nabiał, zielone warzywa liściaste)',
      'Witamina D (umiarkowane nasłonecznienie, dieta)',
      'Ćwiczenia z obciążeniem własnym ciała (spacery, trening siłowy)',
      'Ograniczenie tytoniu i alkoholu',
    ],
    riskFactors: [
      'Osteoporoza w rodzinie',
      'Wczesna menopauza (przed 45. rokiem życia)',
      'Obecne lub dawne palenie',
      'Bardzo szczupła budowa lub bardzo mała aktywność fizyczna',
    ],
    alertTitle: 'Zwróć uwagę',
    alertText: 'Obecność jednego lub kilku z tych czynników nie oznacza, że rozwinie się osteoporoza — służą głównie do ukierunkowania rozmowy z lekarzem o ewentualnych badaniach przesiewowych.',
    tip2Title: 'Warto wiedzieć',
    tip2Text: 'Wapń, witamina D i aktywność fizyczna z obciążeniem pozostają najbardziej pomocnymi codziennymi nawykami dla długotrwałego zachowania mocnych kości.',
    shareMessage: 'Dbaj o zdrowie swoich kości — AWA',
  },
  uk: {
    badge: 'ЗДОРОВ’Я КІСТОК',
    title: 'Дбайте про здоров’я\nсвоїх кісток',
    metaDuration: '6 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Середній',
    metaValidated: 'Перевірений вміст',
    intro: 'Чому менопауза підвищує ризик остеопорозу та як щодня захищати свої кістки.',
    contentsTitle: 'У цій статті',
    topics: [
      'Чому менопауза послаблює кістки',
      'Остеопенія та остеопороз',
      'Скринінг за допомогою денситометрії кісток',
      'Опори профілактики',
      'Чинники, що підвищують ризик',
      'Що запам’ятати',
    ],
    body1: 'Естроген природно допомагає захищати щільність кісток, уповільнюючи їхню перебудову. Зниження естрогену в менопаузі прискорює втрату кісткової маси, особливо в перші роки після припинення менструацій.',
    body2: 'Остеопенія означає щільність кісток нижчу за норму, що не сягає порогу остеопорозу. Остеопороз — це виразніша крихкість кісток, що підвищує ризик переломів, особливо у разі падіння.',
    tip1Title: 'Варто знати',
    tip1Text: 'Обидва терміни описують втрату щільності кісток, а не перелом, що вже стався, — це привід для профілактики, а не для занепокоєння.',
    body3: 'Це безболісне обстеження вимірює мінеральну щільність кісток. Його можуть запропонувати залежно від віку, особистої та сімейної історії чи інших чинників ризику, визначених разом із лікарем.',
    preventionHabits: [
      'Кальцій (молочні продукти, зелені листові овочі)',
      'Вітамін D (помірне перебування на сонці, харчування)',
      'Вправи з навантаженням власною вагою (ходьба, силові тренування)',
      'Обмеження тютюну й алкоголю',
    ],
    riskFactors: [
      'Остеопороз у сімейній історії',
      'Рання менопауза (до 45 років)',
      'Паління зараз або в минулому',
      'Дуже худорлява будова або дуже низька фізична активність',
    ],
    alertTitle: 'Зверніть увагу',
    alertText: 'Наявність одного чи кількох із цих чинників не означає, що в вас розвинеться остеопороз — вони головно допомагають спрямувати розмову з лікарем про можливий скринінг.',
    tip2Title: 'Варто знати',
    tip2Text: 'Кальцій, вітамін D і фізична активність із навантаженням залишаються найкориснішими щоденними звичками для довготривалого збереження міцності кісток.',
    shareMessage: 'Дбайте про здоров’я своїх кісток — AWA',
  },
  cs: {
    badge: 'ZDRAVÍ KOSTÍ',
    title: 'Péče o\nzdraví vašich kostí',
    metaDuration: '6 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Pokročilý',
    metaValidated: 'Ověřený obsah',
    intro: 'Proč menopauza zvyšuje riziko osteoporózy a jak každodenně chránit své kosti.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Proč menopauza oslabuje kosti',
      'Osteopenie a osteoporóza',
      'Vyšetření denzitometrií',
      'Pilíře prevence',
      'Faktory, které zvyšují riziko',
      'Co si zapamatovat',
    ],
    body1: 'Estrogen přirozeně pomáhá chránit hustotu kostí tím, že zpomaluje jejich přestavbu. Pokles estrogenu v menopauze urychluje úbytek kostní hmoty, zejména v prvních letech po ukončení menstruace.',
    body2: 'Osteopenie označuje nižší hustotu kostí, než je normální, aniž by dosáhla hranice osteoporózy. Osteoporóza je výraznější křehkost kostí, která zvyšuje riziko zlomenin, zejména při pádu.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Oba pojmy popisují úbytek kostní hustoty, nikoli již proběhlou zlomeninu — jsou podnětem k prevenci, ne důvodem k obavám.',
    body3: 'Toto bezbolestné vyšetření měří kostní minerální hustotu. Může vám být nabídnuto podle věku, osobní a rodinné anamnézy nebo jiných rizikových faktorů zjištěných s vaším lékařem.',
    preventionHabits: [
      'Vápník (mléčné výrobky, listová zelenina)',
      'Vitamin D (mírné vystavení slunci, strava)',
      'Cvičení se zátěží (chůze, silový trénink)',
      'Omezit tabák a alkohol',
    ],
    riskFactors: [
      'Osteoporóza v rodině',
      'Předčasná menopauza (před 45. rokem věku)',
      'Současné nebo dřívější kouření',
      'Velmi štíhlá postava nebo velmi nízká fyzická aktivita',
    ],
    alertTitle: 'Upozornění',
    alertText: 'Mít jeden nebo více z těchto faktorů neznamená, že osteoporózu dostanete — slouží především jako podklad pro rozhovor s lékařem o možném vyšetření.',
    tip2Title: 'Stojí za to vědět',
    tip2Text: 'Vápník, vitamin D a fyzická aktivita se zátěží zůstávají nejužitečnějšími každodenními návyky pro dlouhodobé zachování pevnosti kostí.',
    shareMessage: 'Péče o zdraví vašich kostí — AWA',
  },
  sk: {
    badge: 'ZDRAVIE KOSTÍ',
    title: 'Starostlivosť\no zdravie vašich kostí',
    metaDuration: '6 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Stredne pokročilý',
    metaValidated: 'Overený obsah',
    intro: 'Prečo menopauza zvyšuje riziko osteoporózy a ako si každý deň chrániť kosti.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Prečo menopauza oslabuje kosti',
      'Osteopénia a osteoporóza',
      'Vyšetrenie kostnou denzitometriou',
      'Piliere prevencie',
      'Faktory zvyšujúce riziko',
      'Čo si zapamätať',
    ],
    body1: 'Estrogén prirodzene pomáha chrániť hustotu kostí tým, že spomaľuje ich obnovu. Pokles estrogénu v menopauze urýchľuje úbytok kostnej hmoty, najmä v prvých rokoch po zastavení menštruácie.',
    body2: 'Osteopénia označuje nižšiu hustotu kostí, než je normálne, bez dosiahnutia prahu osteoporózy. Osteoporóza je výraznejšia krehkosť kostí, ktorá zvyšuje riziko zlomenín, najmä pri páde.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Oba pojmy opisujú úbytok kostnej hustoty, nie zlomeninu, ktorá už nastala — sú podnetom na prevenciu, nie dôvodom na obavy.',
    body3: 'Toto bezbolestné vyšetrenie meria minerálnu hustotu kostí. Môže sa ponúknuť podľa veku, osobnej a rodinnej anamnézy alebo iných rizikových faktorov zistených s vaším lekárom.',
    preventionHabits: [
      'Vápnik (mliečne výrobky, listová zelenina)',
      'Vitamín D (mierne vystavenie slnku, strava)',
      'Cvičenie so záťažou (chôdza, silový tréning)',
      'Obmedziť tabak a alkohol',
    ],
    riskFactors: [
      'Osteoporóza v rodine',
      'Skorá menopauza (pred 45. rokom)',
      'Súčasné alebo minulé fajčenie',
      'Veľmi štíhla postava alebo veľmi nízka fyzická aktivita',
    ],
    alertTitle: 'Upozornenie',
    alertText: 'Ak máte jeden alebo viac z týchto faktorov, neznamená to, že osteoporózu dostanete — slúžia najmä na usmernenie rozhovoru s lekárom o prípadnom vyšetrení.',
    tip2Title: 'Stojí za to vedieť',
    tip2Text: 'Vápnik, vitamín D a fyzická aktivita so záťažou zostávajú najužitočnejšími každodennými návykmi na dlhodobé udržanie pevnosti kostí.',
    shareMessage: 'Starostlivosť o zdravie vašich kostí — AWA',
  },
  hu: {
    badge: 'CSONTEGÉSZSÉG',
    title: 'Gondoskodj\na csontjaid egészségéről',
    metaDuration: '6 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Középhaladó',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Miért növeli a menopauza a csontritkulás kockázatát, és hogyan védd a csontjaidat mindennap.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Miért gyengíti a menopauza a csontokat',
      'Csontritkulás előfázisa és csontritkulás',
      'Csontsűrűségmérés',
      'A megelőzés alappillérei',
      'A kockázatot növelő tényezők',
      'Amit érdemes megjegyezni',
    ],
    body1: 'Az ösztrogén természetes módon védi a csontsűrűséget azáltal, hogy lassítja a csontátépülést. Az ösztrogénszint menopauza alatti csökkenése felgyorsítja a csontvesztést, különösen a menstruáció megszűnését követő első években.',
    body2: 'A csontritkulás előfázisa a normálisnál alacsonyabb csontsűrűséget jelenti, a csontritkulás küszöbének elérése nélkül. A csontritkulás kifejezettebb csonttörékenység, amely növeli a törés kockázatát, különösen esés esetén.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'Mindkét kifejezés a csontsűrűség csökkenését írja le, nem egy már bekövetkezett törést — a megelőzésre ösztönöznek, nem aggodalomra.',
    body3: 'Ez a fájdalommentes vizsgálat a csont ásványianyag-sűrűségét méri. Az életkorod, a személyes és családi előzményeid vagy az orvosoddal azonosított egyéb kockázati tényezők alapján ajánlható.',
    preventionHabits: [
      'Kalcium (tejtermékek, leveles zöldségek)',
      'D-vitamin (mérsékelt napozás, étrend)',
      'Súlyhordó testmozgás (gyaloglás, erősítő edzés)',
      'A dohányzás és az alkohol korlátozása',
    ],
    riskFactors: [
      'Csontritkulás a családban',
      'Korai menopauza (45 éves kor előtt)',
      'Jelenlegi vagy korábbi dohányzás',
      'Nagyon sovány testalkat vagy nagyon alacsony fizikai aktivitás',
    ],
    alertTitle: 'Figyelem',
    alertText: 'Az, hogy ezek közül egy vagy több tényező fennáll, nem jelenti azt, hogy csontritkulásod lesz — főként arra szolgálnak, hogy irányt adjanak az orvossal folytatott beszélgetésnek az esetleges szűrésről.',
    tip2Title: 'Érdemes tudni',
    tip2Text: 'A kalcium, a D-vitamin és a súlyhordó testmozgás maradnak a leghasznosabb mindennapi szokások a csontok szilárdságának hosszú távú megőrzéséhez.',
    shareMessage: 'Gondoskodj a csontjaid egészségéről — AWA',
  },
  ro: {
    badge: 'SĂNĂTATEA OASELOR',
    title: 'Grija pentru\nsănătatea oaselor tale',
    metaDuration: '6 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Intermediar',
    metaValidated: 'Conținut revizuit',
    intro: 'De ce menopauza crește riscul de osteoporoză și cum îți protejezi oasele zi de zi.',
    contentsTitle: 'În acest articol',
    topics: [
      'De ce menopauza slăbește oasele',
      'Osteopenia și osteoporoza',
      'Depistarea prin osteodensitometrie',
      'Pilonii prevenției',
      'Factori care cresc riscul',
      'Ce să reții',
    ],
    body1: 'Estrogenul ajută în mod natural la protejarea densității osoase, încetinind remodelarea osoasă. Scăderea estrogenului din menopauză accelerează pierderea de masă osoasă, mai ales în primii ani după oprirea menstruației.',
    body2: 'Osteopenia desemnează o densitate osoasă mai mică decât cea normală, fără a atinge pragul osteoporozei. Osteoporoza este o fragilitate osoasă mai accentuată, care crește riscul de fractură, în special în caz de cădere.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Ambii termeni descriu o pierdere de densitate osoasă, nu o fractură care a avut deja loc — sunt un îndemn la prevenție, nu un motiv de îngrijorare.',
    body3: 'Acest examen nedureros măsoară densitatea minerală osoasă. Poate fi propus în funcție de vârsta ta, de antecedentele personale și familiale sau de alți factori de risc identificați împreună cu medicul tău.',
    preventionHabits: [
      'Calciu (lactate, legume cu frunze verzi)',
      'Vitamina D (expunere moderată la soare, alimentație)',
      'Exerciții cu greutate (mers, antrenament de forță)',
      'Limitarea tutunului și a alcoolului',
    ],
    riskFactors: [
      'Antecedente familiale de osteoporoză',
      'Menopauză precoce (înainte de 45 de ani)',
      'Fumat actual sau din trecut',
      'O constituție foarte slabă sau o activitate fizică foarte redusă',
    ],
    alertTitle: 'Atenție',
    alertText: 'Faptul că ai unul sau mai mulți dintre acești factori nu înseamnă că vei face osteoporoză — ei servesc mai ales la orientarea discuției cu medicul tău despre o eventuală depistare.',
    tip2Title: 'Bine de știut',
    tip2Text: 'Calciul, vitamina D și activitatea fizică cu greutate rămân cele mai utile obiceiuri zilnice pentru a-ți păstra pe termen lung rezistența oaselor.',
    shareMessage: 'Grija pentru sănătatea oaselor tale — AWA',
  },
  bg: {
    badge: 'ЗДРАВЕ НА КОСТИТЕ',
    title: 'Грижа за\nздравето на костите ти',
    metaDuration: '6 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Средно ниво',
    metaValidated: 'Проверено съдържание',
    intro: 'Защо менопаузата увеличава риска от остеопороза и как да защитаваш костите си всеки ден.',
    contentsTitle: 'В тази статия',
    topics: [
      'Защо менопаузата отслабва костите',
      'Остеопения и остеопороза',
      'Откриване чрез костна денситометрия',
      'Стълбовете на профилактиката',
      'Фактори, които увеличават риска',
      'Какво да запомниш',
    ],
    body1: 'Естрогенът естествено помага за защитата на костната плътност, като забавя костното обновяване. Спадът на естрогена по време на менопаузата ускорява загубата на костна маса, особено през първите няколко години след спиране на менструацията.',
    body2: 'Остеопенията означава костна плътност, по-ниска от нормалната, без да достига прага на остеопорозата. Остеопорозата е по-изразена костна чупливост, която увеличава риска от фрактура, особено при падане.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'И двата термина описват загуба на костна плътност, а не вече настъпила фрактура — те са покана за профилактика, а не причина за тревога.',
    body3: 'Този безболезнен преглед измерва костната минерална плътност. Може да ти бъде предложен според възрастта ти, личната и семейната ти анамнеза или други рискови фактори, установени заедно с лекаря ти.',
    preventionHabits: [
      'Калций (млечни продукти, зелени листни зеленчуци)',
      'Витамин D (умерено излагане на слънце, хранене)',
      'Упражнения с тежест (ходене, силови тренировки)',
      'Ограничаване на тютюна и алкохола',
    ],
    riskFactors: [
      'Семейна анамнеза за остеопороза',
      'Ранна менопауза (преди 45-годишна възраст)',
      'Настоящо или минало пушене',
      'Много слабо телосложение или много ниска физическа активност',
    ],
    alertTitle: 'Обърни внимание',
    alertText: 'Наличието на един или повече от тези фактори не означава, че ще развиеш остеопороза — те служат най-вече за насочване на разговора с лекаря ти за евентуално изследване.',
    tip2Title: 'Добре е да знаеш',
    tip2Text: 'Калцият, витамин D и физическата активност с тежест остават най-полезните ежедневни навици за дългосрочно запазване на здравината на костите.',
    shareMessage: 'Грижа за здравето на костите ти — AWA',
  },
  sr: {
    badge: 'ЗДРАВЉЕ КОСТИЈУ',
    title: 'Брига о\nздрављу твојих костију',
    metaDuration: '6 мин читања',
    metaType: 'Водич',
    metaLevel: 'Средњи ниво',
    metaValidated: 'Проверен садржај',
    intro: 'Зашто менопауза повећава ризик од остеопорозе и како да штитиш кости сваки дан.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Зашто менопауза слаби кости',
      'Остеопенија и остеопороза',
      'Скрининг денситометријом костију',
      'Стубови превенције',
      'Фактори који повећавају ризик',
      'Шта да запамтиш',
    ],
    body1: 'Естроген природно помаже у заштити густине костију успоравањем обнављања коштаног ткива. Пад естрогена у менопаузи убрзава губитак костију, нарочито у првих неколико година после престанка менструације.',
    body2: 'Остеопенија означава густину костију нижу од нормалне, без достизања прага за остеопорозу. Остеопороза је израженија слабост костију која повећава ризик од прелома, нарочито у случају пада.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Оба појма описују губитак густине костију, а не већ настао прелом — они су подстицај за превенцију, а не разлог за бригу.',
    body3: 'Овај безболни преглед мери минералну густину костију. Може се предложити на основу твојих година, личне и породичне историје или других фактора ризика утврђених са лекаром.',
    preventionHabits: [
      'Калцијум (млечни производи, лиснато поврће)',
      'Витамин D (умерено излагање сунцу, исхрана)',
      'Вежбање са оптерећењем (ходање, тренинг снаге)',
      'Ограничи дуван и алкохол',
    ],
    riskFactors: [
      'Породична историја остеопорозе',
      'Рана менопауза (пре 45. године)',
      'Садашње или прошло пушење',
      'Веома витка грађа или веома ниска физичка активност',
    ],
    alertTitle: 'Обрати пажњу',
    alertText: 'Присуство једног или више ових фактора не значи да ћеш развити остеопорозу — они су ту углавном да усмере разговор са лекаром о евентуалном скринингу.',
    tip2Title: 'Добро је знати',
    tip2Text: 'Калцијум, витамин D и физичка активност са оптерећењем остају најкорисније свакодневне навике за дугорочно очување снаге костију.',
    shareMessage: 'Брига о здрављу костију — AWA',
  },
  hr: {
    badge: 'ZDRAVLJE KOSTIJU',
    title: 'Brini o\nzdravlju svojih kostiju',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Zašto menopauza povećava rizik od osteoporoze i kako svaki dan zaštititi kosti.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Zašto menopauza slabi kosti',
      'Osteopenija i osteoporoza',
      'Probir denzitometrijom kostiju',
      'Stupovi prevencije',
      'Čimbenici koji povećavaju rizik',
      'Što zapamtiti',
    ],
    body1: 'Estrogen prirodno pomaže u zaštiti gustoće kostiju jer usporava njihovu pregradnju. Pad estrogena u menopauzi ubrzava gubitak koštane mase, osobito u prvim godinama nakon prestanka menstruacije.',
    body2: 'Osteopenija označava gustoću kostiju nižu od uobičajene, bez dosezanja praga osteoporoze. Osteoporoza je izraženija krhkost kostiju koja povećava rizik od prijeloma, osobito pri padu.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Oba pojma opisuju gubitak gustoće kostiju, a ne već nastali prijelom — poziv su na prevenciju, a ne razlog za zabrinutost.',
    body3: 'Ova bezbolna pretraga mjeri mineralnu gustoću kostiju. Može se predložiti ovisno o tvojoj dobi, osobnoj i obiteljskoj anamnezi ili drugim čimbenicima rizika utvrđenima s liječnikom.',
    preventionHabits: [
      'Kalcij (mliječni proizvodi, lisnato zeleno povrće)',
      'Vitamin D (umjereno izlaganje suncu, prehrana)',
      'Vježbe s opterećenjem (hodanje, trening snage)',
      'Ograničavanje duhana i alkohola',
    ],
    riskFactors: [
      'Obiteljska povijest osteoporoze',
      'Rana menopauza (prije 45. godine)',
      'Trenutačno ili prijašnje pušenje',
      'Vrlo vitka građa ili vrlo mala tjelesna aktivnost',
    ],
    alertTitle: 'Napomena',
    alertText: 'Prisutnost jednog ili više ovih čimbenika ne znači da ćeš razviti osteoporozu — oni prije svega služe kao putokaz za razgovor s liječnikom o mogućem probiru.',
    tip2Title: 'Dobro je znati',
    tip2Text: 'Kalcij, vitamin D i tjelesna aktivnost s opterećenjem ostaju najkorisnije svakodnevne navike za dugoročno očuvanje čvrstoće kostiju.',
    shareMessage: 'Briga o zdravlju kostiju — AWA',
  },
  bs: {
    badge: 'ZDRAVLJE KOSTIJU',
    title: 'Brini o\nzdravlju svojih kostiju',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Zašta menopauza povećava rizik od osteoporoze i kako svaki dan zaštititi kosti.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Zašta menopauza slabi kosti',
      'Osteopenija i osteoporoza',
      'Probir denzitometrijom kostiju',
      'Stupovi prevencije',
      'Čimbenici koji povećavaju rizik',
      'Što zapamtiti',
    ],
    body1: 'Estrogen prirodno pomaže u zaštiti gustoće kostiju jer usporava njihovu pregradnju. Pad estrogena u menopauzi ubrzava gubitak koštane mase, osobito u prvim godinama nakon prestanka menstruacije.',
    body2: 'Osteopenija označava gustoću kostiju nižu od uobičajene, bez dosezanja praga osteoporoze. Osteoporoza je izraženija krhkost kostiju koja povećava rizik od prijeloma, osobito pri padu.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Oba pojma opisuju gubitak gustoće kostiju, a ne već nastali prijelom — poziv su na prevenciju, a ne razlog za zabrinutost.',
    body3: 'Ova bezbolna pretraga mjeri mineralnu gustoću kostiju. Može se predložiti ovisno o tvojoj dobi, osobnoj i obiteljskoj anamnezi ili drugim čimbenicima rizika utvrđenima s ljekarom.',
    preventionHabits: [
      'Kalcij (mliječni proizvodi, lisnato zeleno povrće)',
      'Vitamin D (umjereno izlaganje suncu, ishrana)',
      'Vježbe s opterećenjem (hodanje, trening snage)',
      'Ograničavanje duhana i alkohola',
    ],
    riskFactors: [
      'Obiteljska povijest osteoporoze',
      'Rana menopauza (prije 45. godine)',
      'Trenutno ili prijašnje pušenje',
      'Vrlo vitka građa ili vrlo mala tjelesna aktivnost',
    ],
    alertTitle: 'Napomena',
    alertText: 'Prisutnost jednog ili više ovih čimbenika ne znači da ćeš razviti osteoporozu — oni prije svega služe kao putokaz za razgovor s ljekarom o mogućem probiru.',
    tip2Title: 'Dobro je znati',
    tip2Text: 'Kalcij, vitamin D i tjelesna aktivnost s opterećenjem ostaju najkorisnije svakodnevne navike za dugoročno očuvanje čvrstoće kostiju.',
    shareMessage: 'Briga o zdravlju kostiju — AWA',
  },
  sl: {
    badge: 'ZDRAVJE KOSTI',
    title: 'Poskrbi za\nzdravje svojih kosti',
    metaDuration: '6 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Srednja raven',
    metaValidated: 'Preverjena vsebina',
    intro: 'Zakaj menopavza povečuje tveganje za osteoporozo in kako vsak dan zaščititi kosti.',
    contentsTitle: 'V tem članku',
    topics: [
      'Zakaj menopavza slabi kosti',
      'Osteopenija in osteoporoza',
      'Presejanje z denzitometrijo kosti',
      'Stebri preprečevanja',
      'Dejavniki, ki povečujejo tveganje',
      'Kaj si zapomniti',
    ],
    body1: 'Estrogen naravno pomaga varovati gostoto kosti, saj upočasnjuje njihovo prenavljanje. Padec estrogena v menopavzi pospeši izgubo kostne mase, zlasti v prvih letih po prenehanju menstruacije.',
    body2: 'Osteopenija pomeni gostoto kosti, nižjo od običajne, ne da bi dosegla prag osteoporoze. Osteoporoza je izrazitejša krhkost kosti, ki povečuje tveganje za zlome, zlasti ob padcu.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Oba pojma opisujeta izgubo gostote kosti, ne že nastalega zloma — sta poziv k preprečevanju, ne razlog za zaskrbljenost.',
    body3: 'Ta neboleča preiskava meri mineralno gostoto kosti. Lahko se predlaga glede na tvojo starost, osebno in družinsko anamnezo ali druge dejavnike tveganja, določene z zdravnikom.',
    preventionHabits: [
      'Kalcij (mlečni izdelki, listnata zelenjava)',
      'Vitamin D (zmerna izpostavljenost soncu, prehrana)',
      'Vadba z obremenitvijo (hoja, trening moči)',
      'Omejevanje tobaka in alkohola',
    ],
    riskFactors: [
      'Družinska zgodovina osteoporoze',
      'Zgodnja menopavza (pred 45. letom)',
      'Trenutno ali preteklo kajenje',
      'Zelo vitka postava ali zelo majhna telesna dejavnost',
    ],
    alertTitle: 'Opomba',
    alertText: 'Prisotnost enega ali več teh dejavnikov ne pomeni, da boš zbolela za osteoporozo — služijo predvsem kot izhodišče za pogovor z zdravnikom o morebitnem presejanju.',
    tip2Title: 'Vredno vedeti',
    tip2Text: 'Kalcij, vitamin D in telesna dejavnost z obremenitvijo ostajajo najkoristnejše vsakodnevne navade za dolgoročno ohranjanje trdnosti kosti.',
    shareMessage: 'Skrb za zdravje kosti — AWA',
  },
  ne: {
    badge: 'हड्डीको स्वास्थ्य',
    title: 'आफ्नो हड्डीको स्वास्थ्यको\nख्याल राख्नुहोस्',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'रजोनिवृत्तिले अस्टियोपोरोसिसको जोखिम किन बढाउँछ, र आफ्ना हड्डीहरूलाई दैनिक कसरी जोगाउने।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'रजोनिवृत्तिले हड्डी किन कमजोर बनाउँछ',
      'अस्टियोपेनिया र अस्टियोपोरोसिस',
      'हड्डी घनत्व मापनद्वारा जाँच',
      'रोकथामका आधारस्तम्भहरू',
      'जोखिम बढाउने कारकहरू',
      'सम्झनुपर्ने कुराहरू',
    ],
    body1: 'एस्ट्रोजेनले हड्डीको पुनर्निर्माणको गति घटाएर स्वाभाविक रूपमा हड्डीको घनत्व जोगाउन मद्दत गर्छ। रजोनिवृत्तिमा एस्ट्रोजेन घट्दा हड्डी क्षय छिटो हुन्छ, विशेष गरी महिनावारी बन्द भएपछिका पहिलो केही वर्षमा।',
    body2: 'अस्टियोपेनियाले सामान्यभन्दा कम हड्डी घनत्वलाई जनाउँछ, जुन अस्टियोपोरोसिसको सीमासम्म पुगेको हुँदैन। अस्टियोपोरोसिस बढी स्पष्ट हड्डीको कमजोरी हो जसले, विशेष गरी लडाइको अवस्थामा, भाँचिने जोखिम बढाउँछ।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'दुवै शब्दले हड्डीको घनत्वमा कमीलाई वर्णन गर्छन्, पहिले नै भएको भाँचिएको अवस्थालाई होइन — ती रोकथामका लागि सङ्केत हुन्, चिन्ताको कारण होइनन्।',
    body3: 'यो दुखाइरहित परीक्षणले हड्डीको खनिज घनत्व नाप्छ। तपाईंको उमेर, व्यक्तिगत र पारिवारिक इतिहास, वा चिकित्सकसँग पहिचान गरिएका अन्य जोखिम कारकहरूअनुसार यो प्रस्ताव गरिन सक्छ।',
    preventionHabits: [
      'क्यालसियम (दुग्ध पदार्थ, हरियो पातदार सागपात)',
      'भिटामिन डी (मध्यम घाम, खानपान)',
      'तौल बोक्ने व्यायाम (हिँडाइ, शक्ति प्रशिक्षण)',
      'तम्बाकू र मदिरा सीमित गर्ने',
    ],
    riskFactors: [
      'अस्टियोपोरोसिसको पारिवारिक इतिहास',
      'चाँडो रजोनिवृत्ति (45 वर्षअघि)',
      'हाल वा विगतमा धूम्रपान',
      'निकै दुब्लो शरीर वा निकै कम शारीरिक गतिविधि',
    ],
    alertTitle: 'कृपया ध्यान दिनुहोस्',
    alertText: 'यी एक वा बढी कारकहरू हुनुको अर्थ तपाईंलाई अस्टियोपोरोसिस हुन्छ भन्ने होइन — ती मुख्यतया सम्भावित जाँचबारे चिकित्सकसँगको कुराकानीलाई मार्गदर्शन गर्न हुन्।',
    tip2Title: 'जान्न लायक',
    tip2Text: 'क्यालसियम, भिटामिन डी र तौल बोक्ने शारीरिक गतिविधि लामो समयसम्म हड्डीको बल जोगाउने सबैभन्दा उपयोगी दैनिक बानीहरू हुन्।',
    shareMessage: 'आफ्नो हड्डीको स्वास्थ्यको ख्याल राख्नुहोस् — AWA',
  },
  si: {
    badge: 'අස්ථි සෞඛ්‍යය',
    title: 'ඔබේ අස්ථි සෞඛ්‍යය\nගැන සැලකිලිමත් වීම',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'මධ්‍යම',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඔසප් නැවතීම අස්ථි සුෂිරතා අවදානම වැඩි කරන්නේ ඇයි, සහ දිනපතා ඔබේ අස්ථි ආරක්ෂා කරන්නේ කෙසේද.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'ඔසප් නැවතීම අස්ථි දුර්වල කරන්නේ ඇයි',
      'අස්ථි විරලතාව සහ අස්ථි සුෂිරතාව',
      'අස්ථි ඝනත්ව පරීක්ෂාව මගින් පරීක්ෂා කිරීම',
      'වැළැක්වීමේ ප්‍රධාන ආධාරකයන්',
      'අවදානම වැඩි කරන සාධක',
      'මතක තබාගත යුතු දේ',
    ],
    body1: 'එස්ට්‍රජන් ස්වභාවිකවම අස්ථි පුනර්නිර්මාණය මන්දගාමී කිරීමෙන් අස්ථි ඝනත්වය ආරක්ෂා කිරීමට උපකාරී වේ. ඔසප් නැවතීමේදී එස්ට්‍රජන් පහත වැටීම, විශේෂයෙන් ඔබේ ඔසප් නතර වී පළමු වසර කිහිපය තුළ, අස්ථි අහිමි වීම වේගවත් කරයි.',
    body2: 'අස්ථි විරලතාව යනු අස්ථි සුෂිරතාවේ සීමාවට නොපැමිණ, සාමාන්‍යයට වඩා අඩු අස්ථි ඝනත්වයයි. අස්ථි සුෂිරතාව යනු, විශේෂයෙන් වැටීමකදී, අස්ථි බිඳීමේ අවදානම වැඩි කරන, වඩාත් කැපී පෙනෙන අස්ථි බිඳෙනසුලු බවකි.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'පද දෙකම විස්තර කරන්නේ අස්ථි ඝනත්වය අහිමි වීමක් මිස, දැනටමත් සිදු වූ අස්ථි බිඳීමක් නොවේ — ඒවා වැළැක්වීමට පෙළඹවීමක් මිස කනස්සල්ලට හේතුවක් නොවේ.',
    body3: 'වේදනාවක් නොමැති මෙම පරීක්ෂණය අස්ථි ඛනිජ ඝනත්වය මනිනු ලබයි. ඔබේ වයස, ඔබේ පෞද්ගලික සහ පවුලේ ඉතිහාසය, හෝ ඔබේ වෛද්‍යවරයා සමඟ හඳුනාගත් වෙනත් අවදානම් සාධක අනුව එය යෝජනා කළ හැක.',
    preventionHabits: [
      'කැල්සියම් (කිරි නිෂ්පාදන, කොළ පැහැති එළවළු)',
      'විටමින් D (මධ්‍යස්ථ හිරු එළිය, ආහාර)',
      'බර දරන ව්‍යායාම (ඇවිදීම, ශක්ති පුහුණුව)',
      'දුම්කොළ සහ මත්පැන් සීමා කරන්න',
    ],
    riskFactors: [
      'අස්ථි සුෂිරතාවේ පවුල් ඉතිහාසයක්',
      'කල් ඇතිව ඔසප් නැවතීම (වයස 45ට පෙර)',
      'වත්මන් හෝ අතීත දුම්පානය',
      'ඉතා කෙට්ටු ශරීරයක් හෝ ඉතා අඩු ශාරීරික ක්‍රියාකාරකම',
    ],
    alertTitle: 'කරුණාකර සටහන් කරන්න',
    alertText: 'මෙම සාධකවලින් එකක් හෝ කිහිපයක් තිබීම ඔබට අස්ථි සුෂිරතාව ඇතිවන බව අදහස් නොවේ — ඒවා ප්‍රධාන වශයෙන් ඇත්තේ ඇතැම් විට සිදුකළ හැකි පරීක්ෂාවක් ගැන ඔබේ වෛද්‍යවරයා සමඟ සංවාදය මඟ පෙන්වීමටයි.',
    tip2Title: 'දැනගත යුතු දේ',
    tip2Text: 'කැල්සියම්, විටමින් D සහ බර දරන ශාරීරික ක්‍රියාකාරකම, දිගුකාලීනව අස්ථි ශක්තිය ආරක්ෂා කර ගැනීමට වඩාත්ම ප්‍රයෝජනවත් එදිනෙදා පුරුදු ලෙස පවතී.',
    shareMessage: 'ඔබේ අස්ථි සෞඛ්‍යය ගැන සැලකිලිමත් වීම — AWA',
  },
  th: {
    badge: 'สุขภาพกระดูก',
    title: 'ดูแล\nสุขภาพกระดูกของคุณ',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'ปานกลาง',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ทำไมวัยหมดประจำเดือนจึงเพิ่มความเสี่ยงของโรคกระดูกพรุน และปกป้องกระดูกของคุณทุกวันได้อย่างไร',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ทำไมวัยหมดประจำเดือนทำให้กระดูกอ่อนแอลง',
      'ภาวะกระดูกบางและโรคกระดูกพรุน',
      'การตรวจคัดกรองด้วยการวัดความหนาแน่นของกระดูก',
      'เสาหลักของการป้องกัน',
      'ปัจจัยที่เพิ่มความเสี่ยง',
      'สิ่งที่ควรจำ',
    ],
    body1: 'เอสโตรเจนช่วยปกป้องความหนาแน่นของกระดูกโดยชะลอการสร้างและสลายกระดูกตามธรรมชาติ การลดลงของเอสโตรเจนในวัยหมดประจำเดือนทำให้มวลกระดูกสูญเสียเร็วขึ้น โดยเฉพาะในช่วงไม่กี่ปีแรกหลังประจำเดือนหยุด',
    body2: 'ภาวะกระดูกบางหมายถึงความหนาแน่นของกระดูกที่ต่ำกว่าปกติ แต่ยังไม่ถึงเกณฑ์ของโรคกระดูกพรุน ส่วนโรคกระดูกพรุนคือความเปราะบางของกระดูกที่ชัดเจนกว่า เพิ่มความเสี่ยงของกระดูกหัก โดยเฉพาะเมื่อหกล้ม',
    tip1Title: 'ควรรู้',
    tip1Text: 'ทั้งสองคำอธิบายการสูญเสียความหนาแน่นของกระดูก ไม่ใช่กระดูกหักที่เกิดขึ้นแล้ว — เป็นสัญญาณให้ป้องกัน ไม่ใช่เหตุให้กังวล',
    body3: 'การตรวจนี้ไม่เจ็บและวัดความหนาแน่นของแร่ธาตุในกระดูก อาจแนะนำตามอายุ ประวัติส่วนตัวและครอบครัว หรือปัจจัยเสี่ยงอื่นที่ระบุร่วมกับแพทย์ของคุณ',
    preventionHabits: [
      'แคลเซียม (ผลิตภัณฑ์นม ผักใบเขียว)',
      'วิตามินดี (รับแดดพอเหมาะ อาหาร)',
      'การออกกำลังกายแบบแบกรับน้ำหนัก (เดิน เวทเทรนนิ่ง)',
      'จำกัดบุหรี่และแอลกอฮอล์',
    ],
    riskFactors: [
      'ประวัติโรคกระดูกพรุนในครอบครัว',
      'วัยหมดประจำเดือนก่อนวัย (ก่อนอายุ 45 ปี)',
      'สูบบุหรี่อยู่หรือเคยสูบ',
      'รูปร่างผอมมากหรือมีกิจกรรมทางกายน้อยมาก',
    ],
    alertTitle: 'โปรดทราบ',
    alertText: 'การมีปัจจัยหนึ่งอย่างหรือมากกว่านั้นไม่ได้หมายความว่าคุณจะเป็นโรคกระดูกพรุน — ปัจจัยเหล่านี้มีไว้เพื่อช่วยนำทางการพูดคุยกับแพทย์เรื่องการตรวจคัดกรองที่เป็นไปได้เป็นหลัก',
    tip2Title: 'ควรรู้',
    tip2Text: 'แคลเซียม วิตามินดี และกิจกรรมทางกายแบบแบกรับน้ำหนัก ยังคงเป็นนิสัยประจำวันที่มีประโยชน์ที่สุดในการรักษาความแข็งแรงของกระดูกในระยะยาว',
    shareMessage: 'ดูแลสุขภาพกระดูกของคุณ — AWA',
  },
  vi: {
    badge: 'SỨC KHỎE XƯƠNG',
    title: 'Chăm sóc\nsức khỏe xương của bạn',
    metaDuration: '6 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Trung cấp',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Tại sao mãn kinh làm tăng nguy cơ loãng xương và cách bảo vệ xương của bạn mỗi ngày.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Tại sao mãn kinh làm yếu xương',
      'Thiếu xương và loãng xương',
      'Tầm soát bằng đo mật độ xương',
      'Các trụ cột của phòng ngừa',
      'Các yếu tố làm tăng nguy cơ',
      'Điều cần nhớ',
    ],
    body1: 'Estrogen giúp bảo vệ mật độ xương một cách tự nhiên bằng cách làm chậm quá trình luân chuyển xương. Sự sụt giảm estrogen trong thời kỳ mãn kinh đẩy nhanh việc mất xương, đặc biệt trong vài năm đầu sau khi kỳ kinh ngừng.',
    body2: 'Thiếu xương chỉ mật độ xương thấp hơn bình thường, chưa đạt ngưỡng loãng xương. Loãng xương là tình trạng xương dễ gãy rõ rệt hơn, làm tăng nguy cơ gãy xương, đặc biệt khi bị ngã.',
    tip1Title: 'Nên biết',
    tip1Text: 'Cả hai thuật ngữ đều mô tả sự mất mật độ xương, không phải một ca gãy xương đã xảy ra — chúng là lời nhắc về phòng ngừa, không phải lý do để lo lắng.',
    body3: 'Xét nghiệm không gây đau này đo mật độ khoáng của xương. Nó có thể được đề xuất dựa trên độ tuổi, tiền sử cá nhân và gia đình hoặc các yếu tố nguy cơ khác được xác định cùng bác sĩ.',
    preventionHabits: [
      'Canxi (các sản phẩm từ sữa, rau lá xanh)',
      'Vitamin D (tiếp xúc ánh nắng vừa phải, chế độ ăn)',
      'Tập luyện chịu trọng lượng (đi bộ, tập sức mạnh)',
      'Hạn chế thuốc lá và rượu bia',
    ],
    riskFactors: [
      'Tiền sử gia đình bị loãng xương',
      'Mãn kinh sớm (trước 45 tuổi)',
      'Đang hoặc từng hút thuốc',
      'Vóc dáng rất gầy hoặc hoạt động thể chất rất ít',
    ],
    alertTitle: 'Xin lưu ý',
    alertText: 'Có một hoặc nhiều yếu tố này không có nghĩa là bạn sẽ bị loãng xương — chúng chủ yếu giúp định hướng cuộc trao đổi với bác sĩ về việc tầm soát có thể có.',
    tip2Title: 'Nên biết',
    tip2Text: 'Canxi, vitamin D và hoạt động thể chất chịu trọng lượng vẫn là những thói quen hằng ngày hữu ích nhất để giữ gìn sức mạnh của xương về lâu dài.',
    shareMessage: 'Chăm sóc sức khỏe xương của bạn — AWA',
  },
  uz: {
    badge: 'SUYAK SALOMATLIGI',
    title: 'Suyak salomatligingizga\ngʻamxoʻrlik qilish',
    metaDuration: '6 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Oʻrta',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Nima uchun menopauza osteoporoz xavfini oshiradi va suyaklaringizni har kuni qanday himoya qilish kerak.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Menopauza suyaklarni nima uchun zaiflashtiradi',
      'Osteopeniya va osteoporoz',
      'Suyak densitometriyasi bilan skrining',
      'Profilaktikaning tayanchlari',
      'Xavfni oshiradigan omillar',
      'Esda tutish kerak boʻlgan narsalar',
    ],
    body1: 'Estrogen suyak almashinuvini sekinlashtirish orqali suyak zichligini tabiiy ravishda himoya qilishga yordam beradi. Menopauzada estrogenning pasayishi suyak yoʻqotilishini, ayniqsa hayz toʻxtagandan keyingi dastlabki bir necha yilda, tezlashtiradi.',
    body2: 'Osteopeniya osteoporoz chegarasiga yetmagan, normadan past suyak zichligini bildiradi. Osteoporoz esa sinish xavfini, ayniqsa yiqilganda, oshiradigan yaqqolroq suyak moʻrtligi.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Ikkala atama ham allaqachon sodir boʻlgan sinish emas, suyak zichligining pasayishini bildiradi — ular xavotirga sabab emas, balki profilaktikaga undaydi.',
    body3: 'Bu ogʻriqsiz tekshiruv suyak mineral zichligini oʻlchaydi. U yoshingiz, shaxsiy va oilaviy tarixingiz yoki shifokor bilan aniqlangan boshqa xavf omillariga qarab taklif qilinishi mumkin.',
    preventionHabits: [
      'Kalsiy (sut mahsulotlari, bargli yashil sabzavotlar)',
      'D vitamini (muʼtadil quyosh nuri, ovqatlanish)',
      'Yuk ostidagi mashqlar (yurish, kuch mashgʻulotlari)',
      'Tamaki va spirtli ichimliklarni cheklang',
    ],
    riskFactors: [
      'Osteoporozning oilaviy tarixi',
      'Erta menopauza (45 yoshgacha)',
      'Hozirgi yoki oʻtmishdagi chekish',
      'Juda ozgʻin tana tuzilishi yoki juda past jismoniy faollik',
    ],
    alertTitle: 'Eʼtibor bering',
    alertText: 'Bu omillardan biriga yoki bir nechtasiga ega boʻlish osteoporoz rivojlanishini anglatmaydi — ular asosan shifokor bilan mumkin boʻlgan skrining haqidagi suhbatni yoʻnaltirishga yordam beradi.',
    tip2Title: 'Bilish foydali',
    tip2Text: 'Kalsiy, D vitamini va yuk ostidagi jismoniy faollik uzoq muddatda suyak mustahkamligini saqlash uchun eng foydali kundalik odatlar boʻlib qoladi.',
    shareMessage: 'Suyak salomatligingizga gʻamxoʻrlik qilish — AWA',
  },
  az: {
    badge: 'SÜMÜK SAĞLAMLIĞI',
    title: 'Sümük sağlamlığınıza\nqulluq etmək',
    metaDuration: '6 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Orta',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Menopauza osteoporoz riskini nə üçün artırır və sümüklərinizi hər gün necə qorumaq olar.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Menopauza sümükləri nə üçün zəiflədir',
      'Osteopeniya və osteoporoz',
      'Sümük densitometriyası ilə skrininq',
      'Profilaktikanın dayaqları',
      'Riski artıran amillər',
      'Yadda saxlamalı məqamlar',
    ],
    body1: 'Östrogen sümük yenilənməsini azaltmaqla sümük sıxlığını təbii olaraq qorumağa kömək edir. Menopauza zamanı östrogenin azalması, xüsusilə aybaşı dayandıqdan sonrakı ilk illərdə sümük itkisini sürətləndirir.',
    body2: 'Osteopeniya normadan aşağı, lakin osteoporoz həddinə çatmayan sümük sıxlığına deyilir. Osteoporoz isə xüsusilə yıxılma halında sınıq riskini artıran daha bariz sümük kövrəkliyidir.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Hər iki termin artıq baş vermiş sınığı deyil, sümük sıxlığının itkisini təsvir edir — onlar profilaktika üçün işarədir, narahatlıq səbəbi deyil.',
    body3: 'Bu ağrısız müayinə sümüyün mineral sıxlığını ölçür. O, yaşınıza, şəxsi və ailə tarixçənizə və ya həkimlə müəyyən edilmiş digər risk amillərinə görə təklif oluna bilər.',
    preventionHabits: [
      'Kalsium (süd məhsulları, yaşıl yarpaqlı tərəvəzlər)',
      'D vitamini (mülayim günəş təsiri, qidalanma)',
      'Çəki ilə məşqlər (gəzinti, güc məşqləri)',
      'Tütün və alkoqolu məhdudlaşdırın',
    ],
    riskFactors: [
      'Osteoporozun ailə tarixçəsi',
      'Erkən menopauza (45 yaşdan əvvəl)',
      'Hazırda və ya keçmişdə siqaret çəkmə',
      'Çox arıq bədən quruluşu və ya çox aşağı fiziki fəaliyyət',
    ],
    alertTitle: 'Nəzərə alın',
    alertText: 'Bu amillərdən birinin və ya bir neçəsinin olması osteoporoz inkişaf etdirəcəyiniz demək deyil — onlar əsasən mümkün skrininq barədə həkimlə söhbəti istiqamətləndirməyə kömək edir.',
    tip2Title: 'Bilmək faydalıdır',
    tip2Text: 'Kalsium, D vitamini və çəki ilə fiziki fəaliyyət uzunmüddətli perspektivdə sümük gücünü qorumaq üçün ən faydalı gündəlik vərdişlər olaraq qalır.',
    shareMessage: 'Sümük sağlamlığınıza qulluq etmək — AWA',
  },
  ka: {
    badge: 'ძვლების ჯანმრთელობა',
    title: 'იზრუნეთ თქვენი\nძვლების ჯანმრთელობაზე',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'საშუალო',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'რატომ ზრდის მენოპაუზა ოსტეოპოროზის რისკს და როგორ დავიცვათ ძვლები ყოველდღიურად.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რატომ ასუსტებს მენოპაუზა ძვლებს',
      'ოსტეოპენია და ოსტეოპოროზი',
      'სკრინინგი ძვლის დენსიტომეტრიით',
      'პრევენციის საყრდენები',
      'რისკის გამზრდელი ფაქტორები',
      'რა უნდა დაიმახსოვროთ',
    ],
    body1: 'ესტროგენი ბუნებრივად ხელს უწყობს ძვლის სიმკვრივის დაცვას ძვლის ცვლის შენელებით. ესტროგენის შემცირება მენოპაუზისას ძვლის დანაკარგს აჩქარებს, განსაკუთრებით მენსტრუაციის შეწყვეტის შემდგომ პირველ წლებში.',
    body2: 'ოსტეოპენია ნიშნავს ძვლის სიმკვრივეს, რომელიც ნორმაზე დაბალია, მაგრამ ოსტეოპოროზის ზღვარს არ აღწევს. ოსტეოპოროზი ძვლის უფრო გამოხატული მყიფეობაა, რომელიც მოტეხილობის რისკს ზრდის, განსაკუთრებით ვარდნის შემთხვევაში.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'ორივე ტერმინი ძვლის სიმკვრივის დაკარგვას აღწერს და არა უკვე მომხდარ მოტეხილობას — ისინი პრევენციის სიგნალია და არა შეშფოთების მიზეზი.',
    body3: 'ეს უმტკივნეულო გამოკვლევა ძვლის მინერალურ სიმკვრივეს ზომავს. ის შეიძლება შემოგთავაზონ თქვენი ასაკის, პირადი და ოჯახური ისტორიის ან ექიმთან გამოვლენილი სხვა რისკ-ფაქტორების მიხედვით.',
    preventionHabits: [
      'კალციუმი (რძის პროდუქტები, მწვანე ფოთლოვანი ბოსტნეული)',
      'ვიტამინი D (ზომიერი მზის სხივები, კვება)',
      'წონაზე დატვირთვითი ვარჯიში (სიარული, ძალისმიერი ვარჯიში)',
      'თამბაქოსა და ალკოჰოლის შეზღუდვა',
    ],
    riskFactors: [
      'ოსტეოპოროზის ოჯახური ისტორია',
      'ადრეული მენოპაუზა (45 წლამდე)',
      'მოწევა ახლა ან წარსულში',
      'ძალიან გამხდარი აღნაგობა ან ძალიან დაბალი ფიზიკური აქტივობა',
    ],
    alertTitle: 'გაითვალისწინეთ',
    alertText: 'ამ ფაქტორებიდან ერთის ან რამდენიმეს არსებობა არ ნიშნავს, რომ ოსტეოპოროზი განგივითარდებათ — ისინი ძირითადად იმისთვისაა, რომ ექიმთან შესაძლო სკრინინგზე საუბარი წარმართოს.',
    tip2Title: 'კარგია ვიცოდეთ',
    tip2Text: 'კალციუმი, ვიტამინი D და წონაზე დატვირთვითი ფიზიკური აქტივობა კვლავ ყველაზე სასარგებლო ყოველდღიური ჩვევებია ძვლის სიმტკიცის გრძელვადიანი შესანარჩუნებლად.',
    shareMessage: 'იზრუნეთ თქვენი ძვლების ჯანმრთელობაზე — AWA',
  },
  hy: {
    badge: 'ՈՍԿՐԱՅԻՆ ԱՌՈՂՋՈՒԹՅՈՒՆ',
    title: 'Հոգ տանել ձեր\nոսկրային առողջության մասին',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Միջին',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ինչու է դաշտանադադարը մեծացնում օստեոպորոզի վտանգը և ինչպես ամեն օր պաշտպանել ձեր ոսկորները:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ինչու է դաշտանադադարը թուլացնում ոսկորները',
      'Օստեոպենիա և օստեոպորոզ',
      'Սկրինինգ ոսկրային դենսիտոմետրիայով',
      'Կանխարգելման հիմնասյուները',
      'Վտանգը մեծացնող գործոններ',
      'Ինչ հիշել',
    ],
    body1: 'Էստրոգենը բնականորեն օգնում է պաշտպանել ոսկրային խտությունը՝ դանդաղեցնելով ոսկրային նյութափոխանակությունը: Դաշտանադադարի ժամանակ էստրոգենի անկումը արագացնում է ոսկրային կորուստը, հատկապես դաշտանի դադարելուց հետո առաջին մի քանի տարիներին:',
    body2: 'Օստեոպենիան նշանակում է նորմայից ցածր ոսկրային խտություն՝ առանց օստեոպորոզի շեմին հասնելու: Օստեոպորոզը ոսկրային ավելի արտահայտված փխրունություն է, որը մեծացնում է կոտրվածքի վտանգը, մասնավորապես՝ անկման դեպքում:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Երկու տերմինն էլ նկարագրում են ոսկրային խտության կորուստ, այլ ոչ թե արդեն տեղի ունեցած կոտրվածք. դրանք կանխարգելման հորդոր են, այլ ոչ թե անհանգստանալու պատճառ:',
    body3: 'Այս անցավ հետազոտությունը չափում է ոսկրային հանքային խտությունը: Այն կարող է առաջարկվել ձեր տարիքի, անձնական և ընտանեկան պատմության կամ ձեր բժշկի հետ բացահայտված վտանգի այլ գործոնների հիման վրա:',
    preventionHabits: [
      'Կալցիում (կաթնամթերք, տերևավոր բանջարեղեն)',
      'D վիտամին (չափավոր արևային ազդեցություն, սննդակարգ)',
      'Քաշային ծանրաբեռնվածությամբ վարժություններ (քայլք, ուժային մարզում)',
      'Սահմանափակել ծխախոտը և ալկոհոլը',
    ],
    riskFactors: [
      'Օստեոպորոզի ընտանեկան պատմություն',
      'Վաղ դաշտանադադար (45 տարեկանից առաջ)',
      'Ներկայիս կամ նախկին ծխելը',
      'Շատ նիհար կազմվածք կամ շատ ցածր ֆիզիկական ակտիվություն',
    ],
    alertTitle: 'Խնդրում ենք ուշադրություն դարձնել',
    alertText: 'Այս գործոններից մեկ կամ մի քանիսի առկայությունը չի նշանակում, որ ձեզ մոտ օստեոպորոզ կզարգանա. դրանք գլխավորապես օգնում են ուղղորդել ձեր բժշկի հետ զրույցը հնարավոր սկրինինգի մասին:',
    tip2Title: 'Լավ է իմանալ',
    tip2Text: 'Կալցիումը, D վիտամինը և քաշային ծանրաբեռնվածությամբ ֆիզիկական ակտիվությունը մնում են ամենաօգտակար առօրյա սովորությունները՝ ոսկրային ամրությունը երկարաժամկետ պահպանելու համար:',
    shareMessage: 'Հոգ տանել ձեր ոսկրային առողջության մասին — AWA',
  },
  tg: {
    badge: 'САЛОМАТИИ УСТУХОНҲО',
    title: 'Ғамхорӣ аз\nсаломатии устухонҳои худ',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Миёна',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Чаро менопауза хатари остеопорозро зиёд мекунад ва чӣ тавр ҳар рӯз устухонҳои худро муҳофизат кардан мумкин аст.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Чаро менопауза устухонҳоро суст мекунад',
      'Остеопения ва остеопороз',
      'Санҷиш бо денситометрияи устухон',
      'Сутунҳои пешгирӣ',
      'Омилҳое, ки хатарро зиёд мекунанд',
      'Чӣ бояд дар хотир дошт',
    ],
    body1: 'Эстроген ба таври табиӣ бо суст кардани навшавии устухон ба ҳифзи зичии устухон кумак мекунад. Паст шудани эстроген дар менопауза гум шудани устухонро суръат мебахшад, хусусан дар чанд соли аввали пас аз қатъи ҳайз.',
    body2: 'Остеопения зичии устухонро мефаҳмонад, ки аз муқаррарӣ пасттар аст, вале ба ҳадди остеопороз нарасидааст. Остеопороз нозукии назарраси устухон аст, ки хатари шикастро, хусусан ҳангоми афтидан, зиёд мекунад.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Ҳарду истилоҳ аз даст рафтани зичии устухонро тавсиф мекунанд, на шикасте, ки аллакай рух додааст — онҳо даъват ба пешгирианд, на сабаби нигаронӣ.',
    body3: 'Ин ташхиси бедард зичии минералии устухонро андоза мекунад. Онро вобаста ба синну сол, таърихи шахсӣ ва оилавӣ ё дигар омилҳои хатар, ки бо табиби шумо муайян шудаанд, пешниҳод кардан мумкин аст.',
    preventionHabits: [
      'Калсий (маҳсулоти ширӣ, сабзавоти барги сабз)',
      'Витамини D (офтоби мӯътадил, парҳез)',
      'Машқҳои бо вазн (пиёдагардӣ, машқи қувват)',
      'Кам кардани тамокукашӣ ва машруботи спиртӣ',
    ],
    riskFactors: [
      'Таърихи оилавии остеопороз',
      'Менопаузаи барвақт (то 45-солагӣ)',
      'Тамокукашии ҳозира ё пешина',
      'Ҷусаи хеле борик ё фаъолияти ҷисмонии хеле кам',
    ],
    alertTitle: 'Таваҷҷӯҳ кунед',
    alertText: 'Доштани як ё якчанд аз ин омилҳо маънои онро надорад, ки шумо ба остеопороз гирифтор мешавед — онҳо асосан барои роҳнамоии сӯҳбат бо табиб дар бораи санҷиши эҳтимолӣ мебошанд.',
    tip2Title: 'Донистан хуб аст',
    tip2Text: 'Калсий, витамини D ва фаъолияти ҷисмонии бо вазн одатҳои муфидтарини ҳаррӯза барои нигоҳ доштани қувваи устухон дар дарозмуддат боқӣ мемонанд.',
    shareMessage: 'Ғамхорӣ аз саломатии устухонҳои худ — AWA',
  },
  ky: {
    badge: 'СӨӨК ДЕН СООЛУГУ',
    title: 'Сөөк ден соолугуңузга\nкам көрүү',
    metaDuration: '6 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Орто',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Менопауза эмне үчүн остеопороз коркунучун жогорулатат жана сөөктөрдү күн сайын кантип коргоо керек.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Менопауза сөөктөрдү эмне үчүн алсыратат',
      'Остеопения жана остеопороз',
      'Сөөк денситометриясы менен скрининг',
      'Алдын алуунун тирөөчтөрү',
      'Коркунучту жогорулаткан факторлор',
      'Эмнени эстен чыгарбоо керек',
    ],
    body1: 'Эстроген сөөк алмашуусун жайлатуу аркылуу сөөктүн тыгыздыгын коргоого табигый түрдө жардам берет. Менопаузада эстрогендин азайышы сөөк жоготууну тездетет, айрыкча етек кирим токтогондон кийинки алгачкы жылдарда.',
    body2: 'Остеопения — сөөк тыгыздыгы нормадан төмөн, бирок остеопороз босогосуна жетпеген абал. Остеопороз — сөөктөрдүн айкын морт болушу, ал сынык коркунучун, айрыкча жыгылганда, жогорулатат.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Эки термин тең сөөк тыгыздыгынын азайышын сүрөттөйт, мурунтан болгон сыныкты эмес — алар алдын алууга түртөт, санааркоого себеп эмес.',
    body3: 'Бул оорутпай турган текшерүү сөөктүн минералдык тыгыздыгын өлчөйт. Аны жашыңызга, жеке жана үй-бүлөлүк тарыхыңызга же дарыгер менен аныкталган башка коркунуч факторлоруна жараша сунуштоо мүмкүн.',
    preventionHabits: [
      'Кальций (сүт азыктары, жалбырактуу жашылчалар)',
      'D витамини (орточо күн нуру, тамактануу)',
      'Салмак менен көнүгүүлөр (басуу, күч көнүгүүлөрү)',
      'Тамеки менен алкоголду чектөө',
    ],
    riskFactors: [
      'Үй-бүлөдө остеопороздун болушу',
      'Эрте менопауза (45 жашка чейин)',
      'Учурда же мурда тамеки тартуу',
      'Өтө арык дене түзүлүшү же физикалык активдүүлүктүн өтө төмөндүгү',
    ],
    alertTitle: 'Көңүл буруңуз',
    alertText: 'Бул факторлордун бири же бир нечеси болушу остеопороз пайда болорун билдирбейт — алар негизинен дарыгер менен мүмкүн болгон скрининг боюнча сүйлөшүүгө багыт берүү үчүн.',
    tip2Title: 'Билүү пайдалуу',
    tip2Text: 'Кальций, D витамини жана салмак менен физикалык активдүүлүк сөөк бекемдигин узак мөөнөткө сактоо үчүн эң пайдалуу күнүмдүк адаттар бойдон калат.',
    shareMessage: 'Сөөк ден соолугуңузга кам көрүү — AWA',
  },
  tk: {
    badge: 'SÜÝEK SAGLYGY',
    title: 'Süýek saglygyňyza\nideg etmek',
    metaDuration: '6 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Orta',
    metaValidated: 'Barlanan mazmun',
    intro: 'Menopauza näme üçin osteoporoz howpuny artdyrýar we süýeklerinizi her gün nähili goramaly.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Menopauza süýekleri näme üçin ejizledýär',
      'Osteopeniýa we osteoporoz',
      'Süýek densitometriýasy bilen barlag',
      'Öňüni almagyň esasy sütünleri',
      'Howpy artdyrýan faktorlar',
      'Nämäni ýatda saklamaly',
    ],
    body1: 'Estrogen süýek çalşygyny haýalladyp, süýegiň dykyzlygyny goramaga tebigy ýagdaýda kömek edýär. Menopauza wagtynda estrogeniň peselmegi süýek ýitgisini, esasanam aýbaşy kesilenden soňky ilkinji ýyllarda çaltlandyrýar.',
    body2: 'Osteopeniýa — süýek dykyzlygynyň adatdakydan pesdigini, ýöne osteoporoza ýeten çäkde däldigini aňladýar. Osteoporoz bolsa süýegiň has aýdyň ejizlemegi bolup, aýratyn-da ýykylan ýagdaýynda döwük howpuny artdyrýar.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Bu iki termin hem süýek dykyzlygynyň ýitirilmegini suratlandyrýar, eýýäm bolup geçen döwügi däl — olar howatyrlanmak üçin däl-de, öňüni almak üçin bir ýatlatma.',
    body3: 'Agyrysyz bu barlag süýegiň mineral dykyzlygyny ölçeýär. Ol ýaşyňyza, şahsy we maşgala taryhyňyza ýa-da lukmanyňyz bilen kesgitlenen beýleki howp faktorlaryna görä teklip edilip bilner.',
    preventionHabits: [
      'Kalsiý (süýt önümleri, ýaşyl ýapraklar)',
      'D witamini (ortaça gün şöhlesi, iýmit)',
      'Agramly maşklar (ýöremek, güýç maşklary)',
      'Temmäki we alkogoly çäklemek',
    ],
    riskFactors: [
      'Maşgalada osteoporoz taryhy',
      'Ir menopauza (45 ýaşdan öň)',
      'Häzirki ýa-da öňki çilim çekmek',
      'Gaty inçe beden gurluşy ýa-da gaty az fiziki işjeňlik',
    ],
    alertTitle: 'Üns beriň',
    alertText: 'Şu faktorlaryň biriniň ýa-da birnäçesiniň bolmagy osteoporoz ýüze çykjakdygyny aňlatmaýar — olar esasan lukmanyňyz bilen mümkin barlag barada söhbetdeşlige ugur görkezmäge kömek edýär.',
    tip2Title: 'Bilmek peýdaly',
    tip2Text: 'Kalsiý, D witamini we agram goýýan fiziki işjeňlik uzak möhletde süýegiň berkligini saklamak üçin iň peýdaly gündelik endikler bolup galýar.',
    shareMessage: 'Süýek saglygyňyza ideg etmek — AWA',
  },
} as const);

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
