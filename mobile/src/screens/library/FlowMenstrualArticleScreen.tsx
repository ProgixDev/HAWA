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
  'zh-Hant': {
      badge: '經量',
      title: '月經期間\n呵護私處清潔',
      metaDuration: '閱讀約 6 分鐘',
      metaType: '指南',
      metaLevel: '入門',
      metaValidated: '已稽核內容',
      intro: '呵護私處清潔，就是尊重你的身體及其自然的平衡。',
      contentsTitle: '本文內容',
      topics: [
        '為什麼重要',
        '好習慣',
        '需要避免的做法',
        '何時就醫',
        '實用小建議',
      ],
      body: '月經期間，你的身體會發生變化，也會變得更敏感。養成合適的習慣，有助於預防刺激和感染，讓你每天都更舒適。',
      goodPractices: [
        '溫和清洗：用清水由前向後簡單沖洗就足夠了，可以保護你的天然菌群。',
        '定期更換護理用品：每 4 到 6 小時更換一次，避免潮溼和異味。',
        '選擇棉質：棉質內褲讓皮膚保持透氣，並降低刺激的風險。',
      ],
      thingsToAvoid: [
        '刺激性強的肥皂和帶香味的產品',
        '陰道沖洗，會破壞你的天然菌群',
        '讓潮溼的衛生棉或衛生棉條留置過久',
      ],
      consultReasons: [
        '持續的刺激感、瘙癢或灼熱感',
        '異常的氣味或分泌物，與你平時的情況不同',
        '明顯的疼痛或讓你擔心的症狀',
      ],
      tipTitle: 'AWA 小提示',
      tipText: '你的身體本身就有自然的平衡機制。通常，溫和的清洗就足夠了。',
      takeawaysTitle: '要點回顧',
      takeaways: [
        '用清水溫和清洗',
        '定期更換',
        '避免帶香味的產品',
        '選擇棉質',
      ],
      relatedTitle: '♥  你可能還喜歡',
      related: [
        {
          title: '瞭解痛經',
          meta: '7 分鐘  ·  指南',
        },
        {
          title: '選擇適合你身體的護理用品',
          meta: '5 分鐘  ·  指南',
        },
        {
          title: '如何自然緩解痛經',
          meta: '6 分鐘  ·  指南',
        },
      ],
      shareTitle: '私處清潔 · AWA',
      shareMessage: '月經期間呵護私處清潔 · AWA',
    },
  ar: {
    badge: 'تدفّق الحيض',
    title: 'العناية بنظافتك الحميمة\nأثناء الحيض',
    metaDuration: 'قراءة 6 دقائق',
    metaType: 'دليل',
    metaLevel: 'مبتدئة',
    metaValidated: 'محتوى مراجَع',
    intro: 'العناية بنظافتك الحميمة تعني احترام جسمك وتوازنه الطبيعي.',
    contentsTitle: 'في هذا المقال',
    topics: [
      'لماذا هي مهمة',
      'عادات جيدة',
      'ما يجب تجنّبه',
      'متى تراجعين الطبيب',
      'نصائح عملية',
    ],
    body: 'أثناء الحيض يتغيّر جسمك ويصبح أكثر حساسية. واعتماد العادات الصحيحة يساعد على الوقاية من التهيّج والعدوى، ويبقيك مرتاحة يومًا بعد يوم.',
    goodPractices: [
      'اغسلي بلطف: يكفي شطف بسيط بالماء النقي، من الأمام إلى الخلف، لحماية فلورا جسمك الطبيعية.',
      'غيّري وسيلة الحماية بانتظام: كل 4 إلى 6 ساعات لتجنّب الرطوبة والروائح غير المستحبة.',
      'اختاري القطن: الملابس الداخلية القطنية تسمح لبشرتك بالتنفس وتقلّل خطر التهيّج.',
    ],
    thingsToAvoid: [
      'الصابون القاسي والمنتجات المعطّرة',
      'الدش المهبلي الذي يخلّ بفلورا جسمك الطبيعية',
      'إبقاء فوطة أو سدادة رطبة لفترة طويلة جدًا',
    ],
    consultReasons: [
      'تهيّج أو حكة أو حرقة مستمرة',
      'رائحة أو إفرازات غير معتادة تختلف عن المعتاد لديك',
      'ألم شديد أو أعراض تثير قلقك',
    ],
    tipTitle: 'نصيحة AWA',
    tipText: 'لدى جسمك أصلًا آلية طبيعية للتوازن. وعادةً يكفي غسل لطيف.',
    takeawaysTitle: 'أهم ما يجب تذكّره',
    takeaways: [
      'غسل لطيف بالماء النقي',
      'التغيير بانتظام',
      'تجنّبي المنتجات المعطّرة',
      'اختاري القطن',
    ],
    relatedTitle: '♥  قد يعجبك أيضًا',
    related: [
      {title: 'فهم ألم الحيض', meta: '7 دقائق  ·  دليل'},
      {title: 'اختيار وسيلة الحماية المناسبة لجسمك', meta: '5 دقائق  ·  دليل'},
      {title: 'كيف تخففين التقلصات بطرق طبيعية', meta: '6 دقائق  ·  دليل'},
    ],
    shareTitle: 'النظافة الحميمة · AWA',
    shareMessage: 'العناية بنظافتك الحميمة أثناء الحيض · AWA',
  },
  kab: {
    badge: 'AZRAY N LḤIḌ',
    title: 'Ɛass ɣef tezmert n wul-ik tuffirt\ndeg lḥiḍ',
    metaDuration: '6 n tesdidin n tɣuri',
    metaType: 'Amusnaw',
    metaLevel: 'Anagar',
    metaValidated: 'Agbur yettwaɛass',
    intro: 'Ɛass ɣef tefnit-ik tuffirt yebɣa-d ad tḥerzeḍ ugris-ik d umiḍan-is amagnu.',
    contentsTitle: 'Deg umagrad-a',
    topics: [
      'Acimi yesɛa azal',
      'Leɛwayed yelhan',
      'D acu ara tettuɣalen',
      'Melmi ara teẓreḍ ṭṭbib',
      'Tinufa tilawant',
    ],
    body: 'Deg lḥiḍ, ugris-ik yettbeddil u yettuɣal yettḥeṣṣ ugar. Leɛwayed yelhan ad k-ḥerzen seg uɣessal d usari, u ad k-ɛawnen ad tḥessseḍ tazmert yal ass.',
    goodPractices: [
      'Sizdeg s leḥnana: asizdeg s waman iwulmen kan, seg zdat ɣer deffir, yekfa i uḥerz n tfelwit-ik tamagnut.',
      'Senfel aḥfaḍ-ik s lḥal: yal 4 ɣer 6 n tsaɛtin akken ad tekkseḍ tɣessalt d tmeẓẓi.',
      'Fren tacemlalt: tikabbutin n tcemlalt ttaǧǧant ajelqim ad yettnefsu u ttnaqqsent ugar n wayen n usari.',
    ],
    thingsToAvoid: [
      'Tisabunin tisaɣalin d wayen yesɛan ccuc',
      'Asizdeg uffiɣ deg tfenfalt, yettbeddil tafelwit-ik tamagnut',
      'Aḥfaḍ neɣ tampon yeččuren d aḥmaḍ i yettunefken akud ɣezzifen aṭas',
    ],
    consultReasons: [
      'Asari, ccṛuṭ neɣ asemmiḍ yettṛajun',
      'Tagemmunt neɣ tuffɣa yemgaradet ɣef wayen amagnu fell-ak',
      'Aṭṭan ameqqran neɣ tizmilin ara k-yeččaren',
    ],
    tipTitle: 'Tanaṣiḥt n AWA',
    tipText: 'Ugris-ik ɣur-s yakan abrid amagnu n umiḍan. Asizdeg s leḥnana yekfa deg tuget n tallit.',
    takeawaysTitle: 'Ayen ilaqen ad tettɛassed',
    takeaways: [
      'Asizdeg s waman iwulmen',
      'Senfel s lḥal',
      'Ǧǧ tisabunin tisaɣalin',
      'Fren tacemlalt',
    ],
    relatedTitle: '♥  Ahat ad k-yehwu daɣen',
    related: [
      {title: 'Fehm aṭṭan n lḥiḍ', meta: '7 tesdidin  ·  Amusnaw'},
      {title: 'Afran n uḥfaḍ i yelhan i ugris-ik', meta: '5 tesdidin  ·  Amusnaw'},
      {title: 'Amek ara tessusmeḍ aṭṭan s tarrayin tinagnuyin', meta: '6 tesdidin  ·  Amusnaw'},
    ],
    shareTitle: 'Tafnit tuffirt · AWA',
    shareMessage: 'Ɛass ɣef tefnit-ik tuffirt deg lḥiḍ · AWA',
  },
  om: {
    badge: 'DHANGALA\'AA LAGUU',
    title: 'Yeroo laguu qulqullina\nqaama dhokataa kee eeggachuu',
    metaDuration: 'Daqiiqaa 6 dubbisuu',
    metaType: 'Qajeelfama',
    metaLevel: 'Jalqabaa',
    metaValidated: 'Qabiyyee sakatta\'amee',
    intro: 'Qulqullina qaama dhokataa kee eeggachuun qaama kee fi madaallii uumamaa isaa kabajuu dha.',
    contentsTitle: 'Barruu kana keessatti',
    topics: [
      'Maaliif barbaachisa',
      'Amala gaarii',
      'Wanta irraa fagaatamuu qabu',
      'Yoom doktora argachuu qabda',
      'Gorsa hojii irra oolu',
    ],
    body: 'Yeroo laguu, qaamni kee ni jijjiirama, caalaatti miira qabaata. Amala sirrii qabaachuun dhukkubbii gogaa fi dhukkuba nyaataa ittisa, guyyaa guyyaan mijataa ta\'uuf si gargaara.',
    goodPractices: [
      'Laaffisaan dhiqadhu: bishaan qulqulluu qofaan gara duraa irraa duubatti dhiqachuun uumama kee eegsisuuf ga\'a.',
      'Wanta ittisu kee yeroo yeroon jijjiiri: sa\'aatii 4 hanga 6 hundumaa, jiidhina fi foolii hin barbaadamne ittisuuf.',
      'Cottoona filadhu: uffata keessaa cottoonaa gogaan kee afuufa akka argatu godha, dhukkubbii gogaa ni hir\'isa.',
    ],
    thingsToAvoid: [
      'Saamunaa cimaa fi oomishaalee foolii qaban',
      'Qaama dhokataa bishaan dhangalaasuun dhiqachuu, kunis uumama kee ni balleessa',
      'Pad ykn tampoon jiidhe yeroo dheeraaf qabachuu',
    ],
    consultReasons: [
      'Dhukkubbii gogaa, nyaatuu, ykn gubachuu itti fufu',
      'Foolii ykn dhangala\'aa addaa kan sirraa idilee ta\'e irraa garaagara',
      'Dhukkubbii ykn mallattoowwan cimaa si yaaddessan',
    ],
    tipTitle: 'Gorsa AWA',
    tipText: 'Qaamni kee duraanuu mala madaallii uumamaa qaba. Dhiqannaan laaffisaa yeroo baay\'ee ga\'a.',
    takeawaysTitle: 'Qabxiilee ijoo',
    takeaways: [
      'Bishaan qulqulluu qofaan laaffisaan dhiqadhu',
      'Yeroo yeroon jijjiiri',
      'Oomishaalee foolii qaban irraa fagaadhu',
      'Cottoona filadhu',
    ],
    relatedTitle: '♥  Kunis si ni gammachiisa',
    related: [
      {title: 'Dhukkubbii laguu hubachuu', meta: 'Daqiiqaa 7  ·  Qajeelfama'},
      {title: 'Wanta ittisu qaama keetiif mijatu filachuu', meta: 'Daqiiqaa 5  ·  Qajeelfama'},
      {title: 'Ciniinsuu akkamitti uumamaan hir\'ista', meta: 'Daqiiqaa 6  ·  Qajeelfama'},
    ],
    shareTitle: 'Qulqullina qaama dhokataa · AWA',
    shareMessage: 'Yeroo laguu qulqullina qaama dhokataa kee eeggachuu · AWA',
  },
  ti: {
    badge: 'ፍሰት ወርሓዊ ደም',
    title: 'ኣብ እዋን ወርሓዊ ደም ውሽጣዊ\nንጽህናኺ ምሕላው',
    metaDuration: '6 ደቒቕ ንባብ',
    metaType: 'መምርሒ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'ዝተገምገመ ትሕዝቶ',
    intro: 'ውሽጣዊ ንጽህናኺ ምሕላው ማለት ንሰውነትኪን ተፈጥሮኣዊ ሚዛኑን ምኽባር ማለት እዩ።',
    contentsTitle: 'ኣብዚ ጽሑፍ',
    topics: [
      'ስለምንታይ ኣገዳሲ እዩ',
      'ጽቡቓት ልምድታት',
      'እንታይ ክሕደግ',
      'መዓስ ዶክተር ምርኣይ የድሊ',
      'ተግባራዊ ምኽርታት',
    ],
    body: 'ኣብ እዋን ወርሓዊ ደም ሰውነትኪ ይቕየርን ዝያዳ ትሰማዕን። ቅኑዕ ልምድታት ምጥቃም ጉዳእን ኢንፌክሽንን ከይመጽእ የድሕን፡ መዓልታዊ ምቾትኪ ድማ የረጋግጽ።',
    goodPractices: [
      'ቀስ ኢልኪ ሕጸቢ፡ ብጽሩይ ማይ ካብ ቅድሚት ናብ ድሕሪት ዝግበር ቀሊል ምሕጻብ ተፈጥሮኣዊ ፍሎራኺ ንምሕላው ይኣክል።',
      'ሓለዋኺ ብኣገባብ ቀይሪ፡ ካብ ሃለ 4 ክሳብ 6 ሰዓታት፡ ርጥበትን ዘይሕያው ሽታን ንምክልኻል።',
      'ጥጥ ምረጺ፡ ጥጥ ታሕተዋይ ክዳን ቆዳኺ ከተስተንፍስ ይፈቕድን ጉዳእ ይቐንስን።',
    ],
    thingsToAvoid: [
      'ብርቱዕ ሳሙናን ጨና ዘለዎም ምርትታትን',
      'ተፈጥሮኣዊ ፍሎራኺ ዘበላሽዉ ናይ ሴት ኣካል ምሕጻብ ብውሑስ ማይ',
      'ርጡብ ፓድ ወይ ታምፖን ንነዊሕ ግዜ ምጥቃም',
    ],
    consultReasons: [
      'ቀጻሊ ጉዳእ፡ ሕክክን ወይ ምቃጸል',
      'ካብ ንቡር ዝተፈለየ ዘይልሙድ ሽታ ወይ ፍሰት',
      'ዓቢ ቁርቁስ ወይ ዘሰክፉኺ ምልክታት',
    ],
    tipTitle: 'ምኽሪ AWA',
    tipText: 'ሰውነትኪ ተፈጥሮኣዊ መመጣጠኒ ኣሰራርሓ ኣለዋ። ቀሊል ምሕጻብ ብዙሓት ግዜ ይኣክል።',
    takeawaysTitle: 'ቀንዲ ነጥብታት',
    takeaways: [
      'ብጽሩይ ማይ ቀሊል ምሕጻብ',
      'ብኣገባብ ቀይሪ',
      'ጨና ዘለዎም ምርትታት ተወገዲ',
      'ጥጥ ምረጺ',
    ],
    relatedTitle: '♥  እዚ እውን ክትፈትዊ ትኽእሊ',
    related: [
      {title: 'ቁርቁስ ወርሓዊ ደም ምርዳእ', meta: '7 ደቒቕ  ·  መምርሒ'},
      {title: 'ንሰውነትኪ ቅኑዕ ሓለዋ ምምራጽ', meta: '5 ደቒቕ  ·  መምርሒ'},
      {title: 'ቁርጥማት ብተፈጥሮ ከመይ ትኸልክሊ', meta: '6 ደቒቕ  ·  መምርሒ'},
    ],
    shareTitle: 'ውሽጣዊ ንጽህና · AWA',
    shareMessage: 'ኣብ እዋን ወርሓዊ ደም ውሽጣዊ ንጽህናኺ ምሕላው · AWA',
  },
  rw: {
    badge: 'AMARASO Y\'IMIHANGO',
    title: 'Kwita ku isuku y\'ibice by\'ibanga\nmu gihe cy\'imihango',
    metaDuration: 'Gusoma: iminota 6',
    metaType: 'Ubuyobozi',
    metaLevel: 'Utangiye',
    metaValidated: 'Ibikubiyemo byasuzumwe',
    intro: 'Kwita ku isuku y\'ibice by\'ibanga ni ukubaha umubiri wawe n\'uburinganire bwawo karemano.',
    contentsTitle: 'Muri iyi nkuru',
    topics: [
      'Impamvu bifite akamaro',
      'Imigenzo myiza',
      'Ibyo kwirinda',
      'Igihe cyo kujya kureba muganga',
      'Inama zifatika',
    ],
    body: 'Mu gihe cy\'imihango, umubiri wawe uruhinduka kandi ukarushaho kwiyumva. Kugira imigenzo myiza bifasha kwirinda kurakara kw\'uruhu n\'indwara zandura, kandi bigufasha kumererwa neza buri munsi.',
    goodPractices: [
      'Oga buhoro: kwiyoza gusa amazi meza, uvuye imbere ujya inyuma, birahagije kurinda ibinyabuzima karemano byawe.',
      'Hindura ikikurinda buri gihe: buri masaha 4 kugeza kuri 6 kugira ngo wirinde ubuhehere n\'impumuro mbi.',
      'Hitamo ipamba: ikariso y\'ipamba ituma uruhu ruhumeka kandi igabanya ibyago byo kurakara.',
    ],
    thingsToAvoid: [
      'Amasabune akaze n\'ibintu bifite impumuro',
      'Gukaraba imbere mu gitsina n\'amazi atemba, bibangamira ibinyabuzima karemano byawe',
      'Kumara igihe kirekire wambaye pad cyangwa tampon itose',
    ],
    consultReasons: [
      'Kurakara, kwishima, cyangwa gutwika bidahita',
      'Impumuro cyangwa amatembabuzi bidasanzwe, atandukanye n\'ibisanzwe kuri wowe',
      'Ububabare bukomeye cyangwa ibimenyetso bigutera impungenge',
    ],
    tipTitle: 'Inama ya AWA',
    tipText: 'Umubiri wawe usanzwe ufite uburyo karemano bwo kuringaniza. Kwiyoza buhoro akenshi birahagije.',
    takeawaysTitle: 'Iby\'ingenzi byo kwibuka',
    takeaways: [
      'Oga buhoro n\'amazi meza',
      'Hindura buri gihe',
      'Irinde ibintu bifite impumuro',
      'Hitamo ipamba',
    ],
    relatedTitle: '♥  Ushobora no gukunda',
    related: [
      {title: 'Gusobanukirwa ububabare bw\'imihango', meta: 'iminota 7  ·  Ubuyobozi'},
      {title: 'Guhitamo ikikurinda gikwiranye n\'umubiri wawe', meta: 'iminota 5  ·  Ubuyobozi'},
      {title: 'Uko wavura ububabare bwo mu nda bw\'imihango mu buryo karemano', meta: 'iminota 6  ·  Ubuyobozi'},
    ],
    shareTitle: 'Isuku y\'ibice by\'ibanga · AWA',
    shareMessage: 'Kwita ku isuku y\'ibice by\'ibanga mu gihe cy\'imihango · AWA',
  },
  rn: {
    badge: 'AMARASO Y\'IMIHANGO',
    title: 'Kwita ku suku y\'ibice vyawe vy\'ibanga\nmu gihe c\'imihango',
    metaDuration: 'Iminota 6 yo gusoma',
    metaType: 'Ubuyobozi',
    metaLevel: 'Intangiriro',
    metaValidated: 'Ibisuzumwe',
    intro: 'Kwita ku suku y\'ibice vyawe vy\'ibanga ni ukubaha umubiri wawe n\'ukuringaniza kwawo kw\'ibanga.',
    contentsTitle: 'Muri iyi ngingo',
    topics: [
      'Igituma ari ngombwa',
      'Imigenzo myiza',
      'Ivyo kwirinda',
      'Igihe co kubona muganga',
      'Impanuro zifatika',
    ],
    body: 'Mu gihe c\'imihango, umubiri wawe urahinduka ukarushiriza kumva. Kugira imigenzo myiza bifasha kwirinda kurakara n\'indwara, no kuguma wumva umerewe neza buri musi.',
    goodPractices: [
      'Woza ugwa buhoro: kwoza gusa n\'amazi meza, uva imbere werekeza inyuma, birahagije kurinda ibinyabuzima vyawe vy\'ibanga.',
      'Hindura ikinga buri kanya: buri masaha 4 kugera kuri 6 kugira ngo wirinde ubuhehere n\'imyuka mibi.',
      'Hitamwo ikoton: karuvate z\'ikoton zireka uruhu rwawe rugahumeka kandi zigabanya ingorane yo kurakara.',
    ],
    thingsToAvoid: [
      'Isabune zikaze n\'ibicuruzwa binuka',
      'Kwoza imbere mu gitsina n\'amazi, bihungabanya ibinyabuzima vyawe vy\'ibanga',
      'Kugumana pad canke tampon itose igihe kirekire cane',
    ],
    consultReasons: [
      'Kurakara, kwishima canke gutwika bidahera',
      'Umunuko canke amazi bidasanzwe bitandukanye n\'ivyo bisanzwe kuri wewe',
      'Ububabare bukomeye canke ibimenyetso bigutera ubwoba',
    ],
    tipTitle: 'Impanuro ya AWA',
    tipText: 'Umubiri wawe usanzwe ufise uburyo bw\'umuhango bwo kwiringaniza. Koza buhoro biraba bihagije kenshi.',
    takeawaysTitle: 'Ivyingenzi vyo kwibuka',
    takeaways: [
      'Koza buhoro n\'amazi meza',
      'Hindura buri kanya',
      'Irinde ibicuruzwa binuka',
      'Hitamwo ikoton',
    ],
    relatedTitle: '♥  Ushobora no gukunda',
    related: [
      {title: 'Gusobanukirwa ububabare bw\'imihango', meta: 'Iminota 7  ·  Ubuyobozi'},
      {title: 'Guhitamwo ikinga rikwiye umubiri wawe', meta: 'Iminota 5  ·  Ubuyobozi'},
      {title: 'Ni gute wokuraho ububabare bw\'inda mu buryo bw\'umuhango', meta: 'Iminota 6  ·  Ubuyobozi'},
    ],
    shareTitle: 'Isuku y\'ibice vy\'ibanga · AWA',
    shareMessage: 'Kwita ku suku y\'ibice vyawe vy\'ibanga mu gihe c\'imihango · AWA',
  },
  ig: {
    badge: 'ỌBARA NSỌ',
    title: 'Ichebe ịdị ọcha ebe ndị nzuzo gị\nn\'oge nsọ',
    metaDuration: 'Nkeji 6 ọgụgụ',
    metaType: 'Nduzi',
    metaLevel: 'Onye mbido',
    metaValidated: 'Ọdịnaya a nyochara',
    intro: 'Ichebe ịdị ọcha ebe ndị nzuzo gị pụtara ito ahụ gị na nguzozi ya nke okike.',
    contentsTitle: 'N\'isiokwu a',
    topics: [
      'Ihe mere o ji dị mkpa',
      'Omume ọma',
      'Ihe a ga-ezere',
      'Mgbe kwesịrị ịhụ dọkịta',
      'Ndụmọdụ bara uru',
    ],
    body: 'N\'oge nsọ gị, ahụ gị na-agbanwe ma na-adị nro karị. Ịrụ omume ọma na-enyere aka igbochi ọkụ ahụ na ọrịa, ma na-enyere gị aka ịnọ n\'udo kwa ụbọchị.',
    goodPractices: [
      'Sa nke ọma nwayọọ: ịsa naanị na mmiri dị ọcha, site n\'ihu gaa n\'azụ, ezuola iji chebe ihe ndị dị ndụ nke okike gị.',
      'Gbanwee ihe nche gị mgbe niile: kwa awa 4 ruo 6 iji zere mmiri mmiri na ísì na-adịghị mma.',
      'Họrọ owu: akwa ime owu na-ahapụ akpụkpọ ahụ gị ume ma na-ebelata ihe ize ndụ nke ọkụ ahụ.',
    ],
    thingsToAvoid: [
      'Incha siri ike na ihe ísì ụtọ',
      'Ịsa n\'ime ọgọ nwanyị, nke na-akpaghasị ihe ndị dị ndụ nke okike gị',
      'Ịnọgide na-eji pad ma ọ bụ tampon mmiri mmiri ogologo oge',
    ],
    consultReasons: [
      'Ọkụ ahụ, ịkọ ma ọ bụ ịkọ ọkụ na-adịgide',
      'Ísì ma ọ bụ mmiri ọgọ na-adịghị ahụkebe nke dị iche n\'ihe bụ nkịtị n\'ebe ị nọ',
      'Mgbu dị ukwuu ma ọ bụ mgbaàmà na-echegbu gị',
    ],
    tipTitle: 'Ndụmọdụ AWA',
    tipText: 'Ahụ gị nwere usoro nguzozi nke okike. Ịsa nwayọọ na-ezukarị.',
    takeawaysTitle: 'Isi ihe ndị ị ga-eburu',
    takeaways: [
      'Ịsa nwayọọ na mmiri dị ọcha',
      'Gbanwee mgbe niile',
      'Zere ihe ísì ụtọ',
      'Họrọ owu',
    ],
    relatedTitle: '♥  Ị nwekwara ike ịmasị',
    related: [
      {title: 'Ịghọta mgbu nsọ', meta: 'Nkeji 7  ·  Nduzi'},
      {title: 'Ịhọrọ ihe nche kwesịrị ahụ gị', meta: 'Nkeji 5  ·  Nduzi'},
      {title: 'Etu esi ebelata mgbu afọ n\'ụzọ okike', meta: 'Nkeji 6  ·  Nduzi'},
    ],
    shareTitle: 'Ịdị ọcha ebe ndị nzuzo · AWA',
    shareMessage: 'Ichebe ịdị ọcha ebe ndị nzuzo gị n\'oge nsọ · AWA',
  },
  yo: {
    badge: 'ÌṢÀN NǸKAN OṢÙ',
    title: 'Ìtọ́jú ìmọ́tótó ara rẹ\nnígbà nǹkan oṣù',
    metaDuration: 'Ìṣẹ́jú 6 láti kà',
    metaType: 'Ìtọ́sọ́nà',
    metaLevel: 'Olùbẹ̀rẹ̀',
    metaValidated: 'Àkóónú tí a ti yẹ̀ wò',
    intro: 'Ṣíṣe ìtọ́jú ìmọ́tótó ara rẹ túmọ̀ sí bíbọ̀wọ̀ fún ara rẹ àti ìwọ̀ntúnwọ̀nsì àdánidá rẹ̀.',
    contentsTitle: 'Nínú àpilẹ̀kọ yìí',
    topics: [
      'Ìdí tí ó fi ṣe pàtàkì',
      'Àwọn àṣà rere',
      'Ohun tí ó yẹ kí o yẹra fún',
      'Ìgbà tí ó yẹ kí o lọ rí dókítà',
      'Àwọn ìmọ̀ràn gbígbéṣẹ́',
    ],
    body: 'Nígbà nǹkan oṣù rẹ, ara rẹ ń yípadà, ó sì ń túbọ̀ ní ìmọ̀lára. Gbígba àwọn àṣà tó tọ́ ń ṣèrànwọ́ láti dènà ìbínú ara àti àkóràn, ó sì ń ràn ọ́ lọ́wọ́ láti máa tura lójoojúmọ́.',
    goodPractices: [
      'Fọ̀ jẹ́jẹ́: fífi omi mímọ́ fọ̀ láti iwájú sí ẹ̀yìn ti tó láti dáàbò bo àwọn kòkòrò àrùn àdánidá tó ṣàǹfààní.',
      'Pààrọ̀ ìdáàbòbò rẹ déédé: ní wákàtí 4 sí 6 kọ̀ọ̀kan kí o lè yẹra fún ọ̀rinrin àti òórùn tí kò dùn.',
      'Yan òwú: ẹ̀wù abẹ́lẹ̀ òwú ń jẹ́ kí awọ ara rẹ mí, ó sì dín ewu ìbínú ara kù.',
    ],
    thingsToAvoid: [
      'Ọṣẹ líle àti àwọn ọjà olóòórùn dídùn',
      'Fífọ inú ọ̀nà obìnrin pẹ̀lú omi, èyí tí ó ń ba àwọn kòkòrò àrùn àdánidá rẹ jẹ́',
      'Fífi pad tàbí tampon tó ti rin sílẹ̀ fún ìgbà pípẹ́ jù',
    ],
    consultReasons: [
      'Ìbínú ara, ìyún tàbí ìgbóná tí kò lọ',
      'Òórùn tàbí omi tí kò wọ́pọ̀ tí ó yàtọ̀ sí ohun tí ó wọ́pọ̀ fún ọ',
      'Ìrora tó pọ̀ tàbí àwọn àmì tí ó ń kó ọ láyà sókè',
    ],
    tipTitle: 'Ìmọ̀ràn AWA',
    tipText: 'Ara rẹ ti ní ọ̀nà ìwọ̀ntúnwọ̀nsì àdánidá. Fífọ̀ jẹ́jẹ́ sábà máa ń tó.',
    takeawaysTitle: 'Àwọn kókó pàtàkì',
    takeaways: [
      'Fọ̀ jẹ́jẹ́ pẹ̀lú omi mímọ́',
      'Pààrọ̀ déédé',
      'Yẹra fún àwọn ọjà olóòórùn dídùn',
      'Yan òwú',
    ],
    relatedTitle: '♥  O lè fẹ́ràn èyí pẹ̀lú',
    related: [
      {title: 'Òye ìrora nǹkan oṣù', meta: 'Ìṣẹ́jú 7  ·  Ìtọ́sọ́nà'},
      {title: 'Yíyan ìdáàbòbò tó tọ́ fún ara rẹ', meta: 'Ìṣẹ́jú 5  ·  Ìtọ́sọ́nà'},
      {title: 'Bí a ṣe lè mú ìrora ikùn nǹkan oṣù fúyẹ́ lọ́nà àdánidá', meta: 'Ìṣẹ́jú 6  ·  Ìtọ́sọ́nà'},
    ],
    shareTitle: 'Ìmọ́tótó ara · AWA',
    shareMessage: 'Ìtọ́jú ìmọ́tótó ara rẹ nígbà nǹkan oṣù · AWA',
  },
  zu: {
    badge: 'UKUHAMBA KWEGAZI LESIKHATHI',
    title: 'Ukunakekela inhlanzeko yakho yezindawo zangasese\nngesikhathi sokuya esikhathini',
    metaDuration: 'Imizuzu emi-6 yokufunda',
    metaType: 'Umhlahlandlela',
    metaLevel: 'Ongaqalayo',
    metaValidated: 'Okuqukethwe okubuyekeziwe',
    intro: 'Ukunakekela inhlanzeko yezindawo zakho zangasese kusho ukuhlonipha umzimba wakho nokulingana kwawo kwemvelo.',
    contentsTitle: 'Kulesi sihloko',
    topics: [
      'Kungani kubalulekile',
      'Izijwayezi ezinhle',
      'Okufanele ukugweme',
      'Uma kufanele ubone udokotela',
      'Amathiphu asebenzayo',
    ],
    body: 'Ngesikhathi sokuya esikhathini, umzimba wakho uyashintsha futhi uzwela kakhulu. Ukuba nezijwayezi ezifanele kusiza ukuvimbela ukuhlukumeza nezifo ezithathelwanayo, futhi kukusiza ukuthi uzizwe ukhululekile usuku nosuku.',
    goodPractices: [
      'Geza kahle: ukukhukhula nje ngamanzi acwebile, kusukela phambili uye emuva, kwanele ukuvikela izinto zakho zemvelo.',
      'Shintsha uvikelo lwakho njalo: ngamahora angu-4 kuya ku-6 ukuzeugweme umswakama namaphunga angemnandi.',
      'Khetha ukotini: izingubo zangaphansi zikakotini zivumela isikhumba sakho ukuthi siphefumule futhi zehlisa ingozi yokuhlukumeza.',
    ],
    thingsToAvoid: [
      'Amasesheni aqinile nemikhiqizo enephunga elimnandi',
      'Ukuhlanza ngaphakathi ngamanzi, okuphazamisa izinto zakho zemvelo',
      'Ukushiya iphedi noma i-tampon enomswakama isikhathi eside kakhulu',
    ],
    consultReasons: [
      'Ukuhlukumeza, ukuqaqamba noma ukushisa okuqhubekayo',
      'Iphunga noma ukuphuma kwamanzi okungajwayelekile okuhlukile kokujwayelekile kuwe',
      'Ubuhlungu obukhulu noma izimpawu ezikukhathazayo',
    ],
    tipTitle: 'Ithiphu ye-AWA',
    tipText: 'Umzimba wakho usunendlela yawo yemvelo yokulingana. Ukugeza kahle kuvame ukwanela.',
    takeawaysTitle: 'Okubalulekile okufanele ukukhumbule',
    takeaways: [
      'Geza kahle ngamanzi acwebile',
      'Shintsha njalo',
      'Gweme imikhiqizo enephunga elimnandi',
      'Khetha ukotini',
    ],
    relatedTitle: '♥  Ungathanda nalokhu',
    related: [
      {title: 'Ukuqonda ubuhlungu besikhathi', meta: 'Imizuzu emi-7  ·  Umhlahlandlela'},
      {title: 'Ukukhetha uvikelo olufanele umzimba wakho', meta: 'Imizuzu emi-5  ·  Umhlahlandlela'},
      {title: 'Ungazehlisa kanjani izinkathazo ngokwemvelo', meta: 'Imizuzu emi-6  ·  Umhlahlandlela'},
    ],
    shareTitle: 'Inhlanzeko yezindawo zangasese · AWA',
    shareMessage: 'Ukunakekela inhlanzeko yakho yezindawo zangasese ngesikhathi sokuya esikhathini · AWA',
  },
  xh: {
    badge: 'UKOPHA KWEXESHA LENYANGA',
    title: 'Ukunyamekela ucoceko lwakho lwangasese\nexeshini lakho lenyanga',
    metaDuration: 'Imizuzu emi-6 yokufunda',
    metaType: 'Isikhokelo',
    metaLevel: 'Umqali',
    metaValidated: 'Umxholo ohlolwe',
    intro: 'Ukunyamekela ucoceko lwakho lwangasese kuthetha ukuwuhlonela umzimba wakho nokulingana kwawo kwemvelo.',
    contentsTitle: 'Kweli nqaku',
    topics: [
      'Isizathu sokuba kubaluleke',
      'Izinto ezilungileyo ekufanele ziqhelekile',
      'Into ekufanele uyiphephe',
      'Xa kufuneka ubone ugqirha',
      'Iingcebiso ezisebenzayo',
    ],
    body: 'Exeshini lakho lenyanga, umzimba wakho uyatshintsha kwaye uziva ngakumbi. Ukuqhela izinto ezilungileyo kunceda ukuthintela ukucaphukisa nosulelo, kwaye kukunceda uhlale ukhululekile imihla ngemihla.',
    goodPractices: [
      'Hlamba ngobumnene: ukuhlamba nje ngamanzi acacileyo, ukusuka phambili ukuya ngasemva, kwanele ukukhusela izicubu zakho zemvelo.',
      'Tshintsha into yokuzikhusela rhoqo: emva kweeyure ezi-4 ukuya kwezi-6 ukuphepha ukumanzi namavumba angathandekiyo.',
      'Khetha ikotoni: ingubo yangaphantsi yekotoni iyawuvumela umzimba wakho ukuba uphefumle kwaye inciphisa ingozi yokucaphukisa.',
    ],
    thingsToAvoid: [
      'Iziqholo ezinamandla nemveliso enevumba',
      'Ukuhlamba ngaphakathi esiniinzi, okuphazamisa izicubu zakho zemvelo',
      'Ukugcina ipadi okanye itamponi emanzi ixesha elide kakhulu',
    ],
    consultReasons: [
      'Ukucaphukisa, ukuhlaba, okanye ukutsha okuqhubekayo',
      'Ivumba okanye ukuphuma kwamanzi okungaqhelekanga okwahlukileyo koko kuqhelekileyo kuwe',
      'Intlungu enkulu okanye iimpawu ezikukhathazayo',
    ],
    tipTitle: 'Icebiso le-AWA',
    tipText: 'Umzimba wakho sele unendlela yawo yemvelo yokulingana. Ukuhlamba ngobumnene ngokuqhelekileyo kwanele.',
    takeawaysTitle: 'Amanqaku aphambili',
    takeaways: [
      'Hlamba ngobumnene ngamanzi acacileyo',
      'Tshintsha rhoqo',
      'Phepha imveliso enevumba',
      'Khetha ikotoni',
    ],
    relatedTitle: '♥  Unokuthanda nale',
    related: [
      {title: 'Ukuqonda intlungu yexesha lenyanga', meta: 'Imizuzu emi-7  ·  Isikhokelo'},
      {title: 'Ukukhetha into efanelekileyo yokuzikhusela emzimbeni wakho', meta: 'Imizuzu emi-5  ·  Isikhokelo'},
      {title: 'Ungazipholisa njani iintlungu zokuya exesheni ngendlela yemvelo', meta: 'Imizuzu emi-6  ·  Isikhokelo'},
    ],
    shareTitle: 'Ucoceko lwangasese · AWA',
    shareMessage: 'Ukunyamekela ucoceko lwakho lwangasese exeshini lakho lenyanga · AWA',
  },
  sn: {
    badge: 'ROPA REKUENDA KUMWEDZI',
    title: 'Kuchengeta hutsanana hwemuviri wako\npanguva yekuenda kumwedzi',
    metaDuration: 'Kuverenga kwemaminetsi 6',
    metaType: 'Gwaro',
    metaLevel: 'Anotanga',
    metaValidated: 'Zvakaongororwa',
    intro: 'Kuchengeta hutsanana hwemuviri wako kunoreva kuremekedza muviri wako nekuenzana kwawo kwechisikirwo.',
    contentsTitle: 'Muchinyorwa chino',
    topics: [
      'Nei zvichikosha',
      'Tsika dzakanaka',
      'Zvekudzivisa',
      'Nguva yekuona chiremba',
      'Mazano ekushandisa',
    ],
    body: 'Panguva yekuenda kumwedzi, muviri wako unoshanduka uye unonzwa zvakanyanya. Kutevera tsika dzakanaka kunobatsira kudzivirira kutsamwisa kwehuruva nehutachiona, uye kunokubatsira kunyaradzwa zuva nezuva.',
    goodPractices: [
      'Sukai zvinyoro: kungosuka nemvura yakachena, kubva kumberi kuenda shure, kwakakwana kudzivirira zvipenyu zvechisikirwo zvemuviri wako.',
      'Shandura chinodzivirira nguva dzose: maawa 4 kusvika ku 6 oga oga kuti udzivise kunyorova nehwema husina kunaka.',
      'Sarudza cotton: hembe dzemukati dzecotton dzinosiya ganda rako richifema uye dzinodzikisa njodzi yekutsamwa.',
    ],
    thingsToAvoid: [
      'Sipo dzakasimba nezvinhu zvinonhuhwirira',
      'Kusuka mukati muvhazhina, izvo zvinokanganisa zvipenyu zvechisikirwo zvemuviri wako',
      'Kuchengeta pad kana tampon yakanyorova kwenguva yakareba zvikuru',
    ],
    consultReasons: [
      'Kutsamwa, kuyaura, kana kupisa kunoramba kuripo',
      'Hwema husina kujairika kana mvura inobuda yakasiyana neyakajairika kwauri',
      'Kurwadziwa kukuru kana zviratidzo zvinokuvhundutsa',
    ],
    tipTitle: 'Zano reAWA',
    tipText: 'Muviri wako unevo nzira yechisikirwo yekuenzanisa. Kusuka zvinyoro kazhinji kunokwana.',
    takeawaysTitle: 'Zvakakosha kuyeuka',
    takeaways: [
      'Kusuka zvinyoro nemvura yakachena',
      'Shandura nguva dzose',
      'Dzivisa zvinhu zvinonhuhwirira',
      'Sarudza cotton',
    ],
    relatedTitle: '♥  Unogona kunakidzwawo nezvi',
    related: [
      {title: 'Kunzwisisa kurwadziwa kwekuenda kumwedzi', meta: 'maminetsi 7  ·  Gwaro'},
      {title: 'Kusarudza chinodzivirira chakakodzera muviri wako', meta: 'maminetsi 5  ·  Gwaro'},
      {title: 'Ungadzikisa sei cramps netsika dzechisikirwo', meta: 'maminetsi 6  ·  Gwaro'},
    ],
    shareTitle: 'Hutsanana hwemuviri · AWA',
    shareMessage: 'Kuchengeta hutsanana hwemuviri wako panguva yekuenda kumwedzi · AWA',
  },
  ln: {
    badge: 'MAKILA YA SANZA',
    title: 'Kobatela bopɛtɛ ya nzoto na yo ya ndenge\nna ntango ya sanza',
    metaDuration: 'Miniti 6 ya kotánga',
    metaType: 'Malako',
    metaLevel: 'Ya ebandeli',
    metaValidated: 'Makambo oyo etalelami',
    intro: 'Kobatela bopɛtɛ ya nzoto na yo ya ndenge ezali kopesa lokumu na nzoto na yo mpe na ndenge ezalaka na yango.',
    contentsTitle: 'Na lisolo oyo',
    topics: [
      'Mpo na nini ezali na ntina',
      'Momesano ya malamu',
      'Eloko ya koboya',
      'Ntango ya kokende epai ya monganga',
      'Malako ya mosala',
    ],
    body: 'Na ntango ya sanza, nzoto na yo ebongwanaka mpe ekomaka na mpasi mingi. Kozwa momesano ya malamu esalisi koboya mpasi ya poso mpe bokono ya mikrɔbɛ, mpe esalisi yo kozala na kimia mokolo na mokolo.',
    goodPractices: [
      'Sukola malembe: kosukola na mai pɛtɛ, uta liboso tii nsima, ezali ekoki mpo na kobatela bomoi malamu ya nzoto na yo.',
      'Bongola eloko ya kobatela mbala na mbala: na ngonga 4 tii 6 nyonso mpo na koboya mai mpe nsolo mabe.',
      'Pona koton: bilamba ya koton eyebisi poso na yo mopepe mpe ekitisi likama ya mpasi ya poso.',
    ],
    thingsToAvoid: [
      'Sabuni makasi mpe biloko ya nsolo malamu',
      'Kosukola na kati ya nzoto (douche), oyo ebebisaka bomoi malamu ya nzoto',
      'Kozala na pad to tampon ya mai mpo na ntango molai mpenza',
    ],
    consultReasons: [
      'Mpasi ya poso, kolia nzoto, to kozika oyo esilaka te',
      'Nsolo to mai ya ndenge ekeseni na oyo ezali ya ndenge na yo',
      'Mpasi monene to bilembo oyo ezali kotungisa yo',
    ],
    tipTitle: 'Malako ya AWA',
    tipText: 'Nzoto na yo ezali na ndenge na yango ya komibatela. Kosukola malembe ekoki mbala mingi.',
    takeawaysTitle: 'Makambo ya kokanisa',
    takeaways: [
      'Kosukola malembe na mai pɛtɛ',
      'Kobongola mbala na mbala',
      'Koboya biloko ya nsolo malamu',
      'Pona koton',
    ],
    relatedTitle: '♥  Okoki mpe kolinga',
    related: [
      {title: 'Kososola mpasi ya sanza', meta: 'Miniti 7  ·  Malako'},
      {title: 'Kopona eloko ya kobatela oyo ebongi na nzoto na yo', meta: 'Miniti 5  ·  Malako'},
      {title: 'Ndenge nini ya kokitisa mpasi ya libumu na ndenge ya bomoto', meta: 'Miniti 6  ·  Malako'},
    ],
    shareTitle: 'Bopɛtɛ ya nzoto ya ndenge · AWA',
    shareMessage: 'Kobatela bopɛtɛ ya nzoto na yo ya ndenge na ntango ya sanza · AWA',
  },
  ff: {
    badge: 'NDIYAM LEWRU',
    title: 'Hisnude laabal nder ɓanndu maaɗa\nnder lewru',
    metaDuration: 'Janngugol minti 6',
    metaType: 'Jannginoore',
    metaLevel: 'Fuɗɗoode',
    metaValidated: 'Ko ndaaraa',
    intro: 'Hisnude laabal nder ɓanndu maaɗa ɗum jaŋtugo ɓanndu maaɗa e no ɗum woni.',
    contentsTitle: 'Nder ɗuuɗal ndeen',
    topics: [
      'Ngam ɗume ɗum ɗon nafa',
      'Ndaaneeji moyyi',
      'Ko haani ittude',
      'Ndey ko haani yahde e dokotoro',
      'Ndaaneeji nafooji',
    ],
    body: 'Nder lewru, ɓanndu maaɗa ɗon wayla e ɗum ɓuri muusugo. Huutinaade ndaaneeji moyyi ɗum wallay ma ngam hoyrude e infection, e ɗum wallay ma wonde sella nyannde nyannde.',
    goodPractices: [
      'Looto seɗɗa: lootugo ndiyam laabɗam tan, ko jaŋtugo haa ɓaawo, ɗum ɗon waɗi ngam hisnugo ko ɓanndu maaɗa mari.',
      'Waylu hisnude maaɗa wakkati: kala nga\'u 4 haa 6 ngam hoyrude ɗam jaɓɓo e ɗam ɗum ɓuuɓa.',
      'Suɓu coton: kaddu coton ɗum yaha ɓanndu hodda, ɗum ɗon ɓuri hoyrude muusu.',
    ],
    thingsToAvoid: [
      'Sabon sattuɗo e ko ɗum ɗon ɓuuɓa',
      'Looto nder ɓanndu, ɗum ɗon bonna hisnude ɓanndu maaɗa',
      'Jooɗude e pad malla tampon ndiyam ɗum ɗon ɗuuɗi masin',
    ],
    consultReasons: [
      'Muusu, jaŋki, malla ɗum ɗon ɗaɓɓa ɗum ɗon mooɓti',
      'Ɓuuɓa malla ndiyam ɗum wonaa bana ko ɗum woni e maaɗa',
      'Muusu mawngu malla ɓaleeji ɗi ɗon hoyra ma',
    ],
    tipTitle: 'Wallitol AWA',
    tipText: 'Ɓanndu maaɗa mari feere hisnude ɗum. Looto seɗɗa ɗum ɗon wanna fu.',
    takeawaysTitle: 'Ko ɗum ɓuri fuu',
    takeaways: [
      'Looto seɗɗa e ndiyam laabɗam',
      'Waylu wakkati',
      'Ittu ko ɗum ɗon ɓuuɓa',
      'Suɓu coton',
    ],
    relatedTitle: '♥  Ɗum ko jooɗi kadi ɗum yiɗa',
    related: [
      {title: 'Faamugo muusu ndiyam lewru', meta: 'Minti 7  ·  Jannginoore'},
      {title: 'Suɓugo hisnude moyyere ngam ɓanndu maaɗa', meta: 'Minti 5  ·  Jannginoore'},
      {title: 'No ɗum yaha muusu lewru nder feere fuu', meta: 'Minti 6  ·  Jannginoore'},
    ],
    shareTitle: 'Laabal ɓanndu · AWA',
    shareMessage: 'Hisnude laabal nder ɓanndu maaɗa nder lewru · AWA',
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
  ms: {
    badge: 'ALIRAN HAID',
    title: 'Menjaga kebersihan intim anda\nsemasa haid',
    metaDuration: '6 min bacaan',
    metaType: 'Panduan',
    metaLevel: 'Permulaan',
    metaValidated: 'Kandungan disemak',
    intro: 'Menjaga kebersihan intim bermakna menghormati tubuh anda dan keseimbangan semula jadinya.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Mengapa ia penting',
      'Tabiat yang baik',
      'Apa yang perlu dielakkan',
      'Bila untuk berjumpa doktor',
      'Petua praktikal',
    ],
    body: 'Semasa haid, tubuh anda berubah dan menjadi lebih sensitif. Mengamalkan tabiat yang betul membantu mencegah kerengsaan dan jangkitan, dan membantu anda kekal selesa dari hari ke hari.',
    goodPractices: [
      'Basuh dengan lembut: bilasan ringkas dengan air bersih, dari depan ke belakang, sudah memadai untuk melindungi flora semula jadi anda.',
      'Tukar perlindungan anda secara tetap: setiap 4 hingga 6 jam untuk mengelakkan kelembapan dan bau yang tidak menyenangkan.',
      'Pilih kapas: seluar dalam kapas membolehkan kulit anda bernafas dan mengurangkan risiko kerengsaan.',
    ],
    thingsToAvoid: [
      'Sabun yang keras dan produk berwangi',
      'Pembersihan faraj (douche), yang mengganggu flora semula jadi anda',
      'Memakai tuala wanita atau tampon yang lembap terlalu lama',
    ],
    consultReasons: [
      'Kerengsaan, gatal atau rasa pedih yang berterusan',
      'Bau atau lelehan luar biasa yang berbeza daripada yang normal bagi anda',
      'Sakit yang ketara atau simptom yang membimbangkan anda',
    ],
    tipTitle: 'Petua AWA',
    tipText: 'Tubuh anda sudah mempunyai mekanisme pengimbang semula jadi. Basuhan yang lembut biasanya sudah memadai.',
    takeawaysTitle: 'Perkara penting untuk diingat',
    takeaways: [
      'Basuh dengan lembut menggunakan air bersih',
      'Tukar secara tetap',
      'Elakkan produk berwangi',
      'Pilih kapas',
    ],
    relatedTitle: '♥  Anda mungkin juga suka',
    related: [
      {title: 'Memahami sakit haid', meta: '7 min  ·  Panduan'},
      {title: 'Memilih perlindungan yang sesuai untuk tubuh anda', meta: '5 min  ·  Panduan'},
      {title: 'Cara melegakan kekejangan secara semula jadi', meta: '6 min  ·  Panduan'},
    ],
    shareTitle: 'Kebersihan intim · AWA',
    shareMessage: 'Menjaga kebersihan intim anda semasa haid · AWA',
  },
  so: {
    badge: 'SOCODKA CAADADA',
    title: 'Daryeelka nadaafadda gaarka ah\ninta caadadaadu jirto',
    metaDuration: '6 daq akhris',
    metaType: 'Hage',
    metaLevel: 'Bilow',
    metaValidated: 'Macluumaad la dib-u-eegay',
    intro: 'Daryeelka nadaafadda gaarka ah macnaheedu waa ixtiraamka jidhkaaga iyo dheelitirkiisa dabiiciga ah.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Sababta ay muhiim u tahay',
      'Caadooyin wanaagsan',
      'Waxa laga fogaado',
      'Goorta dhakhtar la arko',
      'Talooyin ficil ah',
    ],
    body: 'Inta caadadaadu jirto, jidhkaagu wuu isbeddelaa wuxuuna noqdaa mid aad u dareen badan. Qaadashada caadooyinka saxda ah waxay ka hortagtaa kicin iyo caabuq, waxayna kaa caawisaa inaad maalin kasta raaxo ahaato.',
    goodPractices: [
      'Si jilicsan u dhaq: biyo cad oo keliya oo xagga hore ilaa gadaal ah ayaa ku filan si loo ilaaliyo dhirta dabiiciga ah.',
      'Si joogto ah u beddel ilaalintaada: 4 ilaa 6 saacadood kasta si looga fogaado qoyaan iyo ur aan fiicnayn.',
      'Dooro suufka: dharka hoose ee suufka ahi wuxuu u oggolaadaa maqaarkaaga inuu neefsado wuxuuna yareeyaa khatarta kicinta.',
    ],
    thingsToAvoid: [
      'Saabuun adag iyo alaab udgoon leh',
      'Dhaqidda xiniinyaha gudaheeda (douches), taasoo ka hor timaada dhirta dabiiciga ah',
      'Haysashada tuwaal ama tampoon qoyan oo muddo dheer ah',
    ],
    consultReasons: [
      'Kicin, cuncun, ama gubasho sii socota',
      'Ur ama dheecaan aan caadi ahayn oo ka duwan waxa kuu caadi ah',
      'Xanuun weyn ama astaamo ku walaaciya',
    ],
    tipTitle: 'Talada AWA',
    tipText: 'Jidhkaagu horey ayuu u leeyahay hab dheelitir dabiici ah. Dhaqid jilicsan inta badan way ku filan tahay.',
    takeawaysTitle: 'Qodobbada muhiimka ah',
    takeaways: [
      'Dhaqid jilicsan biyo cad',
      'Si joogto ah u beddel',
      'Ka fogow alaabta udgoon',
      'Dooro suufka',
    ],
    relatedTitle: '♥  Waxaad sidoo kale jeclaan kartaa',
    related: [
      {title: 'Fahamka xanuunka caadada', meta: '7 daq  ·  Hage'},
      {title: 'Doorashada ilaalinta ku habboon jidhkaaga', meta: '5 daq  ·  Hage'},
      {title: 'Sida si dabiici ah loo yareeyo qallalka', meta: '6 daq  ·  Hage'},
    ],
    shareTitle: 'Nadaafadda gaarka ah · AWA',
    shareMessage: 'Daryeelka nadaafadda gaarka ah inta caadadaadu jirto · AWA',
  },
  sw: {
    badge: 'MTIRIRIKO WA HEDHI',
    title: 'Kutunza usafi wa sehemu zako za siri\nwakati wa hedhi',
    metaDuration: 'Dakika 6 za kusoma',
    metaType: 'Mwongozo',
    metaLevel: 'Mwanzo',
    metaValidated: 'Maudhui yaliyokaguliwa',
    intro: 'Kutunza usafi wa sehemu zako za siri kunamaanisha kuheshimu mwili wako na usawa wake wa asili.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Kwa nini ni muhimu',
      'Tabia nzuri',
      'Cha kuepuka',
      'Wakati wa kumwona daktari',
      'Vidokezo vya vitendo',
    ],
    body: 'Wakati wa hedhi yako, mwili wako hubadilika na kuwa nyeti zaidi. Kuwa na tabia sahihi kunasaidia kuzuia muwasho na maambukizi, na kukusaidia kubaki na faraja kila siku.',
    goodPractices: [
      'Osha kwa upole: kusukutua kwa maji safi, kutoka mbele kwenda nyuma, kunatosha kulinda bakteria wako wa asili.',
      'Badilisha kinga yako mara kwa mara: kila baada ya saa 4 hadi 6 ili kuepuka unyevu na harufu zisizopendeza.',
      'Chagua pamba: chupi za pamba huruhusu ngozi yako kupumua na kupunguza hatari ya muwasho.',
    ],
    thingsToAvoid: [
      'Sabuni kali na bidhaa zenye manukato',
      'Kuosha ndani ya uke kwa maji au dawa, jambo linalovuruga bakteria wako wa asili',
      'Kuweka pedi au tamponi iliyolowa kwa muda mrefu sana',
    ],
    consultReasons: [
      'Muwasho, kuwashwa, au hisia ya kuungua inayoendelea',
      'Harufu au ute usio wa kawaida tofauti na kilicho cha kawaida kwako',
      'Maumivu makubwa au dalili zinazokutia wasiwasi',
    ],
    tipTitle: 'Kidokezo cha AWA',
    tipText: 'Mwili wako tayari una utaratibu wa asili wa kusawazisha. Kuosha kwa upole kwa kawaida kunatosha.',
    takeawaysTitle: 'Mambo muhimu ya kukumbuka',
    takeaways: [
      'Kuosha kwa upole kwa maji safi',
      'Badilisha mara kwa mara',
      'Epuka bidhaa zenye manukato',
      'Chagua pamba',
    ],
    relatedTitle: '♥  Huenda pia ukapenda',
    related: [
      {title: 'Kuelewa maumivu ya hedhi', meta: 'Dakika 7  ·  Mwongozo'},
      {title: 'Kuchagua kinga inayofaa mwili wako', meta: 'Dakika 5  ·  Mwongozo'},
      {title: 'Jinsi ya kupunguza mikakamao kwa njia za asili', meta: 'Dakika 6  ·  Mwongozo'},
    ],
    shareTitle: 'Usafi wa sehemu za siri · AWA',
    shareMessage: 'Kutunza usafi wa sehemu zako za siri wakati wa hedhi · AWA',
  },
  kk: {
    badge: 'ЕТЕККІР КӨЛЕМІ',
    title: 'Етеккір кезінде жеке гигиенаңызға\nқамқор болу',
    metaDuration: '6 мин оқу',
    metaType: 'Нұсқаулық',
    metaLevel: 'Бастауыш',
    metaValidated: 'Тексерілген мазмұн',
    intro: 'Жеке гигиенаңызға қамқор болу денеңізді және оның табиғи тепе-теңдігін құрметтеуді білдіреді.',
    contentsTitle: 'Осы мақалада',
    topics: [
      'Бұл неге маңызды',
      'Жақсы әдеттер',
      'Нені болдырмау керек',
      'Дәрігерге қашан бару керек',
      'Практикалық кеңестер',
    ],
    body: 'Етеккір кезінде денеңіз өзгереді және сезімталырақ болады. Дұрыс әдеттер тітіркену мен инфекцияның алдын алуға және күнделікті жайлы болуға көмектеседі.',
    goodPractices: [
      'Жұмсақ жуыныңыз: табиғи флораңызды қорғау үшін алдыдан артқа қарай таза сумен шаю жеткілікті.',
      'Қорғаныс құралын тұрақты ауыстырыңыз: ылғал мен жағымсыз иістен аулақ болу үшін әр 4-тен 6 сағат сайын.',
      'Мақта таңдаңыз: мақта іш киім теріңіздің тыныс алуына мүмкіндік береді және тітіркену қаупін азайтады.',
    ],
    thingsToAvoid: [
      'Қатал сабындар мен хош иісті өнімдер',
      'Табиғи флораңызды бұзатын қынапты шаю (спринцевание)',
      'Ылғал прокладканы немесе тампонды тым ұзақ ұстау',
    ],
    consultReasons: [
      'Тұрақты тітіркену, қышу немесе жану',
      'Өзіңізге әдеттегіден өзгеше әдеттен тыс иіс немесе бөлінді',
      'Айтарлықтай ауыру немесе сізді алаңдататын белгілер',
    ],
    tipTitle: 'AWA кеңесі',
    tipText: 'Денеңізде тепе-теңдікті сақтайтын табиғи механизм бар. Жұмсақ жуыну әдетте жеткілікті.',
    takeawaysTitle: 'Негізгі қорытындылар',
    takeaways: [
      'Таза сумен жұмсақ жуыну',
      'Тұрақты ауыстыру',
      'Хош иісті өнімдерден аулақ болу',
      'Мақтаны таңдау',
    ],
    relatedTitle: '♥  Сізге де ұнауы мүмкін',
    related: [
      {title: 'Етеккір ауыруын түсіну', meta: '7 мин  ·  Нұсқаулық'},
      {title: 'Денеңізге сай қорғанысты таңдау', meta: '5 мин  ·  Нұсқаулық'},
      {title: 'Құрысуды табиғи жолмен қалай жеңілдетуге болады', meta: '6 мин  ·  Нұсқаулық'},
    ],
    shareTitle: 'Жеке гигиена · AWA',
    shareMessage: 'Етеккір кезінде жеке гигиенаңызға қамқор болу · AWA',
  },
  wo: {
    badge: 'DERET BU RÈGLE',
    title: 'Yër sa set bu nëbbu\nci jamonoy règle',
    metaDuration: '6 simili jàng',
    metaType: 'Ndigal',
    metaLevel: 'Tàmbali',
    metaValidated: 'Mbind bu ñu seetlu',
    intro: 'Yër sa set bu nëbbu mooy teg sa yaram ak jubluñam bu natural.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Lu tax mu am solo',
      'Yoon yu baax',
      'Li war a moytu',
      'Kañ ngay seet doktoor',
      'Ndigal yu jëfandikoo',
    ],
    body: 'Ci sa règle, sa yaram dafay soppiku te di gën a jàppale. Jëfandikoo yoon yu baax dafay tee tiis ak feebar te dimbli nga nekk ci neex bés bu nekk.',
    goodPractices: [
      'Sab ak lewet: benn sab bu yomb ak ndox bu set, jóge ci kanam dem ci ginnaaw, doy na ngir aar sa flor bu natural.',
      'Soppil sa aar ci yoon: ci 4 ba 6 waxtu ngir moytu soof ak xeeñ bu bon.',
      'Tànn koton: mbubb bu koton dafay may sa der noppiku te wàññi ndiggalu tiis.',
    ],
    thingsToAvoid: [
      'Sabon yu metti ak jumtukaay yu xeeñ',
      'Sab ci biir ndey, mu di ñaawal sa flor bu natural',
      'Bàyyi pad walla tampoŋ bu soof lu yàgg',
    ],
    consultReasons: [
      'Tiis, kàmbu walla tàngoor bu sax',
      'Xeeñ walla ndox bu cosaanul bu wuute ak li cosaan ngir yaw',
      'Metit bu am solo walla màndarga yu tiital la',
    ],
    tipTitle: 'Ndigalu AWA',
    tipText: 'Sa yaram am na ba noppi benn anam bu natural ngir jubloo. Benn sab bu lewet doy na saa su ne.',
    takeawaysTitle: 'Li am solo',
    takeaways: [
      'Sab bu lewet ak ndox bu set',
      'Soppi ci yoon',
      'Moytu jumtukaay yu xeeñ',
      'Tànn koton',
    ],
    relatedTitle: '♥  Mën nga bëgg itam',
    related: [
      {title: 'Xam metitu règle', meta: '7 simili  ·  Ndigal'},
      {title: 'Tànn aar bu méngoo ak sa yaram', meta: '5 simili  ·  Ndigal'},
      {title: 'Naka ñuy dalal metit ci natural', meta: '6 simili  ·  Ndigal'},
    ],
    shareTitle: 'Set bu nëbbu · AWA',
    shareMessage: 'Yër sa set bu nëbbu ci jamonoy règle · AWA',
  },
  ha: {
    badge: 'JININ HAILA',
    title: 'Kula da tsabtar al’aurarki\nlokacin haila',
    metaDuration: 'karatun minti 6',
    metaType: 'Jagora',
    metaLevel: 'Mafari',
    metaValidated: 'Abun da aka duba',
    intro: 'Kula da tsabtar al’aurarki yana nufin mutunta jikinki da daidaitonsa na halitta.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Dalilin da ya sa yake da muhimmanci',
      'Kyawawan dabi’u',
      'Abin da za a guje wa',
      'Lokacin ganin likita',
      'Shawarwari masu amfani',
    ],
    body: 'A lokacin hailarki, jikinki yana canzawa kuma yana ƙara hankali. Bin dabi’u masu kyau yana taimakawa wajen hana ƙaiƙayi da kamuwa da cuta, kuma yana taimaka miki ki ji daɗi kullum.',
    goodPractices: [
      'Wanke a hankali: wankewa mai sauƙi da ruwa mai tsabta, daga gaba zuwa baya, ya isa don kare halittar jikinki ta halitta.',
      'Canza kariyarki akai-akai: kowane sa’a 4 zuwa 6 don guje wa danshi da ƙamshi marasa daɗi.',
      'Zaɓi auduga: rigar ciki ta auduga tana ba fatarki damar numfashi kuma tana rage haɗarin ƙaiƙayi.',
    ],
    thingsToAvoid: [
      'Sabulai masu tsauri da kayayyaki masu ƙamshi',
      'Wankin cikin al’aura da ruwa, wanda ke dagula halittar jikinki ta halitta',
      'Barin audugar haila ko tampon mai danshi na tsawon lokaci',
    ],
    consultReasons: [
      'Ƙaiƙayi, ƙaiƙayin fata, ko zafi mai dawwama',
      'Ƙamshi ko ruwa ba na al’ada ba da ya bambanta da abin da ya saba a gare ki',
      'Ciwo mai yawa ko alamomin da ke damun ki',
    ],
    tipTitle: 'Shawarar AWA',
    tipText: 'Jikinki yana da hanyar daidaita kansa ta halitta. Wanka mai sauƙi galibi ya isa.',
    takeawaysTitle: 'Muhimman abubuwa',
    takeaways: [
      'Wanka mai sauƙi da ruwa mai tsabta',
      'Canza akai-akai',
      'Guje wa kayayyaki masu ƙamshi',
      'Zaɓi auduga',
    ],
    relatedTitle: '♥  Kila ma za ki so',
    related: [
      {title: 'Fahimtar ciwon haila', meta: 'minti 7  ·  Jagora'},
      {title: 'Zaɓar kariya mai dacewa da jikinki', meta: 'minti 5  ·  Jagora'},
      {title: 'Yadda za a rage murɗawar ciki ta halitta', meta: 'minti 6  ·  Jagora'},
    ],
    shareTitle: 'Tsabtar al’aura · AWA',
    shareMessage: 'Kula da tsabtar al’aurarki lokacin haila · AWA',
  },
  am: {
    badge: 'የወር አበባ ፍሰት',
    title: 'በወር አበባሽ ጊዜ የግል ንጽሕናሽን\nመንከባከብ',
    metaDuration: '6 ደቂቃ ንባብ',
    metaType: 'መመሪያ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'የተረጋገጠ ይዘት',
    intro: 'የግል ንጽሕናሽን መንከባከብ ሰውነትሽንና ተፈጥሯዊ ሚዛኑን ማክበር ማለት ነው።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'ለምን አስፈላጊ ነው',
      'ጥሩ ልማዶች',
      'ምን መወገድ አለበት',
      'ሐኪም መቼ ማየት',
      'ተግባራዊ ምክሮች',
    ],
    body: 'በወር አበባሽ ጊዜ ሰውነትሽ ይለወጣል እና ይበልጥ ስሜታዊ ይሆናል። ትክክለኛ ልማዶችን መከተል ብስጭትንና ኢንፌክሽንን ለመከላከል፣ እና በየቀኑ ምቾት እንዲሰማሽ ይረዳል።',
    goodPractices: [
      'በቀስታ ታጠቢ፦ ተፈጥሯዊ ባክቴሪያ ሚዛንሽን ለመጠበቅ በንጹሕ ውሃ ከፊት ወደ ኋላ ቀላል ማጠብ በቂ ነው።',
      'መከላከያሽን በየጊዜው ቀይሪ፦ እርጥበትንና ደስ የማይል ሽታን ለማስወገድ በየ4 እስከ 6 ሰዓት።',
      'ጥጥ ምረጪ፦ የጥጥ የውስጥ ልብስ ቆዳሽ እንዲተነፍስ ያስችለዋል እና የብስጭት አደጋን ይቀንሳል።',
    ],
    thingsToAvoid: [
      'ጠንካራ ሳሙናዎችና ሽታ ያላቸው ምርቶች',
      'ተፈጥሯዊ ባክቴሪያ ሚዛንሽን የሚያዛባ የማህፀን ውስጥ ማጠብ',
      'እርጥብ ሞዴስ ወይም ታምፖን ለረዥም ጊዜ መያዝ',
    ],
    consultReasons: [
      'የሚቀጥል ብስጭት፣ ማሳከክ ወይም ማቃጠል',
      'ለአንቺ ከተለመደው የተለየ ያልተለመደ ሽታ ወይም ፈሳሽ',
      'የሚያሳስብሽ ከፍተኛ ህመም ወይም ምልክቶች',
    ],
    tipTitle: 'የAWA ምክር',
    tipText: 'ሰውነትሽ ቀድሞውኑ ተፈጥሯዊ የማመጣጠን ዘዴ አለው። ቀላል ማጠብ ብዙውን ጊዜ በቂ ነው።',
    takeawaysTitle: 'ዋና ዋና ነጥቦች',
    takeaways: [
      'በንጹሕ ውሃ በቀስታ ማጠብ',
      'በየጊዜው መቀየር',
      'ሽታ ያላቸውን ምርቶች ማስወገድ',
      'ጥጥ መምረጥ',
    ],
    relatedTitle: '♥  ሊወዱትም ይችላሉ',
    related: [
      {title: 'የወር አበባ ህመምን መረዳት', meta: '7 ደቂቃ  ·  መመሪያ'},
      {title: 'ለሰውነትሽ ትክክለኛውን መከላከያ መምረጥ', meta: '5 ደቂቃ  ·  መመሪያ'},
      {title: 'የሆድ ቁርጠትን በተፈጥሮ እንዴት ማስታገስ', meta: '6 ደቂቃ  ·  መመሪያ'},
    ],
    shareTitle: 'የግል ንጽሕና · AWA',
    shareMessage: 'በወር አበባሽ ጊዜ የግል ንጽሕናሽን መንከባከብ · AWA',
  },
  nl: {
    badge: 'MENSTRUATIEBLOEDING',
    title: 'Zorg voor je intieme hygiëne\ntijdens je menstruatie',
    metaDuration: '6 min lezen',
    metaType: 'Gids',
    metaLevel: 'Beginner',
    metaValidated: 'Gecontroleerde inhoud',
    intro: 'Zorgen voor je intieme hygiëne betekent je lichaam en zijn natuurlijke evenwicht respecteren.',
    contentsTitle: 'In dit artikel',
    topics: [
      'Waarom het belangrijk is',
      'Goede gewoonten',
      'Wat je moet vermijden',
      'Wanneer je een arts moet zien',
      'Praktische tips',
    ],
    body: 'Tijdens je menstruatie verandert je lichaam en wordt het gevoeliger. Goede gewoonten aannemen helpt irritatie en infectie te voorkomen en helpt je je dagelijks comfortabel te voelen.',
    goodPractices: [
      'Was je zacht: een eenvoudige spoeling met helder water, van voor naar achter, is genoeg om je natuurlijke flora te beschermen.',
      'Verwissel je bescherming regelmatig: elke 4 tot 6 uur om vocht en onaangename geuren te voorkomen.',
      'Kies katoen: katoenen ondergoed laat je huid ademen en verkleint het risico op irritatie.',
    ],
    thingsToAvoid: [
      'Scherpe zepen en geparfumeerde producten',
      'Vaginale spoelingen, die je natuurlijke flora verstoren',
      'Een vochtig maandverband of tampon te lang laten zitten',
    ],
    consultReasons: [
      'Aanhoudende irritatie, jeuk of branderigheid',
      'Ongewone geur of afscheiding die anders is dan wat voor jou normaal is',
      'Aanzienlijke pijn of symptomen die je zorgen baren',
    ],
    tipTitle: 'AWA-tip',
    tipText: 'Je lichaam heeft al een natuurlijk evenwichtsmechanisme. Een zachte wasbeurt is meestal genoeg.',
    takeawaysTitle: 'Belangrijkste punten',
    takeaways: [
      'Zacht wassen met helder water',
      'Regelmatig verwisselen',
      'Geparfumeerde producten vermijden',
      'Katoen kiezen',
    ],
    relatedTitle: '♥  Misschien vind je dit ook leuk',
    related: [
      {title: 'Menstruatiepijn begrijpen', meta: '7 min  ·  Gids'},
      {title: 'De juiste bescherming voor je lichaam kiezen', meta: '5 min  ·  Gids'},
      {title: 'Hoe je krampen op natuurlijke wijze verlicht', meta: '6 min  ·  Gids'},
    ],
    shareTitle: 'Intieme hygiëne · AWA',
    shareMessage: 'Zorg voor je intieme hygiëne tijdens je menstruatie · AWA',
  },
  fi: {
    badge: 'KUUKAUTISVUOTO',
    title: 'Intiimihygieniasta huolehtiminen\nkuukautisten aikana',
    metaDuration: '6 min lukuaika',
    metaType: 'Opas',
    metaLevel: 'Aloittelija',
    metaValidated: 'Tarkistettu sisältö',
    intro: 'Intiimihygieniasta huolehtiminen tarkoittaa kehosi ja sen luonnollisen tasapainon kunnioittamista.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Miksi se on tärkeää',
      'Hyvät tavat',
      'Mitä välttää',
      'Milloin mennä lääkäriin',
      'Käytännön vinkit',
    ],
    body: 'Kuukautisten aikana kehosi muuttuu ja muuttuu herkemmäksi. Oikeiden tapojen omaksuminen auttaa ehkäisemään ärsytystä ja infektioita ja pysymään mukavana päivästä toiseen.',
    goodPractices: [
      'Pese lempeästi: pelkkä huuhtelu kirkkaalla vedellä edestä taakse riittää suojaamaan luonnollista kasvustoasi.',
      'Vaihda suojasi säännöllisesti: 4–6 tunnin välein kosteuden ja epämiellyttävien hajujen välttämiseksi.',
      'Valitse puuvilla: puuvillaiset alushousut antavat ihon hengittää ja vähentävät ärsytyksen riskiä.',
    ],
    thingsToAvoid: [
      'Voimakkaat saippuat ja hajustetut tuotteet',
      'Emätinhuuhtelut, jotka häiritsevät luonnollista kasvustoa',
      'Kostean siteen tai tamponin pitäminen liian kauan',
    ],
    consultReasons: [
      'Jatkuva ärsytys, kutina tai polte',
      'Epätavallinen haju tai erite, joka poikkeaa sinulle normaalista',
      'Voimakas kipu tai oireet, jotka huolestuttavat sinua',
    ],
    tipTitle: 'AWA:n vinkki',
    tipText: 'Kehollasi on jo luonnollinen tasapainottava mekanismi. Lempeä pesu riittää yleensä.',
    takeawaysTitle: 'Tärkeimmät asiat',
    takeaways: [
      'Lempeä pesu kirkkaalla vedellä',
      'Vaihda säännöllisesti',
      'Vältä hajustettuja tuotteita',
      'Valitse puuvilla',
    ],
    relatedTitle: '♥  Saatat pitää myös näistä',
    related: [
      {title: 'Kuukautiskivun ymmärtäminen', meta: '7 min  ·  Opas'},
      {title: 'Kehollesi sopivan suojan valinta', meta: '5 min  ·  Opas'},
      {title: 'Miten lievität kramppeja luonnollisesti', meta: '6 min  ·  Opas'},
    ],
    shareTitle: 'Intiimihygienia · AWA',
    shareMessage: 'Intiimihygieniasta huolehtiminen kuukautisten aikana · AWA',
  },
  el: {
    badge: 'ΕΜΜΗΝΟΡΡΟΪΚΗ ΡΟΗ',
    title: 'Φρόντισε την ευαίσθητη υγιεινή σου\nκατά την περίοδο',
    metaDuration: '6 λεπτά ανάγνωσης',
    metaType: 'Οδηγός',
    metaLevel: 'Αρχάριο',
    metaValidated: 'Ελεγμένο περιεχόμενο',
    intro: 'Το να φροντίζεις την ευαίσθητη υγιεινή σου σημαίνει να σέβεσαι το σώμα σου και τη φυσική του ισορροπία.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Γιατί έχει σημασία',
      'Καλές συνήθειες',
      'Τι να αποφεύγεις',
      'Πότε να επισκεφθείς γιατρό',
      'Πρακτικές συμβουλές',
    ],
    body: 'Κατά την περίοδό σου, το σώμα σου αλλάζει και γίνεται πιο ευαίσθητο. Η υιοθέτηση των σωστών συνηθειών βοηθά στην αποφυγή ερεθισμού και λοίμωξης και σε βοηθά να νιώθεις άνετα στην καθημερινότητα.',
    goodPractices: [
      'Πλύσου απαλά: μια απλή έκπλυση με καθαρό νερό, από μπροστά προς τα πίσω, αρκεί για να προστατεύσει τη φυσική σου χλωρίδα.',
      'Άλλαζε την προστασία σου τακτικά: κάθε 4 έως 6 ώρες για να αποφεύγεις την υγρασία και τις δυσάρεστες μυρωδιές.',
      'Επίλεξε βαμβάκι: τα βαμβακερά εσώρουχα αφήνουν το δέρμα να αναπνέει και μειώνουν τον κίνδυνο ερεθισμού.',
    ],
    thingsToAvoid: [
      'Σκληρά σαπούνια και αρωματισμένα προϊόντα',
      'Κολπικές πλύσεις, που διαταράσσουν τη φυσική σου χλωρίδα',
      'Να κρατάς πολύ ώρα μια υγρή σερβιέτα ή ένα ταμπόν',
    ],
    consultReasons: [
      'Επίμονος ερεθισμός, φαγούρα ή κάψιμο',
      'Ασυνήθιστη μυρωδιά ή έκκριση που διαφέρει από ό,τι είναι φυσιολογικό για σένα',
      'Σημαντικός πόνος ή συμπτώματα που σε ανησυχούν',
    ],
    tipTitle: 'Συμβουλή AWA',
    tipText: 'Το σώμα σου διαθέτει ήδη έναν φυσικό μηχανισμό ισορροπίας. Συνήθως αρκεί ένα απαλό πλύσιμο.',
    takeawaysTitle: 'Βασικά συμπεράσματα',
    takeaways: [
      'Απαλό πλύσιμο με καθαρό νερό',
      'Τακτική αλλαγή',
      'Απόφυγε τα αρωματισμένα προϊόντα',
      'Επίλεξε βαμβάκι',
    ],
    relatedTitle: '♥  Μπορεί επίσης να σου αρέσουν',
    related: [
      {title: 'Κατανοώντας τον εμμηνορροϊκό πόνο', meta: '7 λεπτά  ·  Οδηγός'},
      {title: 'Επιλέγοντας τη σωστή προστασία για το σώμα σου', meta: '5 λεπτά  ·  Οδηγός'},
      {title: 'Πώς να ανακουφίσεις φυσικά τις κράμπες', meta: '6 λεπτά  ·  Οδηγός'},
    ],
    shareTitle: 'Ευαίσθητη υγιεινή · AWA',
    shareMessage: 'Φρόντισε την ευαίσθητη υγιεινή σου κατά την περίοδο · AWA',
  },
  fil: {
    badge: 'DALOY NG REGLA',
    title: 'Pag-aalaga sa iyong intimate hygiene\nhabang may regla',
    metaDuration: '6 min na babasahin',
    metaType: 'Gabay',
    metaLevel: 'Baguhan',
    metaValidated: 'Sinuring nilalaman',
    intro: 'Ang pag-aalaga sa iyong intimate hygiene ay paggalang sa iyong katawan at sa natural nitong balanse.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Bakit mahalaga ito',
      'Mabubuting gawi',
      'Ano ang dapat iwasan',
      'Kailan magpatingin sa doktor',
      'Praktikal na payo',
    ],
    body: 'Habang may regla, nagbabago at nagiging mas sensitibo ang iyong katawan. Ang pagkakaroon ng tamang mga gawi ay tumutulong na maiwasan ang iritasyon at impeksyon, at nagpapanatili sa iyong komportable araw-araw.',
    goodPractices: [
      'Maghugas nang banayad: sapat na ang simpleng banlaw ng malinis na tubig, mula harap pabalik, para protektahan ang iyong natural na flora.',
      'Regular na magpalit ng proteksyon: tuwing 4 hanggang 6 na oras para maiwasan ang halumigmig at hindi kaaya-ayang amoy.',
      'Pumili ng cotton: ang panloob na cotton ay nagpapahintulot sa balat na huminga at nagpapababa ng panganib ng iritasyon.',
    ],
    thingsToAvoid: [
      'Matatapang na sabon at mga produktong may pabango',
      'Vaginal douche, na sumisira sa iyong natural na flora',
      'Pagpapanatili ng basang napkin o tampon nang masyadong matagal',
    ],
    consultReasons: [
      'Patuloy na iritasyon, pangangati, o pagkasunog',
      'Hindi pangkaraniwang amoy o pagtagas na iba sa nakasanayan mo',
      'Matinding sakit o mga sintomas na bumabagabag sa iyo',
    ],
    tipTitle: 'Payo ng AWA',
    tipText: 'May natural nang mekanismo ng pagbabalanse ang iyong katawan. Karaniwang sapat na ang banayad na paghuhugas.',
    takeawaysTitle: 'Mahahalagang tandaan',
    takeaways: [
      'Banayad na paghuhugas ng malinis na tubig',
      'Regular na magpalit',
      'Iwasan ang mga produktong may pabango',
      'Pumili ng cotton',
    ],
    relatedTitle: '♥  Maaaring magustuhan mo rin',
    related: [
      {title: 'Pag-unawa sa sakit ng regla', meta: '7 min  ·  Gabay'},
      {title: 'Pagpili ng tamang proteksyon para sa iyong katawan', meta: '5 min  ·  Gabay'},
      {title: 'Paano natural na maibsan ang pulikat', meta: '6 min  ·  Gabay'},
    ],
    shareTitle: 'Intimate hygiene · AWA',
    shareMessage: 'Pag-aalaga sa iyong intimate hygiene habang may regla · AWA',
  },
  ta: {
    badge: 'மாதவிடாய் ஓட்டம்',
    title: 'மாதவிடாயின்போது உங்கள் அந்தரங்கச்\nசுகாதாரத்தைக் கவனித்தல்',
    metaDuration: '6 நிமிடம் படிக்க',
    metaType: 'வழிகாட்டி',
    metaLevel: 'தொடக்க நிலை',
    metaValidated: 'சரிபார்க்கப்பட்ட உள்ளடக்கம்',
    intro: 'உங்கள் அந்தரங்கச் சுகாதாரத்தைக் கவனிப்பது என்பது உங்கள் உடலையும் அதன் இயற்கைச் சமநிலையையும் மதிப்பதாகும்.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      'இது ஏன் முக்கியம்',
      'நல்ல பழக்கங்கள்',
      'தவிர்க்க வேண்டியவை',
      'மருத்துவரை எப்போது பார்ப்பது',
      'நடைமுறைக் குறிப்புகள்',
    ],
    body: 'உங்கள் மாதவிடாயின்போது, உங்கள் உடல் மாறி அதிக உணர்திறன் பெறுகிறது. சரியான பழக்கங்களைக் கடைப்பிடிப்பது எரிச்சலையும் தொற்றையும் தடுக்க உதவுகிறது, அன்றாடம் நீங்கள் வசதியாக இருக்கவும் உதவுகிறது.',
    goodPractices: [
      'மென்மையாகக் கழுவுங்கள்: முன்னிலிருந்து பின்னாக, தெளிவான நீரில் ஒரு எளிய கழுவல் உங்கள் இயற்கை நுண்ணுயிர்த் தொகுதியைப் பாதுகாக்கப் போதும்.',
      'உங்கள் பாதுகாப்பைத் தொடர்ந்து மாற்றுங்கள்: ஈரத்தையும் விரும்பத்தகாத மணத்தையும் தவிர்க்க ஒவ்வொரு 4 முதல் 6 மணிநேரத்துக்கும்.',
      'பருத்தியைத் தேர்ந்தெடுங்கள்: பருத்தி உள்ளாடை உங்கள் தோல் சுவாசிக்க அனுமதிக்கிறது, எரிச்சல் அபாயத்தைக் குறைக்கிறது.',
    ],
    thingsToAvoid: [
      'கடுமையான சோப்புகளும் வாசனைப் பொருட்களும்',
      'உங்கள் இயற்கை நுண்ணுயிர்த் தொகுதியைக் குலைக்கும் யோனிக் கழுவல்கள்',
      'ஈரமான நாப்கினையோ டேம்பனையோ மிக நீண்ட நேரம் வைத்திருத்தல்',
    ],
    consultReasons: [
      'தொடர்ந்த எரிச்சல், அரிப்பு அல்லது எரிவு',
      'உங்களுக்கு இயல்பானதிலிருந்து வேறுபட்ட வழக்கத்துக்கு மாறான மணம் அல்லது வெளியேற்றம்',
      'உங்களைக் கவலைப்படுத்தும் குறிப்பிடத்தக்க வலி அல்லது அறிகுறிகள்',
    ],
    tipTitle: 'AWA குறிப்பு',
    tipText: 'உங்கள் உடலுக்கு ஏற்கனவே ஓர் இயற்கைச் சமநிலைப்படுத்தும் வழிமுறை உள்ளது. மென்மையான கழுவல் பொதுவாகப் போதும்.',
    takeawaysTitle: 'முக்கியக் குறிப்புகள்',
    takeaways: [
      'தெளிவான நீரில் மென்மையான கழுவல்',
      'தொடர்ந்து மாற்றுங்கள்',
      'வாசனைப் பொருட்களைத் தவிர்க்கவும்',
      'பருத்தியைத் தேர்ந்தெடுங்கள்',
    ],
    relatedTitle: '♥  உங்களுக்குப் பிடிக்கக்கூடியவை',
    related: [
      {title: 'மாதவிடாய் வலியைப் புரிந்துகொள்ளுதல்', meta: '7 நிமிடம்  ·  வழிகாட்டி'},
      {title: 'உங்கள் உடலுக்குச் சரியான பாதுகாப்பைத் தேர்ந்தெடுத்தல்', meta: '5 நிமிடம்  ·  வழிகாட்டி'},
      {title: 'வயிற்றுப் பிடிப்புகளை இயற்கையாக எப்படித் தணிப்பது', meta: '6 நிமிடம்  ·  வழிகாட்டி'},
    ],
    shareTitle: 'அந்தரங்கச் சுகாதாரம் · AWA',
    shareMessage: 'மாதவிடாயின்போது உங்கள் அந்தரங்கச் சுகாதாரத்தைக் கவனித்தல் · AWA',
  },
  te: {
    badge: 'నెలసరి రక్తస్రావం',
    title: 'నెలసరిలో మీ సన్నిహిత\nపరిశుభ్రతను చూసుకోవడం',
    metaDuration: '6 నిమిషాల పఠనం',
    metaType: 'గైడ్',
    metaLevel: 'ప్రారంభ స్థాయి',
    metaValidated: 'మదింపు చేసిన కంటెంట్',
    intro: 'మీ సన్నిహిత పరిశుభ్రతను చూసుకోవడం అంటే మీ శరీరాన్ని, దాని సహజ సమతుల్యతను గౌరవించడం.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      'ఇది ఎందుకు ముఖ్యం',
      'మంచి అలవాట్లు',
      'తప్పించుకోవాల్సినవి',
      'వైద్యుడిని ఎప్పుడు కలవాలి',
      'ఆచరణాత్మక చిట్కాలు',
    ],
    body: 'మీ నెలసరిలో, మీ శరీరం మారుతుంది, మరింత సున్నితంగా అవుతుంది. సరైన అలవాట్లను పాటించడం చికాకును, ఇన్ఫెక్షన్‌ను నివారించడానికి, రోజువారీగా సౌకర్యంగా ఉండటానికి సహాయపడుతుంది.',
    goodPractices: [
      'మృదువుగా కడుక్కోండి: మీ సహజ వృక్షజాలాన్ని కాపాడటానికి ముందు నుండి వెనక్కి, స్పష్టమైన నీటితో సరళంగా కడిగితే చాలు.',
      'మీ రక్షణను క్రమం తప్పకుండా మార్చండి: తేమ, అసహ్యకరమైన వాసనలను నివారించడానికి ప్రతి 4 నుండి 6 గంటలకు.',
      'కాటన్‌ను ఎంచుకోండి: కాటన్ లోదుస్తులు మీ చర్మాన్ని ఊపిరి తీసుకోనిస్తాయి, చికాకు ప్రమాదాన్ని తగ్గిస్తాయి.',
    ],
    thingsToAvoid: [
      'కఠినమైన సబ్బులు, సువాసన ఉత్పత్తులు',
      'యోని డౌచ్‌లు, ఇవి మీ సహజ వృక్షజాలాన్ని భంగపరుస్తాయి',
      'తడిసిన ప్యాడ్ లేదా టాంపోన్‌ను ఎక్కువసేపు ఉంచడం',
    ],
    consultReasons: [
      'కొనసాగే చికాకు, దురద లేదా మంట',
      'మీకు సాధారణమైనదానికి భిన్నమైన అసాధారణ వాసన లేదా స్రావం',
      'మిమ్మల్ని ఆందోళనపెట్టే గణనీయమైన నొప్పి లేదా లక్షణాలు',
    ],
    tipTitle: 'AWA చిట్కా',
    tipText: 'మీ శరీరానికి ఇప్పటికే ఒక సహజ సమతుల్య యంత్రాంగం ఉంది. సాధారణంగా మృదువుగా కడుక్కోవడం చాలు.',
    takeawaysTitle: 'ముఖ్యాంశాలు',
    takeaways: [
      'స్పష్టమైన నీటితో మృదువుగా కడుక్కోండి',
      'క్రమం తప్పకుండా మార్చండి',
      'సువాసన ఉత్పత్తులను తప్పించుకోండి',
      'కాటన్‌ను ఎంచుకోండి',
    ],
    relatedTitle: '♥  మీకు ఇవి కూడా నచ్చవచ్చు',
    related: [
      {title: 'నెలసరి నొప్పిని అర్థం చేసుకోవడం', meta: '7 ని  ·  గైడ్'},
      {title: 'మీ శరీరానికి సరైన రక్షణను ఎంచుకోవడం', meta: '5 ని  ·  గైడ్'},
      {title: 'పొత్తికడుపు నొప్పిని సహజంగా ఎలా తగ్గించుకోవాలి', meta: '6 ని  ·  గైడ్'},
    ],
    shareTitle: 'సన్నిహిత పరిశుభ్రత · AWA',
    shareMessage: 'నెలసరిలో మీ సన్నిహిత పరిశుభ్రతను చూసుకోవడం · AWA',
  },
  mr: {
    badge: 'मासिक पाळीचा स्राव',
    title: 'पाळीदरम्यान तुमच्या खाजगी भागाची\nस्वच्छता सांभाळणे',
    metaDuration: '6 मिनिटे वाचन',
    metaType: 'मार्गदर्शक',
    metaLevel: 'प्रारंभ स्तर',
    metaValidated: 'पुनरावलोकन केलेला मजकूर',
    intro: 'खाजगी भागाची स्वच्छता सांभाळणे म्हणजे तुमच्या शरीराचा आणि त्याच्या नैसर्गिक संतुलनाचा आदर करणे.',
    contentsTitle: 'या लेखात',
    topics: [
      'हे का महत्त्वाचे आहे',
      'चांगल्या सवयी',
      'काय टाळावे',
      'डॉक्टरांना केव्हा भेटावे',
      'व्यावहारिक टिपा',
    ],
    body: 'पाळीदरम्यान तुमचे शरीर बदलते आणि अधिक संवेदनशील होते. योग्य सवयी अंगीकारल्याने जळजळ आणि संसर्ग टळतात आणि रोज आरामात राहण्यास मदत होते.',
    goodPractices: [
      'हळुवारपणे धुवा: स्वच्छ पाण्याने पुढून मागे साधे धुणे तुमच्या नैसर्गिक जिवाणूसंस्थेचे रक्षण करण्यासाठी पुरेसे आहे.',
      'तुमचे संरक्षण नियमितपणे बदला: ओलावा आणि अप्रिय वास टाळण्यासाठी दर 4 ते 6 तासांनी.',
      'सुती कापड निवडा: सुती अंतर्वस्त्रामुळे तुमची त्वचा श्वास घेते आणि जळजळीचा धोका कमी होतो.',
    ],
    thingsToAvoid: [
      'तीव्र साबण आणि सुगंधी उत्पादने',
      'योनीची डूश, जी तुमची नैसर्गिक जिवाणूसंस्था बिघडवते',
      'ओला पॅड किंवा टॅम्पॉन खूप वेळ तसाच ठेवणे',
    ],
    consultReasons: [
      'कायम राहणारी जळजळ, खाज किंवा आग',
      'असामान्य वास किंवा तुमच्यासाठी नेहमीच्यापेक्षा वेगळा स्राव',
      'लक्षणीय वेदना किंवा तुम्हाला काळजीत टाकणारी लक्षणे',
    ],
    tipTitle: 'AWA ची टीप',
    tipText: 'तुमच्या शरीरात आधीच नैसर्गिक संतुलन राखणारी यंत्रणा आहे. हळुवार धुणे सहसा पुरेसे असते.',
    takeawaysTitle: 'मुख्य मुद्दे',
    takeaways: [
      'स्वच्छ पाण्याने हळुवार धुणे',
      'नियमितपणे बदलणे',
      'सुगंधी उत्पादने टाळा',
      'सुती कापड निवडा',
    ],
    relatedTitle: '♥  तुम्हाला हे देखील आवडेल',
    related: [
      {title: 'पाळीतील वेदना समजून घेणे', meta: '7 मिनिटे  ·  मार्गदर्शक'},
      {title: 'तुमच्या शरीराला योग्य संरक्षण निवडणे', meta: '5 मिनिटे  ·  मार्गदर्शक'},
      {title: 'पेटके नैसर्गिकरीत्या कसे कमी करावेत', meta: '6 मिनिटे  ·  मार्गदर्शक'},
    ],
    shareTitle: 'खाजगी भागाची स्वच्छता · AWA',
    shareMessage: 'पाळीदरम्यान तुमच्या खाजगी भागाची स्वच्छता सांभाळणे · AWA',
  },
  gu: {
    badge: 'માસિકનો સ્રાવ',
    title: 'માસિક દરમિયાન તમારી અંગત\nસ્વચ્છતાની કાળજી લેવી',
    metaDuration: '6 મિનિટ વાંચન',
    metaType: 'માર્ગદર્શિકા',
    metaLevel: 'પ્રારંભિક સ્તર',
    metaValidated: 'પુનરાવલોકન કરેલી સામગ્રી',
    intro: 'અંગત સ્વચ્છતાની કાળજી લેવાનો અર્થ છે તમારા શરીર અને તેના કુદરતી સંતુલનનું સન્માન કરવું.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      'તે કેમ મહત્વનું છે',
      'સારી ટેવો',
      'શું ટાળવું',
      'ડૉક્ટરને ક્યારે મળવું',
      'વ્યવહારુ સૂચનો',
    ],
    body: 'માસિક દરમિયાન તમારું શરીર બદલાય છે અને વધુ સંવેદનશીલ બને છે. યોગ્ય ટેવો અપનાવવાથી બળતરા અને ચેપ અટકાવવામાં મદદ મળે છે, અને રોજિંદા જીવનમાં આરામદાયક રહેવામાં સહાય થાય છે.',
    goodPractices: [
      'હળવેથી ધોવો: સ્વચ્છ પાણીથી આગળથી પાછળની દિશામાં સાદું ધોવું તમારા કુદરતી જીવાણુઓનું રક્ષણ કરવા પૂરતું છે.',
      'સંરક્ષણ નિયમિત બદલો: ભેજ અને અપ્રિય ગંધ ટાળવા માટે દર 4 થી 6 કલાકે.',
      'સુતરાઉ પસંદ કરો: સુતરાઉ અંડરવેર ત્વચાને શ્વાસ લેવા દે છે અને બળતરાનું જોખમ ઘટાડે છે.',
    ],
    thingsToAvoid: [
      'કડક સાબુ અને સુગંધિત ઉત્પાદનો',
      'યોનિમાર્ગની ડૂશ, જે તમારા કુદરતી જીવાણુઓને ખોરવે છે',
      'ભીનું પેડ કે ટેમ્પોન ખૂબ લાંબા સમય સુધી પહેરી રાખવું',
    ],
    consultReasons: [
      'સતત બળતરા, ખંજવાળ કે દાહ',
      'અસામાન્ય ગંધ કે સ્રાવ જે તમારા માટે સામાન્ય હોય તેનાથી અલગ હોય',
      'નોંધપાત્ર દુખાવો કે લક્ષણો જે તમને ચિંતા કરાવે',
    ],
    tipTitle: 'AWAની સલાહ',
    tipText: 'તમારા શરીરમાં પહેલેથી જ કુદરતી સંતુલન જાળવવાની વ્યવસ્થા છે. સામાન્ય રીતે હળવું ધોવું પૂરતું છે.',
    takeawaysTitle: 'મુખ્ય મુદ્દા',
    takeaways: [
      'સ્વચ્છ પાણીથી હળવું ધોવું',
      'નિયમિત બદલવું',
      'સુગંધિત ઉત્પાદનો ટાળવા',
      'સુતરાઉ પસંદ કરવું',
    ],
    relatedTitle: '♥  તમને આ પણ ગમી શકે',
    related: [
      {title: 'માસિકના દુખાવાને સમજવો', meta: '7 મિનિટ  ·  માર્ગદર્શિકા'},
      {title: 'તમારા શરીર માટે યોગ્ય સંરક્ષણ પસંદ કરવું', meta: '5 મિનિટ  ·  માર્ગદર્શિકા'},
      {title: 'ખેંચાણમાં કુદરતી રીતે રાહત કેવી રીતે મેળવવી', meta: '6 મિનિટ  ·  માર્ગદર્શિકા'},
    ],
    shareTitle: 'અંગત સ્વચ્છતા · AWA',
    shareMessage: 'માસિક દરમિયાન તમારી અંગત સ્વચ્છતાની કાળજી લેવી · AWA',
  },
  pa: {
    badge: 'ਮਾਹਵਾਰੀ ਦਾ ਵਹਾਅ',
    title: 'ਮਾਹਵਾਰੀ ਦੌਰਾਨ ਆਪਣੀ ਨਿੱਜੀ\nਸਫ਼ਾਈ ਦਾ ਖ਼ਿਆਲ ਰੱਖਣਾ',
    metaDuration: '6 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਗਾਈਡ',
    metaLevel: 'ਸ਼ੁਰੂਆਤੀ ਪੱਧਰ',
    metaValidated: 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ',
    intro: 'ਨਿੱਜੀ ਸਫ਼ਾਈ ਦਾ ਖ਼ਿਆਲ ਰੱਖਣ ਦਾ ਮਤਲਬ ਹੈ ਆਪਣੇ ਸਰੀਰ ਅਤੇ ਉਸ ਦੇ ਕੁਦਰਤੀ ਸੰਤੁਲਨ ਦਾ ਆਦਰ ਕਰਨਾ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      'ਇਹ ਅਹਿਮ ਕਿਉਂ ਹੈ',
      'ਚੰਗੀਆਂ ਆਦਤਾਂ',
      'ਕੀ ਨਹੀਂ ਕਰਨਾ ਚਾਹੀਦਾ',
      'ਡਾਕਟਰ ਨੂੰ ਕਦੋਂ ਮਿਲਣਾ ਹੈ',
      'ਵਿਹਾਰਕ ਸੁਝਾਅ',
    ],
    body: 'ਮਾਹਵਾਰੀ ਦੌਰਾਨ ਤੁਹਾਡਾ ਸਰੀਰ ਬਦਲਦਾ ਹੈ ਅਤੇ ਵਧੇਰੇ ਸੰਵੇਦਨਸ਼ੀਲ ਹੋ ਜਾਂਦਾ ਹੈ। ਸਹੀ ਆਦਤਾਂ ਅਪਣਾਉਣ ਨਾਲ ਜਲਣ ਅਤੇ ਲਾਗ ਤੋਂ ਬਚਾਅ ਹੁੰਦਾ ਹੈ, ਅਤੇ ਰੋਜ਼ਾਨਾ ਆਰਾਮਦਾਇਕ ਰਹਿਣ ਵਿੱਚ ਮਦਦ ਮਿਲਦੀ ਹੈ।',
    goodPractices: [
      'ਹੌਲੀ-ਹੌਲੀ ਧੋਵੋ: ਸਾਫ਼ ਪਾਣੀ ਨਾਲ ਅੱਗੇ ਤੋਂ ਪਿੱਛੇ ਵੱਲ ਸਧਾਰਨ ਧੁਲਾਈ ਤੁਹਾਡੇ ਕੁਦਰਤੀ ਸੰਤੁਲਨ ਦੀ ਰੱਖਿਆ ਲਈ ਕਾਫ਼ੀ ਹੈ।',
      'ਆਪਣਾ ਸਾਮਾਨ ਨਿਯਮਿਤ ਬਦਲੋ: ਨਮੀ ਅਤੇ ਬੁਰੀ ਬਦਬੂ ਤੋਂ ਬਚਣ ਲਈ ਹਰ 4 ਤੋਂ 6 ਘੰਟਿਆਂ ਬਾਅਦ।',
      'ਸੂਤੀ ਕੱਪੜਾ ਚੁਣੋ: ਸੂਤੀ ਅੰਦਰਲਾ ਕੱਪੜਾ ਚਮੜੀ ਨੂੰ ਸਾਹ ਲੈਣ ਦਿੰਦਾ ਹੈ ਅਤੇ ਜਲਣ ਦਾ ਜੋਖਮ ਘਟਾਉਂਦਾ ਹੈ।',
    ],
    thingsToAvoid: [
      'ਤੇਜ਼ ਸਾਬਣ ਅਤੇ ਖ਼ੁਸ਼ਬੂਦਾਰ ਉਤਪਾਦ',
      'ਯੋਨੀ ਦੀ ਅੰਦਰੂਨੀ ਧੁਲਾਈ, ਜੋ ਤੁਹਾਡੇ ਕੁਦਰਤੀ ਸੰਤੁਲਨ ਨੂੰ ਵਿਗਾੜਦੀ ਹੈ',
      'ਗਿੱਲਾ ਪੈਡ ਜਾਂ ਟੈਂਪੂਨ ਬਹੁਤ ਦੇਰ ਤੱਕ ਲੱਗਿਆ ਰਹਿਣ ਦੇਣਾ',
    ],
    consultReasons: [
      'ਲਗਾਤਾਰ ਜਲਣ, ਖੁਜਲੀ ਜਾਂ ਸੜਨ',
      'ਅਸਧਾਰਨ ਬਦਬੂ ਜਾਂ ਰਿਸਾਅ ਜੋ ਤੁਹਾਡੇ ਲਈ ਆਮ ਨਾਲੋਂ ਵੱਖਰਾ ਹੋਵੇ',
      'ਜ਼ਿਆਦਾ ਦਰਦ ਜਾਂ ਅਜਿਹੇ ਲੱਛਣ ਜੋ ਤੁਹਾਨੂੰ ਚਿੰਤਤ ਕਰਨ',
    ],
    tipTitle: 'AWA ਸੁਝਾਅ',
    tipText: 'ਤੁਹਾਡੇ ਸਰੀਰ ਵਿੱਚ ਪਹਿਲਾਂ ਹੀ ਸੰਤੁਲਨ ਬਣਾਉਣ ਦੀ ਇੱਕ ਕੁਦਰਤੀ ਪ੍ਰਣਾਲੀ ਹੈ। ਹੌਲੀ-ਹੌਲੀ ਧੋਣਾ ਆਮ ਤੌਰ \'ਤੇ ਕਾਫ਼ੀ ਹੁੰਦਾ ਹੈ।',
    takeawaysTitle: 'ਮੁੱਖ ਨੁਕਤੇ',
    takeaways: [
      'ਸਾਫ਼ ਪਾਣੀ ਨਾਲ ਹੌਲੀ ਧੁਲਾਈ',
      'ਨਿਯਮਿਤ ਬਦਲੋ',
      'ਖ਼ੁਸ਼ਬੂਦਾਰ ਉਤਪਾਦਾਂ ਤੋਂ ਬਚੋ',
      'ਸੂਤੀ ਕੱਪੜਾ ਚੁਣੋ',
    ],
    relatedTitle: '♥  ਤੁਹਾਨੂੰ ਇਹ ਵੀ ਪਸੰਦ ਆ ਸਕਦਾ ਹੈ',
    related: [
      {title: 'ਮਾਹਵਾਰੀ ਦੇ ਦਰਦ ਨੂੰ ਸਮਝਣਾ', meta: '7 ਮਿੰਟ  ·  ਗਾਈਡ'},
      {title: 'ਆਪਣੇ ਸਰੀਰ ਲਈ ਸਹੀ ਬਚਾਅ ਵਾਲਾ ਸਾਮਾਨ ਚੁਣਨਾ', meta: '5 ਮਿੰਟ  ·  ਗਾਈਡ'},
      {title: 'ਮਰੋੜ ਨੂੰ ਕੁਦਰਤੀ ਤੌਰ \'ਤੇ ਕਿਵੇਂ ਘਟਾਈਏ', meta: '6 ਮਿੰਟ  ·  ਗਾਈਡ'},
    ],
    shareTitle: 'ਨਿੱਜੀ ਸਫ਼ਾਈ · AWA',
    shareMessage: 'ਮਾਹਵਾਰੀ ਦੌਰਾਨ ਆਪਣੀ ਨਿੱਜੀ ਸਫ਼ਾਈ ਦਾ ਖ਼ਿਆਲ ਰੱਖਣਾ · AWA',
  },
  my: {
    badge: 'ရာသီသွေးထွက်ပမာဏ',
    title: 'ရာသီလာချိန် သင့်ကိုယ်ပိုင်အစိတ်အပိုင်း\nသန့်ရှင်းမှုကို ဂရုစိုက်ခြင်း',
    metaDuration: 'ဖတ်ချိန် 6 မိနစ်',
    metaType: 'လမ်းညွှန်',
    metaLevel: 'အခြေခံအဆင့်',
    metaValidated: 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ',
    intro: 'ကိုယ်ပိုင်အစိတ်အပိုင်း သန့်ရှင်းမှုကို ဂရုစိုက်ခြင်းသည် သင့်ခန္ဓာကိုယ်နှင့် ၎င်း၏ သဘာဝမျှခြေကို လေးစားခြင်းဖြစ်သည်။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'အဘယ်ကြောင့် အရေးကြီးသနည်း',
      'အလေ့အကျင့်ကောင်းများ',
      'ရှောင်ရန်အရာများ',
      'ဆရာဝန်နှင့် ဘယ်အချိန်ပြသင့်သလဲ',
      'လက်တွေ့အကြံပြုချက်များ',
    ],
    body: 'ရာသီလာချိန်တွင် သင့်ခန္ဓာကိုယ်သည် ပြောင်းလဲပြီး ပိုမိုအထိခိုက်လွယ်လာသည်။ သင့်လျော်သော အလေ့အကျင့်များကို လိုက်နာခြင်းဖြင့် ယားယံခြင်းနှင့် ရောဂါကူးစက်ခြင်းကို ကာကွယ်နိုင်ပြီး နေ့စဉ်နေ့တိုင်း သက်တောင့်သက်သာရှိစေသည်။',
    goodPractices: [
      'ညင်ညင်သာသာ ဆေးကြောပါ။ ရေစင်ဖြင့် ရှေ့မှနောက်သို့ ရိုးရိုးဆေးကြောရုံဖြင့် သင့်သဘာဝ ဘက်တီးရီးယားမျှခြေကို ကာကွယ်ရန် လုံလောက်သည်။',
      'ကာကွယ်ရေးပစ္စည်းကို ပုံမှန်လဲပါ။ စိုစွတ်ခြင်းနှင့် မနှစ်မြို့ဖွယ်အနံ့များကို ရှောင်ရန် 4 နာရီမှ 6 နာရီတစ်ကြိမ် လဲပါ။',
      'ချည်ထည်ကို ရွေးပါ။ ချည်ထည်အတွင်းခံသည် သင့်အရေပြားကို အသက်ရှူခွင့်ပေးပြီး ယားယံခြင်းအန္တရာယ်ကို လျှော့ချပေးသည်။',
    ],
    thingsToAvoid: [
      'ပြင်းထန်သော ဆပ်ပြာများနှင့် ရနံ့ပါသော ထုတ်ကုန်များ',
      'သင့်သဘာဝ ဘက်တီးရီးယားမျှခြေကို ထိခိုက်စေသော မီးယပ်လမ်းကြောင်း ဆေးကြောခြင်းများ',
      'စိုစွတ်နေသော ပက်ဒ် သို့မဟုတ် တမ်ပွန်ကို အချိန်ကြာကြာ ထားခြင်း',
    ],
    consultReasons: [
      'ဆက်လက်ရှိနေသော ယားယံခြင်း၊ ယားခြင်း သို့မဟုတ် ပူလောင်ခြင်း',
      'သင့်အတွက် ပုံမှန်နှင့် ကွဲပြားသော ထူးခြားအနံ့ သို့မဟုတ် အရည်ထွက်ခြင်း',
      'သင့်ကို စိုးရိမ်စေသော သိသာသည့် နာကျင်ခြင်း သို့မဟုတ် လက္ခဏာများ',
    ],
    tipTitle: 'AWA အကြံပြုချက်',
    tipText: 'သင့်ခန္ဓာကိုယ်တွင် သဘာဝမျှခြေညှိစနစ် ရှိပြီးသားဖြစ်သည်။ ညင်သာစွာ ဆေးကြောရုံဖြင့် များသောအားဖြင့် လုံလောက်သည်။',
    takeawaysTitle: 'အဓိကအချက်များ',
    takeaways: [
      'ရေစင်ဖြင့် ညင်သာစွာ ဆေးကြောပါ',
      'ပုံမှန်လဲပါ',
      'ရနံ့ပါသော ထုတ်ကုန်များကို ရှောင်ပါ',
      'ချည်ထည်ကို ရွေးပါ',
    ],
    relatedTitle: '♥  သင်နှစ်သက်နိုင်သည့် အခြားဆောင်းပါးများ',
    related: [
      {title: 'ရာသီလာချိန် နာကျင်ခြင်းကို နားလည်ခြင်း', meta: '7 မိနစ်  ·  လမ်းညွှန်'},
      {title: 'သင့်ခန္ဓာကိုယ်နှင့် သင့်လျော်သော ကာကွယ်ရေးပစ္စည်းကို ရွေးချယ်ခြင်း', meta: '5 မိနစ်  ·  လမ်းညွှန်'},
      {title: 'ကြွက်သားတက်ခြင်းကို သဘာဝနည်းဖြင့် ဘယ်လိုသက်သာစေမလဲ', meta: '6 မိနစ်  ·  လမ်းညွှန်'},
    ],
    shareTitle: 'ကိုယ်ပိုင်အစိတ်အပိုင်း သန့်ရှင်းမှု · AWA',
    shareMessage: 'ရာသီလာချိန် သင့်ကိုယ်ပိုင်အစိတ်အပိုင်း သန့်ရှင်းမှုကို ဂရုစိုက်ခြင်း · AWA',
  },
  km: {
    badge: 'បរិមាណឈាមរដូវ',
    title: 'ការថែរក្សាអនាម័យកន្លែងកំបាំង\nក្នុងអំឡុងរដូវ',
    metaDuration: 'អាន 6 នាទី',
    metaType: 'មគ្គុទ្ទេសក៍',
    metaLevel: 'កម្រិតដំបូង',
    metaValidated: 'មាតិកាបានពិនិត្យ',
    intro: 'ការថែរក្សាអនាម័យកន្លែងកំបាំង មានន័យថាគោរពរាងកាយរបស់អ្នក និងតុល្យភាពធម្មជាតិរបស់វា។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'ហេតុអ្វីបានជាសំខាន់',
      'ទម្លាប់ល្អ',
      'អ្វីដែលត្រូវជៀសវាង',
      'ពេលណាត្រូវជួបវេជ្ជបណ្ឌិត',
      'ដំបូន្មានប្រតិបត្តិ',
    ],
    body: 'ក្នុងអំឡុងរដូវ រាងកាយរបស់អ្នកផ្លាស់ប្តូរ ហើយកាន់តែរសើប។ ការអនុវត្តទម្លាប់ត្រឹមត្រូវជួយការពារការរលាក និងការឆ្លងមេរោគ ហើយជួយឱ្យអ្នកមានអារម្មណ៍ស្រួលប្រចាំថ្ងៃ។',
    goodPractices: [
      'លាងដោយទន់ភ្លន់៖ គ្រាន់តែលាងជាមួយទឹកស្អាតពីមុខទៅក្រោយ ក៏គ្រប់គ្រាន់ដើម្បីការពារបាក់តេរីធម្មជាតិរបស់អ្នក។',
      'ប្តូរគ្រឿងការពារឱ្យទៀងទាត់៖ រៀងរាល់ 4 ទៅ 6 ម៉ោង ដើម្បីជៀសវាងសំណើម និងក្លិនមិនល្អ។',
      'ជ្រើសរើសសំឡីកប្បាស៖ ខោទ្រនាប់សំឡីកប្បាសឱ្យស្បែករបស់អ្នកដកដង្ហើមបាន និងកាត់បន្ថយហានិភ័យនៃការរលាក។',
    ],
    thingsToAvoid: [
      'សាប៊ូខ្លាំង និងផលិតផលមានក្លិនក្រអូប',
      'ការបាញ់លាងទ្វារមាស ដែលរំខានដល់បាក់តេរីធម្មជាតិរបស់អ្នក',
      'ការទុកក្រណាត់អនាម័យ ឬ tampon ដែលសើមយូរពេក',
    ],
    consultReasons: [
      'ការរលាក រមាស់ ឬឆេះជាប់រហូត',
      'ក្លិន ឬទឹករំអិលមិនធម្មតា ដែលខុសពីអ្វីដែលជាធម្មតាសម្រាប់អ្នក',
      'ការឈឺចាប់ខ្លាំង ឬរោគសញ្ញាដែលធ្វើឱ្យអ្នកព្រួយបារម្ភ',
    ],
    tipTitle: 'ដំបូន្មាន AWA',
    tipText: 'រាងកាយរបស់អ្នកមានយន្តការធ្វើឱ្យមានតុល្យភាពតាមធម្មជាតិរួចហើយ។ ការលាងដោយទន់ភ្លន់ជាទូទៅគ្រប់គ្រាន់ហើយ។',
    takeawaysTitle: 'ចំណុចសំខាន់ៗ',
    takeaways: [
      'លាងដោយទន់ភ្លន់ជាមួយទឹកស្អាត',
      'ប្តូរឱ្យទៀងទាត់',
      'ជៀសវាងផលិតផលមានក្លិនក្រអូប',
      'ជ្រើសរើសសំឡីកប្បាស',
    ],
    relatedTitle: '♥  អ្នកក៏អាចចូលចិត្ត',
    related: [
      {title: 'ការយល់ដឹងអំពីការឈឺពោះរដូវ', meta: '7 នាទី  ·  មគ្គុទ្ទេសក៍'},
      {title: 'ការជ្រើសរើសគ្រឿងការពារដែលសមស្របនឹងរាងកាយរបស់អ្នក', meta: '5 នាទី  ·  មគ្គុទ្ទេសក៍'},
      {title: 'របៀបបំបាត់ការឈឺពោះរដូវតាមធម្មជាតិ', meta: '6 នាទី  ·  មគ្គុទ្ទេសក៍'},
    ],
    shareTitle: 'អនាម័យកន្លែងកំបាំង · AWA',
    shareMessage: 'ការថែរក្សាអនាម័យកន្លែងកំបាំងក្នុងអំឡុងរដូវ · AWA',
  },
  lo: {
    badge: 'ປະລິມານເລືອດປະຈຳເດືອນ',
    title: 'ການດູແລຄວາມສະອາດສ່ວນຕົວ\nໃນຊ່ວງມີປະຈຳເດືອນ',
    metaDuration: 'ອ່ານ 6 ນາທີ',
    metaType: 'ຄູ່ມື',
    metaLevel: 'ລະດັບເລີ່ມຕົ້ນ',
    metaValidated: 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ',
    intro: 'ການດູແລຄວາມສະອາດສ່ວນຕົວ ໝາຍເຖິງການເຄົາລົບຮ່າງກາຍຂອງທ່ານ ແລະ ຄວາມສົມດຸນຕາມທຳມະຊາດຂອງມັນ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ເປັນຫຍັງຈຶ່ງສຳຄັນ',
      'ນິໄສທີ່ດີ',
      'ສິ່ງທີ່ຄວນຫຼີກລ່ຽງ',
      'ເມື່ອໃດຄວນພົບແພດ',
      'ຄຳແນະນຳທີ່ເຮັດໄດ້ຈິງ',
    ],
    body: 'ໃນຊ່ວງມີປະຈຳເດືອນ ຮ່າງກາຍຂອງທ່ານປ່ຽນແປງ ແລະ ອ່ອນໄຫວຫຼາຍຂຶ້ນ. ການມີນິໄສທີ່ເໝາະສົມຊ່ວຍປ້ອງກັນການລະຄາຍເຄືອງ ແລະ ການຕິດເຊື້ອ ແລະ ຊ່ວຍໃຫ້ທ່ານສະບາຍໃນແຕ່ລະມື້.',
    goodPractices: [
      'ລ້າງຢ່າງອ່ອນໂຍນ: ພຽງລ້າງດ້ວຍນ້ຳສະອາດຈາກດ້ານໜ້າໄປດ້ານຫຼັງກໍພຽງພໍທີ່ຈະປົກປ້ອງເຊື້ອຈຸລິນຊີທີ່ດີຕາມທຳມະຊາດຂອງທ່ານ.',
      'ປ່ຽນອຸປະກອນປ້ອງກັນເປັນປະຈຳ: ທຸກ 4 ຫາ 6 ຊົ່ວໂມງ ເພື່ອຫຼີກລ່ຽງຄວາມຊຸ່ມ ແລະ ກິ່ນບໍ່ພຶງປະສົງ.',
      'ເລືອກຜ້າຝ້າຍ: ຊຸດຊັ້ນໃນຜ້າຝ້າຍເຮັດໃຫ້ຜິວຫາຍໃຈໄດ້ ແລະ ຫຼຸດຄວາມສ່ຽງຂອງການລະຄາຍເຄືອງ.',
    ],
    thingsToAvoid: [
      'ສະບູແຮງ ແລະ ຜະລິດຕະພັນມີກິ່ນຫອມ',
      'ການຜັກລ້າງຊ່ອງຄອດ ຊຶ່ງລົບກວນເຊື້ອຈຸລິນຊີທີ່ດີຕາມທຳມະຊາດຂອງທ່ານ',
      'ການໃສ່ຜ້າອະນາໄມ ຫຼື ແທມປອນທີ່ຊຸ່ມໄວ້ດົນເກີນໄປ',
    ],
    consultReasons: [
      'ການລະຄາຍເຄືອງ, ຄັນ ຫຼື ແສບຮ້ອນທີ່ບໍ່ຫາຍ',
      'ກິ່ນ ຫຼື ຕົກຂາວທີ່ຜິດປົກກະຕິ ແຕກຕ່າງຈາກສິ່ງທີ່ປົກກະຕິສຳລັບທ່ານ',
      'ອາການເຈັບຮຸນແຮງ ຫຼື ອາການທີ່ເຮັດໃຫ້ທ່ານກັງວົນ',
    ],
    tipTitle: 'ຄຳແນະນຳຈາກ AWA',
    tipText: 'ຮ່າງກາຍຂອງທ່ານມີກົນໄກສົມດຸນຕາມທຳມະຊາດຢູ່ແລ້ວ. ການລ້າງຢ່າງອ່ອນໂຍນມັກຈະພຽງພໍ.',
    takeawaysTitle: 'ຈຸດສຳຄັນ',
    takeaways: [
      'ລ້າງຢ່າງອ່ອນໂຍນດ້ວຍນ້ຳສະອາດ',
      'ປ່ຽນເປັນປະຈຳ',
      'ຫຼີກລ່ຽງຜະລິດຕະພັນມີກິ່ນຫອມ',
      'ເລືອກຜ້າຝ້າຍ',
    ],
    relatedTitle: '♥  ທ່ານອາດຈະມັກ',
    related: [
      {title: 'ເຂົ້າໃຈອາການເຈັບທ້ອງປະຈຳເດືອນ', meta: '7 ນາທີ  ·  ຄູ່ມື'},
      {title: 'ເລືອກອຸປະກອນປ້ອງກັນທີ່ເໝາະກັບຮ່າງກາຍຂອງທ່ານ', meta: '5 ນາທີ  ·  ຄູ່ມື'},
      {title: 'ວິທີບັນເທົາອາການເຈັບທ້ອງຕາມທຳມະຊາດ', meta: '6 ນາທີ  ·  ຄູ່ມື'},
    ],
    shareTitle: 'ຄວາມສະອາດສ່ວນຕົວ · AWA',
    shareMessage: 'ການດູແລຄວາມສະອາດສ່ວນຕົວໃນຊ່ວງມີປະຈຳເດືອນ · AWA',
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
