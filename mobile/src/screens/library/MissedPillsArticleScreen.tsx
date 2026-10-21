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

const ID = 'missedpills-que-faire-en-cas-doubli';

const HERO = require('../../assets/images/library/regular-cycle-consult.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const CHECK_ICONS = [
  'clock-outline',
  'file-document-outline',
  'shield-check-outline',
] as const;

const SITUATION_ICONS = ['pill', 'calendar-alert', 'help-circle-outline'] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('MissedPills', {
  fr: {
    shareMessage: 'Oubli de pilule : que faire ? — AWA',
    badge: 'OUBLI DE PILULE',
    title: 'Oubli de pilule :\nque faire ?',
    metaDuration: '7 min de lecture',
    metaType: 'FAQ',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro: 'Un oubli de pilule peut arriver à tout le monde. La conduite à tenir dépend principalement du délai depuis l’oubli, du type de pilule et du moment où celui-ci survient dans la plaquette.',
    importantTitle: 'Le point essentiel',
    importantText: 'Ne panique pas. Vérifie d’abord le type exact de ta pilule et consulte sa notice pour connaître la conduite recommandée.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Moins de 12 heures de retard',
      'Plus de 12 heures de retard',
      'Les situations qui demandent plus d’attention',
      'La notice reste la référence',
      'Quand demander conseil',
      'À retenir',
    ],
    body1: 'Pour certaines pilules, un retard inférieur à 12 heures ne compromet généralement pas la protection contraceptive. Dans ce cas, la recommandation habituelle est de prendre le comprimé oublié dès que possible puis de poursuivre la plaquette à l’heure habituelle.',
    step1Title: 'Prends le comprimé',
    step1Text: 'Prends le comprimé dès que tu constates le retard.',
    step2Title: 'Continue normalement',
    step2Text: 'Reprends ensuite ton rythme habituel pour les comprimés suivants.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Si tu as pris le comprimé oublié puis celui prévu à l’heure habituelle, il peut arriver que deux comprimés soient pris le même jour.',
    body2: 'Lorsque le retard dépasse le délai prévu pour ta pilule, la protection peut être diminuée. La conduite à tenir dépend alors du type de pilule, du nombre de comprimés oubliés et de l’emplacement de l’oubli dans la plaquette.',
    alertTitle: 'Attention',
    alertText: 'Ne te fie pas uniquement au nombre d’heures indiqué ici : certaines pilules ont des consignes différentes. Consulte toujours la notice de ton médicament.',
    reflexesTitle: 'Les premiers réflexes',
    checkPoints: [
      {title: 'Réagir rapidement', text: 'Plus tu réagis rapidement après avoir constaté l’oubli, plus il est facile de suivre les recommandations adaptées.'},
      {title: 'Vérifier la notice', text: 'Les consignes peuvent varier selon le type exact de pilule et le nombre de comprimés oubliés.'},
      {title: 'Prévoir une protection complémentaire', text: 'Dans certaines situations, un préservatif peut être recommandé pendant une période donnée.'},
    ],
    body3: 'Toutes les situations ne se ressemblent pas. Certains oublis nécessitent une vérification plus précise des recommandations.',
    situations: [
      {title: 'Un seul comprimé oublié', text: 'La conduite à tenir dépend principalement du délai depuis l’heure habituelle de prise.'},
      {title: 'Plusieurs comprimés oubliés', text: 'La situation nécessite une attention particulière et il est préférable de vérifier précisément la notice.'},
      {title: 'Doute sur la conduite à tenir', text: 'Une pharmacie ou un professionnel de santé peut t’aider rapidement à identifier la bonne conduite.'},
    ],
    body4: 'La notice de ta pilule donne les consignes précises correspondant au médicament que tu prends. Les recommandations peuvent être différentes selon qu’il s’agit d’une pilule combinée ou d’une pilule progestative seule.',
    referenceTitle: 'Vérifications utiles',
    referenceTips: [
      'Garder la notice accessible (photo dans le téléphone, par exemple)',
      'Contacter une pharmacienne en cas de doute rapide',
      'Consulter si l’oubli se répète souvent',
    ],
    guideTitle: 'Pourquoi le moment de l’oubli compte ?',
    guideText: 'Le moment où survient l’oubli dans la plaquette peut modifier la conduite à tenir. C’est pourquoi la notice précise souvent des recommandations différentes selon la semaine de prise.',
    body5: 'Si tu ne sais pas quelle conduite adopter, mieux vaut demander conseil plutôt que de rester dans le doute. Une pharmacie, une sage-femme ou un médecin peut t’aider à vérifier les recommandations adaptées à ta situation.',
    questionTitle: 'Les informations à préparer',
    questions: [
      'Quel type de pilule est-ce exactement ?',
      'Combien de temps s’est écoulé depuis l’heure habituelle ?',
      'Combien de comprimés ont été oubliés ?',
      'À quel moment de la plaquette l’oubli a-t-il eu lieu ?',
      'Y a-t-il eu un rapport sexuel non protégé récemment ?',
    ],
    proTipTitle: 'Bon à savoir',
    proTipText: 'Si un rapport sexuel non protégé a eu lieu autour de la période de l’oubli, demande rapidement conseil à un professionnel afin de connaître les options possibles.',
    repeatTitle: 'Si les oublis se répètent',
    body6: 'Des oublis fréquents peuvent être le signe que le mode de prise quotidien ne correspond pas parfaitement à ton rythme de vie. N’hésite pas à en parler avec un professionnel de santé afin d’explorer d’autres options contraceptives.',
    methodTipTitle: 'Une autre méthode ?',
    methodTipText: 'Si prendre un comprimé chaque jour est difficile à maintenir, il existe d’autres méthodes avec une fréquence d’utilisation différente.',
    summaryTitle: 'L’essentiel',
    summaryItems: [
      'Réagis dès que tu constates l’oubli.',
      'Vérifie le type exact de ta pilule.',
      'Consulte la notice pour connaître la conduite précise.',
      'Utilise une protection complémentaire si la notice le recommande.',
      'Demande conseil en cas de doute ou de rapport à risque.',
    ],
    finalTipTitle: 'À retenir',
    finalTipText: 'Un oubli ne signifie pas automatiquement que ta contraception ne fonctionne plus. La bonne conduite dépend du type de pilule et des circonstances de l’oubli. En cas de doute, vérifie la notice et demande conseil rapidement.',
    disclaimerText: 'Cet article est fourni à titre informatif et ne remplace pas la notice de ton médicament ni un avis médical personnalisé. Les recommandations peuvent varier selon le type de pilule.',
  },
  en: {
    shareMessage: 'Missed pill: what to do? — AWA',
    badge: 'MISSED PILL',
    title: 'Missed pill:\nwhat to do?',
    metaDuration: '7 min read',
    metaType: 'FAQ',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro: 'A missed pill can happen to anyone. What to do mainly depends on how long ago you missed it, the type of pill, and when in the pack it happens.',
    importantTitle: 'The key point',
    importantText: 'Don’t panic. First check the exact type of your pill and check its package insert to find out the recommended course of action.',
    contentsTitle: 'In this article',
    topics: [
      'Less than 12 hours late',
      'More than 12 hours late',
      'Situations that need extra attention',
      'The package insert is your reference',
      'When to ask for advice',
      'Key takeaways',
    ],
    body1: 'For some pills, a delay of less than 12 hours generally doesn’t compromise contraceptive protection. In this case, the usual recommendation is to take the missed pill as soon as possible and then continue the pack at the usual time.',
    step1Title: 'Take the pill',
    step1Text: 'Take the pill as soon as you notice you’re late.',
    step2Title: 'Continue as usual',
    step2Text: 'Then go back to your usual schedule for the following pills.',
    tip1Title: 'Good to know',
    tip1Text: 'If you take the missed pill and then the one scheduled for the usual time, it can happen that two pills are taken on the same day.',
    body2: 'When the delay exceeds the time allowed for your pill, protection may be reduced. What to do then depends on the type of pill, the number of pills missed, and where in the pack the missed pill falls.',
    alertTitle: 'Warning',
    alertText: 'Don’t rely only on the number of hours given here: some pills have different instructions. Always check your medication’s package insert.',
    reflexesTitle: 'First things to do',
    checkPoints: [
      {title: 'React quickly', text: 'The more quickly you react after noticing the missed pill, the easier it is to follow the appropriate recommendations.'},
      {title: 'Check the package insert', text: 'The instructions can vary depending on the exact type of pill and the number of pills missed.'},
      {title: 'Plan for backup protection', text: 'In some situations, a condom may be recommended for a given period.'},
    ],
    body3: 'Not all situations are alike. Some missed pills call for a more precise check of the recommendations.',
    situations: [
      {title: 'Only one pill missed', text: 'What to do mainly depends on the time elapsed since the usual time of taking it.'},
      {title: 'More than one pill missed', text: 'This situation needs particular attention, and it’s best to check the package insert precisely.'},
      {title: 'Not sure what to do', text: 'A pharmacist or healthcare professional can quickly help you identify the right course of action.'},
    ],
    body4: 'Your pill’s package insert gives the precise instructions for the medication you’re taking. Recommendations can differ depending on whether it’s a combined pill or a progestin-only pill.',
    referenceTitle: 'Useful things to check',
    referenceTips: [
      'Keep the package insert handy (a photo on your phone, for example)',
      'Contact a pharmacist if you have a quick question',
      'See a doctor if it happens often',
    ],
    guideTitle: 'Why does the timing of the missed pill matter?',
    guideText: 'When the missed pill falls in the pack can change what to do. That’s why the package insert often gives different recommendations depending on the week of the pack.',
    body5: 'If you don’t know what to do, it’s better to ask for advice than to stay in doubt. A pharmacist, midwife, or doctor can help you check the recommendations suited to your situation.',
    questionTitle: 'Information to have ready',
    questions: [
      'What exact type of pill is it?',
      'How much time has passed since the usual time?',
      'How many pills were missed?',
      'At what point in the pack did the missed pill happen?',
      'Has there been unprotected sex recently?',
    ],
    proTipTitle: 'Good to know',
    proTipText: 'If unprotected sex happened around the time of the missed pill, ask a professional for advice quickly to find out what options are available.',
    repeatTitle: 'If you keep missing pills',
    body6: 'Frequent missed pills can be a sign that the daily routine doesn’t quite fit your lifestyle. Don’t hesitate to talk to a healthcare professional to explore other contraceptive options.',
    methodTipTitle: 'A different method?',
    methodTipText: 'If taking a pill every day is hard to keep up, other methods exist with a different frequency of use.',
    summaryTitle: 'The essentials',
    summaryItems: [
      'React as soon as you notice the missed pill.',
      'Check the exact type of your pill.',
      'Check the package insert to find out the precise course of action.',
      'Use backup protection if the package insert recommends it.',
      'Ask for advice if in doubt or after a risky encounter.',
    ],
    finalTipTitle: 'Key takeaways',
    finalTipText: 'A missed pill doesn’t automatically mean your contraception has stopped working. The right course of action depends on the type of pill and the circumstances of the missed dose. If in doubt, check the package insert and ask for advice quickly.',
    disclaimerText: 'This article is provided for informational purposes only and does not replace your medication’s package insert or personalized medical advice. Recommendations may vary depending on the type of pill.',
  },
  es: {
    shareMessage: 'Olvido de la píldora: ¿qué hacer? — AWA',
    badge: 'OLVIDO DE PÍLDORA',
    title: 'Olvido de la píldora:\n¿qué hacer?',
    metaDuration: '7 min de lectura',
    metaType: 'FAQ',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido validado',
    intro: 'Un olvido de píldora puede pasarle a cualquiera. La actuación a seguir depende principalmente del tiempo transcurrido desde el olvido, del tipo de píldora y del momento en que este se produce dentro del blíster.',
    importantTitle: 'El punto esencial',
    importantText: 'No entres en pánico. Primero comprueba el tipo exacto de tu píldora y consulta su prospecto para conocer la actuación recomendada.',
    contentsTitle: 'En este artículo',
    topics: [
      'Menos de 12 horas de retraso',
      'Más de 12 horas de retraso',
      'Las situaciones que requieren más atención',
      'El prospecto sigue siendo la referencia',
      'Cuándo pedir consejo',
      'Lo esencial',
    ],
    body1: 'En algunas píldoras, un retraso inferior a 12 horas generalmente no compromete la protección anticonceptiva. En ese caso, la recomendación habitual es tomar el comprimido olvidado lo antes posible y luego continuar el blíster a la hora habitual.',
    step1Title: 'Toma el comprimido',
    step1Text: 'Toma el comprimido en cuanto detectes el retraso.',
    step2Title: 'Continúa con normalidad',
    step2Text: 'Retoma después tu ritmo habitual para los comprimidos siguientes.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Si tomaste el comprimido olvidado y luego el previsto para la hora habitual, puede ocurrir que se tomen dos comprimidos el mismo día.',
    body2: 'Cuando el retraso supera el plazo previsto para tu píldora, la protección puede disminuir. La actuación a seguir depende entonces del tipo de píldora, del número de comprimidos olvidados y del momento del olvido dentro del blíster.',
    alertTitle: 'Atención',
    alertText: 'No te bases únicamente en el número de horas indicado aquí: algunas píldoras tienen instrucciones diferentes. Consulta siempre el prospecto de tu medicamento.',
    reflexesTitle: 'Los primeros reflejos',
    checkPoints: [
      {title: 'Reaccionar rápidamente', text: 'Cuanto más rápido reacciones después de notar el olvido, más fácil será seguir las recomendaciones adecuadas.'},
      {title: 'Comprobar el prospecto', text: 'Las instrucciones pueden variar según el tipo exacto de píldora y el número de comprimidos olvidados.'},
      {title: 'Prever una protección complementaria', text: 'En algunas situaciones, puede recomendarse el uso de un preservativo durante un período determinado.'},
    ],
    body3: 'No todas las situaciones son iguales. Algunos olvidos requieren una comprobación más precisa de las recomendaciones.',
    situations: [
      {title: 'Un solo comprimido olvidado', text: 'La actuación a seguir depende principalmente del tiempo transcurrido desde la hora habitual de la toma.'},
      {title: 'Varios comprimidos olvidados', text: 'La situación requiere una atención especial y es preferible comprobar con precisión el prospecto.'},
      {title: 'Duda sobre la actuación a seguir', text: 'Una farmacia o un profesional de la salud puede ayudarte rápidamente a identificar la actuación correcta.'},
    ],
    body4: 'El prospecto de tu píldora da las instrucciones precisas correspondientes al medicamento que tomas. Las recomendaciones pueden diferir según se trate de una píldora combinada o de una píldora de progestágeno solo.',
    referenceTitle: 'Comprobaciones útiles',
    referenceTips: [
      'Guarda el prospecto accesible (por ejemplo, una foto en el teléfono)',
      'Contacta con una farmacéutica en caso de duda rápida',
      'Consulta si el olvido se repite con frecuencia',
    ],
    guideTitle: '¿Por qué importa el momento del olvido?',
    guideText: 'El momento en que ocurre el olvido dentro del blíster puede modificar la actuación a seguir. Por eso el prospecto suele indicar recomendaciones diferentes según la semana de toma.',
    body5: 'Si no sabes qué actuación adoptar, es mejor pedir consejo que quedarte con la duda. Una farmacia, una matrona o un médico puede ayudarte a comprobar las recomendaciones adaptadas a tu situación.',
    questionTitle: 'La información que debes preparar',
    questions: [
      '¿Qué tipo de píldora es exactamente?',
      '¿Cuánto tiempo ha pasado desde la hora habitual?',
      '¿Cuántos comprimidos se han olvidado?',
      '¿En qué momento del blíster se produjo el olvido?',
      '¿Ha habido alguna relación sexual sin protección recientemente?',
    ],
    proTipTitle: 'DATO ÚTIL',
    proTipText: 'Si ha habido una relación sexual sin protección alrededor del período del olvido, pide consejo rápidamente a un profesional para conocer las opciones posibles.',
    repeatTitle: 'Si los olvidos se repiten',
    body6: 'Los olvidos frecuentes pueden ser una señal de que la forma de toma diaria no se ajusta bien a tu ritmo de vida. No dudes en hablarlo con un profesional de la salud para explorar otras opciones anticonceptivas.',
    methodTipTitle: '¿Otro método?',
    methodTipText: 'Si tomar un comprimido cada día resulta difícil de mantener, existen otros métodos con una frecuencia de uso diferente.',
    summaryTitle: 'Lo esencial',
    summaryItems: [
      'Reacciona en cuanto detectes el olvido.',
      'Comprueba el tipo exacto de tu píldora.',
      'Consulta el prospecto para conocer la actuación precisa.',
      'Usa una protección complementaria si el prospecto lo recomienda.',
      'Pide consejo en caso de duda o de relación de riesgo.',
    ],
    finalTipTitle: 'Para recordar',
    finalTipText: 'Un olvido no significa automáticamente que tu anticoncepción haya dejado de funcionar. La actuación correcta depende del tipo de píldora y de las circunstancias del olvido. En caso de duda, consulta el prospecto y pide consejo rápidamente.',
    disclaimerText: 'Este artículo se ofrece con fines informativos y no sustituye el prospecto de tu medicamento ni un consejo médico personalizado. Las recomendaciones pueden variar según el tipo de píldora.',
  },
  it: {
    shareMessage: 'Pillola dimenticata: cosa fare? — AWA',
    badge: 'PILLOLA DIMENTICATA',
    title: 'Pillola dimenticata:\ncosa fare?',
    metaDuration: '7 min di lettura',
    metaType: 'FAQ',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenuto validato',
    intro: 'Dimenticare una pillola può succedere a chiunque. Cosa fare dipende soprattutto da quanto tempo è passato, dal tipo di pillola e da quando avviene nel corso della confezione.',
    importantTitle: 'Il punto chiave',
    importantText: 'Niente panico. Per prima cosa verifica il tipo esatto della tua pillola e consulta il foglietto illustrativo per sapere come comportarti.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Meno di 12 ore di ritardo',
      'Più di 12 ore di ritardo',
      'Situazioni che richiedono particolare attenzione',
      'Il foglietto illustrativo è il tuo riferimento',
      'Quando chiedere un parere',
      'Punti chiave',
    ],
    body1: 'Per alcune pillole, un ritardo di meno di 12 ore in genere non compromette la protezione contraccettiva. In questo caso, l’indicazione abituale è di assumere la pillola dimenticata il prima possibile e poi proseguire la confezione all’orario consueto.',
    step1Title: 'Prendi la pillola',
    step1Text: 'Prendi la pillola appena ti accorgi di essere in ritardo.',
    step2Title: 'Prosegui come di consueto',
    step2Text: 'Poi torna al tuo orario abituale per le pillole successive.',
    tip1Title: 'Da sapere',
    tip1Text: 'Se prendi la pillola dimenticata e poi quella prevista all’orario abituale, può capitare di assumere due pillole nello stesso giorno.',
    body2: 'Quando il ritardo supera il tempo consentito per la tua pillola, la protezione può essere ridotta. Cosa fare in quel caso dipende dal tipo di pillola, dal numero di pillole dimenticate e dal punto della confezione in cui cade la dimenticanza.',
    alertTitle: 'Attenzione',
    alertText: 'Non fare affidamento solo sul numero di ore indicato qui: alcune pillole hanno istruzioni diverse. Controlla sempre il foglietto illustrativo del tuo medicinale.',
    reflexesTitle: 'Le prime cose da fare',
    checkPoints: [
      {
        title: 'Reagire in fretta',
        text: 'Più rapidamente reagisci dopo esserti accorta della dimenticanza, più è facile seguire le indicazioni appropriate.',
      },
      {
        title: 'Controllare il foglietto illustrativo',
        text: 'Le istruzioni possono variare a seconda del tipo esatto di pillola e del numero di pillole dimenticate.',
      },
      {
        title: 'Prevedere una protezione aggiuntiva',
        text: 'In alcune situazioni, può essere consigliato il preservativo per un determinato periodo.',
      },
    ],
    body3: 'Le situazioni non sono tutte uguali. Alcune dimenticanze richiedono una verifica più precisa delle indicazioni.',
    situations: [
      {
        title: 'Una sola pillola dimenticata',
        text: 'Cosa fare dipende soprattutto dal tempo trascorso rispetto all’orario abituale di assunzione.',
      },
      {
        title: 'Più di una pillola dimenticata',
        text: 'Questa situazione richiede particolare attenzione ed è meglio controllare con precisione il foglietto illustrativo.',
      },
      {
        title: 'Non sei sicura di cosa fare',
        text: 'Un farmacista o un operatore sanitario può aiutarti rapidamente a individuare il comportamento giusto.',
      },
    ],
    body4: 'Il foglietto illustrativo della tua pillola riporta le istruzioni precise per il medicinale che stai assumendo. Le indicazioni possono differire a seconda che si tratti di una pillola combinata o di una pillola a base di solo progestinico.',
    referenceTitle: 'Cose utili da verificare',
    referenceTips: [
      'Tieni a portata di mano il foglietto illustrativo (per esempio una foto sul telefono)',
      'Rivolgiti a un farmacista se hai una domanda veloce',
      'Consulta un medico se succede spesso',
    ],
    guideTitle: 'Perché conta il momento in cui hai dimenticato la pillola?',
    guideText: 'Il punto della confezione in cui cade la dimenticanza può cambiare ciò che occorre fare. Per questo il foglietto illustrativo spesso riporta indicazioni diverse a seconda della settimana della confezione.',
    body5: 'Se non sai cosa fare, è meglio chiedere consiglio piuttosto che restare nel dubbio. Un farmacista, un’ostetrica o un medico possono aiutarti a verificare le indicazioni adatte alla tua situazione.',
    questionTitle: 'Informazioni da avere a portata di mano',
    questions: [
      'Di che tipo esatto di pillola si tratta?',
      'Quanto tempo è passato rispetto all’orario abituale?',
      'Quante pillole sono state dimenticate?',
      'In quale punto della confezione è avvenuta la dimenticanza?',
      'Ci sono stati rapporti non protetti di recente?',
    ],
    proTipTitle: 'Da sapere',
    proTipText: 'Se ci sono stati rapporti non protetti in prossimità della pillola dimenticata, chiedi presto consiglio a un professionista per sapere quali opzioni sono disponibili.',
    repeatTitle: 'Se continui a dimenticare le pillole',
    body6: 'Dimenticanze frequenti possono essere un segnale che la routine quotidiana non si adatta del tutto al tuo stile di vita. Non esitare a parlarne con un operatore sanitario per valutare altre opzioni contraccettive.',
    methodTipTitle: 'Un metodo diverso?',
    methodTipText: 'Se prendere una pillola ogni giorno è difficile da mantenere, esistono altri metodi con una frequenza d’uso diversa.',
    summaryTitle: 'L’essenziale',
    summaryItems: [
      'Reagisci non appena ti accorgi della dimenticanza.',
      'Verifica il tipo esatto della tua pillola.',
      'Controlla il foglietto illustrativo per sapere come comportarti con precisione.',
      'Usa una protezione aggiuntiva se il foglietto illustrativo la raccomanda.',
      'Chiedi consiglio in caso di dubbi o dopo un rapporto a rischio.',
    ],
    finalTipTitle: 'Punti chiave',
    finalTipText: 'Dimenticare una pillola non significa automaticamente che la tua contraccezione abbia smesso di funzionare. Il comportamento giusto dipende dal tipo di pillola e dalle circostanze della dimenticanza. In caso di dubbi, controlla il foglietto illustrativo e chiedi presto consiglio.',
    disclaimerText: 'Questo articolo ha uno scopo esclusivamente informativo e non sostituisce il foglietto illustrativo del tuo medicinale né un parere medico personalizzato. Le indicazioni possono variare a seconda del tipo di pillola.',
  },
  tr: {
    shareMessage: 'Unutulan hap: ne yapmalı? — AWA',
    badge: 'UNUTULAN HAP',
    title: 'Unutulan hap:\nne yapmalı?',
    metaDuration: '7 dk okuma',
    metaType: 'SSS',
    metaLevel: 'Orta düzey',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Hap almayı unutmak herkesin başına gelebilir. Ne yapacağın esas olarak ne kadar süre önce unuttuğuna, hapın türüne ve bunun kutunun hangi aşamasında olduğuna bağlıdır.',
    importantTitle: 'Önemli nokta',
    importantText: 'Paniğe kapılma. Önce hapının kesin türünü kontrol et ve önerilen davranışı öğrenmek için kullanma talimatına bak.',
    contentsTitle: 'Bu makalede',
    topics: [
      '12 saatten az gecikme',
      '12 saatten fazla gecikme',
      'Ekstra dikkat gerektiren durumlar',
      'Kullanma talimatı senin başvuru kaynağın',
      'Ne zaman tavsiye almalı',
      'Akılda tutulacaklar',
    ],
    body1: 'Bazı haplarda 12 saatten kısa bir gecikme genellikle doğum kontrolü korumasını bozmaz. Bu durumda olağan öneri, unutulan hapı mümkün olan en kısa sürede almak ve ardından kutuya her zamanki saatte devam etmektir.',
    step1Title: 'Hapı al',
    step1Text: 'Geciktiğini fark eder etmez hapı al.',
    step2Title: 'Her zamanki gibi devam et',
    step2Text: 'Ardından sonraki haplar için olağan düzenine dön.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Unutulan hapı alıp ardından olağan saatte alınması gereken hapı da alırsan, aynı gün içinde iki hap alınmış olabilir.',
    body2: 'Gecikme hapın için izin verilen süreyi aştığında koruma azalmış olabilir. O durumda ne yapılacağı hapın türüne, unutulan hap sayısına ve unutulan hapın kutunun neresine denk geldiğine bağlıdır.',
    alertTitle: 'Uyarı',
    alertText: 'Burada verilen saat sayısına tek başına güvenme: bazı hapların talimatları farklıdır. İlacının kullanma talimatını her zaman kontrol et.',
    reflexesTitle: 'İlk yapılacaklar',
    checkPoints: [
      {
        title: 'Hızlı davran',
        text: 'Hapı unuttuğunu fark ettikten sonra ne kadar hızlı davranırsan, uygun önerileri izlemen o kadar kolay olur.',
      },
      {
        title: 'Kullanma talimatını kontrol et',
        text: 'Talimatlar hapın kesin türüne ve unutulan hap sayısına göre değişebilir.',
      },
      {
        title: 'Yedek koruma düşün',
        text: 'Bazı durumlarda belirli bir süre için kondom önerilebilir.',
      },
    ],
    body3: 'Her durum birbirine benzemez. Bazı unutulan haplar, önerilerin daha ayrıntılı kontrol edilmesini gerektirir.',
    situations: [
      {
        title: 'Yalnızca bir hap unutuldu',
        text: 'Ne yapılacağı esas olarak hapın olağan alma saatinden bu yana geçen süreye bağlıdır.',
      },
      {
        title: 'Birden fazla hap unutuldu',
        text: 'Bu durum özel dikkat gerektirir ve kullanma talimatını ayrıntılı olarak kontrol etmek en iyisidir.',
      },
      {
        title: 'Ne yapacağından emin değilsin',
        text: 'Bir eczacı veya sağlık profesyoneli, doğru davranışı hızlıca belirlemene yardımcı olabilir.',
      },
    ],
    body4: 'Hapının kullanma talimatı, kullandığın ilaç için kesin yönergeleri verir. Öneriler, kombine bir hap mı yoksa yalnızca progestin içeren bir hap mı olduğuna göre farklılık gösterebilir.',
    referenceTitle: 'Kontrol etmeye değer şeyler',
    referenceTips: [
      'Kullanma talimatını elinin altında tut (örneğin telefonunda bir fotoğrafı)',
      'Hızlı bir sorun varsa bir eczacıya başvur',
      'Sık oluyorsa bir doktora git',
    ],
    guideTitle: 'Unutulan hapın zamanlaması neden önemli?',
    guideText: 'Unutulan hapın kutunun neresine denk geldiği, ne yapılacağını değiştirebilir. Bu nedenle kullanma talimatı çoğu zaman kutunun haftasına göre farklı öneriler verir.',
    body5: 'Ne yapacağını bilmiyorsan, tereddütte kalmaktansa tavsiye istemek daha iyidir. Bir eczacı, ebe veya doktor, durumuna uygun önerileri kontrol etmene yardımcı olabilir.',
    questionTitle: 'Hazır tutulacak bilgiler',
    questions: [
      'Hapın kesin türü nedir?',
      'Olağan saatten bu yana ne kadar süre geçti?',
      'Kaç hap unutuldu?',
      'Hap kutunun hangi aşamasında unutuldu?',
      'Yakın zamanda korunmasız cinsel ilişki oldu mu?',
    ],
    proTipTitle: 'Bilmekte fayda var',
    proTipText: 'Hap unutulduğu sıralarda korunmasız cinsel ilişki olduysa, hangi seçeneklerin bulunduğunu öğrenmek için hızlıca bir profesyonelden tavsiye iste.',
    repeatTitle: 'Sürekli hap unutuyorsan',
    body6: 'Sık sık hap unutmak, günlük rutinin yaşam tarzına pek uymadığının bir işareti olabilir. Diğer doğum kontrol seçeneklerini araştırmak için bir sağlık profesyoneliyle konuşmaktan çekinme.',
    methodTipTitle: 'Farklı bir yöntem mi?',
    methodTipText: 'Her gün hap almayı sürdürmek zorsa, farklı kullanım sıklığına sahip başka yöntemler de vardır.',
    summaryTitle: 'Özetle',
    summaryItems: [
      'Hapı unuttuğunu fark eder etmez harekete geç.',
      'Hapının kesin türünü kontrol et.',
      'Kesin davranışı öğrenmek için kullanma talimatını kontrol et.',
      'Kullanma talimatı öneriyorsa yedek koruma kullan.',
      'Şüphede kalırsan veya riskli bir ilişkiden sonra tavsiye iste.',
    ],
    finalTipTitle: 'Akılda tutulacaklar',
    finalTipText: 'Bir hapı unutmak, doğum kontrolünün kendiliğinden işlevini yitirdiği anlamına gelmez. Doğru davranış, hapın türüne ve unutulan dozun koşullarına bağlıdır. Şüphen varsa kullanma talimatını kontrol et ve hızlıca tavsiye iste.',
    disclaimerText: 'Bu makale yalnızca bilgilendirme amacıyla sunulmuştur; ilacının kullanma talimatının veya kişiye özel tıbbi tavsiyenin yerini tutmaz. Öneriler hapın türüne göre değişebilir.',
  },
  ru: {
    shareMessage: 'Пропущена таблетка: что делать? — AWA',
    badge: 'ПРОПУЩЕННАЯ ТАБЛЕТКА',
    title: 'Пропущена таблетка:\nчто делать?',
    metaDuration: '7 мин чтения',
    metaType: 'Вопросы и ответы',
    metaLevel: 'Средний уровень',
    metaValidated: 'Проверенный материал',
    intro: 'Пропустить таблетку может любая женщина. Что делать, зависит прежде всего от того, сколько времени прошло, от вида таблеток и от того, на каком этапе упаковки это произошло.',
    importantTitle: 'Главное',
    importantText: 'Не паникуйте. Сначала уточните точный вид ваших таблеток и прочитайте инструкцию в упаковке, чтобы узнать рекомендуемые действия.',
    contentsTitle: 'В этой статье',
    topics: [
      'Опоздание менее чем на 12 часов',
      'Опоздание более чем на 12 часов',
      'Ситуации, требующие особого внимания',
      'Инструкция в упаковке — ваш ориентир',
      'Когда обратиться за советом',
      'Главные выводы',
    ],
    body1: 'Для некоторых таблеток опоздание менее чем на 12 часов, как правило, не снижает контрацептивную защиту. В этом случае обычно рекомендуется принять пропущенную таблетку как можно скорее, а затем продолжить приём из упаковки в обычное время.',
    step1Title: 'Примите таблетку',
    step1Text: 'Примите таблетку, как только заметили, что опоздали.',
    step2Title: 'Продолжайте как обычно',
    step2Text: 'Затем вернитесь к своему обычному графику приёма следующих таблеток.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Если вы примете пропущенную таблетку, а затем таблетку, назначенную на обычное время, в один день могут оказаться приняты две таблетки.',
    body2: 'Если опоздание превышает допустимое для вашей таблетки время, защита может быть снижена. Что делать в этом случае, зависит от вида таблеток, количества пропущенных таблеток и того, на каком этапе упаковки произошёл пропуск.',
    alertTitle: 'Внимание',
    alertText: 'Не ориентируйтесь только на указанное здесь количество часов: у некоторых таблеток инструкции отличаются. Всегда проверяйте инструкцию к вашему препарату.',
    reflexesTitle: 'Что сделать в первую очередь',
    checkPoints: [
      {title: 'Действуйте быстро', text: 'Чем быстрее вы отреагируете после того, как заметили пропуск, тем проще будет следовать подходящим рекомендациям.'},
      {title: 'Проверьте инструкцию', text: 'Рекомендации могут различаться в зависимости от точного вида таблеток и количества пропущенных таблеток.'},
      {title: 'Предусмотрите дополнительную защиту', text: 'В некоторых ситуациях на определённый период может быть рекомендован презерватив.'},
    ],
    body3: 'Все ситуации разные. В некоторых случаях пропуск таблетки требует более внимательной проверки рекомендаций.',
    situations: [
      {title: 'Пропущена только одна таблетка', text: 'Что делать, зависит прежде всего от того, сколько времени прошло с обычного времени приёма.'},
      {title: 'Пропущено больше одной таблетки', text: 'Эта ситуация требует особого внимания, и лучше внимательно изучить инструкцию в упаковке.'},
      {title: 'Не знаете, как поступить', text: 'Фармацевт или медицинский специалист быстро поможет вам определить, как действовать правильно.'},
    ],
    body4: 'В инструкции к вашим таблеткам даны точные указания для принимаемого вами препарата. Рекомендации могут различаться в зависимости от того, комбинированные это таблетки или таблетки, содержащие только прогестаген.',
    referenceTitle: 'Что полезно проверить',
    referenceTips: [
      'Держите инструкцию под рукой (например, фото в телефоне)',
      'Обратитесь к фармацевту, если у вас возник быстрый вопрос',
      'Обратитесь к врачу, если это случается часто',
    ],
    guideTitle: 'Почему важно, когда произошёл пропуск?',
    guideText: 'То, на каком этапе упаковки пропущена таблетка, может изменить порядок действий. Поэтому в инструкции часто даются разные рекомендации в зависимости от недели приёма.',
    body5: 'Если вы не знаете, как поступить, лучше попросить совета, чем оставаться в сомнениях. Фармацевт, акушерка или врач помогут вам уточнить рекомендации, подходящие для вашей ситуации.',
    questionTitle: 'Что стоит подготовить',
    questions: [
      'Какой именно вид таблеток вы принимаете?',
      'Сколько времени прошло с обычного времени приёма?',
      'Сколько таблеток было пропущено?',
      'На каком этапе упаковки произошёл пропуск?',
      'Был ли недавно незащищённый половой акт?',
    ],
    proTipTitle: 'Полезно знать',
    proTipText: 'Если незащищённый половой акт произошёл примерно в период пропуска таблетки, быстро обратитесь за советом к специалисту, чтобы узнать, какие есть варианты.',
    repeatTitle: 'Если пропуски повторяются',
    body6: 'Частые пропуски таблеток могут означать, что ежедневный приём не очень подходит вашему образу жизни. Не стесняйтесь поговорить с медицинским специалистом, чтобы рассмотреть другие способы контрацепции.',
    methodTipTitle: 'Другой метод?',
    methodTipText: 'Если принимать таблетку каждый день трудно, существуют другие методы с иной периодичностью применения.',
    summaryTitle: 'Самое важное',
    summaryItems: [
      'Действуйте, как только заметили пропуск таблетки.',
      'Проверьте точный вид ваших таблеток.',
      'Прочитайте инструкцию, чтобы узнать точный порядок действий.',
      'Используйте дополнительную защиту, если это рекомендует инструкция.',
      'Попросите совета, если сомневаетесь или после рискованного контакта.',
    ],
    finalTipTitle: 'Главные выводы',
    finalTipText: 'Пропущенная таблетка не означает автоматически, что контрацепция перестала действовать. Правильные действия зависят от вида таблеток и обстоятельств пропуска. Если сомневаетесь, проверьте инструкцию и быстро обратитесь за советом.',
    disclaimerText: 'Эта статья носит исключительно информационный характер и не заменяет инструкцию к вашему препарату или индивидуальную медицинскую консультацию. Рекомендации могут различаться в зависимости от вида таблеток.',
  },
  de: {
    shareMessage: 'Pille vergessen: Was tun? — AWA',
    badge: 'PILLE VERGESSEN',
    title: 'Pille vergessen:\nWas tun?',
    metaDuration: '7 Min. Lesezeit',
    metaType: 'Häufige Fragen',
    metaLevel: 'Fortgeschritten',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Eine vergessene Pille kann jeder passieren. Was du tun solltest, hängt vor allem davon ab, wie lange die Einnahme zurückliegt, um welche Pille es sich handelt und wann in der Packung es passiert.',
    importantTitle: 'Das Wichtigste',
    importantText: 'Keine Panik. Prüfe zuerst, um welche Pille genau es sich handelt, und lies im Beipackzettel nach, was empfohlen wird.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Weniger als 12 Stunden verspätet',
      'Mehr als 12 Stunden verspätet',
      'Situationen, die mehr Aufmerksamkeit brauchen',
      'Der Beipackzettel ist deine Referenz',
      'Wann du dir Rat holen solltest',
      'Das Wichtigste in Kürze',
    ],
    body1: 'Bei manchen Pillen beeinträchtigt eine Verspätung von weniger als 12 Stunden den Verhütungsschutz in der Regel nicht. In diesem Fall wird üblicherweise empfohlen, die vergessene Pille so schnell wie möglich einzunehmen und die Packung dann zur gewohnten Zeit weiterzunehmen.',
    step1Title: 'Pille einnehmen',
    step1Text: 'Nimm die Pille ein, sobald du die Verspätung bemerkst.',
    step2Title: 'Wie gewohnt weitermachen',
    step2Text: 'Danach nimmst du die folgenden Pillen wieder im gewohnten Rhythmus.',
    tip1Title: 'GUT ZU WISSEN',
    tip1Text: 'Wenn du die vergessene Pille und dann die Pille zur gewohnten Zeit einnimmst, kann es vorkommen, dass du am selben Tag zwei Pillen nimmst.',
    body2: 'Wenn die Verspätung die für deine Pille vorgesehene Zeitspanne überschreitet, kann der Schutz verringert sein. Was du dann tun solltest, hängt von der Art der Pille, der Anzahl der vergessenen Pillen und der Stelle in der Packung ab, an der die Pille vergessen wurde.',
    alertTitle: 'Achtung',
    alertText: 'Verlass dich nicht allein auf die hier genannte Stundenzahl: Manche Pillen haben andere Vorgaben. Lies immer den Beipackzettel deines Medikaments.',
    reflexesTitle: 'Die ersten Schritte',
    checkPoints: [
      {title: 'Schnell reagieren', text: 'Je schneller du nach dem Bemerken der vergessenen Pille reagierst, desto leichter lassen sich die passenden Empfehlungen befolgen.'},
      {title: 'Beipackzettel prüfen', text: 'Die Angaben können je nach genauer Pillenart und Anzahl der vergessenen Pillen unterschiedlich sein.'},
      {title: 'Zusätzlichen Schutz einplanen', text: 'In manchen Situationen kann für einen bestimmten Zeitraum ein Kondom empfohlen werden.'},
    ],
    body3: 'Nicht jede Situation ist gleich. Bei manchen vergessenen Pillen sollten die Empfehlungen genauer geprüft werden.',
    situations: [
      {title: 'Nur eine Pille vergessen', text: 'Was du tun solltest, hängt vor allem davon ab, wie viel Zeit seit der gewohnten Einnahmezeit vergangen ist.'},
      {title: 'Mehrere Pillen vergessen', text: 'Diese Situation verlangt besondere Aufmerksamkeit, und du solltest den Beipackzettel genau prüfen.'},
      {title: 'Unsicher, was zu tun ist', text: 'Eine Apotheke oder medizinisches Fachpersonal kann dir schnell helfen, das richtige Vorgehen zu finden.'},
    ],
    body4: 'Der Beipackzettel deiner Pille enthält die genauen Angaben zu dem Medikament, das du einnimmst. Die Empfehlungen können sich unterscheiden, je nachdem, ob es sich um eine Kombinationspille oder eine reine Gestagenpille handelt.',
    referenceTitle: 'Hilfreiche Punkte zum Prüfen',
    referenceTips: [
      'Den Beipackzettel griffbereit halten (zum Beispiel als Foto auf dem Handy)',
      'Bei einer kurzen Frage eine Apothekerin oder einen Apotheker kontaktieren',
      'Ärztlichen Rat einholen, wenn es häufiger vorkommt',
    ],
    guideTitle: 'Warum ist der Zeitpunkt des Vergessens wichtig?',
    guideText: 'Wann in der Packung die Pille vergessen wird, kann das richtige Vorgehen verändern. Deshalb enthält der Beipackzettel oft unterschiedliche Empfehlungen je nach Einnahmewoche.',
    body5: 'Wenn du nicht weißt, was zu tun ist, frag lieber nach, statt im Zweifel zu bleiben. Eine Apotheke, eine Hebamme oder eine Ärztin bzw. ein Arzt kann dir helfen, die zu deiner Situation passenden Empfehlungen zu prüfen.',
    questionTitle: 'Diese Informationen solltest du bereithalten',
    questions: [
      'Um welche Pille handelt es sich genau?',
      'Wie viel Zeit ist seit der gewohnten Einnahmezeit vergangen?',
      'Wie viele Pillen wurden vergessen?',
      'An welcher Stelle der Packung wurde die Pille vergessen?',
      'Gab es kürzlich ungeschützten Geschlechtsverkehr?',
    ],
    proTipTitle: 'GUT ZU WISSEN',
    proTipText: 'Wenn es rund um die vergessene Pille zu ungeschütztem Geschlechtsverkehr gekommen ist, hol dir schnell fachlichen Rat, um die möglichen Optionen zu erfahren.',
    repeatTitle: 'Wenn du öfter Pillen vergisst',
    body6: 'Häufiges Vergessen kann ein Zeichen dafür sein, dass die tägliche Einnahme nicht ganz zu deinem Alltag passt. Sprich ruhig mit medizinischem Fachpersonal, um andere Verhütungsmöglichkeiten zu besprechen.',
    methodTipTitle: 'Eine andere Methode?',
    methodTipText: 'Wenn es dir schwerfällt, jeden Tag eine Pille zu nehmen, gibt es andere Methoden mit einer anderen Anwendungshäufigkeit.',
    summaryTitle: 'Das Wesentliche',
    summaryItems: [
      'Reagiere, sobald du die vergessene Pille bemerkst.',
      'Prüfe, um welche Pille es sich genau handelt.',
      'Lies im Beipackzettel nach, was genau zu tun ist.',
      'Nutze zusätzlichen Schutz, wenn der Beipackzettel es empfiehlt.',
      'Hol dir Rat, wenn du unsicher bist oder es zu einem Risiko gekommen ist.',
    ],
    finalTipTitle: 'Das Wichtigste in Kürze',
    finalTipText: 'Eine vergessene Pille bedeutet nicht automatisch, dass deine Verhütung nicht mehr wirkt. Das richtige Vorgehen hängt von der Pillenart und den Umständen des Vergessens ab. Im Zweifel lies den Beipackzettel und hol dir schnell Rat.',
    disclaimerText: 'Dieser Artikel dient nur der Information und ersetzt weder den Beipackzettel deines Medikaments noch eine individuelle ärztliche Beratung. Die Empfehlungen können je nach Pillenart variieren.',
  },
  zh: {
      shareMessage: '漏服避孕药怎么办？ — AWA',
      badge: '漏服避孕药',
      title: '漏服避孕药：\n该怎么办？',
      metaDuration: '阅读约 7 分钟',
      metaType: '常见问题',
      metaLevel: '进阶',
      metaValidated: '已审核内容',
      intro: '任何人都可能漏服避孕药。该怎么做，主要取决于漏服了多久、避孕药的类型，以及漏服发生在这一盒的哪个阶段。',
      importantTitle: '关键一点',
      importantText: '不要慌张。先确认你所用避孕药的具体类型，并查看说明书，了解建议的处理方式。',
      contentsTitle: '本文内容',
      topics: [
        '迟服不到 12 小时',
        '迟服超过 12 小时',
        '需要格外留意的情况',
        '说明书是你的依据',
        '何时寻求建议',
        '要点回顾',
      ],
      body1: '对某些避孕药来说，迟服不到 12 小时通常不会影响避孕效果。这种情况下，一般建议尽快补服漏掉的那一片，然后按平时的时间继续服用这一盒。',
      step1Title: '补服药片',
      step1Text: '发现迟服后，尽快服下药片。',
      step2Title: '照常继续',
      step2Text: '之后的药片按平时的时间继续服用。',
      tip1Title: '小贴士',
      tip1Text: '如果你补服了漏掉的药片，又在平时的时间服用当天那一片，就可能出现同一天服用两片的情况。',
      body2: '当迟服时间超过你所用避孕药允许的范围，避孕效果可能会降低。此时该怎么做，取决于避孕药的类型、漏服的片数，以及漏服发生在这一盒的哪个位置。',
      alertTitle: '注意',
      alertText: '不要只依据这里给出的小时数：有些避孕药的说明不同。请务必查看你所用药品的说明书。',
      reflexesTitle: '首先要做的事',
      checkPoints: [
        {
          title: '尽快处理',
          text: '发现漏服后越快处理，就越容易按相应的建议来做。',
        },
        {
          title: '查看说明书',
          text: '具体说明可能因避孕药的确切类型和漏服片数而不同。',
        },
        {
          title: '考虑补充避孕措施',
          text: '在某些情况下，可能会建议在一段时间内使用避孕套。',
        },
      ],
      body3: '各种情况并不相同。有些漏服需要更仔细地核对相关建议。',
      situations: [
        {
          title: '只漏服了一片',
          text: '该怎么做，主要取决于距离平时服药时间已过去多久。',
        },
        {
          title: '漏服了不止一片',
          text: '这种情况需要特别留意，最好仔细查看说明书。',
        },
        {
          title: '不确定该怎么办',
          text: '药师或医疗专业人员可以很快帮你确定正确的做法。',
        },
      ],
      body4: '避孕药的说明书会给出你所服药物的具体指引。复方避孕药和单孕激素避孕药的建议可能不同。',
      referenceTitle: '值得核对的事项',
      referenceTips: [
        '把说明书放在手边（例如在手机里拍一张照片）',
        '有疑问时可以联系药师',
        '如果经常漏服，请去看医生',
      ],
      guideTitle: '为什么漏服的时间点很重要？',
      guideText: '漏服发生在这一盒的哪个阶段，会改变该怎么做。所以说明书通常会按这一盒的不同周次给出不同的建议。',
      body5: '如果你不知道该怎么办，寻求建议比一直犹豫更好。药师、助产士或医生可以帮你核对适合你情况的建议。',
      questionTitle: '需要准备好的信息',
      questions: [
        '这是哪一种避孕药？',
        '距离平时服药时间已经过去多久？',
        '漏服了几片？',
        '漏服发生在这一盒的哪个阶段？',
        '最近是否有过未采取保护措施的性行为？',
      ],
      proTipTitle: '小贴士',
      proTipText: '如果在漏服前后发生过未采取保护措施的性行为，请尽快向专业人员咨询，了解有哪些选择。',
      repeatTitle: '如果你总是漏服',
      body6: '经常漏服可能说明每日服药的安排不太适合你的生活方式。不妨与医疗专业人员谈谈，了解其他避孕方式。',
      methodTipTitle: '换一种方式？',
      methodTipText: '如果每天服药很难坚持，还有其他使用频率不同的避孕方式。',
      summaryTitle: '要点',
      summaryItems: [
        '发现漏服后尽快处理。',
        '确认你所用避孕药的具体类型。',
        '查看说明书，了解具体的处理方式。',
        '如果说明书建议，请使用补充避孕措施。',
        '有疑问或发生过有风险的性行为后，请寻求建议。',
      ],
      finalTipTitle: '要点回顾',
      finalTipText: '漏服一片并不一定意味着避孕已经失效。正确的做法取决于避孕药的类型和漏服的具体情况。如有疑问，请查看说明书并尽快寻求建议。',
      disclaimerText: '本文仅供参考，不能替代你所用药品的说明书或个性化的医疗建议。具体建议可能因避孕药类型而异。',
    },
  id: {
    shareMessage: 'Lupa minum pil: apa yang harus dilakukan? — AWA',
    badge: 'LUPA MINUM PIL',
    title: 'Lupa minum pil:\napa yang harus dilakukan?',
    metaDuration: '7 menit baca',
    metaType: 'Tanya jawab',
    metaLevel: 'Menengah',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Lupa minum pil bisa terjadi pada siapa saja. Tindakan yang tepat terutama bergantung pada seberapa lama keterlambatannya, jenis pil, dan di bagian mana dalam kemasan hal itu terjadi.',
    importantTitle: 'Poin utama',
    importantText: 'Jangan panik. Pertama, periksa jenis pil yang kamu pakai dan baca brosur kemasannya untuk mengetahui langkah yang dianjurkan.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Terlambat kurang dari 12 jam',
      'Terlambat lebih dari 12 jam',
      'Situasi yang perlu perhatian ekstra',
      'Brosur kemasan adalah rujukanmu',
      'Kapan perlu meminta saran',
      'Poin penting',
    ],
    body1: 'Pada sebagian pil, keterlambatan kurang dari 12 jam umumnya tidak mengurangi perlindungan kontrasepsi. Dalam hal ini, anjuran yang biasa adalah segera minum pil yang terlewat, lalu melanjutkan kemasan pada jam yang biasa.',
    step1Title: 'Minum pilnya',
    step1Text: 'Minum pil segera setelah kamu sadar terlambat.',
    step2Title: 'Lanjutkan seperti biasa',
    step2Text: 'Setelah itu, kembali ke jadwal biasa untuk pil-pil berikutnya.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Jika kamu meminum pil yang terlewat lalu pil yang dijadwalkan pada jam biasa, bisa saja dua pil diminum pada hari yang sama.',
    body2: 'Jika keterlambatan melebihi batas waktu yang diizinkan untuk pilmu, perlindungan bisa berkurang. Tindakan selanjutnya bergantung pada jenis pil, jumlah pil yang terlewat, dan posisi pil yang terlewat dalam kemasan.',
    alertTitle: 'Peringatan',
    alertText: 'Jangan hanya mengandalkan jumlah jam yang disebutkan di sini: sebagian pil memiliki petunjuk yang berbeda. Selalu periksa brosur kemasan obatmu.',
    reflexesTitle: 'Hal pertama yang perlu dilakukan',
    checkPoints: [
      {
        title: 'Bertindak dengan cepat',
        text: 'Semakin cepat kamu bertindak setelah menyadari pil terlewat, semakin mudah mengikuti anjuran yang sesuai.',
      },
      {
        title: 'Periksa brosur kemasan',
        text: 'Petunjuknya bisa berbeda tergantung jenis pil yang tepat dan jumlah pil yang terlewat.',
      },
      {
        title: 'Siapkan perlindungan tambahan',
        text: 'Pada sebagian situasi, kondom mungkin dianjurkan untuk jangka waktu tertentu.',
      },
    ],
    body3: 'Tidak semua situasi sama. Sebagian kasus pil terlewat memerlukan pemeriksaan anjuran yang lebih teliti.',
    situations: [
      {
        title: 'Hanya satu pil yang terlewat',
        text: 'Tindakan yang tepat terutama bergantung pada waktu yang telah berlalu sejak jam minum yang biasa.',
      },
      {
        title: 'Lebih dari satu pil terlewat',
        text: 'Situasi ini perlu perhatian khusus, dan sebaiknya periksa brosur kemasan dengan teliti.',
      },
      {
        title: 'Tidak yakin harus berbuat apa',
        text: 'Apoteker atau tenaga kesehatan dapat dengan cepat membantumu menemukan langkah yang tepat.',
      },
    ],
    body4: 'Brosur kemasan pilmu memberikan petunjuk yang tepat untuk obat yang kamu pakai. Anjurannya bisa berbeda tergantung apakah pilmu pil kombinasi atau pil yang hanya mengandung progestin.',
    referenceTitle: 'Hal-hal berguna untuk diperiksa',
    referenceTips: [
      'Simpan brosur kemasan agar mudah dijangkau (misalnya berupa foto di ponselmu)',
      'Hubungi apoteker jika ada pertanyaan singkat',
      'Temui dokter jika hal ini sering terjadi',
    ],
    guideTitle: 'Mengapa waktu pil terlewat itu penting?',
    guideText: 'Posisi pil yang terlewat dalam kemasan dapat mengubah tindakan yang perlu dilakukan. Karena itu, brosur kemasan sering memberikan anjuran yang berbeda tergantung minggu dalam kemasan.',
    body5: 'Jika kamu tidak tahu harus berbuat apa, lebih baik meminta saran daripada tetap ragu. Apoteker, bidan, atau dokter dapat membantumu memeriksa anjuran yang sesuai dengan situasimu.',
    questionTitle: 'Informasi yang perlu disiapkan',
    questions: [
      'Pil jenis apa tepatnya?',
      'Berapa lama waktu telah berlalu sejak jam minum yang biasa?',
      'Berapa pil yang terlewat?',
      'Di bagian mana dalam kemasan pil itu terlewat?',
      'Apakah belakangan ini ada hubungan seksual tanpa perlindungan?',
    ],
    proTipTitle: 'Perlu diketahui',
    proTipText: 'Jika terjadi hubungan seksual tanpa perlindungan sekitar waktu pil terlewat, segera minta saran tenaga profesional untuk mengetahui pilihan apa yang tersedia.',
    repeatTitle: 'Jika kamu sering lupa minum pil',
    body6: 'Pil yang sering terlewat bisa menjadi tanda bahwa rutinitas harian kurang cocok dengan gaya hidupmu. Jangan ragu berbicara dengan tenaga kesehatan untuk mempelajari pilihan kontrasepsi lain.',
    methodTipTitle: 'Metode yang berbeda?',
    methodTipText: 'Jika minum pil setiap hari sulit dijalani, ada metode lain dengan frekuensi pemakaian yang berbeda.',
    summaryTitle: 'Intinya',
    summaryItems: [
      'Segera bertindak begitu kamu menyadari pil terlewat.',
      'Periksa jenis pilmu dengan tepat.',
      'Periksa brosur kemasan untuk mengetahui langkah yang tepat.',
      'Gunakan perlindungan tambahan jika brosur kemasan menganjurkannya.',
      'Minta saran jika ragu atau setelah hubungan yang berisiko.',
    ],
    finalTipTitle: 'Poin penting',
    finalTipText: 'Pil yang terlewat tidak otomatis berarti kontrasepsimu berhenti bekerja. Tindakan yang tepat bergantung pada jenis pil dan keadaan saat dosis terlewat. Jika ragu, periksa brosur kemasan dan segera minta saran.',
    disclaimerText: 'Artikel ini disediakan hanya untuk tujuan informasi dan tidak menggantikan brosur kemasan obatmu maupun saran medis yang dipersonalisasi. Anjuran dapat berbeda tergantung jenis pil.',
  },
  hi: {
    shareMessage: 'गोली छूट जाए: क्या करें? — AWA',
    badge: 'छूटी हुई गोली',
    title: 'गोली छूट जाए:\nक्या करें?',
    metaDuration: '7 मिनट में पढ़ें',
    metaType: 'अक्सर पूछे जाने वाले सवाल',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'गोली छूट जाना किसी के साथ भी हो सकता है। क्या करना है, यह मुख्य रूप से इस पर निर्भर करता है कि गोली कितनी देर पहले छूटी, गोली किस प्रकार की है और पैक में यह कब छूटी।',
    importantTitle: 'सबसे अहम बात',
    importantText: 'घबराएँ नहीं। पहले अपनी गोली का सही प्रकार देखें और सुझाए गए तरीके को जानने के लिए उसके पैकेज इन्सर्ट (दवा के साथ मिला पर्चा) को पढ़ें।',
    contentsTitle: 'इस लेख में',
    topics: [
      '12 घंटे से कम की देरी',
      '12 घंटे से ज़्यादा की देरी',
      'जिन स्थितियों में ज़्यादा ध्यान चाहिए',
      'पैकेज इन्सर्ट आपका संदर्भ है',
      'सलाह कब लें',
      'मुख्य बातें',
    ],
    body1: 'कुछ गोलियों में 12 घंटे से कम की देरी से आम तौर पर गर्भनिरोधक सुरक्षा पर असर नहीं पड़ता। ऐसे में आम सलाह यह होती है कि छूटी हुई गोली जल्द से जल्द लें और फिर पैक की बाकी गोलियाँ अपने तय समय पर लेती रहें।',
    step1Title: 'गोली लें',
    step1Text: 'जैसे ही आपको देरी का पता चले, गोली ले लें।',
    step2Title: 'पहले की तरह जारी रखें',
    step2Text: 'फिर अगली गोलियों के लिए अपने तय समय पर लौट आएँ।',
    tip1Title: 'जानना अच्छा है',
    tip1Text: 'अगर आप छूटी हुई गोली लेती हैं और फिर तय समय की गोली भी लेती हैं, तो ऐसा हो सकता है कि एक ही दिन में दो गोलियाँ ली जाएँ।',
    body2: 'जब देरी आपकी गोली के लिए मान्य समय से ज़्यादा हो जाए, तो सुरक्षा कम हो सकती है। तब क्या करना है, यह गोली के प्रकार, छूटी गोलियों की संख्या और पैक में छूटी गोली की जगह पर निर्भर करता है।',
    alertTitle: 'चेतावनी',
    alertText: 'यहाँ दिए गए घंटों की संख्या पर ही भरोसा न करें: कुछ गोलियों के निर्देश अलग होते हैं। हमेशा अपनी दवा का पैकेज इन्सर्ट देखें।',
    reflexesTitle: 'सबसे पहले क्या करें',
    checkPoints: [
      {
        title: 'जल्दी कदम उठाएँ',
        text: 'गोली छूटने का पता चलते ही जितनी जल्दी आप क़दम उठाती हैं, उतना ही आसान होता है उचित सलाह का पालन करना।',
      },
      {
        title: 'पैकेज इन्सर्ट देखें',
        text: 'निर्देश गोली के सही प्रकार और छूटी गोलियों की संख्या के अनुसार अलग हो सकते हैं।',
      },
      {
        title: 'अतिरिक्त सुरक्षा की योजना रखें',
        text: 'कुछ स्थितियों में, एक तय अवधि तक कंडोम इस्तेमाल करने की सलाह दी जा सकती है।',
      },
    ],
    body3: 'सभी स्थितियाँ एक जैसी नहीं होतीं। कुछ छूटी हुई गोलियों में सलाह को ज़्यादा बारीकी से जाँचना ज़रूरी होता है।',
    situations: [
      {
        title: 'सिर्फ़ एक गोली छूटी',
        text: 'क्या करना है, यह मुख्य रूप से इस पर निर्भर करता है कि गोली लेने के सामान्य समय से कितना वक़्त बीत चुका है।',
      },
      {
        title: 'एक से ज़्यादा गोलियाँ छूटीं',
        text: 'इस स्थिति में ख़ास ध्यान चाहिए, और पैकेज इन्सर्ट को बारीकी से देखना बेहतर है।',
      },
      {
        title: 'समझ न आए कि क्या करें',
        text: 'कोई फ़ार्मासिस्ट या स्वास्थ्य विशेषज्ञ सही तरीका पहचानने में जल्दी मदद कर सकता है।',
      },
    ],
    body4: 'आपकी गोली का पैकेज इन्सर्ट उस दवा के लिए सटीक निर्देश देता है जो आप ले रही हैं। सलाह इस पर भी अलग हो सकती है कि गोली कॉम्बाइंड है या सिर्फ़ प्रोजेस्टिन वाली।',
    referenceTitle: 'जाँचने लायक उपयोगी बातें',
    referenceTips: [
      'पैकेज इन्सर्ट हाथ के पास रखें (जैसे फ़ोन में उसकी फ़ोटो)',
      'कोई जल्दी का सवाल हो तो फ़ार्मासिस्ट से संपर्क करें',
      'अगर ऐसा अक्सर होता है, तो डॉक्टर को दिखाएँ',
    ],
    guideTitle: 'छूटी गोली का समय क्यों मायने रखता है?',
    guideText: 'गोली पैक में किस जगह छूटी, इससे यह बदल सकता है कि क्या करना है। इसीलिए पैकेज इन्सर्ट में अक्सर पैक के सप्ताह के अनुसार अलग-अलग सलाह दी जाती है।',
    body5: 'अगर आपको नहीं पता कि क्या करना है, तो संदेह में रहने की बजाय सलाह लेना बेहतर है। फ़ार्मासिस्ट, दाई-नर्स (मिडवाइफ़) या डॉक्टर आपकी स्थिति के अनुरूप सलाह जाँचने में मदद कर सकते हैं।',
    questionTitle: 'तैयार रखने लायक जानकारी',
    questions: [
      'यह ठीक-ठीक किस प्रकार की गोली है?',
      'सामान्य समय से कितना वक़्त बीत चुका है?',
      'कितनी गोलियाँ छूटीं?',
      'पैक में किस जगह पर गोली छूटी?',
      'क्या हाल ही में बिना सुरक्षा के यौन संबंध बना है?',
    ],
    proTipTitle: 'जानना अच्छा है',
    proTipText: 'अगर गोली छूटने के आसपास बिना सुरक्षा के यौन संबंध बना हो, तो विशेषज्ञ से जल्दी सलाह लें ताकि पता चल सके कि कौन-से विकल्प उपलब्ध हैं।',
    repeatTitle: 'अगर गोलियाँ बार-बार छूटती हैं',
    body6: 'बार-बार गोली छूटना इस बात का संकेत हो सकता है कि रोज़ की यह दिनचर्या आपकी जीवनशैली से ठीक मेल नहीं खाती। गर्भनिरोध के दूसरे विकल्प जानने के लिए स्वास्थ्य विशेषज्ञ से बात करने में संकोच न करें।',
    methodTipTitle: 'कोई दूसरा तरीका?',
    methodTipText: 'अगर रोज़ गोली लेना निभाना मुश्किल हो, तो ऐसे दूसरे तरीके भी हैं जिनके इस्तेमाल की अवधि अलग होती है।',
    summaryTitle: 'ज़रूरी बातें',
    summaryItems: [
      'गोली छूटने का पता चलते ही कदम उठाएँ।',
      'अपनी गोली का सही प्रकार जाँचें।',
      'सटीक तरीका जानने के लिए पैकेज इन्सर्ट देखें।',
      'अगर पैकेज इन्सर्ट सलाह दे, तो अतिरिक्त सुरक्षा का इस्तेमाल करें।',
      'संदेह हो या जोखिम भरे संबंध के बाद सलाह लें।',
    ],
    finalTipTitle: 'मुख्य बातें',
    finalTipText: 'गोली छूटने का मतलब अपने आप यह नहीं कि आपका गर्भनिरोध काम करना बंद कर चुका है। सही तरीका गोली के प्रकार और छूटने की परिस्थितियों पर निर्भर करता है। संदेह हो तो पैकेज इन्सर्ट देखें और जल्दी सलाह लें।',
    disclaimerText: 'यह लेख केवल जानकारी के लिए है और आपकी दवा के पैकेज इन्सर्ट या व्यक्तिगत डॉक्टरी सलाह का विकल्प नहीं है। सलाह गोली के प्रकार के अनुसार अलग हो सकती है।',
  },
  sq: {
    shareMessage: 'Tableta e harruar: çfarë të bësh? — AWA',
    badge: 'TABLETA E HARRUAR',
    title: 'Tableta e harruar:\nçfarë të bësh?',
    metaDuration: '7 min lexim',
    metaType: 'Pyetje të shpeshta',
    metaLevel: 'Mesatar',
    metaValidated: 'Përmbajtje e shqyrtuar',
    intro: 'Një tabletë e harruar mund t’i ndodhë këdo. Ajo që duhet bërë varet kryesisht nga sa kohë më parë e ke harruar, nga lloji i tabletës dhe nga momenti i paketës kur ndodh.',
    importantTitle: 'Pika kryesore',
    importantText: 'Mos u alarmo. Fillimisht kontrollo llojin e saktë të tabletës sate dhe lexo fletëudhëzuesin e saj për të ditur çfarë veprimi rekomandohet.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Më pak se 12 orë vonesë',
      'Më shumë se 12 orë vonesë',
      'Situata që kërkojnë vëmendje të veçantë',
      'Fletëudhëzuesi është referenca jote',
      'Kur të kërkosh këshillë',
      'Çfarë të mbash mend',
    ],
    body1: 'Për disa tableta, një vonesë më pak se 12 orë përgjithësisht nuk e cenon mbrojtjen kontraceptive. Në këtë rast, rekomandimi i zakonshëm është ta marrësh tabletën e harruar sa më shpejt që të jetë e mundur dhe pastaj ta vazhdosh paketën në orarin e zakonshëm.',
    step1Title: 'Merr tabletën',
    step1Text: 'Merr tabletën sapo të vëresh se je vonuar.',
    step2Title: 'Vazhdo si zakonisht',
    step2Text: 'Pastaj kthehu te orari yt i zakonshëm për tabletat e radhës.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Nëse e merr tabletën e harruar dhe pastaj atë që është planifikuar për orarin e zakonshëm, mund të ndodhë që dy tableta të merren në të njëjtën ditë.',
    body2: 'Kur vonesa e kalon kohën e lejuar për tabletën tënde, mbrojtja mund të jetë e zvogëluar. Çfarë duhet bërë atëherë varet nga lloji i tabletës, nga numri i tabletave të harruara dhe nga vendi i tabletës së harruar në paketë.',
    alertTitle: 'Kujdes',
    alertText: 'Mos u mbështet vetëm te numri i orëve të dhëna këtu: disa tableta kanë udhëzime të ndryshme. Kontrollo gjithmonë fletëudhëzuesin e barnës sate.',
    reflexesTitle: 'Gjërat e para që duhen bërë',
    checkPoints: [
      {
        title: 'Reago shpejt',
        text: 'Sa më shpejt të reagosh pasi ta vësh re tabletën e harruar, aq më e lehtë është të ndjekësh rekomandimet e duhura.',
      },
      {
        title: 'Kontrollo fletëudhëzuesin',
        text: 'Udhëzimet mund të ndryshojnë sipas llojit të saktë të tabletës dhe numrit të tabletave të harruara.',
      },
      {
        title: 'Parashiko një mbrojtje rezervë',
        text: 'Në disa situata, mund të rekomandohet prezervativi për një periudhë të caktuar.',
      },
    ],
    body3: 'Jo të gjitha situatat janë të njëjta. Disa tableta të harruara kërkojnë një kontroll më të saktë të rekomandimeve.',
    situations: [
      {
        title: 'Vetëm një tabletë e harruar',
        text: 'Çfarë duhet bërë varet kryesisht nga koha që ka kaluar që nga ora e zakonshme e marrjes.',
      },
      {
        title: 'Më shumë se një tabletë e harruar',
        text: 'Kjo situatë kërkon vëmendje të veçantë dhe është më mirë ta kontrollosh me përpikëri fletëudhëzuesin.',
      },
      {
        title: 'Nuk je e sigurt çfarë të bësh',
        text: 'Një farmacist ose një profesionist i shëndetësisë mund të të ndihmojë shpejt të gjesh veprimin e duhur.',
      },
    ],
    body4: 'Fletëudhëzuesi i tabletës sate jep udhëzimet e sakta për barnën që merr. Rekomandimet mund të ndryshojnë sipas faktit nëse është tabletë e kombinuar apo tabletë vetëm me progestinë.',
    referenceTitle: 'Gjëra të dobishme për t’u kontrolluar',
    referenceTips: [
      'Mbaje fletëudhëzuesin pranë (për shembull, një foto në telefon)',
      'Kontakto një farmacist nëse ke një pyetje të shpejtë',
      'Shko te një mjek nëse kjo ndodh shpesh',
    ],
    guideTitle: 'Pse ka rëndësi momenti i tabletës së harruar?',
    guideText: 'Vendi i tabletës së harruar në paketë mund ta ndryshojë atë që duhet bërë. Prandaj fletëudhëzuesi shpesh jep rekomandime të ndryshme sipas javës së paketës.',
    body5: 'Nëse nuk e di çfarë të bësh, është më mirë të kërkosh këshillë sesa të mbetesh në dyshim. Një farmacist, një mami ose një mjek mund të të ndihmojë të kontrollosh rekomandimet që i përshtaten situatës sate.',
    questionTitle: 'Informacione që duhet t’i kesh gati',
    questions: [
      'Çfarë lloji të saktë tablete është?',
      'Sa kohë ka kaluar nga ora e zakonshme?',
      'Sa tableta janë harruar?',
      'Në cilin moment të paketës ndodhi harresa?',
      'A ka pasur marrëdhënie seksuale pa mbrojtje së fundmi?',
    ],
    proTipTitle: 'Mirë është ta dish',
    proTipText: 'Nëse ka pasur marrëdhënie seksuale pa mbrojtje afër kohës së tabletës së harruar, kërko shpejt këshillën e një profesionisti për të ditur çfarë opsionesh ka.',
    repeatTitle: 'Nëse vazhdon t’i harrosh tabletat',
    body6: 'Tabletat e harruara shpesh mund të jenë shenjë se rutina ditore nuk i përshtatet plotësisht mënyrës sate të jetesës. Mos hezito të flasësh me një profesionist të shëndetësisë për të shqyrtuar opsione të tjera kontraceptive.',
    methodTipTitle: 'Një metodë tjetër?',
    methodTipText: 'Nëse marrja e një tablete çdo ditë është e vështirë për t’u mbajtur, ekzistojnë metoda të tjera me një frekuencë tjetër përdorimi.',
    summaryTitle: 'Thelbi',
    summaryItems: [
      'Reago sapo ta vësh re tabletën e harruar.',
      'Kontrollo llojin e saktë të tabletës sate.',
      'Kontrollo fletëudhëzuesin për të ditur veprimin e saktë.',
      'Përdor mbrojtje rezervë nëse e rekomandon fletëudhëzuesi.',
      'Kërko këshillë në rast dyshimi ose pas një marrëdhënieje të rrezikshme.',
    ],
    finalTipTitle: 'Çfarë të mbash mend',
    finalTipText: 'Një tabletë e harruar nuk do të thotë automatikisht se kontracepsioni yt ka pushuar së funksionuari. Veprimi i duhur varet nga lloji i tabletës dhe rrethanat e dozës së harruar. Në rast dyshimi, kontrollo fletëudhëzuesin dhe kërko shpejt këshillë.',
    disclaimerText: 'Ky artikull jepet vetëm për qëllime informimi dhe nuk zëvendëson fletëudhëzuesin e barnës sate ose këshillën mjekësore të personalizuar. Rekomandimet mund të ndryshojnë sipas llojit të tabletës.',
  },
  ja: {
    shareMessage: 'ピルを飲み忘れたときの対応 — AWA',
    badge: 'ピルの飲み忘れ',
    title: 'ピルの飲み忘れ：\nどうする？',
    metaDuration: '読了7分',
    metaType: 'よくある質問',
    metaLevel: '中級',
    metaValidated: '確認済みの内容',
    intro: 'ピルの飲み忘れは誰にでも起こりえます。どうすればよいかは、主に飲み忘れてからどれくらい経ったか、ピルの種類、そしてシートのどの時点で起きたかによって変わります。',
    importantTitle: 'いちばん大切なこと',
    importantText: 'あわてないでください。まず、お使いのピルの正確な種類を確認し、添付文書で推奨されている対応を調べましょう。',
    contentsTitle: 'この記事の内容',
    topics: [
      '遅れが12時間未満のとき',
      '遅れが12時間を超えたとき',
      'とくに注意が必要な状況',
      '添付文書が基準になります',
      '相談したほうがよいとき',
      '大切なポイント',
    ],
    body1: 'ピルによっては、遅れが12時間未満であれば、一般的に避妊効果は損なわれません。この場合、通常は飲み忘れた分をできるだけ早く飲み、そのあとはいつもの時間にシートを続けることが推奨されます。',
    step1Title: 'ピルを飲む',
    step1Text: '遅れに気づいたら、すぐにピルを飲みます。',
    step2Title: 'いつもどおりに続ける',
    step2Text: 'そのあとの分は、いつものスケジュールに戻します。',
    tip1Title: '知っておきたいこと',
    tip1Text: '飲み忘れた分を飲み、そのあと通常の時間の分も飲むと、同じ日に2錠飲むことになる場合があります。',
    body2: '遅れがそのピルで許容されている時間を超えると、避妊効果が下がるおそれがあります。その場合の対応は、ピルの種類、飲み忘れた錠数、そして飲み忘れがシートのどの位置にあたるかによって変わります。',
    alertTitle: 'ご注意ください',
    alertText: 'ここに書かれた時間の数字だけを頼りにしないでください。ピルによって指示が異なるものがあります。必ずお薬の添付文書を確認してください。',
    reflexesTitle: 'まずやること',
    checkPoints: [
      {
        title: 'すばやく対応する',
        text: '飲み忘れに気づいてから早く対応するほど、適切な推奨に沿って行動しやすくなります。',
      },
      {
        title: '添付文書を確認する',
        text: '指示は、ピルの正確な種類や飲み忘れた錠数によって異なることがあります。',
      },
      {
        title: '補助的な避妊を考える',
        text: '状況によっては、一定の期間コンドームの使用が推奨されることがあります。',
      },
    ],
    body3: 'すべての状況が同じではありません。飲み忘れによっては、推奨内容をより正確に確認する必要があります。',
    situations: [
      {
        title: '1錠だけ飲み忘れた',
        text: 'どうすればよいかは、主に通常の服用時間からどれくらい経っているかによります。',
      },
      {
        title: '2錠以上飲み忘れた',
        text: 'この状況はとくに注意が必要で、添付文書を正確に確認するのが最善です。',
      },
      {
        title: 'どうすればよいか分からない',
        text: '薬剤師や医療従事者に相談すると、適切な対応をすばやく見つけられます。',
      },
    ],
    body4: 'ピルの添付文書には、お使いのお薬についての正確な指示が書かれています。推奨内容は、複合ピルか、プロゲスチン単独のピルかによって異なることがあります。',
    referenceTitle: '確認しておくと役立つこと',
    referenceTips: [
      '添付文書をすぐ見られるようにしておく（たとえば、スマートフォンに写真を保存する）',
      'ちょっとした疑問があれば、薬剤師に連絡する',
      'よく起こる場合は医師に相談する',
    ],
    guideTitle: '飲み忘れのタイミングが大切な理由は？',
    guideText: '飲み忘れがシートのどこにあたるかによって、対応が変わることがあります。そのため添付文書には、シートの何週目かによって異なる推奨が書かれていることがよくあります。',
    body5: 'どうすればよいか分からないときは、迷ったままにするより相談するほうがよいでしょう。薬剤師、助産師、医師が、状況に合った推奨を確認する手助けをしてくれます。',
    questionTitle: '用意しておくとよい情報',
    questions: [
      'ピルの正確な種類は何か',
      '通常の時間からどれくらい経っているか',
      '何錠飲み忘れたか',
      '飲み忘れはシートのどの時点だったか',
      '最近、避妊をしない性交があったか',
    ],
    proTipTitle: '知っておきたいこと',
    proTipText: '飲み忘れの前後に避妊をしない性交があった場合は、どのような選択肢があるかを知るため、すぐに専門家に相談してください。',
    repeatTitle: '飲み忘れが続くとき',
    body6: '飲み忘れが頻繁にある場合、毎日の習慣が生活リズムに合っていないサインかもしれません。ほかの避妊方法を検討するために、遠慮なく医療従事者に相談してください。',
    methodTipTitle: '別の方法は？',
    methodTipText: '毎日ピルを飲み続けるのが難しい場合は、使用の頻度が異なるほかの方法もあります。',
    summaryTitle: '大切なこと',
    summaryItems: [
      '飲み忘れに気づいたら、すぐに対応します。',
      'お使いのピルの正確な種類を確認します。',
      '添付文書を確認して、正確な対応を調べます。',
      '添付文書で推奨されている場合は、補助的な避妊を行います。',
      '迷うとき、またはリスクのある性交のあとは、相談します。',
    ],
    finalTipTitle: '大切なポイント',
    finalTipText: 'ピルを飲み忘れても、必ずしも避妊が効かなくなったわけではありません。適切な対応は、ピルの種類と飲み忘れの状況によって変わります。迷うときは、添付文書を確認し、すぐに相談してください。',
    disclaimerText: 'この記事は情報提供のみを目的としており、お薬の添付文書や個別の医療アドバイスに代わるものではありません。推奨内容はピルの種類によって異なることがあります。',
  },
  ko: {
    shareMessage: '피임약을 깜빡했다면 어떻게 할까요? — AWA',
    badge: '피임약 복용 누락',
    title: '피임약을 깜빡했다면\n어떻게 할까요?',
    metaDuration: '7분 읽기',
    metaType: '자주 묻는 질문',
    metaLevel: '중급',
    metaValidated: '검토된 콘텐츠',
    intro: '피임약을 깜빡하는 일은 누구에게나 생길 수 있어요. 어떻게 해야 하는지는 주로 늦은 시간이 얼마나 되는지, 피임약의 종류, 한 판 중 언제 일어났는지에 따라 달라요.',
    importantTitle: '핵심 포인트',
    importantText: '당황하지 마세요. 먼저 피임약의 정확한 종류를 확인하고, 설명서에서 권장하는 대처 방법을 확인하세요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    topics: [
      '12시간 미만 늦은 경우',
      '12시간 넘게 늦은 경우',
      '더 주의가 필요한 상황',
      '설명서가 기준이에요',
      '조언을 구해야 할 때',
      '핵심 정리',
    ],
    body1: '일부 피임약은 12시간 미만으로 늦어도 대체로 피임 효과에 영향이 없어요. 이 경우 보통은 깜빡한 약을 가능한 한 빨리 먹고, 그 뒤에는 평소 시간에 맞춰 이어서 복용하라고 권해요.',
    step1Title: '약 먹기',
    step1Text: '늦은 것을 알아차리는 즉시 약을 먹어요.',
    step2Title: '평소처럼 이어가기',
    step2Text: '그다음 약부터는 평소 일정으로 돌아가요.',
    tip1Title: '알아두면 좋아요',
    tip1Text: '깜빡한 약을 먹고 평소 시간에 정해진 약도 먹으면, 같은 날 두 알을 먹게 될 수 있어요.',
    body2: '늦은 시간이 피임약에서 허용하는 시간을 넘으면 피임 효과가 떨어질 수 있어요. 이때 어떻게 해야 하는지는 피임약의 종류, 깜빡한 알의 개수, 깜빡한 알이 한 판 중 어디에 해당하는지에 따라 달라요.',
    alertTitle: '주의',
    alertText: '여기에 적힌 시간만 그대로 믿지 마세요. 피임약마다 안내가 다를 수 있어요. 항상 복용 중인 약의 설명서를 확인하세요.',
    reflexesTitle: '가장 먼저 할 일',
    checkPoints: [
      {
        title: '빠르게 대처하기',
        text: '깜빡한 것을 알아차린 뒤 빨리 대처할수록 알맞은 권고를 따르기가 쉬워요.',
      },
      {
        title: '설명서 확인하기',
        text: '안내는 피임약의 정확한 종류와 깜빡한 알의 개수에 따라 다를 수 있어요.',
      },
      {
        title: '보조 피임 계획하기',
        text: '상황에 따라 일정 기간 동안 콘돔 사용을 권할 수 있어요.',
      },
    ],
    body3: '모든 상황이 같지는 않아요. 어떤 경우에는 권고 사항을 더 정확하게 확인해야 해요.',
    situations: [
      {
        title: '한 알만 깜빡한 경우',
        text: '어떻게 해야 하는지는 주로 평소 복용 시간 이후 지난 시간에 따라 달라요.',
      },
      {
        title: '두 알 이상 깜빡한 경우',
        text: '이런 상황은 특별한 주의가 필요하며, 설명서를 정확히 확인하는 것이 좋아요.',
      },
      {
        title: '어떻게 해야 할지 잘 모르겠을 때',
        text: '약사나 의료 전문가가 알맞은 대처 방법을 빠르게 찾아 줄 수 있어요.',
      },
    ],
    body4: '피임약 설명서에는 복용 중인 약에 대한 정확한 안내가 나와 있어요. 복합 피임약인지 프로게스틴 단독 피임약인지에 따라 권고가 다를 수 있어요.',
    referenceTitle: '확인하면 좋은 것',
    referenceTips: [
      '설명서를 가까이에 두세요(예를 들어 휴대폰에 사진으로 저장해 두세요)',
      '간단히 궁금한 점이 있으면 약사에게 문의하세요',
      '자주 깜빡한다면 의사를 만나세요',
    ],
    guideTitle: '깜빡한 시점이 왜 중요할까요?',
    guideText: '깜빡한 알이 한 판 중 어디에 있는지에 따라 해야 할 일이 달라질 수 있어요. 그래서 설명서에는 판의 몇 주째인지에 따라 서로 다른 권고가 나와 있는 경우가 많아요.',
    body5: '어떻게 해야 할지 모르겠다면 막연히 걱정하기보다 조언을 구하는 것이 좋아요. 약사, 조산사, 의사가 상황에 맞는 권고를 확인하도록 도와줄 수 있어요.',
    questionTitle: '준비해 두면 좋은 정보',
    questions: [
      '정확히 어떤 종류의 피임약인가요?',
      '평소 복용 시간에서 얼마나 지났나요?',
      '몇 알을 깜빡했나요?',
      '한 판 중 어느 시점에 깜빡했나요?',
      '최근에 피임 없이 성관계를 했나요?',
    ],
    proTipTitle: '알아두면 좋아요',
    proTipText: '약을 깜빡한 시기 즈음에 피임 없이 성관계를 했다면, 어떤 선택지가 있는지 알아보기 위해 전문가에게 빨리 조언을 구하세요.',
    repeatTitle: '자주 깜빡한다면',
    body6: '자주 깜빡한다면 매일 복용하는 루틴이 생활 방식과 잘 맞지 않는다는 신호일 수 있어요. 망설이지 말고 의료 전문가와 상담해서 다른 피임 방법을 알아보세요.',
    methodTipTitle: '다른 방법은 어떨까요?',
    methodTipText: '매일 약을 먹는 것이 계속 지키기 어렵다면, 사용 주기가 다른 방법도 있어요.',
    summaryTitle: '핵심 요약',
    summaryItems: [
      '깜빡한 것을 알아차리는 즉시 대처하세요.',
      '피임약의 정확한 종류를 확인하세요.',
      '설명서를 확인해 정확한 대처 방법을 알아보세요.',
      '설명서에서 권장하면 보조 피임을 사용하세요.',
      '의문이 있거나 임신 위험이 있는 성관계를 한 뒤에는 조언을 구하세요.',
    ],
    finalTipTitle: '핵심 정리',
    finalTipText: '피임약을 한 번 깜빡했다고 해서 피임이 자동으로 효과가 없어지는 것은 아니에요. 알맞은 대처 방법은 피임약의 종류와 깜빡한 상황에 따라 달라요. 의문이 있다면 설명서를 확인하고 빨리 조언을 구하세요.',
    disclaimerText: '이 아티클은 정보 제공만을 목적으로 하며, 복용 중인 약의 설명서나 개인 맞춤 의학적 조언을 대신하지 않아요. 권고 사항은 피임약의 종류에 따라 다를 수 있어요.',
  },
  'pt-PT': {
    shareMessage: 'Esquecimento da pílula: o que fazer? — AWA',
    badge: 'ESQUECIMENTO DA PÍLULA',
    title: 'Esquecimento da pílula:\no que fazer?',
    metaDuration: '7 min de leitura',
    metaType: 'Perguntas frequentes',
    metaLevel: 'Intermédio',
    metaValidated: 'Conteúdo revisto',
    intro: 'O esquecimento de uma pílula pode acontecer a qualquer pessoa. O que fazer depende sobretudo do tempo decorrido desde o esquecimento, do tipo de pílula e do momento da cartela em que acontece.',
    importantTitle: 'O ponto essencial',
    importantText: 'Não entre em pânico. Comece por verificar o tipo exato da sua pílula e consulte o folheto informativo para saber qual é a conduta recomendada.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Atraso inferior a 12 horas',
      'Atraso superior a 12 horas',
      'Situações que exigem atenção redobrada',
      'O folheto informativo é a sua referência',
      'Quando pedir aconselhamento',
      'Pontos essenciais',
    ],
    body1: 'Em algumas pílulas, um atraso inferior a 12 horas não compromete, em geral, a proteção contracetiva. Neste caso, a recomendação habitual é tomar a pílula esquecida o mais depressa possível e continuar a cartela à hora habitual.',
    step1Title: 'Tome a pílula',
    step1Text: 'Tome a pílula logo que se aperceba do atraso.',
    step2Title: 'Continue como habitual',
    step2Text: 'Depois, retome o seu horário habitual para as pílulas seguintes.',
    tip1Title: 'Bom saber',
    tip1Text: 'Se tomar a pílula esquecida e, depois, a que estava prevista para a hora habitual, podem ser tomadas duas pílulas no mesmo dia.',
    body2: 'Quando o atraso ultrapassa o tempo permitido para a sua pílula, a proteção pode ficar reduzida. O que fazer então depende do tipo de pílula, do número de pílulas esquecidas e do ponto da cartela em que o esquecimento ocorre.',
    alertTitle: 'Atenção',
    alertText: 'Não se baseie apenas no número de horas indicado aqui: algumas pílulas têm instruções diferentes. Verifique sempre o folheto informativo do seu medicamento.',
    reflexesTitle: 'Primeiros passos',
    checkPoints: [
      {
        title: 'Reaja rapidamente',
        text: 'Quanto mais depressa reagir após se aperceber do esquecimento, mais fácil será seguir as recomendações adequadas.',
      },
      {
        title: 'Consulte o folheto informativo',
        text: 'As instruções podem variar consoante o tipo exato de pílula e o número de pílulas esquecidas.',
      },
      {
        title: 'Preveja uma proteção complementar',
        text: 'Em algumas situações, pode ser recomendado o uso de preservativo durante um determinado período.',
      },
    ],
    body3: 'Nem todas as situações são iguais. Alguns esquecimentos exigem uma verificação mais rigorosa das recomendações.',
    situations: [
      {
        title: 'Apenas uma pílula esquecida',
        text: 'O que fazer depende sobretudo do tempo decorrido desde a hora habitual da toma.',
      },
      {
        title: 'Mais do que uma pílula esquecida',
        text: 'Esta situação exige uma atenção particular e é preferível consultar o folheto informativo com rigor.',
      },
      {
        title: 'Não sabe o que fazer',
        text: 'Um farmacêutico ou um profissional de saúde pode ajudá-la rapidamente a identificar a conduta adequada.',
      },
    ],
    body4: 'O folheto informativo da sua pílula indica as instruções precisas para o medicamento que toma. As recomendações podem diferir consoante se trate de uma pílula combinada ou de uma pílula só com progestagénio.',
    referenceTitle: 'O que convém verificar',
    referenceTips: [
      'Tenha o folheto informativo à mão (por exemplo, uma fotografia no telemóvel)',
      'Contacte um farmacêutico se tiver uma dúvida rápida',
      'Consulte um médico se acontecer com frequência',
    ],
    guideTitle: 'Porque é importante o momento do esquecimento?',
    guideText: 'O ponto da cartela em que ocorre o esquecimento pode alterar o que deve fazer. É por isso que o folheto informativo indica, muitas vezes, recomendações diferentes consoante a semana da cartela.',
    body5: 'Se não sabe o que fazer, é preferível pedir aconselhamento a ficar na dúvida. Um farmacêutico, uma parteira ou um médico podem ajudá-la a verificar as recomendações adequadas à sua situação.',
    questionTitle: 'Informações a ter à mão',
    questions: [
      'Qual é o tipo exato de pílula?',
      'Quanto tempo passou desde a hora habitual?',
      'Quantas pílulas foram esquecidas?',
      'Em que ponto da cartela ocorreu o esquecimento?',
      'Houve relações sexuais sem proteção recentemente?',
    ],
    proTipTitle: 'Bom saber',
    proTipText: 'Se ocorreram relações sexuais sem proteção por volta do momento do esquecimento, peça rapidamente aconselhamento a um profissional para saber que opções existem.',
    repeatTitle: 'Se se esquece com frequência',
    body6: 'Os esquecimentos frequentes podem indicar que a rotina diária não se adapta bem ao seu estilo de vida. Não hesite em falar com um profissional de saúde para explorar outras opções contracetivas.',
    methodTipTitle: 'Outro método?',
    methodTipText: 'Se tomar uma pílula todos os dias é difícil de manter, existem outros métodos com uma frequência de utilização diferente.',
    summaryTitle: 'O essencial',
    summaryItems: [
      'Reaja logo que se aperceba do esquecimento.',
      'Verifique o tipo exato da sua pílula.',
      'Consulte o folheto informativo para saber a conduta precisa.',
      'Use proteção complementar se o folheto informativo a recomendar.',
      'Peça aconselhamento em caso de dúvida ou após uma relação de risco.',
    ],
    finalTipTitle: 'Pontos essenciais',
    finalTipText: 'Um esquecimento da pílula não significa automaticamente que a sua contraceção deixou de funcionar. A conduta adequada depende do tipo de pílula e das circunstâncias do esquecimento. Em caso de dúvida, consulte o folheto informativo e peça aconselhamento rapidamente.',
    disclaimerText: 'Este artigo é fornecido apenas a título informativo e não substitui o folheto informativo do seu medicamento nem aconselhamento médico personalizado. As recomendações podem variar consoante o tipo de pílula.',
  },
  bn: {
    shareMessage: 'বড়ি বাদ পড়লে: কী করবেন? — AWA',
    badge: 'বাদ পড়া বড়ি',
    title: 'বড়ি বাদ পড়লে:\nকী করবেন?',
    metaDuration: 'পড়তে 7 মিনিট',
    metaType: 'প্রশ্নোত্তর',
    metaLevel: 'মধ্যম স্তর',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'যেকোনো নারীর ক্ষেত্রেই বড়ি বাদ পড়তে পারে। কী করবেন তা মূলত নির্ভর করে কতক্ষণ আগে বাদ পড়েছে, বড়ির ধরন এবং প্যাকের কোন অংশে এটি ঘটেছে তার ওপর।',
    importantTitle: 'মূল বিষয়',
    importantText: 'ঘাবড়াবেন না। প্রথমে আপনার বড়ির সঠিক ধরন দেখে নিন এবং কী করা উচিত তা জানতে এর সঙ্গের তথ্যপত্র (প্যাকেজ ইনসার্ট) দেখুন।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      '12 ঘণ্টার কম দেরি',
      '12 ঘণ্টার বেশি দেরি',
      'বাড়তি মনোযোগ প্রয়োজন এমন পরিস্থিতি',
      'প্যাকেজ ইনসার্টই আপনার নির্ভরযোগ্য সূত্র',
      'কখন পরামর্শ নেবেন',
      'মূল কথা',
    ],
    body1: 'কিছু বড়ির ক্ষেত্রে 12 ঘণ্টার কম দেরি সাধারণত গর্ভনিরোধী সুরক্ষা ক্ষুণ্ণ করে না। এই ক্ষেত্রে সাধারণ পরামর্শ হলো বাদ পড়া বড়িটি যত তাড়াতাড়ি সম্ভব খেয়ে নেওয়া এবং তারপর প্যাকের বাকি বড়ি স্বাভাবিক সময়ে খেয়ে যাওয়া।',
    step1Title: 'বড়িটি খান',
    step1Text: 'দেরি হয়েছে বুঝতে পারা মাত্র বড়িটি খেয়ে নিন।',
    step2Title: 'স্বাভাবিকভাবে চালিয়ে যান',
    step2Text: 'তারপর পরবর্তী বড়িগুলোর জন্য আপনার স্বাভাবিক সময়সূচিতে ফিরে যান।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'বাদ পড়া বড়িটি খেয়ে তারপর স্বাভাবিক সময়ের বড়িটি খেলে একই দিনে দুটি বড়ি খাওয়া হয়ে যেতে পারে।',
    body2: 'আপনার বড়ির জন্য অনুমোদিত সময় পেরিয়ে গেলে সুরক্ষা কমে যেতে পারে। তখন কী করবেন তা নির্ভর করে বড়ির ধরন, কতগুলো বড়ি বাদ পড়েছে এবং প্যাকের কোন অংশে বাদ পড়েছে তার ওপর।',
    alertTitle: 'সতর্কতা',
    alertText: 'এখানে দেওয়া ঘণ্টার সংখ্যার ওপরই শুধু নির্ভর করবেন না: কিছু বড়ির নির্দেশনা ভিন্ন। সবসময় আপনার ওষুধের প্যাকেজ ইনসার্ট দেখে নিন।',
    reflexesTitle: 'প্রথমে যা করবেন',
    checkPoints: [
      {
        title: 'দ্রুত পদক্ষেপ নিন',
        text: 'বড়ি বাদ পড়েছে বুঝতে পারার পর যত দ্রুত পদক্ষেপ নেবেন, উপযুক্ত পরামর্শ অনুসরণ করা তত সহজ হবে।',
      },
      {
        title: 'প্যাকেজ ইনসার্ট দেখুন',
        text: 'বড়ির সঠিক ধরন এবং কতগুলো বড়ি বাদ পড়েছে তার ওপর নির্দেশনা ভিন্ন হতে পারে।',
      },
      {
        title: 'অতিরিক্ত সুরক্ষার পরিকল্পনা করুন',
        text: 'কিছু পরিস্থিতিতে নির্দিষ্ট সময়ের জন্য কনডম ব্যবহারের পরামর্শ দেওয়া হতে পারে।',
      },
    ],
    body3: 'সব পরিস্থিতি এক রকম নয়। কিছু ক্ষেত্রে বড়ি বাদ পড়লে পরামর্শগুলো আরও নির্দিষ্টভাবে যাচাই করা প্রয়োজন।',
    situations: [
      {
        title: 'মাত্র একটি বড়ি বাদ পড়েছে',
        text: 'কী করবেন তা মূলত নির্ভর করে খাওয়ার স্বাভাবিক সময়ের পর কতক্ষণ পেরিয়েছে তার ওপর।',
      },
      {
        title: 'একাধিক বড়ি বাদ পড়েছে',
        text: 'এই পরিস্থিতিতে বিশেষ মনোযোগ প্রয়োজন, এবং প্যাকেজ ইনসার্ট সুনির্দিষ্টভাবে দেখে নেওয়াই ভালো।',
      },
      {
        title: 'কী করবেন নিশ্চিত নন',
        text: 'একজন ফার্মাসিস্ট বা স্বাস্থ্যসেবা পেশাজীবী আপনাকে দ্রুত সঠিক পদক্ষেপ শনাক্ত করতে সাহায্য করতে পারেন।',
      },
    ],
    body4: 'আপনার বড়ির প্যাকেজ ইনসার্টে আপনি যে ওষুধ খাচ্ছেন তার সুনির্দিষ্ট নির্দেশনা দেওয়া থাকে। এটি সম্মিলিত বড়ি নাকি শুধু প্রোজেস্টিনযুক্ত বড়ি, তার ওপর ভিত্তি করে পরামর্শ ভিন্ন হতে পারে।',
    referenceTitle: 'যা দেখে নেওয়া উপযোগী',
    referenceTips: [
      'প্যাকেজ ইনসার্ট হাতের কাছে রাখুন (যেমন ফোনে একটি ছবি)',
      'দ্রুত কোনো প্রশ্ন থাকলে একজন ফার্মাসিস্টের সঙ্গে যোগাযোগ করুন',
      'প্রায়ই এমন হলে ডাক্তার দেখান',
    ],
    guideTitle: 'বড়ি বাদ পড়ার সময় কেন গুরুত্বপূর্ণ?',
    guideText: 'প্যাকের কোন অংশে বড়ি বাদ পড়েছে, তা কী করবেন সেটি বদলে দিতে পারে। এ কারণেই প্যাকেজ ইনসার্টে প্রায়ই প্যাকের সপ্তাহ অনুযায়ী ভিন্ন ভিন্ন পরামর্শ দেওয়া থাকে।',
    body5: 'কী করবেন না জানলে সন্দেহে থাকার চেয়ে পরামর্শ চাওয়াই ভালো। একজন ফার্মাসিস্ট, ধাত্রী বা ডাক্তার আপনার পরিস্থিতির উপযোগী পরামর্শ যাচাই করতে সাহায্য করতে পারেন।',
    questionTitle: 'যে তথ্য হাতে রাখবেন',
    questions: [
      'এটি ঠিক কোন ধরনের বড়ি?',
      'স্বাভাবিক সময়ের পর কতক্ষণ পেরিয়েছে?',
      'কতগুলো বড়ি বাদ পড়েছে?',
      'প্যাকের কোন পর্যায়ে বড়ি বাদ পড়েছে?',
      'সম্প্রতি কি অরক্ষিত যৌনমিলন হয়েছে?',
    ],
    proTipTitle: 'জেনে রাখা ভালো',
    proTipText: 'বড়ি বাদ পড়ার সময়ের কাছাকাছি অরক্ষিত যৌনমিলন হলে কী কী বিকল্প আছে তা জানতে দ্রুত একজন পেশাজীবীর পরামর্শ নিন।',
    repeatTitle: 'বারবার বড়ি বাদ পড়লে',
    body6: 'ঘন ঘন বড়ি বাদ পড়া এই লক্ষণ হতে পারে যে দৈনন্দিন রুটিন আপনার জীবনযাত্রার সঙ্গে পুরোপুরি মানাচ্ছে না। অন্যান্য জন্মনিয়ন্ত্রণ পদ্ধতি খতিয়ে দেখতে স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে কথা বলতে দ্বিধা করবেন না।',
    methodTipTitle: 'অন্য কোনো পদ্ধতি?',
    methodTipText: 'প্রতিদিন বড়ি খাওয়া ধরে রাখা কঠিন হলে ভিন্ন ব্যবহারের ধরনের অন্যান্য পদ্ধতিও আছে।',
    summaryTitle: 'সারকথা',
    summaryItems: [
      'বড়ি বাদ পড়েছে বুঝতে পারা মাত্র পদক্ষেপ নিন।',
      'আপনার বড়ির সঠিক ধরন দেখে নিন।',
      'সুনির্দিষ্ট করণীয় জানতে প্যাকেজ ইনসার্ট দেখুন।',
      'প্যাকেজ ইনসার্টে পরামর্শ দেওয়া থাকলে অতিরিক্ত সুরক্ষা ব্যবহার করুন।',
      'সন্দেহ থাকলে বা ঝুঁকিপূর্ণ মিলনের পর পরামর্শ নিন।',
    ],
    finalTipTitle: 'মূল কথা',
    finalTipText: 'বড়ি বাদ পড়লেই যে আপনার জন্মনিয়ন্ত্রণ কাজ করা বন্ধ করে দিয়েছে, এমন নয়। সঠিক করণীয় নির্ভর করে বড়ির ধরন এবং বাদ পড়ার পরিস্থিতির ওপর। সন্দেহ থাকলে প্যাকেজ ইনসার্ট দেখুন এবং দ্রুত পরামর্শ নিন।',
    disclaimerText: 'এই নিবন্ধ শুধু তথ্যের উদ্দেশ্যে দেওয়া হয়েছে এবং এটি আপনার ওষুধের প্যাকেজ ইনসার্ট বা ব্যক্তিগত চিকিৎসা পরামর্শের বিকল্প নয়। বড়ির ধরন অনুযায়ী পরামর্শ ভিন্ন হতে পারে।',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function MissedPillsArticleScreen({
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

        {/* ARTICLE */}

        <View style={styles.article}>
          {/* CATEGORY */}

          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">{content.badge}</AwaText>
          </View>

          {/* TITLE */}

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

          {/* METADATA */}

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

          {/* INTRO */}

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.intro}>
            {content.intro}
          </AwaText>

          {/* IMPORTANT */}

          <AwaCard variant="filled" padding="none" style={styles.importantCard}>
            <View style={styles.importantIcon}>
              <MaterialDesignIcons
                name="information-outline"
                size={23}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.importantCopy}>
              <AwaText variant="titleSmall" emphasized>{content.importantTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.importantText}>
                {content.importantText}
              </AwaText>
            </View>
          </AwaCard>

          {/* TABLE OF CONTENTS */}

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

          {/* SECTION 1 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.topics[0]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body1}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <AwaText variant="titleSmall" emphasized colorRole="primary">1</AwaText>
              </View>

              <AwaText variant="titleSmall" emphasized style={styles.stepTitle}>{content.step1Title}</AwaText>
            </View>

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.stepText}>
              {content.step1Text}
            </AwaText>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <AwaText variant="titleSmall" emphasized colorRole="primary">2</AwaText>
              </View>

              <AwaText variant="titleSmall" emphasized style={styles.stepTitle}>{content.step2Title}</AwaText>
            </View>

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.stepText}>
              {content.step2Text}
            </AwaText>
          </AwaCard>

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

          {/* SECTION 2 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={25}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alertTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.alertText}
              </AwaText>
            </View>
          </AwaCard>

          {/* QUICK GUIDE */}

          <AwaText variant="titleMedium" emphasized style={styles.h3}>{content.reflexesTitle}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.checkPoints.map((item, index) => (
              <View key={item.title} style={styles.checkRow}>
                <View style={styles.checkIcon}>
                  <MaterialDesignIcons
                    name={CHECK_ICONS[index] as never}
                    size={18}
                    color={theme.colors.success}
                  />
                </View>

                <View style={styles.checkCopy}>
                  <AwaText variant="titleSmall" emphasized>{item.title}</AwaText>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>{item.text}</AwaText>
                </View>
              </View>
            ))}
          </AwaCard>

          {/* SECTION 3 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            3. {content.topics[2]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body3}
          </AwaText>

          <View style={styles.situationList}>
            {content.situations.map((item, index) => (
              <AwaCard variant="filled" padding="none" key={item.title} style={styles.situationCard}>
                <View style={styles.situationIcon}>
                  <MaterialDesignIcons
                    name={SITUATION_ICONS[index] as never}
                    size={21}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.situationCopy}>
                  <AwaText variant="titleSmall" emphasized>{item.title}</AwaText>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.situationText}>{item.text}</AwaText>
                </View>
              </AwaCard>
            ))}
          </View>

          {/* SECTION 4 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body4}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.referenceCard}>
            <View style={styles.referenceHeader}>
              <MaterialDesignIcons
                name="file-document-check-outline"
                size={23}
                color={theme.colors.primary}
              />

              <AwaText variant="titleSmall" emphasized>
                {content.referenceTitle}
              </AwaText>
            </View>

            {content.referenceTips.map((item, index) => (
              <View key={item} style={styles.referenceRow}>
                <View style={styles.referenceNumber}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary">
                    {index + 1}
                  </AwaText>
                </View>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.referenceText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* MINI GUIDE */}

          <AwaCard variant="filled" padding="none" style={styles.guideCard}>
            <View style={styles.guideHeader}>
              <MaterialDesignIcons
                name="compass-outline"
                size={23}
                color={theme.colors.primary}
              />

              <AwaText variant="titleSmall" emphasized style={styles.guideTitle}>
                {content.guideTitle}
              </AwaText>
            </View>

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.guideText}>
              {content.guideText}
            </AwaText>
          </AwaCard>

          {/* SECTION 5 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body5}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <MaterialDesignIcons
                name="message-question-outline"
                size={23}
                color={theme.colors.primary}
              />

              <AwaText variant="titleSmall" emphasized>
                {content.questionTitle}
              </AwaText>
            </View>

            {content.questions.map((item, index) => (
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
              <AwaText variant="titleSmall" emphasized>{content.proTipTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.proTipText}
              </AwaText>
            </View>
          </AwaCard>

          {/* REPEATED FORGETTING */}

          <AwaText variant="titleMedium" emphasized style={styles.h3}>{content.repeatTitle}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body6}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="calendar-sync-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.methodTipTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.methodTipText}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 6 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>6. {content.topics[5]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={25}
                color={theme.colors.primary}
              />

              <AwaText variant="titleSmall" emphasized>{content.summaryTitle}</AwaText>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
                {content.summaryItems[0]}
              </AwaText>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
                {content.summaryItems[1]}
              </AwaText>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
                {content.summaryItems[2]}
              </AwaText>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
                {content.summaryItems[3]}
              </AwaText>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
                {content.summaryItems[4]}
              </AwaText>
            </View>
          </AwaCard>

          {/* FINAL MESSAGE */}

          <AwaCard variant="filled" padding="none" style={styles.finalTip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.finalTipTitle}</AwaText>

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

  importantCard: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  importantIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  importantCopy: {
    flex: 1,
    marginLeft: 12,
  },


  importantText: {
    marginTop: 4,
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

  stepCard: {
    marginTop: 12,
    padding: 16,
  },

  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },


  stepTitle: {
    marginLeft: 12,
  },

  stepText: {
    marginTop: 8,
    marginLeft: 40,
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

  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  checkList: {
    marginTop: 16,
    padding: 12,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  checkIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.success, 0.12),
  },

  checkCopy: {
    flex: 1,
    marginLeft: 12,
  },


  checkText: {
    marginTop: 3,
  },

  situationList: {
    marginTop: 16,
    gap: 12,
  },

  situationCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  situationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  situationCopy: {
    flex: 1,
    marginLeft: 12,
  },


  situationText: {
    marginTop: 4,
  },

  referenceCard: {
    marginTop: 16,
    padding: 16,
  },

  referenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },


  referenceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  referenceNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },


  referenceText: {
    flex: 1,
    marginLeft: 8,
    paddingTop: 2,
  },

  guideCard: {
    marginTop: 16,
    padding: 16,
  },

  guideHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  guideTitle: {
    flex: 1,
  },

  guideText: {
    marginTop: 8,
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
