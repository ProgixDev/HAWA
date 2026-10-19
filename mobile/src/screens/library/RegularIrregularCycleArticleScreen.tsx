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
const CONTENT = {
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
} as const;

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
