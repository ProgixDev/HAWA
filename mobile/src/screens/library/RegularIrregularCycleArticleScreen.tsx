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
import {
  isArticleBookmarked,
  loadLibraryState,
  saveScrollPosition,
  toggleBookmark,
} from '../../state/libraryStore';
import ReadingControls from '../../components/articles/ReadingControls';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
import {getBottomPadding, getTopPadding, READING_CONTROLS_SPACE} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {resolveEditorialLanguage} from '../../i18n/editorialLanguage';
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

const ID = 'cycle-comprendre-ton-cycle';

const HERO = require('../../assets/images/library/regular-cycle-hero.png');

const ART = {
  calendar: require('../../assets/images/library/regular-cycle-calendar.png'),
  heartbeat: require('../../assets/images/library/regular-cycle-heartbeat.png'),
  causes: require('../../assets/images/library/regular-cycle-causes.png'),
  consult: require('../../assets/images/library/regular-cycle-consult.png'),
  balance: require('../../assets/images/library/regular-cycle-balance.png'),
};

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const CAUSE_ICONS = [
  'head-heart-outline',
  'molecule',
  'weather-night',
  'scale-bathroom',
  'human-female',
] as const;

const ADVICE_ICONS = [
  'bowl-mix-outline',
  'water-outline',
  'shoe-sneaker',
  'meditation',
  'weather-night',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('RegularIrregularCycle', {
  fr: {
    badge: 'CYCLE & RÈGLES',
    title: 'Cycle régulier ou irrégulier :\nquelles différences ?',
    metaDuration: '5 min de lecture',
    metaValidated: 'Contenu validé',
    intro:
      'Chaque cycle menstruel est unique. Comprendre ce qui est considéré comme “normal” peut t’aider à mieux suivre ta santé et à détecter d’éventuels déséquilibres.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Cycle menstruel régulier : qu’est-ce que c’est ?',
      'Cycle irrégulier : qu’est-ce que cela signifie ?',
      'Causes possibles d’un cycle irrégulier',
      'Quand faut-il consulter ?',
      'Conseils pour un cycle plus équilibré',
    ],
    section1Body:
      'Un cycle est considéré comme régulier lorsque sa durée varie entre 21 et 35 jours, avec une différence de moins de 7 jours d’un cycle à l’autre.',
    section1VisualTitle: 'Un rythme relativement stable',
    section1VisualText:
      'L’important est surtout d’observer ton propre rythme au fil des mois.',
    tip1Title: 'Bon à savoir',
    tip1Text:
      'Chaque femme est différente. L’important est de connaître son propre rythme et ses variations normales.',
    section2Body:
      'Un cycle est dit irrégulier lorsque sa durée varie souvent ou de manière imprévisible (plus de 7 jours d’écart). Cela peut se traduire par des cycles très courts, très longs ou l’absence d’ovulation.',
    section2VisualTitle: 'Des variations plus marquées',
    section2VisualText:
      'Les écarts peuvent être temporaires ou s’installer sur plusieurs cycles.',
    alertTitle: 'À noter',
    alertText:
      'L’irrégularité temporaire peut être normale (stress, changements hormonaux, fatigue…). Mais si elle persiste, il est important d’en rechercher la cause.',
    causes: [
      'Stress & anxiété',
      'Déséquilibres hormonaux',
      'Manque de sommeil & fatigue',
      'Poids trop bas ou trop élevé',
      'SOPK ou autres conditions médicales',
    ],
    checklist: [
      'Absence de règles pendant plus de 3 mois (hors grossesse/allaitement)',
      'Cycles très longs (plus de 90 jours) ou très courts (moins de 21 jours)',
      'Douleurs intenses qui t’empêchent de vivre normalement',
      'Saignements très abondants ou irréguliers',
      'Si tu souhaites concevoir et que l’ovulation semble absente',
    ],
    advice: [
      'Alimentation équilibrée',
      'Hydratation suffisante',
      'Activité physique',
      'Gestion du stress',
      'Sommeil de qualité',
    ],
    shareMessage: 'Cycle régulier ou irrégulier : quelles différences ? — AWA',
  },
  en: {
    badge: 'CYCLE & PERIODS',
    title: 'Regular or irregular cycle:\nwhat’s the difference?',
    metaDuration: '5 min read',
    metaValidated: 'Reviewed content',
    intro:
      'Every menstrual cycle is unique. Understanding what’s considered “normal” can help you track your health more closely and spot possible imbalances.',
    contentsTitle: 'In this article',
    topics: [
      'Regular menstrual cycle: what is it?',
      'Irregular cycle: what does it mean?',
      'Possible causes of an irregular cycle',
      'When should you see a doctor?',
      'Tips for a more balanced cycle',
    ],
    section1Body:
      'A cycle is considered regular when its length varies between 21 and 35 days, with less than a 7-day difference from one cycle to the next.',
    section1VisualTitle: 'A fairly steady rhythm',
    section1VisualText:
      'What matters most is observing your own rhythm over the months.',
    tip1Title: 'Good to know',
    tip1Text:
      'Every woman is different. What matters is knowing your own rhythm and its normal variations.',
    section2Body:
      'A cycle is considered irregular when its length varies often or unpredictably (a difference of more than 7 days). This can show up as very short cycles, very long cycles, or an absence of ovulation.',
    section2VisualTitle: 'More noticeable variations',
    section2VisualText:
      'These differences can be temporary or persist over several cycles.',
    alertTitle: 'Please note',
    alertText:
      'Temporary irregularity can be normal (stress, hormonal changes, fatigue…). But if it persists, it’s important to look into the cause.',
    causes: [
      'Stress & anxiety',
      'Hormonal imbalances',
      'Lack of sleep & fatigue',
      'Weight too low or too high',
      'PCOS or other medical conditions',
    ],
    checklist: [
      'No period for more than 3 months (outside of pregnancy/breastfeeding)',
      'Very long cycles (more than 90 days) or very short cycles (less than 21 days)',
      'Intense pain that keeps you from living normally',
      'Very heavy or irregular bleeding',
      'If you’re trying to conceive and ovulation seems to be absent',
    ],
    advice: [
      'Balanced diet',
      'Adequate hydration',
      'Physical activity',
      'Stress management',
      'Quality sleep',
    ],
    shareMessage: 'Regular or irregular cycle: what’s the difference? — AWA',
  },
  es: {
    badge: 'CICLO Y PERÍODO',
    title: 'Ciclo regular o irregular:\n¿qué diferencias hay?',
    metaDuration: '5 min de lectura',
    metaValidated: 'Contenido validado',
    intro:
      'Cada ciclo menstrual es único. Entender qué se considera «normal» puede ayudarte a hacer un mejor seguimiento de tu salud y a detectar posibles desequilibrios.',
    contentsTitle: 'En este artículo',
    topics: [
      'Ciclo menstrual regular: ¿qué es?',
      'Ciclo irregular: ¿qué significa?',
      'Posibles causas de un ciclo irregular',
      '¿Cuándo hay que consultar?',
      'Consejos para un ciclo más equilibrado',
    ],
    section1Body:
      'Se considera que un ciclo es regular cuando su duración varía entre 21 y 35 días, con una diferencia de menos de 7 días de un ciclo a otro.',
    section1VisualTitle: 'Un ritmo relativamente estable',
    section1VisualText:
      'Lo más importante es observar tu propio ritmo a lo largo de los meses.',
    tip1Title: 'Dato útil',
    tip1Text:
      'Cada mujer es diferente. Lo importante es conocer tu propio ritmo y sus variaciones normales.',
    section2Body:
      'Se dice que un ciclo es irregular cuando su duración varía con frecuencia o de forma imprevisible (una diferencia de más de 7 días). Esto puede traducirse en ciclos muy cortos, muy largos o en la ausencia de ovulación.',
    section2VisualTitle: 'Variaciones más marcadas',
    section2VisualText:
      'Las diferencias pueden ser temporales o mantenerse durante varios ciclos.',
    alertTitle: 'Ten en cuenta',
    alertText:
      'La irregularidad temporal puede ser normal (estrés, cambios hormonales, fatiga...). Pero si persiste, es importante buscar su causa.',
    causes: [
      'Estrés y ansiedad',
      'Desequilibrios hormonales',
      'Falta de sueño y fatiga',
      'Peso demasiado bajo o demasiado alto',
      'SOP u otras condiciones médicas',
    ],
    checklist: [
      'Ausencia de período durante más de 3 meses (fuera del embarazo o la lactancia)',
      'Ciclos muy largos (más de 90 días) o muy cortos (menos de 21 días)',
      'Dolores intensos que te impiden llevar una vida normal',
      'Sangrado muy abundante o irregular',
      'Si deseas concebir y la ovulación parece estar ausente',
    ],
    advice: [
      'Alimentación equilibrada',
      'Hidratación suficiente',
      'Actividad física',
      'Gestión del estrés',
      'Sueño de calidad',
    ],
    shareMessage: 'Ciclo regular o irregular: ¿qué diferencias hay? — AWA',
  },
  it: {
    badge: 'CICLO E MESTRUAZIONI',
    title: 'Ciclo regolare o irregolare:\nqual è la differenza?',
    metaDuration: '5 min di lettura',
    metaValidated: 'Contenuto validato',
    intro: 'Ogni ciclo mestruale è unico. Capire cosa si considera «normale» può aiutarti a seguire più da vicino la tua salute e a riconoscere possibili squilibri.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Ciclo mestruale regolare: che cos’è?',
      'Ciclo irregolare: cosa significa?',
      'Possibili cause di un ciclo irregolare',
      'Quando rivolgersi al medico?',
      'Consigli per un ciclo più equilibrato',
    ],
    section1Body: 'Un ciclo è considerato regolare quando la sua durata varia tra 21 e 35 giorni, con meno di 7 giorni di differenza da un ciclo all’altro.',
    section1VisualTitle: 'Un ritmo abbastanza stabile',
    section1VisualText: 'Ciò che conta di più è osservare il tuo ritmo nel corso dei mesi.',
    tip1Title: 'Da sapere',
    tip1Text: 'Ogni donna è diversa. L’importante è conoscere il proprio ritmo e le sue normali variazioni.',
    section2Body: 'Un ciclo è considerato irregolare quando la sua durata varia spesso o in modo imprevedibile (una differenza di più di 7 giorni). Può manifestarsi con cicli molto brevi, cicli molto lunghi o assenza di ovulazione.',
    section2VisualTitle: 'Variazioni più evidenti',
    section2VisualText: 'Queste differenze possono essere temporanee o persistere per più cicli.',
    alertTitle: 'Attenzione',
    alertText: 'Un’irregolarità temporanea può essere normale (stress, cambiamenti ormonali, stanchezza…). Ma se persiste, è importante indagarne la causa.',
    causes: [
      'Stress e ansia',
      'Squilibri ormonali',
      'Mancanza di sonno e stanchezza',
      'Peso troppo basso o troppo alto',
      'PCOS o altre condizioni mediche',
    ],
    checklist: [
      'Nessun periodo mestruale per più di 3 mesi (al di fuori di gravidanza/allattamento)',
      'Cicli molto lunghi (più di 90 giorni) o molto brevi (meno di 21 giorni)',
      'Dolore intenso che ti impedisce di vivere normalmente',
      'Sanguinamento molto abbondante o irregolare',
      'Se cerchi una gravidanza e l’ovulazione sembra assente',
    ],
    advice: [
      'Alimentazione equilibrata',
      'Idratazione adeguata',
      'Attività fisica',
      'Gestione dello stress',
      'Sonno di qualità',
    ],
    shareMessage: 'Ciclo regolare o irregolare: qual è la differenza? — AWA',
  },
  tr: {
    badge: 'DÖNGÜ VE ADET',
    title: 'Düzenli ya da düzensiz döngü:\nfark nedir?',
    metaDuration: '5 dk okuma',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Her adet döngüsü benzersizdir. “Normal” sayılanın ne olduğunu anlamak, sağlığını daha yakından takip etmene ve olası dengesizlikleri fark etmene yardımcı olabilir.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Düzenli adet döngüsü: nedir?',
      'Düzensiz döngü: ne anlama gelir?',
      'Düzensiz döngünün olası nedenleri',
      'Ne zaman doktora görünmelisin?',
      'Daha dengeli bir döngü için ipuçları',
    ],
    section1Body: 'Bir döngünün uzunluğu 21 ile 35 gün arasında değişiyorsa ve bir döngüden diğerine fark 7 günden azsa döngü düzenli kabul edilir.',
    section1VisualTitle: 'Oldukça sabit bir ritim',
    section1VisualText: 'En önemlisi, aylar boyunca kendi ritmini gözlemlemektir.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Her kadın farklıdır. Önemli olan kendi ritmini ve normal değişimlerini bilmektir.',
    section2Body: 'Bir döngünün uzunluğu sık sık ya da öngörülemez biçimde değişiyorsa (7 günden fazla fark) döngü düzensiz kabul edilir. Bu, çok kısa döngüler, çok uzun döngüler ya da yumurtlamanın olmaması şeklinde kendini gösterebilir.',
    section2VisualTitle: 'Daha belirgin değişimler',
    section2VisualText: 'Bu farklar geçici olabilir ya da birkaç döngü boyunca sürebilir.',
    alertTitle: 'Dikkat',
    alertText: 'Geçici düzensizlik normal olabilir (stres, hormonal değişimler, yorgunluk…). Ancak sürüyorsa nedenini araştırmak önemlidir.',
    causes: [
      'Stres ve kaygı',
      'Hormonal dengesizlikler',
      'Uykusuzluk ve yorgunluk',
      'Çok düşük ya da çok yüksek kilo',
      'PKOS ya da diğer tıbbi durumlar',
    ],
    checklist: [
      '3 aydan uzun süredir adet görmüyorsan (gebelik/emzirme dışında)',
      'Çok uzun döngüler (90 günden fazla) ya da çok kısa döngüler (21 günden az)',
      'Normal yaşamanı engelleyen yoğun ağrı',
      'Çok yoğun ya da düzensiz kanama',
      'Hamile kalmaya çalışıyorsan ve yumurtlama yokmuş gibi görünüyorsa',
    ],
    advice: [
      'Dengeli beslenme',
      'Yeterli sıvı alımı',
      'Fiziksel aktivite',
      'Stres yönetimi',
      'Kaliteli uyku',
    ],
    shareMessage: 'Düzenli ya da düzensiz döngü: fark nedir? — AWA',
  },
  ru: {
    badge: 'ЦИКЛ И МЕСЯЧНЫЕ',
    title: 'Регулярный или нерегулярный цикл:\nв чём разница?',
    metaDuration: '5 мин чтения',
    metaValidated: 'Проверенный материал',
    intro:
      'Каждый менструальный цикл уникален. Понимание того, что считается «нормой», поможет внимательнее следить за здоровьем и замечать возможные нарушения.',
    contentsTitle: 'В этой статье',
    topics: [
      'Регулярный менструальный цикл: что это?',
      'Нерегулярный цикл: что это значит?',
      'Возможные причины нерегулярного цикла',
      'Когда стоит обратиться к врачу?',
      'Советы для более сбалансированного цикла',
    ],
    section1Body:
      'Цикл считается регулярным, если его длительность колеблется от 21 до 35 дней, а разница между соседними циклами составляет менее 7 дней.',
    section1VisualTitle: 'Довольно стабильный ритм',
    section1VisualText:
      'Главное — наблюдать за собственным ритмом в течение нескольких месяцев.',
    tip1Title: 'ПОЛЕЗНО ЗНАТЬ',
    tip1Text:
      'Все женщины разные. Важно знать свой собственный ритм и его обычные колебания.',
    section2Body:
      'Цикл считается нерегулярным, если его длительность часто или непредсказуемо меняется (разница более 7 дней). Это могут быть очень короткие циклы, очень длинные циклы или отсутствие овуляции.',
    section2VisualTitle: 'Более заметные колебания',
    section2VisualText:
      'Эти различия могут быть временными или сохраняться в течение нескольких циклов.',
    alertTitle: 'Обратите внимание',
    alertText:
      'Временная нерегулярность может быть нормальной (стресс, гормональные изменения, усталость…). Но если она сохраняется, важно выяснить причину.',
    causes: [
      'Стресс и тревога',
      'Гормональный дисбаланс',
      'Недосып и усталость',
      'Слишком низкий или слишком высокий вес',
      'СПКЯ (синдром поликистозных яичников) или другие медицинские состояния',
    ],
    checklist: [
      'Нет месячных более 3 месяцев (вне беременности и грудного вскармливания)',
      'Очень длинные циклы (более 90 дней) или очень короткие циклы (менее 21 дня)',
      'Сильная боль, которая мешает вести обычную жизнь',
      'Очень обильные или нерегулярные кровотечения',
      'Вы планируете беременность, а овуляции, похоже, нет',
    ],
    advice: [
      'Сбалансированное питание',
      'Достаточное количество жидкости',
      'Физическая активность',
      'Управление стрессом',
      'Качественный сон',
    ],
    shareMessage: 'Регулярный или нерегулярный цикл: в чём разница? — AWA',
  },
  de: {
    badge: 'ZYKLUS & PERIODE',
    title: 'Regelmäßiger oder unregelmäßiger Zyklus:\nwas ist der Unterschied?',
    metaDuration: '5 Min. Lesezeit',
    metaValidated: 'Geprüfter Inhalt',
    intro:
      'Jeder Menstruationszyklus ist einzigartig. Wenn du weißt, was als „normal“ gilt, kannst du deine Gesundheit besser im Blick behalten und mögliche Ungleichgewichte erkennen.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Regelmäßiger Menstruationszyklus: Was ist das?',
      'Unregelmäßiger Zyklus: Was bedeutet das?',
      'Mögliche Ursachen eines unregelmäßigen Zyklus',
      'Wann solltest du zur Ärztin oder zum Arzt?',
      'Tipps für einen ausgeglicheneren Zyklus',
    ],
    section1Body:
      'Ein Zyklus gilt als regelmäßig, wenn seine Länge zwischen 21 und 35 Tagen liegt und sich von einem Zyklus zum nächsten um weniger als 7 Tage unterscheidet.',
    section1VisualTitle: 'Ein recht gleichmäßiger Rhythmus',
    section1VisualText:
      'Am wichtigsten ist, deinen eigenen Rhythmus über die Monate hinweg zu beobachten.',
    tip1Title: 'Gut zu wissen',
    tip1Text:
      'Jede Frau ist anders. Wichtig ist, deinen eigenen Rhythmus und seine normalen Schwankungen zu kennen.',
    section2Body:
      'Ein Zyklus gilt als unregelmäßig, wenn seine Länge häufig oder unvorhersehbar schwankt (um mehr als 7 Tage). Das können sehr kurze Zyklen, sehr lange Zyklen oder ausbleibende Eisprünge sein.',
    section2VisualTitle: 'Deutlichere Schwankungen',
    section2VisualText:
      'Diese Unterschiede können vorübergehend sein oder über mehrere Zyklen bestehen bleiben.',
    alertTitle: 'Bitte beachte',
    alertText:
      'Eine vorübergehende Unregelmäßigkeit kann normal sein (Stress, hormonelle Veränderungen, Erschöpfung …). Hält sie aber an, ist es wichtig, der Ursache auf den Grund zu gehen.',
    causes: [
      'Stress & Ängste',
      'Hormonelle Ungleichgewichte',
      'Schlafmangel & Erschöpfung',
      'Zu niedriges oder zu hohes Gewicht',
      'PCOS oder andere Erkrankungen',
    ],
    checklist: [
      'Länger als 3 Monate keine Periode (außerhalb von Schwangerschaft/Stillzeit)',
      'Sehr lange Zyklen (mehr als 90 Tage) oder sehr kurze Zyklen (weniger als 21 Tage)',
      'Starke Schmerzen, die dich im Alltag einschränken',
      'Sehr starke oder unregelmäßige Blutungen',
      'Wenn du schwanger werden möchtest und der Eisprung auszubleiben scheint',
    ],
    advice: [
      'Ausgewogene Ernährung',
      'Ausreichend trinken',
      'Körperliche Bewegung',
      'Stressbewältigung',
      'Erholsamer Schlaf',
    ],
    shareMessage: 'Regelmäßiger oder unregelmäßiger Zyklus: was ist der Unterschied? – AWA',
  },
  zh: {
      badge: '周期与月经',
      title: '周期规律还是不规律：\n有什么区别？',
      metaDuration: '阅读约 5 分钟',
      metaValidated: '已审核内容',
      intro: '每个月经周期都是独特的。了解什么算“正常”，可以帮你更细致地关注自己的健康，并发现可能的失衡。',
      contentsTitle: '本文内容',
      topics: [
        '规律的月经周期：是什么样的？',
        '不规律的周期：意味着什么？',
        '周期不规律的可能原因',
        '什么时候应该看医生？',
        '让周期更平稳的小建议',
      ],
      section1Body: '周期长度在 21 到 35 天之间，且相邻周期之间相差不到 7 天，通常被认为是规律的。',
      section1VisualTitle: '较为稳定的节律',
      section1VisualText: '最重要的是，在数月的时间里观察你自己的节律。',
      tip1Title: '小贴士',
      tip1Text: '每个女性都不一样。重要的是了解自己的节律和它正常的变化范围。',
      section2Body: '周期长度经常变化或难以预测（相差超过 7 天），通常被认为是不规律的。它可能表现为周期很短、周期很长，或没有排卵。',
      section2VisualTitle: '更明显的变化',
      section2VisualText: '这些差异可能是暂时的，也可能持续数个周期。',
      alertTitle: '请注意',
      alertText: '暂时的不规律可能是正常的（压力、激素变化、疲劳……）。但如果持续存在，就有必要查明原因。',
      causes: [
        '压力与焦虑',
        '激素失衡',
        '睡眠不足与疲劳',
        '体重过低或过高',
        '多囊卵巢综合征（PCOS）或其他疾病',
      ],
      checklist: [
        '超过 3 个月没有月经（怀孕或哺乳期除外）',
        '周期很长（超过 90 天）或很短（少于 21 天）',
        '剧烈疼痛，影响正常生活',
        '出血量很大或不规则',
        '正在备孕，而且似乎没有排卵',
      ],
      advice: [
        '均衡饮食',
        '充足饮水',
        '体育活动',
        '管理压力',
        '优质睡眠',
      ],
      shareMessage: '周期规律还是不规律：有什么区别？ — AWA',
    },
  'zh-Hant': {
      badge: '週期與月經',
      title: '週期規律還是不規律：\n有什麼區別？',
      metaDuration: '閱讀約 5 分鐘',
      metaValidated: '已稽核內容',
      intro: '每個月經週期都是獨特的。瞭解什麼算「正常」，可以幫你更細緻地關注自己的健康，並發現可能的失衡。',
      contentsTitle: '本文內容',
      topics: [
        '規律的月經週期：是什麼樣的？',
        '不規律的週期：意味著什麼？',
        '週期不規律的可能原因',
        '什麼時候應該看醫生？',
        '讓週期更平穩的小建議',
      ],
      section1Body: '週期長度在 21 到 35 天之間，且相鄰週期之間相差不到 7 天，通常被認為是規律的。',
      section1VisualTitle: '較為穩定的節律',
      section1VisualText: '最重要的是，在數月的時間裡觀察你自己的節律。',
      tip1Title: '小提醒',
      tip1Text: '每個女性都不一樣。重要的是瞭解自己的節律和它正常的變化範圍。',
      section2Body: '週期長度經常變化或難以預測（相差超過 7 天），通常被認為是不規律的。它可能表現為週期很短、週期很長，或沒有排卵。',
      section2VisualTitle: '更明顯的變化',
      section2VisualText: '這些差異可能是暫時的，也可能持續數個週期。',
      alertTitle: '請注意',
      alertText: '暫時的不規律可能是正常的（壓力、荷爾蒙變化、疲勞……）。但如果持續存在，就有必要查明原因。',
      causes: [
        '壓力與焦慮',
        '荷爾蒙失衡',
        '睡眠不足與疲勞',
        '體重過低或過高',
        '多囊性卵巢症候群（PCOS）或其他疾病',
      ],
      checklist: [
        '超過 3 個月沒有月經（懷孕或哺乳期除外）',
        '週期很長（超過 90 天）或很短（少於 21 天）',
        '劇烈疼痛，影響正常生活',
        '出血量很大或不規則',
        '正在備孕，而且似乎沒有排卵',
      ],
      advice: [
        '均衡飲食',
        '充足飲水',
        '體育活動',
        '管理壓力',
        '優質睡眠',
      ],
      shareMessage: '週期規律還是不規律：有什麼區別？ — AWA',
    },
  ar: {
    badge: 'الدورة والحيض',
    title: 'دورة منتظمة أو غير منتظمة:\nما الفرق؟',
    metaDuration: 'قراءة 5 دقائق',
    metaValidated: 'محتوى مراجَع',
    intro:
      'كل دورة شهرية فريدة. وفهم ما يُعدّ «طبيعيًا» قد يساعدك على متابعة صحتك عن كثب وملاحظة أي اختلالات محتملة.',
    contentsTitle: 'في هذا المقال',
    topics: [
      'الدورة الشهرية المنتظمة: ما هي؟',
      'الدورة غير المنتظمة: ماذا تعني؟',
      'الأسباب المحتملة لعدم انتظام الدورة',
      'متى يجب أن تراجعي الطبيب؟',
      'نصائح لدورة أكثر توازنًا',
    ],
    section1Body:
      'تُعدّ الدورة منتظمة عندما يتراوح طولها بين 21 و35 يومًا، مع فرق يقل عن 7 أيام بين دورة وأخرى.',
    section1VisualTitle: 'إيقاع ثابت نسبيًا',
    section1VisualText:
      'الأهم هو مراقبة إيقاعك الخاص على مدى الأشهر.',
    tip1Title: 'من المفيد أن تعرفي',
    tip1Text:
      'كل امرأة مختلفة. المهم أن تعرفي إيقاعك الخاص وتفاوتاته الطبيعية.',
    section2Body:
      'تُعدّ الدورة غير منتظمة عندما يتفاوت طولها كثيرًا أو بشكل غير متوقع (فرق يزيد على 7 أيام). وقد يظهر ذلك في دورات قصيرة جدًا أو طويلة جدًا أو غياب الإباضة.',
    section2VisualTitle: 'تفاوتات أوضح',
    section2VisualText:
      'قد تكون هذه الاختلافات مؤقتة أو تستمر على مدى عدة دورات.',
    alertTitle: 'يرجى الانتباه',
    alertText:
      'قد يكون عدم الانتظام المؤقت طبيعيًا (التوتر، والتغيّرات الهرمونية، والإرهاق…). لكن إذا استمر، فمن المهم البحث عن السبب.',
    causes: [
      'التوتر والقلق',
      'اختلالات هرمونية',
      'قلة النوم والإرهاق',
      'وزن منخفض جدًا أو مرتفع جدًا',
      'متلازمة تكيّس المبايض أو حالات طبية أخرى',
    ],
    checklist: [
      'انقطاع الحيض لأكثر من 3 أشهر (خارج الحمل والرضاعة)',
      'دورات طويلة جدًا (أكثر من 90 يومًا) أو قصيرة جدًا (أقل من 21 يومًا)',
      'ألم شديد يمنعك من عيش حياتك بشكل طبيعي',
      'نزف غزير جدًا أو غير منتظم',
      'إذا كنتِ تحاولين الحمل ويبدو أن الإباضة غائبة',
    ],
    advice: [
      'نظام غذائي متوازن',
      'ترطيب كافٍ',
      'نشاط بدني',
      'إدارة التوتر',
      'نوم جيد',
    ],
    shareMessage: 'دورة منتظمة أو غير منتظمة: ما الفرق؟ — AWA',
  },
  kab: {
    badge: 'DDAWRA & TIREGWA',
    title: 'Ddawra tamagnut neɣ ur nelli ara d tamagnut:\nd acu i d amgirred?',
    metaDuration: 'Taɣuri n 5 n tisdidin',
    metaValidated: 'Agbur yettwasenqed',
    intro:
      'Yal ddawra n tiregwa tbedd s timmad-is. Ma tfehmeḍ acu ttwaḥsaben d “amagnu” yettɛawan ad tḍefreḍ ṣṣeḥḥa-inek ugar u ad tafeḍ ayen izmer ad yili d ugur.',
    contentsTitle: 'Deg umagrad-a',
    topics: [
      'Ddawra n tiregwa tamagnut: d acu-t?',
      'Ddawra ur nelli ara d tamagnut: acu i d-tsemmal?',
      'Ssebbat izemren n ddawra ur nelli ara d tamagnut',
      'Melmi ara tẓerreḍ aṭṭbib?',
      'Iwellihen i ddawra yelhan ugar',
    ],
    section1Body:
      'Ddawra ttwaḥsab d tamagnut ma yella teɣzi-s temxalef gar 21 d 35 n wussan, s umgirred ur tezdi ara 7 n wussan seg yiwet ddawra ɣer tayeḍ.',
    section1VisualTitle: 'Agmuḍ yeqqwan s wudem amatu',
    section1VisualText:
      'Ayen yelhan d ad tɛassed agmuḍ-ik deg wayyuren.',
    tip1Title: 'Yelha ad tessneḍ',
    tip1Text:
      'Yal tameṭṭut temxalaf. Ayen yelhan d ad tessneḍ agmuḍ-ik d yisnifilen-is imagnuyen.',
    section2Body:
      'Ddawra ttwaḥsab ur nelli ara d tamagnut ma yella teɣzi-s temxalef s waṭas neɣ ur nelli ara d ayen yettwaẓran (amgirred n ugar n 7 n wussan). Waya izmer ad yettban deg ddurat imecṭuḥen aṭas, ddurat ɣezzifen aṭas, neɣ ulac ovulation.',
    section2VisualTitle: 'Isnifilen ittwaẓran ugar',
    section2VisualText:
      'Imgirred-a zemren ad ilin n lweqt kan neɣ ad kemmlen deg waṭas n ddurat.',
    alertTitle: 'Ur tettuḍeḍ ara',
    alertText:
      'Ddawra ur nelli ara d tamagnut n lweqt kan tezmer ad tili d tamagnut (aɣilif, isnifilen n yihurmunen, leɛyaṭ…). Maca ma tkemmel, yelha ad tnadiḍ ssebba.',
    causes: [
      'Aɣilif & uṭṭun',
      'Ur nelli ara d amagnu n yihurmunen',
      'Ulac anẓar & leɛyaṭ',
      'Azal ameẓẓyan aṭas neɣ ameqqran aṭas',
      'PCOS neɣ tuffiwin-nniḍen n ṣṣeḥḥa',
    ],
    checklist: [
      'Ulac tiregwa deg ugar n 3 n wayyuren (ɣer berra n lḥemla/uẓẓal)',
      'Ddurat ɣezzifen aṭas (ugar n 90 n wussan) neɣ ddurat imecṭuḥen aṭas (ddaw 21 n wussan)',
      'Lweǧɛ ameqqran i k-yeǧǧan ur tettidireḍ ara s wudem amagnu',
      'Idammen ameqqran aṭas neɣ ur nelli ara d imagnuyen',
      'Ma yella tettɛeddiḍ ad d-tawiḍ lḥemla u ovulation tettban ur tella ara',
    ],
    advice: [
      'Tuččit yemxalfen',
      'Asew yekfan n waman',
      'Tagnit n ugris',
      'Aḥkem deg uɣilif',
      'Anẓar yelhan',
    ],
    shareMessage: 'Ddawra tamagnut neɣ ur nelli ara d tamagnut: d acu i d amgirred? — AWA',
  },
  om: {
    badge: 'MARSAA FI LAGUU',
    title: 'Marsaa sirrii ykn sirrii hin taane:\ngaraagarummaan isaa maali?',
    metaDuration: 'Daqiiqaa 5 dubbisuu',
    metaValidated: 'Qabiyyee madaalame',
    intro:
      'Marsaan laguu hundi kan adda. “Baratamaa” jedhamee ilaalamu hubachuun fayyaa kee caalaatti hordofuu fi madaallii dogoggoraa tokko tokko arguuf si gargaaruu danda\'a.',
    contentsTitle: 'Barruu kana keessatti',
    topics: [
      'Marsaan laguu sirrii: maali?',
      'Marsaa sirrii hin taane: maal jechuu?',
      'Sababoota marsaa sirrii hin taane danda\'aman',
      'Yoom doktora argu qabda?',
      'Gorsa marsaa madaalawaa ta\'uuf',
    ],
    section1Body:
      'Marsaan yeroo dheerinni isaa guyyaa 21 fi 35 gidduutti garaagara ta\'u, marsaa tokko irraa gara kan biraatti garaagarummaan guyyaa 7 gadi ta\'u sirrii jedhamee ilaalama.',
    section1VisualTitle: 'Sirna ammoo kan adda hin ta\'in',
    section1VisualText:
      'Waan baay\'ee murteessu ji\'oota keessatti sirna kee mataa kee ilaaluu dha.',
    tip1Title: 'Beekuun gaarii dha',
    tip1Text:
      'Dubartiin hundi garaagara. Waan murteessu sirna kee mataa kee fi jijjiirama baratamaa isaa beekuu dha.',
    section2Body:
      'Marsaan yeroo dheerinni isaa yeroo baay\'ee ykn hin eegamne garaagara ta\'u (garaagarummaa guyyaa 7 ol) sirrii hin taane jedhamee ilaalama. Kun marsaa baay\'ee gabaabaa, marsaa baay\'ee dheeraa, ykn ovulation dhabamuun mul\'achuu danda\'a.',
    section2VisualTitle: 'Garaagarummaa caalaatti mul\'atu',
    section2VisualText:
      'Garaagarummaan kun yeroo muraasaaf ta\'uu ykn marsaa baay\'ee irratti turuu danda\'a.',
    alertTitle: 'Hubadhu',
    alertText:
      'Sirrii dhabuun yeroo muraasaaf baratamaa ta\'uu danda\'a (dhiphina, jijjiirama hormoonii, dadhabbii…). Garuu yoo itti fufe, sababa isaa barbaaduun barbaachisaa dha.',
    causes: [
      'Dhiphina fi yaaddoo',
      'Madaallii hormoonii dogoggoraa',
      'Rafuu dhabuu fi dadhabbii',
      'Ulfinni baay\'ee gadi ykn baay\'ee ol',
      'PCOS ykn rakkoo yaalaa biraa',
    ],
    checklist: [
      'Laguun ji\'a 3 ol dhabamuu (ulfaa/hoosisuu alatti)',
      'Marsaa baay\'ee dheeraa (guyyaa 90 ol) ykn baay\'ee gabaabaa (guyyaa 21 gadi)',
      'Dhukkubbii cimaan jireenya baratamaa si gufachiisu',
      'Dhiiga baay\'ee ykn sirrii hin taane',
      'Yoo ulfaa ta\'uuf yaaltee ovulation hin jiru fakkaate',
    ],
    advice: [
      'Nyaata madaalawaa',
      'Bishaan gahaa dhuguu',
      'Sochii qaamaa',
      'Dhiphina to\'achuu',
      'Rafuu qulqullina qabu',
    ],
    shareMessage: 'Marsaa sirrii ykn sirrii hin taane: garaagarummaan isaa maali? — AWA',
  },
  ti: {
    badge: 'ዑደትን ወርሓዊ ዓደትን',
    title: 'ወትሩ ወይ ዘይወትሩ ዑደት፦\nእንታይ እዩ ፍልልዮም?',
    metaDuration: '5 ደቒቕ ንባብ',
    metaValidated: 'ዝተገምገመ ትሕዝቶ',
    intro:
      'ነፍሲ ወከፍ ወርሓዊ ዑደት ፍሉይ እዩ። “ልሙድ” ዝብሃል ምርዳእ ጥዕናኺ ብዝቐረበ ንምክትታልን ዝኽእሉ ዘይምምጣንን ንምልላይን ክሕግዝ ይኽእል።',
    contentsTitle: 'ኣብዚ ጽሑፍ',
    topics: [
      'ወትሩ ወርሓዊ ዑደት፦ እንታይ እዩ?',
      'ዘይወትሩ ዑደት፦ እንታይ ማለት እዩ?',
      'ናይ ዘይወትሩ ዑደት ዝኽኣሉ ምኽንያታት',
      'ሓኪም መዓስ ትርእይ?',
      'ንዝሓሸ ሚዛን ዑደት ምኽሪታት',
    ],
    section1Body:
      'ዑደት ወትሩ ተባሂሉ ይሕሰብ ንውሓቱ ኣብ መንጎ 21ን 35ን መዓልታት ምስ ዝኸውን፣ ካብ ሓደ ዑደት ናብ ካልእ ድማ ካብ 7 መዓልታት ትሕቲ ፍልልይ ምስ ዘለዎ።',
    section1VisualTitle: 'ዳርጋ ቀጻሊ ቅኑዕ',
    section1VisualText:
      'እቲ ዝዓበየ ነገር ኣብ ዓመታት ባዕልኻ ቅኑዕካ ምዕዛብ እዩ።',
    tip1Title: 'ጽቡቕ ምፍላጥ',
    tip1Text:
      'ነፍሲ ወከፍ ሰበይቲ ዝተፈለየት እያ። እቲ ዘገድስ ባዕልኻ ቅኑዕካን ልሙድ ለውጥታቱን ምፍላጥ እዩ።',
    section2Body:
      'ዑደት ዘይወትሩ ተባሂሉ ይሕሰብ ንውሓቱ ብዙሕ ግዜ ወይ ብዘይተጸበናዮ መንገዲ ምስ ዝቕየር (ልዕሊ 7 መዓልታት ፍልልይ)። እዚ ኣዝዮም ሓጸርቲ ዑደታት፣ ኣዝዮም ነዊሕቲ ዑደታት፣ ወይ ኦቭዩሌሽን ዘይምህላው ኮይኑ ክርአ ይኽእል።',
    section2VisualTitle: 'ዝያዳ ርኡይ ለውጥታት',
    section2VisualText:
      'እዞም ፍልልያት ግዜያዊ ክኾኑ ወይ ኣብ ብዙሓት ዑደታት ክቕጽሉ ይኽእሉ።',
    alertTitle: 'ተዓዘብ',
    alertText:
      'ግዜያዊ ዘይወትሩ ልሙድ ክኸውን ይኽእል (ጭንቀት፣ ናይ ሆርሞን ለውጥታት፣ ድኻም…)። ግን እንተ ቀጺሉ፣ ምኽንያቱ ምርምር ኣገዳሲ እዩ።',
    causes: [
      'ጭንቀትን ሻቕሎትን',
      'ናይ ሆርሞን ዘይምሚዛን',
      'ድቃስ ሕጽረትን ድኻምን',
      'ኣዝዩ ትሑት ወይ ልዑል ክብደት',
      'PCOS ወይ ካልኦት ሕክምናዊ ኩነታት',
    ],
    checklist: [
      'ልዕሊ 3 ኣዋርሕ ወርሓዊ ዓደት ዘይምርኣይ (ካብ ጥንሲ/ጥባ ምጥባው ወጻኢ)',
      'ኣዝዮም ነዊሕቲ ዑደታት (ልዕሊ 90 መዓልታት) ወይ ኣዝዮም ሓጸርቲ ዑደታት (ትሕቲ 21 መዓልታት)',
      'ብልሙድ ከይትነብር ዘይፈቅድ ጽኑዕ ቃንዛ',
      'ኣዝዩ ብዙሕ ወይ ዘይወትሩ ደም ምፍሳስ',
      'ንምጥንሳስ እንተ ትፍትኒ ኦቭዩሌሽን ዘየለ ዝመስል እንተ ኮይኑ',
    ],
    advice: [
      'ዝተመጣጠነ ኣመጋግባ',
      'ግቡእ ማይ ምስታይ',
      'ኣካላዊ ንጥፈት',
      'ጭንቀት ምሕዛል',
      'ጽቡቕ ድቃስ',
    ],
    shareMessage: 'ወትሩ ወይ ዘይወትሩ ዑደት፦ እንታይ እዩ ፍልልዮም? — AWA',
  },
  rw: {
    badge: 'UKWEZI N’IMIHANGO',
    title: 'Ukwezi gutunganye cyangwa kudatunganye:\nitandukaniro ni irihe?',
    metaDuration: 'Isomwa mu minota 5',
    metaValidated: 'Ibikubiyemo byasuzumwe',
    intro:
      'Buri kwezi kw’imihango kuratandukanye. Gusobanukirwa icyitwa “gisanzwe” bishobora kugufasha gukurikirana ubuzima bwawe neza no kubona ibishobora kuba bidatunganye.',
    contentsTitle: 'Muri iyi nkuru',
    topics: [
      'Ukwezi kw’imihango gutunganye: ni iki?',
      'Ukwezi kudatunganye: bisobanura iki?',
      'Impamvu zishoboka z’ukwezi kudatunganye',
      'Ni ryari ukwiye kujya kwa muganga?',
      'Inama z’ukwezi kuringaniye kurushaho',
    ],
    section1Body:
      'Ukwezi kubarwa nk’igutunganye iyo uburebure bwako buri hagati y’iminsi 21 na 35, n’itandukaniro riri munsi y’iminsi 7 hagati y’ukwezi n’ukundi.',
    section1VisualTitle: 'Uburyo bumeze neza',
    section1VisualText:
      'Icy’ingenzi ni ukwitegereza uburyo bwawe mu mezi.',
    tip1Title: 'Ni byiza kubimenya',
    tip1Text:
      'Buri mugore aratandukanye. Icy’ingenzi ni ukumenya uburyo bwawe n’impinduka zabwo zisanzwe.',
    section2Body:
      'Ukwezi kubarwa nk’igudatunganye iyo uburebure bwako buhinduka kenshi cyangwa mu buryo butateganywa (itandukaniro ry’iminsi irenga 7). Bishobora kugaragara nk’ukwezi kugufi cyane, ukwezi kurekire cyane, cyangwa kudahari kwa ovulation.',
    section2VisualTitle: 'Impinduka zigaragara cyane',
    section2VisualText:
      'Aya matandukaniro ashobora kuba by’agateganyo cyangwa agakomeza mu mezi menshi.',
    alertTitle: 'Icyitonderwa',
    alertText:
      'Kudatunganya by’agateganyo bishobora kuba bisanzwe (umunaniro w’umutima, impinduka z’imisemburo, kunanirwa…). Ariko niba bikomeza, ni ngombwa gushaka impamvu.',
    causes: [
      'Umunaniro w’umutima n’impungenge',
      'Imisemburo itaringaniye',
      'Kubura ibitotsi no kunanirwa',
      'Ibiro biri hasi cyane cyangwa hejuru cyane',
      'PCOS cyangwa izindi ndwara',
    ],
    checklist: [
      'Nta mihango mu gihe kirenga amezi 3 (hanze yo gutwita/konsa)',
      'Ukwezi kurekire cyane (kurenga iminsi 90) cyangwa kugufi cyane (munsi y’iminsi 21)',
      'Ububabare bukomeye bugutesha kubaho mu buryo busanzwe',
      'Kuva amaraso menshi cyane cyangwa adahoraho',
      'Niba ugerageza gusama kandi ovulation isa nk’itabaho',
    ],
    advice: [
      'Indyo yuzuye',
      'Kunywa amazi ahagije',
      'Imyitozo ngororamubiri',
      'Kugenzura umunaniro w’umutima',
      'Gusinzira neza',
    ],
    shareMessage: 'Ukwezi gutunganye cyangwa kudatunganye: itandukaniro ni irihe? — AWA',
  },
  rn: {
    badge: 'URUZINDUKO N\'IMIHANGO',
    title: 'Uruzinduko ruhoraho canke rudahoraho:\nni irihe tandukaniro?',
    metaDuration: 'Soma muminuta 5',
    metaValidated: 'Ibikorwa vyasuzumwe',
    intro:
      'Uruzinduko rw\'imihango rwose ruratandukanye. Gusobanukirwa icitwa “gisanzwe” bishobora kugufasha gukurikirana ubuzima bwawe neza no kubona ukudahwana gushoboka.',
    contentsTitle: 'Muri iyi nkuru',
    topics: [
      'Uruzinduko rw\'imihango ruhoraho: ni iki?',
      'Uruzinduko rudahoraho: bisobanura iki?',
      'Ivyoba bitera uruzinduko rudahoraho',
      'Ni ryari wobona muganga?',
      'Impanuro z\'uruzinduko ruhwanye neza',
    ],
    section1Body:
      'Uruzinduko ruraharurwa nk\'uruhoraho iyo uburebure bwarwo buri hagati y\'iminsi 21 na 35, n\'itandukaniro riri munsi y\'iminsi 7 hagati y\'uruzinduko n\'urundi.',
    section1VisualTitle: 'Ingene bigenda bisa n\'ibihora',
    section1VisualText:
      'Icingenzi ni ukwitegereza ingene ugenda wowe uko amezi ahita.',
    tip1Title: 'Ni vyiza kubimenya',
    tip1Text:
      'Umugore wese aratandukanye. Icingenzi ni ukumenya ingene ugenda wowe n\'impinduka zisanzwe zawo.',
    section2Body:
      'Uruzinduko ruraharurwa nk\'urudahoraho iyo uburebure bwarwo butandukana kenshi canke mu buryo budateganijwe (itandukaniro rirenga iminsi 7). Bishobora kugaragara nk\'inzinduko ngufi cane, ndende cane, canke kutagira ovulation.',
    section2VisualTitle: 'Impinduka zigaragara cane',
    section2VisualText:
      'Ayo matandukaniro ashobora kuba y\'igihe gito canke agakomeza mu nzinduko nyinshi.',
    alertTitle: 'Ibuka',
    alertText:
      'Ukudahoraho kw\'igihe gito gushobora kuba gusanzwe (umunaniro wo mu mutima, impinduka za hormone, umunaniro w\'umubiri…). Ariko iyo gukomeje, ni ngirakamaro gushakisha igitera.',
    causes: [
      'Umunaniro wo mu mutima n\'impungenge',
      'Ukudahwana kwa hormone',
      'Kubura ibitotsi n\'umunaniro',
      'Uburemere buri hasi cane canke buri hejuru cane',
      'PCOS canke izindi ndwara',
    ],
    checklist: [
      'Kutagira imihango amezi arenga 3 (hatarimwo igihe co gutwita/konsa)',
      'Inzinduko ndende cane (iminsi irenga 90) canke ngufi cane (iminsi iri munsi ya 21)',
      'Ububabare bukomeye bukubuza kubaho bisanzwe',
      'Kuva amaraso menshi cane canke adahoraho',
      'Niba ugerageza gutwita kandi ovulation isa nk\'itaba',
    ],
    advice: [
      'Ifunguro rirangwa n\'uburinganire',
      'Kunywa amazi ahagije',
      'Imyitozo y\'umubiri',
      'Kugenzura umunaniro wo mu mutima',
      'Ibitotsi vyiza',
    ],
    shareMessage: 'Uruzinduko ruhoraho canke rudahoraho: ni irihe tandukaniro? — AWA',
  },
  ig: {
    badge: 'OKIRIKIRI NA NSỌ ỌNWA',
    title: 'Okirikiri nkịtị ma ọ bụ nke na-adịghị nkịtị:\nkedu ọdịiche?',
    metaDuration: 'Nkeji 5 iji gụọ',
    metaValidated: 'Ọdịnaya e nyochaworo',
    intro:
      'Okirikiri nsọ ọnwa ọ bụla pụrụ iche. Ịghọta ihe a na-ewere dị ka “nkịtị” nwere ike inyere gị aka soro ahụike gị nke ọma ma chọpụta ihe na-adịghị nguzozi.',
    contentsTitle: 'N\'edemede a',
    topics: [
      'Okirikiri nsọ ọnwa nkịtị: gịnị bụ ya?',
      'Okirikiri na-adịghị nkịtị: gịnị pụtara?',
      'Ihe nwere ike ịkpata okirikiri na-adịghị nkịtị',
      'Mgbe ị kwesịrị ịhụ dọkịta?',
      'Ndụmọdụ maka okirikiri nwere nguzozi karịa',
    ],
    section1Body:
      'A na-ewere okirikiri dị ka nke nkịtị mgbe ogologo ya dị n\'etiti ụbọchị 21 na 35, na ọdịiche na-erughị ụbọchị 7 site n\'otu okirikiri gaa n\'ozizi ọzọ.',
    section1VisualTitle: 'Usoro na-adịgide adịgide',
    section1VisualText:
      'Ihe kacha mkpa bụ ilebara anya n\'usoro nke gị n\'ọnwa ndị na-aga.',
    tip1Title: 'Ọ dị mma ịmara',
    tip1Text:
      'Nwanyị ọ bụla dị iche. Ihe dị mkpa bụ ịmara usoro nke gị na mgbanwe ya nkịtị.',
    section2Body:
      'A na-ewere okirikiri dị ka nke na-adịghị nkịtị mgbe ogologo ya na-agbanwe ugboro ugboro ma ọ bụ n\'ụzọ a na-apụghị ịkọ (ọdịiche karịrị ụbọchị 7). Nke a nwere ike ipụta dị ka okirikiri dị mkpụmkpụ nke ukwuu, ogologo nke ukwuu, ma ọ bụ enweghị ovulation.',
    section2VisualTitle: 'Mgbanwe ndị a na-ahụ nke ọma karịa',
    section2VisualText:
      'Ọdịiche ndị a nwere ike ịbụ nwa oge ma ọ bụ ịdịgide n\'ọtụtụ okirikiri.',
    alertTitle: 'Biko cheta',
    alertText:
      'Ịdị na-adịghị nkịtị nwa oge nwere ike ịbụ nkịtị (nrụgide, mgbanwe hormone, ike ọgwụgwụ…). Mana ọ bụrụ na ọ na-adịgide, ọ dị mkpa ịchọpụta ihe kpatara ya.',
    causes: [
      'Nrụgide na nchegbu',
      'Enweghị nguzozi hormone',
      'Ụkọ ụra na ike ọgwụgwụ',
      'Ibu dị ala nke ukwuu ma ọ bụ dị elu nke ukwuu',
      'PCOS ma ọ bụ ọnọdụ ahụike ndị ọzọ',
    ],
    checklist: [
      'Enweghị nsọ ọnwa karịa ọnwa 3 (n\'èzí ime/inyere nwa ara)',
      'Okirikiri ogologo nke ukwuu (karịa ụbọchị 90) ma ọ bụ mkpụmkpụ nke ukwuu (erughị ụbọchị 21)',
      'Mgbu dị ukwuu nke na-egbochi gị ibi ndụ nkịtị',
      'Ọbara dị ukwuu nke ukwuu ma ọ bụ na-adịghị nkịtị',
      'Ọ bụrụ na ị na-anwa ịtụrụ ime ma ovulation dị ka ọ na-adịghị',
    ],
    advice: [
      'Nri nwere nguzozi',
      'Ịṅụ mmiri zuru ezu',
      'Mmega ahụ',
      'Ijikwa nrụgide',
      'Ụra dị mma',
    ],
    shareMessage: 'Okirikiri nkịtị ma ọ bụ nke na-adịghị nkịtị: kedu ọdịiche? — AWA',
  },
  yo: {
    badge: 'ÌYÍPO ÀTI NǸKAN OṢÙ',
    title: 'Ìyípo oṣù tó tọ́ tàbí tí kò tọ́:\nkí ni ìyàtọ̀?',
    metaDuration: 'Ìṣẹ́jú 5 láti kà',
    metaValidated: 'Àkóónú tí a ti yẹ̀wò',
    intro:
      'Ìyípo oṣù kọ̀ọ̀kan yàtọ̀. Mímọ ohun tí a kà sí “déédéé” lè ràn ọ́ lọ́wọ́ láti tọpinpin ìlera rẹ ní pẹrẹu àti láti kíyèsí àìwọ́ntúnwọ̀nsì tó ṣeé ṣe.',
    contentsTitle: 'Nínú àpilẹ̀kọ yìí',
    topics: [
      'Ìyípo oṣù tó tọ́: kí ni?',
      'Ìyípo oṣù tí kò tọ́: kí ni ó túmọ̀ sí?',
      'Àwọn ohun tó lè fa ìyípo oṣù tí kò tọ́',
      'Ìgbà wo ni o yẹ kí o rí dókítà?',
      'Àwọn ìmọ̀ràn fún ìyípo oṣù tó ní ìwọ̀ntúnwọ̀nsì sí i',
    ],
    section1Body:
      'A kà ìyípo oṣù sí èyí tó tọ́ nígbà tí gígùn rẹ̀ bá wà láàrín ọjọ́ 21 àti 35, pẹ̀lú ìyàtọ̀ tí kò tó ọjọ́ 7 láti ìyípo kan sí òmíràn.',
    section1VisualTitle: 'Ìlù tó dúró ṣinṣin',
    section1VisualText:
      'Ohun tó ṣe pàtàkì jù ni kíkíyèsí ìlù tìrẹ ní àwọn oṣù tó ń lọ.',
    tip1Title: 'Ó dára láti mọ̀',
    tip1Text:
      'Obìnrin kọ̀ọ̀kan yàtọ̀. Ohun tó ṣe pàtàkì ni mímọ ìlù tìrẹ àti àwọn ìyàtọ̀ rẹ̀ tó jẹ́ déédéé.',
    section2Body:
      'A kà ìyípo oṣù sí èyí tí kò tọ́ nígbà tí gígùn rẹ̀ bá ń yàtọ̀ nígbà gbogbo tàbí lọ́nà tí a kò lè sọ tẹ́lẹ̀ (ìyàtọ̀ tó ju ọjọ́ 7 lọ). Èyí lè hàn bí ìyípo kúkúrú gan-an, ìyípo gígùn gan-an, tàbí àìsí ovulation.',
    section2VisualTitle: 'Àwọn ìyàtọ̀ tó hàn gbangba sí i',
    section2VisualText:
      'Àwọn ìyàtọ̀ wọ̀nyí lè jẹ́ fún ìgbà díẹ̀ tàbí kí wọ́n tẹ̀síwájú ní ọ̀pọ̀ ìyípo.',
    alertTitle: 'Jọ̀wọ́ kíyèsí',
    alertText:
      'Àìtọ́ fún ìgbà díẹ̀ lè jẹ́ àbáyọ (másùnmáwo, àyípadà hormone, àárẹ̀…). Ṣùgbọ́n tí ó bá ń tẹ̀síwájú, ó ṣe pàtàkì láti wá ohun tó fà á.',
    causes: [
      'Másùnmáwo àti àníyàn',
      'Àìwọ́ntúnwọ̀nsì hormone',
      'Àìsùn tó àti àárẹ̀',
      'Ìwúwo ara tó kéré jù tàbí tó pọ̀ jù',
      'PCOS tàbí àwọn àìsàn mìíràn',
    ],
    checklist: [
      'Kò sí nǹkan oṣù fún ju oṣù 3 lọ (yàtọ̀ sí oyún/fífún ọmọ lọ́mú)',
      'Ìyípo gígùn gan-an (tó ju ọjọ́ 90 lọ) tàbí ìyípo kúkúrú gan-an (tó kéré sí ọjọ́ 21)',
      'Ìrora líle tó ń dí ọ lọ́wọ́ láti gbé ìgbésí ayé déédéé',
      'Ẹ̀jẹ̀ tó pọ̀ gan-an tàbí tí kò tọ́',
      'Tí o bá ń gbìyànjú láti lóyún tí ovulation sì dà bí ẹni pé kò sí',
    ],
    advice: [
      'Oúnjẹ tó ní ìwọ̀ntúnwọ̀nsì',
      'Mímu omi tó tó',
      'Iṣẹ́ ara',
      'Ṣíṣàkóso másùnmáwo',
      'Oorun tó dára',
    ],
    shareMessage: 'Ìyípo oṣù tó tọ́ tàbí tí kò tọ́: kí ni ìyàtọ̀? — AWA',
  },
  zu: {
    badge: 'UMJIKELEZO NESIKHATHI',
    title: 'Umjikelezo ohleliwe noma ongahleliwe:\nkuhluke kanjani?',
    metaDuration: 'Imizuzu emi-5 yokufunda',
    metaValidated: 'Okuphawulwe ngochwepheshe',
    intro:
      'Umjikelezo ngamunye wokuya esikhathini ukhethekile. Ukuqonda lokho okubhekwa “njengokujwayelekile” kungakusiza ulandelele impilo yakho kahle futhi ubone ukungalingani okungaba khona.',
    contentsTitle: 'Kulesi sihloko',
    topics: [
      'Umjikelezo ohleliwe wokuya esikhathini: uyini?',
      'Umjikelezo ongahleliwe: usho ukuthini?',
      'Izimbangela ezingaba khona zomjikelezo ongahleliwe',
      'Isikhathi sokubona udokotela?',
      'Amathiphu omjikelezo olinganiselayo kakhulu',
    ],
    section1Body:
      'Umjikelezo ubhekwa njengohleliwe uma ubude bawo buhluka phakathi kwezinsuku ezingu-21 nangu-35, ngomehluko ongaphansi kwezinsuku ezi-7 kusuka emjikelezweni oya komunye.',
    section1VisualTitle: 'Ukuhamba okuzinzile',
    section1VisualText:
      'Okubalulekile kakhulu ukubuka ukuhamba kwakho phakathi nezinyanga.',
    tip1Title: 'Kuhle ukwazi',
    tip1Text:
      'Owesifazane ngamunye uhlukile. Okubalulekile ukwazi ukuhamba kwakho nokuhluka kwakho okujwayelekile.',
    section2Body:
      'Umjikelezo ubhekwa njengongahleliwe uma ubude bawo buhluka kaningi noma ngokungalindelekile (umehluko wezinsuku ezingaphezu kwezi-7). Lokhu kungabonakala njengemijikelezo emifushane kakhulu, emide kakhulu, noma ukungabi khona kwe-ovulation.',
    section2VisualTitle: 'Ukuhluka okubonakala kakhulu',
    section2VisualText:
      'Lokhu kuhluka kungaba okwesikhashana noma kuqhubeke imijikelezo eminingana.',
    alertTitle: 'Qaphela',
    alertText:
      'Ukungahleleki kwesikhashana kungaba okujwayelekile (ukucindezeleka, izinguquko zamahomoni, ukukhathala…). Kodwa uma kuqhubeka, kubalulekile ukucwaninga imbangela.',
    causes: [
      'Ukucindezeleka nokukhathazeka',
      'Ukungalingani kwamahomoni',
      'Ukungalali ngokwanele nokukhathala',
      'Isisindo esiphansi kakhulu noma esiphezulu kakhulu',
      'I-PCOS noma ezinye izimo zezokwelapha',
    ],
    checklist: [
      'Akukho sikhathi isikhathi esingaphezu kwezinyanga ezi-3 (ngaphandle kokukhulelwa/ukuncelisa)',
      'Imijikelezo emide kakhulu (ngaphezu kwezinsuku ezingu-90) noma emifushane kakhulu (ngaphansi kwezinsuku ezingu-21)',
      'Ubuhlungu obukhulu obukuvimbela ukuphila kahle',
      'Ukopha okukhulu kakhulu noma okungahleliwe',
      'Uma uzama ukukhulelwa futhi i-ovulation ibonakala ingekho',
    ],
    advice: [
      'Ukudla okulinganiselayo',
      'Ukuphuza amanzi anele',
      'Ukuzivivinya komzimba',
      'Ukuphatha ukucindezeleka',
      'Ukulala kahle',
    ],
    shareMessage: 'Umjikelezo ohleliwe noma ongahleliwe: kuhluke kanjani? — AWA',
  },
  xh: {
    badge: 'UMJIKELO NEXESHA LENYANGA',
    title: 'Umjikelo ongaguqukiyo okanye ongaqhelekanga:\nwahluke njani?',
    metaDuration: 'Imizuzu eyi-5 yokufunda',
    metaValidated: 'Umxholo ohlolwe',
    intro:
      'Umjikelo wenyanga ngamnye wodwa. Ukuqonda oko kubalwa “kuqhelekile” kunganceda ukulandelela impilo yakho ngokusondeleyo nokubona ukungalingani okunokubakho.',
    contentsTitle: 'Kweli nqaku',
    topics: [
      'Umjikelo wenyanga ongaguqukiyo: uyintoni?',
      'Umjikelo ongaqhelekanga: kuthetha ntoni?',
      'Izizathu ezinokubakho zomjikelo ongaqhelekanga',
      'Kufuneka ubone gqirha nini?',
      'Iingcebiso zomjikelo olinganayo ngakumbi',
    ],
    section1Body:
      'Umjikelo ubalwa njengongaguqukiyo xa ubude bawo busuka kwiintsuku ezi-21 ukuya kwezi-35, ngomahluko ongaphantsi kweentsuku ezi-7 phakathi komjikelo ngamnye.',
    section1VisualTitle: 'Isantya esilingeneyo',
    section1VisualText:
      'Okubaluleke kakhulu kukujonga isantya sakho ngeenyanga.',
    tip1Title: 'Kuhle ukwazi',
    tip1Text:
      'Umfazi ngamnye wahlukile. Okubalulekileyo kukwazi isantya sakho notshintsho lwaso oluqhelekileyo.',
    section2Body:
      'Umjikelo ubalwa njengongaqhelekanga xa ubude bawo butshintsha rhoqo okanye ngokungalindelekanga (umahluko weentsuku ezingaphezu kwezi-7). Oku kunokubonakala njengemijikelo emifutshane kakhulu, emide kakhulu, okanye ukungabikho kwe-ovulation.',
    section2VisualTitle: 'Utshintsho olubonakala ngakumbi',
    section2VisualText:
      'Ezi ngxaki zomahluko zinokuba zexeshana okanye zihlale kwimijikelo emininzi.',
    alertTitle: 'Nceda uqaphele',
    alertText:
      'Ukungaqhelekanga okwexeshana kunokuba kuqhelekile (uxinzelelo, utshintsho lwe-hormone, ukudinwa…). Kodwa ukuba kuyaqhubeka, kubalulekile ukukhangela unobangela.',
    causes: [
      'Uxinzelelo nenkxalabo',
      'Ukungalingani kwe-hormone',
      'Ukungalali kakuhle nokudinwa',
      'Isisindo esiphantsi kakhulu okanye esiphezulu kakhulu',
      'I-PCOS okanye ezinye iimeko zezonyango',
    ],
    checklist: [
      'Akukho xesha lenyanga ngaphezu kweenyanga ezi-3 (ngaphandle kokumitha/ukonga)',
      'Imijikelo emide kakhulu (ngaphezu kweentsuku ezingama-90) okanye emifutshane kakhulu (ngaphantsi kweentsuku ezi-21)',
      'Intlungu enamandla ekuthintela ukuba uphile ngokuqhelekileyo',
      'Ukopha okuninzi kakhulu okanye okungaqhelekanga',
      'Ukuba uzama ukukhawula kwaye i-ovulation ibonakala ingekho',
    ],
    advice: [
      'Ukutya okulinganayo',
      'Ukusela ngokwaneleyo',
      'Umsebenzi womzimba',
      'Ukulawula uxinzelelo',
      'Ukulala kakuhle',
    ],
    shareMessage: 'Umjikelo ongaguqukiyo okanye ongaqhelekanga: wahluke njani? — AWA',
  },
  sn: {
    badge: 'CYCLE & KUENDA KUMWEDZI',
    title: 'Cycle inorongeka kana isingarongeki:\nkusiyana kuri kupi?',
    metaDuration: 'Maminitsi 5 ekuverenga',
    metaValidated: 'Zvakaongororwa',
    intro:
      'Menstrual cycle yega yega yakasiyana. Kunzwisisa zvinonzi “zvakajairika” kunogona kukubatsira kutevedzera hutano hwako zvakanyanya uye kuona kusaenzana kunogona kuvapo.',
    contentsTitle: 'Mudzidziso uyu',
    topics: [
      'Menstrual cycle inorongeka: chii?',
      'Cycle isingarongeki: zvinoreva chii?',
      'Zvinogona kukonzera cycle isingarongeki',
      'Painofanira kuona chiremba?',
      'Mazano ecycle yakaenzana zvirinani',
    ],
    section1Body:
      'Cycle inonzi inorongeka kana kureba kwayo kuchisiyana pakati pemazuva 21 ne35, nekusiyana kwakaderera kumazuva 7 kubva pacycle imwe kuenda kune imwe.',
    section1VisualTitle: 'Kurira kwakaenzana zvakanaka',
    section1VisualText:
      'Chakanyanya kukosha kucherechedza kurira kwako pachako mumwedzi yose.',
    tip1Title: 'Zvakanaka kuziva',
    tip1Text:
      'Mukadzi wega wega akasiyana. Chakakosha ndechekuziva kurira kwako pachako nekusiyana kwako kwakajairika.',
    section2Body:
      'Cycle inonzi isingarongeki kana kureba kwayo kuchisiyana kazhinji kana zvisingafungidzirwi (kusiyana kunopfuura mazuva 7). Izvi zvinogona kuoneka secycle pfupi zvikuru, cycle refu zvikuru, kana kushaikwa kwe ovulation.',
    section2VisualTitle: 'Kusiyana kunoonekwa zvakanyanya',
    section2VisualText:
      'Kusiyana uku kunogona kuva kwenguva pfupi kana kuramba kuripo mumacycle akati wandei.',
    alertTitle: 'Cherechedza',
    alertText:
      'Kusarongeka kwenguva pfupi kunogona kuva kwakajairika (kushushikana, shanduko dzehormone, kuneta…). Asi kana kuchiramba kuripo, zvakakosha kutsvaga kukonzera.',
    causes: [
      'Kushushikana & kunetseka',
      'Kusaenzana kwehormone',
      'Kushaya kurara & kuneta',
      'Huremu hwakaderera kana hwakawandisa',
      'PCOS kana dzimwe nhosva dzekurapa',
    ],
    checklist: [
      'Kusaenda kumwedzi kwemwedzi inopfuura 3 (kunze kwepamuviri/kupa mukaka)',
      'Macycle marefu zvikuru (anopfuura mazuva 90) kana mapfupi zvikuru (anosvika mazuva 21)',
      'Marwadzo makuru anokudzivisa kurarama zvakajairika',
      'Kubuda ropa kwakawanda zvikuru kana kusingarongeki',
      'Kana uri kuedza kuva nepamuviri uye ovulation ichiratidzika kushaikwa',
    ],
    advice: [
      'Kudya zvakaringana',
      'Kunwa mvura inokwana',
      'Kuita ekisesaizi',
      'Kubata kushushikana',
      'Kurara kwakanaka',
    ],
    shareMessage: 'Cycle inorongeka kana isingarongeki: kusiyana kuri kupi? — AWA',
  },
  ln: {
    badge: 'CYCLE & SANZA',
    title: 'Cycle ya ntango nyonso to ya ndenge nyonso te:\nbokeseni ezali nini?',
    metaDuration: 'Mwa mokapo ya kotánga: 5 min',
    metaValidated: 'Maloba etalelami',
    intro:
      'Cycle ya sanza nyonso ezali ya ndenge na yango. Koyeba oyo ekanisami “ya kawaida” ekoki kosalisa yo kolanda malamu bolamu ya nzoto na yo mpe komona bobongisi oyo ekoki kozala te.',
    contentsTitle: 'Na lisolo oyo',
    topics: [
      'Cycle ya sanza ya ntango nyonso: ezali nini?',
      'Cycle ya ndenge nyonso te: elakisi nini?',
      'Bantina oyo ekoki kozala ya cycle ya ndenge nyonso te',
      'Ntango nini kokende epai ya monganga?',
      'Toli mpo na cycle oyo ebongisami malamu',
    ],
    section1Body:
      'Cycle ekanisami ya ntango nyonso soki molai na yango ekesenaka kati na mikolo 21 mpe 35, na bokeseni ya mikolo 7 te uta cycle na cycle.',
    section1VisualTitle: 'Ndenge ya kawaida mpenza',
    section1VisualText:
      'Eloko ya ntina eleki ezali kotala ndenge na yo na sanza.',
    tip1Title: 'Eloko ya malamu koyeba',
    tip1Text:
      'Mwasi na mwasi ekeseni. Eloko ya ntina ezali koyeba ndenge na yo mpe bobongwani na yango ya kawaida.',
    section2Body:
      'Cycle ekanisami ya ndenge nyonso te soki molai na yango ekesenaka mbala mingi to na ndenge ya kozela te (bokeseni ya mikolo koleka 7). Yango ekoki komonana na cycle mokuse mingi, cycle molai mingi, to kozanga ovulation.',
    section2VisualTitle: 'Bobongwani oyo emonani mingi',
    section2VisualText:
      'Bokeseni oyo ekoki kozala ya mwa ntango to kokoba na cycle mingi.',
    alertTitle: 'Yeba',
    alertText:
      'Cycle ya ndenge nyonso te ya mwa ntango ekoki kozala ya kawaida (mpiko ya motema, bobongwani ya ormɔne, bolembu…). Kasi soki ekoki kokoba, ezali ntina koluka ntina na yango.',
    causes: [
      'Mpiko ya motema mpe bobangi',
      'Bozangi ndenge ya ormɔne',
      'Mpɔngi moke mpe bolembu',
      'Bozito moke mingi to mingi mingi',
      'PCOS to mpasi mosusu ya nzoto',
    ],
    checklist: [
      'Sanza moko te koleka sanza 3 (libanda ya zemi/kopesa mabɛle)',
      'Cycle molai mingi (mikolo koleka 90) to mokuse mingi (mikolo koleka 21 te)',
      'Mpasi makasi oyo ekangi yo kozala na bomoi ya kawaida',
      'Makila mingi mingi to ya ndenge nyonso te',
      'Soki ozali koluka zemi mpe ovulation emonani te',
    ],
    advice: [
      'Bilei oyo ebongi',
      'Komela mai ya kokoka',
      'Misala ya nzoto',
      'Kokonza mpiko ya motema',
      'Mpɔngi ya malamu',
    ],
    shareMessage: 'Cycle ya ntango nyonso to ya ndenge nyonso te: bokeseni ezali nini? — AWA',
  },
  ff: {
    badge: 'CYCLE & MENSTRUATION',
    title: 'Cycle nannduɗum walla wayrotooɗum:\nko feerol?',
    metaDuration: 'Janngugo 5 miniti',
    metaValidated: 'Ko ƴetti ndaarol',
    intro:
      'Cycle menstruation kala ko feere. Faamugo ko ndaaretee “nannduɗum” waawi wallugo ma ndaarugo ñawndu maaɗa ɓuri e tawtugo wayrude ɗin ngonnda.',
    contentsTitle: 'Nder ɗerewol ndin',
    topics: [
      'Cycle menstruation nannduɗum: ko ɗum?',
      'Cycle wayrotooɗum: ko ɗum hollata?',
      'Sabaabuuji ɗi ngonnda ngam cycle wayrotooɗum',
      'Saa ngoye ma ndaara doktoor?',
      'Anndinki ngam cycle ɓuri hoosugo',
    ],
    section1Body:
      'Cycle ndaaretee nannduɗum saa juutaare mum wayyi hakkunde ñalɗi 21 e 35, e feerol ɓuri ñalɗi 7 hakkunde cycle e cycle.',
    section1VisualTitle: 'Wakkati nannduɗum seɗɗa',
    section1VisualText:
      'Ko ɓuri laaɓtugo ko ndaarugo wakkati maaɗa nder lebbi.',
    tip1Title: 'Ko mari njoɓdi',
    tip1Text:
      'Debbo kala ko feere. Ko laaɓi ko anndugo wakkati maaɗa e no wayyata e ɗum nanndi.',
    section2Body:
      'Cycle ndaaretee wayrotooɗum saa juutaare mum wayyi ɗuuɗɗum walla salaa anndugo (feerol ɓurɗo ñalɗi 7). Ɗum waawi feƴƴude e cycle gaɗɗa no feewi, cycle juutɗe no feewi, walla walaa ovulation.',
    section2VisualTitle: 'Wayrude ɓurude',
    section2VisualText:
      'Feerol ɗin waawi laatugo saa seɗɗa walla jokkude nder cycle ɗuuɗɗe.',
    alertTitle: 'Anndu ɗum',
    alertText:
      'Wayrude saa seɗɗa waawi laatugo nannduɗum (tiiɗɗam hakkilo, wayrude hormon, tiiɗɗam…). Kono si ɗum jokkoti, ɗum ko nafugo ndaarugo sabaabu.',
    causes: [
      'Tiiɗɗam hakkilo & hulugo',
      'Ɓoosugo hormon',
      'Ɗaanaago seɗɗa & tiiɗɗam',
      'Ɓooyaare gaɗɗa walla ɓurɗa',
      'PCOS walla ñawndu feere',
    ],
    checklist: [
      'Menstruation walaa ɓuri lebbi 3 (salaa reedu/hunnugo ɓiɗɗo)',
      'Cycle juutɗe no feewi (ɓuri ñalɗi 90) walla cycle gaɗɗe no feewi (ɓoyi ñalɗi 21)',
      'Muusi tiiɗɗi ɗi haɗan ma ngurndan no yiɗi',
      'Yiiɗam ɗuuɗam no feewi walla wayrotooɗam',
      'Si ɗon yiɗi reedu e ovulation yiyaaka',
    ],
    advice: [
      'Ñaamdu hanaande',
      'Yoɓugo ndiyam hanaani',
      'Yaadu bandu',
      'Reentugo tiiɗɗam hakkilo',
      'Ɗaanaago moƴƴo',
    ],
    shareMessage: 'Cycle nannduɗum walla wayrotooɗum: ko feerol? — AWA',
  },
  id: {
    badge: 'SIKLUS & HAID',
    title: 'Siklus teratur atau tidak teratur:\napa bedanya?',
    metaDuration: '5 menit baca',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Setiap siklus menstruasi itu unik. Memahami apa yang dianggap “normal” bisa membantumu memantau kesehatan lebih dekat dan mengenali kemungkinan ketidakseimbangan.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Siklus menstruasi teratur: apa itu?',
      'Siklus tidak teratur: apa artinya?',
      'Kemungkinan penyebab siklus tidak teratur',
      'Kapan kamu perlu ke dokter?',
      'Tips untuk siklus yang lebih seimbang',
    ],
    section1Body: 'Siklus dianggap teratur jika panjangnya berkisar antara 21 dan 35 hari, dengan selisih kurang dari 7 hari dari satu siklus ke siklus berikutnya.',
    section1VisualTitle: 'Ritme yang cukup stabil',
    section1VisualText: 'Yang terpenting adalah mengamati ritmemu sendiri dari bulan ke bulan.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Setiap perempuan berbeda. Yang penting adalah mengenal ritmemu sendiri beserta variasi normalnya.',
    section2Body: 'Siklus dianggap tidak teratur jika panjangnya sering berubah atau tidak bisa diprediksi (selisih lebih dari 7 hari). Hal ini bisa berupa siklus yang sangat pendek, siklus yang sangat panjang, atau tidak adanya ovulasi.',
    section2VisualTitle: 'Variasi yang lebih terasa',
    section2VisualText: 'Perbedaan ini bisa bersifat sementara atau berlanjut selama beberapa siklus.',
    alertTitle: 'Harap diperhatikan',
    alertText: 'Ketidakteraturan sementara bisa saja normal (stres, perubahan hormon, kelelahan…). Tetapi jika berlanjut, penting untuk mencari penyebabnya.',
    causes: [
      'Stres & kecemasan',
      'Ketidakseimbangan hormon',
      'Kurang tidur & kelelahan',
      'Berat badan terlalu rendah atau terlalu tinggi',
      'PCOS atau kondisi medis lainnya',
    ],
    checklist: [
      'Tidak haid lebih dari 3 bulan (di luar kehamilan/menyusui)',
      'Siklus sangat panjang (lebih dari 90 hari) atau sangat pendek (kurang dari 21 hari)',
      'Nyeri hebat yang membuatmu tidak bisa beraktivitas normal',
      'Perdarahan yang sangat deras atau tidak teratur',
      'Jika kamu sedang program hamil dan ovulasi tampaknya tidak terjadi',
    ],
    advice: [
      'Pola makan seimbang',
      'Asupan air yang cukup',
      'Aktivitas fisik',
      'Pengelolaan stres',
      'Tidur berkualitas',
    ],
    shareMessage: 'Siklus teratur atau tidak teratur: apa bedanya? — AWA',
  },
  hi: {
    badge: 'चक्र और पीरियड',
    title: 'नियमित या अनियमित चक्र:\nफ़र्क़ क्या है?',
    metaDuration: '5 मिनट में पढ़ें',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'हर मासिक चक्र अनोखा होता है। “सामान्य” क्या माना जाता है, यह समझना आपको अपनी सेहत पर बारीकी से नज़र रखने और संभावित असंतुलन पहचानने में मदद कर सकता है।',
    contentsTitle: 'इस लेख में',
    topics: [
      'नियमित मासिक चक्र: यह क्या है?',
      'अनियमित चक्र: इसका क्या मतलब है?',
      'अनियमित चक्र के संभावित कारण',
      'डॉक्टर को कब दिखाएँ?',
      'ज़्यादा संतुलित चक्र के सुझाव',
    ],
    section1Body: 'चक्र तब नियमित माना जाता है जब उसकी लंबाई 21 से 35 दिन के बीच रहे, और एक चक्र से दूसरे चक्र में 7 दिन से कम का अंतर हो।',
    section1VisualTitle: 'काफ़ी स्थिर लय',
    section1VisualText: 'सबसे ज़रूरी है महीनों तक अपनी खुद की लय को देखना।',
    tip1Title: 'जानने लायक बात',
    tip1Text: 'हर महिला अलग होती है। ज़रूरी यह है कि आप अपनी लय और उसके सामान्य उतार-चढ़ाव को जानें।',
    section2Body: 'चक्र तब अनियमित माना जाता है जब उसकी लंबाई अक्सर या अनपेक्षित रूप से बदलती रहे (7 दिन से ज़्यादा का अंतर)। यह बहुत छोटे चक्रों, बहुत लंबे चक्रों या ओव्यूलेशन (अंडोत्सर्ग) न होने के रूप में दिख सकता है।',
    section2VisualTitle: 'ज़्यादा साफ़ दिखने वाले उतार-चढ़ाव',
    section2VisualText: 'ये अंतर अस्थायी हो सकते हैं या कई चक्रों तक बने रह सकते हैं।',
    alertTitle: 'ध्यान दें',
    alertText: 'अस्थायी अनियमितता सामान्य हो सकती है (तनाव, हार्मोनल बदलाव, थकान…)। लेकिन अगर यह बनी रहे, तो इसके कारण का पता लगाना ज़रूरी है।',
    causes: [
      'तनाव और घबराहट',
      'हार्मोनल असंतुलन',
      'नींद की कमी और थकान',
      'वज़न बहुत कम या बहुत ज़्यादा होना',
      'PCOS या अन्य चिकित्सकीय स्थितियाँ',
    ],
    checklist: [
      '3 महीने से ज़्यादा समय तक पीरियड न आना (गर्भावस्था/स्तनपान के अलावा)',
      'बहुत लंबे चक्र (90 दिन से ज़्यादा) या बहुत छोटे चक्र (21 दिन से कम)',
      'इतना तेज़ दर्द कि आप सामान्य ढंग से जी न पाएँ',
      'बहुत ज़्यादा या अनियमित रक्तस्राव',
      'अगर आप गर्भधारण की कोशिश कर रही हैं और ओव्यूलेशन होता नहीं दिख रहा',
    ],
    advice: [
      'संतुलित आहार',
      'पर्याप्त पानी पीना',
      'शारीरिक गतिविधि',
      'तनाव का प्रबंधन',
      'अच्छी नींद',
    ],
    shareMessage: 'नियमित या अनियमित चक्र: फ़र्क़ क्या है? — AWA',
  },
  sq: {
    badge: 'CIKLI & MENSTRUACIONET',
    title: 'Cikël i rregullt apo i parregullt:\nçfarë është dallimi?',
    metaDuration: '5 min lexim',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Çdo cikël menstrual është unik. Të kuptuarit e asaj që konsiderohet “normale” mund të të ndihmojë ta ndjekësh më nga afër shëndetin tënd dhe të dallosh çekuilibra të mundshme.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Cikli menstrual i rregullt: çfarë është?',
      'Cikli i parregullt: çfarë do të thotë?',
      'Shkaqet e mundshme të një cikli të parregullt',
      'Kur duhet të shkosh te mjeku?',
      'Këshilla për një cikël më të ekuilibruar',
    ],
    section1Body: 'Një cikël konsiderohet i rregullt kur gjatësia e tij ndryshon midis 21 dhe 35 ditëve, me më pak se 7 ditë ndryshim nga një cikël te tjetri.',
    section1VisualTitle: 'Një ritëm mjaft i qëndrueshëm',
    section1VisualText: 'Më e rëndësishmja është të vëzhgosh ritmin tënd gjatë muajve.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Çdo grua është ndryshe. E rëndësishme është të njohësh ritmin tënd dhe ndryshimet e tij normale.',
    section2Body: 'Një cikël konsiderohet i parregullt kur gjatësia e tij ndryshon shpesh ose në mënyrë të paparashikueshme (një ndryshim më i madh se 7 ditë). Kjo mund të shfaqet si cikle shumë të shkurtra, cikle shumë të gjata ose mungesë ovulacioni.',
    section2VisualTitle: 'Ndryshime më të dukshme',
    section2VisualText: 'Këto dallime mund të jenë të përkohshme ose të vazhdojnë gjatë disa cikleve.',
    alertTitle: 'Kujdes',
    alertText: 'Parregullsia e përkohshme mund të jetë normale (stres, ndryshime hormonale, lodhje…). Por nëse vazhdon, është e rëndësishme të hulumtohet shkaku.',
    causes: [
      'Stresi & ankthi',
      'Çekuilibra hormonale',
      'Mungesa e gjumit & lodhja',
      'Peshë shumë e ulët ose shumë e lartë',
      'PCOS ose gjendje të tjera mjekësore',
    ],
    checklist: [
      'Mungesë menstruacionesh për më shumë se 3 muaj (jashtë shtatzënisë/ushqyerjes me gji)',
      'Cikle shumë të gjata (më shumë se 90 ditë) ose cikle shumë të shkurtra (më pak se 21 ditë)',
      'Dhimbje e fortë që të pengon të jetosh normalisht',
      'Gjakderdhje shumë e bollshme ose e parregullt',
      'Nëse po përpiqesh të mbetesh shtatzënë dhe ovulacioni duket se mungon',
    ],
    advice: [
      'Ushqim i ekuilibruar',
      'Hidratim i mjaftueshëm',
      'Aktivitet fizik',
      'Menaxhim i stresit',
      'Gjumë cilësor',
    ],
    shareMessage: 'Cikël i rregullt apo i parregullt: çfarë është dallimi? — AWA',
  },
  ja: {
    badge: '周期と生理',
    title: '規則的な周期と不規則な周期：\nその違いは？',
    metaDuration: '読了5分',
    metaValidated: '確認済みの内容',
    intro: '生理周期は一人ひとり異なります。「正常」とされる範囲を知っておくと、健康状態をより丁寧に見守り、起こりうる乱れに気づきやすくなります。',
    contentsTitle: 'この記事の内容',
    topics: [
      '規則的な生理周期とは？',
      '不規則な周期とはどういうこと？',
      '周期が不規則になる主な原因',
      '医師に相談するのはいつ？',
      '周期を整えるためのヒント',
    ],
    section1Body: '周期の長さが21〜35日の範囲にあり、周期ごとの差が7日未満であれば、規則的な周期とされます。',
    section1VisualTitle: 'ほぼ一定のリズム',
    section1VisualText: '何より大切なのは、数か月にわたってご自身のリズムを観察することです。',
    tip1Title: '知っておきたいこと',
    tip1Text: '女性はそれぞれ異なります。大切なのは、ご自身のリズムと、その自然なゆらぎを知ることです。',
    section2Body: '周期の長さが頻繁に、または予測できない形で変わる場合（差が7日を超える場合）は、不規則な周期とされます。非常に短い周期、非常に長い周期、あるいは排卵がない、といった形で現れることがあります。',
    section2VisualTitle: 'より目立つばらつき',
    section2VisualText: 'こうした違いは一時的なこともあれば、何周期も続くこともあります。',
    alertTitle: 'ご注意ください',
    alertText: '一時的な不規則さは、ストレス、ホルモンの変化、疲れなどによる正常なこともあります。ただし、続く場合は原因を確かめることが大切です。',
    causes: [
      'ストレスと不安',
      'ホルモンバランスの乱れ',
      '睡眠不足と疲れ',
      '体重が少なすぎる、または多すぎる',
      'PCOSなどの医学的な状態',
    ],
    checklist: [
      '3か月を超えて生理がない（妊娠中・授乳中を除く）',
      '非常に長い周期（90日を超える）、または非常に短い周期（21日未満）',
      '普段どおりの生活ができないほどの強い痛み',
      '非常に多い出血、または不規則な出血',
      '妊娠を望んでいて、排卵がないように思われる場合',
    ],
    advice: [
      'バランスのよい食事',
      '十分な水分補給',
      '運動',
      'ストレスへの対処',
      '質のよい睡眠',
    ],
    shareMessage: '規則的な周期と不規則な周期：その違いは？ — AWA',
  },
  ko: {
    badge: '주기와 생리',
    title: '규칙적인 주기와 불규칙한 주기:\n무엇이 다를까요?',
    metaDuration: '읽는 데 5분',
    metaValidated: '검토된 콘텐츠',
    intro: '생리 주기는 사람마다 달라요. 어떤 경우가 “정상”으로 여겨지는지 알면 건강을 더 꼼꼼히 살피고 불균형 가능성을 알아차리는 데 도움이 돼요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    topics: [
      '규칙적인 생리 주기란?',
      '불규칙한 주기는 무엇을 의미할까요?',
      '불규칙한 주기의 가능한 원인',
      '언제 의사를 만나야 할까요?',
      '더 균형 잡힌 주기를 위한 팁',
    ],
    section1Body: '주기 길이가 21~35일 사이이고 주기마다 차이가 7일 미만이면 규칙적인 주기로 봐요.',
    section1VisualTitle: '꽤 일정한 리듬',
    section1VisualText: '가장 중요한 것은 몇 달에 걸쳐 나만의 리듬을 관찰하는 거예요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '사람마다 모두 달라요. 중요한 것은 나만의 리듬과 그 안에서의 정상적인 변동을 아는 거예요.',
    section2Body: '주기 길이가 자주 또는 예측할 수 없게 달라지면(차이가 7일 넘게 나면) 불규칙한 주기로 봐요. 아주 짧은 주기, 아주 긴 주기, 또는 배란이 없는 형태로 나타날 수 있어요.',
    section2VisualTitle: '더 뚜렷한 변동',
    section2VisualText: '이런 차이는 일시적일 수도 있고 여러 주기에 걸쳐 이어질 수도 있어요.',
    alertTitle: '유의하세요',
    alertText: '일시적인 불규칙함은 정상일 수 있어요(스트레스, 호르몬 변화, 피로…). 하지만 계속된다면 원인을 살펴보는 것이 중요해요.',
    causes: [
      '스트레스와 불안',
      '호르몬 불균형',
      '수면 부족과 피로',
      '너무 낮거나 높은 체중',
      'PCOS 또는 기타 질환',
    ],
    checklist: [
      '3개월 넘게 생리가 없을 때(임신이나 모유 수유 중인 경우 제외)',
      '아주 긴 주기(90일 초과) 또는 아주 짧은 주기(21일 미만)',
      '일상생활이 어려울 정도의 심한 통증',
      '출혈량이 매우 많거나 불규칙할 때',
      '임신을 준비 중인데 배란이 없는 것 같을 때',
    ],
    advice: [
      '균형 잡힌 식단',
      '충분한 수분 섭취',
      '신체 활동',
      '스트레스 관리',
      '질 좋은 수면',
    ],
    shareMessage: '규칙적인 주기와 불규칙한 주기: 무엇이 다를까요? — AWA',
  },
  'pt-PT': {
    badge: 'CICLO E PERÍODOS',
    title: 'Ciclo regular ou irregular:\nqual é a diferença?',
    metaDuration: '5 min de leitura',
    metaValidated: 'Conteúdo revisto',
    intro: 'Cada ciclo menstrual é único. Compreender o que se considera “normal” pode ajudá-la a acompanhar melhor a sua saúde e a detetar possíveis desequilíbrios.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Ciclo menstrual regular: o que é?',
      'Ciclo irregular: o que significa?',
      'Possíveis causas de um ciclo irregular',
      'Quando consultar um médico?',
      'Dicas para um ciclo mais equilibrado',
    ],
    section1Body: 'Um ciclo é considerado regular quando a sua duração varia entre 21 e 35 dias, com menos de 7 dias de diferença de um ciclo para o seguinte.',
    section1VisualTitle: 'Um ritmo bastante estável',
    section1VisualText: 'O mais importante é observar o seu próprio ritmo ao longo dos meses.',
    tip1Title: 'Bom saber',
    tip1Text: 'Cada mulher é diferente. O que importa é conhecer o seu próprio ritmo e as suas variações normais.',
    section2Body: 'Um ciclo é considerado irregular quando a sua duração varia com frequência ou de forma imprevisível (uma diferença de mais de 7 dias). Pode manifestar-se por ciclos muito curtos, ciclos muito longos ou ausência de ovulação.',
    section2VisualTitle: 'Variações mais notórias',
    section2VisualText: 'Estas diferenças podem ser temporárias ou persistir ao longo de vários ciclos.',
    alertTitle: 'Atenção',
    alertText: 'Uma irregularidade temporária pode ser normal (stress, alterações hormonais, cansaço…). Mas, se persistir, é importante investigar a causa.',
    causes: [
      'Stress e ansiedade',
      'Desequilíbrios hormonais',
      'Falta de sono e cansaço',
      'Peso demasiado baixo ou demasiado elevado',
      'SOP ou outras doenças',
    ],
    checklist: [
      'Ausência de período há mais de 3 meses (fora da gravidez/amamentação)',
      'Ciclos muito longos (mais de 90 dias) ou muito curtos (menos de 21 dias)',
      'Dor intensa que a impede de viver normalmente',
      'Hemorragia muito abundante ou irregular',
      'Se está a tentar engravidar e a ovulação parece estar ausente',
    ],
    advice: [
      'Alimentação equilibrada',
      'Hidratação adequada',
      'Atividade física',
      'Gestão do stress',
      'Sono de qualidade',
    ],
    shareMessage: 'Ciclo regular ou irregular: qual é a diferença? — AWA',
  },
  bn: {
    badge: 'চক্র ও মাসিক',
    title: 'নিয়মিত না অনিয়মিত চক্র:\nপার্থক্য কী?',
    metaDuration: 'পড়তে 5 মিনিট',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'প্রতিটি মাসিক চক্র আলাদা। “স্বাভাবিক” বলতে কী বোঝায় তা জানলে আপনি স্বাস্থ্য আরও নিবিড়ভাবে পর্যবেক্ষণ করতে এবং সম্ভাব্য ভারসাম্যহীনতা ধরতে পারবেন।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'নিয়মিত মাসিক চক্র: এটি কী?',
      'অনিয়মিত চক্র: এর অর্থ কী?',
      'অনিয়মিত চক্রের সম্ভাব্য কারণ',
      'কখন ডাক্তার দেখাবেন?',
      'আরও সুষম চক্রের জন্য টিপস',
    ],
    section1Body: 'চক্রের দৈর্ঘ্য 21 থেকে 35 দিনের মধ্যে থাকলে এবং এক চক্র থেকে আরেক চক্রে পার্থক্য 7 দিনের কম হলে সেটিকে নিয়মিত ধরা হয়।',
    section1VisualTitle: 'মোটামুটি স্থির একটি ছন্দ',
    section1VisualText: 'সবচেয়ে গুরুত্বপূর্ণ হলো মাসের পর মাস নিজের ছন্দ পর্যবেক্ষণ করা।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'প্রতিটি নারী আলাদা। গুরুত্বপূর্ণ হলো নিজের ছন্দ এবং তার স্বাভাবিক ওঠানামা জানা।',
    section2Body: 'চক্রের দৈর্ঘ্য ঘন ঘন বা অনির্দিষ্টভাবে বদলালে (7 দিনের বেশি পার্থক্য) সেটিকে অনিয়মিত ধরা হয়। এটি খুব ছোট চক্র, খুব লম্বা চক্র বা ডিম্বস্ফোটন না হওয়া হিসেবে দেখা দিতে পারে।',
    section2VisualTitle: 'আরও স্পষ্ট ওঠানামা',
    section2VisualText: 'এই পার্থক্যগুলো সাময়িক হতে পারে অথবা কয়েকটি চক্র ধরে থেকে যেতে পারে।',
    alertTitle: 'লক্ষ্য করুন',
    alertText: 'সাময়িক অনিয়ম স্বাভাবিক হতে পারে (মানসিক চাপ, হরমোনের পরিবর্তন, ক্লান্তি…)। কিন্তু তা চলতে থাকলে কারণ খুঁজে দেখা গুরুত্বপূর্ণ।',
    causes: [
      'মানসিক চাপ ও উদ্বেগ',
      'হরমোনের ভারসাম্যহীনতা',
      'ঘুমের অভাব ও ক্লান্তি',
      'ওজন খুব কম বা খুব বেশি',
      'পিসিওএস বা অন্যান্য চিকিৎসাগত অবস্থা',
    ],
    checklist: [
      '3 মাসের বেশি সময় মাসিক না হওয়া (গর্ভাবস্থা/বুকের দুধ খাওয়ানোর সময় বাদে)',
      'খুব লম্বা চক্র (90 দিনের বেশি) অথবা খুব ছোট চক্র (21 দিনের কম)',
      'এমন তীব্র ব্যথা যা স্বাভাবিকভাবে চলাফেরা করতে দেয় না',
      'খুব বেশি বা অনিয়মিত রক্তক্ষরণ',
      'গর্ভধারণের চেষ্টা করছেন এবং ডিম্বস্ফোটন হচ্ছে না বলে মনে হলে',
    ],
    advice: [
      'সুষম খাবার',
      'পর্যাপ্ত পানি পান',
      'শারীরিক কার্যকলাপ',
      'মানসিক চাপ সামলানো',
      'ভালো মানের ঘুম',
    ],
    shareMessage: 'নিয়মিত না অনিয়মিত চক্র: পার্থক্য কী? — AWA',
  },
  da: {
    badge: 'CYKLUS OG MENSTRUATION',
    title: 'Regelmæssig eller uregelmæssig\ncyklus: hvad er forskellen?',
    metaDuration: '5 min læsning',
    metaValidated: 'Gennemgået indhold',
    intro: 'Ingen menstruationscyklus er identisk. At forstå, hvad "normalt" betyder, hjælper dig med at følge din sundhed tættere og opdage mulige ubalancer.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Regelmæssig menstruationscyklus: hvad er det?',
      'Uregelmæssig cyklus: hvad betyder det?',
      'Mulige årsager til uregelmæssig cyklus',
      'Hvornår bør du se en læge?',
      'Tips til en mere afbalanceret cyklus',
    ],
    section1Body: 'En cyklus anses for regelmæssig, når dens længde er mellem 21 og 35 dage og varierer med mindre end 7 dage fra én cyklus til den næste.',
    section1VisualTitle: 'En nogenlunde stabil rytme',
    section1VisualText: 'Det vigtigste er at observere sin egen rytme fra måned til måned.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Alle er forskellige. Det vigtige er at kende sin egen rytme og dens normale variationer.',
    section2Body: 'En cyklus anses for uregelmæssig, når dens længde ændrer sig hyppigt eller uforudsigeligt (mere end 7 dages forskel). Det kan vise sig som meget korte cyklusser, meget lange eller manglende ægløsning.',
    section2VisualTitle: 'Mere udtalte variationer',
    section2VisualText: 'Disse variationer kan være midlertidige eller vare ved over flere cyklusser.',
    alertTitle: 'Bemærk',
    alertText: 'Midlertidig uregelmæssighed kan være normal (stress, hormonelle forandringer, træthed…). Men hvis det varer ved, er det vigtigt at undersøge årsagen.',
    causes: [
      'Stress og angst',
      'Hormonel ubalance',
      'Søvnmangel og træthed',
      'Under- eller overvægt',
      'PCOS eller andre medicinske tilstande',
    ],
    checklist: [
      'Ingen menstruation i over 3 måneder (bortset fra graviditet/amning)',
      'Meget lang cyklus (over 90 dage) eller meget kort (under 21 dage)',
      'Stærke smerter der hindrer normal bevægelse',
      'Meget kraftig eller uregelmæssig blødning',
      'Du forsøger at blive gravid og tror ikke, der sker ægløsning',
    ],
    advice: [
      'Afbalanceret kost',
      'Tilstrækkeligt væskeindtag',
      'Fysisk aktivitet',
      'Håndtering af stress',
      'Søvn af god kvalitet',
    ],
    shareMessage: 'Regelmæssig eller uregelmæssig cyklus: hvad er forskellen? — AWA',
  },
  sv: {
    badge: 'CYKLUS OG MENSTRUATION',
    title: 'Regelmässig eller uregelmässig\ncyklus: hvad ar forskellen?',
    metaDuration: '5 min läsning',
    metaValidated: 'Gennemgået indhold',
    intro: 'Ingen menstruationscyklus ar identisk. At forstå, hvad "normalt" betyder, hjälper dig med at fölge din halsa tättere och opdage mulige ubalancer.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Regelmässig menstruationscyklus: hvad ar det?',
      'Uregelmässig cyklus: hvad betyder det?',
      'Mulige årsager till uregelmässig cyklus',
      'Hvornår bör du se en läge?',
      'Tips till en mere afbalanceret cyklus',
    ],
    section1Body: 'En cyklus anses for regelmässig, når dens längde ar mellem 21 och 35 dagar och varierer med mindre end 7 dagar fran én cyklus till den näste.',
    section1VisualTitle: 'En nogenlunde stabil rytme',
    section1VisualText: 'Det vigtigste ar at observere sin egen rytme fran måned till måned.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Alla ar forskellige. Det vigtige ar at kende sin egen rytme och dens normale variationer.',
    section2Body: 'En cyklus anses for uregelmässig, når dens längde ändrer sig hyppigt eller uforudsigeligt (mere end 7 dages forskel). Det kan vise sig som mycket korte cyklusser, mycket lange eller manglende äglösning.',
    section2VisualTitle: 'Mere udtalte variationer',
    section2VisualText: 'Disse variationer kan väre midlertidige eller vare ved over flere cyklusser.',
    alertTitle: 'Bemärk',
    alertText: 'Midlertidig uregelmässighed kan väre normal (stress, hormonelle forandringer, träthed…). Men hvis det varer ved, ar det vigtigt at undersöge årsagen.',
    causes: [
      'Stress och angst',
      'Hormonel ubalance',
      'Sövnmangel och träthed',
      'Under- eller overvägt',
      'PCOS eller andre medicinske tilstande',
    ],
    checklist: [
      'Ingen menstruation i over 3 måneder (bortset fran graviditet/amning)',
      'Meget lang cyklus (over 90 dage) eller mycket kort (under 21 dage)',
      'Stärke smartor der hindrer normal bevägelse',
      'Meget kraftig eller uregelmässig blödning',
      'Du forsöger at blive gravid och tror inte, der sker äglösning',
    ],
    advice: [
      'Afbalanceret kost',
      'Tilsträkkeligt väskeindtag',
      'Fysisk aktivitet',
      'Håndtering av stress',
      'Sövn av god kvalitet',
    ],
    shareMessage: 'Regelmässig eller uregelmässig cyklus: hvad ar forskellen? — AWA',
  },
  nb: {
    badge: 'SYKLUS OG MENS',
    title: 'Regelmessig eller uregelmessig syklus:\nhva er forskjellen?',
    metaDuration: '5 min lesing',
    metaValidated: 'Gjennomgått innhold',
    intro:
      'Hver menstruasjonssyklus er unik. Å forstå hva som regnes som «normalt» kan hjelpe deg å følge helsen din tettere og oppdage mulige ubalanser.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Regelmessig menstruasjonssyklus: hva er det?',
      'Uregelmessig syklus: hva betyr det?',
      'Mulige årsaker til en uregelmessig syklus',
      'Når bør du gå til lege?',
      'Tips for en mer balansert syklus',
    ],
    section1Body:
      'En syklus regnes som regelmessig når lengden varierer mellom 21 og 35 dager, med mindre enn 7 dagers forskjell fra en syklus til den neste.',
    section1VisualTitle: 'En ganske jevn rytme',
    section1VisualText:
      'Det som betyr mest, er å observere din egen rytme over månedene.',
    tip1Title: 'Godt å vite',
    tip1Text:
      'Hver kvinne er forskjellig. Det viktige er å kjenne din egen rytme og dens normale variasjoner.',
    section2Body:
      'En syklus regnes som uregelmessig når lengden ofte eller uforutsigbart varierer (mer enn 7 dagers forskjell). Dette kan vise seg som svært korte sykluser, svært lange sykluser eller manglende eggløsning.',
    section2VisualTitle: 'Mer merkbare variasjoner',
    section2VisualText:
      'Disse forskjellene kan være midlertidige eller vedvare over flere sykluser.',
    alertTitle: 'Merk',
    alertText:
      'Midlertidig uregelmessighet kan være normalt (stress, hormonelle endringer, tretthet …). Men hvis den vedvarer, er det viktig å undersøke årsaken.',
    causes: [
      'Stress og angst',
      'Hormonelle ubalanser',
      'Søvnmangel og tretthet',
      'For lav eller for høy vekt',
      'PCOS eller andre medisinske tilstander',
    ],
    checklist: [
      'Ingen mens på mer enn 3 måneder (utenom graviditet/amming)',
      'Svært lange sykluser (mer enn 90 dager) eller svært korte sykluser (under 21 dager)',
      'Intense smerter som hindrer deg i å leve normalt',
      'Svært kraftig eller uregelmessig blødning',
      'Hvis du prøver å bli gravid og eggløsningen ser ut til å utebli',
    ],
    advice: [
      'Balansert kosthold',
      'Tilstrekkelig væskeinntak',
      'Fysisk aktivitet',
      'Stresshåndtering',
      'God søvn',
    ],
    shareMessage: 'Regelmessig eller uregelmessig syklus: hva er forskjellen? – AWA',
  },
  pl: {
    badge: 'CYKL I MIESIĄCZKI',
    title: 'Cykl regularny czy nieregularny:\njaka jest różnica?',
    metaDuration: '5 min czytania',
    metaValidated: 'Treść zweryfikowana',
    intro:
      'Każdy cykl menstruacyjny jest wyjątkowy. Zrozumienie, co uznaje się za „normalne”, może pomóc Ci uważniej śledzić zdrowie i dostrzegać ewentualne zaburzenia równowagi.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Regularny cykl menstruacyjny: czym jest?',
      'Cykl nieregularny: co to oznacza?',
      'Możliwe przyczyny nieregularnego cyklu',
      'Kiedy zgłosić się do lekarza?',
      'Wskazówki dla bardziej zrównoważonego cyklu',
    ],
    section1Body:
      'Cykl uznaje się za regularny, gdy jego długość waha się między 21 a 35 dni, a różnica między kolejnymi cyklami jest mniejsza niż 7 dni.',
    section1VisualTitle: 'Dość stały rytm',
    section1VisualText:
      'Najważniejsza jest obserwacja własnego rytmu w kolejnych miesiącach.',
    tip1Title: 'Warto wiedzieć',
    tip1Text:
      'Każda kobieta jest inna. Liczy się znajomość własnego rytmu i jego normalnych wahań.',
    section2Body:
      'Cykl uznaje się za nieregularny, gdy jego długość często lub nieprzewidywalnie się zmienia (różnica większa niż 7 dni). Mogą to być cykle bardzo krótkie, bardzo długie lub brak owulacji.',
    section2VisualTitle: 'Bardziej zauważalne wahania',
    section2VisualText:
      'Te różnice mogą być przejściowe lub utrzymywać się przez kilka cykli.',
    alertTitle: 'Zwróć uwagę',
    alertText:
      'Przejściowa nieregularność może być normalna (stres, zmiany hormonalne, zmęczenie…). Jeśli jednak się utrzymuje, ważne jest zbadanie jej przyczyny.',
    causes: [
      'Stres i lęk',
      'Zaburzenia hormonalne',
      'Brak snu i zmęczenie',
      'Zbyt niska lub zbyt wysoka waga',
      'PCOS lub inne schorzenia',
    ],
    checklist: [
      'Brak miesiączki przez ponad 3 miesiące (poza ciążą i karmieniem piersią)',
      'Bardzo długie cykle (ponad 90 dni) lub bardzo krótkie (poniżej 21 dni)',
      'Silny ból uniemożliwiający normalne funkcjonowanie',
      'Bardzo obfite lub nieregularne krwawienie',
      'Jeśli starasz się o dziecko, a owulacja wydaje się nie występować',
    ],
    advice: [
      'Zbilansowana dieta',
      'Odpowiednie nawodnienie',
      'Aktywność fizyczna',
      'Radzenie sobie ze stresem',
      'Dobry sen',
    ],
    shareMessage: 'Cykl regularny czy nieregularny: jaka jest różnica? — AWA',
  },
  uk: {
    badge: 'ЦИКЛ І МЕНСТРУАЦІЇ',
    title: 'Регулярний чи нерегулярний цикл:\nу чому різниця?',
    metaDuration: '5 хв читання',
    metaValidated: 'Перевірений вміст',
    intro:
      'Кожен менструальний цикл унікальний. Розуміння того, що вважається «нормальним», може допомогти вам уважніше стежити за своїм здоров’ям і помічати можливі порушення рівноваги.',
    contentsTitle: 'У цій статті',
    topics: [
      'Регулярний менструальний цикл: що це?',
      'Нерегулярний цикл: що це означає?',
      'Можливі причини нерегулярного циклу',
      'Коли звертатися до лікаря?',
      'Поради для більш збалансованого циклу',
    ],
    section1Body:
      'Цикл вважається регулярним, коли його тривалість коливається між 21 та 35 днями, а різниця між послідовними циклами становить менше 7 днів.',
    section1VisualTitle: 'Досить сталий ритм',
    section1VisualText:
      'Найважливіше — спостерігати власний ритм протягом місяців.',
    tip1Title: 'Варто знати',
    tip1Text:
      'Кожна жінка різна. Важливо знати власний ритм та його нормальні коливання.',
    section2Body:
      'Цикл вважається нерегулярним, коли його тривалість часто або непередбачувано змінюється (різниця понад 7 днів). Це можуть бути дуже короткі цикли, дуже довгі цикли або відсутність овуляції.',
    section2VisualTitle: 'Помітніші коливання',
    section2VisualText:
      'Ці відмінності можуть бути тимчасовими або зберігатися протягом кількох циклів.',
    alertTitle: 'Зверніть увагу',
    alertText:
      'Тимчасова нерегулярність може бути нормальною (стрес, гормональні зміни, втома…). Але якщо вона зберігається, важливо з’ясувати причину.',
    causes: [
      'Стрес і тривога',
      'Гормональні порушення',
      'Брак сну й втома',
      'Занадто низька або занадто висока вага',
      'СПКЯ чи інші захворювання',
    ],
    checklist: [
      'Немає менструації понад 3 місяці (поза вагітністю та годуванням груддю)',
      'Дуже довгі цикли (понад 90 днів) або дуже короткі (менше 21 дня)',
      'Сильний біль, що заважає жити нормально',
      'Дуже рясна або нерегулярна кровотеча',
      'Якщо ви намагаєтеся завагітніти, а овуляція, схоже, відсутня',
    ],
    advice: [
      'Збалансоване харчування',
      'Достатній питний режим',
      'Фізична активність',
      'Подолання стресу',
      'Якісний сон',
    ],
    shareMessage: 'Регулярний чи нерегулярний цикл: у чому різниця? — AWA',
  },
  cs: {
    badge: 'CYKLUS A MENSTRUACE',
    title: 'Pravidelný, nebo nepravidelný cyklus:\nv čem je rozdíl?',
    metaDuration: '5 min čtení',
    metaValidated: 'Ověřený obsah',
    intro:
      'Každý menstruační cyklus je jedinečný. Pochopení toho, co se považuje za „normální“, vám může pomoci pečlivěji sledovat své zdraví a odhalit možné nerovnováhy.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Pravidelný menstruační cyklus: co to je?',
      'Nepravidelný cyklus: co to znamená?',
      'Možné příčiny nepravidelného cyklu',
      'Kdy navštívit lékaře?',
      'Tipy pro vyváženější cyklus',
    ],
    section1Body:
      'Cyklus se považuje za pravidelný, pokud se jeho délka pohybuje mezi 21 a 35 dny, s rozdílem menším než 7 dní mezi jednotlivými cykly.',
    section1VisualTitle: 'Poměrně stálý rytmus',
    section1VisualText:
      'Nejdůležitější je sledovat vlastní rytmus v průběhu měsíců.',
    tip1Title: 'Stojí za to vědět',
    tip1Text:
      'Každá žena je jiná. Důležité je znát vlastní rytmus a jeho běžné odchylky.',
    section2Body:
      'Cyklus se považuje za nepravidelný, pokud se jeho délka mění často nebo nepředvídatelně (rozdíl větší než 7 dní). Může se projevit velmi krátkými cykly, velmi dlouhými cykly nebo nepřítomností ovulace.',
    section2VisualTitle: 'Výraznější odchylky',
    section2VisualText:
      'Tyto rozdíly mohou být dočasné nebo přetrvávat během několika cyklů.',
    alertTitle: 'Upozornění',
    alertText:
      'Dočasná nepravidelnost může být normální (stres, hormonální změny, únava…). Pokud však přetrvává, je důležité zjistit příčinu.',
    causes: [
      'Stres a úzkost',
      'Hormonální nerovnováhy',
      'Nedostatek spánku a únava',
      'Příliš nízká nebo příliš vysoká váha',
      'PCOS nebo jiná zdravotní onemocnění',
    ],
    checklist: [
      'Žádná menstruace déle než 3 měsíce (mimo těhotenství/kojení)',
      'Velmi dlouhé cykly (více než 90 dní) nebo velmi krátké cykly (méně než 21 dní)',
      'Intenzivní bolest, která vám brání žít normálně',
      'Velmi silné nebo nepravidelné krvácení',
      'Pokud se snažíte otěhotnět a ovulace se zdá chybět',
    ],
    advice: [
      'Vyvážená strava',
      'Dostatečný pitný režim',
      'Fyzická aktivita',
      'Zvládání stresu',
      'Kvalitní spánek',
    ],
    shareMessage: 'Pravidelný, nebo nepravidelný cyklus: v čem je rozdíl? — AWA',
  },
  sk: {
    badge: 'CYKLUS A MENŠTRUÁCIA',
    title: 'Pravidelný alebo nepravidelný cyklus:\naký je rozdiel?',
    metaDuration: '5 min čítania',
    metaValidated: 'Overený obsah',
    intro:
      'Každý menštruačný cyklus je jedinečný. Pochopenie toho, čo sa považuje za „normálne“, vám môže pomôcť pozornejšie sledovať vlastné zdravie a rozpoznať možné nerovnováhy.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Pravidelný menštruačný cyklus: čo to je?',
      'Nepravidelný cyklus: čo to znamená?',
      'Možné príčiny nepravidelného cyklu',
      'Kedy navštíviť lekára?',
      'Tipy pre vyváženejší cyklus',
    ],
    section1Body:
      'Cyklus sa považuje za pravidelný, keď sa jeho dĺžka pohybuje medzi 21 a 35 dňami, s rozdielom menším ako 7 dní medzi jedným a druhým cyklom.',
    section1VisualTitle: 'Pomerne stály rytmus',
    section1VisualText:
      'Najdôležitejšie je sledovať svoj vlastný rytmus počas mesiacov.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text:
      'Každá žena je iná. Dôležité je poznať svoj vlastný rytmus a jeho bežné odchýlky.',
    section2Body:
      'Cyklus sa považuje za nepravidelný, keď sa jeho dĺžka často alebo nepredvídateľne mení (rozdiel viac ako 7 dní). Môže sa to prejaviť veľmi krátkymi cyklami, veľmi dlhými cyklami alebo absenciou ovulácie.',
    section2VisualTitle: 'Výraznejšie odchýlky',
    section2VisualText:
      'Tieto rozdiely môžu byť dočasné alebo pretrvávať počas niekoľkých cyklov.',
    alertTitle: 'Upozornenie',
    alertText:
      'Dočasná nepravidelnosť môže byť normálna (stres, hormonálne zmeny, únava…). Ak však pretrváva, je dôležité zistiť príčinu.',
    causes: [
      'Stres a úzkosť',
      'Hormonálne nerovnováhy',
      'Nedostatok spánku a únava',
      'Príliš nízka alebo príliš vysoká hmotnosť',
      'PCOS alebo iné zdravotné stavy',
    ],
    checklist: [
      'Menštruácia chýba viac ako 3 mesiace (mimo tehotenstva/dojčenia)',
      'Veľmi dlhé cykly (viac ako 90 dní) alebo veľmi krátke cykly (menej ako 21 dní)',
      'Intenzívna bolesť, ktorá vám bráni žiť normálne',
      'Veľmi silné alebo nepravidelné krvácanie',
      'Ak sa snažíte počať a zdá sa, že ovulácia chýba',
    ],
    advice: [
      'Vyvážená strava',
      'Dostatočná hydratácia',
      'Fyzická aktivita',
      'Zvládanie stresu',
      'Kvalitný spánok',
    ],
    shareMessage: 'Pravidelný alebo nepravidelný cyklus: aký je rozdiel? — AWA',
  },
  hu: {
    badge: 'CIKLUS ÉS MENSTRUÁCIÓ',
    title: 'Rendszeres vagy szabálytalan ciklus:\nmi a különbség?',
    metaDuration: '5 perc olvasás',
    metaValidated: 'Ellenőrzött tartalom',
    intro:
      'Minden menstruációs ciklus egyedi. Ha megérted, mit tekintenek „normálisnak”, pontosabban követheted az egészségedet, és felismerheted az esetleges egyensúlyzavarokat.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Rendszeres menstruációs ciklus: mi ez?',
      'Szabálytalan ciklus: mit jelent?',
      'A szabálytalan ciklus lehetséges okai',
      'Mikor menj orvoshoz?',
      'Tippek a kiegyensúlyozottabb ciklusért',
    ],
    section1Body:
      'A ciklust rendszeresnek tekintik, ha hossza 21 és 35 nap között van, két ciklus között 7 napnál kisebb eltéréssel.',
    section1VisualTitle: 'Meglehetősen állandó ritmus',
    section1VisualText:
      'A legfontosabb a saját ritmusod megfigyelése a hónapok során.',
    tip1Title: 'Érdemes tudni',
    tip1Text:
      'Minden nő más. Az a fontos, hogy ismerd a saját ritmusodat és annak szokásos eltéréseit.',
    section2Body:
      'A ciklust szabálytalannak tekintik, ha hossza gyakran vagy kiszámíthatatlanul változik (több mint 7 napos különbség). Ez megnyilvánulhat nagyon rövid ciklusokban, nagyon hosszú ciklusokban vagy a peteérés hiányában.',
    section2VisualTitle: 'Szembetűnőbb eltérések',
    section2VisualText:
      'Ezek a különbségek lehetnek átmenetiek, vagy több cikluson át is fennmaradhatnak.',
    alertTitle: 'Figyelem',
    alertText:
      'Az átmeneti szabálytalanság lehet normális (stressz, hormonális változások, fáradtság…). Ha azonban fennmarad, fontos kideríteni az okát.',
    causes: [
      'Stressz és szorongás',
      'Hormonális egyensúlyzavarok',
      'Alváshiány és fáradtság',
      'Túl alacsony vagy túl magas testsúly',
      'PCOS vagy más egészségügyi állapotok',
    ],
    checklist: [
      'Több mint 3 hónapja nincs menstruáció (terhességen/szoptatáson kívül)',
      'Nagyon hosszú ciklusok (több mint 90 nap) vagy nagyon rövid ciklusok (kevesebb mint 21 nap)',
      'Intenzív fájdalom, amely megakadályoz a normális életben',
      'Nagyon erős vagy szabálytalan vérzés',
      'Ha babát szeretnél, és a peteérés úgy tűnik, hiányzik',
    ],
    advice: [
      'Kiegyensúlyozott étrend',
      'Megfelelő hidratálás',
      'Fizikai aktivitás',
      'Stresszkezelés',
      'Minőségi alvás',
    ],
    shareMessage: 'Rendszeres vagy szabálytalan ciklus: mi a különbség? — AWA',
  },
  ro: {
    badge: 'CICLU ȘI MENSTRUAȚII',
    title: 'Ciclu regulat sau neregulat:\ncare este diferența?',
    metaDuration: '5 min de citit',
    metaValidated: 'Conținut revizuit',
    intro:
      'Fiecare ciclu menstrual este unic. Înțelegerea a ceea ce este considerat „normal” te poate ajuta să-ți urmărești sănătatea mai îndeaproape și să observi eventuale dezechilibre.',
    contentsTitle: 'În acest articol',
    topics: [
      'Ciclul menstrual regulat: ce este?',
      'Ciclul neregulat: ce înseamnă?',
      'Cauze posibile ale unui ciclu neregulat',
      'Când ar trebui să mergi la medic?',
      'Sfaturi pentru un ciclu mai echilibrat',
    ],
    section1Body:
      'Un ciclu este considerat regulat atunci când durata lui variază între 21 și 35 de zile, cu o diferență mai mică de 7 zile de la un ciclu la următorul.',
    section1VisualTitle: 'Un ritm destul de constant',
    section1VisualText:
      'Ceea ce contează cel mai mult este să-ți observi propriul ritm de-a lungul lunilor.',
    tip1Title: 'Bine de știut',
    tip1Text:
      'Fiecare femeie este diferită. Ceea ce contează este să-ți cunoști propriul ritm și variațiile lui normale.',
    section2Body:
      'Un ciclu este considerat neregulat atunci când durata lui variază adesea sau imprevizibil (o diferență de peste 7 zile). Aceasta se poate manifesta prin cicluri foarte scurte, cicluri foarte lungi sau absența ovulației.',
    section2VisualTitle: 'Variații mai vizibile',
    section2VisualText:
      'Aceste diferențe pot fi temporare sau pot persista pe parcursul mai multor cicluri.',
    alertTitle: 'Atenție',
    alertText:
      'O neregularitate temporară poate fi normală (stres, schimbări hormonale, oboseală…). Dar dacă persistă, este important să investighezi cauza.',
    causes: [
      'Stres și anxietate',
      'Dezechilibre hormonale',
      'Lipsa somnului și oboseală',
      'Greutate prea mică sau prea mare',
      'SOP sau alte afecțiuni medicale',
    ],
    checklist: [
      'Nicio menstruație de mai mult de 3 luni (în afara sarcinii/alăptării)',
      'Cicluri foarte lungi (peste 90 de zile) sau foarte scurte (sub 21 de zile)',
      'Durere intensă care te împiedică să trăiești normal',
      'Sângerare foarte abundentă sau neregulată',
      'Dacă încerci să rămâi însărcinată și ovulația pare să lipsească',
    ],
    advice: [
      'Alimentație echilibrată',
      'Hidratare adecvată',
      'Activitate fizică',
      'Gestionarea stresului',
      'Somn de calitate',
    ],
    shareMessage: 'Ciclu regulat sau neregulat: care este diferența? — AWA',
  },
  bg: {
    badge: 'ЦИКЪЛ И МЕНСТРУАЦИЯ',
    title: 'Редовен или нередовен цикъл:\nкаква е разликата?',
    metaDuration: '5 мин четене',
    metaValidated: 'Проверено съдържание',
    intro:
      'Всеки менструален цикъл е уникален. Разбирането на онова, което се смята за „нормално“, може да ти помогне да следиш по-отблизо здравето си и да забележиш възможни дисбаланси.',
    contentsTitle: 'В тази статия',
    topics: [
      'Редовен менструален цикъл: какво е това?',
      'Нередовен цикъл: какво означава?',
      'Възможни причини за нередовен цикъл',
      'Кога да посетиш лекар?',
      'Съвети за по-балансиран цикъл',
    ],
    section1Body:
      'Цикълът се смята за редовен, когато продължителността му варира между 21 и 35 дни, с разлика под 7 дни от един цикъл до следващия.',
    section1VisualTitle: 'Доста стабилен ритъм',
    section1VisualText:
      'Най-важно е да наблюдаваш собствения си ритъм през месеците.',
    tip1Title: 'Добре е да знаеш',
    tip1Text:
      'Всяка жена е различна. Важното е да познаваш собствения си ритъм и нормалните му вариации.',
    section2Body:
      'Цикълът се смята за нередовен, когато продължителността му варира често или непредсказуемо (разлика над 7 дни). Това може да се проявява като много къси цикли, много дълги цикли или липса на овулация.',
    section2VisualTitle: 'По-забележими вариации',
    section2VisualText:
      'Тези разлики могат да са временни или да продължават през няколко цикъла.',
    alertTitle: 'Обърни внимание',
    alertText:
      'Временната нередовност може да е нормална (стрес, хормонални промени, умора…). Но ако продължава, важно е да се потърси причината.',
    causes: [
      'Стрес и тревожност',
      'Хормонални дисбаланси',
      'Недостиг на сън и умора',
      'Прекалено ниско или прекалено високо тегло',
      'СПКЯ или други медицински състояния',
    ],
    checklist: [
      'Липса на менструация над 3 месеца (извън бременност/кърмене)',
      'Много дълги цикли (над 90 дни) или много къси цикли (под 21 дни)',
      'Силна болка, която ти пречи да живееш нормално',
      'Много обилно или нередовно кървене',
      'Ако се опитваш да зачнеш и овулацията изглежда липсва',
    ],
    advice: [
      'Балансирано хранене',
      'Достатъчно хидратиране',
      'Физическа активност',
      'Управление на стреса',
      'Качествен сън',
    ],
    shareMessage: 'Редовен или нередовен цикъл: каква е разликата? — AWA',
  },
  sr: {
    badge: 'ЦИКЛУС И МЕНСТРУАЦИЈА',
    title: 'Редовни или нередовни циклус:\nкаква је разлика?',
    metaDuration: '5 мин читања',
    metaValidated: 'Проверен садржај',
    intro:
      'Сваки менструални циклус је јединствен. Разумевање онога што се сматра „нормалним“ може ти помоћи да пажљивије пратиш своје здравље и уочиш могуће неравнотеже.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Редовни менструални циклус: шта је то?',
      'Нередовни циклус: шта значи?',
      'Могући узроци нередовног циклуса',
      'Када посетити лекара?',
      'Савети за уравнотеженији циклус',
    ],
    section1Body:
      'Циклус се сматра редовним када његово трајање варира између 21 и 35 дана, са разликом мањом од 7 дана од једног циклуса до следећег.',
    section1VisualTitle: 'Прилично стабилан ритам',
    section1VisualText:
      'Најважније је посматрати сопствени ритам током месеци.',
    tip1Title: 'Добро је знати',
    tip1Text:
      'Свака жена је различита. Важно је познавати сопствени ритам и његове нормалне варијације.',
    section2Body:
      'Циклус се сматра нередовним када његово трајање често или непредвидиво варира (разлика већа од 7 дана). То се може испољавати као веома кратки циклуси, веома дуги циклуси или одсуство овулације.',
    section2VisualTitle: 'Приметније варијације',
    section2VisualText:
      'Ове разлике могу бити привремене или трајати током неколико циклуса.',
    alertTitle: 'Обрати пажњу',
    alertText:
      'Привремена нередовност може бити нормална (стрес, хормонске промене, умор…). Али ако траје, важно је истражити узрок.',
    causes: [
      'Стрес и анксиозност',
      'Хормонске неравнотеже',
      'Недостатак сна и умор',
      'Прениска или превисока тежина',
      'ПЦОС или друга медицинска стања',
    ],
    checklist: [
      'Нема менструације дуже од 3 месеца (ван трудноће/дојења)',
      'Веома дуги циклуси (преко 90 дана) или веома кратки циклуси (мање од 21 дана)',
      'Јак бол који те спречава да нормално живиш',
      'Веома обилно или нередовно крварење',
      'Ако покушаваш да зачнеш, а чини се да овулације нема',
    ],
    advice: [
      'Уравнотежена исхрана',
      'Довољна хидратација',
      'Физичка активност',
      'Управљање стресом',
      'Квалитетан сан',
    ],
    shareMessage: 'Редовни или нередовни циклус: каква је разлика? — AWA',
  },
  hr: {
    badge: 'CIKLUS I MENSTRUACIJA',
    title: 'Pravilan ili nepravilan ciklus:\nu čemu je razlika?',
    metaDuration: '5 min čitanja',
    metaValidated: 'Provjeren sadržaj',
    intro:
      'Svaki je menstrualni ciklus jedinstven. Razumijevanje što se smatra „normalnim“ može ti pomoći pomnije pratiti svoje zdravlje i uočiti moguće neravnoteže.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Pravilan menstrualni ciklus: što je to?',
      'Nepravilan ciklus: što to znači?',
      'Mogući uzroci nepravilnog ciklusa',
      'Kada posjetiti liječnika?',
      'Savjeti za uravnoteženiji ciklus',
    ],
    section1Body:
      'Ciklus se smatra pravilnim kad mu se duljina kreće između 21 i 35 dana, uz razliku manju od 7 dana od ciklusa do ciklusa.',
    section1VisualTitle: 'Prilično stabilan ritam',
    section1VisualText:
      'Najvažnije je promatrati vlastiti ritam tijekom mjeseci.',
    tip1Title: 'Dobro je znati',
    tip1Text:
      'Svaka je žena drugačija. Važno je poznavati vlastiti ritam i njegova normalna odstupanja.',
    section2Body:
      'Ciklus se smatra nepravilnim kad mu se duljina često ili nepredvidljivo mijenja (razlika veća od 7 dana). To se može pokazati kao vrlo kratki ciklusi, vrlo dugi ciklusi ili izostanak ovulacije.',
    section2VisualTitle: 'Izraženija odstupanja',
    section2VisualText:
      'Te razlike mogu biti privremene ili potrajati tijekom nekoliko ciklusa.',
    alertTitle: 'Napomena',
    alertText:
      'Privremena nepravilnost može biti normalna (stres, hormonske promjene, umor…). No ako potraje, važno je istražiti uzrok.',
    causes: [
      'Stres i tjeskoba',
      'Hormonske neravnoteže',
      'Nedostatak sna i umor',
      'Preniska ili previsoka težina',
      'PCOS ili druga zdravstvena stanja',
    ],
    checklist: [
      'Nema menstruacije dulje od 3 mjeseca (izvan trudnoće/dojenja)',
      'Vrlo dugi ciklusi (više od 90 dana) ili vrlo kratki ciklusi (manje od 21 dana)',
      'Jaka bol koja te sprječava u normalnom životu',
      'Vrlo obilno ili nepravilno krvarenje',
      'Ako pokušavaš zatrudnjeti, a čini se da ovulacije nema',
    ],
    advice: [
      'Uravnotežena prehrana',
      'Dovoljna hidratacija',
      'Tjelesna aktivnost',
      'Upravljanje stresom',
      'Kvalitetan san',
    ],
    shareMessage: 'Pravilan ili nepravilan ciklus: u čemu je razlika? — AWA',
  },
  bs: {
    badge: 'CIKLUS I MENSTRUACIJA',
    title: 'Pravilan ili nepravilan ciklus:\nu čemu je razlika?',
    metaDuration: '5 min čitanja',
    metaValidated: 'Provjeren sadržaj',
    intro:
      'Svaki je menstrualni ciklus jedinstven. Razumijevanje što se smatra „normalnim“ može ti pomoći pomnije pratiti svoje zdravlje i uočiti moguće neravnoteže.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Pravilan menstrualni ciklus: što je to?',
      'Nepravilan ciklus: što to znači?',
      'Mogući uzroci nepravilnog ciklusa',
      'Kada posjetiti ljekara?',
      'Savjeti za uravnoteženiji ciklus',
    ],
    section1Body:
      'Ciklus se smatra pravilnim kad mu se duljina kreće između 21 i 35 dana, uz razliku manju od 7 dana od ciklusa do ciklusa.',
    section1VisualTitle: 'Prilično stabilan ritam',
    section1VisualText:
      'Najvažnije je promatrati vlastiti ritam tokom mjeseci.',
    tip1Title: 'Dobro je znati',
    tip1Text:
      'Svaka je žena drugačija. Važno je poznavati vlastiti ritam i njegova normalna odstupanja.',
    section2Body:
      'Ciklus se smatra nepravilnim kad mu se duljina često ili nepredvidljivo mijenja (razlika veća od 7 dana). To se može pokazati kao vrlo kratki ciklusi, vrlo dugi ciklusi ili izostanak ovulacije.',
    section2VisualTitle: 'Izraženija odstupanja',
    section2VisualText:
      'Te razlike mogu biti privremene ili potrajati tokom nekoliko ciklusa.',
    alertTitle: 'Napomena',
    alertText:
      'Privremena nepravilnost može biti normalna (stres, hormonske promjene, umor…). No ako potraje, važno je istražiti uzrok.',
    causes: [
      'Stres i tjeskoba',
      'Hormonske neravnoteže',
      'Nedostatak sna i umor',
      'Preniska ili previsoka težina',
      'PCOS ili druga zdravstvena stanja',
    ],
    checklist: [
      'Nema menstruacije dulje od 3 mjeseca (izvan trudnoće/dojenja)',
      'Vrlo dugi ciklusi (više od 90 dana) ili vrlo kratki ciklusi (manje od 21 dana)',
      'Jaka bol koja te sprječava u normalnom životu',
      'Vrlo obilno ili nepravilno krvarenje',
      'Ako pokušavaš zatrudnjeti, a čini se da ovulacije nema',
    ],
    advice: [
      'Uravnotežena ishrana',
      'Dovoljna hidratacija',
      'Tjelesna aktivnost',
      'Upravljanje stresom',
      'Kvalitetan san',
    ],
    shareMessage: 'Pravilan ili nepravilan ciklus: u čemu je razlika? — AWA',
  },
  sl: {
    badge: 'CIKEL IN MENSTRUACIJA',
    title: 'Reden ali nereden cikel:\nv čem je razlika?',
    metaDuration: '5 min branja',
    metaValidated: 'Preverjena vsebina',
    intro:
      'Vsak menstrualni cikel je edinstven. Razumevanje, kaj se šteje za „normalno“, ti lahko pomaga pozorneje spremljati svoje zdravje in opaziti morebitna neravnovesja.',
    contentsTitle: 'V tem članku',
    topics: [
      'Reden menstrualni cikel: kaj je to?',
      'Nereden cikel: kaj to pomeni?',
      'Možni vzroki nerednega cikla',
      'Kdaj obiskati zdravnika?',
      'Nasveti za uravnoteženejši cikel',
    ],
    section1Body:
      'Cikel se šteje za reden, kadar se njegova dolžina giblje med 21 in 35 dnevi, z razliko manj kot 7 dni od cikla do cikla.',
    section1VisualTitle: 'Dokaj stabilen ritem',
    section1VisualText:
      'Najpomembneje je opazovati lasten ritem skozi mesece.',
    tip1Title: 'Vredno vedeti',
    tip1Text:
      'Vsaka ženska je drugačna. Pomembno je poznati lasten ritem in njegova normalna odstopanja.',
    section2Body:
      'Cikel se šteje za nereden, kadar se njegova dolžina pogosto ali nepredvidljivo spreminja (razlika več kot 7 dni). To se lahko kaže kot zelo kratki cikli, zelo dolgi cikli ali izostanek ovulacije.',
    section2VisualTitle: 'Izrazitejša odstopanja',
    section2VisualText:
      'Te razlike so lahko začasne ali trajajo več ciklov.',
    alertTitle: 'Opomba',
    alertText:
      'Začasna nepravilnost je lahko normalna (stres, hormonske spremembe, utrujenost…). A če vztraja, je pomembno raziskati vzrok.',
    causes: [
      'Stres in tesnoba',
      'Hormonska neravnovesja',
      'Pomanjkanje spanja in utrujenost',
      'Prenizka ali previsoka teža',
      'PCOS ali druga zdravstvena stanja',
    ],
    checklist: [
      'Menstruacije ni več kot 3 mesece (izven nosečnosti/dojenja)',
      'Zelo dolgi cikli (več kot 90 dni) ali zelo kratki cikli (manj kot 21 dni)',
      'Huda bolečina, ki te ovira pri normalnem življenju',
      'Zelo obilna ali nepravilna krvavitev',
      'Če poskušaš zanositi, ovulacije pa se zdi, da ni',
    ],
    advice: [
      'Uravnotežena prehrana',
      'Dovolj hidracije',
      'Telesna dejavnost',
      'Obvladovanje stresa',
      'Kakovosten spanec',
    ],
    shareMessage: 'Reden ali nereden cikel: v čem je razlika? — AWA',
  },
  ne: {
    badge: 'चक्र र महिनावारी',
    title: 'नियमित वा अनियमित चक्र:\nके फरक छ?',
    metaDuration: '5 मिनेट पढाइ',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro:
      'हरेक मासिक चक्र अनौठो हुन्छ। “सामान्य” भनेर के मानिन्छ बुझ्नाले तपाईंलाई आफ्नो स्वास्थ्य नजिकबाट अनुगमन गर्न र सम्भावित असन्तुलन पत्ता लगाउन मद्दत गर्न सक्छ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'नियमित मासिक चक्र: यो के हो?',
      'अनियमित चक्र: यसको अर्थ के हो?',
      'अनियमित चक्रका सम्भावित कारणहरू',
      'चिकित्सकलाई कहिले देखाउने?',
      'अझ सन्तुलित चक्रका सुझावहरू',
    ],
    section1Body:
      'चक्रको अवधि 21 देखि 35 दिनबीच फेरिँदा, एक चक्रदेखि अर्कोमा 7 दिनभन्दा कम फरकसहित, यसलाई नियमित मानिन्छ।',
    section1VisualTitle: 'निकै स्थिर लय',
    section1VisualText:
      'सबैभन्दा महत्त्वपूर्ण कुरा महिनाहरूमा आफ्नै लय अवलोकन गर्नु हो।',
    tip1Title: 'जान्न लायक',
    tip1Text:
      'हरेक महिला फरक हुन्छिन्। महत्त्वपूर्ण कुरा आफ्नै लय र यसका सामान्य भिन्नताहरू जान्नु हो।',
    section2Body:
      'चक्रको अवधि प्रायः वा अप्रत्याशित रूपमा फेरिँदा (7 दिनभन्दा बढीको फरक) यसलाई अनियमित मानिन्छ। यो निकै छोटा चक्रहरू, निकै लामा चक्रहरू, वा अण्डोत्सर्गको अनुपस्थितिका रूपमा देखिन सक्छ।',
    section2VisualTitle: 'अझ स्पष्ट भिन्नताहरू',
    section2VisualText:
      'यी भिन्नताहरू अस्थायी हुन सक्छन् वा धेरै चक्रसम्म रहिरहन सक्छन्।',
    alertTitle: 'कृपया ध्यान दिनुहोस्',
    alertText:
      'अस्थायी अनियमितता सामान्य हुन सक्छ (तनाव, हर्मोनल परिवर्तन, थकान…)। तर यो रहिरहे, कारण खोज्नु महत्त्वपूर्ण छ।',
    causes: [
      'तनाव र चिन्ता',
      'हर्मोनल असन्तुलन',
      'निद्राको कमी र थकान',
      'निकै कम वा निकै बढी तौल',
      'PCOS वा अन्य चिकित्सकीय अवस्थाहरू',
    ],
    checklist: [
      '3 महिनाभन्दा बढी महिनावारी नआउनु (गर्भावस्था/स्तनपानबाहेक)',
      'निकै लामा चक्र (90 दिनभन्दा बढी) वा निकै छोटा चक्र (21 दिनभन्दा कम)',
      'तपाईंलाई सामान्य रूपमा बाँच्नबाट रोक्ने तीव्र दुखाइ',
      'निकै धेरै वा अनियमित रक्तस्राव',
      'तपाईं गर्भधारणको प्रयास गर्दै हुनुहुन्छ र अण्डोत्सर्ग अनुपस्थित जस्तो देखिन्छ भने',
    ],
    advice: [
      'सन्तुलित खानपान',
      'पर्याप्त पानीको सेवन',
      'शारीरिक गतिविधि',
      'तनाव व्यवस्थापन',
      'गुणस्तरीय निद्रा',
    ],
    shareMessage: 'नियमित वा अनियमित चक्र: के फरक छ? — AWA',
  },
  si: {
    badge: 'චක්‍රය සහ ඔසප්',
    title: 'නිතිපතා හෝ අක්‍රමවත් චක්‍රය:\nවෙනස කුමක්ද?',
    metaDuration: 'කියවීමට මිනිත්තු 5',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro:
      'සෑම ඔසප් චක්‍රයක්ම අද්විතීයයි. “සාමාන්‍ය” යැයි සැලකෙන්නේ කුමක්දැයි තේරුම් ගැනීම ඔබේ සෞඛ්‍යය වඩා සමීපව නිරීක්ෂණය කිරීමට සහ ඇතිවිය හැකි අසමතුලිතතා හඳුනාගැනීමට ඔබට උපකාරී විය හැක.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'නිතිපතා ඔසප් චක්‍රය: එය කුමක්ද?',
      'අක්‍රමවත් චක්‍රය: එයින් අදහස් වන්නේ කුමක්ද?',
      'අක්‍රමවත් චක්‍රයක ඇතිවිය හැකි හේතු',
      'ඔබ වෛද්‍යවරයෙකු හමුවිය යුත්තේ කවදාද?',
      'වඩා සමතුලිත චක්‍රයක් සඳහා ඉඟි',
    ],
    section1Body:
      'චක්‍රයක දිග දින 21 සහ 35 අතර වෙනස් වන විට, එක් චක්‍රයක සිට ඊළඟ චක්‍රයට දින 7කට අඩු වෙනසක් සහිතව, එය නිතිපතා යැයි සැලකේ.',
    section1VisualTitle: 'තරමක් ස්ථාවර රිද්මයක්',
    section1VisualText:
      'වඩාත්ම වැදගත් වන්නේ මාස පුරා ඔබේම රිද්මය නිරීක්ෂණය කිරීමයි.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text:
      'සෑම කාන්තාවක්ම වෙනස්. වැදගත් වන්නේ ඔබේම රිද්මය සහ එහි සාමාන්‍ය විචලනයන් දැනගැනීමයි.',
    section2Body:
      'චක්‍රයක දිග නිතර හෝ පුරෝකථනය කළ නොහැකි ලෙස වෙනස් වන විට (දින 7කට වඩා වෙනසක්), එය අක්‍රමවත් යැයි සැලකේ. මෙය ඉතා කෙටි චක්‍ර, ඉතා දිගු චක්‍ර, හෝ ඩිම්බ මෝචනයක් නොමැති වීමක් ලෙස ප්‍රකාශ විය හැක.',
    section2VisualTitle: 'වඩා කැපී පෙනෙන විචලනයන්',
    section2VisualText:
      'මෙම වෙනස්කම් තාවකාලික විය හැකි හෝ චක්‍ර කිහිපයක් පුරා පැවතිය හැක.',
    alertTitle: 'කරුණාකර සටහන් කරන්න',
    alertText:
      'තාවකාලික අක්‍රමවත් බව සාමාන්‍ය විය හැක (ආතතිය, හෝමෝන වෙනස්කම්, වෙහෙස…). නමුත් එය දිගටම පවතී නම්, හේතුව විමර්ශනය කිරීම වැදගත්.',
    causes: [
      'ආතතිය සහ කනස්සල්ල',
      'හෝමෝන අසමතුලිතතා',
      'නින්ද නොමැතිකම සහ වෙහෙස',
      'ඉතා අඩු හෝ ඉතා වැඩි බර',
      'PCOS හෝ වෙනත් වෛද්‍ය තත්ත්වයන්',
    ],
    checklist: [
      'මාස 3කට වඩා ඔසප් නැත (ගර්භණී කාලයෙන් / මව්කිරි පෙවීමෙන් පිටත)',
      'ඉතා දිගු චක්‍ර (දින 90කට වඩා) හෝ ඉතා කෙටි චක්‍ර (දින 21කට අඩු)',
      'ඔබව සාමාන්‍ය ලෙස ජීවත් වීමෙන් වළක්වන දැඩි වේදනාව',
      'ඉතා වැඩි හෝ අක්‍රමවත් ලේ ගැලීම',
      'ඔබ ගැබ්ගැනීමට උත්සාහ කරන්නේ නම් සහ ඩිම්බ මෝචනය නොමැති බව පෙනේ නම්',
    ],
    advice: [
      'සමතුලිත ආහාර වේල',
      'ප්‍රමාණවත් ජල සමතුලිතතාව',
      'ශාරීරික ක්‍රියාකාරකම',
      'ආතති කළමනාකරණය',
      'ගුණාත්මක නින්ද',
    ],
    shareMessage: 'නිතිපතා හෝ අක්‍රමවත් චක්‍රය: වෙනස කුමක්ද? — AWA',
  },
  th: {
    badge: 'รอบเดือนและประจำเดือน',
    title: 'รอบเดือนสม่ำเสมอหรือไม่สม่ำเสมอ:\nต่างกันอย่างไร?',
    metaDuration: 'อ่าน 5 นาที',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro:
      'รอบเดือนแต่ละรอบมีเอกลักษณ์ การเข้าใจว่าอะไรถือว่า “ปกติ” ช่วยให้คุณติดตามสุขภาพได้ใกล้ชิดขึ้นและสังเกตความไม่สมดุลที่อาจเกิดขึ้น',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'รอบเดือนสม่ำเสมอ: คืออะไร?',
      'รอบเดือนไม่สม่ำเสมอ: หมายความว่าอย่างไร?',
      'สาเหตุที่เป็นไปได้ของรอบเดือนไม่สม่ำเสมอ',
      'เมื่อไรควรพบแพทย์?',
      'เคล็ดลับเพื่อรอบเดือนที่สมดุลขึ้น',
    ],
    section1Body:
      'รอบเดือนถือว่าสม่ำเสมอเมื่อมีความยาวระหว่าง 21 ถึง 35 วัน โดยแตกต่างกันน้อยกว่า 7 วันจากรอบหนึ่งไปอีกรอบหนึ่ง',
    section1VisualTitle: 'จังหวะที่ค่อนข้างคงที่',
    section1VisualText:
      'สิ่งสำคัญที่สุดคือสังเกตจังหวะของตัวเองตลอดหลายเดือน',
    tip1Title: 'ควรรู้',
    tip1Text:
      'ผู้หญิงแต่ละคนไม่เหมือนกัน สิ่งสำคัญคือรู้จักจังหวะของตัวเองและความแปรผันปกติของมัน',
    section2Body:
      'รอบเดือนถือว่าไม่สม่ำเสมอเมื่อความยาวแปรผันบ่อยหรือคาดเดาไม่ได้ (ต่างกันมากกว่า 7 วัน) อาจปรากฏเป็นรอบที่สั้นมาก ยาวมาก หรือไม่มีการตกไข่',
    section2VisualTitle: 'ความแปรผันที่เห็นชัดขึ้น',
    section2VisualText:
      'ความแตกต่างเหล่านี้อาจเป็นเพียงชั่วคราวหรือคงอยู่หลายรอบเดือน',
    alertTitle: 'โปรดทราบ',
    alertText:
      'ความไม่สม่ำเสมอชั่วคราวเป็นเรื่องปกติได้ (ความเครียด การเปลี่ยนแปลงของฮอร์โมน ความเหนื่อยล้า…) แต่หากคงอยู่ สิ่งสำคัญคือต้องหาสาเหตุ',
    causes: [
      'ความเครียดและความวิตกกังวล',
      'ความไม่สมดุลของฮอร์โมน',
      'การนอนไม่พอและความเหนื่อยล้า',
      'น้ำหนักน้อยเกินไปหรือมากเกินไป',
      'PCOS หรือภาวะทางการแพทย์อื่น',
    ],
    checklist: [
      'ไม่มีประจำเดือนนานกว่า 3 เดือน (นอกเหนือจากการตั้งครรภ์/ให้นมแม่)',
      'รอบเดือนยาวมาก (มากกว่า 90 วัน) หรือสั้นมาก (น้อยกว่า 21 วัน)',
      'ปวดรุนแรงจนใช้ชีวิตตามปกติไม่ได้',
      'เลือดออกมากหรือไม่สม่ำเสมอ',
      'หากคุณพยายามมีบุตรและดูเหมือนไม่มีการตกไข่',
    ],
    advice: [
      'อาหารที่สมดุล',
      'ดื่มน้ำให้เพียงพอ',
      'กิจกรรมทางกาย',
      'การจัดการความเครียด',
      'การนอนหลับที่มีคุณภาพ',
    ],
    shareMessage: 'รอบเดือนสม่ำเสมอหรือไม่สม่ำเสมอ: ต่างกันอย่างไร? — AWA',
  },
  vi: {
    badge: 'CHU KỲ & KỲ KINH',
    title: 'Chu kỳ đều hay không đều:\nkhác nhau thế nào?',
    metaDuration: '5 phút đọc',
    metaValidated: 'Nội dung đã được thẩm định',
    intro:
      'Mỗi chu kỳ kinh nguyệt đều độc nhất. Hiểu điều gì được coi là “bình thường” có thể giúp bạn theo dõi sức khỏe sát sao hơn và nhận ra những mất cân bằng có thể có.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Chu kỳ kinh nguyệt đều: là gì?',
      'Chu kỳ không đều: nghĩa là gì?',
      'Những nguyên nhân có thể gây chu kỳ không đều',
      'Khi nào nên đi khám bác sĩ?',
      'Mẹo để có chu kỳ cân bằng hơn',
    ],
    section1Body:
      'Một chu kỳ được coi là đều khi độ dài của nó dao động trong khoảng 21 đến 35 ngày, với chênh lệch dưới 7 ngày từ chu kỳ này sang chu kỳ tiếp theo.',
    section1VisualTitle: 'Một nhịp điệu khá ổn định',
    section1VisualText:
      'Điều quan trọng nhất là quan sát nhịp điệu của riêng bạn qua nhiều tháng.',
    tip1Title: 'Nên biết',
    tip1Text:
      'Mỗi phụ nữ đều khác nhau. Điều quan trọng là biết nhịp điệu của riêng mình và những biến động bình thường của nó.',
    section2Body:
      'Một chu kỳ được coi là không đều khi độ dài của nó thay đổi thường xuyên hoặc không dự đoán được (chênh lệch hơn 7 ngày). Điều này có thể biểu hiện thành chu kỳ rất ngắn, chu kỳ rất dài hoặc không rụng trứng.',
    section2VisualTitle: 'Những biến động rõ rệt hơn',
    section2VisualText:
      'Những khác biệt này có thể chỉ là tạm thời hoặc kéo dài qua nhiều chu kỳ.',
    alertTitle: 'Xin lưu ý',
    alertText:
      'Sự không đều tạm thời có thể bình thường (căng thẳng, thay đổi nội tiết, mệt mỏi…). Nhưng nếu nó kéo dài, điều quan trọng là tìm hiểu nguyên nhân.',
    causes: [
      'Căng thẳng & lo âu',
      'Mất cân bằng nội tiết',
      'Thiếu ngủ & mệt mỏi',
      'Cân nặng quá thấp hoặc quá cao',
      'PCOS hoặc các bệnh lý khác',
    ],
    checklist: [
      'Không có kinh hơn 3 tháng (ngoài thai kỳ/cho con bú)',
      'Chu kỳ rất dài (hơn 90 ngày) hoặc rất ngắn (dưới 21 ngày)',
      'Cơn đau dữ dội khiến bạn không thể sinh hoạt bình thường',
      'Ra máu rất nhiều hoặc không đều',
      'Nếu bạn đang cố gắng thụ thai và có vẻ không rụng trứng',
    ],
    advice: [
      'Chế độ ăn cân bằng',
      'Uống đủ nước',
      'Hoạt động thể chất',
      'Kiểm soát căng thẳng',
      'Giấc ngủ chất lượng',
    ],
    shareMessage: 'Chu kỳ đều hay không đều: khác nhau thế nào? — AWA',
  },
  uz: {
    badge: 'SIKL VA HAYZ',
    title: 'Muntazam yoki notekis sikl:\nfarqi nimada?',
    metaDuration: '5 daq oʻqish',
    metaValidated: 'Tasdiqlangan kontent',
    intro:
      'Har bir hayz sikli noyob. Nima “normal” hisoblanishini tushunish salomatligingizni yaqinroq kuzatishga va mumkin boʻlgan muvozanat buzilishlarini payqashga yordam beradi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Muntazam hayz sikli: bu nima?',
      'Notekis sikl: bu nimani anglatadi?',
      'Notekis siklning mumkin boʻlgan sabablari',
      'Qachon shifokorga borish kerak?',
      'Muvozanatliroq sikl uchun maslahatlar',
    ],
    section1Body:
      'Sikl uzunligi 21 kundan 35 kungacha oʻzgarsa va sikldan sikliga farq 7 kundan kam boʻlsa, u muntazam hisoblanadi.',
    section1VisualTitle: 'Ancha barqaror ritm',
    section1VisualText:
      'Eng muhimi — oylar davomida oʻz ritmingizni kuzatish.',
    tip1Title: 'Bilish foydali',
    tip1Text:
      'Har bir ayol boshqacha. Muhimi — oʻz ritmingiz va uning meʼyoriy oʻzgarishlarini bilish.',
    section2Body:
      'Sikl uzunligi tez-tez yoki oldindan aytib boʻlmaydigan tarzda oʻzgarsa (farq 7 kundan ortiq), u notekis hisoblanadi. Bu juda qisqa sikllar, juda uzun sikllar yoki ovulyatsiyaning yoʻqligi koʻrinishida boʻlishi mumkin.',
    section2VisualTitle: 'Sezilarliroq oʻzgarishlar',
    section2VisualText:
      'Bu farqlar vaqtinchalik boʻlishi yoki bir necha sikl davomida saqlanib qolishi mumkin.',
    alertTitle: 'Eʼtibor bering',
    alertText:
      'Vaqtinchalik notekislik normal boʻlishi mumkin (stress, gormonal oʻzgarishlar, charchoq…). Ammo agar u saqlanib qolsa, sababini aniqlash muhim.',
    causes: [
      'Stress va xavotir',
      'Gormonal muvozanat buzilishlari',
      'Uyqu yetishmasligi va charchoq',
      'Vaznning juda past yoki juda yuqori boʻlishi',
      'PCOS yoki boshqa tibbiy holatlar',
    ],
    checklist: [
      '3 oydan ortiq hayz yoʻq (homiladorlik/emizishdan tashqari)',
      'Juda uzun sikllar (90 kundan ortiq) yoki juda qisqa sikllar (21 kundan kam)',
      'Normal yashashingizga xalaqit beradigan kuchli ogʻriq',
      'Juda koʻp yoki notekis qon ketishi',
      'Homilador boʻlishga urinayotgan boʻlsangiz va ovulyatsiya yoʻqdek tuyulsa',
    ],
    advice: [
      'Muvozanatli ovqatlanish',
      'Yetarli suv balansi',
      'Jismoniy faollik',
      'Stressni boshqarish',
      'Sifatli uyqu',
    ],
    shareMessage: 'Muntazam yoki notekis sikl: farqi nimada? — AWA',
  },
  az: {
    badge: 'DÖVR VƏ AYBAŞI',
    title: 'Müntəzəm və ya qeyri-müntəzəm dövr:\nfərq nədir?',
    metaDuration: '5 dəq oxu',
    metaValidated: 'Yoxlanılmış məzmun',
    intro:
      'Hər menstrual dövr özünəməxsusdur. Nəyin “normal” sayıldığını anlamaq sağlamlığınızı daha yaxından izləməyə və mümkün disbalansları görməyə kömək edə bilər.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Müntəzəm menstrual dövr: bu nədir?',
      'Qeyri-müntəzəm dövr: bu nə deməkdir?',
      'Qeyri-müntəzəm dövrün mümkün səbəbləri',
      'Nə vaxt həkimə müraciət etmək lazımdır?',
      'Daha balanslı dövr üçün məsləhətlər',
    ],
    section1Body:
      'Dövrün uzunluğu 21 ilə 35 gün arasında dəyişirsə və bir dövrdən digərinə fərq 7 gündən azdırsa, o, müntəzəm sayılır.',
    section1VisualTitle: 'Kifayət qədər sabit ritm',
    section1VisualText:
      'Ən vacibi aylar ərzində öz ritminizi müşahidə etməkdir.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text:
      'Hər qadın fərqlidir. Vacib olan öz ritminizi və onun normal dəyişkənliklərini bilməkdir.',
    section2Body:
      'Dövrün uzunluğu tez-tez və ya gözlənilmədən (7 gündən çox fərqlə) dəyişirsə, o, qeyri-müntəzəm sayılır. Bu, çox qısa dövrlər, çox uzun dövrlər və ya ovulyasiyanın olmaması şəklində təzahür edə bilər.',
    section2VisualTitle: 'Daha nəzərəçarpan dəyişkənliklər',
    section2VisualText:
      'Bu fərqlər müvəqqəti ola və ya bir neçə dövr ərzində davam edə bilər.',
    alertTitle: 'Nəzərə alın',
    alertText:
      'Müvəqqəti qeyri-müntəzəmlik normal ola bilər (stress, hormonal dəyişikliklər, yorğunluq…). Lakin davam edərsə, səbəbi araşdırmaq vacibdir.',
    causes: [
      'Stress və narahatlıq',
      'Hormonal disbalans',
      'Yuxusuzluq və yorğunluq',
      'Həddindən az və ya çox çəki',
      'PKOS və ya digər tibbi vəziyyətlər',
    ],
    checklist: [
      '3 aydan çox aybaşının olmaması (hamiləlik/əmizdirmə istisna olmaqla)',
      'Çox uzun dövrlər (90 gündən çox) və ya çox qısa dövrlər (21 gündən az)',
      'Normal yaşamağınıza mane olan şiddətli ağrı',
      'Çox bol və ya qeyri-müntəzəm qanaxma',
      'Hamilə qalmağa çalışırsınızsa və ovulyasiyanın olmadığı görünürsə',
    ],
    advice: [
      'Balanslı qidalanma',
      'Kifayət qədər hidratasiya',
      'Fiziki fəaliyyət',
      'Stressin idarə edilməsi',
      'Keyfiyyətli yuxu',
    ],
    shareMessage: 'Müntəzəm və ya qeyri-müntəzəm dövr: fərq nədir? — AWA',
  },
  ka: {
    badge: 'ციკლი და მენსტრუაცია',
    title: 'რეგულარული თუ არარეგულარული ციკლი:\nრა არის განსხვავება?',
    metaDuration: '5 წთ საკითხავი',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro:
      'ყოველი მენსტრუაციული ციკლი უნიკალურია. იმის გაგებამ, რა ითვლება „ნორმალურად“, შეიძლება თქვენი ჯანმრთელობის უფრო დაკვირვებით კონტროლსა და შესაძლო დისბალანსის შემჩნევაში დაგეხმაროთ.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რეგულარული მენსტრუაციული ციკლი: რა არის ეს?',
      'არარეგულარული ციკლი: რას ნიშნავს ეს?',
      'არარეგულარული ციკლის შესაძლო მიზეზები',
      'როდის უნდა მივმართოთ ექიმს?',
      'რჩევები უფრო დაბალანსებული ციკლისთვის',
    ],
    section1Body:
      'ციკლი რეგულარულად ითვლება, როცა მისი ხანგრძლივობა 21-დან 35 დღემდე მერყეობს, ერთი ციკლიდან მეორემდე 7 დღეზე ნაკლები სხვაობით.',
    section1VisualTitle: 'საკმაოდ სტაბილური რიტმი',
    section1VisualText:
      'ყველაზე მნიშვნელოვანია თვეების განმავლობაში საკუთარ რიტმზე დაკვირვება.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text:
      'ყველა ქალი განსხვავებულია. მთავარია საკუთარი რიტმისა და მისი ნორმალური ვარიაციების ცოდნა.',
    section2Body:
      'ციკლი არარეგულარულად ითვლება, როცა მისი ხანგრძლივობა ხშირად ან არაპროგნოზირებადად იცვლება (7 დღეზე მეტი სხვაობა). ეს შეიძლება გამოვლინდეს ძალიან მოკლე ციკლებად, ძალიან გრძელ ციკლებად ან ოვულაციის არარსებობად.',
    section2VisualTitle: 'უფრო შესამჩნევი ცვალებადობა',
    section2VisualText:
      'ეს განსხვავებები დროებითი შეიძლება იყოს ან რამდენიმე ციკლის განმავლობაში გაგრძელდეს.',
    alertTitle: 'გაითვალისწინეთ',
    alertText:
      'დროებითი არარეგულარულობა ნორმალური შეიძლება იყოს (სტრესი, ჰორმონული ცვლილებები, დაღლილობა…). მაგრამ თუ ის გრძელდება, მნიშვნელოვანია მიზეზის გამოკვლევა.',
    causes: [
      'სტრესი და შფოთვა',
      'ჰორმონული დისბალანსი',
      'ძილის ნაკლებობა და დაღლილობა',
      'ძალიან დაბალი ან ძალიან მაღალი წონა',
      'PCOS ან სხვა სამედიცინო მდგომარეობები',
    ],
    checklist: [
      'მენსტრუაცია 3 თვეზე მეტი ხნის განმავლობაში არ მოდის (ორსულობისა/ძუძუთი კვების გარეშე)',
      'ძალიან გრძელი ციკლები (90 დღეზე მეტი) ან ძალიან მოკლე ციკლები (21 დღეზე ნაკლები)',
      'ინტენსიური ტკივილი, რომელიც ნორმალურად ცხოვრებას გიშლით',
      'ძალიან უხვი ან არარეგულარული სისხლდენა',
      'თუ ჩასახვას ცდილობთ და ოვულაცია არარსებულად გეჩვენებათ',
    ],
    advice: [
      'დაბალანსებული კვება',
      'საკმარისი ჰიდრატაცია',
      'ფიზიკური აქტივობა',
      'სტრესის მართვა',
      'ხარისხიანი ძილი',
    ],
    shareMessage: 'რეგულარული თუ არარეგულარული ციკლი: რა არის განსხვავება? — AWA',
  },
  hy: {
    badge: 'ՑԻԿԼ ԵՎ ԴԱՇՏԱՆ',
    title: 'Կանոնավոր թե անկանոն ցիկլ.\nո՞րն է տարբերությունը',
    metaDuration: '5 ր կարդալու համար',
    metaValidated: 'Վերանայված բովանդակություն',
    intro:
      'Յուրաքանչյուր դաշտանային ցիկլ եզակի է: Հասկանալը, թե ինչն է համարվում «նորմալ», կարող է օգնել ավելի ուշադիր հետևել ձեր առողջությանը և նկատել հնարավոր անհավասարակշռությունները:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Կանոնավոր դաշտանային ցիկլ. ի՞նչ է դա',
      'Անկանոն ցիկլ. ի՞նչ է դա նշանակում',
      'Անկանոն ցիկլի հնարավոր պատճառներ',
      'Ե՞րբ պետք է դիմել բժշկի',
      'Խորհուրդներ՝ ավելի հավասարակշռված ցիկլի համար',
    ],
    section1Body:
      'Ցիկլը համարվում է կանոնավոր, երբ դրա տևողությունը տատանվում է 21-ից 35 օրվա միջև՝ մի ցիկլից մյուսը 7 օրից պակաս տարբերությամբ:',
    section1VisualTitle: 'Բավական կայուն ռիթմ',
    section1VisualText:
      'Ամենակարևորը ամիսների ընթացքում ձեր սեփական ռիթմը դիտարկելն է:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text:
      'Յուրաքանչյուր կին տարբեր է: Կարևորը իմանալն է ձեր սեփական ռիթմը և դրա նորմալ տատանումները:',
    section2Body:
      'Ցիկլը համարվում է անկանոն, երբ դրա տևողությունը հաճախ կամ անկանխատեսելիորեն տատանվում է (7 օրից ավելի տարբերություն): Սա կարող է դրսևորվել շատ կարճ ցիկլերով, շատ երկար ցիկլերով կամ ձվազատման բացակայությամբ:',
    section2VisualTitle: 'Ավելի նկատելի տատանումներ',
    section2VisualText:
      'Այս տարբերությունները կարող են լինել ժամանակավոր կամ շարունակվել մի քանի ցիկլի ընթացքում:',
    alertTitle: 'Խնդրում ենք ուշադրություն դարձնել',
    alertText:
      'Ժամանակավոր անկանոնությունը կարող է նորմալ լինել (սթրես, հորմոնալ փոփոխություններ, հոգնածություն…): Բայց եթե այն շարունակվում է, կարևոր է ուսումնասիրել պատճառը:',
    causes: [
      'Սթրես և անհանգստություն',
      'Հորմոնալ անհավասարակշռություններ',
      'Քնի պակաս և հոգնածություն',
      'Շատ ցածր կամ շատ բարձր քաշ',
      'PCOS կամ այլ բժշկական վիճակներ',
    ],
    checklist: [
      'Դաշտան չկա 3 ամսից ավելի (հղիությունից/կրծքով կերակրումից դուրս)',
      'Շատ երկար ցիկլեր (90 օրից ավելի) կամ շատ կարճ ցիկլեր (21 օրից պակաս)',
      'Ինտենսիվ ցավ, որը խանգարում է նորմալ ապրել',
      'Շատ առատ կամ անկանոն արյունահոսություն',
      'Եթե փորձում եք հղիանալ, և ձվազատումը կարծես բացակայում է',
    ],
    advice: [
      'Հավասարակշռված սննդակարգ',
      'Բավարար հիդրատացիա',
      'Ֆիզիկական ակտիվություն',
      'Սթրեսի կառավարում',
      'Որակյալ քուն',
    ],
    shareMessage: 'Կանոնավոր թե անկանոն ցիկլ. ո՞րն է տարբերությունը — AWA',
  },
  tg: {
    badge: 'ДАВРА ВА ҲАЙЗ',
    title: 'Давраи мунтазам ё номунтазам:\nфарқ дар чист?',
    metaDuration: '5 дақ барои хондан',
    metaValidated: 'Мазмуни баррасишуда',
    intro:
      'Ҳар давраи ҳайз беназир аст. Фаҳмидани он ки чӣ «муқаррарӣ» ҳисоб мешавад, метавонад ба шумо кумак кунад саломатии худро бодиққаттар пайгирӣ кунед ва номутавозунии эҳтимолиро пай баред.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Давраи мунтазами ҳайз: чист?',
      'Давраи номунтазам: чӣ маъно дорад?',
      'Сабабҳои имконпазири давраи номунтазам',
      'Кай бояд ба табиб муроҷиат кард?',
      'Маслиҳатҳо барои давраи мутавозинтар',
    ],
    section1Body:
      'Давра мунтазам ҳисоб мешавад, вақте ки дарозии он байни 21 ва 35 рӯз тағйир меёбад, бо фарқи камтар аз 7 рӯз аз як давра то давраи дигар.',
    section1VisualTitle: 'Суръати нисбатан собит',
    section1VisualText:
      'Муҳимтарин чиз мушоҳидаи суръати худи шумо дар давоми моҳҳост.',
    tip1Title: 'Донистан хуб аст',
    tip1Text:
      'Ҳар зан гуногун аст. Муҳим донистани суръати худи шумо ва тағйирёбии муқаррарии он аст.',
    section2Body:
      'Давра номунтазам ҳисоб мешавад, вақте ки дарозии он зуд-зуд ё ба таври пешгӯинашаванда тағйир меёбад (фарқи зиёда аз 7 рӯз). Ин метавонад ҳамчун давраҳои хеле кӯтоҳ, давраҳои хеле дароз ё набудани овуляция зоҳир шавад.',
    section2VisualTitle: 'Тағйироти намоёнтар',
    section2VisualText:
      'Ин фарқиятҳо метавонанд муваққатӣ бошанд ё дар давоми якчанд давра идома ёбанд.',
    alertTitle: 'Таваҷҷӯҳ кунед',
    alertText:
      'Номунтазамии муваққатӣ метавонад муқаррарӣ бошад (стресс, тағйироти гормонӣ, хастагӣ…). Аммо агар идома ёбад, муҳим аст, ки сабабро таҳқиқ кунед.',
    causes: [
      'Стресс ва изтироб',
      'Номутавозунии гормонӣ',
      'Камхобӣ ва хастагӣ',
      'Вазни хеле кам ё хеле зиёд',
      'PCOS ё ҳолатҳои дигари тиббӣ',
    ],
    checklist: [
      'Зиёда аз 3 моҳ ҳайз нест (берун аз ҳомиладорӣ/шири додан)',
      'Давраҳои хеле дароз (зиёда аз 90 рӯз) ё хеле кӯтоҳ (камтар аз 21 рӯз)',
      'Дарди шадид, ки шуморо аз зиндагии муқаррарӣ бозмедорад',
      'Хунравии хеле зиёд ё номунтазам',
      'Агар кӯшиши ҳомиладор шуданро доред ва овуляция ғоиб ба назар мерасад',
    ],
    advice: [
      'Ғизои мутавозин',
      'Обнӯшии кофӣ',
      'Фаъолияти ҷисмонӣ',
      'Идораи стресс',
      'Хоби босифат',
    ],
    shareMessage: 'Давраи мунтазам ё номунтазам: фарқ дар чист? — AWA',
  },
  ky: {
    badge: 'ЦИКЛ ЖАНА ЕТЕК КИРИМДЕР',
    title: 'Туура же туура эмес цикл:\nайырмасы эмнеде?',
    metaDuration: '5 мүн окуу',
    metaValidated: 'Текшерилген мазмун',
    intro:
      'Ар бир етек кирим цикли уникалдуу. «Нормалдуу» деп эмне эсептелерин түшүнүү ден соолугуңузду жакындан көзөмөлдөөгө жана мүмкүн болгон тең салмактуулуктун бузулушун байкоого жардам бериши мүмкүн.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Туура етек кирим цикли: бул эмне?',
      'Туура эмес цикл: бул эмнени билдирет?',
      'Туура эмес циклдин мүмкүн болгон себептери',
      'Дарыгерге качан барыш керек?',
      'Тең салмактуураак цикл үчүн кеңештер',
    ],
    section1Body:
      'Цикл узактыгы 21 менен 35 күндүн ортосунда өзгөрүп, бир циклден экинчисине 7 күндөн аз айырмаланганда туура деп эсептелет.',
    section1VisualTitle: 'Бир кыйла туруктуу ритм',
    section1VisualText:
      'Эң маанилүүсү — айлар бою өз ритмиңизди байкоо.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text:
      'Ар бир аял ар башка. Маанилүүсү — өз ритмиңизди жана анын кадимки өзгөрүүлөрүн билүү.',
    section2Body:
      'Цикл узактыгы тез-тез же болжолдонбогондой өзгөргөндө (7 күндөн ашык айырмачылык) туура эмес деп эсептелет. Бул абдан кыска циклдер, абдан узун циклдер же овуляциянын жоктугу катары көрүнүшү мүмкүн.',
    section2VisualTitle: 'Көбүрөөк байкалаарлык өзгөрүүлөр',
    section2VisualText:
      'Бул айырмачылыктар убактылуу болушу же бир нече цикл бою сакталышы мүмкүн.',
    alertTitle: 'Көңүл буруңуз',
    alertText:
      'Убактылуу туура эместик кадимки болушу мүмкүн (стресс, гормондук өзгөрүүлөр, чарчоо…). Бирок ал улана берсе, себебин изилдөө маанилүү.',
    causes: [
      'Стресс жана тынчсыздануу',
      'Гормондук тең салмактуулуктун бузулушу',
      'Уйкунун жетишсиздиги жана чарчоо',
      'Өтө төмөн же өтө жогору салмак',
      'PCOS же башка медициналык абалдар',
    ],
    checklist: [
      '3 айдан ашык етек кирим жок (курсактуулук/эмчек эмизүүдөн тышкары)',
      'Абдан узун (90 күндөн ашык) же абдан кыска (21 күндөн аз) циклдер',
      'Нормалдуу жашоого тоскоол болгон күчтүү оору',
      'Өтө көп же туура эмес кан кетүү',
      'Боюна бүтүүгө аракет кылып жатсаңыз жана овуляция жок окшосо',
    ],
    advice: [
      'Тең салмактуу тамактануу',
      'Жетиштүү суюктук ичүү',
      'Физикалык активдүүлүк',
      'Стрессти башкаруу',
      'Сапаттуу уйку',
    ],
    shareMessage: 'Туура же туура эмес цикл: айырмасы эмнеде? — AWA',
  },
  tk: {
    badge: 'SIKL WE AÝBAŞY',
    title: 'Yzygiderli ýa-da düzgünsiz sikl:\ntapawudy näme?',
    metaDuration: '5 min okamak',
    metaValidated: 'Barlanan mazmun',
    intro:
      'Her aýbaşy sikli ýeke-täk. «Adaty» hasaplanýan zady düşünmek saglygyňyzy has ýakyndan yzarlamaga we mümkin deňagramsyzlyklary görmäge kömek edip biler.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Yzygiderli aýbaşy sikli: ol näme?',
      'Düzgünsiz sikl: ol näme aňladýar?',
      'Düzgünsiz sikliň mümkin sebäpleri',
      'Lukmana haçan ýüz tutmaly?',
      'Has deňagramly sikl üçin maslahatlar',
    ],
    section1Body:
      'Sikl uzynlygy 21 bilen 35 günüň arasynda üýtgände we bir sikldan beýlekisine 7 günden az tapawut bolanda yzygiderli hasaplanýar.',
    section1VisualTitle: 'Birneme durnukly ritm',
    section1VisualText:
      'Iň möhümi aýlar boýy öz ritmiňizi synlamak.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text:
      'Her aýal dürli. Möhümi öz ritmiňizi we onuň adaty üýtgeşmelerini bilmek.',
    section2Body:
      'Sikl uzynlygy ýygy ýa-da çaklanylmaýan ýagdaýda (7 günden köp tapawut) üýtgände düzgünsiz hasaplanýar. Bu gaty gysga sikller, gaty uzak sikller ýa-da ovulýasiýanyň ýoklugy hökmünde ýüze çykyp biler.',
    section2VisualTitle: 'Has aýdyň üýtgeşmeler',
    section2VisualText:
      'Bu tapawutlar wagtlaýyn bolup ýa-da birnäçe sikl dowam edip biler.',
    alertTitle: 'Üns beriň',
    alertText:
      'Wagtlaýyn düzgünsizlik adaty bolup biler (stres, gormonal üýtgeşmeler, ýadawlyk…). Emma dowam etse, sebäbini derňemek möhüm.',
    causes: [
      'Stres we biynjalyklyk',
      'Gormonal deňagramsyzlyklar',
      'Uky ýetmezçiligi we ýadawlyk',
      'Aşa pes ýa-da aşa ýokary agram',
      'PCOS ýa-da beýleki lukmançylyk ýagdaýlary',
    ],
    checklist: [
      '3 aýdan köp aýbaşy ýok (göwrelilik/emdirmeden daşda)',
      'Gaty uzak sikller (90 günden köp) ýa-da gaty gysga sikller (21 günden az)',
      'Adaty ýaşamaga päsgel berýän güýçli agyry',
      'Gaty köp ýa-da düzgünsiz gan akma',
      'Göwreli bolmaga synanyşýan bolsaňyz we ovulýasiýa ýok ýaly görünse',
    ],
    advice: [
      'Deňagramly iýmitlenmek',
      'Ýeterlik suwlandyrmak',
      'Fiziki işjeňlik',
      'Stresi dolandyrmak',
      'Hilli uky',
    ],
    shareMessage: 'Yzygiderli ýa-da düzgünsiz sikl: tapawudy näme? — AWA',
  },
  ms: {
    badge: 'KITARAN & HAID',
    title: 'Kitaran teratur atau tidak teratur:\napa bezanya?',
    metaDuration: '5 min bacaan',
    metaValidated: 'Kandungan disemak',
    intro:
      'Setiap kitaran haid adalah unik. Memahami apa yang dianggap “normal” boleh membantu anda menjejaki kesihatan anda dengan lebih teliti dan mengesan kemungkinan ketidakseimbangan.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Kitaran haid yang teratur: apakah itu?',
      'Kitaran tidak teratur: apa maksudnya?',
      'Kemungkinan punca kitaran tidak teratur',
      'Bila anda patut berjumpa doktor?',
      'Petua untuk kitaran yang lebih seimbang',
    ],
    section1Body:
      'Kitaran dianggap teratur apabila tempohnya berbeza antara 21 dan 35 hari, dengan perbezaan kurang daripada 7 hari dari satu kitaran ke kitaran berikutnya.',
    section1VisualTitle: 'Rentak yang agak stabil',
    section1VisualText:
      'Yang paling penting ialah memerhati rentak anda sendiri sepanjang bulan.',
    tip1Title: 'Elok diketahui',
    tip1Text:
      'Setiap wanita berbeza. Yang penting ialah mengetahui rentak anda sendiri dan perubahan normalnya.',
    section2Body:
      'Kitaran dianggap tidak teratur apabila tempohnya kerap atau tidak dapat diramal berubah (perbezaan lebih daripada 7 hari). Ini boleh muncul sebagai kitaran yang sangat pendek, kitaran yang sangat panjang atau ketiadaan ovulasi.',
    section2VisualTitle: 'Perubahan yang lebih ketara',
    section2VisualText:
      'Perbezaan ini boleh bersifat sementara atau berterusan sepanjang beberapa kitaran.',
    alertTitle: 'Sila ambil perhatian',
    alertText:
      'Ketidakteraturan sementara boleh menjadi normal (tekanan, perubahan hormon, keletihan…). Tetapi jika ia berterusan, adalah penting untuk menyiasat puncanya.',
    causes: [
      'Tekanan & keresahan',
      'Ketidakseimbangan hormon',
      'Kurang tidur & keletihan',
      'Berat badan terlalu rendah atau terlalu tinggi',
      'PCOS atau keadaan perubatan lain',
    ],
    checklist: [
      'Tiada haid selama lebih daripada 3 bulan (di luar kehamilan/penyusuan)',
      'Kitaran yang sangat panjang (lebih daripada 90 hari) atau sangat pendek (kurang daripada 21 hari)',
      'Sakit yang kuat yang menghalang anda hidup seperti biasa',
      'Pendarahan yang sangat banyak atau tidak teratur',
      'Jika anda cuba hamil dan ovulasi nampaknya tiada',
    ],
    advice: [
      'Pemakanan seimbang',
      'Hidrasi yang mencukupi',
      'Aktiviti fizikal',
      'Pengurusan tekanan',
      'Tidur yang berkualiti',
    ],
    shareMessage: 'Kitaran teratur atau tidak teratur: apa bezanya? — AWA',
  },
  so: {
    badge: 'WAREEG & CAADO',
    title: 'Wareeg joogto ah ama aan joogto ahayn:\nmaxay kala duwan yihiin?',
    metaDuration: '5 daq akhris',
    metaValidated: 'Macluumaad la dib-u-eegay',
    intro:
      'Wareeg caado kastaa waa mid gaar ah. Fahamka waxa loo tixgeliyo “caadi” ayaa kaa caawin kara inaad si ka dhow u la socoto caafimaadkaaga oo aad aqoonsato dheelitir la’aan suurtagal ah.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Wareegga caadada joogtada ah: waa maxay?',
      'Wareeg aan joogto ahayn: maxaa macnaheedu yahay?',
      'Sababaha suurtagalka ah ee wareeg aan joogto ahayn',
      'Goorta dhakhtar la arko?',
      'Talooyin wareeg dheelitiran',
    ],
    section1Body:
      'Wareeg waxaa loo tixgeliyaa mid joogto ah marka dhererkiisu u dhexeeyo 21 iyo 35 maalmood, isagoo leh farqi ka yar 7 maalmood wareeg ilaa wareeg.',
    section1VisualTitle: 'Xawaare si dhexdhexaad ah degan',
    section1VisualText:
      'Waxa ugu muhiimsan waa indho-indheynta xawaarahaaga gaarka ah bilaha gudahood.',
    tip1Title: 'Waxtar leh in la ogaado',
    tip1Text:
      'Naag kastaa waa kala duwan tahay. Waxa muhiimka ah waa ogaanshaha xawaarahaaga gaarka ah iyo kala duwanaanshihiisa caadiga ah.',
    section2Body:
      'Wareeg waxaa loo tixgeliyaa mid aan joogto ahayn marka dhererkiisu si joogto ah ama aan la saadaalin karin u kala duwan yahay (farqi ka badan 7 maalmood). Tani waxay ku muuqan kartaa wareegyo aad u gaaban, wareegyo aad u dheer, ama ukun-sii-deyn la’aan.',
    section2VisualTitle: 'Kala duwanaansho ka muuqda',
    section2VisualText:
      'Farqiyadani way noqon karaan kuwo ku meel gaar ah ama sii socon karaan dhowr wareeg.',
    alertTitle: 'Fadlan ogow',
    alertText:
      'Aan-joogtayn ku meel gaar ah waxay noqon kartaa caadi (walaac, isbeddelada hormoonka, daal…). Laakiin haddii ay sii socoto, waa muhiim in la baaro sababta.',
    causes: [
      'Walaac & nafsi-murugo',
      'Dheelitir la’aan hormoon',
      'Hurdo la’aan & daal',
      'Miisaan aad u hooseeya ama aad u sarreeya',
      'PCOS ama xaalado caafimaad oo kale',
    ],
    checklist: [
      'Caado la’aan in ka badan 3 bilood (uur/nuujin ka baxsan)',
      'Wareegyo aad u dhaadheer (in ka badan 90 maalmood) ama wareegyo aad u gaaban (wax ka yar 21 maalmood)',
      'Xanuun xoog badan oo ku joojiya inaad caadi u noolaato',
      'Dhiigbax aad u culus ama aan joogto ahayn',
      'Haddii aad isku daydayso inaad uur yeelato oo ukun-sii-deyn u muuqato inay maqan tahay',
    ],
    advice: [
      'Cunto dheelitiran',
      'Biyo-cabbid ku filan',
      'Firfircooni jidheed',
      'Maamulka walaaca',
      'Hurdo tayo leh',
    ],
    shareMessage: 'Wareeg joogto ah ama aan joogto ahayn: maxay kala duwan yihiin? — AWA',
  },
  sw: {
    badge: 'MZUNGUKO NA HEDHI',
    title: 'Mzunguko wa mpangilio au usio wa mpangilio:\nkuna tofauti gani?',
    metaDuration: 'Dakika 5 za kusoma',
    metaValidated: 'Maudhui yaliyokaguliwa',
    intro:
      'Kila mzunguko wa hedhi ni wa kipekee. Kuelewa kinachochukuliwa kuwa “cha kawaida” kunaweza kukusaidia kufuatilia afya yako kwa karibu zaidi na kutambua kutokuwa na usawa kunakowezekana.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Mzunguko wa hedhi wa mpangilio: ni nini?',
      'Mzunguko usio wa mpangilio: unamaanisha nini?',
      'Sababu zinazowezekana za mzunguko usio wa mpangilio',
      'Wakati gani umwone daktari?',
      'Vidokezo vya mzunguko wenye usawa zaidi',
    ],
    section1Body:
      'Mzunguko unachukuliwa kuwa wa mpangilio urefu wake unapotofautiana kati ya siku 21 na 35, kwa tofauti ya chini ya siku 7 kutoka mzunguko mmoja hadi unaofuata.',
    section1VisualTitle: 'Mdundo wa kiasi thabiti',
    section1VisualText:
      'Kinachojalisha zaidi ni kuchunguza mdundo wako mwenyewe katika miezi.',
    tip1Title: 'Vyema kujua',
    tip1Text:
      'Kila mwanamke ni tofauti. Kinachojalisha ni kujua mdundo wako mwenyewe na tofauti zake za kawaida.',
    section2Body:
      'Mzunguko unachukuliwa kuwa si wa mpangilio urefu wake unapotofautiana mara nyingi au bila kutabirika (tofauti ya zaidi ya siku 7). Hili linaweza kujitokeza kama mizunguko mifupi sana, mizunguko mirefu sana, au kukosekana kwa utoaji wa yai.',
    section2VisualTitle: 'Tofauti zinazoonekana zaidi',
    section2VisualText:
      'Tofauti hizi zinaweza kuwa za muda au kudumu katika mizunguko kadhaa.',
    alertTitle: 'Tafadhali zingatia',
    alertText:
      'Kutokuwa na mpangilio kwa muda kunaweza kuwa kawaida (msongo wa mawazo, mabadiliko ya homoni, uchovu…). Lakini kukiendelea, ni muhimu kuchunguza sababu.',
    causes: [
      'Msongo wa mawazo na wasiwasi',
      'Kutokuwa na usawa wa homoni',
      'Ukosefu wa usingizi na uchovu',
      'Uzito mdogo sana au mkubwa sana',
      'PCOS au hali nyingine za kitabibu',
    ],
    checklist: [
      'Hakuna hedhi kwa zaidi ya miezi 3 (nje ya ujauzito/kunyonyesha)',
      'Mizunguko mirefu sana (zaidi ya siku 90) au mifupi sana (chini ya siku 21)',
      'Maumivu makali yanayokuzuia kuishi kawaida',
      'Kutokwa damu nyingi sana au kusiko kwa mpangilio',
      'Ikiwa unajaribu kupata ujauzito na utoaji wa yai unaonekana kukosekana',
    ],
    advice: [
      'Lishe yenye usawa',
      'Kunywa maji ya kutosha',
      'Shughuli za mwili',
      'Kudhibiti msongo wa mawazo',
      'Usingizi bora',
    ],
    shareMessage: 'Mzunguko wa mpangilio au usio wa mpangilio: kuna tofauti gani? — AWA',
  },
  kk: {
    badge: 'ЦИКЛ ЖӘНЕ ЕТЕККІР',
    title: 'Тұрақты немесе тұрақсыз цикл:\nайырмашылығы неде?',
    metaDuration: '5 мин оқу',
    metaValidated: 'Тексерілген мазмұн',
    intro:
      'Әр етеккір циклі бірегей. Нені “қалыпты” деп санайтынын түсіну денсаулығыңызды жақынырақ бақылауға және ықтимал тепе-теңсіздіктерді байқауға көмектесе алады.',
    contentsTitle: 'Осы мақалада',
    topics: [
      'Тұрақты етеккір циклі: ол не?',
      'Тұрақсыз цикл: бұл нені білдіреді?',
      'Тұрақсыз циклдің мүмкін себептері',
      'Дәрігерге қашан бару керек?',
      'Теңгерімдірек цикл үшін кеңестер',
    ],
    section1Body:
      'Цикл ұзақтығы 21-ден 35 күнге дейін өзгерсе және бір циклден екіншісіне 7 күннен аз айырмашылық болса, тұрақты деп есептеледі.',
    section1VisualTitle: 'Біршама тұрақты ырғақ',
    section1VisualText:
      'Ең бастысы — өз ырғағыңызды айлар бойы бақылау.',
    tip1Title: 'Білуге тиісті',
    tip1Text:
      'Әр әйел әртүрлі. Маңыздысы — өз ырғағыңызды және оның қалыпты ауытқуларын білу.',
    section2Body:
      'Цикл ұзақтығы жиі немесе болжанбайтындай (7 күннен астам айырмашылық) өзгерсе, ол тұрақсыз деп есептеледі. Бұл өте қысқа циклдер, өте ұзақ циклдер немесе овуляцияның болмауы ретінде көрінуі мүмкін.',
    section2VisualTitle: 'Айқынырақ ауытқулар',
    section2VisualText:
      'Бұл айырмашылықтар уақытша болуы немесе бірнеше циклде сақталуы мүмкін.',
    alertTitle: 'Назар аударыңыз',
    alertText:
      'Уақытша тұрақсыздық қалыпты болуы мүмкін (күйзеліс, гормондық өзгерістер, шаршау…). Бірақ ол сақталса, себебін зерттеу маңызды.',
    causes: [
      'Күйзеліс және алаңдаушылық',
      'Гормондық тепе-теңсіздіктер',
      'Ұйқының жетіспеуі және шаршау',
      'Тым төмен немесе тым жоғары салмақ',
      'ПКЯС немесе басқа медициналық жағдайлар',
    ],
    checklist: [
      '3 айдан астам етеккір болмауы (жүктілік/емізуден тыс)',
      'Өте ұзақ циклдер (90 күннен астам) немесе өте қысқа циклдер (21 күннен аз)',
      'Қалыпты өмір сүруге кедергі келтіретін қатты ауыру',
      'Өте мол немесе тұрақсыз қан кету',
      'Жүкті болуға тырысып жатсаңыз және овуляция жоқ сияқты көрінсе',
    ],
    advice: [
      'Теңгерімді тамақтану',
      'Жеткілікті су ішу',
      'Дене белсенділігі',
      'Күйзелісті басқару',
      'Сапалы ұйқы',
    ],
    shareMessage: 'Тұрақты немесе тұрақсыз цикл: айырмашылығы неде? — AWA',
  },
  wo: {
    badge: 'WËRSËG AK RÈGLE',
    title: 'Wërsëg bu jub walla bu jubul:\nlan mooy wuute?',
    metaDuration: '5 simili jàng',
    metaValidated: 'Mbind bu ñu seetlu',
    intro:
      'Wërsëgu weer bu nekk am na ritmam. Xam li ñuy woowe “cosaan” mën na dimbli nga gën a topp sa wér te gis jubul yu mën a am.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Wërsëgu weer bu jub: lan mooy?',
      'Wërsëg bu jubul: lan la tekki?',
      'Sabab yu mën a am ci wërsëg bu jubul',
      'Kañ ngay seet doktoor?',
      'Ndigal ngir wërsëg bu gën a jubloo',
    ],
    section1Body:
      'Wërsëg dañu koy jàppe ni bu jub bu diiram nekk diggante 21 ak 35 fan, ak wuute bu ndaw 7 fan ci wërsëg ak wërsëg.',
    section1VisualTitle: 'Benn ritm bu sax',
    section1VisualText:
      'Li am solo mooy seetlu sa ritm bu sa bopp ci weer yi.',
    tip1Title: 'Lu baax a xam',
    tip1Text:
      'Jigéen ju nekk wuute na. Li am solo mooy xam sa ritm ak soppi yi cosaan ci ngir yaw.',
    section2Body:
      'Wërsëg dañu koy jàppe ni bu jubul bu diiram di soppiku ci yoon walla ci anam bu xaarul (wuute bu ëpp 7 fan). Mën na feeñ ni wërsëg yu gàtt lool, yu gudd lool walla amul ovilasiyoŋ.',
    section2VisualTitle: 'Soppi yu gëna gis',
    section2VisualText:
      'Wuute yii mën nañu nekk yu gàtt walla sax ci ay wërsëg.',
    alertTitle: 'Teg',
    alertText:
      'Jubul bu gàtt mën na nekk lu cosaan (coono, soppi yu hormon, sonn…). Waaye bu mu sax, am solo na nga seet sabab bi.',
    causes: [
      'Coono ak tiitaange',
      'Jubul yu hormon',
      'Ñàkk nelaw ak sonn',
      'Yenn bu ndaw lool walla bu kawe lool',
      'PCOS walla yeneen feebar',
    ],
    checklist: [
      'Amul règle ci kaw 3 weer (ci biti ëmb/nàmm)',
      'Wërsëg yu gudd lool (ci kaw 90 fan) walla yu gàtt lool (ci suuf 21 fan)',
      'Metit bu metti bu tee nga dund ni cosaan',
      'Deret bu bari lool walla bu jubul',
      'Bu nga di jéem a ëmb te ovilasiyoŋ mel ni amul',
    ],
    advice: [
      'Lekk bu jubloo',
      'Naan ndox bu doy',
      'Jëfu yaram',
      'Yor coono',
      'Nelaw bu baax',
    ],
    shareMessage: 'Wërsëg bu jub walla bu jubul: lan mooy wuute? — AWA',
  },
  ha: {
    badge: 'ZAGAYE & HAILA',
    title: 'Zagaye mai tsari ko mara tsari:\nmenene bambancin?',
    metaDuration: 'karatun minti 5',
    metaValidated: 'Abun da aka duba',
    intro:
      'Kowane zagayen haila na musamman ne. Fahimtar abin da ake ɗauka “na al’ada” na iya taimaka miki ki bi lafiyarki sosai kuma ki gano yiwuwar rashin daidaito.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Zagayen haila mai tsari: menene shi?',
      'Zagaye mara tsari: me yake nufi?',
      'Yiwuwar dalilan zagaye mara tsari',
      'Yaushe ya kamata ki ga likita?',
      'Shawarwari don zagaye mafi daidaito',
    ],
    section1Body:
      'Ana ɗaukar zagaye a matsayin mai tsari idan tsawonsa ya bambanta tsakanin kwana 21 zuwa 35, da bambanci na ƙasa da kwana 7 daga zagaye zuwa zagaye.',
    section1VisualTitle: 'Tsari mai tsayayye',
    section1VisualText:
      'Abin da ya fi muhimmanci shi ne lura da tsarinki na kanki a cikin watanni.',
    tip1Title: 'Abin da ya dace a sani',
    tip1Text:
      'Kowace mace daban ce. Abin da ya fi muhimmanci shi ne sanin tsarinki da bambance-bambancensa na al’ada.',
    section2Body:
      'Ana ɗaukar zagaye a matsayin mara tsari idan tsawonsa ya bambanta akai-akai ko ba tare da hasashe ba (bambanci fiye da kwana 7). Wannan na iya bayyana a matsayin zagaye gajeru sosai, dogaye sosai, ko rashin fitar ƙwai.',
    section2VisualTitle: 'Bambance-bambance masu bayyana sosai',
    section2VisualText:
      'Waɗannan bambance-bambance na iya zama na ɗan lokaci ko su dawwama a zagaye da dama.',
    alertTitle: 'Ki lura',
    alertText:
      'Rashin tsari na ɗan lokaci na iya zama na al’ada (damuwa, sauye-sauyen hormone, gajiya…). Amma idan ya dawwama, yana da muhimmanci a bincika dalilin.',
    causes: [
      'Damuwa & fargaba',
      'Rashin daidaiton hormone',
      'Rashin barci & gajiya',
      'Nauyi ƙasa ko sama sosai',
      'PCOS ko wasu yanayin lafiya',
    ],
    checklist: [
      'Babu haila na fiye da watanni 3 (a wajen ciki/shayarwa)',
      'Zagaye dogaye sosai (fiye da kwana 90) ko gajeru sosai (ƙasa da kwana 21)',
      'Ciwo mai tsanani da ke hana ki rayuwa yadda ya kamata',
      'Zubar jini mai yawa sosai ko mara tsari',
      'Idan kina neman ciki kuma fitar ƙwai kamar ba ta faruwa',
    ],
    advice: [
      'Daidaitaccen abinci',
      'Isasshen shan ruwa',
      'Motsa jiki',
      'Sarrafa damuwa',
      'Barci mai inganci',
    ],
    shareMessage: 'Zagaye mai tsari ko mara tsari: menene bambancin? — AWA',
  },
  am: {
    badge: 'ዑደት እና የወር አበባ',
    title: 'መደበኛ ወይም መደበኛ ያልሆነ ዑደት፦\nልዩነቱ ምንድን ነው?',
    metaDuration: '5 ደቂቃ ንባብ',
    metaValidated: 'የተገመገመ ይዘት',
    intro:
      'እያንዳንዱ የወር አበባ ዑደት ልዩ ነው። “መደበኛ” ተብሎ የሚቆጠረውን መረዳት ጤናሽን በቅርበት እንድትከታተዪ እና ሊኖሩ የሚችሉ አለመመጣጠኖችን እንድትለዪ ሊረዳሽ ይችላል።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'መደበኛ የወር አበባ ዑደት፦ ምንድን ነው?',
      'መደበኛ ያልሆነ ዑደት፦ ምን ማለት ነው?',
      'የመደበኛ አለመሆን ሊሆኑ የሚችሉ መንስኤዎች',
      'ሐኪም መቼ ማየት አለብሽ?',
      'የበለጠ ሚዛናዊ ዑደት ምክሮች',
    ],
    section1Body:
      'ዑደት ርዝመቱ በ21 እና 35 ቀናት መካከል ሲለያይ እና ከአንዱ ዑደት ወደ ሌላው ከ7 ቀናት ያነሰ ልዩነት ሲኖር መደበኛ ተብሎ ይቆጠራል።',
    section1VisualTitle: 'በአንጻራዊ ሁኔታ የተረጋጋ ሪትም',
    section1VisualText:
      'ከሁሉም በላይ አስፈላጊው በወራት ውስጥ የራስሽን ሪትም መታዘብ ነው።',
    tip1Title: 'ማወቅ ጠቃሚ ነው',
    tip1Text:
      'እያንዳንዷ ሴት የተለየች ናት። አስፈላጊው የራስሽን ሪትም እና መደበኛ ልዩነቶቹን ማወቅ ነው።',
    section2Body:
      'ዑደት ርዝመቱ ብዙ ጊዜ ወይም ባልተጠበቀ መንገድ ሲለያይ (ከ7 ቀናት በላይ ልዩነት) መደበኛ ያልሆነ ተብሎ ይቆጠራል። ይህ በጣም አጭር ዑደቶች፣ በጣም ረዥም ዑደቶች ወይም የእንቁላል መልቀቅ አለመኖር ሊሆን ይችላል።',
    section2VisualTitle: 'ይበልጥ የሚታዩ ልዩነቶች',
    section2VisualText:
      'እነዚህ ልዩነቶች ጊዜያዊ ሊሆኑ ወይም በበርካታ ዑደቶች ሊቀጥሉ ይችላሉ።',
    alertTitle: 'ልብ በይ',
    alertText:
      'ጊዜያዊ መደበኛ አለመሆን የተለመደ ሊሆን ይችላል (ጭንቀት፣ የሆርሞን ለውጦች፣ ድካም…)። ነገር ግን ከቀጠለ መንስኤውን መመርመር አስፈላጊ ነው።',
    causes: [
      'ጭንቀትና ሥጋት',
      'የሆርሞን አለመመጣጠኖች',
      'የእንቅልፍ እጦትና ድካም',
      'በጣም ዝቅተኛ ወይም ከፍተኛ ክብደት',
      'ፒሲኦኤስ ወይም ሌሎች የሕክምና ሁኔታዎች',
    ],
    checklist: [
      'ከ3 ወራት በላይ የወር አበባ አለመኖር (ከእርግዝና/ጡት ማጥባት ውጭ)',
      'በጣም ረዥም ዑደቶች (ከ90 ቀናት በላይ) ወይም በጣም አጭር ዑደቶች (ከ21 ቀናት በታች)',
      'በመደበኛነት እንዳትኖሪ የሚያደርግ ከባድ ህመም',
      'በጣም ብዙ ወይም መደበኛ ያልሆነ ደም መፍሰስ',
      'ለመፀነስ እየሞከርሽ ከሆነና እንቁላል መልቀቅ የሌለ ከመሰለ',
    ],
    advice: [
      'ሚዛናዊ አመጋገብ',
      'በቂ ውሃ መጠጣት',
      'የአካል እንቅስቃሴ',
      'የጭንቀት አስተዳደር',
      'ጥራት ያለው እንቅልፍ',
    ],
    shareMessage: 'መደበኛ ወይም መደበኛ ያልሆነ ዑደት፦ ልዩነቱ ምንድን ነው? — AWA',
  },
  nl: {
    badge: 'CYCLUS & MENSTRUATIE',
    title: 'Regelmatige of onregelmatige cyclus:\nwat is het verschil?',
    metaDuration: '5 min lezen',
    metaValidated: 'Gecontroleerde inhoud',
    intro:
      'Elke menstruatiecyclus is uniek. Begrijpen wat als “normaal” wordt beschouwd kan je helpen je gezondheid beter op te volgen en mogelijke onevenwichtigheden op te merken.',
    contentsTitle: 'In dit artikel',
    topics: [
      'Regelmatige menstruatiecyclus: wat is dat?',
      'Onregelmatige cyclus: wat betekent dat?',
      'Mogelijke oorzaken van een onregelmatige cyclus',
      'Wanneer moet je een arts raadplegen?',
      'Tips voor een evenwichtigere cyclus',
    ],
    section1Body:
      'Een cyclus wordt als regelmatig beschouwd wanneer de lengte tussen 21 en 35 dagen ligt, met minder dan 7 dagen verschil van de ene cyclus tot de volgende.',
    section1VisualTitle: 'Een tamelijk stabiel ritme',
    section1VisualText:
      'Het belangrijkste is je eigen ritme over de maanden heen te observeren.',
    tip1Title: 'Goed om te weten',
    tip1Text:
      'Elke vrouw is anders. Het belangrijkste is je eigen ritme en de normale variaties ervan te kennen.',
    section2Body:
      'Een cyclus wordt als onregelmatig beschouwd wanneer de lengte vaak of onvoorspelbaar varieert (een verschil van meer dan 7 dagen). Dat kan zich uiten in zeer korte cycli, zeer lange cycli of het uitblijven van de eisprong.',
    section2VisualTitle: 'Meer merkbare variaties',
    section2VisualText:
      'Deze verschillen kunnen tijdelijk zijn of over meerdere cycli aanhouden.',
    alertTitle: 'Let op',
    alertText:
      'Tijdelijke onregelmatigheid kan normaal zijn (stress, hormonale veranderingen, vermoeidheid…). Maar als ze aanhoudt, is het belangrijk de oorzaak te onderzoeken.',
    causes: [
      'Stress & angst',
      'Hormonale onevenwichtigheden',
      'Slaaptekort & vermoeidheid',
      'Te laag of te hoog gewicht',
      'PCOS of andere medische aandoeningen',
    ],
    checklist: [
      'Langer dan 3 maanden geen menstruatie (buiten zwangerschap/borstvoeding)',
      'Zeer lange cycli (meer dan 90 dagen) of zeer korte cycli (minder dan 21 dagen)',
      'Hevige pijn die je belet normaal te leven',
      'Zeer hevig of onregelmatig bloedverlies',
      'Als je zwanger probeert te worden en de eisprong lijkt uit te blijven',
    ],
    advice: [
      'Evenwichtige voeding',
      'Voldoende hydratatie',
      'Lichaamsbeweging',
      'Stressbeheersing',
      'Kwaliteitsslaap',
    ],
    shareMessage: 'Regelmatige of onregelmatige cyclus: wat is het verschil? — AWA',
  },
  fi: {
    badge: 'KIERTO JA KUUKAUTISET',
    title: 'Säännöllinen vai epäsäännöllinen kierto:\nmikä ero?',
    metaDuration: '5 min lukuaika',
    metaValidated: 'Tarkistettu sisältö',
    intro:
      'Jokainen kuukautiskierto on ainutlaatuinen. Sen ymmärtäminen, mitä pidetään “normaalina”, voi auttaa seuraamaan terveyttäsi tarkemmin ja huomaamaan mahdolliset epätasapainot.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Säännöllinen kuukautiskierto: mitä se on?',
      'Epäsäännöllinen kierto: mitä se tarkoittaa?',
      'Epäsäännöllisen kierron mahdolliset syyt',
      'Milloin pitäisi mennä lääkäriin?',
      'Vinkkejä tasapainoisempaan kiertoon',
    ],
    section1Body:
      'Kiertoa pidetään säännöllisenä, kun sen pituus vaihtelee 21 ja 35 päivän välillä ja ero kierrosta toiseen on alle 7 päivää.',
    section1VisualTitle: 'Melko vakaa rytmi',
    section1VisualText:
      'Tärkeintä on havainnoida omaa rytmiäsi kuukausien kuluessa.',
    tip1Title: 'Hyvä tietää',
    tip1Text:
      'Jokainen nainen on erilainen. Tärkeintä on tuntea oma rytmisi ja sen normaalit vaihtelut.',
    section2Body:
      'Kiertoa pidetään epäsäännöllisenä, kun sen pituus vaihtelee usein tai ennalta arvaamattomasti (yli 7 päivän ero). Se voi ilmetä hyvin lyhyinä kiertoina, hyvin pitkinä kiertoina tai ovulaation puuttumisena.',
    section2VisualTitle: 'Selvemmät vaihtelut',
    section2VisualText:
      'Nämä erot voivat olla tilapäisiä tai jatkua usean kierron ajan.',
    alertTitle: 'Huomaa',
    alertText:
      'Tilapäinen epäsäännöllisyys voi olla normaalia (stressi, hormonaaliset muutokset, väsymys…). Mutta jos se jatkuu, on tärkeää tutkia syy.',
    causes: [
      'Stressi ja ahdistus',
      'Hormonaaliset epätasapainot',
      'Unen puute ja väsymys',
      'Liian matala tai korkea paino',
      'PCOS tai muut sairaudet',
    ],
    checklist: [
      'Ei kuukautisia yli 3 kuukauteen (raskauden/imetyksen ulkopuolella)',
      'Hyvin pitkät kierrot (yli 90 päivää) tai hyvin lyhyet kierrot (alle 21 päivää)',
      'Voimakas kipu, joka estää sinua elämästä normaalisti',
      'Hyvin runsas tai epäsäännöllinen vuoto',
      'Jos yrität tulla raskaaksi ja ovulaatio näyttää puuttuvan',
    ],
    advice: [
      'Tasapainoinen ruokavalio',
      'Riittävä nesteytys',
      'Liikunta',
      'Stressinhallinta',
      'Laadukas uni',
    ],
    shareMessage: 'Säännöllinen vai epäsäännöllinen kierto: mikä ero? — AWA',
  },
  el: {
    badge: 'ΚΥΚΛΟΣ ΚΑΙ ΠΕΡΙΟΔΟΙ',
    title: 'Κανονικός ή ακανόνιστος κύκλος:\nποια η διαφορά;',
    metaDuration: '5 λεπτά ανάγνωσης',
    metaValidated: 'Ελεγμένο περιεχόμενο',
    intro:
      'Κάθε έμμηνος κύκλος είναι μοναδικός. Η κατανόηση του τι θεωρείται «φυσιολογικό» μπορεί να σε βοηθήσει να παρακολουθείς πιο προσεκτικά την υγεία σου και να εντοπίζεις πιθανές ανισορροπίες.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Κανονικός έμμηνος κύκλος: τι είναι;',
      'Ακανόνιστος κύκλος: τι σημαίνει;',
      'Πιθανές αιτίες ενός ακανόνιστου κύκλου',
      'Πότε πρέπει να επισκεφθείς γιατρό;',
      'Συμβουλές για πιο ισορροπημένο κύκλο',
    ],
    section1Body:
      'Ένας κύκλος θεωρείται κανονικός όταν η διάρκειά του κυμαίνεται ανάμεσα σε 21 και 35 ημέρες, με διαφορά μικρότερη από 7 ημέρες από τον έναν κύκλο στον επόμενο.',
    section1VisualTitle: 'Ένας αρκετά σταθερός ρυθμός',
    section1VisualText:
      'Αυτό που μετράει περισσότερο είναι να παρατηρείς τον δικό σου ρυθμό με την πάροδο των μηνών.',
    tip1Title: 'Καλό είναι να γνωρίζεις',
    tip1Text:
      'Κάθε γυναίκα είναι διαφορετική. Αυτό που μετράει είναι να γνωρίζεις τον δικό σου ρυθμό και τις φυσιολογικές διακυμάνσεις του.',
    section2Body:
      'Ένας κύκλος θεωρείται ακανόνιστος όταν η διάρκειά του μεταβάλλεται συχνά ή απρόβλεπτα (διαφορά μεγαλύτερη από 7 ημέρες). Αυτό μπορεί να εκδηλωθεί ως πολύ σύντομοι κύκλοι, πολύ μεγάλοι κύκλοι ή απουσία ωορρηξίας.',
    section2VisualTitle: 'Πιο αισθητές διακυμάνσεις',
    section2VisualText:
      'Αυτές οι διαφορές μπορεί να είναι προσωρινές ή να επιμένουν σε αρκετούς κύκλους.',
    alertTitle: 'Σημείωση',
    alertText:
      'Η προσωρινή ακανονιστία μπορεί να είναι φυσιολογική (άγχος, ορμονικές αλλαγές, κόπωση…). Αλλά αν επιμένει, είναι σημαντικό να διερευνηθεί η αιτία.',
    causes: [
      'Άγχος και ανησυχία',
      'Ορμονικές ανισορροπίες',
      'Έλλειψη ύπνου και κόπωση',
      'Πολύ χαμηλό ή πολύ υψηλό βάρος',
      'PCOS ή άλλες ιατρικές παθήσεις',
    ],
    checklist: [
      'Καμία περίοδος για περισσότερους από 3 μήνες (εκτός εγκυμοσύνης/θηλασμού)',
      'Πολύ μεγάλοι κύκλοι (πάνω από 90 ημέρες) ή πολύ σύντομοι κύκλοι (κάτω από 21 ημέρες)',
      'Έντονος πόνος που σε εμποδίζει να ζεις κανονικά',
      'Πολύ έντονη ή ακανόνιστη αιμορραγία',
      'Αν προσπαθείς να συλλάβεις και η ωορρηξία φαίνεται να απουσιάζει',
    ],
    advice: [
      'Ισορροπημένη διατροφή',
      'Επαρκής ενυδάτωση',
      'Σωματική δραστηριότητα',
      'Διαχείριση του άγχους',
      'Ποιοτικός ύπνος',
    ],
    shareMessage: 'Κανονικός ή ακανόνιστος κύκλος: ποια η διαφορά; — AWA',
  },
  fil: {
    badge: 'SIKLO AT REGLA',
    title: 'Regular o hindi regular na siklo:\nano ang pagkakaiba?',
    metaDuration: '5 min na babasahin',
    metaValidated: 'Sinuring nilalaman',
    intro:
      'Natatangi ang bawat siklo ng regla. Ang pag-unawa sa itinuturing na “normal” ay makakatulong na mas masubaybayan ang iyong kalusugan at mapansin ang posibleng hindi balanse.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Regular na siklo ng regla: ano ito?',
      'Hindi regular na siklo: ano ang ibig sabihin?',
      'Mga posibleng sanhi ng hindi regular na siklo',
      'Kailan dapat magpatingin sa doktor?',
      'Payo para sa mas balanseng siklo',
    ],
    section1Body:
      'Itinuturing na regular ang siklo kapag nag-iiba ang haba nito sa pagitan ng 21 at 35 araw, na may mas mababa sa 7 araw na pagkakaiba mula sa isang siklo hanggang sa susunod.',
    section1VisualTitle: 'Isang medyo matatag na ritmo',
    section1VisualText:
      'Ang pinakamahalaga ay obserbahan ang sarili mong ritmo sa paglipas ng mga buwan.',
    tip1Title: 'Mabuting malaman',
    tip1Text:
      'Iba-iba ang bawat babae. Ang mahalaga ay malaman ang sarili mong ritmo at ang mga normal na pagbabago nito.',
    section2Body:
      'Itinuturing na hindi regular ang siklo kapag madalas o hindi mahulaan ang pagbabago ng haba nito (pagkakaibang higit sa 7 araw). Maaari itong lumitaw bilang napakaikling mga siklo, napakahabang mga siklo, o kawalan ng obulasyon.',
    section2VisualTitle: 'Mas kapansin-pansing mga pagbabago',
    section2VisualText:
      'Ang mga pagkakaibang ito ay maaaring pansamantala o magpatuloy sa ilang siklo.',
    alertTitle: 'Pakitandaan',
    alertText:
      'Maaaring normal ang pansamantalang iregularidad (stress, hormonal na pagbabago, pagod…). Ngunit kung nagpapatuloy ito, mahalagang siyasatin ang sanhi.',
    causes: [
      'Stress at pagkabalisa',
      'Hormonal na hindi balanse',
      'Kakulangan sa tulog at pagod',
      'Timbang na masyadong mababa o masyadong mataas',
      'PCOS o iba pang kondisyong medikal',
    ],
    checklist: [
      'Walang regla nang higit sa 3 buwan (maliban sa pagbubuntis/pagpapasuso)',
      'Napakahabang mga siklo (higit sa 90 araw) o napakaikling mga siklo (wala pang 21 araw)',
      'Matinding sakit na pumipigil sa iyong mamuhay nang normal',
      'Napakalakas o hindi regular na pagdurugo',
      'Kung sinusubukan mong magbuntis at tila walang obulasyon',
    ],
    advice: [
      'Balanseng pagkain',
      'Sapat na hydration',
      'Pisikal na aktibidad',
      'Pangangasiwa ng stress',
      'De-kalidad na tulog',
    ],
    shareMessage: 'Regular o hindi regular na siklo: ano ang pagkakaiba? — AWA',
  },
  ta: {
    badge: 'சுழற்சியும் மாதவிடாயும்',
    title: 'ஒழுங்கான அல்லது ஒழுங்கற்ற சுழற்சி:\nவேறுபாடு என்ன?',
    metaDuration: '5 நிமிடம் படிக்க',
    metaValidated: 'மதிப்பாய்வு செய்யப்பட்ட உள்ளடக்கம்',
    intro:
      'ஒவ்வொரு மாதவிடாய்ச் சுழற்சியும் தனித்துவமானது. “இயல்பானது” எனக் கருதப்படுவதைப் புரிந்துகொள்வது உங்கள் ஆரோக்கியத்தை நெருக்கமாகக் கண்காணிக்கவும் சாத்தியமான சமநிலையின்மைகளைக் கண்டறியவும் உதவலாம்.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      'ஒழுங்கான மாதவிடாய்ச் சுழற்சி: அது என்ன?',
      'ஒழுங்கற்ற சுழற்சி: இதன் பொருள் என்ன?',
      'ஒழுங்கற்ற சுழற்சியின் சாத்தியமான காரணங்கள்',
      'மருத்துவரை எப்போது பார்க்க வேண்டும்?',
      'மேலும் சமநிலையான சுழற்சிக்கான குறிப்புகள்',
    ],
    section1Body:
      'ஒரு சுழற்சியின் நீளம் 21 முதல் 35 நாட்களுக்கு இடையே இருந்து, ஒரு சுழற்சிக்கும் அடுத்ததற்கும் 7 நாட்களுக்குக் குறைவான வேறுபாடு இருந்தால் அது ஒழுங்கானதாகக் கருதப்படுகிறது.',
    section1VisualTitle: 'ஓரளவு நிலையான தாளம்',
    section1VisualText:
      'மாதங்களில் உங்கள் சொந்தத் தாளத்தைக் கவனிப்பதே மிக முக்கியம்.',
    tip1Title: 'தெரிந்துகொள்ளுங்கள்',
    tip1Text:
      'ஒவ்வொரு பெண்ணும் வேறுபட்டவர். உங்கள் சொந்தத் தாளத்தையும் அதன் இயல்பான மாறுபாடுகளையும் அறிவதே முக்கியம்.',
    section2Body:
      'ஒரு சுழற்சியின் நீளம் அடிக்கடி அல்லது கணிக்க முடியாத விதத்தில் மாறினால் (7 நாட்களுக்கு மேல் வேறுபாடு) அது ஒழுங்கற்றதாகக் கருதப்படுகிறது. இது மிகக் குறுகிய சுழற்சிகள், மிக நீண்ட சுழற்சிகள் அல்லது அண்டவிடுப்பு இல்லாததாக வெளிப்படலாம்.',
    section2VisualTitle: 'அதிகக் கவனிக்கத்தக்க மாறுபாடுகள்',
    section2VisualText:
      'இந்த வேறுபாடுகள் தற்காலிகமாக இருக்கலாம் அல்லது பல சுழற்சிகளில் நீடிக்கலாம்.',
    alertTitle: 'கவனத்தில் கொள்ளவும்',
    alertText:
      'தற்காலிக ஒழுங்கின்மை இயல்பாக இருக்கலாம் (மன அழுத்தம், ஹார்மோன் மாற்றங்கள், சோர்வு…). ஆனால் அது நீடித்தால், காரணத்தை ஆராய்வது முக்கியம்.',
    causes: [
      'மன அழுத்தமும் பதற்றமும்',
      'ஹார்மோன் சமநிலையின்மைகள்',
      'உறக்கக் குறைவும் சோர்வும்',
      'மிகக் குறைவான அல்லது மிக அதிகமான எடை',
      'PCOS அல்லது பிற மருத்துவ நிலைகள்',
    ],
    checklist: [
      '3 மாதங்களுக்கு மேல் மாதவிடாய் இல்லை (கர்ப்பம்/தாய்ப்பாலூட்டுதல் தவிர)',
      'மிக நீண்ட சுழற்சிகள் (90 நாட்களுக்கு மேல்) அல்லது மிகக் குறுகிய சுழற்சிகள் (21 நாட்களுக்குக் குறைவு)',
      'நீங்கள் இயல்பாக வாழ்வதைத் தடுக்கும் தீவிர வலி',
      'மிகக் கடுமையான அல்லது ஒழுங்கற்ற இரத்தப்போக்கு',
      'நீங்கள் கருத்தரிக்க முயன்று, அண்டவிடுப்பு இல்லாதது போல் தோன்றினால்',
    ],
    advice: [
      'சமச்சீர் உணவு',
      'போதுமான நீர்ச்சத்து',
      'உடல் செயல்பாடு',
      'மன அழுத்த மேலாண்மை',
      'தரமான உறக்கம்',
    ],
    shareMessage: 'ஒழுங்கான அல்லது ஒழுங்கற்ற சுழற்சி: வேறுபாடு என்ன? — AWA',
  },
  te: {
    badge: 'చక్రం & నెలసరి',
    title: 'క్రమబద్ధ లేదా అస్తవ్యస్త చక్రం:\nతేడా ఏమిటి?',
    metaDuration: '5 నిమిషాల పఠనం',
    metaValidated: 'మదింపు చేసిన కంటెంట్',
    intro:
      'ప్రతి నెలసరి చక్రం ప్రత్యేకమైనది. “సాధారణం” అని పరిగణించబడేదాన్ని అర్థం చేసుకోవడం మీ ఆరోగ్యాన్ని మరింత దగ్గరగా ట్రాక్ చేయడానికి, సాధ్యమైన అసమతుల్యతలను గుర్తించడానికి సహాయపడగలదు.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      'క్రమబద్ధ నెలసరి చక్రం: అది ఏమిటి?',
      'అస్తవ్యస్త చక్రం: దాని అర్థం ఏమిటి?',
      'అస్తవ్యస్త చక్రం యొక్క సాధ్యమైన కారణాలు',
      'వైద్యుడిని ఎప్పుడు కలవాలి?',
      'మరింత సమతుల్య చక్రం కోసం చిట్కాలు',
    ],
    section1Body:
      'ఒక చక్రం నిడివి 21 నుండి 35 రోజుల మధ్య మారుతూ, ఒక చక్రానికి, తర్వాతి చక్రానికి మధ్య 7 రోజుల కంటే తక్కువ తేడా ఉన్నప్పుడు అది క్రమబద్ధంగా పరిగణించబడుతుంది.',
    section1VisualTitle: 'ఓ మోస్తరు స్థిరమైన లయ',
    section1VisualText:
      'నెలల్లో మీ సొంత లయను గమనించడమే అత్యంత ముఖ్యం.',
    tip1Title: 'తెలుసుకోవాల్సినవి',
    tip1Text:
      'ప్రతి మహిళ భిన్నమైనది. మీ సొంత లయను, దాని సాధారణ మార్పులను తెలుసుకోవడమే ముఖ్యం.',
    section2Body:
      'ఒక చక్రం నిడివి తరచుగా లేదా ఊహించలేని రీతిలో మారితే (7 రోజుల కంటే ఎక్కువ తేడా) అది అస్తవ్యస్తంగా పరిగణించబడుతుంది. ఇది చాలా చిన్న చక్రాలు, చాలా పొడవైన చక్రాలు లేదా అండోత్సర్గం లేకపోవడంగా వ్యక్తమవవచ్చు.',
    section2VisualTitle: 'మరింత గమనించదగిన మార్పులు',
    section2VisualText:
      'ఈ తేడాలు తాత్కాలికంగా ఉండవచ్చు లేదా అనేక చక్రాల్లో కొనసాగవచ్చు.',
    alertTitle: 'గమనించండి',
    alertText:
      'తాత్కాలిక అస్తవ్యస్తత సహజంగా ఉండవచ్చు (ఒత్తిడి, హార్మోన్ మార్పులు, అలసట…). కానీ అది కొనసాగితే, కారణాన్ని ఆరా తీయడం ముఖ్యం.',
    causes: [
      'ఒత్తిడి & ఆందోళన',
      'హార్మోన్ అసమతుల్యతలు',
      'నిద్ర లేమి & అలసట',
      'మరీ తక్కువ లేదా మరీ ఎక్కువ బరువు',
      'PCOS లేదా ఇతర వైద్య పరిస్థితులు',
    ],
    checklist: [
      '3 నెలల కంటే ఎక్కువ నెలసరి లేదు (గర్భం/తల్లిపాలు ఇవ్వడం తప్ప)',
      'చాలా పొడవైన చక్రాలు (90 రోజుల కంటే ఎక్కువ) లేదా చాలా చిన్న చక్రాలు (21 రోజుల కంటే తక్కువ)',
      'మీరు సాధారణంగా జీవించడాన్ని అడ్డుకునే తీవ్రమైన నొప్పి',
      'చాలా ఎక్కువ లేదా అస్తవ్యస్త రక్తస్రావం',
      'మీరు గర్భం కోసం ప్రయత్నిస్తూ, అండోత్సర్గం లేనట్లు కనిపిస్తే',
    ],
    advice: [
      'సమతుల్య ఆహారం',
      'తగినంత నీటి శాతం',
      'శారీరక కార్యకలాపం',
      'ఒత్తిడి నిర్వహణ',
      'నాణ్యమైన నిద్ర',
    ],
    shareMessage: 'క్రమబద్ధ లేదా అస్తవ్యస్త చక్రం: తేడా ఏమిటి? — AWA',
  },
  mr: {
    badge: 'पाळी आणि मासिक पाळी',
    title: 'नियमित की अनियमित पाळी:\nफरक काय?',
    metaDuration: '5 मिनिटे वाचन',
    metaValidated: 'पुनरावलोकन केलेला मजकूर',
    intro:
      'प्रत्येक मासिक पाळी अद्वितीय असते. “सामान्य” काय मानले जाते हे समजून घेतल्याने तुम्हाला तुमच्या आरोग्याचा अधिक जवळून मागोवा घेण्यास आणि संभाव्य असंतुलन ओळखण्यास मदत होऊ शकते.',
    contentsTitle: 'या लेखात',
    topics: [
      'नियमित मासिक पाळी: ती काय आहे?',
      'अनियमित पाळी: याचा अर्थ काय?',
      'अनियमित पाळीची संभाव्य कारणे',
      'डॉक्टरांना केव्हा भेटावे?',
      'अधिक संतुलित पाळीसाठी टिपा',
    ],
    section1Body:
      'पाळीचा कालावधी 21 ते 35 दिवसांदरम्यान बदलत असेल, आणि एका पाळीपासून दुसऱ्या पाळीपर्यंत 7 दिवसांपेक्षा कमी फरक असेल, तर ती नियमित मानली जाते.',
    section1VisualTitle: 'बऱ्यापैकी स्थिर लय',
    section1VisualText:
      'महिन्यांमध्ये तुमची स्वतःची लय पाहणे हेच सर्वात महत्त्वाचे आहे.',
    tip1Title: 'हे जाणून घ्या',
    tip1Text:
      'प्रत्येक स्त्री वेगळी असते. तुमची स्वतःची लय आणि तिचे सामान्य बदल जाणून घेणे महत्त्वाचे आहे.',
    section2Body:
      'पाळीचा कालावधी वारंवार किंवा अप्रत्याशितपणे बदलत असेल (7 दिवसांपेक्षा जास्त फरक), तर ती अनियमित मानली जाते. हे खूप लहान पाळीचक्रे, खूप मोठी पाळीचक्रे किंवा बीजोत्सर्जन नसणे अशा स्वरूपात दिसू शकते.',
    section2VisualTitle: 'अधिक ठळक बदल',
    section2VisualText:
      'हे फरक तात्पुरते असू शकतात किंवा अनेक पाळीचक्रांत कायम राहू शकतात.',
    alertTitle: 'कृपया लक्षात घ्या',
    alertText:
      'तात्पुरती अनियमितता सामान्य असू शकते (ताण, हार्मोनल बदल, थकवा…). पण ती कायम राहिल्यास, कारण शोधणे महत्त्वाचे आहे.',
    causes: [
      'ताण आणि चिंता',
      'हार्मोनल असंतुलन',
      'झोपेची कमतरता आणि थकवा',
      'खूप कमी किंवा खूप जास्त वजन',
      'PCOS किंवा इतर वैद्यकीय स्थिती',
    ],
    checklist: [
      '3 महिन्यांपेक्षा जास्त काळ पाळी नाही (गर्भारपण/स्तनपान वगळता)',
      'खूप मोठी पाळीचक्रे (90 दिवसांपेक्षा जास्त) किंवा खूप लहान पाळीचक्रे (21 दिवसांपेक्षा कमी)',
      'तुम्हाला सामान्यपणे जगू न देणारी तीव्र वेदना',
      'खूप जास्त किंवा अनियमित रक्तस्राव',
      'तुम्ही गर्भधारणेचा प्रयत्न करत असाल आणि बीजोत्सर्जन होत नसल्यासारखे वाटत असेल तर',
    ],
    advice: [
      'संतुलित आहार',
      'पुरेसे पाण्याचे सेवन',
      'शारीरिक हालचाल',
      'ताणाचे व्यवस्थापन',
      'दर्जेदार झोप',
    ],
    shareMessage: 'नियमित की अनियमित पाळी: फरक काय? — AWA',
  },
  gu: {
    badge: 'ચક્ર અને માસિક',
    title: 'નિયમિત કે અનિયમિત ચક્ર:\nતફાવત શું છે?',
    metaDuration: '5 મિનિટ વાંચન',
    metaValidated: 'પુનરાવલોકન કરેલી સામગ્રી',
    intro:
      'દરેક માસિક ચક્ર અનોખું હોય છે. “સામાન્ય” ગણાતું શું છે તે સમજવાથી તમે તમારા આરોગ્ય પર વધુ નજીકથી ધ્યાન રાખી શકો અને સંભવિત અસંતુલન ઓળખી શકો.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      'નિયમિત માસિક ચક્ર: તે શું છે?',
      'અનિયમિત ચક્ર: તેનો અર્થ શું છે?',
      'અનિયમિત ચક્રનાં સંભવિત કારણો',
      'ડૉક્ટરને ક્યારે મળવું જોઈએ?',
      'વધુ સંતુલિત ચક્ર માટેની સલાહ',
    ],
    section1Body:
      'ચક્ર ત્યારે નિયમિત ગણાય છે જ્યારે તેની લંબાઈ 21 થી 35 દિવસ વચ્ચે રહે, અને એક ચક્રથી બીજા ચક્રમાં 7 દિવસથી ઓછો તફાવત હોય.',
    section1VisualTitle: 'એકદમ સ્થિર લય',
    section1VisualText:
      'સૌથી મહત્ત્વનું એ છે કે મહિનાઓ સુધી તમારી પોતાની લય પર ધ્યાન રાખવું.',
    tip1Title: 'જાણવા જેવું',
    tip1Text:
      'દરેક સ્ત્રી અલગ હોય છે. મહત્ત્વનું એ છે કે તમારી પોતાની લય અને તેના સામાન્ય ફેરફારો જાણવા.',
    section2Body:
      'ચક્ર ત્યારે અનિયમિત ગણાય છે જ્યારે તેની લંબાઈ વારંવાર કે અણધારી રીતે બદલાય (7 દિવસથી વધુનો તફાવત). તે ખૂબ ટૂંકાં ચક્રો, ખૂબ લાંબાં ચક્રો કે અંડોત્સર્જનની ગેરહાજરી તરીકે દેખાઈ શકે.',
    section2VisualTitle: 'વધુ નોંધપાત્ર ફેરફારો',
    section2VisualText:
      'આ તફાવતો અસ્થાયી હોઈ શકે અથવા ઘણાં ચક્રો સુધી ચાલુ રહી શકે.',
    alertTitle: 'કૃપા કરીને નોંધો',
    alertText:
      'અસ્થાયી અનિયમિતતા સામાન્ય હોઈ શકે (તણાવ, હોર્મોનમાં ફેરફાર, થાક…). પરંતુ જો તે ચાલુ રહે, તો તેનું કારણ તપાસવું મહત્ત્વનું છે.',
    causes: [
      'તણાવ અને ચિંતા',
      'હોર્મોનનું અસંતુલન',
      'ઊંઘની ઓછપ અને થાક',
      'ખૂબ ઓછું કે ખૂબ વધુ વજન',
      'PCOS કે અન્ય તબીબી સ્થિતિઓ',
    ],
    checklist: [
      '3 મહિનાથી વધુ સમય માસિક ન આવવું (ગર્ભાવસ્થા/સ્તનપાન સિવાય)',
      'ખૂબ લાંબાં ચક્રો (90 દિવસથી વધુ) કે ખૂબ ટૂંકાં ચક્રો (21 દિવસથી ઓછાં)',
      'તીવ્ર દુખાવો જે તમને સામાન્ય રીતે જીવવા ન દે',
      'ખૂબ વધુ કે અનિયમિત રક્તસ્રાવ',
      'જો તમે ગર્ભધારણનો પ્રયાસ કરતા હો અને અંડોત્સર્જન ન થતું હોય તેવું લાગે',
    ],
    advice: [
      'સંતુલિત આહાર',
      'પૂરતું પાણી પીવું',
      'શારીરિક પ્રવૃત્તિ',
      'તણાવનું વ્યવસ્થાપન',
      'સારી ઊંઘ',
    ],
    shareMessage: 'નિયમિત કે અનિયમિત ચક્ર: તફાવત શું છે? — AWA',
  },
  pa: {
    badge: 'ਚੱਕਰ ਅਤੇ ਮਾਹਵਾਰੀ',
    title: 'ਨਿਯਮਿਤ ਜਾਂ ਬੇਨਿਯਮਾ ਚੱਕਰ:\nਕੀ ਫ਼ਰਕ ਹੈ?',
    metaDuration: '5 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaValidated: 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ',
    intro:
      'ਹਰ ਮਾਹਵਾਰੀ ਚੱਕਰ ਵਿਲੱਖਣ ਹੁੰਦਾ ਹੈ। ਇਹ ਸਮਝਣਾ ਕਿ “ਆਮ” ਕੀ ਮੰਨਿਆ ਜਾਂਦਾ ਹੈ, ਤੁਹਾਨੂੰ ਆਪਣੀ ਸਿਹਤ ਦਾ ਹੋਰ ਧਿਆਨ ਨਾਲ ਰਿਕਾਰਡ ਰੱਖਣ ਅਤੇ ਸੰਭਵ ਅਸੰਤੁਲਨ ਪਛਾਣਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      'ਨਿਯਮਿਤ ਮਾਹਵਾਰੀ ਚੱਕਰ: ਇਹ ਕੀ ਹੈ?',
      'ਬੇਨਿਯਮਾ ਚੱਕਰ: ਇਸ ਦਾ ਕੀ ਮਤਲਬ ਹੈ?',
      'ਬੇਨਿਯਮੇ ਚੱਕਰ ਦੇ ਸੰਭਵ ਕਾਰਨ',
      'ਡਾਕਟਰ ਨੂੰ ਕਦੋਂ ਮਿਲਣਾ ਚਾਹੀਦਾ ਹੈ?',
      'ਵਧੇਰੇ ਸੰਤੁਲਿਤ ਚੱਕਰ ਲਈ ਸੁਝਾਅ',
    ],
    section1Body:
      'ਚੱਕਰ ਨੂੰ ਨਿਯਮਿਤ ਮੰਨਿਆ ਜਾਂਦਾ ਹੈ ਜਦੋਂ ਉਸ ਦੀ ਲੰਬਾਈ 21 ਅਤੇ 35 ਦਿਨਾਂ ਦੇ ਵਿਚਕਾਰ ਰਹੇ, ਅਤੇ ਇੱਕ ਚੱਕਰ ਤੋਂ ਦੂਜੇ ਤੱਕ 7 ਦਿਨਾਂ ਤੋਂ ਘੱਟ ਦਾ ਫ਼ਰਕ ਹੋਵੇ।',
    section1VisualTitle: 'ਕਾਫ਼ੀ ਸਥਿਰ ਰਫ਼ਤਾਰ',
    section1VisualText:
      'ਸਭ ਤੋਂ ਜ਼ਰੂਰੀ ਗੱਲ ਮਹੀਨਿਆਂ ਦੌਰਾਨ ਆਪਣੀ ਰਫ਼ਤਾਰ ਨੂੰ ਵੇਖਣਾ ਹੈ।',
    tip1Title: 'ਜਾਣਨ ਯੋਗ',
    tip1Text:
      'ਹਰ ਔਰਤ ਵੱਖਰੀ ਹੁੰਦੀ ਹੈ। ਜ਼ਰੂਰੀ ਇਹ ਹੈ ਕਿ ਤੁਸੀਂ ਆਪਣੀ ਰਫ਼ਤਾਰ ਅਤੇ ਉਸ ਦੇ ਆਮ ਉਤਰਾਅ-ਚੜ੍ਹਾਅ ਨੂੰ ਜਾਣੋ।',
    section2Body:
      'ਚੱਕਰ ਨੂੰ ਬੇਨਿਯਮਾ ਮੰਨਿਆ ਜਾਂਦਾ ਹੈ ਜਦੋਂ ਉਸ ਦੀ ਲੰਬਾਈ ਅਕਸਰ ਜਾਂ ਅਣਕਿਆਸੇ ਢੰਗ ਨਾਲ ਬਦਲੇ (7 ਦਿਨਾਂ ਤੋਂ ਵੱਧ ਦਾ ਫ਼ਰਕ)। ਇਹ ਬਹੁਤ ਛੋਟੇ ਚੱਕਰਾਂ, ਬਹੁਤ ਲੰਮੇ ਚੱਕਰਾਂ ਜਾਂ ਓਵੂਲੇਸ਼ਨ ਦੀ ਗ਼ੈਰਹਾਜ਼ਰੀ ਦੇ ਰੂਪ ਵਿੱਚ ਦਿਸ ਸਕਦਾ ਹੈ।',
    section2VisualTitle: 'ਵਧੇਰੇ ਸਾਫ਼ ਦਿਸਣ ਵਾਲੇ ਬਦਲਾਅ',
    section2VisualText:
      'ਇਹ ਫ਼ਰਕ ਅਸਥਾਈ ਹੋ ਸਕਦੇ ਹਨ ਜਾਂ ਕਈ ਚੱਕਰਾਂ ਤੱਕ ਬਣੇ ਰਹਿ ਸਕਦੇ ਹਨ।',
    alertTitle: 'ਕਿਰਪਾ ਕਰਕੇ ਧਿਆਨ ਦਿਓ',
    alertText:
      'ਅਸਥਾਈ ਬੇਨਿਯਮੀ ਆਮ ਹੋ ਸਕਦੀ ਹੈ (ਤਣਾਅ, ਹਾਰਮੋਨ ਦੇ ਬਦਲਾਅ, ਥਕਾਵਟ…)। ਪਰ ਜੇ ਇਹ ਬਣੀ ਰਹੇ, ਤਾਂ ਇਸ ਦੇ ਕਾਰਨ ਦੀ ਜਾਂਚ ਕਰਨੀ ਜ਼ਰੂਰੀ ਹੈ।',
    causes: [
      'ਤਣਾਅ ਅਤੇ ਚਿੰਤਾ',
      'ਹਾਰਮੋਨ ਦਾ ਅਸੰਤੁਲਨ',
      'ਨੀਂਦ ਦੀ ਕਮੀ ਅਤੇ ਥਕਾਵਟ',
      'ਭਾਰ ਬਹੁਤ ਘੱਟ ਜਾਂ ਬਹੁਤ ਵੱਧ ਹੋਣਾ',
      'PCOS ਜਾਂ ਹੋਰ ਡਾਕਟਰੀ ਸਮੱਸਿਆਵਾਂ',
    ],
    checklist: [
      '3 ਮਹੀਨਿਆਂ ਤੋਂ ਵੱਧ ਮਾਹਵਾਰੀ ਨਾ ਆਉਣਾ (ਗਰਭ-ਅਵਸਥਾ/ਛਾਤੀ ਦਾ ਦੁੱਧ ਪਿਲਾਉਣ ਤੋਂ ਬਾਹਰ)',
      'ਬਹੁਤ ਲੰਮੇ ਚੱਕਰ (90 ਦਿਨਾਂ ਤੋਂ ਵੱਧ) ਜਾਂ ਬਹੁਤ ਛੋਟੇ ਚੱਕਰ (21 ਦਿਨਾਂ ਤੋਂ ਘੱਟ)',
      'ਤੇਜ਼ ਦਰਦ ਜੋ ਤੁਹਾਨੂੰ ਆਮ ਜ਼ਿੰਦਗੀ ਜਿਉਣ ਤੋਂ ਰੋਕੇ',
      'ਬਹੁਤ ਜ਼ਿਆਦਾ ਜਾਂ ਬੇਨਿਯਮਾ ਖ਼ੂਨ ਵਹਿਣਾ',
      'ਜੇ ਤੁਸੀਂ ਗਰਭ ਧਾਰਨ ਦੀ ਕੋਸ਼ਿਸ਼ ਕਰ ਰਹੇ ਹੋ ਅਤੇ ਓਵੂਲੇਸ਼ਨ ਗ਼ੈਰਹਾਜ਼ਰ ਜਾਪਦਾ ਹੈ',
    ],
    advice: [
      'ਸੰਤੁਲਿਤ ਖ਼ੁਰਾਕ',
      'ਪਾਣੀ ਦੀ ਢੁੱਕਵੀਂ ਮਾਤਰਾ',
      'ਸਰੀਰਕ ਸਰਗਰਮੀ',
      'ਤਣਾਅ ਦਾ ਪ੍ਰਬੰਧ',
      'ਚੰਗੀ ਨੀਂਦ',
    ],
    shareMessage: 'ਨਿਯਮਿਤ ਜਾਂ ਬੇਨਿਯਮਾ ਚੱਕਰ: ਕੀ ਫ਼ਰਕ ਹੈ? — AWA',
  },
  my: {
    badge: 'ရာသီစက်ဝန်းနှင့် ရာသီလာခြင်း',
    title: 'ပုံမှန် သို့မဟုတ် မပုံမှန်သော ရာသီစက်ဝန်း -\nကွာခြားချက်ကား အဘယ်နည်း။',
    metaDuration: 'ဖတ်ချိန် 5 မိနစ်',
    metaValidated: 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ',
    intro:
      'ရာသီစက်ဝန်းတိုင်းသည် ထူးခြားသည်။ “ပုံမှန်” ဟု သတ်မှတ်ထားသည်ကို နားလည်ခြင်းက သင့်ကျန်းမာရေးကို ပိုနီးကပ်စွာ မှတ်သားရန်နှင့် မညီမျှမှုများကို သတိပြုမိရန် ကူညီနိုင်သည်။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'ပုံမှန်ရာသီစက်ဝန်း - ၎င်းကား အဘယ်နည်း။',
      'မပုံမှန်သော ရာသီစက်ဝန်း - ဆိုလိုသည်မှာ အဘယ်နည်း။',
      'မပုံမှန်သော ရာသီစက်ဝန်း၏ ဖြစ်နိုင်ခြေရှိသော အကြောင်းရင်းများ',
      'ဆရာဝန်ကို ဘယ်အချိန်ပြသင့်သလဲ။',
      'ပိုမိုမျှတသော ရာသီစက်ဝန်းအတွက် အကြံပြုချက်များ',
    ],
    section1Body:
      'ရာသီစက်ဝန်းတစ်ခု၏ ကြာချိန်သည် 21 ရက်မှ 35 ရက်အကြား ကွာခြားပြီး ရာသီစက်ဝန်းတစ်ခုမှ နောက်တစ်ခုသို့ ကွာခြားချက် 7 ရက်ထက်နည်းပါက ပုံမှန်ဟု သတ်မှတ်သည်။',
    section1VisualTitle: 'အတော်လေး တည်ငြိမ်သော အရှိန်',
    section1VisualText:
      'အရေးကြီးဆုံးမှာ လများတစ်လျှောက် သင့်ကိုယ်ပိုင်အရှိန်ကို စောင့်ကြည့်ခြင်းဖြစ်သည်။',
    tip1Title: 'သိထားသင့်သည်',
    tip1Text:
      'အမျိုးသမီးတိုင်း မတူပါ။ အရေးကြီးသည်မှာ သင့်ကိုယ်ပိုင်အရှိန်နှင့် ၎င်း၏ ပုံမှန်ပြောင်းလဲမှုများကို သိထားခြင်းဖြစ်သည်။',
    section2Body:
      'ရာသီစက်ဝန်း၏ ကြာချိန်သည် မကြာခဏ သို့မဟုတ် ခန့်မှန်း၍မရအောင် ကွာခြားလျှင် (ကွာခြားချက် 7 ရက်ထက်များလျှင်) မပုံမှန်ဟု သတ်မှတ်သည်။ ၎င်းသည် အလွန်တိုသော ရာသီစက်ဝန်းများ၊ အလွန်ရှည်သော ရာသီစက်ဝန်းများ သို့မဟုတ် မျိုးဥကြွေခြင်း မရှိခြင်းအဖြစ် ပေါ်လာနိုင်သည်။',
    section2VisualTitle: 'ပိုသိသာသော ကွာခြားမှုများ',
    section2VisualText:
      'ဤကွာခြားချက်များသည် ယာယီဖြစ်နိုင်သည် သို့မဟုတ် ရာသီစက်ဝန်းအကြိမ်များစွာ ဆက်ရှိနိုင်သည်။',
    alertTitle: 'ကျေးဇူးပြု၍ သတိပြုပါ',
    alertText:
      'ယာယီမပုံမှန်ခြင်းသည် ပုံမှန်ဖြစ်နိုင်သည် (စိတ်ဖိစီးမှု၊ ဟော်မုန်းပြောင်းလဲမှု၊ ပင်ပန်းနွမ်းနယ်ခြင်း…)။ သို့သော် ဆက်ရှိနေပါက အကြောင်းရင်းကို စုံစမ်းရန် အရေးကြီးသည်။',
    causes: [
      'စိတ်ဖိစီးမှုနှင့် စိုးရိမ်ပူပန်မှု',
      'ဟော်မုန်း မညီမျှမှုများ',
      'အိပ်ရေးပျက်ခြင်းနှင့် ပင်ပန်းနွမ်းနယ်ခြင်း',
      'ကိုယ်အလေးချိန် နည်းလွန်းခြင်း သို့မဟုတ် များလွန်းခြင်း',
      'PCOS သို့မဟုတ် အခြားဆေးဘက်ဆိုင်ရာ အခြေအနေများ',
    ],
    checklist: [
      'ရာသီ 3 လကျော် မလာခြင်း (ကိုယ်ဝန်ဆောင်ခြင်း/နို့တိုက်ခြင်း မဟုတ်ပါက)',
      'အလွန်ရှည်သော ရာသီစက်ဝန်းများ (90 ရက်ကျော်) သို့မဟုတ် အလွန်တိုသော ရာသီစက်ဝန်းများ (21 ရက်အောက်)',
      'ပုံမှန်နေထိုင်ရန် အဟန့်အတားဖြစ်စေသော ပြင်းထန်သည့် နာကျင်မှု',
      'အလွန်များပြားသော သို့မဟုတ် မပုံမှန်သော သွေးထွက်ခြင်း',
      'သန္ဓေတည်ရန် ကြိုးစားနေပြီး မျိုးဥကြွေခြင်း မရှိဟု ထင်ရလျှင်',
    ],
    advice: [
      'မျှတသော အစားအသောက်',
      'လုံလောက်သော ရေသောက်မှု',
      'ကိုယ်လက်လှုပ်ရှားမှု',
      'စိတ်ဖိစီးမှု စီမံခြင်း',
      'အရည်အသွေးကောင်းသော အိပ်စက်ခြင်း',
    ],
    shareMessage: 'ပုံမှန် သို့မဟုတ် မပုံမှန်သော ရာသီစက်ဝန်း - ကွာခြားချက်ကား အဘယ်နည်း။ — AWA',
  },
  km: {
    badge: 'វដ្តរដូវ និងរដូវ',
    title: 'វដ្តរដូវទៀងទាត់ ឬមិនទៀងទាត់៖\nតើមានអ្វីខុសគ្នា?',
    metaDuration: 'អាន 5 នាទី',
    metaValidated: 'មាតិកាបានពិនិត្យ',
    intro:
      'វដ្តរដូវនីមួយៗមានលក្ខណៈប្លែកពីគេ។ ការយល់ដឹងអំពីអ្វីដែលត្រូវបានចាត់ទុកថា “ធម្មតា” អាចជួយអ្នកតាមដានសុខភាពរបស់អ្នកឱ្យកាន់តែជិតស្និទ្ធ និងសម្គាល់ភាពមិនស្មើគ្នាដែលអាចកើតមាន។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'វដ្តរដូវទៀងទាត់៖ តើវាជាអ្វី?',
      'វដ្តមិនទៀងទាត់៖ តើវាមានន័យយ៉ាងណា?',
      'មូលហេតុដែលអាចបណ្តាលឱ្យវដ្តមិនទៀងទាត់',
      'តើពេលណាគួរជួបវេជ្ជបណ្ឌិត?',
      'គន្លឹះសម្រាប់វដ្តដែលមានតុល្យភាពជាងមុន',
    ],
    section1Body:
      'វដ្តមួយត្រូវបានចាត់ទុកថាទៀងទាត់ នៅពេលដែលរយៈពេលរបស់វាប្រែប្រួលរវាង 21 ដល់ 35 ថ្ងៃ ដោយមានភាពខុសគ្នាតិចជាង 7 ថ្ងៃពីវដ្តមួយទៅវដ្តមួយទៀត។',
    section1VisualTitle: 'ចង្វាក់ដែលមានស្ថិរភាពសមរម្យ',
    section1VisualText:
      'អ្វីដែលសំខាន់បំផុតគឺការសង្កេតចង្វាក់ផ្ទាល់ខ្លួនរបស់អ្នកក្នុងរយៈពេលជាច្រើនខែ។',
    tip1Title: 'គួរដឹង',
    tip1Text:
      'ស្ត្រីម្នាក់ៗខុសគ្នា។ អ្វីដែលសំខាន់គឺដឹងពីចង្វាក់ផ្ទាល់ខ្លួនរបស់អ្នក និងការប្រែប្រួលធម្មតារបស់វា។',
    section2Body:
      'វដ្តមួយត្រូវបានចាត់ទុកថាមិនទៀងទាត់ នៅពេលដែលរយៈពេលរបស់វាប្រែប្រួលញឹកញាប់ ឬមិនអាចទាយទុកបាន (ភាពខុសគ្នាលើសពី 7 ថ្ងៃ)។ នេះអាចបង្ហាញជាវដ្តខ្លីខ្លាំង វដ្តវែងខ្លាំង ឬគ្មានការបញ្ចេញពងអូវុល។',
    section2VisualTitle: 'ការប្រែប្រួលដែលកាន់តែច្បាស់',
    section2VisualText:
      'ភាពខុសគ្នាទាំងនេះអាចជាបណ្តោះអាសន្ន ឬបន្តកើតមានក្នុងវដ្តជាច្រើន។',
    alertTitle: 'សូមកត់សម្គាល់',
    alertText:
      'ភាពមិនទៀងទាត់បណ្តោះអាសន្នអាចជារឿងធម្មតា (ភាពតានតឹង ការផ្លាស់ប្តូរអរម៉ូន ការអស់កម្លាំង…)។ ប៉ុន្តែប្រសិនបើវាបន្តកើតមាន វាជារឿងសំខាន់ក្នុងការស្វែងរកមូលហេតុ។',
    causes: [
      'ភាពតានតឹង និងការថប់បារម្ភ',
      'ភាពមិនស្មើគ្នានៃអរម៉ូន',
      'ខ្វះដំណេក និងអស់កម្លាំង',
      'ទម្ងន់ទាបពេក ឬខ្ពស់ពេក',
      'PCOS ឬស្ថានភាពវេជ្ជសាស្ត្រផ្សេងទៀត',
    ],
    checklist: [
      'គ្មានរដូវលើសពី 3 ខែ (ក្រៅពីពេលមានផ្ទៃពោះ/បំបៅដោះ)',
      'វដ្តវែងខ្លាំង (លើសពី 90 ថ្ងៃ) ឬវដ្តខ្លីខ្លាំង (តិចជាង 21 ថ្ងៃ)',
      'ការឈឺចាប់ខ្លាំងដែលរារាំងអ្នកពីការរស់នៅជាធម្មតា',
      'ការហូរឈាមច្រើនខ្លាំង ឬមិនទៀងទាត់',
      'ប្រសិនបើអ្នកកំពុងព្យាយាមមានផ្ទៃពោះ ហើយការបញ្ចេញពងអូវុលហាក់ដូចជាមិនមាន',
    ],
    advice: [
      'របបអាហារមានតុល្យភាព',
      'ការផឹកទឹកឱ្យគ្រប់គ្រាន់',
      'សកម្មភាពរាងកាយ',
      'ការគ្រប់គ្រងភាពតានតឹង',
      'ដំណេកប្រកបដោយគុណភាព',
    ],
    shareMessage: 'វដ្តរដូវទៀងទាត់ ឬមិនទៀងទាត់៖ តើមានអ្វីខុសគ្នា? — AWA',
  },
  lo: {
    badge: 'ຮອບເດືອນ ແລະ ປະຈຳເດືອນ',
    title: 'ຮອບເດືອນປົກກະຕິ ຫຼື ບໍ່ປົກກະຕິ:\nແຕກຕ່າງກັນແນວໃດ?',
    metaDuration: 'ອ່ານ 5 ນາທີ',
    metaValidated: 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ',
    intro:
      'ຮອບເດືອນຂອງແຕ່ລະຄົນເປັນເອກະລັກ. ການເຂົ້າໃຈວ່າແນວໃດຖືວ່າ “ປົກກະຕິ” ຈະຊ່ວຍໃຫ້ທ່ານຕິດຕາມສຸຂະພາບໄດ້ໃກ້ຊິດຂຶ້ນ ແລະ ສັງເກດເຫັນຄວາມບໍ່ສົມດຸນທີ່ອາດເກີດຂຶ້ນ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ຮອບເດືອນປົກກະຕິ: ແມ່ນຫຍັງ?',
      'ຮອບເດືອນບໍ່ປົກກະຕິ: ໝາຍຄວາມວ່າແນວໃດ?',
      'ສາເຫດທີ່ອາດເຮັດໃຫ້ຮອບເດືອນບໍ່ປົກກະຕິ',
      'ເມື່ອໃດຄວນພົບແພດ?',
      'ຄຳແນະນຳເພື່ອຮອບເດືອນທີ່ສົມດຸນຂຶ້ນ',
    ],
    section1Body:
      'ຮອບເດືອນຖືວ່າປົກກະຕິເມື່ອຄວາມຍາວຂອງມັນຢູ່ລະຫວ່າງ 21 ຫາ 35 ມື້ ໂດຍຄວາມແຕກຕ່າງລະຫວ່າງຮອບໜຶ່ງກັບອີກຮອບໜຶ່ງຕ່ຳກວ່າ 7 ມື້.',
    section1VisualTitle: 'ຈັງຫວະທີ່ຄ່ອນຂ້າງສະໝ່ຳສະເໝີ',
    section1VisualText:
      'ສິ່ງສຳຄັນທີ່ສຸດແມ່ນການສັງເກດຈັງຫວະຂອງທ່ານເອງຕະຫຼອດຫຼາຍເດືອນ.',
    tip1Title: 'ຄວນຮູ້',
    tip1Text:
      'ແມ່ຍິງແຕ່ລະຄົນບໍ່ຄືກັນ. ສິ່ງສຳຄັນແມ່ນການຮູ້ຈັກຈັງຫວະຂອງຕົນເອງ ແລະ ຄວາມແປຜັນປົກກະຕິຂອງມັນ.',
    section2Body:
      'ຮອບເດືອນຖືວ່າບໍ່ປົກກະຕິເມື່ອຄວາມຍາວຂອງມັນແປຜັນເລື້ອຍໆ ຫຼື ຄາດເດົາບໍ່ໄດ້ (ແຕກຕ່າງກັນຫຼາຍກວ່າ 7 ມື້). ອາດສະແດງອອກເປັນຮອບເດືອນທີ່ສັ້ນຫຼາຍ, ຍາວຫຼາຍ ຫຼື ບໍ່ມີການຕົກໄຂ່.',
    section2VisualTitle: 'ຄວາມແປຜັນທີ່ເດັ່ນຊັດຂຶ້ນ',
    section2VisualText:
      'ຄວາມແຕກຕ່າງເຫຼົ່ານີ້ອາດເປັນພຽງຊົ່ວຄາວ ຫຼື ຍັງຄົງຢູ່ຫຼາຍຮອບເດືອນ.',
    alertTitle: 'ກະລຸນາສັງເກດ',
    alertText:
      'ຄວາມບໍ່ປົກກະຕິຊົ່ວຄາວອາດເປັນເລື່ອງປົກກະຕິ (ຄວາມຕຶງຄຽດ, ການປ່ຽນແປງຂອງຮໍໂມນ, ຄວາມອ່ອນເພຍ…). ແຕ່ຖ້າຍັງຄົງຢູ່ ສິ່ງສຳຄັນແມ່ນຕ້ອງຄົ້ນຫາສາເຫດ.',
    causes: [
      'ຄວາມຕຶງຄຽດ ແລະ ຄວາມກັງວົນ',
      'ຄວາມບໍ່ສົມດຸນຂອງຮໍໂມນ',
      'ນອນບໍ່ພໍ ແລະ ອ່ອນເພຍ',
      'ນ້ຳໜັກຕ່ຳ ຫຼື ສູງເກີນໄປ',
      'PCOS ຫຼື ພາວະທາງການແພດອື່ນໆ',
    ],
    checklist: [
      'ບໍ່ມີປະຈຳເດືອນເກີນ 3 ເດືອນ (ນອກຈາກໄລຍະຖືພາ/ລ້ຽງລູກດ້ວຍນົມແມ່)',
      'ຮອບເດືອນຍາວຫຼາຍ (ເກີນ 90 ມື້) ຫຼື ສັ້ນຫຼາຍ (ຕ່ຳກວ່າ 21 ມື້)',
      'ເຈັບປວດຮຸນແຮງຈົນໃຊ້ຊີວິດປົກກະຕິບໍ່ໄດ້',
      'ເລືອດອອກຫຼາຍຫຼາຍ ຫຼື ບໍ່ສະໝ່ຳສະເໝີ',
      'ຖ້າທ່ານກຳລັງພະຍາຍາມຕັ້ງຄັນ ແລະ ເບິ່ງຄືວ່າບໍ່ມີການຕົກໄຂ່',
    ],
    advice: [
      'ອາຫານທີ່ສົມດຸນ',
      'ການດື່ມນ້ຳໃຫ້ພຽງພໍ',
      'ກິດຈະກຳທາງກາຍ',
      'ການຈັດການຄວາມຕຶງຄຽດ',
      'ການນອນທີ່ມີຄຸນນະພາບ',
    ],
    shareMessage: 'ຮອບເດືອນປົກກະຕິ ຫຼື ບໍ່ປົກກະຕິ: ແຕກຕ່າງກັນແນວໃດ? — AWA',
  },
} as const);

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

