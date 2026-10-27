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
  da: {
    badge: 'GRAVIDITET • FØDSEL',
    title: 'Rolig forberedelse\ntil fødslen',
    metaDuration: '7 min. læsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemset indhold',
    intro: 'Tre søjler til at nærme sig den store dag med mere selvtillid.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Forberedelse i 3 trin',
      'Din hospitalsmappe',
      'Skriv din fødselsplan',
      'Værd at bemærke',
      'Hvad du skal huske',
    ],
    prepSteps: [
      'Fødselsforberedelseskurser',
      'Åndedræts- og afslapningsteknikker',
      'Hospitalsmappe klar inden måned 8',
    ],
    body1:
      'Fødselsforberedelseskurser hjælper dig med at forstå faserne i fødselsprocessen og de åndedrætsteknikker, der vil støtte dig den store dag.',
    body2:
      'At pakke din hospitalsmappe inden måned 8 sparer dig for stress i sidste øjeblik. Den indeholder typisk:',
    bagItems: [
      'ID-dokumenter og dit graviditetshæfte',
      'Behagelig tøj til dig og babyen',
      'Toiletartikler og barselsbind',
      'Et sæt tøj til babyen til hjemturen',
    ],
    birthPlanPoints: [
      'Dine præferencer for smertelindring',
      'Hvem du gerne vil have til stede under fødslen',
      'Dine forventninger til hud-mod-hud-kontakt',
    ],
    neutralText:
      'En enkel fødselsplan hjælper dig med at dele dine ønsker med det medicinske team, mens du holder dig åben: det faktiske forløb kan ændre sig afhængigt af situationen.',
    tipTitle: 'Godt at vide',
    tipText:
      'Forberedelse betyder ikke at kontrollere alt: det handler primært om at give dig selv mulighed for at nærme sig den store dag med mere selvtillid og mindre usikkerhed.',
    shareMessage: 'Rolig forberedelse til fødslen — AWA',
  },
  sv: {
    badge: 'GRAVIDITET • FÖDSEL',
    title: 'Rolig forberedelse\ntil födslen',
    metaDuration: '7 min. läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemset indhold',
    intro: 'Tre söjler till at närme sig den store dag med mere selvtillid.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Forberedelse i 3 trin',
      'Din hospitalsmappe',
      'Skriv din födselsplan',
      'Värd at bemärke',
      'Hvad du skal huske',
    ],
    prepSteps: [
      'Födselsforberedelseskurser',
      'Åndedräts- och afslapningsteknikker',
      'Hospitalsmappe klar inden måned 8',
    ],
    body1:
      'Födselsforberedelseskurser hjälper dig med at forstå faserne i födselsprocessen och de åndedrätsteknikker, der vil stötte dig den store dag.',
    body2:
      'At pakke din hospitalsmappe inden måned 8 sparer dig for stress i sidste öjeblik. Den indeholder typisk:',
    bagItems: [
      'ID-dokumenter och ditt graviditetshäfte',
      'Behagelig töj till dig och babyen',
      'Toiletartikler och barselsbind',
      'Et sät töj till babyen till hjemturen',
    ],
    birthPlanPoints: [
      'Dine präferencer for smertelindring',
      'Hvem du gerne vil have till stede under födslen',
      'Dine forventninger till hud-mod-hud-kontakt',
    ],
    neutralText:
      'En enkel födselsplan hjälper dig med at dele dina önsker med det medicinske team, mens du holder dig åben: det faktiske forlöb kan ändre sig afhängigt av situationen.',
    tipTitle: 'Godt at vide',
    tipText:
      'Forberedelse betyder inte at kontrollere alt: det handler primärt om at give dig selv mulighed for att närme sig den store dag med mere selvtillid och mindre usikkerhed.',
    shareMessage: 'Rolig forberedelse till födslen — AWA',
  },
  nb: {
    badge: 'SVANGERSKAP • FØDSEL',
    title: 'Forberede seg rolig\ntil fødselen',
    metaDuration: '7 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Tre pilarer for å møte den store dagen med mer trygghet.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Forberede seg i 3 trinn',
      'Sykehusvesken din',
      'Skrive en fødselsplan',
      'Verdt å merke seg',
      'Det viktigste å huske',
    ],
    prepSteps: [
      'Fødselsforberedende kurs',
      'Pusteteknikker og avspenning',
      'Sykehusvesken klar innen måned 8',
    ],
    body1:
      'Fødselsforberedende kurs hjelper deg å forstå fasene i fødselen og pusteteknikkene som vil støtte deg på den store dagen.',
    body2:
      'Å pakke sykehusvesken innen måned 8 sparer deg for stress i siste liten. Den inneholder vanligvis:',
    bagItems: [
      'ID-dokumenter og svangerskapskortet ditt',
      'Behagelige klær til deg og babyen',
      'Toalettsaker og barselbind',
      'Et antrekk som babyen skal ha på hjem',
    ],
    birthPlanPoints: [
      'Dine ønsker for smertelindring',
      'Hvem du vil ha til stede under fødselen',
      'Dine forventninger til hud mot hud',
    ],
    neutralText:
      'En enkel fødselsplan hjelper deg å dele ønskene dine med det medisinske teamet, samtidig som du er åpen: det faktiske forløpet kan endre seg etter omstendighetene.',
    tipTitle: 'Godt å vite',
    tipText:
      'Å forberede seg betyr ikke å kontrollere alt: det handler først og fremst om å gi seg selv midlene til å møte den store dagen med mer trygghet og mindre usikkerhet.',
    shareMessage: 'Forberede seg rolig til fødselen – AWA',
  },
  pl: {
    badge: 'CIĄŻA • PORÓD',
    title: 'Spokojne przygotowanie\ndo porodu',
    metaDuration: '7 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Trzy filary, by z większą pewnością podejść do wielkiego dnia.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Przygotowanie w 3 krokach',
      'Torba do szpitala',
      'Pisanie planu porodu',
      'Warto wiedzieć',
      'Co zapamiętać',
    ],
    prepSteps: [
      'Szkoła rodzenia',
      'Techniki oddychania i relaksacji',
      'Torba do szpitala spakowana do 8. miesiąca',
    ],
    body1:
      'Szkoła rodzenia pomaga zrozumieć etapy porodu i techniki oddychania, które będą Cię wspierać w wielkim dniu.',
    body2:
      'Spakowanie torby do szpitala do 8. miesiąca oszczędza stresu w ostatniej chwili. Zwykle znajdują się w niej:',
    bagItems: [
      'Dokumenty tożsamości i karta przebiegu ciąży',
      'Wygodne ubrania dla Ciebie i dla dziecka',
      'Kosmetyki i podpaski poporodowe',
      'Ubranko dla dziecka na wyjście ze szpitala',
    ],
    birthPlanPoints: [
      'Twoje preferencje dotyczące łagodzenia bólu',
      'Kogo chcesz mieć przy sobie podczas porodu',
      'Twoje oczekiwania dotyczące kontaktu skóra do skóry',
    ],
    neutralText:
      'Prosty plan porodu pomaga przekazać Twoje życzenia zespołowi medycznemu, przy zachowaniu otwartości: rzeczywisty przebieg może się zmienić w zależności od sytuacji.',
    tipTitle: 'Warto wiedzieć',
    tipText:
      'Przygotowanie nie oznacza kontrolowania wszystkiego: chodzi głównie o to, by dać sobie możliwość podejścia do wielkiego dnia z większą pewnością i mniejszą niepewnością.',
    shareMessage: 'Spokojne przygotowanie do porodu — AWA',
  },
  uk: {
    badge: 'ВАГІТНІСТЬ • ПОЛОГИ',
    title: 'Спокійна підготовка\nдо пологів',
    metaDuration: '7 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Три опори, щоб з більшою впевненістю зустріти великий день.',
    contentsTitle: 'У цій статті',
    topics: [
      'Підготовка у 3 кроки',
      'Ваша лікарняна сумка',
      'Складання плану пологів',
      'Варто знати',
      'Що запам’ятати',
    ],
    prepSteps: [
      'Курси підготовки до пологів',
      'Техніки дихання та релаксації',
      'Лікарняна сумка зібрана до 8-го місяця',
    ],
    body1:
      'Курси підготовки до пологів допомагають зрозуміти етапи пологів і техніки дихання, що підтримуватимуть вас у великий день.',
    body2:
      'Зібрана до 8-го місяця лікарняна сумка рятує від стресу в останню мить. Зазвичай до неї входять:',
    bagItems: [
      'Документи та обмінна карта вагітної',
      'Зручний одяг для вас і для дитини',
      'Засоби особистої гігієни та післяпологові прокладки',
      'Одяг для дитини на виписку',
    ],
    birthPlanPoints: [
      'Ваші побажання щодо знеболення',
      'Кого ви хотіли б бачити поруч під час пологів',
      'Ваші очікування щодо контакту «шкіра до шкіри»',
    ],
    neutralText:
      'Простий план пологів допомагає донести ваші побажання до медичної команди, залишаючись відкритою до змін: реальний перебіг може змінитися залежно від ситуації.',
    tipTitle: 'Варто знати',
    tipText:
      'Підготовка не означає контролювати все: головне — дати собі змогу зустріти великий день з більшою впевненістю та меншою невизначеністю.',
    shareMessage: 'Спокійна підготовка до пологів — AWA',
  },
  cs: {
    badge: 'TĚHOTENSTVÍ • POROD',
    title: 'Klidná příprava\nna porod',
    metaDuration: '7 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Tři pilíře, které vám pomohou přistoupit k velkému dni s větší důvěrou.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Příprava ve 3 krocích',
      'Taška do porodnice',
      'Sestavení porodního plánu',
      'Stojí za zmínku',
      'Co si zapamatovat',
    ],
    prepSteps: [
      'Kurzy přípravy na porod',
      'Techniky dýchání a uvolnění',
      'Taška do porodnice připravená do 8. měsíce',
    ],
    body1:
      'Kurzy přípravy na porod vám pomohou porozumět jednotlivým fázím porodu a technikám dýchání, které vás ve velký den podpoří.',
    body2:
      'Sbalit tašku do porodnice do 8. měsíce vám ušetří stres na poslední chvíli. Obvykle obsahuje:',
    bagItems: [
      'Doklady totožnosti a těhotenskou průkazku',
      'Pohodlné oblečení pro vás i pro miminko',
      'Hygienické potřeby a poporodní vložky',
      'Oblečení pro miminko na cestu domů',
    ],
    birthPlanPoints: [
      'Vaše preference ohledně zvládání bolesti',
      'Koho byste chtěla mít přítomného u porodu',
      'Vaše očekávání ohledně kontaktu kůže na kůži',
    ],
    neutralText:
      'Jednoduchý porodní plán vám pomůže sdělit svá přání zdravotnickému týmu při zachování otevřenosti: skutečný průběh se může podle situace změnit.',
    tipTitle: 'Stojí za to vědět',
    tipText:
      'Příprava neznamená mít vše pod kontrolou: jde hlavně o to dát si prostředky k tomu, abyste mohla přistoupit k velkému dni s větší důvěrou a menší nejistotou.',
    shareMessage: 'Klidná příprava na porod — AWA',
  },
  sk: {
    badge: 'TEHOTENSTVO • PÔROD',
    title: 'Pokojná príprava\nna pôrod',
    metaDuration: '7 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Tri piliere, vďaka ktorým pristúpite k veľkému dňu s väčšou dôverou.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Príprava v 3 krokoch',
      'Vaša taška do pôrodnice',
      'Písanie pôrodného plánu',
      'Stojí za zmienku',
      'Čo si zapamätať',
    ],
    prepSteps: [
      'Kurzy prípravy na pôrod',
      'Dychové a relaxačné techniky',
      'Taška do pôrodnice pripravená do 8. mesiaca',
    ],
    body1:
      'Kurzy prípravy na pôrod vám pomáhajú pochopiť fázy pôrodu a dychové techniky, ktoré vás budú v deň pôrodu podporovať.',
    body2:
      'Zbalenie tašky do pôrodnice do 8. mesiaca vám ušetrí stres na poslednú chvíľu. Zvyčajne obsahuje:',
    bagItems: [
      'Doklady totožnosti a tehotenskú knižku',
      'Pohodlné oblečenie pre vás a bábätko',
      'Hygienické potreby a popôrodné vložky',
      'Oblečenie pre bábätko na cestu domov',
    ],
    birthPlanPoints: [
      'Vaše preferencie pri zvládaní bolesti',
      'Koho by ste chceli mať prítomného pri pôrode',
      'Vaše očakávania ohľadom kontaktu koža na kožu',
    ],
    neutralText:
      'Jednoduchý pôrodný plán vám pomáha oznámiť svoje želania zdravotníckemu tímu a zároveň zostať otvorená: skutočný priebeh sa môže podľa situácie zmeniť.',
    tipTitle: 'Stojí za to vedieť',
    tipText:
      'Pripraviť sa neznamená mať všetko pod kontrolou: ide najmä o to, dať si prostriedky, aby ste k veľkému dňu pristúpili s väčšou dôverou a menšou neistotou.',
    shareMessage: 'Pokojná príprava na pôrod — AWA',
  },
  hu: {
    badge: 'TERHESSÉG • SZÜLÉS',
    title: 'Nyugodt felkészülés\na szülésre',
    metaDuration: '7 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Három pillér, hogy nagyobb magabiztossággal nézz a nagy nap elé.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Felkészülés 3 lépésben',
      'A kórházi táskád',
      'A szülési terv megírása',
      'Érdemes megjegyezni',
      'Amit érdemes megjegyezni',
    ],
    prepSteps: [
      'Szülésfelkészítő tanfolyamok',
      'Légzési és relaxációs technikák',
      'A kórházi táska a 8. hónapra kész',
    ],
    body1:
      'A szülésfelkészítő tanfolyamok segítenek megérteni a szülés szakaszait és a légzési technikákat, amelyek a nagy napon támogatnak.',
    body2:
      'A kórházi táska 8. hónapig való összecsomagolása megkíméli az utolsó pillanatos stressztől. Általában ezeket tartalmazza:',
    bagItems: [
      'Személyi okmányok és a terhesgondozási könyved',
      'Kényelmes ruházat neked és a babának',
      'Tisztálkodószerek és szülés utáni betétek',
      'Egy ruha a babának hazafelé',
    ],
    birthPlanPoints: [
      'A fájdalomcsillapítással kapcsolatos preferenciáid',
      'Kit szeretnél jelen tudni a szülés alatt',
      'Az elvárásaid a bőrkontaktussal kapcsolatban',
    ],
    neutralText:
      'Egy egyszerű szülési terv segít közölni a kívánságaidat az egészségügyi csapattal, miközben nyitott maradsz: a tényleges lefolyás a helyzettől függően változhat.',
    tipTitle: 'Érdemes tudni',
    tipText:
      'A felkészülés nem azt jelenti, hogy mindent kontrollálsz: főként arról szól, hogy eszközöket adsz magadnak ahhoz, hogy nagyobb magabiztossággal és kevesebb bizonytalansággal nézz a nagy nap elé.',
    shareMessage: 'Nyugodt felkészülés a szülésre — AWA',
  },
  ro: {
    badge: 'SARCINĂ • NAȘTERE',
    title: 'Pregătirea liniștită\npentru naștere',
    metaDuration: '7 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Trei piloni pentru a întâmpina marea zi cu mai multă încredere.',
    contentsTitle: 'În acest articol',
    topics: [
      'Pregătirea în 3 pași',
      'Geanta pentru maternitate',
      'Redactarea planului de naștere',
      'De reținut',
      'Ce să reții',
    ],
    prepSteps: [
      'Cursuri de pregătire pentru naștere',
      'Tehnici de respirație și relaxare',
      'Geanta pentru maternitate pregătită până în luna a 8-a',
    ],
    body1:
      'Cursurile de pregătire pentru naștere te ajută să înțelegi etapele travaliului și tehnicile de respirație care te vor sprijini în ziua cea mare.',
    body2:
      'Pregătirea genții pentru maternitate până în luna a 8-a îți scutește stresul de ultim moment. De obicei include:',
    bagItems: [
      'Acte de identitate și carnetul de gravidă',
      'Haine confortabile pentru tine și pentru bebeluș',
      'Articole de toaletă și absorbante postnatale',
      'O ținută pentru bebeluș, pentru drumul spre casă',
    ],
    birthPlanPoints: [
      'Preferințele tale privind gestionarea durerii',
      'Cine ai vrea să fie prezent în timpul travaliului',
      'Așteptările tale privind contactul piele pe piele',
    ],
    neutralText:
      'Un plan de naștere simplu te ajută să-ți împărtășești dorințele cu echipa medicală, rămânând în același timp deschisă: desfășurarea reală se poate schimba în funcție de situație.',
    tipTitle: 'Bine de știut',
    tipText:
      'A te pregăti nu înseamnă a controla totul: înseamnă mai ales a-ți oferi mijloacele de a întâmpina marea zi cu mai multă încredere și mai puțină nesiguranță.',
    shareMessage: 'Pregătirea liniștită pentru naștere — AWA',
  },
  bg: {
    badge: 'БРЕМЕННОСТ • РАЖДАНЕ',
    title: 'Спокойна подготовка\nза раждане',
    metaDuration: '7 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Три стълба, за да посрещнеш големия ден с повече увереност.',
    contentsTitle: 'В тази статия',
    topics: [
      'Подготовка в 3 стъпки',
      'Чантата за родилния дом',
      'Съставяне на план за раждането',
      'Важно е да се отбележи',
      'Какво да запомниш',
    ],
    prepSteps: [
      'Курсове за подготовка за раждане',
      'Техники за дишане и релаксация',
      'Чантата за родилния дом е готова до 8-ия месец',
    ],
    body1:
      'Курсовете за подготовка за раждане ти помагат да разбереш етапите на родилния процес и техниките за дишане, които ще те подкрепят в големия ден.',
    body2:
      'Приготвянето на чантата за родилния дом до 8-ия месец ти спестява стреса в последния момент. Обикновено включва:',
    bagItems: [
      'Документи за самоличност и бременната ти книжка',
      'Удобни дрехи за теб и за бебето',
      'Тоалетни принадлежности и следродилни превръзки',
      'Тоалет за бебето, с който да се прибере у дома',
    ],
    birthPlanPoints: [
      'Предпочитанията ти за справяне с болката',
      'Кого би искала да присъства по време на раждането',
      'Очакванията ти за контакта кожа до кожа',
    ],
    neutralText:
      'Простият план за раждането ти помага да споделиш желанията си с медицинския екип, като същевременно остане отворена: действителният ход на събитията може да се промени според ситуацията.',
    tipTitle: 'Добре е да знаеш',
    tipText:
      'Подготовката не означава да контролираш всичко: става въпрос най-вече да си дадеш средствата да посрещнеш големия ден с повече увереност и по-малко несигурност.',
    shareMessage: 'Спокойна подготовка за раждане — AWA',
  },
  sr: {
    badge: 'ТРУДНОЋА • ПОРОЂАЈ',
    title: 'Мирна припрема\nза порођај',
    metaDuration: '7 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Три стуба да великом дану приђеш са више самопоуздања.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Припрема у 3 корака',
      'Твоја торба за болницу',
      'Писање плана порођаја',
      'Вреди напоменути',
      'Шта да запамтиш',
    ],
    prepSteps: [
      'Курсеви припреме за порођај',
      'Технике дисања и релаксације',
      'Торба за болницу спремна до 8. месеца',
    ],
    body1:
      'Курсеви припреме за порођај помажу ти да разумеш фазе порођаја и технике дисања које ће те подржати на велики дан.',
    body2:
      'Паковање торбе за болницу до 8. месеца штеди ти стрес у последњем тренутку. Обично садржи:',
    bagItems: [
      'Личне исправе и књижицу трудноће',
      'Удобну одећу за тебе и бебу',
      'Тоалетне потрепштине и улошке за период после порођаја',
      'Одећу у којој беба иде кући',
    ],
    birthPlanPoints: [
      'Твоје жеље у вези са управљањем болом',
      'Кога би желела да имаш уз себе током порођаја',
      'Твоја очекивања у вези са контактом кожа на кожу',
    ],
    neutralText:
      'Једноставан план порођаја помаже ти да поделиш своје жеље са медицинским тимом, уз отвореност: стварни ток догађаја може се променити зависно од ситуације.',
    tipTitle: 'Добро је знати',
    tipText:
      'Припремити се не значи контролисати све: пре свега значи дати себи средства да великом дану приђеш са више самопоуздања и мање неизвесности.',
    shareMessage: 'Мирна припрема за порођај — AWA',
  },
  hr: {
    badge: 'TRUDNOĆA • POROD',
    title: 'Mirna priprema\nza porod',
    metaDuration: '7 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Tri stupa za doček velikog dana s više povjerenja.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Priprema u 3 koraka',
      'Tvoja torba za rodilište',
      'Pisanje plana poroda',
      'Vrijedi napomenuti',
      'Što zapamtiti',
    ],
    prepSteps: [
      'Tečajevi pripreme za porod',
      'Tehnike disanja i opuštanja',
      'Torba za rodilište spremna do 8. mjeseca',
    ],
    body1:
      'Tečajevi pripreme za porod pomažu ti razumjeti faze poroda i tehnike disanja koje će te poduprijeti na veliki dan.',
    body2:
      'Pakiranje torbe za rodilište do 8. mjeseca štedi te stresa u zadnji čas. Obično uključuje:',
    bagItems: [
      'Osobne isprave i trudničku knjižicu',
      'Udobnu odjeću za tebe i bebu',
      'Toaletne potrepštine i poslijeporođajne uloške',
      'Odjeću u kojoj će beba ići kući',
    ],
    birthPlanPoints: [
      'Tvoje želje u vezi s ublažavanjem boli',
      'Tko bi želio biti prisutan tijekom poroda',
      'Tvoja očekivanja u vezi s kontaktom koža na kožu',
    ],
    neutralText:
      'Jednostavan plan poroda pomaže ti podijeliti svoje želje s medicinskim timom, uz otvorenost prema drugačijem: stvarni tijek može se promijeniti ovisno o okolnostima.',
    tipTitle: 'Dobro je znati',
    tipText:
      'Priprema ne znači imati kontrolu nad svime: ponajprije je riječ o tome da si daš sredstva za doček velikog dana s više povjerenja i manje neizvjesnosti.',
    shareMessage: 'Mirna priprema za porod — AWA',
  },
  bs: {
    badge: 'TRUDNOĆA • POROD',
    title: 'Mirna priprema\nza porođaj',
    metaDuration: '7 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Tri stupa za doček velikog dana s više povjerenja.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Priprema u 3 koraka',
      'Tvoja torba za rodilište',
      'Pisanje plana porođaja',
      'Vrijedi napomenuti',
      'Što zapamtiti',
    ],
    prepSteps: [
      'Tečajevi pripreme za porođaj',
      'Tehnike disanja i opuštanja',
      'Torba za rodilište spremna do 8. mjeseca',
    ],
    body1:
      'Tečajevi pripreme za porođaj pomažu ti razumjeti faze porođaja i tehnike disanja koje će te poduprijeti na veliki dan.',
    body2:
      'Pakiranje torbe za rodilište do 8. mjeseca štedi te stresa u zadnji čas. Obično uključuje:',
    bagItems: [
      'Osobne isprave i trudničku knjižicu',
      'Udobnu odjeću za tebe i bebu',
      'Toaletne potrepštine i poslijeporođajne uloške',
      'Odjeću u kojoj će beba ići kući',
    ],
    birthPlanPoints: [
      'Tvoje želje u vezi s ublažavanjem boli',
      'Ko bi želio biti prisutan tokom porođaja',
      'Tvoja očekivanja u vezi s kontaktom koža na kožu',
    ],
    neutralText:
      'Jednostavan plan porođaja pomaže ti podijeliti svoje želje s medicinskim timom, uz otvorenost prema drugačijem: stvarni tok može se promijeniti ovisno o okolnostima.',
    tipTitle: 'Dobro je znati',
    tipText:
      'Priprema ne znači imati kontrolu nad svime: ponajprije je riječ o tome da si daš sredstva za doček velikog dana s više povjerenja i manje neizvjesnosti.',
    shareMessage: 'Mirna priprema za porođaj — AWA',
  },
  sl: {
    badge: 'NOSEČNOST • POROD',
    title: 'Mirna priprava\nna porod',
    metaDuration: '7 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Trije stebri za doživetje velikega dne z več zaupanja.',
    contentsTitle: 'V tem članku',
    topics: [
      'Priprava v 3 korakih',
      'Tvoja torba za porodnišnico',
      'Pisanje načrta poroda',
      'Vredno omeniti',
      'Kaj si zapomniti',
    ],
    prepSteps: [
      'Tečaji priprave na porod',
      'Tehnike dihanja in sproščanja',
      'Torba za porodnišnico pripravljena do 8. meseca',
    ],
    body1:
      'Tečaji priprave na porod ti pomagajo razumeti faze poroda in tehnike dihanja, ki te bodo podprle na veliki dan.',
    body2:
      'Pakiranje torbe za porodnišnico do 8. meseca te obvaruje stresa v zadnjem trenutku. Običajno vključuje:',
    bagItems: [
      'Osebne dokumente in nosečniško knjižico',
      'Udobna oblačila za tebe in dojenčka',
      'Toaletne potrebščine in poporodne vložke',
      'Oblačila, v katerih bo dojenček šel domov',
    ],
    birthPlanPoints: [
      'Tvoje želje glede lajšanja bolečin',
      'Koga bi želela imeti ob sebi med porodom',
      'Tvoja pričakovanja glede stika koža na kožo',
    ],
    neutralText:
      'Preprost načrt poroda ti pomaga deliti svoje želje z medicinsko ekipo, ob odprtosti za drugačno: dejanski potek se lahko spremeni glede na okoliščine.',
    tipTitle: 'Vredno vedeti',
    tipText:
      'Priprava ne pomeni imeti nadzor nad vsem: predvsem gre za to, da si daš sredstva za doživetje velikega dne z več zaupanja in manj negotovosti.',
    shareMessage: 'Mirna priprava na porod — AWA',
  },
  ne: {
    badge: 'गर्भावस्था • प्रसव',
    title: 'शान्तिपूर्वक प्रसवको\nतयारी',
    metaDuration: '7 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'ठूलो दिनलाई थप आत्मविश्वासका साथ सामना गर्ने तीन आधारस्तम्भ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      '3 चरणमा तयारी',
      'तपाईंको अस्पतालको झोला',
      'आफ्नो प्रसव योजना लेख्ने',
      'ध्यान दिन लायक',
      'सम्झनुपर्ने कुराहरू',
    ],
    prepSteps: [
      'प्रसवपूर्व तयारीका कक्षाहरू',
      'सास फेर्ने र आराम गर्ने तरिकाहरू',
      'आठौँ महिनासम्म तयार अस्पतालको झोला',
    ],
    body1:
      'प्रसवपूर्व तयारीका कक्षाहरूले तपाईंलाई प्रसव पीडाका चरणहरू र ठूलो दिनमा तपाईंलाई साथ दिने सास फेर्ने तरिकाहरू बुझ्न मद्दत गर्छन्।',
    body2:
      'आठौँ महिनासम्म अस्पतालको झोला तयार राख्दा अन्तिम क्षणको तनावबाट बचिन्छ। यसमा सामान्यतया यी पर्छन्:',
    bagItems: [
      'परिचयपत्र र तपाईंको गर्भावस्थाको अभिलेख पुस्तिका',
      'तपाईं र शिशुका लागि सहज लुगाहरू',
      'सरसफाइका सामान र सुत्केरीपछिका प्याडहरू',
      'घर फर्कँदा शिशुका लागि एक जोर लुगा',
    ],
    birthPlanPoints: [
      'पीडा व्यवस्थापनबारे तपाईंका रुचिहरू',
      'प्रसव पीडाको समयमा तपाईं कसलाई उपस्थित चाहनुहुन्छ',
      'छालाले छालामा सम्पर्कबारे तपाईंका अपेक्षाहरू',
    ],
    neutralText:
      'एउटा सरल प्रसव योजनाले तपाईंलाई आफ्ना चाहनाहरू चिकित्सकीय टोलीसँग साझा गर्न मद्दत गर्छ, साथै खुला मन राख्न पनि: वास्तविक घटनाक्रम अवस्थाअनुसार बदलिन सक्छ।',
    tipTitle: 'जान्न लायक',
    tipText:
      'तयारी गर्नुको अर्थ सबै कुरा नियन्त्रण गर्नु होइन: यो मुख्यतया ठूलो दिनलाई थप आत्मविश्वास र कम अनिश्चितताका साथ सामना गर्ने साधन आफूलाई दिनु हो।',
    shareMessage: 'शान्तिपूर्वक प्रसवको तयारी — AWA',
  },
  si: {
    badge: 'ගර්භණී කාලය • ප්‍රසූතිය',
    title: 'ප්‍රසූතියට සන්සුන්ව\nසූදානම් වීම',
    metaDuration: 'කියවීමට මිනිත්තු 7',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ප්‍රධාන දිනයට වැඩි විශ්වාසයකින් ළඟා වීමට ආධාරක තුනක්.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'පියවර 3කින් සූදානම් වීම',
      'ඔබේ රෝහල් බෑගය',
      'ඔබේ ප්‍රසූත සැලැස්ම ලිවීම',
      'සටහන් කිරීම වටී',
      'මතක තබාගත යුතු දේ',
    ],
    prepSteps: [
      'ප්‍රසූතියට සූදානම් වීමේ පන්ති',
      'හුස්ම ගැනීමේ සහ ලිහිල් කිරීමේ ක්‍රම',
      '8 වන මාසය වන විට රෝහල් බෑගය සූදානම්',
    ],
    body1:
      'ප්‍රසූතියට සූදානම් වීමේ පන්ති ඔබට ප්‍රසව වේදනාවේ අවධි සහ ප්‍රධාන දිනයේ ඔබට සහාය වන හුස්ම ගැනීමේ ක්‍රම තේරුම් ගැනීමට උපකාරී වේ.',
    body2:
      '8 වන මාසය වන විට ඔබේ රෝහල් බෑගය පැකේජ් කිරීම අවසාන මොහොතේ ආතතියෙන් ඔබව බේරා ගනී. එයට සාමාන්‍යයෙන් ඇතුළත් වන්නේ:',
    bagItems: [
      'හැඳුනුම් ලේඛන සහ ඔබේ ගර්භණී වාර්තා පොත',
      'ඔබටත් දරුවාටත් සුවපහසු ඇඳුම්',
      'සනීපාරක්ෂක භාණ්ඩ සහ ප්‍රසූතියෙන් පසු පෑඩ්',
      'දරුවාට ගෙදර යාමට ඇඳුමක්',
    ],
    birthPlanPoints: [
      'වේදනාව කළමනාකරණය කිරීම සඳහා ඔබේ මනාප',
      'ප්‍රසව වේදනාව අතරතුර ඔබට සිටීමට අවශ්‍ය අය',
      'සමෙන්-සමට ස්පර්ශය පිළිබඳ ඔබේ අපේක්ෂාවන්',
    ],
    neutralText:
      'සරල ප්‍රසූත සැලැස්මක් ඔබේ කැමැත්ත වෛද්‍ය කණ්ඩායම සමඟ බෙදාගැනීමට උපකාරී වන අතර, විවෘත මනසකින් සිටීමටද උපකාරී වේ: සැබෑ සිදුවීම් අනුපිළිවෙල තත්ත්වය අනුව වෙනස් විය හැක.',
    tipTitle: 'දැනගත යුතු දේ',
    tipText:
      'සූදානම් වීම යනු සෑම දෙයක්ම පාලනය කිරීම නොවේ: එය ප්‍රධාන වශයෙන් අවිනිශ්චිතතාව අඩුවෙන් සහ වැඩි විශ්වාසයකින් ප්‍රධාන දිනයට ළඟා වීමට ඔබටම මාර්ග ලබා දීමයි.',
    shareMessage: 'ප්‍රසූතියට සන්සුන්ව සූදානම් වීම — AWA',
  },
  th: {
    badge: 'การตั้งครรภ์ • การคลอด',
    title: 'เตรียมตัวคลอด\nอย่างสงบ',
    metaDuration: 'อ่าน 7 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'สามเสาหลักเพื่อเผชิญวันสำคัญด้วยความมั่นใจมากขึ้น',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'เตรียมตัวใน 3 ขั้นตอน',
      'กระเป๋าไปโรงพยาบาลของคุณ',
      'การเขียนแผนการคลอด',
      'ข้อควรทราบ',
      'สิ่งที่ควรจำ',
    ],
    prepSteps: [
      'คลาสเตรียมคลอด',
      'เทคนิคการหายใจและการผ่อนคลาย',
      'เตรียมกระเป๋าไปโรงพยาบาลให้พร้อมภายในเดือนที่ 8',
    ],
    body1:
      'คลาสเตรียมคลอดช่วยให้คุณเข้าใจขั้นตอนของการเจ็บครรภ์และเทคนิคการหายใจที่จะช่วยคุณในวันสำคัญ',
    body2:
      'การเตรียมกระเป๋าไปโรงพยาบาลภายในเดือนที่ 8 ช่วยให้คุณไม่เครียดในนาทีสุดท้าย โดยทั่วไปประกอบด้วย:',
    bagItems: [
      'เอกสารประจำตัวและสมุดบันทึกสุขภาพแม่และเด็ก',
      'เสื้อผ้าสบาย ๆ สำหรับคุณและทารก',
      'ของใช้ส่วนตัวและผ้าอนามัยหลังคลอด',
      'ชุดสำหรับให้ทารกใส่กลับบ้าน',
    ],
    birthPlanPoints: [
      'ความต้องการของคุณเรื่องการจัดการความเจ็บปวด',
      'คนที่คุณอยากให้อยู่ด้วยระหว่างการคลอด',
      'ความคาดหวังของคุณเรื่องการสัมผัสเนื้อแนบเนื้อ',
    ],
    neutralText:
      'แผนการคลอดแบบง่าย ๆ ช่วยให้คุณบอกความต้องการแก่ทีมแพทย์ โดยยังเปิดใจไว้: เหตุการณ์จริงอาจเปลี่ยนไปตามสถานการณ์',
    tipTitle: 'ควรรู้',
    tipText:
      'การเตรียมตัวไม่ได้หมายถึงการควบคุมทุกอย่าง: แต่เป็นการมอบเครื่องมือให้ตัวเองเผชิญวันสำคัญด้วยความมั่นใจมากขึ้นและความไม่แน่นอนน้อยลง',
    shareMessage: 'เตรียมตัวคลอดอย่างสงบ — AWA',
  },
  vi: {
    badge: 'THAI KỲ • CUỘC SINH',
    title: 'Chuẩn bị cho cuộc sinh\nmột cách bình tĩnh',
    metaDuration: '7 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Ba trụ cột để đón ngày trọng đại với nhiều tự tin hơn.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Chuẩn bị qua 3 bước',
      'Túi đồ đi sinh của bạn',
      'Viết kế hoạch sinh',
      'Điều đáng lưu ý',
      'Điều cần nhớ',
    ],
    prepSteps: [
      'Các lớp chuẩn bị cho cuộc sinh',
      'Kỹ thuật hít thở và thư giãn',
      'Túi đồ đi sinh sẵn sàng từ tháng thứ 8',
    ],
    body1:
      'Các lớp chuẩn bị cho cuộc sinh giúp bạn hiểu các giai đoạn của chuyển dạ và những kỹ thuật hít thở sẽ hỗ trợ bạn trong ngày trọng đại.',
    body2:
      'Chuẩn bị túi đồ đi sinh từ tháng thứ 8 giúp bạn tránh căng thẳng vào phút chót. Túi thường gồm:',
    bagItems: [
      'Giấy tờ tùy thân và sổ theo dõi thai kỳ của bạn',
      'Quần áo thoải mái cho bạn và em bé',
      'Đồ dùng vệ sinh cá nhân và băng vệ sinh sau sinh',
      'Một bộ đồ cho em bé mặc khi về nhà',
    ],
    birthPlanPoints: [
      'Mong muốn của bạn về cách kiểm soát cơn đau',
      'Người bạn muốn có mặt trong lúc chuyển dạ',
      'Mong đợi của bạn về việc tiếp xúc da kề da',
    ],
    neutralText:
      'Một kế hoạch sinh đơn giản giúp bạn chia sẻ mong muốn của mình với đội ngũ y tế, đồng thời giữ tinh thần cởi mở: diễn biến thực tế có thể thay đổi tùy theo tình huống.',
    tipTitle: 'Nên biết',
    tipText:
      'Chuẩn bị không có nghĩa là kiểm soát mọi thứ: chủ yếu là tự trang bị cho mình những phương tiện để đón ngày trọng đại với nhiều tự tin hơn và bớt bất định hơn.',
    shareMessage: 'Chuẩn bị cho cuộc sinh một cách bình tĩnh — AWA',
  },
  uz: {
    badge: 'HOMILADORLIK • TUGʻRUQ',
    title: 'Tugʻruqqa xotirjam\ntayyorlanish',
    metaDuration: '7 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Katta kunga koʻproq ishonch bilan yondashishning uch tayanchi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      '3 bosqichda tayyorgarlik',
      'Tugʻruqxona sumkangiz',
      'Tugʻruq rejasini yozish',
      'Eʼtiborga loyiq jihatlar',
      'Esda tutish kerak boʻlgan narsalar',
    ],
    prepSteps: [
      'Tugʻruqqa tayyorgarlik kurslari',
      'Nafas olish va boʻshashish usullari',
      '8-oyga qadar tayyor tugʻruqxona sumkasi',
    ],
    body1:
      'Tugʻruqqa tayyorgarlik kurslari tugʻruq bosqichlarini va katta kunda sizni qoʻllab-quvvatlaydigan nafas olish usullarini tushunishga yordam beradi.',
    body2:
      'Tugʻruqxona sumkangizni 8-oyga qadar yigʻib qoʻyish oxirgi daqiqadagi stressdan qutqaradi. U odatda quyidagilarni oʻz ichiga oladi:',
    bagItems: [
      'Shaxsni tasdiqlovchi hujjatlar va homiladorlik daftarchasi',
      'Siz va chaqaloq uchun qulay kiyim',
      'Gigiyena vositalari va tugʻruqdan keyingi prokladkalar',
      'Chaqaloq uyga ketishi uchun kiyim',
    ],
    birthPlanPoints: [
      'Ogʻriqni boshqarish boʻyicha afzalliklaringiz',
      'Tugʻruq paytida kimning hozir boʻlishini xohlaysiz',
      'Teri-teriga aloqa boʻyicha kutganlaringiz',
    ],
    neutralText:
      'Oddiy tugʻruq rejasi istaklaringizni tibbiy jamoa bilan ulashishga yordam beradi, shu bilan birga ochiq fikrli qolasiz: haqiqiy jarayon vaziyatga qarab oʻzgarishi mumkin.',
    tipTitle: 'Bilish foydali',
    tipText:
      'Tayyorgarlik hamma narsani nazorat qilishni anglatmaydi: bu asosan katta kunga koʻproq ishonch va kamroq noaniqlik bilan yondashish imkoniyatini yaratish.',
    shareMessage: 'Tugʻruqqa xotirjam tayyorlanish — AWA',
  },
  az: {
    badge: 'HAMİLƏLİK • DOĞUŞ',
    title: 'Doğuşa sakitcə\nhazırlaşmaq',
    metaDuration: '7 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Böyük gün üçün daha çox əminliklə hazırlaşmaq üçün üç dayaq.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      '3 addımda hazırlıq',
      'Xəstəxana çantanız',
      'Doğuş planınızı yazmaq',
      'Qeyd etməyə dəyər',
      'Yadda saxlamalı məqamlar',
    ],
    prepSteps: [
      'Doğuşa hazırlıq kursları',
      'Nəfəs və rahatlama texnikaları',
      '8-ci aya qədər hazır xəstəxana çantası',
    ],
    body1:
      'Doğuşa hazırlıq kursları doğuşun mərhələlərini və böyük gündə sizi dəstəkləyəcək nəfəs texnikalarını anlamağa kömək edir.',
    body2:
      'Xəstəxana çantanızı 8-ci aya qədər hazırlamaq sizi son dəqiqə stressindən qoruyur. Ona adətən bunlar daxildir:',
    bagItems: [
      'Şəxsiyyət sənədləri və hamiləlik kitabçanız',
      'Sizin və körpə üçün rahat geyim',
      'Gigiyena ləvazimatları və doğuşdan sonrakı gigiyenik bezlər',
      'Körpənin evə getməsi üçün geyim dəsti',
    ],
    birthPlanPoints: [
      'Ağrının idarə edilməsi ilə bağlı üstünlükləriniz',
      'Doğuş zamanı kimin yanınızda olmasını istəyirsiniz',
      'Dəri-dəriyə təmasla bağlı gözləntiləriniz',
    ],
    neutralText:
      'Sadə doğuş planı istəklərinizi tibbi komandaya çatdırmağa kömək edir, eyni zamanda açıq fikirli qalmağa imkan verir: faktiki gediş vəziyyətdən asılı olaraq dəyişə bilər.',
    tipTitle: 'Bilmək faydalıdır',
    tipText:
      'Hazırlaşmaq hər şeyi idarə etmək demək deyil: bu, əsasən böyük günə daha çox əminlik və daha az qeyri-müəyyənliklə yanaşmaq üçün özünüzə imkan yaratmaqdır.',
    shareMessage: 'Doğuşa sakitcə hazırlaşmaq — AWA',
  },
  ka: {
    badge: 'ორსულობა • მშობიარობა',
    title: 'მშობიარობისთვის\nმშვიდად მომზადება',
    metaDuration: '7 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'სამი საყრდენი, რომ დიდ დღეს უფრო მეტი თავდაჯერებულობით შეხვდეთ.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'მომზადება 3 ნაბიჯში',
      'თქვენი საავადმყოფოს ჩანთა',
      'მშობიარობის გეგმის შედგენა',
      'აღსანიშნავია',
      'რა უნდა დაიმახსოვროთ',
    ],
    prepSteps: [
      'მშობიარობისთვის მოსამზადებელი კურსები',
      'სუნთქვისა და მოდუნების ტექნიკები',
      'საავადმყოფოს ჩანთა მზადაა მე-8 თვისთვის',
    ],
    body1:
      'მშობიარობისთვის მოსამზადებელი კურსები გეხმარებათ გაიგოთ მშობიარობის ეტაპები და სუნთქვის ტექნიკები, რომლებიც დიდ დღეს დაგიჭერთ მხარს.',
    body2:
      'საავადმყოფოს ჩანთის მომზადება მე-8 თვისთვის ბოლო წუთის სტრესისგან გიცავთ. ის, როგორც წესი, მოიცავს:',
    bagItems: [
      'პირადობის დოკუმენტებს და თქვენი ორსულობის წიგნაკს',
      'კომფორტულ ტანსაცმელს თქვენთვის და ბავშვისთვის',
      'ჰიგიენურ საშუალებებს და მშობიარობის შემდგომ საფენებს',
      'ბავშვისთვის სახლში წასაყვანად ტანსაცმელს',
    ],
    birthPlanPoints: [
      'თქვენი პრეფერენციები ტკივილის მართვასთან დაკავშირებით',
      'ვის ისურვებდით მშობიარობისას თქვენს გვერდით',
      'თქვენი მოლოდინები კანით კანთან კონტაქტთან დაკავშირებით',
    ],
    neutralText:
      'მარტივი მშობიარობის გეგმა გეხმარებათ თქვენი სურვილები სამედიცინო გუნდს გაუზიაროთ და ამავდროულად ღია დარჩეთ: მოვლენების რეალური მსვლელობა სიტუაციის მიხედვით შეიძლება შეიცვალოს.',
    tipTitle: 'კარგია ვიცოდეთ',
    tipText:
      'მომზადება არ ნიშნავს ყველაფრის კონტროლს: ის ძირითადად ნიშნავს, საკუთარ თავს მიეცეთ საშუალება დიდ დღეს უფრო მეტი თავდაჯერებულობით და ნაკლები გაურკვევლობით შეხვდეთ.',
    shareMessage: 'მშობიარობისთვის მშვიდად მომზადება — AWA',
  },
  hy: {
    badge: 'ՀՂԻՈՒԹՅՈՒՆ • ԾՆՆԴԱԲԵՐՈՒԹՅՈՒՆ',
    title: 'Հանգիստ նախապատրաստում\nծննդաբերությանը',
    metaDuration: '7 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Երեք հիմնասյուն՝ մեծ օրվան ավելի վստահությամբ մոտենալու համար:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Նախապատրաստում 3 քայլով',
      'Ձեր ծննդատան պայուսակը',
      'Ծննդաբերության պլանի կազմում',
      'Հարկ է նշել',
      'Ինչ հիշել',
    ],
    prepSteps: [
      'Ծննդաբերության նախապատրաստման դասընթացներ',
      'Շնչառության և թուլացման տեխնիկաներ',
      'Ծննդատան պայուսակը պատրաստ՝ 8-րդ ամսին',
    ],
    body1:
      'Ծննդաբերության նախապատրաստման դասընթացները օգնում են հասկանալ ծննդաբերության փուլերը և շնչառության տեխնիկաները, որոնք կաջակցեն ձեզ մեծ օրը:',
    body2:
      'Ծննդատան պայուսակը 8-րդ ամսին պատրաստելը խնայում է ձեզ վերջին պահի սթրեսից: Այն սովորաբար ներառում է.',
    bagItems: [
      'Անձը հաստատող փաստաթղթեր և ձեր հղիության գրանցամատյանը',
      'Հարմարավետ հագուստ ձեզ և երեխայի համար',
      'Հիգիենայի պարագաներ և հետծննդյան միջադիրներ',
      'Հագուստ, որով երեխան տուն կվերադառնա',
    ],
    birthPlanPoints: [
      'Ձեր նախասիրությունները ցավի կառավարման վերաբերյալ',
      'Ում կցանկանայիք տեսնել կողքին ծննդաբերության ժամանակ',
      'Ձեր սպասումները մաշկ-մաշկ շփման վերաբերյալ',
    ],
    neutralText:
      'Պարզ ծննդաբերության պլանը օգնում է ձեր ցանկությունները փոխանցել բժշկական թիմին՝ մնալով բաց. իրական ընթացքը կարող է փոխվել՝ կախված իրավիճակից:',
    tipTitle: 'Լավ է իմանալ',
    tipText:
      'Նախապատրաստվելը չի նշանակում ամեն ինչ վերահսկել. դա հիմնականում նշանակում է ինքներդ ձեզ միջոցներ տալ՝ մեծ օրին ավելի վստահությամբ և ավելի քիչ անորոշությամբ մոտենալու համար:',
    shareMessage: 'Հանգիստ նախապատրաստում ծննդաբերությանը — AWA',
  },
  tg: {
    badge: 'ҲОМИЛАДОРӢ • ТАВАЛЛУД',
    title: 'Омодагии оромона\nба таваллуд',
    metaDuration: '7 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Се сутун барои бо боварии бештар наздик шудан ба рӯзи бузург.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Омодагӣ дар 3 қадам',
      'Борхалтаи бемористони шумо',
      'Навиштани нақшаи таваллуд',
      'Қобили қайд',
      'Чӣ бояд дар хотир дошт',
    ],
    prepSteps: [
      'Курсҳои омодагӣ ба таваллуд',
      'Усулҳои нафаскашӣ ва ором шудан',
      'Борхалтаи бемористон то моҳи 8 омода бошад',
    ],
    body1:
      'Курсҳои омодагӣ ба таваллуд ба шумо кумак мекунанд марҳилаҳои таваллуд ва усулҳои нафаскаширо, ки дар рӯзи бузург шуморо дастгирӣ мекунанд, бифаҳмед.',
    body2:
      'Омода кардани борхалтаи бемористон то моҳи 8 шуморо аз изтироби лаҳзаи охир наҷот медиҳад. Он одатан иборат аст аз:',
    bagItems: [
      'Ҳуҷҷатҳои шахсӣ ва дафтарчаи ҳомиладории шумо',
      'Либоси роҳат барои шумо ва тифл',
      'Лавозимоти гигиенӣ ва пайвандҳои баъдизоӣ',
      'Либос барои тифл барои бозгашт ба хона',
    ],
    birthPlanPoints: [
      'Хоҳишҳои шумо дар бораи идораи дард',
      'Он касоне, ки мехоҳед ҳангоми таваллуд ҳузур дошта бошанд',
      'Интизориҳои шумо дар бораи тамоси пӯст ба пӯст',
    ],
    neutralText:
      'Нақшаи оддии таваллуд ба шумо кумак мекунад хоҳишҳои худро бо гурӯҳи тиббӣ мубодила кунед ва ҳамзамон кушодаандеш бимонед: рафти воқеӣ метавонад вобаста ба вазъият тағйир ёбад.',
    tipTitle: 'Донистан хуб аст',
    tipText:
      'Омодагӣ маънои ҳамаро назорат карданро надорад: он асосан ба шумо имкон медиҳад бо боварии бештар ва номуайянии камтар ба рӯзи бузург наздик шавед.',
    shareMessage: 'Омодагии оромона ба таваллуд — AWA',
  },
  ky: {
    badge: 'КУРСАКТУУЛУК • ТӨРӨТ',
    title: 'Төрөткө тынч\nдаярдануу',
    metaDuration: '7 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Чоң күнгө ишеним менен жакындоо үчүн үч тирөөч.',
    contentsTitle: 'Бул макалада',
    topics: [
      '3 кадамда даярдык',
      'Төрөтканага баштыкчаңыз',
      'Төрөт планын жазуу',
      'Эске алуу керек',
      'Эмнени эстен чыгарбоо керек',
    ],
    prepSteps: [
      'Төрөткө даярдык сабактары',
      'Дем алуу жана бошоңдоо ыкмалары',
      '8-айга чейин даяр төрөтканага баштыкча',
    ],
    body1:
      'Төрөткө даярдык сабактары төрөттүн этаптарын жана чоң күндө сизди колдой турган дем алуу ыкмаларын түшүнүүгө жардам берет.',
    body2:
      'Төрөтканага баштыкчаны 8-айга чейин даярдап коюу акыркы мүнөттөгү стресстен куткарат. Ал көбүнчө төмөнкүлөрдү камтыйт:',
    bagItems: [
      'Жеке документтер жана курсактуулук китепчеси',
      'Өзүңүз жана ымыркай үчүн ыңгайлуу кийим',
      'Гигиена каражаттары жана төрөттөн кийинки прокладкалар',
      'Ымыркайды үйгө алып кетүү үчүн кийим',
    ],
    birthPlanPoints: [
      'Оорутууну башкаруу боюнча тандооңуз',
      'Төрөт убагында кимдин катышуусун каалайсыз',
      'Тери менен тери байланышына карата күтүүлөрүңүз',
    ],
    neutralText:
      'Жөнөкөй төрөт планы каалоолоруңузду медициналык команда менен бөлүшүүгө жардам берет, ошол эле учурда ачык ойлуу болуңуз: иш жүзүндөгү жүрүш абалга жараша өзгөрүшү мүмкүн.',
    tipTitle: 'Билүү пайдалуу',
    tipText:
      'Даярдануу баарын көзөмөлдөө дегенди билдирбейт: бул негизинен чоң күнгө көбүрөөк ишеним менен жана азыраак белгисиздик менен жакындоого мүмкүнчүлүк берүү.',
    shareMessage: 'Төрөткө тынч даярдануу — AWA',
  },
  tk: {
    badge: 'GÖWRELILIK • DOGRUM',
    title: 'Dogruma\nasudalyk bilen taýýarlanmak',
    metaDuration: '7 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Uly güne has ynamly ýakynlaşmak üçin üç sütün.',
    contentsTitle: 'Bu makalada',
    topics: [
      '3 ädimde taýýarlanmak',
      'Hassahana sumkaňyz',
      'Dogrum meýilnamaňyzy ýazmak',
      'Bellemäge mynasyp zatlar',
      'Nämäni ýatda saklamaly',
    ],
    prepSteps: [
      'Dogruma taýýarlyk kurslary',
      'Dem alyş we dynç alyş usullary',
      '8-nji aýda taýýar hassahana sumkasy',
    ],
    body1:
      'Dogruma taýýarlyk kurslary dogrum tapgyrlaryny we uly günde size goldaw berjek dem alyş usullaryny düşünmäge kömek edýär.',
    body2:
      'Hassahana sumkaňyzy 8-nji aýa çenli taýýarlamak soňky minutdaky stresden halas edýär. Adatça şu zatlar girýär:',
    bagItems: [
      'Şahsyýet resminamalary we göwrelilik kitapçasy',
      'Özüňiz we bäbek üçin rahat eşikler',
      'Arassaçylyk zatlary we dograndan soňky gigiýeniki prokladkalar',
      'Bäbegiň öýe gitmegi üçin eşik',
    ],
    birthPlanPoints: [
      'Agyry dolandyrmak boýunça isleglerigiz',
      'Dogrum wagtynda ýanyňyzda kimiň bolmagyny isleýändigiňiz',
      'Deri bilen deri ýakynlygy barada garaşýanlaryňyz',
    ],
    neutralText:
      'Ýönekeý dogrum meýilnamasy islegleriňizi lukmançylyk toparyňyz bilen paýlaşmaga kömek edýär, şol bir wagtyň özünde açyk pikirli galmaga: hakyky wakalaryň ugry ýagdaýa görä üýtgäp biler.',
    tipTitle: 'Bilmek peýdaly',
    tipText:
      'Taýýarlanmak hemme zady dolandyrmak diýmek däl: bu esasan uly güne has ynam bilen we az näbelliligi bilen ýakynlaşmak üçin özüňize mümkinçilik bermek.',
    shareMessage: 'Dogruma asudalyk bilen taýýarlanmak — AWA',
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
