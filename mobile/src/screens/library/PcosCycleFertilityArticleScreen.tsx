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
  tr: {
    badge: 'PKOS',
    title: 'PKOS’ta döngü, yumurtlama\nve doğurganlık',
    metaDuration: '8 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Orta düzey',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'PKOS’ta döngün uzun, düzensiz ve bazen tahmin etmesi zor hale gelebilir. Yumurtlama çevresinde neler olduğunu anlamak, döngüne anlam vermene ve doğurganlıkla ilgili soruları daha iyi kavramana yardımcı olabilir.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Döngü neden düzensizleşir?',
      'Yumurtlama çevresinde neler olur?',
      'Yumurtlamayı nasıl fark edebilirsin?',
      'PKOS ve doğurganlık',
      'Uygulamalar neden daha az doğru olabilir?',
      'PKOS’ta döngünü takip etmek',
      'Hamile kalmak istiyorsan doktora ne zaman başvurmalı?',
      'Akılda tutulacaklar',
    ],
    section1Body1: 'Adet döngüsü, koordineli bir hormonal sinyal dizisine bağlıdır. PKOS’ta bu düzen, özellikle folikül gelişimi ve yumurtlamada bozulabilir.',
    section1Body2: 'Yumurtalıklarda, baskın bir folikülün düzenli olarak olgunlaşmadığı, gelişmeye başlayan çok sayıda küçük folikül bulunabilir. Yumurtlama o zaman gecikebilir, öngörülemez biçimde gerçekleşebilir ya da bazı döngülerde hiç olmayabilir.',
    section1Body3: 'PKOS’lu bazı kişilerin döngülerinin 35, 45 ya da bazen daha fazla gün sürmesinin nedenlerinden biri budur; diğerlerinin döngüleri ise tipik bir süreye daha yakın olabilir.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Döngü uzunluğu tek başına yumurtlamanın gerçekleşip gerçekleşmediğini söylemez. Aynı uzunluktaki iki döngünün hormonal öyküsü farklı olabilir.',
    section2Body1: 'Yumurtlama, bir yumurtalıktan yumurta hücresinin salınmasıdır. Folikülün olgunlaşma evresini izler ve döngünün luteal evresinden önce gelir.',
    section2Body2: 'Düzenli bir döngüde yumurtlama çoğu zaman döngünün ortasına yakındır. Ancak PKOS’ta bu basit kural her zaman geçerli olmaz. Yumurtlama çok daha geç olabilir ya da belirli bir döngüde hiç gerçekleşmeyebilir.',
    infoTitle: 'Bu neden önemli?',
    infoText: 'Yumurtlama öngörülemez olduğunda, doğurganlık dönemini yalnızca adet tarihlerine bakarak tahmin etmek zorlaşır.',
    section3Body1: 'Yumurtlama çevresindeki hormonal değişikliklere eşlik edebilen çeşitli fiziksel işaretler vardır. Kendi döngünü gözlemlemek için faydalı olabilirler, ancak hiçbir işaret tek başına yumurtlamayı kesin olarak doğrulayamaz.',
    ovulationSigns: [
      'Servikal mukusta, daha bol, berrak ve esnek hale gelebilen bir değişiklik',
      'Bazı kadınlarda hafif pelvik ağrı veya rahatsızlık',
      'Yumurtlamadan sonra vücut sıcaklığında bir değişiklik',
      'Vajinal ıslaklıkta bir değişiklik',
      'Bazı kadınlarda libidoda olası bir artış',
    ],
    section3Body2: 'Servikal mukusu gözlemlemek özellikle değerlidir. Doğurganlık dönemi yaklaştıkça daha bol, berrak, kaygan ve esnek hale gelebilir. Ancak görünümü kişiden kişiye ve döngüden döngüye değişebilir.',
    alert1Title: 'Tahminlere karşı dikkatli ol',
    alert1Text: 'Çok düzensiz döngülerde, önceki döngülerden otomatik olarak hesaplanan bir yumurtlama tarihi çok yaklaşık olabilir. Bir tahmin, yumurtlamanın tıbbi olarak doğrulanması değildir.',
    section4Body1: 'PKOS, özellikle yumurtlama seyrek veya tahmin edilmesi zor olduğunda gebe kalmayı zorlaştırabilir. Ancak PKOS’un olması kısır olmak anlamına gelmez.',
    section4Body2: 'PKOS’lu bazı kadınlar düzenli yumurtlar ve özel bir zorluk yaşamadan gebe kalır. Diğerlerinde ise yumurtlama bir değerlendirmeyi ve gerekirse tıbbi bakımı gerektirecek kadar düzensizdir.',
    fertilityPoints: [
      'PKOS kendiliğinden kısırlığa neden olmaz',
      'Asıl zorluk çoğu zaman düzensiz veya öngörülemez yumurtlamadır',
      'Döngüler çok uzun olsa bile yumurtlama gerçekleşebilir',
      'Uygun bakım gebe kalma şansını artırabilir',
      'Doğurganlık süreci her bireye ve birçok başka etkene bağlıdır',
    ],
    section4Body3: 'Doğurganlık da tek başına yumurtlamaya bağlı değildir. Yaş, eşin sperm kalitesi, fallop tüplerinin durumu, endometriyum ve diğer etkenler de rol oynayabilir. Bu nedenle gebelik beklenenden uzun sürdüğünde kapsamlı bir değerlendirme önemlidir.',
    section5Body1: 'Adet takip uygulamaları genellikle tahmin üretmek için önceki döngülerin verilerini kullanır. Döngüler nispeten düzenli olduğunda bu tahminler bir referans olarak faydalı olabilir.',
    section5Body2: 'Ancak PKOS’ta döngü değişkenliği bu hesaplamaları daha az güvenilir kılabilir. Bir uygulama, kuramsal bir tarihe ulaşıldı diye yumurtlamanın gerçekleştiğini kesin olarak bilemez.',
    tip2Title: 'Bir referans noktası olarak kullan',
    tip2Text: 'Dijital takip, kendi döngündeki eğilimleri gözlemlemek ve sağlık profesyonelinle paylaşabileceğin bir geçmiş tutmak için en faydalısıdır.',
    section6Body1: 'Düzenli takip, kişisel değişkenliklerini daha iyi anlamana yardımcı olabilir. Amaç döngüyü mükemmel biçimde öngörülebilir kılmak değil, eğilimleri belirlemeye yetecek kadar bilgi toplamaktır.',
    trackingTips: [
      'Döngüler çok aralıklı olsa bile her döngünün ilk gününün tarihini not et',
      'Döngü boyunca servikal mukustaki değişiklikleri gözlemle',
      'Pelvik ağrıyı veya yumurtlamaya eşlik edebilecek diğer işaretleri not et',
      'Yumurtlamayı tahmin etmek için yalnızca ortalama 28 günlük süreye güvenmekten kaçın',
      'Ovülasyon testlerini dikkatle kullan ve gerekirse bir profesyonelden tavsiye iste',
      'Hamile kalmak istiyorsan topladığın bilgileri bir sağlık profesyonelle paylaş',
    ],
    section6Body2: 'İlişkili belirtileri not etmek de faydalı olabilir: ağrı, akne, mukus değişiklikleri, olağandışı kanama, ruh hali, uyku veya diğer kişisel gözlemler. Bu bilgiler döngünün daha eksiksiz bir resmini oluşturmaya yardımcı olabilir.',
    section7Body1: 'Döngüler çok düzensiz ya da çok aralıklı olduğunda veya adet uzun süre görülmediğinde, hamile kalmaya çalışmaya başlamadan önce bile bir muayene faydalı olabilir.',
    section7Body2: 'Bir sağlık profesyoneli düzensizliklerin nedenlerini araştırabilir, yumurtlamayı değerlendirebilir ve gerekirse gebelik planlarına uygun bir yaklaşım önerebilir.',
    alert2Title: 'Ne zaman tavsiye almalı?',
    alert2Text: 'Adetlerin çok aralıklıysa, birkaç aydır adet görmediysen ya da düzenli cinsel ilişkiye rağmen gebelik oluşmuyorsa bir sağlık profesyonelle konuş.',
    summaryTitle: 'Önemli noktalar',
    summaryRows: [
      'PKOS döngüleri uzun ve öngörülemez hale getirebilir.',
      'Yumurtlama bazı döngülerde düzensiz olabilir ya da hiç olmayabilir.',
      'Düzensiz bir döngü kendiliğinden doğurganlık eksikliği anlamına gelmez.',
      'Yalnızca takvime dayalı tahminler PKOS’ta daha az güvenilir olabilir.',
      'Döngünü gözlemlemek ve bir geçmiş tutmak, özellikle bir muayene için faydalı olabilir.',
    ],
    finalTipTitle: 'Son bir söz',
    finalTipText: 'PKOS her kadında aynı şekilde ortaya çıkmaz. Döngün zamanla değişebilir. Takip, vücudunun nasıl çalıştığını daha iyi anlamana yardımcı olmak içindir; tıbbi tavsiyenin yerini almak için değil.',
    disclaimer: 'Bu makale yalnızca bilgilendirme ve eğitim amaçlıdır. Tıbbi bir tanı oluşturmaz ve bir sağlık profesyoneliyle yapılacak muayenenin yerini tutmaz.',
    shareMessage: 'PKOS’ta döngü, yumurtlama ve doğurganlık — AWA',
  },
  ru: {
    badge: 'СПКЯ',
    title: 'Цикл, овуляция\nи фертильность при СПКЯ',
    metaDuration: '8 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Средний уровень',
    metaValidated: 'Проверенный материал',
    intro: 'При СПКЯ (синдроме поликистозных яичников) цикл может становиться длинным, нерегулярным и порой трудно предсказуемым. Понимание того, что происходит вокруг овуляции, поможет лучше разобраться в вашем цикле и в вопросах, связанных с фертильностью.',
    contentsTitle: 'В этой статье',
    topics: [
      'Почему цикл становится нерегулярным',
      'Что происходит вокруг овуляции',
      'Как распознать овуляцию',
      'СПКЯ и фертильность',
      'Почему приложения могут быть менее точными',
      'Как отслеживать цикл при СПКЯ',
      'Когда обратиться к врачу, если вы хотите забеременеть',
      'Главное',
    ],
    section1Body1: 'Менструальный цикл зависит от согласованной последовательности гормональных сигналов. При СПКЯ эта организация может нарушаться, в частности в развитии фолликулов и овуляции.',
    section1Body2: 'В яичниках может находиться множество мелких фолликулов, которые начинают развиваться, но доминантный фолликул регулярно не достигает зрелости. Тогда овуляция может задерживаться, наступать непредсказуемо или вовсе не происходить в некоторых циклах.',
    section1Body3: 'Это одна из причин, по которой у некоторых женщин с СПКЯ цикл длится 35, 45 или иногда больше дней, тогда как у других он может быть ближе к обычной продолжительности.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Одна лишь продолжительность цикла не показывает, была ли овуляция. У двух циклов одинаковой длины может быть разная гормональная картина.',
    section2Body1: 'Овуляция — это выход яйцеклетки из яичника. Ей предшествует фаза созревания фолликула, а за ней следует лютеиновая фаза цикла.',
    section2Body2: 'При регулярном цикле овуляция часто приходится примерно на его середину. Но при СПКЯ это простое правило работает не всегда. Овуляция может наступать гораздо позже или вовсе не происходить в конкретном цикле.',
    infoTitle: 'Почему это важно',
    infoText: 'Когда овуляция непредсказуема, по датам месячных одним только сложнее определить фертильное окно.',
    section3Body1: 'Есть несколько физических признаков, которые могут сопровождать гормональные изменения вокруг овуляции. Они могут быть полезны для наблюдения за вашим собственным циклом, но ни один отдельный признак не позволяет подтвердить овуляцию с уверенностью.',
    ovulationSigns: [
      'Изменение цервикальной слизи: она может стать более обильной, прозрачной и тягучей',
      'Лёгкая боль или дискомфорт в области таза у некоторых женщин',
      'Изменение базальной температуры тела после овуляции',
      'Изменение влажности во влагалище',
      'Возможное повышение либидо у некоторых женщин',
    ],
    section3Body2: 'За цервикальной слизью особенно полезно наблюдать. По мере приближения фертильного окна она может становиться более обильной, прозрачной, скользкой и тягучей. Однако её вид может отличаться у разных женщин и от цикла к циклу.',
    alert1Title: 'Осторожнее с прогнозами',
    alert1Text: 'При очень нерегулярных циклах дата овуляции, автоматически рассчитанная по предыдущим циклам, может быть очень приблизительной. Прогноз не является медицинским подтверждением овуляции.',
    section4Body1: 'СПКЯ может затруднять зачатие, главным образом когда овуляция происходит редко или трудно предсказуема. Однако наличие СПКЯ не означает бесплодие.',
    section4Body2: 'У некоторых женщин с СПКЯ овуляция происходит регулярно, и они беременеют без особых трудностей. У других овуляция настолько нерегулярна, что требуется обследование и, возможно, медицинская помощь.',
    fertilityPoints: [
      'СПКЯ автоматически не приводит к бесплодию',
      'Основная трудность — часто нерегулярная или непредсказуемая овуляция',
      'Овуляция может происходить даже при очень длинных циклах',
      'Подходящая медицинская помощь может повысить шансы на зачатие',
      'Путь к беременности зависит от каждой женщины и от многих других факторов',
    ],
    section4Body3: 'Фертильность не зависит и только от овуляции. Свою роль могут играть также возраст, качество спермы партнёра, состояние маточных труб, эндометрий и другие факторы. Поэтому комплексное обследование важно, если беременность наступает дольше, чем ожидалось.',
    section5Body1: 'Приложения для отслеживания месячных, как правило, используют данные предыдущих циклов для расчёта оценок. Когда циклы относительно регулярны, такие оценки могут быть полезным ориентиром.',
    section5Body2: 'Однако при СПКЯ изменчивость цикла может делать эти расчёты менее надёжными. Приложение не может точно знать, что овуляция произошла, лишь потому, что наступила теоретическая дата.',
    tip2Title: 'Используйте как ориентир',
    tip2Text: 'Цифровое отслеживание полезнее всего для наблюдения за тенденциями в вашем собственном цикле и ведения истории, которой можно поделиться с врачом.',
    section6Body1: 'Регулярное отслеживание помогает лучше понять ваши личные особенности. Цель не в том, чтобы сделать цикл идеально предсказуемым, а в том, чтобы собрать достаточно сведений для выявления закономерностей.',
    trackingTips: [
      'Отмечайте дату первого дня каждого цикла, даже когда циклы очень длинные',
      'Наблюдайте за изменениями цервикальной слизи на протяжении цикла',
      'Отмечайте боль в области таза и другие признаки, которые могут сопровождать овуляцию',
      'Не полагайтесь только на среднюю продолжительность цикла в 28 дней, чтобы предсказать овуляцию',
      'Используйте тесты на овуляцию с осторожностью и при необходимости обратитесь за советом к специалисту',
      'Поделитесь собранной информацией с медицинским специалистом, если вы хотите забеременеть',
    ],
    section6Body2: 'Полезно также отмечать сопутствующие симптомы: боль, акне, изменения слизи, необычные кровотечения, настроение, сон и другие личные наблюдения. Эти сведения помогают составить более полную картину вашего цикла.',
    section7Body1: 'Консультация может быть полезна ещё до того, как вы начнёте планировать беременность, если циклы очень нерегулярны, очень длинные или месячные долго отсутствуют.',
    section7Body2: 'Медицинский специалист может выяснить причины нерегулярности, оценить овуляцию и при необходимости предложить стратегию, подходящую для ваших планов на беременность.',
    alert2Title: 'Когда обратиться за советом',
    alert2Text: 'Если месячные приходят очень редко, если их не было несколько месяцев или если беременность не наступает при регулярных половых контактах, поговорите с медицинским специалистом.',
    summaryTitle: 'Главное',
    summaryRows: [
      'СПКЯ может делать циклы длинными и непредсказуемыми.',
      'Овуляция может быть нерегулярной или отсутствовать в некоторых циклах.',
      'Нерегулярный цикл автоматически не означает отсутствие фертильности.',
      'Прогнозы, основанные только на календаре, при СПКЯ могут быть менее надёжными.',
      'Наблюдение за циклом и ведение истории могут быть полезны, особенно для консультации.',
    ],
    finalTipTitle: 'Напоследок',
    finalTipText: 'СПКЯ проявляется у каждой женщины по-разному. Ваш цикл может меняться со временем. Отслеживание нужно, чтобы лучше понимать, как работает ваш организм, а не чтобы заменять медицинскую консультацию.',
    disclaimer: 'Эта статья носит исключительно информационный и образовательный характер. Она не является медицинским диагнозом и не заменяет консультацию медицинского специалиста.',
    shareMessage: 'Цикл, овуляция и фертильность при СПКЯ — AWA',
  },
  de: {
    badge: 'PCOS',
    title: 'Zyklus, Eisprung\nund Fruchtbarkeit bei PCOS',
    metaDuration: '8 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Fortgeschritten',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Bei PCOS kann dein Zyklus lang, unregelmäßig und manchmal schwer vorhersehbar werden. Wenn du verstehst, was rund um den Eisprung passiert, kannst du deinen Zyklus besser einordnen und Fragen zur Fruchtbarkeit leichter nachvollziehen.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Warum der Zyklus unregelmäßig wird',
      'Was rund um den Eisprung passiert',
      'Wie du den Eisprung erkennst',
      'PCOS und Fruchtbarkeit',
      'Warum Apps weniger genau sein können',
      'Deinen Zyklus bei PCOS verfolgen',
      'Wann du bei Kinderwunsch zur Ärztin oder zum Arzt gehen solltest',
      'Das Wichtigste in Kürze',
    ],
    section1Body1: 'Der Menstruationszyklus beruht auf einer abgestimmten Abfolge hormoneller Signale. Bei PCOS kann dieses Zusammenspiel gestört sein, vor allem bei der Reifung der Follikel und beim Eisprung.',
    section1Body2: 'In den Eierstöcken können viele kleine Follikel heranwachsen, ohne dass regelmäßig ein dominanter Follikel die Reife erreicht. Der Eisprung kann sich dann verzögern, unvorhersehbar eintreten oder in einzelnen Zyklen ganz ausbleiben.',
    section1Body3: 'Das ist einer der Gründe, warum manche Frauen mit PCOS Zyklen von 35, 45 oder manchmal noch mehr Tagen haben, während andere Zyklen haben, die einer typischen Länge näher kommen.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Die Zykluslänge allein sagt dir nicht, ob ein Eisprung stattgefunden hat. Zwei gleich lange Zyklen können hormonell ganz unterschiedlich verlaufen.',
    section2Body1: 'Beim Eisprung wird eine Eizelle aus einem Eierstock freigesetzt. Er folgt auf die Reifungsphase der Follikel und geht der Lutealphase des Zyklus voraus.',
    section2Body2: 'In einem regelmäßigen Zyklus liegt der Eisprung oft etwa in der Mitte. Bei PCOS gilt diese einfache Regel jedoch nicht immer. Der Eisprung kann deutlich später stattfinden oder in einem Zyklus ganz ausbleiben.',
    infoTitle: 'Warum das wichtig ist',
    infoText: 'Wenn der Eisprung nicht vorhersehbar ist, lässt sich das fruchtbare Fenster allein anhand der Periodendaten schwerer abschätzen.',
    section3Body1: 'Mehrere körperliche Anzeichen können die hormonellen Veränderungen rund um den Eisprung begleiten. Sie können hilfreich sein, um deinen eigenen Zyklus zu beobachten, doch kein einzelnes Anzeichen kann den Eisprung mit Sicherheit bestätigen.',
    ovulationSigns: [
      'Eine Veränderung des Zervixschleims, der reichlicher, klarer und fadenziehend werden kann',
      'Leichte Unterleibsschmerzen oder Unwohlsein bei manchen Frauen',
      'Eine Veränderung der Körpertemperatur nach dem Eisprung',
      'Eine Veränderung der vaginalen Feuchtigkeit',
      'Eine mögliche Zunahme der Libido bei manchen Frauen',
    ],
    section3Body2: 'Der Zervixschleim ist besonders beobachtenswert. Wenn sich das fruchtbare Fenster nähert, kann er reichlicher, klarer, glitschig und fadenziehend werden. Sein Aussehen kann jedoch von Frau zu Frau und von Zyklus zu Zyklus unterschiedlich sein.',
    alert1Title: 'Vorsicht bei Vorhersagen',
    alert1Text: 'Bei sehr unregelmäßigen Zyklen kann ein Eisprungtermin, der automatisch aus früheren Zyklen berechnet wird, sehr ungenau sein. Eine Vorhersage ist keine ärztliche Bestätigung des Eisprungs.',
    section4Body1: 'PCOS kann eine Schwangerschaft erschweren, vor allem wenn der Eisprung selten oder schwer vorhersehbar ist. PCOS zu haben bedeutet jedoch nicht, unfruchtbar zu sein.',
    section4Body2: 'Manche Frauen mit PCOS haben regelmäßig einen Eisprung und werden ohne besondere Schwierigkeiten schwanger. Bei anderen ist der Eisprung so unregelmäßig, dass eine Abklärung und gegebenenfalls ärztliche Begleitung sinnvoll sind.',
    fertilityPoints: [
      'PCOS führt nicht automatisch zu Unfruchtbarkeit',
      'Die Hauptschwierigkeit ist oft ein unregelmäßiger oder unvorhersehbarer Eisprung',
      'Ein Eisprung kann auch bei sehr langen Zyklen stattfinden',
      'Eine passende Betreuung kann die Chancen auf eine Schwangerschaft verbessern',
      'Der Weg zur Schwangerschaft hängt von jeder einzelnen Frau und vielen weiteren Faktoren ab',
    ],
    section4Body3: 'Auch die Fruchtbarkeit hängt nicht allein vom Eisprung ab. Alter, Spermienqualität des Partners, der Zustand der Eileiter, die Gebärmutterschleimhaut und weitere Faktoren können ebenfalls eine Rolle spielen. Deshalb ist eine umfassende Abklärung wichtig, wenn es länger als erwartet dauert, schwanger zu werden.',
    section5Body1: 'Apps zur Periodenverfolgung nutzen in der Regel Daten aus früheren Zyklen, um Schätzungen zu erstellen. Wenn die Zyklen relativ regelmäßig sind, können diese Schätzungen als Orientierung nützlich sein.',
    section5Body2: 'Bei PCOS kann die Schwankungsbreite des Zyklus diese Berechnungen jedoch weniger verlässlich machen. Eine App kann nicht sicher wissen, dass ein Eisprung stattgefunden hat, nur weil ein theoretisches Datum erreicht ist.',
    tip2Title: 'Als Orientierung nutzen',
    tip2Text: 'Das digitale Tracking ist am hilfreichsten, um Tendenzen in deinem eigenen Zyklus zu erkennen und eine Übersicht zu führen, die du mit deiner Ärztin oder deinem Arzt teilen kannst.',
    section6Body1: 'Regelmäßiges Tracking kann dir helfen, deine persönlichen Schwankungen besser zu verstehen. Es geht nicht darum, den Zyklus perfekt vorhersehbar zu machen, sondern genügend Informationen zu sammeln, um Tendenzen zu erkennen.',
    trackingTips: [
      'Notiere das Datum des ersten Tages jedes Zyklus, auch wenn die Zyklen sehr weit auseinanderliegen',
      'Beobachte die Veränderungen des Zervixschleims im Verlauf des Zyklus',
      'Notiere Unterleibsschmerzen oder andere Anzeichen, die den Eisprung begleiten können',
      'Verlasse dich nicht allein auf einen durchschnittlichen 28-Tage-Zyklus, um den Eisprung vorherzusagen',
      'Verwende Ovulationstests mit Vorsicht und lass dich bei Bedarf von Fachpersonal beraten',
      'Teile die gesammelten Informationen mit medizinischem Fachpersonal, wenn du schwanger werden möchtest',
    ],
    section6Body2: 'Es kann auch helfen, begleitende Symptome zu notieren: Schmerzen, Akne, Veränderungen des Schleims, ungewöhnliche Blutungen, Stimmung, Schlaf oder andere persönliche Beobachtungen. Diese Angaben können helfen, ein vollständigeres Bild deines Zyklus zu zeichnen.',
    section7Body1: 'Ein Beratungstermin kann sinnvoll sein, noch bevor du versuchst, schwanger zu werden – etwa wenn deine Zyklen sehr unregelmäßig oder sehr lang sind oder wenn deine Periode über längere Zeit ausbleibt.',
    section7Body2: 'Medizinisches Fachpersonal kann die Ursachen der Unregelmäßigkeiten abklären, den Eisprung beurteilen und bei Bedarf eine Strategie vorschlagen, die zu deinem Kinderwunsch passt.',
    alert2Title: 'Wann du dir Rat holen solltest',
    alert2Text: 'Wenn deine Periode sehr selten kommt, wenn du seit mehreren Monaten keine Periode hattest oder wenn trotz regelmäßigem Geschlechtsverkehr keine Schwangerschaft eintritt, sprich mit medizinischem Fachpersonal.',
    summaryTitle: 'Das Wichtigste',
    summaryRows: [
      'PCOS kann Zyklen lang und unvorhersehbar machen.',
      'Der Eisprung kann in manchen Zyklen unregelmäßig sein oder ausbleiben.',
      'Ein unregelmäßiger Zyklus bedeutet nicht automatisch fehlende Fruchtbarkeit.',
      'Vorhersagen, die sich nur auf den Kalender stützen, können bei PCOS weniger verlässlich sein.',
      'Deinen Zyklus zu beobachten und eine Übersicht zu führen, kann hilfreich sein, besonders für einen Arzttermin.',
    ],
    finalTipTitle: 'Ein letztes Wort',
    finalTipText: 'PCOS zeigt sich nicht bei jeder Frau gleich. Dein Zyklus kann sich im Laufe der Zeit verändern. Das Tracking soll dir helfen, besser zu verstehen, wie dein Körper funktioniert – es ersetzt keine ärztliche Beratung.',
    disclaimer: 'Dieser Artikel dient ausschließlich Informations- und Bildungszwecken. Er stellt keine ärztliche Diagnose dar und ersetzt keine Beratung durch medizinisches Fachpersonal.',
    shareMessage: 'Zyklus, Eisprung und Fruchtbarkeit bei PCOS — AWA',
  },
  zh: {
      badge: 'PCOS',
      title: 'PCOS 中的周期、\n排卵与生育力',
      metaDuration: '阅读约 8 分钟',
      metaType: '指南',
      metaLevel: '进阶',
      metaValidated: '已审核内容',
      intro: '有 PCOS 时，月经周期可能变得很长、不规律，有时还很难预测。了解排卵前后发生了什么，可以帮助你读懂自己的周期，也更好地理解与生育力有关的问题。',
      contentsTitle: '本文内容',
      topics: [
        '周期为什么会变得不规律',
        '排卵前后发生了什么',
        '如何识别排卵',
        'PCOS 与生育力',
        '为什么应用的预测可能不够准确',
        '有 PCOS 时如何记录周期',
        '想怀孕时，什么时候该看医生',
        '要点回顾',
      ],
      section1Body1: '月经周期依赖一系列相互配合的激素信号。有 PCOS 时，这种协调可能被打乱，尤其是卵泡的发育和排卵。',
      section1Body2: '卵巢中可能有很多小卵泡开始发育，却没有一个优势卵泡能按时成熟。于是排卵可能被推迟、难以预料，或者在某些周期里根本不发生。',
      section1Body3: '这也是为什么有些 PCOS 女性的周期长达 35 天、45 天，有时甚至更长，而另一些人的周期则接近常见的长度。',
      tip1Title: '小贴士',
      tip1Text: '仅凭周期长短，无法判断是否排过卵。两个长度相同的周期，背后的激素情况可能完全不同。',
      section2Body1: '排卵是指卵子从卵巢中排出。它发生在卵泡成熟阶段之后、黄体期之前。',
      section2Body2: '在规律的周期里，排卵通常在周期中间前后。但有 PCOS 时，这条简单的规律不一定适用。排卵可能晚得多，也可能在某个周期里根本没有发生。',
      infoTitle: '为什么这很重要',
      infoText: '当排卵难以预料时，仅凭月经日期来估算易孕期就会变得更困难。',
      section3Body1: '排卵前后的激素变化，可能伴随一些身体上的表现。它们有助于观察自己的周期，但没有任何单一表现能确切证明已经排卵。',
      ovulationSigns: [
        '宫颈黏液发生变化，可能变得更多、更清亮、更有拉丝感',
        '部分女性会有轻微的盆腔疼痛或不适',
        '排卵后体温发生变化',
        '阴道的湿润感发生变化',
        '部分女性的性欲可能有所增强',
      ],
      section3Body2: '宫颈黏液尤其值得观察。接近易孕期时，它可能变得更多、更清亮、更滑、更有拉丝感。不过，它的样子因人而异，不同周期之间也会有差别。',
      alert1Title: '对预测要谨慎看待',
      alert1Text: '周期非常不规律时，根据以往周期自动推算出的排卵日可能非常不准确。预测并不等于医学上对排卵的确认。',
      section4Body1: 'PCOS 可能让受孕更困难，主要是在排卵不频繁或难以预测的时候。不过，有 PCOS 并不意味着不孕。',
      section4Body2: '有些 PCOS 女性排卵规律，受孕也没有特别的困难。对另一些人来说，排卵不规律到需要做评估，甚至接受医疗帮助。',
      fertilityPoints: [
        'PCOS 并不会自动导致不孕',
        '主要的困难往往是排卵不规律或难以预测',
        '即使周期很长，也可能发生排卵',
        '得当的医疗照护可以提高受孕的机会',
        '受孕之路因人而异，还取决于许多其他因素',
      ],
      section4Body3: '生育力也并不只取决于排卵。年龄、伴侣的精子质量、输卵管的状况、子宫内膜以及其他因素也可能起作用。所以，当怀孕花的时间比预期更长时，做一次全面的评估很重要。',
      section5Body1: '月经记录类应用通常根据以往周期的数据来做估算。当周期比较规律时，这些估算可以作为有用的参考。',
      section5Body2: '但有 PCOS 时，周期的波动可能让这些计算变得不太可靠。应用无法仅因为到了理论上的日期，就确定已经排卵。',
      tip2Title: '把它当作参考',
      tip2Text: '数字化记录最有用的地方，是观察自己周期的趋势，并留下一份可以给医疗人员看的历史记录。',
      section6Body1: '规律记录可以帮助你更好地了解自己的个体变化。目的不是让周期变得完全可预测，而是积累足够的信息，找出其中的趋势。',
      trackingTips: [
        '记下每个周期第一天的日期，即使周期间隔很长',
        '观察整个周期中宫颈黏液的变化',
        '记下盆腔疼痛或其他可能伴随排卵的表现',
        '不要只依赖 28 天的平均周期长度来预测排卵',
        '谨慎使用排卵试纸，需要时向专业人员咨询',
        '如果想怀孕，把你记录的信息分享给医疗专业人员',
      ],
      section6Body2: '记下伴随的症状也会有帮助：疼痛、痤疮、黏液的变化、异常出血、情绪、睡眠，或其他个人观察。这些信息有助于更完整地了解你的周期。',
      section7Body1: '当周期非常不规律、间隔很长，或者很长一段时间没有月经时，即使还没开始备孕，去咨询一次也是值得的。',
      section7Body2: '医疗专业人员可以查明周期不规律的原因，评估排卵情况，必要时提出适合你怀孕计划的方案。',
      alert2Title: '什么时候该寻求建议',
      alert2Text: '如果你的月经间隔很长、已经几个月没有来月经，或者规律同房却没有怀孕，请与医疗专业人员聊一聊。',
      summaryTitle: '核心要点',
      summaryRows: [
        'PCOS 可能让周期变长且难以预测。',
        '在某些周期里，排卵可能不规律，甚至没有排卵。',
        '周期不规律，并不一定意味着没有生育力。',
        '有 PCOS 时，仅依据日历做出的预测可能不太可靠。',
        '观察自己的周期并留下历史记录会很有用，尤其是去就诊时。',
      ],
      finalTipTitle: '最后想说的',
      finalTipText: 'PCOS 在每位女性身上的表现并不相同。你的周期也可能随时间变化。记录是为了帮助你更好地了解自己的身体如何运作，而不是替代医疗建议。',
      disclaimer: '本文仅供参考和科普之用，不构成医学诊断，也不能替代与医疗专业人员的咨询。',
      shareMessage: 'PCOS 中的周期、排卵与生育力 — AWA',
    },
  id: {
    badge: 'PCOS',
    title: 'Siklus, ovulasi,\ndan kesuburan pada PCOS',
    metaDuration: '8 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Menengah',
    metaValidated: 'Konten yang telah ditinjau',
    intro: 'Pada PCOS, siklusmu bisa menjadi panjang, tidak teratur, dan terkadang sulit diprediksi. Memahami apa yang terjadi di sekitar ovulasi dapat membantumu mengerti siklusmu dan pertanyaan seputar kesuburan dengan lebih baik.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Mengapa siklus menjadi tidak teratur',
      'Apa yang terjadi di sekitar ovulasi',
      'Cara mengenali ovulasi',
      'PCOS dan kesuburan',
      'Mengapa aplikasi bisa kurang akurat',
      'Memantau siklusmu dengan PCOS',
      'Kapan harus ke dokter jika ingin hamil',
      'Poin-poin penting',
    ],
    section1Body1: 'Siklus menstruasi bergantung pada rangkaian sinyal hormon yang terkoordinasi. Pada PCOS, keteraturan ini dapat terganggu, terutama dalam perkembangan folikel dan ovulasi.',
    section1Body2: 'Ovarium bisa mengandung banyak folikel kecil yang mulai berkembang tanpa ada folikel dominan yang secara teratur mencapai kematangan. Akibatnya, ovulasi dapat tertunda, terjadi tanpa pola yang pasti, atau bahkan tidak terjadi sama sekali pada siklus tertentu.',
    section1Body3: 'Inilah salah satu alasan sebagian orang dengan PCOS memiliki siklus 35, 45, atau terkadang lebih dari itu hari, sementara yang lain mungkin memiliki siklus dengan panjang yang mendekati normal.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Panjang siklus saja tidak menunjukkan apakah ovulasi terjadi. Dua siklus dengan panjang yang sama bisa punya kisah hormonal yang berbeda.',
    section2Body1: 'Ovulasi adalah pelepasan sel telur dari ovarium. Ovulasi terjadi setelah fase pematangan folikel dan sebelum fase luteal dalam siklus.',
    section2Body2: 'Pada siklus yang teratur, ovulasi sering terjadi di sekitar pertengahan siklus. Namun pada PCOS, aturan sederhana ini tidak selalu berlaku. Ovulasi bisa terjadi jauh lebih lambat atau bahkan tidak terjadi sama sekali pada suatu siklus.',
    infoTitle: 'Mengapa ini penting',
    infoText: 'Ketika ovulasi sulit diprediksi, masa subur menjadi lebih sulit diperkirakan hanya berdasarkan tanggal haid.',
    section3Body1: 'Ada beberapa tanda fisik yang dapat menyertai perubahan hormon di sekitar ovulasi. Tanda-tanda ini berguna untuk mengamati siklusmu sendiri, tetapi tidak ada satu tanda pun yang dapat memastikan ovulasi dengan pasti.',
    ovulationSigns: [
      'Perubahan lendir serviks, yang bisa menjadi lebih banyak, bening, dan elastis',
      'Nyeri atau rasa tidak nyaman ringan di panggul pada sebagian wanita',
      'Perubahan suhu tubuh setelah ovulasi',
      'Perubahan kelembapan vagina',
      'Kemungkinan peningkatan gairah seksual pada sebagian wanita',
    ],
    section3Body2: 'Lendir serviks sangat layak diamati. Menjelang masa subur, lendir ini bisa menjadi lebih banyak, bening, licin, dan elastis. Namun, tampilannya bisa berbeda dari satu orang ke orang lain dan dari satu siklus ke siklus lainnya.',
    alert1Title: 'Berhati-hatilah dengan prediksi',
    alert1Text: 'Pada siklus yang sangat tidak teratur, tanggal ovulasi yang dihitung otomatis dari siklus-siklus sebelumnya bisa sangat kasar. Prediksi bukanlah konfirmasi medis bahwa ovulasi telah terjadi.',
    section4Body1: 'PCOS dapat membuat kehamilan lebih sulit terjadi, terutama ketika ovulasi jarang atau sulit diprediksi. Namun, memiliki PCOS bukan berarti tidak subur.',
    section4Body2: 'Sebagian wanita dengan PCOS berovulasi secara teratur dan hamil tanpa kesulitan berarti. Bagi yang lain, ovulasinya cukup tidak teratur sehingga perlu dievaluasi dan mungkin memerlukan penanganan medis.',
    fertilityPoints: [
      'PCOS tidak otomatis menyebabkan ketidaksuburan',
      'Kesulitan utamanya sering kali adalah ovulasi yang tidak teratur atau sulit diprediksi',
      'Ovulasi tetap bisa terjadi meskipun siklus sangat panjang',
      'Penanganan yang tepat dapat meningkatkan peluang kehamilan',
      'Perjalanan kesuburan bergantung pada setiap individu dan banyak faktor lainnya',
    ],
    section4Body3: 'Kesuburan juga tidak hanya bergantung pada ovulasi. Usia, kualitas sperma pasangan, kondisi saluran tuba, endometrium, dan faktor lain juga dapat berperan. Karena itu, evaluasi menyeluruh penting dilakukan ketika kehamilan memerlukan waktu lebih lama dari yang diharapkan.',
    section5Body1: 'Aplikasi pemantau haid umumnya menggunakan data dari siklus-siklus sebelumnya untuk membuat perkiraan. Ketika siklus relatif teratur, perkiraan ini bisa berguna sebagai acuan.',
    section5Body2: 'Namun pada PCOS, variasi siklus dapat membuat perhitungan ini kurang andal. Sebuah aplikasi tidak bisa memastikan bahwa ovulasi telah terjadi hanya karena tanggal teoretisnya sudah tiba.',
    tip2Title: 'Gunakan sebagai titik acuan',
    tip2Text: 'Pencatatan digital paling berguna untuk mengamati tren siklusmu sendiri dan menyimpan riwayat yang bisa dibagikan kepada tenaga kesehatan.',
    section6Body1: 'Pemantauan yang rutin dapat membantumu memahami variasi pribadimu dengan lebih baik. Tujuannya bukan membuat siklus dapat diprediksi dengan sempurna, melainkan mengumpulkan cukup informasi untuk mengenali tren.',
    trackingTips: [
      'Catat tanggal hari pertama setiap siklus, bahkan ketika siklus sangat berjarak',
      'Amati perubahan lendir serviks sepanjang siklus',
      'Catat nyeri panggul atau tanda lain yang mungkin menyertai ovulasi',
      'Hindari hanya mengandalkan rata-rata siklus 28 hari untuk memprediksi ovulasi',
      'Gunakan tes ovulasi dengan hati-hati dan, jika perlu, minta saran dari tenaga profesional',
      'Bagikan informasi yang kamu kumpulkan kepada tenaga kesehatan jika kamu ingin hamil',
    ],
    section6Body2: 'Mencatat gejala yang menyertai juga bisa membantu: nyeri, jerawat, perubahan lendir, perdarahan yang tidak biasa, suasana hati, tidur, atau pengamatan pribadi lainnya. Informasi ini dapat membantu membentuk gambaran siklusmu yang lebih lengkap.',
    section7Body1: 'Berkonsultasi bisa bermanfaat bahkan sebelum mulai berusaha hamil, ketika siklus sangat tidak teratur, sangat berjarak, atau ketika haid tidak datang dalam waktu lama.',
    section7Body2: 'Tenaga kesehatan dapat menelusuri penyebab ketidakteraturan, menilai ovulasi, dan jika perlu, menyarankan strategi yang sesuai dengan rencana kehamilanmu.',
    alert2Title: 'Kapan perlu mencari saran',
    alert2Text: 'Jika haidmu sangat berjarak, jika kamu tidak haid selama beberapa bulan, atau jika kehamilan tidak terjadi meskipun berhubungan intim secara teratur, bicarakan dengan tenaga kesehatan.',
    summaryTitle: 'Poin-poin utama',
    summaryRows: [
      'PCOS dapat membuat siklus menjadi panjang dan sulit diprediksi.',
      'Ovulasi bisa tidak teratur atau tidak terjadi pada beberapa siklus.',
      'Siklus yang tidak teratur tidak otomatis berarti kurang subur.',
      'Prediksi yang hanya berdasarkan kalender bisa kurang andal pada PCOS.',
      'Mengamati siklus dan menyimpan riwayat bisa berguna, terutama untuk konsultasi.',
    ],
    finalTipTitle: 'Satu pesan terakhir',
    finalTipText: 'PCOS tidak muncul dengan cara yang sama pada setiap wanita. Siklusmu juga bisa berubah seiring waktu. Pencatatan hadir untuk membantumu lebih memahami cara kerja tubuhmu, bukan untuk menggantikan saran medis.',
    disclaimer: 'Artikel ini hanya untuk tujuan informasi dan edukasi. Artikel ini bukan diagnosis medis dan tidak menggantikan konsultasi dengan tenaga kesehatan.',
    shareMessage: 'Siklus, ovulasi, dan kesuburan pada PCOS — AWA',
  },
  hi: {
    badge: 'PCOS',
    title: 'PCOS में चक्र, ओव्यूलेशन\nऔर प्रजनन क्षमता',
    metaDuration: '8 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षा किया गया कंटेंट',
    intro: 'PCOS में आपका चक्र लंबा, अनियमित और कभी-कभी अनुमान लगाने में मुश्किल हो सकता है। ओव्यूलेशन (अंडोत्सर्ग) के आसपास क्या होता है, यह समझने से आप अपने चक्र को बेहतर समझ सकती हैं और प्रजनन क्षमता से जुड़े सवालों को भी।',
    contentsTitle: 'इस लेख में',
    topics: [
      'चक्र अनियमित क्यों हो जाता है',
      'ओव्यूलेशन के आसपास क्या होता है',
      'ओव्यूलेशन को कैसे पहचानें',
      'PCOS और प्रजनन क्षमता',
      'ऐप कम सटीक क्यों हो सकते हैं',
      'PCOS में अपने चक्र को ट्रैक करना',
      'गर्भधारण करना चाहती हैं तो डॉक्टर से कब मिलें',
      'मुख्य बातें',
    ],
    section1Body1: 'मासिक चक्र हार्मोन के संकेतों के एक तालमेल भरे क्रम पर निर्भर करता है। PCOS में यह व्यवस्था बिगड़ सकती है, खासकर फ़ॉलिकल के विकास और ओव्यूलेशन में।',
    section1Body2: 'अंडाशय में कई छोटे फ़ॉलिकल हो सकते हैं, जो बढ़ना शुरू तो करते हैं, लेकिन कोई मुख्य फ़ॉलिकल नियमित रूप से परिपक्व नहीं हो पाता। तब ओव्यूलेशन देर से हो सकता है, अनिश्चित समय पर हो सकता है, या कुछ चक्रों में हो ही नहीं सकता।',
    section1Body3: 'इसी वजह से PCOS वाली कुछ महिलाओं के चक्र 35, 45 या कभी-कभी उससे भी ज़्यादा दिनों के होते हैं, जबकि कुछ का चक्र सामान्य लंबाई के करीब रहता है।',
    tip1Title: 'जानना अच्छा रहेगा',
    tip1Text: 'सिर्फ़ चक्र की लंबाई से यह पता नहीं चलता कि ओव्यूलेशन हुआ या नहीं। एक ही लंबाई के दो चक्रों में हार्मोन की कहानी अलग हो सकती है।',
    section2Body1: 'ओव्यूलेशन में अंडाशय से एक अंडाणु बाहर निकलता है। यह फ़ॉलिकल के परिपक्व होने के चरण के बाद और चक्र के ल्यूटियल चरण से पहले होता है।',
    section2Body2: 'नियमित चक्र में ओव्यूलेशन अक्सर बीच के आसपास होता है। लेकिन PCOS में यह सीधा नियम हमेशा लागू नहीं होता। ओव्यूलेशन काफ़ी देर से हो सकता है या किसी चक्र में हो ही नहीं सकता।',
    infoTitle: 'यह क्यों मायने रखता है',
    infoText: 'जब ओव्यूलेशन का अनुमान लगाना मुश्किल हो, तो सिर्फ़ पीरियड की तारीख़ों से फ़र्टाइल विंडो का अंदाज़ा लगाना कठिन हो जाता है।',
    section3Body1: 'ओव्यूलेशन के आसपास हार्मोन में होने वाले बदलावों के साथ कई शारीरिक संकेत दिख सकते हैं। ये आपके अपने चक्र को देखने में काम आ सकते हैं, लेकिन कोई एक संकेत पक्के तौर पर ओव्यूलेशन की पुष्टि नहीं कर सकता।',
    ovulationSigns: [
      'सर्वाइकल म्यूकस में बदलाव, जो ज़्यादा मात्रा में, साफ़ और खिंचने वाला हो सकता है',
      'कुछ महिलाओं में पेड़ू में हल्का दर्द या बेचैनी',
      'ओव्यूलेशन के बाद शरीर के तापमान में बदलाव',
      'योनि की नमी में बदलाव',
      'कुछ महिलाओं में यौन इच्छा का संभावित रूप से बढ़ना',
    ],
    section3Body2: 'सर्वाइकल म्यूकस को खास तौर पर देखना फ़ायदेमंद है। फ़र्टाइल विंडो के पास आने पर यह ज़्यादा मात्रा में, साफ़, चिकना और खिंचने वाला हो सकता है। हालाँकि, इसका रूप हर महिला में और हर चक्र में अलग हो सकता है।',
    alert1Title: 'अनुमानों पर सावधानी रखें',
    alert1Text: 'बहुत अनियमित चक्रों में, पिछले चक्रों के आधार पर अपने आप निकाली गई ओव्यूलेशन की तारीख़ काफ़ी मोटा अंदाज़ा हो सकती है। अनुमान ओव्यूलेशन की चिकित्सकीय पुष्टि नहीं है।',
    section4Body1: 'PCOS से गर्भधारण मुश्किल हो सकता है, खासकर जब ओव्यूलेशन कभी-कभार हो या उसका अनुमान लगाना कठिन हो। फिर भी, PCOS होने का मतलब बांझ होना नहीं है।',
    section4Body2: 'PCOS वाली कुछ महिलाओं में ओव्यूलेशन नियमित होता है और वे बिना खास दिक़्क़त के गर्भवती हो जाती हैं। दूसरों में ओव्यूलेशन इतना अनियमित होता है कि जाँच और ज़रूरत पड़ने पर इलाज की ज़रूरत पड़ती है।',
    fertilityPoints: [
      'PCOS अपने आप बांझपन का कारण नहीं बनता',
      'मुख्य कठिनाई अक्सर अनियमित या अनिश्चित ओव्यूलेशन होती है',
      'चक्र बहुत लंबे होने पर भी ओव्यूलेशन हो सकता है',
      'सही देखभाल से गर्भधारण की संभावना बेहतर हो सकती है',
      'प्रजनन क्षमता का सफ़र हर महिला और कई दूसरे कारणों पर निर्भर करता है',
    ],
    section4Body3: 'प्रजनन क्षमता सिर्फ़ ओव्यूलेशन पर भी निर्भर नहीं करती। उम्र, साथी के शुक्राणुओं की गुणवत्ता, फ़ैलोपियन ट्यूब की स्थिति, एंडोमेट्रियम और दूसरे कारण भी भूमिका निभा सकते हैं। इसीलिए जब गर्भधारण में उम्मीद से ज़्यादा समय लगे, तो पूरी जाँच करवाना ज़रूरी है।',
    section5Body1: 'पीरियड ट्रैक करने वाले ऐप आमतौर पर पिछले चक्रों के डेटा से अनुमान निकालते हैं। जब चक्र अपेक्षाकृत नियमित हों, तो ये अनुमान एक संदर्भ के तौर पर काम आ सकते हैं।',
    section5Body2: 'लेकिन PCOS में चक्र की अनियमितता इन गणनाओं को कम भरोसेमंद बना सकती है। कोई ऐप सिर्फ़ इसलिए पक्के तौर पर नहीं जान सकता कि ओव्यूलेशन हो गया, क्योंकि कोई सैद्धांतिक तारीख़ आ गई है।',
    tip2Title: 'इसे एक संदर्भ की तरह इस्तेमाल करें',
    tip2Text: 'डिजिटल ट्रैकिंग अपने चक्र के रुझान देखने और अपने स्वास्थ्य विशेषज्ञ को दिखाने के लिए इतिहास रखने में सबसे ज़्यादा काम आती है।',
    section6Body1: 'नियमित ट्रैकिंग से आप अपने निजी बदलावों को बेहतर समझ सकती हैं। मकसद चक्र को पूरी तरह अनुमान-योग्य बनाना नहीं है, बल्कि इतनी जानकारी जुटाना है कि रुझान पहचाने जा सकें।',
    trackingTips: [
      'हर चक्र के पहले दिन की तारीख़ लिखें, चाहे चक्रों के बीच बहुत अंतर हो',
      'पूरे चक्र में सर्वाइकल म्यूकस में होने वाले बदलाव देखें',
      'पेड़ू के किसी भी दर्द या ओव्यूलेशन के साथ दिखने वाले दूसरे संकेत नोट करें',
      'ओव्यूलेशन का अनुमान लगाने के लिए सिर्फ़ 28 दिन के औसत पर निर्भर न रहें',
      'ओव्यूलेशन टेस्ट सावधानी से इस्तेमाल करें और ज़रूरत हो तो किसी विशेषज्ञ से सलाह लें',
      'अगर आप गर्भवती होना चाहती हैं, तो जुटाई हुई जानकारी किसी स्वास्थ्य विशेषज्ञ के साथ साझा करें',
    ],
    section6Body2: 'साथ के लक्षण नोट करना भी मददगार हो सकता है: दर्द, मुँहासे, म्यूकस में बदलाव, असामान्य रक्तस्राव, मूड, नींद या आपके अपने दूसरे अवलोकन। इस जानकारी से आपके चक्र की ज़्यादा पूरी तस्वीर बन सकती है।',
    section7Body1: 'गर्भधारण की कोशिश शुरू करने से पहले भी डॉक्टर से मिलना फ़ायदेमंद हो सकता है, जब चक्र बहुत अनियमित हों, बहुत दूर-दूर हों, या पीरियड्स लंबे समय तक न आएँ।',
    section7Body2: 'स्वास्थ्य विशेषज्ञ अनियमितता के कारणों की जाँच कर सकते हैं, ओव्यूलेशन का आकलन कर सकते हैं और ज़रूरत हो तो आपकी गर्भावस्था की योजना के अनुसार कोई तरीका सुझा सकते हैं।',
    alert2Title: 'सलाह कब लें',
    alert2Text: 'अगर आपके पीरियड्स बहुत दूर-दूर आते हैं, कई महीनों से पीरियड नहीं आया है, या नियमित संबंध बनाने के बावजूद गर्भधारण नहीं हो रहा, तो स्वास्थ्य विशेषज्ञ से बात करें।',
    summaryTitle: 'मुख्य बातें',
    summaryRows: [
      'PCOS चक्र को लंबा और अनिश्चित बना सकता है।',
      'कुछ चक्रों में ओव्यूलेशन अनियमित हो सकता है या हो ही नहीं सकता।',
      'अनियमित चक्र का मतलब अपने आप प्रजनन क्षमता की कमी नहीं है।',
      'सिर्फ़ कैलेंडर पर आधारित अनुमान PCOS में कम भरोसेमंद हो सकते हैं।',
      'अपने चक्र को देखना और इतिहास रखना उपयोगी हो सकता है, खासकर डॉक्टर से मिलने के लिए।',
    ],
    finalTipTitle: 'आख़िरी बात',
    finalTipText: 'PCOS हर महिला में एक जैसा नहीं दिखता। आपका चक्र समय के साथ बदल सकता है। ट्रैकिंग इसलिए है कि आप अपने शरीर के काम करने के तरीके को बेहतर समझ सकें, इसलिए नहीं कि वह चिकित्सकीय सलाह की जगह ले।',
    disclaimer: 'यह लेख सिर्फ़ जानकारी और शिक्षा के उद्देश्य से है। यह चिकित्सकीय निदान नहीं है और स्वास्थ्य विशेषज्ञ से परामर्श की जगह नहीं लेता।',
    shareMessage: 'PCOS में चक्र, ओव्यूलेशन और प्रजनन क्षमता — AWA',
  },
  sq: {
    badge: 'PCOS',
    title: 'Cikli, ovulacioni\ndhe pjelloria në PCOS',
    metaDuration: '8 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Mesatar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Me PCOS, cikli yt mund të bëhet i gjatë, i parregullt dhe nganjëherë i vështirë për t’u parashikuar. Të kuptuarit e asaj që ndodh rreth ovulacionit mund të të ndihmojë ta kuptosh më mirë ciklin dhe pyetjet që lidhen me pjelloninë.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Pse cikli bëhet i parregullt',
      'Çfarë ndodh rreth ovulacionit',
      'Si ta dallosh ovulacionin',
      'PCOS dhe pjelloria',
      'Pse aplikacionet mund të jenë më pak të sakta',
      'Ndjekja e ciklit me PCOS',
      'Kur të shkosh te mjeku nëse dëshiron të mbetesh shtatzënë',
      'Pikat kryesore',
    ],
    section1Body1: 'Cikli menstrual varet nga një varg i koordinuar sinjalesh hormonale. Në PCOS, ky organizim mund të prishet, veçanërisht në zhvillimin e folikuleve dhe në ovulacion.',
    section1Body2: 'Ovaret mund të përmbajnë shumë folikule të vegjël që fillojnë të zhvillohen pa u arritur rregullisht pjekuria nga një folikul dominant. Atëherë ovulacioni mund të vonohet, të ndodhë në mënyrë të paparashikueshme ose të mos ndodhë fare në disa cikle.',
    section1Body3: 'Ky është një nga arsyet pse disa persona me PCOS kanë cikle me 35, 45 ose nganjëherë më shumë ditë, ndërsa të tjerë mund të kenë cikle më afër një gjatësie tipike.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Gjatësia e ciklit vetëm nuk të tregon nëse ka ndodhur ovulacioni. Dy cikle me të njëjtën gjatësi mund të kenë një histori hormonale të ndryshme.',
    section2Body1: 'Ovulacioni është çlirimi i një veze nga një ovar. Ai vjen pas një faze të pjekjes së folikulit dhe i paraprin fazës luteale të ciklit.',
    section2Body2: 'Në një cikël të rregullt, ovulacioni është shpesh rreth mesit. Por me PCOS, ky rregull i thjeshtë nuk vlen gjithmonë. Ovulacioni mund të ndodhë shumë më vonë ose mund të mos ndodhë fare në një cikël të caktuar.',
    infoTitle: 'Pse ka rëndësi',
    infoText: 'Kur ovulacioni është i paparashikueshëm, bëhet më e vështirë të vlerësohet dritarja pjellore vetëm në bazë të datave të menstruacioneve.',
    section3Body1: 'Ka disa shenja fizike që mund të shoqërojnë ndryshimet hormonale rreth ovulacionit. Ato mund të jenë të dobishme për të vëzhguar ciklin tënd, por asnjë shenjë e vetme nuk mund ta konfirmojë ovulacionin me siguri.',
    ovulationSigns: [
      'Ndryshim në mukusin e qafës së mitrës, i cili mund të bëhet më i bollshëm, i tejdukshëm dhe i zgjatshëm',
      'Dhimbje ose shqetësim i lehtë në legen te disa gra',
      'Ndryshim në temperaturën e trupit pas ovulacionit',
      'Ndryshim në lagështinë vaginale',
      'Një rritje e mundshme e epshit te disa gra',
    ],
    section3Body2: 'Mukusi i qafës së mitrës meriton vëmendje të veçantë. Kur afrohet dritarja pjellore, ai mund të bëhet më i bollshëm, i tejdukshëm, rrëshqitës dhe i zgjatshëm. Megjithatë, pamja e tij mund të ndryshojë nga një person te tjetri dhe nga një cikël në tjetrin.',
    alert1Title: 'Kujdes me parashikimet',
    alert1Text: 'Me cikle shumë të parregullta, një datë ovulacioni e llogaritur automatikisht nga ciklet e mëparshme mund të jetë shumë e përafërt. Një parashikim nuk është konfirmim mjekësor i ovulacionit.',
    section4Body1: 'PCOS mund ta bëjë shtatzëninë më të vështirë, kryesisht kur ovulacioni është i rrallë ose i vështirë për t’u parashikuar. Megjithatë, të kesh PCOS nuk do të thotë të jesh e pafërt.',
    section4Body2: 'Disa gra me PCOS ovulojnë rregullisht dhe mbeten shtatzëna pa vështirësi të veçanta. Për të tjerat, ovulacioni është aq i parregullt sa kërkon një vlerësim dhe, ndoshta, kujdes mjekësor.',
    fertilityPoints: [
      'PCOS nuk shkakton automatikisht pafrytshmëri',
      'Vështirësia kryesore është shpesh ovulacioni i parregullt ose i paparashikueshëm',
      'Ovulacioni mund të ndodhë edhe kur ciklet janë shumë të gjata',
      'Kujdesi i përshtatshëm mund t’i përmirësojë shanset për shtatzëni',
      'Rruga e pjellorisë varet nga secila vetë dhe nga shumë faktorë të tjerë',
    ],
    section4Body3: 'As pjelloria nuk varet vetëm nga ovulacioni. Mosha, cilësia e spermës së partnerit, gjendja e tubave të Fallopit, endometriumi dhe faktorë të tjerë mund të ndikojnë gjithashtu. Prandaj një vlerësim i plotë ka rëndësi kur shtatzënia vonon më shumë se sa pritej.',
    section5Body1: 'Aplikacionet që ndjekin menstruacionet përdorin zakonisht të dhëna nga ciklet e mëparshme për të nxjerrë vlerësime. Kur ciklet janë relativisht të rregullta, këto vlerësime mund të jenë të dobishme si pikë referimi.',
    section5Body2: 'Me PCOS, megjithatë, ndryshueshmëria e ciklit mund t’i bëjë këto llogaritje më pak të besueshme. Një aplikacion nuk mund të dijë me siguri se ovulacioni ka ndodhur vetëm sepse është arritur një datë teorike.',
    tip2Title: 'Përdore si pikë referimi',
    tip2Text: 'Ndjekja dixhitale është më e dobishme për të vëzhguar tendencat e ciklit tënd dhe për të mbajtur një historik që mund ta ndash me ofruesin tënd të kujdesit shëndetësor.',
    section6Body1: 'Ndjekja e rregullt mund të të ndihmojë ta kuptosh më mirë ndryshimet e tua personale. Qëllimi nuk është ta bësh ciklin plotësisht të parashikueshëm, por të mbledhësh sa më shumë informacion për të dalluar tendencat.',
    trackingTips: [
      'Shëno datën e ditës së parë të çdo cikli, edhe kur ciklet janë shumë të rralla',
      'Vëzhgo ndryshimet e mukusit të qafës së mitrës gjatë ciklit',
      'Shëno çdo dhimbje në legen ose shenja të tjera që mund të shoqërojnë ovulacionin',
      'Shmang të mbështetesh vetëm te një gjatësi mesatare prej 28 ditësh për të parashikuar ovulacionin',
      'Përdor testet e ovulacionit me kujdes dhe, nëse duhet, kërko këshillën e një profesionisti',
      'Ndaj informacionin që mbledh me një profesionist të shëndetësisë nëse dëshiron të mbetesh shtatzënë',
    ],
    section6Body2: 'Mund të ndihmojë edhe të shënosh simptomat shoqëruese: dhimbje, akne, ndryshime në mukus, gjakderdhje të pazakontë, gjendjen shpirtërore, gjumin ose vëzhgime të tjera personale. Ky informacion mund të ndihmojë të ndërtohet një pamje më e plotë e ciklit tënd.',
    section7Body1: 'Një konsultë mund të ia vlejë edhe para se të fillosh të përpiqesh për shtatzëni, kur ciklet janë shumë të parregullta, shumë të rralla ose kur menstruacionet mungojnë për një kohë të gjatë.',
    section7Body2: 'Një profesionist i shëndetësisë mund të hetojë shkaqet e parregullsive, të vlerësojë ovulacionin dhe, nëse duhet, të propozojë një strategji të përshtatshme për planet e tua për shtatzëni.',
    alert2Title: 'Kur të kërkosh këshillë',
    alert2Text: 'Nëse menstruacionet e tua janë shumë të rralla, nëse nuk ke pasur menstruacione për disa muaj ose nëse shtatzënia nuk ndodh pavarësisht marrëdhënieve të rregullta seksuale, flit me një profesionist të shëndetësisë.',
    summaryTitle: 'Pikat kryesore',
    summaryRows: [
      'PCOS mund t’i bëjë ciklet të gjata dhe të paparashikueshme.',
      'Ovulacioni mund të jetë i parregullt ose i munguar në disa cikle.',
      'Një cikël i parregullt nuk do të thotë automatikisht mungesë pjellorie.',
      'Parashikimet që bazohen vetëm te kalendari mund të jenë më pak të besueshme me PCOS.',
      'Vëzhgimi i ciklit tënd dhe mbajtja e një historiku mund të jenë të dobishme, sidomos për një konsultë.',
    ],
    finalTipTitle: 'Një fjalë e fundit',
    finalTipText: 'PCOS nuk shfaqet njësoj te çdo grua. Cikli yt mund të ndryshojë me kalimin e kohës. Ndjekja është këtu për të të ndihmuar ta kuptosh më mirë se si funksionon trupi yt, jo për të zëvendësuar këshillën mjekësore.',
    disclaimer: 'Ky artikull është vetëm për qëllime informimi dhe edukimi. Ai nuk përbën diagnozë mjekësore dhe nuk zëvendëson një konsultë me një profesionist të shëndetësisë.',
    shareMessage: 'Cikli, ovulacioni dhe pjelloria në PCOS — AWA',
  },
  ja: {
    badge: 'PCOS',
    title: 'PCOSの周期、\n排卵、妊娠しやすさ',
    metaDuration: '読了8分',
    metaType: 'ガイド',
    metaLevel: '中級',
    metaValidated: '内容確認済み',
    intro: 'PCOSでは、周期が長くなったり、不規則になったり、予測しにくくなったりすることがあります。排卵の前後に何が起きているかを知ると、ご自身の周期を理解しやすくなり、妊娠しやすさに関する疑問も整理しやすくなります。',
    contentsTitle: 'この記事の内容',
    topics: [
      '周期が不規則になる理由',
      '排卵の前後に起きていること',
      '排卵に気づくには',
      'PCOSと妊娠しやすさ',
      'アプリの精度が下がることがある理由',
      'PCOSの周期を記録するには',
      '妊娠を望むとき、医師に相談するタイミング',
      '重要なポイント',
    ],
    section1Body1: '生理周期は、連携して働くホルモンの信号の流れによって成り立っています。PCOSでは、この仕組みが乱れることがあり、特に卵胞の発育と排卵に影響します。',
    section1Body2: '卵巣には小さな卵胞がたくさんあり、それらが育ち始めても、主席卵胞が定期的に成熟するところまで届かないことがあります。その結果、排卵が遅れたり、予測できないタイミングで起きたり、周期によっては起きなかったりすることがあります。',
    section1Body3: 'このため、PCOSのある人の中には、周期が35日、45日、あるいはそれ以上になる人もいれば、一般的な長さに近い周期の人もいます。',
    tip1Title: '知っておきたいこと',
    tip1Text: '周期の長さだけでは、排卵があったかどうかはわかりません。同じ長さの二つの周期でも、ホルモンの動きが異なることがあります。',
    section2Body1: '排卵とは、卵巣から卵子が放出されることです。卵胞が成熟する段階のあとに起こり、周期の黄体期の前にあたります。',
    section2Body2: '規則的な周期では、排卵は中間あたりに起こることが多いです。しかしPCOSでは、この単純な目安が当てはまらないことがあります。排卵がかなり遅くなったり、その周期には起こらなかったりすることがあります。',
    infoTitle: '大切な理由',
    infoText: '排卵が予測できない場合、生理の日付だけから妊娠しやすい期間を見積もるのは難しくなります。',
    section3Body1: '排卵の前後のホルモンの変化には、いくつかの体のサインが伴うことがあります。ご自身の周期を観察するのに役立ちますが、ひとつのサインだけで排卵を確実に確認することはできません。',
    ovulationSigns: [
      '頸管粘液の変化：量が増え、透明で、よく伸びるようになることがあります',
      '人によっては、軽い骨盤の痛みや違和感',
      '排卵後の体温の変化',
      '腟の湿り気の変化',
      '人によっては、性欲が高まること',
    ],
    section3Body2: '頸管粘液は、特に観察する価値があります。妊娠しやすい期間が近づくと、量が増え、透明でなめらかになり、よく伸びるようになることがあります。ただし、その見た目は人によって、また周期によっても異なります。',
    alert1Title: '予測には注意しましょう',
    alert1Text: '周期がとても不規則な場合、過去の周期から自動的に計算された排卵日は、かなりおおよその目安にすぎないことがあります。予測は、排卵を医学的に確認するものではありません。',
    section4Body1: 'PCOSがあると、特に排卵がまれだったり予測しにくかったりする場合に、妊娠しにくくなることがあります。ただし、PCOSがあるからといって、不妊であるという意味ではありません。',
    section4Body2: 'PCOSのある女性の中には、定期的に排卵があり、特に困難なく妊娠する人もいます。一方で、排卵が非常に不規則なために、検査や、場合によっては医療的なケアが必要になる人もいます。',
    fertilityPoints: [
      'PCOSがあっても、必ず不妊になるわけではありません',
      '主な難しさは、排卵が不規則だったり予測しにくかったりすることであることが多いです',
      '周期がとても長くても、排卵が起こることはあります',
      '適切なケアによって、妊娠の可能性が高まることがあります',
      '妊娠までの道のりは、一人ひとりの状況やほかの多くの要因によって異なります',
    ],
    section4Body3: 'また、妊娠しやすさは排卵だけで決まるものではありません。年齢、パートナーの精子の質、卵管の状態、子宮内膜、そのほかの要因も関係することがあります。そのため、妊娠まで思ったより時間がかかる場合には、総合的な検査が大切です。',
    section5Body1: '生理記録アプリは、一般的に過去の周期のデータをもとに見積もりを出します。周期が比較的規則的であれば、こうした見積もりは目安として役立つことがあります。',
    section5Body2: 'しかしPCOSでは、周期のばらつきが大きいため、こうした計算の信頼性が下がることがあります。理論上の日付になったからといって、アプリが排卵が起きたことを確実に知ることはできません。',
    tip2Title: '目安として使いましょう',
    tip2Text: 'デジタルの記録は、ご自身の周期の傾向を観察したり、医療従事者に伝えるための履歴を残したりするのに最も役立ちます。',
    section6Body1: '定期的に記録すると、ご自身の周期の変動を理解しやすくなります。目的は周期を完全に予測できるようにすることではなく、傾向を見つけるのに十分な情報を集めることです。',
    trackingTips: [
      '周期がとても間隔の空いたものであっても、各周期の初日の日付を記録しましょう',
      '周期を通して、頸管粘液の変化を観察しましょう',
      '骨盤の痛みや、排卵に伴うことがあるほかのサインを記録しましょう',
      '排卵の予測を、平均28日という長さだけに頼らないようにしましょう',
      '排卵検査薬は慎重に使い、必要に応じて専門家にアドバイスを求めましょう',
      '妊娠を望む場合は、集めた情報を医療従事者に伝えましょう',
    ],
    section6Body2: 'あわせて、痛み、ニキビ、粘液の変化、いつもと違う出血、気分、睡眠、そのほか個人的な気づきなど、関連する症状を記録しておくのも役立ちます。こうした情報は、周期の全体像をつかむ助けになります。',
    section7Body1: '周期がとても不規則な場合、とても間隔が空いている場合、または長期間生理がない場合は、妊娠を望み始める前であっても、受診する価値があります。',
    section7Body2: '医療従事者は、不規則さの原因を調べ、排卵を評価し、必要に応じて、妊娠の計画に合った方針を提案することができます。',
    alert2Title: '相談を考えたほうがよいとき',
    alert2Text: '生理の間隔がとても空いている場合、数か月生理がない場合、または定期的な性交渉があっても妊娠しない場合は、医療従事者に相談してください。',
    summaryTitle: '重要なポイント',
    summaryRows: [
      'PCOSでは、周期が長くなり、予測しにくくなることがあります。',
      '周期によっては、排卵が不規則だったり、起こらなかったりすることがあります。',
      '周期が不規則だからといって、必ずしも妊娠しにくいわけではありません。',
      'カレンダーだけにもとづく予測は、PCOSでは信頼性が下がることがあります。',
      '周期を観察して履歴を残すことは、特に受診の際に役立ちます。',
    ],
    finalTipTitle: '最後にひとこと',
    finalTipText: 'PCOSの現れ方は、すべての女性で同じではありません。周期も時間とともに変わることがあります。記録は、体の仕組みを理解するためのものであり、医療アドバイスの代わりではありません。',
    disclaimer: 'この記事は情報提供と教育のみを目的としています。医学的な診断ではなく、医療従事者の診察に代わるものでもありません。',
    shareMessage: 'PCOSの周期、排卵、妊娠しやすさ — AWA',
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

      <AwaText variant="titleLarge" emphasized style={styles.h2}>
        1. {content.topics[0]}
      </AwaText>

      <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
        {content.section1Body1}
      </AwaText>

      <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
        {content.section1Body2}
      </AwaText>

      <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
        {content.section1Body3}
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

      <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

      <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
        {content.section2Body1}
      </AwaText>

      <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
        {content.section2Body2}
      </AwaText>

      <AwaCard variant="filled" padding="none" style={styles.infoCard}>
        <MaterialDesignIcons
          name="information-outline"
          size={23}
          color={theme.colors.primary}
        />

        <View style={styles.tipCopy}>
          <AwaText variant="titleSmall" emphasized>{content.infoTitle}</AwaText>

          <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
            {content.infoText}
          </AwaText>
        </View>
      </AwaCard>

      <AwaText variant="titleLarge" emphasized style={styles.h2}>
        3. {content.topics[2]}
      </AwaText>

      <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
        {content.section3Body1}
      </AwaText>

      <AwaCard variant="filled" padding="none" style={styles.checkList}>
        {content.ovulationSigns.map(item => (
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

      <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
        {content.section3Body2}
      </AwaText>

      <AwaCard variant="filled" padding="none" style={styles.alert}>
        <MaterialDesignIcons
          name="alert-outline"
          size={24}
          color={theme.colors.warning}
        />

        <View style={styles.tipCopy}>
          <AwaText variant="titleSmall" emphasized>{content.alert1Title}</AwaText>

          <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
            {content.alert1Text}
          </AwaText>
        </View>
      </AwaCard>

      <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

      <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
        {content.section4Body1}
      </AwaText>

      <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
        {content.section4Body2}
      </AwaText>

      <AwaCard variant="filled" padding="none" style={styles.checkList}>
        {content.fertilityPoints.map(item => (
          <View key={item} style={styles.checkRow}>
            <MaterialDesignIcons
              name="heart-pulse"
              size={18}
              color={theme.colors.primary}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>{item}</AwaText>
          </View>
        ))}
      </AwaCard>

      <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
        {content.section4Body3}
      </AwaText>

      <AwaText variant="titleLarge" emphasized style={styles.h2}>
        5. {content.topics[4]}
      </AwaText>

      <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
        {content.section5Body1}
      </AwaText>

      <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
        {content.section5Body2}
      </AwaText>

      <AwaCard variant="filled" padding="none" style={styles.tip}>
        <MaterialDesignIcons
          name="calendar-clock"
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

      <AwaText variant="titleLarge" emphasized style={styles.h2}>6. {content.topics[5]}</AwaText>

      <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
        {content.section6Body1}
      </AwaText>

      <AwaCard variant="filled" padding="none" style={styles.checkList}>
        {content.trackingTips.map(item => (
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

      <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
        {content.section6Body2}
      </AwaText>

      <AwaText variant="titleLarge" emphasized style={styles.h2}>
        7. {content.topics[6]}
      </AwaText>

      <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
        {content.section7Body1}
      </AwaText>

      <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
        {content.section7Body2}
      </AwaText>

      <AwaCard variant="filled" padding="none" style={styles.alert}>
        <MaterialDesignIcons
          name="doctor"
          size={24}
          color={theme.colors.warning}
        />

        <View style={styles.tipCopy}>
          <AwaText variant="titleSmall" emphasized>{content.alert2Title}</AwaText>

          <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
            {content.alert2Text}
          </AwaText>
        </View>
      </AwaCard>

      <AwaText variant="titleLarge" emphasized style={styles.h2}>8. {content.topics[7]}</AwaText>

      <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <MaterialDesignIcons
            name="bookmark-check-outline"
            size={23}
            color={theme.colors.primary}
          />

          <AwaText variant="titleSmall" emphasized>{content.summaryTitle}</AwaText>
        </View>

        <View style={styles.summaryRow}>
          <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.summaryNumber}>01</AwaText>

          <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
            {content.summaryRows[0]}
          </AwaText>
        </View>

        <View style={styles.summaryRow}>
          <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.summaryNumber}>02</AwaText>

          <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
            {content.summaryRows[1]}
          </AwaText>
        </View>

        <View style={styles.summaryRow}>
          <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.summaryNumber}>03</AwaText>

          <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
            {content.summaryRows[2]}
          </AwaText>
        </View>

        <View style={styles.summaryRow}>
          <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.summaryNumber}>04</AwaText>

          <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
            {content.summaryRows[3]}
          </AwaText>
        </View>

        <View style={styles.summaryRow}>
          <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.summaryNumber}>05</AwaText>

          <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
            {content.summaryRows[4]}
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
          <AwaText variant="titleSmall" emphasized>{content.finalTipTitle}</AwaText>

          <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
            {content.finalTipText}
          </AwaText>
        </View>
      </AwaCard>

      <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.disclaimer}>
        {content.disclaimer}
      </AwaText>
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
marginTop: 24,
},

body: {
marginTop: 8,
},

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

checkText: {
flex: 1,
},

alert: {
marginTop: 16,
padding: 16,
flexDirection: 'row',
alignItems: 'flex-start',
backgroundColor: withAlpha(theme.colors.warning, 0.12),
},

infoCard: {
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


summaryRow: {
flexDirection: 'row',
alignItems: 'flex-start',
marginTop: 12,
},

summaryNumber: {
width: 31,
marginTop: 2,
},

summaryText: {
flex: 1,
},

disclaimer: {
marginTop: 24,
paddingHorizontal: 4,
textAlign: 'center',
},
});
}
