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

const ID = 'pcos-cycle-ovulation-fertilite';

const HERO = require('../../assets/images/library/featured-cycle.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'SOPK',
    title: 'Cycle, ovulation\net fertilité dans le SOPK',
    metaDuration: '8 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro: 'Avec le SOPK, le cycle peut devenir long, irrégulier et parfois difficile à prévoir. Comprendre ce qui se passe autour de l’ovulation permet de mieux interpréter son cycle et de mieux comprendre les questions liées à la fertilité.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Pourquoi le cycle devient irrégulier',
      'Ce qui se passe autour de l’ovulation',
      'Comment reconnaître une ovulation',
      'SOPK et fertilité',
      'Pourquoi les applications peuvent être moins précises',
      'Suivre son cycle avec le SOPK',
      'Quand consulter pour un désir de grossesse',
      'À retenir',
    ],
    section1Body1: 'Le cycle menstruel dépend d’une succession coordonnée de signaux hormonaux. Dans le SOPK, cette organisation peut être perturbée, notamment au niveau du développement des follicules et de l’ovulation.',
    section1Body2: 'Les ovaires peuvent contenir de nombreux petits follicules qui commencent leur développement sans qu’un follicule dominant arrive régulièrement à maturité. L’ovulation peut alors être retardée, survenir de manière imprévisible ou ne pas avoir lieu pendant certains cycles.',
    section1Body3: 'C’est l’une des raisons pour lesquelles certaines personnes atteintes de SOPK ont des cycles de 35, 45 ou parfois davantage de jours, tandis que d’autres peuvent avoir des cycles plus proches d’une durée habituelle.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'La durée d’un cycle ne permet pas, à elle seule, de savoir si une ovulation a eu lieu. Deux cycles de même durée peuvent avoir une histoire hormonale différente.',
    section2Body1: 'L’ovulation correspond à la libération d’un ovocyte par un ovaire. Elle intervient après une phase de maturation folliculaire et précède la phase lutéale du cycle.',
    section2Body2: 'Dans un cycle régulier, l’ovulation est souvent située au milieu du cycle. Mais avec le SOPK, cette règle simple ne fonctionne pas toujours. L’ovulation peut être beaucoup plus tardive ou ne pas se produire au cours d’un cycle donné.',
    infoTitle: 'Pourquoi cela compte',
    infoText: 'Lorsque l’ovulation est imprévisible, il devient plus difficile d’estimer la période fertile uniquement à partir des dates des règles.',
    section3Body1: 'Il existe plusieurs signes corporels pouvant accompagner les changements hormonaux autour de l’ovulation. Ils peuvent être utiles pour mieux observer son propre cycle, mais aucun signe isolé ne permet de confirmer avec certitude une ovulation.',
    ovulationSigns: [
      'Modification de la glaire cervicale, qui peut devenir plus abondante, transparente et filante',
      'Légère douleur ou gêne pelvienne chez certaines femmes',
      'Variation de la température corporelle après l’ovulation',
      'Modification de la sensation d’humidité vaginale',
      'Éventuelle augmentation de la libido chez certaines femmes',
    ],
    section3Body2: 'La glaire cervicale est notamment intéressante à observer. À l’approche de la période fertile, elle peut devenir plus abondante, transparente, glissante et extensible. Cependant, son aspect peut varier d’une personne à l’autre et d’un cycle à l’autre.',
    alert1Title: 'Attention aux prédictions',
    alert1Text: 'Avec des cycles très irréguliers, une date d’ovulation calculée automatiquement à partir des cycles précédents peut être très approximative. Une prédiction n’est pas une confirmation médicale de l’ovulation.',
    section4Body1: 'Le SOPK peut rendre la conception plus difficile principalement lorsque l’ovulation est peu fréquente ou difficile à prévoir. Toutefois, avoir un SOPK ne signifie pas être stérile.',
    section4Body2: 'Certaines femmes atteintes de SOPK ovulent régulièrement et conçoivent sans difficulté particulière. Pour d’autres, l’ovulation est suffisamment irrégulière pour nécessiter une évaluation et éventuellement une prise en charge médicale.',
    fertilityPoints: [
      'Le SOPK n’entraîne pas automatiquement une infertilité',
      'La principale difficulté vient souvent d’une ovulation irrégulière ou imprévisible',
      'Une ovulation peut survenir même lorsque les cycles sont très longs',
      'Une prise en charge adaptée peut améliorer les chances de conception',
      'Le parcours de fertilité dépend de chaque personne et de nombreux autres facteurs',
    ],
    section4Body3: 'La fertilité ne dépend d’ailleurs pas uniquement de l’ovulation. L’âge, la qualité du sperme du partenaire, l’état des trompes, l’endomètre et d’autres facteurs peuvent également intervenir. C’est pourquoi une évaluation globale est importante lorsqu’une grossesse tarde à survenir.',
    section5Body1: 'Les applications de suivi menstruel utilisent généralement les données des cycles précédents pour proposer des estimations. Lorsque les cycles sont relativement réguliers, ces estimations peuvent être utiles pour se repérer.',
    section5Body2: 'Avec le SOPK, la variabilité des cycles peut cependant rendre ces calculs moins fiables. Une application ne peut pas savoir avec certitude qu’une ovulation a eu lieu uniquement parce qu’une date théorique est atteinte.',
    tip2Title: 'À utiliser comme repère',
    tip2Text: 'Le suivi numérique est surtout intéressant pour observer les tendances de ton propre cycle et conserver un historique à partager avec ton professionnel de santé.',
    section6Body1: 'Un suivi régulier peut aider à mieux comprendre les variations personnelles. Il ne s’agit pas de chercher à rendre le cycle parfaitement prévisible, mais plutôt de recueillir suffisamment d’informations pour identifier des tendances.',
    trackingTips: [
      'Noter la date du premier jour de chaque cycle, même lorsque les cycles sont très espacés',
      'Observer les changements de glaire cervicale au fil du cycle',
      'Noter d’éventuelles douleurs pelviennes ou autres signes pouvant accompagner l’ovulation',
      'Éviter de se baser uniquement sur une durée moyenne de 28 jours pour prédire l’ovulation',
      'Utiliser les tests d’ovulation avec prudence et, si besoin, demander conseil à un professionnel',
      'Partager les informations recueillies avec un professionnel de santé en cas de désir de grossesse',
    ],
    section6Body2: 'Il peut également être utile de noter les symptômes associés : douleurs, acné, changements de glaire, saignements inhabituels, humeur, sommeil ou autres observations personnelles. Ces informations peuvent aider à donner une vision plus complète du cycle.',
    section7Body1: 'Une consultation peut être pertinente avant même de commencer les essais lorsque les cycles sont très irréguliers, très espacés ou lorsqu’une absence prolongée de règles est observée.',
    section7Body2: 'Un professionnel pourra rechercher les causes des irrégularités, évaluer l’ovulation et proposer, si nécessaire, une stratégie adaptée au projet de grossesse.',
    alert2Title: 'Quand demander conseil',
    alert2Text: 'Si tes règles sont très espacées, si tu n’as pas de règles pendant plusieurs mois, ou si une grossesse ne survient pas malgré des rapports réguliers, parle-en à un professionnel de santé.',
    summaryTitle: 'Les points essentiels',
    summaryRows: [
      'Le SOPK peut rendre les cycles longs et imprévisibles.',
      'L’ovulation peut être irrégulière ou absente certains cycles.',
      'Un cycle irrégulier ne signifie pas automatiquement absence de fertilité.',
      'Les prédictions basées uniquement sur le calendrier peuvent être moins fiables avec le SOPK.',
      'Observer son cycle et conserver un historique peut être utile, notamment lors d’une consultation.',
    ],
    finalTipTitle: 'Un dernier mot',
    finalTipText: 'Le SOPK ne se manifeste pas de la même manière chez toutes les femmes. Ton cycle peut évoluer avec le temps. Le suivi est là pour t’aider à mieux comprendre ton fonctionnement, pas pour remplacer un avis médical.',
    disclaimer: 'Cet article a une vocation informative et éducative. Il ne constitue pas un diagnostic médical et ne remplace pas une consultation avec un professionnel de santé.',
    shareMessage: 'Cycle, ovulation et fertilité dans le SOPK — AWA',
  },
  en: {
    badge: 'PCOS',
    title: 'Cycle, ovulation,\nand fertility in PCOS',
    metaDuration: '8 min read',
    metaType: 'Guide',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro: 'With PCOS, your cycle can become long, irregular, and sometimes hard to predict. Understanding what happens around ovulation can help you make sense of your cycle and better understand fertility-related questions.',
    contentsTitle: 'In this article',
    topics: [
      'Why the cycle becomes irregular',
      'What happens around ovulation',
      'How to recognize ovulation',
      'PCOS and fertility',
      'Why apps may be less accurate',
      'Tracking your cycle with PCOS',
      'When to see a doctor if you want to conceive',
      'Key takeaways',
    ],
    section1Body1: 'The menstrual cycle depends on a coordinated sequence of hormonal signals. In PCOS, this organization can be disrupted, particularly in follicle development and ovulation.',
    section1Body2: 'The ovaries can contain many small follicles that begin developing without a dominant follicle regularly reaching maturity. Ovulation may then be delayed, occur unpredictably, or not happen at all during certain cycles.',
    section1Body3: 'This is one of the reasons some people with PCOS have cycles of 35, 45, or sometimes more days, while others may have cycles closer to a typical length.',
    tip1Title: 'Good to know',
    tip1Text: 'Cycle length alone doesn’t tell you whether ovulation occurred. Two cycles of the same length can have a different hormonal story.',
    section2Body1: 'Ovulation is the release of an egg from an ovary. It follows a phase of follicular maturation and precedes the luteal phase of the cycle.',
    section2Body2: 'In a regular cycle, ovulation is often around the midpoint. But with PCOS, this simple rule doesn’t always apply. Ovulation may be much later or may not happen at all in a given cycle.',
    infoTitle: 'Why this matters',
    infoText: 'When ovulation is unpredictable, it becomes harder to estimate the fertile window based on period dates alone.',
    section3Body1: 'There are several physical signs that can accompany the hormonal changes around ovulation. They can be useful for observing your own cycle, but no single sign can confirm ovulation with certainty.',
    ovulationSigns: [
      'A change in cervical mucus, which may become more abundant, clear, and stretchy',
      'Mild pelvic pain or discomfort in some women',
      'A change in body temperature after ovulation',
      'A change in vaginal wetness',
      'A possible increase in libido in some women',
    ],
    section3Body2: 'Cervical mucus is particularly worth observing. As the fertile window approaches, it may become more abundant, clear, slippery, and stretchy. However, its appearance can vary from person to person and from cycle to cycle.',
    alert1Title: 'Be careful with predictions',
    alert1Text: 'With very irregular cycles, an ovulation date calculated automatically from previous cycles can be very approximate. A prediction is not a medical confirmation of ovulation.',
    section4Body1: 'PCOS can make conception more difficult, mainly when ovulation is infrequent or hard to predict. However, having PCOS doesn’t mean being infertile.',
    section4Body2: 'Some women with PCOS ovulate regularly and conceive without particular difficulty. For others, ovulation is irregular enough to call for an evaluation and possibly medical care.',
    fertilityPoints: [
      'PCOS doesn’t automatically cause infertility',
      'The main difficulty is often irregular or unpredictable ovulation',
      'Ovulation can occur even when cycles are very long',
      'Appropriate care can improve the chances of conception',
      'The fertility journey depends on each individual and many other factors',
    ],
    section4Body3: 'Fertility doesn’t depend on ovulation alone, either. Age, partner sperm quality, the condition of the fallopian tubes, the endometrium, and other factors can also play a role. This is why a comprehensive evaluation matters when pregnancy takes longer than expected.',
    section5Body1: 'Period-tracking apps generally use data from previous cycles to produce estimates. When cycles are relatively regular, these estimates can be useful as a reference.',
    section5Body2: 'With PCOS, however, cycle variability can make these calculations less reliable. An app cannot know for certain that ovulation has occurred just because a theoretical date has been reached.',
    tip2Title: 'Use it as a reference point',
    tip2Text: 'Digital tracking is most useful for observing trends in your own cycle and keeping a history to share with your healthcare provider.',
    section6Body1: 'Regular tracking can help you better understand your personal variations. The goal isn’t to make the cycle perfectly predictable, but rather to gather enough information to identify trends.',
    trackingTips: [
      'Note the date of the first day of each cycle, even when cycles are very spaced out',
      'Observe changes in cervical mucus throughout the cycle',
      'Note any pelvic pain or other signs that may accompany ovulation',
      'Avoid relying solely on an average 28-day length to predict ovulation',
      'Use ovulation tests with caution and, if needed, ask a professional for advice',
      'Share the information you gather with a healthcare professional if you want to become pregnant',
    ],
    section6Body2: 'It can also help to note associated symptoms: pain, acne, changes in mucus, unusual bleeding, mood, sleep, or other personal observations. This information can help build a fuller picture of your cycle.',
    section7Body1: 'A consultation can be worthwhile even before starting to try to conceive, when cycles are very irregular, very spaced out, or when periods are absent for an extended time.',
    section7Body2: 'A healthcare professional can investigate the causes of the irregularities, assess ovulation, and if needed, suggest a strategy suited to your pregnancy plans.',
    alert2Title: 'When to seek advice',
    alert2Text: 'If your periods are very spaced out, if you haven’t had a period for several months, or if pregnancy doesn’t happen despite regular intercourse, talk to a healthcare professional.',
    summaryTitle: 'Key points',
    summaryRows: [
      'PCOS can make cycles long and unpredictable.',
      'Ovulation may be irregular or absent in some cycles.',
      'An irregular cycle doesn’t automatically mean a lack of fertility.',
      'Predictions based solely on the calendar may be less reliable with PCOS.',
      'Observing your cycle and keeping a history can be useful, especially for a consultation.',
    ],
    finalTipTitle: 'One last word',
    finalTipText: 'PCOS doesn’t show up the same way in every woman. Your cycle may change over time. Tracking is there to help you better understand how your body works, not to replace medical advice.',
    disclaimer: 'This article is for informational and educational purposes only. It does not constitute a medical diagnosis and does not replace a consultation with a healthcare professional.',
    shareMessage: 'Cycle, ovulation, and fertility in PCOS — AWA',
  },
  es: {
    badge: 'SOP',
    title: 'Ciclo, ovulación\ny fertilidad en el SOP',
    metaDuration: '8 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido validado',
    intro: 'Con el SOP, el ciclo puede volverse largo, irregular y a veces difícil de prever. Comprender lo que ocurre en torno a la ovulación permite interpretar mejor tu ciclo y comprender mejor las preguntas relacionadas con la fertilidad.',
    contentsTitle: 'En este artículo',
    topics: [
      'Por qué el ciclo se vuelve irregular',
      'Lo que ocurre en torno a la ovulación',
      'Cómo reconocer una ovulación',
      'SOP y fertilidad',
      'Por qué las aplicaciones pueden ser menos precisas',
      'Seguir tu ciclo con el SOP',
      'Cuándo consultar ante un deseo de embarazo',
      'Para recordar',
    ],
    section1Body1: 'El ciclo menstrual depende de una sucesión coordinada de señales hormonales. En el SOP, esta organización puede verse alterada, especialmente en el desarrollo de los folículos y la ovulación.',
    section1Body2: 'Los ovarios pueden contener numerosos pequeños folículos que comienzan su desarrollo sin que un folículo dominante llegue regularmente a la madurez. La ovulación puede entonces retrasarse, producirse de manera imprevisible o no tener lugar durante ciertos ciclos.',
    section1Body3: 'Esta es una de las razones por las que algunas personas con SOP tienen ciclos de 35, 45 o a veces más días, mientras que otras pueden tener ciclos más cercanos a una duración habitual.',
    tip1Title: 'Dato útil',
    tip1Text: 'La duración de un ciclo no permite, por sí sola, saber si ha habido ovulación. Dos ciclos de la misma duración pueden tener una historia hormonal diferente.',
    section2Body1: 'La ovulación corresponde a la liberación de un ovocito por un ovario. Se produce tras una fase de maduración folicular y precede a la fase lútea del ciclo.',
    section2Body2: 'En un ciclo regular, la ovulación suele situarse hacia la mitad del ciclo. Pero con el SOP, esta regla simple no siempre funciona. La ovulación puede ser mucho más tardía o no producirse en un ciclo determinado.',
    infoTitle: 'Por qué esto importa',
    infoText: 'Cuando la ovulación es imprevisible, resulta más difícil estimar el periodo fértil basándose únicamente en las fechas de la regla.',
    section3Body1: 'Existen varios signos corporales que pueden acompañar los cambios hormonales en torno a la ovulación. Pueden ser útiles para observar mejor tu propio ciclo, pero ningún signo aislado permite confirmar con certeza una ovulación.',
    ovulationSigns: [
      'Modificación del moco cervical, que puede volverse más abundante, transparente y elástico',
      'Ligero dolor o molestia pélvica en algunas mujeres',
      'Variación de la temperatura corporal tras la ovulación',
      'Modificación de la sensación de humedad vaginal',
      'Posible aumento de la libido en algunas mujeres',
    ],
    section3Body2: 'El moco cervical resulta especialmente interesante de observar. Al acercarse el periodo fértil, puede volverse más abundante, transparente, resbaladizo y elástico. Sin embargo, su aspecto puede variar de una persona a otra y de un ciclo a otro.',
    alert1Title: 'Cuidado con las predicciones',
    alert1Text: 'Con ciclos muy irregulares, una fecha de ovulación calculada automáticamente a partir de ciclos anteriores puede ser muy aproximada. Una predicción no es una confirmación médica de la ovulación.',
    section4Body1: 'El SOP puede dificultar la concepción principalmente cuando la ovulación es poco frecuente o difícil de prever. Sin embargo, tener SOP no significa ser estéril.',
    section4Body2: 'Algunas mujeres con SOP ovulan con regularidad y conciben sin dificultad particular. Para otras, la ovulación es lo bastante irregular como para requerir una evaluación y, eventualmente, un manejo médico.',
    fertilityPoints: [
      'El SOP no provoca automáticamente infertilidad',
      'La principal dificultad suele venir de una ovulación irregular o imprevisible',
      'Puede producirse una ovulación incluso cuando los ciclos son muy largos',
      'Un manejo adecuado puede mejorar las posibilidades de concepción',
      'El camino hacia la fertilidad depende de cada persona y de muchos otros factores',
    ],
    section4Body3: 'Por lo demás, la fertilidad no depende únicamente de la ovulación. La edad, la calidad del esperma de la pareja, el estado de las trompas, el endometrio y otros factores también pueden intervenir. Por eso una evaluación global es importante cuando un embarazo tarda en llegar.',
    section5Body1: 'Las aplicaciones de seguimiento menstrual suelen utilizar los datos de los ciclos anteriores para proponer estimaciones. Cuando los ciclos son relativamente regulares, estas estimaciones pueden ser útiles como referencia.',
    section5Body2: 'Con el SOP, sin embargo, la variabilidad de los ciclos puede hacer que estos cálculos sean menos fiables. Una aplicación no puede saber con certeza que ha habido ovulación solo porque se ha alcanzado una fecha teórica.',
    tip2Title: 'Úsalo como referencia',
    tip2Text: 'El seguimiento digital resulta sobre todo interesante para observar las tendencias de tu propio ciclo y conservar un historial que compartir con tu profesional de salud.',
    section6Body1: 'Un seguimiento regular puede ayudar a comprender mejor las variaciones personales. No se trata de intentar que el ciclo sea perfectamente previsible, sino más bien de reunir suficiente información para identificar tendencias.',
    trackingTips: [
      'Anota la fecha del primer día de cada ciclo, incluso cuando los ciclos están muy espaciados',
      'Observa los cambios del moco cervical a lo largo del ciclo',
      'Anota los posibles dolores pélvicos u otros signos que puedan acompañar la ovulación',
      'Evita basarte únicamente en una duración media de 28 días para predecir la ovulación',
      'Usa los test de ovulación con prudencia y, si lo necesitas, pide consejo a un profesional',
      'Comparte la información recopilada con un profesional de salud si deseas quedarte embarazada',
    ],
    section6Body2: 'También puede ser útil anotar los síntomas asociados: dolores, acné, cambios del moco, sangrados inusuales, estado de ánimo, sueño u otras observaciones personales. Esta información puede ayudar a dar una visión más completa del ciclo.',
    section7Body1: 'Una consulta puede ser pertinente incluso antes de empezar a intentar concebir, cuando los ciclos son muy irregulares, muy espaciados o cuando se observa una ausencia prolongada de la regla.',
    section7Body2: 'Un profesional podrá buscar las causas de las irregularidades, evaluar la ovulación y proponer, si es necesario, una estrategia adaptada al proyecto de embarazo.',
    alert2Title: 'Cuándo pedir consejo',
    alert2Text: 'Si tus reglas están muy espaciadas, si no tienes la regla durante varios meses, o si el embarazo no llega a pesar de relaciones regulares, habla con un profesional de salud.',
    summaryTitle: 'Los puntos esenciales',
    summaryRows: [
      'El SOP puede hacer que los ciclos sean largos e imprevisibles.',
      'La ovulación puede ser irregular o estar ausente en ciertos ciclos.',
      'Un ciclo irregular no significa automáticamente ausencia de fertilidad.',
      'Las predicciones basadas únicamente en el calendario pueden ser menos fiables con el SOP.',
      'Observar tu ciclo y conservar un historial puede ser útil, especialmente en una consulta.',
    ],
    finalTipTitle: 'Una última palabra',
    finalTipText: 'El SOP no se manifiesta de la misma manera en todas las mujeres. Tu ciclo puede evolucionar con el tiempo. El seguimiento está ahí para ayudarte a comprender mejor tu funcionamiento, no para sustituir una opinión médica.',
    disclaimer: 'Este artículo tiene una vocación informativa y educativa. No constituye un diagnóstico médico ni sustituye una consulta con un profesional de salud.',
    shareMessage: 'Ciclo, ovulación y fertilidad en el SOP — AWA',
  },
  it: {
    badge: 'PCOS',
    title: 'Ciclo, ovulazione\ne fertilità nella PCOS',
    metaDuration: '8 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenuto validato',
    intro: 'Con la PCOS, il ciclo può diventare lungo, irregolare e a volte difficile da prevedere. Capire cosa accade intorno all’ovulazione può aiutarti a dare un senso al tuo ciclo e a comprendere meglio le domande legate alla fertilità.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Perché il ciclo diventa irregolare',
      'Cosa accade intorno all’ovulazione',
      'Come riconoscere l’ovulazione',
      'PCOS e fertilità',
      'Perché le app possono essere meno precise',
      'Monitorare il ciclo con la PCOS',
      'Quando consultare un medico se desideri concepire',
      'Punti chiave',
    ],
    section1Body1: 'Il ciclo mestruale dipende da una sequenza coordinata di segnali ormonali. Nella PCOS questa organizzazione può essere alterata, in particolare nello sviluppo dei follicoli e nell’ovulazione.',
    section1Body2: 'Le ovaie possono contenere molti piccoli follicoli che iniziano a svilupparsi senza che un follicolo dominante raggiunga regolarmente la maturità. L’ovulazione può quindi essere ritardata, verificarsi in modo imprevedibile o non avvenire affatto in alcuni cicli.',
    section1Body3: 'È una delle ragioni per cui alcune persone con la PCOS hanno cicli di 35, 45 o a volte più giorni, mentre altre possono avere cicli più vicini a una durata tipica.',
    tip1Title: 'Da sapere',
    tip1Text: 'La sola durata del ciclo non ti dice se l’ovulazione è avvenuta. Due cicli della stessa durata possono avere una storia ormonale diversa.',
    section2Body1: 'L’ovulazione è il rilascio di un ovulo da un’ovaia. Segue una fase di maturazione follicolare e precede la fase luteale del ciclo.',
    section2Body2: 'In un ciclo regolare, l’ovulazione avviene spesso verso la metà. Ma con la PCOS questa semplice regola non vale sempre. L’ovulazione può essere molto più tardiva o non avvenire affatto in un dato ciclo.',
    infoTitle: 'Perché è importante',
    infoText: 'Quando l’ovulazione è imprevedibile, diventa più difficile stimare la finestra fertile basandosi soltanto sulle date del periodo mestruale.',
    section3Body1: 'Esistono diversi segni fisici che possono accompagnare i cambiamenti ormonali intorno all’ovulazione. Possono essere utili per osservare il tuo ciclo, ma nessun segno da solo può confermare l’ovulazione con certezza.',
    ovulationSigns: [
      'Un cambiamento del muco cervicale, che può diventare più abbondante, trasparente e filante',
      'Lieve dolore o fastidio pelvico in alcune donne',
      'Un cambiamento della temperatura corporea dopo l’ovulazione',
      'Un cambiamento dell’umidità vaginale',
      'Un possibile aumento della libido in alcune donne',
    ],
    section3Body2: 'Vale la pena osservare in particolare il muco cervicale. Con l’avvicinarsi della finestra fertile, può diventare più abbondante, trasparente, scivoloso e filante. Tuttavia, il suo aspetto può variare da persona a persona e da ciclo a ciclo.',
    alert1Title: 'Attenzione alle previsioni',
    alert1Text: 'Con cicli molto irregolari, una data di ovulazione calcolata automaticamente a partire dai cicli precedenti può essere molto approssimativa. Una previsione non è una conferma medica dell’ovulazione.',
    section4Body1: 'La PCOS può rendere più difficile il concepimento, soprattutto quando l’ovulazione è poco frequente o difficile da prevedere. Tuttavia, avere la PCOS non significa essere infertili.',
    section4Body2: 'Alcune donne con la PCOS ovulano regolarmente e concepiscono senza particolari difficoltà. Per altre, l’ovulazione è abbastanza irregolare da richiedere una valutazione ed eventualmente un percorso di cura.',
    fertilityPoints: [
      'La PCOS non causa automaticamente infertilità',
      'La difficoltà principale è spesso un’ovulazione irregolare o imprevedibile',
      'L’ovulazione può verificarsi anche quando i cicli sono molto lunghi',
      'Cure adeguate possono migliorare le probabilità di concepimento',
      'Il percorso di fertilità dipende da ogni persona e da molti altri fattori',
    ],
    section4Body3: 'Nemmeno la fertilità dipende dalla sola ovulazione. Anche l’età, la qualità dello sperma del partner, le condizioni delle tube di Falloppio, l’endometrio e altri fattori possono avere un ruolo. Per questo una valutazione completa è importante quando la gravidanza richiede più tempo del previsto.',
    section5Body1: 'Le app di monitoraggio del ciclo usano in genere i dati dei cicli precedenti per produrre delle stime. Quando i cicli sono relativamente regolari, queste stime possono essere utili come riferimento.',
    section5Body2: 'Con la PCOS, però, la variabilità del ciclo può rendere questi calcoli meno affidabili. Un’app non può sapere con certezza che l’ovulazione sia avvenuta solo perché è stata raggiunta una data teorica.',
    tip2Title: 'Usalo come punto di riferimento',
    tip2Text: 'Il monitoraggio digitale è più utile per osservare le tendenze del tuo ciclo e conservare uno storico da condividere con il tuo professionista sanitario.',
    section6Body1: 'Un monitoraggio regolare può aiutarti a comprendere meglio le tue variazioni personali. L’obiettivo non è rendere il ciclo perfettamente prevedibile, ma raccogliere abbastanza informazioni per individuare delle tendenze.',
    trackingTips: [
      'Annota la data del primo giorno di ogni ciclo, anche quando i cicli sono molto distanziati',
      'Osserva i cambiamenti del muco cervicale durante il ciclo',
      'Annota eventuali dolori pelvici o altri segni che possono accompagnare l’ovulazione',
      'Evita di basarti unicamente su una durata media di 28 giorni per prevedere l’ovulazione',
      'Usa i test di ovulazione con cautela e, se necessario, chiedi consiglio a un professionista',
      'Condividi le informazioni raccolte con un professionista sanitario se desideri una gravidanza',
    ],
    section6Body2: 'Può essere utile anche annotare i sintomi associati: dolore, acne, cambiamenti del muco, sanguinamenti insoliti, umore, sonno o altre osservazioni personali. Queste informazioni possono aiutare a costruire un quadro più completo del tuo ciclo.',
    section7Body1: 'Una visita può essere utile anche prima di iniziare a cercare di concepire, quando i cicli sono molto irregolari, molto distanziati o quando il periodo mestruale è assente per un tempo prolungato.',
    section7Body2: 'Un professionista sanitario può indagare le cause delle irregolarità, valutare l’ovulazione e, se necessario, proporre una strategia adatta al tuo progetto di gravidanza.',
    alert2Title: 'Quando chiedere un parere',
    alert2Text: 'Se i tuoi periodi mestruali sono molto distanziati, se non hai le mestruazioni da diversi mesi o se la gravidanza non arriva nonostante rapporti regolari, parlane con un professionista sanitario.',
    summaryTitle: 'Punti chiave',
    summaryRows: [
      'La PCOS può rendere i cicli lunghi e imprevedibili.',
      'L’ovulazione può essere irregolare o assente in alcuni cicli.',
      'Un ciclo irregolare non significa automaticamente mancanza di fertilità.',
      'Le previsioni basate unicamente sul calendario possono essere meno affidabili con la PCOS.',
      'Osservare il proprio ciclo e conservarne lo storico può essere utile, soprattutto per una visita.',
    ],
    finalTipTitle: 'Un’ultima parola',
    finalTipText: 'La PCOS non si manifesta allo stesso modo in ogni donna. Il tuo ciclo può cambiare nel tempo. Il monitoraggio serve ad aiutarti a capire meglio come funziona il tuo corpo, non a sostituire il parere medico.',
    disclaimer: 'Questo articolo ha uno scopo esclusivamente informativo ed educativo. Non costituisce una diagnosi medica e non sostituisce la visita con un professionista sanitario.',
    shareMessage: 'Ciclo, ovulazione e fertilità nella PCOS — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PcosCycleFertilityArticleScreen({
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
<StatusBar translucent backgroundColor="transparent" barStyle={theme.statusBarStyle} />

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
          {
            paddingTop: getTopPadding(insets.top, true),
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

      <Text style={styles.title}>
        {content.title}
      </Text>

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

      <Text style={styles.intro}>
        {content.intro}
      </Text>

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

      <Text style={styles.h2}>
        1. {content.topics[0]}
      </Text>

      <Text style={styles.body}>
        {content.section1Body1}
      </Text>

      <Text style={styles.body}>
        {content.section1Body2}
      </Text>

      <Text style={styles.body}>
        {content.section1Body3}
      </Text>

      <View style={styles.tip}>
        <MaterialDesignIcons
          name="lightbulb-outline"
          size={24}
          color={theme.colors.primary}
        />

        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>{content.tip1Title}</Text>

          <Text style={styles.tipText}>
            {content.tip1Text}
          </Text>
        </View>
      </View>

      <Text style={styles.h2}>2. {content.topics[1]}</Text>

      <Text style={styles.body}>
        {content.section2Body1}
      </Text>

      <Text style={styles.body}>
        {content.section2Body2}
      </Text>

      <View style={styles.infoCard}>
        <MaterialDesignIcons
          name="information-outline"
          size={23}
          color={theme.colors.primary}
        />

        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>{content.infoTitle}</Text>

          <Text style={styles.tipText}>
            {content.infoText}
          </Text>
        </View>
      </View>

      <Text style={styles.h2}>
        3. {content.topics[2]}
      </Text>

      <Text style={styles.body}>
        {content.section3Body1}
      </Text>

      <View style={styles.checkList}>
        {content.ovulationSigns.map(item => (
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

      <Text style={styles.body}>
        {content.section3Body2}
      </Text>

      <View style={styles.alert}>
        <MaterialDesignIcons
          name="alert-outline"
          size={24}
          color={theme.colors.warning}
        />

        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>{content.alert1Title}</Text>

          <Text style={styles.tipText}>
            {content.alert1Text}
          </Text>
        </View>
      </View>

      <Text style={styles.h2}>4. {content.topics[3]}</Text>

      <Text style={styles.body}>
        {content.section4Body1}
      </Text>

      <Text style={styles.body}>
        {content.section4Body2}
      </Text>

      <View style={styles.checkList}>
        {content.fertilityPoints.map(item => (
          <View key={item} style={styles.checkRow}>
            <MaterialDesignIcons
              name="heart-pulse"
              size={18}
              color={theme.colors.primary}
            />

            <Text style={styles.checkText}>{item}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.body}>
        {content.section4Body3}
      </Text>

      <Text style={styles.h2}>
        5. {content.topics[4]}
      </Text>

      <Text style={styles.body}>
        {content.section5Body1}
      </Text>

      <Text style={styles.body}>
        {content.section5Body2}
      </Text>

      <View style={styles.tip}>
        <MaterialDesignIcons
          name="calendar-clock"
          size={24}
          color={theme.colors.primary}
        />

        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>{content.tip2Title}</Text>

          <Text style={styles.tipText}>
            {content.tip2Text}
          </Text>
        </View>
      </View>

      <Text style={styles.h2}>6. {content.topics[5]}</Text>

      <Text style={styles.body}>
        {content.section6Body1}
      </Text>

      <View style={styles.checkList}>
        {content.trackingTips.map(item => (
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

      <Text style={styles.body}>
        {content.section6Body2}
      </Text>

      <Text style={styles.h2}>
        7. {content.topics[6]}
      </Text>

      <Text style={styles.body}>
        {content.section7Body1}
      </Text>

      <Text style={styles.body}>
        {content.section7Body2}
      </Text>

      <View style={styles.alert}>
        <MaterialDesignIcons
          name="doctor"
          size={24}
          color={theme.colors.warning}
        />

        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>{content.alert2Title}</Text>

          <Text style={styles.tipText}>
            {content.alert2Text}
          </Text>
        </View>
      </View>

      <Text style={styles.h2}>8. {content.topics[7]}</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <MaterialDesignIcons
            name="bookmark-check-outline"
            size={23}
            color={theme.colors.primary}
          />

          <Text style={styles.summaryTitle}>{content.summaryTitle}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryNumber}>01</Text>

          <Text style={styles.summaryText}>
            {content.summaryRows[0]}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryNumber}>02</Text>

          <Text style={styles.summaryText}>
            {content.summaryRows[1]}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryNumber}>03</Text>

          <Text style={styles.summaryText}>
            {content.summaryRows[2]}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryNumber}>04</Text>

          <Text style={styles.summaryText}>
            {content.summaryRows[3]}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryNumber}>05</Text>

          <Text style={styles.summaryText}>
            {content.summaryRows[4]}
          </Text>
        </View>
      </View>

      <View style={styles.tip}>
        <MaterialDesignIcons
          name="lightbulb-outline"
          size={24}
          color={theme.colors.primary}
        />

        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>{content.finalTipTitle}</Text>

          <Text style={styles.tipText}>
            {content.finalTipText}
          </Text>
        </View>
      </View>

      <Text style={styles.disclaimer}>
        {content.disclaimer}
      </Text>
    </View>
  </ScrollView>

  <ReadingControls
    articleId={ID}
    durationMinutes={8}
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
marginTop: 24,
fontFamily: 'serif',
fontSize: 21,
lineHeight: 27,
color: theme.colors.text,
fontWeight: '700',
},

body: {
marginTop: 9,
fontSize: 14,
lineHeight: 22,
color: theme.colors.textSecondary,
},

checkList: {
marginTop: 13,
padding: 13,
borderRadius: 12,
backgroundColor: theme.colors.surfaceSecondary,
},

checkRow: {
flexDirection: 'row',
alignItems: 'flex-start',
gap: 8,
marginBottom: 11,
},

checkText: {
flex: 1,
color: theme.colors.textSecondary,
fontSize: 12.5,
lineHeight: 18,
},

alert: {
marginTop: 14,
padding: 14,
flexDirection: 'row',
alignItems: 'flex-start',
borderRadius: 12,
backgroundColor: withAlpha(theme.colors.warning, 0.12),
},

infoCard: {
marginTop: 14,
padding: 14,
flexDirection: 'row',
alignItems: 'flex-start',
borderRadius: 12,
backgroundColor: withAlpha(theme.colors.primary, 0.08),
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
padding: 15,
borderRadius: 14,
backgroundColor: theme.colors.surfaceSecondary,
borderWidth: 1,
borderColor: theme.colors.border,
},

summaryHeader: {
flexDirection: 'row',
alignItems: 'center',
gap: 9,
marginBottom: 12,
},

summaryTitle: {
fontSize: 14,
color: theme.colors.text,
fontWeight: '800',
},

summaryRow: {
flexDirection: 'row',
alignItems: 'flex-start',
marginTop: 10,
},

summaryNumber: {
width: 31,
fontSize: 10,
color: theme.colors.primary,
fontWeight: '800',
marginTop: 2,
},

summaryText: {
flex: 1,
fontSize: 12.5,
lineHeight: 18,
color: theme.colors.textSecondary,
},

disclaimer: {
marginTop: 22,
paddingHorizontal: 4,
fontSize: 10.5,
lineHeight: 16,
textAlign: 'center',
color: theme.colors.textMuted,
},
});
}
