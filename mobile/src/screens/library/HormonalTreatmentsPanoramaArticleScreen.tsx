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
const CONTENT = {
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
} as const;

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
