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
import {EDITORIAL_IMAGE_ALT, resolveEditorialImage, PREGNANCY_FOLLOW_UP_HERO} from '../../i18n/editorialImages';
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

const ID = 'pregnancy-semaine-par-semaine';

const HERO = PREGNANCY_FOLLOW_UP_HERO;

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icon lists.
const TRIMESTER_ICONS = [
  'numeric-1-circle-outline',
  'numeric-2-circle-outline',
  'numeric-3-circle-outline',
  'calendar-check-outline',
] as const;

const URGENT_SIGN_ICONS = [
  'water-alert-outline',
  'alert-circle-outline',
  'baby-face-outline',
  'head-alert-outline',
  'thermometer-alert',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('PregnancyWeekly', {
  fr: {
    badge: 'GROSSESSE • VUE D’ENSEMBLE',
    title: 'Ta grossesse,\nsemaine par semaine',
    metaDuration: '8 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Les grandes étapes du premier au troisième trimestre, pour savoir à quoi t’attendre à chaque période.',
    introSecondary: 'Chaque grossesse suit son propre rythme : ces repères sont généraux et peuvent varier d’une femme à l’autre.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Le premier trimestre : les fondations',
      'Le deuxième trimestre : plus de confort',
      'Le troisième trimestre : se préparer',
      'Les grands repères par trimestre',
      'Symptômes courants à chaque étape',
      'Quand consulter rapidement',
      'À retenir',
    ],
    body1: 'Le premier trimestre pose les fondations : tous les organes principaux du bébé se forment progressivement. C’est aussi une période où la fatigue et les nausées sont fréquentes, à des degrés très variables selon les femmes.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Ces symptômes, bien que parfois inconfortables, sont un signe que le corps s’adapte activement à la grossesse.',
    body2: 'Le deuxième trimestre est souvent le plus confortable, avec l’apparition des premiers mouvements du bébé.',
    highlightTitle: 'Les premiers mouvements',
    highlightText: 'Ils sont généralement ressentis entre la 18e et la 22e semaine, un peu plus tôt si ce n’est pas ta première grossesse.',
    body3: 'Le troisième trimestre prépare le corps à l’accouchement, avec une prise de poids et une fatigue plus marquées. Des contractions d’entraînement (dites de Braxton Hicks) peuvent aussi apparaître.',
    neutralText: 'Ces contractions sont généralement irrégulières et peu douloureuses ; elles diffèrent des contractions du travail.',
    trimesters: [
      '1er trimestre : formation des organes',
      '2e trimestre : premiers mouvements',
      '3e trimestre : préparation à la naissance',
      'Un suivi médical à chaque étape',
    ],
    commonSymptoms: [
      'Nausées et fatigue, surtout au premier trimestre',
      'Tiraillements abdominaux liés à l’étirement des ligaments',
      'Essoufflement léger en fin de grossesse',
      'Troubles du sommeil en fin de troisième trimestre',
    ],
    consultIntro: 'Certains signes justifient un avis médical rapide, quel que soit le trimestre :',
    urgentSigns: [
      'Saignements, même légers',
      'Douleur abdominale intense',
      'Absence de mouvements ressentis',
      'Maux de tête violents ou troubles de la vue',
      'Fièvre inhabituelle',
    ],
    tip2Title: 'Bon à savoir',
    tip2Text: 'Chaque trimestre apporte ses propres changements : les connaître à l’avance aide à mieux vivre chaque étape, sans remplacer le suivi régulier de ta sage-femme ou de ton médecin.',
    shareMessage: 'Ta grossesse, semaine par semaine — AWA',
  },
  en: {
    badge: 'PREGNANCY • OVERVIEW',
    title: 'Your pregnancy,\nweek by week',
    metaDuration: '8 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'The key milestones from the first to the third trimester, so you know what to expect at each stage.',
    introSecondary: 'Every pregnancy follows its own rhythm: these benchmarks are general and can vary from woman to woman.',
    contentsTitle: 'In this article',
    topics: [
      'The first trimester: laying the foundations',
      'The second trimester: more comfort',
      'The third trimester: getting ready',
      'Key milestones by trimester',
      'Common symptoms at each stage',
      'When to seek care quickly',
      'Key takeaways',
    ],
    body1: 'The first trimester lays the foundations: all of the baby’s main organs form progressively. It’s also a time when fatigue and nausea are common, to very different degrees depending on the woman.',
    tip1Title: 'Good to know',
    tip1Text: 'These symptoms, although sometimes uncomfortable, are a sign that the body is actively adapting to pregnancy.',
    body2: 'The second trimester is often the most comfortable, with the baby’s first movements appearing.',
    highlightTitle: 'The first movements',
    highlightText: 'These are usually felt between weeks 18 and 22, a little earlier if this isn’t your first pregnancy.',
    body3: 'The third trimester prepares the body for childbirth, with more noticeable weight gain and fatigue. Practice contractions (known as Braxton Hicks) may also appear.',
    neutralText: 'These contractions are usually irregular and not very painful; they differ from labor contractions.',
    trimesters: [
      '1st trimester: organ formation',
      '2nd trimester: first movements',
      '3rd trimester: preparing for birth',
      'Medical follow-up at every stage',
    ],
    commonSymptoms: [
      'Nausea and fatigue, especially in the first trimester',
      'Abdominal twinges linked to ligaments stretching',
      'Mild shortness of breath later in pregnancy',
      'Sleep trouble in late third trimester',
    ],
    consultIntro: 'Certain signs call for prompt medical advice, whatever the trimester:',
    urgentSigns: [
      'Bleeding, even light',
      'Intense abdominal pain',
      'No movement felt',
      'Severe headaches or vision problems',
      'Unusual fever',
    ],
    tip2Title: 'Good to know',
    tip2Text: 'Each trimester brings its own changes: knowing them in advance helps you experience each stage better, without replacing regular follow-up with your midwife or doctor.',
    shareMessage: 'Your pregnancy, week by week — AWA',
  },
  es: {
    badge: 'EMBARAZO • VISIÓN GENERAL',
    title: 'Tu embarazo,\nsemana a semana',
    metaDuration: '8 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Las grandes etapas, del primer al tercer trimestre, para que sepas qué esperar en cada periodo.',
    introSecondary: 'Cada embarazo sigue su propio ritmo: estas referencias son generales y pueden variar de una mujer a otra.',
    contentsTitle: 'En este artículo',
    topics: [
      'El primer trimestre: los cimientos',
      'El segundo trimestre: más comodidad',
      'El tercer trimestre: prepararte',
      'Los grandes hitos por trimestre',
      'Síntomas frecuentes en cada etapa',
      'Cuándo consultar rápidamente',
      'Para recordar',
    ],
    body1: 'El primer trimestre sienta las bases: todos los órganos principales del bebé se forman progresivamente. También es un periodo en el que la fatiga y las náuseas son frecuentes, en grados muy variables según cada mujer.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Estos síntomas, aunque a veces incómodos, son una señal de que el cuerpo se está adaptando activamente al embarazo.',
    body2: 'El segundo trimestre suele ser el más cómodo, con la aparición de los primeros movimientos del bebé.',
    highlightTitle: 'Los primeros movimientos',
    highlightText: 'Generalmente se sienten entre la semana 18 y la semana 22, un poco antes si no es tu primer embarazo.',
    body3: 'El tercer trimestre prepara el cuerpo para el parto, con un aumento de peso y una fatiga más marcados. También pueden aparecer contracciones de entrenamiento (llamadas de Braxton Hicks).',
    neutralText: 'Estas contracciones suelen ser irregulares y poco dolorosas; son diferentes de las contracciones del parto.',
    trimesters: [
      '1.er trimestre: formación de los órganos',
      '2.º trimestre: primeros movimientos',
      '3.er trimestre: preparación para el nacimiento',
      'Un seguimiento médico en cada etapa',
    ],
    commonSymptoms: [
      'Náuseas y fatiga, sobre todo en el primer trimestre',
      'Tirones abdominales relacionados con el estiramiento de los ligamentos',
      'Falta de aire leve al final del embarazo',
      'Problemas de sueño al final del tercer trimestre',
    ],
    consultIntro: 'Algunos signos justifican una consulta médica rápida, sea cual sea el trimestre:',
    urgentSigns: [
      'Sangrado, incluso leve',
      'Dolor abdominal intenso',
      'Ausencia de movimientos percibidos',
      'Dolores de cabeza intensos o alteraciones de la vista',
      'Fiebre inusual',
    ],
    tip2Title: 'DATO ÚTIL',
    tip2Text: 'Cada trimestre trae sus propios cambios: conocerlos de antemano ayuda a vivir mejor cada etapa, sin reemplazar el seguimiento regular de tu partera o tu médico.',
    shareMessage: 'Tu embarazo, semana a semana — AWA',
  },
  it: {
    badge: 'GRAVIDANZA • PANORAMICA',
    title: 'La tua gravidanza,\nsettimana per settimana',
    metaDuration: '8 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Le tappe principali dal primo al terzo trimestre, per sapere cosa aspettarti in ogni fase.',
    introSecondary: 'Ogni gravidanza segue il suo ritmo: questi punti di riferimento sono generali e possono variare da donna a donna.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Il primo trimestre: porre le basi',
      'Il secondo trimestre: più benessere',
      'Il terzo trimestre: prepararsi',
      'Le tappe principali per trimestre',
      'Sintomi comuni in ogni fase',
      'Quando rivolgersi rapidamente a un medico',
      'Punti chiave',
    ],
    body1: 'Il primo trimestre pone le basi: tutti i principali organi del bambino si formano progressivamente. È anche un periodo in cui stanchezza e nausea sono frequenti, in misura molto diversa da una donna all’altra.',
    tip1Title: 'Da sapere',
    tip1Text: 'Questi sintomi, pur essendo a volte fastidiosi, sono un segno che il corpo si sta adattando attivamente alla gravidanza.',
    body2: 'Il secondo trimestre è spesso il più confortevole, con la comparsa dei primi movimenti del bambino.',
    highlightTitle: 'I primi movimenti',
    highlightText: 'Di solito si avvertono tra la settimana 18 e la 22, un po’ prima se non è la tua prima gravidanza.',
    body3: 'Il terzo trimestre prepara il corpo al parto, con un aumento di peso e una stanchezza più marcati. Possono comparire anche contrazioni di allenamento (dette di Braxton Hicks).',
    neutralText: 'Queste contrazioni sono di solito irregolari e poco dolorose; si distinguono dalle contrazioni del travaglio.',
    trimesters: [
      'Primo trimestre: formazione degli organi',
      'Secondo trimestre: primi movimenti',
      'Terzo trimestre: preparazione alla nascita',
      'Controlli medici in ogni fase',
    ],
    commonSymptoms: [
      'Nausea e stanchezza, soprattutto nel primo trimestre',
      'Fitte addominali legate allo stiramento dei legamenti',
      'Lieve mancanza di fiato nelle fasi avanzate della gravidanza',
      'Disturbi del sonno a fine terzo trimestre',
    ],
    consultIntro: 'Alcuni segnali richiedono un consulto medico tempestivo, in qualsiasi trimestre:',
    urgentSigns: [
      'Sanguinamento, anche lieve',
      'Dolore addominale intenso',
      'Nessun movimento avvertito',
      'Forti mal di testa o disturbi della vista',
      'Febbre insolita',
    ],
    tip2Title: 'Da sapere',
    tip2Text: 'Ogni trimestre porta con sé i suoi cambiamenti: conoscerli in anticipo ti aiuta a vivere meglio ogni fase, senza sostituire il regolare controllo con la tua ostetrica o il tuo medico.',
    shareMessage: 'La tua gravidanza, settimana per settimana — AWA',
  },
  tr: {
    badge: 'GEBELİK • GENEL BAKIŞ',
    title: 'Gebeliğin,\nhaftadan haftaya',
    metaDuration: '8 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Her aşamada seni nelerin beklediğini bilmen için birinci trimesterden üçüncü trimestere kadar önemli dönüm noktaları.',
    introSecondary: 'Her gebelik kendi ritmini izler: bu referans noktaları geneldir ve kadından kadına değişebilir.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Birinci trimester: temelin atılması',
      'İkinci trimester: daha fazla rahatlık',
      'Üçüncü trimester: hazırlanma',
      'Trimesterlere göre önemli dönüm noktaları',
      'Her aşamada sık görülen belirtiler',
      'Ne zaman hızlıca sağlık hizmetine başvurmalı',
      'Öne çıkan noktalar',
    ],
    body1: 'Birinci trimester temeli atar: bebeğin başlıca organlarının tümü adım adım oluşur. Bu, yorgunluk ve bulantının sık görüldüğü bir dönemdir; ancak şiddeti kadından kadına çok farklıdır.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Bu belirtiler bazen rahatsız edici olsa da bedenin gebeliğe aktif olarak uyum sağladığının bir işaretidir.',
    body2: 'İkinci trimester çoğu zaman en rahat dönemdir; bebeğin ilk hareketleri de bu dönemde ortaya çıkar.',
    highlightTitle: 'İlk hareketler',
    highlightText: 'Genellikle 18. ile 22. haftalar arasında hissedilir; ilk gebeliğin değilse biraz daha erken hissedilebilir.',
    body3: 'Üçüncü trimester, daha belirgin kilo alımı ve yorgunlukla birlikte bedeni doğuma hazırlar. Prova kasılmaları (Braxton Hicks olarak bilinir) da ortaya çıkabilir.',
    neutralText: 'Bu kasılmalar genellikle düzensizdir ve pek acı vermez; doğum kasılmalarından farklıdırlar.',
    trimesters: [
      '1. trimester: organların oluşumu',
      '2. trimester: ilk hareketler',
      '3. trimester: doğuma hazırlık',
      'Her aşamada tıbbi takip',
    ],
    commonSymptoms: [
      'Özellikle birinci trimesterde bulantı ve yorgunluk',
      'Bağların gerilmesine bağlı karın bölgesinde sızılar',
      'Gebeliğin ilerleyen dönemlerinde hafif nefes darlığı',
      'Üçüncü trimesterin sonlarında uyku sorunları',
    ],
    consultIntro: 'Bazı belirtiler, hangi trimesterde olursan ol, hızlıca tıbbi tavsiye almayı gerektirir:',
    urgentSigns: [
      'Hafif de olsa kanama',
      'Şiddetli karın ağrısı',
      'Hiç hareket hissedilmemesi',
      'Şiddetli baş ağrıları veya görme sorunları',
      'Alışılmadık ateş',
    ],
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Her trimester kendi değişikliklerini getirir: bunları önceden bilmek, ebenle veya doktorunla düzenli takibin yerini tutmadan, her aşamayı daha iyi yaşamana yardımcı olur.',
    shareMessage: 'Gebeliğin, haftadan haftaya — AWA',
  },
  ru: {
    badge: 'БЕРЕМЕННОСТЬ • ОБЗОР',
    title: 'Ваша беременность\nнеделя за неделей',
    metaDuration: '8 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Основные этапы с первого по третий триместр, чтобы вы знали, чего ожидать на каждом из них.',
    introSecondary: 'Каждая беременность протекает в своём ритме: эти ориентиры носят общий характер и могут отличаться у разных женщин.',
    contentsTitle: 'В этой статье',
    topics: [
      'Первый триместр: закладываются основы',
      'Второй триместр: больше комфорта',
      'Третий триместр: подготовка к родам',
      'Основные этапы по триместрам',
      'Частые симптомы на каждом этапе',
      'Когда нужно срочно обратиться за помощью',
      'Главное',
    ],
    body1: 'В первом триместре закладываются основы: постепенно формируются все главные органы малыша. В это время нередки усталость и тошнота, причём степень их выраженности у разных женщин очень различается.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Эти симптомы, хотя и бывают неприятными, говорят о том, что организм активно перестраивается на время беременности.',
    body2: 'Второй триместр часто бывает самым комфортным: в это время появляются первые шевеления малыша.',
    highlightTitle: 'Первые шевеления',
    highlightText: 'Обычно их ощущают между 18-й и 22-й неделями, немного раньше — если это не первая беременность.',
    body3: 'В третьем триместре организм готовится к родам: прибавка в весе становится заметнее, усиливается усталость. Могут также появляться тренировочные схватки (схватки Брэкстона-Хикса).',
    neutralText: 'Такие схватки обычно нерегулярны и малоболезненны; они отличаются от родовых схваток.',
    trimesters: [
      '1-й триместр: формирование органов',
      '2-й триместр: первые шевеления',
      '3-й триместр: подготовка к родам',
      'Медицинское наблюдение на каждом этапе',
    ],
    commonSymptoms: [
      'Тошнота и усталость, особенно в первом триместре',
      'Тянущие боли внизу живота из-за растяжения связок',
      'Лёгкая одышка на поздних сроках беременности',
      'Нарушения сна в конце третьего триместра',
    ],
    consultIntro: 'Некоторые признаки требуют срочной консультации врача в любом триместре:',
    urgentSigns: [
      'Кровотечение, даже незначительное',
      'Сильная боль в животе',
      'Отсутствие шевелений',
      'Сильные головные боли или нарушения зрения',
      'Необычная температура',
    ],
    tip2Title: 'Полезно знать',
    tip2Text: 'Каждый триместр приносит свои изменения: если знать о них заранее, будет легче пройти каждый этап. Это не заменяет регулярного наблюдения у акушерки или врача.',
    shareMessage: 'Ваша беременность неделя за неделей — AWA',
  },
  de: {
    badge: 'SCHWANGERSCHAFT • ÜBERBLICK',
    title: 'Deine Schwangerschaft,\nWoche für Woche',
    metaDuration: '8 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Die wichtigsten Meilensteine vom ersten bis zum dritten Trimester, damit du weißt, was dich in jeder Phase erwartet.',
    introSecondary: 'Jede Schwangerschaft hat ihren eigenen Rhythmus: Diese Richtwerte sind allgemein und können von Frau zu Frau abweichen.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Das erste Trimester: das Fundament',
      'Das zweite Trimester: mehr Wohlbefinden',
      'Das dritte Trimester: die Vorbereitung',
      'Wichtige Meilensteine nach Trimester',
      'Häufige Symptome in jeder Phase',
      'Wann du schnell ärztliche Hilfe suchen solltest',
      'Das Wichtigste in Kürze',
    ],
    body1: 'Im ersten Trimester wird das Fundament gelegt: Alle wichtigen Organe des Babys bilden sich nach und nach aus. Außerdem sind Müdigkeit und Übelkeit in dieser Zeit häufig, bei jeder Frau in sehr unterschiedlichem Ausmaß.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Diese Symptome sind zwar manchmal unangenehm, zeigen aber, dass sich der Körper aktiv auf die Schwangerschaft einstellt.',
    body2: 'Das zweite Trimester ist oft das angenehmste, in dem auch die ersten Bewegungen des Babys spürbar werden.',
    highlightTitle: 'Die ersten Bewegungen',
    highlightText: 'Sie sind meist zwischen der 18. und 22. Woche zu spüren, etwas früher, wenn es nicht deine erste Schwangerschaft ist.',
    body3: 'Das dritte Trimester bereitet den Körper auf die Geburt vor, mit deutlicherer Gewichtszunahme und Müdigkeit. Es können auch Übungswehen (sogenannte Braxton-Hicks-Kontraktionen) auftreten.',
    neutralText: 'Diese Kontraktionen sind meist unregelmäßig und wenig schmerzhaft; sie unterscheiden sich von Geburtswehen.',
    trimesters: [
      '1. Trimester: Bildung der Organe',
      '2. Trimester: erste Bewegungen',
      '3. Trimester: Vorbereitung auf die Geburt',
      'Ärztliche Begleitung in jeder Phase',
    ],
    commonSymptoms: [
      'Übelkeit und Müdigkeit, besonders im ersten Trimester',
      'Ziehen im Bauch durch die Dehnung der Bänder',
      'Leichte Atemnot im späteren Verlauf der Schwangerschaft',
      'Schlafprobleme am Ende des dritten Trimesters',
    ],
    consultIntro: 'Bestimmte Anzeichen erfordern in jedem Trimester schnell ärztlichen Rat:',
    urgentSigns: [
      'Blutungen, auch leichte',
      'Starke Bauchschmerzen',
      'Keine Bewegungen spürbar',
      'Starke Kopfschmerzen oder Sehstörungen',
      'Ungewöhnliches Fieber',
    ],
    tip2Title: 'Gut zu wissen',
    tip2Text: 'Jedes Trimester bringt eigene Veränderungen: Wenn du sie im Voraus kennst, erlebst du jede Phase besser – die regelmäßige Begleitung durch deine Hebamme oder Ärztin bzw. deinen Arzt ersetzt das nicht.',
    shareMessage: 'Deine Schwangerschaft, Woche für Woche – AWA',
  },
  zh: {
      badge: '怀孕 • 概览',
      title: '你的孕期，\n一周一周地走过',
      metaDuration: '阅读约 8 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '从孕早期到孕晚期的关键节点，让你对每个阶段心中有数。',
      introSecondary: '每次怀孕都有自己的节奏：这些参照是一般性的，因人而异。',
      contentsTitle: '本文内容',
      topics: [
        '孕早期：打下基础',
        '孕中期：更舒适',
        '孕晚期：做好准备',
        '各孕期的关键节点',
        '各阶段的常见症状',
        '何时需要尽快就医',
        '要点回顾',
      ],
      body1: '孕早期是打下基础的阶段：宝宝的主要器官会逐步形成。这也是疲倦和恶心较常见的时期，程度因人而异。',
      tip1Title: '小贴士',
      tip1Text: '这些症状虽然有时让人不舒服，但说明身体正在积极适应怀孕。',
      body2: '孕中期通常是最舒适的阶段，宝宝的第一次胎动也会出现。',
      highlightTitle: '第一次胎动',
      highlightText: '通常在孕 18 到 22 周之间感觉到；如果不是第一次怀孕，可能会稍早一些。',
      body3: '孕晚期，身体为分娩做准备，体重增加和疲倦会更明显。也可能出现“练习性”宫缩（即 Braxton Hicks 宫缩）。',
      neutralText: '这些宫缩通常不规律，疼痛不明显；它们与临产宫缩不同。',
      trimesters: [
        '孕早期：器官形成',
        '孕中期：第一次胎动',
        '孕晚期：为分娩做准备',
        '每个阶段都要进行医疗随访',
      ],
      commonSymptoms: [
        '恶心和疲倦，尤其在孕早期',
        '因韧带被拉伸引起的下腹部抽痛',
        '孕期后段出现轻微的气短',
        '孕晚期后段睡眠不好',
      ],
      consultIntro: '无论处于哪个孕期，出现某些迹象时都应尽快寻求医疗建议：',
      urgentSigns: [
        '出血，即使量很少',
        '剧烈的腹痛',
        '感觉不到胎动',
        '严重的头痛或视力问题',
        '不寻常的发热',
      ],
      tip2Title: '小贴士',
      tip2Text: '每个孕期都会带来各自的变化：提前了解有助于你更好地度过每个阶段，但并不能替代与助产士或医生的定期随访。',
      shareMessage: '你的孕期，一周一周地走过 — AWA',
    },
  id: {
    badge: 'KEHAMILAN • GAMBARAN UMUM',
    title: 'Kehamilanmu,\nminggu demi minggu',
    metaDuration: '8 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Tonggak-tonggak utama dari trimester pertama hingga ketiga, agar kamu tahu apa yang bisa diharapkan di setiap tahap.',
    introSecondary: 'Setiap kehamilan mengikuti ritmenya sendiri: patokan ini bersifat umum dan bisa berbeda dari satu perempuan ke perempuan lain.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Trimester pertama: meletakkan fondasi',
      'Trimester kedua: lebih nyaman',
      'Trimester ketiga: bersiap',
      'Tonggak penting di setiap trimester',
      'Gejala umum di setiap tahap',
      'Kapan harus segera mencari pertolongan',
      'Poin penting',
    ],
    body1: 'Trimester pertama meletakkan fondasi: semua organ utama bayi terbentuk secara bertahap. Ini juga masa ketika kelelahan dan mual sering terjadi, dengan tingkat yang sangat berbeda-beda pada tiap perempuan.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Gejala-gejala ini, meskipun terkadang tidak nyaman, menandakan bahwa tubuh sedang beradaptasi secara aktif dengan kehamilan.',
    body2: 'Trimester kedua sering kali yang paling nyaman, dengan munculnya gerakan pertama bayi.',
    highlightTitle: 'Gerakan pertama',
    highlightText: 'Biasanya terasa antara minggu ke-18 dan ke-22, sedikit lebih awal jika ini bukan kehamilan pertamamu.',
    body3: 'Trimester ketiga mempersiapkan tubuh untuk persalinan, dengan kenaikan berat badan dan kelelahan yang lebih terasa. Kontraksi latihan (dikenal sebagai Braxton Hicks) juga bisa muncul.',
    neutralText: 'Kontraksi ini biasanya tidak teratur dan tidak terlalu nyeri; kontraksi ini berbeda dari kontraksi persalinan.',
    trimesters: [
      'Trimester ke-1: pembentukan organ',
      'Trimester ke-2: gerakan pertama',
      'Trimester ke-3: bersiap untuk kelahiran',
      'Pemeriksaan medis di setiap tahap',
    ],
    commonSymptoms: [
      'Mual dan kelelahan, terutama pada trimester pertama',
      'Nyeri menusuk di perut akibat peregangan ligamen',
      'Sesak napas ringan pada kehamilan lanjut',
      'Gangguan tidur pada akhir trimester ketiga',
    ],
    consultIntro: 'Tanda-tanda tertentu memerlukan saran medis segera, pada trimester mana pun:',
    urgentSigns: [
      'Perdarahan, meskipun ringan',
      'Nyeri perut yang hebat',
      'Tidak ada gerakan yang terasa',
      'Sakit kepala berat atau gangguan penglihatan',
      'Demam yang tidak biasa',
    ],
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Setiap trimester membawa perubahannya sendiri: mengetahuinya sebelumnya membantumu menjalani setiap tahap dengan lebih baik, tanpa menggantikan pemeriksaan rutin bersama bidan atau dokter.',
    shareMessage: 'Kehamilanmu, minggu demi minggu — AWA',
  },
  hi: {
    badge: 'गर्भावस्था • अवलोकन',
    title: 'आपकी गर्भावस्था,\nहफ़्ते दर हफ़्ते',
    metaDuration: '8 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'पहली से तीसरी तिमाही तक के मुख्य पड़ाव, ताकि आप जान सकें कि हर चरण में क्या उम्मीद रखनी है।',
    introSecondary: 'हर गर्भावस्था अपनी गति से आगे बढ़ती है: ये पैमाने सामान्य हैं और एक महिला से दूसरी में अलग हो सकते हैं।',
    contentsTitle: 'इस लेख में',
    topics: [
      'पहली तिमाही: नींव तैयार होना',
      'दूसरी तिमाही: ज़्यादा आराम',
      'तीसरी तिमाही: तैयारी का समय',
      'हर तिमाही के मुख्य पड़ाव',
      'हर चरण के आम लक्षण',
      'कब तुरंत डॉक्टर को दिखाएँ',
      'मुख्य बातें',
    ],
    body1: 'पहली तिमाही में नींव तैयार होती है: शिशु के सभी मुख्य अंग धीरे-धीरे बनते हैं। यह वह समय भी है जब थकान और मिचली आम होती है, हालाँकि हर महिला में इनकी तीव्रता बहुत अलग हो सकती है।',
    tip1Title: 'जानने लायक बात',
    tip1Text: 'ये लक्षण कभी-कभी असहज होने पर भी इस बात का संकेत हैं कि शरीर गर्भावस्था के अनुसार सक्रिय रूप से ढल रहा है।',
    body2: 'दूसरी तिमाही अक्सर सबसे आरामदायक होती है, जिसमें शिशु की पहली हलचल महसूस होने लगती है।',
    highlightTitle: 'पहली हलचल',
    highlightText: 'यह आमतौर पर 18वें से 22वें हफ़्ते के बीच महसूस होती है, और अगर यह आपकी पहली गर्भावस्था नहीं है तो थोड़ा पहले।',
    body3: 'तीसरी तिमाही शरीर को प्रसव के लिए तैयार करती है, जिसमें वज़न बढ़ना और थकान ज़्यादा महसूस होती है। अभ्यास संकुचन (जिन्हें ब्रैक्सटन हिक्स कहा जाता है) भी हो सकते हैं।',
    neutralText: 'ये संकुचन आमतौर पर अनियमित और कम दर्दनाक होते हैं; ये प्रसव के संकुचनों से अलग होते हैं।',
    trimesters: [
      'तिमाही 1: अंगों का बनना',
      'तिमाही 2: पहली हलचल',
      'तिमाही 3: प्रसव की तैयारी',
      'हर चरण में चिकित्सकीय निगरानी',
    ],
    commonSymptoms: [
      'मिचली और थकान, खासकर पहली तिमाही में',
      'लिगामेंट्स के खिंचने से पेट में हल्की चुभन',
      'गर्भावस्था के आगे के चरण में हल्की साँस फूलना',
      'तीसरी तिमाही के आख़िर में नींद की परेशानी',
    ],
    consultIntro: 'कुछ संकेतों में तिमाही चाहे जो भी हो, तुरंत डॉक्टर की सलाह लेना ज़रूरी है:',
    urgentSigns: [
      'रक्तस्राव, भले ही हल्का हो',
      'पेट में तेज़ दर्द',
      'शिशु की हलचल महसूस न होना',
      'तेज़ सिरदर्द या देखने में परेशानी',
      'असामान्य बुखार',
    ],
    tip2Title: 'जानने लायक बात',
    tip2Text: 'हर तिमाही अपने बदलाव लाती है: इन्हें पहले से जानना हर चरण को बेहतर ढंग से जीने में मदद करता है, लेकिन यह आपकी दाई-नर्स (मिडवाइफ़) या डॉक्टर की नियमित जाँच की जगह नहीं लेता।',
    shareMessage: 'आपकी गर्भावस्था, हफ़्ते दर हफ़्ते — AWA',
  },
  sq: {
    badge: 'SHTATZËNIA • PAMJE E PËRGJITHSHME',
    title: 'Shtatzënia jote,\njavë pas jave',
    metaDuration: '8 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Pikat kryesore nga tremujori i parë deri te i treti, që të dish çfarë të presësh në çdo fazë.',
    introSecondary: 'Çdo shtatzëni ka ritmin e vet: këto pika referimi janë të përgjithshme dhe mund të ndryshojnë nga një grua te tjetra.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Tremujori i parë: hedhja e themeleve',
      'Tremujori i dytë: më shumë rehati',
      'Tremujori i tretë: përgatitja',
      'Pikat kryesore sipas tremujorit',
      'Simptomat e zakonshme në çdo fazë',
      'Kur duhet të kërkosh kujdes shpejt',
      'Pikat kryesore',
    ],
    body1: 'Tremujori i parë hedh themelet: të gjitha organet kryesore të bebes formohen gradualisht. Është edhe një kohë kur lodhja dhe të përzierat janë të zakonshme, me shkallë shumë të ndryshme sipas çdo gruaje.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Këto simptoma, edhe pse ndonjëherë të bezdisshme, janë shenjë se trupi po përshtatet në mënyrë aktive me shtatzëninë.',
    body2: 'Tremujori i dytë është shpesh më i rehatshmi, me shfaqjen e lëvizjeve të para të bebes.',
    highlightTitle: 'Lëvizjet e para',
    highlightText: 'Zakonisht ndjehen midis javëve 18 dhe 22, pak më herët nëse nuk është shtatzënia jote e parë.',
    body3: 'Tremujori i tretë përgatit trupin për lindjen, me shtim më të dukshëm në peshë dhe lodhje. Mund të shfaqen edhe kontraksione stërvitore (të njohura si Braxton Hicks).',
    neutralText: 'Këto kontraksione zakonisht janë të parregullta dhe pak të dhimbshme; ato dallojnë nga kontraksionet e lindjes.',
    trimesters: [
      'Tremujori i 1-rë: formimi i organeve',
      'Tremujori i 2-të: lëvizjet e para',
      'Tremujori i 3-të: përgatitja për lindjen',
      'Ndjekje mjekësore në çdo fazë',
    ],
    commonSymptoms: [
      'Të përziera dhe lodhje, sidomos në tremujorin e parë',
      'Shpime në bark të lidhura me shtrirjen e ligamenteve',
      'Mungesë e lehtë fryme në fazat e mëvonshme të shtatzënisë',
      'Vështirësi me gjumin në fund të tremujorit të tretë',
    ],
    consultIntro: 'Disa shenja kërkojnë këshillë mjekësore të menjëhershme, në cilindo tremujor:',
    urgentSigns: [
      'Gjakderdhje, edhe e lehtë',
      'Dhimbje e fortë në bark',
      'Mungesë lëvizjesh të ndjera',
      'Dhimbje koke të forta ose probleme me shikimin',
      'Ethe të pazakonta',
    ],
    tip2Title: 'Mirë është ta dish',
    tip2Text: 'Çdo tremujor sjell ndryshimet e veta: t’i njohësh paraprakisht të ndihmon t’i përjetosh më mirë çdo fazë, pa zëvendësuar ndjekjen e rregullt me maminë ose mjekun tënd.',
    shareMessage: 'Shtatzënia jote, javë pas jave — AWA',
  },
  ja: {
    badge: '妊娠 • 概要',
    title: '妊娠の経過を\n週ごとに',
    metaDuration: '読了8分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '確認済みの内容',
    intro: '妊娠初期から後期までの主な節目をまとめました。各段階で何が起こりやすいかを知る手がかりになります。',
    introSecondary: '妊娠の進み方は一人ひとり異なります。ここに示す目安は一般的なもので、人によって差があります。',
    contentsTitle: 'この記事の内容',
    topics: [
      '妊娠初期：土台づくりの時期',
      '妊娠中期：過ごしやすくなる時期',
      '妊娠後期：出産に向けた準備の時期',
      '妊娠期ごとの主な節目',
      '各段階でよくある症状',
      '早めに受診が必要なとき',
      'この記事のポイント',
    ],
    body1: '妊娠初期は土台づくりの時期で、赤ちゃんの主な臓器が少しずつ形づくられていきます。この時期は疲れやすさや吐き気が起こりやすく、その程度は人によって大きく異なります。',
    tip1Title: '知っておきたいこと',
    tip1Text: 'こうした症状はつらいこともありますが、体が妊娠に合わせて活発に変化している表れです。',
    body2: '妊娠中期は最も過ごしやすいことが多く、赤ちゃんの最初の動きを感じ始めます。',
    highlightTitle: '最初の胎動',
    highlightText: '一般的に妊娠18〜22週ごろに感じられ、初めての妊娠でない場合はもう少し早いこともあります。',
    body3: '妊娠後期は体が出産に備える時期で、体重の増加や疲れがより目立つようになります。練習のための収縮（ブラクストン・ヒックス収縮）が起こることもあります。',
    neutralText: 'こうした収縮は通常、不規則であまり痛みがなく、陣痛とは異なります。',
    trimesters: [
      '妊娠初期：臓器の形成',
      '妊娠中期：最初の胎動',
      '妊娠後期：出産の準備',
      'どの段階でも医療的なフォローを',
    ],
    commonSymptoms: [
      '吐き気や疲れ（特に妊娠初期）',
      '靭帯が引き伸ばされることによる下腹部のつっぱり感',
      '妊娠後期に入ってからの軽い息切れ',
      '妊娠後期の終わりごろの睡眠の乱れ',
    ],
    consultIntro: '妊娠期にかかわらず、次のような兆候があるときはすぐに医療機関に相談してください。',
    urgentSigns: [
      '出血（少量でも）',
      '強い腹痛',
      '胎動を感じない',
      'ひどい頭痛や視覚の異常',
      'いつもと違う発熱',
    ],
    tip2Title: '知っておきたいこと',
    tip2Text: '妊娠期ごとに体の変化は異なります。あらかじめ知っておくと各段階を落ち着いて過ごしやすくなりますが、助産師や医師による定期的な健診の代わりにはなりません。',
    shareMessage: '妊娠の経過を週ごとに — AWA',
  },
  ko: {
    badge: '임신 • 개요',
    title: '주차별로 보는\n나의 임신',
    metaDuration: '읽는 데 8분',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '임신 초기부터 후기까지 주요 이정표를 살펴보고, 각 시기에 어떤 일이 있을지 미리 알아 두세요.',
    introSecondary: '임신은 저마다 다른 속도로 진행돼요. 여기에 나온 기준은 일반적인 것이라 사람마다 다를 수 있어요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    topics: [
      '임신 초기: 기초를 다지는 시기',
      '임신 중기: 한결 편안해지는 시기',
      '임신 후기: 출산을 준비하는 시기',
      '시기별 주요 이정표',
      '시기별 흔한 증상',
      '빨리 진료를 받아야 할 때',
      '핵심 정리',
    ],
    body1: '임신 초기에는 아기의 주요 장기가 차근차근 만들어지면서 기초가 다져져요. 피로와 메스꺼움이 흔하게 나타나는 시기이기도 한데, 정도는 사람마다 많이 달라요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '이런 증상은 때로 불편하지만, 몸이 임신에 적극적으로 적응하고 있다는 신호예요.',
    body2: '임신 중기는 대체로 가장 편안한 시기이고, 아기의 첫 움직임이 느껴지기 시작해요.',
    highlightTitle: '첫 태동',
    highlightText: '보통 임신 18~22주차 사이에 느끼게 돼요. 첫 임신이 아니라면 조금 더 일찍 느낄 수도 있어요.',
    body3: '임신 후기에는 몸이 출산을 준비하면서 체중 증가와 피로가 더 뚜렷해져요. 연습 수축(브랙스턴 힉스 수축)이 나타날 수도 있어요.',
    neutralText: '이런 수축은 대개 불규칙하고 통증이 심하지 않아요. 진통과는 달라요.',
    trimesters: [
      '임신 초기: 장기 형성',
      '임신 중기: 첫 태동',
      '임신 후기: 출산 준비',
      '모든 시기에 의료진의 정기 검진',
    ],
    commonSymptoms: [
      '메스꺼움과 피로, 특히 임신 초기',
      '인대가 늘어나면서 생기는 아랫배의 찌릿한 느낌',
      '임신 후반기의 가벼운 숨 가쁨',
      '임신 후기 막바지의 수면 문제',
    ],
    consultIntro: '임신 시기와 상관없이 다음과 같은 징후가 있으면 바로 의료진의 조언을 받아야 해요.',
    urgentSigns: [
      '출혈, 소량이라도',
      '심한 복통',
      '태동이 느껴지지 않을 때',
      '심한 두통이나 시야 이상',
      '평소와 다른 발열',
    ],
    tip2Title: '알아 두면 좋아요',
    tip2Text: '시기마다 몸에 다른 변화가 찾아와요. 미리 알아 두면 각 시기를 더 편안하게 보낼 수 있어요. 다만 조산사나 의사의 정기 검진을 대신할 수는 없어요.',
    shareMessage: '주차별로 보는 나의 임신 — AWA',
  },
  'pt-PT': {
    badge: 'GRAVIDEZ • VISÃO GERAL',
    title: 'A sua gravidez,\nsemana a semana',
    metaDuration: '8 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Os principais marcos do primeiro ao terceiro trimestre, para saber o que esperar em cada fase.',
    introSecondary: 'Cada gravidez segue o seu próprio ritmo: estas referências são gerais e podem variar de mulher para mulher.',
    contentsTitle: 'Neste artigo',
    topics: [
      'O primeiro trimestre: lançar as bases',
      'O segundo trimestre: mais conforto',
      'O terceiro trimestre: preparar-se',
      'Marcos principais por trimestre',
      'Sintomas frequentes em cada fase',
      'Quando procurar cuidados rapidamente',
      'Pontos-chave',
    ],
    body1: 'O primeiro trimestre lança as bases: todos os principais órgãos do bebé formam-se progressivamente. É também um período em que o cansaço e as náuseas são frequentes, em graus muito diferentes consoante a mulher.',
    tip1Title: 'Bom saber',
    tip1Text: 'Estes sintomas, embora por vezes incómodos, são sinal de que o corpo se está a adaptar ativamente à gravidez.',
    body2: 'O segundo trimestre é muitas vezes o mais confortável, com o aparecimento dos primeiros movimentos do bebé.',
    highlightTitle: 'Os primeiros movimentos',
    highlightText: 'Costumam sentir-se entre as semanas 18 e 22, um pouco mais cedo se não for a sua primeira gravidez.',
    body3: 'O terceiro trimestre prepara o corpo para o parto, com um aumento de peso e um cansaço mais notórios. Podem também surgir contrações de treino (conhecidas como contrações de Braxton Hicks).',
    neutralText: 'Estas contrações são geralmente irregulares e pouco dolorosas; distinguem-se das contrações do trabalho de parto.',
    trimesters: [
      '1.º trimestre: formação dos órgãos',
      '2.º trimestre: primeiros movimentos',
      '3.º trimestre: preparação para o parto',
      'Acompanhamento médico em todas as fases',
    ],
    commonSymptoms: [
      'Náuseas e cansaço, sobretudo no primeiro trimestre',
      'Pontadas abdominais associadas ao alongamento dos ligamentos',
      'Ligeira falta de ar mais para o fim da gravidez',
      'Dificuldades em dormir no final do terceiro trimestre',
    ],
    consultIntro: 'Certos sinais exigem aconselhamento médico rápido, seja qual for o trimestre:',
    urgentSigns: [
      'Hemorragia, mesmo ligeira',
      'Dor abdominal intensa',
      'Ausência de movimentos sentidos',
      'Dores de cabeça fortes ou problemas de visão',
      'Febre fora do comum',
    ],
    tip2Title: 'Bom saber',
    tip2Text: 'Cada trimestre traz as suas próprias mudanças: conhecê-las com antecedência ajuda a viver melhor cada fase, sem substituir o acompanhamento regular com a sua parteira ou o seu médico.',
    shareMessage: 'A sua gravidez, semana a semana — AWA',
  },
  bn: {
    badge: 'গর্ভাবস্থা • সামগ্রিক ধারণা',
    title: 'আপনার গর্ভাবস্থা,\nসপ্তাহে সপ্তাহে',
    metaDuration: 'পড়তে 8 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'প্রথম থেকে তৃতীয় ত্রৈমাসিক পর্যন্ত গুরুত্বপূর্ণ ধাপগুলো, যাতে প্রতিটি পর্যায়ে কী আশা করবেন তা জানতে পারেন।',
    introSecondary: 'প্রতিটি গর্ভাবস্থা নিজের ছন্দে এগোয়: এই মাইলফলকগুলো সাধারণ ধারণা মাত্র এবং একজন নারী থেকে আরেকজনের ক্ষেত্রে ভিন্ন হতে পারে।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'প্রথম ত্রৈমাসিক: ভিত্তি তৈরি',
      'দ্বিতীয় ত্রৈমাসিক: বেশি স্বাচ্ছন্দ্য',
      'তৃতীয় ত্রৈমাসিক: প্রস্তুতির সময়',
      'ত্রৈমাসিক অনুযায়ী প্রধান মাইলফলক',
      'প্রতিটি পর্যায়ের সাধারণ উপসর্গ',
      'কখন দ্রুত চিকিৎসা নেবেন',
      'মূল কথা',
    ],
    body1: 'প্রথম ত্রৈমাসিকে ভিত্তি তৈরি হয়: শিশুর প্রধান অঙ্গগুলো ধীরে ধীরে গঠিত হয়। এই সময়ে ক্লান্তি ও বমি বমি ভাব সাধারণ, তবে নারীভেদে এর মাত্রা অনেক ভিন্ন হয়।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'এই উপসর্গগুলো কখনো কখনো অস্বস্তিকর হলেও এটি ইঙ্গিত দেয় যে শরীর সক্রিয়ভাবে গর্ভাবস্থার সঙ্গে খাপ খাইয়ে নিচ্ছে।',
    body2: 'দ্বিতীয় ত্রৈমাসিক প্রায়ই সবচেয়ে স্বাচ্ছন্দ্যের সময়, যখন শিশুর প্রথম নড়াচড়া টের পাওয়া যায়।',
    highlightTitle: 'প্রথম নড়াচড়া',
    highlightText: 'সাধারণত 18 থেকে 22 সপ্তাহের মধ্যে এগুলো অনুভূত হয়; এটি প্রথম গর্ভাবস্থা না হলে কিছুটা আগেও টের পাওয়া যেতে পারে।',
    body3: 'তৃতীয় ত্রৈমাসিকে শরীর প্রসবের জন্য প্রস্তুত হয়, ওজন বাড়া ও ক্লান্তি আরও স্পষ্ট হয়। অনুশীলনমূলক সংকোচন (ব্র্যাক্সটন হিক্স নামে পরিচিত) দেখা দিতে পারে।',
    neutralText: 'এই সংকোচনগুলো সাধারণত অনিয়মিত এবং খুব বেদনাদায়ক নয়; প্রসববেদনার সংকোচন থেকে এগুলো আলাদা।',
    trimesters: [
      'প্রথম ত্রৈমাসিক: অঙ্গ গঠন',
      'দ্বিতীয় ত্রৈমাসিক: প্রথম নড়াচড়া',
      'তৃতীয় ত্রৈমাসিক: প্রসবের প্রস্তুতি',
      'প্রতিটি পর্যায়ে চিকিৎসাগত ফলো-আপ',
    ],
    commonSymptoms: [
      'বমি বমি ভাব ও ক্লান্তি, বিশেষ করে প্রথম ত্রৈমাসিকে',
      'লিগামেন্ট প্রসারিত হওয়ার কারণে তলপেটে খোঁচা খোঁচা ব্যথা',
      'গর্ভাবস্থার শেষ দিকে সামান্য শ্বাসকষ্ট',
      'তৃতীয় ত্রৈমাসিকের শেষ দিকে ঘুমের সমস্যা',
    ],
    consultIntro: 'ত্রৈমাসিক যেটাই হোক, কিছু লক্ষণে দ্রুত চিকিৎসকের পরামর্শ নেওয়া দরকার:',
    urgentSigns: [
      'রক্তপাত, হালকা হলেও',
      'পেটে তীব্র ব্যথা',
      'কোনো নড়াচড়া অনুভূত না হওয়া',
      'তীব্র মাথাব্যথা বা দৃষ্টির সমস্যা',
      'অস্বাভাবিক জ্বর',
    ],
    tip2Title: 'জেনে রাখা ভালো',
    tip2Text: 'প্রতিটি ত্রৈমাসিক নিজস্ব পরিবর্তন নিয়ে আসে: আগে থেকে সেগুলো জানলে প্রতিটি পর্যায় আরও ভালোভাবে কাটানো যায়, তবে এটি আপনার ধাত্রী বা ডাক্তারের নিয়মিত ফলো-আপের বিকল্প নয়।',
    shareMessage: 'আপনার গর্ভাবস্থা, সপ্তাহে সপ্তাহে — AWA',
  },
  da: {
    badge: 'GRAVIDITET • OVERSIGT',
    title: 'Din graviditet,\nuge for uge',
    metaDuration: '8 min. læsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemset indhold',
    intro: 'De vigtigste milepæle fra første til tredje trimester, så du ved, hvad du kan forvente på hvert trin.',
    introSecondary: 'Hver graviditet følger sin egen rytme: disse pejlemærker er generelle og kan variere fra kvinde til kvinde.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Det første trimester: at lægge fundamentet',
      'Det andet trimester: mere komfort',
      'Det tredje trimester: at gøre sig klar',
      'Vigtige milepæle pr. trimester',
      'Almindelige symptomer på hvert trin',
      'Hvornår du skal søge hjælp hurtigt',
      'Vigtigste pointer',
    ],
    body1: 'Det første trimester lægger fundamentet: alle babyens vigtigste organer dannes gradvist. Det er også en periode, hvor træthed og kvalme er almindelige, i meget forskellig grad fra kvinde til kvinde.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Disse symptomer, selvom de til tider kan være ubehagelige, er et tegn på, at kroppen aktivt tilpasser sig graviditeten.',
    body2: 'Det andet trimester er ofte det mest komfortable, med babyens første bevægelser.',
    highlightTitle: 'De første bevægelser',
    highlightText: 'Disse mærkes typisk mellem uge 18 og 22, lidt tidligere hvis det ikke er din første graviditet.',
    body3: 'Det tredje trimester forbereder kroppen på fødslen med mere mærkbar vægtøgning og træthed. Øveveer (kaldet Braxton Hicks) kan også opstå.',
    neutralText: 'Disse veer er som regel uregelmæssige og ikke særlig smertefulde; de adskiller sig fra fødselsveer.',
    trimesters: [
      '1. trimester: organudvikling',
      '2. trimester: første bevægelser',
      '3. trimester: forberedelse til fødslen',
      'Lægeligt follow-up på hvert trin',
    ],
    commonSymptoms: [
      'Kvalme og træthed, særligt i det første trimester',
      'Bugkramper forbundet med ledbånds udstrækning',
      'Let åndenød senere i graviditeten',
      'Søvnproblemer sidst i tredje trimester',
    ],
    consultIntro: 'Visse tegn kræver hurtig lægehjælp, uanset trimester:',
    urgentSigns: [
      'Blødning, selv let',
      'Intens mavesmerter',
      'Ingen bevægelser mærket',
      'Svær hovedpine eller synsproblemer',
      'Usædvanlig feber',
    ],
    tip2Title: 'Godt at vide',
    tip2Text: 'Hvert trimester bringer sine egne forandringer: at kende dem på forhånd hjælper dig med at gennemgå hvert trin bedre, uden at erstatte regelmæssig opfølgning hos din jordemoder eller læge.',
    shareMessage: 'Din graviditet, uge for uge — AWA',
  },
  sv: {
    badge: 'GRAVIDITET • OVERSIGT',
    title: 'Din graviditet,\nuge for uge',
    metaDuration: '8 min. läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemset indhold',
    intro: 'De vigtigste milepäle fran förste till tredje trimester, så du ved, hvad du kan forvente på hvert trin.',
    introSecondary: 'Hver graviditet fölger sin egen rytme: disse pejlemärker ar generelle och kan variere fran kvinna till kvinde.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Det förste trimester: at lägge fundamentet',
      'Det andet trimester: mere komfort',
      'Det tredje trimester: at göre sig klar',
      'Vigtige milepäle pr. trimester',
      'Almindelige symtom på hvert trin',
      'Hvornår du skal söge hjälp hurtigt',
      'Vigtigste pointer',
    ],
    body1: 'Det förste trimester lägger fundamentet: alla babyens vigtigste organer dannes gradvist. Det ar også en periode, hvor träthed och kvalme ar almindelige, i mycket forskellig grad fran kvinna till kvinde.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Disse symtom, selvom de till tider kan väre ubehagelige, ar et tegn på, at kroppen aktivt tilpasser sig graviditeten.',
    body2: 'Det andet trimester ar ofta det mest komfortable, med babyens förste bevägelser.',
    highlightTitle: 'De förste bevägelser',
    highlightText: 'Disse märkes typisk mellem vecka 18 och 22, lite tidligere hvis det inte ar din förste graviditet.',
    body3: 'Det tredje trimester forbereder kroppen på födslen med mere märkbar vägtögning och träthed. Öveveer (kaldet Braxton Hicks) kan også opstå.',
    neutralText: 'Disse veer ar som regel uregelmässige och inte särlig smertefulde; de adskiller sig fran födselsveer.',
    trimesters: [
      '1. trimester: organudvikling',
      '2. trimester: förste bevägelser',
      '3. trimester: forberedelse till födslen',
      'Lägeligt follow-up på hvert trin',
    ],
    commonSymptoms: [
      'Kvalme och träthed, särligt i det förste trimester',
      'Bugkramper forbundet med ledbånds udsträkning',
      'Let åndenöd senere i graviditeten',
      'Sövnproblemer sidst i tredje trimester',
    ],
    consultIntro: 'Visse tegn kräver hurtig lägehjälp, uanset trimester:',
    urgentSigns: [
      'Blödning, selv let',
      'Intens mavesmerter',
      'Ingen bevägelser märket',
      'Svär hovedpine eller synsproblemer',
      'Usädvanlig feber',
    ],
    tip2Title: 'Godt at vide',
    tip2Text: 'Hvert trimester bringer sine egne forandringer: at kende dem på forhånd hjälper dig med at gennemgå hvert trin bedre, uden at erstatte regelmässig opfölgning hos din jordemoder eller läge.',
    shareMessage: 'Din graviditet, vecka for vecka — AWA',
  },
  nb: {
    badge: 'SVANGERSKAP • OVERSIKT',
    title: 'Svangerskapet ditt,\nuke for uke',
    metaDuration: '8 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'De viktigste milepælene fra første til tredje trimester, slik at du vet hva du kan forvente i hver fase.',
    introSecondary: 'Hvert svangerskap følger sin egen rytme: disse holdepunktene er generelle og kan variere fra kvinne til kvinne.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Første trimester: legge grunnlaget',
      'Andre trimester: mer komfort',
      'Tredje trimester: gjøre seg klar',
      'Viktige milepæler per trimester',
      'Vanlige symptomer i hver fase',
      'Når du bør søke hjelp raskt',
      'Det viktigste å huske',
    ],
    body1: 'Første trimester legger grunnlaget: alle babyens hovedorganer dannes gradvis. Det er også en tid da tretthet og kvalme er vanlig, i svært ulik grad avhengig av kvinnen.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Disse symptomene, selv om de noen ganger er ubehagelige, er et tegn på at kroppen aktivt tilpasser seg svangerskapet.',
    body2: 'Andre trimester er ofte det mest komfortable, med babyens første bevegelser.',
    highlightTitle: 'De første bevegelsene',
    highlightText: 'De kjennes vanligvis mellom uke 18 og 22, litt tidligere hvis dette ikke er det første svangerskapet ditt.',
    body3: 'Tredje trimester forbereder kroppen på fødselen, med mer merkbar vektøkning og tretthet. Øvingsrier (kalt Braxton Hicks) kan også dukke opp.',
    neutralText: 'Disse sammentrekningene er vanligvis uregelmessige og lite smertefulle; de er forskjellige fra fødselsrier.',
    trimesters: [
      '1. trimester: organdannelse',
      '2. trimester: første bevegelser',
      '3. trimester: forberedelse til fødselen',
      'Medisinsk oppfølging i hver fase',
    ],
    commonSymptoms: [
      'Kvalme og tretthet, særlig i første trimester',
      'Napp i magen knyttet til at leddbåndene strekkes',
      'Lett kortpustethet senere i svangerskapet',
      'Søvnproblemer sent i tredje trimester',
    ],
    consultIntro: 'Visse tegn krever rask medisinsk rådgivning, uansett trimester:',
    urgentSigns: [
      'Blødning, selv lett',
      'Intens magesmerte',
      'Ingen bevegelser kjennes',
      'Sterk hodepine eller synsproblemer',
      'Uvanlig feber',
    ],
    tip2Title: 'Godt å vite',
    tip2Text: 'Hvert trimester bringer sine egne endringer: å kjenne dem på forhånd hjelper deg å oppleve hver fase bedre, uten å erstatte den regelmessige oppfølgingen hos jordmoren eller legen din.',
    shareMessage: 'Svangerskapet ditt, uke for uke – AWA',
  },
  pl: {
    badge: 'CIĄŻA • PRZEGLĄD',
    title: 'Twoja ciąża,\ntydzień po tygodniu',
    metaDuration: '8 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Najważniejsze etapy od pierwszego do trzeciego trymestru, abyś wiedziała, czego się spodziewać na każdym etapie.',
    introSecondary: 'Każda ciąża przebiega we własnym rytmie: te punkty odniesienia są ogólne i mogą się różnić u poszczególnych kobiet.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Pierwszy trymestr: kładzenie fundamentów',
      'Drugi trymestr: więcej komfortu',
      'Trzeci trymestr: przygotowania',
      'Najważniejsze etapy w trymestrach',
      'Częste objawy na każdym etapie',
      'Kiedy szybko zgłosić się po pomoc',
      'Najważniejsze wnioski',
    ],
    body1: 'Pierwszy trymestr kładzie fundamenty: stopniowo kształtują się wszystkie główne narządy dziecka. To także czas, gdy częste są zmęczenie i nudności, w bardzo różnym stopniu u różnych kobiet.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Te objawy, choć czasem uciążliwe, są oznaką, że organizm aktywnie przystosowuje się do ciąży.',
    body2: 'Drugi trymestr jest często najwygodniejszy, wtedy pojawiają się pierwsze ruchy dziecka.',
    highlightTitle: 'Pierwsze ruchy',
    highlightText: 'Zwykle czuje się je między 18. a 22. tygodniem, nieco wcześniej, jeśli nie jest to pierwsza ciąża.',
    body3: 'Trzeci trymestr przygotowuje organizm do porodu, z bardziej zauważalnym przyrostem wagi i zmęczeniem. Mogą też pojawić się skurcze przepowiadające (zwane skurczami Braxtona-Hicksa).',
    neutralText: 'Te skurcze są zwykle nieregularne i niezbyt bolesne; różnią się od skurczów porodowych.',
    trimesters: [
      '1. trymestr: formowanie narządów',
      '2. trymestr: pierwsze ruchy',
      '3. trymestr: przygotowanie do porodu',
      'Opieka medyczna na każdym etapie',
    ],
    commonSymptoms: [
      'Nudności i zmęczenie, zwłaszcza w pierwszym trymestrze',
      'Ukłucia w brzuchu związane z rozciąganiem więzadeł',
      'Lekka duszność w późniejszym okresie ciąży',
      'Problemy ze snem pod koniec trzeciego trymestru',
    ],
    consultIntro: 'Niektóre objawy wymagają szybkiej porady medycznej, niezależnie od trymestru:',
    urgentSigns: [
      'Krwawienie, nawet lekkie',
      'Silny ból brzucha',
      'Brak odczuwanych ruchów',
      'Silne bóle głowy lub problemy ze wzrokiem',
      'Nietypowa gorączka',
    ],
    tip2Title: 'Warto wiedzieć',
    tip2Text: 'Każdy trymestr przynosi własne zmiany: znajomość ich z wyprzedzeniem pomaga lepiej przeżywać każdy etap, nie zastępując regularnej opieki położnej lub lekarza.',
    shareMessage: 'Twoja ciąża, tydzień po tygodniu — AWA',
  },
  uk: {
    badge: 'ВАГІТНІСТЬ • ОГЛЯД',
    title: 'Ваша вагітність\nтиждень за тижнем',
    metaDuration: '8 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Основні віхи від першого до третього триместру, щоб ви знали, чого очікувати на кожному етапі.',
    introSecondary: 'Кожна вагітність має власний ритм: ці орієнтири загальні й можуть відрізнятися в різних жінок.',
    contentsTitle: 'У цій статті',
    topics: [
      'Перший триместр: закладання основ',
      'Другий триместр: більше комфорту',
      'Третій триместр: підготовка',
      'Основні віхи за триместрами',
      'Поширені симптоми на кожному етапі',
      'Коли швидко звертатися по допомогу',
      'Головні висновки',
    ],
    body1: 'Перший триместр закладає основи: поступово формуються всі основні органи дитини. Це також час, коли часто трапляються втома й нудота, у дуже різній мірі залежно від жінки.',
    tip1Title: 'Варто знати',
    tip1Text: 'Ці симптоми, хоч і бувають прикрими, свідчать про те, що організм активно пристосовується до вагітності.',
    body2: 'Другий триместр часто найкомфортніший, у цей час з’являються перші рухи дитини.',
    highlightTitle: 'Перші рухи',
    highlightText: 'Їх зазвичай відчувають між 18-м і 22-м тижнем, трохи раніше, якщо це не перша вагітність.',
    body3: 'Третій триместр готує організм до пологів, із помітнішим набором ваги та втомою. Можуть також з’явитися тренувальні перейми (так звані перейми Брекстона-Гікса).',
    neutralText: 'Ці перейми зазвичай нерегулярні й не дуже болісні; вони відрізняються від пологових переймів.',
    trimesters: [
      '1-й триместр: формування органів',
      '2-й триместр: перші рухи',
      '3-й триместр: підготовка до пологів',
      'Медичний нагляд на кожному етапі',
    ],
    commonSymptoms: [
      'Нудота й втома, особливо в першому триместрі',
      'Поколювання в животі, пов’язане з розтягуванням зв’язок',
      'Легка задишка на пізніх термінах вагітності',
      'Проблеми зі сном наприкінці третього триместру',
    ],
    consultIntro: 'Деякі ознаки потребують швидкої медичної поради, незалежно від триместру:',
    urgentSigns: [
      'Кровотеча, навіть легка',
      'Сильний біль у животі',
      'Відсутність відчутих рухів',
      'Сильні головні болі або проблеми із зором',
      'Незвична гарячка',
    ],
    tip2Title: 'Варто знати',
    tip2Text: 'Кожен триместр приносить свої зміни: знаючи їх заздалегідь, ви краще переживете кожен етап, але це не замінює регулярного нагляду в акушерки чи лікаря.',
    shareMessage: 'Ваша вагітність тиждень за тижнем — AWA',
  },
  cs: {
    badge: 'TĚHOTENSTVÍ • PŘEHLED',
    title: 'Vaše těhotenství,\ntýden po týdnu',
    metaDuration: '8 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Klíčové milníky od prvního do třetího trimestru, abyste věděla, co v každé fázi očekávat.',
    introSecondary: 'Každé těhotenství probíhá vlastním rytmem: tyto orientační body jsou obecné a mohou se od ženy k ženě lišit.',
    contentsTitle: 'V tomto článku',
    topics: [
      'První trimestr: pokládání základů',
      'Druhý trimestr: větší pohodlí',
      'Třetí trimestr: příprava',
      'Klíčové milníky podle trimestrů',
      'Časté příznaky v jednotlivých fázích',
      'Kdy vyhledat rychlou péči',
      'Hlavní poznatky',
    ],
    body1: 'První trimestr pokládá základy: postupně se tvoří všechny hlavní orgány miminka. Je to také doba, kdy jsou běžné únava a nevolnost, v různé míře podle ženy.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Tyto příznaky, i když jsou někdy nepříjemné, jsou známkou toho, že se tělo aktivně přizpůsobuje těhotenství.',
    body2: 'Druhý trimestr je často nejpohodlnější, objevují se první pohyby miminka.',
    highlightTitle: 'První pohyby',
    highlightText: 'Obvykle se cítí mezi 18. a 22. týdnem, o něco dříve, pokud nejde o vaše první těhotenství.',
    body3: 'Třetí trimestr připravuje tělo na porod, s výraznějším přibýváním na váze a únavou. Mohou se také objevit cvičné stahy (známé jako Braxton-Hicksovy).',
    neutralText: 'Tyto stahy jsou obvykle nepravidelné a málo bolestivé; liší se od porodních kontrakcí.',
    trimesters: [
      '1. trimestr: tvorba orgánů',
      '2. trimestr: první pohyby',
      '3. trimestr: příprava na porod',
      'Lékařské sledování v každé fázi',
    ],
    commonSymptoms: [
      'Nevolnost a únava, zejména v prvním trimestru',
      'Píchání v břiše spojené s natahováním vazů',
      'Mírná dušnost později v těhotenství',
      'Potíže se spánkem na konci třetího trimestru',
    ],
    consultIntro: 'Některé příznaky vyžadují rychlou lékařskou radu, v kterémkoli trimestru:',
    urgentSigns: [
      'Krvácení, i slabé',
      'Intenzivní bolest břicha',
      'Necítíte žádný pohyb',
      'Silné bolesti hlavy nebo problémy se zrakem',
      'Neobvyklá horečka',
    ],
    tip2Title: 'Stojí za to vědět',
    tip2Text: 'Každý trimestr přináší vlastní změny: znát je předem vám pomůže lépe prožít každou fázi, aniž by to nahrazovalo pravidelné sledování u vaší porodní asistentky nebo lékaře.',
    shareMessage: 'Vaše těhotenství, týden po týdnu — AWA',
  },
  sk: {
    badge: 'TEHOTENSTVO • PREHĽAD',
    title: 'Vaše tehotenstvo,\ntýždeň po týždni',
    metaDuration: '8 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Kľúčové míľniky od prvého po tretí trimester, aby ste vedeli, čo v každej etape očakávať.',
    introSecondary: 'Každé tehotenstvo má svoj rytmus: tieto orientačné body sú všeobecné a môžu sa od ženy k žene líšiť.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Prvý trimester: kladenie základov',
      'Druhý trimester: viac pohodlia',
      'Tretí trimester: príprava',
      'Kľúčové míľniky podľa trimestra',
      'Časté príznaky v každej etape',
      'Kedy rýchlo vyhľadať starostlivosť',
      'Hlavné body',
    ],
    body1: 'Prvý trimester kladie základy: postupne sa tvoria všetky hlavné orgány bábätka. Je to aj obdobie, keď sú časté únava a nevoľnosť, v rôznej miere podľa ženy.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Tieto príznaky, hoci niekedy nepríjemné, sú znakom, že sa telo aktívne prispôsobuje tehotenstvu.',
    body2: 'Druhý trimester je často najpohodlnejší, s objavením sa prvých pohybov bábätka.',
    highlightTitle: 'Prvé pohyby',
    highlightText: 'Zvyčajne sa pociťujú medzi 18. a 22. týždňom, o niečo skôr, ak to nie je vaše prvé tehotenstvo.',
    body3: 'Tretí trimester pripravuje telo na pôrod, s výraznejším prírastkom hmotnosti a únavou. Môžu sa objaviť aj nácvikové sťahy (známe ako Braxtonove-Hicksove).',
    neutralText: 'Tieto sťahy sú zvyčajne nepravidelné a málo bolestivé; líšia sa od pôrodných sťahov.',
    trimesters: [
      '1. trimester: tvorba orgánov',
      '2. trimester: prvé pohyby',
      '3. trimester: príprava na pôrod',
      'Lekárske sledovanie v každej etape',
    ],
    commonSymptoms: [
      'Nevoľnosť a únava, najmä v prvom trimestri',
      'Pichanie v bruchu spojené s naťahovaním väzov',
      'Mierna dýchavičnosť v neskoršom štádiu tehotenstva',
      'Problémy so spánkom na konci tretieho trimestra',
    ],
    consultIntro: 'Niektoré znaky vyžadujú rýchlu lekársku radu, bez ohľadu na trimester:',
    urgentSigns: [
      'Krvácanie, aj slabé',
      'Intenzívna bolesť brucha',
      'Necítite žiadny pohyb',
      'Silné bolesti hlavy alebo problémy so zrakom',
      'Nezvyčajná horúčka',
    ],
    tip2Title: 'Stojí za to vedieť',
    tip2Text: 'Každý trimester prináša svoje zmeny: poznať ich vopred vám pomôže lepšie prežiť každú etapu, bez nahradenia pravidelného sledovania u pôrodnej asistentky alebo lekára.',
    shareMessage: 'Vaše tehotenstvo, týždeň po týždni — AWA',
  },
  hu: {
    badge: 'TERHESSÉG • ÁTTEKINTÉS',
    title: 'A terhességed,\nhétről hétre',
    metaDuration: '8 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'A legfontosabb mérföldkövek az elsőtől a harmadik trimeszterig, hogy tudd, mire számíts az egyes szakaszokban.',
    introSecondary: 'Minden terhességnek megvan a saját ritmusa: ezek a támpontok általánosak, és nőnként eltérhetnek.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Az első trimeszter: az alapok lerakása',
      'A második trimeszter: nagyobb kényelem',
      'A harmadik trimeszter: felkészülés',
      'Kulcsfontosságú mérföldkövek trimeszterenként',
      'Gyakori tünetek minden szakaszban',
      'Mikor kérj gyorsan ellátást',
      'Legfontosabb tudnivalók',
    ],
    body1: 'Az első trimeszter lerakja az alapokat: a baba összes fő szerve fokozatosan kialakul. Ez az az időszak is, amikor a fáradtság és a hányinger gyakori, nőnként nagyon eltérő mértékben.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'Ezek a tünetek, bár néha kellemetlenek, annak jelei, hogy a test aktívan alkalmazkodik a terhességhez.',
    body2: 'A második trimeszter gyakran a legkényelmesebb, a baba első mozgásainak megjelenésével.',
    highlightTitle: 'Az első mozgások',
    highlightText: 'Általában a 18. és 22. hét között érezhetők, kicsit korábban, ha nem az első terhességed.',
    body3: 'A harmadik trimeszter a szülésre készíti fel a testet, szembetűnőbb súlygyarapodással és fáradtsággal. Gyakorló összehúzódások (Braxton Hicks-féle) is megjelenhetnek.',
    neutralText: 'Ezek az összehúzódások általában szabálytalanok és kevéssé fájdalmasak; különböznek a szülési fájásoktól.',
    trimesters: [
      '1. trimeszter: a szervek kialakulása',
      '2. trimeszter: az első mozgások',
      '3. trimeszter: felkészülés a szülésre',
      'Orvosi követés minden szakaszban',
    ],
    commonSymptoms: [
      'Hányinger és fáradtság, főként az első trimeszterben',
      'Hasi szúrások, amelyek a szalagok nyúlásával függnek össze',
      'Enyhe légszomj a terhesség későbbi szakaszában',
      'Alvászavar a harmadik trimeszter végén',
    ],
    consultIntro: 'Bizonyos jelek gyors orvosi tanácsot igényelnek, bármelyik trimeszterben:',
    urgentSigns: [
      'Vérzés, még ha enyhe is',
      'Intenzív hasi fájdalom',
      'Nem érzel mozgást',
      'Erős fejfájás vagy látászavarok',
      'Szokatlan láz',
    ],
    tip2Title: 'Érdemes tudni',
    tip2Text: 'Minden trimeszter megvan a maga változásaival: ha előre ismered őket, könnyebben éled meg az egyes szakaszokat, a szülésznőddel vagy orvosoddal való rendszeres követés helyettesítése nélkül.',
    shareMessage: 'A terhességed, hétről hétre — AWA',
  },
  ro: {
    badge: 'SARCINĂ • PRIVIRE DE ANSAMBLU',
    title: 'Sarcina ta,\nsăptămână după săptămână',
    metaDuration: '8 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Reperele-cheie, de la primul la al treilea trimestru, pentru a ști la ce să te aștepți în fiecare etapă.',
    introSecondary: 'Fiecare sarcină își urmează propriul ritm: aceste repere sunt generale și pot varia de la o femeie la alta.',
    contentsTitle: 'În acest articol',
    topics: [
      'Primul trimestru: punerea bazelor',
      'Al doilea trimestru: mai mult confort',
      'Al treilea trimestru: pregătirea',
      'Reperele-cheie pe trimestre',
      'Simptome frecvente în fiecare etapă',
      'Când să ceri rapid îngrijiri',
      'Ce să reții',
    ],
    body1: 'Primul trimestru pune bazele: toate organele principale ale bebelușului se formează progresiv. Este și o perioadă în care oboseala și greața sunt frecvente, în grade foarte diferite în funcție de femeie.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Aceste simptome, deși uneori neplăcute, sunt un semn că organismul se adaptează activ la sarcină.',
    body2: 'Al doilea trimestru este adesea cel mai confortabil, cu apariția primelor mișcări ale bebelușului.',
    highlightTitle: 'Primele mișcări',
    highlightText: 'Ele sunt simțite de obicei între săptămânile 18 și 22, puțin mai devreme dacă nu este prima ta sarcină.',
    body3: 'Al treilea trimestru pregătește corpul pentru naștere, cu o creștere în greutate și o oboseală mai vizibile. Pot apărea și contracții de antrenament (cunoscute ca Braxton Hicks).',
    neutralText: 'Aceste contracții sunt de obicei neregulate și puțin dureroase; ele diferă de contracțiile de travaliu.',
    trimesters: [
      'Trimestrul 1: formarea organelor',
      'Trimestrul 2: primele mișcări',
      'Trimestrul 3: pregătirea pentru naștere',
      'Urmărire medicală în fiecare etapă',
    ],
    commonSymptoms: [
      'Greață și oboseală, mai ales în primul trimestru',
      'Junghiuri abdominale legate de întinderea ligamentelor',
      'Ușoară lipsă de aer spre sfârșitul sarcinii',
      'Probleme de somn la sfârșitul celui de-al treilea trimestru',
    ],
    consultIntro: 'Anumite semne cer un sfat medical prompt, indiferent de trimestru:',
    urgentSigns: [
      'Sângerare, chiar și ușoară',
      'Durere abdominală intensă',
      'Nicio mișcare simțită',
      'Dureri de cap severe sau probleme de vedere',
      'Febră neobișnuită',
    ],
    tip2Title: 'Bine de știut',
    tip2Text: 'Fiecare trimestru aduce propriile schimbări: cunoașterea lor din timp te ajută să trăiești mai bine fiecare etapă, fără a înlocui urmărirea regulată cu moașa sau cu medicul tău.',
    shareMessage: 'Sarcina ta, săptămână după săptămână — AWA',
  },
  bg: {
    badge: 'БРЕМЕННОСТ • ПРЕГЛЕД',
    title: 'Бременността ти,\nседмица по седмица',
    metaDuration: '8 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Основните етапи от първия до третия триместър, за да знаеш какво да очакваш във всеки момент.',
    introSecondary: 'Всяка бременност следва собствен ритъм: тези ориентири са общи и могат да варират от жена на жена.',
    contentsTitle: 'В тази статия',
    topics: [
      'Първият триместър: полагане на основите',
      'Вторият триместър: повече комфорт',
      'Третият триместър: подготовка',
      'Основни етапи по триместри',
      'Чести симптоми на всеки етап',
      'Кога да потърсиш бърза грижа',
      'Какво да запомниш',
    ],
    body1: 'Първият триместър полага основите: всички основни органи на бебето се оформят постепенно. Това е и период, в който умората и гаденето са чести, в много различна степен според жената.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Тези симптоми, макар понякога да са неприятни, са знак, че тялото активно се приспособява към бременността.',
    body2: 'Вторият триместър често е най-комфортният, като се появяват първите движения на бебето.',
    highlightTitle: 'Първите движения',
    highlightText: 'Обикновено се усещат между 18-а и 22-ра седмица, малко по-рано, ако това не е първата ти бременност.',
    body3: 'Третият триместър подготвя тялото за раждането, с по-забележимо наддаване на тегло и умора. Могат да се появят и тренировъчни контракции (известни като контракции на Брекстън-Хикс).',
    neutralText: 'Тези контракции обикновено са нередовни и малко болезнени; те се различават от родовите контракции.',
    trimesters: [
      '1-ви триместър: образуване на органите',
      '2-ри триместър: първи движения',
      '3-ти триместър: подготовка за раждането',
      'Медицинско проследяване на всеки етап',
    ],
    commonSymptoms: [
      'Гадене и умора, особено през първия триместър',
      'Убождания в корема, свързани с разтягането на връзките',
      'Лек задух по-късно в бременността',
      'Затруднения със съня в края на третия триместър',
    ],
    consultIntro: 'Някои признаци изискват бърз медицински съвет, независимо от триместъра:',
    urgentSigns: [
      'Кървене, дори леко',
      'Силна коремна болка',
      'Липса на усетени движения',
      'Силно главоболие или проблеми със зрението',
      'Необичайна температура',
    ],
    tip2Title: 'Добре е да знаеш',
    tip2Text: 'Всеки триместър носи свои промени: да ги знаеш предварително ти помага да преживееш по-добре всеки етап, без да замества редовното проследяване при акушерката или лекаря ти.',
    shareMessage: 'Бременността ти, седмица по седмица — AWA',
  },
  sr: {
    badge: 'ТРУДНОЋА • ПРЕГЛЕД',
    title: 'Твоја трудноћа,\nнедељу по недељу',
    metaDuration: '8 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Кључне фазе од првог до трећег триместра, да знаш шта да очекујеш у сваком тренутку.',
    introSecondary: 'Свака трудноћа следи сопствени ритам: ови оријентири су општи и могу варирати од жене до жене.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Први триместар: полагање темеља',
      'Други триместар: више удобности',
      'Трећи триместар: припрема',
      'Кључне фазе по триместрима',
      'Чести симптоми у свакој фази',
      'Када потражити брзу негу',
      'Шта да запамтиш',
    ],
    body1: 'Први триместар полаже темеље: сви главни органи бебе формирају се постепено. То је и период у којем су умор и мучнина чести, у веома различитој мери зависно од жене.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Ови симптоми, мада понекад непријатни, знак су да се тело активно прилагођава трудноћи.',
    body2: 'Други триместар је често најудобнији, са појавом првих покрета бебе.',
    highlightTitle: 'Први покрети',
    highlightText: 'Обично се осећају између 18. и 22. недеље, нешто раније ако ово није твоја прва трудноћа.',
    body3: 'Трећи триместар припрема тело за порођај, уз приметније добијање на тежини и умор. Могу се појавити и тренажне контракције (познате као Брекстон-Хиксове).',
    neutralText: 'Ове контракције су обично нередовне и мало болне; разликују се од порођајних контракција.',
    trimesters: [
      '1. триместар: формирање органа',
      '2. триместар: први покрети',
      '3. триместар: припрема за порођај',
      'Медицинско праћење у свакој фази',
    ],
    commonSymptoms: [
      'Мучнина и умор, нарочито у првом триместру',
      'Убадања у стомаку везана за растезање веза',
      'Благ недостатак даха касније у трудноћи',
      'Тешкоће са спавањем у касном трећем триместру',
    ],
    consultIntro: 'Одређени знаци захтевају брзи медицински савет, без обзира на триместар:',
    urgentSigns: [
      'Крварење, чак и лагано',
      'Јак бол у стомаку',
      'Не осећају се покрети',
      'Јака главобоља или проблеми са видом',
      'Необична температура',
    ],
    tip2Title: 'Добро је знати',
    tip2Text: 'Сваки триместар доноси своје промене: познавање унапред помаже ти да боље проживиш сваку фазу, без замене редовног праћења код бабице или лекара.',
    shareMessage: 'Твоја трудноћа, недељу по недељу — AWA',
  },
  hr: {
    badge: 'TRUDNOĆA • PREGLED',
    title: 'Tvoja trudnoća,\ntjedan po tjedan',
    metaDuration: '8 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Ključne prekretnice od prvog do trećeg trimestra, kako bi znala što očekivati u svakoj fazi.',
    introSecondary: 'Svaka trudnoća slijedi vlastiti ritam: ovi su orijentiri opći i mogu se razlikovati od žene do žene.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Prvi trimestar: postavljanje temelja',
      'Drugi trimestar: više ugode',
      'Treći trimestar: priprema',
      'Ključne prekretnice po trimestrima',
      'Česti simptomi u svakoj fazi',
      'Kada brzo zatražiti skrb',
      'Ključne poruke',
    ],
    body1: 'Prvi trimestar postavlja temelje: svi glavni organi bebe postupno se oblikuju. To je i vrijeme kad su umor i mučnina česti, u vrlo različitoj mjeri ovisno o ženi.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Ti su simptomi, iako ponekad neugodni, znak da se tijelo aktivno prilagođava trudnoći.',
    body2: 'Drugi trimestar često je najugodniji, s pojavom prvih bebinih pokreta.',
    highlightTitle: 'Prvi pokreti',
    highlightText: 'Obično se osjećaju između 18. i 22. tjedna, nešto ranije ako ovo nije tvoja prva trudnoća.',
    body3: 'Treći trimestar priprema tijelo za porod, uz izraženije dobivanje na težini i umor. Mogu se pojaviti i pripremne kontrakcije (poznate kao Braxton Hicksove).',
    neutralText: 'Te su kontrakcije obično nepravilne i malo bolne; razlikuju se od trudova.',
    trimesters: [
      '1. trimestar: oblikovanje organa',
      '2. trimestar: prvi pokreti',
      '3. trimestar: priprema za porod',
      'Medicinsko praćenje u svakoj fazi',
    ],
    commonSymptoms: [
      'Mučnina i umor, osobito u prvom trimestru',
      'Probadanje u trbuhu zbog rastezanja ligamenata',
      'Blagi nedostatak zraka kasnije u trudnoći',
      'Poteškoće sa spavanjem pred kraj trećeg trimestra',
    ],
    consultIntro: 'Određeni znakovi zahtijevaju žuran liječnički savjet, bez obzira na trimestar:',
    urgentSigns: [
      'Krvarenje, čak i slabo',
      'Jaka bol u trbuhu',
      'Izostanak osjeta pokreta',
      'Jake glavobolje ili problemi s vidom',
      'Neobična vrućica',
    ],
    tip2Title: 'Dobro je znati',
    tip2Text: 'Svaki trimestar donosi vlastite promjene: poznavanje unaprijed pomaže ti bolje proživjeti svaku fazu, bez zamjene redovitog praćenja kod babice ili liječnika.',
    shareMessage: 'Tvoja trudnoća, tjedan po tjedan — AWA',
  },
  bs: {
    badge: 'TRUDNOĆA • PREGLED',
    title: 'Tvoja trudnoća,\nsedmicu po sedmicu',
    metaDuration: '8 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Ključne prekretnice od prvog do trećeg trimestra, kako bi znala što očekivati u svakoj fazi.',
    introSecondary: 'Svaka trudnoća slijedi vlastiti ritam: ovi su orijentiri opći i mogu se razlikovati od žene do žene.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Prvi trimestar: postavljanje temelja',
      'Drugi trimestar: više ugode',
      'Treći trimestar: priprema',
      'Ključne prekretnice po trimestrima',
      'Česti simptomi u svakoj fazi',
      'Kada brzo zatražiti skrb',
      'Ključne poruke',
    ],
    body1: 'Prvi trimestar postavlja temelje: svi glavni organi bebe postupno se oblikuju. To je i vrijeme kad su umor i mučnina česti, u vrlo različitoj mjeri ovisno o ženi.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Ti su simptomi, iako ponekad neugodni, znak da se tijelo aktivno prilagođava trudnoći.',
    body2: 'Drugi trimestar često je najugodniji, s pojavom prvih bebinih pokreta.',
    highlightTitle: 'Prvi pokreti',
    highlightText: 'Obično se osjećaju između 18. i 22. sedmice, nešta ranije ako ovo nije tvoja prva trudnoća.',
    body3: 'Treći trimestar priprema tijelo za porođaj, uz izraženije dobivanje na težini i umor. Mogu se pojaviti i pripremne kontrakcije (poznate kao Braxton Hicksove).',
    neutralText: 'Te su kontrakcije obično nepravilne i malo bolne; razlikuju se od trudova.',
    trimesters: [
      '1. trimestar: oblikovanje organa',
      '2. trimestar: prvi pokreti',
      '3. trimestar: priprema za porođaj',
      'Medicinsko praćenje u svakoj fazi',
    ],
    commonSymptoms: [
      'Mučnina i umor, osobito u prvom trimestru',
      'Probadanje u trbuhu zbog rastezanja ligamenata',
      'Blagi nedostatak zraka kasnije u trudnoći',
      'Poteškoće sa spavanjem pred kraj trećeg trimestra',
    ],
    consultIntro: 'Određeni znakovi zahtijevaju žuran ljekarski savjet, bez obzira na trimestar:',
    urgentSigns: [
      'Krvarenje, čak i slabo',
      'Jaka bol u trbuhu',
      'Izostanak osjeta pokreta',
      'Jake glavobolje ili problemi s vidom',
      'Neobična vrućica',
    ],
    tip2Title: 'Dobro je znati',
    tip2Text: 'Svaki trimestar donosi vlastite promjene: poznavanje unaprijed pomaže ti bolje proživjeti svaku fazu, bez zamjene redovitog praćenja kod babice ili ljekara.',
    shareMessage: 'Tvoja trudnoća, sedmicu po sedmicu — AWA',
  },
  sl: {
    badge: 'NOSEČNOST • PREGLED',
    title: 'Tvoja nosečnost,\nteden za tednom',
    metaDuration: '8 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Ključni mejniki od prvega do tretjega trimesečja, da veš, kaj pričakovati v vsaki fazi.',
    introSecondary: 'Vsaka nosečnost sledi lastnemu ritmu: ti orientirji so splošni in se lahko razlikujejo od ženske do ženske.',
    contentsTitle: 'V tem članku',
    topics: [
      'Prvo trimesečje: postavljanje temeljev',
      'Drugo trimesečje: več udobja',
      'Tretje trimesečje: priprava',
      'Ključni mejniki po trimesečjih',
      'Pogosti simptomi v vsaki fazi',
      'Kdaj hitro poiskati oskrbo',
      'Ključna sporočila',
    ],
    body1: 'Prvo trimesečje postavlja temelje: vsi glavni organi dojenčka se postopoma oblikujejo. To je tudi čas, ko sta utrujenost in slabost pogosta, v zelo različni meri glede na žensko.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Ti simptomi, čeprav so včasih neprijetni, so znak, da se telo aktivno prilagaja nosečnosti.',
    body2: 'Drugo trimesečje je pogosto najprijetnejše, s pojavom prvih dojenčkovih gibov.',
    highlightTitle: 'Prvi gibi',
    highlightText: 'Običajno se čutijo med 18. in 22. tednom, nekoliko prej, če to ni tvoja prva nosečnost.',
    body3: 'Tretje trimesečje pripravlja telo na porod, z izrazitejšim pridobivanjem teže in utrujenostjo. Pojavijo se lahko tudi pripravljalni popadki (znani kot Braxton Hicksovi).',
    neutralText: 'Ti popadki so običajno neredni in malo boleči; razlikujejo se od porodnih popadkov.',
    trimesters: [
      '1. trimesečje: oblikovanje organov',
      '2. trimesečje: prvi gibi',
      '3. trimesečje: priprava na porod',
      'Zdravniško spremljanje v vsaki fazi',
    ],
    commonSymptoms: [
      'Slabost in utrujenost, zlasti v prvem trimesečju',
      'Zbadanje v trebuhu zaradi raztezanja ligamentov',
      'Blago pomanjkanje zraka pozneje v nosečnosti',
      'Težave s spanjem pred koncem tretjega trimesečja',
    ],
    consultIntro: 'Določeni znaki zahtevajo hiter zdravniški nasvet, ne glede na trimesečje:',
    urgentSigns: [
      'Krvavitev, tudi šibka',
      'Huda bolečina v trebuhu',
      'Izostanek občutka gibov',
      'Hudi glavoboli ali težave z vidom',
      'Nenavadna vročina',
    ],
    tip2Title: 'Vredno vedeti',
    tip2Text: 'Vsako trimesečje prinaša svoje spremembe: poznavanje vnaprej ti pomaga bolje doživeti vsako fazo, brez nadomeščanja rednega spremljanja pri babici ali zdravniku.',
    shareMessage: 'Tvoja nosečnost, teden za tednom — AWA',
  },
  ne: {
    badge: 'गर्भावस्था • सिंहावलोकन',
    title: 'तपाईंको गर्भावस्था,\nहप्ता-हप्ता',
    metaDuration: '8 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'पहिलोदेखि तेस्रो त्रैमासिकसम्मका मुख्य माइलस्टोनहरू, ताकि तपाईं हरेक चरणमा के अपेक्षा गर्ने जान्नुहोस्।',
    introSecondary: 'हरेक गर्भावस्थाले आफ्नै लय पछ्याउँछ: यी सन्दर्भ बिन्दुहरू सामान्य हुन् र महिलैपिच्छे फरक हुन सक्छन्।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'पहिलो त्रैमासिक: आधार बनाउँदै',
      'दोस्रो त्रैमासिक: बढी सहजता',
      'तेस्रो त्रैमासिक: तयार हुँदै',
      'त्रैमासिकअनुसार मुख्य माइलस्टोनहरू',
      'हरेक चरणमा सामान्य लक्षणहरू',
      'हेरचाह छिटो कहिले खोज्ने',
      'मुख्य कुराहरू',
    ],
    body1: 'पहिलो त्रैमासिकले आधार बनाउँछ: शिशुका सबै मुख्य अङ्गहरू क्रमशः बन्छन्। यो थकान र वाकवाकी सामान्य हुने समय पनि हो, महिलाअनुसार निकै फरक मात्रामा।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'यी लक्षणहरू, कहिलेकाहीँ असहज भए पनि, शरीर गर्भावस्थासँग सक्रिय रूपमा अनुकूल हुँदै छ भन्ने संकेत हुन्।',
    body2: 'दोस्रो त्रैमासिक प्रायः सबैभन्दा सहज हुन्छ, शिशुको पहिलो चाल देखिन थाल्छ।',
    highlightTitle: 'पहिलो चालहरू',
    highlightText: 'यी सामान्यतया हप्ता 18 र 22 बीच महसुस हुन्छन्, यो पहिलो गर्भावस्था होइन भने अलिक चाँडो।',
    body3: 'तेस्रो त्रैमासिकले शरीरलाई प्रसवका लागि तयार पार्छ, बढी स्पष्ट तौल वृद्धि र थकानसहित। अभ्यास खुम्चाइहरू (ब्राक्सटन हिक्स भनिने) पनि देखिन सक्छन्।',
    neutralText: 'यी खुम्चाइहरू सामान्यतया अनियमित र कम दुखाइका हुन्छन्; ती प्रसव पीडाको खुम्चाइभन्दा फरक हुन्छन्।',
    trimesters: [
      'पहिलो त्रैमासिक: अङ्गहरूको निर्माण',
      'दोस्रो त्रैमासिक: पहिलो चालहरू',
      'तेस्रो त्रैमासिक: जन्मको तयारी',
      'हरेक चरणमा चिकित्सकीय फलोअप',
    ],
    commonSymptoms: [
      'वाकवाकी र थकान, विशेष गरी पहिलो त्रैमासिकमा',
      'लिगामेन्ट तानिनेसँग जोडिएको पेटको चिमोटाइ',
      'गर्भावस्थाको पछिल्लो चरणमा हल्का सास फेर्न गाह्रो',
      'तेस्रो त्रैमासिकको अन्त्यतिर निद्राको समस्या',
    ],
    consultIntro: 'केही संकेतहरूले, त्रैमासिक जुनसुकै भए पनि, छिटो चिकित्सकीय सल्लाह चाहिन्छ:',
    urgentSigns: [
      'रक्तस्राव, हल्का भए पनि',
      'तीव्र पेटको दुखाइ',
      'कुनै चाल महसुस नहुनु',
      'गम्भीर टाउको दुखाइ वा दृष्टिको समस्या',
      'असामान्य ज्वरो',
    ],
    tip2Title: 'जान्न लायक',
    tip2Text: 'हरेक त्रैमासिकले आफ्नै परिवर्तन ल्याउँछ: तिनलाई पहिल्यै जान्नाले तपाईंको सुँडेनी वा चिकित्सकसँगको नियमित फलोअपको स्थान नलिईकन हरेक चरण राम्ररी बिताउन मद्दत गर्छ।',
    shareMessage: 'तपाईंको गर्भावस्था, हप्ता-हप्ता — AWA',
  },
  si: {
    badge: 'ගර්භණී කාලය • දළ විශ්ලේෂණය',
    title: 'ඔබේ ගර්භණී කාලය,\nසතියෙන් සතිය',
    metaDuration: 'කියවීමට මිනිත්තු 8',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'පළමු සිට තෙවන ත්‍රෛමාසිකය දක්වා ප්‍රධාන අවධි, එබැවින් ඔබ සෑම අවධියකම අපේක්ෂා කළ යුත්ත දැනගනී.',
    introSecondary: 'සෑම ගර්භණී කාලයක්ම තමන්ගේම රිද්මයක් අනුගමනය කරයි: මෙම යොමු සාමාන්‍ය වන අතර කාන්තාවෙන් කාන්තාවට වෙනස් විය හැක.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'පළමු ත්‍රෛමාසිකය: අඩිතාලම දැමීම',
      'දෙවන ත්‍රෛමාසිකය: වැඩි සුවපහසුව',
      'තෙවන ත්‍රෛමාසිකය: සූදානම් වීම',
      'ත්‍රෛමාසිකය අනුව ප්‍රධාන අවධි',
      'සෑම අවධියකම පොදු රෝග ලක්ෂණ',
      'කඩිනමින් සත්කාර ලබාගත යුත්තේ කවදාද',
      'ප්‍රධාන කරුණු',
    ],
    body1: 'පළමු ත්‍රෛමාසිකය අඩිතාලම දමයි: දරුවාගේ සියලුම ප්‍රධාන අවයව ක්‍රමයෙන් සෑදේ. මෙය වෙහෙස සහ ඔක්කාරය පොදු වන කාලයක්ද වන අතර, කාන්තාව අනුව ඉතා වෙනස් මට්ටම්වලට.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'මෙම රෝග ලක්ෂණ, සමහර විට අපහසු වුවද, ශරීරය ගර්භණී කාලයට සක්‍රීයව අනුවර්තනය වන බවට සලකුණකි.',
    body2: 'දෙවන ත්‍රෛමාසිකය බොහෝ විට වඩාත්ම සුවපහසු එක වන අතර, දරුවාගේ පළමු චලනයන් දිස්වේ.',
    highlightTitle: 'පළමු චලනයන්',
    highlightText: 'මේවා සාමාන්‍යයෙන් 18 වන සහ 22 වන සති අතර දැනේ, මෙය ඔබේ පළමු ගර්භණී කාලය නොවේ නම් ටිකක් කලින්.',
    body3: 'තෙවන ත්‍රෛමාසිකය ප්‍රසූතිය සඳහා ශරීරය සූදානම් කරන අතර, වඩා කැපී පෙනෙන බර වැඩිවීමක් සහ වෙහෙසක් සමඟ. පුහුණු සංකෝචන (බ්‍රැක්ස්ටන් හික්ස් ලෙස හැඳින්වෙන) ද දිස්විය හැක.',
    neutralText: 'මෙම සංකෝචන සාමාන්‍යයෙන් අක්‍රමවත් සහ එතරම් වේදනාකාරී නොවේ; ඒවා ප්‍රසව වේදනාවේ සංකෝචනවලින් වෙනස් වේ.',
    trimesters: [
      '1 වන ත්‍රෛමාසිකය: අවයව සෑදීම',
      '2 වන ත්‍රෛමාසිකය: පළමු චලනයන්',
      '3 වන ත්‍රෛමාසිකය: උපතට සූදානම් වීම',
      'සෑම අවධියකම වෛද්‍ය පසු විපරම',
    ],
    commonSymptoms: [
      'ඔක්කාරය සහ වෙහෙස, විශේෂයෙන් පළමු ත්‍රෛමාසිකයේ',
      'බන්ධනී දිගු වීමට සම්බන්ධ උදර පිරිමැදීම්',
      'ගර්භණී කාලයේ පසුව සුළු හුස්ම හිරවීම',
      'ප්‍රමාද තෙවන ත්‍රෛමාසිකයේ නින්ද ගැටලු',
    ],
    consultIntro: 'සමහර සලකුණු, ත්‍රෛමාසිකය කුමක් වුවත්, කඩිනම් වෛද්‍ය උපදෙස් ඉල්ලා සිටී:',
    urgentSigns: [
      'සැහැල්ලු වුවද, ලේ ගැලීම',
      'දැඩි උදර වේදනාව',
      'චලනයක් නොදැනීම',
      'දැඩි හිසරදය හෝ දෘෂ්ටි ගැටලු',
      'අසාමාන්‍ය උණ',
    ],
    tip2Title: 'දැනගත යුතු දේ',
    tip2Text: 'සෑම ත්‍රෛමාසිකයක්ම තමන්ගේම වෙනස්කම් ගෙන එයි: ඒවා කල්තියා දැනගැනීම ඔබේ ප්‍රසව හෙදිය හෝ වෛද්‍යවරයා සමඟ නිතිපතා පසු විපරම් ප්‍රතිස්ථාපනය නොකර, සෑම අවධියක්ම වඩා හොඳින් අත්විඳීමට ඔබට උපකාරී වේ.',
    shareMessage: 'ඔබේ ගර්භණී කාලය, සතියෙන් සතිය — AWA',
  },
  th: {
    badge: 'การตั้งครรภ์ • ภาพรวม',
    title: 'การตั้งครรภ์ของคุณ\nทีละสัปดาห์',
    metaDuration: 'อ่าน 8 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'หมุดหมายสำคัญตั้งแต่ไตรมาสแรกถึงไตรมาสที่สาม เพื่อให้คุณรู้ว่าควรคาดหวังอะไรในแต่ละระยะ',
    introSecondary: 'การตั้งครรภ์แต่ละครั้งมีจังหวะของตัวเอง: เกณฑ์เหล่านี้เป็นเกณฑ์ทั่วไปและอาจต่างกันในผู้หญิงแต่ละคน',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ไตรมาสแรก: วางรากฐาน',
      'ไตรมาสที่สอง: สบายมากขึ้น',
      'ไตรมาสที่สาม: เตรียมความพร้อม',
      'หมุดหมายสำคัญแต่ละไตรมาส',
      'อาการที่พบบ่อยในแต่ละระยะ',
      'เมื่อไรควรรีบไปพบแพทย์',
      'ประเด็นสำคัญ',
    ],
    body1: 'ไตรมาสแรกวางรากฐาน: อวัยวะหลักทั้งหมดของทารกค่อย ๆ ก่อตัวขึ้น เป็นช่วงที่ความเหนื่อยล้าและคลื่นไส้พบบ่อยด้วย ในระดับที่ต่างกันมากตามผู้หญิงแต่ละคน',
    tip1Title: 'ควรรู้',
    tip1Text: 'อาการเหล่านี้แม้บางครั้งจะไม่สบาย แต่เป็นสัญญาณว่าร่างกายกำลังปรับตัวกับการตั้งครรภ์อย่างแข็งขัน',
    body2: 'ไตรมาสที่สองมักสบายที่สุด โดยการเคลื่อนไหวครั้งแรกของทารกเริ่มปรากฏ',
    highlightTitle: 'การเคลื่อนไหวครั้งแรก',
    highlightText: 'มักรู้สึกระหว่างสัปดาห์ที่ 18 ถึง 22 เร็วขึ้นเล็กน้อยหากไม่ใช่การตั้งครรภ์ครั้งแรก',
    body3: 'ไตรมาสที่สามเตรียมร่างกายสำหรับการคลอด โดยน้ำหนักขึ้นและความเหนื่อยล้าชัดเจนขึ้น อาจมีการบีบตัวของมดลูกเตรียมคลอด (เรียกว่า แบรกซ์ตันฮิกส์) ด้วย',
    neutralText: 'การบีบตัวเหล่านี้มักไม่สม่ำเสมอและเจ็บไม่มาก ต่างจากการบีบตัวของมดลูกขณะเจ็บครรภ์คลอด',
    trimesters: [
      'ไตรมาสที่ 1: การก่อตัวของอวัยวะ',
      'ไตรมาสที่ 2: การเคลื่อนไหวครั้งแรก',
      'ไตรมาสที่ 3: เตรียมคลอด',
      'การติดตามทางการแพทย์ในทุกระยะ',
    ],
    commonSymptoms: [
      'คลื่นไส้และเหนื่อยล้า โดยเฉพาะในไตรมาสแรก',
      'อาการเสียดท้องจากการยืดของเอ็นยึด',
      'หายใจลำบากเล็กน้อยในช่วงหลังของการตั้งครรภ์',
      'นอนหลับยากช่วงปลายไตรมาสที่สาม',
    ],
    consultIntro: 'สัญญาณบางอย่างต้องขอคำแนะนำทางการแพทย์โดยเร็ว ไม่ว่าจะอยู่ในไตรมาสใด:',
    urgentSigns: [
      'เลือดออก แม้เพียงเล็กน้อย',
      'ปวดท้องรุนแรง',
      'ไม่รู้สึกถึงการเคลื่อนไหว',
      'ปวดหัวรุนแรงหรือมีปัญหาการมองเห็น',
      'ไข้ที่ผิดปกติ',
    ],
    tip2Title: 'ควรรู้',
    tip2Text: 'แต่ละไตรมาสมีการเปลี่ยนแปลงของตัวเอง: การรู้ล่วงหน้าช่วยให้คุณผ่านแต่ละระยะได้ดีขึ้น โดยไม่ได้ทดแทนการตรวจติดตามสม่ำเสมอกับผดุงครรภ์หรือแพทย์ของคุณ',
    shareMessage: 'การตั้งครรภ์ของคุณทีละสัปดาห์ — AWA',
  },
  vi: {
    badge: 'THAI KỲ • TỔNG QUAN',
    title: 'Thai kỳ của bạn,\ntừng tuần một',
    metaDuration: '8 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Các cột mốc chính từ tam cá nguyệt thứ nhất đến thứ ba, để bạn biết điều gì sẽ đến ở mỗi giai đoạn.',
    introSecondary: 'Mỗi thai kỳ đi theo nhịp điệu riêng: những mốc này mang tính chung và có thể khác nhau giữa từng phụ nữ.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Tam cá nguyệt thứ nhất: đặt nền móng',
      'Tam cá nguyệt thứ hai: thoải mái hơn',
      'Tam cá nguyệt thứ ba: chuẩn bị sẵn sàng',
      'Các cột mốc chính theo từng tam cá nguyệt',
      'Các triệu chứng thường gặp ở mỗi giai đoạn',
      'Khi nào nên tìm sự chăm sóc nhanh chóng',
      'Những điểm chính cần nhớ',
    ],
    body1: 'Tam cá nguyệt thứ nhất đặt nền móng: tất cả các cơ quan chính của em bé dần hình thành. Đây cũng là thời điểm mệt mỏi và buồn nôn thường gặp, ở mức độ rất khác nhau tùy từng phụ nữ.',
    tip1Title: 'Nên biết',
    tip1Text: 'Những triệu chứng này, dù đôi khi khó chịu, là dấu hiệu cho thấy cơ thể đang tích cực thích nghi với thai kỳ.',
    body2: 'Tam cá nguyệt thứ hai thường là giai đoạn thoải mái nhất, với những cử động đầu tiên của em bé xuất hiện.',
    highlightTitle: 'Những cử động đầu tiên',
    highlightText: 'Thường cảm nhận được trong khoảng tuần 18 đến 22, sớm hơn một chút nếu đây không phải thai kỳ đầu tiên của bạn.',
    body3: 'Tam cá nguyệt thứ ba chuẩn bị cơ thể cho cuộc sinh, với việc tăng cân và mệt mỏi rõ rệt hơn. Các cơn co thắt luyện tập (gọi là Braxton Hicks) cũng có thể xuất hiện.',
    neutralText: 'Những cơn co thắt này thường không đều và ít đau; chúng khác với các cơn co thắt chuyển dạ.',
    trimesters: [
      'Tam cá nguyệt 1: hình thành cơ quan',
      'Tam cá nguyệt 2: những cử động đầu tiên',
      'Tam cá nguyệt 3: chuẩn bị cho cuộc sinh',
      'Theo dõi y tế ở mọi giai đoạn',
    ],
    commonSymptoms: [
      'Buồn nôn và mệt mỏi, đặc biệt ở tam cá nguyệt thứ nhất',
      'Đau nhói ở bụng do dây chằng bị kéo giãn',
      'Hơi khó thở ở giai đoạn muộn của thai kỳ',
      'Khó ngủ vào cuối tam cá nguyệt thứ ba',
    ],
    consultIntro: 'Một số dấu hiệu cần lời khuyên y khoa nhanh chóng, bất kể tam cá nguyệt nào:',
    urgentSigns: [
      'Ra máu, dù chỉ nhẹ',
      'Đau bụng dữ dội',
      'Không cảm nhận được cử động',
      'Đau đầu dữ dội hoặc các vấn đề về thị lực',
      'Sốt bất thường',
    ],
    tip2Title: 'Nên biết',
    tip2Text: 'Mỗi tam cá nguyệt mang đến những thay đổi riêng: biết trước chúng giúp bạn trải qua từng giai đoạn tốt hơn, mà không thay thế việc theo dõi định kỳ với nữ hộ sinh hoặc bác sĩ của bạn.',
    shareMessage: 'Thai kỳ của bạn, từng tuần một — AWA',
  },
  uz: {
    badge: 'HOMILADORLIK • UMUMIY KOʻRINISH',
    title: 'Homiladorligingiz\nhafta-hafta',
    metaDuration: '8 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Birinchi trimestrdan uchinchi trimestrgacha asosiy bosqichlar, har bir bosqichda nimalarni kutish kerakligini bilishingiz uchun.',
    introSecondary: 'Har bir homiladorlik oʻz ritmiga ega: bu tayanch nuqtalar umumiy va ayoldan ayolga farq qilishi mumkin.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Birinchi trimestr: poydevor qoʻyish',
      'Ikkinchi trimestr: koʻproq qulaylik',
      'Uchinchi trimestr: tayyorgarlik',
      'Trimestrlar boʻyicha asosiy bosqichlar',
      'Har bir bosqichdagi keng tarqalgan alomatlar',
      'Qachon tezda yordam soʻrash kerak',
      'Asosiy xulosalar',
    ],
    body1: 'Birinchi trimestr poydevor qoʻyadi: chaqaloqning barcha asosiy aʼzolari bosqichma-bosqich shakllanadi. Bu charchoq va koʻngil aynishi keng tarqalgan davr ham, ayolga qarab juda turli darajada.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Bu alomatlar baʼzan noqulay boʻlsa-da, tananing homiladorlikka faol moslashayotganining belgisi.',
    body2: 'Ikkinchi trimestr koʻpincha eng qulay davr, chaqaloqning dastlabki harakatlari paydo boʻladi.',
    highlightTitle: 'Dastlabki harakatlar',
    highlightText: 'Ular odatda 18-haftadan 22-haftagacha seziladi, agar bu birinchi homiladorlik boʻlmasa, biroz ertaroq.',
    body3: 'Uchinchi trimestr tanani tugʻruqqa tayyorlaydi, vazn ortishi va charchoq sezilarliroq boʻladi. Mashq qisqarishlari (Braxton Hicks deb ataladi) ham paydo boʻlishi mumkin.',
    neutralText: 'Bu qisqarishlar odatda notekis va unchalik ogʻriqli emas; ular tugʻruq qisqarishlaridan farq qiladi.',
    trimesters: [
      '1-trimestr: aʼzolarning shakllanishi',
      '2-trimestr: dastlabki harakatlar',
      '3-trimestr: tugʻruqqa tayyorgarlik',
      'Har bir bosqichda tibbiy nazorat',
    ],
    commonSymptoms: [
      'Koʻngil aynishi va charchoq, ayniqsa birinchi trimestrda',
      'Boylamlarning choʻzilishi bilan bogʻliq qorindagi sanchiqlar',
      'Homiladorlikning keyingi davrida yengil nafas qisilishi',
      'Uchinchi trimestrning oxirida uyqu muammolari',
    ],
    consultIntro: 'Baʼzi belgilar trimestrdan qatʼi nazar, zudlik bilan tibbiy maslahatni talab qiladi:',
    urgentSigns: [
      'Qon ketishi, hatto yengil boʻlsa ham',
      'Qorinda kuchli ogʻriq',
      'Harakat sezilmasligi',
      'Kuchli bosh ogʻrigʻi yoki koʻrish muammolari',
      'Odatdan tashqari isitma',
    ],
    tip2Title: 'Bilish foydali',
    tip2Text: 'Har bir trimestr oʻz oʻzgarishlarini olib keladi: ularni oldindan bilish har bir bosqichni yaxshiroq boshdan kechirishga yordam beradi, bu doya yoki shifokor bilan muntazam nazoratni almashtirmaydi.',
    shareMessage: 'Homiladorligingiz hafta-hafta — AWA',
  },
  az: {
    badge: 'HAMİLƏLİK • ÜMUMİ BAXIŞ',
    title: 'Sizin hamiləliyiniz,\nhəftə-həftə',
    metaDuration: '8 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Birinci trimestrdən üçüncü trimestrə qədər əsas mərhələlər, hər mərhələdə nələri gözləməyi biləsiniz.',
    introSecondary: 'Hər hamiləlik öz ritmi ilə gedir: bu istinad nöqtələri ümumidir və qadından qadına dəyişə bilər.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Birinci trimestr: əsasların qoyulması',
      'İkinci trimestr: daha çox rahatlıq',
      'Üçüncü trimestr: hazırlıq',
      'Trimestrlər üzrə əsas mərhələlər',
      'Hər mərhələdə geniş yayılmış simptomlar',
      'Nə vaxt tez tibbi yardım almaq lazımdır',
      'Əsas nəticələr',
    ],
    body1: 'Birinci trimestr əsasları qoyur: körpənin bütün əsas orqanları tədricən formalaşır. Bu, həm də yorğunluğun və ürəkbulanmanın qadından asılı olaraq çox fərqli dərəcədə geniş yayıldığı vaxtdır.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Bu simptomlar bəzən narahatlıq doğursa da, bədənin hamiləliyə fəal şəkildə uyğunlaşdığının əlamətidir.',
    body2: 'İkinci trimestr çox vaxt ən rahat dövrdür, körpənin ilk hərəkətləri görünür.',
    highlightTitle: 'İlk hərəkətlər',
    highlightText: 'Onlar adətən 18-ci ilə 22-ci həftələr arasında hiss olunur, bu ilk hamiləliyiniz deyilsə, bir az daha tez.',
    body3: 'Üçüncü trimestr bədəni doğuşa hazırlayır, daha nəzərəçarpan çəki artımı və yorğunluqla. Məşq yığılmaları (Brakston-Hiks yığılmaları adlanır) da görünə bilər.',
    neutralText: 'Bu yığılmalar adətən qeyri-müntəzəm və az ağrılıdır; onlar doğuş yığılmalarından fərqlənir.',
    trimesters: [
      '1-ci trimestr: orqanların formalaşması',
      '2-ci trimestr: ilk hərəkətlər',
      '3-cü trimestr: doğuşa hazırlıq',
      'Hər mərhələdə tibbi nəzarət',
    ],
    commonSymptoms: [
      'Ürəkbulanma və yorğunluq, xüsusilə birinci trimestrdə',
      'Bağların dartılması ilə bağlı qarında sancılar',
      'Hamiləliyin sonrakı dövrlərində yüngül nəfəs darlığı',
      'Üçüncü trimestrin sonunda yuxu problemləri',
    ],
    consultIntro: 'Bəzi əlamətlər trimestrdən asılı olmayaraq təcili tibbi məsləhət tələb edir:',
    urgentSigns: [
      'Qanaxma, hətta yüngül olsa belə',
      'Şiddətli qarın ağrısı',
      'Heç bir hərəkətin hiss olunmaması',
      'Şiddətli baş ağrıları və ya görmə problemləri',
      'Qeyri-adi hərarət',
    ],
    tip2Title: 'Bilmək faydalıdır',
    tip2Text: 'Hər trimestr öz dəyişikliklərini gətirir: onları əvvəlcədən bilmək hər mərhələni daha yaxşı yaşamağa kömək edir, lakin mama və ya həkimlə müntəzəm nəzarəti əvəz etmir.',
    shareMessage: 'Sizin hamiləliyiniz, həftə-həftə — AWA',
  },
  ka: {
    badge: 'ორსულობა • მიმოხილვა',
    title: 'თქვენი ორსულობა,\nკვირა-კვირა',
    metaDuration: '8 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'ძირითადი ეტაპები პირველიდან მესამე ტრიმესტრამდე, რომ იცოდეთ, რას უნდა ელოდეთ თითოეულ ეტაპზე.',
    introSecondary: 'ყოველი ორსულობა საკუთარ რიტმს მისდევს: ეს საორიენტაციო წერტილები ზოგადია და ქალიდან ქალამდე შეიძლება განსხვავდებოდეს.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'პირველი ტრიმესტრი: საფუძვლების ჩაყრა',
      'მეორე ტრიმესტრი: მეტი კომფორტი',
      'მესამე ტრიმესტრი: მზადება',
      'ძირითადი ეტაპები ტრიმესტრების მიხედვით',
      'გავრცელებული სიმპტომები თითოეულ ეტაპზე',
      'როდის მივმართოთ დახმარებას სწრაფად',
      'მთავარი დასკვნები',
    ],
    body1: 'პირველი ტრიმესტრი საფუძვლებს ყრის: ბავშვის ყველა ძირითადი ორგანო ეტაპობრივად ყალიბდება. ეს ასევე დროა, როცა დაღლილობა და გულისრევა ხშირია, ქალის მიხედვით ძალიან განსხვავებული ხარისხით.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'ეს სიმპტომები, თუმცა ზოგჯერ უხერხულია, იმის ნიშანია, რომ სხეული აქტიურად ადაპტირდება ორსულობასთან.',
    body2: 'მეორე ტრიმესტრი ხშირად ყველაზე კომფორტულია, ბავშვის პირველი მოძრაობების გამოჩენით.',
    highlightTitle: 'პირველი მოძრაობები',
    highlightText: 'ისინი, როგორც წესი, მე-18–მე-22 კვირას შორის იგრძნობა, ცოტა უფრო ადრე, თუ ეს პირველი ორსულობა არ არის.',
    body3: 'მესამე ტრიმესტრი სხეულს მშობიარობისთვის ამზადებს, უფრო შესამჩნევი წონის მატებითა და დაღლილობით. ასევე შეიძლება გამოჩნდეს სავარჯიშო შეკუმშვები (ბრაქსტონ-ჰიქსის).',
    neutralText: 'ეს შეკუმშვები, როგორც წესი, არარეგულარულია და ნაკლებად მტკივნეული; ისინი მშობიარობის შეკუმშვებისგან განსხვავდება.',
    trimesters: [
      'I ტრიმესტრი: ორგანოების ფორმირება',
      'II ტრიმესტრი: პირველი მოძრაობები',
      'III ტრიმესტრი: მშობიარობისთვის მომზადება',
      'სამედიცინო მეთვალყურეობა ყოველ ეტაპზე',
    ],
    commonSymptoms: [
      'გულისრევა და დაღლილობა, განსაკუთრებით პირველ ტრიმესტრში',
      'მუცელში ჩხვლეტა, რომელიც იოგების გაჭიმვას უკავშირდება',
      'მსუბუქი სუნთქვის უკმარისობა ორსულობის შემდგომ ეტაპზე',
      'ძილის პრობლემები მესამე ტრიმესტრის ბოლოს',
    ],
    consultIntro: 'გარკვეული ნიშნები სწრაფ სამედიცინო რჩევას მოითხოვს, ტრიმესტრის მიუხედავად:',
    urgentSigns: [
      'სისხლდენა, თუნდაც მსუბუქი',
      'ინტენსიური ტკივილი მუცელში',
      'მოძრაობა არ იგრძნობა',
      'ძლიერი თავის ტკივილი ან მხედველობის პრობლემები',
      'უჩვეულო ცხელება',
    ],
    tip2Title: 'კარგია ვიცოდეთ',
    tip2Text: 'ყოველი ტრიმესტრი საკუთარ ცვლილებებს მოაქვს: მათი წინასწარ ცოდნა გეხმარებათ თითოეული ეტაპის უკეთ განცდაში, თქვენი ბებიაქალის ან ექიმის რეგულარული მეთვალყურეობის ჩანაცვლების გარეშე.',
    shareMessage: 'თქვენი ორსულობა, კვირა-კვირა — AWA',
  },
  hy: {
    badge: 'ՀՂԻՈՒԹՅՈՒՆ • ԱԿՆԱՐԿ',
    title: 'Ձեր հղիությունը՝\nշաբաթ առ շաբաթ',
    metaDuration: '8 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Հիմնական նշաձողերը՝ առաջին եռամսյակից մինչև երրորդը, որպեսզի իմանաք, թե ինչ սպասել յուրաքանչյուր փուլում:',
    introSecondary: 'Յուրաքանչյուր հղիություն հետևում է իր ռիթմին. այս ուղենիշները ընդհանուր են և կարող են տարբերվել կնոջից կին:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Առաջին եռամսյակ. հիմքերի դրումը',
      'Երկրորդ եռամսյակ. ավելի շատ հարմարավետություն',
      'Երրորդ եռամսյակ. պատրաստվելը',
      'Հիմնական նշաձողերը՝ ըստ եռամսյակների',
      'Տարածված ախտանիշներ յուրաքանչյուր փուլում',
      'Երբ արագ խնամք փնտրել',
      'Հիմնական եզրակացություններ',
    ],
    body1: 'Առաջին եռամսյակը դնում է հիմքերը. երեխայի բոլոր հիմնական օրգանները ձևավորվում են աստիճանաբար: Սա նաև ժամանակ է, երբ հոգնածությունը և սրտխառնոցը տարածված են՝ խիստ տարբեր աստիճաններով՝ կախված կնոջից:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Այս ախտանիշները, թեև երբեմն անհարմար, նշան են, որ մարմինը ակտիվորեն հարմարվում է հղիությանը:',
    body2: 'Երկրորդ եռամսյակը հաճախ ամենահարմարավետն է՝ երեխայի առաջին շարժումների հայտնվելով:',
    highlightTitle: 'Առաջին շարժումները',
    highlightText: 'Դրանք սովորաբար զգացվում են 18-ից 22-րդ շաբաթների միջև, մի փոքր ավելի շուտ, եթե սա ձեր առաջին հղիությունը չէ:',
    body3: 'Երրորդ եռամսյակը նախապատրաստում է մարմինը ծննդաբերությանը՝ ավելի նկատելի քաշի ավելացմամբ և հոգնածությամբ: Կարող են հայտնվել նաև վարժական կծկումներ (հայտնի որպես Բրաքստոն-Հիքսի):',
    neutralText: 'Այս կծկումները սովորաբար անկանոն են և քիչ ցավոտ. դրանք տարբերվում են ծննդաբերական կծկումներից:',
    trimesters: [
      '1-ին եռամսյակ. օրգանների ձևավորում',
      '2-րդ եռամսյակ. առաջին շարժումները',
      '3-րդ եռամսյակ. նախապատրաստում ծննդաբերությանը',
      'Բժշկական հսկողություն յուրաքանչյուր փուլում',
    ],
    commonSymptoms: [
      'Սրտխառնոց և հոգնածություն, հատկապես առաջին եռամսյակում',
      'Որովայնային ծակոցներ՝ կապված կապանների ձգվելու հետ',
      'Թեթև շնչահեղձություն հղիության ավելի ուշ փուլերում',
      'Քնի խնդիրներ երրորդ եռամսյակի վերջում',
    ],
    consultIntro: 'Որոշ նշաններ պահանջում են արագ բժշկական խորհրդատվություն՝ անկախ եռամսյակից.',
    urgentSigns: [
      'Արյունահոսություն, նույնիսկ թեթև',
      'Ինտենսիվ որովայնային ցավ',
      'Շարժում չի զգացվում',
      'Ուժեղ գլխացավեր կամ տեսողության խնդիրներ',
      'Անսովոր ջերմություն',
    ],
    tip2Title: 'Լավ է իմանալ',
    tip2Text: 'Յուրաքանչյուր եռամսյակ բերում է իր փոփոխությունները. դրանք նախապես իմանալը օգնում է ավելի լավ ապրել յուրաքանչյուր փուլ՝ առանց փոխարինելու ձեր մանկաբարձուհու կամ բժշկի կանոնավոր հսկողությանը:',
    shareMessage: 'Ձեր հղիությունը՝ շաբաթ առ շաբաթ — AWA',
  },
  tg: {
    badge: 'ҲОМИЛАДОРӢ • ШАРҲИ УМУМӢ',
    title: 'Ҳомиладории шумо,\nҳафта ба ҳафта',
    metaDuration: '8 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Нуқтаҳои асосии рушд аз триместри аввал то севум, то бидонед дар ҳар марҳила чӣ интизор шудан лозим аст.',
    introSecondary: 'Ҳар ҳомиладорӣ суръати худро дорад: ин нуқтаҳои истинод умумианд ва аз зан ба зан метавонанд фарқ кунанд.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Триместри аввал: гузоштани асосҳо',
      'Триместри дуюм: роҳатии бештар',
      'Триместри севум: омодагӣ',
      'Нуқтаҳои асосӣ аз рӯи триместр',
      'Нишонаҳои маъмул дар ҳар марҳила',
      'Кай бояд зуд нигоҳубини тиббӣ ҷӯед',
      'Хулосаҳои асосӣ',
    ],
    body1: 'Триместри аввал асосҳоро мегузорад: ҳамаи узвҳои асосии тифл тадриҷан ташаккул меёбанд. Ин инчунин вақтест, ки хастагӣ ва беҳузурӣ маъмуланд, бо дараҷаҳои хеле гуногун вобаста ба зан.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Ин нишонаҳо, гарчанде баъзан нороҳатанд, нишонаи он мебошанд, ки бадан фаъолона ба ҳомиладорӣ мутобиқ мешавад.',
    body2: 'Триместри дуюм аксар вақт роҳаттарин аст, бо пайдо шудани аввалин ҳаракатҳои тифл.',
    highlightTitle: 'Аввалин ҳаракатҳо',
    highlightText: 'Онҳо одатан дар байни ҳафтаҳои 18 ва 22 ҳис мешаванд, андаке барвақттар агар ин ҳомиладории аввалини шумо набошад.',
    body3: 'Триместри севум бадани шуморо барои таваллуд омода мекунад, бо афзоиши намоёнтари вазн ва хастагӣ. Кашишҳои машқӣ (маъруф ба Брэкстон-Хикс) низ метавонанд пайдо шаванд.',
    neutralText: 'Ин кашишҳо одатан номунтазам ва камдард; онҳо аз кашишҳои таваллуд фарқ мекунанд.',
    trimesters: [
      'Триместри 1: ташаккули узвҳо',
      'Триместри 2: аввалин ҳаракатҳо',
      'Триместри 3: омодагӣ ба таваллуд',
      'Назорати тиббӣ дар ҳар марҳила',
    ],
    commonSymptoms: [
      'Беҳузурӣ ва хастагӣ, хусусан дар триместри аввал',
      'Дардҳои шикам, ки бо кашидани пайвандҳо алоқаманд аст',
      'Тангии сабуки нафас дар охири ҳомиладорӣ',
      'Ихтилоли хоб дар охири триместри севум',
    ],
    consultIntro: 'Баъзе нишонаҳо новобаста аз триместр маслиҳати зуди тиббиро талаб мекунанд:',
    urgentSigns: [
      'Хунравӣ, ҳатто сабук',
      'Дарди шадиди шикам',
      'Ҳаракат ҳис намешавад',
      'Дарди шадиди сар ё мушкилоти биноӣ',
      'Таби ғайриоддӣ',
    ],
    tip2Title: 'Донистан хуб аст',
    tip2Text: 'Ҳар триместр тағйироти худро меорад: аз пеш донистани онҳо ба шумо кумак мекунад ҳар марҳиларо беҳтар аз сар гузаронед, бидуни иваз кардани пайгирии мунтазам бо доя ё табиби шумо.',
    shareMessage: 'Ҳомиладории шумо, ҳафта ба ҳафта — AWA',
  },
  ky: {
    badge: 'КУРСАКТУУЛУК • СЕРЕП',
    title: 'Курсактуулугуңуз,\nжума сайын',
    metaDuration: '8 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Биринчи триместрден үчүнчү триместрге чейинки негизги этаптар, ар бир этапта эмне күтүүнү билүү үчүн.',
    introSecondary: 'Ар бир курсактуулук өз ритмин ээрчийт: бул таяныч чекиттер жалпы жана аялдан аялга айырмаланышы мүмкүн.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Биринчи триместр: пайдубал түзүү',
      'Экинчи триместр: ыңгайлуураак',
      'Үчүнчү триместр: даярдануу',
      'Триместр боюнча негизги этаптар',
      'Ар бир этаптагы кеңири таралган белгилер',
      'Тез медициналык жардамга качан кайрылуу керек',
      'Негизги жыйынтыктар',
    ],
    body1: 'Биринчи триместр пайдубал түзөт: ымыркайдын бардык негизги органдары акырындап түзүлөт. Бул ошондой эле аялга жараша ар кандай даражада чарчоо жана көңүл айлануу кеңири таралган мезгил.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Бул белгилер кээде ыңгайсыз болсо да, дене курсактуулукка активдүү ыңгайлашып жатканынын белгиси.',
    body2: 'Экинчи триместр көбүнчө эң ыңгайлуусу, ымыркайдын алгачкы кыймылдары пайда болот.',
    highlightTitle: 'Алгачкы кыймылдар',
    highlightText: 'Алар адатта 18–22-жумалардын ортосунда сезилет, бул биринчи курсактуулугуңуз болбосо, бир аз эртерээк.',
    body3: 'Үчүнчү триместр денени төрөткө даярдайт, салмак алуу жана чарчоо көбүрөөк байкалат. Машыгуу жыйрылуулары (Брэкстон-Хикс деп аталат) да пайда болушу мүмкүн.',
    neutralText: 'Бул жыйрылуулар адатта туура эмес жана анча оорутпайт; алар төрөт жыйрылууларынан айырмаланат.',
    trimesters: [
      '1-триместр: органдардын түзүлүшү',
      '2-триместр: алгачкы кыймылдар',
      '3-триместр: төрөткө даярдануу',
      'Ар бир этапта медициналык көзөмөл',
    ],
    commonSymptoms: [
      'Көңүл айлануу жана чарчоо, айрыкча биринчи триместрде',
      'Байламталардын созулушуна байланыштуу курсактагы тартылуулар',
      'Курсактуулуктун акырында жеңил дем жетишсиздиги',
      'Үчүнчү триместрдин аягында уйку көйгөйлөрү',
    ],
    consultIntro: 'Айрым белгилер триместрге карабастан тез медициналык кеңешти талап кылат:',
    urgentSigns: [
      'Кан кетүү, жеңил болсо да',
      'Курсактагы күчтүү оору',
      'Эч кандай кыймыл сезилбейт',
      'Катуу баш оору же көрүү көйгөйлөрү',
      'Адаттан тыш ысытма',
    ],
    tip2Title: 'Билүү пайдалуу',
    tip2Text: 'Ар бир триместр өз өзгөрүүлөрүн алып келет: аларды алдын ала билүү акушеркаңыз же дарыгериңиз менен үзгүлтүксүз көзөмөлдү алмаштырбастан, ар бир этапты жакшыраак башынан өткөрүүгө жардам берет.',
    shareMessage: 'Курсактуулугуңуз, жума сайын — AWA',
  },
  tk: {
    badge: 'GÖWRELILIK • SYN',
    title: 'Göwreliligiňiz,\nhepdeme-hepde',
    metaDuration: '8 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Birinji trimestrden üçünji trimestre çenli esasy tapgyrlar, her tapgyrda nämä garaşmalydygyny bilmek üçin.',
    introSecondary: 'Her göwrelilik öz ritmine eýerýär: bu ugurlar umumy we aýaldan aýala tapawutlanyp biler.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Birinji trimestr: binýadyň goýulmagy',
      'Ikinji trimestr: has köp rahatlyk',
      'Üçünji trimestr: taýýarlanmak',
      'Trimestre görä esasy tapgyrlar',
      'Her tapgyrda umumy alamatlar',
      'Lukmançylyk kömegini çalt haçan soramaly',
      'Esasy netijeler',
    ],
    body1: 'Birinji trimestr binýady goýýar: bäbegiň ähli esasy agzalary ýuwaş-ýuwaşdan emele gelýär. Bu şeýle hem ýadawlygyň we ýüregiň bulanmagynyň, aýala görä gaty dürli derejede, umumy bolan wagty.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Bu alamatlar käwagt rahatsyz bolsa-da, bedeniň göwrelilige işjeň uýgunlaşýandygynyň alamaty.',
    body2: 'Ikinji trimestr köplenç iň rahat, bäbegiň ilkinji hereketleri peýda bolýar.',
    highlightTitle: 'Ilkinji hereketler',
    highlightText: 'Olar adatça 18–22-nji hepdeleriň arasynda duýulýar, bu ilkinji göwreliligiňiz bolmasa, az-kem has ir.',
    body3: 'Üçünji trimestr bedeni dogruma taýýarlaýar, has aýdyň agram goşmak we ýadawlyk bilen. Türgenleşik gysylmalary (Braxton Hicks diýlip bilinýän) hem peýda bolup biler.',
    neutralText: 'Bu gysylmalar adatça düzgünsiz we az agyryly; olar dogrum gysylmalaryndan tapawutlanýar.',
    trimesters: [
      '1-nji trimestr: agzalaryň emele gelmegi',
      '2-nji trimestr: ilkinji hereketler',
      '3-nji trimestr: dogruma taýýarlanmak',
      'Her tapgyrda lukmançylyk yzarlamasy',
    ],
    commonSymptoms: [
      'Ýüregiň bulanmagy we ýadawlyk, aýratyn-da birinji trimestrde',
      'Baglaryň uzalmagy bilen baglanyşykly garyn çekişmeleri',
      'Göwreliligiň ahyrynda ýeňil dem ýetmezçiligi',
      'Üçünji trimestriň ahyrynda uky kynçylygy',
    ],
    consultIntro: 'Käbir alamatlar trimestre garamazdan çalt lukmançylyk maslahatyny talap edýär:',
    urgentSigns: [
      'Gan akma, hatda ýeňil bolsa-da',
      'Güýçli garyn agyrysy',
      'Hereketiň duýulmazlygy',
      'Güýçli kelle agyrylary ýa-da görüş kynçylyklary',
      'Adaty däl gyzgyn',
    ],
    tip2Title: 'Bilmek peýdaly',
    tip2Text: 'Her trimestr öz üýtgeşmelerini getirýär: olary öňünden bilmek akuşerkaňyz ýa-da lukmanyňyz bilen yzygiderli yzarlamany çalyşmazdan, her tapgyry has gowy başdan geçirmäge kömek edýär.',
    shareMessage: 'Göwreliligiňiz, hepdeme-hepde — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PregnancyWeeklyArticleScreen({
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
          <Image accessible accessibilityLabel={EDITORIAL_IMAGE_ALT.pregnancyFollowUp[lang]} accessibilityRole="image" source={resolveEditorialImage(HERO, lang)} resizeMode="cover" style={styles.hero} />

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

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.introSecondary}>
            {content.introSecondary}
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

          <AwaCard variant="filled" padding="none" style={styles.highlightBox}>
            <MaterialDesignIcons
              name="baby-face-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.highlightTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.highlightText}>
                {content.highlightText}
              </AwaText>
            </View>
          </AwaCard>

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
            {TRIMESTER_ICONS.map((icon, index) => (
              <View key={content.trimesters[index]} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>{content.trimesters[index]}</AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            5. {content.topics[4]}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.commonSymptoms.map(item => (
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>6. {content.topics[5]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.consultIntro}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.consultCard}>
            {URGENT_SIGN_ICONS.map((icon, index) => (
              <View key={content.urgentSigns[index]} style={styles.consultRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="bodySmall" style={styles.consultText}>{content.urgentSigns[index]}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>7. {content.topics[6]}</AwaText>

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

      <ReadingControls articleId={ID} durationMinutes={8} scrollRef={scrollRef} />
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
  introSecondary: {
    marginTop: 8,
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
  highlightBox: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  highlightCopy: {flex: 1, marginLeft: 12},
  highlightText: {
    marginTop: 4,
  },
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
  consultCard: {
    marginTop: 16,
    padding: 12,
  },
  consultRow: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  consultIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  consultText: {
    flex: 1,
    marginLeft: 12,
  },
  });
}
