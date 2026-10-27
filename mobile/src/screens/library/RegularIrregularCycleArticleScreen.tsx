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
