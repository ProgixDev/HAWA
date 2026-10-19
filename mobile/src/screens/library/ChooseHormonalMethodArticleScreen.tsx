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

const ID = 'hormonaltreatments-choisir-sa-methode';

const HERO = require('../../assets/images/library/featured-spm.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const PRIORITY_ICONS = [
  'calendar-check-outline',
  'heart-pulse',
  'baby-face-outline',
  'shield-check-outline',
] as const;

const COMPARISON_ICONS = [
  'pill',
  'bandage',
  'circle-outline',
  'needle',
  'shape-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'CHOISIR SA MÉTHODE',
    title: 'Choisir le traitement\nqui te convient',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro: 'Les bonnes questions à te poser pour trouver une méthode contraceptive adaptée à ton quotidien, à tes besoins et à tes projets.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Les questions à te poser',
      'Aucune méthode « meilleure » dans l’absolu',
      'Les critères qui peuvent faire la différence',
      'En parler avec un professionnel',
      'À retenir',
    ],
    section1Body: 'Il n’existe pas une contraception idéale pour tout le monde. Avant de choisir une méthode, il peut être utile de réfléchir à tes habitudes, tes préférences, ta tolérance et tes projets.',
    questions: [
      'Comment mon corps réagit-il aux hormones ?',
      'Ai-je besoin d’un geste quotidien, hebdomadaire, ou d’une solution longue durée ?',
      'Ai-je un projet de grossesse à moyen terme ?',
      'Quel est mon budget et l’accès à ce moyen de contraception ?',
    ],
    section2Body: 'Deux personnes peuvent choisir des méthodes différentes et avoir toutes les deux fait un choix parfaitement adapté à leur situation. Le bon choix dépend notamment de la façon dont tu souhaites utiliser ta contraception et de ce que tu recherches.',
    highlightTitle: 'Le bon repère',
    highlightText: 'Une méthode intéressante sur le papier n’est pas forcément celle qui sera la plus simple ou la plus confortable pour toi au quotidien.',
    section3Body: 'Pour comparer plusieurs options, tu peux regarder différents critères. L’objectif n’est pas de tout connaître par cœur, mais d’identifier ce qui compte réellement pour toi.',
    priorities: [
      {title: 'Simplicité', text: 'Certaines méthodes demandent une action quotidienne, alors que d’autres nécessitent seulement une attention hebdomadaire ou beaucoup plus espacée.'},
      {title: 'Tolérance', text: 'Les effets ressentis peuvent varier d’une personne à l’autre. Il est important d’observer comment ton corps réagit et d’en parler si quelque chose te gêne.'},
      {title: 'Projet de grossesse', text: 'Si tu souhaites une grossesse prochainement, la durée d’utilisation et le retour de la fertilité après l’arrêt peuvent faire partie des éléments à discuter.'},
      {title: 'Efficacité', text: 'L’efficacité dépend non seulement de la méthode choisie, mais aussi de son utilisation correcte et régulière.'},
    ],
    rhythmTitle: 'Le rythme d’utilisation',
    rhythmBody: 'Une différence importante entre les méthodes concerne la fréquence à laquelle tu dois penser à ta contraception.',
    comparison: [
      {title: 'Pilule', detail: 'Geste quotidien'},
      {title: 'Patch', detail: 'Changement hebdomadaire'},
      {title: 'Anneau', detail: 'Cycle de plusieurs semaines'},
      {title: 'Implant', detail: 'Solution longue durée'},
      {title: 'Stérilet hormonal', detail: 'Solution longue durée'},
    ],
    bodyReactionTitle: 'Observer la réaction de ton corps',
    bodyReactionText: 'Une méthode hormonale peut être ressentie différemment selon les personnes. Certaines remarquent des changements du cycle, des saignements ou d’autres effets indésirables. Ces réactions ne signifient pas automatiquement que la méthode ne convient pas, mais elles méritent d’être prises en compte.',
    alertTitle: 'À surveiller',
    alertText: 'Si un effet est important, persistant ou inhabituel, ne reste pas seule avec tes questions. Un médecin, une sage-femme ou un autre professionnel de santé peut t’aider à déterminer s’il faut poursuivre, adapter ou changer la méthode.',
    projectsTitle: 'Tenir compte de tes projets',
    projectsBody: 'Ton projet de grossesse peut également influencer le choix. Si tu souhaites éviter une grossesse pendant plusieurs années, une méthode longue durée peut être intéressante. Si tu envisages une grossesse plus prochainement, d’autres options peuvent davantage correspondre à ton calendrier.',
    keepInMindTitle: 'À garder en tête',
    keepInMindText: 'Parler de ton projet de grossesse, même s’il est encore lointain ou incertain, permet au professionnel de santé de mieux orienter la discussion.',
    section4Body: 'Un rendez-vous permet de mettre en balance les avantages, les contraintes et les éventuelles contre-indications de chaque méthode. Tu peux préparer quelques questions avant la consultation afin de ne pas oublier les points importants.',
    questionCardTitle: 'Questions utiles à poser',
    professionalQuestions: [
      'Quels sont les avantages de cette méthode pour moi ?',
      'Quels effets indésirables puis-je rencontrer ?',
      'Comment l’utiliser correctement ?',
      'Que faire si j’oublie, si elle se déplace ou si je souhaite l’arrêter ?',
      'Cette méthode correspond-elle à mon projet de grossesse ?',
    ],
    professionalTipTitle: 'Bon à savoir',
    professionalTipText: 'Une sage-femme ou un médecin peut prendre en compte tes antécédents, tes traitements, tes préférences et ton mode de vie avant de te conseiller une méthode.',
    summaryTitle: 'L’essentiel',
    summaryItems: [
      'Choisis une méthode compatible avec ton quotidien.',
      'Tiens compte de ta tolérance et de tes préférences.',
      'Pense à ton projet de grossesse et à ton horizon de temps.',
      'Demande conseil à un professionnel en cas de doute.',
    ],
    finalTipTitle: 'À retenir',
    finalTipText: 'La meilleure méthode n’est pas nécessairement celle qui semble la plus pratique ou la plus populaire. C’est celle qui correspond à ta situation, à tes besoins et à tes préférences, après une discussion éclairée avec un professionnel de santé.',
    disclaimerText: 'Cet article a une vocation informative et ne remplace pas un avis médical personnalisé.',
    shareMessage: 'Choisir le traitement qui te convient — AWA',
  },
  en: {
    badge: 'CHOOSING YOUR METHOD',
    title: 'Choosing the treatment\nthat suits you',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro: 'The right questions to ask yourself to find a contraceptive method suited to your daily life, your needs, and your plans.',
    contentsTitle: 'In this article',
    topics: [
      'Questions to ask yourself',
      'No method is “best” in absolute terms',
      'Criteria that can make a difference',
      'Talking it over with a professional',
      'Key takeaways',
    ],
    section1Body: 'There is no single ideal contraceptive method for everyone. Before choosing a method, it can help to think about your habits, preferences, tolerance, and plans.',
    questions: [
      'How does my body react to hormones?',
      'Do I need a daily or weekly action, or a long-acting solution?',
      'Do I have a medium-term pregnancy plan?',
      'What is my budget, and how accessible is this contraceptive method?',
    ],
    section2Body: 'Two people can choose different methods and both have made a choice that is perfectly suited to their situation. The right choice depends in particular on how you want to use your contraception and on what you’re looking for.',
    highlightTitle: 'The key thing to remember',
    highlightText: 'A method that looks appealing on paper isn’t necessarily the one that will be simplest or most comfortable for you day to day.',
    section3Body: 'To compare several options, you can look at different criteria. The goal isn’t to know everything by heart, but to identify what really matters to you.',
    priorities: [
      {title: 'Simplicity', text: 'Some methods require a daily action, while others only need weekly attention, or far less often.'},
      {title: 'Tolerance', text: 'The effects you feel can vary from person to person. It’s important to notice how your body reacts and to talk about it if something bothers you.'},
      {title: 'Pregnancy plans', text: 'If you’re hoping for a pregnancy soon, the length of use and the return of fertility after stopping can be part of what you discuss.'},
      {title: 'Effectiveness', text: 'Effectiveness depends not only on the method chosen, but also on using it correctly and consistently.'},
    ],
    rhythmTitle: 'How often you need to use it',
    rhythmBody: 'One important difference between methods is how often you need to think about your contraception.',
    comparison: [
      {title: 'Pill', detail: 'Daily action'},
      {title: 'Patch', detail: 'Weekly change'},
      {title: 'Ring', detail: 'Cycle of several weeks'},
      {title: 'Implant', detail: 'Long-acting solution'},
      {title: 'Hormonal IUD', detail: 'Long-acting solution'},
    ],
    bodyReactionTitle: 'Watching how your body reacts',
    bodyReactionText: 'A hormonal method can feel different from one person to another. Some notice changes in their cycle, bleeding, or other side effects. These reactions don’t automatically mean the method isn’t right for you, but they’re worth paying attention to.',
    alertTitle: 'Worth watching for',
    alertText: 'If an effect is significant, persistent, or unusual, don’t stay alone with your questions. A doctor, midwife, or another healthcare professional can help you determine whether to continue, adjust, or change the method.',
    projectsTitle: 'Taking your plans into account',
    projectsBody: 'Your pregnancy plans can also influence your choice. If you want to avoid pregnancy for several years, a long-acting method may be worth considering. If you’re thinking about a pregnancy sooner, other options may fit your timeline better.',
    keepInMindTitle: 'Worth keeping in mind',
    keepInMindText: 'Talking about your pregnancy plans, even if they’re still distant or uncertain, helps the healthcare professional better guide the discussion.',
    section4Body: 'An appointment lets you weigh the benefits, constraints, and possible contraindications of each method. You can prepare a few questions beforehand so you don’t forget anything important.',
    questionCardTitle: 'Useful questions to ask',
    professionalQuestions: [
      'What are the benefits of this method for me?',
      'What side effects might I experience?',
      'How do I use it correctly?',
      'What should I do if I forget it, if it shifts out of place, or if I want to stop it?',
      'Does this method fit with my pregnancy plans?',
    ],
    professionalTipTitle: 'Good to know',
    professionalTipText: 'A midwife or doctor can take your medical history, treatments, preferences, and lifestyle into account before recommending a method.',
    summaryTitle: 'The essentials',
    summaryItems: [
      'Choose a method that fits your daily life.',
      'Take your tolerance and preferences into account.',
      'Think about your pregnancy plans and your timeline.',
      'Ask a professional for advice if you’re unsure.',
    ],
    finalTipTitle: 'Remember',
    finalTipText: 'The best method isn’t necessarily the one that seems most convenient or most popular. It’s the one that fits your situation, your needs, and your preferences, following an informed discussion with a healthcare professional.',
    disclaimerText: 'This article is for informational purposes only and does not replace personalized medical advice.',
    shareMessage: 'Choosing the treatment that suits you — AWA',
  },
  es: {
    badge: 'ELEGIR TU MÉTODO',
    title: 'Elige el tratamiento\nque más te convenga',
    metaDuration: '7 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido validado',
    intro: 'Las preguntas correctas que debes hacerte para encontrar un método anticonceptivo adaptado a tu día a día, a tus necesidades y a tus planes.',
    contentsTitle: 'En este artículo',
    topics: [
      'Las preguntas que debes hacerte',
      'Ningún método es «mejor» en términos absolutos',
      'Los criterios que pueden marcar la diferencia',
      'Hablarlo con un profesional',
      'Lo esencial',
    ],
    section1Body: 'No existe una anticoncepción ideal para todo el mundo. Antes de elegir un método, puede ser útil reflexionar sobre tus hábitos, tus preferencias, tu tolerancia y tus planes.',
    questions: [
      '¿Cómo reacciona mi cuerpo a las hormonas?',
      '¿Necesito un gesto diario, semanal, o una solución de larga duración?',
      '¿Tengo un proyecto de embarazo a medio plazo?',
      '¿Cuál es mi presupuesto y el acceso a este método anticonceptivo?',
    ],
    section2Body: 'Dos personas pueden elegir métodos diferentes y haber hecho ambas una elección perfectamente adaptada a su situación. La elección correcta depende sobre todo de cómo quieres usar tu anticoncepción y de lo que buscas.',
    highlightTitle: 'La referencia clave',
    highlightText: 'Un método interesante sobre el papel no es necesariamente el que te resultará más sencillo o más cómodo en tu día a día.',
    section3Body: 'Para comparar varias opciones, puedes fijarte en distintos criterios. El objetivo no es conocerlo todo de memoria, sino identificar lo que realmente te importa.',
    priorities: [
      {title: 'Sencillez', text: 'Algunos métodos requieren una acción diaria, mientras que otros solo necesitan atención semanal, o mucho más espaciada.'},
      {title: 'Tolerancia', text: 'Los efectos percibidos pueden variar de una persona a otra. Es importante observar cómo reacciona tu cuerpo y hablar de ello si algo te molesta.'},
      {title: 'Proyecto de embarazo', text: 'Si deseas un embarazo próximamente, la duración de uso y el retorno de la fertilidad tras dejarlo pueden formar parte de lo que converses.'},
      {title: 'Eficacia', text: 'La eficacia depende no solo del método elegido, sino también de su uso correcto y regular.'},
    ],
    rhythmTitle: 'El ritmo de uso',
    rhythmBody: 'Una diferencia importante entre los métodos es la frecuencia con la que debes pensar en tu anticoncepción.',
    comparison: [
      {title: 'Píldora', detail: 'Gesto diario'},
      {title: 'Parche', detail: 'Cambio semanal'},
      {title: 'Anillo', detail: 'Ciclo de varias semanas'},
      {title: 'Implante', detail: 'Solución de larga duración'},
      {title: 'DIU hormonal', detail: 'Solución de larga duración'},
    ],
    bodyReactionTitle: 'Observar la reacción de tu cuerpo',
    bodyReactionText: 'Un método hormonal puede sentirse de forma diferente según la persona. Algunas notan cambios en el ciclo, sangrados u otros efectos indeseados. Estas reacciones no significan automáticamente que el método no sea adecuado, pero merecen tenerse en cuenta.',
    alertTitle: 'A vigilar',
    alertText: 'Si un efecto es importante, persistente o inusual, no te quedes sola con tus dudas. Un médico, una matrona u otro profesional de la salud puede ayudarte a determinar si hay que continuar, adaptar o cambiar el método.',
    projectsTitle: 'Tener en cuenta tus planes',
    projectsBody: 'Tu proyecto de embarazo también puede influir en la elección. Si quieres evitar un embarazo durante varios años, un método de larga duración puede ser interesante. Si te planteas un embarazo más próximo, otras opciones pueden ajustarse mejor a tu calendario.',
    keepInMindTitle: 'Para tener en cuenta',
    keepInMindText: 'Hablar de tu proyecto de embarazo, aunque todavía sea lejano o incierto, permite al profesional de la salud orientar mejor la conversación.',
    section4Body: 'Una cita permite sopesar las ventajas, las limitaciones y las posibles contraindicaciones de cada método. Puedes preparar algunas preguntas antes de la consulta para no olvidar los puntos importantes.',
    questionCardTitle: 'Preguntas útiles para hacer',
    professionalQuestions: [
      '¿Cuáles son las ventajas de este método para mí?',
      '¿Qué efectos indeseados puedo experimentar?',
      '¿Cómo se usa correctamente?',
      '¿Qué hacer si lo olvido, si se desplaza o si quiero dejarlo?',
      '¿Este método se ajusta a mi proyecto de embarazo?',
    ],
    professionalTipTitle: 'DATO ÚTIL',
    professionalTipText: 'Una matrona o un médico puede tener en cuenta tus antecedentes, tus tratamientos, tus preferencias y tu estilo de vida antes de recomendarte un método.',
    summaryTitle: 'Lo esencial',
    summaryItems: [
      'Elige un método compatible con tu día a día.',
      'Ten en cuenta tu tolerancia y tus preferencias.',
      'Piensa en tu proyecto de embarazo y en tu horizonte temporal.',
      'Pide consejo a un profesional si tienes dudas.',
    ],
    finalTipTitle: 'Para recordar',
    finalTipText: 'El mejor método no es necesariamente el que parece más práctico o más popular. Es el que se ajusta a tu situación, a tus necesidades y a tus preferencias, tras una conversación informada con un profesional de la salud.',
    disclaimerText: 'Este artículo tiene una finalidad informativa y no sustituye un consejo médico personalizado.',
    shareMessage: 'Elige el tratamiento que más te convenga — AWA',
  },
  it: {
    badge: 'SCEGLIERE IL TUO METODO',
    title: 'Scegliere il trattamento\nadatto a te',
    metaDuration: '7 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenuto validato',
    intro: 'Le domande giuste da porti per trovare un metodo contraccettivo adatto alla tua vita quotidiana, alle tue esigenze e ai tuoi progetti.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Domande da porsi',
      'Nessun metodo è il «migliore» in assoluto',
      'Criteri che possono fare la differenza',
      'Parlarne con un professionista',
      'Punti chiave',
    ],
    section1Body: 'Non esiste un unico metodo contraccettivo ideale per tutte. Prima di scegliere un metodo, può essere utile riflettere sulle tue abitudini, preferenze, tollerabilità e progetti.',
    questions: [
      'Come reagisce il mio corpo agli ormoni?',
      'Preferisco un’azione quotidiana o settimanale, oppure una soluzione a lunga durata?',
      'Ho un progetto di gravidanza a medio termine?',
      'Qual è il mio budget e quanto è accessibile questo metodo contraccettivo?',
    ],
    section2Body: 'Due persone possono scegliere metodi diversi ed entrambe aver fatto una scelta perfettamente adatta alla propria situazione. La scelta giusta dipende in particolare da come desideri usare la contraccezione e da ciò che cerchi.',
    highlightTitle: 'Il punto essenziale da ricordare',
    highlightText: 'Un metodo che sembra interessante sulla carta non è necessariamente quello più semplice o più comodo per te nella vita di tutti i giorni.',
    section3Body: 'Per confrontare più opzioni puoi considerare diversi criteri. L’obiettivo non è sapere tutto a memoria, ma individuare ciò che conta davvero per te.',
    priorities: [
      {
        title: 'Semplicità',
        text: 'Alcuni metodi richiedono un’azione quotidiana, altri solo un’attenzione settimanale, o molto meno frequente.',
      },
      {
        title: 'Tollerabilità',
        text: 'Gli effetti che avverti possono variare da persona a persona. È importante notare come reagisce il tuo corpo e parlarne se qualcosa ti dà fastidio.',
      },
      {
        title: 'Progetti di gravidanza',
        text: 'Se desideri una gravidanza a breve, la durata d’uso e il ritorno della fertilità dopo la sospensione possono far parte di ciò di cui discutere.',
      },
      {
        title: 'Efficacia',
        text: 'L’efficacia dipende non solo dal metodo scelto, ma anche dall’usarlo correttamente e con regolarità.',
      },
    ],
    rhythmTitle: 'Quanto spesso devi usarlo',
    rhythmBody: 'Una differenza importante tra i metodi è la frequenza con cui devi pensare alla contraccezione.',
    comparison: [
      {
        title: 'Pillola',
        detail: 'Azione quotidiana',
      },
      {
        title: 'Cerotto',
        detail: 'Cambio settimanale',
      },
      {
        title: 'Anello',
        detail: 'Ciclo di diverse settimane',
      },
      {
        title: 'Impianto',
        detail: 'Soluzione a lunga durata',
      },
      {
        title: 'Spirale ormonale',
        detail: 'Soluzione a lunga durata',
      },
    ],
    bodyReactionTitle: 'Osservare come reagisce il tuo corpo',
    bodyReactionText: 'Un metodo ormonale può essere vissuto in modo diverso da una persona all’altra. Alcune notano cambiamenti nel ciclo, nei sanguinamenti o altri effetti collaterali. Queste reazioni non significano automaticamente che il metodo non sia adatto a te, ma meritano attenzione.',
    alertTitle: 'Da tenere d’occhio',
    alertText: 'Se un effetto è importante, persistente o insolito, non restare sola con i tuoi dubbi. Un medico, un’ostetrica o un altro professionista sanitario può aiutarti a capire se continuare, adattare o cambiare il metodo.',
    projectsTitle: 'Tenere conto dei tuoi progetti',
    projectsBody: 'I tuoi progetti di gravidanza possono influenzare anche la scelta. Se vuoi evitare una gravidanza per diversi anni, può valere la pena considerare un metodo a lunga durata. Se pensi a una gravidanza più a breve, altre opzioni possono adattarsi meglio ai tuoi tempi.',
    keepInMindTitle: 'Da tenere a mente',
    keepInMindText: 'Parlare dei tuoi progetti di gravidanza, anche se sono ancora lontani o incerti, aiuta il professionista sanitario a orientare meglio il confronto.',
    section4Body: 'Una visita ti permette di valutare i benefici, i vincoli e le possibili controindicazioni di ciascun metodo. Puoi preparare qualche domanda in anticipo per non dimenticare nulla di importante.',
    questionCardTitle: 'Domande utili da porre',
    professionalQuestions: [
      'Quali sono i benefici di questo metodo per me?',
      'Quali effetti collaterali potrei avere?',
      'Come lo uso correttamente?',
      'Che cosa devo fare se me ne dimentico, se si sposta o se voglio interromperlo?',
      'Questo metodo è compatibile con i miei progetti di gravidanza?',
    ],
    professionalTipTitle: 'Da sapere',
    professionalTipText: 'Un’ostetrica o un medico può tenere conto della tua storia clinica, dei trattamenti, delle preferenze e dello stile di vita prima di consigliare un metodo.',
    summaryTitle: 'L’essenziale',
    summaryItems: [
      'Scegli un metodo adatto alla tua vita quotidiana.',
      'Tieni conto della tua tollerabilità e delle tue preferenze.',
      'Pensa ai tuoi progetti di gravidanza e ai tuoi tempi.',
      'Chiedi consiglio a un professionista se hai dubbi.',
    ],
    finalTipTitle: 'Ricorda',
    finalTipText: 'Il metodo migliore non è necessariamente quello che sembra più comodo o più diffuso. È quello che si adatta alla tua situazione, alle tue esigenze e alle tue preferenze, dopo un confronto informato con un professionista sanitario.',
    disclaimerText: 'Questo articolo ha solo scopo informativo e non sostituisce un parere medico personalizzato.',
    shareMessage: 'Scegliere il trattamento adatto a te — AWA',
  },
  tr: {
    badge: 'YÖNTEMİNİ SEÇMEK',
    title: 'Sana uygun yöntemi\nseçmek',
    metaDuration: '7 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Orta düzey',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Günlük yaşamına, ihtiyaçlarına ve planlarına uygun bir doğum kontrol yöntemi bulmak için kendine sorabileceğin doğru sorular.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Kendine sorulacak sorular',
      'Mutlak anlamda “en iyi” yöntem yoktur',
      'Fark yaratabilecek ölçütler',
      'Bir profesyonelle konuşmak',
      'Akılda tutulacaklar',
    ],
    section1Body: 'Herkes için geçerli tek bir ideal doğum kontrol yöntemi yoktur. Bir yöntem seçmeden önce alışkanlıklarını, tercihlerini, yöntemi ne kadar kaldırdığını ve planlarını düşünmek yardımcı olabilir.',
    questions: [
      'Vücudum hormonlara nasıl tepki veriyor?',
      'Günlük ya da haftalık bir uygulamaya mı, yoksa uzun etkili bir çözüme mi ihtiyacım var?',
      'Orta vadede bir gebelik planım var mı?',
      'Bütçem nedir ve bu doğum kontrol yöntemine ne kadar kolay ulaşabiliyorum?',
    ],
    section2Body: 'İki kişi farklı yöntemler seçebilir ve ikisi de kendi durumuna tamamen uygun bir seçim yapmış olabilir. Doğru seçim, özellikle doğum kontrolünü nasıl kullanmak istediğine ve neyi aradığına bağlıdır.',
    highlightTitle: 'Akılda tutulması gereken en önemli şey',
    highlightText: 'Kâğıt üzerinde çekici görünen bir yöntem, günlük hayatında senin için en basit ya da en rahat olan yöntem olmayabilir.',
    section3Body: 'Birkaç seçeneği karşılaştırmak için farklı ölçütlere bakabilirsin. Amaç her şeyi ezbere bilmek değil, senin için gerçekten neyin önemli olduğunu belirlemektir.',
    priorities: [
      {
        title: 'Kolaylık',
        text: 'Bazı yöntemler günlük bir uygulama gerektirir, bazıları ise yalnızca haftalık ya da çok daha seyrek bir ilgi ister.',
      },
      {
        title: 'Tolerans',
        text: 'Hissettiğin etkiler kişiden kişiye değişebilir. Vücudunun nasıl tepki verdiğini fark etmen ve seni rahatsız eden bir şey olursa bunu konuşman önemlidir.',
      },
      {
        title: 'Gebelik planları',
        text: 'Yakın zamanda gebelik düşünüyorsan, kullanım süresi ve bıraktıktan sonra doğurganlığın geri dönmesi konuşacağın konular arasında olabilir.',
      },
      {
        title: 'Etkinlik',
        text: 'Etkinlik yalnızca seçilen yönteme değil, onu doğru ve düzenli kullanmaya da bağlıdır.',
      },
    ],
    rhythmTitle: 'Ne sıklıkla kullanman gerekir',
    rhythmBody: 'Yöntemler arasındaki önemli farklardan biri, doğum kontrolünü ne sıklıkla düşünmen gerektiğidir.',
    comparison: [
      {
        title: 'Hap',
        detail: 'Günlük uygulama',
      },
      {
        title: 'Flaster',
        detail: 'Haftalık değişim',
      },
      {
        title: 'Halka',
        detail: 'Birkaç haftalık döngü',
      },
      {
        title: 'İmplant',
        detail: 'Uzun etkili çözüm',
      },
      {
        title: 'Hormonlu spiral',
        detail: 'Uzun etkili çözüm',
      },
    ],
    bodyReactionTitle: 'Vücudunun nasıl tepki verdiğini izlemek',
    bodyReactionText: 'Hormonal bir yöntem kişiden kişiye farklı hissettirebilir. Bazı kişiler döngülerinde, kanamalarında veya başka yan etkilerde değişiklikler fark eder. Bu tepkiler yöntemin sana uygun olmadığı anlamına otomatik olarak gelmez, ancak dikkat edilmeye değerdir.',
    alertTitle: 'Dikkat edilmesi gerekenler',
    alertText: 'Bir etki belirginse, kalıcıysa veya alışılmadıksa sorularınla yalnız kalma. Bir doktor, ebe veya başka bir sağlık profesyoneli, yönteme devam edip etmeyeceğini, ayarlayıp ayarlamayacağını ya da değiştirip değiştirmeyeceğini belirlemene yardımcı olabilir.',
    projectsTitle: 'Planlarını hesaba katmak',
    projectsBody: 'Gebelik planların da seçimini etkileyebilir. Birkaç yıl boyunca gebe kalmak istemiyorsan uzun etkili bir yöntemi düşünmekte fayda olabilir. Daha yakın bir zamanda gebelik düşünüyorsan, diğer seçenekler zaman çizelgene daha uygun olabilir.',
    keepInMindTitle: 'Akılda tutmaya değer',
    keepInMindText: 'Gebelik planlarını, henüz uzak ya da belirsiz olsalar bile konuşmak, sağlık profesyonelinin görüşmeyi daha iyi yönlendirmesine yardımcı olur.',
    section4Body: 'Bir randevu, her yöntemin faydalarını, kısıtlarını ve olası kontrendikasyonlarını tartmana olanak tanır. Önemli bir şeyi unutmamak için önceden birkaç soru hazırlayabilirsin.',
    questionCardTitle: 'Sorulabilecek faydalı sorular',
    professionalQuestions: [
      'Bu yöntemin benim için faydaları nelerdir?',
      'Hangi yan etkileri yaşayabilirim?',
      'Doğru şekilde nasıl kullanırım?',
      'Unutursam, yerinden kayarsa ya da bırakmak istersem ne yapmalıyım?',
      'Bu yöntem gebelik planlarımla uyumlu mu?',
    ],
    professionalTipTitle: 'Bilmekte fayda var',
    professionalTipText: 'Bir ebe veya doktor, bir yöntem önermeden önce tıbbi geçmişini, kullandığın tedavileri, tercihlerini ve yaşam tarzını dikkate alabilir.',
    summaryTitle: 'Özetle',
    summaryItems: [
      'Günlük yaşamına uyan bir yöntem seç.',
      'Toleransını ve tercihlerini hesaba kat.',
      'Gebelik planlarını ve zaman çizelgeni düşün.',
      'Emin değilsen bir profesyonele danış.',
    ],
    finalTipTitle: 'Unutma',
    finalTipText: 'En iyi yöntem, en kullanışlı ya da en popüler görünen yöntem olmak zorunda değildir. Bir sağlık profesyoneliyle bilinçli bir görüşmenin ardından durumuna, ihtiyaçlarına ve tercihlerine uyan yöntemdir.',
    disclaimerText: 'Bu makale yalnızca bilgilendirme amaçlıdır ve kişiye özel tıbbi tavsiyenin yerini tutmaz.',
    shareMessage: 'Sana uygun yöntemi seçmek — AWA',
  },
  ru: {
    badge: 'ВЫБОР МЕТОДА',
    title: 'Как выбрать метод,\nкоторый подходит вам',
    metaDuration: '7 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Средний уровень',
    metaValidated: 'Проверенный материал',
    intro: 'Правильные вопросы, которые стоит себе задать, чтобы подобрать метод контрацепции, подходящий вашему повседневному ритму, потребностям и планам.',
    contentsTitle: 'В этой статье',
    topics: [
      'Вопросы, которые стоит себе задать',
      'Нет метода, который был бы «лучшим» во всём',
      'Критерии, которые могут иметь значение',
      'Обсуждение с врачом',
      'Главное',
    ],
    section1Body: 'Не существует единого идеального метода контрацепции для всех. Прежде чем выбрать метод, полезно подумать о своих привычках, предпочтениях, переносимости и планах.',
    questions: [
      'Как мой организм реагирует на гормоны?',
      'Мне подходит ежедневное или еженедельное действие или решение длительного действия?',
      'Планирую ли я беременность в среднесрочной перспективе?',
      'Каков мой бюджет и насколько доступен этот метод контрацепции?',
    ],
    section2Body: 'Двое людей могут выбрать разные методы, и оба выбора будут вполне подходящими для их ситуации. Правильный выбор зависит прежде всего от того, как вы хотите пользоваться контрацепцией и что для вас важно.',
    highlightTitle: 'Главное, что стоит запомнить',
    highlightText: 'Метод, который выглядит привлекательно на бумаге, не обязательно окажется самым простым или удобным для вас в повседневной жизни.',
    section3Body: 'Чтобы сравнить несколько вариантов, можно опираться на разные критерии. Цель не в том, чтобы знать всё наизусть, а в том, чтобы понять, что действительно важно для вас.',
    priorities: [
      {title: 'Простота', text: 'Одни методы требуют ежедневного действия, другим достаточно еженедельного внимания или ещё более редкого.'},
      {title: 'Переносимость', text: 'Ощущения могут различаться от человека к человеку. Важно замечать, как реагирует ваш организм, и обсуждать это, если что-то беспокоит.'},
      {title: 'Планы на беременность', text: 'Если вы надеетесь на беременность в ближайшее время, продолжительность применения и восстановление фертильности после отмены могут войти в круг обсуждаемых вопросов.'},
      {title: 'Эффективность', text: 'Эффективность зависит не только от выбранного метода, но и от того, насколько правильно и регулярно им пользуются.'},
    ],
    rhythmTitle: 'Как часто нужно им пользоваться',
    rhythmBody: 'Одно из важных различий между методами — как часто приходится думать о контрацепции.',
    comparison: [
      {title: 'Таблетки', detail: 'Ежедневное действие'},
      {title: 'Пластырь', detail: 'Еженедельная замена'},
      {title: 'Кольцо', detail: 'Цикл в несколько недель'},
      {title: 'Имплант', detail: 'Решение длительного действия'},
      {title: 'Гормональная ВМС', detail: 'Решение длительного действия'},
    ],
    bodyReactionTitle: 'Наблюдайте, как реагирует ваш организм',
    bodyReactionText: 'Гормональный метод может переноситься по-разному. Некоторые женщины замечают изменения цикла, кровотечения или другие побочные эффекты. Такие реакции не означают автоматически, что метод вам не подходит, но на них стоит обратить внимание.',
    alertTitle: 'На что стоит обратить внимание',
    alertText: 'Если какой-то эффект выражен, сохраняется долго или необычен, не оставайтесь со своими вопросами наедине. Врач, акушерка или другой медицинский специалист поможет решить, продолжать ли метод, скорректировать его или заменить.',
    projectsTitle: 'Учитывайте свои планы',
    projectsBody: 'Ваши планы на беременность тоже могут повлиять на выбор. Если вы хотите избежать беременности в течение нескольких лет, стоит рассмотреть метод длительного действия. Если вы думаете о беременности в ближайшем будущем, другие варианты могут лучше подойти по срокам.',
    keepInMindTitle: 'Стоит помнить',
    keepInMindText: 'Разговор о ваших планах на беременность, даже если они пока далёкие или неопределённые, помогает врачу точнее направить обсуждение.',
    section4Body: 'На приёме можно взвесить преимущества, ограничения и возможные противопоказания каждого метода. Заранее подготовьте несколько вопросов, чтобы не забыть ничего важного.',
    questionCardTitle: 'Полезные вопросы',
    professionalQuestions: [
      'Какие преимущества у этого метода для меня?',
      'Какие побочные эффекты могут возникнуть?',
      'Как правильно им пользоваться?',
      'Что делать, если я забыла о нём, если он сместился или если я хочу прекратить его использование?',
      'Подходит ли этот метод к моим планам на беременность?',
    ],
    professionalTipTitle: 'ПОЛЕЗНО ЗНАТЬ',
    professionalTipText: 'Акушерка или врач может учесть вашу историю болезни, принимаемое лечение, предпочтения и образ жизни, прежде чем порекомендовать метод.',
    summaryTitle: 'Главное',
    summaryItems: [
      'Выберите метод, который подходит вашей повседневной жизни.',
      'Учитывайте свою переносимость и предпочтения.',
      'Подумайте о планах на беременность и сроках.',
      'Если сомневаетесь, обратитесь за советом к специалисту.',
    ],
    finalTipTitle: 'Запомните',
    finalTipText: 'Лучший метод — не обязательно тот, что кажется самым удобным или самым популярным. Это тот, который подходит вашей ситуации, потребностям и предпочтениям после осознанного разговора с медицинским специалистом.',
    disclaimerText: 'Эта статья носит информационный характер и не заменяет индивидуальной медицинской консультации.',
    shareMessage: 'Как выбрать метод, который подходит вам — AWA',
  },
  de: {
    badge: 'DIE RICHTIGE METHODE WÄHLEN',
    title: 'Die passende Methode\nfür dich finden',
    metaDuration: '7 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Fortgeschritten',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Die richtigen Fragen, die du dir stellen kannst, um eine Verhütungsmethode zu finden, die zu deinem Alltag, deinen Bedürfnissen und deinen Plänen passt.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Fragen, die du dir stellen kannst',
      'Keine Methode ist absolut „die beste“',
      'Kriterien, die den Unterschied machen können',
      'Das Gespräch mit Fachpersonal',
      'Das Wichtigste in Kürze',
    ],
    section1Body: 'Es gibt nicht die eine ideale Verhütungsmethode für alle. Bevor du dich für eine Methode entscheidest, kann es helfen, über deine Gewohnheiten, Vorlieben, Verträglichkeit und Pläne nachzudenken.',
    questions: [
      'Wie reagiert mein Körper auf Hormone?',
      'Möchte ich täglich oder wöchentlich daran denken, oder lieber eine Lösung mit Langzeitwirkung?',
      'Plane ich mittelfristig eine Schwangerschaft?',
      'Wie hoch ist mein Budget, und wie zugänglich ist diese Verhütungsmethode?',
    ],
    section2Body: 'Zwei Personen können sich für unterschiedliche Methoden entscheiden und beide eine Wahl getroffen haben, die perfekt zu ihrer Situation passt. Die richtige Entscheidung hängt insbesondere davon ab, wie du deine Verhütung anwenden möchtest und was du suchst.',
    highlightTitle: 'Das Wichtigste zum Merken',
    highlightText: 'Eine Methode, die auf dem Papier überzeugend klingt, ist nicht unbedingt diejenige, die im Alltag für dich am einfachsten oder angenehmsten ist.',
    section3Body: 'Um mehrere Möglichkeiten zu vergleichen, kannst du dir verschiedene Kriterien ansehen. Es geht nicht darum, alles auswendig zu wissen, sondern herauszufinden, was dir wirklich wichtig ist.',
    priorities: [
      {title: 'Einfachheit', text: 'Manche Methoden erfordern eine tägliche Anwendung, andere nur wöchentliche Aufmerksamkeit oder noch seltener.'},
      {title: 'Verträglichkeit', text: 'Die Wirkungen, die du spürst, können von Person zu Person unterschiedlich sein. Es ist wichtig, darauf zu achten, wie dein Körper reagiert, und darüber zu sprechen, wenn dich etwas stört.'},
      {title: 'Schwangerschaftspläne', text: 'Wenn du dir bald eine Schwangerschaft wünschst, können die Anwendungsdauer und die Rückkehr der Fruchtbarkeit nach dem Absetzen Teil deines Gesprächs sein.'},
      {title: 'Wirksamkeit', text: 'Die Wirksamkeit hängt nicht nur von der gewählten Methode ab, sondern auch davon, dass du sie korrekt und konsequent anwendest.'},
    ],
    rhythmTitle: 'Wie oft du sie anwenden musst',
    rhythmBody: 'Ein wichtiger Unterschied zwischen den Methoden ist, wie oft du an deine Verhütung denken musst.',
    comparison: [
      {title: 'Pille', detail: 'Tägliche Anwendung'},
      {title: 'Pflaster', detail: 'Wöchentlicher Wechsel'},
      {title: 'Vaginalring', detail: 'Zyklus von mehreren Wochen'},
      {title: 'Implantat', detail: 'Lösung mit Langzeitwirkung'},
      {title: 'Hormonspirale', detail: 'Lösung mit Langzeitwirkung'},
    ],
    bodyReactionTitle: 'Beobachten, wie dein Körper reagiert',
    bodyReactionText: 'Eine hormonelle Methode kann sich von Person zu Person unterschiedlich anfühlen. Manche bemerken Veränderungen im Zyklus, bei der Blutung oder andere Nebenwirkungen. Diese Reaktionen bedeuten nicht automatisch, dass die Methode nicht zu dir passt, aber es lohnt sich, darauf zu achten.',
    alertTitle: 'Darauf solltest du achten',
    alertText: 'Wenn eine Wirkung stark, anhaltend oder ungewöhnlich ist, bleib mit deinen Fragen nicht allein. Eine Ärztin oder ein Arzt, eine Hebamme oder anderes medizinisches Fachpersonal kann dir helfen zu entscheiden, ob du die Methode weiter anwendest, anpasst oder wechselst.',
    projectsTitle: 'Deine Pläne berücksichtigen',
    projectsBody: 'Auch deine Schwangerschaftspläne können deine Wahl beeinflussen. Wenn du mehrere Jahre lang eine Schwangerschaft vermeiden möchtest, kann sich eine Methode mit Langzeitwirkung lohnen. Wenn du früher über eine Schwangerschaft nachdenkst, passen andere Möglichkeiten möglicherweise besser zu deinem Zeitplan.',
    keepInMindTitle: 'Gut zu bedenken',
    keepInMindText: 'Wenn du über deine Schwangerschaftspläne sprichst, auch wenn sie noch fern oder unsicher sind, kann das medizinische Fachpersonal das Gespräch besser leiten.',
    section4Body: 'In einem Termin kannst du die Vorteile, Einschränkungen und möglichen Gegenanzeigen jeder Methode abwägen. Du kannst dir vorab ein paar Fragen notieren, damit du nichts Wichtiges vergisst.',
    questionCardTitle: 'Hilfreiche Fragen für das Gespräch',
    professionalQuestions: [
      'Welche Vorteile hat diese Methode für mich?',
      'Welche Nebenwirkungen könnten auftreten?',
      'Wie wende ich sie richtig an?',
      'Was tue ich, wenn ich sie vergesse, wenn sie verrutscht oder wenn ich sie absetzen möchte?',
      'Passt diese Methode zu meinen Schwangerschaftsplänen?',
    ],
    professionalTipTitle: 'Gut zu wissen',
    professionalTipText: 'Eine Hebamme oder Ärztin bzw. ein Arzt kann deine Krankengeschichte, Behandlungen, Vorlieben und deinen Lebensstil berücksichtigen, bevor eine Methode empfohlen wird.',
    summaryTitle: 'Das Wesentliche',
    summaryItems: [
      'Wähle eine Methode, die zu deinem Alltag passt.',
      'Berücksichtige deine Verträglichkeit und deine Vorlieben.',
      'Denk an deine Schwangerschaftspläne und deinen Zeitplan.',
      'Lass dich von Fachpersonal beraten, wenn du unsicher bist.',
    ],
    finalTipTitle: 'Denk daran',
    finalTipText: 'Die beste Methode ist nicht unbedingt die, die am bequemsten oder am beliebtesten erscheint. Es ist die, die zu deiner Situation, deinen Bedürfnissen und deinen Vorlieben passt – nach einem fundierten Gespräch mit medizinischem Fachpersonal.',
    disclaimerText: 'Dieser Artikel dient nur der Information und ersetzt keine persönliche ärztliche Beratung.',
    shareMessage: 'Die passende Methode für dich finden — AWA',
  },
  zh: {
      badge: '选择适合你的方法',
      title: '选择适合你的\n避孕方式',
      metaDuration: '阅读约 7 分钟',
      metaType: '指南',
      metaLevel: '进阶',
      metaValidated: '已审核内容',
      intro: '问自己几个合适的问题，找到契合你日常生活、需求和计划的避孕方式。',
      contentsTitle: '本文内容',
      topics: [
        '可以问问自己的问题',
        '没有绝对“最好”的方法',
        '可能起到关键作用的考量',
        '与专业人员沟通',
        '要点回顾',
      ],
      section1Body: '并不存在适合所有人的唯一理想避孕方式。在选择之前，不妨先想想自己的习惯、偏好、耐受情况和计划。',
      questions: [
        '我的身体对激素有什么反应？',
        '我需要每天或每周操作一次，还是更适合长效的方式？',
        '我近期有怀孕计划吗？',
        '我的预算如何？这种避孕方式容易获得吗？',
      ],
      section2Body: '两个人可以选择不同的方法，而各自的选择都完全适合自己的情况。合适的选择尤其取决于你希望如何使用避孕方式，以及你的期待。',
      highlightTitle: '最重要的一点',
      highlightText: '一种看上去很吸引人的方法，不一定是日常使用中对你最简单、最舒适的那一种。',
      section3Body: '要比较几种选择，可以从不同的角度来看。目标不是把所有信息都记住，而是弄清楚什么对你来说真正重要。',
      priorities: [
        {
          title: '是否简便',
          text: '有些方法需要每天操作，有些只需每周留意一次，还有些的间隔要长得多。',
        },
        {
          title: '耐受情况',
          text: '每个人感受到的影响可能不同。留意身体的反应很重要，如果有什么让你不舒服，请及时说出来。',
        },
        {
          title: '怀孕计划',
          text: '如果你打算不久后怀孕，使用时长以及停用后生育力的恢复，都可以作为与医生讨论的内容。',
        },
        {
          title: '有效性',
          text: '有效性不仅取决于所选的方法，也取决于是否正确、持续地使用。',
        },
      ],
      rhythmTitle: '使用频率',
      rhythmBody: '不同方法之间一个重要的差别，是你需要多久想起一次避孕。',
      comparison: [
        {
          title: '避孕药',
          detail: '每天使用',
        },
        {
          title: '避孕贴',
          detail: '每周更换',
        },
        {
          title: '阴道环',
          detail: '以数周为一个周期',
        },
        {
          title: '皮下埋植',
          detail: '长效方式',
        },
        {
          title: '含激素宫内节育器',
          detail: '长效方式',
        },
      ],
      bodyReactionTitle: '留意身体的反应',
      bodyReactionText: '激素类避孕方式带来的感受因人而异。有些人会发现周期、出血或其他方面出现变化。这些反应并不一定意味着这种方法不适合你，但值得留意。',
      alertTitle: '需要留意的情况',
      alertText: '如果某种影响比较明显、持续或不寻常，请不要独自纠结。医生、助产士或其他医疗专业人员可以帮助你判断是继续使用、调整还是更换方法。',
      projectsTitle: '把你的计划考虑进去',
      projectsBody: '你的怀孕计划也会影响选择。如果你想在未来几年内避免怀孕，长效方式可能值得考虑；如果你打算较早怀孕，其他选择可能更符合你的时间安排。',
      keepInMindTitle: '值得记住',
      keepInMindText: '把你的怀孕计划说出来，即使还很遥远或尚不确定，也能帮助医疗专业人员更好地引导沟通。',
      section4Body: '一次就诊可以让你权衡每种方法的益处、限制和可能的禁忌。你可以提前准备几个问题，以免遗漏重要的内容。',
      questionCardTitle: '值得问的问题',
      professionalQuestions: [
        '这种方法对我有哪些好处？',
        '我可能会出现哪些副作用？',
        '怎样才能正确使用？',
        '如果忘记使用、移位，或者我想停用，该怎么办？',
        '这种方法符合我的怀孕计划吗？',
      ],
      professionalTipTitle: '小贴士',
      professionalTipText: '助产士或医生在推荐方法之前，会综合考虑你的病史、正在使用的药物、个人偏好和生活方式。',
      summaryTitle: '核心要点',
      summaryItems: [
        '选择适合你日常生活的方法。',
        '把你的耐受情况和偏好考虑进去。',
        '想一想你的怀孕计划和时间安排。',
        '拿不准时，向专业人员咨询。',
      ],
      finalTipTitle: '请记住',
      finalTipText: '最好的方法不一定是看起来最方便或最流行的那一种，而是在与医疗专业人员充分沟通后，真正契合你的情况、需求和偏好的那一种。',
      disclaimerText: '本文仅供参考，不能替代个性化的医疗建议。',
      shareMessage: '选择适合你的避孕方式 — AWA',
    },
  id: {
    badge: 'MEMILIH METODE',
    title: 'Memilih metode\nyang cocok untukmu',
    metaDuration: '7 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Menengah',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Pertanyaan-pertanyaan yang tepat untuk membantumu menemukan metode kontrasepsi yang sesuai dengan keseharian, kebutuhan, dan rencanamu.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Pertanyaan untuk dirimu sendiri',
      'Tidak ada metode yang “terbaik” secara mutlak',
      'Kriteria yang bisa menentukan',
      'Mendiskusikannya dengan tenaga profesional',
      'Poin penting',
    ],
    section1Body: 'Tidak ada satu metode kontrasepsi ideal yang cocok untuk semua orang. Sebelum memilih metode, ada baiknya kamu memikirkan kebiasaan, preferensi, toleransi, dan rencanamu.',
    questions: [
      'Bagaimana tubuhku bereaksi terhadap hormon?',
      'Apakah aku butuh tindakan harian atau mingguan, atau solusi jangka panjang?',
      'Apakah aku punya rencana kehamilan dalam waktu menengah?',
      'Berapa anggaranku, dan seberapa mudah metode kontrasepsi ini diakses?',
    ],
    section2Body: 'Dua orang bisa memilih metode yang berbeda dan keduanya sama-sama membuat pilihan yang sangat cocok dengan situasinya. Pilihan yang tepat bergantung terutama pada cara kamu ingin menggunakan kontrasepsi dan apa yang kamu cari.',
    highlightTitle: 'Hal kunci yang perlu diingat',
    highlightText: 'Metode yang tampak menarik di atas kertas belum tentu yang paling sederhana atau paling nyaman untukmu dalam keseharian.',
    section3Body: 'Untuk membandingkan beberapa pilihan, kamu bisa melihat berbagai kriteria. Tujuannya bukan menghafal semuanya, melainkan mengenali apa yang benar-benar penting bagimu.',
    priorities: [
      {
        title: 'Kemudahan',
        text: 'Sebagian metode memerlukan tindakan setiap hari, sementara yang lain hanya perlu perhatian mingguan, atau jauh lebih jarang.',
      },
      {
        title: 'Toleransi',
        text: 'Efek yang kamu rasakan bisa berbeda dari satu orang ke orang lain. Penting untuk memperhatikan reaksi tubuhmu dan membicarakannya jika ada yang mengganggu.',
      },
      {
        title: 'Rencana kehamilan',
        text: 'Jika kamu berharap segera hamil, lama pemakaian dan kembalinya kesuburan setelah berhenti bisa menjadi bagian dari hal yang kamu diskusikan.',
      },
      {
        title: 'Efektivitas',
        text: 'Efektivitas tidak hanya bergantung pada metode yang dipilih, tetapi juga pada pemakaian yang benar dan konsisten.',
      },
    ],
    rhythmTitle: 'Seberapa sering perlu digunakan',
    rhythmBody: 'Salah satu perbedaan penting antarmetode adalah seberapa sering kamu perlu memikirkan kontrasepsimu.',
    comparison: [
      {
        title: 'Pil',
        detail: 'Tindakan harian',
      },
      {
        title: 'Koyo',
        detail: 'Diganti setiap minggu',
      },
      {
        title: 'Cincin vagina',
        detail: 'Siklus beberapa minggu',
      },
      {
        title: 'Implan',
        detail: 'Solusi jangka panjang',
      },
      {
        title: 'AKDR hormonal',
        detail: 'Solusi jangka panjang',
      },
    ],
    bodyReactionTitle: 'Memperhatikan reaksi tubuhmu',
    bodyReactionText: 'Metode hormonal bisa terasa berbeda dari satu orang ke orang lain. Sebagian merasakan perubahan pada siklus, perdarahan, atau efek samping lainnya. Reaksi ini tidak otomatis berarti metode tersebut tidak cocok untukmu, tetapi layak diperhatikan.',
    alertTitle: 'Perlu diwaspadai',
    alertText: 'Jika suatu efek terasa berat, menetap, atau tidak biasa, jangan menghadapi pertanyaanmu sendirian. Dokter, bidan, atau tenaga kesehatan lain dapat membantumu menentukan apakah metode itu dilanjutkan, disesuaikan, atau diganti.',
    projectsTitle: 'Mempertimbangkan rencanamu',
    projectsBody: 'Rencana kehamilanmu juga dapat memengaruhi pilihanmu. Jika kamu ingin menghindari kehamilan selama beberapa tahun, metode jangka panjang mungkin layak dipertimbangkan. Jika kamu memikirkan kehamilan dalam waktu dekat, pilihan lain mungkin lebih sesuai dengan jadwalmu.',
    keepInMindTitle: 'Perlu diingat',
    keepInMindText: 'Membicarakan rencana kehamilanmu, meskipun masih jauh atau belum pasti, membantu tenaga kesehatan mengarahkan diskusi dengan lebih baik.',
    section4Body: 'Janji temu memungkinkan kamu menimbang manfaat, kendala, dan kemungkinan kontraindikasi dari setiap metode. Kamu bisa menyiapkan beberapa pertanyaan sebelumnya agar tidak ada hal penting yang terlupa.',
    questionCardTitle: 'Pertanyaan yang berguna untuk diajukan',
    professionalQuestions: [
      'Apa manfaat metode ini untukku?',
      'Efek samping apa yang mungkin kualami?',
      'Bagaimana cara menggunakannya dengan benar?',
      'Apa yang harus kulakukan jika aku lupa, jika posisinya bergeser, atau jika aku ingin menghentikannya?',
      'Apakah metode ini sesuai dengan rencana kehamilanku?',
    ],
    professionalTipTitle: 'Perlu diketahui',
    professionalTipText: 'Bidan atau dokter dapat mempertimbangkan riwayat medis, pengobatan, preferensi, dan gaya hidupmu sebelum menyarankan suatu metode.',
    summaryTitle: 'Intinya',
    summaryItems: [
      'Pilih metode yang sesuai dengan keseharianmu.',
      'Pertimbangkan toleransi dan preferensimu.',
      'Pikirkan rencana kehamilan dan jadwalmu.',
      'Minta saran tenaga profesional jika kamu ragu.',
    ],
    finalTipTitle: 'Ingat',
    finalTipText: 'Metode terbaik belum tentu yang tampak paling praktis atau paling populer. Metode terbaik adalah yang sesuai dengan situasi, kebutuhan, dan preferensimu, setelah berdiskusi dengan tenaga kesehatan secara terinformasi.',
    disclaimerText: 'Artikel ini hanya untuk tujuan informasi dan tidak menggantikan saran medis yang dipersonalisasi.',
    shareMessage: 'Memilih metode yang cocok untukmu — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function ChooseHormonalMethodArticleScreen({
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

  const priorities = content.priorities.map((item, index) => ({
    ...item,
    icon: PRIORITY_ICONS[index],
  }));

  const comparison = content.comparison.map((item, index) => ({
    ...item,
    icon: COMPARISON_ICONS[index],
  }));

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

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>{content.title}</AwaText>

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

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.intro}>{content.intro}</AwaText>

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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.topics[0]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section1Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.questions.map(item => (
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section2Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.highlight}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <AwaText variant="titleSmall" emphasized>{content.highlightTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.highlightText}>{content.highlightText}</AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section3Body}</AwaText>

          <View style={styles.priorityList}>
            {priorities.map(item => (
              <AwaCard variant="filled" padding="none" key={item.title} style={styles.priorityCard}>
                <View style={styles.priorityIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={21}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.priorityCopy}>
                  <AwaText variant="titleSmall" emphasized>{item.title}</AwaText>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.priorityText}>{item.text}</AwaText>
                </View>
              </AwaCard>
            ))}
          </View>

          <AwaText variant="titleMedium" emphasized style={styles.h3}>{content.rhythmTitle}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.rhythmBody}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.comparison}>
            {comparison.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.comparisonRow,
                  index === comparison.length - 1 &&
                    styles.comparisonRowLast,
                ]}>
                <View style={styles.comparisonIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={19}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.comparisonCopy}>
                  <AwaText variant="titleSmall" emphasized>{item.title}</AwaText>
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.comparisonDetail}>{item.detail}</AwaText>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={18}
                  color={theme.colors.textMuted}
                />
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleMedium" emphasized style={styles.h3}>{content.bodyReactionTitle}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.bodyReactionText}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alertTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.alertText}</AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleMedium" emphasized style={styles.h3}>{content.projectsTitle}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.projectsBody}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="calendar-heart"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.keepInMindTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.keepInMindText}</AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section4Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <MaterialDesignIcons
                name="message-question-outline"
                size={22}
                color={theme.colors.primary}
              />

              <AwaText variant="titleSmall" emphasized>
                {content.questionCardTitle}
              </AwaText>
            </View>

            {content.professionalQuestions.map((item, index) => (
              <View key={item} style={styles.questionRow}>
                <View style={styles.questionBullet}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary">{index + 1}</AwaText>
                </View>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.questionText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.professionalTip}>
            <MaterialDesignIcons
              name="doctor"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.professionalTipTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.professionalTipText}</AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={25}
                color={theme.colors.primary}
              />

              <AwaText variant="titleSmall" emphasized>{content.summaryTitle}</AwaText>
            </View>

            {content.summaryItems.map(item => (
              <View key={item} style={styles.summaryItem}>
                <MaterialDesignIcons
                  name="check"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.finalTip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.finalTipTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.finalTipText}</AwaText>
            </View>
          </AwaCard>

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={19}
              color={theme.colors.textMuted}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.disclaimerText}>{content.disclaimerText}</AwaText>
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

  h3: {
    marginTop: 24,
  },

  body: {
    marginTop: 8,
  },

  checkList: {
    marginTop: 12,
    padding: 16,
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

  highlight: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  highlightCopy: {
    flex: 1,
    marginLeft: 12,
  },


  highlightText: {
    marginTop: 4,
  },

  priorityList: {
    marginTop: 16,
    gap: 12,
  },

  priorityCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  priorityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  priorityCopy: {
    flex: 1,
    marginLeft: 12,
  },


  priorityText: {
    marginTop: 4,
  },

  comparison: {
    marginTop: 16,
    overflow: 'hidden',
  },

  comparisonRow: {
    minHeight: 61,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  comparisonRowLast: {
    borderBottomWidth: 0,
  },

  comparisonIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  comparisonCopy: {
    flex: 1,
    marginLeft: 12,
  },


  comparisonDetail: {
    marginTop: 2,
  },

  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

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

  questionCard: {
    marginTop: 16,
    padding: 16,
  },

  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },


  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  questionBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },


  questionText: {
    flex: 1,
    marginLeft: 8,
    paddingTop: 2,
  },

  professionalTip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

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


  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
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
