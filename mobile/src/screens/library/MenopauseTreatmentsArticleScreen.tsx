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

const ID = 'treatments-traitements-menopause';

const HERO = require('../../assets/images/library/spm-consult.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('MenopauseTreatments', {
  fr: {
    badge: 'TRAITEMENTS',
    title: 'Les traitements\nde la ménopause',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro: 'Traitement hormonal et alternatives non hormonales, pour t’aider à préparer la discussion avec ton médecin.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Le traitement hormonal de la ménopause',
      'Bénéfices et précautions',
      'Les approches non hormonales',
      'En parler avec un professionnel',
      'À retenir',
    ],
    body1: 'Le traitement hormonal de la ménopause (THM) compense la baisse d’œstrogènes et soulage les symptômes les plus gênants, comme les bouffées de chaleur, les troubles du sommeil ou la sécheresse vaginale.',
    body2: 'Le THM peut aussi contribuer à protéger la densité osseuse. Il n’est cependant pas adapté à toutes les situations : des antécédents personnels (cardiovasculaires, certains cancers hormonodépendants) peuvent en limiter l’usage.',
    alertTitle: 'À noter',
    alertText: 'Le rapport bénéfices/risques du THM dépend de ton âge, du moment où il est débuté par rapport à la ménopause, et de tes antécédents personnels : un bilan médical individualisé est nécessaire avant toute décision.',
    body3: 'Lorsque le THM n’est pas souhaité ou pas adapté, d’autres pistes existent pour soulager les symptômes :',
    nonHormonal: [
      'Thérapies comportementales et cognitives (gestion du stress, du sommeil)',
      'Phytothérapie encadrée par un professionnel',
      'Ajustements du mode de vie (alimentation, activité physique, sommeil)',
      'Lubrifiants et hydratants vaginaux pour la sécheresse intime',
    ],
    tip1Title: 'Bon à savoir',
    tip1Text: 'Même la phytothérapie mérite un avis professionnel : « naturel » ne signifie pas « sans interaction possible » avec d’autres traitements.',
    body4: 'Préparer quelques points avant un rendez-vous aide à profiter pleinement de la discussion :',
    discussPoints: [
      'Tes symptômes les plus gênants au quotidien',
      'Tes antécédents médicaux personnels et familiaux',
      'Tes préférences (hormonal ou non, durée envisagée)',
      'Tes questions et inquiétudes, sans hésiter à les poser',
    ],
    tip2Title: 'Bon à savoir',
    tip2Text: 'Hormonal ou non, aucun traitement n’est universel : celui qui te convient dépend de ta situation personnelle, évaluée avec un professionnel de santé.',
    shareMessage: 'Les traitements de la ménopause — AWA',
  },
  en: {
    badge: 'TREATMENTS',
    title: 'Menopause\ntreatments',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro: 'Hormone replacement therapy and non-hormonal alternatives, to help you prepare for the conversation with your doctor.',
    contentsTitle: 'In this article',
    topics: [
      'Menopause hormone replacement therapy',
      'Benefits and precautions',
      'Non-hormonal approaches',
      'Talking to a healthcare professional',
      'What to remember',
    ],
    body1: 'Menopause hormone replacement therapy (HRT) compensates for the drop in estrogen and can relieve the most bothersome symptoms, such as hot flashes, sleep disturbances, or vaginal dryness.',
    body2: 'HRT can also help protect bone density. However, it isn’t suitable for every situation: a personal history of certain conditions (cardiovascular disease, some hormone-dependent cancers) may limit its use.',
    alertTitle: 'Please note',
    alertText: 'The benefit-risk balance of HRT depends on your age, when it is started relative to menopause, and your personal medical history: an individualized medical assessment is needed before any decision.',
    body3: 'When HRT isn’t wanted or isn’t suitable, other options exist to help relieve symptoms:',
    nonHormonal: [
      'Cognitive behavioral therapy (for managing stress and sleep)',
      'Herbal medicine, supervised by a healthcare professional',
      'Lifestyle adjustments (diet, physical activity, sleep)',
      'Vaginal lubricants and moisturizers for intimate dryness',
    ],
    tip1Title: 'Good to know',
    tip1Text: 'Even herbal medicine deserves professional advice: “natural” doesn’t mean “without possible interactions” with other treatments.',
    body4: 'Preparing a few points before an appointment helps you make the most of the conversation:',
    discussPoints: [
      'Your most bothersome day-to-day symptoms',
      'Your personal and family medical history',
      'Your preferences (hormonal or not, how long you’re considering)',
      'Your questions and concerns — don’t hesitate to ask them',
    ],
    tip2Title: 'Good to know',
    tip2Text: 'Hormonal or not, no treatment is universal: what’s right for you depends on your personal situation, assessed with a healthcare professional.',
    shareMessage: 'Menopause treatments — AWA',
  },
  es: {
    badge: 'TRATAMIENTOS',
    title: 'Los tratamientos\nde la menopausia',
    metaDuration: '7 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido validado',
    intro: 'Tratamiento hormonal y alternativas no hormonales, para ayudarte a preparar la conversación con tu médico.',
    contentsTitle: 'En este artículo',
    topics: [
      'El tratamiento hormonal de la menopausia',
      'Beneficios y precauciones',
      'Los enfoques no hormonales',
      'Hablarlo con un profesional',
      'Para recordar',
    ],
    body1: 'El tratamiento hormonal de la menopausia (THM) compensa la disminución de estrógenos y alivia los síntomas más molestos, como los sofocos, los trastornos del sueño o la sequedad vaginal.',
    body2: 'El THM también puede contribuir a proteger la densidad ósea. Sin embargo, no es adecuado para todas las situaciones: ciertos antecedentes personales (cardiovasculares, algunos cánceres hormonodependientes) pueden limitar su uso.',
    alertTitle: 'A tener en cuenta',
    alertText: 'La relación beneficio-riesgo del THM depende de tu edad, del momento en que se inicia con respecto a la menopausia, y de tus antecedentes personales: es necesario un balance médico individualizado antes de cualquier decisión.',
    body3: 'Cuando el THM no se desea o no es adecuado, existen otras vías para aliviar los síntomas:',
    nonHormonal: [
      'Terapias cognitivo-conductuales (gestión del estrés, del sueño)',
      'Fitoterapia supervisada por un profesional',
      'Ajustes del estilo de vida (alimentación, actividad física, sueño)',
      'Lubricantes e hidratantes vaginales para la sequedad íntima',
    ],
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Incluso la fitoterapia merece un asesoramiento profesional: «natural» no significa «sin posibles interacciones» con otros tratamientos.',
    body4: 'Preparar algunos puntos antes de una cita ayuda a aprovechar plenamente la conversación:',
    discussPoints: [
      'Tus síntomas más molestos en el día a día',
      'Tus antecedentes médicos personales y familiares',
      'Tus preferencias (hormonal o no, duración prevista)',
      'Tus preguntas e inquietudes, sin dudar en plantearlas',
    ],
    tip2Title: 'DATO ÚTIL',
    tip2Text: 'Hormonal o no, ningún tratamiento es universal: el que te conviene depende de tu situación personal, evaluada con un profesional de la salud.',
    shareMessage: 'Los tratamientos de la menopausia — AWA',
  },
  it: {
    badge: 'TRATTAMENTI',
    title: 'I trattamenti\nper la menopausa',
    metaDuration: '7 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenuto validato',
    intro: 'La terapia ormonale sostitutiva e le alternative non ormonali, per aiutarti a preparare il confronto con il tuo medico.',
    contentsTitle: 'In questo articolo',
    topics: [
      'La terapia ormonale sostitutiva della menopausa',
      'Benefici e precauzioni',
      'Approcci non ormonali',
      'Parlarne con un professionista sanitario',
      'Cosa ricordare',
    ],
    body1: 'La terapia ormonale sostitutiva (TOS) della menopausa compensa il calo degli estrogeni e può alleviare i sintomi più fastidiosi, come le vampate di calore, i disturbi del sonno o la secchezza vaginale.',
    body2: 'La TOS può anche contribuire a proteggere la densità ossea. Tuttavia non è adatta a ogni situazione: una storia personale di determinate condizioni (malattie cardiovascolari, alcuni tumori ormono-dipendenti) può limitarne l’uso.',
    alertTitle: 'Attenzione',
    alertText: 'Il rapporto benefici-rischi della TOS dipende dalla tua età, dal momento in cui viene iniziata rispetto alla menopausa e dalla tua storia medica personale: prima di qualsiasi decisione è necessaria una valutazione medica individualizzata.',
    body3: 'Quando la TOS non è desiderata o non è adatta, esistono altre opzioni per aiutare ad alleviare i sintomi:',
    nonHormonal: [
      'Terapia cognitivo-comportamentale (per la gestione di stress e sonno)',
      'Fitoterapia, sotto la supervisione di un professionista sanitario',
      'Adattamenti dello stile di vita (alimentazione, attività fisica, sonno)',
      'Lubrificanti e idratanti vaginali per la secchezza intima',
    ],
    tip1Title: 'Bene a sapersi',
    tip1Text: 'Anche la fitoterapia merita il parere di un professionista: «naturale» non significa «senza possibili interazioni» con altri trattamenti.',
    body4: 'Preparare qualche punto prima di una visita ti aiuta a sfruttare al meglio il confronto:',
    discussPoints: [
      'I sintomi che ti danno più fastidio nella vita quotidiana',
      'La tua storia medica personale e familiare',
      'Le tue preferenze (ormonale o no, per quanto tempo stai pensando di proseguire)',
      'Le tue domande e preoccupazioni — non esitare a farle',
    ],
    tip2Title: 'Bene a sapersi',
    tip2Text: 'Ormonale o no, nessun trattamento è universale: ciò che va bene per te dipende dalla tua situazione personale, valutata insieme a un professionista sanitario.',
    shareMessage: 'I trattamenti per la menopausa — AWA',
  },
  tr: {
    badge: 'TEDAVİLER',
    title: 'Menopoz\ntedavileri',
    metaDuration: '7 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Orta düzey',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Hormon replasman tedavisi ve hormonsuz alternatifler; doktorunla yapacağın görüşmeye hazırlanmana yardımcı olmak için.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Menopozda hormon replasman tedavisi',
      'Faydalar ve önlemler',
      'Hormonsuz yaklaşımlar',
      'Bir sağlık uzmanıyla konuşmak',
      'Akılda tutulacaklar',
    ],
    body1: 'Menopozda hormon replasman tedavisi (HRT), östrojen düşüşünü telafi eder ve sıcak basması, uyku bozuklukları ya da vajinal kuruluk gibi en rahatsız edici belirtileri hafifletebilir.',
    body2: 'HRT kemik yoğunluğunun korunmasına da yardımcı olabilir. Ancak her durum için uygun değildir: bazı rahatsızlıkların (kalp-damar hastalığı, bazı hormona bağımlı kanserler) kişisel öyküde bulunması kullanımını sınırlayabilir.',
    alertTitle: 'Dikkat',
    alertText: 'HRT’nin yarar-risk dengesi yaşına, menopoza göre ne zaman başlandığına ve kişisel tıbbi öyküne bağlıdır: herhangi bir karardan önce kişiye özel bir tıbbi değerlendirme gerekir.',
    body3: 'HRT istenmediğinde ya da uygun olmadığında, belirtileri hafifletmeye yardımcı olabilecek başka seçenekler de vardır:',
    nonHormonal: [
      'Bilişsel davranışçı terapi (stres ve uykunun yönetimi için)',
      'Bir sağlık uzmanının gözetiminde bitkisel tedavi',
      'Yaşam tarzı düzenlemeleri (beslenme, fiziksel aktivite, uyku)',
      'Mahrem bölge kuruluğu için vajinal kayganlaştırıcılar ve nemlendiriciler',
    ],
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Bitkisel tedavi için bile uzman görüşü almakta fayda var: “doğal” olması, diğer tedavilerle olası etkileşimlerin “olmadığı” anlamına gelmez.',
    body4: 'Randevudan önce birkaç noktayı hazırlamak, görüşmeden en iyi şekilde yararlanmana yardımcı olur:',
    discussPoints: [
      'Gündelik hayatta seni en çok rahatsız eden belirtiler',
      'Kişisel ve ailevi tıbbi öykün',
      'Tercihlerin (hormonlu ya da hormonsuz, ne kadar süre düşündüğün)',
      'Soruların ve endişelerin — onları sormaktan çekinme',
    ],
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Hormonlu ya da hormonsuz, hiçbir tedavi herkes için geçerli değildir: sana uygun olan, bir sağlık uzmanıyla birlikte değerlendirilen kişisel durumuna bağlıdır.',
    shareMessage: 'Menopoz tedavileri — AWA',
  },
  ru: {
    badge: 'ЛЕЧЕНИЕ',
    title: 'Лечение\nв менопаузе',
    metaDuration: '7 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Средний уровень',
    metaValidated: 'Проверенный материал',
    intro: 'Заместительная гормональная терапия и негормональные альтернативы — чтобы подготовиться к разговору с врачом.',
    contentsTitle: 'В этой статье',
    topics: [
      'Менопаузальная гормональная терапия',
      'Польза и меры предосторожности',
      'Негормональные подходы',
      'Разговор с медицинским специалистом',
      'Что важно запомнить',
    ],
    body1: 'Менопаузальная гормональная терапия (МГТ) восполняет снижение уровня эстрогенов и может облегчить самые неприятные симптомы, такие как приливы, нарушения сна или сухость во влагалище.',
    body2: 'МГТ может также помогать сохранять плотность костей. Однако она подходит не при любых обстоятельствах: наличие в личном анамнезе некоторых заболеваний (сердечно-сосудистых заболеваний, некоторых гормонозависимых видов рака) может ограничивать её применение.',
    alertTitle: 'Обратите внимание',
    alertText: 'Соотношение пользы и риска МГТ зависит от вашего возраста, от того, когда терапия начата относительно наступления менопаузы, и от вашего личного медицинского анамнеза: перед любым решением необходима индивидуальная медицинская оценка.',
    body3: 'Если МГТ нежелательна или не подходит, существуют и другие варианты, которые помогают облегчить симптомы:',
    nonHormonal: [
      'Когнитивно-поведенческая терапия (для управления стрессом и сном)',
      'Фитотерапия под наблюдением медицинского специалиста',
      'Коррекция образа жизни (питание, физическая активность, сон)',
      'Вагинальные лубриканты и увлажняющие средства при интимной сухости',
    ],
    tip1Title: 'Полезно знать',
    tip1Text: 'Даже фитотерапия требует консультации специалиста: «натуральное» не означает «без возможных взаимодействий» с другими видами лечения.',
    body4: 'Если заранее подготовить несколько пунктов, приём пройдёт продуктивнее:',
    discussPoints: [
      'Симптомы, которые больше всего беспокоят вас в повседневной жизни',
      'Ваш личный и семейный медицинский анамнез',
      'Ваши предпочтения (гормональное лечение или нет, на какой срок вы его рассматриваете)',
      'Ваши вопросы и опасения — не стесняйтесь их задавать',
    ],
    tip2Title: 'Полезно знать',
    tip2Text: 'Гормональное или нет, универсального лечения не существует: то, что подходит именно вам, зависит от вашей личной ситуации, которую оценивают вместе с медицинским специалистом.',
    shareMessage: 'Лечение в менопаузе — AWA',
  },
  de: {
    badge: 'BEHANDLUNGEN',
    title: 'Behandlungen\nin den Wechseljahren',
    metaDuration: '7 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Fortgeschritten',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Hormonersatztherapie und nicht hormonelle Alternativen, damit du dich auf das Gespräch mit deiner Ärztin oder deinem Arzt vorbereiten kannst.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Hormonersatztherapie in den Wechseljahren',
      'Nutzen und Vorsichtsmaßnahmen',
      'Nicht hormonelle Ansätze',
      'Das Gespräch mit medizinischem Fachpersonal',
      'Was du dir merken solltest',
    ],
    body1: 'Die Hormonersatztherapie (HRT) in den Wechseljahren gleicht den Abfall des Östrogenspiegels aus und kann die belastendsten Beschwerden wie Hitzewallungen, Schlafstörungen oder vaginale Trockenheit lindern.',
    body2: 'Die HRT kann außerdem helfen, die Knochendichte zu schützen. Sie ist jedoch nicht in jeder Situation geeignet: Bestimmte Vorerkrankungen (Herz-Kreislauf-Erkrankungen, einige hormonabhängige Krebserkrankungen) können ihren Einsatz einschränken.',
    alertTitle: 'Bitte beachte',
    alertText: 'Das Verhältnis von Nutzen und Risiken der HRT hängt von deinem Alter, dem Zeitpunkt des Beginns im Verhältnis zu den Wechseljahren und deiner persönlichen Krankengeschichte ab: Vor jeder Entscheidung ist eine individuelle ärztliche Beurteilung nötig.',
    body3: 'Wenn eine HRT nicht gewünscht oder nicht geeignet ist, gibt es andere Möglichkeiten, die Beschwerden zu lindern:',
    nonHormonal: [
      'Kognitive Verhaltenstherapie (zum Umgang mit Stress und Schlaf)',
      'Pflanzliche Mittel, unter Begleitung von medizinischem Fachpersonal',
      'Anpassungen des Lebensstils (Ernährung, körperliche Aktivität, Schlaf)',
      'Vaginale Gleit- und Feuchtigkeitsmittel bei Trockenheit im Intimbereich',
    ],
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Auch pflanzliche Mittel verdienen fachliche Beratung: „natürlich“ bedeutet nicht „ohne mögliche Wechselwirkungen“ mit anderen Behandlungen.',
    body4: 'Wenn du dir vor einem Termin ein paar Punkte zurechtlegst, kannst du das Gespräch besser nutzen:',
    discussPoints: [
      'Die Beschwerden, die dich im Alltag am meisten belasten',
      'Deine eigene und die familiäre Krankengeschichte',
      'Deine Präferenzen (hormonell oder nicht, für welchen Zeitraum du es dir vorstellst)',
      'Deine Fragen und Sorgen – zögere nicht, sie zu stellen',
    ],
    tip2Title: 'Gut zu wissen',
    tip2Text: 'Ob hormonell oder nicht: Keine Behandlung passt für alle. Was für dich richtig ist, hängt von deiner persönlichen Situation ab, die du gemeinsam mit medizinischem Fachpersonal einschätzt.',
    shareMessage: 'Behandlungen in den Wechseljahren — AWA',
  },
  zh: {
      badge: '治疗方式',
      title: '绝经期\n治疗方式',
      metaDuration: '阅读约 7 分钟',
      metaType: '指南',
      metaLevel: '进阶',
      metaValidated: '经审阅的内容',
      intro: '激素替代疗法与非激素的替代方式，帮助你为与医生的沟通做好准备。',
      contentsTitle: '本文内容',
      topics: [
        '绝经期激素替代疗法',
        '益处与注意事项',
        '非激素方法',
        '与医疗专业人员沟通',
        '需要记住的事',
      ],
      body1: '绝经期激素替代疗法（HRT）可以补充下降的雌激素，缓解最令人困扰的症状，例如潮热、睡眠障碍或阴道干涩。',
      body2: 'HRT 还可能有助于保护骨密度。不过，它并不适合所有情况：某些疾病的个人病史（心血管疾病、部分激素依赖性癌症）可能会限制它的使用。',
      alertTitle: '请注意',
      alertText: 'HRT 的获益与风险平衡，取决于你的年龄、开始使用的时间与绝经的关系，以及你个人的病史：在做出任何决定之前，都需要进行个体化的医疗评估。',
      body3: '如果不想使用或不适合使用 HRT，还有其他方式可以帮助缓解症状：',
      nonHormonal: [
        '认知行为疗法（用于应对压力和睡眠问题）',
        '草药疗法，需在医疗专业人员的指导下进行',
        '生活方式调整（饮食、体育活动、睡眠）',
        '用于缓解私处干涩的阴道润滑剂和保湿产品',
      ],
      tip1Title: '小贴士',
      tip1Text: '即使是草药疗法，也值得听取专业建议：“天然”并不等于与其他治疗“不会有相互作用”。',
      body4: '就诊前先准备好几个要点，能帮助你更充分地利用这次沟通：',
      discussPoints: [
        '日常生活中最让你困扰的症状',
        '你个人和家族的病史',
        '你的意愿（是否使用激素、打算使用多久）',
        '你的疑问和顾虑——不要犹豫，尽管提出来',
      ],
      tip2Title: '小贴士',
      tip2Text: '无论是否使用激素，都没有适合所有人的治疗方式：什么适合你，取决于你的个人情况，并需要与医疗专业人员一起评估。',
      shareMessage: '绝经期治疗方式 — AWA',
    },
  id: {
    badge: 'PENGOBATAN',
    title: 'Pengobatan\nmenopause',
    metaDuration: '7 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Menengah',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Terapi sulih hormon dan alternatif nonhormonal, untuk membantumu mempersiapkan diri berbicara dengan dokter.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Terapi sulih hormon pada menopause',
      'Manfaat dan kewaspadaan',
      'Pendekatan nonhormonal',
      'Berbicara dengan tenaga kesehatan',
      'Hal yang perlu diingat',
    ],
    body1: 'Terapi sulih hormon (TSH) pada menopause menggantikan penurunan estrogen dan dapat meredakan gejala yang paling mengganggu, seperti rasa panas mendadak (hot flashes), gangguan tidur, atau kekeringan vagina.',
    body2: 'TSH juga dapat membantu melindungi kepadatan tulang. Namun, terapi ini tidak cocok untuk setiap situasi: riwayat pribadi kondisi tertentu (penyakit kardiovaskular, beberapa kanker yang bergantung pada hormon) dapat membatasi penggunaannya.',
    alertTitle: 'Harap diperhatikan',
    alertText: 'Keseimbangan manfaat dan risiko TSH bergantung pada usiamu, kapan terapi dimulai dibandingkan dengan waktu menopause, dan riwayat kesehatan pribadimu: diperlukan penilaian medis yang individual sebelum mengambil keputusan apa pun.',
    body3: 'Jika TSH tidak diinginkan atau tidak cocok, ada pilihan lain untuk membantu meredakan gejala:',
    nonHormonal: [
      'Terapi perilaku kognitif (untuk mengelola stres dan tidur)',
      'Pengobatan herbal, dengan pengawasan tenaga kesehatan',
      'Penyesuaian gaya hidup (pola makan, aktivitas fisik, tidur)',
      'Pelumas dan pelembap vagina untuk kekeringan di area intim',
    ],
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Pengobatan herbal pun layak dikonsultasikan kepada tenaga profesional: “alami” bukan berarti “tanpa kemungkinan interaksi” dengan pengobatan lain.',
    body4: 'Menyiapkan beberapa poin sebelum janji temu membantumu memanfaatkan percakapan dengan sebaik-baiknya:',
    discussPoints: [
      'Gejala sehari-hari yang paling mengganggumu',
      'Riwayat kesehatan pribadi dan keluargamu',
      'Preferensimu (hormonal atau tidak, berapa lama yang kamu pertimbangkan)',
      'Pertanyaan dan kekhawatiranmu — jangan ragu untuk menyampaikannya',
    ],
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Hormonal atau bukan, tidak ada pengobatan yang berlaku untuk semua orang: apa yang tepat untukmu bergantung pada situasi pribadimu, yang dinilai bersama tenaga kesehatan.',
    shareMessage: 'Pengobatan menopause — AWA',
  },
  hi: {
    badge: 'उपचार',
    title: 'मेनोपॉज़ के\nउपचार',
    metaDuration: '7 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'हार्मोन रिप्लेसमेंट थेरेपी और बिना हार्मोन वाले विकल्प, ताकि आप डॉक्टर से बातचीत की तैयारी कर सकें।',
    contentsTitle: 'इस लेख में',
    topics: [
      'मेनोपॉज़ के लिए हार्मोन रिप्लेसमेंट थेरेपी',
      'फ़ायदे और सावधानियाँ',
      'बिना हार्मोन वाले तरीक़े',
      'स्वास्थ्य विशेषज्ञ से बात करना',
      'याद रखने वाली बातें',
    ],
    body1: 'मेनोपॉज़ (रजोनिवृत्ति) के लिए हार्मोन रिप्लेसमेंट थेरेपी (HRT) एस्ट्रोजन की कमी की भरपाई करती है और गर्मी की लहरें (हॉट फ़्लैश), नींद में गड़बड़ी या योनि में सूखापन जैसे सबसे परेशान करने वाले लक्षणों को कम कर सकती है।',
    body2: 'HRT हड्डियों के घनत्व की सुरक्षा में भी मदद कर सकती है। हालाँकि, यह हर स्थिति के लिए उपयुक्त नहीं है: कुछ बीमारियों का व्यक्तिगत इतिहास (हृदय रोग, कुछ हार्मोन-निर्भर कैंसर) इसके उपयोग को सीमित कर सकता है।',
    alertTitle: 'ध्यान दें',
    alertText: 'HRT के फ़ायदे और जोखिम का संतुलन आपकी उम्र, मेनोपॉज़ के सापेक्ष इसे कब शुरू किया गया, और आपके व्यक्तिगत चिकित्सा इतिहास पर निर्भर करता है: कोई भी फ़ैसला लेने से पहले व्यक्तिगत चिकित्सकीय जाँच ज़रूरी है।',
    body3: 'जब HRT न चाहिए हो या उपयुक्त न हो, तो लक्षणों में राहत के लिए दूसरे विकल्प मौजूद हैं:',
    nonHormonal: [
      'कॉग्निटिव बिहेवियरल थेरेपी (तनाव और नींद को संभालने के लिए)',
      'जड़ी-बूटी आधारित चिकित्सा, स्वास्थ्य विशेषज्ञ की निगरानी में',
      'जीवनशैली में बदलाव (आहार, शारीरिक गतिविधि, नींद)',
      'योनि के सूखेपन के लिए वजाइनल लुब्रिकेंट और मॉइस्चराइज़र',
    ],
    tip1Title: 'जानने लायक बात',
    tip1Text: 'जड़ी-बूटी आधारित चिकित्सा के लिए भी विशेषज्ञ की सलाह ज़रूरी है: “प्राकृतिक” का मतलब यह नहीं कि दूसरी दवाओं के साथ “कोई संभावित असर नहीं”।',
    body4: 'अपॉइंटमेंट से पहले कुछ बातें तैयार करने से बातचीत का पूरा फ़ायदा उठाने में मदद मिलती है:',
    discussPoints: [
      'रोज़मर्रा के आपको सबसे ज़्यादा परेशान करने वाले लक्षण',
      'आपका व्यक्तिगत और पारिवारिक चिकित्सा इतिहास',
      'आपकी पसंद (हार्मोनल या नहीं, कितने समय के लिए सोच रही हैं)',
      'आपके सवाल और चिंताएँ — उन्हें पूछने में झिझकें नहीं',
    ],
    tip2Title: 'जानने लायक बात',
    tip2Text: 'हार्मोनल हो या नहीं, कोई भी उपचार सब पर लागू नहीं होता: आपके लिए क्या सही है, यह आपकी निजी स्थिति पर निर्भर करता है, जिसे स्वास्थ्य विशेषज्ञ के साथ परखा जाता है।',
    shareMessage: 'मेनोपॉज़ के उपचार — AWA',
  },
  sq: {
    badge: 'TRAJTIMET',
    title: 'Trajtimet e\nmenopauzës',
    metaDuration: '7 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Mesatar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Terapia zëvendësuese hormonale dhe alternativat johormonale, për të të ndihmuar të përgatitesh për bisedën me mjekun tënd.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Terapia zëvendësuese hormonale e menopauzës',
      'Përfitimet dhe masat paraprake',
      'Qasjet johormonale',
      'Të flasësh me një profesionist të shëndetësisë',
      'Çfarë duhet të mbash mend',
    ],
    body1: 'Terapia zëvendësuese hormonale e menopauzës (THZ) kompenson rënien e estrogjenit dhe mund të lehtësojë simptomat më shqetësuese, si valët e nxehtësisë, çrregullimet e gjumit ose thatësia vaginale.',
    body2: 'THZ mund të ndihmojë edhe në mbrojtjen e densitetit kockor. Megjithatë, ajo nuk është e përshtatshme për çdo situatë: një historik personal i disa sëmundjeve (sëmundje kardiovaskulare, disa kancere të varura nga hormonet) mund ta kufizojë përdorimin e saj.',
    alertTitle: 'Kujdes',
    alertText: 'Ekuilibri midis përfitimit dhe rrezikut të THZ varet nga mosha jote, nga koha kur fillohet në raport me menopauzën dhe nga historiku yt personal mjekësor: para çdo vendimi nevojitet një vlerësim mjekësor i individualizuar.',
    body3: 'Kur THZ nuk dëshirohet ose nuk është e përshtatshme, ka opsione të tjera për të lehtësuar simptomat:',
    nonHormonal: [
      'Terapi kognitive-sjellëse (për menaxhimin e stresit dhe të gjumit)',
      'Fitoterapi, e mbikëqyrur nga një profesionist i shëndetësisë',
      'Rregullime në mënyrën e jetesës (ushqim, aktivitet fizik, gjumë)',
      'Lubrifikantë dhe hidratues vaginalë për thatësinë intime',
    ],
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Edhe fitoterapia ia vlen të këshillohet me një profesionist: “natyrale” nuk do të thotë “pa ndërveprime të mundshme” me trajtime të tjera.',
    body4: 'Të përgatisësh disa pika përpara një takimi të ndihmon ta shfrytëzosh sa më mirë bisedën:',
    discussPoints: [
      'Simptomat që të shqetësojnë më shumë në jetën e përditshme',
      'Historiku yt personal dhe familjar mjekësor',
      'Preferencat e tua (hormonale apo jo, për sa kohë po mendon)',
      'Pyetjet dhe shqetësimet e tua — mos ngurro t’i bësh',
    ],
    tip2Title: 'Mirë është ta dish',
    tip2Text: 'Hormonal apo jo, asnjë trajtim nuk është universal: ajo që të përshtatet ty varet nga situata jote personale, e vlerësuar me një profesionist të shëndetësisë.',
    shareMessage: 'Trajtimet e menopauzës — AWA',
  },
  ja: {
    badge: '治療',
    title: '更年期の\n治療',
    metaDuration: '読了7分',
    metaType: 'ガイド',
    metaLevel: '中級',
    metaValidated: '確認済みの内容',
    intro: 'ホルモン補充療法とホルモンを使わない方法を紹介します。医師との相談に備える手助けになります。',
    contentsTitle: 'この記事の内容',
    topics: [
      '更年期のホルモン補充療法',
      'メリットと注意点',
      'ホルモンを使わない方法',
      '医療従事者に相談するには',
      '覚えておきたいこと',
    ],
    body1: '更年期のホルモン補充療法（HRT）は、減少したエストロゲンを補うもので、ほてり、睡眠の乱れ、腟の乾燥など、特につらい症状を和らげることがあります。',
    body2: 'HRTは骨密度の維持にも役立つことがあります。ただし、すべての人に適しているわけではありません。特定の病気（心血管疾患、一部のホルモン依存性のがんなど）の既往がある場合は、使用が制限されることがあります。',
    alertTitle: 'ご注意ください',
    alertText: 'HRTの利益とリスクのバランスは、年齢、閉経からどれくらいで開始するか、そして既往歴によって異なります。決める前に、個別の医学的な評価が必要です。',
    body3: 'HRTを望まない場合や適さない場合でも、症状を和らげるためのほかの選択肢があります。',
    nonHormonal: [
      '認知行動療法（ストレスや睡眠への対処に）',
      'ハーブ療法（医療従事者の管理のもとで）',
      '生活習慣の見直し（食事、運動、睡眠）',
      'デリケートゾーンの乾燥には、腟用の潤滑剤や保湿剤',
    ],
    tip1Title: '知っておきたいこと',
    tip1Text: 'ハーブ療法でも専門家の助言は大切です。「自然」だからといって、ほかの治療との相互作用が「ない」とは限りません。',
    body4: '受診の前にいくつかの点を整理しておくと、診察の時間を有効に使えます。',
    discussPoints: [
      '日常生活で最もつらい症状',
      'ご自身と家族の病歴',
      '希望（ホルモンを使うか使わないか、どれくらいの期間を考えているか）',
      '質問や不安なこと。ためらわずに聞きましょう',
    ],
    tip2Title: '知っておきたいこと',
    tip2Text: 'ホルモンを使う場合も使わない場合も、すべての人に合う治療はありません。何が合うかは、医療従事者とともに確認する個人の状況によって決まります。',
    shareMessage: '更年期の治療 — AWA',
  },
  ko: {
    badge: '치료',
    title: '폐경\n치료법',
    metaDuration: '읽는 데 7분',
    metaType: '가이드',
    metaLevel: '중급',
    metaValidated: '검토된 콘텐츠',
    intro: '호르몬 대체 요법과 비호르몬 대안을 알아보고, 의사와의 상담을 준비해 보세요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    topics: [
      '폐경 호르몬 대체 요법',
      '이점과 주의할 점',
      '비호르몬 접근법',
      '의료 전문가와 상담하기',
      '기억할 점',
    ],
    body1: '폐경 호르몬 대체 요법(HRT)은 줄어든 에스트로겐을 보충해 주고, 안면 홍조(열감), 수면 장애, 질 건조처럼 가장 불편한 증상을 덜어 줄 수 있어요.',
    body2: 'HRT는 골밀도를 지키는 데에도 도움이 될 수 있어요. 하지만 모든 상황에 맞는 것은 아니에요. 특정 질환(심혈관 질환, 일부 호르몬 의존성 암)의 병력이 있으면 사용이 제한될 수 있어요.',
    alertTitle: '유의하세요',
    alertText: 'HRT의 이점과 위험의 균형은 나이, 폐경 후 언제 시작하는지, 개인의 병력에 따라 달라져요. 결정하기 전에 개인별 의학적 평가가 필요해요.',
    body3: 'HRT를 원하지 않거나 맞지 않을 때는 증상을 덜어 주는 다른 방법도 있어요.',
    nonHormonal: [
      '인지행동치료(스트레스와 수면 관리에 도움)',
      '의료 전문가의 지도 아래 하는 허브 요법',
      '생활 습관 조정(식단, 신체 활동, 수면)',
      '질 건조를 위한 질 윤활제와 질 보습제',
    ],
    tip1Title: '알아 두면 좋아요',
    tip1Text: '허브 요법도 전문가의 조언을 받는 것이 좋아요. “천연”이라고 해서 다른 치료제와의 상호작용이 없다는 뜻은 아니에요.',
    body4: '진료 전에 몇 가지를 미리 정리해 두면 상담을 더 알차게 활용할 수 있어요.',
    discussPoints: [
      '일상에서 가장 불편한 증상',
      '개인 및 가족의 병력',
      '원하는 방향(호르몬 요법 여부, 고려하는 기간)',
      '궁금한 점과 걱정되는 점, 망설이지 말고 물어보세요.',
    ],
    tip2Title: '알아 두면 좋아요',
    tip2Text: '호르몬 요법이든 아니든 모두에게 맞는 치료는 없어요. 나에게 맞는 방법은 개인 상황에 따라 다르며, 의료 전문가와 함께 평가해야 해요.',
    shareMessage: '폐경 치료법 — AWA',
  },
  'pt-PT': {
    badge: 'TRATAMENTOS',
    title: 'Tratamentos\nda menopausa',
    metaDuration: '7 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Intermédio',
    metaValidated: 'Conteúdo revisto',
    intro: 'A terapêutica hormonal de substituição e as alternativas não hormonais, para a ajudar a preparar a conversa com o seu médico.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Terapêutica hormonal de substituição da menopausa',
      'Benefícios e precauções',
      'Abordagens não hormonais',
      'Falar com um profissional de saúde',
      'O que reter',
    ],
    body1: 'A terapêutica hormonal de substituição (THS) da menopausa compensa a descida dos estrogénios e pode aliviar os sintomas mais incómodos, como os afrontamentos, as perturbações do sono ou a secura vaginal.',
    body2: 'A THS pode também ajudar a proteger a densidade óssea. No entanto, não é adequada a todas as situações: um historial pessoal de certas doenças (doenças cardiovasculares, alguns cancros hormonodependentes) pode limitar a sua utilização.',
    alertTitle: 'Atenção',
    alertText: 'O equilíbrio entre benefícios e riscos da THS depende da sua idade, do momento em que é iniciada em relação à menopausa e do seu historial médico pessoal: é necessária uma avaliação médica individualizada antes de qualquer decisão.',
    body3: 'Quando a THS não é desejada ou não é adequada, existem outras opções para ajudar a aliviar os sintomas:',
    nonHormonal: [
      'Terapia cognitivo-comportamental (para a gestão do stress e do sono)',
      'Fitoterapia, com acompanhamento de um profissional de saúde',
      'Ajustes no estilo de vida (alimentação, atividade física, sono)',
      'Lubrificantes e hidratantes vaginais para a secura íntima',
    ],
    tip1Title: 'Bom saber',
    tip1Text: 'Mesmo a fitoterapia merece aconselhamento profissional: “natural” não significa “sem possíveis interações” com outros tratamentos.',
    body4: 'Preparar alguns pontos antes de uma consulta ajuda a tirar o máximo partido da conversa:',
    discussPoints: [
      'Os sintomas que mais a incomodam no dia a dia',
      'O seu historial médico pessoal e familiar',
      'As suas preferências (hormonal ou não, durante quanto tempo está a pensar)',
      'As suas dúvidas e preocupações — não hesite em colocá-las',
    ],
    tip2Title: 'Bom saber',
    tip2Text: 'Hormonal ou não, nenhum tratamento é universal: o que lhe convém depende da sua situação pessoal, avaliada com um profissional de saúde.',
    shareMessage: 'Tratamentos da menopausa — AWA',
  },
  bn: {
    badge: 'চিকিৎসা',
    title: 'মেনোপজের\nচিকিৎসা',
    metaDuration: 'পড়তে 7 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'মধ্যম',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'হরমোন প্রতিস্থাপন থেরাপি এবং হরমোনবিহীন বিকল্প, যাতে ডাক্তারের সঙ্গে আলোচনার জন্য আপনি প্রস্তুত হতে পারেন।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'মেনোপজের হরমোন প্রতিস্থাপন থেরাপি',
      'উপকারিতা ও সতর্কতা',
      'হরমোনবিহীন পদ্ধতি',
      'স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে কথা বলা',
      'যা মনে রাখবেন',
    ],
    body1: 'মেনোপজের হরমোন প্রতিস্থাপন থেরাপি (এইচআরটি) ইস্ট্রোজেনের ঘাটতি পূরণ করে এবং সবচেয়ে অস্বস্তিকর উপসর্গ, যেমন হট ফ্ল্যাশ (গরম লাগা), ঘুমের ব্যাঘাত বা যোনিপথের শুষ্কতা কমাতে পারে।',
    body2: 'এইচআরটি হাড়ের ঘনত্ব রক্ষা করতেও সাহায্য করতে পারে। তবে এটি সব ক্ষেত্রে উপযুক্ত নয়: কিছু রোগের ব্যক্তিগত ইতিহাস (হৃদ্রোগ, হরমোন-নির্ভর কিছু ক্যানসার) এর ব্যবহার সীমিত করতে পারে।',
    alertTitle: 'লক্ষ্য করুন',
    alertText: 'এইচআরটির উপকার ও ঝুঁকির ভারসাম্য নির্ভর করে আপনার বয়স, মেনোপজের সাপেক্ষে কখন এটি শুরু হচ্ছে এবং আপনার ব্যক্তিগত চিকিৎসা ইতিহাসের ওপর: কোনো সিদ্ধান্তের আগে ব্যক্তিগতভাবে চিকিৎসাগত মূল্যায়ন প্রয়োজন।',
    body3: 'এইচআরটি না চাইলে বা উপযুক্ত না হলে উপসর্গ কমাতে সাহায্য করার মতো অন্যান্য বিকল্প আছে:',
    nonHormonal: [
      'জ্ঞানীয় আচরণ থেরাপি (মানসিক চাপ ও ঘুম সামলাতে)',
      'ভেষজ চিকিৎসা, স্বাস্থ্যসেবা পেশাজীবীর তত্ত্বাবধানে',
      'জীবনযাত্রার সমন্বয় (খাবার, শারীরিক কার্যকলাপ, ঘুম)',
      'ঘনিষ্ঠ অংশের শুষ্কতার জন্য যোনিপথের লুব্রিকেন্ট ও ময়েশ্চারাইজার',
    ],
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'ভেষজ চিকিৎসার ক্ষেত্রেও পেশাদার পরামর্শ নেওয়া উচিত: “প্রাকৃতিক” মানে এই নয় যে অন্য ওষুধের সঙ্গে সম্ভাব্য মিথস্ক্রিয়া নেই।',
    body4: 'অ্যাপয়েন্টমেন্টের আগে কিছু বিষয় গুছিয়ে নিলে আলোচনা থেকে সর্বোচ্চ উপকার পেতে সুবিধা হয়:',
    discussPoints: [
      'দৈনন্দিন জীবনে আপনাকে সবচেয়ে বেশি কষ্ট দেওয়া উপসর্গ',
      'আপনার ব্যক্তিগত ও পারিবারিক চিকিৎসা ইতিহাস',
      'আপনার পছন্দ (হরমোনাল বা না, কত সময়ের জন্য ভাবছেন)',
      'আপনার প্রশ্ন ও দুশ্চিন্তা — সেগুলো জিজ্ঞাসা করতে দ্বিধা করবেন না',
    ],
    tip2Title: 'জেনে রাখা ভালো',
    tip2Text: 'হরমোনাল হোক বা না হোক, কোনো চিকিৎসাই সবার জন্য সমান নয়: আপনার জন্য কোনটি সঠিক তা নির্ভর করে আপনার ব্যক্তিগত অবস্থার ওপর, যা স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে মূল্যায়ন করা হয়।',
    shareMessage: 'মেনোপজের চিকিৎসা — AWA',
  },
  da: {
    badge: 'BEHANDLING',
    title: 'Behandling\nved menopause',
    metaDuration: '7 min læsning',
    metaType: 'Guide',
    metaLevel: 'Mellemniveau',
    metaValidated: 'Gennemset indhold',
    intro: 'Hormonbehandling og ikke-hormonelle alternativer – så du er klædt på til samtalen med din læge.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hormonbehandling ved menopause',
      'Fordele og forbehold',
      'Ikke-hormonelle metoder',
      'Samtalen med en sundhedsprofessionel',
      'Hvad du kan tage med dig',
    ],
    body1: 'Hormonbehandling ved menopause (HRT) supplerer østrogenmanglen og kan lindre de mest generende symptomer som hedeture, søvnforstyrrelser eller vaginal tørhed.',
    body2: 'HRT kan også hjælpe med at beskytte knogletætheden. Men det er ikke egnet til alle: visse sygdomshistorikker (hjertesygdom, visse hormonfølsomme kræftformer) kan begrænse brugen.',
    alertTitle: 'Bemærk',
    alertText: 'Afvejningen af fordele og risici ved HRT afhænger af din alder, hvornår du starter i forhold til menopausen, og din personlige sygehistorik: en individuel medicinsk vurdering er nødvendig, inden der træffes nogen beslutning.',
    body3: 'Hvis HRT ikke er ønsket eller egnet, findes der andre muligheder til at hjælpe med at lindre symptomerne:',
    nonHormonal: [
      'Kognitiv adfærdsterapi (til håndtering af stress og søvn)',
      'Fytoterapi under vejledning af en sundhedsprofessionel',
      'Livsstilsjusteringer (kost, fysisk aktivitet, søvn)',
      'Vaginale glideprodukter og fugtighedscremer til intimtørhed',
    ],
    tip1Title: 'Godt at vide',
    tip1Text: 'Selv ved fytoterapi er det klogt at søge professionel rådgivning: "naturlig" betyder ikke, at der ikke kan være interaktioner med andre lægemidler.',
    body4: 'At have styr på visse ting inden konsultationen gør det lettere at få mest muligt ud af samtalen:',
    discussPoints: [
      'De symptomer der generer dig mest i dagliglivet',
      'Din personlige og familiære sygehistorik',
      'Dine præferencer (hormonel eller ej, tidshorisont)',
      'Dine spørgsmål og bekymringer – tøv ikke med at stille dem',
    ],
    tip2Title: 'Godt at vide',
    tip2Text: 'Ingen behandling – hormonel eller ej – passer til alle: hvad der er rigtigt for dig afhænger af din individuelle situation, som vurderes sammen med en sundhedsprofessionel.',
    shareMessage: 'Behandling ved menopause — AWA',
  },
  sv: {
    badge: 'BEHANDLING',
    title: 'Behandling\nved menopause',
    metaDuration: '7 min läsning',
    metaType: 'Guide',
    metaLevel: 'Mellemniveau',
    metaValidated: 'Gennemset indhold',
    intro: 'Hormonbehandling och ikke-hormonelle alternativer – så du ar klädt på till samtalen med din läge.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hormonbehandling ved menopause',
      'Fordele och forbehold',
      'Ikke-hormonelle metoder',
      'Samtalen med en halsasprofessionel',
      'Hvad du kan tage med dig',
    ],
    body1: 'Hormonbehandling ved menopause (HRT) supplerer östrogenmanglen och kan lindre de mest generende symtom som hedeture, sövnforstyrrelser eller vaginal törhed.',
    body2: 'HRT kan også hjälpe med at beskytte knogletätheden. Men det ar inte egnet till alle: visse sygdomshistorikker (hjertesygdom, visse hormonfölsomme kräftformer) kan begränse brugen.',
    alertTitle: 'Bemärk',
    alertText: 'Afvejningen av fordele och risici ved HRT afhänger av din alder, hvornår du starter i forhold till menopausen, och din personlige sygehistorik: en individuel medicinsk vurdering ar nödvendig, inden der träffes nogen beslutning.',
    body3: 'Hvis HRT inte ar önsket eller egnet, findes der andre muligheder till at hjälpe med at lindre symtomne:',
    nonHormonal: [
      'Kognitiv adfärdsterapi (til håndtering av stress och sövn)',
      'Fytoterapi under vejledning av en halsasprofessionel',
      'Livsstilsjusteringer (kost, fysisk aktivitet, sövn)',
      'Vaginale glideprodukter och fugtighedscremer till intimtörhed',
    ],
    tip1Title: 'Godt at vide',
    tip1Text: 'Selv ved fytoterapi ar det klogt at söge professionel rådgivning: "naturlig" betyder inte, at der inte kan väre interaktioner med andre lägemidler.',
    body4: 'At have styr på visse ting inden konsultationen gör det lettere at få mest muligt ud av samtalen:',
    discussPoints: [
      'De symtom der generer dig mest i dagliglivet',
      'Din personlige och familiäre sygehistorik',
      'Dine präferencer (hormonel eller ej, tidshorisont)',
      'Dine spörgsmål och bekymringer – töv inte med at stille dem',
    ],
    tip2Title: 'Godt at vide',
    tip2Text: 'Ingen behandling – hormonel eller ej – passer till alle: hvad der ar rigtigt for dig afhänger av din individuelle situation, som vurderes sammen med en halsasprofessionel.',
    shareMessage: 'Behandling ved menopause — AWA',
  },
  nb: {
    badge: 'BEHANDLINGER',
    title: 'Behandlinger\ni menopausen',
    metaDuration: '7 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Middels',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Hormonbehandling og ikke-hormonelle alternativer, for å hjelpe deg å forberede samtalen med legen din.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hormonbehandling i menopausen',
      'Fordeler og forholdsregler',
      'Ikke-hormonelle tilnærminger',
      'Snakke med helsepersonell',
      'Det viktigste å huske',
    ],
    body1: 'Hormonbehandling i menopausen (HRT) kompenserer for fallet i østrogen og kan lindre de mest plagsomme symptomene, som hetetokter, søvnforstyrrelser eller vaginal tørrhet.',
    body2: 'HRT kan også bidra til å beskytte bentettheten. Den passer imidlertid ikke i alle situasjoner: en personlig sykehistorie med visse tilstander (hjerte- og karsykdom, noen hormonavhengige kreftformer) kan begrense bruken.',
    alertTitle: 'Merk',
    alertText: 'Balansen mellom fordeler og risiko ved HRT avhenger av alderen din, når den startes i forhold til menopausen og din personlige sykehistorie: en individuell medisinsk vurdering er nødvendig før enhver avgjørelse.',
    body3: 'Når HRT ikke ønskes eller ikke passer, finnes det andre alternativer som kan hjelpe med å lindre symptomer:',
    nonHormonal: [
      'Kognitiv atferdsterapi (for håndtering av stress og søvn)',
      'Urtemedisin, under tilsyn av helsepersonell',
      'Livsstilsjusteringer (kosthold, fysisk aktivitet, søvn)',
      'Glidemidler og fuktighetskremer for intim tørrhet',
    ],
    tip1Title: 'Godt å vite',
    tip1Text: 'Selv urtemedisin fortjener faglig råd: «naturlig» betyr ikke «uten mulige interaksjoner» med andre behandlinger.',
    body4: 'Å forberede noen punkter før en time hjelper deg å få mest mulig ut av samtalen:',
    discussPoints: [
      'De mest plagsomme symptomene dine i hverdagen',
      'Din personlige og familiære sykehistorie',
      'Dine preferanser (hormonelt eller ikke, hvor lenge du vurderer)',
      'Spørsmålene og bekymringene dine – ikke nøl med å stille dem',
    ],
    tip2Title: 'Godt å vite',
    tip2Text: 'Hormonelt eller ikke, ingen behandling er universell: det som passer deg, avhenger av din personlige situasjon, vurdert sammen med helsepersonell.',
    shareMessage: 'Behandlinger i menopausen – AWA',
  },
  pl: {
    badge: 'LECZENIE',
    title: 'Leczenie\nmenopauzy',
    metaDuration: '7 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Średnio zaawansowany',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Hormonalna terapia zastępcza i alternatywy niehormonalne, by przygotować się do rozmowy z lekarzem.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Menopauzalna hormonalna terapia zastępcza',
      'Korzyści i środki ostrożności',
      'Podejścia niehormonalne',
      'Rozmowa ze specjalistą',
      'Co zapamiętać',
    ],
    body1: 'Menopauzalna hormonalna terapia zastępcza (HTZ) uzupełnia spadek estrogenów i może łagodzić najbardziej uciążliwe objawy, takie jak uderzenia gorąca, zaburzenia snu czy suchość pochwy.',
    body2: 'HTZ może też pomagać chronić gęstość kości. Nie jest jednak odpowiednia w każdej sytuacji: osobista historia niektórych chorób (choroby sercowo-naczyniowe, niektóre nowotwory hormonozależne) może ograniczać jej stosowanie.',
    alertTitle: 'Zwróć uwagę',
    alertText: 'Bilans korzyści i ryzyka HTZ zależy od wieku, momentu rozpoczęcia terapii względem menopauzy oraz osobistej historii medycznej: przed podjęciem decyzji konieczna jest indywidualna ocena lekarska.',
    body3: 'Gdy HTZ nie jest pożądana lub nie jest odpowiednia, istnieją inne możliwości łagodzenia objawów:',
    nonHormonal: [
      'Terapia poznawczo-behawioralna (w radzeniu sobie ze stresem i snem)',
      'Fitoterapia, pod nadzorem specjalisty',
      'Zmiany stylu życia (dieta, aktywność fizyczna, sen)',
      'Nawilżacze i środki nawilżające dopochwowe na suchość intymną',
    ],
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Nawet fitoterapia wymaga porady specjalisty: „naturalne” nie oznacza „bez możliwych interakcji” z innymi lekami.',
    body4: 'Przygotowanie kilku punktów przed wizytą pomaga w pełni wykorzystać rozmowę:',
    discussPoints: [
      'Najbardziej uciążliwe codzienne objawy',
      'Twoja osobista i rodzinna historia medyczna',
      'Twoje preferencje (hormonalne lub nie, jak długo rozważasz leczenie)',
      'Twoje pytania i obawy — nie wahaj się ich zadawać',
    ],
    tip2Title: 'Warto wiedzieć',
    tip2Text: 'Hormonalne czy nie, żadne leczenie nie jest uniwersalne: to, co jest dla Ciebie właściwe, zależy od Twojej sytuacji osobistej, ocenionej ze specjalistą.',
    shareMessage: 'Leczenie menopauzy — AWA',
  },
  uk: {
    badge: 'ЛІКУВАННЯ',
    title: 'Лікування\nменопаузи',
    metaDuration: '7 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Середній',
    metaValidated: 'Перевірений вміст',
    intro: 'Замісна гормональна терапія та негормональні альтернативи, щоб підготуватися до розмови з лікарем.',
    contentsTitle: 'У цій статті',
    topics: [
      'Замісна гормональна терапія в менопаузі',
      'Переваги та застереження',
      'Негормональні підходи',
      'Розмова з медичним фахівцем',
      'Що запам’ятати',
    ],
    body1: 'Замісна гормональна терапія (ЗГТ) в менопаузі компенсує зниження естрогену й може полегшувати найбільш прикрі симптоми, як-от припливи, порушення сну чи сухість піхви.',
    body2: 'ЗГТ також може допомагати захищати щільність кісток. Проте вона підходить не в кожній ситуації: особиста історія певних захворювань (серцево-судинні хвороби, деякі гормонозалежні пухлини) може обмежувати її застосування.',
    alertTitle: 'Зверніть увагу',
    alertText: 'Співвідношення користі та ризику ЗГТ залежить від віку, моменту початку щодо менопаузи та вашої особистої медичної історії: перед будь-яким рішенням потрібна індивідуальна медична оцінка.',
    body3: 'Коли ЗГТ небажана або не підходить, існують інші варіанти полегшення симптомів:',
    nonHormonal: [
      'Когнітивно-поведінкова терапія (для подолання стресу та проблем зі сном)',
      'Фітотерапія під наглядом медичного фахівця',
      'Корекція способу життя (харчування, фізична активність, сон)',
      'Вагінальні змащувальні та зволожувальні засоби при інтимній сухості',
    ],
    tip1Title: 'Варто знати',
    tip1Text: 'Навіть фітотерапія потребує поради фахівця: «природне» не означає «без можливих взаємодій» з іншими ліками.',
    body4: 'Підготувавши кілька пунктів перед візитом, ви зможете краще використати розмову:',
    discussPoints: [
      'Ваші найприкріші щоденні симптоми',
      'Ваша особиста та сімейна медична історія',
      'Ваші вподобання (гормональне чи ні, на який термін ви розглядаєте лікування)',
      'Ваші запитання й побоювання — не вагайтеся їх ставити',
    ],
    tip2Title: 'Варто знати',
    tip2Text: 'Гормональне чи ні, жодне лікування не є універсальним: те, що підходить вам, залежить від вашої особистої ситуації, оціненої разом із фахівцем.',
    shareMessage: 'Лікування менопаузи — AWA',
  },
  cs: {
    badge: 'LÉČBA',
    title: 'Léčba\nmenopauzy',
    metaDuration: '7 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Pokročilý',
    metaValidated: 'Ověřený obsah',
    intro: 'Hormonální substituční terapie a nehormonální alternativy, které vám pomohou připravit se na rozhovor s lékařem.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Hormonální substituční terapie v menopauze',
      'Přínosy a opatření',
      'Nehormonální přístupy',
      'Rozhovor se zdravotnickým pracovníkem',
      'Co si zapamatovat',
    ],
    body1: 'Hormonální substituční terapie (HRT) v menopauze nahrazuje pokles estrogenu a může zmírnit nejobtěžující příznaky, jako jsou návaly horka, poruchy spánku nebo suchost pochvy.',
    body2: 'HRT může také pomáhat chránit hustotu kostí. Není však vhodná pro každou situaci: osobní anamnéza některých onemocnění (kardiovaskulární onemocnění, některé hormonálně závislé nádory) může její použití omezovat.',
    alertTitle: 'Upozornění',
    alertText: 'Poměr přínosů a rizik HRT závisí na vašem věku, na tom, kdy se zahájí vzhledem k menopauze, a na vaší osobní zdravotní anamnéze: před jakýmkoli rozhodnutím je třeba individuální lékařské posouzení.',
    body3: 'Pokud HRT nechcete nebo není vhodná, existují jiné možnosti, jak zmírnit příznaky:',
    nonHormonal: [
      'Kognitivně-behaviorální terapie (pro zvládání stresu a spánku)',
      'Bylinná léčba pod dohledem zdravotnického pracovníka',
      'Úpravy životního stylu (strava, fyzická aktivita, spánek)',
      'Vaginální lubrikanty a hydratační přípravky při intimní suchosti',
    ],
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'I bylinná léčba si zaslouží odbornou radu: „přírodní“ neznamená „bez možných interakcí“ s jinou léčbou.',
    body4: 'Příprava několika bodů před návštěvou vám pomůže z rozhovoru vytěžit co nejvíc:',
    discussPoints: [
      'Vaše nejobtěžující každodenní příznaky',
      'Vaše osobní a rodinná zdravotní anamnéza',
      'Vaše preference (hormonální, či ne, jak dlouho uvažujete)',
      'Vaše otázky a obavy — neváhejte se ptát',
    ],
    tip2Title: 'Stojí za to vědět',
    tip2Text: 'Hormonální, či ne, žádná léčba není univerzální: to, co vám vyhovuje, závisí na vaší osobní situaci, posouzené společně se zdravotnickým pracovníkem.',
    shareMessage: 'Léčba menopauzy — AWA',
  },
  sk: {
    badge: 'LIEČBY',
    title: 'Liečby\nmenopauzy',
    metaDuration: '7 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Stredne pokročilý',
    metaValidated: 'Overený obsah',
    intro: 'Hormonálna substitučná liečba a nehormonálne alternatívy, ktoré vám pomôžu pripraviť sa na rozhovor s lekárom.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Hormonálna substitučná liečba v menopauze',
      'Prínosy a opatrnosť',
      'Nehormonálne prístupy',
      'Rozhovor so zdravotníckym pracovníkom',
      'Čo si zapamätať',
    ],
    body1: 'Hormonálna substitučná liečba (HSL) v menopauze nahrádza pokles estrogénu a môže zmierniť najobťažujúcejšie príznaky, ako sú vlny horúčavy, poruchy spánku alebo vaginálna suchosť.',
    body2: 'HSL môže tiež pomôcť chrániť hustotu kostí. Nehodí sa však pre každú situáciu: osobná anamnéza niektorých ochorení (kardiovaskulárne ochorenia, niektoré hormonálne závislé nádory) môže jej použitie obmedziť.',
    alertTitle: 'Upozornenie',
    alertText: 'Pomer prínosov a rizík HSL závisí od vášho veku, od času začatia vzhľadom na menopauzu a od vašej osobnej zdravotnej anamnézy: pred každým rozhodnutím je potrebné individualizované lekárske posúdenie.',
    body3: 'Keď HSL nie je žiaduca alebo nie je vhodná, existujú iné možnosti na zmiernenie príznakov:',
    nonHormonal: [
      'Kognitívno-behaviorálna terapia (na zvládanie stresu a spánku)',
      'Bylinná medicína pod dohľadom zdravotníckeho pracovníka',
      'Úpravy životného štýlu (strava, fyzická aktivita, spánok)',
      'Vaginálne lubrikanty a hydratačné prípravky pri intímnej suchosti',
    ],
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Aj bylinná medicína si zaslúži odbornú radu: „prírodné“ neznamená „bez možných interakcií“ s inými liečbami.',
    body4: 'Príprava niekoľkých bodov pred návštevou vám pomôže lepšie využiť rozhovor:',
    discussPoints: [
      'Vaše najobťažujúcejšie každodenné príznaky',
      'Vaša osobná a rodinná zdravotná anamnéza',
      'Vaše preferencie (hormonálna alebo nie, ako dlho o nej uvažujete)',
      'Vaše otázky a obavy — neváhajte sa ich pýtať',
    ],
    tip2Title: 'Stojí za to vedieť',
    tip2Text: 'Hormonálna či nie, žiadna liečba nie je univerzálna: čo je vhodné pre vás, závisí od vašej osobnej situácie, posúdenej so zdravotníckym pracovníkom.',
    shareMessage: 'Liečby menopauzy — AWA',
  },
  hu: {
    badge: 'KEZELÉSEK',
    title: 'A menopauza\nkezelései',
    metaDuration: '7 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Középhaladó',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Hormonpótló terápia és nem hormonális alternatívák, hogy felkészülhess az orvosoddal folytatott beszélgetésre.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Menopauza utáni hormonpótló terápia',
      'Előnyök és óvintézkedések',
      'Nem hormonális megközelítések',
      'Beszélgetés egy egészségügyi szakemberrel',
      'Amit érdemes megjegyezni',
    ],
    body1: 'A menopauza utáni hormonpótló terápia (HPT) pótolja az ösztrogén csökkenését, és enyhítheti a legzavaróbb tüneteket, például a hőhullámokat, az alvászavarokat vagy a hüvelyszárazságot.',
    body2: 'A HPT a csontsűrűség védelmében is segíthet. Nem minden helyzetben alkalmas azonban: bizonyos betegségek (szív- és érrendszeri betegségek, egyes hormonfüggő daganatok) a személyes anamnézisben korlátozhatják a használatát.',
    alertTitle: 'Figyelem',
    alertText: 'A HPT előny-kockázat egyensúlya az életkorodtól, a menopauzához viszonyított megkezdési időponttól és a személyes orvosi előzményeidtől függ: bármilyen döntés előtt egyéni orvosi értékelés szükséges.',
    body3: 'Amikor a HPT nem kívánatos vagy nem megfelelő, más lehetőségek is léteznek a tünetek enyhítésére:',
    nonHormonal: [
      'Kognitív viselkedésterápia (a stressz és az alvás kezelésére)',
      'Gyógynövényes orvoslás, egészségügyi szakember felügyelete mellett',
      'Életmódbeli módosítások (étrend, testmozgás, alvás)',
      'Hüvelyi síkosítók és hidratálók intim szárazság esetén',
    ],
    tip1Title: 'Érdemes tudni',
    tip1Text: 'A gyógynövényes orvoslás is szakmai tanácsot érdemel: a „természetes” nem jelenti azt, hogy „más kezelésekkel való lehetséges kölcsönhatások nélkül”.',
    body4: 'Néhány pont előzetes átgondolása segít a legtöbbet kihozni az időpontból:',
    discussPoints: [
      'A mindennapokban legzavaróbb tüneteid',
      'A személyes és családi orvosi előzményeid',
      'A preferenciáid (hormonális vagy nem, mennyi ideig gondolkodsz róla)',
      'A kérdéseid és aggodalmaid — ne habozz feltenni őket',
    ],
    tip2Title: 'Érdemes tudni',
    tip2Text: 'Hormonális vagy nem, egyetlen kezelés sem univerzális: az, ami neked megfelel, a személyes helyzetedtől függ, egészségügyi szakemberrel értékelve.',
    shareMessage: 'A menopauza kezelései — AWA',
  },
  ro: {
    badge: 'TRATAMENTE',
    title: 'Tratamentele\nmenopauzei',
    metaDuration: '7 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Intermediar',
    metaValidated: 'Conținut revizuit',
    intro: 'Terapia de substituție hormonală și alternativele nehormonale, pentru a te ajuta să pregătești discuția cu medicul tău.',
    contentsTitle: 'În acest articol',
    topics: [
      'Terapia de substituție hormonală în menopauză',
      'Beneficii și precauții',
      'Abordări nehormonale',
      'Discuția cu un profesionist din domeniul sănătății',
      'Ce să reții',
    ],
    body1: 'Terapia de substituție hormonală în menopauză (THS) compensează scăderea estrogenului și poate ameliora cele mai deranjante simptome, precum bufeurile, tulburările de somn sau uscăciunea vaginală.',
    body2: 'THS poate ajuta și la protejarea densității osoase. Totuși, nu este potrivită în orice situație: antecedentele personale de anumite afecțiuni (boli cardiovasculare, unele cancere hormono-dependente) îi pot limita folosirea.',
    alertTitle: 'Atenție',
    alertText: 'Echilibrul beneficiu-risc al THS depinde de vârsta ta, de momentul în care este începută față de menopauză și de istoricul tău medical personal: este necesară o evaluare medicală individualizată înainte de orice decizie.',
    body3: 'Când THS nu este dorită sau nu este potrivită, există alte opțiuni care pot ajuta la ameliorarea simptomelor:',
    nonHormonal: [
      'Terapia cognitiv-comportamentală (pentru gestionarea stresului și a somnului)',
      'Fitoterapia, supravegheată de un profesionist din domeniul sănătății',
      'Ajustări ale stilului de viață (alimentație, activitate fizică, somn)',
      'Lubrifianți și hidratante vaginale pentru uscăciunea intimă',
    ],
    tip1Title: 'Bine de știut',
    tip1Text: 'Chiar și fitoterapia merită un sfat profesionist: „natural” nu înseamnă „fără posibile interacțiuni” cu alte tratamente.',
    body4: 'Pregătirea câtorva puncte înainte de o consultație te ajută să profiți la maximum de discuție:',
    discussPoints: [
      'Simptomele tale cele mai deranjante din viața de zi cu zi',
      'Istoricul tău medical personal și familial',
      'Preferințele tale (hormonal sau nu, cât timp te gândești să urmezi tratamentul)',
      'Întrebările și îngrijorările tale — nu ezita să le pui',
    ],
    tip2Title: 'Bine de știut',
    tip2Text: 'Hormonal sau nu, niciun tratament nu este universal: ceea ce ți se potrivește depinde de situația ta personală, evaluată împreună cu un profesionist din domeniul sănătății.',
    shareMessage: 'Tratamentele menopauzei — AWA',
  },
  bg: {
    badge: 'ЛЕЧЕНИЯ',
    title: 'Лечения на\nменопаузата',
    metaDuration: '7 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Средно ниво',
    metaValidated: 'Проверено съдържание',
    intro: 'Хормонално заместителна терапия и нехормонални алтернативи, за да ти помогнат да подготвиш разговора с лекаря си.',
    contentsTitle: 'В тази статия',
    topics: [
      'Хормонално заместителна терапия при менопауза',
      'Ползи и предпазни мерки',
      'Нехормонални подходи',
      'Разговор със здравен специалист',
      'Какво да запомниш',
    ],
    body1: 'Хормонално заместителната терапия (ХЗТ) при менопауза компенсира спада на естрогена и може да облекчи най-неприятните симптоми, като горещи вълни, нарушения на съня или вагинална сухота.',
    body2: 'ХЗТ може да помогне и за защитата на костната плътност. Въпреки това тя не е подходяща за всяка ситуация: лична анамнеза за някои състояния (сърдечно-съдови заболявания, някои хормонозависими ракови заболявания) може да ограничи употребата ѝ.',
    alertTitle: 'Обърни внимание',
    alertText: 'Балансът полза-риск на ХЗТ зависи от възрастта ти, от момента на започването ѝ спрямо менопаузата и от личната ти медицинска история: необходима е индивидуализирана медицинска оценка преди всяко решение.',
    body3: 'Когато ХЗТ не е желана или не е подходяща, съществуват други възможности, които да помогнат за облекчаване на симптомите:',
    nonHormonal: [
      'Когнитивно-поведенческа терапия (за овладяване на стреса и съня)',
      'Билколечение, под наблюдението на здравен специалист',
      'Корекции в начина на живот (хранене, физическа активност, сън)',
      'Лубриканти и вагинални хидратанти при интимна сухота',
    ],
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Дори билколечението заслужава професионален съвет: „естествено“ не означава „без възможни взаимодействия“ с други лечения.',
    body4: 'Подготовката на няколко точки преди консултация ти помага да извлечеш максимума от разговора:',
    discussPoints: [
      'Най-неприятните ти ежедневни симптоми',
      'Личната и семейната ти медицинска история',
      'Предпочитанията ти (хормонално или не, колко дълго обмисляш да го следваш)',
      'Въпросите и притесненията ти — не се колебай да ги зададеш',
    ],
    tip2Title: 'Добре е да знаеш',
    tip2Text: 'Хормонално или не, никое лечение не е универсално: онова, което ти подхожда, зависи от личната ти ситуация, оценена със здравен специалист.',
    shareMessage: 'Лечения на менопаузата — AWA',
  },
  sr: {
    badge: 'ТЕРАПИЈЕ',
    title: 'Терапије\nменопаузе',
    metaDuration: '7 мин читања',
    metaType: 'Водич',
    metaLevel: 'Средњи ниво',
    metaValidated: 'Проверен садржај',
    intro: 'Хормонска надокнадна терапија и нехормонске алтернативе, да ти помогну да се припремиш за разговор са лекаром.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Хормонска надокнадна терапија у менопаузи',
      'Предности и мере предострожности',
      'Нехормонски приступи',
      'Разговор са здравственим радником',
      'Шта да запамтиш',
    ],
    body1: 'Хормонска надокнадна терапија (ХНТ) у менопаузи надокнађује пад естрогена и може ублажити најнепријатније симптоме, као што су таласи врућине, поремећаји сна или вагинална сувоћа.',
    body2: 'ХНТ може помоћи и у заштити густине костију. Међутим, није погодна за сваку ситуацију: лична историја одређених стања (кардиоваскуларне болести, неки хормонски зависни карциноми) може ограничити њену употребу.',
    alertTitle: 'Обрати пажњу',
    alertText: 'Однос користи и ризика ХНТ зависи од твојих година, од тога када је започета у односу на менопаузу и од твоје личне медицинске историје: потребна је индивидуализована медицинска процена пре сваке одлуке.',
    body3: 'Када ХНТ није жељена или није прикладна, постоје друге опције које помажу у ублажавању симптома:',
    nonHormonal: [
      'Когнитивно-бихејвиорална терапија (за управљање стресом и сном)',
      'Биљна медицина, под надзором здравственог радника',
      'Прилагођавања начина живота (исхрана, физичка активност, сан)',
      'Вагинални лубриканти и хидратанти за интимну сувоћу',
    ],
    tip1Title: 'Добро је знати',
    tip1Text: 'Чак и биљна медицина заслужује стручни савет: „природно“ не значи „без могућих интеракција“ са другим терапијама.',
    body4: 'Припрема неколико тачака пре прегледа помаже ти да извучеш максимум из разговора:',
    discussPoints: [
      'Твоји најнепријатнији свакодневни симптоми',
      'Твоја лична и породична медицинска историја',
      'Твоје жеље (хормонски или не, колико дуго размишљаш да је пратиш)',
      'Твоја питања и бриге — не оклевај да их поставиш',
    ],
    tip2Title: 'Добро је знати',
    tip2Text: 'Хормонска или не, ниједна терапија није универзална: оно што теби одговара зависи од твоје личне ситуације, процењене са здравственим радником.',
    shareMessage: 'Терапије менопаузе — AWA',
  },
  hr: {
    badge: 'TERAPIJE',
    title: 'Terapije\nu menopauzi',
    metaDuration: '7 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Hormonska nadomjesna terapija i nehormonske alternative, kao priprema za razgovor s liječnikom.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Hormonska nadomjesna terapija u menopauzi',
      'Prednosti i mjere opreza',
      'Nehormonski pristupi',
      'Razgovor sa zdravstvenim djelatnikom',
      'Što zapamtiti',
    ],
    body1: 'Hormonska nadomjesna terapija (HNT) u menopauzi nadoknađuje pad estrogena i može ublažiti najsmetajuće simptome, poput valova vrućine, poremećaja spavanja ili suhoće rodnice.',
    body2: 'HNT može pomoći i u zaštiti gustoće kostiju. Međutim, nije prikladna za svaku situaciju: osobna povijest određenih stanja (kardiovaskularne bolesti, neki hormonski ovisni karcinomi) može ograničiti njezinu uporabu.',
    alertTitle: 'Napomena',
    alertText: 'Omjer koristi i rizika HNT-a ovisi o tvojoj dobi, trenutku početka u odnosu na menopauzu i tvojoj osobnoj medicinskoj anamnezi: prije svake odluke potrebna je individualizirana liječnička procjena.',
    body3: 'Kad se HNT ne želi ili nije prikladna, postoje druge mogućnosti za ublažavanje simptoma:',
    nonHormonal: [
      'Kognitivno-bihevioralna terapija (za upravljanje stresom i snom)',
      'Fitoterapija, pod nadzorom zdravstvenog djelatnika',
      'Prilagodbe načina života (prehrana, tjelesna aktivnost, san)',
      'Vaginalni lubrikanti i hidratanti za intimnu suhoću',
    ],
    tip1Title: 'Dobro je znati',
    tip1Text: 'Čak i fitoterapija zaslužuje stručni savjet: „prirodno“ ne znači „bez mogućih interakcija“ s drugim terapijama.',
    body4: 'Priprema nekoliko točaka prije pregleda pomaže ti da maksimalno iskoristiš razgovor:',
    discussPoints: [
      'Tvoji najsmetajući simptomi u svakodnevici',
      'Tvoja osobna i obiteljska medicinska anamneza',
      'Tvoje želje (hormonski ili ne, koliko dugo razmišljaš)',
      'Tvoja pitanja i zabrinutosti — ne oklijevaj ih postaviti',
    ],
    tip2Title: 'Dobro je znati',
    tip2Text: 'Hormonska ili ne, nijedna terapija nije univerzalna: ono što je pravo za tebe ovisi o tvojoj osobnoj situaciji, procijenjenoj sa zdravstvenim djelatnikom.',
    shareMessage: 'Terapije u menopauzi — AWA',
  },
  bs: {
    badge: 'TERAPIJE',
    title: 'Terapije\nu menopauzi',
    metaDuration: '7 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Hormonska nadomjesna terapija i nehormonske alternative, kao priprema za razgovor s ljekarom.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Hormonska nadomjesna terapija u menopauzi',
      'Prednosti i mjere opreza',
      'Nehormonski pristupi',
      'Razgovor sa zdravstvenim radnikom',
      'Što zapamtiti',
    ],
    body1: 'Hormonska nadomjesna terapija (HNT) u menopauzi nadoknađuje pad estrogena i može ublažiti najsmetajuće simptome, poput valova vrućine, poremećaja spavanja ili suhoće rodnice.',
    body2: 'HNT može pomoći i u zaštiti gustoće kostiju. Međutim, nije prikladna za svaku situaciju: osobna povijest određenih stanja (kardiovaskularne bolesti, neki hormonski ovisni karcinomi) može ograničiti njezinu uporabu.',
    alertTitle: 'Napomena',
    alertText: 'Omjer koristi i rizika HNT-a ovisi o tvojoj dobi, trenutku početka u odnosu na menopauzu i tvojoj osobnoj medicinskoj anamnezi: prije svake odluke potrebna je individualizirana ljekarska procjena.',
    body3: 'Kad se HNT ne želi ili nije prikladna, postoje druge mogućnosti za ublažavanje simptoma:',
    nonHormonal: [
      'Kognitivno-bihevioralna terapija (za upravljanje stresom i snom)',
      'Fitoterapija, pod nadzorom zdravstvenog radnika',
      'Prilagodbe načina života (ishrana, tjelesna aktivnost, san)',
      'Vaginalni lubrikanti i hidratanti za intimnu suhoću',
    ],
    tip1Title: 'Dobro je znati',
    tip1Text: 'Čak i fitoterapija zaslužuje stručni savjet: „prirodno“ ne znači „bez mogućih interakcija“ s drugim terapijama.',
    body4: 'Priprema nekoliko točaka prije pregleda pomaže ti da maksimalno iskoristiš razgovor:',
    discussPoints: [
      'Tvoji najsmetajući simptomi u svakodnevici',
      'Tvoja osobna i obiteljska medicinska anamneza',
      'Tvoje želje (hormonski ili ne, koliko dugo razmišljaš)',
      'Tvoja pitanja i zabrinutosti — ne oklijevaj ih postaviti',
    ],
    tip2Title: 'Dobro je znati',
    tip2Text: 'Hormonska ili ne, nijedna terapija nije univerzalna: ono što je pravo za tebe ovisi o tvojoj osobnoj situaciji, procijenjenoj sa zdravstvenim radnikom.',
    shareMessage: 'Terapije u menopauzi — AWA',
  },
  sl: {
    badge: 'ZDRAVLJENJA',
    title: 'Zdravljenja\nv menopavzi',
    metaDuration: '7 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Srednja raven',
    metaValidated: 'Preverjena vsebina',
    intro: 'Hormonsko nadomestno zdravljenje in nehormonske alternative, kot priprava na pogovor z zdravnikom.',
    contentsTitle: 'V tem članku',
    topics: [
      'Hormonsko nadomestno zdravljenje v menopavzi',
      'Prednosti in previdnostni ukrepi',
      'Nehormonski pristopi',
      'Pogovor z zdravstvenim delavcem',
      'Kaj si zapomniti',
    ],
    body1: 'Hormonsko nadomestno zdravljenje (HNZ) v menopavzi nadomešča padec estrogena in lahko omili najbolj moteče simptome, kot so vročinski valovi, motnje spanja ali suhost nožnice.',
    body2: 'HNZ lahko pomaga tudi pri zaščiti gostote kosti. Vendar ni primerno za vsako situacijo: osebna zgodovina nekaterih stanj (srčno-žilne bolezni, nekateri hormonsko odvisni raki) lahko omeji njegovo uporabo.',
    alertTitle: 'Opomba',
    alertText: 'Razmerje med koristjo in tveganjem HNZ je odvisno od tvoje starosti, trenutka začetka glede na menopavzo in tvoje osebne zdravstvene anamneze: pred vsako odločitvijo je potrebna individualizirana zdravniška ocena.',
    body3: 'Kadar se HNZ ne želi ali ni primerno, obstajajo druge možnosti za lajšanje simptomov:',
    nonHormonal: [
      'Kognitivno-vedenjska terapija (za obvladovanje stresa in spanja)',
      'Zeliščna medicina, pod nadzorom zdravstvenega delavca',
      'Prilagoditve življenjskega sloga (prehrana, telesna dejavnost, spanje)',
      'Vaginalni lubrikanti in vlažilci za intimno suhost',
    ],
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Tudi zeliščna medicina si zasluži strokovni nasvet: „naravno“ ne pomeni „brez možnih interakcij“ z drugimi zdravljenji.',
    body4: 'Priprava nekaj točk pred pregledom ti pomaga kar najbolje izkoristiti pogovor:',
    discussPoints: [
      'Tvoji najbolj moteči simptomi v vsakdanu',
      'Tvoja osebna in družinska zdravstvena anamneza',
      'Tvoje želje (hormonsko ali ne, kako dolgo razmišljaš)',
      'Tvoja vprašanja in skrbi — ne oklevaj jih postaviti',
    ],
    tip2Title: 'Vredno vedeti',
    tip2Text: 'Hormonsko ali ne, nobeno zdravljenje ni univerzalno: kar je pravo zate, je odvisno od tvoje osebne situacije, ocenjene z zdravstvenim delavcem.',
    shareMessage: 'Zdravljenja v menopavzi — AWA',
  },
  ne: {
    badge: 'उपचारहरू',
    title: 'रजोनिवृत्तिका\nउपचारहरू',
    metaDuration: '7 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'हर्मोन प्रतिस्थापन थेरापी र गैर-हर्मोनल विकल्पहरू, चिकित्सकसँगको कुराकानीको तयारी गर्न मद्दत गर्न।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'रजोनिवृत्तिको हर्मोन प्रतिस्थापन थेरापी',
      'फाइदा र सावधानीहरू',
      'गैर-हर्मोनल दृष्टिकोणहरू',
      'स्वास्थ्यकर्मीसँग कुरा गर्ने',
      'सम्झनुपर्ने कुराहरू',
    ],
    body1: 'रजोनिवृत्तिको हर्मोन प्रतिस्थापन थेरापी (HRT) ले एस्ट्रोजेनको घटाइलाई सन्तुलन गर्छ र तातो हुने (हट फ्ल्यास), निद्राका समस्या वा योनि सुक्खापन जस्ता सबैभन्दा असहज लक्षणहरू कम गर्न सक्छ।',
    body2: 'HRT ले हड्डीको घनत्व जोगाउन पनि मद्दत गर्न सक्छ। तथापि, यो हरेक अवस्थाका लागि उपयुक्त हुँदैन: केही अवस्थाहरू (हृदय-रक्तनली रोग, केही हर्मोन-निर्भर क्यान्सर) को व्यक्तिगत इतिहासले यसको प्रयोग सीमित गर्न सक्छ।',
    alertTitle: 'कृपया ध्यान दिनुहोस्',
    alertText: 'HRT को फाइदा-जोखिमको सन्तुलन तपाईंको उमेर, रजोनिवृत्तिको तुलनामा यो कहिले सुरु गरिन्छ, र तपाईंको व्यक्तिगत चिकित्सकीय इतिहासमा निर्भर गर्छ: कुनै निर्णयअघि व्यक्तिगत चिकित्सकीय मूल्याङ्कन आवश्यक छ।',
    body3: 'HRT नचाहिएमा वा उपयुक्त नभएमा, लक्षणहरू कम गर्न मद्दत गर्ने अन्य विकल्पहरू छन्:',
    nonHormonal: [
      'संज्ञानात्मक व्यवहार थेरापी (तनाव र निद्रा व्यवस्थापनका लागि)',
      'स्वास्थ्यकर्मीको निगरानीमा जडीबुटी चिकित्सा',
      'जीवनशैलीमा समायोजन (खानपान, शारीरिक गतिविधि, निद्रा)',
      'निजी सुक्खापनका लागि योनि ल्युब्रिकेन्ट र मोइस्चराइजर',
    ],
    tip1Title: 'जान्न लायक',
    tip1Text: 'जडीबुटी चिकित्साले पनि व्यावसायिक सल्लाह चाहिन्छ: “प्राकृतिक” को अर्थ अन्य उपचारहरूसँग “सम्भावित अन्तरक्रियाबिना” भन्ने होइन।',
    body4: 'भेटघाटअघि केही बुँदाहरू तयार गर्दा कुराकानीबाट अधिकतम लाभ लिन मद्दत मिल्छ:',
    discussPoints: [
      'दैनिक जीवनमा तपाईंलाई सबैभन्दा असहज लक्षणहरू',
      'तपाईंको व्यक्तिगत र पारिवारिक चिकित्सकीय इतिहास',
      'तपाईंका रुचिहरू (हर्मोनल वा होइन, कति समयका लागि विचार गर्दै हुनुहुन्छ)',
      'तपाईंका प्रश्न र चिन्ताहरू — तिनलाई सोध्न नहिच्किचाउनुहोस्',
    ],
    tip2Title: 'जान्न लायक',
    tip2Text: 'हर्मोनल होस् वा होइन, कुनै उपचार सार्वभौम हुँदैन: तपाईंलाई के मिल्छ त्यो स्वास्थ्यकर्मीसँग मूल्याङ्कन गरिएको तपाईंको व्यक्तिगत अवस्थामा निर्भर गर्छ।',
    shareMessage: 'रजोनिवृत्तिका उपचारहरू — AWA',
  },
  si: {
    badge: 'ප්‍රතිකාර',
    title: 'ඔසප් නැවතීමේ\nප්‍රතිකාර',
    metaDuration: 'කියවීමට මිනිත්තු 7',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'මධ්‍යම',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඔබේ වෛද්‍යවරයා සමඟ සංවාදයට සූදානම් වීමට ඔබට උදව් කිරීමට, හෝමෝන ආදේශක ප්‍රතිකාරය සහ හෝමෝන නොවන විකල්ප.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'ඔසප් නැවතීමේ හෝමෝන ආදේශක ප්‍රතිකාරය',
      'ප්‍රතිලාභ සහ පූර්වාරක්ෂාවන්',
      'හෝමෝන නොවන ප්‍රවේශ',
      'සෞඛ්‍ය වෘත්තිකයෙකු සමඟ කතා කිරීම',
      'මතක තබාගත යුතු දේ',
    ],
    body1: 'ඔසප් නැවතීමේ හෝමෝන ආදේශක ප්‍රතිකාරය (HRT) එස්ට්‍රජන් පහත වැටීම පියවන අතර උණුසුම් රැළි, නින්ද කැළඹීම් හෝ යෝනි වියළීම වැනි වඩාත්ම කරදර සහගත රෝග ලක්ෂණ සමනය කළ හැක.',
    body2: 'HRT අස්ථි ඝනත්වය ආරක්ෂා කිරීමටද උපකාරී විය හැක. කෙසේ වෙතත්, එය සෑම තත්ත්වයකටම සුදුසු නොවේ: සමහර තත්ත්වයන්ගේ (හෘද වාහිනී රෝග, සමහර හෝමෝන-රඳා පවතින පිළිකා) පෞද්ගලික ඉතිහාසයක් එහි භාවිතය සීමා කළ හැක.',
    alertTitle: 'කරුණාකර සටහන් කරන්න',
    alertText: 'HRT හි ප්‍රතිලාභ-අවදානම් සමතුලිතතාව රඳා පවතින්නේ ඔබේ වයස, ඔසප් නැවතීමට සාපේක්ෂව එය ආරම්භ කරන වේලාව සහ ඔබේ පෞද්ගලික වෛද්‍ය ඉතිහාසය මතය: ඕනෑම තීරණයකට පෙර පුද්ගලීකරණය කළ වෛද්‍ය තක්සේරුවක් අවශ්‍යයි.',
    body3: 'HRT අවශ්‍ය නොවන විට හෝ සුදුසු නොවන විට, රෝග ලක්ෂණ සමනය කිරීමට උපකාරී වන වෙනත් විකල්ප ඇත:',
    nonHormonal: [
      'සංජානන චර්යා චිකිත්සාව (ආතතිය සහ නින්ද කළමනාකරණය සඳහා)',
      'සෞඛ්‍ය වෘත්තිකයෙකුගේ අධීක්ෂණය යටතේ ඖෂධීය පැළෑටි ප්‍රතිකාර',
      'ජීවන රටා සකස් කිරීම් (ආහාර, ශාරීරික ක්‍රියාකාරකම, නින්ද)',
      'සමීප වියළීම සඳහා යෝනි ලිහිසි ද්‍රව්‍ය සහ තෙතමනය ද්‍රව්‍ය',
    ],
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'ඖෂධීය පැළෑටි ප්‍රතිකාරයටත් වෘත්තීය උපදෙස් සුදුසුයි: “ස්වාභාවික” යනු අනෙක් ප්‍රතිකාර සමඟ “ඇතිවිය හැකි අන්තර්ක්‍රියා නොමැතිව” යන්න අදහස් නොවේ.',
    body4: 'හමුවීමකට පෙර කරුණු කිහිපයක් සූදානම් කිරීම සංවාදයෙන් උපරිම ප්‍රයෝජන ගැනීමට ඔබට උපකාරී වේ:',
    discussPoints: [
      'ඔබේ වඩාත්ම කරදර සහගත එදිනෙදා රෝග ලක්ෂණ',
      'ඔබේ පෞද්ගලික සහ පවුලේ වෛද්‍ය ඉතිහාසය',
      'ඔබේ මනාප (හෝමෝන හෝ නොවන, ඔබ සලකා බලන කාලය)',
      'ඔබේ ප්‍රශ්න සහ කනස්සල්ල — ඒවා අසන්නට මැළි නොවන්න',
    ],
    tip2Title: 'දැනගත යුතු දේ',
    tip2Text: 'හෝමෝන හෝ නොවන, කිසිදු ප්‍රතිකාරයක් විශ්වීය නොවේ: ඔබට ගැළපෙන දේ රඳා පවතින්නේ සෞඛ්‍ය වෘත්තිකයෙකු සමඟ තක්සේරු කළ ඔබේ පෞද්ගලික තත්ත්වය මතය.',
    shareMessage: 'ඔසප් නැවතීමේ ප්‍රතිකාර — AWA',
  },
  th: {
    badge: 'การรักษา',
    title: 'การรักษา\nในวัยหมดประจำเดือน',
    metaDuration: 'อ่าน 7 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'ปานกลาง',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'การบำบัดทดแทนด้วยฮอร์โมนและทางเลือกที่ไม่ใช่ฮอร์โมน เพื่อช่วยให้คุณเตรียมตัวพูดคุยกับแพทย์',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'การบำบัดทดแทนด้วยฮอร์โมนในวัยหมดประจำเดือน',
      'ประโยชน์และข้อควรระวัง',
      'แนวทางที่ไม่ใช้ฮอร์โมน',
      'การพูดคุยกับบุคลากรทางการแพทย์',
      'สิ่งที่ควรจำ',
    ],
    body1: 'การบำบัดทดแทนด้วยฮอร์โมนในวัยหมดประจำเดือน (HRT) ชดเชยการลดลงของเอสโตรเจนและบรรเทาอาการที่รบกวนที่สุด เช่น อาการร้อนวูบวาบ ปัญหาการนอนหลับ หรือช่องคลอดแห้ง',
    body2: 'HRT ยังช่วยปกป้องความหนาแน่นของกระดูกได้ อย่างไรก็ตาม ไม่เหมาะกับทุกสถานการณ์: ประวัติส่วนตัวของโรคบางอย่าง (โรคหัวใจและหลอดเลือด มะเร็งบางชนิดที่ขึ้นกับฮอร์โมน) อาจจำกัดการใช้',
    alertTitle: 'โปรดทราบ',
    alertText: 'ความสมดุลระหว่างประโยชน์และความเสี่ยงของ HRT ขึ้นอยู่กับอายุ เวลาที่เริ่มเมื่อเทียบกับวัยหมดประจำเดือน และประวัติทางการแพทย์ส่วนตัวของคุณ: ต้องมีการประเมินทางการแพทย์เฉพาะบุคคลก่อนการตัดสินใจใด ๆ',
    body3: 'เมื่อไม่ต้องการหรือไม่เหมาะกับ HRT มีทางเลือกอื่นที่ช่วยบรรเทาอาการได้:',
    nonHormonal: [
      'การบำบัดทางความคิดและพฤติกรรม (เพื่อจัดการความเครียดและการนอน)',
      'การใช้สมุนไพร ภายใต้การดูแลของบุคลากรทางการแพทย์',
      'การปรับวิถีชีวิต (อาหาร กิจกรรมทางกาย การนอน)',
      'สารหล่อลื่นและครีมให้ความชุ่มชื้นช่องคลอดสำหรับความแห้งในจุดซ่อนเร้น',
    ],
    tip1Title: 'ควรรู้',
    tip1Text: 'แม้แต่สมุนไพรก็ควรได้รับคำแนะนำจากผู้เชี่ยวชาญ: “ธรรมชาติ” ไม่ได้หมายความว่า “ไม่มีปฏิกิริยาต่อกันที่เป็นไปได้” กับการรักษาอื่น',
    body4: 'การเตรียมประเด็นไม่กี่ข้อก่อนนัดหมายช่วยให้คุณใช้ประโยชน์จากการพูดคุยได้เต็มที่:',
    discussPoints: [
      'อาการที่รบกวนที่สุดในแต่ละวันของคุณ',
      'ประวัติทางการแพทย์ของคุณและครอบครัว',
      'ความชอบของคุณ (ใช้ฮอร์โมนหรือไม่ ระยะเวลาที่คุณพิจารณา)',
      'คำถามและความกังวลของคุณ — อย่าลังเลที่จะถาม',
    ],
    tip2Title: 'ควรรู้',
    tip2Text: 'ไม่ว่าจะใช้ฮอร์โมนหรือไม่ ไม่มีการรักษาใดเป็นสากล: สิ่งที่เหมาะกับคุณขึ้นอยู่กับสถานการณ์ส่วนตัว ที่ประเมินร่วมกับบุคลากรทางการแพทย์',
    shareMessage: 'การรักษาในวัยหมดประจำเดือน — AWA',
  },
  vi: {
    badge: 'ĐIỀU TRỊ',
    title: 'Các phương pháp\nđiều trị mãn kinh',
    metaDuration: '7 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Trung cấp',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Liệu pháp thay thế hormone và các lựa chọn không dùng hormone, giúp bạn chuẩn bị cho cuộc trao đổi với bác sĩ.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Liệu pháp thay thế hormone mãn kinh',
      'Lợi ích và thận trọng',
      'Các cách tiếp cận không dùng hormone',
      'Trao đổi với nhân viên y tế',
      'Điều cần nhớ',
    ],
    body1: 'Liệu pháp thay thế hormone mãn kinh (HRT) bù đắp sự sụt giảm estrogen và có thể làm dịu các triệu chứng khó chịu nhất, như bốc hỏa, rối loạn giấc ngủ hoặc khô âm đạo.',
    body2: 'HRT cũng có thể giúp bảo vệ mật độ xương. Tuy nhiên, nó không phù hợp với mọi tình huống: tiền sử cá nhân mắc một số bệnh (bệnh tim mạch, một số bệnh ung thư phụ thuộc hormone) có thể hạn chế việc sử dụng.',
    alertTitle: 'Xin lưu ý',
    alertText: 'Cán cân lợi ích - rủi ro của HRT phụ thuộc vào độ tuổi, thời điểm bắt đầu so với lúc mãn kinh và tiền sử bệnh của bạn: cần có đánh giá y khoa cá nhân hóa trước mọi quyết định.',
    body3: 'Khi không muốn dùng HRT hoặc không phù hợp, vẫn có những lựa chọn khác giúp làm dịu triệu chứng:',
    nonHormonal: [
      'Liệu pháp nhận thức hành vi (để kiểm soát căng thẳng và giấc ngủ)',
      'Thảo dược, dưới sự giám sát của nhân viên y tế',
      'Điều chỉnh lối sống (chế độ ăn, hoạt động thể chất, giấc ngủ)',
      'Gel bôi trơn và kem dưỡng ẩm âm đạo cho tình trạng khô vùng kín',
    ],
    tip1Title: 'Nên biết',
    tip1Text: 'Ngay cả thảo dược cũng cần lời khuyên của chuyên gia: “tự nhiên” không có nghĩa là “không có tương tác có thể xảy ra” với các phương pháp điều trị khác.',
    body4: 'Chuẩn bị trước vài điểm trước buổi hẹn giúp bạn tận dụng tốt cuộc trao đổi:',
    discussPoints: [
      'Những triệu chứng gây khó chịu nhất mỗi ngày của bạn',
      'Tiền sử bệnh của cá nhân và gia đình bạn',
      'Sở thích của bạn (dùng hormone hay không, dự định dùng trong bao lâu)',
      'Những câu hỏi và lo ngại của bạn — đừng ngần ngại hỏi',
    ],
    tip2Title: 'Nên biết',
    tip2Text: 'Dùng hormone hay không, không có phương pháp điều trị nào là phổ quát: điều phù hợp với bạn phụ thuộc vào hoàn cảnh cá nhân, được đánh giá cùng nhân viên y tế.',
    shareMessage: 'Các phương pháp điều trị mãn kinh — AWA',
  },
  uz: {
    badge: 'DAVOLANISHLAR',
    title: 'Menopauza\ndavolanishlari',
    metaDuration: '7 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Oʻrta',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Gormon almashtirish terapiyasi va gormonsiz muqobillar — shifokor bilan suhbatga tayyorlanishingizga yordam beradi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Menopauzada gormon almashtirish terapiyasi',
      'Foydalar va ehtiyot choralari',
      'Gormonsiz yondashuvlar',
      'Sogʻliqni saqlash mutaxassisi bilan gaplashish',
      'Esda tutish kerak boʻlgan narsalar',
    ],
    body1: 'Menopauzada gormon almashtirish terapiyasi (GAT) estrogen pasayishini qoplaydi va issiq toshishlar, uyqu buzilishlari yoki qin quruqligi kabi eng bezovta qiladigan alomatlarni yengillashtirishi mumkin.',
    body2: 'GAT suyak zichligini himoya qilishga ham yordam berishi mumkin. Biroq u har bir vaziyatga mos kelmaydi: baʼzi kasalliklarning (yurak-qon tomir kasalliklari, baʼzi gormonga bogʻliq saratonlar) shaxsiy tarixi uning qoʻllanilishini cheklashi mumkin.',
    alertTitle: 'Eʼtibor bering',
    alertText: 'GAT ning foyda-xavf nisbati yoshingizga, uni menopauzaga nisbatan qachon boshlanishiga va shaxsiy tibbiy tarixingizga bogʻliq: har qanday qarordan oldin individual tibbiy baholash zarur.',
    body3: 'GAT xohlanmaganda yoki mos kelmaganda, alomatlarni yengillashtirishga yordam beradigan boshqa variantlar mavjud:',
    nonHormonal: [
      'Kognitiv-xulq-atvor terapiyasi (stress va uyquni boshqarish uchun)',
      'Sogʻliqni saqlash mutaxassisi nazorati ostidagi oʻsimlik bilan davolash',
      'Turmush tarzini moslashtirish (ovqatlanish, jismoniy faollik, uyqu)',
      'Intim quruqlik uchun qin moylovchi va namlovchi vositalari',
    ],
    tip1Title: 'Bilish foydali',
    tip1Text: 'Hatto oʻsimlik bilan davolash ham mutaxassis maslahatiga loyiq: “tabiiy” boshqa davolanishlar bilan “mumkin boʻlgan oʻzaro taʼsirlarsiz” degani emas.',
    body4: 'Qabuldan oldin bir nechta nuqtani tayyorlash suhbatdan maksimal foydalanishga yordam beradi:',
    discussPoints: [
      'Kundalik hayotingizda eng bezovta qiladigan alomatlaringiz',
      'Shaxsiy va oilaviy tibbiy tarixingiz',
      'Afzalliklaringiz (gormonal yoki yoʻq, qancha muddatga oʻylayotganingiz)',
      'Savollaringiz va xavotirlaringiz — ularni berishdan tortinmang',
    ],
    tip2Title: 'Bilish foydali',
    tip2Text: 'Gormonal boʻlsin yoki yoʻq, birorta davolanish universal emas: sizga nima mosligi shaxsiy vaziyatingizga bogʻliq va sogʻliqni saqlash mutaxassisi bilan baholanadi.',
    shareMessage: 'Menopauza davolanishlari — AWA',
  },
  az: {
    badge: 'MÜALİCƏLƏR',
    title: 'Menopauza\nmüalicələri',
    metaDuration: '7 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Orta',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Hormonal əvəzedici terapiya və qeyri-hormonal alternativlər — həkiminizlə söhbətə hazırlaşmağa kömək etmək üçün.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Menopauza hormonal əvəzedici terapiyası',
      'Faydalar və ehtiyat tədbirləri',
      'Qeyri-hormonal yanaşmalar',
      'Tibb işçisi ilə danışmaq',
      'Yadda saxlamalı məqamlar',
    ],
    body1: 'Menopauza hormonal əvəzedici terapiyası (HƏT) östrogenin azalmasını kompensasiya edir və isti basmalar, yuxu pozuntuları və ya vaginal quruluq kimi ən narahatedici simptomları yüngülləşdirə bilər.',
    body2: 'HƏT həm də sümük sıxlığını qorumağa kömək edə bilər. Lakin o, hər vəziyyət üçün uyğun deyil: bəzi xəstəliklərin (ürək-damar xəstəliyi, bəzi hormon-asılı xərçənglər) şəxsi tarixçəsi onun istifadəsini məhdudlaşdıra bilər.',
    alertTitle: 'Nəzərə alın',
    alertText: 'HƏT-in fayda-risk balansı yaşınızdan, menopauzaya nisbətən nə vaxt başladılmasından və şəxsi tibbi tarixçənizdən asılıdır: hər hansı qərardan əvvəl fərdi tibbi qiymətləndirmə lazımdır.',
    body3: 'HƏT istənilmədikdə və ya uyğun olmadıqda simptomları yüngülləşdirməyə kömək edən digər variantlar mövcuddur:',
    nonHormonal: [
      'Koqnitiv davranış terapiyası (stress və yuxunun idarə edilməsi üçün)',
      'Tibb işçisinin nəzarəti altında fitoterapiya',
      'Həyat tərzi tənzimləmələri (qidalanma, fiziki fəaliyyət, yuxu)',
      'İntim quruluq üçün vaginal sürtkü və nəmləndirici vasitələr',
    ],
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Hətta fitoterapiya da mütəxəssis məsləhətinə layiqdir: “təbii” “digər müalicələrlə mümkün qarşılıqlı təsir olmadan” demək deyil.',
    body4: 'Qəbuldan əvvəl bir neçə məqamı hazırlamaq söhbətdən maksimum yararlanmağa kömək edir:',
    discussPoints: [
      'Gündəlik həyatda sizi ən çox narahat edən simptomlar',
      'Şəxsi və ailə tibbi tarixçəniz',
      'Üstünlükləriniz (hormonal və ya yox, nə qədər müddət nəzərdə tutursunuz)',
      'Sualləriniz və narahatlıqlarınız — onları verməkdən çəkinməyin',
    ],
    tip2Title: 'Bilmək faydalıdır',
    tip2Text: 'Hormonal və ya yox, heç bir müalicə universal deyil: sizə nəyin uyğun olduğu tibb işçisi ilə qiymətləndirilən şəxsi vəziyyətinizdən asılıdır.',
    shareMessage: 'Menopauza müalicələri — AWA',
  },
  ka: {
    badge: 'მკურნალობა',
    title: 'მენოპაუზის\nმკურნალობა',
    metaDuration: '7 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'საშუალო',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'ჰორმონული ჩანაცვლებითი თერაპია და არაჰორმონული ალტერნატივები, რათა ექიმთან საუბრისთვის მოემზადოთ.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'მენოპაუზის ჰორმონული ჩანაცვლებითი თერაპია',
      'სარგებელი და სიფრთხილის ზომები',
      'არაჰორმონული მიდგომები',
      'ჯანდაცვის სპეციალისტთან საუბარი',
      'რა უნდა დაიმახსოვროთ',
    ],
    body1: 'მენოპაუზის ჰორმონული ჩანაცვლებითი თერაპია (HRT) ესტროგენის შემცირებას ანაზღაურებს და შეუძლია ყველაზე შემაწუხებელი სიმპტომების, როგორიცაა ცხელი ტალღები, ძილის დარღვევები ან ვაგინალური სიმშრალე, შემსუბუქება.',
    body2: 'HRT-ს ასევე შეუძლია ძვლის სიმკვრივის დაცვაში დახმარება. თუმცა ის ყველა სიტუაციისთვის შესაფერისი არ არის: გარკვეული დაავადებების პირადმა ისტორიამ (გულ-სისხლძარღვთა დაავადება, ზოგიერთი ჰორმონდამოკიდებული კიბო) შეიძლება მისი გამოყენება შეზღუდოს.',
    alertTitle: 'გაითვალისწინეთ',
    alertText: 'HRT-ის სარგებლისა და რისკის ბალანსი დამოკიდებულია თქვენს ასაკზე, მისი დაწყების დროზე მენოპაუზასთან მიმართებით და თქვენს პირად სამედიცინო ისტორიაზე: ნებისმიერ გადაწყვეტილებამდე საჭიროა ინდივიდუალიზებული სამედიცინო შეფასება.',
    body3: 'როცა HRT არ არის სასურველი ან შესაფერისი, არსებობს სხვა ვარიანტები, რომლებიც სიმპტომების შემსუბუქებაში გეხმარებათ:',
    nonHormonal: [
      'კოგნიტურ-ქცევითი თერაპია (სტრესისა და ძილის მართვისთვის)',
      'ფიტოთერაპია, ჯანდაცვის სპეციალისტის ზედამხედველობით',
      'ცხოვრების წესის მორგება (კვება, ფიზიკური აქტივობა, ძილი)',
      'ვაგინალური ლუბრიკანტები და დამატენიანებლები ინტიმური სიმშრალისთვის',
    ],
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'ფიტოთერაპიაც კი პროფესიულ რჩევას იმსახურებს: „ბუნებრივი“ არ ნიშნავს „სხვა მკურნალობასთან შესაძლო ურთიერთქმედების გარეშე“.',
    body4: 'ვიზიტამდე რამდენიმე საკითხის მომზადება გეხმარებათ საუბრიდან მაქსიმუმი მიიღოთ:',
    discussPoints: [
      'თქვენი ყველაზე შემაწუხებელი ყოველდღიური სიმპტომები',
      'თქვენი პირადი და ოჯახური სამედიცინო ისტორია',
      'თქვენი პრეფერენციები (ჰორმონული თუ არა, რამდენი ხნით განიხილავთ)',
      'თქვენი კითხვები და შეშფოთებები — ნუ დააყოვნებთ მათ დასმას',
    ],
    tip2Title: 'კარგია ვიცოდეთ',
    tip2Text: 'ჰორმონული თუ არა, არცერთი მკურნალობა უნივერსალური არ არის: რა გერგებათ, დამოკიდებულია თქვენს პირად სიტუაციაზე, რომელიც ჯანდაცვის სპეციალისტთან ერთად ფასდება.',
    shareMessage: 'მენოპაუზის მკურნალობა — AWA',
  },
  hy: {
    badge: 'ԲՈՒԺՈՒՄՆԵՐ',
    title: 'Դաշտանադադարի\nբուժումներ',
    metaDuration: '7 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Միջին',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Հորմոնալ փոխարինող թերապիա և ոչ հորմոնալ այլընտրանքներ՝ ձեզ նախապատրաստելու համար զրույցը ձեր բժշկի հետ:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Դաշտանադադարի հորմոնալ փոխարինող թերապիա',
      'Օգուտներ և զգուշություններ',
      'Ոչ հորմոնալ մոտեցումներ',
      'Խոսել առողջապահության մասնագետի հետ',
      'Ինչ հիշել',
    ],
    body1: 'Դաշտանադադարի հորմոնալ փոխարինող թերապիան (ՀՓԹ) փոխհատուցում է էստրոգենի անկումը և կարող է թեթևացնել ամենաանհարմար ախտանիշները, ինչպիսիք են տաք ալիքները, քնի խանգարումները կամ հեշտոցային չորությունը:',
    body2: 'ՀՓԹ-ն կարող է նաև օգնել պաշտպանել ոսկրային խտությունը: Այդուհանդերձ, այն հարմար չէ ամեն իրավիճակի համար. որոշ հիվանդությունների անձնական պատմությունը (սրտանոթային հիվանդություն, որոշ հորմոնակախյալ քաղցկեղներ) կարող է սահմանափակել դրա օգտագործումը:',
    alertTitle: 'Խնդրում ենք ուշադրություն դարձնել',
    alertText: 'ՀՓԹ-ի օգուտ-վտանգ հավասարակշռությունը կախված է ձեր տարիքից, դաշտանադադարի նկատմամբ սկսելու ժամանակից և ձեր անձնական բժշկական պատմությունից. ցանկացած որոշումից առաջ անհրաժեշտ է անհատականացված բժշկական գնահատում:',
    body3: 'Երբ ՀՓԹ-ն չի ցանկացվում կամ հարմար չէ, գոյություն ունեն այլ տարբերակներ՝ ախտանիշները թեթևացնելու համար.',
    nonHormonal: [
      'Ճանաչողական վարքային թերապիա (սթրեսի և քնի կառավարման համար)',
      'Խոտաբույսային բժշկություն՝ առողջապահության մասնագետի հսկողությամբ',
      'Ապրելակերպի ճշգրտումներ (սննդակարգ, ֆիզիկական ակտիվություն, քուն)',
      'Հեշտոցային քսուքներ և խոնավեցնող միջոցներ ինտիմ չորության դեպքում',
    ],
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Նույնիսկ խոտաբույսային բժշկությունը արժանի է մասնագիտական խորհրդի. «բնականը» չի նշանակում «առանց այլ բուժումների հետ հնարավոր փոխազդեցությունների»:',
    body4: 'Այցից առաջ մի քանի կետ պատրաստելը օգնում է առավելագույնս օգտվել զրույցից.',
    discussPoints: [
      'Ձեր առօրյայի ամենաանհարմար ախտանիշները',
      'Ձեր անձնական և ընտանեկան բժշկական պատմությունը',
      'Ձեր նախասիրությունները (հորմոնալ թե ոչ, որքան ժամանակով եք դիտարկում)',
      'Ձեր հարցերն ու անհանգստությունները. մի տատանվեք տալ դրանք',
    ],
    tip2Title: 'Լավ է իմանալ',
    tip2Text: 'Հորմոնալ թե ոչ՝ ոչ մի բուժում համընդհանուր չէ. ձեզ հարմարը կախված է ձեր անձնական իրավիճակից, որը գնահատվում է առողջապահության մասնագետի հետ:',
    shareMessage: 'Դաշտանադադարի բուժումներ — AWA',
  },
  tg: {
    badge: 'ТАБОБАТҲО',
    title: 'Табобатҳои\nменопауза',
    metaDuration: '7 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Миёна',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Табобати ивазкунандаи гормонӣ ва алтернативаҳои ғайригормонӣ, барои кумак ба омодагӣ ба сӯҳбат бо табиби шумо.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Табобати ивазкунандаи гормонии менопауза',
      'Афзалиятҳо ва эҳтиётҳо',
      'Равишҳои ғайригормонӣ',
      'Гап задан бо мутахассиси соҳаи тиб',
      'Чӣ бояд дар хотир дошт',
    ],
    body1: 'Табобати ивазкунандаи гормонии менопауза (ТИГ) паст шудани эстрогенро ҷуброн мекунад ва метавонад мазоҳимтарин нишонаҳо, аз қабили мавҷҳои гармӣ, ихтилоли хоб ё хушкии маҳбалро сабук кунад.',
    body2: 'ТИГ инчунин метавонад ба ҳифзи зичии устухон кумак кунад. Бо вуҷуди ин, он барои ҳар вазъият мувофиқ нест: таърихи шахсии баъзе бемориҳо (бемориҳои дилу рагҳо, баъзе саратонҳои вобаста ба гормон) метавонад истифодаи онро маҳдуд кунад.',
    alertTitle: 'Таваҷҷӯҳ кунед',
    alertText: 'Тавозуни манфиат ва хатари ТИГ ба синну сол, вақти оғози он нисбат ба менопауза ва таърихи шахсии тиббии шумо вобаста аст: пеш аз ҳар қарор арзёбии инфиродии тиббӣ лозим аст.',
    body3: 'Вақте ки ТИГ хоста намешавад ё мувофиқ нест, имкониятҳои дигар барои сабук кардани нишонаҳо вуҷуд доранд:',
    nonHormonal: [
      'Терапияи рафтории маърифатӣ (барои идораи стресс ва хоб)',
      'Гиёҳдармонӣ, зери назорати мутахассиси соҳаи тиб',
      'Танзимоти тарзи зиндагӣ (ғизо, фаъолияти ҷисмонӣ, хоб)',
      'Равғанҳои молиданӣ ва намдиҳандаҳои маҳбалӣ барои хушкии наздикӣ',
    ],
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Ҳатто гиёҳдармонӣ маслиҳати касбиро сазовор аст: «табиӣ» маънои «бе таъсири мутақобилаи эҳтимолӣ» бо табобатҳои дигарро надорад.',
    body4: 'Омода кардани чанд нукта пеш аз қабул ба шумо кумак мекунад аз сӯҳбат ҳадди аксар истифода баред:',
    discussPoints: [
      'Нишонаҳои мазоҳимтарини ҳаррӯзаи шумо',
      'Таърихи тиббии шахсӣ ва оилавии шумо',
      'Афзалиятҳои шумо (гормонӣ ё не, чӣ қадар вақт дар назар доред)',
      'Саволҳо ва нигаронии шумо — пурсидан шарм надоред',
    ],
    tip2Title: 'Донистан хуб аст',
    tip2Text: 'Гормонӣ ё не, ягон табобат умумӣ нест: он чи барои шумо мувофиқ аст, ба вазъияти шахсии шумо вобаста аст, ки бо мутахассиси соҳаи тиб арзёбӣ мешавад.',
    shareMessage: 'Табобатҳои менопауза — AWA',
  },
  ky: {
    badge: 'ДАРЫЛООЛОР',
    title: 'Менопауза\nдарылоолору',
    metaDuration: '7 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Орто',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Гормон алмаштыруучу терапия жана гормондук эмес альтернативалар, дарыгер менен сүйлөшүүгө даярданууга жардам берүү үчүн.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Менопаузада гормон алмаштыруучу терапия',
      'Артыкчылыктары жана сактык чаралары',
      'Гормондук эмес ыкмалар',
      'Ден соолук сактоо адиси менен сүйлөшүү',
      'Эмнени эстен чыгарбоо керек',
    ],
    body1: 'Менопаузада гормон алмаштыруучу терапия (ГАТ) эстрогендин азайышын толуктайт жана ысык толкундар, уйку бузулуулары же кынаптын кургактыгы сыяктуу эң тынчсыздандырган белгилерди жеңилдетиши мүмкүн.',
    body2: 'ГАТ ошондой эле сөөк тыгыздыгын коргоого жардам бериши мүмкүн. Бирок ал ар бир абалга ылайыктуу эмес: айрым оорулардын (жүрөк-кан тамыр оорулары, айрым гормонго көз каранды рак түрлөрү) жеке тарыхы анын колдонулушун чектеши мүмкүн.',
    alertTitle: 'Көңүл буруңуз',
    alertText: 'ГАТтын пайда-коркунуч тең салмактуулугу жашыңызга, менопаузага карата качан башталганына жана жеке медициналык тарыхыңызга көз каранды: ар кандай чечимден мурун жекелештирилген медициналык баа керек.',
    body3: 'ГАТ каалабаганда же ылайыксыз болгондо, белгилерди жеңилдетүүгө жардам берген башка варианттар бар:',
    nonHormonal: [
      'Когнитивдик-жүрүм-турум терапиясы (стрессти жана уйкуну башкаруу үчүн)',
      'Ден соолук сактоо адисинин көзөмөлүндөгү чөп дарылары',
      'Жашоо образын тууралоо (тамактануу, физикалык активдүүлүк, уйку)',
      'Жакын кургактык үчүн кынап майлоочу жана нымдаткыч каражаттары',
    ],
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Чөп дарылары да адистин кеңешине татыйт: «табигый» «башка дарылоолор менен мүмкүн болгон өз ара аракеттенүүсүз» дегенди билдирбейт.',
    body4: 'Кабыл алуудан мурун бир нече пунктту даярдоо сүйлөшүүдөн максималдуу пайда алууга жардам берет:',
    discussPoints: [
      'Күнүмдүк жашоодо эң тынчсыздандырган белгилериңиз',
      'Жеке жана үй-бүлөлүк медициналык тарыхыңыз',
      'Тандооңуз (гормондук же гормондук эмес, канча убакытка ойлонуп жатасыз)',
      'Суроолоруңуз жана тынчсызданууларыңыз — аларды берүүдөн тартынбаңыз',
    ],
    tip2Title: 'Билүү пайдалуу',
    tip2Text: 'Гормондук же гормондук эмес, эч бир дарылоо универсалдуу эмес: сизге эмне ылайыктуу экени ден соолук сактоо адиси менен бааланган жеке абалыңызга көз каранды.',
    shareMessage: 'Менопауза дарылоолору — AWA',
  },
  tk: {
    badge: 'BEJERGILER',
    title: 'Menopauza\nbejergileri',
    metaDuration: '7 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Orta',
    metaValidated: 'Barlanan mazmun',
    intro: 'Gormon çalşyryş bejergisi we gormonal däl alternatiwalar, lukmanyňyz bilen söhbetdeşlige taýýarlanmaga kömek etmek üçin.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Menopauza gormon çalşyryş bejergisi',
      'Artykmaçlyklary we seresaplylyk çäreleri',
      'Gormonal däl çemeleşmeler',
      'Saglyk hünärmeni bilen gürleşmek',
      'Nämäni ýatda saklamaly',
    ],
    body1: 'Menopauza gormon çalşyryş bejergisi (MGÇB) estrogeniň peselmegini deňleýär we gyzgynlyk gelmeleri, uky bozulmalary ýa-da jynsy ýoluň gurakçylygy ýaly iň biynjalyk edýän alamatlary ýeňilleşdirip biler.',
    body2: 'MGÇB süýek dykyzlygyny goramaga hem kömek edip biler. Şeýle-de bolsa, ol her ýagdaý üçin laýyk däl: käbir ýagdaýlaryň şahsy taryhy (ýürek-damar keselleri, käbir gormona baglylykly rak keselleri) onuň ulanylyşyny çäklendirip biler.',
    alertTitle: 'Üns beriň',
    alertText: 'MGÇB-niň peýda-howp deňagramlylygy ýaşyňyza, ony menopauzaya görä haçan başlanyşyna we şahsy lukmançylyk taryhyňyza bagly: islendik karardan öň şahsylaşdyrylan lukmançylyk bahalandyrma gerek.',
    body3: 'MGÇB islenmeýän ýa-da laýyk däl bolanda, alamatlary ýeňilleşdirmäge kömek etjek başga wariantlar bar:',
    nonHormonal: [
      'Kognitiw-özüňi alyp barş bejergisi (stresi we ukyny dolandyrmak üçin)',
      'Saglyk hünärmeniniň gözegçiliginde ösümlik bejergisi',
      'Durmuş ýörelgesi sazlamalary (iýmitlenmek, fiziki işjeňlik, uky)',
      'Ýakyn gurakçylyk üçin jynsy ýol ýaglaýjylary we çyglandyryjylary',
    ],
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Hatda ösümlik bejergisi hem hünärmeniň maslahatyna mynasyp: «tebigy» beýleki bejergiler bilen «mümkin özara täsirleriň ýoklugyny» aňlatmaýar.',
    body4: 'Kabul edişden öň birnäçe nokady taýýarlamak söhbetdeşlikden iň köp peýda almaga kömek edýär:',
    discussPoints: [
      'Gündelik durmuşda iň biynjalyk edýän alamatlaryňyz',
      'Şahsy we maşgala lukmançylyk taryhyňyz',
      'Isleglerigiz (gormonal ýa-da däl, näçe wagt göz öňünde tutýandygyňyz)',
      'Soraglaryňyz we alada edýän zatlaryňyz — olary bermekden çekinmäň',
    ],
    tip2Title: 'Bilmek peýdaly',
    tip2Text: 'Gormonal bolsun ýa-da däl, hiç bir bejergi umumy däl: size näme laýykdygy saglyk hünärmeni bilen bahalanylýan şahsy ýagdaýyňyza bagly.',
    shareMessage: 'Menopauza bejergileri — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function MenopauseTreatmentsArticleScreen({
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

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.intro}>
            {content.intro}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>{content.contentsTitle}</AwaText>

            {content.topics.map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="titleSmall" emphasized colorRole="primary" style={styles.contentNumber}>{index + 1}.</AwaText>
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            1. {content.topics[0]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body1}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alertTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.alertText}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body3}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.nonHormonal.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body4}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.discussPoints.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

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
  contentNumber: {width: 24},
  contentText: {flex: 1},
  h2: {
    marginTop: 24,
  },
  body: {marginTop: 8},
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
  checkText: {flex: 1},
  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 3},
  });
}
