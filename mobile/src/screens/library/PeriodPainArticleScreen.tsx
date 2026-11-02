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

const ID = 'pain-gerer-douleurs';

const HERO = require('../../assets/images/library/pain-hero.png');

// Images/icons stay language-neutral — only TEXT moves into the bilingual
// CONTENT object below, keyed by index to stay aligned with these assets.
const SOL_IMAGES = [
  require('../../assets/images/library/pain-heat.png'),
  require('../../assets/images/library/pain-movement.png'),
  require('../../assets/images/library/pain-food.png'),
  require('../../assets/images/library/pain-water.png'),
  require('../../assets/images/library/pain-massage.png'),
] as const;

const DAILY_ICONS = [
  'weather-sunny',
  'food-apple-outline',
  'sleep',
  'calendar-heart',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('PeriodPain', {
  fr: {
    badge: 'DOULEURS',
    title: 'Gérer les douleurs\nmenstruelles',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Chaleur, mouvement doux, alimentation : des gestes qui soulagent vraiment.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Comprendre les douleurs menstruelles',
      'Les solutions naturelles efficaces',
      'Quand faut-il consulter ?',
      'Conseils pratiques au quotidien',
    ],
    section1Text: 'Les crampes viennent des contractions utérines qui aident à évacuer la muqueuse. Elles sont dues aux prostaglandines. Chaque corps réagit différemment.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Les douleurs peuvent varier d’un cycle à l’autre et ne sont pas toujours identiques.',
    solutions: [
      {title: 'Chaleur', text: 'Une bouillotte sur le bas-ventre peut détendre les muscles.'},
      {title: 'Mouvement doux', text: 'Yoga, étirements et marche légère soulagent les tensions.'},
      {title: 'Alimentation', text: 'Magnésium, oméga-3 et aliments anti-inflammatoires.'},
      {title: 'Hydratation', text: 'Boire suffisamment aide à limiter les ballonnements.'},
      {title: 'Massage', text: 'Un massage circulaire du bas-ventre détend.'},
    ],
    section3Text: 'Si les douleurs t’empêchent de vivre normalement chaque mois malgré ces solutions, il est important d’en parler à un professionnel de santé.',
    alertTitle: 'Consulter si',
    alertText: 'Douleurs très intenses, saignements importants, fatigue extrême ou symptômes anormaux.',
    dailyTips: [
      'Échauffe doucement ton corps au réveil',
      'Privilégie une alimentation équilibrée',
      'Prends le temps de respirer et te détendre',
      'Suis ton cycle pour mieux comprendre tes douleurs',
    ],
    shareMessage: 'Gérer les douleurs menstruelles — AWA',
  },
  en: {
    badge: 'PAIN',
    title: 'Managing period\npain',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Heat, gentle movement, diet: habits that really bring relief.',
    contentsTitle: 'In this article',
    topics: [
      'Understanding period pain',
      'Effective natural solutions',
      'When should you see a doctor?',
      'Practical everyday tips',
    ],
    section1Text: 'Cramps come from uterine contractions that help shed the uterine lining. They’re caused by prostaglandins. Every body reacts differently.',
    tip1Title: 'Good to know',
    tip1Text: 'Pain can vary from one cycle to the next and isn’t always the same.',
    solutions: [
      {title: 'Heat', text: 'A hot water bottle on your lower abdomen can relax the muscles.'},
      {title: 'Gentle movement', text: 'Yoga, stretching, and light walking relieve tension.'},
      {title: 'Diet', text: 'Magnesium, omega-3s, and anti-inflammatory foods.'},
      {title: 'Hydration', text: 'Drinking enough water helps limit bloating.'},
      {title: 'Massage', text: 'A circular massage on your lower abdomen helps you relax.'},
    ],
    section3Text: 'If the pain keeps you from living normally every month despite these solutions, it’s important to talk to a healthcare professional.',
    alertTitle: 'See a doctor if',
    alertText: 'Very intense pain, heavy bleeding, extreme fatigue, or abnormal symptoms.',
    dailyTips: [
      'Gently warm up your body when you wake up',
      'Favor a balanced diet',
      'Take time to breathe and relax',
      'Track your cycle to better understand your pain',
    ],
    shareMessage: 'Managing period pain — AWA',
  },
  es: {
    badge: 'DOLORES',
    title: 'Manejar los dolores\nmenstruales',
    metaDuration: '7 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Calor, movimiento suave, alimentación: gestos que realmente alivian.',
    contentsTitle: 'En este artículo',
    topics: [
      'Entender los dolores menstruales',
      'Soluciones naturales eficaces',
      '¿Cuándo hay que consultar?',
      'Consejos prácticos para el día a día',
    ],
    section1Text: 'Los cólicos provienen de las contracciones uterinas que ayudan a expulsar el revestimiento uterino. Se deben a las prostaglandinas. Cada cuerpo reacciona de forma diferente.',
    tip1Title: 'Dato útil',
    tip1Text: 'Los dolores pueden variar de un ciclo a otro y no son siempre iguales.',
    solutions: [
      {title: 'Calor', text: 'Una bolsa de agua caliente en la parte baja del abdomen puede relajar los músculos.'},
      {title: 'Movimiento suave', text: 'El yoga, los estiramientos y caminar suavemente alivian las tensiones.'},
      {title: 'Alimentación', text: 'Magnesio, omega-3 y alimentos antiinflamatorios.'},
      {title: 'Hidratación', text: 'Beber suficiente agua ayuda a limitar la hinchazón.'},
      {title: 'Masaje', text: 'Un masaje circular en la parte baja del abdomen ayuda a relajar.'},
    ],
    section3Text: 'Si los dolores te impiden llevar una vida normal cada mes a pesar de estas soluciones, es importante hablar de ello con un profesional de la salud.',
    alertTitle: 'Consulta si',
    alertText: 'Dolores muy intensos, sangrado abundante, fatiga extrema o síntomas anormales.',
    dailyTips: [
      'Calienta suavemente tu cuerpo al despertar',
      'Opta por una alimentación equilibrada',
      'Tómate tiempo para respirar y relajarte',
      'Haz seguimiento de tu ciclo para entender mejor tus dolores',
    ],
    shareMessage: 'Manejar los dolores menstruales — AWA',
  },
  it: {
    badge: 'DOLORE',
    title: 'Gestire il dolore\nmestruale',
    metaDuration: '7 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Calore, movimento dolce, alimentazione: abitudini che portano davvero sollievo.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Capire il dolore mestruale',
      'Rimedi naturali efficaci',
      'Quando rivolgersi al medico?',
      'Consigli pratici per ogni giorno',
    ],
    section1Text: 'I crampi derivano dalle contrazioni dell’utero che aiutano a eliminare il rivestimento uterino. Sono causati dalle prostaglandine. Ogni corpo reagisce in modo diverso.',
    tip1Title: 'Da sapere',
    tip1Text: 'Il dolore può variare da un ciclo all’altro e non è sempre uguale.',
    solutions: [
      {
        title: 'Calore',
        text: 'Una borsa dell’acqua calda sul basso ventre può rilassare i muscoli.',
      },
      {
        title: 'Movimento dolce',
        text: 'Yoga, stretching e camminate leggere alleviano la tensione.',
      },
      {
        title: 'Alimentazione',
        text: 'Magnesio, omega-3 e alimenti antinfiammatori.',
      },
      {
        title: 'Idratazione',
        text: 'Bere abbastanza acqua aiuta a limitare il gonfiore.',
      },
      {
        title: 'Massaggio',
        text: 'Un massaggio circolare sul basso ventre ti aiuta a rilassarti.',
      },
    ],
    section3Text: 'Se, nonostante questi rimedi, il dolore ti impedisce ogni mese di vivere normalmente, è importante parlarne con un operatore sanitario.',
    alertTitle: 'Rivolgiti a un medico se',
    alertText: 'Dolore molto intenso, sanguinamento abbondante, stanchezza estrema o sintomi anomali.',
    dailyTips: [
      'Scalda dolcemente il corpo al risveglio',
      'Privilegia un’alimentazione equilibrata',
      'Prenditi del tempo per respirare e rilassarti',
      'Monitora il tuo ciclo per capire meglio il tuo dolore',
    ],
    shareMessage: 'Gestire il dolore mestruale — AWA',
  },
  tr: {
    badge: 'AĞRI',
    title: 'Adet ağrısıyla\nbaşa çıkmak',
    metaDuration: '7 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Sıcaklık, hafif hareket, beslenme: gerçekten rahatlama sağlayan alışkanlıklar.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Adet ağrısını anlamak',
      'Etkili doğal çözümler',
      'Ne zaman doktora başvurmalı?',
      'Günlük hayat için pratik ipuçları',
    ],
    section1Text: 'Kramplar, rahim iç tabakasının dökülmesine yardımcı olan rahim kasılmalarından kaynaklanır. Bunlara prostaglandinler neden olur. Her vücut farklı tepki verir.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Ağrı bir döngüden diğerine değişebilir ve her zaman aynı olmaz.',
    solutions: [
      {
        title: 'Sıcaklık',
        text: 'Alt karnına konan bir sıcak su torbası kasları gevşetebilir.',
      },
      {
        title: 'Hafif hareket',
        text: 'Yoga, esneme ve hafif yürüyüş gerginliği azaltır.',
      },
      {
        title: 'Beslenme',
        text: 'Magnezyum, omega-3 ve iltihap önleyici besinler.',
      },
      {
        title: 'Sıvı alımı',
        text: 'Yeterince su içmek şişkinliği sınırlamaya yardımcı olur.',
      },
      {
        title: 'Masaj',
        text: 'Alt karnına yapılan dairesel bir masaj rahatlamana yardımcı olur.',
      },
    ],
    section3Text: 'Bu çözümlere rağmen ağrı her ay normal yaşamanı engelliyorsa, bir sağlık profesyonelle konuşman önemlidir.',
    alertTitle: 'Şu durumlarda doktora başvur',
    alertText: 'Çok şiddetli ağrı, yoğun kanama, aşırı yorgunluk veya olağandışı belirtiler.',
    dailyTips: [
      'Sabah uyandığında vücudunu nazikçe ısıt',
      'Dengeli beslenmeyi tercih et',
      'Nefes almak ve rahatlamak için zaman ayır',
      'Ağrını daha iyi anlamak için döngünü takip et',
    ],
    shareMessage: 'Adet ağrısıyla başa çıkmak — AWA',
  },
  ru: {
    badge: 'БОЛЬ',
    title: 'Как справляться\nс болью при месячных',
    metaDuration: '7 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Тепло, мягкое движение, питание: привычки, которые действительно приносят облегчение.',
    contentsTitle: 'В этой статье',
    topics: [
      'Как понять боль при месячных',
      'Эффективные натуральные средства',
      'Когда стоит обратиться к врачу?',
      'Практические советы на каждый день',
    ],
    section1Text: 'Спазмы возникают из-за сокращений матки, которые помогают отторгнуть слизистую оболочку. Их вызывают простагландины. Каждый организм реагирует по-своему.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Боль может меняться от цикла к циклу и не всегда бывает одинаковой.',
    solutions: [
      {title: 'Тепло', text: 'Грелка на низ живота может расслабить мышцы.'},
      {title: 'Мягкое движение', text: 'Йога, растяжка и неспешная ходьба снимают напряжение.'},
      {title: 'Питание', text: 'Магний, омега-3 и продукты с противовоспалительным действием.'},
      {title: 'Питьевой режим', text: 'Достаточное количество воды помогает уменьшить вздутие.'},
      {title: 'Массаж', text: 'Круговой массаж низа живота помогает расслабиться.'},
    ],
    section3Text: 'Если, несмотря на эти способы, боль каждый месяц мешает вам жить обычной жизнью, важно поговорить с медицинским специалистом.',
    alertTitle: 'Обратитесь к врачу, если',
    alertText: 'Очень сильная боль, обильное кровотечение, крайняя усталость или необычные симптомы.',
    dailyTips: [
      'Мягко разминайте тело после пробуждения',
      'Отдавайте предпочтение сбалансированному питанию',
      'Находите время, чтобы подышать и расслабиться',
      'Отслеживайте свой цикл, чтобы лучше понимать причины боли',
    ],
    shareMessage: 'Как справляться с болью при месячных — AWA',
  },
  de: {
    badge: 'SCHMERZEN',
    title: 'Periodenschmerzen\nlindern',
    metaDuration: '7 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Wärme, sanfte Bewegung, Ernährung: Gewohnheiten, die wirklich Linderung bringen.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Periodenschmerzen verstehen',
      'Wirksame natürliche Lösungen',
      'Wann solltest du zur Ärztin oder zum Arzt?',
      'Praktische Alltagstipps',
    ],
    section1Text: 'Krämpfe entstehen durch Kontraktionen der Gebärmutter, die helfen, die Gebärmutterschleimhaut abzustoßen. Sie werden durch Prostaglandine verursacht. Jeder Körper reagiert anders.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Die Schmerzen können von Zyklus zu Zyklus unterschiedlich sein und sind nicht immer gleich.',
    solutions: [
      {title: 'Wärme', text: 'Eine Wärmflasche auf dem Unterbauch kann die Muskeln entspannen.'},
      {title: 'Sanfte Bewegung', text: 'Yoga, Dehnübungen und leichtes Gehen lösen Verspannungen.'},
      {title: 'Ernährung', text: 'Magnesium, Omega-3-Fettsäuren und entzündungshemmende Lebensmittel.'},
      {title: 'Flüssigkeit', text: 'Ausreichend zu trinken hilft, Blähungen zu begrenzen.'},
      {title: 'Massage', text: 'Eine kreisende Massage auf dem Unterbauch hilft dir, dich zu entspannen.'},
    ],
    section3Text: 'Wenn dich die Schmerzen trotz dieser Maßnahmen jeden Monat daran hindern, ein normales Leben zu führen, ist es wichtig, mit medizinischem Fachpersonal zu sprechen.',
    alertTitle: 'Ärztlichen Rat suchen bei',
    alertText: 'Sehr starken Schmerzen, starken Blutungen, extremer Erschöpfung oder ungewöhnlichen Symptomen.',
    dailyTips: [
      'Wärme deinen Körper beim Aufwachen sanft auf',
      'Bevorzuge eine ausgewogene Ernährung',
      'Nimm dir Zeit zum Atmen und Entspannen',
      'Beobachte deinen Zyklus, um deine Schmerzen besser zu verstehen',
    ],
    shareMessage: 'Periodenschmerzen lindern – AWA',
  },
  zh: {
      badge: '疼痛',
      title: '应对\n经期疼痛',
      metaDuration: '阅读约 7 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '热敷、轻柔的活动、饮食：真正能带来缓解的习惯。',
      contentsTitle: '本文内容',
      topics: [
        '了解经期疼痛',
        '有效的自然缓解方法',
        '何时应该就医？',
        '日常实用小建议',
      ],
      section1Text: '痛经来自子宫的收缩，这种收缩有助于子宫内膜脱落，由前列腺素引起。每个人的身体反应都不一样。',
      tip1Title: '小贴士',
      tip1Text: '疼痛在不同的周期之间可能有所不同，并不总是一样。',
      solutions: [
        {
          title: '热敷',
          text: '把热水袋放在下腹部，可以让肌肉放松。',
        },
        {
          title: '轻柔的活动',
          text: '瑜伽、拉伸和轻松的散步可以缓解紧绷感。',
        },
        {
          title: '饮食',
          text: '镁、欧米伽-3 和具有抗炎作用的食物。',
        },
        {
          title: '补水',
          text: '喝足够的水有助于减轻腹胀。',
        },
        {
          title: '按摩',
          text: '在下腹部做环形按摩，有助于放松。',
        },
      ],
      section3Text: '如果尽管用了这些方法，疼痛仍然每个月都影响你的正常生活，那么和医疗专业人员谈一谈很重要。',
      alertTitle: '出现以下情况请就医',
      alertText: '疼痛非常剧烈、出血量很多、极度疲倦，或出现异常症状。',
      dailyTips: [
        '起床后轻柔地活动一下身体',
        '优先选择均衡的饮食',
        '花点时间深呼吸、放松',
        '记录月经周期，以便更好地了解自己的疼痛',
      ],
      shareMessage: '应对经期疼痛 — AWA',
    },
  'zh-Hant': {
      badge: '疼痛',
      title: '應對\n經期疼痛',
      metaDuration: '閱讀約 7 分鐘',
      metaType: '指南',
      metaLevel: '入門',
      metaValidated: '已審閱內容',
      intro: '熱敷、輕柔的活動、飲食：真正能帶來緩解的習慣。',
      contentsTitle: '本文內容',
      topics: [
        '瞭解經期疼痛',
        '有效的自然緩解方法',
        '何時應該就醫？',
        '日常實用小建議',
      ],
      section1Text: '痛經來自子宮的收縮，這種收縮有助於子宮內膜脫落，由攝護腺素引起。每個人的身體反應都不一樣。',
      tip1Title: '小提醒',
      tip1Text: '疼痛在不同的週期之間可能有所不同，並不總是一樣。',
      solutions: [
        {
          title: '熱敷',
          text: '把熱水袋放在下腹部，可以讓肌肉放鬆。',
        },
        {
          title: '輕柔的活動',
          text: '瑜伽、拉伸和輕鬆的散步可以緩解緊繃感。',
        },
        {
          title: '飲食',
          text: '鎂、歐米伽-3 和具有抗炎作用的食物。',
        },
        {
          title: '補水',
          text: '喝足夠的水有助於減輕腹脹。',
        },
        {
          title: '按摩',
          text: '在下腹部做環形按摩，有助於放鬆。',
        },
      ],
      section3Text: '如果儘管用了這些方法，疼痛仍然每個月都影響你的正常生活，那麼和醫療專業人員談一談很重要。',
      alertTitle: '出現以下情況請就醫',
      alertText: '疼痛非常劇烈、出血量很多、極度疲倦，或出現異常症狀。',
      dailyTips: [
        '起床後輕柔地活動一下身體',
        '優先選擇均衡的飲食',
        '花點時間深呼吸、放鬆',
        '記錄月經週期，以便更好地瞭解自己的疼痛',
      ],
      shareMessage: '應對經期疼痛 — AWA',
    },
  ar: {
    badge: 'الألم',
    title: 'التعامل مع\nألم الدورة',
    metaDuration: '7 د قراءة',
    metaType: 'دليل',
    metaLevel: 'مبتدئة',
    metaValidated: 'محتوى مراجَع',
    intro: 'الحرارة والحركة اللطيفة والغذاء: عادات تخفف الألم فعلًا.',
    contentsTitle: 'في هذا المقال',
    topics: [
      'فهم ألم الدورة',
      'حلول طبيعية فعّالة',
      'متى ينبغي أن تراجعي الطبيب؟',
      'نصائح عملية يومية',
    ],
    section1Text: 'تنتج التقلصات عن انقباضات الرحم التي تساعد على التخلص من بطانته. وتسببها البروستاغلاندينات. ويتفاعل كل جسم بشكل مختلف.',
    tip1Title: 'من المفيد أن تعرفي',
    tip1Text: 'قد يختلف الألم من دورة إلى أخرى وليس دائمًا هو نفسه.',
    solutions: [
      {title: 'الحرارة', text: 'قد تساعد قربة الماء الساخن على أسفل البطن في إرخاء العضلات.'},
      {title: 'الحركة اللطيفة', text: 'اليوغا والتمدد والمشي الخفيف تخفف التوتر.'},
      {title: 'الغذاء', text: 'المغنيسيوم وأوميغا 3 والأطعمة المضادة للالتهاب.'},
      {title: 'الترطيب', text: 'شرب كمية كافية من الماء يساعد على الحدّ من الانتفاخ.'},
      {title: 'التدليك', text: 'التدليك الدائري على أسفل البطن يساعدك على الاسترخاء.'},
    ],
    section3Text: 'إذا كان الألم يمنعك من ممارسة حياتك بشكل طبيعي كل شهر رغم هذه الحلول، فمن المهم التحدث إلى مختصة صحية.',
    alertTitle: 'راجعي الطبيب إذا',
    alertText: 'ألم شديد جدًا، أو نزف غزير، أو إرهاق شديد، أو أعراض غير طبيعية.',
    dailyTips: [
      'سخّني جسمك بلطف عند الاستيقاظ',
      'فضّلي نظامًا غذائيًا متوازنًا',
      'خصّصي وقتًا للتنفس والاسترخاء',
      'تابعي دورتك لتفهمي ألمك بشكل أفضل',
    ],
    shareMessage: 'التعامل مع ألم الدورة — AWA',
  },
  kab: {
    badge: 'LWEǦƐ',
    title: 'Aɣbel n lweǧɛ\nn tiregwa',
    metaDuration: 'Taɣuri n 7 n tisdidin',
    metaType: 'Amellal',
    metaLevel: 'Anagar',
    metaValidated: 'Agbur yettwasenqed',
    intro: 'Timmi, iseḥḥen ahlawan, tuččit: iɣal i d-yettawin tifrat s tidet.',
    contentsTitle: 'Deg umagrad-a',
    topics: [
      'Ad tfehmeḍ lweǧɛ n tiregwa',
      'Tifrat tabiɛiyin yettwasnen',
      'Melmi ara tẓerreḍ aṭṭbib?',
      'Iwellihen n yal ass',
    ],
    section1Text: 'Uḥulfu n lweǧɛ yekka-d seg usemmed n tkerrust i ɛawnen ad d-teffeɣ tgecrirt n tkerrust. Prostaglandines d ssebba-s. Yal ugris ixeddem s wudem-is.',
    tip1Title: 'Yelha ad tessneḍ',
    tip1Text: 'Lweǧɛ yezmer ad yemxalef seg yiwen n uzray ɣer wayeḍ u ur yelli ara d amcabi dima.',
    solutions: [
      {title: 'Timmi', text: 'Tazbart n waman iẓẓayen ɣef uda n ddaw n uɣerrus tezmer ad tesfeḍ iferdasen.'},
      {title: 'Iseḥḥen ahlawan', text: 'Yoga, aseḍḍi d tikli tafessast sfeḍment aɣilif.'},
      {title: 'Tuččit', text: 'Magnésium, omega-3 d wayen i yekkesen taɣbalut.'},
      {title: 'Asew', text: 'Asew n waman yemkulen yettɛawan ad yeqqes uḥulfu n uẓeṭṭa.'},
      {title: 'Asnimlal', text: 'Asnimlal aṭuṭṭu ɣef uda n ddaw n uɣerrus yettɛawan ad tsenfseleḍ.'},
    ],
    section3Text: 'Ma yella lweǧɛ ur k-yeǧǧa ara ad tettidireḍ s wudem amagnu yal aggur ɣas ma tesseqdceḍ tifrat-a, yelha ad temmeslayeḍ d umaẓrag n ṣṣeḥḥa.',
    alertTitle: 'Wali aṭṭbib ma',
    alertText: 'Lweǧɛ yeqwan aṭas, aḥraf ameqqran n idammen, ɣeṛ-i leɛyaṭ ameqqran neɣ tilɣa ur nelli ara d tiɣelnawin.',
    dailyTips: [
      'Sidid ugris-ik s wudem ahlawan mi ara tkecmeḍ',
      'Fren tuččit yemmendad',
      'Eǧǧ lweqt i wanfas d unfusel',
      'Ḍfer ddawra-inek i wakken ad tfehmeḍ ugar lweǧɛ-ik',
    ],
    shareMessage: 'Aɣbel n lweǧɛ n tiregwa — AWA',
  },
  om: {
    badge: 'DHUKKUBBII',
    title: 'Dhukkubbii laguu\nto\'achuu',
    metaDuration: 'Daqiiqaa 7 dubbisuu',
    metaType: 'Qajeelfama',
    metaLevel: 'Eegaltoota',
    metaValidated: 'Qabiyyee madaalame',
    intro: 'Ho\'a, sochii laafaa, nyaata: gochaan dhugumaan bu\'aa qabu.',
    contentsTitle: 'Barruu kana keessatti',
    topics: [
      'Dhukkubbii laguu hubachuu',
      'Furmaatawwan uumamaa bu\'aa qaban',
      'Yoom doktora argu qabda?',
      'Gorsa hojii guyyaa guyyaa',
    ],
    section1Text: 'Dhukkubbiin garaa (cramps) dhaabaa garaa (uterus) cinqaa fi qaama keessaa baasuuf gargaaru irraa dhufa. Prostaglandin irraa kan maddan dha. Qaamni hundi garaagara deebisa.',
    tip1Title: 'Beekuun gaarii dha',
    tip1Text: 'Dhukkubbiin marsaa tokko irraa gara marsaa biraatti garaagara ta\'uu danda\'a, yeroo hunda wal-fakkaata miti.',
    solutions: [
      {title: 'Ho\'a', text: 'Bunbuqqaa bishaan ho\'aa garaa gadii irra kaa\'uun maashaa laaffisuu danda\'a.'},
      {title: 'Sochii laafaa', text: 'Yoga, harcaasuu fi adeemsa laafaa dhiphina hir\'isa.'},
      {title: 'Nyaata', text: 'Magnesium, omega-3 fi nyaata dhukkubbii/bufaa hir\'isu.'},
      {title: 'Bishaan dhuguu', text: 'Bishaan gahaa dhuguun garaa bobbaa\'uu hir\'isuuf ni gargaara.'},
      {title: 'Maasaajii', text: 'Maasaajii geengoo garaa gadii irratti raawwatamu laaffachuuf si gargaara.'},
    ],
    section3Text: 'Yoo furmaata kanneen jiraatanillee dhukkubbiin ji\'a ji\'aan jireenya baratamaa akka hin jiraanne si gufachiise, ogeessa fayyaa waliin dubbachuun barbaachisaa dha.',
    alertTitle: 'Doktora argi yoo',
    alertText: 'Dhukkubbii baay\'ee cimaa, dhiigni baay\'ee, dadhabbii cimaa, ykn mallattoo hin baratamne.',
    dailyTips: [
      'Ganama yeroo dhaabbattu qaama kee suutuma ho\'isi',
      'Nyaata madaalawaa filadhu',
      'Afuufuu fi boqonnaa fudhachuuf yeroo kenni',
      'Dhukkubbii kee gaarittii hubachuuf marsaa kee hordofi',
    ],
    shareMessage: 'Dhukkubbii laguu to\'achuu — AWA',
  },
  ti: {
    badge: 'ቃንዛ',
    title: 'ናይ ወርሓዊ ዓደት\nቃንዛ ምሕዛል',
    metaDuration: '7 ደቒቕ ንባብ',
    metaType: 'መምርሒ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'ዝተገምገመ ትሕዝቶ',
    intro: 'ሙቐት፣ ለስሕ ምንቅስቓስ፣ ኣመጋግባ፦ ብሓቂ ዘዘሓሕሉ ልምድታት።',
    contentsTitle: 'ኣብዚ ጽሑፍ',
    topics: [
      'ቃንዛ ወርሓዊ ዓደት ምርዳእ',
      'ዕዉት ተፈጥሮኣዊ ፍታሓት',
      'ሓኪም መዓስ ትርእይ?',
      'ተግባራዊ መዓልታዊ ምኽሪታት',
    ],
    section1Text: 'ምጽባጥ ከብዲ ካብ ምጽባጥ ማህጸን ዝመጽእ እዩ፣ እቲ ዝተጸረገ ሕብሪ ማህጸን ንምውጻእ ዝሕግዝ። ብፕሮስታግላንዲን ዝመጽእ እዩ። ነፍሲ ወከፍ ኣካል ብዝተፈለየ ይምልስ።',
    tip1Title: 'ጽቡቕ ምፍላጥ',
    tip1Text: 'ቃንዛ ካብ ሓደ ዑደት ናብ ካልእ ክፈላለ ይኽእል፣ ኩሉ ግዜ ከኣ ሓደ ኣይኮነን።',
    solutions: [
      {title: 'ሙቐት', text: 'ኣብ ታሕተዋይ ከብዲ ዘሎ ሙቐት ማይ ዝሓዘ ከረጢት ጭዋዳታት ከዝሉ ይኽእል።'},
      {title: 'ለሳሕ ምንቅስቓስ', text: 'ዮጋ፣ ምስሓብን ቀሊል ምዕዋትን ጭንቀት የዘሉ።'},
      {title: 'ኣመጋግባ', text: 'ማግኒዚየም፣ ኦሜጋ-3ን ጸረ-ምቅጻል ዝኾኑ መግቢታትን።'},
      {title: 'ማይ ምስታይ', text: 'ብዕቱብ ማይ ምስታይ ምንፋሕ ከብዲ ክውሕድ ይሕግዝ።'},
      {title: 'ማሳጅ', text: 'ኣብ ታሕተዋይ ከብዲ ዝግበር ዙርያዊ ማሳጅ ንምዝላል ይሕግዝ።'},
    ],
    section3Text: 'ብዘሎ ፍታሓት እውን ቃንዛ ነፍሲ ወከፍ ወርሒ ብልሙድ ከይትነብር እንተዘይፈቒዱ፣ ምስ ጥዕና ሰራሕተኛ ምዝራብ ኣገዳሲ እዩ።',
    alertTitle: 'ሓኪም ርአ እንተ',
    alertText: 'ኣዝዩ ጽኑዕ ቃንዛ፣ ብዙሕ ደም ምፍሳስ፣ ዓቢ ድኻም፣ ወይ ዘይልሙድ ምልክታት።',
    dailyTips: [
      'ሰውነትካ ምስ ትትንስእ ቀስ ብቀስ ኣሙቕ',
      'ዝተመጣጠነ ኣመጋግባ ምረጽ',
      'ንምትንፋስን ንምዝላልን ግዜ ውሰድ',
      'ቃንዛኻ ብዝሓሸ ንምርዳእ ዑደትካ ተኸታተል',
    ],
    shareMessage: 'ናይ ወርሓዊ ዓደት ቃንዛ ምሕዛል — AWA',
  },
  rw: {
    badge: 'UBABABARE',
    title: 'Kwita ku bubabare\nbw’imihango',
    metaDuration: 'Isomwa mu minota 7',
    metaType: 'Inyigisho',
    metaLevel: 'Ugitangira',
    metaValidated: 'Ibikubiyemo byasuzumwe',
    intro: 'Ubushyuhe, kugenda byoroheje, indyo: imigenzo ifasha by’ukuri.',
    contentsTitle: 'Muri iyi nkuru',
    topics: [
      'Gusobanukirwa ububabare bw’imihango',
      'Ibisubizo bisanzwe bifasha',
      'Ni ryari ukwiye kujya kwa muganga?',
      'Inama zifatika za buri munsi',
    ],
    section1Text: 'Ububabare buturuka ku gukanda kwa nyababyeyi gufasha gusohora igice cy’imbere cyayo. Buterwa na prostaglandines. Buri mubiri wihariye uko witwara.',
    tip1Title: 'Ni byiza kubimenya',
    tip1Text: 'Ububabare bushobora gutandukana hagati y’ukwezi n’ukundi kandi ntibuhora ari bumwe.',
    solutions: [
      {title: 'Ubushyuhe', text: 'Icupa ry’amazi ashyushye ku nda yo hasi rishobora koroshya imikaya.'},
      {title: 'Kugenda byoroheje', text: 'Yoga, kurambura umubiri no kugenda gake bigabanya ububabare bw’imikaya.'},
      {title: 'Indyo', text: 'Magnésium, omega-3 n’ibiribwa birwanya ububyimbirwe.'},
      {title: 'Kunywa amazi', text: 'Kunywa amazi ahagije bifasha kugabanya inda yaguye.'},
      {title: 'Gukorera massage', text: 'Massage izengurutse ku nda yo hasi igufasha kworoherwa.'},
    ],
    section3Text: 'Niba ububabare bugutesha kubaho mu buryo busanzwe buri kwezi nubwo ukoresha ibi bisubizo, ni ngombwa kuvugana n’umuganga ushinzwe ubuzima.',
    alertTitle: 'Jya kwa muganga niba',
    alertText: 'Ububabare bukabije cyane, kuva amaraso menshi, kunanirwa gukabije, cyangwa ibimenyetso bidasanzwe.',
    dailyTips: [
      'Hindura umubiri wawe byoroheje ukangutse',
      'Hitamo indyo yuzuye',
      'Fata umwanya wo guhumeka no kworoha',
      'Kurikirana ukwezi kwawe kugira ngo usobanukirwe neza ububabare bwawe',
    ],
    shareMessage: 'Kwita ku bubabare bw’imihango — AWA',
  },
  rn: {
    badge: 'UBUBABARE',
    title: 'Kugenzura ububabare\nbw\'imihango',
    metaDuration: 'Soma muminuta 7',
    metaType: 'Inyoborabwenge',
    metaLevel: 'Intangiriro',
    metaValidated: 'Ibikorwa vyasuzumwe',
    intro: 'Ubushuhe, imyitozo yoroshe, ifunguro: ingeso zifasha koko.',
    contentsTitle: 'Muri iyi nkuru',
    topics: [
      'Gusobanukirwa ububabare bw\'imihango',
      'Ibisubizo bisanzwe bifasha',
      'Ni ryari wobona muganga?',
      'Impanuro zifatika za buri musi',
    ],
    section1Text: 'Ububabare buva ku gukanda kwa nyababyeyi gufasha gusohora ibiyiriho. Buterwa na prostaglandines. Umubiri wose uvyakira mu buryo butandukanye.',
    tip1Title: 'Ni vyiza kubimenya',
    tip1Text: 'Ububabare bushobora gutandukana hagati y\'uruzinduko n\'urundi kandi ntibuhora bumeze kimwe.',
    solutions: [
      {title: 'Ubushuhe', text: 'Icupa ry\'amazi ashushe ku nda yo hasi rirashobora gutuma imikaya iruhuka.'},
      {title: 'Imyitozo yoroshe', text: 'Yoga, kurambura umubiri no kugenda buhoro bigabanya umuhangayiko w\'imikaya.'},
      {title: 'Ifunguro', text: 'Magnésium, omega-3 n\'ibiryo bigabanya ukubyimba.'},
      {title: 'Kunywa amazi', text: 'Kunywa amazi ahagije bifasha kugabanya inda ibyimbye.'},
      {title: 'Gukanda', text: 'Gukanda mu buryo bw\'uruziga ku nda yo hasi bifasha kuruhuka.'},
    ],
    section3Text: 'Niba ububabare bukubuza kubaho bisanzwe buri kwezi nubwo ukoresha ibi bisubizo, ni ngirakamaro kuvugana n\'umuhanga mu buvuzi.',
    alertTitle: 'Raba muganga iyo',
    alertText: 'Ububabare bukomeye cane, kuva amaraso menshi, umunaniro ukabije, canke ibimenyetso bidasanzwe.',
    dailyTips: [
      'Shushisha umubiri wawe buhoro iyo ubyutse',
      'Hitamwo ifunguro rirangwa n\'uburinganire',
      'Fata igihe cyo guhumeka no kuruhuka',
      'Kurikirana uruzinduko rwawe kugira ngo umenye neza ububabare bwawe',
    ],
    shareMessage: 'Kugenzura ububabare bw\'imihango — AWA',
  },
  ig: {
    badge: 'MGBU',
    title: 'Ijikwa mgbu\nnsọ ọnwa',
    metaDuration: 'Nkeji 7 iji gụọ',
    metaType: 'Ntụziaka',
    metaLevel: 'Mbido',
    metaValidated: 'Ọdịnaya e nyochaworo',
    intro: 'Ọkụ, mmegharị dị nwayọọ, nri: omume na-enye ahụ ike n\'ezie.',
    contentsTitle: 'N\'edemede a',
    topics: [
      'Ịghọta mgbu nsọ ọnwa',
      'Ngwọta okike dị irè',
      'Mgbe ị kwesịrị ịhụ dọkịta?',
      'Ndụmọdụ bara uru kwa ụbọchị',
    ],
    section1Text: 'Cramps na-esite n\'nkwekọrịta akpa nwa nke na-enyere aka wepụ akpụkpọ akpa nwa. Prostaglandins na-akpata ha. Ahụ ọ bụla na-eme ihe dị iche.',
    tip1Title: 'Ọ dị mma ịmara',
    tip1Text: 'Mgbu nwere ike ịdị iche site n\'okirikiri gaa n\'okirikiri ma adịghị mgbe niile otu.',
    solutions: [
      {title: 'Ọkụ', text: 'Karama mmiri ọkụ n\'elu afọ ala gị nwere ike ime ka akwara dị nwayọọ.'},
      {title: 'Mmegharị dị nwayọọ', text: 'Yoga, ịgbatị ahụ, na ije ije dị mfe na-ebelata nrụgide.'},
      {title: 'Nri', text: 'Magnesium, omega-3, na nri na-egbochi mbufụt.'},
      {title: 'Ịṅụ mmiri', text: 'Ịṅụ mmiri zuru ezu na-enyere aka belata afọ ufe.'},
      {title: 'Ịsa ahụ', text: 'Ịsa ahụ n\'okirikiri n\'elu afọ ala gị na-enyere gị aka ịdị nwayọọ.'},
    ],
    section3Text: 'Ọ bụrụ na mgbu na-egbochi gị ibi ndụ nkịtị kwa ọnwa n\'agbanyeghị ngwọta ndị a, ọ dị mkpa ịgwa onye ọrụ ahụike okwu.',
    alertTitle: 'Hụ dọkịta ma ọ bụrụ na',
    alertText: 'Mgbu dị oke njọ, ọbara na-asọ nke ukwuu, ike ọgwụgwụ dị oke njọ, ma ọ bụ afọ ndị na-adịghị nkịtị.',
    dailyTips: [
      'Kpo ahụ gị ọkụ nwayọọ mgbe ị tetara',
      'Họrọ nri nwere nguzozi',
      'Were oge kuo ume ma zuru ike',
      'Soro okirikiri gị ka ị ghọta mgbu gị nke ọma',
    ],
    shareMessage: 'Ijikwa mgbu nsọ ọnwa — AWA',
  },
  yo: {
    badge: 'ÌRORA',
    title: 'Ṣíṣàkóso ìrora\nnǹkan oṣù',
    metaDuration: 'Ìṣẹ́jú 7 láti kà',
    metaType: 'Ìtọ́sọ́nà',
    metaLevel: 'Fún àwọn tuntun',
    metaValidated: 'Àkóónú tí a ti yẹ̀wò',
    intro: 'Ooru, ìṣípòpadà pẹ̀lẹ́, oúnjẹ: àwọn àṣà tó ń mú ìtura wá tòótọ́.',
    contentsTitle: 'Nínú àpilẹ̀kọ yìí',
    topics: [
      'Òye ìrora nǹkan oṣù',
      'Àwọn ojútùú àdánidá tó múná dóko',
      'Ìgbà wo ni o yẹ kí o rí dókítà?',
      'Àwọn ìmọ̀ràn tó wúlò lójoojúmọ́',
    ],
    section1Text: 'Ìrora inú (cramps) wá láti ìfàmọ́ra ilé ọmọ tó ń ràn án lọ́wọ́ láti ta awọ inú rẹ̀ sílẹ̀. Prostaglandins ni ó ń fà á. Ara kọ̀ọ̀kan ń dáhùn lọ́nà tó yàtọ̀.',
    tip1Title: 'Ó dára láti mọ̀',
    tip1Text: 'Ìrora lè yàtọ̀ láti ìyípo kan sí òmíràn, kì í sì í jẹ́ kan náà nígbà gbogbo.',
    solutions: [
      {title: 'Ooru', text: 'Ìgò omi gbígbóná lórí ìsàlẹ̀ ikùn rẹ lè mú kí àwọn iṣan sinmi.'},
      {title: 'Ìṣípòpadà pẹ̀lẹ́', text: 'Yoga, nína ara, àti rírìn díẹ̀ ń mú ìfúnpá iṣan kúrò.'},
      {title: 'Oúnjẹ', text: 'Magnesium, omega-3, àti àwọn oúnjẹ tó ń dín ìgbóná ara kù.'},
      {title: 'Mímu omi', text: 'Mímu omi tó tó ń ṣèrànwọ́ láti dín ìwú ikùn kù.'},
      {title: 'Ìfọwọ́pa', text: 'Ìfọwọ́pa oníyípo lórí ìsàlẹ̀ ikùn rẹ ń ràn ọ́ lọ́wọ́ láti sinmi.'},
    ],
    section3Text: 'Tí ìrora náà bá ń dá ọ dúró láti gbé ìgbésí ayé déédéé ní oṣooṣù láìka àwọn ojútùú wọ̀nyí sí, ó ṣe pàtàkì láti bá ọ̀jọ̀gbọ́n ìlera sọ̀rọ̀.',
    alertTitle: 'Rí dókítà tí',
    alertText: 'Ìrora tó le gan-an, ẹ̀jẹ̀ tó pọ̀, àárẹ̀ tó pọ̀ gan-an, tàbí àwọn àmì àìtọ́.',
    dailyTips: [
      'Mú ara rẹ gbóná díẹ̀ pẹ̀lẹ́ nígbà tí o bá jí',
      'Fẹ́ràn oúnjẹ tó ní ìwọ̀ntúnwọ̀nsì',
      'Gba àkókò láti mí kí o sì sinmi',
      'Tọpinpin ìyípo oṣù rẹ láti lóye ìrora rẹ dáadáa',
    ],
    shareMessage: 'Ṣíṣàkóso ìrora nǹkan oṣù — AWA',
  },
  zu: {
    badge: 'UBUHLUNGU',
    title: 'Ukuphatha ubuhlungu\nbesikhathi',
    metaDuration: 'Imizuzu emi-7 yokufunda',
    metaType: 'Umhlahlandlela',
    metaLevel: 'Abaqalayo',
    metaValidated: 'Okuphawulwe ngochwepheshe',
    intro: 'Ukushisa, ukunyakaza okuthambile, ukudla: imikhuba ekhulula ngempela.',
    contentsTitle: 'Kulesi sihloko',
    topics: [
      'Ukuqonda ubuhlungu besikhathi',
      'Izixazululo zemvelo ezisebenzayo',
      'Isikhathi sokubona udokotela?',
      'Amathiphu asebenzayo ansuku zonke',
    ],
    section1Text: 'Ukuqunjelwa kuvela ekuncipheni kwesibeletho okusiza ukukhipha ungqimba lwesibeletho. Kubangelwa ama-prostaglandin. Umzimba ngamunye uphendula ngendlela ehlukile.',
    tip1Title: 'Kuhle ukwazi',
    tip1Text: 'Ubuhlungu bungahluka kusuka emjikelezweni oya komunye futhi abuhlali bufana njalo.',
    solutions: [
      {title: 'Ukushisa', text: 'Isikhwama samanzi ashisayo esiswini sakho esiphansi singadambisa imisipha.'},
      {title: 'Ukunyakaza okuthambile', text: 'I-yoga, ukwelula nokuhamba okulula kunciphisa ukuqina komzimba.'},
      {title: 'Ukudla', text: 'I-magnesium, ama-omega-3 nokudla okulwa nokuvuvukala.'},
      {title: 'Ukuphuza amanzi', text: 'Ukuphuza amanzi anele kusiza ukunciphisa ukuvuvukala kwesisu.'},
      {title: 'Ukuthinta ngamandla', text: 'Ukuthinta isisu sakho esiphansi ngokuzungeza kukusiza uphumule.'},
    ],
    section3Text: 'Uma ubuhlungu bukuvimbela ukuphila kahle njalo ngenyanga naphezu kwalezi zixazululo, kubalulekile ukukhuluma nochwepheshe wezempilo.',
    alertTitle: 'Bona udokotela uma',
    alertText: 'Ubuhlungu obukhulu kakhulu, ukopha okukhulu, ukukhathala okukhulu, noma izimpawu ezingajwayelekile.',
    dailyTips: [
      'Fudumeza umzimba wakho kancane uma uvuka',
      'Khetha ukudla okulinganiselayo',
      'Thatha isikhathi sokuphefumula nokuphumula',
      'Landelela umjikelezo wakho ukuze uqonde kangcono ubuhlungu bakho',
    ],
    shareMessage: 'Ukuphatha ubuhlungu besikhathi — AWA',
  },
  xh: {
    badge: 'UBUHLUNGU',
    title: 'Ukulawula ubuhlungu\nbexesha lenyanga',
    metaDuration: 'Imizuzu eyi-7 yokufunda',
    metaType: 'Isikhokelo',
    metaLevel: 'Abaqalayo',
    metaValidated: 'Umxholo ohlaziyiweyo',
    intro: 'Ubushushu, intshukumo ethambileyo, ukutya: izinto eziqhelekileyo ezinika ukukhululeka kwenene.',
    contentsTitle: 'Kweli nqaku',
    topics: [
      'Ukuqonda ubuhlungu bexesha lenyanga',
      'Izisombululo zendalo ezisebenzayo',
      'Xa kufuneka ubone igqirha?',
      'Iingcebiso ezisebenzayo zemihla ngemihla',
    ],
    section1Text: 'Ukuqaqamba kwesisu kuvela ekuncineni kwesibeleko okunceda ukukhupha ulwelo lwesibeleko. Kubangelwa yi-prostaglandins. Umzimba ngamnye uphendula ngokwahlukileyo.',
    tip1Title: 'Kulungile ukwazi',
    tip1Text: 'Ubuhlungu bunokwahluka phakathi komjikelo nomnye kwaye abuhlali bufana.',
    solutions: [
      {title: 'Ubushushu', text: 'Ibhotile yamanzi ashushu esiswini sakho esisezantsi inokukhulula imisipha.'},
      {title: 'Intshukumo ethambileyo', text: 'Iyoga, ukolula, nokuhamba ngokukhanyayo kukhulula uxinzelelo.'},
      {title: 'Ukutya', text: 'I-magnesium, i-omega-3, nokutya okulwa ukuvuvukala.'},
      {title: 'Ukuseza amanzi', text: 'Ukusela amanzi anele kunceda ukunciphisa ukuqumba.'},
      {title: 'Ukuxova', text: 'Ukuxova ngokujikeleza esiswini sakho esisezantsi kukunceda ukukhululeka.'},
    ],
    section3Text: 'Ukuba ubuhlungu bukuthintela ukuphila ngokuqhelekileyo inyanga nenyanga naxa usebenzisa ezi zisombululo, kubalulekile ukuthetha nechwephesha lezempilo.',
    alertTitle: 'Bona igqirha ukuba',
    alertText: 'Ubuhlungu obukhulu kakhulu, ukopha okuninzi, ukudinwa okugqithisileyo, okanye iimpawu ezingaqhelekanga.',
    dailyTips: [
      'Fudumeza umzimba wakho ngobunono xa ubuka',
      'Khetha ukutya okulinganisiweyo',
      'Thatha ixesha lokuphefumla nokukhululeka',
      'Landela umjikelo wakho ukuze uqonde ngcono ubuhlungu bakho',
    ],
    shareMessage: 'Ukulawula ubuhlungu bexesha lenyanga — AWA',
  },
  sn: {
    badge: 'MARWADZO',
    title: 'Kubata marwadzo\nekuenda kumwedzi',
    metaDuration: 'Maminitsi 7 ekuverenga',
    metaType: 'Gwara',
    metaLevel: 'Vanotanga',
    metaValidated: 'Zvakaongororwa',
    intro: 'Kupisa, kufamba zvakapfava, zvokudya: maitiro anopa runyararo chaiyo.',
    contentsTitle: 'Mudzidziso uyu',
    topics: [
      'Kunzwisisa marwadzo ekuenda kumwedzi',
      'Mhinduro dzakasikwa dzinobatsira',
      'Painofanira kuona chiremba?',
      'Mazano anobatsira ezuva nezuva',
    ],
    section1Text: 'Cramps dzinobva mukudhonzwa kwechibereko kunobatsira kubudisa mukati mechibereko. Dzinokonzerwa neprostaglandins. Muviri wega wega unopindura zvakasiyana.',
    tip1Title: 'Zvakanaka kuziva',
    tip1Text: 'Marwadzo anogona kusiyana kubva pacycle imwe kuenda kune imwe uye haana kufanana nguva dzose.',
    solutions: [
      {title: 'Kupisa', text: 'Bhodhoro remvura inopisa pazasi pedumbu rinogona kuzorodza nyama.'},
      {title: 'Kufamba zvakapfava', text: 'Yoga, kutambanudza uye kufamba zvakareruka zvinoderedza kusimba kwenyama.'},
      {title: 'Zvokudya', text: 'Magnesium, omega-3 nezvokudya zvinodzikamisa kuzvimba.'},
      {title: 'Kunwa mvura', text: 'Kunwa mvura inokwana kunobatsira kudzikamisa kuzvimba kwedumbu.'},
      {title: 'Kukuya', text: 'Kukuya nenzira yedenderedzwa pazasi pedumbu kunobatsira kuzorora.'},
    ],
    section3Text: 'Kana marwadzo achikudzivisa kurarama zvakajairika mwedzi wega wega kunyange uchishandisa mhinduro idzi, zvakakosha kutaura nemushandi wezvehutano.',
    alertTitle: 'Ona chiremba kana',
    alertText: 'Marwadzo akanyanya, kubuda ropa kwakawanda, kuneta kwakanyanya, kana zviratidzo zvisina kujairika.',
    dailyTips: [
      'Pisa muviri wako zvakapfava paunomuka',
      'Sarudza kudya zvakaringana',
      'Tora nguva yekufema nekuzorora',
      'Nyora cycle yako kuti unzwisise marwadzo ako zvirinani',
    ],
    shareMessage: 'Kubata marwadzo ekuenda kumwedzi — AWA',
  },
  ln: {
    badge: 'MPASI',
    title: 'Kobatela mpasi\nya sanza',
    metaDuration: 'Mwa mokapo ya kotánga: 7 min',
    metaType: 'Mokanda ya litambwisi',
    metaLevel: 'Mobandi',
    metaValidated: 'Maloba etalelami',
    intro: 'Molunge, mouvement ya pɛtɛɛ, bilei: momeseno oyo esalisaka solo.',
    contentsTitle: 'Na lisolo oyo',
    topics: [
      'Koyeba mpasi ya sanza',
      'Banzela ya bomoi oyo esalisaka',
      'Ntango nini kokende epai ya monganga?',
      'Toli ya mosala ya mokolo na mokolo',
    ],
    section1Text: 'Mpasi ya libumu euti na kokanga ya libumu oyo esalisaka kobimisa mpoto ya libumu. Esalemi na prostaglandine. Nzoto moko na moko eyanolaka ndenge na yango.',
    tip1Title: 'Eloko ya malamu koyeba',
    tip1Text: 'Mpasi ekoki kokesena uta cycle na cycle mpe ezali ntango nyonso se bongo te.',
    solutions: [
      {title: 'Molunge', text: 'Botɛlɛmɛ ya mai ya molunge na libumu ya nse ekoki kopesa misisa bopɛtɛɛ.'},
      {title: 'Mouvement ya pɛtɛɛ', text: 'Yoga, kolongola nzoto mpe kotambola mayɔkɔ ekitisaka mpasi.'},
      {title: 'Bilei', text: 'Magnezium, omega-3 mpe bilei oyo ekitisaka bolembu ya nzoto.'},
      {title: 'Komela mai', text: 'Komela mai ya kokoka esalisaka kokitisa libumu oyo etondi mopɛpɛ.'},
      {title: 'Kosukola nzoto', text: 'Kosukola libumu ya nse na ndenge ya zinga zinga esalisaka na kopema malamu.'},
    ],
    section3Text: 'Soki mpasi ekangi yo kozala na bomoi ya kawaida sanza nyonso atako osali banzela oyo, ezali ntina koloba na mosali ya mayele.',
    alertTitle: 'Kende epai ya monganga soki',
    alertText: 'Mpasi makasi mingi, makila mingi, bolembu makasi, to bilembo ya ndenge mosusu.',
    dailyTips: [
      'Pɛtɛla nzoto na yo mayɔkɔ ntango ozali kolamuka',
      'Pona bilei oyo ebongi',
      'Zwa ntango ya kopema mpe kopɛtɛla',
      'Landa cycle na yo mpo na koyeba malamu mpasi na yo',
    ],
    shareMessage: 'Kobatela mpasi ya sanza — AWA',
  },
  ff: {
    badge: 'MUUSI',
    title: 'Reentugo muusi\nmenstruation',
    metaDuration: 'Janngugo 7 miniti',
    metaType: 'Ɗerewol',
    metaLevel: 'Fuɗɗoode',
    metaValidated: 'Ko ƴetti ndaarol',
    intro: 'Ɗuɗɗe, yaadu ɓolliiɗum, ñaamdu: kuuɗe nafata ma no feewi.',
    contentsTitle: 'Nder ɗerewol ndin',
    topics: [
      'Faamugo muusi menstruation',
      'Safrirɗe jibinaaɗe nafataaɗe',
      'Saa ngoye ma ndaara doktoor?',
      'Anndinki nafoojum ñalnde kala',
    ],
    section1Text: 'Muusi reedu yaaɗi ko tiiɗnugo bandu reedu ngam yaltinugo ko hakkunde mayri. Prostaglandin woni sabaabu. Bandu kala wayyan feere.',
    tip1Title: 'Ko mari njoɓdi',
    tip1Text: 'Muusi waawi wayyude hakkunde cycle e cycle, naa kala ko nanndi.',
    solutions: [
      {title: 'Ɗuɗɗe', text: 'Ndiyam ɗuɗɗam nder tubaaki dow reedu ma waawi hoosnugo ɓoggol ɗin.'},
      {title: 'Yaadu ɓolliiɗum', text: 'Yoga, caɗugo, e yahugo ɓolliiɗum ɗum hoosnan tiiɗɗam.'},
      {title: 'Ñaamdu', text: 'Magnesium, omega-3 e ñaamdu ɗin haɗan wayrude.'},
      {title: 'Yoɓugo ndiyam', text: 'Yoɓugo ndiyam hanki wallan haɗugo reedu ɗam ɗiɗi.'},
      {title: 'Massage', text: 'Massage hoore reedu cakkol e feeɗugo waawi wallugo hoosugo.'},
    ],
    section3Text: 'Si muusi haɗi ma yiɗugo ñalnde kala lebbi kala hay so safrirɗe ɗin ngaɗaama, ɗum ɓuri nafugo haalugo e goɗɗo anndiiɗo.',
    alertTitle: 'Ƴam doktoor si',
    alertText: 'Muusi tiiɗɗi no feewi, yiiɗam ɗuuɗam, tiiɗɗam nyaanga, walla alamaaji yiɗaaki.',
    dailyTips: [
      'Ɗuɗ bandu ma ɓolliiɗum saa ma finii',
      'Suɓtu ñaamdu hanaande',
      'Hokku wakkati ngam heftugo hakkilo e hoosugo',
      'Winndu cycle maaɗa ngam faamugo muusi maaɗa ɓuri',
    ],
    shareMessage: 'Reentugo muusi menstruation — AWA',
  },
  id: {
    badge: 'NYERI',
    title: 'Mengatasi\nnyeri haid',
    metaDuration: '7 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Kehangatan, gerakan lembut, pola makan: kebiasaan yang benar-benar meredakan nyeri.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Memahami nyeri haid',
      'Solusi alami yang efektif',
      'Kapan harus ke dokter?',
      'Tips praktis sehari-hari',
    ],
    section1Text: 'Kram berasal dari kontraksi rahim yang membantu meluruhkan lapisan dinding rahim. Kram ini disebabkan oleh prostaglandin. Setiap tubuh bereaksi secara berbeda.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Nyeri bisa berbeda dari satu siklus ke siklus berikutnya dan tidak selalu sama.',
    solutions: [
      {
        title: 'Kehangatan',
        text: 'Botol air panas di perut bagian bawah dapat merelaksasi otot.',
      },
      {
        title: 'Gerakan lembut',
        text: 'Yoga, peregangan, dan jalan kaki ringan meredakan ketegangan.',
      },
      {
        title: 'Pola makan',
        text: 'Magnesium, omega-3, dan makanan antiradang.',
      },
      {
        title: 'Asupan air',
        text: 'Minum air yang cukup membantu mengurangi kembung.',
      },
      {
        title: 'Pijat',
        text: 'Pijatan melingkar di perut bagian bawah membantumu rileks.',
      },
    ],
    section3Text: 'Jika nyeri membuatmu tidak bisa beraktivitas normal setiap bulan meski sudah mencoba solusi-solusi ini, penting untuk berbicara dengan tenaga kesehatan.',
    alertTitle: 'Temui dokter jika',
    alertText: 'Nyeri yang sangat hebat, perdarahan deras, kelelahan ekstrem, atau gejala yang tidak biasa.',
    dailyTips: [
      'Hangatkan tubuhmu dengan lembut saat bangun tidur',
      'Utamakan pola makan seimbang',
      'Luangkan waktu untuk bernapas dan rileks',
      'Catat siklusmu agar lebih memahami nyerimu',
    ],
    shareMessage: 'Mengatasi nyeri haid — AWA',
  },
  hi: {
    badge: 'दर्द',
    title: 'पीरियड के दर्द\nको संभालना',
    metaDuration: '7 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'जाँची गई जानकारी',
    intro: 'गर्मी, हल्की हरकत, खान-पान: ऐसी आदतें जो सचमुच आराम देती हैं।',
    contentsTitle: 'इस लेख में',
    topics: [
      'पीरियड के दर्द को समझें',
      'असरदार प्राकृतिक उपाय',
      'डॉक्टर को कब दिखाएँ?',
      'रोज़ के काम के सुझाव',
    ],
    section1Text: 'ऐंठन गर्भाशय के संकुचन से होती है, जो गर्भाशय की परत को बाहर निकालने में मदद करते हैं। इसका कारण प्रोस्टाग्लैंडिन हैं। हर शरीर अलग तरह से प्रतिक्रिया करता है।',
    tip1Title: 'जानना अच्छा रहेगा',
    tip1Text: 'दर्द एक चक्र से दूसरे चक्र में बदल सकता है और हमेशा एक जैसा नहीं होता।',
    solutions: [
      {
        title: 'गर्मी',
        text: 'पेट के निचले हिस्से पर गर्म पानी की बोतल से सेंक मांसपेशियों को आराम दे सकता है।',
      },
      {
        title: 'हल्की हरकत',
        text: 'योग, स्ट्रेचिंग और हल्की सैर तनाव कम करते हैं।',
      },
      {
        title: 'खान-पान',
        text: 'मैग्नीशियम, ओमेगा-3 और सूजन कम करने वाले खाद्य पदार्थ।',
      },
      {
        title: 'पानी पीना',
        text: 'पर्याप्त पानी पीने से पेट फूलना कम करने में मदद मिलती है।',
      },
      {
        title: 'मालिश',
        text: 'पेट के निचले हिस्से पर गोल-गोल मालिश करने से आराम मिलता है।',
      },
    ],
    section3Text: 'अगर इन उपायों के बावजूद दर्द हर महीने आपको सामान्य ढंग से जीने नहीं देता, तो किसी स्वास्थ्य विशेषज्ञ से बात करना ज़रूरी है।',
    alertTitle: 'इन स्थितियों में डॉक्टर को दिखाएँ',
    alertText: 'बहुत तेज़ दर्द, ज़्यादा रक्तस्राव, बहुत ज़्यादा थकान, या असामान्य लक्षण।',
    dailyTips: [
      'सुबह उठकर शरीर को धीरे-धीरे गर्म करें',
      'संतुलित आहार को प्राथमिकता दें',
      'साँस लेने और आराम करने के लिए समय निकालें',
      'अपने दर्द को बेहतर समझने के लिए अपना चक्र ट्रैक करें',
    ],
    shareMessage: 'पीरियड के दर्द को संभालना — AWA',
  },
  sq: {
    badge: 'DHIMBJA',
    title: 'Menaxhimi i dhimbjes\nmenstruale',
    metaDuration: '7 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Nxehtësia, lëvizja e butë, ushqimi: zakone që sjellin vërtet lehtësim.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Kuptimi i dhimbjes menstruale',
      'Zgjidhje natyrale efektive',
      'Kur duhet të shkosh te mjeku?',
      'Këshilla praktike të përditshme',
    ],
    section1Text: 'Krambat vijnë nga tkurrjet e mitrës që ndihmojnë në heqjen e shtresës së mitrës. Ato shkaktohen nga prostaglandinat. Çdo trup reagon ndryshe.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Dhimbja mund të ndryshojë nga një cikël te tjetri dhe nuk është gjithmonë e njëjtë.',
    solutions: [
      {
        title: 'Nxehtësia',
        text: 'Një shishe me ujë të nxehtë mbi barkun e poshtëm mund t’i relaksojë muskujt.',
      },
      {
        title: 'Lëvizja e butë',
        text: 'Yoga, shtrirja dhe ecja e lehtë lehtësojnë tensionin.',
      },
      {
        title: 'Ushqimi',
        text: 'Magnez, omega-3 dhe ushqime kundër inflamacionit.',
      },
      {
        title: 'Hidratimi',
        text: 'Të pirët e mjaftueshëm ujë ndihmon të kufizohet fryrja.',
      },
      {
        title: 'Masazhi',
        text: 'Një masazh rrethor mbi barkun e poshtëm të ndihmon të relaksohesh.',
      },
    ],
    section3Text: 'Nëse dhimbja të pengon të jetosh normalisht çdo muaj pavarësisht këtyre zgjidhjeve, është e rëndësishme të flasësh me një profesionist të shëndetësisë.',
    alertTitle: 'Shko te mjeku nëse',
    alertText: 'Dhimbje shumë të forta, gjakderdhje të bollshme, lodhje ekstreme ose simptoma jonormale.',
    dailyTips: [
      'Ngrohe trupin butësisht kur zgjohesh',
      'Zgjidh një ushqyerje të ekuilibruar',
      'Merr kohë për të marrë frymë dhe për t’u relaksuar',
      'Ndiq ciklin tënd për ta kuptuar më mirë dhimbjen',
    ],
    shareMessage: 'Menaxhimi i dhimbjes menstruale — AWA',
  },
  ja: {
    badge: '痛み',
    title: '生理痛との\n付き合い方',
    metaDuration: '読了7分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '監修済みの内容',
    intro: '温める、やさしく動く、食事。実際に楽になる習慣を紹介します。',
    contentsTitle: 'この記事の内容',
    topics: [
      '生理痛を理解する',
      '自然にできる効果的な対処法',
      '医師に相談するタイミングは？',
      '毎日に役立つヒント',
    ],
    section1Text: '生理痛は、子宮内膜をはがれ落とすために子宮が収縮することで起こります。原因はプロスタグランジンという物質です。体の反応は人それぞれです。',
    tip1Title: '知っておきたいこと',
    tip1Text: '痛みは周期ごとに変わることがあり、毎回同じとは限りません。',
    solutions: [
      {
        title: '温める',
        text: '下腹部に湯たんぽを当てると、筋肉がゆるむことがあります。',
      },
      {
        title: 'やさしく動く',
        text: 'ヨガ、ストレッチ、軽いウォーキングが、緊張をやわらげます。',
      },
      {
        title: '食事',
        text: 'マグネシウム、オメガ3、抗炎症作用のある食品をとりましょう。',
      },
      {
        title: '水分補給',
        text: '十分に水を飲むと、むくみをおさえやすくなります。',
      },
      {
        title: 'マッサージ',
        text: '下腹部を円を描くようにマッサージすると、リラックスできます。',
      },
    ],
    section3Text: 'こうした対処法を試しても、毎月の痛みで普段どおりの生活が送れない場合は、医療従事者に相談することが大切です。',
    alertTitle: '次のようなときは医師に相談を',
    alertText: 'とても強い痛み、出血量が多い、ひどい疲れ、いつもと違う症状。',
    dailyTips: [
      '朝起きたら、体をやさしく温める',
      'バランスのよい食事を心がける',
      '呼吸を整えて、リラックスする時間をとる',
      '周期を記録して、痛みへの理解を深める',
    ],
    shareMessage: '生理痛との付き合い方 — AWA',
  },
  ko: {
    badge: '통증',
    title: '생리통\n관리하기',
    metaDuration: '7분 읽기',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '따뜻한 찜질, 가벼운 움직임, 식단. 실제로 통증을 덜어 주는 습관이에요.',
    contentsTitle: '이 아티클에서는',
    topics: [
      '생리통 이해하기',
      '효과적인 자연 요법',
      '언제 의사에게 진료받아야 할까요?',
      '일상에서 쓰는 실용적인 팁',
    ],
    section1Text: '생리통은 자궁 내막이 떨어져 나가도록 돕는 자궁 수축 때문에 생겨요. 원인은 프로스타글란딘이에요. 몸마다 반응이 달라요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '통증은 주기마다 다를 수 있고 항상 같지는 않아요.',
    solutions: [
      {
        title: '온기',
        text: '아랫배에 따뜻한 물주머니를 올려 두면 근육이 풀릴 수 있어요.',
      },
      {
        title: '가벼운 움직임',
        text: '요가, 스트레칭, 가벼운 걷기는 긴장을 풀어 줘요.',
      },
      {
        title: '식단',
        text: '마그네슘, 오메가3, 항염 식품이 도움이 돼요.',
      },
      {
        title: '수분 섭취',
        text: '물을 충분히 마시면 더부룩함을 줄이는 데 도움이 돼요.',
      },
      {
        title: '마사지',
        text: '아랫배를 둥글게 마사지하면 긴장을 푸는 데 도움이 돼요.',
      },
    ],
    section3Text: '이런 방법을 써도 매달 통증 때문에 평소처럼 생활하기 어렵다면 의료 전문가와 상담하는 것이 중요해요.',
    alertTitle: '이럴 때는 의사에게 진료받으세요',
    alertText: '통증이 아주 심할 때, 출혈이 많을 때, 극심한 피로가 있을 때, 평소와 다른 증상이 있을 때.',
    dailyTips: [
      '아침에 일어나면 몸을 부드럽게 풀어 줘요',
      '균형 잡힌 식단을 챙겨요',
      '숨을 고르고 쉬는 시간을 가져요',
      '주기를 기록하면 통증을 더 잘 이해할 수 있어요',
    ],
    shareMessage: '생리통 관리하기 — AWA',
  },
  'pt-PT': {
    badge: 'DOR',
    title: 'Gerir a dor\nmenstrual',
    metaDuration: '7 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Calor, movimento suave, alimentação: hábitos que trazem verdadeiro alívio.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Compreender a dor menstrual',
      'Soluções naturais eficazes',
      'Quando consultar um médico?',
      'Dicas práticas para o dia a dia',
    ],
    section1Text: 'As cólicas resultam de contrações do útero que ajudam a eliminar o revestimento uterino. São causadas pelas prostaglandinas. Cada corpo reage de forma diferente.',
    tip1Title: 'Bom saber',
    tip1Text: 'A dor pode variar de um ciclo para o outro e nem sempre é igual.',
    solutions: [
      {
        title: 'Calor',
        text: 'Uma botija de água quente na parte inferior do abdómen pode relaxar os músculos.',
      },
      {
        title: 'Movimento suave',
        text: 'Ioga, alongamentos e caminhadas leves aliviam a tensão.',
      },
      {
        title: 'Alimentação',
        text: 'Magnésio, ómega-3 e alimentos anti-inflamatórios.',
      },
      {
        title: 'Hidratação',
        text: 'Beber água suficiente ajuda a limitar o inchaço.',
      },
      {
        title: 'Massagem',
        text: 'Uma massagem circular na parte inferior do abdómen ajuda a relaxar.',
      },
    ],
    section3Text: 'Se a dor a impede todos os meses de viver normalmente apesar destas soluções, é importante falar com um profissional de saúde.',
    alertTitle: 'Consulte um médico se',
    alertText: 'Tiver dor muito intensa, hemorragia abundante, cansaço extremo ou sintomas anormais.',
    dailyTips: [
      'Aqueça o corpo suavemente ao acordar',
      'Privilegie uma alimentação equilibrada',
      'Dedique tempo a respirar e a relaxar',
      'Acompanhe o seu ciclo para compreender melhor a sua dor',
    ],
    shareMessage: 'Gerir a dor menstrual — AWA',
  },
  bn: {
    badge: 'ব্যথা',
    title: 'মাসিকের ব্যথা\nসামলানো',
    metaDuration: 'পড়তে 7 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'তাপ, হালকা নড়াচড়া, খাদ্যাভ্যাস: যেসব অভ্যাস সত্যিই আরাম দেয়।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'মাসিকের ব্যথা বোঝা',
      'কার্যকর প্রাকৃতিক সমাধান',
      'কখন ডাক্তার দেখাবেন?',
      'প্রতিদিনের বাস্তব পরামর্শ',
    ],
    section1Text: 'তলপেটের ব্যথা হয় জরায়ুর সংকোচনের কারণে, যা জরায়ুর আস্তরণ ঝরিয়ে ফেলতে সাহায্য করে। এর কারণ প্রোস্টাগ্ল্যান্ডিন। প্রতিটি শরীর আলাদাভাবে সাড়া দেয়।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'ব্যথা এক চক্র থেকে আরেক চক্রে বদলাতে পারে এবং সবসময় একই রকম হয় না।',
    solutions: [
      {
        title: 'তাপ',
        text: 'তলপেটে গরম পানির ব্যাগ রাখলে পেশি শিথিল হতে পারে।',
      },
      {
        title: 'হালকা নড়াচড়া',
        text: 'যোগব্যায়াম, স্ট্রেচিং এবং হালকা হাঁটা টান কমায়।',
      },
      {
        title: 'খাদ্যাভ্যাস',
        text: 'ম্যাগনেশিয়াম, ওমেগা-3 এবং প্রদাহ-বিরোধী খাবার।',
      },
      {
        title: 'পানি পান',
        text: 'পর্যাপ্ত পানি পান করলে পেট ফাঁপা কমাতে সাহায্য হয়।',
      },
      {
        title: 'ম্যাসাজ',
        text: 'তলপেটে বৃত্তাকারে ম্যাসাজ করলে শিথিল হতে সাহায্য হয়।',
      },
    ],
    section3Text: 'এই সমাধানগুলো সত্ত্বেও যদি প্রতি মাসে ব্যথার কারণে স্বাভাবিকভাবে চলাফেরা করতে না পারেন, তাহলে একজন স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে কথা বলা গুরুত্বপূর্ণ।',
    alertTitle: 'ডাক্তার দেখান যদি',
    alertText: 'খুব তীব্র ব্যথা, অতিরিক্ত রক্তক্ষরণ, চরম ক্লান্তি অথবা অস্বাভাবিক উপসর্গ দেখা দেয়।',
    dailyTips: [
      'ঘুম থেকে উঠে শরীরকে আলতো করে গরম করে নিন',
      'সুষম খাদ্যাভ্যাসকে অগ্রাধিকার দিন',
      'শ্বাস নিতে ও শিথিল হতে সময় দিন',
      'নিজের ব্যথা আরও ভালোভাবে বুঝতে আপনার চক্র ট্র্যাক করুন',
    ],
    shareMessage: 'মাসিকের ব্যথা সামলানো — AWA',
  },
  da: {
    badge: 'SMERTER',
    title: 'Håndter dine\nmenstruationssmerter',
    metaDuration: '7 min læsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Varme, blid bevægelse, kost: de vaner der virkelig hjælper.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Forstå menstruationssmerter',
      'Effektive naturlige løsninger',
      'Hvornår bør du se en læge?',
      'Praktiske råd til hverdagen',
    ],
    section1Text: 'Smerter i underlivet skyldes livmoderkramper, der hjælper med at støde livmoderslimhinden af. Årsagen er prostaglandiner. Enhver krop reagerer forskelligt.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Smerterne kan variere fra cyklus til cyklus og er ikke altid ens.',
    solutions: [
      {
        title: 'Varme',
        text: 'En varmepude på underlivet kan hjælpe musklerne med at slappe af.',
      },
      {
        title: 'Blid bevægelse',
        text: 'Yoga, udstrækning og let gang kan lindre spændinger.',
      },
      {
        title: 'Kost',
        text: 'Magnesium, omega-3 og antiinflammatoriske fødevarer.',
      },
      {
        title: 'Væskeindtag',
        text: 'Tilstrækkeligt vandindtag hjælper med at mindske oppustethed.',
      },
      {
        title: 'Massage',
        text: 'Cirkulære massagebevægelser på underlivet fremmer afslapning.',
      },
    ],
    section3Text: 'Hvis du på trods af disse løsninger ikke kan fungere normalt på grund af smerter hver måned, er det vigtigt at tale med en sundhedsfaglig person.',
    alertTitle: 'Søg læge ved',
    alertText: 'Meget stærke smerter, kraftig blødning, ekstrem træthed eller usædvanlige symptomer.',
    dailyTips: [
      'Varm kroppen forsigtigt op om morgenen',
      'Prioriter en afbalanceret kost',
      'Tag tid til at trække vejret og slappe af',
      'Registrer din cyklus for bedre at forstå dine smerter',
    ],
    shareMessage: 'Håndter dine menstruationssmerter — AWA',
  },
  sv: {
    badge: 'SMERTER',
    title: 'Håndter dine\nmenstruationssmerter',
    metaDuration: '7 min läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Varme, blid bevägelse, kost: de vaner der virkelig hjälper.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Forstå menstruationssmerter',
      'Effektive naturlige lösninger',
      'Hvornår bör du se en läge?',
      'Praktiske råd till hverdagen',
    ],
    section1Text: 'Smerter i underlivet skyldes livmoderkramper, der hjälper med at stöde livmoderslimhinden av. Årsagen ar prostaglandiner. Enhver krop reagerer forskelligt.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Smerterne kan variere fran cyklus till cyklus och ar inte alltid ens.',
    solutions: [
      {
        title: 'Varme',
        text: 'En varmepude på underlivet kan hjälpe musklerne med at slappe av.',
      },
      {
        title: 'Blid bevägelse',
        text: 'Yoga, udsträkning och let gang kan lindre spändinger.',
      },
      {
        title: 'Kost',
        text: 'Magnesium, omega-3 och antiinflammatoriske födevarer.',
      },
      {
        title: 'Väskeindtag',
        text: 'Tilsträkkeligt vandindtag hjälper med at mindske oppustethed.',
      },
      {
        title: 'Massage',
        text: 'Cirkuläre massagebevägelser på underlivet fremmer afslapning.',
      },
    ],
    section3Text: 'Hvis du på trods av disse lösninger inte kan fungere normalt på grund av smartor hver måned, ar det vigtigt at tale med en halsasfaglig person.',
    alertTitle: 'Sög läge ved',
    alertText: 'Meget stärke smerter, kraftig blödning, ekstrem träthed eller usädvanlige symtom.',
    dailyTips: [
      'Varm kroppen forsigtigt op om morgenen',
      'Prioriter en afbalanceret kost',
      'Tag tid till at träkke vejret och slappe af',
      'Registrer din cyklus for bedre at forstå dina smerter',
    ],
    shareMessage: 'Håndter dina menstruationssmartor — AWA',
  },
  nb: {
    badge: 'SMERTE',
    title: 'Håndtere\nmenstruasjonssmerter',
    metaDuration: '7 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Varme, rolig bevegelse, kosthold: vaner som virkelig gir lindring.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Forstå menstruasjonssmerter',
      'Effektive naturlige løsninger',
      'Når bør du gå til lege?',
      'Praktiske tips for hverdagen',
    ],
    section1Text: 'Kramper skyldes sammentrekninger i livmoren som hjelper til å støte ut livmorslimhinnen. De forårsakes av prostaglandiner. Hver kropp reagerer forskjellig.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Smerten kan variere fra en syklus til den neste og er ikke alltid den samme.',
    solutions: [
      {title: 'Varme', text: 'En varmeflaske på nedre del av magen kan løse opp musklene.'},
      {title: 'Rolig bevegelse', text: 'Yoga, tøyning og lett gåing lindrer spenninger.'},
      {title: 'Kosthold', text: 'Magnesium, omega-3 og betennelsesdempende mat.'},
      {title: 'Væskeinntak', text: 'Å drikke nok vann bidrar til å begrense oppblåsthet.'},
      {title: 'Massasje', text: 'En sirkelformet massasje på nedre del av magen hjelper deg å slappe av.'},
    ],
    section3Text: 'Hvis smerten hindrer deg i å leve normalt hver måned til tross for disse løsningene, er det viktig å snakke med helsepersonell.',
    alertTitle: 'Gå til lege hvis',
    alertText: 'Svært sterke smerter, kraftig blødning, ekstrem tretthet eller unormale symptomer.',
    dailyTips: [
      'Varm opp kroppen forsiktig når du våkner',
      'Foretrekk et balansert kosthold',
      'Ta deg tid til å puste og slappe av',
      'Følg syklusen din for å forstå smertene dine bedre',
    ],
    shareMessage: 'Håndtere menstruasjonssmerter – AWA',
  },
  pl: {
    badge: 'BÓL',
    title: 'Jak radzić sobie\nz bólem miesiączkowym',
    metaDuration: '7 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Ciepło, delikatny ruch, dieta: nawyki, które naprawdę przynoszą ulgę.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Zrozumieć ból miesiączkowy',
      'Skuteczne naturalne sposoby',
      'Kiedy zgłosić się do lekarza?',
      'Praktyczne wskazówki na co dzień',
    ],
    section1Text: 'Skurcze wynikają z obkurczania się macicy, które pomaga usunąć błonę śluzową. Wywołują je prostaglandyny. Każde ciało reaguje inaczej.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Ból może się różnić w poszczególnych cyklach i nie zawsze jest taki sam.',
    solutions: [
      {title: 'Ciepło', text: 'Termofor na podbrzuszu może rozluźnić mięśnie.'},
      {title: 'Delikatny ruch', text: 'Joga, rozciąganie i lekkie spacery łagodzą napięcie.'},
      {title: 'Dieta', text: 'Magnez, kwasy omega-3 i produkty o działaniu przeciwzapalnym.'},
      {title: 'Nawodnienie', text: 'Picie odpowiedniej ilości wody pomaga ograniczyć wzdęcia.'},
      {title: 'Masaż', text: 'Okrężny masaż podbrzusza pomaga się odprężyć.'},
    ],
    section3Text: 'Jeśli mimo tych sposobów ból co miesiąc uniemożliwia Ci normalne funkcjonowanie, ważne jest, by porozmawiać z lekarzem lub innym specjalistą.',
    alertTitle: 'Zgłoś się do lekarza, jeśli',
    alertText: 'Ból jest bardzo silny, krwawienie obfite, zmęczenie skrajne lub pojawiają się nietypowe objawy.',
    dailyTips: [
      'Delikatnie rozgrzej ciało po przebudzeniu',
      'Postaw na zbilansowaną dietę',
      'Znajdź czas na oddech i relaks',
      'Śledź swój cykl, by lepiej rozumieć swój ból',
    ],
    shareMessage: 'Jak radzić sobie z bólem miesiączkowym — AWA',
  },
  uk: {
    badge: 'БІЛЬ',
    title: 'Як упоратися з\nменструальним болем',
    metaDuration: '7 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Тепло, легкий рух, харчування: звички, що справді приносять полегшення.',
    contentsTitle: 'У цій статті',
    topics: [
      'Розуміння менструального болю',
      'Ефективні природні способи',
      'Коли звертатися до лікаря?',
      'Практичні поради на щодень',
    ],
    section1Text: 'Спазми виникають через скорочення матки, що допомагають вивести слизову оболонку. Їх спричиняють простагландини. Кожне тіло реагує по-різному.',
    tip1Title: 'Варто знати',
    tip1Text: 'Біль може відрізнятися від циклу до циклу й не завжди однаковий.',
    solutions: [
      {title: 'Тепло', text: 'Грілка на низ живота може розслабити м’язи.'},
      {title: 'Легкий рух', text: 'Йога, розтяжка та легкі прогулянки знімають напруження.'},
      {title: 'Харчування', text: 'Магній, омега-3 та протизапальні продукти.'},
      {title: 'Питний режим', text: 'Достатнє споживання води допомагає обмежити здуття.'},
      {title: 'Масаж', text: 'Круговий масаж низу живота допомагає розслабитися.'},
    ],
    section3Text: 'Якщо попри ці способи біль щомісяця заважає вам жити нормально, важливо поговорити з лікарем або іншим фахівцем.',
    alertTitle: 'Зверніться до лікаря, якщо',
    alertText: 'Дуже сильний біль, рясна кровотеча, надмірна втома або нетипові симптоми.',
    dailyTips: [
      'М’яко розімніть тіло після пробудження',
      'Віддавайте перевагу збалансованому харчуванню',
      'Знаходьте час, щоб дихати й розслаблятися',
      'Відстежуйте цикл, щоб краще розуміти свій біль',
    ],
    shareMessage: 'Як упоратися з менструальним болем — AWA',
  },
  cs: {
    badge: 'BOLEST',
    title: 'Zvládání\nmenstruační bolesti',
    metaDuration: '7 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Teplo, jemný pohyb, strava: návyky, které skutečně přinášejí úlevu.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Pochopení menstruační bolesti',
      'Účinná přirozená řešení',
      'Kdy navštívit lékaře?',
      'Praktické tipy pro každý den',
    ],
    section1Text: 'Křeče vznikají stahy dělohy, které pomáhají odloučit děložní sliznici. Způsobují je prostaglandiny. Každé tělo reaguje jinak.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Bolest se může cyklus od cyklu lišit a nemusí být vždy stejná.',
    solutions: [
      {title: 'Teplo', text: 'Termofor na podbřišku může svaly uvolnit.'},
      {title: 'Jemný pohyb', text: 'Jóga, protahování a lehká chůze zmírňují napětí.'},
      {title: 'Strava', text: 'Hořčík, omega-3 mastné kyseliny a protizánětlivé potraviny.'},
      {title: 'Pitný režim', text: 'Dostatek vody pomáhá omezit nadýmání.'},
      {title: 'Masáž', text: 'Kruhová masáž podbřišku pomáhá uvolnění.'},
    ],
    section3Text: 'Pokud vám bolest každý měsíc brání žít normálně i přes tato řešení, je důležité promluvit si se zdravotnickým pracovníkem.',
    alertTitle: 'Navštivte lékaře, pokud',
    alertText: 'Velmi intenzivní bolest, silné krvácení, extrémní únava nebo neobvyklé příznaky.',
    dailyTips: [
      'Po probuzení jemně rozehřejte tělo',
      'Upřednostněte vyváženou stravu',
      'Věnujte si čas na dýchání a uvolnění',
      'Sledujte svůj cyklus, abyste lépe pochopila svou bolest',
    ],
    shareMessage: 'Zvládání menstruační bolesti — AWA',
  },
  sk: {
    badge: 'BOLESŤ',
    title: 'Zvládanie\nmenštruačných bolestí',
    metaDuration: '7 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Teplo, jemný pohyb, strava: návyky, ktoré skutočne prinášajú úľavu.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Pochopenie menštruačných bolestí',
      'Účinné prirodzené riešenia',
      'Kedy navštíviť lekára?',
      'Praktické každodenné tipy',
    ],
    section1Text: 'Kŕče vznikajú sťahmi maternice, ktoré pomáhajú odlúčiť sliznicu maternice. Spôsobujú ich prostaglandíny. Každé telo reaguje inak.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Bolesť sa môže z cyklu na cyklus líšiť a nie je vždy rovnaká.',
    solutions: [
      {title: 'Teplo', text: 'Termofor na podbrušku môže uvoľniť svaly.'},
      {title: 'Jemný pohyb', text: 'Joga, strečing a ľahká chôdza zmierňujú napätie.'},
      {title: 'Strava', text: 'Horčík, omega-3 a protizápalové potraviny.'},
      {title: 'Hydratácia', text: 'Dostatočné pitie vody pomáha obmedziť nadúvanie.'},
      {title: 'Masáž', text: 'Krúživá masáž podbruška pomáha uvoľniť sa.'},
    ],
    section3Text: 'Ak vám bolesť napriek týmto riešeniam bráni každý mesiac žiť normálne, je dôležité porozprávať sa so zdravotníckym pracovníkom.',
    alertTitle: 'Navštívte lekára, ak',
    alertText: 'Veľmi intenzívna bolesť, silné krvácanie, extrémna únava alebo abnormálne príznaky.',
    dailyTips: [
      'Po zobudení jemne zahrejte telo',
      'Uprednostnite vyváženú stravu',
      'Nájdite si čas na dýchanie a uvoľnenie',
      'Sledujte cyklus, aby ste svoju bolesť lepšie pochopili',
    ],
    shareMessage: 'Zvládanie menštruačných bolestí — AWA',
  },
  hu: {
    badge: 'FÁJDALOM',
    title: 'A menstruációs\nfájdalom kezelése',
    metaDuration: '7 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Meleg, kíméletes mozgás, táplálkozás: szokások, amelyek valóban enyhülést hoznak.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'A menstruációs fájdalom megértése',
      'Hatékony természetes megoldások',
      'Mikor menj orvoshoz?',
      'Praktikus mindennapi tippek',
    ],
    section1Text: 'A görcsöket a méh összehúzódásai okozzák, amelyek segítenek leválasztani a méhnyálkahártyát. A prosztaglandinok idézik elő őket. Minden test másként reagál.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'A fájdalom ciklusról ciklusra változhat, és nem mindig ugyanolyan.',
    solutions: [
      {title: 'Meleg', text: 'Az alhasra helyezett meleg vizes palack ellazíthatja az izmokat.'},
      {title: 'Kíméletes mozgás', text: 'A jóga, a nyújtás és a könnyű séta enyhíti a feszültséget.'},
      {title: 'Táplálkozás', text: 'Magnézium, omega-3 és gyulladáscsökkentő ételek.'},
      {title: 'Hidratálás', text: 'A megfelelő vízfogyasztás segít korlátozni a puffadást.'},
      {title: 'Masszázs', text: 'Az alhas körkörös masszírozása segít ellazulni.'},
    ],
    section3Text: 'Ha a fájdalom ezen megoldások ellenére minden hónapban megakadályoz a normális életben, fontos egészségügyi szakemberrel beszélned.',
    alertTitle: 'Fordulj orvoshoz, ha',
    alertText: 'Nagyon intenzív fájdalom, erős vérzés, extrém fáradtság vagy kóros tünetek.',
    dailyTips: [
      'Ébredéskor kíméletesen melegítsd át a tested',
      'Részesítsd előnyben a kiegyensúlyozott étrendet',
      'Szánj időt a légzésre és az ellazulásra',
      'Kövesd a ciklusodat, hogy jobban megértsd a fájdalmadat',
    ],
    shareMessage: 'A menstruációs fájdalom kezelése — AWA',
  },
  ro: {
    badge: 'DURERE',
    title: 'Gestionarea\ndurerilor menstruale',
    metaDuration: '7 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Căldură, mișcare blândă, alimentație: obiceiuri care aduc cu adevărat alinare.',
    contentsTitle: 'În acest articol',
    topics: [
      'Înțelegerea durerilor menstruale',
      'Soluții naturale eficiente',
      'Când să mergi la medic?',
      'Sfaturi practice de zi cu zi',
    ],
    section1Text: 'Crampele provin din contracțiile uterine care ajută la eliminarea mucoasei uterine. Ele sunt provocate de prostaglandine. Fiecare corp reacționează diferit.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Durerea poate varia de la un ciclu la altul și nu este întotdeauna aceeași.',
    solutions: [
      {title: 'Căldura', text: 'O sticlă cu apă caldă pe abdomenul inferior poate relaxa mușchii.'},
      {title: 'Mișcarea blândă', text: 'Yoga, stretchingul și mersul ușor ameliorează tensiunea.'},
      {title: 'Alimentația', text: 'Magneziu, omega-3 și alimente antiinflamatoare.'},
      {title: 'Hidratarea', text: 'Un consum suficient de apă ajută la limitarea balonării.'},
      {title: 'Masajul', text: 'Un masaj circular pe abdomenul inferior te ajută să te relaxezi.'},
    ],
    section3Text: 'Dacă durerea te împiedică să trăiești normal în fiecare lună în ciuda acestor soluții, este important să vorbești cu un profesionist din domeniul sănătății.',
    alertTitle: 'Mergi la medic dacă',
    alertText: 'Ai dureri foarte intense, sângerări abundente, oboseală extremă sau simptome anormale.',
    dailyTips: [
      'Încălzește-ți blând corpul când te trezești',
      'Favorizează o alimentație echilibrată',
      'Ia-ți timp să respiri și să te relaxezi',
      'Urmărește-ți ciclul pentru a-ți înțelege mai bine durerea',
    ],
    shareMessage: 'Gestionarea durerilor menstruale — AWA',
  },
  bg: {
    badge: 'БОЛКА',
    title: 'Справяне с менструалната\nболка',
    metaDuration: '7 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Топлина, нежно движение, хранене: навици, които наистина носят облекчение.',
    contentsTitle: 'В тази статия',
    topics: [
      'Разбиране на менструалната болка',
      'Ефективни естествени решения',
      'Кога да посетиш лекар?',
      'Практически ежедневни съвети',
    ],
    section1Text: 'Крампите идват от контракциите на матката, които помагат за отделянето на лигавицата ѝ. Причиняват се от простагландините. Всяко тяло реагира различно.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Болката може да варира от цикъл на цикъл и не винаги е еднаква.',
    solutions: [
      {title: 'Топлина', text: 'Бутилка с топла вода върху долната част на корема може да отпусне мускулите.'},
      {title: 'Нежно движение', text: 'Йога, разтягане и лека разходка облекчават напрежението.'},
      {title: 'Хранене', text: 'Магнезий, омега-3 и противовъзпалителни храни.'},
      {title: 'Хидратиране', text: 'Достатъчното пиене на вода помага да се ограничи подуването.'},
      {title: 'Масаж', text: 'Кръгов масаж на долната част на корема помага да се отпуснеш.'},
    ],
    section3Text: 'Ако болката ти пречи да живееш нормално всеки месец въпреки тези решения, важно е да поговориш със здравен специалист.',
    alertTitle: 'Посети лекар, ако имаш',
    alertText: 'Много силна болка, обилно кървене, изключителна умора или необичайни симптоми.',
    dailyTips: [
      'Загрявай тялото си нежно, когато се събудиш',
      'Предпочитай балансирано хранене',
      'Отдели време да дишаш и да се отпуснеш',
      'Проследявай цикъла си, за да разбереш по-добре болката си',
    ],
    shareMessage: 'Справяне с менструалната болка — AWA',
  },
  sr: {
    badge: 'БОЛ',
    title: 'Како се носити са менструалним\nболовима',
    metaDuration: '7 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Топлота, нежно кретање, исхрана: навике које заиста доносе олакшање.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Разумевање менструалног бола',
      'Ефикасна природна решења',
      'Када посетити лекара?',
      'Практични свакодневни савети',
    ],
    section1Text: 'Грчеви долазе од контракција материце које помажу да се одбаци њена слузокожа. Изазивају их простагландини. Свако тело реагује другачије.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Бол може варирати од циклуса до циклуса и није увек исти.',
    solutions: [
      {title: 'Топлота', text: 'Боца са топлом водом на доњем делу стомака може опустити мишиће.'},
      {title: 'Нежно кретање', text: 'Јога, истезање и лагана шетња ублажавају напетост.'},
      {title: 'Исхрана', text: 'Магнезијум, омега-3 и противупалне намирнице.'},
      {title: 'Хидратација', text: 'Довољно пијење воде помаже да се ограничи надутост.'},
      {title: 'Масажа', text: 'Кружна масажа доњег дела стомака помаже да се опустиш.'},
    ],
    section3Text: 'Ако ти бол сваког месеца спречава да живиш нормално упркос овим решењима, важно је да разговараш са здравственим радником.',
    alertTitle: 'Посети лекара ако имаш',
    alertText: 'Веома јак бол, обилно крварење, изузетан умор или необичне симптоме.',
    dailyTips: [
      'Нежно загреј тело када се пробудиш',
      'Преферирај уравнотежену исхрану',
      'Одвоји време да дишеш и опустиш се',
      'Прати свој циклус да боље разумеш свој бол',
    ],
    shareMessage: 'Како се носити са менструалним боловима — AWA',
  },
  hr: {
    badge: 'BOL',
    title: 'Nošenje s\nmenstrualnom boli',
    metaDuration: '7 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Toplina, blago kretanje, prehrana: navike koje doista donose olakšanje.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Razumijevanje menstrualne boli',
      'Učinkovita prirodna rješenja',
      'Kada posjetiti liječnika?',
      'Praktični svakodnevni savjeti',
    ],
    section1Text: 'Grčevi nastaju zbog stezanja maternice koje pomažu odbaciti sluznicu maternice. Uzrokuju ih prostaglandini. Svako tijelo reagira drugačije.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Bol se može razlikovati od ciklusa do ciklusa i nije uvijek ista.',
    solutions: [
      {title: 'Toplina', text: 'Termofor na donjem dijelu trbuha može opustiti mišiće.'},
      {title: 'Blago kretanje', text: 'Joga, istezanje i lagano hodanje ublažuju napetost.'},
      {title: 'Prehrana', text: 'Magnezij, omega-3 masne kiseline i protuupalna hrana.'},
      {title: 'Hidratacija', text: 'Dovoljno pijenje vode pomaže ograničiti nadutost.'},
      {title: 'Masaža', text: 'Kružna masaža donjeg dijela trbuha pomaže ti se opustiti.'},
    ],
    section3Text: 'Ako te bol svaki mjesec sprječava u normalnom životu unatoč ovim rješenjima, važno je razgovarati sa zdravstvenim djelatnikom.',
    alertTitle: 'Posjeti liječnika ako',
    alertText: 'Imaš vrlo jaku bol, obilno krvarenje, ekstremni umor ili neobične simptome.',
    dailyTips: [
      'Nježno zagrij tijelo kad se probudiš',
      'Daj prednost uravnoteženoj prehrani',
      'Odvoji vrijeme za disanje i opuštanje',
      'Prati svoj ciklus kako bi bolje razumjela svoju bol',
    ],
    shareMessage: 'Nošenje s menstrualnom boli — AWA',
  },
  bs: {
    badge: 'BOL',
    title: 'Nošenje s\nmenstrualnom boli',
    metaDuration: '7 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Toplina, blago kretanje, ishrana: navike koje doista donose olakšanje.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Razumijevanje menstrualne boli',
      'Učinkovita prirodna rješenja',
      'Kada posjetiti ljekara?',
      'Praktični svakodnevni savjeti',
    ],
    section1Text: 'Grčevi nastaju zbog stezanja maternice koje pomažu odbaciti sluznicu maternice. Uzrokuju ih prostaglandini. Svako tijelo reagira drugačije.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Bol se može razlikovati od ciklusa do ciklusa i nije uvijek ista.',
    solutions: [
      {title: 'Toplina', text: 'Termofor na donjem dijelu trbuha može opustiti mišiće.'},
      {title: 'Blago kretanje', text: 'Joga, istezanje i lagano hodanje ublažuju napetost.'},
      {title: 'Ishrana', text: 'Magnezij, omega-3 masne kiseline i protuupalna hrana.'},
      {title: 'Hidratacija', text: 'Dovoljno pijenje vode pomaže ograničiti nadutost.'},
      {title: 'Masaža', text: 'Kružna masaža donjeg dijela trbuha pomaže ti se opustiti.'},
    ],
    section3Text: 'Ako te bol svaki mjesec sprječava u normalnom životu unatoč ovim rješenjima, važno je razgovarati sa zdravstvenim radnikom.',
    alertTitle: 'Posjeti ljekara ako',
    alertText: 'Imaš vrlo jaku bol, obilno krvarenje, ekstremni umor ili neobične simptome.',
    dailyTips: [
      'Nježno zagrij tijelo kad se probudiš',
      'Daj prednost uravnoteženoj ishrani',
      'Odvoji vrijeme za disanje i opuštanje',
      'Prati svoj ciklus kako bi bolje razumjela svoju bol',
    ],
    shareMessage: 'Nošenje s menstrualnom boli — AWA',
  },
  sl: {
    badge: 'BOLEČINA',
    title: 'Obvladovanje\nmenstrualne bolečine',
    metaDuration: '7 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Toplota, nežno gibanje, prehrana: navade, ki res prinesejo olajšanje.',
    contentsTitle: 'V tem članku',
    topics: [
      'Razumevanje menstrualne bolečine',
      'Učinkovite naravne rešitve',
      'Kdaj obiskati zdravnika?',
      'Praktični vsakodnevni nasveti',
    ],
    section1Text: 'Krči nastanejo zaradi krčenja maternice, ki pomagajo odvreči sluznico maternice. Povzročajo jih prostaglandini. Vsako telo reagira drugače.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Bolečina se lahko razlikuje od cikla do cikla in ni vedno enaka.',
    solutions: [
      {title: 'Toplota', text: 'Termofor na spodnjem delu trebuha lahko sprosti mišice.'},
      {title: 'Nežno gibanje', text: 'Joga, raztezanje in lahka hoja lajšajo napetost.'},
      {title: 'Prehrana', text: 'Magnezij, omega-3 maščobne kisline in protivnetna živila.'},
      {title: 'Hidracija', text: 'Dovolj pitja vode pomaga omejiti napihnjenost.'},
      {title: 'Masaža', text: 'Krožna masaža spodnjega dela trebuha ti pomaga sprostiti se.'},
    ],
    section3Text: 'Če te bolečina vsak mesec ovira pri normalnem življenju kljub tem rešitvam, je pomembno, da se pogovoriš z zdravstvenim delavcem.',
    alertTitle: 'Obišči zdravnika, če',
    alertText: 'Imaš zelo hudo bolečino, obilno krvavitev, skrajno utrujenost ali nenavadne simptome.',
    dailyTips: [
      'Nežno ogrej telo, ko se zbudiš',
      'Daj prednost uravnoteženi prehrani',
      'Vzemi si čas za dihanje in sproščanje',
      'Spremljaj svoj cikel, da bolje razumeš svojo bolečino',
    ],
    shareMessage: 'Obvladovanje menstrualne bolečine — AWA',
  },
  ne: {
    badge: 'दुखाइ',
    title: 'महिनावारीको\nदुखाइ सम्हाल्ने',
    metaDuration: '7 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'न्यानोपन, हल्का चाल, खानपान: साँच्चै राहत दिने बानीहरू।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'महिनावारीको दुखाइ बुझ्ने',
      'प्रभावकारी प्राकृतिक समाधानहरू',
      'चिकित्सकलाई कहिले देखाउने?',
      'व्यावहारिक दैनिक सुझावहरू',
    ],
    section1Text: 'ऐंठन गर्भाशयको अस्तर झार्न मद्दत गर्ने गर्भाशयको खुम्चाइबाट आउँछ। यो प्रोस्टाग्ल्यान्डिनका कारण हुन्छ। हरेक शरीरले फरक प्रतिक्रिया दिन्छ।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'दुखाइ एक चक्रदेखि अर्कोमा फरक हुन सक्छ र सधैँ उस्तै हुँदैन।',
    solutions: [
      {title: 'न्यानोपन', text: 'तल्लो पेटमा तातो पानीको बोतलले मांसपेशीहरूलाई आराम दिन सक्छ।'},
      {title: 'कोमल चाल', text: 'योग, स्ट्रेचिङ र हल्का हिँडाइले तनाव कम गर्छन्।'},
      {title: 'खानपान', text: 'म्याग्नेसियम, ओमेगा-3 र सूजनविरोधी खानेकुराहरू।'},
      {title: 'पानीको सेवन', text: 'पर्याप्त पानी पिउनाले पेट फुल्ने सीमित गर्न मद्दत गर्छ।'},
      {title: 'मालिस', text: 'तल्लो पेटमा गोलाकार मालिसले आराम गर्न मद्दत गर्छ।'},
    ],
    section3Text: 'यी समाधानहरूका बावजुद दुखाइले हरेक महिना तपाईंलाई सामान्य रूपमा बाँच्नबाट रोक्छ भने, स्वास्थ्यकर्मीसँग कुरा गर्नु महत्त्वपूर्ण छ।',
    alertTitle: 'यस्तो भए चिकित्सकलाई देखाउनुहोस्',
    alertText: 'निकै तीव्र दुखाइ, धेरै रक्तस्राव, चरम थकान, वा असामान्य लक्षणहरू।',
    dailyTips: [
      'ब्युँझँदा आफ्नो शरीरलाई कोमलतापूर्वक तताउनुहोस्',
      'सन्तुलित खानपानलाई प्राथमिकता दिनुहोस्',
      'सास फेर्न र आराम गर्न समय निकाल्नुहोस्',
      'आफ्नो दुखाइ राम्ररी बुझ्न चक्र अनुगमन गर्नुहोस्',
    ],
    shareMessage: 'महिनावारीको दुखाइ सम्हाल्ने — AWA',
  },
  si: {
    badge: 'වේදනාව',
    title: 'ඔසප් වේදනාව\nකළමනාකරණය කිරීම',
    metaDuration: 'කියවීමට මිනිත්තු 7',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'තාපය, මෘදු චලනය, ආහාර: සැබවින්ම සහනයක් ගෙන දෙන පුරුදු.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'ඔසප් වේදනාව තේරුම් ගැනීම',
      'සඵල ස්වාභාවික විසඳුම්',
      'ඔබ වෛද්‍යවරයෙකු හමුවිය යුත්තේ කවදාද?',
      'ප්‍රායෝගික එදිනෙදා ඉඟි',
    ],
    section1Text: 'මාංශ පේශි සංකෝචන පැමිණෙන්නේ ගර්භාෂ අස්තරය ඉවත් කිරීමට උපකාරී වන ගර්භාෂ සංකෝචනවලිනි. ඒවා ප්‍රොස්ටග්ලැන්ඩින් නිසා ඇතිවේ. සෑම ශරීරයක්ම වෙනස් ලෙස ප්‍රතිචාර දක්වයි.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'වේදනාව චක්‍රයෙන් චක්‍රයට වෙනස් විය හැකි අතර සෑම විටම එකම නොවේ.',
    solutions: [
      {title: 'තාපය', text: 'ඔබේ පහළ උදරයේ උණු වතුර බෝතලයක් මාංශ පේශි ලිහිල් කළ හැක.'},
      {title: 'මෘදු චලනය', text: 'යෝග, දිගු කිරීම සහ සැහැල්ලු ඇවිදීම ආතතිය සමනය කරයි.'},
      {title: 'ආහාර', text: 'මැග්නීසියම්, ඔමේගා-3 සහ ප්‍රති-ආහාරදාහ ආහාර.'},
      {title: 'ජල සමතුලිතතාව', text: 'ප්‍රමාණවත් ජලය පානය කිරීම බඩ ඉදිමීම සීමා කිරීමට උපකාරී වේ.'},
      {title: 'සම්බාහනය', text: 'ඔබේ පහළ උදරයේ චක්‍රාකාර සම්බාහනයක් ලිහිල් වීමට උපකාරී වේ.'},
    ],
    section3Text: 'මෙම විසඳුම් තිබියදීත් වේදනාව සෑම මසකම ඔබව සාමාන්‍ය ලෙස ජීවත් වීමෙන් වළක්වන්නේ නම්, සෞඛ්‍ය වෘත්තිකයෙකු සමඟ කතා කිරීම වැදගත්.',
    alertTitle: 'මෙසේ නම් වෛද්‍යවරයෙකු හමුවන්න',
    alertText: 'ඉතා දැඩි වේදනාව, වැඩි ලේ ගැලීම, අතිශය වෙහෙස, හෝ අසාමාන්‍ය රෝග ලක්ෂණ.',
    dailyTips: [
      'ඔබ අවදි වන විට ඔබේ ශරීරය මෘදුවට උණුසුම් කරන්න',
      'සමතුලිත ආහාර වේලකට ප්‍රමුඛත්වය දෙන්න',
      'හුස්ම ගැනීමට සහ ලිහිල් වීමට කාලය ගන්න',
      'ඔබේ වේදනාව වඩා හොඳින් තේරුම් ගැනීමට ඔබේ චක්‍රය නිරීක්ෂණය කරන්න',
    ],
    shareMessage: 'ඔසප් වේදනාව කළමනාකරණය කිරීම — AWA',
  },
  th: {
    badge: 'อาการปวด',
    title: 'การจัดการ\nอาการปวดประจำเดือน',
    metaDuration: 'อ่าน 7 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ความร้อน การเคลื่อนไหวเบา ๆ อาหาร: นิสัยที่ช่วยบรรเทาได้จริง',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ทำความเข้าใจอาการปวดประจำเดือน',
      'วิธีธรรมชาติที่ได้ผล',
      'เมื่อไรควรพบแพทย์?',
      'เคล็ดลับเชิงปฏิบัติในชีวิตประจำวัน',
    ],
    section1Text: 'อาการปวดเกร็งเกิดจากการบีบตัวของมดลูกที่ช่วยผลัดเยื่อบุโพรงมดลูก มีสาเหตุจากโพรสตาแกลนดิน ร่างกายแต่ละคนตอบสนองต่างกัน',
    tip1Title: 'ควรรู้',
    tip1Text: 'อาการปวดอาจต่างกันในแต่ละรอบเดือนและไม่เหมือนกันเสมอไป',
    solutions: [
      {title: 'ความร้อน', text: 'กระเป๋าน้ำร้อนวางที่ท้องน้อยช่วยผ่อนคลายกล้ามเนื้อได้'},
      {title: 'การเคลื่อนไหวเบา ๆ', text: 'โยคะ การยืดเหยียด และการเดินเบา ๆ ช่วยบรรเทาความตึง'},
      {title: 'อาหาร', text: 'แมกนีเซียม โอเมก้า-3 และอาหารต้านการอักเสบ'},
      {title: 'การดื่มน้ำ', text: 'การดื่มน้ำให้เพียงพอช่วยจำกัดอาการท้องอืด'},
      {title: 'การนวด', text: 'การนวดวนเป็นวงกลมที่ท้องน้อยช่วยให้ผ่อนคลาย'},
    ],
    section3Text: 'หากอาการปวดทำให้คุณใช้ชีวิตตามปกติไม่ได้ทุกเดือนแม้ใช้วิธีเหล่านี้แล้ว สิ่งสำคัญคือต้องพูดคุยกับบุคลากรทางการแพทย์',
    alertTitle: 'พบแพทย์หาก',
    alertText: 'ปวดรุนแรงมาก เลือดออกมาก เหนื่อยล้าอย่างยิ่ง หรืออาการผิดปกติ',
    dailyTips: [
      'วอร์มร่างกายเบา ๆ เมื่อตื่นนอน',
      'เลือกอาหารที่สมดุล',
      'ใช้เวลาหายใจและผ่อนคลาย',
      'ติดตามรอบเดือนเพื่อเข้าใจอาการปวดของคุณดียิ่งขึ้น',
    ],
    shareMessage: 'การจัดการอาการปวดประจำเดือน — AWA',
  },
  vi: {
    badge: 'ĐAU',
    title: 'Xử lý cơn đau\ntrong kỳ kinh',
    metaDuration: '7 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Chườm ấm, vận động nhẹ nhàng, ăn uống: những thói quen thực sự mang lại sự dễ chịu.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Hiểu về đau bụng kinh',
      'Các giải pháp tự nhiên hiệu quả',
      'Khi nào nên đi khám bác sĩ?',
      'Mẹo thực tế hằng ngày',
    ],
    section1Text: 'Cơn đau quặn bắt nguồn từ các cơn co thắt tử cung giúp bong lớp niêm mạc tử cung. Chúng do prostaglandin gây ra. Mỗi cơ thể phản ứng khác nhau.',
    tip1Title: 'Nên biết',
    tip1Text: 'Cơn đau có thể thay đổi từ chu kỳ này sang chu kỳ khác và không phải lúc nào cũng giống nhau.',
    solutions: [
      {title: 'Chườm ấm', text: 'Một túi nước ấm đặt lên bụng dưới có thể làm giãn cơ.'},
      {title: 'Vận động nhẹ nhàng', text: 'Yoga, giãn cơ và đi bộ nhẹ giúp giảm căng thẳng.'},
      {title: 'Ăn uống', text: 'Magiê, omega-3 và các thực phẩm chống viêm.'},
      {title: 'Uống nước', text: 'Uống đủ nước giúp hạn chế đầy hơi.'},
      {title: 'Xoa bóp', text: 'Xoa bóp theo vòng tròn ở bụng dưới giúp bạn thư giãn.'},
    ],
    section3Text: 'Nếu cơn đau khiến bạn không thể sinh hoạt bình thường mỗi tháng dù đã áp dụng các giải pháp này, điều quan trọng là nói chuyện với nhân viên y tế.',
    alertTitle: 'Hãy đi khám bác sĩ nếu',
    alertText: 'Đau rất dữ dội, ra máu nhiều, mệt mỏi cực độ hoặc có các triệu chứng bất thường.',
    dailyTips: [
      'Nhẹ nhàng khởi động cơ thể khi thức dậy',
      'Ưu tiên chế độ ăn cân bằng',
      'Dành thời gian hít thở và thư giãn',
      'Theo dõi chu kỳ để hiểu rõ hơn cơn đau của bạn',
    ],
    shareMessage: 'Xử lý cơn đau trong kỳ kinh — AWA',
  },
  uz: {
    badge: 'OGʻRIQ',
    title: 'Hayz ogʻriqlarini\nboshqarish',
    metaDuration: '7 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Issiqlik, yengil harakat, ovqatlanish: haqiqatan yengillik keltiradigan odatlar.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Hayz ogʻriqlarini tushunish',
      'Samarali tabiiy yechimlar',
      'Qachon shifokorga borish kerak?',
      'Kundalik amaliy maslahatlar',
    ],
    section1Text: 'Qisqarishlar bachadon qavatini toʻkishga yordam beradigan bachadon qisqarishlaridan kelib chiqadi. Ularga prostaglandinlar sabab boʻladi. Har bir tana turlicha reaksiya qiladi.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Ogʻriq sikldan sikliga oʻzgarishi mumkin va har doim bir xil emas.',
    solutions: [
      {title: 'Issiqlik', text: 'Qorin pastki qismiga qoʻyilgan issiq suvli grelka mushaklarni boʻshashtirishi mumkin.'},
      {title: 'Yengil harakat', text: 'Yoga, choʻzilish mashqlari va yengil yurish tarangligini yengillashtiradi.'},
      {title: 'Ovqatlanish', text: 'Magniy, omega-3 va yalligʻlanishga qarshi oziq-ovqatlar.'},
      {title: 'Suv balansi', text: 'Yetarli suv ichish shishishni cheklashga yordam beradi.'},
      {title: 'Massaj', text: 'Qorin pastki qismiga aylana massaj boʻshashishga yordam beradi.'},
    ],
    section3Text: 'Agar bu yechimlarga qaramay ogʻriq har oy normal yashashingizga xalaqit bersa, sogʻliqni saqlash mutaxassisi bilan gaplashish muhim.',
    alertTitle: 'Quyidagi hollarda shifokorga boring',
    alertText: 'Juda kuchli ogʻriq, koʻp qon ketishi, haddan tashqari charchoq yoki gʻayrioddiy alomatlar.',
    dailyTips: [
      'Uygʻongandan keyin tanangizni muloyim isiting',
      'Muvozanatli ovqatlanishni afzal koʻring',
      'Nafas olish va boʻshashish uchun vaqt ajrating',
      'Ogʻriqni yaxshiroq tushunish uchun siklingizni kuzating',
    ],
    shareMessage: 'Hayz ogʻriqlarini boshqarish — AWA',
  },
  az: {
    badge: 'AĞRI',
    title: 'Aybaşı ağrısını\nidarə etmək',
    metaDuration: '7 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'İstilik, mülayim hərəkət, qidalanma: həqiqətən rahatlıq gətirən vərdişlər.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Aybaşı ağrısını anlamaq',
      'Təsirli təbii həllər',
      'Nə vaxt həkimə müraciət etmək lazımdır?',
      'Praktik gündəlik məsləhətlər',
    ],
    section1Text: 'Qıcolmalar uşaqlıq selikli qişasının atılmasına kömək edən uşaqlıq yığılmalarından yaranır. Onlara prostaqlandinlər səbəb olur. Hər bədən fərqli reaksiya verir.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Ağrı bir dövrdən digərinə dəyişə bilər və həmişə eyni olmur.',
    solutions: [
      {title: 'İstilik', text: 'Qarının aşağı hissəsinə qoyulan isti su qabı əzələləri rahatlaşdıra bilər.'},
      {title: 'Mülayim hərəkət', text: 'Yoqa, dartılma məşqləri və yüngül gəzinti gərginliyi azaldır.'},
      {title: 'Qidalanma', text: 'Maqnezium, omeqa-3 və iltihab əleyhinə qidalar.'},
      {title: 'Hidratasiya', text: 'Kifayət qədər su içmək şişkinliyi məhdudlaşdırmağa kömək edir.'},
      {title: 'Masaj', text: 'Qarının aşağı hissəsinə dairəvi masaj rahatlamağa kömək edir.'},
    ],
    section3Text: 'Bu həllərə baxmayaraq ağrı hər ay normal yaşamağınıza mane olursa, tibb işçisi ilə danışmaq vacibdir.',
    alertTitle: 'Bu hallarda həkimə müraciət edin',
    alertText: 'Çox şiddətli ağrı, bol qanaxma, həddindən artıq yorğunluq və ya qeyri-adi simptomlar.',
    dailyTips: [
      'Oyananda bədəninizi mülayim şəkildə qızdırın',
      'Balanslı qidalanmaya üstünlük verin',
      'Nəfəs almaq və rahatlamaq üçün vaxt ayırın',
      'Ağrılarınızı daha yaxşı anlamaq üçün dövrünüzü izləyin',
    ],
    shareMessage: 'Aybaşı ağrısını idarə etmək — AWA',
  },
  ka: {
    badge: 'ტკივილი',
    title: 'მენსტრუაციული\nტკივილის მართვა',
    metaDuration: '7 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'სითბო, რბილი მოძრაობა, კვება: ჩვევები, რომლებიც ნამდვილად შვებას იძლევა.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'მენსტრუაციული ტკივილის გაგება',
      'ეფექტიანი ბუნებრივი გადაწყვეტილებები',
      'როდის უნდა მივმართოთ ექიმს?',
      'პრაქტიკული ყოველდღიური რჩევები',
    ],
    section1Text: 'სპაზმები საშვილოსნოს შეკუმშვებით არის გამოწვეული, რომლებიც საშვილოსნოს გარსის გამოყოფას ეხმარება. ისინი პროსტაგლანდინებით არის გამოწვეული. ყველა სხეული განსხვავებულად რეაგირებს.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'ტკივილი ერთი ციკლიდან მეორეზე შეიძლება განსხვავდებოდეს და ყოველთვის ერთნაირი არ არის.',
    solutions: [
      {title: 'სითბო', text: 'ცხელი წყლის ბოთლმა ქვედა მუცელზე შეიძლება კუნთები მოადუნოს.'},
      {title: 'რბილი მოძრაობა', text: 'იოგა, გაჭიმვა და მსუბუქი სიარული დაძაბულობას ამსუბუქებს.'},
      {title: 'კვება', text: 'მაგნიუმი, ომეგა-3 და ანთების საწინააღმდეგო საკვები.'},
      {title: 'ჰიდრატაცია', text: 'საკმარისი წყლის დალევა შებერვის შეზღუდვაში გეხმარებათ.'},
      {title: 'მასაჟი', text: 'წრიული მასაჟი ქვედა მუცელზე გეხმარებათ მოდუნებაში.'},
    ],
    section3Text: 'თუ ტკივილი, ამ გადაწყვეტილებების მიუხედავად, ყოველთვიურად ნორმალურად ცხოვრებას გიშლით, მნიშვნელოვანია ჯანდაცვის სპეციალისტთან საუბარი.',
    alertTitle: 'მიმართეთ ექიმს, თუ',
    alertText: 'ძალიან ინტენსიური ტკივილი, უხვი სისხლდენა, უკიდურესი დაღლილობა ან არანორმალური სიმპტომები.',
    dailyTips: [
      'გაღვიძებისას ნაზად გაათბეთ სხეული',
      'მიანიჭეთ უპირატესობა დაბალანსებულ კვებას',
      'დაუთმეთ დრო სუნთქვასა და მოდუნებას',
      'აკონტროლეთ თქვენი ციკლი ტკივილის უკეთ გასაგებად',
    ],
    shareMessage: 'მენსტრუაციული ტკივილის მართვა — AWA',
  },
  hy: {
    badge: 'ՑԱՎ',
    title: 'Դաշտանային\nցավի կառավարում',
    metaDuration: '7 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ջերմություն, մեղմ շարժում, սննդակարգ. սովորություններ, որոնք իրականում թեթևացում են բերում:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Հասկանալ դաշտանային ցավը',
      'Արդյունավետ բնական լուծումներ',
      'Ե՞րբ պետք է դիմել բժշկի',
      'Գործնական առօրյա խորհուրդներ',
    ],
    section1Text: 'Ջղաձգումները առաջանում են արգանդի կծկումներից, որոնք օգնում են հեռացնել արգանդի լորձաթաղանթը: Դրանք պայմանավորված են պրոստագլանդիններով: Յուրաքանչյուր մարմին արձագանքում է տարբեր կերպ:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Ցավը կարող է տարբերվել մի ցիկլից մյուսը և միշտ նույնը չէ:',
    solutions: [
      {title: 'Ջերմություն', text: 'Որովայնի ստորին հատվածին դրված տաք ջրով տաքացուցիչը կարող է թուլացնել մկանները:'},
      {title: 'Մեղմ շարժում', text: 'Յոգան, ձգումները և թեթև քայլքը թեթևացնում են լարվածությունը:'},
      {title: 'Սննդակարգ', text: 'Մագնեզիում, օմեգա-3 և հակաբորբոքային սնունդ:'},
      {title: 'Հիդրատացիա', text: 'Բավարար ջուր խմելը օգնում է սահմանափակել ուռածությունը:'},
      {title: 'Մերսում', text: 'Որովայնի ստորին հատվածի շրջանաձև մերսումը օգնում է թուլանալ:'},
    ],
    section3Text: 'Եթե ցավը չի թողնում ձեզ ամեն ամիս նորմալ ապրել՝ չնայած այս լուծումներին, կարևոր է խոսել առողջապահության մասնագետի հետ:',
    alertTitle: 'Դիմեք բժշկի, եթե',
    alertText: 'Շատ ուժեղ ցավ, առատ արյունահոսություն, ծայրահեղ հոգնածություն կամ աննորմալ ախտանիշներ:',
    dailyTips: [
      'Արթնանալիս մեղմորեն տաքացրեք ձեր մարմինը',
      'Նախապատվություն տվեք հավասարակշռված սննդակարգին',
      'Ժամանակ հատկացրեք շնչելու և թուլանալու համար',
      'Հետևեք ձեր ցիկլին՝ ձեր ցավն ավելի լավ հասկանալու համար',
    ],
    shareMessage: 'Դաշտանային ցավի կառավարում — AWA',
  },
  tg: {
    badge: 'ДАРД',
    title: 'Идораи дарди\nҳайз',
    metaDuration: '7 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Гармӣ, ҳаракати нарм, ғизо: одатҳое, ки воқеан сабукӣ меоранд.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Фаҳмидани дарди ҳайз',
      'Роҳҳои табиии самарабахш',
      'Кай бояд ба табиб муроҷиат кард?',
      'Маслиҳатҳои амалии ҳаррӯза',
    ],
    section1Text: 'Кашишхӯрӣ аз кашишҳои бачадон меояд, ки ба рехтани қабати бачадон кумак мекунанд. Онҳо аз простагландинҳо ба вуҷуд меоянд. Ҳар бадан ба таври гуногун вокуниш нишон медиҳад.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Дард аз як давра то давраи дигар метавонад гуногун бошад ва на ҳамеша якхела аст.',
    solutions: [
      {title: 'Гармӣ', text: 'Грелка дар поёни шикам метавонад мушакҳоро ором кунад.'},
      {title: 'Ҳаракати нарм', text: 'Йога, кашиш ва пиёдагардии сабук шиддатро сабук мекунанд.'},
      {title: 'Ғизо', text: 'Магний, омега-3 ва хӯрокҳои зидди илтиҳобӣ.'},
      {title: 'Обнӯшӣ', text: 'Нӯшидани оби кофӣ ба маҳдуд кардани дамидани шикам кумак мекунад.'},
      {title: 'Масҳ', text: 'Масҳи даврашакл дар поёни шикам ба ором шудан кумак мекунад.'},
    ],
    section3Text: 'Агар дард бо вуҷуди ин роҳҳо ҳар моҳ шуморо аз зиндагии муқаррарӣ бозмедорад, муҳим аст бо мутахассиси соҳаи тиб гап занед.',
    alertTitle: 'Ба табиб муроҷиат кунед, агар',
    alertText: 'Дарди хеле шадид, хунравии зиёд, хастагии шадид ё нишонаҳои ғайримуқаррарӣ.',
    dailyTips: [
      'Ҳангоми бедор шудан баданатонро нарм гарм кунед',
      'Ғизои мутавозинро афзал донед',
      'Барои нафас кашидан ва ором шудан вақт ҷудо кунед',
      'Давраи худро пайгирӣ кунед, то дарди худро беҳтар бифаҳмед',
    ],
    shareMessage: 'Идораи дарди ҳайз — AWA',
  },
  ky: {
    badge: 'ООРУ',
    title: 'Етек кирим оорусун\nбашкаруу',
    metaDuration: '7 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Жылуулук, жумшак кыймыл, тамактануу: чыныгы жеңилдик алып келген адаттар.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Етек кирим оорусун түшүнүү',
      'Натыйжалуу табигый чечимдер',
      'Дарыгерге качан барыш керек?',
      'Практикалык күнүмдүк кеңештер',
    ],
    section1Text: 'Спазмдар жатын ички катмарын чыгарууга жардам берген жатын жыйрылуусунан келип чыгат. Аларга простагландиндер себепкер. Ар бир дене башкача реакция кылат.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Оору циклден циклге өзгөрүшү мүмкүн жана ар дайым бирдей эмес.',
    solutions: [
      {title: 'Жылуулук', text: 'Курсактын ылдый жагындагы ысык суу грелкасы булчуңдарды бошоңдотушу мүмкүн.'},
      {title: 'Жумшак кыймыл', text: 'Йога, чоюлуу көнүгүүлөрү жана жеңил басуу чыңалууну жеңилдетет.'},
      {title: 'Тамактануу', text: 'Магний, омега-3 жана сезгенүүгө каршы азыктар.'},
      {title: 'Суюктук ичүү', text: 'Жетиштүү суу ичүү ич көбүшүн чектөөгө жардам берет.'},
      {title: 'Массаж', text: 'Курсактын ылдый жагындагы тегерек массаж бошоңдоого жардам берет.'},
    ],
    section3Text: 'Эгер оору бул чечимдерге карабастан ар айда нормалдуу жашоого тоскоол болсо, ден соолук сактоо адиси менен сүйлөшүү маанилүү.',
    alertTitle: 'Дарыгерге барыңыз, эгер',
    alertText: 'Өтө күчтүү оору, көп кан кетүү, өтө чарчоо же адаттан тыш белгилер болсо.',
    dailyTips: [
      'Ойгонгондо денеңизди акырын жылытыңыз',
      'Тең салмактуу тамактанууга артыкчылык бериңиз',
      'Дем алууга жана бошоңдоого убакыт бөлүңүз',
      'Ооруңузду жакшыраак түшүнүү үчүн циклиңизди көзөмөлдөңүз',
    ],
    shareMessage: 'Етек кирим оорусун башкаруу — AWA',
  },
  tk: {
    badge: 'AGYRY',
    title: 'Aýbaşy agyrysyny\ndolandyrmak',
    metaDuration: '7 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Ýylylyk, ýumşak hereket, iýmitlenmek: hakykatdan ýeňillik berýän endikler.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Aýbaşy agyrysyny düşünmek',
      'Täsirli tebigy çözgütler',
      'Lukmana haçan ýüz tutmaly?',
      'Amaly gündelik maslahatlar',
    ],
    section1Text: 'Çekişmeler ýatgy içki gatlagynyň taşlanmagyna kömek edýän ýatgy gysylmalaryndan gelýär. Olar prostaglandinler sebäpli bolýar. Her beden başgaça reaksiýa berýär.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Agyry sikldan sika üýtgäp biler we hemişe şol bir däl.',
    solutions: [
      {title: 'Ýylylyk', text: 'Garnyň aşagyna goýlan ysyk suw gaby myşsalary rahatlandyryp biler.'},
      {title: 'Ýumşak hereket', text: 'Ýoga, uzaltmak we ýeňil ýöremek dartgynlygy ýeňilleşdirýär.'},
      {title: 'Iýmitlenmek', text: 'Magniý, omega-3 we ýangy garşy iýmitler.'},
      {title: 'Suwlandyrmak', text: 'Ýeterlik suw içmek çişmegi çäklemäge kömek edýär.'},
      {title: 'Massaž', text: 'Garnyň aşagyna tegelek massaž rahatlanmaga kömek edýär.'},
    ],
    section3Text: 'Bu çözgütlere garamazdan agyry her aý adaty ýaşamaga päsgel berse, saglyk hünärmeni bilen gürleşmek möhüm.',
    alertTitle: 'Şu ýagdaýda lukmana ýüz tutuň',
    alertText: 'Gaty güýçli agyry, köp gan akma, aşa ýadawlyk ýa-da adaty däl alamatlar.',
    dailyTips: [
      'Oýananyňyzda bedeniňizi ýumşak gyzdyryň',
      'Deňagramly iýmitlenmäge artykmaçlyk beriň',
      'Dem almaga we dynç almaga wagt aýryň',
      'Agyryňyzy has gowy düşünmek üçin sikliňizi yzarlaň',
    ],
    shareMessage: 'Aýbaşy agyrysyny dolandyrmak — AWA',
  },
  ms: {
    badge: 'SAKIT',
    title: 'Menguruskan\nsakit haid',
    metaDuration: '7 min bacaan',
    metaType: 'Panduan',
    metaLevel: 'Permulaan',
    metaValidated: 'Kandungan disemak',
    intro: 'Kehangatan, pergerakan lembut, pemakanan: tabiat yang benar-benar melegakan.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Memahami sakit haid',
      'Penyelesaian semula jadi yang berkesan',
      'Bila anda patut berjumpa doktor?',
      'Petua praktikal harian',
    ],
    section1Text: 'Kekejangan berpunca daripada kontraksi rahim yang membantu menggugurkan lapisan rahim. Ia disebabkan oleh prostaglandin. Setiap tubuh bertindak balas secara berbeza.',
    tip1Title: 'Elok diketahui',
    tip1Text: 'Sakit boleh berbeza dari satu kitaran ke kitaran berikutnya dan tidak selalunya sama.',
    solutions: [
      {title: 'Kehangatan', text: 'Botol air panas pada perut bawah anda boleh merehatkan otot.'},
      {title: 'Pergerakan lembut', text: 'Yoga, regangan dan berjalan ringan melegakan ketegangan.'},
      {title: 'Pemakanan', text: 'Magnesium, omega-3 dan makanan anti-radang.'},
      {title: 'Hidrasi', text: 'Minum air secukupnya membantu mengehadkan kembung.'},
      {title: 'Urutan', text: 'Urutan bulat pada perut bawah anda membantu anda berehat.'},
    ],
    section3Text: 'Jika sakit menghalang anda daripada hidup seperti biasa setiap bulan walaupun dengan penyelesaian ini, adalah penting untuk berbincang dengan pengamal penjagaan kesihatan.',
    alertTitle: 'Berjumpa doktor jika',
    alertText: 'Sakit yang sangat kuat, pendarahan yang banyak, keletihan melampau atau simptom yang tidak normal.',
    dailyTips: [
      'Panaskan tubuh anda dengan lembut apabila bangun tidur',
      'Utamakan pemakanan yang seimbang',
      'Luangkan masa untuk bernafas dan berehat',
      'Jejaki kitaran anda untuk memahami sakit anda dengan lebih baik',
    ],
    shareMessage: 'Menguruskan sakit haid — AWA',
  },
  so: {
    badge: 'XANUUN',
    title: 'Maamulka xanuunka\ncaadada',
    metaDuration: '7 daq akhris',
    metaType: 'Hage',
    metaLevel: 'Bilow',
    metaValidated: 'Macluumaad la dib-u-eegay',
    intro: 'Kulayl, dhaqdhaqaaq jilicsan, cunto: caadooyin runtii keena fudeyd.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Fahamka xanuunka caadada',
      'Xalalka dabiiciga ah ee waxtarka leh',
      'Goorta dhakhtar la arko?',
      'Talooyin ficil ah oo maalinle ah',
    ],
    section1Text: 'Qallalku wuxuu ka yimaadaa isku-uruurinta ilmo-galeenka ee caawisa saaridda dahaarka ilmo-galeenka. Waxaa keena prostaglandins. Jidh kastaa wuxuu ku falceliyaa si ka duwan.',
    tip1Title: 'Waxtar leh in la ogaado',
    tip1Text: 'Xanuunku wuu kala duwanaan karaa wareeg ilaa wareeg mana ahan mar walba isku mid.',
    solutions: [
      {title: 'Kulayl', text: 'Dhalo biyo kulul oo calooshaada hoose saaran ayaa nasin kara murqaha.'},
      {title: 'Dhaqdhaqaaq jilicsan', text: 'Yoga, kala-qaadid, iyo socod fudud ayaa fududeeya xiisadda.'},
      {title: 'Cunto', text: 'Magnesium, omega-3, iyo cuntooyin bararka ka hortaga.'},
      {title: 'Biyo-cabbid', text: 'Cabbidda biyo ku filan ayaa caawisa xaddidaadda calool-barar.'},
      {title: 'Salaaxid', text: 'Salaaxid wareegsan oo calooshaada hoose ah ayaa kaa caawisa inaad nasatid.'},
    ],
    section3Text: 'Haddii xanuunku ku joojiyo inaad si caadi ah u nooshahay bil kasta inkasta oo xalalkan la isticmaalo, waa muhiim inaad la hadasho xirfadle caafimaad.',
    alertTitle: 'Arag dhakhtar haddii',
    alertText: 'Xanuun aad u xoog badan, dhiigbax culus, daal xad dhaaf ah, ama astaamo aan caadi ahayn.',
    dailyTips: [
      'Si jilicsan u kululee jidhkaaga marka aad toostid',
      'Door bid cunto dheelitiran',
      'Qaado waqti aad ku neefsato oo aad ku nasato',
      'La soco wareeggaaga si aad si wanaagsan u fahanto xanuunkaaga',
    ],
    shareMessage: 'Maamulka xanuunka caadada — AWA',
  },
  sw: {
    badge: 'MAUMIVU',
    title: 'Kudhibiti\nmaumivu ya hedhi',
    metaDuration: 'Dakika 7 za kusoma',
    metaType: 'Mwongozo',
    metaLevel: 'Mwanzo',
    metaValidated: 'Maudhui yaliyokaguliwa',
    intro: 'Joto, mwendo wa upole, lishe: tabia zinazoleta nafuu kwa kweli.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Kuelewa maumivu ya hedhi',
      'Suluhisho za asili zenye ufanisi',
      'Wakati gani umwone daktari?',
      'Vidokezo vya vitendo vya kila siku',
    ],
    section1Text: 'Mikakamao hutokana na mikazo ya mji wa uzazi inayosaidia kumwaga utando wa mji wa uzazi. Husababishwa na prostaglandini. Kila mwili huitikia tofauti.',
    tip1Title: 'Vyema kujua',
    tip1Text: 'Maumivu yanaweza kutofautiana kutoka mzunguko mmoja hadi unaofuata na si sawa kila wakati.',
    solutions: [
      {title: 'Joto', text: 'Chupa ya maji ya moto kwenye tumbo lako la chini inaweza kulegeza misuli.'},
      {title: 'Mwendo wa upole', text: 'Yoga, kunyoosha mwili, na kutembea kidogo hupunguza mvutano.'},
      {title: 'Lishe', text: 'Magnesiamu, omega-3, na vyakula vinavyopunguza uvimbe.'},
      {title: 'Kunywa maji', text: 'Kunywa maji ya kutosha husaidia kupunguza tumbo kujaa gesi.'},
      {title: 'Masaji', text: 'Masaji ya duara kwenye tumbo lako la chini hukusaidia kutulia.'},
    ],
    section3Text: 'Ikiwa maumivu yanakuzuia kuishi kawaida kila mwezi licha ya suluhisho hizi, ni muhimu kuzungumza na mtaalamu wa afya.',
    alertTitle: 'Mwone daktari ikiwa',
    alertText: 'Maumivu makali sana, kutokwa damu nyingi, uchovu uliopitiliza, au dalili zisizo za kawaida.',
    dailyTips: [
      'Pasha mwili wako joto kwa upole unapoamka',
      'Pendelea lishe yenye usawa',
      'Chukua muda wa kupumua na kutulia',
      'Fuatilia mzunguko wako ili kuelewa vizuri maumivu yako',
    ],
    shareMessage: 'Kudhibiti maumivu ya hedhi — AWA',
  },
  kk: {
    badge: 'АУЫРУ',
    title: 'Етеккір ауыруын\nбасқару',
    metaDuration: '7 мин оқу',
    metaType: 'Нұсқаулық',
    metaLevel: 'Бастауыш',
    metaValidated: 'Тексерілген мазмұн',
    intro: 'Жылу, жұмсақ қозғалыс, тамақтану: шынымен жеңілдік беретін әдеттер.',
    contentsTitle: 'Осы мақалада',
    topics: [
      'Етеккір ауыруын түсіну',
      'Тиімді табиғи шешімдер',
      'Дәрігерге қашан бару керек?',
      'Күнделікті практикалық кеңестер',
    ],
    section1Text: 'Құрысулар жатыр қабатын тастауға көмектесетін жатыр жиырылуларынан туындайды. Оларды простагландиндер тудырады. Әр дене әртүрлі жауап береді.',
    tip1Title: 'Білуге тиісті',
    tip1Text: 'Ауыру бір циклден келесісіне өзгеруі мүмкін және әрқашан бірдей болмайды.',
    solutions: [
      {title: 'Жылу', text: 'Төменгі құрсағыңыздағы ыстық су грелкасы бұлшықеттерді босаңсыта алады.'},
      {title: 'Жұмсақ қозғалыс', text: 'Йога, созылу жаттығулары және жеңіл серуендеу керілуді жеңілдетеді.'},
      {title: 'Тамақтану', text: 'Магний, омега-3 және қабынуға қарсы тағамдар.'},
      {title: 'Су ішу', text: 'Жеткілікті су ішу іштің кебуін шектеуге көмектеседі.'},
      {title: 'Массаж', text: 'Төменгі құрсағыңызға жасалатын дөңгелек массаж босаңсуға көмектеседі.'},
    ],
    section3Text: 'Осы шешімдерге қарамастан ауыру әр ай сайын қалыпты өмір сүруге кедергі келтірсе, медицина маманымен сөйлесу маңызды.',
    alertTitle: 'Мына жағдайда дәрігерге барыңыз',
    alertText: 'Өте қатты ауыру, мол қан кету, шектен тыс шаршау немесе әдеттен тыс белгілер.',
    dailyTips: [
      'Оянғанда денеңізді жұмсақ қыздырыңыз',
      'Теңгерімді тамақтануды жөн көріңіз',
      'Тыныс алуға және босаңсуға уақыт бөліңіз',
      'Ауыруыңызды жақсырақ түсіну үшін циклыңызды бақылаңыз',
    ],
    shareMessage: 'Етеккір ауыруын басқару — AWA',
  },
  wo: {
    badge: 'METIT',
    title: 'Yor metitu\nrègle',
    metaDuration: '7 simili jàng',
    metaType: 'Ndigal',
    metaLevel: 'Tàmbali',
    metaValidated: 'Mbind bu ñu seetlu',
    intro: 'Tàngoor, yëngu bu lewet, lekk: yoon yu dëgg-dëgg di jox dalal.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Xam metitu règle',
      'Jawab yu natural yu am njariñ',
      'Kañ ngay seet doktoor?',
      'Ndigal yu jëfandikoo bés bu nekk',
    ],
    section1Text: 'Metit bi dafay jóge ci tëx yu bérëbu ndey yu di dimbli ci tëx jëmmu ndey. Prostaglandin moo ko di tax. Yaram bu nekk dafay tontu ci anamam.',
    tip1Title: 'Lu baax a xam',
    tip1Text: 'Metit mën na wuute ci wërsëg ak wërsëg te du saa su ne benn.',
    solutions: [
      {title: 'Tàngoor', text: 'Benn butel ndox bu tàng ci suufu biir mën na noppalal yaram yi.'},
      {title: 'Yëngu bu lewet', text: 'Yoga, xëtt ak dox bu lewet dañuy dalal tëx yi.'},
      {title: 'Lekk', text: 'Magnesiyom, omega-3 ak lekk yu wàññi tuuru.'},
      {title: 'Naan ndox', text: 'Naan ndox bu doy dafay dimbli wàññi tuuru ndey.'},
      {title: 'Masaas', text: 'Benn masaas bu wër ci suufu biir dafay dimbli nga noppalu.'},
    ],
    section3Text: 'Bu metit bi tee la dund ni cosaan weer bu nekk ba noppi jawab yii, am solo na nga wax ak benn liggéeykatu wér.',
    alertTitle: 'Seet doktoor bu',
    alertText: 'Metit bu metti lool, deret bu bari, sonn bu metti walla màndarga yu cosaanul.',
    dailyTips: [
      'Tàngal sa yaram ak lewet bu nga yewoo',
      'Jëkk lekk bu jubloo',
      'Jël jamono ngir noppiku te noppalu',
      'Topp sa wërsëg ngir gën a xam sa metit',
    ],
    shareMessage: 'Yor metitu règle — AWA',
  },
  ha: {
    badge: 'CIWO',
    title: 'Magance\nciwon haila',
    metaDuration: 'karatun minti 7',
    metaType: 'Jagora',
    metaLevel: 'Mafari',
    metaValidated: 'Abun da aka duba',
    intro: 'Zafi, motsi mai laushi, abinci: dabi’u da ke kawo sauƙi da gaske.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Fahimtar ciwon haila',
      'Mafita na halitta masu tasiri',
      'Yaushe ya kamata ki ga likita?',
      'Shawarwari masu amfani na yau da kullum',
    ],
    section1Text: 'Murɗawar ciki tana fitowa daga matsewar mahaifa da ke taimakawa zubar da bangon mahaifa. Prostaglandins ne ke haddasa su. Kowane jiki yana amsawa daban.',
    tip1Title: 'Abin da ya dace a sani',
    tip1Text: 'Ciwo na iya bambanta daga zagaye zuwa zagaye kuma ba koyaushe iri ɗaya ba ne.',
    solutions: [
      {title: 'Zafi', text: 'Kwalbar ruwan zafi a ƙasan cikinki na iya sanyaya tsokoki.'},
      {title: 'Motsi mai laushi', text: 'Yoga, miƙa jiki, da tafiya mai sauƙi suna rage tashin hankali.'},
      {title: 'Abinci', text: 'Magnesium, omega-3, da abinci masu hana kumburi.'},
      {title: 'Shan ruwa', text: 'Shan isasshen ruwa yana taimakawa rage kumburin ciki.'},
      {title: 'Tausa', text: 'Tausa mai zagaye a ƙasan cikinki yana taimaka miki ki huta.'},
    ],
    section3Text: 'Idan ciwon yana hana ki rayuwa yadda ya kamata kowane wata duk da waɗannan mafita, yana da muhimmanci ki yi magana da ma’aikacin lafiya.',
    alertTitle: 'Ga likita idan',
    alertText: 'Ciwo mai tsanani sosai, zubar jini mai yawa, gajiya mai tsanani, ko alamomi ba na al’ada ba.',
    dailyTips: [
      'Ɗumama jikinki a hankali lokacin da kika tashi',
      'Fifita daidaitaccen abinci',
      'Ɗauki lokaci don numfashi da hutawa',
      'Bi diddigin zagayenki don fi fahimtar ciwonki',
    ],
    shareMessage: 'Magance ciwon haila — AWA',
  },
  am: {
    badge: 'ህመም',
    title: 'የወር አበባ ህመምን\nመቆጣጠር',
    metaDuration: '7 ደቂቃ ንባብ',
    metaType: 'መመሪያ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'የተገመገመ ይዘት',
    intro: 'ሙቀት፣ ለስላሳ እንቅስቃሴ፣ አመጋገብ፦ እውነተኛ እፎይታ የሚያመጡ ልማዶች።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'የወር አበባ ህመምን መረዳት',
      'ውጤታማ ተፈጥሯዊ መፍትሔዎች',
      'ሐኪም መቼ ማየት አለብሽ?',
      'ተግባራዊ የዕለት ተዕለት ምክሮች',
    ],
    section1Text: 'ቁርጠት የማህፀን ሽፋንን ለማስወገድ ከሚረዱ የማህፀን መኮማተሮች ይመጣል። በፕሮስታግላንዲኖች ይከሰታል። እያንዳንዱ አካል በተለየ መንገድ ምላሽ ይሰጣል።',
    tip1Title: 'ማወቅ ጠቃሚ ነው',
    tip1Text: 'ህመም ከአንዱ ዑደት ወደ ቀጣዩ ሊለያይ ይችላል እና ሁልጊዜ አንድ አይደለም።',
    solutions: [
      {title: 'ሙቀት', text: 'በታችኛው ሆድሽ ላይ የሞቀ ውሃ ጠርሙስ ጡንቻዎችን ዘና ሊያደርግ ይችላል።'},
      {title: 'ለስላሳ እንቅስቃሴ', text: 'ዮጋ፣ መሳብና ቀላል የእግር ጉዞ ውጥረትን ያቃልላሉ።'},
      {title: 'አመጋገብ', text: 'ማግኒዚየም፣ ኦሜጋ-3 እና እብጠትን የሚቀንሱ ምግቦች።'},
      {title: 'ውሃ መጠጣት', text: 'በቂ ውሃ መጠጣት እብጠትን ለመገደብ ይረዳል።'},
      {title: 'ማሳጅ', text: 'በታችኛው ሆድሽ ላይ ክብ ማሳጅ ዘና ለማለት ይረዳል።'},
    ],
    section3Text: 'ህመሙ ከእነዚህ መፍትሔዎች ቢኖሩም በየወሩ በመደበኛነት እንዳትኖሪ የሚያደርግሽ ከሆነ፣ ከጤና ባለሙያ ጋር መነጋገር አስፈላጊ ነው።',
    alertTitle: 'ሐኪም ተመልከቺ ከሆነ',
    alertText: 'በጣም ከባድ ህመም፣ ብዙ ደም መፍሰስ፣ ከፍተኛ ድካም ወይም ያልተለመዱ ምልክቶች።',
    dailyTips: [
      'ስትነቂ ሰውነትሽን በቀስታ አሞቂ',
      'ሚዛናዊ አመጋገብን ምረጪ',
      'ለመተንፈስና ዘና ለማለት ጊዜ ውሰጂ',
      'ህመምሽን በተሻለ ለመረዳት ዑደትሽን ተከታተይ',
    ],
    shareMessage: 'የወር አበባ ህመምን መቆጣጠር — AWA',
  },
  nl: {
    badge: 'PIJN',
    title: 'Menstruatiepijn\nverlichten',
    metaDuration: '7 min lezen',
    metaType: 'Gids',
    metaLevel: 'Beginner',
    metaValidated: 'Gecontroleerde inhoud',
    intro: 'Warmte, zachte beweging, voeding: gewoonten die echt verlichting brengen.',
    contentsTitle: 'In dit artikel',
    topics: [
      'Menstruatiepijn begrijpen',
      'Effectieve natuurlijke oplossingen',
      'Wanneer een arts raadplegen?',
      'Praktische tips voor elke dag',
    ],
    section1Text: 'Krampen komen van samentrekkingen van de baarmoeder die helpen het baarmoederslijmvlies af te stoten. Ze worden veroorzaakt door prostaglandinen. Elk lichaam reageert anders.',
    tip1Title: 'Goed om te weten',
    tip1Text: 'De pijn kan van cyclus tot cyclus variëren en is niet altijd hetzelfde.',
    solutions: [
      {title: 'Warmte', text: 'Een warmwaterkruik op je onderbuik kan de spieren ontspannen.'},
      {title: 'Zachte beweging', text: 'Yoga, rekoefeningen en rustig wandelen verlichten spanning.'},
      {title: 'Voeding', text: 'Magnesium, omega-3 en ontstekingsremmende voedingsmiddelen.'},
      {title: 'Hydratatie', text: 'Voldoende water drinken helpt een opgeblazen gevoel te beperken.'},
      {title: 'Massage', text: 'Een cirkelvormige massage op je onderbuik helpt je te ontspannen.'},
    ],
    section3Text: 'Als de pijn je elke maand belet normaal te leven ondanks deze oplossingen, is het belangrijk met een zorgprofessional te praten.',
    alertTitle: 'Zie een arts als',
    alertText: 'Zeer hevige pijn, hevig bloedverlies, extreme vermoeidheid of abnormale symptomen.',
    dailyTips: [
      'Warm je lichaam zachtjes op wanneer je wakker wordt',
      'Geef de voorkeur aan een evenwichtige voeding',
      'Neem de tijd om te ademen en te ontspannen',
      'Houd je cyclus bij om je pijn beter te begrijpen',
    ],
    shareMessage: 'Menstruatiepijn verlichten — AWA',
  },
  fi: {
    badge: 'KIPU',
    title: 'Kuukautiskivun\nhallinta',
    metaDuration: '7 min lukuaika',
    metaType: 'Opas',
    metaLevel: 'Aloittelija',
    metaValidated: 'Tarkistettu sisältö',
    intro: 'Lämpö, lempeä liike, ruokavalio: tavat, jotka todella tuovat helpotusta.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Kuukautiskivun ymmärtäminen',
      'Tehokkaat luonnolliset ratkaisut',
      'Milloin pitäisi mennä lääkäriin?',
      'Käytännön päivittäiset vinkit',
    ],
    section1Text: 'Krampit johtuvat kohdun supistuksista, jotka auttavat poistamaan kohdun limakalvoa. Ne aiheutuvat prostaglandiineista. Jokainen keho reagoi eri tavalla.',
    tip1Title: 'Hyvä tietää',
    tip1Text: 'Kipu voi vaihdella kierrosta toiseen, eikä se ole aina samanlaista.',
    solutions: [
      {title: 'Lämpö', text: 'Kuuma vesipullo alavatsalla voi rentouttaa lihaksia.'},
      {title: 'Lempeä liike', text: 'Jooga, venyttely ja kevyt kävely lievittävät jännitystä.'},
      {title: 'Ruokavalio', text: 'Magnesium, omega-3-rasvahapot ja tulehdusta ehkäisevät ruoat.'},
      {title: 'Nesteytys', text: 'Riittävä veden juominen auttaa rajoittamaan turvotusta.'},
      {title: 'Hieronta', text: 'Ympyräliikkein tehty alavatsan hieronta auttaa rentoutumaan.'},
    ],
    section3Text: 'Jos kipu estää sinua elämästä normaalisti joka kuukausi näistä ratkaisuista huolimatta, on tärkeää puhua terveydenhuollon ammattilaisen kanssa.',
    alertTitle: 'Mene lääkäriin, jos',
    alertText: 'Hyvin voimakas kipu, runsas vuoto, äärimmäinen väsymys tai epänormaalit oireet.',
    dailyTips: [
      'Lämmittele kehoasi lempeästi herätessäsi',
      'Suosi tasapainoista ruokavaliota',
      'Varaa aikaa hengittämiselle ja rentoutumiselle',
      'Seuraa kiertoasi ymmärtääksesi kipuasi paremmin',
    ],
    shareMessage: 'Kuukautiskivun hallinta — AWA',
  },
  el: {
    badge: 'ΠΟΝΟΣ',
    title: 'Διαχείριση του\nπόνου της περιόδου',
    metaDuration: '7 λεπτά ανάγνωσης',
    metaType: 'Οδηγός',
    metaLevel: 'Αρχάριο',
    metaValidated: 'Ελεγμένο περιεχόμενο',
    intro: 'Θερμότητα, ήπια κίνηση, διατροφή: συνήθειες που πραγματικά φέρνουν ανακούφιση.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Κατανοώντας τον πόνο της περιόδου',
      'Αποτελεσματικές φυσικές λύσεις',
      'Πότε πρέπει να επισκεφθείς γιατρό;',
      'Πρακτικές καθημερινές συμβουλές',
    ],
    section1Text: 'Οι κράμπες προέρχονται από συσπάσεις της μήτρας που βοηθούν στην αποβολή του επιθηλίου της μήτρας. Προκαλούνται από προσταγλανδίνες. Κάθε σώμα αντιδρά διαφορετικά.',
    tip1Title: 'Καλό είναι να γνωρίζεις',
    tip1Text: 'Ο πόνος μπορεί να διαφέρει από τον έναν κύκλο στον άλλο και δεν είναι πάντα ο ίδιος.',
    solutions: [
      {title: 'Θερμότητα', text: 'Ένα θερμοφόρο στην κάτω κοιλιά μπορεί να χαλαρώσει τους μύες.'},
      {title: 'Ήπια κίνηση', text: 'Η γιόγκα, οι διατάσεις και το ελαφρύ περπάτημα ανακουφίζουν την ένταση.'},
      {title: 'Διατροφή', text: 'Μαγνήσιο, ωμέγα-3 και αντιφλεγμονώδη τρόφιμα.'},
      {title: 'Ενυδάτωση', text: 'Η επαρκής πρόσληψη νερού βοηθά να περιοριστεί το φούσκωμα.'},
      {title: 'Μασάζ', text: 'Ένα κυκλικό μασάζ στην κάτω κοιλιά σε βοηθά να χαλαρώσεις.'},
    ],
    section3Text: 'Αν ο πόνος σε εμποδίζει να ζεις κανονικά κάθε μήνα παρά αυτές τις λύσεις, είναι σημαντικό να μιλήσεις με έναν επαγγελματία υγείας.',
    alertTitle: 'Επισκέψου γιατρό αν',
    alertText: 'Έχεις πολύ έντονο πόνο, έντονη αιμορραγία, ακραία κόπωση ή μη φυσιολογικά συμπτώματα.',
    dailyTips: [
      'Ζέστανε απαλά το σώμα σου όταν ξυπνάς',
      'Προτίμησε μια ισορροπημένη διατροφή',
      'Αφιέρωσε χρόνο για να αναπνεύσεις και να χαλαρώσεις',
      'Παρακολούθησε τον κύκλο σου για να κατανοήσεις καλύτερα τον πόνο σου',
    ],
    shareMessage: 'Διαχείριση του πόνου της περιόδου — AWA',
  },
  fil: {
    badge: 'SAKIT',
    title: 'Pangangasiwa sa\nsakit ng regla',
    metaDuration: '7 min na babasahin',
    metaType: 'Gabay',
    metaLevel: 'Baguhan',
    metaValidated: 'Sinuring nilalaman',
    intro: 'Init, banayad na galaw, pagkain: mga gawing tunay na nagbibigay ng ginhawa.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Pag-unawa sa sakit ng regla',
      'Epektibong natural na solusyon',
      'Kailan dapat magpatingin sa doktor?',
      'Praktikal na payo sa araw-araw',
    ],
    section1Text: 'Nagmumula ang pulikat sa mga pagkontrata ng matris na tumutulong na alisin ang lining ng matris. Sanhi ito ng mga prostaglandin. Iba-iba ang reaksyon ng bawat katawan.',
    tip1Title: 'Mabuting malaman',
    tip1Text: 'Maaaring mag-iba ang sakit mula sa isang siklo hanggang sa susunod at hindi laging pareho.',
    solutions: [
      {title: 'Init', text: 'Ang hot water bottle sa ibabang tiyan ay maaaring magpa-relax ng mga kalamnan.'},
      {title: 'Banayad na galaw', text: 'Ang yoga, stretching, at magaang paglalakad ay nagpapaginhawa ng tensyon.'},
      {title: 'Pagkain', text: 'Magnesium, omega-3, at mga pagkaing anti-inflammatory.'},
      {title: 'Hydration', text: 'Ang pag-inom ng sapat na tubig ay tumutulong na limitahan ang pamamaga ng tiyan.'},
      {title: 'Masahe', text: 'Ang pabilog na masahe sa ibabang tiyan ay tumutulong na mag-relax.'},
    ],
    section3Text: 'Kung pinipigilan ka ng sakit na mamuhay nang normal bawat buwan sa kabila ng mga solusyong ito, mahalagang makipag-usap sa propesyonal sa kalusugan.',
    alertTitle: 'Magpatingin sa doktor kung',
    alertText: 'May napakatinding sakit, malakas na pagdurugo, matinding pagod, o hindi normal na mga sintomas.',
    dailyTips: [
      'Banayad na painitin ang katawan pagkagising',
      'Paboran ang balanseng pagkain',
      'Maglaan ng oras para huminga at mag-relax',
      'Subaybayan ang iyong siklo para mas maunawaan ang iyong sakit',
    ],
    shareMessage: 'Pangangasiwa sa sakit ng regla — AWA',
  },
  ta: {
    badge: 'வலி',
    title: 'மாதவிடாய் வலியை\nநிர்வகித்தல்',
    metaDuration: '7 நிமிடம் படிக்க',
    metaType: 'வழிகாட்டி',
    metaLevel: 'தொடக்க நிலை',
    metaValidated: 'மதிப்பாய்வு செய்யப்பட்ட உள்ளடக்கம்',
    intro: 'வெப்பம், மென்மையான இயக்கம், உணவு: உண்மையிலேயே நிவாரணம் தரும் பழக்கங்கள்.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      'மாதவிடாய் வலியைப் புரிந்துகொள்ளுதல்',
      'பயனுள்ள இயற்கைத் தீர்வுகள்',
      'மருத்துவரை எப்போது பார்க்க வேண்டும்?',
      'நடைமுறை அன்றாடக் குறிப்புகள்',
    ],
    section1Text: 'பிடிப்புகள் கருப்பையின் சுருக்கங்களிலிருந்து வருகின்றன, அவை கருப்பை உள்படலத்தை வெளியேற்ற உதவுகின்றன. இவை புரோஸ்டாகிளாண்டின்களால் ஏற்படுகின்றன. ஒவ்வொரு உடலும் வேறுபட்ட விதத்தில் எதிர்வினையாற்றுகிறது.',
    tip1Title: 'தெரிந்துகொள்ளுங்கள்',
    tip1Text: 'வலி ஒரு சுழற்சியிலிருந்து மற்றொன்றுக்கு மாறுபடலாம், எப்போதும் ஒரே மாதிரி இருக்காது.',
    solutions: [
      {title: 'வெப்பம்', text: 'அடிவயிற்றில் வைக்கும் வெந்நீர்ப் பை தசைகளைத் தளர்த்தலாம்.'},
      {title: 'மென்மையான இயக்கம்', text: 'யோகா, நீட்டுதல் மற்றும் இலகுவான நடை இறுக்கத்தைத் தணிக்கின்றன.'},
      {title: 'உணவு', text: 'மெக்னீசியம், ஒமேகா-3 மற்றும் அழற்சி எதிர்ப்பு உணவுகள்.'},
      {title: 'நீர்ச்சத்து', text: 'போதுமான நீர் அருந்துவது வயிறு உப்புசத்தைக் குறைக்க உதவுகிறது.'},
      {title: 'மசாஜ்', text: 'அடிவயிற்றில் வட்டவடிவ மசாஜ் தளர்வடைய உதவுகிறது.'},
    ],
    section3Text: 'இந்தத் தீர்வுகள் இருந்தும் வலி ஒவ்வொரு மாதமும் நீங்கள் இயல்பாக வாழ்வதைத் தடுத்தால், ஒரு சுகாதார நிபுணரிடம் பேசுவது முக்கியம்.',
    alertTitle: 'இவை இருந்தால் மருத்துவரைப் பாருங்கள்',
    alertText: 'மிகத் தீவிரமான வலி, கடுமையான இரத்தப்போக்கு, அதீதச் சோர்வு அல்லது இயல்புக்கு மாறான அறிகுறிகள்.',
    dailyTips: [
      'காலை எழுந்ததும் உங்கள் உடலை மெதுவாகச் சூடாக்குங்கள்',
      'சமச்சீர் உணவுக்கு முன்னுரிமை கொடுங்கள்',
      'சுவாசிக்கவும் ஓய்வெடுக்கவும் நேரம் ஒதுக்குங்கள்',
      'உங்கள் வலியை நன்கு புரிந்துகொள்ள உங்கள் சுழற்சியைக் கண்காணியுங்கள்',
    ],
    shareMessage: 'மாதவிடாய் வலியை நிர்வகித்தல் — AWA',
  },
  te: {
    badge: 'నొప్పి',
    title: 'నెలసరి నొప్పిని\nనిర్వహించడం',
    metaDuration: '7 నిమిషాల పఠనం',
    metaType: 'గైడ్',
    metaLevel: 'ప్రారంభ స్థాయి',
    metaValidated: 'మదింపు చేసిన కంటెంట్',
    intro: 'వెచ్చదనం, మృదువైన కదలిక, ఆహారం: నిజంగా ఉపశమనం ఇచ్చే అలవాట్లు.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      'నెలసరి నొప్పిని అర్థం చేసుకోవడం',
      'ప్రభావవంతమైన సహజ పరిష్కారాలు',
      'వైద్యుడిని ఎప్పుడు కలవాలి?',
      'ఆచరణాత్మక రోజువారీ చిట్కాలు',
    ],
    section1Text: 'పొత్తికడుపు నొప్పి కాపు కణజాల పొరను వెలుపలికి పంపడానికి సహాయపడే గర్భాశయ సంకోచాల నుండి వస్తుంది. ఇది ప్రొస్టాగ్లాండిన్ల వల్ల కలుగుతుంది. ప్రతి శరీరం భిన్నంగా స్పందిస్తుంది.',
    tip1Title: 'తెలుసుకోవాల్సినవి',
    tip1Text: 'నొప్పి ఒక చక్రం నుండి మరొక చక్రానికి మారవచ్చు, ఎల్లప్పుడూ ఒకేలా ఉండదు.',
    solutions: [
      {title: 'వెచ్చదనం', text: 'అడుగు పొట్టపై వెచ్చని నీటి సీసా కండరాలను తేలికపరచవచ్చు.'},
      {title: 'మృదువైన కదలిక', text: 'యోగా, నీట్చడం, తేలికపాటి నడక బిగుతును తగ్గిస్తాయి.'},
      {title: 'ఆహారం', text: 'మెగ్నీషియం, ఒమేగా-3లు, వాపు తగ్గించే ఆహారాలు.'},
      {title: 'నీటి శాతం', text: 'తగినంత నీరు తాగడం ఉబ్బరాన్ని పరిమితం చేయడానికి సహాయపడుతుంది.'},
      {title: 'మసాజ్', text: 'అడుగు పొట్టపై వృత్తాకార మసాజ్ తేలికపడటానికి సహాయపడుతుంది.'},
    ],
    section3Text: 'ఈ పరిష్కారాలు ఉన్నా నొప్పి ప్రతి నెలా మీరు సాధారణంగా జీవించడాన్ని అడ్డుకుంటే, ఒక ఆరోగ్య నిపుణుడితో మాట్లాడటం ముఖ్యం.',
    alertTitle: 'ఇవి ఉంటే వైద్యుడిని కలవండి',
    alertText: 'చాలా తీవ్రమైన నొప్పి, ఎక్కువ రక్తస్రావం, అతిగా అలసట లేదా అసాధారణ లక్షణాలు.',
    dailyTips: [
      'నిద్ర లేవగానే మీ శరీరాన్ని మెల్లగా వేడెక్కించండి',
      'సమతుల్య ఆహారానికి ప్రాధాన్యం ఇవ్వండి',
      'శ్వాస తీసుకోవడానికి, తేలికపడటానికి సమయం తీసుకోండి',
      'మీ నొప్పిని మరింత బాగా అర్థం చేసుకోవడానికి మీ చక్రాన్ని ట్రాక్ చేయండి',
    ],
    shareMessage: 'నెలసరి నొప్పిని నిర్వహించడం — AWA',
  },
  mr: {
    badge: 'वेदना',
    title: 'पाळीतील वेदना\nसांभाळणे',
    metaDuration: '7 मिनिटे वाचन',
    metaType: 'मार्गदर्शक',
    metaLevel: 'प्रारंभ स्तर',
    metaValidated: 'पुनरावलोकन केलेला मजकूर',
    intro: 'ऊब, हलकी हालचाल, आहार: खरोखर आराम देणाऱ्या सवयी.',
    contentsTitle: 'या लेखात',
    topics: [
      'पाळीतील वेदना समजून घेणे',
      'परिणामकारक नैसर्गिक उपाय',
      'डॉक्टरांना केव्हा भेटावे?',
      'रोजच्या व्यावहारिक टिपा',
    ],
    section1Text: 'पेटके गर्भाशयाच्या आकुंचनांमुळे येतात, जी गर्भाशयाची पटल बाहेर टाकण्यास मदत करतात. ती प्रोस्टाग्लँडिन्समुळे होतात. प्रत्येक शरीर वेगळी प्रतिक्रिया देते.',
    tip1Title: 'हे जाणून घ्या',
    tip1Text: 'वेदना एका पाळीपासून दुसऱ्या पाळीपर्यंत बदलू शकते आणि नेहमी सारखीच नसते.',
    solutions: [
      {title: 'ऊब', text: 'पोटाच्या खालच्या भागावर गरम पाण्याची पिशवी स्नायूंना शिथिल करू शकते.'},
      {title: 'हलकी हालचाल', text: 'योग, स्ट्रेचिंग आणि हलके चालणे ताण कमी करतात.'},
      {title: 'आहार', text: 'मॅग्नेशियम, ओमेगा-3 आणि दाहविरोधी पदार्थ.'},
      {title: 'पाण्याचे सेवन', text: 'पुरेसे पाणी प्यायल्याने पोट फुगणे मर्यादित राहण्यास मदत होते.'},
      {title: 'मालिश', text: 'पोटाच्या खालच्या भागावर गोलाकार मालिश तुम्हाला शिथिल होण्यास मदत करते.'},
    ],
    section3Text: 'या उपायांनंतरही वेदना दर महिन्याला तुम्हाला सामान्यपणे जगू देत नसेल, तर आरोग्य व्यावसायिकाशी बोलणे महत्त्वाचे आहे.',
    alertTitle: 'याप्रसंगी डॉक्टरांना भेटा',
    alertText: 'खूप तीव्र वेदना, जास्त रक्तस्राव, अति थकवा किंवा असामान्य लक्षणे.',
    dailyTips: [
      'जाग आल्यावर तुमचे शरीर हळुवारपणे गरम करा',
      'संतुलित आहाराला प्राधान्य द्या',
      'श्वास घेण्यासाठी आणि शिथिल होण्यासाठी वेळ काढा',
      'तुमच्या वेदना अधिक चांगल्या समजण्यासाठी तुमच्या पाळीचा मागोवा घ्या',
    ],
    shareMessage: 'पाळीतील वेदना सांभाळणे — AWA',
  },
  gu: {
    badge: 'દુખાવો',
    title: 'માસિકના દુખાવાનું\nસંચાલન',
    metaDuration: '7 મિનિટ વાંચન',
    metaType: 'માર્ગદર્શિકા',
    metaLevel: 'પ્રારંભિક સ્તર',
    metaValidated: 'પુનરાવલોકન કરેલી સામગ્રી',
    intro: 'ગરમી, હળવું હલનચલન, આહાર: એવી ટેવો જે ખરેખર રાહત આપે છે.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      'માસિકનો દુખાવો સમજવો',
      'અસરકારક કુદરતી ઉપાયો',
      'ક્યારે ડૉક્ટરને મળવું જોઈએ?',
      'રોજિંદા વ્યવહારુ સૂચનો',
    ],
    section1Text: 'ખેંચાણ ગર્ભાશયના સંકોચનથી થાય છે, જે ગર્ભાશયના અસ્તરને બહાર કાઢવામાં મદદ કરે છે. તે પ્રોસ્ટાગ્લેન્ડિનને કારણે થાય છે. દરેક શરીર અલગ રીતે પ્રતિભાવ આપે છે.',
    tip1Title: 'જાણવા જેવું',
    tip1Text: 'દુખાવો એક ચક્રથી બીજા ચક્રમાં બદલાઈ શકે છે અને હંમેશાં એકસરખો હોતો નથી.',
    solutions: [
      {title: 'ગરમી', text: 'નીચલા પેટ પર ગરમ પાણીની બોટલ સ્નાયુઓને હળવા કરી શકે છે.'},
      {title: 'હળવું હલનચલન', text: 'યોગ, સ્ટ્રેચિંગ અને હળવું ચાલવું તણાવમાં રાહત આપે છે.'},
      {title: 'આહાર', text: 'મેગ્નેશિયમ, ઓમેગા-3 અને સોજો ઘટાડતા ખોરાક.'},
      {title: 'પાણીનું પ્રમાણ', text: 'પૂરતું પાણી પીવાથી પેટનું ફૂલવું મર્યાદિત કરવામાં મદદ મળે છે.'},
      {title: 'માલિશ', text: 'નીચલા પેટ પર ગોળાકાર માલિશ તમને હળવા થવામાં મદદ કરે છે.'},
    ],
    section3Text: 'જો આ ઉપાયો છતાં દુખાવો દર મહિને તમને સામાન્ય રીતે જીવવા ન દે, તો આરોગ્ય વ્યાવસાયિક સાથે વાત કરવી મહત્વનું છે.',
    alertTitle: 'આ સ્થિતિમાં ડૉક્ટરને મળો',
    alertText: 'ખૂબ તીવ્ર દુખાવો, વધુ પડતો સ્રાવ, અત્યંત થાક અથવા અસામાન્ય લક્ષણો.',
    dailyTips: [
      'સવારે ઊઠીને શરીરને હળવેથી ગરમ કરો',
      'સંતુલિત આહારને પ્રાધાન્ય આપો',
      'શ્વાસ લેવા અને આરામ કરવા માટે સમય કાઢો',
      'તમારા દુખાવાને વધુ સારી રીતે સમજવા માટે તમારા ચક્રની નોંધ રાખો',
    ],
    shareMessage: 'માસિકના દુખાવાનું સંચાલન — AWA',
  },
  pa: {
    badge: 'ਦਰਦ',
    title: 'ਮਾਹਵਾਰੀ ਦੇ ਦਰਦ\nਦੀ ਸੰਭਾਲ',
    metaDuration: '7 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਗਾਈਡ',
    metaLevel: 'ਸ਼ੁਰੂਆਤੀ ਪੱਧਰ',
    metaValidated: 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ',
    intro: 'ਗਰਮਾਹਟ, ਹਲਕੀ ਹਿਲਜੁਲ, ਖ਼ੁਰਾਕ: ਉਹ ਆਦਤਾਂ ਜੋ ਸੱਚਮੁੱਚ ਰਾਹਤ ਦਿੰਦੀਆਂ ਹਨ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      'ਮਾਹਵਾਰੀ ਦੇ ਦਰਦ ਨੂੰ ਸਮਝਣਾ',
      'ਕਾਰਗਰ ਕੁਦਰਤੀ ਹੱਲ',
      'ਡਾਕਟਰ ਨੂੰ ਕਦੋਂ ਮਿਲਣਾ ਚਾਹੀਦਾ ਹੈ?',
      'ਰੋਜ਼ਾਨਾ ਦੇ ਵਿਹਾਰਕ ਸੁਝਾਅ',
    ],
    section1Text: 'ਮਰੋੜ ਬੱਚੇਦਾਨੀ ਦੇ ਸੁੰਗੜਾਅ ਕਾਰਨ ਹੁੰਦੇ ਹਨ ਜੋ ਬੱਚੇਦਾਨੀ ਦੀ ਅੰਦਰਲੀ ਪਰਤ ਨੂੰ ਬਾਹਰ ਕੱਢਣ ਵਿੱਚ ਮਦਦ ਕਰਦੇ ਹਨ। ਇਹ ਪ੍ਰੋਸਟਾਗਲੈਂਡਿਨ ਕਾਰਨ ਹੁੰਦੇ ਹਨ। ਹਰ ਸਰੀਰ ਵੱਖਰੇ ਢੰਗ ਨਾਲ ਪ੍ਰਤੀਕਿਰਿਆ ਕਰਦਾ ਹੈ।',
    tip1Title: 'ਜਾਣਨ ਯੋਗ',
    tip1Text: 'ਦਰਦ ਇੱਕ ਚੱਕਰ ਤੋਂ ਦੂਜੇ ਵਿੱਚ ਵੱਖਰਾ ਹੋ ਸਕਦਾ ਹੈ ਅਤੇ ਹਮੇਸ਼ਾ ਇੱਕੋ ਜਿਹਾ ਨਹੀਂ ਹੁੰਦਾ।',
    solutions: [
      {title: 'ਗਰਮਾਹਟ', text: 'ਹੇਠਲੇ ਪੇਟ \'ਤੇ ਗਰਮ ਪਾਣੀ ਦੀ ਬੋਤਲ ਮਾਸਪੇਸ਼ੀਆਂ ਨੂੰ ਢਿੱਲਾ ਕਰ ਸਕਦੀ ਹੈ।'},
      {title: 'ਹਲਕੀ ਹਿਲਜੁਲ', text: 'ਯੋਗਾ, ਖਿੱਚਣ ਵਾਲੀਆਂ ਕਸਰਤਾਂ ਅਤੇ ਹਲਕੀ ਸੈਰ ਤਣਾਅ ਨੂੰ ਘਟਾਉਂਦੀਆਂ ਹਨ।'},
      {title: 'ਖ਼ੁਰਾਕ', text: 'ਮੈਗਨੀਸ਼ੀਅਮ, ਓਮੇਗਾ-3 ਅਤੇ ਸੋਜ ਘਟਾਉਣ ਵਾਲੇ ਭੋਜਨ।'},
      {title: 'ਪਾਣੀ ਦੀ ਮਾਤਰਾ', text: 'ਕਾਫ਼ੀ ਪਾਣੀ ਪੀਣਾ ਪੇਟ ਫੁੱਲਣ ਨੂੰ ਘੱਟ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।'},
      {title: 'ਮਾਲਿਸ਼', text: 'ਹੇਠਲੇ ਪੇਟ \'ਤੇ ਗੋਲ ਘੁੰਮਾ ਕੇ ਕੀਤੀ ਮਾਲਿਸ਼ ਤੁਹਾਨੂੰ ਆਰਾਮ ਦਿੰਦੀ ਹੈ।'},
    ],
    section3Text: 'ਜੇ ਇਹਨਾਂ ਹੱਲਾਂ ਦੇ ਬਾਵਜੂਦ ਦਰਦ ਹਰ ਮਹੀਨੇ ਤੁਹਾਨੂੰ ਆਮ ਜ਼ਿੰਦਗੀ ਜੀਣ ਤੋਂ ਰੋਕਦਾ ਹੈ, ਤਾਂ ਸਿਹਤ ਮਾਹਿਰ ਨਾਲ ਗੱਲ ਕਰਨਾ ਜ਼ਰੂਰੀ ਹੈ।',
    alertTitle: 'ਡਾਕਟਰ ਨੂੰ ਮਿਲੋ ਜੇ',
    alertText: 'ਬਹੁਤ ਤੇਜ਼ ਦਰਦ, ਬਹੁਤ ਜ਼ਿਆਦਾ ਖ਼ੂਨ ਵਹਿਣਾ, ਬਹੁਤ ਜ਼ਿਆਦਾ ਥਕਾਵਟ, ਜਾਂ ਅਸਾਧਾਰਨ ਲੱਛਣ।',
    dailyTips: [
      'ਸਵੇਰੇ ਉੱਠਣ \'ਤੇ ਆਪਣੇ ਸਰੀਰ ਨੂੰ ਹੌਲੀ-ਹੌਲੀ ਗਰਮ ਕਰੋ',
      'ਸੰਤੁਲਿਤ ਖ਼ੁਰਾਕ ਨੂੰ ਤਰਜੀਹ ਦਿਓ',
      'ਸਾਹ ਲੈਣ ਅਤੇ ਆਰਾਮ ਕਰਨ ਲਈ ਸਮਾਂ ਕੱਢੋ',
      'ਆਪਣੇ ਦਰਦ ਨੂੰ ਬਿਹਤਰ ਸਮਝਣ ਲਈ ਆਪਣੇ ਚੱਕਰ ਦਾ ਰਿਕਾਰਡ ਰੱਖੋ',
    ],
    shareMessage: 'ਮਾਹਵਾਰੀ ਦੇ ਦਰਦ ਦੀ ਸੰਭਾਲ — AWA',
  },
  my: {
    badge: 'နာကျင်ခြင်း',
    title: 'ရာသီလာချိန်\nနာကျင်ခြင်းကို စီမံခြင်း',
    metaDuration: 'ဖတ်ချိန် 7 မိနစ်',
    metaType: 'လမ်းညွှန်',
    metaLevel: 'အခြေခံအဆင့်',
    metaValidated: 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ',
    intro: 'အပူပေးခြင်း၊ ညင်သာသော လှုပ်ရှားမှု၊ အစားအစာ။ သက်သာမှုကို တကယ်ပေးသည့် အကျင့်များ။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'ရာသီလာချိန် နာကျင်ခြင်းကို နားလည်ခြင်း',
      'ထိရောက်သော သဘာဝနည်းလမ်းများ',
      'ဆရာဝန်ကို ဘယ်အချိန်ပြသင့်သလဲ။',
      'နေ့စဉ်အသုံးဝင်သော လက်တွေ့အကြံပြုချက်များ',
    ],
    section1Text: 'ဝမ်းဗိုက်နာခြင်းသည် သားအိမ်အတွင်းနံရံကို ထုတ်ပစ်ရန် ကူညီသော သားအိမ်ကြွက်သား ကျုံ့ခြင်းများကြောင့် ဖြစ်သည်။ ၎င်းတို့ကို ပရော့စတာဂလန်ဒင်များက ဖြစ်စေသည်။ ခန္ဓာကိုယ်တစ်ခုစီ တုံ့ပြန်ပုံ မတူပါ။',
    tip1Title: 'သိထားသင့်သည်',
    tip1Text: 'နာကျင်မှုသည် ရာသီစက်ဝန်းတစ်ခုနှင့် တစ်ခုကြား ကွာခြားနိုင်ပြီး အမြဲတမ်း တူညီမနေပါ။',
    solutions: [
      {title: 'အပူပေးခြင်း', text: 'အောက်ဝမ်းဗိုက်ပေါ်တွင် ရေနွေးအိတ်တင်ခြင်းသည် ကြွက်သားများကို ဖြေလျှော့ပေးနိုင်သည်။'},
      {title: 'ညင်သာသော လှုပ်ရှားမှု', text: 'ယောဂ၊ ကြွက်သားဆန့်ခြင်းနှင့် ပေါ့ပါးသော လမ်းလျှောက်ခြင်းတို့သည် တင်းမာမှုကို သက်သာစေသည်။'},
      {title: 'အစားအစာ', text: 'မဂ္ဂနီဆီယမ်၊ အိုမီဂါ-3 နှင့် ရောင်ရမ်းမှုကို တိုက်ဖျက်သော အစားအစာများ။'},
      {title: 'ရေသောက်မှု', text: 'ရေလုံလောက်စွာ သောက်ခြင်းသည် ဗိုက်ရောင်ခြင်းကို ကန့်သတ်ရန် ကူညီသည်။'},
      {title: 'နှိပ်နယ်ခြင်း', text: 'အောက်ဝမ်းဗိုက်ကို စက်ဝိုင်းပုံ နှိပ်နယ်ခြင်းသည် ဖြေလျှော့ရန် ကူညီသည်။'},
    ],
    section3Text: 'ဤနည်းလမ်းများရှိသော်လည်း နာကျင်မှုကြောင့် လစဉ် ပုံမှန်နေထိုင်ရန် မတတ်နိုင်လျှင် ကျန်းမာရေးပညာရှင်နှင့် ပြောဆိုရန် အရေးကြီးသည်။',
    alertTitle: 'ဤအခြေအနေများတွင် ဆရာဝန်ကို ပြပါ',
    alertText: 'အလွန်ပြင်းထန်သော နာကျင်မှု၊ သွေးအလွန်များစွာ ထွက်ခြင်း၊ အလွန်ပင်ပန်းနွမ်းနယ်ခြင်း သို့မဟုတ် ပုံမှန်မဟုတ်သော ရောဂါလက္ခဏာများ။',
    dailyTips: [
      'နိုးလာသောအခါ ခန္ဓာကိုယ်ကို ညင်သာစွာ အပူပေးပါ',
      'ဟန်ချက်ညီသော အစားအသောက်ကို ဦးစားပေးပါ',
      'အသက်ရှူရန်နှင့် ဖြေလျှော့ရန် အချိန်ယူပါ',
      'သင်၏ နာကျင်မှုကို ပိုနားလည်ရန် ရာသီစက်ဝန်းကို မှတ်တမ်းတင်ပါ',
    ],
    shareMessage: 'ရာသီလာချိန် နာကျင်ခြင်းကို စီမံခြင်း — AWA',
  },
  km: {
    badge: 'ការឈឺចាប់',
    title: 'ការគ្រប់គ្រងការឈឺ\nពោះរដូវ',
    metaDuration: 'អាន 7 នាទី',
    metaType: 'មគ្គុទ្ទេសក៍',
    metaLevel: 'កម្រិតដំបូង',
    metaValidated: 'មាតិកាបានពិនិត្យ',
    intro: 'ភាពកក់ក្តៅ ចលនាថ្នមៗ របបអាហារ៖ ទម្លាប់ដែលនាំមកនូវការធូរស្រាលពិតប្រាកដ។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'ការយល់ដឹងអំពីការឈឺពោះរដូវ',
      'ដំណោះស្រាយធម្មជាតិដែលមានប្រសិទ្ធភាព',
      'ពេលណាគួរជួបវេជ្ជបណ្ឌិត?',
      'គន្លឹះអនុវត្តប្រចាំថ្ងៃ',
    ],
    section1Text: 'ការឈឺពោះកើតចេញពីការកន្ត្រាក់នៃស្បូន ដែលជួយបញ្ចេញស្រទាប់ក្នុងស្បូន។ វាបណ្តាលមកពីប្រូស្តាគ្លែនឌីន។ រាងកាយនីមួយៗមានប្រតិកម្មខុសគ្នា។',
    tip1Title: 'គួរដឹង',
    tip1Text: 'ការឈឺចាប់អាចខុសគ្នាពីវដ្តមួយទៅវដ្តមួយ ហើយមិនតែងតែដូចគ្នាទេ។',
    solutions: [
      {title: 'ភាពកក់ក្តៅ', text: 'ដបទឹកក្តៅនៅលើផ្នែកខាងក្រោមនៃពោះអាចបន្ធូរសាច់ដុំ។'},
      {title: 'ចលនាថ្នមៗ', text: 'យូហ្គា ការលាតសន្ធឹងសាច់ដុំ និងការដើរស្រាលៗ ជួយបន្ធូរភាពតានតឹង។'},
      {title: 'របបអាហារ', text: 'ម៉ាញ៉េស្យូម អូមេហ្គា-3 និងអាហារប្រឆាំងនឹងការរលាក។'},
      {title: 'ការផឹកទឹក', text: 'ការផឹកទឹកឱ្យគ្រប់គ្រាន់ជួយកាត់បន្ថយការហើមពោះ។'},
      {title: 'ការម៉ាស្សា', text: 'ការម៉ាស្សាជារង្វង់លើផ្នែកខាងក្រោមនៃពោះជួយឱ្យអ្នកបន្ធូរបន្ធាយ។'},
    ],
    section3Text: 'ប្រសិនបើការឈឺចាប់រារាំងអ្នកមិនឱ្យរស់នៅធម្មតារៀងរាល់ខែ ទោះបីជាប្រើដំណោះស្រាយទាំងនេះក៏ដោយ វាសំខាន់ណាស់ក្នុងការនិយាយជាមួយអ្នកជំនាញសុខាភិបាល។',
    alertTitle: 'ជួបវេជ្ជបណ្ឌិត ប្រសិនបើមាន',
    alertText: 'ការឈឺខ្លាំងណាស់ ឈាមចេញច្រើន ការអស់កម្លាំងខ្លាំង ឬរោគសញ្ញាមិនប្រក្រតី។',
    dailyTips: [
      'កម្តៅរាងកាយថ្នមៗនៅពេលភ្ញាក់ពីដំណេក',
      'ជ្រើសរើសរបបអាហារដែលមានតុល្យភាព',
      'ចំណាយពេលដកដង្ហើម និងបន្ធូរបន្ធាយ',
      'តាមដានវដ្តរដូវរបស់អ្នក ដើម្បីយល់ពីការឈឺចាប់របស់អ្នកបានប្រសើរជាងមុន',
    ],
    shareMessage: 'ការគ្រប់គ្រងការឈឺពោះរដូវ — AWA',
  },
  lo: {
    badge: 'ຄວາມເຈັບປວດ',
    title: 'ການຮັບມືກັບ\nເຈັບທ້ອງປະຈຳເດືອນ',
    metaDuration: 'ອ່ານ 7 ນາທີ',
    metaType: 'ຄູ່ມື',
    metaLevel: 'ລະດັບເລີ່ມຕົ້ນ',
    metaValidated: 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ',
    intro: 'ຄວາມຮ້ອນ, ການເຄື່ອນໄຫວເບົາໆ, ການກິນອາຫານ: ນິໄສທີ່ຊ່ວຍບັນເທົາໄດ້ແທ້ຈິງ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ເຂົ້າໃຈອາການເຈັບທ້ອງປະຈຳເດືອນ',
      'ວິທີທຳມະຊາດທີ່ມີປະສິດທິພາບ',
      'ເວລາໃດຄວນໄປພົບແພດ?',
      'ເຄັດລັບທີ່ໃຊ້ໄດ້ຈິງໃນຊີວິດປະຈຳວັນ',
    ],
    section1Text: 'ອາການເຈັບທ້ອງມາຈາກການບີບຕົວຂອງມົດລູກທີ່ຊ່ວຍຂັບເຍື່ອບຸມົດລູກອອກ. ມັນເກີດຈາກສານໂປຣສຕາແກລນດິນ. ຮ່າງກາຍແຕ່ລະຄົນຕອບສະໜອງບໍ່ຄືກັນ.',
    tip1Title: 'ຄວນຮູ້',
    tip1Text: 'ຄວາມເຈັບອາດແຕກຕ່າງກັນໃນແຕ່ລະຮອບເດືອນ ແລະ ບໍ່ຈຳເປັນຕ້ອງຄືກັນສະເໝີ.',
    solutions: [
      {title: 'ຄວາມຮ້ອນ', text: 'ຖົງນ້ຳຮ້ອນວາງເທິງທ້ອງນ້ອຍສາມາດຊ່ວຍຜ່ອນຄາຍກ້າມເນື້ອ.'},
      {title: 'ການເຄື່ອນໄຫວເບົາໆ', text: 'ໂຍຄະ, ການຢຽດກ້າມເນື້ອ ແລະ ການຍ່າງເບົາໆ ຊ່ວຍບັນເທົາຄວາມຕຶງຄຽດ.'},
      {title: 'ການກິນອາຫານ', text: 'ແມັກນີຊຽມ, ໂອເມກາ-3 ແລະ ອາຫານຕ້ານການອັກເສບ.'},
      {title: 'ການດື່ມນ້ຳ', text: 'ການດື່ມນ້ຳໃຫ້ພຽງພໍຊ່ວຍຈຳກັດອາການທ້ອງອືດ.'},
      {title: 'ການນວດ', text: 'ການນວດເປັນວົງມົນທີ່ທ້ອງນ້ອຍຊ່ວຍໃຫ້ຜ່ອນຄາຍ.'},
    ],
    section3Text: 'ຖ້າຄວາມເຈັບເຮັດໃຫ້ທ່ານບໍ່ສາມາດໃຊ້ຊີວິດຕາມປົກກະຕິທຸກເດືອນ ເຖິງວ່າຈະໃຊ້ວິທີເຫຼົ່ານີ້ແລ້ວ ກໍສຳຄັນທີ່ຈະເວົ້າລົມກັບຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບ.',
    alertTitle: 'ໄປພົບແພດຖ້າມີ',
    alertText: 'ຄວາມເຈັບຮຸນແຮງຫຼາຍ, ເລືອດອອກຫຼາຍ, ອ່ອນເພຍຫຼາຍ ຫຼື ອາການຜິດປົກກະຕິ.',
    dailyTips: [
      'ອົບອຸ່ນຮ່າງກາຍເບົາໆເມື່ອຕື່ນນອນ',
      'ເລືອກກິນອາຫານທີ່ສົມດຸນ',
      'ໃຊ້ເວລາຫາຍໃຈ ແລະ ຜ່ອນຄາຍ',
      'ຕິດຕາມຮອບເດືອນເພື່ອເຂົ້າໃຈຄວາມເຈັບຂອງທ່ານໃຫ້ດີຂຶ້ນ',
    ],
    shareMessage: 'ການຮັບມືກັບເຈັບທ້ອງປະຈຳເດືອນ — AWA',
  },
} as const);

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

