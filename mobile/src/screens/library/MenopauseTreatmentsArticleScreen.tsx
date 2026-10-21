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
