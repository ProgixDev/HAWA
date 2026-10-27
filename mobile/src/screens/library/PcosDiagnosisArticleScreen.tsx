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
const CONTENT = withBrazilianPortuguese('PcosDiagnosis', {
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
  hi: {
    badge: 'PCOS',
    title: 'PCOS की पहचान:\nजाँचें और वर्कअप',
    metaDuration: '7 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'मध्यम स्तर',
    metaValidated: 'समीक्षा किया गया कंटेंट',
    intro: 'PCOS की पहचान कैसे होती है, कौन-सी जाँचें सुझाई जा सकती हैं, और अपने अपॉइंटमेंट की शांति से तैयारी कैसे करें।',
    contentsTitle: 'इस लेख में',
    topics: [
      'जाँच-प्रक्रिया को समझना',
      'जाँच के मुख्य चरण',
      'हार्मोन का ब्लड टेस्ट',
      'पेल्विक अल्ट्रासाउंड',
      'निदान आपको क्या नहीं बताता',
      'अपॉइंटमेंट की तैयारी',
      'मुख्य बातें',
    ],
    section1Body1: 'पॉलीसिस्टिक ओवरी सिंड्रोम (PCOS) की पहचान किसी एक टेस्ट पर निर्भर नहीं करती। स्वास्थ्य विशेषज्ञ कई जानकारियों को साथ रखकर देखते हैं: आपके चक्र का इतिहास, अगर कोई लक्षण हों तो वे, शारीरिक जाँच, लैब टेस्ट, और स्थिति के अनुसार अल्ट्रासाउंड।',
    section1Body2: 'मकसद एक ओर PCOS से मेल खाने वाली बातों को देखना है, और दूसरी ओर उन दूसरे कारणों को बाहर करना है जिनसे अनियमित पीरियड्स या कुछ हार्मोनल लक्षण हो सकते हैं।',
    tip1Title: 'जानना अच्छा रहेगा',
    tip1Text: 'निदान हमेशा हर महिला के हिसाब से अलग होता है। PCOS वाली दो महिलाओं के लक्षण और टेस्ट के नतीजे बहुत अलग हो सकते हैं।',
    section2Body: 'जाँच कई चरणों में हो सकती है। ज़रूरी नहीं कि हर महिला के लिए ये सभी चरण एक ही तरह से किए जाएँ।',
    diagnosisSteps: [
      {
        title: 'इतिहास लेना',
        text: 'विशेषज्ञ आपका इतिहास जानते हैं: चक्र, लक्षण, पुरानी बीमारियाँ और चल रहा इलाज।',
      },
      {
        title: 'शारीरिक जाँच',
        text: 'वे खास तौर पर एंड्रोजन की अधिकता के संकेत देखते हैं और आपकी सामान्य स्थिति का आकलन करते हैं।',
      },
      {
        title: 'ब्लड वर्कअप',
        text: 'स्थिति को साफ़ करने के लिए हार्मोन और मेटाबॉलिक टेस्ट कराने को कहा जा सकता है।',
      },
      {
        title: 'अल्ट्रासाउंड',
        text: 'इससे अंडाशय (ओवरी) की बनावट देखकर जाँच को पूरा किया जा सकता है।',
      },
    ],
    flowTitle: 'पूरी प्रक्रिया एक नज़र में',
    flowItems: [
      'इतिहास और लक्षण',
      'शारीरिक जाँच',
      'स्थिति के अनुसार टेस्ट',
      'ज़रूरत हो तो अल्ट्रासाउंड',
    ],
    section3Body1: 'ब्लड टेस्ट इसलिए सुझाया जा सकता है ताकि एंड्रोजन की अधिकता के संकेत देखे जाएँ, प्रजनन क्रिया से जुड़े कुछ हार्मोन का आकलन हो, और आपके लक्षणों के दूसरे संभावित कारणों की तलाश हो।',
    section3Body2: 'कौन-से टेस्ट चुने जाएँगे, यह आपकी उम्र, आपके लक्षणों, आपके मेडिकल इतिहास और विशेषज्ञ जिस बात की जाँच करना चाहते हैं, उस पर निर्भर करता है।',
    bloodTests: [
      {
        title: 'एंड्रोजन',
        text: 'टेस्टोस्टेरोन और स्थिति के अनुसार दूसरे हार्मोन।',
      },
      {
        title: 'थायरॉइड की कार्यप्रणाली',
        text: 'अनियमित चक्र के कुछ कारणों को बाहर करने में खास तौर पर मदद करता है।',
      },
      {
        title: 'मेटाबॉलिक वर्कअप',
        text: 'ब्लड ग्लूकोज़, और जोखिम कारकों के अनुसार कभी-कभी लिपिड पैनल।',
      },
    ],
    alertTitle: 'ज़रूरी',
    alertText: 'हार्मोन के नतीजों को मरीज़ की क्लिनिकल स्थिति के साथ मिलाकर समझना ज़रूरी है। आमतौर पर अकेला एक मान PCOS का निदान तय करने के लिए काफ़ी नहीं होता।',
    section4Body: 'अल्ट्रासाउंड से अंडाशय की बनावट देखी जा सकती है, खास तौर पर छोटे फ़ॉलिकल की ज़्यादा संख्या के लिए। इससे विशेषज्ञ उन दूसरे कारकों को भी देख पाते हैं जिनसे कुछ लक्षण हो सकते हैं।',
    tip2Title: 'जानना अच्छा रहेगा',
    tip2Text: 'अल्ट्रासाउंड में बहुत सारे फ़ॉलिकल दिखने का मतलब अपने आप यह नहीं कि आपको PCOS है। नतीजे को बाकी जाँच के साथ मिलाकर समझना ज़रूरी है।',
    section5Body: 'PCOS का निदान मिलने से यह ठीक-ठीक अनुमान नहीं लगाया जा सकता कि आपके लिए आगे चीज़ें कैसे बढ़ेंगी। यह सिंड्रोम हर महिला में बहुत अलग तरह से दिख सकता है।',
    mythItems: [
      'PCOS का मतलब अपने आप बाँझपन नहीं होता।',
      'PCOS का मतलब ज़रूरी नहीं कि सिस्ट होना ही हो।',
      'सिर्फ़ निदान से इलाज तय नहीं होता।',
      'सामान्य अल्ट्रासाउंड से PCOS होने की संभावना ज़रूरी नहीं कि खत्म हो जाए।',
    ],
    section6Body: 'पहले से तैयार की गई कुछ जानकारियाँ विशेषज्ञ को आपका इतिहास समझने और सबसे उपयोगी टेस्ट चुनने में मदद कर सकती हैं।',
    appointmentQuestions: [
      'आपके चक्र कब से अनियमित हैं?',
      'क्या आपने मुहांसे, अनचाहे बाल उगना या बाल झड़ना देखा है?',
      'क्या परिवार में PCOS या डायबिटीज़ का इतिहास है?',
      'क्या आप निकट या कुछ समय में गर्भवती होना चाहती हैं?',
    ],
    preparationTitle: 'अपॉइंटमेंट से पहले एक छोटी सलाह',
    preparationText: 'हो सके तो अपने आखिरी पीरियड की तारीखें, चक्र की लगभग लंबाई, जो लक्षण आप महसूस कर रही हैं, और जो दवाएँ या सप्लीमेंट आप ले रही हैं, उन्हें नोट कर लें।',
    summaryTitle: 'जाँच की ज़रूरी बातें',
    summaryItems: [
      'निदान कई बातों पर निर्भर करता है, किसी एक टेस्ट पर नहीं।',
      'ब्लड टेस्ट से कुछ हार्मोनल असंतुलन देखे जा सकते हैं और दूसरे कारणों को बाहर किया जा सकता है।',
      'स्थिति के अनुसार अल्ट्रासाउंड जाँच को पूरा कर सकता है।',
      'नतीजों को हमेशा किसी स्वास्थ्य विशेषज्ञ से समझवाना चाहिए।',
    ],
    finalTipTitle: 'मुख्य बातें',
    finalTipText: 'PCOS की जाँच कोई एक टेस्ट या अंतिम फ़ैसला नहीं है। यह आपके हार्मोन के काम करने के तरीके को समझने, दूसरे संभावित कारणों को देखने और आपकी स्थिति के अनुकूल देखभाल बनाने में मदद करती है।',
    disclaimerText: 'यह लेख सिर्फ़ जानकारी के लिए है और डॉक्टर से परामर्श या आपके टेस्ट नतीजों की व्यक्तिगत व्याख्या का विकल्प नहीं है।',
    shareMessage: 'PCOS की पहचान: जाँचें और वर्कअप — AWA',
  },
  sq: {
    badge: 'PCOS',
    title: 'Diagnoza e PCOS:\ntestet dhe vlerësimi',
    metaDuration: '7 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Mesatar',
    metaValidated: 'Përmbajtje e shqyrtuar',
    intro: 'Si diagnostikohet PCOS, cilat teste mund të propozohen dhe si të përgatitesh me qetësi për takimin tënd.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Të kuptosh vlerësimin diagnostikues',
      'Hapat kryesorë të vlerësimit',
      'Analiza hormonale e gjakut',
      'Ekografia e legenit',
      'Çfarë nuk të tregon diagnoza',
      'Përgatitja për takimin tënd',
      'Çfarë të mbash mend',
    ],
    section1Body1: 'Diagnoza e sindromës së ovareve polikistike (PCOS) nuk mbështetet në një test të vetëm. Profesionisti i shëndetësisë bashkon disa informacione: historikun e cikleve të tua, simptomat e mundshme, ekzaminimin klinik, analizat laboratorike dhe, sipas situatës, një ekografi.',
    section1Body2: 'Qëllimi është njëkohësisht të kërkohen tipare që përputhen me PCOS dhe të përjashtohen shkaqe të tjera që mund të shpjegojnë menstruacionet e parregullta ose disa simptoma hormonale.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Diagnoza është gjithmonë e personalizuar. Dy gra me PCOS mund të kenë simptoma dhe rezultate testesh shumë të ndryshme.',
    section2Body: 'Vlerësimi mund të ndjekë disa hapa. Ata nuk kryhen domosdoshmërisht në të njëjtën mënyrë për të gjitha.',
    diagnosisSteps: [
      {
        title: 'Marrja e historikut',
        text: 'Profesionisti mbledh historikun tënd: ciklet, simptomat, të kaluarën mjekësore dhe trajtimet.',
      },
      {
        title: 'Ekzaminimi klinik',
        text: 'Ai kërkon veçanërisht shenja të teprisë së androgjeneve dhe vlerëson gjendjen tënde të përgjithshme.',
      },
      {
        title: 'Analizat e gjakut',
        text: 'Mund të kërkohen analiza hormonale dhe metabolike për të sqaruar situatën.',
      },
      {
        title: 'Ekografia',
        text: 'Ajo mund ta plotësojë vlerësimin duke vëzhguar pamjen e ovareve.',
      },
    ],
    flowTitle: 'Procesi me një shikim',
    flowItems: [
      'Historiku dhe simptomat',
      'Ekzaminimi klinik',
      'Teste sipas situatës',
      'Ekografi nëse është e nevojshme',
    ],
    section3Body1: 'Mund të propozohet një analizë gjaku për të kërkuar shenja të teprisë së androgjeneve, për të vlerësuar disa hormone që ndikojnë në funksionin riprodhues dhe për të kërkuar shkaqe të tjera të mundshme të simptomave të tua.',
    section3Body2: 'Testet e zgjedhura varen nga mosha jote, simptomat, historiku yt mjekësor dhe ajo që profesionisti dëshiron të kontrollojë.',
    bloodTests: [
      {
        title: 'Androgjenet',
        text: 'Testosteroni dhe hormone të tjera sipas situatës.',
      },
      {
        title: 'Funksioni i tiroides',
        text: 'Ndihmon veçanërisht për të përjashtuar disa shkaqe të cikleve të parregullta.',
      },
      {
        title: 'Vlerësimi metabolik',
        text: 'Glicemia dhe, ndonjëherë, një profil lipidesh në varësi të faktorëve të rrezikut.',
      },
    ],
    alertTitle: 'E rëndësishme',
    alertText: 'Rezultatet hormonale duhet të interpretohen së bashku me kontekstin klinik. Një vlerë e vetme zakonisht nuk mjafton, vetë ajo, për të konkluduar një diagnozë PCOS.',
    section4Body: 'Ekografia mund të përdoret për të vëzhguar pamjen e ovareve dhe për të kërkuar veçanërisht një numër të lartë follikulesh të vogla. Ajo e lejon profesionistin edhe të kërkojë faktorë të tjerë që mund të shpjegojnë disa simptoma.',
    tip2Title: 'Mirë është ta dish',
    tip2Text: 'Të shohësh shumë follikula në ekografi nuk do të thotë automatikisht se ke PCOS. Rezultati duhet të interpretohet së bashku me pjesën tjetër të vlerësimit.',
    section5Body: 'Marrja e një diagnoze PCOS nuk bën të mundur parashikimin e saktë të mënyrës se si do të zhvillohen gjërat për ty. Sindroma mund të shfaqet në mënyra shumë të ndryshme nga një person te tjetri.',
    mythItems: [
      'PCOS nuk do të thotë automatikisht infertilitet.',
      'PCOS nuk do të thotë domosdoshmërisht të kesh kista.',
      'Diagnoza vetëm nuk përcakton trajtimin.',
      'Një ekografi normale nuk e përjashton domosdoshmërisht PCOS.',
    ],
    section6Body: 'Disa informacione të përgatitura paraprakisht mund ta ndihmojnë profesionistin të kuptojë historikun tënd dhe të zgjedhë testet më të përshtatshme.',
    appointmentQuestions: [
      'Prej sa kohësh janë të parregullta ciklet e tua?',
      'A ke vënë re akne, rritje të pazakontë të qimeve ose rënie të flokëve?',
      'A ka në familje histori të PCOS ose diabetit?',
      'A dëshiron të mbetesh shtatzënë në afat të shkurtër ose të mesëm?',
    ],
    preparationTitle: 'Një këshillë e vogël para takimit',
    preparationText: 'Nëse është e mundur, shëno datat e menstruacioneve të tua të fundit, kohëzgjatjen përafërsisht të cikleve të tua, simptomat që po vëren dhe çdo trajtim ose suplement që po merr.',
    summaryTitle: 'Thelbi i vlerësimit',
    summaryItems: [
      'Diagnoza mbështetet në disa faktorë, jo në një test të vetëm.',
      'Një analizë gjaku mund të kërkojë disa çekuilibra hormonalë dhe të përjashtojë shkaqe të tjera.',
      'Një ekografi mund ta plotësojë vlerësimin sipas situatës.',
      'Rezultatet duhet të interpretohen gjithmonë nga një profesionist i shëndetësisë.',
    ],
    finalTipTitle: 'Çfarë të mbash mend',
    finalTipText: 'Një vlerësim për PCOS nuk është një test i vetëm dhe as një verdikt përfundimtar. Ai të ndihmon të kuptosh funksionimin tënd hormonal, të kërkosh shkaqe të tjera të mundshme dhe të ndërtosh një kujdes që i përshtatet situatës sate.',
    disclaimerText: 'Ky artikull është vetëm për informim dhe nuk zëvendëson një konsultë mjekësore as interpretimin e personalizuar të rezultateve të analizave të tua.',
    shareMessage: 'Diagnoza e PCOS: testet dhe vlerësimi — AWA',
  },
  ja: {
    badge: 'PCOS',
    title: 'PCOSの診断：\n検査と精密検査',
    metaDuration: '読了まで7分',
    metaType: 'ガイド',
    metaLevel: '中級',
    metaValidated: '確認済みの内容',
    intro: 'PCOSがどのように診断されるか、どのような検査が提案されることがあるか、そして落ち着いて診察に備える方法を紹介します。',
    contentsTitle: 'この記事の内容',
    topics: [
      '診断のための検査を理解する',
      '検査の主な流れ',
      'ホルモンの血液検査',
      '骨盤の超音波検査',
      '診断からはわからないこと',
      '診察の準備',
      '要点',
    ],
    section1Body1: '多嚢胞性卵巣症候群（PCOS）の診断は、1つの検査だけで決まるものではありません。医療従事者は、周期の経過、症状の有無、診察所見、血液検査、そして状況によっては超音波検査など、複数の情報を総合して判断します。',
    section1Body2: '目的は、PCOSに当てはまる特徴を調べることと、生理不順や一部のホルモン関連の症状を説明しうるほかの原因を除外することの両方です。',
    tip1Title: '知っておくと役立つこと',
    tip1Text: '診断は常に一人ひとりに合わせて行われます。PCOSのある女性2人でも、症状や検査結果が大きく異なることがあります。',
    section2Body: '検査はいくつかの段階に分けて進められることがあります。必ずしも全員が同じ方法ですべてを受けるわけではありません。',
    diagnosisSteps: [
      {
        title: '問診',
        text: '医療従事者が、周期、症状、既往歴、使用中の治療などについて聞き取ります。',
      },
      {
        title: '診察',
        text: 'とくにアンドロゲン過剰のサインがないかを調べ、全身の状態を確認します。',
      },
      {
        title: '血液検査',
        text: '状況をはっきりさせるために、ホルモンや代謝に関する検査が依頼されることがあります。',
      },
      {
        title: '超音波検査',
        text: '卵巣の見え方を観察することで、検査を補完できます。',
      },
    ],
    flowTitle: '流れの全体像',
    flowItems: [
      '問診と症状の確認',
      '診察',
      '状況に応じた検査',
      '必要に応じて超音波検査',
    ],
    section3Body1: '血液検査では、アンドロゲン過剰のサインを調べたり、生殖機能に関わる一部のホルモンを評価したり、症状のほかの考えられる原因を探したりすることがあります。',
    section3Body2: 'どの検査を選ぶかは、年齢、症状、病歴、そして医療従事者が確認したい内容によって変わります。',
    bloodTests: [
      {
        title: 'アンドロゲン',
        text: 'テストステロンのほか、状況に応じてほかのホルモンも調べます。',
      },
      {
        title: '甲状腺機能',
        text: 'とくに、周期の乱れのいくつかの原因を除外するのに役立ちます。',
      },
      {
        title: '代謝の検査',
        text: '血糖値のほか、リスク要因によっては脂質の検査も行うことがあります。',
      },
    ],
    alertTitle: '大切なこと',
    alertText: 'ホルモンの結果は、臨床の状況とあわせて解釈する必要があります。1つの数値だけで、PCOSの診断を結論づけることは通常できません。',
    section4Body: '超音波検査では、卵巣の見え方を観察し、とくに小さな卵胞が多数あるかどうかを調べます。また、一部の症状を説明しうるほかの要因がないかを調べることもできます。',
    tip2Title: '知っておくと役立つこと',
    tip2Text: '超音波検査で卵胞が多く見られても、それだけでPCOSと決まるわけではありません。結果は、そのほかの検査とあわせて解釈する必要があります。',
    section5Body: 'PCOSと診断されても、この先どのように経過するかを正確に予測できるわけではありません。この症候群の現れ方は、人によって大きく異なることがあります。',
    mythItems: [
      'PCOSは、必ずしも不妊を意味するわけではありません。',
      'PCOSは、必ずしも嚢胞があることを意味するわけではありません。',
      '診断だけで治療が決まるわけではありません。',
      '超音波検査が正常でも、PCOSを必ずしも否定できるわけではありません。',
    ],
    section6Body: '事前にいくつかの情報を準備しておくと、医療従事者が経過を理解し、より適切な検査を選ぶ助けになります。',
    appointmentQuestions: [
      '周期の乱れは、どのくらい前から続いていますか？',
      'ニキビ、いつもと違う体毛の増え方、抜け毛に気づいていますか？',
      '家族にPCOSや糖尿病の人はいますか？',
      '近い将来、または中期的に妊娠を望んでいますか？',
    ],
    preparationTitle: '診察前のちょっとしたヒント',
    preparationText: '可能であれば、前回の生理の日付、周期のおおよその長さ、気づいている症状、使用中の治療やサプリメントをメモしておきましょう。',
    summaryTitle: '検査の要点',
    summaryItems: [
      '診断は1つの検査ではなく、複数の要素に基づいて行われます。',
      '血液検査では、ホルモンバランスの乱れを調べたり、ほかの原因を除外したりできます。',
      '状況によっては、超音波検査で検査を補完できます。',
      '結果は、必ず医療従事者が解釈する必要があります。',
    ],
    finalTipTitle: '要点',
    finalTipText: 'PCOSの検査は、1回の検査でも最終的な判定でもありません。ホルモンのはたらきを理解し、ほかの考えられる原因を調べ、状況に合ったケアを築くための手がかりになります。',
    disclaimerText: 'この記事は情報提供のみを目的としており、医師の診察や、検査結果の一人ひとりに合わせた解釈に代わるものではありません。',
    shareMessage: 'PCOSの診断：検査と精密検査 — AWA',
  },
  ko: {
    badge: 'PCOS',
    title: 'PCOS 진단:\n검사와 평가',
    metaDuration: '읽는 시간 7분',
    metaType: '가이드',
    metaLevel: '중급',
    metaValidated: '검토된 콘텐츠',
    intro: 'PCOS를 어떻게 진단하는지, 어떤 검사를 권할 수 있는지, 그리고 진료를 차분하게 준비하는 방법을 알아봐요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '진단을 위한 평가 이해하기',
      '평가의 주요 단계',
      '호르몬 혈액 검사',
      '골반 초음파',
      '진단이 알려 주지 않는 것',
      '진료 준비하기',
      '핵심 정리',
    ],
    section1Body1: '다낭성 난소 증후군(PCOS) 진단은 한 가지 검사만으로 이루어지지 않아요. 의료 전문가는 생리 주기 이력, 증상, 진찰 결과, 검사실 검사, 그리고 상황에 따라 초음파까지 여러 정보를 종합해요.',
    section1Body2: '목표는 PCOS와 일치하는 특징을 찾는 것이면서, 불규칙한 생리나 일부 호르몬 관련 증상을 설명할 수 있는 다른 원인을 배제하는 것이기도 해요.',
    tip1Title: '알아 두세요',
    tip1Text: '진단은 언제나 사람마다 달라요. PCOS가 있는 두 사람이라도 증상과 검사 결과는 매우 다를 수 있어요.',
    section2Body: '평가는 여러 단계로 진행될 수 있어요. 모든 사람에게 똑같은 방식으로 다 시행하는 것은 아니에요.',
    diagnosisSteps: [
      {
        title: '문진',
        text: '전문가가 생리 주기, 증상, 병력, 복용 중인 치료 등 이력을 확인해요.',
      },
      {
        title: '진찰',
        text: '특히 안드로겐 과다의 징후를 살피고 전반적인 상태를 평가해요.',
      },
      {
        title: '혈액 검사',
        text: '상황을 분명히 하기 위해 호르몬 검사와 대사 검사를 요청할 수 있어요.',
      },
      {
        title: '초음파',
        text: '난소의 모양을 관찰해 평가를 보완할 수 있어요.',
      },
    ],
    flowTitle: '과정 한눈에 보기',
    flowItems: [
      '이력과 증상',
      '진찰',
      '상황에 따른 검사',
      '필요하면 초음파',
    ],
    section3Body1: '안드로겐 과다의 징후를 찾고, 생식 기능에 관여하는 일부 호르몬을 평가하고, 증상의 다른 가능한 원인을 살펴보기 위해 혈액 검사를 권할 수 있어요.',
    section3Body2: '어떤 검사를 할지는 나이, 증상, 병력, 그리고 전문가가 확인하려는 내용에 따라 달라져요.',
    bloodTests: [
      {
        title: '안드로겐',
        text: '테스토스테론과 상황에 따른 다른 호르몬이에요.',
      },
      {
        title: '갑상선 기능',
        text: '특히 불규칙한 주기의 일부 원인을 배제하는 데 도움이 돼요.',
      },
      {
        title: '대사 검사',
        text: '혈당, 그리고 위험 요인에 따라 지질 검사를 함께 하기도 해요.',
      },
    ],
    alertTitle: '중요해요',
    alertText: '호르몬 검사 결과는 임상적 상황과 함께 해석해야 해요. 보통 수치 하나만으로는 PCOS 진단을 결론짓기에 충분하지 않아요.',
    section4Body: '초음파로 난소의 모양을 관찰하고, 특히 작은 난포가 많은지 살펴볼 수 있어요. 또 일부 증상을 설명할 수 있는 다른 요인도 전문가가 살펴볼 수 있어요.',
    tip2Title: '알아 두세요',
    tip2Text: '초음파에서 난포가 많이 보인다고 해서 곧바로 PCOS가 있다는 뜻은 아니에요. 결과는 나머지 평가와 함께 해석해야 해요.',
    section5Body: 'PCOS 진단을 받았다고 해서 앞으로 어떻게 진행될지 정확히 예측할 수 있는 것은 아니에요. 이 증후군은 사람마다 매우 다르게 나타날 수 있어요.',
    mythItems: [
      'PCOS가 곧 난임을 뜻하지는 않아요.',
      'PCOS라고 해서 반드시 낭종이 있는 것은 아니에요.',
      '진단만으로 치료가 정해지지는 않아요.',
      '초음파가 정상이어도 PCOS가 아니라고 단정할 수는 없어요.',
    ],
    section6Body: '미리 준비한 몇 가지 정보는 전문가가 이력을 이해하고 가장 적절한 검사를 고르는 데 도움이 될 수 있어요.',
    appointmentQuestions: [
      '생리 주기가 불규칙한 지 얼마나 되었나요?',
      '여드름, 평소와 다른 털의 증가, 또는 탈모를 느꼈나요?',
      '가족 중에 PCOS나 당뇨병이 있나요?',
      '가까운 시일이나 중기적으로 임신을 원하나요?',
    ],
    preparationTitle: '진료 전 작은 팁',
    preparationText: '가능하면 마지막 생리 날짜, 대략적인 주기 길이, 느끼는 증상, 복용 중인 치료나 보충제를 적어 두세요.',
    summaryTitle: '평가의 핵심',
    summaryItems: [
      '진단은 한 가지 검사가 아니라 여러 요소에 근거해요.',
      '혈액 검사로 일부 호르몬 불균형을 찾고 다른 원인을 배제할 수 있어요.',
      '상황에 따라 초음파로 평가를 보완할 수 있어요.',
      '결과는 항상 의료 전문가가 해석해야 해요.',
    ],
    finalTipTitle: '핵심 정리',
    finalTipText: 'PCOS 평가는 한 번의 검사도, 최종 판정도 아니에요. 내 호르몬 기능을 이해하고, 다른 가능한 원인을 살펴보고, 내 상황에 맞는 관리를 만들어 가는 데 도움이 돼요.',
    disclaimerText: '이 아티클은 정보 제공만을 위한 것이며, 진료 상담이나 검사 결과에 대한 개인별 해석을 대신하지 않아요.',
    shareMessage: 'PCOS 진단: 검사와 평가 — AWA',
  },
  'pt-PT': {
    badge: 'SOP',
    title: 'Diagnóstico da SOP:\nexames e avaliação',
    metaDuration: '7 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Intermédio',
    metaValidated: 'Conteúdo revisto',
    intro: 'Como é diagnosticada a SOP, que exames podem ser propostos e como se preparar com calma para a sua consulta.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Compreender a avaliação diagnóstica',
      'As principais etapas da avaliação',
      'As análises hormonais ao sangue',
      'A ecografia pélvica',
      'O que o diagnóstico não lhe diz',
      'Preparar a sua consulta',
      'Pontos essenciais',
    ],
    section1Body1: 'O diagnóstico da síndrome do ovário poliquístico não se baseia num único exame. O profissional de saúde reúne várias informações: o seu historial de ciclos, os eventuais sintomas, o exame clínico, as análises laboratoriais e, consoante a situação, uma ecografia.',
    section1Body2: 'O objetivo é, ao mesmo tempo, procurar sinais compatíveis com a SOP e excluir outras causas que possam explicar períodos irregulares ou certos sintomas hormonais.',
    tip1Title: 'Bom saber',
    tip1Text: 'O diagnóstico é sempre personalizado. Duas mulheres com SOP podem ter sintomas e resultados de exames muito diferentes.',
    section2Body: 'A avaliação pode seguir várias etapas. Nem todas são necessariamente realizadas da mesma forma para todas as mulheres.',
    diagnosisSteps: [
      {
        title: 'Recolha de historial',
        text: 'O profissional recolhe o seu historial: ciclos, sintomas, antecedentes médicos e tratamentos.',
      },
      {
        title: 'Exame clínico',
        text: 'Procura, em particular, sinais de excesso de androgénios e avalia o seu estado geral.',
      },
      {
        title: 'Análises ao sangue',
        text: 'Podem ser pedidos exames hormonais e metabólicos para esclarecer a situação.',
      },
      {
        title: 'Ecografia',
        text: 'Pode completar a avaliação, ao observar o aspeto dos ovários.',
      },
    ],
    flowTitle: 'O processo num relance',
    flowItems: [
      'Historial e sintomas',
      'Exame clínico',
      'Exames consoante a situação',
      'Ecografia, se necessário',
    ],
    section3Body1: 'Pode ser proposta uma análise ao sangue para procurar sinais de excesso de androgénios, avaliar certas hormonas envolvidas na função reprodutiva e procurar outras possíveis causas para os seus sintomas.',
    section3Body2: 'Os exames escolhidos dependem da sua idade, dos seus sintomas, do seu historial médico e do que o profissional pretende verificar.',
    bloodTests: [
      {
        title: 'Androgénios',
        text: 'Testosterona e outras hormonas, consoante a situação.',
      },
      {
        title: 'Função da tiroide',
        text: 'Ajuda, em particular, a excluir certas causas de ciclos irregulares.',
      },
      {
        title: 'Avaliação metabólica',
        text: 'Glicemia e, por vezes, perfil lipídico, consoante os fatores de risco.',
      },
    ],
    alertTitle: 'Importante',
    alertText: 'Os resultados hormonais têm de ser interpretados em conjunto com o contexto clínico. Um único valor geralmente não basta, por si só, para concluir um diagnóstico de SOP.',
    section4Body: 'Uma ecografia pode ser utilizada para observar o aspeto dos ovários e procurar, em particular, um número elevado de pequenos folículos. Permite também ao profissional procurar outros fatores que possam explicar certos sintomas.',
    tip2Title: 'Bom saber',
    tip2Text: 'Ver muitos folículos na ecografia não significa automaticamente que tem SOP. O resultado tem de ser interpretado em conjunto com o resto da avaliação.',
    section5Body: 'Receber um diagnóstico de SOP não permite prever exatamente como as coisas vão evoluir no seu caso. A síndrome pode manifestar-se de forma muito diferente de pessoa para pessoa.',
    mythItems: [
      'A SOP não significa automaticamente infertilidade.',
      'A SOP não significa necessariamente ter quistos.',
      'O diagnóstico, por si só, não determina o tratamento.',
      'Uma ecografia normal não exclui necessariamente a SOP.',
    ],
    section6Body: 'Algumas informações preparadas com antecedência podem ajudar o profissional a compreender o seu historial e a escolher os exames mais pertinentes.',
    appointmentQuestions: [
      'Há quanto tempo os seus ciclos são irregulares?',
      'Notou acne, crescimento invulgar de pelos ou queda de cabelo?',
      'Existe historial familiar de SOP ou de diabetes?',
      'Deseja engravidar a curto ou médio prazo?',
    ],
    preparationTitle: 'Uma pequena dica antes da consulta',
    preparationText: 'Se possível, anote as datas do seu último período, a duração aproximada dos seus ciclos, os sintomas que está a notar e quaisquer tratamentos ou suplementos que esteja a tomar.',
    summaryTitle: 'O essencial da avaliação',
    summaryItems: [
      'O diagnóstico baseia-se em vários fatores, e não num único exame.',
      'Uma análise ao sangue pode procurar certos desequilíbrios hormonais e excluir outras causas.',
      'Uma ecografia pode completar a avaliação, consoante a situação.',
      'Os resultados devem ser sempre interpretados por um profissional de saúde.',
    ],
    finalTipTitle: 'Pontos essenciais',
    finalTipText: 'Uma avaliação da SOP não é um único exame nem um veredicto final. Ajuda a compreender o seu funcionamento hormonal, a procurar outras causas possíveis e a construir um acompanhamento adequado à sua situação.',
    disclaimerText: 'Este artigo é apenas informativo e não substitui uma consulta médica nem a interpretação personalizada dos resultados dos seus exames.',
    shareMessage: 'Diagnóstico da SOP: exames e avaliação — AWA',
  },
  bn: {
    badge: 'পিসিওএস',
    title: 'পিসিওএস নির্ণয়:\nপরীক্ষা ও মূল্যায়ন',
    metaDuration: '7 মিনিটের পাঠ',
    metaType: 'গাইড',
    metaLevel: 'মধ্যম',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'পলিসিস্টিক ওভারি সিনড্রোম (পিসিওএস) কীভাবে নির্ণয় করা হয়, কোন কোন পরীক্ষার প্রস্তাব দেওয়া হতে পারে এবং শান্তভাবে অ্যাপয়েন্টমেন্টের জন্য কীভাবে প্রস্তুত হবেন।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'নির্ণয়ের মূল্যায়ন বোঝা',
      'মূল্যায়নের প্রধান ধাপগুলো',
      'হরমোনের রক্তপরীক্ষা',
      'তলপেটের আলট্রাসাউন্ড',
      'নির্ণয় যা বলে না',
      'অ্যাপয়েন্টমেন্টের জন্য প্রস্তুতি',
      'মূল বিষয়গুলো',
    ],
    section1Body1: 'পলিসিস্টিক ওভারি সিনড্রোম নির্ণয় কোনো একক পরীক্ষার ওপর নির্ভর করে না। স্বাস্থ্যসেবা পেশাজীবী একাধিক তথ্য একত্র করেন: আপনার চক্রের ইতিহাস, কোনো উপসর্গ, শারীরিক পরীক্ষা, ল্যাব পরীক্ষা এবং পরিস্থিতি অনুযায়ী আলট্রাসাউন্ড।',
    section1Body2: 'উদ্দেশ্য হলো একদিকে পিসিওএসের সঙ্গে সামঞ্জস্যপূর্ণ বৈশিষ্ট্য খুঁজে দেখা, অন্যদিকে অনিয়মিত মাসিক বা কিছু হরমোনজনিত উপসর্গের অন্যান্য সম্ভাব্য কারণ বাদ দেওয়া।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'নির্ণয় সবসময়ই ব্যক্তিভেদে আলাদা হয়। পিসিওএস আছে এমন দুজন নারীর উপসর্গ ও পরীক্ষার ফল অনেক ভিন্ন হতে পারে।',
    section2Body: 'মূল্যায়ন কয়েকটি ধাপে হতে পারে। এই ধাপগুলো সবার ক্ষেত্রে একইভাবে পরিচালিত হওয়া জরুরি নয়।',
    diagnosisSteps: [
      {
        title: 'ইতিহাস নেওয়া',
        text: 'পেশাজীবী আপনার ইতিহাস সংগ্রহ করেন: চক্র, উপসর্গ, চিকিৎসা-পটভূমি ও চলমান চিকিৎসা।',
      },
      {
        title: 'শারীরিক পরীক্ষা',
        text: 'তিনি বিশেষ করে অ্যান্ড্রোজেনের আধিক্যের লক্ষণ খোঁজেন এবং আপনার সামগ্রিক অবস্থা মূল্যায়ন করেন।',
      },
      {
        title: 'রক্তপরীক্ষা',
        text: 'পরিস্থিতি স্পষ্ট করতে হরমোন ও বিপাকজনিত পরীক্ষার অনুরোধ করা হতে পারে।',
      },
      {
        title: 'আলট্রাসাউন্ড',
        text: 'ডিম্বাশয়ের গঠন পর্যবেক্ষণ করে এটি মূল্যায়ন সম্পূর্ণ করতে সাহায্য করতে পারে।',
      },
    ],
    flowTitle: 'এক নজরে প্রক্রিয়া',
    flowItems: [
      'ইতিহাস ও উপসর্গ',
      'শারীরিক পরীক্ষা',
      'পরিস্থিতি অনুযায়ী পরীক্ষা',
      'প্রয়োজনে আলট্রাসাউন্ড',
    ],
    section3Body1: 'অ্যান্ড্রোজেনের আধিক্যের লক্ষণ খুঁজে দেখতে, প্রজনন কার্যক্রমে জড়িত কিছু হরমোন মূল্যায়ন করতে এবং আপনার উপসর্গের অন্যান্য সম্ভাব্য কারণ খুঁজে দেখতে রক্তপরীক্ষার প্রস্তাব দেওয়া হতে পারে।',
    section3Body2: 'কোন পরীক্ষাগুলো বেছে নেওয়া হবে তা নির্ভর করে আপনার বয়স, উপসর্গ, চিকিৎসা-ইতিহাস এবং পেশাজীবী কী যাচাই করতে চাইছেন তার ওপর।',
    bloodTests: [
      {
        title: 'অ্যান্ড্রোজেন',
        text: 'টেস্টোস্টেরন এবং পরিস্থিতি অনুযায়ী অন্যান্য হরমোন।',
      },
      {
        title: 'থাইরয়েডের কার্যক্রম',
        text: 'বিশেষ করে অনিয়মিত চক্রের কিছু কারণ বাদ দিতে সাহায্য করে।',
      },
      {
        title: 'বিপাকজনিত পরীক্ষা',
        text: 'রক্তে গ্লুকোজ, ঝুঁকির কারণ অনুযায়ী কখনো কখনো লিপিড প্যানেল।',
      },
    ],
    alertTitle: 'গুরুত্বপূর্ণ',
    alertText: 'হরমোনের ফল ক্লিনিক্যাল প্রেক্ষাপটের সঙ্গে মিলিয়ে ব্যাখ্যা করতে হয়। সাধারণত একটিমাত্র মান নিজে থেকে পিসিওএস নির্ণয়ের সিদ্ধান্তে পৌঁছাতে যথেষ্ট নয়।',
    section4Body: 'ডিম্বাশয়ের গঠন পর্যবেক্ষণ করতে এবং বিশেষ করে ছোট ছোট ফলিকলের সংখ্যা বেশি কি না তা দেখতে আলট্রাসাউন্ড ব্যবহার করা যেতে পারে। এর মাধ্যমে পেশাজীবী কিছু উপসর্গের ব্যাখ্যা হতে পারে এমন অন্যান্য বিষয়ও খুঁজে দেখতে পারেন।',
    tip2Title: 'জেনে রাখা ভালো',
    tip2Text: 'আলট্রাসাউন্ডে অনেক ফলিকল দেখা গেলে স্বয়ংক্রিয়ভাবে বোঝায় না যে আপনার পিসিওএস আছে। মূল্যায়নের বাকি অংশের সঙ্গে মিলিয়ে ফল ব্যাখ্যা করতে হয়।',
    section5Body: 'পিসিওএস নির্ণয় হওয়ার অর্থ এই নয় যে আপনার ক্ষেত্রে পরিস্থিতি ঠিক কীভাবে এগোবে তা আগে থেকে বলা সম্ভব। এই সিনড্রোম একজন থেকে আরেকজনে খুবই ভিন্নভাবে প্রকাশ পেতে পারে।',
    mythItems: [
      'পিসিওএস থাকার মানে স্বয়ংক্রিয়ভাবে বন্ধ্যাত্ব নয়।',
      'পিসিওএস থাকলেই যে সিস্ট থাকবে, এমন নয়।',
      'শুধু নির্ণয় থেকেই চিকিৎসা নির্ধারিত হয় না।',
      'স্বাভাবিক আলট্রাসাউন্ড মানেই পিসিওএস বাদ পড়ে যায় না।',
    ],
    section6Body: 'আগে থেকে প্রস্তুত করা কিছু তথ্য পেশাজীবীকে আপনার ইতিহাস বুঝতে এবং সবচেয়ে প্রাসঙ্গিক পরীক্ষাগুলো বেছে নিতে সাহায্য করতে পারে।',
    appointmentQuestions: [
      'আপনার চক্র কত দিন ধরে অনিয়মিত?',
      'আপনি কি ব্রণ, অস্বাভাবিক লোম গজানো বা চুল পড়া লক্ষ করেছেন?',
      'পরিবারে কি পিসিওএস বা ডায়াবেটিসের ইতিহাস আছে?',
      'আপনি কি অদূর বা মাঝারি ভবিষ্যতে গর্ভবতী হতে চান?',
    ],
    preparationTitle: 'অ্যাপয়েন্টমেন্টের আগে একটি ছোট পরামর্শ',
    preparationText: 'সম্ভব হলে আপনার শেষ মাসিকের তারিখ, চক্রের আনুমানিক দৈর্ঘ্য, আপনি যেসব উপসর্গ লক্ষ করছেন এবং যেসব চিকিৎসা বা সম্পূরক গ্রহণ করছেন তা লিখে রাখুন।',
    summaryTitle: 'মূল্যায়নের মূল কথাগুলো',
    summaryItems: [
      'নির্ণয় একাধিক বিষয়ের ওপর নির্ভর করে, কোনো একক পরীক্ষার ওপর নয়।',
      'রক্তপরীক্ষায় হরমোনের কিছু ভারসাম্যহীনতা খুঁজে দেখা এবং অন্যান্য কারণ বাদ দেওয়া যেতে পারে।',
      'পরিস্থিতি অনুযায়ী আলট্রাসাউন্ড মূল্যায়ন সম্পূর্ণ করতে পারে।',
      'ফল সবসময় একজন স্বাস্থ্যসেবা পেশাজীবীর ব্যাখ্যা করা উচিত।',
    ],
    finalTipTitle: 'মূল বিষয়গুলো',
    finalTipText: 'পিসিওএসের মূল্যায়ন কোনো একক পরীক্ষা বা চূড়ান্ত রায় নয়। এটি আপনার হরমোনের কার্যক্রম বুঝতে, অন্যান্য সম্ভাব্য কারণ খুঁজে দেখতে এবং আপনার পরিস্থিতির উপযোগী যত্ন গড়ে তুলতে সাহায্য করে।',
    disclaimerText: 'এই নিবন্ধ শুধুমাত্র তথ্যের জন্য এবং এটি চিকিৎসকের পরামর্শ বা আপনার পরীক্ষার ফলের ব্যক্তিগত ব্যাখ্যার বিকল্প নয়।',
    shareMessage: 'পিসিওএস নির্ণয়: পরীক্ষা ও মূল্যায়ন — AWA',
  },
  da: {
    badge: 'PCOS',
    title: 'PCOS-diagnose:\nundersøgelser og vurdering',
    metaDuration: '7 minutters læsning',
    metaType: 'Guide',
    metaLevel: 'Mellemsvær',
    metaValidated: 'Gennemset indhold',
    intro: 'Hvordan polycystisk ovariesyndrom (PCOS) diagnosticeres, hvilke undersøgelser der kan foreslås, og hvordan du roligt forbereder dig til en konsultation.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Forstå vurderingsprocessen',
      'De vigtigste trin i vurderingen',
      'Blodprøver for hormoner',
      'Ultralyd af underlivet',
      'Hvad diagnosen ikke siger',
      'Forberedelse til konsultationen',
      'Det vigtigste',
    ],
    section1Body1: 'Diagnosen polycystisk ovariesyndrom stilles ikke ud fra én enkelt undersøgelse. Et sundhedspersonale samler flere oplysninger: din cyklushistorie, eventuelle symptomer, en fysisk undersøgelse, laboratorieprøver og ultralyd afhængigt af situationen.',
    section1Body2: 'Formålet er at lede efter karakteristika forenelige med PCOS og udelukke andre mulige årsager til uregelmæssig menstruation eller visse hormonelle symptomer.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Diagnosen er altid individuel. To kvinder med PCOS kan have meget forskellige symptomer og undersøgelsesresultater.',
    section2Body: 'Vurderingen kan foregå i flere trin. Disse trin behøver ikke nødvendigvis forløbe ens for alle.',
    diagnosisSteps: [
      {
        title: 'Anamnese',
        text: 'Fagpersonen indsamler din sygehistorie: cyklus, symptomer, medicinsk baggrund og igangværende behandlinger.',
      },
      {
        title: 'Fysisk undersøgelse',
        text: 'Hun eller han ser særligt efter tegn på androgenoverskud og vurderer din generelle tilstand.',
      },
      {
        title: 'Blodprøver',
        text: 'Hormon- og stofskifteprøver kan rekvireres for at afklare situationen.',
      },
      {
        title: 'Ultralyd',
        text: 'Den kan hjælpe med at fuldende vurderingen ved at undersøge æggestokkenes struktur.',
      },
    ],
    flowTitle: 'Overblik over processen',
    flowItems: [
      'Sygehistorie og symptomer',
      'Fysisk undersøgelse',
      'Situationsbestemte prøver',
      'Ultralyd hvis nødvendigt',
    ],
    section3Body1: 'Blodprøver kan foreslås for at lede efter tegn på androgenoverskud, vurdere visse hormoner involveret i reproduktionsfunktionen og lede efter andre mulige årsager til dine symptomer.',
    section3Body2: 'Valget af prøver afhænger af din alder, symptomer, sygehistorie og hvad fagpersonen ønsker at kontrollere.',
    bloodTests: [
      {
        title: 'Androgener',
        text: 'Testosteron og eventuelt andre hormoner afhængigt af situationen.',
      },
      {
        title: 'Skjoldbruskkirtelfunktion',
        text: 'Hjælper særligt med at udelukke visse årsager til uregelmæssig cyklus.',
      },
      {
        title: 'Stofskifteprøver',
        text: 'Blodsukker, og i visse tilfælde lipidprofil afhængigt af risikofaktorer.',
      },
    ],
    alertTitle: 'Vigtigt',
    alertText: 'Hormonresultater skal fortolkes i klinisk sammenhæng. En enkelt værdi er generelt ikke tilstrækkelig i sig selv til at stille PCOS-diagnosen.',
    section4Body: 'Ultralyd kan bruges til at undersøge æggestokkenes struktur og særligt om der er et øget antal små follikler. Det giver fagpersonen mulighed for også at lede efter andre forhold, der kan forklare visse symptomer.',
    tip2Title: 'Godt at vide',
    tip2Text: 'Mange follikler set ved ultralyd betyder ikke automatisk, at du har PCOS. Resultatet skal fortolkes i sammenhæng med resten af vurderingen.',
    section5Body: 'At få stillet en PCOS-diagnose betyder ikke, at man på forhånd kan sige præcis, hvordan tilstanden vil udvikle sig for dig. Dette syndrom kan vise sig meget forskelligt fra person til person.',
    mythItems: [
      'At have PCOS betyder ikke automatisk infertilitet.',
      'PCOS indebærer ikke nødvendigvis tilstedeværelse af cyster.',
      'Diagnosen alene bestemmer ikke behandlingen.',
      'En normal ultralyd udelukker ikke PCOS.',
    ],
    section6Body: 'Visse informationer forberedt på forhånd kan hjælpe fagpersonen med at forstå din sygehistorie og vælge de mest relevante undersøgelser.',
    appointmentQuestions: [
      'Hvor længe har din cyklus været uregelmæssig?',
      'Har du bemærket acne, usædvanlig hårvækst eller hårtab?',
      'Er der familiehistorie med PCOS eller diabetes?',
      'Ønsker du at blive gravid i den nære eller mellemlange fremtid?',
    ],
    preparationTitle: 'Et lille råd inden konsultationen',
    preparationText: 'Notér om muligt datoen for din sidste menstruation, din cyklus\' omtrentlige længde, de symptomer du har bemærket, samt de lægemidler eller kosttilskud du tager.',
    summaryTitle: 'Det vigtigste i vurderingen',
    summaryItems: [
      'Diagnosen baseres på flere faktorer, ikke én enkelt test.',
      'Blodprøver kan identificere visse hormonelle ubalancer og udelukke andre årsager.',
      'Ultralyd kan fuldende vurderingen afhængigt af situationen.',
      'Resultater bør altid fortolkes af et sundhedspersonale.',
    ],
    finalTipTitle: 'Det vigtigste',
    finalTipText: 'PCOS-vurderingen er hverken én enkelt test eller en endelig dom. Den hjælper med at forstå din hormonelle funktion, lede efter andre mulige årsager og opbygge en behandling tilpasset din situation.',
    disclaimerText: 'Denne artikel er udelukkende til informationsformål og erstatter ikke lægelig rådgivning eller en personlig fortolkning af dine undersøgelsesresultater.',
    shareMessage: 'PCOS-diagnose: undersøgelser og vurdering — AWA',
  },
  sv: {
    badge: 'PCOS',
    title: 'PCOS-diagnose:\nundersögelser och vurdering',
    metaDuration: '7 minutters läsning',
    metaType: 'Guide',
    metaLevel: 'Mellemsvär',
    metaValidated: 'Gennemset indhold',
    intro: 'Hvordan polycystisk ovariesyndrom (PCOS) diagnosticeres, hvilke undersögelser der kan foreslås, och hvordan du roligt forbereder dig till en konsultation.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Forstå vurderingsprocessen',
      'De vigtigste trin i vurderingen',
      'Blodpröver for hormoner',
      'Ultralyd av underlivet',
      'Hvad diagnosen inte siger',
      'Forberedelse till konsultationen',
      'Det vigtigste',
    ],
    section1Body1: 'Diagnosen polycystisk ovariesyndrom stilles inte ud fran én enkelt undersögelse. Et halsaspersonale samler flere oplysninger: din cyklushistorie, eventuelle symtom, en fysisk undersögelse, laboratoriepröver och ultralyd afhängigt av situationen.',
    section1Body2: 'Formålet ar at lede efter karakteristika forenelige med PCOS och udelukke andre mulige årsager till uregelmässig menstruation eller visse hormonelle symtom.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Diagnosen ar alltid individuel. To kvinnor med PCOS kan have mycket forskellige symtom och undersögelsesresultater.',
    section2Body: 'Vurderingen kan foregå i flere trin. Disse trin behöver inte nödvendigvis forlöbe ens for alle.',
    diagnosisSteps: [
      {
        title: 'Anamnese',
        text: 'Fagpersonen indsamler din sygehistorie: cyklus, symtom, medicinsk baggrund och igangvärende behandlinger.',
      },
      {
        title: 'Fysisk undersögelse',
        text: 'Hun eller han ser särligt efter tegn på androgenoverskud och vurderer din generelle tilstand.',
      },
      {
        title: 'Blodpröver',
        text: 'Hormon- och stofskiftepröver kan rekvireres for att afklare situationen.',
      },
      {
        title: 'Ultralyd',
        text: 'Den kan hjälpe med at fuldende vurderingen ved at undersöge äggestokkenes struktur.',
      },
    ],
    flowTitle: 'Overblik over processen',
    flowItems: [
      'Sygehistorie och symtom',
      'Fysisk undersögelse',
      'Situationsbestemte pröver',
      'Ultralyd hvis nödvendigt',
    ],
    section3Body1: 'Blodpröver kan foreslås for att lede efter tegn på androgenoverskud, vurdere visse hormoner involveret i reproduktionsfunktionen och lede efter andre mulige årsager till dina symtom.',
    section3Body2: 'Valget av pröver afhänger av din alder, symtom, sygehistorie och hvad fagpersonen önsker at kontrollere.',
    bloodTests: [
      {
        title: 'Androgener',
        text: 'Testosteron och eventuelt andre hormoner afhängigt av situationen.',
      },
      {
        title: 'Skjoldbruskkirtelfunktion',
        text: 'Hjälper särligt med at udelukke visse årsager till uregelmässig cyklus.',
      },
      {
        title: 'Stofskiftepröver',
        text: 'Blodsukker, och i visse tilfälde lipidprofil afhängigt av risikofaktorer.',
      },
    ],
    alertTitle: 'Vigtigt',
    alertText: 'Hormonresultater skal fortolkes i klinisk sammenhäng. En enkelt värdi ar generelt inte tilsträkkelig i sig selv till at stille PCOS-diagnosen.',
    section4Body: 'Ultralyd kan bruges till at undersöge äggestokkenes struktur och särligt om der ar et öget antal små follikler. Det giver fagpersonen mulighed for også at lede efter andre forhold, der kan forklare visse symtom.',
    tip2Title: 'Godt at vide',
    tip2Text: 'Mange follikler set ved ultralyd betyder inte automatisk, at du har PCOS. Resultatet skal fortolkes i sammenhäng med resten av vurderingen.',
    section5Body: 'At få stillet en PCOS-diagnose betyder inte, at man på forhånd kan sige präcis, hvordan tilstanden vil udvikle sig for dig. Dette syndrom kan vise sig mycket forskelligt fran person till person.',
    mythItems: [
      'At have PCOS betyder inte automatisk infertilitet.',
      'PCOS indebärer inte nödvendigvis tilstedevärelse av cyster.',
      'Diagnosen alene bestemmer inte behandlingen.',
      'En normal ultralyd udelukker inte PCOS.',
    ],
    section6Body: 'Visse informationer forberedt på forhånd kan hjälpe fagpersonen med at forstå din sygehistorie och välge de mest relevante undersögelser.',
    appointmentQuestions: [
      'Hvor länge har din cyklus väret uregelmässig?',
      'Har du bemärket acne, usädvanlig hårväkst eller hårtab?',
      'Er der familiehistorie med PCOS eller diabetes?',
      'Önsker du at blive gravid i den näre eller mellemlange fremtid?',
    ],
    preparationTitle: 'Et lille råd inden konsultationen',
    preparationText: 'Notér om muligt datoen for din sidste menstruation, din cyklus\' omtrentlige längde, de symtom du har bemärket, samt de lägemidler eller kosttilskud du tager.',
    summaryTitle: 'Det vigtigste i vurderingen',
    summaryItems: [
      'Diagnosen baseres på flere faktorer, inte én enkelt test.',
      'Blodpröver kan identificere visse hormonelle ubalancer och udelukke andre årsager.',
      'Ultralyd kan fuldende vurderingen afhängigt av situationen.',
      'Resultater bör alltid fortolkes av et halsaspersonale.',
    ],
    finalTipTitle: 'Det vigtigste',
    finalTipText: 'PCOS-vurderingen ar hverken én enkelt test eller en endelig dom. Den hjälper med at forstå din hormonelle funktion, lede efter andre mulige årsager och opbygge en behandling tilpasset din situation.',
    disclaimerText: 'Denne artikel ar udelukkende till informationsformål och erstatter inte lägelig rådgivning eller en personlig fortolkning av dina undersögelsesresultater.',
    shareMessage: 'PCOS-diagnose: undersögelser och vurdering — AWA',
  },
  nb: {
    badge: 'PCOS',
    title: 'PCOS-diagnose:\nundersøkelser og utredning',
    metaDuration: '7 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Middels',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Hvordan PCOS diagnostiseres, hvilke undersøkelser som kan tilbys, og hvordan du forbereder deg rolig til timen din.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Forstå diagnoseutredningen',
      'Hovedtrinnene i utredningen',
      'Den hormonelle blodprøven',
      'Ultralyd av bekkenet',
      'Hva diagnosen ikke forteller deg',
      'Forberede timen din',
      'Det viktigste å huske',
    ],
    section1Body1: 'Diagnosen polycystisk ovariesyndrom bygger ikke på én enkelt prøve. Helsepersonellet samler flere opplysninger: syklushistorikken din, eventuelle symptomer, den kliniske undersøkelsen, laboratorieprøver og, avhengig av situasjonen, en ultralyd.',
    section1Body2: 'Målet er både å lete etter funn som er forenlige med PCOS og å utelukke andre årsaker som kan forklare uregelmessig mens eller visse hormonelle symptomer.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Diagnosen er alltid personlig tilpasset. To kvinner med PCOS kan ha svært ulike symptomer og prøveresultater.',
    section2Body: 'Utredningen kan følge flere trinn. De utføres ikke nødvendigvis likt for alle.',
    diagnosisSteps: [
      {title: 'Anamnese', text: 'Fagpersonen samler historikken din: sykluser, symptomer, medisinsk bakgrunn og behandlinger.'},
      {title: 'Klinisk undersøkelse', text: 'De ser særlig etter tegn på overskudd av androgener og vurderer allmenntilstanden din.'},
      {title: 'Blodprøver', text: 'Hormonelle og metabolske prøver kan rekvireres for å klargjøre situasjonen.'},
      {title: 'Ultralyd', text: 'Den kan utfylle utredningen ved å se på eggstokkenes utseende.'},
    ],
    flowTitle: 'Forløpet på et blikk',
    flowItems: [
      'Sykehistorie og symptomer',
      'Klinisk undersøkelse',
      'Prøver avhengig av situasjonen',
      'Ultralyd ved behov',
    ],
    section3Body1: 'En blodprøve kan tilbys for å lete etter tegn på overskudd av androgener, vurdere visse hormoner som har med reproduksjonen å gjøre, og lete etter andre mulige årsaker til symptomene dine.',
    section3Body2: 'Prøvene som velges, avhenger av alderen din, symptomene dine, sykehistorien din og hva fagpersonen vil kontrollere.',
    bloodTests: [
      {title: 'Androgener', text: 'Testosteron og andre hormoner avhengig av situasjonen.'},
      {title: 'Skjoldbruskkjertelfunksjon', text: 'Hjelper særlig å utelukke visse årsaker til uregelmessige sykluser.'},
      {title: 'Metabolsk utredning', text: 'Blodsukker, noen ganger fettprofil avhengig av risikofaktorer.'},
    ],
    alertTitle: 'Viktig',
    alertText: 'Hormonresultater må tolkes sammen med den kliniske sammenhengen. En enkelt verdi er vanligvis ikke nok, alene, til å konkludere med en PCOS-diagnose.',
    section4Body: 'En ultralyd kan brukes til å se på eggstokkenes utseende og lete særlig etter et høyt antall små follikler. Den lar også fagpersonen lete etter andre faktorer som kan forklare visse symptomer.',
    tip2Title: 'Godt å vite',
    tip2Text: 'Å se mange follikler på ultralyd betyr ikke automatisk at du har PCOS. Resultatet må tolkes sammen med resten av utredningen.',
    section5Body: 'Å få en PCOS-diagnose gjør det ikke mulig å forutsi nøyaktig hvordan ting vil utvikle seg for deg. Syndromet kan vise seg svært forskjellig fra person til person.',
    mythItems: [
      'PCOS betyr ikke automatisk infertilitet.',
      'PCOS betyr ikke nødvendigvis at man har cyster.',
      'Diagnosen alene bestemmer ikke behandlingen.',
      'En normal ultralyd utelukker ikke nødvendigvis PCOS.',
    ],
    section6Body: 'Noen opplysninger som er forberedt på forhånd, kan hjelpe fagpersonen å forstå sykehistorien din og velge de mest relevante prøvene.',
    appointmentQuestions: [
      'Hvor lenge har syklusene dine vært uregelmessige?',
      'Har du lagt merke til akne, uvanlig hårvekst eller hårtap?',
      'Finnes det PCOS eller diabetes i familien?',
      'Ønsker du å bli gravid på kort eller mellomlang sikt?',
    ],
    preparationTitle: 'Et lite tips før timen',
    preparationText: 'Hvis mulig, noter datoene for den siste mensen din, omtrentlig lengde på syklusene dine, symptomene du merker, og eventuelle behandlinger eller kosttilskudd du bruker.',
    summaryTitle: 'Det viktigste ved utredningen',
    summaryItems: [
      'Diagnosen bygger på flere faktorer, ikke én enkelt prøve.',
      'En blodprøve kan lete etter visse hormonelle ubalanser og utelukke andre årsaker.',
      'En ultralyd kan utfylle utredningen avhengig av situasjonen.',
      'Resultatene bør alltid tolkes av helsepersonell.',
    ],
    finalTipTitle: 'Det viktigste å huske',
    finalTipText: 'En PCOS-utredning er ikke én enkelt prøve eller en endelig dom. Den hjelper deg å forstå din hormonelle funksjon, lete etter andre mulige årsaker og bygge en oppfølging som passer din situasjon.',
    disclaimerText: 'Denne artikkelen er kun til informasjon og erstatter ikke en medisinsk konsultasjon eller personlig tolkning av prøveresultatene dine.',
    shareMessage: 'PCOS-diagnose: undersøkelser og utredning – AWA',
  },
  pl: {
    badge: 'PCOS',
    title: 'Diagnostyka PCOS:\nbadania i ocena',
    metaDuration: '7 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Średnio zaawansowany',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Jak diagnozuje się PCOS, jakie badania mogą zostać zaproponowane i jak spokojnie przygotować się do wizyty.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Zrozumieć proces diagnostyczny',
      'Główne etapy diagnostyki',
      'Hormonalne badanie krwi',
      'USG miednicy',
      'Czego diagnoza Ci nie mówi',
      'Przygotowanie do wizyty',
      'Najważniejsze wnioski',
    ],
    section1Body1: 'Rozpoznanie zespołu policystycznych jajników nie opiera się na jednym badaniu. Specjalista zestawia kilka informacji: historię Twoich cykli, ewentualne objawy, badanie kliniczne, badania laboratoryjne i, w zależności od sytuacji, USG.',
    section1Body2: 'Celem jest zarówno poszukiwanie cech zgodnych z PCOS, jak i wykluczenie innych przyczyn, które mogłyby tłumaczyć nieregularne miesiączki lub niektóre objawy hormonalne.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Diagnoza jest zawsze zindywidualizowana. Dwie kobiety z PCOS mogą mieć bardzo różne objawy i wyniki badań.',
    section2Body: 'Diagnostyka może przebiegać w kilku etapach. Niekoniecznie wszystkie są przeprowadzane w ten sam sposób u każdej kobiety.',
    diagnosisSteps: [
      {title: 'Wywiad', text: 'Specjalista zbiera Twój wywiad: cykle, objawy, przeszłość medyczną i stosowane leczenie.'},
      {title: 'Badanie kliniczne', text: 'Szuka w szczególności objawów nadmiaru androgenów i ocenia Twój ogólny stan.'},
      {title: 'Badania krwi', text: 'Mogą zostać zlecone badania hormonalne i metaboliczne, aby wyjaśnić sytuację.'},
      {title: 'USG', text: 'Może uzupełnić diagnostykę, pozwalając ocenić wygląd jajników.'},
    ],
    flowTitle: 'Proces w skrócie',
    flowItems: [
      'Wywiad i objawy',
      'Badanie kliniczne',
      'Badania w zależności od sytuacji',
      'USG w razie potrzeby',
    ],
    section3Body1: 'Może zostać zaproponowane badanie krwi, aby wykryć oznaki nadmiaru androgenów, ocenić niektóre hormony związane z funkcją rozrodczą i poszukać innych możliwych przyczyn Twoich objawów.',
    section3Body2: 'Wybrane badania zależą od Twojego wieku, objawów, historii medycznej i tego, co specjalista chce sprawdzić.',
    bloodTests: [
      {title: 'Androgeny', text: 'Testosteron i inne hormony, w zależności od sytuacji.'},
      {title: 'Czynność tarczycy', text: 'Pomaga w szczególności wykluczyć niektóre przyczyny nieregularnych cykli.'},
      {title: 'Badania metaboliczne', text: 'Glukoza we krwi, czasem lipidogram, w zależności od czynników ryzyka.'},
    ],
    alertTitle: 'Ważne',
    alertText: 'Wyniki hormonalne należy interpretować w kontekście klinicznym. Pojedyncza wartość zwykle nie wystarcza, by sama w sobie potwierdzić rozpoznanie PCOS.',
    section4Body: 'USG pozwala ocenić wygląd jajników i szukać w szczególności dużej liczby małych pęcherzyków. Pozwala też specjaliście poszukać innych czynników, które mogłyby tłumaczyć niektóre objawy.',
    tip2Title: 'Warto wiedzieć',
    tip2Text: 'Zobaczenie wielu pęcherzyków w USG nie oznacza automatycznie, że masz PCOS. Wynik należy interpretować razem z resztą diagnostyki.',
    section5Body: 'Otrzymanie rozpoznania PCOS nie pozwala dokładnie przewidzieć, jak sytuacja będzie przebiegać u Ciebie. Zespół może przejawiać się bardzo różnie u poszczególnych osób.',
    mythItems: [
      'PCOS nie oznacza automatycznie niepłodności.',
      'PCOS niekoniecznie oznacza posiadanie torbieli.',
      'Samo rozpoznanie nie determinuje leczenia.',
      'Prawidłowy wynik USG niekoniecznie wyklucza PCOS.',
    ],
    section6Body: 'Kilka informacji przygotowanych wcześniej może pomóc specjaliście zrozumieć Twoją historię i wybrać najbardziej adekwatne badania.',
    appointmentQuestions: [
      'Od jak dawna Twoje cykle są nieregularne?',
      'Czy zauważyłaś trądzik, nietypowe owłosienie lub wypadanie włosów?',
      'Czy w rodzinie występował PCOS lub cukrzyca?',
      'Czy chcesz zajść w ciążę w krótkim lub średnim terminie?',
    ],
    preparationTitle: 'Mała wskazówka przed wizytą',
    preparationText: 'Jeśli to możliwe, zanotuj daty ostatniej miesiączki, przybliżoną długość cykli, zauważane objawy oraz stosowane leki lub suplementy.',
    summaryTitle: 'Najważniejsze o diagnostyce',
    summaryItems: [
      'Rozpoznanie opiera się na kilku czynnikach, a nie na jednym badaniu.',
      'Badanie krwi może wykryć niektóre zaburzenia hormonalne i wykluczyć inne przyczyny.',
      'USG może uzupełnić diagnostykę w zależności od sytuacji.',
      'Wyniki zawsze powinien interpretować specjalista.',
    ],
    finalTipTitle: 'Najważniejsze wnioski',
    finalTipText: 'Diagnostyka PCOS to nie pojedyncze badanie ani ostateczny werdykt. Pomaga zrozumieć Twoje funkcjonowanie hormonalne, poszukać innych możliwych przyczyn i zbudować opiekę dopasowaną do Twojej sytuacji.',
    disclaimerText: 'Ten artykuł ma charakter wyłącznie informacyjny i nie zastępuje wizyty lekarskiej ani spersonalizowanej interpretacji wyników badań.',
    shareMessage: 'Diagnostyka PCOS: badania i ocena — AWA',
  },
  uk: {
    badge: 'СПКЯ',
    title: 'Діагностика СПКЯ:\nобстеження й оцінка',
    metaDuration: '7 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Середній',
    metaValidated: 'Перевірений вміст',
    intro: 'Як діагностують СПКЯ, які обстеження можуть бути запропоновані та як спокійно підготуватися до візиту.',
    contentsTitle: 'У цій статті',
    topics: [
      'Розуміння діагностичного процесу',
      'Основні етапи обстеження',
      'Гормональний аналіз крові',
      'УЗД органів малого тазу',
      'Чого діагноз вам не говорить',
      'Підготовка до візиту',
      'Головні висновки',
    ],
    section1Body1: 'Діагностика синдрому полікістозних яєчників не ґрунтується на одному обстеженні. Фахівець зіставляє кілька відомостей: історію ваших циклів, можливі симптоми, клінічний огляд, лабораторні аналізи та, залежно від ситуації, УЗД.',
    section1Body2: 'Мета — як шукати ознаки, що відповідають СПКЯ, так і виключити інші причини, які могли б пояснити нерегулярні менструації чи певні гормональні симптоми.',
    tip1Title: 'Варто знати',
    tip1Text: 'Діагноз завжди індивідуальний. Дві жінки з СПКЯ можуть мати дуже різні симптоми та результати обстежень.',
    section2Body: 'Обстеження може проходити в кілька етапів. Не обов’язково всі вони проводяться однаково для кожної жінки.',
    diagnosisSteps: [
      {title: 'Збір анамнезу', text: 'Фахівець збирає вашу історію: цикли, симптоми, медичну історію та лікування.'},
      {title: 'Клінічний огляд', text: 'Він шукає, зокрема, ознаки надлишку андрогенів і оцінює ваш загальний стан.'},
      {title: 'Аналізи крові', text: 'Для уточнення ситуації можуть бути призначені гормональні та метаболічні аналізи.'},
      {title: 'УЗД', text: 'Воно може доповнити обстеження, дозволяючи оцінити вигляд яєчників.'},
    ],
    flowTitle: 'Процес коротко',
    flowItems: [
      'Анамнез і симптоми',
      'Клінічний огляд',
      'Аналізи залежно від ситуації',
      'УЗД за потреби',
    ],
    section3Body1: 'Може бути запропонований аналіз крові, щоб виявити ознаки надлишку андрогенів, оцінити певні гормони, залучені до репродуктивної функції, та шукати інші можливі причини ваших симптомів.',
    section3Body2: 'Вибір аналізів залежить від вашого віку, симптомів, медичної історії та того, що фахівець хоче перевірити.',
    bloodTests: [
      {title: 'Андрогени', text: 'Тестостерон та інші гормони залежно від ситуації.'},
      {title: 'Функція щитоподібної залози', text: 'Допомагає, зокрема, виключити певні причини нерегулярних циклів.'},
      {title: 'Метаболічне обстеження', text: 'Глюкоза крові, іноді ліпідограма залежно від чинників ризику.'},
    ],
    alertTitle: 'Важливо',
    alertText: 'Гормональні результати слід інтерпретувати в клінічному контексті. Одне значення зазвичай не вистачає, щоб самостійно підтвердити діагноз СПКЯ.',
    section4Body: 'УЗД дозволяє оцінити вигляд яєчників і шукати, зокрема, велику кількість дрібних фолікулів. Воно також дає фахівцю змогу шукати інші чинники, які могли б пояснити певні симптоми.',
    tip2Title: 'Варто знати',
    tip2Text: 'Побачення багатьох фолікулів на УЗД не означає автоматично, що у вас СПКЯ. Результат слід інтерпретувати разом із рештою обстеження.',
    section5Body: 'Отримання діагнозу СПКЯ не дозволяє точно передбачити, як усе перебігатиме у вас. Синдром може проявлятися дуже по-різному в різних людей.',
    mythItems: [
      'СПКЯ автоматично не означає безпліддя.',
      'СПКЯ не обов’язково означає наявність кіст.',
      'Сам діагноз не визначає лікування.',
      'Нормальне УЗД не обов’язково виключає СПКЯ.',
    ],
    section6Body: 'Кілька відомостей, підготовлених заздалегідь, можуть допомогти фахівцеві зрозуміти вашу історію й обрати найдоречніші обстеження.',
    appointmentQuestions: [
      'Як давно ваші цикли нерегулярні?',
      'Чи помічали ви акне, незвичний ріст волосся або випадання волосся?',
      'Чи були в родині випадки СПКЯ або діабету?',
      'Чи хочете ви завагітніти в короткостроковій чи середньостроковій перспективі?',
    ],
    preparationTitle: 'Маленька порада перед візитом',
    preparationText: 'Якщо можливо, занотуйте дати останньої менструації, приблизну тривалість циклів, симптоми, які ви помічаєте, та будь-які ліки чи добавки, які ви приймаєте.',
    summaryTitle: 'Головне про обстеження',
    summaryItems: [
      'Діагностика ґрунтується на кількох чинниках, а не на одному обстеженні.',
      'Аналіз крові може виявити певні гормональні порушення й виключити інші причини.',
      'УЗД може доповнити обстеження залежно від ситуації.',
      'Результати завжди має інтерпретувати медичний фахівець.',
    ],
    finalTipTitle: 'Головні висновки',
    finalTipText: 'Обстеження при СПКЯ — це не одне дослідження й не остаточний вирок. Воно допомагає зрозуміти ваше гормональне функціонування, шукати інші можливі причини й побудувати догляд, що відповідає вашій ситуації.',
    disclaimerText: 'Ця стаття має виключно інформаційний характер і не замінює медичної консультації чи персоналізованої інтерпретації результатів ваших аналізів.',
    shareMessage: 'Діагностика СПКЯ: обстеження й оцінка — AWA',
  },
  cs: {
    badge: 'PCOS',
    title: 'Diagnostika PCOS:\ntesty a vyšetření',
    metaDuration: '7 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Pokročilý',
    metaValidated: 'Ověřený obsah',
    intro: 'Jak se PCOS diagnostikuje, jaké testy mohou být nabídnuty a jak se klidně připravit na návštěvu.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Pochopení diagnostického vyšetření',
      'Hlavní kroky vyšetření',
      'Hormonální krevní test',
      'Ultrazvuk pánve',
      'Co diagnóza neříká',
      'Příprava na návštěvu',
      'Hlavní poznatky',
    ],
    section1Body1: 'Diagnóza syndromu polycystických vaječníků nespočívá v jediném testu. Zdravotnický pracovník shromažďuje několik informací: historii vašich cyklů, případné příznaky, klinické vyšetření, laboratorní testy a podle situace ultrazvuk.',
    section1Body2: 'Cílem je jak hledat rysy odpovídající PCOS, tak vyloučit jiné příčiny, které by mohly vysvětlit nepravidelnou menstruaci nebo některé hormonální příznaky.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Diagnóza je vždy personalizovaná. Dvě ženy s PCOS mohou mít velmi odlišné příznaky a výsledky testů.',
    section2Body: 'Vyšetření může probíhat v několika krocích. Nemusí se u všech provádět stejně.',
    diagnosisSteps: [
      {title: 'Odebrání anamnézy', text: 'Odborník shromažďuje vaši anamnézu: cykly, příznaky, zdravotní minulost a léčbu.'},
      {title: 'Klinické vyšetření', text: 'Hledá zejména známky nadbytku androgenů a posuzuje váš celkový stav.'},
      {title: 'Krevní vyšetření', text: 'K upřesnění situace mohou být vyžádány hormonální a metabolické testy.'},
      {title: 'Ultrazvuk', text: 'Může vyšetření doplnit pozorováním vzhledu vaječníků.'},
    ],
    flowTitle: 'Průběh na první pohled',
    flowItems: [
      'Anamnéza a příznaky',
      'Klinické vyšetření',
      'Testy podle situace',
      'Případný ultrazvuk',
    ],
    section3Body1: 'Může být nabídnut krevní test ke zjištění známek nadbytku androgenů, posouzení určitých hormonů podílejících se na reprodukční funkci a hledání jiných možných příčin vašich příznaků.',
    section3Body2: 'Zvolené testy závisejí na vašem věku, příznacích, zdravotní anamnéze a na tom, co chce odborník ověřit.',
    bloodTests: [
      {title: 'Androgeny', text: 'Testosteron a další hormony podle situace.'},
      {title: 'Funkce štítné žlázy', text: 'Pomáhá zejména vyloučit některé příčiny nepravidelných cyklů.'},
      {title: 'Metabolické vyšetření', text: 'Hladina cukru v krvi, někdy lipidový profil podle rizikových faktorů.'},
    ],
    alertTitle: 'Důležité',
    alertText: 'Hormonální výsledky je třeba interpretovat v klinickém kontextu. Jediná hodnota obvykle sama o sobě nestačí k závěru o diagnóze PCOS.',
    section4Body: 'Ultrazvukem lze pozorovat vzhled vaječníků a hledat zejména vysoký počet malých folikulů. Odborníkovi také umožňuje hledat jiné faktory, které by mohly některé příznaky vysvětlit.',
    tip2Title: 'Stojí za to vědět',
    tip2Text: 'Vidět na ultrazvuku mnoho folikulů automaticky neznamená, že máte PCOS. Výsledek je třeba interpretovat spolu se zbytkem vyšetření.',
    section5Body: 'Diagnóza PCOS neumožňuje přesně předpovědět, jak se věci u vás budou vyvíjet. Syndrom se může u jednotlivých žen projevovat velmi odlišně.',
    mythItems: [
      'PCOS automaticky neznamená neplodnost.',
      'PCOS nutně neznamená mít cysty.',
      'Samotná diagnóza neurčuje léčbu.',
      'Normální ultrazvuk PCOS nutně nevylučuje.',
    ],
    section6Body: 'Několik informací připravených předem může odborníkovi pomoci pochopit vaši anamnézu a zvolit nejrelevantnější testy.',
    appointmentQuestions: [
      'Jak dlouho jsou vaše cykly nepravidelné?',
      'Všimla jste si akné, neobvyklého růstu ochlupení nebo vypadávání vlasů?',
      'Vyskytuje se v rodině PCOS nebo cukrovka?',
      'Přejete si otěhotnět v krátkodobém nebo střednědobém horizontu?',
    ],
    preparationTitle: 'Malý tip před návštěvou',
    preparationText: 'Pokud je to možné, zapište si data poslední menstruace, přibližnou délku cyklů, příznaky, které pozorujete, a případnou léčbu či doplňky stravy, které užíváte.',
    summaryTitle: 'To nejdůležitější o vyšetření',
    summaryItems: [
      'Diagnóza se opírá o několik faktorů, nikoli o jediný test.',
      'Krevní test může odhalit některé hormonální nerovnováhy a vyloučit jiné příčiny.',
      'Ultrazvuk může vyšetření podle situace doplnit.',
      'Výsledky by měl vždy interpretovat zdravotnický pracovník.',
    ],
    finalTipTitle: 'Hlavní poznatky',
    finalTipText: 'Vyšetření PCOS není jediný test ani konečný verdikt. Pomáhá vám porozumět svému hormonálnímu fungování, hledat jiné možné příčiny a vybudovat péči přizpůsobenou vaší situaci.',
    disclaimerText: 'Tento článek je pouze informativní a nenahrazuje lékařskou konzultaci ani individuální interpretaci výsledků vašich testů.',
    shareMessage: 'Diagnostika PCOS: testy a vyšetření — AWA',
  },
  sk: {
    badge: 'PCOS',
    title: 'Diagnóza PCOS:\ntesty a vyšetrenia',
    metaDuration: '7 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Stredne pokročilý',
    metaValidated: 'Overený obsah',
    intro: 'Ako sa diagnostikuje PCOS, aké testy sa môžu ponúknuť a ako sa pokojne pripraviť na návštevu.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Pochopenie diagnostického vyšetrenia',
      'Hlavné kroky vyšetrenia',
      'Hormonálny krvný test',
      'Ultrazvuk panvy',
      'Čo diagnóza nehovorí',
      'Príprava na návštevu',
      'Hlavné body',
    ],
    section1Body1: 'Diagnóza syndrómu polycystických vaječníkov sa nezakladá na jedinom teste. Zdravotnícky pracovník dáva dokopy viacero informácií: históriu vašich cyklov, prípadné príznaky, klinické vyšetrenie, laboratórne testy a podľa situácie ultrazvuk.',
    section1Body2: 'Cieľom je jednak hľadať znaky zlučiteľné s PCOS, jednak vylúčiť iné príčiny, ktoré by mohli vysvetliť nepravidelnú menštruáciu alebo niektoré hormonálne príznaky.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Diagnóza je vždy individuálna. Dve ženy s PCOS môžu mať veľmi odlišné príznaky a výsledky testov.',
    section2Body: 'Vyšetrenie môže prebiehať v niekoľkých krokoch. Nemusia sa vykonávať u všetkých rovnako.',
    diagnosisSteps: [
      {title: 'Odber anamnézy', text: 'Odborník zhromažďuje vašu anamnézu: cykly, príznaky, zdravotné pozadie a liečby.'},
      {title: 'Klinické vyšetrenie', text: 'Hľadá najmä znaky nadbytku androgénov a posudzuje váš celkový stav.'},
      {title: 'Krvné vyšetrenie', text: 'Na objasnenie situácie sa môžu požadovať hormonálne a metabolické testy.'},
      {title: 'Ultrazvuk', text: 'Môže vyšetrenie doplniť pozorovaním vzhľadu vaječníkov.'},
    ],
    flowTitle: 'Postup na prvý pohľad',
    flowItems: [
      'Anamnéza a príznaky',
      'Klinické vyšetrenie',
      'Testy podľa situácie',
      'Ultrazvuk v prípade potreby',
    ],
    section3Body1: 'Môže sa ponúknuť krvný test na hľadanie znakov nadbytku androgénov, posúdenie niektorých hormónov podieľajúcich sa na reprodukčnej funkcii a hľadanie iných možných príčin vašich príznakov.',
    section3Body2: 'Zvolené testy závisia od vášho veku, príznakov, zdravotnej anamnézy a toho, čo chce odborník overiť.',
    bloodTests: [
      {title: 'Androgény', text: 'Testosterón a ďalšie hormóny podľa situácie.'},
      {title: 'Funkcia štítnej žľazy', text: 'Pomáha najmä vylúčiť niektoré príčiny nepravidelných cyklov.'},
      {title: 'Metabolické vyšetrenie', text: 'Glykémia, niekedy lipidový profil podľa rizikových faktorov.'},
    ],
    alertTitle: 'Dôležité',
    alertText: 'Hormonálne výsledky treba interpretovať v klinickom kontexte. Jedna hodnota zvyčajne sama nestačí na záver o diagnóze PCOS.',
    section4Body: 'Ultrazvuk sa môže použiť na pozorovanie vzhľadu vaječníkov a hľadanie najmä vysokého počtu malých folikulov. Umožňuje tiež odborníkovi hľadať iné faktory, ktoré by mohli vysvetliť niektoré príznaky.',
    tip2Title: 'Stojí za to vedieť',
    tip2Text: 'Videnie mnohých folikulov na ultrazvuku automaticky neznamená, že máte PCOS. Výsledok treba interpretovať spolu so zvyškom vyšetrenia.',
    section5Body: 'Diagnóza PCOS neumožňuje presne predpovedať, ako sa bude vaša situácia vyvíjať. Syndróm sa môže u rôznych žien prejavovať veľmi odlišne.',
    mythItems: [
      'PCOS automaticky neznamená neplodnosť.',
      'PCOS nutne neznamená mať cysty.',
      'Samotná diagnóza neurčuje liečbu.',
      'Normálny ultrazvuk PCOS nutne nevylučuje.',
    ],
    section6Body: 'Niekoľko vopred pripravených informácií môže pomôcť odborníkovi pochopiť vašu anamnézu a zvoliť najvhodnejšie testy.',
    appointmentQuestions: [
      'Ako dlho sú vaše cykly nepravidelné?',
      'Všimli ste si akné, nezvyčajný rast chlpov alebo vypadávanie vlasov?',
      'Vyskytuje sa v rodine PCOS alebo cukrovka?',
      'Chcete v krátkom alebo strednodobom horizonte otehotnieť?',
    ],
    preparationTitle: 'Malý tip pred návštevou',
    preparationText: 'Ak je to možné, zapíšte si dátumy poslednej menštruácie, približnú dĺžku cyklov, príznaky, ktoré si všímate, a liečby alebo doplnky, ktoré užívate.',
    summaryTitle: 'To najdôležitejšie z vyšetrenia',
    summaryItems: [
      'Diagnóza sa opiera o viacero faktorov, nie o jediný test.',
      'Krvný test môže odhaliť niektoré hormonálne nerovnováhy a vylúčiť iné príčiny.',
      'Ultrazvuk môže vyšetrenie podľa situácie doplniť.',
      'Výsledky by mal vždy interpretovať zdravotnícky pracovník.',
    ],
    finalTipTitle: 'Hlavné body',
    finalTipText: 'Vyšetrenie PCOS nie je jediný test ani konečný verdikt. Pomáha vám pochopiť vaše hormonálne fungovanie, hľadať iné možné príčiny a vybudovať starostlivosť prispôsobenú vašej situácii.',
    disclaimerText: 'Tento článok je iba informatívny a nenahrádza lekársku konzultáciu ani individuálnu interpretáciu výsledkov vašich testov.',
    shareMessage: 'Diagnóza PCOS: testy a vyšetrenia — AWA',
  },
  hu: {
    badge: 'PCOS',
    title: 'A PCOS diagnózisa:\nvizsgálatok és kivizsgálás',
    metaDuration: '7 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Középhaladó',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Hogyan diagnosztizálják a PCOS-t, milyen vizsgálatokat ajánlhatnak, és hogyan készülj fel nyugodtan az időpontodra.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'A diagnosztikai kivizsgálás megértése',
      'A kivizsgálás fő lépései',
      'A hormonális vérvizsgálat',
      'A medencei ultrahang',
      'Amit a diagnózis nem árul el',
      'Felkészülés az időpontodra',
      'Legfontosabb tudnivalók',
    ],
    section1Body1: 'A policisztás ovárium szindróma diagnózisa nem egyetlen vizsgálaton alapul. Az egészségügyi szakember több információt vesz figyelembe: a ciklus-előzményeidet, az esetleges tüneteket, a klinikai vizsgálatot, a laboratóriumi vizsgálatokat és — a helyzettől függően — az ultrahangot.',
    section1Body2: 'A cél egyrészt a PCOS-sel összeegyeztethető jellemzők keresése, másrészt más olyan okok kizárása, amelyek megmagyarázhatják a szabálytalan menstruációt vagy bizonyos hormonális tüneteket.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'A diagnózis mindig egyéni. Két PCOS-sel élő nőnek nagyon eltérő tünetei és vizsgálati eredményei lehetnek.',
    section2Body: 'A kivizsgálás több lépésből állhat. Nem feltétlenül mindenkinél ugyanúgy végzik el mindet.',
    diagnosisSteps: [
      {title: 'Anamnézis felvétele', text: 'A szakember összegyűjti az előzményeidet: ciklusok, tünetek, orvosi háttér és kezelések.'},
      {title: 'Klinikai vizsgálat', text: 'Különösen az androgénfölösleg jeleit keresi, és felméri az általános állapotodat.'},
      {title: 'Vérvizsgálat', text: 'A helyzet tisztázására hormonális és anyagcsere-vizsgálatokat kérhetnek.'},
      {title: 'Ultrahang', text: 'Kiegészítheti a kivizsgálást a petefészkek megjelenésének megfigyelésével.'},
    ],
    flowTitle: 'A folyamat egy pillantásra',
    flowItems: [
      'Anamnézis és tünetek',
      'Klinikai vizsgálat',
      'Vizsgálatok a helyzettől függően',
      'Ultrahang, ha szükséges',
    ],
    section3Body1: 'Vérvizsgálatot ajánlhatnak az androgénfölösleg jeleinek keresésére, a reproduktív működésben szerepet játszó egyes hormonok felmérésére, valamint a tüneteid más lehetséges okainak keresésére.',
    section3Body2: 'A választott vizsgálatok az életkorodtól, a tüneteidtől, az orvosi előzményeidtől és attól függenek, mit szeretne a szakember ellenőrizni.',
    bloodTests: [
      {title: 'Androgének', text: 'Tesztoszteron és más hormonok a helyzettől függően.'},
      {title: 'Pajzsmirigyműködés', text: 'Segít különösen kizárni a szabálytalan ciklusok egyes okait.'},
      {title: 'Anyagcsere-vizsgálat', text: 'Vércukor, néha lipidprofil a kockázati tényezőktől függően.'},
    ],
    alertTitle: 'Fontos',
    alertText: 'A hormonális eredményeket a klinikai kontextusban kell értelmezni. Egyetlen érték általában önmagában nem elég a PCOS-diagnózis levonásához.',
    section4Body: 'Az ultrahang a petefészkek megjelenésének megfigyelésére használható, különösen a kis tüszők magas számának keresésére. Lehetővé teszi a szakember számára azt is, hogy más olyan tényezőket keressen, amelyek megmagyarázhatnak bizonyos tüneteket.',
    tip2Title: 'Érdemes tudni',
    tip2Text: 'Az, hogy sok tüsző látszik az ultrahangon, automatikusan nem jelenti, hogy PCOS-ed van. Az eredményt a kivizsgálás többi részével együtt kell értelmezni.',
    section5Body: 'A PCOS-diagnózis megkapása nem teszi lehetővé, hogy pontosan megjósold, hogyan alakulnak a dolgok nálad. A szindróma személyenként nagyon eltérően jelentkezhet.',
    mythItems: [
      'A PCOS automatikusan nem jelent meddőséget.',
      'A PCOS nem feltétlenül jelent cisztákat.',
      'A diagnózis önmagában nem határozza meg a kezelést.',
      'A normális ultrahang nem feltétlenül zárja ki a PCOS-t.',
    ],
    section6Body: 'Néhány előre előkészített információ segíthet a szakembernek megérteni az előzményeidet, és kiválasztani a legrelevánsabb vizsgálatokat.',
    appointmentQuestions: [
      'Mióta szabálytalanok a ciklusaid?',
      'Észrevettél aknét, szokatlan szőrnövekedést vagy hajhullást?',
      'Van a családban PCOS vagy cukorbetegség?',
      'Szeretnél rövid vagy középtávon teherbe esni?',
    ],
    preparationTitle: 'Egy kis tipp az időpont előtt',
    preparationText: 'Ha lehetséges, jegyezd fel az utolsó menstruációd dátumát, a ciklusaid hozzávetőleges hosszát, a tapasztalt tüneteket, valamint a szedett kezeléseket vagy kiegészítőket.',
    summaryTitle: 'A kivizsgálás lényege',
    summaryItems: [
      'A diagnózis több tényezőn alapul, nem egyetlen vizsgálaton.',
      'A vérvizsgálat kimutathat bizonyos hormonális egyensúlyzavarokat, és kizárhat más okokat.',
      'Az ultrahang a helyzettől függően kiegészítheti a kivizsgálást.',
      'Az eredményeket mindig egészségügyi szakembernek kell értelmeznie.',
    ],
    finalTipTitle: 'Legfontosabb tudnivalók',
    finalTipText: 'A PCOS-kivizsgálás nem egyetlen vizsgálat és nem végső ítélet. Segít megérteni a hormonális működésedet, más lehetséges okokat keresni, és a helyzetedhez illő ellátást felépíteni.',
    disclaimerText: 'Ez a cikk kizárólag tájékoztató jellegű, és nem helyettesíti az orvosi konzultációt vagy a vizsgálati eredményeid személyre szabott értelmezését.',
    shareMessage: 'A PCOS diagnózisa: vizsgálatok és kivizsgálás — AWA',
  },
  ro: {
    badge: 'SOP',
    title: 'Diagnosticarea SOP:\nanalize și investigații',
    metaDuration: '7 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Intermediar',
    metaValidated: 'Conținut revizuit',
    intro: 'Cum este diagnosticat SOP, ce analize pot fi propuse și cum să te pregătești liniștit pentru consultație.',
    contentsTitle: 'În acest articol',
    topics: [
      'Înțelegerea bilanțului de diagnostic',
      'Principalele etape ale bilanțului',
      'Analiza hormonală de sânge',
      'Ecografia pelviană',
      'Ce nu îți spune diagnosticul',
      'Pregătirea consultației',
      'Ce să reții',
    ],
    section1Body1: 'Diagnosticul sindromului ovarelor polichistice nu se bazează pe o singură analiză. Profesionistul din domeniul sănătății reunește mai multe informații: istoricul ciclului tău, eventualele simptome, examenul clinic, analizele de laborator și, în funcție de situație, o ecografie.',
    section1Body2: 'Scopul este atât de a căuta trăsături compatibile cu SOP, cât și de a exclude alte cauze care ar putea explica menstruațiile neregulate sau anumite simptome hormonale.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Diagnosticul este întotdeauna personalizat. Două femei cu SOP pot avea simptome și rezultate ale analizelor foarte diferite.',
    section2Body: 'Bilanțul poate urma mai mulți pași. Ei nu sunt neapărat parcurși la fel pentru toată lumea.',
    diagnosisSteps: [
      {title: 'Anamneza', text: 'Profesionistul îți adună istoricul: cicluri, simptome, antecedente medicale și tratamente.'},
      {title: 'Examenul clinic', text: 'Caută în special semne de exces de androgeni și evaluează starea ta generală.'},
      {title: 'Bilanțul sanguin', text: 'Pot fi cerute analize hormonale și metabolice pentru a clarifica situația.'},
      {title: 'Ecografia', text: 'Poate completa bilanțul prin observarea aspectului ovarelor.'},
    ],
    flowTitle: 'Procesul dintr-o privire',
    flowItems: [
      'Istoric și simptome',
      'Examen clinic',
      'Analize în funcție de situație',
      'Ecografie, la nevoie',
    ],
    section3Body1: 'O analiză de sânge poate fi propusă pentru a căuta semne de exces de androgeni, a evalua anumiți hormoni implicați în funcția reproductivă și a căuta alte cauze posibile ale simptomelor tale.',
    section3Body2: 'Analizele alese depind de vârsta ta, de simptomele tale, de istoricul tău medical și de ceea ce profesionistul dorește să verifice.',
    bloodTests: [
      {title: 'Androgeni', text: 'Testosteron și alți hormoni, în funcție de situație.'},
      {title: 'Funcția tiroidiană', text: 'Ajută în special la excluderea anumitor cauze de cicluri neregulate.'},
      {title: 'Bilanț metabolic', text: 'Glicemie, uneori profil lipidic, în funcție de factorii de risc.'},
    ],
    alertTitle: 'Important',
    alertText: 'Rezultatele hormonale trebuie interpretate împreună cu contextul clinic. O singură valoare nu este de obicei suficientă, singură, pentru a concluziona un diagnostic de SOP.',
    section4Body: 'O ecografie poate fi folosită pentru a observa aspectul ovarelor și a căuta în special un număr mare de foliculi mici. Ea permite și profesionistului să caute alți factori care ar putea explica anumite simptome.',
    tip2Title: 'Bine de știut',
    tip2Text: 'Faptul că se văd mulți foliculi la ecografie nu înseamnă automat că ai SOP. Rezultatul trebuie interpretat împreună cu restul bilanțului.',
    section5Body: 'Primirea unui diagnostic de SOP nu face posibilă prezicerea exactă a modului în care vor evolua lucrurile pentru tine. Sindromul se poate manifesta foarte diferit de la o persoană la alta.',
    mythItems: [
      'SOP nu înseamnă automat infertilitate.',
      'SOP nu înseamnă neapărat a avea chisturi.',
      'Diagnosticul singur nu determină tratamentul.',
      'O ecografie normală nu exclude neapărat SOP.',
    ],
    section6Body: 'Câteva informații pregătite din timp pot ajuta profesionistul să înțeleagă istoricul tău și să aleagă cele mai relevante analize.',
    appointmentQuestions: [
      'De cât timp sunt neregulate ciclurile tale?',
      'Ai observat acnee, creștere neobișnuită a părului sau cădere a părului?',
      'Există antecedente familiale de SOP sau de diabet?',
      'Dorești să rămâi însărcinată pe termen scurt sau mediu?',
    ],
    preparationTitle: 'Un mic sfat înainte de consultație',
    preparationText: 'Dacă este posibil, notează datele ultimei tale menstruații, durata aproximativă a ciclurilor, simptomele pe care le observi și orice tratamente sau suplimente pe care le iei.',
    summaryTitle: 'Esențialul bilanțului',
    summaryItems: [
      'Diagnosticul se bazează pe mai mulți factori, nu pe o singură analiză.',
      'O analiză de sânge poate căuta anumite dezechilibre hormonale și poate exclude alte cauze.',
      'O ecografie poate completa bilanțul în funcție de situație.',
      'Rezultatele trebuie întotdeauna interpretate de un profesionist din domeniul sănătății.',
    ],
    finalTipTitle: 'Ce să reții',
    finalTipText: 'Un bilanț de SOP nu este o singură analiză sau un verdict final. El te ajută să-ți înțelegi funcționarea hormonală, să cauți alte cauze posibile și să construiești îngrijiri adaptate situației tale.',
    disclaimerText: 'Acest articol are doar caracter informativ și nu înlocuiește o consultație medicală sau interpretarea personalizată a rezultatelor tale.',
    shareMessage: 'Diagnosticarea SOP: analize și investigații — AWA',
  },
  bg: {
    badge: 'СПКЯ',
    title: 'Диагноза на СПКЯ:\nизследвания и оценка',
    metaDuration: '7 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Средно ниво',
    metaValidated: 'Проверено съдържание',
    intro: 'Как се поставя диагнозата СПКЯ, какви изследвания могат да бъдат предложени и как да се подготвиш спокойно за прегледа си.',
    contentsTitle: 'В тази статия',
    topics: [
      'Разбиране на диагностичната оценка',
      'Основните стъпки на оценката',
      'Хормоналното кръвно изследване',
      'Тазовата ехография',
      'Какво диагнозата не ти казва',
      'Подготовка за прегледа',
      'Какво да запомниш',
    ],
    section1Body1: 'Диагнозата синдром на поликистозните яйчници не се основава на едно-единствено изследване. Здравният специалист събира няколко информации: историята на цикъла ти, евентуалните симптоми, клиничния преглед, лабораторните изследвания и, според ситуацията, ехография.',
    section1Body2: 'Целта е едновременно да се потърсят характеристики, съответстващи на СПКЯ, и да се изключат други причини, които биха могли да обяснят нередовните менструации или някои хормонални симптоми.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Диагнозата винаги е персонализирана. Две жени със СПКЯ могат да имат много различни симптоми и резултати от изследванията.',
    section2Body: 'Оценката може да следва няколко стъпки. Не непременно всички се извършват по един и същи начин за всеки.',
    diagnosisSteps: [
      {title: 'Снемане на анамнеза', text: 'Специалистът събира историята ти: цикли, симптоми, медицинско минало и лечения.'},
      {title: 'Клиничен преглед', text: 'Търсят се по-специално признаци на излишък от андрогени и се оценява общото ти състояние.'},
      {title: 'Кръвни изследвания', text: 'Могат да бъдат поискани хормонални и метаболитни изследвания, за да се изясни ситуацията.'},
      {title: 'Ехография', text: 'Тя може да допълни оценката, като се наблюдава видът на яйчниците.'},
    ],
    flowTitle: 'Процесът с един поглед',
    flowItems: [
      'Анамнеза и симптоми',
      'Клиничен преглед',
      'Изследвания според ситуацията',
      'Ехография при нужда',
    ],
    section3Body1: 'Може да бъде предложено кръвно изследване, за да се потърсят признаци на излишък от андрогени, да се оценят някои хормони, участващи във възпроизводителната функция, и да се потърсят други възможни причини за симптомите ти.',
    section3Body2: 'Избраните изследвания зависят от възрастта ти, симптомите ти, медицинската ти история и от това, което специалистът иска да провери.',
    bloodTests: [
      {title: 'Андрогени', text: 'Тестостерон и други хормони според ситуацията.'},
      {title: 'Щитовидна функция', text: 'Помага по-специално да се изключат някои причини за нередовни цикли.'},
      {title: 'Метаболитна оценка', text: 'Кръвна захар, понякога липиден профил според рисковите фактори.'},
    ],
    alertTitle: 'Важно',
    alertText: 'Хормоналните резултати трябва да се тълкуват заедно с клиничния контекст. Една-единствена стойност обикновено не е достатъчна сама по себе си, за да се заключи диагноза СПКЯ.',
    section4Body: 'Ехографията може да се използва за наблюдение на вида на яйчниците и по-специално за търсене на голям брой малки фоликули. Тя позволява на специалиста да потърси и други фактори, които биха могли да обяснят някои симптоми.',
    tip2Title: 'Добре е да знаеш',
    tip2Text: 'Виждането на много фоликули на ехографията не означава автоматично, че имаш СПКЯ. Резултатът трябва да се тълкува заедно с останалата част от оценката.',
    section5Body: 'Получаването на диагноза СПКЯ не позволява да се предвиди точно как ще протекат нещата при теб. Синдромът може да се проявява много различно от човек на човек.',
    mythItems: [
      'СПКЯ не означава автоматично безплодие.',
      'СПКЯ не означава непременно наличие на кисти.',
      'Диагнозата сама по себе си не определя лечението.',
      'Нормалната ехография не изключва непременно СПКЯ.',
    ],
    section6Body: 'Няколко информации, подготвени предварително, могат да помогнат на специалиста да разбере историята ти и да избере най-подходящите изследвания.',
    appointmentQuestions: [
      'От колко време циклите ти са нередовни?',
      'Забелязала ли си акне, необичаен растеж на косми или косопад?',
      'Има ли семейна история на СПКЯ или диабет?',
      'Желаеш ли да забременееш в краткосрочен или средносрочен план?',
    ],
    preparationTitle: 'Малък съвет преди прегледа',
    preparationText: 'Ако е възможно, отбележи датите на последната си менструация, приблизителната продължителност на циклите си, симптомите, които забелязваш, и лечения или добавки, които приемаш.',
    summaryTitle: 'Същественото от оценката',
    summaryItems: [
      'Диагнозата се основава на няколко фактора, а не на едно изследване.',
      'Кръвното изследване може да търси някои хормонални дисбаланси и да изключи други причини.',
      'Ехографията може да допълни оценката според ситуацията.',
      'Резултатите винаги трябва да се тълкуват от здравен специалист.',
    ],
    finalTipTitle: 'Какво да запомниш',
    finalTipText: 'Оценката за СПКЯ не е едно изследване или окончателна присъда. Тя ти помага да разбереш хормоналното си функциониране, да потърсиш други възможни причини и да изградиш грижа, подходяща за ситуацията ти.',
    disclaimerText: 'Тази статия е само за информация и не замества медицинска консултация или персонализираното тълкуване на резултатите от изследванията ти.',
    shareMessage: 'Диагноза на СПКЯ: изследвания и оценка — AWA',
  },
  sr: {
    badge: 'ПЦОС',
    title: 'Дијагноза ПЦОС-а:\nанализе и процена',
    metaDuration: '7 мин читања',
    metaType: 'Водич',
    metaLevel: 'Средњи ниво',
    metaValidated: 'Проверен садржај',
    intro: 'Како се ПЦОС дијагностикује, које анализе могу бити предложене и како да се мирно припремиш за преглед.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Разумевање дијагностичке процене',
      'Главни кораци процене',
      'Хормонска анализа крви',
      'Карлични ултразвук',
      'Шта дијагноза не говори',
      'Припрема за преглед',
      'Шта да запамтиш',
    ],
    section1Body1: 'Дијагноза синдрома полицистичних јајника не ослања се на једну анализу. Здравствени радник обједињује неколико информација: историју твог циклуса, евентуалне симптоме, клинички преглед, лабораторијске анализе и, зависно од ситуације, ултразвук.',
    section1Body2: 'Циљ је истовремено потражити одлике које одговарају ПЦОС-у и искључити друге узроке који би могли објаснити нередовну менструацију или неке хормонске симптоме.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Дијагноза је увек персонализована. Две жене са ПЦОС-ом могу имати веома различите симптоме и резултате анализа.',
    section2Body: 'Процена може пратити неколико корака. Они се нужно не изводе на исти начин за све.',
    diagnosisSteps: [
      {title: 'Узимање анамнезе', text: 'Стручњак прикупља твоју историју: циклусе, симптоме, медицинску прошлост и терапије.'},
      {title: 'Клинички преглед', text: 'Посебно се траже знаци вишка андрогена и процењује се твоје опште стање.'},
      {title: 'Анализе крви', text: 'Могу се затражити хормонске и метаболичке анализе ради разјашњавања ситуације.'},
      {title: 'Ултразвук', text: 'Може допунити процену посматрањем изгледа јајника.'},
    ],
    flowTitle: 'Процес укратко',
    flowItems: [
      'Анамнеза и симптоми',
      'Клинички преглед',
      'Анализе зависно од ситуације',
      'Ултразвук по потреби',
    ],
    section3Body1: 'Може се предложити анализа крви да се потраже знаци вишка андрогена, процене одређени хормони који учествују у репродуктивној функцији и потраже други могући узроци твојих симптома.',
    section3Body2: 'Изабране анализе зависе од твојих година, симптома, медицинске историје и онога што стручњак жели да провери.',
    bloodTests: [
      {title: 'Андрогени', text: 'Тестостерон и други хормони зависно од ситуације.'},
      {title: 'Функција штитне жлезде', text: 'Помаже нарочито да се искључе неки узроци нередовних циклуса.'},
      {title: 'Метаболичка процена', text: 'Шећер у крви, понекад липидни профил зависно од фактора ризика.'},
    ],
    alertTitle: 'Важно',
    alertText: 'Хормонске резултате треба тумачити заједно са клиничким контекстом. Једна вредност обично није довољна сама по себи да се закључи дијагноза ПЦОС-а.',
    section4Body: 'Ултразвук се може користити за посматрање изгледа јајника и нарочито за тражење великог броја малих фоликула. Омогућава стручњаку да потражи и друге факторе који би могли објаснити неке симптоме.',
    tip2Title: 'Добро је знати',
    tip2Text: 'Видети много фоликула на ултразвуку не значи аутоматски да имаш ПЦОС. Резултат треба тумачити заједно са остатком процене.',
    section5Body: 'Добијање дијагнозе ПЦОС-а не омогућава да се тачно предвиди како ће се ствари развијати код тебе. Синдром се може веома различито испољавати од особе до особе.',
    mythItems: [
      'ПЦОС не значи аутоматски неплодност.',
      'ПЦОС не значи нужно присуство циста.',
      'Дијагноза сама по себи не одређује лечење.',
      'Нормалан ултразвук не искључује нужно ПЦОС.',
    ],
    section6Body: 'Неколико информација припремљених унапред може помоћи стручњаку да разуме твоју историју и изабере најрелевантније анализе.',
    appointmentQuestions: [
      'Од када су ти циклуси нередовни?',
      'Да ли си приметила акне, необичан раст длака или опадање косе?',
      'Постоји ли породична историја ПЦОС-а или дијабетеса?',
      'Да ли желиш да затрудниш у кратком или средњем року?',
    ],
    preparationTitle: 'Мали савет пре прегледа',
    preparationText: 'Ако је могуће, запиши датуме последње менструације, приближно трајање циклуса, симптоме које примећујеш и све терапије или додатке које узимаш.',
    summaryTitle: 'Основно о процени',
    summaryItems: [
      'Дијагноза се заснива на неколико фактора, а не на једној анализи.',
      'Анализа крви може тражити одређене хормонске неравнотеже и искључити друге узроке.',
      'Ултразвук може допунити процену зависно од ситуације.',
      'Резултате увек треба да тумачи здравствени радник.',
    ],
    finalTipTitle: 'Шта да запамтиш',
    finalTipText: 'Процена за ПЦОС није једна анализа нити коначна пресуда. Она ти помаже да разумеш своје хормонско функционисање, потражиш друге могуће узроке и изградиш негу прилагођену твојој ситуацији.',
    disclaimerText: 'Овај чланак је само за информацију и не замењује лекарску консултацију нити персонализовано тумачење резултата твојих анализа.',
    shareMessage: 'Дијагноза ПЦОС-а: анализе и процена — AWA',
  },
  hr: {
    badge: 'PCOS',
    title: 'Dijagnoza PCOS-a:\npretrage i obrada',
    metaDuration: '7 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Kako se dijagnosticira PCOS, koje se pretrage mogu predložiti i kako se mirno pripremiti za pregled.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Razumijevanje dijagnostičke obrade',
      'Glavni koraci obrade',
      'Hormonska krvna pretraga',
      'Ultrazvuk zdjelice',
      'Što dijagnoza ne govori',
      'Priprema za pregled',
      'Ključne poruke',
    ],
    section1Body1: 'Dijagnoza sindroma policističnih jajnika ne temelji se na jednoj pretrazi. Zdravstveni djelatnik povezuje nekoliko informacija: povijest tvojih ciklusa, eventualne simptome, klinički pregled, laboratorijske pretrage i, ovisno o situaciji, ultrazvuk.',
    section1Body2: 'Cilj je istodobno tražiti obilježja u skladu s PCOS-om i isključiti druge uzroke koji bi mogli objasniti nepravilnu menstruaciju ili određene hormonske simptome.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Dijagnoza je uvijek individualizirana. Dvije žene s PCOS-om mogu imati vrlo različite simptome i rezultate pretraga.',
    section2Body: 'Obrada može slijediti nekoliko koraka. Nisu nužno svi provedeni na isti način kod svih.',
    diagnosisSteps: [
      {title: 'Uzimanje anamneze', text: 'Stručna osoba prikuplja tvoju anamnezu: cikluse, simptome, medicinsku povijest i terapije.'},
      {title: 'Klinički pregled', text: 'Osobito traži znakove viška androgena i procjenjuje tvoje opće stanje.'},
      {title: 'Krvna obrada', text: 'Mogu se zatražiti hormonske i metaboličke pretrage radi razjašnjavanja situacije.'},
      {title: 'Ultrazvuk', text: 'Može upotpuniti obradu promatranjem izgleda jajnika.'},
    ],
    flowTitle: 'Postupak ukratko',
    flowItems: [
      'Anamneza i simptomi',
      'Klinički pregled',
      'Pretrage ovisno o situaciji',
      'Ultrazvuk po potrebi',
    ],
    section3Body1: 'Može se predložiti krvna pretraga radi traženja znakova viška androgena, procjene određenih hormona uključenih u reproduktivnu funkciju i traženja drugih mogućih uzroka tvojih simptoma.',
    section3Body2: 'Odabrane pretrage ovise o tvojoj dobi, simptomima, medicinskoj anamnezi i onome što stručna osoba želi provjeriti.',
    bloodTests: [
      {title: 'Androgeni', text: 'Testosteron i drugi hormoni ovisno o situaciji.'},
      {title: 'Funkcija štitnjače', text: 'Pomaže osobito isključiti određene uzroke nepravilnih ciklusa.'},
      {title: 'Metabolička obrada', text: 'Glukoza u krvi, ponekad lipidogram ovisno o čimbenicima rizika.'},
    ],
    alertTitle: 'Važno',
    alertText: 'Hormonske rezultate treba tumačiti uz klinički kontekst. Jedna vrijednost obično nije dovoljna da sama zaključi dijagnozu PCOS-a.',
    section4Body: 'Ultrazvuk se može koristiti za promatranje izgleda jajnika i osobito za traženje velikog broja malih folikula. Također omogućuje stručnoj osobi da traži druge čimbenike koji bi mogli objasniti određene simptome.',
    tip2Title: 'Dobro je znati',
    tip2Text: 'Vidjeti mnogo folikula na ultrazvuku automatski ne znači da imaš PCOS. Rezultat treba tumačiti uz ostatak obrade.',
    section5Body: 'Primanje dijagnoze PCOS-a ne omogućuje točno predviđanje kako će se stvari odvijati kod tebe. Sindrom se može pokazati vrlo različito od osobe do osobe.',
    mythItems: [
      'PCOS automatski ne znači neplodnost.',
      'PCOS ne znači nužno imati ciste.',
      'Sama dijagnoza ne određuje terapiju.',
      'Uredan ultrazvuk ne isključuje nužno PCOS.',
    ],
    section6Body: 'Nekoliko informacija pripremljenih unaprijed može pomoći stručnoj osobi da razumije tvoju anamnezu i odabere najrelevantnije pretrage.',
    appointmentQuestions: [
      'Koliko dugo su ti ciklusi nepravilni?',
      'Jesi li primijetila akne, neobičan rast dlaka ili gubitak kose?',
      'Postoji li obiteljska povijest PCOS-a ili dijabetesa?',
      'Želiš li zatrudnjeti u kratkoročnom ili srednjoročnom razdoblju?',
    ],
    preparationTitle: 'Mali savjet prije pregleda',
    preparationText: 'Ako je moguće, zabilježi datume posljednje menstruacije, približnu duljinu ciklusa, simptome koje primjećuješ te sve terapije ili dodatke prehrani koje uzimaš.',
    summaryTitle: 'Najvažnije o obradi',
    summaryItems: [
      'Dijagnoza se temelji na nekoliko čimbenika, a ne na jednoj pretrazi.',
      'Krvna pretraga može tražiti određene hormonske neravnoteže i isključiti druge uzroke.',
      'Ultrazvuk može upotpuniti obradu ovisno o situaciji.',
      'Rezultate uvijek treba tumačiti zdravstveni djelatnik.',
    ],
    finalTipTitle: 'Ključne poruke',
    finalTipText: 'Obrada PCOS-a nije jedna pretraga ni konačna presuda. Pomaže ti razumjeti svoje hormonsko funkcioniranje, tražiti druge moguće uzroke i izgraditi skrb prilagođenu tvojoj situaciji.',
    disclaimerText: 'Ovaj je članak samo informativan i ne zamjenjuje liječnički pregled ni individualno tumačenje rezultata tvojih pretraga.',
    shareMessage: 'Dijagnoza PCOS-a: pretrage i obrada — AWA',
  },
  bs: {
    badge: 'PCOS',
    title: 'Dijagnoza PCOS-a:\npretrage i obrada',
    metaDuration: '7 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Kako se dijagnosticira PCOS, koje se pretrage mogu predložiti i kako se mirno pripremiti za pregled.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Razumijevanje dijagnostičke obrade',
      'Glavni koraci obrade',
      'Hormonska krvna pretraga',
      'Ultrazvuk zdjelice',
      'Što dijagnoza ne govori',
      'Priprema za pregled',
      'Ključne poruke',
    ],
    section1Body1: 'Dijagnoza sindroma policističnih jajnika ne temelji se na jednoj pretrazi. Zdravstveni radnik povezuje nekoliko informacija: povijest tvojih ciklusa, eventualne simptome, klinički pregled, laboratorijske pretrage i, ovisno o situaciji, ultrazvuk.',
    section1Body2: 'Cilj je istodobno tražiti obilježja u skladu s PCOS-om i isključiti druge uzroke koji bi mogli objasniti nepravilnu menstruaciju ili određene hormonske simptome.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Dijagnoza je uvijek individualizirana. Dvije žene s PCOS-om mogu imati vrlo različite simptome i rezultate pretraga.',
    section2Body: 'Obrada može slijediti nekoliko koraka. Nisu nužno svi provedeni na isti način kod svih.',
    diagnosisSteps: [
      {title: 'Uzimanje anamneze', text: 'Stručna osoba prikuplja tvoju anamnezu: cikluse, simptome, medicinsku povijest i terapije.'},
      {title: 'Klinički pregled', text: 'Osobito traži znakove viška androgena i procjenjuje tvoje opće stanje.'},
      {title: 'Krvna obrada', text: 'Mogu se zatražiti hormonske i metaboličke pretrage radi razjašnjavanja situacije.'},
      {title: 'Ultrazvuk', text: 'Može upotpuniti obradu promatranjem izgleda jajnika.'},
    ],
    flowTitle: 'Postupak ukratko',
    flowItems: [
      'Anamneza i simptomi',
      'Klinički pregled',
      'Pretrage ovisno o situaciji',
      'Ultrazvuk po potrebi',
    ],
    section3Body1: 'Može se predložiti krvna pretraga radi traženja znakova viška androgena, procjene određenih hormona uključenih u reproduktivnu funkciju i traženja drugih mogućih uzroka tvojih simptoma.',
    section3Body2: 'Odabrane pretrage ovise o tvojoj dobi, simptomima, medicinskoj anamnezi i onome što stručna osoba želi provjeriti.',
    bloodTests: [
      {title: 'Androgeni', text: 'Testosteron i drugi hormoni ovisno o situaciji.'},
      {title: 'Funkcija štitnjače', text: 'Pomaže osobito isključiti određene uzroke nepravilnih ciklusa.'},
      {title: 'Metabolička obrada', text: 'Glukoza u krvi, ponekad lipidogram ovisno o čimbenicima rizika.'},
    ],
    alertTitle: 'Važno',
    alertText: 'Hormonske rezultate treba tumačiti uz klinički kontekst. Jedna vrijednost obično nije dovoljna da sama zaključi dijagnozu PCOS-a.',
    section4Body: 'Ultrazvuk se može koristiti za promatranje izgleda jajnika i osobito za traženje velikog broja malih folikula. Također omogućuje stručnoj osobi da traži druge čimbenike koji bi mogli objasniti određene simptome.',
    tip2Title: 'Dobro je znati',
    tip2Text: 'Vidjeti mnogo folikula na ultrazvuku automatski ne znači da imaš PCOS. Rezultat treba tumačiti uz ostatak obrade.',
    section5Body: 'Primanje dijagnoze PCOS-a ne omogućuje tačno predviđanje kako će se stvari odvijati kod tebe. Sindrom se može pokazati vrlo različito od osobe do osobe.',
    mythItems: [
      'PCOS automatski ne znači neplodnost.',
      'PCOS ne znači nužno imati ciste.',
      'Sama dijagnoza ne određuje terapiju.',
      'Uredan ultrazvuk ne isključuje nužno PCOS.',
    ],
    section6Body: 'Nekoliko informacija pripremljenih unaprijed može pomoći stručnoj osobi da razumije tvoju anamnezu i odabere najrelevantnije pretrage.',
    appointmentQuestions: [
      'Koliko dugo su ti ciklusi nepravilni?',
      'Jesi li primijetila akne, neobičan rast dlaka ili gubitak kose?',
      'Postoji li obiteljska povijest PCOS-a ili dijabetesa?',
      'Želiš li zatrudnjeti u kratkoročnom ili srednjoročnom razdoblju?',
    ],
    preparationTitle: 'Mali savjet prije pregleda',
    preparationText: 'Ako je moguće, zabilježi datume posljednje menstruacije, približnu duljinu ciklusa, simptome koje primjećuješ te sve terapije ili dodatke ishrani koje uzimaš.',
    summaryTitle: 'Najvažnije o obradi',
    summaryItems: [
      'Dijagnoza se temelji na nekoliko čimbenika, a ne na jednoj pretrazi.',
      'Krvna pretraga može tražiti određene hormonske neravnoteže i isključiti druge uzroke.',
      'Ultrazvuk može upotpuniti obradu ovisno o situaciji.',
      'Rezultate uvijek treba tumačiti zdravstveni radnik.',
    ],
    finalTipTitle: 'Ključne poruke',
    finalTipText: 'Obrada PCOS-a nije jedna pretraga ni konačna presuda. Pomaže ti razumjeti svoje hormonsko funkcioniranje, tražiti druge moguće uzroke i izgraditi skrb prilagođenu tvojoj situaciji.',
    disclaimerText: 'Ovaj je članak samo informativan i ne zamjenjuje ljekarski pregled ni individualno tumačenje rezultata tvojih pretraga.',
    shareMessage: 'Dijagnoza PCOS-a: pretrage i obrada — AWA',
  },
  sl: {
    badge: 'PCOS',
    title: 'Diagnoza PCOS:\npreiskave in obravnava',
    metaDuration: '7 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Srednja raven',
    metaValidated: 'Preverjena vsebina',
    intro: 'Kako se diagnosticira PCOS, katere preiskave se lahko predlagajo in kako se mirno pripraviti na pregled.',
    contentsTitle: 'V tem članku',
    topics: [
      'Razumevanje diagnostične obravnave',
      'Glavni koraki obravnave',
      'Hormonska krvna preiskava',
      'Ultrazvok medenice',
      'Kaj diagnoza ne pove',
      'Priprava na pregled',
      'Ključna sporočila',
    ],
    section1Body1: 'Diagnoza sindroma policističnih jajčnikov ne temelji na eni sami preiskavi. Zdravstveni delavec združuje več podatkov: zgodovino tvojih ciklov, morebitne simptome, klinični pregled, laboratorijske preiskave in, glede na situacijo, ultrazvok.',
    section1Body2: 'Cilj je hkrati iskati značilnosti, skladne s PCOS, in izključiti druge vzroke, ki bi lahko pojasnili nepravilno menstruacijo ali določene hormonske simptome.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Diagnoza je vedno individualizirana. Dve ženski s PCOS imata lahko zelo različne simptome in rezultate preiskav.',
    section2Body: 'Obravnava lahko sledi več korakom. Niso nujno vsi izvedeni na enak način pri vseh.',
    diagnosisSteps: [
      {title: 'Odvzem anamneze', text: 'Strokovnjak zbere tvojo anamnezo: cikle, simptome, zdravstveno zgodovino in zdravljenja.'},
      {title: 'Klinični pregled', text: 'Zlasti išče znake presežka androgenov in ocenjuje tvoje splošno stanje.'},
      {title: 'Krvna obravnava', text: 'Lahko se zahtevajo hormonske in presnovne preiskave za razjasnitev situacije.'},
      {title: 'Ultrazvok', text: 'Lahko dopolni obravnavo z opazovanjem videza jajčnikov.'},
    ],
    flowTitle: 'Postopek na kratko',
    flowItems: [
      'Anamneza in simptomi',
      'Klinični pregled',
      'Preiskave glede na situacijo',
      'Ultrazvok po potrebi',
    ],
    section3Body1: 'Lahko se predlaga krvna preiskava za iskanje znakov presežka androgenov, oceno določenih hormonov, vpletenih v reproduktivno funkcijo, in iskanje drugih možnih vzrokov tvojih simptomov.',
    section3Body2: 'Izbrane preiskave so odvisne od tvoje starosti, simptomov, zdravstvene zgodovine in tega, kar želi strokovnjak preveriti.',
    bloodTests: [
      {title: 'Androgeni', text: 'Testosteron in drugi hormoni glede na situacijo.'},
      {title: 'Delovanje ščitnice', text: 'Pomaga zlasti izključiti določene vzroke nepravilnih ciklov.'},
      {title: 'Presnovna obravnava', text: 'Glukoza v krvi, včasih lipidogram glede na dejavnike tveganja.'},
    ],
    alertTitle: 'Pomembno',
    alertText: 'Hormonske rezultate je treba razlagati ob kliničnem kontekstu. Ena sama vrednost običajno ni dovolj, da sama zaključi diagnozo PCOS.',
    section4Body: 'Ultrazvok se lahko uporabi za opazovanje videza jajčnikov in zlasti za iskanje velikega števila majhnih foliklov. Strokovnjaku omogoča tudi iskanje drugih dejavnikov, ki bi lahko pojasnili določene simptome.',
    tip2Title: 'Vredno vedeti',
    tip2Text: 'Videti veliko foliklov na ultrazvoku samodejno ne pomeni, da imaš PCOS. Rezultat je treba razlagati ob preostali obravnavi.',
    section5Body: 'Prejem diagnoze PCOS ne omogoča natančnega napovedovanja, kako bodo stvari potekale pri tebi. Sindrom se lahko kaže zelo različno od osebe do osebe.',
    mythItems: [
      'PCOS samodejno ne pomeni neplodnosti.',
      'PCOS ne pomeni nujno imeti cist.',
      'Sama diagnoza ne določa zdravljenja.',
      'Normalen ultrazvok PCOS nujno ne izključuje.',
    ],
    section6Body: 'Nekaj vnaprej pripravljenih podatkov lahko strokovnjaku pomaga razumeti tvojo anamnezo in izbrati najustreznejše preiskave.',
    appointmentQuestions: [
      'Kako dolgo so ti cikli neredni?',
      'Si opazila akne, nenavadno rast dlak ali izpadanje las?',
      'Ali obstaja družinska zgodovina PCOS ali sladkorne bolezni?',
      'Ali želiš zanositi kratkoročno ali srednjeročno?',
    ],
    preparationTitle: 'Majhen nasvet pred pregledom',
    preparationText: 'Če je mogoče, zabeleži datume zadnje menstruacije, približno dolžino ciklov, simptome, ki jih opažaš, ter vsa zdravljenja ali prehranska dopolnila, ki jih jemlješ.',
    summaryTitle: 'Najpomembnejše o obravnavi',
    summaryItems: [
      'Diagnoza temelji na več dejavnikih, ne na eni sami preiskavi.',
      'Krvna preiskava lahko išče določena hormonska neravnovesja in izključi druge vzroke.',
      'Ultrazvok lahko dopolni obravnavo glede na situacijo.',
      'Rezultate mora vedno razlagati zdravstveni delavec.',
    ],
    finalTipTitle: 'Ključna sporočila',
    finalTipText: 'Obravnava PCOS ni ena sama preiskava niti dokončna sodba. Pomaga ti razumeti svoje hormonsko delovanje, iskati druge možne vzroke in zgraditi oskrbo, prilagojeno tvoji situaciji.',
    disclaimerText: 'Ta članek je samo informativen in ne nadomešča zdravniškega pregleda niti individualne razlage rezultatov tvojih preiskav.',
    shareMessage: 'Diagnoza PCOS: preiskave in obravnava — AWA',
  },
  ne: {
    badge: 'PCOS',
    title: 'PCOS को निदान:\nपरीक्षण र जाँच',
    metaDuration: '7 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'PCOS को निदान कसरी गरिन्छ, कुन परीक्षणहरू प्रस्ताव गरिन सक्छन्, र आफ्नो भेटघाटको शान्तिपूर्वक तयारी कसरी गर्ने।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'निदानको जाँच बुझ्ने',
      'जाँचका मुख्य चरणहरू',
      'हर्मोनल रगत परीक्षण',
      'पेल्भिक अल्ट्रासाउन्ड',
      'निदानले के बताउँदैन',
      'आफ्नो भेटघाटको तयारी',
      'मुख्य कुराहरू',
    ],
    section1Body1: 'पोलिसिस्टिक ओभरी सिन्ड्रोमको निदान कुनै एउटा परीक्षणमा निर्भर गर्दैन। स्वास्थ्यकर्मीले धेरै जानकारी जम्मा गर्छन्: तपाईंको चक्रको इतिहास, कुनै लक्षण, क्लिनिकल जाँच, ल्याब परीक्षण, र अवस्थाअनुसार अल्ट्रासाउन्ड।',
    section1Body2: 'लक्ष्य PCOS सँग मेल खाने विशेषताहरू खोज्नु र अनियमित महिनावारी वा केही हर्मोनल लक्षणहरू व्याख्या गर्न सक्ने अन्य कारणहरू हटाउनु दुवै हो।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'निदान सधैँ व्यक्तिगत हुन्छ। PCOS भएका दुई महिलाका लक्षण र परीक्षणका नतिजा निकै फरक हुन सक्छन्।',
    section2Body: 'जाँच धेरै चरणहरू पछ्याउन सक्छ। ती सबैका लागि अनिवार्य रूपमा उही तरिकाले गरिँदैनन्।',
    diagnosisSteps: [
      {title: 'इतिहास लिने', text: 'व्यावसायिकले तपाईंको इतिहास जम्मा गर्छन्: चक्र, लक्षण, चिकित्सकीय पृष्ठभूमि र उपचार।'},
      {title: 'क्लिनिकल जाँच', text: 'तिनीहरूले विशेष गरी अतिरिक्त एन्ड्रोजनका संकेत खोज्छन् र तपाईंको समग्र अवस्थाको मूल्याङ्कन गर्छन्।'},
      {title: 'रगतको जाँच', text: 'अवस्था स्पष्ट पार्न हर्मोनल र मेटाबोलिक परीक्षणहरू माग्न सकिन्छ।'},
      {title: 'अल्ट्रासाउन्ड', text: 'यसले अण्डाशयको रूप अवलोकन गरेर जाँचलाई पूरा गर्न सक्छ।'},
    ],
    flowTitle: 'एक नजरमा प्रक्रिया',
    flowItems: [
      'इतिहास र लक्षणहरू',
      'क्लिनिकल जाँच',
      'अवस्थाअनुसार परीक्षणहरू',
      'आवश्यक परे अल्ट्रासाउन्ड',
    ],
    section3Body1: 'अतिरिक्त एन्ड्रोजनका संकेत खोज्न, प्रजनन कार्यमा सहभागी केही हर्मोनको मूल्याङ्कन गर्न, र तपाईंका लक्षणका अन्य सम्भावित कारण खोज्न रगत परीक्षण प्रस्ताव गर्न सकिन्छ।',
    section3Body2: 'छानिने परीक्षणहरू तपाईंको उमेर, लक्षण, चिकित्सकीय इतिहास र व्यावसायिकले के जाँच्न खोजिरहेका छन् भन्नेमा निर्भर गर्छन्।',
    bloodTests: [
      {title: 'एन्ड्रोजन', text: 'टेस्टोस्टेरोन र अवस्थाअनुसार अन्य हर्मोनहरू।'},
      {title: 'थाइरोइडको कार्य', text: 'विशेष गरी अनियमित चक्रका केही कारणहरू हटाउन मद्दत गर्छ।'},
      {title: 'मेटाबोलिक जाँच', text: 'रगतमा चिनी, जोखिम कारकअनुसार कहिलेकाहीँ बोसोको प्यानल।'},
    ],
    alertTitle: 'महत्त्वपूर्ण',
    alertText: 'हर्मोनल नतिजाहरूलाई क्लिनिकल सन्दर्भसँगै व्याख्या गर्नुपर्छ। एउटै मानले आफैँमा PCOS को निदान निष्कर्षमा पुर्‍याउन प्रायः पर्याप्त हुँदैन।',
    section4Body: 'अल्ट्रासाउन्डलाई अण्डाशयको रूप अवलोकन गर्न र विशेष गरी धेरै सङ्ख्यामा साना फोलिकलहरू खोज्न प्रयोग गर्न सकिन्छ। यसले व्यावसायिकलाई केही लक्षण व्याख्या गर्न सक्ने अन्य कारकहरू खोज्न पनि दिन्छ।',
    tip2Title: 'जान्न लायक',
    tip2Text: 'अल्ट्रासाउन्डमा धेरै फोलिकल देख्नुको अर्थ तपाईंलाई PCOS छ भन्ने स्वतः होइन। नतिजालाई बाँकी जाँचसँगै व्याख्या गर्नुपर्छ।',
    section5Body: 'PCOS को निदान पाउनुले तपाईंका लागि कुरा ठ्याक्कै कसरी अघि बढ्छ पूर्वानुमान गर्न सम्भव बनाउँदैन। यो सिन्ड्रोम एक व्यक्तिदेखि अर्कोमा निकै फरक रूपमा देखिन सक्छ।',
    mythItems: [
      'PCOS को अर्थ स्वतः बाँझोपन होइन।',
      'PCOS को अर्थ अनिवार्य रूपमा सिस्ट हुनु होइन।',
      'निदान आफैँले उपचार निर्धारण गर्दैन।',
      'सामान्य अल्ट्रासाउन्डले अनिवार्य रूपमा PCOS लाई हटाउँदैन।',
    ],
    section6Body: 'पहिले नै तयार पारिएका केही जानकारीले व्यावसायिकलाई तपाईंको इतिहास बुझ्न र सबैभन्दा सान्दर्भिक परीक्षणहरू छान्न मद्दत गर्न सक्छन्।',
    appointmentQuestions: [
      'तपाईंका चक्रहरू कति समयदेखि अनियमित छन्?',
      'के तपाईंले पिम्पल, असामान्य कपाल वृद्धि, वा कपाल झर्ने देख्नुभएको छ?',
      'के PCOS वा मधुमेहको पारिवारिक इतिहास छ?',
      'के तपाईं छोटो वा मध्यम अवधिमा गर्भवती हुन चाहनुहुन्छ?',
    ],
    preparationTitle: 'भेटघाटअघि एउटा सानो सुझाव',
    preparationText: 'सम्भव भए, आफ्नो पछिल्लो महिनावारीका मिति, चक्रको करिब अवधि, तपाईंले देखिरहनुभएका लक्षण, र लिइरहनुभएका उपचार वा पूरकहरू टिप्नुहोस्।',
    summaryTitle: 'जाँचका आवश्यक कुराहरू',
    summaryItems: [
      'निदान एउटा परीक्षणमा होइन, धेरै कारकहरूमा निर्भर गर्छ।',
      'रगत परीक्षणले केही हर्मोनल असन्तुलन खोज्न र अन्य कारणहरू हटाउन सक्छ।',
      'अल्ट्रासाउन्डले अवस्थाअनुसार जाँचलाई पूरा गर्न सक्छ।',
      'नतिजाहरू सधैँ स्वास्थ्यकर्मीले व्याख्या गर्नुपर्छ।',
    ],
    finalTipTitle: 'मुख्य कुराहरू',
    finalTipText: 'PCOS को जाँच एउटा परीक्षण वा अन्तिम निर्णय होइन। यसले तपाईंको हर्मोनल कार्य बुझ्न, अन्य सम्भावित कारणहरू खोज्न, र तपाईंको अवस्थाअनुसार मिल्ने हेरचाह निर्माण गर्न मद्दत गर्छ।',
    disclaimerText: 'यो लेख केवल जानकारीका लागि हो र चिकित्सकीय परामर्श वा तपाईंका परीक्षण नतिजाको व्यक्तिगत व्याख्याको स्थान लिँदैन।',
    shareMessage: 'PCOS को निदान: परीक्षण र जाँच — AWA',
  },
  si: {
    badge: 'PCOS',
    title: 'PCOS රෝග විනිශ්චය:\nපරීක්ෂණ සහ විමර්ශන',
    metaDuration: 'කියවීමට මිනිත්තු 7',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'මධ්‍යම',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'PCOS රෝග විනිශ්චය කරන ආකාරය, ඉදිරිපත් කළ හැකි පරීක්ෂණ මොනවාද, සහ ඔබේ හමුවීමට සන්සුන්ව සූදානම් වන්නේ කෙසේද.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'රෝග විනිශ්චය විමර්ශනය තේරුම් ගැනීම',
      'විමර්ශනයේ ප්‍රධාන පියවර',
      'හෝමෝන රුධිර පරීක්ෂණය',
      'ශ්‍රෝණි අල්ට්‍රාසවුන්ඩ්',
      'රෝග විනිශ්චය ඔබට නොකියන දේ',
      'ඔබේ හමුවීමට සූදානම් වීම',
      'ප්‍රධාන කරුණු',
    ],
    section1Body1: 'බහු-කෝෂිකා ඩිම්බකෝෂ සහලක්ෂණයේ රෝග විනිශ්චය තනි පරීක්ෂණයක් මත රඳා නොපවතී. සෞඛ්‍ය වෘත්තිකයා තොරතුරු කිහිපයක් එකට ගෙන එයි: ඔබේ චක්‍ර ඉතිහාසය, ඕනෑම රෝග ලක්ෂණ, සායනික පරීක්ෂාව, රසායනාගාර පරීක්ෂණ සහ, තත්ත්වය අනුව, අල්ට්‍රාසවුන්ඩ් පරීක්ෂණයක්.',
    section1Body2: 'අරමුණ PCOS සමඟ අනුකූල ලක්ෂණ සෙවීම සහ අක්‍රමවත් ඔසප් හෝ සමහර හෝමෝන රෝග ලක්ෂණ පැහැදිලි කළ හැකි වෙනත් හේතු බැහැර කිරීම යන දෙකම වේ.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'රෝග විනිශ්චය සෑම විටම පුද්ගලීකරණය වේ. PCOS ඇති කාන්තාවන් දෙදෙනෙකුට ඉතා වෙනස් රෝග ලක්ෂණ සහ පරීක්ෂණ ප්‍රතිඵල තිබිය හැක.',
    section2Body: 'විමර්ශනය පියවර කිහිපයක් අනුගමනය කළ හැක. ඒවා සෑම කෙනෙකුටම අනිවාර්යයෙන්ම එකම ආකාරයෙන් ඉටු නොවේ.',
    diagnosisSteps: [
      {title: 'ඉතිහාසය ලබාගැනීම', text: 'වෘත්තිකයා ඔබේ ඉතිහාසය රැස් කරයි: චක්‍ර, රෝග ලක්ෂණ, වෛද්‍ය පසුබිම සහ ප්‍රතිකාර.'},
      {title: 'සායනික පරීක්ෂාව', text: 'ඔවුන් විශේෂයෙන් අධික ඇන්ඩ්‍රජන් සලකුණු සොයා ඔබේ සමස්ත තත්ත්වය තක්සේරු කරයි.'},
      {title: 'රුධිර විමර්ශනය', text: 'තත්ත්වය පැහැදිලි කිරීමට හෝමෝන සහ පරිවෘත්තීය පරීක්ෂණ ඉල්ලා සිටිය හැක.'},
      {title: 'අල්ට්‍රාසවුන්ඩ්', text: 'එයට ඩිම්බකෝෂවල පෙනුම නිරීක්ෂණය කිරීමෙන් විමර්ශනය සම්පූර්ණ කළ හැක.'},
    ],
    flowTitle: 'ක්‍රියාවලිය එක් බැල්මකින්',
    flowItems: [
      'ඉතිහාසය සහ රෝග ලක්ෂණ',
      'සායනික පරීක්ෂාව',
      'තත්ත්වය අනුව පරීක්ෂණ',
      'අවශ්‍ය නම් අල්ට්‍රාසවුන්ඩ්',
    ],
    section3Body1: 'අධික ඇන්ඩ්‍රජන් සලකුණු සෙවීමට, ප්‍රජනන ක්‍රියාවට සම්බන්ධ සමහර හෝමෝන තක්සේරු කිරීමට සහ ඔබේ රෝග ලක්ෂණවල වෙනත් ඇතිවිය හැකි හේතු සෙවීමට රුධිර පරීක්ෂණයක් යෝජනා කළ හැක.',
    section3Body2: 'තෝරාගත් පරීක්ෂණ රඳා පවතින්නේ ඔබේ වයස, ඔබේ රෝග ලක්ෂණ, ඔබේ වෛද්‍ය ඉතිහාසය සහ වෘත්තිකයා පරීක්ෂා කිරීමට අදහස් කරන දේ මතය.',
    bloodTests: [
      {title: 'ඇන්ඩ්‍රජන්', text: 'ටෙස්ටොස්ටරෝන් සහ තත්ත්වය අනුව වෙනත් හෝමෝන.'},
      {title: 'තයිරොයිඩ් ක්‍රියාකාරිත්වය', text: 'විශේෂයෙන් අක්‍රමවත් චක්‍රවල සමහර හේතු බැහැර කිරීමට උපකාරී වේ.'},
      {title: 'පරිවෘත්තීය විමර්ශනය', text: 'රුධිර ග්ලූකෝස්, අවදානම් සාධක අනුව සමහර විට ලිපිඩ පරීක්ෂාවක්.'},
    ],
    alertTitle: 'වැදගත්',
    alertText: 'හෝමෝන ප්‍රතිඵල සායනික සන්දර්භය සමඟ අර්ථකථනය කළ යුතුයි. තනි අගයක් සාමාන්‍යයෙන් තනිවම PCOS රෝග විනිශ්චයක් නිගමනය කිරීමට ප්‍රමාණවත් නොවේ.',
    section4Body: 'ඩිම්බකෝෂවල පෙනුම නිරීක්ෂණය කිරීමට සහ විශේෂයෙන් කුඩා ෆොලිකල් ඉහළ ගණනක් සෙවීමට අල්ට්‍රාසවුන්ඩ් භාවිතා කළ හැක. එය සමහර රෝග ලක්ෂණ පැහැදිලි කළ හැකි වෙනත් සාධක සෙවීමටද වෘත්තිකයාට ඉඩ සලසයි.',
    tip2Title: 'දැනගත යුතු දේ',
    tip2Text: 'අල්ට්‍රාසවුන්ඩ් පරීක්ෂණයේ ෆොලිකල් රාශියක් දැකීම ඔබට ස්වයංක්‍රීයව PCOS ඇති බව අදහස් නොවේ. ප්‍රතිඵලය විමර්ශනයේ ඉතිරි කොටස සමඟ අර්ථකථනය කළ යුතුයි.',
    section5Body: 'PCOS රෝග විනිශ්චයක් ලැබීම ඔබට දේවල් හරියටම ප්‍රගතියක් ලබන ආකාරය පුරෝකථනය කිරීමට ඉඩ නොදේ. මෙම සහලක්ෂණය පුද්ගලයාගෙන් පුද්ගලයාට ඉතා වෙනස් ලෙස ප්‍රකාශ විය හැක.',
    mythItems: [
      'PCOS ස්වයංක්‍රීයව නිසරු බව අදහස් නොවේ.',
      'PCOS අනිවාර්යයෙන්ම කෝෂිකා තිබීම අදහස් නොවේ.',
      'රෝග විනිශ්චය තනිවම ප්‍රතිකාරය තීරණය නොකරයි.',
      'සාමාන්‍ය අල්ට්‍රාසවුන්ඩ් පරීක්ෂණයක් PCOS අනිවාර්යයෙන්ම බැහැර නොකරයි.',
    ],
    section6Body: 'කල්තියා සූදානම් කළ තොරතුරු කිහිපයක් වෘත්තිකයාට ඔබේ ඉතිහාසය තේරුම් ගැනීමට සහ වඩාත්ම අදාළ පරීක්ෂණ තෝරාගැනීමට උපකාරී විය හැක.',
    appointmentQuestions: [
      'ඔබේ චක්‍ර අක්‍රමවත් වී කොපමණ කාලයක්ද?',
      'ඔබ කුරුලෑ, අසාමාන්‍ය කෙස් වර්ධනය, හෝ කෙස් ගැලවීම දැක තිබේද?',
      'PCOS හෝ දියවැඩියාවේ පවුල් ඉතිහාසයක් තිබේද?',
      'ඔබ කෙටි හෝ මධ්‍ය කාලීනව ගැබ්ගැනීමට කැමතිද?',
    ],
    preparationTitle: 'හමුවීමට පෙර කුඩා ඉඟියක්',
    preparationText: 'හැකි නම්, ඔබේ අවසාන ඔසප් දින, ඔබේ චක්‍රවල ආසන්න දිග, ඔබ දකින රෝග ලක්ෂණ සහ ඔබ ගන්නා ඕනෑම ප්‍රතිකාර හෝ අතිරේක සටහන් කරන්න.',
    summaryTitle: 'විමර්ශනයේ අත්‍යවශ්‍ය දේ',
    summaryItems: [
      'රෝග විනිශ්චය තනි පරීක්ෂණයක් නොව සාධක කිහිපයක් මත රඳා පවතී.',
      'රුධිර පරීක්ෂණයකට සමහර හෝමෝන අසමතුලිතතා සොයා වෙනත් හේතු බැහැර කළ හැක.',
      'තත්ත්වය අනුව අල්ට්‍රාසවුන්ඩ් පරීක්ෂණයකට විමර්ශනය සම්පූර්ණ කළ හැක.',
      'ප්‍රතිඵල සෑම විටම සෞඛ්‍ය වෘත්තිකයෙකු විසින් අර්ථකථනය කළ යුතුයි.',
    ],
    finalTipTitle: 'ප්‍රධාන කරුණු',
    finalTipText: 'PCOS විමර්ශනයක් තනි පරීක්ෂණයක් හෝ අවසාන තීන්දුවක් නොවේ. එය ඔබේ හෝමෝන ක්‍රියාකාරිත්වය තේරුම් ගැනීමට, වෙනත් ඇතිවිය හැකි හේතු සෙවීමට සහ ඔබේ තත්ත්වයට ගැළපෙන සත්කාර ගොඩනැගීමට ඔබට උපකාරී වේ.',
    disclaimerText: 'මෙම ලිපිය තොරතුරු සඳහා පමණි, එය වෛද්‍ය උපදේශනයක් හෝ ඔබේ පරීක්ෂණ ප්‍රතිඵලවල පුද්ගලීකරණය කළ අර්ථකථනයක් වෙනුවට නොපවතී.',
    shareMessage: 'PCOS රෝග විනිශ්චය: පරීක්ෂණ සහ විමර්ශන — AWA',
  },
  th: {
    badge: 'PCOS',
    title: 'การวินิจฉัย PCOS:\nการตรวจและการประเมิน',
    metaDuration: 'อ่าน 7 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'ปานกลาง',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'PCOS วินิจฉัยอย่างไร อาจเสนอการตรวจอะไรบ้าง และเตรียมตัวสำหรับการนัดหมายของคุณอย่างสงบได้อย่างไร',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ทำความเข้าใจการประเมินเพื่อวินิจฉัย',
      'ขั้นตอนหลักของการประเมิน',
      'การตรวจเลือดดูฮอร์โมน',
      'อัลตราซาวนด์อุ้งเชิงกราน',
      'สิ่งที่การวินิจฉัยไม่ได้บอกคุณ',
      'เตรียมตัวสำหรับการนัดหมายของคุณ',
      'ประเด็นสำคัญ',
    ],
    section1Body1: 'การวินิจฉัยกลุ่มอาการถุงน้ำรังไข่หลายใบไม่ได้อาศัยการตรวจเพียงอย่างเดียว บุคลากรทางการแพทย์รวบรวมข้อมูลหลายอย่าง: ประวัติรอบเดือนของคุณ อาการใด ๆ การตรวจร่างกาย การตรวจทางห้องปฏิบัติการ และตามสถานการณ์ อัลตราซาวนด์',
    section1Body2: 'เป้าหมายคือทั้งค้นหาลักษณะที่สอดคล้องกับ PCOS และตัดสาเหตุอื่นที่อาจอธิบายประจำเดือนที่ไม่สม่ำเสมอหรืออาการทางฮอร์โมนบางอย่าง',
    tip1Title: 'ควรรู้',
    tip1Text: 'การวินิจฉัยเป็นแบบเฉพาะบุคคลเสมอ ผู้หญิงสองคนที่เป็น PCOS อาจมีอาการและผลตรวจต่างกันมาก',
    section2Body: 'การประเมินอาจมีหลายขั้นตอน ไม่จำเป็นต้องทำเหมือนกันสำหรับทุกคน',
    diagnosisSteps: [
      {title: 'การซักประวัติ', text: 'ผู้เชี่ยวชาญรวบรวมประวัติของคุณ: รอบเดือน อาการ ประวัติทางการแพทย์ และการรักษา'},
      {title: 'การตรวจร่างกาย', text: 'มองหาสัญญาณของแอนโดรเจนที่มากเกินไปโดยเฉพาะ และประเมินสภาพโดยรวมของคุณ'},
      {title: 'การตรวจเลือด', text: 'อาจขอตรวจฮอร์โมนและการเผาผลาญเพื่อทำให้สถานการณ์ชัดเจนขึ้น'},
      {title: 'อัลตราซาวนด์', text: 'ช่วยเสริมการประเมินโดยสังเกตลักษณะของรังไข่'},
    ],
    flowTitle: 'ภาพรวมของกระบวนการ',
    flowItems: [
      'ประวัติและอาการ',
      'การตรวจร่างกาย',
      'การตรวจตามสถานการณ์',
      'อัลตราซาวนด์หากจำเป็น',
    ],
    section3Body1: 'อาจเสนอการตรวจเลือดเพื่อค้นหาสัญญาณของแอนโดรเจนที่มากเกินไป ประเมินฮอร์โมนบางอย่างที่เกี่ยวข้องกับการทำงานของระบบสืบพันธุ์ และค้นหาสาเหตุอื่นที่เป็นไปได้ของอาการของคุณ',
    section3Body2: 'การตรวจที่เลือกขึ้นอยู่กับอายุ อาการ ประวัติทางการแพทย์ของคุณ และสิ่งที่ผู้เชี่ยวชาญต้องการตรวจสอบ',
    bloodTests: [
      {title: 'แอนโดรเจน', text: 'เทสโทสเตอโรนและฮอร์โมนอื่นตามสถานการณ์'},
      {title: 'การทำงานของต่อมไทรอยด์', text: 'ช่วยตัดสาเหตุบางอย่างของรอบเดือนที่ไม่สม่ำเสมอ'},
      {title: 'การประเมินการเผาผลาญ', text: 'น้ำตาลในเลือด บางครั้งตรวจไขมันตามปัจจัยเสี่ยง'},
    ],
    alertTitle: 'สำคัญ',
    alertText: 'ผลฮอร์โมนต้องแปลผลร่วมกับบริบททางคลินิก ค่าเดียวมักไม่เพียงพอด้วยตัวเองที่จะสรุปการวินิจฉัย PCOS',
    section4Body: 'อัลตราซาวนด์ใช้สังเกตลักษณะของรังไข่และค้นหาฟอลลิเคิลเล็ก ๆ จำนวนมากโดยเฉพาะ ยังช่วยให้ผู้เชี่ยวชาญค้นหาปัจจัยอื่นที่อาจอธิบายอาการบางอย่าง',
    tip2Title: 'ควรรู้',
    tip2Text: 'การเห็นฟอลลิเคิลจำนวนมากจากอัลตราซาวนด์ไม่ได้หมายความโดยอัตโนมัติว่าคุณเป็น PCOS ผลต้องแปลร่วมกับส่วนอื่นของการประเมิน',
    section5Body: 'การได้รับการวินิจฉัย PCOS ไม่ได้ทำให้ทำนายได้อย่างแน่ชัดว่าจะดำเนินไปอย่างไรสำหรับคุณ กลุ่มอาการนี้อาจปรากฏต่างกันมากในแต่ละคน',
    mythItems: [
      'PCOS ไม่ได้หมายถึงการมีบุตรยากโดยอัตโนมัติ',
      'PCOS ไม่จำเป็นต้องมีถุงน้ำ',
      'การวินิจฉัยเพียงอย่างเดียวไม่ได้กำหนดการรักษา',
      'อัลตราซาวนด์ปกติไม่จำเป็นต้องตัด PCOS ออก',
    ],
    section6Body: 'ข้อมูลไม่กี่อย่างที่เตรียมไว้ล่วงหน้าช่วยให้ผู้เชี่ยวชาญเข้าใจประวัติของคุณและเลือกการตรวจที่เกี่ยวข้องที่สุด',
    appointmentQuestions: [
      'รอบเดือนของคุณไม่สม่ำเสมอมานานเท่าไร?',
      'คุณสังเกตเห็นสิว ขนขึ้นผิดปกติ หรือผมร่วงหรือไม่?',
      'มีประวัติ PCOS หรือเบาหวานในครอบครัวหรือไม่?',
      'คุณต้องการตั้งครรภ์ในระยะสั้นหรือระยะกลางหรือไม่?',
    ],
    preparationTitle: 'เคล็ดลับเล็ก ๆ ก่อนการนัดหมาย',
    preparationText: 'หากเป็นไปได้ ให้จดวันที่ประจำเดือนครั้งล่าสุด ความยาวโดยประมาณของรอบเดือน อาการที่คุณสังเกต และการรักษาหรืออาหารเสริมที่คุณทานอยู่',
    summaryTitle: 'สาระสำคัญของการประเมิน',
    summaryItems: [
      'การวินิจฉัยอาศัยหลายปัจจัย ไม่ใช่การตรวจเพียงอย่างเดียว',
      'การตรวจเลือดค้นหาความไม่สมดุลของฮอร์โมนบางอย่างและตัดสาเหตุอื่นได้',
      'อัลตราซาวนด์ช่วยเสริมการประเมินตามสถานการณ์',
      'ผลตรวจควรได้รับการแปลผลโดยบุคลากรทางการแพทย์เสมอ',
    ],
    finalTipTitle: 'ประเด็นสำคัญ',
    finalTipText: 'การประเมิน PCOS ไม่ใช่การตรวจเดียวหรือคำตัดสินสุดท้าย ช่วยให้คุณเข้าใจการทำงานของฮอร์โมน ค้นหาสาเหตุอื่นที่เป็นไปได้ และสร้างการดูแลที่เหมาะกับสถานการณ์ของคุณ',
    disclaimerText: 'บทความนี้เพื่อให้ข้อมูลเท่านั้น และไม่ได้ทดแทนการปรึกษาแพทย์หรือการแปลผลการตรวจเฉพาะบุคคลของคุณ',
    shareMessage: 'การวินิจฉัย PCOS: การตรวจและการประเมิน — AWA',
  },
  vi: {
    badge: 'PCOS',
    title: 'Chẩn đoán PCOS:\nxét nghiệm và thăm khám',
    metaDuration: '7 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Trung cấp',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'PCOS được chẩn đoán như thế nào, có thể đề xuất những xét nghiệm nào và cách chuẩn bị bình tĩnh cho buổi hẹn của bạn.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Hiểu về quá trình thăm khám chẩn đoán',
      'Các bước chính của quá trình thăm khám',
      'Xét nghiệm máu nội tiết',
      'Siêu âm vùng chậu',
      'Điều chẩn đoán không cho bạn biết',
      'Chuẩn bị cho buổi hẹn của bạn',
      'Những điểm chính cần nhớ',
    ],
    section1Body1: 'Chẩn đoán hội chứng buồng trứng đa nang không dựa vào một xét nghiệm duy nhất. Nhân viên y tế tổng hợp nhiều thông tin: tiền sử chu kỳ của bạn, các triệu chứng nếu có, thăm khám lâm sàng, xét nghiệm và, tùy tình huống, siêu âm.',
    section1Body2: 'Mục tiêu vừa là tìm các đặc điểm phù hợp với PCOS, vừa là loại trừ các nguyên nhân khác có thể giải thích kỳ kinh không đều hoặc một số triệu chứng nội tiết.',
    tip1Title: 'Nên biết',
    tip1Text: 'Chẩn đoán luôn mang tính cá nhân hóa. Hai phụ nữ bị PCOS có thể có triệu chứng và kết quả xét nghiệm rất khác nhau.',
    section2Body: 'Quá trình thăm khám có thể gồm nhiều bước. Không nhất thiết tất cả đều được thực hiện giống nhau ở mọi người.',
    diagnosisSteps: [
      {title: 'Khai thác tiền sử', text: 'Chuyên gia thu thập tiền sử của bạn: chu kỳ, triệu chứng, bệnh sử và các phương pháp điều trị.'},
      {title: 'Thăm khám lâm sàng', text: 'Họ đặc biệt tìm các dấu hiệu của thừa androgen và đánh giá tình trạng chung của bạn.'},
      {title: 'Xét nghiệm máu', text: 'Có thể yêu cầu các xét nghiệm nội tiết và chuyển hóa để làm rõ tình hình.'},
      {title: 'Siêu âm', text: 'Nó có thể hoàn thiện quá trình thăm khám bằng cách quan sát hình dạng của buồng trứng.'},
    ],
    flowTitle: 'Quy trình trong nháy mắt',
    flowItems: [
      'Tiền sử và triệu chứng',
      'Thăm khám lâm sàng',
      'Xét nghiệm tùy theo tình huống',
      'Siêu âm nếu cần',
    ],
    section3Body1: 'Có thể đề xuất xét nghiệm máu để tìm dấu hiệu của thừa androgen, đánh giá một số hormone liên quan đến chức năng sinh sản và tìm các nguyên nhân khác có thể gây ra triệu chứng của bạn.',
    section3Body2: 'Các xét nghiệm được chọn phụ thuộc vào độ tuổi, triệu chứng, tiền sử bệnh của bạn và điều chuyên gia muốn kiểm tra.',
    bloodTests: [
      {title: 'Androgen', text: 'Testosterone và các hormone khác tùy tình huống.'},
      {title: 'Chức năng tuyến giáp', text: 'Đặc biệt giúp loại trừ một số nguyên nhân gây chu kỳ không đều.'},
      {title: 'Xét nghiệm chuyển hóa', text: 'Đường huyết, đôi khi cả mỡ máu tùy theo yếu tố nguy cơ.'},
    ],
    alertTitle: 'Quan trọng',
    alertText: 'Kết quả nội tiết cần được diễn giải cùng bối cảnh lâm sàng. Một giá trị đơn lẻ thường không đủ, tự nó, để kết luận chẩn đoán PCOS.',
    section4Body: 'Siêu âm có thể được dùng để quan sát hình dạng của buồng trứng và đặc biệt tìm số lượng nang nhỏ cao. Nó cũng cho phép chuyên gia tìm các yếu tố khác có thể giải thích một số triệu chứng.',
    tip2Title: 'Nên biết',
    tip2Text: 'Thấy nhiều nang trên siêu âm không tự động có nghĩa là bạn bị PCOS. Kết quả cần được diễn giải cùng phần còn lại của quá trình thăm khám.',
    section5Body: 'Nhận chẩn đoán PCOS không cho phép dự đoán chính xác mọi thứ sẽ tiến triển thế nào với bạn. Hội chứng này có thể biểu hiện rất khác nhau giữa từng người.',
    mythItems: [
      'PCOS không tự động có nghĩa là vô sinh.',
      'PCOS không nhất thiết có nghĩa là có nang.',
      'Chỉ riêng chẩn đoán không quyết định phương pháp điều trị.',
      'Siêu âm bình thường không nhất thiết loại trừ PCOS.',
    ],
    section6Body: 'Một vài thông tin được chuẩn bị trước có thể giúp chuyên gia hiểu tiền sử của bạn và chọn những xét nghiệm phù hợp nhất.',
    appointmentQuestions: [
      'Chu kỳ của bạn không đều được bao lâu rồi?',
      'Bạn có nhận thấy mụn, lông mọc bất thường hoặc rụng tóc không?',
      'Gia đình có tiền sử PCOS hoặc tiểu đường không?',
      'Bạn có muốn mang thai trong ngắn hạn hoặc trung hạn không?',
    ],
    preparationTitle: 'Một mẹo nhỏ trước buổi hẹn',
    preparationText: 'Nếu có thể, hãy ghi lại ngày của kỳ kinh gần nhất, độ dài gần đúng của các chu kỳ, các triệu chứng bạn nhận thấy và mọi phương pháp điều trị hay thực phẩm bổ sung bạn đang dùng.',
    summaryTitle: 'Điều thiết yếu của quá trình thăm khám',
    summaryItems: [
      'Chẩn đoán dựa trên nhiều yếu tố, không phải một xét nghiệm duy nhất.',
      'Xét nghiệm máu có thể tìm một số rối loạn nội tiết và loại trừ các nguyên nhân khác.',
      'Siêu âm có thể hoàn thiện quá trình thăm khám tùy theo tình huống.',
      'Kết quả luôn cần được nhân viên y tế diễn giải.',
    ],
    finalTipTitle: 'Những điểm chính cần nhớ',
    finalTipText: 'Thăm khám PCOS không phải là một xét nghiệm đơn lẻ hay một phán quyết cuối cùng. Nó giúp bạn hiểu hoạt động nội tiết của mình, tìm các nguyên nhân khác có thể có và xây dựng sự chăm sóc phù hợp với tình huống của bạn.',
    disclaimerText: 'Bài viết này chỉ để cung cấp thông tin và không thay thế buổi khám y tế hay việc diễn giải cá nhân hóa kết quả xét nghiệm của bạn.',
    shareMessage: 'Chẩn đoán PCOS: xét nghiệm và thăm khám — AWA',
  },
  uz: {
    badge: 'PCOS',
    title: 'PCOS tashxisi:\ntekshiruvlar va tahlillar',
    metaDuration: '7 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Oʻrta',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'PCOS qanday tashxislanadi, qanday tekshiruvlar taklif qilinishi mumkin va qabulga xotirjam qanday tayyorlanish kerak.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Tashxis jarayonini tushunish',
      'Tekshiruvning asosiy bosqichlari',
      'Gormonal qon tahlili',
      'Chanoq UZI',
      'Tashxis nimani aytmaydi',
      'Qabulga tayyorgarlik',
      'Asosiy xulosalar',
    ],
    section1Body1: 'Polikistik tuxumdon sindromi tashxisi yagona tekshiruvga asoslanmaydi. Sogʻliqni saqlash mutaxassisi bir nechta maʼlumotni birlashtiradi: sikl tarixingiz, har qanday alomatlar, klinik koʻrik, laboratoriya tahlillari va vaziyatga qarab UZI.',
    section1Body2: 'Maqsad ham PCOS ga mos belgilarni qidirish, ham notekis hayz yoki baʼzi gormonal alomatlarni tushuntirishi mumkin boʻlgan boshqa sabablarni istisno qilish.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Tashxis doim shaxsiy. PCOS li ikki ayolda alomatlar va tahlil natijalari juda farq qilishi mumkin.',
    section2Body: 'Tekshiruv bir necha bosqichdan iborat boʻlishi mumkin. Ular hamma uchun albatta bir xil tarzda oʻtkazilmaydi.',
    diagnosisSteps: [
      {title: 'Anamnez toʻplash', text: 'Mutaxassis tarixingizni toʻplaydi: sikllar, alomatlar, tibbiy tarix va davolanishlar.'},
      {title: 'Klinik koʻrik', text: 'U, xususan, ortiqcha androgenlar belgilarini qidiradi va umumiy holatingizni baholaydi.'},
      {title: 'Qon tahlillari', text: 'Vaziyatni aniqlashtirish uchun gormonal va metabolik tahlillar soʻralishi mumkin.'},
      {title: 'UZI', text: 'U tuxumdonlarning koʻrinishini kuzatish orqali tekshiruvni toʻldirishi mumkin.'},
    ],
    flowTitle: 'Jarayon bir qarashda',
    flowItems: [
      'Anamnez va alomatlar',
      'Klinik koʻrik',
      'Vaziyatga qarab tahlillar',
      'Kerak boʻlsa, UZI',
    ],
    section3Body1: 'Ortiqcha androgenlar belgilarini qidirish, reproduktiv funksiyada ishtirok etuvchi baʼzi gormonlarni baholash va alomatlaringizning boshqa mumkin boʻlgan sabablarini izlash uchun qon tahlili taklif qilinishi mumkin.',
    section3Body2: 'Tanlangan tahlillar yoshingizga, alomatlaringizga, tibbiy tarixingizga va mutaxassis nimani tekshirmoqchi ekaniga bogʻliq.',
    bloodTests: [
      {title: 'Androgenlar', text: 'Vaziyatga qarab testosteron va boshqa gormonlar.'},
      {title: 'Qalqonsimon bez funksiyasi', text: 'Xususan, notekis sikllarning baʼzi sabablarini istisno qilishga yordam beradi.'},
      {title: 'Metabolik tekshiruv', text: 'Qon shakari, xavf omillariga qarab baʼzan lipidlar paneli.'},
    ],
    alertTitle: 'Muhim',
    alertText: 'Gormonal natijalar klinik kontekst bilan birga talqin qilinishi kerak. Yakka qiymat odatda PCOS tashxisini xulosalash uchun yetarli emas.',
    section4Body: 'UZI tuxumdonlarning koʻrinishini kuzatish va, xususan, mayda follikullarning koʻp sonini qidirish uchun ishlatilishi mumkin. U shuningdek, mutaxassisga baʼzi alomatlarni tushuntirishi mumkin boʻlgan boshqa omillarni qidirish imkonini beradi.',
    tip2Title: 'Bilish foydali',
    tip2Text: 'UZI da koʻp follikullarni koʻrish sizda albatta PCOS borligini anglatmaydi. Natija tekshiruvning qolgan qismi bilan birga talqin qilinishi kerak.',
    section5Body: 'PCOS tashxisini olish sizda jarayon aynan qanday kechishini bashorat qilish imkonini bermaydi. Sindrom odamdan odamga juda turlicha namoyon boʻlishi mumkin.',
    mythItems: [
      'PCOS avtomatik ravishda bepushtlikni anglatmaydi.',
      'PCOS albatta kistalar borligini anglatmaydi.',
      'Faqat tashxisning oʻzi davolanishni belgilamaydi.',
      'Normal UZI PCOS ni albatta istisno qilmaydi.',
    ],
    section6Body: 'Oldindan tayyorlangan bir nechta maʼlumot mutaxassisga tarixingizni tushunishga va eng mos tahlillarni tanlashga yordam beradi.',
    appointmentQuestions: [
      'Sikllaringiz qancha vaqtdan beri notekis?',
      'Husnbuzar, odatdan tashqari tuk oʻsishi yoki sochning toʻkilishini sezdingizmi?',
      'Oilada PCOS yoki diabet tarixi bormi?',
      'Yaqin yoki oʻrta muddatda homilador boʻlishni xohlaysizmi?',
    ],
    preparationTitle: 'Qabuldan oldin kichik maslahat',
    preparationText: 'Iloji boʻlsa, oxirgi hayzingiz sanalarini, sikllaringizning taxminiy uzunligini, sezayotgan alomatlaringizni va qabul qilayotgan davolanish yoki qoʻshimchalarni yozib qoʻying.',
    summaryTitle: 'Tekshiruvning asosiy jihatlari',
    summaryItems: [
      'Tashxis yakka tekshiruvga emas, bir nechta omilga asoslanadi.',
      'Qon tahlili baʼzi gormonal muvozanat buzilishlarini qidirishi va boshqa sabablarni istisno qilishi mumkin.',
      'UZI vaziyatga qarab tekshiruvni toʻldirishi mumkin.',
      'Natijalarni doim sogʻliqni saqlash mutaxassisi talqin qilishi kerak.',
    ],
    finalTipTitle: 'Asosiy xulosalar',
    finalTipText: 'PCOS tekshiruvi yakka test yoki yakuniy hukm emas. U gormonal ishlashingizni tushunishga, boshqa mumkin boʻlgan sabablarni qidirishga va vaziyatingizga mos yordamni shakllantirishga yordam beradi.',
    disclaimerText: 'Bu maqola faqat maʼlumot uchun va tibbiy konsultatsiya yoki tahlil natijalaringizning shaxsiy talqinini almashtirmaydi.',
    shareMessage: 'PCOS tashxisi: tekshiruvlar va tahlillar — AWA',
  },
  az: {
    badge: 'PKOS',
    title: 'PKOS diaqnozu:\ntestlər və müayinə',
    metaDuration: '7 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Orta',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'PKOS-a necə diaqnoz qoyulur, hansı testlər təklif oluna bilər və qəbula sakit şəkildə necə hazırlaşmaq olar.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Diaqnostik müayinəni anlamaq',
      'Müayinənin əsas mərhələləri',
      'Hormonal qan testi',
      'Çanaq ultrasəsi',
      'Diaqnozun sizə demədikləri',
      'Qəbula hazırlıq',
      'Əsas nəticələr',
    ],
    section1Body1: 'Polikistik yumurtalıq sindromunun diaqnozu tək bir testə əsaslanmır. Tibb işçisi bir neçə məlumatı birləşdirir: dövr tarixçəniz, mümkün simptomlar, klinik müayinə, laboratoriya testləri və vəziyyətdən asılı olaraq ultrasəs.',
    section1Body2: 'Məqsəd həm PKOS-a uyğun xüsusiyyətləri axtarmaq, həm də qeyri-müntəzəm aybaşıları və ya bəzi hormonal simptomları izah edə biləcək digər səbəbləri istisna etməkdir.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Diaqnoz həmişə fərdiləşdirilmişdir. PKOS olan iki qadının simptomları və test nəticələri çox fərqli ola bilər.',
    section2Body: 'Müayinə bir neçə mərhələdən keçə bilər. Onların hamısı mütləq hamı üçün eyni şəkildə aparılmır.',
    diagnosisSteps: [
      {title: 'Anamnez toplamaq', text: 'Mütəxəssis tarixçənizi toplayır: dövrlər, simptomlar, tibbi keçmiş və müalicələr.'},
      {title: 'Klinik müayinə', text: 'O, xüsusilə androgen artıqlığının əlamətlərini axtarır və ümumi vəziyyətinizi qiymətləndirir.'},
      {title: 'Qan müayinəsi', text: 'Vəziyyəti aydınlaşdırmaq üçün hormonal və metabolik testlər istənilə bilər.'},
      {title: 'Ultrasəs', text: 'O, yumurtalıqların görünüşünü müşahidə etməklə müayinəni tamamlaya bilər.'},
    ],
    flowTitle: 'Prosesə bir baxışda',
    flowItems: [
      'Anamnez və simptomlar',
      'Klinik müayinə',
      'Vəziyyətə görə testlər',
      'Lazım gələrsə, ultrasəs',
    ],
    section3Body1: 'Androgen artıqlığının əlamətlərini axtarmaq, reproduktiv funksiyada iştirak edən bəzi hormonları qiymətləndirmək və simptomlarınızın digər mümkün səbəblərini araşdırmaq üçün qan testi təklif oluna bilər.',
    section3Body2: 'Seçilən testlər yaşınızdan, simptomlarınızdan, tibbi tarixçənizdən və mütəxəssisin nəyi yoxlamaq istədiyindən asılıdır.',
    bloodTests: [
      {title: 'Androgenlər', text: 'Testosteron və vəziyyətdən asılı olaraq digər hormonlar.'},
      {title: 'Qalxanabənzər vəzin funksiyası', text: 'Xüsusilə qeyri-müntəzəm dövrlərin bəzi səbəblərini istisna etməyə kömək edir.'},
      {title: 'Metabolik müayinə', text: 'Qanda qlükoza, risk amillərindən asılı olaraq bəzən lipid paneli.'},
    ],
    alertTitle: 'Vacibdir',
    alertText: 'Hormonal nəticələr klinik kontekstlə birlikdə şərh edilməlidir. Tək bir dəyər adətən PKOS diaqnozu qoymaq üçün özlüyündə kifayət deyil.',
    section4Body: 'Ultrasəs yumurtalıqların görünüşünü müşahidə etmək və xüsusilə kiçik follikulların çox olmasını axtarmaq üçün istifadə edilə bilər. O, həm də mütəxəssisə bəzi simptomları izah edə biləcək digər amilləri axtarmağa imkan verir.',
    tip2Title: 'Bilmək faydalıdır',
    tip2Text: 'Ultrasəsdə çoxlu follikulların görünməsi avtomatik olaraq PKOS-unuz olduğu demək deyil. Nəticə müayinənin qalan hissəsi ilə birlikdə şərh edilməlidir.',
    section5Body: 'PKOS diaqnozunu almaq sizin üçün işlərin dəqiq necə inkişaf edəcəyini proqnozlaşdırmağa imkan vermir. Sindrom bir şəxsdən digərinə çox fərqli təzahür edə bilər.',
    mythItems: [
      'PKOS avtomatik olaraq sonsuzluq demək deyil.',
      'PKOS mütləq kistaların olması demək deyil.',
      'Diaqnozun özü müalicəni müəyyən etmir.',
      'Normal ultrasəs mütləq PKOS-u istisna etmir.',
    ],
    section6Body: 'Əvvəlcədən hazırlanmış bir neçə məlumat mütəxəssisə tarixçənizi anlamağa və ən uyğun testləri seçməyə kömək edə bilər.',
    appointmentQuestions: [
      'Dövrləriniz nə vaxtdan qeyri-müntəzəmdir?',
      'Sızanaq, qeyri-adi tük artımı və ya saç tökülməsi görmüsünüzmü?',
      'Ailədə PKOS və ya diabet tarixçəsi varmı?',
      'Qısa və ya orta müddətdə hamilə qalmaq istəyirsinizmi?',
    ],
    preparationTitle: 'Qəbuldan əvvəl kiçik məsləhət',
    preparationText: 'Mümkünsə, sonuncu aybaşınızın tarixlərini, dövrlərinizin təxmini uzunluğunu, hiss etdiyiniz simptomları və qəbul etdiyiniz müalicələri və ya əlavələri qeyd edin.',
    summaryTitle: 'Müayinənin əsasları',
    summaryItems: [
      'Diaqnoz tək bir test deyil, bir neçə amilə əsaslanır.',
      'Qan testi bəzi hormonal disbalansları axtara və digər səbəbləri istisna edə bilər.',
      'Ultrasəs vəziyyətdən asılı olaraq müayinəni tamamlaya bilər.',
      'Nəticələr həmişə tibb işçisi tərəfindən şərh edilməlidir.',
    ],
    finalTipTitle: 'Əsas nəticələr',
    finalTipText: 'PKOS müayinəsi tək test və ya yekun hökm deyil. O, hormonal fəaliyyətinizi anlamağa, digər mümkün səbəbləri axtarmağa və vəziyyətinizə uyğun qayğı qurmağa kömək edir.',
    disclaimerText: 'Bu məqalə yalnız məlumat üçündür və tibbi konsultasiyanı və ya test nəticələrinizin fərdi şərhini əvəz etmir.',
    shareMessage: 'PKOS diaqnozu: testlər və müayinə — AWA',
  },
  ka: {
    badge: 'PCOS',
    title: 'PCOS-ის დიაგნოსტიკა:\nტესტები და გამოკვლევები',
    metaDuration: '7 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'საშუალო',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'როგორ სვამენ PCOS-ის დიაგნოზს, რა ტესტები შეიძლება შემოგთავაზონ და როგორ მოემზადოთ მშვიდად ვიზიტისთვის.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'დიაგნოსტიკური გამოკვლევის გაგება',
      'გამოკვლევის ძირითადი ეტაპები',
      'ჰორმონული სისხლის ანალიზი',
      'მენჯის ულტრაბგერა',
      'რას არ გვეუბნება დიაგნოზი',
      'ვიზიტისთვის მომზადება',
      'მთავარი დასკვნები',
    ],
    section1Body1: 'პოლიკისტოზური საკვერცხეების სინდრომის დიაგნოზი ერთ ტესტზე არ არის დაფუძნებული. ჯანდაცვის სპეციალისტი აერთიანებს რამდენიმე ინფორმაციას: თქვენი ციკლის ისტორიას, სიმპტომებს, კლინიკურ გასინჯვას, ლაბორატორიულ ანალიზებს და, სიტუაციის მიხედვით, ულტრაბგერას.',
    section1Body2: 'მიზანია როგორც PCOS-თან შესაბამისი ნიშნების ძიება, ისე სხვა მიზეზების გამორიცხვა, რომლებსაც შეუძლია არარეგულარული მენსტრუაციის ან გარკვეული ჰორმონული სიმპტომების ახსნა.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'დიაგნოზი ყოველთვის პერსონალიზებულია. PCOS-ის მქონე ორ ქალს შეიძლება ძალიან განსხვავებული სიმპტომები და ანალიზის შედეგები ჰქონდეს.',
    section2Body: 'გამოკვლევა შეიძლება რამდენიმე ეტაპს მოიცავდეს. ისინი აუცილებლად ყველასთვის ერთნაირად არ სრულდება.',
    diagnosisSteps: [
      {title: 'ანამნეზის შეგროვება', text: 'სპეციალისტი აგროვებს თქვენს ისტორიას: ციკლებს, სიმპტომებს, სამედიცინო წარსულს და მკურნალობას.'},
      {title: 'კლინიკური გასინჯვა', text: 'ის განსაკუთრებით ეძებს ანდროგენების სიჭარბის ნიშნებს და აფასებს თქვენს საერთო მდგომარეობას.'},
      {title: 'სისხლის გამოკვლევა', text: 'სიტუაციის დასაზუსტებლად შეიძლება მოთხოვნილ იქნეს ჰორმონული და მეტაბოლური ტესტები.'},
      {title: 'ულტრაბგერა', text: 'მას შეუძლია გამოკვლევის შევსება საკვერცხეების იერსახის დაკვირვებით.'},
    ],
    flowTitle: 'პროცესი ერთი შეხედვით',
    flowItems: [
      'ანამნეზი და სიმპტომები',
      'კლინიკური გასინჯვა',
      'ტესტები სიტუაციის მიხედვით',
      'ულტრაბგერა, საჭიროების შემთხვევაში',
    ],
    section3Body1: 'სისხლის ანალიზი შეიძლება შემოგთავაზონ ანდროგენების სიჭარბის ნიშნების საძებნად, რეპროდუქციულ ფუნქციაში ჩართული გარკვეული ჰორმონების შესაფასებლად და თქვენი სიმპტომების სხვა შესაძლო მიზეზების საძებნად.',
    section3Body2: 'არჩეული ტესტები დამოკიდებულია თქვენს ასაკზე, სიმპტომებზე, სამედიცინო ისტორიასა და იმაზე, რის შემოწმებასაც სპეციალისტი ცდილობს.',
    bloodTests: [
      {title: 'ანდროგენები', text: 'ტესტოსტერონი და სხვა ჰორმონები სიტუაციის მიხედვით.'},
      {title: 'ფარისებრი ჯირკვლის ფუნქცია', text: 'განსაკუთრებით გეხმარებათ არარეგულარული ციკლების გარკვეული მიზეზების გამორიცხვაში.'},
      {title: 'მეტაბოლური გამოკვლევა', text: 'სისხლში გლუკოზა, ზოგჯერ ლიპიდური პროფილი რისკ-ფაქტორების მიხედვით.'},
    ],
    alertTitle: 'მნიშვნელოვანია',
    alertText: 'ჰორმონული შედეგები კლინიკურ კონტექსტთან ერთად უნდა გაიგოთ. ერთი მაჩვენებელი, როგორც წესი, თავისთავად PCOS-ის დიაგნოზის დასკვნისთვის საკმარისი არ არის.',
    section4Body: 'ულტრაბგერა შეიძლება გამოიყენოთ საკვერცხეების იერსახის დასაკვირვებლად და განსაკუთრებით პატარა ფოლიკულების დიდი რაოდენობის საძებნად. ის ასევე სპეციალისტს საშუალებას აძლევს მოძებნოს სხვა ფაქტორები, რომლებსაც გარკვეული სიმპტომების ახსნა შეუძლია.',
    tip2Title: 'კარგია ვიცოდეთ',
    tip2Text: 'ულტრაბგერაზე ბევრი ფოლიკულის დანახვა ავტომატურად არ ნიშნავს, რომ PCOS გაქვთ. შედეგი გამოკვლევის დანარჩენ ნაწილთან ერთად უნდა გაიგოთ.',
    section5Body: 'PCOS-ის დიაგნოზის მიღება არ იძლევა საშუალებას ზუსტად განჭვრიტოთ, როგორ განვითარდება მოვლენები თქვენთვის. სინდრომი ადამიანიდან ადამიანამდე ძალიან განსხვავებულად შეიძლება გამოვლინდეს.',
    mythItems: [
      'PCOS ავტომატურად უშვილობას არ ნიშნავს.',
      'PCOS აუცილებლად ცისტების ქონას არ ნიშნავს.',
      'მარტო დიაგნოზი მკურნალობას არ განსაზღვრავს.',
      'ნორმალური ულტრაბგერა აუცილებლად PCOS-ს არ გამორიცხავს.',
    ],
    section6Body: 'წინასწარ მომზადებულ რამდენიმე ინფორმაციას შეუძლია სპეციალისტს დაეხმაროს გაიგოს თქვენი ისტორია და ყველაზე შესაბამისი ტესტები აირჩიოს.',
    appointmentQuestions: [
      'რამდენი ხანია თქვენი ციკლები არარეგულარულია?',
      'შეგიმჩნევიათ აკნე, თმის უჩვეულო ზრდა ან თმის ცვენა?',
      'არის PCOS-ის ან დიაბეტის ოჯახური ისტორია?',
      'გსურთ ორსულობა მოკლე ან საშუალო ვადაში?',
    ],
    preparationTitle: 'პატარა რჩევა ვიზიტამდე',
    preparationText: 'თუ შესაძლებელია, აღნიშნეთ ბოლო მენსტრუაციის თარიღები, თქვენი ციკლების მიახლოებითი ხანგრძლივობა, სიმპტომები, რომლებსაც ამჩნევთ და მკურნალობა ან დანამატები, რომლებსაც იღებთ.',
    summaryTitle: 'გამოკვლევის არსებითი საკითხები',
    summaryItems: [
      'დიაგნოზი რამდენიმე ფაქტორზეა დაფუძნებული და არა ერთ ტესტზე.',
      'სისხლის ანალიზს შეუძლია გარკვეული ჰორმონული დისბალანსის და სხვა მიზეზების გამორიცხვის ძიება.',
      'ულტრაბგერას, სიტუაციის მიხედვით, გამოკვლევის შევსება შეუძლია.',
      'შედეგები ყოველთვის ჯანდაცვის სპეციალისტმა უნდა განმარტოს.',
    ],
    finalTipTitle: 'მთავარი დასკვნები',
    finalTipText: 'PCOS-ის გამოკვლევა არ არის ერთი ტესტი ან საბოლოო განაჩენი. ის გეხმარებათ გაიგოთ თქვენი ჰორმონული ფუნქციონირება, მოიძიოთ სხვა შესაძლო მიზეზები და შექმნათ თქვენს სიტუაციაზე მორგებული მკურნალობა.',
    disclaimerText: 'ეს სტატია მხოლოდ საინფორმაციოა და სამედიცინო კონსულტაციას ან თქვენი ანალიზის შედეგების პერსონალიზებულ განმარტებას არ ანაცვლებს.',
    shareMessage: 'PCOS-ის დიაგნოსტიკა: ტესტები და გამოკვლევები — AWA',
  },
  hy: {
    badge: 'PCOS',
    title: 'PCOS-ի ախտորոշում.\nհետազոտություններ և քննություն',
    metaDuration: '7 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Միջին',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ինչպես է ախտորոշվում PCOS-ը, ինչ հետազոտություններ կարող են առաջարկվել և ինչպես հանգիստ նախապատրաստվել ձեր այցին:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Հասկանալ ախտորոշիչ քննությունը',
      'Քննության հիմնական քայլերը',
      'Հորմոնալ արյան անալիզ',
      'Կոնքի ուլտրաձայնային հետազոտություն',
      'Ինչ չի ասում ախտորոշումը',
      'Նախապատրաստվել ձեր այցին',
      'Հիմնական եզրակացություններ',
    ],
    section1Body1: 'Պոլիցիստոզ ձվարանների համախտանիշի ախտորոշումը չի հիմնվում մեկ հետազոտության վրա: Առողջապահության մասնագետը համադրում է մի քանի տեղեկություն՝ ձեր ցիկլի պատմությունը, ախտանիշները, կլինիկական զննումը, լաբորատոր հետազոտությունները և, կախված իրավիճակից, ուլտրաձայնային հետազոտությունը:',
    section1Body2: 'Նպատակը և՛ PCOS-ին համահունչ առանձնահատկությունները փնտրելն է, և՛ բացառել այլ պատճառներ, որոնք կարող են բացատրել անկանոն դաշտանները կամ որոշ հորմոնալ ախտանիշներ:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Ախտորոշումը միշտ անհատականացված է: PCOS ունեցող երկու կին կարող են ունենալ շատ տարբեր ախտանիշներ և հետազոտությունների արդյունքներ:',
    section2Body: 'Քննությունը կարող է հետևել մի քանի քայլերի: Դրանք պարտադիր չէ բոլորի համար նույն կերպ իրականացվեն:',
    diagnosisSteps: [
      {title: 'Անամնեզի հավաքում', text: 'Մասնագետը հավաքում է ձեր պատմությունը՝ ցիկլեր, ախտանիշներ, բժշկական անցյալ և բուժումներ:'},
      {title: 'Կլինիկական զննում', text: 'Նա մասնավորապես փնտրում է անդրոգենների ավելցուկի նշաններ և գնահատում է ձեր ընդհանուր վիճակը:'},
      {title: 'Արյան հետազոտություն', text: 'Իրավիճակը պարզաբանելու համար կարող են պահանջվել հորմոնալ և նյութափոխանակային անալիզներ:'},
      {title: 'Ուլտրաձայնային հետազոտություն', text: 'Այն կարող է լրացնել քննությունը՝ դիտարկելով ձվարանների տեսքը:'},
    ],
    flowTitle: 'Գործընթացը՝ մի հայացքով',
    flowItems: [
      'Անամնեզ և ախտանիշներ',
      'Կլինիկական զննում',
      'Հետազոտություններ՝ ըստ իրավիճակի',
      'Ուլտրաձայնային հետազոտություն, եթե անհրաժեշտ է',
    ],
    section3Body1: 'Արյան անալիզ կարող է առաջարկվել՝ անդրոգենների ավելցուկի նշանները փնտրելու, վերարտադրողական գործառույթում ներգրավված որոշ հորմոններ գնահատելու և ձեր ախտանիշների այլ հնարավոր պատճառներ փնտրելու համար:',
    section3Body2: 'Ընտրված հետազոտությունները կախված են ձեր տարիքից, ախտանիշներից, բժշկական պատմությունից և նրանից, թե ինչ է ուզում ստուգել մասնագետը:',
    bloodTests: [
      {title: 'Անդրոգեններ', text: 'Տեստոստերոն և այլ հորմոններ՝ կախված իրավիճակից:'},
      {title: 'Վահանաձև գեղձի գործառույթ', text: 'Օգնում է մասնավորապես բացառել անկանոն ցիկլերի որոշ պատճառներ:'},
      {title: 'Նյութափոխանակային քննություն', text: 'Արյան գլյուկոզ, երբեմն՝ լիպիդային պրոֆիլ՝ կախված վտանգի գործոններից:'},
    ],
    alertTitle: 'Կարևոր է',
    alertText: 'Հորմոնալ արդյունքները պետք է մեկնաբանվեն կլինիկական համատեքստի հետ միասին: Մեկ արժեքը սովորաբար բավարար չէ, ինքնին, PCOS-ի ախտորոշման եզրակացության համար:',
    section4Body: 'Ուլտրաձայնային հետազոտությունը կարող է օգտագործվել ձվարանների տեսքը դիտարկելու և մասնավորապես փոքր ֆոլիկուլների մեծ թիվ փնտրելու համար: Այն նաև թույլ է տալիս մասնագետին փնտրել այլ գործոններ, որոնք կարող են բացատրել որոշ ախտանիշներ:',
    tip2Title: 'Լավ է իմանալ',
    tip2Text: 'Ուլտրաձայնային հետազոտության ժամանակ շատ ֆոլիկուլներ տեսնելը ինքնաբերաբար չի նշանակում, որ ունեք PCOS: Արդյունքը պետք է մեկնաբանվի քննության մնացած մասի հետ միասին:',
    section5Body: 'PCOS-ի ախտորոշում ստանալը հնարավորություն չի տալիս ճշգրիտ կանխատեսել, թե ինչպես կզարգանան իրերը ձեզ համար: Համախտանիշը կարող է խիստ տարբեր կերպ դրսևորվել մարդուց մարդ:',
    mythItems: [
      'PCOS-ը ինքնաբերաբար չի նշանակում անպտղություն:',
      'PCOS-ը պարտադիր չի նշանակում կիստաներ ունենալ:',
      'Ախտորոշումը միայնակ չի որոշում բուժումը:',
      'Նորմալ ուլտրաձայնային հետազոտությունը պարտադիր չէ բացառի PCOS-ը:',
    ],
    section6Body: 'Նախապես պատրաստված մի քանի տեղեկություն կարող է օգնել մասնագետին հասկանալ ձեր պատմությունը և ընտրել առավել տեղին հետազոտությունները:',
    appointmentQuestions: [
      'Որքա՞ն ժամանակ է, ինչ ձեր ցիկլերը անկանոն են:',
      'Նկատե՞լ եք ակնե, մազերի անսովոր աճ կամ մազաթափություն:',
      'Կա՞ PCOS-ի կամ շաքարախտի ընտանեկան պատմություն:',
      'Ցանկանո՞ւմ եք կարճաժամկետ կամ միջնաժամկետ հղիանալ:',
    ],
    preparationTitle: 'Փոքր խորհուրդ՝ այցից առաջ',
    preparationText: 'Հնարավորության դեպքում գրանցեք ձեր վերջին դաշտանի ամսաթվերը, ձեր ցիկլերի մոտավոր տևողությունը, ախտանիշները, որոնք նկատում եք, և բուժումները կամ հավելումները, որոնք ընդունում եք:',
    summaryTitle: 'Քննության էականը',
    summaryItems: [
      'Ախտորոշումը հիմնվում է մի քանի գործոնների վրա, ոչ թե մեկ հետազոտության:',
      'Արյան անալիզը կարող է փնտրել որոշ հորմոնալ անհավասարակշռություններ և բացառել այլ պատճառներ:',
      'Ուլտրաձայնային հետազոտությունը կարող է լրացնել քննությունը՝ կախված իրավիճակից:',
      'Արդյունքները միշտ պետք է մեկնաբանվեն առողջապահության մասնագետի կողմից:',
    ],
    finalTipTitle: 'Հիմնական եզրակացություններ',
    finalTipText: 'PCOS-ի քննությունը մեկ հետազոտություն կամ վերջնական վճիռ չէ: Այն օգնում է հասկանալ ձեր հորմոնալ աշխատանքը, փնտրել այլ հնարավոր պատճառներ և կառուցել ձեր իրավիճակին համապատասխան խնամք:',
    disclaimerText: 'Այս հոդվածը միայն տեղեկատվական է և չի փոխարինում բժշկական խորհրդատվությանը կամ ձեր հետազոտությունների արդյունքների անհատականացված մեկնաբանությանը:',
    shareMessage: 'PCOS-ի ախտորոշում. հետազոտություններ և քննություն — AWA',
  },
  tg: {
    badge: 'PCOS',
    title: 'Ташхиси PCOS:\nсанҷишҳо ва муоина',
    metaDuration: '7 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Миёна',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'PCOS чӣ тавр ташхис карда мешавад, кадом санҷишҳо метавонанд пешниҳод шаванд ва чӣ тавр оромона ба қабули худ омода шудан мумкин аст.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Фаҳмидани муоинаи ташхисӣ',
      'Қадамҳои асосии муоина',
      'Санҷиши гормонии хун',
      'Ултрасадои коса',
      'Он чи ташхис ба шумо намегӯяд',
      'Омодагӣ ба қабули худ',
      'Хулосаҳои асосӣ',
    ],
    section1Body1: 'Ташхиси синдроми тухмдонҳои поликистозӣ ба як санҷиш такя намекунад. Мутахассиси соҳаи тиб якчанд маълумотро ҷамъ мекунад: таърихи давраи шумо, нишонаҳои эҳтимолӣ, муоинаи клиникӣ, санҷишҳои озмоишгоҳӣ ва, вобаста ба вазъият, ултрасадо.',
    section1Body2: 'Мақсад ҳам ҷустуҷӯи нишонаҳои мувофиқ ба PCOS ва ҳам истисно кардани сабабҳои дигар аст, ки метавонанд ҳайзи номунтазам ё баъзе нишонаҳои гормониро шарҳ диҳанд.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Ташхис ҳамеша шахсӣ аст. Ду зани дорои PCOS метавонанд нишонаҳо ва натиҷаҳои санҷиши хеле гуногун дошта бошанд.',
    section2Body: 'Муоина метавонад якчанд қадамро дар бар гирад. Онҳо ҳатман барои ҳама ба як тарз анҷом дода намешаванд.',
    diagnosisSteps: [
      {title: 'Ҷамъоварии таърих', text: 'Мутахассис таърихи шуморо ҷамъ мекунад: давраҳо, нишонаҳо, таърихи тиббӣ ва табобатҳо.'},
      {title: 'Муоинаи клиникӣ', text: 'Ӯ махсусан нишонаҳои зиёдии андрогенҳоро меҷӯяд ва ҳолати умумии шуморо арзёбӣ мекунад.'},
      {title: 'Санҷишҳои хун', text: 'Санҷишҳои гормонӣ ва мубодилавӣ метавонанд барои равшан кардани вазъият дархост шаванд.'},
      {title: 'Ултрасадо', text: 'Он метавонад муоинаро бо мушоҳидаи намуди тухмдонҳо пурра кунад.'},
    ],
    flowTitle: 'Раванд дар як нигоҳ',
    flowItems: [
      'Таърих ва нишонаҳо',
      'Муоинаи клиникӣ',
      'Санҷишҳо вобаста ба вазъият',
      'Ултрасадо, агар лозим бошад',
    ],
    section3Body1: 'Санҷиши хун метавонад пешниҳод шавад, то нишонаҳои зиёдии андрогенҳоро ҷустуҷӯ кунад, баъзе гормонҳои дар функсияи таносулӣ иштироккунандаро арзёбӣ намояд ва сабабҳои имконпазири дигари нишонаҳои шуморо ҷӯяд.',
    section3Body2: 'Санҷишҳои интихобшуда ба синну сол, нишонаҳо, таърихи тиббӣ ва он чи мутахассис мехоҳад санҷад, вобаста аст.',
    bloodTests: [
      {title: 'Андрогенҳо', text: 'Тестостерон ва гормонҳои дигар вобаста ба вазъият.'},
      {title: 'Фаъолияти ғадуди сипаршакл', text: 'Махсусан ба истисно кардани баъзе сабабҳои давраҳои номунтазам кумак мекунад.'},
      {title: 'Санҷиши мубодилавӣ', text: 'Қанди хун, баъзан липидограмма вобаста ба омилҳои хатар.'},
    ],
    alertTitle: 'Муҳим',
    alertText: 'Натиҷаҳои гормониро бояд дар заминаи клиникӣ тафсир кард. Як арзиш одатан худ ба худ барои хулосаи ташхиси PCOS кифоя нест.',
    section4Body: 'Ултрасадо метавонад барои мушоҳидаи намуди тухмдонҳо ва, хусусан, ҷустуҷӯи шумораи зиёди фолликулҳои хурд истифода шавад. Он инчунин ба мутахассис имкон медиҳад омилҳои дигарро, ки метавонанд баъзе нишонаҳоро шарҳ диҳанд, ҷустуҷӯ кунад.',
    tip2Title: 'Донистан хуб аст',
    tip2Text: 'Дидани фолликулҳои зиёд дар ултрасадо худкор маънои доштани PCOS-ро надорад. Натиҷаро бояд дар баробари қисми боқимондаи муоина тафсир кард.',
    section5Body: 'Гирифтани ташхиси PCOS имкон намедиҳад дақиқ пешгӯӣ кунед, ки барои шумо чӣ тавр пеш меравад. Синдром метавонад аз шахс ба шахс хеле гуногун зоҳир шавад.',
    mythItems: [
      'PCOS худкор маънои безурётиро надорад.',
      'PCOS ҳатман маънои доштани кистаҳоро надорад.',
      'Танҳо ташхис табобатро муайян намекунад.',
      'Ултрасадои муқаррарӣ ҳатман PCOS-ро истисно намекунад.',
    ],
    section6Body: 'Чанд маълумоти аз пеш омодашуда метавонад ба мутахассис кумак кунад таърихи шуморо бифаҳмад ва мувофиқтарин санҷишҳоро интихоб кунад.',
    appointmentQuestions: [
      'Давраҳои шумо аз кай номунтазаманд?',
      'Оё доначаҳои рӯй, рӯйиши ғайриоддии мӯй ё рехтани мӯйро мушоҳида кардаед?',
      'Оё дар оила таърихи PCOS ё диабет вуҷуд дорад?',
      'Оё мехоҳед дар кӯтоҳмуддат ё миёнамуддат ҳомиладор шавед?',
    ],
    preparationTitle: 'Маслиҳати хурд пеш аз қабул',
    preparationText: 'Агар имкон бошад, санаҳои ҳайзи охирин, дарозии тақрибии давраҳо, нишонаҳое, ки мушоҳида мекунед, ва ҳар табобат ё иловаҳои хӯрокиро, ки қабул мекунед, қайд кунед.',
    summaryTitle: 'Муҳимтарин чизҳои муоина',
    summaryItems: [
      'Ташхис ба якчанд омил такя мекунад, на ба як санҷиш.',
      'Санҷиши хун метавонад баъзе номутавозунҳои гормониро ҷустуҷӯ кунад ва сабабҳои дигарро истисно намояд.',
      'Ултрасадо метавонад муоинаро вобаста ба вазъият пурра кунад.',
      'Натиҷаҳоро ҳамеша бояд мутахассиси соҳаи тиб тафсир кунад.',
    ],
    finalTipTitle: 'Хулосаҳои асосӣ',
    finalTipText: 'Муоинаи PCOS як санҷиш ё ҳукми ниҳоӣ нест. Он ба шумо кумак мекунад фаъолияти гормонии худро фаҳмед, сабабҳои имконпазири дигарро ҷӯед ва нигоҳубини мувофиқ ба вазъияти худро созед.',
    disclaimerText: 'Ин мақола танҳо барои иттилоъ аст ва машварати тиббӣ ё тафсири шахсии натиҷаҳои санҷишҳоро иваз намекунад.',
    shareMessage: 'Ташхиси PCOS: санҷишҳо ва муоина — AWA',
  },
  ky: {
    badge: 'PCOS',
    title: 'PCOS диагностикасы:\nанализдер жана текшерүү',
    metaDuration: '7 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Орто',
    metaValidated: 'Текшерилген мазмун',
    intro: 'PCOS кантип диагностикаланат, кандай анализдер сунушталышы мүмкүн жана кабыл алууга кантип тынч даярдануу керек.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Диагностикалык текшерүүнү түшүнүү',
      'Текшерүүнүн негизги этаптары',
      'Гормондук кан анализи',
      'Жамбаш УЗИси',
      'Диагноз эмнени айтпайт',
      'Кабыл алууга даярдануу',
      'Негизги жыйынтыктар',
    ],
    section1Body1: 'Поликистоздук жумурткалык синдромунун диагнозу бир гана анализге таянбайт. Ден соолук сактоо адиси бир нече маалыматты бириктирет: цикл тарыхыңыз, белгилер, клиникалык текшерүү, лабораториялык анализдер жана абалга жараша УЗИ.',
    section1Body2: 'Максат — PCOSко шайкеш келген белгилерди издөө жана туура эмес етек киримди же айрым гормондук белгилерди түшүндүрө турган башка себептерди жокко чыгаруу.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Диагноз ар дайым жекелештирилген. PCOS бар эки аялдын белгилери жана анализ жыйынтыктары абдан ар башка болушу мүмкүн.',
    section2Body: 'Текшерүү бир нече этаптан турушу мүмкүн. Алар баарында бирдей аткарылышы сөзсүз эмес.',
    diagnosisSteps: [
      {title: 'Тарых чогултуу', text: 'Адис тарыхыңызды чогултат: циклдер, белгилер, медициналык өткөн жана дарылоолор.'},
      {title: 'Клиникалык текшерүү', text: 'Ал атап айтканда ашыкча андрогендердин белгилерин издейт жана жалпы абалыңызды баалайт.'},
      {title: 'Кан анализдери', text: 'Абалды тактоо үчүн гормондук жана метаболизм анализдери суралышы мүмкүн.'},
      {title: 'УЗИ', text: 'Ал жумурткалыктардын көрүнүшүн байкоо менен текшерүүнү толуктай алат.'},
    ],
    flowTitle: 'Процесс бир көз ирмемде',
    flowItems: [
      'Тарых жана белгилер',
      'Клиникалык текшерүү',
      'Абалга жараша анализдер',
      'Керек болсо УЗИ',
    ],
    section3Body1: 'Кан анализи ашыкча андрогендердин белгилерин издөө, көбөйүү функциясына катышкан айрым гормондорду баалоо жана белгилериңиздин башка мүмкүн болгон себептерин издөө үчүн сунушталышы мүмкүн.',
    section3Body2: 'Тандалган анализдер жашыңызга, белгилериңизге, медициналык тарыхыңызга жана адис эмнени текшергиси келгенине көз каранды.',
    bloodTests: [
      {title: 'Андрогендер', text: 'Абалга жараша тестостерон жана башка гормондор.'},
      {title: 'Калкан сымал без функциясы', text: 'Туура эмес циклдердин айрым себептерин жокко чыгарууга жардам берет.'},
      {title: 'Метаболизм анализи', text: 'Кандагы кант, кээде коркунуч факторлоруна жараша липид панели.'},
    ],
    alertTitle: 'Маанилүү',
    alertText: 'Гормондук жыйынтыктарды клиникалык контекст менен бирге чечмелөө керек. Бир маани, адатта, өзү PCOS диагнозун жыйынтыктоого жетишсиз.',
    section4Body: 'УЗИ жумурткалыктардын көрүнүшүн байкоо жана атап айтканда кичинекей фолликулдардын көп санын издөө үчүн колдонулушу мүмкүн. Ал ошондой эле адиске айрым белгилерди түшүндүрө турган башка факторлорду издөөгө мүмкүндүк берет.',
    tip2Title: 'Билүү пайдалуу',
    tip2Text: 'УЗИде көп фолликулдарды көрүү автоматтык түрдө PCOS бар дегенди билдирбейт. Жыйынтыкты текшерүүнүн калган бөлүгү менен бирге чечмелөө керек.',
    section5Body: 'PCOS диагнозун алуу сиз үчүн иштердин кантип өнүгөрүн так алдын ала айтууга мүмкүндүк бербейт. Синдром адамдан адамга абдан ар башка көрүнүшү мүмкүн.',
    mythItems: [
      'PCOS автоматтык түрдө тукумсуздукту билдирбейт.',
      'PCOS сөзсүз киста болушун билдирбейт.',
      'Диагноздун өзү дарылоону аныктабайт.',
      'Нормалдуу УЗИ PCOSту сөзсүз жокко чыгарбайт.',
    ],
    section6Body: 'Алдын ала даярдалган бир нече маалымат адиске тарыхыңызды түшүнүүгө жана эң тиешелүү анализдерди тандоого жардам бере алат.',
    appointmentQuestions: [
      'Циклдериңиз канча убакыттан бери туура эмес?',
      'Безеткилерди, адаттан тыш түк өсүүнү же чачтын түшүшүн байкадыңызбы?',
      'Үй-бүлөдө PCOS же диабеттин тарыхы барбы?',
      'Кыска же орто мөөнөттө боюна бүткүңүз келеби?',
    ],
    preparationTitle: 'Кабыл алуудан мурунку кичинекей кеңеш',
    preparationText: 'Мүмкүн болсо, акыркы етек киримиңиздин күндөрүн, циклдериңиздин болжолдуу узактыгын, байкап жаткан белгилериңизди жана кабыл алып жаткан дарылоолоруңузду же кошумчаларыңызды жазып коюңуз.',
    summaryTitle: 'Текшерүүнүн негизги учурлары',
    summaryItems: [
      'Диагноз бир анализге эмес, бир нече факторго таянат.',
      'Кан анализи айрым гормондук тең салмактуулуктун бузулуусун издеп, башка себептерди жокко чыгара алат.',
      'УЗИ абалга жараша текшерүүнү толуктай алат.',
      'Жыйынтыктарды ар дайым ден соолук сактоо адиси чечмелеши керек.',
    ],
    finalTipTitle: 'Негизги жыйынтыктар',
    finalTipText: 'PCOS текшерүүсү бир анализ же акыркы өкүм эмес. Ал гормондук иштешиңизди түшүнүүгө, башка мүмкүн болгон себептерди издөөгө жана абалыңызга ылайыктуу кам көрүүнү түзүүгө жардам берет.',
    disclaimerText: 'Бул макала маалымат үчүн гана жазылган жана медициналык консультацияны же анализ жыйынтыктарыңызды жекелештирилген чечмелөөнү алмаштырбайт.',
    shareMessage: 'PCOS диагностикасы: анализдер жана текшерүү — AWA',
  },
  tk: {
    badge: 'PCOS',
    title: 'PCOS diagnozy:\nsynaglar we barlag',
    metaDuration: '7 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Orta',
    metaValidated: 'Barlanan mazmun',
    intro: 'PCOS nähili diagnostirlenýär, haýsy synaglar teklip edilip bilner we kabul edişe asudalyk bilen nähili taýýarlanmaly.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Diagnostika barlagyny düşünmek',
      'Barlagyň esasy ädimleri',
      'Gormonal gan synagy',
      'Çanak UZI-si',
      'Diagnozyň size aýtmaýan zatlary',
      'Kabul edişe taýýarlanmak',
      'Esasy netijeler',
    ],
    section1Body1: 'Polikistoz ýumurtgalyk sindromynyň diagnozy ýeke synaga esaslanmaýar. Saglyk hünärmeni birnäçe maglumaty jemleýär: sikl taryhyňyzy, alamatlary, klinik barlagy, laboratoriýa synaglaryny we ýagdaýa görä UZI-ni.',
    section1Body2: 'Maksat hem PCOS-a gabat gelýän aýratynlyklary gözlemek, hem düzgünsiz aýbaşyny ýa-da käbir gormonal alamatlary düşündirip biljek beýleki sebäpleri aýyrmak.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Diagnoz hemişe şahsylaşdyrylan. PCOS-ly iki aýalyň alamatlary we synag netijeleri gaty dürli bolup biler.',
    section2Body: 'Barlag birnäçe ädimden geçip biler. Olar hemmeler üçin hökman bir görnüşde ýerine ýetirilmeýär.',
    diagnosisSteps: [
      {title: 'Taryh ýygnamak', text: 'Hünärmen taryhyňyzy ýygnaýar: sikller, alamatlar, lukmançylyk geçmişi we bejergiler.'},
      {title: 'Klinik barlag', text: 'Ol aýratyn-da artykmaç androgen alamatlaryny gözleýär we umumy ýagdaýyňyzy bahalaýar.'},
      {title: 'Gan barlagy', text: 'Ýagdaýy aýdyňlaşdyrmak üçin gormonal we metabolik synaglar talap edilip bilner.'},
      {title: 'UZI', text: 'Ol ýumurtgalyklaryň görnüşini synlamak arkaly barlagy doldurup biler.'},
    ],
    flowTitle: 'Prosese bir seretmek',
    flowItems: [
      'Taryh we alamatlar',
      'Klinik barlag',
      'Ýagdaýa görä synaglar',
      'Zerur bolsa UZI',
    ],
    section3Body1: 'Artykmaç androgen alamatlaryny gözlemek, köpelmek işine gatnaşýan käbir gormonlary bahalamak we alamatlaryňyzyň beýleki mümkin sebäplerini gözlemek üçin gan synagy teklip edilip bilner.',
    section3Body2: 'Saýlanan synaglar ýaşyňyza, alamatlaryňyza, lukmançylyk taryhyňyza we hünärmeniň barlamak isleýän zadyna bagly.',
    bloodTests: [
      {title: 'Androgenler', text: 'Ýagdaýa görä testosteron we beýleki gormonlar.'},
      {title: 'Galkan şekilli mäziň işi', text: 'Düzgünsiz sikliň käbir sebäplerini aýyrmaga kömek edýär.'},
      {title: 'Metabolik barlag', text: 'Gandaky şeker, howp faktorlaryna görä käwagt lipid paneli.'},
    ],
    alertTitle: 'Möhüm',
    alertText: 'Gormonal netijeler klinik kontekst bilen bilelikde düşündirilmeli. Ýeke baha adatça özbaşyna PCOS diagnozyny netijelendirmek üçin ýeterlik däl.',
    section4Body: 'UZI ýumurtgalyklaryň görnüşini synlamak we aýratyn-da kiçi follikullaryň köp sanyny gözlemek üçin ulanylyp bilner. Ol şeýle hem hünärmene käbir alamatlary düşündirip biljek beýleki faktorlary gözlemäge mümkinçilik berýär.',
    tip2Title: 'Bilmek peýdaly',
    tip2Text: 'UZI-de köp follikullaryň görülmegi awtomatiki PCOS-yň barlygyny aňlatmaýar. Netije barlagyň galan bölegi bilen bilelikde düşündirilmeli.',
    section5Body: 'PCOS diagnozyny almak işleriň sizde nähili ösjekdigini takyk çaklamaga mümkinçilik bermeýär. Sindrom adamdan adama gaty dürli ýüze çykyp biler.',
    mythItems: [
      'PCOS awtomatiki önelgesizligi aňlatmaýar.',
      'PCOS hökman kistalaryň bolmagyny aňlatmaýar.',
      'Ýeke diagnoz bejergini kesgitlemeýär.',
      'Adaty UZI PCOS-yny hökman aýyrmaýar.',
    ],
    section6Body: 'Öňünden taýýarlanan birnäçe maglumat hünärmene taryhyňyzy düşünmäge we iň degişli synaglary saýlamaga kömek edip biler.',
    appointmentQuestions: [
      'Siklleriňiz näçe wagt bäri düzgünsiz?',
      'Akne, adaty däl tüý ösüşi ýa-da saç dökülmesini gördüňizmi?',
      'Maşgalada PCOS ýa-da diabet taryhy barmy?',
      'Gysga ýa-da orta möhletde göwreli bolmak isleýärsiňizmi?',
    ],
    preparationTitle: 'Kabul edişden öň kiçijik maslahat',
    preparationText: 'Mümkin bolsa, soňky aýbaşyňyzyň seneleri, siklleriňiziň takmynan uzynlygyny, görýän alamatlaryňyzy we kabul edýän bejergilerigizi ýa-da goşundylarygyzy belläň.',
    summaryTitle: 'Barlagyň esasy zatlary',
    summaryItems: [
      'Diagnoz ýeke synaga däl, birnäçe faktora esaslanýar.',
      'Gan synagy käbir gormonal deňagramsyzlyklary gözläp we beýleki sebäpleri aýryp biler.',
      'UZI ýagdaýa görä barlagy doldurup biler.',
      'Netijeler hemişe saglyk hünärmeni tarapyndan düşündirilmeli.',
    ],
    finalTipTitle: 'Esasy netijeler',
    finalTipText: 'PCOS barlagy ýeke synag ýa-da soňky höküm däl. Ol gormonal işleýşiňizi düşünmäge, beýleki mümkin sebäpleri gözlemäge we ýagdaýyňyza laýyk ideg gurmaga kömek edýär.',
    disclaimerText: 'Bu makala diňe maglumat üçin we lukmançylyk maslahatlaşmagyny ýa-da synag netijeleriňiziň şahsylaşdyrylan düşündirilişini çalyşmaýar.',
    shareMessage: 'PCOS diagnozy: synaglar we barlag — AWA',
  },
} as const);

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
