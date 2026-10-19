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

const ID = 'pcos-diagnostic-examens';

const HERO = require('../../assets/images/library/featured-spm.png');

// Icons/numbers stay language-neutral — only TEXT moves into the bilingual
// CONTENT object below, keyed by index to stay aligned with these entries.
const DIAGNOSIS_STEP_META = [
  {number: '01', icon: 'clipboard-text-outline'},
  {number: '02', icon: 'stethoscope'},
  {number: '03', icon: 'flask-outline'},
  {number: '04', icon: 'ultrasound'},
] as const;

const BLOOD_TEST_META = [
  {icon: 'test-tube'},
  {icon: 'water-outline'},
  {icon: 'chart-line'},
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'SOPK',
    title: 'Diagnostic du SOPK :\nexamens et bilan',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro: 'Comment le SOPK est diagnostiqué, quels examens peuvent être proposés et comment préparer sereinement ta consultation.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Comprendre le bilan diagnostique',
      'Les principales étapes du bilan',
      'La prise de sang hormonale',
      'L’échographie pelvienne',
      'Ce que le diagnostic ne dit pas',
      'Préparer sa consultation',
      'À retenir',
    ],
    section1Body1: 'Le diagnostic du syndrome des ovaires polykystiques ne repose pas sur un seul examen. Le professionnel de santé rassemble plusieurs informations : l’histoire des cycles, les symptômes éventuels, l’examen clinique, les analyses biologiques et, selon la situation, une échographie.',
    section1Body2: 'L’objectif est à la fois de rechercher les caractéristiques compatibles avec un SOPK et d’écarter d’autres causes pouvant expliquer des règles irrégulières ou certains symptômes hormonaux.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Le diagnostic est toujours personnalisé. Deux femmes ayant un SOPK peuvent avoir des symptômes et des résultats d’examens très différents.',
    section2Body: 'Le bilan peut suivre plusieurs étapes. Elles ne sont pas nécessairement toutes réalisées de la même façon chez chaque personne.',
    diagnosisSteps: [
      {title: 'Interrogatoire', text: 'Le professionnel recueille ton histoire : cycles, symptômes, antécédents et traitements.'},
      {title: 'Examen clinique', text: 'Il recherche notamment des signes d’excès d’androgènes et évalue ton état général.'},
      {title: 'Bilan sanguin', text: 'Des analyses hormonales et métaboliques peuvent être demandées pour préciser la situation.'},
      {title: 'Échographie', text: 'Elle peut compléter le bilan en observant l’aspect des ovaires.'},
    ],
    flowTitle: 'Le parcours en un coup d’œil',
    flowItems: [
      'Histoire et symptômes',
      'Examen clinique',
      'Analyses selon le contexte',
      'Échographie si nécessaire',
    ],
    section3Body1: 'Une prise de sang peut être proposée pour rechercher des signes d’excès d’androgènes, évaluer certaines hormones impliquées dans le fonctionnement reproductif et rechercher d’autres causes possibles des symptômes.',
    section3Body2: 'Les analyses choisies dépendent de ton âge, de tes symptômes, de ton histoire médicale et de ce que le professionnel cherche à vérifier.',
    bloodTests: [
      {title: 'Androgènes', text: 'Testostérone et autres hormones selon le contexte.'},
      {title: 'Fonction thyroïdienne', text: 'Permet notamment d’écarter certaines causes de cycles irréguliers.'},
      {title: 'Bilan métabolique', text: 'Glycémie, parfois bilan lipidique selon les facteurs de risque.'},
    ],
    alertTitle: 'Important',
    alertText: 'Les résultats hormonaux doivent être interprétés avec le contexte clinique. Une valeur isolée ne permet généralement pas, à elle seule, de conclure à un SOPK.',
    section4Body: 'Une échographie peut être utilisée pour observer l’aspect des ovaires et rechercher notamment un nombre important de petits follicules. Elle permet également au professionnel de rechercher d’autres éléments pouvant expliquer certains symptômes.',
    tip2Title: 'Bon à savoir',
    tip2Text: 'Voir de nombreux follicules à l’échographie ne signifie pas automatiquement que tu as un SOPK. Le résultat doit être interprété avec les autres éléments du bilan.',
    section5Body: 'Recevoir un diagnostic de SOPK ne permet pas de prédire exactement ton évolution future. Le syndrome peut se manifester de manière très différente d’une personne à l’autre.',
    mythItems: [
      'Le SOPK ne signifie pas automatiquement infertilité.',
      'Le SOPK ne signifie pas forcément avoir des kystes.',
      'Le diagnostic ne détermine pas à lui seul le traitement.',
      'Une échographie normale n’exclut pas nécessairement le SOPK.',
    ],
    section6Body: 'Quelques informations préparées à l’avance peuvent aider le professionnel à comprendre ton histoire et à choisir les examens les plus pertinents.',
    appointmentQuestions: [
      'Depuis quand tes cycles sont-ils irréguliers ?',
      'As-tu remarqué de l’acné, une pilosité ou une perte de cheveux inhabituelles ?',
      'Y a-t-il des antécédents de SOPK ou de diabète dans ta famille ?',
      'As-tu un désir de grossesse à court ou moyen terme ?',
    ],
    preparationTitle: 'Petit conseil avant le rendez-vous',
    preparationText: 'Si possible, note les dates de tes dernières règles, la durée approximative de tes cycles, les symptômes que tu observes et les traitements ou compléments que tu prends.',
    summaryTitle: 'L’essentiel du bilan',
    summaryItems: [
      'Le diagnostic repose sur plusieurs éléments, pas sur un seul examen.',
      'Une prise de sang peut rechercher certains déséquilibres hormonaux et éliminer d’autres causes.',
      'Une échographie peut compléter le bilan selon la situation.',
      'Les résultats doivent toujours être interprétés par un professionnel de santé.',
    ],
    finalTipTitle: 'À retenir',
    finalTipText: 'Un bilan de SOPK n’est pas un examen unique ni un jugement définitif. Il sert à comprendre ton fonctionnement hormonal, à rechercher d’autres causes possibles et à construire un accompagnement adapté à ta situation.',
    disclaimerText: 'Cet article est informatif et ne remplace pas une consultation médicale ni l’interprétation personnalisée de tes examens.',
    shareMessage: 'Diagnostic du SOPK : examens et bilan — AWA',
  },
  en: {
    badge: 'PCOS',
    title: 'PCOS diagnosis:\ntests and workup',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro: 'How PCOS is diagnosed, what tests may be offered, and how to prepare calmly for your appointment.',
    contentsTitle: 'In this article',
    topics: [
      'Understanding the diagnostic workup',
      'The main steps of the workup',
      'The hormonal blood test',
      'The pelvic ultrasound',
      'What the diagnosis doesn’t tell you',
      'Preparing for your appointment',
      'Key takeaways',
    ],
    section1Body1: 'The diagnosis of polycystic ovary syndrome doesn’t rely on a single test. The healthcare professional brings together several pieces of information: your cycle history, any symptoms, the clinical exam, lab tests, and, depending on the situation, an ultrasound.',
    section1Body2: 'The goal is both to look for features consistent with PCOS and to rule out other causes that could explain irregular periods or certain hormonal symptoms.',
    tip1Title: 'Good to know',
    tip1Text: 'The diagnosis is always personalized. Two women with PCOS can have very different symptoms and test results.',
    section2Body: 'The workup can follow several steps. They aren’t necessarily all carried out the same way for everyone.',
    diagnosisSteps: [
      {title: 'History-taking', text: 'The professional gathers your history: cycles, symptoms, medical background, and treatments.'},
      {title: 'Clinical exam', text: 'They look in particular for signs of excess androgens and assess your overall condition.'},
      {title: 'Blood workup', text: 'Hormonal and metabolic tests may be requested to clarify the situation.'},
      {title: 'Ultrasound', text: 'It can complete the workup by observing the appearance of the ovaries.'},
    ],
    flowTitle: 'The process at a glance',
    flowItems: [
      'History and symptoms',
      'Clinical exam',
      'Tests depending on the situation',
      'Ultrasound if needed',
    ],
    section3Body1: 'A blood test may be offered to look for signs of excess androgens, assess certain hormones involved in reproductive function, and look for other possible causes of your symptoms.',
    section3Body2: 'The tests chosen depend on your age, your symptoms, your medical history, and what the professional is looking to check.',
    bloodTests: [
      {title: 'Androgens', text: 'Testosterone and other hormones depending on the situation.'},
      {title: 'Thyroid function', text: 'Helps in particular rule out certain causes of irregular cycles.'},
      {title: 'Metabolic workup', text: 'Blood glucose, sometimes a lipid panel depending on risk factors.'},
    ],
    alertTitle: 'Important',
    alertText: 'Hormonal results need to be interpreted alongside the clinical context. A single value usually isn’t enough, on its own, to conclude a PCOS diagnosis.',
    section4Body: 'An ultrasound can be used to observe the appearance of the ovaries and look in particular for a high number of small follicles. It also allows the professional to look for other factors that could explain certain symptoms.',
    tip2Title: 'Good to know',
    tip2Text: 'Seeing many follicles on ultrasound doesn’t automatically mean you have PCOS. The result needs to be interpreted alongside the rest of the workup.',
    section5Body: 'Receiving a PCOS diagnosis doesn’t make it possible to predict exactly how things will progress for you. The syndrome can show up very differently from one person to another.',
    mythItems: [
      'PCOS doesn’t automatically mean infertility.',
      'PCOS doesn’t necessarily mean having cysts.',
      'The diagnosis alone doesn’t determine the treatment.',
      'A normal ultrasound doesn’t necessarily rule out PCOS.',
    ],
    section6Body: 'A few pieces of information prepared ahead of time can help the professional understand your history and choose the most relevant tests.',
    appointmentQuestions: [
      'How long have your cycles been irregular?',
      'Have you noticed acne, unusual hair growth, or hair loss?',
      'Is there a family history of PCOS or diabetes?',
      'Do you wish to become pregnant in the short or medium term?',
    ],
    preparationTitle: 'A small tip before the appointment',
    preparationText: 'If possible, note the dates of your last period, the approximate length of your cycles, the symptoms you’re noticing, and any treatments or supplements you’re taking.',
    summaryTitle: 'The essentials of the workup',
    summaryItems: [
      'The diagnosis relies on several factors, not a single test.',
      'A blood test can look for certain hormonal imbalances and rule out other causes.',
      'An ultrasound can complete the workup depending on the situation.',
      'Results should always be interpreted by a healthcare professional.',
    ],
    finalTipTitle: 'Key takeaways',
    finalTipText: 'A PCOS workup isn’t a single test or a final verdict. It helps you understand your hormonal functioning, look for other possible causes, and build care that’s suited to your situation.',
    disclaimerText: 'This article is for information only and doesn’t replace a medical consultation or the personalized interpretation of your test results.',
    shareMessage: 'PCOS diagnosis: tests and workup — AWA',
  },
  es: {
    badge: 'SOP',
    title: 'Diagnóstico del SOP:\nexámenes y balance',
    metaDuration: '7 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido validado',
    intro: 'Cómo se diagnostica el SOP, qué exámenes pueden proponerse y cómo preparar tu consulta con tranquilidad.',
    contentsTitle: 'En este artículo',
    topics: [
      'Comprender el balance diagnóstico',
      'Las principales etapas del balance',
      'El análisis de sangre hormonal',
      'La ecografía pélvica',
      'Lo que el diagnóstico no dice',
      'Preparar tu consulta',
      'Para recordar',
    ],
    section1Body1: 'El diagnóstico del síndrome de ovario poliquístico no se basa en un solo examen. El profesional de salud reúne varias informaciones: la historia de tus ciclos, los posibles síntomas, el examen clínico, los análisis biológicos y, según la situación, una ecografía.',
    section1Body2: 'El objetivo es a la vez buscar las características compatibles con un SOP y descartar otras causas que puedan explicar reglas irregulares o ciertos síntomas hormonales.',
    tip1Title: 'Dato útil',
    tip1Text: 'El diagnóstico siempre es personalizado. Dos mujeres con SOP pueden tener síntomas y resultados de exámenes muy diferentes.',
    section2Body: 'El balance puede seguir varias etapas. No se realizan necesariamente todas de la misma manera en cada persona.',
    diagnosisSteps: [
      {title: 'Interrogatorio', text: 'El profesional recoge tu historia: ciclos, síntomas, antecedentes y tratamientos.'},
      {title: 'Examen clínico', text: 'Busca especialmente signos de exceso de andrógenos y evalúa tu estado general.'},
      {title: 'Balance sanguíneo', text: 'Pueden solicitarse análisis hormonales y metabólicos para precisar la situación.'},
      {title: 'Ecografía', text: 'Puede completar el balance observando el aspecto de los ovarios.'},
    ],
    flowTitle: 'El recorrido de un vistazo',
    flowItems: [
      'Historia y síntomas',
      'Examen clínico',
      'Análisis según el contexto',
      'Ecografía si es necesario',
    ],
    section3Body1: 'Puede proponerse un análisis de sangre para buscar signos de exceso de andrógenos, evaluar ciertas hormonas implicadas en el funcionamiento reproductivo y buscar otras posibles causas de los síntomas.',
    section3Body2: 'Los análisis elegidos dependen de tu edad, tus síntomas, tu historia médica y lo que el profesional busca verificar.',
    bloodTests: [
      {title: 'Andrógenos', text: 'Testosterona y otras hormonas según el contexto.'},
      {title: 'Función tiroidea', text: 'Permite especialmente descartar ciertas causas de ciclos irregulares.'},
      {title: 'Balance metabólico', text: 'Glucemia, a veces perfil lipídico según los factores de riesgo.'},
    ],
    alertTitle: 'Importante',
    alertText: 'Los resultados hormonales deben interpretarse junto con el contexto clínico. Un valor aislado generalmente no permite, por sí solo, concluir un SOP.',
    section4Body: 'Una ecografía puede utilizarse para observar el aspecto de los ovarios y buscar especialmente un número importante de pequeños folículos. También permite al profesional buscar otros elementos que puedan explicar ciertos síntomas.',
    tip2Title: 'Dato útil',
    tip2Text: 'Ver numerosos folículos en la ecografía no significa automáticamente que tengas SOP. El resultado debe interpretarse junto con los demás elementos del balance.',
    section5Body: 'Recibir un diagnóstico de SOP no permite predecir exactamente tu evolución futura. El síndrome puede manifestarse de manera muy diferente de una persona a otra.',
    mythItems: [
      'El SOP no significa automáticamente infertilidad.',
      'El SOP no significa forzosamente tener quistes.',
      'El diagnóstico por sí solo no determina el tratamiento.',
      'Una ecografía normal no excluye necesariamente el SOP.',
    ],
    section6Body: 'Algunas informaciones preparadas de antemano pueden ayudar al profesional a comprender tu historia y a elegir los exámenes más pertinentes.',
    appointmentQuestions: [
      '¿Desde cuándo son irregulares tus ciclos?',
      '¿Has notado acné, vello o caída de cabello inusuales?',
      '¿Hay antecedentes de SOP o de diabetes en tu familia?',
      '¿Tienes deseo de embarazo a corto o medio plazo?',
    ],
    preparationTitle: 'Un pequeño consejo antes de la cita',
    preparationText: 'Si es posible, anota las fechas de tu última regla, la duración aproximada de tus ciclos, los síntomas que observas y los tratamientos o complementos que tomas.',
    summaryTitle: 'Lo esencial del balance',
    summaryItems: [
      'El diagnóstico se basa en varios elementos, no en un solo examen.',
      'Un análisis de sangre puede buscar ciertos desequilibrios hormonales y descartar otras causas.',
      'Una ecografía puede completar el balance según la situación.',
      'Los resultados siempre deben ser interpretados por un profesional de salud.',
    ],
    finalTipTitle: 'Para recordar',
    finalTipText: 'Un balance de SOP no es un examen único ni un juicio definitivo. Sirve para comprender tu funcionamiento hormonal, buscar otras posibles causas y construir un acompañamiento adaptado a tu situación.',
    disclaimerText: 'Este artículo es informativo y no sustituye una consulta médica ni la interpretación personalizada de tus exámenes.',
    shareMessage: 'Diagnóstico del SOP: exámenes y balance — AWA',
  },
  it: {
    badge: 'PCOS',
    title: 'Diagnosi della PCOS:\nesami e accertamenti',
    metaDuration: '7 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenuto validato',
    intro: 'Come viene diagnosticata la PCOS, quali esami possono essere proposti e come prepararti con serenità alla visita.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Capire il percorso diagnostico',
      'Le tappe principali degli accertamenti',
      'Le analisi del sangue ormonali',
      'L’ecografia pelvica',
      'Ciò che la diagnosi non ti dice',
      'Prepararti all’appuntamento',
      'Punti chiave',
    ],
    section1Body1: 'La diagnosi di sindrome dell’ovaio policistico non si basa su un unico esame. Il o la professionista sanitario/a mette insieme diverse informazioni: la storia dei tuoi cicli, gli eventuali sintomi, la visita clinica, gli esami di laboratorio e, a seconda della situazione, un’ecografia.',
    section1Body2: 'L’obiettivo è sia cercare elementi compatibili con la PCOS, sia escludere altre cause che potrebbero spiegare mestruazioni irregolari o alcuni sintomi ormonali.',
    tip1Title: 'Da sapere',
    tip1Text: 'La diagnosi è sempre personalizzata. Due donne con PCOS possono avere sintomi e risultati degli esami molto diversi.',
    section2Body: 'Gli accertamenti possono seguire diverse tappe. Non vengono necessariamente svolti nello stesso modo per tutte.',
    diagnosisSteps: [
      {
        title: 'Raccolta della storia clinica',
        text: 'Il o la professionista raccoglie la tua storia: cicli, sintomi, anamnesi medica e terapie.',
      },
      {
        title: 'Visita clinica',
        text: 'Cerca in particolare i segni di un eccesso di androgeni e valuta il tuo stato generale.',
      },
      {
        title: 'Analisi del sangue',
        text: 'Possono essere richiesti esami ormonali e metabolici per chiarire la situazione.',
      },
      {
        title: 'Ecografia',
        text: 'Può completare gli accertamenti osservando l’aspetto delle ovaie.',
      },
    ],
    flowTitle: 'Il percorso in sintesi',
    flowItems: [
      'Storia clinica e sintomi',
      'Visita clinica',
      'Esami in base alla situazione',
      'Ecografia se necessario',
    ],
    section3Body1: 'Possono essere proposte analisi del sangue per cercare segni di un eccesso di androgeni, valutare alcuni ormoni coinvolti nella funzione riproduttiva e cercare altre possibili cause dei tuoi sintomi.',
    section3Body2: 'Gli esami scelti dipendono dalla tua età, dai tuoi sintomi, dalla tua storia clinica e da ciò che il o la professionista vuole verificare.',
    bloodTests: [
      {
        title: 'Androgeni',
        text: 'Testosterone e altri ormoni, a seconda della situazione.',
      },
      {
        title: 'Funzione tiroidea',
        text: 'Aiuta in particolare a escludere alcune cause di cicli irregolari.',
      },
      {
        title: 'Esami metabolici',
        text: 'Glicemia e, a volte, profilo lipidico in base ai fattori di rischio.',
      },
    ],
    alertTitle: 'Importante',
    alertText: 'I risultati ormonali vanno interpretati alla luce del contesto clinico. Un singolo valore, di solito, non basta da solo per concludere una diagnosi di PCOS.',
    section4Body: 'L’ecografia può essere usata per osservare l’aspetto delle ovaie e cercare in particolare un numero elevato di piccoli follicoli. Permette inoltre al o alla professionista di cercare altri fattori che potrebbero spiegare alcuni sintomi.',
    tip2Title: 'Da sapere',
    tip2Text: 'Vedere molti follicoli all’ecografia non significa automaticamente che hai la PCOS. Il risultato va interpretato insieme al resto degli accertamenti.',
    section5Body: 'Ricevere una diagnosi di PCOS non permette di prevedere con esattezza come evolverà la tua situazione. La sindrome può manifestarsi in modo molto diverso da una persona all’altra.',
    mythItems: [
      'La PCOS non significa automaticamente infertilità.',
      'La PCOS non significa necessariamente avere delle cisti.',
      'La sola diagnosi non determina la terapia.',
      'Un’ecografia nella norma non esclude necessariamente la PCOS.',
    ],
    section6Body: 'Alcune informazioni preparate in anticipo possono aiutare il o la professionista a comprendere la tua storia e a scegliere gli esami più pertinenti.',
    appointmentQuestions: [
      'Da quanto tempo i tuoi cicli sono irregolari?',
      'Hai notato acne, una crescita insolita dei peli o perdita di capelli?',
      'Ci sono casi di PCOS o di diabete in famiglia?',
      'Desideri una gravidanza a breve o medio termine?',
    ],
    preparationTitle: 'Un piccolo consiglio prima della visita',
    preparationText: 'Se possibile, annota le date dell’ultimo periodo mestruale, la durata approssimativa dei tuoi cicli, i sintomi che noti e le eventuali terapie o integratori che stai assumendo.',
    summaryTitle: 'L’essenziale sugli accertamenti',
    summaryItems: [
      'La diagnosi si basa su più elementi, non su un unico esame.',
      'Le analisi del sangue possono cercare alcuni squilibri ormonali ed escludere altre cause.',
      'Un’ecografia può completare gli accertamenti, a seconda della situazione.',
      'I risultati vanno sempre interpretati da un o una professionista sanitario/a.',
    ],
    finalTipTitle: 'Punti chiave',
    finalTipText: 'Gli accertamenti per la PCOS non sono un singolo esame né un verdetto definitivo. Ti aiutano a capire come funziona il tuo equilibrio ormonale, a cercare altre possibili cause e a costruire un percorso di cura adatto alla tua situazione.',
    disclaimerText: 'Questo articolo ha solo scopo informativo e non sostituisce una visita medica né l’interpretazione personalizzata dei risultati dei tuoi esami.',
    shareMessage: 'Diagnosi della PCOS: esami e accertamenti — AWA',
  },
  tr: {
    badge: 'PKOS',
    title: 'PKOS tanısı:\ntestler ve tetkikler',
    metaDuration: '7 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Orta düzey',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'PKOS’un nasıl teşhis edildiği, hangi testlerin önerilebileceği ve randevuna sakin bir şekilde nasıl hazırlanabileceğin.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Tanı sürecini anlamak',
      'Tetkiklerin başlıca adımları',
      'Hormonal kan testi',
      'Pelvik ultrason',
      'Tanının sana söylemedikleri',
      'Randevuna hazırlanmak',
      'Önemli noktalar',
    ],
    section1Body1: 'Polikistik over sendromu tanısı tek bir teste dayanmaz. Sağlık profesyoneli birkaç bilgiyi bir araya getirir: döngü geçmişin, varsa belirtilerin, klinik muayene, laboratuvar testleri ve duruma göre bir ultrason.',
    section1Body2: 'Amaç hem PKOS ile uyumlu bulguları araştırmak hem de düzensiz adetleri veya bazı hormonal belirtileri açıklayabilecek diğer nedenleri dışlamaktır.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Tanı her zaman kişiye özeldir. PKOS’u olan iki kadının belirtileri ve test sonuçları çok farklı olabilir.',
    section2Body: 'Tetkikler birkaç adımda ilerleyebilir. Bu adımların herkes için aynı şekilde uygulanması şart değildir.',
    diagnosisSteps: [
      {
        title: 'Öykü alma',
        text: 'Profesyonel öykünü alır: döngülerin, belirtilerin, tıbbi geçmişin ve tedavilerin.',
      },
      {
        title: 'Klinik muayene',
        text: 'Özellikle fazla androjen belirtilerini araştırır ve genel durumunu değerlendirir.',
      },
      {
        title: 'Kan tetkikleri',
        text: 'Durumu netleştirmek için hormonal ve metabolik testler istenebilir.',
      },
      {
        title: 'Ultrason',
        text: 'Overlerin görünümünü gözlemleyerek tetkikleri tamamlayabilir.',
      },
    ],
    flowTitle: 'Sürece genel bakış',
    flowItems: [
      'Öykü ve belirtiler',
      'Klinik muayene',
      'Duruma göre testler',
      'Gerekirse ultrason',
    ],
    section3Body1: 'Fazla androjen belirtilerini araştırmak, üreme işlevinde rol oynayan bazı hormonları değerlendirmek ve belirtilerinin diğer olası nedenlerini aramak için bir kan testi önerilebilir.',
    section3Body2: 'Seçilen testler yaşına, belirtilerine, tıbbi geçmişine ve profesyonelin neyi kontrol etmek istediğine göre değişir.',
    bloodTests: [
      {
        title: 'Androjenler',
        text: 'Duruma göre testosteron ve diğer hormonlar.',
      },
      {
        title: 'Tiroid işlevi',
        text: 'Özellikle düzensiz döngülerin bazı nedenlerini dışlamaya yardımcı olur.',
      },
      {
        title: 'Metabolik tetkikler',
        text: 'Kan şekeri, risk etkenlerine bağlı olarak bazen lipid paneli.',
      },
    ],
    alertTitle: 'Önemli',
    alertText: 'Hormonal sonuçların klinik bağlam içinde yorumlanması gerekir. Tek bir değer, çoğu zaman tek başına PKOS tanısını koymaya yetmez.',
    section4Body: 'Ultrason, overlerin görünümünü gözlemlemek ve özellikle çok sayıda küçük folikül olup olmadığını araştırmak için kullanılabilir. Ayrıca profesyonelin bazı belirtileri açıklayabilecek diğer etkenleri araştırmasına da olanak tanır.',
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Ultrasonda çok sayıda folikül görmek otomatik olarak PKOS’un olduğu anlamına gelmez. Sonucun, tetkiklerin geri kalanıyla birlikte yorumlanması gerekir.',
    section5Body: 'PKOS tanısı almak, sürecin senin için tam olarak nasıl ilerleyeceğini öngörmeyi mümkün kılmaz. Sendrom, bir kişiden diğerine çok farklı şekillerde ortaya çıkabilir.',
    mythItems: [
      'PKOS otomatik olarak kısırlık anlamına gelmez.',
      'PKOS mutlaka kist olması anlamına gelmez.',
      'Tek başına tanı, tedaviyi belirlemez.',
      'Normal bir ultrason, PKOS’u mutlaka dışlamaz.',
    ],
    section6Body: 'Önceden hazırlanmış birkaç bilgi, profesyonelin geçmişini anlamasına ve en uygun testleri seçmesine yardımcı olabilir.',
    appointmentQuestions: [
      'Döngülerin ne zamandır düzensiz?',
      'Akne, olağan dışı tüylenme veya saç dökülmesi fark ettin mi?',
      'Ailende PKOS veya diyabet öyküsü var mı?',
      'Kısa veya orta vadede hamile kalmak istiyor musun?',
    ],
    preparationTitle: 'Randevudan önce küçük bir ipucu',
    preparationText: 'Mümkünse son adet tarihlerini, döngülerinin yaklaşık uzunluğunu, fark ettiğin belirtileri ve kullandığın tedavileri veya takviyeleri not et.',
    summaryTitle: 'Tetkiklerin özeti',
    summaryItems: [
      'Tanı tek bir teste değil, birkaç etkene dayanır.',
      'Bir kan testi bazı hormonal dengesizlikleri araştırabilir ve diğer nedenleri dışlayabilir.',
      'Duruma göre bir ultrason tetkikleri tamamlayabilir.',
      'Sonuçlar her zaman bir sağlık profesyoneli tarafından yorumlanmalıdır.',
    ],
    finalTipTitle: 'Önemli noktalar',
    finalTipText: 'PKOS tetkiki tek bir test ya da kesin bir hüküm değildir. Hormonal işleyişini anlamana, diğer olası nedenleri araştırmana ve durumuna uygun bir bakım oluşturmana yardımcı olur.',
    disclaimerText: 'Bu makale yalnızca bilgilendirme amaçlıdır; tıbbi bir muayenenin ya da test sonuçlarının kişiye özel yorumlanmasının yerini tutmaz.',
    shareMessage: 'PKOS tanısı: testler ve tetkikler — AWA',
  },
  ru: {
    badge: 'СПКЯ',
    title: 'Диагностика СПКЯ:\nанализы и обследование',
    metaDuration: '7 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Средний уровень',
    metaValidated: 'Проверенный материал',
    intro: 'Как диагностируют СПКЯ, какие обследования могут быть назначены и как спокойно подготовиться к приёму.',
    contentsTitle: 'В этой статье',
    topics: [
      'Как устроена диагностика',
      'Основные этапы обследования',
      'Гормональный анализ крови',
      'УЗИ органов малого таза',
      'О чём диагноз не говорит',
      'Подготовка к приёму',
      'Главное',
    ],
    section1Body1: 'Диагноз «синдром поликистозных яичников» не ставится по одному-единственному анализу. Специалист сопоставляет несколько сведений: историю ваших циклов, симптомы, результаты осмотра, лабораторных анализов и, в зависимости от ситуации, УЗИ.',
    section1Body2: 'Цель состоит как в том, чтобы выявить признаки, соответствующие СПКЯ, так и в том, чтобы исключить другие причины, которыми можно объяснить нерегулярные месячные или некоторые гормональные симптомы.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Диагностика всегда индивидуальна. У двух женщин с СПКЯ симптомы и результаты анализов могут сильно отличаться.',
    section2Body: 'Обследование может проходить в несколько этапов. Не обязательно, что у всех оно проводится одинаково.',
    diagnosisSteps: [
      {title: 'Сбор анамнеза', text: 'Специалист выясняет вашу историю: циклы, симптомы, перенесённые заболевания и принимаемое лечение.'},
      {title: 'Осмотр', text: 'Врач ищет, в частности, признаки избытка андрогенов и оценивает ваше общее состояние.'},
      {title: 'Анализы крови', text: 'Для уточнения ситуации могут быть назначены гормональные и метаболические анализы.'},
      {title: 'УЗИ', text: 'Оно может дополнить обследование, показав состояние яичников.'},
    ],
    flowTitle: 'Весь процесс вкратце',
    flowItems: [
      'Анамнез и симптомы',
      'Осмотр',
      'Анализы в зависимости от ситуации',
      'УЗИ при необходимости',
    ],
    section3Body1: 'Анализ крови может быть назначен, чтобы выявить признаки избытка андрогенов, оценить некоторые гормоны, участвующие в репродуктивной функции, и поискать другие возможные причины ваших симптомов.',
    section3Body2: 'Набор анализов зависит от вашего возраста, симптомов, истории болезней и от того, что именно специалист хочет проверить.',
    bloodTests: [
      {title: 'Андрогены', text: 'Тестостерон и другие гормоны в зависимости от ситуации.'},
      {title: 'Функция щитовидной железы', text: 'Помогает, в частности, исключить некоторые причины нерегулярного цикла.'},
      {title: 'Метаболическое обследование', text: 'Уровень глюкозы в крови, а иногда и липидный профиль в зависимости от факторов риска.'},
    ],
    alertTitle: 'Важно',
    alertText: 'Гормональные результаты необходимо интерпретировать с учётом клинической картины. Одного показателя, как правило, недостаточно, чтобы поставить диагноз СПКЯ.',
    section4Body: 'УЗИ позволяет увидеть состояние яичников и, в частности, обнаружить большое количество мелких фолликулов. Оно также помогает специалисту поискать другие факторы, которые могли бы объяснить некоторые симптомы.',
    tip2Title: 'Полезно знать',
    tip2Text: 'Большое количество фолликулов на УЗИ не означает автоматически, что у вас СПКЯ. Результат необходимо оценивать вместе с остальными данными обследования.',
    section5Body: 'Диагноз СПКЯ не позволяет точно предсказать, как всё будет развиваться именно у вас. Синдром может проявляться у разных женщин совершенно по-разному.',
    mythItems: [
      'СПКЯ не означает автоматически бесплодие.',
      'СПКЯ не обязательно означает наличие кист.',
      'Один лишь диагноз не определяет лечение.',
      'Нормальное УЗИ не обязательно исключает СПКЯ.',
    ],
    section6Body: 'Несколько сведений, подготовленных заранее, помогут специалисту понять вашу историю и выбрать наиболее подходящие обследования.',
    appointmentQuestions: [
      'Как давно ваши циклы нерегулярны?',
      'Замечали ли вы акне, необычный рост волос или выпадение волос?',
      'Были ли в семье случаи СПКЯ или диабета?',
      'Планируете ли вы беременность в ближайшее время или в среднесрочной перспективе?',
    ],
    preparationTitle: 'Небольшой совет перед приёмом',
    preparationText: 'По возможности запишите даты последних месячных, примерную длительность циклов, замечаемые симптомы, а также принимаемые лекарства и добавки.',
    summaryTitle: 'Главное об обследовании',
    summaryItems: [
      'Диагноз основан на нескольких факторах, а не на одном анализе.',
      'Анализ крови может выявить некоторые гормональные нарушения и помочь исключить другие причины.',
      'УЗИ может дополнить обследование в зависимости от ситуации.',
      'Результаты всегда должен интерпретировать медицинский специалист.',
    ],
    finalTipTitle: 'Главное',
    finalTipText: 'Обследование при СПКЯ — это не один анализ и не окончательный приговор. Оно помогает понять, как работает ваш гормональный фон, поискать другие возможные причины и выстроить помощь, подходящую для вашей ситуации.',
    disclaimerText: 'Эта статья носит информационный характер и не заменяет медицинскую консультацию и персональную интерпретацию результатов ваших анализов.',
    shareMessage: 'Диагностика СПКЯ: анализы и обследование — AWA',
  },
  de: {
    badge: 'PCOS',
    title: 'PCOS-Diagnose:\nUntersuchungen und Abklärung',
    metaDuration: '7 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Fortgeschritten',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Wie PCOS diagnostiziert wird, welche Untersuchungen angeboten werden können und wie du dich in Ruhe auf deinen Termin vorbereitest.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Die diagnostische Abklärung verstehen',
      'Die wichtigsten Schritte der Abklärung',
      'Die Hormonuntersuchung im Blut',
      'Der Ultraschall des Beckens',
      'Was die Diagnose nicht aussagt',
      'Dich auf deinen Termin vorbereiten',
      'Das Wichtigste in Kürze',
    ],
    section1Body1: 'Die Diagnose des polyzystischen Ovarsyndroms stützt sich nicht auf eine einzelne Untersuchung. Das medizinische Fachpersonal führt mehrere Informationen zusammen: deine Zyklusgeschichte, mögliche Symptome, die klinische Untersuchung, Laborwerte und – je nach Situation – einen Ultraschall.',
    section1Body2: 'Ziel ist es zum einen, nach Merkmalen zu suchen, die zu PCOS passen, und zum anderen, andere Ursachen auszuschließen, die unregelmäßige Perioden oder bestimmte hormonelle Symptome erklären könnten.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Die Diagnose ist immer individuell. Zwei Frauen mit PCOS können sehr unterschiedliche Symptome und Untersuchungsergebnisse haben.',
    section2Body: 'Die Abklärung kann mehrere Schritte umfassen. Sie werden nicht unbedingt bei allen auf dieselbe Weise durchgeführt.',
    diagnosisSteps: [
      {title: 'Anamnese', text: 'Das Fachpersonal erfragt deine Vorgeschichte: Zyklen, Symptome, Krankengeschichte und Behandlungen.'},
      {title: 'Klinische Untersuchung', text: 'Dabei wird insbesondere nach Anzeichen für einen Androgenüberschuss gesucht und dein allgemeiner Zustand beurteilt.'},
      {title: 'Blutuntersuchung', text: 'Hormonelle und metabolische Werte können angefordert werden, um die Situation besser einzuordnen.'},
      {title: 'Ultraschall', text: 'Er kann die Abklärung ergänzen, indem das Aussehen der Eierstöcke beurteilt wird.'},
    ],
    flowTitle: 'Der Ablauf im Überblick',
    flowItems: [
      'Anamnese und Symptome',
      'Klinische Untersuchung',
      'Untersuchungen je nach Situation',
      'Ultraschall bei Bedarf',
    ],
    section3Body1: 'Eine Blutuntersuchung kann angeboten werden, um Anzeichen für einen Androgenüberschuss zu suchen, bestimmte Hormone der Fortpflanzungsfunktion zu beurteilen und nach anderen möglichen Ursachen deiner Symptome zu suchen.',
    section3Body2: 'Welche Untersuchungen gewählt werden, hängt von deinem Alter, deinen Symptomen, deiner Krankengeschichte und davon ab, was das Fachpersonal überprüfen möchte.',
    bloodTests: [
      {title: 'Androgene', text: 'Testosteron und je nach Situation weitere Hormone.'},
      {title: 'Schilddrüsenfunktion', text: 'Hilft insbesondere dabei, bestimmte Ursachen unregelmäßiger Zyklen auszuschließen.'},
      {title: 'Stoffwechselwerte', text: 'Blutzucker, je nach Risikofaktoren manchmal auch die Blutfette.'},
    ],
    alertTitle: 'Wichtig',
    alertText: 'Hormonwerte müssen im klinischen Zusammenhang gedeutet werden. Ein einzelner Wert reicht in der Regel nicht aus, um allein eine PCOS-Diagnose zu stellen.',
    section4Body: 'Mit einem Ultraschall lässt sich das Aussehen der Eierstöcke beurteilen und insbesondere nach einer hohen Anzahl kleiner Follikel suchen. Außerdem kann das Fachpersonal damit nach anderen Faktoren suchen, die bestimmte Symptome erklären könnten.',
    tip2Title: 'Gut zu wissen',
    tip2Text: 'Viele Follikel im Ultraschall bedeuten nicht automatisch, dass du PCOS hast. Das Ergebnis muss zusammen mit der übrigen Abklärung gedeutet werden.',
    section5Body: 'Eine PCOS-Diagnose erlaubt es nicht, genau vorherzusagen, wie sich die Dinge bei dir entwickeln werden. Das Syndrom kann sich von Frau zu Frau sehr unterschiedlich zeigen.',
    mythItems: [
      'PCOS bedeutet nicht automatisch Unfruchtbarkeit.',
      'PCOS bedeutet nicht unbedingt, dass Zysten vorhanden sind.',
      'Die Diagnose allein bestimmt nicht die Behandlung.',
      'Ein unauffälliger Ultraschall schließt PCOS nicht unbedingt aus.',
    ],
    section6Body: 'Ein paar vorab zusammengestellte Informationen können dem Fachpersonal helfen, deine Vorgeschichte zu verstehen und die passendsten Untersuchungen auszuwählen.',
    appointmentQuestions: [
      'Seit wann sind deine Zyklen unregelmäßig?',
      'Hast du Akne, ungewöhnlichen Haarwuchs oder Haarausfall bemerkt?',
      'Gibt es in deiner Familie PCOS oder Diabetes?',
      'Möchtest du kurz- oder mittelfristig schwanger werden?',
    ],
    preparationTitle: 'Ein kleiner Tipp vor dem Termin',
    preparationText: 'Notiere dir wenn möglich das Datum deiner letzten Periode, die ungefähre Länge deiner Zyklen, die Symptome, die dir auffallen, sowie alle Behandlungen oder Nahrungsergänzungsmittel, die du einnimmst.',
    summaryTitle: 'Das Wesentliche der Abklärung',
    summaryItems: [
      'Die Diagnose stützt sich auf mehrere Faktoren, nicht auf eine einzelne Untersuchung.',
      'Eine Blutuntersuchung kann bestimmte hormonelle Ungleichgewichte aufspüren und andere Ursachen ausschließen.',
      'Ein Ultraschall kann die Abklärung je nach Situation ergänzen.',
      'Die Ergebnisse sollten immer von medizinischem Fachpersonal gedeutet werden.',
    ],
    finalTipTitle: 'Das Wichtigste in Kürze',
    finalTipText: 'Eine PCOS-Abklärung ist weder eine einzelne Untersuchung noch ein endgültiges Urteil. Sie hilft dir, die Funktionsweise deines Hormonhaushalts zu verstehen, nach anderen möglichen Ursachen zu suchen und eine Betreuung aufzubauen, die zu deiner Situation passt.',
    disclaimerText: 'Dieser Artikel dient nur der Information und ersetzt weder eine ärztliche Beratung noch die persönliche Deutung deiner Untersuchungsergebnisse.',
    shareMessage: 'PCOS-Diagnose: Untersuchungen und Abklärung — AWA',
  },
  zh: {
      badge: '多囊卵巢综合征（PCOS）',
      title: 'PCOS 诊断：\n检查与评估',
      metaDuration: '阅读约 7 分钟',
      metaType: '指南',
      metaLevel: '进阶',
      metaValidated: '已审阅内容',
      intro: 'PCOS 是如何诊断的，可能会做哪些检查，以及如何从容地为就诊做准备。',
      contentsTitle: '本文内容',
      topics: [
        '了解诊断评估',
        '评估的主要步骤',
        '激素血液检查',
        '盆腔超声检查',
        '诊断并不能告诉你的事',
        '为就诊做准备',
        '要点回顾',
      ],
      section1Body1: '多囊卵巢综合征的诊断并不依赖单一检查。医疗专业人员会综合多方面的信息：你的月经周期史、各种症状、临床检查、实验室检查，并视情况做超声检查。',
      section1Body2: '目的既是寻找与 PCOS 相符的特征，也是排除其他可能导致月经不规律或某些激素相关症状的原因。',
      tip1Title: '小贴士',
      tip1Text: '诊断总是因人而异的。两位 PCOS 患者的症状和检查结果可能大不相同。',
      section2Body: '评估可以分为几个步骤。这些步骤不一定对每个人都以同样的方式进行。',
      diagnosisSteps: [
        {
          title: '问诊',
          text: '专业人员会了解你的情况：月经周期、症状、既往病史和用药。',
        },
        {
          title: '临床检查',
          text: '尤其会查看是否有雄激素过多的表现，并评估你的整体状况。',
        },
        {
          title: '血液检查',
          text: '可能会要求做激素和代谢方面的检查，以便进一步明确情况。',
        },
        {
          title: '超声检查',
          text: '通过观察卵巢的外观，可以补充完善评估。',
        },
      ],
      flowTitle: '流程一览',
      flowItems: [
        '问诊与症状',
        '临床检查',
        '视情况做检查',
        '必要时做超声检查',
      ],
      section3Body1: '可能会建议做血液检查，以寻找雄激素过多的迹象，评估某些与生殖功能有关的激素，并排查症状的其他可能原因。',
      section3Body2: '具体选择哪些检查，取决于你的年龄、症状、病史，以及专业人员想要确认的内容。',
      bloodTests: [
        {
          title: '雄激素',
          text: '睾酮，以及视情况检查的其他激素。',
        },
        {
          title: '甲状腺功能',
          text: '尤其有助于排除某些导致月经周期不规律的原因。',
        },
        {
          title: '代谢检查',
          text: '血糖，视风险因素有时还会查血脂。',
        },
      ],
      alertTitle: '重要提示',
      alertText: '激素检查结果需要结合临床情况来解读。通常仅凭单一数值，不足以得出 PCOS 的诊断结论。',
      section4Body: '超声检查可以用来观察卵巢的外观，尤其是查看是否有数量较多的小卵泡。它还能让专业人员排查可能导致某些症状的其他因素。',
      tip2Title: '小贴士',
      tip2Text: '超声检查看到很多卵泡，并不意味着一定患有 PCOS。结果需要结合其他评估内容一起解读。',
      section5Body: '得到 PCOS 的诊断，并不能准确预测你今后会如何发展。这种综合征在不同的人身上，表现可能非常不同。',
      mythItems: [
        'PCOS 并不一定意味着不孕。',
        'PCOS 并不一定意味着有囊肿。',
        '仅凭诊断本身并不能决定治疗方案。',
        '超声检查正常，也不一定能排除 PCOS。',
      ],
      section6Body: '提前准备好一些信息，可以帮助专业人员了解你的情况，并选择最合适的检查。',
      appointmentQuestions: [
        '你的月经周期不规律有多久了？',
        '你有没有发现痤疮、异常的毛发生长或脱发？',
        '家族中有没有 PCOS 或糖尿病病史？',
        '你是否希望在短期或中期内怀孕？',
      ],
      preparationTitle: '就诊前的小建议',
      preparationText: '如果可以，请记下上次月经的日期、月经周期的大致长度、你注意到的症状，以及正在使用的药物或补充剂。',
      summaryTitle: '评估的要点',
      summaryItems: [
        '诊断依据的是多方面因素，而不是单一检查。',
        '血液检查可以寻找某些激素失衡的迹象，并排除其他原因。',
        '视情况，超声检查可以补充完善评估。',
        '检查结果始终应由医疗专业人员来解读。',
      ],
      finalTipTitle: '要点回顾',
      finalTipText: 'PCOS 的评估不是一次检查，也不是最终的定论。它帮助你了解自己的激素状况、排查其他可能的原因，并制定适合你情况的诊疗方案。',
      disclaimerText: '本文仅供参考，不能替代医疗就诊，也不能替代对你检查结果的个性化解读。',
      shareMessage: 'PCOS 诊断：检查与评估 — AWA',
    },
  id: {
    badge: 'PCOS',
    title: 'Diagnosis PCOS:\npemeriksaan dan rangkaian tesnya',
    metaDuration: '7 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Menengah',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Bagaimana PCOS didiagnosis, tes apa saja yang mungkin ditawarkan, dan cara mempersiapkan diri dengan tenang untuk janji temumu.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Memahami rangkaian pemeriksaan diagnosis',
      'Langkah-langkah utama pemeriksaan',
      'Tes darah hormonal',
      'USG panggul',
      'Hal yang tidak dikatakan oleh diagnosis',
      'Mempersiapkan janji temumu',
      'Poin penting',
    ],
    section1Body1: 'Diagnosis sindrom ovarium polikistik (PCOS) tidak bergantung pada satu tes saja. Tenaga kesehatan menggabungkan beberapa informasi: riwayat siklusmu, gejala yang ada, pemeriksaan fisik, tes laboratorium, dan, sesuai situasinya, USG.',
    section1Body2: 'Tujuannya adalah mencari ciri-ciri yang sesuai dengan PCOS sekaligus menyingkirkan penyebab lain yang dapat menjelaskan haid tidak teratur atau gejala hormonal tertentu.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Diagnosis selalu bersifat personal. Dua perempuan dengan PCOS bisa memiliki gejala dan hasil tes yang sangat berbeda.',
    section2Body: 'Rangkaian pemeriksaan dapat terdiri dari beberapa langkah. Tidak semuanya harus dilakukan dengan cara yang sama untuk setiap orang.',
    diagnosisSteps: [
      {
        title: 'Anamnesis',
        text: 'Tenaga kesehatan menggali riwayatmu: siklus, gejala, latar belakang medis, dan pengobatan.',
      },
      {
        title: 'Pemeriksaan fisik',
        text: 'Mereka terutama mencari tanda kelebihan androgen dan menilai kondisi umummu.',
      },
      {
        title: 'Pemeriksaan darah',
        text: 'Tes hormonal dan metabolik mungkin diminta untuk memperjelas situasi.',
      },
      {
        title: 'USG',
        text: 'USG dapat melengkapi pemeriksaan dengan mengamati tampilan ovarium.',
      },
    ],
    flowTitle: 'Gambaran alurnya',
    flowItems: [
      'Riwayat dan gejala',
      'Pemeriksaan fisik',
      'Tes sesuai situasi',
      'USG jika diperlukan',
    ],
    section3Body1: 'Tes darah mungkin ditawarkan untuk mencari tanda kelebihan androgen, menilai hormon tertentu yang berperan dalam fungsi reproduksi, dan mencari kemungkinan penyebab lain dari gejalamu.',
    section3Body2: 'Tes yang dipilih bergantung pada usia, gejala, riwayat medis, dan hal yang ingin diperiksa oleh tenaga kesehatan.',
    bloodTests: [
      {
        title: 'Androgen',
        text: 'Testosteron dan hormon lain sesuai situasi.',
      },
      {
        title: 'Fungsi tiroid',
        text: 'Membantu terutama dalam menyingkirkan sebagian penyebab siklus tidak teratur.',
      },
      {
        title: 'Pemeriksaan metabolik',
        text: 'Gula darah, terkadang panel lipid tergantung faktor risiko.',
      },
    ],
    alertTitle: 'Penting',
    alertText: 'Hasil hormonal perlu ditafsirkan bersama konteks klinis. Satu nilai biasanya tidak cukup, dengan sendirinya, untuk menyimpulkan diagnosis PCOS.',
    section4Body: 'USG dapat digunakan untuk mengamati tampilan ovarium dan terutama mencari jumlah folikel kecil yang banyak. USG juga memungkinkan tenaga kesehatan mencari faktor lain yang dapat menjelaskan gejala tertentu.',
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Melihat banyak folikel pada USG tidak otomatis berarti kamu menderita PCOS. Hasilnya perlu ditafsirkan bersama pemeriksaan lainnya.',
    section5Body: 'Menerima diagnosis PCOS tidak memungkinkan untuk memprediksi secara pasti bagaimana perkembangannya padamu. Sindrom ini bisa muncul dengan sangat berbeda dari satu orang ke orang lain.',
    mythItems: [
      'PCOS tidak otomatis berarti infertilitas.',
      'PCOS tidak selalu berarti memiliki kista.',
      'Diagnosis saja tidak menentukan pengobatannya.',
      'USG yang normal belum tentu menyingkirkan PCOS.',
    ],
    section6Body: 'Beberapa informasi yang disiapkan sebelumnya dapat membantu tenaga kesehatan memahami riwayatmu dan memilih tes yang paling relevan.',
    appointmentQuestions: [
      'Sudah berapa lama siklusmu tidak teratur?',
      'Apakah kamu memperhatikan jerawat, pertumbuhan rambut yang tidak biasa, atau rambut rontok?',
      'Apakah ada riwayat PCOS atau diabetes dalam keluarga?',
      'Apakah kamu ingin hamil dalam waktu dekat atau menengah?',
    ],
    preparationTitle: 'Tips kecil sebelum janji temu',
    preparationText: 'Jika memungkinkan, catat tanggal haid terakhirmu, perkiraan lama siklusmu, gejala yang kamu rasakan, serta pengobatan atau suplemen yang kamu konsumsi.',
    summaryTitle: 'Intinya dari pemeriksaan',
    summaryItems: [
      'Diagnosis bergantung pada beberapa faktor, bukan satu tes saja.',
      'Tes darah dapat mencari ketidakseimbangan hormonal tertentu dan menyingkirkan penyebab lain.',
      'USG dapat melengkapi pemeriksaan sesuai situasi.',
      'Hasil selalu perlu ditafsirkan oleh tenaga kesehatan.',
    ],
    finalTipTitle: 'Poin penting',
    finalTipText: 'Pemeriksaan PCOS bukan satu tes atau vonis akhir. Pemeriksaan ini membantumu memahami cara kerja hormonmu, mencari kemungkinan penyebab lain, dan menyusun perawatan yang sesuai dengan situasimu.',
    disclaimerText: 'Artikel ini hanya untuk informasi dan tidak menggantikan konsultasi medis atau penafsiran hasil tesmu yang dipersonalisasi.',
    shareMessage: 'Diagnosis PCOS: pemeriksaan dan rangkaian tesnya — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PcosDiagnosisArticleScreen({
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
        {/* HERO */}
        <View style={styles.heroWrap}>
          <Image source={HERO} resizeMode="cover" style={styles.hero} />

          <View
            style={[
              styles.top,
              {
                paddingTop: getTopPadding(insets.top, true),
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

        {/* ARTICLE */}
        <View style={styles.article}>
          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">{content.badge}</AwaText>
          </View>

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

          {/* METADATA */}
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

          {/* SOMMAIRE */}
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

          {/* SECTION 1 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            1. {content.topics[0]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body2}
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

          {/* SECTION 2 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.topics[1]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section2Body}
          </AwaText>

          {/* DIAGNOSTIC STEPS */}
          <View style={styles.stepsContainer}>
            {DIAGNOSIS_STEP_META.map((step, index) => (
              <AwaCard variant="filled" padding="none" key={step.number} style={styles.stepCard}>
                <View style={styles.stepTop}>
                  <View style={styles.stepNumber}>
                    <AwaText variant="labelSmall" emphasized colorRole="primary">
                      {step.number}
                    </AwaText>
                  </View>

                  <MaterialDesignIcons
                    name={step.icon as never}
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="titleSmall" emphasized style={styles.stepTitle}>
                  {content.diagnosisSteps[index].title}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.stepText}>
                  {content.diagnosisSteps[index].text}
                </AwaText>
              </AwaCard>
            ))}
          </View>

          {/* FLOW */}
          <AwaCard variant="filled" padding="none" style={styles.flowCard}>
            <View style={styles.flowHeader}>
              <MaterialDesignIcons
                name="format-list-numbered"
                size={20}
                color={theme.colors.primary}
              />

              <AwaText variant="titleSmall" emphasized>
                {content.flowTitle}
              </AwaText>
            </View>

            <View style={styles.flowLine}>
              <View style={styles.flowDot} />
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant">{content.flowItems[0]}</AwaText>
            </View>

            <View style={styles.flowLine}>
              <View style={styles.flowDot} />
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant">{content.flowItems[1]}</AwaText>
            </View>

            <View style={styles.flowLine}>
              <View style={styles.flowDot} />
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant">{content.flowItems[2]}</AwaText>
            </View>

            <View style={styles.flowLine}>
              <View style={styles.flowDot} />
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant">{content.flowItems[3]}</AwaText>
            </View>
          </AwaCard>

          {/* SECTION 3 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            3. {content.topics[2]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body2}
          </AwaText>

          <View style={styles.testsGrid}>
            {BLOOD_TEST_META.map((test, index) => (
              <AwaCard variant="filled" padding="none" key={content.bloodTests[index].title} style={styles.testCard}>
                <View style={styles.testIcon}>
                  <MaterialDesignIcons
                    name={test.icon as never}
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="titleSmall" emphasized style={styles.testTitle}>
                  {content.bloodTests[index].title}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.testText}>
                  {content.bloodTests[index].text}
                </AwaText>
              </AwaCard>
            ))}
          </View>

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

          {/* SECTION 4 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            4. {content.topics[3]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section4Body}
          </AwaText>

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

          {/* SECTION 5 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            5. {content.topics[4]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section5Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.mythList}>
            <View style={styles.mythRow}>
              <MaterialDesignIcons
                name="close-circle-outline"
                size={19}
                color={theme.colors.warning}
              />

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.mythText}>
                {content.mythItems[0]}
              </AwaText>
            </View>

            <View style={styles.mythRow}>
              <MaterialDesignIcons
                name="close-circle-outline"
                size={19}
                color={theme.colors.warning}
              />

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.mythText}>
                {content.mythItems[1]}
              </AwaText>
            </View>

            <View style={styles.mythRow}>
              <MaterialDesignIcons
                name="close-circle-outline"
                size={19}
                color={theme.colors.warning}
              />

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.mythText}>
                {content.mythItems[2]}
              </AwaText>
            </View>

            <View style={styles.mythRow}>
              <MaterialDesignIcons
                name="close-circle-outline"
                size={19}
                color={theme.colors.warning}
              />

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.mythText}>
                {content.mythItems[3]}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 6 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            6. {content.topics[5]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section6Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.appointmentQuestions.map(item => (
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

          <AwaCard variant="filled" padding="none" style={styles.preparationCard}>
            <View style={styles.preparationHeader}>
              <MaterialDesignIcons
                name="notebook-edit-outline"
                size={22}
                color={theme.colors.primary}
              />

              <AwaText variant="titleSmall" emphasized style={styles.preparationTitle}>
                {content.preparationTitle}
              </AwaText>
            </View>

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.preparationText}>
              {content.preparationText}
            </AwaText>
          </AwaCard>

          {/* SECTION 7 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>7. {content.topics[6]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={24}
                color={theme.colors.primary}
              />

              <AwaText variant="titleSmall" emphasized>
                {content.summaryTitle}
              </AwaText>
            </View>

            <View style={styles.summaryRow}>
              <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.summaryNumber}>01</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
                {content.summaryItems[0]}
              </AwaText>
            </View>

            <View style={styles.summaryRow}>
              <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.summaryNumber}>02</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
                {content.summaryItems[1]}
              </AwaText>
            </View>

            <View style={styles.summaryRow}>
              <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.summaryNumber}>03</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
                {content.summaryItems[2]}
              </AwaText>
            </View>

            <View style={styles.summaryRow}>
              <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.summaryNumber}>04</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
                {content.summaryItems[3]}
              </AwaText>
            </View>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.finalTip}>
            <MaterialDesignIcons
              name="heart-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.finalTipTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.finalTipText}
              </AwaText>
            </View>
          </AwaCard>

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="information-outline"
              size={18}
              color={theme.colors.textMuted}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.disclaimerText}>
              {content.disclaimerText}
            </AwaText>
          </View>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={7}
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
    marginTop: 28,
  },

  body: {
    marginTop: 8,
  },

  /* PRINCIPALES ÉTAPES */

  stepsContainer: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },

  stepCard: {
    width: '48.5%',
    minHeight: 178,
    padding: 12,
  },

  stepTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  stepNumber: {
    width: 31,
    height: 31,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },


  stepTitle: {
    marginTop: 12,
  },

  stepText: {
    marginTop: 8,
  },

  /* PARCOURS */

  flowCard: {
    marginTop: 16,
    padding: 16,
  },

  flowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },


  flowLine: {
    minHeight: 31,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  flowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },


  /* ANALYSES */

  testsGrid: {
    marginTop: 16,
    gap: 8,
  },

  testCard: {
    padding: 12,
  },

  testIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  testTitle: {
    marginTop: 8,
  },

  testText: {
    marginTop: 4,
  },

  /* CHECK LIST */

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

  checkText: {
    flex: 1,
  },

  /* MYTHES */

  mythList: {
    marginTop: 12,
    padding: 16,
  },

  mythRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },

  mythText: {
    flex: 1,
  },

  /* TIP */

  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  tipCopy: {
    flex: 1,
    marginLeft: 12,
  },


  tipText: {
    marginTop: 4,
  },

  /* ALERT */

  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  /* PREPARATION */

  preparationCard: {
    marginTop: 16,
    padding: 16,
  },

  preparationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  preparationTitle: {
    flex: 1,
  },

  preparationText: {
    marginTop: 8,
  },

  /* SUMMARY */

  summaryCard: {
    marginTop: 16,
    padding: 16,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },


  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  summaryNumber: {
    width: 31,
    paddingTop: 2,
  },

  summaryText: {
    flex: 1,
  },

  finalTip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  disclaimer: {
    marginTop: 20,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  disclaimerText: {
    flex: 1,
  },
  });
}
