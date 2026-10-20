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
import {type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {resolveEditorialLanguage} from '../../i18n/editorialLanguage';
import {EDITORIAL_IMAGE_ALT, resolveEditorialImage, EXERCISE_HERO} from '../../i18n/editorialImages';

const ID = 'exercise-bouger-pour-le-cycle';

const HERO = EXERCISE_HERO;

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const ACTIVITY_ICONS = [
  'walk',
  'yoga',
  'dumbbell',
  'bike',
  'swim',
  'dance-ballroom',
] as const;

const CYCLE_PHASE_ICONS = [
  'water-outline',
  'weather-sunny',
  'egg-outline',
  'moon-waning-crescent',
] as const;

const CONSULT_ICONS = [
  'alert-circle-outline',
  'water-alert-outline',
  'emoticon-dizzy-outline',
  'battery-alert-outline',
  'medical-bag',
  'baby-carriage',
  'shield-alert-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'CYCLE • ACTIVITÉ PHYSIQUE',
    title: 'Bouger pour\nsoutenir ton cycle',
    metaDuration: '8 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu éducatif',
    intro: 'Pourquoi une activité physique régulière peut soutenir l’équilibre de ton cycle, quels types de mouvement privilégier, et comment adapter ton rythme sans pression ni culpabilité.',
    introSecondary: 'Il ne s’agit pas de faire plus, mais de bouger d’une façon qui te correspond et que tu peux maintenir dans la durée.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Pourquoi bouger peut soutenir ton cycle',
      'Quels bénéfices pour le cycle ?',
      'Quel type d’activité choisir ?',
      'Combien bouger ?',
      'Adapter l’activité à son cycle',
      'Bouger quand on a un SOPK',
      'Les erreurs à éviter',
      'Quand demander conseil',
      'À retenir',
    ],
    section1Body1: 'L’activité physique régulière influence de nombreux systèmes du corps, dont ceux impliqués dans la régulation hormonale et le fonctionnement du cycle menstruel. Elle agit notamment sur la sensibilité à l’insuline, la gestion du stress et la qualité du sommeil, trois facteurs qui interagissent avec l’équilibre hormonal.',
    section1Body2: 'Bouger régulièrement ne garantit pas un cycle « parfait », mais fait partie des habitudes qui soutiennent une bonne santé générale, avec des effets qui peuvent se refléter sur le cycle chez certaines femmes.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Le lien entre activité physique et cycle est individuel : certaines femmes remarquent des effets nets, d’autres moins. Cela reste une habitude bénéfique dans tous les cas.',
    section2Intro: 'Une activité régulière peut contribuer à plusieurs niveaux, sans que ces effets soient garantis ou identiques pour toutes :',
    benefits: [
      'Soutenir la santé métabolique',
      'Aider à réguler la glycémie',
      'Soutenir l’équilibre hormonal',
      'Améliorer le niveau d’énergie',
      'Réduire le stress',
      'Soutenir la qualité du sommeil',
      'Favoriser, chez certaines femmes, une meilleure régularité du cycle',
    ],
    neutral1Text: 'Ces bénéfices s’installent progressivement : il ne s’agit pas d’un effet immédiat après une seule séance.',
    section3Intro: 'Il n’existe pas d’activité « meilleure » que les autres : la plus efficace est celle que tu prends plaisir à pratiquer régulièrement.',
    activities: [
      'Marche',
      'Yoga / mobilité douce',
      'Renforcement musculaire',
      'Vélo',
      'Natation',
      'Danse',
    ],
    section4Body1: 'Il n’y a pas de règle universelle : l’essentiel est la régularité plutôt que la performance. Intégrer de courtes périodes de mouvement dans ton quotidien (marcher, prendre les escaliers, t’étirer) compte tout autant qu’une séance planifiée.',
    section4Body2: 'L’intensité adaptée dépend de ton niveau de forme, de ta santé, de ton énergie du moment et de tes objectifs personnels : ce qui convient à une personne ne convient pas forcément à une autre.',
    highlightTitle: 'Priorité à la régularité',
    highlightText: 'Trois courtes séances par semaine, maintenues dans la durée, sont souvent plus bénéfiques qu’un objectif ambitieux abandonné après quelques jours.',
    section5Body: 'L’énergie et le confort physique peuvent varier au fil du cycle. Adapter l’intensité de ton activité selon ce que tu ressens est tout à fait légitime.',
    cyclePhases: [
      'Pendant les règles : un mouvement doux si cela te convient',
      'Après les règles : augmenter progressivement si l’énergie le permet',
      'Autour de l’ovulation : maintenir une activité normale selon ton confort',
      'Avant les règles : privilégier un mouvement gérable, et du repos si besoin',
    ],
    neutral2Text: 'Il ne s’agit pas de règles physiologiques strictes : chaque femme vit son cycle différemment, et ces exemples sont des repères, pas des obligations.',
    section6Body: 'Chez les femmes ayant un SOPK, l’activité physique régulière peut être particulièrement utile : elle soutient la sensibilité à l’insuline, un mécanisme souvent affecté dans ce contexte, et peut contribuer à un meilleur équilibre métabolique et hormonal sur le long terme.',
    tip2Title: 'Bon à savoir',
    tip2Text: 'Il ne s’agit pas d’un remède, mais d’un soutien complémentaire à une prise en charge globale, à adapter avec un professionnel de santé.',
    section7Intro: 'Certaines idées reçues ou habitudes peuvent desservir plus qu’aider :',
    mistakes: [
      'Vouloir faire de l’exercice de façon excessive',
      'Penser que seuls les entraînements intenses sont utiles',
      'Faire du sport uniquement dans un objectif de perte de poids',
      'Ignorer la fatigue ou la douleur',
      'Culpabiliser après une séance manquée',
    ],
    section8Intro: 'Dans certaines situations, l’avis d’un professionnel de santé est particulièrement utile avant de reprendre ou d’adapter une activité physique :',
    consultReasons: [
      'Une douleur persistante',
      'Des saignements inhabituels',
      'Des sensations de vertige',
      'Une fatigue importante et inhabituelle',
      'Une condition médicale particulière',
      'Une reprise d’activité après une grossesse ou un accouchement',
      'Toute situation où l’activité a été médicalement restreinte',
    ],
    tip3Title: 'Bon à savoir',
    tip3Text: 'Le mouvement n’a pas besoin d’être intense ou parfait pour être bénéfique. Une activité régulière, agréable et durable peut soutenir ta santé globale et contribuer, chez certaines femmes, à une meilleure gestion du cycle.',
    finalNoteTitle: 'Un guide pour mieux comprendre',
    finalNoteText: 'Cet article est destiné à l’information générale et ne remplace pas un avis médical. Adapte toujours l’activité physique à ta situation personnelle, et demande conseil à un professionnel de santé en cas de doute.',
    shareMessage: 'Bouger pour soutenir ton cycle — AWA',
  },
  en: {
    badge: 'CYCLE • PHYSICAL ACTIVITY',
    title: 'Move to\nsupport your cycle',
    metaDuration: '8 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Educational content',
    intro: 'Why regular physical activity may support your cycle’s balance, which types of movement to favor, and how to adapt your pace without pressure or guilt.',
    introSecondary: 'It’s not about doing more, but about moving in a way that suits you and that you can keep up over time.',
    contentsTitle: 'In this article',
    topics: [
      'Why moving may support your cycle',
      'What benefits for your cycle?',
      'Which type of activity to choose?',
      'How much should you move?',
      'Adapting activity to your cycle',
      'Moving when you have PCOS',
      'Mistakes to avoid',
      'When to ask for advice',
      'Key takeaways',
    ],
    section1Body1: 'Regular physical activity influences many of the body’s systems, including those involved in hormonal regulation and how the menstrual cycle functions. It acts in particular on insulin sensitivity, stress management, and sleep quality — three factors that interact with hormonal balance.',
    section1Body2: 'Moving regularly doesn’t guarantee a “perfect” cycle, but it’s one of the habits that supports good overall health, with effects that may be reflected in the cycle for some women.',
    tip1Title: 'Good to know',
    tip1Text: 'The link between physical activity and the cycle is individual: some women notice clear effects, others less so. Either way, it remains a beneficial habit.',
    section2Intro: 'Regular activity may contribute on several levels, without these effects being guaranteed or identical for everyone:',
    benefits: [
      'Supporting metabolic health',
      'Helping regulate blood sugar',
      'Supporting hormonal balance',
      'Improving energy levels',
      'Reducing stress',
      'Supporting sleep quality',
      'Promoting, in some women, better cycle regularity',
    ],
    neutral1Text: 'These benefits build up gradually: this isn’t an immediate effect after a single session.',
    section3Intro: 'No activity is “better” than another: the most effective one is the one you enjoy practicing regularly.',
    activities: [
      'Walking',
      'Yoga / gentle mobility',
      'Strength training',
      'Cycling',
      'Swimming',
      'Dance',
    ],
    section4Body1: 'There’s no universal rule: what matters most is regularity rather than performance. Fitting short bursts of movement into your day (walking, taking the stairs, stretching) counts just as much as a planned workout.',
    section4Body2: 'The right intensity depends on your fitness level, your health, your energy at the time, and your personal goals: what works for one person doesn’t necessarily work for another.',
    highlightTitle: 'Prioritize regularity',
    highlightText: 'Three short sessions a week, kept up over time, are often more beneficial than an ambitious goal abandoned after a few days.',
    section5Body: 'Energy and physical comfort can vary throughout the cycle. Adjusting the intensity of your activity based on how you feel is entirely legitimate.',
    cyclePhases: [
      'During your period: gentle movement if that suits you',
      'After your period: gradually increase if your energy allows',
      'Around ovulation: maintain normal activity according to your comfort',
      'Before your period: favor manageable movement, and rest if needed',
    ],
    neutral2Text: 'These are not strict physiological rules: every woman experiences her cycle differently, and these examples are reference points, not obligations.',
    section6Body: 'For women with PCOS, regular physical activity can be particularly helpful: it supports insulin sensitivity, a mechanism often affected in this context, and may contribute to better metabolic and hormonal balance over the long term.',
    tip2Title: 'Good to know',
    tip2Text: 'This isn’t a cure, but a complementary support to overall care, to be adapted with a healthcare professional.',
    section7Intro: 'Some misconceptions or habits can do more harm than good:',
    mistakes: [
      'Wanting to exercise excessively',
      'Thinking that only intense workouts are useful',
      'Exercising only with a weight-loss goal in mind',
      'Ignoring fatigue or pain',
      'Feeling guilty after a missed session',
    ],
    section8Intro: 'In certain situations, a healthcare professional’s advice is particularly useful before resuming or adapting a physical activity:',
    consultReasons: [
      'Persistent pain',
      'Unusual bleeding',
      'Dizziness',
      'Significant, unusual fatigue',
      'A specific medical condition',
      'Resuming activity after a pregnancy or childbirth',
      'Any situation where activity has been medically restricted',
    ],
    tip3Title: 'Good to know',
    tip3Text: 'Movement doesn’t need to be intense or perfect to be beneficial. A regular, enjoyable, and sustainable activity may support your overall health and contribute, in some women, to better cycle management.',
    finalNoteTitle: 'A guide to help you understand',
    finalNoteText: 'This article is intended for general information and does not replace medical advice. Always adapt physical activity to your personal situation, and seek advice from a healthcare professional if in doubt.',
    shareMessage: 'Move to support your cycle — AWA',
  },
  es: {
    badge: 'CICLO • ACTIVIDAD FÍSICA',
    title: 'Moverte para\napoyar tu ciclo',
    metaDuration: '8 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido educativo',
    intro: 'Por qué la actividad física regular puede apoyar el equilibrio de tu ciclo, qué tipos de movimiento priorizar y cómo adaptar tu ritmo sin presión ni culpa.',
    introSecondary: 'No se trata de hacer más, sino de moverte de una forma que te quede bien y que puedas mantener en el tiempo.',
    contentsTitle: 'En este artículo',
    topics: [
      'Por qué moverte puede apoyar tu ciclo',
      '¿Qué beneficios para el ciclo?',
      '¿Qué tipo de actividad elegir?',
      '¿Cuánto moverse?',
      'Adaptar la actividad a tu ciclo',
      'Moverte cuando tienes SOP',
      'Errores que evitar',
      'Cuándo pedir consejo',
      'Para recordar',
    ],
    section1Body1: 'La actividad física regular influye en numerosos sistemas del cuerpo, entre ellos los implicados en la regulación hormonal y el funcionamiento del ciclo menstrual. Actúa en particular sobre la sensibilidad a la insulina, la gestión del estrés y la calidad del sueño, tres factores que interactúan con el equilibrio hormonal.',
    section1Body2: 'Moverte con regularidad no garantiza un ciclo «perfecto», pero forma parte de los hábitos que apoyan una buena salud general, con efectos que pueden reflejarse en el ciclo en algunas mujeres.',
    tip1Title: 'Dato útil',
    tip1Text: 'El vínculo entre la actividad física y el ciclo es individual: algunas mujeres notan efectos claros, otras menos. En cualquier caso, sigue siendo un hábito beneficioso.',
    section2Intro: 'Una actividad regular puede contribuir en varios niveles, sin que estos efectos estén garantizados ni sean idénticos para todas:',
    benefits: [
      'Apoyar la salud metabólica',
      'Ayudar a regular la glucemia',
      'Apoyar el equilibrio hormonal',
      'Mejorar el nivel de energía',
      'Reducir el estrés',
      'Apoyar la calidad del sueño',
      'Favorecer, en algunas mujeres, una mejor regularidad del ciclo',
    ],
    neutral1Text: 'Estos beneficios se instalan progresivamente: no se trata de un efecto inmediato tras una sola sesión.',
    section3Intro: 'No existe una actividad «mejor» que las demás: la más eficaz es la que disfrutas practicando con regularidad.',
    activities: [
      'Caminar',
      'Yoga / movilidad suave',
      'Entrenamiento de fuerza',
      'Bicicleta',
      'Natación',
      'Baile',
    ],
    section4Body1: 'No existe una regla universal: lo esencial es la regularidad y no el rendimiento. Integrar pequeños momentos de movimiento en tu día a día (caminar, subir escaleras, estirarte) cuenta tanto como una sesión planificada.',
    section4Body2: 'La intensidad adecuada depende de tu nivel de forma física, tu salud, tu energía del momento y tus objetivos personales: lo que le conviene a una persona no tiene por qué convenirle a otra.',
    highlightTitle: 'Prioridad a la regularidad',
    highlightText: 'Tres sesiones cortas por semana, mantenidas en el tiempo, suelen ser más beneficiosas que un objetivo ambicioso abandonado al cabo de unos días.',
    section5Body: 'La energía y la comodidad física pueden variar a lo largo del ciclo. Adaptar la intensidad de tu actividad según cómo te sientas es totalmente legítimo.',
    cyclePhases: [
      'Durante la regla: un movimiento suave si te sienta bien',
      'Después de la regla: aumentar progresivamente si la energía lo permite',
      'Alrededor de la ovulación: mantener una actividad normal según tu comodidad',
      'Antes de la regla: priorizar un movimiento manejable, y descanso si lo necesitas',
    ],
    neutral2Text: 'No se trata de reglas fisiológicas estrictas: cada mujer vive su ciclo de forma diferente, y estos ejemplos son puntos de referencia, no obligaciones.',
    section6Body: 'En las mujeres con SOP, la actividad física regular puede ser especialmente útil: apoya la sensibilidad a la insulina, un mecanismo a menudo afectado en este contexto, y puede contribuir a un mejor equilibrio metabólico y hormonal a largo plazo.',
    tip2Title: 'Dato útil',
    tip2Text: 'No se trata de un remedio, sino de un apoyo complementario a una atención integral, que debe adaptarse con un profesional de la salud.',
    section7Intro: 'Algunas ideas equivocadas o hábitos pueden perjudicar más que ayudar:',
    mistakes: [
      'Querer hacer ejercicio de forma excesiva',
      'Pensar que solo los entrenamientos intensos son útiles',
      'Hacer deporte únicamente con el objetivo de perder peso',
      'Ignorar el cansancio o el dolor',
      'Sentirte culpable después de una sesión perdida',
    ],
    section8Intro: 'En ciertas situaciones, la opinión de un profesional de la salud es especialmente útil antes de retomar o adaptar una actividad física:',
    consultReasons: [
      'Un dolor persistente',
      'Sangrados inusuales',
      'Sensaciones de mareo',
      'Un cansancio importante e inusual',
      'Una condición médica particular',
      'Una vuelta a la actividad después de un embarazo o un parto',
      'Cualquier situación en la que la actividad haya sido médicamente restringida',
    ],
    tip3Title: 'Dato útil',
    tip3Text: 'El movimiento no necesita ser intenso ni perfecto para ser beneficioso. Una actividad regular, agradable y sostenible puede apoyar tu salud general y contribuir, en algunas mujeres, a una mejor gestión del ciclo.',
    finalNoteTitle: 'Una guía para comprender mejor',
    finalNoteText: 'Este artículo tiene fines informativos generales y no sustituye una opinión médica. Adapta siempre la actividad física a tu situación personal, y consulta a un profesional de la salud si tienes dudas.',
    shareMessage: 'Moverte para apoyar tu ciclo — AWA',
  },
  it: {
    badge: 'CICLO • ATTIVITÀ FISICA',
    title: 'Muoverti per\nsostenere il tuo ciclo',
    metaDuration: '8 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto educativo',
    intro: 'Perché l’attività fisica regolare può sostenere l’equilibrio del tuo ciclo, quali tipi di movimento privilegiare e come adattare il tuo ritmo senza pressioni né sensi di colpa.',
    introSecondary: 'Non si tratta di fare di più, ma di muoverti in modo adatto a te e che puoi mantenere nel tempo.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Perché il movimento può sostenere il tuo ciclo',
      'Quali benefici per il tuo ciclo?',
      'Quale tipo di attività scegliere?',
      'Quanto muoversi?',
      'Adattare l’attività al tuo ciclo',
      'Muoversi in caso di PCOS',
      'Errori da evitare',
      'Quando chiedere un parere',
      'I punti chiave',
    ],
    section1Body1: 'L’attività fisica regolare influisce su molti sistemi del corpo, compresi quelli coinvolti nella regolazione ormonale e nel funzionamento del ciclo mestruale. Agisce in particolare sulla sensibilità all’insulina, sulla gestione dello stress e sulla qualità del sonno: tre fattori che interagiscono con l’equilibrio ormonale.',
    section1Body2: 'Muoversi con regolarità non garantisce un ciclo «perfetto», ma è una delle abitudini che favoriscono una buona salute generale, con effetti che per alcune donne possono riflettersi sul ciclo.',
    tip1Title: 'Da sapere',
    tip1Text: 'Il legame tra attività fisica e ciclo è individuale: alcune donne notano effetti evidenti, altre meno. In ogni caso resta un’abitudine benefica.',
    section2Intro: 'L’attività regolare può contribuire su più livelli, senza che questi effetti siano garantiti o identici per tutte:',
    benefits: [
      'Sostenere la salute metabolica',
      'Contribuire a regolare la glicemia',
      'Sostenere l’equilibrio ormonale',
      'Migliorare i livelli di energia',
      'Ridurre lo stress',
      'Favorire la qualità del sonno',
      'Favorire, in alcune donne, una migliore regolarità del ciclo',
    ],
    neutral1Text: 'Questi benefici si costruiscono gradualmente: non sono un effetto immediato dopo una singola seduta.',
    section3Intro: 'Nessuna attività è «migliore» di un’altra: la più efficace è quella che ti piace praticare con regolarità.',
    activities: [
      'Camminata',
      'Yoga / mobilità dolce',
      'Allenamento di forza',
      'Ciclismo',
      'Nuoto',
      'Danza',
    ],
    section4Body1: 'Non esiste una regola universale: ciò che conta di più è la regolarità, più che la prestazione. Inserire brevi momenti di movimento nella giornata (camminare, fare le scale, fare stretching) vale quanto un allenamento programmato.',
    section4Body2: 'L’intensità giusta dipende dal tuo livello di forma fisica, dalla tua salute, dalla tua energia del momento e dai tuoi obiettivi personali: ciò che funziona per una persona non funziona necessariamente per un’altra.',
    highlightTitle: 'Privilegia la regolarità',
    highlightText: 'Tre brevi sedute a settimana, mantenute nel tempo, sono spesso più benefiche di un obiettivo ambizioso abbandonato dopo pochi giorni.',
    section5Body: 'L’energia e il comfort fisico possono variare nel corso del ciclo. Adattare l’intensità della tua attività a come ti senti è del tutto legittimo.',
    cyclePhases: [
      'Durante le mestruazioni: movimento dolce, se ti fa bene',
      'Dopo le mestruazioni: aumenta gradualmente, se la tua energia lo permette',
      'Intorno all’ovulazione: mantieni l’attività abituale in base al tuo comfort',
      'Prima delle mestruazioni: privilegia un movimento sostenibile e riposati se serve',
    ],
    neutral2Text: 'Queste non sono regole fisiologiche rigide: ogni donna vive il proprio ciclo in modo diverso, e questi esempi sono punti di riferimento, non obblighi.',
    section6Body: 'Per le donne con PCOS, l’attività fisica regolare può essere particolarmente utile: sostiene la sensibilità all’insulina, un meccanismo spesso coinvolto in questo contesto, e può contribuire a un migliore equilibrio metabolico e ormonale nel lungo periodo.',
    tip2Title: 'Da sapere',
    tip2Text: 'Non è una cura, ma un sostegno complementare al percorso di cura complessivo, da adattare insieme a un professionista sanitario.',
    section7Intro: 'Alcune idee sbagliate o abitudini possono fare più male che bene:',
    mistakes: [
      'Voler fare esercizio in modo eccessivo',
      'Pensare che siano utili solo gli allenamenti intensi',
      'Fare attività fisica solo con l’obiettivo di perdere peso',
      'Ignorare la stanchezza o il dolore',
      'Sentirsi in colpa dopo una seduta saltata',
    ],
    section8Intro: 'In alcune situazioni, il parere di un professionista sanitario è particolarmente utile prima di riprendere o adattare un’attività fisica:',
    consultReasons: [
      'Dolore persistente',
      'Sanguinamenti insoliti',
      'Capogiri',
      'Stanchezza importante e insolita',
      'Una condizione medica specifica',
      'Ripresa dell’attività dopo una gravidanza o un parto',
      'Qualsiasi situazione in cui l’attività è stata limitata dal medico',
    ],
    tip3Title: 'Da sapere',
    tip3Text: 'Il movimento non deve essere intenso o perfetto per essere benefico. Un’attività regolare, piacevole e sostenibile può sostenere la tua salute generale e contribuire, in alcune donne, a una migliore gestione del ciclo.',
    finalNoteTitle: 'Una guida per aiutarti a capire',
    finalNoteText: 'Questo articolo ha scopo di informazione generale e non sostituisce il parere medico. Adatta sempre l’attività fisica alla tua situazione personale e, in caso di dubbio, chiedi consiglio a un professionista sanitario.',
    shareMessage: 'Muoverti per sostenere il tuo ciclo — AWA',
  },
  tr: {
    badge: 'DÖNGÜ • FİZİKSEL AKTİVİTE',
    title: 'Döngüne destek olmak için\nhareket et',
    metaDuration: '8 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Eğitici içerik',
    intro: 'Düzenli fiziksel aktivitenin döngünün dengesine neden destek olabileceği, hangi hareket türlerini tercih edebileceğin ve temponu baskı ya da suçluluk duymadan nasıl ayarlayabileceğin.',
    introSecondary: 'Mesele daha fazla yapmak değil; sana uyan ve zaman içinde sürdürebileceğin bir şekilde hareket etmek.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Hareket etmek döngüne neden destek olabilir',
      'Döngün için hangi faydalar?',
      'Hangi aktivite türünü seçmeli?',
      'Ne kadar hareket etmeli?',
      'Aktiviteyi döngüne uyarlamak',
      'PKOS varken hareket etmek',
      'Kaçınılması gereken hatalar',
      'Ne zaman görüş almalı',
      'Önemli noktalar',
    ],
    section1Body1: 'Düzenli fiziksel aktivite, hormonal düzenlemede ve adet döngüsünün işleyişinde rol oynayanlar da dahil olmak üzere vücudun birçok sistemini etkiler. Özellikle insülin duyarlılığı, stres yönetimi ve uyku kalitesi üzerinde etkilidir; bu üç etken hormonal dengeyle etkileşim içindedir.',
    section1Body2: 'Düzenli hareket etmek “kusursuz” bir döngüyü garanti etmez, ancak genel sağlığı destekleyen alışkanlıklardan biridir; etkileri bazı kadınlarda döngüye yansıyabilir.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Fiziksel aktivite ile döngü arasındaki bağ kişiye özgüdür: bazı kadınlar belirgin etkiler fark eder, bazıları daha az. Her iki durumda da faydalı bir alışkanlık olmaya devam eder.',
    section2Intro: 'Düzenli aktivite, bu etkilerin garanti edilmemesi ve herkeste aynı olmaması koşuluyla, birkaç düzeyde katkıda bulunabilir:',
    benefits: [
      'Metabolik sağlığı desteklemek',
      'Kan şekerinin düzenlenmesine yardımcı olmak',
      'Hormonal dengeyi desteklemek',
      'Enerji düzeyini artırmak',
      'Stresi azaltmak',
      'Uyku kalitesini desteklemek',
      'Bazı kadınlarda döngünün daha düzenli olmasına katkıda bulunmak',
    ],
    neutral1Text: 'Bu faydalar zamanla birikir: tek bir seanstan sonra anında ortaya çıkan bir etki değildir.',
    section3Intro: 'Hiçbir aktivite diğerinden “daha iyi” değildir: en etkili olan, düzenli olarak yapmaktan keyif aldığın aktivitedir.',
    activities: [
      'Yürüyüş',
      'Yoga / hafif hareketlilik çalışmaları',
      'Kuvvet antrenmanı',
      'Bisiklet',
      'Yüzme',
      'Dans',
    ],
    section4Body1: 'Herkes için geçerli bir kural yok: asıl önemli olan performanstan çok düzenliliktir. Gününe kısa hareket molaları sığdırmak (yürümek, merdiven çıkmak, esnemek) planlı bir antrenman kadar değerlidir.',
    section4Body2: 'Doğru yoğunluk; kondisyon düzeyine, sağlığına, o anki enerjine ve kişisel hedeflerine bağlıdır: bir kişiye uyan, başkasına mutlaka uymaz.',
    highlightTitle: 'Düzenliliği öne al',
    highlightText: 'Zaman içinde sürdürülen haftada üç kısa seans, birkaç gün sonra bırakılan iddialı bir hedeften çoğu zaman daha faydalıdır.',
    section5Body: 'Enerji ve fiziksel konfor döngü boyunca değişebilir. Aktivitenin yoğunluğunu nasıl hissettiğine göre ayarlamak son derece yerindedir.',
    cyclePhases: [
      'Adet sırasında: sana uyuyorsa hafif hareketler',
      'Adetten sonra: enerjin elveriyorsa kademeli olarak artır',
      'Yumurtlama civarında: konforuna göre normal aktiviteyi sürdür',
      'Adetten önce: yönetilebilir hareketleri tercih et, gerekirse dinlen',
    ],
    neutral2Text: 'Bunlar katı fizyolojik kurallar değildir: her kadın döngüsünü farklı yaşar ve bu örnekler yol gösterici noktalardır, zorunluluk değildir.',
    section6Body: 'PKOS’u olan kadınlar için düzenli fiziksel aktivite özellikle yardımcı olabilir: bu bağlamda sıklıkla etkilenen bir mekanizma olan insülin duyarlılığını destekler ve uzun vadede daha iyi bir metabolik ve hormonal dengeye katkıda bulunabilir.',
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Bu bir tedavi değil, genel bakıma tamamlayıcı bir destektir; bir sağlık profesyoneliyle birlikte uyarlanmalıdır.',
    section7Intro: 'Bazı yanlış inanışlar veya alışkanlıklar fayda yerine zarar verebilir:',
    mistakes: [
      'Aşırı egzersiz yapmak istemek',
      'Yalnızca yoğun antrenmanların faydalı olduğunu düşünmek',
      'Egzersizi yalnızca kilo verme hedefiyle yapmak',
      'Yorgunluğu veya ağrıyı göz ardı etmek',
      'Kaçırılan bir seans sonrasında suçluluk duymak',
    ],
    section8Intro: 'Bazı durumlarda, bir fiziksel aktiviteye yeniden başlamadan veya onu uyarlamadan önce bir sağlık profesyonelinin görüşü özellikle faydalıdır:',
    consultReasons: [
      'Geçmeyen ağrı',
      'Olağan dışı kanama',
      'Baş dönmesi',
      'Belirgin, alışılmadık yorgunluk',
      'Belirli bir tıbbi durum',
      'Gebelik veya doğum sonrasında aktiviteye yeniden başlamak',
      'Aktivitenin tıbbi olarak kısıtlandığı herhangi bir durum',
    ],
    tip3Title: 'Bilmekte fayda var',
    tip3Text: 'Hareketin faydalı olması için yoğun ya da mükemmel olması gerekmez. Düzenli, keyifli ve sürdürülebilir bir aktivite genel sağlığını destekleyebilir ve bazı kadınlarda döngünün daha iyi yönetilmesine katkıda bulunabilir.',
    finalNoteTitle: 'Anlamana yardımcı olacak bir rehber',
    finalNoteText: 'Bu makale genel bilgilendirme amaçlıdır ve tıbbi tavsiyenin yerini tutmaz. Fiziksel aktiviteyi her zaman kişisel durumuna göre uyarla ve tereddüt ettiğinde bir sağlık profesyonelinden görüş al.',
    shareMessage: 'Döngüne destek olmak için hareket et — AWA',
  },
  ru: {
    badge: 'ЦИКЛ • ФИЗИЧЕСКАЯ АКТИВНОСТЬ',
    title: 'Двигайтесь,\nчтобы поддержать свой цикл',
    metaDuration: '8 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Образовательный материал',
    intro: 'Почему регулярная физическая активность может поддерживать баланс вашего цикла, каким видам движения отдавать предпочтение и как подбирать темп без давления и чувства вины.',
    introSecondary: 'Речь не о том, чтобы делать больше, а о том, чтобы двигаться так, как подходит именно вам и как вы сможете поддерживать со временем.',
    contentsTitle: 'В этой статье',
    topics: [
      'Почему движение может поддерживать цикл',
      'Какую пользу оно приносит циклу?',
      'Какой вид активности выбрать?',
      'Сколько нужно двигаться?',
      'Как подстраивать активность под цикл',
      'Движение при СПКЯ',
      'Ошибки, которых стоит избегать',
      'Когда обратиться за советом',
      'Главное',
    ],
    section1Body1: 'Регулярная физическая активность влияет на многие системы организма, в том числе на те, что участвуют в гормональной регуляции и работе менструального цикла. Она воздействует, в частности, на чувствительность к инсулину, управление стрессом и качество сна — три фактора, которые взаимодействуют с гормональным балансом.',
    section1Body2: 'Регулярное движение не гарантирует «идеального» цикла, но это одна из привычек, поддерживающих общее здоровье, и у некоторых женщин её эффекты могут отражаться на цикле.',
    tip1Title: 'ПОЛЕЗНО ЗНАТЬ',
    tip1Text: 'Связь между физической активностью и циклом индивидуальна: одни женщины замечают явный эффект, другие — менее выраженный. В любом случае это полезная привычка.',
    section2Intro: 'Регулярная активность может вносить вклад на нескольких уровнях, при этом такие эффекты не гарантированы и не одинаковы для всех:',
    benefits: [
      'Поддержка обмена веществ',
      'Помощь в регуляции уровня сахара в крови',
      'Поддержка гормонального баланса',
      'Повышение уровня энергии',
      'Снижение стресса',
      'Поддержка качества сна',
      'У некоторых женщин — более регулярный цикл',
    ],
    neutral1Text: 'Эта польза накапливается постепенно: мгновенного эффекта после одной тренировки ожидать не стоит.',
    section3Intro: 'Нет активности, которая была бы «лучше» других: самая эффективная — та, которой вам нравится заниматься регулярно.',
    activities: [
      'Ходьба',
      'Йога / мягкая мобильность',
      'Силовые тренировки',
      'Велосипед',
      'Плавание',
      'Танцы',
    ],
    section4Body1: 'Универсального правила нет: важнее всего регулярность, а не результат. Короткие периоды движения в течение дня (прогулка, подъём по лестнице, растяжка) засчитываются так же, как запланированная тренировка.',
    section4Body2: 'Подходящая интенсивность зависит от вашей физической формы, здоровья, текущего уровня энергии и личных целей: то, что работает для одного человека, не обязательно подходит другому.',
    highlightTitle: 'Отдавайте приоритет регулярности',
    highlightText: 'Три короткие тренировки в неделю, которые вы поддерживаете долго, часто полезнее амбициозной цели, оставленной через несколько дней.',
    section5Body: 'Энергия и физический комфорт могут меняться на протяжении цикла. Вполне нормально подстраивать интенсивность активности под самочувствие.',
    cyclePhases: [
      'Во время месячных: мягкое движение, если оно вам подходит',
      'После месячных: постепенно увеличивайте нагрузку, если позволяет уровень энергии',
      'Около овуляции: поддерживайте привычную активность в соответствии со своим самочувствием',
      'Перед месячными: отдавайте предпочтение посильному движению и отдыхайте при необходимости',
    ],
    neutral2Text: 'Это не строгие физиологические правила: каждая женщина переживает свой цикл по-разному, и эти примеры — ориентиры, а не обязательства.',
    section6Body: 'Для женщин с СПКЯ регулярная физическая активность может быть особенно полезной: она поддерживает чувствительность к инсулину — механизм, который в этом случае часто нарушен, — и в долгосрочной перспективе может способствовать лучшему обменному и гормональному балансу.',
    tip2Title: 'ПОЛЕЗНО ЗНАТЬ',
    tip2Text: 'Это не лечение, а дополнительная поддержка в рамках общего ведения, которую следует подбирать вместе с медицинским специалистом.',
    section7Intro: 'Некоторые заблуждения или привычки могут принести больше вреда, чем пользы:',
    mistakes: [
      'Стремление заниматься чрезмерно',
      'Убеждённость, что полезны только интенсивные тренировки',
      'Занятия исключительно с целью похудения',
      'Игнорирование усталости или боли',
      'Чувство вины после пропущенной тренировки',
    ],
    section8Intro: 'В некоторых ситуациях совет медицинского специалиста особенно полезен, прежде чем возобновлять или менять физическую активность:',
    consultReasons: [
      'Стойкая боль',
      'Необычные кровотечения',
      'Головокружение',
      'Выраженная необычная усталость',
      'Определённое заболевание',
      'Возвращение к активности после беременности или родов',
      'Любая ситуация, в которой активность была ограничена по медицинским показаниям',
    ],
    tip3Title: 'ПОЛЕЗНО ЗНАТЬ',
    tip3Text: 'Чтобы движение приносило пользу, оно не обязано быть интенсивным или идеальным. Регулярная, приятная и посильная активность может поддерживать ваше общее здоровье и у некоторых женщин способствовать лучшему управлению циклом.',
    finalNoteTitle: 'Руководство, которое поможет разобраться',
    finalNoteText: 'Эта статья носит общий информационный характер и не заменяет медицинской консультации. Всегда подбирайте физическую активность с учётом своей ситуации и при сомнениях обращайтесь к медицинскому специалисту.',
    shareMessage: 'Двигайтесь, чтобы поддержать свой цикл — AWA',
  },
  de: {
    badge: 'ZYKLUS • KÖRPERLICHE AKTIVITÄT',
    title: 'Bewegung, die\ndeinen Zyklus unterstützt',
    metaDuration: '8 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Bildungsinhalt',
    intro: 'Warum regelmäßige Bewegung das Gleichgewicht deines Zyklus unterstützen kann, welche Bewegungsformen sich anbieten und wie du dein Tempo ohne Druck und Schuldgefühle anpasst.',
    introSecondary: 'Es geht nicht darum, mehr zu tun, sondern dich so zu bewegen, wie es zu dir passt und wie du es langfristig durchhalten kannst.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Warum Bewegung deinen Zyklus unterstützen kann',
      'Welche Vorteile für deinen Zyklus?',
      'Welche Aktivität passt zu dir?',
      'Wie viel Bewegung ist sinnvoll?',
      'Aktivität an deinen Zyklus anpassen',
      'Bewegung bei PCOS',
      'Fehler, die du vermeiden solltest',
      'Wann du dich beraten lassen solltest',
      'Das Wichtigste in Kürze',
    ],
    section1Body1: 'Regelmäßige körperliche Aktivität beeinflusst viele Systeme des Körpers, darunter auch diejenigen, die an der Hormonregulation und der Funktion des Menstruationszyklus beteiligt sind. Sie wirkt sich insbesondere auf die Insulinempfindlichkeit, den Umgang mit Stress und die Schlafqualität aus – drei Faktoren, die mit dem hormonellen Gleichgewicht zusammenwirken.',
    section1Body2: 'Regelmäßige Bewegung garantiert keinen „perfekten“ Zyklus, gehört aber zu den Gewohnheiten, die die allgemeine Gesundheit fördern – mit Effekten, die sich bei manchen Frauen auch im Zyklus zeigen können.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Der Zusammenhang zwischen körperlicher Aktivität und Zyklus ist individuell: Manche Frauen bemerken deutliche Effekte, andere weniger. In jedem Fall bleibt Bewegung eine förderliche Gewohnheit.',
    section2Intro: 'Regelmäßige Aktivität kann auf mehreren Ebenen beitragen, ohne dass diese Effekte garantiert oder bei allen gleich wären:',
    benefits: [
      'Die Stoffwechselgesundheit unterstützen',
      'Den Blutzuckerspiegel regulieren helfen',
      'Das hormonelle Gleichgewicht unterstützen',
      'Das Energieniveau verbessern',
      'Stress abbauen',
      'Die Schlafqualität unterstützen',
      'Bei manchen Frauen eine regelmäßigere Zyklusdauer fördern',
    ],
    neutral1Text: 'Diese Vorteile entwickeln sich nach und nach: Es ist keine sofortige Wirkung nach einer einzelnen Einheit.',
    section3Intro: 'Keine Aktivität ist „besser“ als eine andere: Die wirksamste ist die, die du gern und regelmäßig ausübst.',
    activities: [
      'Spazierengehen',
      'Yoga / sanfte Mobilisation',
      'Krafttraining',
      'Radfahren',
      'Schwimmen',
      'Tanzen',
    ],
    section4Body1: 'Es gibt keine allgemeingültige Regel: Wichtiger als Leistung ist die Regelmäßigkeit. Kurze Bewegungseinheiten im Alltag (Spazierengehen, Treppensteigen, Dehnen) zählen genauso viel wie ein geplantes Training.',
    section4Body2: 'Die passende Intensität hängt von deiner Fitness, deiner Gesundheit, deiner Energie im Moment und deinen persönlichen Zielen ab: Was für die eine Person funktioniert, passt nicht unbedingt für eine andere.',
    highlightTitle: 'Regelmäßigkeit zuerst',
    highlightText: 'Drei kurze Einheiten pro Woche, die du langfristig durchhältst, tun oft mehr für dich als ein ehrgeiziges Ziel, das du nach ein paar Tagen aufgibst.',
    section5Body: 'Energie und körperliches Wohlbefinden können im Laufe des Zyklus schwanken. Die Intensität deiner Aktivität nach deinem Befinden anzupassen, ist völlig legitim.',
    cyclePhases: [
      'Während deiner Periode: sanfte Bewegung, wenn sie dir guttut',
      'Nach deiner Periode: schrittweise steigern, wenn deine Energie es zulässt',
      'Rund um den Eisprung: normale Aktivität je nach deinem Wohlbefinden beibehalten',
      'Vor deiner Periode: Bewegung bevorzugen, die sich gut bewältigen lässt, und bei Bedarf ausruhen',
    ],
    neutral2Text: 'Das sind keine strengen physiologischen Regeln: Jede Frau erlebt ihren Zyklus anders, und diese Beispiele sind Orientierungspunkte, keine Verpflichtungen.',
    section6Body: 'Für Frauen mit PCOS kann regelmäßige körperliche Aktivität besonders hilfreich sein: Sie unterstützt die Insulinempfindlichkeit, einen Mechanismus, der in diesem Zusammenhang oft beeinträchtigt ist, und kann langfristig zu einem besseren Stoffwechsel- und Hormongleichgewicht beitragen.',
    tip2Title: 'Gut zu wissen',
    tip2Text: 'Das ist keine Heilung, sondern eine ergänzende Unterstützung der Gesamtbehandlung, die du gemeinsam mit medizinischem Fachpersonal anpassen solltest.',
    section7Intro: 'Manche falschen Vorstellungen oder Gewohnheiten schaden mehr, als sie nützen:',
    mistakes: [
      'Sich übermäßig verausgaben wollen',
      'Glauben, dass nur intensive Trainingseinheiten etwas bringen',
      'Nur mit dem Ziel der Gewichtsabnahme Sport treiben',
      'Müdigkeit oder Schmerzen ignorieren',
      'Sich nach einer ausgefallenen Einheit schuldig fühlen',
    ],
    section8Intro: 'In bestimmten Situationen ist der Rat von medizinischem Fachpersonal besonders hilfreich, bevor du eine körperliche Aktivität wieder aufnimmst oder anpasst:',
    consultReasons: [
      'Anhaltende Schmerzen',
      'Ungewöhnliche Blutungen',
      'Schwindel',
      'Deutliche, ungewöhnliche Müdigkeit',
      'Eine bestimmte Erkrankung',
      'Wiederaufnahme der Aktivität nach einer Schwangerschaft oder Geburt',
      'Jede Situation, in der Aktivität ärztlich eingeschränkt wurde',
    ],
    tip3Title: 'Gut zu wissen',
    tip3Text: 'Bewegung muss nicht intensiv oder perfekt sein, um zu wirken. Eine regelmäßige, angenehme und nachhaltige Aktivität kann deine allgemeine Gesundheit unterstützen und bei manchen Frauen zu einem besseren Umgang mit dem Zyklus beitragen.',
    finalNoteTitle: 'Ein Ratgeber zum besseren Verständnis',
    finalNoteText: 'Dieser Artikel dient der allgemeinen Information und ersetzt keine ärztliche Beratung. Passe körperliche Aktivität immer an deine persönliche Situation an und lass dich bei Zweifeln von medizinischem Fachpersonal beraten.',
    shareMessage: 'Bewegung, die deinen Zyklus unterstützt — AWA',
  },
  zh: {
      badge: '周期 • 身体活动',
      title: '动一动，\n呵护你的周期',
      metaDuration: '阅读约 8 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '科普内容',
      intro: '为什么规律的身体活动可能有助于周期平衡，适合选择哪些类型的运动，以及如何在没有压力、无需自责的前提下调整节奏。',
      introSecondary: '重点不是做得更多，而是用适合自己、并且能长期坚持的方式去运动。',
      contentsTitle: '本文内容',
      topics: [
        '为什么运动可能有助于周期',
        '对周期有哪些益处？',
        '选择哪种类型的运动？',
        '动多少合适？',
        '根据周期调整运动',
        '患有多囊卵巢综合征（PCOS）时如何运动',
        '需要避免的误区',
        '何时寻求建议',
        '要点回顾',
      ],
      section1Body1: '规律的身体活动会影响身体的许多系统，其中包括与激素调节和月经周期运作有关的系统。它尤其会作用于胰岛素敏感性、压力管理和睡眠质量，而这三者都与激素平衡相互影响。',
      section1Body2: '经常运动并不能保证拥有“完美”的周期，但它是有益整体健康的习惯之一，对部分女性来说，其效果也可能体现在周期上。',
      tip1Title: '小贴士',
      tip1Text: '身体活动与周期之间的联系因人而异：有些女性会感受到明显的变化，有些则不太明显。无论如何，它依然是一个有益的习惯。',
      section2Intro: '规律的活动可能在多个方面带来帮助，但这些效果并不是一定会出现，也不会人人相同：',
      benefits: [
        '有助于代谢健康',
        '有助于调节血糖',
        '有助于激素平衡',
        '改善精力水平',
        '缓解压力',
        '有助于改善睡眠质量',
        '对部分女性来说，可能有助于让周期更规律',
      ],
      neutral1Text: '这些益处是逐渐积累的：并不是一次运动之后就能立刻见效。',
      section3Intro: '没有哪种运动比另一种“更好”：最有效的，是你喜欢并愿意规律坚持的那一种。',
      activities: [
        '步行',
        '瑜伽 / 轻柔的拉伸活动',
        '力量训练',
        '骑行',
        '游泳',
        '舞蹈',
      ],
      section4Body1: '没有放之四海而皆准的规则：比起表现，规律更重要。把短时间的活动融入一天当中（散步、爬楼梯、拉伸），和一次计划好的训练同样有意义。',
      section4Body2: '合适的强度取决于你的体能水平、健康状况、当下的精力以及个人目标：适合某个人的方式，不一定适合另一个人。',
      highlightTitle: '优先保持规律',
      highlightText: '每周三次短时间的运动，如果能长期坚持，往往比一个雄心勃勃却几天后就放弃的目标更有益。',
      section5Body: '精力和身体的舒适度在整个周期中可能会有所变化。根据自己的感受来调整运动强度，是完全合理的。',
      cyclePhases: [
        '月经期间：如果合适，做一些轻柔的活动',
        '月经结束后：精力允许的话，逐步增加运动量',
        '排卵前后：根据舒适度保持日常的活动量',
        '月经来潮前：选择自己能轻松完成的活动，必要时休息',
      ],
      neutral2Text: '这些并不是严格的生理规则：每位女性对周期的感受都不一样，这些例子只是参考，而不是义务。',
      section6Body: '对于患有多囊卵巢综合征（PCOS）的女性，规律的身体活动可能尤其有帮助：它有助于改善胰岛素敏感性（这一机制在这种情况下常常受到影响），并且长期来看可能有助于代谢和激素的平衡。',
      tip2Title: '小贴士',
      tip2Text: '这不是治愈的方法，而是对整体治疗的补充支持，需要与医疗专业人员一起根据情况调整。',
      section7Intro: '有些误解或习惯可能弊大于利：',
      mistakes: [
        '想要过度运动',
        '认为只有高强度训练才有用',
        '只是为了减重才运动',
        '忽视疲劳或疼痛',
        '错过一次运动就感到内疚',
      ],
      section8Intro: '在某些情况下，恢复或调整身体活动之前，医疗专业人员的建议尤为重要：',
      consultReasons: [
        '持续的疼痛',
        '不寻常的出血',
        '头晕',
        '明显而不寻常的疲劳',
        '有特定的健康问题',
        '怀孕或分娩后恢复运动',
        '任何曾被医生限制活动的情况',
      ],
      tip3Title: '小贴士',
      tip3Text: '运动不需要高强度或完美才有益处。一种规律、让你喜欢、可以长期坚持的活动，可能有助于你的整体健康，并且对部分女性来说，也可能有助于更好地管理周期。',
      finalNoteTitle: '帮助你了解的指南',
      finalNoteText: '本文仅供一般了解，不能替代医生建议。请务必根据你的个人情况调整身体活动，如有疑问，请咨询医疗专业人员。',
      shareMessage: '动一动，呵护你的周期 — AWA',
    },
  id: {
    badge: 'SIKLUS • AKTIVITAS FISIK',
    title: 'Bergerak untuk\nmendukung siklusmu',
    metaDuration: '8 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten edukatif',
    intro: 'Mengapa aktivitas fisik secara teratur dapat mendukung keseimbangan siklusmu, jenis gerakan apa yang sebaiknya dipilih, dan cara menyesuaikan ritmemu tanpa tekanan atau rasa bersalah.',
    introSecondary: 'Bukan soal melakukan lebih banyak, melainkan bergerak dengan cara yang cocok untukmu dan bisa kamu pertahankan dalam jangka panjang.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Mengapa bergerak dapat mendukung siklusmu',
      'Apa manfaatnya untuk siklusmu?',
      'Jenis aktivitas apa yang dipilih?',
      'Seberapa banyak sebaiknya bergerak?',
      'Menyesuaikan aktivitas dengan siklusmu',
      'Bergerak saat kamu menderita PCOS',
      'Kesalahan yang perlu dihindari',
      'Kapan perlu meminta saran',
      'Poin penting',
    ],
    section1Body1: 'Aktivitas fisik yang teratur memengaruhi banyak sistem tubuh, termasuk yang berperan dalam pengaturan hormon dan cara kerja siklus menstruasi. Aktivitas fisik bekerja terutama pada sensitivitas insulin, pengelolaan stres, dan kualitas tidur — tiga faktor yang saling berinteraksi dengan keseimbangan hormonal.',
    section1Body2: 'Bergerak secara teratur tidak menjamin siklus yang “sempurna”, tetapi merupakan salah satu kebiasaan yang mendukung kesehatan secara keseluruhan, dengan efek yang pada sebagian perempuan dapat tercermin pada siklusnya.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Hubungan antara aktivitas fisik dan siklus bersifat individual: sebagian perempuan merasakan efek yang jelas, sebagian lain kurang. Bagaimanapun, ini tetap kebiasaan yang bermanfaat.',
    section2Intro: 'Aktivitas yang teratur dapat berkontribusi di beberapa tingkat, tanpa efek ini dijamin atau sama bagi semua orang:',
    benefits: [
      'Mendukung kesehatan metabolik',
      'Membantu mengatur gula darah',
      'Mendukung keseimbangan hormonal',
      'Meningkatkan tingkat energi',
      'Mengurangi stres',
      'Mendukung kualitas tidur',
      'Pada sebagian perempuan, mendorong keteraturan siklus yang lebih baik',
    ],
    neutral1Text: 'Manfaat ini terbentuk secara bertahap: bukan efek instan setelah satu sesi.',
    section3Intro: 'Tidak ada aktivitas yang “lebih baik” daripada yang lain: yang paling efektif adalah yang kamu nikmati dan lakukan secara teratur.',
    activities: [
      'Berjalan kaki',
      'Yoga / mobilitas ringan',
      'Latihan kekuatan',
      'Bersepeda',
      'Berenang',
      'Menari',
    ],
    section4Body1: 'Tidak ada aturan yang berlaku untuk semua: yang terpenting adalah keteraturan, bukan performa. Menyelipkan gerakan singkat dalam harimu (berjalan, naik tangga, peregangan) sama berartinya dengan latihan yang terjadwal.',
    section4Body2: 'Intensitas yang tepat bergantung pada tingkat kebugaran, kesehatan, energimu saat itu, dan tujuan pribadimu: apa yang cocok untuk satu orang belum tentu cocok untuk orang lain.',
    highlightTitle: 'Utamakan keteraturan',
    highlightText: 'Tiga sesi singkat seminggu yang dipertahankan dalam jangka panjang sering kali lebih bermanfaat daripada target ambisius yang ditinggalkan setelah beberapa hari.',
    section5Body: 'Energi dan kenyamanan fisik bisa berubah sepanjang siklus. Menyesuaikan intensitas aktivitasmu berdasarkan apa yang kamu rasakan adalah hal yang sangat wajar.',
    cyclePhases: [
      'Saat haid: gerakan lembut jika itu cocok untukmu',
      'Setelah haid: tingkatkan secara bertahap jika energimu mengizinkan',
      'Sekitar ovulasi: pertahankan aktivitas normal sesuai kenyamananmu',
      'Sebelum haid: pilih gerakan yang terjangkau, dan istirahat jika perlu',
    ],
    neutral2Text: 'Ini bukan aturan fisiologis yang ketat: setiap perempuan menjalani siklusnya dengan cara berbeda, dan contoh-contoh ini hanyalah patokan, bukan kewajiban.',
    section6Body: 'Bagi perempuan dengan PCOS, aktivitas fisik secara teratur bisa sangat membantu: mendukung sensitivitas insulin, mekanisme yang sering terpengaruh dalam kondisi ini, dan dapat berkontribusi pada keseimbangan metabolik dan hormonal yang lebih baik dalam jangka panjang.',
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Ini bukan obat, melainkan dukungan pelengkap bagi perawatan secara keseluruhan, yang perlu disesuaikan bersama tenaga kesehatan.',
    section7Intro: 'Beberapa anggapan keliru atau kebiasaan justru bisa lebih merugikan daripada bermanfaat:',
    mistakes: [
      'Ingin berolahraga secara berlebihan',
      'Mengira hanya latihan yang intens yang berguna',
      'Berolahraga hanya dengan tujuan menurunkan berat badan',
      'Mengabaikan kelelahan atau rasa nyeri',
      'Merasa bersalah setelah melewatkan satu sesi',
    ],
    section8Intro: 'Pada situasi tertentu, saran tenaga kesehatan sangat berguna sebelum memulai kembali atau menyesuaikan aktivitas fisik:',
    consultReasons: [
      'Nyeri yang menetap',
      'Perdarahan yang tidak biasa',
      'Pusing',
      'Kelelahan yang berat dan tidak biasa',
      'Kondisi medis tertentu',
      'Memulai kembali aktivitas setelah kehamilan atau persalinan',
      'Situasi apa pun ketika aktivitas telah dibatasi secara medis',
    ],
    tip3Title: 'Perlu diketahui',
    tip3Text: 'Gerakan tidak perlu intens atau sempurna agar bermanfaat. Aktivitas yang teratur, menyenangkan, dan berkelanjutan dapat mendukung kesehatanmu secara keseluruhan dan, pada sebagian perempuan, berkontribusi pada pengelolaan siklus yang lebih baik.',
    finalNoteTitle: 'Panduan untuk membantumu memahami',
    finalNoteText: 'Artikel ini ditujukan sebagai informasi umum dan tidak menggantikan saran medis. Selalu sesuaikan aktivitas fisik dengan situasi pribadimu, dan minta saran tenaga kesehatan jika ragu.',
    shareMessage: 'Bergerak untuk mendukung siklusmu — AWA',
  },
  hi: {
    badge: 'चक्र • शारीरिक गतिविधि',
    title: 'अपने चक्र का साथ देने\nके लिए चलें-फिरें',
    metaDuration: '8 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'शैक्षिक कंटेंट',
    intro: 'नियमित शारीरिक गतिविधि आपके चक्र के संतुलन में कैसे मदद कर सकती है, किस तरह की गतिविधि चुनें, और बिना दबाव या अपराधबोध के अपनी रफ़्तार कैसे ढालें।',
    introSecondary: 'बात ज़्यादा करने की नहीं है, बल्कि ऐसे चलने-फिरने की है जो आपके अनुकूल हो और जिसे आप लंबे समय तक निभा सकें।',
    contentsTitle: 'इस लेख में',
    topics: [
      'चलना-फिरना चक्र में कैसे मदद कर सकता है',
      'चक्र के लिए क्या फ़ायदे हैं?',
      'कौन-सी गतिविधि चुनें?',
      'कितना चलना-फिरना चाहिए?',
      'गतिविधि को अपने चक्र के अनुसार ढालना',
      'PCOS में चलना-फिरना',
      'इन गलतियों से बचें',
      'सलाह कब लें',
      'मुख्य बातें',
    ],
    section1Body1: 'नियमित शारीरिक गतिविधि शरीर की कई प्रणालियों पर असर डालती है, जिनमें हार्मोन को नियंत्रित करने वाली और मासिक चक्र के काम करने के तरीके से जुड़ी प्रणालियाँ भी शामिल हैं। यह खास तौर पर इंसुलिन के प्रति संवेदनशीलता, तनाव संभालने और नींद की गुणवत्ता पर काम करती है, और ये तीनों बातें हार्मोन के संतुलन से जुड़ी हैं।',
    section1Body2: 'नियमित रूप से चलना-फिरना “एकदम सही” चक्र की गारंटी नहीं देता, लेकिन यह उन आदतों में से है जो अच्छी सेहत में मदद करती हैं, और कुछ महिलाओं में इसका असर चक्र में भी दिख सकता है।',
    tip1Title: 'जानना अच्छा रहेगा',
    tip1Text: 'शारीरिक गतिविधि और चक्र का रिश्ता हर महिला में अलग होता है: कुछ को साफ़ असर दिखता है, कुछ को कम। दोनों ही हालत में यह एक फ़ायदेमंद आदत है।',
    section2Intro: 'नियमित गतिविधि कई स्तरों पर योगदान दे सकती है, पर ये असर पक्के नहीं हैं और सभी में एक जैसे नहीं होते:',
    benefits: [
      'मेटाबॉलिक सेहत में मदद',
      'ब्लड शुगर को नियंत्रित करने में मदद',
      'हार्मोन के संतुलन में मदद',
      'ऊर्जा का स्तर बेहतर करना',
      'तनाव कम करना',
      'नींद की गुणवत्ता में मदद',
      'कुछ महिलाओं में चक्र को ज़्यादा नियमित बनाने में मदद',
    ],
    neutral1Text: 'ये फ़ायदे धीरे-धीरे जमा होते हैं: यह किसी एक सेशन के बाद तुरंत दिखने वाला असर नहीं है।',
    section3Intro: 'कोई भी गतिविधि दूसरी से “बेहतर” नहीं होती: सबसे असरदार वही है जिसे आप पसंद से नियमित रूप से कर सकें।',
    activities: [
      'पैदल चलना',
      'योग / हल्की स्ट्रेचिंग',
      'स्ट्रेंथ ट्रेनिंग',
      'साइकिल चलाना',
      'तैराकी',
      'डांस',
    ],
    section4Body1: 'इसका कोई एक नियम सब पर लागू नहीं होता: सबसे ज़्यादा मायने नियमितता रखती है, प्रदर्शन नहीं। दिन में थोड़ी-थोड़ी देर चलना-फिरना (पैदल चलना, सीढ़ियाँ चढ़ना, स्ट्रेचिंग) भी उतना ही गिना जाता है जितना योजना बनाकर की गई वर्कआउट।',
    section4Body2: 'सही तीव्रता आपकी फ़िटनेस, सेहत, उस समय की आपकी ऊर्जा और आपके निजी लक्ष्यों पर निर्भर करती है: जो एक के लिए ठीक है, वह दूसरे के लिए ज़रूरी नहीं।',
    highlightTitle: 'नियमितता को प्राथमिकता दें',
    highlightText: 'हफ़्ते में तीन छोटे सेशन, जो लंबे समय तक चलते रहें, अक्सर कुछ दिन बाद छोड़ दिए गए बड़े लक्ष्य से ज़्यादा फ़ायदेमंद होते हैं।',
    section5Body: 'चक्र के दौरान ऊर्जा और शारीरिक आराम बदल सकते हैं। आप जैसा महसूस करती हैं, उसके अनुसार अपनी गतिविधि की तीव्रता बदलना बिल्कुल जायज़ है।',
    cyclePhases: [
      'पीरियड के दौरान: अगर आपको ठीक लगे तो हल्का चलना-फिरना',
      'पीरियड के बाद: ऊर्जा साथ दे तो धीरे-धीरे बढ़ाएँ',
      'ओव्यूलेशन के आसपास: अपनी सुविधा के अनुसार सामान्य गतिविधि बनाए रखें',
      'पीरियड से पहले: निभाने लायक गतिविधि चुनें, और ज़रूरत हो तो आराम करें',
    ],
    neutral2Text: 'ये शरीर-क्रिया के कड़े नियम नहीं हैं: हर महिला अपना चक्र अलग तरह से जीती है, और ये उदाहरण सिर्फ़ संदर्भ-बिंदु हैं, बाध्यता नहीं।',
    section6Body: 'PCOS वाली महिलाओं के लिए नियमित शारीरिक गतिविधि खास तौर पर मददगार हो सकती है: यह इंसुलिन के प्रति संवेदनशीलता में मदद करती है, जो इस स्थिति में अक्सर प्रभावित होती है, और लंबे समय में बेहतर मेटाबॉलिक और हार्मोनल संतुलन में योगदान दे सकती है।',
    tip2Title: 'जानना अच्छा रहेगा',
    tip2Text: 'यह कोई इलाज नहीं है, बल्कि समग्र देखभाल का एक सहायक हिस्सा है, जिसे स्वास्थ्य विशेषज्ञ के साथ मिलकर अपने अनुसार ढालना चाहिए।',
    section7Intro: 'कुछ गलत धारणाएँ या आदतें फ़ायदे से ज़्यादा नुकसान कर सकती हैं:',
    mistakes: [
      'ज़रूरत से ज़्यादा कसरत करना चाहना',
      'यह सोचना कि सिर्फ़ तेज़ वर्कआउट ही काम के होते हैं',
      'सिर्फ़ वज़न घटाने के इरादे से कसरत करना',
      'थकान या दर्द को नज़रअंदाज़ करना',
      'कोई सेशन छूटने पर अपराधबोध महसूस करना',
    ],
    section8Intro: 'कुछ स्थितियों में शारीरिक गतिविधि दोबारा शुरू करने या उसे ढालने से पहले स्वास्थ्य विशेषज्ञ की सलाह खास तौर पर काम की होती है:',
    consultReasons: [
      'लगातार बना रहने वाला दर्द',
      'असामान्य रक्तस्राव',
      'चक्कर आना',
      'बहुत ज़्यादा, असामान्य थकान',
      'कोई खास चिकित्सकीय स्थिति',
      'गर्भावस्था या प्रसव के बाद गतिविधि दोबारा शुरू करना',
      'कोई भी स्थिति जिसमें डॉक्टर ने गतिविधि पर रोक लगाई हो',
    ],
    tip3Title: 'जानना अच्छा रहेगा',
    tip3Text: 'फ़ायदेमंद होने के लिए चलना-फिरना तेज़ या एकदम सही होना ज़रूरी नहीं है। नियमित, पसंद की और निभाने लायक गतिविधि आपकी समग्र सेहत में मदद कर सकती है और कुछ महिलाओं में चक्र को बेहतर संभालने में योगदान दे सकती है।',
    finalNoteTitle: 'समझने में मदद के लिए एक गाइड',
    finalNoteText: 'यह लेख सामान्य जानकारी के लिए है और चिकित्सकीय सलाह का विकल्प नहीं है। शारीरिक गतिविधि को हमेशा अपनी निजी स्थिति के अनुसार ढालें, और संदेह हो तो स्वास्थ्य विशेषज्ञ से सलाह लें।',
    shareMessage: 'अपने चक्र का साथ देने के लिए चलें-फिरें — AWA',
  },
  sq: {
    badge: 'CIKLI • AKTIVITETI FIZIK',
    title: 'Lëvizi për të\nmbështetur ciklin tënd',
    metaDuration: '8 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje edukative',
    intro: 'Pse aktiviteti fizik i rregullt mund të mbështesë ekuilibrin e ciklit tënd, cilat lloje lëvizjesh të zgjedhësh dhe si ta përshtatësh ritmin pa presion e pa fajësim.',
    introSecondary: 'Nuk ka të bëjë me të bërit më shumë, por me të lëvizurit në një mënyrë që të përshtatet dhe që mund ta mbash me kalimin e kohës.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Pse lëvizja mund të mbështesë ciklin tënd',
      'Cilat janë përfitimet për ciklin tënd?',
      'Cilin lloj aktiviteti të zgjedhësh?',
      'Sa duhet të lëvizësh?',
      'Përshtatja e aktivitetit me ciklin tënd',
      'Të lëvizësh kur ke PCOS',
      'Gabimet që duhen shmangur',
      'Kur të kërkosh këshillë',
      'Çfarë të mbash mend',
    ],
    section1Body1: 'Aktiviteti fizik i rregullt ndikon në shumë sisteme të trupit, përfshirë ato që kanë të bëjnë me rregullimin hormonal dhe funksionimin e ciklit menstrual. Ai vepron veçanërisht te ndjeshmëria ndaj insulinës, menaxhimi i stresit dhe cilësia e gjumit — tre faktorë që ndërveprojnë me ekuilibrin hormonal.',
    section1Body2: 'Të lëvizësh rregullisht nuk garanton një cikël “perfekt”, por është një nga zakonet që mbështesin shëndetin e përgjithshëm, me efekte që te disa gra mund të pasqyrohen në cikël.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Lidhja midis aktivitetit fizik dhe ciklit është individuale: disa gra vënë re efekte të qarta, të tjera më pak. Në çdo rast, mbetet një zakon i dobishëm.',
    section2Intro: 'Aktiviteti i rregullt mund të kontribuojë në disa nivele, pa qenë këto efekte të garantuara ose të njëjta për të gjitha:',
    benefits: [
      'Mbështet shëndetin metabolik',
      'Ndihmon në rregullimin e sheqerit në gjak',
      'Mbështet ekuilibrin hormonal',
      'Përmirëson nivelet e energjisë',
      'Zvogëlon stresin',
      'Mbështet cilësinë e gjumit',
      'Nxit, te disa gra, një rregullsi më të mirë të ciklit',
    ],
    neutral1Text: 'Këto përfitime grumbullohen gradualisht: nuk është një efekt i menjëhershëm pas një seance të vetme.',
    section3Intro: 'Asnjë aktivitet nuk është “më i mirë” se një tjetër: më efektivi është ai që të pëlqen ta praktikosh rregullisht.',
    activities: [
      'Ecja',
      'Yoga / lëvizshmëri e butë',
      'Stërvitja me forcë',
      'Çiklizmi',
      'Noti',
      'Vallëzimi',
    ],
    section4Body1: 'Nuk ka një rregull universal: ajo që ka më shumë rëndësi është rregullsia, jo performanca. Të fusësh çaste të shkurtra lëvizjeje në ditën tënde (ecje, ngjitje shkallësh, shtrirje) ka po aq vlerë sa një stërvitje e planifikuar.',
    section4Body2: 'Intensiteti i duhur varet nga niveli yt i formës fizike, shëndeti yt, energjia që ke në atë çast dhe qëllimet e tua personale: ajo që funksionon për një person nuk funksionon domosdoshmërisht për një tjetër.',
    highlightTitle: 'Jepi përparësi rregullsisë',
    highlightText: 'Tri seanca të shkurtra në javë, të mbajtura me kalimin e kohës, janë shpesh më të dobishme se një objektiv ambicioz i braktisur pas pak ditësh.',
    section5Body: 'Energjia dhe rehatia fizike mund të ndryshojnë gjatë ciklit. Të rregullosh intensitetin e aktivitetit sipas mënyrës se si ndihesh është plotësisht legjitime.',
    cyclePhases: [
      'Gjatë menstruacioneve: lëvizje të buta nëse të përshtatet',
      'Pas menstruacioneve: rrit gradualisht nëse energjia ta lejon',
      'Rreth ovulacionit: vazhdo aktivitetin normal në varësi të rehatisë sate',
      'Para menstruacioneve: preferoji lëvizjet e përballueshme dhe pusho nëse të duhet',
    ],
    neutral2Text: 'Këto nuk janë rregulla të rrepta fiziologjike: çdo grua e përjeton ciklin e saj në mënyrë të ndryshme dhe këta shembuj janë pika referimi, jo detyrime.',
    section6Body: 'Për gratë me PCOS, aktiviteti fizik i rregullt mund të jetë veçanërisht i dobishëm: ai mbështet ndjeshmërinë ndaj insulinës, një mekanizëm që shpesh preket në këtë kontekst, dhe mund të kontribuojë në një ekuilibër më të mirë metabolik e hormonal në afat të gjatë.',
    tip2Title: 'Mirë është ta dish',
    tip2Text: 'Nuk është një shërim, por një mbështetje plotësuese e kujdesit të përgjithshëm, që duhet përshtatur me një profesionist të shëndetësisë.',
    section7Intro: 'Disa keqkuptime ose zakone mund të bëjnë më shumë dëm sesa të mirë:',
    mistakes: [
      'Të duash të stërvitesh në mënyrë të tepruar',
      'Të mendosh se vetëm stërvitjet intensive janë të dobishme për ty',
      'Të stërvitesh vetëm me qëllim humbjen e peshës',
      'Të injorosh lodhjen ose dhimbjen',
      'Të ndihesh fajtore pas një seance të humbur',
    ],
    section8Intro: 'Në disa situata, këshilla e një profesionisti të shëndetësisë është veçanërisht e dobishme para se ta rifillosh ose ta përshtatësh një aktivitet fizik:',
    consultReasons: [
      'Dhimbje e vazhdueshme',
      'Gjakderdhje e pazakontë',
      'Marramendje',
      'Lodhje e madhe e pazakontë',
      'Një gjendje e veçantë mjekësore',
      'Rifillimi i aktivitetit pas një shtatzënie ose lindjeje',
      'Çdo situatë ku aktiviteti është kufizuar mjekësisht',
    ],
    tip3Title: 'Mirë është ta dish',
    tip3Text: 'Lëvizja nuk ka nevojë të jetë intensive ose perfekte për të qenë e dobishme. Një aktivitet i rregullt, i këndshëm dhe i qëndrueshëm mund të mbështesë shëndetin tënd të përgjithshëm dhe të kontribuojë, te disa gra, në një menaxhim më të mirë të ciklit.',
    finalNoteTitle: 'Një udhëzues për të të ndihmuar të kuptosh',
    finalNoteText: 'Ky artikull synon informimin e përgjithshëm dhe nuk zëvendëson këshillën mjekësore. Përshtate gjithmonë aktivitetin fizik me situatën tënde personale dhe kërko këshillën e një profesionisti të shëndetësisë nëse ke dyshime.',
    shareMessage: 'Lëvizi për të mbështetur ciklin tënd — AWA',
  },
  ja: {
    badge: '周期 • 運動',
    title: '体を動かして\n周期を支える',
    metaDuration: '読了まで8分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '教育的な内容',
    intro: '定期的な運動が周期のバランスを支える可能性がある理由、取り入れたい運動の種類、そしてプレッシャーや罪悪感なしにペースを調整する方法を紹介します。',
    introSecondary: '大切なのはたくさん動くことではなく、自分に合った動き方で、無理なく続けることです。',
    contentsTitle: 'この記事の内容',
    topics: [
      '体を動かすことが周期を支える理由',
      '周期にどのような利点があるか',
      'どの種類の運動を選ぶか',
      'どのくらい動けばよいか',
      '周期に合わせて運動を調整する',
      'PCOSがあるときの運動',
      '避けたい間違い',
      '相談したほうがよいとき',
      '要点',
    ],
    section1Body1: '定期的な運動は、ホルモンの調節や生理周期のはたらきに関わるものをはじめ、体の多くの仕組みに影響を与えます。とくに、インスリンの効きやすさ、ストレスへの対処、睡眠の質にはたらきかけます。この3つは、いずれもホルモンバランスと互いに影響し合っています。',
    section1Body2: '定期的に体を動かしても「完璧な」周期になるとは限りませんが、全身の健康を支える習慣の1つであり、その効果が周期に現れる女性もいます。',
    tip1Title: '知っておくと役立つこと',
    tip1Text: '運動と周期の関係には個人差があります。はっきりとした影響を感じる女性もいれば、それほど感じない女性もいます。どちらの場合でも、体によい習慣であることに変わりはありません。',
    section2Intro: '定期的な運動は、いくつかの面で役立つ可能性があります。ただし、こうした効果が保証されているわけではなく、誰にとっても同じとは限りません。',
    benefits: [
      '代謝の健康を支える',
      '血糖値の調整を助ける',
      'ホルモンバランスを支える',
      'エネルギーのレベルを高める',
      'ストレスを減らす',
      '睡眠の質を支える',
      '女性によっては、周期の規則性を高めることにつながる',
    ],
    neutral1Text: 'こうした利点は少しずつ積み重なっていくものです。1回の運動ですぐに効果が現れるわけではありません。',
    section3Intro: 'ほかより「優れている」運動というものはありません。いちばん効果的なのは、楽しみながら定期的に続けられる運動です。',
    activities: [
      'ウォーキング',
      'ヨガ／やさしい動き',
      '筋力トレーニング',
      'サイクリング',
      '水泳',
      'ダンス',
    ],
    section4Body1: '誰にでも当てはまる決まりはなく、成果よりも継続することのほうが大切です。1日の中に短い運動を取り入れること（歩く、階段を使う、ストレッチをするなど）も、計画したトレーニングと同じくらい価値があります。',
    section4Body2: '適した強度は、体力、健康状態、そのときのエネルギー、個人的な目標によって変わります。ある人に合うことが、別の人にも合うとは限りません。',
    highlightTitle: '継続することを大切に',
    highlightText: '週に3回の短い運動を長く続けるほうが、意気込んだ目標を数日でやめてしまうよりも、多くの場合よい結果につながります。',
    section5Body: 'エネルギーや体の楽さは、周期の中で変化することがあります。感じ方に合わせて運動の強度を調整することは、まったく自然なことです。',
    cyclePhases: [
      '生理中：合うようであれば、やさしい動きを',
      '生理の後：エネルギーに余裕があれば、少しずつ増やす',
      '排卵の前後：無理のない範囲で、いつもどおりの運動を続ける',
      '生理の前：無理なくできる動きを選び、必要なら休む',
    ],
    neutral2Text: 'これらは厳密な生理学的な決まりではありません。周期の感じ方は女性一人ひとり異なり、ここに挙げた例は目安であって、義務ではありません。',
    section6Body: 'PCOSのある女性にとって、定期的な運動はとくに役立つことがあります。この状況ではしばしば影響を受けるインスリンの効きやすさを支え、長い目で見て、代謝とホルモンのバランスを整えることにつながる可能性があります。',
    tip2Title: '知っておくと役立つこと',
    tip2Text: 'これは治療法ではなく、全体的なケアを補う支えです。医療従事者と相談しながら調整しましょう。',
    section7Intro: '思い込みや習慣の中には、役立つどころか逆効果になるものもあります。',
    mistakes: [
      '運動をやりすぎようとする',
      '激しいトレーニングだけが有益だと考える',
      '体重を減らす目的だけで運動する',
      '疲れや痛みを無視する',
      '1回運動できなかったことに罪悪感を抱く',
    ],
    section8Intro: '状況によっては、運動を再開したり調整したりする前に、医療従事者に相談することがとくに役立ちます。',
    consultReasons: [
      '痛みが続く',
      'いつもと違う出血がある',
      'めまいがある',
      'いつもと違う強い疲れがある',
      '特定の持病がある',
      '妊娠や出産の後に運動を再開する',
      '医学的な理由で運動が制限されているあらゆる状況',
    ],
    tip3Title: '知っておくと役立つこと',
    tip3Text: '体を動かすことは、激しくなくても完璧でなくても、役に立ちます。定期的に、楽しみながら、無理なく続けられる運動は、全身の健康を支え、女性によっては周期のよりよい管理にもつながる可能性があります。',
    finalNoteTitle: '理解を深めるためのガイド',
    finalNoteText: 'この記事は一般的な情報の提供を目的としており、医療上のアドバイスに代わるものではありません。運動は必ずご自身の状況に合わせて調整し、迷ったときは医療従事者に相談してください。',
    shareMessage: '体を動かして周期を支える — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function ExerciseCycleSupportArticleScreen({
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
          <Image accessible accessibilityLabel={EDITORIAL_IMAGE_ALT.exercise[lang]} accessibilityRole="image" source={resolveEditorialImage(HERO, lang)} resizeMode="cover" style={styles.hero} />

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
          {/* HEADER */}
          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">{content.badge}</AwaText>
          </View>

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
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

          <AwaText variant="titleSmall" style={styles.intro}>
            {content.intro}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.introSecondary}>
            {content.introSecondary}
          </AwaText>

          {/* CONTENTS */}
          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>{content.contentsTitle}</AwaText>

            {content.topics.map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.contentNumber}>{index + 1}.</AwaText>
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

          {/* 1 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.topics[0]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section1Body1}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
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

          {/* 2 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section2Intro}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.benefits.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.neutralBox}>
            <MaterialDesignIcons
              name="information-outline"
              size={22}
              color={theme.colors.textMuted}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.neutralText}>
              {content.neutral1Text}
            </AwaText>
          </AwaCard>

          {/* 3 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section3Intro}
          </AwaText>

          <View style={styles.daily}>
            {ACTIVITY_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>{content.activities[index]}</AwaText>
              </View>
            ))}
          </View>

          {/* 4 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section4Body1}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section4Body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.highlightBox}>
            <MaterialDesignIcons
              name="calendar-heart"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.highlightTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.highlightText}>
                {content.highlightText}
              </AwaText>
            </View>
          </AwaCard>

          {/* 5 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section5Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.consultCard}>
            {CYCLE_PHASE_ICONS.map((icon, index) => (
              <View key={icon} style={styles.consultRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="bodySmall" style={styles.consultText}>{content.cyclePhases[index]}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.neutralBox}>
            <MaterialDesignIcons
              name="information-outline"
              size={22}
              color={theme.colors.textMuted}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.neutralText}>
              {content.neutral2Text}
            </AwaText>
          </AwaCard>

          {/* 6 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>6. {content.topics[5]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section6Body}
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

          {/* 7 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>7. {content.topics[6]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section7Intro}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.mistakes.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="close-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />

                <AwaText variant="bodySmall" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* 8 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>8. {content.topics[7]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section8Intro}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.consultCard}>
            {CONSULT_ICONS.map((icon, index) => (
              <View key={icon} style={styles.consultRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="bodySmall" style={styles.consultText}>{content.consultReasons[index]}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* 9 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>9. {content.topics[8]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip3Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip3Text}
              </AwaText>
            </View>
          </AwaCard>

          {/* FINAL NOTE */}
          <AwaCard variant="filled" padding="none" style={styles.finalNote}>
            <MaterialDesignIcons
              name="shield-check-outline"
              size={23}
              color={theme.colors.textMuted}
            />

            <View style={styles.finalNoteCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.finalNoteTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.finalNoteText}>
                {content.finalNoteText}
              </AwaText>
            </View>
          </AwaCard>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={8} scrollRef={scrollRef} />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {flex: 1, backgroundColor: theme.colors.background},
  scroll: {paddingBottom: 32},
  heroWrap: {height: 245, backgroundColor: theme.colors.surfaceSecondary},
  hero: {width: '100%', height: '100%'},
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actions: {flexDirection: 'row', gap: 8},
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
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 4},
  metaDivider: {width: 1, height: 20, backgroundColor: theme.colors.border},
  intro: {
    marginTop: 16,
  },
  introSecondary: {
    marginTop: 8,
  },
  contents: {
    marginTop: 20,
    padding: 16,
  },
  contentsTitle: {marginBottom: 8},
  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentLeft: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  contentNumber: {width: 25},
  contentText: {flex: 1},
  h2: {
    marginTop: 24,
  },
  body: {marginTop: 8},
  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 4},
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
  checkText: {flex: 1},
  neutralBox: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  neutralText: {flex: 1},
  daily: {marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  dailyItem: {
    width: '48.7%',
    minHeight: 108,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },
  dailyText: {
    marginTop: 8,
    textAlign: 'center',
  },
  highlightBox: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  highlightCopy: {flex: 1, marginLeft: 12},
  highlightText: {
    marginTop: 4,
  },
  consultCard: {
    marginTop: 16,
    padding: 12,
  },
  consultRow: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  consultIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  consultText: {
    flex: 1,
    marginLeft: 12,
  },
  finalNote: {
    marginTop: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  finalNoteCopy: {flex: 1, marginLeft: 12},
  finalNoteText: {
    marginTop: 4,
  },
  });
}
