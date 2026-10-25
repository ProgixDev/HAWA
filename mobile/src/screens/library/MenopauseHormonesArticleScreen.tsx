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
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

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
const CONTENT = withBrazilianPortuguese('MenopauseHormones', {
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
  id: {
    badge: 'PERIMENOPAUSE & MENOPAUSE • HORMON',
    title: 'Hormon\nselama menopause',
    metaDuration: '10 menit baca',
    metaType: 'Artikel',
    metaLevel: 'Menengah',
    metaValidated: 'Konten yang telah ditinjau',
    intro: 'Menjelang menopause, hormonmu tidak berhenti secara tiba-tiba: hormon berfluktuasi, dan inilah yang menjelaskan perubahan siklus sekaligus beragamnya gejala yang mungkin muncul.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Hormon-hormon utama yang terlibat',
      'Apa yang terjadi selama perimenopause?',
      'Ketika estrogen berfluktuasi',
      'Peran progesteron',
      'Mengapa gejala bisa berbeda-beda',
      'Gejala yang paling umum',
      'Hormon dan tidur',
      'Hormon dan suasana hati',
      'Apakah hormon bisa diukur?',
      'Cara memantau perubahan dengan lebih baik',
      'Kapan harus ke tenaga profesional?',
      'Solusi apa yang mungkin disarankan?',
      'Poin-poin penting',
    ],
    section1Body: 'Tiga hormon utama berubah selama masa transisi ini, masing-masing dengan peran yang berbeda:',
    keyHormones: [
      {
        title: 'Estrogen',
        text: 'Memengaruhi siklus, kulit, tulang, jantung, dan ikut mengatur tidur serta suasana hati.',
      },
      {
        title: 'Progesteron',
        text: 'Diproduksi setelah ovulasi, hormon ini memiliki efek yang cukup menenangkan dan menyiapkan tubuh untuk kemungkinan kehamilan.',
      },
      {
        title: 'FSH dan LH',
        text: 'Dikendalikan oleh otak, keduanya merangsang ovarium; kadarnya berubah karena ovarium merespons secara berbeda.',
      },
    ],
    infoCard1Title: 'Perlu dicatat',
    infoCard1Text: 'Kadar hormon tidak menurun secara lurus sempurna selama perimenopause: kadarnya bisa berfluktuasi, naik dan turun, sebelum menetap pada tingkat yang lebih rendah setelah menopause.',
    section2Body: 'Ovarium secara bertahap merespons sinyal hormonal dari otak dengan kurang teratur. Inilah yang membuat siklus menjadi tidak teratur dan menjelaskan mengapa gejala bisa berubah dari bulan ke bulan.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Sangat mungkin kamu mengalami gejala yang jelas pada satu bulan, lalu hampir tidak ada pada bulan berikutnya. Ini tidak abnormal: hal ini hanya mencerminkan fluktuasi hormon pada masa ini.',
    section3Body: 'Perubahan estrogen dapat dikaitkan dengan beberapa perubahan:',
    estrogenSymptoms: [
      'Hot flash',
      'Keringat malam',
      'Kekeringan vagina',
      'Perubahan siklus',
      'Perasaan lebih sensitif secara emosional',
      'Perubahan pola tidur',
    ],
    section3Body2: 'Gejala-gejala ini bisa memiliki beberapa penyebab: tidak selalu berkaitan dengan hormon, dan intensitasnya sangat bervariasi dari satu orang ke orang lain.',
    section4Body: 'Progesteron hanya diproduksi setelah ovulasi. Namun selama perimenopause, ovulasi itu sendiri menjadi lebih tidak teratur — sehingga produksinya menjadi kurang dapat diprediksi.',
    section4Body2: 'Ketidakteraturan ini sebagian menjelaskan perubahan yang terlihat pada siklus: panjang yang bervariasi, haid yang terkadang lebih deras atau lebih ringan dari sebelumnya.',
    section5Body: 'Selain fluktuasi hormon, beberapa faktor lain ikut berperan: kualitas tidur, tingkat stres, gaya hidup, dan perbedaan khas pada setiap orang.',
    highlightText: '"Setiap wanita mengalami masa transisi ini dengan cara yang berbeda."',
    commonSymptoms: [
      'Siklus tidak teratur',
      'Hot flash',
      'Keringat malam',
      'Masalah tidur',
      'Perubahan suasana hati',
      'Kelelahan',
      'Kekeringan vagina',
      'Perubahan gairah seksual',
      'Sulit berkonsentrasi',
    ],
    section6Caption: 'Daftar ini hanya untuk informasi: bukan diagnosis. Setiap orang mengalami kombinasi perubahan yang berbeda.',
    section7Body: 'Keringat malam dapat mengganggu tidur, sehingga menyebabkan kelelahan dan sulit berkonsentrasi keesokan harinya — pola yang umum terjadi pada masa ini.',
    infoCard2Title: 'Tips praktis',
    infoCard2Text: 'Kamar tidur yang sejuk, pakaian yang ringan, dan rutinitas tidur yang stabil dapat membantu membatasi terbangun di malam hari.',
    section8Body: 'Fluktuasi hormon bisa bersamaan dengan perubahan suasana hati, tanpa menjadi satu-satunya penjelasan: tidur, stres, perubahan dalam hidup, dan gejala fisik juga berperan.',
    infoCard3Title: 'Agar kamu tenang',
    infoCard3Text: 'Merasa lebih emosional pada masa ini tidak berarti ada yang salah: ini pengalaman yang umum dan bisa memiliki beberapa penyebab sekaligus.',
    section9Body: 'Kadar hormon dapat sangat bervariasi dari satu hari ke hari berikutnya selama perimenopause. Karena itu, satu kali pemeriksaan tidak selalu memberikan gambaran yang lengkap tentang kondisimu.',
    infoCard4Title: 'Perlu diingat',
    infoCard4Text: 'Penilaian medis terutama bergantung pada usiamu, gejalamu, dan riwayat siklusmu — bukan hanya satu angka.',
    section10Body: 'Menuliskan apa yang kamu alami dari bulan ke bulan membantumu mengenali pola dirimu sendiri, bukan membandingkan diri dengan orang lain:',
    trackingItems: [
      'Tanggal siklusmu',
      'Gejalamu dari hari ke hari',
      'Tidurmu',
      'Suasana hatimu',
      'Hot flash-mu',
      'Perubahan pada perdarahanmu',
      'Apa yang tampaknya memicu gejala tertentu',
    ],
    tip2Title: 'Kebiasaan yang membantu',
    tip2Text: 'Mencatat siklusmu di AWA dapat membantumu mengenali pola dirimu sendiri dari bulan ke bulan, tanpa usaha tambahan.',
    section11Body: 'Sebagian besar situasi ini cukup ditangani dengan konsultasi rutin, sesuai waktu yang kamu inginkan:',
    warningTitle: 'Layak disampaikan kepada tenaga profesional',
    consultSituations: [
      'Gejala yang memengaruhi kehidupan sehari-harimu secara signifikan',
      'Masalah tidur yang menetap',
      'Hot flash yang sangat mengganggu',
      'Gejala baru atau tidak biasa',
      'Perubahan perdarahan yang signifikan',
      'Pertanyaan tentang pilihan pengobatan',
      'Kekhawatiran terkait kekeringan vagina atau kehidupan seksualmu',
    ],
    infoCard5Title: 'Kasus khusus',
    infoCard5Text: 'Sebaliknya, perdarahan yang sangat deras atau tidak biasa sebaiknya segera dilaporkan kepada tenaga kesehatan.',
    section12Body: 'Tergantung situasinya, tenaga profesional mungkin menyarankan berbagai pilihan:',
    solutions: [
      {
        title: 'Langkah gaya hidup',
        text: 'Aktivitas fisik, pola makan, serta pengelolaan stres dan tidur.',
      },
      {
        title: 'Pengobatan nonhormonal',
        text: 'Beberapa pilihan dapat menargetkan gejala tertentu, tergantung situasinya.',
      },
      {
        title: 'Pengobatan hormonal',
        text: 'Dibahas bersama dokter bila sesuai dengan profil dan kebutuhanmu.',
      },
    ],
    section12Caption: 'Keputusan ini tetap bersifat individual: bergantung pada riwayatmu, gejalamu, risikonya, dan preferensi pribadimu.',
    summaryPoints: [
      'Perubahan hormon adalah bagian yang tidak terpisahkan dari masa transisi menopause.',
      'Kadar hormon dapat berfluktuasi signifikan selama perimenopause, tanpa penurunan yang lurus sempurna.',
      'Gejala sangat bervariasi dari satu orang ke orang lain, dan dari bulan ke bulan.',
      'Mencatat gejalamu dapat membantumu mengenali pola dirimu sendiri dengan lebih baik.',
      'Tenaga kesehatan dapat mendampingimu jika gejala menjadi sulit dikelola.',
    ],
    disclaimerText: 'Konten informasi. Artikel ini tidak menggantikan saran medis yang dipersonalisasi. Jika ragu, mintalah arahan dari tenaga kesehatan.',
    shareMessage: 'Hormon selama menopause — AWA',
  },
  hi: {
    badge: 'पेरिमेनोपॉज़ और मेनोपॉज़ • हार्मोन',
    title: 'मेनोपॉज़ के दौरान\nहार्मोन',
    metaDuration: '10 मिनट में पढ़ें',
    metaType: 'लेख',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'मेनोपॉज़ (रजोनिवृत्ति) नज़दीक आने पर आपके हार्मोन अचानक बंद नहीं होते: वे घटते-बढ़ते रहते हैं। इसी से चक्र में बदलाव और लक्षणों की विविधता समझ में आती है।',
    contentsTitle: 'इस लेख में',
    topics: [
      'शामिल मुख्य हार्मोन',
      'पेरिमेनोपॉज़ में क्या होता है?',
      'जब एस्ट्रोजन घटता-बढ़ता है',
      'प्रोजेस्टेरोन की भूमिका',
      'लक्षण अलग-अलग क्यों होते हैं',
      'सबसे आम लक्षण',
      'हार्मोन और नींद',
      'हार्मोन और मूड',
      'क्या हार्मोन की जाँच हो सकती है?',
      'बदलावों पर बेहतर नज़र कैसे रखें',
      'विशेषज्ञ से कब मिलें?',
      'कौन-से उपाय सुझाए जा सकते हैं?',
      'मुख्य बातें',
    ],
    section1Body: 'इस बदलाव के दौरान तीन प्रमुख हार्मोन बदलते हैं, और हर एक की भूमिका अलग है:',
    keyHormones: [
      {
        title: 'एस्ट्रोजन',
        text: 'चक्र, त्वचा, हड्डियों और हृदय को प्रभावित करता है, और नींद व मूड को कुछ हद तक नियंत्रित करता है।',
      },
      {
        title: 'प्रोजेस्टेरोन',
        text: 'ओव्यूलेशन के बाद बनता है, इसका असर काफ़ी शांत करने वाला होता है और यह शरीर को संभावित गर्भावस्था के लिए तैयार करता है।',
      },
      {
        title: 'FSH और LH',
        text: 'मस्तिष्क इन्हें नियंत्रित करता है और ये अंडाशय को उत्तेजित करते हैं; अंडाशय के अलग तरह से प्रतिक्रिया देने पर इनका स्तर बदलता है।',
      },
    ],
    infoCard1Title: 'ध्यान देने लायक',
    infoCard1Text: 'पेरिमेनोपॉज़ में हार्मोन का स्तर बिल्कुल सीधी रेखा में नहीं घटता: वह घट-बढ़ सकता है, और मेनोपॉज़ के बाद कम स्तर पर स्थिर होता है।',
    section2Body: 'अंडाशय मस्तिष्क से आने वाले हार्मोनल संकेतों पर धीरे-धीरे कम नियमित रूप से प्रतिक्रिया देने लगते हैं। इसी वजह से चक्र अनियमित हो जाते हैं और लक्षण हर महीने बदल सकते हैं।',
    tip1Title: 'जानना अच्छा है',
    tip1Text: 'यह पूरी तरह संभव है कि एक महीने साफ़ लक्षण महसूस हों और अगले महीने लगभग कोई न हो। यह असामान्य नहीं है: यह बस इस दौर के हार्मोनल उतार-चढ़ाव को दिखाता है।',
    section3Body: 'एस्ट्रोजन में बदलाव कई तरह के बदलावों से जुड़ सकते हैं:',
    estrogenSymptoms: [
      'हॉट फ़्लैश (अचानक गर्मी की लहर)',
      'रात में पसीना आना',
      'योनि में सूखापन',
      'चक्र में बदलाव',
      'भावनात्मक संवेदनशीलता',
      'नींद में बदलाव',
    ],
    section3Body2: 'इन लक्षणों के कई कारण हो सकते हैं: ये हमेशा हार्मोन से जुड़े नहीं होते, और इनकी तीव्रता हर व्यक्ति में काफ़ी अलग होती है।',
    section4Body: 'प्रोजेस्टेरोन केवल ओव्यूलेशन के बाद बनता है। लेकिन पेरिमेनोपॉज़ में ओव्यूलेशन ख़ुद ही ज़्यादा अनियमित हो जाता है, जिससे इसका उत्पादन कम अनुमान-योग्य हो जाता है।',
    section4Body2: 'यह अनियमितता चक्र में दिखने वाले बदलावों को कुछ हद तक समझाती है: चक्र की बदलती लंबाई, और पीरियड्स का कभी पहले से ज़्यादा भारी या हल्का होना।',
    section5Body: 'हार्मोनल उतार-चढ़ाव के अलावा कई और बातें भी असर डालती हैं: नींद की गुणवत्ता, तनाव का स्तर, जीवनशैली और हर व्यक्ति की अपनी अलग स्थिति।',
    highlightText: '"हर महिला इस बदलाव को अलग तरह से जीती है।"',
    commonSymptoms: [
      'अनियमित चक्र',
      'हॉट फ़्लैश',
      'रात में पसीना आना',
      'नींद की समस्याएँ',
      'मूड में बदलाव',
      'थकान',
      'योनि में सूखापन',
      'कामेच्छा में बदलाव',
      'ध्यान लगाने में कठिनाई',
    ],
    section6Caption: 'यह सूची केवल जानकारी के लिए है: यह कोई निदान नहीं है। हर व्यक्ति इन बदलावों का अलग-अलग मेल महसूस करता है।',
    section7Body: 'रात में पसीना आने से नींद टूट सकती है, जिससे अगले दिन थकान और ध्यान लगाने में कठिनाई हो सकती है — इस दौर में यह आम बात है।',
    infoCard2Title: 'व्यावहारिक सुझाव',
    infoCard2Text: 'ठंडा बेडरूम, हल्के कपड़े और सोने का एक तय नियम इन बार-बार नींद खुलने को कम करने में मदद कर सकते हैं।',
    section8Body: 'हार्मोनल उतार-चढ़ाव के साथ मूड में बदलाव हो सकते हैं, पर यही अकेला कारण नहीं है: नींद, तनाव, जीवन के बदलाव और शारीरिक लक्षण भी भूमिका निभाते हैं।',
    infoCard3Title: 'आपको तसल्ली देने के लिए',
    infoCard3Text: 'इस दौर में ज़्यादा भावुक महसूस करने का मतलब यह नहीं कि कुछ गड़बड़ है: यह एक आम अनुभव है जिसके एक साथ कई कारण हो सकते हैं।',
    section9Body: 'पेरिमेनोपॉज़ में हार्मोन का स्तर एक दिन से दूसरे दिन काफ़ी बदल सकता है। इसलिए एक अकेली जाँच हमेशा पूरी तस्वीर नहीं दिखाती।',
    infoCard4Title: 'याद रखने लायक',
    infoCard4Text: 'डॉक्टरी आकलन मुख्य रूप से आपकी उम्र, आपके लक्षणों और आपके चक्र के इतिहास पर निर्भर करता है — सिर्फ़ किसी एक संख्या पर नहीं।',
    section10Body: 'महीने-दर-महीने अपने अनुभव लिखने से आप दूसरों से तुलना करने की बजाय अपने ख़ुद के पैटर्न पहचान पाती हैं:',
    trackingItems: [
      'आपके चक्र की तारीख़ें',
      'आपके लक्षण, दिन-ब-दिन',
      'आपकी नींद',
      'आपका मूड',
      'आपके हॉट फ़्लैश',
      'आपके रक्तस्राव में बदलाव',
      'कौन-सी चीज़ कुछ लक्षणों को शुरू करती दिखती है',
    ],
    tip2Title: 'एक मददगार आदत',
    tip2Text: 'AWA में अपने चक्र को ट्रैक करने से, बिना ज़्यादा मेहनत के, महीनों में अपने पैटर्न पहचानने में मदद मिल सकती है।',
    section11Body: 'इनमें से ज़्यादातर स्थितियों में नियमित परामर्श काफ़ी है, जो आप अपनी सुविधा से ले सकती हैं:',
    warningTitle: 'विशेषज्ञ को बताने लायक',
    consultSituations: [
      'ऐसे लक्षण जो आपकी रोज़ की ज़िंदगी को काफ़ी प्रभावित करें',
      'नींद की लगातार समस्याएँ',
      'बहुत परेशान करने वाले हॉट फ़्लैश',
      'कोई नया या असामान्य लक्षण',
      'रक्तस्राव में बड़े बदलाव',
      'इलाज के विकल्पों के बारे में सवाल',
      'योनि के सूखेपन या यौन जीवन से जुड़ी चिंताएँ',
    ],
    infoCard5Title: 'एक ख़ास स्थिति',
    infoCard5Text: 'वहीं बहुत भारी या असामान्य रक्तस्राव के बारे में स्वास्थ्य विशेषज्ञ को जल्दी बताना चाहिए।',
    section12Body: 'स्थिति के अनुसार, कोई विशेषज्ञ अलग-अलग विकल्प सुझा सकता है:',
    solutions: [
      {
        title: 'जीवनशैली के उपाय',
        text: 'शारीरिक गतिविधि, आहार, और तनाव व नींद का ध्यान रखना।',
      },
      {
        title: 'गैर-हार्मोनल इलाज',
        text: 'स्थिति के अनुसार कुछ विकल्प ख़ास लक्षणों पर काम कर सकते हैं।',
      },
      {
        title: 'हार्मोनल इलाज',
        text: 'जब यह आपकी स्थिति और ज़रूरतों के अनुकूल हो, तब डॉक्टर के साथ इस पर चर्चा की जाती है।',
      },
    ],
    section12Caption: 'ये फ़ैसले व्यक्तिगत रहते हैं: ये आपके इतिहास, लक्षणों, जोखिमों और आपकी अपनी पसंद पर निर्भर करते हैं।',
    summaryPoints: [
      'हार्मोनल बदलाव मेनोपॉज़ के बदलाव का अभिन्न हिस्सा हैं।',
      'पेरिमेनोपॉज़ में हार्मोन का स्तर काफ़ी घट-बढ़ सकता है, बिना किसी बिल्कुल सीधी गिरावट के।',
      'लक्षण हर व्यक्ति में और हर महीने काफ़ी अलग हो सकते हैं।',
      'अपने लक्षणों को ट्रैक करने से आप अपने पैटर्न बेहतर पहचान सकती हैं।',
      'अगर लक्षण संभालना मुश्किल हो जाए, तो स्वास्थ्य विशेषज्ञ आपका साथ दे सकता है।',
    ],
    disclaimerText: 'जानकारी के लिए सामग्री। यह लेख व्यक्तिगत डॉक्टरी सलाह का विकल्प नहीं है। संदेह होने पर किसी स्वास्थ्य विशेषज्ञ से मार्गदर्शन लें।',
    shareMessage: 'मेनोपॉज़ के दौरान हार्मोन — AWA',
  },
  sq: {
    badge: 'PERIMENOPAUZA & MENOPAUZA • HORMONET',
    title: 'Hormonet gjatë\nmenopauzës',
    metaDuration: '10 min lexim',
    metaType: 'Artikull',
    metaLevel: 'Mesatar',
    metaValidated: 'Përmbajtje e shqyrtuar',
    intro: 'Kur menopauza po afrohet, hormonet e tua nuk ndalen befas: ato luhaten, dhe kjo shpjegon si ndryshimet e ciklit, ashtu edhe larminë e simptomave të mundshme.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Hormonet kryesore që përfshihen',
      'Çfarë ndodh gjatë perimenopauzës?',
      'Kur luhatet estrogjeni',
      'Roli i progesteronit',
      'Pse simptomat mund të ndryshojnë',
      'Simptomat më të zakonshme',
      'Hormonet dhe gjumi',
      'Hormonet dhe gjendja shpirtërore',
      'A mund të maten hormonet?',
      'Si t’i ndjekësh më mirë ndryshimet',
      'Kur të shkosh te një profesionist?',
      'Çfarë zgjidhjesh mund të propozohen?',
      'Çfarë të mbash mend',
    ],
    section1Body: 'Tri hormone të mëdha ndryshojnë gjatë këtij tranzicioni, secili me një rol të ndryshëm:',
    keyHormones: [
      {
        title: 'Estrogjeni',
        text: 'Ndikon në ciklin, lëkurën, kockat, zemrën, dhe pjesërisht rregullon gjumin dhe gjendjen shpirtërore.',
      },
      {
        title: 'Progesteroni',
        text: 'Prodhohet pas ovulacionit, ka një efekt mjaft qetësues dhe e përgatit trupin për një shtatzëni të mundshme.',
      },
      {
        title: 'FSH dhe LH',
        text: 'Kontrollohen nga truri, stimulojnë vezoret; nivelet e tyre ndryshojnë ndërsa vezoret reagojnë ndryshe.',
      },
    ],
    infoCard1Title: 'Vlen të theksohet',
    infoCard1Text: 'Nivelet e hormoneve nuk bien në mënyrë krejt lineare gjatë perimenopauzës: ato mund të luhaten, të ngrihen e të ulen, përpara se të vendosen në një nivel më të ulët pas menopauzës.',
    section2Body: 'Vezoret gradualisht i përgjigjen më pak rregullisht sinjaleve hormonale që dërgon truri. Kjo i bën ciklet të parregullta dhe shpjegon pse simptomat mund të ndryshojnë nga muaji në muaj.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Është krejt e mundur të kesh simptoma të dukshme një muaj, pastaj pothuajse asnjë muajin tjetër. Kjo nuk është e pazakontë: thjesht pasqyron luhatjet hormonale të këtij kohe.',
    section3Body: 'Ndryshimet në estrogjen mund të lidhen me disa ndryshime:',
    estrogenSymptoms: [
      'Valë të nxehta',
      'Djersitje natën',
      'Thatësi vaginale',
      'Ndryshime në cikël',
      'Ndjeshmëri emocionale',
      'Ndryshime në gjumë',
    ],
    section3Body2: 'Këto simptoma mund të kenë disa shkaqe: nuk lidhen gjithmonë me hormonet dhe intensiteti i tyre ndryshon shumë nga një person te tjetri.',
    section4Body: 'Progesteroni prodhohet vetëm pas ovulacionit. Por gjatë perimenopauzës, vetë ovulacioni bëhet më i parregullt — gjë që e bën prodhimin e tij më pak të parashikueshëm.',
    section4Body2: 'Kjo parregullsi shpjegon pjesërisht ndryshimet që shihen në cikël: gjatësi e ndryshueshme, menstruacione që ndonjëherë janë më të bollshme ose më të pakta se më parë.',
    section5Body: 'Përtej luhatjeve hormonale, hyjnë në lojë edhe disa faktorë të tjerë: cilësia e gjumit, niveli i stresit, stili i jetesës dhe dallimet e veçanta të çdo personi.',
    highlightText: '"Çdo grua e përjeton tranzicionin ndryshe."',
    commonSymptoms: [
      'Cikle të parregullta',
      'Valë të nxehta',
      'Djersitje natën',
      'Probleme me gjumin',
      'Ndryshime të gjendjes shpirtërore',
      'Lodhje',
      'Thatësi vaginale',
      'Ndryshime në libido',
      'Vështirësi në përqendrim',
    ],
    section6Caption: 'Kjo listë është vetëm për informim: nuk është diagnozë. Çdo person përjeton një kombinim të ndryshëm të këtyre ndryshimeve.',
    section7Body: 'Djersitja natën mund ta ndërpresë gjumin, duke sjellë lodhje dhe vështirësi në përqendrim ditën tjetër — një model i zakonshëm gjatë kësaj periudhe.',
    infoCard2Title: 'Këshillë praktike',
    infoCard2Text: 'Një dhomë gjumi e freskët, rroba të lehta dhe një rutinë e qëndrueshme para gjumit mund të ndihmojnë të kufizohen këto zgjime.',
    section8Body: 'Luhatjet hormonale mund të përputhen me ndryshime të gjendjes shpirtërore, pa qenë shpjegimi i vetëm: gjumi, stresi, ndryshimet në jetë dhe simptomat fizike luajnë gjithashtu një rol.',
    infoCard3Title: 'Për të të qetësuar',
    infoCard3Text: 'Të ndihesh më emocionale gjatë kësaj periudhe nuk do të thotë se diçka nuk shkon: është një përvojë e zakonshme që mund të ketë disa shkaqe njëkohësisht.',
    section9Body: 'Nivelet e hormoneve mund të ndryshojnë shumë nga një ditë në tjetrën gjatë perimenopauzës. Prandaj një analizë e vetme nuk jep gjithmonë një pamje të plotë të situatës.',
    infoCard4Title: 'Vlen ta mbash parasysh',
    infoCard4Text: 'Vlerësimi mjekësor varet kryesisht nga mosha jote, simptomat dhe historiku i ciklit — jo vetëm nga një numër i vetëm.',
    section10Body: 'Të shënosh çfarë përjeton muaj pas muaji të ndihmon të dallosh modelet e tua, në vend që të krahasohesh me të tjerat:',
    trackingItems: [
      'Datat e ciklit tënd',
      'Simptomat e tua ditë pas dite',
      'Gjumin tënd',
      'Gjendjen tënde shpirtërore',
      'Valët e tua të nxehta',
      'Ndryshimet në gjakderdhjen tënde',
      'Çfarë duket se i nxit disa simptoma',
    ],
    tip2Title: 'Një zakon i dobishëm',
    tip2Text: 'Ndjekja e ciklit tënd në AWA mund të të ndihmojë t’i dallosh modelet e tua gjatë muajve, pa përpjekje shtesë.',
    section11Body: 'Shumica e këtyre situatave kërkojnë një konsultë rutinë, me ritmin tënd:',
    warningTitle: 'Vlen t’i përmendet një profesionisti',
    consultSituations: [
      'Simptoma që ndikojnë ndjeshëm në jetën tënde të përditshme',
      'Probleme të vazhdueshme me gjumin',
      'Valë të nxehta shumë të bezdisshme',
      'Një simptomë e re ose e pazakontë',
      'Ndryshime të rëndësishme në gjakderdhjen tënde',
      'Pyetje rreth opsioneve të trajtimit',
      'Shqetësime që lidhen me thatësinë vaginale ose me jetën tënde seksuale',
    ],
    infoCard5Title: 'Një rast i veçantë',
    infoCard5Text: 'Gjakderdhja shumë e bollshme ose e pazakontë, përkundrazi, duhet t’i raportohet më shpejt një profesionisti të shëndetësisë.',
    section12Body: 'Sipas situatës, një profesionist mund të propozojë opsione të ndryshme:',
    solutions: [
      {
        title: 'Masa të stilit të jetesës',
        text: 'Aktiviteti fizik, ushqimi dhe menaxhimi i stresit e i gjumit.',
      },
      {
        title: 'Trajtime jo hormonale',
        text: 'Disa opsione mund të synojnë simptoma të veçanta, sipas situatës.',
      },
      {
        title: 'Trajtime hormonale',
        text: 'Diskutohen me një mjek kur i përshtaten profilit dhe nevojave të tua.',
      },
    ],
    section12Caption: 'Këto vendime mbeten individuale: varen nga historiku yt, simptomat, rreziqet dhe preferencat e tua personale.',
    summaryPoints: [
      'Ndryshimet hormonale janë pjesë përbërëse e tranzicionit drejt menopauzës.',
      'Nivelet e hormoneve mund të luhaten shumë gjatë perimenopauzës, pa një rënie krejt lineare.',
      'Simptomat ndryshojnë shumë nga një person te tjetri dhe nga muaji në muaj.',
      'Ndjekja e simptomave tua mund të të ndihmojë t’i dallosh më mirë modelet e tua.',
      'Një profesionist i shëndetësisë mund të të përkrahë nëse simptomat bëhen të vështira për t’u menaxhuar.',
    ],
    disclaimerText: 'Përmbajtje informuese. Ky artikull nuk zëvendëson një këshillë mjekësore të personalizuar. Në rast dyshimi, kërko udhëzim nga një profesionist i shëndetësisë.',
    shareMessage: 'Hormonet gjatë menopauzës — AWA',
  },
  ja: {
    badge: '更年期への移行期と閉経 • ホルモン',
    title: '更年期の\nホルモン',
    metaDuration: '読了10分',
    metaType: '記事',
    metaLevel: '中級',
    metaValidated: '確認済みの内容',
    intro: '閉経が近づいても、ホルモンが突然止まるわけではありません。ホルモンは変動します。そのため、周期の変化や、さまざまな症状が現れるのです。',
    contentsTitle: 'この記事の内容',
    topics: [
      '関わる主なホルモン',
      '更年期への移行期には何が起こる？',
      'エストロゲンが変動するとき',
      'プロゲステロンの役割',
      '症状に違いが出る理由',
      'よくある症状',
      'ホルモンと睡眠',
      'ホルモンと気分',
      'ホルモンは測定できる？',
      '変化をうまく記録するには',
      '専門家に相談するタイミングは？',
      'どのような対処が提案される？',
      '大切なポイント',
    ],
    section1Body: 'この移行期には、3つの主なホルモンが変化します。それぞれ役割が異なります。',
    keyHormones: [
      {
        title: 'エストロゲン',
        text: '周期、肌、骨、心臓に影響し、睡眠や気分の調整にも一部関わっています。',
      },
      {
        title: 'プロゲステロン',
        text: '排卵のあとに分泌され、穏やかに落ち着かせる働きがあり、妊娠の可能性に備えて体を整えます。',
      },
      {
        title: 'FSHとLH',
        text: '脳によって調整され、卵巣を刺激します。卵巣の反応が変わってくると、これらの値も変化します。',
      },
    ],
    infoCard1Title: '覚えておきたいこと',
    infoCard1Text: '更年期への移行期のホルモン値は、きれいに直線的に減っていくわけではありません。上がったり下がったりしながら変動し、閉経後に低い値で落ち着きます。',
    section2Body: '卵巣は、脳から送られるホルモンの合図に対して、少しずつ規則的に反応しなくなっていきます。これが周期が不規則になる理由であり、症状が月ごとに変わる理由でもあります。',
    tip1Title: '知っておきたいこと',
    tip1Text: 'ある月ははっきりした症状があり、次の月はほとんどないということは十分にありえます。これは異常ではなく、この時期のホルモンの変動を映しているだけです。',
    section3Body: 'エストロゲンの変化は、いくつかの変化と関連することがあります。',
    estrogenSymptoms: [
      'ほてり（ホットフラッシュ）',
      '寝汗',
      '腟の乾燥',
      '周期の変化',
      '感情の揺れやすさ',
      '睡眠の変化',
    ],
    section3Body2: 'これらの症状にはいくつもの原因がありえます。必ずしもホルモンが関係しているとは限らず、その強さにも個人差が大きくあります。',
    section4Body: 'プロゲステロンは排卵のあとにしか分泌されません。しかし更年期への移行期には、排卵そのものが不規則になるため、分泌も予測しにくくなります。',
    section4Body2: 'この不規則さは、周期に見られる変化を部分的に説明します。周期の長さが一定でなかったり、生理が以前より多かったり少なかったりすることがあります。',
    section5Body: 'ホルモンの変動のほかにも、睡眠の質、ストレスの程度、生活習慣、そして人それぞれの違いなど、さまざまな要因が関わっています。',
    highlightText: '「この移行期の過ごし方は、女性一人ひとり違います。」',
    commonSymptoms: [
      '不規則な周期',
      'ほてり（ホットフラッシュ）',
      '寝汗',
      '睡眠の問題',
      '気分の変化',
      '疲れ',
      '腟の乾燥',
      '性欲の変化',
      '集中しにくさ',
    ],
    section6Caption: 'この一覧は情報提供のみを目的としたもので、診断ではありません。これらの変化の組み合わせは、人によって異なります。',
    section7Body: '寝汗で眠りが中断されると、翌日に疲れや集中しにくさが出ることがあります。この時期にはよく見られる流れです。',
    infoCard2Title: '実践のヒント',
    infoCard2Text: '涼しい寝室、軽やかな服装、決まった就寝前の習慣は、夜中に目が覚めるのを減らす助けになることがあります。',
    section8Body: 'ホルモンの変動は気分の変化と重なることがありますが、それだけが理由とは限りません。睡眠、ストレス、生活の変化、身体的な症状も関わっています。',
    infoCard3Title: '安心していただきたいこと',
    infoCard3Text: 'この時期に感情的になりやすいと感じても、何かがおかしいということではありません。いくつもの原因が同時に関わりうる、よくある経験です。',
    section9Body: '更年期への移行期には、ホルモン値が日によって大きく変わることがあります。そのため、1回の検査だけでは状況の全体像が分からないこともあります。',
    infoCard4Title: '心に留めておきたいこと',
    infoCard4Text: '医療面での評価は、主に年齢、症状、周期の経過をもとに行われます。ひとつの数値だけで決まるものではありません。',
    section10Body: '毎月の体験を書きとめておくと、他の人と比べるのではなく、自分自身のパターンに気づきやすくなります。',
    trackingItems: [
      '周期の日付',
      '毎日の症状',
      '睡眠',
      '気分',
      'ほてり（ホットフラッシュ）',
      '出血の変化',
      '特定の症状のきっかけになりそうなこと',
    ],
    tip2Title: '役立つ習慣',
    tip2Text: 'AWAで周期を記録すると、手間をかけずに、何か月かにわたる自分のパターンに気づきやすくなります。',
    section11Body: 'こうした状況のほとんどは、ご自身のペースで通常の診察を受ければ大丈夫です。',
    warningTitle: '専門家に伝えておきたいこと',
    consultSituations: [
      '日常生活に大きく影響する症状',
      '続いている睡眠の問題',
      'とてもつらいほてり（ホットフラッシュ）',
      '新しい症状、またはいつもと違う症状',
      '出血の大きな変化',
      '治療の選択肢についての疑問',
      '腟の乾燥や性生活についての悩み',
    ],
    infoCard5Title: '特別な場合',
    infoCard5Text: '一方、とても多い出血やいつもと違う出血は、より早めに医療従事者に伝えるべきです。',
    section12Body: '状況に応じて、専門家はさまざまな選択肢を提案することがあります。',
    solutions: [
      {
        title: '生活習慣の工夫',
        text: '運動、食事、そしてストレスや睡眠の管理。',
      },
      {
        title: 'ホルモンを使わない治療',
        text: '状況に応じて、特定の症状を対象にした選択肢があります。',
      },
      {
        title: 'ホルモン治療',
        text: 'ご自身の状態や希望に合う場合に、医師と相談して検討されます。',
      },
    ],
    section12Caption: 'これらの判断は一人ひとり異なります。既往歴、症状、リスク、そして個人の希望によって決まります。',
    summaryPoints: [
      'ホルモンの変化は、閉経への移行の一部です。',
      '更年期への移行期のホルモン値は大きく変動することがあり、きれいに直線的に減るわけではありません。',
      '症状は人によって、また月によって大きく異なります。',
      '症状を記録すると、自分自身のパターンに気づきやすくなります。',
      '症状への対処がつらくなったときは、医療従事者が支えになってくれます。',
    ],
    disclaimerText: '情報提供を目的とした内容です。この記事は個別の医療アドバイスに代わるものではありません。不安なときは、医療従事者に相談してください。',
    shareMessage: '更年期のホルモン — AWA',
  },
  ko: {
    badge: '폐경 이행기 & 갱년기 • 호르몬',
    title: '갱년기의\n호르몬',
    metaDuration: '10분 읽기',
    metaType: '아티클',
    metaLevel: '중급',
    metaValidated: '검토된 콘텐츠',
    intro: '폐경이 다가오면 호르몬은 갑자기 멈추지 않고 오르내려요. 그래서 주기가 달라지고 증상도 다양하게 나타날 수 있어요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    topics: [
      '관여하는 주요 호르몬',
      '폐경 이행기에는 어떤 일이 일어날까요?',
      '에스트로겐이 오르내릴 때',
      '프로게스테론의 역할',
      '증상이 다양한 이유',
      '가장 흔한 증상',
      '호르몬과 수면',
      '호르몬과 기분',
      '호르몬을 측정할 수 있을까요?',
      '변화를 더 잘 기록하는 방법',
      '전문가를 만나야 할 때',
      '어떤 해결책을 제안받을 수 있나요?',
      '핵심 정리',
    ],
    section1Body: '이 전환기에는 세 가지 주요 호르몬이 변하며, 각각 역할이 달라요.',
    keyHormones: [
      {
        title: '에스트로겐',
        text: '주기, 피부, 뼈, 심장에 영향을 주고 수면과 기분 조절에도 일부 관여해요.',
      },
      {
        title: '프로게스테론',
        text: '배란 뒤에 만들어지며, 비교적 진정시키는 작용을 하고 몸이 임신 가능성에 대비하도록 준비시켜요.',
      },
      {
        title: 'FSH와 LH',
        text: '뇌에서 조절되며 난소를 자극해요. 난소가 다르게 반응하면서 이 호르몬 수치도 달라져요.',
      },
    ],
    infoCard1Title: '참고해 주세요',
    infoCard1Text: '폐경 이행기에 호르몬 수치가 완전히 일직선으로 줄어드는 것은 아니에요. 오르내리다가 폐경 이후에 더 낮은 수준에서 안정돼요.',
    section2Body: '난소는 뇌가 보내는 호르몬 신호에 점점 덜 규칙적으로 반응해요. 이 때문에 주기가 불규칙해지고, 증상이 달마다 달라질 수 있어요.',
    tip1Title: '알아두면 좋아요',
    tip1Text: '한 달은 증상이 뚜렷하다가 다음 달에는 거의 없을 수도 있어요. 이상한 일이 아니에요. 이 시기의 호르몬 변동을 그대로 보여 주는 거예요.',
    section3Body: '에스트로겐의 변화는 여러 가지 변화와 관련될 수 있어요.',
    estrogenSymptoms: [
      '안면 홍조(열감)',
      '야간 발한',
      '질 건조',
      '주기 변화',
      '감정에 예민해짐',
      '수면 변화',
    ],
    section3Body2: '이런 증상은 원인이 여러 가지일 수 있어요. 항상 호르몬 때문인 것은 아니고, 강도도 사람마다 많이 달라요.',
    section4Body: '프로게스테론은 배란 뒤에만 만들어져요. 그런데 폐경 이행기에는 배란 자체가 더 불규칙해져서 프로게스테론 생성도 예측하기 어려워져요.',
    section4Body2: '이런 불규칙함이 주기에서 보이는 변화를 일부 설명해 줘요. 주기 길이가 일정하지 않고, 생리량이 전보다 많거나 적을 때도 있어요.',
    section5Body: '호르몬 변동 외에도 수면의 질, 스트레스 수준, 생활 방식, 사람마다 다른 개인차 같은 여러 요인이 영향을 줘요.',
    highlightText: '“이 전환기는 여성마다 다르게 겪어요.”',
    commonSymptoms: [
      '불규칙한 주기',
      '안면 홍조(열감)',
      '야간 발한',
      '수면 문제',
      '기분 변화',
      '피로',
      '질 건조',
      '성욕 변화',
      '집중하기 어려움',
    ],
    section6Caption: '이 목록은 정보 제공용이며 진단이 아니에요. 이런 변화가 어떤 조합으로 나타나는지는 사람마다 달라요.',
    section7Body: '야간 발한은 잠을 방해해서 다음 날 피로와 집중 어려움으로 이어질 수 있어요. 이 시기에 흔한 양상이에요.',
    infoCard2Title: '실천 팁',
    infoCard2Text: '시원한 침실, 가벼운 옷, 일정한 취침 루틴이 잠에서 깨는 일을 줄이는 데 도움이 될 수 있어요.',
    section8Body: '호르몬 변동은 기분 변화와 함께 나타날 수 있지만, 그것만이 이유는 아니에요. 수면, 스트레스, 삶의 변화, 신체 증상도 영향을 줘요.',
    infoCard3Title: '안심하세요',
    infoCard3Text: '이 시기에 감정이 더 풍부해진다고 해서 무언가 잘못된 것은 아니에요. 여러 원인이 동시에 작용할 수 있는 흔한 경험이에요.',
    section9Body: '폐경 이행기에는 호르몬 수치가 하루하루 상당히 달라질 수 있어요. 그래서 검사 한 번으로는 상황을 온전히 알기 어려울 때가 있어요.',
    infoCard4Title: '기억해 두세요',
    infoCard4Text: '의학적 평가는 수치 하나가 아니라 주로 나이, 증상, 주기 이력에 따라 이루어져요.',
    section10Body: '달마다 겪는 일을 적어 두면 다른 사람과 비교하지 않고 나만의 패턴을 알아차리는 데 도움이 돼요.',
    trackingItems: [
      '주기 날짜',
      '하루하루의 증상',
      '수면',
      '기분',
      '안면 홍조(열감)',
      '출혈의 변화',
      '특정 증상을 일으키는 것 같은 요인',
    ],
    tip2Title: '도움이 되는 습관',
    tip2Text: 'AWA에서 주기를 기록하면 별다른 노력 없이도 몇 달에 걸친 나만의 패턴을 알아차리는 데 도움이 될 수 있어요.',
    section11Body: '이런 상황은 대부분 서두르지 않고 나에게 맞는 때에 일반 진료를 받으면 돼요.',
    warningTitle: '전문가에게 말해 두면 좋은 것',
    consultSituations: [
      '일상생활에 크게 영향을 주는 증상',
      '계속되는 수면 문제',
      '매우 불편한 안면 홍조(열감)',
      '새롭거나 평소와 다른 증상',
      '출혈의 뚜렷한 변화',
      '치료 선택지에 대한 궁금증',
      '질 건조나 성생활과 관련된 걱정',
    ],
    infoCard5Title: '특별한 경우',
    infoCard5Text: '반면 매우 많거나 평소와 다른 출혈은 더 빨리 의료 전문가에게 알려야 해요.',
    section12Body: '상황에 따라 전문가가 여러 가지 선택지를 제안할 수 있어요.',
    solutions: [
      {
        title: '생활 습관 관리',
        text: '신체 활동, 식단, 스트레스와 수면 관리.',
      },
      {
        title: '비호르몬 치료',
        text: '상황에 따라 특정 증상에 맞는 선택지가 있을 수 있어요.',
      },
      {
        title: '호르몬 치료',
        text: '나의 상태와 필요에 맞을 때 의사와 상의해요.',
      },
    ],
    section12Caption: '이런 결정은 어디까지나 개인의 몫이에요. 이력, 증상, 위험 요소, 개인적인 선호에 따라 달라져요.',
    summaryPoints: [
      '호르몬 변화는 폐경 전환기의 자연스러운 일부예요.',
      '폐경 이행기에는 호르몬 수치가 크게 오르내릴 수 있고, 완전히 일직선으로 줄어들지는 않아요.',
      '증상은 사람마다, 그리고 달마다 많이 달라요.',
      '증상을 기록하면 나만의 패턴을 더 잘 알아차리는 데 도움이 될 수 있어요.',
      '증상을 감당하기 어려워지면 의료 전문가가 도움을 줄 수 있어요.',
    ],
    disclaimerText: '정보 제공용 콘텐츠예요. 이 아티클은 개인 맞춤 의학적 조언을 대신하지 않아요. 궁금한 점이 있다면 의료 전문가의 안내를 받으세요.',
    shareMessage: '갱년기의 호르몬 — AWA',
  },
  'pt-PT': {
    badge: 'PERIMENOPAUSA E MENOPAUSA • HORMONAS',
    title: 'As hormonas\nna menopausa',
    metaDuration: '10 min de leitura',
    metaType: 'Artigo',
    metaLevel: 'Intermédio',
    metaValidated: 'Conteúdo revisto',
    intro: 'À medida que a menopausa se aproxima, as hormonas não param de repente: oscilam, o que explica tanto as alterações do ciclo como a variedade de sintomas possíveis.',
    contentsTitle: 'Neste artigo',
    topics: [
      'As principais hormonas envolvidas',
      'O que acontece na perimenopausa?',
      'Quando os estrogénios oscilam',
      'O papel da progesterona',
      'Porque variam os sintomas',
      'Os sintomas mais comuns',
      'Hormonas e sono',
      'Hormonas e humor',
      'É possível medir as hormonas?',
      'Como acompanhar melhor as alterações',
      'Quando consultar um profissional?',
      'Que soluções podem ser propostas?',
      'Pontos essenciais',
    ],
    section1Body: 'Três hormonas importantes mudam durante esta transição, cada uma com um papel diferente:',
    keyHormones: [
      {
        title: 'Estrogénios',
        text: 'Influenciam o ciclo, a pele, os ossos e o coração, e regulam em parte o sono e o humor.',
      },
      {
        title: 'Progesterona',
        text: 'Produzida após a ovulação, tem um efeito algo calmante e prepara o corpo para uma possível gravidez.',
      },
      {
        title: 'FSH e LH',
        text: 'Controladas pelo cérebro, estimulam os ovários; os seus níveis mudam à medida que os ovários respondem de forma diferente.',
      },
    ],
    infoCard1Title: 'A ter em conta',
    infoCard1Text: 'Os níveis hormonais não diminuem de forma perfeitamente linear durante a perimenopausa: podem oscilar, subir e descer, antes de estabilizarem num nível mais baixo após a menopausa.',
    section2Body: 'Os ovários respondem, aos poucos, de forma menos regular aos sinais hormonais enviados pelo cérebro. É isto que torna os ciclos irregulares e explica porque os sintomas podem mudar de mês para mês.',
    tip1Title: 'Bom saber',
    tip1Text: 'É perfeitamente possível ter sintomas marcados num mês e quase nenhuns no seguinte. Isto não é anormal: reflete simplesmente as oscilações hormonais deste período.',
    section3Body: 'As alterações dos estrogénios podem estar associadas a várias mudanças:',
    estrogenSymptoms: [
      'Afrontamentos (ondas de calor)',
      'Suores noturnos',
      'Secura vaginal',
      'Alterações do ciclo',
      'Sensibilidade emocional',
      'Alterações do sono',
    ],
    section3Body2: 'Estes sintomas podem ter várias causas: nem sempre estão ligados às hormonas e a sua intensidade varia muito de pessoa para pessoa.',
    section4Body: 'A progesterona só é produzida após a ovulação. Mas, durante a perimenopausa, a própria ovulação torna-se mais irregular — o que torna a sua produção menos previsível.',
    section4Body2: 'Esta irregularidade explica em parte as alterações observadas no ciclo: duração variável, períodos por vezes mais abundantes ou mais leves do que antes.',
    section5Body: 'Para além das oscilações hormonais, intervêm vários outros fatores: a qualidade do sono, o nível de stress, o estilo de vida e as diferenças próprias de cada pessoa.',
    highlightText: '“Cada mulher vive a transição de forma diferente.”',
    commonSymptoms: [
      'Ciclos irregulares',
      'Afrontamentos (ondas de calor)',
      'Suores noturnos',
      'Problemas de sono',
      'Alterações de humor',
      'Cansaço',
      'Secura vaginal',
      'Alterações da libido',
      'Dificuldade de concentração',
    ],
    section6Caption: 'Esta lista é meramente informativa: não constitui um diagnóstico. Cada pessoa vive uma combinação diferente destas alterações.',
    section7Body: 'Os suores noturnos podem interromper o sono, causando cansaço e dificuldade de concentração no dia seguinte — um padrão frequente durante este período.',
    infoCard2Title: 'Dica prática',
    infoCard2Text: 'Um quarto fresco, roupa leve e uma rotina de deitar estável podem ajudar a limitar estes despertares.',
    section8Body: 'As oscilações hormonais podem coincidir com alterações de humor, sem serem a única explicação: o sono, o stress, as mudanças de vida e os sintomas físicos também têm o seu papel.',
    infoCard3Title: 'Para a tranquilizar',
    infoCard3Text: 'Sentir-se mais emotiva durante este período não significa que algo esteja errado: é uma experiência comum, que pode ter várias causas em simultâneo.',
    section9Body: 'Os níveis hormonais podem variar consideravelmente de um dia para o outro durante a perimenopausa. Por isso, uma única análise nem sempre dá uma imagem completa da situação.',
    infoCard4Title: 'A não esquecer',
    infoCard4Text: 'A avaliação médica depende sobretudo da sua idade, dos seus sintomas e do seu historial de ciclos — e não apenas de um único valor.',
    section10Body: 'Anotar o que vive mês após mês ajuda a identificar os seus próprios padrões, em vez de se comparar com outras pessoas:',
    trackingItems: [
      'As datas do seu ciclo',
      'Os seus sintomas, dia a dia',
      'O seu sono',
      'O seu humor',
      'Os seus afrontamentos (ondas de calor)',
      'Alterações na sua perda de sangue',
      'O que parece desencadear certos sintomas',
    ],
    tip2Title: 'Um hábito útil',
    tip2Text: 'Acompanhar o seu ciclo na AWA pode ajudá-la a identificar os seus próprios padrões ao longo dos meses, sem esforço adicional.',
    section11Body: 'A maioria destas situações justifica uma consulta de rotina, ao seu ritmo:',
    warningTitle: 'A mencionar a um profissional',
    consultSituations: [
      'Sintomas que afetam de forma significativa o seu dia a dia',
      'Problemas de sono persistentes',
      'Afrontamentos (ondas de calor) muito incómodos',
      'Um sintoma novo ou fora do habitual',
      'Alterações significativas na sua perda de sangue',
      'Dúvidas sobre as opções de tratamento',
      'Preocupações relacionadas com a secura vaginal ou com a sua vida sexual',
    ],
    infoCard5Title: 'Um caso especial',
    infoCard5Text: 'Em contrapartida, uma perda de sangue muito abundante ou fora do habitual deve ser comunicada mais rapidamente a um profissional de saúde.',
    section12Body: 'Consoante a situação, um profissional pode propor diferentes opções:',
    solutions: [
      {
        title: 'Medidas de estilo de vida',
        text: 'Atividade física, alimentação e gestão do stress e do sono.',
      },
      {
        title: 'Tratamentos não hormonais',
        text: 'Algumas opções podem visar sintomas específicos, consoante a situação.',
      },
      {
        title: 'Tratamentos hormonais',
        text: 'Discutidos com um médico quando se adequam ao seu perfil e às suas necessidades.',
      },
    ],
    section12Caption: 'Estas decisões continuam a ser individuais: dependem do seu historial, dos seus sintomas, dos riscos e das suas preferências pessoais.',
    summaryPoints: [
      'As alterações hormonais fazem parte integrante da transição para a menopausa.',
      'Os níveis hormonais podem oscilar de forma significativa durante a perimenopausa, sem uma descida perfeitamente linear.',
      'Os sintomas variam muito de pessoa para pessoa e de mês para mês.',
      'Acompanhar os seus sintomas pode ajudá-la a identificar melhor os seus próprios padrões.',
      'Um profissional de saúde pode apoiá-la se os sintomas se tornarem difíceis de gerir.',
    ],
    disclaimerText: 'Conteúdo informativo. Este artigo não substitui aconselhamento médico personalizado. Em caso de dúvida, procure a orientação de um profissional de saúde.',
    shareMessage: 'As hormonas na menopausa — AWA',
  },
  bn: {
    badge: 'মেনোপজ-পূর্ব পর্যায় ও মেনোপজ • হরমোন',
    title: 'মেনোপজের সময়\nহরমোন',
    metaDuration: 'পড়তে 10 মিনিট',
    metaType: 'নিবন্ধ',
    metaLevel: 'মধ্যম স্তর',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'মেনোপজ ঘনিয়ে এলে আপনার হরমোন হঠাৎ থেমে যায় না: সেগুলো ওঠানামা করে, আর এ কারণেই চক্রের পরিবর্তন এবং নানা ধরনের সম্ভাব্য উপসর্গ দেখা দেয়।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'জড়িত প্রধান হরমোনগুলো',
      'মেনোপজ-পূর্ব পর্যায়ে (পেরিমেনোপজ) কী ঘটে?',
      'ইস্ট্রোজেন যখন ওঠানামা করে',
      'প্রোজেস্টেরনের ভূমিকা',
      'উপসর্গ কেন ভিন্ন হতে পারে',
      'সবচেয়ে সাধারণ উপসর্গ',
      'হরমোন ও ঘুম',
      'হরমোন ও মেজাজ',
      'হরমোন কি পরিমাপ করা যায়?',
      'পরিবর্তনগুলো কীভাবে ভালোভাবে নজরে রাখবেন',
      'কখন পেশাজীবীর কাছে যাবেন?',
      'কোন সমাধান প্রস্তাব করা হতে পারে?',
      'মূল কথা',
    ],
    section1Body: 'এই রূপান্তরের সময় তিনটি প্রধান হরমোন বদলায়, প্রতিটির ভূমিকা আলাদা:',
    keyHormones: [
      {
        title: 'ইস্ট্রোজেন',
        text: 'চক্র, ত্বক, হাড় ও হৃৎপিণ্ডকে প্রভাবিত করে এবং আংশিকভাবে ঘুম ও মেজাজ নিয়ন্ত্রণ করে।',
      },
      {
        title: 'প্রোজেস্টেরন',
        text: 'ডিম্বস্ফোটনের পর তৈরি হয়, এর প্রভাব মোটামুটি শান্তকারী এবং এটি সম্ভাব্য গর্ভাবস্থার জন্য শরীরকে প্রস্তুত করে।',
      },
      {
        title: 'এফএসএইচ ও এলএইচ',
        text: 'মস্তিষ্ক দ্বারা নিয়ন্ত্রিত হয়ে এগুলো ডিম্বাশয়কে উদ্দীপিত করে; ডিম্বাশয় ভিন্নভাবে সাড়া দিলে এগুলোর মাত্রা বদলায়।',
      },
    ],
    infoCard1Title: 'লক্ষ করার মতো',
    infoCard1Text: 'মেনোপজ-পূর্ব পর্যায়ে হরমোনের মাত্রা পুরোপুরি সরলরেখায় কমে না: মেনোপজের পর নিম্নতর মাত্রায় স্থির হওয়ার আগে তা ওঠানামা করতে পারে, বাড়তে ও কমতে পারে।',
    section2Body: 'মস্তিষ্ক থেকে আসা হরমোনের সংকেতে ডিম্বাশয় ক্রমশ কম নিয়মিতভাবে সাড়া দেয়। এ কারণেই চক্র অনিয়মিত হয় এবং মাসে মাসে উপসর্গ বদলে যেতে পারে।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'এক মাসে স্পষ্ট উপসর্গ থাকা, তারপর পরের মাসে প্রায় কিছুই না থাকা সম্পূর্ণ সম্ভব। এটি অস্বাভাবিক নয়: এটি কেবল এই সময়ের হরমোনের ওঠানামাকে প্রতিফলিত করে।',
    section3Body: 'ইস্ট্রোজেনের পরিবর্তন বেশ কয়েকটি পরিবর্তনের সঙ্গে যুক্ত হতে পারে:',
    estrogenSymptoms: [
      'হট ফ্ল্যাশ (গরম লাগা)',
      'রাতে ঘাম',
      'যোনিপথের শুষ্কতা',
      'চক্রের পরিবর্তন',
      'আবেগপ্রবণতা',
      'ঘুমের পরিবর্তন',
    ],
    section3Body2: 'এই উপসর্গগুলোর একাধিক কারণ থাকতে পারে: এগুলো সবসময় হরমোনের সঙ্গে যুক্ত নয়, আর এগুলোর তীব্রতা একজন থেকে অন্যজনে অনেক ভিন্ন হয়।',
    section4Body: 'প্রোজেস্টেরন কেবল ডিম্বস্ফোটনের পরই তৈরি হয়। কিন্তু মেনোপজ-পূর্ব পর্যায়ে ডিম্বস্ফোটনই আরও অনিয়মিত হয়ে ওঠে, ফলে এর উৎপাদন কম অনুমানযোগ্য হয়।',
    section4Body2: 'এই অনিয়মই চক্রে দেখা পরিবর্তনের আংশিক ব্যাখ্যা: চক্রের দৈর্ঘ্য বদলায়, মাসিক কখনো আগের চেয়ে বেশি বা কম হয়।',
    section5Body: 'হরমোনের ওঠানামার বাইরেও আরও কিছু বিষয় ভূমিকা রাখে: ঘুমের মান, মানসিক চাপের মাত্রা, জীবনযাত্রা এবং প্রত্যেক ব্যক্তির নিজস্ব ভিন্নতা।',
    highlightText: '“প্রত্যেক নারী এই রূপান্তর ভিন্নভাবে অনুভব করেন।”',
    commonSymptoms: [
      'অনিয়মিত চক্র',
      'হট ফ্ল্যাশ (গরম লাগা)',
      'রাতে ঘাম',
      'ঘুমের সমস্যা',
      'মেজাজের পরিবর্তন',
      'ক্লান্তি',
      'যোনিপথের শুষ্কতা',
      'যৌন আকাঙ্ক্ষার পরিবর্তন',
      'মনোযোগ দিতে অসুবিধা',
    ],
    section6Caption: 'এই তালিকা শুধু তথ্যের জন্য: এটি রোগ নির্ণয় নয়। প্রত্যেক ব্যক্তি এই পরিবর্তনগুলোর ভিন্ন ভিন্ন সমন্বয় অনুভব করেন।',
    section7Body: 'রাতে ঘাম ঘুম ভেঙে দিতে পারে, যার ফলে পরদিন ক্লান্তি ও মনোযোগ দিতে অসুবিধা হয়: এই সময়ে এটি একটি সাধারণ ধারা।',
    infoCard2Title: 'ব্যবহারিক পরামর্শ',
    infoCard2Text: 'ঠান্ডা শোবার ঘর, হালকা পোশাক এবং ঘুমানোর নির্দিষ্ট রুটিন এই ঘুম ভেঙে যাওয়া কমাতে সাহায্য করতে পারে।',
    section8Body: 'হরমোনের ওঠানামা মেজাজের পরিবর্তনের সঙ্গে একই সময়ে ঘটতে পারে, তবে এটিই একমাত্র ব্যাখ্যা নয়: ঘুম, মানসিক চাপ, জীবনের পরিবর্তন এবং শারীরিক উপসর্গও ভূমিকা রাখে।',
    infoCard3Title: 'আপনাকে আশ্বস্ত করতে',
    infoCard3Text: 'এই সময়ে আরও আবেগপ্রবণ বোধ করার অর্থ এই নয় যে কিছু ভুল হয়েছে: এটি একটি সাধারণ অভিজ্ঞতা, যার একসঙ্গে একাধিক কারণ থাকতে পারে।',
    section9Body: 'মেনোপজ-পূর্ব পর্যায়ে হরমোনের মাত্রা একদিন থেকে পরের দিন উল্লেখযোগ্যভাবে বদলাতে পারে। তাই একটিমাত্র পরীক্ষা সবসময় পরিস্থিতির পূর্ণ চিত্র দেয় না।',
    infoCard4Title: 'মনে রাখার মতো',
    infoCard4Text: 'চিকিৎসাগত মূল্যায়ন প্রধানত আপনার বয়স, উপসর্গ ও চক্রের ইতিহাসের ওপর নির্ভর করে, শুধু একটি সংখ্যার ওপর নয়।',
    section10Body: 'মাসের পর মাস আপনি যা অনুভব করেন তা লিখে রাখলে অন্যদের সঙ্গে নিজেকে তুলনা করার বদলে নিজের ধরনগুলো চিনতে সুবিধা হয়:',
    trackingItems: [
      'আপনার চক্রের তারিখ',
      'দিনের পর দিন আপনার উপসর্গ',
      'আপনার ঘুম',
      'আপনার মেজাজ',
      'আপনার হট ফ্ল্যাশ (গরম লাগা)',
      'আপনার রক্তস্রাবের পরিবর্তন',
      'কিছু উপসর্গ কীসে শুরু হয় বলে মনে হয়',
    ],
    tip2Title: 'একটি সহায়ক অভ্যাস',
    tip2Text: 'AWA-তে আপনার চক্র নজরে রাখলে বাড়তি কোনো পরিশ্রম ছাড়াই মাসের পর মাস নিজের ধরনগুলো চিনতে সুবিধা হতে পারে।',
    section11Body: 'এসব পরিস্থিতির বেশিরভাগে নিজের সুবিধামতো সময়ে একটি নিয়মিত পরামর্শ নেওয়া প্রয়োজন:',
    warningTitle: 'পেশাজীবীকে জানানোর মতো',
    consultSituations: [
      'যে উপসর্গ আপনার দৈনন্দিন জীবনকে উল্লেখযোগ্যভাবে প্রভাবিত করে',
      'স্থায়ী ঘুমের সমস্যা',
      'খুব অস্বস্তিকর হট ফ্ল্যাশ (গরম লাগা)',
      'নতুন বা অস্বাভাবিক কোনো উপসর্গ',
      'আপনার রক্তস্রাবে উল্লেখযোগ্য পরিবর্তন',
      'চিকিৎসার বিকল্প নিয়ে প্রশ্ন',
      'যোনিপথের শুষ্কতা বা আপনার যৌন জীবন সংক্রান্ত উদ্বেগ',
    ],
    infoCard5Title: 'একটি বিশেষ ক্ষেত্র',
    infoCard5Text: 'অন্যদিকে, খুব বেশি বা অস্বাভাবিক রক্তস্রাব আরও দ্রুত স্বাস্থ্যসেবা পেশাজীবীকে জানানো উচিত।',
    section12Body: 'পরিস্থিতি অনুযায়ী একজন পেশাজীবী বিভিন্ন বিকল্প প্রস্তাব করতে পারেন:',
    solutions: [
      {
        title: 'জীবনযাত্রাগত ব্যবস্থা',
        text: 'শারীরিক কার্যকলাপ, খাদ্যাভ্যাস এবং মানসিক চাপ ও ঘুমের ব্যবস্থাপনা।',
      },
      {
        title: 'হরমোনবিহীন চিকিৎসা',
        text: 'পরিস্থিতি অনুযায়ী কিছু বিকল্প নির্দিষ্ট উপসর্গকে লক্ষ্য করতে পারে।',
      },
      {
        title: 'হরমোনভিত্তিক চিকিৎসা',
        text: 'আপনার অবস্থা ও প্রয়োজনের সঙ্গে মানালে ডাক্তারের সঙ্গে আলোচনা করা হয়।',
      },
    ],
    section12Caption: 'এই সিদ্ধান্তগুলো ব্যক্তিগতই থাকে: এগুলো আপনার ইতিহাস, উপসর্গ, ঝুঁকি এবং ব্যক্তিগত পছন্দের ওপর নির্ভর করে।',
    summaryPoints: [
      'হরমোনের পরিবর্তন মেনোপজ রূপান্তরের একটি অবিচ্ছেদ্য অংশ।',
      'মেনোপজ-পূর্ব পর্যায়ে হরমোনের মাত্রা উল্লেখযোগ্যভাবে ওঠানামা করতে পারে, পুরোপুরি সরলরেখায় কমে না।',
      'উপসর্গ একজন থেকে অন্যজনে এবং মাসে মাসে অনেক ভিন্ন হয়।',
      'আপনার উপসর্গ নজরে রাখলে নিজের ধরনগুলো আরও ভালোভাবে চিনতে সাহায্য হতে পারে।',
      'উপসর্গ সামলানো কঠিন হয়ে উঠলে একজন স্বাস্থ্যসেবা পেশাজীবী আপনাকে সহায়তা করতে পারেন।',
    ],
    disclaimerText: 'তথ্যমূলক বিষয়বস্তু। এই নিবন্ধ ব্যক্তিগত চিকিৎসা পরামর্শের বিকল্প নয়। সন্দেহ থাকলে একজন স্বাস্থ্যসেবা পেশাজীবীর পরামর্শ নিন।',
    shareMessage: 'মেনোপজের সময় হরমোন — AWA',
  },
  da: {
    badge: 'PERIMENOPAUSE & MENOPAUSE • HORMONER',
    title: 'Hormoner\ni overgangsalderen',
    metaDuration: '10 min læsning',
    metaType: 'Artikel',
    metaLevel: 'Mellemniveau',
    metaValidated: 'Gennemset indhold',
    intro: 'Når du nærmer dig menopausen, stopper dine hormoner ikke brat: de svinger, og det er præcis det, der forårsager cyklusændringer og de mange mulige symptomer.',
    contentsTitle: 'I denne artikel',
    topics: [
      'De vigtigste hormoner involveret',
      'Hvad sker der i perimenopausen?',
      'Når østrogenet svinger',
      'Progesteronets rolle',
      'Hvorfor symptomerne kan være forskellige',
      'De mest almindelige symptomer',
      'Hormoner og søvn',
      'Hormoner og humør',
      'Kan hormoner måles?',
      'Sådan følger du bedre med i ændringerne',
      'Hvornår skal du opsøge en fagperson?',
      'Hvilke løsninger kan tilbydes?',
      'Hvad du kan tage med dig',
    ],
    section1Body: 'Tre vigtige hormoner ændrer sig under denne overgang, og hvert af dem spiller en særlig rolle:',
    keyHormones: [
      {
        title: 'Østrogen',
        text: 'Påvirker cyklus, hud, knogler og hjerte og regulerer delvist søvn og humør.',
      },
      {
        title: 'Progesteron',
        text: 'Produceres efter ægløsning, har en beroligende effekt og forbereder kroppen til en eventuel graviditet.',
      },
      {
        title: 'FSH og LH',
        text: 'Styret af hjernen stimulerer de æggestokkene; deres niveau ændrer sig, når æggestokkene reagerer anderledes.',
      },
    ],
    infoCard1Title: 'Værd at bemærke',
    infoCard1Text: 'I perimenopausen falder hormonerne ikke jævnt i en ret linje: de kan svinge op og ned, inden de stabiliserer sig på et lavere niveau efter menopausen.',
    section2Body: 'Æggestokkene reagerer gradvist mindre regelmæssigt på hjernens hormonsignaler. Det er grunden til, at cyklusserne bliver uregelmæssige, og at symptomerne kan variere fra måned til måned.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Det er fuldt normalt at have tydelige symptomer én måned og næsten ingen den næste. Det afspejler blot hormonernes udsving i denne periode.',
    section3Body: 'Ændringer i østrogen kan knytte sig til flere forandringer:',
    estrogenSymptoms: [
      'Hedeture',
      'Nattesved',
      'Vaginal tørhed',
      'Cyklusændringer',
      'Følelsesmæssig sårbarhed',
      'Søvnændringer',
    ],
    section3Body2: 'Disse symptomer kan have flere årsager: de er ikke altid hormonrelaterede, og deres intensitet varierer meget fra person til person.',
    section4Body: 'Progesteron produceres kun efter ægløsning. I perimenopausen bliver ægløsningen imidlertid mere uregelmæssig, så produktionen er sværere at forudsige.',
    section4Body2: 'Denne uregelmæssighed forklarer delvist de ændringer, der ses i cyklussen: cyklussens længde varierer, og menstruationen kan blive kraftigere eller svagere end tidligere.',
    section5Body: 'Ud over hormonudsving spiller andre faktorer også en rolle: søvnkvalitet, stressniveau, livsstil og individuelle forskelle.',
    highlightText: '"Alle kvinder oplever denne overgang forskelligt."',
    commonSymptoms: [
      'Uregelmæssige cyklusser',
      'Hedeture',
      'Nattesved',
      'Søvnproblemer',
      'Humørsvingninger',
      'Træthed',
      'Vaginal tørhed',
      'Ændringer i sexlyst',
      'Koncentrationsbesvær',
    ],
    section6Caption: 'Denne liste er udelukkende til information – den er ikke en diagnose. Alle oplever en individuel kombination af disse ændringer.',
    section7Body: 'Nattesved kan vække dig om natten og føre til træthed og koncentrationsbesvær næste dag: dette er et almindeligt mønster i denne periode.',
    infoCard2Title: 'Praktisk tip',
    infoCard2Text: 'Et køligt soveværelse, lette nattøj og en fast søvnrutine kan hjælpe med at mindske disse natlige opvågninger.',
    section8Body: 'Hormonudsving kan falde sammen med humørændringer, men det er ikke den eneste forklaring: søvn, stress, livsbegivenheder og fysiske symptomer spiller alle en rolle.',
    infoCard3Title: 'En beroligende tanke',
    infoCard3Text: 'At føle sig mere følsom i denne periode er ikke ensbetydende med, at noget er galt: det er en almindelig oplevelse, der kan have flere samtidige årsager.',
    section9Body: 'I perimenopausen kan hormonniveauerne ændre sig markant fra dag til dag. En enkelt blodprøve giver derfor ikke altid et fuldstændigt billede af situationen.',
    infoCard4Title: 'Vigtigt at huske',
    infoCard4Text: 'En medicinsk vurdering baserer sig primært på din alder, dine symptomer og din cyklushistorik – ikke kun på et enkelt tal.',
    section10Body: 'At notere, hvad du oplever måned for måned, hjælper dig med at genkende dine egne mønstre frem for at sammenligne dig med andre:',
    trackingItems: [
      'Dine cyklusdatoer',
      'Dine symptomer dag for dag',
      'Din søvn',
      'Dit humør',
      'Dine hedeture',
      'Ændringer i din blødning',
      'Hvad der ser ud til at udløse visse symptomer',
    ],
    tip2Title: 'En god vane',
    tip2Text: 'At følge din cyklus i AWA kan hjælpe dig med at genkende dine egne mønstre over månederne – uden ekstra besvær.',
    section11Body: 'I de fleste af disse situationer er det godt at booke en rutinekonsultation på et tidspunkt, der passer dig:',
    warningTitle: 'Værd at nævne for en fagperson',
    consultSituations: [
      'Symptomer der markant påvirker din dagligdag',
      'Vedvarende søvnproblemer',
      'Meget ubehagelige hedeture',
      'Nye eller usædvanlige symptomer',
      'Markante ændringer i din blødning',
      'Spørgsmål om behandlingsmuligheder',
      'Bekymringer om vaginal tørhed eller dit sexliv',
    ],
    infoCard5Title: 'Et særligt tilfælde',
    infoCard5Text: 'Meget kraftige eller usædvanlige blødninger bør derimod hurtigt nævnes for en sundhedsprofessionel.',
    section12Body: 'Afhængigt af situationen kan en fagperson foreslå forskellige muligheder:',
    solutions: [
      {
        title: 'Livsstilstiltag',
        text: 'Fysisk aktivitet, kost og håndtering af stress og søvn.',
      },
      {
        title: 'Ikke-hormonelle behandlinger',
        text: 'Visse muligheder kan rettes mod specifikke symptomer afhængigt af situationen.',
      },
      {
        title: 'Hormonbehandling',
        text: 'Drøftes med din læge, hvis det passer til din situation og dine behov.',
      },
    ],
    section12Caption: 'Disse beslutninger er personlige: de afhænger af din sygehistorie, dine symptomer, dine risici og dine egne præferencer.',
    summaryPoints: [
      'Hormonforandringer er en integreret del af menopauses overgang.',
      'I perimenopausen kan hormonniveauerne svinge markant – de falder ikke jævnt i en ret linje.',
      'Symptomerne varierer meget fra person til person og fra måned til måned.',
      'At følge dine symptomer kan hjælpe dig med at genkende dine egne mønstre bedre.',
      'Når symptomerne bliver svære at håndtere, kan en sundhedsprofessionel hjælpe dig.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel erstatter ikke personlig medicinsk rådgivning. Kontakt en sundhedsprofessionel ved tvivl.',
    shareMessage: 'Hormoner i overgangsalderen — AWA',
  },
  da: {
    badge: 'PERIMENOPAUSE & MENOPAUSE • HORMONER',
    title: 'Hormoner\ni overgangsalderen',
    metaDuration: '10 min läsning',
    metaType: 'Artikel',
    metaLevel: 'Mellemniveau',
    metaValidated: 'Gennemset indhold',
    intro: 'Når du närmer dig menopausen, stopper dina hormoner inte brat: de svinger, och det ar präcis det, der forårsager cyklusändringer och de mange mulige symtom.',
    contentsTitle: 'I denne artikel',
    topics: [
      'De vigtigste hormoner involveret',
      'Hvad sker der i perimenopausen?',
      'Når östrogenet svinger',
      'Progesteronets rolle',
      'Hvorfor symtomne kan väre forskellige',
      'De mest almindelige symtom',
      'Hormoner och sövn',
      'Hormoner och humör',
      'Kan hormoner måles?',
      'Sådan fölger du bedre med i ändringerne',
      'Hvornår skal du opsöge en fagperson?',
      'Hvilke lösninger kan tilbydes?',
      'Hvad du kan tage med dig',
    ],
    section1Body: 'Tre vigtige hormoner ändrer sig under denne overgang, och hvert av dem spiller en särlig rolle:',
    keyHormones: [
      {
        title: 'Östrogen',
        text: 'Påvirker cyklus, hud, knogler och hjerte och regulerer delvist sövn och humör.',
      },
      {
        title: 'Progesteron',
        text: 'Produceres efter äglösning, har en beroligende effekt och forbereder kroppen till en eventuel graviditet.',
      },
      {
        title: 'FSH och LH',
        text: 'Styret av hjernen stimulerer de äggestokkene; deres niveau ändrer sig, når äggestokkene reagerer anderledes.',
      },
    ],
    infoCard1Title: 'Värd at bemärke',
    infoCard1Text: 'I perimenopausen falder hormonerne inte jävnt i en ret linje: de kan svinge op och ned, inden de stabiliserer sig på et lavere niveau efter menopausen.',
    section2Body: 'Äggestokkene reagerer gradvist mindre regelmässigt på hjernens hormonsignaler. Det ar grunden till, at cyklusserne bliver uregelmässige, och at symtomne kan variere fran måned till måned.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Det ar fuldt normalt at have tydelige symtom én måned och nästen ingen den näste. Det afspejler blot hormonernes udsving i denne periode.',
    section3Body: 'Ändringer i östrogen kan knytte sig till flere forandringer:',
    estrogenSymptoms: [
      'Hedeture',
      'Nattesved',
      'Vaginal törhed',
      'Cyklusändringer',
      'Fölelsesmässig sårbarhed',
      'Sövnändringer',
    ],
    section3Body2: 'Disse symtom kan have flere årsager: de ar inte alltid hormonrelaterede, och deres intensitet varierer mycket fran person till person.',
    section4Body: 'Progesteron produceres kun efter äglösning. I perimenopausen bliver äglösningen imidlertid mere uregelmässig, så produktionen ar svärere at forudsige.',
    section4Body2: 'Denne uregelmässighed forklarer delvist de ändringer, der ses i cyklussen: cyklussens längde varierer, och menstruationen kan blive kraftigere eller svagere end tidligere.',
    section5Body: 'Ud over hormonudsving spiller andre faktorer også en rolle: sövnkvalitet, stressniveau, livsstil och individuelle forskelle.',
    highlightText: '"Alla kvinnor oplever denne overgang forskelligt."',
    commonSymptoms: [
      'Uregelmässige cyklusser',
      'Hedeture',
      'Nattesved',
      'Sövnproblemer',
      'Humörsvingninger',
      'Träthed',
      'Vaginal törhed',
      'Ändringer i sexlyst',
      'Koncentrationsbesvär',
    ],
    section6Caption: 'Denne liste ar udelukkende till information – den ar inte en diagnose. Alla oplever en individuel kombination av disse ändringer.',
    section7Body: 'Nattesved kan väkke dig om natten och före till träthed och koncentrationsbesvär näste dag: dette ar et almindeligt mönster i denne periode.',
    infoCard2Title: 'Praktisk tip',
    infoCard2Text: 'Et köligt sovevärelse, lette nattöj och en fast sövnrutine kan hjälpe med at mindske disse natlige opvågninger.',
    section8Body: 'Hormonudsving kan falde sammen med humörändringer, men det ar inte den eneste forklaring: sövn, stress, livsbegivenheder och fysiske symtom spiller alla en rolle.',
    infoCard3Title: 'En beroligende tanke',
    infoCard3Text: 'At föle sig mere fölsom i denne periode ar inte ensbetydende med, at noget ar galt: det ar en almindelig oplevelse, der kan have flere samtidige årsager.',
    section9Body: 'I perimenopausen kan hormonniveauerne ändre sig markant fran dag till dag. En enkelt blodpröve giver derfor inte alltid et fuldständigt billede av situationen.',
    infoCard4Title: 'Vigtigt at huske',
    infoCard4Text: 'En medicinsk vurdering baserer sig primärt på din alder, dina symtom och din cyklushistorik – inte kun på et enkelt tal.',
    section10Body: 'At notere, hvad du oplever måned for måned, hjälper dig med at genkende dina egne mönstre frem for att sammenligne dig med andre:',
    trackingItems: [
      'Dine cyklusdatoer',
      'Dine symtom dag for dag',
      'Din sövn',
      'Dit humör',
      'Dine hedeture',
      'Ändringer i din blödning',
      'Hvad der ser ud till at udlöse visse symtom',
    ],
    tip2Title: 'En god vane',
    tip2Text: 'At fölge din cyklus i AWA kan hjälpe dig med at genkende dina egne mönstre over månederne – uden ekstra besvär.',
    section11Body: 'I de fleste av disse situationer ar det godt at booke en rutinekonsultation på et tidspunkt, der passer dig:',
    warningTitle: 'Värd at nävne for en fagperson',
    consultSituations: [
      'Symtom der markant påvirker din dagligdag',
      'Vedvarende sövnproblemer',
      'Meget ubehagelige hedeture',
      'Nye eller usädvanlige symtom',
      'Markante ändringer i din blödning',
      'Spörgsmål om behandlingsmuligheder',
      'Bekymringer om vaginal törhed eller ditt sexliv',
    ],
    infoCard5Title: 'Et särligt tilfälde',
    infoCard5Text: 'Meget kraftige eller usädvanlige blödninger bör derimod hurtigt nävnes for en halsasprofessionel.',
    section12Body: 'Afhängigt av situationen kan en fagperson foreslå forskellige muligheder:',
    solutions: [
      {
        title: 'Livsstilstiltag',
        text: 'Fysisk aktivitet, kost och håndtering av stress och sövn.',
      },
      {
        title: 'Ikke-hormonelle behandlinger',
        text: 'Visse muligheder kan rettes mod specifikke symtom afhängigt av situationen.',
      },
      {
        title: 'Hormonbehandling',
        text: 'Dröftes med din läge, hvis det passer till din situation och dina behov.',
      },
    ],
    section12Caption: 'Disse beslutninger ar personlige: de afhänger av din sygehistorie, dina symtom, dina risici och dina egne präferencer.',
    summaryPoints: [
      'Hormonforandringer ar en integreret del av menopauses overgang.',
      'I perimenopausen kan hormonniveauerne svinge markant – de falder inte jävnt i en ret linje.',
      'Symtomne varierer mycket fran person till person och fran måned till måned.',
      'At fölge dina symtom kan hjälpe dig med at genkende dina egne mönstre bedre.',
      'Når symtomne bliver sväre at håndtere, kan en halsasprofessionel hjälpe dig.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel erstatter inte personlig medicinsk rådgivning. Kontakt en halsasprofessionel ved tvivl.',
    shareMessage: 'Hormoner i overgangsalderen — AWA',
  },
  sv: {
    badge: 'PERIMENOPAUSE & MENOPAUSE • HORMONER',
    title: 'Hormoner\ni overgangsalderen',
    metaDuration: '10 min läsning',
    metaType: 'Artikel',
    metaLevel: 'Mellemniveau',
    metaValidated: 'Gennemset indhold',
    intro: 'Når du närmer dig menopausen, stopper dina hormoner inte brat: de svinger, och det ar präcis det, der forårsager cyklusändringer och de mange mulige symtom.',
    contentsTitle: 'I denne artikel',
    topics: [
      'De vigtigste hormoner involveret',
      'Hvad sker der i perimenopausen?',
      'Når östrogenet svinger',
      'Progesteronets rolle',
      'Hvorfor symtomne kan väre forskellige',
      'De mest almindelige symtom',
      'Hormoner och sövn',
      'Hormoner och humör',
      'Kan hormoner måles?',
      'Sådan fölger du bedre med i ändringerne',
      'Hvornår skal du opsöge en fagperson?',
      'Hvilke lösninger kan tilbydes?',
      'Hvad du kan tage med dig',
    ],
    section1Body: 'Tre vigtige hormoner ändrer sig under denne overgang, och hvert av dem spiller en särlig rolle:',
    keyHormones: [
      {
        title: 'Östrogen',
        text: 'Påvirker cyklus, hud, knogler och hjerte och regulerer delvist sövn och humör.',
      },
      {
        title: 'Progesteron',
        text: 'Produceres efter äglösning, har en beroligende effekt och forbereder kroppen till en eventuel graviditet.',
      },
      {
        title: 'FSH och LH',
        text: 'Styret av hjernen stimulerer de äggestokkene; deres niveau ändrer sig, når äggestokkene reagerer anderledes.',
      },
    ],
    infoCard1Title: 'Värd at bemärke',
    infoCard1Text: 'I perimenopausen falder hormonerne inte jävnt i en ret linje: de kan svinge op och ned, inden de stabiliserer sig på et lavere niveau efter menopausen.',
    section2Body: 'Äggestokkene reagerer gradvist mindre regelmässigt på hjernens hormonsignaler. Det ar grunden till, at cyklusserne bliver uregelmässige, och at symtomne kan variere fran måned till måned.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Det ar fuldt normalt at have tydelige symtom én måned och nästen ingen den näste. Det afspejler blot hormonernes udsving i denne periode.',
    section3Body: 'Ändringer i östrogen kan knytte sig till flere forandringer:',
    estrogenSymptoms: [
      'Hedeture',
      'Nattesved',
      'Vaginal törhed',
      'Cyklusändringer',
      'Fölelsesmässig sårbarhed',
      'Sövnändringer',
    ],
    section3Body2: 'Disse symtom kan have flere årsager: de ar inte alltid hormonrelaterede, och deres intensitet varierer mycket fran person till person.',
    section4Body: 'Progesteron produceres kun efter äglösning. I perimenopausen bliver äglösningen imidlertid mere uregelmässig, så produktionen ar svärere at forudsige.',
    section4Body2: 'Denne uregelmässighed forklarer delvist de ändringer, der ses i cyklussen: cyklussens längde varierer, och menstruationen kan blive kraftigere eller svagere end tidligere.',
    section5Body: 'Ud over hormonudsving spiller andre faktorer også en rolle: sövnkvalitet, stressniveau, livsstil och individuelle forskelle.',
    highlightText: '"Alla kvinnor oplever denne overgang forskelligt."',
    commonSymptoms: [
      'Uregelmässige cyklusser',
      'Hedeture',
      'Nattesved',
      'Sövnproblemer',
      'Humörsvingninger',
      'Träthed',
      'Vaginal törhed',
      'Ändringer i sexlyst',
      'Koncentrationsbesvär',
    ],
    section6Caption: 'Denne liste ar udelukkende till information – den ar inte en diagnose. Alla oplever en individuel kombination av disse ändringer.',
    section7Body: 'Nattesved kan väkke dig om natten och före till träthed och koncentrationsbesvär näste dag: dette ar et almindeligt mönster i denne periode.',
    infoCard2Title: 'Praktisk tip',
    infoCard2Text: 'Et köligt sovevärelse, lette nattöj och en fast sövnrutine kan hjälpe med at mindske disse natlige opvågninger.',
    section8Body: 'Hormonudsving kan falde sammen med humörändringer, men det ar inte den eneste forklaring: sövn, stress, livsbegivenheder och fysiske symtom spiller alla en rolle.',
    infoCard3Title: 'En beroligende tanke',
    infoCard3Text: 'At föle sig mere fölsom i denne periode ar inte ensbetydende med, at noget ar galt: det ar en almindelig oplevelse, der kan have flere samtidige årsager.',
    section9Body: 'I perimenopausen kan hormonniveauerne ändre sig markant fran dag till dag. En enkelt blodpröve giver derfor inte alltid et fuldständigt billede av situationen.',
    infoCard4Title: 'Vigtigt at huske',
    infoCard4Text: 'En medicinsk vurdering baserer sig primärt på din alder, dina symtom och din cyklushistorik – inte kun på et enkelt tal.',
    section10Body: 'At notere, hvad du oplever måned for måned, hjälper dig med at genkende dina egne mönstre frem for att sammenligne dig med andre:',
    trackingItems: [
      'Dine cyklusdatoer',
      'Dine symtom dag for dag',
      'Din sövn',
      'Dit humör',
      'Dine hedeture',
      'Ändringer i din blödning',
      'Hvad der ser ud till at udlöse visse symtom',
    ],
    tip2Title: 'En god vane',
    tip2Text: 'At fölge din cyklus i AWA kan hjälpe dig med at genkende dina egne mönstre over månederne – uden ekstra besvär.',
    section11Body: 'I de fleste av disse situationer ar det godt at booke en rutinekonsultation på et tidspunkt, der passer dig:',
    warningTitle: 'Värd at nävne for en fagperson',
    consultSituations: [
      'Symtom der markant påvirker din dagligdag',
      'Vedvarende sövnproblemer',
      'Meget ubehagelige hedeture',
      'Nye eller usädvanlige symtom',
      'Markante ändringer i din blödning',
      'Spörgsmål om behandlingsmuligheder',
      'Bekymringer om vaginal törhed eller ditt sexliv',
    ],
    infoCard5Title: 'Et särligt tilfälde',
    infoCard5Text: 'Meget kraftige eller usädvanlige blödninger bör derimod hurtigt nävnes for en halsasprofessionel.',
    section12Body: 'Afhängigt av situationen kan en fagperson foreslå forskellige muligheder:',
    solutions: [
      {
        title: 'Livsstilstiltag',
        text: 'Fysisk aktivitet, kost och håndtering av stress och sövn.',
      },
      {
        title: 'Ikke-hormonelle behandlinger',
        text: 'Visse muligheder kan rettes mod specifikke symtom afhängigt av situationen.',
      },
      {
        title: 'Hormonbehandling',
        text: 'Dröftes med din läge, hvis det passer till din situation och dina behov.',
      },
    ],
    section12Caption: 'Disse beslutninger ar personlige: de afhänger av din sygehistorie, dina symtom, dina risici och dina egne präferencer.',
    summaryPoints: [
      'Hormonforandringer ar en integreret del av menopauses overgang.',
      'I perimenopausen kan hormonniveauerne svinge markant – de falder inte jävnt i en ret linje.',
      'Symtomne varierer mycket fran person till person och fran måned till måned.',
      'At fölge dina symtom kan hjälpe dig med at genkende dina egne mönstre bedre.',
      'Når symtomne bliver sväre at håndtere, kan en halsasprofessionel hjälpe dig.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel erstatter inte personlig medicinsk rådgivning. Kontakt en halsasprofessionel ved tvivl.',
    shareMessage: 'Hormoner i overgangsalderen — AWA',
  },
} as const);

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
            <AwaIconButton
              accessibilityLabel={t('library.reader.back')}
              icon="chevron-left"
              iconSize={23}
              onPress={() => navigation.goBack()}
              variant="tonal"
            />

            <View style={styles.actions}>
              <AwaIconButton
                accessibilityLabel={
                  saved ? t('library.screen.removeBookmark') : t('library.screen.addBookmark')
                }
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

        {/* ==================================================================== */}
        {/* ARTICLE                                                             */}
        {/* ==================================================================== */}

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

          <AwaText variant="titleSmall" colorRole="onSurfaceVariant" style={styles.intro}>
            {content.intro}
          </AwaText>

          {/* -------------------------------------------------------------- */}
          {/* CONTENTS                                                        */}
          {/* -------------------------------------------------------------- */}

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

          {/* ================================================================= */}
          {/* SECTION 1                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.topics[0]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body}
          </AwaText>

          <View style={styles.normalGrid}>
            {content.keyHormones.map((item, index) => (
              <AwaCard variant="filled" padding="none" key={item.title} style={styles.normalCard}>
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={KEY_HORMONES_ICONS[index] as never}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="titleSmall" emphasized style={styles.normalTitle}>{item.title}</AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.normalText}>{item.text}</AwaText>
              </AwaCard>
            ))}
          </View>

          <AwaCard variant="filled" padding="none" style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <AwaText variant="titleSmall" emphasized>{content.infoCard1Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>
                {content.infoCard1Text}
              </AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.topics[1]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section2Body}
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

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.estrogenSymptoms.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="checkbox-blank-circle-outline"
                  size={14}
                  color={theme.colors.primary}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body2}
          </AwaText>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section4Body}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section4Body2}
          </AwaText>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section5Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.highlight}>
            <AwaText variant="bodyLarge" style={styles.highlightText}>
              {content.highlightText}
            </AwaText>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 6                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>6. {content.topics[5]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.commonSymptoms.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="checkbox-blank-circle-outline"
                  size={14}
                  color={theme.colors.primary}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.caption}>
            {content.section6Caption}
          </AwaText>

          {/* ================================================================= */}
          {/* SECTION 7                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>7. {content.topics[6]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section7Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.infoCard}>
            <MaterialDesignIcons
              name="weather-night"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <AwaText variant="titleSmall" emphasized>{content.infoCard2Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>
                {content.infoCard2Text}
              </AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 8                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>8. {content.topics[7]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section8Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.infoCard}>
            <MaterialDesignIcons
              name="heart-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <AwaText variant="titleSmall" emphasized>{content.infoCard3Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>
                {content.infoCard3Text}
              </AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 9                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>9. {content.topics[8]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section9Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.infoCard}>
            <MaterialDesignIcons
              name="test-tube"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <AwaText variant="titleSmall" emphasized>{content.infoCard4Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>
                {content.infoCard4Text}
              </AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 10                                                        */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>10. {content.topics[9]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section10Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.comfortCard}>
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

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.trackingText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

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

          {/* ================================================================= */}
          {/* SECTION 11                                                        */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>11. {content.topics[10]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section11Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <MaterialDesignIcons
                name="calendar-account-outline"
                size={22}
                color={theme.colors.primary}
              />

              <AwaText variant="titleSmall" emphasized colorRole="onSurfaceVariant" style={[styles.warningTitle, styles.warningTitleNeutral]}>
                {content.warningTitle}
              </AwaText>
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

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.warningText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.infoCard}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={23}
              color={theme.colors.warning}
            />

            <View style={styles.infoCopy}>
              <AwaText variant="titleSmall" emphasized>{content.infoCard5Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>
                {content.infoCard5Text}
              </AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 12                                                        */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            12. {content.topics[11]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section12Body}
          </AwaText>

          <View style={styles.normalGrid}>
            {content.solutions.map((item, index) => (
              <AwaCard variant="filled" padding="none" key={item.title} style={styles.normalCard}>
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={SOLUTIONS_ICONS[index] as never}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="titleSmall" emphasized style={styles.normalTitle}>{item.title}</AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.normalText}>{item.text}</AwaText>
              </AwaCard>
            ))}
          </View>

          <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.caption}>
            {content.section12Caption}
          </AwaText>

          {/* ================================================================= */}
          {/* SUMMARY                                                           */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>13. {content.topics[12]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
            {content.summaryPoints.map(item => (
              <View key={item} style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* DISCLAIMER                                                        */}
          {/* ================================================================= */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={18}
              color={theme.colors.textMuted}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.disclaimerText}>
              {content.disclaimerText}
            </AwaText>
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
    marginTop: 28,
  },
  body: {marginTop: 8},
  caption: {marginTop: 12, fontStyle: 'italic'},

  infoCard: {
    marginTop: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoCopy: {flex: 1, marginLeft: 8},
  infoText: {marginTop: 3},

  normalGrid: {marginTop: 12, gap: 8},
  normalCard: {
    padding: 12,
  },
  normalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  normalTitle: {marginTop: 8},
  normalText: {marginTop: 4},

  checkList: {
    marginTop: 12,
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkRow: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingRight: 8,
  },
  checkText: {flex: 1},

  highlight: {
    marginTop: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  highlightText: {
    fontStyle: 'italic',
    textAlign: 'center',
  },

  comfortCard: {
    marginTop: 12,
    paddingHorizontal: 12,
  },
  comfortRowBorder: {borderBottomWidth: 1, borderBottomColor: theme.colors.border},
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  trackingText: {flex: 1},

  warningCard: {
    marginTop: 12,
    padding: 16,
  },
  warningHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  warningTitle: {flex: 1, marginLeft: 8},
  warningTitleNeutral: {color: theme.colors.text},
  warningRow: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8},
  warningBullet: {width: 20, alignItems: 'flex-start'},
  warningText: {flex: 1, marginLeft: 4},

  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 4},

  summaryCard: {
    marginTop: 12,
    padding: 16,
  },
  summaryRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12},
  summaryText: {flex: 1},

  disclaimer: {
    marginTop: 20,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  disclaimerText: {flex: 1},
  });
}
