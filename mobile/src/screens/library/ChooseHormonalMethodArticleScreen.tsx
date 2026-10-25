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
const CONTENT = withBrazilianPortuguese('ChooseHormonalMethod', {
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
  hi: {
    badge: 'अपना तरीका चुनना',
    title: 'अपने लिए सही\nतरीका चुनना',
    metaDuration: '7 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'मध्यम स्तर',
    metaValidated: 'समीक्षा किया गया कंटेंट',
    intro: 'अपनी रोज़मर्रा की ज़िंदगी, ज़रूरतों और योजनाओं के हिसाब से गर्भनिरोध का सही तरीका खोजने के लिए खुद से पूछने लायक सही सवाल।',
    contentsTitle: 'इस लेख में',
    topics: [
      'खुद से पूछने वाले सवाल',
      'कोई भी तरीका पूरी तरह “सबसे अच्छा” नहीं होता',
      'वे बातें जो फ़र्क़ ला सकती हैं',
      'विशेषज्ञ से बात करना',
      'मुख्य बातें',
    ],
    section1Body: 'सभी के लिए कोई एक आदर्श गर्भनिरोधक तरीका नहीं होता। तरीका चुनने से पहले अपनी आदतों, पसंद, शरीर की सहनशीलता और योजनाओं के बारे में सोचना मददगार हो सकता है।',
    questions: [
      'मेरा शरीर हार्मोन पर कैसी प्रतिक्रिया देता है?',
      'क्या मुझे रोज़ या हर हफ़्ते कुछ करना पड़े, या लंबे समय तक चलने वाला समाधान चाहिए?',
      'क्या मेरी निकट भविष्य में गर्भावस्था की कोई योजना है?',
      'मेरा बजट क्या है, और यह गर्भनिरोधक तरीका कितनी आसानी से मिल सकता है?',
    ],
    section2Body: 'दो महिलाएँ अलग-अलग तरीके चुन सकती हैं, और दोनों का चुनाव अपनी-अपनी स्थिति के लिए बिल्कुल सही हो सकता है। सही चुनाव खास तौर पर इस पर निर्भर करता है कि आप अपना गर्भनिरोध कैसे इस्तेमाल करना चाहती हैं और आप क्या चाहती हैं।',
    highlightTitle: 'याद रखने वाली मुख्य बात',
    highlightText: 'जो तरीका कागज़ पर अच्छा लगता है, ज़रूरी नहीं कि वही आपके लिए रोज़ की ज़िंदगी में सबसे आसान या आरामदायक हो।',
    section3Body: 'कई विकल्पों की तुलना करने के लिए आप अलग-अलग बातों को देख सकती हैं। मकसद सब कुछ रट लेना नहीं, बल्कि यह पहचानना है कि आपके लिए सच में क्या मायने रखता है।',
    priorities: [
      {
        title: 'आसानी',
        text: 'कुछ तरीकों में रोज़ कुछ करना पड़ता है, जबकि कुछ में सिर्फ़ हफ़्ते में एक बार ध्यान देना होता है, या उससे भी कम।',
      },
      {
        title: 'सहनशीलता',
        text: 'महसूस होने वाले असर हर महिला में अलग हो सकते हैं। यह देखना ज़रूरी है कि आपका शरीर कैसी प्रतिक्रिया देता है, और कुछ परेशान करे तो उस बारे में बात करें।',
      },
      {
        title: 'गर्भावस्था की योजना',
        text: 'अगर आप जल्द गर्भवती होना चाहती हैं, तो इस्तेमाल की अवधि और तरीका बंद करने के बाद प्रजनन क्षमता का लौटना बातचीत का हिस्सा हो सकता है।',
      },
      {
        title: 'असर',
        text: 'असर सिर्फ़ चुने गए तरीके पर नहीं, बल्कि उसे सही ढंग से और नियमित रूप से इस्तेमाल करने पर भी निर्भर करता है।',
      },
    ],
    rhythmTitle: 'कितनी बार इस्तेमाल करना पड़ता है',
    rhythmBody: 'तरीकों के बीच एक अहम फ़र्क़ यह है कि आपको अपने गर्भनिरोध के बारे में कितनी बार सोचना पड़ता है।',
    comparison: [
      {
        title: 'गोली',
        detail: 'रोज़ लेनी होती है',
      },
      {
        title: 'पैच',
        detail: 'हर हफ़्ते बदलना होता है',
      },
      {
        title: 'वजाइनल रिंग',
        detail: 'कई हफ़्तों का चक्र',
      },
      {
        title: 'इम्प्लांट',
        detail: 'लंबे समय तक चलने वाला समाधान',
      },
      {
        title: 'हार्मोनल IUD',
        detail: 'लंबे समय तक चलने वाला समाधान',
      },
    ],
    bodyReactionTitle: 'देखें कि आपका शरीर कैसी प्रतिक्रिया देता है',
    bodyReactionText: 'हार्मोनल तरीका हर महिला को अलग महसूस हो सकता है। कुछ महिलाओं को अपने चक्र, रक्तस्राव या दूसरे साइड इफ़ेक्ट में बदलाव दिखते हैं। इन प्रतिक्रियाओं का मतलब अपने आप यह नहीं कि तरीका आपके लिए सही नहीं है, लेकिन इन पर ध्यान देना ज़रूरी है।',
    alertTitle: 'किन बातों पर नज़र रखें',
    alertText: 'अगर कोई असर ज़्यादा, लगातार या असामान्य हो, तो अपने सवालों के साथ अकेली न रहें। डॉक्टर, दाई-नर्स (मिडवाइफ़) या कोई दूसरा स्वास्थ्य विशेषज्ञ यह तय करने में मदद कर सकता है कि तरीका जारी रखें, उसमें बदलाव करें या उसे बदल दें।',
    projectsTitle: 'अपनी योजनाओं का ध्यान रखें',
    projectsBody: 'आपकी गर्भावस्था की योजनाएँ भी आपके चुनाव पर असर डाल सकती हैं। अगर आप कई साल तक गर्भवती नहीं होना चाहतीं, तो लंबे समय तक चलने वाला तरीका सोचने लायक हो सकता है। अगर आप जल्द गर्भवती होने के बारे में सोच रही हैं, तो दूसरे विकल्प आपकी समय-सीमा के लिए बेहतर हो सकते हैं।',
    keepInMindTitle: 'ध्यान रखने लायक बात',
    keepInMindText: 'अपनी गर्भावस्था की योजनाओं के बारे में बात करना, भले ही वे अभी दूर हों या तय न हों, स्वास्थ्य विशेषज्ञ को बातचीत में बेहतर मार्गदर्शन करने में मदद करता है।',
    section4Body: 'अपॉइंटमेंट में आप हर तरीके के फ़ायदे, पाबंदियों और संभावित मनाही (कॉन्ट्राइंडिकेशन) को तौल सकती हैं। आप पहले से कुछ सवाल तैयार कर सकती हैं, ताकि कोई ज़रूरी बात छूट न जाए।',
    questionCardTitle: 'पूछने लायक काम के सवाल',
    professionalQuestions: [
      'इस तरीके से मुझे क्या फ़ायदे हैं?',
      'मुझे कौन-से साइड इफ़ेक्ट हो सकते हैं?',
      'इसे सही तरीके से कैसे इस्तेमाल करूँ?',
      'अगर मैं इसे लेना भूल जाऊँ, यह अपनी जगह से खिसक जाए, या मैं इसे बंद करना चाहूँ, तो क्या करूँ?',
      'क्या यह तरीका मेरी गर्भावस्था की योजनाओं के साथ ठीक बैठता है?',
    ],
    professionalTipTitle: 'जानना अच्छा रहेगा',
    professionalTipText: 'दाई-नर्स (मिडवाइफ़) या डॉक्टर कोई तरीका सुझाने से पहले आपका मेडिकल इतिहास, चल रहा इलाज, आपकी पसंद और जीवनशैली ध्यान में रख सकते हैं।',
    summaryTitle: 'ज़रूरी बातें',
    summaryItems: [
      'ऐसा तरीका चुनें जो आपकी रोज़मर्रा की ज़िंदगी में फ़िट बैठे।',
      'अपनी सहनशीलता और पसंद का ध्यान रखें।',
      'अपनी गर्भावस्था की योजनाओं और समय-सीमा के बारे में सोचें।',
      'अगर आप निश्चित नहीं हैं, तो किसी विशेषज्ञ से सलाह लें।',
    ],
    finalTipTitle: 'याद रखें',
    finalTipText: 'सबसे अच्छा तरीका वह नहीं जो सबसे सुविधाजनक या सबसे लोकप्रिय लगे। सबसे अच्छा वह है जो आपकी स्थिति, ज़रूरतों और पसंद के अनुकूल हो, स्वास्थ्य विशेषज्ञ से सोच-समझकर बात करने के बाद।',
    disclaimerText: 'यह लेख सिर्फ़ जानकारी के लिए है और व्यक्तिगत चिकित्सकीय सलाह का विकल्प नहीं है।',
    shareMessage: 'अपने लिए सही तरीका चुनना — AWA',
  },
  sq: {
    badge: 'ZGJEDHJA E METODËS TËNDE',
    title: 'Zgjedhja e trajtimit\nqë të përshtatet ty',
    metaDuration: '7 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Mesatar',
    metaValidated: 'Përmbajtje e shqyrtuar',
    intro: 'Pyetjet e duhura që mund t’i bësh vetes për të gjetur një metodë kontraceptive që i përshtatet jetës sate të përditshme, nevojave të tua dhe planeve të tua.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Pyetjet që mund t’i bësh vetes',
      'Asnjë metodë nuk është “më e mira” në mënyrë absolute',
      'Kriteret që mund të bëjnë dallimin',
      'Biseda me një profesionist',
      'Çfarë të mbash mend',
    ],
    section1Body: 'Nuk ka një metodë kontraceptive të vetme ideale për të gjitha. Para se të zgjedhësh një metodë, mund të të ndihmojë të mendosh për zakonet, preferencat, tolerancën dhe planet e tua.',
    questions: [
      'Si reagon trupi im ndaj hormoneve?',
      'A kam nevojë për një veprim ditor ose javor, apo për një zgjidhje afatgjatë?',
      'A kam një plan për shtatzëni në afat të mesëm?',
      'Sa është buxheti im dhe sa e arritshme është kjo metodë kontraceptive?',
    ],
    section2Body: 'Dy persona mund të zgjedhin metoda të ndryshme dhe të dyja kanë bërë një zgjedhje krejtësisht të përshtatshme për situatën e tyre. Zgjedhja e duhur varet veçanërisht nga mënyra se si dëshiron ta përdorësh kontracepsionin dhe nga ajo që kërkon.',
    highlightTitle: 'Gjëja kryesore për të mbajtur mend',
    highlightText: 'Një metodë që duket tërheqëse në teori nuk është domosdoshmërisht ajo që do të jetë më e thjeshta ose më e rehatshmja për ty në jetën e përditshme.',
    section3Body: 'Për të krahasuar disa mundësi, mund të shikosh kritere të ndryshme. Qëllimi nuk është t’i dish të gjitha përmendsh, por të identifikosh çfarë është vërtet e rëndësishme për ty.',
    priorities: [
      {
        title: 'Thjeshtësia',
        text: 'Disa metoda kërkojnë një veprim ditor, ndërsa të tjera kërkojnë vëmendje vetëm një herë në javë, ose shumë më rrallë.',
      },
      {
        title: 'Toleranca',
        text: 'Efektet që ndjen mund të ndryshojnë nga një person te tjetri. Është e rëndësishme të vëzhgosh se si reagon trupi yt dhe të flasësh për këtë nëse të shqetëson diçka.',
      },
      {
        title: 'Planet për shtatzëni',
        text: 'Nëse shpreson për një shtatzëni së shpejti, kohëzgjatja e përdorimit dhe kthimi i pjellorisë pas ndërprerjes mund të jenë pjesë e asaj që diskuton.',
      },
      {
        title: 'Efektiviteti',
        text: 'Efektiviteti varet jo vetëm nga metoda e zgjedhur, por edhe nga përdorimi i saj i saktë dhe i vazhdueshëm.',
      },
    ],
    rhythmTitle: 'Sa shpesh duhet ta përdorësh',
    rhythmBody: 'Një ndryshim i rëndësishëm midis metodave është sa shpesh duhet të mendosh për kontracepsionin.',
    comparison: [
      {
        title: 'Tableta',
        detail: 'Veprim ditor',
      },
      {
        title: 'Arna (flasteri)',
        detail: 'Ndërrim javor',
      },
      {
        title: 'Unaza vaginale',
        detail: 'Cikël prej disa javësh',
      },
      {
        title: 'Implanti',
        detail: 'Zgjidhje afatgjatë',
      },
      {
        title: 'Spiralja hormonale',
        detail: 'Zgjidhje afatgjatë',
      },
    ],
    bodyReactionTitle: 'Vëzhgo se si reagon trupi yt',
    bodyReactionText: 'Një metodë hormonale mund të ndihet ndryshe nga një person te tjetri. Disa vënë re ndryshime në ciklin e tyre, në rrjedhjen e gjakut ose efekte të tjera anësore. Këto reagime nuk do të thonë automatikisht që metoda nuk të përshtatet, por ia vlen t’u kushtosh vëmendje.',
    alertTitle: 'Ia vlen të vëzhgosh',
    alertText: 'Nëse një efekt është i konsiderueshëm, vazhdon për një kohë të gjatë ose është i pazakontë, mos i mbaj pyetjet vetëm për vete. Një mjek, një mami ose një profesionist tjetër i shëndetësisë mund të të ndihmojë të përcaktosh nëse duhet të vazhdosh, të rregullosh apo të ndërrosh metodën.',
    projectsTitle: 'Merr parasysh planet e tua',
    projectsBody: 'Planet e tua për shtatzëni mund të ndikojnë gjithashtu në zgjedhjen tënde. Nëse dëshiron të shmangësh shtatzëninë për disa vjet, një metodë afatgjatë mund të ia vlejë të merret në konsideratë. Nëse po mendon për një shtatzëni më shpejt, mundësi të tjera mund të përshtaten më mirë me afatin tënd.',
    keepInMindTitle: 'Ia vlen ta mbash mend',
    keepInMindText: 'Të flasësh për planet e tua për shtatzëni, edhe nëse janë ende të largëta ose të pasigurta, e ndihmon profesionistin e shëndetësisë ta udhëheqë më mirë bisedën.',
    section4Body: 'Një takim të lejon të peshosh përfitimet, kufizimet dhe kundërindikacionet e mundshme të secilës metodë. Mund të përgatisësh disa pyetje paraprakisht që të mos harrosh asgjë të rëndësishme.',
    questionCardTitle: 'Pyetje të dobishme për t’u bërë',
    professionalQuestions: [
      'Cilat janë përfitimet e kësaj metode për mua?',
      'Çfarë efektesh anësore mund të përjetoj?',
      'Si ta përdor saktë?',
      'Çfarë duhet të bëj nëse e harroj, nëse lëviz nga vendi ose nëse dua ta ndërpres?',
      'A përshtatet kjo metodë me planet e mia për shtatzëni?',
    ],
    professionalTipTitle: 'Mirë është ta dish',
    professionalTipText: 'Një mami ose një mjek mund të marrë parasysh historikun tënd mjekësor, trajtimet, preferencat dhe stilin e jetës para se të rekomandojë një metodë.',
    summaryTitle: 'Thelbi',
    summaryItems: [
      'Zgjidh një metodë që i përshtatet jetës sate të përditshme.',
      'Merr parasysh tolerancën dhe preferencat e tua.',
      'Mendo për planet e tua për shtatzëni dhe për afatin tënd.',
      'Kërko këshillën e një profesionisti nëse nuk je e sigurt.',
    ],
    finalTipTitle: 'Mbaje mend',
    finalTipText: 'Metoda më e mirë nuk është domosdoshmërisht ajo që duket më e përshtatshme ose më e popullarizuar. Është ajo që i përshtatet situatës sate, nevojave të tua dhe preferencave të tua, pas një bisede të informuar me një profesionist të shëndetësisë.',
    disclaimerText: 'Ky artikull është vetëm për qëllime informuese dhe nuk zëvendëson këshillën mjekësore të personalizuar.',
    shareMessage: 'Zgjedhja e trajtimit që të përshtatet ty — AWA',
  },
  ja: {
    badge: '方法の選び方',
    title: '自分に合った\n方法を選ぶ',
    metaDuration: '読了まで7分',
    metaType: 'ガイド',
    metaLevel: '中級',
    metaValidated: '確認済みの内容',
    intro: '日々の生活や必要なこと、今後の計画に合った避妊法を見つけるために、自分に問いかけたい大切なことをまとめました。',
    contentsTitle: 'この記事の内容',
    topics: [
      '自分に問いかけたいこと',
      '絶対的に「最良」の方法はありません',
      '違いを生む可能性のある基準',
      '専門家に相談する',
      '要点',
    ],
    section1Body: '誰にとっても理想的な避妊法が1つだけあるわけではありません。方法を選ぶ前に、ふだんの習慣や好み、体への合いやすさ、今後の計画について考えてみると役立ちます。',
    questions: [
      'ホルモンに対して、体はどのように反応するだろう？',
      '毎日または毎週の操作が必要なものと、長く効くものと、どちらが合っているだろう？',
      '近い将来に妊娠の計画はあるだろうか？',
      '予算はどのくらいで、その避妊法はどのくらい利用しやすいだろう？',
    ],
    section2Body: '2人の人が異なる方法を選んでも、どちらもそれぞれの状況にぴったり合った選択であることがあります。適した選択は、避妊をどのように取り入れたいか、何を求めているかによって変わります。',
    highlightTitle: '覚えておきたいこと',
    highlightText: '紙の上では魅力的に見える方法が、日々の暮らしの中でいちばん簡単で快適だとは限りません。',
    section3Body: 'いくつかの選択肢を比べるときは、さまざまな基準を見てみましょう。すべてを暗記することが目的ではなく、自分にとって本当に大切なことを見つけることが大切です。',
    priorities: [
      {
        title: '手軽さ',
        text: '毎日の操作が必要な方法もあれば、週に1回の確認で済む方法や、それよりずっと少ない頻度で済む方法もあります。',
      },
      {
        title: '体への合いやすさ',
        text: '感じる影響には個人差があります。体がどう反応するかに気づき、気になることがあれば相談することが大切です。',
      },
      {
        title: '妊娠の計画',
        text: '近いうちに妊娠を望んでいる場合は、使用する期間や、やめた後に妊娠しやすさが戻ることについても話し合うとよいでしょう。',
      },
      {
        title: '効果',
        text: '効果は、選んだ方法だけでなく、正しく継続して使うことにも左右されます。',
      },
    ],
    rhythmTitle: 'どのくらいの頻度で使うか',
    rhythmBody: '方法によって大きく違う点の1つが、避妊のことをどのくらいの頻度で意識する必要があるかです。',
    comparison: [
      {
        title: 'ピル',
        detail: '毎日の操作',
      },
      {
        title: 'パッチ',
        detail: '週に1回の交換',
      },
      {
        title: '腟リング',
        detail: '数週間の周期',
      },
      {
        title: 'インプラント',
        detail: '長く効く方法',
      },
      {
        title: 'ホルモン放出IUD',
        detail: '長く効く方法',
      },
    ],
    bodyReactionTitle: '体の反応に気を配る',
    bodyReactionText: 'ホルモンを使う方法は、人によって感じ方が異なることがあります。周期や出血の変化、そのほかの副作用に気づく人もいます。こうした反応があっても、その方法が合わないとは限りませんが、注意して見ておくことが大切です。',
    alertTitle: '注意したいこと',
    alertText: '影響が大きい、長く続く、またはいつもと違うと感じるときは、1人で悩まないでください。医師や助産師などの医療従事者が、続けるか、調整するか、別の方法に変えるかを一緒に考えてくれます。',
    projectsTitle: '計画を考慮に入れる',
    projectsBody: '妊娠の計画も選択に影響することがあります。この先数年は妊娠を避けたい場合は、長く効く方法を検討する価値があるかもしれません。もっと早く妊娠を考えている場合は、ほかの選択肢のほうが予定に合うことがあります。',
    keepInMindTitle: '心に留めておきたいこと',
    keepInMindText: '妊娠の計画が先のことでも、まだはっきりしていなくても、医療従事者に伝えておくと、話し合いをより的確に進めてもらえます。',
    section4Body: '診察では、それぞれの方法の利点や制約、考えられる禁忌について検討できます。大切なことを聞き忘れないよう、事前にいくつか質問を準備しておくこともできます。',
    questionCardTitle: '聞いておくと役立つ質問',
    professionalQuestions: [
      'この方法は、自分にとってどのような利点がありますか？',
      'どのような副作用が出る可能性がありますか？',
      '正しく使うにはどうすればよいですか？',
      '使い忘れたとき、ずれてしまったとき、やめたくなったときは、どうすればよいですか？',
      'この方法は、自分の妊娠の計画に合っていますか？',
    ],
    professionalTipTitle: '知っておくと役立つこと',
    professionalTipText: '助産師や医師は、方法をすすめる前に、病歴、使用中の治療、希望、生活スタイルを考慮に入れることができます。',
    summaryTitle: '要点',
    summaryItems: [
      '日々の生活に合った方法を選びましょう。',
      '体への合いやすさと好みを考慮しましょう。',
      '妊娠の計画と時期を考えましょう。',
      '迷ったときは、専門家に相談しましょう。',
    ],
    finalTipTitle: '覚えておきましょう',
    finalTipText: '最良の方法とは、いちばん便利そうに見える方法や、いちばん多くの人が使っている方法とは限りません。医療従事者との十分な話し合いを経て、自分の状況や必要なこと、好みに合った方法が最良の方法です。',
    disclaimerText: 'この記事は情報提供のみを目的としており、一人ひとりに合わせた医療上のアドバイスに代わるものではありません。',
    shareMessage: '自分に合った方法を選ぶ — AWA',
  },
  ko: {
    badge: '나에게 맞는 방법 찾기',
    title: '나에게 맞는\n피임 방법 고르기',
    metaDuration: '읽는 시간 7분',
    metaType: '가이드',
    metaLevel: '중급',
    metaValidated: '검토된 콘텐츠',
    intro: '일상과 필요, 계획에 맞는 피임 방법을 찾기 위해 스스로에게 던져 볼 만한 질문들이에요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '스스로에게 던져 볼 질문',
      '절대적으로 “가장 좋은” 방법은 없어요',
      '차이를 만들 수 있는 기준',
      '전문가와 상담하기',
      '핵심 정리',
    ],
    section1Body: '모든 사람에게 맞는 이상적인 피임 방법이 하나로 정해져 있지는 않아요. 방법을 고르기 전에 생활 습관, 선호, 몸의 적응 정도, 앞으로의 계획을 생각해 보면 도움이 될 수 있어요.',
    questions: [
      '내 몸은 호르몬에 어떻게 반응할까?',
      '매일 또는 매주 챙겨야 하는 방법이 필요할까, 아니면 오래 지속되는 방법이 필요할까?',
      '가까운 미래에 임신 계획이 있을까?',
      '예산은 어느 정도이고, 이 피임 방법은 얼마나 구하기 쉬울까?',
    ],
    section2Body: '두 사람이 서로 다른 방법을 선택해도, 둘 다 각자의 상황에 꼭 맞는 선택을 한 것일 수 있어요. 올바른 선택은 특히 피임을 어떻게 사용하고 싶은지, 무엇을 원하는지에 따라 달라져요.',
    highlightTitle: '꼭 기억해 두세요',
    highlightText: '겉보기에 좋아 보이는 방법이 날마다 가장 간편하고 편안한 방법이라고는 할 수 없어요.',
    section3Body: '여러 선택지를 비교할 때는 다양한 기준을 살펴볼 수 있어요. 모든 것을 외우는 것이 아니라, 나에게 정말 중요한 것이 무엇인지 알아보는 것이 목표예요.',
    priorities: [
      {
        title: '간편함',
        text: '어떤 방법은 매일 챙겨야 하고, 어떤 방법은 매주 한 번만 신경 쓰면 되거나 그보다 훨씬 드물게 신경 쓰면 돼요.',
      },
      {
        title: '적응 정도',
        text: '느끼는 영향은 사람마다 다를 수 있어요. 내 몸이 어떻게 반응하는지 살펴보고, 불편한 점이 있으면 이야기하는 것이 중요해요.',
      },
      {
        title: '임신 계획',
        text: '곧 임신을 바란다면 사용 기간과 중단한 뒤 임신 가능성이 돌아오는 시기도 상담할 내용에 포함될 수 있어요.',
      },
      {
        title: '효과',
        text: '효과는 선택한 방법뿐 아니라 올바르게, 꾸준히 사용하는지에도 달려 있어요.',
      },
    ],
    rhythmTitle: '얼마나 자주 사용해야 할까요',
    rhythmBody: '방법마다 중요한 차이 중 하나는 피임을 얼마나 자주 챙겨야 하는지예요.',
    comparison: [
      {
        title: '피임약',
        detail: '매일 복용',
      },
      {
        title: '피임 패치',
        detail: '매주 교체',
      },
      {
        title: '질링',
        detail: '몇 주 단위의 주기',
      },
      {
        title: '피임 임플란트',
        detail: '오래 지속되는 방법',
      },
      {
        title: '호르몬 자궁 내 장치',
        detail: '오래 지속되는 방법',
      },
    ],
    bodyReactionTitle: '내 몸의 반응 살펴보기',
    bodyReactionText: '호르몬 방법은 사람마다 느낌이 다를 수 있어요. 어떤 사람은 주기나 출혈에 변화를 느끼거나 다른 부작용을 겪기도 해요. 이런 반응이 곧 그 방법이 나에게 맞지 않는다는 뜻은 아니지만, 주의 깊게 살펴볼 필요는 있어요.',
    alertTitle: '주의해서 살펴보세요',
    alertText: '증상이 심하거나 계속되거나 평소와 다르다면 혼자 고민하지 마세요. 의사, 조산사 또는 다른 의료 전문가가 방법을 계속할지, 조정할지, 바꿀지 판단하는 데 도움을 줄 수 있어요.',
    projectsTitle: '나의 계획 고려하기',
    projectsBody: '임신 계획도 선택에 영향을 줄 수 있어요. 몇 년 동안 임신을 피하고 싶다면 오래 지속되는 방법을 고려해 볼 만해요. 더 이른 시기에 임신을 생각하고 있다면 다른 선택지가 일정에 더 잘 맞을 수 있어요.',
    keepInMindTitle: '기억해 두면 좋아요',
    keepInMindText: '임신 계획이 아직 먼 이야기이거나 확실하지 않더라도 이야기해 두면 의료 전문가가 상담을 더 잘 이끌 수 있어요.',
    section4Body: '진료를 받으면 각 방법의 장점, 제약, 사용하면 안 되는 경우(금기)를 함께 따져 볼 수 있어요. 중요한 것을 놓치지 않도록 미리 몇 가지 질문을 준비해 갈 수 있어요.',
    questionCardTitle: '물어보면 좋은 질문',
    professionalQuestions: [
      '이 방법이 나에게 어떤 장점이 있나요?',
      '어떤 부작용이 생길 수 있나요?',
      '어떻게 올바르게 사용하나요?',
      '깜빡했을 때, 제자리에서 벗어났을 때, 또는 중단하고 싶을 때는 어떻게 해야 하나요?',
      '이 방법이 제 임신 계획과 맞나요?',
    ],
    professionalTipTitle: '알아 두세요',
    professionalTipText: '조산사나 의사는 방법을 권하기 전에 병력, 복용 중인 치료, 선호, 생활 방식을 함께 고려할 수 있어요.',
    summaryTitle: '핵심만 짚어 볼게요',
    summaryItems: [
      '일상에 맞는 방법을 고르세요.',
      '몸의 적응 정도와 선호를 고려하세요.',
      '임신 계획과 일정을 생각해 보세요.',
      '확신이 서지 않으면 전문가에게 조언을 구하세요.',
    ],
    finalTipTitle: '기억하세요',
    finalTipText: '가장 좋은 방법이 가장 편해 보이거나 가장 인기 있는 방법인 것은 아니에요. 의료 전문가와 충분히 이야기를 나눈 뒤 내 상황과 필요, 선호에 맞게 고른 방법이 가장 좋은 방법이에요.',
    disclaimerText: '이 아티클은 정보 제공을 위한 것이며, 개인에게 맞춘 의학적 조언을 대신하지 않아요.',
    shareMessage: '나에게 맞는 피임 방법 고르기 — AWA',
  },
  'pt-PT': {
    badge: 'ESCOLHER O SEU MÉTODO',
    title: 'Escolher o tratamento\nque lhe convém',
    metaDuration: '7 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Intermédio',
    metaValidated: 'Conteúdo revisto',
    intro: 'As perguntas certas a colocar a si própria para encontrar um método contracetivo adequado ao seu dia a dia, às suas necessidades e aos seus projetos.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Perguntas a colocar a si própria',
      'Nenhum método é o “melhor” em termos absolutos',
      'Critérios que podem fazer a diferença',
      'Conversar com um profissional',
      'Pontos essenciais',
    ],
    section1Body: 'Não existe um único método contracetivo ideal para todas as mulheres. Antes de escolher um método, pode ser útil refletir sobre os seus hábitos, preferências, tolerância e projetos.',
    questions: [
      'Como reage o meu corpo às hormonas?',
      'Preciso de uma ação diária ou semanal, ou de uma solução de longa duração?',
      'Tenho um projeto de gravidez a médio prazo?',
      'Qual é o meu orçamento e qual a acessibilidade deste método contracetivo?',
    ],
    section2Body: 'Duas pessoas podem escolher métodos diferentes e ambas ter feito uma escolha perfeitamente adequada à sua situação. A escolha certa depende, em particular, da forma como deseja utilizar a sua contraceção e do que procura.',
    highlightTitle: 'O essencial a reter',
    highlightText: 'Um método que parece atraente no papel não é necessariamente o mais simples ou o mais confortável para si no dia a dia.',
    section3Body: 'Para comparar várias opções, pode analisar diferentes critérios. O objetivo não é saber tudo de cor, mas identificar o que realmente importa para si.',
    priorities: [
      {
        title: 'Simplicidade',
        text: 'Alguns métodos exigem uma ação diária, enquanto outros requerem apenas uma atenção semanal, ou muito menos frequente.',
      },
      {
        title: 'Tolerância',
        text: 'Os efeitos sentidos podem variar de pessoa para pessoa. É importante observar como o seu corpo reage e falar sobre isso se algo a incomodar.',
      },
      {
        title: 'Projetos de gravidez',
        text: 'Se pretende uma gravidez em breve, a duração da utilização e o regresso da fertilidade após a interrupção podem fazer parte do que vai discutir.',
      },
      {
        title: 'Eficácia',
        text: 'A eficácia depende não só do método escolhido, mas também de o utilizar corretamente e de forma regular.',
      },
    ],
    rhythmTitle: 'Com que frequência é preciso utilizá-lo',
    rhythmBody: 'Uma diferença importante entre os métodos é a frequência com que precisa de pensar na sua contraceção.',
    comparison: [
      {
        title: 'Pílula',
        detail: 'Ação diária',
      },
      {
        title: 'Adesivo',
        detail: 'Troca semanal',
      },
      {
        title: 'Anel vaginal',
        detail: 'Ciclo de várias semanas',
      },
      {
        title: 'Implante',
        detail: 'Solução de longa duração',
      },
      {
        title: 'DIU hormonal',
        detail: 'Solução de longa duração',
      },
    ],
    bodyReactionTitle: 'Observar como o seu corpo reage',
    bodyReactionText: 'Um método hormonal pode ser sentido de forma diferente de pessoa para pessoa. Algumas mulheres notam alterações no ciclo, no sangramento ou outros efeitos secundários. Estas reações não significam automaticamente que o método não é adequado para si, mas merecem a sua atenção.',
    alertTitle: 'A ter em atenção',
    alertText: 'Se um efeito for significativo, persistente ou invulgar, não fique sozinha com as suas dúvidas. Um médico, uma parteira ou outro profissional de saúde pode ajudá-la a determinar se deve continuar, ajustar ou mudar de método.',
    projectsTitle: 'Ter em conta os seus projetos',
    projectsBody: 'Os seus projetos de gravidez também podem influenciar a sua escolha. Se deseja evitar uma gravidez durante vários anos, um método de longa duração pode ser uma opção a considerar. Se pensa numa gravidez a mais curto prazo, outras opções podem adequar-se melhor ao seu calendário.',
    keepInMindTitle: 'A ter presente',
    keepInMindText: 'Falar dos seus projetos de gravidez, mesmo que ainda distantes ou incertos, ajuda o profissional de saúde a orientar melhor a conversa.',
    section4Body: 'Uma consulta permite ponderar os benefícios, as limitações e as possíveis contraindicações de cada método. Pode preparar algumas perguntas com antecedência para não se esquecer de nada importante.',
    questionCardTitle: 'Perguntas úteis a colocar',
    professionalQuestions: [
      'Quais são os benefícios deste método para mim?',
      'Que efeitos secundários posso sentir?',
      'Como o utilizo corretamente?',
      'O que devo fazer se me esquecer dele, se ele se deslocar ou se quiser interrompê-lo?',
      'Este método é compatível com os meus projetos de gravidez?',
    ],
    professionalTipTitle: 'Bom saber',
    professionalTipText: 'Uma parteira ou um médico pode ter em conta o seu historial médico, os seus tratamentos, as suas preferências e o seu estilo de vida antes de recomendar um método.',
    summaryTitle: 'O essencial',
    summaryItems: [
      'Escolha um método que se adapte ao seu dia a dia.',
      'Tenha em conta a sua tolerância e as suas preferências.',
      'Pense nos seus projetos de gravidez e no seu calendário.',
      'Peça conselho a um profissional se tiver dúvidas.',
    ],
    finalTipTitle: 'Lembre-se',
    finalTipText: 'O melhor método não é necessariamente o que parece mais prático ou o mais popular. É aquele que se adapta à sua situação, às suas necessidades e às suas preferências, após uma conversa informada com um profissional de saúde.',
    disclaimerText: 'Este artigo tem apenas fins informativos e não substitui um aconselhamento médico personalizado.',
    shareMessage: 'Escolher o tratamento que lhe convém — AWA',
  },
  bn: {
    badge: 'আপনার পদ্ধতি বেছে নেওয়া',
    title: 'আপনার জন্য উপযুক্ত\nপদ্ধতি বেছে নেওয়া',
    metaDuration: '7 মিনিটের পাঠ',
    metaType: 'গাইড',
    metaLevel: 'মধ্যম',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'আপনার দৈনন্দিন জীবন, প্রয়োজন ও পরিকল্পনার সঙ্গে মানানসই জন্মনিয়ন্ত্রণ পদ্ধতি খুঁজে পেতে নিজেকে যে সঠিক প্রশ্নগুলো করা উচিত।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'নিজেকে যে প্রশ্নগুলো করবেন',
      'কোনো পদ্ধতিই সবদিক থেকে “সেরা” নয়',
      'যেসব বিষয় পার্থক্য গড়ে দিতে পারে',
      'পেশাজীবীর সঙ্গে আলোচনা',
      'মূল বিষয়গুলো',
    ],
    section1Body: 'সবার জন্য একটিমাত্র আদর্শ জন্মনিয়ন্ত্রণ পদ্ধতি নেই। কোনো পদ্ধতি বেছে নেওয়ার আগে আপনার অভ্যাস, পছন্দ, সহ্যক্ষমতা ও পরিকল্পনার কথা ভেবে দেখলে সুবিধা হতে পারে।',
    questions: [
      'হরমোনের প্রতি আমার শরীর কেমন সাড়া দেয়?',
      'আমার কি প্রতিদিন বা প্রতি সপ্তাহে কিছু করার দরকার, নাকি দীর্ঘমেয়াদি সমাধান দরকার?',
      'মাঝারি মেয়াদে গর্ভধারণের কোনো পরিকল্পনা কি আমার আছে?',
      'আমার বাজেট কত, আর এই জন্মনিয়ন্ত্রণ পদ্ধতি কতটা সহজলভ্য?',
    ],
    section2Body: 'দুজন মানুষ ভিন্ন ভিন্ন পদ্ধতি বেছে নিলেও দুজনেরই নিজ নিজ পরিস্থিতির সঙ্গে সম্পূর্ণ মানানসই সিদ্ধান্ত নেওয়া হতে পারে। সঠিক পছন্দ নির্ভর করে বিশেষ করে আপনি আপনার জন্মনিয়ন্ত্রণ কীভাবে ব্যবহার করতে চান এবং কী খুঁজছেন তার ওপর।',
    highlightTitle: 'মনে রাখার মূল কথা',
    highlightText: 'কাগজে-কলমে আকর্ষণীয় মনে হওয়া পদ্ধতিটিই যে প্রতিদিনের জীবনে আপনার জন্য সবচেয়ে সহজ বা আরামদায়ক হবে, তা নয়।',
    section3Body: 'কয়েকটি বিকল্প তুলনা করতে আপনি বিভিন্ন মানদণ্ড দেখতে পারেন। উদ্দেশ্য সবকিছু মুখস্থ করা নয়, বরং আপনার কাছে আসলে কোনটি গুরুত্বপূর্ণ তা চিহ্নিত করা।',
    priorities: [
      {
        title: 'সহজ ব্যবহার',
        text: 'কিছু পদ্ধতিতে প্রতিদিন কিছু করতে হয়, আবার কিছু পদ্ধতিতে শুধু সাপ্তাহিক মনোযোগ বা তার চেয়েও কম প্রয়োজন হয়।',
      },
      {
        title: 'সহ্যক্ষমতা',
        text: 'আপনি যেসব প্রভাব অনুভব করেন তা একজন থেকে আরেকজনে ভিন্ন হতে পারে। আপনার শরীর কেমন সাড়া দিচ্ছে তা লক্ষ করা এবং কিছু অস্বস্তিকর লাগলে সে বিষয়ে কথা বলা গুরুত্বপূর্ণ।',
      },
      {
        title: 'গর্ভধারণের পরিকল্পনা',
        text: 'শিগগিরই গর্ভধারণের আশা থাকলে ব্যবহারের মেয়াদ এবং পদ্ধতি বন্ধ করার পর প্রজনন ক্ষমতা কখন ফিরে আসে, তা আলোচনার অংশ হতে পারে।',
      },
      {
        title: 'কার্যকারিতা',
        text: 'কার্যকারিতা শুধু বেছে নেওয়া পদ্ধতির ওপর নয়, বরং সেটি সঠিকভাবে ও নিয়মিত ব্যবহারের ওপরও নির্ভর করে।',
      },
    ],
    rhythmTitle: 'কত ঘন ঘন ব্যবহার করতে হয়',
    rhythmBody: 'বিভিন্ন পদ্ধতির মধ্যে একটি গুরুত্বপূর্ণ পার্থক্য হলো, জন্মনিয়ন্ত্রণের কথা আপনাকে কত ঘন ঘন মনে রাখতে হয়।',
    comparison: [
      {
        title: 'বড়ি',
        detail: 'প্রতিদিন ব্যবহার',
      },
      {
        title: 'প্যাচ',
        detail: 'সাপ্তাহিক পরিবর্তন',
      },
      {
        title: 'যোনিপথের রিং',
        detail: 'কয়েক সপ্তাহের চক্র',
      },
      {
        title: 'ইমপ্ল্যান্ট',
        detail: 'দীর্ঘমেয়াদি সমাধান',
      },
      {
        title: 'হরমোনযুক্ত আইইউডি',
        detail: 'দীর্ঘমেয়াদি সমাধান',
      },
    ],
    bodyReactionTitle: 'আপনার শরীর কেমন সাড়া দিচ্ছে তা লক্ষ করা',
    bodyReactionText: 'হরমোনযুক্ত পদ্ধতি একজন থেকে আরেকজনে ভিন্নভাবে অনুভূত হতে পারে। কেউ কেউ তাঁদের চক্র, রক্তক্ষরণ বা অন্যান্য পার্শ্বপ্রতিক্রিয়ায় পরিবর্তন লক্ষ করেন। এসব প্রতিক্রিয়ার অর্থ এই নয় যে পদ্ধতিটি স্বয়ংক্রিয়ভাবে আপনার জন্য অনুপযুক্ত, তবে এগুলোর প্রতি মনোযোগ দেওয়া উচিত।',
    alertTitle: 'যা লক্ষ রাখা উচিত',
    alertText: 'কোনো প্রভাব উল্লেখযোগ্য, দীর্ঘস্থায়ী বা অস্বাভাবিক হলে আপনার প্রশ্নগুলো নিয়ে একা থাকবেন না। ডাক্তার, ধাত্রী বা অন্য কোনো স্বাস্থ্যসেবা পেশাজীবী আপনাকে সিদ্ধান্ত নিতে সাহায্য করতে পারেন যে পদ্ধতিটি চালিয়ে যাবেন, সমন্বয় করবেন, নাকি বদলাবেন।',
    projectsTitle: 'আপনার পরিকল্পনা বিবেচনায় নেওয়া',
    projectsBody: 'আপনার গর্ভধারণের পরিকল্পনাও আপনার পছন্দকে প্রভাবিত করতে পারে। আপনি যদি কয়েক বছর গর্ভধারণ এড়াতে চান, তাহলে দীর্ঘমেয়াদি পদ্ধতি বিবেচনা করা যেতে পারে। আপনি যদি আরও কাছাকাছি সময়ে গর্ভধারণের কথা ভাবেন, তাহলে অন্য বিকল্প আপনার সময়সূচির সঙ্গে বেশি মানানসই হতে পারে।',
    keepInMindTitle: 'মনে রাখার মতো বিষয়',
    keepInMindText: 'গর্ভধারণের পরিকল্পনা দূরবর্তী বা অনিশ্চিত হলেও তা নিয়ে কথা বললে স্বাস্থ্যসেবা পেশাজীবী আলোচনাটি আরও ভালোভাবে পরিচালনা করতে পারেন।',
    section4Body: 'অ্যাপয়েন্টমেন্টে প্রতিটি পদ্ধতির সুবিধা, সীমাবদ্ধতা ও সম্ভাব্য প্রতিনির্দেশনা (ব্যবহারে নিষেধ বা সতর্কতা) বিবেচনা করা যায়। গুরুত্বপূর্ণ কিছু যেন ভুলে না যান, সেজন্য আগে থেকেই কয়েকটি প্রশ্ন প্রস্তুত করে রাখতে পারেন।',
    questionCardTitle: 'জিজ্ঞাসা করার মতো কার্যকর প্রশ্ন',
    professionalQuestions: [
      'আমার জন্য এই পদ্ধতির সুবিধাগুলো কী?',
      'আমি কী কী পার্শ্বপ্রতিক্রিয়া অনুভব করতে পারি?',
      'এটি সঠিকভাবে কীভাবে ব্যবহার করব?',
      'ব্যবহার করতে ভুলে গেলে, জায়গা থেকে সরে গেলে বা বন্ধ করতে চাইলে আমার কী করা উচিত?',
      'এই পদ্ধতি কি আমার গর্ভধারণের পরিকল্পনার সঙ্গে মানানসই?',
    ],
    professionalTipTitle: 'জেনে রাখা ভালো',
    professionalTipText: 'কোনো পদ্ধতির পরামর্শ দেওয়ার আগে ধাত্রী বা ডাক্তার আপনার চিকিৎসা-ইতিহাস, চলমান চিকিৎসা, পছন্দ ও জীবনযাত্রা বিবেচনায় নিতে পারেন।',
    summaryTitle: 'মূল কথাগুলো',
    summaryItems: [
      'এমন পদ্ধতি বেছে নিন যা আপনার দৈনন্দিন জীবনের সঙ্গে মানানসই।',
      'আপনার সহ্যক্ষমতা ও পছন্দ বিবেচনায় নিন।',
      'আপনার গর্ভধারণের পরিকল্পনা ও সময়সূচির কথা ভাবুন।',
      'নিশ্চিত না হলে কোনো পেশাজীবীর পরামর্শ নিন।',
    ],
    finalTipTitle: 'মনে রাখুন',
    finalTipText: 'সবচেয়ে ভালো পদ্ধতি সেটি নয় যা সবচেয়ে সুবিধাজনক বা সবচেয়ে জনপ্রিয় মনে হয়। বরং স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে সুচিন্তিত আলোচনার পর যেটি আপনার পরিস্থিতি, প্রয়োজন ও পছন্দের সঙ্গে মানানসই, সেটিই সবচেয়ে ভালো।',
    disclaimerText: 'এই নিবন্ধ শুধুমাত্র তথ্যের উদ্দেশ্যে এবং এটি ব্যক্তিগত চিকিৎসা পরামর্শের বিকল্প নয়।',
    shareMessage: 'আপনার জন্য উপযুক্ত পদ্ধতি বেছে নেওয়া — AWA',
  },
  da: {
    badge: 'Vælg din metode',
    title: 'Vælg den metode,\nder passer til dig',
    metaDuration: '7 minutters læsning',
    metaType: 'Guide',
    metaLevel: 'Mellemsvær',
    metaValidated: 'Gennemset indhold',
    intro: 'De rigtige spørgsmål, du bør stille dig selv for at finde en prævention, der passer til din hverdag, dine behov og dine planer.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Spørgsmål du bør stille dig selv',
      'Ingen metode er "bedst" på alle måder',
      'Faktorer der kan gøre en forskel',
      'Samtale med en fagperson',
      'Det vigtigste',
    ],
    section1Body: 'Der er ingen én-størrelse-passer-alle metode til prævention. Det kan hjælpe at overveje dine vaner, præferencer, tolerance og planer, inden du vælger en metode.',
    questions: [
      'Hvordan reagerer min krop på hormoner?',
      'Har jeg brug for noget dagligt eller ugentligt, eller foretrækker jeg en langsigtet løsning?',
      'Planlægger jeg en graviditet på mellemlang sigt?',
      'Hvad er mit budget, og hvor tilgængelig er denne metode?',
    ],
    section2Body: 'To personer kan vælge forskellige metoder og begge have truffet det rigtige valg for deres situation. Det rigtige valg afhænger især af, hvordan du ønsker at bruge din prævention, og hvad du søger.',
    highlightTitle: 'Husk dette',
    highlightText: 'Den metode, der ser mest attraktiv ud på papir, er ikke nødvendigvis den, der passer bedst ind i din hverdag.',
    section3Body: 'Du kan bruge forskellige kriterier til at sammenligne mulighederne. Målet er ikke at huske alt, men at identificere, hvad der virkelig er vigtigt for dig.',
    priorities: [
      {
        title: 'Enkel i brug',
        text: 'Nogle metoder kræver daglig opmærksomhed, mens andre kun kræver ugentlig eller endnu sjældnere opfølgning.',
      },
      {
        title: 'Tolerance',
        text: 'De effekter, du mærker, kan variere fra person til person. Det er vigtigt at lægge mærke til, hvordan din krop reagerer, og tale om det, hvis noget føles ubehageligt.',
      },
      {
        title: 'Graviditetsplaner',
        text: 'Hvis du snart ønsker at blive gravid, kan brugsperioden og hvornår fertiliteten vender tilbage efter stop, være en del af overvejelserne.',
      },
      {
        title: 'Effektivitet',
        text: 'Effektiviteten afhænger ikke kun af den valgte metode, men også af om den bruges korrekt og konsekvent.',
      },
    ],
    rhythmTitle: 'Hvor ofte skal du huske det',
    rhythmBody: 'En vigtig forskel mellem metoderne er, hvor ofte du skal tænke på din prævention.',
    comparison: [
      {
        title: 'P-pille',
        detail: 'Daglig brug',
      },
      {
        title: 'Plaster',
        detail: 'Ugentlig skift',
      },
      {
        title: 'Vaginalt ringe',
        detail: 'Cyklus over nogle uger',
      },
      {
        title: 'Implantat',
        detail: 'Langsigtet løsning',
      },
      {
        title: 'Hormonspiral',
        detail: 'Langsigtet løsning',
      },
    ],
    bodyReactionTitle: 'Mærk, hvordan din krop reagerer',
    bodyReactionText: 'Hormonale metoder kan opleves forskelligt fra person til person. Nogle bemærker ændringer i deres cyklus, blødning eller andre bivirkninger. Det betyder ikke automatisk, at metoden er uegnet til dig, men det er vigtigt at være opmærksom.',
    alertTitle: 'Vær opmærksom på',
    alertText: 'Hvis en effekt er mærkbar, vedvarende eller usædvanlig, behøver du ikke sidde med dine spørgsmål alene. En læge, jordemoder eller andet sundhedspersonale kan hjælpe dig med at beslutte, om du vil fortsætte, justere eller skifte metode.',
    projectsTitle: 'Tag dine planer med i beregningen',
    projectsBody: 'Dine graviditetsplaner kan også påvirke dit valg. Hvis du ønsker at undgå graviditet i flere år, kan en langsigtet metode overvejes. Hvis du tænker på graviditet inden for en kortere periode, kan andre muligheder passe bedre til din tidsplan.',
    keepInMindTitle: 'Værd at huske',
    keepInMindText: 'Selv hvis dine graviditetsplaner er fjerne eller usikre, kan det at nævne dem hjælpe et sundhedspersonale med at guide samtalen bedre.',
    section4Body: 'Til en konsultation kan man gennemgå fordele, begrænsninger og eventuelle kontraindikationer for hver metode. Du kan forberede et par spørgsmål på forhånd, så du ikke glemmer noget vigtigt.',
    questionCardTitle: 'Nyttige spørgsmål at stille',
    professionalQuestions: [
      'Hvad er fordelene ved denne metode for mig?',
      'Hvilke bivirkninger kan jeg opleve?',
      'Hvordan bruges den korrekt?',
      'Hvad gør jeg, hvis jeg glemmer det, det falder af, eller jeg vil stoppe?',
      'Passer denne metode til mine graviditetsplaner?',
    ],
    professionalTipTitle: 'Godt at vide',
    professionalTipText: 'Inden en jordemoder eller læge anbefaler en metode, kan de tage din sygehistorie, igangværende behandlinger, præferencer og livsstil med i betragtning.',
    summaryTitle: 'Det vigtigste',
    summaryItems: [
      'Vælg en metode, der passer til din hverdag.',
      'Tag din tolerance og dine præferencer med i betragtning.',
      'Tænk over dine graviditetsplaner og din tidsplan.',
      'Søg rådgivning fra en fagperson, hvis du er usikker.',
    ],
    finalTipTitle: 'Husk',
    finalTipText: 'Den bedste metode er ikke nødvendigvis den, der virker mest praktisk eller populær. Det er den, der passer til din situation, dine behov og dine præferencer – efter en velovervejet samtale med et sundhedspersonale.',
    disclaimerText: 'Denne artikel er udelukkende til informationsformål og erstatter ikke personlig medicinsk rådgivning.',
    shareMessage: 'Vælg den metode, der passer til dig — AWA',
  },
  da: {
    badge: 'Välg din metode',
    title: 'Välg den metode,\nder passer till dig',
    metaDuration: '7 minutters läsning',
    metaType: 'Guide',
    metaLevel: 'Mellemsvär',
    metaValidated: 'Gennemset indhold',
    intro: 'De rigtige spörgsmål, du bör stille dig selv for att finde en prävention, der passer till din hverdag, dina behov och dina planer.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Spörgsmål du bör stille dig selv',
      'Ingen metode ar "bedst" på alla måder',
      'Faktorer der kan göre en forskel',
      'Samtale med en fagperson',
      'Det vigtigste',
    ],
    section1Body: 'Der ar ingen én-störrelse-passer-alle metode till prävention. Det kan hjälpe at overveje dina vaner, präferencer, tolerance och planer, inden du välger en metode.',
    questions: [
      'Hvordan reagerer min krop på hormoner?',
      'Har jag brug for noget dagligt eller veckantligt, eller foreträkker jag en langsigtet lösning?',
      'Planlägger jag en graviditet på mellemlang sigt?',
      'Hvad ar mit budget, och hvor tilgängelig ar denne metode?',
    ],
    section2Body: 'To personer kan välge forskellige metoder och begge have truffet det rigtige valg for deres situation. Det rigtige valg afhänger isär av, hvordan du önsker at bruge din prävention, och hvad du söger.',
    highlightTitle: 'Husk dette',
    highlightText: 'Den metode, der ser mest attraktiv ud på papir, ar inte nödvendigvis den, der passer bedst ind i din hverdag.',
    section3Body: 'Du kan bruge forskellige kriterier till at sammenligne mulighederne. Målet ar inte at huske alt, men at identificere, hvad der virkelig ar vigtigt for dig.',
    priorities: [
      {
        title: 'Enkel i brug',
        text: 'Nogle metoder kräver daglig opmärksomhed, mens andre kun kräver veckantlig eller annu själdnere opfölgning.',
      },
      {
        title: 'Tolerance',
        text: 'De effekter, du märker, kan variere fran person till person. Det ar vigtigt at lägge märke till, hvordan din krop reagerer, och tale om det, hvis noget föles ubehageligt.',
      },
      {
        title: 'Graviditetsplaner',
        text: 'Hvis du snart önsker at blive gravid, kan brugsperioden och hvornår fertiliteten vender tilbage efter stop, väre en del av overvejelserne.',
      },
      {
        title: 'Effektivitet',
        text: 'Effektiviteten afhänger inte kun av den valgte metode, men også av om den bruges korrekt och konsekvent.',
      },
    ],
    rhythmTitle: 'Hvor ofta skal du huske det',
    rhythmBody: 'En vigtig forskel mellem metoderne ar, hvor ofta du skal tänke på din prävention.',
    comparison: [
      {
        title: 'P-pille',
        detail: 'Daglig brug',
      },
      {
        title: 'Plaster',
        detail: 'Ugentlig skift',
      },
      {
        title: 'Vaginalt ringe',
        detail: 'Cyklus over nogle veckor',
      },
      {
        title: 'Implantat',
        detail: 'Langsigtet lösning',
      },
      {
        title: 'Hormonspiral',
        detail: 'Langsigtet lösning',
      },
    ],
    bodyReactionTitle: 'Märk, hvordan din krop reagerer',
    bodyReactionText: 'Hormonale metoder kan opleves forskelligt fran person till person. Nogle bemärker ändringer i deres cyklus, blödning eller andre bivirkninger. Det betyder inte automatisk, at metoden ar uegnet till dig, men det ar vigtigt at väre opmärksom.',
    alertTitle: 'Vär opmärksom på',
    alertText: 'Hvis en effekt ar märkbar, vedvarende eller usädvanlig, behöver du inte sidde med dina spörgsmål alene. En läge, jordemoder eller andet halsaspersonale kan hjälpe dig med at beslutte, om du vil fortsätte, justere eller skifte metode.',
    projectsTitle: 'Tag dina planer med i beregningen',
    projectsBody: 'Dine graviditetsplaner kan også påvirke ditt valg. Hvis du önsker at undgå graviditet i flere år, kan en langsigtet metode overvejes. Hvis du tänker på graviditet inden for en kortere periode, kan andre muligheder passe bedre till din tidsplan.',
    keepInMindTitle: 'Värd at huske',
    keepInMindText: 'Selv hvis dina graviditetsplaner ar fjerne eller usikre, kan det at nävne dem hjälpe et halsaspersonale med at guide samtalen bedre.',
    section4Body: 'Til en konsultation kan man gennemgå fordele, begränsninger och eventuelle kontraindikationer for hver metode. Du kan forberede et par spörgsmål på forhånd, så du inte glemmer noget vigtigt.',
    questionCardTitle: 'Nyttige spörgsmål at stille',
    professionalQuestions: [
      'Hvad ar fordelene ved denne metode for mig?',
      'Hvilke bivirkninger kan jag opleve?',
      'Hvordan bruges den korrekt?',
      'Hvad gör jeg, hvis jag glemmer det, det falder av, eller jag vil stoppe?',
      'Passer denne metode till mine graviditetsplaner?',
    ],
    professionalTipTitle: 'Godt at vide',
    professionalTipText: 'Inden en jordemoder eller läge anbefaler en metode, kan de tage din sygehistorie, igangvärende behandlinger, präferencer och livsstil med i betragtning.',
    summaryTitle: 'Det vigtigste',
    summaryItems: [
      'Välg en metode, der passer till din hverdag.',
      'Tag din tolerance och dina präferencer med i betragtning.',
      'Tänk over dina graviditetsplaner och din tidsplan.',
      'Sög rådgivning fran en fagperson, hvis du ar usikker.',
    ],
    finalTipTitle: 'Husk',
    finalTipText: 'Den bedste metode ar inte nödvendigvis den, der virker mest praktisk eller populär. Det ar den, der passer till din situation, dina behov och dina präferencer – efter en velovervejet samtale med et halsaspersonale.',
    disclaimerText: 'Denne artikel ar udelukkende till informationsformål och erstatter inte personlig medicinsk rådgivning.',
    shareMessage: 'Välg den metode, der passer till dig — AWA',
  },
  sv: {
    badge: 'Välg din metode',
    title: 'Välg den metode,\nder passer till dig',
    metaDuration: '7 minutters läsning',
    metaType: 'Guide',
    metaLevel: 'Mellemsvär',
    metaValidated: 'Gennemset indhold',
    intro: 'De rigtige spörgsmål, du bör stille dig selv for att finde en prävention, der passer till din hverdag, dina behov och dina planer.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Spörgsmål du bör stille dig selv',
      'Ingen metode ar "bedst" på alla måder',
      'Faktorer der kan göre en forskel',
      'Samtale med en fagperson',
      'Det vigtigste',
    ],
    section1Body: 'Der ar ingen én-störrelse-passer-alle metode till prävention. Det kan hjälpe at overveje dina vaner, präferencer, tolerance och planer, inden du välger en metode.',
    questions: [
      'Hvordan reagerer min krop på hormoner?',
      'Har jag brug for noget dagligt eller veckantligt, eller foreträkker jag en langsigtet lösning?',
      'Planlägger jag en graviditet på mellemlang sigt?',
      'Hvad ar mit budget, och hvor tilgängelig ar denne metode?',
    ],
    section2Body: 'To personer kan välge forskellige metoder och begge have truffet det rigtige valg for deres situation. Det rigtige valg afhänger isär av, hvordan du önsker at bruge din prävention, och hvad du söger.',
    highlightTitle: 'Husk dette',
    highlightText: 'Den metode, der ser mest attraktiv ud på papir, ar inte nödvendigvis den, der passer bedst ind i din hverdag.',
    section3Body: 'Du kan bruge forskellige kriterier till at sammenligne mulighederne. Målet ar inte at huske alt, men at identificere, hvad der virkelig ar vigtigt for dig.',
    priorities: [
      {
        title: 'Enkel i brug',
        text: 'Nogle metoder kräver daglig opmärksomhed, mens andre kun kräver veckantlig eller annu själdnere opfölgning.',
      },
      {
        title: 'Tolerance',
        text: 'De effekter, du märker, kan variere fran person till person. Det ar vigtigt at lägge märke till, hvordan din krop reagerer, och tale om det, hvis noget föles ubehageligt.',
      },
      {
        title: 'Graviditetsplaner',
        text: 'Hvis du snart önsker at blive gravid, kan brugsperioden och hvornår fertiliteten vender tilbage efter stop, väre en del av overvejelserne.',
      },
      {
        title: 'Effektivitet',
        text: 'Effektiviteten afhänger inte kun av den valgte metode, men også av om den bruges korrekt och konsekvent.',
      },
    ],
    rhythmTitle: 'Hvor ofta skal du huske det',
    rhythmBody: 'En vigtig forskel mellem metoderne ar, hvor ofta du skal tänke på din prävention.',
    comparison: [
      {
        title: 'P-pille',
        detail: 'Daglig brug',
      },
      {
        title: 'Plaster',
        detail: 'Ugentlig skift',
      },
      {
        title: 'Vaginalt ringe',
        detail: 'Cyklus over nogle veckor',
      },
      {
        title: 'Implantat',
        detail: 'Langsigtet lösning',
      },
      {
        title: 'Hormonspiral',
        detail: 'Langsigtet lösning',
      },
    ],
    bodyReactionTitle: 'Märk, hvordan din krop reagerer',
    bodyReactionText: 'Hormonale metoder kan opleves forskelligt fran person till person. Nogle bemärker ändringer i deres cyklus, blödning eller andre bivirkninger. Det betyder inte automatisk, at metoden ar uegnet till dig, men det ar vigtigt at väre opmärksom.',
    alertTitle: 'Vär opmärksom på',
    alertText: 'Hvis en effekt ar märkbar, vedvarende eller usädvanlig, behöver du inte sidde med dina spörgsmål alene. En läge, jordemoder eller andet halsaspersonale kan hjälpe dig med at beslutte, om du vil fortsätte, justere eller skifte metode.',
    projectsTitle: 'Tag dina planer med i beregningen',
    projectsBody: 'Dine graviditetsplaner kan også påvirke ditt valg. Hvis du önsker at undgå graviditet i flere år, kan en langsigtet metode overvejes. Hvis du tänker på graviditet inden for en kortere periode, kan andre muligheder passe bedre till din tidsplan.',
    keepInMindTitle: 'Värd at huske',
    keepInMindText: 'Selv hvis dina graviditetsplaner ar fjerne eller usikre, kan det at nävne dem hjälpe et halsaspersonale med at guide samtalen bedre.',
    section4Body: 'Til en konsultation kan man gennemgå fordele, begränsninger och eventuelle kontraindikationer for hver metode. Du kan forberede et par spörgsmål på forhånd, så du inte glemmer noget vigtigt.',
    questionCardTitle: 'Nyttige spörgsmål at stille',
    professionalQuestions: [
      'Hvad ar fordelene ved denne metode for mig?',
      'Hvilke bivirkninger kan jag opleve?',
      'Hvordan bruges den korrekt?',
      'Hvad gör jeg, hvis jag glemmer det, det falder av, eller jag vil stoppe?',
      'Passer denne metode till mine graviditetsplaner?',
    ],
    professionalTipTitle: 'Godt at vide',
    professionalTipText: 'Inden en jordemoder eller läge anbefaler en metode, kan de tage din sygehistorie, igangvärende behandlinger, präferencer och livsstil med i betragtning.',
    summaryTitle: 'Det vigtigste',
    summaryItems: [
      'Välg en metode, der passer till din hverdag.',
      'Tag din tolerance och dina präferencer med i betragtning.',
      'Tänk over dina graviditetsplaner och din tidsplan.',
      'Sög rådgivning fran en fagperson, hvis du ar usikker.',
    ],
    finalTipTitle: 'Husk',
    finalTipText: 'Den bedste metode ar inte nödvendigvis den, der virker mest praktisk eller populär. Det ar den, der passer till din situation, dina behov och dina präferencer – efter en velovervejet samtale med et halsaspersonale.',
    disclaimerText: 'Denne artikel ar udelukkende till informationsformål och erstatter inte personlig medicinsk rådgivning.',
    shareMessage: 'Välg den metode, der passer till dig — AWA',
  },
} as const);

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