export default function RegularIrregularCycleArticleScreen({
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
        showsVerticalScrollIndicator={false}
        onScroll={event =>
          saveScrollPosition(ID, event.nativeEvent.contentOffset.y)
        }
        scrollEventThrottle={200}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom:
              getBottomPadding(insets.bottom, READING_CONTROLS_SPACE),
          },
        ]}>
        {/* HERO */}
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
                paddingTop:
                  getTopPadding(insets.top, true),
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

        {/* ARTICLE */}
        <View style={styles.article}>
          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">
              {content.badge}
            </AwaText>
          </View>

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

          {/* META */}
          <View style={styles.metas}>
            {[
              ['clock-outline', content.metaDuration],
              ['shield-check-outline', content.metaValidated],
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

          <AwaText variant="bodyMedium" style={styles.intro}>
            {content.intro}
          </AwaText>

          {/* SOMMAIRE */}
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

                  <AwaText variant="bodySmall" style={styles.contentText}>
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

          {/* SECTION 1 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            1. {content.topics[0]}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section1Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.visualCard}>
            <Image
              source={ART.calendar}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.section1VisualTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.visualText}>
                {content.section1VisualText}
              </AwaText>
            </View>
          </AwaCard>

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

          {/* SECTION 2 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.topics[1]}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section2Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.visualCard}>
            <Image
              source={ART.heartbeat}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.section2VisualTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.visualText}>
                {content.section2VisualText}
              </AwaText>
            </View>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
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

          {/* SECTION 3 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            3. {content.topics[2]}
          </AwaText>

          <Image
            source={ART.causes}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <View style={styles.daily}>
            {CAUSE_ICONS.map((icon, index) => (
              <View
                key={icon}
                style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>
                  {content.causes[index]}
                </AwaText>
              </View>
            ))}
          </View>

          {/* SECTION 4 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            4. {content.topics[3]}
          </AwaText>

          <Image
            source={ART.consult}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.checklist.map(item => (
              <View
                key={item}
                style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" style={styles.checkText}>
                  {item}
                </AwaText>
              </View>
            ))}
          </AwaCard>

          {/* SECTION 5 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            5. {content.topics[4]}
          </AwaText>

          <Image
            source={ART.balance}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <View style={styles.daily}>
            {ADVICE_ICONS.map((icon, index) => (
              <View
                key={icon}
                style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>
                  {content.advice[index]}
                </AwaText>
              </View>
            ))}
          </View>

        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={5}
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
    backgroundColor: theme.colors.surfaceSecondary,
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
    minHeight: 40,
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

  visualCard: {
    marginTop: 16,
    minHeight: 98,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },

  visualImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },

  visualCopy: {
    flex: 1,
    marginLeft: 12,
  },


  visualText: {
    marginTop: 4,
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

  wideImage: {
    width: '100%',
    height: 120,
    marginTop: 16,
    borderRadius: 12,
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

  checkText: {
    flex: 1,
  },

  });
}
