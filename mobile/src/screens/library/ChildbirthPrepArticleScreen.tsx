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

const ID = 'childbirthprep-preparer-accouchement';

const HERO = require('../../assets/images/library/featured-tracker.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const PREP_ICONS = [
  'numeric-1-circle-outline',
  'numeric-2-circle-outline',
  'numeric-3-circle-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('ChildbirthPrep', {
  fr: {
    badge: 'GROSSESSE • ACCOUCHEMENT',
    title: 'Se préparer sereinement\nà l’accouchement',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Trois piliers pour aborder le jour J avec plus de confiance.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Se préparer en 3 étapes',
      'Le sac de maternité',
      'Rédiger ton projet de naissance',
      'À noter',
      'À retenir',
    ],
    prepSteps: [
      'Cours de préparation à la naissance',
      'Techniques de respiration et de relaxation',
      'Sac de maternité prêt dès le 8e mois',
    ],
    body1:
      'Les cours de préparation à la naissance t’aident à comprendre les étapes du travail et les techniques de respiration qui t’accompagneront le jour J.',
    body2:
      'Préparer ton sac de maternité dès le 8e mois t’évite le stress de dernière minute. Il contient généralement :',
    bagItems: [
      'Papiers administratifs et carnet de grossesse',
      'Vêtements confortables pour toi et le bébé',
      'Nécessaire de toilette et protections post-accouchement',
      'Une tenue de sortie pour le bébé',
    ],
    birthPlanPoints: [
      'Tes préférences pour gérer la douleur',
      'La présence souhaitée pendant le travail',
      'Tes attentes concernant le peau à peau',
    ],
    neutralText:
      'Un projet de naissance simple t’aide à exprimer tes souhaits à l’équipe médicale, tout en restant ouverte : le déroulement réel peut évoluer selon la situation.',
    tipTitle: 'Bon à savoir',
    tipText:
      'Se préparer ne veut pas dire tout contrôler : c’est surtout se donner les moyens d’aborder le jour J avec plus de confiance et moins d’incertitude.',
    shareMessage: 'Se préparer sereinement à l’accouchement — AWA',
  },
  en: {
    badge: 'PREGNANCY • CHILDBIRTH',
    title: 'Preparing calmly\nfor childbirth',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Three pillars for approaching the big day with more confidence.',
    contentsTitle: 'In this article',
    topics: [
      'Preparing in 3 steps',
      'Your hospital bag',
      'Writing your birth plan',
      'Worth noting',
      'What to remember',
    ],
    prepSteps: [
      'Childbirth preparation classes',
      'Breathing and relaxation techniques',
      'Hospital bag ready by month 8',
    ],
    body1:
      'Childbirth preparation classes help you understand the stages of labor and the breathing techniques that will support you on the big day.',
    body2:
      'Packing your hospital bag by month 8 saves you last-minute stress. It usually includes:',
    bagItems: [
      'ID documents and your pregnancy record book',
      'Comfortable clothing for you and the baby',
      'Toiletries and postpartum pads',
      'An outfit for the baby to go home in',
    ],
    birthPlanPoints: [
      'Your preferences for managing pain',
      'Who you’d like present during labor',
      'Your expectations around skin-to-skin contact',
    ],
    neutralText:
      'A simple birth plan helps you share your wishes with the medical team, while staying open-minded: the actual course of events can change depending on the situation.',
    tipTitle: 'Good to know',
    tipText:
      'Preparing doesn’t mean controlling everything: it’s mainly about giving yourself the means to approach the big day with more confidence and less uncertainty.',
    shareMessage: 'Preparing calmly for childbirth — AWA',
  },
  es: {
    badge: 'EMBARAZO • PARTO',
    title: 'Prepararte con calma\npara el parto',
    metaDuration: '7 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Tres pilares para afrontar el gran día con más confianza.',
    contentsTitle: 'En este artículo',
    topics: [
      'Prepararte en 3 pasos',
      'La bolsa de maternidad',
      'Redactar tu plan de parto',
      'Para tener en cuenta',
      'Para recordar',
    ],
    prepSteps: [
      'Clases de preparación al parto',
      'Técnicas de respiración y relajación',
      'Bolsa de maternidad lista desde el 8.º mes',
    ],
    body1:
      'Las clases de preparación al parto te ayudan a comprender las etapas del trabajo de parto y las técnicas de respiración que te acompañarán el gran día.',
    body2:
      'Preparar tu bolsa de maternidad desde el 8.º mes te evita el estrés de última hora. Generalmente incluye:',
    bagItems: [
      'Documentos administrativos y tu cartilla de embarazo',
      'Ropa cómoda para ti y para el bebé',
      'Artículos de aseo y compresas posparto',
      'Un conjunto de salida para el bebé',
    ],
    birthPlanPoints: [
      'Tus preferencias para manejar el dolor',
      'La presencia deseada durante el trabajo de parto',
      'Tus expectativas respecto al contacto piel con piel',
    ],
    neutralText:
      'Un plan de parto sencillo te ayuda a expresar tus deseos al equipo médico, manteniéndote abierta: el desarrollo real puede cambiar según la situación.',
    tipTitle: 'DATO ÚTIL',
    tipText:
      'Prepararte no significa controlarlo todo: se trata sobre todo de darte los medios para afrontar el gran día con más confianza y menos incertidumbre.',
    shareMessage: 'Prepararte con calma para el parto — AWA',
  },
  it: {
    badge: 'GRAVIDANZA • PARTO',
    title: 'Prepararsi con serenità\nal parto',
    metaDuration: '7 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Tre pilastri per affrontare il grande giorno con maggiore fiducia.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Prepararsi in 3 passi',
      'La tua borsa per l’ospedale',
      'Scrivere il tuo piano del parto',
      'Da tenere a mente',
      'Da ricordare',
    ],
    prepSteps: [
      'Corsi di preparazione al parto',
      'Tecniche di respirazione e di rilassamento',
      'Borsa per l’ospedale pronta entro il mese 8',
    ],
    body1: 'I corsi di preparazione al parto ti aiutano a capire le fasi del travaglio e le tecniche di respirazione che ti sosterranno il grande giorno.',
    body2: 'Preparare la borsa per l’ospedale entro il mese 8 ti evita lo stress dell’ultimo minuto. Di solito contiene:',
    bagItems: [
      'Documenti d’identità e il libretto della gravidanza',
      'Abiti comodi per te e per il neonato',
      'Articoli da toilette e assorbenti post-partum',
      'Un completo per il neonato per tornare a casa',
    ],
    birthPlanPoints: [
      'Le tue preferenze per la gestione del dolore',
      'Chi vorresti avere accanto durante il travaglio',
      'Le tue aspettative sul contatto pelle a pelle',
    ],
    neutralText: 'Un semplice piano del parto ti aiuta a comunicare i tuoi desideri all’équipe medica, restando però aperta ai cambiamenti: lo svolgimento reale può cambiare a seconda della situazione.',
    tipTitle: 'Da sapere',
    tipText: 'Prepararsi non significa controllare tutto: si tratta soprattutto di darti i mezzi per affrontare il grande giorno con più fiducia e meno incertezza.',
    shareMessage: 'Prepararsi con serenità al parto — AWA',
  },
  tr: {
    badge: 'GEBELİK • DOĞUM',
    title: 'Doğuma sakin\nbir şekilde hazırlanmak',
    metaDuration: '7 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Büyük güne daha güvenle yaklaşmak için üç temel dayanak.',
    contentsTitle: 'Bu makalede',
    topics: [
      '3 adımda hazırlık',
      'Hastane çantan',
      'Doğum planını yazmak',
      'Not edilmesi gerekenler',
      'Akılda tutulacaklar',
    ],
    prepSteps: [
      'Doğuma hazırlık sınıfları',
      'Nefes ve gevşeme teknikleri',
      'Hastane çantası 8. aya kadar hazır',
    ],
    body1: 'Doğuma hazırlık sınıfları, doğumun evrelerini ve büyük günde sana destek olacak nefes tekniklerini anlamana yardımcı olur.',
    body2: 'Hastane çantanı 8. aya kadar hazırlamak, son dakika stresinden seni kurtarır. Çantada genellikle şunlar bulunur:',
    bagItems: [
      'Kimlik belgeleri ve gebelik takip karnen',
      'Senin ve bebeğin için rahat kıyafetler',
      'Kişisel bakım ürünleri ve doğum sonrası ped',
      'Bebeğin eve dönüş kıyafeti',
    ],
    birthPlanPoints: [
      'Ağrıyla başa çıkma konusundaki tercihlerin',
      'Doğum sırasında yanında olmasını istediğin kişiler',
      'Ten teması konusundaki beklentilerin',
    ],
    neutralText: 'Basit bir doğum planı, isteklerini sağlık ekibiyle paylaşmana yardımcı olur; yine de esnek kalmak gerekir: olayların gerçek seyri duruma göre değişebilir.',
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Hazırlanmak her şeyi kontrol etmek demek değildir: asıl amaç, büyük güne daha güvenle ve daha az belirsizlikle yaklaşmanın yollarını kendine sağlamaktır.',
    shareMessage: 'Doğuma sakin bir şekilde hazırlanmak — AWA',
  },
  ru: {
    badge: 'БЕРЕМЕННОСТЬ • РОДЫ',
    title: 'Спокойная подготовка\nк родам',
    metaDuration: '7 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Три опоры, которые помогут подойти к важному дню увереннее.',
    contentsTitle: 'В этой статье',
    topics: [
      'Подготовка в 3 шага',
      'Сумка в роддом',
      'Составление плана родов',
      'Стоит знать',
      'Что запомнить',
    ],
    prepSteps: [
      'Курсы подготовки к родам',
      'Техники дыхания и расслабления',
      'Сумка в роддом собрана к 8-му месяцу',
    ],
    body1:
      'Курсы подготовки к родам помогают понять, как проходят роды, и освоить техники дыхания, которые поддержат вас в этот важный день.',
    body2:
      'Если собрать сумку в роддом к 8-му месяцу, можно избежать волнения в последний момент. Обычно в неё кладут:',
    bagItems: [
      'Документы, удостоверяющие личность, и обменную карту',
      'Удобную одежду для вас и для малыша',
      'Средства личной гигиены и послеродовые прокладки',
      'Одежду для малыша на выписку',
    ],
    birthPlanPoints: [
      'Ваши предпочтения в отношении обезболивания',
      'Кого вы хотели бы видеть рядом во время родов',
      'Ваши пожелания относительно контакта «кожа к коже»',
    ],
    neutralText:
      'Простой план родов помогает рассказать о ваших пожеланиях медицинской команде, сохраняя при этом гибкость: реальный ход событий может измениться в зависимости от ситуации.',
    tipTitle: 'ПОЛЕЗНО ЗНАТЬ',
    tipText:
      'Подготовка не означает, что нужно всё контролировать: прежде всего это возможность дать себе средства, чтобы подойти к важному дню увереннее и с меньшей неопределённостью.',
    shareMessage: 'Спокойная подготовка к родам — AWA',
  },
  de: {
    badge: 'SCHWANGERSCHAFT • GEBURT',
    title: 'Gelassen auf die\nGeburt vorbereiten',
    metaDuration: '7 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Drei Säulen, mit denen du dem großen Tag zuversichtlicher entgegengehst.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Vorbereitung in 3 Schritten',
      'Deine Kliniktasche',
      'Deinen Geburtsplan verfassen',
      'Wissenswert',
      'Was du dir merken kannst',
    ],
    prepSteps: [
      'Geburtsvorbereitungskurs',
      'Atem- und Entspannungstechniken',
      'Kliniktasche bis zum 8. Monat gepackt',
    ],
    body1:
      'Ein Geburtsvorbereitungskurs hilft dir, die Phasen der Geburt zu verstehen und Atemtechniken kennenzulernen, die dich am großen Tag unterstützen.',
    body2:
      'Wenn du deine Kliniktasche bis zum 8. Monat packst, ersparst du dir Stress in letzter Minute. Üblicherweise gehören dazu:',
    bagItems: [
      'Ausweisdokumente und dein Mutterpass',
      'Bequeme Kleidung für dich und das Baby',
      'Kulturbeutel und Wochenbettvorlagen',
      'Ein Outfit für die Heimfahrt des Babys',
    ],
    birthPlanPoints: [
      'Deine Wünsche zum Umgang mit Schmerzen',
      'Wen du während der Geburt gern dabeihättest',
      'Deine Vorstellungen zum Hautkontakt',
    ],
    neutralText:
      'Ein einfacher Geburtsplan hilft dir, deine Wünsche dem medizinischen Team mitzuteilen, und lässt dennoch Raum für Offenheit: Der tatsächliche Verlauf kann sich je nach Situation ändern.',
    tipTitle: 'Gut zu wissen',
    tipText:
      'Vorbereitung heißt nicht, alles kontrollieren zu wollen: Es geht vor allem darum, dir die Mittel zu geben, dem großen Tag mit mehr Zuversicht und weniger Unsicherheit zu begegnen.',
    shareMessage: 'Gelassen auf die Geburt vorbereiten – AWA',
  },
  zh: {
      badge: '怀孕 • 分娩',
      title: '从容准备\n迎接分娩',
      metaDuration: '阅读约 7 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '三个支柱，帮助你更有信心地迎接重要的那一天。',
      contentsTitle: '本文内容',
      topics: [
        '分三步做好准备',
        '你的待产包',
        '写下你的分娩计划',
        '值得注意',
        '需要记住的',
      ],
      prepSteps: [
        '分娩准备课程',
        '呼吸与放松技巧',
        '孕 8 个月前备好待产包',
      ],
      body1: '分娩准备课程可以帮助你了解产程的各个阶段，以及在那一天能支持你的呼吸技巧。',
      body2: '在孕 8 个月前备好待产包，可以免去临近时的慌乱。待产包通常包括：',
      bagItems: [
        '身份证件和你的孕期档案本',
        '你和宝宝的舒适衣物',
        '洗漱用品和产妇卫生巾',
        '宝宝出院回家穿的衣服',
      ],
      birthPlanPoints: [
        '你对疼痛管理的偏好',
        '你希望谁在产程中陪伴',
        '你对肌肤接触的期望',
      ],
      neutralText: '一份简单的分娩计划，可以帮助你向医疗团队表达自己的意愿，同时保持开放的心态：实际的过程可能会因具体情况而改变。',
      tipTitle: '小贴士',
      tipText: '做好准备并不意味着掌控一切：更重要的是让自己有办法更有信心、更少不确定地迎接那一天。',
      shareMessage: '从容准备迎接分娩 — AWA',
    },
  id: {
    badge: 'KEHAMILAN • PERSALINAN',
    title: 'Mempersiapkan persalinan\ndengan tenang',
    metaDuration: '7 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Tiga pilar untuk menyambut hari besar dengan lebih percaya diri.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Persiapan dalam 3 langkah',
      'Tas rumah sakitmu',
      'Menyusun rencana persalinan',
      'Perlu dicatat',
      'Yang perlu diingat',
    ],
    prepSteps: [
      'Kelas persiapan persalinan',
      'Teknik pernapasan dan relaksasi',
      'Tas rumah sakit siap di bulan ke-8',
    ],
    body1: 'Kelas persiapan persalinan membantumu memahami tahap-tahap persalinan dan teknik pernapasan yang akan menopangmu di hari besar.',
    body2: 'Menyiapkan tas rumah sakit di bulan ke-8 menghindarkanmu dari stres di menit-menit terakhir. Isinya biasanya meliputi:',
    bagItems: [
      'Dokumen identitas dan buku catatan kehamilanmu',
      'Pakaian yang nyaman untukmu dan bayi',
      'Perlengkapan mandi dan pembalut pascapersalinan',
      'Satu setel pakaian untuk bayi pulang ke rumah',
    ],
    birthPlanPoints: [
      'Preferensimu dalam mengatasi nyeri',
      'Siapa yang ingin kamu dampingi saat persalinan',
      'Harapanmu terkait kontak kulit ke kulit',
    ],
    neutralText: 'Rencana persalinan yang sederhana membantumu menyampaikan keinginanmu kepada tim medis, sambil tetap berpikiran terbuka: jalannya persalinan yang sebenarnya bisa berubah tergantung situasi.',
    tipTitle: 'Perlu diketahui',
    tipText: 'Bersiap bukan berarti mengendalikan segalanya: yang terpenting adalah memberi dirimu bekal untuk menyambut hari besar dengan lebih percaya diri dan lebih sedikit ketidakpastian.',
    shareMessage: 'Mempersiapkan persalinan dengan tenang — AWA',
  },
  hi: {
    badge: 'गर्भावस्था • प्रसव',
    title: 'शांति से प्रसव\nकी तैयारी',
    metaDuration: '7 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'बड़े दिन का ज़्यादा आत्मविश्वास से सामना करने के तीन आधार।',
    contentsTitle: 'इस लेख में',
    topics: [
      '3 चरणों में तैयारी',
      'आपका हॉस्पिटल बैग',
      'अपना बर्थ प्लान लिखना',
      'ध्यान देने योग्य बात',
      'याद रखने की बातें',
    ],
    prepSteps: [
      'प्रसव की तैयारी की कक्षाएँ',
      'साँस और रिलैक्सेशन की तकनीकें',
      '8वें महीने तक हॉस्पिटल बैग तैयार',
    ],
    body1: 'प्रसव की तैयारी की कक्षाएँ आपको प्रसव के चरणों और साँस की उन तकनीकों को समझने में मदद करती हैं जो बड़े दिन पर आपका साथ देंगी।',
    body2: '8वें महीने तक हॉस्पिटल बैग पैक कर लेने से आख़िरी वक़्त की घबराहट बचती है। इसमें आमतौर पर ये चीज़ें होती हैं:',
    bagItems: [
      'पहचान के दस्तावेज़ और आपकी गर्भावस्था की रिकॉर्ड बुक',
      'आपके और बच्चे के लिए आरामदायक कपड़े',
      'टॉयलेटरी का सामान और प्रसवोत्तर पैड',
      'बच्चे के घर लौटने के लिए एक जोड़ी कपड़े',
    ],
    birthPlanPoints: [
      'दर्द को संभालने को लेकर आपकी पसंद',
      'प्रसव के दौरान आप किसे अपने पास चाहेंगी',
      'त्वचा से त्वचा के संपर्क (स्किन-टू-स्किन) को लेकर आपकी उम्मीदें',
    ],
    neutralText: 'एक सरल बर्थ प्लान से आप अपनी इच्छाएँ मेडिकल टीम तक पहुँचा पाती हैं, साथ ही मन खुला रखना भी ज़रूरी है: असल में सब कुछ हालात के हिसाब से बदल सकता है।',
    tipTitle: 'जानना अच्छा है',
    tipText: 'तैयारी का मतलब सब कुछ अपने क़ाबू में रखना नहीं है: मक़सद यह है कि आप बड़े दिन का ज़्यादा आत्मविश्वास और कम अनिश्चितता के साथ सामना कर सकें।',
    shareMessage: 'शांति से प्रसव की तैयारी — AWA',
  },
  sq: {
    badge: 'SHTATZËNIA • LINDJA',
    title: 'Përgatitu me qetësi\npër lindjen',
    metaDuration: '7 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e shqyrtuar',
    intro: 'Tre shtylla për ta përballuar ditën e madhe me më shumë besim.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Përgatitja në 3 hapa',
      'Çanta jote për spital',
      'Hartimi i planit të lindjes',
      'Mirë është të dish',
      'Çfarë të mbash mend',
    ],
    prepSteps: [
      'Kurset e përgatitjes për lindjen',
      'Teknikat e frymëmarrjes dhe të relaksimit',
      'Çanta e spitalit gati deri në muajin e 8-të',
    ],
    body1: 'Kurset e përgatitjes për lindjen të ndihmojnë të kuptosh fazat e lindjes dhe teknikat e frymëmarrjes që do të të mbështesin në ditën e madhe.',
    body2: 'Nëse e përgatit çantën e spitalit deri në muajin e 8-të, kursen stresin e çastit të fundit. Zakonisht ajo përmban:',
    bagItems: [
      'Dokumentet e identitetit dhe librezën e shtatzënisë',
      'Veshje të rehatshme për ty dhe për bebin',
      'Gjërat e higjienës dhe peceta higjienike për periudhën pas lindjes',
      'Një veshje për bebin, për t’u kthyer në shtëpi',
    ],
    birthPlanPoints: [
      'Preferencat e tua për menaxhimin e dhimbjes',
      'Kush do të doje të ishte i pranishëm gjatë lindjes',
      'Pritshmëritë e tua për kontaktin lëkurë më lëkurë',
    ],
    neutralText: 'Një plan i thjeshtë lindjeje të ndihmon t’ua përcjellësh dëshirat ekipit mjekësor, duke qëndruar njëkohësisht e hapur ndaj ndryshimeve: ecuria e vërtetë mund të ndryshojë sipas situatës.',
    tipTitle: 'Mirë është të dish',
    tipText: 'Përgatitja nuk do të thotë të kontrollosh gjithçka: është kryesisht të japësh vetes mjetet për ta përballuar ditën e madhe me më shumë besim dhe më pak pasiguri.',
    shareMessage: 'Përgatitu me qetësi për lindjen — AWA',
  },
  ja: {
    badge: '妊娠 • 出産',
    title: '落ち着いて\n出産に備える',
    metaDuration: '読了時間7分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '確認済みの内容',
    intro: '出産の日を、より安心して迎えるための3つの柱。',
    contentsTitle: 'この記事の内容',
    topics: [
      '3つのステップで備える',
      '入院バッグ',
      'バースプランを書く',
      '知っておきたいこと',
      '覚えておきたいこと',
    ],
    prepSteps: [
      '出産準備クラス',
      '呼吸法とリラックス法',
      '妊娠8か月までに入院バッグを準備',
    ],
    body1: '出産準備クラスでは、陣痛の進み方や、出産の日に助けとなる呼吸法を学べます。',
    body2: '妊娠8か月までに入院バッグを用意しておくと、直前に慌てずにすみます。通常は次のようなものを入れます。',
    bagItems: [
      '身分証明書と母子手帳',
      'ご自身と赤ちゃんの着心地のよい衣類',
      '洗面用品と産後用のナプキン',
      '赤ちゃんが退院するときの服',
    ],
    birthPlanPoints: [
      '痛みへの対処についての希望',
      '陣痛のあいだ付き添ってほしい人',
      'カンガルーケア（肌と肌のふれあい）についての希望',
    ],
    neutralText: '簡単なバースプランがあると、希望を医療チームに伝えやすくなります。ただし、実際の経過は状況によって変わることもあるため、柔軟な気持ちでいることも大切です。',
    tipTitle: '知っておきたいこと',
    tipText: '備えるとは、すべてをコントロールすることではありません。出産の日を、より安心して、不安を少なく迎えるための手段を持つことが大切です。',
    shareMessage: '落ち着いて出産に備える — AWA',
  },
  ko: {
    badge: '임신 • 출산',
    title: '차분하게\n출산 준비하기',
    metaDuration: '7분 읽기',
    metaType: '가이드',
    metaLevel: '초급',
    metaValidated: '검토된 콘텐츠',
    intro: '더 자신 있게 그날을 맞이하기 위한 세 가지 기둥이에요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '3단계로 준비하기',
      '병원 가방',
      '출산 계획서 작성하기',
      '알아 두면 좋은 점',
      '기억할 점',
    ],
    prepSteps: [
      '출산 준비 교실',
      '호흡법과 이완 기법',
      '8개월까지 병원 가방 준비하기',
    ],
    body1: '출산 준비 교실에서는 진통의 단계와, 그날 도움이 될 호흡법을 이해할 수 있어요.',
    body2: '8개월까지 병원 가방을 챙겨 두면 막판의 스트레스를 줄일 수 있어요. 보통 이런 것들이 들어가요.',
    bagItems: [
      '신분증과 산모수첩',
      '산모와 아기를 위한 편안한 옷',
      '세면도구와 산후용 패드',
      '아기가 퇴원할 때 입을 옷',
    ],
    birthPlanPoints: [
      '통증 관리에 대한 바람',
      '진통 중에 함께 있었으면 하는 사람',
      '피부 접촉(캥거루 케어)에 대한 기대',
    ],
    neutralText: '간단한 출산 계획서는 의료진에게 바람을 전하는 데 도움이 돼요. 다만 열린 마음을 유지하세요. 실제 진행은 상황에 따라 달라질 수 있어요.',
    tipTitle: '알아 두세요',
    tipText: '준비한다는 것은 모든 것을 통제한다는 뜻이 아니에요. 그날을 더 자신 있게, 불확실함은 줄여서 맞이할 수 있도록 스스로에게 힘을 주는 것이 가장 중요해요.',
    shareMessage: '차분하게 출산 준비하기 — AWA',
  },
  'pt-PT': {
    badge: 'GRAVIDEZ • PARTO',
    title: 'Preparar o parto\ncom serenidade',
    metaDuration: 'Leitura de 7 min',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Três pilares para encarar o grande dia com mais confiança.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Preparar-se em 3 passos',
      'A sua mala da maternidade',
      'Escrever o seu plano de parto',
      'A ter em conta',
      'O que reter',
    ],
    prepSteps: [
      'Aulas de preparação para o parto',
      'Técnicas de respiração e relaxamento',
      'Mala da maternidade pronta no 8.º mês',
    ],
    body1: 'As aulas de preparação para o parto ajudam a compreender as fases do trabalho de parto e as técnicas de respiração que a vão apoiar no grande dia.',
    body2: 'Preparar a mala da maternidade no 8.º mês evita o stress de última hora. Inclui habitualmente:',
    bagItems: [
      'Documentos de identificação e o boletim de saúde da grávida',
      'Roupa confortável para si e para o bebé',
      'Produtos de higiene e pensos pós-parto',
      'Uma muda de roupa para o bebé ir para casa',
    ],
    birthPlanPoints: [
      'As suas preferências quanto ao controlo da dor',
      'Quem gostaria de ter presente durante o trabalho de parto',
      'As suas expectativas quanto ao contacto pele com pele',
    ],
    neutralText: 'Um plano de parto simples ajuda a partilhar os seus desejos com a equipa médica, mantendo ao mesmo tempo abertura de espírito: o decurso real pode mudar consoante a situação.',
    tipTitle: 'Bom saber',
    tipText: 'Preparar-se não significa controlar tudo: trata-se sobretudo de dar a si mesma os meios para encarar o grande dia com mais confiança e menos incerteza.',
    shareMessage: 'Preparar o parto com serenidade — AWA',
  },
  bn: {
    badge: 'গর্ভাবস্থা • প্রসব',
    title: 'নিশ্চিন্তে প্রসবের\nপ্রস্তুতি',
    metaDuration: '7 মিনিটের পাঠ',
    metaType: 'গাইড',
    metaLevel: 'নতুনদের জন্য',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'বড় দিনটির মুখোমুখি হওয়ার জন্য তিনটি স্তম্ভ, আরও আত্মবিশ্বাসের সঙ্গে।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      '3টি ধাপে প্রস্তুতি',
      'আপনার হাসপাতালের ব্যাগ',
      'আপনার প্রসব পরিকল্পনা লেখা',
      'লক্ষণীয় বিষয়',
      'যা মনে রাখবেন',
    ],
    prepSteps: [
      'প্রসব প্রস্তুতির ক্লাস',
      'শ্বাস-প্রশ্বাস ও শিথিলায়নের কৌশল',
      '8ম মাসের মধ্যে হাসপাতালের ব্যাগ প্রস্তুত',
    ],
    body1: 'প্রসব প্রস্তুতির ক্লাস আপনাকে প্রসববেদনার ধাপগুলো এবং বড় দিনে আপনাকে সহায়তা করবে এমন শ্বাস-প্রশ্বাসের কৌশল বুঝতে সাহায্য করে।',
    body2: '8ম মাসের মধ্যে হাসপাতালের ব্যাগ গুছিয়ে রাখলে শেষ মুহূর্তের দুশ্চিন্তা এড়ানো যায়। এতে সাধারণত থাকে:',
    bagItems: [
      'পরিচয়পত্র এবং আপনার গর্ভাবস্থার রেকর্ড বই',
      'আপনার ও শিশুর জন্য আরামদায়ক পোশাক',
      'প্রসাধনী সামগ্রী এবং প্রসবোত্তর প্যাড',
      'বাড়ি ফেরার সময় শিশুকে পরানোর একটি পোশাক',
    ],
    birthPlanPoints: [
      'ব্যথা সামলানোর বিষয়ে আপনার পছন্দ',
      'প্রসববেদনার সময় কাকে আপনার পাশে চান',
      'ত্বকে ত্বক স্পর্শ (স্কিন-টু-স্কিন) নিয়ে আপনার প্রত্যাশা',
    ],
    neutralText: 'একটি সহজ প্রসব পরিকল্পনা চিকিৎসক দলের সঙ্গে আপনার ইচ্ছাগুলো ভাগ করে নিতে সাহায্য করে, একই সঙ্গে মন খোলা রাখাও জরুরি: পরিস্থিতি অনুযায়ী প্রকৃত ঘটনাক্রম বদলে যেতে পারে।',
    tipTitle: 'জেনে রাখা ভালো',
    tipText: 'প্রস্তুতি নেওয়ার মানে সবকিছু নিয়ন্ত্রণ করা নয়: এর মূল উদ্দেশ্য হলো বড় দিনটির মুখোমুখি হওয়ার জন্য নিজেকে সক্ষম করা, আরও আত্মবিশ্বাস ও কম অনিশ্চয়তা নিয়ে।',
    shareMessage: 'নিশ্চিন্তে প্রসবের প্রস্তুতি — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function ChildbirthPrepArticleScreen({
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
            {PREP_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>{content.prepSteps[index]}</AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.bagItems.map(item => (
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
            {content.birthPlanPoints.map(item => (
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

      <ReadingControls articleId={ID} durationMinutes={7} scrollRef={scrollRef} />
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
