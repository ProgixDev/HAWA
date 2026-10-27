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

const ID = 'hotflashes-bouffees-de-chaleur';

const HERO = require('../../assets/images/library/tip-heat.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const DAILY_ICONS = [
  'tshirt-crew-outline',
  'weather-windy',
  'meditation',
  'cup-water',
] as const;

const CONSULT_ICONS = ['sleep', 'briefcase-outline', 'chart-line', 'medical-bag'] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('HotFlashes', {
  fr: {
    badge: 'BOUFFÉES DE CHALEUR',
    title: 'Apprivoiser les\nbouffées de chaleur',
    metaDuration: '10 min de lecture',
    metaType: 'Article',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Pourquoi elles surviennent, comment identifier tes déclencheurs et quelles solutions peuvent aider lorsqu’elles deviennent gênantes.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Pourquoi les bouffées de chaleur surviennent',
      'Les sueurs nocturnes',
      'Les déclencheurs courants',
      'Des gestes qui aident au quotidien',
      'Quand en parler à un professionnel',
      'À retenir',
    ],
    section1Body1: 'Les bouffées de chaleur sont très fréquentes pendant la transition vers la ménopause. Elles sont liées notamment aux variations hormonales qui modifient la façon dont le cerveau régule la température du corps.',
    section1Body2: 'Une petite variation de la température corporelle peut alors être ressentie comme une chaleur soudaine. Le corps réagit en dilatant les vaisseaux sanguins de la peau, ce qui peut provoquer une sensation de chaleur, des rougeurs et parfois une transpiration importante.',
    highlight1Title: 'Chaque personne est différente',
    highlight1Text: 'Certaines femmes ressentent quelques épisodes par semaine, tandis que d’autres peuvent en avoir plusieurs par jour. L’intensité et la durée peuvent également varier.',
    section2Body1: 'Lorsqu’elles surviennent pendant le sommeil, les bouffées de chaleur peuvent provoquer des sueurs nocturnes. Elles peuvent entraîner plusieurs réveils et rendre le sommeil moins réparateur.',
    section2Body2: 'Le manque de sommeil peut ensuite accentuer la fatigue, les difficultés de concentration et l’irritabilité pendant la journée. Il peut donc être utile de prendre en compte la qualité du sommeil lorsque tu évalues l’impact des symptômes.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Un pyjama en matière respirante, un linge de lit léger et une chambre suffisamment fraîche peuvent aider à limiter l’inconfort pendant la nuit.',
    section3Body1: 'Certains facteurs peuvent déclencher ou accentuer une bouffée de chaleur. Ils ne provoquent pas forcément de symptômes chez tout le monde, mais les identifier peut aider à mieux comprendre ton propre fonctionnement.',
    triggers: [
      'La caféine et l’alcool',
      'Les plats épicés',
      'Le stress et les émotions fortes',
      'Une pièce surchauffée ou des vêtements trop couvrants',
    ],
    tip2Title: 'Petit réflexe utile',
    tip2Text: 'Pendant quelques semaines, note le moment où surviennent les bouffées, leur intensité et ce qui s’est passé juste avant. Cela peut t’aider à repérer des déclencheurs personnels.',
    dailyHabits: [
      'S’habiller en plusieurs couches légères',
      'Garder un espace frais et bien aéré',
      'Pratiquer une respiration lente en cas de bouffée',
      'Boire de l’eau fraîche régulièrement',
    ],
    section4Body1: 'Ces mesures ne font pas disparaître systématiquement les bouffées, mais elles peuvent rendre les épisodes plus faciles à gérer et diminuer l’inconfort lorsqu’ils surviennent.',
    section5Body1: 'Les bouffées de chaleur sont fréquentes pendant la périménopause et la ménopause. Cependant, tu n’as pas besoin de simplement les supporter si elles deviennent difficiles à vivre. Un médecin ou une sage-femme peut évaluer tes symptômes et discuter avec toi des différentes possibilités.',
    whenAppointmentTitle: 'Quand prendre rendez-vous ?',
    section5Body2: 'Une consultation peut être particulièrement utile lorsque les symptômes ont un impact important sur ton quotidien ou lorsque tu souhaites connaître les options disponibles.',
    consultReasons: [
      {
        title: 'Quand le sommeil est perturbé',
        text: 'Des bouffées ou des sueurs nocturnes fréquentes qui provoquent des réveils répétés, une fatigue importante ou des difficultés à fonctionner normalement dans la journée.',
      },
      {
        title: 'Quand le quotidien devient difficile',
        text: 'Si les bouffées de chaleur gênent ton travail, tes activités, tes déplacements, tes relations sociales ou simplement ton confort au quotidien.',
      },
      {
        title: 'Quand les symptômes deviennent plus fréquents',
        text: 'Une augmentation nette de la fréquence ou de l’intensité des symptômes mérite d’être discutée afin de rechercher les solutions les plus adaptées.',
      },
      {
        title: 'Si tu souhaites un traitement',
        text: 'Des options hormonales et non hormonales peuvent être proposées selon la situation. Un professionnel peut t’aider à évaluer leurs bénéfices, leurs risques et leurs éventuelles contre-indications.',
      },
    ],
    notMenopauseTitle: 'Ne pas tout attribuer à la ménopause',
    notMenopauseBody: 'Une bouffée de chaleur peut avoir différentes causes. Certains symptômes peuvent également être liés à un médicament, à une autre condition médicale ou à un changement important dans ton état de santé. Si quelque chose te semble inhabituel, nouveau ou particulièrement intense, il est préférable d’en parler à un professionnel plutôt que de supposer automatiquement qu’il s’agit de la ménopause.',
    alertTitle: 'Consulter rapidement',
    alertText: 'Une douleur thoracique, un essoufflement soudain, un malaise, une faiblesse brutale ou un gonflement douloureux inhabituel d’une jambe nécessitent un avis médical rapide.',
    emergencySignsTitle: 'Quels signes doivent particulièrement attirer ton attention ?',
    emergencySigns: [
      'Une douleur thoracique inhabituelle ou importante',
      'Un essoufflement soudain ou une difficulté importante à respirer',
      'Un malaise ou une perte de connaissance',
      'Une faiblesse brutale, un trouble de la parole ou de la vision',
      'Un gonflement douloureux et inhabituel d’une jambe',
    ],
    solutionsTitle: 'Quelles solutions peuvent être proposées ?',
    solutionsBody: 'Si les bouffées de chaleur sont suffisamment gênantes pour nécessiter une prise en charge, plusieurs approches peuvent être envisagées. Selon ta situation, le professionnel peut discuter de mesures liées au mode de vie, de traitements non hormonaux ou, lorsque cela est approprié, d’un traitement hormonal.',
    highlight2Title: 'Un traitement se choisit au cas par cas',
    highlight2Text: 'L’âge, les symptômes, les antécédents médicaux, les traitements en cours et les préférences personnelles peuvent influencer les options proposées.',
    prepareTitle: 'Préparer ton rendez-vous',
    prepareBody: 'Arriver avec quelques informations peut rendre la consultation plus utile. Tu peux noter pendant quelques jours ou semaines la fréquence des épisodes, leur intensité et leur impact sur ton sommeil ou tes activités.',
    questionsTitle: 'Informations utiles à préparer',
    appointmentQuestions: [
      'À quelle fréquence les bouffées surviennent-elles ?',
      'Depuis combien de temps sont-elles présentes ?',
      'Surviennent-elles plutôt le jour, la nuit ou les deux ?',
      'Perturbent-elles ton sommeil ou tes activités ?',
      'As-tu identifié certains déclencheurs ?',
      'Prends-tu actuellement un traitement ou une contraception hormonale ?',
    ],
    professionalTipText: 'Il n’est pas nécessaire d’attendre que les symptômes deviennent très importants pour en parler. Une consultation peut aussi servir simplement à comprendre ce qui se passe et à connaître les solutions disponibles.',
    summaryTitle: 'L’essentiel',
    summaryItems: [
      'Les bouffées de chaleur sont fréquentes pendant la transition ménopausique.',
      'Identifier tes déclencheurs peut t’aider à mieux gérer les épisodes.',
      'Des habitudes simples peuvent réduire l’inconfort au quotidien.',
      'Si les symptômes perturbent ton sommeil ou ta vie quotidienne, parle-en à un professionnel.',
      'Plusieurs options de prise en charge peuvent être discutées selon ta situation.',
    ],
    finalTipText: 'Les bouffées de chaleur sont courantes, mais elles ne doivent pas être minimisées lorsqu’elles affectent ton sommeil, ton travail ou ton bien-être. Observer tes symptômes et en parler à un professionnel permet de mieux comprendre leur origine et d’explorer les solutions adaptées.',
    disclaimerText: 'Cet article a une vocation informative et ne remplace pas un avis médical personnalisé.',
    shareMessage: 'Apprivoiser les bouffées de chaleur — AWA',
  },
  en: {
    badge: 'HOT FLASHES',
    title: 'Taming\nhot flashes',
    metaDuration: '10 min read',
    metaType: 'Article',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Why they happen, how to identify your triggers, and what solutions may help when they become bothersome.',
    contentsTitle: 'In this article',
    topics: [
      'Why hot flashes happen',
      'Night sweats',
      'Common triggers',
      'Everyday habits that help',
      'When to talk to a professional',
      'Key takeaways',
    ],
    section1Body1: 'Hot flashes are very common during the transition to menopause. They’re linked in part to hormonal changes that affect how the brain regulates body temperature.',
    section1Body2: 'A small shift in body temperature can then feel like sudden heat. The body responds by dilating the blood vessels in the skin, which can cause a sensation of heat, flushing, and sometimes heavy sweating.',
    highlight1Title: 'Every person is different',
    highlight1Text: 'Some women experience a few episodes a week, while others may have several a day. Intensity and duration can also vary.',
    section2Body1: 'When they happen during sleep, hot flashes can cause night sweats. They can lead to repeated waking and make sleep less restful.',
    section2Body2: 'Lack of sleep can then increase fatigue, difficulty concentrating, and irritability during the day. It can therefore be helpful to factor sleep quality into how you assess the impact of your symptoms.',
    tip1Title: 'Good to know',
    tip1Text: 'Breathable pajamas, light bedding, and a sufficiently cool bedroom can help limit discomfort at night.',
    section3Body1: 'Certain factors can trigger or intensify a hot flash. They don’t necessarily cause symptoms in everyone, but identifying them can help you better understand your own patterns.',
    triggers: [
      'Caffeine and alcohol',
      'Spicy foods',
      'Stress and strong emotions',
      'An overheated room or clothing that’s too heavy',
    ],
    tip2Title: 'A helpful little habit',
    tip2Text: 'For a few weeks, note when your hot flashes happen, how intense they are, and what happened right before. This can help you spot your personal triggers.',
    dailyHabits: [
      'Dress in light layers',
      'Keep your space cool and well-ventilated',
      'Practice slow breathing during a hot flash',
      'Drink cool water regularly',
    ],
    section4Body1: 'These measures won’t necessarily make hot flashes disappear, but they can make episodes easier to manage and reduce discomfort when they occur.',
    section5Body1: 'Hot flashes are common during perimenopause and menopause. Still, you don’t have to simply put up with them if they become difficult to live with. A doctor or midwife can assess your symptoms and discuss the different options with you.',
    whenAppointmentTitle: 'When should you make an appointment?',
    section5Body2: 'A consultation can be especially helpful when symptoms have a significant impact on your daily life or when you’d like to know what options are available.',
    consultReasons: [
      {
        title: 'When sleep is disrupted',
        text: 'Frequent hot flashes or night sweats that cause repeated waking, significant fatigue, or difficulty functioning normally during the day.',
      },
      {
        title: 'When daily life becomes difficult',
        text: 'If hot flashes interfere with your work, activities, travel, social relationships, or simply your everyday comfort.',
      },
      {
        title: 'When symptoms become more frequent',
        text: 'A clear increase in the frequency or intensity of symptoms is worth discussing in order to find the most suitable solutions.',
      },
      {
        title: 'If you’re considering treatment',
        text: 'Hormonal and non-hormonal options may be offered depending on your situation. A professional can help you weigh their benefits, risks, and any possible contraindications.',
      },
    ],
    notMenopauseTitle: 'Don’t attribute everything to menopause',
    notMenopauseBody: 'A hot flash can have different causes. Some symptoms may also be related to a medication, another medical condition, or a significant change in your health. If something feels unusual, new, or especially intense, it’s best to talk to a professional rather than automatically assuming it’s menopause.',
    alertTitle: 'Seek care promptly',
    alertText: 'Chest pain, sudden shortness of breath, feeling faint, sudden weakness, or unusual painful swelling in one leg require prompt medical attention.',
    emergencySignsTitle: 'Which signs deserve special attention?',
    emergencySigns: [
      'Unusual or severe chest pain',
      'Sudden shortness of breath or significant difficulty breathing',
      'Feeling faint or losing consciousness',
      'Sudden weakness, or trouble speaking or seeing',
      'Painful, unusual swelling in one leg',
    ],
    solutionsTitle: 'What solutions may be available?',
    solutionsBody: 'If hot flashes are bothersome enough to need management, several approaches may be considered. Depending on your situation, the professional may discuss lifestyle measures, non-hormonal treatments, or, when appropriate, hormone therapy.',
    highlight2Title: 'Treatment is chosen case by case',
    highlight2Text: 'Age, symptoms, medical history, current treatments, and personal preferences can all influence the options offered.',
    prepareTitle: 'Preparing for your appointment',
    prepareBody: 'Arriving with a bit of information can make the consultation more useful. You can track, for a few days or weeks, how often episodes occur, how intense they are, and their impact on your sleep or activities.',
    questionsTitle: 'Helpful information to prepare',
    appointmentQuestions: [
      'How often do your hot flashes happen?',
      'How long have you been experiencing them?',
      'Do they tend to happen during the day, at night, or both?',
      'Do they disrupt your sleep or activities?',
      'Have you identified any triggers?',
      'Are you currently taking any medication or hormonal contraception?',
    ],
    professionalTipText: 'You don’t need to wait until symptoms become very severe before talking about them. A consultation can also simply help you understand what’s going on and learn about the solutions available.',
    summaryTitle: 'The essentials',
    summaryItems: [
      'Hot flashes are common during the menopause transition.',
      'Identifying your triggers can help you manage episodes better.',
      'Simple habits can reduce everyday discomfort.',
      'If symptoms disrupt your sleep or daily life, talk to a professional.',
      'Several management options may be discussed depending on your situation.',
    ],
    finalTipText: 'Hot flashes are common, but they shouldn’t be dismissed when they affect your sleep, work, or well-being. Paying attention to your symptoms and talking to a professional can help you better understand their cause and explore suitable solutions.',
    disclaimerText: 'This article is for informational purposes only and doesn’t replace personalized medical advice.',
    shareMessage: 'Taming hot flashes — AWA',
  },
  es: {
    badge: 'SOFOCOS',
    title: 'Domar los\nsofocos',
    metaDuration: '10 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Por qué ocurren, cómo identificar tus desencadenantes y qué soluciones pueden ayudar cuando se vuelven molestos.',
    contentsTitle: 'En este artículo',
    topics: [
      'Por qué ocurren los sofocos',
      'Los sudores nocturnos',
      'Los desencadenantes habituales',
      'Gestos que ayudan en el día a día',
      'Cuándo hablarlo con un profesional',
      'Para recordar',
    ],
    section1Body1: 'Los sofocos son muy frecuentes durante la transición hacia la menopausia. Están relacionados en particular con las variaciones hormonales que modifican la forma en que el cerebro regula la temperatura del cuerpo.',
    section1Body2: 'Una pequeña variación de la temperatura corporal puede entonces sentirse como un calor repentino. El cuerpo reacciona dilatando los vasos sanguíneos de la piel, lo que puede provocar una sensación de calor, enrojecimiento y a veces una transpiración importante.',
    highlight1Title: 'Cada persona es diferente',
    highlight1Text: 'Algunas mujeres sienten algunos episodios por semana, mientras que otras pueden tener varios al día. La intensidad y la duración también pueden variar.',
    section2Body1: 'Cuando ocurren durante el sueño, los sofocos pueden provocar sudores nocturnos. Pueden causar varios despertares y hacer que el sueño sea menos reparador.',
    section2Body2: 'La falta de sueño puede entonces acentuar la fatiga, las dificultades de concentración y la irritabilidad durante el día. Por eso puede ser útil tener en cuenta la calidad del sueño cuando evalúas el impacto de los síntomas.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Un pijama de material transpirable, ropa de cama ligera y una habitación suficientemente fresca pueden ayudar a limitar la incomodidad durante la noche.',
    section3Body1: 'Ciertos factores pueden desencadenar o acentuar un sofoco. No provocan necesariamente síntomas en todo el mundo, pero identificarlos puede ayudarte a entender mejor tu propio funcionamiento.',
    triggers: [
      'La cafeína y el alcohol',
      'Los platos picantes',
      'El estrés y las emociones fuertes',
      'Una habitación recalentada o ropa demasiado abrigada',
    ],
    tip2Title: 'Un pequeño hábito útil',
    tip2Text: 'Durante algunas semanas, anota el momento en que ocurren los sofocos, su intensidad y lo que pasó justo antes. Esto puede ayudarte a detectar desencadenantes personales.',
    dailyHabits: [
      'Vestirte con varias capas ligeras',
      'Mantener un espacio fresco y bien ventilado',
      'Practicar una respiración lenta en caso de sofoco',
      'Beber agua fresca con regularidad',
    ],
    section4Body1: 'Estas medidas no eliminan sistemáticamente los sofocos, pero pueden hacer que los episodios sean más fáciles de gestionar y disminuir la incomodidad cuando ocurren.',
    section5Body1: 'Los sofocos son frecuentes durante la perimenopausia y la menopausia. Sin embargo, no tienes que limitarte a soportarlos si se vuelven difíciles de vivir. Un médico o una matrona puede evaluar tus síntomas y hablar contigo de las diferentes posibilidades.',
    whenAppointmentTitle: '¿Cuándo pedir cita?',
    section5Body2: 'Una consulta puede ser especialmente útil cuando los síntomas tienen un impacto importante en tu día a día o cuando quieres conocer las opciones disponibles.',
    consultReasons: [
      {
        title: 'Cuando el sueño se ve alterado',
        text: 'Sofocos o sudores nocturnos frecuentes que provocan despertares repetidos, una fatiga importante o dificultades para funcionar con normalidad durante el día.',
      },
      {
        title: 'Cuando el día a día se vuelve difícil',
        text: 'Si los sofocos dificultan tu trabajo, tus actividades, tus desplazamientos, tus relaciones sociales o simplemente tu comodidad en el día a día.',
      },
      {
        title: 'Cuando los síntomas se vuelven más frecuentes',
        text: 'Un aumento claro de la frecuencia o de la intensidad de los síntomas merece ser comentado para buscar las soluciones más adecuadas.',
      },
      {
        title: 'Si deseas un tratamiento',
        text: 'Se pueden proponer opciones hormonales y no hormonales según la situación. Un profesional puede ayudarte a evaluar sus beneficios, sus riesgos y sus posibles contraindicaciones.',
      },
    ],
    notMenopauseTitle: 'No atribuirlo todo a la menopausia',
    notMenopauseBody: 'Un sofoco puede tener diferentes causas. Algunos síntomas también pueden estar relacionados con un medicamento, con otra afección médica o con un cambio importante en tu estado de salud. Si algo te parece inusual, nuevo o especialmente intenso, es preferible hablarlo con un profesional en lugar de suponer automáticamente que se trata de la menopausia.',
    alertTitle: 'Consultar rápidamente',
    alertText: 'Un dolor en el pecho, una falta de aire repentina, un desmayo, una debilidad brusca o una hinchazón dolorosa e inusual en una pierna requieren un aviso médico rápido.',
    emergencySignsTitle: '¿Qué señales deben llamar especialmente tu atención?',
    emergencySigns: [
      'Un dolor en el pecho inusual o importante',
      'Una falta de aire repentina o una dificultad importante para respirar',
      'Un desmayo o una pérdida de conocimiento',
      'Una debilidad brusca, un trastorno del habla o de la vista',
      'Una hinchazón dolorosa e inusual en una pierna',
    ],
    solutionsTitle: '¿Qué soluciones se pueden proponer?',
    solutionsBody: 'Si los sofocos son lo bastante molestos como para necesitar atención, se pueden considerar varios enfoques. Según tu situación, el profesional puede hablar de medidas relacionadas con el estilo de vida, de tratamientos no hormonales o, cuando sea apropiado, de un tratamiento hormonal.',
    highlight2Title: 'Un tratamiento se elige caso por caso',
    highlight2Text: 'La edad, los síntomas, los antecedentes médicos, los tratamientos en curso y las preferencias personales pueden influir en las opciones propuestas.',
    prepareTitle: 'Preparar tu cita',
    prepareBody: 'Llegar con algo de información puede hacer que la consulta sea más útil. Puedes anotar durante algunos días o semanas la frecuencia de los episodios, su intensidad y su impacto en tu sueño o tus actividades.',
    questionsTitle: 'Información útil para preparar',
    appointmentQuestions: [
      '¿Con qué frecuencia ocurren los sofocos?',
      '¿Desde cuándo están presentes?',
      '¿Ocurren más bien de día, de noche o ambos?',
      '¿Alteran tu sueño o tus actividades?',
      '¿Has identificado algunos desencadenantes?',
      '¿Tomas actualmente algún tratamiento o anticoncepción hormonal?',
    ],
    professionalTipText: 'No es necesario esperar a que los síntomas sean muy importantes para hablar de ellos. Una consulta también puede servir simplemente para entender lo que está pasando y conocer las soluciones disponibles.',
    summaryTitle: 'Lo esencial',
    summaryItems: [
      'Los sofocos son frecuentes durante la transición menopáusica.',
      'Identificar tus desencadenantes puede ayudarte a gestionar mejor los episodios.',
      'Algunos hábitos sencillos pueden reducir la incomodidad en el día a día.',
      'Si los síntomas alteran tu sueño o tu vida diaria, háblalo con un profesional.',
      'Se pueden comentar varias opciones de atención según tu situación.',
    ],
    finalTipText: 'Los sofocos son habituales, pero no deben minimizarse cuando afectan a tu sueño, tu trabajo o tu bienestar. Observar tus síntomas y hablarlo con un profesional permite entender mejor su origen y explorar las soluciones adecuadas.',
    disclaimerText: 'Este artículo tiene una vocación informativa y no sustituye un asesoramiento médico personalizado.',
    shareMessage: 'Domar los sofocos — AWA',
  },
  it: {
    badge: 'VAMPATE DI CALORE',
    title: 'Domare\nle vampate di calore',
    metaDuration: '10 min di lettura',
    metaType: 'Articolo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Perché si manifestano, come individuare i tuoi fattori scatenanti e quali soluzioni possono aiutare quando diventano fastidiose.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Perché compaiono le vampate di calore',
      'Sudorazioni notturne',
      'Fattori scatenanti comuni',
      'Abitudini quotidiane utili',
      'Quando parlarne con un professionista',
      'I punti chiave',
    ],
    section1Body1: 'Le vampate di calore sono molto comuni durante la transizione verso la menopausa. Sono legate in parte ai cambiamenti ormonali che influenzano il modo in cui il cervello regola la temperatura corporea.',
    section1Body2: 'Una piccola variazione della temperatura corporea può quindi essere percepita come un caldo improvviso. Il corpo risponde dilatando i vasi sanguigni della pelle, il che può causare una sensazione di calore, arrossamento e, a volte, sudorazione abbondante.',
    highlight1Title: 'Ogni donna è diversa',
    highlight1Text: 'Alcune donne hanno qualche episodio a settimana, mentre altre possono averne diversi al giorno. Anche l’intensità e la durata possono variare.',
    section2Body1: 'Quando si verificano durante il sonno, le vampate di calore possono causare sudorazioni notturne. Possono portare a risvegli ripetuti e rendere il sonno meno ristoratore.',
    section2Body2: 'La mancanza di sonno può poi aumentare la stanchezza, la difficoltà di concentrazione e l’irritabilità durante il giorno. Può quindi essere utile tenere conto della qualità del sonno quando valuti l’impatto dei tuoi sintomi.',
    tip1Title: 'Da sapere',
    tip1Text: 'Un pigiama traspirante, una biancheria da letto leggera e una camera da letto sufficientemente fresca possono aiutare a limitare il fastidio notturno.',
    section3Body1: 'Alcuni fattori possono scatenare o intensificare una vampata di calore. Non provocano necessariamente sintomi in tutte, ma individuarli può aiutarti a comprendere meglio il tuo modo di reagire.',
    triggers: [
      'Caffeina e alcol',
      'Cibi piccanti',
      'Stress ed emozioni forti',
      'Una stanza surriscaldata o abiti troppo pesanti',
    ],
    tip2Title: 'Una piccola abitudine utile',
    tip2Text: 'Per qualche settimana, annota quando compaiono le vampate di calore, quanto sono intense e che cosa è successo subito prima. Può aiutarti a individuare i tuoi fattori scatenanti personali.',
    dailyHabits: [
      'Vestirsi a strati leggeri',
      'Mantenere l’ambiente fresco e ben ventilato',
      'Praticare una respirazione lenta durante una vampata',
      'Bere acqua fresca con regolarità',
    ],
    section4Body1: 'Queste misure non faranno necessariamente scomparire le vampate di calore, ma possono rendere gli episodi più facili da gestire e ridurre il disagio quando si presentano.',
    section5Body1: 'Le vampate di calore sono comuni durante la perimenopausa e la menopausa. Tuttavia, non devi per forza sopportarle in silenzio se diventano difficili da vivere. Un medico o un’ostetrica può valutare i tuoi sintomi e discutere con te le diverse opzioni.',
    whenAppointmentTitle: 'Quando è il caso di prendere un appuntamento?',
    section5Body2: 'Una visita può essere particolarmente utile quando i sintomi hanno un impatto significativo sulla vita quotidiana o quando vorresti sapere quali opzioni sono disponibili.',
    consultReasons: [
      {
        title: 'Quando il sonno è disturbato',
        text: 'Vampate di calore o sudorazioni notturne frequenti che causano risvegli ripetuti, forte stanchezza o difficoltà a svolgere normalmente le attività durante il giorno.',
      },
      {
        title: 'Quando la vita quotidiana diventa difficile',
        text: 'Se le vampate di calore interferiscono con il lavoro, le attività, i viaggi, le relazioni sociali o semplicemente con il tuo benessere di ogni giorno.',
      },
      {
        title: 'Quando i sintomi diventano più frequenti',
        text: 'Un chiaro aumento della frequenza o dell’intensità dei sintomi merita di essere discusso per trovare le soluzioni più adatte.',
      },
      {
        title: 'Se stai valutando un trattamento',
        text: 'Possono essere proposte opzioni ormonali e non ormonali a seconda della tua situazione. Un professionista può aiutarti a valutarne benefici, rischi ed eventuali controindicazioni.',
      },
    ],
    notMenopauseTitle: 'Non attribuire tutto alla menopausa',
    notMenopauseBody: 'Una vampata di calore può avere cause diverse. Alcuni sintomi possono anche essere legati a un farmaco, a un’altra condizione medica o a un cambiamento importante del tuo stato di salute. Se qualcosa ti sembra insolito, nuovo o particolarmente intenso, è meglio parlarne con un professionista piuttosto che pensare automaticamente alla menopausa.',
    alertTitle: 'Rivolgiti subito a un medico',
    alertText: 'Dolore al petto, mancanza di respiro improvvisa, sensazione di svenimento, debolezza improvvisa o gonfiore doloroso insolito a una gamba richiedono un’attenzione medica immediata.',
    emergencySignsTitle: 'Quali segnali meritano particolare attenzione?',
    emergencySigns: [
      'Dolore al petto insolito o intenso',
      'Mancanza di respiro improvvisa o notevole difficoltà a respirare',
      'Sensazione di svenimento o perdita di coscienza',
      'Debolezza improvvisa, oppure difficoltà a parlare o a vedere',
      'Gonfiore doloroso e insolito a una gamba',
    ],
    solutionsTitle: 'Quali soluzioni possono essere disponibili?',
    solutionsBody: 'Se le vampate di calore sono abbastanza fastidiose da richiedere una gestione, possono essere prese in considerazione diversi approcci. A seconda della tua situazione, il professionista può discutere misure legate allo stile di vita, trattamenti non ormonali o, quando appropriato, la terapia ormonale.',
    highlight2Title: 'Il trattamento si sceglie caso per caso',
    highlight2Text: 'L’età, i sintomi, la storia clinica, le terapie in corso e le preferenze personali possono influenzare le opzioni proposte.',
    prepareTitle: 'Prepararti all’appuntamento',
    prepareBody: 'Arrivare con qualche informazione può rendere la visita più utile. Per qualche giorno o settimana puoi annotare con quale frequenza si presentano gli episodi, quanto sono intensi e il loro impatto sul sonno o sulle attività.',
    questionsTitle: 'Informazioni utili da preparare',
    appointmentQuestions: [
      'Con quale frequenza hai le vampate di calore?',
      'Da quanto tempo le hai?',
      'Tendono a comparire di giorno, di notte o in entrambi i momenti?',
      'Disturbano il tuo sonno o le tue attività?',
      'Hai individuato dei fattori scatenanti?',
      'Stai attualmente assumendo farmaci o una contraccezione ormonale?',
    ],
    professionalTipText: 'Non occorre aspettare che i sintomi diventino molto intensi per parlarne. Una visita può anche semplicemente aiutarti a capire che cosa sta succedendo e a conoscere le soluzioni disponibili.',
    summaryTitle: 'L’essenziale',
    summaryItems: [
      'Le vampate di calore sono comuni durante la transizione verso la menopausa.',
      'Individuare i tuoi fattori scatenanti può aiutarti a gestire meglio gli episodi.',
      'Abitudini semplici possono ridurre il disagio di ogni giorno.',
      'Se i sintomi disturbano il sonno o la vita quotidiana, parlane con un professionista.',
      'Si possono discutere diverse opzioni di gestione a seconda della tua situazione.',
    ],
    finalTipText: 'Le vampate di calore sono comuni, ma non vanno trascurate quando influiscono sul sonno, sul lavoro o sul benessere. Prestare attenzione ai sintomi e parlarne con un professionista può aiutarti a comprenderne meglio la causa e a valutare soluzioni adatte.',
    disclaimerText: 'Questo articolo ha uno scopo puramente informativo e non sostituisce un parere medico personalizzato.',
    shareMessage: 'Domare le vampate di calore — AWA',
  },
  tr: {
    badge: 'SICAK BASMALARI',
    title: 'Sıcak basmalarıyla\nbaşa çıkmak',
    metaDuration: '10 dk okuma',
    metaType: 'Makale',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Neden olurlar, tetikleyicilerini nasıl fark edersin ve rahatsız edici hale geldiklerinde hangi çözümler yardımcı olabilir.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Sıcak basmaları neden olur',
      'Gece terlemeleri',
      'Sık görülen tetikleyiciler',
      'Işe yarayan günlük alışkanlıklar',
      'Ne zaman bir uzmana danışmalı',
      'Öne çıkanlar',
    ],
    section1Body1: 'Sıcak basmaları menopoza geçiş döneminde çok yaygındır. Kısmen, beynin vücut sıcaklığını düzenleme biçimini etkileyen hormonal değişikliklerle ilişkilidir.',
    section1Body2: 'Vücut sıcaklığındaki küçük bir kayma, o zaman ani bir sıcaklık hissi olarak algılanabilir. Vücut buna, deri damarlarını genişleterek yanıt verir; bu da sıcaklık hissine, kızarmaya ve bazen yoğun terlemeye yol açabilir.',
    highlight1Title: 'Herkes farklıdır',
    highlight1Text: 'Bazı kadınlar haftada birkaç kez sıcak basması yaşarken, bazıları günde birkaç kez yaşayabilir. Şiddeti ve süresi de değişebilir.',
    section2Body1: 'Uyku sırasında ortaya çıktıklarında sıcak basmaları gece terlemelerine neden olabilir. Tekrar tekrar uyanmana yol açabilir ve uykunu daha az dinlendirici hale getirebilir.',
    section2Body2: 'Uykusuzluk ise gün boyunca yorgunluğu, odaklanma güçlüğünü ve sinirliliği artırabilir. Bu nedenle belirtilerinin etkisini değerlendirirken uyku kalitesini de hesaba katmak yararlı olabilir.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Nefes alan pijamalar, hafif yatak örtüleri ve yeterince serin bir yatak odası geceleri rahatsızlığı sınırlamaya yardımcı olabilir.',
    section3Body1: 'Bazı etkenler sıcak basmasını tetikleyebilir ya da şiddetlendirebilir. Herkeste mutlaka belirti yapmazlar, ancak bunları fark etmek kendi örüntülerini daha iyi anlamana yardımcı olabilir.',
    triggers: [
      'Kafein ve alkol',
      'Baharatlı yiyecekler',
      'Stres ve güçlü duygular',
      'Aşırı ısınmış bir oda ya da fazla kalın giysiler',
    ],
    tip2Title: 'Yararlı küçük bir alışkanlık',
    tip2Text: 'Birkaç hafta boyunca sıcak basmalarının ne zaman olduğunu, ne kadar şiddetli geçtiğini ve hemen öncesinde neler yaşandığını not et. Bu, kendi tetikleyicilerini fark etmene yardımcı olabilir.',
    dailyHabits: [
      'Hafif katmanlar halinde giyin',
      'Bulunduğun ortamı serin ve iyi havalandırılmış tut',
      'Sıcak basması sırasında yavaş nefes al',
      'Düzenli olarak serin su iç',
    ],
    section4Body1: 'Bu önlemler sıcak basmalarını mutlaka ortadan kaldırmaz, ancak atakları daha yönetilebilir hale getirebilir ve yaşandıklarında rahatsızlığı azaltabilir.',
    section5Body1: 'Sıcak basmaları perimenopoz ve menopoz döneminde yaygındır. Yine de yaşamayı zorlaştırdıklarında sadece katlanmak zorunda değilsin. Bir doktor ya da ebe belirtilerini değerlendirebilir ve seçenekleri seninle birlikte konuşabilir.',
    whenAppointmentTitle: 'Ne zaman randevu almalısın?',
    section5Body2: 'Belirtiler günlük hayatını belirgin biçimde etkilediğinde ya da hangi seçeneklerin olduğunu öğrenmek istediğinde bir muayene özellikle yararlı olabilir.',
    consultReasons: [
      {
        title: 'Uykun bozulduğunda',
        text: 'Sık sıcak basmaları ya da gece terlemeleri tekrar tekrar uyanmana, belirgin yorgunluğa veya gün içinde normal şekilde işlevini sürdürmekte güçlüğe yol açıyorsa.',
      },
      {
        title: 'Günlük hayat zorlaştığında',
        text: 'Sıcak basmaları işini, etkinliklerini, seyahatlerini, sosyal ilişkilerini ya da sadece gündelik rahatını etkiliyorsa.',
      },
      {
        title: 'Belirtiler sıklaştığında',
        text: 'Belirtilerin sıklığında ya da şiddetinde belirgin bir artış olması, en uygun çözümleri bulmak için konuşmaya değer.',
      },
      {
        title: 'Tedaviyi düşünüyorsan',
        text: 'Durumuna göre hormonal ve hormonal olmayan seçenekler sunulabilir. Bir uzman, bunların yararlarını, risklerini ve olası kontrendikasyonlarını değerlendirmene yardımcı olabilir.',
      },
    ],
    notMenopauseTitle: 'Her şeyi menopoza bağlama',
    notMenopauseBody: 'Sıcak basmasının farklı nedenleri olabilir. Bazı belirtiler bir ilaçla, başka bir sağlık durumuyla ya da sağlığındaki önemli bir değişiklikle de ilişkili olabilir. Alışılmadık, yeni ya da özellikle yoğun bir şey hissediyorsan, otomatik olarak menopoz olduğunu varsaymak yerine bir uzmanla konuşmak en doğrusudur.',
    alertTitle: 'Hemen sağlık hizmetine başvur',
    alertText: 'Göğüs ağrısı, ani nefes darlığı, bayılacak gibi hissetme, ani halsizlik ya da bir bacakta alışılmadık ağrılı şişlik hızlı tıbbi müdahale gerektirir.',
    emergencySignsTitle: 'Hangi belirtilere özellikle dikkat etmelisin?',
    emergencySigns: [
      'Alışılmadık veya şiddetli göğüs ağrısı',
      'Ani nefes darlığı ya da belirgin nefes alma güçlüğü',
      'Bayılacak gibi hissetme ya da bilincini kaybetme',
      'Ani halsizlik veya konuşma ya da görme güçlüğü',
      'Bir bacakta ağrılı, alışılmadık şişlik',
    ],
    solutionsTitle: 'Hangi çözümler mevcut olabilir?',
    solutionsBody: 'Sıcak basmaları yönetim gerektirecek kadar rahatsız ediciyse birkaç yaklaşım düşünülebilir. Durumuna göre uzman; yaşam tarzı önlemlerini, hormonal olmayan tedavileri ya da uygun olduğunda hormon tedavisini konuşabilir.',
    highlight2Title: 'Tedavi kişiye göre seçilir',
    highlight2Text: 'Yaş, belirtiler, tıbbi geçmiş, kullanılan tedaviler ve kişisel tercihlerin hepsi sunulan seçenekleri etkileyebilir.',
    prepareTitle: 'Randevuna hazırlanmak',
    prepareBody: 'Randevuya biraz bilgiyle gitmek muayeneyi daha yararlı hale getirebilir. Birkaç gün ya da hafta boyunca atakların ne sıklıkta olduğunu, ne kadar şiddetli geçtiğini ve uykunu ya da etkinliklerini nasıl etkilediğini takip edebilirsin.',
    questionsTitle: 'Hazırlanmak için yararlı bilgiler',
    appointmentQuestions: [
      'Sıcak basmaların ne sıklıkta oluyor?',
      'Ne zamandır yaşıyorsun?',
      'Gündüz mü, gece mi, yoksa her ikisinde de mi oluyor?',
      'Uykunu ya da etkinliklerini bölüyor mu?',
      'Herhangi bir tetikleyici fark ettin mi?',
      'Şu anda herhangi bir ilaç ya da hormonal doğum kontrolü kullanıyor musun?',
    ],
    professionalTipText: 'Bir uzmanla konuşmak için belirtilerin çok şiddetlenmesini beklemene gerek yok. Bir muayene, sadece neler olduğunu anlamana ve mevcut çözümleri öğrenmene de yardımcı olabilir.',
    summaryTitle: 'Özetle',
    summaryItems: [
      'Sıcak basmaları menopoza geçiş döneminde yaygındır.',
      'Tetikleyicilerini fark etmek, atakları daha iyi yönetmene yardımcı olabilir.',
      'Basit alışkanlıklar günlük rahatsızlığı azaltabilir.',
      'Belirtiler uykunu ya da günlük hayatını bozuyorsa bir uzmanla konuş.',
      'Durumuna göre birkaç yönetim seçeneği konuşulabilir.',
    ],
    finalTipText: 'Sıcak basmaları yaygındır, ancak uykunu, işini ya da iyi oluşunu etkilediklerinde göz ardı edilmemelidir. Belirtilerine dikkat etmek ve bir uzmanla konuşmak, nedenini daha iyi anlamana ve uygun çözümleri araştırmana yardımcı olabilir.',
    disclaimerText: 'Bu makale yalnızca bilgilendirme amaçlıdır ve kişiye özel tıbbi tavsiyenin yerini tutmaz.',
    shareMessage: 'Sıcak basmalarıyla başa çıkmak — AWA',
  },
  ru: {
    badge: 'ПРИЛИВЫ',
    title: 'Как справляться\nс приливами',
    metaDuration: '10 мин чтения',
    metaType: 'Статья',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Почему они возникают, как определить свои провоцирующие факторы и какие решения могут помочь, когда приливы становятся мучительными.',
    contentsTitle: 'В этой статье',
    topics: [
      'Почему возникают приливы',
      'Ночная потливость',
      'Частые провоцирующие факторы',
      'Повседневные привычки, которые помогают',
      'Когда стоит обратиться к специалисту',
      'Главное',
    ],
    section1Body1: 'Приливы очень распространены в период перехода к менопаузе. Они связаны в том числе с гормональными изменениями, которые влияют на то, как мозг регулирует температуру тела.',
    section1Body2: 'Небольшое изменение температуры тела тогда может ощущаться как внезапный жар. Организм отвечает расширением кровеносных сосудов кожи, из-за чего возможны ощущение жара, покраснение и иногда обильное потоотделение.',
    highlight1Title: 'Все женщины разные',
    highlight1Text: 'Одни женщины отмечают несколько эпизодов в неделю, а другие — несколько в день. Интенсивность и продолжительность тоже могут быть разными.',
    section2Body1: 'Когда приливы случаются во сне, они могут вызывать ночную потливость. Из-за них можно несколько раз просыпаться, а сон становится менее восстанавливающим.',
    section2Body2: 'Недосып, в свою очередь, может усиливать усталость, затруднять концентрацию и повышать раздражительность в течение дня. Поэтому при оценке того, как симптомы влияют на вашу жизнь, полезно учитывать качество сна.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Дышащая пижама, лёгкое постельное бельё и достаточно прохладная спальня могут помочь уменьшить дискомфорт ночью.',
    section3Body1: 'Некоторые факторы могут вызывать или усиливать прилив. Не у всех они обязательно вызывают симптомы, но их выявление поможет лучше понять особенности вашего организма.',
    triggers: [
      'Кофеин и алкоголь',
      'Острая пища',
      'Стресс и сильные эмоции',
      'Слишком жаркое помещение или слишком плотная одежда',
    ],
    tip2Title: 'Небольшая полезная привычка',
    tip2Text: 'В течение нескольких недель отмечайте, когда случаются приливы, насколько они интенсивны и что происходило непосредственно перед ними. Это поможет выявить ваши личные провоцирующие факторы.',
    dailyHabits: [
      'Одеваться в несколько лёгких слоёв',
      'Поддерживать в помещении прохладу и свежий воздух',
      'Дышать медленно и глубоко во время прилива',
      'Регулярно пить прохладную воду',
    ],
    section4Body1: 'Эти меры не обязательно избавят вас от приливов, но могут сделать эпизоды более переносимыми и уменьшить дискомфорт, когда они случаются.',
    section5Body1: 'Приливы часто бывают в перименопаузе и менопаузе. Однако, если они становятся трудно переносимыми, вам не нужно просто терпеть. Врач или акушерка может оценить ваши симптомы и обсудить с вами разные возможности.',
    whenAppointmentTitle: 'Когда стоит записаться на приём?',
    section5Body2: 'Консультация может быть особенно полезна, когда симптомы заметно влияют на вашу повседневную жизнь или когда вы хотите узнать, какие есть варианты.',
    consultReasons: [
      {
        title: 'Когда нарушен сон',
        text: 'Частые приливы или ночная потливость, из-за которых вы несколько раз просыпаетесь, сильно устаёте или с трудом справляетесь с обычными делами днём.',
      },
      {
        title: 'Когда повседневная жизнь становится трудной',
        text: 'Если приливы мешают работе, занятиям, поездкам, общению или просто вашему повседневному комфорту.',
      },
      {
        title: 'Когда симптомы становятся чаще',
        text: 'Заметное увеличение частоты или интенсивности симптомов стоит обсудить, чтобы подобрать наиболее подходящие решения.',
      },
      {
        title: 'Если вы рассматриваете лечение',
        text: 'В зависимости от ситуации могут быть предложены гормональные и негормональные варианты. Специалист поможет оценить их пользу, риски и возможные противопоказания.',
      },
    ],
    notMenopauseTitle: 'Не стоит всё списывать на менопаузу',
    notMenopauseBody: 'У приливов могут быть разные причины. Некоторые симптомы могут быть связаны с приёмом лекарства, с другим заболеванием или с существенным изменением состояния здоровья. Если что-то кажется вам необычным, новым или особенно сильным, лучше обсудить это со специалистом, а не автоматически считать, что дело в менопаузе.',
    alertTitle: 'Срочно обратитесь к врачу',
    alertText: 'Боль в груди, внезапная одышка, обморочное состояние, внезапная слабость или необычная болезненная отёчность одной ноги требуют срочной медицинской помощи.',
    emergencySignsTitle: 'На какие признаки стоит обратить особое внимание?',
    emergencySigns: [
      'Необычная или сильная боль в груди',
      'Внезапная одышка или выраженное затруднение дыхания',
      'Обморочное состояние или потеря сознания',
      'Внезапная слабость, нарушение речи или зрения',
      'Болезненная необычная отёчность одной ноги',
    ],
    solutionsTitle: 'Какие решения могут быть предложены?',
    solutionsBody: 'Если приливы настолько беспокоят, что требуется помощь, можно рассмотреть несколько подходов. В зависимости от вашей ситуации специалист может обсудить меры, связанные с образом жизни, негормональные методы лечения или, когда это уместно, гормональную терапию.',
    highlight2Title: 'Лечение подбирается индивидуально',
    highlight2Text: 'На предлагаемые варианты могут влиять возраст, симптомы, история болезней, текущее лечение и личные предпочтения.',
    prepareTitle: 'Подготовка к приёму',
    prepareBody: 'Если прийти с небольшой подготовкой, консультация может оказаться полезнее. В течение нескольких дней или недель вы можете записывать, как часто случаются эпизоды, насколько они интенсивны и как влияют на сон и занятия.',
    questionsTitle: 'Что полезно подготовить',
    appointmentQuestions: [
      'Как часто случаются приливы?',
      'Как давно они у вас?',
      'Они чаще бывают днём, ночью или и днём, и ночью?',
      'Нарушают ли они ваш сон или занятия?',
      'Удалось ли вам выявить какие-то провоцирующие факторы?',
      'Принимаете ли вы сейчас какие-либо лекарства или гормональную контрацепцию?',
    ],
    professionalTipText: 'Не нужно ждать, пока симптомы станут очень сильными, чтобы обсудить их. Консультация может просто помочь понять, что происходит, и узнать о доступных решениях.',
    summaryTitle: 'Главное',
    summaryItems: [
      'Приливы часто бывают в период перехода к менопаузе.',
      'Выявление провоцирующих факторов поможет лучше справляться с эпизодами.',
      'Простые привычки могут уменьшить повседневный дискомфорт.',
      'Если симптомы нарушают сон или повседневную жизнь, поговорите со специалистом.',
      'В зависимости от вашей ситуации можно обсудить несколько вариантов помощи.',
    ],
    finalTipText: 'Приливы — обычное явление, но не стоит недооценивать их, когда они влияют на сон, работу или самочувствие. Наблюдение за симптомами и разговор со специалистом помогут лучше понять их причину и найти подходящие решения.',
    disclaimerText: 'Эта статья носит информационный характер и не заменяет персональную медицинскую консультацию.',
    shareMessage: 'Как справляться с приливами — AWA',
  },
  de: {
    badge: 'HITZEWALLUNGEN',
    title: 'Hitzewallungen\nin den Griff bekommen',
    metaDuration: '10 Min. Lesezeit',
    metaType: 'Artikel',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Warum sie auftreten, wie du deine Auslöser erkennst und welche Lösungen helfen können, wenn sie lästig werden.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Warum Hitzewallungen auftreten',
      'Nächtliche Schweißausbrüche',
      'Häufige Auslöser',
      'Alltagsgewohnheiten, die helfen',
      'Wann du mit Fachpersonal sprechen solltest',
      'Das Wichtigste in Kürze',
    ],
    section1Body1: 'Hitzewallungen sind beim Übergang in die Menopause sehr häufig. Sie hängen zum Teil mit hormonellen Veränderungen zusammen, die beeinflussen, wie das Gehirn die Körpertemperatur regelt.',
    section1Body2: 'Eine kleine Verschiebung der Körpertemperatur kann sich dann wie plötzliche Hitze anfühlen. Der Körper reagiert darauf, indem sich die Blutgefäße in der Haut erweitern, was ein Hitzegefühl, Hautrötungen und manchmal starkes Schwitzen auslösen kann.',
    highlight1Title: 'Jede Frau ist anders',
    highlight1Text: 'Manche Frauen erleben nur wenige Episoden pro Woche, andere mehrere am Tag. Auch Intensität und Dauer können unterschiedlich sein.',
    section2Body1: 'Treten Hitzewallungen im Schlaf auf, können sie nächtliche Schweißausbrüche verursachen. Sie können dazu führen, dass du immer wieder aufwachst und weniger erholsam schläfst.',
    section2Body2: 'Schlafmangel kann dann tagsüber Müdigkeit, Konzentrationsschwierigkeiten und Gereiztheit verstärken. Deshalb kann es hilfreich sein, die Schlafqualität in die Einschätzung der Auswirkungen deiner Symptome einzubeziehen.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Atmungsaktive Schlafkleidung, leichte Bettwäsche und ein ausreichend kühles Schlafzimmer können helfen, nachts Beschwerden zu begrenzen.',
    section3Body1: 'Bestimmte Faktoren können eine Hitzewallung auslösen oder verstärken. Sie führen nicht zwangsläufig bei allen zu Beschwerden, aber sie zu erkennen kann dir helfen, deine eigenen Muster besser zu verstehen.',
    triggers: [
      'Koffein und Alkohol',
      'Scharfes Essen',
      'Stress und starke Gefühle',
      'Ein überheizter Raum oder zu warme Kleidung',
    ],
    tip2Title: 'Eine hilfreiche kleine Gewohnheit',
    tip2Text: 'Notiere dir einige Wochen lang, wann deine Hitzewallungen auftreten, wie stark sie sind und was unmittelbar davor passiert ist. So kannst du deine persönlichen Auslöser erkennen.',
    dailyHabits: [
      'Zieh dich in leichten Schichten an',
      'Halte deine Umgebung kühl und gut gelüftet',
      'Atme bei einer Hitzewallung langsam und ruhig',
      'Trink regelmäßig kühles Wasser',
    ],
    section4Body1: 'Diese Maßnahmen lassen Hitzewallungen nicht unbedingt verschwinden, aber sie können die Episoden besser handhabbar machen und die Beschwerden verringern, wenn sie auftreten.',
    section5Body1: 'Hitzewallungen sind in der Perimenopause und Menopause häufig. Du musst sie aber nicht einfach hinnehmen, wenn sie schwer zu ertragen werden. Eine Ärztin, ein Arzt oder eine Hebamme kann deine Symptome einschätzen und die verschiedenen Möglichkeiten mit dir besprechen.',
    whenAppointmentTitle: 'Wann solltest du einen Termin vereinbaren?',
    section5Body2: 'Eine Beratung kann besonders hilfreich sein, wenn die Symptome deinen Alltag deutlich beeinträchtigen oder wenn du wissen möchtest, welche Möglichkeiten es gibt.',
    consultReasons: [
      {
        title: 'Wenn dein Schlaf gestört ist',
        text: 'Häufige Hitzewallungen oder nächtliche Schweißausbrüche, die dazu führen, dass du immer wieder aufwachst, sehr müde bist oder tagsüber nur schwer normal zurechtkommst.',
      },
      {
        title: 'Wenn der Alltag schwierig wird',
        text: 'Wenn Hitzewallungen deine Arbeit, deine Aktivitäten, Reisen, soziale Kontakte oder einfach dein alltägliches Wohlbefinden beeinträchtigen.',
      },
      {
        title: 'Wenn die Symptome häufiger werden',
        text: 'Eine deutliche Zunahme der Häufigkeit oder Intensität der Symptome sollte besprochen werden, um die passendsten Lösungen zu finden.',
      },
      {
        title: 'Wenn du eine Behandlung in Erwägung ziehst',
        text: 'Je nach Situation können hormonelle und nicht hormonelle Möglichkeiten angeboten werden. Fachpersonal kann dir helfen, Nutzen, Risiken und mögliche Gegenanzeigen abzuwägen.',
      },
    ],
    notMenopauseTitle: 'Führe nicht alles auf die Menopause zurück',
    notMenopauseBody: 'Eine Hitzewallung kann verschiedene Ursachen haben. Manche Symptome können auch mit einem Medikament, einer anderen Erkrankung oder einer deutlichen Veränderung deiner Gesundheit zusammenhängen. Wenn sich etwas ungewöhnlich, neu oder besonders heftig anfühlt, sprich am besten mit Fachpersonal, statt automatisch von der Menopause auszugehen.',
    alertTitle: 'Zügig ärztliche Hilfe suchen',
    alertText: 'Brustschmerzen, plötzliche Atemnot, Ohnmachtsgefühl, plötzliche Schwäche oder eine ungewöhnliche, schmerzhafte Schwellung in einem Bein erfordern umgehend ärztliche Hilfe.',
    emergencySignsTitle: 'Welche Anzeichen verdienen besondere Aufmerksamkeit?',
    emergencySigns: [
      'Ungewöhnliche oder starke Brustschmerzen',
      'Plötzliche Atemnot oder deutliche Schwierigkeiten beim Atmen',
      'Ohnmachtsgefühl oder Bewusstseinsverlust',
      'Plötzliche Schwäche oder Schwierigkeiten beim Sprechen oder Sehen',
      'Schmerzhafte, ungewöhnliche Schwellung in einem Bein',
    ],
    solutionsTitle: 'Welche Lösungen kann es geben?',
    solutionsBody: 'Wenn Hitzewallungen so lästig sind, dass sie behandelt werden sollten, können mehrere Ansätze in Betracht kommen. Je nach Situation kann das Fachpersonal Maßnahmen zur Lebensweise, nicht hormonelle Behandlungen oder, wenn angebracht, eine Hormontherapie besprechen.',
    highlight2Title: 'Die Behandlung wird von Fall zu Fall gewählt',
    highlight2Text: 'Alter, Symptome, Krankengeschichte, aktuelle Behandlungen und persönliche Vorlieben können alle die angebotenen Möglichkeiten beeinflussen.',
    prepareTitle: 'Dich auf deinen Termin vorbereiten',
    prepareBody: 'Wenn du gut informiert zum Termin kommst, kann die Beratung hilfreicher sein. Du kannst einige Tage oder Wochen lang festhalten, wie oft die Episoden auftreten, wie stark sie sind und wie sie sich auf deinen Schlaf oder deine Aktivitäten auswirken.',
    questionsTitle: 'Hilfreiche Informationen zur Vorbereitung',
    appointmentQuestions: [
      'Wie oft treten deine Hitzewallungen auf?',
      'Seit wann hast du sie?',
      'Treten sie eher tagsüber, nachts oder beides auf?',
      'Stören sie deinen Schlaf oder deine Aktivitäten?',
      'Hast du Auslöser erkannt?',
      'Nimmst du derzeit Medikamente oder hormonelle Verhütungsmittel?',
    ],
    professionalTipText: 'Du musst nicht warten, bis die Symptome sehr stark werden, bevor du darüber sprichst. Eine Beratung kann dir auch einfach helfen, zu verstehen, was los ist, und die verfügbaren Lösungen kennenzulernen.',
    summaryTitle: 'Das Wesentliche',
    summaryItems: [
      'Hitzewallungen sind beim Übergang in die Menopause häufig.',
      'Deine Auslöser zu erkennen kann dir helfen, die Episoden besser zu bewältigen.',
      'Einfache Gewohnheiten können Beschwerden im Alltag verringern.',
      'Wenn die Symptome deinen Schlaf oder deinen Alltag stören, sprich mit Fachpersonal.',
      'Je nach Situation können mehrere Möglichkeiten der Behandlung besprochen werden.',
    ],
    finalTipText: 'Hitzewallungen sind häufig, sollten aber nicht abgetan werden, wenn sie deinen Schlaf, deine Arbeit oder dein Wohlbefinden beeinträchtigen. Wenn du auf deine Symptome achtest und mit Fachpersonal sprichst, kannst du ihre Ursache besser verstehen und passende Lösungen erkunden.',
    disclaimerText: 'Dieser Artikel dient nur der Information und ersetzt keine persönliche ärztliche Beratung.',
    shareMessage: 'Hitzewallungen in den Griff bekommen — AWA',
  },
  zh: {
      badge: '潮热',
      title: '从容应对\n潮热',
      metaDuration: '阅读约 10 分钟',
      metaType: '文章',
      metaLevel: '入门',
      metaValidated: '已审核内容',
      intro: '为什么会出现潮热，如何找出自己的诱因，以及在潮热困扰你时可能有帮助的办法。',
      contentsTitle: '本文内容',
      topics: [
        '为什么会出现潮热',
        '夜间盗汗',
        '常见诱因',
        '有帮助的日常习惯',
        '何时咨询专业人员',
        '要点回顾',
      ],
      section1Body1: '潮热在绝经过渡期非常常见。它在一定程度上与激素变化有关，这些变化会影响大脑对体温的调节。',
      section1Body2: '体温的细微变化会让人突然感到燥热。身体会通过扩张皮肤血管来应对，这可能带来发热、面部潮红，有时还会大量出汗。',
      highlight1Title: '每个人都不一样',
      highlight1Text: '有些女性每周只有几次发作，也有人一天会发作好几次。发作的强度和持续时间也各不相同。',
      section2Body1: '潮热发生在睡眠中时，会引起夜间盗汗。它可能让你反复醒来，睡得不够踏实。',
      section2Body2: '睡眠不足会进一步加重白天的疲倦、注意力不集中和易怒。因此，在评估症状的影响时，把睡眠质量也考虑进去会有帮助。',
      tip1Title: '小贴士',
      tip1Text: '透气的睡衣、轻薄的被褥和足够凉爽的卧室，有助于减轻夜间的不适。',
      section3Body1: '某些因素可能引发或加重潮热。它们不一定会让每个人都出现症状，但找出这些因素有助于你更好地了解自己的规律。',
      triggers: [
        '咖啡因和酒精',
        '辛辣食物',
        '压力和强烈的情绪',
        '过热的房间或过厚的衣物',
      ],
      tip2Title: '一个有益的小习惯',
      tip2Text: '连续几周记录潮热发生的时间、强烈程度，以及发作前发生了什么。这有助于你找出属于自己的诱因。',
      dailyHabits: [
        '穿轻薄的衣物，一层层叠穿',
        '保持居住环境凉爽通风',
        '潮热发作时练习缓慢呼吸',
        '经常喝凉水',
      ],
      section4Body1: '这些做法未必能让潮热消失，但可以让发作更容易应对，减轻发作时的不适。',
      section5Body1: '潮热在围绝经期和绝经期很常见。但如果它让你难以忍受，你也不必只是硬撑。医生或助产士可以评估你的症状，并与你讨论不同的选择。',
      whenAppointmentTitle: '什么时候该预约就诊？',
      section5Body2: '当症状对日常生活影响很大，或者你想了解有哪些选择时，咨询会特别有帮助。',
      consultReasons: [
        {
          title: '睡眠受到干扰时',
          text: '频繁的潮热或夜间盗汗让你反复醒来、明显疲倦，或白天难以正常活动。',
        },
        {
          title: '日常生活变得困难时',
          text: '潮热影响了你的工作、活动、出行、社交关系，或者只是日常的舒适感。',
        },
        {
          title: '症状越来越频繁时',
          text: '症状的频率或强度明显增加，值得与专业人员讨论，以找到最合适的办法。',
        },
        {
          title: '如果你在考虑治疗',
          text: '可能会根据你的情况提供激素类和非激素类的选择。专业人员可以帮你权衡它们的益处、风险和可能的禁忌。',
        },
      ],
      notMenopauseTitle: '不要把一切都归因于绝经',
      notMenopauseBody: '潮热可能有不同的原因。有些症状也可能与某种药物、其他疾病或健康状况的明显变化有关。如果有什么感觉异常、是新出现的或特别强烈，最好咨询专业人员，而不是直接认定是绝经。',
      alertTitle: '请尽快就医',
      alertText: '胸痛、突然气短、感觉快要昏厥、突然无力，或一侧腿部出现异常的疼痛性肿胀，都需要及时就医。',
      emergencySignsTitle: '哪些信号需要特别留意？',
      emergencySigns: [
        '异常或剧烈的胸痛',
        '突然气短或明显呼吸困难',
        '感觉快要昏厥或失去意识',
        '突然无力，或说话、视物困难',
        '一侧腿部出现疼痛的异常肿胀',
      ],
      solutionsTitle: '可能有哪些办法？',
      solutionsBody: '如果潮热困扰到需要处理的程度，可以考虑几种方式。根据你的情况，专业人员可能会和你讨论生活方式调整、非激素类治疗，或在合适时使用激素治疗。',
      highlight2Title: '治疗因人而异',
      highlight2Text: '年龄、症状、既往病史、正在使用的治疗和个人意愿，都可能影响所提供的选择。',
      prepareTitle: '为就诊做准备',
      prepareBody: '带着一些信息前去，会让咨询更有价值。你可以用几天或几周的时间记录发作的频率、强烈程度，以及对睡眠或活动的影响。',
      questionsTitle: '可以提前准备的信息',
      appointmentQuestions: [
        '你的潮热多久发作一次？',
        '你出现潮热多久了？',
        '它们多出现在白天、夜间，还是两者都有？',
        '它们是否干扰了你的睡眠或活动？',
        '你是否找到了一些诱因？',
        '你目前是否在服用任何药物或激素类避孕药？',
      ],
      professionalTipText: '你不必等到症状非常严重才去谈论它们。咨询也可以只是帮助你弄清楚发生了什么，并了解有哪些办法。',
      summaryTitle: '要点',
      summaryItems: [
        '潮热在绝经过渡期很常见。',
        '找出自己的诱因，有助于更好地应对发作。',
        '简单的习惯可以减轻日常的不适。',
        '如果症状影响睡眠或日常生活，请咨询专业人员。',
        '可以根据你的情况讨论多种处理方式。',
      ],
      finalTipText: '潮热很常见，但当它影响到你的睡眠、工作或身心状态时，不应置之不理。关注自己的症状并与专业人员交流，可以帮你更好地了解原因，并探索合适的办法。',
      disclaimerText: '本文仅供参考，不能替代个性化的医疗建议。',
      shareMessage: '从容应对潮热 — AWA',
    },
  id: {
    badge: 'HOT FLASH',
    title: 'Mengatasi\nhot flash',
    metaDuration: '10 menit baca',
    metaType: 'Artikel',
    metaLevel: 'Pemula',
    metaValidated: 'Konten yang telah ditinjau',
    intro: 'Mengapa hot flash terjadi, cara mengenali pemicunya, dan solusi apa yang mungkin membantu ketika gejala ini mulai mengganggu.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Mengapa hot flash terjadi',
      'Keringat malam',
      'Pemicu yang umum',
      'Kebiasaan sehari-hari yang membantu',
      'Kapan harus bicara dengan tenaga profesional',
      'Poin-poin penting',
    ],
    section1Body1: 'Hot flash sangat umum terjadi pada masa transisi menuju menopause. Gejala ini sebagian berkaitan dengan perubahan hormon yang memengaruhi cara otak mengatur suhu tubuh.',
    section1Body2: 'Pergeseran kecil pada suhu tubuh kemudian bisa terasa seperti panas yang tiba-tiba. Tubuh merespons dengan melebarkan pembuluh darah di kulit, yang dapat menimbulkan sensasi panas, wajah memerah, dan terkadang keringat yang banyak.',
    highlight1Title: 'Setiap orang berbeda',
    highlight1Text: 'Sebagian wanita mengalami beberapa kali dalam seminggu, sementara yang lain bisa mengalaminya beberapa kali sehari. Intensitas dan durasinya juga bisa bervariasi.',
    section2Body1: 'Ketika terjadi saat tidur, hot flash dapat menyebabkan keringat malam. Hal ini bisa membuatmu terbangun berulang kali dan membuat tidur kurang nyenyak.',
    section2Body2: 'Kurang tidur kemudian dapat menambah rasa lelah, sulit berkonsentrasi, dan mudah tersinggung di siang hari. Karena itu, kualitas tidur sebaiknya ikut dipertimbangkan saat menilai dampak gejalamu.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Piama yang menyerap keringat, seprai yang tipis, dan kamar tidur yang cukup sejuk dapat membantu mengurangi rasa tidak nyaman di malam hari.',
    section3Body1: 'Beberapa faktor dapat memicu atau memperkuat hot flash. Faktor-faktor ini belum tentu menimbulkan gejala pada semua orang, tetapi mengenalinya dapat membantumu memahami pola dirimu sendiri.',
    triggers: [
      'Kafein dan alkohol',
      'Makanan pedas',
      'Stres dan emosi yang kuat',
      'Ruangan yang terlalu panas atau pakaian yang terlalu tebal',
    ],
    tip2Title: 'Kebiasaan kecil yang membantu',
    tip2Text: 'Selama beberapa minggu, catat kapan hot flash terjadi, seberapa kuat, dan apa yang terjadi tepat sebelumnya. Ini dapat membantumu mengenali pemicu pribadimu.',
    dailyHabits: [
      'Kenakan pakaian tipis berlapis',
      'Jaga ruanganmu tetap sejuk dan berventilasi baik',
      'Latih pernapasan perlahan saat hot flash terjadi',
      'Minum air dingin secara teratur',
    ],
    section4Body1: 'Langkah-langkah ini belum tentu membuat hot flash hilang, tetapi dapat membuat setiap episode lebih mudah dihadapi dan mengurangi rasa tidak nyaman saat terjadi.',
    section5Body1: 'Hot flash umum terjadi pada masa perimenopause dan menopause. Meski begitu, kamu tidak harus sekadar menahannya jika sudah sulit dijalani. Dokter atau bidan dapat menilai gejalamu dan membahas berbagai pilihan bersamamu.',
    whenAppointmentTitle: 'Kapan sebaiknya membuat janji?',
    section5Body2: 'Konsultasi bisa sangat membantu ketika gejala berdampak besar pada kehidupan sehari-harimu atau ketika kamu ingin tahu pilihan apa saja yang tersedia.',
    consultReasons: [
      {
        title: 'Ketika tidur terganggu',
        text: 'Hot flash atau keringat malam yang sering, yang menyebabkan terbangun berulang kali, rasa lelah yang berat, atau kesulitan menjalani hari dengan normal.',
      },
      {
        title: 'Ketika kehidupan sehari-hari menjadi sulit',
        text: 'Jika hot flash mengganggu pekerjaan, aktivitas, perjalanan, hubungan sosial, atau sekadar kenyamanan harianmu.',
      },
      {
        title: 'Ketika gejala makin sering',
        text: 'Peningkatan frekuensi atau intensitas gejala yang jelas layak dibicarakan agar bisa ditemukan solusi yang paling sesuai.',
      },
      {
        title: 'Jika kamu mempertimbangkan pengobatan',
        text: 'Pilihan hormonal dan nonhormonal dapat ditawarkan sesuai kondisimu. Tenaga profesional dapat membantumu menimbang manfaat, risiko, dan kemungkinan kontraindikasinya.',
      },
    ],
    notMenopauseTitle: 'Jangan mengaitkan semuanya dengan menopause',
    notMenopauseBody: 'Hot flash bisa memiliki berbagai penyebab. Beberapa gejala juga mungkin berkaitan dengan obat, kondisi medis lain, atau perubahan penting pada kesehatanmu. Jika ada yang terasa tidak biasa, baru, atau sangat kuat, sebaiknya bicarakan dengan tenaga profesional, bukan langsung menganggapnya menopause.',
    alertTitle: 'Segera cari pertolongan',
    alertText: 'Nyeri dada, sesak napas mendadak, rasa akan pingsan, kelemahan mendadak, atau pembengkakan yang tidak biasa dan nyeri pada satu tungkai memerlukan penanganan medis segera.',
    emergencySignsTitle: 'Tanda apa yang perlu diperhatikan secara khusus?',
    emergencySigns: [
      'Nyeri dada yang tidak biasa atau berat',
      'Sesak napas mendadak atau kesulitan bernapas yang berat',
      'Rasa akan pingsan atau kehilangan kesadaran',
      'Kelemahan mendadak, atau kesulitan berbicara atau melihat',
      'Pembengkakan yang nyeri dan tidak biasa pada satu tungkai',
    ],
    solutionsTitle: 'Solusi apa yang mungkin tersedia?',
    solutionsBody: 'Jika hot flash cukup mengganggu sehingga perlu ditangani, beberapa pendekatan dapat dipertimbangkan. Tergantung kondisimu, tenaga profesional dapat membahas langkah gaya hidup, pengobatan nonhormonal, atau, bila sesuai, terapi hormon.',
    highlight2Title: 'Pengobatan dipilih kasus per kasus',
    highlight2Text: 'Usia, gejala, riwayat kesehatan, pengobatan yang sedang dijalani, dan preferensi pribadi semuanya dapat memengaruhi pilihan yang ditawarkan.',
    prepareTitle: 'Mempersiapkan janji temumu',
    prepareBody: 'Datang dengan sedikit informasi dapat membuat konsultasi lebih bermanfaat. Selama beberapa hari atau minggu, kamu bisa mencatat seberapa sering episode terjadi, seberapa kuat, dan dampaknya pada tidur atau aktivitasmu.',
    questionsTitle: 'Informasi berguna untuk disiapkan',
    appointmentQuestions: [
      'Seberapa sering hot flash terjadi?',
      'Sudah berapa lama kamu mengalaminya?',
      'Apakah cenderung terjadi di siang hari, malam hari, atau keduanya?',
      'Apakah mengganggu tidur atau aktivitasmu?',
      'Apakah kamu sudah mengenali pemicunya?',
      'Apakah kamu sedang mengonsumsi obat atau memakai kontrasepsi hormonal?',
    ],
    professionalTipText: 'Kamu tidak perlu menunggu gejala menjadi sangat berat sebelum membicarakannya. Konsultasi juga bisa sekadar membantumu memahami apa yang terjadi dan mengetahui solusi yang tersedia.',
    summaryTitle: 'Intinya',
    summaryItems: [
      'Hot flash umum terjadi pada masa transisi menopause.',
      'Mengenali pemicumu dapat membantu menghadapi setiap episode dengan lebih baik.',
      'Kebiasaan sederhana dapat mengurangi rasa tidak nyaman sehari-hari.',
      'Jika gejala mengganggu tidur atau kehidupan sehari-harimu, bicarakan dengan tenaga profesional.',
      'Beberapa pilihan penanganan dapat dibahas sesuai kondisimu.',
    ],
    finalTipText: 'Hot flash memang umum, tetapi jangan diabaikan ketika memengaruhi tidur, pekerjaan, atau kesejahteraanmu. Memperhatikan gejalamu dan berbicara dengan tenaga profesional dapat membantumu memahami penyebabnya dan menjajaki solusi yang sesuai.',
    disclaimerText: 'Artikel ini hanya untuk tujuan informasi dan tidak menggantikan saran medis yang dipersonalisasi.',
    shareMessage: 'Mengatasi hot flash — AWA',
  },
  hi: {
    badge: 'हॉट फ़्लैश',
    title: 'हॉट फ़्लैश को\nकाबू में रखें',
    metaDuration: '10 मिनट में पढ़ें',
    metaType: 'लेख',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षा किया गया कंटेंट',
    intro: 'ये क्यों होते हैं, अपने ट्रिगर कैसे पहचानें, और जब ये परेशान करने लगें तो कौन-से उपाय मदद कर सकते हैं।',
    contentsTitle: 'इस लेख में',
    topics: [
      'हॉट फ़्लैश क्यों होते हैं',
      'रात में पसीना',
      'आम ट्रिगर',
      'रोज़ की आदतें जो मदद करती हैं',
      'विशेषज्ञ से कब बात करें',
      'मुख्य बातें',
    ],
    section1Body1: 'मेनोपॉज़ (रजोनिवृत्ति) की ओर बढ़ते समय हॉट फ़्लैश बहुत आम हैं। इनका संबंध कुछ हद तक उन हार्मोन संबंधी बदलावों से है, जो दिमाग़ द्वारा शरीर का तापमान नियंत्रित करने के तरीके को प्रभावित करते हैं।',
    section1Body2: 'शरीर के तापमान में ज़रा-सा बदलाव अचानक गर्मी जैसा महसूस हो सकता है। शरीर त्वचा की रक्त नलिकाओं को फैलाकर प्रतिक्रिया देता है, जिससे गर्मी लगना, चेहरा लाल होना और कभी-कभी बहुत पसीना आना हो सकता है।',
    highlight1Title: 'हर महिला अलग होती है',
    highlight1Text: 'कुछ महिलाओं को हफ़्ते में कुछ ही बार होते हैं, जबकि कुछ को दिन में कई बार हो सकते हैं। तीव्रता और अवधि भी अलग-अलग हो सकती है।',
    section2Body1: 'नींद के दौरान हॉट फ़्लैश होने पर रात में पसीना आ सकता है। इससे बार-बार नींद खुल सकती है और नींद कम आरामदायक हो सकती है।',
    section2Body2: 'नींद की कमी से दिन में थकान, ध्यान लगाने में दिक़्क़त और चिड़चिड़ापन बढ़ सकता है। इसलिए अपने लक्षणों के असर का आकलन करते समय नींद की गुणवत्ता को भी ध्यान में रखना मददगार हो सकता है।',
    tip1Title: 'जानना अच्छा रहेगा',
    tip1Text: 'हवादार पजामे, हल्का बिस्तर और काफ़ी ठंडा कमरा रात की बेचैनी को कम करने में मदद कर सकते हैं।',
    section3Body1: 'कुछ कारण हॉट फ़्लैश को शुरू या तेज़ कर सकते हैं। ज़रूरी नहीं कि वे हर किसी में लक्षण पैदा करें, लेकिन उन्हें पहचानने से आप अपने पैटर्न को बेहतर समझ सकती हैं।',
    triggers: [
      'कैफ़ीन और शराब',
      'मसालेदार खाना',
      'तनाव और तेज़ भावनाएँ',
      'ज़्यादा गर्म कमरा या बहुत भारी कपड़े',
    ],
    tip2Title: 'एक काम की छोटी आदत',
    tip2Text: 'कुछ हफ़्तों तक नोट करें कि आपके हॉट फ़्लैश कब होते हैं, कितने तेज़ होते हैं, और उससे ठीक पहले क्या हुआ था। इससे आप अपने निजी ट्रिगर पहचान सकती हैं।',
    dailyHabits: [
      'हल्के कपड़े परतों में पहनें',
      'अपनी जगह को ठंडा और हवादार रखें',
      'हॉट फ़्लैश के दौरान धीमी साँसें लें',
      'नियमित रूप से ठंडा पानी पिएँ',
    ],
    section4Body1: 'ये उपाय ज़रूरी नहीं कि हॉट फ़्लैश को पूरी तरह ख़त्म कर दें, लेकिन ये दौरों को संभालना आसान बना सकते हैं और होने पर बेचैनी कम कर सकते हैं।',
    section5Body1: 'पेरिमेनोपॉज़ और मेनोपॉज़ के दौरान हॉट फ़्लैश आम हैं। फिर भी, अगर इनके साथ जीना मुश्किल हो जाए, तो आपको इन्हें बस सहते रहने की ज़रूरत नहीं है। डॉक्टर या दाई-नर्स (मिडवाइफ़) आपके लक्षणों का आकलन कर सकती हैं और अलग-अलग विकल्पों पर आपसे बात कर सकती हैं।',
    whenAppointmentTitle: 'अपॉइंटमेंट कब लेना चाहिए?',
    section5Body2: 'डॉक्टर से मिलना खासकर तब मददगार हो सकता है जब लक्षणों का आपकी रोज़ की ज़िंदगी पर काफ़ी असर पड़ रहा हो या आप जानना चाहती हों कि कौन-से विकल्प उपलब्ध हैं।',
    consultReasons: [
      {
        title: 'जब नींद में खलल पड़े',
        text: 'बार-बार हॉट फ़्लैश या रात में पसीना, जिससे बार-बार नींद खुले, बहुत थकान रहे, या दिन में सामान्य रूप से काम करने में दिक़्क़त हो।',
      },
      {
        title: 'जब रोज़ की ज़िंदगी मुश्किल हो जाए',
        text: 'अगर हॉट फ़्लैश आपके काम, गतिविधियों, यात्रा, सामाजिक रिश्तों या बस आपके रोज़ के आराम में रुकावट डालें।',
      },
      {
        title: 'जब लक्षण ज़्यादा बार होने लगें',
        text: 'लक्षणों की बारंबारता या तीव्रता में साफ़ बढ़ोतरी पर बात करना ठीक है, ताकि सबसे सही उपाय खोजे जा सकें।',
      },
      {
        title: 'अगर आप इलाज के बारे में सोच रही हैं',
        text: 'आपकी स्थिति के अनुसार हार्मोनल और बिना हार्मोन वाले विकल्प सुझाए जा सकते हैं। विशेषज्ञ उनके फ़ायदे, जोखिम और संभावित मनाही (कॉन्ट्राइंडिकेशन) को तौलने में आपकी मदद कर सकते हैं।',
      },
    ],
    notMenopauseTitle: 'हर बात को मेनोपॉज़ न मानें',
    notMenopauseBody: 'हॉट फ़्लैश के अलग-अलग कारण हो सकते हैं। कुछ लक्षण किसी दवा, किसी दूसरी बीमारी या सेहत में किसी बड़े बदलाव से भी जुड़े हो सकते हैं। अगर कुछ असामान्य, नया या खास तौर पर तेज़ लगे, तो अपने आप यह मान लेने के बजाय कि यह मेनोपॉज़ है, किसी विशेषज्ञ से बात करना बेहतर है।',
    alertTitle: 'तुरंत इलाज करवाएँ',
    alertText: 'सीने में दर्द, अचानक साँस फूलना, चक्कर जैसा महसूस होना या बेहोशी लगना, अचानक कमज़ोरी, या एक पैर में असामान्य दर्द भरी सूजन के लिए तुरंत चिकित्सा सहायता चाहिए।',
    emergencySignsTitle: 'किन संकेतों पर खास ध्यान देना चाहिए?',
    emergencySigns: [
      'सीने में असामान्य या तेज़ दर्द',
      'अचानक साँस फूलना या साँस लेने में काफ़ी दिक़्क़त',
      'चक्कर जैसा लगना या बेहोश हो जाना',
      'अचानक कमज़ोरी, या बोलने अथवा देखने में दिक़्क़त',
      'एक पैर में दर्द भरी, असामान्य सूजन',
    ],
    solutionsTitle: 'कौन-से उपाय उपलब्ध हो सकते हैं?',
    solutionsBody: 'अगर हॉट फ़्लैश इतने परेशान करते हैं कि उन्हें संभालने की ज़रूरत है, तो कई तरीकों पर विचार किया जा सकता है। आपकी स्थिति के अनुसार विशेषज्ञ जीवनशैली के उपायों, बिना हार्मोन वाले इलाज, या ज़रूरत हो तो हार्मोन थेरेपी पर बात कर सकते हैं।',
    highlight2Title: 'इलाज हर मामले के हिसाब से चुना जाता है',
    highlight2Text: 'उम्र, लक्षण, चिकित्सकीय इतिहास, चल रहे इलाज और निजी पसंद, ये सब सुझाए जाने वाले विकल्पों को प्रभावित कर सकते हैं।',
    prepareTitle: 'अपॉइंटमेंट की तैयारी',
    prepareBody: 'थोड़ी जानकारी के साथ जाने से परामर्श ज़्यादा उपयोगी हो सकता है। आप कुछ दिनों या हफ़्तों तक नोट कर सकती हैं कि दौरे कितनी बार आते हैं, कितने तेज़ होते हैं, और आपकी नींद या गतिविधियों पर उनका क्या असर पड़ता है।',
    questionsTitle: 'तैयार रखने लायक उपयोगी जानकारी',
    appointmentQuestions: [
      'आपको हॉट फ़्लैश कितनी बार होते हैं?',
      'आप इन्हें कब से महसूस कर रही हैं?',
      'क्या ये दिन में, रात में, या दोनों समय होते हैं?',
      'क्या ये आपकी नींद या गतिविधियों में खलल डालते हैं?',
      'क्या आपने कोई ट्रिगर पहचाना है?',
      'क्या आप अभी कोई दवा या हार्मोनल गर्भनिरोधक ले रही हैं?',
    ],
    professionalTipText: 'लक्षणों के बहुत गंभीर होने तक इंतज़ार करने की ज़रूरत नहीं है। डॉक्टर से मिलने से आपको यह समझने में भी मदद मिल सकती है कि क्या हो रहा है और कौन-से उपाय उपलब्ध हैं।',
    summaryTitle: 'ज़रूरी बातें',
    summaryItems: [
      'मेनोपॉज़ की ओर बढ़ते समय हॉट फ़्लैश आम हैं।',
      'अपने ट्रिगर पहचानने से आप दौरों को बेहतर तरीके से संभाल सकती हैं।',
      'सरल आदतें रोज़ की बेचैनी को कम कर सकती हैं।',
      'अगर लक्षण आपकी नींद या रोज़ की ज़िंदगी में खलल डालें, तो किसी विशेषज्ञ से बात करें।',
      'आपकी स्थिति के अनुसार कई उपायों पर चर्चा की जा सकती है।',
    ],
    finalTipText: 'हॉट फ़्लैश आम हैं, लेकिन जब वे आपकी नींद, काम या सेहत पर असर डालें, तो उन्हें नज़रअंदाज़ नहीं करना चाहिए। अपने लक्षणों पर ध्यान देना और किसी विशेषज्ञ से बात करना उनके कारण को बेहतर समझने और सही उपाय खोजने में मदद कर सकता है।',
    disclaimerText: 'यह लेख सिर्फ़ जानकारी के लिए है और व्यक्तिगत चिकित्सकीय सलाह की जगह नहीं लेता।',
    shareMessage: 'हॉट फ़्लैश को काबू में रखें — AWA',
  },
  sq: {
    badge: 'VALËT E NXEHTËSISË',
    title: 'Si t’i përballosh\nvalët e nxehtësisë',
    metaDuration: '10 min lexim',
    metaType: 'Artikull',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Pse ndodhin, si t’i identifikosh shkaktarët e tu dhe çfarë zgjidhjesh mund të ndihmojnë kur bëhen shqetësuese.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Pse ndodhin valët e nxehtësisë',
      'Djersitjet gjatë natës',
      'Shkaktarët e zakonshëm',
      'Zakonet e përditshme që ndihmojnë',
      'Kur të flasësh me një profesionist',
      'Pikat kryesore',
    ],
    section1Body1: 'Valët e nxehtësisë janë shumë të zakonshme gjatë kalimit drejt menopauzës. Ato lidhen pjesërisht me ndryshimet hormonale që ndikojnë mënyrën se si truri e rregullon temperaturën e trupit.',
    section1Body2: 'Një ndryshim i vogël i temperaturës së trupit mund të ndihet atëherë si nxehtësi e papritur. Trupi reagon duke zgjeruar enët e gjakut në lëkurë, gjë që mund të shkaktojë ndjesi nxehtësie, skuqje dhe nganjëherë djersitje të bollshme.',
    highlight1Title: 'Çdo person është ndryshe',
    highlight1Text: 'Disa gra përjetojnë vetëm disa episode në javë, ndërsa të tjera mund të kenë disa në ditë. Edhe intensiteti dhe kohëzgjatja mund të ndryshojnë.',
    section2Body1: 'Kur ndodhin gjatë gjumit, valët e nxehtësisë mund të shkaktojnë djersitje gjatë natës. Ato mund të çojnë në zgjime të përsëritura dhe ta bëjnë gjumin më pak çlodhës.',
    section2Body2: 'Mungesa e gjumit mund të shtojë më pas lodhjen, vështirësinë për t’u përqendruar dhe nervozizmin gjatë ditës. Prandaj mund të jetë e dobishme ta marrësh parasysh cilësinë e gjumit kur vlerëson ndikimin e simptomave të tua.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Pizhamet që thithin ajrin, shtroja e lehtë dhe një dhomë gjumi mjaftueshëm e freskët mund të ndihmojnë të kufizosh shqetësimin gjatë natës.',
    section3Body1: 'Disa faktorë mund të nxisin ose të forcojnë një valë nxehtësie. Ata nuk shkaktojnë domosdoshmërisht simptoma te të gjithë, por identifikimi i tyre mund të të ndihmojë ta kuptosh më mirë modelin tënd.',
    triggers: [
      'Kafeina dhe alkooli',
      'Ushqimet e pikanta',
      'Stresi dhe emocionet e forta',
      'Një dhomë e mbinxehur ose rroba shumë të rënda',
    ],
    tip2Title: 'Një zakon i vogël që ndihmon',
    tip2Text: 'Për disa javë, shëno kur ndodhin valët e tua të nxehtësisë, sa intensive janë dhe çfarë ka ndodhur menjëherë më parë. Kjo mund të të ndihmojë të dallosh shkaktarët e tu personalë.',
    dailyHabits: [
      'Vishu me shtresa të lehta',
      'Mbaje hapësirën tënde të freskët dhe të ajrosur mirë',
      'Merr frymë ngadalë gjatë një vale nxehtësie',
      'Pi rregullisht ujë të freskët',
    ],
    section4Body1: 'Këto masa nuk do t’i bëjnë domosdoshmërisht valët e nxehtësisë të zhduken, por mund t’i bëjnë episodet më të lehta për t’u menaxhuar dhe të pakësojnë shqetësimin kur ndodhin.',
    section5Body1: 'Valët e nxehtësisë janë të zakonshme gjatë perimenopauzës dhe menopauzës. Megjithatë, nuk je e detyruar thjesht t’i durosh nëse bëhen të vështira për t’u përballuar. Një mjek ose një mami mund t’i vlerësojë simptomat e tua dhe të diskutojë me ty opsionet e ndryshme.',
    whenAppointmentTitle: 'Kur duhet të caktosh një vizitë?',
    section5Body2: 'Një konsultë mund të jetë veçanërisht e dobishme kur simptomat kanë ndikim të madh në jetën tënde të përditshme ose kur dëshiron të dish çfarë opsionesh ka.',
    consultReasons: [
      {
        title: 'Kur gjumi prishet',
        text: 'Valë nxehtësie të shpeshta ose djersitje gjatë natës që shkaktojnë zgjime të përsëritura, lodhje të theksuar ose vështirësi për të funksionuar normalisht gjatë ditës.',
      },
      {
        title: 'Kur jeta e përditshme bëhet e vështirë',
        text: 'Nëse valët e nxehtësisë ndërhyjnë në punën, aktivitetet, udhëtimet, marrëdhëniet shoqërore ose thjesht në rehatinë tënde të përditshme.',
      },
      {
        title: 'Kur simptomat bëhen më të shpeshta',
        text: 'Një rritje e qartë e shpeshtësisë ose e intensitetit të simptomave ia vlen të diskutohet për të gjetur zgjidhjet më të përshtatshme.',
      },
      {
        title: 'Nëse po mendon për trajtim',
        text: 'Mund të propozohen opsione hormonale dhe johormonale sipas situatës tënde. Një profesionist mund të të ndihmojë t’i peshosh përfitimet, rreziqet dhe kundërindikacionet e mundshme.',
      },
    ],
    notMenopauseTitle: 'Mos i atribuo gjithçka menopauzës',
    notMenopauseBody: 'Një valë nxehtësie mund të ketë shkaqe të ndryshme. Disa simptoma mund të lidhen edhe me një ilaç, me një gjendje tjetër mjekësore ose me një ndryshim të rëndësishëm në shëndetin tënd. Nëse diçka të duket e pazakontë, e re ose veçanërisht e fortë, më mirë është të flasësh me një profesionist sesa të supozosh automatikisht se është menopauza.',
    alertTitle: 'Kërko kujdes menjëherë',
    alertText: 'Dhimbja në gjoks, mungesa e papritur e frymëmarrjes, ndjesia se do të të marrë të fikët, dobësia e papritur ose ënjtja e pazakontë dhe e dhimbshme në një këmbë kërkojnë ndihmë mjekësore të menjëhershme.',
    emergencySignsTitle: 'Cilat shenja meritojnë vëmendje të veçantë?',
    emergencySigns: [
      'Dhimbje e pazakontë ose e fortë në gjoks',
      'Mungesë e papritur frymëmarrjeje ose vështirësi e madhe për të marrë frymë',
      'Ndjesia se do të të marrë të fikët ose humbja e vetëdijes',
      'Dobësi e papritur ose vështirësi për të folur apo për të parë',
      'Ënjtje e dhimbshme dhe e pazakontë në një këmbë',
    ],
    solutionsTitle: 'Çfarë zgjidhjesh mund të ketë?',
    solutionsBody: 'Nëse valët e nxehtësisë janë aq shqetësuese sa kërkojnë menaxhim, mund të merren parasysh disa qasje. Sipas situatës tënde, profesionisti mund të diskutojë masa të stilit të jetesës, trajtime johormonale ose, kur është e përshtatshme, terapi hormonale.',
    highlight2Title: 'Trajtimi zgjidhet rast pas rasti',
    highlight2Text: 'Mosha, simptomat, historiku mjekësor, trajtimet aktuale dhe preferencat personale mund të ndikojnë të gjitha te opsionet që propozohen.',
    prepareTitle: 'Përgatitja për vizitën tënde',
    prepareBody: 'Të vish me pak informacion mund ta bëjë konsultën më të dobishme. Mund të ndjekësh, për disa ditë ose javë, sa shpesh ndodhin episodet, sa intensive janë dhe ndikimin e tyre te gjumi ose aktivitetet e tua.',
    questionsTitle: 'Informacion i dobishëm për t’u përgatitur',
    appointmentQuestions: [
      'Sa shpesh ndodhin valët e tua të nxehtësisë?',
      'Prej sa kohësh i përjeton?',
      'A ndodhin më shpesh ditën ose natën, apo në të dyja?',
      'A ta prishin gjumin ose aktivitetet?',
      'A ke identifikuar ndonjë shkaktar?',
      'A po merr aktualisht ndonjë ilaç ose kontracepsion hormonal?',
    ],
    professionalTipText: 'Nuk ke nevojë të presësh derisa simptomat të bëhen shumë të forta për të folur për to. Një konsultë mund të të ndihmojë edhe thjesht të kuptosh çfarë po ndodh dhe të njihesh me zgjidhjet e disponueshme.',
    summaryTitle: 'Thelbi',
    summaryItems: [
      'Valët e nxehtësisë janë të zakonshme gjatë kalimit drejt menopauzës.',
      'Identifikimi i shkaktarëve të tu mund të të ndihmojë t’i menaxhosh më mirë episodet.',
      'Zakonet e thjeshta mund ta pakësojnë shqetësimin e përditshëm.',
      'Nëse simptomat ta prishin gjumin ose jetën e përditshme, flit me një profesionist.',
      'Mund të diskutohen disa opsione menaxhimi sipas situatës tënde.',
    ],
    finalTipText: 'Valët e nxehtësisë janë të zakonshme, por nuk duhen shpërfillur kur ndikojnë te gjumi, puna ose mirëqenia jote. Vëmendja ndaj simptomave të tua dhe biseda me një profesionist mund të të ndihmojnë të kuptosh më mirë shkakun e tyre dhe të gjesh zgjidhje të përshtatshme.',
    disclaimerText: 'Ky artikull është vetëm për qëllime informimi dhe nuk zëvendëson këshillën mjekësore të personalizuar.',
    shareMessage: 'Si t’i përballosh valët e nxehtësisë — AWA',
  },
  ja: {
    badge: 'ほてり',
    title: 'ほてりと\n上手につきあう',
    metaDuration: '読了10分',
    metaType: '記事',
    metaLevel: '初級',
    metaValidated: '内容確認済み',
    intro: 'ほてりが起こる理由、きっかけの見つけ方、つらいときに役立つかもしれない対処法について。',
    contentsTitle: 'この記事の内容',
    topics: [
      'ほてりが起こる理由',
      '寝汗',
      'よくあるきっかけ',
      '役立つ毎日の習慣',
      '専門家に相談するタイミング',
      '重要なポイント',
    ],
    section1Body1: 'ほてり（ホットフラッシュ）は、更年期への移行期にとてもよく見られます。ホルモンの変化によって、脳が体温を調節する仕組みが影響を受けることが、一部関係しています。',
    section1Body2: 'そのため、わずかな体温の変化が、突然の熱さとして感じられることがあります。体は皮膚の血管を広げて反応し、熱い感じ、顔や体の赤み、そして大量の汗が出ることもあります。',
    highlight1Title: '人それぞれです',
    highlight1Text: '週に数回だけ起こる人もいれば、一日に何度も起こる人もいます。強さや続く時間にも違いがあります。',
    section2Body1: '睡眠中に起こると、ほてりは寝汗の原因になることがあります。何度も目が覚めて、睡眠の質が下がることがあります。',
    section2Body2: '睡眠不足は、日中の疲れ、集中しにくさ、いらいらを強めることがあります。そのため、症状の影響を考えるときには、睡眠の質も考慮に入れると役立ちます。',
    tip1Title: '知っておきたいこと',
    tip1Text: '通気性のよいパジャマ、軽い寝具、十分に涼しい寝室は、夜の不快感を和らげる助けになります。',
    section3Body1: 'ほてりのきっかけになったり、強めたりする要因がいくつかあります。誰にでも症状が出るわけではありませんが、それを見つけておくと、ご自身のパターンを理解しやすくなります。',
    triggers: [
      'カフェインとアルコール',
      '辛い食べ物',
      'ストレスや強い感情',
      '暑すぎる部屋や、重すぎる服',
    ],
    tip2Title: '役立つちょっとした習慣',
    tip2Text: '数週間、ほてりが起こった時間帯、その強さ、直前にあったことを記録してみましょう。ご自身のきっかけを見つけやすくなります。',
    dailyHabits: [
      '軽い服を重ねて着る',
      '部屋を涼しく、風通しよく保つ',
      'ほてりの最中にゆっくり呼吸する',
      '冷たい水をこまめに飲む',
    ],
    section4Body1: 'こうした方法で、ほてりが必ずなくなるわけではありませんが、症状への対処がしやすくなり、起こったときの不快感を減らす助けになります。',
    section5Body1: 'ほてりは、更年期への移行期（ペリメノポーズ）や更年期によく見られます。それでも、つらくて困るほどであれば、ただ我慢する必要はありません。医師や助産師が症状を評価し、さまざまな選択肢について一緒に話し合うことができます。',
    whenAppointmentTitle: 'どんなときに予約をとればよいですか？',
    section5Body2: '症状が日常生活に大きく影響しているときや、どんな選択肢があるのか知りたいときには、受診が特に役立ちます。',
    consultReasons: [
      {
        title: '睡眠が妨げられるとき',
        text: '頻繁なほてりや寝汗のために何度も目が覚める、強い疲れがある、日中に普段どおりに過ごすのが難しいといった場合。',
      },
      {
        title: '日常生活がつらくなるとき',
        text: 'ほてりが、仕事、活動、旅行、人づきあい、あるいは毎日の心地よさそのものに支障をきたす場合。',
      },
      {
        title: '症状が増えてきたとき',
        text: '症状の頻度や強さがはっきりと増えている場合は、最も合った対処法を見つけるために相談する価値があります。',
      },
      {
        title: '治療を考えているとき',
        text: '状況に応じて、ホルモンを使う選択肢と使わない選択肢が提案されることがあります。専門家は、その利点、リスク、考えられる禁忌を一緒に検討する手助けをしてくれます。',
      },
    ],
    notMenopauseTitle: 'すべてを更年期のせいにしないでください',
    notMenopauseBody: 'ほてりには、さまざまな原因が考えられます。症状が、薬、ほかの病気、または健康状態の大きな変化と関係していることもあります。いつもと違う、新しい、特に強いと感じる症状があれば、更年期だと決めつけずに、専門家に相談するのが望ましいです。',
    alertTitle: 'すぐに受診してください',
    alertText: '胸の痛み、突然の息切れ、気を失いそうな感じ、突然の脱力、片脚のいつもと違う痛みを伴うむくみは、すぐに医療を受ける必要があります。',
    emergencySignsTitle: '特に注意が必要なサインは？',
    emergencySigns: [
      'いつもと違う胸の痛み、または激しい胸の痛み',
      '突然の息切れ、または呼吸がかなり苦しい',
      '気を失いそうな感じ、または意識を失う',
      '突然の脱力、または話しにくさ、見えにくさ',
      '片脚の、痛みを伴ういつもと違うむくみ',
    ],
    solutionsTitle: 'どんな対処法があるのでしょうか？',
    solutionsBody: 'ほてりがつらく、対処が必要な場合は、いくつかの方法が検討されます。状況に応じて、専門家が、生活習慣の工夫、ホルモンを使わない治療、あるいは適切な場合にはホルモン療法について話し合うことがあります。',
    highlight2Title: '治療は一人ひとりに合わせて選ばれます',
    highlight2Text: '年齢、症状、病歴、現在の治療、個人の希望などが、提案される選択肢に影響することがあります。',
    prepareTitle: '受診の準備をする',
    prepareBody: '少し情報を持って行くと、診察がより有意義になります。数日から数週間、ほてりが起こる頻度、その強さ、睡眠や活動への影響を記録しておくとよいでしょう。',
    questionsTitle: '準備しておくと役立つ情報',
    appointmentQuestions: [
      'ほてりはどのくらいの頻度で起こりますか？',
      'いつ頃から続いていますか？',
      '日中、夜、またはその両方のどれで起こりやすいですか？',
      '睡眠や活動の妨げになっていますか？',
      'きっかけに気づいていますか？',
      '現在、薬やホルモン避妊薬を使っていますか？',
    ],
    professionalTipText: '症状がとても重くなるまで待たなくても、相談して大丈夫です。診察は、今何が起きているのかを理解し、利用できる対処法を知るためだけでも役立ちます。',
    summaryTitle: '大切なこと',
    summaryItems: [
      'ほてりは、更年期への移行期によく見られます。',
      'きっかけを見つけておくと、症状への対処がしやすくなります。',
      '簡単な習慣で、毎日の不快感を減らせることがあります。',
      '症状が睡眠や日常生活を妨げる場合は、専門家に相談しましょう。',
      '状況に応じて、さまざまな対処法が話し合われることがあります。',
    ],
    finalTipText: 'ほてりはよくあることですが、睡眠、仕事、心身の健やかさに影響するときは、軽く考えないようにしましょう。症状に気を配り、専門家に相談することで、原因を理解し、合った対処法を探しやすくなります。',
    disclaimerText: 'この記事は情報提供のみを目的としており、個別の医療アドバイスに代わるものではありません。',
    shareMessage: 'ほてりと上手につきあう — AWA',
  },
  ko: {
    badge: '안면 홍조',
    title: '안면 홍조\n다스리기',
    metaDuration: '읽는 데 10분',
    metaType: '아티클',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '안면 홍조가 생기는 이유, 유발 요인을 찾는 방법, 불편해졌을 때 도움이 될 수 있는 해결책을 알아봐요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '안면 홍조가 생기는 이유',
      '야간 발한',
      '흔한 유발 요인',
      '도움이 되는 일상 습관',
      '전문가와 상담해야 할 때',
      '핵심 정리',
    ],
    section1Body1: '안면 홍조는 폐경 이행기에 매우 흔해요. 뇌가 체온을 조절하는 방식에 영향을 주는 호르몬 변화와 일부 관련이 있어요.',
    section1Body2: '체온이 조금만 달라져도 갑작스러운 열감으로 느껴질 수 있어요. 몸은 피부의 혈관을 넓혀 반응하는데, 이때 열감, 얼굴 달아오름, 때로는 땀이 많이 나는 느낌이 생길 수 있어요.',
    highlight1Title: '사람마다 달라요',
    highlight1Text: '일주일에 몇 번 겪는 여성도 있고, 하루에 여러 번 겪는 여성도 있어요. 강도와 지속 시간도 다를 수 있어요.',
    section2Body1: '잠자는 동안 안면 홍조가 나타나면 야간 발한이 생길 수 있어요. 이 때문에 자주 깨고 수면이 덜 편안해질 수 있어요.',
    section2Body2: '수면이 부족하면 낮 동안 피로, 집중의 어려움, 짜증이 커질 수 있어요. 그래서 증상이 미치는 영향을 가늠할 때 수면의 질도 함께 살펴보면 도움이 될 수 있어요.',
    tip1Title: '알아 두세요',
    tip1Text: '통기성이 좋은 잠옷, 가벼운 침구, 충분히 시원한 침실은 밤에 느끼는 불편함을 줄이는 데 도움이 될 수 있어요.',
    section3Body1: '어떤 요인은 안면 홍조를 일으키거나 더 심하게 만들 수 있어요. 모든 사람에게 증상을 일으키는 것은 아니지만, 이런 요인을 찾아보면 나만의 패턴을 더 잘 이해하는 데 도움이 될 수 있어요.',
    triggers: [
      '카페인과 술',
      '매운 음식',
      '스트레스와 강한 감정',
      '너무 더운 방이나 너무 두꺼운 옷',
    ],
    tip2Title: '도움이 되는 작은 습관',
    tip2Text: '몇 주 동안 안면 홍조가 언제 나타나는지, 얼마나 심한지, 바로 직전에 무엇을 했는지 기록해 보세요. 나만의 유발 요인을 찾는 데 도움이 될 수 있어요.',
    dailyHabits: [
      '가벼운 옷을 겹쳐 입기',
      '생활 공간을 시원하고 환기가 잘 되게 유지하기',
      '안면 홍조가 올 때 천천히 호흡하기',
      '시원한 물을 규칙적으로 마시기',
    ],
    section4Body1: '이런 방법이 안면 홍조를 반드시 없애 주지는 않지만, 증상이 나타났을 때 더 잘 다스리고 불편함을 줄이는 데 도움이 될 수 있어요.',
    section5Body1: '안면 홍조는 폐경 이행기와 폐경기에 흔해요. 그래도 생활하기 힘들어진다면 그냥 참고 지낼 필요는 없어요. 의사나 조산사가 증상을 살펴보고 여러 가지 선택지에 대해 함께 이야기해 줄 수 있어요.',
    whenAppointmentTitle: '언제 진료를 예약해야 할까요?',
    section5Body2: '증상이 일상에 큰 영향을 줄 때나 어떤 선택지가 있는지 알고 싶을 때 진료가 특히 도움이 될 수 있어요.',
    consultReasons: [
      {
        title: '수면이 방해받을 때',
        text: '잦은 안면 홍조나 야간 발한 때문에 자주 깨거나, 피로가 심하거나, 낮에 평소처럼 지내기 어려울 때예요.',
      },
      {
        title: '일상이 힘들어질 때',
        text: '안면 홍조가 일, 활동, 여행, 사회적 관계, 또는 일상의 편안함 자체를 방해할 때예요.',
      },
      {
        title: '증상이 더 잦아질 때',
        text: '증상의 빈도나 강도가 뚜렷하게 늘었다면, 가장 알맞은 해결책을 찾기 위해 이야기해 볼 만해요.',
      },
      {
        title: '치료를 고려하고 있을 때',
        text: '상황에 따라 호르몬 치료와 비호르몬 치료 같은 선택지를 제안받을 수 있어요. 전문가가 각 방법의 이점, 위험, 그리고 있을 수 있는 금기 사항을 따져 보도록 도와줄 수 있어요.',
      },
    ],
    notMenopauseTitle: '모든 것을 폐경 탓으로 돌리지 마세요',
    notMenopauseBody: '안면 홍조는 여러 가지 원인으로 나타날 수 있어요. 일부 증상은 약물, 다른 질환, 또는 건강 상태의 큰 변화와 관련이 있을 수도 있어요. 평소와 다르거나 새롭거나 유난히 심하게 느껴진다면, 무조건 폐경이라고 여기기보다 전문가와 이야기하는 것이 좋아요.',
    alertTitle: '바로 진료를 받으세요',
    alertText: '가슴 통증, 갑작스러운 숨 가쁨, 어지러워 쓰러질 것 같은 느낌, 갑작스러운 힘 빠짐, 한쪽 다리의 평소와 다른 통증을 동반한 부기는 즉시 의학적 처치가 필요해요.',
    emergencySignsTitle: '특히 주의해야 할 신호는 무엇일까요?',
    emergencySigns: [
      '평소와 다르거나 심한 가슴 통증',
      '갑작스러운 숨 가쁨이나 심한 호흡 곤란',
      '어지러워 쓰러질 것 같은 느낌이나 의식을 잃음',
      '갑작스러운 힘 빠짐, 또는 말하거나 보는 데 어려움',
      '한쪽 다리의 통증을 동반한 평소와 다른 부기',
    ],
    solutionsTitle: '어떤 해결책이 있을까요?',
    solutionsBody: '안면 홍조가 관리가 필요할 만큼 불편하다면 여러 가지 방법을 고려할 수 있어요. 상황에 따라 전문가가 생활 습관 개선, 비호르몬 치료, 또는 적절한 경우 호르몬 요법에 대해 이야기할 수 있어요.',
    highlight2Title: '치료는 경우에 따라 선택해요',
    highlight2Text: '나이, 증상, 병력, 현재 받고 있는 치료, 개인의 선호가 모두 제안되는 선택지에 영향을 줄 수 있어요.',
    prepareTitle: '진료 준비하기',
    prepareBody: '약간의 정보를 준비해 가면 진료가 더 유익해질 수 있어요. 며칠 또는 몇 주 동안 증상이 얼마나 자주 나타나는지, 얼마나 심한지, 수면이나 활동에 어떤 영향을 주는지 기록해 볼 수 있어요.',
    questionsTitle: '준비하면 도움이 되는 정보',
    appointmentQuestions: [
      '안면 홍조가 얼마나 자주 나타나나요?',
      '얼마나 오래 겪고 있나요?',
      '주로 낮에, 밤에, 아니면 둘 다에 나타나나요?',
      '수면이나 활동에 방해가 되나요?',
      '유발 요인을 찾았나요?',
      '현재 복용 중인 약이나 호르몬 피임법이 있나요?',
    ],
    professionalTipText: '증상이 아주 심해질 때까지 기다렸다가 이야기할 필요는 없어요. 진료는 단지 어떤 일이 일어나고 있는지 이해하고 어떤 해결책이 있는지 알아보는 데도 도움이 될 수 있어요.',
    summaryTitle: '핵심만 정리',
    summaryItems: [
      '안면 홍조는 폐경 이행기에 흔해요.',
      '유발 요인을 찾으면 증상을 더 잘 다스리는 데 도움이 될 수 있어요.',
      '간단한 습관이 일상의 불편함을 줄여 줄 수 있어요.',
      '증상이 수면이나 일상을 방해한다면 전문가와 상담하세요.',
      '상황에 따라 여러 가지 관리 방법에 대해 이야기할 수 있어요.',
    ],
    finalTipText: '안면 홍조는 흔하지만, 수면, 일, 웰빙에 영향을 준다면 대수롭지 않게 넘기지 마세요. 증상에 주의를 기울이고 전문가와 이야기하면 원인을 더 잘 이해하고 알맞은 해결책을 찾아보는 데 도움이 될 수 있어요.',
    disclaimerText: '이 아티클은 정보 제공을 목적으로 하며 개인에게 맞춘 의학적 조언을 대신하지 않아요.',
    shareMessage: '안면 홍조 다스리기 — AWA',
  },
  'pt-PT': {
    badge: 'AFRONTAMENTOS',
    title: 'Domar\nos afrontamentos',
    metaDuration: '10 min de leitura',
    metaType: 'Artigo',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Porque acontecem, como identificar os seus fatores desencadeantes e que soluções podem ajudar quando se tornam incómodos.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Porque acontecem os afrontamentos',
      'Suores noturnos',
      'Fatores desencadeantes comuns',
      'Hábitos do dia a dia que ajudam',
      'Quando falar com um profissional',
      'Pontos-chave',
    ],
    section1Body1: 'Os afrontamentos são muito comuns durante a transição para a menopausa. Estão ligados, em parte, a alterações hormonais que afetam a forma como o cérebro regula a temperatura do corpo.',
    section1Body2: 'Uma pequena variação da temperatura corporal pode então ser sentida como um calor súbito. O corpo responde dilatando os vasos sanguíneos da pele, o que pode causar sensação de calor, rubor e, por vezes, transpiração abundante.',
    highlight1Title: 'Cada pessoa é diferente',
    highlight1Text: 'Algumas mulheres têm alguns episódios por semana, enquanto outras podem ter vários por dia. A intensidade e a duração também podem variar.',
    section2Body1: 'Quando ocorrem durante o sono, os afrontamentos podem provocar suores noturnos. Podem levar a despertares repetidos e tornar o sono menos reparador.',
    section2Body2: 'A falta de sono pode, por sua vez, aumentar o cansaço, a dificuldade de concentração e a irritabilidade durante o dia. Por isso, pode ser útil ter em conta a qualidade do sono ao avaliar o impacto dos seus sintomas.',
    tip1Title: 'Bom saber',
    tip1Text: 'Pijamas que respiram, roupa de cama leve e um quarto suficientemente fresco podem ajudar a limitar o desconforto à noite.',
    section3Body1: 'Certos fatores podem desencadear ou intensificar um afrontamento. Não provocam necessariamente sintomas em todas as pessoas, mas identificá-los pode ajudá-la a compreender melhor os seus próprios padrões.',
    triggers: [
      'Cafeína e álcool',
      'Alimentos picantes',
      'Stress e emoções fortes',
      'Uma divisão demasiado quente ou roupa demasiado pesada',
    ],
    tip2Title: 'Um pequeno hábito útil',
    tip2Text: 'Durante algumas semanas, anote quando acontecem os seus afrontamentos, a sua intensidade e o que aconteceu imediatamente antes. Isto pode ajudá-la a identificar os seus fatores desencadeantes pessoais.',
    dailyHabits: [
      'Vista-se em camadas leves',
      'Mantenha o seu espaço fresco e bem ventilado',
      'Pratique uma respiração lenta durante um afrontamento',
      'Beba água fresca com regularidade',
    ],
    section4Body1: 'Estas medidas não farão necessariamente desaparecer os afrontamentos, mas podem tornar os episódios mais fáceis de gerir e reduzir o desconforto quando ocorrem.',
    section5Body1: 'Os afrontamentos são comuns durante a perimenopausa e a menopausa. Ainda assim, não tem de simplesmente suportá-los se se tornarem difíceis de viver. Um médico ou uma parteira pode avaliar os seus sintomas e discutir consigo as diferentes opções.',
    whenAppointmentTitle: 'Quando deve marcar uma consulta?',
    section5Body2: 'Uma consulta pode ser especialmente útil quando os sintomas têm um impacto significativo no seu dia a dia ou quando gostaria de saber que opções existem.',
    consultReasons: [
      {
        title: 'Quando o sono é perturbado',
        text: 'Afrontamentos ou suores noturnos frequentes que causam despertares repetidos, cansaço significativo ou dificuldade em funcionar normalmente durante o dia.',
      },
      {
        title: 'Quando o dia a dia se torna difícil',
        text: 'Se os afrontamentos interferem com o seu trabalho, as suas atividades, as viagens, as relações sociais ou simplesmente com o seu conforto diário.',
      },
      {
        title: 'Quando os sintomas se tornam mais frequentes',
        text: 'Um aumento claro da frequência ou da intensidade dos sintomas merece ser discutido, para encontrar as soluções mais adequadas.',
      },
      {
        title: 'Se está a ponderar um tratamento',
        text: 'Podem ser propostas opções hormonais e não hormonais, consoante a sua situação. Um profissional pode ajudá-la a ponderar os seus benefícios, riscos e eventuais contraindicações.',
      },
    ],
    notMenopauseTitle: 'Não atribua tudo à menopausa',
    notMenopauseBody: 'Um afrontamento pode ter diferentes causas. Alguns sintomas também podem estar relacionados com um medicamento, outra condição médica ou uma alteração significativa do seu estado de saúde. Se algo lhe parecer fora do habitual, novo ou especialmente intenso, é preferível falar com um profissional em vez de assumir automaticamente que se trata da menopausa.',
    alertTitle: 'Procure cuidados com urgência',
    alertText: 'Dor no peito, falta de ar súbita, sensação de desmaio, fraqueza súbita ou inchaço doloroso e fora do habitual numa perna exigem atenção médica urgente.',
    emergencySignsTitle: 'Que sinais merecem atenção especial?',
    emergencySigns: [
      'Dor no peito fora do habitual ou intensa',
      'Falta de ar súbita ou dificuldade respiratória significativa',
      'Sensação de desmaio ou perda de consciência',
      'Fraqueza súbita, ou dificuldade em falar ou ver',
      'Inchaço doloroso e fora do habitual numa perna',
    ],
    solutionsTitle: 'Que soluções podem estar disponíveis?',
    solutionsBody: 'Se os afrontamentos forem incómodos ao ponto de precisarem de ser geridos, podem ser consideradas várias abordagens. Consoante a sua situação, o profissional pode discutir medidas relacionadas com o estilo de vida, tratamentos não hormonais ou, quando adequado, terapêutica hormonal.',
    highlight2Title: 'O tratamento é escolhido caso a caso',
    highlight2Text: 'A idade, os sintomas, o historial médico, os tratamentos em curso e as preferências pessoais podem influenciar as opções propostas.',
    prepareTitle: 'Preparar a sua consulta',
    prepareBody: 'Chegar com alguma informação pode tornar a consulta mais útil. Pode registar, durante alguns dias ou semanas, a frequência dos episódios, a sua intensidade e o impacto no sono ou nas atividades.',
    questionsTitle: 'Informação útil a preparar',
    appointmentQuestions: [
      'Com que frequência ocorrem os seus afrontamentos?',
      'Há quanto tempo os sente?',
      'Tendem a acontecer durante o dia, à noite ou em ambos os momentos?',
      'Perturbam o seu sono ou as suas atividades?',
      'Identificou algum fator desencadeante?',
      'Está atualmente a tomar algum medicamento ou contracetivo hormonal?',
    ],
    professionalTipText: 'Não precisa de esperar que os sintomas se tornem muito intensos para falar deles. Uma consulta também pode servir simplesmente para compreender o que se passa e conhecer as soluções disponíveis.',
    summaryTitle: 'O essencial',
    summaryItems: [
      'Os afrontamentos são comuns durante a transição para a menopausa.',
      'Identificar os seus fatores desencadeantes pode ajudá-la a gerir melhor os episódios.',
      'Hábitos simples podem reduzir o desconforto do dia a dia.',
      'Se os sintomas perturbarem o seu sono ou o seu dia a dia, fale com um profissional.',
      'Podem ser discutidas várias opções de abordagem, consoante a sua situação.',
    ],
    finalTipText: 'Os afrontamentos são comuns, mas não devem ser desvalorizados quando afetam o sono, o trabalho ou o bem-estar. Prestar atenção aos seus sintomas e falar com um profissional pode ajudá-la a compreender melhor a sua causa e a explorar soluções adequadas.',
    disclaimerText: 'Este artigo tem apenas fins informativos e não substitui um aconselhamento médico personalizado.',
    shareMessage: 'Domar os afrontamentos — AWA',
  },
  bn: {
    badge: 'হট ফ্ল্যাশ',
    title: 'হট ফ্ল্যাশ\nসামলানোর উপায়',
    metaDuration: '10 মিনিটের পাঠ',
    metaType: 'নিবন্ধ',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'কেন হয়, আপনার ট্রিগার কীভাবে চিনবেন, এবং অস্বস্তিকর হয়ে উঠলে কী কী সমাধান সহায়ক হতে পারে।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'কেন হট ফ্ল্যাশ হয়',
      'রাতে ঘাম',
      'সাধারণ ট্রিগার',
      'সহায়ক দৈনন্দিন অভ্যাস',
      'কখন পেশাজীবীর সঙ্গে কথা বলবেন',
      'মূল কথা',
    ],
    section1Body1: 'মেনোপজে উত্তরণের সময় হট ফ্ল্যাশ খুবই সাধারণ। এগুলো আংশিকভাবে হরমোনের পরিবর্তনের সঙ্গে যুক্ত, যা মস্তিষ্ক কীভাবে শরীরের তাপমাত্রা নিয়ন্ত্রণ করে তা প্রভাবিত করে।',
    section1Body2: 'শরীরের তাপমাত্রায় সামান্য পরিবর্তনও তখন হঠাৎ গরম লাগার মতো অনুভূত হতে পারে। শরীর সাড়া দেয় ত্বকের রক্তনালি প্রসারিত করে, যার ফলে গরম লাগা, মুখ লাল হয়ে যাওয়া এবং কখনো কখনো প্রচুর ঘাম হতে পারে।',
    highlight1Title: 'প্রত্যেকে আলাদা',
    highlight1Text: 'কোনো কোনো নারীর সপ্তাহে কয়েকবার হয়, আবার অন্যদের দিনে কয়েকবারও হতে পারে। তীব্রতা ও স্থায়িত্বও ভিন্ন হতে পারে।',
    section2Body1: 'ঘুমের সময় হলে হট ফ্ল্যাশ রাতে ঘাম ঘটাতে পারে। এর ফলে বারবার ঘুম ভেঙে যেতে পারে এবং ঘুম কম আরামদায়ক হতে পারে।',
    section2Body2: 'ঘুমের অভাব তখন দিনের বেলায় ক্লান্তি, মনোযোগ দিতে অসুবিধা এবং খিটখিটে ভাব বাড়াতে পারে। তাই উপসর্গের প্রভাব মূল্যায়ন করার সময় ঘুমের মানকে বিবেচনায় রাখা সহায়ক হতে পারে।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'বাতাস চলাচল করে এমন পাজামা, হালকা বিছানাপত্র এবং যথেষ্ট ঠান্ডা শোবার ঘর রাতের অস্বস্তি কমাতে সাহায্য করতে পারে।',
    section3Body1: 'কিছু বিষয় হট ফ্ল্যাশ ঘটাতে বা তীব্র করতে পারে। এগুলো সবার ক্ষেত্রে উপসর্গ ঘটায় না, কিন্তু এগুলো চিনতে পারলে আপনার নিজের ধরন আরও ভালোভাবে বুঝতে পারবেন।',
    triggers: [
      'ক্যাফেইন ও অ্যালকোহল',
      'ঝাল খাবার',
      'মানসিক চাপ ও তীব্র আবেগ',
      'অতিরিক্ত গরম ঘর বা খুব ভারী পোশাক',
    ],
    tip2Title: 'একটি সহায়ক ছোট অভ্যাস',
    tip2Text: 'কয়েক সপ্তাহ ধরে লিখে রাখুন কখন আপনার হট ফ্ল্যাশ হচ্ছে, কতটা তীব্র, এবং ঠিক আগে কী ঘটেছিল। এতে আপনার নিজস্ব ট্রিগার চিনতে সুবিধা হতে পারে।',
    dailyHabits: [
      'হালকা কাপড় স্তরে স্তরে পরুন',
      'আপনার থাকার জায়গা ঠান্ডা ও ভালো বাতাস চলাচলযুক্ত রাখুন',
      'হট ফ্ল্যাশের সময় ধীরে শ্বাস নিন',
      'নিয়মিত ঠান্ডা পানি পান করুন',
    ],
    section4Body1: 'এই ব্যবস্থাগুলো যে হট ফ্ল্যাশ পুরোপুরি দূর করবেই, তা নয়, কিন্তু এগুলো প্রতিটি দফা সামলানো সহজ করতে এবং হলে অস্বস্তি কমাতে পারে।',
    section5Body1: 'মেনোপজ-পূর্ব পর্যায় (পেরিমেনোপজ) ও মেনোপজে হট ফ্ল্যাশ সাধারণ। তবুও, সহ্য করা কঠিন হয়ে উঠলে আপনাকে শুধু মুখ বুজে সহ্য করতে হবে না। একজন ডাক্তার বা ধাত্রী আপনার উপসর্গ মূল্যায়ন করতে এবং বিভিন্ন বিকল্প নিয়ে আপনার সঙ্গে আলোচনা করতে পারেন।',
    whenAppointmentTitle: 'কখন অ্যাপয়েন্টমেন্ট নেওয়া উচিত?',
    section5Body2: 'উপসর্গ আপনার দৈনন্দিন জীবনে উল্লেখযোগ্য প্রভাব ফেললে অথবা কী কী বিকল্প আছে তা জানতে চাইলে পরামর্শ বিশেষভাবে সহায়ক হতে পারে।',
    consultReasons: [
      {
        title: 'যখন ঘুম ব্যাহত হয়',
        text: 'ঘন ঘন হট ফ্ল্যাশ বা রাতের ঘাম, যার ফলে বারবার ঘুম ভেঙে যায়, উল্লেখযোগ্য ক্লান্তি হয়, অথবা দিনে স্বাভাবিকভাবে কাজ করতে অসুবিধা হয়।',
      },
      {
        title: 'যখন দৈনন্দিন জীবন কঠিন হয়ে পড়ে',
        text: 'হট ফ্ল্যাশ যদি আপনার কাজ, কার্যকলাপ, ভ্রমণ, সামাজিক সম্পর্ক বা শুধু প্রতিদিনের স্বাচ্ছন্দ্যে বাধা দেয়।',
      },
      {
        title: 'যখন উপসর্গ আরও ঘন ঘন হয়',
        text: 'উপসর্গের ঘনত্ব বা তীব্রতা স্পষ্টভাবে বাড়লে সবচেয়ে উপযুক্ত সমাধান খুঁজে পেতে তা নিয়ে আলোচনা করা ভালো।',
      },
      {
        title: 'যদি আপনি চিকিৎসার কথা ভাবছেন',
        text: 'আপনার পরিস্থিতি অনুযায়ী হরমোনাল ও নন-হরমোনাল বিকল্প প্রস্তাব করা হতে পারে। একজন পেশাজীবী আপনাকে সেগুলোর উপকারিতা, ঝুঁকি এবং সম্ভাব্য নিষেধাজ্ঞা বিবেচনা করতে সাহায্য করতে পারেন।',
      },
    ],
    notMenopauseTitle: 'সবকিছুকে মেনোপজের ওপর চাপাবেন না',
    notMenopauseBody: 'হট ফ্ল্যাশের বিভিন্ন কারণ থাকতে পারে। কিছু উপসর্গ কোনো ওষুধ, অন্য কোনো স্বাস্থ্যগত অবস্থা বা আপনার স্বাস্থ্যের উল্লেখযোগ্য পরিবর্তনের সঙ্গেও সম্পর্কিত হতে পারে। কিছু অস্বাভাবিক, নতুন বা বিশেষভাবে তীব্র মনে হলে স্বয়ংক্রিয়ভাবে ধরে না নিয়ে যে এটি মেনোপজ, কোনো পেশাজীবীর সঙ্গে কথা বলাই ভালো।',
    alertTitle: 'দ্রুত চিকিৎসা নিন',
    alertText: 'বুকে ব্যথা, হঠাৎ শ্বাসকষ্ট, অজ্ঞান হয়ে যাওয়ার মতো অনুভূতি, হঠাৎ দুর্বলতা, অথবা এক পায়ে অস্বাভাবিক ব্যথাযুক্ত ফোলা হলে দ্রুত চিকিৎসা নেওয়া প্রয়োজন।',
    emergencySignsTitle: 'কোন লক্ষণগুলোকে বিশেষ গুরুত্ব দেওয়া উচিত?',
    emergencySigns: [
      'অস্বাভাবিক বা তীব্র বুকে ব্যথা',
      'হঠাৎ শ্বাসকষ্ট বা শ্বাস নিতে উল্লেখযোগ্য অসুবিধা',
      'অজ্ঞান হয়ে যাওয়ার মতো অনুভূতি বা জ্ঞান হারানো',
      'হঠাৎ দুর্বলতা, অথবা কথা বলতে বা দেখতে অসুবিধা',
      'এক পায়ে ব্যথাযুক্ত, অস্বাভাবিক ফোলা',
    ],
    solutionsTitle: 'কী কী সমাধান পাওয়া যেতে পারে?',
    solutionsBody: 'হট ফ্ল্যাশ যদি এতটাই অস্বস্তিকর হয় যে সামলানোর প্রয়োজন হয়, তাহলে বিভিন্ন পদ্ধতি বিবেচনা করা যেতে পারে। আপনার পরিস্থিতি অনুযায়ী পেশাজীবী জীবনযাত্রার ব্যবস্থা, নন-হরমোনাল চিকিৎসা, অথবা উপযুক্ত ক্ষেত্রে হরমোন থেরাপি নিয়ে আলোচনা করতে পারেন।',
    highlight2Title: 'চিকিৎসা বেছে নেওয়া হয় প্রতিটি ক্ষেত্র অনুযায়ী',
    highlight2Text: 'বয়স, উপসর্গ, চিকিৎসার ইতিহাস, চলমান চিকিৎসা এবং ব্যক্তিগত পছন্দ, সবকিছুই প্রস্তাবিত বিকল্পকে প্রভাবিত করতে পারে।',
    prepareTitle: 'আপনার অ্যাপয়েন্টমেন্টের প্রস্তুতি',
    prepareBody: 'কিছু তথ্য নিয়ে গেলে পরামর্শ আরও কাজের হতে পারে। আপনি কয়েক দিন বা কয়েক সপ্তাহ ধরে লিখে রাখতে পারেন কতবার হচ্ছে, কতটা তীব্র, এবং আপনার ঘুম বা কাজকর্মে এর প্রভাব কেমন।',
    questionsTitle: 'প্রস্তুত করার মতো সহায়ক তথ্য',
    appointmentQuestions: [
      'আপনার হট ফ্ল্যাশ কত ঘন ঘন হয়?',
      'কতদিন ধরে এগুলো হচ্ছে?',
      'এগুলো কি সাধারণত দিনে হয়, রাতে হয়, নাকি দুই সময়েই?',
      'এগুলো কি আপনার ঘুম বা কাজকর্ম ব্যাহত করে?',
      'আপনি কি কোনো ট্রিগার চিহ্নিত করেছেন?',
      'আপনি কি এখন কোনো ওষুধ বা হরমোনাল জন্মনিয়ন্ত্রণ ব্যবহার করছেন?',
    ],
    professionalTipText: 'উপসর্গ খুব তীব্র না হওয়া পর্যন্ত অপেক্ষা করার দরকার নেই। পরামর্শ শুধু কী ঘটছে তা বুঝতে এবং উপলব্ধ সমাধান সম্পর্কে জানতেও সাহায্য করতে পারে।',
    summaryTitle: 'মূল কথাগুলো',
    summaryItems: [
      'মেনোপজে উত্তরণের সময় হট ফ্ল্যাশ সাধারণ।',
      'আপনার ট্রিগার চিনতে পারলে ঘটনাগুলো আরও ভালোভাবে সামলাতে পারবেন।',
      'সহজ অভ্যাস প্রতিদিনের অস্বস্তি কমাতে পারে।',
      'উপসর্গ আপনার ঘুম বা দৈনন্দিন জীবন ব্যাহত করলে একজন পেশাজীবীর সঙ্গে কথা বলুন।',
      'আপনার পরিস্থিতি অনুযায়ী বিভিন্ন ব্যবস্থাপনার বিকল্প নিয়ে আলোচনা করা যেতে পারে।',
    ],
    finalTipText: 'হট ফ্ল্যাশ সাধারণ, কিন্তু আপনার ঘুম, কাজ বা সুস্থতাকে প্রভাবিত করলে একে অবহেলা করা উচিত নয়। নিজের উপসর্গের প্রতি মনোযোগ দেওয়া এবং একজন পেশাজীবীর সঙ্গে কথা বলা এর কারণ আরও ভালোভাবে বুঝতে এবং উপযুক্ত সমাধান খুঁজতে সাহায্য করতে পারে।',
    disclaimerText: 'এই নিবন্ধ শুধুমাত্র তথ্যের উদ্দেশ্যে এবং ব্যক্তিগত চিকিৎসা পরামর্শের বিকল্প নয়।',
    shareMessage: 'হট ফ্ল্যাশ সামলানোর উপায় — AWA',
  },
  da: {
    badge: 'HEDETURE',
    title: 'Håndtering\naf hedeture',
    metaDuration: '10 min læsning',
    metaType: 'Artikel',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemset indhold',
    intro: 'Hvorfor de opstår, hvordan du genkender dine egne triggere, og hvilke løsninger der kan hjælpe, når de bliver ubehagelige.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvorfor hedeture opstår',
      'Nattesved',
      'Almindelige triggere',
      'Nyttige hverdagsvaner',
      'Hvornår du skal tale med en fagperson',
      'Hvad du kan tage med dig',
    ],
    section1Body1: 'Hedeture er meget almindelige under overgangsalderen. De er delvist forbundet med hormonforandringer, der påvirker hjernens regulering af kropstemperaturen.',
    section1Body2: 'Selv en lille ændring i kropstemperaturen kan da opleves som en pludselig varmebølge. Kroppen reagerer ved at udvide hudens blodkar, hvilket kan føre til varme, rødme og sommetider kraftig svedtendens.',
    highlight1Title: 'Alle er forskellige',
    highlight1Text: 'Nogen kvinder oplever hedeture få gange om ugen, andre flere gange om dagen. Intensitet og varighed kan også variere.',
    section2Body1: 'Hedeture om natten kan forårsage nattesved. Det kan føre til hyppige opvågninger og gøre søvnen mindre afslappende.',
    section2Body2: 'Søvnmanglen kan derefter øge træthed, koncentrationsbesvær og irritabilitet i løbet af dagen. Det er derfor nyttigt at inddrage søvnkvaliteten, når du vurderer symptomernes indvirkning.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Åndbar pyjamas, lette sengetøj og et tilstrækkeligt køligt soveværelse kan hjælpe med at mindske natligt ubehag.',
    section3Body1: 'Visse ting kan udløse eller forstærke hedeture. De giver ikke alle symptomer hos alle, men at kende dem hjælper dig med at forstå dit eget mønster bedre.',
    triggers: [
      'Koffein og alkohol',
      'Stærkt krydret mad',
      'Stress og stærke følelser',
      'Overophedede rum eller for varmt tøj',
    ],
    tip2Title: 'En lille nyttig vane',
    tip2Text: 'Skriv ned i et par uger, hvornår dine hedeture opstår, hvor intense de er, og hvad der skete lige inden. Det kan hjælpe dig med at identificere dine personlige triggere.',
    dailyHabits: [
      'Klæd dig i lag med lette stoffer',
      'Hold dit opholdsrum køligt og godt ventileret',
      'Træk vejret langsomt under en hedeture',
      'Drik regelmæssigt koldt vand',
    ],
    section4Body1: 'Disse tiltag eliminerer ikke nødvendigvis hedetur fuldstændigt, men de kan gøre det lettere at håndtere hver enkelt episode og mindske ubehaget.',
    section5Body1: 'Hedeture er normale i perimenopause og menopause. Alligevel behøver du ikke bare at bide det i dig, hvis de er svære at bære. En læge eller jordemoder kan vurdere dine symptomer og drøfte de forskellige muligheder med dig.',
    whenAppointmentTitle: 'Hvornår bør du booke en tid?',
    section5Body2: 'En konsultation er særlig nyttig, hvis symptomerne påvirker din dagligdag markant, eller hvis du vil vide, hvilke muligheder der findes.',
    consultReasons: [
      {
        title: 'Når søvnen forstyrres',
        text: 'Hyppige hedeture eller nattesved, der fører til gentagne opvågninger, udtalt træthed eller besvær med at fungere normalt i løbet af dagen.',
      },
      {
        title: 'Når hverdagen bliver svær',
        text: 'Hvis hedeturene hindrer dig i dit arbejde, dine aktiviteter, rejser, socialt samvær eller blot den daglige komfort.',
      },
      {
        title: 'Når symptomerne tiltager',
        text: 'Hvis hyppighed eller intensitet tydeligt stiger, er det godt at drøfte det for at finde den mest passende løsning.',
      },
      {
        title: 'Hvis du overvejer behandling',
        text: 'Hormonelle og ikke-hormonelle muligheder kan tilbydes afhængigt af din situation. En fagperson kan hjælpe dig med at afveje fordele, risici og eventuelle kontraindikationer.',
      },
    ],
    notMenopauseTitle: 'Tilskriv ikke alt overgangsalderen',
    notMenopauseBody: 'Hedeture kan have forskellige årsager. Visse symptomer kan hænge sammen med et lægemiddel, en anden helbredstilstand eller en markant ændring i dit helbred. Hvis noget forekommer usædvanligt, nyt eller særligt intenst, er det bedre at tale med en fagperson frem for at antage, at det automatisk skyldes overgangsalderen.',
    alertTitle: 'Søg hurtig hjælp',
    alertText: 'Brystsmerter, pludselig åndenød, en følelse af besvimelse, pludselig svaghed eller usædvanlig smertegivende hævelse i det ene ben kræver hurtig medicinsk vurdering.',
    emergencySignsTitle: 'Hvilke tegn kræver særlig opmærksomhed?',
    emergencySigns: [
      'Usædvanlige eller kraftige brystsmerter',
      'Pludselig åndenød eller markante vejrtrækningsproblemer',
      'En følelse af at besvime eller egentlig besvimelse',
      'Pludselig svaghed eller besvær med at tale eller se',
      'Smertefuld, usædvanlig hævelse i det ene ben',
    ],
    solutionsTitle: 'Hvilke løsninger kan du få adgang til?',
    solutionsBody: 'Hvis hedetur er så ubehagelige, at de kræver håndtering, kan forskellige tilgange overvejes. Afhængigt af din situation kan en fagperson drøfte livsstilstiltag, ikke-hormonelle behandlinger eller hormonbehandling, hvis det er passende.',
    highlight2Title: 'Behandlingen tilpasses individuelt',
    highlight2Text: 'Alder, symptomer, sygehistorik, igangværende behandlinger og personlige præferencer kan alle påvirke de foreslåede muligheder.',
    prepareTitle: 'Forbered din konsultation',
    prepareBody: 'At have visse oplysninger klar gør konsultationen mere udbytterig. Du kan i et par dage eller uger notere, hvor hyppigt de opstår, hvor intense de er, og hvilken indvirkning de har på din søvn og dine aktiviteter.',
    questionsTitle: 'Nyttige informationer at have klar',
    appointmentQuestions: [
      'Hvor hyppigt har du hedeture?',
      'Hvor længe har du haft dem?',
      'Opstår de typisk om dagen, om natten eller begge dele?',
      'Forstyrrer de din søvn eller dine aktiviteter?',
      'Har du identificeret nogen triggere?',
      'Bruger du aktuelt nogen medicin eller hormonel prævention?',
    ],
    professionalTipText: 'Du behøver ikke vente, til symptomerne er uudholdelige. En konsultation kan også hjælpe dig med at forstå, hvad der sker, og informere dig om tilgængelige løsninger.',
    summaryTitle: 'Det vigtigste at huske',
    summaryItems: [
      'Hedeture er almindelige under overgangsalderen.',
      'At kende dine triggere hjælper dig med at håndtere episoderne bedre.',
      'Enkle vaner kan mindske ubehaget i hverdagen.',
      'Tal med en fagperson, hvis symptomerne forstyrrer din søvn eller dagligdag.',
      'Forskellige håndteringsmuligheder kan drøftes afhængigt af din situation.',
    ],
    finalTipText: 'Hedeture er almindelige, men bør ikke ignoreres, hvis de påvirker din søvn, dit arbejde eller dit velvære. At lytte til dine symptomer og tale med en fagperson kan hjælpe dig med bedre at forstå årsagen og finde en passende løsning.',
    disclaimerText: 'Denne artikel er udelukkende til informationsformål og erstatter ikke personlig medicinsk rådgivning.',
    shareMessage: 'Håndtering af hedeture — AWA',
  },
  sv: {
    badge: 'HEDETURE',
    title: 'Håndtering\naf hedeture',
    metaDuration: '10 min läsning',
    metaType: 'Artikel',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemset indhold',
    intro: 'Hvorfor de opstår, hvordan du genkender dina egne triggere, och hvilke lösninger der kan hjälpe, når de bliver ubehagelige.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvorfor hedeture opstår',
      'Nattesved',
      'Almindelige triggere',
      'Nyttige hverdagsvaner',
      'Hvornår du skal tale med en fagperson',
      'Hvad du kan tage med dig',
    ],
    section1Body1: 'Hedeture ar mycket almindelige under overgangsalderen. De ar delvist forbundet med hormonforandringer, der påvirker hjernens regulering av kropstemperaturen.',
    section1Body2: 'Selv en lille ändring i kropstemperaturen kan da opleves som en pludselig varmebölge. Kroppen reagerer ved at udvide hudens blodkar, hvilket kan före till varme, rödme och sommetider kraftig svedtendens.',
    highlight1Title: 'Alla ar forskellige',
    highlight1Text: 'Nogen kvinnor oplever hedeture få gange om veckan, andre flere gange om dagen. Intensitet och varighed kan også variere.',
    section2Body1: 'Hedeture om natten kan forårsage nattesved. Det kan före till hyppige opvågninger och göre sövnen mindre afslappende.',
    section2Body2: 'Sövnmanglen kan derefter öge träthed, koncentrationsbesvär och irritabilitet i löbet av dagen. Det ar derfor nyttigt at inddrage sövnkvaliteten, når du vurderer symtomnes indvirkning.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Åndbar pyjamas, lette sengetöj och et tilsträkkeligt köligt sovevärelse kan hjälpe med at mindske natligt ubehag.',
    section3Body1: 'Visse ting kan udlöse eller forstärke hedeture. De giver inte alla symtom hos alle, men at kende dem hjälper dig med at forstå ditt eget mönster bedre.',
    triggers: [
      'Koffein och alkohol',
      'Stärkt krydret mad',
      'Stress och stärke fölelser',
      'Overophedede rum eller for varmt töj',
    ],
    tip2Title: 'En lille nyttig vane',
    tip2Text: 'Skriv ned i et par veckor, hvornår dina hedeture opstår, hvor intense de ar, och hvad der skete lige inden. Det kan hjälpe dig med at identificere dina personlige triggere.',
    dailyHabits: [
      'Kläd dig i lag med lette stoffer',
      'Hold ditt opholdsrum köligt och godt ventileret',
      'Träk vejret langsomt under en hedeture',
      'Drik regelmässigt koldt vand',
    ],
    section4Body1: 'Disse tiltag eliminerer inte nödvendigvis hedetur fuldständigt, men de kan göre det lettere at håndtere hver enkelt episode och mindske ubehaget.',
    section5Body1: 'Hedeture ar normale i perimenopause och menopause. Alligevel behöver du inte bare at bide det i dig, hvis de ar sväre at bäre. En läge eller jordemoder kan vurdere dina symtom och dröfte de forskellige muligheder med dig.',
    whenAppointmentTitle: 'Hvornår bör du booke en tid?',
    section5Body2: 'En konsultation ar särlig nyttig, hvis symtomne påvirker din dagligdag markant, eller hvis du vil vide, hvilke muligheder der findes.',
    consultReasons: [
      {
        title: 'Når sövnen forstyrres',
        text: 'Hyppige hedeture eller nattesved, der förer till gentagne opvågninger, udtalt träthed eller besvär med at fungere normalt i löbet av dagen.',
      },
      {
        title: 'Når hverdagen bliver svär',
        text: 'Hvis hedeturene hindrer dig i ditt arbejde, dina aktiviteter, rejser, socialt samvär eller blot den daglige komfort.',
      },
      {
        title: 'Når symtomne tiltager',
        text: 'Hvis hyppighed eller intensitet tydeligt stiger, ar det godt at dröfte det for att finde den mest passende lösning.',
      },
      {
        title: 'Hvis du overvejer behandling',
        text: 'Hormonelle och ikke-hormonelle muligheder kan tilbydes afhängigt av din situation. En fagperson kan hjälpe dig med at afveje fordele, risici och eventuelle kontraindikationer.',
      },
    ],
    notMenopauseTitle: 'Tilskriv inte alt overgangsalderen',
    notMenopauseBody: 'Hedeture kan have forskellige årsager. Visse symtom kan hänge sammen med et lägemiddel, en anden helbredstilstand eller en markant ändring i ditt helbred. Hvis noget forekommer usädvanligt, nyt eller särligt intenst, ar det bedre at tale med en fagperson frem for att antage, at det automatisk skyldes overgangsalderen.',
    alertTitle: 'Sög hurtig hjälp',
    alertText: 'Brystsmerter, pludselig åndenöd, en fölelse av besvimelse, pludselig svaghed eller usädvanlig smertegivende hävelse i det ene ben kräver hurtig medicinsk vurdering.',
    emergencySignsTitle: 'Hvilke tegn kräver särlig opmärksomhed?',
    emergencySigns: [
      'Usädvanlige eller kraftige brystsmerter',
      'Pludselig åndenöd eller markante vejrträkningsproblemer',
      'En fölelse av at besvime eller egentlig besvimelse',
      'Pludselig svaghed eller besvär med at tale eller se',
      'Smertefuld, usädvanlig hävelse i det ene ben',
    ],
    solutionsTitle: 'Hvilke lösninger kan du få adgang til?',
    solutionsBody: 'Hvis hedetur ar så ubehagelige, at de kräver håndtering, kan forskellige tilgange overvejes. Afhängigt av din situation kan en fagperson dröfte livsstilstiltag, ikke-hormonelle behandlinger eller hormonbehandling, hvis det ar passende.',
    highlight2Title: 'Behandlingen tilpasses individuelt',
    highlight2Text: 'Alder, symtom, sygehistorik, igangvärende behandlinger och personlige präferencer kan alla påvirke de foreslåede muligheder.',
    prepareTitle: 'Forbered din konsultation',
    prepareBody: 'At have visse oplysninger klar gör konsultationen mere udbytterig. Du kan i et par dagar eller veckor notere, hvor hyppigt de opstår, hvor intense de ar, och hvilken indvirkning de har på din sövn och dina aktiviteter.',
    questionsTitle: 'Nyttige informationer at have klar',
    appointmentQuestions: [
      'Hvor hyppigt har du hedeture?',
      'Hvor länge har du haft dem?',
      'Opstår de typisk om dagen, om natten eller begge dele?',
      'Forstyrrer de din sövn eller dina aktiviteter?',
      'Har du identificeret nogen triggere?',
      'Bruger du aktuelt nogen medicin eller hormonel prävention?',
    ],
    professionalTipText: 'Du behöver inte vente, till symtomne ar uudholdelige. En konsultation kan også hjälpe dig med at forstå, hvad der sker, och informere dig om tilgängelige lösninger.',
    summaryTitle: 'Det vigtigste at huske',
    summaryItems: [
      'Hedeture ar almindelige under overgangsalderen.',
      'At kende dina triggere hjälper dig med at håndtere episoderne bedre.',
      'Enkle vaner kan mindske ubehaget i hverdagen.',
      'Tal med en fagperson, hvis symtomne forstyrrer din sövn eller dagligdag.',
      'Forskellige håndteringsmuligheder kan dröftes afhängigt av din situation.',
    ],
    finalTipText: 'Hedeture ar almindelige, men bör inte ignoreres, hvis de påvirker din sövn, ditt arbejde eller ditt velväre. At lytte till dina symtom och tale med en fagperson kan hjälpe dig med bedre at forstå årsagen och finde en passende lösning.',
    disclaimerText: 'Denne artikel ar udelukkende till informationsformål och erstatter inte personlig medicinsk rådgivning.',
    shareMessage: 'Håndtering av hedeture — AWA',
  },
  nb: {
    badge: 'HETETOKTER',
    title: 'Temme\nhetetoktene',
    metaDuration: '10 min lesing',
    metaType: 'Artikkel',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Hvorfor de oppstår, hvordan du finner utløserne dine, og hvilke løsninger som kan hjelpe når de blir plagsomme.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hvorfor hetetokter oppstår',
      'Nattesvette',
      'Vanlige utløsere',
      'Hverdagsvaner som hjelper',
      'Når du bør snakke med helsepersonell',
      'Det viktigste å huske',
    ],
    section1Body1: 'Hetetokter er svært vanlige under overgangen til menopause. De henger delvis sammen med hormonelle endringer som påvirker hvordan hjernen regulerer kroppstemperaturen.',
    section1Body2: 'En liten endring i kroppstemperaturen kan da kjennes som plutselig varme. Kroppen svarer med å utvide blodkarene i huden, noe som kan gi en følelse av varme, rødme og noen ganger kraftig svetting.',
    highlight1Title: 'Alle er forskjellige',
    highlight1Text: 'Noen kvinner opplever noen få episoder i uken, mens andre kan ha flere om dagen. Styrken og varigheten kan også variere.',
    section2Body1: 'Når de oppstår under søvn, kan hetetokter gi nattesvette. De kan føre til gjentatte oppvåkninger og gjøre søvnen mindre hvilsom.',
    section2Body2: 'Søvnmangel kan deretter øke trettheten, konsentrasjonsvanskene og irritabiliteten i løpet av dagen. Det kan derfor være nyttig å ta søvnkvaliteten med i vurderingen av hvordan symptomene påvirker deg.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Pustende pyjamas, lett sengetøy og et tilstrekkelig kjølig soverom kan bidra til å begrense ubehaget om natten.',
    section3Body1: 'Visse faktorer kan utløse eller forsterke en hetetokt. De gir ikke nødvendigvis symptomer hos alle, men å finne dem kan hjelpe deg å forstå dine egne mønstre bedre.',
    triggers: [
      'Koffein og alkohol',
      'Sterkt krydret mat',
      'Stress og sterke følelser',
      'Et overopphetet rom eller for tunge klær',
    ],
    tip2Title: 'En liten nyttig vane',
    tip2Text: 'Noter i noen uker når hetetoktene kommer, hvor sterke de er, og hva som skjedde rett før. Dette kan hjelpe deg å oppdage dine personlige utløsere.',
    dailyHabits: [
      'Kle deg i lette lag',
      'Hold rommet kjølig og godt ventilert',
      'Øv på langsom pusting under en hetetokt',
      'Drikk kaldt vann jevnlig',
    ],
    section4Body1: 'Disse tiltakene får ikke nødvendigvis hetetoktene til å forsvinne, men de kan gjøre episodene lettere å håndtere og redusere ubehaget når de oppstår.',
    section5Body1: 'Hetetokter er vanlige i overgangsalderen og menopausen. Likevel trenger du ikke bare tåle dem hvis de blir vanskelige å leve med. En lege eller jordmor kan vurdere symptomene dine og diskutere de ulike mulighetene med deg.',
    whenAppointmentTitle: 'Når bør du bestille time?',
    section5Body2: 'En konsultasjon kan være særlig nyttig når symptomene har stor innvirkning på hverdagen din, eller når du vil vite hvilke muligheter som finnes.',
    consultReasons: [
      {
        title: 'Når søvnen er forstyrret',
        text: 'Hyppige hetetokter eller nattesvette som gir gjentatte oppvåkninger, betydelig tretthet eller vansker med å fungere normalt i løpet av dagen.',
      },
      {
        title: 'Når hverdagen blir vanskelig',
        text: 'Hvis hetetoktene forstyrrer arbeidet, aktivitetene, reisene, de sosiale relasjonene eller rett og slett den daglige komforten din.',
      },
      {
        title: 'Når symptomene blir hyppigere',
        text: 'En tydelig økning i hyppigheten eller styrken på symptomene er verdt å ta opp for å finne de mest egnede løsningene.',
      },
      {
        title: 'Hvis du vurderer behandling',
        text: 'Hormonelle og ikke-hormonelle alternativer kan tilbys avhengig av situasjonen din. En fagperson kan hjelpe deg å veie fordeler, risikoer og eventuelle kontraindikasjoner.',
      },
    ],
    notMenopauseTitle: 'Ikke skyld på alt på menopausen',
    notMenopauseBody: 'En hetetokt kan ha ulike årsaker. Noen symptomer kan også henge sammen med et legemiddel, en annen medisinsk tilstand eller en betydelig endring i helsen din. Hvis noe føles uvanlig, nytt eller spesielt intenst, er det best å snakke med en fagperson i stedet for automatisk å anta at det er menopausen.',
    alertTitle: 'Søk hjelp raskt',
    alertText: 'Brystsmerter, plutselig kortpustethet, følelse av å besvime, plutselig svakhet eller uvanlig smertefull hevelse i ett ben krever rask medisinsk hjelp.',
    emergencySignsTitle: 'Hvilke tegn fortjener spesiell oppmerksomhet?',
    emergencySigns: [
      'Uvanlige eller sterke brystsmerter',
      'Plutselig kortpustethet eller betydelige pustevansker',
      'Følelse av å besvime eller å miste bevisstheten',
      'Plutselig svakhet, eller problemer med å snakke eller se',
      'Smertefull, uvanlig hevelse i ett ben',
    ],
    solutionsTitle: 'Hvilke løsninger kan finnes?',
    solutionsBody: 'Hvis hetetoktene er plagsomme nok til at de må håndteres, kan flere tilnærminger vurderes. Avhengig av situasjonen din kan fagpersonen diskutere livsstilstiltak, ikke-hormonelle behandlinger eller, når det er hensiktsmessig, hormonbehandling.',
    highlight2Title: 'Behandling velges fra sak til sak',
    highlight2Text: 'Alder, symptomer, sykehistorie, nåværende behandlinger og personlige preferanser kan alle påvirke hvilke alternativer som tilbys.',
    prepareTitle: 'Forberede timen din',
    prepareBody: 'Å komme med litt informasjon kan gjøre konsultasjonen mer nyttig. Du kan i noen dager eller uker følge med på hvor ofte episodene oppstår, hvor sterke de er, og hvordan de påvirker søvnen eller aktivitetene dine.',
    questionsTitle: 'Nyttig informasjon å forberede',
    appointmentQuestions: [
      'Hvor ofte kommer hetetoktene?',
      'Hvor lenge har du hatt dem?',
      'Kommer de oftest om dagen, om natten eller begge deler?',
      'Forstyrrer de søvnen eller aktivitetene dine?',
      'Har du funnet noen utløsere?',
      'Bruker du for tiden legemidler eller hormonell prevensjon?',
    ],
    professionalTipText: 'Du trenger ikke vente til symptomene blir svært sterke før du snakker om dem. En konsultasjon kan også rett og slett hjelpe deg å forstå hva som skjer og å lære om løsningene som finnes.',
    summaryTitle: 'Det viktigste',
    summaryItems: [
      'Hetetokter er vanlige under overgangen til menopause.',
      'Å finne utløserne dine kan hjelpe deg å håndtere episodene bedre.',
      'Enkle vaner kan redusere ubehaget i hverdagen.',
      'Hvis symptomene forstyrrer søvnen eller hverdagen, bør du snakke med en fagperson.',
      'Flere behandlingsmuligheter kan diskuteres avhengig av situasjonen din.',
    ],
    finalTipText: 'Hetetokter er vanlige, men de bør ikke avfeies når de påvirker søvnen, arbeidet eller velværet ditt. Å være oppmerksom på symptomene og snakke med en fagperson kan hjelpe deg å forstå årsaken bedre og utforske egnede løsninger.',
    disclaimerText: 'Denne artikkelen er kun til informasjon og erstatter ikke personlig medisinsk rådgivning.',
    shareMessage: 'Temme hetetoktene – AWA',
  },
  pl: {
    badge: 'UDERZENIA GORĄCA',
    title: 'Jak okiełznać\nuderzenia gorąca',
    metaDuration: '10 min czytania',
    metaType: 'Artykuł',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Dlaczego się pojawiają, jak rozpoznać swoje czynniki wyzwalające i jakie rozwiązania mogą pomóc, gdy stają się uciążliwe.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Dlaczego pojawiają się uderzenia gorąca',
      'Nocne poty',
      'Częste czynniki wyzwalające',
      'Codzienne nawyki, które pomagają',
      'Kiedy porozmawiać ze specjalistą',
      'Najważniejsze wnioski',
    ],
    section1Body1: 'Uderzenia gorąca są bardzo częste w okresie przejścia do menopauzy. Są częściowo związane ze zmianami hormonalnymi, które wpływają na sposób, w jaki mózg reguluje temperaturę ciała.',
    section1Body2: 'Niewielka zmiana temperatury ciała może być wtedy odczuwana jako nagłe gorąco. Organizm reaguje, rozszerzając naczynia krwionośne w skórze, co może powodować uczucie gorąca, zaczerwienienie i czasem obfite pocenie się.',
    highlight1Title: 'Każda osoba jest inna',
    highlight1Text: 'Niektóre kobiety doświadczają kilku epizodów w tygodniu, inne kilku dziennie. Nasilenie i czas trwania również mogą się różnić.',
    section2Body1: 'Gdy pojawiają się podczas snu, uderzenia gorąca mogą powodować nocne poty. Mogą prowadzić do wielokrotnych przebudzeń i sprawiać, że sen jest mniej regenerujący.',
    section2Body2: 'Brak snu może następnie nasilać zmęczenie, trudności z koncentracją i drażliwość w ciągu dnia. Warto więc uwzględniać jakość snu, oceniając wpływ objawów.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Przewiewna piżama, lekka pościel i dostatecznie chłodna sypialnia mogą pomóc ograniczyć dyskomfort w nocy.',
    section3Body1: 'Niektóre czynniki mogą wywoływać lub nasilać uderzenie gorąca. Niekoniecznie powodują objawy u każdej, ale ich rozpoznanie może pomóc lepiej zrozumieć własne wzorce.',
    triggers: [
      'Kofeina i alkohol',
      'Ostre potrawy',
      'Stres i silne emocje',
      'Przegrzane pomieszczenie lub zbyt ciężka odzież',
    ],
    tip2Title: 'Pomocny mały nawyk',
    tip2Text: 'Przez kilka tygodni zapisuj, kiedy występują uderzenia gorąca, jak są intensywne i co działo się tuż przed nimi. Może to pomóc dostrzec Twoje osobiste czynniki wyzwalające.',
    dailyHabits: [
      'Ubieraj się warstwowo, w lekkie ubrania',
      'Utrzymuj chłód i dobrą wentylację w pomieszczeniu',
      'Ćwicz powolne oddychanie podczas uderzenia gorąca',
      'Regularnie pij chłodną wodę',
    ],
    section4Body1: 'Te środki niekoniecznie sprawią, że uderzenia gorąca znikną, ale mogą ułatwić radzenie sobie z epizodami i zmniejszyć dyskomfort, gdy się pojawią.',
    section5Body1: 'Uderzenia gorąca są częste w perimenopauzie i menopauzie. Mimo to nie musisz po prostu ich znosić, jeśli stają się trudne do wytrzymania. Lekarz lub położna może ocenić Twoje objawy i omówić z Tobą różne możliwości.',
    whenAppointmentTitle: 'Kiedy umówić wizytę?',
    section5Body2: 'Wizyta może być szczególnie pomocna, gdy objawy znacząco wpływają na codzienne życie lub gdy chcesz wiedzieć, jakie są dostępne opcje.',
    consultReasons: [
      {
        title: 'Gdy sen jest zaburzony',
        text: 'Częste uderzenia gorąca lub nocne poty, które powodują wielokrotne przebudzenia, znaczne zmęczenie lub trudności z normalnym funkcjonowaniem w ciągu dnia.',
      },
      {
        title: 'Gdy codzienne życie staje się trudne',
        text: 'Jeśli uderzenia gorąca przeszkadzają w pracy, zajęciach, podróżach, relacjach towarzyskich lub po prostu w codziennym komforcie.',
      },
      {
        title: 'Gdy objawy stają się częstsze',
        text: 'Wyraźny wzrost częstości lub nasilenia objawów warto omówić, aby znaleźć najbardziej odpowiednie rozwiązania.',
      },
      {
        title: 'Jeśli rozważasz leczenie',
        text: 'W zależności od Twojej sytuacji mogą być zaproponowane opcje hormonalne i niehormonalne. Specjalista może pomóc rozważyć ich korzyści, ryzyko i ewentualne przeciwwskazania.',
      },
    ],
    notMenopauseTitle: 'Nie przypisuj wszystkiego menopauzie',
    notMenopauseBody: 'Uderzenie gorąca może mieć różne przyczyny. Niektóre objawy mogą być też związane z lekiem, innym schorzeniem lub znaczną zmianą stanu zdrowia. Jeśli coś wydaje się nietypowe, nowe lub szczególnie nasilone, najlepiej porozmawiać ze specjalistą, zamiast automatycznie zakładać, że to menopauza.',
    alertTitle: 'Szybko zgłoś się po pomoc',
    alertText: 'Ból w klatce piersiowej, nagła duszność, uczucie omdlenia, nagłe osłabienie lub nietypowy, bolesny obrzęk jednej nogi wymagają szybkiej pomocy medycznej.',
    emergencySignsTitle: 'Które objawy zasługują na szczególną uwagę?',
    emergencySigns: [
      'Nietypowy lub silny ból w klatce piersiowej',
      'Nagła duszność lub znaczna trudność w oddychaniu',
      'Uczucie omdlenia lub utrata przytomności',
      'Nagłe osłabienie albo trudności z mówieniem lub widzeniem',
      'Bolesny, nietypowy obrzęk jednej nogi',
    ],
    solutionsTitle: 'Jakie rozwiązania mogą być dostępne?',
    solutionsBody: 'Jeśli uderzenia gorąca są na tyle uciążliwe, że wymagają leczenia, można rozważyć kilka podejść. W zależności od sytuacji specjalista może omówić zmiany stylu życia, leczenie niehormonalne lub, gdy jest to właściwe, terapię hormonalną.',
    highlight2Title: 'Leczenie dobiera się indywidualnie',
    highlight2Text: 'Na proponowane opcje mogą wpływać wiek, objawy, historia medyczna, aktualne leczenie i osobiste preferencje.',
    prepareTitle: 'Przygotowanie do wizyty',
    prepareBody: 'Przybycie z pewnymi informacjami może uczynić wizytę bardziej pożyteczną. Możesz przez kilka dni lub tygodni zapisywać, jak często występują epizody, jak są intensywne i jaki mają wpływ na sen lub aktywności.',
    questionsTitle: 'Pomocne informacje do przygotowania',
    appointmentQuestions: [
      'Jak często występują Twoje uderzenia gorąca?',
      'Od jak dawna ich doświadczasz?',
      'Czy zwykle pojawiają się w ciągu dnia, w nocy, czy w obu porach?',
      'Czy zakłócają Twój sen lub aktywności?',
      'Czy rozpoznałaś jakieś czynniki wyzwalające?',
      'Czy obecnie przyjmujesz jakiekolwiek leki lub antykoncepcję hormonalną?',
    ],
    professionalTipText: 'Nie musisz czekać, aż objawy staną się bardzo nasilone, by o nich porozmawiać. Wizyta może też po prostu pomóc zrozumieć, co się dzieje, i poznać dostępne rozwiązania.',
    summaryTitle: 'Najważniejsze',
    summaryItems: [
      'Uderzenia gorąca są częste w okresie przejścia do menopauzy.',
      'Rozpoznanie czynników wyzwalających może pomóc lepiej radzić sobie z epizodami.',
      'Proste nawyki mogą zmniejszyć codzienny dyskomfort.',
      'Jeśli objawy zakłócają sen lub codzienne życie, porozmawiaj ze specjalistą.',
      'W zależności od sytuacji można omówić kilka sposobów postępowania.',
    ],
    finalTipText: 'Uderzenia gorąca są częste, ale nie należy ich lekceważyć, gdy wpływają na sen, pracę lub samopoczucie. Zwrócenie uwagi na objawy i rozmowa ze specjalistą mogą pomóc lepiej zrozumieć ich przyczynę i poznać odpowiednie rozwiązania.',
    disclaimerText: 'Ten artykuł ma charakter wyłącznie informacyjny i nie zastępuje spersonalizowanej porady medycznej.',
    shareMessage: 'Jak okiełznać uderzenia gorąca — AWA',
  },
  uk: {
    badge: 'ПРИПЛИВИ',
    title: 'Як приборкати\nприпливи',
    metaDuration: '10 хв читання',
    metaType: 'Стаття',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Чому вони виникають, як розпізнати свої тригери та які рішення можуть допомогти, коли вони стають прикрими.',
    contentsTitle: 'У цій статті',
    topics: [
      'Чому виникають припливи',
      'Нічне потовиділення',
      'Поширені тригери',
      'Щоденні звички, що допомагають',
      'Коли поговорити зі спеціалістом',
      'Головні висновки',
    ],
    section1Body1: 'Припливи дуже поширені під час переходу до менопаузи. Вони частково пов’язані з гормональними змінами, що впливають на те, як мозок регулює температуру тіла.',
    section1Body2: 'Невелика зміна температури тіла тоді може відчуватися як раптовий жар. Організм реагує, розширюючи кровоносні судини в шкірі, що може спричиняти відчуття жару, почервоніння й іноді рясне потовиділення.',
    highlight1Title: 'Кожна людина різна',
    highlight1Text: 'Деякі жінки переживають кілька епізодів на тиждень, інші — по кілька на день. Інтенсивність і тривалість також можуть різнитися.',
    section2Body1: 'Коли вони виникають під час сну, припливи можуть спричиняти нічне потовиділення. Вони можуть призводити до повторних пробуджень і робити сон менш відновлювальним.',
    section2Body2: 'Брак сну може потім посилювати втому, труднощі з концентрацією та дратівливість протягом дня. Тому доцільно враховувати якість сну, оцінюючи вплив симптомів.',
    tip1Title: 'Варто знати',
    tip1Text: 'Піжама, що дихає, легка постіль і достатньо прохолодна спальня можуть допомогти обмежити дискомфорт уночі.',
    section3Body1: 'Деякі чинники можуть викликати або посилювати прилив. Вони не обов’язково спричиняють симптоми в кожної, але їх розпізнавання може допомогти краще зрозуміти власні закономірності.',
    triggers: [
      'Кофеїн і алкоголь',
      'Гострі страви',
      'Стрес і сильні емоції',
      'Перегріте приміщення або надто важкий одяг',
    ],
    tip2Title: 'Корисна маленька звичка',
    tip2Text: 'Протягом кількох тижнів записуйте, коли виникають ваші припливи, наскільки вони інтенсивні та що відбувалося безпосередньо перед ними. Це може допомогти виявити ваші особисті тригери.',
    dailyHabits: [
      'Одягайтеся шарами, у легкі речі',
      'Підтримуйте прохолоду й добру вентиляцію у приміщенні',
      'Практикуйте повільне дихання під час припливу',
      'Регулярно пийте прохолодну воду',
    ],
    section4Body1: 'Ці заходи не обов’язково змусять припливи зникнути, але можуть полегшити справляння з епізодами й зменшити дискомфорт, коли вони виникають.',
    section5Body1: 'Припливи поширені в перименопаузі та менопаузі. Проте вам не потрібно просто їх терпіти, якщо вони стають важкими. Лікар чи акушерка може оцінити ваші симптоми й обговорити з вами різні варіанти.',
    whenAppointmentTitle: 'Коли записатися на візит?',
    section5Body2: 'Консультація може бути особливо корисною, коли симптоми значно впливають на ваше щоденне життя або коли ви хочете знати, які існують варіанти.',
    consultReasons: [
      {
        title: 'Коли сон порушений',
        text: 'Часті припливи чи нічне потовиділення, що спричиняють повторні пробудження, значну втому або труднощі з нормальним функціонуванням удень.',
      },
      {
        title: 'Коли повсякденне життя стає важким',
        text: 'Якщо припливи заважають вашій роботі, заняттям, подорожам, соціальним стосункам чи просто повсякденному комфорту.',
      },
      {
        title: 'Коли симптоми стають частішими',
        text: 'Виразне збільшення частоти чи інтенсивності симптомів варто обговорити, щоб знайти найвідповідніші рішення.',
      },
      {
        title: 'Якщо ви розглядаєте лікування',
        text: 'Залежно від вашої ситуації можуть бути запропоновані гормональні й негормональні варіанти. Фахівець може допомогти зважити їхні переваги, ризики та можливі протипоказання.',
      },
    ],
    notMenopauseTitle: 'Не приписуйте все менопаузі',
    notMenopauseBody: 'Прилив може мати різні причини. Деякі симптоми також можуть бути пов’язані з ліками, іншим захворюванням чи значною зміною стану здоров’я. Якщо щось здається нетиповим, новим чи особливо інтенсивним, найкраще поговорити зі спеціалістом, а не автоматично припускати, що це менопауза.',
    alertTitle: 'Швидко зверніться по допомогу',
    alertText: 'Біль у грудях, раптова задишка, відчуття непритомності, раптова слабкість або нетиповий болісний набряк однієї ноги потребують швидкої медичної допомоги.',
    emergencySignsTitle: 'Які ознаки заслуговують на особливу увагу?',
    emergencySigns: [
      'Нетиповий або сильний біль у грудях',
      'Раптова задишка або значне утруднення дихання',
      'Відчуття непритомності або втрата свідомості',
      'Раптова слабкість або труднощі з мовленням чи зором',
      'Болісний, нетиповий набряк однієї ноги',
    ],
    solutionsTitle: 'Які рішення можуть бути доступні?',
    solutionsBody: 'Якщо припливи настільки прикрі, що потребують лікування, можна розглянути кілька підходів. Залежно від вашої ситуації фахівець може обговорити зміни способу життя, негормональне лікування або, за доречності, гормональну терапію.',
    highlight2Title: 'Лікування обирають індивідуально',
    highlight2Text: 'На запропоновані варіанти можуть впливати вік, симптоми, медична історія, поточне лікування та особисті уподобання.',
    prepareTitle: 'Підготовка до візиту',
    prepareBody: 'Приходьте з деякою інформацією — так консультація буде корисніша. Ви можете протягом кількох днів чи тижнів відстежувати, як часто виникають епізоди, наскільки вони інтенсивні та як впливають на ваш сон чи активність.',
    questionsTitle: 'Корисна інформація для підготовки',
    appointmentQuestions: [
      'Як часто виникають ваші припливи?',
      'Як довго ви їх відчуваєте?',
      'Вони зазвичай виникають удень, уночі чи в обидва періоди?',
      'Вони порушують ваш сон чи активність?',
      'Чи розпізнали ви якісь тригери?',
      'Чи приймаєте ви зараз якісь ліки чи гормональну контрацепцію?',
    ],
    professionalTipText: 'Вам не потрібно чекати, поки симптоми стануть дуже сильними, щоб про них поговорити. Консультація також може просто допомогти зрозуміти, що відбувається, і дізнатися про доступні рішення.',
    summaryTitle: 'Головне',
    summaryItems: [
      'Припливи поширені під час переходу до менопаузи.',
      'Розпізнавання тригерів може допомогти краще справлятися з епізодами.',
      'Прості звички можуть зменшити щоденний дискомфорт.',
      'Якщо симптоми порушують сон чи щоденне життя, поговоріть зі спеціалістом.',
      'Залежно від вашої ситуації можна обговорити кілька способів ведення.',
    ],
    finalTipText: 'Припливи поширені, але їх не слід применшувати, коли вони впливають на сон, роботу чи самопочуття. Увага до симптомів і розмова зі спеціалістом можуть допомогти краще зрозуміти їхню причину й дослідити відповідні рішення.',
    disclaimerText: 'Ця стаття має виключно інформаційний характер і не замінює персоналізованої медичної поради.',
    shareMessage: 'Як приборкати припливи — AWA',
  },
  cs: {
    badge: 'NÁVALY HORKA',
    title: 'Zvládání\nnávalů horka',
    metaDuration: '10 min čtení',
    metaType: 'Článek',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Proč vznikají, jak rozpoznat své spouštěče a jaká řešení mohou pomoci, když začnou obtěžovat.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Proč vznikají návaly horka',
      'Noční pocení',
      'Časté spouštěče',
      'Každodenní návyky, které pomáhají',
      'Kdy si promluvit s odborníkem',
      'Hlavní poznatky',
    ],
    section1Body1: 'Návaly horka jsou při přechodu do menopauzy velmi časté. Souvisejí částečně s hormonálními změnami, které ovlivňují, jak mozek reguluje tělesnou teplotu.',
    section1Body2: 'Malý posun tělesné teploty se pak může projevit jako náhlé horko. Tělo reaguje rozšířením cév v kůži, což může způsobit pocit horka, zrudnutí a někdy silné pocení.',
    highlight1Title: 'Každá žena je jiná',
    highlight1Text: 'Některé ženy zažívají několik epizod týdně, jiné jich mohou mít několik denně. Liší se také intenzita a délka.',
    section2Body1: 'Když se objeví ve spánku, mohou návaly horka způsobit noční pocení. Mohou vést k opakovanému probouzení a způsobit, že je spánek méně odpočinkový.',
    section2Body2: 'Nedostatek spánku pak může přes den zvyšovat únavu, potíže se soustředěním a podrážděnost. Proto může být užitečné zahrnout kvalitu spánku do hodnocení dopadu vašich příznaků.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Prodyšné pyžamo, lehké povlečení a dostatečně chladná ložnice mohou pomoci omezit nepohodlí v noci.',
    section3Body1: 'Některé faktory mohou návaly horka spouštět nebo zesilovat. Nemusí příznaky způsobovat u každé ženy, ale jejich rozpoznání vám může pomoci lépe pochopit vlastní vzorce.',
    triggers: [
      'Kofein a alkohol',
      'Pikantní jídla',
      'Stres a silné emoce',
      'Přetopená místnost nebo příliš těžké oblečení',
    ],
    tip2Title: 'Užitečný malý návyk',
    tip2Text: 'Po několik týdnů si poznamenávejte, kdy se návaly horka objevují, jak jsou intenzivní a co se stalo bezprostředně před nimi. Pomůže vám to odhalit vlastní spouštěče.',
    dailyHabits: [
      'Oblékejte se do lehkých vrstev',
      'Udržujte prostor chladný a dobře větraný',
      'Během návalu horka zkuste pomalé dýchání',
      'Pravidelně pijte chladnou vodu',
    ],
    section4Body1: 'Tato opatření nemusí návaly horka nutně odstranit, ale mohou epizody usnadnit zvládání a snížit nepohodlí, když se objeví.',
    section5Body1: 'Návaly horka jsou v perimenopauze a menopauze běžné. Přesto je nemusíte jen trpně snášet, pokud je těžké s nimi žít. Lékař nebo porodní asistentka může vaše příznaky posoudit a probrat s vámi různé možnosti.',
    whenAppointmentTitle: 'Kdy se objednat?',
    section5Body2: 'Konzultace může být zvlášť užitečná, když mají příznaky výrazný dopad na váš každodenní život nebo když chcete vědět, jaké možnosti existují.',
    consultReasons: [
      {
        title: 'Když je spánek narušený',
        text: 'Časté návaly horka nebo noční pocení, které způsobují opakované probouzení, výraznou únavu nebo potíže normálně fungovat přes den.',
      },
      {
        title: 'Když je každodenní život obtížný',
        text: 'Pokud návaly horka narušují vaši práci, aktivity, cestování, společenské vztahy nebo prostě každodenní pohodlí.',
      },
      {
        title: 'Když se příznaky stávají častějšími',
        text: 'Výrazný nárůst četnosti nebo intenzity příznaků stojí za probrání, abyste našla nejvhodnější řešení.',
      },
      {
        title: 'Pokud zvažujete léčbu',
        text: 'Podle vaší situace mohou být nabídnuty hormonální i nehormonální možnosti. Odborník vám může pomoci zvážit jejich přínosy, rizika a případné kontraindikace.',
      },
    ],
    notMenopauseTitle: 'Nepřipisujte vše menopauze',
    notMenopauseBody: 'Návaly horka mohou mít různé příčiny. Některé příznaky mohou souviset také s lékem, jiným zdravotním onemocněním nebo výraznou změnou zdraví. Pokud se vám něco zdá neobvyklé, nové nebo zvlášť intenzivní, je lepší promluvit si s odborníkem, než automaticky předpokládat menopauzu.',
    alertTitle: 'Vyhledejte péči neprodleně',
    alertText: 'Bolest na hrudi, náhlá dušnost, pocit na omdlení, náhlá slabost nebo neobvyklý bolestivý otok jedné nohy vyžadují neodkladnou lékařskou pomoc.',
    emergencySignsTitle: 'Které příznaky si zaslouží zvláštní pozornost?',
    emergencySigns: [
      'Neobvyklá nebo silná bolest na hrudi',
      'Náhlá dušnost nebo výrazné potíže s dýcháním',
      'Pocit na omdlení nebo ztráta vědomí',
      'Náhlá slabost nebo potíže s řečí či viděním',
      'Bolestivý, neobvyklý otok jedné nohy',
    ],
    solutionsTitle: 'Jaká řešení mohou být k dispozici?',
    solutionsBody: 'Pokud jsou návaly horka natolik obtěžující, že vyžadují řešení, lze zvážit několik přístupů. Podle vaší situace může odborník probrat opatření v životním stylu, nehormonální léčbu nebo, je-li to vhodné, hormonální terapii.',
    highlight2Title: 'Léčba se volí případ od případu',
    highlight2Text: 'Nabízené možnosti může ovlivnit věk, příznaky, zdravotní anamnéza, současná léčba i osobní preference.',
    prepareTitle: 'Příprava na návštěvu',
    prepareBody: 'Přijít s několika informacemi může konzultaci učinit užitečnější. Po několik dní nebo týdnů můžete sledovat, jak často se epizody objevují, jak jsou intenzivní a jaký mají dopad na váš spánek nebo aktivity.',
    questionsTitle: 'Užitečné informace k přípravě',
    appointmentQuestions: [
      'Jak často se vaše návaly horka objevují?',
      'Jak dlouho je pociťujete?',
      'Objevují se spíše přes den, v noci, nebo obojí?',
      'Narušují váš spánek nebo aktivity?',
      'Rozpoznala jste nějaké spouštěče?',
      'Užíváte v současnosti nějaké léky nebo hormonální antikoncepci?',
    ],
    professionalTipText: 'Nemusíte čekat, až budou příznaky velmi silné, než o nich promluvíte. Konzultace vám také může jednoduše pomoci pochopit, co se děje, a seznámit se s dostupnými řešeními.',
    summaryTitle: 'To nejdůležitější',
    summaryItems: [
      'Návaly horka jsou při přechodu do menopauzy běžné.',
      'Rozpoznání spouštěčů vám může pomoci lépe zvládat epizody.',
      'Jednoduché návyky mohou snížit každodenní nepohodlí.',
      'Pokud příznaky narušují spánek nebo každodenní život, promluvte si s odborníkem.',
      'Podle vaší situace lze probrat několik možností řešení.',
    ],
    finalTipText: 'Návaly horka jsou běžné, ale neměly by se bagatelizovat, když ovlivňují váš spánek, práci nebo pohodu. Pozornost k příznakům a rozhovor s odborníkem vám mohou pomoci lépe pochopit jejich příčinu a prozkoumat vhodná řešení.',
    disclaimerText: 'Tento článek je pouze informativní a nenahrazuje individuální lékařskou radu.',
    shareMessage: 'Zvládání návalů horka — AWA',
  },
  sk: {
    badge: 'VLNY HORÚČAVY',
    title: 'Ako zvládnuť\nvlny horúčavy',
    metaDuration: '10 min čítania',
    metaType: 'Článok',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Prečo vznikajú, ako zistiť svoje spúšťače a aké riešenia môžu pomôcť, keď sa stanú obťažujúcimi.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Prečo vznikajú vlny horúčavy',
      'Nočné potenie',
      'Časté spúšťače',
      'Každodenné návyky, ktoré pomáhajú',
      'Kedy sa porozprávať s odborníkom',
      'Hlavné body',
    ],
    section1Body1: 'Vlny horúčavy sú pri prechode do menopauzy veľmi časté. Čiastočne súvisia s hormonálnymi zmenami, ktoré ovplyvňujú, ako mozog reguluje telesnú teplotu.',
    section1Body2: 'Malá zmena telesnej teploty sa potom môže prejaviť ako náhla horúčava. Telo reaguje rozšírením ciev v koži, čo môže spôsobiť pocit tepla, začervenanie a niekedy silné potenie.',
    highlight1Title: 'Každá žena je iná',
    highlight1Text: 'Niektoré ženy zažívajú niekoľko epizód týždenne, iné aj niekoľko denne. Intenzita a trvanie sa tiež môžu líšiť.',
    section2Body1: 'Keď nastanú počas spánku, vlny horúčavy môžu spôsobiť nočné potenie. Môžu viesť k opakovanému budeniu a spánok robiť menej oddychovým.',
    section2Body2: 'Nedostatok spánku potom cez deň môže zvýšiť únavu, ťažkosti s koncentráciou a podráždenosť. Preto môže byť užitočné zahrnúť kvalitu spánku do posúdenia vplyvu príznakov.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Priedušné pyžamo, ľahká posteľná bielizeň a dostatočne chladná spálňa môžu pomôcť obmedziť nepohodlie v noci.',
    section3Body1: 'Niektoré faktory môžu vlnu horúčavy spustiť alebo zosilniť. Nemusia spôsobovať príznaky u každej, ale ich zistenie vám môže pomôcť lepšie pochopiť vlastné vzorce.',
    triggers: [
      'Kofeín a alkohol',
      'Korenené jedlá',
      'Stres a silné emócie',
      'Prehriata miestnosť alebo príliš ťažké oblečenie',
    ],
    tip2Title: 'Užitočný malý návyk',
    tip2Text: 'Niekoľko týždňov si zapisujte, kedy vlny horúčavy nastanú, aká je ich intenzita a čo sa stalo tesne predtým. Pomôže vám to odhaliť vaše osobné spúšťače.',
    dailyHabits: [
      'Obliekajte sa do ľahkých vrstiev',
      'Udržiavajte priestor chladný a dobre vetraný',
      'Počas vlny horúčavy cvičte pomalé dýchanie',
      'Pravidelne pite studenú vodu',
    ],
    section4Body1: 'Tieto opatrenia nemusia vlny horúčavy odstrániť, ale môžu epizódy uľahčiť zvládnuť a zmierniť nepohodlie, keď nastanú.',
    section5Body1: 'Vlny horúčavy sú bežné počas perimenopauzy a menopauzy. Napriek tomu ich nemusíte jednoducho trpieť, ak sa stanú ťažko znesiteľnými. Lekár alebo pôrodná asistentka môže posúdiť vaše príznaky a prediskutovať s vami rôzne možnosti.',
    whenAppointmentTitle: 'Kedy sa objednať?',
    section5Body2: 'Konzultácia môže byť obzvlášť užitočná, keď majú príznaky výrazný vplyv na váš každodenný život alebo keď by ste chceli vedieť, aké možnosti sú k dispozícii.',
    consultReasons: [
      {
        title: 'Keď je narušený spánok',
        text: 'Časté vlny horúčavy alebo nočné potenie, ktoré spôsobujú opakované budenie, výraznú únavu alebo ťažkosti normálne fungovať cez deň.',
      },
      {
        title: 'Keď sa každodenný život stáva náročným',
        text: 'Ak vlny horúčavy zasahujú do vašej práce, aktivít, cestovania, spoločenských vzťahov alebo jednoducho do každodenného pohodlia.',
      },
      {
        title: 'Keď sa príznaky stávajú častejšími',
        text: 'Zreteľné zvýšenie frekvencie alebo intenzity príznakov stojí za rozhovor, aby sa našli najvhodnejšie riešenia.',
      },
      {
        title: 'Ak uvažujete o liečbe',
        text: 'Podľa vašej situácie sa môžu ponúknuť hormonálne aj nehormonálne možnosti. Odborník vám môže pomôcť zvážiť ich prínosy, riziká a prípadné kontraindikácie.',
      },
    ],
    notMenopauseTitle: 'Nepripisujte všetko menopauze',
    notMenopauseBody: 'Vlna horúčavy môže mať rôzne príčiny. Niektoré príznaky môžu súvisieť aj s liekom, iným zdravotným stavom alebo výraznou zmenou vášho zdravia. Ak sa vám niečo zdá nezvyčajné, nové alebo obzvlášť intenzívne, je najlepšie porozprávať sa s odborníkom, namiesto toho, aby ste automaticky predpokladali menopauzu.',
    alertTitle: 'Vyhľadajte rýchlo pomoc',
    alertText: 'Bolesť na hrudi, náhla dýchavičnosť, pocit na odpadnutie, náhla slabosť alebo nezvyčajný bolestivý opuch jednej nohy vyžadujú rýchlu lekársku pomoc.',
    emergencySignsTitle: 'Ktoré znaky si zaslúžia osobitnú pozornosť?',
    emergencySigns: [
      'Nezvyčajná alebo silná bolesť na hrudi',
      'Náhla dýchavičnosť alebo výrazné ťažkosti s dýchaním',
      'Pocit na odpadnutie alebo strata vedomia',
      'Náhla slabosť alebo ťažkosti s rečou či zrakom',
      'Bolestivý, nezvyčajný opuch jednej nohy',
    ],
    solutionsTitle: 'Aké riešenia môžu byť dostupné?',
    solutionsBody: 'Ak sú vlny horúčavy natoľko obťažujúce, že vyžadujú zvládanie, možno zvážiť niekoľko prístupov. Podľa vašej situácie môže odborník prediskutovať opatrenia v životnom štýle, nehormonálne liečby alebo, keď je to vhodné, hormonálnu terapiu.',
    highlight2Title: 'Liečba sa volí individuálne',
    highlight2Text: 'Vek, príznaky, zdravotná anamnéza, súčasná liečba a osobné preferencie môžu ovplyvniť ponúkané možnosti.',
    prepareTitle: 'Príprava na návštevu',
    prepareBody: 'Ak prídete s niekoľkými informáciami, konzultácia môže byť užitočnejšia. Počas niekoľkých dní či týždňov môžete sledovať, ako často epizódy nastávajú, aké sú intenzívne a aký majú vplyv na spánok alebo aktivity.',
    questionsTitle: 'Užitočné informácie na prípravu',
    appointmentQuestions: [
      'Ako často sa vaše vlny horúčavy objavujú?',
      'Ako dlho ich zažívate?',
      'Objavujú sa skôr cez deň, v noci, alebo oboje?',
      'Narúšajú váš spánok alebo aktivity?',
      'Zistili ste nejaké spúšťače?',
      'Užívate momentálne nejaké lieky alebo hormonálnu antikoncepciu?',
    ],
    professionalTipText: 'Nemusíte čakať, kým sa príznaky stanú veľmi silnými, aby ste o nich hovorili. Konzultácia vám môže jednoducho pomôcť pochopiť, čo sa deje, a zoznámiť sa s dostupnými riešeniami.',
    summaryTitle: 'To najdôležitejšie',
    summaryItems: [
      'Vlny horúčavy sú pri prechode do menopauzy bežné.',
      'Zistenie spúšťačov vám môže pomôcť lepšie zvládať epizódy.',
      'Jednoduché návyky môžu zmierniť každodenné nepohodlie.',
      'Ak príznaky narúšajú spánok alebo každodenný život, porozprávajte sa s odborníkom.',
      'Podľa vašej situácie možno prediskutovať niekoľko možností zvládania.',
    ],
    finalTipText: 'Vlny horúčavy sú bežné, ale nemali by sa ignorovať, keď ovplyvňujú váš spánok, prácu alebo pohodu. Pozornosť voči príznakom a rozhovor s odborníkom vám môžu pomôcť lepšie pochopiť ich príčinu a preskúmať vhodné riešenia.',
    disclaimerText: 'Tento článok má iba informatívny charakter a nenahrádza individuálnu lekársku radu.',
    shareMessage: 'Ako zvládnuť vlny horúčavy — AWA',
  },
  hu: {
    badge: 'HŐHULLÁMOK',
    title: 'A hőhullámok\nmegszelídítése',
    metaDuration: '10 perc olvasás',
    metaType: 'Cikk',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Miért lépnek fel, hogyan azonosítsd a kiváltó okaidat, és milyen megoldások segíthetnek, ha zavaróvá válnak.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Miért lépnek fel a hőhullámok',
      'Éjszakai izzadás',
      'Gyakori kiváltó okok',
      'Mindennapi szokások, amelyek segítenek',
      'Mikor beszélj szakemberrel',
      'Legfontosabb tudnivalók',
    ],
    section1Body1: 'A hőhullámok nagyon gyakoriak a menopauzába vezető átmenet során. Részben azokhoz a hormonális változásokhoz kapcsolódnak, amelyek befolyásolják, hogyan szabályozza az agy a testhőmérsékletet.',
    section1Body2: 'A testhőmérséklet kis eltolódása ilyenkor hirtelen hőségként érződhet. A szervezet a bőr ereinek tágításával reagál, ami hőérzetet, kipirulást és néha erős izzadást okozhat.',
    highlight1Title: 'Minden nő más',
    highlight1Text: 'Egyes nők hetente néhány epizódot élnek át, mások naponta többet is. Az erősség és az időtartam is eltérő lehet.',
    section2Body1: 'Ha alvás közben jelentkeznek, a hőhullámok éjszakai izzadást okozhatnak. Ismételt ébredésekhez vezethetnek, és kevésbé pihentetővé tehetik az alvást.',
    section2Body2: 'Az alváshiány napközben fokozhatja a fáradtságot, a koncentrációs nehézséget és az ingerlékenységet. Ezért hasznos lehet az alvás minőségét is figyelembe venni a tünetek hatásának értékelésekor.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'A légáteresztő pizsama, a könnyű ágynemű és a kellően hűvös hálószoba segíthet korlátozni az éjszakai kellemetlenséget.',
    section3Body1: 'Bizonyos tényezők kiválthatnak vagy felerősíthetnek egy hőhullámot. Nem biztos, hogy mindenkinél okoznak tüneteket, de azonosításuk segíthet jobban megérteni a saját mintáidat.',
    triggers: [
      'Koffein és alkohol',
      'Csípős ételek',
      'Stressz és erős érzelmek',
      'Túlfűtött helyiség vagy túl nehéz ruházat',
    ],
    tip2Title: 'Hasznos kis szokás',
    tip2Text: 'Néhány héten át jegyezd fel, mikor jelentkeznek a hőhullámaid, mennyire erősek, és mi történt közvetlenül előtte. Ez segíthet felismerni a személyes kiváltó okaidat.',
    dailyHabits: [
      'Öltözz könnyű rétegekbe',
      'Tartsd a környezeted hűvösen és jól szellőztetve',
      'Gyakorolj lassú légzést a hőhullám alatt',
      'Rendszeresen igyál hűvös vizet',
    ],
    section4Body1: 'Ezek az intézkedések nem feltétlenül tüntetik el a hőhullámokat, de megkönnyíthetik az epizódok kezelését, és csökkenthetik a kellemetlenséget, amikor jelentkeznek.',
    section5Body1: 'A hőhullámok gyakoriak a perimenopauza és a menopauza alatt. Ennek ellenére nem kell egyszerűen eltűrnöd őket, ha nehezen elviselhetővé válnak. Egy orvos vagy szülésznő felmérheti a tüneteidet, és megbeszélheti veled a különböző lehetőségeket.',
    whenAppointmentTitle: 'Mikor kérj időpontot?',
    section5Body2: 'Egy konzultáció különösen hasznos lehet, ha a tünetek jelentős hatással vannak a mindennapjaidra, vagy ha szeretnéd tudni, milyen lehetőségek állnak rendelkezésre.',
    consultReasons: [
      {
        title: 'Ha az alvásod zavart',
        text: 'Gyakori hőhullámok vagy éjszakai izzadás, amelyek ismételt ébredéseket, jelentős fáradtságot vagy a napközbeni normális működés nehézségét okozzák.',
      },
      {
        title: 'Ha a mindennapok nehézzé válnak',
        text: 'Ha a hőhullámok zavarják a munkádat, tevékenységeidet, utazásaidat, társas kapcsolataidat, vagy egyszerűen a mindennapi kényelmedet.',
      },
      {
        title: 'Ha a tünetek gyakoribbá válnak',
        text: 'A tünetek gyakoriságának vagy erősségének egyértelmű növekedése érdemes a megbeszélésre, hogy megtaláljátok a legmegfelelőbb megoldásokat.',
      },
      {
        title: 'Ha kezelésen gondolkodsz',
        text: 'A helyzetedtől függően hormonális és nem hormonális lehetőségeket is felajánlhatnak. Egy szakember segíthet mérlegelni az előnyeiket, kockázataikat és az esetleges ellenjavallatokat.',
      },
    ],
    notMenopauseTitle: 'Ne tulajdoníts mindent a menopauzának',
    notMenopauseBody: 'A hőhullámnak különböző okai lehetnek. Egyes tünetek gyógyszerrel, más egészségügyi állapottal vagy az egészséged jelentős változásával is összefügghetnek. Ha valami szokatlannak, újnak vagy különösen intenzívnek tűnik, jobb szakemberrel beszélni, ahelyett hogy automatikusan menopauzát feltételeznél.',
    alertTitle: 'Gyorsan kérj ellátást',
    alertText: 'Mellkasi fájdalom, hirtelen fellépő légszomj, ájulásérzés, hirtelen gyengeség vagy az egyik láb szokatlan fájdalmas duzzanata sürgős orvosi ellátást igényel.',
    emergencySignsTitle: 'Mely jelekre érdemes különösen figyelni?',
    emergencySigns: [
      'Szokatlan vagy erős mellkasi fájdalom',
      'Hirtelen légszomj vagy jelentős légzési nehézség',
      'Ájulásérzés vagy eszméletvesztés',
      'Hirtelen gyengeség, beszéd- vagy látászavar',
      'Az egyik láb fájdalmas, szokatlan duzzanata',
    ],
    solutionsTitle: 'Milyen megoldások állhatnak rendelkezésre?',
    solutionsBody: 'Ha a hőhullámok annyira zavaróak, hogy kezelést igényelnek, több megközelítés is szóba jöhet. A helyzetedtől függően a szakember életmódbeli intézkedéseket, nem hormonális kezeléseket vagy — ha helyénvaló — hormonterápiát is megbeszélhet veled.',
    highlight2Title: 'A kezelést esetenként választják',
    highlight2Text: 'Az életkor, a tünetek, az orvosi előzmények, a jelenlegi kezelések és a személyes preferenciák mind befolyásolhatják a felajánlott lehetőségeket.',
    prepareTitle: 'Felkészülés az időpontra',
    prepareBody: 'Ha egy kis információval érkezel, a konzultáció hasznosabb lehet. Néhány napon vagy héten át követheted, milyen gyakran jelentkeznek az epizódok, mennyire erősek, és milyen hatással vannak az alvásodra vagy a tevékenységeidre.',
    questionsTitle: 'Hasznos információk az előkészülethez',
    appointmentQuestions: [
      'Milyen gyakran jelentkeznek a hőhullámaid?',
      'Mióta tapasztalod őket?',
      'Inkább napközben, éjszaka, vagy mindkettőkor jelentkeznek?',
      'Megzavarják az alvásodat vagy a tevékenységeidet?',
      'Azonosítottál kiváltó okokat?',
      'Szedsz jelenleg gyógyszert vagy hormonális fogamzásgátlót?',
    ],
    professionalTipText: 'Nem kell megvárnod, hogy a tünetek nagyon súlyossá váljanak, mielőtt beszélsz róluk. Egy konzultáció egyszerűen segíthet megérteni, mi történik, és megismerni a rendelkezésre álló megoldásokat.',
    summaryTitle: 'A lényeg',
    summaryItems: [
      'A hőhullámok gyakoriak a menopauzába vezető átmenet során.',
      'A kiváltó okaid azonosítása segíthet jobban kezelni az epizódokat.',
      'Egyszerű szokások csökkenthetik a mindennapi kellemetlenséget.',
      'Ha a tünetek zavarják az alvásodat vagy a mindennapjaidat, beszélj szakemberrel.',
      'A helyzetedtől függően több kezelési lehetőség is megbeszélhető.',
    ],
    finalTipText: 'A hőhullámok gyakoriak, de nem szabad félresöpörni őket, ha befolyásolják az alvásodat, a munkádat vagy a jóléted. A tüneteidre való odafigyelés és a szakemberrel való beszélgetés segíthet jobban megérteni az okukat és megfelelő megoldásokat keresni.',
    disclaimerText: 'Ez a cikk kizárólag tájékoztató jellegű, és nem helyettesíti a személyre szabott orvosi tanácsot.',
    shareMessage: 'A hőhullámok megszelídítése — AWA',
  },
  ro: {
    badge: 'BUFEURI',
    title: 'Îmblânzirea\nbufeurilor',
    metaDuration: '10 min de citit',
    metaType: 'Articol',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'De ce apar, cum îți identifici factorii declanșatori și ce soluții pot ajuta atunci când devin deranjante.',
    contentsTitle: 'În acest articol',
    topics: [
      'De ce apar bufeurile',
      'Transpirațiile nocturne',
      'Factori declanșatori frecvenți',
      'Obiceiuri zilnice care ajută',
      'Când să vorbești cu un profesionist',
      'Ce să reții',
    ],
    section1Body1: 'Bufeurile sunt foarte frecvente în timpul tranziției spre menopauză. Ele sunt legate în parte de schimbările hormonale care afectează modul în care creierul reglează temperatura corpului.',
    section1Body2: 'O mică variație a temperaturii corpului poate fi resimțită apoi ca o căldură bruscă. Corpul răspunde dilatând vasele de sânge din piele, ceea ce poate provoca o senzație de căldură, înroșire a pielii și, uneori, transpirație abundentă.',
    highlight1Title: 'Fiecare persoană este diferită',
    highlight1Text: 'Unele femei trăiesc câteva episoade pe săptămână, în timp ce altele pot avea mai multe pe zi. Intensitatea și durata pot varia și ele.',
    section2Body1: 'Când apar în timpul somnului, bufeurile pot provoca transpirații nocturne. Ele pot duce la treziri repetate și pot face somnul mai puțin odihnitor.',
    section2Body2: 'Lipsa somnului poate crește apoi oboseala, dificultățile de concentrare și irascibilitatea în timpul zilei. De aceea poate fi util să iei în calcul calitatea somnului atunci când evaluezi impactul simptomelor tale.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Pijamalele respirabile, lenjeria ușoară de pat și un dormitor suficient de răcoros pot ajuta la limitarea disconfortului nocturn.',
    section3Body1: 'Anumiți factori pot declanșa sau intensifica un bufeu. Ei nu provoacă neapărat simptome la toată lumea, dar identificarea lor te poate ajuta să-ți înțelegi mai bine propriile tipare.',
    triggers: [
      'Cafeina și alcoolul',
      'Alimentele picante',
      'Stresul și emoțiile puternice',
      'O cameră prea încălzită sau haine prea groase',
    ],
    tip2Title: 'Un mic obicei util',
    tip2Text: 'Timp de câteva săptămâni, notează când apar bufeurile, cât de intense sunt și ce s-a întâmplat chiar înainte. Aceasta te poate ajuta să-ți descoperi factorii declanșatori personali.',
    dailyHabits: [
      'Îmbracă-te în straturi ușoare',
      'Menține spațiul răcoros și bine aerisit',
      'Practică respirația lentă în timpul unui bufeu',
      'Bea regulat apă rece',
    ],
    section4Body1: 'Aceste măsuri nu fac neapărat să dispară bufeurile, dar pot face episoadele mai ușor de gestionat și pot reduce disconfortul atunci când apar.',
    section5Body1: 'Bufeurile sunt frecvente în perimenopauză și în menopauză. Totuși, nu trebuie să le suporți pur și simplu dacă devin greu de trăit. Un medic sau o moașă îți poate evalua simptomele și poate discuta cu tine diferitele opțiuni.',
    whenAppointmentTitle: 'Când ar trebui să programezi o consultație?',
    section5Body2: 'O consultație poate fi deosebit de utilă atunci când simptomele au un impact important asupra vieții tale de zi cu zi sau când vrei să afli ce opțiuni sunt disponibile.',
    consultReasons: [
      {
        title: 'Când somnul este perturbat',
        text: 'Bufeuri sau transpirații nocturne frecvente care provoacă treziri repetate, oboseală importantă sau dificultăți de a funcționa normal în timpul zilei.',
      },
      {
        title: 'Când viața de zi cu zi devine dificilă',
        text: 'Dacă bufeurile îți afectează munca, activitățile, călătoriile, relațiile sociale sau pur și simplu confortul de zi cu zi.',
      },
      {
        title: 'Când simptomele devin mai frecvente',
        text: 'O creștere clară a frecvenței sau a intensității simptomelor merită discutată pentru a găsi cele mai potrivite soluții.',
      },
      {
        title: 'Dacă te gândești la un tratament',
        text: 'Pot fi propuse opțiuni hormonale și nehormonale, în funcție de situația ta. Un profesionist te poate ajuta să cântărești avantajele, riscurile și eventualele contraindicații.',
      },
    ],
    notMenopauseTitle: 'Nu pune totul pe seama menopauzei',
    notMenopauseBody: 'Un bufeu poate avea cauze diferite. Unele simptome pot fi legate și de un medicament, de o altă afecțiune medicală sau de o schimbare importantă a sănătății tale. Dacă ceva ți se pare neobișnuit, nou sau deosebit de intens, este mai bine să vorbești cu un profesionist decât să presupui automat că este menopauza.',
    alertTitle: 'Cere îngrijiri prompt',
    alertText: 'Durerea în piept, lipsa bruscă de aer, senzația de leșin, slăbiciunea bruscă sau umflarea dureroasă neobișnuită a unui picior necesită îngrijiri medicale prompte.',
    emergencySignsTitle: 'Ce semne merită o atenție deosebită?',
    emergencySigns: [
      'Durere în piept neobișnuită sau severă',
      'Lipsă bruscă de aer sau dificultate importantă de respirație',
      'Senzație de leșin sau pierderea cunoștinței',
      'Slăbiciune bruscă sau dificultăți de vorbire ori de vedere',
      'Umflare dureroasă, neobișnuită, a unui picior',
    ],
    solutionsTitle: 'Ce soluții pot fi disponibile?',
    solutionsBody: 'Dacă bufeurile sunt suficient de deranjante pentru a necesita gestionare, pot fi luate în considerare mai multe abordări. În funcție de situația ta, profesionistul poate discuta măsuri legate de stilul de viață, tratamente nehormonale sau, când este cazul, terapie hormonală.',
    highlight2Title: 'Tratamentul se alege de la caz la caz',
    highlight2Text: 'Vârsta, simptomele, istoricul medical, tratamentele curente și preferințele personale pot influența opțiunile propuse.',
    prepareTitle: 'Pregătirea consultației',
    prepareBody: 'Să vii cu puține informații poate face consultația mai utilă. Poți urmări, timp de câteva zile sau săptămâni, cât de des apar episoadele, cât de intense sunt și impactul lor asupra somnului sau activităților.',
    questionsTitle: 'Informații utile de pregătit',
    appointmentQuestions: [
      'Cât de des apar bufeurile?',
      'De cât timp le trăiești?',
      'Tind să apară ziua, noaptea sau amândouă?',
      'Îți perturbă somnul sau activitățile?',
      'Ai identificat factori declanșatori?',
      'Iei în prezent vreun medicament sau contracepție hormonală?',
    ],
    professionalTipText: 'Nu trebuie să aștepți ca simptomele să devină foarte severe înainte de a vorbi despre ele. O consultație te poate ajuta și pur și simplu să înțelegi ce se întâmplă și să afli despre soluțiile disponibile.',
    summaryTitle: 'Esențialul',
    summaryItems: [
      'Bufeurile sunt frecvente în timpul tranziției spre menopauză.',
      'Identificarea factorilor declanșatori te poate ajuta să gestionezi mai bine episoadele.',
      'Obiceiurile simple pot reduce disconfortul de zi cu zi.',
      'Dacă simptomele îți perturbă somnul sau viața de zi cu zi, vorbește cu un profesionist.',
      'Pot fi discutate mai multe opțiuni de gestionare, în funcție de situația ta.',
    ],
    finalTipText: 'Bufeurile sunt frecvente, dar nu trebuie ignorate atunci când îți afectează somnul, munca sau starea de bine. Atenția acordată simptomelor și discuția cu un profesionist te pot ajuta să înțelegi mai bine cauza lor și să explorezi soluții potrivite.',
    disclaimerText: 'Acest articol are doar caracter informativ și nu înlocuiește sfatul medical personalizat.',
    shareMessage: 'Îmblânzirea bufeurilor — AWA',
  },
  bg: {
    badge: 'ГОРЕЩИ ВЪЛНИ',
    title: 'Овладяване на\nгорещите вълни',
    metaDuration: '10 мин четене',
    metaType: 'Статия',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Защо се появяват, как да определиш задействащите си фактори и какви решения могат да помогнат, когато станат неприятни.',
    contentsTitle: 'В тази статия',
    topics: [
      'Защо се появяват горещите вълни',
      'Нощно изпотяване',
      'Чести задействащи фактори',
      'Ежедневни навици, които помагат',
      'Кога да поговориш със специалист',
      'Какво да запомниш',
    ],
    section1Body1: 'Горещите вълни са много чести по време на прехода към менопауза. Те са свързани отчасти с хормоналните промени, които влияят на начина, по който мозъкът регулира телесната температура.',
    section1Body2: 'Малка промяна в телесната температура може след това да се усети като внезапна топлина. Тялото отговаря с разширяване на кръвоносните съдове в кожата, което може да причини усещане за топлина, зачервяване и понякога обилно изпотяване.',
    highlight1Title: 'Всеки човек е различен',
    highlight1Text: 'Някои жени имат няколко епизода седмично, докато други могат да имат няколко на ден. Интензитетът и продължителността също могат да варират.',
    section2Body1: 'Когато настъпят по време на сън, горещите вълни могат да причинят нощно изпотяване. Те могат да доведат до многократни събуждания и да направят съня по-малко почиващ.',
    section2Body2: 'Липсата на сън може след това да увеличи умората, затрудненията с концентрацията и раздразнителността през деня. Затова може да е полезно да отчиташ качеството на съня, когато оценяваш влиянието на симптомите си.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Дишащи пижами, леко спално бельо и достатъчно прохладна спалня могат да помогнат да се ограничи дискомфортът през нощта.',
    section3Body1: 'Някои фактори могат да задействат или засилят горещата вълна. Те не причиняват непременно симптоми при всички, но откриването им може да ти помогне да разбереш по-добре собствените си модели.',
    triggers: [
      'Кофеин и алкохол',
      'Люти храни',
      'Стрес и силни емоции',
      'Прекалено затоплена стая или твърде дебели дрехи',
    ],
    tip2Title: 'Полезен малък навик',
    tip2Text: 'В продължение на няколко седмици отбелязвай кога се случват горещите ти вълни, колко са интензивни и какво е станало непосредствено преди това. Това може да ти помогне да откриеш личните си задействащи фактори.',
    dailyHabits: [
      'Обличай се на леки пластове',
      'Поддържай пространството си прохладно и добре проветрено',
      'Практикувай бавно дишане по време на горещата вълна',
      'Пий редовно хладка вода',
    ],
    section4Body1: 'Тези мерки не правят непременно горещите вълни да изчезнат, но могат да направят епизодите по-лесни за справяне и да намалят дискомфорта, когато се появят.',
    section5Body1: 'Горещите вълни са чести в перименопаузата и менопаузата. Въпреки това не е нужно просто да ги търпиш, ако станат трудни за понасяне. Лекар или акушерка може да оцени симптомите ти и да обсъди с теб различните възможности.',
    whenAppointmentTitle: 'Кога трябва да си запазиш час?',
    section5Body2: 'Консултацията може да е особено полезна, когато симптомите имат значително влияние върху ежедневието ти или когато искаш да узнаеш какви възможности има.',
    consultReasons: [
      {
        title: 'Когато сънят е нарушен',
        text: 'Чести горещи вълни или нощно изпотяване, които причиняват многократни събуждания, значителна умора или затруднения да функционираш нормално през деня.',
      },
      {
        title: 'Когато ежедневието стане трудно',
        text: 'Ако горещите вълни пречат на работата, дейностите, пътуванията, социалните ти отношения или просто на ежедневния ти комфорт.',
      },
      {
        title: 'Когато симптомите зачестят',
        text: 'Ясно увеличение на честотата или интензитета на симптомите заслужава да се обсъди, за да се намерят най-подходящите решения.',
      },
      {
        title: 'Ако обмисляш лечение',
        text: 'Могат да се предложат хормонални и нехормонални възможности според ситуацията ти. Специалист може да ти помогне да прецениш ползите, рисковете и евентуалните им противопоказания.',
      },
    ],
    notMenopauseTitle: 'Не приписвай всичко на менопаузата',
    notMenopauseBody: 'Горещата вълна може да има различни причини. Някои симптоми могат да са свързани и с лекарство, друго медицинско състояние или значителна промяна в здравето ти. Ако нещо ти се струва необичайно, ново или особено интензивно, по-добре е да поговориш със специалист, вместо автоматично да приемеш, че е менопауза.',
    alertTitle: 'Потърси бързо помощ',
    alertText: 'Болка в гърдите, внезапен задух, усещане за прималяване, внезапна слабост или необичаен болезнен оток на единия крак изискват бърза медицинска помощ.',
    emergencySignsTitle: 'Кои признаци заслужават особено внимание?',
    emergencySigns: [
      'Необичайна или силна болка в гърдите',
      'Внезапен задух или значително затруднено дишане',
      'Усещане за прималяване или загуба на съзнание',
      'Внезапна слабост или затруднения с говора или зрението',
      'Болезнен, необичаен оток на единия крак',
    ],
    solutionsTitle: 'Какви решения могат да са налични?',
    solutionsBody: 'Ако горещите вълни са достатъчно неприятни, за да се нуждаят от овладяване, могат да се обмислят няколко подхода. Според ситуацията ти специалистът може да обсъди мерки за начина на живот, нехормонални лечения или, когато е уместно, хормонална терапия.',
    highlight2Title: 'Лечението се избира за всеки случай поотделно',
    highlight2Text: 'Възрастта, симптомите, медицинската история, текущото лечение и личните предпочитания могат да повлияят на предлаганите възможности.',
    prepareTitle: 'Подготовка за прегледа',
    prepareBody: 'Да дойдеш с малко информация може да направи консултацията по-полезна. Можеш да проследяваш, в продължение на няколко дни или седмици, колко често се случват епизодите, колко са интензивни и какво е влиянието им върху съня или дейностите ти.',
    questionsTitle: 'Полезна информация за подготовка',
    appointmentQuestions: [
      'Колко често се случват горещите ти вълни?',
      'От колко време ги преживяваш?',
      'Склонни ли са да се появяват през деня, през нощта или и двете?',
      'Нарушават ли съня или дейностите ти?',
      'Определила ли си някакви задействащи фактори?',
      'Приемаш ли в момента някакви лекарства или хормонална контрацепция?',
    ],
    professionalTipText: 'Не е нужно да чакаш симптомите да станат много тежки, преди да говориш за тях. Консултацията може да ти помогне и просто да разбереш какво се случва и да научиш за наличните решения.',
    summaryTitle: 'Същественото',
    summaryItems: [
      'Горещите вълни са чести по време на прехода към менопауза.',
      'Откриването на задействащите ти фактори може да ти помогне да овладяваш по-добре епизодите.',
      'Простите навици могат да намалят ежедневния дискомфорт.',
      'Ако симптомите нарушават съня или ежедневието ти, поговори със специалист.',
      'Могат да се обсъдят няколко възможности за овладяване според ситуацията ти.',
    ],
    finalTipText: 'Горещите вълни са чести, но не бива да се пренебрегват, когато засягат съня, работата или доброто ти състояние. Вниманието към симптомите ти и разговорът със специалист могат да ти помогнат да разбереш по-добре причината им и да проучиш подходящи решения.',
    disclaimerText: 'Тази статия е само с информационна цел и не замества персонализирания медицински съвет.',
    shareMessage: 'Овладяване на горещите вълни — AWA',
  },
  sr: {
    badge: 'ТАЛАСИ ВРУЋИНЕ',
    title: 'Како укротити\nталасе врућине',
    metaDuration: '10 мин читања',
    metaType: 'Чланак',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Зашто се јављају, како препознати своје окидаче и која решења могу помоћи када постану непријатни.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Зашто се јављају таласи врућине',
      'Ноћно знојење',
      'Чести окидачи',
      'Свакодневне навике које помажу',
      'Када разговарати са стручњаком',
      'Шта да запамтиш',
    ],
    section1Body1: 'Таласи врућине су веома чести током прелаза у менопаузу. Делимично су повезани са хормонским променама које утичу на то како мозак регулише телесну температуру.',
    section1Body2: 'Мала промена телесне температуре тада се може осетити као изненадна врућина. Тело реагује ширењем крвних судова у кожи, што може изазвати осећај топлоте, црвенило и понекад обилно знојење.',
    highlight1Title: 'Свака особа је другачија',
    highlight1Text: 'Неке жене имају неколико епизода недељно, док друге могу имати неколико дневно. Интензитет и трајање такође могу варирати.',
    section2Body1: 'Када се јављају током спавања, таласи врућине могу изазвати ноћно знојење. Могу довести до поновљеног буђења и учинити сан мање одморним.',
    section2Body2: 'Недостатак сна затим може појачати умор, тешкоће са концентрацијом и раздражљивост током дана. Зато може бити корисно узети у обзир квалитет сна приликом процене утицаја симптома.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Пиџама која пропушта ваздух, лагана постељина и довољно хладна спаваћа соба могу помоћи да се ограничи нелагодност ноћу.',
    section3Body1: 'Одређени фактори могу покренути или појачати талас врућине. Они нужно не изазивају симптоме код свих, али њихово препознавање може ти помоћи да боље разумеш сопствене обрасце.',
    triggers: [
      'Кафеин и алкохол',
      'Љута храна',
      'Стрес и јаке емоције',
      'Прегрејана просторија или претешка одећа',
    ],
    tip2Title: 'Мала корисна навика',
    tip2Text: 'Неколико недеља бележи када се таласи врућине јављају, колико су интензивни и шта се догодило непосредно пре. То ти може помоћи да откријеш своје личне окидаче.',
    dailyHabits: [
      'Облачи се у лагане слојеве',
      'Одржавај простор хладним и добро проветреним',
      'Вежбај споро дисање током таласа врућине',
      'Пиј хладну воду редовно',
    ],
    section4Body1: 'Ове мере неће нужно учинити да таласи врућине нестану, али могу олакшати управљање епизодама и смањити нелагодност када се појаве.',
    section5Body1: 'Таласи врућине су чести током перименопаузе и менопаузе. Ипак, не мораш једноставно да их трпиш ако постану тешки за подношење. Лекар или бабица може проценити твоје симптоме и разговарати са тобом о различитим опцијама.',
    whenAppointmentTitle: 'Када да заказеш преглед?',
    section5Body2: 'Консултација може бити посебно корисна када симптоми значајно утичу на твој свакодневни живот или када желиш да знаш које су опције доступне.',
    consultReasons: [
      {
        title: 'Када је сан поремећен',
        text: 'Чести таласи врућине или ноћно знојење који изазивају поновљено буђење, значајан умор или тешкоће да нормално функционишеш током дана.',
      },
      {
        title: 'Када свакодневни живот постане тежак',
        text: 'Ако таласи врућине ометају твој посао, активности, путовања, друштвене односе или једноставно свакодневну удобност.',
      },
      {
        title: 'Када симптоми постану чешћи',
        text: 'Јасно повећање учесталости или интензитета симптома вреди размотрити да би се пронашла најприкладнија решења.',
      },
      {
        title: 'Ако размишљаш о терапији',
        text: 'Хормонске и нехормонске опције могу бити предложене зависно од твоје ситуације. Стручњак ти може помоћи да одмериш њихове предности, ризике и евентуалне контраиндикације.',
      },
    ],
    notMenopauseTitle: 'Немој све приписивати менопаузи',
    notMenopauseBody: 'Талас врућине може имати различите узроке. Неки симптоми могу бити повезани и са леком, другим медицинским стањем или значајном променом у твом здрављу. Ако се нешто чини необично, ново или посебно интензивно, најбоље је разговарати са стручњаком уместо да аутоматски претпоставиш да је то менопауза.',
    alertTitle: 'Потражи помоћ одмах',
    alertText: 'Бол у грудима, изненадни недостатак даха, осећај малаксалости, изненадна слабост или необичан болан оток једне ноге захтевају хитну медицинску помоћ.',
    emergencySignsTitle: 'Који знаци заслужују посебну пажњу?',
    emergencySigns: [
      'Необичан или јак бол у грудима',
      'Изненадни недостатак даха или значајно отежано дисање',
      'Осећај малаксалости или губитак свести',
      'Изненадна слабост или тешкоће у говору или виду',
      'Болан, необичан оток једне ноге',
    ],
    solutionsTitle: 'Која решења могу бити доступна?',
    solutionsBody: 'Ако су таласи врућине довољно непријатни да захтевају управљање, може се размотрити неколико приступа. Зависно од твоје ситуације, стручњак може разговарати о мерама начина живота, нехормонским терапијама или, када је прикладно, хормонској терапији.',
    highlight2Title: 'Терапија се бира од случаја до случаја',
    highlight2Text: 'Године, симптоми, медицинска историја, тренутне терапије и личне жеље могу утицати на понуђене опције.',
    prepareTitle: 'Припрема за преглед',
    prepareBody: 'Долазак са мало информација може учинити консултацију кориснијом. Можеш током неколико дана или недеља пратити колико се често епизоде јављају, колико су интензивне и какав је њихов утицај на сан или активности.',
    questionsTitle: 'Корисне информације за припрему',
    appointmentQuestions: [
      'Колико често имаш таласе врућине?',
      'Од када их имаш?',
      'Да ли се јављају током дана, ноћу или оба?',
      'Да ли ти ометају сан или активности?',
      'Да ли си препознала неке окидаче?',
      'Да ли тренутно узимаш неки лек или хормонску контрацепцију?',
    ],
    professionalTipText: 'Не мораш чекати да симптоми постану веома јаки да би о њима разговарала. Консултација може и једноставно помоћи да разумеш шта се дешава и сазнаш за доступна решења.',
    summaryTitle: 'Основно',
    summaryItems: [
      'Таласи врућине су чести током прелаза у менопаузу.',
      'Препознавање окидача може ти помоћи да боље управљаш епизодама.',
      'Једноставне навике могу смањити свакодневну нелагодност.',
      'Ако симптоми ометају сан или свакодневни живот, разговарај са стручњаком.',
      'Може се разговарати о неколико опција управљања зависно од твоје ситуације.',
    ],
    finalTipText: 'Таласи врућине су чести, али их не треба занемарити када утичу на твој сан, посао или благостање. Пажња према симптомима и разговор са стручњаком могу ти помоћи да боље разумеш њихов узрок и истражиш одговарајућа решења.',
    disclaimerText: 'Овај чланак је само у информативне сврхе и не замењује персонализовани медицински савет.',
    shareMessage: 'Како укротити таласе врућине — AWA',
  },
  hr: {
    badge: 'VALOVI VRUĆINE',
    title: 'Kako ukrotiti\nvalove vrućine',
    metaDuration: '10 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Zašto nastaju, kako prepoznati svoje okidače i koja rješenja mogu pomoći kad postanu smetnja.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Zašto nastaju valovi vrućine',
      'Noćno znojenje',
      'Česti okidači',
      'Svakodnevne navike koje pomažu',
      'Kada razgovarati sa stručnom osobom',
      'Ključne poruke',
    ],
    section1Body1: 'Valovi vrućine vrlo su česti tijekom prijelaza u menopauzu. Dijelom su povezani s hormonskim promjenama koje utječu na to kako mozak regulira tjelesnu temperaturu.',
    section1Body2: 'Mala promjena tjelesne temperature tada se može doživjeti kao iznenadna vrućina. Tijelo odgovara širenjem krvnih žila u koži, što može izazvati osjećaj vrućine, crvenilo i ponekad obilno znojenje.',
    highlight1Title: 'Svaka je osoba drugačija',
    highlight1Text: 'Neke žene imaju nekoliko epizoda tjedno, dok druge mogu imati nekoliko dnevno. Intenzitet i trajanje također se mogu razlikovati.',
    section2Body1: 'Kad se događaju tijekom sna, valovi vrućine mogu uzrokovati noćno znojenje. Mogu dovesti do ponavljanih buđenja i učiniti san manje odmornim.',
    section2Body2: 'Nedostatak sna tada može pojačati umor, teškoće s koncentracijom i razdražljivost tijekom dana. Stoga može biti korisno uzeti u obzir kvalitetu sna pri procjeni utjecaja simptoma.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Prozračne pidžame, lagana posteljina i dovoljno svježa spavaća soba mogu pomoći ograničiti nelagodu tijekom noći.',
    section3Body1: 'Određeni čimbenici mogu izazvati ili pojačati val vrućine. Ne uzrokuju nužno simptome kod svakoga, ali njihovo prepoznavanje može ti pomoći bolje razumjeti vlastite obrasce.',
    triggers: [
      'Kofein i alkohol',
      'Začinjena hrana',
      'Stres i jake emocije',
      'Pregrijana prostorija ili preteška odjeća',
    ],
    tip2Title: 'Korisna mala navika',
    tip2Text: 'Nekoliko tjedana bilježi kada se javljaju valovi vrućine, koliko su intenzivni i što se dogodilo neposredno prije. To ti može pomoći uočiti osobne okidače.',
    dailyHabits: [
      'Odijevaj se u lagane slojeve',
      'Održavaj prostor svježim i dobro prozračenim',
      'Vježbaj sporo disanje tijekom vala vrućine',
      'Redovito pij hladnu vodu',
    ],
    section4Body1: 'Te mjere neće nužno učiniti da valovi vrućine nestanu, ali mogu olakšati upravljanje epizodama i smanjiti nelagodu kad se jave.',
    section5Body1: 'Valovi vrućine česti su tijekom perimenopauze i menopauze. Ipak, ne moraš ih jednostavno trpjeti ako postanu teško podnošljivi. Liječnik ili babica može procijeniti tvoje simptome i s tobom razgovarati o različitim mogućnostima.',
    whenAppointmentTitle: 'Kada se naručiti na pregled?',
    section5Body2: 'Savjetovanje može biti osobito korisno kad simptomi znatno utječu na svakodnevni život ili kad želiš znati koje su mogućnosti dostupne.',
    consultReasons: [
      {
        title: 'Kada je san poremećen',
        text: 'Česti valovi vrućine ili noćno znojenje koji uzrokuju ponavljana buđenja, izražen umor ili teškoće u normalnom funkcioniranju tijekom dana.',
      },
      {
        title: 'Kada svakodnevni život postane težak',
        text: 'Ako valovi vrućine ometaju tvoj posao, aktivnosti, putovanja, društvene odnose ili jednostavno svakodnevnu ugodu.',
      },
      {
        title: 'Kada simptomi postanu učestaliji',
        text: 'Jasan porast učestalosti ili intenziteta simptoma vrijedi razmotriti kako bi se pronašla najprikladnija rješenja.',
      },
      {
        title: 'Ako razmišljaš o terapiji',
        text: 'Ovisno o tvojoj situaciji mogu se ponuditi hormonske i nehormonske mogućnosti. Stručna osoba može ti pomoći odvagnuti njihove prednosti, rizike i moguće kontraindikacije.',
      },
    ],
    notMenopauseTitle: 'Ne pripisuj sve menopauzi',
    notMenopauseBody: 'Val vrućine može imati različite uzroke. Neki simptomi mogu biti povezani i s lijekom, drugim zdravstvenim stanjem ili znatnom promjenom zdravlja. Ako se nešto čini neobičnim, novim ili posebno intenzivnim, bolje je razgovarati sa stručnom osobom nego automatski pretpostaviti da je riječ o menopauzi.',
    alertTitle: 'Odmah potraži skrb',
    alertText: 'Bol u prsima, iznenadan nedostatak zraka, osjećaj nesvjestice, iznenadna slabost ili neobično bolno oticanje jedne noge zahtijevaju žurnu medicinsku pomoć.',
    emergencySignsTitle: 'Koji znakovi zaslužuju posebnu pozornost?',
    emergencySigns: [
      'Neobična ili jaka bol u prsima',
      'Iznenadan nedostatak zraka ili znatne teškoće s disanjem',
      'Osjećaj nesvjestice ili gubitak svijesti',
      'Iznenadna slabost ili poteškoće s govorom ili vidom',
      'Bolno, neobično oticanje jedne noge',
    ],
    solutionsTitle: 'Koja rješenja mogu biti dostupna?',
    solutionsBody: 'Ako su valovi vrućine dovoljno smetnja da zahtijevaju liječenje, može se razmotriti nekoliko pristupa. Ovisno o tvojoj situaciji, stručna osoba može razgovarati o mjerama načina života, nehormonskim terapijama ili, kad je prikladno, hormonskoj terapiji.',
    highlight2Title: 'Terapija se bira od slučaja do slučaja',
    highlight2Text: 'Dob, simptomi, anamneza, trenutačne terapije i osobne želje mogu utjecati na ponuđene mogućnosti.',
    prepareTitle: 'Priprema za pregled',
    prepareBody: 'Dolazak s nešto informacija može savjetovanje učiniti korisnijim. Nekoliko dana ili tjedana možeš pratiti koliko se često epizode javljaju, koliko su intenzivne i kako utječu na san ili aktivnosti.',
    questionsTitle: 'Korisne informacije za pripremu',
    appointmentQuestions: [
      'Koliko se često javljaju tvoji valovi vrućine?',
      'Koliko dugo ih imaš?',
      'Javljaju li se uglavnom danju, noću ili oboje?',
      'Remete li ti san ili aktivnosti?',
      'Jesi li prepoznala neke okidače?',
      'Uzimaš li trenutačno neke lijekove ili hormonsku kontracepciju?',
    ],
    professionalTipText: 'Ne moraš čekati da simptomi postanu vrlo jaki prije nego o njima razgovaraš. Savjetovanje ti također jednostavno može pomoći razumjeti što se događa i saznati o dostupnim rješenjima.',
    summaryTitle: 'Najvažnije',
    summaryItems: [
      'Valovi vrućine česti su tijekom prijelaza u menopauzu.',
      'Prepoznavanje okidača može ti pomoći bolje upravljati epizodama.',
      'Jednostavne navike mogu smanjiti svakodnevnu nelagodu.',
      'Ako simptomi remete san ili svakodnevni život, razgovaraj sa stručnom osobom.',
      'Ovisno o situaciji mogu se razmotriti različite mogućnosti liječenja.',
    ],
    finalTipText: 'Valovi vrućine su česti, ali ih ne treba zanemariti kad utječu na san, posao ili dobrobit. Pozornost prema simptomima i razgovor sa stručnom osobom mogu ti pomoći bolje razumjeti njihov uzrok i istražiti prikladna rješenja.',
    disclaimerText: 'Ovaj je članak samo informativne naravi i ne zamjenjuje individualni medicinski savjet.',
    shareMessage: 'Kako ukrotiti valove vrućine — AWA',
  },
  bs: {
    badge: 'VALOVI VRUĆINE',
    title: 'Kako ukrotiti\nvalove vrućine',
    metaDuration: '10 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Zašta nastaju, kako prepoznati svoje okidače i koja rješenja mogu pomoći kad postanu smetnja.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Zašta nastaju valovi vrućine',
      'Noćno znojenje',
      'Česti okidači',
      'Svakodnevne navike koje pomažu',
      'Kada razgovarati sa stručnom osobom',
      'Ključne poruke',
    ],
    section1Body1: 'Valovi vrućine vrlo su česti tokom prijelaza u menopauzu. Dijelom su povezani s hormonskim promjenama koje utječu na to kako mozak regulira tjelesnu temperaturu.',
    section1Body2: 'Mala promjena tjelesne temperature tada se može doživjeti kao iznenadna vrućina. Tijelo odgovara širenjem krvnih žila u koži, što može izazvati osjećaj vrućine, crvenilo i ponekad obilno znojenje.',
    highlight1Title: 'Svaka je osoba drugačija',
    highlight1Text: 'Neke žene imaju nekoliko epizoda sedmično, dok druge mogu imati nekoliko dnevno. Intenzitet i trajanje također se mogu razlikovati.',
    section2Body1: 'Kad se događaju tokom sna, valovi vrućine mogu uzrokovati noćno znojenje. Mogu dovesti do ponavljanih buđenja i učiniti san manje odmornim.',
    section2Body2: 'Nedostatak sna tada može pojačati umor, teškoće s koncentracijom i razdražljivost tokom dana. Stoga može biti korisno uzeti u obzir kvalitetu sna pri procjeni utjecaja simptoma.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Prozračne pidžame, lagana posteljina i dovoljno svježa spavaća soba mogu pomoći ograničiti nelagodu tokom noći.',
    section3Body1: 'Određeni čimbenici mogu izazvati ili pojačati val vrućine. Ne uzrokuju nužno simptome kod svakoga, ali njihovo prepoznavanje može ti pomoći bolje razumjeti vlastite obrasce.',
    triggers: [
      'Kofein i alkohol',
      'Začinjena hrana',
      'Stres i jake emocije',
      'Pregrijana prostorija ili preteška odjeća',
    ],
    tip2Title: 'Korisna mala navika',
    tip2Text: 'Nekoliko sedmica bilježi kada se javljaju valovi vrućine, koliko su intenzivni i što se dogodilo neposredno prije. To ti može pomoći uočiti osobne okidače.',
    dailyHabits: [
      'Odijevaj se u lagane slojeve',
      'Održavaj prostor svježim i dobro prozračenim',
      'Vježbaj sporo disanje tokom vala vrućine',
      'Redovito pij hladnu vodu',
    ],
    section4Body1: 'Te mjere neće nužno učiniti da valovi vrućine nestanu, ali mogu olakšati upravljanje epizodama i smanjiti nelagodu kad se jave.',
    section5Body1: 'Valovi vrućine česti su tokom perimenopauze i menopauze. Ipak, ne moraš ih jednostavno trpjeti ako postanu teško podnošljivi. Ljekar ili babica može procijeniti tvoje simptome i s tobom razgovarati o različitim mogućnostima.',
    whenAppointmentTitle: 'Kada se naručiti na pregled?',
    section5Body2: 'Savjetovanje može biti osobito korisno kad simptomi znatno utječu na svakodnevni život ili kad želiš znati koje su mogućnosti dostupne.',
    consultReasons: [
      {
        title: 'Kada je san poremećen',
        text: 'Česti valovi vrućine ili noćno znojenje koji uzrokuju ponavljana buđenja, izražen umor ili teškoće u normalnom funkcioniranju tokom dana.',
      },
      {
        title: 'Kada svakodnevni život postane težak',
        text: 'Ako valovi vrućine ometaju tvoj posao, aktivnosti, putovanja, društvene odnose ili jednostavno svakodnevnu ugodu.',
      },
      {
        title: 'Kada simptomi postanu učestaliji',
        text: 'Jasan porast učestalosti ili intenziteta simptoma vrijedi razmotriti kako bi se pronašla najprikladnija rješenja.',
      },
      {
        title: 'Ako razmišljaš o terapiji',
        text: 'Ovisno o tvojoj situaciji mogu se ponuditi hormonske i nehormonske mogućnosti. Stručna osoba može ti pomoći odvagnuti njihove prednosti, rizike i moguće kontraindikacije.',
      },
    ],
    notMenopauseTitle: 'Ne pripisuj sve menopauzi',
    notMenopauseBody: 'Val vrućine može imati različite uzroke. Neki simptomi mogu biti povezani i s lijekom, drugim zdravstvenim stanjem ili znatnom promjenom zdravlja. Ako se nešta čini neobičnim, novim ili posebno intenzivnim, bolje je razgovarati sa stručnom osobom nego automatski pretpostaviti da je riječ o menopauzi.',
    alertTitle: 'Odmah potraži skrb',
    alertText: 'Bol u prsima, iznenadan nedostatak zraka, osjećaj nesvjestice, iznenadna slabost ili neobično bolno oticanje jedne noge zahtijevaju žurnu medicinsku pomoć.',
    emergencySignsTitle: 'Koji znakovi zaslužuju posebnu pozornost?',
    emergencySigns: [
      'Neobična ili jaka bol u prsima',
      'Iznenadan nedostatak zraka ili znatne teškoće s disanjem',
      'Osjećaj nesvjestice ili gubitak svijesti',
      'Iznenadna slabost ili poteškoće s govorom ili vidom',
      'Bolno, neobično oticanje jedne noge',
    ],
    solutionsTitle: 'Koja rješenja mogu biti dostupna?',
    solutionsBody: 'Ako su valovi vrućine dovoljno smetnja da zahtijevaju liječenje, može se razmotriti nekoliko pristupa. Ovisno o tvojoj situaciji, stručna osoba može razgovarati o mjerama načina života, nehormonskim terapijama ili, kad je prikladno, hormonskoj terapiji.',
    highlight2Title: 'Terapija se bira od slučaja do slučaja',
    highlight2Text: 'Dob, simptomi, anamneza, trenutne terapije i osobne želje mogu utjecati na ponuđene mogućnosti.',
    prepareTitle: 'Priprema za pregled',
    prepareBody: 'Dolazak s nešta informacija može savjetovanje učiniti korisnijim. Nekoliko dana ili sedmica možeš pratiti koliko se često epizode javljaju, koliko su intenzivne i kako utječu na san ili aktivnosti.',
    questionsTitle: 'Korisne informacije za pripremu',
    appointmentQuestions: [
      'Koliko se često javljaju tvoji valovi vrućine?',
      'Koliko dugo ih imaš?',
      'Javljaju li se uglavnom danju, noću ili oboje?',
      'Remete li ti san ili aktivnosti?',
      'Jesi li prepoznala neke okidače?',
      'Uzimaš li trenutno neke lijekove ili hormonsku kontracepciju?',
    ],
    professionalTipText: 'Ne moraš čekati da simptomi postanu vrlo jaki prije nego o njima razgovaraš. Savjetovanje ti također jednostavno može pomoći razumjeti što se događa i saznati o dostupnim rješenjima.',
    summaryTitle: 'Najvažnije',
    summaryItems: [
      'Valovi vrućine česti su tokom prijelaza u menopauzu.',
      'Prepoznavanje okidača može ti pomoći bolje upravljati epizodama.',
      'Jednostavne navike mogu smanjiti svakodnevnu nelagodu.',
      'Ako simptomi remete san ili svakodnevni život, razgovaraj sa stručnom osobom.',
      'Ovisno o situaciji mogu se razmotriti različite mogućnosti liječenja.',
    ],
    finalTipText: 'Valovi vrućine su česti, ali ih ne treba zanemariti kad utječu na san, posao ili dobrobit. Pozornost prema simptomima i razgovor sa stručnom osobom mogu ti pomoći bolje razumjeti njihov uzrok i istražiti prikladna rješenja.',
    disclaimerText: 'Ovaj je članak samo informativne naravi i ne zamjenjuje individualni medicinski savjet.',
    shareMessage: 'Kako ukrotiti valove vrućine — AWA',
  },
  sl: {
    badge: 'VROČINSKI VALOVI',
    title: 'Kako ukrotiti\nvročinske valove',
    metaDuration: '10 min branja',
    metaType: 'Članek',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Zakaj nastanejo, kako prepoznati svoje sprožilce in katere rešitve lahko pomagajo, ko postanejo moteči.',
    contentsTitle: 'V tem članku',
    topics: [
      'Zakaj nastanejo vročinski valovi',
      'Nočno potenje',
      'Pogosti sprožilci',
      'Vsakodnevne navade, ki pomagajo',
      'Kdaj se pogovoriti s strokovnjakom',
      'Ključna sporočila',
    ],
    section1Body1: 'Vročinski valovi so zelo pogosti med prehodom v menopavzo. Deloma so povezani s hormonskimi spremembami, ki vplivajo na to, kako možgani uravnavajo telesno temperaturo.',
    section1Body2: 'Majhna sprememba telesne temperature se lahko nato doživi kot nenadna vročina. Telo se odzove z razširitvijo krvnih žil v koži, kar lahko povzroči občutek vročine, zardevanje in včasih obilno potenje.',
    highlight1Title: 'Vsaka oseba je drugačna',
    highlight1Text: 'Nekatere ženske imajo nekaj epizod na teden, druge lahko več na dan. Tudi intenzivnost in trajanje se lahko razlikujeta.',
    section2Body1: 'Kadar se pojavljajo med spanjem, lahko vročinski valovi povzročijo nočno potenje. Lahko vodijo do ponavljajočih se prebujanj in naredijo spanec manj počitka.',
    section2Body2: 'Pomanjkanje spanja lahko nato poveča utrujenost, težave s koncentracijo in razdražljivost čez dan. Zato je lahko koristno upoštevati kakovost spanja pri ocenjevanju vpliva simptomov.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Zračne pižame, lahka posteljnina in dovolj sveža spalnica lahko pomagajo omejiti nelagodje ponoči.',
    section3Body1: 'Določeni dejavniki lahko sprožijo ali okrepijo vročinski val. Ne povzročajo nujno simptomov pri vsakem, a njihovo prepoznavanje ti lahko pomaga bolje razumeti lastne vzorce.',
    triggers: [
      'Kofein in alkohol',
      'Začinjena hrana',
      'Stres in močna čustva',
      'Pregreta soba ali pretežka oblačila',
    ],
    tip2Title: 'Koristna majhna navada',
    tip2Text: 'Nekaj tednov beleži, kdaj se pojavljajo vročinski valovi, kako intenzivni so in kaj se je zgodilo tik pred tem. To ti lahko pomaga prepoznati osebne sprožilce.',
    dailyHabits: [
      'Oblači se v lahke plasti',
      'Ohranjaj prostor svež in dobro prezračen',
      'Vadi počasno dihanje med vročinskim valom',
      'Redno pij hladno vodo',
    ],
    section4Body1: 'Ti ukrepi ne bodo nujno povzročili, da vročinski valovi izginejo, lahko pa olajšajo obvladovanje epizod in zmanjšajo nelagodje, ko se pojavijo.',
    section5Body1: 'Vročinski valovi so pogosti med perimenopavzo in menopavzo. Vendar jih ni treba preprosto prenašati, če postanejo težko prenosljivi. Zdravnik ali babica lahko oceni tvoje simptome in se z tabo pogovori o različnih možnostih.',
    whenAppointmentTitle: 'Kdaj se naročiti na pregled?',
    section5Body2: 'Posvet je lahko še posebej koristen, kadar simptomi pomembno vplivajo na vsakdanje življenje ali kadar želiš vedeti, katere možnosti so na voljo.',
    consultReasons: [
      {
        title: 'Kadar je spanec moten',
        text: 'Pogosti vročinski valovi ali nočno potenje, ki povzročajo ponavljajoča se prebujanja, izrazito utrujenost ali težave z običajnim delovanjem čez dan.',
      },
      {
        title: 'Kadar vsakdanje življenje postane težko',
        text: 'Če vročinski valovi ovirajo tvoje delo, dejavnosti, potovanja, družabne odnose ali preprosto vsakdanje udobje.',
      },
      {
        title: 'Kadar simptomi postanejo pogostejši',
        text: 'Jasen porast pogostosti ali intenzivnosti simptomov je vreden obravnave, da se najdejo najprimernejše rešitve.',
      },
      {
        title: 'Če razmišljaš o zdravljenju',
        text: 'Glede na tvojo situacijo se lahko ponudijo hormonske in nehormonske možnosti. Strokovnjak ti lahko pomaga pretehtati njihove prednosti, tveganja in morebitne kontraindikacije.',
      },
    ],
    notMenopauseTitle: 'Ne pripisuj vsega menopavzi',
    notMenopauseBody: 'Vročinski val ima lahko različne vzroke. Nekateri simptomi so lahko povezani tudi z zdravilom, drugim zdravstvenim stanjem ali pomembno spremembo zdravja. Če se ti nekaj zdi nenavadno, novo ali posebej intenzivno, je bolje spregovoriti s strokovnjakom, kot samodejno predpostaviti, da gre za menopavzo.',
    alertTitle: 'Takoj poišči oskrbo',
    alertText: 'Bolečina v prsih, nenadno pomanjkanje zraka, občutek omedlevice, nenadna šibkost ali nenavadno boleče otekanje ene noge zahtevajo nujno zdravniško pomoč.',
    emergencySignsTitle: 'Kateri znaki zaslužijo posebno pozornost?',
    emergencySigns: [
      'Nenavadna ali huda bolečina v prsih',
      'Nenadno pomanjkanje zraka ali pomembne težave z dihanjem',
      'Občutek omedlevice ali izguba zavesti',
      'Nenadna šibkost ali težave z govorom ali vidom',
      'Boleče, nenavadno otekanje ene noge',
    ],
    solutionsTitle: 'Katere rešitve so lahko na voljo?',
    solutionsBody: 'Če so vročinski valovi dovolj moteči, da zahtevajo zdravljenje, se lahko razmisli o več pristopih. Glede na tvojo situacijo lahko strokovnjak govori o ukrepih življenjskega sloga, nehormonskih zdravljenjih ali, kadar je primerno, hormonski terapiji.',
    highlight2Title: 'Zdravljenje se izbere od primera do primera',
    highlight2Text: 'Starost, simptomi, anamneza, trenutna zdravljenja in osebne želje lahko vplivajo na ponujene možnosti.',
    prepareTitle: 'Priprava na pregled',
    prepareBody: 'Prihod z nekaj podatki lahko posvet naredi koristnejši. Nekaj dni ali tednov lahko spremljaš, kako pogosto se epizode pojavljajo, kako so intenzivne in kako vplivajo na spanec ali dejavnosti.',
    questionsTitle: 'Koristni podatki za pripravo',
    appointmentQuestions: [
      'Kako pogosto se pojavljajo tvoji vročinski valovi?',
      'Kako dolgo jih že imaš?',
      'Se pojavljajo predvsem podnevi, ponoči ali oboje?',
      'Motijo ti spanec ali dejavnosti?',
      'Si prepoznala kakšne sprožilce?',
      'Ali trenutno jemlješ kakšna zdravila ali hormonsko kontracepcijo?',
    ],
    professionalTipText: 'Ni treba čakati, da simptomi postanejo zelo hudi, preden spregovoriš o njih. Posvet ti lahko tudi preprosto pomaga razumeti, kaj se dogaja, in izvedeti za razpoložljive rešitve.',
    summaryTitle: 'Najpomembnejše',
    summaryItems: [
      'Vročinski valovi so pogosti med prehodom v menopavzo.',
      'Prepoznavanje sprožilcev ti lahko pomaga bolje obvladovati epizode.',
      'Preproste navade lahko zmanjšajo vsakodnevno nelagodje.',
      'Če simptomi motijo spanec ali vsakdanje življenje, se pogovori s strokovnjakom.',
      'Glede na situacijo se lahko obravnavajo različne možnosti zdravljenja.',
    ],
    finalTipText: 'Vročinski valovi so pogosti, a jih ne smemo zanemariti, kadar vplivajo na spanec, delo ali dobro počutje. Pozornost do simptomov in pogovor s strokovnjakom ti lahko pomagata bolje razumeti njihov vzrok in raziskati primerne rešitve.',
    disclaimerText: 'Ta članek je samo informativne narave in ne nadomešča osebnega zdravniškega nasveta.',
    shareMessage: 'Kako ukrotiti vročinske valove — AWA',
  },
  ne: {
    badge: 'तातो हुने (हट फ्ल्यास)',
    title: 'तातो हुने (हट फ्ल्यास)\nलाई वशमा राख्ने',
    metaDuration: '10 मिनेट पढाइ',
    metaType: 'लेख',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'यी किन हुन्छन्, आफ्ना ट्रिगरहरू कसरी चिन्ने, र असहज हुँदा कुन समाधानले मद्दत गर्न सक्छ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'हट फ्ल्यास किन हुन्छन्',
      'रातको पसिना',
      'सामान्य ट्रिगरहरू',
      'मद्दत गर्ने दैनिक बानीहरू',
      'व्यावसायिकसँग कहिले कुरा गर्ने',
      'मुख्य कुराहरू',
    ],
    section1Body1: 'रजोनिवृत्तिको संक्रमणमा हट फ्ल्यास निकै सामान्य हुन्छन्। ती आंशिक रूपमा मस्तिष्कले शरीरको तापक्रम नियमन गर्ने तरिकालाई असर गर्ने हर्मोनल परिवर्तनसँग जोडिएका हुन्छन्।',
    section1Body2: 'शरीरको तापक्रममा सानो परिवर्तन त्यसपछि अचानक तातो जस्तो महसुस हुन सक्छ। शरीरले छालाका रक्तनलीहरू फैलाएर प्रतिक्रिया दिन्छ, जसले तातो, रातोपन र कहिलेकाहीँ धेरै पसिनाको अनुभूति गराउन सक्छ।',
    highlight1Title: 'हरेक व्यक्ति फरक हुन्छ',
    highlight1Text: 'केही महिलाहरूलाई हप्तामा केही पटक हुन्छ, भने अरूलाई दिनमा धेरै पटक हुन सक्छ। तीव्रता र अवधि पनि फरक हुन सक्छ।',
    section2Body1: 'निद्राको समयमा हुँदा, हट फ्ल्यासले रातको पसिना गराउन सक्छन्। ती बारम्बार ब्युँझने कारण बन्न सक्छन् र निद्रालाई कम आरामदायी बनाउन सक्छन्।',
    section2Body2: 'निद्राको कमीले दिनभरि थकान, ध्यान केन्द्रित गर्न कठिनाइ र चिडचिडाहट बढाउन सक्छ। त्यसैले आफ्ना लक्षणहरूको प्रभाव मूल्याङ्कन गर्दा निद्राको गुणस्तरलाई समावेश गर्नु मद्दतकारी हुन सक्छ।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'सास फेर्न मिल्ने पाजामा, हल्का ओछ्यान र पर्याप्त चिसो कोठाले रातमा असहजता सीमित गर्न मद्दत गर्न सक्छ।',
    section3Body1: 'केही कारकहरूले हट फ्ल्यासलाई ट्रिगर वा तीव्र बनाउन सक्छन्। तिनले सबैमा लक्षण निम्त्याउँदैनन्, तर तिनलाई पहिचान गर्नाले तपाईंलाई आफ्नै ढाँचा राम्ररी बुझ्न मद्दत गर्न सक्छ।',
    triggers: [
      'क्याफिन र मदिरा',
      'पिरो खाना',
      'तनाव र कडा भावनाहरू',
      'अत्यधिक तातो कोठा वा धेरै बाक्लो लुगा',
    ],
    tip2Title: 'एउटा उपयोगी सानो बानी',
    tip2Text: 'केही हप्तासम्म, तपाईंका हट फ्ल्यास कहिले हुन्छन्, कति तीव्र हुन्छन्, र ठीक अघि के भएको थियो टिप्नुहोस्। यसले तपाईंलाई आफ्ना व्यक्तिगत ट्रिगरहरू पत्ता लगाउन मद्दत गर्न सक्छ।',
    dailyHabits: [
      'हल्का तहमा लुगा लगाउनुहोस्',
      'आफ्नो स्थानलाई चिसो र राम्ररी हावा आउने राख्नुहोस्',
      'हट फ्ल्यासको समयमा ढिलो सास फेर्ने अभ्यास गर्नुहोस्',
      'नियमित रूपमा चिसो पानी पिउनुहोस्',
    ],
    section4Body1: 'यी उपायहरूले हट फ्ल्यासलाई अनिवार्य रूपमा हटाउँदैनन्, तर तिनले घटनाहरू व्यवस्थापन गर्न सजिलो बनाउन र हुँदा असहजता घटाउन सक्छन्।',
    section5Body1: 'पेरिमेनोपज र रजोनिवृत्तिमा हट फ्ल्यास सामान्य हुन्छन्। तैपनि, तिनीसँग बाँच्न गाह्रो भएमा तपाईंले त्यसै सहनुपर्दैन। चिकित्सक वा सुँडेनीले तपाईंका लक्षणहरूको मूल्याङ्कन गर्न र तपाईंसँग विभिन्न विकल्पहरूबारे छलफल गर्न सक्छन्।',
    whenAppointmentTitle: 'कहिले भेटघाट तय गर्नुपर्छ?',
    section5Body2: 'लक्षणहरूले तपाईंको दैनिक जीवनमा ठूलो प्रभाव पार्दा वा कुन विकल्पहरू उपलब्ध छन् जान्न चाहँदा परामर्श विशेष रूपमा उपयोगी हुन सक्छ।',
    consultReasons: [
      {
        title: 'निद्रामा बाधा हुँदा',
        text: 'बारम्बार हट फ्ल्यास वा रातको पसिनाले बारम्बार ब्युँझने, ठूलो थकान वा दिनमा सामान्य रूपमा काम गर्न कठिनाइ निम्त्याउँदा।',
      },
      {
        title: 'दैनिक जीवन गाह्रो हुँदा',
        text: 'हट फ्ल्यासले तपाईंको काम, गतिविधि, यात्रा, सामाजिक सम्बन्ध वा केवल तपाईंको दैनिक सहजतामा बाधा पुर्‍याउँदा।',
      },
      {
        title: 'लक्षणहरू बढी बारम्बार हुँदा',
        text: 'लक्षणहरूको आवृत्ति वा तीव्रतामा स्पष्ट वृद्धि सबैभन्दा उपयुक्त समाधानहरू खोज्न छलफल गर्न लायक छ।',
      },
      {
        title: 'तपाईं उपचारबारे सोच्दै हुनुहुन्छ भने',
        text: 'तपाईंको अवस्थाअनुसार हर्मोनल र गैर-हर्मोनल विकल्पहरू प्रस्ताव गर्न सकिन्छ। व्यावसायिकले तपाईंलाई तिनका फाइदा, जोखिम र सम्भावित निषेध तौलन मद्दत गर्न सक्छन्।',
      },
    ],
    notMenopauseTitle: 'सबै कुरा रजोनिवृत्तिलाई नदिनुहोस्',
    notMenopauseBody: 'हट फ्ल्यासका विभिन्न कारण हुन सक्छन्। केही लक्षणहरू कुनै औषधि, अर्को चिकित्सकीय अवस्था वा तपाईंको स्वास्थ्यमा ठूलो परिवर्तनसँग पनि जोडिएका हुन सक्छन्। कुनै कुरा असामान्य, नयाँ वा विशेष रूपमा तीव्र लागे, स्वतः रजोनिवृत्ति हो भनी मान्नुभन्दा व्यावसायिकसँग कुरा गर्नु राम्रो हुन्छ।',
    alertTitle: 'तुरुन्तै उपचार खोज्नुहोस्',
    alertText: 'छातीमा दुखाइ, अचानक सास फेर्न गाह्रो, बेहोस हुन लागेको अनुभूति, अचानक कमजोरी, वा एउटा खुट्टामा असामान्य दुखाइसहितको सुन्निनेले तुरुन्तै चिकित्सकीय ध्यान चाहिन्छ।',
    emergencySignsTitle: 'कुन संकेतहरूले विशेष ध्यान पाउनुपर्छ?',
    emergencySigns: [
      'असामान्य वा गम्भीर छातीको दुखाइ',
      'अचानक सास फेर्न गाह्रो वा ठूलो श्वास कठिनाइ',
      'बेहोस हुन लागेको अनुभूति वा चेतना गुमाउनु',
      'अचानक कमजोरी, वा बोल्न वा हेर्न कठिनाइ',
      'एउटा खुट्टामा दुखाइसहितको असामान्य सुन्निने',
    ],
    solutionsTitle: 'कुन समाधानहरू उपलब्ध हुन सक्छन्?',
    solutionsBody: 'हट फ्ल्यासले व्यवस्थापन चाहिने गरी असहज बनाएमा, धेरै उपायहरू विचार गर्न सकिन्छ। तपाईंको अवस्थाअनुसार, व्यावसायिकले जीवनशैलीका उपाय, गैर-हर्मोनल उपचार, वा उपयुक्त भएमा हर्मोन थेरापीबारे छलफल गर्न सक्छन्।',
    highlight2Title: 'उपचार केस-केसअनुसार छानिन्छ',
    highlight2Text: 'उमेर, लक्षण, चिकित्सकीय इतिहास, हालका उपचार र व्यक्तिगत रुचिले प्रस्ताव गरिने विकल्पहरूलाई प्रभाव पार्न सक्छन्।',
    prepareTitle: 'आफ्नो भेटघाटको तयारी',
    prepareBody: 'केही जानकारीसहित आउँदा परामर्श बढी उपयोगी हुन सक्छ। तपाईं केही दिन वा हप्तासम्म घटनाहरू कति पटक हुन्छन्, कति तीव्र छन्, र तपाईंको निद्रा वा गतिविधिमा तिनको प्रभाव अनुगमन गर्न सक्नुहुन्छ।',
    questionsTitle: 'तयार गर्न उपयोगी जानकारी',
    appointmentQuestions: [
      'तपाईंका हट फ्ल्यास कति पटक हुन्छन्?',
      'तपाईंले यी कति समयदेखि अनुभव गर्दै हुनुहुन्छ?',
      'के यी प्रायः दिनमा, रातमा, वा दुवैमा हुन्छन्?',
      'के यिनले तपाईंको निद्रा वा गतिविधिमा बाधा पुर्‍याउँछन्?',
      'के तपाईंले कुनै ट्रिगर पहिचान गर्नुभएको छ?',
      'के तपाईं हाल कुनै औषधि वा हर्मोनल गर्भनिरोधन लिँदै हुनुहुन्छ?',
    ],
    professionalTipText: 'लक्षणहरू निकै गम्भीर नभएसम्म तिनबारे कुरा गर्न पर्खनु पर्दैन। परामर्शले तपाईंलाई के भइरहेको छ बुझ्न र उपलब्ध समाधानहरूबारे जान्न पनि मद्दत गर्न सक्छ।',
    summaryTitle: 'आवश्यक कुराहरू',
    summaryItems: [
      'रजोनिवृत्तिको संक्रमणमा हट फ्ल्यास सामान्य हुन्छन्।',
      'आफ्ना ट्रिगरहरू पहिचान गर्नाले घटनाहरू राम्ररी व्यवस्थापन गर्न मद्दत गर्न सक्छ।',
      'सरल बानीहरूले दैनिक असहजता घटाउन सक्छन्।',
      'लक्षणहरूले तपाईंको निद्रा वा दैनिक जीवनमा बाधा पुर्‍याएमा, व्यावसायिकसँग कुरा गर्नुहोस्।',
      'तपाईंको अवस्थाअनुसार धेरै व्यवस्थापन विकल्पहरूबारे छलफल गर्न सकिन्छ।',
    ],
    finalTipText: 'हट फ्ल्यास सामान्य हुन्, तर ती तपाईंको निद्रा, काम वा भलाइमा असर गर्दा बेवास्ता गर्नु हुँदैन। आफ्ना लक्षणहरूमा ध्यान दिनु र व्यावसायिकसँग कुरा गर्नुले तपाईंलाई तिनको कारण राम्ररी बुझ्न र उपयुक्त समाधानहरू खोज्न मद्दत गर्न सक्छ।',
    disclaimerText: 'यो लेख केवल जानकारीका लागि हो र व्यक्तिगत चिकित्सकीय सल्लाहको स्थान लिँदैन।',
    shareMessage: 'तातो हुने (हट फ्ल्यास) लाई वशमा राख्ने — AWA',
  },
  si: {
    badge: 'උණුසුම් රැළි',
    title: 'උණුසුම් රැළි\nපාලනය කිරීම',
    metaDuration: 'කියවීමට මිනිත්තු 10',
    metaType: 'ලිපිය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඒවා සිදුවන්නේ ඇයි, ඔබේ අවුලුවන සාධක හඳුනාගන්නේ කෙසේද, සහ ඒවා කරදර සහගත වන විට උපකාරී විය හැකි විසඳුම් මොනවාද.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'උණුසුම් රැළි සිදුවන්නේ ඇයි',
      'රාත්‍රී දහදිය',
      'පොදු අවුලුවන සාධක',
      'උපකාරී වන එදිනෙදා පුරුදු',
      'වෘත්තිකයෙකු සමඟ කතා කළ යුත්තේ කවදාද',
      'ප්‍රධාන කරුණු',
    ],
    section1Body1: 'ඔසප් නැවතීමේ සංක්‍රාන්තියේදී උණුසුම් රැළි ඉතා පොදුයි. ඒවා අර්ධවශයෙන් මොළය ශරීර උෂ්ණත්වය නියාමනය කරන ආකාරයට බලපාන හෝමෝන වෙනස්කම් සමඟ සම්බන්ධ වේ.',
    section1Body2: 'ශරීර උෂ්ණත්වයේ කුඩා වෙනසක් එවිට හදිසි උණුසුමක් ලෙස දැනිය හැක. ශරීරය සමේ රුධිර නාල ප්‍රසාරණය කිරීමෙන් ප්‍රතිචාර දක්වන අතර, එය උණුසුම, රතු වීම, සහ සමහර විට අධික දහදිය දැමීමක් ඇති කළ හැක.',
    highlight1Title: 'සෑම පුද්ගලයෙක්ම වෙනස්',
    highlight1Text: 'සමහර කාන්තාවන්ට සතියකට කථාංග කිහිපයක් අත්විඳිය හැකි අතර, අනෙක් අයට දිනකට කිහිපයක් තිබිය හැක. තීව්‍රතාව සහ කාලයද වෙනස් විය හැක.',
    section2Body1: 'නින්දේදී සිදුවන විට, උණුසුම් රැළි රාත්‍රී දහදියට හේතු විය හැක. ඒවා නැවත නැවත අවදි වීමට හේතු වී නින්ද අඩු විවේකයක් කළ හැක.',
    section2Body2: 'නින්ද නොමැතිකම දවල් කාලයේ වෙහෙස, අවධානය යොමු කිරීමේ අපහසුව සහ කෝපශීලී බව වැඩි කළ හැක. එබැවින් ඔබේ රෝග ලක්ෂණවල බලපෑම ඇගයීමේදී නින්දේ ගුණාත්මකභාවය සැලකිල්ලට ගැනීම උපකාරී විය හැක.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'හුස්ම ගත හැකි නිදාගන්නා ඇඳුම්, සැහැල්ලු ඇඳ ඇතිරිලි, සහ ප්‍රමාණවත් ලෙස සිසිල් නිදන කාමරයක් රාත්‍රියේ අපහසුතාව සීමා කිරීමට උපකාරී විය හැක.',
    section3Body1: 'සමහර සාධක උණුසුම් රැල්ලක් අවුලුවා හෝ තීව්‍ර කළ හැක. ඒවා සෑම කෙනෙකුටම රෝග ලක්ෂණ ඇති නොකරනු ඇත, නමුත් ඒවා හඳුනාගැනීම ඔබේම රටා වඩා හොඳින් තේරුම් ගැනීමට උපකාරී විය හැක.',
    triggers: [
      'කැෆේන් සහ මත්පැන්',
      'කුළුබඩු සහිත ආහාර',
      'ආතතිය සහ දැඩි හැඟීම්',
      'අධික උණුසුම් කාමරයක් හෝ ඉතා බර ඇඳුම්',
    ],
    tip2Title: 'ප්‍රයෝජනවත් කුඩා පුරුද්දක්',
    tip2Text: 'සති කිහිපයක් සඳහා, ඔබේ උණුසුම් රැළි සිදුවන විට, ඒවා කෙතරම් තීව්‍රද, සහ ඊට පෙර සිදු වූයේ කුමක්දැයි සටහන් කරන්න. මෙය ඔබේ පෞද්ගලික අවුලුවන සාධක හඳුනාගැනීමට උපකාරී විය හැක.',
    dailyHabits: [
      'සැහැල්ලු ස්ථර ලෙස ඇඳුම් ඇඳගන්න',
      'ඔබේ අවකාශය සිසිල්ව සහ හොඳින් වාතාශ්‍රයකින් තබාගන්න',
      'උණුසුම් රැල්ලක් අතරතුර සෙමින් හුස්ම ගැනීම පුහුණු කරන්න',
      'සිසිල් ජලය නිතිපතා පානය කරන්න',
    ],
    section4Body1: 'මෙම ක්‍රියාමාර්ග උණුසුම් රැළි අනිවාර්යයෙන්ම නොපෙනී යන්නට සලස්වන්නේ නැත, නමුත් ඒවාට කථාංග කළමනාකරණය කිරීම පහසු කර ඒවා සිදුවන විට අපහසුතාව අඩු කළ හැක.',
    section5Body1: 'ඔසප් නැවතීමට පෙර සහ ඔසප් නැවතීම අතරතුර උණුසුම් රැළි පොදුයි. එසේ වුවද, ඒවා සමඟ ජීවත් වීම අපහසු වන්නේ නම් ඔබ ඒවා සරලව විඳදරාගත යුතු නැත. වෛද්‍යවරයෙකුට හෝ ප්‍රසව හෙදියකට ඔබේ රෝග ලක්ෂණ තක්සේරු කර විවිධ විකල්ප ඔබ සමඟ සාකච්ඡා කළ හැක.',
    whenAppointmentTitle: 'ඔබ හමුවීමක් ලබාගත යුත්තේ කවදාද?',
    section5Body2: 'රෝග ලක්ෂණ ඔබේ එදිනෙදා ජීවිතයට සැලකිය යුතු බලපෑමක් ඇති කරන විට හෝ ඔබට ඇති විකල්ප මොනවාදැයි දැනගැනීමට අවශ්‍ය වන විට උපදේශනයක් විශේෂයෙන් ප්‍රයෝජනවත් විය හැක.',
    consultReasons: [
      {
        title: 'නින්ද කඩාකප්පල් වන විට',
        text: 'නැවත නැවත අවදි වීමට, සැලකිය යුතු වෙහෙසට, හෝ දවල් කාලයේ සාමාන්‍ය ලෙස ක්‍රියා කිරීමේ අපහසුවට හේතු වන නිතර උණුසුම් රැළි හෝ රාත්‍රී දහදිය.',
      },
      {
        title: 'එදිනෙදා ජීවිතය අපහසු වන විට',
        text: 'උණුසුම් රැළි ඔබේ රැකියාවට, ක්‍රියාකාරකම්වලට, ගමන්වලට, සමාජ සබඳතාවලට, හෝ ඔබේ එදිනෙදා සුවපහසුවට බාධා කරන්නේ නම්.',
      },
      {
        title: 'රෝග ලක්ෂණ වඩාත් නිතර සිදුවන විට',
        text: 'රෝග ලක්ෂණවල සංඛ්‍යාතයේ හෝ තීව්‍රතාවයේ පැහැදිලි වැඩිවීමක් වඩාත්ම සුදුසු විසඳුම් සොයාගැනීමට සාකච්ඡා කිරීම වටී.',
      },
      {
        title: 'ඔබ ප්‍රතිකාරයක් ගැන සලකා බලන්නේ නම්',
        text: 'ඔබේ තත්ත්වය අනුව හෝමෝන සහ හෝමෝන නොවන විකල්ප ඉදිරිපත් කළ හැක. වෘත්තිකයෙකුට ඒවායේ ප්‍රතිලාභ, අවදානම් සහ ඇතිවිය හැකි ප්‍රතිවිරෝධතා කිරා මැන බැලීමට ඔබට උදව් කළ හැක.',
      },
    ],
    notMenopauseTitle: 'සියල්ල ඔසප් නැවතීමට ආරෝපණය නොකරන්න',
    notMenopauseBody: 'උණුසුම් රැල්ලකට විවිධ හේතු තිබිය හැක. සමහර රෝග ලක්ෂණ ඖෂධයකට, වෙනත් වෛද්‍ය තත්ත්වයකට, හෝ ඔබේ සෞඛ්‍යයේ සැලකිය යුතු වෙනසකට සම්බන්ධ විය හැක. යමක් අසාමාන්‍ය, අලුත්, හෝ විශේෂයෙන් තීව්‍ර ලෙස දැනේ නම්, එය ඔසප් නැවතීම යැයි ස්වයංක්‍රීයව උපකල්පනය කරනවාට වඩා වෘත්තිකයෙකු සමඟ කතා කිරීම වඩා හොඳයි.',
    alertTitle: 'කඩිනමින් සත්කාර ලබාගන්න',
    alertText: 'පපුවේ වේදනාව, හදිසි හුස්ම හිරවීම, ක්ලාන්ත බවක් දැනීම, හදිසි දුර්වලතාව, හෝ එක් කකුලක අසාමාන්‍ය වේදනාකාරී ඉදිමීමකට කඩිනම් වෛද්‍ය අවධානයක් අවශ්‍යයි.',
    emergencySignsTitle: 'කුමන සලකුණුවලට විශේෂ අවධානයක් ලැබිය යුතුද?',
    emergencySigns: [
      'අසාමාන්‍ය හෝ දැඩි පපුවේ වේදනාව',
      'හදිසි හුස්ම හිරවීම හෝ සැලකිය යුතු හුස්ම ගැනීමේ අපහසුව',
      'ක්ලාන්ත බවක් දැනීම හෝ සිහිය නැති වීම',
      'හදිසි දුර්වලතාව, හෝ කතා කිරීමේ හෝ බැලීමේ අපහසුව',
      'එක් කකුලක වේදනාකාරී, අසාමාන්‍ය ඉදිමීම',
    ],
    solutionsTitle: 'කුමන විසඳුම් ලබාගත හැකිද?',
    solutionsBody: 'උණුසුම් රැළි කළමනාකරණය අවශ්‍ය වන තරමට කරදර සහගත නම්, ප්‍රවේශ කිහිපයක් සලකා බැලිය හැක. ඔබේ තත්ත්වය අනුව, වෘත්තිකයා ජීවන රටා ක්‍රියාමාර්ග, හෝමෝන නොවන ප්‍රතිකාර, හෝ සුදුසු විට හෝමෝන ප්‍රතිකාරය සාකච්ඡා කළ හැක.',
    highlight2Title: 'ප්‍රතිකාරය අවස්ථාවෙන් අවස්ථාවට තෝරා ගනී',
    highlight2Text: 'වයස, රෝග ලක්ෂණ, වෛද්‍ය ඉතිහාසය, වත්මන් ප්‍රතිකාර සහ පෞද්ගලික මනාප සියල්ලම ඉදිරිපත් කරන විකල්පවලට බලපෑ හැක.',
    prepareTitle: 'ඔබේ හමුවීමට සූදානම් වීම',
    prepareBody: 'යම් තොරතුරු සමඟ පැමිණීම උපදේශනය වඩා ප්‍රයෝජනවත් කළ හැක. ඔබට දින හෝ සති කිහිපයක් පුරා, කථාංග සිදුවන සංඛ්‍යාතය, ඒවා කෙතරම් තීව්‍රද, සහ ඔබේ නින්දට හෝ ක්‍රියාකාරකම්වලට ඒවායේ බලපෑම නිරීක්ෂණය කළ හැක.',
    questionsTitle: 'සූදානම් කිරීමට ප්‍රයෝජනවත් තොරතුරු',
    appointmentQuestions: [
      'ඔබේ උණුසුම් රැළි කොපමණ නිතර සිදුවේද?',
      'ඔබ ඒවා අත්විඳින්නේ කොපමණ කාලයක සිටද?',
      'ඒවා දවල් කාලයේ, රාත්‍රියේ, හෝ දෙකෙහිම සිදුවීමට නැඹුරුද?',
      'ඒවා ඔබේ නින්දට හෝ ක්‍රියාකාරකම්වලට බාධා කරන්නේද?',
      'ඔබ කිසියම් අවුලුවන සාධක හඳුනාගෙන තිබේද?',
      'ඔබ දැනට කිසියම් ඖෂධයක් හෝ හෝමෝන ගර්භනිරෝධනයක් ගන්නේද?',
    ],
    professionalTipText: 'රෝග ලක්ෂණ ඉතා දැඩි වන තුරු ඒවා ගැන කතා කිරීමට ඔබ බලා සිටිය යුතු නැත. උපදේශනයකට ඔබට සිදුවන දේ තේරුම් ගැනීමට සහ ලබාගත හැකි විසඳුම් ගැන දැනගැනීමටද සරලව උපකාරී විය හැක.',
    summaryTitle: 'අත්‍යවශ්‍ය දේ',
    summaryItems: [
      'ඔසප් නැවතීමේ සංක්‍රාන්තියේදී උණුසුම් රැළි පොදුයි.',
      'ඔබේ අවුලුවන සාධක හඳුනාගැනීම කථාංග වඩා හොඳින් කළමනාකරණය කිරීමට ඔබට උපකාරී විය හැක.',
      'සරල පුරුදුවලට එදිනෙදා අපහසුතාව අඩු කළ හැක.',
      'රෝග ලක්ෂණ ඔබේ නින්දට හෝ එදිනෙදා ජීවිතයට බාධා කරන්නේ නම්, වෘත්තිකයෙකු සමඟ කතා කරන්න.',
      'ඔබේ තත්ත්වය අනුව කළමනාකරණ විකල්ප කිහිපයක් සාකච්ඡා කළ හැක.',
    ],
    finalTipText: 'උණුසුම් රැළි පොදුයි, නමුත් ඒවා ඔබේ නින්දට, රැකියාවට, හෝ යහපැවැත්මට බලපාන විට ඒවා නොසලකා හැරිය යුතු නැත. ඔබේ රෝග ලක්ෂණ ගැන අවධානය යොමු කිරීම සහ වෘත්තිකයෙකු සමඟ කතා කිරීම, ඒවායේ හේතුව වඩා හොඳින් තේරුම් ගැනීමට සහ සුදුසු විසඳුම් ගවේෂණය කිරීමට ඔබට උපකාරී විය හැක.',
    disclaimerText: 'මෙම ලිපිය තොරතුරු සඳහා පමණක් වන අතර පුද්ගලීකරණය කළ වෛද්‍ය උපදෙස් වෙනුවට නොපවතී.',
    shareMessage: 'උණුසුම් රැළි පාලනය කිරීම — AWA',
  },
  th: {
    badge: 'อาการร้อนวูบวาบ',
    title: 'รับมือ\nอาการร้อนวูบวาบ',
    metaDuration: 'อ่าน 10 นาที',
    metaType: 'บทความ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ทำไมจึงเกิดขึ้น ระบุตัวกระตุ้นของคุณอย่างไร และวิธีแก้ที่อาจช่วยได้เมื่ออาการรบกวน',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ทำไมจึงเกิดอาการร้อนวูบวาบ',
      'เหงื่อออกตอนกลางคืน',
      'ตัวกระตุ้นที่พบบ่อย',
      'นิสัยประจำวันที่ช่วยได้',
      'เมื่อไรควรพูดคุยกับผู้เชี่ยวชาญ',
      'ประเด็นสำคัญ',
    ],
    section1Body1: 'อาการร้อนวูบวาบพบบ่อยมากในช่วงเปลี่ยนผ่านสู่วัยหมดประจำเดือน เกี่ยวข้องส่วนหนึ่งกับการเปลี่ยนแปลงของฮอร์โมนที่ส่งผลต่อวิธีที่สมองควบคุมอุณหภูมิร่างกาย',
    section1Body2: 'การเปลี่ยนแปลงเล็กน้อยของอุณหภูมิร่างกายอาจรู้สึกเหมือนความร้อนที่มาอย่างกะทันหัน ร่างกายตอบสนองโดยขยายหลอดเลือดที่ผิวหนัง ซึ่งทำให้รู้สึกร้อน หน้าแดง และบางครั้งเหงื่อออกมาก',
    highlight1Title: 'แต่ละคนไม่เหมือนกัน',
    highlight1Text: 'ผู้หญิงบางคนมีอาการไม่กี่ครั้งต่อสัปดาห์ ขณะที่บางคนอาจมีหลายครั้งต่อวัน ความรุนแรงและระยะเวลาก็แตกต่างกัน',
    section2Body1: 'เมื่อเกิดขึ้นระหว่างนอนหลับ อาการร้อนวูบวาบทำให้เหงื่อออกตอนกลางคืนได้ อาจทำให้ตื่นซ้ำ ๆ และทำให้การนอนไม่สดชื่น',
    section2Body2: 'การนอนไม่พออาจเพิ่มความเหนื่อยล้า ความยากในการมีสมาธิ และความหงุดหงิดในตอนกลางวัน จึงมีประโยชน์ที่จะนำคุณภาพการนอนมาประกอบการประเมินผลกระทบของอาการ',
    tip1Title: 'ควรรู้',
    tip1Text: 'ชุดนอนที่ระบายอากาศได้ เครื่องนอนเบา ๆ และห้องนอนที่เย็นพอ ช่วยจำกัดความไม่สบายตอนกลางคืนได้',
    section3Body1: 'ปัจจัยบางอย่างกระตุ้นหรือทำให้อาการร้อนวูบวาบรุนแรงขึ้นได้ ไม่จำเป็นต้องทำให้เกิดอาการในทุกคน แต่การระบุปัจจัยเหล่านี้ช่วยให้คุณเข้าใจรูปแบบของตัวเองดียิ่งขึ้น',
    triggers: [
      'คาเฟอีนและแอลกอฮอล์',
      'อาหารรสเผ็ด',
      'ความเครียดและอารมณ์รุนแรง',
      'ห้องที่ร้อนเกินไปหรือเสื้อผ้าที่หนาเกินไป',
    ],
    tip2Title: 'นิสัยเล็ก ๆ ที่มีประโยชน์',
    tip2Text: 'เป็นเวลาสองสามสัปดาห์ ให้จดว่าอาการร้อนวูบวาบเกิดเมื่อไร รุนแรงแค่ไหน และเกิดอะไรขึ้นก่อนหน้า ช่วยให้คุณสังเกตตัวกระตุ้นส่วนตัวได้',
    dailyHabits: [
      'แต่งตัวหลายชั้นแบบเบา ๆ',
      'รักษาพื้นที่ให้เย็นและมีอากาศถ่ายเท',
      'หายใจช้า ๆ ระหว่างเกิดอาการ',
      'ดื่มน้ำเย็นสม่ำเสมอ',
    ],
    section4Body1: 'มาตรการเหล่านี้ไม่ได้ทำให้อาการร้อนวูบวาบหายไปเสมอไป แต่ช่วยให้จัดการแต่ละครั้งได้ง่ายขึ้นและลดความไม่สบายเมื่อเกิดขึ้น',
    section5Body1: 'อาการร้อนวูบวาบพบบ่อยในช่วงใกล้หมดประจำเดือนและวัยหมดประจำเดือน แต่คุณไม่จำเป็นต้องทนเฉย ๆ หากอาการทำให้ใช้ชีวิตลำบาก แพทย์หรือผดุงครรภ์ประเมินอาการของคุณและพูดคุยทางเลือกต่าง ๆ กับคุณได้',
    whenAppointmentTitle: 'เมื่อไรควรนัดหมาย?',
    section5Body2: 'การปรึกษามีประโยชน์เป็นพิเศษเมื่ออาการมีผลต่อชีวิตประจำวันอย่างมาก หรือเมื่อคุณอยากรู้ว่ามีทางเลือกอะไรบ้าง',
    consultReasons: [
      {
        title: 'เมื่อการนอนถูกรบกวน',
        text: 'อาการร้อนวูบวาบหรือเหงื่อออกตอนกลางคืนบ่อยจนทำให้ตื่นซ้ำ ๆ เหนื่อยล้ามาก หรือใช้ชีวิตตามปกติในตอนกลางวันได้ยาก',
      },
      {
        title: 'เมื่อชีวิตประจำวันเริ่มยากลำบาก',
        text: 'หากอาการร้อนวูบวาบรบกวนงาน กิจกรรม การเดินทาง ความสัมพันธ์ทางสังคม หรือความสบายในแต่ละวันของคุณ',
      },
      {
        title: 'เมื่ออาการเกิดถี่ขึ้น',
        text: 'ความถี่หรือความรุนแรงของอาการที่เพิ่มขึ้นอย่างชัดเจนควรพูดคุยเพื่อหาวิธีแก้ที่เหมาะสมที่สุด',
      },
      {
        title: 'หากคุณกำลังพิจารณาการรักษา',
        text: 'อาจเสนอทางเลือกทั้งที่ใช้ฮอร์โมนและไม่ใช้ฮอร์โมนตามสถานการณ์ของคุณ ผู้เชี่ยวชาญช่วยคุณชั่งน้ำหนักประโยชน์ ความเสี่ยง และข้อห้ามใช้ที่เป็นไปได้',
      },
    ],
    notMenopauseTitle: 'อย่าโทษวัยหมดประจำเดือนกับทุกอย่าง',
    notMenopauseBody: 'อาการร้อนวูบวาบอาจมีสาเหตุต่างกัน อาการบางอย่างอาจเกี่ยวข้องกับยา ภาวะทางการแพทย์อื่น หรือการเปลี่ยนแปลงสำคัญของสุขภาพ หากรู้สึกผิดปกติ ใหม่ หรือรุนแรงเป็นพิเศษ ควรพูดคุยกับผู้เชี่ยวชาญ แทนที่จะสรุปโดยอัตโนมัติว่าเป็นวัยหมดประจำเดือน',
    alertTitle: 'รีบไปพบแพทย์',
    alertText: 'อาการเจ็บหน้าอก หายใจลำบากอย่างกะทันหัน รู้สึกจะเป็นลม อ่อนแรงอย่างกะทันหัน หรือขาข้างหนึ่งบวมและเจ็บผิดปกติ ต้องได้รับการดูแลทางการแพทย์โดยเร็ว',
    emergencySignsTitle: 'สัญญาณใดที่ควรให้ความสนใจเป็นพิเศษ?',
    emergencySigns: [
      'เจ็บหน้าอกผิดปกติหรือรุนแรง',
      'หายใจลำบากอย่างกะทันหันหรือหายใจยากมาก',
      'รู้สึกจะเป็นลมหรือหมดสติ',
      'อ่อนแรงอย่างกะทันหัน หรือพูดหรือมองเห็นลำบาก',
      'ขาข้างหนึ่งบวมและเจ็บผิดปกติ',
    ],
    solutionsTitle: 'มีวิธีแก้อะไรบ้าง?',
    solutionsBody: 'หากอาการร้อนวูบวาบรบกวนจนต้องจัดการ อาจพิจารณาหลายแนวทาง ตามสถานการณ์ของคุณ ผู้เชี่ยวชาญอาจพูดคุยเรื่องมาตรการด้านวิถีชีวิต การรักษาที่ไม่ใช้ฮอร์โมน หรือเมื่อเหมาะสม การบำบัดด้วยฮอร์โมน',
    highlight2Title: 'การรักษาเลือกเป็นรายกรณี',
    highlight2Text: 'อายุ อาการ ประวัติทางการแพทย์ การรักษาปัจจุบัน และความชอบส่วนตัว ล้วนมีอิทธิพลต่อทางเลือกที่เสนอ',
    prepareTitle: 'เตรียมตัวสำหรับการนัดหมายของคุณ',
    prepareBody: 'การมาพร้อมข้อมูลเล็กน้อยทำให้การปรึกษามีประโยชน์มากขึ้น คุณจดความถี่ของอาการ ความรุนแรง และผลต่อการนอนหรือกิจกรรมเป็นเวลาไม่กี่วันหรือสัปดาห์ได้',
    questionsTitle: 'ข้อมูลที่เป็นประโยชน์ที่ควรเตรียม',
    appointmentQuestions: [
      'อาการร้อนวูบวาบของคุณเกิดบ่อยแค่ไหน?',
      'คุณมีอาการมานานเท่าไรแล้ว?',
      'มักเกิดตอนกลางวัน ตอนกลางคืน หรือทั้งสองช่วง?',
      'รบกวนการนอนหรือกิจกรรมของคุณหรือไม่?',
      'คุณระบุตัวกระตุ้นได้หรือไม่?',
      'ขณะนี้คุณทานยาหรือคุมกำเนิดด้วยฮอร์โมนอยู่หรือไม่?',
    ],
    professionalTipText: 'คุณไม่จำเป็นต้องรอจนอาการรุนแรงมากก่อนจึงพูดถึง การปรึกษายังช่วยให้คุณเข้าใจว่าเกิดอะไรขึ้นและรู้จักวิธีแก้ที่มีได้อีกด้วย',
    summaryTitle: 'สาระสำคัญ',
    summaryItems: [
      'อาการร้อนวูบวาบพบบ่อยในช่วงเปลี่ยนผ่านสู่วัยหมดประจำเดือน',
      'การระบุตัวกระตุ้นของคุณช่วยให้จัดการอาการได้ดีขึ้น',
      'นิสัยง่าย ๆ ลดความไม่สบายในชีวิตประจำวันได้',
      'หากอาการรบกวนการนอนหรือชีวิตประจำวัน ให้พูดคุยกับผู้เชี่ยวชาญ',
      'อาจพูดคุยหลายทางเลือกในการจัดการตามสถานการณ์ของคุณ',
    ],
    finalTipText: 'อาการร้อนวูบวาบพบบ่อย แต่ไม่ควรมองข้ามเมื่อมีผลต่อการนอน การทำงาน หรือความเป็นอยู่ที่ดีของคุณ การใส่ใจอาการและพูดคุยกับผู้เชี่ยวชาญช่วยให้เข้าใจสาเหตุและหาวิธีแก้ที่เหมาะสมได้',
    disclaimerText: 'บทความนี้เพื่อให้ข้อมูลเท่านั้น และไม่ได้ทดแทนคำแนะนำทางการแพทย์เฉพาะบุคคล',
    shareMessage: 'รับมืออาการร้อนวูบวาบ — AWA',
  },
  vi: {
    badge: 'BỐC HỎA',
    title: 'Làm dịu\ncác cơn bốc hỏa',
    metaDuration: '10 phút đọc',
    metaType: 'Bài viết',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Tại sao chúng xảy ra, cách nhận biết các yếu tố khởi phát và những giải pháp có thể giúp ích khi chúng trở nên khó chịu.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Tại sao xảy ra bốc hỏa',
      'Đổ mồ hôi ban đêm',
      'Các yếu tố khởi phát thường gặp',
      'Thói quen hằng ngày có ích',
      'Khi nào nên nói chuyện với chuyên gia',
      'Những điểm chính cần nhớ',
    ],
    section1Body1: 'Bốc hỏa rất thường gặp trong giai đoạn chuyển tiếp sang mãn kinh. Chúng liên quan một phần đến những thay đổi nội tiết ảnh hưởng đến cách não điều hòa thân nhiệt.',
    section1Body2: 'Một thay đổi nhỏ về thân nhiệt khi đó có thể cảm thấy như một cơn nóng đột ngột. Cơ thể phản ứng bằng cách giãn các mạch máu ở da, có thể gây cảm giác nóng, đỏ bừng và đôi khi ra nhiều mồ hôi.',
    highlight1Title: 'Mỗi người mỗi khác',
    highlight1Text: 'Một số phụ nữ chỉ có vài cơn mỗi tuần, trong khi người khác có thể có nhiều cơn mỗi ngày. Cường độ và thời gian cũng có thể khác nhau.',
    section2Body1: 'Khi xảy ra trong lúc ngủ, bốc hỏa có thể gây đổ mồ hôi ban đêm. Chúng có thể khiến bạn thức giấc nhiều lần và làm giấc ngủ kém yên hơn.',
    section2Body2: 'Thiếu ngủ sau đó có thể làm tăng mệt mỏi, khó tập trung và cáu gắt vào ban ngày. Vì vậy, có thể hữu ích khi tính đến chất lượng giấc ngủ khi đánh giá tác động của các triệu chứng.',
    tip1Title: 'Nên biết',
    tip1Text: 'Đồ ngủ thoáng khí, chăn ga nhẹ và phòng ngủ đủ mát có thể giúp hạn chế khó chịu vào ban đêm.',
    section3Body1: 'Một số yếu tố có thể khởi phát hoặc làm tăng cơn bốc hỏa. Chúng không nhất thiết gây triệu chứng ở mọi người, nhưng nhận biết chúng có thể giúp bạn hiểu rõ hơn quy luật của riêng mình.',
    triggers: [
      'Caffeine và rượu bia',
      'Thức ăn cay',
      'Căng thẳng và cảm xúc mạnh',
      'Căn phòng quá nóng hoặc quần áo quá dày',
    ],
    tip2Title: 'Một thói quen nhỏ hữu ích',
    tip2Text: 'Trong vài tuần, hãy ghi lại khi nào bạn bị bốc hỏa, cường độ ra sao và điều gì xảy ra ngay trước đó. Điều này có thể giúp bạn nhận ra các yếu tố khởi phát của riêng mình.',
    dailyHabits: [
      'Mặc nhiều lớp quần áo mỏng',
      'Giữ không gian của bạn mát mẻ và thông thoáng',
      'Tập thở chậm trong lúc bị bốc hỏa',
      'Uống nước mát đều đặn',
    ],
    section4Body1: 'Những biện pháp này không nhất thiết làm các cơn bốc hỏa biến mất, nhưng chúng có thể giúp các cơn dễ kiểm soát hơn và giảm khó chịu khi xảy ra.',
    section5Body1: 'Bốc hỏa thường gặp trong giai đoạn tiền mãn kinh và mãn kinh. Tuy vậy, bạn không cần phải chỉ cố chịu đựng nếu chúng trở nên khó sống chung. Bác sĩ hoặc nữ hộ sinh có thể đánh giá các triệu chứng của bạn và trao đổi các lựa chọn khác nhau với bạn.',
    whenAppointmentTitle: 'Khi nào nên đặt lịch hẹn?',
    section5Body2: 'Một buổi khám có thể đặc biệt hữu ích khi các triệu chứng ảnh hưởng đáng kể đến cuộc sống hằng ngày hoặc khi bạn muốn biết có những lựa chọn nào.',
    consultReasons: [
      {
        title: 'Khi giấc ngủ bị gián đoạn',
        text: 'Bốc hỏa hoặc đổ mồ hôi ban đêm thường xuyên khiến bạn thức giấc nhiều lần, mệt mỏi đáng kể hoặc khó sinh hoạt bình thường vào ban ngày.',
      },
      {
        title: 'Khi cuộc sống hằng ngày trở nên khó khăn',
        text: 'Nếu bốc hỏa cản trở công việc, hoạt động, việc đi lại, các mối quan hệ xã hội hoặc đơn giản là sự thoải mái hằng ngày của bạn.',
      },
      {
        title: 'Khi các triệu chứng trở nên thường xuyên hơn',
        text: 'Việc tần suất hoặc cường độ triệu chứng tăng rõ rệt đáng được trao đổi để tìm ra những giải pháp phù hợp nhất.',
      },
      {
        title: 'Nếu bạn đang cân nhắc điều trị',
        text: 'Các lựa chọn nội tiết và không nội tiết có thể được đề xuất tùy theo tình huống của bạn. Một chuyên gia có thể giúp bạn cân nhắc lợi ích, rủi ro và các chống chỉ định có thể có của chúng.',
      },
    ],
    notMenopauseTitle: 'Đừng quy mọi thứ cho mãn kinh',
    notMenopauseBody: 'Một cơn bốc hỏa có thể có nhiều nguyên nhân khác nhau. Một số triệu chứng cũng có thể liên quan đến một loại thuốc, một bệnh lý khác hoặc một thay đổi đáng kể về sức khỏe. Nếu có điều gì cảm thấy bất thường, mới xuất hiện hoặc đặc biệt dữ dội, tốt nhất nên nói chuyện với chuyên gia thay vì tự động cho rằng đó là mãn kinh.',
    alertTitle: 'Hãy đi khám ngay',
    alertText: 'Đau ngực, khó thở đột ngột, cảm giác choáng váng, yếu đột ngột hoặc sưng đau bất thường ở một bên chân cần được chăm sóc y tế kịp thời.',
    emergencySignsTitle: 'Những dấu hiệu nào đáng được đặc biệt chú ý?',
    emergencySigns: [
      'Đau ngực bất thường hoặc dữ dội',
      'Khó thở đột ngột hoặc khó thở đáng kể',
      'Cảm giác choáng váng hoặc ngất xỉu',
      'Yếu đột ngột, hoặc khó nói hay khó nhìn',
      'Sưng đau bất thường ở một bên chân',
    ],
    solutionsTitle: 'Có thể có những giải pháp nào?',
    solutionsBody: 'Nếu bốc hỏa khó chịu đến mức cần được kiểm soát, có thể cân nhắc nhiều cách tiếp cận. Tùy tình huống của bạn, chuyên gia có thể trao đổi về các biện pháp lối sống, các phương pháp điều trị không dùng hormone hoặc, khi phù hợp, liệu pháp hormone.',
    highlight2Title: 'Điều trị được chọn theo từng trường hợp',
    highlight2Text: 'Độ tuổi, triệu chứng, tiền sử bệnh, các thuốc đang dùng và sở thích cá nhân đều có thể ảnh hưởng đến các lựa chọn được đề xuất.',
    prepareTitle: 'Chuẩn bị cho buổi hẹn của bạn',
    prepareBody: 'Mang theo một chút thông tin có thể giúp buổi khám hữu ích hơn. Bạn có thể theo dõi, trong vài ngày hoặc vài tuần, tần suất các cơn xảy ra, cường độ và tác động của chúng đến giấc ngủ hoặc hoạt động của bạn.',
    questionsTitle: 'Thông tin hữu ích cần chuẩn bị',
    appointmentQuestions: [
      'Bạn bị bốc hỏa với tần suất thế nào?',
      'Bạn đã bị như vậy được bao lâu?',
      'Chúng thường xảy ra vào ban ngày, ban đêm hay cả hai?',
      'Chúng có làm gián đoạn giấc ngủ hoặc hoạt động của bạn không?',
      'Bạn đã nhận ra yếu tố khởi phát nào chưa?',
      'Hiện bạn có đang dùng thuốc hoặc biện pháp tránh thai nội tiết nào không?',
    ],
    professionalTipText: 'Bạn không cần chờ đến khi triệu chứng trở nên rất nặng mới nói về chúng. Một buổi khám cũng có thể đơn giản giúp bạn hiểu điều gì đang xảy ra và tìm hiểu các giải pháp hiện có.',
    summaryTitle: 'Điều thiết yếu',
    summaryItems: [
      'Bốc hỏa thường gặp trong giai đoạn chuyển tiếp mãn kinh.',
      'Nhận biết các yếu tố khởi phát có thể giúp bạn kiểm soát các cơn tốt hơn.',
      'Những thói quen đơn giản có thể giảm khó chịu hằng ngày.',
      'Nếu triệu chứng làm gián đoạn giấc ngủ hoặc cuộc sống hằng ngày, hãy nói chuyện với chuyên gia.',
      'Có thể trao đổi nhiều lựa chọn kiểm soát tùy theo tình huống của bạn.',
    ],
    finalTipText: 'Bốc hỏa là điều thường gặp, nhưng không nên xem nhẹ khi chúng ảnh hưởng đến giấc ngủ, công việc hoặc sức khỏe của bạn. Chú ý đến các triệu chứng và nói chuyện với chuyên gia có thể giúp bạn hiểu rõ hơn nguyên nhân và tìm hiểu những giải pháp phù hợp.',
    disclaimerText: 'Bài viết này chỉ mang tính thông tin và không thay thế lời khuyên y khoa cá nhân hóa.',
    shareMessage: 'Làm dịu các cơn bốc hỏa — AWA',
  },
  uz: {
    badge: 'ISSIQ TOSHISHLAR',
    title: 'Issiq toshishlarni\nyengillashtirish',
    metaDuration: '10 daq oʻqish',
    metaType: 'Maqola',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Ular nima uchun sodir boʻladi, qoʻzgʻatuvchilarni qanday aniqlash va ular bezovta qila boshlaganda qanday yechimlar yordam berishi mumkin.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Issiq toshishlar nima uchun sodir boʻladi',
      'Tungi terlash',
      'Keng tarqalgan qoʻzgʻatuvchilar',
      'Yordam beradigan kundalik odatlar',
      'Qachon mutaxassis bilan gaplashish kerak',
      'Asosiy xulosalar',
    ],
    section1Body1: 'Issiq toshishlar menopauzaga oʻtish davrida juda keng tarqalgan. Ular qisman miyaning tana haroratini boshqarishiga taʼsir qiladigan gormonal oʻzgarishlar bilan bogʻliq.',
    section1Body2: 'Tana haroratidagi kichik siljish keyin kuchli issiqdek his qilinishi mumkin. Tana teri qon tomirlarini kengaytirish bilan javob beradi, bu issiqlik, qizarish va baʼzan kuchli terlash hissiga olib kelishi mumkin.',
    highlight1Title: 'Har bir odam boshqacha',
    highlight1Text: 'Baʼzi ayollarda haftasiga bir necha epizod boʻladi, boshqalarida kuniga bir nechta boʻlishi mumkin. Kuchi va davomiyligi ham farq qilishi mumkin.',
    section2Body1: 'Uyqu paytida sodir boʻlganda, issiq toshishlar tungi terlashga sabab boʻlishi mumkin. Ular takroriy uygʻonishlarga olib kelishi va uyquni kamroq dam beruvchi qilishi mumkin.',
    section2Body2: 'Uyqu yetishmasligi keyin kunduzi charchoq, diqqatni jamlashda qiyinchilik va jizzakilikni oshirishi mumkin. Shuning uchun alomatlarning taʼsirini baholashda uyqu sifatini hisobga olish foydali boʻlishi mumkin.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Nafas oluvchi pijama, yengil ogʻirlik va yetarli darajada salqin yotoqxona tunda noqulaylikni cheklashga yordam beradi.',
    section3Body1: 'Baʼzi omillar issiq toshishni qoʻzgʻatishi yoki kuchaytirishi mumkin. Ular hammada alomatlarga sabab boʻlmasligi mumkin, ammo ularni aniqlash oʻz qonuniyatlaringizni yaxshiroq tushunishga yordam beradi.',
    triggers: [
      'Kofein va spirtli ichimliklar',
      'Achchiq oziq-ovqatlar',
      'Stress va kuchli hissiyotlar',
      'Haddan tashqari isitilgan xona yoki juda ogʻir kiyim',
    ],
    tip2Title: 'Foydali kichik odat',
    tip2Text: 'Bir necha hafta davomida issiq toshishlar qachon sodir boʻlishini, qanchalik kuchli ekanini va undan oldin nima boʻlganini yozib qoʻying. Bu shaxsiy qoʻzgʻatuvchilaringizni aniqlashga yordam beradi.',
    dailyHabits: [
      'Yengil qatlamli kiyining',
      'Oʻz maydoningizni salqin va yaxshi shamollatilgan holda saqlang',
      'Issiq toshish paytida sekin nafas olishni mashq qiling',
      'Muntazam salqin suv iching',
    ],
    section4Body1: 'Bu choralar issiq toshishlarni albatta yoʻqotmaydi, lekin epizodlarni boshqarishni osonlashtirishi va ular sodir boʻlganda noqulaylikni kamaytirishi mumkin.',
    section5Body1: 'Issiq toshishlar perimenopauza va menopauzada keng tarqalgan. Shunga qaramay, ular bilan yashash qiyin boʻlib qolsa, shunchaki chidab turishingiz shart emas. Shifokor yoki doya alomatlaringizni baholashi va turli variantlarni siz bilan muhokama qilishi mumkin.',
    whenAppointmentTitle: 'Qachon qabulga yozilish kerak?',
    section5Body2: 'Konsultatsiya, ayniqsa, alomatlar kundalik hayotingizga sezilarli taʼsir qilganda yoki qanday variantlar borligini bilmoqchi boʻlganingizda foydali boʻlishi mumkin.',
    consultReasons: [
      {
        title: 'Uyqu buzilganda',
        text: 'Takroriy uygʻonishlarga, sezilarli charchoqqa yoki kunduzi normal ishlashda qiyinchilikka olib keladigan tez-tez issiq toshishlar yoki tungi terlash.',
      },
      {
        title: 'Kundalik hayot qiyinlashganda',
        text: 'Agar issiq toshishlar ishingiz, faoliyatingiz, sayohatingiz, ijtimoiy munosabatlaringiz yoki shunchaki kundalik qulayligingizga xalaqit bersa.',
      },
      {
        title: 'Alomatlar tez-tez boʻlganda',
        text: 'Alomatlar chastotasi yoki kuchining aniq ortishi eng mos yechimlarni topish uchun muhokama qilishga arziydi.',
      },
      {
        title: 'Davolanishni oʻylayotgan boʻlsangiz',
        text: 'Vaziyatingizga qarab gormonal va gormonsiz variantlar taklif qilinishi mumkin. Mutaxassis ularning foydalari, xavflari va mumkin boʻlgan qarshi koʻrsatmalarini tortib koʻrishga yordam beradi.',
      },
    ],
    notMenopauseTitle: 'Hamma narsani menopauzaga bogʻlamang',
    notMenopauseBody: 'Issiq toshishning turli sabablari boʻlishi mumkin. Baʼzi alomatlar dori, boshqa tibbiy holat yoki salomatlikdagi sezilarli oʻzgarish bilan ham bogʻliq boʻlishi mumkin. Agar nimadir odatdan tashqari, yangi yoki ayniqsa kuchli tuyulsa, avtomatik tarzda menopauza deb oʻylashdan koʻra mutaxassis bilan gaplashgan maʼqul.',
    alertTitle: 'Zudlik bilan yordam soʻrang',
    alertText: 'Koʻkrak ogʻrigʻi, birdan nafas qisilishi, hushdan ketayotgandek his qilish, birdan holsizlik yoki bir oyoqda odatdan tashqari ogʻriqli shish zudlik bilan tibbiy eʼtiborni talab qiladi.',
    emergencySignsTitle: 'Qaysi belgilar alohida eʼtiborga loyiq?',
    emergencySigns: [
      'Odatdan tashqari yoki kuchli koʻkrak ogʻrigʻi',
      'Birdan nafas qisilishi yoki nafas olishda sezilarli qiyinchilik',
      'Hushdan ketayotgandek his qilish yoki hushdan ketish',
      'Birdan holsizlik yoki gapirish yoki koʻrishda qiyinchilik',
      'Bir oyoqda ogʻriqli, odatdan tashqari shish',
    ],
    solutionsTitle: 'Qanday yechimlar mavjud boʻlishi mumkin?',
    solutionsBody: 'Agar issiq toshishlar boshqarishni talab qiladigan darajada bezovta qilsa, bir necha yondashuvni koʻrib chiqish mumkin. Vaziyatingizga qarab, mutaxassis turmush tarzi choralari, gormonsiz davolanishlar yoki, mos kelganda, gormon terapiyasini muhokama qilishi mumkin.',
    highlight2Title: 'Davolanish har bir holat uchun alohida tanlanadi',
    highlight2Text: 'Yosh, alomatlar, tibbiy tarix, joriy davolanishlar va shaxsiy afzalliklar taklif qilinadigan variantlarga taʼsir qilishi mumkin.',
    prepareTitle: 'Qabulga tayyorgarlik',
    prepareBody: 'Biroz maʼlumot bilan kelish konsultatsiyani foydaliroq qilishi mumkin. Bir necha kun yoki hafta davomida epizodlar qanchalik tez-tez sodir boʻlishini, qanchalik kuchli ekanini va uyqu yoki faoliyatingizga taʼsirini kuzatishingiz mumkin.',
    questionsTitle: 'Tayyorlash foydali boʻlgan maʼlumotlar',
    appointmentQuestions: [
      'Issiq toshishlaringiz qanchalik tez-tez sodir boʻladi?',
      'Ularni qancha vaqtdan beri boshdan kechiryapsiz?',
      'Ular kunduzi, tunda yoki ikkalasida ham sodir boʻlishga moyilmi?',
      'Ular uyqu yoki faoliyatingizni buzadimi?',
      'Biror qoʻzgʻatuvchini aniqladingizmi?',
      'Hozir biror dori yoki gormonal kontratseptsiya qabul qilyapsizmi?',
    ],
    professionalTipText: 'Alomatlar juda kuchli boʻlguncha kutib, keyin ular haqida gaplashish shart emas. Konsultatsiya shunchaki nima sodir boʻlayotganini tushunishga va mavjud yechimlar haqida bilib olishga ham yordam berishi mumkin.',
    summaryTitle: 'Asosiy jihatlar',
    summaryItems: [
      'Issiq toshishlar menopauza oʻtish davrida keng tarqalgan.',
      'Qoʻzgʻatuvchilaringizni aniqlash epizodlarni yaxshiroq boshqarishga yordam beradi.',
      'Oddiy odatlar kundalik noqulaylikni kamaytirishi mumkin.',
      'Agar alomatlar uyqu yoki kundalik hayotni buzsa, mutaxassis bilan gaplashing.',
      'Vaziyatingizga qarab bir necha boshqarish varianti muhokama qilinishi mumkin.',
    ],
    finalTipText: 'Issiq toshishlar keng tarqalgan, ammo ular uyqungiz, ishingiz yoki farovonligingizga taʼsir qilganda ularni eʼtiborsiz qoldirmaslik kerak. Alomatlaringizga eʼtibor berish va mutaxassis bilan gaplashish ularning sababini yaxshiroq tushunishga va mos yechimlarni oʻrganishga yordam beradi.',
    disclaimerText: 'Bu maqola faqat maʼlumot uchun va shaxsiy tibbiy maslahatni almashtirmaydi.',
    shareMessage: 'Issiq toshishlarni yengillashtirish — AWA',
  },
  az: {
    badge: 'İSTİ BASMALAR',
    title: 'İsti basmaları\nidarə etmək',
    metaDuration: '10 dəq oxu',
    metaType: 'Məqalə',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Onlar nə üçün baş verir, tətikləyicilərinizi necə müəyyən etmək olar və narahatedici olduqda hansı həllər kömək edə bilər.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'İsti basmalar nə üçün baş verir',
      'Gecə tərləmələri',
      'Geniş yayılmış tətikləyicilər',
      'Kömək edən gündəlik vərdişlər',
      'Nə vaxt mütəxəssislə danışmaq lazımdır',
      'Əsas nəticələr',
    ],
    section1Body1: 'İsti basmalar menopauzaya keçid zamanı çox geniş yayılıb. Onlar qismən beynin bədən temperaturunu tənzimləməsinə təsir edən hormonal dəyişikliklərlə bağlıdır.',
    section1Body2: 'Bədən temperaturunda kiçik dəyişiklik qəfil istilik kimi hiss oluna bilər. Bədən dəridəki damarları genişləndirməklə cavab verir ki, bu da istilik, qızartı və bəzən bol tərləmə hissinə səbəb ola bilər.',
    highlight1Title: 'Hər şəxs fərqlidir',
    highlight1Text: 'Bəzi qadınlar həftədə bir neçə epizod yaşayır, digərlərində gündə bir neçə dəfə ola bilər. İntensivlik və müddət də dəyişə bilər.',
    section2Body1: 'Yuxu zamanı baş verəndə isti basmalar gecə tərləmələrinə səbəb ola bilər. Onlar təkrar oyanmalara gətirib çıxara və yuxunu daha az dincəldici edə bilər.',
    section2Body2: 'Yuxusuzluq sonra gün ərzində yorğunluğu, konsentrasiya çətinliyini və əsəbiliyi artıra bilər. Buna görə simptomlarınızın təsirini qiymətləndirərkən yuxunun keyfiyyətini nəzərə almaq faydalı ola bilər.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Nəfəs alan pijama, yüngül yataq dəsti və kifayət qədər sərin yataq otağı gecə narahatlığını məhdudlaşdırmağa kömək edə bilər.',
    section3Body1: 'Bəzi amillər isti basmanı tətikləyə və ya gücləndirə bilər. Onlar mütləq hər kəsdə simptomlara səbəb olmur, lakin onları müəyyən etmək öz qanunauyğunluqlarınızı daha yaxşı anlamağa kömək edə bilər.',
    triggers: [
      'Kofeyn və alkoqol',
      'Acı qidalar',
      'Stress və güclü emosiyalar',
      'Həddindən artıq qızdırılmış otaq və ya çox qalın geyim',
    ],
    tip2Title: 'Faydalı kiçik vərdiş',
    tip2Text: 'Bir neçə həftə ərzində isti basmalarınızın nə vaxt baş verdiyini, nə qədər şiddətli olduğunu və dərhal əvvəl nə baş verdiyini qeyd edin. Bu, şəxsi tətikləyicilərinizi müəyyən etməyə kömək edə bilər.',
    dailyHabits: [
      'Yüngül qatlarla geyinin',
      'Məkanınızı sərin və yaxşı havalandırılmış saxlayın',
      'İsti basma zamanı yavaş nəfəs alın',
      'Müntəzəm olaraq sərin su için',
    ],
    section4Body1: 'Bu tədbirlər isti basmaları mütləq aradan qaldırmaz, lakin epizodları idarə etməyi asanlaşdıra və baş verdikdə narahatlığı azalda bilər.',
    section5Body1: 'İsti basmalar perimenopauza və menopauza zamanı geniş yayılıb. Bununla belə, onlarla yaşamaq çətinləşərsə, sadəcə dözməyə məcbur deyilsiniz. Həkim və ya mama simptomlarınızı qiymətləndirə və sizinlə müxtəlif variantları müzakirə edə bilər.',
    whenAppointmentTitle: 'Nə vaxt qəbula yazılmaq lazımdır?',
    section5Body2: 'Konsultasiya simptomlar gündəlik həyatınıza əhəmiyyətli təsir etdikdə və ya hansı variantların mövcud olduğunu bilmək istədikdə xüsusilə faydalı ola bilər.',
    consultReasons: [
      {
        title: 'Yuxu pozulduqda',
        text: 'Təkrar oyanmalara, əhəmiyyətli yorğunluğa və ya gün ərzində normal fəaliyyət göstərməkdə çətinliyə səbəb olan tez-tez isti basmalar və ya gecə tərləmələri.',
      },
      {
        title: 'Gündəlik həyat çətinləşdikdə',
        text: 'İsti basmalar işinizə, fəaliyyətlərinizə, səyahətlərinizə, sosial münasibətlərinizə və ya sadəcə gündəlik rahatlığınıza mane olarsa.',
      },
      {
        title: 'Simptomlar tez-tez baş verdikdə',
        text: 'Simptomların tezliyində və ya intensivliyində aydın artım ən uyğun həlləri tapmaq üçün müzakirə etməyə dəyər.',
      },
      {
        title: 'Müalicə barədə düşünürsünüzsə',
        text: 'Vəziyyətinizdən asılı olaraq hormonal və qeyri-hormonal variantlar təklif oluna bilər. Mütəxəssis onların faydalarını, risklərini və mümkün əks göstərişlərini qiymətləndirməyə kömək edə bilər.',
      },
    ],
    notMenopauseTitle: 'Hər şeyi menopauzaya aid etməyin',
    notMenopauseBody: 'İsti basmanın müxtəlif səbəbləri ola bilər. Bəzi simptomlar həm də dərmanla, başqa tibbi vəziyyətlə və ya sağlamlığınızda əhəmiyyətli dəyişiklik ilə bağlı ola bilər. Nəsə qeyri-adi, yeni və ya xüsusilə şiddətli hiss olunursa, avtomatik olaraq menopauza olduğunu güman etmək əvəzinə mütəxəssislə danışmaq daha yaxşıdır.',
    alertTitle: 'Tez tibbi yardım alın',
    alertText: 'Sinə ağrısı, qəfil nəfəs darlığı, hövsələsizlik hissi, qəfil zəiflik və ya bir ayaqda qeyri-adi ağrılı şişkinlik təcili tibbi diqqət tələb edir.',
    emergencySignsTitle: 'Hansı əlamətlər xüsusi diqqətə layiqdir?',
    emergencySigns: [
      'Qeyri-adi və ya şiddətli sinə ağrısı',
      'Qəfil nəfəs darlığı və ya əhəmiyyətli nəfəs çətinliyi',
      'Hövsələsizlik hissi və ya huşun itirilməsi',
      'Qəfil zəiflik, yaxud danışmaqda və ya görməkdə çətinlik',
      'Bir ayaqda ağrılı, qeyri-adi şişkinlik',
    ],
    solutionsTitle: 'Hansı həllər mövcud ola bilər?',
    solutionsBody: 'İsti basmalar idarə olunmağı tələb edəcək qədər narahatedicidirsə, bir neçə yanaşma nəzərdən keçirilə bilər. Vəziyyətinizdən asılı olaraq mütəxəssis həyat tərzi tədbirlərini, qeyri-hormonal müalicələri və ya uyğun olduqda hormon terapiyasını müzakirə edə bilər.',
    highlight2Title: 'Müalicə hər halda ayrıca seçilir',
    highlight2Text: 'Yaş, simptomlar, tibbi tarixçə, hazırkı müalicələr və şəxsi üstünlüklər təklif olunan variantlara təsir edə bilər.',
    prepareTitle: 'Qəbula hazırlıq',
    prepareBody: 'Bir qədər məlumatla gəlmək konsultasiyanı daha faydalı edə bilər. Bir neçə gün və ya həftə ərzində epizodların nə qədər tez-tez baş verdiyini, nə qədər şiddətli olduğunu və yuxunuza və ya fəaliyyətlərinizə təsirini izləyə bilərsiniz.',
    questionsTitle: 'Hazırlamaq üçün faydalı məlumat',
    appointmentQuestions: [
      'İsti basmalarınız nə qədər tez-tez baş verir?',
      'Onları nə vaxtdan yaşayırsınız?',
      'Onlar gündüz, gecə, yoxsa hər ikisində baş verməyə meyllidir?',
      'Onlar yuxunuza və ya fəaliyyətlərinizə mane olur?',
      'Hər hansı tətikləyici müəyyən etmisiniz?',
      'Hazırda hər hansı dərman və ya hormonal kontrasepsiya qəbul edirsiniz?',
    ],
    professionalTipText: 'Simptomlar çox şiddətli olana qədər onlar barədə danışmaq üçün gözləməyə ehtiyac yoxdur. Konsultasiya həm də sadəcə nələrin baş verdiyini anlamağa və mövcud həllər barədə öyrənməyə kömək edə bilər.',
    summaryTitle: 'Əsas məsələlər',
    summaryItems: [
      'İsti basmalar menopauza keçidi zamanı geniş yayılıb.',
      'Tətikləyicilərinizi müəyyən etmək epizodları daha yaxşı idarə etməyə kömək edə bilər.',
      'Sadə vərdişlər gündəlik narahatlığı azalda bilər.',
      'Simptomlar yuxunuza və ya gündəlik həyatınıza mane olarsa, mütəxəssislə danışın.',
      'Vəziyyətinizdən asılı olaraq bir neçə idarəetmə variantı müzakirə oluna bilər.',
    ],
    finalTipText: 'İsti basmalar geniş yayılıb, lakin yuxunuza, işinizə və ya rifahınıza təsir etdikdə onları nəzərə almamaq olmaz. Simptomlarınıza diqqət yetirmək və mütəxəssislə danışmaq onların səbəbini daha yaxşı anlamağa və uyğun həlləri araşdırmağa kömək edə bilər.',
    disclaimerText: 'Bu məqalə yalnız məlumat məqsədilə təqdim olunur və fərdi tibbi məsləhəti əvəz etmir.',
    shareMessage: 'İsti basmaları idarə etmək — AWA',
  },
  ka: {
    badge: 'ცხელი ტალღები',
    title: 'ცხელი ტალღების\nმოთვინიერება',
    metaDuration: '10 წთ საკითხავი',
    metaType: 'სტატია',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'რატომ ჩნდება ისინი, როგორ გამოვავლინოთ თქვენი ტრიგერები და რა გადაწყვეტილებებმა შეიძლება უშველოს, როცა ისინი შემაწუხებელი ხდება.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რატომ ჩნდება ცხელი ტალღები',
      'ღამის ოფლიანობა',
      'გავრცელებული ტრიგერები',
      'ყოველდღიური ჩვევები, რომლებიც გვეხმარება',
      'როდის მივმართოთ სპეციალისტს',
      'მთავარი დასკვნები',
    ],
    section1Body1: 'ცხელი ტალღები მენოპაუზაზე გადასვლისას ძალიან ხშირია. ისინი ნაწილობრივ ჰორმონულ ცვლილებებს უკავშირდება, რომლებიც გავლენას ახდენს იმაზე, როგორ არეგულირებს ტვინი სხეულის ტემპერატურას.',
    section1Body2: 'სხეულის ტემპერატურის მცირე ცვლილება შემდეგ მოულოდნელი სიცხის შეგრძნებად შეიძლება აღიქმებოდეს. სხეული რეაგირებს კანის სისხლძარღვების გაფართოებით, რამაც შეიძლება გამოიწვიოს სიცხის შეგრძნება, გაწითლება და ზოგჯერ ძლიერი ოფლიანობა.',
    highlight1Title: 'ყველა ადამიანი განსხვავებულია',
    highlight1Text: 'ზოგი ქალი კვირაში რამდენიმე ეპიზოდს განიცდის, ზოგს კი დღეში რამდენიმე შეიძლება ჰქონდეს. ინტენსივობა და ხანგრძლივობაც შეიძლება განსხვავდებოდეს.',
    section2Body1: 'როცა ისინი ძილის დროს ჩნდება, ცხელმა ტალღებმა შეიძლება ღამის ოფლიანობა გამოიწვიოს. მათ შეუძლია განმეორებითი გაღვიძებების გამოწვევა და ძილის ნაკლებად დასვენებად ქცევა.',
    section2Body2: 'ძილის ნაკლებობამ შეიძლება დღის განმავლობაში გაზარდოს დაღლილობა, კონცენტრაციის სირთულე და გაღიზიანებადობა. ამიტომ შეიძლება სასარგებლო იყოს ძილის ხარისხის გათვალისწინება სიმპტომების გავლენის შეფასებისას.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'სუნთქვადი ღამის ტანსაცმელი, მსუბუქი საწოლის ტანსაცმელი და საკმარისად გრილი საძინებელი ღამით დისკომფორტის შეზღუდვაში დაგეხმარებათ.',
    section3Body1: 'გარკვეულმა ფაქტორებმა შეიძლება ცხელი ტალღა გამოიწვიოს ან გააძლიეროს. ისინი აუცილებლად ყველასთან არ იწვევს სიმპტომებს, მაგრამ მათმა გამოვლენამ შეიძლება დაგეხმაროთ საკუთარი კანონზომიერებების უკეთ გაგებაში.',
    triggers: [
      'კოფეინი და ალკოჰოლი',
      'მწვავე საკვები',
      'სტრესი და ძლიერი ემოციები',
      'გადახურებული ოთახი ან ზედმეტად მძიმე ტანსაცმელი',
    ],
    tip2Title: 'სასარგებლო პატარა ჩვევა',
    tip2Text: 'რამდენიმე კვირის განმავლობაში აღნიშნეთ, როდის ხდება თქვენი ცხელი ტალღები, რამდენად ინტენსიურია და რა მოხდა უშუალოდ მანამდე. ეს შეიძლება დაგეხმაროთ პირადი ტრიგერების შემჩნევაში.',
    dailyHabits: [
      'ჩაიცვით მსუბუქი ფენებით',
      'თქვენი სივრცე გრილად და კარგად განიავებულად შეინარჩუნეთ',
      'ცხელი ტალღის დროს ნელი სუნთქვა ივარჯიშეთ',
      'რეგულარულად დალიეთ გრილი წყალი',
    ],
    section4Body1: 'ეს ზომები ცხელ ტალღებს აუცილებლად არ გააქრობს, მაგრამ შეიძლება ეპიზოდების მართვა გაამარტივოს და მათი გაჩენისას დისკომფორტი შეამციროს.',
    section5Body1: 'ცხელი ტალღები პერიმენოპაუზისა და მენოპაუზის დროს ხშირია. მიუხედავად ამისა, თუ მათთან ცხოვრება რთული ხდება, ისინი უბრალოდ ატანა არ გმართებთ. ექიმს ან ბებიაქალს შეუძლია შეაფასოს თქვენი სიმპტომები და განიხილოს სხვადასხვა ვარიანტი.',
    whenAppointmentTitle: 'როდის უნდა დაინიშნოთ ვიზიტი?',
    section5Body2: 'კონსულტაცია განსაკუთრებით სასარგებლოა, როცა სიმპტომები ყოველდღიურ ცხოვრებაზე მნიშვნელოვნად მოქმედებს ან გსურთ გაიგოთ, რა ვარიანტებია ხელმისაწვდომი.',
    consultReasons: [
      {
        title: 'როცა ძილი დარღვეულია',
        text: 'ხშირი ცხელი ტალღები ან ღამის ოფლიანობა, რომელიც განმეორებით გაღვიძებებს, მნიშვნელოვან დაღლილობას ან დღის განმავლობაში ნორმალურად ფუნქციონირების სირთულეს იწვევს.',
      },
      {
        title: 'როცა ყოველდღიური ცხოვრება რთული ხდება',
        text: 'თუ ცხელი ტალღები ხელს გიშლით სამსახურში, საქმიანობაში, მოგზაურობაში, სოციალურ ურთიერთობებში ან უბრალოდ ყოველდღიურ კომფორტში.',
      },
      {
        title: 'როცა სიმპტომები უფრო ხშირი ხდება',
        text: 'სიმპტომების სიხშირის ან ინტენსივობის მკაფიო ზრდა განხილვას იმსახურებს, რომ ყველაზე შესაფერისი გადაწყვეტილებები მოიძებნოს.',
      },
      {
        title: 'თუ მკურნალობაზე ფიქრობთ',
        text: 'თქვენი სიტუაციის მიხედვით შეიძლება შემოგთავაზონ ჰორმონული და არაჰორმონული ვარიანტები. სპეციალისტს შეუძლია დაგეხმაროთ მათი სარგებლის, რისკებისა და შესაძლო უკუჩვენებების შეფასებაში.',
      },
    ],
    notMenopauseTitle: 'ყველაფერს მენოპაუზას ნუ მიაწერთ',
    notMenopauseBody: 'ცხელ ტალღას სხვადასხვა მიზეზი შეიძლება ჰქონდეს. ზოგი სიმპტომი ასევე შეიძლება მედიკამენტს, სხვა სამედიცინო მდგომარეობას ან ჯანმრთელობის მნიშვნელოვან ცვლილებას უკავშირდებოდეს. თუ რამე უჩვეულოდ, ახლად ან განსაკუთრებით ინტენსიურად გეჩვენებათ, უმჯობესია სპეციალისტს ესაუბროთ და არა ავტომატურად ივარაუდოთ, რომ ეს მენოპაუზაა.',
    alertTitle: 'დაუყოვნებლივ მიმართეთ დახმარებას',
    alertText: 'გულმკერდის ტკივილი, მოულოდნელი სუნთქვის უკმარისობა, გულის წასვლის შეგრძნება, მოულოდნელი სისუსტე ან ერთ ფეხზე უჩვეულო მტკივნეული შეშუპება დაუყოვნებელ სამედიცინო დახმარებას საჭიროებს.',
    emergencySignsTitle: 'რომელ ნიშნებს უნდა მიექცეს განსაკუთრებული ყურადღება?',
    emergencySigns: [
      'უჩვეულო ან ძლიერი გულმკერდის ტკივილი',
      'მოულოდნელი სუნთქვის უკმარისობა ან სუნთქვის მნიშვნელოვანი სირთულე',
      'გულის წასვლის შეგრძნება ან გონების დაკარგვა',
      'მოულოდნელი სისუსტე ან ლაპარაკის ან ხედვის გაძნელება',
      'მტკივნეული, უჩვეულო შეშუპება ერთ ფეხზე',
    ],
    solutionsTitle: 'რა გადაწყვეტილებები შეიძლება იყოს ხელმისაწვდომი?',
    solutionsBody: 'თუ ცხელი ტალღები იმდენად შემაწუხებელია, რომ მართვა სჭირდება, შეიძლება რამდენიმე მიდგომა განიხილონ. თქვენი სიტუაციის მიხედვით, სპეციალისტმა შეიძლება განიხილოს ცხოვრების წესის ზომები, არაჰორმონული მკურნალობა ან, როცა ეს მიზანშეწონილია, ჰორმონული თერაპია.',
    highlight2Title: 'მკურნალობა შემთხვევების მიხედვით აირჩევა',
    highlight2Text: 'ასაკმა, სიმპტომებმა, სამედიცინო ისტორიამ, მიმდინარე მკურნალობამ და პირადმა პრეფერენციებმა შეიძლება შეთავაზებულ ვარიანტებზე იმოქმედოს.',
    prepareTitle: 'ვიზიტისთვის მომზადება',
    prepareBody: 'ცოტა ინფორმაციით მისვლამ შეიძლება კონსულტაცია უფრო სასარგებლო გახადოს. რამდენიმე დღის ან კვირის განმავლობაში შეგიძლიათ აკონტროლოთ, რამდენად ხშირად ჩნდება ეპიზოდები, რამდენად ინტენსიურია და როგორ მოქმედებს თქვენს ძილსა თუ აქტივობებზე.',
    questionsTitle: 'სასარგებლო ინფორმაცია მოსამზადებლად',
    appointmentQuestions: [
      'რამდენად ხშირად ხდება თქვენი ცხელი ტალღები?',
      'რამდენი ხანია განიცდით მათ?',
      'ისინი უფრო დღისით ხდება, ღამით თუ ორივე დროს?',
      'არღვევენ თუ არა ისინი თქვენს ძილს ან აქტივობებს?',
      'გამოავლინეთ თუ არა რაიმე ტრიგერი?',
      'იღებთ თუ არა ამჟამად რაიმე მედიკამენტს ან ჰორმონულ კონტრაცეფციას?',
    ],
    professionalTipText: 'არ გჭირდებათ დაელოდოთ, სანამ სიმპტომები ძალიან ძლიერი გახდება, რომ მათ შესახებ ისაუბროთ. კონსულტაციამ შეიძლება უბრალოდ დაგეხმაროთ გაიგოთ, რა ხდება და გაეცნოთ ხელმისაწვდომ გადაწყვეტილებებს.',
    summaryTitle: 'მთავარი',
    summaryItems: [
      'ცხელი ტალღები მენოპაუზაზე გადასვლისას ხშირია.',
      'თქვენი ტრიგერების გამოვლენამ შეიძლება ეპიზოდების უკეთ მართვაში დაგეხმაროთ.',
      'მარტივ ჩვევებს შეუძლია ყოველდღიური დისკომფორტი შეამციროს.',
      'თუ სიმპტომები ძილს ან ყოველდღიურ ცხოვრებას არღვევს, ესაუბრეთ სპეციალისტს.',
      'თქვენი სიტუაციის მიხედვით, მართვის რამდენიმე ვარიანტის განხილვა შეიძლება.',
    ],
    finalTipText: 'ცხელი ტალღები ხშირია, მაგრამ მათი უგულებელყოფა არ შეიძლება, როცა ისინი ძილზე, სამსახურზე ან კეთილდღეობაზე მოქმედებს. თქვენს სიმპტომებზე ყურადღების მიქცევამ და სპეციალისტთან საუბარმა შეიძლება დაგეხმაროთ მათი მიზეზის უკეთ გაგებასა და შესაფერისი გადაწყვეტილებების გამოკვლევაში.',
    disclaimerText: 'ეს სტატია მხოლოდ საინფორმაციოა და პერსონალიზებულ სამედიცინო რჩევას არ ანაცვლებს.',
    shareMessage: 'ცხელი ტალღების მოთვინიერება — AWA',
  },
  hy: {
    badge: 'ՏԱՔ ԱԼԻՔՆԵՐ',
    title: 'Մեղմել\nտաք ալիքները',
    metaDuration: '10 ր կարդալու համար',
    metaType: 'Հոդված',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ինչու են դրանք առաջանում, ինչպես բացահայտել ձեր գրգռիչները և ինչ լուծումներ կարող են օգնել, երբ դրանք դառնում են անհարմար:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ինչու են առաջանում տաք ալիքները',
      'Գիշերային քրտնարտադրություն',
      'Տարածված գրգռիչներ',
      'Առօրյա սովորություններ, որոնք օգնում են',
      'Երբ խոսել մասնագետի հետ',
      'Հիմնական եզրակացություններ',
    ],
    section1Body1: 'Տաք ալիքները շատ տարածված են դաշտանադադարի անցման ընթացքում: Դրանք մասամբ կապված են հորմոնալ փոփոխությունների հետ, որոնք ազդում են այն բանի վրա, թե ինչպես է ուղեղը կարգավորում մարմնի ջերմաստիճանը:',
    section1Body2: 'Մարմնի ջերմաստիճանի փոքր տեղաշարժը կարող է այնուհետև զգացվել որպես հանկարծակի շոգ: Մարմինը արձագանքում է մաշկի արյունատար անոթների լայնացմամբ, ինչը կարող է առաջացնել շոգի զգացում, կարմրություն և երբեմն առատ քրտնարտադրություն:',
    highlight1Title: 'Յուրաքանչյուր մարդ տարբեր է',
    highlight1Text: 'Որոշ կանայք շաբաթը մի քանի դրվագ են ունենում, մյուսները՝ օրական մի քանիսը: Ինտենսիվությունը և տևողությունը նույնպես կարող են տարբերվել:',
    section2Body1: 'Երբ տեղի են ունենում քնի ընթացքում, տաք ալիքները կարող են առաջացնել գիշերային քրտնարտադրություն: Դրանք կարող են հանգեցնել կրկնվող արթնացումների և քունը դարձնել ավելի քիչ հանգստացնող:',
    section2Body2: 'Քնի պակասը կարող է այնուհետև մեծացնել հոգնածությունը, կենտրոնանալու դժվարությունը և դյուրագրգռությունը օրվա ընթացքում: Հետևաբար, օգտակար կարող է լինել քնի որակը հաշվի առնել ձեր ախտանիշների ազդեցությունը գնահատելիս:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Շնչող գիշերազգեստը, թեթև անկողնային պարագաները և բավարար չափով զով ննջարանը կարող են օգնել սահմանափակել գիշերային անհարմարությունը:',
    section3Body1: 'Որոշ գործոններ կարող են առաջացնել կամ սաստկացնել տաք ալիքը: Դրանք պարտադիր չէ ախտանիշներ առաջացնեն բոլորի մոտ, սակայն դրանք բացահայտելը կարող է օգնել ավելի լավ հասկանալ ձեր սեփական օրինաչափությունները:',
    triggers: [
      'Կոֆեին և ալկոհոլ',
      'Կծու սնունդ',
      'Սթրես և ուժեղ հույզեր',
      'Գերտաքացած սենյակ կամ չափազանց ծանր հագուստ',
    ],
    tip2Title: 'Օգտակար փոքր սովորություն',
    tip2Text: 'Մի քանի շաբաթ գրանցեք, թե երբ են տեղի ունենում ձեր տաք ալիքները, որքան ինտենսիվ են և ինչ է պատահել անմիջապես առաջ: Սա կարող է օգնել նկատել ձեր անձնական գրգռիչները:',
    dailyHabits: [
      'Հագնվեք թեթև շերտերով',
      'Ձեր տարածքը պահեք զով և լավ օդափոխված',
      'Տաք ալիքի ժամանակ կիրառեք դանդաղ շնչառություն',
      'Կանոնավոր խմեք զով ջուր',
    ],
    section4Body1: 'Այս միջոցները պարտադիր չէ, որ տաք ալիքները վերացնեն, բայց կարող են դրվագները դարձնել ավելի կառավարելի և նվազեցնել անհարմարությունը, երբ դրանք տեղի են ունենում:',
    section5Body1: 'Տաք ալիքները տարածված են պերիմենոպաուզայի և դաշտանադադարի ընթացքում: Այդուհանդերձ, պարտադիր չէ պարզապես տանել դրանք, եթե դրանց հետ ապրելը դառնում է դժվար: Բժիշկը կամ մանկաբարձուհին կարող է գնահատել ձեր ախտանիշները և քննարկել տարբեր տարբերակները ձեզ հետ:',
    whenAppointmentTitle: 'Ե՞րբ պետք է այց նշանակել',
    section5Body2: 'Խորհրդատվությունը կարող է հատկապես օգտակար լինել, երբ ախտանիշները զգալի ազդեցություն ունեն ձեր առօրյայի վրա կամ երբ ցանկանում եք իմանալ, թե ինչ տարբերակներ կան:',
    consultReasons: [
      {
        title: 'Երբ քունը խանգարվում է',
        text: 'Հաճախակի տաք ալիքներ կամ գիշերային քրտնարտադրություն, որոնք առաջացնում են կրկնվող արթնացումներ, զգալի հոգնածություն կամ օրվա ընթացքում նորմալ գործելու դժվարություն:',
      },
      {
        title: 'Երբ առօրյան դառնում է դժվար',
        text: 'Եթե տաք ալիքները խանգարում են ձեր աշխատանքին, գործունեությանը, ճանապարհորդություններին, սոցիալական հարաբերություններին կամ պարզապես ձեր առօրյա հարմարավետությանը:',
      },
      {
        title: 'Երբ ախտանիշները դառնում են ավելի հաճախակի',
        text: 'Ախտանիշների հաճախականության կամ ինտենսիվության հստակ աճը արժե քննարկել՝ առավել համապատասխան լուծումներ գտնելու համար:',
      },
      {
        title: 'Եթե բուժում եք դիտարկում',
        text: 'Կարող են առաջարկվել հորմոնալ և ոչ հորմոնալ տարբերակներ՝ կախված ձեր իրավիճակից: Մասնագետը կարող է օգնել կշռադատել դրանց օգուտները, վտանգները և հնարավոր հակացուցումները:',
      },
    ],
    notMenopauseTitle: 'Ամեն ինչ մի վերագրեք դաշտանադադարին',
    notMenopauseBody: 'Տաք ալիքը կարող է ունենալ տարբեր պատճառներ: Որոշ ախտանիշներ կարող են նաև կապված լինել դեղամիջոցի, այլ բժշկական վիճակի կամ ձեր առողջության զգալի փոփոխության հետ: Եթե ինչ-որ բան թվում է անսովոր, նոր կամ հատկապես ինտենսիվ, ավելի լավ է խոսել մասնագետի հետ, քան ինքնաբերաբար ենթադրել, որ դա դաշտանադադար է:',
    alertTitle: 'Շտապ դիմեք բժշկական օգնության',
    alertText: 'Կրծքավանդակի ցավը, հանկարծակի շնչահեղձությունը, ուշագնացության զգացումը, հանկարծակի թուլությունը կամ մի ոտքի անսովոր ցավոտ այտուցը պահանջում են անհապաղ բժշկական ուշադրություն:',
    emergencySignsTitle: 'Ո՞ր նշաններն են արժանի հատուկ ուշադրության',
    emergencySigns: [
      'Կրծքավանդակի անսովոր կամ ուժեղ ցավ',
      'Հանկարծակի շնչահեղձություն կամ շնչառության զգալի դժվարություն',
      'Ուշագնացության զգացում կամ գիտակցության կորուստ',
      'Հանկարծակի թուլություն կամ խոսելու կամ տեսնելու դժվարություն',
      'Մի ոտքի ցավոտ, անսովոր այտուց',
    ],
    solutionsTitle: 'Ի՞նչ լուծումներ կարող են լինել հասանելի',
    solutionsBody: 'Եթե տաք ալիքներն այնքան անհարմար են, որ կառավարման կարիք ունեն, կարող են դիտարկվել մի քանի մոտեցումներ: Կախված ձեր իրավիճակից՝ մասնագետը կարող է քննարկել ապրելակերպի միջոցառումներ, ոչ հորմոնալ բուժումներ կամ, երբ տեղին է, հորմոնային թերապիա:',
    highlight2Title: 'Բուժումն ընտրվում է յուրաքանչյուր դեպքում առանձին',
    highlight2Text: 'Տարիքը, ախտանիշները, բժշկական պատմությունը, ընթացիկ բուժումները և անձնական նախասիրությունները կարող են ազդել առաջարկվող տարբերակների վրա:',
    prepareTitle: 'Նախապատրաստվել ձեր այցին',
    prepareBody: 'Որոշ տեղեկությամբ գալը կարող է խորհրդատվությունը դարձնել ավելի օգտակար: Կարող եք մի քանի օր կամ շաբաթ հետևել, թե որքան հաճախ են տեղի ունենում դրվագները, որքան ինտենսիվ են և ինչպիսի ազդեցություն ունեն ձեր քնի կամ գործունեության վրա:',
    questionsTitle: 'Օգտակար տեղեկություն նախապատրաստելու համար',
    appointmentQuestions: [
      'Որքան հաճա՞խ են տեղի ունենում ձեր տաք ալիքները:',
      'Որքա՞ն ժամանակ է, ինչ ապրում եք դրանք:',
      'Դրանք հակված են տեղի ունենալ ցերեկը, գիշերը, թե երկուսն էլ:',
      'Խանգարո՞ւմ են ձեր քունը կամ գործունեությունը:',
      'Բացահայտե՞լ եք որևէ գրգռիչ:',
      'Ներկայումս ընդունո՞ւմ եք որևէ դեղամիջոց կամ հորմոնալ հակաբեղմնավորիչ:',
    ],
    professionalTipText: 'Պետք չէ սպասել, մինչև ախտանիշները դառնան շատ ծանր, որպեսզի խոսեք դրանց մասին: Խորհրդատվությունը կարող է նաև պարզապես օգնել հասկանալ, թե ինչ է կատարվում, և իմանալ հասանելի լուծումների մասին:',
    summaryTitle: 'Էականը',
    summaryItems: [
      'Տաք ալիքները տարածված են դաշտանադադարի անցման ընթացքում:',
      'Ձեր գրգռիչները բացահայտելը կարող է օգնել ավելի լավ կառավարել դրվագները:',
      'Պարզ սովորությունները կարող են նվազեցնել առօրյա անհարմարությունը:',
      'Եթե ախտանիշները խանգարում են ձեր քունը կամ առօրյան, խոսեք մասնագետի հետ:',
      'Կախված ձեր իրավիճակից՝ կարող են քննարկվել կառավարման մի քանի տարբերակներ:',
    ],
    finalTipText: 'Տաք ալիքները տարածված են, բայց չպետք է անտեսել դրանք, երբ ազդում են ձեր քնի, աշխատանքի կամ բարեկեցության վրա: Ձեր ախտանիշներին ուշադրություն դարձնելը և մասնագետի հետ խոսելը կարող է օգնել ավելի լավ հասկանալ դրանց պատճառը և ուսումնասիրել համապատասխան լուծումներ:',
    disclaimerText: 'Այս հոդվածը միայն տեղեկատվական նպատակով է և չի փոխարինում անհատականացված բժշկական խորհրդատվությանը:',
    shareMessage: 'Մեղմել տաք ալիքները — AWA',
  },
  tg: {
    badge: 'МАВҶҲОИ ГАРМӢ',
    title: 'Идора кардани\nмавҷҳои гармӣ',
    metaDuration: '10 дақ барои хондан',
    metaType: 'Мақола',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Чаро онҳо рух медиҳанд, чӣ тавр сабабҳои онҳоро муайян кардан мумкин аст ва кадом роҳҳо метавонанд вақте ки онҳо мазоҳим мешаванд, кумак кунанд.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Чаро мавҷҳои гармӣ рух медиҳанд',
      'Арақи шабона',
      'Сабабҳои маъмул',
      'Одатҳои ҳаррӯзае, ки кумак мекунанд',
      'Кай бо мутахассис гап задан лозим аст',
      'Хулосаҳои асосӣ',
    ],
    section1Body1: 'Мавҷҳои гармӣ ҳангоми гузариш ба менопауза хеле маъмуланд. Онҳо қисман бо тағйироти гормонӣ алоқаманданд, ки ба тарзи танзими ҳарорати бадан аз ҷониби майна таъсир мерасонанд.',
    section1Body2: 'Тағйироти хурди ҳарорати бадан он гоҳ метавонад ҳамчун гармии ногаҳонӣ эҳсос шавад. Бадан бо васеъ кардани рагҳои хун дар пӯст посух медиҳад, ки метавонад эҳсоси гармӣ, сурхшавӣ ва баъзан арақкунии зиёдро ба вуҷуд орад.',
    highlight1Title: 'Ҳар кас гуногун аст',
    highlight1Text: 'Баъзе занон дар як ҳафта чанд эпизод доранд, дигарон метавонанд дар як рӯз якчанд маротиба дошта бошанд. Шиддат ва давомнокӣ низ метавонад гуногун бошад.',
    section2Body1: 'Вақте ки онҳо ҳангоми хоб рух медиҳанд, мавҷҳои гармӣ метавонанд арақи шабонаро ба вуҷуд оранд. Онҳо метавонанд ба борҳо бедор шудан оварда расонанд ва хобро камистироҳат кунанд.',
    section2Body2: 'Камхобӣ он гоҳ метавонад хастагӣ, душвории тамаркуз ва асабониятро дар давоми рӯз афзун кунад. Аз ин рӯ метавонад муфид бошад, ки сифати хобро ҳангоми арзёбии таъсири нишонаҳои худ ба назар гиред.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Пижамаи нафасгузар, рахти хоби сабук ва ҳуҷраи ба қадри кофӣ хунук метавонад ба маҳдуд кардани нороҳатӣ дар шаб кумак кунад.',
    section3Body1: 'Баъзе омилҳо метавонанд мавҷи гармиро бархезонанд ё шадидтар кунанд. Онҳо ҳатман дар ҳама нишона ба вуҷуд намеоранд, вале муайян кардани онҳо метавонад ба шумо кумак кунад намунаҳои худро беҳтар бифаҳмед.',
    triggers: [
      'Кофеин ва машруботи спиртӣ',
      'Хӯрокҳои тунд',
      'Стресс ва эҳсосоти қавӣ',
      'Ҳуҷраи аз ҳад гарм ё либоси аз ҳад вазнин',
    ],
    tip2Title: 'Одати хурди муфид',
    tip2Text: 'Дар давоми якчанд ҳафта қайд кунед, ки мавҷҳои гармии шумо кай рух медиҳанд, то чӣ андоза шадиданд ва дарҳол пеш аз он чӣ рух дод. Ин метавонад ба шумо кумак кунад сабабҳои шахсии худро пайдо намоед.',
    dailyHabits: [
      'Либоси сабуки чандқабата пӯшед',
      'Фазои худро хунук ва хуб ҳавогардон нигоҳ доред',
      'Ҳангоми мавҷи гармӣ нафаскашии оҳистаро машқ кунед',
      'Мунтазам оби хунук нӯшед',
    ],
    section4Body1: 'Ин чораҳо ҳатман мавҷҳои гармиро аз байн намебаранд, вале метавонанд идораи эпизодҳоро осонтар кунанд ва вақте ки онҳо рух медиҳанд, нороҳатиро кам намоянд.',
    section5Body1: 'Мавҷҳои гармӣ дар давраи перименопауза ва менопауза маъмуланд. Бо вуҷуди ин, шумо набояд онҳоро танҳо таҳаммул кунед, агар зиндагӣ бо онҳо душвор шавад. Табиб ё доя метавонад нишонаҳои шуморо арзёбӣ кунад ва имкониятҳои гуногунро бо шумо муҳокима намояд.',
    whenAppointmentTitle: 'Кай бояд ба қабул ном навишт?',
    section5Body2: 'Машварат метавонад махсусан муфид бошад, вақте ки нишонаҳо ба ҳаёти ҳаррӯзаи шумо таъсири назаррас доранд ё вақте ки мехоҳед бидонед, кадом имкониятҳо мавҷуданд.',
    consultReasons: [
      {
        title: 'Вақте ки хоб вайрон мешавад',
        text: 'Мавҷҳои зуд-зуди гармӣ ё арақи шабона, ки боиси борҳо бедор шудан, хастагии назаррас ё душворӣ дар фаъолияти муқаррарӣ дар давоми рӯз мешаванд.',
      },
      {
        title: 'Вақте ки зиндагии ҳаррӯза душвор мешавад',
        text: 'Агар мавҷҳои гармӣ ба кор, фаъолият, сафар, муносибатҳои иҷтимоӣ ё танҳо роҳатии ҳаррӯзаи шумо халал расонанд.',
      },
      {
        title: 'Вақте ки нишонаҳо зудтар рух медиҳанд',
        text: 'Афзоиши равшани басомад ё шиддати нишонаҳо сазовори муҳокима аст, то роҳҳои мувофиқтарин ёфта шаванд.',
      },
      {
        title: 'Агар табобатро дар назар доред',
        text: 'Имкониятҳои гормонӣ ва ғайригормонӣ метавонанд вобаста ба вазъияти шумо пешниҳод шаванд. Мутахассис метавонад кумак кунад афзалиятҳо, хатарҳо ва муқобилнишондодҳои эҳтимолии онҳоро баркашед.',
      },
    ],
    notMenopauseTitle: 'Ҳамаро ба менопауза нисбат надиҳед',
    notMenopauseBody: 'Мавҷи гармӣ метавонад сабабҳои гуногун дошта бошад. Баъзе нишонаҳо инчунин метавонанд бо дору, ҳолати дигари тиббӣ ё тағйироти назарраси саломатии шумо алоқаманд бошанд. Агар чизе ғайриоддӣ, нав ё махсусан шадид эҳсос шавад, беҳтар аст бо мутахассис гап занед, на ин ки худкор онро менопауза ҳисоб кунед.',
    alertTitle: 'Фавран кумак ҷӯед',
    alertText: 'Дарди сина, тангии ногаҳонии нафас, эҳсоси беҳушӣ, сустии ногаҳонӣ ё варами дардноки ғайриоддӣ дар як по таваҷҷӯҳи фавриро талаб мекунанд.',
    emergencySignsTitle: 'Кадом нишонаҳо диққати махсусро сазоворанд?',
    emergencySigns: [
      'Дарди ғайриоддӣ ё шадиди сина',
      'Тангии ногаҳонии нафас ё душвории назарраси нафаскашӣ',
      'Эҳсоси беҳушӣ ё аз даст додани ҳуш',
      'Сустии ногаҳонӣ ё мушкилӣ дар сухан гуфтан ё дидан',
      'Варами дардноки ғайриоддӣ дар як по',
    ],
    solutionsTitle: 'Кадом роҳҳо метавонанд дастрас бошанд?',
    solutionsBody: 'Агар мавҷҳои гармӣ ба қадри кофӣ мазоҳиманд, ки идораро талаб кунанд, якчанд равиш метавонад баррасӣ шавад. Вобаста ба вазъияти шумо, мутахассис метавонад чораҳои тарзи зиндагӣ, табобатҳои ғайригормонӣ ё, ҳангоми зарурат, табобати гормониро муҳокима кунад.',
    highlight2Title: 'Табобат дар ҳар ҳолат алоҳида интихоб мешавад',
    highlight2Text: 'Синну сол, нишонаҳо, таърихи тиббӣ, табобатҳои ҷорӣ ва афзалиятҳои шахсӣ ҳама метавонанд ба имкониятҳои пешниҳодшаванда таъсир расонанд.',
    prepareTitle: 'Омодагӣ ба қабули шумо',
    prepareBody: 'Бо чанд маълумот омадан метавонад машваратро муфидтар кунад. Шумо метавонед дар давоми чанд рӯз ё ҳафта пайгирӣ кунед, ки эпизодҳо чанд вақт рух медиҳанд, то чӣ андоза шадиданд ва таъсири онҳо ба хоб ё фаъолияти шумо.',
    questionsTitle: 'Маълумоти муфид барои омода кардан',
    appointmentQuestions: [
      'Мавҷҳои гармии шумо чанд вақт як маротиба рух медиҳанд?',
      'Аз кай онҳоро эҳсос мекунед?',
      'Оё онҳо бештар рӯзона, шабона ё ҳарду рух медиҳанд?',
      'Оё онҳо хоб ё фаъолияти шуморо вайрон мекунанд?',
      'Оё ягон сабабро муайян кардаед?',
      'Оё ҳоло дору ё пешгирии гормонӣ қабул мекунед?',
    ],
    professionalTipText: 'Лозим нест интизор шавед, ки нишонаҳо хеле шадид шаванд, то дар бораи онҳо гап занед. Машварат инчунин метавонад танҳо ба шумо кумак кунад бифаҳмед, ки чӣ рух дода истодааст ва роҳҳои дастрасро биомӯзед.',
    summaryTitle: 'Муҳимтарин чизҳо',
    summaryItems: [
      'Мавҷҳои гармӣ ҳангоми гузариш ба менопауза маъмуланд.',
      'Муайян кардани сабабҳои шумо метавонад ба идораи беҳтари эпизодҳо кумак кунад.',
      'Одатҳои оддӣ метавонанд нороҳатии ҳаррӯзаро кам кунанд.',
      'Агар нишонаҳо хоб ё зиндагии ҳаррӯзаро вайрон кунанд, бо мутахассис гап занед.',
      'Якчанд имконияти идора вобаста ба вазъияти шумо метавонад муҳокима шавад.',
    ],
    finalTipText: 'Мавҷҳои гармӣ маъмуланд, вале вақте ки ба хоб, кор ё некӯаҳволии шумо таъсир мерасонанд, онҳоро набояд нодида гирифт. Диққат ба нишонаҳои худ ва гап задан бо мутахассис метавонад ба шумо кумак кунад сабаби онҳоро беҳтар бифаҳмед ва роҳҳои мувофиқро кашф кунед.',
    disclaimerText: 'Ин мақола танҳо барои иттилоъ аст ва маслиҳати шахсии тиббиро иваз намекунад.',
    shareMessage: 'Идора кардани мавҷҳои гармӣ — AWA',
  },
  ky: {
    badge: 'ЫСЫК ТОЛКУНДАР',
    title: 'Ысык толкундарды\nжөнгө салуу',
    metaDuration: '10 мүн окуу',
    metaType: 'Макала',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Алар эмне үчүн болот, козгогучтарыңызды кантип аныктоо керек жана алар тынчсыздандыра баштаганда кандай чечимдер жардам бериши мүмкүн.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Ысык толкундар эмне үчүн болот',
      'Түнкү тердөө',
      'Кеңири таралган козгогучтар',
      'Жардам берген күнүмдүк адаттар',
      'Адис менен качан сүйлөшүү керек',
      'Негизги жыйынтыктар',
    ],
    section1Body1: 'Ысык толкундар менопаузага өтүү мезгилинде абдан кеңири таралган. Алар жарым-жартылай мээнин дене температурасын жөнгө салуусуна таасир эткен гормондук өзгөрүүлөр менен байланышкан.',
    section1Body2: 'Дене температурасынын кичинекей өзгөрүшү андан кийин капыстан ысык болуп сезилиши мүмкүн. Организм териде кан тамырларын кеңейтүү менен жооп берет, бул ысык сезимин, кызарууну жана кээде катуу тердөөнү жаратышы мүмкүн.',
    highlight1Title: 'Ар бир адам ар башка',
    highlight1Text: 'Айрым аялдар жумасына бир нече жолу башынан өткөрөт, башкалары күнүнө бир нече жолу болушу мүмкүн. Курчтугу жана узактыгы да айырмаланышы мүмкүн.',
    section2Body1: 'Уйку учурунда болгондо ысык толкундар түнкү тердөөнү жаратышы мүмкүн. Алар кайра-кайра ойгонууга алып келип, уйкуну азыраак эс алдыруучу кылышы мүмкүн.',
    section2Body2: 'Уйкунун жетишсиздиги күндүз чарчоону, көңүл топтоо кыйындыгын жана ачуулануусун күчөтүшү мүмкүн. Ошондуктан белгилериңиздин таасирин баалоодо уйкунун сапатын эске алуу пайдалуу болушу мүмкүн.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Дем алган пижама, жеңил төшөк-орун жана жетиштүү салкын уктоочу бөлмө түнкү ыңгайсыздыкты чектөөгө жардам бериши мүмкүн.',
    section3Body1: 'Айрым факторлор ысык толкунду козгоп же күчөтө алат. Алар баарында эле белгилерди жаратпашы мүмкүн, бирок аларды аныктоо өз мыйзам ченемдүүлүгүңүздү жакшыраак түшүнүүгө жардам бериши мүмкүн.',
    triggers: [
      'Кофеин жана алкоголь',
      'Ачуу тамактар',
      'Стресс жана күчтүү эмоциялар',
      'Өтө ысып кеткен бөлмө же өтө оор кийим',
    ],
    tip2Title: 'Пайдалуу кичинекей адат',
    tip2Text: 'Бир нече жума бою ысык толкундарыңыз качан болорун, канчалык күчтүү экенин жана алардан мурун эмне болгонун жазып коюңуз. Бул жеке козгогучтарыңызды байкоого жардам бериши мүмкүн.',
    dailyHabits: [
      'Жеңил катмарлуу кийинүү',
      'Жайыңызды салкын жана жакшы желдетилген кармоо',
      'Ысык толкун учурунда жай дем алуу',
      'Үзгүлтүксүз салкын суу ичүү',
    ],
    section4Body1: 'Бул чаралар ысык толкундарды сөзсүз жок кылбайт, бирок эпизоддорду башкарууну жеңилдетип, алар болгондо ыңгайсыздыкты азайтышы мүмкүн.',
    section5Body1: 'Ысык толкундар перименопауза жана менопаузада кеңири таралган. Ошентсе да, алар жашоого кыйынга турса, аларга жөн гана чыдап жүрүүнүн кереги жок. Дарыгер же акушерка белгилериңизди баалап, ар кандай варианттарды сиз менен талкуулай алат.',
    whenAppointmentTitle: 'Качан кабыл алууга жазылуу керек?',
    section5Body2: 'Консультация белгилер күнүмдүк жашоого олуттуу таасир эткенде же кандай варианттар бар экенин билгиңиз келгенде өзгөчө пайдалуу болушу мүмкүн.',
    consultReasons: [
      {
        title: 'Уйку бузулганда',
        text: 'Кайра-кайра ойгонууга, олуттуу чарчоого же күндүз нормалдуу иштөөдө кыйынчылыкка алып келген тез-тез ысык толкундар же түнкү тердөө.',
      },
      {
        title: 'Күнүмдүк жашоо кыйындаганда',
        text: 'Эгер ысык толкундар ишиңизге, иш-аракеттериңизге, саякатыңызга, социалдык мамилелериңизге же жөн эле күнүмдүк ыңгайлуулугуңузга тоскоол болсо.',
      },
      {
        title: 'Белгилер жыштаганда',
        text: 'Белгилердин жыштыгынын же курчтугунун даана көбөйүшү эң ылайыктуу чечимдерди табуу үчүн талкуулоого татыйт.',
      },
      {
        title: 'Дарылоону ойлонуп жатсаңыз',
        text: 'Абалыңызга жараша гормондук жана гормондук эмес варианттар сунушталышы мүмкүн. Адис алардын артыкчылыктарын, коркунучтарын жана мүмкүн болгон каршы көрсөтмөлөрүн таразалоого жардам бере алат.',
      },
    ],
    notMenopauseTitle: 'Баарын менопаузага такабаңыз',
    notMenopauseBody: 'Ысык толкундун ар кандай себептери болушу мүмкүн. Айрым белгилер дарыга, башка медициналык абалга же ден соолуктагы олуттуу өзгөрүүгө да байланыштуу болушу мүмкүн. Бир нерсе адаттан тыш, жаңы же өзгөчө күчтүү сезилсе, автоматтык түрдө менопауза деп ойлогондон көрө адис менен сүйлөшкөн жакшы.',
    alertTitle: 'Дароо медициналык жардамга кайрылыңыз',
    alertText: 'Көкүрөктөгү оору, капыстан дем жетишсиздиги, эсин жоготуп жаткандай сезим, капыстан алсыздык же бир буттагы адаттан тыш оорулуу шишик дароо медициналык көңүл бурууну талап кылат.',
    emergencySignsTitle: 'Кайсы белгилерге өзгөчө көңүл буруу керек?',
    emergencySigns: [
      'Адаттан тыш же катуу көкүрөк оорусу',
      'Капыстан дем жетишсиздиги же дем алуудагы олуттуу кыйынчылык',
      'Эсин жоготуп жаткандай сезим же эсти жоготуу',
      'Капыстан алсыздык, сүйлөөдө же көрүүдө кыйынчылык',
      'Бир буттагы оорулуу, адаттан тыш шишик',
    ],
    solutionsTitle: 'Кандай чечимдер жеткиликтүү болушу мүмкүн?',
    solutionsBody: 'Эгер ысык толкундар башкарууну талап кылгыдай тынчсыздандырса, бир нече ыкма каралышы мүмкүн. Абалыңызга жараша адис жашоо образы чараларын, гормондук эмес дарылоолорду же ылайыктуу болсо, гормон терапиясын талкуулашы мүмкүн.',
    highlight2Title: 'Дарылоо ар бир учурга жараша тандалат',
    highlight2Text: 'Жаш, белгилер, медициналык тарых, учурдагы дарылоолор жана жеке тандоо сунушталуучу варианттарга таасир этиши мүмкүн.',
    prepareTitle: 'Кабыл алууга даярдануу',
    prepareBody: 'Бир аз маалымат менен келүү консультацияны пайдалуураак кылышы мүмкүн. Бир нече күн же жума бою эпизоддор канчалык жыш болорун, канчалык күчтүү экенин жана уйкуңузга же иш-аракеттериңизге таасирин жазып турсаңыз болот.',
    questionsTitle: 'Даярдоого пайдалуу маалымат',
    appointmentQuestions: [
      'Ысык толкундарыңыз канчалык жыш болот?',
      'Аларды качантан бери башыңыздан өткөрүп жатасыз?',
      'Алар күндүз, түнкүсүн же экөөндө тең болобу?',
      'Алар уйкуңузду же иш-аракеттериңизди бузабы?',
      'Кандайдыр бир козгогучтарды аныктадыңызбы?',
      'Азыр кандайдыр бир дарыны же гормондук контрацепцияны кабыл алып жатасызбы?',
    ],
    professionalTipText: 'Белгилер абдан күчөгөнгө чейин күтүүнүн кереги жок. Консультация эмне болуп жатканын түшүнүүгө жана бар чечимдер жөнүндө билүүгө да жардам бериши мүмкүн.',
    summaryTitle: 'Эң негизгиси',
    summaryItems: [
      'Ысык толкундар менопауза өткөөлүндө кеңири таралган.',
      'Козгогучтарыңызды аныктоо эпизоддорду жакшыраак башкарууга жардам бериши мүмкүн.',
      'Жөнөкөй адаттар күнүмдүк ыңгайсыздыкты азайтышы мүмкүн.',
      'Белгилер уйкуңузду же күнүмдүк жашооңузду бузса, адис менен сүйлөшүңүз.',
      'Абалыңызга жараша бир нече башкаруу варианттары талкууланышы мүмкүн.',
    ],
    finalTipText: 'Ысык толкундар кеңири таралган, бирок алар уйкуңузга, ишиңизге же жыргалчылыгыңызга таасир эткенде аларды четке кагууга болбойт. Белгилериңизге көңүл буруу жана адис менен сүйлөшүү алардын себебин жакшыраак түшүнүүгө жана ылайыктуу чечимдерди издөөгө жардам бериши мүмкүн.',
    disclaimerText: 'Бул макала маалымат берүү максатында гана жазылган жана жекелештирилген медициналык кеңешти алмаштырбайт.',
    shareMessage: 'Ысык толкундарды жөнгө салуу — AWA',
  },
  tk: {
    badge: 'GYZGYNLYK GELMELERI',
    title: 'Gyzgynlyk gelmelerini\nmilt ýagdaýa getirmek',
    metaDuration: '10 min okamak',
    metaType: 'Makala',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Olar näme üçin bolýar, gozgaýjylari nähili kesgitlemeli we biynjalyk edýän wagtynda haýsy çözgütler kömek edip biler.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Gyzgynlyk gelmeleri näme üçin bolýar',
      'Gijeki derlemek',
      'Umumy gozgaýjylar',
      'Kömek edýän gündelik endikler',
      'Hünärmen bilen haçan gürleşmeli',
      'Esasy netijeler',
    ],
    section1Body1: 'Gyzgynlyk gelmeleri menopauza ötüş wagtynda gaty ýaýran. Olar ýarysynda beýniniň beden temperaturasyny sazlamagyna täsir edýän gormonal üýtgeşmeler bilen baglanyşykly.',
    section1Body2: 'Beden temperaturasyndaky kiçijik süýşme soňra ýiti gyzgynlyk hökmünde duýulyp biler. Beden derideki gan damarlaryny giňeltmek bilen jogap berýär, bu gyzgynlyk, gyzarmak we käwagt köp derlemek duýgusyna sebäp bolup biler.',
    highlight1Title: 'Her adam dürli',
    highlight1Text: 'Käbir aýallar hepdede birnäçe epizody başdan geçirýär, beýlekileri bolsa günde birnäçe gezek. Güýçlülik we dowamlylyk hem tapawutlanyp biler.',
    section2Body1: 'Uky wagtynda bolanda gyzgynlyk gelmeleri gijeki derlemäge sebäp bolup biler. Olar gaýtalanýan oýanmalara eltip, ukyny az dynç berýän edip biler.',
    section2Body2: 'Uky ýetmezçiligi soňra gündiz ýadawlygy, üns jemlemekdäki kynçylygy we gaharjaňlygy artdyryp biler. Şonuň üçin alamatlaryňyzyň täsirini bahalananyňyzda uky hilini hasaba almak peýdaly bolup biler.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Dem alýan pižamalar, ýeňil düşek eşikleri we ýeterlik salkyn ýatylýan otag gijeki biynjalygy çäklemäge kömek edip biler.',
    section3Body1: 'Käbir faktorlar gyzgynlyk gelmesini gozgap ýa-da güýçlendirip biler. Olar hemmelerde hökman alamat döretmeýär, ýöne olary kesgitlemek öz nusgaňyzy has gowy düşünmäge kömek edip biler.',
    triggers: [
      'Kofein we alkogol',
      'Ýiti iýmitler',
      'Stres we güýçli duýgular',
      'Aşa gyzdyrylan otag ýa-da aşa agyr eşik',
    ],
    tip2Title: 'Peýdaly kiçijik endik',
    tip2Text: 'Birnäçe hepde dowamynda gyzgynlyk gelmeleriniň haçan bolýandygyny, näçe güýçlüdigini we derrew öň näme bolandygyny belläň. Bu öz gozgaýjylariňizi görmäge kömek edip biler.',
    dailyHabits: [
      'Ýeňil gatlaklarda geýiniň',
      'Ýaşaýyş giňişligiňizi salkyn we gowy howalandyrylan saklaň',
      'Gyzgynlyk gelmesi wagtynda haýal dem alyň',
      'Yzygiderli salkyn suw içiň',
    ],
    section4Body1: 'Bu çäreler gyzgynlyk gelmelerini hökman ýitirmez, ýöne epizodlary dolandyrmagy aňsatlaşdyryp, bolanda biynjalygy azaldyp biler.',
    section5Body1: 'Gyzgynlyk gelmeleri perimenopauza we menopauza wagtynda ýaýran. Şeýle-de bolsa, olar ýaşamaga kyn bolsa, diňe çydamaly däl. Lukman ýa-da akuşerka alamatlaryňyzy bahalap, dürli wariantlary siz bilen maslahatlaşyp biler.',
    whenAppointmentTitle: 'Kabul ediş haçan ýazdyrmaly?',
    section5Body2: 'Alamatlar gündelik durmuşyňyza möhüm täsir edende ýa-da haýsy wariantlaryň barlygyny bilmek isleseňiz, maslahatlaşmak aýratyn peýdaly bolup biler.',
    consultReasons: [
      {
        title: 'Uky bozulanda',
        text: 'Gaýtalanýan oýanmalara, möhüm ýadawlyga ýa-da gündiz adaty işlemek kynçylygyna sebäp bolýan ýygy gyzgynlyk gelmeleri ýa-da gijeki derlemek.',
      },
      {
        title: 'Gündelik durmuş kynlaşanda',
        text: 'Gyzgynlyk gelmeleri işiňize, işjeňliklerigize, syýahatyňyza, durmuş gatnaşyklaryňyza ýa-da diňe gündelik rahatlygyňyza päsgel berýän bolsa.',
      },
      {
        title: 'Alamatlar ýygylanda',
        text: 'Alamatlaryň ýygylygynyň ýa-da güýçlüligiň aýdyň artmagy iň laýyk çözgütleri tapmak üçin maslahatlaşmaga mynasyp.',
      },
      {
        title: 'Bejergini pikir edýän bolsaňyz',
        text: 'Ýagdaýyňyza görä gormonal we gormonal däl wariantlar teklip edilip bilner. Hünärmen olaryň artykmaçlyklaryny, howplaryny we mümkin garşy görkezmelerini bahalamaga kömek edip biler.',
      },
    ],
    notMenopauseTitle: 'Hemme zady menopauza bilen baglamaň',
    notMenopauseBody: 'Gyzgynlyk gelmesiniň dürli sebäpleri bolup biler. Käbir alamatlar dermana, başga lukmançylyk ýagdaýyna ýa-da saglygyňyzdaky möhüm üýtgeşmä hem baglanyşykly bolup biler. Bir zat adaty däl, täze ýa-da aýratyn güýçli duýulsa, awtomatiki ýagdaýda menopauza diýip kabul etmegiň ýerine hünärmen bilen gürleşmek has gowy.',
    alertTitle: 'Derrew lukmançylyk kömegine ýüz tutuň',
    alertText: 'Döş agyrysy, ýiti dem ýetmezçiligi, huşdan gitmek duýgusy, ýiti ejizlik ýa-da bir aýakda adaty däl agyryly çişme derrew lukmançylyk kömegini talap edýär.',
    emergencySignsTitle: 'Haýsy alamatlara aýratyn üns bermeli?',
    emergencySigns: [
      'Adaty däl ýa-da güýçli döş agyrysy',
      'Ýiti dem ýetmezçiligi ýa-da möhüm dem alyş kynçylygy',
      'Huşdan gitmek duýgusy ýa-da huşuny ýitirmek',
      'Ýiti ejizlik ýa-da gürlemekde ýa-da görmekde kynçylyk',
      'Bir aýakda agyryly, adaty däl çişme',
    ],
    solutionsTitle: 'Haýsy çözgütler elýeter bolup biler?',
    solutionsBody: 'Gyzgynlyk gelmeleri dolandyrmagy talap etjek derejede biynjalyk edýän bolsa, birnäçe çemeleşme göz öňünde tutulyp bilner. Ýagdaýyňyza görä, hünärmen durmuş ýörelgesi çärelerini, gormonal däl bejergileri ýa-da laýyk bolanda gormon bejergisini maslahatlaşyp biler.',
    highlight2Title: 'Bejergi her ýagdaýa görä saýlanýar',
    highlight2Text: 'Ýaş, alamatlar, lukmançylyk taryhy, häzirki bejergiler we şahsy isleglerigiz teklip edilýän wariantlara täsir edip biler.',
    prepareTitle: 'Kabul edişe taýýarlanmak',
    prepareBody: 'Birneme maglumat bilen gelmek maslahatlaşmagy has peýdaly edip biler. Birnäçe gün ýa-da hepde dowamynda epizodlaryň näçe ýygy bolýandygyny, näçe güýçlüdigini we ukyňyza ýa-da işjeňligiňize täsirini ýazyp bilersiňiz.',
    questionsTitle: 'Taýýarlamaga peýdaly maglumat',
    appointmentQuestions: [
      'Gyzgynlyk gelmeleriňiz näçe ýygy bolýar?',
      'Olary näçe wagt bäri başdan geçirýärsiňiz?',
      'Olar gündiz, gije ýa-da ikisinde hem bolýarmy?',
      'Olar ukyňyza ýa-da işjeňligiňize päsgel berýärmi?',
      'Haýsydyr gozgaýjylari kesgitlediňizmi?',
      'Häzirki wagtda haýsydyr derman ýa-da gormonal göwrelilikden goranyşy kabul edýärsiňizmi?',
    ],
    professionalTipText: 'Alamatlar gaty güýçli bolýança gürleşmek üçin garaşmaly däl. Maslahatlaşmak diňe näme bolup geçýändigini düşünmäge we elýeterli çözgütler barada bilmäge hem kömek edip biler.',
    summaryTitle: 'Esasy zatlar',
    summaryItems: [
      'Gyzgynlyk gelmeleri menopauza ötüş döwründe ýaýran.',
      'Gozgaýjylariňizi kesgitlemek epizodlary has gowy dolandyrmaga kömek edip biler.',
      'Ýönekeý endikler gündelik biynjalygy azaldyp biler.',
      'Alamatlar ukyňyza ýa-da gündelik durmuşyňyza päsgel berse, hünärmen bilen gürleşiň.',
      'Ýagdaýyňyza görä birnäçe dolandyryş wariantlary maslahatlaşylyp bilner.',
    ],
    finalTipText: 'Gyzgynlyk gelmeleri ýaýran, ýöne olar ukyňyza, işiňize ýa-da abadançylygyňyza täsir edende äsgermezlik edilmeli däl. Alamatlaryňyza üns bermek we hünärmen bilen gürleşmek sebäbini has gowy düşünmäge we laýyk çözgütleri öwrenmäge kömek edip biler.',
    disclaimerText: 'Bu makala diňe maglumat maksatly we şahsylaşdyrylan lukmançylyk maslahatyny çalyşmaýar.',
    shareMessage: 'Gyzgynlyk gelmelerini milt ýagdaýa getirmek — AWA',
  },
} as const);

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

export default function HotFlashesArticleScreen({
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
          saveScrollPosition(
            ID,
            event.nativeEvent.contentOffset.y,
          )
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
          <Image
            source={HERO}
            resizeMode="cover"
            style={styles.hero}
          />

          <View
            style={[
              styles.top,
              {
                paddingTop: getTopPadding(
                  insets.top,
                  true,
                ),
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
                icon={
                    saved
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
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
          {/* BADGE */}

          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">
              {content.badge}
            </AwaText>
          </View>

          {/* TITLE */}

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

          {/* METADATA */}

          <View style={styles.metas}>
            {[
              ['clock-outline', content.metaDuration],
              [
                'book-open-page-variant-outline',
                content.metaType,
              ],
              ['chart-bar', content.metaLevel],
              ['shield-check-outline', content.metaValidated],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? (
                  <View style={styles.metaDivider} />
                ) : null}

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color={theme.colors.textMuted}
                    size={17}
                  />

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
                    {text}
                  </AwaText>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* INTRO */}

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.intro}>
            {content.intro}
          </AwaText>

          {/* TABLE OF CONTENTS */}

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>
              {content.contentsTitle}
            </AwaText>

            {content.topics.map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="titleSmall" emphasized colorRole="primary" style={styles.contentNumber}>
                    {index + 1}.
                  </AwaText>

                  <AwaText variant="bodySmall" style={styles.contentText}>
                    {item}
                  </AwaText>
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

          <AwaCard variant="filled" padding="none" style={styles.highlight}>
            <MaterialDesignIcons
              name="thermometer"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.highlight1Title}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.highlightText}>
                {content.highlight1Text}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 2 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.topics[1]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section2Body1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section2Body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.tip1Title}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip1Text}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 3 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            3. {content.topics[2]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body1}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.triggers.map(item => (
              <View
                key={item}
                style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>
                  {item}
                </AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="notebook-edit-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.tip2Title}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip2Text}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 4 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            4. {content.topics[3]}
          </AwaText>

          <View style={styles.daily}>
            {content.dailyHabits.map((label, index) => (
              <View
                key={label}
                style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={DAILY_ICONS[index] as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>
                  {label}
                </AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section4Body1}
          </AwaText>

          {/* SECTION 5 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            5. {content.topics[4]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section5Body1}
          </AwaText>

          <AwaText variant="titleMedium" emphasized style={styles.h3}>
            {content.whenAppointmentTitle}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section5Body2}
          </AwaText>

          <View style={styles.consultList}>
            {content.consultReasons.map((item, index) => (
              <AwaCard variant="filled" padding="none"
                key={item.title}
                style={styles.consultCard}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name={CONSULT_ICONS[index] as never}
                    size={21}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.consultCopy}>
                  <AwaText variant="titleSmall" emphasized>
                    {item.title}
                  </AwaText>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.consultText}>
                    {item.text}
                  </AwaText>
                </View>
              </AwaCard>
            ))}
          </View>

          <AwaText variant="titleMedium" emphasized style={styles.h3}>
            {content.notMenopauseTitle}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.notMenopauseBody}
          </AwaText>

          {/* ALERT */}

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.alertTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.alertText}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleMedium" emphasized style={styles.h3}>
            {content.emergencySignsTitle}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.warningList}>
            {content.emergencySigns.map(item => (
              <View
                key={item}
                style={styles.warningRow}>
                <MaterialDesignIcons
                  name="alert-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.warningText}>
                  {item}
                </AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleMedium" emphasized style={styles.h3}>
            {content.solutionsTitle}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.solutionsBody}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.highlight}>
            <MaterialDesignIcons
              name="medical-bag"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.highlight2Title}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.highlightText}>
                {content.highlight2Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleMedium" emphasized style={styles.h3}>
            {content.prepareTitle}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.prepareBody}
          </AwaText>

          {/* QUESTIONS */}

          <AwaCard variant="filled" padding="none" style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <MaterialDesignIcons
                name="message-question-outline"
                size={22}
                color={theme.colors.primary}
              />

              <AwaText variant="titleSmall" emphasized style={styles.questionTitle}>
                {content.questionsTitle}
              </AwaText>
            </View>

            {content.appointmentQuestions.map(
              (item, index) => (
                <View
                  key={item}
                  style={styles.questionRow}>
                  <View style={styles.questionBullet}>
                    <AwaText variant="labelSmall" emphasized colorRole="primary">
                      {index + 1}
                    </AwaText>
                  </View>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.questionText}>
                    {item}
                  </AwaText>
                </View>
              ),
            )}
          </AwaCard>

          {/* PROFESSIONAL TIP */}

          <AwaCard variant="filled" padding="none" style={styles.professionalTip}>
            <MaterialDesignIcons
              name="doctor"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.tip1Title}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.professionalTipText}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 6 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            6. {content.topics[5]}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={25}
                color={theme.colors.primary}
              />

              <AwaText variant="titleSmall" emphasized>
                {content.summaryTitle}
              </AwaText>
            </View>

            {content.summaryItems.map(item => (
              <View key={item} style={styles.summaryItem}>
                <MaterialDesignIcons
                  name="check"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
                  {item}
                </AwaText>
              </View>
            ))}
          </AwaCard>

          {/* FINAL TIP */}

          <AwaCard variant="filled" padding="none" style={styles.finalTip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.topics[5]}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.finalTipText}
              </AwaText>
            </View>
          </AwaCard>

          {/* DISCLAIMER */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={19}
              color={theme.colors.textMuted}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.disclaimerText}>
              {content.disclaimerText}
            </AwaText>
          </View>
        </View>
      </ScrollView>

      {/* READING CONTROLS */}

      <ReadingControls
        articleId={ID}
        durationMinutes={10}
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

  daily: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  dailyItem: {
    width: '48.7%',
    minHeight: 108,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  dailyText: {
    marginTop: 8,
    textAlign: 'center',
  },

  consultList: {
    marginTop: 16,
    gap: 12,
  },

  consultCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  consultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  consultCopy: {
    flex: 1,
    marginLeft: 12,
  },


  consultText: {
    marginTop: 4,
  },

  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  warningList: {
    marginTop: 12,
    padding: 16,
  },

  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },

  warningText: {
    flex: 1,
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

  questionTitle: {
    flex: 1,
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
