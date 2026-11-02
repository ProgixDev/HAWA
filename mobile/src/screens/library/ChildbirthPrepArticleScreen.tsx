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
  'zh-Hant': {
      badge: '懷孕 • 分娩',
      title: '從容準備\n迎接分娩',
      metaDuration: '閱讀約 7 分鐘',
      metaType: '指南',
      metaLevel: '入門',
      metaValidated: '已審閱內容',
      intro: '三個支柱，幫助你更有信心地迎接重要的那一天。',
      contentsTitle: '本文內容',
      topics: [
        '分三步做好準備',
        '你的待產包',
        '寫下你的分娩計劃',
        '值得注意',
        '需要記住的',
      ],
      prepSteps: [
        '分娩準備課程',
        '呼吸與放鬆技巧',
        '孕 8 個月前備好待產包',
      ],
      body1: '分娩準備課程可以幫助你瞭解產程的各個階段，以及在那一天能支援你的呼吸技巧。',
      body2: '在孕 8 個月前備好待產包，可以免去臨近時的慌亂。待產包通常包括：',
      bagItems: [
        '身份證件和你的孕期檔案本',
        '你和寶寶的舒適衣物',
        '洗漱用品和產婦衛生棉',
        '寶寶出院回家穿的衣服',
      ],
      birthPlanPoints: [
        '你對疼痛管理的偏好',
        '你希望誰在產程中陪伴',
        '你對肌膚接觸的期望',
      ],
      neutralText: '一份簡單的分娩計劃，可以幫助你向醫療團隊表達自己的意願，同時保持開放的心態：實際的過程可能會因具體情況而改變。',
      tipTitle: '小提醒',
      tipText: '做好準備並不意味著掌控一切：更重要的是讓自己有辦法更有信心、更少不確定地迎接那一天。',
      shareMessage: '從容準備迎接分娩 — AWA',
    },
  ar: {
    badge: 'الحمل • الولادة',
    title: 'الاستعداد بهدوء\nللولادة',
    metaDuration: '7 دقائق للقراءة',
    metaType: 'دليل',
    metaLevel: 'مبتدئ',
    metaValidated: 'محتوى تمت مراجعته',
    intro: 'ثلاث ركائز لتستقبلي اليوم الكبير بثقة أكبر.',
    contentsTitle: 'في هذا المقال',
    topics: [
      'الاستعداد في 3 خطوات',
      'حقيبة المستشفى',
      'كتابة خطة الولادة',
      'جدير بالملاحظة',
      'ما يجب تذكّره',
    ],
    prepSteps: [
      'دروس التحضير للولادة',
      'تقنيات التنفس والاسترخاء',
      'حقيبة المستشفى جاهزة بحلول الشهر الثامن',
    ],
    body1:
      'تساعدك دروس التحضير للولادة على فهم مراحل المخاض وتقنيات التنفس التي ستدعمك في اليوم الكبير.',
    body2:
      'تجهيز حقيبة المستشفى بحلول الشهر الثامن يوفّر عليك توتر اللحظة الأخيرة. وعادةً تتضمن:',
    bagItems: [
      'وثائق الهوية ودفتر متابعة الحمل',
      'ملابس مريحة لك وللطفل',
      'أدوات النظافة الشخصية وفوط ما بعد الولادة',
      'ملابس للطفل ليخرج بها إلى البيت',
    ],
    birthPlanPoints: [
      'تفضيلاتك في التعامل مع الألم',
      'من تودّين حضوره أثناء المخاض',
      'توقعاتك بشأن التلامس الجلدي المباشر',
    ],
    neutralText:
      'تساعدك خطة ولادة بسيطة على مشاركة رغباتك مع الفريق الطبي، مع بقائك منفتحة: فقد يتغير سير الأحداث الفعلي بحسب الوضع.',
    tipTitle: 'من الجيد أن تعرفي',
    tipText:
      'الاستعداد لا يعني التحكم في كل شيء: بل هو في الأساس منح نفسك الوسائل لتستقبلي اليوم الكبير بثقة أكبر وغموض أقل.',
    shareMessage: 'الاستعداد بهدوء للولادة — AWA',
  },
  kab: {
    badge: 'LḤEMLA • TLALIT',
    title: 'Ttheggu s lehna\ni tlalit',
    metaDuration: '7 n tesdatin n tɣuri',
    metaType: 'Amawal',
    metaLevel: 'Amagrad',
    metaValidated: 'Agbur yettwasenqed',
    intro: 'Kraḍ n tmedditin i uqeṛṛeb n wass ameqqran s tkeyyest ugar.',
    contentsTitle: 'deg umagrad-a',
    topics: [
      'Aheggi deg 3 n yisurifen',
      'Tqeffalt-ik n uspitar',
      'Aru aɣawas-ik n tlalit',
      'Ayen ilaqen ad d-tbeddeḍ',
      'Ayen ilaqen ad tiktiḍ',
    ],
    prepSteps: [
      'Iselmaden n uheggi i tlalit',
      'Tiyuga n tfsut d usenfas',
      'Tqeffalt n uspitar d tahegga uqbel ayyur wis 8',
    ],
    body1:
      'Iselmaden n uheggi i tlalit ttɛawanen ad tfehmeḍ isurifen n tlalit d tiyuga n tfsut ara k-ɛawnen deg wass ameqqran.',
    body2:
      'Aheggi n tqeffalt n uspitar uqbel ayyur wis 8 yessenqes uḥezzeb n tegara. S umata tesɛa:',
    bagItems: [
      'Isemmaden n tmagit d ktab n lḥemla-k',
      'Ilebsan yelhan i kečč d uqcic amecṭuḥ',
      'Lǧerrayat n tgemmi d tiqeffalin n deffir tlalit',
      'Alebsu i uqcic amecṭuḥ i tuɣalin ɣer wexxam',
    ],
    birthPlanPoints: [
      'Ayen tebɣiḍ i usenqes n ṭṭṛaḥ',
      'Win tebɣiḍ ad yili yidek deg tlalit',
      'Ayen tettṛaǧuḍ ɣef umennuɣ n tzeddigt ɣer tzeddigt',
    ],
    neutralText:
      'Aɣawas afessas n tlalit ɛawen ad tbeṭṭuḍ tinniyin-ik d uɣref n ṭṭbib, u ad teqqimeḍ d tamsalt ldin: tuɣalin n tmenzayt tezmer ad tbeddel ɣef waddad.',
    tipTitle: 'Yelha ad tezwareḍ',
    tipText:
      'Aheggi ur yeɛni ara ad tḥekmeḍ ɣef yal ayen: d ayen ad tefkeḍ iman-ik ineggura i uqeṛṛeb n wass ameqqran s tkeyyest ugar u s wugur n uḥezzeb.',
    shareMessage: 'Ttheggu s lehna i tlalit — AWA',
  },
  om: {
    badge: 'ULFAA • DA\'UMSA',
    title: 'Da\'umsaaf\nhaala tasgabbaa\'een qophaa\'uu',
    metaDuration: 'Daqiiqaa 7 dubbisuuf',
    metaType: 'Qajeelfama',
    metaLevel: 'Jalqabaaf',
    metaValidated: 'Qabiyyee ilaalame',
    intro: 'Utubaawwan sadi guyyaa guddaa amantaa caalaan simachuuf.',
    contentsTitle: 'Barreeffama kana keessatti',
    topics: [
      'Tarkaanfii 3 keessatti qophaa\'uu',
      'Boorsaa hospitaalaa kee',
      'Karoora da\'umsaa barreessuu',
      'Hubachuu qabdu',
      'Waan yaadannoo qabdu',
    ],
    prepSteps: [
      'Barnoota qophii da\'umsaa',
      'Teknikoota hafuura fudhachuu fi boqonnaa',
      'Boorsaan hospitaalaa ji\'a 8ffaatti qophaa\'e',
    ],
    body1:
      'Barnoonni qophii da\'umsaa sadarkaa dhukkubbii da\'umsaa fi teknikoota hafuura fudhachuu guyyaa guddaa sana si deeggaru hubachuuf si gargaara.',
    body2:
      'Boorsaa hospitaalaa ji\'a 8ffaatti qopheessuun yaaddoo yeroo dhumaa si hira. Yeroo baay\'ee kanneen armaan gadii of keessaa qaba:',
    bagItems: [
      'Waraqaa eenyummaa fi kitaaba galmee ulfaa kee',
      'Uffata mijataa ofii fi daa\'imaaf',
      'Meeshaa qulqullina fi paadii deessuu booda',
      'Uffata daa\'imni mana deebi\'uuf uffatu',
    ],
    birthPlanPoints: [
      'Filannoo kee ilaalchisee to\'annoo dhukkubbii',
      'Eenyu yeroo dhukkubbii da\'umsaa bira akka jiraatu barbaaddu',
      'Eegumsa kee ilaalchisee qaama-qaamatti wal tuquu',
    ],
    neutralText:
      'Karoorri da\'umsaa salphaan fedhii kee garee fayyaa waliin qooddachuuf si gargaara, garuu yaada banaa qabaachuu: adeemsi dhugaa haala irratti hundaa\'ee jijjiiramuu danda\'a.',
    tipTitle: 'Beekuun gaarii dha',
    tipText:
      'Qophaa\'uun hunda to\'achuu jechuu miti: kan caalu guyyaa guddaa sana amantaa caalaa fi mirkaneeffachuu xiqqaadhaan simachuuf mala of kennuu dha.',
    shareMessage: 'Da\'umsaaf haala tasgabbaa\'een qophaa\'uu — AWA',
  },
  ti: {
    badge: 'ጥንሲ • ምውላድ',
    title: 'ንምውላድ ብርጋኣት\nምድላው',
    metaDuration: '7 ደቒቕ ንባብ',
    metaType: 'መምርሒ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'ዝተገምገመ ትሕዝቶ',
    intro: 'ንዓቢ መዓልቲ ብዝያዳ ትምክሕቲ ንምቅራብ ሰለስተ ዓምዲ።',
    contentsTitle: 'ኣብዚ ጽሑፍ',
    topics: [
      'ኣብ 3 ስጉምትታት ምድላው',
      'ቦርሳ ሆስፒታልኪ',
      'መደብ ምውላድኪ ምጽሓፍ',
      'ኣቓልቦ ዝግብኦ',
      'ክትዝክሪዮ ዘለኪ',
    ],
    prepSteps: [
      'ክፍሊ ምድላው ንምውላድ',
      'ምስትንፋስን ምዕራፍን ቴክኒካት',
      'ቦርሳ ሆስፒታል ክሳብ ወርሒ 8 ድልውቲ',
    ],
    body1:
      'ክፍሊ ምድላው ንምውላድ ደረጃታት ምጥቃዕን ኣብ ዓቢ መዓልቲ ዝድግፉኪ ቴክኒካት ምስትንፋስን ክትርድኢ ይሕግዘኪ።',
    body2:
      'ቦርሳ ሆስፒታልኪ ክሳብ ወርሒ 8 ምድላው ናይ መወዳእታ ደቒቕ ጭንቀት የድሕነኪ። ብሓፈሽኡ እዚ ይሓዝል፦',
    bagItems: [
      'መንነት ሰነዳትን መዝገብ ጥንስኺን',
      'ንስኺን ንህጻንን ምቹእ ክዳውንቲ',
      'ናይ ንጽህና ኣቕሑትን ድሕሪ ወሊድ ፓድታትን',
      'ህጻን ናብ ቤት ክምለስ ዝኽደን ክዳን',
    ],
    birthPlanPoints: [
      'ኣብ ምምሕዳር ቃንዛ ምርጫታትኪ',
      'ኣብ ግዜ ምጥቃዕ ክህልውኪ ዝደለኽዮም ሰባት',
      'ብዛዕባ ኣካል ምስ ኣካል ርክብ ተስፋታትኪ',
    ],
    neutralText:
      'ቀሊል መደብ ምውላድ ድሌታትኪ ምስ ሕክምናዊ ጉጅለ ንምክፋል ይሕግዝ፣ ግን ክፉት ምሕሳብ ሓዚ፦ ሓቀኛ ኣካይዳ ከም ኩነታት ክልወጥ ይኽእል።',
    tipTitle: 'ርዳእ እዚ',
    tipText:
      'ምድላው ኩሉ ምቁጽጻር ማለት ኣይኰነን፦ ብዋናነት ንዓቢ መዓልቲ ብዝያዳ ትምክሕትን ውሑድ ዘይርግጸኛነትን ንምቅራብ ዓቕሚ ንርእስኺ ምሃብ እዩ።',
    shareMessage: 'ንምውላድ ብርጋኣት ምድላው — AWA',
  },
  rw: {
    badge: 'INDA • KUBYARA',
    title: 'Kwitegura kubyara\nutuje',
    metaDuration: 'Iminota 7 yo gusoma',
    metaType: 'Igitabo',
    metaLevel: 'Ku batangiye',
    metaValidated: 'Ibikubiyemo byasuzumwe',
    intro: 'Inkingi eshatu zo kwegera umunsi ukomeye wizeye kurushaho.',
    contentsTitle: 'Muri iyi nkuru',
    topics: [
      'Kwitegura mu ntambwe 3',
      'Igikapu cyawe cy’ibitaro',
      'Kwandika gahunda yawe yo kubyara',
      'Icyitonderwa',
      'Ibyo kwibuka',
    ],
    prepSteps: [
      'Amasomo yo kwitegura kubyara',
      'Uburyo bwo guhumeka no kuruhuka',
      'Igikapu cy’ibitaro cyiteguye mu kwezi kwa 8',
    ],
    body1:
      'Amasomo yo kwitegura kubyara agufasha gusobanukirwa ibyiciro by’ibise n’uburyo bwo guhumeka buzagufasha ku munsi ukomeye.',
    body2:
      'Gutegura igikapu cy’ibitaro mu kwezi kwa 8 bikurinda guhangayika mu minota ya nyuma. Akenshi kirimo:',
    bagItems: [
      'Ibyangombwa n’igitabo cyawe cy’inda',
      'Imyenda yoroshye yawe n’iy’umwana',
      'Ibikoresho by’isuku n’ibitambaro byo nyuma yo kubyara',
      'Imyenda y’umwana yo gutahana',
    ],
    birthPlanPoints: [
      'Ibyo ukunda ku bijyanye no kugabanya ububabare',
      'Abo wifuza ko baba bahari mu gihe cy’ibise',
      'Ibyo witeze ku gukozanyaho uruhu n’uruhu',
    ],
    neutralText:
      'Gahunda yoroshye yo kubyara igufasha kubwira abaganga ibyo wifuza, ukomeza kuba witeguye: uko bigenda mu by’ukuri bishobora guhinduka bitewe n’uko bimeze.',
    tipTitle: 'Ni byiza kubimenya',
    tipText:
      'Kwitegura ntibivuze kugenzura byose: ahanini ni ukwiha uburyo bwo kwegera umunsi ukomeye wizeye kurushaho kandi udashidikanya cyane.',
    shareMessage: 'Kwitegura kubyara utuje — AWA',
  },
  rn: {
    badge: 'INDA • KUBYARA',
    title: 'Kwitegura kubyara\nutuje',
    metaDuration: 'Iminuta 7 yo gusoma',
    metaType: 'Ubuyobozi',
    metaLevel: 'Intangiriro',
    metaValidated: 'Ibikubiye vyasuzumwe',
    intro: 'Inkingi zitatu zo kwegera umusi ukomeye wizeye kuruta.',
    contentsTitle: 'Muri iyi nkuru',
    topics: [
      'Kwitegura mu ntambwe 3',
      'Isakoshi yawe y’ibitaro',
      'Kwandika gahunda yawe yo kubyara',
      'Ivyo kwitwararika',
      'Ivyo kwibuka',
    ],
    prepSteps: [
      'Amasomo yo kwitegura kubyara',
      'Uburyo bwo guhumeka no kuruhuka',
      'Isakoshi y’ibitaro yiteguye mu kwezi ka 8',
    ],
    body1:
      'Amasomo yo kwitegura kubyara agufasha gusobanukirwa intambwe zo kubyara n’uburyo bwo guhumeka buzagufasha kuri wa musi ukomeye.',
    body2:
      'Gutegura isakoshi y’ibitaro mu kwezi ka 8 bigukiza guhagarika umutima mu minota ya nyuma. Ubusanzwe irimwo:',
    bagItems: [
      'Ibiranga umuntu n’agatabo kawe k’inda',
      'Imyambaro yorohera wewe n’umwana',
      'Ibikoresho vy’isuku n’ibitambaro vyo nyuma yo kubyara',
      'Imyambaro y’umwana yo gutahana',
    ],
    birthPlanPoints: [
      'Ivyo wifuza ku bijanye no gucunga ububabare',
      'Abo wifuza ko bamwe baba bahari igihe cyo kubyara',
      'Ivyo witeze ku bijanye no gukorana uruhu ku ruhu n’umwana',
    ],
    neutralText:
      'Gahunda yoroshe yo kubyara igufasha kumenyesha ivyo wifuza itsinda ry’abaganga, ukaguma kandi witeguye guhinduka: uko ibintu bigenda vyose bishobora guhinduka bitewe n’ibihe.',
    tipTitle: 'Ni vyiza kubimenya',
    tipText:
      'Kwitegura ntibivuga kugenzura vyose: ni ukwiha uburyo bwo kwegera umusi ukomeye wizeye kuruta kandi udafise ugukeka kwinshi.',
    shareMessage: 'Kwitegura kubyara utuje — AWA',
  },
  ig: {
    badge: 'IME • ỊMỤ NWA',
    title: 'Ịkwadebe n’udo\nmaka ịmụ nwa',
    metaDuration: 'Nkeji 7 ka a na-agụ',
    metaType: 'Ntuziaka',
    metaLevel: 'Maka ndị na-amalite',
    metaValidated: 'Ọdịnaya a nyochara',
    intro: 'Ogidi atọ iji nwee obi ike ịbanye n’ụbọchị ukwu ahụ.',
    contentsTitle: 'N’edemede a',
    topics: [
      'Ịkwadebe n’nzọụkwụ 3',
      'Akpa gị maka ụlọ ọgwụ',
      'Ide atụmatụ ọmụmụ gị',
      'Ihe kwesịrị ịrịba ama',
      'Ihe ị ga-echeta',
    ],
    prepSteps: [
      'Klaasị nkwadebe maka ịmụ nwa',
      'Usoro iku ume na izu ike',
      'Akpa ụlọ ọgwụ dị njikere tupu ọnwa nke 8',
    ],
    body1:
      'Klaasị nkwadebe maka ịmụ nwa na-enyere gị aka ịghọta ọkwa nke ihe mgbu ịmụ nwa na usoro iku ume ga-akwado gị n’ụbọchị ukwu ahụ.',
    body2:
      'Ịkwado akpa ụlọ ọgwụ gị tupu ọnwa nke 8 na-echebe gị n’nrụgide nke oge ikpeazụ. Ọ na-agụnyekarị:',
    bagItems: [
      'Akwụkwọ njirimara na akwụkwọ ime gị',
      'Uwe dị mma maka gị na nwa',
      'Ngwaọrụ ịdị ọcha na pad maka mgbe ịmụsịrị nwa',
      'Uwe nwa ga-eyi mgbe ọ na-ala',
    ],
    birthPlanPoints: [
      'Ihe ị chọrọ banyere ijikwa mgbu',
      'Onye ị chọrọ ka ọ nọ gị nso n’oge ihe mgbu ịmụ nwa',
      'Ihe ị tụrụ anya ya banyere ịnọ n’ahụ n’ahụ na nwa',
    ],
    neutralText:
      'Atụmatụ ọmụmụ dị mfe na-enyere gị aka ịkọrọ ndị otu ahụike ihe ị chọrọ, ma na-enyere gị aka ịnọgide na-anabata: ihe ga-eme n’ezie nwere ike ịgbanwe dabere n’ọnọdụ.',
    tipTitle: 'Ọ dị mma ịmara',
    tipText:
      'Ịkwadebe apụtaghị ijikwa ihe niile: ọ bụ karịsịa inye onwe gị ụzọ iji banye n’ụbọchị ukwu ahụ n’obi ike karịa na enweghị obi abụọ.',
    shareMessage: 'Ịkwadebe n’udo maka ịmụ nwa — AWA',
  },
  yo: {
    badge: 'OYÚN • ÌBÍMỌ',
    title: 'Ṣíṣe ìmúrasílẹ̀ pẹ̀lú\nàlàáfíà fún ìbímọ',
    metaDuration: 'Kíkà ní ìṣẹ́jú 7',
    metaType: 'Ìtọ́sọ́nà',
    metaLevel: 'Olùbẹ̀rẹ̀',
    metaValidated: 'Àkóónú tí a ti àtúnyẹ̀wò',
    intro: 'Òpó mẹ́ta láti sún mọ́ ọjọ́ ńlá náà pẹ̀lú ìgbẹ́kẹ̀lé tó pọ̀ sí i.',
    contentsTitle: 'Nínú àpilẹ̀kọ yìí',
    topics: [
      'Ìmúrasílẹ̀ ní ìgbésẹ̀ mẹ́ta',
      'Àpò ilé ìwòsàn rẹ',
      'Kíkọ ètò ìbímọ rẹ',
      'Ohun tó yẹ kí a kíyèsí',
      'Ohun tó yẹ kí o ranti',
    ],
    prepSteps: [
      'Àwọn kíláàsì ìmúrasílẹ̀ fún ìbímọ',
      'Àwọn ọ̀nà mímí àti ìsinmi',
      'Àpò ilé ìwòsàn ti ṣetán ní oṣù kẹjọ',
    ],
    body1:
      'Àwọn kíláàsì ìmúrasílẹ̀ fún ìbímọ ń ràn ọ́ lọ́wọ́ láti lóye àwọn ìpele ìrọbí àti àwọn ọ̀nà mímí tí yóò ràn ọ́ lọ́wọ́ ní ọjọ́ ńlá náà.',
    body2:
      'Pípèsè àpò ilé ìwòsàn rẹ ní oṣù kẹjọ ń gbà ọ́ lọ́wọ́ ìdààmú ìṣẹ́jú ìkẹyìn. Ó sábà máa ń ní:',
    bagItems: [
      'Àwọn ìwé ìdánimọ̀ àti ìwé ìtọ́jú oyún rẹ',
      'Aṣọ tó rọrùn fún ìwọ àti ọmọ',
      'Àwọn ohun ìmọ́tótó àti pádì fún lẹ́yìn ìbímọ',
      'Aṣọ fún ọmọ láti wọ̀ nígbà tí ẹ bá ń lọ sílé',
    ],
    birthPlanPoints: [
      'Ohun tí o fẹ́ nípa ṣíṣàkóso ìrora',
      'Àwọn tí o fẹ́ kí ó wà pẹ̀lú rẹ nígbà ìrọbí',
      'Ohun tí o retí nípa fífi awọ ara kan ara ọmọ',
    ],
    neutralText:
      'Ètò ìbímọ tó rọrùn ń ràn ọ́ lọ́wọ́ láti sọ ohun tí o fẹ́ fún ẹgbẹ́ ìṣègùn, nígbà tí o sì ń múra sílẹ̀ fún ìyípadà: bí nǹkan ṣe lọ gan-an lè yí padà ní ìbámu pẹ̀lú ipò.',
    tipTitle: 'Ohun tó yẹ kí o mọ̀',
    tipText:
      'Ìmúrasílẹ̀ kò túmọ̀ sí ṣíṣàkóso ohun gbogbo: pàápàá jùlọ ó jẹ́ fífún ara rẹ ní ọ̀nà láti sún mọ́ ọjọ́ ńlá náà pẹ̀lú ìgbẹ́kẹ̀lé tó pọ̀ sí i àti àìdánilójú tó kéré.',
    shareMessage: 'Ṣíṣe ìmúrasílẹ̀ pẹ̀lú àlàáfíà fún ìbímọ — AWA',
  },
  zu: {
    badge: 'UKUKHULELWA • UKUBELETHA',
    title: 'Ukulungiselela\nukubeletha ngokuthula',
    metaDuration: 'Imizuzu eyi-7 yokufunda',
    metaType: 'Isikhokelo',
    metaLevel: 'Okwabaqalayo',
    metaValidated: 'Okuqulunqwe kabusha',
    intro: 'Izinsika ezintathu zokusondela osukwini olukhulu ngokuzethemba okwengeziwe.',
    contentsTitle: 'Kulesi sihloko',
    topics: [
      'Ukulungiselela ngezinyathelo ezi-3',
      'Isikhwama sakho sasesibhedlela',
      'Ukubhala uhlelo lwakho lokubeletha',
      'Okufanele kuqashelwe',
      'Okufanele ukhumbule',
    ],
    prepSteps: [
      'Amakilasi okulungiselela ukubeletha',
      'Amasu okuphefumula nokuphumula',
      'Isikhwama sasesibhedlela silungile ngenyanga yesi-8',
    ],
    body1:
      'Amakilasi okulungiselela ukubeletha akusiza uqonde izigaba zokubeletha namasu okuphefumula azokwesekela osukwini olukhulu.',
    body2:
      'Ukulungiselela isikhwama sakho sasesibhedlela ngenyanga yesi-8 kukonga ukucindezeleka kwesikhashana sokugcina. Imvamisa siqukethe:',
    bagItems: [
      'Imibhalo yokuhlonza nencwadi yakho yokulandelela ukukhulelwa',
      'Izingubo ezikhululekile zakho nezengane',
      'Izidingo zokuhlanza nama-pad angemva kokubeletha',
      'Ingubo yengane yokuya ekhaya',
    ],
    birthPlanPoints: [
      'Ezikuthandayo ekulawuleni ubuhlungu',
      'Ofuna abe khona ngesikhathi sokubeletha',
      'Okulindele mayelana nokuthintana kwesikhumba ngesikhumba',
    ],
    neutralText:
      'Uhlelo lokubeletha olulula lusiza ukwabelana ngezifiso zakho neqembu lezokwelapha, kuyilapho uhlala unengqondo evulekile: indlela izinto ezenzeka ngayo ngempela ingashintsha kuye ngesimo.',
    tipTitle: 'Kuhle ukwazi',
    tipText:
      'Ukulungiselela akusho ukulawula yonke into: kuwukuzinika izindlela zokusondela osukwini olukhulu ngokuzethemba okwengeziwe nokungabaza okuncane.',
    shareMessage: 'Ukulungiselela ukubeletha ngokuthula — AWA',
  },
  xh: {
    badge: 'UKUKHULELWA • UKUBELETHA',
    title: 'Ukulungiselela\nukubeletha ngokuzola',
    metaDuration: 'Imizuzu esi-7 yokufunda',
    metaType: 'Isikhokelo',
    metaLevel: 'Abaqalayo',
    metaValidated: 'Umxholo ohlolwe ngabantu',
    intro: 'Izinsika ezintathu zokujongana nosuku olukhulu ngokuzithemba ngakumbi.',
    contentsTitle: 'Kweli nqaku',
    topics: [
      'Ukulungiselela ngamanyathelo ama-3',
      'Ingxowa yakho yasesibhedlela',
      'Ukubhala isicwangciso sakho sokubeletha',
      'Kufaneleka ukuqaphela',
      'Okufanele ukukhumbule',
    ],
    prepSteps: [
      'Iiklasi zokulungiselela ukubeletha',
      'Iindlela zokuphefumla nokuphumla',
      'Ingxowa yasesibhedlela ilungile ngenyanga yesi-8',
    ],
    body1:
      'Iiklasi zokulungiselela ukubeletha zinceda ukuqonda amanqanaba okubeletha nezindlela zokuphefumla ezizakukuxhasa ngosuku olukhulu.',
    body2:
      'Ukupakisha ingxowa yakho yasesibhedlela ngenyanga yesi-8 kukusindisa uxinzelelo lwemizuzu yokugqibela. Idla ngokubandakanya:',
    bagItems: [
      'Amaxwebhu okuchonga nencwadi yakho yokukhulelwa',
      'Impahla enenkululeko kuwe nosana',
      'Izinto zococeko neepad zasemva kokubeletha',
      'Impahla yosana yokuya ekhaya',
    ],
    birthPlanPoints: [
      'Ukhetho lwakho lokulawula iintlungu',
      'Abo ungathanda ukuba babekhona ngexesha lokubeletha',
      'Iinkolelo zakho malunga nokudibana kolusu nolusu',
    ],
    neutralText:
      'Isicwangciso esilula sokubeletha sinceda ukwabelana ngezinto ozifunayo neqela lezonyango, ngoxa uhlala ungavalekanga: ukuhamba kwezinto ngokwenene kunokutshintsha ngokwemeko.',
    tipTitle: 'Kuhle ukwazi',
    tipText:
      'Ukulungiselela akuthethi ukulawula yonke into: kukukunika izixhobo zokujongana nosuku olukhulu ngokuzithemba ngakumbi nokungaqinisekanga kancinci.',
    shareMessage: 'Ukulungiselela ukubeletha ngokuzola — AWA',
  },
  sn: {
    badge: 'PAMUVIRI • KUBEREKA',
    title: 'Kugadzirira nokunyarara\nkubereka',
    metaDuration: 'Maminetsi manomwe ekuverenga',
    metaType: 'Gwara',
    metaLevel: 'Anotangira',
    metaValidated: 'Zvakatariswa',
    intro: 'Nheyo nhatu dzekusvika zuva guru nechivimbo chakawanda.',
    contentsTitle: 'Muchinyorwa chino',
    topics: [
      'Kugadzirira munhanho 3',
      'Bhegi rako rechipatara',
      'Kunyora hurongwa hwako hwekubereka',
      'Zvakakodzera kucherechedza',
      'Zvekuyeuka',
    ],
    prepSteps: [
      'Makirasi ekugadzirira kubereka',
      'Nzira dzekufema nekuzorora',
      'Bhegi rechipatara rakagadzirira pamwedzi wechisere',
    ],
    body1:
      'Makirasi ekugadzirira kubereka anokubatsira kunzwisisa nhanho dzekusununguka nenzira dzekufema dzichakutsigira pazuva guru.',
    body2:
      'Kugadzira bhegi rako rechipatara pamwedzi wechisere kunokuponesa kushushikana kwekupedzisira. Kazhinji rinosanganisira:',
    bagItems: [
      'Magwaro ekuzivikanwa nebhuku rako rekuchengetwa pamuviri',
      'Hembe dzinonyaradza dzako nedzemwana',
      'Zvekuzvisukurudza nemapadhi emushure mekubereka',
      'Hembe yemwana yekudzoka nayo kumba',
    ],
    birthPlanPoints: [
      'Zvaunoda pakubata kurwadza',
      'Vaunoda kuvapo panguva yekusununguka',
      'Zvaunotarisira pamusoro pekubatana kwematehwe nematehwe',
    ],
    neutralText:
      'Hurongwa hwakareruka hwekubereka hunokubatsira kugovana zvaunoda neboka rechiremba, uchiramba wakazaruka: zvichaitika zvinogona kuchinja zvichienderana nemamiriro.',
    tipTitle: 'Zvakanaka kuziva',
    tipText:
      'Kugadzirira hakurevi kudzora zvose: ndezvekuzvipa nzira dzekusvika zuva guru nechivimbo chakawanda nekusaziva kushoma.',
    shareMessage: 'Kugadzirira nokunyarara kubereka — AWA',
  },
  ln: {
    badge: 'ZEMI • KOBOTA',
    title: 'Komibongisa na kimia\nmpo na kobota',
    metaDuration: 'Minitɛ 7 ya kotánga',
    metaType: 'Buku ya bokambi',
    metaLevel: 'Ya ebandeli',
    metaValidated: 'Makambo oyo ekomami malamu',
    intro: 'Misolo misato mpo na kokóta na mokolo monene na elikya mingi.',
    contentsTitle: 'Na lisolo oyo',
    topics: [
      'Komibongisa na matambe 3',
      'Sakɔ na yo ya lopitalo',
      'Kokoma plan na yo ya kobota',
      'Ezali malamu kotala',
      'Oyo osengeli kokanisa',
    ],
    prepSteps: [
      'Mateya ya komibongisa mpo na kobota',
      'Mayele ya mpema mpe ya kopema',
      'Sakɔ ya lopitalo ebongisami na sanza ya 8',
    ],
    body1:
      'Mateya ya komibongisa mpo na kobota esalisaka yo ososola matambe ya kobota mpe mayele ya mpema oyo ekosalisa yo na mokolo monene.',
    body2:
      'Kobongisa sakɔ na yo ya lopitalo na sanza ya 8 ekitisaka mpasi ya ntango ya nsuka. Mbala mingi ezali na kati:',
    bagItems: [
      'Mikanda ya kokesenisa yo mpe buku na yo ya zemi',
      'Bilamba ya pɛtɛɛ mpo na yo mpe mwana',
      'Biloko ya bopɛtɛ mpe ba pad ya nsima ya kobota',
      'Bilamba mpo na mwana ya kozonga na ndako',
    ],
    birthPlanPoints: [
      'Mposa na yo mpo na kobatela mpasi',
      'Nani olingi azala pene na yo na ntango ya kobota',
      'Mposa na yo mpo na kosangana nzoto na nzoto na mwana',
    ],
    neutralText:
      'Plan ya kobota ya pɛtɛɛ esalisaka yo opesa mposa na yo na bato ya monganga, kasi bozala na motema ya kofungwama: makambo ekoki kobongwana kolanda likambo.',
    tipTitle: 'Ezali malamu koyeba',
    tipText:
      'Komibongisa elakisi kokanga nyonso te: mingi mingi ezali kopesa yo nzela ya kokóta na mokolo monene na elikya mingi mpe na ntembe moke.',
    shareMessage: 'Komibongisa na kimia mpo na kobota — AWA',
  },
  ff: {
    badge: 'REEDU • JIBINAADE',
    title: 'Taaskugo e hoyrude\nngam jibinaade',
    metaDuration: 'Ɗaɓɓitaago minti 7',
    metaType: 'Paltirgel',
    metaLevel: 'Fuɗɗoode',
    metaValidated: 'Ko nastii ndikkaama',
    intro: 'Ɗaɗi tato ngam yaadugo e nyalaade mawnde e hoore ɓurnde.',
    contentsTitle: 'Nder winndannde ndee',
    topics: [
      'Taaskugo nder laawol 3',
      'Saaku maaɗa ngam asiteer',
      'Winndugo birth plan maaɗa',
      'Ko haani maandaade',
      'Ko haani hoyrude',
    ],
    prepSteps: [
      'Ekkitaago taaskugo jibinaade',
      'Laawol foofugo e hoyrugo',
      'Saaku asiteer timmi haa lewru 8',
    ],
    body1:
      'Ekkitaago taaskugo jibinaade walla maaɗa faamugo laawol jibinaade e laawol foofugo ɗin ngaree walla maaɗa nyalaade mawnde.',
    body2:
      'Taaskugo saaku asiteer haa lewru 8 ɓesdi tampere saa\'i timmi. Ɗum saa\'i feere woodi:',
    bagItems: [
      'Takkaadu anndinoore e takkaadu reedu maaɗa',
      'Taguuji moƴƴi ngam maaɗa e ɓiɗɗo',
      'Kuuje laaɓugo e coofi caggal jibinaade',
      'Ngaayka ɓiɗɗo ngam yaadugo galle',
    ],
    birthPlanPoints: [
      'Ko yiɗuɗon ngam ɓesdugo muusal',
      'Ko yiɗuɗon wonugo e maaɗa saa\'i jibinaade',
      'Ko yiɗuɗon fii hawtugo ɓanndu e ɓanndu',
    ],
    neutralText:
      'Birth plan pamaru walla maaɗa anndinugo jaɓɓitaaɓe yiɗde maaɗa, kono ɗum haani ɗon wonoo ɓaleeri: ko waɗetee waaway wayrugo e ngonka.',
    tipTitle: 'Ko haani anndugo',
    tipText:
      'Taaskugo wonaa dañugo fuu: ɗum ko hokkugo hoore maaɗa semmbe ngam yaadugo nyalaade mawnde e hoore ɓurnde e hesitude ɓesdunde.',
    shareMessage: 'Taaskugo e hoyrude ngam jibinaade — AWA',
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
  ms: {
    badge: 'KEHAMILAN • BERSALIN',
    title: 'Bersedia dengan tenang\nuntuk bersalin',
    metaDuration: '7 min bacaan',
    metaType: 'Panduan',
    metaLevel: 'Permulaan',
    metaValidated: 'Kandungan disemak',
    intro: 'Tiga tonggak untuk menghadapi hari yang besar dengan lebih yakin.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Bersedia dalam 3 langkah',
      'Beg hospital anda',
      'Menulis pelan kelahiran anda',
      'Perkara yang patut diambil perhatian',
      'Apa yang perlu diingat',
    ],
    prepSteps: [
      'Kelas persediaan bersalin',
      'Teknik pernafasan dan relaksasi',
      'Beg hospital siap menjelang bulan ke-8',
    ],
    body1:
      'Kelas persediaan bersalin membantu anda memahami peringkat bersalin dan teknik pernafasan yang akan menyokong anda pada hari yang besar.',
    body2:
      'Menyediakan beg hospital menjelang bulan ke-8 menjimatkan anda daripada tekanan saat-saat akhir. Biasanya ia mengandungi:',
    bagItems: [
      'Dokumen pengenalan dan buku rekod kehamilan anda',
      'Pakaian yang selesa untuk anda dan bayi',
      'Barangan mandian dan tuala wanita selepas bersalin',
      'Pakaian untuk bayi dipakai semasa pulang ke rumah',
    ],
    birthPlanPoints: [
      'Pilihan anda untuk menguruskan kesakitan',
      'Siapa yang anda mahu hadir semasa bersalin',
      'Jangkaan anda tentang sentuhan kulit ke kulit',
    ],
    neutralText:
      'Pelan kelahiran yang ringkas membantu anda menyampaikan hasrat anda kepada pasukan perubatan, sambil kekal berfikiran terbuka: perjalanan sebenar boleh berubah bergantung pada keadaan.',
    tipTitle: 'Elok diketahui',
    tipText:
      'Bersedia tidak bermakna mengawal segala-galanya: ia terutamanya tentang memberi diri anda cara untuk menghadapi hari yang besar dengan lebih yakin dan kurang ketidakpastian.',
    shareMessage: 'Bersedia dengan tenang untuk bersalin — AWA',
  },
  so: {
    badge: 'UUR • DHALMO',
    title: 'U diyaargarowga dhalmada\nsi degan',
    metaDuration: '7 daq akhris',
    metaType: 'Hage',
    metaLevel: 'Bilow',
    metaValidated: 'Macluumaad la dib-u-eegay',
    intro: 'Saddex tiir oo lagu dhowaado maalinta weyn kalsooni badan.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Diyaargarow 3 tallaabo ah',
      'Bacaadkaaga isbitaalka',
      'Qorista qorshahaaga dhalmada',
      'Mudan in la xuso',
      'Waxa la xasuusto',
    ],
    prepSteps: [
      'Fasallada u diyaargarowga dhalmada',
      'Farsamooyinka neefsashada iyo nasashada',
      'Bacaadka isbitaalka oo diyaar ah bisha 8aad',
    ],
    body1:
      'Fasallada u diyaargarowga dhalmadu waxay kaa caawiyaan inaad fahanto heerarka foosha iyo farsamooyinka neefsashada ee kuu taageeri doona maalinta weyn.',
    body2:
      'Diyaarinta bacaadkaaga isbitaalka bisha 8aad waxay ku badbaadisaa walaac wakhtiga ugu dambeeya. Inta badan wuxuu ka kooban yahay:',
    bagItems: [
      'Dukumiintiyada aqoonsiga iyo buugga diiwaanka uurkaaga',
      'Dharka raaxada leh adiga iyo ilmaha',
      'Alaabta nadaafadda iyo tuwaalaha dhalmada ka dib',
      'Dhar ilmaha lagu geeyo guriga',
    ],
    birthPlanPoints: [
      'Doorbidyadaada maamulka xanuunka',
      'Cidda aad rabto inay joogto inta foosha jirto',
      'Filashooyinkaaga ku saabsan taabasho maqaar-ilaa-maqaar',
    ],
    neutralText:
      'Qorshe dhalmo oo fudud wuxuu kaa caawiyaa inaad la wadaagto rabitaankaaga kooxda caafimaadka, adigoo isla markaa maskax furan haysta: socodka dhabta ahi wuu isbeddeli karaa iyadoo ku xiran xaaladda.',
    tipTitle: 'Waxtar leh in la ogaado',
    tipText:
      'Diyaargarowgu macnaheedu maaha inaad wax walba xakameyso: wuxuu inta badan ku saabsan yahay inaad naftaada siiso hab aad ku dhowaato maalinta weyn kalsooni badan iyo shaki yar.',
    shareMessage: 'U diyaargarowga dhalmada si degan — AWA',
  },
  sw: {
    badge: 'UJAUZITO • KUJIFUNGUA',
    title: 'Kujiandaa kwa utulivu\nkwa kujifungua',
    metaDuration: 'Dakika 7 za kusoma',
    metaType: 'Mwongozo',
    metaLevel: 'Mwanzo',
    metaValidated: 'Maudhui yaliyokaguliwa',
    intro: 'Nguzo tatu za kukaribia siku kuu kwa kujiamini zaidi.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Kujiandaa kwa hatua 3',
      'Begi lako la hospitali',
      'Kuandika mpango wako wa kujifungua',
      'Yanayostahili kuzingatiwa',
      'Cha kukumbuka',
    ],
    prepSteps: [
      'Madarasa ya maandalizi ya kujifungua',
      'Mbinu za kupumua na kutuliza mwili',
      'Begi la hospitali liwe tayari kufikia mwezi wa 8',
    ],
    body1:
      'Madarasa ya maandalizi ya kujifungua yanakusaidia kuelewa hatua za uchungu wa kujifungua na mbinu za kupumua zitakazokusaidia siku kuu.',
    body2:
      'Kupakia begi lako la hospitali kufikia mwezi wa 8 kunakuepusha na msongo wa dakika za mwisho. Kwa kawaida lina:',
    bagItems: [
      'Hati za utambulisho na kitabu chako cha rekodi za ujauzito',
      'Nguo za starehe kwa ajili yako na mtoto',
      'Vifaa vya usafi binafsi na pedi za baada ya kujifungua',
      'Vazi la mtoto la kurudi nalo nyumbani',
    ],
    birthPlanPoints: [
      'Mapendeleo yako ya kudhibiti maumivu',
      'Nani ungependa awepo wakati wa uchungu',
      'Matarajio yako kuhusu kugusana ngozi kwa ngozi',
    ],
    neutralText:
      'Mpango rahisi wa kujifungua unakusaidia kushiriki matakwa yako na timu ya madaktari, huku ukibaki na mawazo wazi: mwenendo halisi wa mambo unaweza kubadilika kulingana na hali.',
    tipTitle: 'Vyema kujua',
    tipText:
      'Kujiandaa hakumaanishi kudhibiti kila kitu: ni hasa kujipa njia za kukaribia siku kuu kwa kujiamini zaidi na kutokuwa na uhakika kidogo.',
    shareMessage: 'Kujiandaa kwa utulivu kwa kujifungua — AWA',
  },
  kk: {
    badge: 'ЖҮКТІЛІК • БОСАНУ',
    title: 'Босануға\nтыныштықпен дайындалу',
    metaDuration: '7 мин оқу',
    metaType: 'Нұсқаулық',
    metaLevel: 'Бастауыш',
    metaValidated: 'Тексерілген мазмұн',
    intro: 'Үлкен күнге сенімдірек жақындауға арналған үш тірек.',
    contentsTitle: 'Осы мақалада',
    topics: [
      '3 қадаммен дайындалу',
      'Аурухана сөмкеңіз',
      'Босану жоспарыңызды жазу',
      'Назар аударатын мәселелер',
      'Нені есте сақтау керек',
    ],
    prepSteps: [
      'Босануға дайындық сабақтары',
      'Тыныс алу және босаңсу техникалары',
      'Аурухана сөмкесі 8-ші айға дейін дайын',
    ],
    body1:
      'Босануға дайындық сабақтары толғақтың кезеңдерін және үлкен күні сізді қолдайтын тыныс алу техникаларын түсінуге көмектеседі.',
    body2:
      'Аурухана сөмкесін 8-ші айға дейін жинау соңғы минуттағы күйзелістен құтқарады. Оған әдетте мыналар кіреді:',
    bagItems: [
      'Жеке куәлік құжаттары және жүктілік жазбалар кітапшасы',
      'Өзіңізге және нәрестеге арналған ыңғайлы киім',
      'Жеке гигиена құралдары және босанғаннан кейінгі прокладкалар',
      'Нәрестенің үйге қайтуына арналған киімі',
    ],
    birthPlanPoints: [
      'Ауруды басқару бойынша қалауларыңыз',
      'Толғақ кезінде жаныңызда кімнің болғанын қалайтыныңыз',
      'Теріден теріге жанасуға қатысты күтулеріңіз',
    ],
    neutralText:
      'Қарапайым босану жоспары қалауларыңызбен медициналық топты таныстыруға көмектеседі, сонымен бірге ашық болып қалыңыз: оқиғалардың нақты барысы жағдайға қарай өзгеруі мүмкін.',
    tipTitle: 'Білуге тиісті',
    tipText:
      'Дайындалу бәрін бақылауды білдірмейді: бұл негізінен үлкен күнге сенімдірек және белгісіздігі азырақ жақындауға мүмкіндік беру.',
    shareMessage: 'Босануға тыныштықпен дайындалу — AWA',
  },
  wo: {
    badge: 'ËMB • JUR',
    title: 'Waajal jur\nak jàmm',
    metaDuration: '7 simili jàng',
    metaType: 'Ndigal',
    metaLevel: 'Tàmbali',
    metaValidated: 'Mbind bu ñu seetlu',
    intro: 'Ñetti jumtukaay ngir dikk bés bi mag ak kóolute bu gën a bari.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Waajal ci 3 ñaar fuñ',
      'Sa saakoo bu opitaal',
      'Bind sa pexe jur',
      'Li am solo',
      'Li war a fàttaliku',
    ],
    prepSteps: [
      'Njàngum waajal jur',
      'Anam yu noppiku ak noppalu',
      'Saakoo bu opitaal waajal ci weer wu juróom-ñett',
    ],
    body1:
      'Njàngum waajal jur dañuy dimbli nga xam ñaar fuñ yu jur ak anam yu noppiku yi di la dimbli bés bi mag.',
    body2:
      'Waajal sa saakoo bu opitaal ci weer wu juróom-ñett dafay la tee tiitaange bu mujj-mujj. Dafay boole saa su ne:',
    bagItems: [
      'Kayit yu ID ak sa kayitu ëmb',
      'Yérey neex ngir yaw ak doom bi',
      'Jumtukaay yu set ak pad yu ginnaaw jur',
      'Benn yéré ngir doom bi ngir dellu kër',
    ],
    birthPlanPoints: [
      'Sa bëgg-bëgg ci yor metit',
      'Ki nga bëgg a nekk fa ci jur',
      'Li nga xaar ci laal yaram ak yaram',
    ],
    neutralText:
      'Benn pexe jur bu yomb dafay dimbli nga wax sa bëgg-bëgg ak ekipu doktoor yi, te des ci xel mu ubbiku: jëf bi mën na soppiku ci mbir bi.',
    tipTitle: 'Lu baax a xam',
    tipText:
      'Waajal du tekki yor lépp: dafay joxe la jumtukaay yi ngir dikk bés bi mag ak kóolute bu gën a bari te xel-ñaar bu gën a ndaw.',
    shareMessage: 'Waajal jur ak jàmm — AWA',
  },
  ha: {
    badge: 'CIKI • HAIHUWA',
    title: 'Shirya wa haihuwa\ncikin natsuwa',
    metaDuration: 'karatun minti 7',
    metaType: 'Jagora',
    metaLevel: 'Mafari',
    metaValidated: 'Abun da aka duba',
    intro: 'Ginshiƙai uku don kusantar babbar ranar da ƙarin kwarin gwiwa.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Shirye-shirye a matakai 3',
      'Jakarki ta asibiti',
      'Rubuta shirin haihuwarki',
      'Abin da ya cancanci a lura',
      'Abin da za a tuna',
    ],
    prepSteps: [
      'Darussan shirya wa haihuwa',
      'Dabarun numfashi da hutu',
      'Jakar asibiti a shirye kafin wata na 8',
    ],
    body1:
      'Darussan shirya wa haihuwa suna taimaka miki ki fahimci matakan nakuda da dabarun numfashi da za su tallafa miki a babbar ranar.',
    body2:
      'Shirya jakarki ta asibiti kafin wata na 8 yana ceton ki daga damuwar minti na ƙarshe. Yawanci ta ƙunshi:',
    bagItems: [
      'Takardun shaida da littafin lafiyar cikinki',
      'Tufafi masu daɗi gare ki da jariri',
      'Kayayyakin tsabta da audugar bayan haihuwa',
      'Tufafin jariri don komawa gida',
    ],
    birthPlanPoints: [
      'Abin da kike so game da magance ciwo',
      'Wanda kike so ya kasance yayin nakuda',
      'Abin da kike tsammani game da taɓa fata da fata',
    ],
    neutralText:
      'Shirin haihuwa mai sauƙi yana taimaka miki ki sanar da ƙungiyar likitoci abin da kike so, tare da kasancewa mai buɗaɗɗen zuciya: yadda abubuwa ke gudana na iya sauyawa bisa yanayi.',
    tipTitle: 'Abin da ya kamata ki sani',
    tipText:
      'Shiri ba ya nufin sarrafa komai: galibi game da ba kanki hanyoyin kusantar babbar ranar da ƙarin kwarin gwiwa da ƙarancin rashin tabbas ne.',
    shareMessage: 'Shirya wa haihuwa cikin natsuwa — AWA',
  },
  am: {
    badge: 'እርግዝና • ወሊድ',
    title: 'ለወሊድ በሰላም\nመዘጋጀት',
    metaDuration: '7 ደቂቃ ንባብ',
    metaType: 'መመሪያ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'የተረጋገጠ ይዘት',
    intro: 'ታላቁን ቀን በበለጠ በራስ መተማመን ለመቅረብ ሶስት ምሰሶዎች።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'በ3 ደረጃዎች መዘጋጀት',
      'የሆስፒታል ቦርሳሽ',
      'የወሊድ እቅድሽን መጻፍ',
      'ልብ ሊባል የሚገባው',
      'ማስታወስ ያለብሽ',
    ],
    prepSteps: [
      'የወሊድ ዝግጅት ክፍሎች',
      'የአተነፋፈስና የመዝናናት ዘዴዎች',
      'ከ8ኛው ወር በፊት የሆስፒታል ቦርሳ ዝግጁ',
    ],
    body1:
      'የወሊድ ዝግጅት ክፍሎች የምጥ ደረጃዎችን እና በታላቁ ቀን የሚደግፉሽን የአተነፋፈስ ዘዴዎች እንድትረጂ ይረዱሻል።',
    body2:
      'የሆስፒታል ቦርሳሽን ከ8ኛው ወር በፊት ማዘጋጀት የመጨረሻ ደቂቃ ውጥረትን ያስቀርልሻል። ብዙውን ጊዜ የሚከተሉትን ይይዛል፦',
    bagItems: [
      'መታወቂያ ሰነዶች እና የእርግዝና መዝገብ ደብተርሽ',
      'ለአንቺና ለሕፃኑ ምቹ ልብሶች',
      'የንጽሕና ዕቃዎች እና ከወሊድ በኋላ የሚጠቀሙ ሞዴሶች',
      'ሕፃኑ ወደ ቤት የሚሄድበት ልብስ',
    ],
    birthPlanPoints: [
      'ህመምን ስለመቆጣጠር ምርጫዎችሽ',
      'በምጥ ጊዜ እንዲገኝ የምትፈልጊው ሰው',
      'ስለ ቆዳ ለቆዳ መገናኘት የሚጠብቂው',
    ],
    neutralText:
      'ቀላል የወሊድ እቅድ ፍላጎቶችሽን ለሕክምና ቡድኑ ለማካፈል ይረዳል፣ እንዲሁም ክፍት አእምሮ እንድትይዢ፦ ትክክለኛው ሂደት እንደ ሁኔታው ሊለወጥ ይችላል።',
    tipTitle: 'ማወቅ ጠቃሚ ነው',
    tipText:
      'መዘጋጀት ሁሉንም መቆጣጠር ማለት አይደለም፦ በዋናነት ታላቁን ቀን በበለጠ በራስ መተማመንና በትንሽ ጥርጣሬ ለመቅረብ መንገዶችን ለራስሽ መስጠት ነው።',
    shareMessage: 'ለወሊድ በሰላም መዘጋጀት — AWA',
  },
  nl: {
    badge: 'ZWANGERSCHAP • BEVALLING',
    title: 'Rustig voorbereiden\nop de bevalling',
    metaDuration: '7 min lezen',
    metaType: 'Gids',
    metaLevel: 'Beginner',
    metaValidated: 'Gecontroleerde inhoud',
    intro: 'Drie pijlers om de grote dag met meer vertrouwen tegemoet te gaan.',
    contentsTitle: 'In dit artikel',
    topics: [
      'Voorbereiden in 3 stappen',
      'Je ziekenhuistas',
      'Je geboorteplan opstellen',
      'Goed om te weten',
      'Wat je moet onthouden',
    ],
    prepSteps: [
      'Zwangerschapscursus ter voorbereiding op de bevalling',
      'Ademhalings- en ontspanningstechnieken',
      'Ziekenhuistas klaar in maand 8',
    ],
    body1:
      'Een zwangerschapscursus helpt je de fasen van de bevalling te begrijpen en de ademhalingstechnieken die je op de grote dag zullen ondersteunen.',
    body2:
      'Je ziekenhuistas in maand 8 inpakken bespaart je stress op het laatste moment. Meestal bevat ze:',
    bagItems: [
      'Identiteitsbewijzen en je zwangerschapsdossier',
      'Comfortabele kleding voor jou en de baby',
      'Toiletartikelen en kraamverband',
      'Een outfit voor de baby om naar huis te gaan',
    ],
    birthPlanPoints: [
      'Je voorkeuren voor pijnbestrijding',
      'Wie je tijdens de bevalling erbij wilt hebben',
      'Je verwachtingen rond huid-op-huidcontact',
    ],
    neutralText:
      'Een eenvoudig geboorteplan helpt je je wensen met het medische team te delen, terwijl je open blijft staan: het werkelijke verloop kan veranderen afhankelijk van de situatie.',
    tipTitle: 'Goed om te weten',
    tipText:
      'Voorbereiden betekent niet alles controleren: het gaat er vooral om jezelf de middelen te geven om de grote dag met meer vertrouwen en minder onzekerheid tegemoet te gaan.',
    shareMessage: 'Rustig voorbereiden op de bevalling — AWA',
  },
  fi: {
    badge: 'RASKAUS • SYNNYTYS',
    title: 'Rauhallinen valmistautuminen\nsynnytykseen',
    metaDuration: '7 min lukuaika',
    metaType: 'Opas',
    metaLevel: 'Aloittelija',
    metaValidated: 'Tarkistettu sisältö',
    intro: 'Kolme peruspilaria, joiden avulla lähestyt suurta päivää luottavaisemmin.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Valmistautuminen kolmessa vaiheessa',
      'Sairaalalaukkusi',
      'Synnytyssuunnitelman kirjoittaminen',
      'Huomionarvoista',
      'Mitä muistaa',
    ],
    prepSteps: [
      'Synnytysvalmennus',
      'Hengitys- ja rentoutustekniikat',
      'Sairaalalaukku valmiina kahdeksanteen kuukauteen mennessä',
    ],
    body1:
      'Synnytysvalmennus auttaa ymmärtämään synnytyksen vaiheet ja hengitystekniikat, jotka tukevat sinua suurena päivänä.',
    body2:
      'Sairaalalaukun pakkaaminen kahdeksanteen kuukauteen mennessä säästää viime hetken stressiltä. Se sisältää yleensä:',
    bagItems: [
      'Henkilöllisyysasiakirjat ja äitiyskortti',
      'Mukavat vaatteet sinulle ja vauvalle',
      'Hygieniatarvikkeet ja synnytyksen jälkeiset siteet',
      'Vauvalle asu kotiinlähtöä varten',
    ],
    birthPlanPoints: [
      'Toiveesi kivunhoidosta',
      'Ketkä haluat paikalle synnytyksen aikana',
      'Odotuksesi ihokontaktista',
    ],
    neutralText:
      'Yksinkertainen synnytyssuunnitelma auttaa kertomaan toiveesi hoitohenkilökunnalle pysyen silti avoimena: todellinen kulku voi muuttua tilanteen mukaan.',
    tipTitle: 'Hyvä tietää',
    tipText:
      'Valmistautuminen ei tarkoita kaiken hallintaa: kyse on ennen kaikkea siitä, että annat itsellesi keinot lähestyä suurta päivää luottavaisemmin ja vähemmän epävarmuutta tuntien.',
    shareMessage: 'Rauhallinen valmistautuminen synnytykseen — AWA',
  },
  el: {
    badge: 'ΕΓΚΥΜΟΣΥΝΗ • ΤΟΚΕΤΟΣ',
    title: 'Προετοιμασία για τον τοκετό\nμε ηρεμία',
    metaDuration: '7 λεπτά ανάγνωσης',
    metaType: 'Οδηγός',
    metaLevel: 'Αρχάριο',
    metaValidated: 'Ελεγμένο περιεχόμενο',
    intro: 'Τρεις πυλώνες για να προσεγγίσεις τη μεγάλη ημέρα με περισσότερη αυτοπεποίθηση.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Προετοιμασία σε 3 βήματα',
      'Η βαλίτσα του μαιευτηρίου',
      'Συντάσσοντας το σχέδιο τοκετού',
      'Αξίζει να σημειωθεί',
      'Τι να θυμάσαι',
    ],
    prepSteps: [
      'Μαθήματα προετοιμασίας για τον τοκετό',
      'Τεχνικές αναπνοής και χαλάρωσης',
      'Η βαλίτσα του μαιευτηρίου έτοιμη μέχρι τον 8ο μήνα',
    ],
    body1:
      'Τα μαθήματα προετοιμασίας για τον τοκετό σε βοηθούν να κατανοήσεις τα στάδια του τοκετού και τις τεχνικές αναπνοής που θα σε στηρίξουν τη μεγάλη ημέρα.',
    body2:
      'Το να ετοιμάσεις τη βαλίτσα του μαιευτηρίου μέχρι τον 8ο μήνα σου γλιτώνει το άγχος της τελευταίας στιγμής. Συνήθως περιλαμβάνει:',
    bagItems: [
      'Έγγραφα ταυτότητας και το βιβλιάριο της εγκυμοσύνης σου',
      'Άνετα ρούχα για σένα και για το μωρό',
      'Είδη υγιεινής και σερβιέτες λοχείας',
      'Ένα ντύσιμο για να φύγει το μωρό από το μαιευτήριο',
    ],
    birthPlanPoints: [
      'Οι προτιμήσεις σου για τη διαχείριση του πόνου',
      'Ποιον θα ήθελες να έχεις δίπλα σου στον τοκετό',
      'Οι προσδοκίες σου για την επαφή δέρμα με δέρμα',
    ],
    neutralText:
      'Ένα απλό σχέδιο τοκετού σε βοηθά να μοιραστείς τις επιθυμίες σου με την ιατρική ομάδα, παραμένοντας ανοιχτή: η πραγματική εξέλιξη μπορεί να αλλάξει ανάλογα με την κατάσταση.',
    tipTitle: 'Καλό είναι να γνωρίζεις',
    tipText:
      'Η προετοιμασία δεν σημαίνει ότι ελέγχεις τα πάντα: σημαίνει κυρίως ότι δίνεις στον εαυτό σου τα μέσα να προσεγγίσει τη μεγάλη ημέρα με περισσότερη αυτοπεποίθηση και λιγότερη αβεβαιότητα.',
    shareMessage: 'Προετοιμασία για τον τοκετό με ηρεμία — AWA',
  },
  fil: {
    badge: 'PAGBUBUNTIS • PANGANGANAK',
    title: 'Mahinahong paghahanda\nsa panganganak',
    metaDuration: '7 min na babasahin',
    metaType: 'Gabay',
    metaLevel: 'Baguhan',
    metaValidated: 'Sinuring nilalaman',
    intro: 'Tatlong haligi para harapin ang malaking araw nang may mas malaking kumpiyansa.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Paghahanda sa 3 hakbang',
      'Ang iyong bag sa ospital',
      'Pagsulat ng iyong birth plan',
      'Karapat-dapat tandaan',
      'Ang dapat tandaan',
    ],
    prepSteps: [
      'Mga klase sa paghahanda sa panganganak',
      'Mga pamamaraan sa paghinga at pagrerelaks',
      'Handa na ang bag sa ospital pagsapit ng ika-8 buwan',
    ],
    body1:
      'Tinutulungan ka ng mga klase sa paghahanda sa panganganak na maunawaan ang mga yugto ng labor at ang mga pamamaraan sa paghinga na susuporta sa iyo sa malaking araw.',
    body2:
      'Ang paghahanda ng bag sa ospital pagsapit ng ika-8 buwan ay nagliligtas sa iyo sa stress sa huling minuto. Karaniwan itong naglalaman ng:',
    bagItems: [
      'Mga dokumento ng pagkakakilanlan at ang iyong librong pangsubaybay sa pagbubuntis',
      'Komportableng damit para sa iyo at sa sanggol',
      'Mga gamit sa kalinisan at pad pagkatapos manganak',
      'Isang damit na susuotin ng sanggol pag-uwi',
    ],
    birthPlanPoints: [
      'Ang iyong mga kagustuhan sa pangangasiwa ng sakit',
      'Sino ang gusto mong kasama habang nasa labor',
      'Ang iyong mga inaasahan tungkol sa skin-to-skin contact',
    ],
    neutralText:
      'Nakakatulong ang simpleng birth plan na maibahagi mo ang iyong mga nais sa medikal na koponan, habang nananatiling bukas: maaaring magbago ang aktwal na takbo ayon sa sitwasyon.',
    tipTitle: 'Mabuting malaman',
    tipText:
      'Hindi nangangahulugan ang paghahanda na kontrolado mo ang lahat: higit sa lahat, binibigyan mo ang sarili mo ng paraan para harapin ang malaking araw nang may mas malaking kumpiyansa at mas kaunting kawalang-katiyakan.',
    shareMessage: 'Mahinahong paghahanda sa panganganak — AWA',
  },
  ta: {
    badge: 'கர்ப்பம் • பிரசவம்',
    title: 'பிரசவத்துக்கு அமைதியாகத்\nதயாராதல்',
    metaDuration: '7 நிமிடம் படிக்க',
    metaType: 'வழிகாட்டி',
    metaLevel: 'தொடக்க நிலை',
    metaValidated: 'சரிபார்க்கப்பட்ட உள்ளடக்கம்',
    intro: 'அந்தப் பெரிய நாளை அதிக நம்பிக்கையுடன் அணுக மூன்று தூண்கள்.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      '3 படிகளில் தயாராதல்',
      'உங்கள் மருத்துவமனைப் பை',
      'உங்கள் பிரசவத் திட்டத்தை எழுதுதல்',
      'கவனிக்க வேண்டியவை',
      'நினைவில் கொள்ள வேண்டியவை',
    ],
    prepSteps: [
      'பிரசவத் தயாரிப்பு வகுப்புகள்',
      'மூச்சு மற்றும் தளர்வு நுட்பங்கள்',
      '8-ஆம் மாதத்துக்குள் தயாரான மருத்துவமனைப் பை',
    ],
    body1:
      'பிரசவத் தயாரிப்பு வகுப்புகள் பிரசவ வலியின் கட்டங்களையும், அந்தப் பெரிய நாளில் உங்களுக்குத் துணையாக இருக்கும் மூச்சு நுட்பங்களையும் புரிந்துகொள்ள உதவுகின்றன.',
    body2:
      '8-ஆம் மாதத்துக்குள் உங்கள் மருத்துவமனைப் பையைத் தயார் செய்வது கடைசி நிமிட அழுத்தத்தைத் தவிர்க்கிறது. அதில் பொதுவாக இவை அடங்கும்:',
    bagItems: [
      'அடையாள ஆவணங்களும் உங்கள் கர்ப்பப் பதிவுப் புத்தகமும்',
      'உங்களுக்கும் குழந்தைக்கும் வசதியான ஆடைகள்',
      'கழிப்பறைப் பொருட்களும் பிரசவத்துக்குப் பிந்தைய நாப்கின்களும்',
      'வீட்டுக்குச் செல்லும்போது குழந்தைக்கான ஓர் ஆடை',
    ],
    birthPlanPoints: [
      'வலியை நிர்வகிப்பதில் உங்கள் விருப்பங்கள்',
      'பிரசவ வலியின்போது யாரை உடன் இருக்க விரும்புகிறீர்கள்',
      'தோலோடு தோல் தொடர்பு குறித்த உங்கள் எதிர்பார்ப்புகள்',
    ],
    neutralText:
      'ஓர் எளிய பிரசவத் திட்டம் உங்கள் விருப்பங்களை மருத்துவக் குழுவுடன் பகிர உதவுகிறது, அதே நேரம் திறந்த மனதுடன் இருக்கவும் உதவுகிறது: சூழ்நிலைக்கு ஏற்ப உண்மையான நிகழ்வுகள் மாறலாம்.',
    tipTitle: 'தெரிந்துகொள்ளுங்கள்',
    tipText:
      'தயாராதல் என்பது அனைத்தையும் கட்டுப்படுத்துவது அல்ல: அந்தப் பெரிய நாளை அதிக நம்பிக்கையுடனும் குறைவான நிச்சயமின்மையுடனும் அணுக உங்களுக்கு வழிவகைகளைத் தருவதே முக்கியமாகும்.',
    shareMessage: 'பிரசவத்துக்கு அமைதியாகத் தயாராதல் — AWA',
  },
  te: {
    badge: 'గర్భం • ప్రసవం',
    title: 'ప్రశాంతంగా ప్రసవానికి\nసిద్ధమవ్వడం',
    metaDuration: '7 నిమిషాల పఠనం',
    metaType: 'గైడ్',
    metaLevel: 'ప్రారంభ స్థాయి',
    metaValidated: 'మదింపు చేసిన కంటెంట్',
    intro: 'ఆ గొప్ప రోజును మరింత ఆత్మవిశ్వాసంతో ఎదుర్కోవడానికి మూడు ఆధారాలు.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      '3 దశల్లో సిద్ధమవ్వడం',
      'మీ ఆసుపత్రి బ్యాగ్',
      'మీ ప్రసవ ప్రణాళికను రాయడం',
      'గమనించదగినవి',
      'గుర్తుంచుకోవాల్సినవి',
    ],
    prepSteps: [
      'ప్రసవ సన్నద్ధత తరగతులు',
      'శ్వాస, తేలికపరిచే పద్ధతులు',
      '8వ నెలకల్లా సిద్ధమైన ఆసుపత్రి బ్యాగ్',
    ],
    body1:
      'ప్రసవ సన్నద్ధత తరగతులు ప్రసవ వేదన దశలను, ఆ గొప్ప రోజున మీకు తోడ్పడే శ్వాస పద్ధతులను అర్థం చేసుకోవడానికి సహాయపడతాయి.',
    body2:
      '8వ నెలకల్లా మీ ఆసుపత్రి బ్యాగ్‌ను సర్దుకోవడం చివరి నిమిషం ఒత్తిడిని తప్పిస్తుంది. అందులో సాధారణంగా ఇవి ఉంటాయి:',
    bagItems: [
      'గుర్తింపు పత్రాలు, మీ గర్భధారణ రికార్డ్ పుస్తకం',
      'మీకు, శిశువుకు సౌకర్యవంతమైన దుస్తులు',
      'టాయిలెట్ సామగ్రి, ప్రసవానంతర ప్యాడ్లు',
      'ఇంటికి వెళ్లడానికి శిశువుకు ఒక దుస్తుల జత',
    ],
    birthPlanPoints: [
      'నొప్పి నిర్వహణపై మీ ప్రాధాన్యతలు',
      'ప్రసవ వేదన సమయంలో మీరు ఎవరు ఉండాలని కోరుకుంటారు',
      'చర్మానికి చర్మం తాకడం గురించి మీ అంచనాలు',
    ],
    neutralText:
      'ఒక సరళమైన ప్రసవ ప్రణాళిక మీ కోరికలను వైద్య బృందంతో పంచుకోవడానికి సహాయపడుతుంది, అదే సమయంలో ఓపెన్ మైండ్‌తో ఉండండి: వాస్తవ గమనం పరిస్థితిని బట్టి మారవచ్చు.',
    tipTitle: 'తెలుసుకోవాల్సినవి',
    tipText:
      'సిద్ధమవ్వడం అంటే ప్రతిదాన్నీ నియంత్రించడం కాదు: ఆ గొప్ప రోజును మరింత ఆత్మవిశ్వాసంతో, తక్కువ అనిశ్చితితో ఎదుర్కోవడానికి మీకు మీరు సాధనాలు ఇచ్చుకోవడమే ప్రధానం.',
    shareMessage: 'ప్రశాంతంగా ప్రసవానికి సిద్ధమవ్వడం — AWA',
  },
  mr: {
    badge: 'गर्भारपण • प्रसूती',
    title: 'प्रसूतीची शांतपणे\nतयारी',
    metaDuration: '7 मिनिटे वाचन',
    metaType: 'मार्गदर्शक',
    metaLevel: 'प्रारंभ स्तर',
    metaValidated: 'पुनरावलोकन केलेला मजकूर',
    intro: 'मोठ्या दिवसाला अधिक आत्मविश्वासाने सामोरे जाण्यासाठी तीन आधारस्तंभ.',
    contentsTitle: 'या लेखात',
    topics: [
      '3 पायऱ्यांत तयारी',
      'तुमची रुग्णालयाची बॅग',
      'तुमची प्रसूती योजना लिहिणे',
      'लक्षात घेण्यासारखे',
      'लक्षात ठेवायचे',
    ],
    prepSteps: [
      'प्रसूतीपूर्व तयारीचे वर्ग',
      'श्वासोच्छ्वास आणि विश्रांतीची तंत्रे',
      '8व्या महिन्यापर्यंत रुग्णालयाची बॅग तयार',
    ],
    body1:
      'प्रसूतीपूर्व तयारीचे वर्ग तुम्हाला प्रसूतीवेदनांचे टप्पे आणि मोठ्या दिवशी तुम्हाला साथ देणारी श्वासोच्छ्वासाची तंत्रे समजण्यास मदत करतात.',
    body2:
      '8व्या महिन्यापर्यंत रुग्णालयाची बॅग भरल्याने शेवटच्या क्षणाचा ताण वाचतो. त्यात सहसा हे असते:',
    bagItems: [
      'ओळखपत्रे आणि तुमचे गर्भारपणाचे नोंदपुस्तक',
      'तुमच्यासाठी आणि बाळासाठी आरामदायी कपडे',
      'प्रसाधनाचे सामान आणि प्रसूतीनंतरचे पॅड',
      'बाळाला घरी नेण्यासाठी एक पोशाख',
    ],
    birthPlanPoints: [
      'वेदना सांभाळण्याबद्दल तुमच्या पसंती',
      'प्रसूतीवेदनांदरम्यान तुम्हाला कोण उपस्थित हवे',
      'त्वचेशी त्वचेच्या संपर्काबद्दल तुमच्या अपेक्षा',
    ],
    neutralText:
      'एक साधी प्रसूती योजना तुम्हाला तुमच्या इच्छा वैद्यकीय पथकाला सांगण्यास मदत करते, आणि तरीही खुले मन ठेवते: प्रत्यक्ष घटनाक्रम परिस्थितीनुसार बदलू शकतो.',
    tipTitle: 'हे जाणून घ्या',
    tipText:
      'तयारी करणे म्हणजे सर्व काही नियंत्रित करणे नव्हे: मुख्यतः मोठ्या दिवसाला अधिक आत्मविश्वासाने आणि कमी अनिश्चिततेने सामोरे जाण्याची साधने स्वतःला देणे हे आहे.',
    shareMessage: 'प्रसूतीची शांतपणे तयारी — AWA',
  },
  gu: {
    badge: 'ગર્ભાવસ્થા • પ્રસૂતિ',
    title: 'પ્રસૂતિ માટે શાંતિથી\nતૈયારી',
    metaDuration: '7 મિનિટ વાંચન',
    metaType: 'માર્ગદર્શિકા',
    metaLevel: 'પ્રારંભિક સ્તર',
    metaValidated: 'પુનરાવલોકન કરેલી સામગ્રી',
    intro: 'એ મોટા દિવસનો વધુ આત્મવિશ્વાસથી સામનો કરવા માટેના ત્રણ આધારસ્તંભો.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      '3 પગલાંમાં તૈયારી',
      'તમારી હૉસ્પિટલ બેગ',
      'તમારી પ્રસૂતિ યોજના લખવી',
      'નોંધવા જેવું',
      'શું યાદ રાખવું',
    ],
    prepSteps: [
      'પ્રસૂતિની તૈયારીના વર્ગો',
      'શ્વાસ અને શિથિલીકરણની તકનીકો',
      '8મા મહિના સુધીમાં હૉસ્પિટલ બેગ તૈયાર',
    ],
    body1:
      'પ્રસૂતિની તૈયારીના વર્ગો તમને પ્રસૂતિની પીડાના તબક્કાઓ અને એ મોટા દિવસે તમને સહારો આપતી શ્વાસની તકનીકો સમજવામાં મદદ કરે છે.',
    body2:
      '8મા મહિના સુધીમાં હૉસ્પિટલ બેગ તૈયાર રાખવાથી છેલ્લી ઘડીનો તણાવ બચે છે. તેમાં સામાન્ય રીતે આ હોય છે:',
    bagItems: [
      'ઓળખના દસ્તાવેજો અને તમારી ગર્ભાવસ્થાની નોંધપોથી',
      'તમારા અને બાળક માટે આરામદાયક કપડાં',
      'સ્વચ્છતાની વસ્તુઓ અને પ્રસૂતિ પછીના પેડ',
      'ઘરે જતી વખતે બાળક માટે પહેરવાનો પોશાક',
    ],
    birthPlanPoints: [
      'દુખાવાના વ્યવસ્થાપન અંગે તમારી પસંદગીઓ',
      'પ્રસૂતિ દરમિયાન તમે કોને હાજર રાખવા ઇચ્છો છો',
      'ત્વચા-થી-ત્વચાના સંપર્ક અંગે તમારી અપેક્ષાઓ',
    ],
    neutralText:
      'એક સરળ પ્રસૂતિ યોજના તમને તમારી ઇચ્છાઓ તબીબી ટીમ સાથે વહેંચવામાં મદદ કરે છે, સાથે ખુલ્લું મન પણ રાખવામાં: વાસ્તવિક ઘટનાક્રમ પરિસ્થિતિ પ્રમાણે બદલાઈ શકે છે.',
    tipTitle: 'જાણવા જેવું',
    tipText:
      'તૈયારીનો અર્થ બધું નિયંત્રિત કરવું એવો નથી: તે મુખ્યત્વે એ મોટા દિવસનો વધુ આત્મવિશ્વાસ અને ઓછી અનિશ્ચિતતા સાથે સામનો કરવાનાં સાધનો પોતાને આપવા વિશે છે.',
    shareMessage: 'પ્રસૂતિ માટે શાંતિથી તૈયારી — AWA',
  },
  pa: {
    badge: 'ਗਰਭ-ਅਵਸਥਾ • ਜਣੇਪਾ',
    title: 'ਜਣੇਪੇ ਲਈ ਸ਼ਾਂਤੀ ਨਾਲ\nਤਿਆਰੀ ਕਰਨਾ',
    metaDuration: '7 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਗਾਈਡ',
    metaLevel: 'ਸ਼ੁਰੂਆਤੀ ਪੱਧਰ',
    metaValidated: 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ',
    intro: 'ਵੱਡੇ ਦਿਨ ਦਾ ਵਧੇਰੇ ਭਰੋਸੇ ਨਾਲ ਸਾਹਮਣਾ ਕਰਨ ਲਈ ਤਿੰਨ ਥੰਮ੍ਹ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      '3 ਕਦਮਾਂ ਵਿੱਚ ਤਿਆਰੀ',
      'ਤੁਹਾਡਾ ਹਸਪਤਾਲ ਦਾ ਬੈਗ',
      'ਆਪਣੀ ਜਣੇਪੇ ਦੀ ਯੋਜਨਾ ਲਿਖਣਾ',
      'ਧਿਆਨ ਦੇਣ ਯੋਗ ਗੱਲ',
      'ਕੀ ਯਾਦ ਰੱਖਣਾ ਹੈ',
    ],
    prepSteps: [
      'ਜਣੇਪੇ ਦੀ ਤਿਆਰੀ ਦੀਆਂ ਕਲਾਸਾਂ',
      'ਸਾਹ ਅਤੇ ਆਰਾਮ ਦੀਆਂ ਤਕਨੀਕਾਂ',
      'ਅੱਠਵੇਂ ਮਹੀਨੇ ਤੱਕ ਹਸਪਤਾਲ ਦਾ ਬੈਗ ਤਿਆਰ',
    ],
    body1:
      'ਜਣੇਪੇ ਦੀ ਤਿਆਰੀ ਦੀਆਂ ਕਲਾਸਾਂ ਤੁਹਾਨੂੰ ਜਣੇਪੇ ਦੀਆਂ ਪੀੜਾਂ ਦੇ ਪੜਾਅ ਅਤੇ ਸਾਹ ਦੀਆਂ ਉਨ੍ਹਾਂ ਤਕਨੀਕਾਂ ਨੂੰ ਸਮਝਣ ਵਿੱਚ ਮਦਦ ਕਰਦੀਆਂ ਹਨ ਜੋ ਵੱਡੇ ਦਿਨ ਤੁਹਾਡਾ ਸਹਾਰਾ ਬਣਨਗੀਆਂ।',
    body2:
      'ਅੱਠਵੇਂ ਮਹੀਨੇ ਤੱਕ ਆਪਣਾ ਹਸਪਤਾਲ ਦਾ ਬੈਗ ਤਿਆਰ ਕਰ ਲੈਣ ਨਾਲ ਆਖ਼ਰੀ ਸਮੇਂ ਦਾ ਤਣਾਅ ਬਚ ਜਾਂਦਾ ਹੈ। ਇਸ ਵਿੱਚ ਆਮ ਤੌਰ ’ਤੇ ਇਹ ਸ਼ਾਮਲ ਹੁੰਦਾ ਹੈ:',
    bagItems: [
      'ਪਛਾਣ ਦੇ ਕਾਗਜ਼ ਅਤੇ ਤੁਹਾਡੀ ਗਰਭ-ਅਵਸਥਾ ਦੀ ਰਿਕਾਰਡ ਕਿਤਾਬ',
      'ਤੁਹਾਡੇ ਅਤੇ ਬੱਚੇ ਲਈ ਆਰਾਮਦਾਇਕ ਕੱਪੜੇ',
      'ਸਫ਼ਾਈ ਦਾ ਸਮਾਨ ਅਤੇ ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਵਾਲੇ ਪੈਡ',
      'ਘਰ ਜਾਣ ਲਈ ਬੱਚੇ ਦਾ ਇੱਕ ਜੋੜਾ ਕੱਪੜੇ',
    ],
    birthPlanPoints: [
      'ਦਰਦ ਦੇ ਪ੍ਰਬੰਧ ਬਾਰੇ ਤੁਹਾਡੀਆਂ ਤਰਜੀਹਾਂ',
      'ਜਣੇਪੇ ਦੌਰਾਨ ਤੁਸੀਂ ਕਿਸ ਨੂੰ ਆਪਣੇ ਕੋਲ ਚਾਹੁੰਦੇ ਹੋ',
      'ਚਮੜੀ ਨਾਲ ਚਮੜੀ ਦੇ ਸੰਪਰਕ ਬਾਰੇ ਤੁਹਾਡੀਆਂ ਉਮੀਦਾਂ',
    ],
    neutralText:
      'ਇੱਕ ਸਾਦੀ ਜਣੇਪੇ ਦੀ ਯੋਜਨਾ ਤੁਹਾਨੂੰ ਆਪਣੀਆਂ ਇੱਛਾਵਾਂ ਮੈਡੀਕਲ ਟੀਮ ਨਾਲ ਸਾਂਝੀਆਂ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰਦੀ ਹੈ, ਨਾਲ ਹੀ ਖੁੱਲ੍ਹੇ ਮਨ ਨਾਲ ਰਹਿਣ ਵਿੱਚ ਵੀ: ਹਾਲਾਤ ਅਨੁਸਾਰ ਅਸਲ ਕਾਰਵਾਈ ਬਦਲ ਸਕਦੀ ਹੈ।',
    tipTitle: 'ਜਾਣਨ ਯੋਗ',
    tipText:
      'ਤਿਆਰੀ ਕਰਨ ਦਾ ਮਤਲਬ ਹਰ ਚੀਜ਼ ਨੂੰ ਕਾਬੂ ਵਿੱਚ ਰੱਖਣਾ ਨਹੀਂ ਹੈ: ਇਹ ਮੁੱਖ ਤੌਰ ’ਤੇ ਆਪਣੇ ਆਪ ਨੂੰ ਇਹ ਸਾਧਨ ਦੇਣਾ ਹੈ ਕਿ ਤੁਸੀਂ ਵੱਡੇ ਦਿਨ ਦਾ ਵਧੇਰੇ ਭਰੋਸੇ ਅਤੇ ਘੱਟ ਅਨਿਸ਼ਚਿਤਤਾ ਨਾਲ ਸਾਹਮਣਾ ਕਰ ਸਕੋ।',
    shareMessage: 'ਜਣੇਪੇ ਲਈ ਸ਼ਾਂਤੀ ਨਾਲ ਤਿਆਰੀ ਕਰਨਾ — AWA',
  },
  my: {
    badge: 'ကိုယ်ဝန်ဆောင်ခြင်း • ကလေးမွေးဖွားခြင်း',
    title: 'ကလေးမွေးဖွားခြင်းအတွက်\nတည်ငြိမ်စွာ ပြင်ဆင်ခြင်း',
    metaDuration: 'ဖတ်ချိန် 7 မိနစ်',
    metaType: 'လမ်းညွှန်',
    metaLevel: 'အခြေခံအဆင့်',
    metaValidated: 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ',
    intro: 'အရေးကြီးသောနေ့ကို ပိုမိုယုံကြည်မှုရှိရှိ ရင်ဆိုင်ရန် တိုင်သုံးခု။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'အဆင့် 3 ဆင့်ဖြင့် ပြင်ဆင်ခြင်း',
      'သင်၏ ဆေးရုံသွားအိတ်',
      'သင်၏ မီးဖွားရေးအစီအစဉ် ရေးဆွဲခြင်း',
      'သတိပြုသင့်သည့်အချက်',
      'မှတ်ထားရမည့်အရာများ',
    ],
    prepSteps: [
      'ကလေးမွေးဖွားခြင်း ပြင်ဆင်ရေး သင်တန်းများ',
      'အသက်ရှူခြင်းနှင့် စိတ်လျှော့ချခြင်း နည်းစနစ်များ',
      'လ 8 တွင် ဆေးရုံသွားအိတ် အဆင်သင့်ဖြစ်ခြင်း',
    ],
    body1:
      'ကလေးမွေးဖွားခြင်း ပြင်ဆင်ရေး သင်တန်းများက အရေးကြီးသောနေ့တွင် သင့်ကို ပံ့ပိုးပေးမည့် ဆက်ဆံရေးအဆင့်များနှင့် အသက်ရှူနည်းစနစ်များကို နားလည်ရန် ကူညီသည်။',
    body2:
      'လ 8 တွင် ဆေးရုံသွားအိတ်ကို ထုပ်ပိုးခြင်းက နောက်ဆုံးအချိန် စိတ်ဖိစီးမှုကို လျော့ပေးသည်။ ၎င်းတွင် များသောအားဖြင့် အောက်ပါအရာများ ပါဝင်သည်။',
    bagItems: [
      'မှတ်ပုံတင်စာရွက်စာတမ်းများနှင့် သင့်ကိုယ်ဝန်ဆောင်မှတ်တမ်းစာအုပ်',
      'သင်နှင့်ကလေးအတွက် သက်သောင့်သက်သာရှိသော အဝတ်အစားများ',
      'ကိုယ်ရေးသန့်ရှင်းရေးပစ္စည်းများနှင့် ကလေးမွေးပြီးနောက်သုံး အနှီးစည်းများ',
      'အိမ်ပြန်ချိန်တွင် ကလေးဝတ်ရန် အဝတ်စုံတစ်စုံ',
    ],
    birthPlanPoints: [
      'နာကျင်မှုကို စီမံခန့်ခွဲရန် သင့်ဦးစားပေးရွေးချယ်မှုများ',
      'ကလေးမွေးဖွားချိန်တွင် သင်ရှိစေလိုသူများ',
      'အသားချင်းထိတွေ့မှုနှင့်ပတ်သက်သော သင့်မျှော်လင့်ချက်များ',
    ],
    neutralText:
      'ရိုးရှင်းသော မီးဖွားရေးအစီအစဉ်က သင့်ဆန္ဒများကို ဆေးဘက်ဆိုင်ရာအဖွဲ့နှင့် မျှဝေရန် ကူညီပေးပြီး စိတ်ကို ပွင့်လင်းစွာထားရန် လိုသည်။ အမှန်တကယ်ဖြစ်စဉ်သည် အခြေအနေပေါ်မူတည်၍ ပြောင်းလဲနိုင်သည်။',
    tipTitle: 'သိထားသင့်သည်',
    tipText:
      'ပြင်ဆင်ခြင်းဆိုသည်မှာ အရာအားလုံးကို ထိန်းချုပ်ခြင်း မဟုတ်ပါ။ အရေးကြီးသောနေ့ကို ပိုမိုယုံကြည်မှုရှိရှိနှင့် မသေချာမှုနည်းနည်းဖြင့် ရင်ဆိုင်နိုင်ရန် ကိုယ့်ကိုယ်ကိုယ် နည်းလမ်းပေးခြင်းသာ ဖြစ်သည်။',
    shareMessage: 'ကလေးမွေးဖွားခြင်းအတွက် တည်ငြိမ်စွာ ပြင်ဆင်ခြင်း — AWA',
  },
  km: {
    badge: 'ការមានផ្ទៃពោះ • ការសម្រាលកូន',
    title: 'ការរៀបចំខ្លួនដោយស្ងប់ស្ងាត់\nសម្រាប់ការសម្រាលកូន',
    metaDuration: 'អាន 7 នាទី',
    metaType: 'មគ្គុទ្ទេសក៍',
    metaLevel: 'កម្រិតដំបូង',
    metaValidated: 'មាតិកាបានពិនិត្យ',
    intro: 'សសរស្តម្ភបីសម្រាប់ទទួលយកថ្ងៃធំដោយទំនុកចិត្តកាន់តែច្រើន។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'ការរៀបចំក្នុង 3 ជំហាន',
      'កាបូបសម្រាប់មន្ទីរពេទ្យរបស់អ្នក',
      'ការសរសេរផែនការសម្រាលរបស់អ្នក',
      'ចំណុចគួរកត់សម្គាល់',
      'អ្វីដែលត្រូវចងចាំ',
    ],
    prepSteps: [
      'ថ្នាក់រៀបចំសម្រាលកូន',
      'បច្ចេកទេសដកដង្ហើម និងបន្ធូរអារម្មណ៍',
      'កាបូបមន្ទីរពេទ្យរួចរាល់មុនខែទី 8',
    ],
    body1:
      'ថ្នាក់រៀបចំសម្រាលកូនជួយអ្នកឱ្យយល់ពីដំណាក់កាលនៃការឈឺចាប់សម្រាល និងបច្ចេកទេសដកដង្ហើមដែលនឹងជួយគាំទ្រអ្នកនៅថ្ងៃធំ។',
    body2:
      'ការរៀបចំកាបូបមន្ទីរពេទ្យមុនខែទី 8 ជួយសន្សំសំចៃភាពតានតឹងនៅនាទីចុងក្រោយ។ ជាធម្មតាវារួមមាន៖',
    bagItems: [
      'ឯកសារអត្តសញ្ញាណ និងសៀវភៅតាមដានផ្ទៃពោះរបស់អ្នក',
      'សម្លៀកបំពាក់ស្រួលសម្រាប់អ្នក និងទារក',
      'ឧបករណ៍អនាម័យផ្ទាល់ខ្លួន និងបន្ទះអនាម័យក្រោយសម្រាល',
      'ឈុតមួយសម្រាប់ទារកពាក់ត្រឡប់ទៅផ្ទះ',
    ],
    birthPlanPoints: [
      'ចំណូលចិត្តរបស់អ្នកក្នុងការគ្រប់គ្រងការឈឺចាប់',
      'អ្នកដែលអ្នកចង់ឱ្យនៅជាមួយអំឡុងពេលឈឺចាប់សម្រាល',
      'ការរំពឹងទុករបស់អ្នកអំពីការប៉ះស្បែកទល់នឹងស្បែក',
    ],
    neutralText:
      'ផែនការសម្រាលសាមញ្ញមួយជួយអ្នកចែករំលែកបំណងប្រាថ្នារបស់អ្នកជាមួយក្រុមពេទ្យ ទន្ទឹមនឹងការរក្សាចិត្តទូលាយ៖ ដំណើរការពិតប្រាកដអាចផ្លាស់ប្តូរទៅតាមស្ថានភាព។',
    tipTitle: 'គួរដឹង',
    tipText:
      'ការរៀបចំមិនមែនមានន័យថាត្រួតត្រាអ្វីៗទាំងអស់ទេ៖ វាគឺជាការផ្តល់មធ្យោបាយដល់ខ្លួនអ្នកដើម្បីទទួលយកថ្ងៃធំដោយទំនុកចិត្តកាន់តែច្រើន និងភាពមិនប្រាកដប្រជាតិចជាងមុន។',
    shareMessage: 'ការរៀបចំខ្លួនដោយស្ងប់ស្ងាត់សម្រាប់ការសម្រាលកូន — AWA',
  },
  lo: {
    badge: 'ການຖືພາ • ການເກີດລູກ',
    title: 'ກຽມພ້ອມຢ່າງສະຫງົບ\nສຳລັບການເກີດລູກ',
    metaDuration: 'ອ່ານ 7 ນາທີ',
    metaType: 'ຄູ່ມື',
    metaLevel: 'ລະດັບເລີ່ມຕົ້ນ',
    metaValidated: 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ',
    intro: 'ສາມເສົາຫຼັກເພື່ອຮັບມືກັບວັນສຳຄັນດ້ວຍຄວາມໝັ້ນໃຈຫຼາຍຂຶ້ນ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ກຽມພ້ອມໃນ 3 ຂັ້ນຕອນ',
      'ກະເປົ໋າໄປໂຮງໝໍຂອງທ່ານ',
      'ການຂຽນແຜນການເກີດລູກ',
      'ສິ່ງທີ່ຄວນສັງເກດ',
      'ສິ່ງທີ່ຄວນຈື່',
    ],
    prepSteps: [
      'ຫ້ອງຮຽນກຽມພ້ອມສຳລັບການເກີດລູກ',
      'ເຕັກນິກການຫາຍໃຈ ແລະ ຜ່ອນຄາຍ',
      'ກະເປົ໋າໄປໂຮງໝໍກຽມພ້ອມພາຍໃນເດືອນທີ 8',
    ],
    body1:
      'ຫ້ອງຮຽນກຽມພ້ອມສຳລັບການເກີດລູກຊ່ວຍໃຫ້ທ່ານເຂົ້າໃຈຂັ້ນຕອນຂອງການເຈັບທ້ອງຄອດ ແລະ ເຕັກນິກການຫາຍໃຈທີ່ຈະຊ່ວຍທ່ານໃນວັນສຳຄັນ.',
    body2:
      'ການຈັດກະເປົ໋າໄປໂຮງໝໍພາຍໃນເດືອນທີ 8 ຊ່ວຍໃຫ້ທ່ານບໍ່ຕ້ອງເຄັ່ງຄຽດໃນນາທີສຸດທ້າຍ. ໂດຍປົກກະຕິມີ:',
    bagItems: [
      'ເອກະສານປະຈຳຕົວ ແລະ ປຶ້ມບັນທຶກການຖືພາຂອງທ່ານ',
      'ເຄື່ອງນຸ່ງທີ່ສະບາຍສຳລັບທ່ານ ແລະ ລູກນ້ອຍ',
      'ເຄື່ອງໃຊ້ສ່ວນຕົວ ແລະ ຜ້າອະນາໄມຫຼັງຄອດ',
      'ຊຸດສຳລັບລູກນ້ອຍໃສ່ກັບບ້ານ',
    ],
    birthPlanPoints: [
      'ຄວາມຕ້ອງການຂອງທ່ານໃນການຈັດການກັບຄວາມເຈັບປວດ',
      'ຜູ້ທີ່ທ່ານຢາກໃຫ້ຢູ່ນຳໃນຂະນະເຈັບທ້ອງຄອດ',
      'ຄວາມຄາດຫວັງຂອງທ່ານກ່ຽວກັບການແນບຜິວໜັງກັບລູກ',
    ],
    neutralText:
      'ແຜນການເກີດລູກແບບງ່າຍໆຊ່ວຍໃຫ້ທ່ານບອກຄວາມຕ້ອງການຂອງທ່ານກັບທີມແພດ ໃນຂະນະທີ່ຍັງເປີດໃຈ: ເຫດການຈິງອາດປ່ຽນແປງຕາມສະຖານະການ.',
    tipTitle: 'ຄວນຮູ້',
    tipText:
      'ການກຽມພ້ອມບໍ່ໄດ້ໝາຍເຖິງການຄວບຄຸມທຸກຢ່າງ: ສ່ວນໃຫຍ່ແມ່ນການໃຫ້ຕົນເອງມີວິທີຮັບມືກັບວັນສຳຄັນດ້ວຍຄວາມໝັ້ນໃຈຫຼາຍຂຶ້ນ ແລະ ຄວາມບໍ່ແນ່ນອນໜ້ອຍລົງ.',
    shareMessage: 'ກຽມພ້ອມຢ່າງສະຫງົບສຳລັບການເກີດລູກ — AWA',
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
