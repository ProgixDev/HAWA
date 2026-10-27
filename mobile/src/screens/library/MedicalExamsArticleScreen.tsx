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
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

const ID = 'medicalexams-suivi-medical';

const HERO = require('../../assets/images/library/spm-consult.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const ULTRASOUND_ICONS = [
  'numeric-1-circle-outline',
  'numeric-2-circle-outline',
  'numeric-3-circle-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('MedicalExams', {
  fr: {
    badge: 'GROSSESSE • SUIVI MÉDICAL',
    title: 'Le calendrier des\nexamens de grossesse',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Échographies et bilans essentiels, trimestre par trimestre.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Les échographies de suivi',
      'Les prises de sang essentielles',
      'Préparer chaque rendez-vous',
      'À noter',
      'À retenir',
    ],
    body1:
      'Trois échographies principales rythment généralement la grossesse, une par trimestre, chacune avec un objectif différent.',
    ultrasounds: [
      '1er trimestre : datation et clarté nucale',
      '2e trimestre : échographie morphologique',
      '3e trimestre : croissance et position du bébé',
    ],
    body2:
      'Des prises de sang régulières surveillent plusieurs marqueurs clés tout au long de la grossesse :',
    bloodTests: [
      'Taux de fer, pour dépister une éventuelle anémie',
      'Dépistage du diabète gestationnel, généralement autour du 2e trimestre',
      'Groupe sanguin et recherche d’agglutinines irrégulières',
      'Sérologies (toxoplasmose, rubéole) selon ton statut immunitaire',
    ],
    prepTips: [
      'Noter tes questions au fur et à mesure, avant de les oublier',
      'Apporter ton carnet de suivi de grossesse à chaque rendez-vous',
      'Signaler tout symptôme nouveau, même s’il te semble mineur',
    ],
    neutralText:
      'Le nombre et le calendrier exact des examens peuvent varier selon ton suivi, ton profil de risque et les pratiques de ton pays ou de ton établissement.',
    tipTitle: 'Bon à savoir',
    tipText:
      'Ne pas hésiter à noter tes questions avant chaque rendez-vous pour ne rien oublier sur le moment : aucune question n’est trop petite pour être posée.',
    shareMessage: 'Le calendrier des examens de grossesse — AWA',
  },
  en: {
    badge: 'PREGNANCY • MEDICAL FOLLOW-UP',
    title: 'The pregnancy exam\ncalendar',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Ultrasounds and essential tests, trimester by trimester.',
    contentsTitle: 'In this article',
    topics: [
      'Follow-up ultrasounds',
      'Essential blood tests',
      'Preparing for each appointment',
      'Worth noting',
      'Key takeaways',
    ],
    body1:
      'Pregnancy generally includes three main ultrasounds, one per trimester, each with a different purpose.',
    ultrasounds: [
      '1st trimester: dating and nuchal translucency',
      '2nd trimester: morphology ultrasound',
      '3rd trimester: growth and the baby’s position',
    ],
    body2:
      'Regular blood tests monitor several key markers throughout pregnancy:',
    bloodTests: [
      'Iron levels, to screen for possible anemia',
      'Gestational diabetes screening, generally around the 2nd trimester',
      'Blood type and irregular antibody screening',
      'Serology tests (toxoplasmosis, rubella) depending on your immune status',
    ],
    prepTips: [
      'Write down your questions as they come to you, before you forget them',
      'Bring your pregnancy follow-up booklet to every appointment',
      'Mention any new symptom, even if it seems minor',
    ],
    neutralText:
      'The exact number and schedule of exams can vary depending on your care, your risk profile, and the practices of your country or care provider.',
    tipTitle: 'Good to know',
    tipText:
      'Don’t hesitate to write down your questions before each appointment so you don’t forget anything in the moment: no question is too small to ask.',
    shareMessage: 'The pregnancy exam calendar — AWA',
  },
  es: {
    badge: 'EMBARAZO • SEGUIMIENTO MÉDICO',
    title: 'El calendario de\nlos exámenes del embarazo',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Ecografías y pruebas esenciales, trimestre a trimestre.',
    contentsTitle: 'En este artículo',
    topics: [
      'Las ecografías de seguimiento',
      'Los análisis de sangre esenciales',
      'Preparar cada cita',
      'Para tener en cuenta',
      'Para recordar',
    ],
    body1:
      'Tres ecografías principales marcan generalmente el ritmo del embarazo, una por trimestre, cada una con un objetivo diferente.',
    ultrasounds: [
      '1.er trimestre: datación y translucencia nucal',
      '2.º trimestre: ecografía morfológica',
      '3.er trimestre: crecimiento y posición del bebé',
    ],
    body2:
      'Varios análisis de sangre regulares controlan varios marcadores clave a lo largo del embarazo:',
    bloodTests: [
      'Nivel de hierro, para detectar una posible anemia',
      'Cribado de diabetes gestacional, generalmente alrededor del 2.º trimestre',
      'Grupo sanguíneo e investigación de aglutininas irregulares',
      'Serologías (toxoplasmosis, rubéola) según tu estado inmunitario',
    ],
    prepTips: [
      'Anota tus preguntas a medida que te surjan, antes de olvidarlas',
      'Lleva tu cartilla de seguimiento del embarazo a cada cita',
      'Comenta cualquier síntoma nuevo, aunque te parezca menor',
    ],
    neutralText:
      'El número y el calendario exacto de los exámenes pueden variar según tu seguimiento, tu perfil de riesgo y las prácticas de tu país o de tu centro médico.',
    tipTitle: 'DATO ÚTIL',
    tipText:
      'No dudes en anotar tus preguntas antes de cada cita para no olvidar nada en el momento: ninguna pregunta es demasiado pequeña para hacerla.',
    shareMessage: 'El calendario de los exámenes del embarazo — AWA',
  },
  it: {
    badge: 'GRAVIDANZA • CONTROLLI MEDICI',
    title: 'Il calendario degli esami\nin gravidanza',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Ecografie ed esami essenziali, trimestre per trimestre.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Ecografie di controllo',
      'Esami del sangue essenziali',
      'Prepararsi a ogni appuntamento',
      'Da notare',
      'Punti chiave',
    ],
    body1: 'La gravidanza prevede in genere tre ecografie principali, una per trimestre, ciascuna con uno scopo diverso.',
    ultrasounds: [
      'Primo trimestre: datazione e translucenza nucale',
      'Secondo trimestre: ecografia morfologica',
      'Terzo trimestre: crescita e posizione del bambino',
    ],
    body2: 'Esami del sangue regolari monitorano diversi parametri chiave durante la gravidanza:',
    bloodTests: [
      'Livelli di ferro, per individuare una possibile anemia',
      'Screening del diabete gestazionale, in genere intorno al secondo trimestre',
      'Gruppo sanguigno e ricerca degli anticorpi irregolari',
      'Esami sierologici (toxoplasmosi, rosolia) in base al tuo stato immunitario',
    ],
    prepTips: [
      'Scrivi le tue domande man mano che ti vengono in mente, prima di dimenticarle',
      'Porta con te il libretto di gravidanza a ogni appuntamento',
      'Segnala qualsiasi nuovo sintomo, anche se sembra di poco conto',
    ],
    neutralText: 'Il numero esatto e il calendario degli esami possono variare in base alla tua assistenza, al tuo profilo di rischio e alle pratiche del tuo Paese o della struttura sanitaria.',
    tipTitle: 'Da sapere',
    tipText: 'Non esitare a scrivere le tue domande prima di ogni appuntamento per non dimenticare nulla sul momento: nessuna domanda è troppo piccola per essere posta.',
    shareMessage: 'Il calendario degli esami in gravidanza — AWA',
  },
  tr: {
    badge: 'GEBELİK • TIBBİ TAKİP',
    title: 'Gebelik muayeneleri\ntakvimi',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Ultrasonlar ve temel tetkikler, trimester trimester.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Takip ultrasonları',
      'Temel kan tahlilleri',
      'Her randevuya hazırlanmak',
      'Dikkate değer noktalar',
      'Akılda kalacaklar',
    ],
    body1: 'Gebelik genellikle her trimesterde bir tane olmak üzere, her biri farklı bir amaca hizmet eden üç ana ultrason içerir.',
    ultrasounds: [
      '1. trimester: gebelik haftasının belirlenmesi ve ense kalınlığı ölçümü',
      '2. trimester: morfoloji ultrasonu',
      '3. trimester: büyüme ve bebeğin duruşu',
    ],
    body2: 'Düzenli kan tahlilleri, gebelik boyunca birkaç temel göstergeyi izler:',
    bloodTests: [
      'Olası anemiyi taramak için demir düzeyleri',
      'Gebelik şekeri taraması, genellikle 2. trimester civarında',
      'Kan grubu ve düzensiz antikor taraması',
      'Bağışıklık durumuna göre serolojik tetkikler (toksoplazmoz, kızamıkçık)',
    ],
    prepTips: [
      'Aklına gelen soruları unutmadan önce yaz',
      'Her randevuya gebelik takip defterini götür',
      'Küçük görünse bile yeni bir belirtiyi mutlaka söyle',
    ],
    neutralText: 'Muayenelerin tam sayısı ve takvimi; aldığın bakıma, risk profiline ve ülkenin ya da sağlık hizmeti sağlayıcının uygulamalarına göre değişebilir.',
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Her randevudan önce sorularını yazmaktan çekinme; böylece o an hiçbir şeyi unutmazsın: sorulamayacak kadar küçük bir soru yoktur.',
    shareMessage: 'Gebelik muayeneleri takvimi — AWA',
  },
  ru: {
    badge: 'БЕРЕМЕННОСТЬ • МЕДИЦИНСКОЕ НАБЛЮДЕНИЕ',
    title: 'Календарь обследований\nпри беременности',
    metaDuration: '6 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'УЗИ и основные анализы — триместр за триместром.',
    contentsTitle: 'В этой статье',
    topics: [
      'УЗИ в ходе наблюдения',
      'Основные анализы крови',
      'Подготовка к каждому приёму',
      'Что стоит учитывать',
      'Главное',
    ],
    body1:
      'При беременности, как правило, проводят три основных УЗИ — по одному в каждом триместре, и у каждого своя цель.',
    ultrasounds: [
      '1-й триместр: определение срока и воротниковое пространство плода',
      '2-й триместр: УЗИ для оценки анатомии плода',
      '3-й триместр: рост и положение ребёнка',
    ],
    body2:
      'Регулярные анализы крови позволяют контролировать несколько важных показателей в течение всей беременности:',
    bloodTests: [
      'Уровень железа — для выявления возможной анемии',
      'Скрининг на гестационный диабет, как правило, около 2-го триместра',
      'Группа крови и скрининг нерегулярных антител',
      'Серологические исследования (токсоплазмоз, краснуха) в зависимости от вашего иммунного статуса',
    ],
    prepTips: [
      'Записывайте вопросы по мере появления, чтобы не забыть',
      'Берите на каждый приём обменную карту беременной',
      'Сообщайте о любом новом симптоме, даже если он кажется незначительным',
    ],
    neutralText:
      'Точное количество и график обследований могут различаться в зависимости от вашего ведения, профиля риска и практики вашей страны или медицинского учреждения.',
    tipTitle: 'ПОЛЕЗНО ЗНАТЬ',
    tipText:
      'Не стесняйтесь записывать вопросы перед каждым приёмом, чтобы ничего не забыть в моменте: нет слишком маленьких вопросов.',
    shareMessage: 'Календарь обследований при беременности — AWA',
  },
  de: {
    badge: 'SCHWANGERSCHAFT • MEDIZINISCHE BETREUUNG',
    title: 'Der Kalender der\nSchwangerschaftsuntersuchungen',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Ultraschalluntersuchungen und wichtige Tests, Trimester für Trimester.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Ultraschalluntersuchungen',
      'Wichtige Bluttests',
      'Auf jeden Termin vorbereitet sein',
      'Gut zu wissen',
      'Das Wichtigste in Kürze',
    ],
    body1:
      'In der Schwangerschaft sind in der Regel drei große Ultraschalluntersuchungen vorgesehen, eine pro Trimester, jede mit einem anderen Schwerpunkt.',
    ultrasounds: [
      '1. Trimester: Bestimmung des Schwangerschaftsalters und Nackentransparenz',
      '2. Trimester: Feinultraschall zur Untersuchung der Organentwicklung',
      '3. Trimester: Wachstum und Lage des Babys',
    ],
    body2:
      'Regelmäßige Bluttests überwachen im Verlauf der Schwangerschaft mehrere wichtige Werte:',
    bloodTests: [
      'Eisenwerte, um eine mögliche Blutarmut zu erkennen',
      'Test auf Schwangerschaftsdiabetes, in der Regel etwa im 2. Trimester',
      'Blutgruppe und Suchtest auf unregelmäßige Antikörper',
      'Serologische Tests (Toxoplasmose, Röteln) je nach deinem Immunstatus',
    ],
    prepTips: [
      'Schreib deine Fragen auf, sobald sie dir einfallen, bevor du sie vergisst',
      'Bring zu jedem Termin deinen Mutterpass mit',
      'Erwähne jedes neue Symptom, auch wenn es unbedeutend erscheint',
    ],
    neutralText:
      'Die genaue Anzahl und der Zeitplan der Untersuchungen können je nach deiner Betreuung, deinem Risikoprofil und den Gepflogenheiten deines Landes oder deiner Betreuungsperson variieren.',
    tipTitle: 'Gut zu wissen',
    tipText:
      'Schreib dir deine Fragen vor jedem Termin gern auf, damit du im Moment nichts vergisst: Keine Frage ist zu klein, um sie zu stellen.',
    shareMessage: 'Der Kalender der Schwangerschaftsuntersuchungen — AWA',
  },
  zh: {
      badge: '怀孕 • 医疗随访',
      title: '孕期检查\n时间表',
      metaDuration: '阅读约 6 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '按孕期阶段了解超声检查和重要的检验项目。',
      contentsTitle: '本文内容',
      topics: [
        '随访超声检查',
        '重要的血液检查',
        '为每次产检做准备',
        '值得注意的事',
        '要点回顾',
      ],
      body1: '孕期通常包括三次主要的超声检查，每个孕期一次，各有不同的目的。',
      ultrasounds: [
        '孕早期：核对孕周和颈项透明层检查',
        '孕中期：胎儿结构超声检查',
        '孕晚期：生长发育和宝宝的胎位',
      ],
      body2: '整个孕期会定期做血液检查，监测几项关键指标：',
      bloodTests: [
        '铁含量，用于筛查可能的贫血',
        '妊娠期糖尿病筛查，通常在孕中期前后进行',
        '血型和不规则抗体筛查',
        '血清学检查（弓形虫病、风疹），视你的免疫状态而定',
      ],
      prepTips: [
        '想到问题就随时记下来，免得忘记',
        '每次产检都带上你的孕期随访手册',
        '提到任何新出现的症状，即使看起来很轻微',
      ],
      neutralText: '检查的具体次数和时间安排，可能因你所接受的医疗服务、风险情况，以及所在国家或医疗机构的做法而有所不同。',
      tipTitle: '小贴士',
      tipText: '每次产检前，不妨把问题写下来，免得当场遗漏：再小的问题都值得问。',
      shareMessage: '孕期检查时间表 — AWA',
    },
  id: {
    badge: 'KEHAMILAN • PEMANTAUAN MEDIS',
    title: 'Kalender pemeriksaan\nkehamilan',
    metaDuration: '6 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'USG dan tes penting, trimester demi trimester.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'USG pemantauan',
      'Tes darah penting',
      'Mempersiapkan setiap kunjungan',
      'Perlu dicatat',
      'Poin penting',
    ],
    body1: 'Kehamilan umumnya mencakup tiga USG utama, satu per trimester, masing-masing dengan tujuan yang berbeda.',
    ultrasounds: [
      'Trimester ke-1: penentuan usia kehamilan dan pengukuran lipatan tengkuk (nuchal translucency)',
      'Trimester ke-2: USG morfologi',
      'Trimester ke-3: pertumbuhan dan posisi bayi',
    ],
    body2: 'Tes darah rutin memantau beberapa penanda penting sepanjang kehamilan:',
    bloodTests: [
      'Kadar zat besi, untuk mendeteksi kemungkinan anemia',
      'Skrining diabetes gestasional, umumnya sekitar trimester ke-2',
      'Golongan darah dan skrining antibodi tidak teratur',
      'Tes serologi (toksoplasmosis, rubela) tergantung status kekebalan tubuhmu',
    ],
    prepTips: [
      'Tuliskan pertanyaanmu saat terpikir, sebelum kamu lupa',
      'Bawa buku catatan pemantauan kehamilanmu ke setiap kunjungan',
      'Sebutkan setiap gejala baru, meskipun tampak sepele',
    ],
    neutralText: 'Jumlah dan jadwal pemeriksaan yang pasti bisa berbeda tergantung perawatanmu, profil risikomu, dan praktik di negaramu atau di tempatmu berobat.',
    tipTitle: 'Perlu diketahui',
    tipText: 'Jangan ragu menuliskan pertanyaanmu sebelum setiap kunjungan agar tidak ada yang terlupa saat itu: tidak ada pertanyaan yang terlalu kecil untuk diajukan.',
    shareMessage: 'Kalender pemeriksaan kehamilan — AWA',
  },
  hi: {
    badge: 'गर्भावस्था • चिकित्सकीय फ़ॉलो-अप',
    title: 'गर्भावस्था की जाँचों\nका कैलेंडर',
    metaDuration: '6 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'जाँची गई जानकारी',
    intro: 'अल्ट्रासाउंड और ज़रूरी टेस्ट, तिमाही-दर-तिमाही।',
    contentsTitle: 'इस लेख में',
    topics: [
      'फ़ॉलो-अप अल्ट्रासाउंड',
      'ज़रूरी ब्लड टेस्ट',
      'हर अपॉइंटमेंट की तैयारी',
      'ध्यान देने लायक बातें',
      'मुख्य बातें',
    ],
    body1: 'गर्भावस्था में आमतौर पर तीन मुख्य अल्ट्रासाउंड होते हैं, हर तिमाही में एक, और हर एक का उद्देश्य अलग होता है।',
    ultrasounds: [
      'पहली तिमाही: गर्भ की उम्र का निर्धारण और न्यूकल ट्रांसलूसेंसी',
      'दूसरी तिमाही: मॉर्फ़ोलॉजी अल्ट्रासाउंड',
      'तीसरी तिमाही: शिशु की बढ़त और उसकी स्थिति',
    ],
    body2: 'नियमित ब्लड टेस्ट पूरी गर्भावस्था के दौरान कई ज़रूरी मापदंडों पर नज़र रखते हैं:',
    bloodTests: [
      'आयरन का स्तर, ताकि संभावित एनीमिया की जाँच हो सके',
      'गर्भावधि मधुमेह की जाँच, आमतौर पर दूसरी तिमाही के आसपास',
      'ब्लड ग्रुप और अनियमित एंटीबॉडी की जाँच',
      'सीरोलॉजी टेस्ट (टॉक्सोप्लाज़मोसिस, रूबेला), आपकी प्रतिरक्षा की स्थिति के अनुसार',
    ],
    prepTips: [
      'सवाल जैसे ही मन में आएँ, उन्हें लिख लें, ताकि भूल न जाएँ',
      'हर अपॉइंटमेंट में अपनी गर्भावस्था फ़ॉलो-अप की किताब साथ ले जाएँ',
      'कोई भी नया लक्षण बताएँ, भले ही वह मामूली लगे',
    ],
    neutralText: 'जाँचों की सही संख्या और समय-सारणी आपकी देखभाल, आपके जोखिम की स्थिति और आपके देश या स्वास्थ्य सेवा प्रदाता की प्रथाओं के अनुसार अलग हो सकती है।',
    tipTitle: 'जानना अच्छा रहेगा',
    tipText: 'हर अपॉइंटमेंट से पहले अपने सवाल लिखने में संकोच न करें, ताकि उस समय कुछ छूट न जाए: कोई भी सवाल पूछने के लिए छोटा नहीं होता।',
    shareMessage: 'गर्भावस्था की जाँचों का कैलेंडर — AWA',
  },
  sq: {
    badge: 'SHTATZËNIA • NDJEKJA MJEKËSORE',
    title: 'Kalendari i ekzaminimeve\ntë shtatzënisë',
    metaDuration: '6 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Ekografitë dhe analizat thelbësore, tremujor pas tremujori.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Ekografitë e ndjekjes',
      'Analizat thelbësore të gjakut',
      'Përgatitja për çdo vizitë',
      'Për t’u theksuar',
      'Pikat kryesore',
    ],
    body1: 'Shtatzënia përfshin përgjithësisht tri ekografi kryesore, një për çdo tremujor, secila me qëllim të ndryshëm.',
    ultrasounds: [
      'Tremujori i 1-rë: datimi dhe transparenca nukale',
      'Tremujori i 2-të: ekografia morfologjike',
      'Tremujori i 3-të: rritja dhe pozicioni i bebes',
    ],
    body2: 'Analizat e rregullta të gjakut monitorojnë disa tregues kyç gjatë shtatzënisë:',
    bloodTests: [
      'Nivelet e hekurit, për të zbuluar anemi të mundshme',
      'Kontrolli për diabetin e shtatzënisë, përgjithësisht rreth tremujorit të 2-të',
      'Grupi i gjakut dhe kontrolli për antitrupa të parregullt',
      'Analizat serologjike (toksoplazmoza, rubeola) sipas statusit tënd imunitar',
    ],
    prepTips: [
      'Shkruaji pyetjet kur të vijnë në mendje, para se t’i harrosh',
      'Merr me vete librezën e ndjekjes së shtatzënisë në çdo vizitë',
      'Përmend çdo simptomë të re, edhe nëse duket e vogël',
    ],
    neutralText: 'Numri dhe orari i saktë i ekzaminimeve mund të ndryshojë sipas ndjekjes sate, profilit tënd të rrezikut dhe praktikave të vendit ose të ofruesit tënd të kujdesit.',
    tipTitle: 'Mirë është ta dish',
    tipText: 'Mos ngurro t’i shkruash pyetjet para çdo vizite që të mos harrosh asgjë në çast: asnjë pyetje nuk është shumë e vogël për t’u bërë.',
    shareMessage: 'Kalendari i ekzaminimeve të shtatzënisë — AWA',
  },
  ja: {
    badge: '妊娠 • 妊婦健診',
    title: '妊娠中の検査\nスケジュール',
    metaDuration: '読了6分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '監修済みの内容',
    intro: '超音波検査と大切な検査を、妊娠初期・中期・後期ごとに紹介します。',
    contentsTitle: 'この記事の内容',
    topics: [
      '経過をみる超音波検査',
      '大切な血液検査',
      '健診の準備',
      '知っておきたいこと',
      'ポイントのまとめ',
    ],
    body1: '妊娠中は一般的に、妊娠初期・中期・後期にそれぞれ1回ずつ、合計3回のおもな超音波検査があり、目的はそれぞれ異なります。',
    ultrasounds: [
      '妊娠初期：妊娠週数の確認と、NT（胎児の首の後ろのむくみ）の確認',
      '妊娠中期：胎児の形態を調べる超音波検査',
      '妊娠後期：成長の様子と、赤ちゃんの位置の確認',
    ],
    body2: '妊娠中は、定期的な血液検査で、いくつかの大切な項目を確認します。',
    bloodTests: [
      '鉄分の値：貧血の可能性を調べるため',
      '妊娠糖尿病のスクリーニング：一般的に妊娠中期ごろ',
      '血液型と不規則抗体のスクリーニング',
      '血清検査（トキソプラズマ症、風疹）：免疫の状態によって異なる',
    ],
    prepTips: [
      '気になったことは、忘れる前に書き留めておく',
      '毎回の健診に母子健康手帳を持っていく',
      '新しい症状は、小さなことに思えても伝える',
    ],
    neutralText: '検査の正確な回数やスケジュールは、受けるケア、リスクの状況、お住まいの国や医療機関の方針によって異なることがあります。',
    tipTitle: '知っておきたいこと',
    tipText: 'その場で忘れてしまわないよう、健診の前に質問を書き出しておきましょう。小さすぎて聞けない質問はありません。',
    shareMessage: '妊娠中の検査スケジュール — AWA',
  },
  ko: {
    badge: '임신 • 의료 관리',
    title: '임신 중\n검사 일정',
    metaDuration: '6분 읽기',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '임신 초기, 중기, 후기별 초음파와 필수 검사를 알아봐요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '경과 관찰 초음파',
      '필수 혈액 검사',
      '각 진료 준비하기',
      '참고할 점',
      '핵심 정리',
    ],
    body1: '임신 중에는 보통 초기, 중기, 후기에 한 번씩 총 세 번의 주요 초음파 검사를 받아요. 각각 목적이 달라요.',
    ultrasounds: [
      '임신 초기: 임신 주수 확인과 목덜미 투명대 검사',
      '임신 중기: 정밀 초음파(형태 검사)',
      '임신 후기: 성장 상태와 아기의 자세 확인',
    ],
    body2: '정기적인 혈액 검사로 임신 기간 내내 여러 주요 지표를 확인해요.',
    bloodTests: [
      '빈혈 가능성을 확인하기 위한 철분 수치',
      '보통 임신 중기 무렵에 하는 임신성 당뇨 선별 검사',
      '혈액형 및 불규칙 항체 선별 검사',
      '면역 상태에 따른 혈청 검사(톡소플라스마증, 풍진)',
    ],
    prepTips: [
      '궁금한 점이 생길 때마다 잊기 전에 적어 두어요',
      '진료 때마다 임신 관리 수첩을 가져가요',
      '사소해 보이더라도 새로운 증상이 있으면 꼭 이야기해요',
    ],
    neutralText: '검사의 정확한 횟수와 일정은 받는 진료, 위험 요인, 나라나 의료기관의 방식에 따라 달라질 수 있어요.',
    tipTitle: '알아 두면 좋아요',
    tipText: '진료 전에 궁금한 점을 적어 두면 그 자리에서 잊지 않을 수 있어요. 너무 사소해서 묻지 못할 질문은 없어요.',
    shareMessage: '임신 중 검사 일정 — AWA',
  },
  'pt-PT': {
    badge: 'GRAVIDEZ • ACOMPANHAMENTO MÉDICO',
    title: 'O calendário de exames\nda gravidez',
    metaDuration: '6 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Ecografias e análises essenciais, trimestre a trimestre.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Ecografias de acompanhamento',
      'Análises ao sangue essenciais',
      'Preparar cada consulta',
      'A ter em conta',
      'Pontos essenciais',
    ],
    body1: 'A gravidez inclui geralmente três ecografias principais, uma por trimestre, cada uma com uma finalidade diferente.',
    ultrasounds: [
      '1.º trimestre: datação e translucência da nuca',
      '2.º trimestre: ecografia morfológica',
      '3.º trimestre: crescimento e posição do bebé',
    ],
    body2: 'As análises ao sangue regulares monitorizam vários marcadores importantes ao longo da gravidez:',
    bloodTests: [
      'Níveis de ferro, para detetar uma possível anemia',
      'Rastreio da diabetes gestacional, geralmente por volta do 2.º trimestre',
      'Grupo sanguíneo e pesquisa de anticorpos irregulares',
      'Análises serológicas (toxoplasmose, rubéola) consoante o seu estado imunitário',
    ],
    prepTips: [
      'Anote as suas perguntas à medida que lhe surgirem, antes que se esqueça delas',
      'Leve o boletim de saúde da grávida a todas as consultas',
      'Mencione qualquer sintoma novo, mesmo que pareça menor',
    ],
    neutralText: 'O número exato e o calendário dos exames podem variar consoante o seu acompanhamento, o seu perfil de risco e as práticas do seu país ou do prestador de cuidados.',
    tipTitle: 'Bom saber',
    tipText: 'Não hesite em anotar as suas perguntas antes de cada consulta para não se esquecer de nada no momento: nenhuma pergunta é pequena demais.',
    shareMessage: 'O calendário de exames da gravidez — AWA',
  },
  bn: {
    badge: 'গর্ভাবস্থা • চিকিৎসা ফলোআপ',
    title: 'গর্ভাবস্থার পরীক্ষার\nক্যালেন্ডার',
    metaDuration: 'পড়তে 6 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'প্রতিটি ত্রৈমাসিকের আলট্রাসাউন্ড ও জরুরি পরীক্ষা।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'ফলোআপ আলট্রাসাউন্ড',
      'জরুরি রক্তপরীক্ষা',
      'প্রতিটি অ্যাপয়েন্টমেন্টের প্রস্তুতি',
      'উল্লেখযোগ্য বিষয়',
      'মূল কথা',
    ],
    body1: 'গর্ভাবস্থায় সাধারণত তিনটি প্রধান আলট্রাসাউন্ড করা হয়, প্রতি ত্রৈমাসিকে একটি, এবং প্রতিটির উদ্দেশ্য আলাদা।',
    ultrasounds: [
      'প্রথম ত্রৈমাসিক: গর্ভকাল নির্ণয় ও নুকাল ট্রান্সলুসেন্সি',
      'দ্বিতীয় ত্রৈমাসিক: গঠন (মরফোলজি) আলট্রাসাউন্ড',
      'তৃতীয় ত্রৈমাসিক: বৃদ্ধি ও শিশুর অবস্থান',
    ],
    body2: 'নিয়মিত রক্তপরীক্ষায় গর্ভাবস্থাজুড়ে বেশ কয়েকটি মূল সূচক পর্যবেক্ষণ করা হয়:',
    bloodTests: [
      'আয়রনের মাত্রা, সম্ভাব্য রক্তস্বল্পতা শনাক্ত করার জন্য',
      'গর্ভকালীন ডায়াবেটিস স্ক্রিনিং, সাধারণত দ্বিতীয় ত্রৈমাসিকের আশপাশে',
      'রক্তের গ্রুপ এবং অনিয়মিত অ্যান্টিবডি স্ক্রিনিং',
      'সেরোলজি পরীক্ষা (টক্সোপ্লাজমোসিস, রুবেলা), আপনার রোগ-প্রতিরোধ অবস্থা অনুযায়ী',
    ],
    prepTips: [
      'প্রশ্নগুলো মনে আসামাত্র লিখে রাখুন, যাতে ভুলে না যান',
      'প্রতিটি অ্যাপয়েন্টমেন্টে আপনার গর্ভাবস্থার ফলোআপ বইটি সঙ্গে নিন',
      'নতুন কোনো উপসর্গ দেখা দিলে, তা সামান্য মনে হলেও জানান',
    ],
    neutralText: 'পরীক্ষার সঠিক সংখ্যা ও সময়সূচি আপনার চিকিৎসাসেবা, ঝুঁকির মাত্রা এবং আপনার দেশ বা স্বাস্থ্যসেবা প্রদানকারীর রীতি অনুযায়ী ভিন্ন হতে পারে।',
    tipTitle: 'জেনে রাখা ভালো',
    tipText: 'প্রতিটি অ্যাপয়েন্টমেন্টের আগে প্রশ্নগুলো লিখে রাখতে দ্বিধা করবেন না, যাতে সেই মুহূর্তে কিছু ভুলে না যান: কোনো প্রশ্নই জিজ্ঞাসা করার জন্য ছোট নয়।',
    shareMessage: 'গর্ভাবস্থার পরীক্ষার ক্যালেন্ডার — AWA',
  },
  da: {
    badge: 'GRAVIDITET • MEDICINSK OPFØLGNING',
    title: 'Kalender over\ngraviditetsundersøgelser',
    metaDuration: '6 min læsning',
    metaType: 'Guide',
    metaLevel: 'Grundlæggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Ultralyd og vigtige undersøgelser i hvert trimester.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Opfølgende ultralyd',
      'Vigtige blodprøver',
      'Forberedelse til hver aftale',
      'Vigtige bemærkninger',
      'Vigtige pointer',
    ],
    body1: 'Under graviditeten foretages der typisk tre større ultralyd, én pr. trimester, og hver har sit eget formål.',
    ultrasounds: [
      '1. trimester: fastsættelse af gestationsalder og nakkefoldsmåling',
      '2. trimester: morfologisk ultralyd (strukturscan)',
      '3. trimester: vækst og barnets stilling',
    ],
    body2: 'Regelmæssige blodprøver overvåger flere nøgleparametre gennem hele graviditeten:',
    bloodTests: [
      'Jernniveau for at opdage eventuel blodmangel',
      'Screening for svangerskabsdiabetes, typisk omkring 2. trimester',
      'Blodtype og screening for uregelmæssige antistoffer',
      'Serologi (toxoplasmose, røde hunde) afhængigt af din immunstatus',
    ],
    prepTips: [
      'Skriv dine spørgsmål ned, så snart du tænker på dem, så du ikke glemmer dem',
      'Tag din graviditetsopfølgningsbog med til hver aftale',
      'Nævn alle nye symptomer, selv dem der virker ubetydelige',
    ],
    neutralText: 'Det nøjagtige antal undersøgelser og tidspunkter kan variere afhængigt af din sundhedsordning, risikoniveau og dit lands eller udbyders praksis.',
    tipTitle: 'Godt at vide',
    tipText: 'Tøv ikke med at skrive dine spørgsmål ned inden hver aftale, så du ikke glemmer noget i øjeblikket: intet spørgsmål er for lille at stille.',
    shareMessage: 'Kalender over graviditetsundersøgelser — AWA',
  },
  sv: {
    badge: 'GRAVIDITET • MEDICINSK OPFÖLGNING',
    title: 'Kalender over\ngraviditetsundersögelser',
    metaDuration: '6 min läsning',
    metaType: 'Guide',
    metaLevel: 'Grundläggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Ultralyd och vigtige undersögelser i hvert trimester.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Opfölgende ultralyd',
      'Vigtige blodpröver',
      'Forberedelse till hver aftale',
      'Vigtige bemärkninger',
      'Vigtige pointer',
    ],
    body1: 'Under graviditeten foretages der typisk tre större ultralyd, én pr. trimester, och hver har sit eget formål.',
    ultrasounds: [
      '1. trimester: fastsättelse av gestationsalder och nakkefoldsmåling',
      '2. trimester: morfologisk ultralyd (strukturscan)',
      '3. trimester: väkst och barnets stilling',
    ],
    body2: 'Regelmässige blodpröver overvåger flere nögleparametre gennem hele graviditeten:',
    bloodTests: [
      'Jernniveau for att opdage eventuel blodmangel',
      'Screening for svangerskabsdiabetes, typisk omkring 2. trimester',
      'Blodtype och screening for uregelmässige antistoffer',
      'Serologi (toxoplasmose, röde hunde) afhängigt av din immunstatus',
    ],
    prepTips: [
      'Skriv dina spörgsmål ned, så snart du tänker på dem, så du inte glemmer dem',
      'Tag din graviditetsopfölgningsbog med till hver aftale',
      'Nävn alla nye symtom, selv dem der virker ubetydelige',
    ],
    neutralText: 'Det nöjagtige antal undersögelser och tidspunkter kan variere afhängigt av din halsasordning, risikoniveau och ditt lands eller udbyders praksis.',
    tipTitle: 'Godt at vide',
    tipText: 'Töv inte med at skrive dina spörgsmål ned inden hver aftale, så du inte glemmer noget i öjeblikket: intet spörgsmål ar for lille at stille.',
    shareMessage: 'Kalender over graviditetsundersögelser — AWA',
  },
  nb: {
    badge: 'SVANGERSKAP • MEDISINSK OPPFØLGING',
    title: 'Oversikt over\nsvangerskapskontrollene',
    metaDuration: '6 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Ultralyd og viktige prøver, trimester for trimester.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Ultralyd under oppfølgingen',
      'Viktige blodprøver',
      'Forberede hver time',
      'Verdt å merke seg',
      'Det viktigste å huske',
    ],
    body1:
      'Et svangerskap omfatter vanligvis tre hovedultralyder, én per trimester, hver med et ulikt formål.',
    ultrasounds: [
      '1. trimester: datering og nakkeoppklaring',
      '2. trimester: morfologisk ultralyd',
      '3. trimester: vekst og babyens leie',
    ],
    body2:
      'Regelmessige blodprøver følger flere viktige markører gjennom svangerskapet:',
    bloodTests: [
      'Jernnivå, for å oppdage mulig blodmangel',
      'Screening for svangerskapsdiabetes, vanligvis rundt 2. trimester',
      'Blodtype og screening for irregulære antistoffer',
      'Serologiske prøver (toksoplasmose, røde hunder) avhengig av immunstatusen din',
    ],
    prepTips: [
      'Skriv ned spørsmålene dine etter hvert som de dukker opp, før du glemmer dem',
      'Ta med svangerskapskortet til hver time',
      'Nevn ethvert nytt symptom, selv om det virker lite',
    ],
    neutralText:
      'Det nøyaktige antallet og tidspunktet for undersøkelsene kan variere avhengig av oppfølgingen din, risikoprofilen din og praksisen i landet eller hos behandleren din.',
    tipTitle: 'Godt å vite',
    tipText:
      'Ikke nøl med å skrive ned spørsmålene dine før hver time, slik at du ikke glemmer noe i øyeblikket: ingen spørsmål er for små til å stille.',
    shareMessage: 'Oversikt over svangerskapskontrollene – AWA',
  },
  pl: {
    badge: 'CIĄŻA • OPIEKA MEDYCZNA',
    title: 'Kalendarz badań\nw ciąży',
    metaDuration: '6 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'USG i podstawowe badania, trymestr po trymestrze.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Kontrolne badania USG',
      'Podstawowe badania krwi',
      'Przygotowanie do każdej wizyty',
      'Warto wiedzieć',
      'Najważniejsze wnioski',
    ],
    body1:
      'Ciąża obejmuje zazwyczaj trzy główne badania USG, po jednym w każdym trymestrze, każde z innym celem.',
    ultrasounds: [
      '1. trymestr: datowanie ciąży i przezierność karkowa',
      '2. trymestr: USG połówkowe',
      '3. trymestr: wzrost i ułożenie dziecka',
    ],
    body2:
      'Regularne badania krwi monitorują kilka kluczowych parametrów przez całą ciążę:',
    bloodTests: [
      'Poziom żelaza, aby wykryć ewentualną anemię',
      'Badanie w kierunku cukrzycy ciążowej, zwykle około 2. trymestru',
      'Grupa krwi i badanie przeciwciał odpornościowych',
      'Badania serologiczne (toksoplazmoza, różyczka) w zależności od Twojej odporności',
    ],
    prepTips: [
      'Zapisuj pytania, gdy tylko przyjdą Ci do głowy, zanim je zapomnisz',
      'Zabieraj na każdą wizytę kartę przebiegu ciąży',
      'Wspominaj o każdym nowym objawie, nawet jeśli wydaje się błahy',
    ],
    neutralText:
      'Dokładna liczba i harmonogram badań mogą się różnić w zależności od opieki, profilu ryzyka oraz praktyk w Twoim kraju lub placówce.',
    tipTitle: 'Warto wiedzieć',
    tipText:
      'Nie wahaj się zapisywać pytań przed każdą wizytą, by niczego nie zapomnieć: żadne pytanie nie jest zbyt małe.',
    shareMessage: 'Kalendarz badań w ciąży — AWA',
  },
  uk: {
    badge: 'ВАГІТНІСТЬ • МЕДИЧНИЙ НАГЛЯД',
    title: 'Календар обстежень\nпід час вагітності',
    metaDuration: '6 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'УЗД та основні аналізи, триместр за триместром.',
    contentsTitle: 'У цій статті',
    topics: [
      'Контрольні УЗД',
      'Основні аналізи крові',
      'Підготовка до кожного візиту',
      'Варто знати',
      'Головні висновки',
    ],
    body1:
      'Вагітність зазвичай включає три основні УЗД, по одному в кожному триместрі, кожне з іншою метою.',
    ultrasounds: [
      '1-й триместр: датування та комірцевий простір',
      '2-й триместр: УЗД анатомії плода',
      '3-й триместр: ріст і положення дитини',
    ],
    body2:
      'Регулярні аналізи крові стежать за кількома ключовими показниками протягом вагітності:',
    bloodTests: [
      'Рівень заліза — для виявлення можливої анемії',
      'Скринінг гестаційного діабету, зазвичай близько 2-го триместру',
      'Група крові та скринінг нерегулярних антитіл',
      'Серологічні аналізи (токсоплазмоз, краснуха) залежно від вашого імунного статусу',
    ],
    prepTips: [
      'Записуйте запитання, щойно вони виникають, поки не забули',
      'Беріть на кожен візит обмінну карту вагітної',
      'Згадуйте про будь-який новий симптом, навіть якщо він здається незначним',
    ],
    neutralText:
      'Точна кількість і графік обстежень можуть відрізнятися залежно від вашого догляду, профілю ризику та практики у вашій країні чи закладі.',
    tipTitle: 'Варто знати',
    tipText:
      'Не вагайтеся записувати запитання перед кожним візитом, щоб нічого не забути в потрібну мить: жодне запитання не буває надто малим.',
    shareMessage: 'Календар обстежень під час вагітності — AWA',
  },
  cs: {
    badge: 'TĚHOTENSTVÍ • LÉKAŘSKÉ SLEDOVÁNÍ',
    title: 'Kalendář těhotenských\nprohlídek',
    metaDuration: '6 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Ultrazvuky a základní testy, trimestr po trimestru.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Kontrolní ultrazvuky',
      'Základní krevní testy',
      'Příprava na jednotlivé návštěvy',
      'Stojí za zmínku',
      'Hlavní poznatky',
    ],
    body1:
      'Těhotenství obecně zahrnuje tři hlavní ultrazvuky, jeden za trimestr, z nichž každý má jiný účel.',
    ultrasounds: [
      '1. trimestr: datování a nuchální translucence',
      '2. trimestr: morfologický ultrazvuk',
      '3. trimestr: růst a poloha miminka',
    ],
    body2:
      'Pravidelné krevní testy sledují během těhotenství několik klíčových ukazatelů:',
    bloodTests: [
      'Hladina železa, ke zjištění možné anémie',
      'Screening těhotenské cukrovky, obecně kolem 2. trimestru',
      'Krevní skupina a screening nepravidelných protilátek',
      'Sérologické testy (toxoplazmóza, zarděnky) podle vašeho imunitního stavu',
    ],
    prepTips: [
      'Zapisujte si otázky, jakmile vás napadnou, než na ně zapomenete',
      'Na každou návštěvu noste těhotenskou průkazku',
      'Zmiňte každý nový příznak, i když se zdá nepodstatný',
    ],
    neutralText:
      'Přesný počet a rozvrh vyšetření se může lišit podle vaší péče, rizikového profilu a praxe ve vaší zemi nebo u vašeho poskytovatele péče.',
    tipTitle: 'Stojí za to vědět',
    tipText:
      'Neváhejte si před každou návštěvou zapsat otázky, abyste na nic nezapomněla: žádná otázka není příliš malá.',
    shareMessage: 'Kalendář těhotenských prohlídek — AWA',
  },
  sk: {
    badge: 'TEHOTENSTVO • LEKÁRSKE SLEDOVANIE',
    title: 'Kalendár vyšetrení\nv tehotenstve',
    metaDuration: '6 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Ultrazvuky a základné vyšetrenia, trimester po trimestri.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Kontrolné ultrazvuky',
      'Základné krvné testy',
      'Príprava na každú návštevu',
      'Stojí za povšimnutie',
      'Hlavné body',
    ],
    body1:
      'Tehotenstvo zvyčajne zahŕňa tri hlavné ultrazvuky, jeden v každom trimestri, každý s iným účelom.',
    ultrasounds: [
      '1. trimester: určenie veku tehotenstva a nuchálna translucencia',
      '2. trimester: morfologický ultrazvuk',
      '3. trimester: rast a poloha bábätka',
    ],
    body2:
      'Pravidelné krvné testy sledujú počas tehotenstva niekoľko kľúčových ukazovateľov:',
    bloodTests: [
      'Hladina železa, na odhalenie možnej anémie',
      'Skríning gestačného diabetu, zvyčajne okolo druhého trimestra',
      'Krvná skupina a skríning nepravidelných protilátok',
      'Sérologické testy (toxoplazmóza, rubeola) podľa vášho imunitného stavu',
    ],
    prepTips: [
      'Zapisujte si otázky hneď, ako vás napadnú, kým na ne nezabudnete',
      'Na každú návštevu si vezmite tehotenskú knižku',
      'Spomeňte každý nový príznak, aj keď sa zdá nepodstatný',
    ],
    neutralText:
      'Presný počet a rozvrh vyšetrení sa môže líšiť podľa vašej starostlivosti, rizikového profilu a praxe vašej krajiny alebo poskytovateľa starostlivosti.',
    tipTitle: 'Stojí za to vedieť',
    tipText:
      'Neváhajte si pred každou návštevou zapísať otázky, aby ste v danej chvíli na nič nezabudli: žiadna otázka nie je príliš malá.',
    shareMessage: 'Kalendár vyšetrení v tehotenstve — AWA',
  },
  hu: {
    badge: 'TERHESSÉG • ORVOSI KÖVETÉS',
    title: 'A terhességi vizsgálatok\nnaptára',
    metaDuration: '6 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Ultrahangok és alapvető vizsgálatok, trimeszterről trimeszterre.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Kontroll ultrahangok',
      'Alapvető vérvizsgálatok',
      'Felkészülés minden időpontra',
      'Érdemes megjegyezni',
      'Legfontosabb tudnivalók',
    ],
    body1:
      'A terhesség általában három fő ultrahangot tartalmaz, trimeszterenként egyet, amelyek mindegyikének más a célja.',
    ultrasounds: [
      '1. trimeszter: életkor-meghatározás és tarkóredő-vizsgálat',
      '2. trimeszter: morfológiai ultrahang',
      '3. trimeszter: növekedés és a baba elhelyezkedése',
    ],
    body2:
      'A rendszeres vérvizsgálatok a terhesség során több kulcsfontosságú mutatót követnek:',
    bloodTests: [
      'Vasszint, a lehetséges vérszegénység szűrésére',
      'Terhességi cukorbetegség szűrése, általában a 2. trimeszter körül',
      'Vércsoport és rendellenes ellenanyagok szűrése',
      'Szerológiai vizsgálatok (toxoplazmózis, rubeola) az immunstátuszodtól függően',
    ],
    prepTips: [
      'Írd fel a kérdéseidet, ahogy eszedbe jutnak, mielőtt elfelejtenéd őket',
      'Vidd magaddal a terhesgondozási könyvedet minden időpontra',
      'Említs meg minden új tünetet, még ha jelentéktelennek is tűnik',
    ],
    neutralText:
      'A vizsgálatok pontos száma és ütemezése a gondozásodtól, a kockázati profilodtól, valamint az országod vagy az ellátód gyakorlatától függően eltérhet.',
    tipTitle: 'Érdemes tudni',
    tipText:
      'Ne habozz felírni a kérdéseidet minden időpont előtt, hogy a pillanatban semmiről ne feledkezz meg: egyetlen kérdés sem túl kicsi ahhoz, hogy feltedd.',
    shareMessage: 'A terhességi vizsgálatok naptára — AWA',
  },
  ro: {
    badge: 'SARCINĂ • URMĂRIRE MEDICALĂ',
    title: 'Calendarul controalelor\ndin sarcină',
    metaDuration: '6 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Ecografiile și analizele esențiale, trimestru după trimestru.',
    contentsTitle: 'În acest articol',
    topics: [
      'Ecografiile de urmărire',
      'Analizele de sânge esențiale',
      'Pregătirea pentru fiecare consultație',
      'De reținut',
      'Ce să reții',
    ],
    body1:
      'O sarcină include în general trei ecografii principale, câte una pe trimestru, fiecare cu un scop diferit.',
    ultrasounds: [
      'Trimestrul 1: datarea și translucența nucală',
      'Trimestrul 2: ecografia morfologică',
      'Trimestrul 3: creșterea și poziția bebelușului',
    ],
    body2:
      'Analizele de sânge regulate urmăresc mai mulți markeri-cheie pe parcursul sarcinii:',
    bloodTests: [
      'Nivelul de fier, pentru depistarea unei posibile anemii',
      'Depistarea diabetului gestațional, în general în jurul trimestrului 2',
      'Grupa sanguină și depistarea anticorpilor neregulați',
      'Teste serologice (toxoplasmoză, rubeolă), în funcție de statutul tău imunitar',
    ],
    prepTips: [
      'Notează-ți întrebările pe măsură ce îți vin, înainte să le uiți',
      'Adu carnetul de urmărire a sarcinii la fiecare consultație',
      'Menționează orice simptom nou, chiar dacă pare minor',
    ],
    neutralText:
      'Numărul și calendarul exact al controalelor pot varia în funcție de îngrijirea ta, de profilul tău de risc și de practicile din țara ta sau ale furnizorului de îngrijiri.',
    tipTitle: 'Bine de știut',
    tipText:
      'Nu ezita să-ți notezi întrebările înainte de fiecare consultație ca să nu uiți nimic pe moment: nicio întrebare nu este prea mică pentru a fi pusă.',
    shareMessage: 'Calendarul controalelor din sarcină — AWA',
  },
  bg: {
    badge: 'БРЕМЕННОСТ • МЕДИЦИНСКО ПРОСЛЕДЯВАНЕ',
    title: 'Календар на прегледите\nпо време на бременност',
    metaDuration: '6 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Основните ехографии и изследвания, триместър по триместър.',
    contentsTitle: 'В тази статия',
    topics: [
      'Проследяващи ехографии',
      'Основни кръвни изследвания',
      'Подготовка за всеки преглед',
      'Важно е да се отбележи',
      'Какво да запомниш',
    ],
    body1:
      'Бременността обикновено включва три основни ехографии, по една на триместър, всяка с различна цел.',
    ultrasounds: [
      '1-ви триместър: датиране и нухална транслуценция',
      '2-ри триместър: морфологична ехография',
      '3-ти триместър: растеж и положение на бебето',
    ],
    body2:
      'Редовните кръвни изследвания следят няколко ключови показателя през цялата бременност:',
    bloodTests: [
      'Нивото на желязо, за откриване на възможна анемия',
      'Скрининг за гестационен диабет, обикновено около втория триместър',
      'Кръвна група и скрининг за нередовни антитела',
      'Серологични изследвания (токсоплазмоза, рубеола), според имунния ти статус',
    ],
    prepTips: [
      'Записвай си въпросите, когато ти хрумнат, преди да ги забравиш',
      'Носи бременната си книжка на всеки преглед',
      'Спомени всеки нов симптом, дори да изглежда незначителен',
    ],
    neutralText:
      'Точният брой и график на прегледите могат да варират според грижите ти, рисковия ти профил и практиките на държавата ти или на доставчика на здравни грижи.',
    tipTitle: 'Добре е да знаеш',
    tipText:
      'Не се колебай да си записваш въпросите преди всеки преглед, за да не забравиш нищо в момента: никой въпрос не е твърде малък, за да бъде зададен.',
    shareMessage: 'Календар на прегледите по време на бременност — AWA',
  },
  sr: {
    badge: 'ТРУДНОЋА • МЕДИЦИНСКО ПРАЋЕЊЕ',
    title: 'Календар прегледа\nу трудноћи',
    metaDuration: '6 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Ултразвуци и основне анализе, триместар по триместар.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Ултразвуци за праћење',
      'Основне анализе крви',
      'Припрема за сваки преглед',
      'Вреди напоменути',
      'Шта да запамтиш',
    ],
    body1:
      'Трудноћа обично укључује три главна ултразвука, по један у сваком триместру, сваки са другачијом сврхом.',
    ultrasounds: [
      '1. триместар: датирање и нухална провидност',
      '2. триместар: морфолошки ултразвук',
      '3. триместар: раст и положај бебе',
    ],
    body2:
      'Редовне анализе крви прате неколико кључних показатеља током целе трудноће:',
    bloodTests: [
      'Ниво гвожђа, ради откривања могуће анемије',
      'Скрининг на гестациони дијабетес, обично око другог триместра',
      'Крвна група и скрининг на нередовна антитела',
      'Серолошке анализе (токсоплазмоза, рубеола), зависно од твог имунолошког статуса',
    ],
    prepTips: [
      'Записуј питања како ти падају на памет, пре него што их заборавиш',
      'Носи књижицу трудноће на сваки преглед',
      'Спомени сваки нови симптом, чак и ако делује безначајно',
    ],
    neutralText:
      'Тачан број и распоред прегледа могу варирати зависно од твоје неге, профила ризика и праксе твоје државе или пружаоца здравствене заштите.',
    tipTitle: 'Добро је знати',
    tipText:
      'Не оклевај да запишеш питања пре сваког прегледа да у тренутку ништа не заборавиш: ниједно питање није премало да би се поставило.',
    shareMessage: 'Календар прегледа у трудноћи — AWA',
  },
  hr: {
    badge: 'TRUDNOĆA • MEDICINSKO PRAĆENJE',
    title: 'Kalendar pretraga\ntijekom trudnoće',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Ultrazvuci i ključne pretrage, trimestar po trimestar.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Kontrolni ultrazvuci',
      'Ključne krvne pretrage',
      'Priprema za svaki pregled',
      'Vrijedi napomenuti',
      'Ključne poruke',
    ],
    body1:
      'Trudnoća općenito uključuje tri glavna ultrazvuka, po jedan u svakom trimestru, svaki s drugačijom svrhom.',
    ultrasounds: [
      '1. trimestar: datiranje i nuhalna translucencija',
      '2. trimestar: morfološki ultrazvuk',
      '3. trimestar: rast i položaj bebe',
    ],
    body2:
      'Redovite krvne pretrage prate nekoliko ključnih pokazatelja tijekom trudnoće:',
    bloodTests: [
      'Razina željeza, radi probira na moguću anemiju',
      'Probir na gestacijski dijabetes, općenito oko drugog trimestra',
      'Krvna grupa i probir na nepravilna protutijela',
      'Serološke pretrage (toksoplazmoza, rubeola) ovisno o imunosnom statusu',
    ],
    prepTips: [
      'Zapiši pitanja čim ti padnu na pamet, prije nego što ih zaboraviš',
      'Na svaki pregled ponesi trudničku knjižicu',
      'Spomeni svaki novi simptom, čak i ako se čini beznačajnim',
    ],
    neutralText:
      'Točan broj i raspored pretraga može se razlikovati ovisno o skrbi koju primaš, tvom profilu rizika i praksi tvoje države ili pružatelja skrbi.',
    tipTitle: 'Dobro je znati',
    tipText:
      'Ne oklijevaj zapisati pitanja prije svakog pregleda kako ne bi ništa zaboravila u trenutku: nijedno pitanje nije premalo da bi se postavilo.',
    shareMessage: 'Kalendar pretraga tijekom trudnoće — AWA',
  },
  bs: {
    badge: 'TRUDNOĆA • MEDICINSKO PRAĆENJE',
    title: 'Kalendar pretraga\ntijekom trudnoće',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Ultrazvuci i ključne pretrage, trimestar po trimestar.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Kontrolni ultrazvuci',
      'Ključne krvne pretrage',
      'Priprema za svaki pregled',
      'Vrijedi napomenuti',
      'Ključne poruke',
    ],
    body1:
      'Trudnoća općenito uključuje tri glavna ultrazvuka, po jedan u svakom trimestru, svaki s drugačijom svrhom.',
    ultrasounds: [
      '1. trimestar: datiranje i nuhalna translucencija',
      '2. trimestar: morfološki ultrazvuk',
      '3. trimestar: rast i položaj bebe',
    ],
    body2:
      'Redovite krvne pretrage prate nekoliko ključnih pokazatelja tokom trudnoće:',
    bloodTests: [
      'Razina željeza, radi probira na moguću anemiju',
      'Probir na gestacijski dijabetes, općenito oko drugog trimestra',
      'Krvna grupa i probir na nepravilna protutijela',
      'Serološke pretrage (toksoplazmoza, rubeola) ovisno o imunosnom statusu',
    ],
    prepTips: [
      'Zapiši pitanja čim ti padnu na pamet, prije nego što ih zaboraviš',
      'Na svaki pregled ponesi trudničku knjižicu',
      'Spomeni svaki novi simptom, čak i ako se čini beznačajnim',
    ],
    neutralText:
      'Točan broj i raspored pretraga može se razlikovati ovisno o skrbi koju primaš, tvom profilu rizika i praksi tvoje države ili pružatelja skrbi.',
    tipTitle: 'Dobro je znati',
    tipText:
      'Ne oklijevaj zapisati pitanja prije svakog pregleda kako ne bi ništa zaboravila u trenutku: nijedno pitanje nije premalo da bi se postavilo.',
    shareMessage: 'Kalendar pretraga tokom trudnoće — AWA',
  },
  sl: {
    badge: 'NOSEČNOST • ZDRAVNIŠKO SPREMLJANJE',
    title: 'Koledar preiskav\nmed nosečnostjo',
    metaDuration: '6 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Ultrazvoki in ključne preiskave, trimesečje za trimesečjem.',
    contentsTitle: 'V tem članku',
    topics: [
      'Kontrolni ultrazvoki',
      'Ključne krvne preiskave',
      'Priprava na vsak pregled',
      'Vredno omeniti',
      'Ključna sporočila',
    ],
    body1:
      'Nosečnost na splošno vključuje tri glavne ultrazvoke, po enega v vsakem trimesečju, vsak z drugačnim namenom.',
    ultrasounds: [
      '1. trimesečje: datiranje in nuhalna svetlina',
      '2. trimesečje: morfološki ultrazvok',
      '3. trimesečje: rast in položaj dojenčka',
    ],
    body2:
      'Redne krvne preiskave spremljajo več ključnih kazalnikov skozi nosečnost:',
    bloodTests: [
      'Raven železa, za presejanje morebitne slabokrvnosti',
      'Presejanje za gestacijski diabetes, na splošno okoli drugega trimesečja',
      'Krvna skupina in presejanje za nepravilna protitelesa',
      'Serološke preiskave (toksoplazmoza, rdečke) glede na imunski status',
    ],
    prepTips: [
      'Vprašanja si zapiši, takoj ko ti pridejo na misel, preden jih pozabiš',
      'Na vsak pregled vzemi nosečniško knjižico',
      'Omeni vsak nov simptom, tudi če se zdi nepomemben',
    ],
    neutralText:
      'Natančno število in razpored preiskav se lahko razlikuje glede na oskrbo, ki jo prejemaš, tvoj profil tveganja in prakso tvoje države ali izvajalca oskrbe.',
    tipTitle: 'Vredno vedeti',
    tipText:
      'Ne oklevaj zapisati vprašanj pred vsakim pregledom, da ne pozabiš ničesar v trenutku: nobeno vprašanje ni premajhno, da bi ga postavila.',
    shareMessage: 'Koledar preiskav med nosečnostjo — AWA',
  },
  ne: {
    badge: 'गर्भावस्था • चिकित्सकीय अनुगमन',
    title: 'गर्भावस्थाको जाँचको\nपात्रो',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'त्रैमासिकअनुसार अल्ट्रासाउन्ड र आवश्यक परीक्षणहरू।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'अनुगमनका अल्ट्रासाउन्डहरू',
      'आवश्यक रगत परीक्षणहरू',
      'हरेक भेटघाटको तयारी',
      'ध्यान दिन लायक',
      'मुख्य कुराहरू',
    ],
    body1:
      'गर्भावस्थामा सामान्यतया तीन मुख्य अल्ट्रासाउन्ड हुन्छन्, हरेक त्रैमासिकमा एउटा, जसमध्ये हरेकको फरक उद्देश्य हुन्छ।',
    ultrasounds: [
      'पहिलो त्रैमासिक: मिति निर्धारण र नुकल ट्रान्सल्युसेन्सी',
      'दोस्रो त्रैमासिक: आकारिकीय अल्ट्रासाउन्ड',
      'तेस्रो त्रैमासिक: वृद्धि र शिशुको स्थिति',
    ],
    body2:
      'नियमित रगत परीक्षणहरूले गर्भावस्थाभर धेरै मुख्य सूचकहरू निगरानी गर्छन्:',
    bloodTests: [
      'सम्भावित रक्तअल्पता जाँच्न आइरनको स्तर',
      'गर्भकालीन मधुमेहको जाँच, सामान्यतया दोस्रो त्रैमासिकतिर',
      'रक्त समूह र अनियमित एन्टिबडीको जाँच',
      'तपाईंको प्रतिरक्षा अवस्थाअनुसार सेरोलोजी परीक्षणहरू (टक्सोप्लाज्मोसिस, रुबेला)',
    ],
    prepTips: [
      'आफ्ना प्रश्नहरू मनमा आउनेबित्तिकै बिर्सनुअघि लेख्नुहोस्',
      'हरेक भेटघाटमा आफ्नो गर्भावस्था अनुगमन पुस्तिका ल्याउनुहोस्',
      'कुनै नयाँ लक्षण, सानो जस्तो लागे पनि, उल्लेख गर्नुहोस्',
    ],
    neutralText:
      'जाँचहरूको सही सङ्ख्या र तालिका तपाईंको हेरचाह, जोखिमको प्रोफाइल र तपाईंको देश वा हेरचाह प्रदायकका अभ्यासअनुसार फरक हुन सक्छ।',
    tipTitle: 'जान्न लायक',
    tipText:
      'हरेक भेटघाटअघि आफ्ना प्रश्नहरू लेख्न नहिच्किचाउनुहोस् ताकि क्षणमा केही नबिर्सनुहोस्: सोध्नका लागि कुनै प्रश्न धेरै सानो हुँदैन।',
    shareMessage: 'गर्भावस्थाको जाँचको पात्रो — AWA',
  },
  si: {
    badge: 'ගර්භණී කාලය • වෛද්‍ය පසු විපරම',
    title: 'ගර්භණී පරීක්ෂණ\nදින දර්ශනය',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ත්‍රෛමාසිකයෙන් ත්‍රෛමාසිකය අල්ට්‍රාසවුන්ඩ් සහ අත්‍යවශ්‍ය පරීක්ෂණ.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'පසු විපරම් අල්ට්‍රාසවුන්ඩ්',
      'අත්‍යවශ්‍ය රුධිර පරීක්ෂණ',
      'සෑම හමුවීමකටම සූදානම් වීම',
      'සටහන් කිරීම වටී',
      'ප්‍රධාන කරුණු',
    ],
    body1:
      'ගර්භණී කාලයට සාමාන්‍යයෙන් ප්‍රධාන අල්ට්‍රාසවුන්ඩ් තුනක් ඇතුළත් වේ, ත්‍රෛමාසිකයකට එකක්, සෑම එකකටම වෙනස් අරමුණක් ඇත.',
    ultrasounds: [
      '1 වන ත්‍රෛමාසිකය: දිනනිර්ණය සහ නීකල් පාරභාසකතාව',
      '2 වන ත්‍රෛමාසිකය: ආකෘති විද්‍යා අල්ට්‍රාසවුන්ඩ්',
      '3 වන ත්‍රෛමාසිකය: වර්ධනය සහ දරුවාගේ ඉරියව්ව',
    ],
    body2:
      'නිතිපතා රුධිර පරීක්ෂණ ගර්භණී කාලය පුරා ප්‍රධාන දර්ශක කිහිපයක් නිරීක්ෂණය කරයි:',
    bloodTests: [
      'ඇතිවිය හැකි රක්තහීනතාව පරීක්ෂා කිරීමට යකඩ මට්ටම්',
      'ගර්භණී දියවැඩියාව පරීක්ෂාව, සාමාන්‍යයෙන් 2 වන ත්‍රෛමාසිකය වටා',
      'රුධිර වර්ගය සහ අක්‍රමවත් ප්‍රතිදේහ පරීක්ෂාව',
      'ඔබේ ප්‍රතිශක්ති තත්ත්වය අනුව සෙරොලොජි පරීක්ෂණ (ටොක්සොප්ලාස්මෝසිස්, රුබෙල්ලා)',
    ],
    prepTips: [
      'ඔබේ ප්‍රශ්න අමතක වීමට පෙර, ඒවා ඔබට සිහිපත් වන විට ලියා තබන්න',
      'සෑම හමුවීමකටම ඔබේ ගර්භණී පසු විපරම් පොත රැගෙන එන්න',
      'සුළු සේ පෙනුණත්, ඕනෑම නව රෝග ලක්ෂණයක් සඳහන් කරන්න',
    ],
    neutralText:
      'පරීක්ෂණවල නිශ්චිත ගණන සහ කාලසටහන ඔබේ සත්කාරය, ඔබේ අවදානම් පැතිකඩ සහ ඔබේ රටේ හෝ සත්කාර සපයන්නාගේ පුරුදු අනුව වෙනස් විය හැක.',
    tipTitle: 'දැනගත යුතු දේ',
    tipText:
      'එම මොහොතේ කිසිවක් අමතක නොවන පරිදි සෑම හමුවීමකටම පෙර ඔබේ ප්‍රශ්න ලියා තැබීමට මැළි නොවන්න: අසන්නට නොහැකි තරම් කුඩා ප්‍රශ්නයක් නැත.',
    shareMessage: 'ගර්භණී පරීක්ෂණ දින දර්ශනය — AWA',
  },
  th: {
    badge: 'การตั้งครรภ์ • การติดตามทางการแพทย์',
    title: 'ปฏิทินการตรวจ\nครรภ์',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'อัลตราซาวนด์และการตรวจที่จำเป็น ในแต่ละไตรมาส',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'อัลตราซาวนด์ติดตามผล',
      'การตรวจเลือดที่จำเป็น',
      'เตรียมตัวสำหรับการนัดหมายแต่ละครั้ง',
      'ข้อควรทราบ',
      'ประเด็นสำคัญ',
    ],
    body1:
      'โดยทั่วไปการตั้งครรภ์มีอัลตราซาวนด์หลักสามครั้ง ไตรมาสละหนึ่งครั้ง แต่ละครั้งมีวัตถุประสงค์ต่างกัน',
    ultrasounds: [
      'ไตรมาสที่ 1: การกำหนดอายุครรภ์และการวัดความหนาของเนื้อเยื่อท้ายทอย',
      'ไตรมาสที่ 2: อัลตราซาวนด์ดูรูปร่างทารก',
      'ไตรมาสที่ 3: การเติบโตและท่าของทารก',
    ],
    body2:
      'การตรวจเลือดเป็นประจำเฝ้าติดตามตัวชี้วัดสำคัญหลายอย่างตลอดการตั้งครรภ์:',
    bloodTests: [
      'ระดับธาตุเหล็ก เพื่อคัดกรองภาวะโลหิตจางที่อาจเกิดขึ้น',
      'การคัดกรองเบาหวานขณะตั้งครรภ์ โดยทั่วไปราวไตรมาสที่ 2',
      'หมู่เลือดและการคัดกรองแอนติบอดีที่ผิดปกติ',
      'การตรวจทางซีรั่มวิทยา (toxoplasmosis, หัดเยอรมัน) ตามสถานะภูมิคุ้มกันของคุณ',
    ],
    prepTips: [
      'จดคำถามไว้เมื่อนึกขึ้นได้ ก่อนจะลืม',
      'นำสมุดบันทึกสุขภาพแม่และเด็กไปทุกครั้งที่นัดหมาย',
      'แจ้งอาการใหม่ใด ๆ แม้ดูเล็กน้อย',
    ],
    neutralText:
      'จำนวนและตารางการตรวจที่แน่นอนอาจแตกต่างกันไปตามการดูแล ระดับความเสี่ยงของคุณ และแนวปฏิบัติของประเทศหรือผู้ให้บริการของคุณ',
    tipTitle: 'ควรรู้',
    tipText:
      'อย่าลังเลที่จะจดคำถามก่อนการนัดหมายแต่ละครั้งเพื่อไม่ให้ลืมอะไรในขณะนั้น: ไม่มีคำถามใดเล็กเกินไปที่จะถาม',
    shareMessage: 'ปฏิทินการตรวจครรภ์ — AWA',
  },
  vi: {
    badge: 'THAI KỲ • THEO DÕI Y TẾ',
    title: 'Lịch khám\nthai kỳ',
    metaDuration: '6 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Các lần siêu âm và xét nghiệm thiết yếu, theo từng tam cá nguyệt.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Siêu âm theo dõi',
      'Xét nghiệm máu thiết yếu',
      'Chuẩn bị cho từng buổi hẹn',
      'Điều đáng lưu ý',
      'Điều cần nhớ',
    ],
    body1:
      'Thai kỳ thường gồm ba lần siêu âm chính, mỗi tam cá nguyệt một lần, mỗi lần có một mục đích khác nhau.',
    ultrasounds: [
      'Tam cá nguyệt 1: xác định tuổi thai và đo độ mờ da gáy',
      'Tam cá nguyệt 2: siêu âm hình thái',
      'Tam cá nguyệt 3: sự tăng trưởng và tư thế của em bé',
    ],
    body2:
      'Các xét nghiệm máu định kỳ theo dõi một số chỉ số quan trọng trong suốt thai kỳ:',
    bloodTests: [
      'Nồng độ sắt, để tầm soát thiếu máu có thể có',
      'Tầm soát tiểu đường thai kỳ, thường vào khoảng tam cá nguyệt 2',
      'Nhóm máu và tầm soát kháng thể bất thường',
      'Các xét nghiệm huyết thanh (toxoplasma, rubella) tùy theo tình trạng miễn dịch của bạn',
    ],
    prepTips: [
      'Ghi lại các câu hỏi khi chúng nảy ra, trước khi bạn quên',
      'Mang sổ theo dõi thai kỳ đến mỗi buổi hẹn',
      'Nói với bác sĩ về mọi triệu chứng mới, dù có vẻ nhỏ',
    ],
    neutralText:
      'Số lượng và lịch trình chính xác của các lần khám có thể khác nhau tùy theo việc chăm sóc của bạn, mức độ nguy cơ và thực hành của quốc gia hay cơ sở y tế của bạn.',
    tipTitle: 'Nên biết',
    tipText:
      'Đừng ngần ngại ghi lại các câu hỏi trước mỗi buổi hẹn để không quên điều gì vào lúc đó: không có câu hỏi nào là quá nhỏ để hỏi.',
    shareMessage: 'Lịch khám thai kỳ — AWA',
  },
  uz: {
    badge: 'HOMILADORLIK • TIBBIY NAZORAT',
    title: 'Homiladorlikni tekshirish\ntaqvimi',
    metaDuration: '6 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Muhim UZI va tahlillar, trimestrma-trimestr.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Nazorat UZI tekshiruvlari',
      'Muhim qon tahlillari',
      'Har bir qabulga tayyorgarlik',
      'Eʼtiborga loyiq jihatlar',
      'Asosiy xulosalar',
    ],
    body1:
      'Homiladorlik odatda uchta asosiy UZI ni oʻz ichiga oladi, har trimestrda bittadan, ularning har biri turli maqsadga ega.',
    ultrasounds: [
      '1-trimestr: muddatni aniqlash va yoqa boʻshligʻi qalinligi',
      '2-trimestr: morfologik UZI',
      '3-trimestr: oʻsish va chaqaloqning holati',
    ],
    body2:
      'Muntazam qon tahlillari homiladorlik davomida bir nechta asosiy koʻrsatkichni kuzatadi:',
    bloodTests: [
      'Mumkin boʻlgan kamqonlikni aniqlash uchun temir darajasi',
      'Gestatsion diabet skrining, odatda 2-trimestr atrofida',
      'Qon guruhi va notekis antitelalar skrining',
      'Immunitet holatingizga qarab serologik tahlillar (toksoplazmoz, qizilcha)',
    ],
    prepTips: [
      'Savollaringizni, ular esingizga kelganda, unutmasdan oldin yozib qoʻying',
      'Har bir qabulga homiladorlik nazorati daftarchasini olib boring',
      'Har qanday yangi alomatni, kichik tuyulsa ham, ayting',
    ],
    neutralText:
      'Tekshiruvlarning aniq soni va jadvali parvarishingizga, xavf profilingizga va mamlakatingiz yoki tibbiy xizmat koʻrsatuvchining amaliyotiga qarab farq qilishi mumkin.',
    tipTitle: 'Bilish foydali',
    tipText:
      'Muhim narsani unutmaslik uchun har bir qabuldan oldin savollaringizni yozib qoʻyishdan tortinmang: hech bir savol soʻrash uchun juda kichik emas.',
    shareMessage: 'Homiladorlikni tekshirish taqvimi — AWA',
  },
  az: {
    badge: 'HAMİLƏLİK • TİBBİ NƏZARƏT',
    title: 'Hamiləlik müayinələrinin\ntəqvimi',
    metaDuration: '6 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Trimestrdən trimestrə ultrasəslər və vacib testlər.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Nəzarət ultrasəsləri',
      'Vacib qan testləri',
      'Hər qəbula hazırlıq',
      'Qeyd etməyə dəyər',
      'Əsas nəticələr',
    ],
    body1:
      'Hamiləlik adətən hər trimestrə bir olmaqla üç əsas ultrasəsi ehtiva edir və hər birinin fərqli məqsədi var.',
    ultrasounds: [
      '1-ci trimestr: tarixləndirmə və boyun qatı qalınlığı',
      '2-ci trimestr: morfoloji ultrasəs',
      '3-cü trimestr: böyümə və körpənin vəziyyəti',
    ],
    body2:
      'Müntəzəm qan testləri hamiləlik boyu bir neçə əsas göstəricini izləyir:',
    bloodTests: [
      'Mümkün anemiyanı aşkar etmək üçün dəmir səviyyəsi',
      'Gestasion diabet skrininqi, adətən 2-ci trimestr ətrafında',
      'Qan qrupu və qeyri-müntəzəm anticisimlərin skrininqi',
      'İmmun vəziyyətinizdən asılı olaraq serologiya testləri (toksoplazmoz, qırmızıyanaq)',
    ],
    prepTips: [
      'Suallarınızı yadınıza düşdükcə, unutmamış yazın',
      'Hər qəbula hamiləlik nəzarət kitabçanızı gətirin',
      'Hər yeni simptomu, cüzi görünsə də, qeyd edin',
    ],
    neutralText:
      'Müayinələrin dəqiq sayı və cədvəli qayğınızdan, risk profilinizdən və ölkənizin və ya tibb müəssisənizin təcrübəsindən asılı olaraq dəyişə bilər.',
    tipTitle: 'Bilmək faydalıdır',
    tipText:
      'Həmin anda heç nəyi unutmamaq üçün suallarınızı hər qəbuldan əvvəl yazmaqdan çəkinməyin: verilməyəcək qədər kiçik sual yoxdur.',
    shareMessage: 'Hamiləlik müayinələrinin təqvimi — AWA',
  },
  ka: {
    badge: 'ორსულობა • სამედიცინო მეთვალყურეობა',
    title: 'ორსულობის გამოკვლევების\nკალენდარი',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'ულტრაბგერები და აუცილებელი ანალიზები, ტრიმესტრების მიხედვით.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'მეთვალყურეობის ულტრაბგერები',
      'აუცილებელი სისხლის ანალიზები',
      'თითოეული ვიზიტისთვის მომზადება',
      'აღსანიშნავია',
      'მთავარი დასკვნები',
    ],
    body1:
      'ორსულობა ზოგადად სამ ძირითად ულტრაბგერას მოიცავს, თითო ტრიმესტრში, რომელთაგან თითოეულს განსხვავებული დანიშნულება აქვს.',
    ultrasounds: [
      'I ტრიმესტრი: დათარიღება და კეფის ნაკეცის გამჭვირვალობა',
      'II ტრიმესტრი: მორფოლოგიური ულტრაბგერა',
      'III ტრიმესტრი: ზრდა და ბავშვის მდებარეობა',
    ],
    body2:
      'სისხლის რეგულარული ანალიზები ორსულობის განმავლობაში რამდენიმე ძირითად მარკერს აკონტროლებს:',
    bloodTests: [
      'რკინის დონე, შესაძლო ანემიის გამოსავლენად',
      'გესტაციური დიაბეტის სკრინინგი, ზოგადად II ტრიმესტრის გარშემო',
      'სისხლის ჯგუფისა და არარეგულარული ანტისხეულების სკრინინგი',
      'სეროლოგიური ტესტები (ტოქსოპლაზმოზი, წითელა) თქვენი იმუნური სტატუსის მიხედვით',
    ],
    prepTips: [
      'ჩაიწერეთ თქვენი კითხვები, როგორც კი გაგიჩნდებათ, სანამ დაგავიწყდებათ',
      'ყოველ ვიზიტზე თან წაიღეთ თქვენი ორსულობის მეთვალყურეობის წიგნაკი',
      'ახსენეთ ნებისმიერი ახალი სიმპტომი, თუნდაც უმნიშვნელოდ ჩანდეს',
    ],
    neutralText:
      'გამოკვლევების ზუსტი რაოდენობა და განრიგი შეიძლება განსხვავდებოდეს თქვენი მკურნალობის, რისკის პროფილისა და თქვენი ქვეყნის ან სამედიცინო დაწესებულების პრაქტიკის მიხედვით.',
    tipTitle: 'კარგია ვიცოდეთ',
    tipText:
      'ნუ დააყოვნებთ თქვენი კითხვების ჩაწერას ყოველი ვიზიტის წინ, რომ ამ მომენტში არაფერი დაგავიწყდეთ: არცერთი კითხვა არ არის ისე პატარა, რომ დასმა არ ღირდეს.',
    shareMessage: 'ორსულობის გამოკვლევების კალენდარი — AWA',
  },
  hy: {
    badge: 'ՀՂԻՈՒԹՅՈՒՆ • ԲԺՇԿԱԿԱՆ ՀՍԿՈՂՈՒԹՅՈՒՆ',
    title: 'Հղիության հետազոտությունների\nօրացույց',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ուլտրաձայնային և էական հետազոտություններ՝ եռամսյակ առ եռամսյակ:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Հսկողության ուլտրաձայնային հետազոտություններ',
      'Էական արյան անալիզներ',
      'Նախապատրաստվել յուրաքանչյուր այցին',
      'Հարկ է նշել',
      'Հիմնական եզրակացություններ',
    ],
    body1:
      'Հղիությունը սովորաբար ներառում է երեք հիմնական ուլտրաձայնային հետազոտություն՝ մեկական յուրաքանչյուր եռամսյակում, յուրաքանչյուրը տարբեր նպատակով:',
    ultrasounds: [
      '1-ին եռամսյակ. ժամկետի որոշում և օձիքային տարածության հաստություն',
      '2-րդ եռամսյակ. ձևաբանական ուլտրաձայնային հետազոտություն',
      '3-րդ եռամսյակ. աճ և երեխայի դիրք',
    ],
    body2:
      'Արյան կանոնավոր անալիզները հղիության ընթացքում վերահսկում են մի քանի հիմնական ցուցանիշ.',
    bloodTests: [
      'Երկաթի մակարդակ՝ հնարավոր սակավարյունությունը հայտնաբերելու համար',
      'Հղիության շաքարախտի սկրինինգ, սովորաբար 2-րդ եռամսյակի շուրջ',
      'Արյան խումբ և անկանոն հակամարմինների սկրինինգ',
      'Շճաբանական անալիզներ (տոքսոպլազմոզ, կարմրուկ)՝ կախված ձեր իմունային կարգավիճակից',
    ],
    prepTips: [
      'Գրեք ձեր հարցերը, երբ դրանք գալիս են ձեր մտքին, նախքան մոռանալը',
      'Բերեք հղիության հսկողության գրքույկը յուրաքանչյուր այցին',
      'Նշեք ցանկացած նոր ախտանիշ, նույնիսկ եթե այն աննշան է թվում',
    ],
    neutralText:
      'Հետազոտությունների ճշգրիտ քանակը և ժամանակացույցը կարող են տարբերվել՝ կախված ձեր խնամքից, վտանգի պրոֆիլից և ձեր երկրի կամ խնամք տրամադրողի պրակտիկայից:',
    tipTitle: 'Լավ է իմանալ',
    tipText:
      'Մի տատանվեք յուրաքանչյուր այցից առաջ գրել ձեր հարցերը, որպեսզի այդ պահին ոչինչ չմոռանաք. չկա հարց, որը չափազանց փոքր է տալու համար:',
    shareMessage: 'Հղիության հետազոտությունների օրացույց — AWA',
  },
  tg: {
    badge: 'ҲОМИЛАДОРӢ • НАЗОРАТИ ТИББӢ',
    title: 'Тақвими муоинаҳои\nҳомиладорӣ',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Ултрасадо ва санҷишҳои муҳим, триместр ба триместр.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Ултрасадоҳои назоратӣ',
      'Санҷишҳои асосии хун',
      'Омодагӣ ба ҳар қабул',
      'Қобили қайд',
      'Хулосаҳои асосӣ',
    ],
    body1:
      'Ҳомиладорӣ одатан се ултрасадои асосиро дар бар мегирад, яке барои ҳар триместр, ки ҳар кадом мақсади гуногун дорад.',
    ultrasounds: [
      'Триместри 1: муайян кардани мӯҳлат ва шаффофии гарданӣ',
      'Триместри 2: ултрасадои морфологӣ',
      'Триместри 3: рушд ва вазъияти тифл',
    ],
    body2:
      'Санҷишҳои мунтазами хун якчанд нишондиҳандаи асосиро дар давоми ҳомиладорӣ назорат мекунанд:',
    bloodTests: [
      'Сатҳи оҳан, барои ошкор кардани камхунии эҳтимолӣ',
      'Ташхиси диабети ҳомиладорӣ, одатан дар атрофи триместри 2',
      'Гурӯҳи хун ва ташхиси антителоҳои номунтазам',
      'Санҷишҳои серологӣ (токсоплазмоз, сурхча) вобаста ба ҳолати масунияти шумо',
    ],
    prepTips: [
      'Саволҳои худро ҳангоми пайдо шуданашон нависед, пеш аз он ки фаромӯш кунед',
      'Дафтарчаи назорати ҳомиладориро ба ҳар қабул биёред',
      'Ҳар нишонаи навро, ҳатто агар хурд ба назар расад, зикр кунед',
    ],
    neutralText:
      'Шумора ва ҷадвали дақиқи муоинаҳо метавонад вобаста ба нигоҳубини шумо, профили хатар ва расму оини кишвар ё муассисаи тиббии шумо фарқ кунад.',
    tipTitle: 'Донистан хуб аст',
    tipText:
      'Пеш аз ҳар қабул саволҳои худро навиштан шарм надоред, то дар лаҳза чизеро фаромӯш накунед: ягон савол барои пурсидан хурд нест.',
    shareMessage: 'Тақвими муоинаҳои ҳомиладорӣ — AWA',
  },
  ky: {
    badge: 'КУРСАКТУУЛУК • МЕДИЦИНАЛЫК КӨЗӨМӨЛ',
    title: 'Курсактуулук текшерүү\nкалендары',
    metaDuration: '6 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Триместр боюнча УЗИ жана маанилүү анализдер.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Көзөмөл УЗИлери',
      'Маанилүү кан анализдери',
      'Ар бир кабыл алууга даярдануу',
      'Эске алуу керек',
      'Негизги жыйынтыктар',
    ],
    body1:
      'Курсактуулук адатта үч негизги УЗИни камтыйт, ар бир триместрде бирден, алардын ар биринин башка максаты бар.',
    ultrasounds: [
      '1-триместр: мөөнөттү аныктоо жана моюн алдындагы тунуктук',
      '2-триместр: морфологиялык УЗИ',
      '3-триместр: өсүү жана ымыркайдын абалы',
    ],
    body2:
      'Үзгүлтүксүз кан анализдери курсактуулук бою бир нече негизги көрсөткүчтү көзөмөлдөйт:',
    bloodTests: [
      'Мүмкүн болгон аз канды аныктоо үчүн темирдин деңгээли',
      'Курсактуулук диабетин скринингдөө, адатта 2-триместрдин тегерегинде',
      'Кан тобун жана туура эмес антителолорду скринингдөө',
      'Иммундук абалыңызга жараша серологиялык тесттер (токсоплазмоз, кызылча)',
    ],
    prepTips: [
      'Суроолорду унутуп калганга чейин, пайда болгон сайын жазып коюңуз',
      'Ар бир кабыл алууга курсактуулук көзөмөл китепчеңизди алып барыңыз',
      'Ар кандай жаңы белгини, майда көрүнсө да, айтыңыз',
    ],
    neutralText:
      'Текшерүүлөрдүн так саны жана графиги кам көрүүңүзгө, коркунуч профилиңизге жана өлкөңүздүн же медициналык мекемеңиздин тажрыйбасына жараша айырмаланышы мүмкүн.',
    tipTitle: 'Билүү пайдалуу',
    tipText:
      'Ошол учурда эч нерсени унутпоо үчүн суроолоруңузду ар бир кабыл алуу алдында жазып коюудан тартынбаңыз: берүүгө өтө кичинекей суроо жок.',
    shareMessage: 'Курсактуулук текшерүү календары — AWA',
  },
  tk: {
    badge: 'GÖWRELILIK • LUKMANÇYLYK YZARLAMASY',
    title: 'Göwrelilik barlaglarynyň\nsenenamasy',
    metaDuration: '6 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Trimestrme-trimestr UZI we esasy synaglar.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Yzarlaýjy UZI barlaglary',
      'Esasy gan synaglary',
      'Her kabul edişe taýýarlanmak',
      'Bellemäge mynasyp zatlar',
      'Esasy netijeler',
    ],
    body1:
      'Göwrelilik adatça üç esasy UZI-ni, her trimestrde birini öz içine alýar, olaryň her biriniň dürli maksady bar.',
    ultrasounds: [
      '1-nji trimestr: wagtyny kesgitlemek we boýun görnüşi (nuchal translucency)',
      '2-nji trimestr: morfologiýa UZI-si',
      '3-nji trimestr: ösüş we bäbegiň ýagdaýy',
    ],
    body2:
      'Yzygiderli gan synaglary göwrelilik dowamynda birnäçe esasy görkezijini yzarlaýar:',
    bloodTests: [
      'Mümkin kemganlygy anyklamak üçin demir derejesi',
      'Göwreliligiň şekerli diabeti barlagy, adatça 2-nji trimestriň töwereginde',
      'Gan toparyny we düzgünsiz antitelleri barlamak',
      'Immun ýagdaýyňyza görä serologiýa synaglary (toksoplazmoz, gyzamyk)',
    ],
    prepTips: [
      'Soraglaryňyz ýadyňyza düşende, ýatdan çykarmanka ýazyp goýuň',
      'Her kabul edişe göwrelilik yzarlama depderçäňizi alyp geliň',
      'Islendik täze alamaty, hatda ol ownuk bolup görünse-de, aýdyň',
    ],
    neutralText:
      'Barlaglaryň takyk sany we tertibi idegiňize, howp profiliňize we ülkäňiziň ýa-da lukmançylyk edarasynyň tejribesine görä tapawutlanyp biler.',
    tipTitle: 'Bilmek peýdaly',
    tipText:
      'Pursatda hiç zady ýatdan çykarmazlyk üçin soraglaryňyzy her kabul edişden öň ýazyp goýmakdan çekinmäň: soramak üçin aşa kiçijik sorag ýok.',
    shareMessage: 'Göwrelilik barlaglarynyň senenamasy — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function MedicalExamsArticleScreen({
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

          <AwaText variant="titleSmall" style={styles.intro}>
            {content.intro}
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

          <View style={styles.daily}>
            {ULTRASOUND_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>{content.ultrasounds[index]}</AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.bloodTests.map(item => (
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

          <AwaCard variant="filled" padding="none" style={styles.consultCard}>
            {content.prepTips.map(item => (
              <View key={item} style={styles.consultRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name="pencil-outline"
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="bodySmall" style={styles.consultText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

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
  contentNumber: {width: 25},
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
  neutralBox: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  neutralText: {flex: 1},
  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 4},
  });
}
