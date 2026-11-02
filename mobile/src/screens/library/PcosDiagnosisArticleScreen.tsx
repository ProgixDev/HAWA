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
  'zh-Hant': {
      badge: '多囊性卵巢症候群（PCOS）',
      title: 'PCOS 診斷：\n檢查與評估',
      metaDuration: '閱讀約 7 分鐘',
      metaType: '指南',
      metaLevel: '進階',
      metaValidated: '已審閱內容',
      intro: 'PCOS 是如何診斷的，可能會做哪些檢查，以及如何從容地為就診做準備。',
      contentsTitle: '本文內容',
      topics: [
        '瞭解診斷評估',
        '評估的主要步驟',
        '荷爾蒙血液檢查',
        '盆腔超音波檢查',
        '診斷並不能告訴你的事',
        '為就診做準備',
        '要點回顧',
      ],
      section1Body1: '多囊性卵巢症候群的診斷並不依賴單一檢查。醫療專業人員會綜合多方面的資訊：你的月經週期史、各種症狀、臨床檢查、實驗室檢查，並視情況做超音波檢查。',
      section1Body2: '目的既是尋找與 PCOS 相符的特徵，也是排除其他可能導致月經不規律或某些荷爾蒙相關症狀的原因。',
      tip1Title: '小提醒',
      tip1Text: '診斷總是因人而異的。兩位 PCOS 患者的症狀和檢查結果可能大不相同。',
      section2Body: '評估可以分為幾個步驟。這些步驟不一定對每個人都以同樣的方式進行。',
      diagnosisSteps: [
        {
          title: '問診',
          text: '專業人員會了解你的情況：月經週期、症狀、既往病史和用藥。',
        },
        {
          title: '臨床檢查',
          text: '尤其會檢視是否有雄性素過多的表現，並評估你的整體狀況。',
        },
        {
          title: '血液檢查',
          text: '可能會要求做荷爾蒙和代謝方面的檢查，以便進一步明確情況。',
        },
        {
          title: '超音波檢查',
          text: '通過觀察卵巢的外觀，可以補充完善評估。',
        },
      ],
      flowTitle: '流程一覽',
      flowItems: [
        '問診與症狀',
        '臨床檢查',
        '視情況做檢查',
        '必要時做超音波檢查',
      ],
      section3Body1: '可能會建議做血液檢查，以尋找雄性素過多的跡象，評估某些與生殖功能有關的荷爾蒙，並排查症狀的其他可能原因。',
      section3Body2: '具體選擇哪些檢查，取決於你的年齡、症狀、病史，以及專業人員想要確認的內容。',
      bloodTests: [
        {
          title: '雄性素',
          text: '睪酮，以及視情況檢查的其他荷爾蒙。',
        },
        {
          title: '甲狀腺功能',
          text: '尤其有助於排除某些導致月經週期不規律的原因。',
        },
        {
          title: '代謝檢查',
          text: '血糖，視風險因素有時還會查血脂。',
        },
      ],
      alertTitle: '重要提示',
      alertText: '荷爾蒙檢查結果需要結合臨床情況來解讀。通常僅憑單一數值，不足以得出 PCOS 的診斷結論。',
      section4Body: '超音波檢查可以用來觀察卵巢的外觀，尤其是檢視是否有數量較多的小卵泡。它還能讓專業人員排查可能導致某些症狀的其他因素。',
      tip2Title: '小提醒',
      tip2Text: '超音波檢檢視到很多卵泡，並不意味著一定患有 PCOS。結果需要結合其他評估內容一起解讀。',
      section5Body: '得到 PCOS 的診斷，並不能準確預測你今後會如何發展。這種症候群在不同的人身上，表現可能非常不同。',
      mythItems: [
        'PCOS 並不一定意味著不孕。',
        'PCOS 並不一定意味著有囊腫。',
        '僅憑診斷本身並不能決定治療方案。',
        '超音波檢查正常，也不一定能排除 PCOS。',
      ],
      section6Body: '提前準備好一些資訊，可以幫助專業人員瞭解你的情況，並選擇最合適的檢查。',
      appointmentQuestions: [
        '你的月經週期不規律有多久了？',
        '你有沒有發現痤瘡、異常的毛髮生長或脫髮？',
        '家族中有沒有 PCOS 或糖尿病病史？',
        '你是否希望在短期或中期內懷孕？',
      ],
      preparationTitle: '就診前的小建議',
      preparationText: '如果可以，請記下上次月經的日期、月經週期的大致長度、你注意到的症狀，以及正在使用的藥物或補充劑。',
      summaryTitle: '評估的要點',
      summaryItems: [
        '診斷依據的是多方面因素，而不是單一檢查。',
        '血液檢查可以尋找某些荷爾蒙失衡的跡象，並排除其他原因。',
        '視情況，超音波檢查可以補充完善評估。',
        '檢查結果始終應由醫療專業人員來解讀。',
      ],
      finalTipTitle: '要點回顧',
      finalTipText: 'PCOS 的評估不是一次檢查，也不是最終的定論。它幫助你瞭解自己的荷爾蒙狀況、排查其他可能的原因，並制定適合你情況的診療方案。',
      disclaimerText: '本文僅供參考，不能替代醫療就診，也不能替代對你檢查結果的個性化解讀。',
      shareMessage: 'PCOS 診斷：檢查與評估 — AWA',
    },
  ar: {
    badge: 'متلازمة تكيّس المبايض',
    title: 'تشخيص متلازمة تكيّس المبايض:\nالفحوص والتقييم',
    metaDuration: '7 دقائق للقراءة',
    metaType: 'دليل',
    metaLevel: 'متوسط',
    metaValidated: 'محتوى تمت مراجعته',
    intro: 'كيف تُشخَّص متلازمة تكيّس المبايض، وما الفحوص التي قد تُقترح، وكيف تستعدين لموعدك بهدوء.',
    contentsTitle: 'في هذا المقال',
    topics: [
      'فهم التقييم التشخيصي',
      'الخطوات الرئيسية للتقييم',
      'تحليل الدم الهرموني',
      'الفحص بالموجات فوق الصوتية للحوض',
      'ما لا يخبرك به التشخيص',
      'الاستعداد لموعدك',
      'أهم النقاط',
    ],
    section1Body1: 'لا يعتمد تشخيص متلازمة تكيّس المبايض على فحص واحد. إذ يجمع مختص الرعاية الصحية عدة معلومات: سجل دوراتك، وأي أعراض، والفحص السريري، والتحاليل المخبرية، وحسب الحالة الفحص بالموجات فوق الصوتية.',
    section1Body2: 'والهدف هو البحث عن علامات تتوافق مع متلازمة تكيّس المبايض، واستبعاد الأسباب الأخرى التي قد تفسّر عدم انتظام الحيض أو بعض الأعراض الهرمونية.',
    tip1Title: 'من المفيد أن تعرفي',
    tip1Text: 'التشخيص شخصي دائمًا. فقد تختلف الأعراض ونتائج الفحوص كثيرًا بين امرأتين مصابتين بمتلازمة تكيّس المبايض.',
    section2Body: 'قد يمرّ التقييم بعدة خطوات. وليس بالضرورة أن تُجرى كلها بالطريقة نفسها لدى الجميع.',
    diagnosisSteps: [
      {title: 'أخذ التاريخ المرضي', text: 'يجمع المختص معلوماتك: الدورات، والأعراض، والخلفية الطبية، والعلاجات.'},
      {title: 'الفحص السريري', text: 'يبحث خاصة عن علامات زيادة الأندروجينات، ويقيّم حالتك العامة.'},
      {title: 'التحاليل الدموية', text: 'قد تُطلب تحاليل هرمونية واستقلابية لتوضيح الوضع.'},
      {title: 'الفحص بالموجات فوق الصوتية', text: 'يمكن أن يُكمل التقييم من خلال ملاحظة مظهر المبيضين.'},
    ],
    flowTitle: 'المسار في لمحة',
    flowItems: [
      'التاريخ المرضي والأعراض',
      'الفحص السريري',
      'فحوص حسب الحالة',
      'الموجات فوق الصوتية عند الحاجة',
    ],
    section3Body1: 'قد يُقترح تحليل دم للبحث عن علامات زيادة الأندروجينات، وتقييم بعض الهرمونات المشاركة في الوظيفة الإنجابية، والبحث عن أسباب أخرى محتملة لأعراضك.',
    section3Body2: 'تعتمد الفحوص المختارة على عمرك وأعراضك وتاريخك الطبي وما يريد المختص التحقق منه.',
    bloodTests: [
      {title: 'الأندروجينات', text: 'التستوستيرون وهرمونات أخرى حسب الحالة.'},
      {title: 'وظيفة الغدة الدرقية', text: 'تساعد خاصة على استبعاد بعض أسباب عدم انتظام الدورة.'},
      {title: 'التقييم الاستقلابي', text: 'سكر الدم، وأحيانًا تحليل الدهون حسب عوامل الخطر.'},
    ],
    alertTitle: 'مهم',
    alertText: 'يجب تفسير النتائج الهرمونية في ضوء السياق السريري. وعادةً لا تكفي قيمة واحدة بمفردها للجزم بتشخيص متلازمة تكيّس المبايض.',
    section4Body: 'يمكن استخدام الفحص بالموجات فوق الصوتية لملاحظة مظهر المبيضين والبحث خاصة عن عدد كبير من الجريبات الصغيرة. كما يتيح للمختص البحث عن عوامل أخرى قد تفسّر بعض الأعراض.',
    tip2Title: 'من المفيد أن تعرفي',
    tip2Text: 'رؤية جريبات كثيرة في الموجات فوق الصوتية لا تعني تلقائيًا أنك مصابة بمتلازمة تكيّس المبايض. فيجب تفسير النتيجة مع بقية التقييم.',
    section5Body: 'تلقّي تشخيص متلازمة تكيّس المبايض لا يتيح التنبؤ بدقة بكيفية تطور الأمور لديك. فقد تظهر المتلازمة بشكل مختلف جدًا من امرأة إلى أخرى.',
    mythItems: [
      'متلازمة تكيّس المبايض لا تعني العقم تلقائيًا.',
      'متلازمة تكيّس المبايض لا تعني بالضرورة وجود أكياس.',
      'التشخيص وحده لا يحدد العلاج.',
      'الفحص الطبيعي بالموجات فوق الصوتية لا يستبعد بالضرورة متلازمة تكيّس المبايض.',
    ],
    section6Body: 'بعض المعلومات التي تجهّزينها مسبقًا قد تساعد المختص على فهم تاريخك الصحي واختيار الفحوص الأنسب.',
    appointmentQuestions: [
      'منذ متى وأنتِ تعانين من عدم انتظام الدورة؟',
      'هل لاحظتِ حب الشباب، أو نموًا غير معتاد للشعر، أو تساقطًا للشعر؟',
      'هل يوجد تاريخ عائلي لمتلازمة تكيّس المبايض أو للسكري؟',
      'هل ترغبين في الحمل على المدى القريب أو المتوسط؟',
    ],
    preparationTitle: 'نصيحة صغيرة قبل الموعد',
    preparationText: 'إن أمكن، دوّني تواريخ آخر حيض لديك، والمدة التقريبية لدوراتك، والأعراض التي تلاحظينها، وأي علاجات أو مكملات تتناولينها.',
    summaryTitle: 'خلاصة التقييم',
    summaryItems: [
      'يعتمد التشخيص على عدة عوامل، لا على فحص واحد.',
      'يمكن لتحليل الدم أن يبحث عن بعض الاختلالات الهرمونية ويستبعد أسبابًا أخرى.',
      'يمكن للفحص بالموجات فوق الصوتية أن يُكمل التقييم حسب الحالة.',
      'ينبغي أن يفسّر النتائجَ مختصٌّ في الرعاية الصحية دائمًا.',
    ],
    finalTipTitle: 'أهم النقاط',
    finalTipText: 'تقييم متلازمة تكيّس المبايض ليس فحصًا واحدًا ولا حكمًا نهائيًا. بل يساعدك على فهم عمل هرموناتك، والبحث عن أسباب أخرى محتملة، وبناء رعاية تناسب حالتك.',
    disclaimerText: 'هذا المقال للمعلومات فقط، ولا يغني عن الاستشارة الطبية ولا عن التفسير الشخصي لنتائج فحوصاتك.',
    shareMessage: 'تشخيص متلازمة تكيّس المبايض: الفحوص والتقييم — AWA',
  },
  kab: {
    badge: 'PCOS',
    title: 'Asenqed n PCOS:\nisenqed d wuguren',
    metaDuration: '7 n tesdatin n tɣuri',
    metaType: 'Amnir',
    metaLevel: 'Alemmas',
    metaValidated: 'Agbur yettwasenqed',
    intro: 'Amek i yettwasenqed PCOS, d acu n isenqed i izemren ad ttunefken, d amek ara tsewweḍ i termit-ik s lehna.',
    contentsTitle: 'Deg umagrad-a',
    topics: [
      'Fhem asenqed n ṭṭbib',
      'Iswiren igejdanen n usenqed',
      'Asenqed n idammen n hormone',
      'Ultrason n teɣmert',
      'Ayen ur d-yeqqar ara usenqed',
      'Ad tḥeggeḍ termit-ik',
      'Tiɣawsiwin tigejdanin',
    ],
    section1Body1: 'Asenqed n PCOS ur yettwasenqed ara s yiwen n usenqed kan. Amaẓrag n lɛafit yelqem aṭas n telɣut: amezruy n cycle-ik, ticraḍ yellan, asenqed n ugraw, isenqed n laboratwar, d ultrason almend n tmeẓẓi.',
    section1Body2: 'Iswi d ad nemmuqel i ticraḍ i yeqqnen ɣer PCOS d ad nefk i ssebbat niḍen i izemren ad d-ssefhmen lḥiḍ ur yelli ara d amaḍal neɣ kra n ticraḍ n hormone.',
    tip1Title: 'Ilaq ad teẓṛeḍ',
    tip1Text: 'Asenqed yettwaswayen i yal yiwet. Sin n tilawin i sɛan PCOS zemrent ad sɛunt ticraḍ d igmuḍ yemgaraden aṭas.',
    section2Body: 'Asenqed yezmer ad ṭṭef aṭas n yiswiren. Ur ttwaxdemen ara akk akken kif kif i yal yiwet.',
    diagnosisSteps: [
      {title: 'Asteqsi ɣef umezruy', text: 'Amaẓrag yelqem amezruy-ik: cycles, ticraḍ, amezruy n ddwa, d yinig.'},
      {title: 'Asenqed n ugraw', text: 'Yettnadi s wudem uslig ticraḍ n androgène aṭaṭ, yettwali aswir amatu n ugraw-ik.'},
      {title: 'Asenqed n idammen', text: 'Isenqed n hormone d n métabolisme zemren ad ttwasuturen akken ad d-bnun tamsalt.'},
      {title: 'Ultrason', text: 'Yezmer ad yekmel asenqed s wakud n twalit n yiseksawen.'},
    ],
    flowTitle: 'Abrid s tmuɣli',
    flowItems: [
      'Amezruy d ticraḍ',
      'Asenqed n ugraw',
      'Isenqed almend n tmeẓẓi',
      'Ultrason ma yelzem',
    ],
    section3Body1: 'Asenqed n idammen yezmer ad yettunefk akken ad d-tfeḍ ticraḍ n androgène aṭaṭ, ad yettwasenqed kra n hormone yeqqnen ɣer tikli n tmerna, d ad yettwanad ssebbat niḍen n ticraḍ-ik.',
    section3Body2: 'Isenqed i yettwafernen ttɛalaqen ɣer leɛmer-ik, ticraḍ-ik, amezruy-ik n ddwa, d wayen i yebɣa amaẓrag ad isenqed.',
    bloodTests: [
      {title: 'Androgène', text: 'Testostérone d hormone niḍen almend n tmeẓẓi.'},
      {title: 'Tikli n thyroïde', text: 'Ittɛawan s wudem uslig ad yefk kra n ssebbat n cycles ur yelli ara d imaḍalen.'},
      {title: 'Asenqed n métabolisme', text: 'Sukkar deg idammen, kra n tikkal asenqed n lipides almend n ilmend n tuggdi.'},
    ],
    alertTitle: 'D ayen yelhan',
    alertText: 'Igmuḍ n hormone ilaq ad ttwasmekten d tmeẓẓi n tmuɣli n ṭṭbib. Yiwen n wazal ur yettwakfa ara s wudem ameqqran akken ad yeqqar PCOS.',
    section4Body: 'Ultrason yezmer ad yettwasqedec akken ad yettwali udem n yiseksawen, ad yettwanad s wudem uslig ugar n follicule imeẓẓyanen. Yefk daɣen i umaẓrag ad d-yanad ilmend niḍen i izemren ad d-ssefhmen kra n ticraḍ.',
    tip2Title: 'Ilaq ad teẓṛeḍ',
    tip2Text: 'Ma twaliḍ aṭas n follicule deg ultrason, ur yeqqar ara s wudem awurman belli tesɛiḍ PCOS. Agmuḍ ilaq ad yettwasmekti d wayen i d-yeqqim n usenqed.',
    section5Body: 'Mi ara d-tali talɣut n PCOS, ur yefk ara ad tt-id-tsewweḍ amek ara tekkes tallunt-ik. Asyndrom yezmer ad d-yettbeggen s wudem yemgaraden aṭas seg yiwet ɣer tayeḍ.',
    mythItems: [
      'PCOS ur d-yeqqar ara s wudem awurman ur tmerneḍ ara.',
      'PCOS ur yeqqar ara belli tesɛiḍ kista.',
      'Asenqed kan ur yefk ara adwa.',
      'Ultrason amaḍal ur yeqqar ara s wudem uslig belli ulac PCOS.',
    ],
    section6Body: 'Kra n telɣut i tḥeggeḍ send zzman tezmer ad tɛawen amaẓrag ad yefhem amezruy-ik d ad ifren isenqed i yesɛan assaɣ.',
    appointmentQuestions: [
      'Acḥal n zzman i yezga cycle-ik ur yelli ara d amaḍal?',
      'Tbeggneḍ acne, aṭaṭ n ccwari ur yelli ara d amaḍal, neɣ ufeɣ n ccwari?',
      'Yella amezruy n twacult n PCOS neɣ n ṣṣukkar?',
      'Tebɣiḍ ad tmerneḍ deg zzman aqeṛṛeb neɣ alemmas?',
    ],
    preparationTitle: 'Tanṣiḥt meẓẓiyen send termit',
    preparationText: 'Ma tzemreḍ, ruẓ-d wussan n lḥiḍ-ik aneggaru, aɣezfan amatu n cycles-ik, ticraḍ i twaliḍ, d ddwa neɣ ibuqqes i tettawiḍ.',
    summaryTitle: 'Ayen igejdanen n usenqed',
    summaryItems: [
      'Asenqed yettwabna ɣef aṭas n wayen, mačči ɣef yiwen n usenqed kan.',
      'Asenqed n idammen yezmer ad yettnadi kra n tkili n hormone ur nelli ara d tameqqrant, ad yekkes ssebbat niḍen.',
      'Ultrason yezmer ad yekmel asenqed almend n tmeẓẓi.',
      'Igmuḍ ilaq ad ttwasmektin yal tikkelt sɣur umaẓrag n lɛafit.',
    ],
    finalTipTitle: 'Tiɣawsiwin tigejdanin',
    finalTipText: 'Asenqed n PCOS mačči d yiwen n usenqed neɣ d lḥekm aneggaru. Ittɛawan ad tfehmeḍ amek i yettxeddem hormone-ik, ad d-tafeḍ ssebbat niḍen, d ad tbnuḍ tallunt yelhan i tmeẓẓi-ik.',
    disclaimerText: 'Amagrad-a yettunefk kan i talɣut, ur d-yettɛawad ara tamsawalt n ṭṭbib neɣ asmekti yettwaswayen n igmuḍ n isenqed-ik.',
    shareMessage: 'Asenqed n PCOS: isenqed d wuguren — AWA',
  },
  om: {
    badge: 'PCOS',
    title: 'Murtii PCOS:\nqorannoo fi sakatta\'iinsa',
    metaDuration: 'Daqiiqaa 7 dubbisuuf',
    metaType: 'Qajeelfama',
    metaLevel: 'Giddugaleessa',
    metaValidated: 'Qabiyyee sakatta\'ame',
    intro: 'PCOS akkamitti adda baafama, qorannoon maal dhiyaachuu danda\'a, fi beellama kee tasgabbiidhaan akkamitti qophaa\'uu qabdu.',
    contentsTitle: 'Barruu kana keessatti',
    topics: [
      'Sakatta\'iinsa adda baasuu hubachuu',
      'Tarkaanfiiwwan ijoo sakatta\'iinsaa',
      'Qorannoo dhiigaa hormoonii',
      'Ultrasaawundii gadaa',
      'Murtiin maal hin himne',
      'Beellama kee qophaa\'uu',
      'Ka\'umsa gurguddoo',
    ],
    section1Body1: 'Murtiin dhukkuba gadaa baay\'ee kisii qorannoo tokko irratti hin hundaa\'u. Ogeessi fayyaa odeeffannoo hedduu walitti fida: seenaa marsaa kee, mallattoo yoo jiraate, qorannoo qaamaa, qorannoo laaboraatorii, fi akka haalaatti ultrasaawundii.',
    section1Body2: 'Kaayyoon mallattoowwan PCOS wajjin walsimatan barbaaduu fi sababoota biroo laguu sirrii hin taane ykn mallattoowwan hormoonii tokko tokko ibsuu danda\'an kan hin taane ta\'uu isaanii mirkaneessuu dha.',
    tip1Title: 'Beekuun gaarii dha',
    tip1Text: 'Murtiin yeroo hunda dhuunfaa dha. Dubartoonni PCOS qaban lama mallattoo fi bu\'aa qorannoo baay\'ee adda ta\'e qabaachuu danda\'u.',
    section2Body: 'Sakatta\'iinsi tarkaanfii hedduu hordofuu danda\'a. Nama hundaaf haala wal-fakkaatuun hin raawwatamu.',
    diagnosisSteps: [
      {title: 'Seenaa gaafachuu', text: 'Ogeessi seenaa kee walitti sassaaba: marsaa, mallattoo, seenaa fayyaa, fi yaalii.'},
      {title: 'Qorannoo qaamaa', text: 'Keessumaa mallattoo androjiinii baay\'ee ta\'e barbaadu, haala waliigalaa kee ni madaalu.'},
      {title: 'Qorannoo dhiigaa', text: 'Haala ibsuuf qorannoon hormoonii fi metaboolizimii gaafatamuu danda\'a.'},
      {title: 'Ultrasaawundii', text: 'Fakkii gadaa ilaaluudhaan sakatta\'iinsa xumuruu danda\'a.'},
    ],
    flowTitle: 'Adeemsa ilaalcha tokkoon',
    flowItems: [
      'Seenaa fi mallattoo',
      'Qorannoo qaamaa',
      'Qorannoo akka haalaatti',
      'Yoo barbaachise ultrasaawundii',
    ],
    section3Body1: 'Qorannoon dhiigaa mallattoo androjiinii baay\'ee ta\'e barbaaduuf, hormoonii hojii da\'umsaa keessatti hirmaatan tokko tokko madaaluuf, fi sababoota biroo mallattoo kee ta\'uu danda\'an barbaaduuf dhiyaachuu danda\'a.',
    section3Body2: 'Qorannoon filataman umurii kee, mallattoo kee, seenaa fayyaa kee, fi ogeessi maal mirkaneessuu barbaadu irratti hundaa\'a.',
    bloodTests: [
      {title: 'Androjiinii', text: 'Testosteroonii fi hormoonii biroo akka haalaatti.'},
      {title: 'Hojii tiroyidii', text: 'Sababoota marsaa sirrii hin taane tokko tokko adda baasuuf gargaara.'},
      {title: 'Qorannoo metaboolizimii', text: 'Sukkaara dhiigaa, yeroo tokko tokko qorannoo coomaa akka sababoota balaa irratti hundaa\'ee.'},
    ],
    alertTitle: 'Barbaachisaa',
    alertText: 'Bu\'aan hormoonii haala kilinikii waliin hiikamuu qaba. Gatii tokko qofti baay\'inaan, ofii isaatiin, murtii PCOS xumuruuf hin gahu.',
    section4Body: 'Ultrasaawundii fakkii gadaa ilaaluuf, keessumaa foolikulii xixiqqaa baay\'ina olaanaa barbaaduuf fayyadamuu danda\'a. Ogeessi sababoota biroo mallattoo tokko tokko ibsuu danda\'an akka barbaaduus ni dandeessisa.',
    tip2Title: 'Beekuun gaarii dha',
    tip2Text: 'Ultrasaawundii irratti foolikulii baay\'ee argamuun ofumaan PCOS qabda jechuu miti. Bu\'aan sakatta\'iinsa hafe waliin hiikamuu qaba.',
    section5Body: 'Murtii PCOS argachuun akkamitti si biratti ta\'uu isaa sirriitti tilmaamuu hin dandeessisu. Sindiroomiin kun nama irraa gara namaatti baay\'ee adda ta\'ee mul\'achuu danda\'a.',
    mythItems: [
      'PCOS ofumaan da\'uu dhorkuu hin dandeenye.',
      'PCOS yeroo hunda sisti qabaachuu hin jechisiisu.',
      'Murtiin qofti yaalii hin murteessu.',
      'Ultrasaawundii idilee ta\'e PCOS yeroo hunda hin ittisu.',
    ],
    section6Body: 'Odeeffannoo muraasa dursa qophaa\'e ogeessi seenaa kee hubatee qorannoo caalaatti walqabatu filachuu akka danda\'u gargaara.',
    appointmentQuestions: [
      'Marsaan kee yeroo hagamiif sirrii hin taane?',
      'Ujummoo fuulaa, fuduraa rifeensa hin baratamne, ykn rifeensi kufuu hubattee?',
      'Maatii keessatti PCOS ykn dhibeetii sukkaaraa jiraa?',
      'Yeroo gabaabaa ykn giddugaleessa keessatti ulfa fudhachuu barbaaddaa?',
    ],
    preparationTitle: 'Gorsa xiqqoo beellama dura',
    preparationText: 'Yoo danda\'ame, guyyaa laguu kee isa dhumaa, dheerina marsaa kee tilmaamaan, mallattoo ati hubattu, fi yaalii ykn faayidaa dabalataa fudhattu galmeessi.',
    summaryTitle: 'Wantoota ijoo sakatta\'iinsaa',
    summaryItems: [
      'Murtiin wantoota hedduu irratti hundaa\'a, qorannoo tokko irratti miti.',
      'Qorannoon dhiigaa jeequmsa hormoonii tokko tokko barbaaduu fi sababoota biroo adda baasuu danda\'a.',
      'Ultrasaawundii akka haalaatti sakatta\'iinsa xumuruu danda\'a.',
      'Bu\'aan yeroo hunda ogeessa fayyaatiin hiikamuu qaba.',
    ],
    finalTipTitle: 'Ka\'umsa gurguddoo',
    finalTipText: 'Sakatta\'iinsi PCOS qorannoo tokko ykn murtii dhumaa miti. Hojii hormoonii kee hubachuuf, sababoota biroo barbaaduuf, fi kunuunsa haala keetiif mijaa\'e ijaaruuf si gargaara.',
    disclaimerText: 'Barruun kun odeeffannoof qofa; mariin fayyaa ykn hiika dhuunfaa bu\'aa qorannoo kee hin bakka bu\'u.',
    shareMessage: 'Murtii PCOS: qorannoo fi sakatta\'iinsa — AWA',
  },
  ti: {
    badge: 'PCOS',
    title: 'ምርመራ PCOS፦\nፈተናታትን ግምገማን',
    metaDuration: '7 ደቒቕ ንባብ',
    metaType: 'መምርሒ',
    metaLevel: 'ማእከላይ',
    metaValidated: 'ዝተገምገመ ትሕዝቶ',
    intro: 'PCOS ከመይ ይርመር፣ እንታይ ፈተናታት ክቐርቡ ይኽእሉ፣ ከምኡውን ንቆጸራኺ ብሰላም ከመይ ከም እትዳሎ።',
    contentsTitle: 'ኣብዚ ዓንቀጽ',
    topics: [
      'ግምገማ ምርመራ ምርዳእ',
      'ቀንድታት ደረጃታት ግምገማ',
      'ናይ ሆርሞን ናይ ደም ምርመራ',
      'ናይ ሕቖ ኣልትራሳውንድ',
      'እቲ ምርመራ እንታይ ዘይነግረኪ',
      'ንቆጸራኺ ምድላው',
      'ቀንዲ ነጥብታት',
    ],
    section1Body1: 'ምርመራ ፖሊሲስቲክ ኦቫሪ ሲንድሮም ኣብ ሓደ ፈተና ጥራይ ኣይምርኮስን። እቲ ሞያ ጥዕና ዘለዎ ሰብ ብዙሓት ሓበሬታታት የኣኻኽብ፦ ታሪኽ ዑደትኪ፣ ዝኾነ ምልክታት፣ ክሊኒካዊ ምርመራ፣ ናይ ላቦራቶሪ ፈተናታትን፣ ከከም ኩነታት ድማ ኣልትራሳውንድ።',
    section1Body2: 'ዕላማ ምስ PCOS ዝሰማማዕ ባህርያት ምድላይን ንዘይምጉዳል ወርሓዊ ደም ወይ ገለ ናይ ሆርሞን ምልክታት ክገልጹ ዝኽእሉ ካልኦት ምኽንያታት ምእላይን እዩ።',
    tip1Title: 'ምፍላጥ ጽቡቕ እዩ',
    tip1Text: 'እቲ ምርመራ ኩሉ ግዜ ውልቃዊ እዩ። ክልተ ምስ PCOS ዘለዋ ደቂ ኣንስትዮ ኣዝዮም ዝተፈላለዩ ምልክታትን ውጽኢት ፈተናታትን ክህልወን ይኽእል።',
    section2Body: 'እቲ ግምገማ ዝተፈላለዩ ደረጃታት ክስዕብ ይኽእል። ንኹሉ ሰብ ብዘይ ሓደ ኣገባብ ብምሉእ ኣይፍጸሙን።',
    diagnosisSteps: [
      {title: 'ታሪኽ ምውሳድ', text: 'እቲ ሞያተኛ ታሪኽኪ ይእክብ፦ ዑደታት፣ ምልክታት፣ ሓኪማዊ ዳራን ሕክምናታትን።'},
      {title: 'ክሊኒካዊ ምርመራ', text: 'ብፍላይ ምልክታት ዝበዝሐ ኣንድሮጅንን ሓፈሻዊ ኩነታትኪን ይምርምር።'},
      {title: 'ናይ ደም ግምገማ', text: 'ኩነታት ንምንጻር ናይ ሆርሞንን ሜታቦሊክን ፈተናታት ክሕተቱ ይኽእሉ።'},
      {title: 'ኣልትራሳውንድ', text: 'ኣምሳል እንቋቕሖ ማህጸን ብምጥማት ንግምገማ ክውድእ ይኽእል።'},
    ],
    flowTitle: 'እቲ መስርሕ ብሓጺሩ',
    flowItems: [
      'ታሪኽን ምልክታትን',
      'ክሊኒካዊ ምርመራ',
      'ከከም ኩነታት ፈተናታት',
      'እንተ ኣድልዩ ኣልትራሳውንድ',
    ],
    section3Body1: 'ናይ ደም ምርመራ ምልክታት ዝበዝሐ ኣንድሮጅን ንምድላይ፣ ኣብ ተዋልዶ ተግባር ዝሳተፉ ገለ ሆርሞናት ንምግምጋምን ንምልክታትኪ ካልኦት ክኾኑ ዝኽእሉ ምኽንያታት ንምድላይን ክቐርብ ይኽእል።',
    section3Body2: 'እቶም ዝተመረጹ ፈተናታት ኣብ ዕድመኺ፣ ምልክታትኪ፣ ሓኪማዊ ታሪኽኪን እቲ ሞያተኛ ክፈትሽ ዝደልዮን ይምርኮሱ።',
    bloodTests: [
      {title: 'ኣንድሮጅናት', text: 'ቴስቶስቴሮንን ከከም ኩነታት ካልኦት ሆርሞናትን።'},
      {title: 'ተግባር ታይሮይድ', text: 'ብፍላይ ገለ ምኽንያታት ዘይምጉዳል ዑደታት ንምእላይ ይሕግዝ።'},
      {title: 'ሜታቦሊክ ግምገማ', text: 'ስኳር ኣብ ደም፣ ከከም ሓደጋ ምኽንያታት ሓደ ሓደ ግዜ ናይ ስብሒ ፈተና።'},
    ],
    alertTitle: 'ኣገዳሲ',
    alertText: 'ናይ ሆርሞን ውጽኢታት ምስ ክሊኒካዊ ኩነታት ሓቢሩ ክግለጽ የድልዮ። ሓደ ዋጋ ባዕሉ ብሓፈሻ ንምርመራ PCOS ንምውሳን ኣይኣክልን።',
    section4Body: 'ኣልትራሳውንድ ኣምሳል እንቋቕሖ ማህጸን ንምጥማትን ብፍላይ ብዙሕ ንኣሽቱ ፎሊኩላት ንምድላይን ክጥቀም ይኽእል። ንገለ ምልክታት ክገልጹ ዝኽእሉ ካልኦት ሓሳባት ንምድላይ እውን ንሞያተኛ የኽእሎ።',
    tip2Title: 'ምፍላጥ ጽቡቕ እዩ',
    tip2Text: 'ኣብ ኣልትራሳውንድ ብዙሓት ፎሊኩላት ምርኣይ ብኣውቶማቲክ PCOS ኣለኪ ማለት ኣይኮነን። እቲ ውጽኢት ምስ ካልእ ግምገማ ሓቢሩ ክግለጽ የድልዮ።',
    section5Body: 'ምርመራ PCOS ምቕባል ንዓኺ ከመይ ከም ዝኸይድ ብልክዕ ንምግማት ኣይፈቅድን። እቲ ሲንድሮም ካብ ሰብ ናብ ሰብ ኣዝዩ ብዝተፈላለየ ኣገባብ ክረአ ይኽእል።',
    mythItems: [
      'PCOS ብኣውቶማቲክ ዘይወላዲ ምዃን ኣየመልክትን።',
      'PCOS ኩሉ ግዜ ሲስታት ምህላው ኣየመልክትን።',
      'እቲ ምርመራ ባዕሉ ንሕክምና ኣይውስንን።',
      'ንቡር ኣልትራሳውንድ PCOS ብኣውቶማቲክ ኣየብርዝን።',
    ],
    section6Body: 'ቅድሚ ግዜ ዝተዳለው ውሑዳት ሓበሬታታት ንሞያተኛ ታሪኽኪ ንኽርደእን ዝያዳ ዝምልከቱ ፈተናታት ንኽመርጽን ክሕግዙ ይኽእሉ።',
    appointmentQuestions: [
      'ክንደይ ግዜ ኮይኑ ዑደታትኪ ዘይምጉዳል?',
      'ብጉር፣ ዘይተለምደ ዕብየት ጸጉሪ፣ ወይ ምውዳቕ ጸጉሪ ርኢኺ ዲኺ?',
      'ኣብ ቤተሰብ PCOS ወይ ሽኮር ታሪኽ ኣሎ ድዩ?',
      'ኣብ ቀረባ ወይ ማእከላይ ግዜ ክትጠንሲ ትደሊ ዲኺ?',
    ],
    preparationTitle: 'ቅድሚ ቆጸራ ሓጻር ምኽሪ',
    preparationText: 'እንተ ተኸኣለ፣ ዕለት መወዳእታ ወርሓዊ ደምኪ፣ ግምታዊ ርዝመት ዑደታትኪ፣ እትርእዮ ምልክታትን እትወስዶ ዝኾነ ሕክምናን ሰፕሊመንትን ጽሓፊ።',
    summaryTitle: 'ኣገደስቲ ነጥብታት ግምገማ',
    summaryItems: [
      'እቲ ምርመራ ኣብ ብዙሓት ሓሳባት እዩ ዝምርኮስ፣ ኣብ ሓደ ፈተና ጥራይ ኣይኮነን።',
      'ናይ ደም ምርመራ ገለ ናይ ሆርሞን ዘይሚዛናዊነት ክደሊ ካልኦት ምኽንያታት ድማ ከውጽእ ይኽእል።',
      'ኣልትራሳውንድ ከከም ኩነታት ነቲ ግምገማ ክውድእ ይኽእል።',
      'ውጽኢታት ኩሉ ግዜ ብሞያ ጥዕና ዘለዎ ሰብ ክግለጹ ይግባእ።',
    ],
    finalTipTitle: 'ቀንዲ ነጥብታት',
    finalTipText: 'ግምገማ PCOS ሓደ ፈተና ወይ መወዳእታ ፍርዲ ኣይኮነን። ናይ ሆርሞን ሓጋጊዝኪ ክትርደእ፣ ካልኦት ክኾኑ ዝኽእሉ ምኽንያታት ክትደልይን ንኩነታትኪ ዝስማማዕ ክንክን ክትሃንጽን ይሕግዘኪ።',
    disclaimerText: 'እዚ ዓንቀጽ ንሓበሬታ ጥራይ እዩ ሓኪማዊ ምርመራን ውልቃዊ ትርጉም ውጽኢት ፈተናታትኪን ኣይትክእን።',
    shareMessage: 'ምርመራ PCOS፦ ፈተናታትን ግምገማን — AWA',
  },
  rw: {
    badge: 'PCOS',
    title: 'Isuzuma rya PCOS:\nibizamini n\'ubushakashatsi',
    metaDuration: 'Iminota 7 yo gusoma',
    metaType: 'Igitabo cy\'inama',
    metaLevel: 'Hagati',
    metaValidated: 'Ibisobanuro byasuzumwe',
    intro: 'Uko PCOS isuzumwa, ibizamini bishobora gutangwa, n\'uko witegura gahunda yawe mu mutuzo.',
    contentsTitle: 'Muri iyi nyandiko',
    topics: [
      'Gusobanukirwa ubushakashatsi bw\'isuzuma',
      'Intambwe nyamukuru z\'ubushakashatsi',
      'Ikizamini cy\'amaraso cya hormone',
      'Ultrasound y\'ikiziba cy\'inda',
      'Ibyo isuzuma ritakubwira',
      'Kwitegura gahunda yawe',
      'Ingingo z\'ingenzi',
    ],
    section1Body1: 'Isuzuma rya PCOS ntirishingira ku kizamini kimwe. Umukozi w\'ubuzima yegeranya amakuru menshi: amateka y\'ukwezi kwawe, ibimenyetso byose, isuzuma ry\'umubiri, ibizamini bya laboratwari, na ultrasound bitewe n\'imimerere.',
    section1Body2: 'Intego ni ugushakisha ibimenyetso bihuye na PCOS no gukuraho izindi mpamvu zishobora gusobanura imihango idahoraho cyangwa ibimenyetso bimwe bya hormone.',
    tip1Title: 'Byiza kumenya',
    tip1Text: 'Isuzuma buri gihe riba iryihariye. Abagore babiri bafite PCOS bashobora kugira ibimenyetso n\'ibisubizo by\'ibizamini bitandukanye cyane.',
    section2Body: 'Ubushakashatsi bushobora kugira intambwe nyinshi. Ntabwo byanze bikunze zikorwa kimwe kuri bose.',
    diagnosisSteps: [
      {title: 'Kubaza amateka', text: 'Umuhanga yegeranya amateka yawe: ukwezi, ibimenyetso, amateka y\'ubuvuzi, n\'imiti.'},
      {title: 'Isuzuma ry\'umubiri', text: 'Arebera cyane ibimenyetso by\'androgens nyinshi kandi agasuzuma imimerere yawe muri rusange.'},
      {title: 'Ibizamini by\'amaraso', text: 'Ibizamini bya hormone n\'iby\'imikorere y\'umubiri (metabolic) bishobora gusabwa kugira ngo hasobanuke neza.'},
      {title: 'Ultrasound', text: 'Ishobora kuzuza ubushakashatsi mu kwitegereza uko intanga ngore zisa.'},
    ],
    flowTitle: 'Uko bikorwa ku muhengeri',
    flowItems: [
      'Amateka n\'ibimenyetso',
      'Isuzuma ry\'umubiri',
      'Ibizamini bitewe n\'imimerere',
      'Ultrasound niba bikenewe',
    ],
    section3Body1: 'Ikizamini cy\'amaraso gishobora gutangwa kugira ngo hashakwe ibimenyetso by\'androgens nyinshi, hasuzumwe ama hormone amwe agira uruhare mu mikorere y\'imyororokere, kandi hashakwe izindi mpamvu zishoboka z\'ibimenyetso byawe.',
    section3Body2: 'Ibizamini bihitwamo bishingira ku myaka yawe, ibimenyetso byawe, amateka yawe y\'ubuvuzi, n\'ibyo umuhanga ashaka kugenzura.',
    bloodTests: [
      {title: 'Androgens', text: 'Testosterone n\'andi ma hormone bitewe n\'imimerere.'},
      {title: 'Imikorere ya thyroid', text: 'Bifasha cyane cyane gukuraho zimwe mu mpamvu z\'ukwezi kudahoraho.'},
      {title: 'Ubushakashatsi bwa metabolic', text: 'Isukari mu maraso, rimwe na rimwe ibinure byo mu maraso bitewe n\'ibyago.'},
    ],
    alertTitle: 'Ni ngombwa',
    alertText: 'Ibisubizo bya hormone bigomba gusobanurwa hakurikijwe imimerere y\'ubuvuzi. Agaciro kamwe gasanzwe katagira ubushobozi bwo kwemeza isuzuma rya PCOS ku bwako.',
    section4Body: 'Ultrasound ishobora gukoreshwa mu kwitegereza uko intanga ngore zisa no gushakisha cyane follicules ntoya nyinshi. Inemerera kandi umuhanga gushakisha izindi mpamvu zishobora gusobanura ibimenyetso bimwe.',
    tip2Title: 'Byiza kumenya',
    tip2Text: 'Kubona follicules nyinshi kuri ultrasound ntibivuze byanze bikunze ko ufite PCOS. Igisubizo kigomba gusobanurwa hamwe n\'ibindi byose by\'ubushakashatsi.',
    section5Body: 'Kubona isuzuma rya PCOS ntibituma uhanura neza uko bizakugendekera. Iyi syndrome ishobora kugaragara mu buryo butandukanye cyane ku muntu ku wundi.',
    mythItems: [
      'PCOS ntiyihutira gusobanura kutabyara.',
      'PCOS ntisobanura byanze bikunze kugira ibibyimba (cysts).',
      'Isuzuma ryonyine ntiryemeza ubuvuzi.',
      'Ultrasound isanzwe ntikuraho byanze bikunze PCOS.',
    ],
    section6Body: 'Amakuru make yateguwe mbere ashobora gufasha umuhanga gusobanukirwa amateka yawe no guhitamo ibizamini bikwiye cyane.',
    appointmentQuestions: [
      'Ukwezi kwawe kumaze igihe kingana iki kudahoraho?',
      'Wigeze kubona ibiheri, ubwoya budasanzwe, cyangwa guta umusatsi?',
      'Mu muryango wawe hari uwigeze kurwara PCOS cyangwa diyabete?',
      'Ese ushaka gusama vuba cyangwa mu gihe giciriritse?',
    ],
    preparationTitle: 'Inama nto mbere ya gahunda',
    preparationText: 'Niba bishoboka, andika amatariki y\'imihango yawe iheruka, uburebure bugereranijwe bw\'ukwezi kwawe, ibimenyetso wiboneye, n\'imiti cyangwa inyongeramirire ufata.',
    summaryTitle: 'Iby\'ingenzi by\'ubushakashatsi',
    summaryItems: [
      'Isuzuma rishingira ku bintu byinshi, ntirishingira ku kizamini kimwe.',
      'Ikizamini cy\'amaraso gishobora gushakisha uburimbane bwa hormone butameze neza no gukuraho izindi mpamvu.',
      'Ultrasound ishobora kuzuza ubushakashatsi bitewe n\'imimerere.',
      'Ibisubizo bigomba buri gihe gusobanurwa n\'umukozi w\'ubuzima.',
    ],
    finalTipTitle: 'Ingingo z\'ingenzi',
    finalTipText: 'Ubushakashatsi bwa PCOS si ikizamini kimwe cyangwa umwanzuro wa nyuma. Bugufasha gusobanukirwa imikorere ya hormone zawe, gushakisha izindi mpamvu zishoboka, no kubaka ubuvuzi bukwiranye n\'imimerere yawe.',
    disclaimerText: 'Iyi nyandiko ni iy\'ibisobanuro gusa kandi ntisimbura kujya kwa muganga cyangwa gusobanurirwa ibisubizo by\'ibizamini byawe mu buryo bwihariye.',
    shareMessage: 'Isuzuma rya PCOS: ibizamini n\'ubushakashatsi — AWA',
  },
  rn: {
    badge: 'PCOS',
    title: 'Isuzuma rya PCOS:\nibizamini n\'iperereza',
    metaDuration: 'Iminota 7 yo gusoma',
    metaType: 'Ubuyobozi',
    metaLevel: 'Hagati',
    metaValidated: 'Amakuru yasuzumwe',
    intro: 'Uko PCOS imenyekana, ibizamini bishobora gutangwa, n\'uko wategura inama yawe mu mahoro.',
    contentsTitle: 'Muri iyi nyandiko',
    topics: [
      'Gusobanukirwa iperereza ry\'isuzuma',
      'Intambwe nkuru z\'iperereza',
      'Ikizamini c\'amaraso c\'imisemburo',
      'Echographie yo mu nda yo hasi',
      'Ibyo isuzuma ritakubwira',
      'Gutegura inama yawe',
      'Ingenzi zo kwibuka',
    ],
    section1Body1: 'Isuzuma rya syndrome des ovaires polykystiques ntiryishingikiriza ku kizamini kimwe. Umukozi w\'ubuzima akusanya amakuru menshi: amateka ya cycle yawe, ibimenyetso uko biri, isuzuma ry\'umubiri, ibizamini bya laboratwari, na, bitewe n\'uko bimeze, echographie.',
    section1Body2: 'Intego ni ukureba ibimenyetso bihuye na PCOS no gukuraho izindi mpamvu zishobora gusobanura imihango idahwanye canke ibimenyetso bimwe by\'imisemburo.',
    tip1Title: 'Ni byiza kumenya',
    tip1Text: 'Isuzuma rihora ryihariye ku muntu. Abagore babiri bafite PCOS bashobora kugira ibimenyetso n\'ibisubizo vy\'ibizamini bitandukanye cane.',
    section2Body: 'Iperereza rishobora kugira intambwe nyinshi. Ntabwo ziba zose zikorwa kimwe kuri bose.',
    diagnosisSteps: [
      {title: 'Kubaza amateka', text: 'Umuhanga akusanya amateka yawe: ama cycle, ibimenyetso, amateka y\'ubuvuzi, n\'imiti.'},
      {title: 'Isuzuma ry\'umubiri', text: 'Arareba cane cane ibimenyetso by\'androgènes nyinshi kandi agasuzuma uko umeze muri rusangi.'},
      {title: 'Ibizamini by\'amaraso', text: 'Ibizamini by\'imisemburo n\'iby\'imikorere y\'umubiri (métaboliques) bishobora gusabwa kugira ngo bisobanure uko bimeze.'},
      {title: 'Echographie', text: 'Ishobora kuzuza iperereza yitegereza uko intanga ngore zisa.'},
    ],
    flowTitle: 'Uko bigenda mu ncamake',
    flowItems: [
      'Amateka n\'ibimenyetso',
      'Isuzuma ry\'umubiri',
      'Ibizamini bitewe n\'uko bimeze',
      'Echographie niba bikenewe',
    ],
    section3Body1: 'Ikizamini c\'amaraso gishobora gutangwa kugira ngo hashakwe ibimenyetso by\'androgènes nyinshi, gusuzuma imisemburo imwe igira uruhare mu mikorere y\'ubwiyororokere, no gushakisha izindi mpamvu zishoboka z\'ibimenyetso vyawe.',
    section3Body2: 'Ibizamini byatoranijwe biterwa n\'imyaka yawe, ibimenyetso vyawe, amateka yawe y\'ubuvuzi, n\'ibyo umuhanga ashaka kugenzura.',
    bloodTests: [
      {title: 'Androgènes', text: 'Testostérone n\'indi misemburo bitewe n\'uko bimeze.'},
      {title: 'Imikorere ya thyroïde', text: 'Bifasha cane cane gukuraho zimwe mu mpamvu zituma ama cycle ataba amwe.'},
      {title: 'Iperereza ry\'imikorere y\'umubiri', text: 'Isukari mu maraso, rimwe na rimwe isuzuma ry\'ibinure bitewe n\'ibintu bishobora guteza ingorane.'},
    ],
    alertTitle: 'Ingenzi',
    alertText: 'Ibisubizo vy\'imisemburo bikwiye gusobanurwa hamwe n\'uko umuntu ameze. Agaciro kamwe kenshi ntigahagije, ku bwako, ngo hemezwe isuzuma rya PCOS.',
    section4Body: 'Echographie ishobora gukoreshwa mu kwitegereza uko intanga ngore zisa no gushakisha cane cane umubare munini wa folicules nto. Inaha kandi umuhanga amahirwe yo gushakisha ibindi bintu bishobora gusobanura ibimenyetso bimwe.',
    tip2Title: 'Ni byiza kumenya',
    tip2Text: 'Kubona folicules nyinshi kuri echographie ntibivuga ko ufite PCOS. Igisubizo gikwiye gusobanurwa hamwe n\'ibindi byose by\'iperereza.',
    section5Body: 'Guhabwa isuzuma rya PCOS ntibituma bishoboka guteganya neza uko bizakugendekera. Iyi syndrome ishobora kugaragara mu buryo butandukanye cane ku muntu umwe n\'undi.',
    mythItems: [
      'PCOS ntivuga kutabyara ku bwayo.',
      'PCOS ntivuga ko ugomba kugira kystes.',
      'Isuzuma ryonyine ntirigena ubuvuzi.',
      'Echographie isanzwe ntihora ikuraho PCOS.',
    ],
    section6Body: 'Amakuru make yateguwe mbere ashobora gufasha umuhanga gusobanukirwa amateka yawe no guhitamo ibizamini bikwiye cane.',
    appointmentQuestions: [
      'Ama cycle yawe amaze igihe kingana iki adahwanye?',
      'Waba warabonye ibiheri, imisatsi ikura mu buryo budasanzwe, canke gutakaza imisatsi?',
      'Mu muryango wanyu hari uwigeze kugira PCOS canke diyabete?',
      'Wifuza gutwita mu gihe gito canke giciriritse?',
    ],
    preparationTitle: 'Inama nto mbere y\'inama',
    preparationText: 'Niba bishoboka, andika amatariki y\'imihango yawe iheruka, uburebure bw\'ama cycle yawe bw\'ikigereranyo, ibimenyetso wiyumvira, n\'imiti canke inyongeramirire ufata.',
    summaryTitle: 'Ingenzi z\'iperereza',
    summaryItems: [
      'Isuzuma rishingiye ku bintu byinshi, si ikizamini kimwe.',
      'Ikizamini c\'amaraso gishobora gushakisha ihungabana ry\'imisemburo no gukuraho izindi mpamvu.',
      'Echographie ishobora kuzuza iperereza bitewe n\'uko bimeze.',
      'Ibisubizo bikwiye buri gihe gusobanurwa n\'umukozi w\'ubuzima.',
    ],
    finalTipTitle: 'Ingenzi zo kwibuka',
    finalTipText: 'Iperereza rya PCOS si ikizamini kimwe cangwa umwanzuro wa nyuma. Rigufasha gusobanukirwa imikorere y\'imisemburo yawe, gushakisha izindi mpamvu zishoboka, no kubaka ubuvuzi bubereye uko umeze.',
    disclaimerText: 'Iyi nyandiko ni iyo kumenyesha gusa kandi ntisimbura inama y\'abaganga canke gusobanura ibisubizo vy\'ibizamini vyawe ku muntu ku giti cye.',
    shareMessage: 'Isuzuma rya PCOS: ibizamini n\'iperereza — AWA',
  },
  ig: {
    badge: 'PCOS',
    title: 'Nchọpụta PCOS:\nnlele na nyocha',
    metaDuration: 'Nkeji 7 ka ị gụọ',
    metaType: 'Ntụziaka',
    metaLevel: 'Etiti',
    metaValidated: 'Ọdịnaya a nyochara',
    intro: 'Otú a na-achọpụta PCOS, nlele nwere ike ịbụ ndị a na-enye, na otú esi akwado maka nzukọ gị n\'udo.',
    contentsTitle: 'Na isiokwu a',
    topics: [
      'Ịghọta nyocha nchọpụta',
      'Nzọụkwụ bụ isi nke nyocha',
      'Nlele ọbara hormone',
      'Ultrasound nke pelvis',
      'Ihe nchọpụta anaghị agwa gị',
      'Ịkwado maka nzukọ gị',
      'Isi ihe ndị dị mkpa',
    ],
    section1Body1: 'Nchọpụta nke polycystic ovary syndrome anaghị adabere na otu nlele. Ọkachamara ahụike na-achịkọta ọtụtụ ozi: akụkọ usoro ọnwa gị, mgbaàmà ọ bụla, nlele ahụ, nlele laabu, na, dabere n\'ọnọdụ, ultrasound.',
    section1Body2: 'Ebumnuche bụ ilele ihe ndị kwekọrọ na PCOS ma wepụ ihe ndị ọzọ kpatara nke nwere ike ịkọwa nsọ ọnwa na-adịghị n\'usoro ma ọ bụ mgbaàmà hormone ụfọdụ.',
    tip1Title: 'Ọ dị mma ịmara',
    tip1Text: 'Nchọpụta bụ nke onwe mgbe niile. Ụmụ nwanyị abụọ nwere PCOS nwere ike inwe mgbaàmà na nsonaazụ nlele dị iche nke ukwuu.',
    section2Body: 'Nyocha nwere ike ịgbaso nzọụkwụ ole na ole. Ha anaghị eme n\'otu ụzọ n\'onye ọ bụla.',
    diagnosisSteps: [
      {title: 'Ịjụ akụkọ', text: 'Ọkachamara na-anakọta akụkọ gị: usoro ọnwa, mgbaàmà, akụkọ ahụike, na ọgwụgwọ.'},
      {title: 'Nlele ahụ', text: 'Ha na-achọ karịsịa ihe ngosi nke androgen karịrị ókè ma nyochaa ọnọdụ ahụ gị n\'ozuzu.'},
      {title: 'Nyocha ọbara', text: 'A nwere ike ịrịọ nlele hormone na metabolic iji mee ka ọnọdụ ahụ doo anya.'},
      {title: 'Ultrasound', text: 'Ọ nwere ike imechi nyocha site n\'ilebara ọdịdị ovary anya.'},
    ],
    flowTitle: 'Usoro ahụ n\'otu leba anya',
    flowItems: [
      'Akụkọ na mgbaàmà',
      'Nlele ahụ',
      'Nlele dabere n\'ọnọdụ',
      'Ultrasound ma ọ bụrụ na ọ dị mkpa',
    ],
    section3Body1: 'A nwere ike ịtụ aro nlele ọbara iji chọọ ihe ngosi nke androgen karịrị ókè, nyochaa hormone ụfọdụ metụtara ọrụ ọmụmụ, ma chọọ ihe ndị ọzọ nwere ike ịkpata mgbaàmà gị.',
    section3Body2: 'Nlele ndị a họọrọ na-adabere n\'afọ gị, mgbaàmà gị, akụkọ ahụike gị, na ihe ọkachamara chọrọ ilele.',
    bloodTests: [
      {title: 'Androgen', text: 'Testosterone na hormone ndị ọzọ dabere n\'ọnọdụ.'},
      {title: 'Ọrụ thyroid', text: 'Na-enyere aka karịsịa wepụ ihe ụfọdụ na-akpata usoro ọnwa na-adịghị n\'usoro.'},
      {title: 'Nyocha metabolic', text: 'Shuga dị n\'ọbara, mgbe ụfọdụ nlele abụba dabere n\'ihe ize ndụ.'},
    ],
    alertTitle: 'Dị mkpa',
    alertText: 'A ga-akọwa nsonaazụ hormone n\'ime ọnọdụ ahụike. Otu uru naanị anaghị ezu, n\'onwe ya, iji kwubie nchọpụta PCOS.',
    section4Body: 'Enwere ike iji ultrasound lebara ọdịdị ovary anya ma chọọ karịsịa ọnụọgụ dị elu nke obere follicle. Ọ na-enyekwa ọkachamara ohere ichọ ihe ndị ọzọ nwere ike ịkọwa mgbaàmà ụfọdụ.',
    tip2Title: 'Ọ dị mma ịmara',
    tip2Text: 'Ịhụ ọtụtụ follicle na ultrasound apụtaghị n\'onwe ya na ị nwere PCOS. A ga-akọwa nsonaazụ ya n\'ime nyocha niile.',
    section5Body: 'Inweta nchọpụta PCOS anaghị eme ka o kwe omume ịkọ kpọmkwem otú ihe ga-esi gaa maka gị. Syndrome ahụ nwere ike igosi n\'ụzọ dị iche nke ukwuu site n\'onye ruo n\'onye.',
    mythItems: [
      'PCOS apụtaghị n\'onwe ya amụghị nwa.',
      'PCOS apụtaghị na ị nwere cyst.',
      'Nchọpụta naanị anaghị ekpebi ọgwụgwọ.',
      'Ultrasound nkịtị anaghị ewepụ PCOS n\'ihe niile.',
    ],
    section6Body: 'Ozi ole na ole e kwadoro tupu oge nwere ike inyere ọkachamara aka ịghọta akụkọ gị ma họrọ nlele kacha dabara.',
    appointmentQuestions: [
      'Kemgbe oge ole ka usoro ọnwa gị na-adịghị n\'usoro?',
      'Ị hụla pimples, uto ntutu na-adịghị ahụkebe, ma ọ bụ ntutu na-ada?',
      'Ọ nwere akụkọ ezinụlọ nke PCOS ma ọ bụ ọrịa shuga?',
      'Ị chọrọ ịtụrụ ime n\'oge dị mkpụmkpụ ma ọ bụ n\'etiti?',
    ],
    preparationTitle: 'Obere ndụmọdụ tupu nzukọ',
    preparationText: 'Ọ bụrụ na o kwere omume, dekọọ ụbọchị nsọ ọnwa gị ikpeazụ, ogologo usoro ọnwa gị, mgbaàmà ị na-ahụ, na ọgwụgwọ ọ bụla ma ọ bụ ihe mgbakwunye ị na-aṅụ.',
    summaryTitle: 'Isi ihe nke nyocha',
    summaryItems: [
      'Nchọpụta na-adabere na ọtụtụ ihe, ọ bụghị otu nlele.',
      'Nlele ọbara nwere ike ịchọ ụfọdụ adịghị nguzozi hormone ma wepụ ihe ndị ọzọ kpatara.',
      'Ultrasound nwere ike imechi nyocha dabere n\'ọnọdụ.',
      'Ọkachamara ahụike kwesịrị ikọwa nsonaazụ mgbe niile.',
    ],
    finalTipTitle: 'Isi ihe ndị dị mkpa',
    finalTipText: 'Nyocha PCOS abụghị otu nlele ma ọ bụ ikpe ikpeazụ. Ọ na-enyere gị aka ịghọta otú hormone gị si arụ ọrụ, chọọ ihe ndị ọzọ nwere ike ịkpata, ma wuo nlekọta dabara n\'ọnọdụ gị.',
    disclaimerText: 'Isiokwu a bụ maka ozi naanị ma ọ naghị anọchi nzukọ dọkịta ma ọ bụ nkọwa nke onwe nke nsonaazụ nlele gị.',
    shareMessage: 'Nchọpụta PCOS: nlele na nyocha — AWA',
  },
  yo: {
    badge: 'PCOS',
    title: 'Ìwádìí PCOS:\nàwọn àyẹ̀wò àti ìwádìí',
    metaDuration: 'Kíkà ìṣẹ́jú 7',
    metaType: 'Ìtọ́sọ́nà',
    metaLevel: 'Àárín',
    metaValidated: 'Àkóónú tí a ti yẹ̀wò',
    intro: 'Bí a ṣe ń ṣe ìwádìí PCOS, àwọn àyẹ̀wò tí a lè dábàá, àti bí o ṣe lè múra sílẹ̀ fún ìpàdé rẹ ní ìbàlẹ̀ ọkàn.',
    contentsTitle: 'Nínú àpilẹ̀kọ yìí',
    topics: [
      'Lílóye ìwádìí àrùn',
      'Àwọn ìgbésẹ̀ pàtàkì ìwádìí',
      'Àyẹ̀wò ẹ̀jẹ̀ hormone',
      'Ultrasound ìbàdí',
      'Ohun tí ìwádìí àrùn kò sọ fún ọ',
      'Ìmúrasílẹ̀ fún ìpàdé rẹ',
      'Àwọn kókó pàtàkì',
    ],
    section1Body1: 'Ìwádìí àrùn polycystic ovary syndrome kò gbára lé àyẹ̀wò kan ṣoṣo. Òṣìṣẹ́ ìlera kó ọ̀pọ̀ ìròyìn jọ: ìtàn àyípo rẹ, àwọn àmì èyíkéyìí, àyẹ̀wò ara, àwọn àyẹ̀wò yàrá, àti, gẹ́gẹ́ bí ipò ṣe rí, ultrasound.',
    section1Body2: 'Ète ni láti wá àwọn ànímọ́ tó bá PCOS mu àti láti yọ àwọn ìdí mìíràn tó lè ṣàlàyé nǹkan oṣù tí kò tẹ̀lé ìlànà tàbí àwọn àmì hormone kan kúrò.',
    tip1Title: 'Ó dára láti mọ̀',
    tip1Text: 'Ìwádìí àrùn máa ń bá ẹnì kọ̀ọ̀kan mu nígbà gbogbo. Obìnrin méjì tó ní PCOS lè ní àwọn àmì àti àbájáde àyẹ̀wò tó yàtọ̀ gan-an.',
    section2Body: 'Ìwádìí náà lè tẹ̀lé ọ̀pọ̀ ìgbésẹ̀. Kì í ṣe pé a máa ṣe gbogbo wọn ní ọ̀nà kan náà fún gbogbo ènìyàn.',
    diagnosisSteps: [
      {title: 'Bíbéèrè ìtàn', text: 'Òṣìṣẹ́ náà kó ìtàn rẹ jọ: àyípo, àwọn àmì, ìtàn ìlera, àti àwọn ìtọ́jú.'},
      {title: 'Àyẹ̀wò ara', text: 'Wọ́n ń wá àwọn àmì androgen tó pọ̀ jù ní pàtàkì, wọ́n sì ń ṣe àyẹ̀wò ipò ara rẹ gbogbo.'},
      {title: 'Àyẹ̀wò ẹ̀jẹ̀', text: 'A lè béèrè fún àwọn àyẹ̀wò hormone àti ti metabolism láti ṣàlàyé ipò náà.'},
      {title: 'Ultrasound', text: 'Ó lè parí ìwádìí náà nípa wíwo bí àwọn ovary ṣe rí.'},
    ],
    flowTitle: 'Ìlànà náà ní kúkúrú',
    flowItems: [
      'Ìtàn àti àwọn àmì',
      'Àyẹ̀wò ara',
      'Àwọn àyẹ̀wò gẹ́gẹ́ bí ipò ṣe rí',
      'Ultrasound bí ó bá pọndandan',
    ],
    section3Body1: 'A lè dábàá àyẹ̀wò ẹ̀jẹ̀ láti wá àwọn àmì androgen tó pọ̀ jù, láti ṣe àyẹ̀wò àwọn hormone kan tó ní ipa nínú ìbímọ, àti láti wá àwọn ìdí mìíràn tó ṣeé ṣe fún àwọn àmì rẹ.',
    section3Body2: 'Àwọn àyẹ̀wò tí a yàn sinmi lórí ọjọ́ orí rẹ, àwọn àmì rẹ, ìtàn ìlera rẹ, àti ohun tí òṣìṣẹ́ náà fẹ́ yẹ̀wò.',
    bloodTests: [
      {title: 'Androgen', text: 'Testosterone àti àwọn hormone mìíràn gẹ́gẹ́ bí ipò ṣe rí.'},
      {title: 'Iṣẹ́ thyroid', text: 'Ó ń ranni lọ́wọ́ ní pàtàkì láti yọ àwọn ìdí kan tí àyípo kò fi tẹ̀lé ìlànà kúrò.'},
      {title: 'Àyẹ̀wò metabolism', text: 'Ṣúgà inú ẹ̀jẹ̀, nígbà míràn àyẹ̀wò ọ̀rá inú ẹ̀jẹ̀ gẹ́gẹ́ bí àwọn ohun tó lè fa ewu ṣe rí.'},
    ],
    alertTitle: 'Pàtàkì',
    alertText: 'Ó yẹ kí a túmọ̀ àbájáde hormone pẹ̀lú ipò ìṣègùn. Iye kan ṣoṣo kò sábà tó fúnra rẹ̀ láti parí ìwádìí PCOS.',
    section4Body: 'A lè lo ultrasound láti wo bí àwọn ovary ṣe rí àti láti wá iye follicle kékeré tó ga ní pàtàkì. Ó tún jẹ́ kí òṣìṣẹ́ náà wá àwọn nǹkan mìíràn tó lè ṣàlàyé àwọn àmì kan.',
    tip2Title: 'Ó dára láti mọ̀',
    tip2Text: 'Rírí ọ̀pọ̀ follicle lórí ultrasound kò túmọ̀ sí pé o ní PCOS láìfọwọ́yí. Ó yẹ kí a túmọ̀ àbájáde náà pẹ̀lú ìyókù ìwádìí.',
    section5Body: 'Gbígba ìwádìí PCOS kò jẹ́ kí a lè sọ ní pàtó bí nǹkan yóò ṣe lọ fún ọ. Àrùn náà lè hàn lọ́nà tó yàtọ̀ gan-an láti ẹnì kan sí òmíràn.',
    mythItems: [
      'PCOS kò túmọ̀ sí àìlèbímọ láìfọwọ́yí.',
      'PCOS kò túmọ̀ sí níní cyst dandan.',
      'Ìwádìí àrùn nìkan kò pinnu ìtọ́jú.',
      'Ultrasound tó wà déédéé kò yọ PCOS kúrò dandan.',
    ],
    section6Body: 'Àwọn ìròyìn díẹ̀ tí a múra sílẹ̀ ṣáájú lè ran òṣìṣẹ́ náà lọ́wọ́ láti lóye ìtàn rẹ àti láti yan àwọn àyẹ̀wò tó yẹ jù.',
    appointmentQuestions: [
      'Ìgbà wo ni àyípo rẹ ti jẹ́ èyí tí kò tẹ̀lé ìlànà?',
      'Ṣé o ti ṣàkíyèsí ìbájẹ́ ojú, irun tí kò wọ́pọ̀, tàbí dídá irun?',
      'Ṣé ìtàn PCOS tàbí àtọ̀gbẹ wà nínú ẹbí?',
      'Ṣé o fẹ́ lóyún láìpẹ́ tàbí láàrin àkókò àárín?',
    ],
    preparationTitle: 'Ìmọ̀ràn kékeré ṣáájú ìpàdé',
    preparationText: 'Bí ó bá ṣeé ṣe, kọ ọjọ́ nǹkan oṣù rẹ tó kẹ́yìn sílẹ̀, gígùn àyípo rẹ ní àròpín, àwọn àmì tí o ń ṣàkíyèsí, àti àwọn ìtọ́jú tàbí àfikún tí o ń lò.',
    summaryTitle: 'Àwọn kókó pàtàkì ìwádìí',
    summaryItems: [
      'Ìwádìí àrùn gbára lé ọ̀pọ̀ nǹkan, kì í ṣe àyẹ̀wò kan ṣoṣo.',
      'Àyẹ̀wò ẹ̀jẹ̀ lè wá àwọn àìwọ́ntúnwọ̀nsì hormone kan kí ó sì yọ àwọn ìdí mìíràn kúrò.',
      'Ultrasound lè parí ìwádìí náà gẹ́gẹ́ bí ipò ṣe rí.',
      'Ó yẹ kí òṣìṣẹ́ ìlera máa túmọ̀ àwọn àbájáde nígbà gbogbo.',
    ],
    finalTipTitle: 'Àwọn kókó pàtàkì',
    finalTipText: 'Ìwádìí PCOS kì í ṣe àyẹ̀wò kan ṣoṣo tàbí ìdájọ́ ìkẹyìn. Ó ń ràn ọ́ lọ́wọ́ láti lóye iṣẹ́ hormone rẹ, láti wá àwọn ìdí mìíràn tó ṣeé ṣe, àti láti kọ́ ìtọ́jú tó bá ipò rẹ mu.',
    disclaimerText: 'Àpilẹ̀kọ yìí wà fún ìfitónilétí nìkan, kò sì rọ́pò ìbẹ̀wò sí dókítà tàbí ìtúmọ̀ àbájáde àyẹ̀wò rẹ tó bá ọ mu.',
    shareMessage: 'Ìwádìí PCOS: àwọn àyẹ̀wò àti ìwádìí — AWA',
  },
  zu: {
    badge: 'PCOS',
    title: 'Ukuhlolwa kwe-PCOS:\nizivivinyo nokuphenywa',
    metaDuration: 'Imizuzu eyi-7 yokufunda',
    metaType: 'Umhlahlandlela',
    metaLevel: 'Maphakathi',
    metaValidated: 'Okubuyekeziwe',
    intro: 'Indlela i-PCOS ehlolwa ngayo, ukuthi yiziphi izivivinyo ezingase zinikezwe, nokuthi ungazilungiselela kanjani ngokuthula ukubonana kwakho.',
    contentsTitle: 'Kulesi sihloko',
    topics: [
      'Ukuqonda ukuphenywa kokuhlolwa',
      'Izinyathelo eziyinhloko zokuphenywa',
      'Ukuhlolwa kwegazi kwama-hormone',
      'I-ultrasound yenhlonzi',
      'Lokho ukuhlolwa okungakutsheli kona',
      'Ukulungiselela ukubonana kwakho',
      'Amaphuzu abalulekile',
    ],
    section1Body1: 'Ukuhlolwa kwe-polycystic ovary syndrome akuncikile esivivinyweni esisodwa. Uchwepheshe wezempilo ubuthanisa ulwazi oluningana: umlando wemijikelezo yakho, noma yiziphi izimpawu, ukuhlolwa komzimba, izivivinyo zaselabhorethri, futhi, kuye ngesimo, i-ultrasound.',
    section1Body2: 'Inhloso kokubili ukubheka izimpawu ezihambisana ne-PCOS nokukhipha ezinye izimbangela ezingachaza ukuya esikhathini okungalingani noma ezinye izimpawu zama-hormone.',
    tip1Title: 'Kuhle ukwazi',
    tip1Text: 'Ukuhlolwa kuhlala kwenzelwe umuntu ngamunye. Abesifazane ababili abanayo i-PCOS bangaba nezimpawu nemiphumela yezivivinyo ehluke kakhulu.',
    section2Body: 'Ukuphenywa kungalandela izinyathelo eziningana. Azenziwa ngendlela efanayo ngempela kubo bonke.',
    diagnosisSteps: [
      {title: 'Ukuthatha umlando', text: 'Uchwepheshe uqoqa umlando wakho: imijikelezo, izimpawu, umlando wezokwelapha, nokwelashwa.'},
      {title: 'Ukuhlolwa komzimba', text: 'Ubheka ikakhulukazi izimpawu zokweqile kwama-androgen futhi uhlola isimo sakho jikelele.'},
      {title: 'Ukuhlolwa kwegazi', text: 'Izivivinyo zama-hormone nezemetabolism zingase zicelwe ukucacisa isimo.'},
      {title: 'I-ultrasound', text: 'Ingagcwalisa ukuphenywa ngokubuka ukubonakala kwamaqanda esibeletho.'},
    ],
    flowTitle: 'Inqubo ngokushesha',
    flowItems: [
      'Umlando nezimpawu',
      'Ukuhlolwa komzimba',
      'Izivivinyo ngokuya ngesimo',
      'I-ultrasound uma kudingeka',
    ],
    section3Body1: 'Ukuhlolwa kwegazi kungase kunikezwe ukubheka izimpawu zokweqile kwama-androgen, ukuhlola ama-hormone athile ayingxenye yomsebenzi wokuzala, nokubheka ezinye izimbangela ezingenzeka zezimpawu zakho.',
    section3Body2: 'Izivivinyo ezikhethiwe zincike eminyakeni yakho, ezimpawini zakho, emlandweni wakho wezokwelapha, nakulokho uchwepheshe afuna ukukuhlola.',
    bloodTests: [
      {title: 'Ama-androgen', text: 'I-testosterone nezinye ama-hormone ngokuya ngesimo.'},
      {title: 'Umsebenzi we-thyroid', text: 'Usiza ikakhulukazi ekukhipheni ezinye izimbangela zemijikelezo engalingani.'},
      {title: 'Ukuphenywa kwemetabolism', text: 'Ushukela egazini, kwesinye isikhathi ipaneli yamafutha ngokuya ngezinto eziyingozi.'},
    ],
    alertTitle: 'Okubalulekile',
    alertText: 'Imiphumela yama-hormone idinga ukuhunyushwa kanye nomongo wezokwelapha. Inani elilodwa ngokuvamile alanele, ngokwalo, ukuphetha ngokuhlolwa kwe-PCOS.',
    section4Body: 'I-ultrasound ingasetshenziselwa ukubuka ukubonakala kwamaqanda esibeletho futhi ibheke ikakhulukazi inani eliphezulu lama-follicle amancane. Futhi ivumela uchwepheshe ukuthi abheke ezinye izinto ezingachaza izimpawu ezithile.',
    tip2Title: 'Kuhle ukwazi',
    tip2Text: 'Ukubona ama-follicle amaningi ku-ultrasound akusho ngokuzenzakalela ukuthi unayo i-PCOS. Umphumela udinga ukuhunyushwa kanye nokunye kokuphenywa.',
    section5Body: 'Ukutholakala ne-PCOS akwenzi kube nokwenzeka ukubikezela ngqo ukuthi izinto zizokuhamba kanjani kuwe. Lesi sifo singabonakala ngendlela ehluke kakhulu komunye nomunye.',
    mythItems: [
      'I-PCOS ayisho ngokuzenzakalela ukungazali.',
      'I-PCOS ayisho ngempela ukuba nama-cyst.',
      'Ukuhlolwa kuphela akunqumi ukwelashwa.',
      'I-ultrasound evamile ayikhiphi ngempela i-PCOS.',
    ],
    section6Body: 'Ulwazi oluncane olulungiselelwe kusengaphambili lungasiza uchwepheshe aqonde umlando wakho futhi akhethe izivivinyo ezifaneleke kakhulu.',
    appointmentQuestions: [
      'Imijikelezo yakho ibilokhu ingalingani isikhathi esingakanani?',
      'Ingabe uqaphele izinyosi, ukukhula kwezinwele okungajwayelekile, noma ukuthuthuka kwezinwele?',
      'Ingabe kukhona umlando womndeni we-PCOS noma isifo sikashukela?',
      'Ingabe ufisa ukukhulelwa esikhathini esifushane noma esiphakathi?',
    ],
    preparationTitle: 'Iseluleko esincane ngaphambi kokubonana',
    preparationText: 'Uma kungenzeka, qaphela izinsuku zesikhathi sakho sokugcina, ubude obulinganiselwe bemijikelezo yakho, izimpawu ozibonayo, nanoma yikuphi ukwelashwa noma izithasiselo ozisebenzisayo.',
    summaryTitle: 'Okubalulekile ekuphenyweni',
    summaryItems: [
      'Ukuhlolwa kuncike ezintweni eziningana, hhayi isivivinyo esisodwa.',
      'Ukuhlolwa kwegazi kungabheka ukungalingani okuthile kwama-hormone futhi kukhiphe ezinye izimbangela.',
      'I-ultrasound ingagcwalisa ukuphenywa ngokuya ngesimo.',
      'Imiphumela kufanele ihlale ihunyushwa uchwepheshe wezempilo.',
    ],
    finalTipTitle: 'Amaphuzu abalulekile',
    finalTipText: 'Ukuphenywa kwe-PCOS akusona isivivinyo esisodwa noma isinqumo sokugcina. Kukusiza uqonde ukusebenza kwama-hormone akho, ubheke ezinye izimbangela ezingenzeka, futhi wakhe ukunakekelwa okufanele isimo sakho.',
    disclaimerText: 'Lesi sihloko sesolwazi kuphela futhi asithathi isikhundla sokubonana nodokotela noma sokuhunyushwa kwemiphumela yezivivinyo zakho okwenzelwe wena.',
    shareMessage: 'Ukuhlolwa kwe-PCOS: izivivinyo nokuphenywa — AWA',
  },
  xh: {
    badge: 'I-PCOS',
    title: 'Uxilongo lwe-PCOS:\nuvavanyo nophando',
    metaDuration: 'Imizuzu eyi-7 yokufunda',
    metaType: 'Isikhokelo',
    metaLevel: 'Ephakathi',
    metaValidated: 'Ulwazi oluhlolisisiweyo',
    intro: 'Indlela i-PCOS exilongwa ngayo, uvavanyo olunokunikelwa, nendlela yokulungiselela idinga lakho ngokuzolileyo.',
    contentsTitle: 'Kweli nqaku',
    topics: [
      'Ukuqonda uphando lwexilongo',
      'Amanyathelo aphambili ophando',
      'Uvavanyo lwegazi lweehomoni',
      'I-ultrasound yenyongo',
      'Oko uxilongo lungakuxeleli',
      'Ukulungiselela idinga lakho',
      'Eyona nto ibalulekileyo',
    ],
    section1Body1: 'Uxilongo lwe-polycystic ovary syndrome alixhomekekanga kuvavanyo olunye. Ingcali yezempilo iqokelela ulwazi oluninzi: imbali yomjikelo wakho, nayiphi na imiqondiso, uhlolo lomzimba, uvavanyo lwelabhoratri, kwaye, ngokuxhomekeke kwimeko, i-ultrasound.',
    section1Body2: 'Injongo kukukhangela iimpawu ezihambelana ne-PCOS nokuthintela ezinye izizathu ezinokuchaza ixesha lokuya exesheni elingaqhelekanga okanye iimpawu ezithile zeehomoni.',
    tip1Title: 'Kulungile ukwazi',
    tip1Text: 'Uxilongo lusoloko lwenzelwe umntu ngamnye. Abafaziababini abane-PCOS banokuba neempawu neziphumo zovavanyo ezahlukileyo kakhulu.',
    section2Body: 'Uphando lunokulandela amanyathelo aliqela. Ayenziwa ngokufanayo kumntu wonke ngokuyimfuneko.',
    diagnosisSteps: [
      {title: 'Ukuthatha imbali', text: 'Ingcali iqokelela imbali yakho: imijikelo, iimpawu, imvelaphi yezonyango, nonyango.'},
      {title: 'Uhlolo lomzimba', text: 'Ikhangela ngakumbi iimpawu zokugqitha kwee-androgen kwaye ihlole imeko yakho iyonke.'},
      {title: 'Uphando lwegazi', text: 'Uvavanyo lweehomoni nolwe-metabolism lunokucelwa ukucacisa imeko.'},
      {title: 'I-ultrasound', text: 'Inokugqibezela uphando ngokubona ukubonakala kwamaqanda.'},
    ],
    flowTitle: 'Inkqubo ngokufutshane',
    flowItems: [
      'Imbali neempawu',
      'Uhlolo lomzimba',
      'Uvavanyo ngokwemeko',
      'I-ultrasound ukuba kuyimfuneko',
    ],
    section3Body1: 'Uvavanyo lwegazi lunokunikelwa ukukhangela iimpawu zokugqitha kwee-androgen, ukuhlola iihomoni ezithile ezibandakanyekayo kwimpilo yokuzala, nokukhangela ezinye izizathu ezinokubakho zeempawu zakho.',
    section3Body2: 'Uvavanyo olukhethiweyo luxhomekeke kubudala bakho, iimpawu zakho, imbali yakho yezonyango, nento ingcali ifuna ukuyikhangela.',
    bloodTests: [
      {title: 'Ii-androgen', text: 'I-testosterone nezinye iihomoni ngokwemeko.'},
      {title: 'Umsebenzi we-thyroid', text: 'Lunceda ngakumbi ukuthintela ezinye izizathu zemijikelo engaqhelekanga.'},
      {title: 'Uphando lwe-metabolism', text: 'Iswekile yegazi, ngamanye amaxesha i-lipid panel ngokuxhomekeke kwimiba yomngcipheko.'},
    ],
    alertTitle: 'Kubalulekile',
    alertText: 'Iziphumo zeehomoni kufuneka zithetyiswe kunye nomxholo wezonyango. Ixabiso elinye alihlali lanele, ngokwalo, ukugqiba uxilongo lwe-PCOS.',
    section4Body: 'I-ultrasound inokusetyenziswa ukubona ukubonakala kwamaqanda nokukhangela ngakumbi inani eliphezulu lee-follicle ezincinci. Ikwavumela ingcali ukuba ikhangele ezinye izinto ezinokuchaza iimpawu ezithile.',
    tip2Title: 'Kulungile ukwazi',
    tip2Text: 'Ukubona ii-follicle ezininzi kwi-ultrasound akuthethi ngokuzenzekelayo ukuba une-PCOS. Isiphumo kufuneka sithetyiswe kunye nolunye uphando.',
    section5Body: 'Ukufumana uxilongo lwe-PCOS akwenzi kube nokwenzeka ukuqikelela ngqo indlela izinto ziza kuqhubeka ngayo kuwe. Isifo sinokubonakala ngokwahlukileyo kakhulu komnye umntu ukuya komnye.',
    mythItems: [
      'I-PCOS ayithethi ngokuzenzekelayo ukungazali.',
      'I-PCOS ayithethi ngokuyimfuneko ukuba nee-cyst.',
      'Uxilongo ngokwalo alugqibi unyango.',
      'I-ultrasound eqhelekileyo ayithintheli ngokuyimfuneko i-PCOS.',
    ],
    section6Body: 'Ulwazi oluncinci olulungiselelwe kwangaphambili lunganceda ingcali iqonde imbali yakho kwaye ikhethe uvavanyo olufanelekileyo.',
    appointmentQuestions: [
      'Mangaphi amaxesha imijikelo yakho ibingaqhelekanga?',
      'Ngaba uqaphele i-acne, ukukhula kweenwele okungaqhelekanga, okanye ukuwa kweenwele?',
      'Ngaba kukho imbali yosapho ye-PCOS okanye yeswekile?',
      'Ngaba ufuna ukukhulelwa kwixesha elifutshane okanye eliphakathi?',
    ],
    preparationTitle: 'Icebiso elincinci phambi kwedinga',
    preparationText: 'Ukuba kunokwenzeka, bhala imihla yexesha lakho lokuya exesheni lokugqibela, ubude obulinganiselweyo bemijikelo yakho, iimpawu ozibonayo, nanoma yiluphi unyango okanye izongezelelo ozisebenzisayo.',
    summaryTitle: 'Okubalulekileyo kuphando',
    summaryItems: [
      'Uxilongo luxhomekeke kwizinto ezininzi, hayi uvavanyo olunye.',
      'Uvavanyo lwegazi lunokukhangela ukungalingani kweehomoni ezithile kwaye luthintele ezinye izizathu.',
      'I-ultrasound inokugqibezela uphando ngokuxhomekeke kwimeko.',
      'Iziphumo kufuneka zihlala zithetyiswa yingcali yezempilo.',
    ],
    finalTipTitle: 'Eyona nto ibalulekileyo',
    finalTipText: 'Uphando lwe-PCOS aluluvavanyo olunye okanye isigwebo sokugqibela. Lukunceda uqonde indlela iihomoni zakho ezisebenza ngayo, ukhangele ezinye izizathu ezinokubakho, kwaye wakhe unyango olufanele imeko yakho.',
    disclaimerText: 'Eli nqaku lolwazi kuphela kwaye alithatheli indawo yophando lwezonyango okanye ukuthetyiswa kweziphumo zovavanyo lwakho ngokwakho.',
    shareMessage: 'Uxilongo lwe-PCOS: uvavanyo nophando — AWA',
  },
  sn: {
    badge: 'PCOS',
    title: 'Kuongororwa kwe PCOS:\ntests nekuongorora',
    metaDuration: 'Maminitsi manomwe ekuverenga',
    metaType: 'Nhungamiro',
    metaLevel: 'Pakati',
    metaValidated: 'Ruzivo rwakaongororwa',
    intro: 'Madiro anoongororwa PCOS, tests dzinogona kukurudzirwa, uye madiro ekugadzirira zvinyoronyoro musangano wako.',
    contentsTitle: 'Muchinyorwa ichi',
    topics: [
      'Kunzwisisa kuongorora kwekuongororwa',
      'Matanho makuru ekuongorora',
      'Blood test yemahormone',
      'Ultrasound yemuchiuno',
      'Zvisingaudzwi nekuongororwa',
      'Kugadzirira musangano wako',
      'Zvinokosha zvekuyeuka',
    ],
    section1Body1: 'Kuongororwa kwe polycystic ovary syndrome hakutsamiri test imwe chete. Nyanzvi yezvehutano inounganidza ruzivo rwakawanda: nhoroondo yekutenderera kwako, zviratidzo zvipi zvazvo, kuongororwa kwemuviri, lab tests, uye, zvichienderana nemamiriro, ultrasound.',
    section1Body2: 'Chinangwa ndechekutsvaga zvinhu zvinoenderana ne PCOS nekubvisa zvimwe zvikonzero zvinogona kutsanangura kuenda kumwedzi kusina kurongeka kana zviratidzo zvimwe zvemahormone.',
    tip1Title: 'Zvakanaka kuziva',
    tip1Text: 'Kuongororwa kunogara kuri kwemunhu mumwe nemumwe. Vakadzi vaviri vane PCOS vanogona kuva nezviratidzo nemhedzisiro ye tests zvakasiyana zvikuru.',
    section2Body: 'Kuongorora kunogona kutevera matanho akati. Haaitwi nenzira imwe chete kuvanhu vese.',
    diagnosisSteps: [
      {title: 'Kutora nhoroondo', text: 'Nyanzvi inounganidza nhoroondo yako: kutenderera, zviratidzo, nhoroondo yehutano, nekurapwa.'},
      {title: 'Kuongororwa kwemuviri', text: 'Vanotsvaga kunyanya zviratidzo zve androgens dzakanyanya uye vanoongorora mamiriro ako ose.'},
      {title: 'Blood tests', text: 'Tests dzemahormone nedzemetabolism dzinogona kukumbirwa kujekesa mamiriro.'},
      {title: 'Ultrasound', text: 'Inogona kupedzisa kuongorora nekutarisa maonekero e ovaries.'},
    ],
    flowTitle: 'Maitiro ose pakutarisa kamwe',
    flowItems: [
      'Nhoroondo nezviratidzo',
      'Kuongororwa kwemuviri',
      'Tests zvichienderana nemamiriro',
      'Ultrasound kana zvichidiwa',
    ],
    section3Body1: 'Blood test inogona kukurudzirwa kutsvaga zviratidzo zve androgens dzakanyanya, kuongorora mahormone mamwe anobatana nebasa rekubereka, uye kutsvaga zvimwe zvikonzero zvinogoneka zvezviratidzo zvako.',
    section3Body2: 'Tests dzinosarudzwa dzinoenderana nezera rako, zviratidzo zvako, nhoroondo yako yehutano, uye zvinodiwa kuongororwa nenyanzvi.',
    bloodTests: [
      {title: 'Androgens', text: 'Testosterone nemamwe mahormone zvichienderana nemamiriro.'},
      {title: 'Basa re thyroid', text: 'Inobatsira kubvisa zvimwe zvikonzero zvekutenderera kusina kurongeka.'},
      {title: 'Kuongorora kwe metabolism', text: 'Shuga yeropa, dzimwe nguva lipid panel zvichienderana nezvinhu zvenjodzi.'},
    ],
    alertTitle: 'Zvakakosha',
    alertText: 'Mhedzisiro yemahormone inofanira kududzirwa pamwe chete nemamiriro ekurapwa. Kukosha kumwe chete kazhinji hakwani, pachako, kuti kusvike pakuongororwa kwe PCOS.',
    section4Body: 'Ultrasound inogona kushandiswa kutarisa maonekero e ovaries uye kutsvaga kunyanya huwandu hwakawanda hwema follicle madiki. Inobvumirawo nyanzvi kutsvaga zvimwe zvinhu zvinogona kutsanangura zviratidzo zvimwe.',
    tip2Title: 'Zvakanaka kuziva',
    tip2Text: 'Kuona ma follicle mazhinji paultrasound hakurevi otomatiki kuti une PCOS. Mhedzisiro inofanira kududzirwa pamwe chete nezvimwe zvekuongorora.',
    section5Body: 'Kuwana kuongororwa kwe PCOS hakuiti kuti zvikwanise kufanotaura chaizvo kuti zvichafambira mberi sei kwauri. Syndrome inogona kuoneka nenzira dzakasiyana zvikuru kubva kumunhu kuenda kumunhu.',
    mythItems: [
      'PCOS haireve kusabereka otomatiki.',
      'PCOS haireve kuti une cysts.',
      'Kuongororwa oga hakusarudze kurapwa.',
      'Ultrasound yakajairika haibvisi PCOS nguva dzose.',
    ],
    section6Body: 'Ruzivo rushoma rwakagadzirirwa mberi runogona kubatsira nyanzvi kunzwisisa nhoroondo yako nekusarudza tests dzinonyanya kukodzera.',
    appointmentQuestions: [
      'Kutenderera kwako kwave kusina kurongeka kwenguva yakareba sei?',
      'Wakacherechedza mapundu pachiso, kukura kwevhudzi kusina kujairika, kana kuonda kwevhudzi here?',
      'Pane nhoroondo yemhuri ye PCOS kana chirwere cheshuga here?',
      'Unoda kubata mimba munguva pfupi kana pakati here?',
    ],
    preparationTitle: 'Zano rizere pamberi pemusangano',
    preparationText: 'Kana zvichigoneka, nyora mazuva ekuenda kwako kumwedzi kwekupedzisira, hurefu hwakati hwekutenderera kwako, zviratidzo zvaunocherechedza, nekurapwa kupi zvako kana zvinowedzera zvaunoshandisa.',
    summaryTitle: 'Zvakakosha zvekuongorora',
    summaryItems: [
      'Kuongororwa kunotsamira pazvinhu zvakawanda, kwete test imwe chete.',
      'Blood test inogona kutsvaga kusaenzana kwemahormone kwakati uye kubvisa zvimwe zvikonzero.',
      'Ultrasound inogona kupedzisa kuongorora zvichienderana nemamiriro.',
      'Mhedzisiro inofanira kududzirwa nenyanzvi yezvehutano nguva dzose.',
    ],
    finalTipTitle: 'Zvinokosha zvekuyeuka',
    finalTipText: 'Kuongorora kwe PCOS hakusi test imwe chete kana mhedzisiro yekupedzisira. Kunokubatsira kunzwisisa mashandiro emahormone ako, kutsvaga zvimwe zvikonzero zvinogoneka, uye kuvaka kurapwa kunokodzera mamiriro ako.',
    disclaimerText: 'Chinyorwa ichi chekupa ruzivo chete uye hachitsivi kuenda kuchiremba kana kududzirwa kwemhedzisiro ye tests dzako kwakakodzera iwe.',
    shareMessage: 'Kuongororwa kwe PCOS: tests nekuongorora — AWA',
  },
  ln: {
    badge: 'PCOS',
    title: 'Bosambisi ya PCOS:\nba test mpe botalisi',
    metaDuration: 'Mpe ya kotánga: min 7',
    metaType: 'Mokanda ya litambwisi',
    metaLevel: 'Katikati',
    metaValidated: 'Maloba oyo ekomi na bokeba',
    intro: 'Ndenge PCOS esambisamaka, ba test nini ekoki kopesama, mpe ndenge ya komibongisa na kimya mpo na rendez-vous na yo.',
    contentsTitle: 'Na lisolo oyo',
    topics: [
      'Kososola botalisi ya bosambisi',
      'Mikolo ya monene ya botalisi',
      'Test ya makila ya hormone',
      'Ultrasound ya libumu',
      'Oyo bosambisi elobi te',
      'Komibongisa mpo na rendez-vous na yo',
      'Makambo ya motuya',
    ],
    section1Body1: 'Bosambisi ya syndrome ya baovaire ya kisto ebandaka na test moko kaka te. Moto ya mosala ya bokolongono asangisaka boyebisi mingi: histoire ya sanza na yo, bilembo soki ezali, kotala nzoto, ba test ya laboratoire, mpe, engebene na likambo, ultrasound.',
    section1Body2: 'Ntina ezali kolukaluka makambo oyo ekokani na PCOS mpe kolongola bantina mosusu oyo ekoki kolimbola sanza ya kokesana to bilembo mosusu ya hormone.',
    tip1Title: 'Ezali malamu koyeba',
    tip1Text: 'Bosambisi ezali ntango nyonso ya moto na moto. Basi mibale oyo bazali na PCOS bakoki kozala na bilembo mpe ba result ekesani mingi.',
    section2Body: 'Botalisi ekoki kolanda mikolo mingi. Esalemaka ndenge moko te mpo na moto nyonso.',
    diagnosisSteps: [
      {title: 'Kotuna histoire', text: 'Moto ya mosala atondi boyebisi ya histoire na yo: basanza, bilembo, histoire ya monganga, mpe bakisi.'},
      {title: 'Kotala nzoto', text: 'Alukaka mingi bilembo ya androgène mingi mpe atalaka lolenge ya nzoto na yo mobimba.'},
      {title: 'Botalisi ya makila', text: 'Ba test ya hormone mpe ya métabolisme ekoki kosengama mpo na kolimbola likambo.'},
      {title: 'Ultrasound', text: 'Ekoki kokokisa botalisi na kotala lolenge ya baovaire.'},
    ],
    flowTitle: 'Nzela na lisolo moko',
    flowItems: [
      'Histoire mpe bilembo',
      'Kotala nzoto',
      'Ba test engebene na likambo',
      'Ultrasound soki esengeli',
    ],
    section3Body1: 'Test ya makila ekoki kopesama mpo na kolukaluka bilembo ya androgène mingi, kotala ba hormone mosusu oyo etali mosala ya kobota, mpe kolukaluka bantina mosusu oyo ekoki kozala ya bilembo na yo.',
    section3Body2: 'Ba test oyo bapona ezali kolanda mibu na yo, bilembo na yo, histoire na yo ya monganga, mpe oyo moto ya mosala alingi kotala.',
    bloodTests: [
      {title: 'Androgène', text: 'Testostérone mpe ba hormone mosusu engebene na likambo.'},
      {title: 'Mosala ya thyroïde', text: 'Esungaka mingi mpo na kolongola bantina mosusu ya sanza ya kokesana.'},
      {title: 'Botalisi ya métabolisme', text: 'Sukali ya makila, mbala mosusu lipid, engebene na makambo ya likama.'},
    ],
    alertTitle: 'Ya motuya',
    alertText: 'Ba result ya hormone esengeli kolimbolama elongo na makambo ya klinik. Motango moko kaka ekoki mbala mingi te mpo na kondimisa bosambisi ya PCOS.',
    section4Body: 'Ultrasound ekoki kosalelama mpo na kotala lolenge ya baovaire mpe kolukaluka mingi mingi motango monene ya follicule ya moke. Epesi mpe nzela na moto ya mosala ya kolukaluka makambo mosusu oyo ekoki kolimbola bilembo mosusu.',
    tip2Title: 'Ezali malamu koyeba',
    tip2Text: 'Komona follicule mingi na ultrasound elingi koloba te ete ozali na PCOS. Result esengeli kolimbolama elongo na botalisi mosusu.',
    section5Body: 'Kozwa bosambisi ya PCOS epesi nzela ya koyeba na bosikisiki te ndenge makambo ekokende mpo na yo. Syndrome ekoki kolakisama ndenge ekesani mingi na moto na moto.',
    mythItems: [
      'PCOS elingi koloba mpasi ya kobota ntango nyonso te.',
      'PCOS elingi koloba kozala na kisto ntango nyonso te.',
      'Bosambisi kaka ekanisi bobateli te.',
      'Ultrasound ya malamu ebimisi PCOS ntango nyonso te.',
    ],
    section6Body: 'Boyebisi mwa ndambo oyo obongisi liboso ekoki kosunga moto ya mosala kososola histoire na yo mpe kopona ba test oyo ebongi mingi.',
    appointmentQuestions: [
      'Basanza na yo ezali ya kokesana banda ntango boni?',
      'Omonaki bouton, bwanya ya nsuki oyo ekesani, to kokwea ya nsuki?',
      'Ezali na histoire ya PCOS to ya diabète na libota?',
      'Olingi kozwa mimba na ntango moke to katikati?',
    ],
    preparationTitle: 'Toli moke liboso ya rendez-vous',
    preparationText: 'Soki ekoki, koma mikolo ya sanza na yo ya suka, boumeli ya basanza na yo, bilembo oyo omoni, mpe bakisi to supplément oyo ozali kozwa.',
    summaryTitle: 'Makambo ya motuya ya botalisi',
    summaryItems: [
      'Bosambisi etiami na makambo mingi, na test moko kaka te.',
      'Test ya makila ekoki kolukaluka bokesani mosusu ya hormone mpe kolongola bantina mosusu.',
      'Ultrasound ekoki kokokisa botalisi engebene na likambo.',
      'Ba result esengeli ntango nyonso kolimbolama na moto ya mosala ya bokolongono.',
    ],
    finalTipTitle: 'Makambo ya motuya',
    finalTipText: 'Botalisi ya PCOS ezali test moko te to bosambisi ya suka te. Esungaka yo kososola ndenge hormone na yo esalaka, kolukaluka bantina mosusu, mpe kotongela bobateli oyo ebongi na likambo na yo.',
    disclaimerText: 'Lisolo oyo ezali mpo na koyébisa kaka mpe ekotɛlɛmaka na kotala monganga to na bolimboli ya moto na moto ya ba result na yo te.',
    shareMessage: 'Bosambisi ya PCOS: ba test mpe botalisi — AWA',
  },
  ff: {
    badge: 'PCOS',
    title: 'Anndugol PCOS:\ntests e ƴeewndo',
    metaDuration: 'Janngugol minit 7',
    metaType: 'Ɗaɓɓitaaji',
    metaLevel: 'Hakkunde',
    metaValidated: 'Habaru ɗum ƴeewtaama',
    intro: 'No PCOS anndiraa, tests ɗum foti hokkeede, e no ɗum ɗon haani heɓa ngam ƴeewndaago ɗaɓɓitaago maaɗa e jam.',
    contentsTitle: 'E winndannde ndee',
    topics: [
      'Faamugol ƴeewndo anndugo',
      'Laawol ɗi ɓesngu ƴeewndo',
      'Test ɗiyam hormones',
      'Ultrasound pelvis',
      'Ko anndugo ɗum ɗon wi’a ma alaa',
      'Taskaago ɗaɓɓitaago maaɗa',
      'Ko ɗum ɗon ɗum ɓesngu',
    ],
    section1Body1: 'Anndugol polycystic ovary syndrome ɗum ɗon wooɗa e test gooto tan. Neɗɗo anndudo ɓanndu ɗum ɗon hawta habaru ɗuuɗi: tuugnorgal ciklu maaɗa, alamaaji, ƴeewndo ɓanndu, tests laboratoire, e, ko ɗuuɗi e ngonka, ultrasound.',
    section1Body2: 'Ko ɗum ɗon yiɗi woni yiɗude takaaɗe ɗi nanndi e PCOS e ƴeewndo sabaabuuji feere ɗi foti hokka menstruation wooɗaaɗum walla alamaaji hormones feere.',
    tip1Title: 'Ɗum ɗon ɗum ɓesngu',
    tip1Text: 'Anndugo ɗum ɗon ko maaɗa hoore. Rewbe ɗiɗi e PCOS foti mari alamaaji e jawaabuuji tests feere-feere.',
    section2Body: 'Ƴeewndo foti wooɗude e laawol ɗuuɗi. Ɗum ɗon waɗa kala nanndi e neɗɗo fuu.',
    diagnosisSteps: [
      {title: 'Ƴeewndo habaru', text: 'Neɗɗo anndudo ɓanndu ɗum ɗon wuurta habaru maaɗa: ciklu, alamaaji, tuugnorgal ɓanndu, e safaara.'},
      {title: 'Ƴeewndo ɓanndu', text: 'Ɗum ɗon yiɗa ko ɗuuɗi alamaaji androgens ɗuuɗal e ɗum ɗon ƴeewndo ngonka ɓanndu fuu.'},
      {title: 'Test ɗiyam', text: 'Tests hormones e metabolism foti ɗaɓɓitaade ngam laaɓnugo ngonka.'},
      {title: 'Ultrasound', text: 'Ɗum foti timmina ƴeewndo ko yi’a ovaires.'},
    ],
    flowTitle: 'Laawol fuu e yi’ugo gootol',
    flowItems: [
      'Habaru e alamaaji',
      'Ƴeewndo ɓanndu',
      'Tests ko ɗuuɗi e ngonka',
      'Ultrasound so ɗum ɗon haani',
    ],
    section3Body1: 'Test ɗiyam foti ɗaɓɓitaade ngam yiɗugo alamaaji androgens ɗuuɗal, ƴeewndo hormones feere ɗi ɗon e kuugal jibinaare, e yiɗugo sabaabuuji feere ɗi foti hokka alamaaji maaɗa.',
    section3Body2: 'Tests ɗi suɓaaɗi ɗum ɗon ko ɗuuɗi e duuɗe maaɗa, alamaaji maaɗa, tuugnorgal ɓanndu maaɗa, e ko neɗɗo anndudo ɓanndu yiɗi ƴeewndo.',
    bloodTests: [
      {title: 'Androgens', text: 'Testosterone e hormones feere ko ɗuuɗi e ngonka.'},
      {title: 'Kuugal thyroid', text: 'Walliidi ko ɗuuɗi yiɗugo sabaabuuji feere ciklu wooɗaaɗum.'},
      {title: 'Ƴeewndo metabolism', text: 'Glucose ɗiyam, ko ɗuuɗi lipid panel ko ɗuuɗi e sabaabuuji reenaaɗum.'},
    ],
    alertTitle: 'Ɗum ɓesngu',
    alertText: 'Jawaabuuji hormones ɗum ɗon faamaade e ngonka ƴeewndo. Hiisa gootal tan ɗum ɗon yotta ngam hoolnugo anndugo PCOS.',
    section4Body: 'Ultrasound foti huutinaade ngam yi’ugo ovaires e yiɗugo follicles famarɗe ɗuuɗi. Ɗum fahin ɗum ɗon walliidi neɗɗo anndudo ɓanndu yiɗugo kuuje feere ɗi foti hokka alamaaji.',
    tip2Title: 'Ɗum ɗon ɗum ɓesngu',
    tip2Text: 'Yi’ugo follicles ɗuuɗi e ultrasound ɗum ɗon wi’a ma alaa PCOS ko hoore maako. Jawaabu ɗum ɗon faamaade e ɗum ɗon ƴeewndo fuu.',
    section5Body: 'Heɓugo anndugo PCOS ɗum ɗon waɗa ɗum ɗon anndude no ɗum ɗon yaha e maaɗa. Syndrome foti hollude feere-feere e neɗɗo e neɗɗo.',
    mythItems: [
      'PCOS ɗum ɗon wi’a alaa jibinaare ko hoore maako.',
      'PCOS ɗum ɗon wi’a ma mari cysts.',
      'Anndugo tan ɗum ɗon suɓa safaara.',
      'Ultrasound ɗum ɗon wooɗa ɗum ɗon wi’a alaa PCOS.',
    ],
    section6Body: 'Habaru seɗɗa taskaaɗum ado foti walliidi neɗɗo anndudo ɓanndu faamugo tuugnorgal maaɗa e suɓugo tests ɗi ɓurii ɗaɓɓitaago.',
    appointmentQuestions: [
      'Ciklu maaɗa ɗon wooɗaaɗum haa ɗuuɗi?',
      'A yi’i acne, ɗuuɗugol gaseeje, walla soofugol gaseeje?',
      'Tuugnorgal PCOS walla diabète ɗum ɗon e ɗiɗɗa maaɗa?',
      'A yiɗi heɓugo pellital e wakkati seɗɗa walla hakkunde?',
    ],
    preparationTitle: 'Hokkitaare seɗɗa ado ɗaɓɓitaago',
    preparationText: 'So ɗum ɗon wooɗa, winndu nyalaaji menstruation maaɗa sakitiinde, juutugol ciklu maaɗa ko ɗuuɗi, alamaaji ɗi a yi’i, e safaara walla supplements ɗi a ɗon huutina.',
    summaryTitle: 'Ko ɓesngu ƴeewndo',
    summaryItems: [
      'Anndugo ɗum ɗon e kuuje ɗuuɗi, bannjo test gooto tan.',
      'Test ɗiyam foti yiɗude wooɗal hormones feere e ƴeewndo sabaabuuji feere.',
      'Ultrasound foti timmina ƴeewndo ko ɗuuɗi e ngonka.',
      'Jawaabuuji ɗum ɗon faamaade e neɗɗo anndudo ɓanndu kala.',
    ],
    finalTipTitle: 'Ko ɗum ɗon ɗum ɓesngu',
    finalTipText: 'Ƴeewndo PCOS ɗum ɗon test gooto tan walla jawaabu timmuɗum. Ɗum walliidi ma faamugo kuugal hormones maaɗa, yiɗugo sabaabuuji feere, e waɗugo safaara ɗum ɗon e ngonka maaɗa.',
    disclaimerText: 'Winndannde ndee ɗum ɗon anndinirɗum tan e ɗum ɗon wuurta ƴeewndo doktoor walla faamugo jawaabuuji tests maaɗa ko maaɗa hoore.',
    shareMessage: 'Anndugo PCOS: tests e ƴeewndo — AWA',
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
  ms: {
    badge: 'PCOS',
    title: 'Diagnosis PCOS:\nujian dan pemeriksaan',
    metaDuration: '7 min bacaan',
    metaType: 'Panduan',
    metaLevel: 'Pertengahan',
    metaValidated: 'Kandungan disemak',
    intro: 'Bagaimana PCOS didiagnosis, ujian apa yang mungkin ditawarkan, dan bagaimana bersedia dengan tenang untuk temu janji anda.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Memahami pemeriksaan diagnostik',
      'Langkah utama pemeriksaan',
      'Ujian darah hormon',
      'Ultrasound pelvis',
      'Apa yang tidak diberitahu oleh diagnosis',
      'Bersedia untuk temu janji anda',
      'Perkara penting untuk diingat',
    ],
    section1Body1: 'Diagnosis sindrom ovari polikistik tidak bergantung pada satu ujian sahaja. Pengamal penjagaan kesihatan menghimpunkan beberapa maklumat: sejarah kitaran anda, sebarang simptom, pemeriksaan klinikal, ujian makmal dan, bergantung pada keadaan, ultrasound.',
    section1Body2: 'Matlamatnya ialah untuk mencari ciri yang konsisten dengan PCOS dan juga menolak punca lain yang boleh menjelaskan haid yang tidak teratur atau simptom hormon tertentu.',
    tip1Title: 'Elok diketahui',
    tip1Text: 'Diagnosis sentiasa diperibadikan. Dua wanita dengan PCOS boleh mempunyai simptom dan keputusan ujian yang sangat berbeza.',
    section2Body: 'Pemeriksaan boleh mengikut beberapa langkah. Ia tidak semestinya dilaksanakan dengan cara yang sama untuk semua orang.',
    diagnosisSteps: [
      {title: 'Pengambilan sejarah', text: 'Pengamal profesional mengumpul sejarah anda: kitaran, simptom, latar belakang perubatan dan rawatan.'},
      {title: 'Pemeriksaan klinikal', text: 'Mereka mencari terutamanya tanda kelebihan androgen dan menilai keadaan keseluruhan anda.'},
      {title: 'Ujian darah', text: 'Ujian hormon dan metabolik mungkin diminta untuk menjelaskan keadaan.'},
      {title: 'Ultrasound', text: 'Ia boleh melengkapkan pemeriksaan dengan memerhati rupa ovari.'},
    ],
    flowTitle: 'Proses sekilas pandang',
    flowItems: [
      'Sejarah dan simptom',
      'Pemeriksaan klinikal',
      'Ujian bergantung pada keadaan',
      'Ultrasound jika perlu',
    ],
    section3Body1: 'Ujian darah mungkin ditawarkan untuk mencari tanda kelebihan androgen, menilai hormon tertentu yang terlibat dalam fungsi pembiakan dan mencari punca lain yang mungkin bagi simptom anda.',
    section3Body2: 'Ujian yang dipilih bergantung pada umur, simptom, sejarah perubatan anda dan apa yang ingin disemak oleh pengamal profesional.',
    bloodTests: [
      {title: 'Androgen', text: 'Testosteron dan hormon lain bergantung pada keadaan.'},
      {title: 'Fungsi tiroid', text: 'Membantu terutamanya menolak punca tertentu kitaran tidak teratur.'},
      {title: 'Pemeriksaan metabolik', text: 'Glukosa darah, kadangkala panel lipid bergantung pada faktor risiko.'},
    ],
    alertTitle: 'Penting',
    alertText: 'Keputusan hormon perlu ditafsirkan bersama konteks klinikal. Satu nilai biasanya tidak mencukupi, dengan sendirinya, untuk membuat kesimpulan diagnosis PCOS.',
    section4Body: 'Ultrasound boleh digunakan untuk memerhati rupa ovari dan mencari terutamanya bilangan folikel kecil yang tinggi. Ia juga membolehkan pengamal profesional mencari faktor lain yang boleh menjelaskan simptom tertentu.',
    tip2Title: 'Elok diketahui',
    tip2Text: 'Melihat banyak folikel pada ultrasound tidak secara automatik bermakna anda menghidap PCOS. Keputusan perlu ditafsirkan bersama baki pemeriksaan.',
    section5Body: 'Menerima diagnosis PCOS tidak membolehkan kita meramal dengan tepat bagaimana perkembangannya bagi anda. Sindrom ini boleh muncul dengan sangat berbeza dari seorang ke seorang.',
    mythItems: [
      'PCOS tidak secara automatik bermakna ketidaksuburan.',
      'PCOS tidak semestinya bermakna mempunyai sista.',
      'Diagnosis sahaja tidak menentukan rawatan.',
      'Ultrasound yang normal tidak semestinya menolak PCOS.',
    ],
    section6Body: 'Beberapa maklumat yang disediakan lebih awal boleh membantu pengamal profesional memahami sejarah anda dan memilih ujian yang paling relevan.',
    appointmentQuestions: [
      'Sudah berapa lama kitaran anda tidak teratur?',
      'Adakah anda perasan jerawat, pertumbuhan rambut yang luar biasa atau keguguran rambut?',
      'Adakah terdapat sejarah keluarga PCOS atau diabetes?',
      'Adakah anda ingin hamil dalam jangka pendek atau sederhana?',
    ],
    preparationTitle: 'Petua kecil sebelum temu janji',
    preparationText: 'Jika boleh, catat tarikh haid terakhir anda, anggaran tempoh kitaran anda, simptom yang anda perasan dan sebarang rawatan atau suplemen yang anda ambil.',
    summaryTitle: 'Perkara penting pemeriksaan',
    summaryItems: [
      'Diagnosis bergantung pada beberapa faktor, bukan satu ujian sahaja.',
      'Ujian darah boleh mencari ketidakseimbangan hormon tertentu dan menolak punca lain.',
      'Ultrasound boleh melengkapkan pemeriksaan bergantung pada keadaan.',
      'Keputusan sentiasa perlu ditafsirkan oleh pengamal penjagaan kesihatan.',
    ],
    finalTipTitle: 'Perkara penting untuk diingat',
    finalTipText: 'Pemeriksaan PCOS bukan satu ujian tunggal atau keputusan muktamad. Ia membantu anda memahami fungsi hormon anda, mencari punca lain yang mungkin, dan membina penjagaan yang sesuai dengan keadaan anda.',
    disclaimerText: 'Artikel ini hanya untuk maklumat dan tidak menggantikan konsultasi perubatan atau tafsiran diperibadikan keputusan ujian anda.',
    shareMessage: 'Diagnosis PCOS: ujian dan pemeriksaan — AWA',
  },
  so: {
    badge: 'PCOS',
    title: 'Baaritaanka PCOS:\nbaaritaanno iyo hubin',
    metaDuration: '7 daq akhris',
    metaType: 'Hage',
    metaLevel: 'Dhexdhexaad',
    metaValidated: 'Macluumaad la dib-u-eegay',
    intro: 'Sida PCOS loo baaro, baaritaannada la soo jeedin karo, iyo sida si degan loogu diyaargarowdo ballankaaga.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Fahamka hubinta baaritaanka',
      'Tallaabooyinka ugu muhiimsan ee hubinta',
      'Baaritaanka dhiigga hormoonka',
      'Ultrasaawnka miskaha',
      'Waxa baaritaanku kuu sheegayn',
      'U diyaargarowga ballankaaga',
      'Qodobbada muhiimka ah',
    ],
    section1Body1: 'Baaritaanka syndrome-ka ukun-sidaha badan kuma tiirsana hal baaritaan. Xirfadlaha caafimaadku wuxuu isu keenaa dhowr macluumaad: taariikhdaada wareegga, astaamo kasta, baaritaanka dhakhtarka, baaritaannada shaybaarka, iyo, iyadoo ku xiran xaaladda, ultrasaawn.',
    section1Body2: 'Ujeedadu waa labadaba in la raadiyo sifooyin la jaan qaadaya PCOS iyo in la meeleeyo sababaha kale ee sharraxi kara caadooyin aan joogto ahayn ama astaamo hormoon oo qaar.',
    tip1Title: 'Waxtar leh in la ogaado',
    tip1Text: 'Baaritaanku had iyo jeer waa shakhsi. Laba naagood oo PCOS qaba waxay yeelan karaan astaamo iyo natiijooyin baaritaan oo aad u kala duwan.',
    section2Body: 'Hubintu waxay raaci kartaa dhowr tallaabo. Mar walba dhammaantood si isku mid ah qof walba looma sameeyo.',
    diagnosisSteps: [
      {title: 'Qaadashada taariikhda', text: 'Xirfadlaha ayaa ururiya taariikhdaada: wareegyada, astaamaha, asalka caafimaad, iyo daaweynnada.'},
      {title: 'Baaritaanka dhakhtarka', text: 'Waxay si gaar ah u raadiyaan calaamadaha androgen xad dhaaf ah oo qiimeeyaan xaaladdaada guud.'},
      {title: 'Baaritaanka dhiigga', text: 'Baaritaanno hormoon iyo dheef-shiid kimiyaad ayaa la codsan karaa si loo caddeeyo xaaladda.'},
      {title: 'Ultrasaawn', text: 'Wuxuu dhammaystiri karaa hubinta isagoo indho-indheynaya muuqaalka ukun-sidayaasha.'},
    ],
    flowTitle: 'Habraaca hal mar',
    flowItems: [
      'Taariikh iyo astaamo',
      'Baaritaanka dhakhtarka',
      'Baaritaanno iyadoo ku xiran xaaladda',
      'Ultrasaawn haddii loo baahdo',
    ],
    section3Body1: 'Baaritaan dhiig ayaa la soo jeedin karaa si loo raadiyo calaamadaha androgen xad dhaaf ah, loo qiimeeyo hormoonno qaar ku lug leh shaqada taranka, loona raadiyo sababo kale oo suurtagal ah oo astaamahaaga ah.',
    section3Body2: 'Baaritaannada la doorto waxay ku xiran yihiin da’daada, astaamahaaga, taariikhdaada caafimaad, iyo waxa xirfadlaha rabo inuu hubiyo.',
    bloodTests: [
      {title: 'Androgens', text: 'Testosterone iyo hormoonno kale iyadoo ku xiran xaaladda.'},
      {title: 'Shaqada thyroid', text: 'Wuxuu gaar ahaan caawiyaa meelaynta sababo qaar ee wareegyada aan joogto ahayn.'},
      {title: 'Baaritaanka dheef-shiid kimiyaadka', text: 'Sonkorta dhiigga, mararka qaarkood liis dufan iyadoo ku xiran arrimaha khatarta.'},
    ],
    alertTitle: 'Muhiim',
    alertText: 'Natiijooyinka hormoonka waa in lagu fasiraa dhinac gundhigga caafimaad. Hal qiimo badiyaa keligiis kuma filna in lagu soo gebagebeeyo baaritaanka PCOS.',
    section4Body: 'Ultrasaawn ayaa loo isticmaali karaa indho-indheynta muuqaalka ukun-sidayaasha iyo gaar ahaan raadinta tiro badan oo follicle yaryar ah. Wuxuu sidoo kale u oggolaanayaa xirfadlaha inuu raadiyo arrimo kale oo sharraxi kara astaamo qaar.',
    tip2Title: 'Waxtar leh in la ogaado',
    tip2Text: 'Aragga follicle badan ultrasaawnka macnaheedu maaha si toos ah inaad leedahay PCOS. Natiijada waa in lagu fasiraa dhinac hubinta inta kale.',
    section5Body: 'Helitaanka baaritaan PCOS ma suurtageliyo saadaalinta si sax ah sida wax kuugu socon doonaan. Syndrome-ku wuxuu ku muuqan karaa si aad u kala duwan qof ilaa qof.',
    mythItems: [
      'PCOS macnaheedu maaha si toos ah bacrimin la’aan.',
      'PCOS lagama maarmaan ahan inuu macnaheedu yahay haysashada kiis (cysts).',
      'Baaritaanka keligiis ma go’aamiyo daaweynta.',
      'Ultrasaawn caadi ah lagama maarmaan ahan inuu meel dhigo PCOS.',
    ],
    section6Body: 'Dhowr macluumaad oo hore loo diyaariyey ayaa caawin kara xirfadlaha inuu fahmo taariikhdaada oo uu doorto baaritaannada ugu habboon.',
    appointmentQuestions: [
      'Immisa waqti ayay wareegyadaadu aan joogto ahayn?',
      'Ma ogaatay finan, timo-kor aan caadi ahayn, ama timo-dhac?',
      'Taariikh qoys oo PCOS ama sonkorowga ma jirtaa?',
      'Ma rabtaa inaad uur yeelato muddo gaaban ama dhexdhexaad ah gudaheed?',
    ],
    preparationTitle: 'Talo yar ka hor ballanka',
    preparationText: 'Haddii ay suurtagal tahay, xus taariikhaha caadadaadii ugu dambeysay, dhererka qiyaasta ah ee wareegyadaada, astaamaha aad ogaanayso, iyo daaweyn ama kaabayaal kasta oo aad qaadanayso.',
    summaryTitle: 'Waxa muhiimka ah ee hubinta',
    summaryItems: [
      'Baaritaanku wuxuu ku tiirsan yahay dhowr arrimood, ma aha hal baaritaan.',
      'Baaritaan dhiig ayaa raadin kara dheelitir la’aan hormoon oo qaar iyo meelaynta sababo kale.',
      'Ultrasaawn ayaa dhammaystiri kara hubinta iyadoo ku xiran xaaladda.',
      'Natiijooyinka waa in mar walba fasiraan xirfadle caafimaad.',
    ],
    finalTipTitle: 'Qodobbada muhiimka ah',
    finalTipText: 'Hubinta PCOS maaha hal baaritaan ama xukun kama dambeys ah. Waxay kaa caawisaa inaad fahanto shaqada hormoonkaaga, raadiso sababo kale oo suurtagal ah, oo aad dhisto daryeel ku habboon xaaladdaada.',
    disclaimerText: 'Maqaalkan waa macluumaad oo keliya mana bedelo la-talin caafimaad ama fasiraadda shakhsi ee natiijooyinka baaritaanka.',
    shareMessage: 'Baaritaanka PCOS: baaritaanno iyo hubin — AWA',
  },
  sw: {
    badge: 'PCOS',
    title: 'Utambuzi wa PCOS:\nvipimo na uchunguzi',
    metaDuration: 'Dakika 7 za kusoma',
    metaType: 'Mwongozo',
    metaLevel: 'Wastani',
    metaValidated: 'Maudhui yaliyokaguliwa',
    intro: 'Jinsi PCOS inavyotambuliwa, ni vipimo gani vinaweza kutolewa, na jinsi ya kujiandaa kwa utulivu kwa miadi yako.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Kuelewa uchunguzi wa utambuzi',
      'Hatua kuu za uchunguzi',
      'Kipimo cha damu cha homoni',
      'Ultrasound ya nyonga',
      'Kile ambacho utambuzi hauelezi',
      'Kujiandaa kwa miadi yako',
      'Mambo muhimu ya kukumbuka',
    ],
    section1Body1: 'Utambuzi wa ugonjwa wa ovari zenye vivimbe vingi (PCOS) hautegemei kipimo kimoja. Mtaalamu wa afya huunganisha taarifa kadhaa: historia ya mzunguko wako, dalili zozote, uchunguzi wa kiafya, vipimo vya maabara, na, kulingana na hali, ultrasound.',
    section1Body2: 'Lengo ni kutafuta sifa zinazoendana na PCOS na pia kuondoa sababu nyingine zinazoweza kueleza hedhi zisizo za mpangilio au dalili fulani za homoni.',
    tip1Title: 'Vyema kujua',
    tip1Text: 'Utambuzi daima ni wa kibinafsi. Wanawake wawili wenye PCOS wanaweza kuwa na dalili na matokeo ya vipimo tofauti sana.',
    section2Body: 'Uchunguzi unaweza kufuata hatua kadhaa. Si lazima zote zifanywe kwa njia ile ile kwa kila mtu.',
    diagnosisSteps: [
      {title: 'Kuchukua historia', text: 'Mtaalamu hukusanya historia yako: mizunguko, dalili, historia ya kitabibu, na matibabu.'},
      {title: 'Uchunguzi wa kiafya', text: 'Hutafuta hasa dalili za androjeni nyingi na hutathmini hali yako kwa ujumla.'},
      {title: 'Uchunguzi wa damu', text: 'Vipimo vya homoni na vya kimetaboliki vinaweza kuombwa ili kufafanua hali.'},
      {title: 'Ultrasound', text: 'Inaweza kukamilisha uchunguzi kwa kuchunguza mwonekano wa ovari.'},
    ],
    flowTitle: 'Mchakato kwa muhtasari',
    flowItems: [
      'Historia na dalili',
      'Uchunguzi wa kiafya',
      'Vipimo kulingana na hali',
      'Ultrasound ikihitajika',
    ],
    section3Body1: 'Kipimo cha damu kinaweza kutolewa kutafuta dalili za androjeni nyingi, kutathmini homoni fulani zinazohusika katika utendaji wa uzazi, na kutafuta sababu nyingine zinazowezekana za dalili zako.',
    section3Body2: 'Vipimo vinavyochaguliwa vinategemea umri wako, dalili zako, historia yako ya kitabibu, na kile ambacho mtaalamu anatafuta kukagua.',
    bloodTests: [
      {title: 'Androjeni', text: 'Testosteroni na homoni nyingine kulingana na hali.'},
      {title: 'Utendaji wa tezi ya thairoidi', text: 'Husaidia hasa kuondoa sababu fulani za mizunguko isiyo ya mpangilio.'},
      {title: 'Uchunguzi wa kimetaboliki', text: 'Sukari ya damu, wakati mwingine kipimo cha mafuta mwilini kulingana na vihatarishi.'},
    ],
    alertTitle: 'Muhimu',
    alertText: 'Matokeo ya homoni yanahitaji kufasiriwa pamoja na muktadha wa kiafya. Thamani moja kwa kawaida haitoshi, peke yake, kuhitimisha utambuzi wa PCOS.',
    section4Body: 'Ultrasound inaweza kutumika kuchunguza mwonekano wa ovari na kutafuta hasa idadi kubwa ya folikuli ndogo. Pia inamruhusu mtaalamu kutafuta mambo mengine yanayoweza kueleza dalili fulani.',
    tip2Title: 'Vyema kujua',
    tip2Text: 'Kuona folikuli nyingi kwenye ultrasound haimaanishi moja kwa moja una PCOS. Matokeo yanahitaji kufasiriwa pamoja na sehemu nyingine ya uchunguzi.',
    section5Body: 'Kupokea utambuzi wa PCOS hakuwezeshi kutabiri hasa jinsi mambo yatakavyoendelea kwako. Ugonjwa huu unaweza kujitokeza kwa njia tofauti sana kati ya mtu na mtu.',
    mythItems: [
      'PCOS haimaanishi moja kwa moja ugumba.',
      'PCOS haimaanishi lazima kuwa na vivimbe.',
      'Utambuzi peke yake haubaini matibabu.',
      'Ultrasound ya kawaida haiondoi lazima PCOS.',
    ],
    section6Body: 'Taarifa chache zilizoandaliwa mapema zinaweza kumsaidia mtaalamu kuelewa historia yako na kuchagua vipimo vinavyofaa zaidi.',
    appointmentQuestions: [
      'Mizunguko yako imekuwa si ya mpangilio kwa muda gani?',
      'Je, umeona chunusi, ukuaji usio wa kawaida wa nywele, au kupoteza nywele?',
      'Je, kuna historia ya familia ya PCOS au kisukari?',
      'Je, unataka kupata ujauzito katika muda mfupi au wa kati?',
    ],
    preparationTitle: 'Kidokezo kidogo kabla ya miadi',
    preparationText: 'Ikiwezekana, andika tarehe za hedhi yako ya mwisho, urefu wa kukadiria wa mizunguko yako, dalili unazoziona, na matibabu au virutubisho vyovyote unavyotumia.',
    summaryTitle: 'Mambo ya msingi ya uchunguzi',
    summaryItems: [
      'Utambuzi unategemea mambo kadhaa, si kipimo kimoja.',
      'Kipimo cha damu kinaweza kutafuta kutokuwa na usawa fulani wa homoni na kuondoa sababu nyingine.',
      'Ultrasound inaweza kukamilisha uchunguzi kulingana na hali.',
      'Matokeo yanapaswa daima kufasiriwa na mtaalamu wa afya.',
    ],
    finalTipTitle: 'Mambo muhimu ya kukumbuka',
    finalTipText: 'Uchunguzi wa PCOS si kipimo kimoja wala hukumu ya mwisho. Unakusaidia kuelewa utendaji wa homoni zako, kutafuta sababu nyingine zinazowezekana, na kujenga huduma inayofaa hali yako.',
    disclaimerText: 'Makala hii ni kwa taarifa tu na haichukui nafasi ya mashauriano ya kitabibu au tafsiri iliyobinafsishwa ya matokeo ya vipimo vyako.',
    shareMessage: 'Utambuzi wa PCOS: vipimo na uchunguzi — AWA',
  },
  kk: {
    badge: 'ПКЯС',
    title: 'ПКЯС диагностикасы:\nтесттер және тексеру',
    metaDuration: '7 мин оқу',
    metaType: 'Нұсқаулық',
    metaLevel: 'Орташа',
    metaValidated: 'Тексерілген мазмұн',
    intro: 'ПКЯС қалай анықталады, қандай тесттер ұсынылуы мүмкін және қабылдауға тыныш қалай дайындалу керек.',
    contentsTitle: 'Осы мақалада',
    topics: [
      'Диагностикалық тексеруді түсіну',
      'Тексерудің негізгі қадамдары',
      'Гормондық қан тесті',
      'Жамбас ультрадыбыстық зерттеуі',
      'Диагноз нені айтпайды',
      'Қабылдауға дайындалу',
      'Негізгі қорытындылар',
    ],
    section1Body1: 'Поликистозды аналық без синдромының диагнозы бір ғана тестке негізделмейді. Медицина маманы бірнеше ақпаратты біріктіреді: цикл тарихыңызды, кез келген белгілерді, клиникалық тексеруді, зертханалық тесттерді және жағдайға қарай ультрадыбыстық зерттеуді.',
    section1Body2: 'Мақсат — ПКЯС-қа сәйкес келетін белгілерді іздеу және тұрақсыз етеккірді немесе кейбір гормондық белгілерді түсіндіре алатын басқа себептерді жоққа шығару.',
    tip1Title: 'Білуге тиісті',
    tip1Text: 'Диагноз әрқашан жекелендірілген. ПКЯС бар екі әйелдің белгілері мен тест нәтижелері өте әртүрлі болуы мүмкін.',
    section2Body: 'Тексеру бірнеше қадамнан тұруы мүмкін. Олар барлығы үшін бірдей орындалуы міндетті емес.',
    diagnosisSteps: [
      {title: 'Тарих жинау', text: 'Маман тарихыңызды жинайды: циклдер, белгілер, медициналық тарих және емдеулер.'},
      {title: 'Клиникалық тексеру', text: 'Ол, атап айтқанда, андрогендердің артық болу белгілерін іздейді және жалпы жағдайыңызды бағалайды.'},
      {title: 'Қан тексеру', text: 'Жағдайды нақтылау үшін гормондық және метаболизмдік тесттер сұралуы мүмкін.'},
      {title: 'Ультрадыбыстық зерттеу', text: 'Ол аналық бездердің сыртқы түрін бақылау арқылы тексеруді толықтыра алады.'},
    ],
    flowTitle: 'Процесс бір қарағанда',
    flowItems: [
      'Тарих және белгілер',
      'Клиникалық тексеру',
      'Жағдайға қарай тесттер',
      'Қажет болса, ультрадыбыстық зерттеу',
    ],
    section3Body1: 'Андрогендердің артық болу белгілерін іздеу, репродуктивті қызметке қатысатын кейбір гормондарды бағалау және белгілеріңіздің басқа ықтимал себептерін іздеу үшін қан тесті ұсынылуы мүмкін.',
    section3Body2: 'Таңдалған тесттер жасыңызға, белгілеріңізге, медициналық тарихыңызға және маманның не тексергісі келетініне байланысты.',
    bloodTests: [
      {title: 'Андрогендер', text: 'Жағдайға қарай тестостерон және басқа гормондар.'},
      {title: 'Қалқанша без қызметі', text: 'Әсіресе тұрақсыз циклдердің кейбір себептерін жоққа шығаруға көмектеседі.'},
      {title: 'Метаболизмдік тексеру', text: 'Қан глюкозасы, қауіп факторларына қарай кейде липидтік профиль.'},
    ],
    alertTitle: 'Маңызды',
    alertText: 'Гормондық нәтижелер клиникалық контекстпен бірге түсіндірілуі керек. Бір мән әдетте ПКЯС диагнозын қорытындылау үшін жеткіліксіз.',
    section4Body: 'Ультрадыбыстық зерттеу аналық бездердің сыртқы түрін бақылау және, атап айтқанда, шағын фолликулдардың көптігін іздеу үшін қолданылуы мүмкін. Ол сондай-ақ маманға кейбір белгілерді түсіндіре алатын басқа факторларды іздеуге мүмкіндік береді.',
    tip2Title: 'Білуге тиісті',
    tip2Text: 'Ультрадыбыстық зерттеуде көп фолликулдарды көру сізде ПКЯС бар екенін автоматты түрде білдірмейді. Нәтиже тексерудің қалған бөлігімен бірге түсіндірілуі керек.',
    section5Body: 'ПКЯС диагнозын алу сізге жағдайдың дәл қалай дамитынын болжауға мүмкіндік бермейді. Синдром әр адамда өте әртүрлі көрінуі мүмкін.',
    mythItems: [
      'ПКЯС бедеулікті автоматты түрде білдірмейді.',
      'ПКЯС міндетті түрде кисталардың болуын білдірмейді.',
      'Диагнозтың өзі емдеуді анықтамайды.',
      'Қалыпты ультрадыбыстық зерттеу ПКЯС-ты міндетті түрде жоққа шығармайды.',
    ],
    section6Body: 'Алдын ала дайындалған бірнеше ақпарат маманға тарихыңызды түсінуге және ең қолайлы тесттерді таңдауға көмектесе алады.',
    appointmentQuestions: [
      'Циклдеріңіз қанша уақыттан бері тұрақсыз?',
      'Безеуді, әдеттен тыс түк өсуін немесе шаш түсуін байқадыңыз ба?',
      'Отбасында ПКЯС немесе диабет тарихы бар ма?',
      'Жақын немесе орта мерзімде жүкті болғыңыз келе ме?',
    ],
    preparationTitle: 'Қабылдау алдындағы шағын кеңес',
    preparationText: 'Мүмкін болса, соңғы етеккіріңіздің күндерін, циклдеріңіздің шамамен ұзақтығын, байқап жүрген белгілеріңізді және қабылдап жүрген кез келген емдеулерді немесе қоспаларды жазып қойыңыз.',
    summaryTitle: 'Тексерудің негізгі нәрселері',
    summaryItems: [
      'Диагноз бір ғана тестке емес, бірнеше факторға негізделеді.',
      'Қан тесті кейбір гормондық тепе-теңсіздіктерді іздеп, басқа себептерді жоққа шығара алады.',
      'Ультрадыбыстық зерттеу жағдайға қарай тексеруді толықтыра алады.',
      'Нәтижелерді әрқашан медицина маманы түсіндіруі керек.',
    ],
    finalTipTitle: 'Негізгі қорытындылар',
    finalTipText: 'ПКЯС тексеруі бір ғана тест немесе соңғы үкім емес. Ол гормондық жұмысыңызды түсінуге, басқа ықтимал себептерді іздеуге және жағдайыңызға сай күтімді құруға көмектеседі.',
    disclaimerText: 'Бұл мақала тек ақпарат үшін және медициналық консультацияның немесе тест нәтижелеріңізді жекелендірілген түсіндірудің орнын баспайды.',
    shareMessage: 'ПКЯС диагностикасы: тесттер және тексеру — AWA',
  },
  wo: {
    badge: 'PCOS',
    title: 'Xam PCOS:\ntès ak seetlu',
    metaDuration: '7 simili jàng',
    metaType: 'Ndigal',
    metaLevel: 'Digg-dóomu',
    metaValidated: 'Mbind bu ñu seetlu',
    intro: 'Naka ñuy xam PCOS, ban tès ñuy mën a digal ak naka ngay waajal sa ndaje ak dal.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Xam seetlu bi',
      'Ñaar fuñ yu mag yu seetlu bi',
      'Tèsu deret bu hormon',
      'Ekografi bu suufu ndey',
      'Li xam bi di wax ba tey',
      'Waajal sa ndaje',
      'Li am solo',
    ],
    section1Body1: 'Xam feebaru ovèr yu bari du sukkandiku ci benn tès rekk. Liggéeykatu wér bi dafay dajale ay xibaar yu bari: sa tàmbalig wërsëg, màndarga yi, seetlu yaram, tès yu laboratuwaar te, ci mbir bi, benn ekografi.',
    section1Body2: 'Li ñuy wut mooy seet ay màndarga yu méngoo ak PCOS te mu mën a dàq yeneen sabab yu mën a leeral règle yu jubul walla yenn màndargay hormon.',
    tip1Title: 'Lu baax a xam',
    tip1Text: 'Xam bi dafay nekk saa su ne ci sa mbir. Ñaari jigéen yu am PCOS mën nañu am màndarga ak njeexitalu tès yu wuute lool.',
    section2Body: 'Seetlu bi mën na topp ay ñaar fuñ yu bari. Duñu ñu def yépp saa su ne ni mu bokk ngir ñépp.',
    diagnosisSteps: [
      {title: 'Laaj tàmbali', text: 'Liggéeykat bi dafay dajale sa tàmbali: wërsëg, màndarga, tàmbalig wér ak garab.'},
      {title: 'Seetlu yaram', text: 'Dafay wut lool màndargay androjen bu ëpp te natt sa anam bu mat.'},
      {title: 'Tèsu deret', text: 'Tès yu hormon ak metabolism mën nañu ñu laaj ngir leeral mbir bi.'},
      {title: 'Ekografi', text: 'Mën na mottali seetlu bi ci seetlu anamu ovèr yi.'},
    ],
    flowTitle: 'Yoon bi ci benn xool',
    flowItems: [
      'Tàmbali ak màndarga',
      'Seetlu yaram',
      'Tès yu méngoo mbir bi',
      'Ekografi bu soxlaa',
    ],
    section3Body1: 'Mën nañu la digal benn tèsu deret ngir wut màndargay androjen bu ëpp, natt yenn hormon yu bokk ci jëfu bindeef te wut yeneen sabab yu mën a am ci say màndarga.',
    section3Body2: 'Tès yi ñu tànn dañuy sukkandiku ci sa at, say màndarga, sa tàmbalig wér ak li liggéeykat bi bëgg a seet.',
    bloodTests: [
      {title: 'Androjen', text: 'Testosteron ak yeneen hormon ci mbir bi.'},
      {title: 'Jëfu tiroyd', text: 'Dafay dimbli lool ci dàq yenn sabab yu wërsëg yu jubul.'},
      {title: 'Tès metabolism', text: 'Suukar ci deret, yenn saa bilan lipid ci yeneen ndiggal.'},
    ],
    alertTitle: 'Am solo',
    alertText: 'Njeexitalu hormon war nañu ñu leen tekki ak mbir bu wér. Benn lim rekk du doy ci boppam ngir dogal PCOS.',
    section4Body: 'Ekografi mën na jëfandikoo ngir seetlu anamu ovèr yi te wut lool limu folikil yu ndaw yu bari. Dafay may itam liggéeykat bi mu wut yeneen mbir yu mën a leeral yenn màndarga.',
    tip2Title: 'Lu baax a xam',
    tip2Text: 'Gis folikil yu bari ci ekografi du wone saa su ne ne am nga PCOS. War na ñu tekki njeexital bi ak yeneen pàrt yu seetlu bi.',
    section5Body: 'Jot benn xam bu PCOS du may nga xamni lu leer naka mu di dem ci yaw. Feebar bi mën na feeñ lool ci nit ak nit.',
    mythItems: [
      'PCOS du tekki bindeef amul.',
      'PCOS du tekki am kist.',
      'Xam bi ci boppam du dogal garab bi.',
      'Ekografi bu cosaan du dàq PCOS ci wóor.',
    ],
    section6Body: 'Yenn xibaar yu ñu waajal balaa mën nañu dimbli liggéeykat bi mu xam sa tàmbali te tànn tès yi gëna jëm.',
    appointmentQuestions: [
      'Bu yàgg la say wërsëg di jubul?',
      'Gis nga peppo, kawar bu cosaanul walla kawar di jóg?',
      'Am na benn waa kër bu am PCOS walla diyabet?',
      'Bëgg nga ëmb ci diir bu gàtt walla bu digg-dóomu?',
    ],
    preparationTitle: 'Benn ndigal bu ndaw balaa ndaje bi',
    preparationText: 'Bu mën a am, bind bési sa règle bu mujj, diiru sa wërsëg ci xayma, màndarga yi nga di gis ak garab walla yokk-yokk yi nga di naan.',
    summaryTitle: 'Li am solo ci seetlu bi',
    summaryItems: [
      'Xam bi dafay sukkandiku ci ay mbir yu bari, du benn tès rekk.',
      'Benn tèsu deret mën na wut yenn jubluñ hormon te dàq yeneen sabab.',
      'Ekografi mën na mottali seetlu bi ci mbir bi.',
      'Njeexital yi war na saa su ne benn liggéeykatu wér tekki leen.',
    ],
    finalTipTitle: 'Li am solo',
    finalTipText: 'Seetlu PCOS du benn tès rekk walla benn àtte bu mujj. Dafay dimbli nga xam jëfu sa hormon, wut yeneen sabab yu mën a am te defar benn topp bu méngoo sa mbir.',
    disclaimerText: 'Bind bii ngir xibaar rekk la te du wuutu benn seetlu bu doktoor walla tekki bu sa bopp bu say njeexitalu tès.',
    shareMessage: 'Xam PCOS: tès ak seetlu — AWA',
  },
  ha: {
    badge: 'PCOS',
    title: 'Binciken PCOS:\ngwaje-gwaje da bincike',
    metaDuration: 'karatun minti 7',
    metaType: 'Jagora',
    metaLevel: 'Matsakaici',
    metaValidated: 'Abun da aka duba',
    intro: 'Yadda ake gano PCOS, wadanne gwaje-gwaje ne za a iya ba da shawara, da yadda za a shirya wa ganawarki cikin natsuwa.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Fahimtar binciken gano cuta',
      'Manyan matakan bincike',
      'Gwajin jinin hormone',
      'Ultrasound na ƙugu',
      'Abin da binciken ba ya gaya miki',
      'Shirya wa ganawarki',
      'Muhimman abubuwa',
    ],
    section1Body1: 'Gano ciwon polycystic ovary syndrome ba ya dogara ga gwaji guda ɗaya. Ma’aikacin lafiya yana tattara bayanai da dama: tarihin zagayenki, duk wata alama, binciken asibiti, gwajin dakin gwaji, kuma, bisa yanayin, ultrasound.',
    section1Body2: 'Manufar ita ce duka a nemi alamomin da suka dace da PCOS da kuma a cire wasu dalilai da za su iya bayyana haila mara tsari ko wasu alamomin hormone.',
    tip1Title: 'Abin da ya dace a sani',
    tip1Text: 'Binciken koyaushe na mutum ne. Mata biyu masu PCOS na iya samun alamomi da sakamakon gwaji daban-daban sosai.',
    section2Body: 'Binciken na iya bin matakai da dama. Ba lallai ba ne a gudanar da su duka iri ɗaya ga kowa.',
    diagnosisSteps: [
      {title: 'Tambayar tarihi', text: 'Ƙwararre yana tattara tarihinki: zagaye, alamomi, tarihin lafiya, da magunguna.'},
      {title: 'Binciken asibiti', text: 'Yana neman musamman alamomin yawan androgens kuma yana tantance yanayinki gabaɗaya.'},
      {title: 'Binciken jini', text: 'Ana iya neman gwajin hormone da metabolism don fayyace yanayin.'},
      {title: 'Ultrasound', text: 'Zai iya cika binciken ta hanyar lura da yanayin ovaries.'},
    ],
    flowTitle: 'Tsarin a kallo ɗaya',
    flowItems: [
      'Tarihi da alamomi',
      'Binciken asibiti',
      'Gwaje-gwaje bisa yanayin',
      'Ultrasound idan ya zama dole',
    ],
    section3Body1: 'Ana iya ba da shawarar gwajin jini don neman alamomin yawan androgens, tantance wasu hormone da ke da hannu a aikin haihuwa, da neman wasu yiwuwar dalilan alamominki.',
    section3Body2: 'Gwaje-gwajen da ake zaɓa suna dogara ga shekarunki, alamominki, tarihin lafiyarki, da abin da ƙwararre yake so ya bincika.',
    bloodTests: [
      {title: 'Androgens', text: 'Testosterone da sauran hormone bisa yanayin.'},
      {title: 'Aikin thyroid', text: 'Yana taimakawa musamman wajen cire wasu dalilan zagaye marasa tsari.'},
      {title: 'Binciken metabolism', text: 'Sukarin jini, wani lokaci jerin kitse bisa abubuwan haɗari.'},
    ],
    alertTitle: 'Muhimmi',
    alertText: 'Sakamakon hormone yana bukatar fassara tare da yanayin asibiti. Daraja ɗaya yawanci ba ta isa ita kaɗai ba don kammala gano PCOS.',
    section4Body: 'Ana iya amfani da ultrasound don lura da yanayin ovaries da neman musamman yawan ƙananan follicles. Hakanan yana ba ƙwararre damar neman wasu abubuwa da za su iya bayyana wasu alamomi.',
    tip2Title: 'Abin da ya dace a sani',
    tip2Text: 'Ganin follicles da yawa a ultrasound ba ya nufin kai tsaye cewa kina da PCOS. Ana bukatar fassara sakamakon tare da sauran binciken.',
    section5Body: 'Samun gano PCOS ba ya ba da damar hasashen daidai yadda abubuwa za su ci gaba a gare ki. Wannan ciwon na iya bayyana daban sosai daga mutum zuwa mutum.',
    mythItems: [
      'PCOS ba ya nufin rashin haihuwa kai tsaye.',
      'PCOS ba lallai ba ne yana nufin samun cysts.',
      'Binciken kaɗai ba ya tantance magani.',
      'Ultrasound na al’ada ba lallai ba ne ya cire PCOS.',
    ],
    section6Body: 'Wasu bayanai da aka shirya tun da farko na iya taimaka wa ƙwararre ya fahimci tarihinki kuma ya zaɓi gwaje-gwajen da suka fi dacewa.',
    appointmentQuestions: [
      'Tun yaushe zagayenki ba su da tsari?',
      'Shin kin lura da kuraje, girman gashi ba na al’ada ba, ko zubewar gashi?',
      'Akwai tarihin PCOS ko ciwon sukari a iyali?',
      'Kina son samun ciki nan kusa ko nan gaba matsakaici?',
    ],
    preparationTitle: 'Ƙaramar shawara kafin ganawa',
    preparationText: 'Idan zai yiwu, rubuta ranakun hailarki ta ƙarshe, kusan tsawon zagayenki, alamomin da kike lura da su, da duk wani magani ko kari da kike sha.',
    summaryTitle: 'Muhimman abubuwan binciken',
    summaryItems: [
      'Binciken yana dogara ga abubuwa da dama, ba gwaji guda ɗaya ba.',
      'Gwajin jini na iya neman wasu rashin daidaiton hormone da cire wasu dalilai.',
      'Ultrasound na iya cika binciken bisa yanayin.',
      'Ya kamata ma’aikacin lafiya ya fassara sakamako koyaushe.',
    ],
    finalTipTitle: 'Muhimman abubuwa',
    finalTipText: 'Binciken PCOS ba gwaji ɗaya ba ne ko hukunci na ƙarshe. Yana taimaka miki ki fahimci aikin hormone ɗinki, ki nemi wasu yiwuwar dalilai, kuma ki gina kulawa da ta dace da yanayinki.',
    disclaimerText: 'Wannan labari don bayani ne kawai kuma ba ya maye gurbin shawarar likita ko fassarar sakamakon gwajinki ta keɓaɓɓiya.',
    shareMessage: 'Binciken PCOS: gwaje-gwaje da bincike — AWA',
  },
  am: {
    badge: 'ፒሲኦኤስ',
    title: 'የፒሲኦኤስ ምርመራ፦\nፈተናዎች እና ግምገማ',
    metaDuration: '7 ደቂቃ ንባብ',
    metaType: 'መመሪያ',
    metaLevel: 'መካከለኛ',
    metaValidated: 'የተገመገመ ይዘት',
    intro: 'ፒሲኦኤስ እንዴት እንደሚመረመር፣ ምን ፈተናዎች ሊቀርቡ እንደሚችሉ እና ለቀጠሮሽ በእርጋታ እንዴት መዘጋጀት እንደምትችዪ።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'የምርመራ ግምገማውን መረዳት',
      'የግምገማው ዋና ደረጃዎች',
      'የሆርሞን የደም ምርመራ',
      'የዳሌ አልትራሳውንድ',
      'ምርመራው የማይነግርሽ ነገር',
      'ለቀጠሮሽ መዘጋጀት',
      'ዋና ዋና ነጥቦች',
    ],
    section1Body1: 'የፖሊሲስቲክ ኦቫሪ ሲንድሮም ምርመራ በአንድ ፈተና ላይ አይመሠረትም። የጤና ባለሙያው በርካታ መረጃዎችን ያሰባስባል፦ የዑደት ታሪክሽን፣ ምልክቶችን፣ የአካል ምርመራን፣ የላብራቶሪ ፈተናዎችን እና እንደ ሁኔታው አልትራሳውንድን።',
    section1Body2: 'ዓላማው ከፒሲኦኤስ ጋር የሚጣጣሙ ገጽታዎችን መፈለግ እና መደበኛ ያልሆነ የወር አበባን ወይም አንዳንድ የሆርሞን ምልክቶችን ሊያስረዱ የሚችሉ ሌሎች መንስኤዎችን ማስወገድ ነው።',
    tip1Title: 'ማወቅ ጠቃሚ ነው',
    tip1Text: 'ምርመራው ሁልጊዜ ለግለሰብ የተስተካከለ ነው። ፒሲኦኤስ ያላቸው ሁለት ሴቶች በጣም የተለያዩ ምልክቶችና የፈተና ውጤቶች ሊኖራቸው ይችላል።',
    section2Body: 'ግምገማው በርካታ ደረጃዎችን ሊከተል ይችላል። ለሁሉም በተመሳሳይ መንገድ የግድ አይከናወኑም።',
    diagnosisSteps: [
      {title: 'ታሪክ መውሰድ', text: 'ባለሙያው ታሪክሽን ይሰበስባል፦ ዑደቶች፣ ምልክቶች፣ የሕክምና ዳራ እና ሕክምናዎች።'},
      {title: 'የአካል ምርመራ', text: 'በተለይ የከፍተኛ አንድሮጅን ምልክቶችን ይፈልጋል እና አጠቃላይ ሁኔታሽን ይገመግማል።'},
      {title: 'የደም ምርመራ', text: 'ሁኔታውን ለማብራራት የሆርሞንና የሜታቦሊክ ፈተናዎች ሊጠየቁ ይችላሉ።'},
      {title: 'አልትራሳውንድ', text: 'የኦቫሪዎችን መልክ በመታዘብ ግምገማውን ሊያሟላ ይችላል።'},
    ],
    flowTitle: 'ሂደቱ በአጭሩ',
    flowItems: [
      'ታሪክ እና ምልክቶች',
      'የአካል ምርመራ',
      'እንደ ሁኔታው ፈተናዎች',
      'አስፈላጊ ከሆነ አልትራሳውንድ',
    ],
    section3Body1: 'የከፍተኛ አንድሮጅን ምልክቶችን ለመፈለግ፣ በመራቢያ ተግባር ውስጥ የሚሳተፉ አንዳንድ ሆርሞኖችን ለመገምገም እና ለምልክቶችሽ ሌሎች ሊሆኑ የሚችሉ መንስኤዎችን ለመፈለግ የደም ምርመራ ሊቀርብ ይችላል።',
    section3Body2: 'የሚመረጡት ፈተናዎች በዕድሜሽ፣ በምልክቶችሽ፣ በሕክምና ታሪክሽ እና ባለሙያው ሊያረጋግጥ በሚፈልገው ላይ ይወሰናሉ።',
    bloodTests: [
      {title: 'አንድሮጅኖች', text: 'ቴስቶስትሮን እና እንደ ሁኔታው ሌሎች ሆርሞኖች።'},
      {title: 'የታይሮይድ ተግባር', text: 'በተለይ መደበኛ ያልሆኑ ዑደቶችን አንዳንድ መንስኤዎች ለማስወገድ ይረዳል።'},
      {title: 'የሜታቦሊክ ግምገማ', text: 'የደም ስኳር፣ እንደ አደጋ ምክንያቶች አንዳንድ ጊዜ የስብ ምርመራ።'},
    ],
    alertTitle: 'አስፈላጊ',
    alertText: 'የሆርሞን ውጤቶች ከክሊኒካዊ አውድ ጋር ተዳምረው መተርጎም አለባቸው። አንድ ዋጋ ብቻውን ብዙውን ጊዜ የፒሲኦኤስ ምርመራን ለመደምደም በቂ አይደለም።',
    section4Body: 'አልትራሳውንድ የኦቫሪዎችን መልክ ለመታዘብ እና በተለይ ብዙ ትናንሽ ፎሊክሎችን ለመፈለግ ሊያገለግል ይችላል። ባለሙያው አንዳንድ ምልክቶችን ሊያስረዱ የሚችሉ ሌሎች ነገሮችን እንዲፈልግም ያስችለዋል።',
    tip2Title: 'ማወቅ ጠቃሚ ነው',
    tip2Text: 'በአልትራሳውንድ ብዙ ፎሊክሎችን ማየት በራሱ ፒሲኦኤስ አለብሽ ማለት አይደለም። ውጤቱ ከቀሪው ግምገማ ጋር ተዳምሮ መተርጎም አለበት።',
    section5Body: 'የፒሲኦኤስ ምርመራ ማግኘት ለአንቺ ነገሮች እንዴት እንደሚሄዱ በትክክል ለመገመት አያስችልም። ሲንድሮሙ ከሰው ወደ ሰው በጣም በተለየ መንገድ ሊታይ ይችላል።',
    mythItems: [
      'ፒሲኦኤስ በራሱ መሃንነት ማለት አይደለም።',
      'ፒሲኦኤስ የግድ የሲስት መኖር ማለት አይደለም።',
      'ምርመራው ብቻውን ሕክምናውን አይወስንም።',
      'መደበኛ አልትራሳውንድ ፒሲኦኤስን የግድ አያስወግድም።',
    ],
    section6Body: 'አስቀድመው የተዘጋጁ ጥቂት መረጃዎች ባለሙያው ታሪክሽን እንዲረዳ እና በጣም ተገቢ የሆኑትን ፈተናዎች እንዲመርጥ ሊረዱት ይችላሉ።',
    appointmentQuestions: [
      'ዑደቶችሽ ለምን ያህል ጊዜ መደበኛ ያልሆኑ ሆነዋል?',
      'ብጉር፣ ያልተለመደ የፀጉር እድገት ወይም የፀጉር መርገፍ አስተውለሻል?',
      'የፒሲኦኤስ ወይም የስኳር በሽታ የቤተሰብ ታሪክ አለ?',
      'በአጭር ወይም በመካከለኛ ጊዜ ለማርገዝ ትፈልጊያለሽ?',
    ],
    preparationTitle: 'ከቀጠሮው በፊት ትንሽ ጠቃሚ ምክር',
    preparationText: 'ከተቻለ የመጨረሻ የወር አበባሽን ቀናት፣ የዑደቶችሽን ግምታዊ ርዝመት፣ የምታስተውያቸውን ምልክቶች እና የምትወስጃቸውን ማንኛውንም ሕክምናዎች ወይም ተጨማሪዎች ጻፊ።',
    summaryTitle: 'የግምገማው አስፈላጊ ነጥቦች',
    summaryItems: [
      'ምርመራው በአንድ ፈተና ሳይሆን በበርካታ ነገሮች ላይ ይመሠረታል።',
      'የደም ምርመራ አንዳንድ የሆርሞን አለመመጣጠኖችን ሊፈልግና ሌሎች መንስኤዎችን ሊያስወግድ ይችላል።',
      'አልትራሳውንድ እንደ ሁኔታው ግምገማውን ሊያሟላ ይችላል።',
      'ውጤቶች ሁልጊዜ በጤና ባለሙያ ሊተረጎሙ ይገባል።',
    ],
    finalTipTitle: 'ዋና ዋና ነጥቦች',
    finalTipText: 'የፒሲኦኤስ ግምገማ አንድ ፈተና ወይም የመጨረሻ ፍርድ አይደለም። የሆርሞን አሠራርሽን እንድትረጂ፣ ሌሎች ሊሆኑ የሚችሉ መንስኤዎችን እንድትፈልጊ እና ለሁኔታሽ የሚስማማ እንክብካቤ እንድትገነቢ ይረዳል።',
    disclaimerText: 'ይህ ጽሑፍ ለመረጃ ብቻ ነው እና የሕክምና ምክክርን ወይም የፈተና ውጤቶችሽን ግላዊ ትርጓሜ አይተካም።',
    shareMessage: 'የፒሲኦኤስ ምርመራ፦ ፈተናዎች እና ግምገማ — AWA',
  },
  nl: {
    badge: 'PCOS',
    title: 'PCOS-diagnose:\nonderzoeken en tests',
    metaDuration: '7 min lezen',
    metaType: 'Gids',
    metaLevel: 'Gevorderd',
    metaValidated: 'Gecontroleerde inhoud',
    intro: 'Hoe PCOS wordt vastgesteld, welke onderzoeken kunnen worden voorgesteld en hoe je je rustig op je afspraak voorbereidt.',
    contentsTitle: 'In dit artikel',
    topics: [
      'Het diagnostische onderzoek begrijpen',
      'De belangrijkste stappen van het onderzoek',
      'Het hormonale bloedonderzoek',
      'De bekkenecho',
      'Wat de diagnose je niet vertelt',
      'Je voorbereiden op je afspraak',
      'Belangrijkste punten',
    ],
    section1Body1: 'De diagnose van het polycysteus ovarium syndroom berust niet op één enkele test. De zorgverlener brengt verschillende gegevens samen: je cyclusgeschiedenis, eventuele symptomen, het lichamelijk onderzoek, laboratoriumtests en, afhankelijk van de situatie, een echo.',
    section1Body2: 'Het doel is zowel kenmerken te zoeken die met PCOS overeenkomen als andere oorzaken uit te sluiten die onregelmatige menstruaties of bepaalde hormonale symptomen zouden kunnen verklaren.',
    tip1Title: 'Goed om te weten',
    tip1Text: 'De diagnose is altijd gepersonaliseerd. Twee vrouwen met PCOS kunnen zeer verschillende symptomen en testresultaten hebben.',
    section2Body: 'Het onderzoek kan verschillende stappen volgen. Ze worden niet per se voor iedereen op dezelfde manier uitgevoerd.',
    diagnosisSteps: [
      {title: 'Anamnese', text: 'De professional verzamelt je voorgeschiedenis: cycli, symptomen, medische achtergrond en behandelingen.'},
      {title: 'Lichamelijk onderzoek', text: 'Hij of zij zoekt met name naar tekenen van een teveel aan androgenen en beoordeelt je algehele toestand.'},
      {title: 'Bloedonderzoek', text: 'Hormonale en metabole tests kunnen worden aangevraagd om de situatie te verduidelijken.'},
      {title: 'Echo', text: 'Ze kan het onderzoek aanvullen door het uiterlijk van de eierstokken te observeren.'},
    ],
    flowTitle: 'Het proces in één oogopslag',
    flowItems: [
      'Voorgeschiedenis en symptomen',
      'Lichamelijk onderzoek',
      'Tests afhankelijk van de situatie',
      'Echo indien nodig',
    ],
    section3Body1: 'Er kan een bloedonderzoek worden voorgesteld om tekenen van een teveel aan androgenen op te sporen, bepaalde hormonen te beoordelen die betrokken zijn bij de voortplanting en andere mogelijke oorzaken van je symptomen te zoeken.',
    section3Body2: 'De gekozen tests hangen af van je leeftijd, je symptomen, je medische voorgeschiedenis en wat de professional wil controleren.',
    bloodTests: [
      {title: 'Androgenen', text: 'Testosteron en andere hormonen afhankelijk van de situatie.'},
      {title: 'Schildklierfunctie', text: 'Helpt met name bepaalde oorzaken van onregelmatige cycli uit te sluiten.'},
      {title: 'Metabool onderzoek', text: 'Bloedglucose, soms een vetprofiel afhankelijk van risicofactoren.'},
    ],
    alertTitle: 'Belangrijk',
    alertText: 'Hormonale resultaten moeten worden geïnterpreteerd samen met de klinische context. Eén enkele waarde is meestal niet voldoende om op zichzelf een PCOS-diagnose te stellen.',
    section4Body: 'Een echo kan worden gebruikt om het uiterlijk van de eierstokken te observeren en met name te zoeken naar een groot aantal kleine follikels. Ze stelt de professional ook in staat andere factoren te zoeken die bepaalde symptomen kunnen verklaren.',
    tip2Title: 'Goed om te weten',
    tip2Text: 'Veel follikels zien op een echo betekent niet automatisch dat je PCOS hebt. Het resultaat moet samen met de rest van het onderzoek worden geïnterpreteerd.',
    section5Body: 'Een PCOS-diagnose krijgen maakt het niet mogelijk precies te voorspellen hoe het voor jou zal verlopen. Het syndroom kan van persoon tot persoon zeer verschillend zijn.',
    mythItems: [
      'PCOS betekent niet automatisch onvruchtbaarheid.',
      'PCOS betekent niet per se cysten hebben.',
      'De diagnose alleen bepaalt de behandeling niet.',
      'Een normale echo sluit PCOS niet per se uit.',
    ],
    section6Body: 'Enkele vooraf voorbereide gegevens kunnen de professional helpen je voorgeschiedenis te begrijpen en de meest relevante tests te kiezen.',
    appointmentQuestions: [
      'Hoelang zijn je cycli al onregelmatig?',
      'Heb je acne, ongewone haargroei of haarverlies opgemerkt?',
      'Is er PCOS of diabetes in de familie?',
      'Wil je op korte of middellange termijn zwanger worden?',
    ],
    preparationTitle: 'Een kleine tip vóór de afspraak',
    preparationText: 'Noteer indien mogelijk de data van je laatste menstruatie, de ongeveer duur van je cycli, de symptomen die je opmerkt en eventuele behandelingen of supplementen die je gebruikt.',
    summaryTitle: 'De essentie van het onderzoek',
    summaryItems: [
      'De diagnose berust op meerdere factoren, niet op één enkele test.',
      'Een bloedonderzoek kan bepaalde hormonale verstoringen opsporen en andere oorzaken uitsluiten.',
      'Een echo kan het onderzoek aanvullen, afhankelijk van de situatie.',
      'Resultaten moeten altijd door een zorgverlener worden geïnterpreteerd.',
    ],
    finalTipTitle: 'Belangrijkste punten',
    finalTipText: 'Een PCOS-onderzoek is geen enkele test of een definitief oordeel. Het helpt je je hormonale functioneren te begrijpen, andere mogelijke oorzaken te zoeken en zorg op te bouwen die bij je situatie past.',
    disclaimerText: 'Dit artikel is alleen ter informatie en vervangt geen medisch consult of de persoonlijke interpretatie van je testresultaten.',
    shareMessage: 'PCOS-diagnose: onderzoeken en tests — AWA',
  },
  fi: {
    badge: 'PCOS',
    title: 'PCOS:n diagnosointi:\ntutkimukset ja selvitys',
    metaDuration: '7 min lukuaika',
    metaType: 'Opas',
    metaLevel: 'Keskitaso',
    metaValidated: 'Tarkistettu sisältö',
    intro: 'Miten PCOS diagnosoidaan, mitä tutkimuksia voidaan tarjota ja miten valmistaudut vastaanotolle rauhallisesti.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Diagnostisen selvityksen ymmärtäminen',
      'Selvityksen päävaiheet',
      'Hormonaalinen verikoe',
      'Lantion ultraääni',
      'Mitä diagnoosi ei kerro',
      'Vastaanottoon valmistautuminen',
      'Tärkeimmät asiat',
    ],
    section1Body1: 'Monirakkulaisen munasarjaoireyhtymän diagnoosi ei perustu yhteen testiin. Terveydenhuollon ammattilainen kokoaa yhteen useita tietoja: kiertohistoriasi, mahdolliset oireet, kliinisen tutkimuksen, laboratoriotutkimukset ja tilanteesta riippuen ultraäänen.',
    section1Body2: 'Tavoitteena on sekä etsiä PCOS:ään sopivia piirteitä että sulkea pois muita syitä, jotka voisivat selittää epäsäännölliset kuukautiset tai tietyt hormonaaliset oireet.',
    tip1Title: 'Hyvä tietää',
    tip1Text: 'Diagnoosi on aina henkilökohtainen. Kahdella PCOS:ää sairastavalla naisella voi olla hyvin erilaiset oireet ja tutkimustulokset.',
    section2Body: 'Selvitys voi edetä useissa vaiheissa. Niitä ei välttämättä suoriteta samalla tavalla kaikille.',
    diagnosisSteps: [
      {title: 'Esitietojen kerääminen', text: 'Ammattilainen kerää esitietosi: kierrot, oireet, sairaushistoria ja hoidot.'},
      {title: 'Kliininen tutkimus', text: 'Hän etsii erityisesti merkkejä liiallisesta androgeenien määrästä ja arvioi yleistilasi.'},
      {title: 'Verikokeet', text: 'Hormonaalisia ja aineenvaihdunnallisia testejä voidaan pyytää tilanteen selventämiseksi.'},
      {title: 'Ultraääni', text: 'Se voi täydentää selvitystä havainnoimalla munasarjojen ulkonäköä.'},
    ],
    flowTitle: 'Prosessi yhdellä silmäyksellä',
    flowItems: [
      'Esitiedot ja oireet',
      'Kliininen tutkimus',
      'Tutkimukset tilanteen mukaan',
      'Tarvittaessa ultraääni',
    ],
    section3Body1: 'Verikoe voidaan tarjota liiallisen androgeenien määrän merkkien etsimiseen, lisääntymistoimintaan osallistuvien tiettyjen hormonien arviointiin ja oireidesi muiden mahdollisten syiden selvittämiseen.',
    section3Body2: 'Valitut tutkimukset riippuvat iästäsi, oireistasi, sairaushistoriastasi ja siitä, mitä ammattilainen haluaa tarkistaa.',
    bloodTests: [
      {title: 'Androgeenit', text: 'Testosteroni ja muut hormonit tilanteen mukaan.'},
      {title: 'Kilpirauhasen toiminta', text: 'Auttaa erityisesti sulkemaan pois tiettyjä epäsäännöllisten kiertojen syitä.'},
      {title: 'Aineenvaihduntaselvitys', text: 'Verensokeri, joskus rasva-arvot riskitekijöiden mukaan.'},
    ],
    alertTitle: 'Tärkeää',
    alertText: 'Hormonitulokset on tulkittava kliinisen kontekstin rinnalla. Yksittäinen arvo ei yleensä yksinään riitä PCOS-diagnoosin päättelyyn.',
    section4Body: 'Ultraäänellä voidaan havainnoida munasarjojen ulkonäköä ja etsiä erityisesti suurta määrää pieniä follikkeleita. Sen avulla ammattilainen voi myös etsiä muita tekijöitä, jotka voisivat selittää tiettyjä oireita.',
    tip2Title: 'Hyvä tietää',
    tip2Text: 'Monien follikkelien näkyminen ultraäänessä ei automaattisesti tarkoita, että sinulla on PCOS. Tulos on tulkittava muun selvityksen rinnalla.',
    section5Body: 'PCOS-diagnoosin saaminen ei mahdollista tarkasti ennustaa, miten asiat sinun kohdallasi etenevät. Oireyhtymä voi ilmetä hyvin eri tavoin ihmisestä toiseen.',
    mythItems: [
      'PCOS ei automaattisesti tarkoita hedelmättömyyttä.',
      'PCOS ei välttämättä tarkoita kystien omaamista.',
      'Pelkkä diagnoosi ei määritä hoitoa.',
      'Normaali ultraääni ei välttämättä sulje pois PCOS:ää.',
    ],
    section6Body: 'Muutama etukäteen valmisteltu tieto voi auttaa ammattilaista ymmärtämään historiasi ja valitsemaan tarkoituksenmukaisimmat tutkimukset.',
    appointmentQuestions: [
      'Kuinka kauan kiertosi ovat olleet epäsäännöllisiä?',
      'Oletko huomannut aknea, epätavallista karvankasvua tai hiustenlähtöä?',
      'Onko suvussa PCOS:ää tai diabetesta?',
      'Haluatko tulla raskaaksi lyhyellä tai keskipitkällä aikavälillä?',
    ],
    preparationTitle: 'Pieni vinkki ennen vastaanottoa',
    preparationText: 'Jos mahdollista, kirjaa viimeisten kuukautistesi päivämäärät, kiertojesi likimääräinen pituus, huomaamasi oireet sekä käyttämäsi hoidot tai ravintolisät.',
    summaryTitle: 'Selvityksen olennaiset asiat',
    summaryItems: [
      'Diagnoosi perustuu useisiin tekijöihin, ei yhteen testiin.',
      'Verikoe voi etsiä tiettyjä hormonaalisia epätasapainoja ja sulkea pois muita syitä.',
      'Ultraääni voi täydentää selvitystä tilanteen mukaan.',
      'Terveydenhuollon ammattilaisen on aina tulkittava tulokset.',
    ],
    finalTipTitle: 'Tärkeimmät asiat',
    finalTipText: 'PCOS-selvitys ei ole yksittäinen testi eikä lopullinen tuomio. Se auttaa ymmärtämään hormonaalista toimintaasi, etsimään muita mahdollisia syitä ja rakentamaan tilanteeseesi sopivaa hoitoa.',
    disclaimerText: 'Tämä artikkeli on tarkoitettu vain tiedoksi eikä korvaa lääkärin vastaanottoa tai tutkimustulostesi henkilökohtaista tulkintaa.',
    shareMessage: 'PCOS:n diagnosointi: tutkimukset ja selvitys — AWA',
  },
  el: {
    badge: 'PCOS',
    title: 'Διάγνωση του PCOS:\nεξετάσεις και έλεγχος',
    metaDuration: '7 λεπτά ανάγνωσης',
    metaType: 'Οδηγός',
    metaLevel: 'Μεσαίο',
    metaValidated: 'Ελεγμένο περιεχόμενο',
    intro: 'Πώς διαγιγνώσκεται το PCOS, ποιες εξετάσεις μπορεί να προταθούν και πώς να προετοιμαστείς με ηρεμία για το ραντεβού σου.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Κατανοώντας τον διαγνωστικό έλεγχο',
      'Τα κύρια βήματα του ελέγχου',
      'Η ορμονική εξέταση αίματος',
      'Το υπερηχογράφημα πυέλου',
      'Τι δεν σου λέει η διάγνωση',
      'Προετοιμασία για το ραντεβού σου',
      'Βασικά συμπεράσματα',
    ],
    section1Body1: 'Η διάγνωση του συνδρόμου πολυκυστικών ωοθηκών δεν βασίζεται σε μία μόνο εξέταση. Ο επαγγελματίας υγείας συνδυάζει αρκετές πληροφορίες: το ιστορικό του κύκλου σου, τυχόν συμπτώματα, την κλινική εξέταση, τις εργαστηριακές εξετάσεις και, ανάλογα με την περίπτωση, ένα υπερηχογράφημα.',
    section1Body2: 'Στόχος είναι τόσο να αναζητηθούν χαρακτηριστικά συμβατά με PCOS όσο και να αποκλειστούν άλλες αιτίες που θα μπορούσαν να εξηγήσουν τις ακανόνιστες περιόδους ή ορισμένα ορμονικά συμπτώματα.',
    tip1Title: 'Καλό είναι να γνωρίζεις',
    tip1Text: 'Η διάγνωση είναι πάντα εξατομικευμένη. Δύο γυναίκες με PCOS μπορεί να έχουν πολύ διαφορετικά συμπτώματα και αποτελέσματα εξετάσεων.',
    section2Body: 'Ο έλεγχος μπορεί να ακολουθήσει διάφορα βήματα. Δεν πραγματοποιούνται αναγκαστικά όλα με τον ίδιο τρόπο για όλες.',
    diagnosisSteps: [
      {title: 'Λήψη ιστορικού', text: 'Ο επαγγελματίας συγκεντρώνει το ιστορικό σου: κύκλους, συμπτώματα, ιατρικό παρελθόν και θεραπείες.'},
      {title: 'Κλινική εξέταση', text: 'Αναζητά ιδίως σημάδια περίσσειας ανδρογόνων και αξιολογεί τη γενική σου κατάσταση.'},
      {title: 'Εξετάσεις αίματος', text: 'Μπορεί να ζητηθούν ορμονικές και μεταβολικές εξετάσεις για να διευκρινιστεί η κατάσταση.'},
      {title: 'Υπερηχογράφημα', text: 'Μπορεί να συμπληρώσει τον έλεγχο παρατηρώντας την εμφάνιση των ωοθηκών.'},
    ],
    flowTitle: 'Η διαδικασία με μια ματιά',
    flowItems: [
      'Ιστορικό και συμπτώματα',
      'Κλινική εξέταση',
      'Εξετάσεις ανάλογα με την περίπτωση',
      'Υπερηχογράφημα αν χρειάζεται',
    ],
    section3Body1: 'Μπορεί να προταθεί μια εξέταση αίματος για να αναζητηθούν σημάδια περίσσειας ανδρογόνων, να αξιολογηθούν ορισμένες ορμόνες που εμπλέκονται στην αναπαραγωγική λειτουργία και να αναζητηθούν άλλες πιθανές αιτίες των συμπτωμάτων σου.',
    section3Body2: 'Οι εξετάσεις που επιλέγονται εξαρτώνται από την ηλικία σου, τα συμπτώματά σου, το ιατρικό σου ιστορικό και τι επιδιώκει να ελέγξει ο επαγγελματίας.',
    bloodTests: [
      {title: 'Ανδρογόνα', text: 'Τεστοστερόνη και άλλες ορμόνες ανάλογα με την περίπτωση.'},
      {title: 'Θυρεοειδική λειτουργία', text: 'Βοηθά ιδίως να αποκλειστούν ορισμένες αιτίες ακανόνιστων κύκλων.'},
      {title: 'Μεταβολικός έλεγχος', text: 'Γλυκόζη αίματος, μερικές φορές λιπιδαιμικό προφίλ ανάλογα με τους παράγοντες κινδύνου.'},
    ],
    alertTitle: 'Σημαντικό',
    alertText: 'Τα ορμονικά αποτελέσματα πρέπει να ερμηνεύονται μαζί με το κλινικό πλαίσιο. Μία μόνο τιμή συνήθως δεν αρκεί, από μόνη της, για να οδηγήσει σε διάγνωση PCOS.',
    section4Body: 'Ένα υπερηχογράφημα μπορεί να χρησιμοποιηθεί για να παρατηρηθεί η εμφάνιση των ωοθηκών και να αναζητηθεί ιδίως ένας μεγάλος αριθμός μικρών ωοθυλακίων. Επιτρέπει επίσης στον επαγγελματία να αναζητήσει άλλους παράγοντες που θα μπορούσαν να εξηγήσουν ορισμένα συμπτώματα.',
    tip2Title: 'Καλό είναι να γνωρίζεις',
    tip2Text: 'Το να βλέπεις πολλά ωοθυλάκια στο υπερηχογράφημα δεν σημαίνει αυτόματα ότι έχεις PCOS. Το αποτέλεσμα πρέπει να ερμηνεύεται μαζί με τον υπόλοιπο έλεγχο.',
    section5Body: 'Το να λάβεις μια διάγνωση PCOS δεν επιτρέπει να προβλεφθεί ακριβώς πώς θα εξελιχθούν τα πράγματα για σένα. Το σύνδρομο μπορεί να εκδηλώνεται πολύ διαφορετικά από γυναίκα σε γυναίκα.',
    mythItems: [
      'Το PCOS δεν σημαίνει αυτόματα υπογονιμότητα.',
      'Το PCOS δεν σημαίνει αναγκαστικά ότι έχεις κύστεις.',
      'Η διάγνωση από μόνη της δεν καθορίζει τη θεραπεία.',
      'Ένα φυσιολογικό υπερηχογράφημα δεν αποκλείει αναγκαστικά το PCOS.',
    ],
    section6Body: 'Μερικές πληροφορίες που προετοιμάζονται εκ των προτέρων μπορούν να βοηθήσουν τον επαγγελματία να κατανοήσει το ιστορικό σου και να επιλέξει τις πιο σχετικές εξετάσεις.',
    appointmentQuestions: [
      'Πόσο καιρό είναι ακανόνιστοι οι κύκλοι σου;',
      'Έχεις παρατηρήσει ακμή, ασυνήθιστη τριχοφυΐα ή τριχόπτωση;',
      'Υπάρχει οικογενειακό ιστορικό PCOS ή διαβήτη;',
      'Θέλεις να μείνεις έγκυος σε βραχυπρόθεσμο ή μεσοπρόθεσμο ορίζοντα;',
    ],
    preparationTitle: 'Μια μικρή συμβουλή πριν το ραντεβού',
    preparationText: 'Αν είναι δυνατό, σημείωσε τις ημερομηνίες της τελευταίας περιόδου σου, την κατά προσέγγιση διάρκεια των κύκλων σου, τα συμπτώματα που παρατηρείς και τυχόν θεραπείες ή συμπληρώματα που παίρνεις.',
    summaryTitle: 'Τα βασικά του ελέγχου',
    summaryItems: [
      'Η διάγνωση βασίζεται σε αρκετούς παράγοντες, όχι σε μία μόνο εξέταση.',
      'Μια εξέταση αίματος μπορεί να αναζητήσει ορισμένες ορμονικές ανισορροπίες και να αποκλείσει άλλες αιτίες.',
      'Ένα υπερηχογράφημα μπορεί να συμπληρώσει τον έλεγχο ανάλογα με την περίπτωση.',
      'Τα αποτελέσματα πρέπει πάντα να ερμηνεύονται από έναν επαγγελματία υγείας.',
    ],
    finalTipTitle: 'Βασικά συμπεράσματα',
    finalTipText: 'Ο έλεγχος για PCOS δεν είναι μία μόνο εξέταση ούτε μια τελική ετυμηγορία. Σε βοηθά να κατανοήσεις την ορμονική σου λειτουργία, να αναζητήσεις άλλες πιθανές αιτίες και να χτίσεις μια φροντίδα προσαρμοσμένη στην κατάστασή σου.',
    disclaimerText: 'Αυτό το άρθρο είναι μόνο ενημερωτικό και δεν αντικαθιστά μια ιατρική επίσκεψη ή την εξατομικευμένη ερμηνεία των αποτελεσμάτων των εξετάσεών σου.',
    shareMessage: 'Διάγνωση του PCOS: εξετάσεις και έλεγχος — AWA',
  },
  fil: {
    badge: 'PCOS',
    title: 'Diagnosis ng PCOS:\nmga test at pagsusuri',
    metaDuration: '7 min na babasahin',
    metaType: 'Gabay',
    metaLevel: 'Katamtaman',
    metaValidated: 'Sinuring nilalaman',
    intro: 'Paano dina-diagnose ang PCOS, anong mga test ang maaaring ialok, at paano mahinahong maghanda para sa iyong appointment.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Pag-unawa sa proseso ng diagnosis',
      'Ang mga pangunahing hakbang ng pagsusuri',
      'Ang hormonal na pagsusuri ng dugo',
      'Ang pelvic ultrasound',
      'Ang hindi sinasabi ng diagnosis',
      'Paghahanda para sa iyong appointment',
      'Mahahalagang tandaan',
    ],
    section1Body1: 'Hindi nakadepende sa iisang test ang diagnosis ng polycystic ovary syndrome. Pinagsasama ng propesyonal sa kalusugan ang ilang piraso ng impormasyon: ang kasaysayan ng iyong siklo, anumang sintomas, ang klinikal na eksaminasyon, mga lab test, at, depende sa sitwasyon, ultrasound.',
    section1Body2: 'Layunin nitong parehong hanapin ang mga katangiang tugma sa PCOS at alisin ang iba pang sanhi na maaaring magpaliwanag sa hindi regular na regla o ilang hormonal na sintomas.',
    tip1Title: 'Mabuting malaman',
    tip1Text: 'Laging personalisado ang diagnosis. Ang dalawang babaeng may PCOS ay maaaring may napakagkaibang sintomas at resulta ng test.',
    section2Body: 'Maaaring sumunod sa ilang hakbang ang pagsusuri. Hindi kinakailangang isagawa ang lahat ng ito sa parehong paraan para sa lahat.',
    diagnosisSteps: [
      {title: 'Pagkuha ng kasaysayan', text: 'Kinokolekta ng propesyonal ang iyong kasaysayan: mga siklo, sintomas, medikal na background, at mga paggamot.'},
      {title: 'Klinikal na eksaminasyon', text: 'Partikular nilang hinahanap ang mga senyales ng labis na androgen at tinatasa ang iyong pangkalahatang kalagayan.'},
      {title: 'Pagsusuri ng dugo', text: 'Maaaring hilingin ang mga hormonal at metabolic na test upang linawin ang sitwasyon.'},
      {title: 'Ultrasound', text: 'Maaari nitong kumpletuhin ang pagsusuri sa pamamagitan ng pagmamasid sa itsura ng mga obaryo.'},
    ],
    flowTitle: 'Ang proseso sa isang tingin',
    flowItems: [
      'Kasaysayan at mga sintomas',
      'Klinikal na eksaminasyon',
      'Mga test depende sa sitwasyon',
      'Ultrasound kung kinakailangan',
    ],
    section3Body1: 'Maaaring ialok ang pagsusuri ng dugo upang hanapin ang mga senyales ng labis na androgen, tasahin ang ilang hormone na kasangkot sa reproductive function, at hanapin ang iba pang posibleng sanhi ng iyong mga sintomas.',
    section3Body2: 'Nakadepende ang mga piniling test sa iyong edad, mga sintomas, kasaysayang medikal, at sa gustong suriin ng propesyonal.',
    bloodTests: [
      {title: 'Mga androgen', text: 'Testosterone at iba pang hormone depende sa sitwasyon.'},
      {title: 'Paggana ng thyroid', text: 'Partikular na nakakatulong na alisin ang ilang sanhi ng hindi regular na siklo.'},
      {title: 'Metabolic na pagsusuri', text: 'Blood glucose, minsan lipid panel depende sa mga salik ng panganib.'},
    ],
    alertTitle: 'Mahalaga',
    alertText: 'Dapat bigyang-kahulugan ang mga hormonal na resulta kasabay ng klinikal na konteksto. Karaniwang hindi sapat ang iisang halaga, sa sarili nito, upang magpasya sa diagnosis ng PCOS.',
    section4Body: 'Maaaring gamitin ang ultrasound upang obserbahan ang itsura ng mga obaryo at partikular na hanapin ang mataas na bilang ng maliliit na follicle. Pinahihintulutan din nito ang propesyonal na hanapin ang iba pang salik na maaaring magpaliwanag sa ilang sintomas.',
    tip2Title: 'Mabuting malaman',
    tip2Text: 'Ang pagkakita ng maraming follicle sa ultrasound ay hindi awtomatikong nangangahulugang may PCOS ka. Dapat bigyang-kahulugan ang resulta kasabay ng natitirang bahagi ng pagsusuri.',
    section5Body: 'Ang pagtanggap ng diagnosis ng PCOS ay hindi nagpapahintulot na hulaan nang eksakto kung paano ito uusad para sa iyo. Maaaring lumitaw nang napakaiba ang sindrom mula sa isang tao hanggang sa iba.',
    mythItems: [
      'Hindi awtomatikong nangangahulugang pagkabaog ang PCOS.',
      'Hindi kinakailangang nangangahulugang may cyst ang PCOS.',
      'Hindi lamang ang diagnosis ang tumutukoy sa paggamot.',
      'Ang normal na ultrasound ay hindi kinakailangang nag-aalis ng PCOS.',
    ],
    section6Body: 'Ang ilang impormasyong inihanda nang maaga ay makakatulong sa propesyonal na maunawaan ang iyong kasaysayan at piliin ang mga pinakaangkop na test.',
    appointmentQuestions: [
      'Gaano na katagal na hindi regular ang iyong mga siklo?',
      'May napansin ka bang tigyawat, hindi pangkaraniwang pagtubo ng buhok, o pagkalagas ng buhok?',
      'May kasaysayan ba ng PCOS o diabetes sa pamilya?',
      'Gusto mo bang magbuntis sa maikli o katamtamang panahon?',
    ],
    preparationTitle: 'Isang maliit na payo bago ang appointment',
    preparationText: 'Kung maaari, itala ang mga petsa ng huli mong regla, ang tinatayang haba ng iyong mga siklo, ang mga sintomas na napapansin mo, at anumang paggamot o supplement na iniinom mo.',
    summaryTitle: 'Ang mahalaga sa pagsusuri',
    summaryItems: [
      'Nakabatay ang diagnosis sa ilang salik, hindi sa iisang test.',
      'Ang pagsusuri ng dugo ay maaaring maghanap ng ilang hormonal na hindi balanse at mag-alis ng iba pang sanhi.',
      'Maaaring kumpletuhin ng ultrasound ang pagsusuri depende sa sitwasyon.',
      'Laging dapat bigyang-kahulugan ng propesyonal sa kalusugan ang mga resulta.',
    ],
    finalTipTitle: 'Mahahalagang tandaan',
    finalTipText: 'Ang pagsusuri sa PCOS ay hindi iisang test o huling hatol. Tinutulungan ka nitong maunawaan ang iyong hormonal na paggana, hanapin ang iba pang posibleng sanhi, at bumuo ng pangangalagang angkop sa iyong sitwasyon.',
    disclaimerText: 'Para sa impormasyon lamang ang artikulong ito at hindi pumapalit sa medikal na konsultasyon o personalisadong interpretasyon ng mga resulta ng iyong test.',
    shareMessage: 'Diagnosis ng PCOS: mga test at pagsusuri — AWA',
  },
  ta: {
    badge: 'PCOS',
    title: 'PCOS நோயறிதல்:\nபரிசோதனைகளும் மதிப்பீடும்',
    metaDuration: '7 நிமிடம் படிக்க',
    metaType: 'வழிகாட்டி',
    metaLevel: 'இடைநிலை',
    metaValidated: 'சரிபார்க்கப்பட்ட உள்ளடக்கம்',
    intro: 'PCOS எப்படி நோயறிதல் செய்யப்படுகிறது, என்ன பரிசோதனைகள் வழங்கப்படலாம், உங்கள் சந்திப்புக்கு அமைதியாக எப்படித் தயாராவது.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      'நோயறிதல் மதிப்பீட்டைப் புரிந்துகொள்ளுதல்',
      'மதிப்பீட்டின் முக்கியப் படிகள்',
      'ஹார்மோன் இரத்தப் பரிசோதனை',
      'இடுப்பு அல்ட்ராசவுண்ட்',
      'நோயறிதல் சொல்லாதவை',
      'உங்கள் சந்திப்புக்குத் தயாராதல்',
      'முக்கியக் குறிப்புகள்',
    ],
    section1Body1: 'பாலிசிஸ்டிக் ஓவரி சிண்ட்ரோமின் நோயறிதல் ஒரே ஒரு பரிசோதனையைச் சார்ந்ததல்ல. சுகாதார நிபுணர் பல தகவல்களை ஒன்றிணைக்கிறார்: உங்கள் சுழற்சி வரலாறு, ஏதேனும் அறிகுறிகள், மருத்துவப் பரிசோதனை, ஆய்வகப் பரிசோதனைகள், மேலும் சூழ்நிலையைப் பொறுத்து ஓர் அல்ட்ராசவுண்ட்.',
    section1Body2: 'நோக்கம் PCOS உடன் பொருந்தும் அம்சங்களைத் தேடுவதும், ஒழுங்கற்ற மாதவிடாய்களையோ சில ஹார்மோன் அறிகுறிகளையோ விளக்கக்கூடிய பிற காரணங்களை விலக்குவதும் ஆகும்.',
    tip1Title: 'தெரிந்துகொள்ளுங்கள்',
    tip1Text: 'நோயறிதல் எப்போதும் தனிப்பயனாக்கப்பட்டது. PCOS உள்ள இரு பெண்களுக்கு மிக வேறுபட்ட அறிகுறிகளும் பரிசோதனை முடிவுகளும் இருக்கலாம்.',
    section2Body: 'மதிப்பீடு பல படிகளைப் பின்பற்றலாம். அவை அனைத்தும் அனைவருக்கும் ஒரே விதத்தில் செய்யப்படுவது கட்டாயமில்லை.',
    diagnosisSteps: [
      {title: 'வரலாறு எடுத்தல்', text: 'நிபுணர் உங்கள் வரலாற்றைச் சேகரிக்கிறார்: சுழற்சிகள், அறிகுறிகள், மருத்துவப் பின்னணி மற்றும் சிகிச்சைகள்.'},
      {title: 'மருத்துவப் பரிசோதனை', text: 'அவர்கள் குறிப்பாக அதிகப்படியான ஆண்ட்ரோஜன்களின் அறிகுறிகளைத் தேடி உங்கள் ஒட்டுமொத்த நிலையை மதிப்பிடுகிறார்கள்.'},
      {title: 'இரத்த மதிப்பீடு', text: 'நிலைமையைத் தெளிவுபடுத்த ஹார்மோன் மற்றும் வளர்சிதை மாற்றப் பரிசோதனைகள் கோரப்படலாம்.'},
      {title: 'அல்ட்ராசவுண்ட்', text: 'அண்டகங்களின் தோற்றத்தைக் கவனிப்பதன் மூலம் இது மதிப்பீட்டை நிறைவு செய்யலாம்.'},
    ],
    flowTitle: 'செயல்முறை ஒரே பார்வையில்',
    flowItems: [
      'வரலாறும் அறிகுறிகளும்',
      'மருத்துவப் பரிசோதனை',
      'சூழ்நிலையைப் பொறுத்துப் பரிசோதனைகள்',
      'தேவைப்பட்டால் அல்ட்ராசவுண்ட்',
    ],
    section3Body1: 'அதிகப்படியான ஆண்ட்ரோஜன்களின் அறிகுறிகளைத் தேட, இனப்பெருக்கச் செயல்பாட்டில் ஈடுபட்டுள்ள சில ஹார்மோன்களை மதிப்பிட, உங்கள் அறிகுறிகளுக்கான பிற சாத்தியமான காரணங்களைத் தேட, ஓர் இரத்தப் பரிசோதனை வழங்கப்படலாம்.',
    section3Body2: 'தேர்ந்தெடுக்கப்படும் பரிசோதனைகள் உங்கள் வயது, உங்கள் அறிகுறிகள், உங்கள் மருத்துவ வரலாறு மற்றும் நிபுணர் சரிபார்க்க விரும்புவதைப் பொறுத்தவை.',
    bloodTests: [
      {title: 'ஆண்ட்ரோஜன்கள்', text: 'சூழ்நிலையைப் பொறுத்து டெஸ்டோஸ்டிரோனும் பிற ஹார்மோன்களும்.'},
      {title: 'தைராய்டு செயல்பாடு', text: 'ஒழுங்கற்ற சுழற்சிகளுக்கான சில காரணங்களை விலக்க இது குறிப்பாக உதவுகிறது.'},
      {title: 'வளர்சிதை மாற்ற மதிப்பீடு', text: 'இரத்தச் சர்க்கரை, அபாயக் காரணிகளைப் பொறுத்து சில நேரங்களில் கொழுப்புப் பரிசோதனை.'},
    ],
    alertTitle: 'முக்கியம்',
    alertText: 'ஹார்மோன் முடிவுகளை மருத்துவச் சூழலுடன் சேர்த்து விளக்க வேண்டும். ஒரே ஒரு மதிப்பு, தனியாக, PCOS நோயறிதலை முடிவு செய்யப் பொதுவாகப் போதாது.',
    section4Body: 'அண்டகங்களின் தோற்றத்தைக் கவனிக்கவும், குறிப்பாக அதிக எண்ணிக்கையிலான சிறிய ஃபோலிக்கிள்களைத் தேடவும் ஓர் அல்ட்ராசவுண்டைப் பயன்படுத்தலாம். சில அறிகுறிகளை விளக்கக்கூடிய பிற காரணிகளைத் தேடவும் இது நிபுணரை அனுமதிக்கிறது.',
    tip2Title: 'தெரிந்துகொள்ளுங்கள்',
    tip2Text: 'அல்ட்ராசவுண்டில் பல ஃபோலிக்கிள்களைக் காண்பது உங்களுக்கு PCOS இருக்கிறது என்று தானாகப் பொருளல்ல. மதிப்பீட்டின் மற்ற பகுதிகளுடன் சேர்த்து முடிவை விளக்க வேண்டும்.',
    section5Body: 'PCOS நோயறிதலைப் பெறுவது உங்களுக்கு விஷயங்கள் எப்படி முன்னேறும் என்பதைத் துல்லியமாகக் கணிக்க இடமளிப்பதில்லை. இந்த நோய்த்தொகுப்பு ஒருவருக்கு ஒருவர் மிக வேறுபட்ட விதத்தில் வெளிப்படலாம்.',
    mythItems: [
      'PCOS தானாகவே கருவுறாமையைக் குறிக்காது.',
      'PCOS கட்டாயம் கட்டிகள் இருப்பதைக் குறிக்காது.',
      'நோயறிதல் மட்டும் சிகிச்சையைத் தீர்மானிப்பதில்லை.',
      'இயல்பான அல்ட்ராசவுண்ட் PCOS-ஐ கட்டாயம் விலக்காது.',
    ],
    section6Body: 'முன்கூட்டியே தயார் செய்யப்பட்ட சில தகவல்கள், நிபுணர் உங்கள் வரலாற்றைப் புரிந்துகொள்ளவும் மிகப் பொருத்தமான பரிசோதனைகளைத் தேர்ந்தெடுக்கவும் உதவலாம்.',
    appointmentQuestions: [
      'உங்கள் சுழற்சிகள் எவ்வளவு காலமாக ஒழுங்கற்றவை?',
      'முகப்பரு, வழக்கத்துக்கு மாறான முடி வளர்ச்சி அல்லது முடி உதிர்வை நீங்கள் கவனித்தீர்களா?',
      'PCOS அல்லது நீரிழிவின் குடும்ப வரலாறு உள்ளதா?',
      'குறுகிய அல்லது நடுத்தர காலத்தில் கர்ப்பமடைய விரும்புகிறீர்களா?',
    ],
    preparationTitle: 'சந்திப்புக்கு முன் ஒரு சிறு குறிப்பு',
    preparationText: 'முடிந்தால், உங்கள் கடைசி மாதவிடாயின் தேதிகள், உங்கள் சுழற்சிகளின் தோராயமான நீளம், நீங்கள் கவனிக்கும் அறிகுறிகள், நீங்கள் எடுத்துக்கொள்ளும் சிகிச்சைகள் அல்லது கூடுதல் சத்துகளைக் குறித்து வையுங்கள்.',
    summaryTitle: 'மதிப்பீட்டின் அத்தியாவசியங்கள்',
    summaryItems: [
      'நோயறிதல் பல காரணிகளைச் சார்ந்தது, ஒரே ஒரு பரிசோதனை அல்ல.',
      'ஓர் இரத்தப் பரிசோதனை சில ஹார்மோன் சமநிலையின்மைகளைத் தேடி பிற காரணங்களை விலக்கலாம்.',
      'சூழ்நிலையைப் பொறுத்து ஒரு அல்ட்ராசவுண்ட் மதிப்பீட்டை நிறைவு செய்யலாம்.',
      'முடிவுகளை எப்போதும் ஒரு சுகாதார நிபுணர் விளக்க வேண்டும்.',
    ],
    finalTipTitle: 'முக்கியக் குறிப்புகள்',
    finalTipText: 'PCOS மதிப்பீடு என்பது ஒரே ஒரு பரிசோதனை அல்லது இறுதித் தீர்ப்பு அல்ல. இது உங்கள் ஹார்மோன் செயல்பாட்டைப் புரிந்துகொள்ளவும், பிற சாத்தியமான காரணங்களைத் தேடவும், உங்கள் சூழ்நிலைக்கு ஏற்ற பராமரிப்பை உருவாக்கவும் உதவுகிறது.',
    disclaimerText: 'இந்தக் கட்டுரை தகவலுக்கு மட்டுமே, மருத்துவ ஆலோசனைக்கோ உங்கள் பரிசோதனை முடிவுகளின் தனிப்பயன் விளக்கத்துக்கோ மாற்றல்ல.',
    shareMessage: 'PCOS நோயறிதல்: பரிசோதனைகளும் மதிப்பீடும் — AWA',
  },
  te: {
    badge: 'PCOS',
    title: 'PCOS నిర్ధారణ:\nపరీక్షలు మరియు మదింపు',
    metaDuration: '7 నిమిషాల పఠనం',
    metaType: 'గైడ్',
    metaLevel: 'మధ్యస్థ స్థాయి',
    metaValidated: 'మదింపు చేసిన కంటెంట్',
    intro: 'PCOS ఎలా నిర్ధారించబడుతుంది, ఏ పరీక్షలు సూచించబడవచ్చు, మీ అపాయింట్‌మెంట్‌కు ప్రశాంతంగా ఎలా సిద్ధమవ్వాలి.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      'నిర్ధారణ మదింపును అర్థం చేసుకోవడం',
      'మదింపు యొక్క ముఖ్య దశలు',
      'హార్మోన్ రక్త పరీక్ష',
      'కటి అల్ట్రాసౌండ్',
      'నిర్ధారణ చెప్పనివి',
      'మీ అపాయింట్‌మెంట్‌కు సిద్ధమవ్వడం',
      'ముఖ్యాంశాలు',
    ],
    section1Body1: 'పాలిసిస్టిక్ ఓవరీ సిండ్రోమ్ నిర్ధారణ ఒకే పరీక్షపై ఆధారపడదు. ఆరోగ్య నిపుణుడు అనేక సమాచారాలను ఒకచోట చేరుస్తారు: మీ చక్రం చరిత్ర, ఏవైనా లక్షణాలు, వైద్య పరీక్ష, ల్యాబ్ పరీక్షలు, పరిస్థితిని బట్టి ఒక అల్ట్రాసౌండ్.',
    section1Body2: 'లక్ష్యం PCOSకు అనుగుణమైన లక్షణాల కోసం చూడటం, అలాగే అస్తవ్యస్త నెలసరులను లేదా కొన్ని హార్మోన్ లక్షణాలను వివరించగల ఇతర కారణాలను విలువ చేయడం.',
    tip1Title: 'తెలుసుకోవాల్సినవి',
    tip1Text: 'నిర్ధారణ ఎల్లప్పుడూ వ్యక్తిగతీకరించబడినది. PCOS ఉన్న ఇద్దరు మహిళలకు చాలా భిన్నమైన లక్షణాలు, పరీక్ష ఫలితాలు ఉండవచ్చు.',
    section2Body: 'మదింపు అనేక దశలను అనుసరించవచ్చు. అవన్నీ అందరికీ ఒకే విధంగా చేయబడతాయని తప్పనిసరి కాదు.',
    diagnosisSteps: [
      {title: 'చరిత్ర తీసుకోవడం', text: 'నిపుణులు మీ చరిత్రను సేకరిస్తారు: చక్రాలు, లక్షణాలు, వైద్య నేపథ్యం, చికిత్సలు.'},
      {title: 'వైద్య పరీక్ష', text: 'వారు ముఖ్యంగా అధిక ఆండ్రోజెన్ల సంకేతాల కోసం చూసి మీ మొత్తం స్థితిని మదింపు చేస్తారు.'},
      {title: 'రక్త మదింపు', text: 'పరిస్థితిని స్పష్టం చేయడానికి హార్మోన్, జీవక్రియ పరీక్షలు కోరబడవచ్చు.'},
      {title: 'అల్ట్రాసౌండ్', text: 'ఇది అండాశయాల రూపాన్ని గమనించడం ద్వారా మదింపును పూర్తి చేయగలదు.'},
    ],
    flowTitle: 'ప్రక్రియ ఒక్క చూపులో',
    flowItems: [
      'చరిత్ర, లక్షణాలు',
      'వైద్య పరీక్ష',
      'పరిస్థితిని బట్టి పరీక్షలు',
      'అవసరమైతే అల్ట్రాసౌండ్',
    ],
    section3Body1: 'అధిక ఆండ్రోజెన్ల సంకేతాల కోసం చూడటానికి, ప్రత్యుత్పత్తి పనితీరులో పాల్గొనే కొన్ని హార్మోన్లను మదింపు చేయడానికి, మీ లక్షణాలకు ఇతర సాధ్యమైన కారణాల కోసం చూడటానికి ఒక రక్త పరీక్ష సూచించబడవచ్చు.',
    section3Body2: 'ఎంచుకునే పరీక్షలు మీ వయసు, మీ లక్షణాలు, మీ వైద్య చరిత్ర, నిపుణులు ఏమి సరిచూడాలనుకుంటున్నారనే దానిపై ఆధారపడి ఉంటాయి.',
    bloodTests: [
      {title: 'ఆండ్రోజెన్లు', text: 'పరిస్థితిని బట్టి టెస్టోస్టిరోన్, ఇతర హార్మోన్లు.'},
      {title: 'థైరాయిడ్ పనితీరు', text: 'అస్తవ్యస్త చక్రాలకు కొన్ని కారణాలను విలువ చేయడానికి ఇది ముఖ్యంగా సహాయపడుతుంది.'},
      {title: 'జీవక్రియ మదింపు', text: 'రక్తంలో చక్కెర, ప్రమాద అంశాలను బట్టి కొన్నిసార్లు కొవ్వు పరీక్ష.'},
    ],
    alertTitle: 'ముఖ్యం',
    alertText: 'హార్మోన్ ఫలితాలను వైద్య సందర్భంతో కలిపి వ్యాఖ్యానించాలి. ఒకే విలువ, వేరుగా, PCOS నిర్ధారణను ముగించడానికి సాధారణంగా చాలదు.',
    section4Body: 'అండాశయాల రూపాన్ని గమనించడానికి, ముఖ్యంగా ఎక్కువ సంఖ్యలో చిన్న ఫాలికల్‌ల కోసం చూడటానికి ఒక అల్ట్రాసౌండ్‌ను ఉపయోగించవచ్చు. కొన్ని లక్షణాలను వివరించగల ఇతర అంశాల కోసం చూడటానికి కూడా ఇది నిపుణులకు వీలు కల్పిస్తుంది.',
    tip2Title: 'తెలుసుకోవాల్సినవి',
    tip2Text: 'అల్ట్రాసౌండ్‌లో అనేక ఫాలికల్‌లను చూడటం మీకు PCOS ఉందని ఆటోమేటిక్‌గా అర్థం కాదు. ఫలితాన్ని మదింపులోని మిగతా భాగాలతో కలిపి వ్యాఖ్యానించాలి.',
    section5Body: 'PCOS నిర్ధారణ పొందడం మీకు విషయాలు ఎలా పురోగమిస్తాయో ఖచ్చితంగా అంచనా వేయడానికి వీలు కల్పించదు. ఈ సిండ్రోమ్ ఒకరి నుండి మరొకరికి చాలా భిన్నంగా వ్యక్తమవవచ్చు.',
    mythItems: [
      'PCOS ఆటోమేటిక్‌గా గొడ్రాలుతనాన్ని సూచించదు.',
      'PCOS తప్పనిసరిగా నీటి గడ్డలు ఉండటాన్ని సూచించదు.',
      'నిర్ధారణ మాత్రమే చికిత్సను నిర్ణయించదు.',
      'సాధారణ అల్ట్రాసౌండ్ తప్పనిసరిగా PCOSను విలువ చేయదు.',
    ],
    section6Body: 'ముందుగా సిద్ధం చేసిన కొంత సమాచారం నిపుణులు మీ చరిత్రను అర్థం చేసుకోవడానికి, అత్యంత సంబంధిత పరీక్షలను ఎంచుకోవడానికి సహాయపడగలదు.',
    appointmentQuestions: [
      'మీ చక్రాలు ఎంతకాలంగా అస్తవ్యస్తంగా ఉన్నాయి?',
      'మీరు మొటిమలను, అసాధారణ జుట్టు పెరుగుదలను లేదా జుట్టు రాలడాన్ని గమనించారా?',
      'PCOS లేదా మధుమేహం కుటుంబ చరిత్ర ఉందా?',
      'స్వల్ప లేదా మధ్యకాలంలో మీరు గర్భవతి కావాలనుకుంటున్నారా?',
    ],
    preparationTitle: 'అపాయింట్‌మెంట్‌కు ముందు ఒక చిన్న చిట్కా',
    preparationText: 'సాధ్యమైతే, మీ చివరి నెలసరి తేదీలను, మీ చక్రాల సుమారు నిడివిని, మీరు గమనిస్తున్న లక్షణాలను, మీరు తీసుకుంటున్న చికిత్సలను లేదా సప్లిమెంట్లను రాసుకోండి.',
    summaryTitle: 'మదింపు యొక్క ముఖ్యమైనవి',
    summaryItems: [
      'నిర్ధారణ అనేక అంశాలపై ఆధారపడి ఉంటుంది, ఒకే పరీక్షపై కాదు.',
      'ఒక రక్త పరీక్ష కొన్ని హార్మోన్ అసమతుల్యతల కోసం చూసి ఇతర కారణాలను విలువ చేయగలదు.',
      'పరిస్థితిని బట్టి ఒక అల్ట్రాసౌండ్ మదింపును పూర్తి చేయగలదు.',
      'ఫలితాలను ఎల్లప్పుడూ ఒక ఆరోగ్య నిపుణుడు వ్యాఖ్యానించాలి.',
    ],
    finalTipTitle: 'ముఖ్యాంశాలు',
    finalTipText: 'PCOS మదింపు ఒకే పరీక్ష లేదా తుది తీర్పు కాదు. ఇది మీ హార్మోన్ పనితీరును అర్థం చేసుకోవడానికి, ఇతర సాధ్యమైన కారణాల కోసం చూడటానికి, మీ పరిస్థితికి అనువైన సంరక్షణను రూపొందించడానికి సహాయపడుతుంది.',
    disclaimerText: 'ఈ వ్యాసం సమాచారం కోసం మాత్రమే, వైద్య సంప్రదింపుకు లేదా మీ పరీక్ష ఫలితాల వ్యక్తిగతీకరించిన వ్యాఖ్యానానికి ప్రత్యామ్నాయం కాదు.',
    shareMessage: 'PCOS నిర్ధారణ: పరీక్షలు మరియు మదింపు — AWA',
  },
  mr: {
    badge: 'PCOS',
    title: 'PCOS चे निदान:\nचाचण्या आणि तपासणी',
    metaDuration: '7 मिनिटे वाचन',
    metaType: 'मार्गदर्शक',
    metaLevel: 'मध्यम स्तर',
    metaValidated: 'पुनरावलोकन केलेला मजकूर',
    intro: 'PCOS चे निदान कसे केले जाते, कोणत्या चाचण्या सुचवल्या जाऊ शकतात आणि तुमच्या भेटीची शांतपणे तयारी कशी करावी.',
    contentsTitle: 'या लेखात',
    topics: [
      'निदानात्मक तपासणी समजून घेणे',
      'तपासणीच्या मुख्य पायऱ्या',
      'हार्मोनल रक्त चाचणी',
      'कटीभागाची सोनोग्राफी',
      'निदान तुम्हाला काय सांगत नाही',
      'तुमच्या भेटीची तयारी',
      'मुख्य मुद्दे',
    ],
    section1Body1: 'पॉलिसिस्टिक ओव्हरी सिंड्रोमचे निदान एकाच चाचणीवर अवलंबून नसते. आरोग्य व्यावसायिक अनेक माहितीचे तुकडे एकत्र करतो: तुमच्या पाळीचा इतिहास, कोणतीही लक्षणे, शारीरिक तपासणी, प्रयोगशाळा चाचण्या आणि परिस्थितीनुसार सोनोग्राफी.',
    section1Body2: 'ध्येय PCOS शी सुसंगत वैशिष्ट्ये शोधणे आणि अनियमित पाळी किंवा काही हार्मोनल लक्षणे स्पष्ट करू शकणारी इतर कारणे वगळणे असे दोन्ही आहे.',
    tip1Title: 'हे जाणून घ्या',
    tip1Text: 'निदान नेहमी वैयक्तिक असते. PCOS असलेल्या दोन स्त्रियांची लक्षणे आणि चाचणी निकाल खूप वेगळे असू शकतात.',
    section2Body: 'तपासणी अनेक पायऱ्यांमध्ये होऊ शकते. त्या प्रत्येकासाठी तशाच प्रकारे केल्या जातातच असे नाही.',
    diagnosisSteps: [
      {title: 'इतिहास घेणे', text: 'तज्ज्ञ तुमचा इतिहास गोळा करतो: पाळी, लक्षणे, वैद्यकीय पार्श्वभूमी आणि उपचार.'},
      {title: 'शारीरिक तपासणी', text: 'ते विशेषतः अतिरिक्त अँड्रोजेन्सची चिन्हे शोधतात आणि तुमच्या एकूण स्थितीचे मूल्यांकन करतात.'},
      {title: 'रक्ताची तपासणी', text: 'परिस्थिती स्पष्ट करण्यासाठी हार्मोनल आणि चयापचयाशी संबंधित चाचण्या मागवल्या जाऊ शकतात.'},
      {title: 'सोनोग्राफी', text: 'ती अंडाशयांचे स्वरूप पाहून तपासणी पूर्ण करू शकते.'},
    ],
    flowTitle: 'प्रक्रिया एका नजरेत',
    flowItems: [
      'इतिहास आणि लक्षणे',
      'शारीरिक तपासणी',
      'परिस्थितीनुसार चाचण्या',
      'गरज असल्यास सोनोग्राफी',
    ],
    section3Body1: 'अतिरिक्त अँड्रोजेन्सची चिन्हे शोधण्यासाठी, प्रजनन कार्यात सहभागी असलेल्या काही हार्मोन्सचे मूल्यांकन करण्यासाठी आणि तुमच्या लक्षणांची इतर संभाव्य कारणे शोधण्यासाठी रक्त चाचणी सुचवली जाऊ शकते.',
    section3Body2: 'निवडलेल्या चाचण्या तुमचे वय, तुमची लक्षणे, तुमचा वैद्यकीय इतिहास आणि तज्ज्ञ काय तपासू इच्छितो यावर अवलंबून असतात.',
    bloodTests: [
      {title: 'अँड्रोजेन्स', text: 'परिस्थितीनुसार टेस्टोस्टेरॉन आणि इतर हार्मोन्स.'},
      {title: 'थायरॉइडचे कार्य', text: 'विशेषतः अनियमित पाळीची काही कारणे वगळण्यास मदत करते.'},
      {title: 'चयापचय तपासणी', text: 'रक्तातील साखर, धोक्याच्या घटकांनुसार कधी कधी लिपिड पॅनेल.'},
    ],
    alertTitle: 'महत्त्वाचे',
    alertText: 'हार्मोनल निकालांचा अर्थ वैद्यकीय संदर्भासोबत लावणे आवश्यक आहे. एकच मूल्य सहसा, एकट्याने, PCOS च्या निदानाचा निष्कर्ष काढण्यासाठी पुरेसे नसते.',
    section4Body: 'सोनोग्राफीचा वापर अंडाशयांचे स्वरूप पाहण्यासाठी आणि विशेषतः मोठ्या संख्येने लहान फॉलिकल शोधण्यासाठी केला जाऊ शकतो. तसेच काही लक्षणे स्पष्ट करू शकणारे इतर घटक शोधण्याची संधी तज्ज्ञाला मिळते.',
    tip2Title: 'हे जाणून घ्या',
    tip2Text: 'सोनोग्राफीवर अनेक फॉलिकल दिसणे म्हणजे आपोआप तुम्हाला PCOS आहे असे नाही. निकालाचा अर्थ उर्वरित तपासणीसोबत लावला पाहिजे.',
    section5Body: 'PCOS चे निदान मिळाल्याने तुमच्यासाठी गोष्टी नेमक्या कशा पुढे जातील याचा अंदाज बांधता येत नाही. हा सिंड्रोम एका व्यक्तीपासून दुसऱ्या व्यक्तीपर्यंत खूप वेगळ्या प्रकारे दिसू शकतो.',
    mythItems: [
      'PCOS म्हणजे आपोआप वंध्यत्व नव्हे.',
      'PCOS म्हणजे गाठी असणे आवश्यक नाही.',
      'फक्त निदान उपचार ठरवत नाही.',
      'सामान्य सोनोग्राफी PCOS वगळतेच असे नाही.',
    ],
    section6Body: 'आधीपासून तयार केलेली काही माहिती तज्ज्ञाला तुमचा इतिहास समजण्यास आणि सर्वात उपयुक्त चाचण्या निवडण्यास मदत करू शकते.',
    appointmentQuestions: [
      'तुमची पाळी किती काळापासून अनियमित आहे?',
      'तुम्हाला मुरूम, असामान्य केसांची वाढ किंवा केस गळणे जाणवले आहे का?',
      'PCOS किंवा मधुमेहाचा कौटुंबिक इतिहास आहे का?',
      'तुम्हाला अल्प किंवा मध्यम कालावधीत गर्भवती व्हायचे आहे का?',
    ],
    preparationTitle: 'भेटीपूर्वी एक छोटी टीप',
    preparationText: 'शक्य असल्यास, तुमच्या शेवटच्या पाळीच्या तारखा, तुमच्या पाळ्यांचा अंदाजे कालावधी, तुम्हाला जाणवणारी लक्षणे आणि तुम्ही घेत असलेले कोणतेही उपचार किंवा पूरके नोंदवा.',
    summaryTitle: 'तपासणीचे मुख्य मुद्दे',
    summaryItems: [
      'निदान एकाच चाचणीवर नव्हे तर अनेक घटकांवर अवलंबून असते.',
      'रक्त चाचणी काही हार्मोनल असंतुलन शोधू शकते आणि इतर कारणे वगळू शकते.',
      'परिस्थितीनुसार सोनोग्राफी तपासणी पूर्ण करू शकते.',
      'निकालांचा अर्थ नेहमी आरोग्य व्यावसायिकाने लावला पाहिजे.',
    ],
    finalTipTitle: 'मुख्य मुद्दे',
    finalTipText: 'PCOS ची तपासणी ही एकच चाचणी किंवा अंतिम निवाडा नसतो. ती तुम्हाला तुमचे हार्मोनल कार्य समजण्यास, इतर संभाव्य कारणे शोधण्यास आणि तुमच्या परिस्थितीला जुळणारी काळजी तयार करण्यास मदत करते.',
    disclaimerText: 'हा लेख फक्त माहितीसाठी आहे आणि वैद्यकीय सल्लामसलतीची किंवा तुमच्या चाचणी निकालांच्या वैयक्तिक अर्थ लावण्याची जागा घेत नाही.',
    shareMessage: 'PCOS चे निदान: चाचण्या आणि तपासणी — AWA',
  },
  gu: {
    badge: 'PCOS',
    title: 'PCOS નું નિદાન:\nપરીક્ષણો અને તપાસ',
    metaDuration: '7 મિનિટ વાંચન',
    metaType: 'માર્ગદર્શિકા',
    metaLevel: 'મધ્યમ સ્તર',
    metaValidated: 'પુનરાવલોકન કરેલી સામગ્રી',
    intro: 'PCOS નું નિદાન કેવી રીતે થાય છે, કયાં પરીક્ષણો સૂચવવામાં આવી શકે છે, અને તમારી મુલાકાત માટે શાંતિથી કેવી રીતે તૈયારી કરવી.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      'નિદાનની તપાસને સમજવી',
      'તપાસના મુખ્ય તબક્કા',
      'હોર્મોનની લોહીની તપાસ',
      'પેલ્વિક સોનોગ્રાફી',
      'નિદાન તમને શું નથી કહેતું',
      'તમારી મુલાકાત માટે તૈયારી',
      'મુખ્ય મુદ્દા',
    ],
    section1Body1: 'પોલિસિસ્ટિક ઓવરી સિન્ડ્રોમનું નિદાન એક જ પરીક્ષણ પર આધાર રાખતું નથી. આરોગ્ય વ્યાવસાયિક ઘણી માહિતી ભેગી કરે છે: તમારા ચક્રનો ઇતિહાસ, કોઈ લક્ષણો, શારીરિક તપાસ, પ્રયોગશાળાનાં પરીક્ષણો અને પરિસ્થિતિ પ્રમાણે સોનોગ્રાફી.',
    section1Body2: 'ધ્યેય PCOS સાથે સુસંગત લક્ષણો શોધવાનો અને અનિયમિત માસિક અથવા કેટલાંક હોર્મોન સંબંધી લક્ષણો સમજાવી શકે તેવાં અન્ય કારણોને બાકાત કરવાનો પણ છે.',
    tip1Title: 'જાણવા જેવું',
    tip1Text: 'નિદાન હંમેશાં વ્યક્તિગત હોય છે. PCOS ધરાવતી બે સ્ત્રીઓનાં લક્ષણો અને પરીક્ષણોનાં પરિણામો ખૂબ અલગ હોઈ શકે છે.',
    section2Body: 'તપાસ ઘણા તબક્કામાં થઈ શકે છે. તે બધાં માટે એકસરખી રીતે થાય એવું જરૂરી નથી.',
    diagnosisSteps: [
      {title: 'ઇતિહાસ લેવો', text: 'નિષ્ણાત તમારો ઇતિહાસ ભેગો કરે છે: ચક્ર, લક્ષણો, તબીબી પૃષ્ઠભૂમિ અને સારવાર.'},
      {title: 'શારીરિક તપાસ', text: 'તેઓ ખાસ કરીને વધારાના એન્ડ્રોજનના સંકેતો શોધે છે અને તમારી સામાન્ય સ્થિતિનું મૂલ્યાંકન કરે છે.'},
      {title: 'લોહીની તપાસ', text: 'પરિસ્થિતિ સ્પષ્ટ કરવા માટે હોર્મોન અને ચયાપચય સંબંધી પરીક્ષણો માગવામાં આવી શકે છે.'},
      {title: 'સોનોગ્રાફી', text: 'તે અંડાશયના દેખાવનું અવલોકન કરીને તપાસને પૂર્ણ કરી શકે છે.'},
    ],
    flowTitle: 'પ્રક્રિયા એક નજરમાં',
    flowItems: [
      'ઇતિહાસ અને લક્ષણો',
      'શારીરિક તપાસ',
      'પરિસ્થિતિ પ્રમાણે પરીક્ષણો',
      'જરૂર હોય તો સોનોગ્રાફી',
    ],
    section3Body1: 'વધારાના એન્ડ્રોજનના સંકેતો શોધવા, પ્રજનન કાર્યમાં સામેલ કેટલાક હોર્મોનનું મૂલ્યાંકન કરવા અને તમારાં લક્ષણોનાં અન્ય સંભવિત કારણો શોધવા માટે લોહીની તપાસ સૂચવવામાં આવી શકે છે.',
    section3Body2: 'પસંદ કરેલાં પરીક્ષણો તમારી ઉંમર, તમારાં લક્ષણો, તમારા તબીબી ઇતિહાસ અને નિષ્ણાત શું ચકાસવા માગે છે તેના પર આધાર રાખે છે.',
    bloodTests: [
      {title: 'એન્ડ્રોજન', text: 'ટેસ્ટોસ્ટેરોન અને પરિસ્થિતિ પ્રમાણે અન્ય હોર્મોન.'},
      {title: 'થાઇરોઇડનું કાર્ય', text: 'ખાસ કરીને અનિયમિત ચક્રનાં કેટલાંક કારણોને બાકાત કરવામાં મદદ કરે છે.'},
      {title: 'ચયાપચયની તપાસ', text: 'લોહીમાં ગ્લુકોઝ, જોખમી પરિબળો પ્રમાણે ક્યારેક લિપિડ તપાસ.'},
    ],
    alertTitle: 'મહત્ત્વનું',
    alertText: 'હોર્મોનનાં પરિણામો તબીબી સંદર્ભ સાથે સમજવાં જોઈએ. PCOS નું નિદાન નક્કી કરવા માટે સામાન્ય રીતે એકલું એક મૂલ્ય પૂરતું નથી.',
    section4Body: 'સોનોગ્રાફીથી અંડાશયના દેખાવનું અવલોકન કરી શકાય છે અને ખાસ કરીને નાના ફોલિકલની વધુ સંખ્યા શોધી શકાય છે. તે નિષ્ણાતને કેટલાંક લક્ષણો સમજાવી શકે તેવાં અન્ય પરિબળો શોધવાની પણ સગવડ આપે છે.',
    tip2Title: 'જાણવા જેવું',
    tip2Text: 'સોનોગ્રાફીમાં ઘણા ફોલિકલ દેખાવાનો અર્થ આપોઆપ એવો નથી કે તમને PCOS છે. પરિણામ બાકીની તપાસ સાથે સમજવું જોઈએ.',
    section5Body: 'PCOS નું નિદાન મળવાથી તમારા માટે બધું ચોક્કસ કેવી રીતે આગળ વધશે તેનું અનુમાન કરવું શક્ય બનતું નથી. આ સિન્ડ્રોમ એક વ્યક્તિથી બીજી વ્યક્તિમાં ખૂબ અલગ રીતે દેખાઈ શકે છે.',
    mythItems: [
      'PCOS નો અર્થ આપોઆપ વંધ્યત્વ નથી.',
      'PCOS નો અર્થ જરૂરી નથી કે ગાંઠ (સિસ્ટ) હોય.',
      'માત્ર નિદાન સારવાર નક્કી કરતું નથી.',
      'સામાન્ય સોનોગ્રાફી PCOS ને બાકાત કરે એવું જરૂરી નથી.',
    ],
    section6Body: 'અગાઉથી તૈયાર કરેલી થોડી માહિતી નિષ્ણાતને તમારો ઇતિહાસ સમજવામાં અને સૌથી યોગ્ય પરીક્ષણો પસંદ કરવામાં મદદ કરી શકે છે.',
    appointmentQuestions: [
      'તમારાં ચક્ર કેટલા સમયથી અનિયમિત છે?',
      'શું તમે ખીલ, અસામાન્ય વાળનો વધારો અથવા વાળ ખરવાનું નોંધ્યું છે?',
      'શું પરિવારમાં PCOS અથવા ડાયાબિટીસનો ઇતિહાસ છે?',
      'શું તમે ટૂંકા કે મધ્યમ ગાળામાં ગર્ભવતી થવા માગો છો?',
    ],
    preparationTitle: 'મુલાકાત પહેલાં એક નાની સલાહ',
    preparationText: 'શક્ય હોય તો તમારા છેલ્લા માસિકની તારીખો, તમારાં ચક્રની અંદાજિત લંબાઈ, તમે નોંધેલાં લક્ષણો અને તમે લેતા હો તે કોઈ સારવાર કે પૂરક નોંધી રાખો.',
    summaryTitle: 'તપાસના મુખ્ય મુદ્દા',
    summaryItems: [
      'નિદાન ઘણાં પરિબળો પર આધારિત છે, એક જ પરીક્ષણ પર નહીં.',
      'લોહીની તપાસ કેટલાક હોર્મોનના અસંતુલનને શોધી શકે છે અને અન્ય કારણોને બાકાત કરી શકે છે.',
      'પરિસ્થિતિ પ્રમાણે સોનોગ્રાફી તપાસને પૂર્ણ કરી શકે છે.',
      'પરિણામોનું અર્થઘટન હંમેશાં આરોગ્ય વ્યાવસાયિકે કરવું જોઈએ.',
    ],
    finalTipTitle: 'મુખ્ય મુદ્દા',
    finalTipText: 'PCOS ની તપાસ કોઈ એક પરીક્ષણ કે અંતિમ ચુકાદો નથી. તે તમારા હોર્મોનના કાર્યને સમજવામાં, અન્ય સંભવિત કારણો શોધવામાં અને તમારી પરિસ્થિતિને અનુરૂપ સારવાર ગોઠવવામાં મદદ કરે છે.',
    disclaimerText: 'આ લેખ માત્ર માહિતી માટે છે અને તબીબી પરામર્શ અથવા તમારાં પરીક્ષણોનાં પરિણામોના વ્યક્તિગત અર્થઘટનનું સ્થાન લેતો નથી.',
    shareMessage: 'PCOS નું નિદાન: પરીક્ષણો અને તપાસ — AWA',
  },
  pa: {
    badge: 'PCOS',
    title: 'PCOS ਦੀ ਤਸ਼ਖ਼ੀਸ:\nਟੈਸਟ ਅਤੇ ਜਾਂਚ',
    metaDuration: '7 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਗਾਈਡ',
    metaLevel: 'ਦਰਮਿਆਨਾ ਪੱਧਰ',
    metaValidated: 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ',
    intro: 'PCOS ਦੀ ਤਸ਼ਖ਼ੀਸ ਕਿਵੇਂ ਹੁੰਦੀ ਹੈ, ਕਿਹੜੇ ਟੈਸਟ ਸੁਝਾਏ ਜਾ ਸਕਦੇ ਹਨ, ਅਤੇ ਆਪਣੀ ਮੁਲਾਕਾਤ ਲਈ ਸ਼ਾਂਤੀ ਨਾਲ ਤਿਆਰੀ ਕਿਵੇਂ ਕਰੀਏ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      'ਤਸ਼ਖ਼ੀਸ ਦੀ ਜਾਂਚ ਨੂੰ ਸਮਝਣਾ',
      'ਜਾਂਚ ਦੇ ਮੁੱਖ ਪੜਾਅ',
      'ਹਾਰਮੋਨਾਂ ਦਾ ਖ਼ੂਨ ਟੈਸਟ',
      'ਪੇਲਵਿਕ ਅਲਟਰਾਸਾਊਂਡ',
      'ਤਸ਼ਖ਼ੀਸ ਤੁਹਾਨੂੰ ਕੀ ਨਹੀਂ ਦੱਸਦੀ',
      'ਆਪਣੀ ਮੁਲਾਕਾਤ ਦੀ ਤਿਆਰੀ',
      'ਮੁੱਖ ਨੁਕਤੇ',
    ],
    section1Body1: 'ਪੋਲੀਸਿਸਟਿਕ ਓਵਰੀ ਸਿੰਡਰੋਮ ਦੀ ਤਸ਼ਖ਼ੀਸ ਕਿਸੇ ਇੱਕ ਟੈਸਟ \'ਤੇ ਨਿਰਭਰ ਨਹੀਂ ਕਰਦੀ। ਸਿਹਤ ਮਾਹਿਰ ਕਈ ਜਾਣਕਾਰੀਆਂ ਨੂੰ ਇਕੱਠਾ ਕਰਦਾ ਹੈ: ਤੁਹਾਡੇ ਚੱਕਰ ਦਾ ਇਤਿਹਾਸ, ਕੋਈ ਲੱਛਣ, ਸਰੀਰਕ ਜਾਂਚ, ਪ੍ਰਯੋਗਸ਼ਾਲਾ ਦੇ ਟੈਸਟ, ਅਤੇ ਸਥਿਤੀ ਮੁਤਾਬਕ ਅਲਟਰਾਸਾਊਂਡ।',
    section1Body2: 'ਮਕਸਦ ਇੱਕੋ ਸਮੇਂ PCOS ਨਾਲ ਮੇਲ ਖਾਂਦੇ ਲੱਛਣਾਂ ਨੂੰ ਲੱਭਣਾ ਅਤੇ ਹੋਰ ਕਾਰਨਾਂ ਨੂੰ ਰੱਦ ਕਰਨਾ ਹੈ ਜੋ ਬੇਨਿਯਮਿਤ ਮਾਹਵਾਰੀ ਜਾਂ ਕੁਝ ਹਾਰਮੋਨੀ ਲੱਛਣਾਂ ਦੀ ਵਿਆਖਿਆ ਕਰ ਸਕਦੇ ਹਨ।',
    tip1Title: 'ਜਾਣਨ ਯੋਗ',
    tip1Text: 'ਤਸ਼ਖ਼ੀਸ ਹਮੇਸ਼ਾ ਹਰ ਵਿਅਕਤੀ ਮੁਤਾਬਕ ਹੁੰਦੀ ਹੈ। PCOS ਵਾਲੀਆਂ ਦੋ ਔਰਤਾਂ ਦੇ ਲੱਛਣ ਅਤੇ ਟੈਸਟ ਦੇ ਨਤੀਜੇ ਬਹੁਤ ਵੱਖਰੇ ਹੋ ਸਕਦੇ ਹਨ।',
    section2Body: 'ਜਾਂਚ ਕਈ ਪੜਾਵਾਂ ਵਿੱਚ ਹੋ ਸਕਦੀ ਹੈ। ਜ਼ਰੂਰੀ ਨਹੀਂ ਕਿ ਇਹ ਸਾਰੇ ਹਰ ਕਿਸੇ ਲਈ ਇੱਕੋ ਢੰਗ ਨਾਲ ਕੀਤੇ ਜਾਣ।',
    diagnosisSteps: [
      {title: 'ਇਤਿਹਾਸ ਲੈਣਾ', text: 'ਮਾਹਿਰ ਤੁਹਾਡਾ ਇਤਿਹਾਸ ਇਕੱਠਾ ਕਰਦਾ ਹੈ: ਚੱਕਰ, ਲੱਛਣ, ਡਾਕਟਰੀ ਪਿਛੋਕੜ ਅਤੇ ਇਲਾਜ।'},
      {title: 'ਸਰੀਰਕ ਜਾਂਚ', text: 'ਉਹ ਖ਼ਾਸ ਤੌਰ \'ਤੇ ਐਂਡਰੋਜਨ ਦੀ ਵਾਧੂ ਮਾਤਰਾ ਦੇ ਸੰਕੇਤ ਲੱਭਦੇ ਹਨ ਅਤੇ ਤੁਹਾਡੀ ਸਮੁੱਚੀ ਹਾਲਤ ਦਾ ਜਾਇਜ਼ਾ ਲੈਂਦੇ ਹਨ।'},
      {title: 'ਖ਼ੂਨ ਦੀ ਜਾਂਚ', text: 'ਸਥਿਤੀ ਨੂੰ ਸਪੱਸ਼ਟ ਕਰਨ ਲਈ ਹਾਰਮੋਨਾਂ ਅਤੇ ਮੈਟਾਬੋਲਿਜ਼ਮ ਦੇ ਟੈਸਟ ਮੰਗੇ ਜਾ ਸਕਦੇ ਹਨ।'},
      {title: 'ਅਲਟਰਾਸਾਊਂਡ', text: 'ਇਹ ਅੰਡਕੋਸ਼ਾਂ ਦੀ ਬਣਤਰ ਦੇਖ ਕੇ ਜਾਂਚ ਨੂੰ ਪੂਰਾ ਕਰ ਸਕਦਾ ਹੈ।'},
    ],
    flowTitle: 'ਇੱਕ ਨਜ਼ਰ ਵਿੱਚ ਪ੍ਰਕਿਰਿਆ',
    flowItems: [
      'ਇਤਿਹਾਸ ਅਤੇ ਲੱਛਣ',
      'ਸਰੀਰਕ ਜਾਂਚ',
      'ਸਥਿਤੀ ਮੁਤਾਬਕ ਟੈਸਟ',
      'ਲੋੜ ਪੈਣ \'ਤੇ ਅਲਟਰਾਸਾਊਂਡ',
    ],
    section3Body1: 'ਖ਼ੂਨ ਦਾ ਟੈਸਟ ਐਂਡਰੋਜਨ ਦੀ ਵਾਧੂ ਮਾਤਰਾ ਦੇ ਸੰਕੇਤ ਲੱਭਣ, ਪ੍ਰਜਨਨ ਕਾਰਜ ਵਿੱਚ ਸ਼ਾਮਲ ਕੁਝ ਹਾਰਮੋਨਾਂ ਦਾ ਜਾਇਜ਼ਾ ਲੈਣ, ਅਤੇ ਤੁਹਾਡੇ ਲੱਛਣਾਂ ਦੇ ਹੋਰ ਸੰਭਵ ਕਾਰਨ ਲੱਭਣ ਲਈ ਸੁਝਾਇਆ ਜਾ ਸਕਦਾ ਹੈ।',
    section3Body2: 'ਚੁਣੇ ਜਾਣ ਵਾਲੇ ਟੈਸਟ ਤੁਹਾਡੀ ਉਮਰ, ਲੱਛਣਾਂ, ਡਾਕਟਰੀ ਇਤਿਹਾਸ ਅਤੇ ਮਾਹਿਰ ਜੋ ਜਾਂਚਣਾ ਚਾਹੁੰਦਾ ਹੈ ਉਸ \'ਤੇ ਨਿਰਭਰ ਕਰਦੇ ਹਨ।',
    bloodTests: [
      {title: 'ਐਂਡਰੋਜਨ', text: 'ਟੈਸਟੋਸਟੀਰੋਨ ਅਤੇ ਸਥਿਤੀ ਮੁਤਾਬਕ ਹੋਰ ਹਾਰਮੋਨ।'},
      {title: 'ਥਾਇਰਾਇਡ ਦਾ ਕੰਮ', text: 'ਬੇਨਿਯਮਿਤ ਚੱਕਰਾਂ ਦੇ ਕੁਝ ਕਾਰਨਾਂ ਨੂੰ ਖ਼ਾਸ ਤੌਰ \'ਤੇ ਰੱਦ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।'},
      {title: 'ਮੈਟਾਬੋਲਿਕ ਜਾਂਚ', text: 'ਖ਼ੂਨ ਵਿੱਚ ਗਲੂਕੋਜ਼, ਕਈ ਵਾਰ ਜੋਖ਼ਮ ਦੇ ਕਾਰਕਾਂ ਮੁਤਾਬਕ ਚਰਬੀ ਦੀ ਜਾਂਚ।'},
    ],
    alertTitle: 'ਜ਼ਰੂਰੀ',
    alertText: 'ਹਾਰਮੋਨਾਂ ਦੇ ਨਤੀਜਿਆਂ ਨੂੰ ਸਰੀਰਕ ਹਾਲਾਤ ਦੇ ਨਾਲ ਮਿਲਾ ਕੇ ਸਮਝਣਾ ਚਾਹੀਦਾ ਹੈ। ਇਕੱਲਾ ਇੱਕ ਮੁੱਲ ਆਮ ਤੌਰ \'ਤੇ PCOS ਦੀ ਤਸ਼ਖ਼ੀਸ ਕਰਨ ਲਈ ਕਾਫ਼ੀ ਨਹੀਂ ਹੁੰਦਾ।',
    section4Body: 'ਅਲਟਰਾਸਾਊਂਡ ਨਾਲ ਅੰਡਕੋਸ਼ਾਂ ਦੀ ਬਣਤਰ ਦੇਖੀ ਜਾ ਸਕਦੀ ਹੈ ਅਤੇ ਖ਼ਾਸ ਤੌਰ \'ਤੇ ਛੋਟੇ ਫੋਲੀਕਲਾਂ ਦੀ ਵੱਧ ਗਿਣਤੀ ਲੱਭੀ ਜਾ ਸਕਦੀ ਹੈ। ਇਹ ਮਾਹਿਰ ਨੂੰ ਉਨ੍ਹਾਂ ਹੋਰ ਕਾਰਕਾਂ ਨੂੰ ਵੀ ਲੱਭਣ ਦਿੰਦਾ ਹੈ ਜੋ ਕੁਝ ਲੱਛਣਾਂ ਦੀ ਵਿਆਖਿਆ ਕਰ ਸਕਦੇ ਹਨ।',
    tip2Title: 'ਜਾਣਨ ਯੋਗ',
    tip2Text: 'ਅਲਟਰਾਸਾਊਂਡ ਵਿੱਚ ਬਹੁਤ ਸਾਰੇ ਫੋਲੀਕਲ ਦਿਸਣ ਦਾ ਮਤਲਬ ਆਪਣੇ-ਆਪ ਇਹ ਨਹੀਂ ਕਿ ਤੁਹਾਨੂੰ PCOS ਹੈ। ਨਤੀਜੇ ਨੂੰ ਬਾਕੀ ਜਾਂਚ ਦੇ ਨਾਲ ਮਿਲਾ ਕੇ ਸਮਝਣਾ ਚਾਹੀਦਾ ਹੈ।',
    section5Body: 'PCOS ਦੀ ਤਸ਼ਖ਼ੀਸ ਮਿਲਣ ਨਾਲ ਇਹ ਪੱਕਾ ਅੰਦਾਜ਼ਾ ਲਾਉਣਾ ਸੰਭਵ ਨਹੀਂ ਹੁੰਦਾ ਕਿ ਤੁਹਾਡੇ ਲਈ ਅੱਗੇ ਕੀ ਹੋਵੇਗਾ। ਇਹ ਸਿੰਡਰੋਮ ਇੱਕ ਵਿਅਕਤੀ ਤੋਂ ਦੂਜੇ ਵਿੱਚ ਬਹੁਤ ਵੱਖਰੇ ਢੰਗ ਨਾਲ ਸਾਹਮਣੇ ਆ ਸਕਦਾ ਹੈ।',
    mythItems: [
      'PCOS ਦਾ ਆਪਣੇ-ਆਪ ਮਤਲਬ ਬਾਂਝਪਨ ਨਹੀਂ ਹੈ।',
      'PCOS ਦਾ ਮਤਲਬ ਜ਼ਰੂਰੀ ਤੌਰ \'ਤੇ ਗਿਲਟੀਆਂ ਹੋਣਾ ਨਹੀਂ ਹੈ।',
      'ਸਿਰਫ਼ ਤਸ਼ਖ਼ੀਸ ਇਲਾਜ ਤੈਅ ਨਹੀਂ ਕਰਦੀ।',
      'ਆਮ ਅਲਟਰਾਸਾਊਂਡ ਜ਼ਰੂਰੀ ਤੌਰ \'ਤੇ PCOS ਨੂੰ ਰੱਦ ਨਹੀਂ ਕਰਦਾ।',
    ],
    section6Body: 'ਪਹਿਲਾਂ ਤੋਂ ਤਿਆਰ ਕੀਤੀ ਕੁਝ ਜਾਣਕਾਰੀ ਮਾਹਿਰ ਨੂੰ ਤੁਹਾਡਾ ਇਤਿਹਾਸ ਸਮਝਣ ਅਤੇ ਸਭ ਤੋਂ ਢੁਕਵੇਂ ਟੈਸਟ ਚੁਣਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦੀ ਹੈ।',
    appointmentQuestions: [
      'ਤੁਹਾਡੇ ਚੱਕਰ ਕਿੰਨੇ ਸਮੇਂ ਤੋਂ ਬੇਨਿਯਮਿਤ ਹਨ?',
      'ਕੀ ਤੁਸੀਂ ਮੁਹਾਸੇ, ਅਸਾਧਾਰਨ ਵਾਲਾਂ ਦਾ ਵਧਣਾ ਜਾਂ ਵਾਲ ਝੜਨਾ ਦੇਖਿਆ ਹੈ?',
      'ਕੀ ਪਰਿਵਾਰ ਵਿੱਚ PCOS ਜਾਂ ਸ਼ੂਗਰ ਦਾ ਇਤਿਹਾਸ ਹੈ?',
      'ਕੀ ਤੁਸੀਂ ਥੋੜ੍ਹੇ ਜਾਂ ਦਰਮਿਆਨੇ ਸਮੇਂ ਵਿੱਚ ਗਰਭਵਤੀ ਹੋਣਾ ਚਾਹੁੰਦੇ ਹੋ?',
    ],
    preparationTitle: 'ਮੁਲਾਕਾਤ ਤੋਂ ਪਹਿਲਾਂ ਇੱਕ ਛੋਟੀ ਸਲਾਹ',
    preparationText: 'ਜੇ ਹੋ ਸਕੇ ਤਾਂ ਆਪਣੀ ਪਿਛਲੀ ਮਾਹਵਾਰੀ ਦੀਆਂ ਤਾਰੀਖ਼ਾਂ, ਆਪਣੇ ਚੱਕਰਾਂ ਦੀ ਅੰਦਾਜ਼ਨ ਲੰਬਾਈ, ਜੋ ਲੱਛਣ ਤੁਸੀਂ ਦੇਖ ਰਹੇ ਹੋ, ਅਤੇ ਕੋਈ ਵੀ ਇਲਾਜ ਜਾਂ ਸਪਲੀਮੈਂਟ ਜੋ ਤੁਸੀਂ ਲੈ ਰਹੇ ਹੋ, ਲਿਖ ਲਓ।',
    summaryTitle: 'ਜਾਂਚ ਦੀਆਂ ਮੁੱਖ ਗੱਲਾਂ',
    summaryItems: [
      'ਤਸ਼ਖ਼ੀਸ ਕਈ ਕਾਰਕਾਂ \'ਤੇ ਆਧਾਰਿਤ ਹੁੰਦੀ ਹੈ, ਕਿਸੇ ਇੱਕ ਟੈਸਟ \'ਤੇ ਨਹੀਂ।',
      'ਖ਼ੂਨ ਦਾ ਟੈਸਟ ਕੁਝ ਹਾਰਮੋਨੀ ਅਸੰਤੁਲਨ ਲੱਭ ਸਕਦਾ ਹੈ ਅਤੇ ਹੋਰ ਕਾਰਨਾਂ ਨੂੰ ਰੱਦ ਕਰ ਸਕਦਾ ਹੈ।',
      'ਸਥਿਤੀ ਮੁਤਾਬਕ ਅਲਟਰਾਸਾਊਂਡ ਜਾਂਚ ਨੂੰ ਪੂਰਾ ਕਰ ਸਕਦਾ ਹੈ।',
      'ਨਤੀਜਿਆਂ ਨੂੰ ਹਮੇਸ਼ਾ ਕਿਸੇ ਸਿਹਤ ਮਾਹਿਰ ਤੋਂ ਸਮਝਵਾਉਣਾ ਚਾਹੀਦਾ ਹੈ।',
    ],
    finalTipTitle: 'ਮੁੱਖ ਨੁਕਤੇ',
    finalTipText: 'PCOS ਦੀ ਜਾਂਚ ਕੋਈ ਇੱਕ ਟੈਸਟ ਜਾਂ ਆਖ਼ਰੀ ਫ਼ੈਸਲਾ ਨਹੀਂ ਹੈ। ਇਹ ਤੁਹਾਨੂੰ ਆਪਣੇ ਹਾਰਮੋਨਾਂ ਦੇ ਕੰਮ ਨੂੰ ਸਮਝਣ, ਹੋਰ ਸੰਭਵ ਕਾਰਨ ਲੱਭਣ, ਅਤੇ ਆਪਣੀ ਸਥਿਤੀ ਮੁਤਾਬਕ ਢੁਕਵੀਂ ਦੇਖਭਾਲ ਬਣਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰਦੀ ਹੈ।',
    disclaimerText: 'ਇਹ ਲੇਖ ਸਿਰਫ਼ ਜਾਣਕਾਰੀ ਲਈ ਹੈ ਅਤੇ ਡਾਕਟਰੀ ਸਲਾਹ-ਮਸ਼ਵਰੇ ਜਾਂ ਤੁਹਾਡੇ ਟੈਸਟ ਨਤੀਜਿਆਂ ਦੀ ਨਿੱਜੀ ਵਿਆਖਿਆ ਦੀ ਥਾਂ ਨਹੀਂ ਲੈਂਦਾ।',
    shareMessage: 'PCOS ਦੀ ਤਸ਼ਖ਼ੀਸ: ਟੈਸਟ ਅਤੇ ਜਾਂਚ — AWA',
  },
  my: {
    badge: 'PCOS',
    title: 'PCOS ရောဂါရှာဖွေခြင်း၊\nစစ်ဆေးမှုများနှင့် စစ်ဆေးအဆင့်များ',
    metaDuration: 'ဖတ်ချိန် 7 မိနစ်',
    metaType: 'လမ်းညွှန်',
    metaLevel: 'အလယ်အလတ်အဆင့်',
    metaValidated: 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ',
    intro: 'PCOS ကို မည်သို့ ရောဂါရှာဖွေသည်၊ မည်သည့်စစ်ဆေးမှုများ အကြံပြုနိုင်သည်၊ သင့်ဆရာဝန်ချိန်းဆိုမှုအတွက် စိတ်ငြိမ်သက်စွာ မည်သို့ ပြင်ဆင်ရမည်ကို ဖော်ပြထားသည်။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'ရောဂါရှာဖွေရေး စစ်ဆေးမှုကို နားလည်ခြင်း',
      'စစ်ဆေးမှု၏ အဓိကအဆင့်များ',
      'ဟော်မုန်း သွေးစစ်ဆေးမှု',
      'တင်ပါးဆုံ အယ်ထရာဆောင်း',
      'ရောဂါရှာဖွေချက်က မပြောပြနိုင်သည့်အရာများ',
      'ဆရာဝန်ချိန်းဆိုမှုအတွက် ပြင်ဆင်ခြင်း',
      'အဓိကအချက်များ',
    ],
    section1Body1: 'သားဥအိမ်အိတ်ကလေးများစွာဖြစ်စေသော ရောဂါလက္ခဏာစုကို ရောဂါရှာဖွေခြင်းသည် စစ်ဆေးမှုတစ်ခုတည်းအပေါ် မမူတည်ပါ။ ကျန်းမာရေးပညာရှင်က သင့်ရာသီစက်ဝန်းမှတ်တမ်း၊ လက္ခဏာများ၊ ကိုယ်ထူကိုယ်ထ စစ်ဆေးမှု၊ ဓာတ်ခွဲခန်းစစ်ဆေးမှုများနှင့် အခြေအနေအလိုက် အယ်ထရာဆောင်းတို့ကဲ့သို့ အချက်အလက်များစွာကို ပေါင်းစပ်သုံးသပ်သည်။',
    section1Body2: 'ရည်ရွယ်ချက်မှာ PCOS နှင့် ကိုက်ညီသော လက္ခဏာများကို ရှာဖွေရန်နှင့် ရာသီမမှန်ခြင်း သို့မဟုတ် ဟော်မုန်းဆိုင်ရာ လက္ခဏာအချို့ကို ရှင်းပြနိုင်သည့် အခြားအကြောင်းရင်းများကို ဖယ်ရှားရန် နှစ်ရပ်စလုံး ဖြစ်သည်။',
    tip1Title: 'သိထားသင့်သည်',
    tip1Text: 'ရောဂါရှာဖွေချက်သည် အမြဲတမ်း လူတစ်ဦးချင်းစီနှင့် ကိုက်ညီအောင် ပြုလုပ်သည်။ PCOS ရှိသော အမျိုးသမီးနှစ်ဦးတွင် လက္ခဏာများနှင့် စစ်ဆေးမှုရလဒ်များ အလွန်ကွဲပြားနိုင်သည်။',
    section2Body: 'စစ်ဆေးမှုသည် အဆင့်များစွာ ရှိနိုင်သည်။ ၎င်းတို့ကို လူတိုင်းအတွက် တူညီစွာ ပြုလုပ်ရန် မလိုအပ်ပါ။',
    diagnosisSteps: [
      {title: 'ကျန်းမာရေးမှတ်တမ်း မေးမြန်းခြင်း', text: 'ပညာရှင်က သင့်ရာသီစက်ဝန်းများ၊ လက္ခဏာများ၊ ဆေးဘက်ဆိုင်ရာ နောက်ခံနှင့် ကုသမှုများကို မေးမြန်းသည်။'},
      {title: 'ကိုယ်ထူကိုယ်ထ စစ်ဆေးခြင်း', text: 'အထူးသဖြင့် အန်ဒရိုဂျင် ပိုလွန်ခြင်း လက္ခဏာများကို ရှာဖွေပြီး သင့်ကျန်းမာရေးအခြေအနေကို ယေဘုယျ အကဲဖြတ်သည်။'},
      {title: 'သွေးစစ်ဆေးခြင်း', text: 'အခြေအနေကို ရှင်းလင်းရန် ဟော်မုန်းနှင့် ဇီဝဖြစ်စဉ်ဆိုင်ရာ စစ်ဆေးမှုများ တောင်းဆိုနိုင်သည်။'},
      {title: 'အယ်ထရာဆောင်း', text: 'သားဥအိမ်များ၏ ပုံပန်းသဏ္ဌာန်ကို ကြည့်ရှုခြင်းဖြင့် စစ်ဆေးမှုကို ဖြည့်စွက်နိုင်သည်။'},
    ],
    flowTitle: 'လုပ်ငန်းစဉ်အကျဉ်း',
    flowItems: [
      'ကျန်းမာရေးမှတ်တမ်းနှင့် လက္ခဏာများ',
      'ကိုယ်ထူကိုယ်ထ စစ်ဆေးခြင်း',
      'အခြေအနေအလိုက် စစ်ဆေးမှုများ',
      'လိုအပ်ပါက အယ်ထရာဆောင်း',
    ],
    section3Body1: 'အန်ဒရိုဂျင် ပိုလွန်ခြင်း လက္ခဏာများကို ရှာဖွေရန်၊ မျိုးပွားစနစ်နှင့် သက်ဆိုင်သော ဟော်မုန်းအချို့ကို အကဲဖြတ်ရန်နှင့် သင့်လက္ခဏာများ၏ အခြားဖြစ်နိုင်သော အကြောင်းရင်းများကို ရှာဖွေရန် သွေးစစ်ဆေးမှုတစ်ခု အကြံပြုနိုင်သည်။',
    section3Body2: 'ရွေးချယ်သော စစ်ဆေးမှုများသည် သင့်အသက်အရွယ်၊ လက္ခဏာများ၊ ဆေးဘက်ဆိုင်ရာ ကျန်းမာရေးမှတ်တမ်းနှင့် ပညာရှင်က စစ်ဆေးလိုသည့်အရာတို့အပေါ် မူတည်သည်။',
    bloodTests: [
      {title: 'အန်ဒရိုဂျင်များ', text: 'အခြေအနေအလိုက် တက်စတိုစတီရုန်းနှင့် အခြားဟော်မုန်းများ။'},
      {title: 'သိုင်းရွိုက်လုပ်ငန်းဆောင်တာ', text: 'ရာသီစက်ဝန်း မမှန်ခြင်း၏ အချို့အကြောင်းရင်းများကို ဖယ်ရှားရာတွင် အထူးအထောက်အကူဖြစ်သည်။'},
      {title: 'ဇီဝဖြစ်စဉ်ဆိုင်ရာ စစ်ဆေးမှု', text: 'သွေးထဲရှိ သကြားဓာတ်၊ အန္တရာယ်အချက်များအလိုက် တခါတရံ အဆီဓာတ်စစ်ဆေးမှု။'},
    ],
    alertTitle: 'အရေးကြီးသည်',
    alertText: 'ဟော်မုန်းရလဒ်များကို ဆေးဘက်ဆိုင်ရာ အခြေအနေနှင့်အတူ ဖော်ပြဆိုရမည်။ တန်ဖိုးတစ်ခုတည်းသည် PCOS ရောဂါရှာဖွေချက်ကို ကောက်ချက်ချရန် များသောအားဖြင့် မလုံလောက်ပါ။',
    section4Body: 'အယ်ထရာဆောင်းကို သားဥအိမ်များ၏ ပုံပန်းသဏ္ဌာန်ကို ကြည့်ရှုရန်နှင့် အထူးသဖြင့် အိတ်ကလေးငယ်များ အရေအတွက်များနေခြင်းကို ရှာဖွေရန် အသုံးပြုနိုင်သည်။ ၎င်းသည် လက္ခဏာအချို့ကို ရှင်းပြနိုင်သည့် အခြားအချက်များကိုလည်း ပညာရှင်က ရှာဖွေနိုင်စေသည်။',
    tip2Title: 'သိထားသင့်သည်',
    tip2Text: 'အယ်ထရာဆောင်းတွင် အိတ်ကလေးများစွာ တွေ့ရခြင်းသည် PCOS ရှိသည်ဟု အလိုအလျောက် မဆိုလိုပါ။ ရလဒ်ကို အခြားစစ်ဆေးမှုများနှင့်အတူ ဖော်ပြဆိုရမည်။',
    section5Body: 'PCOS ရောဂါရှာဖွေချက် ရရှိခြင်းက သင့်အတွက် အခြေအနေများ မည်သို့ဆက်လက်ဖြစ်ပေါ်မည်ကို တိတိကျကျ ခန့်မှန်းနိုင်စေခြင်း မရှိပါ။ ဤရောဂါလက္ခဏာစုသည် လူတစ်ဦးနှင့်တစ်ဦး အလွန်ကွဲပြားစွာ ပေါ်လာနိုင်သည်။',
    mythItems: [
      'PCOS သည် သားမမွေးနိုင်ခြင်းကို အလိုအလျောက် မဆိုလိုပါ။',
      'PCOS သည် အိတ်ကလေးများ ရှိရမည်ဟု မဆိုလိုပါ။',
      'ရောဂါရှာဖွေချက်တစ်ခုတည်းက ကုသမှုကို မဆုံးဖြတ်ပါ။',
      'ပုံမှန် အယ်ထရာဆောင်းရလဒ်သည် PCOS မရှိဟု မဆိုလိုပါ။',
    ],
    section6Body: 'ကြိုတင်ပြင်ဆင်ထားသော အချက်အလက်အနည်းငယ်က သင့်ကျန်းမာရေးမှတ်တမ်းကို ပညာရှင်နားလည်ရန်နှင့် အသင့်လျော်ဆုံး စစ်ဆေးမှုများ ရွေးချယ်ရန် ကူညီနိုင်သည်။',
    appointmentQuestions: [
      'သင့်ရာသီစက်ဝန်းများ မည်မျှကြာ မမှန်ခဲ့သနည်း။',
      'ဝက်ခြံ၊ ပုံမှန်မဟုတ်သော ဆံပင်ပေါက်ခြင်း သို့မဟုတ် ဆံပင်ကျွတ်ခြင်း တွေ့ရှိခဲ့ပါသလား။',
      'မိသားစုတွင် PCOS သို့မဟုတ် ဆီးချိုရောဂါ ရှိပါသလား။',
      'တိုတောင်းသော သို့မဟုတ် အလယ်အလတ်ကာလအတွင်း ကိုယ်ဝန်ရလိုပါသလား။',
    ],
    preparationTitle: 'ဆရာဝန်ချိန်းဆိုမှုမတိုင်မီ အကြံပြုချက်အနည်းငယ်',
    preparationText: 'ဖြစ်နိုင်ပါက နောက်ဆုံးရာသီလာသည့်ရက်၊ ရာသီစက်ဝန်းများ၏ ခန့်မှန်းကြာချိန်၊ သင်သတိပြုမိသော လက္ခဏာများနှင့် သောက်သုံးနေသော ကုသမှု သို့မဟုတ် အားဖြည့်စာများကို မှတ်ထားပါ။',
    summaryTitle: 'စစ်ဆေးမှု၏ အဓိကအချက်များ',
    summaryItems: [
      'ရောဂါရှာဖွေချက်သည် စစ်ဆေးမှုတစ်ခုတည်းမဟုတ်ဘဲ အချက်များစွာအပေါ် အခြေခံသည်။',
      'သွေးစစ်ဆေးမှုက ဟော်မုန်းမညီမျှမှုအချို့ကို ရှာဖွေနိုင်ပြီး အခြားအကြောင်းရင်းများကို ဖယ်ရှားနိုင်သည်။',
      'အခြေအနေအလိုက် အယ်ထရာဆောင်းက စစ်ဆေးမှုကို ဖြည့်စွက်နိုင်သည်။',
      'ရလဒ်များကို ကျန်းမာရေးပညာရှင်က အမြဲဖော်ပြဆိုသင့်သည်။',
    ],
    finalTipTitle: 'အဓိကအချက်များ',
    finalTipText: 'PCOS စစ်ဆေးမှုသည် စစ်ဆေးမှုတစ်ခုတည်း သို့မဟုတ် နောက်ဆုံးစီရင်ချက် မဟုတ်ပါ။ ၎င်းသည် သင့်ဟော်မုန်းလုပ်ငန်းဆောင်တာကို နားလည်ရန်၊ အခြားဖြစ်နိုင်သော အကြောင်းရင်းများကို ရှာဖွေရန်နှင့် သင့်အခြေအနေနှင့် ကိုက်ညီသော စောင့်ရှောက်မှုကို တည်ဆောက်ရန် ကူညီပေးသည်။',
    disclaimerText: 'ဤဆောင်းပါးသည် အချက်အလက်ပေးရန်သာ ဖြစ်ပြီး ဆေးဘက်ဆိုင်ရာ ပြသမှု သို့မဟုတ် သင့်စစ်ဆေးမှုရလဒ်များ၏ ကိုယ်ပိုင်ဖော်ပြဆိုချက်ကို အစားထိုးခြင်းမရှိပါ။',
    shareMessage: 'PCOS ရောဂါရှာဖွေခြင်း၊ စစ်ဆေးမှုများနှင့် စစ်ဆေးအဆင့်များ — AWA',
  },
  km: {
    badge: 'PCOS',
    title: 'ការធ្វើរោគវិនិច្ឆ័យ PCOS៖\nតេស្ត និងការពិនិត្យ',
    metaDuration: 'អាន 7 នាទី',
    metaType: 'មគ្គុទ្ទេសក៍',
    metaLevel: 'កម្រិតមធ្យម',
    metaValidated: 'មាតិកាបានពិនិត្យ',
    intro: 'របៀបដែល PCOS ត្រូវបានធ្វើរោគវិនិច្ឆ័យ តេស្តអ្វីខ្លះដែលអាចត្រូវបានស្នើ និងរបៀបរៀបចំខ្លួនដោយស្ងប់ស្ងាត់សម្រាប់ការណាត់ជួបរបស់អ្នក។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'ការយល់ដឹងអំពីការពិនិត្យរោគវិនិច្ឆ័យ',
      'ជំហានសំខាន់ៗនៃការពិនិត្យ',
      'តេស្តឈាមអរម៉ូន',
      'អ៊ុលត្រាសោនអាងត្រគាក',
      'អ្វីដែលរោគវិនិច្ឆ័យមិនប្រាប់អ្នក',
      'ការរៀបចំខ្លួនសម្រាប់ការណាត់ជួបរបស់អ្នក',
      'ចំណុចសំខាន់ៗ',
    ],
    section1Body1: 'ការធ្វើរោគវិនិច្ឆ័យរោគសញ្ញាពងអូវែមានពងបែកច្រើន មិនពឹងផ្អែកលើតេស្តតែមួយទេ។ អ្នកជំនាញសុខាភិបាលប្រមូលព័ត៌មានជាច្រើនបញ្ចូលគ្នា៖ ប្រវត្តិវដ្តរដូវរបស់អ្នក រោគសញ្ញាណាមួយ ការពិនិត្យរាងកាយ តេស្តមន្ទីរពិសោធន៍ ហើយអាស្រ័យលើស្ថានភាព មានអ៊ុលត្រាសោន។',
    section1Body2: 'គោលដៅគឺទាំងស្វែងរកលក្ខណៈដែលស្របនឹង PCOS និងដកចេញមូលហេតុផ្សេងទៀត ដែលអាចពន្យល់ពីរដូវមិនទៀងទាត់ ឬរោគសញ្ញាអរម៉ូនមួយចំនួន។',
    tip1Title: 'គួរដឹង',
    tip1Text: 'ការធ្វើរោគវិនិច្ឆ័យតែងតែធ្វើតាមលក្ខណៈផ្ទាល់ខ្លួន។ ស្ត្រីពីរនាក់ដែលមាន PCOS អាចមានរោគសញ្ញា និងលទ្ធផលតេស្តខុសគ្នាខ្លាំង។',
    section2Body: 'ការពិនិត្យអាចធ្វើតាមជំហានជាច្រើន។ ជំហានទាំងនេះមិនចាំបាច់ត្រូវបានអនុវត្តតាមរបៀបដូចគ្នាសម្រាប់មនុស្សគ្រប់គ្នាទេ។',
    diagnosisSteps: [
      {title: 'ការសាកសួរប្រវត្តិ', text: 'អ្នកជំនាញប្រមូលប្រវត្តិរបស់អ្នក៖ វដ្តរដូវ រោគសញ្ញា ប្រវត្តិវេជ្ជសាស្ត្រ និងការព្យាបាល។'},
      {title: 'ការពិនិត្យរាងកាយ', text: 'ពួកគេស្វែងរកជាពិសេសនូវសញ្ញានៃអង់ដ្រូហ្សែនលើស និងវាយតម្លៃស្ថានភាពទូទៅរបស់អ្នក។'},
      {title: 'តេស្តឈាម', text: 'តេស្តអរម៉ូន និងមេតាបូលីសអាចត្រូវបានស្នើ ដើម្បីបញ្ជាក់ពីស្ថានភាព។'},
      {title: 'អ៊ុលត្រាសោន', text: 'វាអាចបំពេញការពិនិត្យ ដោយសង្កេតរូបរាងរបស់ពងអូវែ។'},
    ],
    flowTitle: 'ដំណើរការមើលដោយសង្ខេប',
    flowItems: [
      'ប្រវត្តិ និងរោគសញ្ញា',
      'ការពិនិត្យរាងកាយ',
      'តេស្តអាស្រ័យលើស្ថានភាព',
      'អ៊ុលត្រាសោន ប្រសិនបើចាំបាច់',
    ],
    section3Body1: 'តេស្តឈាមអាចត្រូវបានស្នើ ដើម្បីស្វែងរកសញ្ញានៃអង់ដ្រូហ្សែនលើស វាយតម្លៃអរម៉ូនមួយចំនួនដែលពាក់ព័ន្ធនឹងមុខងារបន្តពូជ និងស្វែងរកមូលហេតុផ្សេងទៀតដែលអាចកើតមាននៃរោគសញ្ញារបស់អ្នក។',
    section3Body2: 'តេស្តដែលត្រូវបានជ្រើសរើសអាស្រ័យលើអាយុរបស់អ្នក រោគសញ្ញារបស់អ្នក ប្រវត្តិវេជ្ជសាស្ត្ររបស់អ្នក និងអ្វីដែលអ្នកជំនាញចង់ពិនិត្យ។',
    bloodTests: [
      {title: 'អង់ដ្រូហ្សែន', text: 'តេស្តូស្តេរ៉ូន និងអរម៉ូនផ្សេងទៀតអាស្រ័យលើស្ថានភាព។'},
      {title: 'មុខងារក្រពេញទីរ៉ូអ៊ីត', text: 'ជួយដកចេញជាពិសេសនូវមូលហេតុមួយចំនួននៃវដ្តរដូវមិនទៀងទាត់។'},
      {title: 'ការពិនិត្យមេតាបូលីស', text: 'ជាតិស្ករក្នុងឈាម ជួនកាលតេស្តខ្លាញ់ក្នុងឈាម អាស្រ័យលើកត្តាហានិភ័យ។'},
    ],
    alertTitle: 'សំខាន់',
    alertText: 'លទ្ធផលអរម៉ូនត្រូវបានបកស្រាយរួមជាមួយបរិបទគ្លីនិក។ តម្លៃតែមួយជាធម្មតាមិនគ្រប់គ្រាន់ដោយខ្លួនឯង ដើម្បីសន្និដ្ឋានរោគវិនិច្ឆ័យ PCOS ទេ។',
    section4Body: 'អ៊ុលត្រាសោនអាចត្រូវបានប្រើដើម្បីសង្កេតរូបរាងរបស់ពងអូវែ និងស្វែងរកជាពិសេសនូវចំនួនហ្វូលីគុលតូចៗច្រើន។ វាក៏អនុញ្ញាតឱ្យអ្នកជំនាញស្វែងរកកត្តាផ្សេងទៀតដែលអាចពន្យល់រោគសញ្ញាមួយចំនួន។',
    tip2Title: 'គួរដឹង',
    tip2Text: 'ការឃើញហ្វូលីគុលច្រើនលើអ៊ុលត្រាសោន មិនមានន័យថាអ្នកមាន PCOS ដោយស្វ័យប្រវត្តិទេ។ លទ្ធផលត្រូវបានបកស្រាយរួមជាមួយផ្នែកផ្សេងទៀតនៃការពិនិត្យ។',
    section5Body: 'ការទទួលបានរោគវិនិច្ឆ័យ PCOS មិនអាចទស្សន៍ទាយបានច្បាស់ថា អ្វីៗនឹងវិវត្តយ៉ាងណាសម្រាប់អ្នកទេ។ រោគសញ្ញានេះអាចបង្ហាញខុសគ្នាខ្លាំងពីមនុស្សម្នាក់ទៅម្នាក់។',
    mythItems: [
      'PCOS មិនមានន័យថាគ្មានកូនដោយស្វ័យប្រវត្តិទេ។',
      'PCOS មិនចាំបាច់មានន័យថាមានគ្រុំទេ។',
      'រោគវិនិច្ឆ័យតែម្យ៉ាងមិនកំណត់ការព្យាបាលទេ។',
      'អ៊ុលត្រាសោនធម្មតាមិនចាំបាច់ដកចេញ PCOS ទេ។',
    ],
    section6Body: 'ព័ត៌មានខ្លះដែលបានរៀបចំទុកជាមុនអាចជួយអ្នកជំនាញឱ្យយល់ប្រវត្តិរបស់អ្នក និងជ្រើសរើសតេស្តដែលពាក់ព័ន្ធបំផុត។',
    appointmentQuestions: [
      'តើវដ្តរដូវរបស់អ្នកមិនទៀងទាត់ប៉ុន្មានរយៈពេលហើយ?',
      'តើអ្នកបានកត់សម្គាល់មុន ការដុះរោមមិនធម្មតា ឬការជ្រុះសក់ទេ?',
      'តើមានប្រវត្តិគ្រួសារនៃ PCOS ឬជំងឺទឹកនោមផ្អែមទេ?',
      'តើអ្នកចង់មានផ្ទៃពោះក្នុងរយៈពេលខ្លី ឬមធ្យមទេ?',
    ],
    preparationTitle: 'គន្លឹះតូចមួយមុនពេលណាត់ជួប',
    preparationText: 'ប្រសិនបើអាច សូមកត់ត្រាកាលបរិច្ឆេទនៃរដូវចុងក្រោយរបស់អ្នក រយៈពេលប្រហាក់ប្រហែលនៃវដ្តរដូវរបស់អ្នក រោគសញ្ញាដែលអ្នកកត់សម្គាល់ និងការព្យាបាល ឬអាហារបំប៉នណាដែលអ្នកកំពុងប្រើ។',
    summaryTitle: 'ចំណុចសំខាន់នៃការពិនិត្យ',
    summaryItems: [
      'រោគវិនិច្ឆ័យពឹងផ្អែកលើកត្តាជាច្រើន មិនមែនតេស្តតែមួយទេ។',
      'តេស្តឈាមអាចស្វែងរកភាពមិនស្មើគ្នានៃអរម៉ូនមួយចំនួន និងដកចេញមូលហេតុផ្សេងទៀត។',
      'អ៊ុលត្រាសោនអាចបំពេញការពិនិត្យ អាស្រ័យលើស្ថានភាព។',
      'លទ្ធផលគួរតែត្រូវបានបកស្រាយដោយអ្នកជំនាញសុខាភិបាលជានិច្ច។',
    ],
    finalTipTitle: 'ចំណុចសំខាន់ៗ',
    finalTipText: 'ការពិនិត្យ PCOS មិនមែនជាតេស្តតែមួយ ឬសាលក្រមចុងក្រោយទេ។ វាជួយអ្នកឱ្យយល់ពីមុខងារអរម៉ូនរបស់អ្នក ស្វែងរកមូលហេតុផ្សេងទៀតដែលអាចកើតមាន និងកសាងការថែទាំដែលស័ក្តិសមនឹងស្ថានភាពរបស់អ្នក។',
    disclaimerText: 'អត្ថបទនេះសម្រាប់ព័ត៌មានប៉ុណ្ណោះ ហើយមិនជំនួសការពិគ្រោះផ្នែកវេជ្ជសាស្ត្រ ឬការបកស្រាយផ្ទាល់ខ្លួនអំពីលទ្ធផលតេស្តរបស់អ្នកទេ។',
    shareMessage: 'ការធ្វើរោគវិនិច្ឆ័យ PCOS៖ តេស្ត និងការពិនិត្យ — AWA',
  },
  lo: {
    badge: 'PCOS',
    title: 'ການວິນິດໄສ PCOS:\nການກວດ ແລະ ການປະເມີນ',
    metaDuration: 'ອ່ານ 7 ນາທີ',
    metaType: 'ຄູ່ມື',
    metaLevel: 'ລະດັບກາງ',
    metaValidated: 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ',
    intro: 'PCOS ຖືກວິນິດໄສແນວໃດ, ອາດມີການກວດຫຍັງແດ່ ແລະ ວິທີກະກຽມຕົວສຳລັບການນັດພົບຢ່າງສະຫງົບ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ເຂົ້າໃຈການປະເມີນເພື່ອວິນິດໄສ',
      'ຂັ້ນຕອນຫຼັກຂອງການປະເມີນ',
      'ການກວດເລືອດຮໍໂມນ',
      'ການກວດອັນຕຣາຊາວອຸ້ງເຊິງການ',
      'ສິ່ງທີ່ການວິນິດໄສບໍ່ໄດ້ບອກ',
      'ການກະກຽມສຳລັບການນັດພົບ',
      'ຈຸດສຳຄັນ',
    ],
    section1Body1: 'ການວິນິດໄສກຸ່ມອາການຮັງໄຂ່ຫຼາຍຖົງນ້ຳບໍ່ໄດ້ອີງໃສ່ການກວດຢ່າງດຽວ. ຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບຈະລວມຂໍ້ມູນຫຼາຍຢ່າງເຂົ້າກັນ: ປະຫວັດຮອບເດືອນຂອງທ່ານ, ອາການຕ່າງໆ, ການກວດຮ່າງກາຍ, ການກວດທາງຫ້ອງທົດລອງ ແລະ ຕາມສະຖານະການ ການກວດອັນຕຣາຊາວ.',
    section1Body2: 'ເປົ້າໝາຍແມ່ນທັງຊອກຫາລັກສະນະທີ່ສອດຄ່ອງກັບ PCOS ແລະ ຕັດສາເຫດອື່ນທີ່ອາດອະທິບາຍປະຈຳເດືອນທີ່ບໍ່ສະໝ່ຳສະເໝີ ຫຼື ອາການທາງຮໍໂມນບາງຢ່າງ.',
    tip1Title: 'ຄວນຮູ້',
    tip1Text: 'ການວິນິດໄສແມ່ນສະເພາະບຸກຄົນສະເໝີ. ຜູ້ຍິງສອງຄົນທີ່ມີ PCOS ອາດມີອາການ ແລະ ຜົນກວດທີ່ແຕກຕ່າງກັນຫຼາຍ.',
    section2Body: 'ການປະເມີນອາດມີຫຼາຍຂັ້ນຕອນ. ແຕ່ບໍ່ຈຳເປັນຕ້ອງເຮັດທຸກຂັ້ນຕອນຄືກັນສຳລັບທຸກຄົນ.',
    diagnosisSteps: [
      {title: 'ການສອບຖາມປະຫວັດ', text: 'ຜູ້ຊ່ຽວຊານສອບຖາມປະຫວັດຂອງທ່ານ: ຮອບເດືອນ, ອາການ, ປະຫວັດທາງການແພດ ແລະ ການຮັກສາ.'},
      {title: 'ການກວດຮ່າງກາຍ', text: 'ໂດຍສະເພາະຈະຊອກຫາອາການຂອງແອນໂດຣເຈັນທີ່ເກີນ ແລະ ປະເມີນສະພາບທົ່ວໄປຂອງທ່ານ.'},
      {title: 'ການກວດເລືອດ', text: 'ອາດມີການຂໍກວດຮໍໂມນ ແລະ ການເຜົາຜານເພື່ອໃຫ້ເຫັນພາບຊັດເຈນຂຶ້ນ.'},
      {title: 'ອັນຕຣາຊາວ', text: 'ສາມາດເຮັດໃຫ້ການປະເມີນສົມບູນຂຶ້ນ ໂດຍການສັງເກດລັກສະນະຂອງຮັງໄຂ່.'},
    ],
    flowTitle: 'ພາບລວມຂອງຂັ້ນຕອນ',
    flowItems: [
      'ປະຫວັດ ແລະ ອາການ',
      'ການກວດຮ່າງກາຍ',
      'ການກວດຕາມສະຖານະການ',
      'ອັນຕຣາຊາວ ຫາກຈຳເປັນ',
    ],
    section3Body1: 'ອາດມີການກວດເລືອດເພື່ອຊອກຫາອາການຂອງແອນໂດຣເຈັນທີ່ເກີນ, ປະເມີນຮໍໂມນບາງຊະນິດທີ່ກ່ຽວຂ້ອງກັບການເຮັດວຽກຂອງລະບົບສືບພັນ ແລະ ຊອກຫາສາເຫດອື່ນທີ່ເປັນໄປໄດ້ຂອງອາການຂອງທ່ານ.',
    section3Body2: 'ການກວດທີ່ເລືອກຂຶ້ນກັບອາຍຸ, ອາການ, ປະຫວັດທາງການແພດຂອງທ່ານ ແລະ ສິ່ງທີ່ຜູ້ຊ່ຽວຊານຕ້ອງການກວດສອບ.',
    bloodTests: [
      {title: 'ແອນໂດຣເຈັນ', text: 'ເທສໂຕສເຕໂຣນ ແລະ ຮໍໂມນອື່ນໆຕາມສະຖານະການ.'},
      {title: 'ການເຮັດວຽກຂອງຕ່ອມໄທລອຍ', text: 'ຊ່ວຍຕັດສາເຫດບາງຢ່າງຂອງຮອບເດືອນທີ່ບໍ່ສະໝ່ຳສະເໝີ.'},
      {title: 'ການກວດການເຜົາຜານ', text: 'ນ້ຳຕານໃນເລືອດ ແລະ ບາງຄັ້ງການກວດໄຂມັນໃນເລືອດຕາມປັດໃຈສ່ຽງ.'},
    ],
    alertTitle: 'ສຳຄັນ',
    alertText: 'ຜົນກວດຮໍໂມນຕ້ອງຖືກແປຄວາມພ້ອມກັບບໍລິບົດທາງຄລີນິກ. ຄ່າດຽວໂດຍປົກກະຕິບໍ່ພຽງພໍທີ່ຈະສະຫຼຸບການວິນິດໄສ PCOS ໄດ້.',
    section4Body: 'ອັນຕຣາຊາວສາມາດໃຊ້ສັງເກດລັກສະນະຂອງຮັງໄຂ່ ແລະ ໂດຍສະເພາະຊອກຫາຟອລລິເຄິນນ້ອຍໆຈຳນວນຫຼາຍ. ມັນຍັງຊ່ວຍໃຫ້ຜູ້ຊ່ຽວຊານຊອກຫາປັດໃຈອື່ນທີ່ອາດອະທິບາຍອາການບາງຢ່າງ.',
    tip2Title: 'ຄວນຮູ້',
    tip2Text: 'ການເຫັນຟອລລິເຄິນຫຼາຍໃນອັນຕຣາຊາວບໍ່ໄດ້ໝາຍຄວາມວ່າທ່ານມີ PCOS ໂດຍອັດຕະໂນມັດ. ຜົນຕ້ອງຖືກແປຄວາມພ້ອມກັບສ່ວນອື່ນຂອງການປະເມີນ.',
    section5Body: 'ການໄດ້ຮັບການວິນິດໄສ PCOS ບໍ່ໄດ້ເຮັດໃຫ້ສາມາດຄາດການໄດ້ຢ່າງແນ່ນອນວ່າອາການຂອງທ່ານຈະດຳເນີນໄປແນວໃດ. ກຸ່ມອາການນີ້ສາມາດສະແດງອອກແຕກຕ່າງກັນຫຼາຍໃນແຕ່ລະຄົນ.',
    mythItems: [
      'PCOS ບໍ່ໄດ້ໝາຍຄວາມວ່າມີລູກຍາກໂດຍອັດຕະໂນມັດ.',
      'PCOS ບໍ່ຈຳເປັນຕ້ອງມີຖົງນ້ຳ.',
      'ການວິນິດໄສພຽງຢ່າງດຽວບໍ່ໄດ້ກຳນົດການຮັກສາ.',
      'ຜົນອັນຕຣາຊາວປົກກະຕິບໍ່ຈຳເປັນຕ້ອງຕັດ PCOS ອອກ.',
    ],
    section6Body: 'ຂໍ້ມູນບາງຢ່າງທີ່ກະກຽມໄວ້ລ່ວງໜ້າສາມາດຊ່ວຍໃຫ້ຜູ້ຊ່ຽວຊານເຂົ້າໃຈປະຫວັດຂອງທ່ານ ແລະ ເລືອກການກວດທີ່ກ່ຽວຂ້ອງທີ່ສຸດ.',
    appointmentQuestions: [
      'ຮອບເດືອນຂອງທ່ານບໍ່ສະໝ່ຳສະເໝີມາດົນປານໃດແລ້ວ?',
      'ທ່ານສັງເກດເຫັນສິວ, ຂົນຂຶ້ນຜິດປົກກະຕິ ຫຼື ຜົມຫຼົ່ນບໍ?',
      'ມີປະຫວັດ PCOS ຫຼື ເບົາຫວານໃນຄອບຄົວບໍ?',
      'ທ່ານຕ້ອງການຖືພາໃນໄລຍະສັ້ນ ຫຼື ກາງບໍ?',
    ],
    preparationTitle: 'ຄຳແນະນຳນ້ອຍໆກ່ອນການນັດພົບ',
    preparationText: 'ຖ້າເປັນໄປໄດ້ ໃຫ້ບັນທຶກວັນທີຂອງປະຈຳເດືອນຄັ້ງຫຼ້າສຸດ, ຄວາມຍາວໂດຍປະມານຂອງຮອບເດືອນ, ອາການທີ່ທ່ານສັງເກດເຫັນ ແລະ ການຮັກສາ ຫຼື ອາຫານເສີມທີ່ທ່ານກຳລັງໃຊ້.',
    summaryTitle: 'ສິ່ງສຳຄັນຂອງການປະເມີນ',
    summaryItems: [
      'ການວິນິດໄສອີງໃສ່ຫຼາຍປັດໃຈ ບໍ່ແມ່ນການກວດດຽວ.',
      'ການກວດເລືອດສາມາດຊອກຫາຄວາມບໍ່ສົມດຸນຂອງຮໍໂມນບາງຢ່າງ ແລະ ຕັດສາເຫດອື່ນອອກ.',
      'ອັນຕຣາຊາວສາມາດເຮັດໃຫ້ການປະເມີນສົມບູນຂຶ້ນຕາມສະຖານະການ.',
      'ຜົນກວດຄວນຖືກແປຄວາມໂດຍຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບສະເໝີ.',
    ],
    finalTipTitle: 'ຈຸດສຳຄັນ',
    finalTipText: 'ການປະເມີນ PCOS ບໍ່ແມ່ນການກວດດຽວ ຫຼື ຄຳຕັດສິນສຸດທ້າຍ. ມັນຊ່ວຍໃຫ້ທ່ານເຂົ້າໃຈການເຮັດວຽກຂອງຮໍໂມນ, ຊອກຫາສາເຫດອື່ນທີ່ເປັນໄປໄດ້ ແລະ ສ້າງການດູແລທີ່ເໝາະກັບສະຖານະການຂອງທ່ານ.',
    disclaimerText: 'ບົດຄວາມນີ້ເປັນຂໍ້ມູນເທົ່ານັ້ນ ແລະ ບໍ່ແທນການປຶກສາແພດ ຫຼື ການແປຜົນກວດສະເພາະບຸກຄົນຂອງທ່ານ.',
    shareMessage: 'ການວິນິດໄສ PCOS: ການກວດ ແລະ ການປະເມີນ — AWA',
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
