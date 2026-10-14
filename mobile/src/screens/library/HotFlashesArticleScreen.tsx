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
const CONTENT = {
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
} as const;

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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.reader.back')}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}>
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
                  name={
                    saved
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
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

        {/* ARTICLE */}

        <View style={styles.article}>
          {/* BADGE */}

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {content.badge}
            </Text>
          </View>

          {/* TITLE */}

          <Text style={styles.title}>
            {content.title}
          </Text>

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

                  <Text style={styles.meta}>
                    {text}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* INTRO */}

          <Text style={styles.intro}>
            {content.intro}
          </Text>

          {/* TABLE OF CONTENTS */}

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>
              {content.contentsTitle}
            </Text>

            {content.topics.map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>
                    {index + 1}.
                  </Text>

                  <Text style={styles.contentText}>
                    {item}
                  </Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          {/* SECTION 1 */}

          <Text style={styles.h2}>
            1. {content.topics[0]}
          </Text>

          <Text style={styles.body}>
            {content.section1Body1}
          </Text>

          <Text style={styles.body}>
            {content.section1Body2}
          </Text>

          <View style={styles.highlight}>
            <MaterialDesignIcons
              name="thermometer"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>
                {content.highlight1Title}
              </Text>

              <Text style={styles.highlightText}>
                {content.highlight1Text}
              </Text>
            </View>
          </View>

          {/* SECTION 2 */}

          <Text style={styles.h2}>
            2. {content.topics[1]}
          </Text>

          <Text style={styles.body}>
            {content.section2Body1}
          </Text>

          <Text style={styles.body}>
            {content.section2Body2}
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.tip1Title}
              </Text>

              <Text style={styles.tipText}>
                {content.tip1Text}
              </Text>
            </View>
          </View>

          {/* SECTION 3 */}

          <Text style={styles.h2}>
            3. {content.topics[2]}
          </Text>

          <Text style={styles.body}>
            {content.section3Body1}
          </Text>

          <View style={styles.checkList}>
            {content.triggers.map(item => (
              <View
                key={item}
                style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.checkText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="notebook-edit-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.tip2Title}
              </Text>

              <Text style={styles.tipText}>
                {content.tip2Text}
              </Text>
            </View>
          </View>

          {/* SECTION 4 */}

          <Text style={styles.h2}>
            4. {content.topics[3]}
          </Text>

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

                <Text style={styles.dailyText}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.body}>
            {content.section4Body1}
          </Text>

          {/* SECTION 5 */}

          <Text style={styles.h2}>
            5. {content.topics[4]}
          </Text>

          <Text style={styles.body}>
            {content.section5Body1}
          </Text>

          <Text style={styles.h3}>
            {content.whenAppointmentTitle}
          </Text>

          <Text style={styles.body}>
            {content.section5Body2}
          </Text>

          <View style={styles.consultList}>
            {content.consultReasons.map((item, index) => (
              <View
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
                  <Text style={styles.consultTitle}>
                    {item.title}
                  </Text>

                  <Text style={styles.consultText}>
                    {item.text}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.h3}>
            {content.notMenopauseTitle}
          </Text>

          <Text style={styles.body}>
            {content.notMenopauseBody}
          </Text>

          {/* ALERT */}

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.alertTitle}
              </Text>

              <Text style={styles.tipText}>
                {content.alertText}
              </Text>
            </View>
          </View>

          <Text style={styles.h3}>
            {content.emergencySignsTitle}
          </Text>

          <View style={styles.warningList}>
            {content.emergencySigns.map(item => (
              <View
                key={item}
                style={styles.warningRow}>
                <MaterialDesignIcons
                  name="alert-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />

                <Text style={styles.warningText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.h3}>
            {content.solutionsTitle}
          </Text>

          <Text style={styles.body}>
            {content.solutionsBody}
          </Text>

          <View style={styles.highlight}>
            <MaterialDesignIcons
              name="medical-bag"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>
                {content.highlight2Title}
              </Text>

              <Text style={styles.highlightText}>
                {content.highlight2Text}
              </Text>
            </View>
          </View>

          <Text style={styles.h3}>
            {content.prepareTitle}
          </Text>

          <Text style={styles.body}>
            {content.prepareBody}
          </Text>

          {/* QUESTIONS */}

          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <MaterialDesignIcons
                name="message-question-outline"
                size={22}
                color={theme.colors.primary}
              />

              <Text style={styles.questionTitle}>
                {content.questionsTitle}
              </Text>
            </View>

            {content.appointmentQuestions.map(
              (item, index) => (
                <View
                  key={item}
                  style={styles.questionRow}>
                  <View style={styles.questionBullet}>
                    <Text style={styles.questionNumber}>
                      {index + 1}
                    </Text>
                  </View>

                  <Text style={styles.questionText}>
                    {item}
                  </Text>
                </View>
              ),
            )}
          </View>

          {/* PROFESSIONAL TIP */}

          <View style={styles.professionalTip}>
            <MaterialDesignIcons
              name="doctor"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.tip1Title}
              </Text>

              <Text style={styles.tipText}>
                {content.professionalTipText}
              </Text>
            </View>
          </View>

          {/* SECTION 6 */}

          <Text style={styles.h2}>
            6. {content.topics[5]}
          </Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={25}
                color={theme.colors.primary}
              />

              <Text style={styles.summaryTitle}>
                {content.summaryTitle}
              </Text>
            </View>

            {content.summaryItems.map(item => (
              <View key={item} style={styles.summaryItem}>
                <MaterialDesignIcons
                  name="check"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.summaryText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          {/* FINAL TIP */}

          <View style={styles.finalTip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.topics[5]}
              </Text>

              <Text style={styles.tipText}>
                {content.finalTipText}
              </Text>
            </View>
          </View>

          {/* DISCLAIMER */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={19}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>
              {content.disclaimerText}
            </Text>
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

  checkList: {
    marginTop: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
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

  daily: {
    marginTop: 13,
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
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  dailyText: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },

  consultList: {
    marginTop: 14,
    gap: 10,
  },

  consultCard: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    marginLeft: 11,
  },

  consultTitle: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.text,
    fontWeight: '800',
  },

  consultText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
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

  warningList: {
    marginTop: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },

  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },

  questionCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
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
    flex: 1,
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