export default function PeriodPainArticleScreen({
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
          saveScrollPosition(
            ID,
            event.nativeEvent.contentOffset.y,
          )
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
          <Image
            source={HERO}
            resizeMode="cover"
            style={styles.hero}
          />

          <View
            style={[
              styles.top,
              {
                paddingTop: getTopPadding(insets.top, true),
              },
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
                icon={
                    saved
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
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
            <AwaText variant="labelSmall" emphasized colorRole="primary">
              {content.badge}
            </AwaText>
          </View>

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

          <View style={styles.metas}>
            {[
              ['clock-outline', content.metaDuration],
              [
                'book-open-page-variant-outline',
                content.metaType,
              ],
              ['chart-bar', content.metaLevel],
              [
                'shield-check-outline',
                content.metaValidated,
              ],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? (
                  <View style={styles.metaDivider} />
                ) : null}

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color={theme.colors.textMuted}
                    size={17}
                  />

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
                    {text}
                  </AwaText>
                </View>
              </React.Fragment>
            ))}
          </View>

          <AwaText variant="titleMedium" style={styles.intro}>
            {content.intro}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>
              {content.contentsTitle}
            </AwaText>

            {content.topics.map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="titleSmall" emphasized colorRole="primary" style={styles.contentNumber}>
                    {index + 1}.
                  </AwaText>

                  <AwaText variant="bodyMedium" style={styles.contentText}>
                    {item}
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            1. {content.topics[0]}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section1Text}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.tip1Title}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip1Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.topics[1]}
          </AwaText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.solutions}>
            {content.solutions.map(({title, text}, index) => (
              <View
                key={title}
                style={styles.solution}>
                <Image
                  source={SOL_IMAGES[index]}
                  resizeMode="cover"
                  style={styles.solImage}
                />

                <AwaText variant="titleSmall" emphasized style={styles.solTitle}>
                  {title}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.solText}>
                  {text}
                </AwaText>
              </View>
            ))}
          </ScrollView>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            3. {content.topics[2]}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section3Text}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.alertTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.alertText}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            4. {content.topics[3]}
          </AwaText>

          <View style={styles.daily}>
            {content.dailyTips.map((text, index) => (
              <View
                key={text}
                style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={DAILY_ICONS[index] as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>
                  {text}
                </AwaText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={7}
        scrollRef={scrollRef}
      />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scroll: {
    paddingBottom: 32,
  },

  heroWrap: {
    height: 245,
  },

  hero: {
    width: '100%',
    height: '100%',
  },

  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
  },



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

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
  },


  intro: {
    marginTop: 16,
  },

  contents: {
    marginTop: 20,
    padding: 16,
  },

  contentsTitle: {
    marginBottom: 8,
  },

  contentRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  contentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  contentNumber: {
    width: 24,
  },

  contentText: {
    flex: 1,
  },

  h2: {
    marginTop: 24,
  },

  body: {
    marginTop: 8,
  },

  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  tipCopy: {
    flex: 1,
    marginLeft: 12,
  },


  tipText: {
    marginTop: 3,
  },

  solutions: {
    gap: 8,
    paddingTop: 12,
    paddingBottom: 3,
  },

  solution: {
    width: 132,
    minHeight: 215,
    padding: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },

  solImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },

  solTitle: {
    marginTop: 8,
  },

  solText: {
    marginTop: 8,
    textAlign: 'center',
  },

  daily: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

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
  });
}