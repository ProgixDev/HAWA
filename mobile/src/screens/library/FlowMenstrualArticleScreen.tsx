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

const ID = 'flow-hygiene-intime';

const HERO = require('../../assets/images/library/flow-colors-hero.png');

// Images stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these illustrations.
const RELATED_IMAGES = [
  {
    image: require('../../assets/images/library/pain-hero.png'),
    articleId: 'pain-gerer-douleurs',
  },
  {
    image: require('../../assets/images/library/rules-hero.png'),
    articleId: 'flow-comprendre-flux',
  },
  {
    image: require('../../assets/images/library/pain-hero.png'),
    articleId: 'pain-gerer-douleurs',
  },
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('FlowMenstrual', {
  fr: {
    badge: 'FLUX MENSTRUEL',
    title: 'Bien vivre son hygiène intime\npendant les règles',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Prendre soin de son intimité, c’est respecter son corps et son équilibre naturel.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Pourquoi c’est important',
      'Les bons gestes',
      'À éviter',
      'Quand consulter',
      'Conseils pratiques',
    ],
    body: 'Pendant les règles, ton corps change et devient plus sensible. Adopter les bons gestes aide à prévenir les irritations, les infections et à rester à l’aise au quotidien.',
    goodPractices: [
      'Lave-toi doucement : un simple lavage à l’eau claire, de l’avant vers l’arrière, suffit pour préserver ta flore naturelle.',
      'Change régulièrement tes protections : toutes les 4 à 6 heures pour éviter l’humidité et les mauvaises odeurs.',
      'Privilégie le coton : les sous-vêtements en coton laissent la peau respirer et réduisent les risques d’irritation.',
    ],
    thingsToAvoid: [
      'Les savons agressifs et les produits parfumés',
      'Les douches vaginales qui perturbent la flore naturelle',
      'Garder une protection humide trop longtemps',
    ],
    consultReasons: [
      'Irritations, démangeaisons ou brûlures persistantes',
      'Odeur inhabituelle ou pertes différentes de ton habitude',
      'Douleurs importantes ou symptômes qui t’inquiètent',
    ],
    tipTitle: 'Conseil AWA',
    tipText: 'Ton corps possède déjà un mécanisme naturel d’équilibre. Un lavage doux suffit généralement.',
    takeawaysTitle: 'À retenir',
    takeaways: [
      'Lavage doux à l’eau claire',
      'Changer régulièrement',
      'Éviter les produits parfumés',
      'Privilégier le coton',
    ],
    relatedTitle: '♥  Tu pourrais aussi aimer',
    related: [
      {title: 'Comprendre les douleurs menstruelles', meta: '7 min  ·  Guide'},
      {title: 'Choisir la protection adaptée à ton corps', meta: '5 min  ·  Guide'},
      {title: 'Comment soulager les crampes naturellement', meta: '6 min  ·  Guide'},
    ],
    shareTitle: 'Hygiène intime · AWA',
    shareMessage: 'Bien vivre son hygiène intime pendant les règles · AWA',
  },
  en: {
    badge: 'MENSTRUAL FLOW',
    title: 'Taking care of your intimate hygiene\nduring your period',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Caring for your intimate hygiene means respecting your body and its natural balance.',
    contentsTitle: 'In this article',
    topics: [
      'Why it matters',
      'Good habits',
      'What to avoid',
      'When to see a doctor',
      'Practical tips',
    ],
    body: 'During your period, your body changes and becomes more sensitive. Adopting the right habits helps prevent irritation and infection, and helps you stay comfortable day to day.',
    goodPractices: [
      'Wash gently: a simple rinse with clear water, from front to back, is enough to protect your natural flora.',
      'Change your protection regularly: every 4 to 6 hours to avoid moisture and unpleasant odors.',
      'Choose cotton: cotton underwear lets your skin breathe and reduces the risk of irritation.',
    ],
    thingsToAvoid: [
      'Harsh soaps and scented products',
      'Vaginal douches, which disrupt your natural flora',
      'Keeping a damp pad or tampon on for too long',
    ],
    consultReasons: [
      'Persistent irritation, itching, or burning',
      'Unusual odor or discharge that’s different from what’s normal for you',
      'Significant pain or symptoms that worry you',
    ],
    tipTitle: 'AWA tip',
    tipText: 'Your body already has a natural balancing mechanism. A gentle wash is usually enough.',
    takeawaysTitle: 'Key takeaways',
    takeaways: [
      'Gentle wash with clear water',
      'Change regularly',
      'Avoid scented products',
      'Choose cotton',
    ],
    relatedTitle: '♥  You might also like',
    related: [
      {title: 'Understanding menstrual pain', meta: '7 min  ·  Guide'},
      {title: 'Choosing the right protection for your body', meta: '5 min  ·  Guide'},
      {title: 'How to relieve cramps naturally', meta: '6 min  ·  Guide'},
    ],
    shareTitle: 'Intimate hygiene · AWA',
    shareMessage: 'Taking care of your intimate hygiene during your period · AWA',
  },
  es: {
    badge: 'FLUJO MENSTRUAL',
    title: 'Cuidar bien tu higiene íntima\ndurante el período',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Cuidar tu intimidad es respetar tu cuerpo y su equilibrio natural.',
    contentsTitle: 'En este artículo',
    topics: [
      'Por qué es importante',
      'Las buenas prácticas',
      'Qué evitar',
      'Cuándo consultar',
      'Consejos prácticos',
    ],
    body: 'Durante el período, tu cuerpo cambia y se vuelve más sensible. Adoptar las buenas prácticas ayuda a prevenir irritaciones e infecciones, y te permite sentirte cómoda en tu día a día.',
    goodPractices: [
      'Lávate con suavidad: un simple lavado con agua limpia, de adelante hacia atrás, basta para preservar tu flora natural.',
      'Cambia tus protecciones con regularidad: cada 4 a 6 horas para evitar la humedad y los malos olores.',
      'Elige el algodón: la ropa interior de algodón deja que la piel respire y reduce el riesgo de irritación.',
    ],
    thingsToAvoid: [
      'Los jabones agresivos y los productos perfumados',
      'Las duchas vaginales, que alteran la flora natural',
      'Mantener una protección húmeda demasiado tiempo',
    ],
    consultReasons: [
      'Irritaciones, picor o ardor persistentes',
      'Olor inusual o flujo diferente de lo habitual en ti',
      'Dolores intensos o síntomas que te preocupan',
    ],
    tipTitle: 'Consejo AWA',
    tipText: 'Tu cuerpo ya cuenta con un mecanismo natural de equilibrio. Por lo general, un lavado suave es suficiente.',
    takeawaysTitle: 'Para recordar',
    takeaways: [
      'Lavado suave con agua limpia',
      'Cambiar con regularidad',
      'Evitar los productos perfumados',
      'Elegir el algodón',
    ],
    relatedTitle: '♥  También te puede interesar',
    related: [
      {title: 'Entender los dolores menstruales', meta: '7 min  ·  Guía'},
      {title: 'Elegir la protección adecuada para tu cuerpo', meta: '5 min  ·  Guía'},
      {title: 'Cómo aliviar los cólicos de forma natural', meta: '6 min  ·  Guía'},
    ],
    shareTitle: 'Higiene íntima · AWA',
    shareMessage: 'Cuidar bien tu higiene íntima durante el período · AWA',
  },
  it: {
    badge: 'FLUSSO MESTRUALE',
    title: 'Prenderti cura dell’igiene intima\ndurante il ciclo',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Prenderti cura della tua igiene intima significa rispettare il tuo corpo e il suo equilibrio naturale.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Perché è importante',
      'Buone abitudini',
      'Cosa evitare',
      'Quando rivolgersi al medico',
      'Consigli pratici',
    ],
    body: 'Durante il ciclo il tuo corpo cambia e diventa più sensibile. Adottare le giuste abitudini aiuta a prevenire irritazioni e infezioni e a stare comoda giorno dopo giorno.',
    goodPractices: [
      'Lavati con delicatezza: basta un semplice risciacquo con acqua pulita, dall’avanti all’indietro, per proteggere la tua flora naturale.',
      'Cambia la protezione regolarmente: ogni 4-6 ore per evitare umidità e cattivi odori.',
      'Scegli il cotone: la biancheria intima in cotone lascia respirare la pelle e riduce il rischio di irritazioni.',
    ],
    thingsToAvoid: [
      'Saponi aggressivi e prodotti profumati',
      'Lavande vaginali, che alterano la tua flora naturale',
      'Tenere troppo a lungo un assorbente o un tampone umido',
    ],
    consultReasons: [
      'Irritazione, prurito o bruciore persistenti',
      'Odore o perdite insoliti, diversi da quelli che per te sono normali',
      'Dolore importante o sintomi che ti preoccupano',
    ],
    tipTitle: 'Consiglio AWA',
    tipText: 'Il tuo corpo ha già un meccanismo naturale di equilibrio. Di solito basta un lavaggio delicato.',
    takeawaysTitle: 'Da ricordare',
    takeaways: [
      'Lavaggio delicato con acqua pulita',
      'Cambiare con regolarità',
      'Evitare i prodotti profumati',
      'Scegliere il cotone',
    ],
    relatedTitle: '♥  Potrebbe interessarti anche',
    related: [
      {
        title: 'Capire il dolore mestruale',
        meta: '7 min  ·  Guida',
      },
      {
        title: 'Scegliere la protezione giusta per il tuo corpo',
        meta: '5 min  ·  Guida',
      },
      {
        title: 'Come alleviare i crampi in modo naturale',
        meta: '6 min  ·  Guida',
      },
    ],
    shareTitle: 'Igiene intima · AWA',
    shareMessage: 'Prenderti cura dell’igiene intima durante il ciclo · AWA',
  },
  tr: {
    badge: 'ADET KANAMASI',
    title: 'Adet döneminde intim hijyenine\ndikkat etmek',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'İntim hijyenine özen göstermek, bedenine ve doğal dengesine saygı göstermektir.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Neden önemli?',
      'İyi alışkanlıklar',
      'Nelerden kaçınmalı?',
      'Ne zaman doktora gitmeli?',
      'Pratik ipuçları',
    ],
    body: 'Adet döneminde bedenin değişir ve daha hassas hale gelir. Doğru alışkanlıklar edinmek tahriş ve enfeksiyonu önlemeye yardımcı olur, günlük hayatta kendini rahat hissetmeni sağlar.',
    goodPractices: [
      'Nazikçe yıka: önden arkaya doğru, sade suyla basit bir durulama doğal florayı korumak için yeterlidir.',
      'Pedini düzenli değiştir: nemden ve hoş olmayan kokulardan kaçınmak için her 4 ila 6 saatte bir.',
      'Pamuklu olanı seç: pamuklu iç çamaşırı cildinin nefes almasını sağlar ve tahriş riskini azaltır.',
    ],
    thingsToAvoid: [
      'Sert sabunlar ve kokulu ürünler',
      'Doğal florayı bozan vajinal duşlar',
      'Islanmış bir pedi ya da tamponu çok uzun süre takılı tutmak',
    ],
    consultReasons: [
      'Geçmeyen tahriş, kaşıntı ya da yanma',
      'Normalinden farklı, alışılmadık koku ya da akıntı',
      'Belirgin ağrı ya da seni endişelendiren belirtiler',
    ],
    tipTitle: 'AWA ipucu',
    tipText: 'Bedeninin zaten doğal bir denge mekanizması var. Nazik bir yıkama genellikle yeterlidir.',
    takeawaysTitle: 'Akılda kalacaklar',
    takeaways: [
      'Sade suyla nazik yıkama',
      'Düzenli değiştirme',
      'Kokulu ürünlerden kaçınma',
      'Pamuklu olanı seçme',
    ],
    relatedTitle: '♥  Bunlar da ilgini çekebilir',
    related: [
      {
        title: 'Adet ağrısını anlamak',
        meta: '7 dk  ·  Rehber',
      },
      {
        title: 'Bedenine uygun adet ürününü seçmek',
        meta: '5 dk  ·  Rehber',
      },
      {
        title: 'Kramplar doğal yollarla nasıl hafifletilir?',
        meta: '6 dk  ·  Rehber',
      },
    ],
    shareTitle: 'İntim hijyen · AWA',
    shareMessage: 'Adet döneminde intim hijyenine dikkat etmek · AWA',
  },
  ru: {
    badge: 'МЕНСТРУАЛЬНЫЕ ВЫДЕЛЕНИЯ',
    title: 'Интимная гигиена\nво время месячных',
    metaDuration: '6 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Забота об интимной гигиене — это уважение к своему телу и его естественному балансу.',
    contentsTitle: 'В этой статье',
    topics: [
      'Почему это важно',
      'Полезные привычки',
      'Чего следует избегать',
      'Когда обратиться к врачу',
      'Практические советы',
    ],
    body: 'Во время месячных организм меняется и становится более чувствительным. Правильные привычки помогают предотвратить раздражение и инфекции и чувствовать себя комфортно изо дня в день.',
    goodPractices: [
      'Мойтесь мягко: достаточно простого ополаскивания чистой водой спереди назад, чтобы защитить естественную микрофлору.',
      'Регулярно меняйте средства гигиены: каждые 4–6 часов, чтобы избежать влажности и неприятного запаха.',
      'Выбирайте хлопок: хлопковое бельё позволяет коже дышать и снижает риск раздражения.',
    ],
    thingsToAvoid: [
      'Агрессивное мыло и ароматизированные средства',
      'Спринцевание, нарушающее естественную микрофлору',
      'Слишком долгое ношение влажной прокладки или тампона',
    ],
    consultReasons: [
      'Стойкое раздражение, зуд или жжение',
      'Необычный запах или выделения, отличающиеся от привычных для вас',
      'Сильная боль или симптомы, которые вас беспокоят',
    ],
    tipTitle: 'Совет AWA',
    tipText: 'У вашего организма уже есть естественный механизм баланса. Обычно достаточно мягкого умывания.',
    takeawaysTitle: 'Главные выводы',
    takeaways: [
      'Мягкое умывание чистой водой',
      'Регулярно меняйте средства гигиены',
      'Избегайте ароматизированных средств',
      'Выбирайте хлопок',
    ],
    relatedTitle: '♥  Вам также может понравиться',
    related: [
      {title: 'Как понять менструальную боль', meta: '7 мин  ·  Руководство'},
      {title: 'Как выбрать подходящее средство гигиены', meta: '5 мин  ·  Руководство'},
      {title: 'Как естественным образом облегчить спазмы', meta: '6 мин  ·  Руководство'},
    ],
    shareTitle: 'Интимная гигиена · AWA',
    shareMessage: 'Интимная гигиена во время месячных · AWA',
  },
  de: {
    badge: 'MENSTRUATIONSBLUTUNG',
    title: 'Intimhygiene\nwährend deiner Periode',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Auf deine Intimhygiene zu achten heißt, deinen Körper und sein natürliches Gleichgewicht zu respektieren.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Warum das wichtig ist',
      'Gute Gewohnheiten',
      'Was du vermeiden solltest',
      'Wann zur Ärztin oder zum Arzt',
      'Praktische Tipps',
    ],
    body: 'Während deiner Periode verändert sich dein Körper und wird empfindlicher. Die richtigen Gewohnheiten beugen Reizungen und Infektionen vor und helfen dir, dich im Alltag wohlzufühlen.',
    goodPractices: [
      'Sanft waschen: Klares Wasser, von vorne nach hinten, genügt, um deine natürliche Flora zu schützen.',
      'Regelmäßig wechseln: alle 4 bis 6 Stunden, um Feuchtigkeit und unangenehme Gerüche zu vermeiden.',
      'Baumwolle wählen: Unterwäsche aus Baumwolle lässt deine Haut atmen und verringert das Risiko von Reizungen.',
    ],
    thingsToAvoid: [
      'Aggressive Seifen und parfümierte Produkte',
      'Scheidenspülungen, die deine natürliche Flora stören',
      'Eine feuchte Binde oder einen Tampon zu lange tragen',
    ],
    consultReasons: [
      'Anhaltende Reizung, Juckreiz oder Brennen',
      'Ungewöhnlicher Geruch oder Ausfluss, der anders ist als bei dir sonst üblich',
      'Starke Schmerzen oder Symptome, die dich beunruhigen',
    ],
    tipTitle: 'AWA-Tipp',
    tipText: 'Dein Körper verfügt bereits über einen natürlichen Ausgleichsmechanismus. Meist genügt eine sanfte Reinigung.',
    takeawaysTitle: 'Das Wichtigste in Kürze',
    takeaways: [
      'Sanft mit klarem Wasser waschen',
      'Regelmäßig wechseln',
      'Parfümierte Produkte vermeiden',
      'Baumwolle wählen',
    ],
    relatedTitle: '♥  Das könnte dir auch gefallen',
    related: [
      {title: 'Menstruationsschmerzen verstehen', meta: '7 Min.  ·  Ratgeber'},
      {title: 'Den passenden Schutz für deinen Körper wählen', meta: '5 Min.  ·  Ratgeber'},
      {title: 'Krämpfe auf natürliche Weise lindern', meta: '6 Min.  ·  Ratgeber'},
    ],
    shareTitle: 'Intimhygiene · AWA',
    shareMessage: 'Intimhygiene während deiner Periode · AWA',
  },
  zh: {
      badge: '经量',
      title: '月经期间\n呵护私处清洁',
      metaDuration: '阅读约 6 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审核内容',
      intro: '呵护私处清洁，就是尊重你的身体及其自然的平衡。',
      contentsTitle: '本文内容',
      topics: [
        '为什么重要',
        '好习惯',
        '需要避免的做法',
        '何时就医',
        '实用小建议',
      ],
      body: '月经期间，你的身体会发生变化，也会变得更敏感。养成合适的习惯，有助于预防刺激和感染，让你每天都更舒适。',
      goodPractices: [
        '温和清洗：用清水由前向后简单冲洗就足够了，可以保护你的天然菌群。',
        '定期更换护理用品：每 4 到 6 小时更换一次，避免潮湿和异味。',
        '选择棉质：棉质内裤让皮肤保持透气，并降低刺激的风险。',
      ],
      thingsToAvoid: [
        '刺激性强的肥皂和带香味的产品',
        '阴道冲洗，会破坏你的天然菌群',
        '让潮湿的卫生巾或卫生棉条留置过久',
      ],
      consultReasons: [
        '持续的刺激感、瘙痒或灼热感',
        '异常的气味或分泌物，与你平时的情况不同',
        '明显的疼痛或让你担心的症状',
      ],
      tipTitle: 'AWA 小提示',
      tipText: '你的身体本身就有自然的平衡机制。通常，温和的清洗就足够了。',
      takeawaysTitle: '要点回顾',
      takeaways: [
        '用清水温和清洗',
        '定期更换',
        '避免带香味的产品',
        '选择棉质',
      ],
      relatedTitle: '♥  你可能还喜欢',
      related: [
        {
          title: '了解痛经',
          meta: '7 分钟  ·  指南',
        },
        {
          title: '选择适合你身体的护理用品',
          meta: '5 分钟  ·  指南',
        },
        {
          title: '如何自然缓解痛经',
          meta: '6 分钟  ·  指南',
        },
      ],
      shareTitle: '私处清洁 · AWA',
      shareMessage: '月经期间呵护私处清洁 · AWA',
    },
  id: {
    badge: 'ALIRAN DARAH HAID',
    title: 'Merawat kebersihan area intimmu\nselama haid',
    metaDuration: '6 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Merawat kebersihan area intim berarti menghargai tubuhmu dan keseimbangan alaminya.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Mengapa ini penting',
      'Kebiasaan yang baik',
      'Yang perlu dihindari',
      'Kapan harus ke dokter',
      'Tips praktis',
    ],
    body: 'Selama haid, tubuhmu berubah dan menjadi lebih sensitif. Menerapkan kebiasaan yang tepat membantu mencegah iritasi dan infeksi, serta membuatmu tetap nyaman setiap hari.',
    goodPractices: [
      'Bersihkan dengan lembut: cukup bilas dengan air bersih, dari depan ke belakang, untuk melindungi flora alamimu.',
      'Ganti pembalutmu secara teratur: setiap 4 sampai 6 jam untuk menghindari kelembapan dan bau tidak sedap.',
      'Pilih katun: pakaian dalam katun membuat kulitmu bisa bernapas dan mengurangi risiko iritasi.',
    ],
    thingsToAvoid: [
      'Sabun keras dan produk beraroma',
      'Pembilasan vagina (douching), yang mengganggu flora alamimu',
      'Memakai pembalut atau tampon yang sudah lembap terlalu lama',
    ],
    consultReasons: [
      'Iritasi, gatal, atau sensasi terbakar yang menetap',
      'Bau atau cairan yang tidak biasa dan berbeda dari yang normal bagimu',
      'Nyeri hebat atau gejala yang membuatmu khawatir',
    ],
    tipTitle: 'Tips AWA',
    tipText: 'Tubuhmu sudah punya mekanisme keseimbangan alami. Membasuh dengan lembut biasanya sudah cukup.',
    takeawaysTitle: 'Poin penting',
    takeaways: [
      'Basuh lembut dengan air bersih',
      'Ganti secara teratur',
      'Hindari produk beraroma',
      'Pilih katun',
    ],
    relatedTitle: '♥  Mungkin kamu juga suka',
    related: [
      {
        title: 'Memahami nyeri haid',
        meta: '7 mnt  ·  Panduan',
      },
      {
        title: 'Memilih pembalut yang tepat untuk tubuhmu',
        meta: '5 mnt  ·  Panduan',
      },
      {
        title: 'Cara meredakan kram secara alami',
        meta: '6 mnt  ·  Panduan',
      },
    ],
    shareTitle: 'Kebersihan area intim · AWA',
    shareMessage: 'Merawat kebersihan area intimmu selama haid · AWA',
  },
  hi: {
    badge: 'माहवारी का फ़्लो',
    title: 'पीरियड के दौरान अपनी\nनिजी स्वच्छता का ध्यान रखें',
    metaDuration: '6 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'जाँची गई जानकारी',
    intro: 'निजी स्वच्छता का ध्यान रखने का मतलब है अपने शरीर और उसके प्राकृतिक संतुलन का सम्मान करना।',
    contentsTitle: 'इस लेख में',
    topics: [
      'यह क्यों ज़रूरी है',
      'अच्छी आदतें',
      'किनसे बचें',
      'डॉक्टर को कब दिखाएँ',
      'काम की सलाह',
    ],
    body: 'पीरियड के दौरान आपका शरीर बदलता है और ज़्यादा संवेदनशील हो जाता है। सही आदतें अपनाने से जलन और संक्रमण से बचाव होता है और रोज़ आप आरामदायक महसूस करती हैं।',
    goodPractices: [
      'हल्के हाथ से धोएँ: आगे से पीछे की ओर साफ़ पानी से धो लेना काफ़ी है, इससे आपके प्राकृतिक बैक्टीरिया का संतुलन बचा रहता है।',
      'प्रोटेक्शन नियमित रूप से बदलें: हर 4 से 6 घंटे में, ताकि नमी और बदबू से बचा जा सके।',
      'सूती कपड़ा चुनें: सूती अंडरवियर से त्वचा को हवा मिलती है और जलन का जोखिम कम होता है।',
    ],
    thingsToAvoid: [
      'तेज़ साबुन और खुशबूदार उत्पाद',
      'वजाइनल डूश, जो आपके प्राकृतिक बैक्टीरिया का संतुलन बिगाड़ते हैं',
      'गीले पैड या टैम्पोन को बहुत देर तक लगाए रखना',
    ],
    consultReasons: [
      'लगातार जलन, खुजली या चुभन',
      'असामान्य बदबू या ऐसा स्राव जो आपके सामान्य से अलग हो',
      'तेज़ दर्द या ऐसे लक्षण जो आपको चिंतित करें',
    ],
    tipTitle: 'AWA की सलाह',
    tipText: 'आपके शरीर में संतुलन बनाए रखने की अपनी प्राकृतिक व्यवस्था पहले से है। आमतौर पर हल्के हाथ से धोना ही काफ़ी होता है।',
    takeawaysTitle: 'मुख्य बातें',
    takeaways: [
      'साफ़ पानी से हल्के हाथ से धोएँ',
      'नियमित रूप से बदलें',
      'खुशबूदार उत्पादों से बचें',
      'सूती कपड़ा चुनें',
    ],
    relatedTitle: '♥  ये भी आपको पसंद आ सकता है',
    related: [
      {
        title: 'माहवारी के दर्द को समझें',
        meta: '7 मिनट  ·  गाइड',
      },
      {
        title: 'अपने शरीर के लिए सही प्रोटेक्शन चुनना',
        meta: '5 मिनट  ·  गाइड',
      },
      {
        title: 'ऐंठन को प्राकृतिक तरीकों से कैसे कम करें',
        meta: '6 मिनट  ·  गाइड',
      },
    ],
    shareTitle: 'निजी स्वच्छता · AWA',
    shareMessage: 'पीरियड के दौरान अपनी निजी स्वच्छता का ध्यान रखें · AWA',
  },
  sq: {
    badge: 'RRJEDHJA MENSTRUALE',
    title: 'Kujdesi për higjienën intime\ngjatë menstruacioneve',
    metaDuration: '6 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Kujdesi për higjienën intime do të thotë respekt për trupin tënd dhe ekuilibrin e tij natyral.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Pse ka rëndësi',
      'Zakone të mira',
      'Çfarë të shmangësh',
      'Kur të shkosh te mjeku',
      'Këshilla praktike',
    ],
    body: 'Gjatë menstruacioneve, trupi yt ndryshon dhe bëhet më i ndjeshëm. Zakonet e duhura ndihmojnë të parandalosh acarimin dhe infeksionin, dhe të ndihesh rehat çdo ditë.',
    goodPractices: [
      'Lahu butë: mjafton një shpëlarje e thjeshtë me ujë të pastër, nga përpara prapa, për të mbrojtur florën tënde natyrale.',
      'Ndërro mbrojtjen rregullisht: çdo 4 deri në 6 orë, për të shmangur lagështirën dhe erërat e pakëndshme.',
      'Zgjidh pambukun: të brendshmet prej pambuku e lejojnë lëkurën të marrë frymë dhe ulin rrezikun e acarimit.',
    ],
    thingsToAvoid: [
      'Sapunët e fortë dhe produktet me aromë',
      'Dushet vaginale, që prishin florën tënde natyrale',
      'Mbajtja për shumë kohë e një peshqiri higjienik ose tamponi të lagur',
    ],
    consultReasons: [
      'Acarim, kruarje ose djegie e vazhdueshme',
      'Erë e pazakontë ose sekrecione të ndryshme nga ato që janë normale për ty',
      'Dhimbje e fortë ose simptoma që të shqetësojnë',
    ],
    tipTitle: 'Këshillë nga AWA',
    tipText: 'Trupi yt ka tashmë një mekanizëm natyral ekuilibrimi. Zakonisht mjafton një larje e butë.',
    takeawaysTitle: 'Pikat kryesore',
    takeaways: [
      'Larje e butë me ujë të pastër',
      'Ndërro rregullisht',
      'Shmang produktet me aromë',
      'Zgjidh pambukun',
    ],
    relatedTitle: '♥  Mund të të pëlqejnë edhe',
    related: [
      {
        title: 'Kuptimi i dhimbjes menstruale',
        meta: '7 min  ·  Udhëzues',
      },
      {
        title: 'Zgjedhja e mbrojtjes së duhur për trupin tënd',
        meta: '5 min  ·  Udhëzues',
      },
      {
        title: 'Si t’i lehtësosh krambat në mënyrë natyrale',
        meta: '6 min  ·  Udhëzues',
      },
    ],
    shareTitle: 'Higjiena intime · AWA',
    shareMessage: 'Kujdesi për higjienën intime gjatë menstruacioneve · AWA',
  },
  ja: {
    badge: '経血量',
    title: '生理中の\nデリケートゾーンのケア',
    metaDuration: '読了6分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '監修済みの内容',
    intro: 'デリケートゾーンを清潔に保つことは、体と、体が本来持っているバランスを大切にすることです。',
    contentsTitle: 'この記事の内容',
    topics: [
      'なぜ大切なのか',
      'よい習慣',
      '避けたいこと',
      '医師に相談するタイミング',
      '毎日に役立つヒント',
    ],
    body: '生理中は体が変化し、いつもより敏感になります。よい習慣を身につけると、かぶれや感染症を防ぎやすくなり、毎日を快適に過ごせます。',
    goodPractices: [
      'やさしく洗う：ぬるま湯で前から後ろへ流すだけで十分です。これで自然な常在菌を守れます。',
      '生理用品をこまめに交換する：湿気や不快なにおいを避けるため、4〜6時間ごとに交換します。',
      'コットンを選ぶ：綿の下着は肌が呼吸しやすく、かぶれのリスクを減らします。',
    ],
    thingsToAvoid: [
      '刺激の強い石けんや香りの強い製品',
      '腟洗浄。自然な常在菌のバランスを乱します',
      '湿ったナプキンやタンポンを長時間つけたままにすること',
    ],
    consultReasons: [
      'かぶれ、かゆみ、ヒリヒリ感が続く',
      'いつもと違うにおいやおりもの',
      '強い痛みや、気になる症状がある',
    ],
    tipTitle: 'AWAからのヒント',
    tipText: '体にはもともと、自然にバランスを保つしくみがあります。やさしく洗うだけで、たいていは十分です。',
    takeawaysTitle: 'ポイントのまとめ',
    takeaways: [
      'ぬるま湯でやさしく洗う',
      'こまめに交換する',
      '香りの強い製品は避ける',
      'コットンを選ぶ',
    ],
    relatedTitle: '♥  こちらもおすすめ',
    related: [
      {
        title: '生理痛について知ろう',
        meta: '7分  ·  ガイド',
      },
      {
        title: '自分の体に合った生理用品の選び方',
        meta: '5分  ·  ガイド',
      },
      {
        title: '生理痛を自然にやわらげるには',
        meta: '6分  ·  ガイド',
      },
    ],
    shareTitle: 'デリケートゾーンのケア · AWA',
    shareMessage: '生理中のデリケートゾーンのケア · AWA',
  },
  ko: {
    badge: '생리 출혈',
    title: '생리 중\n질 주변 위생 관리하기',
    metaDuration: '6분 읽기',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '질 주변 위생을 관리하는 것은 내 몸과 몸의 자연스러운 균형을 존중하는 일이에요.',
    contentsTitle: '이 아티클에서는',
    topics: [
      '왜 중요할까요',
      '좋은 습관',
      '피해야 할 것',
      '의사에게 진료받아야 할 때',
      '실용적인 팁',
    ],
    body: '생리 중에는 몸이 달라지고 더 민감해져요. 올바른 습관을 들이면 자극과 감염을 예방하고 일상에서 편안하게 지내는 데 도움이 돼요.',
    goodPractices: [
      '부드럽게 씻어요. 앞에서 뒤로 맑은 물로 헹구는 것만으로도 충분히 자연 균총을 지킬 수 있어요.',
      '생리용품을 정기적으로 갈아요. 4~6시간마다 갈아 주면 습기와 불쾌한 냄새를 막을 수 있어요.',
      '면 소재를 골라요. 면 속옷은 피부가 숨을 쉬게 해 주고 자극의 위험을 줄여 줘요.',
    ],
    thingsToAvoid: [
      '자극이 강한 비누와 향이 있는 제품',
      '자연 균총을 무너뜨리는 질 세정',
      '젖은 생리대나 탐폰을 너무 오래 쓰는 것',
    ],
    consultReasons: [
      '자극, 가려움, 따가움이 계속될 때',
      '평소와 다른 냄새나 분비물이 있을 때',
      '심한 통증이나 걱정되는 증상이 있을 때',
    ],
    tipTitle: 'AWA 팁',
    tipText: '몸에는 이미 스스로 균형을 맞추는 자연스러운 기능이 있어요. 보통은 부드럽게 씻는 것으로 충분해요.',
    takeawaysTitle: '핵심 정리',
    takeaways: [
      '맑은 물로 부드럽게 씻기',
      '정기적으로 갈아 주기',
      '향이 있는 제품 피하기',
      '면 소재 고르기',
    ],
    relatedTitle: '♥  함께 보면 좋은 글',
    related: [
      {
        title: '생리통 이해하기',
        meta: '7분  ·  가이드',
      },
      {
        title: '내 몸에 맞는 생리용품 고르기',
        meta: '5분  ·  가이드',
      },
      {
        title: '생리통을 자연스럽게 완화하는 방법',
        meta: '6분  ·  가이드',
      },
    ],
    shareTitle: '질 주변 위생 · AWA',
    shareMessage: '생리 중 질 주변 위생 관리하기 · AWA',
  },
  'pt-PT': {
    badge: 'FLUXO MENSTRUAL',
    title: 'Cuidar da sua higiene íntima\ndurante o período',
    metaDuration: '6 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Cuidar da higiene íntima é respeitar o seu corpo e o seu equilíbrio natural.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Porque é importante',
      'Bons hábitos',
      'O que evitar',
      'Quando consultar um médico',
      'Dicas práticas',
    ],
    body: 'Durante o período, o seu corpo muda e torna-se mais sensível. Adotar os hábitos certos ajuda a prevenir irritações e infeções e a manter-se confortável no dia a dia.',
    goodPractices: [
      'Lave com suavidade: basta um simples enxaguamento com água limpa, da frente para trás, para proteger a sua flora natural.',
      'Mude a proteção com regularidade: a cada 4 a 6 horas, para evitar a humidade e os odores desagradáveis.',
      'Escolha algodão: a roupa interior de algodão deixa a pele respirar e reduz o risco de irritação.',
    ],
    thingsToAvoid: [
      'Sabonetes agressivos e produtos perfumados',
      'Duches vaginais, que perturbam a sua flora natural',
      'Manter um penso ou um tampão húmido durante demasiado tempo',
    ],
    consultReasons: [
      'Irritação, comichão ou ardor persistentes',
      'Odor ou corrimento incomuns, diferentes do que é normal para si',
      'Dor significativa ou sintomas que a preocupem',
    ],
    tipTitle: 'Dica AWA',
    tipText: 'O seu corpo já tem um mecanismo natural de equilíbrio. Uma lavagem suave é normalmente suficiente.',
    takeawaysTitle: 'Pontos essenciais',
    takeaways: [
      'Lavagem suave com água limpa',
      'Mudar com regularidade',
      'Evitar produtos perfumados',
      'Escolher algodão',
    ],
    relatedTitle: '♥  Também pode gostar',
    related: [
      {
        title: 'Compreender a dor menstrual',
        meta: '7 min  ·  Guia',
      },
      {
        title: 'Escolher a proteção certa para o seu corpo',
        meta: '5 min  ·  Guia',
      },
      {
        title: 'Como aliviar as cólicas menstruais de forma natural',
        meta: '6 min  ·  Guia',
      },
    ],
    shareTitle: 'Higiene íntima · AWA',
    shareMessage: 'Cuidar da sua higiene íntima durante o período · AWA',
  },
  bn: {
    badge: 'মাসিকের রক্তক্ষরণ',
    title: 'মাসিকের সময়\nব্যক্তিগত পরিচ্ছন্নতার যত্ন নিন',
    metaDuration: 'পড়তে 6 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'ব্যক্তিগত পরিচ্ছন্নতার যত্ন নেওয়া মানে নিজের শরীর ও তার স্বাভাবিক ভারসাম্যকে সম্মান করা।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'কেন এটি গুরুত্বপূর্ণ',
      'ভালো অভ্যাস',
      'যা এড়িয়ে চলবেন',
      'কখন ডাক্তার দেখাবেন',
      'বাস্তব পরামর্শ',
    ],
    body: 'মাসিকের সময় আপনার শরীর বদলায় এবং আরও সংবেদনশীল হয়ে ওঠে। সঠিক অভ্যাস গড়ে তুললে জ্বালা ও সংক্রমণ প্রতিরোধ করা যায় এবং প্রতিদিন স্বাচ্ছন্দ্যে থাকা যায়।',
    goodPractices: [
      'আলতো করে ধুয়ে নিন: সামনে থেকে পেছনের দিকে পরিষ্কার পানি দিয়ে সাধারণ ধুয়ে নেওয়াই আপনার স্বাভাবিক জীবাণু-ভারসাম্য রক্ষার জন্য যথেষ্ট।',
      'নিয়মিত সুরক্ষা সামগ্রী বদলান: ভেজা ভাব ও অস্বস্তিকর গন্ধ এড়াতে প্রতি 4 থেকে 6 ঘণ্টায় বদলান।',
      'সুতির কাপড় বেছে নিন: সুতির অন্তর্বাসে ত্বক শ্বাস নিতে পারে এবং জ্বালার ঝুঁকি কমে।',
    ],
    thingsToAvoid: [
      'কড়া সাবান ও সুগন্ধিযুক্ত পণ্য',
      'যোনিপথ ধোয়ার ডুশ, যা আপনার স্বাভাবিক জীবাণু-ভারসাম্য নষ্ট করে',
      'ভেজা প্যাড বা ট্যাম্পন অনেকক্ষণ ধরে পরে থাকা',
    ],
    consultReasons: [
      'দীর্ঘস্থায়ী জ্বালা, চুলকানি বা জ্বালাপোড়া',
      'অস্বাভাবিক গন্ধ বা স্রাব, যা আপনার জন্য স্বাভাবিকের চেয়ে আলাদা',
      'উল্লেখযোগ্য ব্যথা বা এমন উপসর্গ, যা আপনাকে দুশ্চিন্তায় ফেলে',
    ],
    tipTitle: 'AWA-র পরামর্শ',
    tipText: 'আপনার শরীরে আগে থেকেই একটি স্বাভাবিক ভারসাম্য রক্ষার ব্যবস্থা আছে। সাধারণত আলতো করে ধুয়ে নেওয়াই যথেষ্ট।',
    takeawaysTitle: 'মূল কথা',
    takeaways: [
      'পরিষ্কার পানিতে আলতো করে ধোয়া',
      'নিয়মিত বদলানো',
      'সুগন্ধিযুক্ত পণ্য এড়িয়ে চলা',
      'সুতির কাপড় বেছে নেওয়া',
    ],
    relatedTitle: '♥  আপনার আরও ভালো লাগতে পারে',
    related: [
      {
        title: 'মাসিকের ব্যথা বোঝা',
        meta: '7 মিনিট  ·  গাইড',
      },
      {
        title: 'আপনার শরীরের জন্য সঠিক সুরক্ষা সামগ্রী বেছে নেওয়া',
        meta: '5 মিনিট  ·  গাইড',
      },
      {
        title: 'প্রাকৃতিকভাবে মাসিকের ব্যথা কীভাবে কমাবেন',
        meta: '6 মিনিট  ·  গাইড',
      },
    ],
    shareTitle: 'ব্যক্তিগত পরিচ্ছন্নতা · AWA',
    shareMessage: 'মাসিকের সময় ব্যক্তিগত পরিচ্ছন্নতার যত্ন নিন · AWA',
  },
  da: {
    badge: 'MENSTRUATIONSFLOW',
    title: 'Intim hygiejne\nunder din menstruation',
    metaDuration: '6 min læsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'At passe på sin hygiejne betyder at respektere sin krop og dens naturlige balance.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvorfor det er vigtigt',
      'Gode vaner',
      'Hvad du bør undgå',
      'Hvornår du bør se en læge',
      'Praktiske råd',
    ],
    body: 'Under din menstruation forandrer din krop sig og bliver mere følsom. At opbygge gode vaner hjælper dig med at forebygge irritation og infektioner og føle dig godt tilpas i hverdagen.',
    goodPractices: [
      'Vask forsigtigt: en simpel skylning med rent vand forfra og bagud er tilstrækkelig til at bevare din naturlige bakteriebalance.',
      'Skift bind/tampon regelmæssigt: skift hvert 4. til 6. time for at undgå fugt og ubehagelig lugt.',
      'Vælg bomuld: bomuld lader huden ånde og nedsætter risikoen for irritation.',
    ],
    thingsToAvoid: [
      'Stærk sæbe og parfumerede produkter',
      'Vaginale skoldinger (douching), som forstyrrer din naturlige bakteriebalance',
      'At bære et vådt bind eller en tam pong i for lang tid',
    ],
    consultReasons: [
      'Vedvarende irritation, kløe eller svie',
      'Usædvanlig lugt eller udflåd, anderledes end hvad der er normalt for dig',
      'Markante smerter eller symptomer der bekymrer dig',
    ],
    tipTitle: 'AWA-råd',
    tipText: 'Din krop har allerede sit eget system til at opretholde en naturlig balance. En blid skylning er normalt alt, hvad der skal til.',
    takeawaysTitle: 'De vigtigste punkter',
    takeaways: [
      'Vask forsigtigt med rent vand',
      'Skift regelmæssigt',
      'Undgå parfumerede produkter',
      'Vælg bomuld',
    ],
    relatedTitle: '♥  Du kan også lide',
    related: [
      {
        title: 'Forstå menstruationssmerter',
        meta: '7 min  ·  Guide',
      },
      {
        title: 'Find den rette beskyttelse til din krop',
        meta: '5 min  ·  Guide',
      },
      {
        title: 'Sådan lindrer du menstruationssmerter naturligt',
        meta: '6 min  ·  Guide',
      },
    ],
    shareTitle: 'Intim hygiejne · AWA',
    shareMessage: 'Intim hygiejne under din menstruation · AWA',
  },
  sv: {
    badge: 'MENSTRUATIONSFLOW',
    title: 'Intim hygiejne\nunder din menstruation',
    metaDuration: '6 min läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'At passe på sin hygiejne betyder at respektere sin krop och dens naturlige balance.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvorfor det ar vigtigt',
      'Gode vaner',
      'Hvad du bör undgå',
      'Hvornår du bör se en läge',
      'Praktiske råd',
    ],
    body: 'Under din menstruation forandrer din krop sig och bliver mere fölsom. At opbygge gode vaner hjälper dig med at forebygge irritation och infektioner och föle dig godt tilpas i hverdagen.',
    goodPractices: [
      'Vask forsigtigt: en simpel skylning med rent vand forfra och bagud ar tilsträkkelig till at bevare din naturlige bakteriebalance.',
      'Skift bind/tampon regelmässigt: skift hvert 4. till 6. time for att undgå fugt och ubehagelig lugt.',
      'Välg bomuld: bomuld lader huden ånde och nedsätter risikoen for irritation.',
    ],
    thingsToAvoid: [
      'Stärk säbe och parfumerede produkter',
      'Vaginale skoldinger (douching), som forstyrrer din naturlige bakteriebalance',
      'At bäre et vådt bind eller en tam pong i for lang tid',
    ],
    consultReasons: [
      'Vedvarende irritation, klöe eller svie',
      'Usädvanlig lugt eller udflåd, anderledes end hvad der ar normalt for dig',
      'Markante smartor eller symtom der bekymrer dig',
    ],
    tipTitle: 'AWA-råd',
    tipText: 'Din krop har redan sit eget system till at opretholde en naturlig balance. En blid skylning ar normalt alt, hvad der skal till.',
    takeawaysTitle: 'De vigtigste punkter',
    takeaways: [
      'Vask forsigtigt med rent vand',
      'Skift regelmässigt',
      'Undgå parfumerede produkter',
      'Välg bomuld',
    ],
    relatedTitle: '♥  Du kan også lide',
    related: [
      {
        title: 'Forstå menstruationssmerter',
        meta: '7 min  ·  Guide',
      },
      {
        title: 'Find den rette beskyttelse till din krop',
        meta: '5 min  ·  Guide',
      },
      {
        title: 'Sådan lindrer du menstruationssmartor naturligt',
        meta: '6 min  ·  Guide',
      },
    ],
    shareTitle: 'Intim hygiejne · AWA',
    shareMessage: 'Intim hygiejne under din menstruation · AWA',
  },
  nb: {
    badge: 'MENSTRUASJONSBLØDNING',
    title: 'Ta vare på den intime hygienen\nunder mensen',
    metaDuration: '6 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Å ta vare på den intime hygienen betyr å respektere kroppen din og dens naturlige balanse.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hvorfor det er viktig',
      'Gode vaner',
      'Hva du bør unngå',
      'Når du bør gå til lege',
      'Praktiske tips',
    ],
    body: 'Under mensen endrer kroppen din seg og blir mer følsom. Gode vaner bidrar til å forebygge irritasjon og infeksjon, og hjelper deg å føle deg komfortabel i hverdagen.',
    goodPractices: [
      'Vask deg forsiktig: en enkel skylling med rent vann, forfra og bakover, er nok til å beskytte den naturlige floraen.',
      'Bytt beskyttelse jevnlig: hver 4. til 6. time for å unngå fuktighet og ubehagelig lukt.',
      'Velg bomull: undertøy i bomull lar huden puste og reduserer risikoen for irritasjon.',
    ],
    thingsToAvoid: [
      'Sterke såper og parfymerte produkter',
      'Vaginalskylling, som forstyrrer den naturlige floraen',
      'Å ha et fuktig bind eller en fuktig tampong på for lenge',
    ],
    consultReasons: [
      'Vedvarende irritasjon, kløe eller svie',
      'Uvanlig lukt eller utflod som er annerledes enn det som er normalt for deg',
      'Betydelig smerte eller symptomer som bekymrer deg',
    ],
    tipTitle: 'AWA-tips',
    tipText: 'Kroppen din har allerede en naturlig balansemekanisme. En mild vask er vanligvis nok.',
    takeawaysTitle: 'Det viktigste å huske',
    takeaways: [
      'Mild vask med rent vann',
      'Bytt jevnlig',
      'Unngå parfymerte produkter',
      'Velg bomull',
    ],
    relatedTitle: '♥  Dette liker du kanskje også',
    related: [
      {title: 'Forstå menstruasjonssmerter', meta: '7 min  ·  Veiledning'},
      {title: 'Velge riktig beskyttelse for kroppen din', meta: '5 min  ·  Veiledning'},
      {title: 'Slik lindrer du kramper naturlig', meta: '6 min  ·  Veiledning'},
    ],
    shareTitle: 'Intim hygiene · AWA',
    shareMessage: 'Ta vare på den intime hygienen under mensen · AWA',
  },
  pl: {
    badge: 'KRWAWIENIE MIESIĄCZKOWE',
    title: 'Dbanie o higienę intymną\npodczas miesiączki',
    metaDuration: '6 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Dbanie o higienę intymną to szacunek dla własnego ciała i jego naturalnej równowagi.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Dlaczego to ważne',
      'Dobre nawyki',
      'Czego unikać',
      'Kiedy zgłosić się do lekarza',
      'Praktyczne wskazówki',
    ],
    body: 'Podczas miesiączki Twoje ciało się zmienia i staje się bardziej wrażliwe. Dobre nawyki pomagają zapobiegać podrażnieniom i infekcjom oraz czuć się komfortowo każdego dnia.',
    goodPractices: [
      'Myj się delikatnie: wystarczy zwykłe opłukanie czystą wodą, od przodu do tyłu, by chronić naturalną florę.',
      'Regularnie zmieniaj środek ochrony: co 4 do 6 godzin, by uniknąć wilgoci i nieprzyjemnego zapachu.',
      'Wybieraj bawełnę: bawełniana bielizna pozwala skórze oddychać i zmniejsza ryzyko podrażnień.',
    ],
    thingsToAvoid: [
      'Ostre mydła i produkty zapachowe',
      'Irygacje pochwy, które zaburzają naturalną florę',
      'Zbyt długie noszenie wilgotnej podpaski lub tamponu',
    ],
    consultReasons: [
      'Uporczywe podrażnienie, swędzenie lub pieczenie',
      'Nietypowy zapach lub upławy, inne niż zwykle u Ciebie',
      'Silny ból lub objawy, które Cię niepokoją',
    ],
    tipTitle: 'Wskazówka AWA',
    tipText: 'Twoje ciało ma już naturalny mechanizm równowagi. Zwykle wystarczy delikatne mycie.',
    takeawaysTitle: 'Najważniejsze wnioski',
    takeaways: [
      'Delikatne mycie czystą wodą',
      'Regularna zmiana środka ochrony',
      'Unikanie produktów zapachowych',
      'Wybieranie bawełny',
    ],
    relatedTitle: '♥  Może Cię też zainteresować',
    related: [
      {title: 'Zrozumieć ból miesiączkowy', meta: '7 min  ·  Poradnik'},
      {title: 'Wybór środka ochrony odpowiedniego dla Twojego ciała', meta: '5 min  ·  Poradnik'},
      {title: 'Jak naturalnie łagodzić skurcze', meta: '6 min  ·  Poradnik'},
    ],
    shareTitle: 'Higiena intymna · AWA',
    shareMessage: 'Dbanie o higienę intymną podczas miesiączki · AWA',
  },
  uk: {
    badge: 'МЕНСТРУАЛЬНІ ВИДІЛЕННЯ',
    title: 'Інтимна гігієна\nпід час менструації',
    metaDuration: '6 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Дбати про інтимну гігієну — означає поважати своє тіло та його природну рівновагу.',
    contentsTitle: 'У цій статті',
    topics: [
      'Чому це важливо',
      'Гарні звички',
      'Чого уникати',
      'Коли звернутися до лікаря',
      'Практичні поради',
    ],
    body: 'Під час менструації ваше тіло змінюється й стає чутливішим. Правильні звички допомагають запобігати подразненням та інфекціям і почуватися комфортно щодня.',
    goodPractices: [
      'Мийтеся ніжно: достатньо звичайного ополіскування чистою водою спереду назад, щоб захистити природну мікрофлору.',
      'Регулярно змінюйте засіб гігієни: кожні 4–6 годин, щоб уникнути вологи й неприємного запаху.',
      'Обирайте бавовну: бавовняна білизна дозволяє шкірі дихати й зменшує ризик подразнень.',
    ],
    thingsToAvoid: [
      'Агресивне мило та ароматизовані засоби',
      'Вагінальні спринцювання, що порушують природну мікрофлору',
      'Надто довге носіння вологої прокладки чи тампона',
    ],
    consultReasons: [
      'Стійке подразнення, свербіж або печіння',
      'Незвичний запах або виділення, не схожі на ваші звичні',
      'Сильний біль або симптоми, що вас турбують',
    ],
    tipTitle: 'Порада AWA',
    tipText: 'У вашого тіла вже є природний механізм рівноваги. Зазвичай достатньо ніжного миття.',
    takeawaysTitle: 'Головні висновки',
    takeaways: [
      'Ніжне миття чистою водою',
      'Регулярна зміна засобу гігієни',
      'Уникайте ароматизованих засобів',
      'Обирайте бавовну',
    ],
    relatedTitle: '♥  Вас також може зацікавити',
    related: [
      {title: 'Розуміння менструального болю', meta: '7 хв  ·  Посібник'},
      {title: 'Вибір засобу гігієни, що підходить вашому тілу', meta: '5 хв  ·  Посібник'},
      {title: 'Як природно полегшити спазми', meta: '6 хв  ·  Посібник'},
    ],
    shareTitle: 'Інтимна гігієна · AWA',
    shareMessage: 'Інтимна гігієна під час менструації · AWA',
  },
  cs: {
    badge: 'MENSTRUAČNÍ KRVÁCENÍ',
    title: 'Péče o intimní hygienu\nběhem menstruace',
    metaDuration: '6 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Péče o intimní hygienu znamená respektovat své tělo a jeho přirozenou rovnováhu.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Proč je to důležité',
      'Dobré návyky',
      'Čemu se vyhnout',
      'Kdy navštívit lékaře',
      'Praktické tipy',
    ],
    body: 'Během menstruace se vaše tělo mění a stává se citlivějším. Správné návyky pomáhají předcházet podráždění a infekcím a pomáhají vám cítit se v každodenním životě pohodlně.',
    goodPractices: [
      'Myjte se jemně: stačí jednoduché opláchnutí čistou vodou, zepředu dozadu, které chrání vaši přirozenou mikroflóru.',
      'Pravidelně měňte ochranu: každé 4 až 6 hodin, abyste se vyhnula vlhkosti a nepříjemným zápachům.',
      'Zvolte bavlnu: bavlněné kalhotky nechávají pokožku dýchat a snižují riziko podráždění.',
    ],
    thingsToAvoid: [
      'Agresivní mýdla a parfémované přípravky',
      'Vaginální výplachy, které narušují přirozenou mikroflóru',
      'Příliš dlouho ponechaná vlhká vložka nebo tampon',
    ],
    consultReasons: [
      'Přetrvávající podráždění, svědění nebo pálení',
      'Neobvyklý zápach nebo výtok, který se liší od toho, co je pro vás normální',
      'Výrazná bolest nebo příznaky, které vás znepokojují',
    ],
    tipTitle: 'Tip AWA',
    tipText: 'Vaše tělo už má přirozený vyrovnávací mechanismus. Obvykle stačí jemné mytí.',
    takeawaysTitle: 'Hlavní poznatky',
    takeaways: [
      'Jemné mytí čistou vodou',
      'Pravidelná výměna',
      'Vyhýbat se parfémovaným přípravkům',
      'Zvolit bavlnu',
    ],
    relatedTitle: '♥  Mohlo by se vám líbit',
    related: [
      {title: 'Pochopení menstruační bolesti', meta: '7 min  ·  Průvodce'},
      {title: 'Výběr správné ochrany pro vaše tělo', meta: '5 min  ·  Průvodce'},
      {title: 'Jak přirozeně zmírnit křeče', meta: '6 min  ·  Průvodce'},
    ],
    shareTitle: 'Intimní hygiena · AWA',
    shareMessage: 'Péče o intimní hygienu během menstruace · AWA',
  },
  sk: {
    badge: 'MENŠTRUAČNÉ KRVÁCANIE',
    title: 'Starostlivosť o intímnu hygienu\npočas menštruácie',
    metaDuration: '6 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Starostlivosť o intímnu hygienu znamená rešpektovať svoje telo a jeho prirodzenú rovnováhu.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Prečo na tom záleží',
      'Dobré návyky',
      'Čomu sa vyhnúť',
      'Kedy navštíviť lekára',
      'Praktické tipy',
    ],
    body: 'Počas menštruácie sa vaše telo mení a stáva sa citlivejším. Správne návyky pomáhajú predchádzať podráždeniu a infekciám a udržať pohodlie v každodennom živote.',
    goodPractices: [
      'Umývajte sa jemne: stačí jednoduché opláchnutie čistou vodou, smerom spredu dozadu, aby ste ochránili prirodzenú flóru.',
      'Pravidelne meňte hygienickú pomôcku: každé 4 až 6 hodín, aby ste predišli vlhkosti a nepríjemnému zápachu.',
      'Zvoľte bavlnu: bavlnená bielizeň nechá pokožku dýchať a znižuje riziko podráždenia.',
    ],
    thingsToAvoid: [
      'Agresívne mydlá a parfumované výrobky',
      'Vaginálne výplachy, ktoré narúšajú prirodzenú flóru',
      'Príliš dlho ponechaná vlhká vložka alebo tampón',
    ],
    consultReasons: [
      'Pretrvávajúce podráždenie, svrbenie alebo pálenie',
      'Nezvyčajný zápach alebo výtok odlišný od toho, čo je pre vás normálne',
      'Výrazná bolesť alebo príznaky, ktoré vás znepokojujú',
    ],
    tipTitle: 'Tip AWA',
    tipText: 'Vaše telo už má prirodzený vyrovnávací mechanizmus. Zvyčajne stačí jemné umytie.',
    takeawaysTitle: 'Hlavné body',
    takeaways: [
      'Jemné umývanie čistou vodou',
      'Pravidelná výmena',
      'Vyhnite sa parfumovaným výrobkom',
      'Zvoľte bavlnu',
    ],
    relatedTitle: '♥  Mohlo by sa vám páčiť',
    related: [
      {title: 'Pochopenie menštruačných bolestí', meta: '7 min  ·  Sprievodca'},
      {title: 'Výber správnej hygienickej pomôcky pre vaše telo', meta: '5 min  ·  Sprievodca'},
      {title: 'Ako prirodzene zmierniť kŕče', meta: '6 min  ·  Sprievodca'},
    ],
    shareTitle: 'Intímna hygiena · AWA',
    shareMessage: 'Starostlivosť o intímnu hygienu počas menštruácie · AWA',
  },
  hu: {
    badge: 'MENSTRUÁCIÓS VÉRZÉS',
    title: 'Az intim higiénia\na menstruáció alatt',
    metaDuration: '6 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Az intim higiéniáról való gondoskodás a tested és természetes egyensúlyának tiszteletét jelenti.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Miért fontos',
      'Jó szokások',
      'Mit kerülj',
      'Mikor menj orvoshoz',
      'Praktikus tippek',
    ],
    body: 'A menstruáció alatt a tested változik, és érzékenyebbé válik. A helyes szokások segítenek megelőzni az irritációt és a fertőzéseket, és a mindennapokban is kényelmesen tartanak.',
    goodPractices: [
      'Kíméletesen tisztálkodj: elég egy egyszerű öblítés tiszta vízzel, elölről hátrafelé, hogy megvédd a természetes flórádat.',
      'Rendszeresen cseréld a higiéniai terméket: 4–6 óránként, hogy elkerüld a nedvességet és a kellemetlen szagokat.',
      'Válassz pamutot: a pamut fehérnemű lélegezni hagyja a bőrt, és csökkenti az irritáció kockázatát.',
    ],
    thingsToAvoid: [
      'Durva szappanok és illatosított termékek',
      'Hüvelyi öblítések, amelyek megzavarják a természetes flórádat',
      'Túl sokáig viselt nedves betét vagy tampon',
    ],
    consultReasons: [
      'Tartós irritáció, viszketés vagy égő érzés',
      'Szokatlan szag vagy folyás, amely eltér a számodra megszokottól',
      'Jelentős fájdalom vagy aggasztó tünetek',
    ],
    tipTitle: 'AWA-tipp',
    tipText: 'A testednek már van természetes egyensúlyozó mechanizmusa. Általában elég egy kíméletes mosakodás.',
    takeawaysTitle: 'Legfontosabb tudnivalók',
    takeaways: [
      'Kíméletes mosakodás tiszta vízzel',
      'Rendszeres csere',
      'Kerüld az illatosított termékeket',
      'Válassz pamutot',
    ],
    relatedTitle: '♥  Ez is tetszhet',
    related: [
      {title: 'A menstruációs fájdalom megértése', meta: '7 perc  ·  Útmutató'},
      {title: 'A tested számára megfelelő higiéniai termék kiválasztása', meta: '5 perc  ·  Útmutató'},
      {title: 'Hogyan enyhítsd természetesen a görcsöket', meta: '6 perc  ·  Útmutató'},
    ],
    shareTitle: 'Intim higiénia · AWA',
    shareMessage: 'Az intim higiénia a menstruáció alatt · AWA',
  },
  ro: {
    badge: 'FLUX MENSTRUAL',
    title: 'Igiena intimă\nîn timpul menstruației',
    metaDuration: '6 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'A avea grijă de igiena ta intimă înseamnă a-ți respecta corpul și echilibrul lui natural.',
    contentsTitle: 'În acest articol',
    topics: [
      'De ce contează',
      'Obiceiuri bune',
      'Ce să eviți',
      'Când să mergi la medic',
      'Sfaturi practice',
    ],
    body: 'În timpul menstruației, corpul tău se schimbă și devine mai sensibil. Adoptarea obiceiurilor potrivite ajută la prevenirea iritațiilor și a infecțiilor și te ajută să rămâi confortabilă zi de zi.',
    goodPractices: [
      'Spală-te blând: o simplă clătire cu apă curată, din față spre spate, este suficientă pentru a-ți proteja flora naturală.',
      'Schimbă-ți protecția regulat: la fiecare 4-6 ore, pentru a evita umezeala și mirosurile neplăcute.',
      'Alege bumbacul: lenjeria din bumbac lasă pielea să respire și reduce riscul de iritații.',
    ],
    thingsToAvoid: [
      'Săpunuri agresive și produse parfumate',
      'Dușurile vaginale, care dereglă flora naturală',
      'Păstrarea prea mult timp a unui absorbant sau tampon umed',
    ],
    consultReasons: [
      'Iritație, mâncărime sau arsură persistente',
      'Miros neobișnuit sau secreții diferite de ceea ce este normal pentru tine',
      'Durere importantă sau simptome care te îngrijorează',
    ],
    tipTitle: 'Sfat AWA',
    tipText: 'Corpul tău are deja un mecanism natural de echilibrare. O spălare blândă este de obicei suficientă.',
    takeawaysTitle: 'Ce să reții',
    takeaways: [
      'Spălare blândă cu apă curată',
      'Schimbare regulată',
      'Evită produsele parfumate',
      'Alege bumbacul',
    ],
    relatedTitle: '♥  Ți-ar putea plăcea și',
    related: [
      {title: 'Înțelegerea durerilor menstruale', meta: '7 min  ·  Ghid'},
      {title: 'Alegerea protecției potrivite pentru corpul tău', meta: '5 min  ·  Ghid'},
      {title: 'Cum ameliorezi natural crampele', meta: '6 min  ·  Ghid'},
    ],
    shareTitle: 'Igiena intimă · AWA',
    shareMessage: 'Igiena intimă în timpul menstruației · AWA',
  },
  bg: {
    badge: 'МЕНСТРУАЛЕН ПОТОК',
    title: 'Интимна хигиена\nпо време на менструация',
    metaDuration: '6 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Грижата за интимната ти хигиена означава уважение към тялото ти и естествения му баланс.',
    contentsTitle: 'В тази статия',
    topics: [
      'Защо е важно',
      'Добри навици',
      'Какво да избягваш',
      'Кога да отидеш на лекар',
      'Практически съвети',
    ],
    body: 'По време на менструацията тялото ти се променя и става по-чувствително. Приемането на правилните навици помага за предотвратяване на дразнене и инфекции и ти помага да си комфортна ден за ден.',
    goodPractices: [
      'Мий се нежно: простото изплакване с чиста вода, отпред назад, е достатъчно, за да защитиш естествената си флора.',
      'Сменяй редовно защитата си: на всеки 4 до 6 часа, за да избегнеш влагата и неприятните миризми.',
      'Избирай памук: бельото от памук позволява на кожата да диша и намалява риска от дразнене.',
    ],
    thingsToAvoid: [
      'Агресивни сапуни и ароматизирани продукти',
      'Вагинални душове, които нарушават естествената ти флора',
      'Прекалено дългото носене на влажна превръзка или тампон',
    ],
    consultReasons: [
      'Упорито дразнене, сърбеж или парене',
      'Необичайна миризма или секрети, различни от нормалното за теб',
      'Значителна болка или симптоми, които те тревожат',
    ],
    tipTitle: 'Съвет от AWA',
    tipText: 'Тялото ти вече има естествен механизъм за балансиране. Нежното измиване обикновено е достатъчно.',
    takeawaysTitle: 'Какво да запомниш',
    takeaways: [
      'Нежно миене с чиста вода',
      'Редовна смяна',
      'Избягвай ароматизираните продукти',
      'Избирай памук',
    ],
    relatedTitle: '♥  Може да ти хареса и',
    related: [
      {title: 'Разбиране на менструалната болка', meta: '7 мин  ·  Ръководство'},
      {title: 'Избор на подходящата защита за тялото ти', meta: '5 мин  ·  Ръководство'},
      {title: 'Как да облекчиш естествено крампите', meta: '6 мин  ·  Ръководство'},
    ],
    shareTitle: 'Интимна хигиена · AWA',
    shareMessage: 'Интимна хигиена по време на менструация · AWA',
  },
  sr: {
    badge: 'МЕНСТРУАЛНИ ПРОТОК',
    title: 'Нега интимне хигијене\nтоком менструације',
    metaDuration: '6 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Брига о интимној хигијени значи поштовање свог тела и његове природне равнотеже.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Зашто је важна',
      'Добре навике',
      'Шта избегавати',
      'Када посетити лекара',
      'Практични савети',
    ],
    body: 'Током менструације твоје тело се мења и постаје осетљивије. Усвајање правих навика помаже у спречавању иритације и инфекције и помаже ти да останеш удобно из дана у дан.',
    goodPractices: [
      'Пери се нежно: довољно је просто испирање чистом водом, од напред ка назад, да заштитиш природну флору.',
      'Редовно мењај заштиту: сваких 4 до 6 сати да избегнеш влагу и непријатне мирисе.',
      'Изабери памук: памучни доњи веш омогућава кожи да дише и смањује ризик од иритације.',
    ],
    thingsToAvoid: [
      'Оштре сапуне и мирисне производе',
      'Вагиналне испирке, које нарушавају твоју природну флору',
      'Предугачко држање влажног улошка или тампона',
    ],
    consultReasons: [
      'Упорна иритација, свраб или пецкање',
      'Необичан мирис или исцедак који се разликује од онога што је нормално за тебе',
      'Значајан бол или симптоми који те брину',
    ],
    tipTitle: 'AWA савет',
    tipText: 'Твоје тело већ има природан механизам равнотеже. Нежно прање је обично довољно.',
    takeawaysTitle: 'Шта да запамтиш',
    takeaways: [
      'Нежно прање чистом водом',
      'Редовна промена',
      'Избегавај мирисне производе',
      'Изабери памук',
    ],
    relatedTitle: '♥  Можда ће ти се свидети и',
    related: [
      {title: 'Разумевање менструалног бола', meta: '7 мин  ·  Водич'},
      {title: 'Избор праве заштите за твоје тело', meta: '5 мин  ·  Водич'},
      {title: 'Како природно ублажити грчеве', meta: '6 мин  ·  Водич'},
    ],
    shareTitle: 'Интимна хигијена · AWA',
    shareMessage: 'Нега интимне хигијене током менструације · AWA',
  },
  hr: {
    badge: 'MENSTRUALNI PROTOK',
    title: 'Briga o intimnoj higijeni\ntijekom menstruacije',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Briga o intimnoj higijeni znači poštovati svoje tijelo i njegovu prirodnu ravnotežu.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Zašto je to važno',
      'Dobre navike',
      'Što izbjegavati',
      'Kada posjetiti liječnika',
      'Praktični savjeti',
    ],
    body: 'Tijekom menstruacije tvoje se tijelo mijenja i postaje osjetljivije. Usvajanje pravih navika pomaže spriječiti iritacije i infekcije te ti omogućuje da se svakodnevno osjećaš ugodno.',
    goodPractices: [
      'Peri se nježno: dovoljno je jednostavno ispiranje čistom vodom, od naprijed prema natrag, kako bi zaštitila prirodnu floru.',
      'Redovito mijenjaj zaštitu: svakih 4 do 6 sati kako bi izbjegla vlagu i neugodne mirise.',
      'Odaberi pamuk: pamučno donje rublje omogućuje koži da diše i smanjuje rizik od iritacije.',
    ],
    thingsToAvoid: [
      'Oštre sapune i mirisne proizvode',
      'Vaginalna ispiranja koja remete prirodnu floru',
      'Predugo zadržavanje vlažnog uloška ili tampona',
    ],
    consultReasons: [
      'Dugotrajna iritacija, svrbež ili peckanje',
      'Neobičan miris ili iscjedak drugačiji od onoga što je normalno za tebe',
      'Jaka bol ili simptomi koji te brinu',
    ],
    tipTitle: 'AWA savjet',
    tipText: 'Tvoje tijelo već ima prirodni mehanizam uravnoteženja. Nježno pranje obično je dovoljno.',
    takeawaysTitle: 'Ključne poruke',
    takeaways: [
      'Nježno pranje čistom vodom',
      'Redovita zamjena',
      'Izbjegavaj mirisne proizvode',
      'Odaberi pamuk',
    ],
    relatedTitle: '♥  Moglo bi ti se svidjeti',
    related: [
      {title: 'Razumijevanje menstrualne boli', meta: '7 min  ·  Vodič'},
      {title: 'Odabir prave zaštite za tvoje tijelo', meta: '5 min  ·  Vodič'},
      {title: 'Kako prirodno ublažiti grčeve', meta: '6 min  ·  Vodič'},
    ],
    shareTitle: 'Intimna higijena · AWA',
    shareMessage: 'Briga o intimnoj higijeni tijekom menstruacije · AWA',
  },
  bs: {
    badge: 'MENSTRUALNI PROTOK',
    title: 'Briga o intimnoj higijeni\ntijekom menstruacije',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Briga o intimnoj higijeni znači poštovati svoje tijelo i njegovu prirodnu ravnotežu.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Zašta je to važno',
      'Dobre navike',
      'Što izbjegavati',
      'Kada posjetiti ljekara',
      'Praktični savjeti',
    ],
    body: 'Tokom menstruacije tvoje se tijelo mijenja i postaje osjetljivije. Usvajanje pravih navika pomaže spriječiti iritacije i infekcije te ti omogućuje da se svakodnevno osjećaš ugodno.',
    goodPractices: [
      'Peri se nježno: dovoljno je jednostavno ispiranje čistom vodom, od naprijed prema natrag, kako bi zaštitila prirodnu floru.',
      'Redovito mijenjaj zaštitu: svakih 4 do 6 sati kako bi izbjegla vlagu i neugodne mirise.',
      'Odaberi pamuk: pamučno donje rublje omogućuje koži da diše i smanjuje rizik od iritacije.',
    ],
    thingsToAvoid: [
      'Oštre sapune i mirisne proizvode',
      'Vaginalna ispiranja koja remete prirodnu floru',
      'Predugo zadržavanje vlažnog uloška ili tampona',
    ],
    consultReasons: [
      'Dugotrajna iritacija, svrbež ili peckanje',
      'Neobičan miris ili iscjedak drugačiji od onoga što je normalno za tebe',
      'Jaka bol ili simptomi koji te brinu',
    ],
    tipTitle: 'AWA savjet',
    tipText: 'Tvoje tijelo već ima prirodni mehanizam uravnoteženja. Nježno pranje obično je dovoljno.',
    takeawaysTitle: 'Ključne poruke',
    takeaways: [
      'Nježno pranje čistom vodom',
      'Redovita zamjena',
      'Izbjegavaj mirisne proizvode',
      'Odaberi pamuk',
    ],
    relatedTitle: '♥  Moglo bi ti se svidjeti',
    related: [
      {title: 'Razumijevanje menstrualne boli', meta: '7 min  ·  Vodič'},
      {title: 'Odabir prave zaštite za tvoje tijelo', meta: '5 min  ·  Vodič'},
      {title: 'Kako prirodno ublažiti grčeve', meta: '6 min  ·  Vodič'},
    ],
    shareTitle: 'Intimna higijena · AWA',
    shareMessage: 'Briga o intimnoj higijeni tokom menstruacije · AWA',
  },
  sl: {
    badge: 'MENSTRUALNI TOK',
    title: 'Skrb za intimno higieno\nmed menstruacijo',
    metaDuration: '6 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Skrb za intimno higieno pomeni spoštovati svoje telo in njegovo naravno ravnovesje.',
    contentsTitle: 'V tem članku',
    topics: [
      'Zakaj je to pomembno',
      'Dobre navade',
      'Česa se izogibati',
      'Kdaj obiskati zdravnika',
      'Praktični nasveti',
    ],
    body: 'Med menstruacijo se tvoje telo spreminja in postane občutljivejše. Privzgojitev pravih navad pomaga preprečiti draženje in okužbe ter ti omogoča, da se vsak dan počutiš prijetno.',
    goodPractices: [
      'Umivaj se nežno: dovolj je preprosto izpiranje z bistro vodo, od spredaj nazaj, da zaščitiš naravno floro.',
      'Redno menjaj zaščito: vsakih 4 do 6 ur, da se izogneš vlagi in neprijetnim vonjem.',
      'Izberi bombaž: bombažno spodnje perilo koži omogoča dihanje in zmanjšuje tveganje za draženje.',
    ],
    thingsToAvoid: [
      'Ostra mila in dišeči izdelki',
      'Nožnična izpiranja, ki motijo naravno floro',
      'Predolgo puščanje vlažnega vložka ali tampona',
    ],
    consultReasons: [
      'Dolgotrajno draženje, srbenje ali pekoč občutek',
      'Nenavaden vonj ali izcedek, drugačen od običajnega zate',
      'Huda bolečina ali simptomi, ki te skrbijo',
    ],
    tipTitle: 'Nasvet AWA',
    tipText: 'Tvoje telo že ima naraven mehanizem uravnoteženja. Nežno umivanje je običajno dovolj.',
    takeawaysTitle: 'Ključna sporočila',
    takeaways: [
      'Nežno umivanje z bistro vodo',
      'Redna menjava',
      'Izogibaj se dišečim izdelkom',
      'Izberi bombaž',
    ],
    relatedTitle: '♥  Morda ti bo všeč tudi',
    related: [
      {title: 'Razumevanje menstrualne bolečine', meta: '7 min  ·  Vodnik'},
      {title: 'Izbira prave zaščite za tvoje telo', meta: '5 min  ·  Vodnik'},
      {title: 'Kako naravno lajšati krče', meta: '6 min  ·  Vodnik'},
    ],
    shareTitle: 'Intimna higiena · AWA',
    shareMessage: 'Skrb za intimno higieno med menstruacijo · AWA',
  },
  ne: {
    badge: 'महिनावारीको बहाव',
    title: 'महिनावारीमा आफ्नो निजी\nसरसफाइको ख्याल राख्नुहोस्',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'निजी सरसफाइको ख्याल राख्नुको अर्थ आफ्नो शरीर र यसको स्वाभाविक सन्तुलनको सम्मान गर्नु हो।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'यो किन महत्त्वपूर्ण छ',
      'राम्रा बानीहरू',
      'के जोगिने',
      'चिकित्सकलाई कहिले देखाउने',
      'व्यावहारिक सुझावहरू',
    ],
    body: 'महिनावारीको समयमा, तपाईंको शरीर बदलिन्छ र बढी संवेदनशील बन्छ। सही बानी अपनाउनाले जलन र सङ्क्रमण रोक्न र दिनदिनै सहज रहन मद्दत गर्छ।',
    goodPractices: [
      'कोमलतापूर्वक धुनुहोस्: अगाडिबाट पछाडितिर सफा पानीले सामान्य पखाल्नु नै तपाईंको स्वाभाविक वनस्पति जोगाउन पर्याप्त हुन्छ।',
      'आफ्नो सुरक्षा नियमित बदल्नुहोस्: ओसिलो र अप्रिय गन्धबाट बच्न हरेक 4 देखि 6 घण्टामा।',
      'सुती छान्नुहोस्: सुतीको अन्तर्वस्त्रले तपाईंको छालालाई सास फेर्न दिन्छ र जलनको जोखिम घटाउँछ।',
    ],
    thingsToAvoid: [
      'कडा साबुन र सुगन्धित उत्पादनहरू',
      'योनि डुश, जसले तपाईंको स्वाभाविक वनस्पति बिगार्छ',
      'ओसिलो प्याड वा ट्याम्पोन धेरै लामो समय लगाइराख्ने',
    ],
    consultReasons: [
      'लगातार जलन, चिलाउने वा पोल्ने',
      'तपाईंका लागि सामान्यभन्दा फरक असामान्य गन्ध वा स्राव',
      'ठूलो दुखाइ वा तपाईंलाई चिन्तित बनाउने लक्षणहरू',
    ],
    tipTitle: 'AWA को सुझाव',
    tipText: 'तपाईंको शरीरमा पहिल्यै स्वाभाविक सन्तुलन गर्ने संयन्त्र छ। कोमल पखाल्नु प्रायः पर्याप्त हुन्छ।',
    takeawaysTitle: 'मुख्य कुराहरू',
    takeaways: [
      'सफा पानीले कोमल पखाल्नु',
      'नियमित बदल्नुहोस्',
      'सुगन्धित उत्पादनहरू नजिकै नपार्नुहोस्',
      'सुती छान्नुहोस्',
    ],
    relatedTitle: '♥  तपाईंलाई यी पनि मन पर्न सक्छन्',
    related: [
      {title: 'महिनावारीको दुखाइ बुझ्नुहोस्', meta: '7 मिनेट  ·  मार्गदर्शन'},
      {title: 'आफ्नो शरीरका लागि सही सुरक्षा छान्ने', meta: '5 मिनेट  ·  मार्गदर्शन'},
      {title: 'ऐंठनलाई प्राकृतिक रूपमा कसरी कम गर्ने', meta: '6 मिनेट  ·  मार्गदर्शन'},
    ],
    shareTitle: 'निजी सरसफाइ · AWA',
    shareMessage: 'महिनावारीमा आफ्नो निजी सरसफाइको ख्याल राख्नुहोस् · AWA',
  },
  si: {
    badge: 'ඔසප් ගලනය',
    title: 'ඔබේ ඔසප් කාලයේ ඔබේ සමීප\nසනීපාරක්ෂාව ගැන සැලකිලිමත් වීම',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඔබේ සමීප සනීපාරක්ෂාව ගැන සැලකිලිමත් වීම යනු ඔබේ ශරීරයට සහ එහි ස්වාභාවික සමතුලිතතාවට ගරු කිරීමයි.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'එය වැදගත් වන්නේ ඇයි',
      'හොඳ පුරුදු',
      'වළක්වා ගත යුතු දේ',
      'වෛද්‍යවරයෙකු හමුවිය යුත්තේ කවදාද',
      'ප්‍රායෝගික ඉඟි',
    ],
    body: 'ඔබේ ඔසප් කාලයේදී, ඔබේ ශරීරය වෙනස් වී වඩාත් සංවේදී වේ. නිවැරදි පුරුදු අනුගමනය කිරීම කෝපනය සහ ආසාදන වැළැක්වීමට සහ දිනෙන් දින ඔබට සුවපහසුව පවත්වා ගැනීමට උපකාරී වේ.',
    goodPractices: [
      'මෘදුවට සෝදන්න: ඔබේ ස්වාභාවික ක්ෂුද්‍ර ජීවී ශාක ආරක්ෂා කිරීමට, ඉදිරියේ සිට පිටුපසට, පැහැදිලි ජලයෙන් සරල සේදීමක් ප්‍රමාණවත්.',
      'ඔබේ ආරක්ෂාව නිතිපතා වෙනස් කරන්න: තෙතමනය සහ අප්‍රිය ගඳ වළක්වා ගැනීමට පැය 4 සිට 6 දක්වා වරක්.',
      'කපු තෝරන්න: කපු යට ඇඳුම් ඔබේ සමට හුස්ම ගැනීමට ඉඩ දී කෝපනයේ අවදානම අඩු කරයි.',
    ],
    thingsToAvoid: [
      'දැඩි සබන් සහ සුවඳ ද්‍රව්‍ය',
      'ඔබේ ස්වාභාවික ක්ෂුද්‍ර ජීවී ශාක කඩාකප්පල් කරන යෝනි සේදීම්',
      'තෙත් පෑඩ් එකක් හෝ ටැම්පන් එකක් වැඩි වේලාවක් තබාගැනීම',
    ],
    consultReasons: [
      'දිගටම පවතින කෝපනය, කසන සුළු බව, හෝ දැවිල්ල',
      'ඔබට සාමාන්‍ය දේට වඩා වෙනස් අසාමාන්‍ය ගඳක් හෝ ස්‍රාවයක්',
      'ඔබව කනස්සල්ලට පත් කරන සැලකිය යුතු වේදනාව හෝ රෝග ලක්ෂණ',
    ],
    tipTitle: 'AWA ඉඟිය',
    tipText: 'ඔබේ ශරීරයට දැනටමත් ස්වාභාවික සමතුලිත යාන්ත්‍රණයක් ඇත. මෘදු සේදීමක් සාමාන්‍යයෙන් ප්‍රමාණවත්.',
    takeawaysTitle: 'ප්‍රධාන කරුණු',
    takeaways: [
      'පැහැදිලි ජලයෙන් මෘදු සේදීම',
      'නිතිපතා වෙනස් කරන්න',
      'සුවඳ ද්‍රව්‍ය වළක්වන්න',
      'කපු තෝරන්න',
    ],
    relatedTitle: '♥  ඔබට මෙයද වුවමනා විය හැක',
    related: [
      {title: 'ඔසප් වේදනාව තේරුම් ගැනීම', meta: 'මිනි. 7  ·  මාර්ගෝපදේශය'},
      {title: 'ඔබේ ශරීරයට නිවැරදි ආරක්ෂාව තෝරා ගැනීම', meta: 'මිනි. 5  ·  මාර්ගෝපදේශය'},
      {title: 'මාංශ පේශි සංකෝචන ස්වාභාවිකව සමනය කරන්නේ කෙසේද', meta: 'මිනි. 6  ·  මාර්ගෝපදේශය'},
    ],
    shareTitle: 'සමීප සනීපාරක්ෂාව · AWA',
    shareMessage: 'ඔබේ ඔසප් කාලයේ ඔබේ සමීප සනීපාරක්ෂාව ගැන සැලකිලිමත් වීම · AWA',
  },
  th: {
    badge: 'ปริมาณประจำเดือน',
    title: 'ดูแลสุขอนามัยในจุดซ่อนเร้น\nระหว่างมีประจำเดือน',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'การดูแลสุขอนามัยในจุดซ่อนเร้นคือการเคารพร่างกายและสมดุลตามธรรมชาติของมัน',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ทำไมจึงสำคัญ',
      'นิสัยที่ดี',
      'สิ่งที่ควรหลีกเลี่ยง',
      'เมื่อไรควรพบแพทย์',
      'เคล็ดลับเชิงปฏิบัติ',
    ],
    body: 'ระหว่างมีประจำเดือน ร่างกายของคุณเปลี่ยนไปและอ่อนไหวมากขึ้น การมีนิสัยที่ดีช่วยป้องกันการระคายเคืองและการติดเชื้อ และช่วยให้คุณสบายตัวในแต่ละวัน',
    goodPractices: [
      'ล้างอย่างอ่อนโยน: เพียงล้างด้วยน้ำสะอาดจากหน้าไปหลังก็เพียงพอที่จะปกป้องจุลินทรีย์ตามธรรมชาติของคุณ',
      'เปลี่ยนอุปกรณ์เป็นประจำ: ทุก 4 ถึง 6 ชั่วโมงเพื่อหลีกเลี่ยงความชื้นและกลิ่นไม่พึงประสงค์',
      'เลือกผ้าฝ้าย: กางเกงในผ้าฝ้ายให้ผิวหายใจได้และลดความเสี่ยงของการระคายเคือง',
    ],
    thingsToAvoid: [
      'สบู่แรง ๆ และผลิตภัณฑ์ที่มีกลิ่นหอม',
      'การสวนล้างช่องคลอด ซึ่งรบกวนจุลินทรีย์ตามธรรมชาติของคุณ',
      'การใส่ผ้าอนามัยแบบแผ่นหรือแบบสอดที่ชื้นไว้นานเกินไป',
    ],
    consultReasons: [
      'การระคายเคือง คัน หรือแสบร้อนที่คงอยู่',
      'กลิ่นหรือตกขาวผิดปกติที่ต่างจากที่เป็นปกติสำหรับคุณ',
      'อาการปวดรุนแรงหรืออาการที่ทำให้คุณกังวล',
    ],
    tipTitle: 'เคล็ดลับจาก AWA',
    tipText: 'ร่างกายของคุณมีกลไกปรับสมดุลตามธรรมชาติอยู่แล้ว การล้างอย่างอ่อนโยนมักเพียงพอ',
    takeawaysTitle: 'ประเด็นสำคัญ',
    takeaways: [
      'ล้างอย่างอ่อนโยนด้วยน้ำสะอาด',
      'เปลี่ยนเป็นประจำ',
      'หลีกเลี่ยงผลิตภัณฑ์ที่มีกลิ่นหอม',
      'เลือกผ้าฝ้าย',
    ],
    relatedTitle: '♥  คุณอาจสนใจ',
    related: [
      {title: 'ทำความเข้าใจอาการปวดประจำเดือน', meta: '7 นาที  ·  คู่มือ'},
      {title: 'เลือกอุปกรณ์ที่เหมาะกับร่างกายของคุณ', meta: '5 นาที  ·  คู่มือ'},
      {title: 'วิธีบรรเทาอาการปวดเกร็งตามธรรมชาติ', meta: '6 นาที  ·  คู่มือ'},
    ],
    shareTitle: 'สุขอนามัยในจุดซ่อนเร้น · AWA',
    shareMessage: 'ดูแลสุขอนามัยในจุดซ่อนเร้นระหว่างมีประจำเดือน · AWA',
  },
  vi: {
    badge: 'LƯỢNG KINH NGUYỆT',
    title: 'Chăm sóc vệ sinh vùng kín\ntrong kỳ kinh',
    metaDuration: '6 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Chăm sóc vệ sinh vùng kín nghĩa là tôn trọng cơ thể bạn và sự cân bằng tự nhiên của nó.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Tại sao điều này quan trọng',
      'Thói quen tốt',
      'Những điều cần tránh',
      'Khi nào nên đi khám bác sĩ',
      'Mẹo thực tế',
    ],
    body: 'Trong kỳ kinh, cơ thể bạn thay đổi và trở nên nhạy cảm hơn. Áp dụng những thói quen đúng giúp ngăn ngừa kích ứng và nhiễm trùng, đồng thời giúp bạn thoải mái mỗi ngày.',
    goodPractices: [
      'Rửa nhẹ nhàng: chỉ cần rửa bằng nước sạch, từ trước ra sau, là đủ để bảo vệ hệ vi sinh tự nhiên của bạn.',
      'Thay sản phẩm vệ sinh đều đặn: mỗi 4 đến 6 giờ để tránh ẩm ướt và mùi khó chịu.',
      'Chọn chất liệu cotton: quần lót cotton giúp da thông thoáng và giảm nguy cơ kích ứng.',
    ],
    thingsToAvoid: [
      'Xà phòng mạnh và các sản phẩm có mùi thơm',
      'Thụt rửa âm đạo, làm rối loạn hệ vi sinh tự nhiên của bạn',
      'Giữ băng vệ sinh hoặc tampon ẩm quá lâu',
    ],
    consultReasons: [
      'Kích ứng, ngứa hoặc rát kéo dài',
      'Mùi hoặc khí hư bất thường khác với những gì bình thường với bạn',
      'Đau đáng kể hoặc các triệu chứng khiến bạn lo lắng',
    ],
    tipTitle: 'Mẹo từ AWA',
    tipText: 'Cơ thể bạn đã có cơ chế cân bằng tự nhiên. Rửa nhẹ nhàng thường là đủ.',
    takeawaysTitle: 'Những điểm chính cần nhớ',
    takeaways: [
      'Rửa nhẹ nhàng bằng nước sạch',
      'Thay đều đặn',
      'Tránh các sản phẩm có mùi thơm',
      'Chọn cotton',
    ],
    relatedTitle: '♥  Có thể bạn cũng thích',
    related: [
      {title: 'Hiểu về đau bụng kinh', meta: '7 phút  ·  Hướng dẫn'},
      {title: 'Chọn sản phẩm vệ sinh phù hợp với cơ thể bạn', meta: '5 phút  ·  Hướng dẫn'},
      {title: 'Cách làm dịu đau bụng kinh một cách tự nhiên', meta: '6 phút  ·  Hướng dẫn'},
    ],
    shareTitle: 'Vệ sinh vùng kín · AWA',
    shareMessage: 'Chăm sóc vệ sinh vùng kín trong kỳ kinh · AWA',
  },
  uz: {
    badge: 'HAYZ OQIMI',
    title: 'Hayz paytida intim gigiyenaga\ngʻamxoʻrlik qilish',
    metaDuration: '6 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Intim gigiyenaga gʻamxoʻrlik qilish — tanangizni va uning tabiiy muvozanatini hurmat qilish demak.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Nima uchun bu muhim',
      'Yaxshi odatlar',
      'Nimalardan saqlanish kerak',
      'Qachon shifokorga borish kerak',
      'Amaliy maslahatlar',
    ],
    body: 'Hayz paytida tanangiz oʻzgaradi va sezgirroq boʻladi. Toʻgʻri odatlar tirnash va infeksiyaning oldini olishga hamda kundalik hayotda oʻzingizni qulay his qilishga yordam beradi.',
    goodPractices: [
      'Muloyim yuving: tabiiy florangizni himoya qilish uchun oldindan orqaga qarab toza suv bilan oddiy chayish yetarli.',
      'Himoya vositasini muntazam almashtiring: namlik va yoqimsiz hidlardan qochish uchun har 4 soatdan 6 soatgacha.',
      'Paxtani tanlang: paxtali ichki kiyim terining nafas olishiga imkon beradi va tirnash xavfini kamaytiradi.',
    ],
    thingsToAvoid: [
      'Qattiq sovunlar va xushboʻy vositalar',
      'Tabiiy florangizni buzadigan qin yuvish (dush) vositalari',
      'Nam prokladka yoki tamponni haddan tashqari uzoq saqlash',
    ],
    consultReasons: [
      'Doimiy tirnash, qichishish yoki achishish',
      'Siz uchun odatiy boʻlganidan farq qiladigan yoqimsiz hid yoki ajralma',
      'Sizni xavotirga soladigan kuchli ogʻriq yoki alomatlar',
    ],
    tipTitle: 'AWA maslahati',
    tipText: 'Tanangizda allaqachon tabiiy muvozanatlash mexanizmi bor. Muloyim yuvish odatda yetarli.',
    takeawaysTitle: 'Asosiy xulosalar',
    takeaways: [
      'Toza suv bilan muloyim yuvish',
      'Muntazam almashtirish',
      'Xushboʻy vositalardan saqlanish',
      'Paxtani tanlash',
    ],
    relatedTitle: '♥  Sizga yoqishi mumkin',
    related: [
      {title: 'Hayz ogʻriqlarini tushunish', meta: '7 daq  ·  Qoʻllanma'},
      {title: 'Tanangizga mos himoya vositasini tanlash', meta: '5 daq  ·  Qoʻllanma'},
      {title: 'Qisqarishlarni tabiiy yoʻl bilan qanday yengillatish mumkin', meta: '6 daq  ·  Qoʻllanma'},
    ],
    shareTitle: 'Intim gigiyena · AWA',
    shareMessage: 'Hayz paytida intim gigiyenaga gʻamxoʻrlik qilish · AWA',
  },
  az: {
    badge: 'AYBAŞI AXINI',
    title: 'Aybaşı zamanı intim gigiyenanıza\nqulluq etmək',
    metaDuration: '6 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'İntim gigiyenaya qulluq etmək bədəninizə və onun təbii tarazlığına hörmət etmək deməkdir.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Bunun nə üçün əhəmiyyəti var',
      'Yaxşı vərdişlər',
      'Nələrdən qaçmaq lazımdır',
      'Nə vaxt həkimə müraciət etmək lazımdır',
      'Praktik məsləhətlər',
    ],
    body: 'Aybaşı zamanı bədəniniz dəyişir və daha həssas olur. Düzgün vərdişlər qıcıqlanmanın və infeksiyanın qarşısını almağa və gündəlik həyatda rahat qalmağa kömək edir.',
    goodPractices: [
      'Mülayim yuyunun: təbii florasını qorumaq üçün təmiz su ilə önündən arxaya doğru sadə yuyunma kifayətdir.',
      'Qoruyucu vasitəni müntəzəm dəyişin: rütubətin və xoşagəlməz qoxunun qarşısını almaq üçün hər 4–6 saatdan bir.',
      'Pambıq seçin: pambıq alt paltarı dərinin nəfəs almasına imkan verir və qıcıqlanma riskini azaldır.',
    ],
    thingsToAvoid: [
      'Sərt sabunlar və ətirli məhsullar',
      'Təbii florasını pozan vaginal duşlar',
      'Nəm gigiyenik bez və ya tamponu çox uzun müddət saxlamaq',
    ],
    consultReasons: [
      'Davamlı qıcıqlanma, qaşınma və ya göynəmə',
      'Sizin üçün normal olandan fərqli qeyri-adi qoxu və ya ifrazat',
      'Sizi narahat edən əhəmiyyətli ağrı və ya simptomlar',
    ],
    tipTitle: 'AWA məsləhəti',
    tipText: 'Bədəninizdə artıq təbii tarazlaşdırma mexanizmi var. Mülayim yuyunma adətən kifayətdir.',
    takeawaysTitle: 'Əsas nəticələr',
    takeaways: [
      'Təmiz su ilə mülayim yuyunma',
      'Müntəzəm dəyişmək',
      'Ətirli məhsullardan qaçmaq',
      'Pambıq seçmək',
    ],
    relatedTitle: '♥  Bunlar da xoşunuza gələ bilər',
    related: [
      {title: 'Aybaşı ağrısını anlamaq', meta: '7 dəq  ·  Bələdçi'},
      {title: 'Bədəniniz üçün düzgün qoruyucu vasitəni seçmək', meta: '5 dəq  ·  Bələdçi'},
      {title: 'Qıcolmaları təbii yolla necə yüngülləşdirmək olar', meta: '6 dəq  ·  Bələdçi'},
    ],
    shareTitle: 'İntim gigiyena · AWA',
    shareMessage: 'Aybaşı zamanı intim gigiyenanıza qulluq etmək · AWA',
  },
  ka: {
    badge: 'მენსტრუაციული ნაკადი',
    title: 'ინტიმური ჰიგიენა\nმენსტრუაციის დროს',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'ინტიმურ ჰიგიენაზე ზრუნვა ნიშნავს თქვენი სხეულისა და მისი ბუნებრივი ბალანსის პატივისცემას.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რატომ არის ეს მნიშვნელოვანი',
      'კარგი ჩვევები',
      'რისი თავიდან აცილებაა საჭირო',
      'როდის მივმართოთ ექიმს',
      'პრაქტიკული რჩევები',
    ],
    body: 'მენსტრუაციის დროს თქვენი სხეული იცვლება და უფრო მგრძნობიარე ხდება. სწორი ჩვევები გეხმარებათ გაღიზიანებისა და ინფექციის თავიდან აცილებაში და ყოველდღიურად კომფორტულად ყოფნაში.',
    goodPractices: [
      'ნაზად დაიბანეთ: წმინდა წყლით მარტივი გავლება, წინიდან უკან, საკმარისია თქვენი ბუნებრივი ფლორის დასაცავად.',
      'რეგულარულად შეცვალეთ დამცავი საშუალება: ყოველ 4-დან 6 საათში, რომ სინესტე და უსიამოვნო სუნი აიცილოთ.',
      'აირჩიეთ ბამბა: ბამბის საცვალი კანს სუნთქვის საშუალებას აძლევს და გაღიზიანების რისკს ამცირებს.',
    ],
    thingsToAvoid: [
      'მკაცრი საპნები და სურნელოვანი პროდუქტები',
      'ვაგინალური გამორეცხვა, რომელიც თქვენს ბუნებრივ ფლორას არღვევს',
      'სველი საფენის ან ტამპონის ზედმეტად დიდხანს ტარება',
    ],
    consultReasons: [
      'მუდმივი გაღიზიანება, ქავილი ან წვა',
      'უჩვეულო სუნი ან გამონადენი, რომელიც თქვენთვის ჩვეულისგან განსხვავდება',
      'მნიშვნელოვანი ტკივილი ან სიმპტომები, რომლებიც გაწუხებთ',
    ],
    tipTitle: 'AWA-ს რჩევა',
    tipText: 'თქვენს სხეულს უკვე აქვს ბუნებრივი დაბალანსების მექანიზმი. ნაზი დაბანა, როგორც წესი, საკმარისია.',
    takeawaysTitle: 'მთავარი დასკვნები',
    takeaways: [
      'ნაზი დაბანა წმინდა წყლით',
      'რეგულარულად შეცვლა',
      'სურნელოვანი პროდუქტების თავიდან აცილება',
      'ბამბის არჩევა',
    ],
    relatedTitle: '♥  შეიძლება მოგეწონოთ',
    related: [
      {title: 'მენსტრუაციული ტკივილის გაგება', meta: '7 წთ  ·  გზამკვლევი'},
      {title: 'თქვენი სხეულისთვის სწორი დამცავი საშუალების არჩევა', meta: '5 წთ  ·  გზამკვლევი'},
      {title: 'როგორ შევამსუბუქოთ სპაზმები ბუნებრივად', meta: '6 წთ  ·  გზამკვლევი'},
    ],
    shareTitle: 'ინტიმური ჰიგიენა · AWA',
    shareMessage: 'ინტიმური ჰიგიენა მენსტრუაციის დროს · AWA',
  },
  hy: {
    badge: 'ԴԱՇՏԱՆԱՅԻՆ ԱՐՏԱՀՈՍՔ',
    title: 'Հոգ տանել ինտիմ հիգիենային\nդաշտանի ընթացքում',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ինտիմ հիգիենայի մասին հոգ տանելը նշանակում է հարգել ձեր մարմինը և նրա բնական հավասարակշռությունը:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ինչու է դա կարևոր',
      'Լավ սովորություններ',
      'Ինչից խուսափել',
      'Երբ դիմել բժշկի',
      'Գործնական խորհուրդներ',
    ],
    body: 'Դաշտանի ընթացքում ձեր մարմինը փոխվում է և դառնում ավելի զգայուն: Ճիշտ սովորությունների որդեգրումը օգնում է կանխել գրգռումը և վարակը և մնալ հարմար օրեցօր:',
    goodPractices: [
      'Լվացվեք մեղմ. բավական է պարզ ողողումը մաքուր ջրով՝ առջևից հետ, որպեսզի պաշտպանեք ձեր բնական միկրոֆլորան:',
      'Պաշտպանության միջոցը փոխեք կանոնավոր. յուրաքանչյուր 4–6 ժամը մեկ՝ խոնավությունից և տհաճ հոտերից խուսափելու համար:',
      'Ընտրեք բամբակ. բամբակյա ներքնազգեստը թույլ է տալիս մաշկին շնչել և նվազեցնում է գրգռման վտանգը:',
    ],
    thingsToAvoid: [
      'Կոշտ օճառներ և բուրավետ միջոցներ',
      'Հեշտոցային ողողումներ, որոնք խաթարում են ձեր բնական միկրոֆլորան',
      'Խոնավ միջադիրը կամ տամպոնը չափազանց երկար պահելը',
    ],
    consultReasons: [
      'Շարունակական գրգռում, քոր կամ այրոց',
      'Անսովոր հոտ կամ արտազատուկ, որը տարբերվում է ձեզ համար նորմալից',
      'Զգալի ցավ կամ ախտանիշներ, որոնք անհանգստացնում են ձեզ',
    ],
    tipTitle: 'AWA-ի խորհուրդ',
    tipText: 'Ձեր մարմինը արդեն ունի բնական հավասարակշռման մեխանիզմ: Սովորաբար բավական է մեղմ լվացումը:',
    takeawaysTitle: 'Հիմնական եզրակացություններ',
    takeaways: [
      'Մեղմ լվացում մաքուր ջրով',
      'Կանոնավոր փոխել',
      'Խուսափել բուրավետ միջոցներից',
      'Ընտրել բամբակ',
    ],
    relatedTitle: '♥  Ձեզ կարող է նաև հետաքրքրել',
    related: [
      {title: 'Հասկանալ դաշտանային ցավը', meta: '7 ր  ·  Ուղեցույց'},
      {title: 'Ձեր մարմնին հարմար պաշտպանության ընտրություն', meta: '5 ր  ·  Ուղեցույց'},
      {title: 'Ինչպես բնական եղանակով թեթևացնել ջղաձգումները', meta: '6 ր  ·  Ուղեցույց'},
    ],
    shareTitle: 'Ինտիմ հիգիենա · AWA',
    shareMessage: 'Հոգ տանել ինտիմ հիգիենային դաշտանի ընթացքում · AWA',
  },
  tg: {
    badge: 'ҶАРАЁНИ ҲАЙЗ',
    title: 'Ғамхорӣ аз гигиенаи наздикии худ\nдар вақти ҳайз',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Ғамхорӣ аз гигиенаи наздикӣ эҳтиром ба бадан ва тавозуни табиии он аст.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Чаро муҳим аст',
      'Одатҳои нек',
      'Аз чӣ худдорӣ кардан лозим аст',
      'Кай ба табиб муроҷиат кард',
      'Маслиҳатҳои амалӣ',
    ],
    body: 'Дар вақти ҳайз бадани шумо тағйир меёбад ва ҳассостар мешавад. Қабули одатҳои дуруст аз асабоният ва сироят пешгирӣ мекунад ва ба шумо кумак мекунад дар ҳаёти ҳаррӯза роҳат бимонед.',
    goodPractices: [
      'Нарм шӯед: оби тозаи оддӣ, аз пеш ба қафо, барои ҳифзи флораи табиии шумо кифоя аст.',
      'Воситаи муҳофизатро мунтазам иваз кунед: ҳар 4 то 6 соат, то аз намӣ ва бӯи нохуш пешгирӣ шавад.',
      'Пахтаро интихоб кунед: либоси таги пахтагин ба пӯсти шумо имкон медиҳад нафас кашад ва хатари асабониятро кам мекунад.',
    ],
    thingsToAvoid: [
      'Собунҳои сахт ва маҳсулоти атрдор',
      'Шустани маҳбал (душ), ки флораи табиии шуморо вайрон мекунад',
      'Хеле дароз нигоҳ доштани пайванд ё тампони нам',
    ],
    consultReasons: [
      'Асабоният, хориш ё сӯзиши доимӣ',
      'Бӯй ё тарашшуҳи ғайриоддӣ, ки аз муқаррарии шумо фарқ мекунад',
      'Дард ё нишонаҳои назарраси шуморо нигаронкунанда',
    ],
    tipTitle: 'Маслиҳати AWA',
    tipText: 'Бадани шумо аллакай механизми табиии мувозинат дорад. Шустани нарм одатан кифоя аст.',
    takeawaysTitle: 'Хулосаҳои асосӣ',
    takeaways: [
      'Шустани нарм бо оби тоза',
      'Мунтазам иваз кардан',
      'Аз маҳсулоти атрдор худдорӣ кунед',
      'Пахтаро интихоб кунед',
    ],
    relatedTitle: '♥  Шояд ба шумо ҳам маъқул шавад',
    related: [
      {title: 'Фаҳмидани дарди ҳайз', meta: '7 дақ  ·  Роҳнамо'},
      {title: 'Интихоби воситаи муҳофизати мувофиқ ба бадани шумо', meta: '5 дақ  ·  Роҳнамо'},
      {title: 'Чӣ тавр кашишхӯриро ба таври табиӣ сабук кард', meta: '6 дақ  ·  Роҳнамо'},
    ],
    shareTitle: 'Гигиенаи наздикӣ · AWA',
    shareMessage: 'Ғамхорӣ аз гигиенаи наздикии худ дар вақти ҳайз · AWA',
  },
  ky: {
    badge: 'ЕТЕК КИРИМ АГЫМЫ',
    title: 'Етек кирим учурунда жакын\nгигиенага кам көрүү',
    metaDuration: '6 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Жакын гигиенага кам көрүү денеңизди жана анын табигый тең салмактуулугун сыйлоо дегенди билдирет.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Бул эмне үчүн маанилүү',
      'Жакшы адаттар',
      'Эмнеден сактануу керек',
      'Дарыгерге качан барыш керек',
      'Практикалык кеңештер',
    ],
    body: 'Етек кирим учурунда денеңиз өзгөрөт жана сезгичирээк болот. Туура адаттарды өздөштүрүү дүүлүгүүнүн жана инфекциянын алдын алууга жана күнүмдүк жашоодо ыңгайлуу болууга жардам берет.',
    goodPractices: [
      'Жумшак жуунуңуз: таза суу менен алдыдан артка карай жөнөкөй чайкоо табигый флораңызды коргоого жетиштүү.',
      'Коргонуу каражатын үзгүлтүксүз алмаштырыңыз: нымдуулуктан жана жагымсыз жыттан сактануу үчүн ар 4–6 саат сайын.',
      'Пахтаны тандаңыз: пахта ич кийим терининин дем алышына мүмкүндүк берет жана дүүлүгүү коркунучун азайтат.',
    ],
    thingsToAvoid: [
      'Катуу самындар жана жыттуу каражаттар',
      'Табигый флораңызды бузган кынапты жуу',
      'Нымдуу прокладканы же тампонду өтө узак кармап туруу',
    ],
    consultReasons: [
      'Улана берген дүүлүгүү, кычышуу же күйүү',
      'Сиз үчүн адаттагыдан айырмаланган адаттан тыш жыт же бөлүнүп чыгуу',
      'Тынчсыздандырган олуттуу оору же белгилер',
    ],
    tipTitle: 'AWA кеңеши',
    tipText: 'Денеңизде табигый тең салмактоо механизми буга чейин эле бар. Жумшак жуунуу көбүнчө жетиштүү.',
    takeawaysTitle: 'Негизги жыйынтыктар',
    takeaways: [
      'Таза суу менен жумшак жуунуу',
      'Үзгүлтүксүз алмаштыруу',
      'Жыттуу каражаттардан сактануу',
      'Пахтаны тандоо',
    ],
    relatedTitle: '♥  Сизге дагы жагышы мүмкүн',
    related: [
      {title: 'Етек кирим оорусун түшүнүү', meta: '7 мүн  ·  Колдонмо'},
      {title: 'Денеңизге туура коргонууну тандоо', meta: '5 мүн  ·  Колдонмо'},
      {title: 'Спазмдарды табигый жол менен кантип жеңилдетүү', meta: '6 мүн  ·  Колдонмо'},
    ],
    shareTitle: 'Жакын гигиена · AWA',
    shareMessage: 'Етек кирим учурунда жакын гигиенага кам көрүү · AWA',
  },
  tk: {
    badge: 'AÝBAŞY GAN AKMASY',
    title: 'Aýbaşy wagtynda ýakyn ýerleriň arassaçylygyna\nideg etmek',
    metaDuration: '6 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Ýakyn ýerleriň arassaçylygyna ideg etmek bedeniňize we onuň tebigy deňagramlylygyna hormat goýmagy aňladýar.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Bu näme üçin möhüm',
      'Gowy endikler',
      'Nämeden gaça durmaly',
      'Lukmana haçan ýüz tutmaly',
      'Amaly maslahatlar',
    ],
    body: 'Aýbaşy wagtynda bedeniňiz üýtgeýär we has duýgur bolýar. Dogry endikleri kabul etmek gyjyndyrmanyň we ýokançlygyň öňüni almaga hem-de gündelik durmuşda rahat galmaga kömek edýär.',
    goodPractices: [
      'Ýumşak ýuwuň: tebigy floraňyzy goramak üçin öňden yza tarap arassa suw bilen ýönekeý çaýkamak ýeterlik.',
      'Goranyş serişdesini yzygiderli çalşyň: çyglylygyň we ýakymsyz ysyň öňüni almak üçin her 4–6 sagatdan.',
      'Pagta saýlaň: pagta içki eşik derä dem almaga mümkinçilik berýär we gyjyndyrma howpuny azaldýar.',
    ],
    thingsToAvoid: [
      'Gaty sabynlar we ysly önümler',
      'Tebigy floraňyzy bozýan jynsy ýol ýuwulmalary',
      'Çyg prokladkany ýa-da tamponyny aşa uzak wagt saklamak',
    ],
    consultReasons: [
      'Dowamly gyjyndyrma, gyjyma ýa-da ýanma',
      'Siziň üçin adatydan tapawutly adaty däl ys ýa-da bölünip çykyş',
      'Sizi alada goýýan möhüm agyry ýa-da alamatlar',
    ],
    tipTitle: 'AWA maslahaty',
    tipText: 'Bedeniňizde eýýäm tebigy deňagramlaşdyryjy mehanizm bar. Ýumşak ýuwunmak adatça ýeterlik.',
    takeawaysTitle: 'Esasy netijeler',
    takeaways: [
      'Arassa suw bilen ýumşak ýuwunmak',
      'Yzygiderli çalşyp durmak',
      'Ysly önümlerden gaça durmak',
      'Pagta saýlamak',
    ],
    relatedTitle: '♥  Size ýarap biler',
    related: [
      {title: 'Aýbaşy agyrysyny düşünmek', meta: '7 min  ·  Gollanma'},
      {title: 'Bedeniňize laýyk goranyş serişdesini saýlamak', meta: '5 min  ·  Gollanma'},
      {title: 'Çekişmeleri tebigy ýagdaýda nähili ýeňilleşdirmeli', meta: '6 min  ·  Gollanma'},
    ],
    shareTitle: 'Ýakyn ýerleriň arassaçylygy · AWA',
    shareMessage: 'Aýbaşy wagtynda ýakyn ýerleriň arassaçylygyna ideg etmek · AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FlowMenstrualArticleScreen({
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.topics[0]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.goodPractices.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alertList}>
            {content.thingsToAvoid.map(item => (
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.consultReasons.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

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

          <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>{content.takeawaysTitle}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.takeaways.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>
        </View>

        <View style={styles.relatedHeader}>
          <AwaText variant="titleMedium" emphasized>{content.relatedTitle}</AwaText>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.relatedRow}>
          {RELATED_IMAGES.map((item, index) => (
            <AwaCard variant="filled" padding="none"
              key={item.articleId + index}
              onPress={() =>
                navigation.push('ArticleReader', {articleId: item.articleId})
              }
              style={styles.relatedCard}>
              <Image
                source={item.image}
                resizeMode="cover"
                style={styles.relatedImage}
              />

              <View style={styles.relatedCopy}>
                <AwaText variant="labelSmall" emphasized>
                  {content.related[index].title}
                </AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.relatedMeta}>
                  {content.related[index].meta}
                </AwaText>
              </View>
            </AwaCard>
          ))}
        </ScrollView>
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
    contentsTitle: {
      marginTop: 24,
      marginBottom: 8,
    },
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
    tip: {
      marginTop: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    tipCopy: {flex: 1, marginLeft: 12},
    tipText: {marginTop: 3},
    checkList: {
      marginTop: 12,
      padding: 12,
    },
    alertList: {
      marginTop: 12,
      padding: 12,
      backgroundColor: withAlpha(theme.colors.warning, 0.12),
    },
    checkRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 8,
    },
    checkText: {flex: 1},
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
