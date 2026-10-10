import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Image,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import ReadingControls from '../../components/articles/ReadingControls';
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.reader.back')}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [styles.circle, pressed && styles.pressed]}>
              <MaterialDesignIcons
                name="chevron-left"
                size={23}
                color={theme.colors.text}
              />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('library.screen.addBookmark')}
                onPress={handleBookmark}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('libraryArticle.shareA11y')}
                onPress={handleShare}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name="share-variant-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{content.badge}</Text>
          </View>

          <Text style={styles.title}>{content.title}</Text>

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

                  <Text style={styles.meta}>{text}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.intro}>{content.intro}</Text>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>{content.contentsTitle}</Text>

            {content.topics.map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>{index + 1}.</Text>
                  <Text style={styles.contentText}>{item}</Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          <Text style={styles.h2}>1. {content.topics[0]}</Text>

          <Text style={styles.body}>{content.section1Body}</Text>

          <View style={styles.checkList}>
            {content.questions.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>{content.section2Body}</Text>

          <View style={styles.highlight}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>{content.highlightTitle}</Text>

              <Text style={styles.highlightText}>{content.highlightText}</Text>
            </View>
          </View>

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>{content.section3Body}</Text>

          <View style={styles.priorityList}>
            {priorities.map(item => (
              <View key={item.title} style={styles.priorityCard}>
                <View style={styles.priorityIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={21}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.priorityCopy}>
                  <Text style={styles.priorityTitle}>{item.title}</Text>

                  <Text style={styles.priorityText}>{item.text}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.h3}>{content.rhythmTitle}</Text>

          <Text style={styles.body}>{content.rhythmBody}</Text>

          <View style={styles.comparison}>
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
                  <Text style={styles.comparisonTitle}>{item.title}</Text>
                  <Text style={styles.comparisonDetail}>{item.detail}</Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={18}
                  color={theme.colors.textMuted}
                />
              </View>
            ))}
          </View>

          <Text style={styles.h3}>{content.bodyReactionTitle}</Text>

          <Text style={styles.body}>{content.bodyReactionText}</Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.alertTitle}</Text>

              <Text style={styles.tipText}>{content.alertText}</Text>
            </View>
          </View>

          <Text style={styles.h3}>{content.projectsTitle}</Text>

          <Text style={styles.body}>{content.projectsBody}</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="calendar-heart"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.keepInMindTitle}</Text>

              <Text style={styles.tipText}>{content.keepInMindText}</Text>
            </View>
          </View>

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <Text style={styles.body}>{content.section4Body}</Text>

          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <MaterialDesignIcons
                name="message-question-outline"
                size={22}
                color={theme.colors.primary}
              />

              <Text style={styles.questionTitle}>
                {content.questionCardTitle}
              </Text>
            </View>

            {content.professionalQuestions.map((item, index) => (
              <View key={item} style={styles.questionRow}>
                <View style={styles.questionBullet}>
                  <Text style={styles.questionNumber}>{index + 1}</Text>
                </View>

                <Text style={styles.questionText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.professionalTip}>
            <MaterialDesignIcons
              name="doctor"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.professionalTipTitle}</Text>

              <Text style={styles.tipText}>{content.professionalTipText}</Text>
            </View>
          </View>

          <Text style={styles.h2}>5. {content.topics[4]}</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={25}
                color={theme.colors.primary}
              />

              <Text style={styles.summaryTitle}>{content.summaryTitle}</Text>
            </View>

            {content.summaryItems.map(item => (
              <View key={item} style={styles.summaryItem}>
                <MaterialDesignIcons
                  name="check"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.summaryText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.finalTip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.finalTipTitle}</Text>

              <Text style={styles.tipText}>{content.finalTipText}</Text>
            </View>
          </View>

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={19}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>{content.disclaimerText}</Text>
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
    paddingBottom: 30,
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

  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.surface, 0.90),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  pressed: {
    opacity: 0.74,
  },

  article: {
    marginTop: -15,
    padding: 20,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: theme.colors.background,
  },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: theme.colors.primarySoft,
  },

  badgeText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 25,
    lineHeight: 31,
    color: theme.colors.text,
    fontWeight: '700',
  },

  metas: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
  },

  meta: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  contents: {
    marginTop: 19,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  contentsTitle: {
    marginBottom: 7,
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '800',
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
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    color: theme.colors.text,
  },

  h2: {
    marginTop: 27,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },

  h3: {
    marginTop: 22,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text,
    fontWeight: '800',
  },

  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
  },

  checkList: {
    marginTop: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },

  checkText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
  },

  highlight: {
    marginTop: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  highlightCopy: {
    flex: 1,
    marginLeft: 11,
  },

  highlightTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  highlightText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },

  priorityList: {
    marginTop: 14,
    gap: 10,
  },

  priorityCard: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    marginLeft: 11,
  },

  priorityTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  priorityText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  comparison: {
    marginTop: 14,
    overflow: 'hidden',
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  comparisonRow: {
    minHeight: 61,
    paddingHorizontal: 13,
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
    marginLeft: 10,
  },

  comparisonTitle: {
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  comparisonDetail: {
    marginTop: 2,
    fontSize: 11,
    color: theme.colors.textMuted,
  },

  alert: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  tipCopy: {
    flex: 1,
    marginLeft: 11,
  },

  tipTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  tipText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  questionCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 13,
  },

  questionTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 11,
  },

  questionBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  questionNumber: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  questionText: {
    flex: 1,
    marginLeft: 9,
    paddingTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  professionalTip: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  summaryCard: {
    marginTop: 15,
    padding: 16,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 13,
  },

  summaryTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },

  summaryText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },

  finalTip: {
    marginTop: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  disclaimer: {
    marginTop: 20,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  disclaimerText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 16,
    color: theme.colors.textMuted,
  },
  });
}
