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
  nb: {
    badge: 'VELGE METODE',
    title: 'Velge behandlingen\nsom passer deg',
    metaDuration: '7 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Middels',
    metaValidated: 'Gjennomgått innhold',
    intro: 'De riktige spørsmålene å stille deg selv for å finne en prevensjonsmetode som passer hverdagen, behovene og planene dine.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Spørsmål å stille deg selv',
      'Ingen metode er «best» i absolutt forstand',
      'Kriterier som kan utgjøre en forskjell',
      'Snakke det over med helsepersonell',
      'Det viktigste å huske',
    ],
    section1Body: 'Det finnes ingen enkelt, ideell prevensjonsmetode for alle. Før du velger en metode kan det hjelpe å tenke over vanene dine, preferansene dine, toleransen din og planene dine.',
    questions: [
      'Hvordan reagerer kroppen min på hormoner?',
      'Trenger jeg en daglig eller ukentlig handling, eller en langtidsvirkende løsning?',
      'Har jeg planer om graviditet på mellomlang sikt?',
      'Hva er budsjettet mitt, og hvor tilgjengelig er denne prevensjonsmetoden?',
    ],
    section2Body: 'To personer kan velge ulike metoder og begge ha gjort et valg som passer perfekt til sin situasjon. Det riktige valget avhenger blant annet av hvordan du vil bruke prevensjonen din og hva du ser etter.',
    highlightTitle: 'Det viktigste å huske',
    highlightText: 'En metode som ser tiltalende ut på papiret, er ikke nødvendigvis den som blir enklest eller mest komfortabel for deg i hverdagen.',
    section3Body: 'For å sammenligne flere alternativer kan du se på ulike kriterier. Målet er ikke å kunne alt utenat, men å finne ut hva som virkelig er viktig for deg.',
    priorities: [
      {title: 'Enkelhet', text: 'Noen metoder krever en daglig handling, mens andre bare krever ukentlig oppmerksomhet, eller mye sjeldnere.'},
      {title: 'Toleranse', text: 'Effektene du kjenner, kan variere fra person til person. Det er viktig å legge merke til hvordan kroppen reagerer og å snakke om det hvis noe plager deg.'},
      {title: 'Planer om graviditet', text: 'Hvis du håper på en graviditet snart, kan bruksvarigheten og hvordan fruktbarheten kommer tilbake etter at du slutter, være en del av samtalen.'},
      {title: 'Effektivitet', text: 'Effektiviteten avhenger ikke bare av metoden du velger, men også av at den brukes riktig og jevnlig.'},
    ],
    rhythmTitle: 'Hvor ofte du må bruke den',
    rhythmBody: 'En viktig forskjell mellom metodene er hvor ofte du må tenke på prevensjonen din.',
    comparison: [
      {title: 'P-pille', detail: 'Daglig handling'},
      {title: 'Plaster', detail: 'Ukentlig bytte'},
      {title: 'Ring', detail: 'Syklus på flere uker'},
      {title: 'Implantat', detail: 'Langtidsvirkende løsning'},
      {title: 'Hormonspiral', detail: 'Langtidsvirkende løsning'},
    ],
    bodyReactionTitle: 'Følge med på hvordan kroppen reagerer',
    bodyReactionText: 'En hormonell metode kan kjennes forskjellig fra person til person. Noen merker endringer i syklusen, blødningen eller andre bivirkninger. Disse reaksjonene betyr ikke automatisk at metoden ikke passer deg, men de er verdt å være oppmerksom på.',
    alertTitle: 'Verdt å følge med på',
    alertText: 'Hvis en effekt er sterk, vedvarende eller uvanlig, bør du ikke være alene med spørsmålene dine. En lege, jordmor eller annet helsepersonell kan hjelpe deg å avgjøre om du skal fortsette, justere eller bytte metode.',
    projectsTitle: 'Ta hensyn til planene dine',
    projectsBody: 'Planene dine om graviditet kan også påvirke valget ditt. Hvis du vil unngå graviditet i flere år, kan en langtidsvirkende metode være verdt å vurdere. Hvis du tenker på en graviditet tidligere, kan andre alternativer passe tidsplanen din bedre.',
    keepInMindTitle: 'Verdt å huske',
    keepInMindText: 'Å snakke om planene dine om graviditet, selv om de fortsatt er fjerne eller usikre, hjelper helsepersonellet med å veilede samtalen bedre.',
    section4Body: 'En time gir deg anledning til å veie fordeler, ulemper og mulige kontraindikasjoner for hver metode. Du kan forberede noen spørsmål på forhånd slik at du ikke glemmer noe viktig.',
    questionCardTitle: 'Nyttige spørsmål å stille',
    professionalQuestions: [
      'Hva er fordelene med denne metoden for meg?',
      'Hvilke bivirkninger kan jeg oppleve?',
      'Hvordan bruker jeg den riktig?',
      'Hva bør jeg gjøre hvis jeg glemmer den, hvis den forskyver seg, eller hvis jeg vil slutte?',
      'Passer denne metoden med planene mine om graviditet?',
    ],
    professionalTipTitle: 'Godt å vite',
    professionalTipText: 'En jordmor eller lege kan ta hensyn til sykehistorien din, behandlingene dine, preferansene dine og livsstilen din før de anbefaler en metode.',
    summaryTitle: 'Det viktigste',
    summaryItems: [
      'Velg en metode som passer hverdagen din.',
      'Ta hensyn til toleransen og preferansene dine.',
      'Tenk på planene dine om graviditet og tidsplanen din.',
      'Be helsepersonell om råd hvis du er usikker.',
    ],
    finalTipTitle: 'Husk',
    finalTipText: 'Den beste metoden er ikke nødvendigvis den som virker mest praktisk eller mest populær. Det er den som passer din situasjon, dine behov og dine preferanser, etter en informert samtale med helsepersonell.',
    disclaimerText: 'Denne artikkelen er kun til informasjon og erstatter ikke personlig medisinsk rådgivning.',
    shareMessage: 'Velge behandlingen som passer deg – AWA',
  },
  pl: {
    badge: 'WYBÓR METODY',
    title: 'Wybór metody,\nktóra Ci odpowiada',
    metaDuration: '7 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Średnio zaawansowany',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Właściwe pytania, które warto sobie zadać, aby znaleźć metodę antykoncepcji dopasowaną do codziennego życia, potrzeb i planów.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Pytania, które warto sobie zadać',
      'Żadna metoda nie jest „najlepsza” absolutnie',
      'Kryteria, które mogą mieć znaczenie',
      'Rozmowa ze specjalistą',
      'Najważniejsze wnioski',
    ],
    section1Body: 'Nie istnieje jedna idealna metoda antykoncepcji dla wszystkich. Przed wyborem metody warto zastanowić się nad swoimi nawykami, preferencjami, tolerancją i planami.',
    questions: [
      'Jak moje ciało reaguje na hormony?',
      'Czy potrzebuję codziennej lub cotygodniowej czynności, czy rozwiązania długodziałającego?',
      'Czy mam plany dotyczące ciąży w średnim terminie?',
      'Jaki mam budżet i jak dostępna jest ta metoda antykoncepcji?',
    ],
    section2Body: 'Dwie osoby mogą wybrać różne metody i obie dokonać wyboru doskonale dopasowanego do swojej sytuacji. Właściwy wybór zależy w szczególności od tego, jak chcesz stosować antykoncepcję i czego szukasz.',
    highlightTitle: 'Najważniejsze do zapamiętania',
    highlightText: 'Metoda, która na papierze wygląda atrakcyjnie, niekoniecznie będzie dla Ciebie najprostsza lub najwygodniejsza na co dzień.',
    section3Body: 'Aby porównać kilka opcji, możesz przyjrzeć się różnym kryteriom. Celem nie jest znanie wszystkiego na pamięć, lecz określenie tego, co naprawdę jest dla Ciebie ważne.',
    priorities: [
      {title: 'Prostota', text: 'Niektóre metody wymagają codziennej czynności, inne tylko cotygodniowej uwagi lub znacznie rzadszej.'},
      {title: 'Tolerancja', text: 'Odczuwane skutki mogą się różnić u poszczególnych osób. Ważne jest, by zauważać reakcje swojego ciała i porozmawiać o nich, jeśli coś Ci przeszkadza.'},
      {title: 'Plany dotyczące ciąży', text: 'Jeśli liczysz na ciążę wkrótce, czas stosowania i powrót płodności po odstawieniu mogą być częścią rozmowy.'},
      {title: 'Skuteczność', text: 'Skuteczność zależy nie tylko od wybranej metody, ale też od prawidłowego i konsekwentnego stosowania.'},
    ],
    rhythmTitle: 'Jak często trzeba ją stosować',
    rhythmBody: 'Jedna z ważnych różnic między metodami to to, jak często trzeba myśleć o antykoncepcji.',
    comparison: [
      {title: 'Tabletka', detail: 'Codzienna czynność'},
      {title: 'Plaster', detail: 'Cotygodniowa wymiana'},
      {title: 'Krążek', detail: 'Cykl kilkutygodniowy'},
      {title: 'Implant', detail: 'Rozwiązanie długodziałające'},
      {title: 'Hormonalna wkładka domaciczna', detail: 'Rozwiązanie długodziałające'},
    ],
    bodyReactionTitle: 'Obserwowanie reakcji ciała',
    bodyReactionText: 'Metoda hormonalna może być odczuwana inaczej przez różne osoby. Niektóre zauważają zmiany w cyklu, krwawieniu lub inne skutki uboczne. Te reakcje nie oznaczają automatycznie, że metoda nie jest dla Ciebie odpowiednia, ale warto zwracać na nie uwagę.',
    alertTitle: 'Na co zwrócić uwagę',
    alertText: 'Jeśli jakiś skutek jest znaczny, uporczywy lub nietypowy, nie zostawaj sama ze swoimi pytaniami. Lekarz, położna lub inny specjalista może pomóc ustalić, czy kontynuować, dostosować, czy zmienić metodę.',
    projectsTitle: 'Uwzględnianie swoich planów',
    projectsBody: 'Twoje plany dotyczące ciąży mogą również wpływać na wybór. Jeśli chcesz uniknąć ciąży przez kilka lat, warto rozważyć metodę długodziałającą. Jeśli myślisz o ciąży wcześniej, lepiej mogą pasować inne opcje.',
    keepInMindTitle: 'Warto pamiętać',
    keepInMindText: 'Rozmowa o planach dotyczących ciąży, nawet jeśli są jeszcze odległe lub niepewne, pomaga specjaliście lepiej pokierować rozmową.',
    section4Body: 'Wizyta pozwala rozważyć korzyści, ograniczenia i możliwe przeciwwskazania każdej metody. Możesz wcześniej przygotować kilka pytań, aby nie zapomnieć o niczym ważnym.',
    questionCardTitle: 'Przydatne pytania',
    professionalQuestions: [
      'Jakie korzyści przynosi mi ta metoda?',
      'Jakie skutki uboczne mogą wystąpić?',
      'Jak prawidłowo ją stosować?',
      'Co zrobić, jeśli o niej zapomnę, jeśli się przesunie lub jeśli zechcę ją odstawić?',
      'Czy ta metoda pasuje do moich planów dotyczących ciąży?',
    ],
    professionalTipTitle: 'Warto wiedzieć',
    professionalTipText: 'Położna lub lekarz może uwzględnić Twoją historię medyczną, leczenie, preferencje i styl życia, zanim zaleci metodę.',
    summaryTitle: 'Najważniejsze',
    summaryItems: [
      'Wybierz metodę, która pasuje do Twojego codziennego życia.',
      'Uwzględnij swoją tolerancję i preferencje.',
      'Pomyśl o swoich planach dotyczących ciąży i harmonogramie.',
      'Poproś specjalistę o poradę, jeśli masz wątpliwości.',
    ],
    finalTipTitle: 'Pamiętaj',
    finalTipText: 'Najlepsza metoda to niekoniecznie ta, która wydaje się najwygodniejsza lub najpopularniejsza. To ta, która pasuje do Twojej sytuacji, potrzeb i preferencji, po świadomej rozmowie ze specjalistą.',
    disclaimerText: 'Ten artykuł ma charakter wyłącznie informacyjny i nie zastępuje spersonalizowanej porady medycznej.',
    shareMessage: 'Wybór metody, która Ci odpowiada — AWA',
  },
  uk: {
    badge: 'ВИБІР МЕТОДУ',
    title: 'Вибір засобу,\nщо вам підходить',
    metaDuration: '7 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Середній',
    metaValidated: 'Перевірений вміст',
    intro: 'Слушні запитання, які варто собі поставити, щоб знайти метод контрацепції, що відповідає вашому повсякденному життю, потребам і планам.',
    contentsTitle: 'У цій статті',
    topics: [
      'Запитання, які варто собі поставити',
      'Жоден метод не є «найкращим» абсолютно',
      'Критерії, що можуть мати значення',
      'Розмова зі спеціалістом',
      'Головні висновки',
    ],
    section1Body: 'Не існує єдиного ідеального методу контрацепції для всіх. Перш ніж обрати метод, корисно подумати про свої звички, уподобання, переносимість і плани.',
    questions: [
      'Як моє тіло реагує на гормони?',
      'Чи потрібна мені щоденна чи щотижнева дія, чи довготривале рішення?',
      'Чи є в мене плани щодо вагітності в середньостроковій перспективі?',
      'Який мій бюджет і наскільки доступний цей метод контрацепції?',
    ],
    section2Body: 'Дві людини можуть обрати різні методи, і обидві зроблять вибір, цілком відповідний їхній ситуації. Правильний вибір залежить, зокрема, від того, як ви хочете користуватися контрацепцією та чого шукаєте.',
    highlightTitle: 'Головне, що слід пам’ятати',
    highlightText: 'Метод, що на папері виглядає привабливо, не обов’язково буде для вас найпростішим чи найзручнішим на щодень.',
    section3Body: 'Щоб порівняти кілька варіантів, ви можете розглянути різні критерії. Мета — не знати все напам’ять, а визначити, що справді важливо для вас.',
    priorities: [
      {title: 'Простота', text: 'Деякі методи потребують щоденної дії, інші — лише щотижневої уваги чи набагато рідшої.'},
      {title: 'Переносимість', text: 'Відчутні вами ефекти можуть різнитися в різних людей. Важливо помічати реакцію свого тіла й говорити про неї, якщо щось вам заважає.'},
      {title: 'Плани щодо вагітності', text: 'Якщо ви сподіваєтеся на вагітність найближчим часом, тривалість застосування та повернення фертильності після припинення можуть бути частиною обговорення.'},
      {title: 'Ефективність', text: 'Ефективність залежить не лише від обраного методу, а й від правильного та послідовного його застосування.'},
    ],
    rhythmTitle: 'Як часто потрібно користуватися',
    rhythmBody: 'Одна з важливих відмінностей між методами — як часто потрібно думати про контрацепцію.',
    comparison: [
      {title: 'Таблетка', detail: 'Щоденна дія'},
      {title: 'Пластир', detail: 'Щотижнева заміна'},
      {title: 'Кільце', detail: 'Цикл із кількох тижнів'},
      {title: 'Імплант', detail: 'Довготривале рішення'},
      {title: 'Гормональна спіраль', detail: 'Довготривале рішення'},
    ],
    bodyReactionTitle: 'Спостереження за реакцією тіла',
    bodyReactionText: 'Гормональний метод може відчуватися по-різному в різних людей. Дехто помічає зміни циклу, кровотечі чи інші побічні ефекти. Ці реакції автоматично не означають, що метод вам не підходить, але на них варто звертати увагу.',
    alertTitle: 'На що звернути увагу',
    alertText: 'Якщо ефект значний, стійкий або нетиповий, не залишайтеся наодинці зі своїми запитаннями. Лікар, акушерка чи інший медичний фахівець може допомогти визначити, чи продовжувати, коригувати, чи змінювати метод.',
    projectsTitle: 'Врахування ваших планів',
    projectsBody: 'Ваші плани щодо вагітності також можуть впливати на вибір. Якщо ви хочете уникнути вагітності на кілька років, варто розглянути довготривалий метод. Якщо ви думаєте про вагітність раніше, інші варіанти можуть краще відповідати вашим строкам.',
    keepInMindTitle: 'Варто пам’ятати',
    keepInMindText: 'Розмова про плани щодо вагітності, навіть якщо вони ще віддалені чи невизначені, допомагає фахівцеві краще спрямувати обговорення.',
    section4Body: 'Візит дозволяє зважити переваги, обмеження та можливі протипоказання кожного методу. Ви можете заздалегідь підготувати кілька запитань, щоб не забути нічого важливого.',
    questionCardTitle: 'Корисні запитання',
    professionalQuestions: [
      'Які переваги цього методу для мене?',
      'Які побічні ефекти я можу відчути?',
      'Як правильно ним користуватися?',
      'Що робити, якщо я про нього забуду, якщо він зміститься або якщо я захочу його припинити?',
      'Чи підходить цей метод до моїх планів щодо вагітності?',
    ],
    professionalTipTitle: 'Варто знати',
    professionalTipText: 'Акушерка чи лікар можуть врахувати вашу медичну історію, лікування, уподобання та спосіб життя, перш ніж порекомендувати метод.',
    summaryTitle: 'Головне',
    summaryItems: [
      'Оберіть метод, що відповідає вашому повсякденному життю.',
      'Врахуйте свою переносимість і уподобання.',
      'Подумайте про свої плани щодо вагітності та строки.',
      'Попросіть поради в спеціаліста, якщо не впевнені.',
    ],
    finalTipTitle: 'Пам’ятайте',
    finalTipText: 'Найкращий метод — не обов’язково той, що здається найзручнішим або найпопулярнішим. Це той, що відповідає вашій ситуації, потребам і уподобанням, після усвідомленої розмови з медичним фахівцем.',
    disclaimerText: 'Ця стаття має виключно інформаційний характер і не замінює персоналізованої медичної поради.',
    shareMessage: 'Вибір засобу, що вам підходить — AWA',
  },
  cs: {
    badge: 'VÝBĚR METODY',
    title: 'Výběr léčby,\nkterá vám vyhovuje',
    metaDuration: '7 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Pokročilý',
    metaValidated: 'Ověřený obsah',
    intro: 'Správné otázky, které si položit, abyste našla antikoncepční metodu vhodnou pro váš každodenní život, vaše potřeby a vaše plány.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Otázky, které si položit',
      'Žádná metoda není absolutně „nejlepší“',
      'Kritéria, která mohou udělat rozdíl',
      'Konzultace s odborníkem',
      'Hlavní poznatky',
    ],
    section1Body: 'Neexistuje jediná ideální antikoncepční metoda pro všechny. Před výběrem metody může pomoci zamyslet se nad svými návyky, preferencemi, snášenlivostí a plány.',
    questions: [
      'Jak moje tělo reaguje na hormony?',
      'Potřebuji denní nebo týdenní úkon, nebo dlouhodobě působící řešení?',
      'Mám střednědobý plán otěhotnění?',
      'Jaký je můj rozpočet a jak dostupná je tato antikoncepční metoda?',
    ],
    section2Body: 'Dvě ženy mohou zvolit různé metody a obě se rozhodly zcela vhodně pro svou situaci. Správná volba závisí zejména na tom, jak chcete antikoncepci používat a co hledáte.',
    highlightTitle: 'Hlavní, co si zapamatovat',
    highlightText: 'Metoda, která vypadá na papíře lákavě, nemusí být tou, která bude pro vás v každodenním životě nejjednodušší nebo nejpohodlnější.',
    section3Body: 'K porovnání několika možností můžete sledovat různá kritéria. Cílem není znát vše nazpaměť, ale určit, co je pro vás skutečně důležité.',
    priorities: [
      {title: 'Jednoduchost', text: 'Některé metody vyžadují denní úkon, jiné jen týdenní pozornost nebo mnohem méně často.'},
      {title: 'Snášenlivost', text: 'Účinky, které pociťujete, se mohou u každé ženy lišit. Je důležité všímat si reakce svého těla a promluvit si o tom, pokud vás něco trápí.'},
      {title: 'Plány na otěhotnění', text: 'Pokud doufáte v brzké otěhotnění, může být součástí rozhovoru délka používání a návrat plodnosti po ukončení.'},
      {title: 'Účinnost', text: 'Účinnost nezávisí jen na zvolené metodě, ale také na jejím správném a důsledném používání.'},
    ],
    rhythmTitle: 'Jak často ji potřebujete používat',
    rhythmBody: 'Jedním z důležitých rozdílů mezi metodami je, jak často musíte na antikoncepci myslet.',
    comparison: [
      {title: 'Pilulka', detail: 'Denní úkon'},
      {title: 'Náplast', detail: 'Týdenní výměna'},
      {title: 'Kroužek', detail: 'Cyklus několika týdnů'},
      {title: 'Implantát', detail: 'Dlouhodobě působící řešení'},
      {title: 'Hormonální nitroděložní tělísko', detail: 'Dlouhodobě působící řešení'},
    ],
    bodyReactionTitle: 'Sledování reakce vašeho těla',
    bodyReactionText: 'Hormonální metoda se může u každé ženy vnímat jinak. Některé ženy zaznamenají změny cyklu, krvácení nebo jiné nežádoucí účinky. Tyto reakce automaticky neznamenají, že metoda pro vás není vhodná, ale stojí za to věnovat jim pozornost.',
    alertTitle: 'Na co dát pozor',
    alertText: 'Pokud je nějaký účinek výrazný, přetrvávající nebo neobvyklý, nezůstávejte se svými otázkami sama. Lékař, porodní asistentka nebo jiný zdravotnický pracovník vám může pomoci rozhodnout, zda metodu pokračovat, upravit, nebo změnit.',
    projectsTitle: 'Zohlednění vašich plánů',
    projectsBody: 'Vaše plány na otěhotnění mohou ovlivnit i výběr. Pokud se chcete několik let vyhnout otěhotnění, může stát za zvážení dlouhodobě působící metoda. Pokud o těhotenství uvažujete dříve, mohou lépe vyhovovat jiné možnosti.',
    keepInMindTitle: 'Stojí za to mít na paměti',
    keepInMindText: 'Mluvit o svých plánech na otěhotnění, i když jsou ještě vzdálené nebo nejisté, pomáhá zdravotnickému pracovníkovi lépe vést rozhovor.',
    section4Body: 'Při návštěvě můžete zvážit výhody, omezení a možné kontraindikace jednotlivých metod. Předem si můžete připravit několik otázek, abyste na nic důležitého nezapomněla.',
    questionCardTitle: 'Užitečné otázky',
    professionalQuestions: [
      'Jaké jsou výhody této metody pro mě?',
      'Jaké nežádoucí účinky se mohou objevit?',
      'Jak ji správně používat?',
      'Co dělat, když na ni zapomenu, když se posune nebo když ji chci ukončit?',
      'Hodí se tato metoda k mým plánům na otěhotnění?',
    ],
    professionalTipTitle: 'Stojí za to vědět',
    professionalTipText: 'Porodní asistentka nebo lékař může před doporučením metody zohlednit vaši zdravotní anamnézu, léčbu, preference a životní styl.',
    summaryTitle: 'To nejdůležitější',
    summaryItems: [
      'Zvolte metodu, která odpovídá vašemu každodennímu životu.',
      'Zohledněte svou snášenlivost a preference.',
      'Myslete na své plány na otěhotnění a časový rámec.',
      'Pokud si nejste jistá, požádejte odborníka o radu.',
    ],
    finalTipTitle: 'Pamatujte',
    finalTipText: 'Nejlepší metoda není nutně ta, která se zdá nejpohodlnější nebo nejoblíbenější. Je to ta, která odpovídá vaší situaci, potřebám a preferencím po informovaném rozhovoru se zdravotnickým pracovníkem.',
    disclaimerText: 'Tento článek je pouze informativní a nenahrazuje individuální lékařskou radu.',
    shareMessage: 'Výběr léčby, která vám vyhovuje — AWA',
  },
  sk: {
    badge: 'VÝBER METÓDY',
    title: 'Výber liečby,\nktorá vám vyhovuje',
    metaDuration: '7 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Stredne pokročilý',
    metaValidated: 'Overený obsah',
    intro: 'Správne otázky, ktoré si môžete položiť, aby ste našli antikoncepčnú metódu vhodnú pre váš každodenný život, vaše potreby a plány.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Otázky, ktoré si položiť',
      'Žiadna metóda nie je „najlepšia“ absolútne',
      'Kritériá, ktoré môžu rozhodnúť',
      'Rozhovor s odborníkom',
      'Hlavné body',
    ],
    section1Body: 'Neexistuje jediná ideálna antikoncepčná metóda pre všetky ženy. Pred výberom metódy môže pomôcť zamyslieť sa nad svojimi zvykmi, preferenciami, znášanlivosťou a plánmi.',
    questions: [
      'Ako moje telo reaguje na hormóny?',
      'Potrebujem každodennú alebo týždennú činnosť, alebo dlhodobé riešenie?',
      'Mám v strednodobom horizonte plán otehotnieť?',
      'Aký je môj rozpočet a ako dostupná je táto antikoncepčná metóda?',
    ],
    section2Body: 'Dve ženy môžu zvoliť rôzne metódy a obe sa môžu rozhodnúť dokonale vhodne pre svoju situáciu. Správna voľba závisí najmä od toho, ako chcete antikoncepciu používať a čo hľadáte.',
    highlightTitle: 'Kľúčové je pamätať si',
    highlightText: 'Metóda, ktorá vyzerá na papieri lákavo, nemusí byť tá, ktorá bude pre vás v každodennom živote najjednoduchšia alebo najpohodlnejšia.',
    section3Body: 'Pri porovnávaní viacerých možností môžete sledovať rôzne kritériá. Cieľom nie je vedieť všetko naspamäť, ale určiť, čo je pre vás skutočne dôležité.',
    priorities: [
      {title: 'Jednoduchosť', text: 'Niektoré metódy vyžadujú každodennú činnosť, iné len týždennú pozornosť alebo oveľa menej často.'},
      {title: 'Znášanlivosť', text: 'Účinky, ktoré pociťujete, sa môžu líšiť od ženy k žene. Je dôležité všímať si, ako vaše telo reaguje, a hovoriť o tom, ak vám niečo prekáža.'},
      {title: 'Plány na tehotenstvo', text: 'Ak dúfate v skoré otehotnenie, súčasťou rozhovoru môže byť dĺžka používania a návrat plodnosti po ukončení.'},
      {title: 'Účinnosť', text: 'Účinnosť nezávisí len od zvolenej metódy, ale aj od jej správneho a dôsledného používania.'},
    ],
    rhythmTitle: 'Ako často ju treba používať',
    rhythmBody: 'Jedným z dôležitých rozdielov medzi metódami je, ako často musíte na antikoncepciu myslieť.',
    comparison: [
      {title: 'Tableta', detail: 'Každodenná činnosť'},
      {title: 'Náplasť', detail: 'Týždenná výmena'},
      {title: 'Krúžok', detail: 'Cyklus niekoľkých týždňov'},
      {title: 'Implantát', detail: 'Dlhodobé riešenie'},
      {title: 'Hormonálne IUD', detail: 'Dlhodobé riešenie'},
    ],
    bodyReactionTitle: 'Sledovanie reakcie tela',
    bodyReactionText: 'Hormonálna metóda sa môže u rôznych žien prejavovať odlišne. Niektoré si všimnú zmeny cyklu, krvácania alebo iné vedľajšie účinky. Tieto reakcie automaticky neznamenajú, že metóda nie je pre vás vhodná, ale stojí za to venovať im pozornosť.',
    alertTitle: 'Čo stojí za sledovanie',
    alertText: 'Ak je účinok výrazný, pretrváva alebo je nezvyčajný, nezostávajte so svojimi otázkami sama. Lekár, pôrodná asistentka alebo iný zdravotnícky pracovník vám pomôže rozhodnúť, či pokračovať, upraviť alebo zmeniť metódu.',
    projectsTitle: 'Zohľadnenie vašich plánov',
    projectsBody: 'Vaše plány na tehotenstvo môžu ovplyvniť aj výber. Ak sa chcete otehotneniu vyhnúť niekoľko rokov, môže stáť za zváženie dlhodobá metóda. Ak uvažujete o tehotenstve skôr, môžu lepšie vyhovovať iné možnosti.',
    keepInMindTitle: 'Stojí za to mať na pamäti',
    keepInMindText: 'Rozhovor o plánoch na tehotenstvo, aj keď sú ešte vzdialené alebo neisté, pomáha zdravotníckemu pracovníkovi lepšie usmerniť diskusiu.',
    section4Body: 'Pri návšteve môžete zvážiť výhody, obmedzenia a možné kontraindikácie každej metódy. Môžete si vopred pripraviť niekoľko otázok, aby ste na nič dôležité nezabudli.',
    questionCardTitle: 'Užitočné otázky',
    professionalQuestions: [
      'Aké sú výhody tejto metódy pre mňa?',
      'Aké vedľajšie účinky môžem pociťovať?',
      'Ako ju správne používať?',
      'Čo mám robiť, ak na ňu zabudnem, ak sa posunie alebo ak ju chcem ukončiť?',
      'Zodpovedá táto metóda mojim plánom na tehotenstvo?',
    ],
    professionalTipTitle: 'Stojí za to vedieť',
    professionalTipText: 'Pôrodná asistentka alebo lekár môže pred odporúčaním metódy zohľadniť vašu zdravotnú anamnézu, liečbu, preferencie a spôsob života.',
    summaryTitle: 'To najdôležitejšie',
    summaryItems: [
      'Zvoľte metódu, ktorá zodpovedá vášmu každodennému životu.',
      'Zohľadnite svoju znášanlivosť a preferencie.',
      'Myslite na svoje plány na tehotenstvo a časový rámec.',
      'Ak si nie ste istá, poraďte sa s odborníkom.',
    ],
    finalTipTitle: 'Pamätajte',
    finalTipText: 'Najlepšia metóda nie je nevyhnutne tá, ktorá sa zdá najpohodlnejšia alebo najobľúbenejšia. Je to tá, ktorá zodpovedá vašej situácii, potrebám a preferenciám po informovanom rozhovore so zdravotníckym pracovníkom.',
    disclaimerText: 'Tento článok má iba informatívny charakter a nenahrádza individuálnu lekársku radu.',
    shareMessage: 'Výber liečby, ktorá vám vyhovuje — AWA',
  },
  hu: {
    badge: 'A MÓDSZER KIVÁLASZTÁSA',
    title: 'A számodra megfelelő\nkezelés kiválasztása',
    metaDuration: '7 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Középhaladó',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'A helyes kérdések, amelyeket feltehetsz magadnak, hogy megtaláld a mindennapjaidhoz, igényeidhez és terveidhez illő fogamzásgátló módszert.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Kérdések, amelyeket érdemes feltenned magadnak',
      'Egyetlen módszer sem „a legjobb” abszolút értelemben',
      'Szempontok, amelyek különbséget tehetnek',
      'Beszélgetés egy szakemberrel',
      'Legfontosabb tudnivalók',
    ],
    section1Body: 'Nincs egyetlen, mindenki számára ideális fogamzásgátló módszer. A módszer kiválasztása előtt segíthet végiggondolni a szokásaidat, preferenciáidat, a tűrőképességedet és a terveidet.',
    questions: [
      'Hogyan reagál a testem a hormonokra?',
      'Napi vagy heti teendőre van szükségem, vagy hosszú hatású megoldásra?',
      'Van középtávú terhességi tervem?',
      'Mekkora a költségvetésem, és mennyire elérhető ez a fogamzásgátló módszer?',
    ],
    section2Body: 'Két nő különböző módszert választhat, és mindketten tökéletesen a helyzetükhöz illő döntést hozhatnak. A helyes választás főként attól függ, hogyan szeretnéd használni a fogamzásgátlást, és mit keresel.',
    highlightTitle: 'A legfontosabb, amit érdemes megjegyezni',
    highlightText: 'Egy papíron vonzó módszer nem feltétlenül az, amelyik a mindennapokban a legegyszerűbb vagy legkényelmesebb lesz számodra.',
    section3Body: 'Több lehetőség összehasonlításakor különböző szempontokat vizsgálhatsz. A cél nem az, hogy mindent fejből tudj, hanem hogy felismerd, mi számít igazán neked.',
    priorities: [
      {title: 'Egyszerűség', text: 'Egyes módszerek napi teendőt igényelnek, mások csak heti figyelmet, vagy sokkal ritkábbat.'},
      {title: 'Tűrőképesség', text: 'Az érzett hatások nőnként eltérhetnek. Fontos megfigyelni, hogyan reagál a tested, és beszélni róla, ha valami zavar.'},
      {title: 'Terhességi tervek', text: 'Ha hamarosan terhességet remélsz, a használat hossza és a termékenység visszatérése a leállítás után lehet a beszélgetés része.'},
      {title: 'Hatékonyság', text: 'A hatékonyság nemcsak a választott módszertől függ, hanem a helyes és következetes használattól is.'},
    ],
    rhythmTitle: 'Milyen gyakran kell használni',
    rhythmBody: 'A módszerek közötti egyik fontos különbség, hogy milyen gyakran kell a fogamzásgátlásra gondolnod.',
    comparison: [
      {title: 'Tabletta', detail: 'Napi teendő'},
      {title: 'Tapasz', detail: 'Heti csere'},
      {title: 'Gyűrű', detail: 'Több hetes ciklus'},
      {title: 'Implantátum', detail: 'Hosszú hatású megoldás'},
      {title: 'Hormonális IUD', detail: 'Hosszú hatású megoldás'},
    ],
    bodyReactionTitle: 'A tested reakciójának figyelése',
    bodyReactionText: 'A hormonális módszer nőnként másként érződhet. Egyesek a ciklusukban, a vérzésben vagy más mellékhatásokban változást vesznek észre. Ezek a reakciók automatikusan nem jelentik, hogy a módszer nem megfelelő számodra, de érdemes figyelni rájuk.',
    alertTitle: 'Amire érdemes figyelni',
    alertText: 'Ha egy hatás jelentős, tartós vagy szokatlan, ne maradj egyedül a kérdéseiddel. Egy orvos, szülésznő vagy más egészségügyi szakember segíthet eldönteni, hogy folytasd, módosítsd vagy cseréld-e a módszert.',
    projectsTitle: 'A terveid figyelembevétele',
    projectsBody: 'A terhességi terveid is befolyásolhatják a választásodat. Ha több évig szeretnéd elkerülni a terhességet, érdemes lehet hosszú hatású módszert fontolóra venni. Ha hamarabb gondolsz terhességre, más lehetőségek jobban illhetnek az időzítésedhez.',
    keepInMindTitle: 'Érdemes észben tartani',
    keepInMindText: 'A terhességi terveidről való beszélgetés, még ha távoliak vagy bizonytalanok is, segít az egészségügyi szakembernek jobban irányítani a megbeszélést.',
    section4Body: 'Egy időpont lehetővé teszi, hogy mérlegeld az egyes módszerek előnyeit, korlátait és lehetséges ellenjavallatait. Előre felkészülhetsz néhány kérdéssel, hogy semmi fontosról ne feledkezz meg.',
    questionCardTitle: 'Hasznos kérdések',
    professionalQuestions: [
      'Milyen előnyei vannak ennek a módszernek számomra?',
      'Milyen mellékhatásokat tapasztalhatok?',
      'Hogyan használjam helyesen?',
      'Mit tegyek, ha elfelejtem, ha elmozdul, vagy ha abba szeretném hagyni?',
      'Illik ez a módszer a terhességi terveimhez?',
    ],
    professionalTipTitle: 'Érdemes tudni',
    professionalTipText: 'Egy szülésznő vagy orvos a módszer ajánlása előtt figyelembe veheti az orvosi előzményeidet, a kezeléseidet, a preferenciáidat és az életmódodat.',
    summaryTitle: 'A lényeg',
    summaryItems: [
      'Válassz a mindennapjaidhoz illő módszert.',
      'Vedd figyelembe a tűrőképességedet és a preferenciáidat.',
      'Gondolj a terhességi terveidre és az időzítésre.',
      'Ha bizonytalan vagy, kérj tanácsot szakembertől.',
    ],
    finalTipTitle: 'Ne feledd',
    finalTipText: 'A legjobb módszer nem feltétlenül az, amelyik a legkényelmesebbnek vagy legnépszerűbbnek tűnik. Az, amelyik megfelel a helyzetednek, az igényeidnek és a preferenciáidnak, egy egészségügyi szakemberrel folytatott megalapozott beszélgetés után.',
    disclaimerText: 'Ez a cikk kizárólag tájékoztató jellegű, és nem helyettesíti a személyre szabott orvosi tanácsot.',
    shareMessage: 'A számodra megfelelő kezelés kiválasztása — AWA',
  },
  ro: {
    badge: 'ALEGEREA METODEI',
    title: 'Alegerea tratamentului\ncare ți se potrivește',
    metaDuration: '7 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Intermediar',
    metaValidated: 'Conținut revizuit',
    intro: 'Întrebările potrivite pe care să ți le pui pentru a găsi o metodă contraceptivă adaptată vieții tale de zi cu zi, nevoilor și planurilor tale.',
    contentsTitle: 'În acest articol',
    topics: [
      'Întrebări pe care să ți le pui',
      'Nicio metodă nu este „cea mai bună” în mod absolut',
      'Criterii care pot face diferența',
      'Discuția cu un profesionist',
      'Ce să reții',
    ],
    section1Body: 'Nu există o singură metodă contraceptivă ideală pentru toată lumea. Înainte de a alege o metodă, te poate ajuta să te gândești la obiceiurile, preferințele, toleranța și planurile tale.',
    questions: [
      'Cum reacționează corpul meu la hormoni?',
      'Am nevoie de o acțiune zilnică sau săptămânală ori de o soluție de lungă durată?',
      'Am un plan de sarcină pe termen mediu?',
      'Care este bugetul meu și cât de accesibilă este această metodă contraceptivă?',
    ],
    section2Body: 'Două persoane pot alege metode diferite și ambele pot face o alegere perfect potrivită situației lor. Alegerea potrivită depinde în special de modul în care vrei să-ți folosești contracepția și de ceea ce cauți.',
    highlightTitle: 'Lucrul esențial de reținut',
    highlightText: 'O metodă care arată atrăgător pe hârtie nu este neapărat cea care va fi cea mai simplă sau cea mai confortabilă pentru tine zi de zi.',
    section3Body: 'Pentru a compara mai multe opțiuni, poți analiza diferite criterii. Scopul nu este să știi totul pe de rost, ci să identifici ce contează cu adevărat pentru tine.',
    priorities: [
      {title: 'Simplitatea', text: 'Unele metode necesită o acțiune zilnică, în timp ce altele cer atenție doar săptămânal sau mult mai rar.'},
      {title: 'Toleranța', text: 'Efectele pe care le simți pot varia de la o persoană la alta. Este important să observi cum reacționează corpul tău și să vorbești despre asta dacă ceva te deranjează.'},
      {title: 'Planurile de sarcină', text: 'Dacă speri la o sarcină în curând, durata de folosire și revenirea fertilității după oprire pot face parte din discuție.'},
      {title: 'Eficacitatea', text: 'Eficacitatea depinde nu doar de metoda aleasă, ci și de folosirea ei corectă și constantă.'},
    ],
    rhythmTitle: 'Cât de des trebuie folosită',
    rhythmBody: 'O diferență importantă între metode este cât de des trebuie să te gândești la contracepția ta.',
    comparison: [
      {title: 'Pilula', detail: 'Acțiune zilnică'},
      {title: 'Plasturele', detail: 'Schimbare săptămânală'},
      {title: 'Inelul', detail: 'Ciclu de câteva săptămâni'},
      {title: 'Implantul', detail: 'Soluție de lungă durată'},
      {title: 'DIU hormonal', detail: 'Soluție de lungă durată'},
    ],
    bodyReactionTitle: 'Observarea reacției corpului tău',
    bodyReactionText: 'O metodă hormonală poate fi resimțită diferit de la o persoană la alta. Unele observă schimbări ale ciclului, ale sângerării sau alte efecte secundare. Aceste reacții nu înseamnă automat că metoda nu ți se potrivește, dar merită atenție.',
    alertTitle: 'De urmărit',
    alertText: 'Dacă un efect este important, persistent sau neobișnuit, nu rămâne singură cu întrebările tale. Un medic, o moașă sau alt profesionist din domeniul sănătății te poate ajuta să stabilești dacă să continui, să ajustezi sau să schimbi metoda.',
    projectsTitle: 'Luarea în calcul a planurilor tale',
    projectsBody: 'Planurile tale de sarcină îți pot influența și alegerea. Dacă vrei să eviți o sarcină câțiva ani, o metodă de lungă durată merită luată în considerare. Dacă te gândești la o sarcină mai curând, alte opțiuni se pot potrivi mai bine calendarului tău.',
    keepInMindTitle: 'De ținut minte',
    keepInMindText: 'Faptul că vorbești despre planurile tale de sarcină, chiar dacă sunt încă îndepărtate sau nesigure, ajută profesionistul din domeniul sănătății să orienteze mai bine discuția.',
    section4Body: 'O consultație îți permite să cântărești avantajele, constrângerile și posibilele contraindicații ale fiecărei metode. Poți pregăti câteva întrebări dinainte, ca să nu uiți nimic important.',
    questionCardTitle: 'Întrebări utile de pus',
    professionalQuestions: [
      'Care sunt avantajele acestei metode pentru mine?',
      'Ce efecte secundare aș putea avea?',
      'Cum o folosesc corect?',
      'Ce fac dacă o uit, dacă se deplasează sau dacă vreau să o opresc?',
      'Se potrivește această metodă cu planurile mele de sarcină?',
    ],
    professionalTipTitle: 'Bine de știut',
    professionalTipText: 'O moașă sau un medic poate ține cont de istoricul tău medical, de tratamentele, preferințele și stilul tău de viață înainte de a recomanda o metodă.',
    summaryTitle: 'Esențialul',
    summaryItems: [
      'Alege o metodă care se potrivește vieții tale de zi cu zi.',
      'Ține cont de toleranța și de preferințele tale.',
      'Gândește-te la planurile tale de sarcină și la calendarul tău.',
      'Cere sfatul unui profesionist dacă nu ești sigură.',
    ],
    finalTipTitle: 'Ține minte',
    finalTipText: 'Cea mai bună metodă nu este neapărat cea care pare cea mai comodă sau cea mai populară. Este cea care se potrivește situației, nevoilor și preferințelor tale, în urma unei discuții informate cu un profesionist din domeniul sănătății.',
    disclaimerText: 'Acest articol are doar caracter informativ și nu înlocuiește sfatul medical personalizat.',
    shareMessage: 'Alegerea tratamentului care ți se potrivește — AWA',
  },
  bg: {
    badge: 'ИЗБОР НА МЕТОД',
    title: 'Избор на лечение,\nкоето ти подхожда',
    metaDuration: '7 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Средно ниво',
    metaValidated: 'Проверено съдържание',
    intro: 'Правилните въпроси, които да си зададеш, за да намериш контрацептивен метод, подходящ за ежедневието, нуждите и плановете ти.',
    contentsTitle: 'В тази статия',
    topics: [
      'Въпроси, които да си зададеш',
      'Никой метод не е „най-добрият“ в абсолютен смисъл',
      'Критерии, които могат да направят разлика',
      'Разговорът със специалист',
      'Какво да запомниш',
    ],
    section1Body: 'Няма един идеален контрацептивен метод за всички. Преди да избереш метод, може да ти помогне да помислиш за навиците, предпочитанията, поносимостта и плановете си.',
    questions: [
      'Как реагира тялото ми на хормоните?',
      'Нужно ли ми е ежедневно или седмично действие, или решение за дълъг срок?',
      'Имам ли план за бременност в средносрочен план?',
      'Какъв е бюджетът ми и колко достъпен е този контрацептивен метод?',
    ],
    section2Body: 'Двама души могат да изберат различни методи и и двамата да са направили избор, който перфектно отговаря на ситуацията им. Правилният избор зависи по-специално от начина, по който искаш да използваш контрацепцията си, и от това, което търсиш.',
    highlightTitle: 'Основното, което да запомниш',
    highlightText: 'Метод, който изглежда привлекателен на хартия, не е непременно онзи, който ще ти бъде най-прост или най-удобен в ежедневието.',
    section3Body: 'За да сравниш няколко варианта, можеш да разгледаш различни критерии. Целта не е да знаеш всичко наизуст, а да определиш кое наистина е важно за теб.',
    priorities: [
      {title: 'Простота', text: 'Някои методи изискват ежедневно действие, докато други изискват внимание само веднъж седмично или много по-рядко.'},
      {title: 'Поносимост', text: 'Ефектите, които усещаш, могат да варират от човек на човек. Важно е да наблюдаваш как реагира тялото ти и да говориш за това, ако нещо те притеснява.'},
      {title: 'Планове за бременност', text: 'Ако се надяваш на бременност скоро, продължителността на употреба и възстановяването на плодовитостта след спиране могат да бъдат част от разговора.'},
      {title: 'Ефективност', text: 'Ефективността зависи не само от избрания метод, но и от правилната и последователна му употреба.'},
    ],
    rhythmTitle: 'Колко често трябва да се използва',
    rhythmBody: 'Една важна разлика между методите е колко често трябва да мислиш за контрацепцията си.',
    comparison: [
      {title: 'Хапче', detail: 'Ежедневно действие'},
      {title: 'Пластир', detail: 'Седмична смяна'},
      {title: 'Пръстен', detail: 'Цикъл от няколко седмици'},
      {title: 'Имплант', detail: 'Решение за дълъг срок'},
      {title: 'Хормонална спирала', detail: 'Решение за дълъг срок'},
    ],
    bodyReactionTitle: 'Наблюдение как реагира тялото ти',
    bodyReactionText: 'Хормоналният метод може да се усеща различно от човек на човек. Някои забелязват промени в цикъла, кървенето или други странични ефекти. Тези реакции не означават автоматично, че методът не ти подхожда, но заслужават внимание.',
    alertTitle: 'Заслужава да се следи',
    alertText: 'Ако даден ефект е значителен, упорит или необичаен, не оставай сама с въпросите си. Лекар, акушерка или друг здравен специалист може да ти помогне да прецениш дали да продължиш, да коригираш или да смениш метода.',
    projectsTitle: 'Отчитане на плановете ти',
    projectsBody: 'Плановете ти за бременност също могат да повлияят на избора ти. Ако искаш да избягваш бременност няколко години, метод за дълъг срок може да заслужава внимание. Ако мислиш за бременност по-скоро, други варианти може да отговарят по-добре на графика ти.',
    keepInMindTitle: 'Заслужава да се помни',
    keepInMindText: 'Разговорът за плановете ти за бременност, дори да са още далечни или несигурни, помага на здравния специалист да насочи по-добре дискусията.',
    section4Body: 'Прегледът ти позволява да претеглиш предимствата, ограниченията и възможните противопоказания на всеки метод. Можеш да подготвиш няколко въпроса предварително, за да не забравиш нищо важно.',
    questionCardTitle: 'Полезни въпроси за задаване',
    professionalQuestions: [
      'Какви са предимствата на този метод за мен?',
      'Какви странични ефекти бих могла да имам?',
      'Как да го използвам правилно?',
      'Какво да направя, ако го забравя, ако се измести или ако искам да го спра?',
      'Подхожда ли този метод на плановете ми за бременност?',
    ],
    professionalTipTitle: 'Добре е да знаеш',
    professionalTipText: 'Акушерка или лекар може да отчете медицинската ти история, лечението, предпочитанията и начина ти на живот, преди да препоръча метод.',
    summaryTitle: 'Същественото',
    summaryItems: [
      'Избери метод, който отговаря на ежедневието ти.',
      'Вземи предвид поносимостта и предпочитанията си.',
      'Помисли за плановете си за бременност и за графика си.',
      'Поискай съвет от специалист, ако не си сигурна.',
    ],
    finalTipTitle: 'Запомни',
    finalTipText: 'Най-добрият метод не е непременно онзи, който изглежда най-удобен или най-популярен. Той е онзи, който отговаря на ситуацията, нуждите и предпочитанията ти, след информиран разговор със здравен специалист.',
    disclaimerText: 'Тази статия е само с информационна цел и не замества персонализирания медицински съвет.',
    shareMessage: 'Избор на лечение, което ти подхожда — AWA',
  },
  sr: {
    badge: 'ИЗБОР МЕТОДА',
    title: 'Избор терапије\nкоја ти одговара',
    metaDuration: '7 мин читања',
    metaType: 'Водич',
    metaLevel: 'Средњи ниво',
    metaValidated: 'Проверен садржај',
    intro: 'Права питања која треба да себи поставиш да пронађеш контрацептивни метод прилагођен твом свакодневном животу, потребама и плановима.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Питања која треба да себи поставиш',
      'Ниједан метод није „најбољи“ у апсолутном смислу',
      'Критеријуми који могу направити разлику',
      'Разговор са стручњаком',
      'Шта да запамтиш',
    ],
    section1Body: 'Не постоји један идеалан контрацептивни метод за све. Пре избора метода може бити корисно размислити о својим навикама, жељама, подношљивости и плановима.',
    questions: [
      'Како моје тело реагује на хормоне?',
      'Да ли ми је потребна дневна или недељна радња, или решење дугог дејства?',
      'Да ли имам план трудноће у средњем року?',
      'Какав је мој буџет и колико је овај контрацептивни метод доступан?',
    ],
    section2Body: 'Две особе могу изабрати различите методе и обе су направиле избор савршено прилагођен својој ситуацији. Прави избор зависи нарочито од тога како желиш да користиш контрацепцију и шта тражиш.',
    highlightTitle: 'Кључно за памћење',
    highlightText: 'Метод који на папиру изгледа привлачно није нужно онај који ће ти бити најједноставнији или најудобнији из дана у дан.',
    section3Body: 'Да упоредиш неколико опција, можеш размотрити различите критеријуме. Циљ није да знаш све напамет, већ да утврдиш шта ти је заиста важно.',
    priorities: [
      {title: 'Једноставност', text: 'Неки методи захтевају дневну радњу, док други траже пажњу само недељно или много ређе.'},
      {title: 'Подношљивост', text: 'Ефекти које осећаш могу се разликовати од особе до особе. Важно је да примећујеш како твоје тело реагује и да разговараш о томе ако ти нешто смета.'},
      {title: 'Планови за трудноћу', text: 'Ако се надаш трудноћи ускоро, трајање употребе и повратак плодности после престанка могу бити део разговора.'},
      {title: 'Ефикасност', text: 'Ефикасност не зависи само од изабраног метода, већ и од тога да се користи правилно и доследно.'},
    ],
    rhythmTitle: 'Колико често треба да га користиш',
    rhythmBody: 'Једна важна разлика између метода је колико често треба да мислиш на своју контрацепцију.',
    comparison: [
      {title: 'Пилула', detail: 'Дневна радња'},
      {title: 'Фластер', detail: 'Недељна промена'},
      {title: 'Прстен', detail: 'Циклус од неколико недеља'},
      {title: 'Имплант', detail: 'Решење дугог дејства'},
      {title: 'Хормонска спирала', detail: 'Решење дугог дејства'},
    ],
    bodyReactionTitle: 'Посматрање како твоје тело реагује',
    bodyReactionText: 'Хормонски метод се може осећати другачије од особе до особе. Неке примећују промене у циклусу, крварењу или друге нежељене ефекте. Те реакције не значе аутоматски да метод није прави за тебе, али заслужују пажњу.',
    alertTitle: 'На шта вреди пазити',
    alertText: 'Ако је ефекат значајан, упоран или необичан, не остај сама са својим питањима. Лекар, бабица или други здравствени радник може ти помоћи да одредиш да ли да наставиш, прилагодиш или промениш метод.',
    projectsTitle: 'Узимање у обзир твојих планова',
    projectsBody: 'Твоји планови за трудноћу такође могу утицати на твој избор. Ако желиш да избегнеш трудноћу неколико година, вреди размотрити метод дугог дејства. Ако размишљаш о трудноћи пре, друге опције могу боље одговарати твом временском оквиру.',
    keepInMindTitle: 'Вреди имати на уму',
    keepInMindText: 'Разговор о плановима за трудноћу, чак и ако су још далеки или неизвесни, помаже здравственом раднику да боље усмери разговор.',
    section4Body: 'Преглед ти омогућава да одмериш предности, ограничења и могуће контраиндикације сваког метода. Можеш унапред припремити неколико питања да ништа важно не заборавиш.',
    questionCardTitle: 'Корисна питања за постављање',
    professionalQuestions: [
      'Које су предности овог метода за мене?',
      'Које нежељене ефекте могу имати?',
      'Како га правилно користити?',
      'Шта да урадим ако га заборавим, ако се помери са места или ако желим да га прекинем?',
      'Да ли се овај метод уклапа у моје планове за трудноћу?',
    ],
    professionalTipTitle: 'Добро је знати',
    professionalTipText: 'Бабица или лекар може узети у обзир твоју медицинску историју, терапије, жеље и начин живота пре него што препоручи метод.',
    summaryTitle: 'Основно',
    summaryItems: [
      'Изабери метод који одговара твом свакодневном животу.',
      'Узми у обзир своју подношљивост и жеље.',
      'Размисли о својим плановима за трудноћу и временском оквиру.',
      'Затражи савет од стручњака ако ниси сигурна.',
    ],
    finalTipTitle: 'Запамти',
    finalTipText: 'Најбољи метод није нужно онај који делује најзгодније или је најпопуларнији. То је онај који одговара твојој ситуацији, потребама и жељама, после информисаног разговора са здравственим радником.',
    disclaimerText: 'Овај чланак је само у информативне сврхе и не замењује персонализовани медицински савет.',
    shareMessage: 'Избор терапије која ти одговара — AWA',
  },
  hr: {
    badge: 'ODABIR METODE',
    title: 'Odabir terapije\nkoja ti odgovara',
    metaDuration: '7 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Prava pitanja koja si možeš postaviti kako bi pronašla kontracepcijsku metodu prilagođenu svakodnevici, potrebama i planovima.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Pitanja koja si možeš postaviti',
      'Nijedna metoda nije „najbolja“ u apsolutnom smislu',
      'Kriteriji koji mogu napraviti razliku',
      'Razgovor sa stručnom osobom',
      'Ključne poruke',
    ],
    section1Body: 'Ne postoji jedna idealna kontracepcijska metoda za svakoga. Prije odabira metode može pomoći razmisliti o svojim navikama, željama, podnošljivosti i planovima.',
    questions: [
      'Kako moje tijelo reagira na hormone?',
      'Trebam li svakodnevnu ili tjednu radnju ili dugodjelujuće rješenje?',
      'Imam li srednjoročni plan trudnoće?',
      'Kakav je moj proračun i koliko je dostupna ova kontracepcijska metoda?',
    ],
    section2Body: 'Dvije osobe mogu odabrati različite metode, a obje su napravile izbor savršeno prilagođen svojoj situaciji. Pravi izbor ovisi osobito o tome kako želiš koristiti kontracepciju i što tražiš.',
    highlightTitle: 'Ključno je zapamtiti',
    highlightText: 'Metoda koja na papiru izgleda privlačno nije nužno ona koja će ti u svakodnevnom životu biti najjednostavnija ili najugodnija.',
    section3Body: 'Da bi usporedila više mogućnosti, možeš pogledati različite kriterije. Cilj nije znati sve napamet, nego prepoznati što ti je doista važno.',
    priorities: [
      {title: 'Jednostavnost', text: 'Neke metode zahtijevaju svakodnevnu radnju, dok druge traže pozornost samo tjedno ili znatno rjeđe.'},
      {title: 'Podnošljivost', text: 'Učinci koje osjećaš mogu se razlikovati od osobe do osobe. Važno je primijetiti kako tvoje tijelo reagira i razgovarati o tome ako te nešto smeta.'},
      {title: 'Planovi o trudnoći', text: 'Ako se uskoro nadaš trudnoći, trajanje primjene i povratak plodnosti nakon prestanka mogu biti dio razgovora.'},
      {title: 'Učinkovitost', text: 'Učinkovitost ne ovisi samo o odabranoj metodi, nego i o pravilnoj i redovitoj primjeni.'},
    ],
    rhythmTitle: 'Koliko često je treba primjenjivati',
    rhythmBody: 'Jedna važna razlika među metodama jest koliko često moraš misliti na svoju kontracepciju.',
    comparison: [
      {title: 'Tableta', detail: 'Svakodnevna radnja'},
      {title: 'Flaster', detail: 'Tjedna zamjena'},
      {title: 'Prsten', detail: 'Ciklus od nekoliko tjedana'},
      {title: 'Implantat', detail: 'Dugodjelujuće rješenje'},
      {title: 'Hormonska spirala', detail: 'Dugodjelujuće rješenje'},
    ],
    bodyReactionTitle: 'Praćenje reakcije tvog tijela',
    bodyReactionText: 'Hormonska metoda može se razlikovati od osobe do osobe. Neke žene primjećuju promjene u ciklusu, krvarenju ili druge nuspojave. Te reakcije automatski ne znače da metoda nije prava za tebe, ali vrijedi obratiti pozornost na njih.',
    alertTitle: 'Na što vrijedi paziti',
    alertText: 'Ako je neki učinak izražen, dugotrajan ili neobičan, ne ostaj sama sa svojim pitanjima. Liječnik, babica ili drugi zdravstveni djelatnik može ti pomoći odlučiti hoćeš li nastaviti, prilagoditi ili promijeniti metodu.',
    projectsTitle: 'Uzimanje u obzir tvojih planova',
    projectsBody: 'Tvoji planovi o trudnoći također mogu utjecati na izbor. Ako želiš izbjeći trudnoću nekoliko godina, dugodjelujuća metoda može biti vrijedna razmatranja. Ako razmišljaš o trudnoći ranije, druge mogućnosti mogu bolje odgovarati tvom rasporedu.',
    keepInMindTitle: 'Vrijedi imati na umu',
    keepInMindText: 'Razgovor o tvojim planovima o trudnoći, čak i ako su još daleko ili neizvjesni, pomaže zdravstvenom djelatniku da bolje usmjeri razgovor.',
    section4Body: 'Pregled ti omogućuje da odvagneš prednosti, ograničenja i moguće kontraindikacije svake metode. Možeš unaprijed pripremiti nekoliko pitanja kako ne bi zaboravila ništa važno.',
    questionCardTitle: 'Korisna pitanja za postaviti',
    professionalQuestions: [
      'Koje su prednosti ove metode za mene?',
      'Koje nuspojave mogu imati?',
      'Kako je pravilno koristiti?',
      'Što učiniti ako je zaboravim, ako se pomakne ili ako je želim prekinuti?',
      'Odgovara li ova metoda mojim planovima o trudnoći?',
    ],
    professionalTipTitle: 'Dobro je znati',
    professionalTipText: 'Babica ili liječnik može uzeti u obzir tvoju medicinsku povijest, terapije, želje i način života prije nego preporuči metodu.',
    summaryTitle: 'Najvažnije',
    summaryItems: [
      'Odaberi metodu koja odgovara tvom svakodnevnom životu.',
      'Uzmi u obzir svoju podnošljivost i želje.',
      'Razmisli o svojim planovima o trudnoći i vremenskom okviru.',
      'Zatraži savjet stručne osobe ako nisi sigurna.',
    ],
    finalTipTitle: 'Zapamti',
    finalTipText: 'Najbolja metoda nije nužno ona koja se čini najprikladnijom ili najpopularnijom. To je ona koja odgovara tvojoj situaciji, potrebama i željama, nakon informiranog razgovora sa zdravstvenim djelatnikom.',
    disclaimerText: 'Ovaj je članak samo informativne naravi i ne zamjenjuje individualni medicinski savjet.',
    shareMessage: 'Odabir terapije koja ti odgovara — AWA',
  },
  bs: {
    badge: 'ODABIR METODE',
    title: 'Odabir terapije\nkoja ti odgovara',
    metaDuration: '7 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Prava pitanja koja si možeš postaviti kako bi pronašla kontracepcijsku metodu prilagođenu svakodnevici, potrebama i planovima.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Pitanja koja si možeš postaviti',
      'Nijedna metoda nije „najbolja“ u apsolutnom smislu',
      'Kriteriji koji mogu napraviti razliku',
      'Razgovor sa stručnom osobom',
      'Ključne poruke',
    ],
    section1Body: 'Ne postoji jedna idealna kontracepcijska metoda za svakoga. Prije odabira metode može pomoći razmisliti o svojim navikama, željama, podnošljivosti i planovima.',
    questions: [
      'Kako moje tijelo reagira na hormone?',
      'Trebam li svakodnevnu ili sedmičnu radnju ili dugodjelujuće rješenje?',
      'Imam li srednjoročni plan trudnoće?',
      'Kakav je moj proračun i koliko je dostupna ova kontracepcijska metoda?',
    ],
    section2Body: 'Dvije osobe mogu odabrati različite metode, a obje su napravile izbor savršeno prilagođen svojoj situaciji. Pravi izbor ovisi osobito o tome kako želiš koristiti kontracepciju i što tražiš.',
    highlightTitle: 'Ključno je zapamtiti',
    highlightText: 'Metoda koja na papiru izgleda privlačno nije nužno ona koja će ti u svakodnevnom životu biti najjednostavnija ili najugodnija.',
    section3Body: 'Da bi usporedila više mogućnosti, možeš pogledati različite kriterije. Cilj nije znati sve napamet, nego prepoznati što ti je doista važno.',
    priorities: [
      {title: 'Jednostavnost', text: 'Neke metode zahtijevaju svakodnevnu radnju, dok druge traže pozornost samo sedmično ili znatno rjeđe.'},
      {title: 'Podnošljivost', text: 'Učinci koje osjećaš mogu se razlikovati od osobe do osobe. Važno je primijetiti kako tvoje tijelo reagira i razgovarati o tome ako te nešta smeta.'},
      {title: 'Planovi o trudnoći', text: 'Ako se uskoro nadaš trudnoći, trajanje primjene i povratak plodnosti nakon prestanka mogu biti dio razgovora.'},
      {title: 'Učinkovitost', text: 'Učinkovitost ne ovisi samo o odabranoj metodi, nego i o pravilnoj i redovitoj primjeni.'},
    ],
    rhythmTitle: 'Koliko često je treba primjenjivati',
    rhythmBody: 'Jedna važna razlika među metodama jest koliko često moraš misliti na svoju kontracepciju.',
    comparison: [
      {title: 'Tableta', detail: 'Svakodnevna radnja'},
      {title: 'Flaster', detail: 'Sedmična zamjena'},
      {title: 'Prsten', detail: 'Ciklus od nekoliko sedmica'},
      {title: 'Implantat', detail: 'Dugodjelujuće rješenje'},
      {title: 'Hormonska spirala', detail: 'Dugodjelujuće rješenje'},
    ],
    bodyReactionTitle: 'Praćenje reakcije tvog tijela',
    bodyReactionText: 'Hormonska metoda može se razlikovati od osobe do osobe. Neke žene primjećuju promjene u ciklusu, krvarenju ili druge nuspojave. Te reakcije automatski ne znače da metoda nije prava za tebe, ali vrijedi obratiti pozornost na njih.',
    alertTitle: 'Na što vrijedi paziti',
    alertText: 'Ako je neki učinak izražen, dugotrajan ili neobičan, ne ostaj sama sa svojim pitanjima. Ljekar, babica ili drugi zdravstveni radnik može ti pomoći odlučiti hoćeš li nastaviti, prilagoditi ili promijeniti metodu.',
    projectsTitle: 'Uzimanje u obzir tvojih planova',
    projectsBody: 'Tvoji planovi o trudnoći također mogu utjecati na izbor. Ako želiš izbjeći trudnoću nekoliko godina, dugodjelujuća metoda može biti vrijedna razmatranja. Ako razmišljaš o trudnoći ranije, druge mogućnosti mogu bolje odgovarati tvom rasporedu.',
    keepInMindTitle: 'Vrijedi imati na umu',
    keepInMindText: 'Razgovor o tvojim planovima o trudnoći, čak i ako su još daleko ili neizvjesni, pomaže zdravstvenom radniku da bolje usmjeri razgovor.',
    section4Body: 'Pregled ti omogućuje da odvagneš prednosti, ograničenja i moguće kontraindikacije svake metode. Možeš unaprijed pripremiti nekoliko pitanja kako ne bi zaboravila ništa važno.',
    questionCardTitle: 'Korisna pitanja za postaviti',
    professionalQuestions: [
      'Koje su prednosti ove metode za mene?',
      'Koje nuspojave mogu imati?',
      'Kako je pravilno koristiti?',
      'Što učiniti ako je zaboravim, ako se pomakne ili ako je želim prekinuti?',
      'Odgovara li ova metoda mojim planovima o trudnoći?',
    ],
    professionalTipTitle: 'Dobro je znati',
    professionalTipText: 'Babica ili ljekar može uzeti u obzir tvoju medicinsku povijest, terapije, želje i način života prije nego preporuči metodu.',
    summaryTitle: 'Najvažnije',
    summaryItems: [
      'Odaberi metodu koja odgovara tvom svakodnevnom životu.',
      'Uzmi u obzir svoju podnošljivost i želje.',
      'Razmisli o svojim planovima o trudnoći i vremenskom okviru.',
      'Zatraži savjet stručne osobe ako nisi sigurna.',
    ],
    finalTipTitle: 'Zapamti',
    finalTipText: 'Najbolja metoda nije nužno ona koja se čini najprikladnijom ili najpopularnijom. To je ona koja odgovara tvojoj situaciji, potrebama i željama, nakon informiranog razgovora sa zdravstvenim radnikom.',
    disclaimerText: 'Ovaj je članak samo informativne naravi i ne zamjenjuje individualni medicinski savjet.',
    shareMessage: 'Odabir terapije koja ti odgovara — AWA',
  },
  sl: {
    badge: 'IZBIRA METODE',
    title: 'Izbira zdravljenja,\nki ti ustreza',
    metaDuration: '7 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Srednja raven',
    metaValidated: 'Preverjena vsebina',
    intro: 'Prava vprašanja, ki si jih lahko zastaviš, da najdeš kontracepcijsko metodo, prilagojeno tvojemu vsakdanu, potrebam in načrtom.',
    contentsTitle: 'V tem članku',
    topics: [
      'Vprašanja, ki si jih lahko zastaviš',
      'Nobena metoda ni v absolutnem smislu „najboljša“',
      'Merila, ki lahko naredijo razliko',
      'Pogovor s strokovnjakom',
      'Ključna sporočila',
    ],
    section1Body: 'Ne obstaja ena idealna kontracepcijska metoda za vse. Pred izbiro metode lahko pomaga razmisliti o svojih navadah, željah, prenašanju in načrtih.',
    questions: [
      'Kako moje telo reagira na hormone?',
      'Ali potrebujem vsakodnevno ali tedensko dejanje ali dolgodelujočo rešitev?',
      'Ali imam srednjeročen načrt nosečnosti?',
      'Kakšen je moj proračun in kako dostopna je ta kontracepcijska metoda?',
    ],
    section2Body: 'Dve osebi lahko izbereta različni metodi, pa sta obe naredili izbiro, popolnoma prilagojeno svoji situaciji. Prava izbira je odvisna zlasti od tega, kako želiš uporabljati kontracepcijo in kaj iščeš.',
    highlightTitle: 'Ključno si je zapomniti',
    highlightText: 'Metoda, ki je na papirju privlačna, ni nujno tista, ki ti bo v vsakdanu najpreprostejša ali najudobnejša.',
    section3Body: 'Za primerjavo več možnosti lahko pogledaš različna merila. Cilj ni vedeti vsega na pamet, ampak prepoznati, kaj ti je zares pomembno.',
    priorities: [
      {title: 'Preprostost', text: 'Nekatere metode zahtevajo vsakodnevno dejanje, druge pozornost le tedensko ali precej redkeje.'},
      {title: 'Prenašanje', text: 'Učinki, ki jih čutiš, se lahko razlikujejo od osebe do osebe. Pomembno je opaziti, kako se odziva tvoje telo, in o tem spregovoriti, če te kaj moti.'},
      {title: 'Načrti glede nosečnosti', text: 'Če upaš na nosečnost kmalu, so lahko trajanje uporabe in vrnitev plodnosti po prekinitvi del pogovora.'},
      {title: 'Učinkovitost', text: 'Učinkovitost ni odvisna samo od izbrane metode, ampak tudi od pravilne in redne uporabe.'},
    ],
    rhythmTitle: 'Kako pogosto jo je treba uporabljati',
    rhythmBody: 'Ena pomembna razlika med metodami je, kako pogosto moraš misliti na svojo kontracepcijo.',
    comparison: [
      {title: 'Tableta', detail: 'Vsakodnevno dejanje'},
      {title: 'Obliž', detail: 'Tedenska menjava'},
      {title: 'Obroček', detail: 'Cikel nekaj tednov'},
      {title: 'Vsadek', detail: 'Dolgodelujoča rešitev'},
      {title: 'Hormonska maternična spirala', detail: 'Dolgodelujoča rešitev'},
    ],
    bodyReactionTitle: 'Spremljanje odziva tvojega telesa',
    bodyReactionText: 'Hormonska metoda se lahko razlikuje od osebe do osebe. Nekatere ženske opazijo spremembe cikla, krvavitve ali druge stranske učinke. Te reakcije samodejno ne pomenijo, da metoda ni prava zate, a jih je vredno spremljati.',
    alertTitle: 'Na kaj je vredno paziti',
    alertText: 'Če je kak učinek izrazit, dolgotrajen ali nenavaden, ne ostani sama s svojimi vprašanji. Zdravnik, babica ali drug zdravstveni delavec ti lahko pomaga odločiti, ali nadaljevati, prilagoditi ali zamenjati metodo.',
    projectsTitle: 'Upoštevanje tvojih načrtov',
    projectsBody: 'Tvoji načrti glede nosečnosti lahko vplivajo tudi na izbiro. Če se želiš nekaj let izogniti nosečnosti, je lahko vredno razmisliti o dolgodelujoči metodi. Če razmišljaš o nosečnosti prej, so druge možnosti morda bolj primerne za tvoj časovni okvir.',
    keepInMindTitle: 'Vredno imeti v mislih',
    keepInMindText: 'Pogovor o tvojih načrtih glede nosečnosti, tudi če so še daleč ali negotovi, pomaga zdravstvenemu delavcu bolje usmeriti pogovor.',
    section4Body: 'Pregled ti omogoča, da pretehtaš prednosti, omejitve in možne kontraindikacije vsake metode. Vnaprej lahko pripraviš nekaj vprašanj, da ne pozabiš nič pomembnega.',
    questionCardTitle: 'Koristna vprašanja za postavitev',
    professionalQuestions: [
      'Kakšne so prednosti te metode zame?',
      'Kakšne stranske učinke lahko imam?',
      'Kako jo pravilno uporabljati?',
      'Kaj storiti, če jo pozabim, če se premakne ali če jo želim prekiniti?',
      'Ali ta metoda ustreza mojim načrtom glede nosečnosti?',
    ],
    professionalTipTitle: 'Vredno vedeti',
    professionalTipText: 'Babica ali zdravnik lahko upošteva tvojo zdravstveno zgodovino, zdravljenja, želje in način življenja, preden priporoči metodo.',
    summaryTitle: 'Najpomembnejše',
    summaryItems: [
      'Izberi metodo, ki ustreza tvojemu vsakdanu.',
      'Upoštevaj svoje prenašanje in želje.',
      'Razmisli o svojih načrtih glede nosečnosti in časovnem okviru.',
      'Poišči nasvet strokovnjaka, če nisi prepričana.',
    ],
    finalTipTitle: 'Zapomni si',
    finalTipText: 'Najboljša metoda ni nujno tista, ki se zdi najprimernejša ali najbolj priljubljena. To je tista, ki ustreza tvoji situaciji, potrebam in željam, po informiranem pogovoru z zdravstvenim delavcem.',
    disclaimerText: 'Ta članek je samo informativne narave in ne nadomešča osebnega zdravniškega nasveta.',
    shareMessage: 'Izbira zdravljenja, ki ti ustreza — AWA',
  },
  ne: {
    badge: 'आफ्नो विधि छान्दै',
    title: 'तपाईंलाई मिल्ने उपचार\nछान्नुहोस्',
    metaDuration: '7 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'तपाईंको दैनिक जीवन, आवश्यकता र योजनाअनुसार मिल्ने गर्भनिरोधक विधि भेट्टाउन आफैँलाई सोध्नुपर्ने सही प्रश्नहरू।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'आफैँलाई सोध्ने प्रश्नहरू',
      'कुनै पनि विधि पूर्ण रूपमा “सबैभन्दा राम्रो” हुँदैन',
      'फरक पार्न सक्ने मापदण्डहरू',
      'व्यावसायिकसँग छलफल गर्ने',
      'मुख्य कुराहरू',
    ],
    section1Body: 'सबैका लागि एउटै आदर्श गर्भनिरोधक विधि हुँदैन। विधि छान्नुअघि आफ्ना बानी, रुचि, सहनशीलता र योजनाबारे सोच्नु मद्दतकारी हुन सक्छ।',
    questions: [
      'मेरो शरीरले हर्मोनहरूप्रति कसरी प्रतिक्रिया दिन्छ?',
      'मलाई दैनिक वा साप्ताहिक कार्य चाहिन्छ, कि लामो अवधिसम्म काम गर्ने समाधान?',
      'के मेरो मध्यम अवधिमा गर्भधारणको योजना छ?',
      'मेरो बजेट कति छ, र यो गर्भनिरोधक विधि कत्तिको पहुँचयोग्य छ?',
    ],
    section2Body: 'दुई व्यक्तिले फरक विधि छानेर पनि दुवैले आफ्नो अवस्थाका लागि पूर्ण रूपमा उपयुक्त छनोट गरेको हुन सक्छ। सही छनोट विशेष गरी तपाईं आफ्नो गर्भनिरोधन कसरी प्रयोग गर्न चाहनुहुन्छ र के खोज्दै हुनुहुन्छ भन्नेमा निर्भर गर्छ।',
    highlightTitle: 'सम्झनुपर्ने मुख्य कुरा',
    highlightText: 'कागजमा आकर्षक देखिने विधि दैनिक जीवनमा तपाईंका लागि सबैभन्दा सरल वा सहज हुनैपर्छ भन्ने छैन।',
    section3Body: 'धेरै विकल्प तुलना गर्न, तपाईं विभिन्न मापदण्डहरू हेर्न सक्नुहुन्छ। लक्ष्य सबै कुरा कण्ठ गर्नु होइन, तपाईंका लागि साँच्चै के महत्त्वपूर्ण छ पहिचान गर्नु हो।',
    priorities: [
      {title: 'सरलता', text: 'केही विधिहरूलाई दैनिक कार्य चाहिन्छ, भने केहीलाई साप्ताहिक वा त्योभन्दा निकै कम ध्यान चाहिन्छ।'},
      {title: 'सहनशीलता', text: 'तपाईंले महसुस गर्ने असरहरू व्यक्तिपिच्छे फरक हुन सक्छन्। आफ्नो शरीरले कसरी प्रतिक्रिया दिन्छ ध्यान दिनु र केही असहज लागे त्यसबारे कुरा गर्नु महत्त्वपूर्ण छ।'},
      {title: 'गर्भधारणको योजना', text: 'चाँडै गर्भावस्थाको आशा गर्दै हुनुहुन्छ भने, प्रयोगको अवधि र रोकेपछि उर्वरता फर्कने कुरा तपाईंले छलफल गर्ने विषयको हिस्सा हुन सक्छ।'},
      {title: 'प्रभावकारिता', text: 'प्रभावकारिता छानिएको विधिमा मात्र होइन, यसलाई सही र निरन्तर प्रयोग गर्नेमा पनि निर्भर गर्छ।'},
    ],
    rhythmTitle: 'कति पटक प्रयोग गर्नुपर्छ',
    rhythmBody: 'विधिहरूबीचको एउटा महत्त्वपूर्ण भिन्नता तपाईंले आफ्नो गर्भनिरोधनबारे कति पटक सोच्नुपर्छ भन्ने हो।',
    comparison: [
      {title: 'चक्की', detail: 'दैनिक कार्य'},
      {title: 'प्याच', detail: 'साप्ताहिक परिवर्तन'},
      {title: 'रिङ', detail: 'केही हप्ताको चक्र'},
      {title: 'इम्प्लान्ट', detail: 'लामो अवधिको समाधान'},
      {title: 'हर्मोनल IUD', detail: 'लामो अवधिको समाधान'},
    ],
    bodyReactionTitle: 'आफ्नो शरीरको प्रतिक्रिया हेर्ने',
    bodyReactionText: 'हर्मोनल विधि व्यक्तिपिच्छे फरक अनुभूत हुन सक्छ। कसैले आफ्नो चक्र, रक्तस्राव वा अन्य साइड इफेक्टमा परिवर्तन देख्छन्। यी प्रतिक्रियाले विधि तपाईंलाई उपयुक्त छैन भन्ने स्वतः जनाउँदैनन्, तर तिनमा ध्यान दिनु लायक छ।',
    alertTitle: 'ध्यान दिन लायक',
    alertText: 'कुनै असर ठूलो, लगातार वा असामान्य छ भने, आफ्ना प्रश्नहरूसँग एक्लै नबस्नुहोस्। चिकित्सक, सुँडेनी वा अन्य स्वास्थ्यकर्मीले विधि जारी राख्ने, मिलाउने वा बदल्ने निर्धारण गर्न मद्दत गर्न सक्छन्।',
    projectsTitle: 'आफ्ना योजनाहरू ध्यानमा राख्ने',
    projectsBody: 'तपाईंका गर्भधारणका योजनाहरूले पनि तपाईंको छनोटलाई प्रभाव पार्न सक्छन्। धेरै वर्षसम्म गर्भधारण टार्न चाहनुहुन्छ भने, लामो अवधिको विधि विचार गर्न लायक हुन सक्छ। चाँडै गर्भावस्थाबारे सोच्दै हुनुहुन्छ भने, अन्य विकल्पहरू तपाईंको समयरेखासँग बढी मिल्न सक्छन्।',
    keepInMindTitle: 'मनमा राख्न लायक',
    keepInMindText: 'आफ्ना गर्भधारणका योजनाहरू, तिनीहरू अझै टाढा वा अनिश्चित भए पनि, बारे कुरा गर्दा स्वास्थ्यकर्मीलाई छलफलको मार्गदर्शन गर्न राम्रो मद्दत मिल्छ।',
    section4Body: 'भेटघाटले तपाईंलाई हरेक विधिका फाइदा, बाधा र सम्भावित निषेधहरू तौलन दिन्छ। कुनै महत्त्वपूर्ण कुरा नबिर्सन तपाईंले पहिल्यै केही प्रश्नहरू तयार गर्न सक्नुहुन्छ।',
    questionCardTitle: 'सोध्न उपयोगी प्रश्नहरू',
    professionalQuestions: [
      'मेरो लागि यो विधिका फाइदाहरू के हुन्?',
      'मैले कस्ता साइड इफेक्टहरू अनुभव गर्न सक्छु?',
      'यसलाई सही तरिकाले कसरी प्रयोग गर्ने?',
      'यो बिर्सेमा, आफ्नो ठाउँबाट सरेमा वा रोक्न चाहेमा मैले के गर्ने?',
      'के यो विधि मेरो गर्भधारणका योजनाहरूसँग मिल्छ?',
    ],
    professionalTipTitle: 'जान्न लायक',
    professionalTipText: 'सुँडेनी वा चिकित्सकले विधि सिफारिस गर्नुअघि तपाईंको चिकित्सकीय इतिहास, उपचारहरू, रुचिहरू र जीवनशैलीलाई ध्यानमा राख्न सक्छन्।',
    summaryTitle: 'आवश्यक कुराहरू',
    summaryItems: [
      'आफ्नो दैनिक जीवनसँग मिल्ने विधि छान्नुहोस्।',
      'आफ्नो सहनशीलता र रुचिहरूलाई ध्यानमा राख्नुहोस्।',
      'आफ्ना गर्भधारणका योजना र समयरेखाबारे सोच्नुहोस्।',
      'अनिश्चित भए व्यावसायिकसँग सल्लाह लिनुहोस्।',
    ],
    finalTipTitle: 'सम्झनुहोस्',
    finalTipText: 'सबैभन्दा राम्रो विधि सबैभन्दा सुविधाजनक वा सबैभन्दा लोकप्रिय देखिने नै हुनैपर्छ भन्ने छैन। यो स्वास्थ्यकर्मीसँगको जानकारीपूर्ण छलफलपछि तपाईंको अवस्था, आवश्यकता र रुचिसँग मिल्ने विधि हो।',
    disclaimerText: 'यो लेख केवल जानकारीका लागि हो र व्यक्तिगत चिकित्सकीय सल्लाहको स्थान लिँदैन।',
    shareMessage: 'तपाईंलाई मिल्ने उपचार छान्नुहोस् — AWA',
  },
  si: {
    badge: 'ඔබේ ක්‍රමය තෝරා ගැනීම',
    title: 'ඔබට ගැළපෙන ප්‍රතිකාරය\nතෝරා ගැනීම',
    metaDuration: 'කියවීමට මිනිත්තු 7',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'මධ්‍යම',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඔබේ එදිනෙදා ජීවිතයට, ඔබේ අවශ්‍යතාවලට සහ ඔබේ සැලසුම්වලට ගැළපෙන ගර්භනිරෝධන ක්‍රමයක් සොයාගැනීමට ඔබෙන්ම අසාගත යුතු නිවැරදි ප්‍රශ්න.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'ඔබෙන්ම අසාගත යුතු ප්‍රශ්න',
      'නිරපේක්ෂ අර්ථයෙන් “හොඳම” ක්‍රමයක් නැත',
      'වෙනසක් ඇති කළ හැකි නිර්ණායක',
      'වෘත්තිකයෙකු සමඟ සාකච්ඡා කිරීම',
      'ප්‍රධාන කරුණු',
    ],
    section1Body: 'සෑම කෙනෙකුටම ගැළපෙන එකම පරමාදර්ශී ගර්භනිරෝධන ක්‍රමයක් නැත. ක්‍රමයක් තෝරා ගැනීමට පෙර, ඔබේ පුරුදු, මනාප, ඉවසීම සහ සැලසුම් ගැන සිතා බැලීම උපකාරී විය හැක.',
    questions: [
      'මගේ ශරීරය හෝමෝනවලට ප්‍රතිචාර දක්වන්නේ කෙසේද?',
      'මට දෛනික හෝ සතිපතා ක්‍රියාවක් අවශ්‍යද, නැතහොත් දිගුකාලීන විසඳුමක්ද?',
      'මට මධ්‍ය කාලීන ගැබ්ගැනීමේ සැලසුමක් තිබේද?',
      'මගේ අයවැය කුමක්ද, සහ මෙම ගර්භනිරෝධන ක්‍රමය කෙතරම් ප්‍රවේශ්‍යද?',
    ],
    section2Body: 'පුද්ගලයන් දෙදෙනෙකුට වෙනස් ක්‍රම තෝරා ගත හැකි අතර දෙදෙනාම තම තත්ත්වයට පරිපූර්ණව ගැළපෙන තේරීමක් කර ඇත. නිවැරදි තේරීම විශේෂයෙන් රඳා පවතින්නේ ඔබට ඔබේ ගර්භනිරෝධනය භාවිතා කිරීමට අවශ්‍ය ආකාරය සහ ඔබ සොයන දේ මතය.',
    highlightTitle: 'මතක තබාගත යුතු ප්‍රධානම කරුණ',
    highlightText: 'කඩදාසි මත ආකර්ෂණීය ලෙස පෙනෙන ක්‍රමයක් දිනපතා ඔබට වඩාත්ම සරල හෝ වඩාත්ම සුවපහසු එක විය යුතු නැත.',
    section3Body: 'විකල්ප කිහිපයක් සංසන්දනය කිරීමට, ඔබට විවිධ නිර්ණායක දෙස බැලිය හැක. අරමුණ සියල්ල කටපාඩම් කිරීම නොව, ඔබට සැබවින්ම වැදගත් දේ හඳුනාගැනීමයි.',
    priorities: [
      {title: 'සරල බව', text: 'සමහර ක්‍රමවලට දෛනික ක්‍රියාවක් අවශ්‍ය වන අතර, අනෙක් ඒවාට අවශ්‍ය සතිපතා අවධානය පමණක් හෝ ඊට වඩා බොහෝ අඩුවෙන්.'},
      {title: 'ඉවසීම', text: 'ඔබට දැනෙන බලපෑම් පුද්ගලයාගෙන් පුද්ගලයාට වෙනස් විය හැක. ඔබේ ශරීරය ප්‍රතිචාර දක්වන ආකාරය නිරීක්ෂණය කිරීම සහ යමක් ඔබට කරදර කරන්නේ නම් ඒ ගැන කතා කිරීම වැදගත්.'},
      {title: 'ගැබ්ගැනීමේ සැලසුම්', text: 'ඔබ ඉක්මනින් ගැබ්ගැනීමක් බලාපොරොත්තු වන්නේ නම්, භාවිතයේ කාලය සහ නැවැත්වීමෙන් පසු සාරවත් බව නැවත පැමිණීම ඔබ සාකච්ඡා කරන දේවල කොටසක් විය හැක.'},
      {title: 'සඵලතාව', text: 'සඵලතාව රඳා පවතින්නේ තෝරාගත් ක්‍රමය මත පමණක් නොව, එය නිවැරදිව සහ ස්ථාවරව භාවිතා කිරීම මතද වේ.'},
    ],
    rhythmTitle: 'ඔබට එය භාවිතා කිරීමට අවශ්‍ය සංඛ්‍යාතය',
    rhythmBody: 'ක්‍රම අතර එක් වැදගත් වෙනසක් නම් ඔබේ ගර්භනිරෝධනය ගැන ඔබට කොපමණ නිතර සිතිය යුතුද යන්නයි.',
    comparison: [
      {title: 'පෙත්ත', detail: 'දෛනික ක්‍රියාව'},
      {title: 'පැච්', detail: 'සතිපතා මාරු කිරීම'},
      {title: 'මුද්ද', detail: 'සති කිහිපයක චක්‍රය'},
      {title: 'රෝපණය', detail: 'දිගුකාලීන විසඳුම'},
      {title: 'හෝමෝන IUD', detail: 'දිගුකාලීන විසඳුම'},
    ],
    bodyReactionTitle: 'ඔබේ ශරීරය ප්‍රතිචාර දක්වන ආකාරය නිරීක්ෂණය කිරීම',
    bodyReactionText: 'හෝමෝන ක්‍රමයක් පුද්ගලයාගෙන් පුද්ගලයාට වෙනස් ලෙස දැනිය හැක. සමහරුන් ඔවුන්ගේ චක්‍රයේ, ලේ ගැලීමේ, හෝ වෙනත් අතුරු ආබාධවල වෙනස්කම් දකිති. මෙම ප්‍රතිචාරවල ස්වයංක්‍රීයව අදහස් වන්නේ ක්‍රමය ඔබට නොගැළපෙන බව නොවේ, නමුත් ඒවාට අවධානය යොමු කිරීම වටී.',
    alertTitle: 'අවධානයෙන් සිටීම වටී',
    alertText: 'බලපෑමක් සැලකිය යුතු, දිගටම පවතින, හෝ අසාමාන්‍ය නම්, ඔබේ ප්‍රශ්න සමඟ තනිව නොසිටින්න. වෛද්‍යවරයෙකුට, ප්‍රසව හෙදියකට හෝ වෙනත් සෞඛ්‍ය වෘත්තිකයෙකුට ක්‍රමය දිගටම කරගෙන යාමද, සකස් කිරීමද, නැතහොත් වෙනස් කිරීමද යන්න තීරණය කිරීමට ඔබට උදව් කළ හැක.',
    projectsTitle: 'ඔබේ සැලසුම් සැලකිල්ලට ගැනීම',
    projectsBody: 'ඔබේ ගැබ්ගැනීමේ සැලසුම් ඔබේ තේරීමට ද බලපෑ හැක. ඔබට වසර කිහිපයක් ගැබ්ගැනීම වළක්වා ගැනීමට අවශ්‍ය නම්, දිගුකාලීන ක්‍රමයක් සලකා බැලීම වටී. ඔබ ඊට ඉක්මනින් ගැබ්ගැනීමක් ගැන සිතන්නේ නම්, වෙනත් විකල්ප ඔබේ කාලරාමුවට වඩා හොඳින් ගැළපිය හැක.',
    keepInMindTitle: 'මතක තබාගැනීම වටී',
    keepInMindText: 'ඔබේ ගැබ්ගැනීමේ සැලසුම් තවමත් දුරස්ථ හෝ අවිනිශ්චිත වුවද, ඒවා ගැන කතා කිරීම සෞඛ්‍ය වෘත්තිකයාට සාකච්ඡාව වඩා හොඳින් මඟ පෙන්වීමට උපකාරී වේ.',
    section4Body: 'හමුවීමකදී සෑම ක්‍රමයකම ප්‍රතිලාභ, සීමාවන් සහ ඇතිවිය හැකි ප්‍රතිවිරෝධතා කිරා මැන බැලීමට ඔබට ඉඩ ලැබේ. වැදගත් කිසිවක් අමතක නොවන පරිදි ඔබට කලින් ප්‍රශ්න කිහිපයක් සූදානම් කළ හැක.',
    questionCardTitle: 'ඇසිය යුතු ප්‍රයෝජනවත් ප්‍රශ්න',
    professionalQuestions: [
      'මට මෙම ක්‍රමයේ ප්‍රතිලාභ මොනවාද?',
      'මට අත්විඳින්නට පුළුවන් අතුරු ආබාධ මොනවාද?',
      'මම එය නිවැරදිව භාවිතා කරන්නේ කෙසේද?',
      'මම එය අමතක කළොත්, එය ස්ථානයෙන් ඉවත් වුවහොත්, හෝ මට එය නවත්වන්න අවශ්‍ය නම් මා කළ යුත්තේ කුමක්ද?',
      'මෙම ක්‍රමය මගේ ගැබ්ගැනීමේ සැලසුම්වලට ගැළපේද?',
    ],
    professionalTipTitle: 'දැනගත යුතු දේ',
    professionalTipText: 'ප්‍රසව හෙදියකට හෝ වෛද්‍යවරයෙකුට ක්‍රමයක් නිර්දේශ කිරීමට පෙර ඔබේ වෛද්‍ය ඉතිහාසය, ප්‍රතිකාර, මනාප සහ ජීවන රටාව සැලකිල්ලට ගත හැක.',
    summaryTitle: 'අත්‍යවශ්‍ය දේ',
    summaryItems: [
      'ඔබේ එදිනෙදා ජීවිතයට ගැළපෙන ක්‍රමයක් තෝරන්න.',
      'ඔබේ ඉවසීම සහ මනාප සැලකිල්ලට ගන්න.',
      'ඔබේ ගැබ්ගැනීමේ සැලසුම් සහ ඔබේ කාලරාමුව ගැන සිතන්න.',
      'ඔබට විශ්වාස නැත්නම් වෘත්තිකයෙකුගෙන් උපදෙස් ඉල්ලන්න.',
    ],
    finalTipTitle: 'මතක තබාගන්න',
    finalTipText: 'හොඳම ක්‍රමය අනිවාර්යයෙන්ම වඩාත්ම පහසු හෝ වඩාත්ම ජනප්‍රිය ලෙස පෙනෙන එක නොවේ. එය සෞඛ්‍ය වෘත්තිකයෙකු සමඟ දැනුවත් සාකච්ඡාවකින් පසු, ඔබේ තත්ත්වයට, අවශ්‍යතාවලට සහ මනාපවලට ගැළපෙන එකයි.',
    disclaimerText: 'මෙම ලිපිය තොරතුරු සඳහා පමණක් වන අතර පුද්ගලීකරණය කළ වෛද්‍ය උපදෙස් වෙනුවට නොපවතී.',
    shareMessage: 'ඔබට ගැළපෙන ප්‍රතිකාරය තෝරා ගැනීම — AWA',
  },
  th: {
    badge: 'การเลือกวิธีของคุณ',
    title: 'เลือกการรักษา\nที่เหมาะกับคุณ',
    metaDuration: 'อ่าน 7 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'ปานกลาง',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'คำถามที่ควรถามตัวเองเพื่อหาวิธีคุมกำเนิดที่เหมาะกับชีวิตประจำวัน ความต้องการ และแผนของคุณ',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'คำถามที่ควรถามตัวเอง',
      'ไม่มีวิธีใดที่ “ดีที่สุด” อย่างสมบูรณ์',
      'เกณฑ์ที่อาจสร้างความแตกต่าง',
      'การปรึกษาผู้เชี่ยวชาญ',
      'ประเด็นสำคัญ',
    ],
    section1Body: 'ไม่มีวิธีคุมกำเนิดที่เหมาะอย่างสมบูรณ์แบบสำหรับทุกคน ก่อนเลือกวิธี การคิดถึงนิสัย ความชอบ ความทนต่อยา และแผนของคุณจะช่วยได้',
    questions: [
      'ร่างกายของฉันตอบสนองต่อฮอร์โมนอย่างไร?',
      'ฉันต้องการวิธีที่ต้องทำทุกวัน ทุกสัปดาห์ หรือวิธีที่ออกฤทธิ์ยาว?',
      'ฉันมีแผนจะตั้งครรภ์ในระยะกลางหรือไม่?',
      'งบประมาณของฉันเป็นอย่างไร และวิธีคุมกำเนิดนี้หาได้ง่ายแค่ไหน?',
    ],
    section2Body: 'สองคนอาจเลือกวิธีต่างกันและทั้งคู่ล้วนเลือกได้เหมาะกับสถานการณ์ของตัวเอง ทางเลือกที่เหมาะขึ้นอยู่กับวิธีที่คุณอยากใช้การคุมกำเนิดและสิ่งที่คุณมองหาเป็นพิเศษ',
    highlightTitle: 'สิ่งสำคัญที่ควรจำ',
    highlightText: 'วิธีที่ดูน่าสนใจบนกระดาษ ไม่จำเป็นต้องเป็นวิธีที่ง่ายหรือสบายที่สุดสำหรับคุณในแต่ละวัน',
    section3Body: 'เพื่อเปรียบเทียบหลายทางเลือก คุณดูเกณฑ์ต่าง ๆ ได้ เป้าหมายไม่ใช่การจำทุกอย่าง แต่เป็นการระบุสิ่งที่สำคัญกับคุณจริง ๆ',
    priorities: [
      {title: 'ความง่าย', text: 'บางวิธีต้องทำทุกวัน ขณะที่บางวิธีต้องใส่ใจเพียงรายสัปดาห์ หรือน้อยกว่านั้นมาก'},
      {title: 'ความทนต่อยา', text: 'ผลที่คุณรู้สึกแตกต่างกันในแต่ละคน สิ่งสำคัญคือสังเกตว่าร่างกายตอบสนองอย่างไร และพูดคุยหากมีสิ่งที่รบกวน'},
      {title: 'แผนการตั้งครรภ์', text: 'หากคุณหวังจะตั้งครรภ์เร็ว ๆ นี้ ระยะเวลาการใช้และการกลับมาของภาวะเจริญพันธุ์หลังหยุดใช้เป็นสิ่งที่ควรพูดคุย'},
      {title: 'ประสิทธิภาพ', text: 'ประสิทธิภาพไม่ได้ขึ้นอยู่กับวิธีที่เลือกเท่านั้น แต่ขึ้นกับการใช้อย่างถูกต้องและสม่ำเสมอด้วย'},
    ],
    rhythmTitle: 'ต้องใช้บ่อยแค่ไหน',
    rhythmBody: 'ความแตกต่างสำคัญอย่างหนึ่งระหว่างแต่ละวิธีคือความถี่ที่คุณต้องนึกถึงการคุมกำเนิด',
    comparison: [
      {title: 'ยาเม็ด', detail: 'ทำทุกวัน'},
      {title: 'แผ่นแปะ', detail: 'เปลี่ยนรายสัปดาห์'},
      {title: 'ห่วง', detail: 'รอบหลายสัปดาห์'},
      {title: 'ยาฝัง', detail: 'ออกฤทธิ์ยาว'},
      {title: 'ห่วงอนามัยฮอร์โมน', detail: 'ออกฤทธิ์ยาว'},
    ],
    bodyReactionTitle: 'สังเกตการตอบสนองของร่างกาย',
    bodyReactionText: 'วิธีคุมกำเนิดด้วยฮอร์โมนอาจให้ความรู้สึกต่างกันในแต่ละคน บางคนสังเกตเห็นการเปลี่ยนแปลงของรอบเดือน เลือดที่ออก หรือผลข้างเคียงอื่น ๆ ปฏิกิริยาเหล่านี้ไม่ได้หมายความว่าวิธีนั้นไม่เหมาะกับคุณโดยอัตโนมัติ แต่ควรใส่ใจ',
    alertTitle: 'สิ่งที่ควรสังเกต',
    alertText: 'หากผลที่เกิดขึ้นรุนแรง คงอยู่ หรือผิดปกติ อย่าเก็บคำถามไว้คนเดียว แพทย์ ผดุงครรภ์ หรือบุคลากรทางการแพทย์อื่น ๆ ช่วยคุณตัดสินใจได้ว่าจะใช้ต่อ ปรับ หรือเปลี่ยนวิธี',
    projectsTitle: 'คำนึงถึงแผนของคุณ',
    projectsBody: 'แผนการตั้งครรภ์ของคุณก็มีอิทธิพลต่อการเลือกได้ หากคุณต้องการหลีกเลี่ยงการตั้งครรภ์หลายปี วิธีที่ออกฤทธิ์ยาวอาจน่าพิจารณา หากคุณคิดจะตั้งครรภ์เร็วกว่านั้น ทางเลือกอื่นอาจเหมาะกับกรอบเวลาของคุณกว่า',
    keepInMindTitle: 'สิ่งที่ควรจำไว้',
    keepInMindText: 'การพูดคุยเรื่องแผนการตั้งครรภ์ของคุณ แม้จะยังอยู่ไกลหรือยังไม่แน่นอน ช่วยให้บุคลากรทางการแพทย์นำการพูดคุยได้ดียิ่งขึ้น',
    section4Body: 'การนัดหมายช่วยให้คุณชั่งน้ำหนักประโยชน์ ข้อจำกัด และข้อห้ามใช้ที่เป็นไปได้ของแต่ละวิธี คุณเตรียมคำถามไว้ล่วงหน้าเพื่อไม่ให้ลืมสิ่งสำคัญได้',
    questionCardTitle: 'คำถามที่เป็นประโยชน์ที่ควรถาม',
    professionalQuestions: [
      'วิธีนี้มีประโยชน์อะไรสำหรับฉัน?',
      'ฉันอาจมีผลข้างเคียงอะไรบ้าง?',
      'ฉันใช้อย่างถูกต้องได้อย่างไร?',
      'ฉันควรทำอย่างไรหากลืม หากเลื่อนหลุดจากตำแหน่ง หรือหากอยากหยุดใช้?',
      'วิธีนี้เข้ากับแผนการตั้งครรภ์ของฉันหรือไม่?',
    ],
    professionalTipTitle: 'ควรรู้',
    professionalTipText: 'ผดุงครรภ์หรือแพทย์พิจารณาประวัติทางการแพทย์ การรักษา ความชอบ และวิถีชีวิตของคุณก่อนแนะนำวิธีได้',
    summaryTitle: 'สาระสำคัญ',
    summaryItems: [
      'เลือกวิธีที่เข้ากับชีวิตประจำวันของคุณ',
      'คำนึงถึงความทนต่อยาและความชอบของคุณ',
      'คิดถึงแผนการตั้งครรภ์และกรอบเวลาของคุณ',
      'ขอคำแนะนำจากผู้เชี่ยวชาญหากคุณไม่แน่ใจ',
    ],
    finalTipTitle: 'โปรดจำไว้',
    finalTipText: 'วิธีที่ดีที่สุดไม่จำเป็นต้องเป็นวิธีที่ดูสะดวกที่สุดหรือได้รับความนิยมที่สุด แต่เป็นวิธีที่เหมาะกับสถานการณ์ ความต้องการ และความชอบของคุณ หลังการพูดคุยอย่างรอบรู้กับบุคลากรทางการแพทย์',
    disclaimerText: 'บทความนี้เพื่อให้ข้อมูลเท่านั้น และไม่ได้ทดแทนคำแนะนำทางการแพทย์เฉพาะบุคคล',
    shareMessage: 'เลือกการรักษาที่เหมาะกับคุณ — AWA',
  },
  vi: {
    badge: 'CHỌN PHƯƠNG PHÁP CỦA BẠN',
    title: 'Chọn liệu pháp\nphù hợp với bạn',
    metaDuration: '7 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Trung cấp',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Những câu hỏi đúng nên tự hỏi để tìm một biện pháp tránh thai phù hợp với cuộc sống hằng ngày, nhu cầu và kế hoạch của bạn.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Những câu hỏi nên tự hỏi',
      'Không có phương pháp nào là “tốt nhất” một cách tuyệt đối',
      'Những tiêu chí có thể tạo nên khác biệt',
      'Trao đổi với chuyên gia',
      'Những điểm chính cần nhớ',
    ],
    section1Body: 'Không có một biện pháp tránh thai lý tưởng duy nhất cho tất cả mọi người. Trước khi chọn một phương pháp, bạn có thể suy nghĩ về thói quen, sở thích, khả năng dung nạp và kế hoạch của mình.',
    questions: [
      'Cơ thể tôi phản ứng với hormone như thế nào?',
      'Tôi cần một hành động hằng ngày hay hằng tuần, hay một giải pháp tác dụng lâu dài?',
      'Tôi có kế hoạch mang thai trong trung hạn không?',
      'Ngân sách của tôi là bao nhiêu và biện pháp tránh thai này dễ tiếp cận đến đâu?',
    ],
    section2Body: 'Hai người có thể chọn hai phương pháp khác nhau và cả hai đều đã có lựa chọn hoàn toàn phù hợp với hoàn cảnh của mình. Lựa chọn đúng phụ thuộc đặc biệt vào cách bạn muốn sử dụng biện pháp tránh thai và điều bạn đang tìm kiếm.',
    highlightTitle: 'Điều quan trọng cần nhớ',
    highlightText: 'Một phương pháp trông hấp dẫn trên giấy chưa chắc là phương pháp đơn giản hoặc thoải mái nhất với bạn trong cuộc sống hằng ngày.',
    section3Body: 'Để so sánh nhiều lựa chọn, bạn có thể xem xét các tiêu chí khác nhau. Mục tiêu không phải là thuộc lòng mọi thứ, mà là xác định điều thực sự quan trọng với bạn.',
    priorities: [
      {title: 'Sự đơn giản', text: 'Một số phương pháp đòi hỏi một hành động hằng ngày, trong khi số khác chỉ cần chú ý hằng tuần hoặc thưa hơn nhiều.'},
      {title: 'Khả năng dung nạp', text: 'Những tác động bạn cảm thấy có thể khác nhau giữa từng người. Điều quan trọng là để ý cơ thể bạn phản ứng ra sao và trao đổi nếu có điều gì làm bạn khó chịu.'},
      {title: 'Kế hoạch mang thai', text: 'Nếu bạn mong muốn mang thai sớm, thời gian sử dụng và việc khả năng sinh sản trở lại sau khi ngừng có thể là một phần cần trao đổi.'},
      {title: 'Hiệu quả', text: 'Hiệu quả không chỉ phụ thuộc vào phương pháp đã chọn mà còn vào việc sử dụng đúng và đều đặn.'},
    ],
    rhythmTitle: 'Mức độ thường xuyên cần sử dụng',
    rhythmBody: 'Một khác biệt quan trọng giữa các phương pháp là mức độ thường xuyên bạn phải nghĩ đến biện pháp tránh thai của mình.',
    comparison: [
      {title: 'Thuốc uống', detail: 'Hành động hằng ngày'},
      {title: 'Miếng dán', detail: 'Thay hằng tuần'},
      {title: 'Vòng tránh thai', detail: 'Chu kỳ nhiều tuần'},
      {title: 'Que cấy', detail: 'Giải pháp tác dụng lâu dài'},
      {title: 'Vòng tránh thai nội tiết (IUD)', detail: 'Giải pháp tác dụng lâu dài'},
    ],
    bodyReactionTitle: 'Quan sát phản ứng của cơ thể bạn',
    bodyReactionText: 'Một phương pháp nội tiết có thể mang lại cảm giác khác nhau ở từng người. Một số người nhận thấy thay đổi ở chu kỳ, lượng máu kinh hoặc các tác dụng phụ khác. Những phản ứng này không tự động có nghĩa là phương pháp không phù hợp với bạn, nhưng đáng để chú ý.',
    alertTitle: 'Điều đáng chú ý',
    alertText: 'Nếu một tác động đáng kể, kéo dài hoặc bất thường, đừng giữ thắc mắc một mình. Bác sĩ, nữ hộ sinh hoặc nhân viên y tế khác có thể giúp bạn quyết định nên tiếp tục, điều chỉnh hay đổi phương pháp.',
    projectsTitle: 'Cân nhắc kế hoạch của bạn',
    projectsBody: 'Kế hoạch mang thai của bạn cũng có thể ảnh hưởng đến lựa chọn. Nếu bạn muốn tránh thai trong vài năm, một phương pháp tác dụng lâu dài có thể đáng cân nhắc. Nếu bạn đang nghĩ đến việc mang thai sớm hơn, các lựa chọn khác có thể phù hợp hơn với lộ trình của bạn.',
    keepInMindTitle: 'Điều đáng ghi nhớ',
    keepInMindText: 'Nói về kế hoạch mang thai của bạn, kể cả khi còn xa hoặc chưa chắc chắn, giúp nhân viên y tế định hướng cuộc trao đổi tốt hơn.',
    section4Body: 'Một buổi hẹn cho phép bạn cân nhắc lợi ích, ràng buộc và các chống chỉ định có thể có của từng phương pháp. Bạn có thể chuẩn bị trước vài câu hỏi để không quên điều gì quan trọng.',
    questionCardTitle: 'Những câu hỏi hữu ích nên hỏi',
    professionalQuestions: [
      'Phương pháp này có những lợi ích gì với tôi?',
      'Tôi có thể gặp những tác dụng phụ nào?',
      'Làm thế nào để sử dụng đúng cách?',
      'Tôi nên làm gì nếu quên, nếu nó bị lệch vị trí hoặc nếu tôi muốn ngừng?',
      'Phương pháp này có phù hợp với kế hoạch mang thai của tôi không?',
    ],
    professionalTipTitle: 'Nên biết',
    professionalTipText: 'Nữ hộ sinh hoặc bác sĩ có thể cân nhắc tiền sử bệnh, các thuốc đang dùng, sở thích và lối sống của bạn trước khi đề xuất một phương pháp.',
    summaryTitle: 'Điều thiết yếu',
    summaryItems: [
      'Chọn một phương pháp phù hợp với cuộc sống hằng ngày của bạn.',
      'Cân nhắc khả năng dung nạp và sở thích của bạn.',
      'Nghĩ đến kế hoạch mang thai và lộ trình của bạn.',
      'Hỏi ý kiến chuyên gia nếu bạn chưa chắc chắn.',
    ],
    finalTipTitle: 'Hãy nhớ',
    finalTipText: 'Phương pháp tốt nhất không nhất thiết là phương pháp có vẻ tiện lợi nhất hay phổ biến nhất. Đó là phương pháp phù hợp với hoàn cảnh, nhu cầu và sở thích của bạn, sau một cuộc trao đổi có đầy đủ thông tin với nhân viên y tế.',
    disclaimerText: 'Bài viết này chỉ mang tính thông tin và không thay thế lời khuyên y khoa cá nhân hóa.',
    shareMessage: 'Chọn liệu pháp phù hợp với bạn — AWA',
  },
  uz: {
    badge: 'USULNI TANLASH',
    title: 'Sizga mos davolanishni\ntanlash',
    metaDuration: '7 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Oʻrta',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Kundalik hayotingiz, ehtiyojlaringiz va rejalaringizga mos kontratseptiv usulni topish uchun oʻzingizga berishingiz kerak boʻlgan toʻgʻri savollar.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Oʻzingizga beradigan savollar',
      'Mutlaq maʼnoda “eng yaxshi” usul yoʻq',
      'Farq qilishi mumkin boʻlgan mezonlar',
      'Mutaxassis bilan muhokama qilish',
      'Asosiy xulosalar',
    ],
    section1Body: 'Hamma uchun yagona ideal kontratseptiv usul yoʻq. Usulni tanlashdan oldin odatlaringiz, afzalliklaringiz, bardoshlik va rejalaringiz haqida oʻylash foydali boʻlishi mumkin.',
    questions: [
      'Tanam gormonlarga qanday reaksiya qiladi?',
      'Menga kundalik yoki haftalik harakat kerakmi yoki uzoq muddatli yechimmi?',
      'Oʻrta muddatli homiladorlik rejam bormi?',
      'Mening budjetim qanday va bu kontratseptiv usul qanchalik qulay?',
    ],
    section2Body: 'Ikki kishi turli usullarni tanlashi mumkin va ikkalasi ham oʻz vaziyatiga mutlaqo mos tanlov qilgan boʻladi. Toʻgʻri tanlov, xususan, kontratseptsiyadan qanday foydalanishni xohlashingizga va nimani izlayotganingizga bogʻliq.',
    highlightTitle: 'Esda tutish kerak boʻlgan asosiy narsa',
    highlightText: 'Qogʻozda jozibador koʻringan usul albatta kundalik hayotda siz uchun eng oddiy yoki eng qulay boʻlmaydi.',
    section3Body: 'Bir nechta variantni solishtirish uchun turli mezonlarga qarashingiz mumkin. Maqsad hamma narsani yoddan bilish emas, balki siz uchun haqiqatan nima muhimligini aniqlash.',
    priorities: [
      {title: 'Oddiylik', text: 'Baʼzi usullar kundalik harakatni talab qiladi, boshqalari esa faqat haftalik yoki ancha kamroq eʼtibor talab qiladi.'},
      {title: 'Bardoshlik', text: 'Sezadigan taʼsirlaringiz odamdan odamga farq qilishi mumkin. Tanangiz qanday reaksiya qilayotganini payqash va nimadir bezovta qilsa, bu haqda gaplashish muhim.'},
      {title: 'Homiladorlik rejalari', text: 'Agar yaqinda homiladorlikni umid qilsangiz, foydalanish muddati va toʻxtatgandan keyin unumdorlikning qaytishi muhokamaning bir qismi boʻlishi mumkin.'},
      {title: 'Samaradorlik', text: 'Samaradorlik nafaqat tanlangan usulga, balki uni toʻgʻri va izchil ishlatishga ham bogʻliq.'},
    ],
    rhythmTitle: 'Uni qanchalik tez-tez ishlatish kerak',
    rhythmBody: 'Usullar oʻrtasidagi muhim farqlardan biri — kontratseptsiya haqida qanchalik tez-tez oʻylashingiz kerakligi.',
    comparison: [
      {title: 'Tabletka', detail: 'Kundalik harakat'},
      {title: 'Plastir', detail: 'Haftalik almashtirish'},
      {title: 'Halqa', detail: 'Bir necha haftalik sikl'},
      {title: 'Implant', detail: 'Uzoq muddatli yechim'},
      {title: 'Gormonal spiral', detail: 'Uzoq muddatli yechim'},
    ],
    bodyReactionTitle: 'Tanangiz qanday reaksiya qilayotganini kuzatish',
    bodyReactionText: 'Gormonal usul odamdan odamga boshqacha his qilinishi mumkin. Baʼzilar siklida, qon ketishida yoki boshqa nojoʻya taʼsirlarda oʻzgarishlarni sezadi. Bu reaksiyalar usul sizga mos emasligini avtomatik anglatmaydi, lekin ularga eʼtibor berishga arziydi.',
    alertTitle: 'Kuzatishga arziydi',
    alertText: 'Agar taʼsir sezilarli, doimiy yoki odatdan tashqari boʻlsa, savollaringiz bilan yolgʻiz qolmang. Shifokor, doya yoki boshqa sogʻliqni saqlash mutaxassisi usulni davom ettirish, sozlash yoki oʻzgartirishni aniqlashga yordam beradi.',
    projectsTitle: 'Rejalaringizni hisobga olish',
    projectsBody: 'Homiladorlik rejalaringiz ham tanlovingizga taʼsir qilishi mumkin. Agar bir necha yil homiladorlikdan saqlanmoqchi boʻlsangiz, uzoq muddatli usulni koʻrib chiqishga arziydi. Agar tezroq homiladorlik haqida oʻylayotgan boʻlsangiz, boshqa variantlar muddatingizga yaxshiroq mos kelishi mumkin.',
    keepInMindTitle: 'Esda tutishga arziydi',
    keepInMindText: 'Homiladorlik rejalaringiz haqida, hatto ular hali uzoq yoki noaniq boʻlsa ham, gaplashish sogʻliqni saqlash mutaxassisiga muhokamani yaxshiroq yoʻnaltirishga yordam beradi.',
    section4Body: 'Qabul har bir usulning foydalari, cheklovlari va mumkin boʻlgan qarshi koʻrsatmalarini tortib koʻrish imkonini beradi. Muhim narsani unutmaslik uchun oldindan bir nechta savol tayyorlashingiz mumkin.',
    questionCardTitle: 'Berish foydali boʻlgan savollar',
    professionalQuestions: [
      'Bu usulning men uchun qanday foydalari bor?',
      'Qanday nojoʻya taʼsirlarni sezishim mumkin?',
      'Uni toʻgʻri qanday ishlataman?',
      'Uni unutsam, joyidan siljisa yoki toʻxtatmoqchi boʻlsam nima qilishim kerak?',
      'Bu usul homiladorlik rejalarimga mosmi?',
    ],
    professionalTipTitle: 'Bilish foydali',
    professionalTipText: 'Doya yoki shifokor usulni tavsiya qilishdan oldin sizning tibbiy tarixingiz, davolanishlaringiz, afzalliklaringiz va turmush tarzingizni hisobga olishi mumkin.',
    summaryTitle: 'Asosiy jihatlar',
    summaryItems: [
      'Kundalik hayotingizga mos usulni tanlang.',
      'Bardoshlik va afzalliklaringizni hisobga oling.',
      'Homiladorlik rejalaringiz va muddatingiz haqida oʻylang.',
      'Ishonchingiz komil boʻlmasa, mutaxassisdan maslahat soʻrang.',
    ],
    finalTipTitle: 'Esda tuting',
    finalTipText: 'Eng yaxshi usul albatta eng qulay yoki eng ommabop tuyuladigani emas. Bu — sogʻliqni saqlash mutaxassisi bilan ongli muhokamadan keyin vaziyatingiz, ehtiyojlaringiz va afzalliklaringizga mos keladigani.',
    disclaimerText: 'Bu maqola faqat maʼlumot uchun va shaxsiy tibbiy maslahatni almashtirmaydi.',
    shareMessage: 'Sizga mos davolanishni tanlash — AWA',
  },
  az: {
    badge: 'ÜSULUNUZUN SEÇİMİ',
    title: 'Sizə uyğun müalicəni\nseçmək',
    metaDuration: '7 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Orta',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Gündəlik həyatınıza, ehtiyaclarınıza və planlarınıza uyğun kontraseptiv üsul tapmaq üçün özünüzə verməli olduğunuz düzgün suallar.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Özünüzə verəcəyiniz suallar',
      'Heç bir üsul mütləq mənada “ən yaxşı” deyil',
      'Fərq yarada bilən meyarlar',
      'Mütəxəssislə müzakirə etmək',
      'Əsas nəticələr',
    ],
    section1Body: 'Hər kəs üçün yeganə ideal kontraseptiv üsul yoxdur. Üsul seçməzdən əvvəl vərdişləriniz, üstünlükləriniz, dözümlülüyünüz və planlarınız barədə düşünmək faydalı ola bilər.',
    questions: [
      'Bədənim hormonlara necə reaksiya verir?',
      'Mənə gündəlik və ya həftəlik hərəkət, yoxsa uzunmüddətli həll lazımdır?',
      'Orta müddətli hamiləlik planım varmı?',
      'Büdcəm nədir və bu kontraseptiv üsul nə dərəcədə əlçatandır?',
    ],
    section2Body: 'İki nəfər müxtəlif üsullar seçə bilər və hər ikisi öz vəziyyətinə tam uyğun seçim etmiş ola bilər. Düzgün seçim xüsusilə kontrasepsiyadan necə istifadə etmək istədiyinizdən və nə axtardığınızdan asılıdır.',
    highlightTitle: 'Yadda saxlamalı əsas məqam',
    highlightText: 'Kağız üzərində cəlbedici görünən üsul mütləq gündəlik həyatda sizin üçün ən sadə və ya ən rahat olan deyil.',
    section3Body: 'Bir neçə variantı müqayisə etmək üçün müxtəlif meyarlara baxa bilərsiniz. Məqsəd hər şeyi əzbər bilmək deyil, sizin üçün həqiqətən nəyin vacib olduğunu müəyyən etməkdir.',
    priorities: [
      {title: 'Sadəlik', text: 'Bəzi üsullar gündəlik hərəkət tələb edir, digərləri isə yalnız həftəlik və ya xeyli az tez-tez diqqət tələb edir.'},
      {title: 'Dözümlülük', text: 'Hiss etdiyiniz təsirlər şəxsdən şəxsə dəyişə bilər. Bədəninizin necə reaksiya verdiyini qeyd etmək və nəsə narahat edərsə, bu barədə danışmaq vacibdir.'},
      {title: 'Hamiləlik planları', text: 'Tezliklə hamiləlik ümid edirsinizsə, istifadə müddəti və dayandırdıqdan sonra münbitliyin qayıtması müzakirə mövzusu ola bilər.'},
      {title: 'Təsirlilik', text: 'Təsirlilik yalnız seçilmiş üsuldan deyil, həm də onun düzgün və müntəzəm istifadəsindən asılıdır.'},
    ],
    rhythmTitle: 'Onu nə qədər tez-tez istifadə etmək lazımdır',
    rhythmBody: 'Üsullar arasında vacib fərqlərdən biri kontrasepsiya barədə nə qədər tez-tez düşünməli olduğunuzdur.',
    comparison: [
      {title: 'Hap', detail: 'Gündəlik hərəkət'},
      {title: 'Yamaq', detail: 'Həftəlik dəyişmə'},
      {title: 'Halqa', detail: 'Bir neçə həftəlik dövr'},
      {title: 'İmplant', detail: 'Uzunmüddətli həll'},
      {title: 'Hormonal spiral', detail: 'Uzunmüddətli həll'},
    ],
    bodyReactionTitle: 'Bədəninizin necə reaksiya verdiyini izləmək',
    bodyReactionText: 'Hormonal üsul bir şəxsdən digərinə fərqli hiss oluna bilər. Bəziləri dövrdə, qanaxmada və ya digər yan təsirlərdə dəyişiklik hiss edir. Bu reaksiyalar üsulun sizə uyğun olmadığı demək deyil, lakin onlara diqqət etməyə dəyər.',
    alertTitle: 'Diqqət etməyə dəyər',
    alertText: 'Təsir əhəmiyyətli, davamlı və ya qeyri-adi olarsa, suallarınızla tək qalmayın. Həkim, mama və ya digər tibb işçisi üsulu davam etdirməyi, tənzimləməyi və ya dəyişməyi müəyyən etməyə kömək edə bilər.',
    projectsTitle: 'Planlarınızı nəzərə almaq',
    projectsBody: 'Hamiləlik planlarınız da seçiminizə təsir edə bilər. Bir neçə il hamiləlikdən qaçmaq istəyirsinizsə, uzunmüddətli üsul nəzərdən keçirilə bilər. Tezliklə hamiləlik barədə düşünürsünüzsə, digər variantlar zaman cədvəlinizə daha yaxşı uyğun gələ bilər.',
    keepInMindTitle: 'Yadda saxlamağa dəyər',
    keepInMindText: 'Hamiləlik planlarınız hələ uzaq və ya qeyri-müəyyən olsa belə, onlar barədə danışmaq tibb işçisinə müzakirəni daha yaxşı istiqamətləndirməyə kömək edir.',
    section4Body: 'Qəbul hər üsulun faydalarını, məhdudiyyətlərini və mümkün əks göstərişlərini qiymətləndirməyə imkan verir. Vacib heç nəyi unutmamaq üçün əvvəlcədən bir neçə sual hazırlaya bilərsiniz.',
    questionCardTitle: 'Verməyə dəyər faydalı suallar',
    professionalQuestions: [
      'Bu üsulun mənim üçün faydaları nələrdir?',
      'Hansı yan təsirləri yaşaya bilərəm?',
      'Ondan necə düzgün istifadə etmək olar?',
      'Onu unutsam, yerindən çıxsa və ya dayandırmaq istəsəm, nə etməliyəm?',
      'Bu üsul hamiləlik planlarıma uyğundurmu?',
    ],
    professionalTipTitle: 'Bilmək faydalıdır',
    professionalTipText: 'Mama və ya həkim üsul tövsiyə etməzdən əvvəl tibbi anamnezinizi, müalicələrinizi, üstünlüklərinizi və həyat tərzinizi nəzərə ala bilər.',
    summaryTitle: 'Əsas məsələlər',
    summaryItems: [
      'Gündəlik həyatınıza uyğun üsul seçin.',
      'Dözümlülüyünüzü və üstünlüklərinizi nəzərə alın.',
      'Hamiləlik planlarınız və zaman cədvəliniz barədə düşünün.',
      'Əmin deyilsinizsə, mütəxəssisdən məsləhət alın.',
    ],
    finalTipTitle: 'Yadda saxlayın',
    finalTipText: 'Ən yaxşı üsul mütləq ən rahat və ya ən məşhur görünən deyil. O, tibb işçisi ilə məlumatlı müzakirədən sonra vəziyyətinizə, ehtiyaclarınıza və üstünlüklərinizə uyğun olandır.',
    disclaimerText: 'Bu məqalə yalnız məlumat məqsədilə təqdim olunur və fərdi tibbi məsləhəti əvəz etmir.',
    shareMessage: 'Sizə uyğun müalicəni seçmək — AWA',
  },
  ka: {
    badge: 'თქვენი მეთოდის არჩევა',
    title: 'თქვენთვის შესაფერისი\nმკურნალობის არჩევა',
    metaDuration: '7 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'საშუალო',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'სწორი კითხვები, რომლებიც საკუთარ თავს უნდა დაუსვათ, რომ იპოვოთ თქვენს ყოველდღიურობას, საჭიროებებსა და გეგმებს მორგებული კონტრაცეპტიული მეთოდი.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'კითხვები, რომლებიც საკუთარ თავს უნდა დაუსვათ',
      'არცერთი მეთოდი არ არის აბსოლუტურად „საუკეთესო“',
      'კრიტერიუმები, რომლებმაც შეიძლება განსხვავება შექმნას',
      'სპეციალისტთან განხილვა',
      'მთავარი დასკვნები',
    ],
    section1Body: 'ყველასთვის ერთი იდეალური კონტრაცეპტიული მეთოდი არ არსებობს. მეთოდის არჩევამდე შეიძლება სასარგებლო იყოს თქვენი ჩვევების, პრეფერენციების, ამტანობისა და გეგმების გააზრება.',
    questions: [
      'როგორ რეაგირებს ჩემი სხეული ჰორმონებზე?',
      'მჭირდება ყოველდღიური ან ყოველკვირეული მოქმედება თუ ხანგრძლივი მოქმედების გადაწყვეტა?',
    'მაქვს საშუალოვადიანი ორსულობის გეგმა?',
      'როგორია ჩემი ბიუჯეტი და რამდენად ხელმისაწვდომია ეს კონტრაცეპტიული მეთოდი?',
    ],
    section2Body: 'ორ ადამიანს შეუძლია სხვადასხვა მეთოდი აირჩიოს და ორივემ თავისი სიტუაციისთვის სრულიად შესაფერისი არჩევანი გააკეთოს. სწორი არჩევანი კონკრეტულად იმაზეა დამოკიდებული, როგორ გსურთ თქვენი კონტრაცეფციის გამოყენება და რას ეძებთ.',
    highlightTitle: 'მთავარი, რაც უნდა დაიმახსოვროთ',
    highlightText: 'მეთოდი, რომელიც ქაღალდზე მიმზიდველად გამოიყურება, აუცილებლად არ არის ის, რომელიც ყოველდღიურად თქვენთვის ყველაზე მარტივი ან კომფორტული იქნება.',
    section3Body: 'რამდენიმე ვარიანტის შესადარებლად შეგიძლიათ სხვადასხვა კრიტერიუმს დააკვირდეთ. მიზანი ყველაფრის ზეპირად ცოდნა არ არის, არამედ იმის გამოვლენა, რა არის თქვენთვის ნამდვილად მნიშვნელოვანი.',
    priorities: [
      {title: 'სიმარტივე', text: 'ზოგი მეთოდი ყოველდღიურ მოქმედებას მოითხოვს, ზოგს კი მხოლოდ ყოველკვირეული ყურადღება სჭირდება, ან გაცილებით იშვიათი.'},
      {title: 'ამტანობა', text: 'განცდილი ეფექტები ადამიანიდან ადამიანამდე შეიძლება განსხვავდებოდეს. მნიშვნელოვანია დააკვირდეთ, როგორ რეაგირებს თქვენი სხეული და ისაუბროთ, თუ რამე გაწუხებთ.'},
      {title: 'ორსულობის გეგმები', text: 'თუ უახლოეს მომავალში ორსულობას ელოდებით, გამოყენების ხანგრძლივობა და შეწყვეტის შემდეგ ფერტილობის დაბრუნება განსახილველ საკითხებს შეიძლება მიეკუთვნოს.'},
      {title: 'ეფექტიანობა', text: 'ეფექტიანობა დამოკიდებულია არა მხოლოდ არჩეულ მეთოდზე, არამედ მის სწორად და რეგულარულად გამოყენებაზეც.'},
    ],
    rhythmTitle: 'რა სიხშირით უნდა გამოიყენოთ',
    rhythmBody: 'მეთოდებს შორის ერთ-ერთი მნიშვნელოვანი განსხვავებაა, რამდენად ხშირად უნდა იფიქროთ თქვენს კონტრაცეფციაზე.',
    comparison: [
      {title: 'აბი', detail: 'ყოველდღიური მოქმედება'},
      {title: 'პლასტირი', detail: 'ყოველკვირეული შეცვლა'},
      {title: 'რგოლი', detail: 'რამდენიმე კვირის ციკლი'},
      {title: 'იმპლანტი', detail: 'ხანგრძლივი მოქმედების გადაწყვეტა'},
      {title: 'ჰორმონული სპირალი', detail: 'ხანგრძლივი მოქმედების გადაწყვეტა'},
    ],
    bodyReactionTitle: 'თქვენი სხეულის რეაქციაზე დაკვირვება',
    bodyReactionText: 'ჰორმონული მეთოდი ადამიანიდან ადამიანამდე სხვადასხვაგვარად შეიძლება იგრძნობოდეს. ზოგი ციკლში, სისხლდენაში ან სხვა გვერდით მოვლენებში ცვლილებებს ამჩნევს. ეს რეაქციები ავტომატურად არ ნიშნავს, რომ მეთოდი თქვენთვის შესაფერისი არ არის, მაგრამ ყურადღება უნდა მიაქციოთ.',
    alertTitle: 'ყურადღება მიაქციეთ',
    alertText: 'თუ რაიმე ეფექტი მნიშვნელოვანია, გრძელდება ან უჩვეულოა, თქვენს კითხვებთან მარტო ნუ დარჩებით. ექიმს, ბებიაქალს ან სხვა ჯანდაცვის სპეციალისტს შეუძლია დაგეხმაროთ განსაზღვროთ, გააგრძელოთ, მოარგოთ თუ შეცვალოთ მეთოდი.',
    projectsTitle: 'თქვენი გეგმების გათვალისწინება',
    projectsBody: 'თქვენი ორსულობის გეგმებმაც შეიძლება არჩევანზე იმოქმედოს. თუ რამდენიმე წლის განმავლობაში ორსულობის თავიდან აცილება გსურთ, ხანგრძლივი მოქმედების მეთოდის განხილვა შეიძლება ღირდეს. თუ უფრო ადრე ორსულობაზე ფიქრობთ, სხვა ვარიანტები შეიძლება თქვენს ვადებს უკეთ შეესაბამებოდეს.',
    keepInMindTitle: 'გასათვალისწინებელია',
    keepInMindText: 'თქვენი ორსულობის გეგმების განხილვა, თუნდაც ისინი ჯერ შორეულია ან გაურკვეველი, ჯანდაცვის სპეციალისტს განხილვის უკეთ წარმართვაში ეხმარება.',
    section4Body: 'ვიზიტი საშუალებას გაძლევთ შეაფასოთ თითოეული მეთოდის სარგებელი, შეზღუდვები და შესაძლო უკუჩვენებები. წინასწარ შეგიძლიათ რამდენიმე კითხვა მოამზადოთ, რომ არაფერი მნიშვნელოვანი არ დაგავიწყდეთ.',
    questionCardTitle: 'სასარგებლო კითხვები დასასმელად',
    professionalQuestions: [
      'რა სარგებელი აქვს ამ მეთოდს ჩემთვის?',
      'რა გვერდითი მოვლენები შეიძლება მქონდეს?',
      'როგორ გამოვიყენო ის სწორად?',
      'რა უნდა გავაკეთო, თუ დამავიწყდა, ადგილიდან დაიძრა ან შეწყვეტა მსურს?',
      'ესადაგება ეს მეთოდი ჩემს ორსულობის გეგმებს?',
    ],
    professionalTipTitle: 'კარგია ვიცოდეთ',
    professionalTipText: 'ბებიაქალს ან ექიმს შეუძლია მეთოდის რეკომენდაციამდე გაითვალისწინოს თქვენი სამედიცინო ისტორია, მკურნალობა, პრეფერენციები და ცხოვრების წესი.',
    summaryTitle: 'მთავარი',
    summaryItems: [
      'აირჩიეთ თქვენს ყოველდღიურობას მორგებული მეთოდი.',
      'გაითვალისწინეთ თქვენი ამტანობა და პრეფერენციები.',
      'იფიქრეთ თქვენს ორსულობის გეგმებსა და ვადებზე.',
      'თუ დარწმუნებული არ ხართ, სპეციალისტს ჰკითხეთ რჩევა.',
    ],
    finalTipTitle: 'დაიმახსოვრეთ',
    finalTipText: 'საუკეთესო მეთოდი აუცილებლად არ არის ის, რომელიც ყველაზე მოსახერხებლად ან ყველაზე პოპულარულად გამოიყურება. ეს არის ის, რომელიც თქვენს სიტუაციას, საჭიროებებსა და პრეფერენციებს შეესაბამება, ჯანდაცვის სპეციალისტთან ინფორმირებული განხილვის შემდეგ.',
    disclaimerText: 'ეს სტატია მხოლოდ საინფორმაციოა და პერსონალიზებულ სამედიცინო რჩევას არ ანაცვლებს.',
    shareMessage: 'თქვენთვის შესაფერისი მკურნალობის არჩევა — AWA',
  },
  hy: {
    badge: 'ԸՆՏՐԵԼ ՁԵՐ ՄԵԹՈԴԸ',
    title: 'Ընտրել ձեզ հարմար\nբուժումը',
    metaDuration: '7 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Միջին',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ճիշտ հարցեր, որոնք պետք է տալ ինքներդ ձեզ՝ ձեր առօրյային, կարիքներին և ծրագրերին համապատասխանող հակաբեղմնավորման մեթոդ գտնելու համար:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Հարցեր, որ պետք է տալ ինքներդ ձեզ',
      'Ոչ մի մեթոդ բացարձակ իմաստով «լավագույնը» չէ',
      'Չափանիշներ, որոնք կարող են փոփոխություն մտցնել',
      'Քննարկել մասնագետի հետ',
      'Հիմնական եզրակացություններ',
    ],
    section1Body: 'Չկա հակաբեղմնավորման մեկ իդեալական մեթոդ բոլորի համար: Մեթոդ ընտրելուց առաջ կարող է օգտակար լինել մտածել ձեր սովորությունների, նախասիրությունների, հանդուրժողականության և ծրագրերի մասին:',
    questions: [
      'Ինչպե՞ս է իմ մարմինը արձագանքում հորմոններին:',
      'Ինձ պե՞տք է օրական կամ շաբաթական գործողություն, թե երկարաժամկետ լուծում:',
      'Ունե՞մ միջնաժամկետ հղիության ծրագիր:',
      'Ո՞րն է իմ բյուջեն, և որքանո՞վ է մատչելի այս հակաբեղմնավորման մեթոդը:',
    ],
    section2Body: 'Երկու մարդ կարող են ընտրել տարբեր մեթոդներ, և երկուսն էլ կատարած լինեն իրենց իրավիճակին կատարյալ համապատասխանող ընտրություն: Ճիշտ ընտրությունը կախված է, մասնավորապես, նրանից, թե ինչպես եք ցանկանում օգտագործել ձեր հակաբեղմնավորումը և ինչ եք փնտրում:',
    highlightTitle: 'Հիմնականը, որ պետք է հիշել',
    highlightText: 'Թղթի վրա գրավիչ թվացող մեթոդը պարտադիր չէ, որ լինի այն, որը ձեզ համար ամենապարզը կամ ամենահարմարավետը կլինի օրեցօր:',
    section3Body: 'Մի քանի տարբերակ համեմատելու համար կարող եք նայել տարբեր չափանիշների: Նպատակը ամեն ինչ անգիր իմանալը չէ, այլ բացահայտելը, թե իրականում ինչն է ձեզ համար կարևոր:',
    priorities: [
      {title: 'Պարզություն', text: 'Որոշ մեթոդներ պահանջում են օրական գործողություն, մյուսները՝ միայն շաբաթական ուշադրություն կամ շատ ավելի հազվադեպ:'},
      {title: 'Հանդուրժողականություն', text: 'Ձեր զգացած ազդեցությունները կարող են տարբերվել մարդուց մարդ: Կարևոր է նկատել, թե ինչպես է արձագանքում ձեր մարմինը, և խոսել այդ մասին, եթե ինչ-որ բան անհանգստացնում է:'},
      {title: 'Հղիության ծրագրեր', text: 'Եթե շուտով հղիություն եք ակնկալում, օգտագործման տևողությունը և դադարեցնելուց հետո պտղաբերության վերադարձը կարող են քննարկվող կետերից լինել:'},
      {title: 'Արդյունավետություն', text: 'Արդյունավետությունը կախված է ոչ միայն ընտրված մեթոդից, այլև այն ճիշտ և կանոնավոր օգտագործելուց:'},
    ],
    rhythmTitle: 'Որքան հաճախ պետք է օգտագործել',
    rhythmBody: 'Մեթոդների միջև կարևոր տարբերություններից մեկն այն է, թե որքան հաճախ է պետք մտածել ձեր հակաբեղմնավորման մասին:',
    comparison: [
      {title: 'Հաբ', detail: 'Օրական գործողություն'},
      {title: 'Պլաստր', detail: 'Շաբաթական փոփոխություն'},
      {title: 'Օղակ', detail: 'Մի քանի շաբաթվա ցիկլ'},
      {title: 'Իմպլանտ', detail: 'Երկարաժամկետ լուծում'},
      {title: 'Հորմոնալ սպիրալ', detail: 'Երկարաժամկետ լուծում'},
    ],
    bodyReactionTitle: 'Հետևել, թե ինչպես է արձագանքում ձեր մարմինը',
    bodyReactionText: 'Հորմոնալ մեթոդը կարող է տարբեր կերպ զգացվել մարդուց մարդ: Ոմանք նկատում են փոփոխություններ իրենց ցիկլում, արյունահոսությունում կամ այլ կողմնակի ազդեցություններ: Այս արձագանքները ինքնաբերաբար չեն նշանակում, որ մեթոդը ձեզ հարմար չէ, բայց արժե ուշադրություն դարձնել դրանց:',
    alertTitle: 'Արժե հետևել',
    alertText: 'Եթե ազդեցությունը զգալի է, շարունակական կամ անսովոր, մի մնացեք ձեր հարցերի հետ մենակ: Բժիշկը, մանկաբարձուհին կամ առողջապահության այլ մասնագետը կարող է օգնել որոշել՝ շարունակել, ճշգրտել թե փոխել մեթոդը:',
    projectsTitle: 'Հաշվի առնել ձեր ծրագրերը',
    projectsBody: 'Ձեր հղիության ծրագրերը նույնպես կարող են ազդել ձեր ընտրության վրա: Եթե մի քանի տարի ցանկանում եք խուսափել հղիությունից, արժե դիտարկել երկարաժամկետ մեթոդ: Եթե շուտով հղիության մասին եք մտածում, այլ տարբերակներ կարող են ավելի լավ համապատասխանել ձեր ժամանակացույցին:',
    keepInMindTitle: 'Արժե հիշել',
    keepInMindText: 'Ձեր հղիության ծրագրերի մասին խոսելը, նույնիսկ եթե դրանք դեռ հեռավոր կամ անորոշ են, օգնում է առողջապահության մասնագետին ավելի լավ ուղղորդել քննարկումը:',
    section4Body: 'Այցը թույլ է տալիս կշռադատել յուրաքանչյուր մեթոդի օգուտները, սահմանափակումները և հնարավոր հակացուցումները: Կարող եք նախապես պատրաստել մի քանի հարց, որպեսզի ոչ մի կարևոր բան չմոռանաք:',
    questionCardTitle: 'Օգտակար հարցեր',
    professionalQuestions: [
      'Որո՞նք են այս մեթոդի օգուտները ինձ համար:',
      'Ի՞նչ կողմնակի ազդեցություններ կարող եմ զգալ:',
      'Ինչպե՞ս ճիշտ օգտագործել այն:',
      'Ի՞նչ անել, եթե մոռանամ այն, եթե տեղաշարժվի կամ եթե ուզենամ դադարեցնել:',
      'Այս մեթոդը համապատասխանո՞ւմ է իմ հղիության ծրագրերին:',
    ],
    professionalTipTitle: 'Լավ է իմանալ',
    professionalTipText: 'Մանկաբարձուհին կամ բժիշկը կարող է հաշվի առնել ձեր բժշկական պատմությունը, բուժումները, նախասիրությունները և ապրելակերպը՝ նախքան մեթոդ խորհուրդ տալը:',
    summaryTitle: 'Էականը',
    summaryItems: [
      'Ընտրեք ձեր առօրյային համապատասխանող մեթոդ:',
      'Հաշվի առեք ձեր հանդուրժողականությունը և նախասիրությունները:',
      'Մտածեք ձեր հղիության ծրագրերի և ժամանակացույցի մասին:',
      'Կասկածի դեպքում խորհուրդ հարցրեք մասնագետից:',
    ],
    finalTipTitle: 'Հիշեք',
    finalTipText: 'Լավագույն մեթոդը պարտադիր չէ, որ լինի այն, որը թվում է ամենահարմարը կամ ամենահայտնին: Դա այն մեթոդն է, որը համապատասխանում է ձեր իրավիճակին, կարիքներին և նախասիրություններին՝ առողջապահության մասնագետի հետ տեղեկացված քննարկումից հետո:',
    disclaimerText: 'Այս հոդվածը միայն տեղեկատվական նպատակով է և չի փոխարինում անհատականացված բժշկական խորհրդատվությանը:',
    shareMessage: 'Ընտրել ձեզ հարմար բուժումը — AWA',
  },
  tg: {
    badge: 'ИНТИХОБИ УСУЛ',
    title: 'Интихоби табобате,\nки ба шумо мувофиқ аст',
    metaDuration: '7 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Миёна',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Саволҳои дуруст барои ёфтани усули пешгирӣ аз ҳомиладорӣ, ки ба зиндагии ҳаррӯза, эҳтиёҷот ва нақшаҳои шумо мувофиқ аст.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Саволҳое, ки бояд аз худ пурсид',
      'Ягон усул ба таври мутлақ «беҳтарин» нест',
      'Меъёрҳое, ки метавонанд фарқ кунанд',
      'Муҳокима бо мутахассис',
      'Хулосаҳои асосӣ',
    ],
    section1Body: 'Барои ҳама як усули идеалии пешгирӣ вуҷуд надорад. Пеш аз интихоби усул муфид аст дар бораи одатҳо, афзалиятҳо, таҳаммул ва нақшаҳои худ фикр кунед.',
    questions: [
      'Бадани ман ба гормонҳо чӣ гуна вокуниш нишон медиҳад?',
      'Оё ба амали рӯзона ё ҳафтагӣ ниёз дорам, ё ба роҳи дарозмуддат?',
      'Оё нақшаи ҳомиладории миёнамуҳлат дорам?',
      'Буҷаи ман чӣ қадар аст ва ин усули пешгирӣ то чӣ андоза дастрас аст?',
    ],
    section2Body: 'Ду нафар метавонанд усулҳои гуногун интихоб кунанд ва ҳарду интихоби комилан мувофиқ ба вазъияти худро карда бошанд. Интихоби дуруст махсусан ба он вобаста аст, ки шумо мехоҳед пешгирии худро чӣ тавр истифода баред ва чиро ҷустуҷӯ мекунед.',
    highlightTitle: 'Муҳимтарин чизи ба ёд мондан',
    highlightText: 'Усуле, ки дар назария ҷолиб менамояд, ҳатман усуле нест, ки ҳар рӯз барои шумо оддитарин ё роҳаттарин бошад.',
    section3Body: 'Барои муқоисаи якчанд имконият метавонед меъёрҳои гуногунро баррасӣ кунед. Мақсад аз ёд кардани ҳама чиз нест, балки муайян кардани он аст, ки воқеан барои шумо муҳим аст.',
    priorities: [
      {title: 'Содагӣ', text: 'Баъзе усулҳо амали рӯзонаро талаб мекунанд, дигарон танҳо таваҷҷӯҳи ҳафтагӣ ё хеле камтарро.'},
      {title: 'Таҳаммул', text: 'Таъсиротеро, ки эҳсос мекунед, дар одамони гуногун метавонад фарқ кунад. Муҳим аст, ки вокуниши баданатонро мушоҳида кунед ва агар чизе халал расонад, дар ин бора гап занед.'},
      {title: 'Нақшаҳои ҳомиладорӣ', text: 'Агар ба қарибӣ ба ҳомиладорӣ умед доред, мӯҳлати истифода ва барқароршавии ҳосилхезӣ пас аз қатъ кардан метавонад қисми муҳокима бошад.'},
      {title: 'Самаранокӣ', text: 'Самаранокӣ на танҳо ба усули интихобшуда, балки ба дуруст ва мунтазам истифода бурдан низ вобаста аст.'},
    ],
    rhythmTitle: 'Чанд вақт бояд истифода шавад',
    rhythmBody: 'Яке аз фарқиятҳои муҳими усулҳо ин аст, ки то чӣ андоза бояд дар бораи пешгирии худ фикр кунед.',
    comparison: [
      {title: 'Ҳаб', detail: 'Амали рӯзона'},
      {title: 'Пластир', detail: 'Иваз кардани ҳафтагӣ'},
      {title: 'Ҳалқа', detail: 'Давраи якчанд ҳафта'},
      {title: 'Имплант', detail: 'Роҳи дарозмуддат'},
      {title: 'Спирали гормонӣ', detail: 'Роҳи дарозмуддат'},
    ],
    bodyReactionTitle: 'Мушоҳидаи вокуниши бадани худ',
    bodyReactionText: 'Усули гормонӣ дар одамони гуногун метавонад ба таври гуногун эҳсос шавад. Баъзеҳо тағйирот дар давра, хунравӣ ё таъсироти дигарро мушоҳида мекунанд. Ин вокунишҳо худ ба худ маънои мувофиқ набудани усулро надоранд, вале сазовори диққатанд.',
    alertTitle: 'Сазовори диққат',
    alertText: 'Агар таъсир назаррас, доимӣ ё ғайриоддӣ бошад, бо саволҳои худ танҳо намонед. Табиб, доя ё мутахассиси дигари соҳаи тиб метавонад кумак кунад муайян намоед, ки усулро идома диҳед, танзим кунед ё иваз намоед.',
    projectsTitle: 'Ба назар гирифтани нақшаҳои шумо',
    projectsBody: 'Нақшаҳои ҳомиладории шумо низ метавонанд ба интихоб таъсир расонанд. Агар мехоҳед чанд сол аз ҳомиладорӣ эмин бошед, усули дарозмуддат метавонад сазовори баррасӣ бошад. Агар дар бораи ҳомиладории барвақттар фикр кунед, имкониятҳои дигар метавонанд беҳтар ба мӯҳлати шумо мувофиқат кунанд.',
    keepInMindTitle: 'Сазовори ба ёд мондан',
    keepInMindText: 'Гап задан дар бораи нақшаҳои ҳомиладории худ, ҳатто агар онҳо ҳанӯз дур ё номуайян бошанд, ба мутахассиси соҳаи тиб кумак мекунад сӯҳбатро беҳтар роҳнамоӣ кунад.',
    section4Body: 'Қабули табиб ба шумо имкон медиҳад афзалиятҳо, маҳдудиятҳо ва муқобилнишондодҳои эҳтимолии ҳар усулро баркашед. Метавонед пеш аз он чанд савол омода кунед, то чизи муҳимро фаромӯш накунед.',
    questionCardTitle: 'Саволҳои муфид барои пурсидан',
    professionalQuestions: [
      'Афзалиятҳои ин усул барои ман чистанд?',
      'Ман кадом таъсироти манфиро эҳсос карда метавонам?',
      'Онро чӣ тавр дуруст истифода баред?',
      'Агар онро фаромӯш кунам, аз ҷояш ҷойгузин шавад ё хоҳам қатъ кунам, чӣ кор кунам?',
      'Оё ин усул ба нақшаҳои ҳомиладории ман мувофиқ аст?',
    ],
    professionalTipTitle: 'Донистан хуб аст',
    professionalTipText: 'Доя ё табиб метавонад пеш аз тавсияи усул таърихи тиббӣ, табобатҳо, афзалиятҳо ва тарзи зиндагии шуморо ба назар гирад.',
    summaryTitle: 'Муҳимтарин чизҳо',
    summaryItems: [
      'Усулеро интихоб кунед, ки ба зиндагии ҳаррӯзаатон мувофиқ аст.',
      'Таҳаммул ва афзалиятҳои худро ба назар гиред.',
      'Дар бораи нақшаҳои ҳомиладорӣ ва мӯҳлати худ фикр кунед.',
      'Агар мутмаин набошед, аз мутахассис маслиҳат пурсед.',
    ],
    finalTipTitle: 'Ба ёд оред',
    finalTipText: 'Усули беҳтарин ҳатман он нест, ки роҳаттарин ё маъмултарин ба назар мерасад. Он усулест, ки ба вазъият, эҳтиёҷот ва афзалиятҳои шумо мувофиқ аст, пас аз муҳокимаи огоҳонаи бо мутахассиси соҳаи тиб.',
    disclaimerText: 'Ин мақола танҳо барои иттилоъ аст ва маслиҳати шахсии тиббиро иваз намекунад.',
    shareMessage: 'Интихоби табобате, ки ба шумо мувофиқ аст — AWA',
  },
  ky: {
    badge: 'ЫКМАҢЫЗДЫ ТАНДОО',
    title: 'Өзүңүзгө ылайыктуу\nдарылоону тандоо',
    metaDuration: '7 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Орто',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Күнүмдүк жашооңузга, муктаждыктарыңызга жана пландарыңызга ылайыктуу контрацепция ыкмасын табуу үчүн өзүңүзгө берүүчү туура суроолор.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Өзүңүзгө берүүчү суроолор',
      'Эч бир ыкма абсолюттук мааниде «эң жакшысы» эмес',
      'Айырмачылык жаратышы мүмкүн болгон критерийлер',
      'Адис менен сүйлөшүү',
      'Негизги жыйынтыктар',
    ],
    section1Body: 'Баарына ылайыктуу бирден-бир идеалдуу контрацепция ыкмасы жок. Ыкманы тандоодон мурун адаттарыңызды, тандооңузду, чыдамдуулугуңузду жана пландарыңызды ойлонуп көрүү пайдалуу болушу мүмкүн.',
    questions: [
      'Менин денем гормондорго кандай реакция берет?',
      'Мага күнүмдүк же жумалык аракет керекпи, же узак мөөнөттүү чечимби?',
      'Орто мөөнөттө курсактуулук планым барбы?',
      'Менин бюджетим кандай жана бул контрацепция ыкмасы канчалык жеткиликтүү?',
    ],
    section2Body: 'Эки адам ар башка ыкмаларды тандап, экөө тең өз абалына толук ылайыктуу тандоо жасашы мүмкүн. Туура тандоо, атап айтканда, контрацепцияңызды кантип колдонгуңуз келишине жана эмнени издеп жатканыңызга көз каранды.',
    highlightTitle: 'Эң маанилүүсү',
    highlightText: 'Кагазда жагымдуу көрүнгөн ыкма күнүмдүк жашоодо сиз үчүн эң жөнөкөй же эң ыңгайлуусу боло бербейт.',
    section3Body: 'Бир нече варианттарды салыштыруу үчүн ар кандай критерийлерди карасаңыз болот. Максат — баарын жаттоо эмес, чындап сиз үчүн эмне маанилүү экенин аныктоо.',
    priorities: [
      {title: 'Жөнөкөйлүк', text: 'Айрым ыкмалар күнүмдүк аракетти талап кылат, башкалары жумалык көңүл бурууну же ал тургай андан сейрек талап кылат.'},
      {title: 'Чыдамдуулук', text: 'Сезген таасирлер адамдан адамга айырмаланышы мүмкүн. Денеңиздин реакциясын байкоо жана бир нерсе тынчсыздандырса, ал тууралуу сүйлөшүү маанилүү.'},
      {title: 'Курсактуулук пландары', text: 'Жакында курсактуулукту үмүттөнүп жатсаңыз, колдонуу узактыгы жана токтоткондон кийин бойго бүтүү жөндөмдүүлүгүнүн кайтышы талкууга кирген нерселердин бири болушу мүмкүн.'},
      {title: 'Натыйжалуулук', text: 'Натыйжалуулук тандалган ыкмага гана эмес, аны туура жана үзгүлтүксүз колдонууга да көз каранды.'},
    ],
    rhythmTitle: 'Аны канчалык жыш колдонуу керек',
    rhythmBody: 'Ыкмалардын ортосундагы маанилүү айырмачылыктардын бири — контрацепцияңыз жөнүндө канчалык жыш ойлонуу керек.',
    comparison: [
      {title: 'Таблетка', detail: 'Күнүмдүк аракет'},
      {title: 'Пластырь', detail: 'Жумалык алмаштыруу'},
      {title: 'Шакекче', detail: 'Бир нече жумалык цикл'},
      {title: 'Имплант', detail: 'Узак мөөнөттүү чечим'},
      {title: 'Гормондук спираль', detail: 'Узак мөөнөттүү чечим'},
    ],
    bodyReactionTitle: 'Денеңиздин реакциясын байкоо',
    bodyReactionText: 'Гормондук ыкма адамдан адамга башкача сезилиши мүмкүн. Айрымдар цикли, кан кетүүсү же башка терс таасирлеринде өзгөрүүлөрдү байкайт. Бул реакциялар ыкма сизге туура келбейт дегенди автоматтык түрдө билдирбейт, бирок аларга көңүл бургандын пайдасы бар.',
    alertTitle: 'Байкоого татыктуу',
    alertText: 'Эгер таасир олуттуу, улана берген же адаттан тыш болсо, суроолоруңуз менен жалгыз калбаңыз. Дарыгер, акушерка же башка ден соолук сактоо адиси ыкманы улантуу, тууралоо же алмаштыруу керекпи — аны аныктоого жардам бере алат.',
    projectsTitle: 'Пландарыңызды эске алуу',
    projectsBody: 'Курсактуулук пландарыңыз да тандооңузга таасир этиши мүмкүн. Бир нече жыл курсактуулуктан сактангыңыз келсе, узак мөөнөттүү ыкманы карап көрсөңүз болот. Жакын арада курсактуулукту ойлоп жатсаңыз, башка варианттар убактыңызга жакшыраак ылайык келиши мүмкүн.',
    keepInMindTitle: 'Эстен чыгарбоого татыктуу',
    keepInMindText: 'Курсактуулук пландарыңыз алыс же белгисиз болсо да, алар жөнүндө сүйлөшүү ден соолук сактоо адисине талкууга жакшыраак багыт берүүгө жардам берет.',
    section4Body: 'Кабыл алуу ар бир ыкманын артыкчылыктарын, чектөөлөрүн жана мүмкүн болгон каршы көрсөтмөлөрүн таразалоого мүмкүндүк берет. Маанилүү эч нерсени унутпоо үчүн алдын ала бир нече суроо даярдасаңыз болот.',
    questionCardTitle: 'Берүүгө пайдалуу суроолор',
    professionalQuestions: [
      'Бул ыкманын мен үчүн кандай артыкчылыктары бар?',
      'Кандай терс таасирлер болушу мүмкүн?',
      'Аны туура кантип колдонуу керек?',
      'Аны унутуп калсам, ордунан жылып кетсе же токтоткум келсе, эмне кылуу керек?',
      'Бул ыкма менин курсактуулук пландарыма туура келеби?',
    ],
    professionalTipTitle: 'Билүү пайдалуу',
    professionalTipText: 'Акушерка же дарыгер ыкманы сунуштоодон мурун медициналык тарыхыңызды, дарылоолоруңузду, тандооңузду жана жашоо образыңызды эске ала алат.',
    summaryTitle: 'Эң негизгиси',
    summaryItems: [
      'Күнүмдүк жашооңузга туура келген ыкманы тандаңыз.',
      'Чыдамдуулугуңузду жана тандооңузду эске алыңыз.',
      'Курсактуулук пландарыңызды жана убактыңызды ойлонуңуз.',
      'Күмөн болсо, адистен кеңеш сураңыз.',
    ],
    finalTipTitle: 'Эстеп жүрүңүз',
    finalTipText: 'Эң жакшы ыкма эң ыңгайлуудай же эң популярдуудай көрүнгөнү эмес. Бул — ден соолук сактоо адиси менен маалыматтуу сүйлөшүүдөн кийин абалыңызга, муктаждыктарыңызга жана тандооңузга туура келгени.',
    disclaimerText: 'Бул макала маалымат берүү максатында гана жазылган жана жекелештирилген медициналык кеңешти алмаштырбайт.',
    shareMessage: 'Өзүңүзгө ылайыктуу дарылоону тандоо — AWA',
  },
  tk: {
    badge: 'USULYŇYZY SAÝLAMAK',
    title: 'Size laýyk bejergini\nsaýlamak',
    metaDuration: '7 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Orta',
    metaValidated: 'Barlanan mazmun',
    intro: 'Gündelik durmuşyňyza, zerurlyklaryňyza we meýilnamalaryňyza laýyk göwrelilikden goranyş usulyny tapmak üçin özüňize bermeli dogry soraglar.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Özüňize bermeli soraglar',
      'Hiç bir usul mutlak manyda «iň gowusy» däl',
      'Tapawut döredip biljek ölçegler',
      'Hünärmen bilen maslahatlaşmak',
      'Esasy netijeler',
    ],
    section1Body: 'Hemmeler üçin ýeke-täk ideal göwrelilikden goranyş usuly ýok. Usuly saýlamazdan öň endiklerigiz, isleglerigiz, çydamlylygyňyz we meýilnamalaryňyz hakda oýlanmak peýdaly bolup biler.',
    questions: [
      'Bedenim gormonlara nähili reaksiýa berýär?',
      'Maňa gündelik ýa-da hepdelik hereket gerekmi, ýa-da uzak möhletli çözgüt?',
      'Orta möhletde göwrelilik meýilnamam barmy?',
      'Býudžetim nähili we bu göwrelilikden goranyş usulyna elýeterlilik nähili?',
    ],
    section2Body: 'Iki adam dürli usullary saýlap bilerler we ikisi hem öz ýagdaýyna doly laýyk saýlaw eden bolarlar. Dogry saýlaw aýratyn-da göwrelilikden goranyşy nähili ulanmak isleýändigiňize we nämäni gözleýändigiňize bagly.',
    highlightTitle: 'Ýatda saklamaly esasy zat',
    highlightText: 'Kagyzda özüne çekiji görünýän usul size gündelik durmuşda iň ýönekeý ýa-da iň rahat usul bolmak hökman däl.',
    section3Body: 'Birnäçe wariantlary deňeşdirmek üçin dürli ölçeglere seredip bilersiňiz. Maksat hemmesini ýat bilmek däl-de, siziň üçin hakykatdan möhüm zady kesgitlemek.',
    priorities: [
      {title: 'Ýönekeýlik', text: 'Käbir usullar gündelik hereketi talap edýär, beýlekileri bolsa diňe hepdelik ýa-da has seýrek üns talap edýär.'},
      {title: 'Çydamlylyk', text: 'Duýýan täsirleriňiz adamdan adama tapawutlanyp biler. Bedeniňiziň nähili reaksiýa berýändigini synlamak we bir zat biynjalyk etse, bu barada gürleşmek möhüm.'},
      {title: 'Göwrelilik meýilnamalary', text: 'Golaýda göwreli bolmagy umyt edýän bolsaňyz, ulanyş möhleti we bes edeniňizden soň göwreli bolmak ukybynyň gaýdyp gelmegi maslahatlaşylýan zatlaryň bir bölegi bolup biler.'},
      {title: 'Täsirlilik', text: 'Täsirlilik diňe saýlanan usula däl, eýsem ony dogry we yzygiderli ulanmaga hem baglydyr.'},
    ],
    rhythmTitle: 'Ony näçe ýygy ulanmaly',
    rhythmBody: 'Usullaryň arasyndaky möhüm tapawutlaryň biri göwrelilikden goranyş hakda näçe ýygy pikir etmelidigiňizde.',
    comparison: [
      {title: 'Tabletka', detail: 'Gündelik hereket'},
      {title: 'Plastyr', detail: 'Hepdelik çalyşmak'},
      {title: 'Halka', detail: 'Birnäçe hepdelik sikl'},
      {title: 'Implant', detail: 'Uzak möhletli çözgüt'},
      {title: 'Gormonal içki ulag', detail: 'Uzak möhletli çözgüt'},
    ],
    bodyReactionTitle: 'Bedeniňiziň nähili reaksiýa berýändigini synlamak',
    bodyReactionText: 'Gormonal usul adamdan adama dürli duýulyp biler. Käbirleri siklinde, gan akmasynda ýa-da beýleki gaýry täsirlerde üýtgeşmeleri duýýar. Bu reaksiýalar usulyň size laýyk däldigini awtomatiki aňlatmaýar, ýöne olara üns bermäge mynasyp.',
    alertTitle: 'Üns bermäge mynasyp',
    alertText: 'Täsir güýçli, dowamly ýa-da adaty däl bolsa, soraglaryňyz bilen ýeke galmaň. Lukman, akuşerka ýa-da başga saglyk hünärmeni usuly dowam etdirmelidigini, sazlamalydygyny ýa-da çalyşmalydygyny kesgitlemäge kömek edip biler.',
    projectsTitle: 'Meýilnamalaryňyzy hasaba almak',
    projectsBody: 'Göwrelilik meýilnamalaryňyz saýlawyňyza hem täsir edip biler. Birnäçe ýyl göwreli bolmakdan gaça durmak isleseňiz, uzak möhletli usuly göz öňünde tutmak mümkin. Has ir göwreli bolmagy pikir edýän bolsaňyz, beýleki wariantlar wagt çarçuwaňyza has gowy laýyk gelip biler.',
    keepInMindTitle: 'Ýatda saklamaga mynasyp',
    keepInMindText: 'Göwrelilik meýilnamalaryňyz henizem uzak ýa-da näbelli bolsa-da, olar barada gürleşmek saglyk hünärmenine söhbetdeşligi has gowy ugrukdyrmaga kömek edýär.',
    section4Body: 'Kabul ediş her bir usulyň artykmaçlyklaryny, çäklerini we mümkin garşy görkezmelerini deňeşdirmäge mümkinçilik berýär. Möhüm zady ýatdan çykarmazlyk üçin öňünden birnäçe soragy taýýarlap bilersiňiz.',
    questionCardTitle: 'Bermäge peýdaly soraglar',
    professionalQuestions: [
      'Bu usulyň maňa nähili artykmaçlyklary bar?',
      'Haýsy gaýry täsirleri başdan geçirip bilerin?',
      'Ony dogry nähili ulanmaly?',
      'Ony unudan, ýerinden süýşen ýa-da bes etmek isleýän ýagdaýymda näme etmeli?',
      'Bu usul göwrelilik meýilnamalaryma laýykmy?',
    ],
    professionalTipTitle: 'Bilmek peýdaly',
    professionalTipText: 'Akuşerka ýa-da lukman usuly maslahat bermezden öň lukmançylyk taryhyňyzy, bejergileriňizi, isleglerigizi we durmuş ýörelgäňizi hasaba alyp biler.',
    summaryTitle: 'Esasy zatlar',
    summaryItems: [
      'Gündelik durmuşyňyza laýyk usuly saýlaň.',
      'Çydamlylygyňyzy we isleglerigizi hasaba alyň.',
      'Göwrelilik meýilnamalaryňyz we wagt çarçuwaňyz hakda oýlanyň.',
      'Şübhe bolsa, hünärmenden maslahat soraň.',
    ],
    finalTipTitle: 'Ýatda saklaň',
    finalTipText: 'Iň gowy usul iň amatly ýa-da iň meşhur ýaly görünýän usul hökman däl. Ol saglyk hünärmeni bilen düşünjeli söhbetdeşlikden soň ýagdaýyňyza, zerurlyklaryňyza we isleglerigize laýyk gelýän usul.',
    disclaimerText: 'Bu makala diňe maglumat maksatly we şahsylaşdyrylan lukmançylyk maslahatyny çalyşmaýar.',
    shareMessage: 'Size laýyk bejergini saýlamak — AWA',
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
