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

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const ID = 'hormones-menopause-equilibre';

const HERO = require('../../assets/images/library/rules-hero.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const KEY_HORMONES_ICONS = ['flower-outline', 'moon-waning-crescent', 'radar'] as const;

const SOLUTIONS_ICONS = ['walk', 'leaf', 'pill'] as const;

/* -------------------------------------------------------------------------- */
/* CONTENT (PHASE 7L — bilingual editorial content)                          */
/* -------------------------------------------------------------------------- */
// Article identity (ID, images, bookmark/progress keys, JSX structure) is
// untouched; only this object changes per language. The French text below
// is byte-identical to the original — never retyped, only moved into the
// `fr` key — so the app remains fully bilingual rather than having French
// replaced by English.
const CONTENT = {
  fr: {
    badge: 'PÉRIMÉNOPAUSE & MÉNOPAUSE • HORMONES',
    title: 'Les hormones\npendant la ménopause',
    metaDuration: '10 min de lecture',
    metaType: 'Article',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro: 'À l’approche de la ménopause, tes hormones ne s’arrêtent pas brutalement : elles fluctuent, ce qui explique à la fois les changements de cycle et la diversité des symptômes possibles.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Les principales hormones concernées',
      'Que se passe-t-il pendant la périménopause ?',
      'Quand les œstrogènes fluctuent',
      'Le rôle de la progestérone',
      'Pourquoi les symptômes peuvent varier',
      'Les symptômes les plus fréquents',
      'Hormones et sommeil',
      'Hormones et humeur',
      'Peut-on mesurer les hormones ?',
      'Comment mieux observer les changements',
      'Quand consulter un professionnel ?',
      'Quelles solutions peuvent être proposées ?',
      'À retenir',
    ],
    section1Body: 'Trois grandes hormones évoluent pendant cette transition, chacune avec un rôle différent :',
    keyHormones: [
      {title: 'Œstrogènes', text: 'Influencent le cycle, la peau, les os, le cœur et une partie de la régulation du sommeil et de l’humeur.'},
      {title: 'Progestérone', text: 'Produite après l’ovulation, elle a un effet plutôt apaisant et prépare le corps à une éventuelle grossesse.'},
      {title: 'FSH et LH', text: 'Pilotées par le cerveau, elles stimulent les ovaires ; leurs niveaux évoluent quand ceux-ci répondent différemment.'},
    ],
    infoCard1Title: 'À noter',
    infoCard1Text: 'Les taux d’hormones ne diminuent pas de façon parfaitement linéaire pendant la périménopause : ils peuvent fluctuer, monter et descendre, avant de se stabiliser à un niveau plus bas après la ménopause.',
    section2Body: 'Les ovaires répondent progressivement de façon moins régulière aux signaux hormonaux envoyés par le cerveau. C’est ce qui rend les cycles irréguliers et explique pourquoi les symptômes peuvent changer d’un mois à l’autre.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Il est tout à fait possible d’avoir des symptômes marqués un mois, puis presque aucun le mois suivant. Ce n’est pas anormal : cela reflète simplement les fluctuations hormonales de cette période.',
    section3Body: 'Les variations d’œstrogènes peuvent être associées à plusieurs changements :',
    estrogenSymptoms: [
      'Bouffées de chaleur',
      'Sueurs nocturnes',
      'Sécheresse vaginale',
      'Modifications du cycle',
      'Sensibilité émotionnelle',
      'Changements du sommeil',
    ],
    section3Body2: 'Ces symptômes peuvent avoir plusieurs causes : ils ne sont pas systématiquement liés aux hormones, et leur intensité varie beaucoup d’une personne à l’autre.',
    section4Body: 'La progestérone n’est produite qu’après l’ovulation. Or, pendant la périménopause, l’ovulation elle-même devient plus irrégulière — ce qui rend sa production moins prévisible.',
    section4Body2: 'Cette irrégularité explique en partie les changements observés dans le cycle : durée variable, règles parfois plus ou moins abondantes qu’avant.',
    section5Body: 'Au-delà des fluctuations hormonales, plusieurs facteurs s’ajoutent : la qualité du sommeil, le niveau de stress, le mode de vie, et les différences propres à chaque personne.',
    highlightText: '« Chaque femme vit la transition différemment. »',
    commonSymptoms: [
      'Cycles irréguliers',
      'Bouffées de chaleur',
      'Sueurs nocturnes',
      'Troubles du sommeil',
      'Changements d’humeur',
      'Fatigue',
      'Sécheresse vaginale',
      'Changements de la libido',
      'Difficultés de concentration',
    ],
    section6Caption: 'Cette liste est informative : elle ne constitue pas un diagnostic. Chaque personne vit une combinaison différente de ces changements.',
    section7Body: 'Les sueurs nocturnes peuvent interrompre le sommeil, ce qui entraîne fatigue et difficultés de concentration le lendemain — un enchaînement fréquent pendant cette période.',
    infoCard2Title: 'Astuce pratique',
    infoCard2Text: 'Une chambre fraîche, des vêtements légers et une routine de coucher stable peuvent aider à limiter ces réveils.',
    section8Body: 'Les fluctuations hormonales peuvent coïncider avec des changements d’humeur, sans en être la seule explication : le sommeil, le stress, les changements de vie et les symptômes physiques jouent aussi un rôle.',
    infoCard3Title: 'Pour te rassurer',
    infoCard3Text: 'Se sentir plus émotive pendant cette période ne veut pas dire qu’il y a un problème : c’est une expérience courante, qui peut avoir plusieurs origines à la fois.',
    section9Body: 'Les taux d’hormones peuvent varier considérablement d’un jour à l’autre pendant la périménopause. Un dosage isolé ne donne donc pas toujours une image complète de la situation.',
    infoCard4Title: 'À garder en tête',
    infoCard4Text: 'L’évaluation médicale dépend surtout de ton âge, de tes symptômes et de ton historique de cycles — pas uniquement d’un chiffre isolé.',
    section10Body: 'Noter ce que tu vis mois après mois t’aide à repérer tes propres tendances plutôt qu’à te comparer :',
    trackingItems: [
      'Les dates de ton cycle',
      'Tes symptômes au fil des jours',
      'Ton sommeil',
      'Ton humeur',
      'Tes bouffées de chaleur',
      'Les changements de saignements',
      'Ce qui semble déclencher certains symptômes',
    ],
    tip2Title: 'Petit réflexe utile',
    tip2Text: 'Le suivi de ton cycle dans AWA peut t’aider à repérer tes propres tendances au fil des mois, sans effort particulier.',
    section11Body: 'La plupart de ces situations relèvent d’une consultation de routine, à ton rythme :',
    warningTitle: 'Bon à évoquer avec un professionnel',
    consultSituations: [
      'Des symptômes qui affectent significativement ton quotidien',
      'Des troubles du sommeil persistants',
      'Des bouffées de chaleur très gênantes',
      'Un symptôme nouveau ou inhabituel',
      'Des changements importants dans tes saignements',
      'Des questions sur les options de traitement',
      'Des préoccupations liées à la sécheresse vaginale ou à ta vie sexuelle',
    ],
    infoCard5Title: 'Un cas à part',
    infoCard5Text: 'Des saignements très abondants ou inhabituels méritent, eux, d’être signalés plus rapidement à un professionnel de santé.',
    section12Body: 'Selon la situation, un professionnel peut évoquer différentes pistes :',
    solutions: [
      {title: 'Mesures de mode de vie', text: 'Activité physique, alimentation, gestion du stress et du sommeil.'},
      {title: 'Traitements non hormonaux', text: 'Certaines options peuvent cibler des symptômes précis, selon la situation.'},
      {title: 'Traitements hormonaux', text: 'Discutés avec un médecin lorsque cela correspond à ton profil et à tes besoins.'},
    ],
    section12Caption: 'Ces décisions restent individualisées : elles dépendent de tes antécédents, de tes symptômes, des risques et de tes préférences personnelles.',
    summaryPoints: [
      'Les changements hormonaux font partie intégrante de la transition ménopausique.',
      'Les taux d’hormones peuvent fluctuer fortement pendant la périménopause, sans baisse parfaitement linéaire.',
      'Les symptômes varient beaucoup d’une personne à l’autre, et d’un mois à l’autre.',
      'Observer tes symptômes peut t’aider à mieux repérer tes propres tendances.',
      'Un professionnel de santé peut t’accompagner si les symptômes deviennent difficiles à gérer.',
    ],
    disclaimerText: 'Contenu informatif. Cet article ne remplace pas un avis médical personnalisé. En cas de doute, demande conseil à un professionnel de santé.',
    shareMessage: 'Les hormones pendant la ménopause — AWA',
  },
  en: {
    badge: 'PERIMENOPAUSE & MENOPAUSE • HORMONES',
    title: 'Hormones\nduring menopause',
    metaDuration: '10 min read',
    metaType: 'Article',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro: 'As menopause approaches, your hormones don’t stop abruptly: they fluctuate, which explains both the cycle changes and the variety of possible symptoms.',
    contentsTitle: 'In this article',
    topics: [
      'The main hormones involved',
      'What happens during perimenopause?',
      'When estrogen fluctuates',
      'The role of progesterone',
      'Why symptoms can vary',
      'The most common symptoms',
      'Hormones and sleep',
      'Hormones and mood',
      'Can hormones be measured?',
      'How to better track the changes',
      'When to see a professional?',
      'What solutions might be suggested?',
      'Key takeaways',
    ],
    section1Body: 'Three major hormones change during this transition, each with a different role:',
    keyHormones: [
      {title: 'Estrogen', text: 'Influences the cycle, skin, bones, heart, and partly regulates sleep and mood.'},
      {title: 'Progesterone', text: 'Produced after ovulation, it has a rather calming effect and prepares the body for a possible pregnancy.'},
      {title: 'FSH and LH', text: 'Controlled by the brain, they stimulate the ovaries; their levels change as the ovaries respond differently.'},
    ],
    infoCard1Title: 'Worth noting',
    infoCard1Text: 'Hormone levels don’t decline in a perfectly linear way during perimenopause: they can fluctuate, rise and fall, before settling at a lower level after menopause.',
    section2Body: 'The ovaries gradually respond less regularly to the hormonal signals sent by the brain. This is what makes cycles irregular and explains why symptoms can change from month to month.',
    tip1Title: 'Good to know',
    tip1Text: 'It’s entirely possible to have noticeable symptoms one month, then almost none the next. This isn’t abnormal: it simply reflects the hormonal fluctuations of this period.',
    section3Body: 'Changes in estrogen can be linked to several changes:',
    estrogenSymptoms: [
      'Hot flashes',
      'Night sweats',
      'Vaginal dryness',
      'Cycle changes',
      'Emotional sensitivity',
      'Sleep changes',
    ],
    section3Body2: 'These symptoms can have several causes: they aren’t always linked to hormones, and their intensity varies a lot from person to person.',
    section4Body: 'Progesterone is only produced after ovulation. But during perimenopause, ovulation itself becomes more irregular — which makes its production less predictable.',
    section4Body2: 'This irregularity partly explains the changes seen in the cycle: variable length, periods sometimes heavier or lighter than before.',
    section5Body: 'Beyond hormonal fluctuations, several other factors come into play: sleep quality, stress levels, lifestyle, and differences specific to each person.',
    highlightText: '"Every woman experiences the transition differently."',
    commonSymptoms: [
      'Irregular cycles',
      'Hot flashes',
      'Night sweats',
      'Sleep problems',
      'Mood changes',
      'Fatigue',
      'Vaginal dryness',
      'Changes in libido',
      'Difficulty concentrating',
    ],
    section6Caption: 'This list is for information only: it isn’t a diagnosis. Each person experiences a different combination of these changes.',
    section7Body: 'Night sweats can interrupt sleep, leading to fatigue and difficulty concentrating the next day — a pattern that’s common during this period.',
    infoCard2Title: 'Practical tip',
    infoCard2Text: 'A cool bedroom, lightweight clothing, and a stable bedtime routine can help limit these wake-ups.',
    section8Body: 'Hormonal fluctuations can coincide with mood changes, without being the only explanation: sleep, stress, life changes, and physical symptoms also play a role.',
    infoCard3Title: 'To reassure you',
    infoCard3Text: 'Feeling more emotional during this period doesn’t mean something is wrong: it’s a common experience that can have several causes at once.',
    section9Body: 'Hormone levels can vary considerably from one day to the next during perimenopause. A single test therefore doesn’t always give a complete picture of the situation.',
    infoCard4Title: 'Worth keeping in mind',
    infoCard4Text: 'Medical assessment depends mainly on your age, your symptoms, and your cycle history — not just a single number.',
    section10Body: 'Writing down what you experience month after month helps you spot your own patterns rather than comparing yourself to others:',
    trackingItems: [
      'Your cycle dates',
      'Your symptoms day by day',
      'Your sleep',
      'Your mood',
      'Your hot flashes',
      'Changes in your bleeding',
      'What seems to trigger certain symptoms',
    ],
    tip2Title: 'A helpful habit',
    tip2Text: 'Tracking your cycle in AWA can help you spot your own patterns over the months, with no extra effort.',
    section11Body: 'Most of these situations call for a routine consultation, at your own pace:',
    warningTitle: 'Worth mentioning to a professional',
    consultSituations: [
      'Symptoms that significantly affect your daily life',
      'Persistent sleep problems',
      'Very bothersome hot flashes',
      'A new or unusual symptom',
      'Significant changes in your bleeding',
      'Questions about treatment options',
      'Concerns related to vaginal dryness or your sex life',
    ],
    infoCard5Title: 'A special case',
    infoCard5Text: 'Very heavy or unusual bleeding, on the other hand, should be reported to a healthcare professional more quickly.',
    section12Body: 'Depending on the situation, a professional may suggest different options:',
    solutions: [
      {title: 'Lifestyle measures', text: 'Physical activity, diet, and managing stress and sleep.'},
      {title: 'Non-hormonal treatments', text: 'Certain options can target specific symptoms, depending on the situation.'},
      {title: 'Hormonal treatments', text: 'Discussed with a doctor when it fits your profile and needs.'},
    ],
    section12Caption: 'These decisions remain individual: they depend on your history, your symptoms, the risks, and your personal preferences.',
    summaryPoints: [
      'Hormonal changes are an integral part of the menopause transition.',
      'Hormone levels can fluctuate significantly during perimenopause, without a perfectly linear decline.',
      'Symptoms vary a lot from person to person, and from month to month.',
      'Tracking your symptoms can help you better spot your own patterns.',
      'A healthcare professional can support you if symptoms become difficult to manage.',
    ],
    disclaimerText: 'Informational content. This article does not replace personalized medical advice. If in doubt, seek guidance from a healthcare professional.',
    shareMessage: 'Hormones during menopause — AWA',
  },
  es: {
    badge: 'PERIMENOPAUSIA Y MENOPAUSIA • HORMONAS',
    title: 'Las hormonas\ndurante la menopausia',
    metaDuration: '10 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido validado',
    intro: 'Al acercarse la menopausia, tus hormonas no se detienen bruscamente: fluctúan, lo que explica tanto los cambios de ciclo como la diversidad de síntomas posibles.',
    contentsTitle: 'En este artículo',
    topics: [
      'Las principales hormonas implicadas',
      '¿Qué ocurre durante la perimenopausia?',
      'Cuando los estrógenos fluctúan',
      'El papel de la progesterona',
      'Por qué los síntomas pueden variar',
      'Los síntomas más frecuentes',
      'Hormonas y sueño',
      'Hormonas y estado de ánimo',
      '¿Se pueden medir las hormonas?',
      'Cómo observar mejor los cambios',
      '¿Cuándo consultar a un profesional?',
      '¿Qué soluciones se pueden proponer?',
      'Para recordar',
    ],
    section1Body: 'Tres grandes hormonas evolucionan durante esta transición, cada una con un papel diferente:',
    keyHormones: [
      {title: 'Estrógenos', text: 'Influyen en el ciclo, la piel, los huesos, el corazón y en parte en la regulación del sueño y del estado de ánimo.'},
      {title: 'Progesterona', text: 'Producida después de la ovulación, tiene un efecto más bien calmante y prepara el cuerpo para un posible embarazo.'},
      {title: 'FSH y LH', text: 'Dirigidas por el cerebro, estimulan los ovarios; sus niveles cambian cuando estos responden de forma diferente.'},
    ],
    infoCard1Title: 'A tener en cuenta',
    infoCard1Text: 'Los niveles de hormonas no disminuyen de forma perfectamente lineal durante la perimenopausia: pueden fluctuar, subir y bajar, antes de estabilizarse en un nivel más bajo después de la menopausia.',
    section2Body: 'Los ovarios responden progresivamente de forma menos regular a las señales hormonales enviadas por el cerebro. Esto es lo que hace que los ciclos sean irregulares y explica por qué los síntomas pueden cambiar de un mes a otro.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Es perfectamente posible tener síntomas marcados un mes y casi ninguno al mes siguiente. Esto no es anormal: simplemente refleja las fluctuaciones hormonales de este periodo.',
    section3Body: 'Las variaciones de estrógenos pueden asociarse a varios cambios:',
    estrogenSymptoms: [
      'Sofocos',
      'Sudores nocturnos',
      'Sequedad vaginal',
      'Modificaciones del ciclo',
      'Sensibilidad emocional',
      'Cambios en el sueño',
    ],
    section3Body2: 'Estos síntomas pueden tener varias causas: no están sistemáticamente relacionados con las hormonas, y su intensidad varía mucho de una persona a otra.',
    section4Body: 'La progesterona solo se produce después de la ovulación. Sin embargo, durante la perimenopausia, la propia ovulación se vuelve más irregular, lo que hace que su producción sea menos previsible.',
    section4Body2: 'Esta irregularidad explica en parte los cambios observados en el ciclo: duración variable, reglas a veces más o menos abundantes que antes.',
    section5Body: 'Más allá de las fluctuaciones hormonales, se añaden varios factores: la calidad del sueño, el nivel de estrés, el estilo de vida y las diferencias propias de cada persona.',
    highlightText: '«Cada mujer vive la transición de forma diferente.»',
    commonSymptoms: [
      'Ciclos irregulares',
      'Sofocos',
      'Sudores nocturnos',
      'Trastornos del sueño',
      'Cambios de humor',
      'Fatiga',
      'Sequedad vaginal',
      'Cambios en la libido',
      'Dificultades de concentración',
    ],
    section6Caption: 'Esta lista es informativa: no constituye un diagnóstico. Cada persona vive una combinación diferente de estos cambios.',
    section7Body: 'Los sudores nocturnos pueden interrumpir el sueño, lo que provoca fatiga y dificultades de concentración al día siguiente — un encadenamiento frecuente durante este periodo.',
    infoCard2Title: 'Consejo práctico',
    infoCard2Text: 'Una habitación fresca, ropa ligera y una rutina de sueño estable pueden ayudar a limitar estos despertares.',
    section8Body: 'Las fluctuaciones hormonales pueden coincidir con cambios de humor, sin ser la única explicación: el sueño, el estrés, los cambios de vida y los síntomas físicos también juegan un papel.',
    infoCard3Title: 'Para tranquilizarte',
    infoCard3Text: 'Sentirte más sensible durante este periodo no significa que haya un problema: es una experiencia frecuente, que puede tener varios orígenes a la vez.',
    section9Body: 'Los niveles de hormonas pueden variar considerablemente de un día a otro durante la perimenopausia. Por eso, un análisis aislado no siempre ofrece una imagen completa de la situación.',
    infoCard4Title: 'A tener en mente',
    infoCard4Text: 'La evaluación médica depende sobre todo de tu edad, de tus síntomas y de tu historial de ciclos — no únicamente de una cifra aislada.',
    section10Body: 'Anotar lo que vives mes a mes te ayuda a detectar tus propias tendencias en lugar de compararte con otras:',
    trackingItems: [
      'Las fechas de tu ciclo',
      'Tus síntomas día a día',
      'Tu sueño',
      'Tu estado de ánimo',
      'Tus sofocos',
      'Los cambios en tu sangrado',
      'Lo que parece desencadenar ciertos síntomas',
    ],
    tip2Title: 'Un pequeño hábito útil',
    tip2Text: 'El seguimiento de tu ciclo en AWA puede ayudarte a detectar tus propias tendencias con el paso de los meses, sin esfuerzo particular.',
    section11Body: 'La mayoría de estas situaciones corresponden a una consulta de rutina, a tu ritmo:',
    warningTitle: 'Bueno para comentar con un profesional',
    consultSituations: [
      'Síntomas que afectan significativamente tu día a día',
      'Trastornos del sueño persistentes',
      'Sofocos muy molestos',
      'Un síntoma nuevo o inusual',
      'Cambios importantes en tu sangrado',
      'Preguntas sobre las opciones de tratamiento',
      'Preocupaciones relacionadas con la sequedad vaginal o tu vida sexual',
    ],
    infoCard5Title: 'Un caso aparte',
    infoCard5Text: 'Un sangrado muy abundante o inusual, en cambio, merece ser comunicado más rápidamente a un profesional de la salud.',
    section12Body: 'Según la situación, un profesional puede plantear diferentes opciones:',
    solutions: [
      {title: 'Medidas de estilo de vida', text: 'Actividad física, alimentación, gestión del estrés y del sueño.'},
      {title: 'Tratamientos no hormonales', text: 'Algunas opciones pueden dirigirse a síntomas concretos, según la situación.'},
      {title: 'Tratamientos hormonales', text: 'Se discuten con un médico cuando se ajustan a tu perfil y a tus necesidades.'},
    ],
    section12Caption: 'Estas decisiones siguen siendo individualizadas: dependen de tus antecedentes, de tus síntomas, de los riesgos y de tus preferencias personales.',
    summaryPoints: [
      'Los cambios hormonales forman parte integral de la transición menopáusica.',
      'Los niveles de hormonas pueden fluctuar fuertemente durante la perimenopausia, sin una disminución perfectamente lineal.',
      'Los síntomas varían mucho de una persona a otra, y de un mes a otro.',
      'Observar tus síntomas puede ayudarte a detectar mejor tus propias tendencias.',
      'Un profesional de la salud puede acompañarte si los síntomas se vuelven difíciles de gestionar.',
    ],
    disclaimerText: 'Contenido informativo. Este artículo no sustituye un asesoramiento médico personalizado. En caso de duda, pide consejo a un profesional de la salud.',
    shareMessage: 'Las hormonas durante la menopausia — AWA',
  },
  it: {
    badge: 'PERIMENOPAUSA E MENOPAUSA • ORMONI',
    title: 'Gli ormoni\ndurante la menopausa',
    metaDuration: '10 min di lettura',
    metaType: 'Articolo',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenuto validato',
    intro: 'Con l’avvicinarsi della menopausa, i tuoi ormoni non si fermano all’improvviso: fluttuano, e questo spiega sia i cambiamenti del ciclo sia la varietà dei possibili sintomi.',
    contentsTitle: 'In questo articolo',
    topics: [
      'I principali ormoni coinvolti',
      'Cosa succede durante la perimenopausa?',
      'Quando gli estrogeni fluttuano',
      'Il ruolo del progesterone',
      'Perché i sintomi possono variare',
      'I sintomi più comuni',
      'Ormoni e sonno',
      'Ormoni e umore',
      'Gli ormoni si possono misurare?',
      'Come monitorare meglio i cambiamenti',
      'Quando rivolgersi a un professionista?',
      'Quali soluzioni possono essere proposte?',
      'Punti chiave da ricordare',
    ],
    section1Body: 'Durante questa transizione cambiano tre ormoni principali, ciascuno con un ruolo diverso:',
    keyHormones: [
      {
        title: 'Estrogeni',
        text: 'Influenzano il ciclo, la pelle, le ossa, il cuore e in parte regolano il sonno e l’umore.',
      },
      {
        title: 'Progesterone',
        text: 'Prodotto dopo l’ovulazione, ha un effetto piuttosto calmante e prepara il corpo a una possibile gravidanza.',
      },
      {
        title: 'FSH e LH',
        text: 'Controllati dal cervello, stimolano le ovaie; i loro livelli cambiano perché le ovaie rispondono in modo diverso.',
      },
    ],
    infoCard1Title: 'Da sapere',
    infoCard1Text: 'I livelli ormonali non diminuiscono in modo perfettamente lineare durante la perimenopausa: possono fluttuare, salire e scendere, prima di stabilizzarsi su un livello più basso dopo la menopausa.',
    section2Body: 'Le ovaie rispondono gradualmente in modo meno regolare ai segnali ormonali inviati dal cervello. È ciò che rende i cicli irregolari e spiega perché i sintomi possono cambiare da un mese all’altro.',
    tip1Title: 'Bene a sapersi',
    tip1Text: 'È del tutto possibile avere sintomi evidenti un mese e quasi nessuno il mese successivo. Non è anomalo: riflette semplicemente le fluttuazioni ormonali di questo periodo.',
    section3Body: 'Le variazioni degli estrogeni possono essere associate a diversi cambiamenti:',
    estrogenSymptoms: [
      'Vampate di calore',
      'Sudorazioni notturne',
      'Secchezza vaginale',
      'Cambiamenti del ciclo',
      'Sensibilità emotiva',
      'Cambiamenti del sonno',
    ],
    section3Body2: 'Questi sintomi possono avere diverse cause: non sono sempre legati agli ormoni e la loro intensità varia molto da persona a persona.',
    section4Body: 'Il progesterone viene prodotto solo dopo l’ovulazione. Ma durante la perimenopausa l’ovulazione stessa diventa più irregolare, il che rende la sua produzione meno prevedibile.',
    section4Body2: 'Questa irregolarità spiega in parte i cambiamenti osservati nel ciclo: durata variabile, mestruazioni a volte più abbondanti o più leggere di prima.',
    section5Body: 'Oltre alle fluttuazioni ormonali, entrano in gioco molti altri fattori: la qualità del sonno, il livello di stress, lo stile di vita e le differenze proprie di ogni persona.',
    highlightText: '«Ogni donna vive la transizione in modo diverso.»',
    commonSymptoms: [
      'Cicli irregolari',
      'Vampate di calore',
      'Sudorazioni notturne',
      'Problemi di sonno',
      'Sbalzi d’umore',
      'Stanchezza',
      'Secchezza vaginale',
      'Cambiamenti della libido',
      'Difficoltà di concentrazione',
    ],
    section6Caption: 'Questo elenco ha solo scopo informativo: non è una diagnosi. Ogni persona vive una combinazione diversa di questi cambiamenti.',
    section7Body: 'Le sudorazioni notturne possono interrompere il sonno, causando stanchezza e difficoltà di concentrazione il giorno dopo: uno schema comune in questo periodo.',
    infoCard2Title: 'Consiglio pratico',
    infoCard2Text: 'Una camera da letto fresca, abiti leggeri e una routine regolare prima di dormire possono aiutare a limitare questi risvegli.',
    section8Body: 'Le fluttuazioni ormonali possono coincidere con cambiamenti dell’umore, senza esserne l’unica spiegazione: anche il sonno, lo stress, i cambiamenti di vita e i sintomi fisici hanno un ruolo.',
    infoCard3Title: 'Per rassicurarti',
    infoCard3Text: 'Sentirsi più emotive in questo periodo non significa che qualcosa non vada: è un’esperienza comune che può avere più cause contemporaneamente.',
    section9Body: 'Durante la perimenopausa i livelli ormonali possono variare notevolmente da un giorno all’altro. Un singolo esame, quindi, non sempre offre un quadro completo della situazione.',
    infoCard4Title: 'Da tenere a mente',
    infoCard4Text: 'La valutazione medica dipende soprattutto dalla tua età, dai tuoi sintomi e dalla storia del tuo ciclo, non solo da un singolo valore.',
    section10Body: 'Annotare ciò che vivi mese dopo mese ti aiuta a individuare i tuoi schemi personali, invece di confrontarti con le altre:',
    trackingItems: [
      'Le date del tuo ciclo',
      'I tuoi sintomi giorno per giorno',
      'Il tuo sonno',
      'Il tuo umore',
      'Le tue vampate di calore',
      'I cambiamenti del tuo flusso',
      'Ciò che sembra scatenare certi sintomi',
    ],
    tip2Title: 'Un’abitudine utile',
    tip2Text: 'Monitorare il tuo ciclo con AWA può aiutarti a individuare i tuoi schemi nel corso dei mesi, senza alcuno sforzo in più.',
    section11Body: 'La maggior parte di queste situazioni richiede una visita di routine, con i tuoi tempi:',
    warningTitle: 'Da riferire a un professionista',
    consultSituations: [
      'Sintomi che incidono in modo significativo sulla tua vita quotidiana',
      'Problemi di sonno persistenti',
      'Vampate di calore molto fastidiose',
      'Un sintomo nuovo o insolito',
      'Cambiamenti importanti del sanguinamento',
      'Domande sulle opzioni di trattamento',
      'Preoccupazioni legate alla secchezza vaginale o alla tua vita sessuale',
    ],
    infoCard5Title: 'Un caso particolare',
    infoCard5Text: 'Un sanguinamento molto abbondante o insolito, invece, va segnalato più rapidamente a un professionista sanitario.',
    section12Body: 'A seconda della situazione, un professionista può proporre diverse opzioni:',
    solutions: [
      {
        title: 'Misure legate allo stile di vita',
        text: 'Attività fisica, alimentazione e gestione di stress e sonno.',
      },
      {
        title: 'Trattamenti non ormonali',
        text: 'Alcune opzioni possono agire su sintomi specifici, a seconda della situazione.',
      },
      {
        title: 'Trattamenti ormonali',
        text: 'Se ne parla con un medico quando sono adatti al tuo profilo e alle tue esigenze.',
      },
    ],
    section12Caption: 'Queste decisioni restano individuali: dipendono dalla tua storia clinica, dai tuoi sintomi, dai rischi e dalle tue preferenze personali.',
    summaryPoints: [
      'I cambiamenti ormonali sono parte integrante della transizione verso la menopausa.',
      'I livelli ormonali possono fluttuare in modo significativo durante la perimenopausa, senza un calo perfettamente lineare.',
      'I sintomi variano molto da persona a persona e da un mese all’altro.',
      'Monitorare i tuoi sintomi può aiutarti a individuare meglio i tuoi schemi personali.',
      'Un professionista sanitario può sostenerti se i sintomi diventano difficili da gestire.',
    ],
    disclaimerText: 'Contenuto informativo. Questo articolo non sostituisce un parere medico personalizzato. In caso di dubbi, rivolgiti a un professionista sanitario.',
    shareMessage: 'Gli ormoni durante la menopausa — AWA',
  },
  tr: {
    badge: 'PERİMENOPOZ VE MENOPOZ • HORMONLAR',
    title: 'Menopozda\nhormonlar',
    metaDuration: '10 dk okuma',
    metaType: 'Makale',
    metaLevel: 'Orta düzey',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Menopoz yaklaşırken hormonların birdenbire durmaz: dalgalanır. Bu da hem döngü değişimlerini hem de olası belirtilerin çeşitliliğini açıklar.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Rol oynayan başlıca hormonlar',
      'Perimenopozda neler olur?',
      'Östrojen dalgalandığında',
      'Progesteronun rolü',
      'Belirtiler neden farklılık gösterebilir?',
      'En sık görülen belirtiler',
      'Hormonlar ve uyku',
      'Hormonlar ve ruh hali',
      'Hormonlar ölçülebilir mi?',
      'Değişimleri daha iyi nasıl takip edersin?',
      'Ne zaman bir uzmana görünmeli?',
      'Hangi çözümler önerilebilir?',
      'Akılda kalacaklar',
    ],
    section1Body: 'Bu geçiş sürecinde üç ana hormon değişir ve her birinin rolü farklıdır:',
    keyHormones: [
      {
        title: 'Östrojen',
        text: 'Döngüyü, cildi, kemikleri ve kalbi etkiler; uykuyu ve ruh halini de kısmen düzenler.',
      },
      {
        title: 'Progesteron',
        text: 'Yumurtlamadan sonra üretilir; oldukça yatıştırıcı bir etkisi vardır ve bedeni olası bir gebeliğe hazırlar.',
      },
      {
        title: 'FSH ve LH',
        text: 'Beyin tarafından kontrol edilirler ve yumurtalıkları uyarırlar; yumurtalıklar farklı yanıt verdikçe düzeyleri değişir.',
      },
    ],
    infoCard1Title: 'Dikkate değer',
    infoCard1Text: 'Hormon düzeyleri perimenopozda tam doğrusal biçimde düşmez: dalgalanabilir, inip çıkabilir ve menopozdan sonra daha düşük bir düzeyde dengelenir.',
    section2Body: 'Yumurtalıklar, beynin gönderdiği hormonal sinyallere zamanla daha düzensiz yanıt verir. Döngüleri düzensiz hale getiren ve belirtilerin aydan aya değişebilmesini açıklayan budur.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Bir ay belirgin belirtiler yaşayıp ertesi ay neredeyse hiç yaşamamak tamamen mümkündür. Bu anormal değildir: yalnızca bu dönemin hormonal dalgalanmalarını yansıtır.',
    section3Body: 'Östrojendeki değişimler birkaç değişimle bağlantılı olabilir:',
    estrogenSymptoms: [
      'Sıcak basmaları',
      'Gece terlemeleri',
      'Vajinal kuruluk',
      'Döngü değişimleri',
      'Duygusal hassasiyet',
      'Uyku değişimleri',
    ],
    section3Body2: 'Bu belirtilerin birkaç nedeni olabilir: her zaman hormonlarla ilgili değildirler ve şiddetleri kişiden kişiye çok değişir.',
    section4Body: 'Progesteron yalnızca yumurtlamadan sonra üretilir. Ancak perimenopozda yumurtlamanın kendisi de daha düzensiz hale gelir; bu da üretimini daha az öngörülebilir kılar.',
    section4Body2: 'Bu düzensizlik, döngüde görülen değişimleri kısmen açıklar: değişken uzunluk, bazen öncekinden daha yoğun ya da daha hafif adetler.',
    section5Body: 'Hormonal dalgalanmaların ötesinde başka birçok etken de devreye girer: uyku kalitesi, stres düzeyi, yaşam tarzı ve her kişiye özgü farklılıklar.',
    highlightText: '"Her kadın bu geçişi farklı yaşar."',
    commonSymptoms: [
      'Düzensiz döngüler',
      'Sıcak basmaları',
      'Gece terlemeleri',
      'Uyku sorunları',
      'Ruh hali değişimleri',
      'Yorgunluk',
      'Vajinal kuruluk',
      'Cinsel istekte değişimler',
      'Odaklanma güçlüğü',
    ],
    section6Caption: 'Bu liste yalnızca bilgilendirme amaçlıdır: bir tanı değildir. Her kişi bu değişimlerin farklı bir bileşimini yaşar.',
    section7Body: 'Gece terlemeleri uykuyu bölebilir; bu da ertesi gün yorgunluğa ve odaklanma güçlüğüne yol açabilir — bu dönemde sık görülen bir tablodur.',
    infoCard2Title: 'Pratik öneri',
    infoCard2Text: 'Serin bir yatak odası, hafif giysiler ve düzenli bir uyku öncesi rutini bu uyanmaları sınırlamaya yardımcı olabilir.',
    section8Body: 'Hormonal dalgalanmalar ruh hali değişimleriyle aynı döneme denk gelebilir, ancak tek açıklama bunlar değildir: uyku, stres, yaşam değişiklikleri ve bedensel belirtiler de rol oynar.',
    infoCard3Title: 'İçini rahatlatmak için',
    infoCard3Text: 'Bu dönemde daha duygusal hissetmek bir şeylerin ters gittiği anlamına gelmez: aynı anda birkaç nedeni olabilen yaygın bir deneyimdir.',
    section9Body: 'Hormon düzeyleri perimenopozda bir günden diğerine hayli değişebilir. Bu nedenle tek bir test durumun tam bir resmini her zaman vermez.',
    infoCard4Title: 'Aklında bulunsun',
    infoCard4Text: 'Tıbbi değerlendirme esas olarak yaşına, belirtilerine ve döngü geçmişine bağlıdır; yalnızca tek bir sayıya değil.',
    section10Body: 'Ay be ay yaşadıklarını not etmek, kendini başkalarıyla kıyaslamak yerine kendi örüntülerini fark etmene yardımcı olur:',
    trackingItems: [
      'Döngü tarihlerin',
      'Gün gün belirtilerin',
      'Uykun',
      'Ruh halin',
      'Sıcak basmaların',
      'Kanamandaki değişimler',
      'Bazı belirtileri tetikliyor gibi görünen şeyler',
    ],
    tip2Title: 'Faydalı bir alışkanlık',
    tip2Text: 'Döngünü AWA’da takip etmek, ekstra bir çaba harcamadan aylar içinde kendi örüntülerini fark etmene yardımcı olabilir.',
    section11Body: 'Bu durumların çoğu, kendi temponda yapılacak rutin bir muayene gerektirir:',
    warningTitle: 'Bir uzmanla paylaşmaya değer',
    consultSituations: [
      'Günlük yaşamını önemli ölçüde etkileyen belirtiler',
      'Geçmeyen uyku sorunları',
      'Çok rahatsız edici sıcak basmaları',
      'Yeni ya da alışılmadık bir belirti',
      'Kanamanda belirgin değişimler',
      'Tedavi seçenekleri hakkında sorular',
      'Vajinal kuruluk ya da cinsel yaşamınla ilgili kaygılar',
    ],
    infoCard5Title: 'Özel bir durum',
    infoCard5Text: 'Çok yoğun ya da alışılmadık kanama ise buna karşılık bir sağlık uzmanına daha hızlı bildirilmelidir.',
    section12Body: 'Duruma göre bir uzman farklı seçenekler önerebilir:',
    solutions: [
      {
        title: 'Yaşam tarzı önlemleri',
        text: 'Fiziksel aktivite, beslenme ve stres ile uykunun yönetimi.',
      },
      {
        title: 'Hormonal olmayan tedaviler',
        text: 'Bazı seçenekler, duruma göre belirli belirtileri hedefleyebilir.',
      },
      {
        title: 'Hormonal tedaviler',
        text: 'Profiline ve ihtiyaçlarına uygun olduğunda bir doktorla görüşülür.',
      },
    ],
    section12Caption: 'Bu kararlar kişiseldir: geçmişine, belirtilerine, risklere ve kişisel tercihlerine bağlıdır.',
    summaryPoints: [
      'Hormonal değişimler menopoz geçişinin ayrılmaz bir parçasıdır.',
      'Hormon düzeyleri perimenopozda belirgin biçimde dalgalanabilir; düşüş tam doğrusal değildir.',
      'Belirtiler kişiden kişiye ve aydan aya çok değişir.',
      'Belirtilerini takip etmek, kendi örüntülerini daha iyi fark etmene yardımcı olabilir.',
      'Belirtiler başa çıkılması zor hale gelirse bir sağlık uzmanı sana destek olabilir.',
    ],
    disclaimerText: 'Bilgilendirme amaçlı içerik. Bu makale kişiye özel tıbbi tavsiyenin yerini tutmaz. Şüphe duyarsan bir sağlık uzmanından rehberlik al.',
    shareMessage: 'Menopozda hormonlar — AWA',
  },
  ru: {
    badge: 'ПЕРИМЕНОПАУЗА И МЕНОПАУЗА • ГОРМОНЫ',
    title: 'Гормоны\nво время менопаузы',
    metaDuration: '10 мин чтения',
    metaType: 'Статья',
    metaLevel: 'Средний уровень',
    metaValidated: 'Проверенный материал',
    intro: 'По мере приближения менопаузы гормоны не прекращают работу внезапно: их уровень колеблется, чем объясняются и изменения цикла, и разнообразие возможных симптомов.',
    contentsTitle: 'В этой статье',
    topics: [
      'Основные задействованные гормоны',
      'Что происходит в перименопаузе?',
      'Когда уровень эстрогена колеблется',
      'Роль прогестерона',
      'Почему симптомы могут различаться',
      'Наиболее частые симптомы',
      'Гормоны и сон',
      'Гормоны и настроение',
      'Можно ли измерить гормоны?',
      'Как лучше отслеживать изменения',
      'Когда обращаться к специалисту?',
      'Какие решения могут быть предложены?',
      'Главное',
    ],
    section1Body: 'В ходе этого перехода меняются три основных гормона, и у каждого своя роль:',
    keyHormones: [
      {title: 'Эстроген', text: 'Влияет на цикл, кожу, кости, сердце, а также частично регулирует сон и настроение.'},
      {title: 'Прогестерон', text: 'Вырабатывается после овуляции, оказывает скорее успокаивающее действие и готовит организм к возможной беременности.'},
      {title: 'ФСГ и ЛГ', text: 'Управляются мозгом и стимулируют яичники; их уровень меняется, поскольку яичники отвечают по-разному.'},
    ],
    infoCard1Title: 'Важно',
    infoCard1Text: 'В перименопаузе уровень гормонов снижается не строго линейно: он может колебаться, повышаться и понижаться, прежде чем установиться на более низком уровне после менопаузы.',
    section2Body: 'Яичники постепенно всё менее регулярно отвечают на гормональные сигналы, посылаемые мозгом. Именно поэтому циклы становятся нерегулярными, а симптомы могут меняться от месяца к месяцу.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Вполне возможно, что в один месяц симптомы будут заметными, а в следующий — почти отсутствовать. Это не отклонение: так проявляются гормональные колебания этого периода.',
    section3Body: 'Изменения уровня эстрогена могут быть связаны с рядом проявлений:',
    estrogenSymptoms: [
      'Приливы',
      'Ночная потливость',
      'Сухость влагалища',
      'Изменения цикла',
      'Эмоциональная чувствительность',
      'Изменения сна',
    ],
    section3Body2: 'У этих симптомов может быть несколько причин: они не всегда связаны с гормонами, а их выраженность сильно различается у разных женщин.',
    section4Body: 'Прогестерон вырабатывается только после овуляции. Но в перименопаузе сама овуляция становится менее регулярной — поэтому его выработка менее предсказуема.',
    section4Body2: 'Эта нерегулярность отчасти объясняет изменения цикла: переменную длительность, месячные, которые иногда бывают обильнее или скуднее, чем раньше.',
    section5Body: 'Помимо гормональных колебаний, играют роль и другие факторы: качество сна, уровень стресса, образ жизни и индивидуальные особенности каждой женщины.',
    highlightText: '«Каждая женщина переживает этот переход по-своему».',
    commonSymptoms: [
      'Нерегулярный цикл',
      'Приливы',
      'Ночная потливость',
      'Проблемы со сном',
      'Перепады настроения',
      'Усталость',
      'Сухость влагалища',
      'Изменения либидо',
      'Трудности с концентрацией',
    ],
    section6Caption: 'Этот список носит информационный характер и не является диагнозом. Каждая женщина сталкивается со своим сочетанием этих изменений.',
    section7Body: 'Ночная потливость может прерывать сон, из-за чего на следующий день появляются усталость и трудности с концентрацией — это обычное явление в этот период.',
    infoCard2Title: 'Практический совет',
    infoCard2Text: 'Прохладная спальня, лёгкая одежда и стабильный ритуал отхода ко сну могут помочь реже просыпаться по ночам.',
    section8Body: 'Гормональные колебания могут совпадать с изменениями настроения, но не всегда являются единственным объяснением: свою роль играют также сон, стресс, жизненные перемены и физические симптомы.',
    infoCard3Title: 'Чтобы вас успокоить',
    infoCard3Text: 'Если в этот период вы становитесь эмоциональнее, это не значит, что что-то не так: это распространённый опыт, у которого может быть сразу несколько причин.',
    section9Body: 'В перименопаузе уровень гормонов может значительно меняться изо дня в день. Поэтому один анализ не всегда даёт полную картину.',
    infoCard4Title: 'Стоит помнить',
    infoCard4Text: 'Медицинская оценка опирается в основном на ваш возраст, симптомы и историю цикла, а не на одно-единственное значение.',
    section10Body: 'Если из месяца в месяц записывать то, что вы чувствуете, проще заметить собственные закономерности, а не сравнивать себя с другими:',
    trackingItems: [
      'Даты вашего цикла',
      'Ваши симптомы изо дня в день',
      'Ваш сон',
      'Ваше настроение',
      'Ваши приливы',
      'Изменения в выделениях',
      'Что, по-видимому, провоцирует те или иные симптомы',
    ],
    tip2Title: 'Полезная привычка',
    tip2Text: 'Отслеживание цикла в AWA поможет заметить собственные закономерности в течение месяцев — без лишних усилий.',
    section11Body: 'В большинстве таких ситуаций достаточно обычной консультации, в удобное для вас время:',
    warningTitle: 'О чём стоит рассказать специалисту',
    consultSituations: [
      'Симптомы, которые заметно влияют на повседневную жизнь',
      'Стойкие проблемы со сном',
      'Очень беспокоящие приливы',
      'Новый или необычный симптом',
      'Значительные изменения в кровотечениях',
      'Вопросы о вариантах лечения',
      'Беспокойство, связанное с сухостью влагалища или интимной жизнью',
    ],
    infoCard5Title: 'Особый случай',
    infoCard5Text: 'Об очень обильных или необычных кровотечениях, напротив, следует сообщить медицинскому специалисту как можно скорее.',
    section12Body: 'В зависимости от ситуации специалист может предложить разные варианты:',
    solutions: [
      {title: 'Изменение образа жизни', text: 'Физическая активность, питание, а также управление стрессом и сном.'},
      {title: 'Негормональные средства', text: 'Некоторые варианты могут быть направлены на отдельные симптомы — в зависимости от ситуации.'},
      {title: 'Гормональные средства', text: 'Обсуждаются с врачом, когда подходят вашему профилю и потребностям.'},
    ],
    section12Caption: 'Эти решения остаются индивидуальными: они зависят от вашей истории, симптомов, рисков и личных предпочтений.',
    summaryPoints: [
      'Гормональные изменения — неотъемлемая часть перехода к менопаузе.',
      'В перименопаузе уровень гормонов может заметно колебаться, а снижение — не быть строго линейным.',
      'Симптомы сильно различаются у разных женщин и от месяца к месяцу.',
      'Отслеживание симптомов поможет лучше заметить собственные закономерности.',
      'Медицинский специалист может поддержать вас, если с симптомами становится трудно справляться.',
    ],
    disclaimerText: 'Информационный материал. Эта статья не заменяет персональную медицинскую консультацию. При сомнениях обратитесь за консультацией к медицинскому специалисту.',
    shareMessage: 'Гормоны во время менопаузы — AWA',
  },
  de: {
    badge: 'PERIMENOPAUSE & MENOPAUSE • HORMONE',
    title: 'Hormone\nin den Wechseljahren',
    metaDuration: '10 Min. Lesezeit',
    metaType: 'Artikel',
    metaLevel: 'Fortgeschritten',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Wenn die Menopause näher rückt, enden deine Hormone nicht abrupt: Sie schwanken. Das erklärt sowohl die Veränderungen im Zyklus als auch die Vielfalt möglicher Symptome.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Die wichtigsten beteiligten Hormone',
      'Was passiert in der Perimenopause?',
      'Wenn das Östrogen schwankt',
      'Die Rolle des Progesterons',
      'Warum Symptome unterschiedlich sein können',
      'Die häufigsten Symptome',
      'Hormone und Schlaf',
      'Hormone und Stimmung',
      'Lassen sich Hormone messen?',
      'Wie du die Veränderungen besser verfolgst',
      'Wann solltest du zu einer Fachperson gehen?',
      'Welche Lösungen können vorgeschlagen werden?',
      'Das Wichtigste in Kürze',
    ],
    section1Body: 'Drei wichtige Hormone verändern sich in dieser Übergangszeit, jedes mit einer eigenen Rolle:',
    keyHormones: [
      {title: 'Östrogen', text: 'Beeinflusst den Zyklus, die Haut, die Knochen und das Herz und wirkt teilweise auch auf Schlaf und Stimmung.'},
      {title: 'Progesteron', text: 'Es wird nach dem Eisprung gebildet, wirkt eher beruhigend und bereitet den Körper auf eine mögliche Schwangerschaft vor.'},
      {title: 'FSH und LH', text: 'Sie werden vom Gehirn gesteuert und regen die Eierstöcke an; ihre Werte verändern sich, weil die Eierstöcke unterschiedlich reagieren.'},
    ],
    infoCard1Title: 'Wichtig zu beachten',
    infoCard1Text: 'Die Hormonspiegel sinken in der Perimenopause nicht gleichmäßig ab: Sie können schwanken, steigen und fallen, bevor sie sich nach der Menopause auf einem niedrigeren Niveau einpendeln.',
    section2Body: 'Die Eierstöcke reagieren nach und nach unregelmäßiger auf die hormonellen Signale des Gehirns. Dadurch werden Zyklen unregelmäßig, und die Symptome können sich von Monat zu Monat ändern.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Es ist völlig möglich, in einem Monat deutliche Symptome zu haben und im nächsten kaum welche. Das ist nicht ungewöhnlich: Es spiegelt einfach die hormonellen Schwankungen dieser Zeit wider.',
    section3Body: 'Veränderungen des Östrogenspiegels können mit mehreren Veränderungen zusammenhängen:',
    estrogenSymptoms: [
      'Hitzewallungen',
      'Nächtliche Schweißausbrüche',
      'Scheidentrockenheit',
      'Veränderungen des Zyklus',
      'Emotionale Empfindlichkeit',
      'Veränderungen des Schlafs',
    ],
    section3Body2: 'Diese Symptome können mehrere Ursachen haben: Sie hängen nicht immer mit den Hormonen zusammen, und ihre Stärke ist von Frau zu Frau sehr unterschiedlich.',
    section4Body: 'Progesteron wird erst nach dem Eisprung gebildet. In der Perimenopause wird aber auch der Eisprung selbst unregelmäßiger – dadurch ist die Produktion schwerer vorherzusagen.',
    section4Body2: 'Diese Unregelmäßigkeit erklärt zum Teil die Veränderungen im Zyklus: wechselnde Zykluslänge, Blutungen, die manchmal stärker oder schwächer sind als früher.',
    section5Body: 'Neben den hormonellen Schwankungen spielen noch weitere Faktoren eine Rolle: Schlafqualität, Stress, Lebensstil und individuelle Unterschiede.',
    highlightText: '„Jede Frau erlebt den Übergang anders.“',
    commonSymptoms: [
      'Unregelmäßige Zyklen',
      'Hitzewallungen',
      'Nächtliche Schweißausbrüche',
      'Schlafprobleme',
      'Stimmungsschwankungen',
      'Müdigkeit',
      'Scheidentrockenheit',
      'Veränderungen der Libido',
      'Konzentrationsschwierigkeiten',
    ],
    section6Caption: 'Diese Liste dient nur zur Information: Sie ist keine Diagnose. Jede Person erlebt eine andere Kombination dieser Veränderungen.',
    section7Body: 'Nächtliche Schweißausbrüche können den Schlaf unterbrechen und am nächsten Tag zu Müdigkeit und Konzentrationsschwierigkeiten führen – ein Muster, das in dieser Zeit häufig ist.',
    infoCard2Title: 'Praktischer Tipp',
    infoCard2Text: 'Ein kühles Schlafzimmer, leichte Kleidung und eine feste Abendroutine können helfen, nächtliches Aufwachen zu begrenzen.',
    section8Body: 'Hormonelle Schwankungen können mit Stimmungsveränderungen zusammenfallen, ohne die einzige Erklärung zu sein: Auch Schlaf, Stress, Lebensveränderungen und körperliche Symptome spielen eine Rolle.',
    infoCard3Title: 'Zur Beruhigung',
    infoCard3Text: 'Wenn du in dieser Zeit emotionaler bist, bedeutet das nicht, dass etwas nicht stimmt: Es ist eine häufige Erfahrung, die mehrere Ursachen gleichzeitig haben kann.',
    section9Body: 'Die Hormonspiegel können in der Perimenopause von einem Tag zum anderen stark schwanken. Eine einzelne Untersuchung liefert deshalb nicht immer ein vollständiges Bild der Situation.',
    infoCard4Title: 'Gut im Hinterkopf zu behalten',
    infoCard4Text: 'Die ärztliche Einschätzung hängt vor allem von deinem Alter, deinen Symptomen und deiner Zyklusgeschichte ab – nicht nur von einem einzelnen Wert.',
    section10Body: 'Wenn du Monat für Monat aufschreibst, was du erlebst, erkennst du deine eigenen Muster, statt dich mit anderen zu vergleichen:',
    trackingItems: [
      'Die Daten deines Zyklus',
      'Deine Symptome Tag für Tag',
      'Deinen Schlaf',
      'Deine Stimmung',
      'Deine Hitzewallungen',
      'Veränderungen deiner Blutung',
      'Was bestimmte Symptome auszulösen scheint',
    ],
    tip2Title: 'Eine hilfreiche Gewohnheit',
    tip2Text: 'Wenn du deinen Zyklus in AWA verfolgst, erkennst du deine eigenen Muster über die Monate hinweg – ganz ohne Mehraufwand.',
    section11Body: 'In den meisten dieser Situationen reicht ein Routinetermin, in deinem eigenen Tempo:',
    warningTitle: 'Gut, mit einer Fachperson zu besprechen',
    consultSituations: [
      'Symptome, die deinen Alltag deutlich beeinträchtigen',
      'Anhaltende Schlafprobleme',
      'Sehr belastende Hitzewallungen',
      'Ein neues oder ungewöhnliches Symptom',
      'Deutliche Veränderungen deiner Blutung',
      'Fragen zu Behandlungsmöglichkeiten',
      'Beschwerden im Zusammenhang mit Scheidentrockenheit oder deinem Sexualleben',
    ],
    infoCard5Title: 'Ein Sonderfall',
    infoCard5Text: 'Sehr starke oder ungewöhnliche Blutungen solltest du dagegen schneller medizinischem Fachpersonal melden.',
    section12Body: 'Je nach Situation kann eine Fachperson unterschiedliche Möglichkeiten vorschlagen:',
    solutions: [
      {title: 'Maßnahmen im Lebensstil', text: 'Bewegung, Ernährung sowie der Umgang mit Stress und Schlaf.'},
      {title: 'Nicht-hormonelle Behandlungen', text: 'Manche Optionen können je nach Situation gezielt bestimmte Symptome lindern.'},
      {title: 'Hormonelle Behandlungen', text: 'Sie werden mit einer Ärztin oder einem Arzt besprochen, wenn sie zu deinem Profil und deinen Bedürfnissen passen.'},
    ],
    section12Caption: 'Diese Entscheidungen bleiben individuell: Sie hängen von deiner Vorgeschichte, deinen Symptomen, den Risiken und deinen persönlichen Vorlieben ab.',
    summaryPoints: [
      'Hormonelle Veränderungen gehören fest zum Übergang in die Menopause.',
      'Die Hormonspiegel können in der Perimenopause stark schwanken, ohne gleichmäßig abzusinken.',
      'Die Symptome sind von Frau zu Frau und von Monat zu Monat sehr unterschiedlich.',
      'Wenn du deine Symptome verfolgst, erkennst du deine eigenen Muster besser.',
      'Medizinisches Fachpersonal kann dich unterstützen, wenn Symptome schwer zu bewältigen werden.',
    ],
    disclaimerText: 'Informationsinhalt. Dieser Artikel ersetzt keine persönliche ärztliche Beratung. Bei Zweifeln wende dich an medizinisches Fachpersonal.',
    shareMessage: 'Hormone in den Wechseljahren – AWA',
  },
  zh: {
      badge: '围绝经期与绝经 • 激素',
      title: '绝经期间的\n激素变化',
      metaDuration: '阅读约 10 分钟',
      metaType: '文章',
      metaLevel: '进阶',
      metaValidated: '已审阅内容',
      intro: '绝经临近时，你的激素并不会突然停止分泌，而是起伏波动，这既解释了周期的变化，也解释了为什么可能出现各种不同的症状。',
      contentsTitle: '本文内容',
      topics: [
        '涉及的主要激素',
        '围绝经期会发生什么？',
        '雌激素波动时',
        '孕激素的作用',
        '为什么症状会因人而异',
        '最常见的症状',
        '激素与睡眠',
        '激素与情绪',
        '激素可以检测吗？',
        '如何更好地记录这些变化',
        '什么时候该看专业人员？',
        '可能会建议哪些方案？',
        '要点回顾',
      ],
      section1Body: '在这一过渡阶段，有三种主要激素会发生变化，各自的作用不同：',
      keyHormones: [
        {
          title: '雌激素',
          text: '影响月经周期、皮肤、骨骼和心脏，也在一定程度上调节睡眠和情绪。',
        },
        {
          title: '孕激素',
          text: '排卵后产生，作用偏向安抚，并为可能的怀孕做好身体准备。',
        },
        {
          title: 'FSH 和 LH',
          text: '由大脑控制，刺激卵巢；由于卵巢的反应不再一致，它们的水平也会随之变化。',
        },
      ],
      infoCard1Title: '值得注意',
      infoCard1Text: '围绝经期的激素水平并不是呈完全线性的下降：它们可能忽高忽低，直到绝经后才稳定在较低的水平。',
      section2Body: '卵巢对大脑发出的激素信号，反应会逐渐变得不那么规律。这正是周期变得不规则的原因，也解释了症状为什么会随月份而变化。',
      tip1Title: '小贴士',
      tip1Text: '某个月症状明显，下个月几乎没有，这是完全可能的。这并不异常，只是反映了这一时期激素的起伏波动。',
      section3Body: '雌激素的变化可能与以下几种改变有关：',
      estrogenSymptoms: [
        '潮热',
        '夜间盗汗',
        '阴道干涩',
        '周期变化',
        '情绪敏感',
        '睡眠变化',
      ],
      section3Body2: '这些症状可能有多种原因：它们并不总是与激素有关，而且程度因人而异，差别很大。',
      section4Body: '孕激素只有在排卵之后才会产生。而在围绝经期，排卵本身也变得更不规律，这使得孕激素的分泌更难预测。',
      section4Body2: '这种不规律在一定程度上解释了周期的变化：周期长短不一，月经有时比以前更多或更少。',
      section5Body: '除了激素波动之外，还有其他几个因素也会起作用：睡眠质量、压力水平、生活方式，以及每个人自身的差异。',
      highlightText: '“每个女性经历这一过渡的方式都不一样。”',
      commonSymptoms: [
        '月经不规律',
        '潮热',
        '夜间盗汗',
        '睡眠问题',
        '情绪变化',
        '疲倦',
        '阴道干涩',
        '性欲变化',
        '注意力难以集中',
      ],
      section6Caption: '此列表仅供参考，并非诊断。每个人经历的这些变化组合各不相同。',
      section7Body: '夜间盗汗可能打断睡眠，导致第二天疲倦、难以集中注意力，这在这一时期很常见。',
      infoCard2Title: '实用建议',
      infoCard2Text: '凉爽的卧室、轻薄的衣物和固定的睡前习惯，有助于减少夜间醒来。',
      section8Body: '激素波动可能与情绪变化同时出现，但并不是唯一的原因：睡眠、压力、生活中的变动和身体症状也都有影响。',
      infoCard3Title: '让你安心',
      infoCard3Text: '这段时间情绪起伏更明显，并不意味着哪里出了问题：这是一种常见的体验，可能同时由多种原因造成。',
      section9Body: '在围绝经期，激素水平可能每天都有很大变化。因此，单次检测并不总能完整反映你的实际情况。',
      infoCard4Title: '请记住',
      infoCard4Text: '医学评估主要取决于你的年龄、症状和月经周期史，而不仅仅是某一个数值。',
      section10Body: '每个月记录自己的感受，有助于你发现属于自己的规律，而不是与别人比较：',
      trackingItems: [
        '你的月经周期日期',
        '你每天的症状',
        '你的睡眠',
        '你的情绪',
        '你的潮热',
        '出血情况的变化',
        '似乎会诱发某些症状的因素',
      ],
      tip2Title: '一个好习惯',
      tip2Text: '在 AWA 中记录你的周期，可以帮助你在几个月的时间里发现自己的规律，几乎不费力气。',
      section11Body: '大多数这类情况只需常规就诊，按你自己的节奏安排即可：',
      warningTitle: '值得告诉专业人员的情况',
      consultSituations: [
        '症状明显影响日常生活',
        '持续的睡眠问题',
        '非常困扰的潮热',
        '新出现的或不寻常的症状',
        '出血情况有明显变化',
        '想了解治疗方案',
        '与阴道干涩或性生活有关的困扰',
      ],
      infoCard5Title: '特殊情况',
      infoCard5Text: '相反，出血量非常大或不寻常的出血，则应更尽快地告知医疗专业人员。',
      section12Body: '根据具体情况，专业人员可能会提出不同的方案：',
      solutions: [
        {
          title: '生活方式调整',
          text: '体育活动、饮食，以及管理压力和睡眠。',
        },
        {
          title: '非激素类治疗',
          text: '某些方案可以针对特定症状，视具体情况而定。',
        },
        {
          title: '激素类治疗',
          text: '当符合你的情况和需求时，与医生商讨后决定。',
        },
      ],
      section12Caption: '这些决定因人而异：取决于你的病史、症状、风险以及个人意愿。',
      summaryPoints: [
        '激素变化是绝经过渡的一部分。',
        '围绝经期的激素水平可能大幅波动，并非完全线性下降。',
        '症状因人而异，也会随月份而变化。',
        '记录症状可以帮助你更好地发现自己的规律。',
        '如果症状难以应对，医疗专业人员可以为你提供支持。',
      ],
      disclaimerText: '仅供参考。本文不能替代个性化的医生建议。如有疑虑，请咨询医疗专业人员。',
      shareMessage: '绝经期间的激素变化 — AWA',
    },
} as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function MenopauseHormonesArticleScreen({
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: content.shareMessage,
      });
    } catch {
      // Partage annulé ou indisponible.
    }
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
        {/* ==================================================================== */}
        {/* HERO                                                                 */}
        {/* ==================================================================== */}

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
              hitSlop={8}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [styles.circle, pressed && styles.pressed]}>
              <MaterialDesignIcons name="chevron-left" size={23} color={theme.colors.text} />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  saved ? t('library.screen.removeBookmark') : t('library.screen.addBookmark')
                }
                hitSlop={8}
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
                hitSlop={8}
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

        {/* ==================================================================== */}
        {/* ARTICLE                                                             */}
        {/* ==================================================================== */}

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

          {/* -------------------------------------------------------------- */}
          {/* CONTENTS                                                        */}
          {/* -------------------------------------------------------------- */}

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

          {/* ================================================================= */}
          {/* SECTION 1                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>1. {content.topics[0]}</Text>

          <Text style={styles.body}>
            {content.section1Body}
          </Text>

          <View style={styles.normalGrid}>
            {content.keyHormones.map((item, index) => (
              <View key={item.title} style={styles.normalCard}>
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={KEY_HORMONES_ICONS[index] as never}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.normalTitle}>{item.title}</Text>
                <Text style={styles.normalText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{content.infoCard1Title}</Text>
              <Text style={styles.infoText}>
                {content.infoCard1Text}
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            2. {content.topics[1]}
          </Text>

          <Text style={styles.body}>
            {content.section2Body}
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

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>
            {content.section3Body}
          </Text>

          <View style={styles.checkList}>
            {content.estrogenSymptoms.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="checkbox-blank-circle-outline"
                  size={14}
                  color={theme.colors.primary}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.body}>
            {content.section3Body2}
          </Text>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <Text style={styles.body}>
            {content.section4Body}
          </Text>

          <Text style={styles.body}>
            {content.section4Body2}
          </Text>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>5. {content.topics[4]}</Text>

          <Text style={styles.body}>
            {content.section5Body}
          </Text>

          <View style={styles.highlight}>
            <Text style={styles.highlightText}>
              {content.highlightText}
            </Text>
          </View>

          {/* ================================================================= */}
          {/* SECTION 6                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>6. {content.topics[5]}</Text>

          <View style={styles.checkList}>
            {content.commonSymptoms.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="checkbox-blank-circle-outline"
                  size={14}
                  color={theme.colors.primary}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.caption}>
            {content.section6Caption}
          </Text>

          {/* ================================================================= */}
          {/* SECTION 7                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>7. {content.topics[6]}</Text>

          <Text style={styles.body}>
            {content.section7Body}
          </Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="weather-night"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{content.infoCard2Title}</Text>
              <Text style={styles.infoText}>
                {content.infoCard2Text}
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 8                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>8. {content.topics[7]}</Text>

          <Text style={styles.body}>
            {content.section8Body}
          </Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="heart-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{content.infoCard3Title}</Text>
              <Text style={styles.infoText}>
                {content.infoCard3Text}
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 9                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>9. {content.topics[8]}</Text>

          <Text style={styles.body}>
            {content.section9Body}
          </Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="test-tube"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{content.infoCard4Title}</Text>
              <Text style={styles.infoText}>
                {content.infoCard4Text}
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 10                                                        */}
          {/* ================================================================= */}

          <Text style={styles.h2}>10. {content.topics[9]}</Text>

          <Text style={styles.body}>
            {content.section10Body}
          </Text>

          <View style={styles.comfortCard}>
            {content.trackingItems.map((item, index) => (
              <View
                key={item}
                style={[
                  styles.trackingRow,
                  index < content.trackingItems.length - 1 &&
                    styles.comfortRowBorder,
                ]}>
                <MaterialDesignIcons
                  name="pencil-outline"
                  size={16}
                  color={theme.colors.primary}
                />

                <Text style={styles.trackingText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
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

          {/* ================================================================= */}
          {/* SECTION 11                                                        */}
          {/* ================================================================= */}

          <Text style={styles.h2}>11. {content.topics[10]}</Text>

          <Text style={styles.body}>
            {content.section11Body}
          </Text>

          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <MaterialDesignIcons
                name="calendar-account-outline"
                size={22}
                color={theme.colors.primary}
              />

              <Text style={[styles.warningTitle, styles.warningTitleNeutral]}>
                {content.warningTitle}
              </Text>
            </View>

            {content.consultSituations.map(item => (
              <View key={item} style={styles.warningRow}>
                <View style={styles.warningBullet}>
                  <MaterialDesignIcons
                    name="check"
                    size={16}
                    color={theme.colors.success}
                  />
                </View>

                <Text style={styles.warningText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={23}
              color={theme.colors.warning}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{content.infoCard5Title}</Text>
              <Text style={styles.infoText}>
                {content.infoCard5Text}
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 12                                                        */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            12. {content.topics[11]}
          </Text>

          <Text style={styles.body}>
            {content.section12Body}
          </Text>

          <View style={styles.normalGrid}>
            {content.solutions.map((item, index) => (
              <View key={item.title} style={styles.normalCard}>
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={SOLUTIONS_ICONS[index] as never}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.normalTitle}>{item.title}</Text>
                <Text style={styles.normalText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.caption}>
            {content.section12Caption}
          </Text>

          {/* ================================================================= */}
          {/* SUMMARY                                                           */}
          {/* ================================================================= */}

          <Text style={styles.h2}>13. {content.topics[12]}</Text>

          <View style={styles.summaryCard}>
            {content.summaryPoints.map(item => (
              <View key={item} style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.summaryText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* DISCLAIMER                                                        */}
          {/* ================================================================= */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={18}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>
              {content.disclaimerText}
            </Text>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={10} scrollRef={scrollRef} />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {flex: 1, backgroundColor: theme.colors.background},
  scroll: {paddingBottom: 30},

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
  pressed: {opacity: 0.74},

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
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 27,
    lineHeight: 32,
    color: theme.colors.text,
    fontWeight: '700',
  },

  metas: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  metaDivider: {width: 1, height: 20, backgroundColor: theme.colors.border},
  meta: {fontSize: 9.5, color: theme.colors.textMuted},

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },

  contents: {
    marginTop: 20,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  contentsTitle: {marginBottom: 7, fontSize: 15, color: theme.colors.text, fontWeight: '800'},
  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentLeft: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  contentNumber: {width: 25, color: theme.colors.primary, fontSize: 11.5, fontWeight: '800'},
  contentText: {flex: 1, fontSize: 12.3, lineHeight: 17, color: theme.colors.text},

  h2: {
    marginTop: 27,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },
  body: {marginTop: 9, fontSize: 14, lineHeight: 21.5, color: theme.colors.textSecondary},
  caption: {marginTop: 10, fontSize: 11, lineHeight: 16, color: theme.colors.textMuted, fontStyle: 'italic'},

  infoCard: {
    marginTop: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoCopy: {flex: 1, marginLeft: 9},
  infoTitle: {fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  infoText: {marginTop: 3, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},

  normalGrid: {marginTop: 13, gap: 9},
  normalCard: {
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  normalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  normalTitle: {marginTop: 8, fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  normalText: {marginTop: 4, fontSize: 11, lineHeight: 16, color: theme.colors.textSecondary},

  checkList: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkRow: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 6,
    paddingRight: 6,
  },
  checkText: {flex: 1, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 16},

  highlight: {
    marginTop: 15,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 15,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  highlightText: {
    fontFamily: 'serif',
    fontSize: 16,
    lineHeight: 23,
    color: theme.colors.text,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  comfortCard: {
    marginTop: 13,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  comfortRowBorder: {borderBottomWidth: 1, borderBottomColor: theme.colors.border},
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 12,
  },
  trackingText: {flex: 1, fontSize: 12.5, lineHeight: 17, color: theme.colors.textSecondary},

  warningCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  warningHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  warningTitle: {flex: 1, marginLeft: 8, fontSize: 12.5, color: theme.colors.textSecondary, fontWeight: '800'},
  warningTitleNeutral: {color: theme.colors.text},
  warningRow: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 9},
  warningBullet: {width: 20, alignItems: 'flex-start'},
  warningText: {flex: 1, marginLeft: 5, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 17},

  tip: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: theme.colors.text, fontWeight: '800'},
  tipText: {marginTop: 4, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},

  summaryCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10},
  summaryText: {flex: 1, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},

  disclaimer: {
    marginTop: 18,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  disclaimerText: {flex: 1, fontSize: 10, lineHeight: 15, color: theme.colors.textMuted},
  });
}
