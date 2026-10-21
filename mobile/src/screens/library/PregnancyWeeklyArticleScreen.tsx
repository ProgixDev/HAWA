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
