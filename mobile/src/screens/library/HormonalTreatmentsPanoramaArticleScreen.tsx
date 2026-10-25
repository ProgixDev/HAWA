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
import {
  onPrimaryTextColor,
  withAlpha,
  type ResolvedAwaTheme,
} from '../../theme/awaThemeTokens';
import {resolveEditorialLanguage} from '../../i18n/editorialLanguage';
import {CYCLE_PHASES_HERO, resolveEditorialImage} from '../../i18n/editorialImages';
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

const ID = 'hormonaltreatments-panorama';

const HERO = CYCLE_PHASES_HERO;

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below. These arrays are kept aligned by index with
// CONTENT.<lang>.methods / CONTENT.<lang>.criteria.
const METHOD_ICONS = [
  'pill',
  'bandage',
  'circle-outline',
  'needle',
  'record-circle-outline',
] as const;

const CRITERIA_ICONS = [
  'calendar-clock-outline',
  'heart-pulse',
  'baby-face-outline',
  'shield-check-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('HormonalTreatmentsPanorama', {
  fr: {
    badge: 'TRAITEMENTS HORMONAUX',
    title: 'Panorama des traitements hormonaux contraceptifs',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Pilule, patch, anneau, implant, stérilet hormonal : ce qui les distingue et comment réfléchir à la méthode qui correspond le mieux à ton quotidien.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Un principe d’action commun',
      'Les différentes méthodes',
      'Comment orienter son choix',
      'À retenir',
    ],
    body1: 'Les méthodes hormonales utilisent des hormones pour prévenir une grossesse. Selon la méthode, elles peuvent principalement empêcher l’ovulation, épaissir la glaire cervicale et modifier l’environnement de l’utérus.',
    diagramTitle: 'Comment agit la contraception hormonale ?',
    diagramSubtitle: 'Plusieurs mécanismes peuvent participer à la protection.',
    step1Title: 'Ovulation',
    step1Text: 'Certaines méthodes empêchent ou inhibent la libération de l’ovule.',
    step2Title: 'Glaire cervicale',
    step2Text: 'La glaire peut devenir plus épaisse, ce qui rend le passage des spermatozoïdes plus difficile.',
    step3Title: 'Protection contraceptive',
    step3Text: 'L’association de ces mécanismes contribue à réduire le risque de grossesse.',
    body2: 'Toutes les méthodes ne demandent pas le même niveau d’implication. Le principal point de différence est la fréquence à laquelle tu dois penser à ta contraception.',
    comparisonTitle: 'Comparer les méthodes',
    comparisonSubtitle: 'Du geste quotidien à la protection longue durée',
    scaleDaily: 'Quotidien',
    scaleWeekly: 'Hebdomadaire',
    scaleLongTerm: 'Longue durée',
    methods: [
      {
        title: 'Pilule',
        frequency: 'Chaque jour',
        duration: 'À prendre régulièrement',
        profile: 'Idéale si tu veux gérer toi-même ta contraception',
      },
      {
        title: 'Patch',
        frequency: 'Chaque semaine',
        duration: '3 semaines sur 4',
        profile: 'Pratique si tu préfères éviter une prise quotidienne',
      },
      {
        title: 'Anneau vaginal',
        frequency: 'Toutes les 3 semaines',
        duration: 'Avec une semaine de pause',
        profile: 'Une option discrète avec peu de gestes au quotidien',
      },
      {
        title: 'Implant',
        frequency: 'Plusieurs années',
        duration: 'Sans prise quotidienne',
        profile: 'Adapté si tu souhaites une contraception longue durée',
      },
      {
        title: 'Stérilet hormonal',
        frequency: 'Plusieurs années',
        duration: 'Placé par un professionnel',
        profile: 'Une solution longue durée nécessitant très peu d’entretien',
      },
    ],
    highlightTitle: 'Le point commun à retenir',
    highlightText: 'Plus une méthode réduit les gestes à effectuer au quotidien, moins tu as besoin d’y penser régulièrement. Cela peut être intéressant si tu sais que tu risques d’oublier une prise ou un changement.',
    body3: 'Il n’existe pas une méthode idéale pour tout le monde. Le meilleur choix dépend de ton quotidien, de tes préférences, de ta tolérance et de tes projets.',
    criteria: [
      {
        title: 'Ton quotidien',
        text: 'Certaines méthodes demandent une action quotidienne, tandis que d’autres fonctionnent pendant plusieurs semaines ou années.',
      },
      {
        title: 'Ta tolérance',
        text: 'Les effets ressentis peuvent varier selon la méthode. Une discussion avec un professionnel permet d’évaluer ce qui te convient.',
      },
      {
        title: 'Tes projets',
        text: 'Si tu souhaites une grossesse prochainement ou plus tard, la durée et la réversibilité de la méthode peuvent guider ton choix.',
      },
      {
        title: 'Tes priorités',
        text: 'Discrétion, simplicité, absence de prise quotidienne ou durée prolongée : tes priorités comptent dans la décision.',
      },
    ],
    choiceDiagramTitle: 'Une petite question pour t’orienter',
    questionText: '« Est-ce que je préfère penser à ma contraception tous les jours, toutes les semaines, ou seulement quelques fois par an ? »',
    choiceOption1Title: 'Souvent',
    choiceOption1Text: 'Pilule ou méthode nécessitant un suivi régulier',
    choiceOption2Title: 'Moins souvent',
    choiceOption2Text: 'Patch ou anneau selon le rythme choisi',
    choiceOption3Title: 'Très rarement',
    choiceOption3Text: 'Implant ou stérilet hormonal longue durée',
    alertTitle: 'À noter',
    alertText: 'Le choix d’une contraception hormonale doit tenir compte de ta situation personnelle et médicale. Un professionnel de santé peut t’aider à comparer les bénéfices, les risques, contre-indications et effets indésirables possibles.',
    summaryTitle: 'L’essentiel',
    summarySubtitle: 'Les points importants à garder en tête',
    summaryRow1: 'Les méthodes hormonales utilisent différentes combinaisons d’hormones et différents rythmes d’utilisation.',
    summaryRow2: 'Pilule, patch et anneau demandent une implication régulière, tandis que l’implant et le stérilet hormonal sont des méthodes longue durée.',
    summaryRow3: 'Le choix doit être adapté à ton quotidien, tes préférences, ta tolérance et tes projets.',
    summaryRow4: 'Aucune méthode n’est universellement « meilleure » : elle doit surtout être compatible avec tes besoins et ta situation.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Prendre le temps de comparer les méthodes avec un professionnel de santé permet de choisir une contraception que tu peux utiliser sereinement et régulièrement.',
    shareMessage: 'Panorama des traitements hormonaux contraceptifs — AWA',
  },
  en: {
    badge: 'HORMONAL TREATMENTS',
    title: 'Overview of hormonal contraceptive treatments',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Pill, patch, ring, implant, hormonal IUD: what sets them apart and how to think about the method that best fits your daily life.',
    contentsTitle: 'In this article',
    topics: [
      'A shared mechanism of action',
      'The different methods',
      'How to guide your choice',
      'Key takeaways',
    ],
    body1: 'Hormonal methods use hormones to prevent pregnancy. Depending on the method, they can mainly prevent ovulation, thicken cervical mucus, and change the uterine environment.',
    diagramTitle: 'How does hormonal contraception work?',
    diagramSubtitle: 'Several mechanisms may contribute to protection.',
    step1Title: 'Ovulation',
    step1Text: 'Some methods prevent or inhibit the release of the egg.',
    step2Title: 'Cervical mucus',
    step2Text: 'The mucus may become thicker, which makes it harder for sperm to get through.',
    step3Title: 'Contraceptive protection',
    step3Text: 'The combination of these mechanisms helps reduce the risk of pregnancy.',
    body2: 'Not all methods call for the same level of involvement. The main difference is how often you need to think about your contraception.',
    comparisonTitle: 'Comparing the methods',
    comparisonSubtitle: 'From a daily action to long-term protection',
    scaleDaily: 'Daily',
    scaleWeekly: 'Weekly',
    scaleLongTerm: 'Long-term',
    methods: [
      {
        title: 'Pill',
        frequency: 'Every day',
        duration: 'Taken regularly',
        profile: 'Ideal if you want to manage your own contraception',
      },
      {
        title: 'Patch',
        frequency: 'Every week',
        duration: '3 weeks out of 4',
        profile: 'Convenient if you’d rather avoid a daily routine',
      },
      {
        title: 'Vaginal ring',
        frequency: 'Every 3 weeks',
        duration: 'With a one-week break',
        profile: 'A discreet option with few day-to-day actions',
      },
      {
        title: 'Implant',
        frequency: 'Several years',
        duration: 'No daily routine',
        profile: 'Suited if you want long-term contraception',
      },
      {
        title: 'Hormonal IUD',
        frequency: 'Several years',
        duration: 'Placed by a professional',
        profile: 'A long-term solution that needs very little upkeep',
      },
    ],
    highlightTitle: 'The key thing to remember',
    highlightText: 'The fewer day-to-day actions a method requires, the less often you need to think about it. This can be worth considering if you know you’re likely to forget a dose or a change.',
    body3: 'There isn’t one ideal method for everyone. The best choice depends on your daily life, your preferences, your tolerance, and your plans.',
    criteria: [
      {
        title: 'Your daily life',
        text: 'Some methods call for a daily action, while others work for several weeks or years.',
      },
      {
        title: 'Your tolerance',
        text: 'How a method feels can vary from person to person. Talking with a healthcare professional can help you work out what suits you.',
      },
      {
        title: 'Your plans',
        text: 'If you’re hoping for a pregnancy soon or later on, the method’s duration and reversibility can help guide your choice.',
      },
      {
        title: 'Your priorities',
        text: 'Discretion, simplicity, no daily routine, or long-lasting protection: your priorities matter in this decision.',
      },
    ],
    choiceDiagramTitle: 'A quick question to help you decide',
    questionText: '“Would I rather think about my contraception every day, every week, or only a few times a year?”',
    choiceOption1Title: 'Often',
    choiceOption1Text: 'Pill or a method that needs regular attention',
    choiceOption2Title: 'Less often',
    choiceOption2Text: 'Patch or ring, depending on the rhythm you choose',
    choiceOption3Title: 'Very rarely',
    choiceOption3Text: 'Implant or long-term hormonal IUD',
    alertTitle: 'Worth noting',
    alertText: 'Choosing a hormonal contraceptive should take your personal and medical situation into account. A healthcare professional can help you compare the benefits, risks, contraindications, and possible side effects.',
    summaryTitle: 'The essentials',
    summarySubtitle: 'The key points to keep in mind',
    summaryRow1: 'Hormonal methods use different hormone combinations and different schedules of use.',
    summaryRow2: 'The pill, patch, and ring call for ongoing involvement, while the implant and hormonal IUD are long-term methods.',
    summaryRow3: 'The choice should fit your daily life, your preferences, your tolerance, and your plans.',
    summaryRow4: 'No method is universally “best” — it mainly needs to be compatible with your needs and your situation.',
    tip1Title: 'Good to know',
    tip1Text: 'Taking the time to compare methods with a healthcare professional helps you choose a contraception you can use calmly and consistently.',
    shareMessage: 'Overview of hormonal contraceptive treatments — AWA',
  },
  es: {
    badge: 'TRATAMIENTOS HORMONALES',
    title: 'Panorama de los tratamientos hormonales anticonceptivos',
    metaDuration: '7 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Píldora, parche, anillo, implante, DIU hormonal: qué los diferencia y cómo reflexionar sobre el método que mejor se ajusta a tu día a día.',
    contentsTitle: 'En este artículo',
    topics: [
      'Un principio de acción común',
      'Los distintos métodos',
      'Cómo orientar tu elección',
      'Lo esencial',
    ],
    body1: 'Los métodos hormonales utilizan hormonas para prevenir un embarazo. Según el método, pueden principalmente impedir la ovulación, espesar el moco cervical y modificar el entorno del útero.',
    diagramTitle: '¿Cómo actúa la anticoncepción hormonal?',
    diagramSubtitle: 'Varios mecanismos pueden contribuir a la protección.',
    step1Title: 'Ovulación',
    step1Text: 'Algunos métodos impiden o inhiben la liberación del óvulo.',
    step2Title: 'Moco cervical',
    step2Text: 'El moco puede volverse más espeso, lo que dificulta el paso de los espermatozoides.',
    step3Title: 'Protección anticonceptiva',
    step3Text: 'La combinación de estos mecanismos contribuye a reducir el riesgo de embarazo.',
    body2: 'No todos los métodos requieren el mismo nivel de implicación. El principal punto de diferencia es la frecuencia con la que debes pensar en tu anticoncepción.',
    comparisonTitle: 'Comparar los métodos',
    comparisonSubtitle: 'Del gesto diario a la protección de larga duración',
    scaleDaily: 'Diario',
    scaleWeekly: 'Semanal',
    scaleLongTerm: 'Larga duración',
    methods: [
      {
        title: 'Píldora',
        frequency: 'Cada día',
        duration: 'Hay que tomarla regularmente',
        profile: 'Ideal si quieres gestionar tú misma tu anticoncepción',
      },
      {
        title: 'Parche',
        frequency: 'Cada semana',
        duration: '3 semanas de cada 4',
        profile: 'Práctico si prefieres evitar una toma diaria',
      },
      {
        title: 'Anillo vaginal',
        frequency: 'Cada 3 semanas',
        duration: 'Con una semana de descanso',
        profile: 'Una opción discreta con pocos gestos en el día a día',
      },
      {
        title: 'Implante',
        frequency: 'Varios años',
        duration: 'Sin toma diaria',
        profile: 'Adecuado si deseas una anticoncepción de larga duración',
      },
      {
        title: 'DIU hormonal',
        frequency: 'Varios años',
        duration: 'Colocado por un profesional',
        profile: 'Una solución de larga duración que requiere muy poco mantenimiento',
      },
    ],
    highlightTitle: 'El punto en común que hay que recordar',
    highlightText: 'Cuantos menos gestos diarios requiera un método, menos necesitas pensar en él regularmente. Esto puede ser interesante si sabes que corres el riesgo de olvidar una toma o un cambio.',
    body3: 'No existe un método ideal para todo el mundo. La mejor elección depende de tu día a día, tus preferencias, tu tolerancia y tus planes.',
    criteria: [
      {
        title: 'Tu día a día',
        text: 'Algunos métodos requieren una acción diaria, mientras que otros funcionan durante varias semanas o años.',
      },
      {
        title: 'Tu tolerancia',
        text: 'Los efectos percibidos pueden variar según el método. Hablar con un profesional permite evaluar lo que te conviene.',
      },
      {
        title: 'Tus planes',
        text: 'Si deseas un embarazo próximamente o más adelante, la duración y la reversibilidad del método pueden orientar tu elección.',
      },
      {
        title: 'Tus prioridades',
        text: 'Discreción, sencillez, ausencia de toma diaria o duración prolongada: tus prioridades cuentan en la decisión.',
      },
    ],
    choiceDiagramTitle: 'Una pequeña pregunta para orientarte',
    questionText: '«¿Prefiero pensar en mi anticoncepción todos los días, todas las semanas, o solo algunas veces al año?»',
    choiceOption1Title: 'A menudo',
    choiceOption1Text: 'Píldora o método que requiere un seguimiento regular',
    choiceOption2Title: 'Con menos frecuencia',
    choiceOption2Text: 'Parche o anillo según el ritmo elegido',
    choiceOption3Title: 'Muy raramente',
    choiceOption3Text: 'Implante o DIU hormonal de larga duración',
    alertTitle: 'A tener en cuenta',
    alertText: 'La elección de una anticoncepción hormonal debe tener en cuenta tu situación personal y médica. Un profesional de la salud puede ayudarte a comparar los beneficios, los riesgos, las contraindicaciones y los posibles efectos indeseados.',
    summaryTitle: 'Lo esencial',
    summarySubtitle: 'Los puntos importantes que hay que tener en cuenta',
    summaryRow1: 'Los métodos hormonales utilizan distintas combinaciones de hormonas y distintos ritmos de uso.',
    summaryRow2: 'La píldora, el parche y el anillo requieren una implicación regular, mientras que el implante y el DIU hormonal son métodos de larga duración.',
    summaryRow3: 'La elección debe adaptarse a tu día a día, tus preferencias, tu tolerancia y tus planes.',
    summaryRow4: 'Ningún método es universalmente «mejor»: sobre todo debe ser compatible con tus necesidades y tu situación.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Tomarte el tiempo de comparar los métodos con un profesional de la salud te permite elegir una anticoncepción que puedas usar con tranquilidad y de forma regular.',
    shareMessage: 'Panorama de los tratamientos hormonales anticonceptivos — AWA',
  },
  it: {
    badge: 'TRATTAMENTI ORMONALI',
    title: 'Panoramica dei trattamenti contraccettivi ormonali',
    metaDuration: '7 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Pillola, cerotto, anello, impianto, spirale ormonale: che cosa le distingue e come pensare al metodo più adatto alla tua vita quotidiana.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Un meccanismo d’azione comune',
      'I diversi metodi',
      'Come orientare la tua scelta',
      'I punti chiave',
    ],
    body1: 'I metodi ormonali usano gli ormoni per prevenire la gravidanza. A seconda del metodo, possono soprattutto impedire l’ovulazione, rendere più denso il muco cervicale e modificare l’ambiente uterino.',
    diagramTitle: 'Come funziona la contraccezione ormonale?',
    diagramSubtitle: 'Diversi meccanismi possono contribuire alla protezione.',
    step1Title: 'Ovulazione',
    step1Text: 'Alcuni metodi impediscono o inibiscono il rilascio dell’ovulo.',
    step2Title: 'Muco cervicale',
    step2Text: 'Il muco può diventare più denso, rendendo più difficile il passaggio degli spermatozoi.',
    step3Title: 'Protezione contraccettiva',
    step3Text: 'La combinazione di questi meccanismi contribuisce a ridurre il rischio di gravidanza.',
    body2: 'Non tutti i metodi richiedono lo stesso livello di impegno. La differenza principale sta nella frequenza con cui devi pensare alla tua contraccezione.',
    comparisonTitle: 'Confronto tra i metodi',
    comparisonSubtitle: 'Da un gesto quotidiano a una protezione a lungo termine',
    scaleDaily: 'Giornaliero',
    scaleWeekly: 'Settimanale',
    scaleLongTerm: 'A lungo termine',
    methods: [
      {
        title: 'Pillola',
        frequency: 'Ogni giorno',
        duration: 'Assunta con regolarità',
        profile: 'Ideale se vuoi gestire in prima persona la tua contraccezione',
      },
      {
        title: 'Cerotto',
        frequency: 'Ogni settimana',
        duration: '3 settimane su 4',
        profile: 'Comodo se preferisci evitare una routine quotidiana',
      },
      {
        title: 'Anello vaginale',
        frequency: 'Ogni 3 settimane',
        duration: 'Con una pausa di una settimana',
        profile: 'Un’opzione discreta, con pochi gesti quotidiani',
      },
      {
        title: 'Impianto',
        frequency: 'Diversi anni',
        duration: 'Nessuna routine quotidiana',
        profile: 'Adatto se desideri una contraccezione a lungo termine',
      },
      {
        title: 'Spirale ormonale',
        frequency: 'Diversi anni',
        duration: 'Posizionata da un professionista',
        profile: 'Una soluzione a lungo termine che richiede pochissima manutenzione',
      },
    ],
    highlightTitle: 'Il punto essenziale da ricordare',
    highlightText: 'Meno gesti quotidiani richiede un metodo, meno spesso devi pensarci. Può valere la pena tenerne conto se sai di poterti dimenticare una dose o un cambio.',
    body3: 'Non esiste un metodo ideale per tutte. La scelta migliore dipende dalla tua vita quotidiana, dalle tue preferenze, dalla tua tollerabilità e dai tuoi progetti.',
    criteria: [
      {
        title: 'La tua vita quotidiana',
        text: 'Alcuni metodi richiedono un gesto quotidiano, altri agiscono per diverse settimane o per anni.',
      },
      {
        title: 'La tua tollerabilità',
        text: 'Come ci si sente con un metodo può variare da persona a persona. Parlarne con un professionista sanitario può aiutarti a capire che cosa fa per te.',
      },
      {
        title: 'I tuoi progetti',
        text: 'Se speri in una gravidanza a breve o più avanti, la durata del metodo e la sua reversibilità possono aiutarti a orientare la scelta.',
      },
      {
        title: 'Le tue priorità',
        text: 'Discrezione, semplicità, nessuna routine quotidiana o protezione di lunga durata: le tue priorità contano in questa decisione.',
      },
    ],
    choiceDiagramTitle: 'Una domanda rapida per decidere',
    questionText: '«Preferirei pensare alla mia contraccezione ogni giorno, ogni settimana o solo poche volte all’anno?»',
    choiceOption1Title: 'Spesso',
    choiceOption1Text: 'Pillola o un metodo che richiede attenzione regolare',
    choiceOption2Title: 'Meno spesso',
    choiceOption2Text: 'Cerotto o anello, a seconda del ritmo che scegli',
    choiceOption3Title: 'Molto raramente',
    choiceOption3Text: 'Impianto o spirale ormonale a lungo termine',
    alertTitle: 'Da tenere a mente',
    alertText: 'La scelta di un contraccettivo ormonale dovrebbe tenere conto della tua situazione personale e medica. Un professionista sanitario può aiutarti a confrontare benefici, rischi, controindicazioni ed eventuali effetti collaterali.',
    summaryTitle: 'L’essenziale',
    summarySubtitle: 'I punti chiave da ricordare',
    summaryRow1: 'I metodi ormonali usano diverse combinazioni di ormoni e diversi schemi di utilizzo.',
    summaryRow2: 'La pillola, il cerotto e l’anello richiedono un impegno continuo, mentre l’impianto e la spirale ormonale sono metodi a lungo termine.',
    summaryRow3: 'La scelta dovrebbe adattarsi alla tua vita quotidiana, alle tue preferenze, alla tua tollerabilità e ai tuoi progetti.',
    summaryRow4: 'Nessun metodo è «il migliore» in assoluto: deve soprattutto essere compatibile con le tue esigenze e la tua situazione.',
    tip1Title: 'Da sapere',
    tip1Text: 'Prenderti il tempo di confrontare i metodi con un professionista sanitario ti aiuta a scegliere una contraccezione che puoi usare con serenità e costanza.',
    shareMessage: 'Panoramica dei trattamenti contraccettivi ormonali — AWA',
  },
  tr: {
    badge: 'HORMONAL TEDAVİLER',
    title: 'Hormonal doğum kontrol yöntemlerine genel bakış',
    metaDuration: '7 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Hap, flaster, vajinal halka, implant, hormonlu spiral: onları birbirinden ayıran şeyler ve günlük hayatına en uygun yöntemi nasıl düşünebileceğin.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Ortak bir etki mekanizması',
      'Farklı yöntemler',
      'Seçimine nasıl yön verebilirsin',
      'Akılda tutulacaklar',
    ],
    body1: 'Hormonal yöntemler gebeliği önlemek için hormonlardan yararlanır. Yönteme bağlı olarak, esas olarak yumurtlamayı engelleyebilir, servikal mukusu koyulaştırabilir ve rahim ortamını değiştirebilir.',
    diagramTitle: 'Hormonal doğum kontrolü nasıl işler?',
    diagramSubtitle: 'Korumaya birkaç mekanizma katkıda bulunabilir.',
    step1Title: 'Yumurtlama',
    step1Text: 'Bazı yöntemler yumurtanın salınmasını önler veya baskılar.',
    step2Title: 'Servikal mukus',
    step2Text: 'Mukus koyulaşabilir; bu da spermin geçmesini zorlaştırır.',
    step3Title: 'Doğum kontrolü koruması',
    step3Text: 'Bu mekanizmaların birleşimi gebelik riskinin azalmasına yardımcı olur.',
    body2: 'Her yöntem aynı düzeyde ilgi gerektirmez. Asıl fark, doğum kontrolünü ne sıklıkla düşünmen gerektiğidir.',
    comparisonTitle: 'Yöntemleri karşılaştırma',
    comparisonSubtitle: 'Günlük bir eylemden uzun süreli korumaya',
    scaleDaily: 'Günlük',
    scaleWeekly: 'Haftalık',
    scaleLongTerm: 'Uzun süreli',
    methods: [
      {
        title: 'Hap',
        frequency: 'Her gün',
        duration: 'Düzenli olarak alınır',
        profile: 'Doğum kontrolünü kendin yönetmek istiyorsan ideal',
      },
      {
        title: 'Flaster',
        frequency: 'Her hafta',
        duration: '4 haftanın 3’ü',
        profile: 'Günlük bir rutinden kaçınmayı tercih ediyorsan pratik',
      },
      {
        title: 'Vajinal halka',
        frequency: '3 haftada bir',
        duration: 'Bir haftalık aranın ardından',
        profile: 'Günlük pek az işlem gerektiren, gizliliğe uygun bir seçenek',
      },
      {
        title: 'Implant',
        frequency: 'Birkaç yıl',
        duration: 'Günlük rutin yok',
        profile: 'Uzun süreli doğum kontrolü istiyorsan uygun',
      },
      {
        title: 'Hormonlu spiral',
        frequency: 'Birkaç yıl',
        duration: 'Bir profesyonel tarafından yerleştirilir',
        profile: 'Çok az bakım gerektiren uzun süreli bir çözüm',
      },
    ],
    highlightTitle: 'Akılda tutulması gereken en önemli nokta',
    highlightText: 'Bir yöntem günlük hayatta ne kadar az işlem gerektiriyorsa, onu o kadar seyrek düşünmen gerekir. Bir dozu veya bir değişimi unutma ihtimalin yüksekse bu göz önünde bulundurmaya değer olabilir.',
    body3: 'Herkes için ideal tek bir yöntem yoktur. En iyi seçim günlük hayatına, tercihlerine, toleransına ve planlarına bağlıdır.',
    criteria: [
      {
        title: 'Günlük hayatın',
        text: 'Bazı yöntemler günlük bir eylem gerektirirken, bazıları birkaç hafta ya da birkaç yıl boyunca işler.',
      },
      {
        title: 'Toleransın',
        text: 'Bir yöntemin nasıl hissettirdiği kişiden kişiye değişebilir. Bir sağlık profesyoneliyle konuşmak, sana neyin uyduğunu anlamana yardımcı olabilir.',
      },
      {
        title: 'Planların',
        text: 'Yakın zamanda ya da ileride bir gebelik umuyorsan, yöntemin süresi ve geri döndürülebilirliği seçimine yön vermene yardımcı olabilir.',
      },
      {
        title: 'Önceliklerin',
        text: 'Gizlilik, sadelik, günlük rutinin olmaması veya uzun süreli koruma: bu kararda önceliklerin önemlidir.',
      },
    ],
    choiceDiagramTitle: 'Karar vermene yardımcı olacak kısa bir soru',
    questionText: '“Doğum kontrolünü her gün mü, her hafta mı yoksa yılda yalnızca birkaç kez mi düşünmeyi tercih ederim?”',
    choiceOption1Title: 'Sık sık',
    choiceOption1Text: 'Hap veya düzenli ilgi gerektiren bir yöntem',
    choiceOption2Title: 'Daha seyrek',
    choiceOption2Text: 'Seçtiğin ritme göre flaster veya halka',
    choiceOption3Title: 'Çok nadiren',
    choiceOption3Text: 'Implant veya uzun süreli hormonlu spiral',
    alertTitle: 'Dikkat edilecek nokta',
    alertText: 'Hormonal bir doğum kontrol yöntemi seçerken kişisel ve tıbbi durumun göz önünde bulundurulmalıdır. Bir sağlık profesyoneli yararları, riskleri, kontrendikasyonları ve olası yan etkileri karşılaştırmana yardımcı olabilir.',
    summaryTitle: 'Özetle',
    summarySubtitle: 'Akılda tutulması gereken temel noktalar',
    summaryRow1: 'Hormonal yöntemler farklı hormon kombinasyonları ve farklı kullanım takvimleri kullanır.',
    summaryRow2: 'Hap, flaster ve halka sürekli bir ilgi gerektirirken, implant ve hormonlu spiral uzun süreli yöntemlerdir.',
    summaryRow3: 'Seçim günlük hayatına, tercihlerine, toleransına ve planlarına uygun olmalıdır.',
    summaryRow4: 'Herkes için “en iyi” olan bir yöntem yoktur — asıl olan yöntemin ihtiyaçlarına ve durumuna uygun olmasıdır.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Yöntemleri bir sağlık profesyoneliyle karşılaştırmaya zaman ayırmak, sakin ve düzenli biçimde kullanabileceğin bir doğum kontrol yöntemi seçmene yardımcı olur.',
    shareMessage: 'Hormonal doğum kontrol yöntemlerine genel bakış — AWA',
  },
  ru: {
    badge: 'ГОРМОНАЛЬНЫЕ СРЕДСТВА',
    title: 'Обзор гормональных контрацептивов',
    metaDuration: '7 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Таблетки, пластырь, кольцо, имплант, гормональная ВМС: чем они отличаются и как подумать о методе, который лучше всего подходит вашей повседневной жизни.',
    contentsTitle: 'В этой статье',
    topics: [
      'Общий механизм действия',
      'Разные методы',
      'Как подойти к выбору',
      'Главное',
    ],
    body1: 'Гормональные методы используют гормоны для предотвращения беременности. В зависимости от метода они могут в первую очередь подавлять овуляцию, делать цервикальную слизь более густой и изменять среду в матке.',
    diagramTitle: 'Как работает гормональная контрацепция?',
    diagramSubtitle: 'Защиту могут обеспечивать несколько механизмов.',
    step1Title: 'Овуляция',
    step1Text: 'Некоторые методы предотвращают или подавляют выход яйцеклетки.',
    step2Title: 'Цервикальная слизь',
    step2Text: 'Слизь может становиться гуще, и сперматозоидам труднее проникнуть через неё.',
    step3Title: 'Контрацептивная защита',
    step3Text: 'Сочетание этих механизмов помогает снизить риск беременности.',
    body2: 'Не все методы требуют одинаковой вовлечённости. Главное различие — как часто вам нужно думать о контрацепции.',
    comparisonTitle: 'Сравнение методов',
    comparisonSubtitle: 'От ежедневного действия до долгосрочной защиты',
    scaleDaily: 'Ежедневно',
    scaleWeekly: 'Еженедельно',
    scaleLongTerm: 'Длительно',
    methods: [
      {
        title: 'Таблетки',
        frequency: 'Каждый день',
        duration: 'Приём по расписанию',
        profile: 'Подходит, если вы хотите сами управлять своей контрацепцией',
      },
      {
        title: 'Пластырь',
        frequency: 'Каждую неделю',
        duration: '3 недели из 4',
        profile: 'Удобен, если вы предпочитаете обойтись без ежедневных действий',
      },
      {
        title: 'Вагинальное кольцо',
        frequency: 'Каждые 3 недели',
        duration: 'С перерывом в одну неделю',
        profile: 'Незаметный вариант с минимумом ежедневных действий',
      },
      {
        title: 'Имплант',
        frequency: 'Несколько лет',
        duration: 'Без ежедневных действий',
        profile: 'Подходит, если вам нужна долгосрочная контрацепция',
      },
      {
        title: 'Гормональная ВМС',
        frequency: 'Несколько лет',
        duration: 'Устанавливается специалистом',
        profile: 'Долгосрочное решение, которое почти не требует ухода',
      },
    ],
    highlightTitle: 'Главное, что стоит запомнить',
    highlightText: 'Чем меньше ежедневных действий требует метод, тем реже вам нужно о нём думать. Это стоит учесть, если вы знаете, что можете забыть принять таблетку или заменить средство.',
    body3: 'Идеального метода для всех не существует. Лучший выбор зависит от вашей повседневной жизни, предпочтений, переносимости и планов.',
    criteria: [
      {
        title: 'Ваша повседневная жизнь',
        text: 'Одни методы требуют ежедневных действий, другие действуют несколько недель или лет.',
      },
      {
        title: 'Ваша переносимость',
        text: 'Ощущения от метода могут отличаться у разных женщин. Разговор со медицинским специалистом поможет понять, что подходит именно вам.',
      },
      {
        title: 'Ваши планы',
        text: 'Если вы надеетесь на беременность в ближайшее время или позже, продолжительность метода и обратимость его действия помогут сделать выбор.',
      },
      {
        title: 'Ваши приоритеты',
        text: 'Незаметность, простота, отсутствие ежедневных действий или длительная защита: ваши приоритеты важны при принятии этого решения.',
      },
    ],
    choiceDiagramTitle: 'Простой вопрос, который поможет определиться',
    questionText: '«Хочу ли я думать о контрацепции каждый день, каждую неделю или лишь несколько раз в год?»',
    choiceOption1Title: 'Часто',
    choiceOption1Text: 'Таблетки или метод, требующий регулярного внимания',
    choiceOption2Title: 'Реже',
    choiceOption2Text: 'Пластырь или кольцо — в зависимости от выбранного ритма',
    choiceOption3Title: 'Очень редко',
    choiceOption3Text: 'Имплант или долгосрочная гормональная ВМС',
    alertTitle: 'Важно',
    alertText: 'Выбор гормонального контрацептива должен учитывать вашу личную и медицинскую ситуацию. Медицинский специалист поможет сравнить пользу, риски, противопоказания и возможные побочные эффекты.',
    summaryTitle: 'Самое важное',
    summarySubtitle: 'Главные моменты, которые стоит помнить',
    summaryRow1: 'Гормональные методы используют разные сочетания гормонов и разные схемы применения.',
    summaryRow2: 'Таблетки, пластырь и кольцо требуют постоянной вовлечённости, а имплант и гормональная ВМС — это долгосрочные методы.',
    summaryRow3: 'Выбор должен соответствовать вашей повседневной жизни, предпочтениям, переносимости и планам.',
    summaryRow4: 'Универсально «лучшего» метода не существует — главное, чтобы он подходил вашим потребностям и вашей ситуации.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Если уделить время тому, чтобы сравнить методы со медицинским специалистом, будет проще выбрать контрацепцию, которой вы сможете пользоваться спокойно и регулярно.',
    shareMessage: 'Обзор гормональных контрацептивов — AWA',
  },
  de: {
    badge: 'HORMONELLE BEHANDLUNGEN',
    title: 'Überblick über hormonelle Verhütungsmethoden',
    metaDuration: '7 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Pille, Pflaster, Vaginalring, Implantat, hormonelle Spirale: Was sie unterscheidet und wie du die Methode findest, die am besten zu deinem Alltag passt.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Ein gemeinsamer Wirkmechanismus',
      'Die verschiedenen Methoden',
      'Wie du deine Wahl treffen kannst',
      'Das Wichtigste in Kürze',
    ],
    body1: 'Hormonelle Methoden nutzen Hormone, um eine Schwangerschaft zu verhindern. Je nach Methode können sie vor allem den Eisprung verhindern, den Zervixschleim verdicken und die Umgebung in der Gebärmutter verändern.',
    diagramTitle: 'Wie wirkt hormonelle Verhütung?',
    diagramSubtitle: 'Mehrere Mechanismen können zum Schutz beitragen.',
    step1Title: 'Eisprung',
    step1Text: 'Manche Methoden verhindern oder hemmen die Freisetzung der Eizelle.',
    step2Title: 'Zervixschleim',
    step2Text: 'Der Schleim kann zäher werden, sodass die Spermien schwerer hindurchkommen.',
    step3Title: 'Verhütungsschutz',
    step3Text: 'Das Zusammenspiel dieser Mechanismen trägt dazu bei, das Risiko einer Schwangerschaft zu verringern.',
    body2: 'Nicht alle Methoden erfordern gleich viel Aufmerksamkeit. Der Hauptunterschied liegt darin, wie oft du an deine Verhütung denken musst.',
    comparisonTitle: 'Die Methoden im Vergleich',
    comparisonSubtitle: 'Von der täglichen Anwendung bis zum Langzeitschutz',
    scaleDaily: 'Täglich',
    scaleWeekly: 'Wöchentlich',
    scaleLongTerm: 'Langfristig',
    methods: [
      {
        title: 'Pille',
        frequency: 'Jeden Tag',
        duration: 'Regelmäßig eingenommen',
        profile: 'Ideal, wenn du deine Verhütung selbst in der Hand haben möchtest',
      },
      {
        title: 'Pflaster',
        frequency: 'Jede Woche',
        duration: '3 Wochen von 4',
        profile: 'Praktisch, wenn du lieber keine tägliche Routine hast',
      },
      {
        title: 'Vaginalring',
        frequency: 'Alle 3 Wochen',
        duration: 'Mit einer Woche Pause',
        profile: 'Eine diskrete Option, die im Alltag nur wenige Handgriffe erfordert',
      },
      {
        title: 'Implantat',
        frequency: 'Mehrere Jahre',
        duration: 'Keine tägliche Routine',
        profile: 'Geeignet, wenn du langfristig verhüten möchtest',
      },
      {
        title: 'Hormonelle Spirale',
        frequency: 'Mehrere Jahre',
        duration: 'Wird von Fachpersonal eingesetzt',
        profile: 'Eine Langzeitlösung, die kaum Aufwand erfordert',
      },
    ],
    highlightTitle: 'Das Wichtigste zum Merken',
    highlightText: 'Je weniger Handgriffe eine Methode im Alltag erfordert, desto seltener musst du daran denken. Das kann sich lohnen, wenn du weißt, dass du eine Einnahme oder einen Wechsel leicht vergessen könntest.',
    body3: 'Es gibt nicht die eine ideale Methode für alle. Die beste Wahl hängt von deinem Alltag, deinen Vorlieben, deiner Verträglichkeit und deinen Plänen ab.',
    criteria: [
      {
        title: 'Dein Alltag',
        text: 'Manche Methoden erfordern eine tägliche Anwendung, andere wirken mehrere Wochen oder Jahre.',
      },
      {
        title: 'Deine Verträglichkeit',
        text: 'Wie sich eine Methode anfühlt, kann von Person zu Person unterschiedlich sein. Ein Gespräch mit medizinischem Fachpersonal kann dir helfen herauszufinden, was zu dir passt.',
      },
      {
        title: 'Deine Pläne',
        text: 'Wenn du dir bald oder später eine Schwangerschaft wünschst, können die Dauer und die Umkehrbarkeit der Methode deine Wahl leiten.',
      },
      {
        title: 'Deine Prioritäten',
        text: 'Diskretion, Einfachheit, keine tägliche Routine oder lang anhaltender Schutz: Deine Prioritäten zählen bei dieser Entscheidung.',
      },
    ],
    choiceDiagramTitle: 'Eine kurze Frage zur Entscheidungshilfe',
    questionText: '„Möchte ich lieber jeden Tag, jede Woche oder nur ein paar Mal im Jahr an meine Verhütung denken?“',
    choiceOption1Title: 'Häufig',
    choiceOption1Text: 'Pille oder eine Methode, die regelmäßige Aufmerksamkeit braucht',
    choiceOption2Title: 'Seltener',
    choiceOption2Text: 'Pflaster oder Vaginalring, je nach gewähltem Rhythmus',
    choiceOption3Title: 'Sehr selten',
    choiceOption3Text: 'Implantat oder hormonelle Spirale für die Langzeitverhütung',
    alertTitle: 'Wichtig zu beachten',
    alertText: 'Bei der Wahl eines hormonellen Verhütungsmittels sollten deine persönliche und medizinische Situation berücksichtigt werden. Medizinisches Fachpersonal kann dir helfen, Vorteile, Risiken, Gegenanzeigen und mögliche Nebenwirkungen zu vergleichen.',
    summaryTitle: 'Das Wesentliche',
    summarySubtitle: 'Die wichtigsten Punkte zum Merken',
    summaryRow1: 'Hormonelle Methoden nutzen unterschiedliche Hormonkombinationen und unterschiedliche Anwendungsrhythmen.',
    summaryRow2: 'Pille, Pflaster und Vaginalring erfordern fortlaufende Aufmerksamkeit, Implantat und hormonelle Spirale sind Langzeitmethoden.',
    summaryRow3: 'Die Wahl sollte zu deinem Alltag, deinen Vorlieben, deiner Verträglichkeit und deinen Plänen passen.',
    summaryRow4: 'Keine Methode ist für alle „die beste“ – sie muss vor allem zu deinen Bedürfnissen und deiner Situation passen.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Wenn du dir die Zeit nimmst, die Methoden mit medizinischem Fachpersonal zu vergleichen, findest du eine Verhütung, die du in Ruhe und regelmäßig anwenden kannst.',
    shareMessage: 'Überblick über hormonelle Verhütungsmethoden – AWA',
  },
  zh: {
      badge: '激素类避孕',
      title: '激素类避孕方式概览',
      metaDuration: '阅读约 7 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审核内容',
      intro: '避孕药、避孕贴、阴道环、皮下埋植、含激素宫内节育器：它们有什么不同，以及如何思考哪种方式最适合你的日常生活。',
      contentsTitle: '本文内容',
      topics: [
        '共同的作用机制',
        '不同的方式',
        '如何做出选择',
        '要点回顾',
      ],
      body1: '激素类避孕方式借助激素来预防怀孕。根据方式的不同，它们主要可以抑制排卵、使宫颈黏液变稠，并改变子宫内的环境。',
      diagramTitle: '激素类避孕是如何起作用的？',
      diagramSubtitle: '多种机制可能共同发挥保护作用。',
      step1Title: '排卵',
      step1Text: '有些方式可以阻止或抑制卵子的释放。',
      step2Title: '宫颈黏液',
      step2Text: '黏液可能会变稠，让精子更难通过。',
      step3Title: '避孕保护',
      step3Text: '这些机制共同作用，有助于降低怀孕的风险。',
      body2: '不同的方式对你投入的程度要求并不相同。主要区别在于你需要多久考虑一次避孕这件事。',
      comparisonTitle: '方式对比',
      comparisonSubtitle: '从每天一次的操作到长期保护',
      scaleDaily: '每天',
      scaleWeekly: '每周',
      scaleLongTerm: '长期',
      methods: [
        {
          title: '避孕药',
          frequency: '每天一次',
          duration: '按时规律服用',
          profile: '适合希望自己掌控避孕的你',
        },
        {
          title: '避孕贴',
          frequency: '每周一次',
          duration: '每 4 周中使用 3 周',
          profile: '适合不想每天操作的你',
        },
        {
          title: '阴道环',
          frequency: '每 3 周一次',
          duration: '之后休息一周',
          profile: '不显眼，日常几乎不需要额外操作',
        },
        {
          title: '皮下埋植',
          frequency: '可持续数年',
          duration: '无需每天操作',
          profile: '适合想要长期避孕的你',
        },
        {
          title: '含激素宫内节育器',
          frequency: '可持续数年',
          duration: '由专业人员放置',
          profile: '长期方案，几乎不需要日常维护',
        },
      ],
      highlightTitle: '最需要记住的一点',
      highlightText: '一种方式需要的日常操作越少，你需要惦记它的次数就越少。如果你知道自己可能会忘记服药或更换，这一点值得考虑。',
      body3: '并不存在适合所有人的理想方式。最佳选择取决于你的日常生活、个人偏好、耐受情况以及未来的计划。',
      criteria: [
        {
          title: '你的日常生活',
          text: '有些方式需要每天操作，有些则可以持续数周甚至数年。',
        },
        {
          title: '你的耐受情况',
          text: '每个人对同一种方式的感受可能不同。与医疗专业人员聊一聊，有助于你找到适合自己的方式。',
        },
        {
          title: '你的计划',
          text: '如果你希望近期或以后怀孕，这种方式的持续时间和可逆性可以帮助你做出选择。',
        },
        {
          title: '你的优先考虑',
          text: '不显眼、简单、无需每天操作，或是长效保护：你的优先考虑在这个决定中同样重要。',
        },
      ],
      choiceDiagramTitle: '一个帮助你决定的小问题',
      questionText: '“我更愿意每天、每周，还是一年只想几次避孕这件事？”',
      choiceOption1Title: '经常',
      choiceOption1Text: '避孕药，或需要定期关注的方式',
      choiceOption2Title: '较少',
      choiceOption2Text: '避孕贴或阴道环，取决于你选择的节奏',
      choiceOption3Title: '很少',
      choiceOption3Text: '皮下埋植或长效含激素宫内节育器',
      alertTitle: '请注意',
      alertText: '选择激素类避孕方式时，应结合你个人的身体和病史情况。医疗专业人员可以帮助你比较各种方式的益处、风险、禁忌证和可能的副作用。',
      summaryTitle: '要点',
      summarySubtitle: '需要记住的关键内容',
      summaryRow1: '激素类方式使用的激素组合不同，使用的安排也不同。',
      summaryRow2: '避孕药、避孕贴和阴道环需要持续投入，而皮下埋植和含激素宫内节育器属于长效方式。',
      summaryRow3: '选择应契合你的日常生活、个人偏好、耐受情况和计划。',
      summaryRow4: '没有哪种方式是对所有人“最好”的，关键在于它是否适合你的需求和情况。',
      tip1Title: '小贴士',
      tip1Text: '花时间与医疗专业人员一起比较各种方式，有助于你选择一种可以安心、持续使用的避孕方式。',
      shareMessage: '激素类避孕方式概览 — AWA',
    },
  id: {
    badge: 'TERAPI HORMONAL',
    title: 'Gambaran umum kontrasepsi hormonal',
    metaDuration: '7 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Pil, koyo, cincin vagina, implan, IUD hormonal: apa yang membedakannya dan bagaimana memilih metode yang paling cocok dengan keseharianmu.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Mekanisme kerja yang sama',
      'Berbagai metode',
      'Cara menentukan pilihan',
      'Poin-poin penting',
    ],
    body1: 'Metode hormonal menggunakan hormon untuk mencegah kehamilan. Tergantung metodenya, cara kerjanya terutama bisa mencegah ovulasi, mengentalkan lendir serviks, dan mengubah lingkungan rahim.',
    diagramTitle: 'Bagaimana kontrasepsi hormonal bekerja?',
    diagramSubtitle: 'Beberapa mekanisme bisa berperan dalam perlindungan.',
    step1Title: 'Ovulasi',
    step1Text: 'Sebagian metode mencegah atau menghambat pelepasan sel telur.',
    step2Title: 'Lendir serviks',
    step2Text: 'Lendir bisa menjadi lebih kental, sehingga sperma lebih sulit melewatinya.',
    step3Title: 'Perlindungan kontrasepsi',
    step3Text: 'Gabungan mekanisme ini membantu mengurangi risiko kehamilan.',
    body2: 'Tidak semua metode menuntut keterlibatan yang sama. Perbedaan utamanya adalah seberapa sering kamu perlu memikirkan kontrasepsimu.',
    comparisonTitle: 'Membandingkan metode',
    comparisonSubtitle: 'Dari tindakan harian hingga perlindungan jangka panjang',
    scaleDaily: 'Harian',
    scaleWeekly: 'Mingguan',
    scaleLongTerm: 'Jangka panjang',
    methods: [
      {
        title: 'Pil',
        frequency: 'Setiap hari',
        duration: 'Diminum secara teratur',
        profile: 'Cocok jika kamu ingin mengatur sendiri kontrasepsimu',
      },
      {
        title: 'Koyo',
        frequency: 'Setiap minggu',
        duration: '3 minggu dari 4',
        profile: 'Praktis jika kamu lebih suka menghindari rutinitas harian',
      },
      {
        title: 'Cincin vagina',
        frequency: 'Setiap 3 minggu',
        duration: 'Dengan jeda satu minggu',
        profile: 'Pilihan yang tidak mencolok dengan sedikit tindakan harian',
      },
      {
        title: 'Implan',
        frequency: 'Beberapa tahun',
        duration: 'Tanpa rutinitas harian',
        profile: 'Cocok jika kamu menginginkan kontrasepsi jangka panjang',
      },
      {
        title: 'IUD hormonal',
        frequency: 'Beberapa tahun',
        duration: 'Dipasang oleh tenaga profesional',
        profile: 'Solusi jangka panjang yang hampir tidak memerlukan perawatan',
      },
    ],
    highlightTitle: 'Hal terpenting yang perlu diingat',
    highlightText: 'Semakin sedikit tindakan harian yang dibutuhkan suatu metode, semakin jarang kamu perlu memikirkannya. Hal ini layak dipertimbangkan jika kamu tahu bahwa kamu cenderung lupa satu dosis atau satu pergantian.',
    body3: 'Tidak ada satu metode yang ideal untuk semua orang. Pilihan terbaik bergantung pada keseharianmu, preferensimu, toleransimu, dan rencanamu.',
    criteria: [
      {
        title: 'Keseharianmu',
        text: 'Sebagian metode menuntut tindakan harian, sementara yang lain bekerja selama beberapa minggu atau tahun.',
      },
      {
        title: 'Toleransimu',
        text: 'Cara tubuh merasakan suatu metode bisa berbeda dari satu orang ke orang lain. Berbicara dengan tenaga kesehatan bisa membantumu menentukan apa yang cocok untukmu.',
      },
      {
        title: 'Rencanamu',
        text: 'Jika kamu berharap hamil dalam waktu dekat atau nanti, durasi dan sifat reversibel suatu metode bisa membantu menentukan pilihanmu.',
      },
      {
        title: 'Prioritasmu',
        text: 'Kerahasiaan, kesederhanaan, tanpa rutinitas harian, atau perlindungan yang tahan lama: prioritasmu penting dalam keputusan ini.',
      },
    ],
    choiceDiagramTitle: 'Satu pertanyaan singkat untuk membantumu memutuskan',
    questionText: '“Apakah aku lebih suka memikirkan kontrasepsiku setiap hari, setiap minggu, atau hanya beberapa kali setahun?”',
    choiceOption1Title: 'Sering',
    choiceOption1Text: 'Pil atau metode yang membutuhkan perhatian rutin',
    choiceOption2Title: 'Lebih jarang',
    choiceOption2Text: 'Koyo atau cincin vagina, tergantung ritme yang kamu pilih',
    choiceOption3Title: 'Sangat jarang',
    choiceOption3Text: 'Implan atau IUD hormonal jangka panjang',
    alertTitle: 'Perlu dicatat',
    alertText: 'Memilih kontrasepsi hormonal perlu mempertimbangkan kondisi pribadi dan medismu. Tenaga kesehatan bisa membantumu membandingkan manfaat, risiko, kontraindikasi, dan kemungkinan efek samping.',
    summaryTitle: 'Intinya',
    summarySubtitle: 'Poin-poin utama yang perlu diingat',
    summaryRow1: 'Metode hormonal menggunakan kombinasi hormon dan jadwal penggunaan yang berbeda-beda.',
    summaryRow2: 'Pil, koyo, dan cincin vagina menuntut keterlibatan yang berkelanjutan, sedangkan implan dan IUD hormonal adalah metode jangka panjang.',
    summaryRow3: 'Pilihannya sebaiknya sesuai dengan keseharianmu, preferensimu, toleransimu, dan rencanamu.',
    summaryRow4: 'Tidak ada metode yang “terbaik” untuk semua orang — yang terpenting adalah metode itu sesuai dengan kebutuhan dan keadaanmu.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Meluangkan waktu untuk membandingkan metode bersama tenaga kesehatan membantumu memilih kontrasepsi yang bisa kamu gunakan dengan tenang dan konsisten.',
    shareMessage: 'Gambaran umum kontrasepsi hormonal — AWA',
  },
  hi: {
    badge: 'हार्मोनल उपचार',
    title: 'हार्मोनल गर्भनिरोधक उपचारों का परिचय',
    metaDuration: '7 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'गोली, पैच, वजाइनल रिंग, इम्प्लांट, हार्मोनल IUD: इनमें क्या फ़र्क़ है, और अपनी रोज़मर्रा की ज़िंदगी के हिसाब से सबसे सही तरीके के बारे में कैसे सोचें।',
    contentsTitle: 'इस लेख में',
    topics: [
      'काम करने का साझा तरीका',
      'अलग-अलग तरीके',
      'चुनाव कैसे करें',
      'मुख्य बातें',
    ],
    body1: 'हार्मोनल तरीके गर्भावस्था रोकने के लिए हार्मोन का इस्तेमाल करते हैं। तरीके के हिसाब से ये मुख्य रूप से ओव्यूलेशन (अंडोत्सर्ग) को रोक सकते हैं, गर्भाशय ग्रीवा के म्यूकस को गाढ़ा कर सकते हैं और गर्भाशय के अंदर के वातावरण को बदल सकते हैं।',
    diagramTitle: 'हार्मोनल गर्भनिरोध कैसे काम करता है?',
    diagramSubtitle: 'सुरक्षा में कई प्रक्रियाएँ योगदान दे सकती हैं।',
    step1Title: 'ओव्यूलेशन',
    step1Text: 'कुछ तरीके अंडे के निकलने को रोकते हैं या कम करते हैं।',
    step2Title: 'गर्भाशय ग्रीवा का म्यूकस',
    step2Text: 'म्यूकस गाढ़ा हो सकता है, जिससे शुक्राणुओं का आगे बढ़ना मुश्किल हो जाता है।',
    step3Title: 'गर्भनिरोधक सुरक्षा',
    step3Text: 'इन प्रक्रियाओं का मिला-जुला असर गर्भावस्था का जोखिम कम करने में मदद करता है।',
    body2: 'सभी तरीकों में एक जैसी भागीदारी की ज़रूरत नहीं होती। मुख्य फ़र्क़ यह है कि आपको अपने गर्भनिरोध के बारे में कितनी बार सोचना पड़ता है।',
    comparisonTitle: 'तरीकों की तुलना',
    comparisonSubtitle: 'रोज़ाना के काम से लेकर लंबे समय की सुरक्षा तक',
    scaleDaily: 'रोज़ाना',
    scaleWeekly: 'साप्ताहिक',
    scaleLongTerm: 'लंबे समय के लिए',
    methods: [
      {
        title: 'गोली',
        frequency: 'हर दिन',
        duration: 'नियमित रूप से ली जाती है',
        profile: 'अगर आप अपना गर्भनिरोध खुद संभालना चाहती हैं तो बढ़िया',
      },
      {
        title: 'पैच',
        frequency: 'हर सप्ताह',
        duration: '4 में से 3 सप्ताह',
        profile: 'अगर आप रोज़ की दिनचर्या से बचना चाहती हैं तो सुविधाजनक',
      },
      {
        title: 'वजाइनल रिंग',
        frequency: 'हर 3 सप्ताह',
        duration: 'एक सप्ताह के ब्रेक के साथ',
        profile: 'एक गोपनीय विकल्प, जिसमें रोज़ कम काम करना पड़ता है',
      },
      {
        title: 'इम्प्लांट',
        frequency: 'कई साल',
        duration: 'रोज़ की कोई दिनचर्या नहीं',
        profile: 'अगर आप लंबे समय का गर्भनिरोध चाहती हैं तो उपयुक्त',
      },
      {
        title: 'हार्मोनल IUD',
        frequency: 'कई साल',
        duration: 'विशेषज्ञ द्वारा लगाई जाती है',
        profile: 'लंबे समय का समाधान, जिसकी बहुत कम देखभाल करनी पड़ती है',
      },
    ],
    highlightTitle: 'याद रखने वाली मुख्य बात',
    highlightText: 'जिस तरीके में रोज़ जितने कम काम करने पड़ते हैं, उसके बारे में आपको उतनी ही कम बार सोचना पड़ता है। अगर आपको लगता है कि आप कोई खुराक या बदलाव भूल सकती हैं, तो यह बात ध्यान में रखने लायक है।',
    body3: 'सभी के लिए कोई एक आदर्श तरीका नहीं होता। सही चुनाव आपकी दिनचर्या, आपकी पसंद, आपके शरीर की सहनशीलता और आपकी योजनाओं पर निर्भर करता है।',
    criteria: [
      {
        title: 'आपकी दिनचर्या',
        text: 'कुछ तरीकों में रोज़ कुछ करना पड़ता है, जबकि बाकी कई सप्ताहों या सालों तक काम करते हैं।',
      },
      {
        title: 'आपकी सहनशीलता',
        text: 'कोई तरीका कैसा महसूस होता है, यह हर महिला में अलग हो सकता है। स्वास्थ्य विशेषज्ञ से बात करने से यह समझने में मदद मिल सकती है कि आपके लिए क्या ठीक रहेगा।',
      },
      {
        title: 'आपकी योजनाएँ',
        text: 'अगर आप जल्द या कुछ समय बाद गर्भावस्था चाहती हैं, तो तरीके की अवधि और उसे वापस पलटने की संभावना चुनाव में मार्गदर्शन कर सकती है।',
      },
      {
        title: 'आपकी प्राथमिकताएँ',
        text: 'गोपनीयता, सरलता, रोज़ की दिनचर्या से छुटकारा या लंबे समय की सुरक्षा: इस फ़ैसले में आपकी प्राथमिकताएँ मायने रखती हैं।',
      },
    ],
    choiceDiagramTitle: 'फ़ैसला लेने में मदद करने वाला एक छोटा सवाल',
    questionText: '“क्या मैं अपने गर्भनिरोध के बारे में रोज़, हर सप्ताह, या साल में बस कुछ ही बार सोचना पसंद करूँगी?”',
    choiceOption1Title: 'अक्सर',
    choiceOption1Text: 'गोली या ऐसा तरीका जिसमें नियमित ध्यान देना पड़ता है',
    choiceOption2Title: 'कम बार',
    choiceOption2Text: 'पैच या रिंग, आपके चुने हुए क्रम के अनुसार',
    choiceOption3Title: 'बहुत कम',
    choiceOption3Text: 'इम्प्लांट या लंबे समय के लिए हार्मोनल IUD',
    alertTitle: 'ध्यान देने योग्य',
    alertText: 'हार्मोनल गर्भनिरोधक चुनते समय आपकी निजी और चिकित्सकीय स्थिति को ध्यान में रखना चाहिए। स्वास्थ्य विशेषज्ञ आपको फ़ायदे, जोखिम, मना किए जाने के कारण (कॉन्ट्राइंडिकेशन) और संभावित दुष्प्रभावों की तुलना करने में मदद कर सकते हैं।',
    summaryTitle: 'ज़रूरी बातें',
    summarySubtitle: 'याद रखने लायक मुख्य बिंदु',
    summaryRow1: 'हार्मोनल तरीके अलग-अलग हार्मोन संयोजनों और इस्तेमाल के अलग-अलग क्रम का उपयोग करते हैं।',
    summaryRow2: 'गोली, पैच और रिंग में लगातार ध्यान देना पड़ता है, जबकि इम्प्लांट और हार्मोनल IUD लंबे समय के तरीके हैं।',
    summaryRow3: 'चुनाव आपकी दिनचर्या, आपकी पसंद, आपकी सहनशीलता और आपकी योजनाओं के अनुकूल होना चाहिए।',
    summaryRow4: 'कोई भी तरीका सभी के लिए “सबसे अच्छा” नहीं होता — मुख्य बात यह है कि वह आपकी ज़रूरतों और आपकी स्थिति के अनुकूल हो।',
    tip1Title: 'जानना ज़रूरी है',
    tip1Text: 'स्वास्थ्य विशेषज्ञ के साथ तरीकों की तुलना करने के लिए समय निकालने से आप ऐसा गर्भनिरोध चुन पाती हैं जिसे आप सुकून से और नियमित रूप से अपना सकें।',
    shareMessage: 'हार्मोनल गर्भनिरोधक उपचारों का परिचय — AWA',
  },
  sq: {
    badge: 'TRAJTIMET HORMONALE',
    title: 'Një pasqyrë e trajtimeve kontraceptive hormonale',
    metaDuration: '7 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e shqyrtuar',
    intro: 'Tableta, arna, unaza, implanti, spiralja hormonale: çfarë i dallon dhe si ta mendosh metodën që i përshtatet më mirë jetës sate të përditshme.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Një mekanizëm i përbashkët veprimi',
      'Metodat e ndryshme',
      'Si ta orientosh zgjedhjen',
      'Pikat kryesore',
    ],
    body1: 'Metodat hormonale përdorin hormone për të parandaluar shtatzëninë. Sipas metodës, ato mund të parandalojnë kryesisht ovulacionin, të trashin mukozën e qafës së mitrës dhe të ndryshojnë mjedisin e mitrës.',
    diagramTitle: 'Si funksionon kontracepsioni hormonal?',
    diagramSubtitle: 'Disa mekanizma mund të kontribuojnë në mbrojtje.',
    step1Title: 'Ovulacioni',
    step1Text: 'Disa metoda parandalojnë ose frenojnë çlirimin e vezës.',
    step2Title: 'Mukoza e qafës së mitrës',
    step2Text: 'Mukoza mund të bëhet më e trashë, çka e vështirëson kalimin e spermatozoideve.',
    step3Title: 'Mbrojtja kontraceptive',
    step3Text: 'Kombinimi i këtyre mekanizmave ndihmon të ulet rreziku i shtatzënisë.',
    body2: 'Jo të gjitha metodat kërkojnë të njëjtin nivel angazhimi. Dallimi kryesor është sa shpesh duhet të mendosh për kontracepsionin tënd.',
    comparisonTitle: 'Krahasimi i metodave',
    comparisonSubtitle: 'Nga një veprim i përditshëm te mbrojtja afatgjatë',
    scaleDaily: 'Çdo ditë',
    scaleWeekly: 'Çdo javë',
    scaleLongTerm: 'Afatgjatë',
    methods: [
      {
        title: 'Tableta',
        frequency: 'Çdo ditë',
        duration: 'Merret rregullisht',
        profile: 'Ideale nëse dëshiron ta menaxhosh vetë kontracepsionin tënd',
      },
      {
        title: 'Arna (flasteri)',
        frequency: 'Çdo javë',
        duration: '3 javë nga 4',
        profile: 'E përshtatshme nëse preferon të shmangësh një rutinë të përditshme',
      },
      {
        title: 'Unaza vaginale',
        frequency: 'Çdo 3 javë',
        duration: 'Me një pushim njëjavor',
        profile: 'Një opsion diskret me pak veprime të përditshme',
      },
      {
        title: 'Implanti',
        frequency: 'Disa vjet',
        duration: 'Pa rutinë të përditshme',
        profile: 'I përshtatshëm nëse dëshiron kontracepsion afatgjatë',
      },
      {
        title: 'Spiralja hormonale',
        frequency: 'Disa vjet',
        duration: 'Vendoset nga një profesionist',
        profile: 'Një zgjidhje afatgjatë që kërkon shumë pak kujdes nga ana jote',
      },
    ],
    highlightTitle: 'Çka duhet mbajtur mend',
    highlightText: 'Sa më pak veprime ditore kërkon një metodë, aq më rrallë duhet të mendosh për të. Kjo mund të ketë rëndësi nëse e di se ka gjasa të harrosh një dozë ose një ndërrim.',
    body3: 'Nuk ka një metodë ideale për të gjitha. Zgjedhja më e mirë varet nga jeta jote e përditshme, preferencat, toleranca dhe planet e tua.',
    criteria: [
      {
        title: 'Jeta jote e përditshme',
        text: 'Disa metoda kërkojnë një veprim të përditshëm, ndërsa të tjera veprojnë për disa javë ose vjet.',
      },
      {
        title: 'Toleranca jote',
        text: 'Mënyra se si e ndien një metodë mund të ndryshojë nga një grua te tjetra. Biseda me një profesionist të shëndetësisë mund të të ndihmojë të kuptosh çfarë të përshtatet.',
      },
      {
        title: 'Planet e tua',
        text: 'Nëse shpreson për një shtatzëni së shpejti ose më vonë, kohëzgjatja e metodës dhe kthyeshmëria e saj mund të ndihmojnë ta orientosh zgjedhjen.',
      },
      {
        title: 'Përparësitë e tua',
        text: 'Diskretësia, thjeshtësia, mungesa e rutinës ditore ose mbrojtja afatgjatë: përparësitë e tua kanë rëndësi në këtë vendim.',
      },
    ],
    choiceDiagramTitle: 'Një pyetje e shpejtë për të të ndihmuar të vendosësh',
    questionText: '“A do të preferoja të mendoja për kontracepsionin tim çdo ditë, çdo javë apo vetëm pak herë në vit?”',
    choiceOption1Title: 'Shpesh',
    choiceOption1Text: 'Tableta ose një metodë që kërkon vëmendje të rregullt',
    choiceOption2Title: 'Më rrallë',
    choiceOption2Text: 'Arna ose unaza, sipas ritmit që zgjedh',
    choiceOption3Title: 'Shumë rrallë',
    choiceOption3Text: 'Implanti ose spiralja hormonale afatgjatë',
    alertTitle: 'Vlen të përmendet',
    alertText: 'Zgjedhja e një kontraceptivi hormonal duhet të marrë parasysh situatën tënde personale dhe mjekësore. Një profesionist i shëndetësisë mund të të ndihmojë të krahasosh përfitimet, rreziqet, kundërindikacionet dhe efektet anësore të mundshme.',
    summaryTitle: 'Thelbi',
    summarySubtitle: 'Pikat kryesore që duhen mbajtur parasysh',
    summaryRow1: 'Metodat hormonale përdorin kombinime të ndryshme hormonesh dhe orare të ndryshme përdorimi.',
    summaryRow2: 'Tableta, arna dhe unaza kërkojnë angazhim të vazhdueshëm, ndërsa implanti dhe spiralja hormonale janë metoda afatgjatë.',
    summaryRow3: 'Zgjedhja duhet t’i përshtatet jetës sate të përditshme, preferencave, tolerancës dhe planeve të tua.',
    summaryRow4: 'Asnjë metodë nuk është “më e mira” për të gjitha — kryesisht duhet të jetë në përputhje me nevojat dhe situatën tënde.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Të marrësh kohë për t’i krahasuar metodat me një profesionist të shëndetësisë të ndihmon të zgjedhësh një kontracepsion që mund ta përdorësh me qetësi dhe me konsistencë.',
    shareMessage: 'Një pasqyrë e trajtimeve kontraceptive hormonale — AWA',
  },
  ja: {
    badge: 'ホルモン剤による避妊',
    title: 'ホルモン避妊法の概要',
    metaDuration: '読了時間7分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '確認済みの内容',
    intro: 'ピル、パッチ、腟リング、インプラント、ホルモン放出IUD。それぞれの違いと、日常生活に合う方法の考え方を紹介します。',
    contentsTitle: 'この記事の内容',
    topics: [
      '共通する作用のしくみ',
      'さまざまな方法',
      '選ぶときの考え方',
      'ポイントのまとめ',
    ],
    body1: 'ホルモンを使う避妊法は、ホルモンの働きで妊娠を防ぎます。方法によって、主に排卵を抑える、子宮頸管粘液を濃くする、子宮内の環境を変えるといった働きがあります。',
    diagramTitle: 'ホルモン避妊法はどのように働く？',
    diagramSubtitle: 'いくつかのしくみが避妊効果に関わっていると考えられています。',
    step1Title: '排卵',
    step1Text: '方法によっては、卵子の放出を防いだり抑えたりします。',
    step2Title: '子宮頸管粘液',
    step2Text: '粘液が濃くなることがあり、精子が通りにくくなります。',
    step3Title: '避妊効果',
    step3Text: 'これらのしくみが組み合わさることで、妊娠のリスクが下がります。',
    body2: 'すべての方法が、同じだけの手間を必要とするわけではありません。主な違いは、避妊について意識する頻度です。',
    comparisonTitle: '方法を比べる',
    comparisonSubtitle: '毎日の行動から、長期にわたる避妊まで',
    scaleDaily: '毎日',
    scaleWeekly: '毎週',
    scaleLongTerm: '長期',
    methods: [
      {
        title: 'ピル',
        frequency: '毎日',
        duration: '定期的に服用',
        profile: 'ご自身で避妊を管理したい方に向いています',
      },
      {
        title: 'パッチ',
        frequency: '毎週',
        duration: '4週間のうち3週間',
        profile: '毎日の習慣を避けたい方に便利です',
      },
      {
        title: '腟リング',
        frequency: '3週間ごと',
        duration: '1週間の休止期間あり',
        profile: '目立たず、日々の手間が少ない選択肢です',
      },
      {
        title: 'インプラント',
        frequency: '数年',
        duration: '毎日の習慣は不要',
        profile: '長期の避妊を望む方に向いています',
      },
      {
        title: 'ホルモン放出IUD',
        frequency: '数年',
        duration: '専門家が挿入',
        profile: '手入れがほとんど要らない、長期的な方法です',
      },
    ],
    highlightTitle: '覚えておきたいポイント',
    highlightText: '日々の手間が少ない方法ほど、避妊について考える頻度は少なくなります。飲み忘れや交換の忘れが心配な場合は、検討する価値があります。',
    body3: 'すべての人に理想的な方法があるわけではありません。最適な選択は、日常生活、好み、体への合い方、将来の計画によって変わります。',
    criteria: [
      {
        title: '日常生活',
        text: '毎日の行動が必要な方法もあれば、数週間から数年にわたって効果が続く方法もあります。',
      },
      {
        title: '体への合い方',
        text: '方法による感じ方には個人差があります。医療従事者と話すことで、自分に合うものを見つけやすくなります。',
      },
      {
        title: '将来の計画',
        text: '近いうちに、あるいは将来に妊娠を望んでいる場合は、方法の持続期間や元の状態に戻れるかどうかが選ぶ手がかりになります。',
      },
      {
        title: '大切にしたいこと',
        text: '目立たないこと、簡単さ、毎日の習慣が要らないこと、長く続く効果など、ご自身が大切にしたいことも決め手になります。',
      },
    ],
    choiceDiagramTitle: '決めるときのかんたんな問いかけ',
    questionText: '「避妊のことを、毎日、毎週、それとも年に数回だけ考えたいだろうか？」',
    choiceOption1Title: '頻繁に',
    choiceOption1Text: 'ピル、またはこまめな管理が必要な方法',
    choiceOption2Title: 'あまり頻繁でなく',
    choiceOption2Text: 'パッチまたは腟リング（希望するリズムによります）',
    choiceOption3Title: 'ほとんどなく',
    choiceOption3Text: 'インプラント、または長期使用のホルモン放出IUD',
    alertTitle: '注意したいこと',
    alertText: 'ホルモン避妊法を選ぶときは、個人の状況や健康状態を考慮する必要があります。医療従事者は、利点、リスク、禁忌、起こりうる副作用を比べる手助けをしてくれます。',
    summaryTitle: '要点',
    summarySubtitle: '覚えておきたいポイント',
    summaryRow1: 'ホルモン避妊法には、ホルモンの組み合わせや使い方のスケジュールが異なるものがあります。',
    summaryRow2: 'ピル、パッチ、腟リングは継続的な管理が必要で、インプラントとホルモン放出IUDは長期的な方法です。',
    summaryRow3: '選択は、日常生活、好み、体への合い方、将来の計画に合っていることが大切です。',
    summaryRow4: '誰にとっても「最良」の方法はありません。ご自身の希望や状況に合っていることが何より重要です。',
    tip1Title: '知っておきたいこと',
    tip1Text: '医療従事者と一緒に時間をかけて方法を比べることで、安心して続けられる避妊法を選びやすくなります。',
    shareMessage: 'ホルモン避妊法の概要 — AWA',
  },
  ko: {
    badge: '호르몬 피임법',
    title: '호르몬 피임법 한눈에 보기',
    metaDuration: '읽는 데 7분',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '피임약, 패치, 질링, 피임 임플란트, 호르몬 자궁 내 장치. 각각 무엇이 다르고, 일상에 가장 잘 맞는 방법을 어떻게 생각해 보면 좋을지 알아봐요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '공통된 작용 원리',
      '다양한 방법',
      '선택에 도움이 되는 기준',
      '핵심 정리',
    ],
    body1: '호르몬 피임법은 호르몬을 이용해 임신을 막아요. 방법에 따라 주로 배란을 막고, 자궁 경부 점액을 끈끈하게 하고, 자궁 내 환경을 바꾸는 방식으로 작용할 수 있어요.',
    diagramTitle: '호르몬 피임은 어떻게 작용할까요?',
    diagramSubtitle: '여러 가지 작용이 함께 보호 효과에 기여할 수 있어요.',
    step1Title: '배란',
    step1Text: '일부 방법은 난자가 배출되는 것을 막거나 억제해요.',
    step2Title: '자궁 경부 점액',
    step2Text: '점액이 더 끈끈해져서 정자가 통과하기 어려워질 수 있어요.',
    step3Title: '피임 효과',
    step3Text: '이런 작용이 함께 이루어지면서 임신 위험을 낮추는 데 도움이 돼요.',
    body2: '모든 방법이 같은 정도의 관심을 요구하는 것은 아니에요. 가장 큰 차이는 피임을 얼마나 자주 신경 써야 하는가예요.',
    comparisonTitle: '방법 비교하기',
    comparisonSubtitle: '매일 하는 행동부터 장기적인 보호까지',
    scaleDaily: '매일',
    scaleWeekly: '매주',
    scaleLongTerm: '장기',
    methods: [
      {
        title: '피임약',
        frequency: '매일',
        duration: '규칙적으로 복용',
        profile: '스스로 피임을 관리하고 싶을 때 잘 맞아요',
      },
      {
        title: '피임 패치',
        frequency: '매주',
        duration: '4주 중 3주',
        profile: '매일 챙기는 것이 부담스럽다면 편리해요',
      },
      {
        title: '질링',
        frequency: '3주마다',
        duration: '1주 쉬는 기간 포함',
        profile: '일상에서 할 일이 적은 눈에 띄지 않는 방법이에요',
      },
      {
        title: '피임 임플란트',
        frequency: '수년',
        duration: '매일 챙길 필요 없음',
        profile: '장기간 피임을 원할 때 알맞아요',
      },
      {
        title: '호르몬 자궁 내 장치',
        frequency: '수년',
        duration: '전문가가 삽입',
        profile: '관리할 일이 거의 없는 장기 방법이에요',
      },
    ],
    highlightTitle: '꼭 기억해 두세요',
    highlightText: '일상에서 해야 할 행동이 적은 방법일수록 피임을 신경 쓰는 횟수가 줄어요. 복용이나 교체를 잊기 쉽다고 느낀다면 고려해 볼 만해요.',
    body3: '모두에게 이상적인 방법이 하나만 있는 것은 아니에요. 가장 좋은 선택은 일상, 선호, 몸의 반응, 그리고 앞으로의 계획에 따라 달라져요.',
    criteria: [
      {
        title: '나의 일상',
        text: '매일 해야 하는 방법도 있고, 몇 주 또는 몇 년 동안 유지되는 방법도 있어요.',
      },
      {
        title: '몸의 반응',
        text: '방법에 대한 느낌은 사람마다 다를 수 있어요. 의료 전문가와 이야기하면 나에게 맞는 방법을 찾는 데 도움이 돼요.',
      },
      {
        title: '앞으로의 계획',
        text: '곧 또는 나중에 임신을 바란다면, 방법의 지속 기간과 되돌릴 수 있는지가 선택에 도움이 될 수 있어요.',
      },
      {
        title: '나의 우선순위',
        text: '눈에 띄지 않는 것, 간편함, 매일 챙기지 않아도 되는 것, 오래 가는 보호 등 나의 우선순위도 이 결정에서 중요해요.',
      },
    ],
    choiceDiagramTitle: '선택에 도움이 되는 간단한 질문',
    questionText: '“피임을 매일, 매주, 아니면 1년에 몇 번만 신경 쓰고 싶은가요?”',
    choiceOption1Title: '자주',
    choiceOption1Text: '피임약 또는 규칙적인 관심이 필요한 방법',
    choiceOption2Title: '덜 자주',
    choiceOption2Text: '선택한 주기에 따라 피임 패치 또는 질링',
    choiceOption3Title: '아주 가끔',
    choiceOption3Text: '피임 임플란트 또는 장기 호르몬 자궁 내 장치',
    alertTitle: '참고해 주세요',
    alertText: '호르몬 피임법을 선택할 때는 개인의 건강 상태와 의학적 상황을 고려해야 해요. 의료 전문가가 이점, 위험, 사용하면 안 되는 경우, 생길 수 있는 부작용을 함께 비교해 줄 수 있어요.',
    summaryTitle: '핵심 요약',
    summarySubtitle: '기억해 둘 주요 내용',
    summaryRow1: '호르몬 피임법은 호르몬 조합과 사용 일정이 서로 달라요.',
    summaryRow2: '피임약, 패치, 질링은 꾸준한 관심이 필요하고, 임플란트와 호르몬 자궁 내 장치는 장기 방법이에요.',
    summaryRow3: '선택은 일상, 선호, 몸의 반응, 앞으로의 계획에 맞아야 해요.',
    summaryRow4: '모두에게 “최고”인 방법은 없어요. 나의 필요와 상황에 잘 맞는 것이 가장 중요해요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '의료 전문가와 함께 방법을 비교해 보는 시간을 가지면, 편안하고 꾸준히 사용할 수 있는 피임법을 고르는 데 도움이 돼요.',
    shareMessage: '호르몬 피임법 한눈에 보기 — AWA',
  },
  'pt-PT': {
    badge: 'TRATAMENTOS HORMONAIS',
    title: 'Panorama dos tratamentos contracetivos hormonais',
    metaDuration: '7 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Pílula, adesivo, anel vaginal, implante, DIU hormonal: o que os distingue e como pensar no método que melhor se adapta ao seu dia a dia.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Um mecanismo de ação comum',
      'Os diferentes métodos',
      'Como orientar a sua escolha',
      'Pontos-chave',
    ],
    body1: 'Os métodos hormonais utilizam hormonas para prevenir a gravidez. Consoante o método, podem sobretudo impedir a ovulação, espessar o muco cervical e modificar o ambiente do útero.',
    diagramTitle: 'Como funciona a contraceção hormonal?',
    diagramSubtitle: 'Vários mecanismos podem contribuir para a proteção.',
    step1Title: 'Ovulação',
    step1Text: 'Alguns métodos impedem ou inibem a libertação do óvulo.',
    step2Title: 'Muco cervical',
    step2Text: 'O muco pode tornar-se mais espesso, o que dificulta a passagem dos espermatozoides.',
    step3Title: 'Proteção contracetiva',
    step3Text: 'A combinação destes mecanismos ajuda a reduzir o risco de gravidez.',
    body2: 'Nem todos os métodos exigem o mesmo nível de envolvimento. A principal diferença é a frequência com que precisa de pensar na sua contraceção.',
    comparisonTitle: 'Comparar os métodos',
    comparisonSubtitle: 'De uma ação diária a uma proteção de longa duração',
    scaleDaily: 'Diário',
    scaleWeekly: 'Semanal',
    scaleLongTerm: 'Longa duração',
    methods: [
      {
        title: 'Pílula',
        frequency: 'Todos os dias',
        duration: 'Toma regular',
        profile: 'Ideal se quiser gerir a sua própria contraceção',
      },
      {
        title: 'Adesivo',
        frequency: 'Todas as semanas',
        duration: '3 semanas em cada 4',
        profile: 'Prático se preferir evitar uma rotina diária',
      },
      {
        title: 'Anel vaginal',
        frequency: 'A cada 3 semanas',
        duration: 'Com uma pausa de uma semana',
        profile: 'Uma opção discreta, com poucas ações no dia a dia',
      },
      {
        title: 'Implante',
        frequency: 'Vários anos',
        duration: 'Sem rotina diária',
        profile: 'Indicado se quiser uma contraceção de longa duração',
      },
      {
        title: 'DIU hormonal',
        frequency: 'Vários anos',
        duration: 'Colocado por um profissional',
        profile: 'Uma solução de longa duração que exige muito pouca manutenção',
      },
    ],
    highlightTitle: 'O essencial a reter',
    highlightText: 'Quanto menos ações diárias um método exige, menos vezes precisa de pensar nele. Isto pode ser relevante se sabe que é provável esquecer-se de uma toma ou de uma substituição.',
    body3: 'Não existe um método ideal para todas as mulheres. A melhor escolha depende do seu dia a dia, das suas preferências, da sua tolerância e dos seus planos.',
    criteria: [
      {
        title: 'O seu dia a dia',
        text: 'Alguns métodos exigem uma ação diária, enquanto outros funcionam durante várias semanas ou anos.',
      },
      {
        title: 'A sua tolerância',
        text: 'A forma como um método é sentido pode variar de mulher para mulher. Conversar com um profissional de saúde pode ajudar a perceber o que lhe convém.',
      },
      {
        title: 'Os seus planos',
        text: 'Se espera uma gravidez em breve ou mais tarde, a duração do método e a sua reversibilidade podem ajudar a orientar a escolha.',
      },
      {
        title: 'As suas prioridades',
        text: 'Discrição, simplicidade, ausência de rotina diária ou proteção duradoura: as suas prioridades contam nesta decisão.',
      },
    ],
    choiceDiagramTitle: 'Uma pergunta rápida para ajudar a decidir',
    questionText: '“Prefiro pensar na minha contraceção todos os dias, todas as semanas ou apenas algumas vezes por ano?”',
    choiceOption1Title: 'Com frequência',
    choiceOption1Text: 'Pílula ou um método que exige atenção regular',
    choiceOption2Title: 'Com menos frequência',
    choiceOption2Text: 'Adesivo ou anel vaginal, consoante o ritmo que escolher',
    choiceOption3Title: 'Muito raramente',
    choiceOption3Text: 'Implante ou DIU hormonal de longa duração',
    alertTitle: 'A ter em conta',
    alertText: 'A escolha de um contracetivo hormonal deve ter em conta a sua situação pessoal e médica. Um profissional de saúde pode ajudá-la a comparar os benefícios, os riscos, as contraindicações e os possíveis efeitos secundários.',
    summaryTitle: 'O essencial',
    summarySubtitle: 'Os pontos-chave a ter em mente',
    summaryRow1: 'Os métodos hormonais utilizam diferentes combinações de hormonas e diferentes esquemas de utilização.',
    summaryRow2: 'A pílula, o adesivo e o anel vaginal exigem um envolvimento contínuo, enquanto o implante e o DIU hormonal são métodos de longa duração.',
    summaryRow3: 'A escolha deve adequar-se ao seu dia a dia, às suas preferências, à sua tolerância e aos seus planos.',
    summaryRow4: 'Nenhum método é universalmente “o melhor” — o principal é que seja compatível com as suas necessidades e com a sua situação.',
    tip1Title: 'Bom saber',
    tip1Text: 'Dedicar tempo a comparar os métodos com um profissional de saúde ajuda a escolher uma contraceção que possa utilizar com serenidade e de forma consistente.',
    shareMessage: 'Panorama dos tratamentos contracetivos hormonais — AWA',
  },
  bn: {
    badge: 'হরমোনাল চিকিৎসা',
    title: 'হরমোনাল জন্মনিয়ন্ত্রণ পদ্ধতির সার্বিক চিত্র',
    metaDuration: 'পড়তে 7 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'বড়ি, প্যাচ, রিং, ইমপ্ল্যান্ট, হরমোনাল আইইউডি: এগুলোর মধ্যে পার্থক্য কী এবং আপনার দৈনন্দিন জীবনের সঙ্গে সবচেয়ে মানানসই পদ্ধতি কীভাবে ভাববেন।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'কাজ করার অভিন্ন পদ্ধতি',
      'বিভিন্ন পদ্ধতি',
      'পছন্দ নির্ধারণে কীভাবে এগোবেন',
      'মূল কথা',
    ],
    body1: 'হরমোনাল পদ্ধতিতে গর্ভধারণ রোধ করতে হরমোন ব্যবহার করা হয়। পদ্ধতিভেদে এগুলো মূলত ডিম্বস্ফোটন রোধ করতে, জরায়ুমুখের মিউকাস ঘন করতে এবং জরায়ুর পরিবেশ বদলে দিতে পারে।',
    diagramTitle: 'হরমোনাল জন্মনিয়ন্ত্রণ কীভাবে কাজ করে?',
    diagramSubtitle: 'সুরক্ষায় একাধিক প্রক্রিয়া ভূমিকা রাখতে পারে।',
    step1Title: 'ডিম্বস্ফোটন',
    step1Text: 'কিছু পদ্ধতি ডিম্বাণু নির্গত হওয়া রোধ করে বা বাধা দেয়।',
    step2Title: 'জরায়ুমুখের মিউকাস',
    step2Text: 'মিউকাস ঘন হয়ে যেতে পারে, ফলে শুক্রাণুর পক্ষে অতিক্রম করা কঠিন হয়।',
    step3Title: 'গর্ভনিরোধক সুরক্ষা',
    step3Text: 'এই প্রক্রিয়াগুলোর সম্মিলিত প্রভাব গর্ভধারণের ঝুঁকি কমাতে সাহায্য করে।',
    body2: 'সব পদ্ধতিতে একই মাত্রার সক্রিয়তা দরকার হয় না। প্রধান পার্থক্য হলো আপনাকে কত ঘন ঘন জন্মনিয়ন্ত্রণের কথা মাথায় রাখতে হয়।',
    comparisonTitle: 'পদ্ধতিগুলোর তুলনা',
    comparisonSubtitle: 'দৈনিক পদক্ষেপ থেকে দীর্ঘমেয়াদি সুরক্ষা পর্যন্ত',
    scaleDaily: 'দৈনিক',
    scaleWeekly: 'সাপ্তাহিক',
    scaleLongTerm: 'দীর্ঘমেয়াদি',
    methods: [
      {
        title: 'বড়ি',
        frequency: 'প্রতিদিন',
        duration: 'নিয়মিত সেবন',
        profile: 'নিজের জন্মনিয়ন্ত্রণ নিজে পরিচালনা করতে চাইলে আদর্শ',
      },
      {
        title: 'প্যাচ',
        frequency: 'প্রতি সপ্তাহে',
        duration: '4 সপ্তাহের মধ্যে 3 সপ্তাহ',
        profile: 'দৈনিক রুটিন এড়াতে চাইলে সুবিধাজনক',
      },
      {
        title: 'যোনিপথের রিং',
        frequency: 'প্রতি 3 সপ্তাহে',
        duration: 'এক সপ্তাহের বিরতিসহ',
        profile: 'একটি গোপনীয় বিকল্প, দৈনন্দিন পদক্ষেপ খুব কম',
      },
      {
        title: 'ইমপ্ল্যান্ট',
        frequency: 'কয়েক বছর',
        duration: 'দৈনিক কোনো রুটিন নেই',
        profile: 'দীর্ঘমেয়াদি জন্মনিয়ন্ত্রণ চাইলে উপযোগী',
      },
      {
        title: 'হরমোনাল আইইউডি',
        frequency: 'কয়েক বছর',
        duration: 'পেশাজীবী স্থাপন করেন',
        profile: 'দীর্ঘমেয়াদি সমাধান, যাতে রক্ষণাবেক্ষণ খুবই কম লাগে',
      },
    ],
    highlightTitle: 'মনে রাখার মূল বিষয়',
    highlightText: 'কোনো পদ্ধতিতে দৈনন্দিন পদক্ষেপ যত কম লাগে, সেটির কথা তত কম ভাবতে হয়। কোনো ডোজ বা পরিবর্তনের কথা ভুলে যাওয়ার সম্ভাবনা থাকলে এটি বিবেচনা করা মূল্যবান হতে পারে।',
    body3: 'সবার জন্য একটিমাত্র আদর্শ পদ্ধতি নেই। সেরা পছন্দ নির্ভর করে আপনার দৈনন্দিন জীবন, পছন্দ, সহনশীলতা এবং পরিকল্পনার ওপর।',
    criteria: [
      {
        title: 'আপনার দৈনন্দিন জীবন',
        text: 'কিছু পদ্ধতিতে প্রতিদিন একটি পদক্ষেপ লাগে, আবার কিছু পদ্ধতি কয়েক সপ্তাহ বা কয়েক বছর কাজ করে।',
      },
      {
        title: 'আপনার সহনশীলতা',
        text: 'একটি পদ্ধতি কেমন অনুভূত হয় তা একেকজনের ক্ষেত্রে আলাদা হতে পারে। স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে কথা বললে কোনটি আপনার জন্য উপযুক্ত তা বুঝতে সুবিধা হয়।',
      },
      {
        title: 'আপনার পরিকল্পনা',
        text: 'শিগগির বা পরে গর্ভধারণের ইচ্ছা থাকলে পদ্ধতির স্থায়িত্ব এবং তা বন্ধ করলে স্বাভাবিক প্রজনন ক্ষমতা ফিরে আসার বিষয়টি পছন্দ নির্ধারণে সাহায্য করতে পারে।',
      },
      {
        title: 'আপনার অগ্রাধিকার',
        text: 'গোপনীয়তা, সহজতা, দৈনিক রুটিনের ঝামেলা না থাকা বা দীর্ঘস্থায়ী সুরক্ষা: এই সিদ্ধান্তে আপনার অগ্রাধিকার গুরুত্বপূর্ণ।',
      },
    ],
    choiceDiagramTitle: 'সিদ্ধান্ত নিতে সাহায্য করার একটি ছোট প্রশ্ন',
    questionText: '“আমি কি প্রতিদিন, প্রতি সপ্তাহে, নাকি বছরে মাত্র কয়েকবার আমার জন্মনিয়ন্ত্রণের কথা ভাবতে চাই?”',
    choiceOption1Title: 'ঘন ঘন',
    choiceOption1Text: 'বড়ি বা নিয়মিত মনোযোগ প্রয়োজন এমন পদ্ধতি',
    choiceOption2Title: 'কম ঘন ঘন',
    choiceOption2Text: 'প্যাচ বা রিং, আপনার বেছে নেওয়া ছন্দ অনুযায়ী',
    choiceOption3Title: 'খুবই কম',
    choiceOption3Text: 'ইমপ্ল্যান্ট বা দীর্ঘমেয়াদি হরমোনাল আইইউডি',
    alertTitle: 'লক্ষ রাখার মতো',
    alertText: 'হরমোনাল জন্মনিয়ন্ত্রণ বেছে নেওয়ার সময় আপনার ব্যক্তিগত ও চিকিৎসাগত অবস্থা বিবেচনায় নেওয়া উচিত। স্বাস্থ্যসেবা পেশাজীবী উপকারিতা, ঝুঁকি, প্রতিনির্দেশনা (ব্যবহারে নিষেধ বা সতর্কতা) এবং সম্ভাব্য পার্শ্বপ্রতিক্রিয়া তুলনা করতে আপনাকে সাহায্য করতে পারেন।',
    summaryTitle: 'সারকথা',
    summarySubtitle: 'মনে রাখার মতো মূল বিষয়গুলো',
    summaryRow1: 'হরমোনাল পদ্ধতিগুলোতে হরমোনের সংমিশ্রণ ও ব্যবহারের সময়সূচি আলাদা আলাদা।',
    summaryRow2: 'বড়ি, প্যাচ ও রিংয়ে নিয়মিত সক্রিয়তা দরকার, আর ইমপ্ল্যান্ট ও হরমোনাল আইইউডি দীর্ঘমেয়াদি পদ্ধতি।',
    summaryRow3: 'পছন্দ আপনার দৈনন্দিন জীবন, পছন্দ-অপছন্দ, সহনশীলতা এবং পরিকল্পনার সঙ্গে মানানসই হওয়া উচিত।',
    summaryRow4: 'কোনো পদ্ধতিই সবার জন্য সর্বজনীনভাবে “সেরা” নয়, মূলত সেটি আপনার প্রয়োজন ও পরিস্থিতির সঙ্গে সামঞ্জস্যপূর্ণ হতে হবে।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে পদ্ধতিগুলো তুলনা করার জন্য সময় নিলে এমন জন্মনিয়ন্ত্রণ বেছে নেওয়া যায়, যা আপনি নিশ্চিন্তে ও নিয়মিতভাবে ব্যবহার করতে পারবেন।',
    shareMessage: 'হরমোনাল জন্মনিয়ন্ত্রণ পদ্ধতির সার্বিক চিত্র — AWA',
  },
  da: {
    badge: 'Hormonel prævention',
    title: 'Overblik over hormonale\npræventionsmetoder',
    metaDuration: '7 minutters læsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemset indhold',
    intro: 'P-pille, plaster, ring, implantat, hormonspiral: hvad er forskellen, og hvordan finder du ud af, hvilken metode der passer bedst til din hverdag?',
    contentsTitle: 'I denne artikel',
    topics: [
      'Fælles virkningsmekanisme',
      'De forskellige metoder',
      'Sådan nærmer du dig valget',
      'Det vigtigste',
    ],
    body1: 'Hormonale metoder bruger hormoner til at forebygge graviditet. Afhængigt af metoden kan de primært forhindre ægløsning, gøre livmoderhalsslimet tykkere og ændre livmodermiljøet.',
    diagramTitle: 'Hvordan virker hormonel prævention?',
    diagramSubtitle: 'Flere mekanismer kan bidrage til beskyttelsen.',
    step1Title: 'Ægløsning',
    step1Text: 'Visse metoder forhindrer eller hæmmer frigivelsen af et æg.',
    step2Title: 'Livmoderhalsslimet',
    step2Text: 'Slimet kan blive tykkere, hvilket gør det sværere for sædceller at passere.',
    step3Title: 'Prævention',
    step3Text: 'Den samlede effekt af disse mekanismer hjælper med at reducere risikoen for graviditet.',
    body2: 'Ikke alle metoder kræver den samme grad af aktiv indsats. Den vigtigste forskel er, hvor ofte du skal tænke på din prævention.',
    comparisonTitle: 'Sammenligning af metoder',
    comparisonSubtitle: 'Fra daglige handlinger til langsigtet beskyttelse',
    scaleDaily: 'Dagligt',
    scaleWeekly: 'Ugentligt',
    scaleLongTerm: 'Langsigtet',
    methods: [
      {
        title: 'P-pille',
        frequency: 'Hver dag',
        duration: 'Daglig indtagelse',
        profile: 'Ideel til dem, der ønsker selv at styre præventionen',
      },
      {
        title: 'Plaster',
        frequency: 'Hver uge',
        duration: '3 uger ud af 4',
        profile: 'Praktisk for dem, der vil undgå en daglig rutine',
      },
      {
        title: 'Vaginalt ringe',
        frequency: 'Hver 3. uge',
        duration: 'Med en uges pause',
        profile: 'En diskret mulighed med meget få daglige handlinger',
      },
      {
        title: 'Implantat',
        frequency: 'Hvert par år',
        duration: 'Ingen daglig rutine',
        profile: 'Velegnet til dem, der ønsker langsigtet prævention',
      },
      {
        title: 'Hormonspiral',
        frequency: 'Hvert par år',
        duration: 'Indsat af fagpersonale',
        profile: 'Langsigtet løsning med minimal vedligeholdelse',
      },
    ],
    highlightTitle: 'Husk dette',
    highlightText: 'Jo færre handlinger en metode kræver dagligt, jo sjældnere skal du tænke på den. Det kan være værd at overveje, hvis du risikerer at glemme en dosis eller en udskiftning.',
    body3: 'Der er ingen én perfekt metode for alle. Det bedste valg afhænger af din hverdag, præferencer, tolerance og planer.',
    criteria: [
      {
        title: 'Din hverdag',
        text: 'Nogle metoder kræver én daglig handling, mens andre virker i uger eller år.',
      },
      {
        title: 'Din tolerance',
        text: 'Oplevelsen af en metode kan variere fra person til person. En samtale med et sundhedspersonale kan hjælpe dig med at finde ud af, hvad der passer til dig.',
      },
      {
        title: 'Dine planer',
        text: 'Ønsket om graviditet snart eller på sigt kan spille ind på valget af metodens varighed og hvornår fertiliteten vender tilbage efter stop.',
      },
      {
        title: 'Dine prioriteter',
        text: 'Diskretion, enkelhed, ingen daglig rutine eller langsigtet beskyttelse: dine prioriteter tæller i denne beslutning.',
      },
    ],
    choiceDiagramTitle: 'Et lille spørgsmål til at hjælpe dig med at vælge',
    questionText: '"Vil jeg tænke på min prævention hver dag, hver uge, eller kun et par gange om året?"',
    choiceOption1Title: 'Ofte',
    choiceOption1Text: 'P-pille eller metoder, der kræver regelmæssig opmærksomhed',
    choiceOption2Title: 'Sjældnere',
    choiceOption2Text: 'Plaster eller ring, i den rytme du vælger',
    choiceOption3Title: 'Meget sjældent',
    choiceOption3Text: 'Implantat eller langsigtet hormonspiral',
    alertTitle: 'Vær opmærksom',
    alertText: 'Valget af hormonel prævention bør tage hensyn til din personlige og medicinske situation. Et sundhedspersonale kan hjælpe dig med at sammenligne fordele, risici, kontraindikationer og mulige bivirkninger.',
    summaryTitle: 'Det vigtigste',
    summarySubtitle: 'Vigtige punkter at huske',
    summaryRow1: 'Hormonale metoder varierer i hormonssammensætning og anvendelsesfrekvens.',
    summaryRow2: 'P-piller, plaster og ring kræver regelmæssig indsats, mens implantat og hormonspiral er langsigtede løsninger.',
    summaryRow3: 'Valget bør passe til din hverdag, præferencer, tolerance og planer.',
    summaryRow4: 'Ingen metode er universelt "bedst" – det handler om at finde den, der passer til dine behov og situation.',
    tip1Title: 'Godt at vide',
    tip1Text: 'At bruge tid på at sammenligne metoderne med et sundhedspersonale giver dig mulighed for at vælge en prævention, du med ro og regelmæssighed kan bruge.',
    shareMessage: 'Overblik over hormonale præventionsmetoder — AWA',
  },
  da: {
    badge: 'Hormonel prävention',
    title: 'Overblik over hormonale\npräventionsmetoder',
    metaDuration: '7 minutters läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemset indhold',
    intro: 'P-pille, plaster, ring, implantat, hormonspiral: hvad ar forskellen, och hvordan finder du ud av, hvilken metode der passer bedst till din hverdag?',
    contentsTitle: 'I denne artikel',
    topics: [
      'Fälles virkningsmekanisme',
      'De forskellige metoder',
      'Sådan närmer du dig valget',
      'Det vigtigste',
    ],
    body1: 'Hormonale metoder bruger hormoner till at forebygge graviditet. Afhängigt av metoden kan de primärt forhindre äglösning, göre livmoderhalsslimet tykkere och ändre livmodermiljöet.',
    diagramTitle: 'Hvordan virker hormonel prävention?',
    diagramSubtitle: 'Flere mekanismer kan bidrage till beskyttelsen.',
    step1Title: 'Äglösning',
    step1Text: 'Visse metoder forhindrer eller hämmer frigivelsen av et äg.',
    step2Title: 'Livmoderhalsslimet',
    step2Text: 'Slimet kan blive tykkere, hvilket gör det svärere for sädceller at passere.',
    step3Title: 'Prävention',
    step3Text: 'Den samlede effekt av disse mekanismer hjälper med at reducere risikoen for graviditet.',
    body2: 'Ikke alla metoder kräver den samme grad av aktiv indsats. Den vigtigste forskel ar, hvor ofta du skal tänke på din prävention.',
    comparisonTitle: 'Sammenligning av metoder',
    comparisonSubtitle: 'Fra daglige handlinger till langsigtet beskyttelse',
    scaleDaily: 'Dagligt',
    scaleWeekly: 'Ugentligt',
    scaleLongTerm: 'Langsigtet',
    methods: [
      {
        title: 'P-pille',
        frequency: 'Hver dag',
        duration: 'Daglig indtagelse',
        profile: 'Ideel till dem, der önsker selv at styre präventionen',
      },
      {
        title: 'Plaster',
        frequency: 'Hver uge',
        duration: '3 veckor ud av 4',
        profile: 'Praktisk for dem, der vil undgå en daglig rutine',
      },
      {
        title: 'Vaginalt ringe',
        frequency: 'Hver 3. uge',
        duration: 'Med en uges pause',
        profile: 'En diskret mulighed med mycket få daglige handlinger',
      },
      {
        title: 'Implantat',
        frequency: 'Hvert par år',
        duration: 'Ingen daglig rutine',
        profile: 'Velegnet till dem, der önsker langsigtet prävention',
      },
      {
        title: 'Hormonspiral',
        frequency: 'Hvert par år',
        duration: 'Indsat av fagpersonale',
        profile: 'Langsigtet lösning med minimal vedligeholdelse',
      },
    ],
    highlightTitle: 'Husk dette',
    highlightText: 'Jo färre handlinger en metode kräver dagligt, jo själdnere skal du tänke på den. Det kan väre värd at overveje, hvis du risikerer at glemme en dosis eller en udskiftning.',
    body3: 'Der ar ingen én perfekt metode for alle. Det bedste valg afhänger av din hverdag, präferencer, tolerance och planer.',
    criteria: [
      {
        title: 'Din hverdag',
        text: 'Nogle metoder kräver én daglig handling, mens andre virker i veckor eller år.',
      },
      {
        title: 'Din tolerance',
        text: 'Oplevelsen av en metode kan variere fran person till person. En samtale med et halsaspersonale kan hjälpe dig med at finde ud av, hvad der passer till dig.',
      },
      {
        title: 'Dine planer',
        text: 'Önsket om graviditet snart eller på sigt kan spille ind på valget av metodens varighed och hvornår fertiliteten vender tilbage efter stop.',
      },
      {
        title: 'Dine prioriteter',
        text: 'Diskretion, enkelhed, ingen daglig rutine eller langsigtet beskyttelse: dina prioriteter täller i denne beslutning.',
      },
    ],
    choiceDiagramTitle: 'Et lille spörgsmål till at hjälpe dig med at välge',
    questionText: '"Vil jag tänke på min prävention hver dag, hver vecka, eller kun et par gange om året?"',
    choiceOption1Title: 'Ofte',
    choiceOption1Text: 'P-pille eller metoder, der kräver regelmässig opmärksomhed',
    choiceOption2Title: 'Själdnere',
    choiceOption2Text: 'Plaster eller ring, i den rytme du välger',
    choiceOption3Title: 'Meget själdent',
    choiceOption3Text: 'Implantat eller langsigtet hormonspiral',
    alertTitle: 'Vär opmärksom',
    alertText: 'Valget av hormonel prävention bör tage hensyn till din personlige och medicinske situation. Et halsaspersonale kan hjälpe dig med at sammenligne fordele, risici, kontraindikationer och mulige bivirkninger.',
    summaryTitle: 'Det vigtigste',
    summarySubtitle: 'Vigtige punkter at huske',
    summaryRow1: 'Hormonale metoder varierer i hormonssammensätning och anvendelsesfrekvens.',
    summaryRow2: 'P-piller, plaster och ring kräver regelmässig indsats, mens implantat och hormonspiral ar langsigtede lösninger.',
    summaryRow3: 'Valget bör passe till din hverdag, präferencer, tolerance och planer.',
    summaryRow4: 'Ingen metode ar universelt "bedst" – det handler om at finde den, der passer till dina behov och situation.',
    tip1Title: 'Godt at vide',
    tip1Text: 'At bruge tid på at sammenligne metoderne med et halsaspersonale giver dig mulighed for att välge en prävention, du med ro och regelmässighed kan bruge.',
    shareMessage: 'Overblik over hormonale präventionsmetoder — AWA',
  },
  sv: {
    badge: 'Hormonel prävention',
    title: 'Overblik over hormonale\npräventionsmetoder',
    metaDuration: '7 minutters läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemset indhold',
    intro: 'P-pille, plaster, ring, implantat, hormonspiral: hvad ar forskellen, och hvordan finder du ud av, hvilken metode der passer bedst till din hverdag?',
    contentsTitle: 'I denne artikel',
    topics: [
      'Fälles virkningsmekanisme',
      'De forskellige metoder',
      'Sådan närmer du dig valget',
      'Det vigtigste',
    ],
    body1: 'Hormonale metoder bruger hormoner till at forebygge graviditet. Afhängigt av metoden kan de primärt forhindre äglösning, göre livmoderhalsslimet tykkere och ändre livmodermiljöet.',
    diagramTitle: 'Hvordan virker hormonel prävention?',
    diagramSubtitle: 'Flere mekanismer kan bidrage till beskyttelsen.',
    step1Title: 'Äglösning',
    step1Text: 'Visse metoder forhindrer eller hämmer frigivelsen av et äg.',
    step2Title: 'Livmoderhalsslimet',
    step2Text: 'Slimet kan blive tykkere, hvilket gör det svärere for sädceller at passere.',
    step3Title: 'Prävention',
    step3Text: 'Den samlede effekt av disse mekanismer hjälper med at reducere risikoen for graviditet.',
    body2: 'Ikke alla metoder kräver den samme grad av aktiv indsats. Den vigtigste forskel ar, hvor ofta du skal tänke på din prävention.',
    comparisonTitle: 'Sammenligning av metoder',
    comparisonSubtitle: 'Fra daglige handlinger till langsigtet beskyttelse',
    scaleDaily: 'Dagligt',
    scaleWeekly: 'Ugentligt',
    scaleLongTerm: 'Langsigtet',
    methods: [
      {
        title: 'P-pille',
        frequency: 'Hver dag',
        duration: 'Daglig indtagelse',
        profile: 'Ideel till dem, der önsker selv at styre präventionen',
      },
      {
        title: 'Plaster',
        frequency: 'Hver uge',
        duration: '3 veckor ud av 4',
        profile: 'Praktisk for dem, der vil undgå en daglig rutine',
      },
      {
        title: 'Vaginalt ringe',
        frequency: 'Hver 3. uge',
        duration: 'Med en uges pause',
        profile: 'En diskret mulighed med mycket få daglige handlinger',
      },
      {
        title: 'Implantat',
        frequency: 'Hvert par år',
        duration: 'Ingen daglig rutine',
        profile: 'Velegnet till dem, der önsker langsigtet prävention',
      },
      {
        title: 'Hormonspiral',
        frequency: 'Hvert par år',
        duration: 'Indsat av fagpersonale',
        profile: 'Langsigtet lösning med minimal vedligeholdelse',
      },
    ],
    highlightTitle: 'Husk dette',
    highlightText: 'Jo färre handlinger en metode kräver dagligt, jo själdnere skal du tänke på den. Det kan väre värd at overveje, hvis du risikerer at glemme en dosis eller en udskiftning.',
    body3: 'Der ar ingen én perfekt metode for alle. Det bedste valg afhänger av din hverdag, präferencer, tolerance och planer.',
    criteria: [
      {
        title: 'Din hverdag',
        text: 'Nogle metoder kräver én daglig handling, mens andre virker i veckor eller år.',
      },
      {
        title: 'Din tolerance',
        text: 'Oplevelsen av en metode kan variere fran person till person. En samtale med et halsaspersonale kan hjälpe dig med at finde ud av, hvad der passer till dig.',
      },
      {
        title: 'Dine planer',
        text: 'Önsket om graviditet snart eller på sigt kan spille ind på valget av metodens varighed och hvornår fertiliteten vender tilbage efter stop.',
      },
      {
        title: 'Dine prioriteter',
        text: 'Diskretion, enkelhed, ingen daglig rutine eller langsigtet beskyttelse: dina prioriteter täller i denne beslutning.',
      },
    ],
    choiceDiagramTitle: 'Et lille spörgsmål till at hjälpe dig med at välge',
    questionText: '"Vil jag tänke på min prävention hver dag, hver vecka, eller kun et par gange om året?"',
    choiceOption1Title: 'Ofte',
    choiceOption1Text: 'P-pille eller metoder, der kräver regelmässig opmärksomhed',
    choiceOption2Title: 'Själdnere',
    choiceOption2Text: 'Plaster eller ring, i den rytme du välger',
    choiceOption3Title: 'Meget själdent',
    choiceOption3Text: 'Implantat eller langsigtet hormonspiral',
    alertTitle: 'Vär opmärksom',
    alertText: 'Valget av hormonel prävention bör tage hensyn till din personlige och medicinske situation. Et halsaspersonale kan hjälpe dig med at sammenligne fordele, risici, kontraindikationer och mulige bivirkninger.',
    summaryTitle: 'Det vigtigste',
    summarySubtitle: 'Vigtige punkter at huske',
    summaryRow1: 'Hormonale metoder varierer i hormonssammensätning och anvendelsesfrekvens.',
    summaryRow2: 'P-piller, plaster och ring kräver regelmässig indsats, mens implantat och hormonspiral ar langsigtede lösninger.',
    summaryRow3: 'Valget bör passe till din hverdag, präferencer, tolerance och planer.',
    summaryRow4: 'Ingen metode ar universelt "bedst" – det handler om at finde den, der passer till dina behov och situation.',
    tip1Title: 'Godt at vide',
    tip1Text: 'At bruge tid på at sammenligne metoderne med et halsaspersonale giver dig mulighed for att välge en prävention, du med ro och regelmässighed kan bruge.',
    shareMessage: 'Overblik over hormonale präventionsmetoder — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function HormonalTreatmentsPanoramaArticleScreen({
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
          <Image source={resolveEditorialImage(HERO, lang)} resizeMode="cover" style={styles.hero} />

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

          <AwaText variant="titleLarge" emphasized style={styles.title}>
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

          {/* SECTION 1 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.topics[0]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body1}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.actionDiagram}>
            <View style={styles.diagramHeader}>
              <View style={styles.diagramHeaderIcon}>
                <MaterialDesignIcons
                  name="shield-check-outline"
                  size={22}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.diagramHeaderCopy}>
                <AwaText variant="titleSmall" emphasized>
                  {content.diagramTitle}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.diagramSubtitle}>
                  {content.diagramSubtitle}
                </AwaText>
              </View>
            </View>

            <View style={styles.diagramLine} />

            <View style={styles.diagramStep}>
              <View style={styles.stepNumber}>
                <AwaText variant="titleSmall" emphasized style={styles.stepNumberText}>1</AwaText>
              </View>

              <View style={styles.stepCopy}>
                <AwaText variant="titleSmall" emphasized>{content.step1Title}</AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.stepText}>
                  {content.step1Text}
                </AwaText>
              </View>
            </View>

            <View style={styles.diagramConnector} />

            <View style={styles.diagramStep}>
              <View style={styles.stepNumber}>
                <AwaText variant="titleSmall" emphasized style={styles.stepNumberText}>2</AwaText>
              </View>

              <View style={styles.stepCopy}>
                <AwaText variant="titleSmall" emphasized>{content.step2Title}</AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.stepText}>
                  {content.step2Text}
                </AwaText>
              </View>
            </View>

            <View style={styles.diagramConnector} />

            <View style={styles.diagramStep}>
              <View style={styles.stepNumber}>
                <AwaText variant="titleSmall" emphasized style={styles.stepNumberText}>3</AwaText>
              </View>

              <View style={styles.stepCopy}>
                <AwaText variant="titleSmall" emphasized>{content.step3Title}</AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.stepText}>
                  {content.step3Text}
                </AwaText>
              </View>
            </View>
          </AwaCard>

          {/* SECTION 2 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.comparisonCard}>
            <View style={styles.comparisonHeader}>
              <View>
                <AwaText variant="titleMedium" emphasized>
                  {content.comparisonTitle}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.comparisonSubtitle}>
                  {content.comparisonSubtitle}
                </AwaText>
              </View>

              <View style={styles.comparisonIcon}>
                <MaterialDesignIcons
                  name="scale-balance"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>
            </View>

            <View style={styles.frequencyScale}>
              <View style={styles.scalePoint}>
                <View style={styles.scaleDot} />
                <AwaText variant="labelSmall" colorRole="onSurfaceVariant" style={styles.scaleText}>{content.scaleDaily}</AwaText>
              </View>

              <View style={styles.scaleLine} />

              <View style={styles.scalePoint}>
                <View style={styles.scaleDot} />
                <AwaText variant="labelSmall" colorRole="onSurfaceVariant" style={styles.scaleText}>{content.scaleWeekly}</AwaText>
              </View>

              <View style={styles.scaleLine} />

              <View style={styles.scalePoint}>
                <View style={styles.scaleDot} />
                <AwaText variant="labelSmall" colorRole="onSurfaceVariant" style={styles.scaleText}>{content.scaleLongTerm}</AwaText>
              </View>
            </View>

            <View style={styles.methodList}>
              {content.methods.map((method, index) => (
                <View
                  key={method.title}
                  style={[
                    styles.methodCard,
                    index === content.methods.length - 1 &&
                      styles.methodCardLast,
                  ]}>
                  <View style={styles.methodIcon}>
                    <MaterialDesignIcons
                      name={METHOD_ICONS[index] as never}
                      size={23}
                      color={theme.colors.primary}
                    />
                  </View>

                  <View style={styles.methodMain}>
                    <View style={styles.methodTitleRow}>
                      <AwaText variant="titleSmall" emphasized style={styles.methodTitle}>{method.title}</AwaText>

                      <View style={styles.frequencyBadge}>
                        <AwaText variant="labelSmall" emphasized colorRole="primary">
                          {method.frequency}
                        </AwaText>
                      </View>
                    </View>

                    <AwaText variant="labelSmall" colorRole="primary" style={styles.methodDuration}>
                      {method.duration}
                    </AwaText>

                    <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.methodProfile}>
                      {method.profile}
                    </AwaText>
                  </View>
                </View>
              ))}
            </View>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.highlightBox}>
            <View style={styles.highlightIcon}>
              <MaterialDesignIcons
                name="clock-check-outline"
                size={23}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.highlightCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.highlightTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.highlightText}>
                {content.highlightText}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 3 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body3}
          </AwaText>

          <View style={styles.criteriaGrid}>
            {content.criteria.map((criterion, index) => (
              <AwaCard variant="filled" padding="none" key={criterion.title} style={styles.criteriaCard}>
                <View style={styles.criteriaIcon}>
                  <MaterialDesignIcons
                    name={CRITERIA_ICONS[index] as never}
                    size={21}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="titleSmall" emphasized style={styles.criteriaTitle}>{criterion.title}</AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.criteriaText}>{criterion.text}</AwaText>
              </AwaCard>
            ))}
          </View>

          <AwaCard variant="filled" padding="none" style={styles.choiceDiagram}>
            <View style={styles.choiceDiagramHeader}>
              <MaterialDesignIcons
                name="compass-outline"
                size={23}
                color={theme.colors.primary}
              />

              <AwaText variant="titleSmall" emphasized style={styles.choiceDiagramTitle}>
                {content.choiceDiagramTitle}
              </AwaText>
            </View>

            <AwaText variant="titleSmall" colorRole="onSurfaceVariant" style={styles.questionText}>
              {content.questionText}
            </AwaText>

            <View style={styles.choiceOptions}>
              <View style={styles.choiceOption}>
                <AwaText variant="labelSmall" emphasized colorRole="primary">
                  {content.choiceOption1Title}
                </AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.choiceOptionText}>
                  {content.choiceOption1Text}
                </AwaText>
              </View>

              <View style={styles.choiceOption}>
                <AwaText variant="labelSmall" emphasized colorRole="primary">
                  {content.choiceOption2Title}
                </AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.choiceOptionText}>
                  {content.choiceOption2Text}
                </AwaText>
              </View>

              <View style={styles.choiceOption}>
                <AwaText variant="labelSmall" emphasized colorRole="primary">
                  {content.choiceOption3Title}
                </AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.choiceOptionText}>
                  {content.choiceOption3Text}
                </AwaText>
              </View>
            </View>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
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
          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIcon}>
                <MaterialDesignIcons
                  name="check-decagram-outline"
                  size={24}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.summaryHeaderCopy}>
                <AwaText variant="titleSmall" emphasized>{content.summaryTitle}</AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summarySubtitle}>
                  {content.summarySubtitle}
                </AwaText>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <MaterialDesignIcons
                name="check-circle-outline"
                size={19}
                color={theme.colors.success}
              />

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
                {content.summaryRow1}
              </AwaText>
            </View>

            <View style={styles.summaryRow}>
              <MaterialDesignIcons
                name="check-circle-outline"
                size={19}
                color={theme.colors.success}
              />

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
                {content.summaryRow2}
              </AwaText>
            </View>

            <View style={styles.summaryRow}>
              <MaterialDesignIcons
                name="check-circle-outline"
                size={19}
                color={theme.colors.success}
              />

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
                {content.summaryRow3}
              </AwaText>
            </View>

            <View style={styles.summaryRow}>
              <MaterialDesignIcons
                name="check-circle-outline"
                size={19}
                color={theme.colors.success}
              />

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
                {content.summaryRow4}
              </AwaText>
            </View>
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

  /*
   * ACTION DIAGRAM
   */

  actionDiagram: {
    marginTop: 16,
    padding: 16,
  },

  diagramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  diagramHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  diagramHeaderCopy: {
    flex: 1,
    marginLeft: 12,
  },


  diagramSubtitle: {
    marginTop: 2,
  },

  diagramLine: {
    height: 1,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: theme.colors.border,
  },

  diagramStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  stepNumber: {
    width: 29,
    height: 29,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },

  stepNumberText: {
    color: onPrimaryTextColor(theme),
  },

  stepCopy: {
    flex: 1,
    marginLeft: 12,
  },


  stepText: {
    marginTop: 3,
  },

  diagramConnector: {
    width: 1,
    height: 17,
    marginLeft: 16,
    backgroundColor: theme.colors.border,
  },

  /*
   * COMPARISON
   */

  comparisonCard: {
    marginTop: 16,
    padding: 16,
  },

  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },


  comparisonSubtitle: {
    marginTop: 3,
  },

  comparisonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  frequencyScale: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  scalePoint: {
    alignItems: 'center',
  },

  scaleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },

  scaleText: {
    marginTop: 4,
  },

  scaleLine: {
    flex: 1,
    height: 1,
    marginHorizontal: 8,
    marginBottom: 16,
    backgroundColor: theme.colors.border,
  },

  methodList: {
    marginTop: 16,
  },

  methodCard: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  methodCardLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },

  methodIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  methodMain: {
    flex: 1,
    marginLeft: 12,
  },

  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  methodTitle: {
    flex: 1,
  },

  frequencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.primarySoft,
  },


  methodDuration: {
    marginTop: 4,
  },

  methodProfile: {
    marginTop: 4,
  },

  highlightBox: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  highlightIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  highlightCopy: {
    flex: 1,
    marginLeft: 12,
  },


  highlightText: {
    marginTop: 4,
  },

  /*
   * CHOICE CRITERIA
   */

  criteriaGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  criteriaCard: {
    width: '48.5%',
    minHeight: 165,
    padding: 12,
  },

  criteriaIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  criteriaTitle: {
    marginTop: 8,
  },

  criteriaText: {
    marginTop: 4,
  },

  /*
   * CHOICE DIAGRAM
   */

  choiceDiagram: {
    marginTop: 16,
    padding: 16,
  },

  choiceDiagramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  choiceDiagramTitle: {
    flex: 1,
  },

  questionText: {
    marginTop: 12,
  },

  choiceOptions: {
    marginTop: 12,
    gap: 8,
  },

  choiceOption: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },


  choiceOptionText: {
    marginTop: 3,
  },

  /*
   * ALERT
   */

  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  /*
   * SUMMARY
   */

  summaryCard: {
    marginTop: 16,
    padding: 16,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  summaryHeaderCopy: {
    flex: 1,
    marginLeft: 12,
  },


  summarySubtitle: {
    marginTop: 2,
  },

  summaryDivider: {
    height: 1,
    marginVertical: 16,
    backgroundColor: theme.colors.border,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },

  summaryText: {
    flex: 1,
  },

  /*
   * TIP
   */

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
    marginTop: 3,
  },
  });
}
