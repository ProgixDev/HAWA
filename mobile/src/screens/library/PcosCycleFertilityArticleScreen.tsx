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

const ID = 'pcos-cycle-ovulation-fertilite';

const HERO = require('../../assets/images/library/featured-cycle.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('PcosCycleFertility', {
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
  ko: {
    badge: 'PCOS',
    title: '다낭성 난소 증후군에서의\n주기, 배란, 임신 가능성',
    metaDuration: '읽는 데 8분',
    metaType: '가이드',
    metaLevel: '중급',
    metaValidated: '검토된 콘텐츠',
    intro: '다낭성 난소 증후군(PCOS)이 있으면 주기가 길어지고 불규칙해지며 예측하기 어려울 때가 있어요. 배란 전후에 어떤 일이 일어나는지 이해하면 내 주기를 파악하고 임신 가능성에 관한 궁금증을 더 잘 이해하는 데 도움이 될 수 있어요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '주기가 불규칙해지는 이유',
      '배란 전후에 일어나는 일',
      '배란을 알아차리는 방법',
      'PCOS와 임신 가능성',
      '앱이 덜 정확할 수 있는 이유',
      'PCOS와 함께하는 주기 기록',
      '임신을 원할 때 의사를 만나야 하는 경우',
      '핵심 정리',
    ],
    section1Body1: '생리 주기는 서로 맞물려 이어지는 호르몬 신호에 따라 움직여요. PCOS에서는 이러한 조율이 흐트러질 수 있고, 특히 난포의 성장과 배란에 영향을 줄 수 있어요.',
    section1Body2: '난소에는 작은 난포가 많이 있고, 이 난포들이 자라기 시작하지만 하나의 우세 난포가 규칙적으로 성숙하지 못할 수 있어요. 그러면 배란이 늦어지거나, 예측할 수 없게 일어나거나, 어떤 주기에는 일어나지 않을 수도 있어요.',
    section1Body3: '이것이 PCOS가 있는 일부 여성의 주기가 35일, 45일, 때로는 그 이상이 되는 이유 중 하나예요. 반면 일반적인 길이에 가까운 주기를 가진 사람도 있어요.',
    tip1Title: '알아 두세요',
    tip1Text: '주기의 길이만으로는 배란이 있었는지 알 수 없어요. 길이가 같은 두 주기라도 호르몬의 흐름은 다를 수 있어요.',
    section2Body1: '배란은 난소에서 난자가 배출되는 것이에요. 난포가 성숙하는 단계 뒤에 오고, 주기의 황체기보다 앞서 일어나요.',
    section2Body2: '규칙적인 주기에서는 배란이 대개 중간쯤에 일어나요. 하지만 PCOS에서는 이 단순한 규칙이 항상 들어맞지는 않아요. 배란이 훨씬 늦어지거나 어떤 주기에는 아예 일어나지 않을 수도 있어요.',
    infoTitle: '이것이 중요한 이유',
    infoText: '배란을 예측할 수 없으면 생리 날짜만으로 가임기를 가늠하기가 더 어려워져요.',
    section3Body1: '배란 전후의 호르몬 변화와 함께 나타날 수 있는 신체 신호가 여러 가지 있어요. 내 주기를 관찰하는 데는 유용할 수 있지만, 어느 한 가지 신호만으로 배란을 확실하게 확인할 수는 없어요.',
    ovulationSigns: [
      '자궁경부 점액의 변화: 양이 늘고 맑아지며 늘어나는 성질을 보일 수 있어요',
      '일부 여성에게 나타나는 가벼운 골반 통증이나 불편감',
      '배란 후 체온의 변화',
      '질 분비물의 촉촉함 변화',
      '일부 여성에게 나타날 수 있는 성욕 증가',
    ],
    section3Body2: '자궁경부 점액은 특히 눈여겨볼 만해요. 가임기가 가까워지면 양이 늘고 맑고 미끄러우며 잘 늘어나게 될 수 있어요. 다만 모양은 사람마다, 그리고 주기마다 다를 수 있어요.',
    alert1Title: '예측에는 주의하세요',
    alert1Text: '주기가 매우 불규칙하면 이전 주기를 바탕으로 자동 계산한 배란 날짜는 매우 대략적일 수 있어요. 예측은 배란에 대한 의학적 확인이 아니에요.',
    section4Body1: 'PCOS는 배란이 드물거나 예측하기 어려울 때 특히 임신을 더 어렵게 만들 수 있어요. 하지만 PCOS가 있다고 해서 불임이라는 뜻은 아니에요.',
    section4Body2: 'PCOS가 있는 일부 여성은 규칙적으로 배란하고 특별한 어려움 없이 임신해요. 다른 여성들은 배란이 많이 불규칙해서 검사와 필요하면 의료적 도움이 필요할 수 있어요.',
    fertilityPoints: [
      'PCOS가 자동으로 불임을 일으키는 것은 아니에요',
      '주된 어려움은 대개 불규칙하거나 예측하기 어려운 배란이에요',
      '주기가 매우 길어도 배란은 일어날 수 있어요',
      '적절한 진료는 임신 가능성을 높이는 데 도움이 될 수 있어요',
      '임신까지의 여정은 사람마다 다르고 그 밖의 여러 요인에 따라 달라져요',
    ],
    section4Body3: '임신 가능성은 배란만으로 정해지는 것도 아니에요. 나이, 파트너의 정자 상태, 나팔관의 상태, 자궁내막, 그 밖의 요인도 영향을 줄 수 있어요. 그래서 임신이 예상보다 오래 걸릴 때는 종합적인 검사가 중요해요.',
    section5Body1: '생리 기록 앱은 대개 이전 주기의 데이터를 바탕으로 예측값을 계산해요. 주기가 비교적 규칙적일 때는 이러한 예측이 참고가 될 수 있어요.',
    section5Body2: '하지만 PCOS에서는 주기의 변동 때문에 이런 계산을 덜 믿을 수 있어요. 이론상의 날짜가 되었다고 해서 앱이 배란이 일어났다고 확실히 알 수는 없어요.',
    tip2Title: '참고 자료로 활용하세요',
    tip2Text: '디지털 기록은 내 주기의 경향을 관찰하고, 의료진과 공유할 이력을 남기는 데 가장 유용해요.',
    section6Body1: '꾸준히 기록하면 나만의 변화를 더 잘 이해하는 데 도움이 될 수 있어요. 목표는 주기를 완벽하게 예측할 수 있게 만드는 것이 아니라, 경향을 파악할 만큼 충분한 정보를 모으는 거예요.',
    trackingTips: [
      '주기가 매우 띄엄띄엄 오더라도 매 주기의 첫날 날짜를 기록하세요',
      '주기 동안 자궁경부 점액의 변화를 관찰하세요',
      '골반 통증이나 배란과 함께 나타날 수 있는 다른 신호를 기록하세요',
      '배란을 예측할 때 평균 28일이라는 길이에만 의존하지 마세요',
      '배란 테스트는 신중하게 사용하고, 필요하면 전문가에게 조언을 구하세요',
      '임신을 원한다면 모은 정보를 의료 전문가와 공유하세요',
    ],
    section6Body2: '함께 나타나는 증상을 기록해 두는 것도 도움이 될 수 있어요. 통증, 여드름, 점액의 변화, 평소와 다른 출혈, 기분, 수면, 그 밖에 개인적으로 관찰한 내용 등이에요. 이런 정보는 내 주기를 더 폭넓게 파악하는 데 도움이 될 수 있어요.',
    section7Body1: '주기가 매우 불규칙하거나 매우 띄엄띄엄 오거나 생리가 오랫동안 없을 때는, 임신을 시도하기 전이라도 진료를 받아 볼 만해요.',
    section7Body2: '의료 전문가는 불규칙한 원인을 살펴보고, 배란을 평가하고, 필요하면 임신 계획에 맞는 방법을 제안할 수 있어요.',
    alert2Title: '조언을 구해야 할 때',
    alert2Text: '생리가 매우 띄엄띄엄 오거나, 몇 달째 생리가 없거나, 규칙적으로 부부 관계를 가져도 임신이 되지 않는다면 의료 전문가와 상담하세요.',
    summaryTitle: '핵심 정리',
    summaryRows: [
      'PCOS가 있으면 주기가 길어지고 예측하기 어려워질 수 있어요.',
      '일부 주기에서는 배란이 불규칙하거나 없을 수 있어요.',
      '주기가 불규칙하다고 해서 자동으로 임신 가능성이 없다는 뜻은 아니에요.',
      '달력만을 바탕으로 한 예측은 PCOS에서는 덜 믿을 수 있어요.',
      '내 주기를 관찰하고 이력을 남겨 두면, 특히 진료를 받을 때 도움이 될 수 있어요.',
    ],
    finalTipTitle: '마지막으로 한마디',
    finalTipText: 'PCOS는 모든 여성에게 똑같이 나타나지 않아요. 주기도 시간이 지나면서 달라질 수 있어요. 기록은 내 몸이 어떻게 움직이는지 더 잘 이해하도록 돕기 위한 것이지, 의학적 조언을 대신하기 위한 것이 아니에요.',
    disclaimer: '이 아티클은 정보 제공과 교육을 목적으로 해요. 의학적 진단이 아니며 의료 전문가의 진료를 대신하지 않아요.',
    shareMessage: '다낭성 난소 증후군에서의 주기, 배란, 임신 가능성 — AWA',
  },
  'pt-PT': {
    badge: 'SOP',
    title: 'Ciclo, ovulação\ne fertilidade no SOP',
    metaDuration: '8 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Intermédio',
    metaValidated: 'Conteúdo revisto',
    intro: 'Com a síndrome do ovário poliquístico (SOP), o seu ciclo pode tornar-se longo, irregular e, por vezes, difícil de prever. Compreender o que acontece em torno da ovulação pode ajudá-la a perceber o seu ciclo e a entender melhor as questões relacionadas com a fertilidade.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Porque é que o ciclo se torna irregular',
      'O que acontece em torno da ovulação',
      'Como reconhecer a ovulação',
      'SOP e fertilidade',
      'Porque é que as aplicações podem ser menos precisas',
      'Acompanhar o ciclo com SOP',
      'Quando consultar um médico se quer engravidar',
      'Pontos-chave',
    ],
    section1Body1: 'O ciclo menstrual depende de uma sequência coordenada de sinais hormonais. No SOP, esta organização pode estar perturbada, em particular no desenvolvimento dos folículos e na ovulação.',
    section1Body2: 'Os ovários podem conter muitos folículos pequenos que começam a desenvolver-se sem que um folículo dominante chegue regularmente à maturidade. A ovulação pode então atrasar-se, ocorrer de forma imprevisível ou não acontecer em certos ciclos.',
    section1Body3: 'Esta é uma das razões pelas quais algumas pessoas com SOP têm ciclos de 35, 45 ou, por vezes, mais dias, enquanto outras podem ter ciclos mais próximos de uma duração habitual.',
    tip1Title: 'Bom saber',
    tip1Text: 'A duração do ciclo, por si só, não indica se houve ovulação. Dois ciclos com a mesma duração podem ter uma história hormonal diferente.',
    section2Body1: 'A ovulação é a libertação de um óvulo por um ovário. Segue-se a uma fase de maturação folicular e precede a fase lútea do ciclo.',
    section2Body2: 'Num ciclo regular, a ovulação ocorre muitas vezes por volta do meio do ciclo. Mas, com SOP, esta regra simples nem sempre se aplica. A ovulação pode ser muito mais tardia ou pode não acontecer num determinado ciclo.',
    infoTitle: 'Porque é que isto importa',
    infoText: 'Quando a ovulação é imprevisível, torna-se mais difícil estimar a janela fértil apenas com base nas datas do período.',
    section3Body1: 'Existem vários sinais físicos que podem acompanhar as alterações hormonais em torno da ovulação. Podem ser úteis para observar o seu próprio ciclo, mas nenhum sinal isolado consegue confirmar a ovulação com certeza.',
    ovulationSigns: [
      'Uma alteração do muco cervical, que pode tornar-se mais abundante, transparente e elástico',
      'Dor ou desconforto pélvico ligeiro em algumas mulheres',
      'Uma alteração da temperatura corporal após a ovulação',
      'Uma alteração da humidade vaginal',
      'Um possível aumento da libido em algumas mulheres',
    ],
    section3Body2: 'O muco cervical merece particular atenção. À medida que a janela fértil se aproxima, pode tornar-se mais abundante, transparente, escorregadio e elástico. No entanto, o seu aspeto pode variar de pessoa para pessoa e de ciclo para ciclo.',
    alert1Title: 'Cuidado com as previsões',
    alert1Text: 'Com ciclos muito irregulares, uma data de ovulação calculada automaticamente a partir dos ciclos anteriores pode ser muito aproximada. Uma previsão não é uma confirmação médica da ovulação.',
    section4Body1: 'O SOP pode dificultar a conceção, sobretudo quando a ovulação é pouco frequente ou difícil de prever. No entanto, ter SOP não significa ser infértil.',
    section4Body2: 'Algumas mulheres com SOP ovulam regularmente e engravidam sem dificuldade particular. Para outras, a ovulação é suficientemente irregular para justificar uma avaliação e, eventualmente, cuidados médicos.',
    fertilityPoints: [
      'O SOP não causa automaticamente infertilidade',
      'A principal dificuldade é muitas vezes a ovulação irregular ou imprevisível',
      'A ovulação pode ocorrer mesmo quando os ciclos são muito longos',
      'Cuidados adequados podem melhorar as probabilidades de conceção',
      'O percurso de fertilidade depende de cada pessoa e de muitos outros fatores',
    ],
    section4Body3: 'A fertilidade também não depende apenas da ovulação. A idade, a qualidade do esperma do parceiro, o estado das trompas de Falópio, o endométrio e outros fatores também podem ter um papel. É por isso que uma avaliação completa é importante quando a gravidez demora mais do que o esperado.',
    section5Body1: 'As aplicações de acompanhamento do período utilizam geralmente dados dos ciclos anteriores para produzir estimativas. Quando os ciclos são relativamente regulares, estas estimativas podem ser úteis como referência.',
    section5Body2: 'No SOP, porém, a variabilidade do ciclo pode tornar estes cálculos menos fiáveis. Uma aplicação não pode saber com certeza que a ovulação ocorreu só porque se atingiu uma data teórica.',
    tip2Title: 'Utilize-o como ponto de referência',
    tip2Text: 'O acompanhamento digital é mais útil para observar tendências no seu próprio ciclo e manter um histórico para partilhar com o seu profissional de saúde.',
    section6Body1: 'O acompanhamento regular pode ajudá-la a compreender melhor as suas variações pessoais. O objetivo não é tornar o ciclo perfeitamente previsível, mas reunir informação suficiente para identificar tendências.',
    trackingTips: [
      'Anote a data do primeiro dia de cada ciclo, mesmo quando os ciclos são muito espaçados',
      'Observe as alterações do muco cervical ao longo do ciclo',
      'Anote qualquer dor pélvica ou outros sinais que possam acompanhar a ovulação',
      'Evite basear-se unicamente numa duração média de 28 dias para prever a ovulação',
      'Utilize os testes de ovulação com cautela e, se necessário, peça aconselhamento a um profissional',
      'Partilhe a informação que reunir com um profissional de saúde se quiser engravidar',
    ],
    section6Body2: 'Também pode ser útil anotar os sintomas associados: dor, acne, alterações do muco, perdas de sangue fora do habitual, humor, sono ou outras observações pessoais. Esta informação pode ajudar a construir uma imagem mais completa do seu ciclo.',
    section7Body1: 'Uma consulta pode valer a pena mesmo antes de começar a tentar engravidar, quando os ciclos são muito irregulares, muito espaçados ou quando o período está ausente durante muito tempo.',
    section7Body2: 'Um profissional de saúde pode investigar as causas das irregularidades, avaliar a ovulação e, se necessário, propor uma estratégia adequada ao seu projeto de gravidez.',
    alert2Title: 'Quando procurar aconselhamento',
    alert2Text: 'Se os seus períodos são muito espaçados, se não tem o período há vários meses ou se a gravidez não acontece apesar de relações sexuais regulares, fale com um profissional de saúde.',
    summaryTitle: 'Pontos-chave',
    summaryRows: [
      'O SOP pode tornar os ciclos longos e imprevisíveis.',
      'A ovulação pode ser irregular ou estar ausente em alguns ciclos.',
      'Um ciclo irregular não significa automaticamente falta de fertilidade.',
      'As previsões baseadas apenas no calendário podem ser menos fiáveis com SOP.',
      'Observar o seu ciclo e manter um histórico pode ser útil, sobretudo para uma consulta.',
    ],
    finalTipTitle: 'Uma última palavra',
    finalTipText: 'O SOP não se manifesta da mesma forma em todas as mulheres. O seu ciclo pode mudar ao longo do tempo. O acompanhamento serve para a ajudar a compreender melhor como funciona o seu corpo, não para substituir o aconselhamento médico.',
    disclaimer: 'Este artigo tem apenas fins informativos e educativos. Não constitui um diagnóstico médico e não substitui uma consulta com um profissional de saúde.',
    shareMessage: 'Ciclo, ovulação e fertilidade no SOP — AWA',
  },
  bn: {
    badge: 'পিসিওএস',
    title: 'পিসিওএসে চক্র, ডিম্বস্ফোটন\nও প্রজনন ক্ষমতা',
    metaDuration: '8 মিনিটের পাঠ',
    metaType: 'গাইড',
    metaLevel: 'মধ্যম',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'পলিসিস্টিক ওভারি সিনড্রোমে (পিসিওএস) আপনার চক্র দীর্ঘ, অনিয়মিত এবং কখনো কখনো আগাম অনুমান করা কঠিন হয়ে উঠতে পারে। ডিম্বস্ফোটনের আশপাশে কী ঘটে তা বোঝা আপনার চক্র বুঝতে এবং প্রজনন ক্ষমতা সংক্রান্ত প্রশ্নগুলো আরও ভালোভাবে বুঝতে সাহায্য করতে পারে।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'চক্র কেন অনিয়মিত হয়ে যায়',
      'ডিম্বস্ফোটনের আশপাশে কী ঘটে',
      'ডিম্বস্ফোটন কীভাবে চেনা যায়',
      'পিসিওএস ও প্রজনন ক্ষমতা',
      'অ্যাপ কেন কম নির্ভুল হতে পারে',
      'পিসিওএসে চক্র ট্র্যাক করা',
      'গর্ভধারণ করতে চাইলে কখন ডাক্তার দেখাবেন',
      'মূল কথা',
    ],
    section1Body1: 'মাসিক চক্র নির্ভর করে হরমোনের সংকেতের একটি সমন্বিত ক্রমের ওপর। পিসিওএসে এই সংগঠন বিঘ্নিত হতে পারে, বিশেষ করে ফলিকল বৃদ্ধি ও ডিম্বস্ফোটনে।',
    section1Body2: 'ডিম্বাশয়ে অনেক ছোট ছোট ফলিকল থাকতে পারে, যেগুলো বাড়তে শুরু করে কিন্তু কোনো প্রধান ফলিকল নিয়মিত পরিপক্ব হয় না। তখন ডিম্বস্ফোটন দেরিতে হতে পারে, অনিশ্চিতভাবে হতে পারে, অথবা কিছু চক্রে একেবারেই নাও হতে পারে।',
    section1Body3: 'এ কারণেই পিসিওএসে আক্রান্ত কারও কারও চক্র 35, 45 বা কখনো তারও বেশি দিনের হয়, আবার অন্যদের চক্র স্বাভাবিক দৈর্ঘ্যের কাছাকাছি থাকতে পারে।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'শুধু চক্রের দৈর্ঘ্য দেখে বলা যায় না ডিম্বস্ফোটন হয়েছে কি না। একই দৈর্ঘ্যের দুটি চক্রের হরমোনের ইতিহাস আলাদা হতে পারে।',
    section2Body1: 'ডিম্বস্ফোটন হলো ডিম্বাশয় থেকে একটি ডিম্বাণু নির্গত হওয়া। এটি ফলিকল পরিপক্ব হওয়ার পর্যায়ের পরে এবং চক্রের লিউটিয়াল পর্যায়ের আগে ঘটে।',
    section2Body2: 'নিয়মিত চক্রে ডিম্বস্ফোটন প্রায়ই মাঝামাঝি সময়ে হয়। কিন্তু পিসিওএসে এই সরল নিয়ম সবসময় খাটে না। ডিম্বস্ফোটন অনেক দেরিতে হতে পারে, অথবা কোনো চক্রে একেবারেই নাও হতে পারে।',
    infoTitle: 'কেন এটি গুরুত্বপূর্ণ',
    infoText: 'ডিম্বস্ফোটন অনিশ্চিত হলে শুধু মাসিকের তারিখ দেখে উর্বর সময় অনুমান করা কঠিন হয়ে পড়ে।',
    section3Body1: 'ডিম্বস্ফোটনের আশপাশে হরমোনের পরিবর্তনের সঙ্গে বেশ কিছু শারীরিক লক্ষণ দেখা দিতে পারে। নিজের চক্র পর্যবেক্ষণে এগুলো কাজে লাগতে পারে, কিন্তু কোনো একটি লক্ষণ দিয়ে নিশ্চিতভাবে ডিম্বস্ফোটন প্রমাণ করা যায় না।',
    ovulationSigns: [
      'জরায়ুমুখের শ্লেষ্মার পরিবর্তন, যা আরও বেশি, স্বচ্ছ ও টেনে লম্বা করা যায় এমন হতে পারে',
      'কিছু নারীর ক্ষেত্রে তলপেটে হালকা ব্যথা বা অস্বস্তি',
      'ডিম্বস্ফোটনের পর শরীরের তাপমাত্রার পরিবর্তন',
      'যোনিপথের আর্দ্রতার পরিবর্তন',
      'কিছু নারীর ক্ষেত্রে যৌন আকাঙ্ক্ষা বাড়তে পারে',
    ],
    section3Body2: 'জরায়ুমুখের শ্লেষ্মা বিশেষভাবে পর্যবেক্ষণ করার মতো। উর্বর সময় এগিয়ে এলে এটি আরও বেশি, স্বচ্ছ, পিচ্ছিল ও টেনে লম্বা করা যায় এমন হতে পারে। তবে এর চেহারা একজন থেকে আরেকজনে এবং এক চক্র থেকে আরেক চক্রে ভিন্ন হতে পারে।',
    alert1Title: 'পূর্বাভাসের ব্যাপারে সতর্ক থাকুন',
    alert1Text: 'খুব অনিয়মিত চক্রে আগের চক্রগুলো থেকে স্বয়ংক্রিয়ভাবে হিসাব করা ডিম্বস্ফোটনের তারিখ খুবই আনুমানিক হতে পারে। পূর্বাভাস ডিম্বস্ফোটনের চিকিৎসাগত নিশ্চিতকরণ নয়।',
    section4Body1: 'পিসিওএস গর্ভধারণ কঠিন করে তুলতে পারে, প্রধানত যখন ডিম্বস্ফোটন কম হয় বা আগাম বোঝা কঠিন হয়। তবে পিসিওএস থাকা মানে বন্ধ্যা হওয়া নয়।',
    section4Body2: 'পিসিওএসে আক্রান্ত কিছু নারী নিয়মিত ডিম্বস্ফোটন করেন এবং বিশেষ কোনো অসুবিধা ছাড়াই গর্ভধারণ করেন। অন্যদের ক্ষেত্রে ডিম্বস্ফোটন এতটাই অনিয়মিত যে মূল্যায়ন এবং সম্ভবত চিকিৎসা যত্নের প্রয়োজন হয়।',
    fertilityPoints: [
      'পিসিওএস স্বয়ংক্রিয়ভাবে বন্ধ্যাত্ব ঘটায় না',
      'প্রধান অসুবিধা প্রায়ই অনিয়মিত বা অনিশ্চিত ডিম্বস্ফোটন',
      'চক্র খুব দীর্ঘ হলেও ডিম্বস্ফোটন হতে পারে',
      'উপযুক্ত যত্ন গর্ভধারণের সম্ভাবনা বাড়াতে পারে',
      'প্রজনন ক্ষমতার যাত্রা প্রত্যেক ব্যক্তি ও আরও অনেক কারণের ওপর নির্ভর করে',
    ],
    section4Body3: 'প্রজনন ক্ষমতাও শুধু ডিম্বস্ফোটনের ওপর নির্ভর করে না। বয়স, সঙ্গীর শুক্রাণুর মান, ফ্যালোপিয়ান নালির অবস্থা, জরায়ুর অন্তঃস্তর (এন্ডোমেট্রিয়াম) এবং অন্যান্য কারণও ভূমিকা রাখতে পারে। তাই গর্ভধারণে প্রত্যাশার চেয়ে বেশি সময় লাগলে একটি সার্বিক মূল্যায়ন গুরুত্বপূর্ণ।',
    section5Body1: 'মাসিক ট্র্যাক করার অ্যাপ সাধারণত আগের চক্রের তথ্য ব্যবহার করে অনুমান তৈরি করে। চক্র তুলনামূলকভাবে নিয়মিত হলে এই অনুমান একটি রেফারেন্স হিসেবে কাজে লাগতে পারে।',
    section5Body2: 'তবে পিসিওএসে চক্রের তারতম্য এই হিসাবগুলোকে কম নির্ভরযোগ্য করে তুলতে পারে। শুধু একটি তাত্ত্বিক তারিখ এসে গেছে বলেই অ্যাপ নিশ্চিতভাবে জানতে পারে না যে ডিম্বস্ফোটন হয়েছে।',
    tip2Title: 'এটিকে একটি দিকনির্দেশক হিসেবে ব্যবহার করুন',
    tip2Text: 'ডিজিটাল ট্র্যাকিং সবচেয়ে বেশি কাজে লাগে নিজের চক্রের প্রবণতা পর্যবেক্ষণে এবং আপনার স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে ভাগ করার জন্য ইতিহাস রাখতে।',
    section6Body1: 'নিয়মিত ট্র্যাকিং আপনার ব্যক্তিগত তারতম্যগুলো আরও ভালোভাবে বুঝতে সাহায্য করতে পারে। লক্ষ্য চক্রকে নিখুঁতভাবে অনুমানযোগ্য করে তোলা নয়, বরং প্রবণতা চেনার জন্য যথেষ্ট তথ্য সংগ্রহ করা।',
    trackingTips: [
      'চক্র খুব ফাঁকা ফাঁকা হলেও প্রতিটি চক্রের প্রথম দিনের তারিখ লিখে রাখুন',
      'চক্র জুড়ে জরায়ুমুখের শ্লেষ্মার পরিবর্তন লক্ষ্য করুন',
      'তলপেটে ব্যথা বা ডিম্বস্ফোটনের সঙ্গে আসতে পারে এমন অন্য লক্ষণ লিখে রাখুন',
      'ডিম্বস্ফোটনের পূর্বাভাসের জন্য শুধু গড় 28 দিনের দৈর্ঘ্যের ওপর নির্ভর করবেন না',
      'ডিম্বস্ফোটন পরীক্ষা সতর্কতার সঙ্গে ব্যবহার করুন এবং প্রয়োজনে কোনো পেশাজীবীর পরামর্শ নিন',
      'গর্ভবতী হতে চাইলে সংগৃহীত তথ্য স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে ভাগ করুন',
    ],
    section6Body2: 'সংশ্লিষ্ট উপসর্গ লিখে রাখাও কাজে লাগতে পারে: ব্যথা, ব্রণ, শ্লেষ্মার পরিবর্তন, অস্বাভাবিক রক্তপাত, মেজাজ, ঘুম বা অন্য ব্যক্তিগত পর্যবেক্ষণ। এই তথ্য আপনার চক্রের একটি পূর্ণাঙ্গ চিত্র তৈরি করতে সাহায্য করতে পারে।',
    section7Body1: 'চক্র খুব অনিয়মিত বা খুব ফাঁকা ফাঁকা হলে, অথবা দীর্ঘদিন মাসিক না হলে গর্ভধারণের চেষ্টা শুরুর আগেই পরামর্শ নেওয়া কাজে লাগতে পারে।',
    section7Body2: 'স্বাস্থ্যসেবা পেশাজীবী অনিয়মের কারণ অনুসন্ধান করতে, ডিম্বস্ফোটন মূল্যায়ন করতে এবং প্রয়োজনে আপনার গর্ভধারণের পরিকল্পনার উপযোগী কৌশল সুপারিশ করতে পারেন।',
    alert2Title: 'কখন পরামর্শ নেবেন',
    alert2Text: 'আপনার মাসিক খুব ফাঁকা ফাঁকা হলে, কয়েক মাস ধরে মাসিক না হলে, অথবা নিয়মিত যৌনমিলন সত্ত্বেও গর্ভধারণ না হলে স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে কথা বলুন।',
    summaryTitle: 'মূল বিষয়',
    summaryRows: [
      'পিসিওএস চক্রকে দীর্ঘ ও অনিশ্চিত করে তুলতে পারে।',
      'কিছু চক্রে ডিম্বস্ফোটন অনিয়মিত বা অনুপস্থিত হতে পারে।',
      'অনিয়মিত চক্র মানেই স্বয়ংক্রিয়ভাবে প্রজনন ক্ষমতার অভাব নয়।',
      'শুধু ক্যালেন্ডারভিত্তিক পূর্বাভাস পিসিওএসে কম নির্ভরযোগ্য হতে পারে।',
      'নিজের চক্র পর্যবেক্ষণ করা এবং ইতিহাস রাখা কাজে লাগতে পারে, বিশেষ করে পরামর্শের জন্য।',
    ],
    finalTipTitle: 'শেষ কথা',
    finalTipText: 'পিসিওএস প্রতিটি নারীর ক্ষেত্রে একইভাবে প্রকাশ পায় না। সময়ের সঙ্গে আপনার চক্র বদলাতে পারে। ট্র্যাকিং আছে আপনার শরীর কীভাবে কাজ করে তা আরও ভালোভাবে বুঝতে সাহায্য করার জন্য, চিকিৎসা পরামর্শের বিকল্প হিসেবে নয়।',
    disclaimer: 'এই নিবন্ধ শুধুমাত্র তথ্য ও শিক্ষামূলক উদ্দেশ্যে। এটি কোনো চিকিৎসাগত রোগনির্ণয় নয় এবং স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে পরামর্শের বিকল্প নয়।',
    shareMessage: 'পিসিওএসে চক্র, ডিম্বস্ফোটন ও প্রজনন ক্ষমতা — AWA',
  },
  da: {
    badge: 'PCOS',
    title: 'Cyklus, ægløsning\nog fertilitet ved PCOS',
    metaDuration: '8 minutters læsning',
    metaType: 'Guide',
    metaLevel: 'Mellem',
    metaValidated: 'Gennemgået indhold',
    intro: 'Når du har polycystisk ovariesyndrom (PCOS), kan din cyklus være lang, uregelmæssig og svær at forudsige. At forstå, hvad der sker omkring ægløsningen, kan hjælpe dig med at forstå din cyklus og spørgsmål om fertilitet bedre.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvorfor cyklussen bliver uregelmæssig',
      'Hvad der sker omkring ægløsningen',
      'Hvordan du genkender ægløsning',
      'PCOS og fertilitet',
      'Hvorfor apps kan være mindre præcise',
      'At tracke cyklussen med PCOS',
      'Hvornår du bør søge læge, hvis du ønsker at blive gravid',
      'Det vigtigste',
    ],
    section1Body1: 'Menstruationscyklussen afhænger af en koordineret række hormonsignaler. Ved PCOS kan denne organisering forstyrres, særligt i forhold til follikelmodning og ægløsning.',
    section1Body2: 'Æggestokkene kan have mange små follikler, som begynder at vokse, men ingen enkelt follikel modner regelmæssigt. Ægløsningen kan dermed blive forsinket, usikker eller helt udeblive i nogle cyklusser.',
    section1Body3: 'Det er derfor, at nogle med PCOS har cyklusser på 35, 45 dage eller mere, mens andre kan have en cyklus tæt på normal længde.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Cyklussens længde alene fortæller ikke, om ægløsning har fundet sted. To cyklusser af samme længde kan have meget forskellig hormonhistorie.',
    section2Body1: 'Ægløsning er frigivelsen af et æg fra æggestokken. Det sker efter follikelmodningstrinnet og inden den luteale fase i cyklussen.',
    section2Body2: 'I en regelmæssig cyklus sker ægløsning ofte omtrent på midten. Men ved PCOS gælder denne enkle regel ikke altid. Ægløsning kan ske meget sent, eller den kan helt udeblive i en given cyklus.',
    infoTitle: 'Hvorfor det betyder noget',
    infoText: 'Når ægløsningen er usikker, er det svært at anslå det fertile vindue udelukkende ud fra menstruationsdatoer.',
    section3Body1: 'Hormonforandringer omkring ægløsningen kan ledsages af en række fysiske tegn. De kan være nyttige at observere i din cyklus, men intet enkelt tegn bekræfter ægløsning med sikkerhed.',
    ovulationSigns: [
      'Forandringer i livmoderhalsslimet, som kan blive mere rigeligt, klart og stretchbart',
      'Let smerte eller ubehag i den ene side af underlivet hos nogle kvinder',
      'Forandring i kropstemperaturen efter ægløsning',
      'Forandringer i vaginal fugtighed',
      'Øget seksuelt begær hos nogle kvinder',
    ],
    section3Body2: 'Livmoderhalsslimet er særligt værd at observere. Op til den fertile periode kan det blive mere rigeligt, klart, glat og stretchbart. Dets udseende varierer dog fra person til person og fra cyklus til cyklus.',
    alert1Title: 'Vær opmærksom på forudsigelser',
    alert1Text: 'Ved meget uregelmæssige cyklusser kan automatisk beregnede ægløsningsdatoer baseret på tidligere cyklusser være meget omtrentlige. En forudsigelse er ikke en medicinsk bekræftelse af ægløsning.',
    section4Body1: 'PCOS kan gøre det sværere at blive gravid, primært når ægløsningen er sjælden eller svær at forudsige. Men at have PCOS betyder ikke, at du er infertil.',
    section4Body2: 'Nogle kvinder med PCOS ægløser regelmæssigt og bliver gravide uden særlige vanskeligheder. Andre har så uregelmæssig ægløsning, at det kræver udredning og muligvis behandling.',
    fertilityPoints: [
      'PCOS medfører ikke automatisk infertilitet',
      'Den primære udfordring er ofte uregelmæssig eller usikker ægløsning',
      'Ægløsning kan forekomme, selv ved meget lange cyklusser',
      'Relevant behandling kan forbedre chancerne for graviditet',
      'Fertilitetsforløbet afhænger af den enkelte person og mange andre faktorer',
    ],
    section4Body3: 'Fertilitet afhænger heller ikke kun af ægløsning. Alder, partners sædkvalitet, æggeledernes tilstand, livmoderslimhinden og andre faktorer spiller også ind. Er det taget længere tid end ventet at blive gravid, er en samlet udredning vigtig.',
    section5Body1: 'Apps til menstruationstracking bruger typisk data fra tidligere cyklusser til at generere estimater. Hvis din cyklus er nogenlunde regelmæssig, kan disse estimater fungere som en reference.',
    section5Body2: 'Ved PCOS kan variationen i cyklusserne dog gøre disse beregninger mindre pålidelige. En app kan ikke med sikkerhed vide, at ægløsning har fundet sted, blot fordi en teoretisk dato er nået.',
    tip2Title: 'Brug det som en rettesnor',
    tip2Text: 'Digital tracking er mest nyttig til at observere mønstre i din cyklus og til at holde en historik, du kan dele med din sundhedsperson.',
    section6Body1: 'Regelmæssig tracking kan hjælpe dig med bedre at forstå dine personlige variationer. Målet er ikke at gøre cyklussen perfekt forudsigelig, men at indsamle nok data til at genkende mønstre.',
    trackingTips: [
      'Notér den første dag i hver cyklus, selv når de er langt fra hinanden',
      'Observér forandringer i livmoderhalsslimet gennem cyklussen',
      'Notér smerter i underlivet eller andre tegn, der kan ledsage ægløsning',
      'Stol ikke kun på en gennemsnitlig 28-dages cykluslængde til at forudsige ægløsning',
      'Brug ægløsningstests med forsigtighed og søg faglig vejledning om nødvendigt',
      'Del den indsamlede information med din sundhedsperson, hvis du forsøger at blive gravid',
    ],
    section6Body2: 'Det kan også være nyttigt at notere relaterede symptomer: smerter, akne, forandringer i slim, unormal blødning, humør, søvn eller andre personlige observationer. Disse oplysninger kan hjælpe med at skabe et mere fuldstændigt billede af din cyklus.',
    section7Body1: 'Hvis din cyklus er meget uregelmæssig eller sjælden, eller hvis du har haft manglende menstruation i længere tid, kan det være en fordel at søge rådgivning, inden du begynder at forsøge at blive gravid.',
    section7Body2: 'En sundhedsperson kan undersøge årsagerne til uregelmæssighederne, vurdere ægløsning og om nødvendigt anbefale strategier tilpasset din graviditetsplan.',
    alert2Title: 'Hvornår du bør søge rådgivning',
    alert2Text: 'Tal med en sundhedsperson, hvis din menstruation er sjælden, hvis du har haft manglende menstruation i flere måneder, eller hvis du ikke er blevet gravid trods regelmæssig samleje.',
    summaryTitle: 'Det vigtigste',
    summaryRows: [
      'PCOS kan gøre cyklussen lang og uforudsigelig.',
      'Ægløsning kan være uregelmæssig eller udeblive i nogle cyklusser.',
      'En uregelmæssig cyklus betyder ikke automatisk nedsat fertilitet.',
      'Kalenderbaserede forudsigelser alene kan være mindre pålidelige ved PCOS.',
      'At observere sin cyklus og føre en historik kan være nyttigt, særligt til rådgivning.',
    ],
    finalTipTitle: 'Afsluttende bemærkning',
    finalTipText: 'PCOS ytrer sig ikke ens hos alle. Din cyklus kan ændre sig over tid. Tracking er til for at hjælpe dig med bedre at forstå, hvordan din krop fungerer — ikke som et alternativ til medicinsk rådgivning.',
    disclaimer: 'Denne artikel er udelukkende til informations- og uddannelsesformål. Den udgør ikke en medicinsk diagnose og er ikke et alternativ til at konsultere en sundhedsperson.',
    shareMessage: 'Cyklus, ægløsning og fertilitet ved PCOS — AWA',
  },
  sv: {
    badge: 'PCOS',
    title: 'Cyklus, äglösning\nog fertilitet ved PCOS',
    metaDuration: '8 minutters läsning',
    metaType: 'Guide',
    metaLevel: 'Mellem',
    metaValidated: 'Gennemgået indhold',
    intro: 'Når du har polycystisk ovariesyndrom (PCOS), kan din cyklus väre lang, uregelmässig och svär at forudsige. At forstå, hvad der sker omkring äglösningen, kan hjälpe dig med at forstå din cyklus och spörgsmål om fertilitet bedre.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvorfor cyklussen bliver uregelmässig',
      'Hvad der sker omkring äglösningen',
      'Hvordan du genkender äglösning',
      'PCOS och fertilitet',
      'Hvorfor apps kan väre mindre präcise',
      'At tracke cyklussen med PCOS',
      'Hvornår du bör söge läge, hvis du önsker at blive gravid',
      'Det vigtigste',
    ],
    section1Body1: 'Menstruationscyklussen afhänger av en koordineret räkke hormonsignaler. Ved PCOS kan denne organisering forstyrres, särligt i forhold till follikelmodning och äglösning.',
    section1Body2: 'Äggestokkene kan have mange små follikler, som begynder at vokse, men ingen enkelt follikel modner regelmässigt. Äglösningen kan dermed blive forsinket, usikker eller helt udeblive i nogle cyklusser.',
    section1Body3: 'Det ar derfor, at nogle med PCOS har cyklusser på 35, 45 dagar eller mere, mens andre kan have en cyklus tät på normal längde.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Cyklussens längde alene fortäller inte, om äglösning har fundet sted. To cyklusser av samme längde kan have mycket forskellig hormonhistorie.',
    section2Body1: 'Äglösning ar frigivelsen av et äg fran äggestokken. Det sker efter follikelmodningstrinnet och inden den luteale fase i cyklussen.',
    section2Body2: 'I en regelmässig cyklus sker äglösning ofta omtrent på midten. Men ved PCOS gälder denne enkle regel inte altid. Äglösning kan ske mycket sent, eller den kan helt udeblive i en given cyklus.',
    infoTitle: 'Hvorfor det betyder noget',
    infoText: 'Når äglösningen ar usikker, ar det svärt at anslå det fertile vindue udelukkende ud fran menstruationsdatoer.',
    section3Body1: 'Hormonforandringer omkring äglösningen kan ledsages av en räkke fysiske tegn. De kan väre nyttige at observere i din cyklus, men intet enkelt tegn bekräfter äglösning med sikkerhed.',
    ovulationSigns: [
      'Forandringer i livmoderhalsslimet, som kan blive mere rigeligt, klart och stretchbart',
      'Let smarta eller ubehag i den ene side av underlivet hos nogle kvinder',
      'Forandring i kropstemperaturen efter äglösning',
      'Forandringer i vaginal fugtighed',
      'Öget seksuelt begär hos nogle kvinder',
    ],
    section3Body2: 'Livmoderhalsslimet ar särligt värd at observere. Op till den fertile periode kan det blive mere rigeligt, klart, glat och stretchbart. Dets udseende varierer dog fran person till person och fran cyklus till cyklus.',
    alert1Title: 'Vär opmärksom på forudsigelser',
    alert1Text: 'Ved mycket uregelmässige cyklusser kan automatisk beregnede äglösningsdatoer baseret på tidligere cyklusser väre mycket omtrentlige. En forudsigelse ar inte en medicinsk bekräftelse av äglösning.',
    section4Body1: 'PCOS kan göre det svärere at blive gravid, primärt når äglösningen ar själden eller svär at forudsige. Men at have PCOS betyder inte, at du ar infertil.',
    section4Body2: 'Nogle kvinnor med PCOS äglöser regelmässigt och bliver gravide uden särlige vanskeligheder. Andre har så uregelmässig äglösning, at det kräver udredning och muligvis behandling.',
    fertilityPoints: [
      'PCOS medförer inte automatisk infertilitet',
      'Den primäre udfordring ar ofta uregelmässig eller usikker äglösning',
      'Äglösning kan forekomme, selv ved mycket lange cyklusser',
      'Relevant behandling kan forbedre chancerne for graviditet',
      'Fertilitetsforlöbet afhänger av den enkelte person och mange andre faktorer',
    ],
    section4Body3: 'Fertilitet afhänger heller inte kun av äglösning. Alder, partners sädkvalitet, äggeledernes tilstand, livmoderslimhinden och andre faktorer spiller også ind. Er det taget längere tid end ventet at blive gravid, ar en samlet udredning vigtig.',
    section5Body1: 'Apps till menstruationstracking bruger typisk data fran tidligere cyklusser till at generere estimater. Hvis din cyklus ar nogenlunde regelmässig, kan disse estimater fungere som en reference.',
    section5Body2: 'Ved PCOS kan variationen i cyklusserne dog göre disse beregninger mindre pålidelige. En app kan inte med sikkerhed vide, at äglösning har fundet sted, blot fordi en teoretisk dato ar nået.',
    tip2Title: 'Brug det som en rettesnor',
    tip2Text: 'Digital tracking ar mest nyttig till at observere mönstre i din cyklus och till at holde en historik, du kan dele med din halsasperson.',
    section6Body1: 'Regelmässig tracking kan hjälpe dig med bedre at forstå dina personlige variationer. Målet ar inte at göre cyklussen perfekt forudsigelig, men at indsamle nok data till at genkende mönstre.',
    trackingTips: [
      'Notér den förste dag i hver cyklus, selv når de ar langt fran hinanden',
      'Observér forandringer i livmoderhalsslimet gennem cyklussen',
      'Notér smartor i underlivet eller andre tegn, der kan ledsage äglösning',
      'Stol inte kun på en gennemsnitlig 28-dages cykluslängde till at forudsige äglösning',
      'Brug äglösningstests med forsigtighed och sög faglig vejledning om nödvendigt',
      'Del den indsamlede information med din halsasperson, hvis du forsöger at blive gravid',
    ],
    section6Body2: 'Det kan også väre nyttigt at notere relaterede symtom: smerter, akne, forandringer i slim, unormal blödning, humör, sövn eller andre personlige observationer. Disse oplysninger kan hjälpe med at skabe et mere fuldständigt billede av din cyklus.',
    section7Body1: 'Hvis din cyklus ar mycket uregelmässig eller själden, eller hvis du har haft manglende menstruation i längere tid, kan det väre en fordel at söge rådgivning, inden du begynder at forsöge at blive gravid.',
    section7Body2: 'En halsasperson kan undersöge årsagerne till uregelmässighederne, vurdere äglösning och om nödvendigt anbefale strategier tilpasset din graviditetsplan.',
    alert2Title: 'Hvornår du bör söge rådgivning',
    alert2Text: 'Tal med en halsasperson, hvis din menstruation ar själden, hvis du har haft manglende menstruation i flere måneder, eller hvis du inte ar blevet gravid trods regelmässig samleje.',
    summaryTitle: 'Det vigtigste',
    summaryRows: [
      'PCOS kan göre cyklussen lang och uforudsigelig.',
      'Äglösning kan väre uregelmässig eller udeblive i nogle cyklusser.',
      'En uregelmässig cyklus betyder inte automatisk nedsat fertilitet.',
      'Kalenderbaserede forudsigelser alene kan väre mindre pålidelige ved PCOS.',
      'At observere sin cyklus och före en historik kan väre nyttigt, särligt till rådgivning.',
    ],
    finalTipTitle: 'Afsluttende bemärkning',
    finalTipText: 'PCOS ytrer sig inte ens hos alle. Din cyklus kan ändre sig over tid. Tracking ar till for att hjälpe dig med bedre at forstå, hvordan din krop fungerer — inte som et alternativ till medicinsk rådgivning.',
    disclaimer: 'Denne artikel ar udelukkende till informations- och uddannelsesformål. Den udgör inte en medicinsk diagnose och ar inte et alternativ till at konsultere en halsasperson.',
    shareMessage: 'Cyklus, äglösning och fertilitet ved PCOS — AWA',
  },
  nb: {
    badge: 'PCOS',
    title: 'Syklus, eggløsning\nog fruktbarhet ved PCOS',
    metaDuration: '8 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Middels',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Med PCOS kan syklusen bli lang, uregelmessig og noen ganger vanskelig å forutsi. Å forstå hva som skjer rundt eggløsningen kan hjelpe deg å få mening i syklusen din og forstå spørsmål om fruktbarhet bedre.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hvorfor syklusen blir uregelmessig',
      'Hva som skjer rundt eggløsningen',
      'Hvordan du kjenner igjen eggløsning',
      'PCOS og fruktbarhet',
      'Hvorfor apper kan være mindre nøyaktige',
      'Følge syklusen din med PCOS',
      'Når du bør gå til lege hvis du vil bli gravid',
      'Det viktigste å huske',
    ],
    section1Body1: 'Menstruasjonssyklusen avhenger av en koordinert rekke hormonelle signaler. Ved PCOS kan denne organiseringen forstyrres, særlig i follikkelutviklingen og eggløsningen.',
    section1Body2: 'Eggstokkene kan inneholde mange små follikler som begynner å utvikle seg uten at en dominerende follikkel regelmessig når modenhet. Eggløsningen kan da bli forsinket, skje uforutsigbart eller utebli helt i visse sykluser.',
    section1Body3: 'Dette er en av grunnene til at noen med PCOS har sykluser på 35, 45 eller noen ganger flere dager, mens andre kan ha sykluser nærmere en typisk lengde.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Sykluslengden alene forteller ikke om det har vært eggløsning. To sykluser av samme lengde kan ha en ulik hormonell historie.',
    section2Body1: 'Eggløsning er frigjøringen av et egg fra en eggstokk. Den følger etter en fase med follikkelmodning og går foran syklusens lutealfase.',
    section2Body2: 'I en regelmessig syklus skjer eggløsningen ofte omtrent midt i. Men ved PCOS gjelder ikke alltid denne enkle regelen. Eggløsningen kan komme mye senere eller ikke skje i det hele tatt i en gitt syklus.',
    infoTitle: 'Hvorfor dette er viktig',
    infoText: 'Når eggløsningen er uforutsigbar, blir det vanskeligere å anslå det fruktbare vinduet ut fra mensdatoene alene.',
    section3Body1: 'Flere kroppslige tegn kan følge de hormonelle endringene rundt eggløsningen. De kan være nyttige for å observere din egen syklus, men intet enkelt tegn kan bekrefte eggløsning med sikkerhet.',
    ovulationSigns: [
      'En endring i livmorhalsslimet, som kan bli mer rikelig, klart og strekkbart',
      'Lett bekkensmerte eller ubehag hos noen kvinner',
      'En endring i kroppstemperaturen etter eggløsningen',
      'En endring i hvor fuktig det er i skjeden',
      'En mulig økning i sexlyst hos noen kvinner',
    ],
    section3Body2: 'Livmorhalsslimet er særlig verdt å observere. Når det fruktbare vinduet nærmer seg, kan det bli mer rikelig, klart, glatt og strekkbart. Utseendet kan imidlertid variere fra person til person og fra syklus til syklus.',
    alert1Title: 'Vær forsiktig med prediksjoner',
    alert1Text: 'Ved svært uregelmessige sykluser kan en eggløsningsdato som er beregnet automatisk ut fra tidligere sykluser, være svært omtrentlig. En prediksjon er ikke en medisinsk bekreftelse på eggløsning.',
    section4Body1: 'PCOS kan gjøre det vanskeligere å bli gravid, hovedsakelig når eggløsningen er sjelden eller vanskelig å forutsi. Men å ha PCOS betyr ikke å være infertil.',
    section4Body2: 'Noen kvinner med PCOS har regelmessig eggløsning og blir gravide uten spesielle vanskeligheter. For andre er eggløsningen så uregelmessig at den bør utredes og eventuelt behandles medisinsk.',
    fertilityPoints: [
      'PCOS fører ikke automatisk til infertilitet',
      'Hovedvanskeligheten er ofte uregelmessig eller uforutsigbar eggløsning',
      'Eggløsning kan forekomme selv når syklusene er svært lange',
      'Passende oppfølging kan øke sjansene for å bli gravid',
      'Reisen mot å bli gravid avhenger av hver enkelt og mange andre faktorer',
    ],
    section4Body3: 'Fruktbarheten avhenger heller ikke av eggløsning alene. Alder, partnerens sædkvalitet, tilstanden til eggledere, livmorslimhinnen og andre faktorer kan også spille en rolle. Derfor er en helhetlig utredning viktig når det tar lengre tid enn forventet å bli gravid.',
    section5Body1: 'Apper for menstruasjonssporing bruker vanligvis data fra tidligere sykluser til å lage estimater. Når syklusene er relativt regelmessige, kan disse estimatene være nyttige som en referanse.',
    section5Body2: 'Ved PCOS kan imidlertid variasjonen i syklusen gjøre disse beregningene mindre pålitelige. En app kan ikke vite sikkert at eggløsningen har funnet sted bare fordi en teoretisk dato er nådd.',
    tip2Title: 'Bruk den som et referansepunkt',
    tip2Text: 'Digital sporing er mest nyttig for å observere trender i din egen syklus og føre en historikk du kan dele med helsepersonellet ditt.',
    section6Body1: 'Regelmessig sporing kan hjelpe deg å forstå dine personlige variasjoner bedre. Målet er ikke å gjøre syklusen helt forutsigbar, men å samle nok informasjon til å se trender.',
    trackingTips: [
      'Noter datoen for første dag i hver syklus, selv når syklusene ligger langt fra hverandre',
      'Observer endringer i livmorhalsslimet gjennom syklusen',
      'Noter bekkensmerter eller andre tegn som kan følge eggløsningen',
      'Unngå å støtte deg bare på en gjennomsnittlig lengde på 28 dager for å forutsi eggløsning',
      'Bruk eggløsningstester med forsiktighet og be om råd fra en fagperson ved behov',
      'Del informasjonen du samler, med helsepersonell hvis du vil bli gravid',
    ],
    section6Body2: 'Det kan også hjelpe å notere tilhørende symptomer: smerte, akne, endringer i slimet, uvanlig blødning, humør, søvn eller andre personlige observasjoner. Denne informasjonen kan bidra til å bygge et mer fullstendig bilde av syklusen din.',
    section7Body1: 'En konsultasjon kan være verdt det allerede før du begynner å prøve å bli gravid, når syklusene er svært uregelmessige, svært spredte, eller når mensen uteblir lenge.',
    section7Body2: 'Helsepersonell kan undersøke årsakene til uregelmessighetene, vurdere eggløsningen og, om nødvendig, foreslå en strategi som passer planene dine om graviditet.',
    alert2Title: 'Når du bør søke råd',
    alert2Text: 'Hvis mensen ligger svært langt fra hverandre, hvis du ikke har hatt mens på flere måneder, eller hvis du ikke blir gravid til tross for regelmessig samleie, bør du snakke med helsepersonell.',
    summaryTitle: 'Hovedpunkter',
    summaryRows: [
      'PCOS kan gjøre syklusene lange og uforutsigbare.',
      'Eggløsningen kan være uregelmessig eller utebli i noen sykluser.',
      'En uregelmessig syklus betyr ikke automatisk manglende fruktbarhet.',
      'Prediksjoner som bygger bare på kalenderen, kan være mindre pålitelige ved PCOS.',
      'Å observere syklusen og føre en historikk kan være nyttig, særlig til en konsultasjon.',
    ],
    finalTipTitle: 'Et siste ord',
    finalTipText: 'PCOS viser seg ikke likt hos alle kvinner. Syklusen din kan endre seg over tid. Sporingen er der for å hjelpe deg å forstå bedre hvordan kroppen din fungerer, ikke for å erstatte medisinsk rådgivning.',
    disclaimer: 'Denne artikkelen er kun til informasjon og opplæring. Den utgjør ikke en medisinsk diagnose og erstatter ikke en konsultasjon hos helsepersonell.',
    shareMessage: 'Syklus, eggløsning og fruktbarhet ved PCOS – AWA',
  },
  pl: {
    badge: 'PCOS',
    title: 'Cykl, owulacja\ni płodność w PCOS',
    metaDuration: '8 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Średnio zaawansowany',
    metaValidated: 'Treść zweryfikowana',
    intro: 'W PCOS Twój cykl może stać się długi, nieregularny i czasem trudny do przewidzenia. Zrozumienie tego, co dzieje się wokół owulacji, może pomóc zrozumieć własny cykl i lepiej pojąć pytania związane z płodnością.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Dlaczego cykl staje się nieregularny',
      'Co dzieje się wokół owulacji',
      'Jak rozpoznać owulację',
      'PCOS a płodność',
      'Dlaczego aplikacje mogą być mniej dokładne',
      'Śledzenie cyklu w PCOS',
      'Kiedy zgłosić się do lekarza, jeśli chcesz zajść w ciążę',
      'Najważniejsze wnioski',
    ],
    section1Body1: 'Cykl menstruacyjny zależy od skoordynowanej sekwencji sygnałów hormonalnych. W PCOS ta organizacja może być zaburzona, zwłaszcza w rozwoju pęcherzyków i owulacji.',
    section1Body2: 'Jajniki mogą zawierać wiele małych pęcherzyków, które zaczynają się rozwijać, bez regularnego dojrzewania pęcherzyka dominującego. Owulacja może być wtedy opóźniona, występować nieprzewidywalnie lub w niektórych cyklach w ogóle nie następować.',
    section1Body3: 'To jeden z powodów, dla których niektóre osoby z PCOS mają cykle trwające 35, 45, a czasem więcej dni, podczas gdy u innych cykle mogą być zbliżone do typowej długości.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Sama długość cyklu nie mówi, czy nastąpiła owulacja. Dwa cykle tej samej długości mogą mieć inną historię hormonalną.',
    section2Body1: 'Owulacja to uwolnienie komórki jajowej z jajnika. Następuje po fazie dojrzewania pęcherzyka i poprzedza fazę lutealną cyklu.',
    section2Body2: 'W regularnym cyklu owulacja przypada często mniej więcej w połowie. Przy PCOS ta prosta zasada nie zawsze się sprawdza. Owulacja może nastąpić znacznie później lub w danym cyklu w ogóle się nie zdarzyć.',
    infoTitle: 'Dlaczego to ważne',
    infoText: 'Gdy owulacja jest nieprzewidywalna, trudniej oszacować okno płodności wyłącznie na podstawie dat miesiączek.',
    section3Body1: 'Istnieje kilka objawów fizycznych, które mogą towarzyszyć zmianom hormonalnym wokół owulacji. Mogą być przydatne do obserwacji własnego cyklu, ale żaden pojedynczy objaw nie potwierdza owulacji z pewnością.',
    ovulationSigns: [
      'Zmiana śluzu szyjkowego, który może stać się obfitszy, przejrzysty i rozciągliwy',
      'Łagodny ból lub dyskomfort w miednicy u niektórych kobiet',
      'Zmiana temperatury ciała po owulacji',
      'Zmiana wilgotności pochwy',
      'Możliwy wzrost libido u niektórych kobiet',
    ],
    section3Body2: 'Szczególnie warto obserwować śluz szyjkowy. W miarę zbliżania się okna płodności może stać się obfitszy, przejrzysty, śliski i rozciągliwy. Jego wygląd może się jednak różnić u poszczególnych osób i w kolejnych cyklach.',
    alert1Title: 'Ostrożnie z prognozami',
    alert1Text: 'Przy bardzo nieregularnych cyklach data owulacji obliczona automatycznie na podstawie poprzednich cykli może być bardzo przybliżona. Prognoza nie jest medycznym potwierdzeniem owulacji.',
    section4Body1: 'PCOS może utrudniać poczęcie, głównie gdy owulacja jest rzadka lub trudna do przewidzenia. Posiadanie PCOS nie oznacza jednak niepłodności.',
    section4Body2: 'Niektóre kobiety z PCOS owulują regularnie i zachodzą w ciążę bez szczególnych trudności. U innych owulacja jest na tyle nieregularna, że wymaga oceny i ewentualnie opieki medycznej.',
    fertilityPoints: [
      'PCOS nie powoduje automatycznie niepłodności',
      'Główną trudnością jest często nieregularna lub nieprzewidywalna owulacja',
      'Owulacja może wystąpić nawet przy bardzo długich cyklach',
      'Odpowiednia opieka może zwiększyć szanse na poczęcie',
      'Droga do poczęcia zależy od każdej osoby i wielu innych czynników',
    ],
    section4Body3: 'Płodność nie zależy też wyłącznie od owulacji. Rolę mogą odgrywać również wiek, jakość nasienia partnera, stan jajowodów, endometrium i inne czynniki. Dlatego kompleksowa ocena jest ważna, gdy ciąża trwa dłużej, niż się spodziewano.',
    section5Body1: 'Aplikacje do śledzenia miesiączek zazwyczaj wykorzystują dane z poprzednich cykli do tworzenia szacunków. Gdy cykle są stosunkowo regularne, te szacunki mogą być użytecznym punktem odniesienia.',
    section5Body2: 'Przy PCOS zmienność cyklu może jednak sprawić, że te obliczenia są mniej wiarygodne. Aplikacja nie może mieć pewności, że owulacja nastąpiła, tylko dlatego że minęła teoretyczna data.',
    tip2Title: 'Traktuj to jako punkt odniesienia',
    tip2Text: 'Cyfrowe śledzenie jest najbardziej przydatne do obserwowania trendów we własnym cyklu i prowadzenia historii, którą możesz pokazać swojemu lekarzowi.',
    section6Body1: 'Regularne śledzenie może pomóc lepiej zrozumieć własne wahania. Celem nie jest uczynienie cyklu idealnie przewidywalnym, lecz zebranie wystarczającej ilości informacji, by dostrzec trendy.',
    trackingTips: [
      'Zapisuj datę pierwszego dnia każdego cyklu, nawet gdy cykle są bardzo oddalone',
      'Obserwuj zmiany śluzu szyjkowego w trakcie cyklu',
      'Zapisuj ból miednicy i inne objawy, które mogą towarzyszyć owulacji',
      'Nie opieraj się wyłącznie na średniej długości 28 dni, by przewidzieć owulację',
      'Ostrożnie stosuj testy owulacyjne i w razie potrzeby poproś specjalistę o poradę',
      'Dziel się zebranymi informacjami ze specjalistą, jeśli chcesz zajść w ciążę',
    ],
    section6Body2: 'Pomocne może być też zapisywanie towarzyszących objawów: bólu, trądziku, zmian śluzu, nietypowych krwawień, nastroju, snu lub innych osobistych obserwacji. Te informacje mogą pomóc stworzyć pełniejszy obraz Twojego cyklu.',
    section7Body1: 'Wizyta może być wskazana jeszcze przed rozpoczęciem starań o dziecko, gdy cykle są bardzo nieregularne, bardzo oddalone lub gdy miesiączek nie ma przez dłuższy czas.',
    section7Body2: 'Specjalista może zbadać przyczyny nieregularności, ocenić owulację i w razie potrzeby zaproponować strategię dopasowaną do Twoich planów dotyczących ciąży.',
    alert2Title: 'Kiedy zasięgnąć porady',
    alert2Text: 'Jeśli Twoje miesiączki są bardzo oddalone, jeśli nie miałaś miesiączki od kilku miesięcy lub jeśli ciąża nie następuje mimo regularnego współżycia, porozmawiaj ze specjalistą.',
    summaryTitle: 'Najważniejsze punkty',
    summaryRows: [
      'PCOS może sprawiać, że cykle są długie i nieprzewidywalne.',
      'Owulacja może być nieregularna lub w niektórych cyklach nie występować.',
      'Nieregularny cykl nie oznacza automatycznie braku płodności.',
      'Prognozy oparte wyłącznie na kalendarzu mogą być mniej wiarygodne przy PCOS.',
      'Obserwowanie cyklu i prowadzenie historii może być przydatne, zwłaszcza podczas wizyty.',
    ],
    finalTipTitle: 'Na koniec',
    finalTipText: 'PCOS nie objawia się tak samo u każdej kobiety. Twój cykl może zmieniać się w czasie. Śledzenie ma pomóc lepiej zrozumieć, jak działa Twoje ciało, a nie zastąpić poradę medyczną.',
    disclaimer: 'Ten artykuł ma charakter wyłącznie informacyjny i edukacyjny. Nie stanowi diagnozy medycznej i nie zastępuje konsultacji ze specjalistą.',
    shareMessage: 'Cykl, owulacja i płodność w PCOS — AWA',
  },
  uk: {
    badge: 'СПКЯ',
    title: 'Цикл, овуляція\nта фертильність при СПКЯ',
    metaDuration: '8 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Середній',
    metaValidated: 'Перевірений вміст',
    intro: 'При СПКЯ ваш цикл може ставати довгим, нерегулярним і іноді важко передбачуваним. Розуміння того, що відбувається навколо овуляції, може допомогти осмислити власний цикл і краще зрозуміти питання, пов’язані з фертильністю.',
    contentsTitle: 'У цій статті',
    topics: [
      'Чому цикл стає нерегулярним',
      'Що відбувається навколо овуляції',
      'Як розпізнати овуляцію',
      'СПКЯ та фертильність',
      'Чому застосунки можуть бути менш точними',
      'Відстеження циклу при СПКЯ',
      'Коли звертатися до лікаря, якщо ви хочете завагітніти',
      'Головні висновки',
    ],
    section1Body1: 'Менструальний цикл залежить від скоординованої послідовності гормональних сигналів. При СПКЯ ця організація може бути порушена, зокрема в розвитку фолікулів та овуляції.',
    section1Body2: 'Яєчники можуть містити багато дрібних фолікулів, які починають розвиватися без регулярного дозрівання домінантного фолікула. Овуляція тоді може затримуватися, відбуватися непередбачувано або в деяких циклах узагалі не відбуватися.',
    section1Body3: 'Це одна з причин, чому в деяких людей із СПКЯ цикли тривають 35, 45 або іноді більше днів, тоді як в інших цикли можуть бути ближчими до типової тривалості.',
    tip1Title: 'Варто знати',
    tip1Text: 'Сама тривалість циклу не говорить про те, чи відбулася овуляція. Два цикли однакової тривалості можуть мати різну гормональну історію.',
    section2Body1: 'Овуляція — це вихід яйцеклітини з яєчника. Вона настає після фази дозрівання фолікула й передує лютеїновій фазі циклу.',
    section2Body2: 'У регулярному циклі овуляція часто припадає приблизно на середину. Але при СПКЯ це просте правило не завжди діє. Овуляція може відбутися набагато пізніше або в певному циклі взагалі не відбутися.',
    infoTitle: 'Чому це важливо',
    infoText: 'Коли овуляція непередбачувана, важче оцінити фертильне вікно лише за датами менструацій.',
    section3Body1: 'Існує кілька фізичних ознак, що можуть супроводжувати гормональні зміни навколо овуляції. Вони можуть бути корисними для спостереження за власним циклом, але жодна окрема ознака не підтверджує овуляції з певністю.',
    ovulationSigns: [
      'Зміна цервікального слизу, який може ставати рясніший, прозорий і тягучий',
      'Легкий біль або дискомфорт у тазі в деяких жінок',
      'Зміна температури тіла після овуляції',
      'Зміна вологості піхви',
      'Можливе підвищення лібідо в деяких жінок',
    ],
    section3Body2: 'За цервікальним слизом особливо варто спостерігати. У міру наближення фертильного вікна він може ставати рясніший, прозорий, слизький і тягучий. Проте його вигляд може різнитися в різних людей і від циклу до циклу.',
    alert1Title: 'Обережно з прогнозами',
    alert1Text: 'За дуже нерегулярних циклів дата овуляції, обчислена автоматично на основі попередніх циклів, може бути дуже приблизною. Прогноз не є медичним підтвердженням овуляції.',
    section4Body1: 'СПКЯ може ускладнювати зачаття, головним чином коли овуляція рідка або важко передбачувана. Проте наявність СПКЯ не означає безпліддя.',
    section4Body2: 'Деякі жінки з СПКЯ овулюють регулярно й зачинають без особливих труднощів. В інших овуляція настільки нерегулярна, що потребує оцінки й, можливо, медичної допомоги.',
    fertilityPoints: [
      'СПКЯ автоматично не спричиняє безпліддя',
      'Головна труднощі — часто нерегулярна або непередбачувана овуляція',
      'Овуляція може відбуватися навіть за дуже довгих циклів',
      'Відповідний догляд може підвищити шанси на зачаття',
      'Шлях до зачаття залежить від кожної людини та багатьох інших чинників',
    ],
    section4Body3: 'Фертильність також не залежить лише від овуляції. Роль можуть відігравати вік, якість сперми партнера, стан маткових труб, ендометрій та інші чинники. Тому комплексна оцінка важлива, коли вагітність настає довше, ніж очікувалося.',
    section5Body1: 'Застосунки для відстеження менструацій зазвичай використовують дані попередніх циклів для створення оцінок. Коли цикли відносно регулярні, ці оцінки можуть бути корисним орієнтиром.',
    section5Body2: 'При СПКЯ, проте, мінливість циклу може робити ці обчислення менш надійними. Застосунок не може бути певним, що овуляція відбулася, лише тому що настала теоретична дата.',
    tip2Title: 'Сприймайте це як орієнтир',
    tip2Text: 'Цифрове відстеження найкорисніше для спостереження за тенденціями у власному циклі й ведення історії, яку можна показати лікареві.',
    section6Body1: 'Регулярне відстеження може допомогти краще зрозуміти власні коливання. Мета — не зробити цикл ідеально передбачуваним, а зібрати достатньо інформації, щоб помітити тенденції.',
    trackingTips: [
      'Записуйте дату першого дня кожного циклу, навіть коли цикли дуже віддалені',
      'Спостерігайте зміни цервікального слизу протягом циклу',
      'Записуйте біль у тазі та інші ознаки, що можуть супроводжувати овуляцію',
      'Не спирайтеся лише на середню тривалість 28 днів для передбачення овуляції',
      'Обережно користуйтеся овуляційними тестами й за потреби попросіть поради фахівця',
      'Діліться зібраною інформацією з медичним фахівцем, якщо хочете завагітніти',
    ],
    section6Body2: 'Також може бути корисно записувати супутні симптоми: біль, акне, зміни слизу, нетипові кровотечі, настрій, сон чи інші особисті спостереження. Ця інформація може допомогти скласти повнішу картину вашого циклу.',
    section7Body1: 'Консультація може бути доречною ще до початку спроб завагітніти, коли цикли дуже нерегулярні, дуже віддалені або коли менструації відсутні тривалий час.',
    section7Body2: 'Медичний фахівець може дослідити причини нерегулярності, оцінити овуляцію і, за потреби, запропонувати стратегію, що відповідає вашим планам щодо вагітності.',
    alert2Title: 'Коли звертатися за порадою',
    alert2Text: 'Якщо ваші менструації дуже віддалені, якщо у вас не було менструації кілька місяців або якщо вагітність не настає попри регулярні статеві акти, поговоріть із медичним фахівцем.',
    summaryTitle: 'Основні моменти',
    summaryRows: [
      'СПКЯ може робити цикли довгими й непередбачуваними.',
      'Овуляція може бути нерегулярною або в деяких циклах відсутньою.',
      'Нерегулярний цикл автоматично не означає відсутності фертильності.',
      'Прогнози, засновані лише на календарі, можуть бути менш надійними при СПКЯ.',
      'Спостереження за циклом і ведення історії можуть бути корисними, особливо для консультації.',
    ],
    finalTipTitle: 'Наостанок',
    finalTipText: 'СПКЯ проявляється не однаково в кожної жінки. Ваш цикл може змінюватися з часом. Відстеження існує, щоб допомогти краще зрозуміти, як працює ваше тіло, а не замінити медичну пораду.',
    disclaimer: 'Ця стаття має виключно інформаційний та навчальний характер. Вона не є медичним діагнозом і не замінює консультації з медичним фахівцем.',
    shareMessage: 'Цикл, овуляція та фертильність при СПКЯ — AWA',
  },
  cs: {
    badge: 'PCOS',
    title: 'Cyklus, ovulace\na plodnost při PCOS',
    metaDuration: '8 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Pokročilý',
    metaValidated: 'Ověřený obsah',
    intro: 'Při PCOS se váš cyklus může stát dlouhým, nepravidelným a někdy těžko předvídatelným. Pochopení toho, co se děje kolem ovulace, vám může pomoci porozumět svému cyklu a lépe pochopit otázky týkající se plodnosti.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Proč se cyklus stává nepravidelným',
      'Co se děje kolem ovulace',
      'Jak ovulaci rozpoznat',
      'PCOS a plodnost',
      'Proč mohou být aplikace méně přesné',
      'Sledování cyklu při PCOS',
      'Kdy navštívit lékaře, pokud chcete otěhotnět',
      'Hlavní poznatky',
    ],
    section1Body1: 'Menstruační cyklus závisí na koordinovaném sledu hormonálních signálů. Při PCOS může být tato organizace narušena, zejména ve vývoji folikulů a v ovulaci.',
    section1Body2: 'Vaječníky mohou obsahovat mnoho malých folikulů, které se začínají vyvíjet, aniž by dominantní folikul pravidelně dosáhl zralosti. Ovulace se pak může zpozdit, nastat nepředvídatelně, nebo během některých cyklů nenastat vůbec.',
    section1Body3: 'To je jeden z důvodů, proč mají některé ženy s PCOS cykly dlouhé 35, 45 nebo někdy více dní, zatímco jiné mohou mít cykly blížící se typické délce.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Samotná délka cyklu neříká, zda proběhla ovulace. Dva cykly stejné délky mohou mít odlišný hormonální příběh.',
    section2Body1: 'Ovulace je uvolnění vajíčka z vaječníku. Následuje po fázi zrání folikulů a předchází luteální fázi cyklu.',
    section2Body2: 'V pravidelném cyklu připadá ovulace často přibližně na jeho střed. Při PCOS však toto jednoduché pravidlo nemusí vždy platit. Ovulace může být mnohem pozdější, nebo v daném cyklu nenastat vůbec.',
    infoTitle: 'Proč na tom záleží',
    infoText: 'Když je ovulace nepředvídatelná, je těžší odhadnout plodné období jen podle dat menstruací.',
    section3Body1: 'Existuje několik tělesných příznaků, které mohou provázet hormonální změny kolem ovulace. Mohou být užitečné pro pozorování vlastního cyklu, ale žádný jednotlivý příznak nemůže ovulaci s jistotou potvrdit.',
    ovulationSigns: [
      'Změna cervikálního hlenu, který může být hojnější, čirý a tažný',
      'Mírná bolest nebo nepohodlí v pánvi u některých žen',
      'Změna tělesné teploty po ovulaci',
      'Změna vlhkosti v pochvě',
      'Možné zvýšení libida u některých žen',
    ],
    section3Body2: 'Cervikální hlen stojí za zvláštní pozorování. S blížícím se plodným obdobím může být hojnější, čirý, kluzký a tažný. Jeho vzhled se však může lišit od ženy k ženě i od cyklu k cyklu.',
    alert1Title: 'Opatrně s předpověďmi',
    alert1Text: 'U velmi nepravidelných cyklů může být datum ovulace automaticky vypočítané z předchozích cyklů velmi přibližné. Předpověď není lékařským potvrzením ovulace.',
    section4Body1: 'PCOS může početí ztížit, zejména pokud je ovulace vzácná nebo těžko předvídatelná. Mít PCOS však neznamená být neplodná.',
    section4Body2: 'Některé ženy s PCOS ovulují pravidelně a otěhotní bez zvláštních potíží. U jiných je ovulace natolik nepravidelná, že vyžaduje vyšetření a případně lékařskou péči.',
    fertilityPoints: [
      'PCOS automaticky nezpůsobuje neplodnost',
      'Hlavním problémem bývá často nepravidelná nebo nepředvídatelná ovulace',
      'Ovulace může nastat i při velmi dlouhých cyklech',
      'Vhodná péče může zlepšit šance na početí',
      'Cesta k plodnosti závisí na každé ženě a na mnoha dalších faktorech',
    ],
    section4Body3: 'Plodnost také nezávisí jen na ovulaci. Roli mohou hrát i věk, kvalita spermií partnera, stav vejcovodů, endometrium a další faktory. Proto je důležité komplexní vyšetření, když těhotenství trvá déle, než se očekávalo.',
    section5Body1: 'Aplikace ke sledování menstruace obecně používají data z předchozích cyklů k vytvoření odhadů. Když jsou cykly relativně pravidelné, mohou být tyto odhady užitečné jako reference.',
    section5Body2: 'Při PCOS však může proměnlivost cyklu tyto výpočty činit méně spolehlivými. Aplikace nemůže s jistotou vědět, že ovulace proběhla, jen proto, že nastalo teoretické datum.',
    tip2Title: 'Používejte to jako orientační bod',
    tip2Text: 'Digitální sledování je nejužitečnější pro pozorování trendů ve vlastním cyklu a vedení historie, kterou lze sdílet se zdravotnickým pracovníkem.',
    section6Body1: 'Pravidelné sledování vám může pomoci lépe pochopit své osobní odchylky. Cílem není učinit cyklus dokonale předvídatelným, ale shromáždit dostatek informací k rozpoznání trendů.',
    trackingTips: [
      'Poznamenávejte si datum prvního dne každého cyklu, i když jsou cykly velmi řídké',
      'Pozorujte změny cervikálního hlenu v průběhu cyklu',
      'Zaznamenávejte případnou bolest v pánvi nebo jiné příznaky, které mohou ovulaci provázet',
      'Nespoléhejte jen na průměrnou délku 28 dní při předpovídání ovulace',
      'Používejte ovulační testy opatrně a v případě potřeby požádejte odborníka o radu',
      'Sdílejte shromážděné informace se zdravotnickým pracovníkem, pokud chcete otěhotnět',
    ],
    section6Body2: 'Může také pomoci zaznamenávat související příznaky: bolest, akné, změny hlenu, neobvyklé krvácení, náladu, spánek nebo jiná osobní pozorování. Tyto informace mohou pomoci vytvořit úplnější obraz o vašem cyklu.',
    section7Body1: 'Konzultace může být přínosná i před zahájením snahy o početí, když jsou cykly velmi nepravidelné, velmi řídké, nebo když menstruace dlouho chybí.',
    section7Body2: 'Zdravotnický pracovník může zjišťovat příčiny nepravidelností, posoudit ovulaci a v případě potřeby navrhnout strategii odpovídající vašim plánům na těhotenství.',
    alert2Title: 'Kdy vyhledat radu',
    alert2Text: 'Pokud je vaše menstruace velmi řídká, pokud jste několik měsíců neměla menstruaci, nebo pokud k otěhotnění nedochází navzdory pravidelnému styku, promluvte si se zdravotnickým pracovníkem.',
    summaryTitle: 'Klíčové body',
    summaryRows: [
      'PCOS může činit cykly dlouhými a nepředvídatelnými.',
      'Ovulace může být nepravidelná nebo v některých cyklech chybět.',
      'Nepravidelný cyklus automaticky neznamená nedostatek plodnosti.',
      'Předpovědi založené pouze na kalendáři mohou být při PCOS méně spolehlivé.',
      'Pozorování cyklu a vedení historie mohou být užitečné, zejména pro konzultaci.',
    ],
    finalTipTitle: 'Poslední slovo',
    finalTipText: 'PCOS se neprojevuje u každé ženy stejně. Váš cyklus se může v čase měnit. Sledování je tu proto, aby vám pomohlo lépe pochopit, jak vaše tělo funguje, nikoli aby nahradilo lékařskou radu.',
    disclaimer: 'Tento článek je určen pouze pro informační a vzdělávací účely. Nepředstavuje lékařskou diagnózu a nenahrazuje konzultaci se zdravotnickým pracovníkem.',
    shareMessage: 'Cyklus, ovulace a plodnost při PCOS — AWA',
  },
  sk: {
    badge: 'PCOS',
    title: 'Cyklus, ovulácia\na plodnosť pri PCOS',
    metaDuration: '8 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Stredne pokročilý',
    metaValidated: 'Overený obsah',
    intro: 'Pri PCOS sa váš cyklus môže stať dlhým, nepravidelným a niekedy ťažko predvídateľným. Pochopenie toho, čo sa deje okolo ovulácie, vám môže pomôcť zorientovať sa vo vlastnom cykle a lepšie porozumieť otázkam súvisiacim s plodnosťou.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Prečo sa cyklus stáva nepravidelným',
      'Čo sa deje okolo ovulácie',
      'Ako rozpoznať ovuláciu',
      'PCOS a plodnosť',
      'Prečo môžu byť aplikácie menej presné',
      'Sledovanie cyklu pri PCOS',
      'Kedy navštíviť lekára, ak chcete počať',
      'Hlavné body',
    ],
    section1Body1: 'Menštruačný cyklus závisí od koordinovanej sekvencie hormonálnych signálov. Pri PCOS môže byť táto organizácia narušená, najmä vo vývoji folikulov a ovulácii.',
    section1Body2: 'Vaječníky môžu obsahovať mnoho malých folikulov, ktoré sa začínajú vyvíjať bez toho, aby dominantný folikul pravidelne dozrel. Ovulácia sa potom môže oneskoriť, nastať nepredvídateľne alebo v niektorých cykloch nenastať vôbec.',
    section1Body3: 'To je jeden z dôvodov, prečo majú niektoré ženy s PCOS cykly dlhé 35, 45 alebo niekedy viac dní, zatiaľ čo iné môžu mať cykly bližšie k typickej dĺžke.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Samotná dĺžka cyklu nehovorí o tom, či nastala ovulácia. Dva cykly rovnakej dĺžky môžu mať odlišný hormonálny príbeh.',
    section2Body1: 'Ovulácia je uvoľnenie vajíčka z vaječníka. Nasleduje po fáze dozrievania folikulu a predchádza luteálnu fázu cyklu.',
    section2Body2: 'V pravidelnom cykle je ovulácia často okolo jeho stredu. Pri PCOS však toto jednoduché pravidlo neplatí vždy. Ovulácia môže byť oveľa neskôr alebo v danom cykle nenastať vôbec.',
    infoTitle: 'Prečo na tom záleží',
    infoText: 'Keď je ovulácia nepredvídateľná, je ťažšie odhadnúť plodné okno len podľa dátumov menštruácie.',
    section3Body1: 'Existuje niekoľko telesných znakov, ktoré môžu sprevádzať hormonálne zmeny okolo ovulácie. Môžu byť užitočné na sledovanie vlastného cyklu, ale žiadny jednotlivý znak nemôže ovuláciu potvrdiť s istotou.',
    ovulationSigns: [
      'Zmena cervikálneho hlienu, ktorý môže byť hojnejší, číry a ťahavý',
      'Mierna panvová bolesť alebo nepohodlie u niektorých žien',
      'Zmena telesnej teploty po ovulácii',
      'Zmena vaginálnej vlhkosti',
      'Možný nárast libida u niektorých žien',
    ],
    section3Body2: 'Cervikálny hlien stojí za osobitné sledovanie. S blížiacim sa plodným oknom môže byť hojnejší, číry, klzký a ťahavý. Jeho vzhľad sa však môže líšiť od ženy k žene a z cyklu na cyklus.',
    alert1Title: 'Pozor na predpovede',
    alert1Text: 'Pri veľmi nepravidelných cykloch môže byť dátum ovulácie automaticky vypočítaný z predchádzajúcich cyklov veľmi približný. Predpoveď nie je lekárskym potvrdením ovulácie.',
    section4Body1: 'PCOS môže počatie sťažiť, najmä keď je ovulácia zriedkavá alebo ťažko predvídateľná. Mať PCOS však neznamená byť neplodná.',
    section4Body2: 'Niektoré ženy s PCOS ovulujú pravidelne a počnú bez zvláštnych ťažkostí. U iných je ovulácia natoľko nepravidelná, že si vyžaduje vyšetrenie a prípadne lekársku starostlivosť.',
    fertilityPoints: [
      'PCOS automaticky nespôsobuje neplodnosť',
      'Hlavnou ťažkosťou je často nepravidelná alebo nepredvídateľná ovulácia',
      'Ovulácia môže nastať aj pri veľmi dlhých cykloch',
      'Vhodná starostlivosť môže zvýšiť šance na počatie',
      'Cesta k plodnosti závisí od každej ženy a od mnohých ďalších faktorov',
    ],
    section4Body3: 'Plodnosť nezávisí ani len od ovulácie. Úlohu môžu zohrávať aj vek, kvalita spermií partnera, stav vajcovodov, endometrium a ďalšie faktory. Preto je komplexné vyšetrenie dôležité, keď tehotenstvo trvá dlhšie, než sa očakávalo.',
    section5Body1: 'Aplikácie na sledovanie menštruácie zvyčajne používajú údaje z predchádzajúcich cyklov na tvorbu odhadov. Keď sú cykly pomerne pravidelné, tieto odhady môžu byť užitočné ako referencia.',
    section5Body2: 'Pri PCOS však variabilita cyklu môže tieto výpočty urobiť menej spoľahlivými. Aplikácia nemôže s istotou vedieť, že ovulácia nastala len preto, že bol dosiahnutý teoretický dátum.',
    tip2Title: 'Použite ju ako orientačný bod',
    tip2Text: 'Digitálne sledovanie je najužitočnejšie na pozorovanie trendov vo vlastnom cykle a vedenie histórie, ktorú môžete zdieľať so zdravotníckym pracovníkom.',
    section6Body1: 'Pravidelné sledovanie vám môže pomôcť lepšie pochopiť vaše osobné odchýlky. Cieľom nie je urobiť cyklus dokonale predvídateľným, ale zhromaždiť dostatok informácií na rozpoznanie trendov.',
    trackingTips: [
      'Zaznamenajte dátum prvého dňa každého cyklu, aj keď sú cykly veľmi vzdialené',
      'Sledujte zmeny cervikálneho hlienu počas cyklu',
      'Zaznamenajte akúkoľvek panvovú bolesť alebo iné znaky, ktoré môžu ovuláciu sprevádzať',
      'Nespoliehajte sa výlučne na priemernú dĺžku 28 dní pri predpovedaní ovulácie',
      'Ovulačné testy používajte opatrne a v prípade potreby požiadajte odborníka o radu',
      'Ak chcete otehotnieť, zdieľajte zhromaždené informácie so zdravotníckym pracovníkom',
    ],
    section6Body2: 'Môže tiež pomôcť zaznamenávať súvisiace príznaky: bolesť, akné, zmeny hlienu, nezvyčajné krvácanie, náladu, spánok alebo iné osobné pozorovania. Tieto informácie môžu pomôcť vytvoriť úplnejší obraz o vašom cykle.',
    section7Body1: 'Konzultácia môže stáť za to aj pred začiatkom snahy o počatie, keď sú cykly veľmi nepravidelné, veľmi vzdialené alebo keď menštruácia dlhší čas chýba.',
    section7Body2: 'Zdravotnícky pracovník môže skúmať príčiny nepravidelností, posúdiť ovuláciu a v prípade potreby navrhnúť stratégiu prispôsobenú vašim plánom na tehotenstvo.',
    alert2Title: 'Kedy hľadať radu',
    alert2Text: 'Ak je menštruácia veľmi vzdialená, ak ste nemali menštruáciu niekoľko mesiacov alebo ak k tehotenstvu nedochádza napriek pravidelným pohlavným stykom, porozprávajte sa so zdravotníckym pracovníkom.',
    summaryTitle: 'Kľúčové body',
    summaryRows: [
      'PCOS môže urobiť cykly dlhými a nepredvídateľnými.',
      'Ovulácia môže byť v niektorých cykloch nepravidelná alebo chýbať.',
      'Nepravidelný cyklus automaticky neznamená nedostatok plodnosti.',
      'Predpovede založené iba na kalendári môžu byť pri PCOS menej spoľahlivé.',
      'Sledovanie cyklu a vedenie histórie môže byť užitočné, najmä pri konzultácii.',
    ],
    finalTipTitle: 'Posledné slovo',
    finalTipText: 'PCOS sa neprejavuje u každej ženy rovnako. Váš cyklus sa môže v čase meniť. Sledovanie tu je na to, aby vám pomohlo lepšie pochopiť, ako vaše telo funguje, nie aby nahradilo lekársku radu.',
    disclaimer: 'Tento článok má iba informatívny a vzdelávací charakter. Nie je lekárskou diagnózou a nenahrádza konzultáciu so zdravotníckym pracovníkom.',
    shareMessage: 'Cyklus, ovulácia a plodnosť pri PCOS — AWA',
  },
  hu: {
    badge: 'PCOS',
    title: 'Ciklus, peteérés\nés termékenység PCOS esetén',
    metaDuration: '8 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Középhaladó',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'PCOS esetén a ciklusod hosszúvá, szabálytalanná és néha nehezen megjósolhatóvá válhat. A peteérés körüli folyamatok megértése segíthet eligazodni a ciklusodban, és jobban megérteni a termékenységgel kapcsolatos kérdéseket.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Miért válik szabálytalanná a ciklus',
      'Mi történik a peteérés körül',
      'Hogyan ismerd fel a peteérést',
      'PCOS és termékenység',
      'Miért lehetnek az alkalmazások kevésbé pontosak',
      'A ciklus követése PCOS esetén',
      'Mikor menj orvoshoz, ha babát szeretnél',
      'Legfontosabb tudnivalók',
    ],
    section1Body1: 'A menstruációs ciklus hormonális jelek összehangolt sorozatától függ. PCOS esetén ez a szervezettség megzavarodhat, különösen a tüszőfejlődésben és a peteérésben.',
    section1Body2: 'A petefészkek sok kis tüszőt tartalmazhatnak, amelyek fejlődésnek indulnak, anélkül hogy egy domináns tüsző rendszeresen elérné az érettséget. A peteérés ekkor késhet, kiszámíthatatlanul következhet be, vagy bizonyos ciklusokban egyáltalán nem jön létre.',
    section1Body3: 'Ez az egyik oka annak, hogy egyes PCOS-sel élő nőknek 35, 45 vagy néha még több napos ciklusaik vannak, míg másoknak a tipikus hosszhoz közelebbi ciklusaik lehetnek.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'A ciklus hossza önmagában nem árulja el, hogy történt-e peteérés. Két azonos hosszúságú ciklusnak eltérő hormonális története lehet.',
    section2Body1: 'A peteérés a petesejt kiszabadulása egy petefészekből. A tüszőérés szakaszát követi, és megelőzi a ciklus luteális szakaszát.',
    section2Body2: 'Rendszeres ciklusban a peteérés gyakran a közepe táján van. PCOS esetén azonban ez az egyszerű szabály nem mindig érvényes. A peteérés sokkal később is lehet, vagy egy adott ciklusban egyáltalán nem jön létre.',
    infoTitle: 'Miért számít ez',
    infoText: 'Ha a peteérés kiszámíthatatlan, nehezebb a termékeny időszakot kizárólag a menstruáció dátumai alapján megbecsülni.',
    section3Body1: 'Számos testi jel kísérheti a peteérés körüli hormonális változásokat. Hasznosak lehetnek a saját ciklusod megfigyeléséhez, de egyetlen jel sem tudja bizonyossággal megerősíteni a peteérést.',
    ovulationSigns: [
      'A méhnyaknyálka változása, amely bőségesebb, átlátszó és nyúlós lehet',
      'Enyhe medencefájdalom vagy kellemetlenség egyes nőknél',
      'A testhőmérséklet változása a peteérés után',
      'A hüvelyi nedvesség változása',
      'A libidó lehetséges növekedése egyes nőknél',
    ],
    section3Body2: 'A méhnyaknyálka különösen figyelemre méltó. A termékeny időszak közeledtével bőségesebb, átlátszó, síkos és nyúlós lehet. Megjelenése azonban nőnként és ciklusonként eltérhet.',
    alert1Title: 'Légy óvatos az előrejelzésekkel',
    alert1Text: 'Nagyon szabálytalan ciklusok esetén a korábbi ciklusokból automatikusan kiszámított peteérési dátum nagyon hozzávetőleges lehet. Az előrejelzés nem a peteérés orvosi megerősítése.',
    section4Body1: 'A PCOS megnehezítheti a fogantatást, főként ha a peteérés ritka vagy nehezen megjósolható. PCOS-sel élni azonban nem jelent meddőséget.',
    section4Body2: 'Egyes PCOS-sel élő nők rendszeresen peteérést élnek át, és különösebb nehézség nélkül foganthatnak. Másoknál a peteérés annyira szabálytalan, hogy vizsgálatot és esetleg orvosi ellátást igényel.',
    fertilityPoints: [
      'A PCOS automatikusan nem okoz meddőséget',
      'A fő nehézség gyakran a szabálytalan vagy kiszámíthatatlan peteérés',
      'Peteérés akkor is bekövetkezhet, ha a ciklusok nagyon hosszúak',
      'A megfelelő ellátás javíthatja a fogantatás esélyeit',
      'A termékenységi út mindenkinél egyéni, és sok más tényezőtől függ',
    ],
    section4Body3: 'A termékenység sem csak a peteéréstől függ. Szerepet játszhat az életkor, a partner spermiumainak minősége, a petevezetékek állapota, az endometrium és más tényezők. Ezért fontos az átfogó kivizsgálás, ha a terhesség a vártnál tovább tart.',
    section5Body1: 'A menstruációkövető alkalmazások általában a korábbi ciklusok adataiból készítenek becsléseket. Amikor a ciklusok viszonylag rendszeresek, ezek a becslések hasznosak lehetnek viszonyítási pontként.',
    section5Body2: 'PCOS esetén azonban a ciklus változékonysága kevésbé megbízhatóvá teheti ezeket a számításokat. Egy alkalmazás nem tudhatja biztosan, hogy a peteérés megtörtént, csak mert elérkezett egy elméleti dátum.',
    tip2Title: 'Használd viszonyítási pontként',
    tip2Text: 'A digitális követés a leghasznosabb a saját ciklusod trendjeinek megfigyeléséhez, és olyan előzmények vezetéséhez, amelyeket megoszthatsz az egészségügyi szakemberrel.',
    section6Body1: 'A rendszeres követés segíthet jobban megérteni a személyes eltéréseidet. A cél nem az, hogy a ciklus tökéletesen kiszámíthatóvá váljon, hanem hogy elég információt gyűjts a trendek felismeréséhez.',
    trackingTips: [
      'Jegyezd fel minden ciklus első napjának dátumát, még ha a ciklusok nagyon távol is vannak egymástól',
      'Figyeld meg a méhnyaknyálka változásait a ciklus során',
      'Jegyezd fel a medencefájdalmat vagy más jeleket, amelyek a peteérést kísérhetik',
      'Kerüld, hogy kizárólag az átlagos 28 napos hosszra hagyatkozz a peteérés megjósolásánál',
      'A peteérési teszteket óvatosan használd, és szükség esetén kérj tanácsot szakembertől',
      'Ha teherbe szeretnél esni, oszd meg az összegyűjtött információkat egy egészségügyi szakemberrel',
    ],
    section6Body2: 'Az is segíthet, ha feljegyzed a kísérő tüneteket: fájdalom, akné, nyálkaváltozások, szokatlan vérzés, hangulat, alvás vagy más személyes megfigyelések. Ezek az információk segíthetnek teljesebb képet alkotni a ciklusodról.',
    section7Body1: 'Egy konzultáció még a babavárás megkezdése előtt is megérheti, ha a ciklusok nagyon szabálytalanok, nagyon távoliak, vagy ha a menstruáció hosszabb ideig elmarad.',
    section7Body2: 'Egy egészségügyi szakember kivizsgálhatja a szabálytalanságok okait, felmérheti a peteérést, és szükség esetén a terhességi terveidhez igazított stratégiát javasolhat.',
    alert2Title: 'Mikor kérj tanácsot',
    alert2Text: 'Ha a menstruációd nagyon távoli, ha több hónapja nem volt menstruációd, vagy ha a rendszeres nemi élet ellenére nem jön létre terhesség, beszélj egészségügyi szakemberrel.',
    summaryTitle: 'Kulcspontok',
    summaryRows: [
      'A PCOS hosszúvá és kiszámíthatatlanná teheti a ciklusokat.',
      'A peteérés egyes ciklusokban szabálytalan lehet vagy elmaradhat.',
      'A szabálytalan ciklus automatikusan nem jelent termékenységi hiányt.',
      'A kizárólag a naptárra épülő előrejelzések PCOS esetén kevésbé lehetnek megbízhatóak.',
      'A ciklusod megfigyelése és az előzmények vezetése hasznos lehet, különösen egy konzultációhoz.',
    ],
    finalTipTitle: 'Még egy gondolat',
    finalTipText: 'A PCOS nem jelentkezik minden nőnél ugyanúgy. A ciklusod idővel változhat. A követés arra való, hogy segítsen jobban megérteni, hogyan működik a tested, nem arra, hogy helyettesítse az orvosi tanácsot.',
    disclaimer: 'Ez a cikk kizárólag tájékoztató és ismeretterjesztő célú. Nem jelent orvosi diagnózist, és nem helyettesíti az egészségügyi szakemberrel folytatott konzultációt.',
    shareMessage: 'Ciklus, peteérés és termékenység PCOS esetén — AWA',
  },
  ro: {
    badge: 'SOP',
    title: 'Ciclul, ovulația\nși fertilitatea în SOP',
    metaDuration: '8 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Intermediar',
    metaValidated: 'Conținut revizuit',
    intro: 'În SOP, ciclul tău poate deveni lung, neregulat și uneori greu de prevăzut. Înțelegerea a ceea ce se întâmplă în jurul ovulației te poate ajuta să dai sens ciclului tău și să înțelegi mai bine întrebările legate de fertilitate.',
    contentsTitle: 'În acest articol',
    topics: [
      'De ce ciclul devine neregulat',
      'Ce se întâmplă în jurul ovulației',
      'Cum recunoști ovulația',
      'SOP și fertilitatea',
      'De ce aplicațiile pot fi mai puțin precise',
      'Urmărirea ciclului în SOP',
      'Când să mergi la medic dacă vrei să rămâi însărcinată',
      'Ce să reții',
    ],
    section1Body1: 'Ciclul menstrual depinde de o succesiune coordonată de semnale hormonale. În SOP, această organizare poate fi perturbată, în special în dezvoltarea foliculilor și în ovulație.',
    section1Body2: 'Ovarele pot conține mulți foliculi mici care încep să se dezvolte fără ca un folicul dominant să ajungă în mod regulat la maturitate. Ovulația poate fi atunci întârziată, poate apărea imprevizibil sau poate să nu aibă loc deloc în anumite cicluri.',
    section1Body3: 'Acesta este unul dintre motivele pentru care unele persoane cu SOP au cicluri de 35, 45 sau uneori mai multe zile, în timp ce altele pot avea cicluri mai apropiate de o durată obișnuită.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Durata ciclului singură nu îți spune dacă a avut loc ovulația. Două cicluri de aceeași durată pot avea o poveste hormonală diferită.',
    section2Body1: 'Ovulația este eliberarea unui ovul dintr-un ovar. Ea urmează unei faze de maturare foliculară și precede faza luteală a ciclului.',
    section2Body2: 'Într-un ciclu regulat, ovulația are adesea loc spre mijloc. Dar în SOP, această regulă simplă nu se aplică întotdeauna. Ovulația poate fi mult mai târzie sau poate să nu aibă loc deloc într-un anumit ciclu.',
    infoTitle: 'De ce contează',
    infoText: 'Când ovulația este imprevizibilă, devine mai greu să estimezi fereastra fertilă doar pe baza datelor menstruației.',
    section3Body1: 'Există mai multe semne fizice care pot însoți schimbările hormonale din jurul ovulației. Ele pot fi utile pentru a-ți observa propriul ciclu, dar niciun semn singur nu poate confirma ovulația cu certitudine.',
    ovulationSigns: [
      'O schimbare a mucusului cervical, care poate deveni mai abundent, limpede și filant',
      'O durere sau un disconfort pelvian ușor la unele femei',
      'O schimbare a temperaturii corpului după ovulație',
      'O schimbare a umezelii vaginale',
      'O posibilă creștere a libidoului la unele femei',
    ],
    section3Body2: 'Mucusul cervical merită observat în mod deosebit. Pe măsură ce fereastra fertilă se apropie, el poate deveni mai abundent, limpede, alunecos și filant. Totuși, aspectul său poate varia de la o persoană la alta și de la un ciclu la altul.',
    alert1Title: 'Atenție la previziuni',
    alert1Text: 'În cazul ciclurilor foarte neregulate, o dată a ovulației calculată automat din ciclurile anterioare poate fi foarte aproximativă. O previziune nu este o confirmare medicală a ovulației.',
    section4Body1: 'SOP poate face concepția mai dificilă, mai ales când ovulația este rară sau greu de prevăzut. Totuși, a avea SOP nu înseamnă a fi infertilă.',
    section4Body2: 'Unele femei cu SOP ovulează regulat și concep fără dificultăți deosebite. Pentru altele, ovulația este suficient de neregulată pentru a cere o evaluare și, eventual, îngrijiri medicale.',
    fertilityPoints: [
      'SOP nu provoacă automat infertilitate',
      'Principala dificultate este adesea ovulația neregulată sau imprevizibilă',
      'Ovulația poate avea loc chiar și atunci când ciclurile sunt foarte lungi',
      'Îngrijirile adecvate pot îmbunătăți șansele de concepție',
      'Parcursul fertilității depinde de fiecare persoană și de mulți alți factori',
    ],
    section4Body3: 'Nici fertilitatea nu depinde doar de ovulație. Vârsta, calitatea spermei partenerului, starea trompelor uterine, endometrul și alți factori pot juca și ei un rol. De aceea o evaluare completă contează atunci când sarcina durează mai mult decât se aștepta.',
    section5Body1: 'Aplicațiile de urmărire a menstruației folosesc în general datele din ciclurile anterioare pentru a produce estimări. Când ciclurile sunt relativ regulate, aceste estimări pot fi utile ca reper.',
    section5Body2: 'În SOP, însă, variabilitatea ciclului poate face aceste calcule mai puțin fiabile. O aplicație nu poate ști cu certitudine că a avut loc ovulația doar pentru că a fost atinsă o dată teoretică.',
    tip2Title: 'Folosește-o ca reper',
    tip2Text: 'Urmărirea digitală este cea mai utilă pentru a observa tendințele propriului tău ciclu și pentru a păstra un istoric de împărtășit cu medicul tău.',
    section6Body1: 'Urmărirea regulată te poate ajuta să-ți înțelegi mai bine variațiile personale. Scopul nu este să faci ciclul perfect previzibil, ci să aduni suficiente informații pentru a identifica tendințe.',
    trackingTips: [
      'Notează data primei zile a fiecărui ciclu, chiar și atunci când ciclurile sunt foarte distanțate',
      'Observă schimbările mucusului cervical pe parcursul ciclului',
      'Notează orice durere pelviană sau alte semne care pot însoți ovulația',
      'Evită să te bazezi doar pe o durată medie de 28 de zile pentru a prezice ovulația',
      'Folosește testele de ovulație cu prudență și, la nevoie, cere sfatul unui profesionist',
      'Împărtășește informațiile adunate unui profesionist din domeniul sănătății dacă vrei să rămâi însărcinată',
    ],
    section6Body2: 'Poate fi util și să notezi simptomele asociate: durere, acnee, schimbări ale mucusului, sângerări neobișnuite, stare de spirit, somn sau alte observații personale. Aceste informații pot ajuta la construirea unei imagini mai complete a ciclului tău.',
    section7Body1: 'O consultație poate merita chiar înainte de a începe să încerci să rămâi însărcinată, atunci când ciclurile sunt foarte neregulate, foarte distanțate sau când menstruația lipsește mult timp.',
    section7Body2: 'Un profesionist din domeniul sănătății poate investiga cauzele neregularităților, poate evalua ovulația și, la nevoie, poate propune o strategie adaptată planurilor tale de sarcină.',
    alert2Title: 'Când să ceri un sfat',
    alert2Text: 'Dacă menstruațiile tale sunt foarte distanțate, dacă nu ai avut menstruație de mai multe luni sau dacă nu rămâi însărcinată în ciuda unor raporturi intime regulate, vorbește cu un profesionist din domeniul sănătății.',
    summaryTitle: 'Puncte-cheie',
    summaryRows: [
      'SOP poate face ciclurile lungi și imprevizibile.',
      'Ovulația poate fi neregulată sau absentă în unele cicluri.',
      'Un ciclu neregulat nu înseamnă automat lipsă de fertilitate.',
      'Previziunile bazate doar pe calendar pot fi mai puțin fiabile în SOP.',
      'Observarea ciclului și păstrarea unui istoric pot fi utile, mai ales pentru o consultație.',
    ],
    finalTipTitle: 'Un ultim cuvânt',
    finalTipText: 'SOP nu se manifestă la fel la toate femeile. Ciclul tău se poate schimba în timp. Urmărirea este aici pentru a te ajuta să înțelegi mai bine cum funcționează corpul tău, nu pentru a înlocui sfatul medical.',
    disclaimer: 'Acest articol are doar scop informativ și educativ. Nu constituie un diagnostic medical și nu înlocuiește o consultație cu un profesionist din domeniul sănătății.',
    shareMessage: 'Ciclul, ovulația și fertilitatea în SOP — AWA',
  },
  bg: {
    badge: 'СПКЯ',
    title: 'Цикъл, овулация\nи плодовитост при СПКЯ',
    metaDuration: '8 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Средно ниво',
    metaValidated: 'Проверено съдържание',
    intro: 'При СПКЯ цикълът ти може да стане дълъг, нередовен и понякога труден за предвиждане. Разбирането на случващото се около овулацията може да ти помогне да осмислиш цикъла си и да разбереш по-добре въпросите, свързани с плодовитостта.',
    contentsTitle: 'В тази статия',
    topics: [
      'Защо цикълът става нередовен',
      'Какво се случва около овулацията',
      'Как да разпознаеш овулацията',
      'СПКЯ и плодовитост',
      'Защо приложенията може да са по-неточни',
      'Проследяване на цикъла при СПКЯ',
      'Кога да посетиш лекар, ако искаш да забременееш',
      'Какво да запомниш',
    ],
    section1Body1: 'Менструалният цикъл зависи от координирана поредица от хормонални сигнали. При СПКЯ тази организация може да бъде нарушена, особено в развитието на фоликулите и овулацията.',
    section1Body2: 'Яйчниците могат да съдържат много малки фоликули, които започват да се развиват, без доминиращ фоликул редовно да достига зрялост. Тогава овулацията може да се забави, да настъпи непредсказуемо или изобщо да не се случи при някои цикли.',
    section1Body3: 'Това е една от причините някои хора със СПКЯ да имат цикли от 35, 45 или понякога повече дни, докато други могат да имат цикли, по-близки до обичайната продължителност.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Продължителността на цикъла сама по себе си не показва дали е настъпила овулация. Два цикъла с еднаква продължителност могат да имат различна хормонална история.',
    section2Body1: 'Овулацията е освобождаването на яйцеклетка от яйчник. Тя следва фаза на фоликуларно съзряване и предхожда лутеиновата фаза на цикъла.',
    section2Body2: 'При редовен цикъл овулацията често е около средата. Но при СПКЯ това просто правило не винаги важи. Овулацията може да е много по-късно или изобщо да не настъпи в даден цикъл.',
    infoTitle: 'Защо това има значение',
    infoText: 'Когато овулацията е непредсказуема, става по-трудно да се определи плодовитият прозорец само по датите на менструацията.',
    section3Body1: 'Има няколко физически признака, които могат да съпътстват хормоналните промени около овулацията. Те могат да са полезни за наблюдение на собствения ти цикъл, но никой отделен признак не може да потвърди овулацията със сигурност.',
    ovulationSigns: [
      'Промяна в цервикалната слуз, която може да стане по-обилна, бистра и разтеглива',
      'Лека тазова болка или дискомфорт при някои жени',
      'Промяна в телесната температура след овулацията',
      'Промяна във влажността на влагалището',
      'Възможно повишаване на либидото при някои жени',
    ],
    section3Body2: 'Особено си струва да наблюдаваш цервикалната слуз. С наближаването на плодовития прозорец тя може да стане по-обилна, бистра, хлъзгава и разтеглива. Въпреки това външният ѝ вид може да варира от човек на човек и от цикъл на цикъл.',
    alert1Title: 'Внимавай с прогнозите',
    alert1Text: 'При много нередовни цикли датата на овулация, изчислена автоматично от предишните цикли, може да е много приблизителна. Прогнозата не е медицинско потвърждение на овулацията.',
    section4Body1: 'СПКЯ може да затрудни зачеването, главно когато овулацията е рядка или трудна за предвиждане. Въпреки това наличието на СПКЯ не означава безплодие.',
    section4Body2: 'Някои жени със СПКЯ овулират редовно и зачеват без особени затруднения. При други овулацията е достатъчно нередовна, за да изисква оценка и евентуално медицинска грижа.',
    fertilityPoints: [
      'СПКЯ не причинява автоматично безплодие',
      'Основното затруднение често е нередовната или непредсказуема овулация',
      'Овулация може да настъпи дори при много дълги цикли',
      'Подходящата грижа може да подобри шансовете за зачеване',
      'Пътят към плодовитост зависи от всеки човек и от много други фактори',
    ],
    section4Body3: 'Плодовитостта не зависи само от овулацията. Възрастта, качеството на спермата на партньора, състоянието на фалопиевите тръби, ендометриумът и други фактори също могат да играят роля. Затова цялостната оценка е важна, когато бременността отнема повече време от очакваното.',
    section5Body1: 'Приложенията за проследяване на менструацията обикновено използват данни от предишни цикли, за да правят оценки. Когато циклите са сравнително редовни, тези оценки могат да са полезни като ориентир.',
    section5Body2: 'При СПКЯ обаче променливостта на цикъла може да направи тези изчисления по-ненадеждни. Приложението не може да знае със сигурност, че е настъпила овулация само защото е достигната теоретична дата.',
    tip2Title: 'Използвай го като ориентир',
    tip2Text: 'Дигиталното проследяване е най-полезно за наблюдение на тенденциите в собствения ти цикъл и за водене на история, която да споделиш със здравния си специалист.',
    section6Body1: 'Редовното проследяване може да ти помогне да разбереш по-добре личните си вариации. Целта не е цикълът да стане напълно предвидим, а да събереш достатъчно информация, за да откриеш тенденции.',
    trackingTips: [
      'Отбелязвай датата на първия ден от всеки цикъл, дори когато циклите са много разтеглени',
      'Наблюдавай промените в цервикалната слуз през цикъла',
      'Отбелязвай тазова болка или други признаци, които могат да съпътстват овулацията',
      'Избягвай да се осланяш само на средна продължителност от 28 дни, за да предвиждаш овулацията',
      'Използвай тестовете за овулация с повишено внимание и при нужда поискай съвет от специалист',
      'Споделяй събраната информация със здравен специалист, ако искаш да забременееш',
    ],
    section6Body2: 'Може да помогне и да отбелязваш съпътстващи симптоми: болка, акне, промени в слузта, необичайно кървене, настроение, сън или други лични наблюдения. Тази информация може да помогне да се изгради по-пълна картина на цикъла ти.',
    section7Body1: 'Консултацията може да е полезна дори преди да започнеш да се опитваш да зачеваш, когато циклите са много нередовни, много разтеглени или когато менструацията отсъства продължително.',
    section7Body2: 'Здравен специалист може да изследва причините за нередностите, да оцени овулацията и при нужда да предложи стратегия, подходяща за плановете ти за бременност.',
    alert2Title: 'Кога да потърсиш съвет',
    alert2Text: 'Ако менструациите ти са много разтеглени, ако не си имала менструация от няколко месеца или ако бременност не настъпва въпреки редовни полови контакти, поговори със здравен специалист.',
    summaryTitle: 'Основни точки',
    summaryRows: [
      'СПКЯ може да направи циклите дълги и непредсказуеми.',
      'Овулацията може да е нередовна или да отсъства при някои цикли.',
      'Нередовният цикъл не означава автоматично липса на плодовитост.',
      'Прогнозите, базирани само на календара, може да са по-ненадеждни при СПКЯ.',
      'Наблюдението на цикъла и воденето на история могат да са полезни, особено за консултация.',
    ],
    finalTipTitle: 'Една последна дума',
    finalTipText: 'СПКЯ не се проявява еднакво при всяка жена. Цикълът ти може да се променя с времето. Проследяването е тук, за да ти помогне да разбереш по-добре как работи тялото ти, а не да замества медицинския съвет.',
    disclaimer: 'Тази статия е само с информационна и образователна цел. Тя не представлява медицинска диагноза и не замества консултация със здравен специалист.',
    shareMessage: 'Цикъл, овулация и плодовитост при СПКЯ — AWA',
  },
  sr: {
    badge: 'ПЦОС',
    title: 'Циклус, овулација\nи плодност код ПЦОС-а',
    metaDuration: '8 мин читања',
    metaType: 'Водич',
    metaLevel: 'Средњи ниво',
    metaValidated: 'Проверен садржај',
    intro: 'Са ПЦОС-ом твој циклус може постати дуг, нередован и понекад тешко предвидив. Разумевање онога што се дешава око овулације може ти помоћи да осмислиш свој циклус и боље разумеш питања везана за плодност.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Зашто циклус постаје нередован',
      'Шта се дешава око овулације',
      'Како препознати овулацију',
      'ПЦОС и плодност',
      'Зашто апликације могу бити мање тачне',
      'Праћење циклуса уз ПЦОС',
      'Када посетити лекара ако желиш да затрудниш',
      'Шта да запамтиш',
    ],
    section1Body1: 'Менструални циклус зависи од координисаног низа хормонских сигнала. Код ПЦОС-а ова организација може бити нарушена, нарочито у развоју фоликула и овулацији.',
    section1Body2: 'Јајници могу садржати много малих фоликула који почињу да се развијају, а да доминантни фоликул редовно не достигне зрелост. Овулација се тада може одложити, десити непредвидиво или се уопште не десити током одређених циклуса.',
    section1Body3: 'То је један од разлога зашто неке особе са ПЦОС-ом имају циклусе од 35, 45 или понекад више дана, док друге могу имати циклусе ближе типичном трајању.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Само трајање циклуса не говори да ли је настала овулација. Два циклуса истог трајања могу имати различиту хормонску причу.',
    section2Body1: 'Овулација је ослобађање јајне ћелије из јајника. Следи фазу фоликуларног сазревања и претходи лутеалној фази циклуса.',
    section2Body2: 'При редовном циклусу овулација је често око средине. Али са ПЦОС-ом ово једноставно правило не важи увек. Овулација може бити много касније или се у датом циклусу уопште не десити.',
    infoTitle: 'Зашто је ово важно',
    infoText: 'Када је овулација непредвидива, теже је проценити плодни прозор само на основу датума менструације.',
    section3Body1: 'Постоји неколико физичких знакова који могу пратити хормонске промене око овулације. Могу бити корисни за посматрање сопственог циклуса, али ниједан појединачни знак не може са сигурношћу потврдити овулацију.',
    ovulationSigns: [
      'Промена цервикалне слузи, која може постати обилнија, бистра и развлачива',
      'Благи карлични бол или нелагодност код неких жена',
      'Промена телесне температуре после овулације',
      'Промена влажности вагине',
      'Могуће повећање либида код неких жена',
    ],
    section3Body2: 'Цервикалну слуз посебно вреди посматрати. Како се плодни прозор приближава, она може постати обилнија, бистра, клизава и развлачива. Међутим, њен изглед може варирати од особе до особе и од циклуса до циклуса.',
    alert1Title: 'Буди опрезна са предвиђањима',
    alert1Text: 'При веома нередовним циклусима датум овулације аутоматски израчунат из претходних циклуса може бити веома приближан. Предвиђање није медицинска потврда овулације.',
    section4Body1: 'ПЦОС може отежати зачеће, углавном када је овулација ретка или тешко предвидива. Међутим, имати ПЦОС не значи бити неплодна.',
    section4Body2: 'Неке жене са ПЦОС-ом овулирају редовно и зачињу без посебних тешкоћа. Код других је овулација довољно нередовна да захтева процену и евентуално медицинску помоћ.',
    fertilityPoints: [
      'ПЦОС не изазива аутоматски неплодност',
      'Главна тешкоћа је често нередовна или непредвидива овулација',
      'Овулација се може десити чак и када су циклуси веома дуги',
      'Одговарајућа нега може побољшати шансе за зачеће',
      'Пут ка плодности зависи од сваке особе и многих других фактора',
    ],
    section4Body3: 'Плодност не зависи само од овулације. Године, квалитет партнерове сперме, стање јајовода, ендометријум и други фактори такође могу играти улогу. Зато је свеобухватна процена важна када трудноћа траје дуже од очекиваног.',
    section5Body1: 'Апликације за праћење менструације обично користе податке из претходних циклуса да би давале процене. Када су циклуси релативно редовни, ове процене могу бити корисне као референца.',
    section5Body2: 'Са ПЦОС-ом, међутим, променљивост циклуса може учинити ове прорачуне мање поузданим. Апликација не може са сигурношћу знати да је настала овулација само зато што је достигнут теоријски датум.',
    tip2Title: 'Користи је као ослонац',
    tip2Text: 'Дигитално праћење је најкорисније за посматрање трендова у сопственом циклусу и вођење историје коју можеш поделити са својим здравственим радником.',
    section6Body1: 'Редовно праћење може ти помоћи да боље разумеш своје личне варијације. Циљ није да циклус учиниш савршено предвидивим, већ да прикупиш довољно информација за уочавање трендова.',
    trackingTips: [
      'Бележи датум првог дана сваког циклуса, чак и када су циклуси веома размакнути',
      'Посматрај промене цервикалне слузи током циклуса',
      'Бележи карлични бол или друге знаке који могу пратити овулацију',
      'Избегавај да се ослањаш само на просечно трајање од 28 дана да предвидиш овулацију',
      'Тестове овулације користи опрезно и по потреби затражи савет од стручњака',
      'Подели прикупљене информације са здравственим радником ако желиш да затрудниш',
    ],
    section6Body2: 'Може помоћи и бележење придружених симптома: бол, акне, промене слузи, необично крварење, расположење, сан или друга лична запажања. Ове информације могу помоћи да се изгради потпунија слика твог циклуса.',
    section7Body1: 'Консултација може бити корисна чак и пре него што почнеш да покушаваш да зачнеш, када су циклуси веома нередовни, веома размакнути или када менструација дуго изостаје.',
    section7Body2: 'Здравствени радник може истражити узроке нередовности, проценити овулацију и по потреби предложити стратегију прилагођену твојим плановима за трудноћу.',
    alert2Title: 'Када потражити савет',
    alert2Text: 'Ако ти је менструација веома размакнута, ако је немаш неколико месеци или ако трудноћа не настане упркос редовним односима, разговарај са здравственим радником.',
    summaryTitle: 'Кључне тачке',
    summaryRows: [
      'ПЦОС може учинити циклусе дугим и непредвидивим.',
      'Овулација може бити нередовна или изостати током неких циклуса.',
      'Нередовни циклус не значи аутоматски недостатак плодности.',
      'Предвиђања заснована само на календару могу бити мање поуздана код ПЦОС-а.',
      'Посматрање циклуса и вођење историје могу бити корисни, нарочито за консултацију.',
    ],
    finalTipTitle: 'Једна последња реч',
    finalTipText: 'ПЦОС се не испољава исто код сваке жене. Твој циклус се може мењати током времена. Праћење је ту да ти помогне да боље разумеш како твоје тело функционише, а не да замени медицински савет.',
    disclaimer: 'Овај чланак је само у информативне и образовне сврхе. Он не представља медицинску дијагнозу и не замењује консултацију са здравственим радником.',
    shareMessage: 'Циклус, овулација и плодност код ПЦОС-а — AWA',
  },
  hr: {
    badge: 'PCOS',
    title: 'Ciklus, ovulacija\ni plodnost kod PCOS-a',
    metaDuration: '8 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Kod PCOS-a ciklus može postati dug, nepravilan i ponekad teško predvidljiv. Razumijevanje onoga što se događa oko ovulacije može ti pomoći da shvatiš svoj ciklus i bolje razumiješ pitanja vezana uz plodnost.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Zašto ciklus postaje nepravilan',
      'Što se događa oko ovulacije',
      'Kako prepoznati ovulaciju',
      'PCOS i plodnost',
      'Zašto aplikacije mogu biti manje točne',
      'Praćenje ciklusa kod PCOS-a',
      'Kada posjetiti liječnika ako želiš zatrudnjeti',
      'Ključne poruke',
    ],
    section1Body1: 'Menstrualni ciklus ovisi o usklađenom slijedu hormonskih signala. Kod PCOS-a ta organizacija može biti poremećena, osobito u razvoju folikula i ovulaciji.',
    section1Body2: 'Jajnici mogu sadržavati mnogo malih folikula koji se počinju razvijati, a da dominantni folikul redovito ne dosegne zrelost. Ovulacija se tada može odgoditi, nastupiti nepredvidljivo ili uopće ne nastupiti tijekom određenih ciklusa.',
    section1Body3: 'To je jedan od razloga zašto neke osobe s PCOS-om imaju cikluse od 35, 45 ili ponekad više dana, dok druge mogu imati cikluse bliže uobičajenoj duljini.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Sama duljina ciklusa ne govori ti je li ovulacija nastupila. Dva ciklusa jednake duljine mogu imati različitu hormonsku priču.',
    section2Body1: 'Ovulacija je oslobađanje jajne stanice iz jajnika. Slijedi fazu sazrijevanja folikula, a prethodi lutealnoj fazi ciklusa.',
    section2Body2: 'U pravilnom ciklusu ovulacija je često oko sredine. No kod PCOS-a to jednostavno pravilo ne vrijedi uvijek. Ovulacija može biti mnogo kasnija ili je u određenom ciklusu uopće ne mora biti.',
    infoTitle: 'Zašto je to važno',
    infoText: 'Kad je ovulacija nepredvidljiva, teže je procijeniti plodni prozor samo na temelju datuma menstruacije.',
    section3Body1: 'Postoji nekoliko tjelesnih znakova koji mogu pratiti hormonske promjene oko ovulacije. Mogu biti korisni za promatranje vlastitog ciklusa, ali nijedan pojedinačni znak ne može sa sigurnošću potvrditi ovulaciju.',
    ovulationSigns: [
      'Promjena cervikalne sluzi, koja može postati obilnija, bistra i rastezljiva',
      'Blaga bol ili nelagoda u zdjelici kod nekih žena',
      'Promjena tjelesne temperature nakon ovulacije',
      'Promjena vaginalne vlažnosti',
      'Mogući porast libida kod nekih žena',
    ],
    section3Body2: 'Cervikalnu sluz osobito vrijedi promatrati. Kako se plodni prozor približava, može postati obilnija, bistra, skliska i rastezljiva. Međutim, njezin se izgled može razlikovati od osobe do osobe i od ciklusa do ciklusa.',
    alert1Title: 'Oprez s predviđanjima',
    alert1Text: 'Kod vrlo nepravilnih ciklusa datum ovulacije izračunat automatski iz prethodnih ciklusa može biti vrlo približan. Predviđanje nije liječnička potvrda ovulacije.',
    section4Body1: 'PCOS može otežati začeće, uglavnom kad je ovulacija rijetka ili teško predvidljiva. Međutim, imati PCOS ne znači biti neplodna.',
    section4Body2: 'Neke žene s PCOS-om ovuliraju redovito i zatrudne bez posebnih poteškoća. Kod drugih je ovulacija dovoljno nepravilna da zahtijeva obradu i eventualno liječničku skrb.',
    fertilityPoints: [
      'PCOS automatski ne uzrokuje neplodnost',
      'Glavna poteškoća često je nepravilna ili nepredvidljiva ovulacija',
      'Ovulacija se može dogoditi i kad su ciklusi vrlo dugi',
      'Odgovarajuća skrb može povećati izglede za začeće',
      'Put plodnosti ovisi o svakoj osobi i mnogim drugim čimbenicima',
    ],
    section4Body3: 'Ni plodnost ne ovisi samo o ovulaciji. Ulogu mogu imati i dob, kvaliteta partnerovih spermija, stanje jajovoda, endometrij i drugi čimbenici. Zato je sveobuhvatna obrada važna kad trudnoća traje dulje od očekivanog.',
    section5Body1: 'Aplikacije za praćenje menstruacije općenito koriste podatke iz prethodnih ciklusa za izradu procjena. Kad su ciklusi relativno pravilni, te procjene mogu biti korisne kao referenca.',
    section5Body2: 'Kod PCOS-a, međutim, varijabilnost ciklusa može te izračune učiniti manje pouzdanima. Aplikacija ne može sa sigurnošću znati da je ovulacija nastupila samo zato što je dosegnut teorijski datum.',
    tip2Title: 'Koristi kao orijentir',
    tip2Text: 'Digitalno praćenje najkorisnije je za promatranje trendova u vlastitom ciklusu i vođenje povijesti koju možeš podijeliti sa zdravstvenim djelatnikom.',
    section6Body1: 'Redovito praćenje može ti pomoći bolje razumjeti vlastite varijacije. Cilj nije učiniti ciklus savršeno predvidljivim, nego prikupiti dovoljno informacija za prepoznavanje trendova.',
    trackingTips: [
      'Zabilježi datum prvog dana svakog ciklusa, čak i kad su ciklusi jako razmaknuti',
      'Promatraj promjene cervikalne sluzi tijekom ciklusa',
      'Zabilježi svaku bol u zdjelici ili druge znakove koji mogu pratiti ovulaciju',
      'Nemoj se oslanjati samo na prosječnu duljinu od 28 dana za predviđanje ovulacije',
      'Testove ovulacije koristi oprezno i po potrebi zatraži savjet stručne osobe',
      'Prikupljene informacije podijeli sa zdravstvenim djelatnikom ako želiš zatrudnjeti',
    ],
    section6Body2: 'Može pomoći i bilježenje pratećih simptoma: boli, akni, promjena sluzi, neobičnog krvarenja, raspoloženja, sna ili drugih osobnih opažanja. Te informacije mogu pomoći u stvaranju potpunije slike tvog ciklusa.',
    section7Body1: 'Savjetovanje može biti vrijedno i prije nego što počneš pokušavati zatrudnjeti, kad su ciklusi vrlo nepravilni, jako razmaknuti ili kad menstruacije nema duže vrijeme.',
    section7Body2: 'Zdravstveni djelatnik može istražiti uzroke nepravilnosti, procijeniti ovulaciju i, ako je potrebno, predložiti strategiju prilagođenu tvojim planovima o trudnoći.',
    alert2Title: 'Kada zatražiti savjet',
    alert2Text: 'Ako su ti menstruacije jako razmaknute, ako nekoliko mjeseci nisi imala menstruaciju ili ako do trudnoće ne dolazi unatoč redovitim spolnim odnosima, razgovaraj sa zdravstvenim djelatnikom.',
    summaryTitle: 'Ključne točke',
    summaryRows: [
      'PCOS može učiniti cikluse dugima i nepredvidljivima.',
      'Ovulacija može biti nepravilna ili izostati u nekim ciklusima.',
      'Nepravilan ciklus automatski ne znači nedostatak plodnosti.',
      'Predviđanja samo na temelju kalendara mogu biti manje pouzdana kod PCOS-a.',
      'Promatranje ciklusa i vođenje povijesti može biti korisno, osobito za savjetovanje.',
    ],
    finalTipTitle: 'Još jedna riječ',
    finalTipText: 'PCOS se ne pokazuje jednako kod svake žene. Tvoj se ciklus može mijenjati tijekom vremena. Praćenje je tu da ti pomogne bolje razumjeti kako tvoje tijelo funkcionira, a ne da zamijeni liječnički savjet.',
    disclaimer: 'Ovaj je članak samo informativne i edukativne naravi. Ne predstavlja medicinsku dijagnozu i ne zamjenjuje savjetovanje sa zdravstvenim djelatnikom.',
    shareMessage: 'Ciklus, ovulacija i plodnost kod PCOS-a — AWA',
  },
  bs: {
    badge: 'PCOS',
    title: 'Ciklus, ovulacija\ni plodnost kod PCOS-a',
    metaDuration: '8 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Kod PCOS-a ciklus može postati dug, nepravilan i ponekad teško predvidljiv. Razumijevanje onoga što se događa oko ovulacije može ti pomoći da shvatiš svoj ciklus i bolje razumiješ pitanja vezana uz plodnost.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Zašta ciklus postaje nepravilan',
      'Što se događa oko ovulacije',
      'Kako prepoznati ovulaciju',
      'PCOS i plodnost',
      'Zašta aplikacije mogu biti manje tačne',
      'Praćenje ciklusa kod PCOS-a',
      'Kada posjetiti ljekara ako želiš zatrudnjeti',
      'Ključne poruke',
    ],
    section1Body1: 'Menstrualni ciklus ovisi o usklađenom slijedu hormonskih signala. Kod PCOS-a ta organizacija može biti poremećena, osobito u razvoju folikula i ovulaciji.',
    section1Body2: 'Jajnici mogu sadržavati mnogo malih folikula koji se počinju razvijati, a da dominantni folikul redovito ne dosegne zrelost. Ovulacija se tada može odgoditi, nastupiti nepredvidljivo ili uopće ne nastupiti tokom određenih ciklusa.',
    section1Body3: 'To je jedan od razloga zašta neke osobe s PCOS-om imaju cikluse od 35, 45 ili ponekad više dana, dok druge mogu imati cikluse bliže uobičajenoj duljini.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Sama duljina ciklusa ne govori ti je li ovulacija nastupila. Dva ciklusa jednake duljine mogu imati različitu hormonsku priču.',
    section2Body1: 'Ovulacija je oslobađanje jajne stanice iz jajnika. Slijedi fazu sazrijevanja folikula, a prethodi lutealnoj fazi ciklusa.',
    section2Body2: 'U pravilnom ciklusu ovulacija je često oko sredine. No kod PCOS-a to jednostavno pravilo ne vrijedi uvijek. Ovulacija može biti mnogo kasnija ili je u određenom ciklusu uopće ne mora biti.',
    infoTitle: 'Zašta je to važno',
    infoText: 'Kad je ovulacija nepredvidljiva, teže je procijeniti plodni prozor samo na temelju datuma menstruacije.',
    section3Body1: 'Postoji nekoliko tjelesnih znakova koji mogu pratiti hormonske promjene oko ovulacije. Mogu biti korisni za promatranje vlastitog ciklusa, ali nijedan pojedinačni znak ne može sa sigurnošću potvrditi ovulaciju.',
    ovulationSigns: [
      'Promjena cervikalne sluzi, koja može postati obilnija, bistra i rastezljiva',
      'Blaga bol ili nelagoda u zdjelici kod nekih žena',
      'Promjena tjelesne temperature nakon ovulacije',
      'Promjena vaginalne vlažnosti',
      'Mogući porast libida kod nekih žena',
    ],
    section3Body2: 'Cervikalnu sluz osobito vrijedi promatrati. Kako se plodni prozor približava, može postati obilnija, bistra, skliska i rastezljiva. Međutim, njezin se izgled može razlikovati od osobe do osobe i od ciklusa do ciklusa.',
    alert1Title: 'Oprez s predviđanjima',
    alert1Text: 'Kod vrlo nepravilnih ciklusa datum ovulacije izračunat automatski iz prethodnih ciklusa može biti vrlo približan. Predviđanje nije ljekarska potvrda ovulacije.',
    section4Body1: 'PCOS može otežati začeće, uglavnom kad je ovulacija rijetka ili teško predvidljiva. Međutim, imati PCOS ne znači biti neplodna.',
    section4Body2: 'Neke žene s PCOS-om ovuliraju redovito i zatrudne bez posebnih poteškoća. Kod drugih je ovulacija dovoljno nepravilna da zahtijeva obradu i eventualno ljekarsku skrb.',
    fertilityPoints: [
      'PCOS automatski ne uzrokuje neplodnost',
      'Glavna poteškoća često je nepravilna ili nepredvidljiva ovulacija',
      'Ovulacija se može dogoditi i kad su ciklusi vrlo dugi',
      'Odgovarajuća skrb može povećati izglede za začeće',
      'Put plodnosti ovisi o svakoj osobi i mnogim drugim čimbenicima',
    ],
    section4Body3: 'Ni plodnost ne ovisi samo o ovulaciji. Ulogu mogu imati i dob, kvaliteta partnerovih spermija, stanje jajovoda, endometrij i drugi čimbenici. Zato je sveobuhvatna obrada važna kad trudnoća traje dulje od očekivanog.',
    section5Body1: 'Aplikacije za praćenje menstruacije općenito koriste podatke iz prethodnih ciklusa za izradu procjena. Kad su ciklusi relativno pravilni, te procjene mogu biti korisne kao referenca.',
    section5Body2: 'Kod PCOS-a, međutim, varijabilnost ciklusa može te izračune učiniti manje pouzdanima. Aplikacija ne može sa sigurnošću znati da je ovulacija nastupila samo zato što je dosegnut teorijski datum.',
    tip2Title: 'Koristi kao orijentir',
    tip2Text: 'Digitalno praćenje najkorisnije je za promatranje trendova u vlastitom ciklusu i vođenje povijesti koju možeš podijeliti sa zdravstvenim radnikom.',
    section6Body1: 'Redovito praćenje može ti pomoći bolje razumjeti vlastite varijacije. Cilj nije učiniti ciklus savršeno predvidljivim, nego prikupiti dovoljno informacija za prepoznavanje trendova.',
    trackingTips: [
      'Zabilježi datum prvog dana svakog ciklusa, čak i kad su ciklusi jako razmaknuti',
      'Promatraj promjene cervikalne sluzi tokom ciklusa',
      'Zabilježi svaku bol u zdjelici ili druge znakove koji mogu pratiti ovulaciju',
      'Nemoj se oslanjati samo na prosječnu duljinu od 28 dana za predviđanje ovulacije',
      'Testove ovulacije koristi oprezno i po potrebi zatraži savjet stručne osobe',
      'Prikupljene informacije podijeli sa zdravstvenim radnikom ako želiš zatrudnjeti',
    ],
    section6Body2: 'Može pomoći i bilježenje pratećih simptoma: boli, akni, promjena sluzi, neobičnog krvarenja, raspoloženja, sna ili drugih osobnih opažanja. Te informacije mogu pomoći u stvaranju potpunije slike tvog ciklusa.',
    section7Body1: 'Savjetovanje može biti vrijedno i prije nego što počneš pokušavati zatrudnjeti, kad su ciklusi vrlo nepravilni, jako razmaknuti ili kad menstruacije nema duže vrijeme.',
    section7Body2: 'Zdravstveni radnik može istražiti uzroke nepravilnosti, procijeniti ovulaciju i, ako je potrebno, predložiti strategiju prilagođenu tvojim planovima o trudnoći.',
    alert2Title: 'Kada zatražiti savjet',
    alert2Text: 'Ako su ti menstruacije jako razmaknute, ako nekoliko mjeseci nisi imala menstruaciju ili ako do trudnoće ne dolazi unatoč redovitim spolnim odnosima, razgovaraj sa zdravstvenim radnikom.',
    summaryTitle: 'Ključne tačke',
    summaryRows: [
      'PCOS može učiniti cikluse dugima i nepredvidljivima.',
      'Ovulacija može biti nepravilna ili izostati u nekim ciklusima.',
      'Nepravilan ciklus automatski ne znači nedostatak plodnosti.',
      'Predviđanja samo na temelju kalendara mogu biti manje pouzdana kod PCOS-a.',
      'Promatranje ciklusa i vođenje povijesti može biti korisno, osobito za savjetovanje.',
    ],
    finalTipTitle: 'Još jedna riječ',
    finalTipText: 'PCOS se ne pokazuje jednako kod svake žene. Tvoj se ciklus može mijenjati tokom vremena. Praćenje je tu da ti pomogne bolje razumjeti kako tvoje tijelo funkcionira, a ne da zamijeni ljekarski savjet.',
    disclaimer: 'Ovaj je članak samo informativne i edukativne naravi. Ne predstavlja medicinsku dijagnozu i ne zamjenjuje savjetovanje sa zdravstvenim radnikom.',
    shareMessage: 'Ciklus, ovulacija i plodnost kod PCOS-a — AWA',
  },
  sl: {
    badge: 'PCOS',
    title: 'Cikel, ovulacija\nin plodnost pri PCOS',
    metaDuration: '8 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Srednja raven',
    metaValidated: 'Preverjena vsebina',
    intro: 'Pri PCOS lahko cikel postane dolg, nereden in včasih težko predvidljiv. Razumevanje tega, kar se dogaja okoli ovulacije, ti lahko pomaga razumeti svoj cikel in bolje razumeti vprašanja, povezana s plodnostjo.',
    contentsTitle: 'V tem članku',
    topics: [
      'Zakaj cikel postane nereden',
      'Kaj se dogaja okoli ovulacije',
      'Kako prepoznati ovulacijo',
      'PCOS in plodnost',
      'Zakaj so aplikacije lahko manj natančne',
      'Spremljanje cikla pri PCOS',
      'Kdaj obiskati zdravnika, če želiš zanositi',
      'Ključna sporočila',
    ],
    section1Body1: 'Menstrualni cikel je odvisen od usklajenega zaporedja hormonskih signalov. Pri PCOS je ta organizacija lahko motena, zlasti pri razvoju foliklov in ovulaciji.',
    section1Body2: 'Jajčniki lahko vsebujejo veliko majhnih foliklov, ki se začnejo razvijati, ne da bi dominantni folikel redno dosegel zrelost. Ovulacija se lahko tedaj zakasni, nastopi nepredvidljivo ali v določenih ciklih sploh ne nastopi.',
    section1Body3: 'To je eden od razlogov, zakaj imajo nekatere osebe s PCOS cikle po 35, 45 ali včasih več dni, medtem ko imajo druge cikle, bližje običajni dolžini.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Sama dolžina cikla ti ne pove, ali je ovulacija nastopila. Dva cikla enake dolžine imata lahko različno hormonsko zgodbo.',
    section2Body1: 'Ovulacija je sprostitev jajčne celice iz jajčnika. Sledi fazi zorenja foliklov in je pred lutealno fazo cikla.',
    section2Body2: 'V rednem ciklu je ovulacija pogosto okoli sredine. A pri PCOS to preprosto pravilo ne velja vedno. Ovulacija je lahko precej poznejša ali v danem ciklu sploh ne nastopi.',
    infoTitle: 'Zakaj je to pomembno',
    infoText: 'Kadar je ovulacija nepredvidljiva, je težje oceniti plodno obdobje samo na podlagi datumov menstruacije.',
    section3Body1: 'Obstaja več telesnih znakov, ki lahko spremljajo hormonske spremembe okoli ovulacije. Lahko so koristni za opazovanje lastnega cikla, vendar noben posamezen znak ne more z gotovostjo potrditi ovulacije.',
    ovulationSigns: [
      'Sprememba materničnovratne sluzi, ki lahko postane obilnejša, bistra in raztegljiva',
      'Blaga bolečina ali nelagodje v mednožju pri nekaterih ženskah',
      'Sprememba telesne temperature po ovulaciji',
      'Sprememba nožnične vlažnosti',
      'Možen porast libida pri nekaterih ženskah',
    ],
    section3Body2: 'Materničnovratno sluz je še posebej vredno opazovati. Ko se plodno obdobje bliža, lahko postane obilnejša, bistra, spolzka in raztegljiva. Vendar se njen videz lahko razlikuje od osebe do osebe in od cikla do cikla.',
    alert1Title: 'Previdno z napovedmi',
    alert1Text: 'Pri zelo nerednih ciklih je datum ovulacije, samodejno izračunan iz prejšnjih ciklov, lahko zelo približen. Napoved ni zdravniška potrditev ovulacije.',
    section4Body1: 'PCOS lahko otežuje zanositev, predvsem kadar je ovulacija redka ali težko predvidljiva. Vendar imeti PCOS ne pomeni biti neplodna.',
    section4Body2: 'Nekatere ženske s PCOS ovulirajo redno in zanosijo brez posebnih težav. Pri drugih je ovulacija dovolj nepravilna, da zahteva obravnavo in morebitno zdravniško oskrbo.',
    fertilityPoints: [
      'PCOS samodejno ne povzroča neplodnosti',
      'Glavna težava je pogosto nepravilna ali nepredvidljiva ovulacija',
      'Ovulacija lahko nastopi, tudi kadar so cikli zelo dolgi',
      'Ustrezna oskrba lahko poveča možnosti za zanositev',
      'Pot plodnosti je odvisna od vsake osebe in številnih drugih dejavnikov',
    ],
    section4Body3: 'Tudi plodnost ni odvisna samo od ovulacije. Vlogo lahko igrajo tudi starost, kakovost partnerjevih spermijev, stanje jajcevodov, endometrij in drugi dejavniki. Zato je celovita obravnava pomembna, kadar nosečnost traja dlje od pričakovanega.',
    section5Body1: 'Aplikacije za spremljanje menstruacije na splošno uporabljajo podatke iz prejšnjih ciklov za izdelavo ocen. Kadar so cikli razmeroma redni, so lahko te ocene koristne kot referenca.',
    section5Body2: 'Pri PCOS pa lahko spremenljivost ciklov te izračune naredi manj zanesljive. Aplikacija ne more z gotovostjo vedeti, da je ovulacija nastopila, samo ker je dosežen teoretični datum.',
    tip2Title: 'Uporabi kot orientacijo',
    tip2Text: 'Digitalno spremljanje je najkoristnejše za opazovanje trendov v lastnem ciklu in vodenje zgodovine, ki jo lahko deliš z zdravstvenim delavcem.',
    section6Body1: 'Redno spremljanje ti lahko pomaga bolje razumeti lastne spremembe. Cilj ni narediti cikel popolnoma predvidljiv, ampak zbrati dovolj podatkov za prepoznavanje trendov.',
    trackingTips: [
      'Zabeleži datum prvega dne vsakega cikla, tudi kadar so cikli zelo razmaknjeni',
      'Opazuj spremembe materničnovratne sluzi skozi cikel',
      'Zabeleži vsako bolečino v mednožju ali druge znake, ki lahko spremljajo ovulacijo',
      'Ne zanašaj se samo na povprečno dolžino 28 dni za napovedovanje ovulacije',
      'Teste ovulacije uporabljaj previdno in po potrebi poišči nasvet strokovnjaka',
      'Zbrane podatke deli z zdravstvenim delavcem, če želiš zanositi',
    ],
    section6Body2: 'Lahko pomaga tudi beleženje spremljajočih simptomov: bolečine, akn, sprememb sluzi, nenavadne krvavitve, razpoloženja, spanja ali drugih osebnih opažanj. Ti podatki lahko pomagajo ustvariti popolnejšo sliko tvojega cikla.',
    section7Body1: 'Posvet je lahko vreden tudi, preden začneš poskušati zanositi, kadar so cikli zelo neredni, zelo razmaknjeni ali kadar menstruacije ni dlje časa.',
    section7Body2: 'Zdravstveni delavec lahko raziskuje vzroke nepravilnosti, oceni ovulacijo in po potrebi predlaga strategijo, prilagojeno tvojim načrtom glede nosečnosti.',
    alert2Title: 'Kdaj poiskati nasvet',
    alert2Text: 'Če so tvoje menstruacije zelo razmaknjene, če nekaj mesecev nisi imela menstruacije ali če do nosečnosti ne pride kljub rednim spolnim odnosom, se pogovori z zdravstvenim delavcem.',
    summaryTitle: 'Ključne točke',
    summaryRows: [
      'PCOS lahko naredi cikle dolge in nepredvidljive.',
      'Ovulacija je lahko nepravilna ali v nekaterih ciklih izostane.',
      'Nereden cikel samodejno ne pomeni pomanjkanja plodnosti.',
      'Napovedi samo na podlagi koledarja so pri PCOS lahko manj zanesljive.',
      'Opazovanje cikla in vodenje zgodovine je lahko koristno, zlasti za posvet.',
    ],
    finalTipTitle: 'Še ena beseda',
    finalTipText: 'PCOS se ne kaže enako pri vsaki ženski. Tvoj cikel se lahko skozi čas spreminja. Spremljanje je tu, da ti pomaga bolje razumeti, kako tvoje telo deluje, ne da bi nadomestilo zdravniški nasvet.',
    disclaimer: 'Ta članek je samo informativne in izobraževalne narave. Ne predstavlja zdravstvene diagnoze in ne nadomešča posvetovanja z zdravstvenim delavcem.',
    shareMessage: 'Cikel, ovulacija in plodnost pri PCOS — AWA',
  },
  ne: {
    badge: 'PCOS',
    title: 'PCOS मा चक्र, अण्डोत्सर्ग\nर उर्वरता',
    metaDuration: '8 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'PCOS भएमा, तपाईंको चक्र लामो, अनियमित र कहिलेकाहीँ पूर्वानुमान गर्न गाह्रो हुन सक्छ। अण्डोत्सर्गको वरिपरि के हुन्छ बुझ्नाले तपाईंलाई आफ्नो चक्र बुझ्न र उर्वरतासँग सम्बन्धित प्रश्नहरू राम्ररी बुझ्न मद्दत गर्न सक्छ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'चक्र किन अनियमित हुन्छ',
      'अण्डोत्सर्गको वरिपरि के हुन्छ',
      'अण्डोत्सर्ग कसरी चिन्ने',
      'PCOS र उर्वरता',
      'एपहरू किन कम सही हुन सक्छन्',
      'PCOS भएमा आफ्नो चक्र अनुगमन गर्ने',
      'गर्भधारण गर्न चाहँदा चिकित्सकलाई कहिले देखाउने',
      'मुख्य कुराहरू',
    ],
    section1Body1: 'मासिक चक्र हर्मोनल संकेतहरूको समन्वित क्रममा निर्भर गर्छ। PCOS मा, यो संगठन बिग्रन सक्छ, विशेष गरी फोलिकलको विकास र अण्डोत्सर्गमा।',
    section1Body2: 'अण्डाशयहरूमा धेरै साना फोलिकलहरू हुन सक्छन् जुन विकास हुन थाल्छन् तर कुनै प्रमुख फोलिकल नियमित रूपमा परिपक्वतासम्म पुग्दैन। अण्डोत्सर्ग त्यसपछि ढिलो हुन सक्छ, अप्रत्याशित रूपमा हुन सक्छ, वा केही चक्रमा हुँदै नहुन सक्छ।',
    section1Body3: 'यो एउटा कारण हो जसले गर्दा PCOS भएका केही मानिसहरूको चक्र 35, 45 वा कहिलेकाहीँ बढी दिनको हुन्छ, जबकि अरूको चक्र सामान्य अवधिको नजिक हुन सक्छ।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'चक्रको अवधिले मात्र अण्डोत्सर्ग भयो कि भएन भन्ने बताउँदैन। उही अवधिका दुई चक्रको हर्मोनल कथा फरक हुन सक्छ।',
    section2Body1: 'अण्डोत्सर्ग अण्डाशयबाट अण्डा निस्कनु हो। यो फोलिकलको परिपक्वताको चरणपछि आउँछ र चक्रको ल्युटियल चरणभन्दा अघि हुन्छ।',
    section2Body2: 'नियमित चक्रमा, अण्डोत्सर्ग प्रायः बीचतिर हुन्छ। तर PCOS मा, यो सरल नियम सधैँ लागू हुँदैन। अण्डोत्सर्ग धेरै ढिलो हुन सक्छ वा कुनै चक्रमा हुँदै नहुन सक्छ।',
    infoTitle: 'यो किन महत्त्वपूर्ण छ',
    infoText: 'अण्डोत्सर्ग अप्रत्याशित हुँदा, केवल महिनावारीको मितिमा आधारित उर्वर अवधि अनुमान गर्न अझ गाह्रो हुन्छ।',
    section3Body1: 'अण्डोत्सर्गको वरिपरि हर्मोनल परिवर्तनहरूसँग धेरै शारीरिक संकेतहरू आउन सक्छन्। ती आफ्नै चक्र अवलोकन गर्न उपयोगी हुन सक्छन्, तर कुनै एक संकेतले अण्डोत्सर्गलाई निश्चितताका साथ पुष्टि गर्न सक्दैन।',
    ovulationSigns: [
      'गर्भाशयको मुखको तरल पदार्थमा परिवर्तन, जुन बढी मात्रामा, स्पष्ट र तानिने हुन सक्छ',
      'केही महिलामा हल्का पेल्भिक दुखाइ वा असहजता',
      'अण्डोत्सर्गपछि शरीरको तापक्रममा परिवर्तन',
      'योनिको ओसिलोपनमा परिवर्तन',
      'केही महिलामा यौन इच्छामा सम्भावित वृद्धि',
    ],
    section3Body2: 'गर्भाशयको मुखको तरल पदार्थ विशेष रूपमा अवलोकन गर्न लायक हुन्छ। उर्वर अवधि नजिकिँदा, यो बढी मात्रामा, स्पष्ट, चिप्लो र तानिने हुन सक्छ। तथापि, यसको रूप व्यक्तिपिच्छे र चक्रपिच्छे फरक हुन सक्छ।',
    alert1Title: 'पूर्वानुमानमा सावधान रहनुहोस्',
    alert1Text: 'निकै अनियमित चक्रमा, अघिल्ला चक्रबाट स्वतः गणना गरिएको अण्डोत्सर्गको मिति निकै अनुमानित हुन सक्छ। पूर्वानुमान अण्डोत्सर्गको चिकित्सकीय पुष्टि होइन।',
    section4Body1: 'PCOS ले गर्भधारण अझ गाह्रो बनाउन सक्छ, मुख्यतया अण्डोत्सर्ग विरलै वा पूर्वानुमान गर्न गाह्रो हुँदा। तथापि, PCOS हुनुको अर्थ बाँझो हुनु होइन।',
    section4Body2: 'PCOS भएका केही महिलाहरू नियमित रूपमा अण्डोत्सर्ग गर्छन् र विशेष कठिनाइबिना गर्भधारण गर्छन्। अरूका लागि, अण्डोत्सर्ग मूल्याङ्कन र सम्भवतः चिकित्सकीय हेरचाह चाहिने गरी अनियमित हुन्छ।',
    fertilityPoints: [
      'PCOS ले स्वतः बाँझोपन निम्त्याउँदैन',
      'मुख्य कठिनाइ प्रायः अनियमित वा अप्रत्याशित अण्डोत्सर्ग हो',
      'चक्र निकै लामो हुँदा पनि अण्डोत्सर्ग हुन सक्छ',
      'उपयुक्त हेरचाहले गर्भधारणको सम्भावना बढाउन सक्छ',
      'उर्वरताको यात्रा हरेक व्यक्ति र धेरै अन्य कारकमा निर्भर गर्छ',
    ],
    section4Body3: 'उर्वरता अण्डोत्सर्गमा मात्र निर्भर गर्दैन। उमेर, साझेदारको शुक्रकीटको गुणस्तर, फेलोपियन नलीको अवस्था, एन्डोमेट्रियम र अन्य कारकहरूले पनि भूमिका खेल्न सक्छन्। त्यसैले गर्भावस्थामा अपेक्षित भन्दा बढी समय लाग्दा व्यापक मूल्याङ्कन महत्त्वपूर्ण हुन्छ।',
    section5Body1: 'महिनावारी अनुगमन गर्ने एपहरूले सामान्यतया अनुमान उत्पादन गर्न अघिल्ला चक्रका डेटा प्रयोग गर्छन्। चक्रहरू तुलनात्मक रूपमा नियमित हुँदा, यी अनुमानहरू सन्दर्भका रूपमा उपयोगी हुन सक्छन्।',
    section5Body2: 'तथापि, PCOS मा, चक्रको फरकपनले यी गणनाहरूलाई कम भरपर्दो बनाउन सक्छ। सैद्धान्तिक मिति आइपुगेकै कारण अण्डोत्सर्ग भइसक्यो भनेर एपले निश्चित रूपमा जान्न सक्दैन।',
    tip2Title: 'यसलाई सन्दर्भ बिन्दुका रूपमा प्रयोग गर्नुहोस्',
    tip2Text: 'डिजिटल अनुगमन तपाईंको आफ्नै चक्रका प्रवृत्तिहरू अवलोकन गर्न र आफ्ना स्वास्थ्य सेवा प्रदायकसँग साझा गर्न इतिहास राख्न सबैभन्दा उपयोगी हुन्छ।',
    section6Body1: 'नियमित अनुगमनले तपाईंलाई आफ्ना व्यक्तिगत भिन्नताहरू राम्ररी बुझ्न मद्दत गर्न सक्छ। लक्ष्य चक्रलाई पूर्ण रूपमा पूर्वानुमान गर्न सकिने बनाउनु होइन, प्रवृत्तिहरू पहिचान गर्न पर्याप्त जानकारी जम्मा गर्नु हो।',
    trackingTips: [
      'हरेक चक्रको पहिलो दिनको मिति टिप्नुहोस्, चक्रहरू निकै टाढा-टाढा हुँदा पनि',
      'चक्रभरि गर्भाशयको मुखको तरल पदार्थमा हुने परिवर्तन अवलोकन गर्नुहोस्',
      'अण्डोत्सर्गसँगै आउन सक्ने कुनै पेल्भिक दुखाइ वा अन्य संकेतहरू टिप्नुहोस्',
      'अण्डोत्सर्गको पूर्वानुमान गर्न केवल औसत 28 दिनको अवधिमा भर नपर्नुहोस्',
      'अण्डोत्सर्ग परीक्षणहरू सावधानीपूर्वक प्रयोग गर्नुहोस् र, आवश्यक परे, व्यावसायिकसँग सल्लाह लिनुहोस्',
      'गर्भवती हुन चाहनुहुन्छ भने आफूले जम्मा गरेको जानकारी स्वास्थ्यकर्मीसँग साझा गर्नुहोस्',
    ],
    section6Body2: 'सम्बन्धित लक्षणहरू टिप्न पनि मद्दत मिल्न सक्छ: दुखाइ, पिम्पल, तरल पदार्थमा परिवर्तन, असामान्य रक्तस्राव, मनोदशा, निद्रा वा अन्य व्यक्तिगत अवलोकनहरू। यो जानकारीले तपाईंको चक्रको अझ पूर्ण चित्र बनाउन मद्दत गर्न सक्छ।',
    section7Body1: 'गर्भधारणको प्रयास सुरु गर्नुअघि पनि, चक्रहरू निकै अनियमित, निकै टाढा-टाढा हुँदा, वा महिनावारी लामो समयसम्म नहुँदा परामर्श लायक हुन सक्छ।',
    section7Body2: 'स्वास्थ्यकर्मीले अनियमितताका कारणहरूको अनुसन्धान गर्न, अण्डोत्सर्गको मूल्याङ्कन गर्न, र आवश्यक परे, तपाईंको गर्भधारणका योजनाअनुकूल रणनीति सुझाउन सक्छन्।',
    alert2Title: 'सल्लाह कहिले लिने',
    alert2Text: 'तपाईंको महिनावारी निकै टाढा-टाढा हुन्छ, धेरै महिनासम्म महिनावारी भएको छैन, वा नियमित सम्भोग भए पनि गर्भधारण हुँदैन भने, स्वास्थ्यकर्मीसँग कुरा गर्नुहोस्।',
    summaryTitle: 'मुख्य बुँदाहरू',
    summaryRows: [
      'PCOS ले चक्रहरूलाई लामो र अप्रत्याशित बनाउन सक्छ।',
      'केही चक्रमा अण्डोत्सर्ग अनियमित वा अनुपस्थित हुन सक्छ।',
      'अनियमित चक्रको अर्थ उर्वरताको कमी स्वतः होइन।',
      'केवल पात्रोमा आधारित पूर्वानुमानहरू PCOS मा कम भरपर्दो हुन सक्छन्।',
      'आफ्नो चक्र अवलोकन गर्नु र इतिहास राख्नु उपयोगी हुन सक्छ, विशेष गरी परामर्शका लागि।',
    ],
    finalTipTitle: 'अन्तिम एक शब्द',
    finalTipText: 'PCOS हरेक महिलामा उस्तै रूपमा देखिँदैन। तपाईंको चक्र समयसँगै बदलिन सक्छ। अनुगमन तपाईंको शरीर कसरी काम गर्छ राम्ररी बुझ्न मद्दत गर्न हो, चिकित्सकीय सल्लाहको स्थान लिन होइन।',
    disclaimer: 'यो लेख केवल जानकारीमूलक र शैक्षिक उद्देश्यका लागि हो। यसले चिकित्सकीय निदान गठन गर्दैन र स्वास्थ्यकर्मीसँगको परामर्शको स्थान लिँदैन।',
    shareMessage: 'PCOS मा चक्र, अण्डोत्सर्ग र उर्वरता — AWA',
  },
  si: {
    badge: 'PCOS',
    title: 'PCOS හි චක්‍රය, ඩිම්බ මෝචනය\nසහ සාරවත් බව',
    metaDuration: 'කියවීමට මිනිත්තු 8',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'මධ්‍යම',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'PCOS සමඟ, ඔබේ චක්‍රය දිගු, අක්‍රමවත් සහ සමහර විට පුරෝකථනය කිරීමට අපහසු විය හැක. ඩිම්බ මෝචනය වටා සිදුවන්නේ කුමක්දැයි තේරුම් ගැනීම ඔබේ චක්‍රය අවබෝධ කරගැනීමට සහ සාරවත් බවට අදාළ ප්‍රශ්න වඩා හොඳින් තේරුම් ගැනීමට උපකාරී විය හැක.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'චක්‍රය අක්‍රමවත් වන්නේ ඇයි',
      'ඩිම්බ මෝචනය වටා සිදුවන්නේ කුමක්ද',
      'ඩිම්බ මෝචනය හඳුනාගන්නේ කෙසේද',
      'PCOS සහ සාරවත් බව',
      'යෙදුම් අඩු නිවැරදි විය හැක්කේ ඇයි',
      'PCOS සමඟ ඔබේ චක්‍රය නිරීක්ෂණය කිරීම',
      'ඔබ ගැබ්ගැනීමට කැමති නම් වෛද්‍යවරයෙකු හමුවිය යුත්තේ කවදාද',
      'ප්‍රධාන කරුණු',
    ],
    section1Body1: 'ඔසප් චක්‍රය රඳා පවතින්නේ සම්බන්ධීකරණය වූ හෝමෝන සංඥා අනුක්‍රමයක් මතය. PCOS හිදී, මෙම සංවිධානය, විශේෂයෙන් ෆොලිකල වර්ධනයේදී සහ ඩිම්බ මෝචනයේදී, කඩාකප්පල් විය හැක.',
    section1Body2: 'ඩිම්බකෝෂවල ප්‍රමුඛ ෆොලිකලයක් නිතිපතා පරිණත නොවී වර්ධනය වීමට පටන් ගන්නා කුඩා ෆොලිකල් රාශියක් අඩංගු විය හැක. ඩිම්බ මෝචනය එවිට ප්‍රමාද විය හැක, අනපේක්ෂිතව සිදුවිය හැක, නැතහොත් සමහර චක්‍රවලදී කිසිසේත් සිදු නොවිය හැක.',
    section1Body3: 'PCOS ඇති සමහර පුද්ගලයන්ට දින 35, 45, හෝ සමහර විට ඊට වඩා චක්‍ර තිබීමට එක් හේතුවක් මෙයයි, අනෙක් අයට සාමාන්‍ය දිගට සමීප චක්‍ර තිබිය හැක.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'චක්‍රයේ දිග තනිවම ඩිම්බ මෝචනය සිදු වූයේදැයි ඔබට නොකියයි. එකම දිගැති චක්‍ර දෙකකට වෙනස් හෝමෝන කතාවක් තිබිය හැක.',
    section2Body1: 'ඩිම්බ මෝචනය යනු ඩිම්බකෝෂයකින් ඩිම්බයක් නිකුත් කිරීමයි. එය ෆොලිකුලර් පරිණතභාවයේ අවධියකට පසුව සහ චක්‍රයේ ලූටියල් අවධියට පෙර සිදුවේ.',
    section2Body2: 'නිතිපතා චක්‍රයක, ඩිම්බ මෝචනය බොහෝ විට මැද වටා සිදුවේ. නමුත් PCOS සමඟ, මෙම සරල රීතිය සෑම විටම අදාළ නොවේ. ඩිම්බ මෝචනය බොහෝ සේ පසුව සිදුවිය හැක, නැතහොත් දී ඇති චක්‍රයක කිසිසේත් සිදු නොවිය හැක.',
    infoTitle: 'මෙය වැදගත් වන්නේ ඇයි',
    infoText: 'ඩිම්බ මෝචනය පුරෝකථනය කළ නොහැකි විට, ඔසප් දින මත පමණක් පදනම්ව සාරවත් කාලය ඇස්තමේන්තු කිරීම වඩා අපහසු වේ.',
    section3Body1: 'ඩිම්බ මෝචනය වටා හෝමෝන වෙනස්කම් සමඟ පැමිණිය හැකි ශාරීරික සලකුණු කිහිපයක් ඇත. ඒවා ඔබේම චක්‍රය නිරීක්ෂණය කිරීමට ප්‍රයෝජනවත් විය හැකි නමුත්, කිසිදු තනි සලකුණකට ඩිම්බ මෝචනය සහතිකයකින් තහවුරු කළ නොහැක.',
    ovulationSigns: [
      'වඩා බහුල, පැහැදිලි සහ දිගු විය හැකි බවට පත් විය හැකි ගර්භාෂ ග්‍රීවා ශ්ලේෂ්මලයේ වෙනසක්',
      'සමහර කාන්තාවන්ට සුළු ශ්‍රෝණි වේදනාව හෝ අපහසුතාව',
      'ඩිම්බ මෝචනයෙන් පසු ශරීර උෂ්ණත්වයේ වෙනසක්',
      'යෝනි තෙතමනයේ වෙනසක්',
      'සමහර කාන්තාවන්ට ලිබිඩෝවේ ඇතිවිය හැකි වැඩි වීමක්',
    ],
    section3Body2: 'ගර්භාෂ ග්‍රීවා ශ්ලේෂ්මල විශේෂයෙන් නිරීක්ෂණය කිරීම වටී. සාරවත් කාලය ළං වන විට, එය වඩා බහුල, පැහැදිලි, ලිස්සන සුළු සහ දිගු විය හැකි බවට පත් විය හැක. කෙසේ වෙතත්, එහි පෙනුම පුද්ගලයාගෙන් පුද්ගලයාට සහ චක්‍රයෙන් චක්‍රයට වෙනස් විය හැක.',
    alert1Title: 'අනාවැකි සමඟ ප්‍රවේශම් වන්න',
    alert1Text: 'ඉතා අක්‍රමවත් චක්‍රවල, පෙර චක්‍රවලින් ස්වයංක්‍රීයව ගණනය කළ ඩිම්බ මෝචන දිනයක් ඉතා ආසන්න විය හැක. අනාවැකියක් ඩිම්බ මෝචනයේ වෛද්‍ය තහවුරු කිරීමක් නොවේ.',
    section4Body1: 'PCOS ගර්භ ගැනීම වඩා අපහසු කළ හැක, ප්‍රධාන වශයෙන් ඩිම්බ මෝචනය කලාතුරකින් හෝ පුරෝකථනය කිරීමට අපහසු වන විට. කෙසේ වෙතත්, PCOS තිබීම නිසරු බව අදහස් නොවේ.',
    section4Body2: 'PCOS ඇති සමහර කාන්තාවන් නිතිපතා ඩිම්බ මෝචනය කර විශේෂ දුෂ්කරතාවකින් තොරව ගර්භ ගනී. අනෙක් අයට, ඩිම්බ මෝචනය තක්සේරුවක් සහ සමහර විට වෛද්‍ය සත්කාර ඉල්ලා සිටීමට තරම් අක්‍රමවත් වේ.',
    fertilityPoints: [
      'PCOS ස්වයංක්‍රීයව නිසරු බවක් ඇති නොකරයි',
      'ප්‍රධාන දුෂ්කරතාව බොහෝ විට අක්‍රමවත් හෝ පුරෝකථනය කළ නොහැකි ඩිම්බ මෝචනයයි',
      'චක්‍ර ඉතා දිගු වුවද ඩිම්බ මෝචනය සිදුවිය හැක',
      'සුදුසු සත්කාර ගර්භ ගැනීමේ අවස්ථා වැඩිදියුණු කළ හැක',
      'සාරවත් බව පිළිබඳ ගමන රඳා පවතින්නේ සෑම පුද්ගලයා මත සහ තවත් බොහෝ සාධක මතය',
    ],
    section4Body3: 'සාරවත් බව ඩිම්බ මෝචනය මත පමණක් රඳා නොපවතී. වයස, සහකරුගේ ශුක්‍රාණු ගුණාත්මකභාවය, ෆැලෝපීය නාල තත්ත්වය, ගර්භාෂ අන්තරාචරණය සහ වෙනත් සාධකද කාර්යභාරයක් ඉටු කළ හැක. ගර්භණී කාලය අපේක්ෂිතවට වඩා වැඩි කාලයක් ගන්නා විට විස්තීර්ණ තක්සේරුවක් වැදගත් වන්නේ එබැවිනි.',
    section5Body1: 'ඔසප් නිරීක්ෂණ යෙදුම් සාමාන්‍යයෙන් ඇස්තමේන්තු නිපදවීමට පෙර චක්‍රවල දත්ත භාවිතා කරයි. චක්‍ර සාපේක්ෂව නිතිපතා වන විට, මෙම ඇස්තමේන්තු යොමුවක් ලෙස ප්‍රයෝජනවත් විය හැක.',
    section5Body2: 'කෙසේ වෙතත් PCOS සමඟ, චක්‍ර විචලනය මෙම ගණනය කිරීම් අඩු විශ්වාසදායක කළ හැක. න්‍යායාත්මක දිනයකට ළඟා වූ පමණින් ඩිම්බ මෝචනය සිදු වූ බව යෙදුමකට නිසැකවම දැනගත නොහැක.',
    tip2Title: 'එය යොමු ලක්ෂ්‍යයක් ලෙස භාවිතා කරන්න',
    tip2Text: 'ඩිජිටල් නිරීක්ෂණය වඩාත්ම ප්‍රයෝජනවත් වන්නේ ඔබේම චක්‍රයේ ප්‍රවණතා නිරීක්ෂණය කිරීමට සහ ඔබේ සෞඛ්‍ය සේවා සපයන්නා සමඟ බෙදාගැනීමට ඉතිහාසයක් තබාගැනීමටයි.',
    section6Body1: 'නිතිපතා නිරීක්ෂණය ඔබේ පෞද්ගලික විචලනයන් වඩා හොඳින් තේරුම් ගැනීමට උපකාරී විය හැක. අරමුණ චක්‍රය පරිපූර්ණ ලෙස පුරෝකථනය කළ හැකි කිරීම නොව, ප්‍රවණතා හඳුනාගැනීමට ප්‍රමාණවත් තොරතුරු රැස් කිරීමයි.',
    trackingTips: [
      'චක්‍ර ඉතා පරතරයක් ඇති විට පවා, සෑම චක්‍රයක පළමු දිනයේ දිනය සටහන් කරන්න',
      'චක්‍රය පුරා ගර්භාෂ ග්‍රීවා ශ්ලේෂ්මලයේ වෙනස්කම් නිරීක්ෂණය කරන්න',
      'ඩිම්බ මෝචනය සමඟ පැමිණිය හැකි ඕනෑම ශ්‍රෝණි වේදනාවක් හෝ වෙනත් සලකුණු සටහන් කරන්න',
      'ඩිම්බ මෝචනය පුරෝකථනය කිරීමට සාමාන්‍ය දින 28 දිග මත පමණක් විශ්වාසය තැබීම වළක්වන්න',
      'ඩිම්බ මෝචන පරීක්ෂණ ප්‍රවේශමෙන් භාවිතා කර, අවශ්‍ය නම්, වෘත්තිකයෙකුගෙන් උපදෙස් ඉල්ලන්න',
      'ඔබ ගැබ්ගැනීමට කැමති නම් ඔබ රැස් කරන තොරතුරු සෞඛ්‍ය වෘත්තිකයෙකු සමඟ බෙදාගන්න',
    ],
    section6Body2: 'ආශ්‍රිත රෝග ලක්ෂණ සටහන් කිරීමද උපකාරී විය හැක: වේදනාව, කුරුලෑ, ශ්ලේෂ්මලයේ වෙනස්කම්, අසාමාන්‍ය ලේ ගැලීම, මනෝභාවය, නින්ද, හෝ වෙනත් පෞද්ගලික නිරීක්ෂණ. මෙම තොරතුරු ඔබේ චක්‍රයේ වඩා සම්පූර්ණ චිත්‍රයක් ගොඩනැගීමට උපකාරී විය හැක.',
    section7Body1: 'චක්‍ර ඉතා අක්‍රමවත්, ඉතා පරතරයක් ඇති විට, හෝ ඔසප් දිගු කලක් නොපැමිණෙන විට, ගැබ්ගැනීමට උත්සාහ කිරීම ආරම්භ කිරීමට පෙර පවා උපදේශනයක් වටී.',
    section7Body2: 'සෞඛ්‍ය වෘත්තිකයෙකුට අක්‍රමවත් බවේ හේතු විමර්ශනය කිරීමට, ඩිම්බ මෝචනය තක්සේරු කිරීමට සහ, අවශ්‍ය නම්, ඔබේ ගැබ්ගැනීමේ සැලසුම්වලට ගැළපෙන උපායමාර්ගයක් යෝජනා කිරීමට හැක.',
    alert2Title: 'උපදෙස් ඉල්ලිය යුත්තේ කවදාද',
    alert2Text: 'ඔබේ ඔසප් ඉතා පරතරයක් ඇති නම්, ඔබට මාස කිහිපයක් ඔසප් නොමැති නම්, හෝ නිතිපතා සංසර්ගය තිබියදීත් ගැබ්ගැනීමක් සිදු නොවන්නේ නම්, සෞඛ්‍ය වෘත්තිකයෙකු සමඟ කතා කරන්න.',
    summaryTitle: 'ප්‍රධාන කරුණු',
    summaryRows: [
      'PCOS චක්‍ර දිගු සහ පුරෝකථනය කළ නොහැකි කළ හැක.',
      'සමහර චක්‍රවල ඩිම්බ මෝචනය අක්‍රමවත් හෝ නොමැති විය හැක.',
      'අක්‍රමවත් චක්‍රයක් ස්වයංක්‍රීයව සාරවත් බව නොමැතිකම අදහස් නොවේ.',
      'දින දර්ශනය මත පමණක් පදනම් වූ අනාවැකි PCOS සමඟ අඩු විශ්වාසදායක විය හැක.',
      'ඔබේ චක්‍රය නිරීක්ෂණය කිරීම සහ ඉතිහාසයක් තබාගැනීම, විශේෂයෙන් උපදේශනයකට, ප්‍රයෝජනවත් විය හැක.',
    ],
    finalTipTitle: 'අවසන් වචනයක්',
    finalTipText: 'PCOS සෑම කාන්තාවකටම එකම ආකාරයෙන් ප්‍රකාශ නොවේ. ඔබේ චක්‍රය කාලයත් සමඟ වෙනස් විය හැක. නිරීක්ෂණය ඇත්තේ ඔබේ ශරීරය ක්‍රියා කරන ආකාරය වඩා හොඳින් තේරුම් ගැනීමට උපකාර කිරීමටයි, වෛද්‍ය උපදෙස් ප්‍රතිස්ථාපනය කිරීමට නොවේ.',
    disclaimer: 'මෙම ලිපිය තොරතුරු සහ අධ්‍යාපනික අරමුණු සඳහා පමණි. එය වෛද්‍ය රෝග විනිශ්චයක් නොවන අතර සෞඛ්‍ය වෘත්තිකයෙකු සමඟ උපදේශනයක් වෙනුවට නොපවතී.',
    shareMessage: 'PCOS හි චක්‍රය, ඩිම්බ මෝචනය සහ සාරවත් බව — AWA',
  },
  th: {
    badge: 'PCOS',
    title: 'รอบเดือน การตกไข่\nและภาวะเจริญพันธุ์เมื่อเป็น PCOS',
    metaDuration: 'อ่าน 8 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'ปานกลาง',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'เมื่อเป็น PCOS รอบเดือนของคุณอาจยาว ไม่สม่ำเสมอ และบางครั้งคาดเดายาก การเข้าใจสิ่งที่เกิดขึ้นรอบการตกไข่ช่วยให้คุณเข้าใจรอบเดือนของตัวเองและคำถามเกี่ยวกับภาวะเจริญพันธุ์ได้ดียิ่งขึ้น',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ทำไมรอบเดือนจึงไม่สม่ำเสมอ',
      'สิ่งที่เกิดขึ้นรอบการตกไข่',
      'วิธีสังเกตการตกไข่',
      'PCOS และภาวะเจริญพันธุ์',
      'ทำไมแอปอาจแม่นยำน้อยลง',
      'การติดตามรอบเดือนเมื่อเป็น PCOS',
      'เมื่อไรควรพบแพทย์หากต้องการมีบุตร',
      'ประเด็นสำคัญ',
    ],
    section1Body1: 'รอบเดือนขึ้นอยู่กับลำดับสัญญาณฮอร์โมนที่ประสานกัน ใน PCOS การจัดระเบียบนี้อาจถูกรบกวน โดยเฉพาะในการพัฒนาของฟอลลิเคิลและการตกไข่',
    section1Body2: 'รังไข่อาจมีฟอลลิเคิลเล็ก ๆ จำนวนมากที่เริ่มพัฒนา โดยไม่มีฟอลลิเคิลเด่นที่เติบโตเต็มที่อย่างสม่ำเสมอ การตกไข่จึงอาจล่าช้า เกิดขึ้นโดยคาดเดาไม่ได้ หรือไม่เกิดขึ้นเลยในบางรอบเดือน',
    section1Body3: 'นี่เป็นหนึ่งในเหตุผลที่บางคนที่เป็น PCOS มีรอบเดือน 35, 45 หรือบางครั้งมากกว่านั้น ขณะที่บางคนอาจมีรอบใกล้เคียงความยาวปกติ',
    tip1Title: 'ควรรู้',
    tip1Text: 'ความยาวของรอบเดือนอย่างเดียวไม่ได้บอกว่าเกิดการตกไข่หรือไม่ สองรอบเดือนที่ยาวเท่ากันอาจมีเรื่องราวของฮอร์โมนต่างกัน',
    section2Body1: 'การตกไข่คือการปล่อยไข่จากรังไข่ ตามหลังระยะการเจริญเต็มที่ของฟอลลิเคิล และมาก่อนระยะลูเทียลของรอบเดือน',
    section2Body2: 'ในรอบเดือนที่สม่ำเสมอ การตกไข่มักอยู่ราวกึ่งกลาง แต่เมื่อเป็น PCOS กฎง่าย ๆ นี้ไม่ได้ใช้ได้เสมอไป การตกไข่อาจช้ากว่ามากหรืออาจไม่เกิดขึ้นเลยในรอบหนึ่ง',
    infoTitle: 'ทำไมเรื่องนี้จึงสำคัญ',
    infoText: 'เมื่อการตกไข่คาดเดาไม่ได้ จะประมาณช่วงเจริญพันธุ์จากวันที่ประจำเดือนอย่างเดียวได้ยากขึ้น',
    section3Body1: 'มีสัญญาณทางกายหลายอย่างที่อาจมาพร้อมกับการเปลี่ยนแปลงของฮอร์โมนรอบการตกไข่ มีประโยชน์ในการสังเกตรอบเดือนของคุณเอง แต่ไม่มีสัญญาณใดที่ยืนยันการตกไข่ได้อย่างแน่นอนเพียงอย่างเดียว',
    ovulationSigns: [
      'เมือกปากมดลูกเปลี่ยนไป อาจมากขึ้น ใส และยืดได้',
      'ปวดหรือไม่สบายอุ้งเชิงกรานเล็กน้อยในผู้หญิงบางคน',
      'อุณหภูมิร่างกายเปลี่ยนไปหลังการตกไข่',
      'ความชุ่มชื้นของช่องคลอดเปลี่ยนไป',
      'ความต้องการทางเพศอาจเพิ่มขึ้นในผู้หญิงบางคน',
    ],
    section3Body2: 'เมือกปากมดลูกน่าสังเกตเป็นพิเศษ เมื่อใกล้ช่วงเจริญพันธุ์ อาจมากขึ้น ใส ลื่น และยืดได้ อย่างไรก็ตาม ลักษณะอาจแตกต่างกันในแต่ละคนและแต่ละรอบเดือน',
    alert1Title: 'ระวังเรื่องการคาดการณ์',
    alert1Text: 'เมื่อรอบเดือนไม่สม่ำเสมอมาก วันตกไข่ที่คำนวณอัตโนมัติจากรอบเดือนก่อนหน้าอาจคลาดเคลื่อนมาก การคาดการณ์ไม่ใช่การยืนยันการตกไข่ทางการแพทย์',
    section4Body1: 'PCOS อาจทำให้การตั้งครรภ์ยากขึ้น โดยหลักเมื่อการตกไข่ไม่บ่อยหรือคาดเดายาก อย่างไรก็ตาม การเป็น PCOS ไม่ได้หมายความว่ามีบุตรยาก',
    section4Body2: 'ผู้หญิงบางคนที่เป็น PCOS ตกไข่สม่ำเสมอและตั้งครรภ์ได้โดยไม่ยากเป็นพิเศษ สำหรับคนอื่น การตกไข่ไม่สม่ำเสมอพอที่ต้องมีการประเมินและอาจต้องได้รับการดูแลทางการแพทย์',
    fertilityPoints: [
      'PCOS ไม่ได้ทำให้มีบุตรยากโดยอัตโนมัติ',
      'ความยากหลักมักเป็นการตกไข่ที่ไม่สม่ำเสมอหรือคาดเดาไม่ได้',
      'การตกไข่เกิดขึ้นได้แม้รอบเดือนจะยาวมาก',
      'การดูแลที่เหมาะสมช่วยเพิ่มโอกาสตั้งครรภ์ได้',
      'เส้นทางภาวะเจริญพันธุ์ขึ้นอยู่กับแต่ละบุคคลและปัจจัยอื่นอีกมากมาย',
    ],
    section4Body3: 'ภาวะเจริญพันธุ์ไม่ได้ขึ้นกับการตกไข่อย่างเดียวเช่นกัน อายุ คุณภาพอสุจิของคู่ สภาพของท่อนำไข่ เยื่อบุโพรงมดลูก และปัจจัยอื่นก็มีบทบาทได้ นี่คือเหตุผลที่การประเมินอย่างครบถ้วนสำคัญเมื่อการตั้งครรภ์ใช้เวลานานกว่าที่คาด',
    section5Body1: 'แอปติดตามประจำเดือนโดยทั่วไปใช้ข้อมูลจากรอบเดือนก่อนหน้าเพื่อประมาณค่า เมื่อรอบเดือนค่อนข้างสม่ำเสมอ ค่าประมาณเหล่านี้มีประโยชน์เป็นข้อมูลอ้างอิง',
    section5Body2: 'อย่างไรก็ตาม เมื่อเป็น PCOS ความแปรผันของรอบเดือนอาจทำให้การคำนวณเหล่านี้เชื่อถือได้น้อยลง แอปไม่สามารถรู้ได้แน่นอนว่าเกิดการตกไข่เพียงเพราะถึงวันที่ตามทฤษฎีแล้ว',
    tip2Title: 'ใช้เป็นจุดอ้างอิง',
    tip2Text: 'การติดตามดิจิทัลมีประโยชน์ที่สุดสำหรับการสังเกตแนวโน้มในรอบเดือนของคุณเองและเก็บประวัติเพื่อแบ่งปันกับผู้ให้การดูแลสุขภาพของคุณ',
    section6Body1: 'การติดตามสม่ำเสมอช่วยให้คุณเข้าใจความแปรผันส่วนตัวได้ดีขึ้น เป้าหมายไม่ใช่การทำให้รอบเดือนคาดเดาได้อย่างสมบูรณ์ แต่เป็นการรวบรวมข้อมูลพอที่จะระบุแนวโน้ม',
    trackingTips: [
      'จดวันที่ของวันแรกของทุกรอบเดือน แม้เมื่อรอบเดือนห่างกันมาก',
      'สังเกตการเปลี่ยนแปลงของเมือกปากมดลูกตลอดรอบเดือน',
      'จดอาการปวดอุ้งเชิงกรานหรือสัญญาณอื่นที่อาจมาพร้อมกับการตกไข่',
      'หลีกเลี่ยงการอาศัยความยาวเฉลี่ย 28 วันเพียงอย่างเดียวเพื่อคาดการณ์การตกไข่',
      'ใช้การตรวจการตกไข่อย่างระมัดระวัง และหากจำเป็นให้ขอคำแนะนำจากผู้เชี่ยวชาญ',
      'แบ่งปันข้อมูลที่คุณรวบรวมกับบุคลากรทางการแพทย์หากคุณต้องการตั้งครรภ์',
    ],
    section6Body2: 'การจดอาการที่เกี่ยวข้องก็ช่วยได้เช่นกัน: อาการปวด สิว การเปลี่ยนแปลงของเมือก เลือดออกผิดปกติ อารมณ์ การนอนหลับ หรือข้อสังเกตส่วนตัวอื่น ๆ ข้อมูลนี้ช่วยสร้างภาพรวมที่สมบูรณ์ยิ่งขึ้นของรอบเดือนของคุณ',
    section7Body1: 'การปรึกษาอาจคุ้มค่าแม้ก่อนเริ่มพยายามมีบุตร เมื่อรอบเดือนไม่สม่ำเสมอมาก ห่างกันมาก หรือเมื่อประจำเดือนขาดหายไปเป็นเวลานาน',
    section7Body2: 'บุคลากรทางการแพทย์สามารถสืบหาสาเหตุของความไม่สม่ำเสมอ ประเมินการตกไข่ และหากจำเป็น แนะนำกลยุทธ์ที่เหมาะกับแผนการตั้งครรภ์ของคุณ',
    alert2Title: 'เมื่อไรควรขอคำแนะนำ',
    alert2Text: 'หากประจำเดือนของคุณห่างกันมาก หากคุณไม่มีประจำเดือนหลายเดือน หรือหากไม่ตั้งครรภ์แม้มีเพศสัมพันธ์สม่ำเสมอ ให้พูดคุยกับบุคลากรทางการแพทย์',
    summaryTitle: 'ประเด็นสำคัญ',
    summaryRows: [
      'PCOS อาจทำให้รอบเดือนยาวและคาดเดาไม่ได้',
      'การตกไข่อาจไม่สม่ำเสมอหรือไม่เกิดในบางรอบเดือน',
      'รอบเดือนที่ไม่สม่ำเสมอไม่ได้หมายถึงการขาดภาวะเจริญพันธุ์โดยอัตโนมัติ',
      'การคาดการณ์ที่อิงปฏิทินอย่างเดียวอาจเชื่อถือได้น้อยลงเมื่อเป็น PCOS',
      'การสังเกตรอบเดือนและเก็บประวัติมีประโยชน์ โดยเฉพาะสำหรับการปรึกษา',
    ],
    finalTipTitle: 'คำสุดท้าย',
    finalTipText: 'PCOS ไม่ได้ปรากฏเหมือนกันในผู้หญิงทุกคน รอบเดือนของคุณอาจเปลี่ยนไปตามเวลา การติดตามมีไว้เพื่อช่วยให้คุณเข้าใจการทำงานของร่างกายดียิ่งขึ้น ไม่ใช่เพื่อทดแทนคำแนะนำทางการแพทย์',
    disclaimer: 'บทความนี้เพื่อให้ข้อมูลและการเรียนรู้เท่านั้น ไม่ใช่การวินิจฉัยทางการแพทย์ และไม่ได้ทดแทนการปรึกษาบุคลากรทางการแพทย์',
    shareMessage: 'รอบเดือน การตกไข่ และภาวะเจริญพันธุ์เมื่อเป็น PCOS — AWA',
  },
  vi: {
    badge: 'PCOS',
    title: 'Chu kỳ, rụng trứng\nvà khả năng sinh sản khi bị PCOS',
    metaDuration: '8 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Trung cấp',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Khi bị PCOS, chu kỳ của bạn có thể trở nên dài, không đều và đôi khi khó dự đoán. Hiểu điều gì xảy ra quanh thời điểm rụng trứng có thể giúp bạn hiểu chu kỳ của mình và các câu hỏi liên quan đến khả năng sinh sản tốt hơn.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Tại sao chu kỳ trở nên không đều',
      'Điều gì xảy ra quanh thời điểm rụng trứng',
      'Cách nhận biết rụng trứng',
      'PCOS và khả năng sinh sản',
      'Tại sao các ứng dụng có thể kém chính xác hơn',
      'Theo dõi chu kỳ khi bị PCOS',
      'Khi nào nên đi khám bác sĩ nếu bạn muốn thụ thai',
      'Những điểm chính cần nhớ',
    ],
    section1Body1: 'Chu kỳ kinh nguyệt phụ thuộc vào một chuỗi tín hiệu nội tiết phối hợp với nhau. Ở PCOS, sự tổ chức này có thể bị rối loạn, đặc biệt trong quá trình phát triển nang trứng và rụng trứng.',
    section1Body2: 'Buồng trứng có thể chứa nhiều nang nhỏ bắt đầu phát triển mà không có nang trội nào đạt đến độ chín một cách đều đặn. Khi đó, rụng trứng có thể bị trì hoãn, xảy ra không dự đoán được hoặc hoàn toàn không xảy ra trong một số chu kỳ.',
    section1Body3: 'Đây là một trong những lý do một số người bị PCOS có chu kỳ 35, 45 ngày hoặc đôi khi lâu hơn, trong khi những người khác có thể có chu kỳ gần với độ dài điển hình.',
    tip1Title: 'Nên biết',
    tip1Text: 'Chỉ riêng độ dài chu kỳ không cho biết có rụng trứng hay không. Hai chu kỳ cùng độ dài có thể có câu chuyện nội tiết khác nhau.',
    section2Body1: 'Rụng trứng là việc phóng thích một quả trứng từ buồng trứng. Nó diễn ra sau giai đoạn trưởng thành của nang trứng và trước giai đoạn hoàng thể của chu kỳ.',
    section2Body2: 'Trong một chu kỳ đều, rụng trứng thường vào khoảng giữa chu kỳ. Nhưng với PCOS, quy tắc đơn giản này không phải lúc nào cũng áp dụng. Rụng trứng có thể muộn hơn nhiều hoặc không xảy ra trong một chu kỳ nhất định.',
    infoTitle: 'Tại sao điều này quan trọng',
    infoText: 'Khi rụng trứng không dự đoán được, việc ước tính giai đoạn dễ thụ thai chỉ dựa trên ngày kỳ kinh trở nên khó khăn hơn.',
    section3Body1: 'Có một số dấu hiệu thể chất có thể đi kèm những thay đổi nội tiết quanh thời điểm rụng trứng. Chúng có thể hữu ích để quan sát chu kỳ của chính bạn, nhưng không dấu hiệu đơn lẻ nào có thể xác nhận rụng trứng một cách chắc chắn.',
    ovulationSigns: [
      'Sự thay đổi của dịch nhầy cổ tử cung, có thể trở nên nhiều hơn, trong và kéo sợi',
      'Đau nhẹ hoặc khó chịu vùng chậu ở một số phụ nữ',
      'Sự thay đổi thân nhiệt sau khi rụng trứng',
      'Sự thay đổi độ ẩm âm đạo',
      'Có thể tăng ham muốn tình dục ở một số phụ nữ',
    ],
    section3Body2: 'Dịch nhầy cổ tử cung đặc biệt đáng được quan sát. Khi giai đoạn dễ thụ thai đến gần, nó có thể trở nên nhiều hơn, trong, trơn và kéo sợi. Tuy nhiên, hình dạng của nó có thể khác nhau giữa từng người và từ chu kỳ này sang chu kỳ khác.',
    alert1Title: 'Hãy thận trọng với các dự đoán',
    alert1Text: 'Với những chu kỳ rất không đều, ngày rụng trứng được tính tự động từ các chu kỳ trước có thể rất gần đúng. Một dự đoán không phải là xác nhận y khoa về việc rụng trứng.',
    section4Body1: 'PCOS có thể khiến việc thụ thai khó khăn hơn, chủ yếu khi rụng trứng thưa hoặc khó dự đoán. Tuy nhiên, bị PCOS không có nghĩa là vô sinh.',
    section4Body2: 'Một số phụ nữ bị PCOS rụng trứng đều đặn và thụ thai không gặp khó khăn đặc biệt. Với những người khác, rụng trứng không đều đến mức cần được đánh giá và có thể cần chăm sóc y tế.',
    fertilityPoints: [
      'PCOS không tự động gây vô sinh',
      'Khó khăn chính thường là rụng trứng không đều hoặc không dự đoán được',
      'Rụng trứng có thể xảy ra ngay cả khi chu kỳ rất dài',
      'Chăm sóc phù hợp có thể cải thiện cơ hội thụ thai',
      'Hành trình sinh sản phụ thuộc vào từng cá nhân và nhiều yếu tố khác',
    ],
    section4Body3: 'Khả năng sinh sản cũng không chỉ phụ thuộc vào rụng trứng. Tuổi, chất lượng tinh trùng của bạn đời, tình trạng vòi trứng, nội mạc tử cung và các yếu tố khác cũng có thể đóng vai trò. Đó là lý do một đánh giá toàn diện quan trọng khi việc mang thai mất nhiều thời gian hơn dự kiến.',
    section5Body1: 'Các ứng dụng theo dõi kỳ kinh thường dùng dữ liệu từ các chu kỳ trước để đưa ra ước tính. Khi chu kỳ tương đối đều, các ước tính này có thể hữu ích như một tham chiếu.',
    section5Body2: 'Tuy nhiên, với PCOS, sự biến động của chu kỳ có thể khiến những phép tính này kém tin cậy hơn. Một ứng dụng không thể biết chắc chắn rằng rụng trứng đã xảy ra chỉ vì đã đến một ngày lý thuyết.',
    tip2Title: 'Hãy dùng nó như một mốc tham khảo',
    tip2Text: 'Theo dõi kỹ thuật số hữu ích nhất để quan sát xu hướng trong chu kỳ của chính bạn và lưu giữ lịch sử để chia sẻ với nhân viên y tế.',
    section6Body1: 'Theo dõi đều đặn có thể giúp bạn hiểu rõ hơn những biến đổi cá nhân của mình. Mục đích không phải là làm cho chu kỳ hoàn toàn dự đoán được, mà là thu thập đủ thông tin để nhận ra các xu hướng.',
    trackingTips: [
      'Ghi lại ngày đầu tiên của mỗi chu kỳ, kể cả khi các chu kỳ cách nhau rất xa',
      'Quan sát những thay đổi của dịch nhầy cổ tử cung trong suốt chu kỳ',
      'Ghi lại mọi cơn đau vùng chậu hoặc dấu hiệu khác có thể đi kèm rụng trứng',
      'Tránh chỉ dựa vào độ dài trung bình 28 ngày để dự đoán rụng trứng',
      'Dùng que thử rụng trứng một cách thận trọng và, nếu cần, hỏi lời khuyên của chuyên gia',
      'Chia sẻ thông tin bạn thu thập với nhân viên y tế nếu bạn muốn có thai',
    ],
    section6Body2: 'Việc ghi lại các triệu chứng đi kèm cũng có thể hữu ích: đau, mụn, thay đổi dịch nhầy, ra máu bất thường, tâm trạng, giấc ngủ hoặc những quan sát cá nhân khác. Thông tin này có thể giúp xây dựng bức tranh đầy đủ hơn về chu kỳ của bạn.',
    section7Body1: 'Một buổi khám có thể đáng giá ngay cả trước khi bắt đầu cố gắng thụ thai, khi chu kỳ rất không đều, rất thưa hoặc khi kỳ kinh vắng mặt trong thời gian dài.',
    section7Body2: 'Nhân viên y tế có thể tìm nguyên nhân của sự không đều, đánh giá việc rụng trứng và, nếu cần, đề xuất một chiến lược phù hợp với kế hoạch mang thai của bạn.',
    alert2Title: 'Khi nào nên tìm lời khuyên',
    alert2Text: 'Nếu kỳ kinh của bạn rất thưa, nếu bạn không có kinh trong nhiều tháng hoặc nếu không có thai dù quan hệ đều đặn, hãy nói chuyện với nhân viên y tế.',
    summaryTitle: 'Những điểm chính',
    summaryRows: [
      'PCOS có thể khiến chu kỳ dài và không dự đoán được.',
      'Rụng trứng có thể không đều hoặc không xảy ra trong một số chu kỳ.',
      'Chu kỳ không đều không tự động có nghĩa là thiếu khả năng sinh sản.',
      'Các dự đoán chỉ dựa trên lịch có thể kém tin cậy hơn khi bị PCOS.',
      'Quan sát chu kỳ và lưu giữ lịch sử có thể hữu ích, đặc biệt cho một buổi khám.',
    ],
    finalTipTitle: 'Một lời cuối',
    finalTipText: 'PCOS không biểu hiện giống nhau ở mọi phụ nữ. Chu kỳ của bạn có thể thay đổi theo thời gian. Việc theo dõi ở đây để giúp bạn hiểu rõ hơn cách cơ thể hoạt động, không phải để thay thế lời khuyên y khoa.',
    disclaimer: 'Bài viết này chỉ nhằm mục đích thông tin và giáo dục. Nó không phải là chẩn đoán y khoa và không thay thế buổi khám với nhân viên y tế.',
    shareMessage: 'Chu kỳ, rụng trứng và khả năng sinh sản khi bị PCOS — AWA',
  },
  uz: {
    badge: 'PCOS',
    title: 'PCOS da sikl, ovulyatsiya\nva unumdorlik',
    metaDuration: '8 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Oʻrta',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'PCOS bilan siklingiz uzun, notekis va baʼzan oldindan aytish qiyin boʻlib qolishi mumkin. Ovulyatsiya atrofida nima sodir boʻlishini tushunish siklingizni anglashga va unumdorlik bilan bogʻliq savollarni yaxshiroq tushunishga yordam beradi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Nima uchun sikl notekis boʻlib qoladi',
      'Ovulyatsiya atrofida nima sodir boʻladi',
      'Ovulyatsiyani qanday tanish mumkin',
      'PCOS va unumdorlik',
      'Nima uchun ilovalar kamroq aniq boʻlishi mumkin',
      'PCOS bilan siklni kuzatish',
      'Homilador boʻlmoqchi boʻlsangiz, qachon shifokorga borish kerak',
      'Asosiy xulosalar',
    ],
    section1Body1: 'Hayz sikli gormonal signallarning kelishilgan ketma-ketligiga bogʻliq. PCOS da bu tartib, ayniqsa follikul rivojlanishi va ovulyatsiyada, buzilishi mumkin.',
    section1Body2: 'Tuxumdonlarda koʻplab mayda follikullar boʻlishi mumkin, ular rivojlana boshlaydi, ammo yetakchi follikul muntazam pishib yetmaydi. Shunda ovulyatsiya kechikishi, oldindan aytib boʻlmaydigan tarzda sodir boʻlishi yoki baʼzi sikllarda umuman sodir boʻlmasligi mumkin.',
    section1Body3: 'Bu PCOS li baʼzi odamlarda sikllar 35, 45 yoki baʼzan undan koʻproq kun davom etishining sabablaridan biri, boshqalarda esa sikllar odatiy uzunlikka yaqinroq boʻlishi mumkin.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Yakka sikl uzunligi ovulyatsiya sodir boʻlgan-boʻlmaganini aytmaydi. Bir xil uzunlikdagi ikki siklning gormonal tarixi turlicha boʻlishi mumkin.',
    section2Body1: 'Ovulyatsiya — tuxumdondan tuxum hujayra chiqishi. U follikul pishish bosqichidan keyin keladi va siklning lyuteal bosqichidan oldin turadi.',
    section2Body2: 'Muntazam sikl bilan ovulyatsiya koʻpincha oʻrtada sodir boʻladi. Ammo PCOS bilan bu oddiy qoida har doim ham amal qilmaydi. Ovulyatsiya ancha kechroq boʻlishi yoki muayyan siklda umuman sodir boʻlmasligi mumkin.',
    infoTitle: 'Bu nima uchun muhim',
    infoText: 'Ovulyatsiyani oldindan aytib boʻlmaydigan boʻlsa, unumdorlik davrini faqat hayz sanalariga qarab taxmin qilish qiyinlashadi.',
    section3Body1: 'Ovulyatsiya atrofidagi gormonal oʻzgarishlarga hamroh boʻlishi mumkin boʻlgan bir nechta jismoniy belgi bor. Ular oʻz siklingizni kuzatish uchun foydali boʻlishi mumkin, ammo birorta belgi ovulyatsiyani aniq tasdiqlay olmaydi.',
    ovulationSigns: [
      'Bachadon boʻyni shilligining oʻzgarishi: u koʻproq, shaffof va choʻziluvchan boʻlishi mumkin',
      'Baʼzi ayollarda chanoqdagi yengil ogʻriq yoki noqulaylik',
      'Ovulyatsiyadan keyin tana haroratining oʻzgarishi',
      'Qin namligining oʻzgarishi',
      'Baʼzi ayollarda libidoning mumkin boʻlgan ortishi',
    ],
    section3Body2: 'Bachadon boʻyni shilligini ayniqsa kuzatishga arziydi. Unumdorlik davri yaqinlashganda u koʻproq, shaffof, sirpanchiq va choʻziluvchan boʻlishi mumkin. Biroq uning koʻrinishi odamdan odamga va sikldan sikliga farq qilishi mumkin.',
    alert1Title: 'Bashoratlarga ehtiyotkor boʻling',
    alert1Text: 'Juda notekis sikllarda oldingi sikllardan avtomatik hisoblangan ovulyatsiya sanasi juda taxminiy boʻlishi mumkin. Bashorat ovulyatsiyaning tibbiy tasdigʻi emas.',
    section4Body1: 'PCOS homilador boʻlishni qiyinlashtirishi mumkin, asosan ovulyatsiya kam uchraganda yoki oldindan aytish qiyin boʻlganda. Biroq PCOS borligi bepushtlikni anglatmaydi.',
    section4Body2: 'PCOS li baʼzi ayollar muntazam ovulyatsiya qiladi va alohida qiyinchiliksiz homilador boʻladi. Boshqalar uchun ovulyatsiya baholash va, ehtimol, tibbiy yordamni talab qiladigan darajada notekis.',
    fertilityPoints: [
      'PCOS avtomatik ravishda bepushtlikka olib kelmaydi',
      'Asosiy qiyinchilik koʻpincha notekis yoki oldindan aytib boʻlmaydigan ovulyatsiya',
      'Sikllar juda uzun boʻlganda ham ovulyatsiya sodir boʻlishi mumkin',
      'Mos yordam homilador boʻlish imkoniyatini oshirishi mumkin',
      'Unumdorlik yoʻli har bir odamga va koʻplab boshqa omillarga bogʻliq',
    ],
    section4Body3: 'Unumdorlik ham faqat ovulyatsiyaga bogʻliq emas. Yosh, hamrohning spermatozoidlari sifati, fallopiy naychalarining holati, endometriy va boshqa omillar ham rol oʻynashi mumkin. Shuning uchun homiladorlik kutilganidan uzoqroq vaqt olganda har tomonlama baholash muhim.',
    section5Body1: 'Hayzni kuzatish ilovalari odatda taxmin chiqarish uchun oldingi sikllar maʼlumotlaridan foydalanadi. Sikllar nisbatan muntazam boʻlganda bu taxminlar tayanch sifatida foydali boʻlishi mumkin.',
    section5Body2: 'Biroq PCOS bilan sikl oʻzgaruvchanligi bu hisob-kitoblarni kamroq ishonchli qilishi mumkin. Ilova nazariy sanaga yetilgani uchungina ovulyatsiya sodir boʻlganini aniq bila olmaydi.',
    tip2Title: 'Undan tayanch nuqta sifatida foydalaning',
    tip2Text: 'Raqamli kuzatuv oʻz siklingizdagi tendensiyalarni kuzatish va sogʻliqni saqlash xodimi bilan ulashish uchun tarixni saqlashda eng foydali.',
    section6Body1: 'Muntazam kuzatuv shaxsiy oʻzgaruvchanligingizni yaxshiroq tushunishga yordam beradi. Maqsad siklni mutlaqo oldindan aytib boʻladigan qilish emas, balki tendensiyalarni aniqlash uchun yetarli maʼlumot toʻplash.',
    trackingTips: [
      'Sikllar juda uzoq oraliqda boʻlsa ham, har bir siklning birinchi kuni sanasini yozib qoʻying',
      'Sikl davomida bachadon boʻyni shilligining oʻzgarishini kuzating',
      'Chanoqdagi ogʻriq yoki ovulyatsiyaga hamroh boʻlishi mumkin boʻlgan boshqa belgilarni yozib qoʻying',
      'Ovulyatsiyani bashorat qilish uchun faqat oʻrtacha 28 kunlik uzunlikka tayanishdan saqlaning',
      'Ovulyatsiya testlaridan ehtiyotkorlik bilan foydalaning va kerak boʻlsa, mutaxassisdan maslahat soʻrang',
      'Agar homilador boʻlmoqchi boʻlsangiz, toʻplagan maʼlumotlaringizni sogʻliqni saqlash mutaxassisi bilan ulashing',
    ],
    section6Body2: 'Bogʻliq alomatlarni ham yozib borish foydali boʻlishi mumkin: ogʻriq, husnbuzar, shilliq oʻzgarishlari, odatdan tashqari qon ketishi, kayfiyat, uyqu yoki boshqa shaxsiy kuzatuvlar. Bu maʼlumotlar siklingiz haqida toʻliqroq tasavvur yaratishga yordam beradi.',
    section7Body1: 'Sikllar juda notekis, juda uzoq oraliqda boʻlganda yoki hayz uzoq vaqt boʻlmaganda, hatto homilador boʻlishga urinishni boshlashdan oldin ham maslahat foydali boʻlishi mumkin.',
    section7Body2: 'Sogʻliqni saqlash mutaxassisi notekisliklarning sabablarini tekshirishi, ovulyatsiyani baholashi va kerak boʻlsa, homiladorlik rejalaringizga mos strategiyani taklif qilishi mumkin.',
    alert2Title: 'Qachon maslahat soʻrash kerak',
    alert2Text: 'Agar hayzlaringiz juda uzoq oraliqda boʻlsa, bir necha oy hayz boʻlmasa yoki muntazam jinsiy aloqaga qaramay homiladorlik boʻlmasa, sogʻliqni saqlash mutaxassisi bilan gaplashing.',
    summaryTitle: 'Asosiy nuqtalar',
    summaryRows: [
      'PCOS sikllarni uzun va oldindan aytib boʻlmaydigan qilishi mumkin.',
      'Baʼzi sikllarda ovulyatsiya notekis yoki boʻlmasligi mumkin.',
      'Notekis sikl avtomatik ravishda unumdorlik yoʻqligini anglatmaydi.',
      'Faqat taqvimga asoslangan bashoratlar PCOS bilan kamroq ishonchli boʻlishi mumkin.',
      'Siklingizni kuzatish va tarixni saqlash, ayniqsa qabul uchun, foydali boʻlishi mumkin.',
    ],
    finalTipTitle: 'Yana bir ogʻiz soʻz',
    finalTipText: 'PCOS har bir ayolda bir xil namoyon boʻlmaydi. Siklingiz vaqt oʻtishi bilan oʻzgarishi mumkin. Kuzatuv tanangiz qanday ishlashini yaxshiroq tushunishga yordam berish uchun mavjud, tibbiy maslahatni almashtirish uchun emas.',
    disclaimer: 'Bu maqola faqat maʼlumot va taʼlim maqsadida berilgan. U tibbiy tashxis hisoblanmaydi va sogʻliqni saqlash mutaxassisi bilan konsultatsiyani almashtirmaydi.',
    shareMessage: 'PCOS da sikl, ovulyatsiya va unumdorlik — AWA',
  },
  az: {
    badge: 'PKOS',
    title: 'PKOS-da dövr, ovulyasiya\nvə münbitlik',
    metaDuration: '8 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Orta',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'PKOS zamanı dövrünüz uzun, qeyri-müntəzəm və bəzən proqnozlaşdırılması çətin ola bilər. Ovulyasiya ətrafında nələrin baş verdiyini anlamaq dövrünüzü başa düşməyə və münbitliklə bağlı sualları daha yaxşı anlamağa kömək edə bilər.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Dövr nə üçün qeyri-müntəzəm olur',
      'Ovulyasiya ətrafında nə baş verir',
      'Ovulyasiyanı necə tanımaq olar',
      'PKOS və münbitlik',
      'Tətbiqlər nə üçün daha az dəqiq ola bilər',
      'PKOS zamanı dövrü izləmək',
      'Hamilə qalmaq istəyirsinizsə, nə vaxt həkimə müraciət etmək lazımdır',
      'Əsas nəticələr',
    ],
    section1Body1: 'Menstrual dövr hormonal siqnalların koordinasiya olunmuş ardıcıllığından asılıdır. PKOS-da bu təşkilat, xüsusilə follikulun inkişafında və ovulyasiyada pozula bilər.',
    section1Body2: 'Yumurtalıqlarda inkişafa başlayan, lakin dominant follikulun müntəzəm yetişmədiyi çoxlu kiçik follikul ola bilər. Bu zaman ovulyasiya gecikə, gözlənilmədən baş verə və ya bəzi dövrlərdə heç baş verməyə bilər.',
    section1Body3: 'Bu, PKOS olan bəzi insanlarda dövrlərin 35, 45 və ya bəzən daha çox gün olmasının, digərlərində isə dövrlərin tipik uzunluğa daha yaxın olmasının səbəblərindən biridir.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Tək dövr uzunluğu ovulyasiyanın baş verib-vermədiyini göstərmir. Eyni uzunluqlu iki dövrün fərqli hormonal tarixçəsi ola bilər.',
    section2Body1: 'Ovulyasiya yumurtalıqdan yumurtahüceyrənin ayrılmasıdır. O, follikulun yetişmə fazasından sonra gəlir və dövrün lutein fazasından əvvəl olur.',
    section2Body2: 'Müntəzəm dövrdə ovulyasiya çox vaxt ortada olur. Lakin PKOS-da bu sadə qayda həmişə keçərli deyil. Ovulyasiya xeyli gec ola və ya müəyyən dövrdə heç baş verməyə bilər.',
    infoTitle: 'Bunun nə üçün əhəmiyyəti var',
    infoText: 'Ovulyasiya proqnozlaşdırıla bilməyəndə münbit dövrü yalnız aybaşı tarixlərinə əsasən təxmin etmək daha çətin olur.',
    section3Body1: 'Ovulyasiya ətrafındakı hormonal dəyişikliklərə müşayiət edə bilən bir neçə fiziki əlamət var. Onlar öz dövrünüzü müşahidə etmək üçün faydalı ola bilər, lakin heç bir tək əlamət ovulyasiyanı qəti şəkildə təsdiq edə bilməz.',
    ovulationSigns: [
      'Daha bol, şəffaf və dartılan ola bilən uşaqlıq boynu mukusunda dəyişiklik',
      'Bəzi qadınlarda yüngül çanaq ağrısı və ya narahatlıq',
      'Ovulyasiyadan sonra bədən temperaturunda dəyişiklik',
      'Vaginal nəmlikdə dəyişiklik',
      'Bəzi qadınlarda libidonun mümkün artması',
    ],
    section3Body2: 'Uşaqlıq boynu mukusunu müşahidə etmək xüsusilə dəyərlidir. Münbit dövr yaxınlaşdıqca o, daha bol, şəffaf, sürüşkən və dartılan ola bilər. Lakin onun görünüşü şəxsdən şəxsə və dövrdən dövrə dəyişə bilər.',
    alert1Title: 'Proqnozlarla ehtiyatlı olun',
    alert1Text: 'Çox qeyri-müntəzəm dövrlərdə əvvəlki dövrlərə əsasən avtomatik hesablanmış ovulyasiya tarixi çox təxmini ola bilər. Proqnoz ovulyasiyanın tibbi təsdiqi deyil.',
    section4Body1: 'PKOS hamilə qalmağı, əsasən ovulyasiya seyrək və ya proqnozlaşdırılması çətin olduqda, çətinləşdirə bilər. Lakin PKOS-un olması sonsuz olmaq demək deyil.',
    section4Body2: 'PKOS olan bəzi qadınlar müntəzəm ovulyasiya edir və xüsusi çətinlik olmadan hamilə qalır. Digərləri üçün ovulyasiya qiymətləndirmə və mümkün tibbi qayğı tələb edəcək qədər qeyri-müntəzəmdir.',
    fertilityPoints: [
      'PKOS avtomatik olaraq sonsuzluğa səbəb olmur',
      'Əsas çətinlik çox vaxt qeyri-müntəzəm və ya proqnozlaşdırılması çətin ovulyasiyadır',
      'Dövrlər çox uzun olsa belə, ovulyasiya baş verə bilər',
      'Müvafiq qayğı hamilə qalma şansını artıra bilər',
      'Münbitlik yolu hər fərdin özündən və bir çox digər amillərdən asılıdır',
    ],
    section4Body3: 'Münbitlik də tək ovulyasiyadan asılı deyil. Yaş, həyat yoldaşının sperma keyfiyyəti, fallop borularının vəziyyəti, endometrium və digər amillər də rol oynaya bilər. Buna görə hamiləlik gözləniləndən uzun çəkdikdə hərtərəfli qiymətləndirmə vacibdir.',
    section5Body1: 'Aybaşı izləmə tətbiqləri təxminlər çıxarmaq üçün adətən əvvəlki dövrlərin məlumatlarından istifadə edir. Dövrlər nisbətən müntəzəm olduqda bu təxminlər istinad kimi faydalı ola bilər.',
    section5Body2: 'Lakin PKOS-da dövrün dəyişkənliyi bu hesablamaları daha az etibarlı edə bilər. Tətbiq sadəcə nəzəri tarixə çatıldığı üçün ovulyasiyanın baş verdiyini qəti bilə bilməz.',
    tip2Title: 'Ondan istinad nöqtəsi kimi istifadə edin',
    tip2Text: 'Rəqəmsal izləmə öz dövrünüzdəki meylləri müşahidə etmək və tibb işçisi ilə bölüşmək üçün tarixçə saxlamaq üçün ən faydalıdır.',
    section6Body1: 'Müntəzəm izləmə şəxsi dəyişkənliklərinizi daha yaxşı anlamağa kömək edə bilər. Məqsəd dövrü tam proqnozlaşdırıla bilən etmək deyil, meylləri müəyyən etmək üçün kifayət qədər məlumat toplamaqdır.',
    trackingTips: [
      'Dövrlər çox seyrək olsa belə, hər dövrün ilk gününün tarixini qeyd edin',
      'Dövr boyu uşaqlıq boynu mukusundakı dəyişiklikləri müşahidə edin',
      'Çanaq ağrısını və ya ovulyasiyanı müşayiət edə bilən digər əlamətləri qeyd edin',
      'Ovulyasiyanı proqnozlaşdırmaq üçün yalnız orta 28 günlük uzunluğa arxalanmayın',
      'Ovulyasiya testlərindən ehtiyatla istifadə edin və lazım gələrsə, mütəxəssisdən məsləhət alın',
      'Hamilə qalmaq istəyirsinizsə, topladığınız məlumatı tibb işçisi ilə bölüşün',
    ],
    section6Body2: 'Əlaqəli simptomları da qeyd etmək faydalı ola bilər: ağrı, sızanaq, mukusdakı dəyişikliklər, qeyri-adi qanaxma, əhval, yuxu və ya digər şəxsi müşahidələr. Bu məlumat dövrünüz haqqında daha tam təsəvvür yaratmağa kömək edə bilər.',
    section7Body1: 'Dövrlər çox qeyri-müntəzəm, çox seyrək olduqda və ya aybaşı uzun müddət olmadıqda konsultasiya hətta hamilə qalmağa çalışmağa başlamazdan əvvəl də dəyərli ola bilər.',
    section7Body2: 'Tibb işçisi qeyri-müntəzəmliyin səbəblərini araşdıra, ovulyasiyanı qiymətləndirə və lazım gələrsə, hamiləlik planlarınıza uyğun strategiya təklif edə bilər.',
    alert2Title: 'Nə vaxt məsləhət almaq lazımdır',
    alert2Text: 'Aybaşılarınız çox seyrəkdirsə, bir neçə aydır aybaşınız olmayıbsa və ya müntəzəm cinsi əlaqəyə baxmayaraq hamiləlik baş vermirsə, tibb işçisi ilə danışın.',
    summaryTitle: 'Əsas məqamlar',
    summaryRows: [
      'PKOS dövrləri uzun və proqnozlaşdırıla bilməyən edə bilər.',
      'Ovulyasiya qeyri-müntəzəm ola və ya bəzi dövrlərdə olmaya bilər.',
      'Qeyri-müntəzəm dövr avtomatik olaraq münbitlik çatışmazlığı demək deyil.',
      'Yalnız təqvimə əsaslanan proqnozlar PKOS-da daha az etibarlı ola bilər.',
      'Dövrünüzü müşahidə etmək və tarixçə saxlamaq, xüsusilə konsultasiya üçün faydalı ola bilər.',
    ],
    finalTipTitle: 'Son söz',
    finalTipText: 'PKOS hər qadında eyni şəkildə təzahür etmir. Dövrünüz zamanla dəyişə bilər. İzləmə bədəninizin necə işlədiyini daha yaxşı anlamağınıza kömək etmək üçündür, tibbi məsləhəti əvəz etmək üçün deyil.',
    disclaimer: 'Bu məqalə yalnız məlumat və təhsil məqsədilə təqdim olunur. O, tibbi diaqnoz təşkil etmir və tibb işçisi ilə konsultasiyanı əvəz etmir.',
    shareMessage: 'PKOS-da dövr, ovulyasiya və münbitlik — AWA',
  },
  ka: {
    badge: 'PCOS',
    title: 'ციკლი, ოვულაცია\nდა ფერტილობა PCOS-ის დროს',
    metaDuration: '8 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'საშუალო',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'PCOS-ის დროს თქვენი ციკლი შეიძლება გახდეს ხანგრძლივი, არარეგულარული და ზოგჯერ რთულად პროგნოზირებადი. ოვულაციის გარშემო მიმდინარე პროცესების გაგებამ შეიძლება დაგეხმაროთ ციკლის გააზრებასა და ფერტილობასთან დაკავშირებული კითხვების უკეთ გაგებაში.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რატომ ხდება ციკლი არარეგულარული',
      'რა ხდება ოვულაციის გარშემო',
      'როგორ ამოვიცნოთ ოვულაცია',
      'PCOS და ფერტილობა',
      'რატომ შეიძლება აპები ნაკლებად ზუსტი იყოს',
      'ციკლის კონტროლი PCOS-ის დროს',
      'როდის მივმართოთ ექიმს, თუ ჩასახვა გსურთ',
      'მთავარი დასკვნები',
    ],
    section1Body1: 'მენსტრუაციული ციკლი კოორდინირებული ჰორმონული სიგნალების თანმიმდევრობაზეა დამოკიდებული. PCOS-ის დროს ეს ორგანიზაცია შეიძლება დაირღვეს, განსაკუთრებით ფოლიკულების განვითარებასა და ოვულაციაში.',
    section1Body2: 'საკვერცხეები შეიძლება შეიცავდეს ბევრ პატარა ფოლიკულს, რომლებიც ვითარდება ისე, რომ დომინანტი ფოლიკული რეგულარულად სიმწიფეს ვერ აღწევს. ოვულაცია შემდეგ შეიძლება დაგვიანდეს, არაპროგნოზირებადად მოხდეს ან გარკვეულ ციკლებში საერთოდ არ მოხდეს.',
    section1Body3: 'ეს ერთ-ერთი მიზეზია, რის გამოც PCOS-ის მქონე ზოგ ადამიანს 35, 45 ან ზოგჯერ მეტი დღის ციკლი აქვს, ზოგს კი ციკლი ტიპურ ხანგრძლივობასთან უფრო ახლოს.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'მხოლოდ ციკლის ხანგრძლივობა არ გვეუბნება, მოხდა თუ არა ოვულაცია. ერთი და იმავე ხანგრძლივობის ორ ციკლს შეიძლება განსხვავებული ჰორმონული ისტორია ჰქონდეს.',
    section2Body1: 'ოვულაცია საკვერცხიდან კვერცხუჯრედის გამოთავისუფლებაა. ის ფოლიკულური მომწიფების ფაზას მოსდევს და ციკლის ლუტეალურ ფაზას წინ უსწრებს.',
    section2Body2: 'რეგულარულ ციკლში ოვულაცია ხშირად შუა წერტილის გარშემო ხდება. მაგრამ PCOS-ის დროს ეს მარტივი წესი ყოველთვის არ მოქმედებს. ოვულაცია შეიძლება ბევრად გვიან მოხდეს ან მოცემულ ციკლში საერთოდ არ მოხდეს.',
    infoTitle: 'რატომ არის ეს მნიშვნელოვანი',
    infoText: 'როცა ოვულაცია არაპროგნოზირებადია, ფერტილური ფანჯრის შეფასება მხოლოდ მენსტრუაციის თარიღების მიხედვით უფრო რთული ხდება.',
    section3Body1: 'არსებობს რამდენიმე ფიზიკური ნიშანი, რომელიც ოვულაციის გარშემო ჰორმონულ ცვლილებებს შეიძლება ახლდეს. ისინი სასარგებლო შეიძლება იყოს საკუთარ ციკლზე დასაკვირვებლად, მაგრამ არცერთ ცალკე ნიშანს ოვულაციის დადასტურება სიზუსტით არ შეუძლია.',
    ovulationSigns: [
      'საშვილოსნოს ყელის ლორწოს ცვლილება, რომელიც შეიძლება უფრო უხვი, გამჭვირვალე და გაჭიმვადი გახდეს',
      'მსუბუქი მენჯის ტკივილი ან დისკომფორტი ზოგ ქალში',
      'სხეულის ტემპერატურის ცვლილება ოვულაციის შემდეგ',
      'ვაგინალური სინესტის ცვლილება',
      'ლიბიდოს შესაძლო მატება ზოგ ქალში',
    ],
    section3Body2: 'საშვილოსნოს ყელის ლორწოზე დაკვირვება განსაკუთრებით ღირს. ფერტილური ფანჯრის მოახლოებისას ის შეიძლება უფრო უხვი, გამჭვირვალე, მოსრიალე და გაჭიმვადი გახდეს. თუმცა მისი იერსახე ადამიანიდან ადამიანამდე და ციკლიდან ციკლამდე შეიძლება განსხვავდებოდეს.',
    alert1Title: 'ფრთხილად იყავით პროგნოზებთან',
    alert1Text: 'ძალიან არარეგულარული ციკლების დროს წინა ციკლების მიხედვით ავტომატურად გამოთვლილი ოვულაციის თარიღი ძალიან მიახლოებითი შეიძლება იყოს. პროგნოზი ოვულაციის სამედიცინო დადასტურება არ არის.',
    section4Body1: 'PCOS-მა შეიძლება ჩასახვა გაართულოს, ძირითადად მაშინ, როცა ოვულაცია იშვიათია ან რთულად პროგნოზირებადი. თუმცა PCOS-ის ქონა უშვილობას არ ნიშნავს.',
    section4Body2: 'PCOS-ის მქონე ზოგი ქალი რეგულარულად ოვულირებს და განსაკუთრებული სირთულის გარეშე ორსულდება. სხვებისთვის ოვულაცია იმდენად არარეგულარულია, რომ შეფასება და შესაძლოა სამედიცინო მკურნალობა სჭირდება.',
    fertilityPoints: [
      'PCOS ავტომატურად უშვილობას არ იწვევს',
      'მთავარი სირთულე ხშირად არარეგულარული ან არაპროგნოზირებადი ოვულაციაა',
      'ოვულაცია შეიძლება მაშინაც მოხდეს, როცა ციკლები ძალიან ხანგრძლივია',
      'სათანადო მკურნალობას შეუძლია ჩასახვის შანსების გაუმჯობესება',
      'ფერტილობის გზა თითოეულ ადამიანზე და ბევრ სხვა ფაქტორზეა დამოკიდებული',
    ],
    section4Body3: 'ფერტილობა მხოლოდ ოვულაციაზეც არ არის დამოკიდებული. ასაკმა, პარტნიორის სპერმის ხარისხმა, ფალოპის მილების მდგომარეობამ, ენდომეტრიუმმა და სხვა ფაქტორებმაც შეიძლება როლი ითამაშოს. სწორედ ამიტომ არის ყოვლისმომცველი შეფასება მნიშვნელოვანი, როცა ორსულობას მოსალოდნელზე მეტი დრო სჭირდება.',
    section5Body1: 'მენსტრუაციის კონტროლის აპები ზოგადად შეფასებების გასაკეთებლად წინა ციკლების მონაცემებს იყენებს. როცა ციკლები შედარებით რეგულარულია, ეს შეფასებები საორიენტაციოდ სასარგებლო შეიძლება იყოს.',
    section5Body2: 'PCOS-ის დროს, თუმცა, ციკლის ცვალებადობამ შეიძლება ეს გამოთვლები ნაკლებად სანდო გახადოს. აპს არ შეუძლია დანამდვილებით იცოდეს, რომ ოვულაცია მოხდა მხოლოდ იმიტომ, რომ თეორიულ თარიღს მიაღწია.',
    tip2Title: 'გამოიყენეთ როგორც საორიენტაციო წერტილი',
    tip2Text: 'ციფრული კონტროლი ყველაზე სასარგებლოა საკუთარი ციკლის ტენდენციებზე დასაკვირვებლად და ისტორიის შესანახად, რომელიც ჯანდაცვის სპეციალისტს შეგიძლიათ გაუზიაროთ.',
    section6Body1: 'რეგულარულმა კონტროლმა შეიძლება დაგეხმაროთ საკუთარი პირადი ვარიაციების უკეთ გაგებაში. მიზანი ციკლის სრულიად პროგნოზირებადად ქცევა არ არის, არამედ ტენდენციების გამოსავლენად საკმარისი ინფორმაციის შეგროვება.',
    trackingTips: [
      'აღნიშნეთ თითოეული ციკლის პირველი დღის თარიღი, მაშინაც კი, როცა ციკლები ძალიან დაშორებულია',
      'დააკვირდით საშვილოსნოს ყელის ლორწოს ცვლილებებს ციკლის განმავლობაში',
      'აღნიშნეთ მენჯის ტკივილი ან სხვა ნიშნები, რომლებიც ოვულაციას შეიძლება ახლდეს',
      'ოვულაციის პროგნოზირებისთვის არ დაეყრდნოთ მხოლოდ საშუალო 28-დღიან ხანგრძლივობას',
      'ოვულაციის ტესტები სიფრთხილით გამოიყენეთ და საჭიროების შემთხვევაში სპეციალისტს ჰკითხეთ რჩევა',
      'გაუზიარეთ შეგროვებული ინფორმაცია ჯანდაცვის სპეციალისტს, თუ ორსულობა გსურთ',
    ],
    section6Body2: 'ასევე სასარგებლო შეიძლება იყოს თანმხლები სიმპტომების აღნიშვნა: ტკივილი, აკნე, ლორწოს ცვლილებები, უჩვეულო სისხლდენა, ხასიათი, ძილი ან სხვა პირადი დაკვირვებები. ეს ინფორმაცია თქვენი ციკლის უფრო სრული სურათის შექმნაში შეიძლება დაგეხმაროთ.',
    section7Body1: 'კონსულტაცია ღირებული შეიძლება იყოს ჩასახვის მცდელობის დაწყებამდეც კი, როცა ციკლები ძალიან არარეგულარულია, ძალიან დაშორებულია ან მენსტრუაცია დიდხანს არ მოდის.',
    section7Body2: 'ჯანდაცვის სპეციალისტს შეუძლია არარეგულარობის მიზეზების გამოკვლევა, ოვულაციის შეფასება და, საჭიროების შემთხვევაში, თქვენს ორსულობის გეგმებზე მორგებული სტრატეგიის შეთავაზება.',
    alert2Title: 'როდის ვითხოვოთ რჩევა',
    alert2Text: 'თუ თქვენი მენსტრუაცია ძალიან დაშორებულია, რამდენიმე თვის განმავლობაში მენსტრუაცია არ გქონიათ ან ორსულობა რეგულარული სქესობრივი კავშირის მიუხედავად არ ხდება, ესაუბრეთ ჯანდაცვის სპეციალისტს.',
    summaryTitle: 'მთავარი საკითხები',
    summaryRows: [
      'PCOS-მა შეიძლება ციკლი ხანგრძლივი და არაპროგნოზირებადი გახადოს.',
      'ოვულაცია შეიძლება არარეგულარული იყოს ან ზოგ ციკლში არ მოხდეს.',
      'არარეგულარული ციკლი ავტომატურად ფერტილობის ნაკლებობას არ ნიშნავს.',
      'მხოლოდ კალენდარზე დაფუძნებული პროგნოზები PCOS-ის დროს ნაკლებად სანდო შეიძლება იყოს.',
      'ციკლზე დაკვირვება და ისტორიის შენახვა სასარგებლო შეიძლება იყოს, განსაკუთრებით კონსულტაციისთვის.',
    ],
    finalTipTitle: 'ბოლო სიტყვა',
    finalTipText: 'PCOS ყველა ქალში ერთნაირად არ ვლინდება. თქვენი ციკლი დროთა განმავლობაში შეიძლება შეიცვალოს. კონტროლი იმისთვისაა, რომ უკეთ გაიგოთ, როგორ მუშაობს თქვენი სხეული და არა სამედიცინო რჩევის ჩასანაცვლებლად.',
    disclaimer: 'ეს სტატია მხოლოდ საინფორმაციო და საგანმანათლებლო მიზნებისთვისაა. ის არ წარმოადგენს სამედიცინო დიაგნოზს და ჯანდაცვის სპეციალისტთან კონსულტაციას არ ანაცვლებს.',
    shareMessage: 'ციკლი, ოვულაცია და ფერტილობა PCOS-ის დროს — AWA',
  },
  hy: {
    badge: 'PCOS',
    title: 'Ցիկլ, ձվազատում\nև պտղաբերություն PCOS-ի դեպքում',
    metaDuration: '8 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Միջին',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'PCOS-ի դեպքում ձեր ցիկլը կարող է դառնալ երկար, անկանոն և երբեմն դժվար կանխատեսելի: Ձվազատման շուրջ տեղի ունեցողը հասկանալը կարող է օգնել ձեզ ըմբռնել ձեր ցիկլը և ավելի լավ հասկանալ պտղաբերության հետ կապված հարցերը:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ինչու է ցիկլը դառնում անկանոն',
      'Ինչ է կատարվում ձվազատման շուրջ',
      'Ինչպես ճանաչել ձվազատումը',
      'PCOS և պտղաբերություն',
      'Ինչու կարող են հավելվածները պակաս ճշգրիտ լինել',
      'Ցիկլին հետևել PCOS-ի դեպքում',
      'Երբ դիմել բժշկի, եթե ցանկանում եք հղիանալ',
      'Հիմնական եզրակացություններ',
    ],
    section1Body1: 'Դաշտանային ցիկլը կախված է հորմոնալ ազդանշանների համակարգված հաջորդականությունից: PCOS-ի դեպքում այս կազմակերպումը կարող է խաթարվել, մասնավորապես ֆոլիկուլների զարգացման և ձվազատման մեջ:',
    section1Body2: 'Ձվարանները կարող են պարունակել բազմաթիվ փոքր ֆոլիկուլներ, որոնք սկսում են զարգանալ՝ առանց գերիշխող ֆոլիկուլի կանոնավոր հասունացման: Ձվազատումը այդ դեպքում կարող է ուշանալ, տեղի ունենալ անկանխատեսելիորեն կամ որոշ ցիկլերում ընդհանրապես չլինել:',
    section1Body3: 'Սա պատճառներից մեկն է, թե ինչու PCOS ունեցող որոշ մարդկանց ցիկլերը 35, 45 կամ երբեմն ավելի շատ օր են տևում, իսկ մյուսներինը կարող է մոտ լինել բնորոշ տևողությանը:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Միայն ցիկլի տևողությունը չի ասում, թե արդյոք ձվազատում տեղի է ունեցել: Նույն տևողությամբ երկու ցիկլ կարող են ունենալ տարբեր հորմոնալ պատմություն:',
    section2Body1: 'Ձվազատումը ձվաբջջի ազատումն է ձվարանից: Այն հաջորդում է ֆոլիկուլային հասունացման փուլին և նախորդում ցիկլի լյուտեալ փուլին:',
    section2Body2: 'Կանոնավոր ցիկլում ձվազատումը հաճախ մոտ կեսին է: Բայց PCOS-ի դեպքում այս պարզ կանոնը միշտ չէ, որ կիրառվում է: Ձվազատումը կարող է լինել շատ ավելի ուշ կամ տվյալ ցիկլում ընդհանրապես չլինել:',
    infoTitle: 'Ինչու է սա կարևոր',
    infoText: 'Երբ ձվազատումն անկանխատեսելի է, դժվարանում է գնահատել պտղաբեր պատուհանը միայն դաշտանի ամսաթվերի հիման վրա:',
    section3Body1: 'Կան մի քանի ֆիզիկական նշաններ, որոնք կարող են ուղեկցել ձվազատման շուրջ հորմոնալ փոփոխություններին: Դրանք կարող են օգտակար լինել ձեր սեփական ցիկլը դիտարկելու համար, սակայն ոչ մի նշան միայնակ չի կարող վստահությամբ հաստատել ձվազատումը:',
    ovulationSigns: [
      'Արգանդի վզիկի լորձի փոփոխություն, որը կարող է դառնալ ավելի առատ, թափանցիկ և ձգվող',
      'Թեթև կոնքի ցավ կամ անհարմարություն որոշ կանանց մոտ',
      'Մարմնի ջերմաստիճանի փոփոխություն ձվազատումից հետո',
      'Հեշտոցային խոնավության փոփոխություն',
      'Լիբիդոյի հնարավոր աճ որոշ կանանց մոտ',
    ],
    section3Body2: 'Արգանդի վզիկի լորձը հատկապես արժե դիտարկել: Պտղաբեր պատուհանին մոտենալիս այն կարող է դառնալ ավելի առատ, թափանցիկ, սահուն և ձգվող: Այդուհանդերձ, դրա տեսքը կարող է տարբերվել մարդուց մարդ և ցիկլից ցիկլ:',
    alert1Title: 'Զգուշացեք կանխատեսումներից',
    alert1Text: 'Շատ անկանոն ցիկլերի դեպքում նախորդ ցիկլերից ավտոմատ հաշվարկված ձվազատման ամսաթիվը կարող է շատ մոտավոր լինել: Կանխատեսումը ձվազատման բժշկական հաստատում չէ:',
    section4Body1: 'PCOS-ը կարող է դժվարացնել հղիանալը, հիմնականում երբ ձվազատումը հազվադեպ է կամ դժվար կանխատեսելի: Այդուհանդերձ, PCOS ունենալը չի նշանակում անպտղություն:',
    section4Body2: 'PCOS ունեցող որոշ կանայք ձվազատում են կանոնավոր և հղիանում են առանց առանձնահատուկ դժվարության: Մյուսների համար ձվազատումն այնքան անկանոն է, որ պահանջում է գնահատում և հնարավոր բժշկական խնամք:',
    fertilityPoints: [
      'PCOS-ը ինքնաբերաբար անպտղություն չի առաջացնում',
      'Հիմնական դժվարությունը հաճախ անկանոն կամ անկանխատեսելի ձվազատումն է',
      'Ձվազատումը կարող է տեղի ունենալ նույնիսկ երբ ցիկլերը շատ երկար են',
      'Պատշաճ խնամքը կարող է բարելավել հղիանալու հնարավորությունները',
      'Պտղաբերության ճանապարհը կախված է յուրաքանչյուր անձից և շատ այլ գործոններից',
    ],
    section4Body3: 'Պտղաբերությունը նույնպես կախված չէ միայն ձվազատումից: Դեր կարող են խաղալ նաև տարիքը, զուգընկերոջ սպերմայի որակը, ֆալոպյան խողովակների վիճակը, էնդոմետրիումը և այլ գործոններ: Ահա թե ինչու համապարփակ գնահատումը կարևոր է, երբ հղիությունը ավելի երկար է տևում, քան սպասվում էր:',
    section5Body1: 'Դաշտանին հետևող հավելվածները սովորաբար օգտագործում են նախորդ ցիկլերի տվյալները՝ գնահատականներ ստանալու համար: Երբ ցիկլերը համեմատաբար կանոնավոր են, այս գնահատականները կարող են օգտակար լինել որպես հղում:',
    section5Body2: 'PCOS-ի դեպքում, սակայն, ցիկլի փոփոխականությունը կարող է այս հաշվարկները դարձնել պակաս հուսալի: Հավելվածը չի կարող հաստատ իմանալ, որ ձվազատումը տեղի է ունեցել միայն այն պատճառով, որ տեսական ամսաթիվը հասել է:',
    tip2Title: 'Օգտագործեք որպես հղման կետ',
    tip2Text: 'Թվային հետևումը առավել օգտակար է ձեր սեփական ցիկլի միտումները դիտարկելու և պատմություն պահելու համար, որը կարող եք կիսել ձեր առողջապահության մասնագետի հետ:',
    section6Body1: 'Կանոնավոր հետևումը կարող է օգնել ավելի լավ հասկանալ ձեր անձնական տատանումները: Նպատակը ցիկլը կատարյալ կանխատեսելի դարձնելը չէ, այլ բավարար տեղեկություն հավաքելը՝ միտումները բացահայտելու համար:',
    trackingTips: [
      'Գրանցեք յուրաքանչյուր ցիկլի առաջին օրվա ամսաթիվը, նույնիսկ երբ ցիկլերը շատ հեռու են իրարից',
      'Դիտարկեք արգանդի վզիկի լորձի փոփոխությունները ցիկլի ընթացքում',
      'Գրանցեք կոնքի ցավը կամ այլ նշաններ, որոնք կարող են ուղեկցել ձվազատմանը',
      'Խուսափեք ձվազատումը կանխատեսելիս հիմնվել միայն միջին 28-օրյա տևողության վրա',
      'Ձվազատման թեստերն օգտագործեք զգուշությամբ և, անհրաժեշտության դեպքում, խորհուրդ հարցրեք մասնագետից',
      'Ձեր հավաքած տեղեկությունը կիսեք առողջապահության մասնագետի հետ, եթե ցանկանում եք հղիանալ',
    ],
    section6Body2: 'Կարող է նաև օգտակար լինել գրանցել առնչվող ախտանիշները՝ ցավ, ակնե, լորձի փոփոխություններ, անսովոր արյունահոսություն, տրամադրություն, քուն կամ այլ անձնական դիտարկումներ: Այս տեղեկությունը կարող է օգնել կառուցել ձեր ցիկլի ավելի ամբողջական պատկերը:',
    section7Body1: 'Խորհրդատվությունը կարող է արժեքավոր լինել նույնիսկ նախքան հղիանալու փորձերը սկսելը, երբ ցիկլերը շատ անկանոն են, շատ հեռու իրարից կամ երբ դաշտանները երկար ժամանակ բացակայում են:',
    section7Body2: 'Առողջապահության մասնագետը կարող է ուսումնասիրել անկանոնությունների պատճառները, գնահատել ձվազատումը և, անհրաժեշտության դեպքում, առաջարկել ձեր հղիության ծրագրերին համապատասխան ռազմավարություն:',
    alert2Title: 'Երբ խորհուրդ հարցնել',
    alert2Text: 'Եթե ձեր դաշտանները շատ հեռու են իրարից, եթե մի քանի ամիս դաշտան չեք ունեցել կամ եթե հղիություն չի առաջանում՝ չնայած կանոնավոր սեռական հարաբերությանը, խոսեք առողջապահության մասնագետի հետ:',
    summaryTitle: 'Հիմնական կետեր',
    summaryRows: [
      'PCOS-ը կարող է ցիկլերը դարձնել երկար և անկանխատեսելի:',
      'Ձվազատումը կարող է լինել անկանոն կամ բացակայել որոշ ցիկլերում:',
      'Անկանոն ցիկլը ինքնաբերաբար չի նշանակում պտղաբերության բացակայություն:',
      'Միայն օրացույցի վրա հիմնված կանխատեսումները PCOS-ի դեպքում կարող են ավելի քիչ հուսալի լինել:',
      'Ձեր ցիկլը դիտարկելը և պատմություն պահելը կարող է օգտակար լինել, հատկապես խորհրդատվության համար:',
    ],
    finalTipTitle: 'Մեկ վերջին խոսք',
    finalTipText: 'PCOS-ը բոլոր կանանց մոտ նույն կերպ չի դրսևորվում: Ձեր ցիկլը կարող է փոխվել ժամանակի ընթացքում: Հետևումը այստեղ է՝ օգնելու ձեզ ավելի լավ հասկանալ, թե ինչպես է աշխատում ձեր մարմինը, այլ ոչ թե փոխարինելու բժշկական խորհրդատվությանը:',
    disclaimer: 'Այս հոդվածը միայն տեղեկատվական և կրթական նպատակով է: Այն բժշկական ախտորոշում չէ և չի փոխարինում առողջապահության մասնագետի հետ խորհրդատվությանը:',
    shareMessage: 'Ցիկլ, ձվազատում և պտղաբերություն PCOS-ի դեպքում — AWA',
  },
  tg: {
    badge: 'PCOS',
    title: 'Давра, овуляция\nва ҳосилхезӣ ҳангоми PCOS',
    metaDuration: '8 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Миёна',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Бо PCOS давраи шумо метавонад дароз, номунтазам ва баъзан душвор барои пешгӯӣ шавад. Фаҳмидани он чи дар атрофи овуляция рух медиҳад, метавонад ба шумо кумак кунад давраи худро фаҳмед ва саволҳои марбут ба ҳосилхезиро беҳтар дарк кунед.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Чаро давра номунтазам мешавад',
      'Дар атрофи овуляция чӣ рух медиҳад',
      'Чӣ тавр овуляцияро шинохтан',
      'PCOS ва ҳосилхезӣ',
      'Чаро барномаҳо метавонанд камтар дақиқ бошанд',
      'Пайгирии давра ҳангоми PCOS',
      'Кай ба табиб муроҷиат кардан лозим аст, агар ҳомиладор шудан хоҳед',
      'Хулосаҳои асосӣ',
    ],
    section1Body1: 'Давраи ҳайз аз пайдарпайии ҳамоҳангшудаи сигналҳои гормонӣ вобаста аст. Дар PCOS ин ташкил метавонад вайрон шавад, хусусан дар инкишофи фолликулҳо ва овуляция.',
    section1Body2: 'Тухмдонҳо метавонанд фолликулҳои хурди зиёд дошта бошанд, ки инкишоф ёфтанро оғоз мекунанд, бидуни он ки фолликули бартаридошта мунтазам ба камол бирасад. Овуляция он гоҳ метавонад ба таъхир афтад, ба таври пешгӯинашаванда рух диҳад ё дар баъзе давраҳо умуман рух надиҳад.',
    section1Body3: 'Ин яке аз сабабҳоест, ки баъзе одамони дорои PCOS давраҳои 35, 45 ё баъзан бештар аз он рӯза доранд, дар ҳоле ки дигарон метавонанд давраҳои ба дарозии маъмул наздиктар дошта бошанд.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Дарозии давра танҳо ба шумо намегӯяд, ки овуляция рух додааст ё не. Ду давраи ба дарозии баробар метавонанд таърихи гормонии гуногун дошта бошанд.',
    section2Body1: 'Овуляция озод шудани тухмсел аз тухмдон аст. Он пас аз марҳилаи камолоти фолликулярӣ меояд ва пеш аз марҳилаи лютеалии давра аст.',
    section2Body2: 'Дар давраи мунтазам овуляция аксар вақт наздики миёна аст. Аммо бо PCOS ин қоидаи оддӣ на ҳамеша татбиқ мешавад. Овуляция метавонад хеле дертар рух диҳад ё дар давраи додашуда умуман рух надиҳад.',
    infoTitle: 'Чаро ин муҳим аст',
    infoText: 'Вақте ки овуляция пешгӯинашаванда аст, тахмин кардани равзанаи ҳосилхезӣ танҳо аз рӯи санаҳои ҳайз душвортар мешавад.',
    section3Body1: 'Якчанд нишонаи ҷисмонӣ вуҷуд дорад, ки метавонанд тағйироти гормониро дар атрофи овуляция ҳамроҳӣ кунанд. Онҳо метавонанд барои мушоҳидаи давраи худатон муфид бошанд, вале ягон нишона худ ба худ овуляцияро бо қатъият тасдиқ карда наметавонад.',
    ovulationSigns: [
      'Тағйири шилимшиқи гардани бачадон, ки метавонад зиёдтар, шаффоф ва кашишшаванда шавад',
      'Дарди сабук ё нороҳатии коса дар баъзе занон',
      'Тағйири ҳарорати бадан пас аз овуляция',
      'Тағйири намии маҳбал',
      'Афзоиши эҳтимолии майли ҷинсӣ дар баъзе занон',
    ],
    section3Body2: 'Шилимшиқи гардани бачадон махсусан сазовори мушоҳида аст. Ҳангоми наздик шудани равзанаи ҳосилхезӣ он метавонад зиёдтар, шаффоф, лағжанда ва кашишшаванда шавад. Бо вуҷуди ин, намуди он аз шахс ба шахс ва аз давра то давра фарқ карда метавонад.',
    alert1Title: 'Бо пешгӯиҳо эҳтиёт шавед',
    alert1Text: 'Бо давраҳои хеле номунтазам, санаи овуляция, ки худкор аз давраҳои пештара ҳисоб карда шудааст, метавонад хеле тахминӣ бошад. Пешгӯӣ тасдиқи тиббии овуляция нест.',
    section4Body1: 'PCOS метавонад ҳомиладоршавиро душвортар кунад, асосан вақте ки овуляция кам ё душвор барои пешгӯӣ аст. Бо вуҷуди ин, доштани PCOS маънои безурётиро надорад.',
    section4Body2: 'Баъзе занони дорои PCOS мунтазам овуляция мекунанд ва бидуни душвории махсус ҳомиладор мешаванд. Барои дигарон, овуляция ба қадри кофӣ номунтазам аст, ки арзёбӣ ва эҳтимолан нигоҳубини тиббиро талаб мекунад.',
    fertilityPoints: [
      'PCOS худкор безурётиро ба вуҷуд намеорад',
      'Душвории асосӣ аксар вақт овуляцияи номунтазам ё пешгӯинашаванда аст',
      'Овуляция ҳатто вақте ки давраҳо хеле дароз аст, метавонад рух диҳад',
      'Нигоҳубини мувофиқ метавонад имкониятҳои ҳомиладоршавиро беҳтар кунад',
      'Роҳи ҳосилхезӣ ба ҳар шахс ва бисёр омилҳои дигар вобаста аст',
    ],
    section4Body3: 'Ҳосилхезӣ низ танҳо ба овуляция вобаста нест. Синну сол, сифати сперматозоидҳои шарик, ҳолати найчаҳои бачадон, эндометрий ва омилҳои дигар низ метавонанд нақш бозанд. Аз ин рӯ арзёбии ҷомеъ муҳим аст, вақте ки ҳомиладорӣ аз интизорӣ дертар меояд.',
    section5Body1: 'Барномаҳои пайгирии ҳайз одатан маълумоти давраҳои пештараро барои ба даст овардани тахминҳо истифода мебаранд. Вақте ки давраҳо нисбатан мунтазаманд, ин тахминҳо метавонанд ҳамчун истинод муфид бошанд.',
    section5Body2: 'Бо PCOS, аммо, тағйирпазирии давра метавонад ин ҳисобҳоро камтар боэътимод кунад. Барнома наметавонад бо қатъият бидонад, ки овуляция рух додааст, танҳо аз он сабаб ки санаи назариявӣ фаро расидааст.',
    tip2Title: 'Онро ҳамчун нуқтаи истинод истифода баред',
    tip2Text: 'Пайгирии рақамӣ бештар барои мушоҳидаи тамоюлҳои давраи худатон ва нигоҳ доштани таърих барои мубодила бо мутахассиси соҳаи тиб муфид аст.',
    section6Body1: 'Пайгирии мунтазам метавонад ба шумо кумак кунад тағйирёбии шахсии худро беҳтар бифаҳмед. Мақсад пешгӯишаванда кардани давра комилан нест, балки ҷамъ овардани маълумоти кофӣ барои муайян кардани тамоюлҳост.',
    trackingTips: [
      'Санаи рӯзи аввали ҳар давраро қайд кунед, ҳатто вақте ки давраҳо хеле дурфосила аст',
      'Тағйироти шилимшиқи гардани бачадонро дар давоми давра мушоҳида кунед',
      'Ҳар дарди коса ё нишонаҳои дигареро, ки метавонанд овуляцияро ҳамроҳӣ кунанд, қайд кунед',
      'Танҳо ба дарозии миёнаи 28-рӯза барои пешгӯии овуляция такя накунед',
      'Санҷишҳои овуляцияро бо эҳтиёт истифода баред ва, агар лозим бошад, аз мутахассис маслиҳат пурсед',
      'Маълумоти ҷамъкардаатонро бо мутахассиси соҳаи тиб мубодила кунед, агар ҳомиладор шудан хоҳед',
    ],
    section6Body2: 'Инчунин метавонад муфид бошад, ки нишонаҳои ҳамроҳро қайд кунед: дард, доначаҳои рӯй, тағйироти шилимшиқ, хунравии ғайриоддӣ, кайфият, хоб ё мушоҳидаҳои шахсии дигар. Ин маълумот метавонад ба сохтани тасвири пурратари давраи шумо кумак кунад.',
    section7Body1: 'Машварат метавонад ҳатто пеш аз оғози кӯшиши ҳомиладор шудан сазовор бошад, вақте ки давраҳо хеле номунтазам, хеле дурфосила ё ҳайз муддати дароз набошад.',
    section7Body2: 'Мутахассиси соҳаи тиб метавонад сабабҳои номунтазамиро таҳқиқ кунад, овуляцияро арзёбӣ кунад ва, агар лозим бошад, стратегияи мувофиқ ба нақшаҳои ҳомиладории шуморо пешниҳод намояд.',
    alert2Title: 'Кай маслиҳат пурсидан лозим аст',
    alert2Text: 'Агар ҳайзи шумо хеле дурфосила бошад, чанд моҳ ҳайз надошта бошед ё бо вуҷуди наздикии мунтазам ҳомиладорӣ рух надиҳад, бо мутахассиси соҳаи тиб гап занед.',
    summaryTitle: 'Нуктаҳои асосӣ',
    summaryRows: [
      'PCOS метавонад давраҳоро дароз ва пешгӯинашаванда кунад.',
      'Овуляция метавонад дар баъзе давраҳо номунтазам ё ғоиб бошад.',
      'Давраи номунтазам худкор маънои набудани ҳосилхезиро надорад.',
      'Пешгӯиҳои танҳо аз рӯи тақвим метавонанд бо PCOS камтар боэътимод бошанд.',
      'Мушоҳидаи давраи худ ва нигоҳ доштани таърих метавонад муфид бошад, хусусан барои машварат.',
    ],
    finalTipTitle: 'Як сухани охирин',
    finalTipText: 'PCOS дар ҳар зан ба як тарз зоҳир намешавад. Давраи шумо метавонад бо мурури замон тағйир ёбад. Пайгирӣ барои он аст, ки ба шумо кумак кунад фаҳмед бадани шумо чӣ тавр кор мекунад, на барои иваз кардани маслиҳати тиббӣ.',
    disclaimer: 'Ин мақола танҳо барои иттилоъ ва таълим аст. Он ташхиси тиббӣ нест ва машварат бо мутахассиси соҳаи тибро иваз намекунад.',
    shareMessage: 'Давра, овуляция ва ҳосилхезӣ ҳангоми PCOS — AWA',
  },
  ky: {
    badge: 'PCOS',
    title: 'PCOS менен цикл, овуляция\nжана бойго бүтүү жөндөмдүүлүгү',
    metaDuration: '8 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Орто',
    metaValidated: 'Текшерилген мазмун',
    intro: 'PCOS менен циклиңиз узун, туура эмес жана кээде болжолдоого кыйын болуп калышы мүмкүн. Овуляциянын тегерегинде эмне болорун түшүнүү циклиңизди түшүнүүгө жана бойго бүтүү жөндөмдүүлүгүнө байланыштуу суроолорду жакшыраак түшүнүүгө жардам бериши мүмкүн.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Цикл эмне үчүн туура эмес болуп калат',
      'Овуляциянын тегерегинде эмне болот',
      'Овуляцияны кантип таануу керек',
      'PCOS жана бойго бүтүү жөндөмдүүлүгү',
      'Колдонмолор эмне үчүн азыраак так болушу мүмкүн',
      'PCOS менен циклиңизди көзөмөлдөө',
      'Боюна бүткүңүз келсе, дарыгерге качан барыш керек',
      'Негизги жыйынтыктар',
    ],
    section1Body1: 'Етек кирим цикли гормондук сигналдардын координацияланган удаалаштыгына көз каранды. PCOS менен бул уюшкандык бузулушу мүмкүн, айрыкча фолликулдардын өнүгүшүндө жана овуляцияда.',
    section1Body2: 'Жумурткалыктарда бир нече кичинекей фолликул болушу мүмкүн, алар өнүгө баштайт, бирок үстөмдүк кылган фолликул үзгүлтүксүз бышып жетилбейт. Андан кийин овуляция кечигиши, болжолдонбогон убакта болушу же айрым циклдерде таптакыр болбошу мүмкүн.',
    section1Body3: 'Бул PCOS бар айрым адамдарда 35, 45 же кээде андан көп күндүк циклдердин болушунун себептеринин бири, ал эми башкаларында цикл типтүү узактыкка жакын болушу мүмкүн.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Цикл узактыгынын өзү овуляция болгон-болбогонун айтпайт. Бирдей узактыктагы эки циклдин гормондук тарыхы ар башка болушу мүмкүн.',
    section2Body1: 'Овуляция — жумурткалуу клетканын жумурткалыктан чыгышы. Ал фолликулярдык жетилүү фазасынан кийин келет жана циклдин лютеиндик фазасынан мурун болот.',
    section2Body2: 'Туруктуу циклде овуляция көбүнчө ортосунда болот. Бирок PCOS менен бул жөнөкөй эреже ар дайым колдонулбайт. Овуляция бир кыйла кеч болушу же берилген циклде таптакыр болбошу мүмкүн.',
    infoTitle: 'Бул эмне үчүн маанилүү',
    infoText: 'Овуляция болжолдонбогондо, бойго бүтүү терезесин жалаң етек кирим күндөрүнө таянып баалоо кыйындайт.',
    section3Body1: 'Овуляциянын тегерегиндеги гормондук өзгөрүүлөргө кошо жүрө турган бир нече физикалык белги бар. Алар өз циклиңизди байкоо үчүн пайдалуу болушу мүмкүн, бирок бир да белги овуляцияны так ырастай албайт.',
    ovulationSigns: [
      'Жатын моюнчасынын былжырынын өзгөрүшү: ал көбөйүп, тунуктап, созулуучу болушу мүмкүн',
      'Айрым аялдарда жеңил жамбаш оорусу же ыңгайсыздык',
      'Овуляциядан кийин дене температурасынын өзгөрүшү',
      'Кынаптын нымдуулугунун өзгөрүшү',
      'Айрым аялдарда либидонун мүмкүн болгон көбөйүшү',
    ],
    section3Body2: 'Жатын моюнчасынын былжырын өзгөчө байкоого татыйт. Бойго бүтүү терезеси жакындаган сайын ал көбүрөөк, тунук, жылмакай жана созулуучу болушу мүмкүн. Бирок анын көрүнүшү адамдан адамга жана циклден циклге айырмаланышы мүмкүн.',
    alert1Title: 'Болжолдоолорго сак болуңуз',
    alert1Text: 'Абдан туура эмес циклдер менен мурунку циклдерден автоматтык түрдө эсептелген овуляция күнү өтө жакындаштырылган болушу мүмкүн. Болжолдоо — овуляциянын медициналык ырастоосу эмес.',
    section4Body1: 'PCOS боюна бүтүүнү кыйындатышы мүмкүн, негизинен овуляция сейрек же болжолдоого кыйын болгондо. Бирок PCOS болушу тукумсуз болуу дегенди билдирбейт.',
    section4Body2: 'PCOS бар айрым аялдар үзгүлтүксүз овуляция кылышат жана өзгөчө кыйынчылыксыз боюна бүтөт. Башкалар үчүн овуляция баа берүүнү жана, мүмкүн, медициналык кам көрүүнү талап кыла тургандай туура эмес.',
    fertilityPoints: [
      'PCOS автоматтык түрдө тукумсуздукту жаратпайт',
      'Негизги кыйынчылык көбүнчө туура эмес же болжолдонбогон овуляция',
      'Овуляция циклдер абдан узун болгондо да болушу мүмкүн',
      'Ылайыктуу кам көрүү боюна бүтүү мүмкүнчүлүгүн жакшырта алат',
      'Бойго бүтүү жолу ар бир адамга жана көптөгөн башка факторлорго көз каранды',
    ],
    section4Body3: 'Бойго бүтүү жөндөмдүүлүгү жалаң овуляцияга да көз каранды эмес. Жаш, жолдоштун сперма сапаты, жумуртка түтүкчөлөрүнүн абалы, эндометрий жана башка факторлор да роль ойношу мүмкүн. Ошондуктан курсактуулук күтүлгөндөн узакка созулганда комплекстүү баа маанилүү.',
    section5Body1: 'Етек кирим көзөмөлүнүн колдонмолору адатта мурунку циклдердин маалыматын болжолдоолорду түзүү үчүн колдонот. Циклдер салыштырмалуу туруктуу болгондо, бул болжолдоолор шилтеме катары пайдалуу болушу мүмкүн.',
    section5Body2: 'Бирок PCOS менен цикл өзгөрмөлүүлүгү бул эсептөөлөрдү азыраак ишенимдүү кылышы мүмкүн. Колдонмо теориялык күнгө жеткендиктен гана овуляция болгонун так билүүгө жөндөмсүз.',
    tip2Title: 'Аны таяныч чекит катары колдонуңуз',
    tip2Text: 'Санариптик көзөмөл өз циклиңиздеги тенденцияларды байкоо жана ден соолук сактоо адиси менен бөлүшө турган тарыхты сактоо үчүн эң пайдалуу.',
    section6Body1: 'Үзгүлтүксүз көзөмөл жеке өзгөрүүлөрүңүздү жакшыраак түшүнүүгө жардам бериши мүмкүн. Максат — циклди кемчиликсиз болжолдонуучу кылуу эмес, тенденцияларды аныктоо үчүн жетиштүү маалымат чогултуу.',
    trackingTips: [
      'Циклдер абдан сейрек болгондо да, ар бир циклдин биринчи күнүнүн датасын жазыңыз',
      'Цикл бою жатын моюнчасынын былжырындагы өзгөрүүлөрдү байкаңыз',
      'Овуляцияга кошо жүрүшү мүмкүн болгон жамбаш оорусун же башка белгилерди жазыңыз',
      'Овуляцияны болжолдоо үчүн жалаң 28 күндүк орточо узактыкка таянуудан сактаныңыз',
      'Овуляция тесттерин сак колдонуңуз жана керек болсо адистен кеңеш сураңыз',
      'Боюна бүткүңүз келсе, чогулткан маалыматты ден соолук сактоо адиси менен бөлүшүңүз',
    ],
    section6Body2: 'Байланышкан белгилерди да жазып койсоңуз болот: оору, безеткилер, былжырдын өзгөрүшү, адаттан тыш кан кетүү, маанай, уйку же башка жеке байкоолор. Бул маалымат циклиңиздин толугураак сүрөтүн түзүүгө жардам бериши мүмкүн.',
    section7Body1: 'Консультация боюна бүтүүгө аракет кылууну баштоодон мурун эле, циклдер абдан туура эмес, абдан сейрек болгондо же етек кирим узак убакыт болбогондо пайдалуу болушу мүмкүн.',
    section7Body2: 'Ден соолук сактоо адиси туура эместиктердин себептерин изилдеп, овуляцияны баалап, керек болсо курсактуулук пландарыңызга ылайыктуу стратегияны сунуштай алат.',
    alert2Title: 'Кеңешти качан сурап кайрылуу керек',
    alert2Text: 'Эгер етек кирим абдан сейрек болсо, бир нече ай етек кирим болбосо же үзгүлтүксүз жыныстык катнашка карабастан курсактуулук болбосо, ден соолук сактоо адиси менен сүйлөшүңүз.',
    summaryTitle: 'Негизги учурлар',
    summaryRows: [
      'PCOS циклдерди узун жана болжолдонбогон кылышы мүмкүн.',
      'Овуляция айрым циклдерде туура эмес же болбой калышы мүмкүн.',
      'Туура эмес цикл бойго бүтүү жөндөмдүүлүгүнүн жоктугун автоматтык түрдө билдирбейт.',
      'Жалаң календарга негизделген болжолдоолор PCOS менен азыраак ишенимдүү болушу мүмкүн.',
      'Циклиңизди байкоо жана тарых сактоо, айрыкча консультация үчүн, пайдалуу болушу мүмкүн.',
    ],
    finalTipTitle: 'Акыркы сөз',
    finalTipText: 'PCOS ар бир аялда бирдей көрүнбөйт. Циклиңиз убакыттын өтүшү менен өзгөрүшү мүмкүн. Көзөмөл денеңиз кантип иштээрин жакшыраак түшүнүүгө жардам берүү үчүн, медициналык кеңешти алмаштыруу үчүн эмес.',
    disclaimer: 'Бул макала маалымат берүү жана билим берүү максатында гана жазылган. Ал медициналык диагноз болуп саналбайт жана ден соолук сактоо адиси менен консультацияны алмаштырбайт.',
    shareMessage: 'PCOS менен цикл, овуляция жана бойго бүтүү жөндөмдүүлүгү — AWA',
  },
  tk: {
    badge: 'PCOS',
    title: 'PCOS-da sikl, ovulýasiýa\nwe göwreli bolmak ukyby',
    metaDuration: '8 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Orta',
    metaValidated: 'Barlanan mazmun',
    intro: 'PCOS bilen sikliňiz uzak, düzgünsiz we käwagt çaklamaga kyn bolup biler. Ovulýasiýa töwereginde nämäniň bolýandygyny düşünmek sikliňize many bermäge we göwreli bolmak ukyby bilen baglanyşykly soraglary has gowy düşünmäge kömek edip biler.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Sikl näme üçin düzgünsiz bolýar',
      'Ovulýasiýa töwereginde näme bolýar',
      'Ovulýasiýany nähili tanamaly',
      'PCOS we göwreli bolmak ukyby',
      'Programmalar näme üçin az takyk bolup biler',
      'PCOS bilen sikliňizi yzarlamak',
      'Göwreli bolmak isleseňiz lukmana haçan ýüz tutmaly',
      'Esasy netijeler',
    ],
    section1Body1: 'Aýbaşy sikli gormonal signallaryň utgaşdyrylan yzygiderliligine bagly. PCOS-da bu gurluş, aýratyn-da follikulyň ösüşinde we ovulýasiýada, bozulyp biler.',
    section1Body2: 'Ýumurtgalyklarda ýeke agdyklyk edýän follikul yzygiderli ýetişmezden ösüp başlaýan köp sanly kiçi follikul bolup biler. Ovulýasiýa soňra gijikdirilip, çaklanylmaýan ýagdaýda bolup ýa-da käbir sikllerde hiç bolmazlygy mümkin.',
    section1Body3: 'Bu PCOS-ly käbir adamlaryň 35, 45 ýa-da käwagt has köp günlük sikllere eýe bolmagynyň, beýlekileriň bolsa adaty uzynlyga has ýakyn sikllere eýe bolup biljekdiginiň sebäplerinden biri.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Diňe sikliň uzynlygy ovulýasiýanyň bolandygyny aýtmaýar. Şol bir uzynlykdaky iki siklde dürli gormonal wakalar bolup biler.',
    section2Body1: 'Ovulýasiýa ýumurtgalykdan ýumurtganyň çykmagy. Ol follikulýar ýetişme tapgyryndan soň gelýär we sikliň lýuteal tapgyryndan öň bolýar.',
    section2Body2: 'Yzygiderli siklde ovulýasiýa köplenç ortarakda bolýar. Emma PCOS-da bu ýönekeý düzgün hemişe ulanylmaýar. Ovulýasiýa has giç bolup ýa-da belli bir siklde hiç bolmazlygy mümkin.',
    infoTitle: 'Bu näme üçin möhüm',
    infoText: 'Ovulýasiýa çaklanylmaýan bolanda, göwreli bolmaga ýeterlik döwri diňe aýbaşy seneleri boýunça bahalamak kynlaşýar.',
    section3Body1: 'Ovulýasiýa töwereginde gormonal üýtgeşmelere hemrah bolup biljek birnäçe fiziki alamat bar. Olar öz sikliňizi synlamak üçin peýdaly bolup biler, ýöne hiç bir ýeke alamat ovulýasiýany kepil bilen tassyklap bilmeýär.',
    ovulationSigns: [
      'Ýatgy boýnunyň ýaňsynyň üýtgemegi, ol has köp, arassa we çozulýan bolup biler',
      'Käbir aýallarda ýeňil çanak agyrysy ýa-da biynjalyk',
      'Ovulýasiýadan soň beden temperaturasynyň üýtgemegi',
      'Jynsy ýoluň çyglylygynyň üýtgemegi',
      'Käbir aýallarda libidonyň mümkin artmagy',
    ],
    section3Body2: 'Ýatgy boýnunyň ýaňsyny aýratyn synlamaga mynasyp. Göwreli bolmaga ýeterlik döwür ýakynlaşanda, ol has köp, arassa, süýşýän we çozulýan bolup biler. Şeýle-de bolsa, onuň görnüşi adamdan adama we sikldan sika tapawutlanyp biler.',
    alert1Title: 'Çaklamalara seresap boluň',
    alert1Text: 'Gaty düzgünsiz sikllerde öňki sikllerden awtomatiki hasaplanylan ovulýasiýa senesi gaty takmynan bolup biler. Çaklama ovulýasiýanyň lukmançylyk taýdan tassyklanmagy däl.',
    section4Body1: 'PCOS göwreli bolmagy kynlaşdyryp biler, esasan ovulýasiýa seýrek ýa-da çaklamaga kyn bolanda. Şeýle-de bolsa, PCOS-nyň bolmagy önelgesizligi aňlatmaýar.',
    section4Body2: 'PCOS-ly käbir aýallar yzygiderli ovulýasiýa edýär we aýratyn kynçylyksyz göwreli bolýar. Beýlekileriň ovulýasiýasy bahalandyrmagy we mümkin lukmançylyk kömegini talap etjek derejede düzgünsiz.',
    fertilityPoints: [
      'PCOS awtomatiki önelgesizlige sebäp bolmaýar',
      'Esasy kynçylyk köplenç düzgünsiz ýa-da çaklanylmaýan ovulýasiýa',
      'Ovulýasiýa sikller gaty uzak bolanda hem bolup biler',
      'Laýyk ideg göwreli bolmak mümkinçiligini ýokarlandyryp biler',
      'Göwreli bolmak ýoly her adama we beýleki köp faktorlara bagly',
    ],
    section4Body3: 'Göwreli bolmak ukyby hem ýeke ovulýasiýa bagly däl. Ýaş, hemrahyň spermasynyň hili, fallopiý turbalarynyň ýagdaýy, endometriý we beýleki faktorlar hem rol oýnap biler. Şonuň üçin göwrelilik garaşylandan uzak wagt alanda giňişleýin bahalandyrma möhüm.',
    section5Body1: 'Aýbaşy yzarlaýjy programmalar adatça çaklamalary almak üçin öňki sikllerden alnan maglumaty ulanýar. Sikller deňeşdirilende yzygiderli bolanda, bu çaklamalar salgylanma hökmünde peýdaly bolup biler.',
    section5Body2: 'Emma PCOS-da sikl üýtgeýjiligi bu hasaplamalary az ygtybarly edip biler. Programma diňe nazary sene gelenligi üçin ovulýasiýanyň bolandygyny kepillendirip bilmeýär.',
    tip2Title: 'Ony salgylanma nokady hökmünde ulanyň',
    tip2Text: 'Sanly yzarlama öz sikliňizdäki tendensiýalary synlamak we saglyk hünärmeniňiz bilen paýlaşmak üçin taryhy saklamak üçin iň peýdaly.',
    section6Body1: 'Yzygiderli yzarlama şahsy üýtgeşmeleriňizi has gowy düşünmäge kömek edip biler. Maksat sikli doly çaklanylýan etmek däl-de, tendensiýalary kesgitlemek üçin ýeterlik maglumat ýygnamak.',
    trackingTips: [
      'Sikller gaty seýrek bolsa-da, her sikliň ilkinji gününiň senesini belläň',
      'Sikl dowamynda ýatgy boýnunyň ýaňsynyň üýtgeşmelerini synlaň',
      'Ovulýasiýa hemrah bolup biljek islendik çanak agyrysyny ýa-da beýleki alamatlary belläň',
      'Ovulýasiýany çaklamak üçin diňe ortaça 28 günlük uzynlyga daýanmakdan gaça duruň',
      'Ovulýasiýa synaglaryny seresaplylyk bilen ulanyň we zerur bolsa hünärmenden maslahat soraň',
      'Göwreli bolmak isleseňiz, ýygnan maglumatyňyzy saglyk hünärmeni bilen paýlaşyň',
    ],
    section6Body2: 'Şeýle hem baglanyşykly alamatlary bellemek peýdaly bolup biler: agyry, akne, ýaňsdaky üýtgeşmeler, adaty däl gan akma, keýp, uky ýa-da beýleki şahsy synlamalar. Bu maglumat sikliňiziň has doly suratyny gurmaga kömek edip biler.',
    section7Body1: 'Maslahatlaşmak, hatda göwreli bolmaga synanyşmazdan öň hem, sikller gaty düzgünsiz, gaty seýrek ýa-da aýbaşy uzak wagt bolmasa, peýdaly bolup biler.',
    section7Body2: 'Saglyk hünärmeni düzgünsizlikleriň sebäplerini derňäp, ovulýasiýany bahalap we zerur bolsa göwrelilik meýilnamalaryňyza laýyk strategiýany teklip edip biler.',
    alert2Title: 'Maslahaty haçan soramaly',
    alert2Text: 'Aýbaşyňyz gaty seýrek bolsa, birnäçe aý aýbaşy bolmasa ýa-da yzygiderli jynsy gatnaşyga garamazdan göwrelilik bolmasa, saglyk hünärmeni bilen gürleşiň.',
    summaryTitle: 'Esasy nokatlar',
    summaryRows: [
      'PCOS sikli uzak we çaklanylmaýan edip biler.',
      'Ovulýasiýa käbir siklde düzgünsiz ýa-da ýok bolup biler.',
      'Düzgünsiz sikl awtomatiki göwreli bolmak ukybynyň ýoklugyny aňlatmaýar.',
      'Diňe senenama esaslanýan çaklamalar PCOS-da az ygtybarly bolup biler.',
      'Sikliňizi synlamak we taryhy saklamak, aýratyn-da maslahatlaşmak üçin peýdaly bolup biler.',
    ],
    finalTipTitle: 'Soňky söz',
    finalTipText: 'PCOS her aýalda şol bir görnüşde ýüze çykmaýar. Sikliňiz wagtyň geçmegi bilen üýtgäp biler. Yzarlama bedeniňiziň nähili işleýändigini has gowy düşünmäge kömek etmek üçin, lukmançylyk maslahatyny çalyşmak üçin däl.',
    disclaimer: 'Bu makala diňe maglumat we bilim maksatly. Ol lukmançylyk diagnozyny düzmeýär we saglyk hünärmeni bilen maslahatlaşmagy çalyşmaýar.',
    shareMessage: 'PCOS-da sikl, ovulýasiýa we göwreli bolmak ukyby — AWA',
  },
} as const);

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
