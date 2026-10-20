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
const CONTENT = {
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
} as const;

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
