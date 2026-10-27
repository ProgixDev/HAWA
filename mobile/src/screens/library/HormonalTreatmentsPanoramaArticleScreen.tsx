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
  nb: {
    badge: 'HORMONBEHANDLINGER',
    title: 'Oversikt over hormonelle prevensjonsbehandlinger',
    metaDuration: '7 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'P-pille, plaster, ring, implantat, hormonspiral: hva som skiller dem, og hvordan du kan tenke om metoden som passer best i hverdagen din.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'En felles virkningsmekanisme',
      'De ulike metodene',
      'Hvordan du kan veilede valget ditt',
      'Det viktigste å huske',
    ],
    body1: 'Hormonelle metoder bruker hormoner for å hindre graviditet. Avhengig av metoden kan de hovedsakelig hindre eggløsning, gjøre livmorhalsslimet tykkere og endre miljøet i livmoren.',
    diagramTitle: 'Hvordan virker hormonell prevensjon?',
    diagramSubtitle: 'Flere mekanismer kan bidra til beskyttelsen.',
    step1Title: 'Eggløsning',
    step1Text: 'Noen metoder hindrer eller hemmer frigjøringen av egget.',
    step2Title: 'Livmorhalsslim',
    step2Text: 'Slimet kan bli tykkere, noe som gjør det vanskeligere for sædceller å komme gjennom.',
    step3Title: 'Prevensjonsbeskyttelse',
    step3Text: 'Kombinasjonen av disse mekanismene bidrar til å redusere risikoen for graviditet.',
    body2: 'Ikke alle metoder krever samme grad av innsats. Hovedforskjellen er hvor ofte du må tenke på prevensjonen din.',
    comparisonTitle: 'Sammenligning av metodene',
    comparisonSubtitle: 'Fra en daglig handling til langvarig beskyttelse',
    scaleDaily: 'Daglig',
    scaleWeekly: 'Ukentlig',
    scaleLongTerm: 'Langvarig',
    methods: [
      {
        title: 'P-pille',
        frequency: 'Hver dag',
        duration: 'Tas regelmessig',
        profile: 'Ideelt hvis du vil styre prevensjonen din selv',
      },
      {
        title: 'Plaster',
        frequency: 'Hver uke',
        duration: '3 uker av 4',
        profile: 'Praktisk hvis du helst vil slippe en daglig rutine',
      },
      {
        title: 'Vaginalring',
        frequency: 'Hver 3. uke',
        duration: 'Med en ukes pause',
        profile: 'Et diskret alternativ med få handlinger i hverdagen',
      },
      {
        title: 'Implantat',
        frequency: 'Flere år',
        duration: 'Ingen daglig rutine',
        profile: 'Egnet hvis du vil ha langvarig prevensjon',
      },
      {
        title: 'Hormonspiral',
        frequency: 'Flere år',
        duration: 'Legges inn av fagperson',
        profile: 'En langvarig løsning som krever svært lite vedlikehold',
      },
    ],
    highlightTitle: 'Det viktigste å huske',
    highlightText: 'Jo færre handlinger en metode krever i hverdagen, desto sjeldnere må du tenke på den. Dette kan være verdt å vurdere hvis du vet at du lett glemmer en dose eller et bytte.',
    body3: 'Det finnes ingen ideell metode for alle. Det beste valget avhenger av hverdagen din, preferansene dine, toleransen din og planene dine.',
    criteria: [
      {
        title: 'Hverdagen din',
        text: 'Noen metoder krever en daglig handling, mens andre virker i flere uker eller år.',
      },
      {
        title: 'Toleransen din',
        text: 'Hvordan en metode føles, kan variere fra person til person. En samtale med helsepersonell kan hjelpe deg å finne ut hva som passer deg.',
      },
      {
        title: 'Planene dine',
        text: 'Hvis du håper på en graviditet snart eller senere, kan metodens varighet og reversibilitet hjelpe deg å velge.',
      },
      {
        title: 'Prioriteringene dine',
        text: 'Diskresjon, enkelhet, ingen daglig rutine eller langvarig beskyttelse: prioriteringene dine betyr noe for denne avgjørelsen.',
      },
    ],
    choiceDiagramTitle: 'Et raskt spørsmål som kan hjelpe deg å bestemme deg',
    questionText: '«Vil jeg helst tenke på prevensjonen hver dag, hver uke eller bare noen få ganger i året?»',
    choiceOption1Title: 'Ofte',
    choiceOption1Text: 'P-pille eller en metode som krever jevn oppmerksomhet',
    choiceOption2Title: 'Sjeldnere',
    choiceOption2Text: 'Plaster eller ring, avhengig av rytmen du velger',
    choiceOption3Title: 'Svært sjelden',
    choiceOption3Text: 'Implantat eller langtidsvirkende hormonspiral',
    alertTitle: 'Verdt å merke seg',
    alertText: 'Valget av hormonell prevensjon bør ta hensyn til din personlige og medisinske situasjon. Helsepersonell kan hjelpe deg å sammenligne fordeler, risikoer, kontraindikasjoner og mulige bivirkninger.',
    summaryTitle: 'Det viktigste',
    summarySubtitle: 'Hovedpunktene å ha i bakhodet',
    summaryRow1: 'Hormonelle metoder bruker ulike hormonkombinasjoner og ulike bruksplaner.',
    summaryRow2: 'P-pille, plaster og ring krever vedvarende innsats, mens implantat og hormonspiral er langtidsmetoder.',
    summaryRow3: 'Valget bør passe hverdagen din, preferansene dine, toleransen din og planene dine.',
    summaryRow4: 'Ingen metode er universelt «best» – den må først og fremst være forenlig med behovene og situasjonen din.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Å ta seg tid til å sammenligne metodene med helsepersonell hjelper deg å velge en prevensjon du kan bruke rolig og jevnlig.',
    shareMessage: 'Oversikt over hormonelle prevensjonsbehandlinger – AWA',
  },
  pl: {
    badge: 'LECZENIE HORMONALNE',
    title: 'Przegląd hormonalnych metod antykoncepcji',
    metaDuration: '7 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Tabletka, plaster, krążek, implant, hormonalna wkładka domaciczna: czym się różnią i jak myśleć o metodzie, która najlepiej pasuje do Twojego codziennego życia.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Wspólny mechanizm działania',
      'Różne metody',
      'Jak pokierować wyborem',
      'Najważniejsze wnioski',
    ],
    body1: 'Metody hormonalne wykorzystują hormony, by zapobiegać ciąży. W zależności od metody mogą głównie zapobiegać owulacji, zagęszczać śluz szyjkowy i zmieniać środowisko macicy.',
    diagramTitle: 'Jak działa antykoncepcja hormonalna?',
    diagramSubtitle: 'Na ochronę może składać się kilka mechanizmów.',
    step1Title: 'Owulacja',
    step1Text: 'Niektóre metody zapobiegają uwolnieniu komórki jajowej lub je hamują.',
    step2Title: 'Śluz szyjkowy',
    step2Text: 'Śluz może stać się gęstszy, co utrudnia plemnikom przejście.',
    step3Title: 'Ochrona antykoncepcyjna',
    step3Text: 'Połączenie tych mechanizmów pomaga zmniejszyć ryzyko ciąży.',
    body2: 'Nie wszystkie metody wymagają takiego samego zaangażowania. Główna różnica polega na tym, jak często trzeba myśleć o antykoncepcji.',
    comparisonTitle: 'Porównanie metod',
    comparisonSubtitle: 'Od codziennej czynności po długotrwałą ochronę',
    scaleDaily: 'Codziennie',
    scaleWeekly: 'Co tydzień',
    scaleLongTerm: 'Długoterminowo',
    methods: [
      {
        title: 'Tabletka',
        frequency: 'Codziennie',
        duration: 'Przyjmowana regularnie',
        profile: 'Idealna, jeśli chcesz samodzielnie zarządzać swoją antykoncepcją',
      },
      {
        title: 'Plaster',
        frequency: 'Co tydzień',
        duration: '3 tygodnie z 4',
        profile: 'Wygodny, jeśli wolisz uniknąć codziennej rutyny',
      },
      {
        title: 'Krążek dopochwowy',
        frequency: 'Co 3 tygodnie',
        duration: 'Z tygodniową przerwą',
        profile: 'Dyskretna opcja z niewielką liczbą codziennych czynności',
      },
      {
        title: 'Implant',
        frequency: 'Kilka lat',
        duration: 'Bez codziennej rutyny',
        profile: 'Odpowiedni, jeśli chcesz długotrwałej antykoncepcji',
      },
      {
        title: 'Hormonalna wkładka domaciczna',
        frequency: 'Kilka lat',
        duration: 'Zakładana przez specjalistę',
        profile: 'Rozwiązanie długoterminowe, które wymaga bardzo niewielkiej obsługi',
      },
    ],
    highlightTitle: 'Najważniejsze do zapamiętania',
    highlightText: 'Im mniej codziennych czynności wymaga metoda, tym rzadziej trzeba o niej myśleć. Warto to rozważyć, jeśli wiesz, że możesz zapomnieć o dawce lub wymianie.',
    body3: 'Nie ma jednej idealnej metody dla wszystkich. Najlepszy wybór zależy od Twojego codziennego życia, preferencji, tolerancji i planów.',
    criteria: [
      {
        title: 'Twoje codzienne życie',
        text: 'Niektóre metody wymagają codziennej czynności, inne działają przez kilka tygodni lub lat.',
      },
      {
        title: 'Twoja tolerancja',
        text: 'Odczucia związane z metodą mogą się różnić u poszczególnych osób. Rozmowa ze specjalistą może pomóc ustalić, co Ci odpowiada.',
      },
      {
        title: 'Twoje plany',
        text: 'Jeśli liczysz na ciążę wkrótce lub w przyszłości, czas działania i odwracalność metody mogą pomóc w wyborze.',
      },
      {
        title: 'Twoje priorytety',
        text: 'Dyskrecja, prostota, brak codziennej rutyny lub długotrwała ochrona: Twoje priorytety mają znaczenie w tej decyzji.',
      },
    ],
    choiceDiagramTitle: 'Jedno szybkie pytanie, które pomoże zdecydować',
    questionText: '„Czy wolałabym myśleć o antykoncepcji codziennie, co tydzień, czy tylko kilka razy w roku?”',
    choiceOption1Title: 'Często',
    choiceOption1Text: 'Tabletka lub metoda wymagająca regularnej uwagi',
    choiceOption2Title: 'Rzadziej',
    choiceOption2Text: 'Plaster lub krążek, w zależności od wybranego rytmu',
    choiceOption3Title: 'Bardzo rzadko',
    choiceOption3Text: 'Implant lub długotrwała hormonalna wkładka domaciczna',
    alertTitle: 'Warto zauważyć',
    alertText: 'Wybór hormonalnej antykoncepcji powinien uwzględniać Twoją sytuację osobistą i medyczną. Specjalista może pomóc porównać korzyści, ryzyko, przeciwwskazania i możliwe skutki uboczne.',
    summaryTitle: 'Najważniejsze',
    summarySubtitle: 'Kluczowe punkty do zapamiętania',
    summaryRow1: 'Metody hormonalne wykorzystują różne kombinacje hormonów i różne harmonogramy stosowania.',
    summaryRow2: 'Tabletka, plaster i krążek wymagają stałego zaangażowania, a implant i hormonalna wkładka domaciczna to metody długoterminowe.',
    summaryRow3: 'Wybór powinien odpowiadać Twojemu codziennemu życiu, preferencjom, tolerancji i planom.',
    summaryRow4: 'Żadna metoda nie jest uniwersalnie „najlepsza” — przede wszystkim powinna pasować do Twoich potrzeb i sytuacji.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Poświęcenie czasu na porównanie metod ze specjalistą pomaga wybrać antykoncepcję, którą możesz stosować spokojnie i konsekwentnie.',
    shareMessage: 'Przegląd hormonalnych metod antykoncepcji — AWA',
  },
  uk: {
    badge: 'ГОРМОНАЛЬНЕ ЛІКУВАННЯ',
    title: 'Огляд гормональних контрацептивних засобів',
    metaDuration: '7 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Таблетка, пластир, кільце, імплант, гормональна спіраль: чим вони відрізняються та як подумати про метод, що найкраще підходить вашому повсякденному життю.',
    contentsTitle: 'У цій статті',
    topics: [
      'Спільний механізм дії',
      'Різні методи',
      'Як спрямувати вибір',
      'Головні висновки',
    ],
    body1: 'Гормональні методи використовують гормони для запобігання вагітності. Залежно від методу вони можуть головно запобігати овуляції, згущувати цервікальний слиз і змінювати середовище матки.',
    diagramTitle: 'Як працює гормональна контрацепція?',
    diagramSubtitle: 'До захисту можуть сприяти кілька механізмів.',
    step1Title: 'Овуляція',
    step1Text: 'Деякі методи запобігають виходу яйцеклітини або пригнічують його.',
    step2Title: 'Цервікальний слиз',
    step2Text: 'Слиз може ставати густішим, що ускладнює проходження сперматозоїдів.',
    step3Title: 'Контрацептивний захист',
    step3Text: 'Поєднання цих механізмів допомагає знизити ризик вагітності.',
    body2: 'Не всі методи потребують однакової залученості. Головна відмінність — у тому, як часто потрібно думати про контрацепцію.',
    comparisonTitle: 'Порівняння методів',
    comparisonSubtitle: 'Від щоденної дії до довготривалого захисту',
    scaleDaily: 'Щодня',
    scaleWeekly: 'Щотижня',
    scaleLongTerm: 'Довготривало',
    methods: [
      {
        title: 'Таблетка',
        frequency: 'Щодня',
        duration: 'Приймається регулярно',
        profile: 'Ідеальна, якщо ви хочете самостійно керувати своєю контрацепцією',
      },
      {
        title: 'Пластир',
        frequency: 'Щотижня',
        duration: '3 тижні з 4',
        profile: 'Зручний, якщо ви воліли б уникнути щоденної рутини',
      },
      {
        title: 'Вагінальне кільце',
        frequency: 'Кожні 3 тижні',
        duration: 'З тижневою перервою',
        profile: 'Непомітний варіант із мінімумом щоденних дій',
      },
      {
        title: 'Імплант',
        frequency: 'Кілька років',
        duration: 'Без щоденної рутини',
        profile: 'Підходить, якщо ви хочете довготривалої контрацепції',
      },
      {
        title: 'Гормональна внутрішньоматкова спіраль',
        frequency: 'Кілька років',
        duration: 'Встановлюється фахівцем',
        profile: 'Довготривале рішення, що потребує дуже мало догляду',
      },
    ],
    highlightTitle: 'Головне, що слід пам’ятати',
    highlightText: 'Чим менше щоденних дій потребує метод, тим рідше доводиться про нього думати. Це варто врахувати, якщо ви знаєте, що можете забути про дозу чи заміну.',
    body3: 'Не існує одного ідеального методу для всіх. Найкращий вибір залежить від вашого повсякденного життя, уподобань, переносимості та планів.',
    criteria: [
      {
        title: 'Ваше повсякденне життя',
        text: 'Деякі методи потребують щоденної дії, інші діють кілька тижнів чи років.',
      },
      {
        title: 'Ваша переносимість',
        text: 'Відчуття від методу можуть різнитися в різних людей. Розмова з медичним фахівцем може допомогти визначити, що вам підходить.',
      },
      {
        title: 'Ваші плани',
        text: 'Якщо ви сподіваєтеся на вагітність найближчим часом чи пізніше, тривалість методу та оборотність можуть допомогти у виборі.',
      },
      {
        title: 'Ваші пріоритети',
        text: 'Непомітність, простота, відсутність щоденної рутини чи довготривалий захист: ваші пріоритети мають значення в цьому рішенні.',
      },
    ],
    choiceDiagramTitle: 'Одне швидке запитання, що допоможе вирішити',
    questionText: '«Чи хотіла б я думати про контрацепцію щодня, щотижня чи лише кілька разів на рік?»',
    choiceOption1Title: 'Часто',
    choiceOption1Text: 'Таблетка або метод, що потребує регулярної уваги',
    choiceOption2Title: 'Рідше',
    choiceOption2Text: 'Пластир або кільце, залежно від обраного ритму',
    choiceOption3Title: 'Дуже рідко',
    choiceOption3Text: 'Імплант або довготривала гормональна спіраль',
    alertTitle: 'Варто зауважити',
    alertText: 'Вибір гормональної контрацепції має враховувати вашу особисту та медичну ситуацію. Медичний фахівець може допомогти порівняти переваги, ризики, протипоказання та можливі побічні ефекти.',
    summaryTitle: 'Головне',
    summarySubtitle: 'Ключові моменти, які варто пам’ятати',
    summaryRow1: 'Гормональні методи використовують різні комбінації гормонів і різні графіки застосування.',
    summaryRow2: 'Таблетка, пластир і кільце потребують постійної залученості, а імплант і гормональна спіраль — довготривалі методи.',
    summaryRow3: 'Вибір має відповідати вашому повсякденному життю, уподобанням, переносимості та планам.',
    summaryRow4: 'Жоден метод не є універсально «найкращим» — головне, щоб він відповідав вашим потребам і ситуації.',
    tip1Title: 'Варто знати',
    tip1Text: 'Приділення часу порівнянню методів із медичним фахівцем допомагає обрати контрацепцію, якою можна користуватися спокійно й послідовно.',
    shareMessage: 'Огляд гормональних контрацептивних засобів — AWA',
  },
  cs: {
    badge: 'HORMONÁLNÍ LÉČBA',
    title: 'Přehled hormonálních antikoncepčních metod',
    metaDuration: '7 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Pilulka, náplast, kroužek, implantát, hormonální nitroděložní tělísko: čím se liší a jak přemýšlet o metodě, která nejlépe odpovídá vašemu každodennímu životu.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Společný mechanismus účinku',
      'Jednotlivé metody',
      'Jak usměrnit výběr',
      'Hlavní poznatky',
    ],
    body1: 'Hormonální metody využívají hormony k zabránění otěhotnění. Podle metody mohou především zabraňovat ovulaci, zahušťovat cervikální hlen a měnit prostředí v děloze.',
    diagramTitle: 'Jak funguje hormonální antikoncepce?',
    diagramSubtitle: 'K ochraně může přispívat několik mechanismů.',
    step1Title: 'Ovulace',
    step1Text: 'Některé metody zabraňují uvolnění vajíčka nebo ho potlačují.',
    step2Title: 'Cervikální hlen',
    step2Text: 'Hlen může zhoustnout, což spermiím ztěžuje průchod.',
    step3Title: 'Antikoncepční ochrana',
    step3Text: 'Kombinace těchto mechanismů pomáhá snižovat riziko otěhotnění.',
    body2: 'Ne všechny metody vyžadují stejnou míru zapojení. Hlavním rozdílem je, jak často musíte na antikoncepci myslet.',
    comparisonTitle: 'Porovnání metod',
    comparisonSubtitle: 'Od denního úkonu po dlouhodobou ochranu',
    scaleDaily: 'Denně',
    scaleWeekly: 'Týdně',
    scaleLongTerm: 'Dlouhodobě',
    methods: [
      {
        title: 'Pilulka',
        frequency: 'Každý den',
        duration: 'Užívá se pravidelně',
        profile: 'Ideální, pokud chcete mít antikoncepci sama v rukou',
      },
      {
        title: 'Náplast',
        frequency: 'Každý týden',
        duration: '3 týdny ze 4',
        profile: 'Praktická, pokud se chcete vyhnout každodenní rutině',
      },
      {
        title: 'Poševní kroužek',
        frequency: 'Každé 3 týdny',
        duration: 'S týdenní přestávkou',
        profile: 'Diskrétní možnost s minimem každodenních úkonů',
      },
      {
        title: 'Implantát',
        frequency: 'Několik let',
        duration: 'Žádná každodenní rutina',
        profile: 'Vhodný, pokud chcete dlouhodobou antikoncepci',
      },
      {
        title: 'Hormonální nitroděložní tělísko',
        frequency: 'Několik let',
        duration: 'Zavádí odborník',
        profile: 'Dlouhodobé řešení, které vyžaduje velmi malou údržbu',
      },
    ],
    highlightTitle: 'Hlavní, co si zapamatovat',
    highlightText: 'Čím méně každodenních úkonů metoda vyžaduje, tím méně často na ni musíte myslet. Může to stát za zvážení, pokud víte, že byste mohla zapomenout dávku nebo výměnu.',
    body3: 'Neexistuje jedna ideální metoda pro všechny. Nejlepší volba závisí na vašem každodenním životě, preferencích, snášenlivosti a plánech.',
    criteria: [
      {
        title: 'Váš každodenní život',
        text: 'Některé metody vyžadují denní úkon, jiné fungují několik týdnů nebo let.',
      },
      {
        title: 'Vaše snášenlivost',
        text: 'Jak se metoda vnímá, se může u každé ženy lišit. Rozhovor se zdravotnickým pracovníkem vám může pomoci zjistit, co vám vyhovuje.',
      },
      {
        title: 'Vaše plány',
        text: 'Pokud doufáte v těhotenství brzy nebo později, může vám výběr usnadnit délka metody a její vratnost.',
      },
      {
        title: 'Vaše priority',
        text: 'Diskrétnost, jednoduchost, žádná každodenní rutina nebo dlouhodobá ochrana: vaše priority v tomto rozhodnutí hrají roli.',
      },
    ],
    choiceDiagramTitle: 'Rychlá otázka, která pomůže rozhodnout',
    questionText: '„Chtěla bych na antikoncepci myslet každý den, každý týden, nebo jen několikrát za rok?“',
    choiceOption1Title: 'Často',
    choiceOption1Text: 'Pilulka nebo metoda vyžadující pravidelnou pozornost',
    choiceOption2Title: 'Méně často',
    choiceOption2Text: 'Náplast nebo kroužek, podle zvoleného rytmu',
    choiceOption3Title: 'Velmi zřídka',
    choiceOption3Text: 'Implantát nebo dlouhodobé hormonální nitroděložní tělísko',
    alertTitle: 'Stojí za zmínku',
    alertText: 'Při výběru hormonální antikoncepce by se měla zohlednit vaše osobní a zdravotní situace. Zdravotnický pracovník vám může pomoci porovnat přínosy, rizika, kontraindikace a možné nežádoucí účinky.',
    summaryTitle: 'To nejdůležitější',
    summarySubtitle: 'Klíčové body, které mít na paměti',
    summaryRow1: 'Hormonální metody využívají různé kombinace hormonů a různé režimy používání.',
    summaryRow2: 'Pilulka, náplast a kroužek vyžadují trvalé zapojení, zatímco implantát a hormonální nitroděložní tělísko jsou dlouhodobé metody.',
    summaryRow3: 'Volba by měla odpovídat vašemu každodennímu životu, preferencím, snášenlivosti a plánům.',
    summaryRow4: 'Žádná metoda není univerzálně „nejlepší“ — hlavně musí být slučitelná s vašimi potřebami a situací.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Věnovat čas porovnání metod se zdravotnickým pracovníkem vám pomůže zvolit antikoncepci, kterou budete moci používat klidně a důsledně.',
    shareMessage: 'Přehled hormonálních antikoncepčních metod — AWA',
  },
  sk: {
    badge: 'HORMONÁLNE LIEČBY',
    title: 'Prehľad hormonálnych antikoncepčných liečob',
    metaDuration: '7 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Tableta, náplasť, krúžok, implantát, hormonálne IUD: čím sa líšia a ako uvažovať o metóde, ktorá najlepšie zodpovedá vášmu každodennému životu.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Spoločný mechanizmus účinku',
      'Jednotlivé metódy',
      'Ako usmerniť svoju voľbu',
      'Hlavné body',
    ],
    body1: 'Hormonálne metódy využívajú hormóny na prevenciu tehotenstva. Podľa metódy môžu najmä zabrániť ovulácii, zahustiť cervikálny hlien a zmeniť prostredie maternice.',
    diagramTitle: 'Ako funguje hormonálna antikoncepcia?',
    diagramSubtitle: 'K ochrane môže prispievať viacero mechanizmov.',
    step1Title: 'Ovulácia',
    step1Text: 'Niektoré metódy bránia uvoľneniu vajíčka alebo ho potláčajú.',
    step2Title: 'Cervikálny hlien',
    step2Text: 'Hlien môže zhustnúť, čo spermiám sťažuje prechod.',
    step3Title: 'Antikoncepčná ochrana',
    step3Text: 'Kombinácia týchto mechanizmov pomáha znižovať riziko otehotnenia.',
    body2: 'Nie všetky metódy vyžadujú rovnakú mieru zapojenia. Hlavným rozdielom je, ako často musíte na antikoncepciu myslieť.',
    comparisonTitle: 'Porovnanie metód',
    comparisonSubtitle: 'Od každodennej činnosti po dlhodobú ochranu',
    scaleDaily: 'Denne',
    scaleWeekly: 'Týždenne',
    scaleLongTerm: 'Dlhodobo',
    methods: [
      {
        title: 'Tableta',
        frequency: 'Každý deň',
        duration: 'Užívaná pravidelne',
        profile: 'Ideálna, ak chcete mať antikoncepciu vo svojich rukách',
      },
      {
        title: 'Náplasť',
        frequency: 'Každý týždeň',
        duration: '3 týždne zo 4',
        profile: 'Pohodlná, ak sa chcete vyhnúť každodennej rutine',
      },
      {
        title: 'Vaginálny krúžok',
        frequency: 'Každé 3 týždne',
        duration: 'S týždňovou prestávkou',
        profile: 'Diskrétna možnosť s málo každodennými úkonmi',
      },
      {
        title: 'Implantát',
        frequency: 'Niekoľko rokov',
        duration: 'Bez každodennej rutiny',
        profile: 'Vhodný, ak chcete dlhodobú antikoncepciu',
      },
      {
        title: 'Hormonálne IUD',
        frequency: 'Niekoľko rokov',
        duration: 'Zavádza odborník',
        profile: 'Dlhodobé riešenie vyžadujúce veľmi málo údržby',
      },
    ],
    highlightTitle: 'Kľúčové je pamätať si',
    highlightText: 'Čím menej každodenných úkonov metóda vyžaduje, tým menej často na ňu musíte myslieť. Môže to stáť za zváženie, ak viete, že pravdepodobne zabudnete na dávku alebo výmenu.',
    body3: 'Neexistuje jedna ideálna metóda pre všetky ženy. Najlepšia voľba závisí od vášho každodenného života, preferencií, znášanlivosti a plánov.',
    criteria: [
      {
        title: 'Váš každodenný život',
        text: 'Niektoré metódy vyžadujú každodenný úkon, iné pôsobia niekoľko týždňov či rokov.',
      },
      {
        title: 'Vaša znášanlivosť',
        text: 'Pocity pri používaní metódy sa môžu líšiť od ženy k žene. Rozhovor so zdravotníckym pracovníkom vám môže pomôcť zistiť, čo vám vyhovuje.',
      },
      {
        title: 'Vaše plány',
        text: 'Ak dúfate v tehotenstvo čoskoro alebo neskôr, dĺžka metódy a jej vratnosť môžu pomôcť usmerniť vašu voľbu.',
      },
      {
        title: 'Vaše priority',
        text: 'Diskrétnosť, jednoduchosť, žiadna každodenná rutina alebo dlhotrvajúca ochrana: vaše priority sú v tomto rozhodnutí dôležité.',
      },
    ],
    choiceDiagramTitle: 'Rýchla otázka, ktorá vám pomôže rozhodnúť sa',
    questionText: '„Chcela by som na antikoncepciu myslieť radšej každý deň, každý týždeň, alebo len niekoľkokrát za rok?“',
    choiceOption1Title: 'Často',
    choiceOption1Text: 'Tableta alebo metóda vyžadujúca pravidelnú pozornosť',
    choiceOption2Title: 'Menej často',
    choiceOption2Text: 'Náplasť alebo krúžok, podľa zvoleného rytmu',
    choiceOption3Title: 'Veľmi zriedka',
    choiceOption3Text: 'Implantát alebo dlhodobé hormonálne IUD',
    alertTitle: 'Stojí za povšimnutie',
    alertText: 'Pri výbere hormonálnej antikoncepcie treba zohľadniť vašu osobnú a zdravotnú situáciu. Zdravotnícky pracovník vám môže pomôcť porovnať výhody, riziká, kontraindikácie a možné vedľajšie účinky.',
    summaryTitle: 'To najdôležitejšie',
    summarySubtitle: 'Kľúčové body, ktoré si treba zapamätať',
    summaryRow1: 'Hormonálne metódy používajú rôzne kombinácie hormónov a rôzne režimy používania.',
    summaryRow2: 'Tableta, náplasť a krúžok vyžadujú trvalé zapojenie, zatiaľ čo implantát a hormonálne IUD sú dlhodobé metódy.',
    summaryRow3: 'Voľba by mala zodpovedať vášmu každodennému životu, preferenciám, znášanlivosti a plánom.',
    summaryRow4: 'Žiadna metóda nie je univerzálne „najlepšia“ — hlavne musí byť zlučiteľná s vašimi potrebami a situáciou.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Ak si dáte čas porovnať metódy so zdravotníckym pracovníkom, pomôže vám to zvoliť antikoncepciu, ktorú môžete používať pokojne a dôsledne.',
    shareMessage: 'Prehľad hormonálnych antikoncepčných liečob — AWA',
  },
  hu: {
    badge: 'HORMONÁLIS KEZELÉSEK',
    title: 'A hormonális fogamzásgátló kezelések áttekintése',
    metaDuration: '7 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Tabletta, tapasz, gyűrű, implantátum, hormonális IUD: mi különbözteti meg őket, és hogyan gondolkodj a mindennapjaidhoz leginkább illő módszerről.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Közös hatásmechanizmus',
      'A különböző módszerek',
      'Hogyan irányítsd a választásodat',
      'Legfontosabb tudnivalók',
    ],
    body1: 'A hormonális módszerek hormonokat használnak a terhesség megelőzésére. A módszertől függően főként a peteérést akadályozhatják meg, sűrűbbé tehetik a méhnyaknyálkát, és megváltoztathatják a méh környezetét.',
    diagramTitle: 'Hogyan működik a hormonális fogamzásgátlás?',
    diagramSubtitle: 'A védelemhez több mechanizmus is hozzájárulhat.',
    step1Title: 'Peteérés',
    step1Text: 'Egyes módszerek megakadályozzák vagy gátolják a petesejt kiszabadulását.',
    step2Title: 'Méhnyaknyálka',
    step2Text: 'A nyálka sűrűbbé válhat, ami megnehezíti a spermiumok áthaladását.',
    step3Title: 'Fogamzásgátló védelem',
    step3Text: 'Ezeknek a mechanizmusoknak a kombinációja segít csökkenteni a terhesség kockázatát.',
    body2: 'Nem minden módszer igényel azonos mértékű odafigyelést. A fő különbség az, hogy milyen gyakran kell a fogamzásgátlásra gondolnod.',
    comparisonTitle: 'A módszerek összehasonlítása',
    comparisonSubtitle: 'A napi teendőtől a hosszú távú védelemig',
    scaleDaily: 'Naponta',
    scaleWeekly: 'Hetente',
    scaleLongTerm: 'Hosszú távon',
    methods: [
      {
        title: 'Tabletta',
        frequency: 'Minden nap',
        duration: 'Rendszeresen szedve',
        profile: 'Ideális, ha magad szeretnéd kézben tartani a fogamzásgátlásodat',
      },
      {
        title: 'Tapasz',
        frequency: 'Minden héten',
        duration: '4-ből 3 hét',
        profile: 'Kényelmes, ha inkább elkerülnéd a napi rutint',
      },
      {
        title: 'Hüvelygyűrű',
        frequency: '3 hetente',
        duration: 'Egyhetes szünettel',
        profile: 'Diszkrét lehetőség, kevés napi teendővel',
      },
      {
        title: 'Implantátum',
        frequency: 'Több év',
        duration: 'Nincs napi rutin',
        profile: 'Megfelelő, ha hosszú távú fogamzásgátlást szeretnél',
      },
      {
        title: 'Hormonális IUD',
        frequency: 'Több év',
        duration: 'Szakember helyezi be',
        profile: 'Hosszú távú megoldás, amely nagyon kevés karbantartást igényel',
      },
    ],
    highlightTitle: 'A legfontosabb, amit érdemes megjegyezni',
    highlightText: 'Minél kevesebb napi teendőt igényel egy módszer, annál ritkábban kell rá gondolnod. Ez érdemes lehet mérlegelni, ha tudod, hogy valószínűleg elfelejtesz egy adagot vagy cserét.',
    body3: 'Nincs egyetlen, mindenki számára ideális módszer. A legjobb választás a mindennapjaidtól, a preferenciáidtól, a tűrőképességedtől és a terveidtől függ.',
    criteria: [
      {
        title: 'A mindennapjaid',
        text: 'Egyes módszerek napi teendőt igényelnek, mások több hétig vagy évig hatnak.',
      },
      {
        title: 'A tűrőképességed',
        text: 'A módszer érzete nőnként eltérhet. Egy egészségügyi szakemberrel való beszélgetés segíthet kideríteni, mi felel meg neked.',
      },
      {
        title: 'A terveid',
        text: 'Ha hamarosan vagy később terhességet remélsz, a módszer időtartama és visszafordíthatósága segíthet a választásodban.',
      },
      {
        title: 'A prioritásaid',
        text: 'Diszkréció, egyszerűség, napi rutin hiánya vagy tartós védelem: a prioritásaid számítanak ebben a döntésben.',
      },
    ],
    choiceDiagramTitle: 'Egy gyors kérdés, amely segít dönteni',
    questionText: '„Inkább minden nap, minden héten, vagy csak évente néhányszor gondolnék a fogamzásgátlásomra?”',
    choiceOption1Title: 'Gyakran',
    choiceOption1Text: 'Tabletta vagy rendszeres odafigyelést igénylő módszer',
    choiceOption2Title: 'Ritkábban',
    choiceOption2Text: 'Tapasz vagy gyűrű, a választott ritmustól függően',
    choiceOption3Title: 'Nagyon ritkán',
    choiceOption3Text: 'Implantátum vagy hosszú távú hormonális IUD',
    alertTitle: 'Érdemes megjegyezni',
    alertText: 'A hormonális fogamzásgátló kiválasztásakor figyelembe kell venni a személyes és egészségügyi helyzetedet. Egy egészségügyi szakember segíthet összehasonlítani az előnyöket, kockázatokat, ellenjavallatokat és lehetséges mellékhatásokat.',
    summaryTitle: 'A lényeg',
    summarySubtitle: 'A legfontosabb tudnivalók',
    summaryRow1: 'A hormonális módszerek különböző hormonkombinációkat és különböző használati ütemezést alkalmaznak.',
    summaryRow2: 'A tabletta, a tapasz és a gyűrű folyamatos odafigyelést igényel, míg az implantátum és a hormonális IUD hosszú távú módszer.',
    summaryRow3: 'A választásnak illeszkednie kell a mindennapjaidhoz, a preferenciáidhoz, a tűrőképességedhez és a terveidhez.',
    summaryRow4: 'Egyetlen módszer sem általánosan „a legjobb” — főként az igényeiddel és a helyzeteddel kell összeegyeztethetőnek lennie.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'Ha időt szánsz a módszerek egészségügyi szakemberrel való összehasonlítására, segít olyan fogamzásgátlást választani, amelyet nyugodtan és következetesen használhatsz.',
    shareMessage: 'A hormonális fogamzásgátló kezelések áttekintése — AWA',
  },
  ro: {
    badge: 'TRATAMENTE HORMONALE',
    title: 'Privire de ansamblu asupra tratamentelor contraceptive hormonale',
    metaDuration: '7 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Pilulă, plasture, inel, implant, DIU hormonal: ce le deosebește și cum să te gândești la metoda care se potrivește cel mai bine vieții tale de zi cu zi.',
    contentsTitle: 'În acest articol',
    topics: [
      'Un mecanism de acțiune comun',
      'Diferitele metode',
      'Cum îți orientezi alegerea',
      'Ce să reții',
    ],
    body1: 'Metodele hormonale folosesc hormoni pentru a preveni sarcina. În funcție de metodă, ele pot împiedica în principal ovulația, îngroșa mucusul cervical și modifica mediul uterin.',
    diagramTitle: 'Cum funcționează contracepția hormonală?',
    diagramSubtitle: 'Mai multe mecanisme pot contribui la protecție.',
    step1Title: 'Ovulația',
    step1Text: 'Unele metode împiedică sau inhibă eliberarea ovulului.',
    step2Title: 'Mucusul cervical',
    step2Text: 'Mucusul se poate îngroșa, ceea ce face mai dificilă trecerea spermatozoizilor.',
    step3Title: 'Protecția contraceptivă',
    step3Text: 'Combinarea acestor mecanisme ajută la reducerea riscului de sarcină.',
    body2: 'Nu toate metodele cer același nivel de implicare. Principala diferență este cât de des trebuie să te gândești la contracepția ta.',
    comparisonTitle: 'Compararea metodelor',
    comparisonSubtitle: 'De la o acțiune zilnică la o protecție pe termen lung',
    scaleDaily: 'Zilnic',
    scaleWeekly: 'Săptămânal',
    scaleLongTerm: 'Pe termen lung',
    methods: [
      {
        title: 'Pilula',
        frequency: 'În fiecare zi',
        duration: 'Luată regulat',
        profile: 'Ideală dacă vrei să-ți gestionezi singură contracepția',
      },
      {
        title: 'Plasturele',
        frequency: 'În fiecare săptămână',
        duration: '3 săptămâni din 4',
        profile: 'Comod dacă preferi să eviți o rutină zilnică',
      },
      {
        title: 'Inelul vaginal',
        frequency: 'La fiecare 3 săptămâni',
        duration: 'Cu o pauză de o săptămână',
        profile: 'O opțiune discretă, cu puține acțiuni de zi cu zi',
      },
      {
        title: 'Implantul',
        frequency: 'Câțiva ani',
        duration: 'Fără rutină zilnică',
        profile: 'Potrivit dacă vrei o contracepție pe termen lung',
      },
      {
        title: 'DIU hormonal',
        frequency: 'Câțiva ani',
        duration: 'Montat de un profesionist',
        profile: 'O soluție pe termen lung, care necesită foarte puțină întreținere',
      },
    ],
    highlightTitle: 'Lucrul esențial de reținut',
    highlightText: 'Cu cât o metodă cere mai puține acțiuni de zi cu zi, cu atât mai rar trebuie să te gândești la ea. Acest lucru merită luat în calcul dacă știi că ești predispusă să uiți o doză sau o schimbare.',
    body3: 'Nu există o metodă ideală pentru toată lumea. Cea mai bună alegere depinde de viața ta de zi cu zi, de preferințele, toleranța și planurile tale.',
    criteria: [
      {
        title: 'Viața ta de zi cu zi',
        text: 'Unele metode cer o acțiune zilnică, în timp ce altele funcționează câteva săptămâni sau ani.',
      },
      {
        title: 'Toleranța ta',
        text: 'Felul în care este resimțită o metodă poate varia de la o persoană la alta. Discuția cu un profesionist din domeniul sănătății te poate ajuta să stabilești ce ți se potrivește.',
      },
      {
        title: 'Planurile tale',
        text: 'Dacă speri la o sarcină în curând sau mai târziu, durata metodei și reversibilitatea ei pot ajuta la orientarea alegerii.',
      },
      {
        title: 'Prioritățile tale',
        text: 'Discreția, simplitatea, lipsa unei rutine zilnice sau o protecție de lungă durată: prioritățile tale contează în această decizie.',
      },
    ],
    choiceDiagramTitle: 'O întrebare rapidă care te ajută să te decizi',
    questionText: '„Aș prefera să mă gândesc la contracepția mea în fiecare zi, în fiecare săptămână sau doar de câteva ori pe an?”',
    choiceOption1Title: 'Des',
    choiceOption1Text: 'Pilula sau o metodă care necesită atenție regulată',
    choiceOption2Title: 'Mai rar',
    choiceOption2Text: 'Plasturele sau inelul, în funcție de ritmul ales',
    choiceOption3Title: 'Foarte rar',
    choiceOption3Text: 'Implantul sau DIU hormonal de lungă durată',
    alertTitle: 'De reținut',
    alertText: 'Alegerea unui contraceptiv hormonal trebuie să țină cont de situația ta personală și medicală. Un profesionist din domeniul sănătății te poate ajuta să compari avantajele, riscurile, contraindicațiile și posibilele efecte secundare.',
    summaryTitle: 'Esențialul',
    summarySubtitle: 'Punctele-cheie de ținut minte',
    summaryRow1: 'Metodele hormonale folosesc combinații diferite de hormoni și programe de folosire diferite.',
    summaryRow2: 'Pilula, plasturele și inelul cer o implicare continuă, în timp ce implantul și DIU hormonal sunt metode pe termen lung.',
    summaryRow3: 'Alegerea trebuie să se potrivească vieții tale de zi cu zi, preferințelor, toleranței și planurilor tale.',
    summaryRow4: 'Nicio metodă nu este universal „cea mai bună” — trebuie mai ales să fie compatibilă cu nevoile și situația ta.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Faptul că îți iei timp să compari metodele împreună cu un profesionist din domeniul sănătății te ajută să alegi o contracepție pe care o poți folosi liniștit și constant.',
    shareMessage: 'Privire de ansamblu asupra tratamentelor contraceptive hormonale — AWA',
  },
  bg: {
    badge: 'ХОРМОНАЛНИ ЛЕЧЕНИЯ',
    title: 'Преглед на хормоналните контрацептивни лечения',
    metaDuration: '7 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Хапче, пластир, пръстен, имплант, хормонална спирала: какво ги отличава и как да мислиш за метода, който най-добре отговаря на ежедневието ти.',
    contentsTitle: 'В тази статия',
    topics: [
      'Общ механизъм на действие',
      'Различните методи',
      'Как да насочиш избора си',
      'Какво да запомниш',
    ],
    body1: 'Хормоналните методи използват хормони, за да предотвратят бременност. В зависимост от метода те могат основно да предотвратят овулацията, да сгъстят цервикалната слуз и да променят маточната среда.',
    diagramTitle: 'Как работи хормоналната контрацепция?',
    diagramSubtitle: 'Няколко механизма могат да допринасят за защитата.',
    step1Title: 'Овулация',
    step1Text: 'Някои методи предотвратяват или потискат освобождаването на яйцеклетката.',
    step2Title: 'Цервикална слуз',
    step2Text: 'Слузта може да стане по-гъста, което затруднява преминаването на сперматозоидите.',
    step3Title: 'Контрацептивна защита',
    step3Text: 'Комбинацията от тези механизми помага да се намали рискът от бременност.',
    body2: 'Не всички методи изискват едно и също ниво на ангажираност. Основната разлика е колко често трябва да мислиш за контрацепцията си.',
    comparisonTitle: 'Сравнение на методите',
    comparisonSubtitle: 'От ежедневно действие до дългосрочна защита',
    scaleDaily: 'Ежедневно',
    scaleWeekly: 'Седмично',
    scaleLongTerm: 'Дългосрочно',
    methods: [
      {
        title: 'Хапче',
        frequency: 'Всеки ден',
        duration: 'Приема се редовно',
        profile: 'Идеално, ако искаш сама да управляваш контрацепцията си',
      },
      {
        title: 'Пластир',
        frequency: 'Всяка седмица',
        duration: '3 седмици от 4',
        profile: 'Удобен, ако предпочиташ да избегнеш ежедневна рутина',
      },
      {
        title: 'Вагинален пръстен',
        frequency: 'На всеки 3 седмици',
        duration: 'С едноседмична пауза',
        profile: 'Дискретна опция с малко ежедневни действия',
      },
      {
        title: 'Имплант',
        frequency: 'Няколко години',
        duration: 'Без ежедневна рутина',
        profile: 'Подходящ, ако искаш дългосрочна контрацепция',
      },
      {
        title: 'Хормонална спирала',
        frequency: 'Няколко години',
        duration: 'Поставя се от специалист',
        profile: 'Дългосрочно решение, което изисква много малко поддръжка',
      },
    ],
    highlightTitle: 'Основното, което да запомниш',
    highlightText: 'Колкото по-малко ежедневни действия изисква един метод, толкова по-рядко трябва да мислиш за него. Това може да си струва да се вземе предвид, ако знаеш, че е вероятно да забравиш доза или смяна.',
    body3: 'Няма един идеален метод за всички. Най-добрият избор зависи от ежедневието ти, предпочитанията, поносимостта и плановете ти.',
    criteria: [
      {
        title: 'Твоето ежедневие',
        text: 'Някои методи изискват ежедневно действие, докато други действат няколко седмици или години.',
      },
      {
        title: 'Твоята поносимост',
        text: 'Как се усеща един метод, може да варира от човек на човек. Разговорът със здравен специалист може да ти помогне да определиш какво ти подхожда.',
      },
      {
        title: 'Твоите планове',
        text: 'Ако се надяваш на бременност скоро или по-късно, продължителността на метода и обратимостта му могат да помогнат да насочиш избора си.',
      },
      {
        title: 'Твоите приоритети',
        text: 'Дискретност, простота, липса на ежедневна рутина или дълготрайна защита: приоритетите ти са важни в това решение.',
      },
    ],
    choiceDiagramTitle: 'Бърз въпрос, който да ти помогне да решиш',
    questionText: '„Бих ли предпочела да мисля за контрацепцията си всеки ден, всяка седмица или само няколко пъти в годината?“',
    choiceOption1Title: 'Често',
    choiceOption1Text: 'Хапче или метод, който изисква редовно внимание',
    choiceOption2Title: 'По-рядко',
    choiceOption2Text: 'Пластир или пръстен, според избрания ритъм',
    choiceOption3Title: 'Много рядко',
    choiceOption3Text: 'Имплант или дългосрочна хормонална спирала',
    alertTitle: 'Заслужава да се отбележи',
    alertText: 'Изборът на хормонален контрацептив трябва да отчита личната и медицинската ти ситуация. Здравен специалист може да ти помогне да сравниш предимствата, рисковете, противопоказанията и възможните странични ефекти.',
    summaryTitle: 'Същественото',
    summarySubtitle: 'Ключовите точки, които да запомниш',
    summaryRow1: 'Хормоналните методи използват различни комбинации от хормони и различни графици на употреба.',
    summaryRow2: 'Хапчето, пластирът и пръстенът изискват постоянна ангажираност, докато имплантът и хормоналната спирала са дългосрочни методи.',
    summaryRow3: 'Изборът трябва да отговаря на ежедневието, предпочитанията, поносимостта и плановете ти.',
    summaryRow4: 'Никой метод не е универсално „най-добър“ — той трябва най-вече да е съвместим с нуждите и ситуацията ти.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Да отделиш време да сравниш методите със здравен специалист ти помага да избереш контрацепция, която можеш да използваш спокойно и последователно.',
    shareMessage: 'Преглед на хормоналните контрацептивни лечения — AWA',
  },
  sr: {
    badge: 'ХОРМОНСКЕ ТЕРАПИЈЕ',
    title: 'Преглед хормонских контрацептивних терапија',
    metaDuration: '7 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Пилула, фластер, прстен, имплант, хормонска спирала: по чему се разликују и како размишљати о методу који најбоље одговара твом свакодневном животу.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Заједнички механизам деловања',
      'Различити методи',
      'Како усмерити свој избор',
      'Шта да запамтиш',
    ],
    body1: 'Хормонски методи користе хормоне да спрече трудноћу. Зависно од метода, могу углавном спречавати овулацију, згушњавати цервикалну слуз и мењати окружење у материци.',
    diagramTitle: 'Како хормонска контрацепција делује?',
    diagramSubtitle: 'Неколико механизама може допринети заштити.',
    step1Title: 'Овулација',
    step1Text: 'Неки методи спречавају или инхибирају ослобађање јајне ћелије.',
    step2Title: 'Цервикална слуз',
    step2Text: 'Слуз може постати гушћа, што отежава пролаз сперматозоида.',
    step3Title: 'Контрацептивна заштита',
    step3Text: 'Комбинација ових механизама помаже да се смањи ризик од трудноће.',
    body2: 'Не захтевају сви методи исти ниво ангажовања. Главна разлика је колико често треба да мислиш на своју контрацепцију.',
    comparisonTitle: 'Поређење метода',
    comparisonSubtitle: 'Од дневне радње до дугорочне заштите',
    scaleDaily: 'Дневно',
    scaleWeekly: 'Недељно',
    scaleLongTerm: 'Дугорочно',
    methods: [
      {
        title: 'Пилула',
        frequency: 'Сваког дана',
        duration: 'Узима се редовно',
        profile: 'Идеално ако желиш сама да управљаш својом контрацепцијом',
      },
      {
        title: 'Фластер',
        frequency: 'Сваке недеље',
        duration: '3 недеље од 4',
        profile: 'Згодно ако радије избегаваш дневну рутину',
      },
      {
        title: 'Вагинални прстен',
        frequency: 'Сваке 3 недеље',
        duration: 'Уз једнонедељну паузу',
        profile: 'Дискретна опција са мало свакодневних радњи',
      },
      {
        title: 'Имплант',
        frequency: 'Неколико година',
        duration: 'Без дневне рутине',
        profile: 'Погодно ако желиш дугорочну контрацепцију',
      },
      {
        title: 'Хормонска спирала',
        frequency: 'Неколико година',
        duration: 'Поставља је стручњак',
        profile: 'Дугорочно решење које захтева врло мало одржавања',
      },
    ],
    highlightTitle: 'Кључно за памћење',
    highlightText: 'Што мање свакодневних радњи метод захтева, то ређе треба да мислиш на њега. Ово може вредети размотрити ако знаш да ћеш вероватно заборавити дозу или промену.',
    body3: 'Не постоји један идеалан метод за све. Најбољи избор зависи од твог свакодневног живота, жеља, подношљивости и планова.',
    criteria: [
      {
        title: 'Твој свакодневни живот',
        text: 'Неки методи захтевају дневну радњу, док други делују неколико недеља или година.',
      },
      {
        title: 'Твоја подношљивост',
        text: 'Како се метод осећа може варирати од особе до особе. Разговор са здравственим радником може ти помоћи да одредиш шта ти одговара.',
      },
      {
        title: 'Твоји планови',
        text: 'Ако се надаш трудноћи ускоро или касније, трајање и реверзибилност метода могу помоћи да усмериш избор.',
      },
      {
        title: 'Твоји приоритети',
        text: 'Дискретност, једноставност, одсуство дневне рутине или дуготрајна заштита: твоји приоритети су важни у овој одлуци.',
      },
    ],
    choiceDiagramTitle: 'Кратко питање које ће ти помоћи да одлучиш',
    questionText: '„Да ли бих радије мислила на своју контрацепцију сваког дана, сваке недеље или само неколико пута годишње?“',
    choiceOption1Title: 'Често',
    choiceOption1Text: 'Пилула или метод који захтева редовну пажњу',
    choiceOption2Title: 'Ређе',
    choiceOption2Text: 'Фластер или прстен, зависно од ритма који изабереш',
    choiceOption3Title: 'Веома ретко',
    choiceOption3Text: 'Имплант или дугорочна хормонска спирала',
    alertTitle: 'Вреди напоменути',
    alertText: 'Избор хормонске контрацепције треба да узме у обзир твоју личну и медицинску ситуацију. Здравствени радник може ти помоћи да упоредиш предности, ризике, контраиндикације и могуће нежељене ефекте.',
    summaryTitle: 'Основно',
    summarySubtitle: 'Кључне тачке које треба имати на уму',
    summaryRow1: 'Хормонски методи користе различите комбинације хормона и различите распореде употребе.',
    summaryRow2: 'Пилула, фластер и прстен захтевају стално ангажовање, док су имплант и хормонска спирала дугорочни методи.',
    summaryRow3: 'Избор треба да одговара твом свакодневном животу, жељама, подношљивости и плановима.',
    summaryRow4: 'Ниједан метод није универзално „најбољи“ — углавном треба да буде компатибилан са твојим потребама и ситуацијом.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Одвајање времена да упоредиш методе са здравственим радником помаже ти да изабереш контрацепцију коју можеш користити мирно и доследно.',
    shareMessage: 'Преглед хормонских контрацептивних терапија — AWA',
  },
  hr: {
    badge: 'HORMONSKE TERAPIJE',
    title: 'Pregled hormonskih kontracepcijskih terapija',
    metaDuration: '7 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Tableta, flaster, prsten, implantat, hormonska spirala: što ih razlikuje i kako razmišljati o metodi koja najbolje odgovara tvojoj svakodnevici.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Zajednički mehanizam djelovanja',
      'Različite metode',
      'Kako usmjeriti svoj izbor',
      'Ključne poruke',
    ],
    body1: 'Hormonske metode koriste hormone za sprječavanje trudnoće. Ovisno o metodi, mogu uglavnom sprječavati ovulaciju, zgušnjavati cervikalnu sluz i mijenjati okolinu u maternici.',
    diagramTitle: 'Kako djeluje hormonska kontracepcija?',
    diagramSubtitle: 'Zaštiti može pridonositi više mehanizama.',
    step1Title: 'Ovulacija',
    step1Text: 'Neke metode sprječavaju ili koče oslobađanje jajne stanice.',
    step2Title: 'Cervikalna sluz',
    step2Text: 'Sluz može postati gušća, zbog čega spermijima teže prolaze.',
    step3Title: 'Kontracepcijska zaštita',
    step3Text: 'Kombinacija tih mehanizama pomaže smanjiti rizik od trudnoće.',
    body2: 'Sve metode ne zahtijevaju istu razinu angažmana. Glavna je razlika koliko često moraš misliti na svoju kontracepciju.',
    comparisonTitle: 'Usporedba metoda',
    comparisonSubtitle: 'Od svakodnevne radnje do dugotrajne zaštite',
    scaleDaily: 'Dnevno',
    scaleWeekly: 'Tjedno',
    scaleLongTerm: 'Dugoročno',
    methods: [
      {
        title: 'Tableta',
        frequency: 'Svaki dan',
        duration: 'Uzima se redovito',
        profile: 'Idealna ako želiš sama upravljati svojom kontracepcijom',
      },
      {
        title: 'Flaster',
        frequency: 'Svaki tjedan',
        duration: '3 tjedna od 4',
        profile: 'Praktičan ako radije izbjegavaš svakodnevnu rutinu',
      },
      {
        title: 'Vaginalni prsten',
        frequency: 'Svaka 3 tjedna',
        duration: 'S tjednom stanke',
        profile: 'Diskretna opcija s malo svakodnevnih radnji',
      },
      {
        title: 'Implantat',
        frequency: 'Nekoliko godina',
        duration: 'Bez svakodnevne rutine',
        profile: 'Prikladan ako želiš dugotrajnu kontracepciju',
      },
      {
        title: 'Hormonska spirala',
        frequency: 'Nekoliko godina',
        duration: 'Postavlja je stručna osoba',
        profile: 'Dugoročno rješenje koje traži vrlo malo održavanja',
      },
    ],
    highlightTitle: 'Ključno je zapamtiti',
    highlightText: 'Što metoda zahtijeva manje svakodnevnih radnji, to rjeđe moraš misliti na nju. To može biti vrijedno razmatranja ako znaš da bi lako mogla zaboraviti dozu ili zamjenu.',
    body3: 'Ne postoji jedna idealna metoda za sve. Najbolji izbor ovisi o tvojoj svakodnevici, željama, podnošljivosti i planovima.',
    criteria: [
      {
        title: 'Tvoja svakodnevica',
        text: 'Neke metode traže svakodnevnu radnju, dok druge djeluju nekoliko tjedana ili godina.',
      },
      {
        title: 'Tvoja podnošljivost',
        text: 'Kako se metoda osjeća može se razlikovati od osobe do osobe. Razgovor sa zdravstvenim djelatnikom može ti pomoći utvrditi što ti odgovara.',
      },
      {
        title: 'Tvoji planovi',
        text: 'Ako se nadaš trudnoći uskoro ili kasnije, trajanje metode i njezina povratnost mogu pomoći usmjeriti izbor.',
      },
      {
        title: 'Tvoji prioriteti',
        text: 'Diskrecija, jednostavnost, nepostojanje svakodnevne rutine ili dugotrajna zaštita: tvoji prioriteti važni su u ovoj odluci.',
      },
    ],
    choiceDiagramTitle: 'Kratko pitanje koje pomaže odlučiti',
    questionText: '„Bih li radije mislila na svoju kontracepciju svaki dan, svaki tjedan ili samo nekoliko puta godišnje?“',
    choiceOption1Title: 'Često',
    choiceOption1Text: 'Tableta ili metoda koja traži redovitu pozornost',
    choiceOption2Title: 'Rjeđe',
    choiceOption2Text: 'Flaster ili prsten, ovisno o ritmu koji odabereš',
    choiceOption3Title: 'Vrlo rijetko',
    choiceOption3Text: 'Implantat ili dugotrajna hormonska spirala',
    alertTitle: 'Vrijedi napomenuti',
    alertText: 'Odabir hormonske kontracepcije treba uzeti u obzir tvoju osobnu i medicinsku situaciju. Zdravstveni djelatnik može ti pomoći usporediti prednosti, rizike, kontraindikacije i moguće nuspojave.',
    summaryTitle: 'Najvažnije',
    summarySubtitle: 'Ključne točke koje treba imati na umu',
    summaryRow1: 'Hormonske metode koriste različite kombinacije hormona i različite rasporede primjene.',
    summaryRow2: 'Tableta, flaster i prsten traže stalan angažman, dok su implantat i hormonska spirala dugoročne metode.',
    summaryRow3: 'Izbor treba odgovarati tvojoj svakodnevici, željama, podnošljivosti i planovima.',
    summaryRow4: 'Nijedna metoda nije univerzalno „najbolja“ — ponajprije mora biti spojiva s tvojim potrebama i situacijom.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Odvojiti vrijeme za usporedbu metoda sa zdravstvenim djelatnikom pomaže ti odabrati kontracepciju koju možeš koristiti mirno i dosljedno.',
    shareMessage: 'Pregled hormonskih kontracepcijskih terapija — AWA',
  },
  bs: {
    badge: 'HORMONSKE TERAPIJE',
    title: 'Pregled hormonskih kontracepcijskih terapija',
    metaDuration: '7 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Tableta, flaster, prsten, implantat, hormonska spirala: što ih razlikuje i kako razmišljati o metodi koja najbolje odgovara tvojoj svakodnevici.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Zajednički mehanizam djelovanja',
      'Različite metode',
      'Kako usmjeriti svoj izbor',
      'Ključne poruke',
    ],
    body1: 'Hormonske metode koriste hormone za sprječavanje trudnoće. Ovisno o metodi, mogu uglavnom sprječavati ovulaciju, zgušnjavati cervikalnu sluz i mijenjati okolinu u maternici.',
    diagramTitle: 'Kako djeluje hormonska kontracepcija?',
    diagramSubtitle: 'Zaštiti može pridonositi više mehanizama.',
    step1Title: 'Ovulacija',
    step1Text: 'Neke metode sprječavaju ili koče oslobađanje jajne stanice.',
    step2Title: 'Cervikalna sluz',
    step2Text: 'Sluz može postati gušća, zbog čega spermijima teže prolaze.',
    step3Title: 'Kontracepcijska zaštita',
    step3Text: 'Kombinacija tih mehanizama pomaže smanjiti rizik od trudnoće.',
    body2: 'Sve metode ne zahtijevaju istu razinu angažmana. Glavna je razlika koliko često moraš misliti na svoju kontracepciju.',
    comparisonTitle: 'Usporedba metoda',
    comparisonSubtitle: 'Od svakodnevne radnje do dugotrajne zaštite',
    scaleDaily: 'Dnevno',
    scaleWeekly: 'Sedmično',
    scaleLongTerm: 'Dugoročno',
    methods: [
      {
        title: 'Tableta',
        frequency: 'Svaki dan',
        duration: 'Uzima se redovito',
        profile: 'Idealna ako želiš sama upravljati svojom kontracepcijom',
      },
      {
        title: 'Flaster',
        frequency: 'Svaka sedmica',
        duration: '3 sedmice od 4',
        profile: 'Praktičan ako radije izbjegavaš svakodnevnu rutinu',
      },
      {
        title: 'Vaginalni prsten',
        frequency: 'Svake 3 sedmice',
        duration: 'Sa sedmicom stanke',
        profile: 'Diskretna opcija s malo svakodnevnih radnji',
      },
      {
        title: 'Implantat',
        frequency: 'Nekoliko godina',
        duration: 'Bez svakodnevne rutine',
        profile: 'Prikladan ako želiš dugotrajnu kontracepciju',
      },
      {
        title: 'Hormonska spirala',
        frequency: 'Nekoliko godina',
        duration: 'Postavlja je stručna osoba',
        profile: 'Dugoročno rješenje koje traži vrlo malo održavanja',
      },
    ],
    highlightTitle: 'Ključno je zapamtiti',
    highlightText: 'Što metoda zahtijeva manje svakodnevnih radnji, to rjeđe moraš misliti na nju. To može biti vrijedno razmatranja ako znaš da bi lako mogla zaboraviti dozu ili zamjenu.',
    body3: 'Ne postoji jedna idealna metoda za sve. Najbolji izbor ovisi o tvojoj svakodnevici, željama, podnošljivosti i planovima.',
    criteria: [
      {
        title: 'Tvoja svakodnevica',
        text: 'Neke metode traže svakodnevnu radnju, dok druge djeluju nekoliko sedmica ili godina.',
      },
      {
        title: 'Tvoja podnošljivost',
        text: 'Kako se metoda osjeća može se razlikovati od osobe do osobe. Razgovor sa zdravstvenim radnikom može ti pomoći utvrditi što ti odgovara.',
      },
      {
        title: 'Tvoji planovi',
        text: 'Ako se nadaš trudnoći uskoro ili kasnije, trajanje metode i njezina povratnost mogu pomoći usmjeriti izbor.',
      },
      {
        title: 'Tvoji prioriteti',
        text: 'Diskrecija, jednostavnost, nepostojanje svakodnevne rutine ili dugotrajna zaštita: tvoji prioriteti važni su u ovoj odluci.',
      },
    ],
    choiceDiagramTitle: 'Kratko pitanje koje pomaže odlučiti',
    questionText: '„Bih li radije mislila na svoju kontracepciju svaki dan, svaka sedmica ili samo nekoliko puta godišnje?“',
    choiceOption1Title: 'Često',
    choiceOption1Text: 'Tableta ili metoda koja traži redovitu pozornost',
    choiceOption2Title: 'Rjeđe',
    choiceOption2Text: 'Flaster ili prsten, ovisno o ritmu koji odabereš',
    choiceOption3Title: 'Vrlo rijetko',
    choiceOption3Text: 'Implantat ili dugotrajna hormonska spirala',
    alertTitle: 'Vrijedi napomenuti',
    alertText: 'Odabir hormonske kontracepcije treba uzeti u obzir tvoju osobnu i medicinsku situaciju. Zdravstveni radnik može ti pomoći usporediti prednosti, rizike, kontraindikacije i moguće nuspojave.',
    summaryTitle: 'Najvažnije',
    summarySubtitle: 'Ključne tačke koje treba imati na umu',
    summaryRow1: 'Hormonske metode koriste različite kombinacije hormona i različite rasporede primjene.',
    summaryRow2: 'Tableta, flaster i prsten traže stalan angažman, dok su implantat i hormonska spirala dugoročne metode.',
    summaryRow3: 'Izbor treba odgovarati tvojoj svakodnevici, željama, podnošljivosti i planovima.',
    summaryRow4: 'Nijedna metoda nije univerzalno „najbolja“ — ponajprije mora biti spojiva s tvojim potrebama i situacijom.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Odvojiti vrijeme za usporedbu metoda sa zdravstvenim radnikom pomaže ti odabrati kontracepciju koju možeš koristiti mirno i dosljedno.',
    shareMessage: 'Pregled hormonskih kontracepcijskih terapija — AWA',
  },
  sl: {
    badge: 'HORMONSKA ZDRAVLJENJA',
    title: 'Pregled hormonskih kontracepcijskih zdravljenj',
    metaDuration: '7 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Tableta, obliž, obroček, vsadek, hormonska maternična spirala: kaj jih razlikuje in kako razmišljati o metodi, ki najbolje ustreza tvojemu vsakdanu.',
    contentsTitle: 'V tem članku',
    topics: [
      'Skupni mehanizem delovanja',
      'Različne metode',
      'Kako usmeriti svojo izbiro',
      'Ključna sporočila',
    ],
    body1: 'Hormonske metode uporabljajo hormone za preprečevanje nosečnosti. Glede na metodo lahko predvsem preprečujejo ovulacijo, zgostijo materničnovratno sluz in spremenijo okolje v maternici.',
    diagramTitle: 'Kako deluje hormonska kontracepcija?',
    diagramSubtitle: 'Zaščiti lahko prispeva več mehanizmov.',
    step1Title: 'Ovulacija',
    step1Text: 'Nekatere metode preprečijo ali zavrejo sprostitev jajčne celice.',
    step2Title: 'Materničnovratna sluz',
    step2Text: 'Sluz lahko postane gostejša, zaradi česar spermiji težje prehajajo.',
    step3Title: 'Kontracepcijska zaščita',
    step3Text: 'Kombinacija teh mehanizmov pomaga zmanjšati tveganje za nosečnost.',
    body2: 'Vse metode ne zahtevajo enake ravni angažiranosti. Glavna razlika je, kako pogosto moraš misliti na svojo kontracepcijo.',
    comparisonTitle: 'Primerjava metod',
    comparisonSubtitle: 'Od vsakodnevnega dejanja do dolgotrajne zaščite',
    scaleDaily: 'Dnevno',
    scaleWeekly: 'Tedensko',
    scaleLongTerm: 'Dolgoročno',
    methods: [
      {
        title: 'Tableta',
        frequency: 'Vsak dan',
        duration: 'Jemlje se redno',
        profile: 'Idealna, če želiš sama upravljati svojo kontracepcijo',
      },
      {
        title: 'Obliž',
        frequency: 'Vsak teden',
        duration: '3 tedne od 4',
        profile: 'Praktičen, če se raje izogibaš vsakodnevni rutini',
      },
      {
        title: 'Vaginalni obroček',
        frequency: 'Vsake 3 tedne',
        duration: 'S tednom odmora',
        profile: 'Diskretna možnost z malo vsakodnevnimi dejanji',
      },
      {
        title: 'Vsadek',
        frequency: 'Nekaj let',
        duration: 'Brez vsakodnevne rutine',
        profile: 'Primeren, če želiš dolgotrajno kontracepcijo',
      },
      {
        title: 'Hormonska maternična spirala',
        frequency: 'Nekaj let',
        duration: 'Vstavi jo strokovnjak',
        profile: 'Dolgoročna rešitev, ki zahteva zelo malo vzdrževanja',
      },
    ],
    highlightTitle: 'Ključno si je zapomniti',
    highlightText: 'Manj ko metoda zahteva vsakodnevnih dejanj, redkeje moraš misliti nanjo. To je lahko vredno razmisleka, če veš, da bi zlahka pozabila odmerek ali menjavo.',
    body3: 'Ne obstaja ena idealna metoda za vse. Najboljša izbira je odvisna od tvojega vsakdana, želja, prenašanja in načrtov.',
    criteria: [
      {
        title: 'Tvoj vsakdan',
        text: 'Nekatere metode zahtevajo vsakodnevno dejanje, druge delujejo nekaj tednov ali let.',
      },
      {
        title: 'Tvoje prenašanje',
        text: 'Kako se metoda počuti, se lahko razlikuje od osebe do osebe. Pogovor z zdravstvenim delavcem ti lahko pomaga ugotoviti, kaj ti ustreza.',
      },
      {
        title: 'Tvoji načrti',
        text: 'Če upaš na nosečnost kmalu ali pozneje, lahko trajanje metode in njena povratnost pomagata usmeriti izbiro.',
      },
      {
        title: 'Tvoje prednostne naloge',
        text: 'Diskretnost, preprostost, odsotnost vsakodnevne rutine ali dolgotrajna zaščita: tvoje prednostne naloge so pomembne pri tej odločitvi.',
      },
    ],
    choiceDiagramTitle: 'Kratko vprašanje, ki pomaga pri odločitvi',
    questionText: '„Ali bi raje mislila na svojo kontracepcijo vsak dan, vsak teden ali le nekajkrat na leto?“',
    choiceOption1Title: 'Pogosto',
    choiceOption1Text: 'Tableta ali metoda, ki zahteva redno pozornost',
    choiceOption2Title: 'Redkeje',
    choiceOption2Text: 'Obliž ali obroček, glede na ritem, ki ga izbereš',
    choiceOption3Title: 'Zelo redko',
    choiceOption3Text: 'Vsadek ali dolgotrajna hormonska maternična spirala',
    alertTitle: 'Vredno omeniti',
    alertText: 'Izbira hormonske kontracepcije mora upoštevati tvojo osebno in zdravstveno situacijo. Zdravstveni delavec ti lahko pomaga primerjati prednosti, tveganja, kontraindikacije in možne stranske učinke.',
    summaryTitle: 'Najpomembnejše',
    summarySubtitle: 'Ključne točke, ki jih je treba imeti v mislih',
    summaryRow1: 'Hormonske metode uporabljajo različne kombinacije hormonov in različne načine jemanja.',
    summaryRow2: 'Tableta, obliž in obroček zahtevajo stalno angažiranost, vsadek in hormonska maternična spirala pa sta dolgoročni metodi.',
    summaryRow3: 'Izbira naj ustreza tvojemu vsakdanu, željam, prenašanju in načrtom.',
    summaryRow4: 'Nobena metoda ni univerzalno „najboljša“ — predvsem mora biti združljiva s tvojimi potrebami in situacijo.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Če si vzameš čas za primerjavo metod z zdravstvenim delavcem, izbereš kontracepcijo, ki jo lahko uporabljaš mirno in dosledno.',
    shareMessage: 'Pregled hormonskih kontracepcijskih zdravljenj — AWA',
  },
  ne: {
    badge: 'हर्मोनल उपचारहरू',
    title: 'हर्मोनल गर्भनिरोधक उपचारहरूको सिंहावलोकन',
    metaDuration: '7 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'चक्की, प्याच, रिङ, इम्प्लान्ट, हर्मोनल IUD: के फरक छ र तपाईंको दैनिक जीवनसँग सबैभन्दा मिल्ने विधिबारे कसरी सोच्ने।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'साझा कार्य संयन्त्र',
      'विभिन्न विधिहरू',
      'आफ्नो छनोट कसरी निर्देशित गर्ने',
      'मुख्य कुराहरू',
    ],
    body1: 'हर्मोनल विधिहरूले गर्भधारण रोक्न हर्मोन प्रयोग गर्छन्। विधिअनुसार, तिनले मुख्यतया अण्डोत्सर्ग रोक्न, गर्भाशयको मुखको तरल पदार्थ बाक्लो बनाउन, र गर्भाशयको वातावरण बदल्न सक्छन्।',
    diagramTitle: 'हर्मोनल गर्भनिरोधनले कसरी काम गर्छ?',
    diagramSubtitle: 'सुरक्षामा धेरै संयन्त्रहरूले योगदान पुर्‍याउन सक्छन्।',
    step1Title: 'अण्डोत्सर्ग',
    step1Text: 'केही विधिहरूले अण्डा निस्कन रोक्छन् वा दबाउँछन्।',
    step2Title: 'गर्भाशयको मुखको तरल पदार्थ',
    step2Text: 'तरल पदार्थ बाक्लो हुन सक्छ, जसले शुक्रकीटलाई पार गर्न गाह्रो बनाउँछ।',
    step3Title: 'गर्भनिरोधक सुरक्षा',
    step3Text: 'यी संयन्त्रहरूको संयोजनले गर्भधारणको जोखिम घटाउन मद्दत गर्छ।',
    body2: 'सबै विधिहरूमा उस्तै स्तरको संलग्नता चाहिँदैन। मुख्य भिन्नता तपाईंले आफ्नो गर्भनिरोधनबारे कति पटक सोच्नुपर्छ भन्ने हो।',
    comparisonTitle: 'विधिहरूको तुलना',
    comparisonSubtitle: 'दैनिक कार्यदेखि दीर्घकालीन सुरक्षासम्म',
    scaleDaily: 'दैनिक',
    scaleWeekly: 'साप्ताहिक',
    scaleLongTerm: 'दीर्घकालीन',
    methods: [
      {
        title: 'चक्की',
        frequency: 'हरेक दिन',
        duration: 'नियमित रूपमा लिइन्छ',
        profile: 'आफ्नो गर्भनिरोधन आफैँ व्यवस्थापन गर्न चाहनुहुन्छ भने आदर्श',
      },
      {
        title: 'प्याच',
        frequency: 'हरेक हप्ता',
        duration: '4 मध्ये 3 हप्ता',
        profile: 'दैनिक दिनचर्याबाट जोगिन चाहनुहुन्छ भने सुविधाजनक',
      },
      {
        title: 'योनि रिङ',
        frequency: 'हरेक 3 हप्ता',
        duration: 'एक हप्ताको विरामसहित',
        profile: 'दैनिक कम कार्य चाहिने गोप्य विकल्प',
      },
      {
        title: 'इम्प्लान्ट',
        frequency: 'धेरै वर्ष',
        duration: 'कुनै दैनिक दिनचर्या छैन',
        profile: 'दीर्घकालीन गर्भनिरोधन चाहनुहुन्छ भने उपयुक्त',
      },
      {
        title: 'हर्मोनल IUD',
        frequency: 'धेरै वर्ष',
        duration: 'व्यावसायिकद्वारा राखिन्छ',
        profile: 'निकै कम हेरचाह चाहिने दीर्घकालीन समाधान',
      },
    ],
    highlightTitle: 'सम्झनुपर्ने मुख्य कुरा',
    highlightText: 'विधिलाई जति कम दैनिक कार्य चाहिन्छ, त्यति कम पटक तपाईंले त्यसबारे सोच्नुपर्छ। मात्रा वा परिवर्तन बिर्सने सम्भावना छ भन्ने तपाईंलाई थाहा छ भने यो विचार गर्न लायक हुन सक्छ।',
    body3: 'सबैका लागि एउटै आदर्श विधि हुँदैन। सबैभन्दा राम्रो छनोट तपाईंको दैनिक जीवन, रुचि, सहनशीलता र योजनामा निर्भर गर्छ।',
    criteria: [
      {
        title: 'तपाईंको दैनिक जीवन',
        text: 'केही विधिहरूलाई दैनिक कार्य चाहिन्छ, भने अरूले धेरै हप्ता वा वर्षसम्म काम गर्छन्।',
      },
      {
        title: 'तपाईंको सहनशीलता',
        text: 'विधिले कस्तो अनुभूति दिन्छ व्यक्तिपिच्छे फरक हुन सक्छ। स्वास्थ्यकर्मीसँग कुरा गर्नाले तपाईंलाई के मिल्छ पत्ता लगाउन मद्दत गर्न सक्छ।',
      },
      {
        title: 'तपाईंका योजनाहरू',
        text: 'चाँडै वा पछि गर्भावस्थाको आशा गर्दै हुनुहुन्छ भने, विधिको अवधि र उल्टाउन सकिने क्षमताले तपाईंको छनोट निर्देशित गर्न मद्दत गर्न सक्छ।',
      },
      {
        title: 'तपाईंका प्राथमिकताहरू',
        text: 'गोपनीयता, सरलता, दैनिक दिनचर्या नहुनु, वा दीर्घकालीन सुरक्षा: यस निर्णयमा तपाईंका प्राथमिकताहरू महत्त्वपूर्ण छन्।',
      },
    ],
    choiceDiagramTitle: 'निर्णय गर्न मद्दत गर्ने एउटा छिटो प्रश्न',
    questionText: '“म आफ्नो गर्भनिरोधनबारे हरेक दिन, हरेक हप्ता, वा वर्षमा केही पटक मात्र सोच्न रुचाउँछु?”',
    choiceOption1Title: 'प्रायः',
    choiceOption1Text: 'चक्की वा नियमित ध्यान चाहिने विधि',
    choiceOption2Title: 'कम पटक',
    choiceOption2Text: 'तपाईंले छानेको लयअनुसार प्याच वा रिङ',
    choiceOption3Title: 'निकै कम',
    choiceOption3Text: 'इम्प्लान्ट वा दीर्घकालीन हर्मोनल IUD',
    alertTitle: 'ध्यान दिन लायक',
    alertText: 'हर्मोनल गर्भनिरोधक छान्दा तपाईंको व्यक्तिगत र चिकित्सकीय अवस्थालाई ध्यानमा राख्नुपर्छ। स्वास्थ्यकर्मीले तपाईंलाई फाइदा, जोखिम, निषेध र सम्भावित साइड इफेक्टहरू तुलना गर्न मद्दत गर्न सक्छन्।',
    summaryTitle: 'आवश्यक कुराहरू',
    summarySubtitle: 'मनमा राख्नुपर्ने मुख्य बुँदाहरू',
    summaryRow1: 'हर्मोनल विधिहरूले फरक हर्मोन संयोजन र प्रयोगका फरक तालिका प्रयोग गर्छन्।',
    summaryRow2: 'चक्की, प्याच र रिङलाई निरन्तर संलग्नता चाहिन्छ, जबकि इम्प्लान्ट र हर्मोनल IUD दीर्घकालीन विधि हुन्।',
    summaryRow3: 'छनोट तपाईंको दैनिक जीवन, रुचि, सहनशीलता र योजनासँग मिल्नुपर्छ।',
    summaryRow4: 'कुनै विधि सार्वभौम रूपमा “सबैभन्दा राम्रो” हुँदैन — यो मुख्यतया तपाईंका आवश्यकता र अवस्थासँग मिल्नुपर्छ।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'स्वास्थ्यकर्मीसँग विधिहरू तुलना गर्न समय लिँदा तपाईंले शान्त र निरन्तर रूपमा प्रयोग गर्न सक्ने गर्भनिरोधन छान्न मद्दत मिल्छ।',
    shareMessage: 'हर्मोनल गर्भनिरोधक उपचारहरूको सिंहावलोकन — AWA',
  },
  si: {
    badge: 'හෝමෝන ප්‍රතිකාර',
    title: 'හෝමෝන ගර්භනිරෝධන ප්‍රතිකාරවල දළ විශ්ලේෂණය',
    metaDuration: 'කියවීමට මිනිත්තු 7',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'පෙත්ත, පැච්, මුද්ද, රෝපණය, හෝමෝන IUD: ඒවා වෙනස් කරන්නේ කුමක්ද සහ ඔබේ එදිනෙදා ජීවිතයට වඩාත්ම ගැළපෙන ක්‍රමය ගැන සිතන්නේ කෙසේද.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'බෙදාගත් ක්‍රියාකාරී යාන්ත්‍රණයක්',
      'විවිධ ක්‍රම',
      'ඔබේ තේරීම මඟ පෙන්වන්නේ කෙසේද',
      'ප්‍රධාන කරුණු',
    ],
    body1: 'හෝමෝන ක්‍රම ගැබ්ගැනීම වැළැක්වීමට හෝමෝන භාවිතා කරයි. ක්‍රමය අනුව, ඒවාට ප්‍රධාන වශයෙන් ඩිම්බ මෝචනය වැළැක්විය, ගර්භාෂ ග්‍රීවා ශ්ලේෂ්මල ඝන කළ සහ ගර්භාෂ පරිසරය වෙනස් කළ හැක.',
    diagramTitle: 'හෝමෝන ගර්භනිරෝධනය ක්‍රියා කරන්නේ කෙසේද?',
    diagramSubtitle: 'ආරක්ෂාවට යාන්ත්‍රණ කිහිපයක් දායක විය හැක.',
    step1Title: 'ඩිම්බ මෝචනය',
    step1Text: 'සමහර ක්‍රම ඩිම්බය නිකුත් වීම වළක්වයි හෝ නිෂේධනය කරයි.',
    step2Title: 'ගර්භාෂ ග්‍රීවා ශ්ලේෂ්මල',
    step2Text: 'ශ්ලේෂ්මල ඝන විය හැකි අතර, එය ශුක්‍රාණුවලට ගමන් කිරීම අපහසු කරයි.',
    step3Title: 'ගර්භනිරෝධක ආරක්ෂාව',
    step3Text: 'මෙම යාන්ත්‍රණවල සංයෝජනය ගැබ්ගැනීමේ අවදානම අඩු කිරීමට උපකාරී වේ.',
    body2: 'සියලුම ක්‍රමවලට එකම මට්ටමේ සහභාගීත්වයක් අවශ්‍ය නොවේ. ප්‍රධාන වෙනස නම් ඔබේ ගර්භනිරෝධනය ගැන ඔබට කොපමණ නිතර සිතිය යුතුද යන්නයි.',
    comparisonTitle: 'ක්‍රම සංසන්දනය කිරීම',
    comparisonSubtitle: 'දෛනික ක්‍රියාවක සිට දිගුකාලීන ආරක්ෂාව දක්වා',
    scaleDaily: 'දෛනික',
    scaleWeekly: 'සතිපතා',
    scaleLongTerm: 'දිගුකාලීන',
    methods: [
      {
        title: 'පෙත්ත',
        frequency: 'සෑම දිනකම',
        duration: 'නිතිපතා ගනී',
        profile: 'ඔබට ඔබේම ගර්භනිරෝධනය කළමනාකරණය කිරීමට අවශ්‍ය නම් පරමාදර්ශී',
      },
      {
        title: 'පැච්',
        frequency: 'සෑම සතියකම',
        duration: 'සති 4න් සති 3ක්',
        profile: 'ඔබ දෛනික පුරුද්දක් වළක්වා ගැනීමට කැමති නම් පහසුයි',
      },
      {
        title: 'යෝනි මුද්ද',
        frequency: 'සෑම සති 3කට වරක්',
        duration: 'සතියක විරාමයක් සමඟ',
        profile: 'එදිනෙදා ක්‍රියා අඩු රහසිගත විකල්පයක්',
      },
      {
        title: 'රෝපණය',
        frequency: 'වසර කිහිපයක්',
        duration: 'දෛනික පුරුද්දක් නැත',
        profile: 'ඔබට දිගුකාලීන ගර්භනිරෝධනයක් අවශ්‍ය නම් සුදුසුයි',
      },
      {
        title: 'හෝමෝන IUD',
        frequency: 'වසර කිහිපයක්',
        duration: 'වෘත්තිකයෙකු විසින් තබනු ලැබේ',
        profile: 'ඉතා අඩු නඩත්තුවක් අවශ්‍ය දිගුකාලීන විසඳුමක්',
      },
    ],
    highlightTitle: 'මතක තබාගත යුතු ප්‍රධානම කරුණ',
    highlightText: 'ක්‍රමයකට අවශ්‍ය එදිනෙදා ක්‍රියා අඩු තරමට, ඒ ගැන ඔබට සිතීමට සිදුවන්නේ අඩුවෙනි. ඔබට මාත්‍රාවක් හෝ මාරු කිරීමක් අමතක වීමට ඉඩ ඇති බව ඔබ දන්නේ නම් මෙය සලකා බැලීම වටී.',
    body3: 'සෑම කෙනෙකුටම ගැළපෙන එකම පරමාදර්ශී ක්‍රමයක් නැත. හොඳම තේරීම රඳා පවතින්නේ ඔබේ එදිනෙදා ජීවිතය, ඔබේ මනාප, ඔබේ ඉවසීම සහ ඔබේ සැලසුම් මතය.',
    criteria: [
      {
        title: 'ඔබේ එදිනෙදා ජීවිතය',
        text: 'සමහර ක්‍රමවලට දෛනික ක්‍රියාවක් අවශ්‍ය වන අතර, අනෙක් ඒවා සති කිහිපයක් හෝ වසර කිහිපයක් ක්‍රියා කරයි.',
      },
      {
        title: 'ඔබේ ඉවසීම',
        text: 'ක්‍රමයක් දැනෙන ආකාරය පුද්ගලයාගෙන් පුද්ගලයාට වෙනස් විය හැක. සෞඛ්‍ය වෘත්තිකයෙකු සමඟ කතා කිරීම ඔබට ගැළපෙන දේ සොයාගැනීමට උපකාරී විය හැක.',
      },
      {
        title: 'ඔබේ සැලසුම්',
        text: 'ඔබ ඉක්මනින් හෝ පසුව ගැබ්ගැනීමක් බලාපොරොත්තු වන්නේ නම්, ක්‍රමයේ කාලය සහ ආපසු හැරවිය හැකි බව ඔබේ තේරීම මඟ පෙන්වීමට උපකාරී විය හැක.',
      },
      {
        title: 'ඔබේ ප්‍රමුඛතා',
        text: 'රහසිගත බව, සරල බව, දෛනික පුරුද්දක් නොමැති බව, හෝ දිගුකාලීන ආරක්ෂාව: මෙම තීරණයේදී ඔබේ ප්‍රමුඛතා වැදගත් වේ.',
      },
    ],
    choiceDiagramTitle: 'තීරණය කිරීමට උපකාරී වන ඉක්මන් ප්‍රශ්නයක්',
    questionText: '“මම මගේ ගර්භනිරෝධනය ගැන සෑම දිනකම, සෑම සතියකම, හෝ වසරකට වාර කිහිපයක් පමණක් සිතීමට කැමතිද?”',
    choiceOption1Title: 'නිතර',
    choiceOption1Text: 'පෙත්ත හෝ නිතිපතා අවධානය අවශ්‍ය ක්‍රමයක්',
    choiceOption2Title: 'අඩු නිතර',
    choiceOption2Text: 'ඔබ තෝරන රිද්මය අනුව පැච් හෝ මුද්ද',
    choiceOption3Title: 'ඉතා කලාතුරකින්',
    choiceOption3Text: 'රෝපණය හෝ දිගුකාලීන හෝමෝන IUD',
    alertTitle: 'සටහන් කිරීම වටී',
    alertText: 'හෝමෝන ගර්භනිරෝධකයක් තෝරා ගැනීමේදී ඔබේ පෞද්ගලික සහ වෛද්‍ය තත්ත්වය සැලකිල්ලට ගත යුතුයි. සෞඛ්‍ය වෘත්තිකයෙකුට ප්‍රතිලාභ, අවදානම්, ප්‍රතිවිරෝධතා සහ ඇතිවිය හැකි අතුරු ආබාධ සංසන්දනය කිරීමට ඔබට උදව් කළ හැක.',
    summaryTitle: 'අත්‍යවශ්‍ය දේ',
    summarySubtitle: 'මතක තබාගත යුතු ප්‍රධාන කරුණු',
    summaryRow1: 'හෝමෝන ක්‍රම විවිධ හෝමෝන සංයෝජන සහ විවිධ භාවිත කාලසටහන් භාවිතා කරයි.',
    summaryRow2: 'පෙත්ත, පැච් සහ මුද්ද අඛණ්ඩ සහභාගීත්වයක් ඉල්ලා සිටින අතර, රෝපණය සහ හෝමෝන IUD දිගුකාලීන ක්‍රම වේ.',
    summaryRow3: 'තේරීම ඔබේ එදිනෙදා ජීවිතයට, ඔබේ මනාපවලට, ඔබේ ඉවසීමට සහ ඔබේ සැලසුම්වලට ගැළපිය යුතුයි.',
    summaryRow4: 'කිසිදු ක්‍රමයක් සර්වත්‍රිකව “හොඳම” නොවේ — එය ප්‍රධාන වශයෙන් ඔබේ අවශ්‍යතා සහ ඔබේ තත්ත්වය සමඟ අනුකූල විය යුතුයි.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'සෞඛ්‍ය වෘත්තිකයෙකු සමඟ ක්‍රම සංසන්දනය කිරීමට කාලය ගැනීම, ඔබට සන්සුන්ව සහ ස්ථාවරව භාවිතා කළ හැකි ගර්භනිරෝධනයක් තෝරා ගැනීමට උපකාරී වේ.',
    shareMessage: 'හෝමෝන ගර්භනිරෝධන ප්‍රතිකාරවල දළ විශ්ලේෂණය — AWA',
  },
  th: {
    badge: 'การรักษาด้วยฮอร์โมน',
    title: 'ภาพรวมของการรักษาคุมกำเนิดด้วยฮอร์โมน',
    metaDuration: 'อ่าน 7 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ยาเม็ด แผ่นแปะ ห่วง ยาฝัง ห่วงอนามัยฮอร์โมน: อะไรที่ทำให้แตกต่างกัน และวิธีคิดเกี่ยวกับวิธีที่เหมาะกับชีวิตประจำวันของคุณที่สุด',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'กลไกการออกฤทธิ์ที่ใช้ร่วมกัน',
      'วิธีต่าง ๆ',
      'วิธีนำทางการเลือกของคุณ',
      'ประเด็นสำคัญ',
    ],
    body1: 'วิธีการที่ใช้ฮอร์โมนใช้ฮอร์โมนเพื่อป้องกันการตั้งครรภ์ ตามวิธี อาจป้องกันการตกไข่เป็นหลัก ทำให้เมือกปากมดลูกข้นขึ้น และเปลี่ยนสภาพแวดล้อมของมดลูก',
    diagramTitle: 'การคุมกำเนิดด้วยฮอร์โมนทำงานอย่างไร?',
    diagramSubtitle: 'หลายกลไกอาจมีส่วนช่วยในการป้องกัน',
    step1Title: 'การตกไข่',
    step1Text: 'บางวิธีป้องกันหรือยับยั้งการปล่อยไข่',
    step2Title: 'เมือกปากมดลูก',
    step2Text: 'เมือกอาจข้นขึ้น ทำให้อสุจิผ่านได้ยากขึ้น',
    step3Title: 'การป้องกันการตั้งครรภ์',
    step3Text: 'การรวมกันของกลไกเหล่านี้ช่วยลดความเสี่ยงของการตั้งครรภ์',
    body2: 'ไม่ใช่ทุกวิธีที่ต้องการการเอาใจใส่ในระดับเดียวกัน ความแตกต่างหลักคือความถี่ที่คุณต้องนึกถึงการคุมกำเนิด',
    comparisonTitle: 'เปรียบเทียบวิธีต่าง ๆ',
    comparisonSubtitle: 'ตั้งแต่ทำทุกวันไปจนถึงการป้องกันระยะยาว',
    scaleDaily: 'รายวัน',
    scaleWeekly: 'รายสัปดาห์',
    scaleLongTerm: 'ระยะยาว',
    methods: [
      {
        title: 'ยาเม็ด',
        frequency: 'ทุกวัน',
        duration: 'ทานสม่ำเสมอ',
        profile: 'เหมาะหากคุณอยากจัดการการคุมกำเนิดด้วยตัวเอง',
      },
      {
        title: 'แผ่นแปะ',
        frequency: 'ทุกสัปดาห์',
        duration: '3 สัปดาห์จาก 4 สัปดาห์',
        profile: 'สะดวกหากคุณอยากหลีกเลี่ยงกิจวัตรรายวัน',
      },
      {
        title: 'ห่วงคุมกำเนิดทางช่องคลอด',
        frequency: 'ทุก 3 สัปดาห์',
        duration: 'พักหนึ่งสัปดาห์',
        profile: 'ตัวเลือกที่ไม่เด่นชัดและต้องทำน้อยในแต่ละวัน',
      },
      {
        title: 'ยาฝัง',
        frequency: 'หลายปี',
        duration: 'ไม่มีกิจวัตรรายวัน',
        profile: 'เหมาะหากคุณต้องการการคุมกำเนิดระยะยาว',
      },
      {
        title: 'ห่วงอนามัยฮอร์โมน',
        frequency: 'หลายปี',
        duration: 'ใส่โดยผู้เชี่ยวชาญ',
        profile: 'ทางออกระยะยาวที่ต้องการการดูแลน้อยมาก',
      },
    ],
    highlightTitle: 'สิ่งสำคัญที่ควรจำ',
    highlightText: 'ยิ่งวิธีหนึ่งต้องทำในแต่ละวันน้อย คุณก็ยิ่งต้องนึกถึงมันน้อยลง ซึ่งน่าพิจารณาหากคุณรู้ว่ามีโอกาสลืมทานยาหรือลืมเปลี่ยน',
    body3: 'ไม่มีวิธีที่เหมาะอย่างสมบูรณ์แบบสำหรับทุกคน ทางเลือกที่ดีที่สุดขึ้นอยู่กับชีวิตประจำวัน ความชอบ ความทนต่อยา และแผนของคุณ',
    criteria: [
      {
        title: 'ชีวิตประจำวันของคุณ',
        text: 'บางวิธีต้องทำทุกวัน ขณะที่บางวิธีใช้ได้หลายสัปดาห์หรือหลายปี',
      },
      {
        title: 'ความทนต่อยาของคุณ',
        text: 'ความรู้สึกต่อวิธีหนึ่งแตกต่างกันในแต่ละคน การพูดคุยกับบุคลากรทางการแพทย์ช่วยให้คุณหาสิ่งที่เหมาะกับคุณได้',
      },
      {
        title: 'แผนของคุณ',
        text: 'หากคุณหวังจะตั้งครรภ์เร็ว ๆ นี้หรือภายหลัง ระยะเวลาของวิธีและความสามารถในการย้อนกลับช่วยนำทางการเลือกได้',
      },
      {
        title: 'สิ่งที่คุณให้ความสำคัญ',
        text: 'ความเงียบ ความเรียบง่าย ไม่มีกิจวัตรรายวัน หรือการป้องกันที่ยาวนาน: สิ่งที่คุณให้ความสำคัญมีความหมายในการตัดสินใจนี้',
      },
    ],
    choiceDiagramTitle: 'คำถามสั้น ๆ เพื่อช่วยให้คุณตัดสินใจ',
    questionText: '“ฉันอยากนึกถึงการคุมกำเนิดทุกวัน ทุกสัปดาห์ หรือเพียงปีละไม่กี่ครั้ง?”',
    choiceOption1Title: 'บ่อย',
    choiceOption1Text: 'ยาเม็ดหรือวิธีที่ต้องใส่ใจเป็นประจำ',
    choiceOption2Title: 'น้อยลง',
    choiceOption2Text: 'แผ่นแปะหรือห่วง ตามจังหวะที่คุณเลือก',
    choiceOption3Title: 'น้อยมาก',
    choiceOption3Text: 'ยาฝังหรือห่วงอนามัยฮอร์โมนระยะยาว',
    alertTitle: 'ข้อควรทราบ',
    alertText: 'การเลือกการคุมกำเนิดด้วยฮอร์โมนควรคำนึงถึงสถานการณ์ส่วนตัวและทางการแพทย์ของคุณ บุคลากรทางการแพทย์ช่วยคุณเปรียบเทียบประโยชน์ ความเสี่ยง ข้อห้ามใช้ และผลข้างเคียงที่เป็นไปได้',
    summaryTitle: 'สาระสำคัญ',
    summarySubtitle: 'ประเด็นสำคัญที่ควรจำ',
    summaryRow1: 'วิธีการที่ใช้ฮอร์โมนใช้ฮอร์โมนผสมที่ต่างกันและตารางการใช้ที่ต่างกัน',
    summaryRow2: 'ยาเม็ด แผ่นแปะ และห่วงต้องการการเอาใจใส่ต่อเนื่อง ขณะที่ยาฝังและห่วงอนามัยฮอร์โมนเป็นวิธีระยะยาว',
    summaryRow3: 'ทางเลือกควรเหมาะกับชีวิตประจำวัน ความชอบ ความทนต่อยา และแผนของคุณ',
    summaryRow4: 'ไม่มีวิธีใดที่ “ดีที่สุด” สำหรับทุกคน — ควรเข้ากันได้กับความต้องการและสถานการณ์ของคุณเป็นหลัก',
    tip1Title: 'ควรรู้',
    tip1Text: 'การใช้เวลาเปรียบเทียบวิธีกับบุคลากรทางการแพทย์ช่วยให้คุณเลือกการคุมกำเนิดที่ใช้ได้อย่างสงบและสม่ำเสมอ',
    shareMessage: 'ภาพรวมของการรักษาคุมกำเนิดด้วยฮอร์โมน — AWA',
  },
  vi: {
    badge: 'LIỆU PHÁP NỘI TIẾT',
    title: 'Tổng quan về các liệu pháp tránh thai nội tiết',
    metaDuration: '7 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Thuốc uống, miếng dán, vòng, que cấy, vòng tránh thai nội tiết (IUD): điều gì làm chúng khác nhau và cách nghĩ về phương pháp phù hợp nhất với cuộc sống hằng ngày của bạn.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Một cơ chế tác dụng chung',
      'Các phương pháp khác nhau',
      'Cách định hướng lựa chọn của bạn',
      'Những điểm chính cần nhớ',
    ],
    body1: 'Các phương pháp nội tiết dùng hormone để ngăn ngừa mang thai. Tùy phương pháp, chúng có thể chủ yếu ngăn rụng trứng, làm đặc dịch nhầy cổ tử cung và thay đổi môi trường tử cung.',
    diagramTitle: 'Tránh thai nội tiết hoạt động như thế nào?',
    diagramSubtitle: 'Nhiều cơ chế có thể góp phần vào việc bảo vệ.',
    step1Title: 'Rụng trứng',
    step1Text: 'Một số phương pháp ngăn chặn hoặc ức chế việc phóng thích trứng.',
    step2Title: 'Dịch nhầy cổ tử cung',
    step2Text: 'Dịch nhầy có thể trở nên đặc hơn, khiến tinh trùng khó đi qua hơn.',
    step3Title: 'Bảo vệ tránh thai',
    step3Text: 'Sự kết hợp của các cơ chế này giúp giảm nguy cơ mang thai.',
    body2: 'Không phải phương pháp nào cũng đòi hỏi mức độ tham gia như nhau. Khác biệt chính là mức độ thường xuyên bạn phải nghĩ đến biện pháp tránh thai của mình.',
    comparisonTitle: 'So sánh các phương pháp',
    comparisonSubtitle: 'Từ hành động hằng ngày đến bảo vệ lâu dài',
    scaleDaily: 'Hằng ngày',
    scaleWeekly: 'Hằng tuần',
    scaleLongTerm: 'Lâu dài',
    methods: [
      {
        title: 'Thuốc uống',
        frequency: 'Mỗi ngày',
        duration: 'Uống đều đặn',
        profile: 'Lý tưởng nếu bạn muốn tự quản lý việc tránh thai',
      },
      {
        title: 'Miếng dán',
        frequency: 'Mỗi tuần',
        duration: '3 tuần trong 4 tuần',
        profile: 'Tiện lợi nếu bạn muốn tránh thói quen hằng ngày',
      },
      {
        title: 'Vòng tránh thai âm đạo',
        frequency: 'Mỗi 3 tuần',
        duration: 'Có một tuần nghỉ',
        profile: 'Một lựa chọn kín đáo, ít thao tác hằng ngày',
      },
      {
        title: 'Que cấy',
        frequency: 'Vài năm',
        duration: 'Không cần thói quen hằng ngày',
        profile: 'Phù hợp nếu bạn muốn tránh thai lâu dài',
      },
      {
        title: 'Vòng tránh thai nội tiết (IUD)',
        frequency: 'Vài năm',
        duration: 'Do chuyên gia đặt',
        profile: 'Một giải pháp lâu dài cần rất ít việc duy trì',
      },
    ],
    highlightTitle: 'Điều quan trọng cần nhớ',
    highlightText: 'Phương pháp càng cần ít thao tác hằng ngày thì bạn càng ít phải nghĩ đến nó. Điều này đáng cân nhắc nếu bạn biết mình dễ quên một liều hoặc một lần thay.',
    body3: 'Không có một phương pháp lý tưởng cho tất cả mọi người. Lựa chọn tốt nhất phụ thuộc vào cuộc sống hằng ngày, sở thích, khả năng dung nạp và kế hoạch của bạn.',
    criteria: [
      {
        title: 'Cuộc sống hằng ngày của bạn',
        text: 'Một số phương pháp đòi hỏi một hành động hằng ngày, trong khi số khác có tác dụng trong vài tuần hoặc vài năm.',
      },
      {
        title: 'Khả năng dung nạp của bạn',
        text: 'Cảm giác khi dùng một phương pháp có thể khác nhau giữa từng người. Trao đổi với nhân viên y tế có thể giúp bạn xác định điều gì phù hợp với mình.',
      },
      {
        title: 'Kế hoạch của bạn',
        text: 'Nếu bạn mong muốn mang thai sớm hoặc muộn hơn, thời gian tác dụng và khả năng đảo ngược của phương pháp có thể giúp định hướng lựa chọn.',
      },
      {
        title: 'Ưu tiên của bạn',
        text: 'Sự kín đáo, đơn giản, không cần thói quen hằng ngày hoặc bảo vệ lâu dài: những ưu tiên của bạn rất quan trọng trong quyết định này.',
      },
    ],
    choiceDiagramTitle: 'Một câu hỏi nhanh giúp bạn quyết định',
    questionText: '“Tôi muốn nghĩ đến biện pháp tránh thai mỗi ngày, mỗi tuần, hay chỉ vài lần mỗi năm?”',
    choiceOption1Title: 'Thường xuyên',
    choiceOption1Text: 'Thuốc uống hoặc phương pháp cần chú ý thường xuyên',
    choiceOption2Title: 'Ít thường xuyên hơn',
    choiceOption2Text: 'Miếng dán hoặc vòng, tùy theo nhịp độ bạn chọn',
    choiceOption3Title: 'Rất hiếm khi',
    choiceOption3Text: 'Que cấy hoặc vòng tránh thai nội tiết lâu dài',
    alertTitle: 'Điều đáng lưu ý',
    alertText: 'Việc chọn một biện pháp tránh thai nội tiết cần cân nhắc tình trạng cá nhân và y tế của bạn. Nhân viên y tế có thể giúp bạn so sánh lợi ích, rủi ro, chống chỉ định và các tác dụng phụ có thể có.',
    summaryTitle: 'Điều thiết yếu',
    summarySubtitle: 'Những điểm chính cần ghi nhớ',
    summaryRow1: 'Các phương pháp nội tiết dùng các tổ hợp hormone khác nhau và các lịch sử dụng khác nhau.',
    summaryRow2: 'Thuốc uống, miếng dán và vòng đòi hỏi sự tham gia liên tục, trong khi que cấy và vòng tránh thai nội tiết (IUD) là các phương pháp lâu dài.',
    summaryRow3: 'Lựa chọn nên phù hợp với cuộc sống hằng ngày, sở thích, khả năng dung nạp và kế hoạch của bạn.',
    summaryRow4: 'Không có phương pháp nào “tốt nhất” một cách phổ quát — điều chính là nó phải tương thích với nhu cầu và hoàn cảnh của bạn.',
    tip1Title: 'Nên biết',
    tip1Text: 'Dành thời gian so sánh các phương pháp cùng nhân viên y tế giúp bạn chọn một biện pháp tránh thai mà bạn có thể sử dụng bình tĩnh và đều đặn.',
    shareMessage: 'Tổng quan về các liệu pháp tránh thai nội tiết — AWA',
  },
  uz: {
    badge: 'GORMONAL DAVOLANISHLAR',
    title: 'Gormonal kontratseptiv davolanishlar sharhi',
    metaDuration: '7 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Tabletka, plastir, halqa, implant, gormonal spiral: ularni nima farqlaydi va kundalik hayotingizga eng mos usul haqida qanday oʻylash kerak.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Umumiy taʼsir mexanizmi',
      'Turli usullar',
      'Tanlovni qanday yoʻnaltirish kerak',
      'Asosiy xulosalar',
    ],
    body1: 'Gormonal usullar homiladorlikning oldini olish uchun gormonlardan foydalanadi. Usulga qarab, ular asosan ovulyatsiyani toʻsishi, bachadon boʻyni shilligini quyuqlashtirishi va bachadon muhitini oʻzgartirishi mumkin.',
    diagramTitle: 'Gormonal kontratseptsiya qanday ishlaydi?',
    diagramSubtitle: 'Himoyaga bir necha mexanizm hissa qoʻshishi mumkin.',
    step1Title: 'Ovulyatsiya',
    step1Text: 'Baʼzi usullar tuxum hujayra chiqishini toʻsadi yoki susaytiradi.',
    step2Title: 'Bachadon boʻyni shilligi',
    step2Text: 'Shilliq quyuqroq boʻlishi mumkin, bu spermatozoidlarning oʻtishini qiyinlashtiradi.',
    step3Title: 'Kontratseptiv himoya',
    step3Text: 'Bu mexanizmlarning uygʻunligi homiladorlik xavfini kamaytirishga yordam beradi.',
    body2: 'Barcha usullar bir xil darajadagi ishtirokni talab qilmaydi. Asosiy farq — kontratseptsiya haqida qanchalik tez-tez oʻylashingiz kerakligi.',
    comparisonTitle: 'Usullarni solishtirish',
    comparisonSubtitle: 'Kundalik harakatdan uzoq muddatli himoyagacha',
    scaleDaily: 'Kundalik',
    scaleWeekly: 'Haftalik',
    scaleLongTerm: 'Uzoq muddatli',
    methods: [
      {
        title: 'Tabletka',
        frequency: 'Har kuni',
        duration: 'Muntazam qabul qilinadi',
        profile: 'Kontratseptsiyani oʻzingiz boshqarishni xohlasangiz ideal',
      },
      {
        title: 'Plastir',
        frequency: 'Har hafta',
        duration: '4 haftadan 3 haftasi',
        profile: 'Kundalik tartibdan qochishni afzal koʻrsangiz qulay',
      },
      {
        title: 'Qin halqasi',
        frequency: 'Har 3 haftada',
        duration: 'Bir haftalik tanaffus bilan',
        profile: 'Kundalik harakatlari kam, sezdirmaydigan variant',
      },
      {
        title: 'Implant',
        frequency: 'Bir necha yil',
        duration: 'Kundalik tartibsiz',
        profile: 'Uzoq muddatli kontratseptsiyani xohlasangiz mos',
      },
      {
        title: 'Gormonal spiral',
        frequency: 'Bir necha yil',
        duration: 'Mutaxassis tomonidan joylashtiriladi',
        profile: 'Juda kam parvarishni talab qiladigan uzoq muddatli yechim',
      },
    ],
    highlightTitle: 'Esda tutish kerak boʻlgan asosiy narsa',
    highlightText: 'Usul qanchalik kam kundalik harakat talab qilsa, u haqida shunchalik kam oʻylashingiz kerak. Agar dozani yoki almashtirishni unutishga moyil ekaningizni bilsangiz, bu muhim boʻlishi mumkin.',
    body3: 'Hamma uchun yagona ideal usul yoʻq. Eng yaxshi tanlov kundalik hayotingiz, afzalliklaringiz, bardoshligingiz va rejalaringizga bogʻliq.',
    criteria: [
      {
        title: 'Kundalik hayotingiz',
        text: 'Baʼzi usullar kundalik harakatni talab qiladi, boshqalari bir necha hafta yoki yil ishlaydi.',
      },
      {
        title: 'Bardoshligingiz',
        text: 'Usulni qanday his qilish odamdan odamga farq qilishi mumkin. Sogʻliqni saqlash mutaxassisi bilan gaplashish sizga nima mosligini aniqlashga yordam beradi.',
      },
      {
        title: 'Rejalaringiz',
        text: 'Agar yaqinda yoki keyinroq homiladorlikni umid qilsangiz, usulning davomiyligi va qaytarilishi tanlovni yoʻnaltirishga yordam beradi.',
      },
      {
        title: 'Ustuvorliklaringiz',
        text: 'Sezdirmaslik, oddiylik, kundalik tartibsizlik yoki uzoq muddatli himoya: ustuvorliklaringiz bu qarorda muhim.',
      },
    ],
    choiceDiagramTitle: 'Qaror qabul qilishga yordam beradigan tezkor savol',
    questionText: '“Kontratseptsiya haqida har kuni, har hafta yoki yiliga faqat bir necha marta oʻylashni afzal koʻraman?”',
    choiceOption1Title: 'Tez-tez',
    choiceOption1Text: 'Tabletka yoki muntazam eʼtibor talab qiladigan usul',
    choiceOption2Title: 'Kamroq',
    choiceOption2Text: 'Plastir yoki halqa, tanlagan ritmingizga qarab',
    choiceOption3Title: 'Juda kam',
    choiceOption3Text: 'Implant yoki uzoq muddatli gormonal spiral',
    alertTitle: 'Eʼtiborga loyiq',
    alertText: 'Gormonal kontratseptivni tanlashda shaxsiy va tibbiy vaziyatingiz hisobga olinishi kerak. Sogʻliqni saqlash mutaxassisi foydalar, xavflar, qarshi koʻrsatmalar va mumkin boʻlgan nojoʻya taʼsirlarni solishtirishga yordam beradi.',
    summaryTitle: 'Asosiy jihatlar',
    summarySubtitle: 'Esda tutish kerak boʻlgan asosiy nuqtalar',
    summaryRow1: 'Gormonal usullar turli gormon kombinatsiyalari va turli foydalanish jadvallaridan foydalanadi.',
    summaryRow2: 'Tabletka, plastir va halqa doimiy ishtirokni talab qiladi, implant va gormonal spiral esa uzoq muddatli usullar.',
    summaryRow3: 'Tanlov kundalik hayotingiz, afzalliklaringiz, bardoshligingiz va rejalaringizga mos boʻlishi kerak.',
    summaryRow4: 'Hech bir usul universal “eng yaxshi” emas — u asosan ehtiyojlaringiz va vaziyatingizga mos kelishi kerak.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Usullarni sogʻliqni saqlash mutaxassisi bilan solishtirishga vaqt ajratish xotirjam va izchil ishlatishingiz mumkin boʻlgan kontratseptsiyani tanlashga yordam beradi.',
    shareMessage: 'Gormonal kontratseptiv davolanishlar sharhi — AWA',
  },
  az: {
    badge: 'HORMONAL MÜALİCƏLƏR',
    title: 'Hormonal kontraseptiv müalicələrə ümumi baxış',
    metaDuration: '7 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Hap, yamaq, halqa, implant, hormonal spiral: onları nə fərqləndirir və gündəlik həyatınıza ən uyğun üsul haqqında necə düşünmək olar.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Ortaq təsir mexanizmi',
      'Müxtəlif üsullar',
      'Seçiminizi necə istiqamətləndirmək olar',
      'Əsas nəticələr',
    ],
    body1: 'Hormonal üsullar hamiləliyin qarşısını almaq üçün hormonlardan istifadə edir. Üsuldan asılı olaraq, onlar əsasən ovulyasiyanın qarşısını ala, uşaqlıq boynu mukusunu qatılaşdıra və uşaqlıq mühitini dəyişə bilər.',
    diagramTitle: 'Hormonal kontrasepsiya necə işləyir?',
    diagramSubtitle: 'Qorumaya bir neçə mexanizm töhfə verə bilər.',
    step1Title: 'Ovulyasiya',
    step1Text: 'Bəzi üsullar yumurtahüceyrənin ayrılmasının qarşısını alır və ya onu inhibə edir.',
    step2Title: 'Uşaqlıq boynu mukusu',
    step2Text: 'Mukus qatılaşa bilər ki, bu da spermatozoidlərin keçməsini çətinləşdirir.',
    step3Title: 'Kontraseptiv qoruma',
    step3Text: 'Bu mexanizmlərin birləşməsi hamiləlik riskini azaltmağa kömək edir.',
    body2: 'Bütün üsullar eyni dərəcədə iştirak tələb etmir. Əsas fərq kontrasepsiya barədə nə qədər tez-tez düşünməli olduğunuzdur.',
    comparisonTitle: 'Üsulları müqayisə etmək',
    comparisonSubtitle: 'Gündəlik hərəkətdən uzunmüddətli qorumaya qədər',
    scaleDaily: 'Gündəlik',
    scaleWeekly: 'Həftəlik',
    scaleLongTerm: 'Uzunmüddətli',
    methods: [
      {
        title: 'Hap',
        frequency: 'Hər gün',
        duration: 'Müntəzəm qəbul olunur',
        profile: 'Kontrasepsiyanızı özünüz idarə etmək istəyirsinizsə, idealdır',
      },
      {
        title: 'Yamaq',
        frequency: 'Hər həftə',
        duration: '4 həftədən 3-ü',
        profile: 'Gündəlik rutindən qaçmaq istəyirsinizsə, rahatdır',
      },
      {
        title: 'Vaginal halqa',
        frequency: 'Hər 3 həftədən bir',
        duration: 'Bir həftəlik fasilə ilə',
        profile: 'Gündəlik az hərəkət tələb edən diskret seçim',
      },
      {
        title: 'İmplant',
        frequency: 'Bir neçə il',
        duration: 'Gündəlik rutin yoxdur',
        profile: 'Uzunmüddətli kontrasepsiya istəyirsinizsə, uyğundur',
      },
      {
        title: 'Hormonal spiral',
        frequency: 'Bir neçə il',
        duration: 'Mütəxəssis tərəfindən yerləşdirilir',
        profile: 'Çox az qulluq tələb edən uzunmüddətli həll',
      },
    ],
    highlightTitle: 'Yadda saxlamalı əsas məqam',
    highlightText: 'Üsul gündəlik nə qədər az hərəkət tələb edirsə, onun barədə bir o qədər az düşünməli olursunuz. Dozanı və ya dəyişməni unutmaq ehtimalınız varsa, bu, nəzərə almağa dəyər ola bilər.',
    body3: 'Hər kəs üçün bir ideal üsul yoxdur. Ən yaxşı seçim gündəlik həyatınızdan, üstünlüklərinizdən, dözümlülüyünüzdən və planlarınızdan asılıdır.',
    criteria: [
      {
        title: 'Gündəlik həyatınız',
        text: 'Bəzi üsullar gündəlik hərəkət tələb edir, digərləri isə bir neçə həftə və ya il işləyir.',
      },
      {
        title: 'Dözümlülüyünüz',
        text: 'Üsulun necə hiss olunması şəxsdən şəxsə dəyişə bilər. Tibb işçisi ilə danışmaq sizə nəyin uyğun olduğunu müəyyən etməyə kömək edə bilər.',
      },
      {
        title: 'Planlarınız',
        text: 'Tezliklə və ya sonralar hamiləlik ümid edirsinizsə, üsulun müddəti və geri dönərliyi seçiminizi istiqamətləndirməyə kömək edə bilər.',
      },
      {
        title: 'Prioritetləriniz',
        text: 'Diskretlik, sadəlik, gündəlik rutinin olmaması və ya uzunmüddətli qoruma: prioritetləriniz bu qərarda əhəmiyyətlidir.',
      },
    ],
    choiceDiagramTitle: 'Qərar verməyə kömək edən qısa sual',
    questionText: '“Kontrasepsiya barədə hər gün, hər həftə, yoxsa ildə yalnız bir neçə dəfə düşünməyi üstün tuturam?”',
    choiceOption1Title: 'Tez-tez',
    choiceOption1Text: 'Hap və ya müntəzəm diqqət tələb edən üsul',
    choiceOption2Title: 'Daha az tez-tez',
    choiceOption2Text: 'Seçdiyiniz ritmdən asılı olaraq yamaq və ya halqa',
    choiceOption3Title: 'Çox nadir',
    choiceOption3Text: 'İmplant və ya uzunmüddətli hormonal spiral',
    alertTitle: 'Qeyd etməyə dəyər',
    alertText: 'Hormonal kontraseptiv seçimi şəxsi və tibbi vəziyyətinizi nəzərə almalıdır. Tibb işçisi faydaları, riskləri, əks göstərişləri və mümkün yan təsirləri müqayisə etməyə kömək edə bilər.',
    summaryTitle: 'Əsas məsələlər',
    summarySubtitle: 'Yadda saxlamalı əsas məqamlar',
    summaryRow1: 'Hormonal üsullar müxtəlif hormon kombinasiyalarından və müxtəlif istifadə cədvəllərindən istifadə edir.',
    summaryRow2: 'Hap, yamaq və halqa davamlı iştirak tələb edir, implant və hormonal spiral isə uzunmüddətli üsullardır.',
    summaryRow3: 'Seçim gündəlik həyatınıza, üstünlüklərinizə, dözümlülüyünüzə və planlarınıza uyğun olmalıdır.',
    summaryRow4: 'Heç bir üsul universal “ən yaxşı” deyil — o, əsasən ehtiyaclarınıza və vəziyyətinizə uyğun olmalıdır.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Üsulları tibb işçisi ilə müqayisə etmək üçün vaxt ayırmaq sakit və müntəzəm istifadə edə biləcəyiniz kontrasepsiya seçməyə kömək edir.',
    shareMessage: 'Hormonal kontraseptiv müalicələrə ümumi baxış — AWA',
  },
  ka: {
    badge: 'ჰორმონული მკურნალობა',
    title: 'ჰორმონული კონტრაცეპტიული მკურნალობის მიმოხილვა',
    metaDuration: '7 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'აბი, პლასტირი, რგოლი, იმპლანტი, ჰორმონული სპირალი: რით განსხვავდებიან ისინი და როგორ ვიფიქროთ მეთოდზე, რომელიც თქვენს ყოველდღიურობას საუკეთესოდ ერგება.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'ერთობლივი მოქმედების მექანიზმი',
      'სხვადასხვა მეთოდი',
      'როგორ წარვმართოთ არჩევანი',
      'მთავარი დასკვნები',
    ],
    body1: 'ჰორმონული მეთოდები ორსულობის თავიდან ასაცილებლად ჰორმონებს იყენებს. მეთოდის მიხედვით, მათ შეუძლიათ ძირითადად ოვულაცია აღკვეთონ, საშვილოსნოს ყელის ლორწო გასქელონ და საშვილოსნოს გარემო შეცვალონ.',
    diagramTitle: 'როგორ მუშაობს ჰორმონული კონტრაცეფცია?',
    diagramSubtitle: 'დაცვას რამდენიმე მექანიზმმა შეიძლება შეუწყოს ხელი.',
    step1Title: 'ოვულაცია',
    step1Text: 'ზოგი მეთოდი კვერცხუჯრედის გამოთავისუფლებას ხელს უშლის ან თრგუნავს.',
    step2Title: 'საშვილოსნოს ყელის ლორწო',
    step2Text: 'ლორწო შეიძლება უფრო სქელი გახდეს, რაც სპერმატოზოიდების გავლას ართულებს.',
    step3Title: 'კონტრაცეპტიული დაცვა',
    step3Text: 'ამ მექანიზმების კომბინაცია ორსულობის რისკის შემცირებაში გვეხმარება.',
    body2: 'ყველა მეთოდი ერთნაირ ჩართულობას არ მოითხოვს. მთავარი განსხვავებაა, რამდენად ხშირად უნდა იფიქროთ თქვენს კონტრაცეფციაზე.',
    comparisonTitle: 'მეთოდების შედარება',
    comparisonSubtitle: 'ყოველდღიური მოქმედებიდან გრძელვადიან დაცვამდე',
    scaleDaily: 'ყოველდღიური',
    scaleWeekly: 'ყოველკვირეული',
    scaleLongTerm: 'გრძელვადიანი',
    methods: [
      {
        title: 'აბი',
        frequency: 'ყოველდღე',
        duration: 'რეგულარულად მიიღება',
        profile: 'იდეალურია, თუ გსურთ საკუთარი კონტრაცეფციის თავად მართვა',
      },
      {
        title: 'პლასტირი',
        frequency: 'ყოველ კვირას',
        duration: '4 კვირიდან 3 კვირა',
        profile: 'მოსახერხებელია, თუ ყოველდღიურ რუტინას ერიდებით',
      },
      {
        title: 'ვაგინალური რგოლი',
        frequency: 'ყოველ 3 კვირაში',
        duration: 'ერთკვირიანი შესვენებით',
        profile: 'დისკრეტული ვარიანტი, ყოველდღიური მოქმედებების მცირე რაოდენობით',
      },
      {
        title: 'იმპლანტი',
        frequency: 'რამდენიმე წელი',
        duration: 'ყოველდღიური რუტინის გარეშე',
        profile: 'შესაფერისია, თუ გრძელვადიანი კონტრაცეფცია გსურთ',
      },
      {
        title: 'ჰორმონული სპირალი',
        frequency: 'რამდენიმე წელი',
        duration: 'სპეციალისტი აყენებს',
        profile: 'გრძელვადიანი გადაწყვეტა, რომელიც ძალიან მცირე მოვლას საჭიროებს',
      },
    ],
    highlightTitle: 'მთავარი, რაც უნდა დაიმახსოვროთ',
    highlightText: 'რაც უფრო ნაკლებ ყოველდღიურ მოქმედებას მოითხოვს მეთოდი, მით უფრო იშვიათად გიწევთ მასზე ფიქრი. ეს განსახილველია, თუ იცით, რომ დოზის ან შეცვლის დავიწყება შეიძლება დაგემართოთ.',
    body3: 'ყველასთვის ერთი იდეალური მეთოდი არ არსებობს. საუკეთესო არჩევანი დამოკიდებულია თქვენს ყოველდღიურობაზე, პრეფერენციებზე, ამტანობასა და გეგმებზე.',
    criteria: [
      {
        title: 'თქვენი ყოველდღიურობა',
        text: 'ზოგი მეთოდი ყოველდღიურ მოქმედებას მოითხოვს, ზოგი კი რამდენიმე კვირის ან წლის განმავლობაში მოქმედებს.',
      },
      {
        title: 'თქვენი ამტანობა',
        text: 'მეთოდის განცდა ადამიანიდან ადამიანამდე შეიძლება განსხვავდებოდეს. ჯანდაცვის სპეციალისტთან საუბარმა შეიძლება დაგეხმაროთ გაიგოთ, რა გერგებათ.',
      },
      {
        title: 'თქვენი გეგმები',
        text: 'თუ ორსულობას უახლოეს ან უფრო შორეულ მომავალში ელოდებით, მეთოდის ხანგრძლივობა და შექცევადობა არჩევანის წარმართვაში შეიძლება დაგეხმაროთ.',
      },
      {
        title: 'თქვენი პრიორიტეტები',
        text: 'დისკრეციულობა, სიმარტივე, ყოველდღიური რუტინის არარსებობა ან ხანგრძლივი დაცვა: თქვენი პრიორიტეტები ამ გადაწყვეტილებაში მნიშვნელოვანია.',
      },
    ],
    choiceDiagramTitle: 'სწრაფი კითხვა გადაწყვეტილების დასახმარებლად',
    questionText: '„ჩემს კონტრაცეფციაზე ფიქრი მირჩევნია ყოველდღე, ყოველკვირა თუ წელიწადში მხოლოდ რამდენიმეჯერ?“',
    choiceOption1Title: 'ხშირად',
    choiceOption1Text: 'აბი ან მეთოდი, რომელიც რეგულარულ ყურადღებას მოითხოვს',
    choiceOption2Title: 'უფრო იშვიათად',
    choiceOption2Text: 'პლასტირი ან რგოლი, თქვენ მიერ არჩეული რიტმის მიხედვით',
    choiceOption3Title: 'ძალიან იშვიათად',
    choiceOption3Text: 'იმპლანტი ან გრძელვადიანი ჰორმონული სპირალი',
    alertTitle: 'აღსანიშნავია',
    alertText: 'ჰორმონული კონტრაცეპტივის არჩევისას უნდა გაითვალისწინოთ თქვენი პირადი და სამედიცინო სიტუაცია. ჯანდაცვის სპეციალისტს შეუძლია დაგეხმაროთ შეადაროთ სარგებელი, რისკები, უკუჩვენებები და შესაძლო გვერდითი მოვლენები.',
    summaryTitle: 'მთავარი',
    summarySubtitle: 'ძირითადი საკითხები გასახსენებლად',
    summaryRow1: 'ჰორმონული მეთოდები იყენებს ჰორმონების განსხვავებულ კომბინაციებს და გამოყენების განსხვავებულ გრაფიკებს.',
    summaryRow2: 'აბი, პლასტირი და რგოლი მუდმივ ჩართულობას მოითხოვს, იმპლანტი და ჰორმონული სპირალი კი გრძელვადიანი მეთოდებია.',
    summaryRow3: 'არჩევანი უნდა ერგებოდეს თქვენს ყოველდღიურობას, პრეფერენციებს, ამტანობასა და გეგმებს.',
    summaryRow4: 'არცერთი მეთოდი არ არის უნივერსალურად „საუკეთესო“ — მთავარია, რომ ის თქვენს საჭიროებებსა და სიტუაციას შეესაბამებოდეს.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'ჯანდაცვის სპეციალისტთან მეთოდების შედარებისთვის დროის დათმობა გეხმარებათ აირჩიოთ კონტრაცეფცია, რომელსაც მშვიდად და რეგულარულად გამოიყენებთ.',
    shareMessage: 'ჰორმონული კონტრაცეპტიული მკურნალობის მიმოხილვა — AWA',
  },
  hy: {
    badge: 'ՀՈՐՄՈՆԱԼ ԲՈՒԺՈՒՄՆԵՐ',
    title: 'Հորմոնալ հակաբեղմնավորիչ բուժումների ակնարկ',
    metaDuration: '7 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Հաբ, պլաստր, օղակ, իմպլանտ, հորմոնալ սպիրալ. ինչն է դրանք տարբերում և ինչպես մտածել ձեր առօրյային ամենահարմար մեթոդի մասին:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ընդհանուր գործողության մեխանիզմ',
      'Տարբեր մեթոդները',
      'Ինչպես ուղղորդել ձեր ընտրությունը',
      'Հիմնական եզրակացություններ',
    ],
    body1: 'Հորմոնալ մեթոդները օգտագործում են հորմոններ հղիությունը կանխելու համար: Կախված մեթոդից՝ դրանք կարող են հիմնականում կանխել ձվազատումը, թանձրացնել արգանդի վզիկի լորձը և փոխել արգանդի միջավայրը:',
    diagramTitle: 'Ինչպե՞ս է աշխատում հորմոնալ հակաբեղմնավորումը',
    diagramSubtitle: 'Պաշտպանությանը կարող են նպաստել մի քանի մեխանիզմներ:',
    step1Title: 'Ձվազատում',
    step1Text: 'Որոշ մեթոդներ կանխում կամ արգելակում են ձվաբջջի ազատումը:',
    step2Title: 'Արգանդի վզիկի լորձ',
    step2Text: 'Լորձը կարող է դառնալ ավելի թանձր, ինչը դժվարացնում է սպերմատոզոիդների անցումը:',
    step3Title: 'Հակաբեղմնավորիչ պաշտպանություն',
    step3Text: 'Այս մեխանիզմների համադրումը օգնում է նվազեցնել հղիության վտանգը:',
    body2: 'Բոլոր մեթոդները չեն պահանջում ներգրավվածության նույն մակարդակը: Հիմնական տարբերությունն այն է, թե որքան հաճախ է պետք մտածել ձեր հակաբեղմնավորման մասին:',
    comparisonTitle: 'Մեթոդների համեմատություն',
    comparisonSubtitle: 'Օրական գործողությունից մինչև երկարաժամկետ պաշտպանություն',
    scaleDaily: 'Օրական',
    scaleWeekly: 'Շաբաթական',
    scaleLongTerm: 'Երկարաժամկետ',
    methods: [
      {
        title: 'Հաբ',
        frequency: 'Ամեն օր',
        duration: 'Ընդունվում է կանոնավոր',
        profile: 'Իդեալական է, եթե ցանկանում եք ինքներդ կառավարել ձեր հակաբեղմնավորումը',
      },
      {
        title: 'Պլաստր',
        frequency: 'Ամեն շաբաթ',
        duration: '4 շաբաթից 3-ը',
        profile: 'Հարմար է, եթե նախընտրում եք խուսափել ամենօրյա ռեժիմից',
      },
      {
        title: 'Հեշտոցային օղակ',
        frequency: 'Յուրաքանչյուր 3 շաբաթը մեկ',
        duration: 'Մեկ շաբաթ դադարով',
        profile: 'Զգուշավոր տարբերակ՝ առօրյայում քիչ գործողություններով',
      },
      {
        title: 'Իմպլանտ',
        frequency: 'Մի քանի տարի',
        duration: 'Առանց ամենօրյա ռեժիմի',
        profile: 'Հարմար է, եթե ցանկանում եք երկարաժամկետ հակաբեղմնավորում',
      },
      {
        title: 'Հորմոնալ սպիրալ',
        frequency: 'Մի քանի տարի',
        duration: 'Տեղադրվում է մասնագետի կողմից',
        profile: 'Երկարաժամկետ լուծում, որը շատ քիչ խնամք է պահանջում',
      },
    ],
    highlightTitle: 'Հիմնականը, որ պետք է հիշել',
    highlightText: 'Որքան քիչ առօրյա գործողություն է պահանջում մեթոդը, այնքան ավելի քիչ հաճախ է պետք մտածել դրա մասին: Սա արժե հաշվի առնել, եթե գիտեք, որ հավանական է մոռանաք դեղաչափը կամ փոփոխությունը:',
    body3: 'Չկա մեկ իդեալական մեթոդ բոլորի համար: Լավագույն ընտրությունը կախված է ձեր առօրյայից, նախասիրություններից, հանդուրժողականությունից և ծրագրերից:',
    criteria: [
      {
        title: 'Ձեր առօրյան',
        text: 'Որոշ մեթոդներ պահանջում են օրական գործողություն, մյուսները գործում են մի քանի շաբաթ կամ տարի:',
      },
      {
        title: 'Ձեր հանդուրժողականությունը',
        text: 'Մեթոդի զգացողությունը կարող է տարբերվել մարդուց մարդ: Առողջապահության մասնագետի հետ խոսելը կարող է օգնել պարզել, թե ինչն է ձեզ հարմար:',
      },
      {
        title: 'Ձեր ծրագրերը',
        text: 'Եթե շուտով կամ ավելի ուշ հղիություն եք ակնկալում, մեթոդի տևողությունը և շրջելիությունը կարող են օգնել ուղղորդել ձեր ընտրությունը:',
      },
      {
        title: 'Ձեր առաջնահերթությունները',
        text: 'Զգուշավորություն, պարզություն, ամենօրյա ռեժիմի բացակայություն կամ երկարատև պաշտպանություն. ձեր առաջնահերթությունները կարևոր են այս որոշման մեջ:',
      },
    ],
    choiceDiagramTitle: 'Արագ հարց՝ որոշելուն օգնելու համար',
    questionText: '«Նախընտրու՞մ եմ մտածել իմ հակաբեղմնավորման մասին ամեն օր, ամեն շաբաթ, թե տարեկան միայն մի քանի անգամ»:',
    choiceOption1Title: 'Հաճախ',
    choiceOption1Text: 'Հաբ կամ կանոնավոր ուշադրություն պահանջող մեթոդ',
    choiceOption2Title: 'Ավելի հազվադեպ',
    choiceOption2Text: 'Պլաստր կամ օղակ՝ կախված ձեր ընտրած ռիթմից',
    choiceOption3Title: 'Շատ հազվադեպ',
    choiceOption3Text: 'Իմպլանտ կամ երկարաժամկետ հորմոնալ սպիրալ',
    alertTitle: 'Հարկ է նշել',
    alertText: 'Հորմոնալ հակաբեղմնավորիչ ընտրելիս պետք է հաշվի առնել ձեր անձնական և բժշկական իրավիճակը: Առողջապահության մասնագետը կարող է օգնել համեմատել օգուտները, վտանգները, հակացուցումները և հնարավոր կողմնակի ազդեցությունները:',
    summaryTitle: 'Էականը',
    summarySubtitle: 'Հիմնական կետերը, որոնք պետք է հիշել',
    summaryRow1: 'Հորմոնալ մեթոդները օգտագործում են հորմոնների տարբեր համադրություններ և օգտագործման տարբեր ժամանակացույցեր:',
    summaryRow2: 'Հաբը, պլաստրը և օղակը պահանջում են շարունակական ներգրավվածություն, մինչդեռ իմպլանտը և հորմոնալ սպիրալը երկարաժամկետ մեթոդներ են:',
    summaryRow3: 'Ընտրությունը պետք է համապատասխանի ձեր առօրյային, նախասիրություններին, հանդուրժողականությանը և ծրագրերին:',
    summaryRow4: 'Ոչ մի մեթոդ համընդհանուր առումով «լավագույնը» չէ. այն հիմնականում պետք է համատեղելի լինի ձեր կարիքների և իրավիճակի հետ:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Առողջապահության մասնագետի հետ մեթոդները համեմատելու համար ժամանակ տրամադրելը օգնում է ընտրել հակաբեղմնավորում, որը կարող եք օգտագործել հանգիստ և կանոնավոր:',
    shareMessage: 'Հորմոնալ հակաբեղմնավորիչ բուժումների ակնարկ — AWA',
  },
  tg: {
    badge: 'ТАБОБАТҲОИ ГОРМОНӢ',
    title: 'Шарҳи табобатҳои гормонии пешгирӣ аз ҳомиладорӣ',
    metaDuration: '7 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Ҳаб, пластир, ҳалқа, имплант, спирали гормонӣ: чӣ онҳоро фарқ мекунад ва чӣ тавр дар бораи усуле фикр кардан лозим аст, ки беҳтар ба ҳаёти ҳаррӯзаи шумо мувофиқ аст.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Механизми муштараки амал',
      'Усулҳои гуногун',
      'Чӣ тавр интихобро роҳнамоӣ кардан',
      'Хулосаҳои асосӣ',
    ],
    body1: 'Усулҳои гормонӣ барои пешгирии ҳомиладорӣ гормонҳоро истифода мебаранд. Вобаста ба усул, онҳо асосан метавонанд аз овуляция пешгирӣ кунанд, шилимшиқи гардани бачадонро ғализ кунанд ва муҳити бачадонро тағйир диҳанд.',
    diagramTitle: 'Пешгирии гормонӣ чӣ тавр кор мекунад?',
    diagramSubtitle: 'Якчанд механизм метавонад ба муҳофизат мусоидат кунад.',
    step1Title: 'Овуляция',
    step1Text: 'Баъзе усулҳо аз озод шудани тухмсел пешгирӣ ё онро боз медоранд.',
    step2Title: 'Шилимшиқи гардани бачадон',
    step2Text: 'Шилимшиқ метавонад ғализтар шавад, ки гузаштани сперматозоидҳоро душвортар мекунад.',
    step3Title: 'Муҳофизати пешгирикунанда',
    step3Text: 'Омезиши ин механизмҳо ба кам кардани хатари ҳомиладорӣ мусоидат мекунад.',
    body2: 'На ҳамаи усулҳо сатҳи якхелаи иштирокро талаб мекунанд. Фарқияти асосӣ ин аст, ки то чӣ андоза бояд дар бораи пешгирии худ фикр кунед.',
    comparisonTitle: 'Муқоисаи усулҳо',
    comparisonSubtitle: 'Аз амали рӯзона то муҳофизати дарозмуддат',
    scaleDaily: 'Рӯзона',
    scaleWeekly: 'Ҳафтагӣ',
    scaleLongTerm: 'Дарозмуддат',
    methods: [
      {
        title: 'Ҳаб',
        frequency: 'Ҳар рӯз',
        duration: 'Мунтазам қабул карда мешавад',
        profile: 'Идеал аст, агар мехоҳед пешгирии худро худатон идора кунед',
      },
      {
        title: 'Пластир',
        frequency: 'Ҳар ҳафта',
        duration: '3 ҳафта аз 4',
        profile: 'Роҳат аст, агар афзал донед аз тартиби рӯзона дурӣ ҷӯед',
      },
      {
        title: 'Ҳалқаи маҳбалӣ',
        frequency: 'Ҳар 3 ҳафта',
        duration: 'Бо танаффуси як ҳафта',
        profile: 'Имконияти пинҳонӣ бо амалҳои кам дар ҳаёти ҳаррӯза',
      },
      {
        title: 'Имплант',
        frequency: 'Якчанд сол',
        duration: 'Бе тартиби рӯзона',
        profile: 'Мувофиқ аст, агар пешгирии дарозмуддат хоҳед',
      },
      {
        title: 'Спирали гормонӣ',
        frequency: 'Якчанд сол',
        duration: 'Аз ҷониби мутахассис гузошта мешавад',
        profile: 'Роҳи дарозмуддат, ки нигоҳубини хеле кам талаб мекунад',
      },
    ],
    highlightTitle: 'Муҳимтарин чизи ба ёд мондан',
    highlightText: 'Ҳар қадар усул амалҳои ҳаррӯзаи камтар талаб кунад, ҳамон қадар камтар дар бораи он фикр кардан лозим меояд. Ин метавонад сазовори баррасӣ бошад, агар медонед, ки миқдор ё ивазро фаромӯш мекунед.',
    body3: 'Як усули идеалӣ барои ҳама вуҷуд надорад. Интихоби беҳтарин ба зиндагии ҳаррӯза, афзалиятҳо, таҳаммул ва нақшаҳои шумо вобаста аст.',
    criteria: [
      {
        title: 'Зиндагии ҳаррӯзаи шумо',
        text: 'Баъзе усулҳо амали рӯзонаро талаб мекунанд, дигарон якчанд ҳафта ё сол кор мекунанд.',
      },
      {
        title: 'Таҳаммули шумо',
        text: 'Эҳсоси усул аз шахс ба шахс фарқ карда метавонад. Сӯҳбат бо мутахассиси соҳаи тиб метавонад кумак кунад муайян кунед, ки чӣ ба шумо мувофиқ аст.',
      },
      {
        title: 'Нақшаҳои шумо',
        text: 'Агар ба ҳомиладорӣ ба зудӣ ё баъдтар умед доред, давомнокӣ ва баргардонидашавии усул метавонад интихобро роҳнамоӣ кунад.',
      },
      {
        title: 'Афзалиятҳои шумо',
        text: 'Пинҳонӣ, содагӣ, надоштани тартиби рӯзона ё муҳофизати дарозмуддат: афзалиятҳои шумо дар ин қарор муҳиманд.',
      },
    ],
    choiceDiagramTitle: 'Саволи зуд барои кумак ба қарор',
    questionText: '«Оё афзал медонам дар бораи пешгирии худ ҳар рӯз, ҳар ҳафта ё танҳо чанд маротиба дар сол фикр кунам?»',
    choiceOption1Title: 'Зуд-зуд',
    choiceOption1Text: 'Ҳаб ё усуле, ки таваҷҷӯҳи мунтазамро талаб мекунад',
    choiceOption2Title: 'Камтар',
    choiceOption2Text: 'Пластир ё ҳалқа, вобаста ба суръате, ки интихоб мекунед',
    choiceOption3Title: 'Хеле кам',
    choiceOption3Text: 'Имплант ё спирали гормонии дарозмуддат',
    alertTitle: 'Қобили қайд',
    alertText: 'Интихоби пешгирии гормонӣ бояд вазъияти шахсӣ ва тиббии шуморо ба назар гирад. Мутахассиси соҳаи тиб метавонад кумак кунад афзалиятҳо, хатарҳо, муқобилнишондодҳо ва таъсироти манфии эҳтимолиро муқоиса кунед.',
    summaryTitle: 'Муҳимтарин чизҳо',
    summarySubtitle: 'Нуктаҳои асосӣ барои ба ёд мондан',
    summaryRow1: 'Усулҳои гормонӣ омезишҳои гуногуни гормонҳо ва ҷадвалҳои гуногуни истифодаро истифода мебаранд.',
    summaryRow2: 'Ҳаб, пластир ва ҳалқа иштироки доимиро талаб мекунанд, дар ҳоле ки имплант ва спирали гормонӣ усулҳои дарозмуддатанд.',
    summaryRow3: 'Интихоб бояд ба зиндагии ҳаррӯза, афзалиятҳо, таҳаммул ва нақшаҳои шумо мувофиқ бошад.',
    summaryRow4: 'Ягон усул ба таври умумӣ «беҳтарин» нест — он асосан бояд ба эҳтиёҷот ва вазъияти шумо мувофиқ бошад.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Вақт ҷудо кардан барои муқоисаи усулҳо бо мутахассиси соҳаи тиб ба шумо кумак мекунад пешгириеро интихоб кунед, ки оромона ва мунтазам истифода бурда метавонед.',
    shareMessage: 'Шарҳи табобатҳои гормонии пешгирӣ аз ҳомиладорӣ — AWA',
  },
  ky: {
    badge: 'ГОРМОНДУК ДАРЫЛООЛОР',
    title: 'Гормондук контрацептивдик дарылоолорго сереп',
    metaDuration: '7 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Таблетка, пластырь, шакекче, имплант, гормондук спираль: аларды эмне айырмалайт жана күнүмдүк жашооңузга эң ылайыктуу ыкма жөнүндө кантип ойлонуу керек.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Жалпы таасир механизми',
      'Ар кандай ыкмалар',
      'Тандоого кантип багыт берүү керек',
      'Негизги жыйынтыктар',
    ],
    body1: 'Гормондук ыкмалар курсактуулуктун алдын алуу үчүн гормондорду колдонот. Ыкмага жараша алар негизинен овуляцияны болтурбай, жатын моюнчасынын былжырын коюулантып жана жатындын чөйрөсүн өзгөртө алат.',
    diagramTitle: 'Гормондук контрацепция кантип иштейт?',
    diagramSubtitle: 'Коргоого бир нече механизм салым кошушу мүмкүн.',
    step1Title: 'Овуляция',
    step1Text: 'Айрым ыкмалар жумурткалуу клетканын чыгышына жол бербейт же аны басат.',
    step2Title: 'Жатын моюнчасынын былжыры',
    step2Text: 'Былжыр коюулашы мүмкүн, бул сперманын өтүшүн кыйындатат.',
    step3Title: 'Контрацептивдик коргоо',
    step3Text: 'Бул механизмдердин айкалышы курсактуулук коркунучун азайтууга жардам берет.',
    body2: 'Бардык ыкмалар бирдей катышууну талап кылбайт. Негизги айырма — контрацепцияңыз жөнүндө канчалык жыш ойлонуу керек.',
    comparisonTitle: 'Ыкмаларды салыштыруу',
    comparisonSubtitle: 'Күнүмдүк аракеттен узак мөөнөттүү коргоого чейин',
    scaleDaily: 'Күнүмдүк',
    scaleWeekly: 'Жумалык',
    scaleLongTerm: 'Узак мөөнөттүү',
    methods: [
      {
        title: 'Таблетка',
        frequency: 'Күн сайын',
        duration: 'Үзгүлтүксүз кабыл алынат',
        profile: 'Контрацепцияңызды өзүңүз башкаргыңыз келсе, идеалдуу',
      },
      {
        title: 'Пластырь',
        frequency: 'Жума сайын',
        duration: '4 жуманын 3ү',
        profile: 'Күнүмдүк тартиптен качкыңыз келсе, ыңгайлуу',
      },
      {
        title: 'Кынап шакекчеси',
        frequency: 'Ар 3 жумада',
        duration: 'Бир жумалык тыныгуу менен',
        profile: 'Күнүмдүк аракет аз талап кылынган купуя вариант',
      },
      {
        title: 'Имплант',
        frequency: 'Бир нече жыл',
        duration: 'Күнүмдүк тартип жок',
        profile: 'Узак мөөнөттүү контрацепцияны каалаганыңызда ылайыктуу',
      },
      {
        title: 'Гормондук спираль',
        frequency: 'Бир нече жыл',
        duration: 'Адис тарабынан коюлат',
        profile: 'Абдан аз кам көрүүнү талап кылган узак мөөнөттүү чечим',
      },
    ],
    highlightTitle: 'Эң маанилүүсү',
    highlightText: 'Ыкма күнүмдүк аракетти канчалык аз талап кылса, ал жөнүндө ошончолук сейрек ойлонууга туура келет. Дозаны же алмаштырууну унутуп калышыңыз мүмкүн экенин билсеңиз, бул эске алууга татыйт.',
    body3: 'Баарына ылайыктуу бирден-бир идеалдуу ыкма жок. Эң жакшы тандоо күнүмдүк жашооңузга, тандооңузга, чыдамдуулугуңузга жана пландарыңызга көз каранды.',
    criteria: [
      {
        title: 'Күнүмдүк жашооңуз',
        text: 'Айрым ыкмалар күнүмдүк аракетти талап кылат, башкалары бир нече жума же жыл иштейт.',
      },
      {
        title: 'Чыдамдуулугуңуз',
        text: 'Ыкманын сезилиши адамдан адамга айырмаланышы мүмкүн. Ден соолук сактоо адиси менен сүйлөшүү сизге эмне ылайыктуу экенин аныктоого жардам берет.',
      },
      {
        title: 'Пландарыңыз',
        text: 'Жакында же кийинчерээк курсактуулукту үмүттөнүп жатсаңыз, ыкманын узактыгы жана кайтарымдуулугу тандооңузга багыт берүүгө жардам берет.',
      },
      {
        title: 'Артыкчылыктарыңыз',
        text: 'Купуялык, жөнөкөйлүк, күнүмдүк тартиптин жоктугу же узак мөөнөттүү коргоо: артыкчылыктарыңыз бул чечимде маанилүү.',
      },
    ],
    choiceDiagramTitle: 'Чечим кабыл алууга жардам берген кыска суроо',
    questionText: '«Контрацепциям жөнүндө күн сайын, жума сайын же жылына бир нече жолу гана ойлонгум келеби?»',
    choiceOption1Title: 'Көп',
    choiceOption1Text: 'Таблетка же үзгүлтүксүз көңүл бурууну талап кылган ыкма',
    choiceOption2Title: 'Азыраак',
    choiceOption2Text: 'Тандаган ритмиңизге жараша пластырь же шакекче',
    choiceOption3Title: 'Абдан сейрек',
    choiceOption3Text: 'Имплант же узак мөөнөттүү гормондук спираль',
    alertTitle: 'Эске алууга татыктуу',
    alertText: 'Гормондук контрацептивди тандоодо жеке жана медициналык абалыңыз эске алынышы керек. Ден соолук сактоо адиси ар бир ыкманын артыкчылыктарын, коркунучтарын, каршы көрсөтмөлөрүн жана мүмкүн болгон терс таасирлерин салыштырууга жардам бере алат.',
    summaryTitle: 'Эң негизгиси',
    summarySubtitle: 'Эсте тутууга тийиш болгон негизги учурлар',
    summaryRow1: 'Гормондук ыкмалар ар кандай гормон айкалыштарын жана ар кандай колдонуу графиктерин колдонот.',
    summaryRow2: 'Таблетка, пластырь жана шакекче үзгүлтүксүз катышууну талап кылат, ал эми имплант жана гормондук спираль узак мөөнөттүү ыкмалар.',
    summaryRow3: 'Тандоо күнүмдүк жашооңузга, тандооңузга, чыдамдуулугуңузга жана пландарыңызга шайкеш келиши керек.',
    summaryRow4: 'Эч бир ыкма универсалдуу түрдө «эң жакшы» эмес — ал негизинен муктаждыктарыңызга жана абалыңызга шайкеш болушу керек.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Ыкмаларды ден соолук сактоо адиси менен салыштырууга убакыт бөлүү тынч жана үзгүлтүксүз колдоно ала турган контрацепцияны тандоого жардам берет.',
    shareMessage: 'Гормондук контрацептивдик дарылоолорго сереп — AWA',
  },
  tk: {
    badge: 'GORMONAL BEJERGILER',
    title: 'Gormonal göwrelilikden goraýjy bejergileriň syny',
    metaDuration: '7 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Tabletka, plastyr, halka, implant, gormonal içki ulag: olary nämäniň tapawutlandyrýandygy we gündelik durmuşyňyza iň laýyk usul barada nähili pikir etmeli.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Umumy täsir mehanizmi',
      'Dürli usullar',
      'Saýlawy nähili ugrukdyrmaly',
      'Esasy netijeler',
    ],
    body1: 'Gormonal usullar göwrelilikden goranmak üçin gormonlary ulanýar. Usula baglylykda, olar esasan ovulýasiýanyň öňüni alyp, ýatgy boýnunyň ýaňsyny galyňlaşdyryp we ýatgy gurşawyny üýtgedip biler.',
    diagramTitle: 'Gormonal göwrelilikden goranyş nähili işleýär?',
    diagramSubtitle: 'Goranyşa birnäçe mehanizm goşant goşup biler.',
    step1Title: 'Ovulýasiýa',
    step1Text: 'Käbir usullar ýumurtganyň çykmagynyň öňüni alýar ýa-da ony saklaýar.',
    step2Title: 'Ýatgy boýnunyň ýaňsy',
    step2Text: 'Ýaňs galyňlaşyp biler, bu spermanyň geçmegini kynlaşdyrýar.',
    step3Title: 'Göwrelilikden goranyş',
    step3Text: 'Bu mehanizmleriň utgaşmagy göwrelilik howpuny azaltmaga kömek edýär.',
    body2: 'Ähli usullar bir derejede gatnaşmagy talap etmeýär. Esasy tapawut göwrelilikden goranyş hakda näçe ýygy pikir etmelidigiňizde.',
    comparisonTitle: 'Usullary deňeşdirmek',
    comparisonSubtitle: 'Gündelik hereketden uzak möhletli goranyşa çenli',
    scaleDaily: 'Gündelik',
    scaleWeekly: 'Hepdelik',
    scaleLongTerm: 'Uzak möhletli',
    methods: [
      {
        title: 'Tabletka',
        frequency: 'Her gün',
        duration: 'Yzygiderli kabul edilýär',
        profile: 'Göwrelilikden goranyşy özbaşyňyza dolandyrmak isleseňiz ideal',
      },
      {
        title: 'Plastyr',
        frequency: 'Her hepde',
        duration: '4 hepdäniň 3-si',
        profile: 'Gündelik tertipden gaça durmak isleseňiz amatly',
      },
      {
        title: 'Jynsy ýol halkasy',
        frequency: 'Her 3 hepde',
        duration: 'Bir hepdelik aralyk bilen',
        profile: 'Gündelik az hereketli, ýaşyryn wariant',
      },
      {
        title: 'Implant',
        frequency: 'Birnäçe ýyl',
        duration: 'Gündelik tertip ýok',
        profile: 'Uzak möhletli göwrelilikden goranyş isleseňiz laýyk',
      },
      {
        title: 'Gormonal içki ulag',
        frequency: 'Birnäçe ýyl',
        duration: 'Hünärmen tarapyndan ýerleşdirilýär',
        profile: 'Çok az bejergi talap edýän uzak möhletli çözgüt',
      },
    ],
    highlightTitle: 'Ýatda saklamaly esasy zat',
    highlightText: 'Usul näçe az gündelik hereket talap etse, ol hakda şonça-da seýrek pikir etmeli bolýarsyňyz. Dozany ýa-da çalşygy ýatdan çykarmak ähtimallygyňyz bar bolsa, muny hasaba almak peýdaly.',
    body3: 'Hemmeler üçin ýeke-täk ideal usul ýok. Iň gowy saýlaw gündelik durmuşyňyza, isleglerigize, çydamlylygyňyza we meýilnamalaryňyza bagly.',
    criteria: [
      {
        title: 'Gündelik durmuşyňyz',
        text: 'Käbir usullar gündelik hereketi talap edýär, beýlekileri birnäçe hepde ýa-da ýyl dowam edýär.',
      },
      {
        title: 'Çydamlylygyňyz',
        text: 'Usulyň nähili duýulýandygy adamdan adama tapawutlanyp biler. Saglyk hünärmeni bilen gürleşmek size näme laýykdygyny kesgitlemäge kömek edip biler.',
      },
      {
        title: 'Meýilnamalaryňyz',
        text: 'Golaýda ýa-da soňrak göwreli bolmagy umyt edýän bolsaňyz, usulyň dowamlylygy we yzyna gaýdyp bilijiligi saýlawy ugrukdyrmaga kömek edip biler.',
      },
      {
        title: 'Ileri tutýan zatlaryňyz',
        text: 'Ýaşyrynlyk, ýönekeýlik, gündelik tertipsizlik ýa-da uzak dowam edýän goranyş: bu karar çykarylanda ileri tutýan zatlaryňyz möhüm.',
      },
    ],
    choiceDiagramTitle: 'Karar bermäge kömek edýän çalt sorag',
    questionText: '«Göwrelilikden goranyş hakda her gün, her hepde ýa-da ýylda diňe birnäçe gezek pikir etmegi makul görerinmi?»',
    choiceOption1Title: 'Ýygy',
    choiceOption1Text: 'Tabletka ýa-da yzygiderli üns talap edýän usul',
    choiceOption2Title: 'Seýrek',
    choiceOption2Text: 'Saýlan ritmiňize görä plastyr ýa-da halka',
    choiceOption3Title: 'Gaty seýrek',
    choiceOption3Text: 'Implant ýa-da uzak möhletli gormonal içki ulag',
    alertTitle: 'Bellemäge mynasyp',
    alertText: 'Gormonal göwrelilikden goraýjy usulyny saýlamak şahsy we lukmançylyk ýagdaýyňyzy hasaba almaly. Saglyk hünärmeni artykmaçlyklary, howplary, garşy görkezmeleri we mümkin gaýry täsirleri deňeşdirmäge kömek edip biler.',
    summaryTitle: 'Esasy zatlar',
    summarySubtitle: 'Ýatda saklamaly esasy nokatlar',
    summaryRow1: 'Gormonal usullar dürli gormon utgaşmalaryny we dürli ulanyş tertiplerini ulanýar.',
    summaryRow2: 'Tabletka, plastyr we halka yzygiderli gatnaşmagy talap edýär, implant we gormonal içki ulag bolsa uzak möhletli usullar.',
    summaryRow3: 'Saýlaw gündelik durmuşyňyza, isleglerigize, çydamlylygyňyza we meýilnamalaryňyza laýyk gelmeli.',
    summaryRow4: 'Hiç bir usul umumy «iň gowusy» däl — ol esasan zerurlyklaryňyza we ýagdaýyňyza gabat gelmeli.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Usullary saglyk hünärmeni bilen deňeşdirmäge wagt bölmek asudalyk bilen we yzygiderli ulanyp boljak göwrelilikden goranyşy saýlamaga kömek edýär.',
    shareMessage: 'Gormonal göwrelilikden goraýjy bejergileriň syny — AWA',
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
